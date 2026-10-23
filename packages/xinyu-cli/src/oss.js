import { createHmac } from 'node:crypto';
import { extname } from 'node:path';
import { CliError, EXIT } from './errors.js';

// 与 web 端保持一致：图片落在 eden-app 这个 bucket，区域为华东1（杭州）
const OSS_REGION = 'oss-cn-shanghai';
const OSS_BUCKET = 'eden-app';

// 对应接口的 file_type 枚举
export const FILE_TYPE = { IMAGE: 1, VIDEO: 2, AUDIO: 3 };

// web 端 beforeUpload 的 5MB 限制
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
