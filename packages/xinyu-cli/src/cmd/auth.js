import { login } from '../auth.js';
import { clearConfig, configFile, readConfig } from '../config.js';
import { EXIT } from '../errors.js';
import { optionalInt } from '../flags.js';
import { resolveBaseUrl } from '../http.js';
import { printJson, printKV } from '../output.js';

export const auth = {
  async login(ctx) {
    const baseUrl = resolveBaseUrl(ctx.flags, ctx.config);
    return login({
      baseUrl,
      timeoutSeconds: optionalInt(ctx.flags, 'timeout'),
      noQr: !!ctx.flags['no-qr'],
    });
  },

  async status(ctx) {
    const config = readConfig();
    const token = process.env.XINYU_TOKEN || config.access_token;
    if (!token) {
      if (ctx.json) return printJson({ logged_in: false, config_file: configFile() });
      process.stdout.write('未登录，请执行 xinyu-cli auth login\n');
      return EXIT.AUTH;
    }

    let info = {};
    let valid = true;
    try {
      const body = await ctx.client.request('GET', '/user/info');
      info = body.user_info || {};
    } catch (err) {
      valid = false;
      if (err.exitCode !== EXIT.AUTH) throw err;
    }

    const payload = {
      logged_in: valid,
      user_id: info.user_id || config.user_id,
      nickname: info.nickname || config.nickname,
      base_url: resolveBaseUrl(ctx.flags, config),
      config_file: configFile(),
    };
    if (ctx.json) return printJson(payload);
    printKV([
      ['登录状态', valid ? '有效' : '已失效，请重新登录'],
      ['用户 ID', payload.user_id || '-'],
      ['昵称', payload.nickname || '-'],
      ['接口地址', payload.base_url],
      ['配置文件', payload.config_file],
    ]);
    return valid ? EXIT.OK : EXIT.AUTH;
  },

  async logout(ctx) {
    clearConfig();
    if (ctx.json) return printJson({ logged_in: false });
    process.stdout.write(`✓ 已清除本地凭据（${configFile()}）\n`);
  },
};
