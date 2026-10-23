import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { CliError, EXIT, fromEnvelope, usageError } from './errors.js';

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

  async uploadImage(filePath) {
    if (!this.token) throw new CliError('上传图片需要登录，请先执行 xinyu-cli auth login', EXIT.AUTH);
    let buffer;
    try {
      buffer = await readFile(filePath);
    } catch (err) {
      throw usageError(`读取图片失败：${err.message}`);
    }
    const form = new FormData();
    form.append('file', new Blob([buffer]), basename(filePath));

    let res;
    try {
      res = await fetch(this.url('/upload/image'), {
        method: 'POST',
        headers: { [ACCESS_TOKEN_COOKIE]: this.token },
        body: form,
      });
    } catch (err) {
      throw new CliError(`上传失败：${err.message}`, EXIT.USAGE);
    }
    this.captureTokens(res);
    const text = await res.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      throw new CliError(`上传接口返回非 JSON（HTTP ${res.status}）`, EXIT.USAGE);
    }
    if (typeof payload.status_code === 'number' && payload.status_code !== 0) {
      throw fromEnvelope(payload);
    }
    const uri = payload?.url?.uri;
    if (!uri) throw new CliError('上传成功但未返回图片 uri', EXIT.BIZ);
    return { uri, url: payload?.url?.url_list?.[0] };
  }
}
