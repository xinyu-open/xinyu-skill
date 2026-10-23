import { optionalInt } from '../flags.js';
import { printJson, printKV } from '../output.js';

export const user = {
  async info(ctx) {
    const userId = optionalInt(ctx.flags, 'user-id');
    const body = await ctx.client.request('GET', '/user/info', {
      query: userId ? { user_id: userId } : undefined,
    });
    const info = body.user_info || {};
    if (ctx.json) return printJson(body);
    printKV([
      ['用户 ID', info.user_id || '-'],
      ['昵称', info.nickname || info.user_name || '-'],
      ['新语号', info.xinyu_id || '-'],
      ['简介', info.intro || info.description || '-'],
      ['头像', info.avatar_url || info.avatar_url_v2 || '-'],
    ]);
  },
};
