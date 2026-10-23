import { configFile, readConfig } from '../config.js';
import { EXIT } from '../errors.js';
import { resolveBaseUrl } from '../http.js';
import { printJson } from '../output.js';

export const doctor = {
  async run(ctx) {
    const config = readConfig();
    const checks = [];

    const major = Number(process.versions.node.split('.')[0]);
    checks.push({
      name: 'Node.js 版本',
      ok: major >= 18,
      detail: process.version,
    });

    const baseUrl = resolveBaseUrl(ctx.flags, config);
    checks.push({
      name: '接口地址',
      ok: /^https?:\/\//.test(baseUrl),
      detail: baseUrl,
    });

    const token = process.env.XINYU_TOKEN || config.access_token;
    checks.push({
      name: '本地凭据',
      ok: Boolean(token),
      detail: token ? configFile() : '未登录，请执行 xinyu-cli auth login',
    });

    if (token) {
      try {
        const body = await ctx.client.request('GET', '/user/info');
        const info = body.user_info || {};
        checks.push({
          name: '登录态校验',
          ok: true,
          detail: `${info.nickname || info.user_name || '-'}（${info.user_id || '-'}）`,
        });
      } catch (err) {
        checks.push({ name: '登录态校验', ok: false, detail: err.message });
      }
    }

    if (ctx.json) return printJson(checks);
    for (const check of checks) {
      process.stdout.write(`${check.ok ? '✓' : '✗'} ${check.name}：${check.detail}\n`);
    }
    return checks.every((check) => check.ok) ? EXIT.OK : EXIT.AUTH;
  },
};
