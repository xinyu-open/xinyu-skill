import { usageError } from './errors.js';

// 极简参数解析：支持 --key value、--key=value、--flag、--no-flag、-y
export function parseFlags(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('-')) {
      positional.push(arg);
      continue;
    }
    if (arg === '-y' || arg === '-h' || arg === '-v') {
      const short = { '-y': 'yes', '-h': 'help', '-v': 'version' };
      flags[short[arg]] = true;
      continue;
    }
    if (arg.startsWith('--no-')) {
      flags[arg.slice(5)] = false;
      continue;
    }
    const eq = arg.indexOf('=');
    if (eq > -1) {
      flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      flags[key] = true;
    } else {
      flags[key] = next;
      i += 1;
    }
  }
  return { positional, flags };
}

export function str(flags, key, fallback = undefined) {
  const value = flags[key];
  if (value === undefined || value === true || value === false) return fallback;
  return String(value).trim();
}

export function requiredStr(flags, key, flagName = `--${key}`) {
  const value = str(flags, key);
  if (!value) throw usageError(`缺少必填参数 ${flagName}`);
  return value;
}

// ID 必须按字符串透传：新语 ID 为 19 位雪花 ID，转 Number 会丢精度（超过 2^53）
export function optionalId(flags, key) {
  return str(flags, key);
}

export function optionalInt(flags, key) {
  const value = str(flags, key);
  if (value === undefined) return undefined;
  const num = Number(value);
  if (!Number.isFinite(num)) throw usageError(`参数 --${key} 必须是数字`);
  return num;
}

export function boolFlag(flags, key) {
  const value = flags[key];
  if (value === true) return true;
  if (value === undefined || value === false) return false;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  throw usageError(`参数 --${key} 只接受 true/false`);
}

// 逗号分隔列表；未提供返回 undefined（用于区分「未提供」与「显式清空」）
export function optionalList(flags, key) {
  const value = str(flags, key);
  if (value === undefined) return undefined;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function requireYes(flags, action) {
  if (!flags.yes) {
    throw usageError(`${action} 属于不可恢复操作，确认后请追加 --yes`);
  }
}
