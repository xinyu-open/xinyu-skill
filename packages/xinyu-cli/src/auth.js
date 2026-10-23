import { writeFileSync } from 'node:fs';
import qrcode from 'qrcode-terminal';
import { CliError, EXIT, usageError } from './errors.js';
import { writeConfig } from './config.js';
import { qrPng } from './qr-png.js';
import {
  ACCESS_TOKEN_COOKIE,
  Client,
  REFRESH_TOKEN_COOKIE,
  cookieValue,
  getSetCookies,
} from './http.js';

const NONCE_COOKIE = 'mini_web_login_nonce';
const POLL_INTERVAL_MS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 扫码登录：复用服务端 mini-web-login 设备流。
 * 1) start 拿到 url_link + transaction_id，并保存 nonce cookie
 * 2) 终端渲染二维码，用户用微信扫码在小程序内确认
 * 3) 轮询 status，APPROVED 后 complete 换取 token（服务端通过 Set-Cookie 下发）
 */
function writeQrPng(path, text) {
  try {
    writeFileSync(path, qrPng(text));
  } catch (err) {
    throw usageError(`写入二维码图片失败：${err.message}`);
  }
}

export async function login({ baseUrl, timeoutSeconds, noQr, qrPngPath }) {
  const client = new Client({ baseUrl });

  const started = await client.requestRaw('POST', '/auth/mini-web-login/start', {
    body: { client: 'cli', return_path: '/' },
  });
  const transactionId = started.body?.transaction_id;
  const urlLink = started.body?.url_link;
  const expiresIn = Number(started.body?.expires_in) > 0 ? Number(started.body.expires_in) : 300;
  if (!transactionId || !urlLink) {
    throw new CliError('发起扫码登录失败：未返回 transaction_id 或 url_link', EXIT.BIZ);
  }

  const nonce = cookieValue(getSetCookies(started.res), NONCE_COOKIE);
  if (!nonce) {
    throw new CliError('发起扫码登录失败：服务端未下发 nonce cookie', EXIT.BIZ);
  }
  const cookie = `${NONCE_COOKIE}=${nonce}`;

  // 真终端里照旧画字符二维码；--qr-png 落一张图片，给聊天窗口这类渲染不了字符二维码的场景用。
  // 输出被重定向（管道/日志/Agent 抓取）时不画字符二维码：半块字符依赖等宽字体与相称行高，
  // 被抓去贴进聊天窗口必然错行、扫不出来。
  const minutes = Math.floor(expiresIn / 60) || 1;
  const showQr = !noQr && !qrPngPath && Boolean(process.stdout.isTTY);
  if (qrPngPath) {
    writeQrPng(qrPngPath, urlLink);
    process.stdout.write('\n二维码已保存为图片，用微信扫描或在微信中打开链接确认登录：\n\n');
    process.stdout.write(`二维码图片：${qrPngPath}\n`);
    process.stdout.write(`登录链接：${urlLink}\n`);
  } else if (showQr) {
    process.stdout.write('\n请用微信扫描下方二维码，在小程序内确认登录：\n\n');
    qrcode.generate(urlLink, { small: true }, (code) => {
      process.stdout.write(`${code}\n`);
    });
    process.stdout.write(`\n或在微信中打开链接：${urlLink}\n`);
  } else {
    process.stdout.write('\n请在微信中打开下面的链接，在小程序内确认登录：\n\n');
    process.stdout.write(`${urlLink}\n`);
    if (!noQr) {
      process.stdout.write('\n（输出不是终端，已跳过二维码，避免渲染错乱无法扫描；可用 --qr-png 生成图片）\n');
    }
  }
  process.stdout.write(`${qrPngPath || showQr ? '二维码' : '链接'} ${minutes} 分钟内有效，等待确认…\n`);

  const deadline = Date.now() + Math.min(expiresIn, timeoutSeconds || expiresIn) * 1000;
  let approved = false;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    let state;
    try {
      const statusRes = await client.requestRaw('GET', '/auth/mini-web-login/status', {
        query: { transaction_id: transactionId },
        cookie,
      });
      state = statusRes.body?.status;
    } catch (err) {
      if (err.code === 102) {
        throw new CliError('二维码已过期，请重新执行 xinyu-cli auth login', EXIT.AUTH);
      }
      throw err;
    }
    if (state === 'APPROVED') {
      approved = true;
      break;
    }
    if (state === 'CANCELLED') {
      throw new CliError('登录已在微信端被取消', EXIT.AUTH);
    }
    if (state === 'CONSUMED') {
      throw new CliError('该二维码已被使用，请重新执行 xinyu-cli auth login', EXIT.AUTH);
    }
  }
  if (!approved) {
    throw new CliError('等待确认超时，请重新执行 xinyu-cli auth login', EXIT.AUTH);
  }

  const completed = await client.requestRaw('POST', '/auth/mini-web-login/complete', {
    body: { transaction_id: transactionId },
    cookie,
  });
  const cookies = getSetCookies(completed.res);
  const accessToken = cookieValue(cookies, ACCESS_TOKEN_COOKIE);
  const refreshToken = cookieValue(cookies, REFRESH_TOKEN_COOKIE);
  if (!accessToken) {
    throw new CliError('确认成功但未取到登录凭证，请重新执行 xinyu-cli auth login', EXIT.AUTH);
  }

  let userInfo = {};
  try {
    const authed = new Client({ baseUrl, token: accessToken, refreshToken });
    const body = await authed.request('GET', '/user/info');
    userInfo = body?.user_info || {};
  } catch {
    // 取用户信息失败不影响登录结果，status 命令会再次校验
  }

  writeConfig({
    base_url: baseUrl,
    access_token: accessToken,
    refresh_token: refreshToken,
    user_id: userInfo.user_id,
    nickname: userInfo.nickname || userInfo.user_name,
  });

  process.stdout.write(`\n✓ 已登录：${userInfo.nickname || userInfo.user_name || '未知用户'}`);
  if (userInfo.user_id) process.stdout.write(`（${userInfo.user_id}）`);
  process.stdout.write('\n');
  return EXIT.OK;
}
