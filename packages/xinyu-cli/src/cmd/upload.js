import { requiredStr } from '../flags.js';
import { printJson } from '../output.js';

export const upload = {
  // 上传图片，返回的 uri 可直接用于 --pics
  async image(ctx) {
    const file = requiredStr(ctx.flags, 'file');
    const result = await ctx.client.uploadImage(file);
    if (ctx.json) return printJson(result);
    process.stdout.write(`${result.uri}\n`);
    if (result.url) process.stdout.write(`图片地址：${result.url}\n`);
  },
};
