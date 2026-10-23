import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { CliError, EXIT, usageError } from './errors.js';

// 与 web 端保持一致：图片落在 eden-app 这个 bucket，区域为华东1（杭州）
const OSS_REGION = 'oss-cn-shanghai';
const OSS_BUCKET = 'eden-app';

// 对应接口的 file_type 枚举
export const FILE_TYPE = { IMAGE: 1, VIDEO: 2, AUDIO: 3 };

// web 端 beforeUpload 的 5MB 限制
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const DOWNLOAD_TIMEOUT_MS = 30_000;

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.heic': 'image/heic',
};

// 服务端按 file_name 的扩展名生成 signed_url，因此扩展名必须与实际字节内容一致
export function imageMeta(filePath) {
  const ext = extname(filePath).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) {
    const shown = ext || '(无扩展名)';
    throw new CliError(`不支持的图片格式 ${shown}，支持 ${Object.keys(MIME_BY_EXT).join(' / ')}`, EXIT.USAGE);
  }
  return { ext, mime };
}

function extFromMime(mime) {
  return Object.keys(MIME_BY_EXT).find((ext) => MIME_BY_EXT[ext] === mime);
}

function extFromUrl(url) {
  try {
    const ext = extname(new URL(url).pathname).toLowerCase();
    return MIME_BY_EXT[ext] ? ext : undefined;
  } catch {
    return undefined;
  }
}

function assertSize(bytes) {
  if (bytes > MAX_IMAGE_BYTES) {
    const mb = (bytes / 1024 / 1024).toFixed(1);
    throw new CliError(`图片大小 ${mb}MB，超过 5MB 限制`, EXIT.USAGE);
  }
}

async function readLocalImage(filePath) {
  const { ext, mime } = imageMeta(filePath);
  try {
    return { buffer: await readFile(filePath), ext, mime };
  } catch (err) {
    throw usageError(`读取图片失败：${err.message}`);
  }
}

async function downloadImage(url) {
  let res;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'xinyu-cli' },
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    });
  } catch (err) {
    throw new CliError(`下载图片失败：${err.message}`, EXIT.USAGE);
  }
  if (!res.ok) {
    throw new CliError(`下载图片失败（HTTP ${res.status}）`, EXIT.USAGE);
  }
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > 0) assertSize(declared);

  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  // 优先用 URL 后缀判断（CDN 常返回 application/octet-stream），再退回 content-type
  const ext = extFromUrl(url) || extFromMime(contentType);
  if (!ext) {
    const hint = contentType || '未知';
    throw new CliError(`无法识别远程图片格式（content-type: ${hint}），请先下载到本地再用 --file`, EXIT.USAGE);
  }
  return { buffer, ext, mime: MIME_BY_EXT[ext] };
}

// 统一入口：本地文件或远端 URL，返回待上传的字节与格式
export async function readImageSource({ file, url }) {
  const source = url ? await downloadImage(url) : await readLocalImage(file);
  assertSize(source.buffer.byteLength);
  return source;
}

// OSS V1 签名直传（PUT Object），避免引入 ali-oss 依赖
export async function putObject({ key, body, mime, credential }) {
  const date = new Date().toUTCString();
  // x-oss-* 头需小写、按字典序拼接，并参与签名
  const canonicalizedOSSHeaders = `x-oss-security-token:${credential.security_token}\n`;
  const stringToSign = `PUT\n\n${mime}\n${date}\n${canonicalizedOSSHeaders}/${OSS_BUCKET}/${key}`;
  const signature = createHmac('sha1', credential.access_key_secret).update(stringToSign).digest('base64');

  const endpoint = `https://${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com/${encodeURI(key)}`;
  let res;
  try {
    res = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        Date: date,
        'Content-Type': mime,
        'x-oss-security-token': credential.security_token,
        Authorization: `OSS ${credential.access_key_id}:${signature}`,
      },
      body,
    });
  } catch (err) {
    throw new CliError(`上传到 OSS 失败：${err.message}`, EXIT.USAGE);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new CliError(`上传到 OSS 失败（HTTP ${res.status}）：${text.slice(0, 200)}`, EXIT.USAGE);
  }
}
