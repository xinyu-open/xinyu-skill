import { createRequire } from 'node:module';
import { deflateSync } from 'node:zlib';

// qrcode-terminal 只会在终端里画字符二维码，但它内置的 QRCode 编码器暴露了模块矩阵，
// 这里直接复用，避免再引一个二维码依赖。
const require = createRequire(import.meta.url);
const QRCode = require('qrcode-terminal/vendor/QRCode');
const QRErrorCorrectLevel = require('qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel');

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/**
 * 把文本编码成二维码 PNG（8 位灰度，纯 Node 实现，不依赖图形库）。
 * @param {string} text 二维码内容
 * @param {{scale?: number, margin?: number}} [opts] scale 是每个模块的像素数，margin 是四周静区模块数
 * @returns {Buffer} PNG 文件内容
 */
export function qrPng(text, { scale = 8, margin = 4 } = {}) {
  const qr = new QRCode(-1, QRErrorCorrectLevel.M);
  qr.addData(text);
  qr.make();

  const count = qr.getModuleCount();
  const size = (count + margin * 2) * scale;
  const stride = size + 1; // 每行多一个 filter 字节
  const raw = Buffer.alloc(stride * size, 0xff);
  for (let y = 0; y < size; y += 1) {
    raw[y * stride] = 0; // filter type 0（None）
  }

  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.isDark(row, col)) continue;
      const x = (col + margin) * scale;
      for (let dy = 0; dy < scale; dy += 1) {
        const y = (row + margin) * scale + dy;
        const start = y * stride + 1 + x;
        raw.fill(0x00, start, start + scale);
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // color type: grayscale
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}
