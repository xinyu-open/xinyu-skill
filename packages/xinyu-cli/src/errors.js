export const EXIT = {
  OK: 0,
  USAGE: 1,
  BIZ: 2,
  PERMISSION: 3,
  AUTH: 4,
};

// 认证相关（未登录 / token 失效）
const AUTH_CODES = new Set([1001, 1003, 1006]);
// 权限相关（无权限 / 非圈子成员 / 无管理权限 / 无权查看该问题）
const PERMISSION_CODES = new Set([112, 2430, 2431, 2463]);

export class CliError extends Error {
  constructor(message, exitCode = EXIT.BIZ, code) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
    this.code = code;
  }
}

export function usageError(message) {
  return new CliError(message, EXIT.USAGE);
}

export function permissionError(message) {
  return new CliError(message, EXIT.PERMISSION);
}

// 将接口信封 {status_code, status_msg} 转成带退出码的错误
export function fromEnvelope(body) {
  const code = typeof body?.status_code === 'number' ? body.status_code : -1;
  const msg = body?.status_msg || '接口返回失败';
  let exitCode = EXIT.BIZ;
  let hint = '';
  if (AUTH_CODES.has(code)) {
    exitCode = EXIT.AUTH;
    hint = '，请先执行 xinyu-cli auth login';
  } else if (PERMISSION_CODES.has(code)) {
    exitCode = EXIT.PERMISSION;
  }
  return new CliError(`${msg} [code ${code}]${hint}`, exitCode, code);
}
