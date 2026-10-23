import { requiredStr, str } from '../flags.js';
import { printJson } from '../output.js';

export const upload = {
  // 上传图片，返回的 uri 可直接用于 --pics
  async image(ctx) {
    const file = requiredStr(ctx.flags, 'file');
    // 目录前缀决定图片用途：post/ 主题、cmt/ 评论、avatar/ 头像、cover/ 封面
    const dir = str(ctx.flags, 'dir') || 'post/';
    const result = await ctx.client.uploadImage(file, { dir });
    if (ctx.json) return printJson(result);
    process.stdout.write(`${result.uri}\n`);
    if (result.url) process.stdout.write(`图片地址：${result.url}\n`);
  },
};
