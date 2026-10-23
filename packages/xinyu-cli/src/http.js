import { readFile } from 'node:fs/promises';
import { CliError, EXIT, fromEnvelope, usageError } from './errors.js';
import { FILE_TYPE, MAX_IMAGE_BYTES, imageMeta, putObject } from './oss.js';

export const DEFAULT_BASE_URL = 'https://xinyu.zone/eden/v1';
export const ACCESS_TOKEN_COOKIE = 'x-jwt-token';
export const REFRESH_TOKEN_COOKIE = 'x-jwt-refresh-token';

export function resolveBaseUrl(flags, config) {
  const value =
    (flags && flags['base-url']) || process.env.XINYU_BASE_URL || config?.base_url || DEFAULT_BASE_URL;
  return String(value).replace(/\/+$/, '');
}

export function getSetCookies(res) {
  if (typeof res.headers.getSetCookie === 'function') return res.headers.getSetCookie();
  const raw = res.headers.get('set-cookie');
  if (!raw) return [];
  // 兼容没有 getSetCookie 的运行时：按 "名称=" 边界切分
  return raw.split(/,(?=\s*[^;,=]+=)/);
}

export function cookieValue(lines, name) {
  for (const line of lines) {
    const pair = line.split(';', 1)[0];
    const index = pair.indexOf('=');
    if (index < 0) continue;
    if (pair.slice(0, index).trim() === name) {
      return pair.slice(index + 1).trim();
    }
  }
  return undefined;
}

export class Client {
  constructor({ baseUrl, token, refreshToken, onTokens }) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.refreshToken = refreshToken;
    this.onTokens = onTokens;
  }

  url(path) {
    if (/^https?:\/\//.test(path)) return path;
    return `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  captureTokens(res) {
    if (!this.onTokens) return;
    const lines = getSetCookies(res);
    const access = cookieValue(lines, ACCESS_TOKEN_COOKIE);
    const refresh = cookieValue(lines, REFRESH_TOKEN_COOKIE);
    // 服务端在 access token 过期时会自动续期并通过 Set-Cookie 下发新 token
    if (access && access !== this.token) {
      this.token = access;
      this.onTokens({ access_token: access, ...(refresh ? { refresh_token: refresh } : {}) });
      return;
    }
    if (refresh && refresh !== this.refreshToken) {
      this.refreshToken = refresh;
      this.onTokens({ refresh_token: refresh });
    }
  }

  async request(method, path, options) {
    const { body } = await this.send(method, path, options);
    return body;
  }

  // 需要读取响应头（如登录换取 token 的 Set-Cookie）时使用
  async requestRaw(method, path, options) {
    return this.send(method, path, options);
  }

  async send(method, path, { query, body, cookie, headers } = {}) {
    const url = new URL(this.url(path));
    for (const [key, value] of Object.entries(query || {})) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }

    const finalHeaders = { Accept: 'application/json', ...(headers || {}) };
    if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
    if (this.token) finalHeaders[ACCESS_TOKEN_COOKIE] = this.token;
    if (this.refreshToken) finalHeaders[REFRESH_TOKEN_COOKIE] = this.refreshToken;
    if (cookie) finalHeaders.Cookie = cookie;

    let res;
    try {
      res = await fetch(url, {
        method,
        headers: finalHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (err) {
      throw new CliError(`请求失败（${url.href}）：${err.message}`, EXIT.USAGE);
    }

    this.captureTokens(res);
    const text = await res.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      throw new CliError(`接口返回非 JSON（HTTP ${res.status}）：${text.slice(0, 200)}`, EXIT.USAGE);
    }
    if (res.status >= 400) {
      throw new CliError(`HTTP ${res.status}：${payload.status_msg || text.slice(0, 200)}`, EXIT.USAGE);
    }
    if (typeof payload.status_code === 'number' && payload.status_code !== 0) {
      throw fromEnvelope(payload);
    }
    return { res, body: payload };
  }

  // 两步式上传：先取 STS 临时凭证，再用签名直传 OSS（替代已废弃的 /upload/image）
  async uploadImage(filePath, { dir = 'post/' } = {}) {
    if (!this.token) throw new CliError('上传图片需要登录，请先执行 xinyu-cli auth login', EXIT.AUTH);
    const { ext, mime } = imageMeta(filePath);

    let buffer;
    try {
      buffer = await readFile(filePath);
    } catch (err) {
      throw usageError(`读取图片失败：${err.message}`);
    }
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      const mb = (buffer.byteLength / 1024 / 1024).toFixed(1);
      throw new CliError(`图片大小 ${mb}MB，超过 5MB 限制`, EXIT.USAGE);
    }

    const prefix = dir.endsWith('/') ? dir : `${dir}/`;
    // file_name 只用于让服务端确定 signed_url 的扩展名，最终对象 key 由 oss_dir + xid 决定
    const sts = await this.request('GET', '/platform/ali_sts/get', {
      query: { file_type: FILE_TYPE.IMAGE, file_name: `image${ext}`, oss_dir: prefix },
    });
    if (!sts?.xid || !sts?.credential?.security_token) {
      throw new CliError('获取 OSS 上传凭证失败', EXIT.BIZ);
    }

    const uri = `${prefix}${sts.xid}${ext}`;
    await putObject({ key: uri, body: buffer, mime, credential: sts.credential });
    return { uri, url: sts.signed_url };
  }
}
