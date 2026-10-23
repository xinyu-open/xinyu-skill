import { usageError } from '../errors.js';
import { requiredStr, str } from '../flags.js';
import { printJson } from '../output.js';

function parseJsonFlag(flags, key) {
  const raw = str(flags, key);
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw usageError(`--${key} 不是合法 JSON：${err.message}`);
  }
}

export const api = {
  // 直接调用任意接口，作为探索模式与未封装能力的兜底
  async raw(ctx) {
    const method = (str(ctx.flags, 'method') || 'GET').toUpperCase();
    const path = requiredStr(ctx.flags, 'path');
    const query = parseJsonFlag(ctx.flags, 'query');
    const body = parseJsonFlag(ctx.flags, 'body');
    const result = await ctx.client.request(method, path, { query, body });
    printJson(result);
  },
};
