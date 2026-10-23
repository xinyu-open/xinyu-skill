import { usageError } from '../errors.js';
import { str } from '../flags.js';
import { printJson } from '../output.js';

export const upload = {
  // 上传图片，返回的 uri 可直接用于 --pics
  async image(ctx) {
    const file = str(ctx.flags, 'file');
    const url = str(ctx.flags, 'url');
    if (!file && !url) throw usageError('需要 --file <本地路径> 或 --url <图片地址>');
    if (file && url) throw usageError('--file 与 --url 只能二选一');
    // 目录前缀决定图片用途：post/ 主题、cmt/ 评论、avatar/ 头像、cover/ 封面
    const dir = str(ctx.flags, 'dir') || 'post/';
    const result = await ctx.client.uploadImage({ file, url }, { dir });
    if (ctx.json) return printJson(result);
    process.stdout.write(`${result.uri}\n`);
    if (result.url) process.stdout.write(`图片地址：${result.url}\n`);
  },
};
