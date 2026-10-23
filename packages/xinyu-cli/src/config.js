import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const CONFIG_DIR = process.env.XINYU_CONFIG_DIR || join(homedir(), '.config', 'xinyu');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function configFile() {
  return CONFIG_FILE;
}

export function readConfig() {
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeConfig(patch) {
  const next = { ...readConfig(), ...patch, updated_at: new Date().toISOString() };
  mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_FILE, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
  return next;
}

export function clearConfig() {
  rmSync(CONFIG_FILE, { force: true });
}

export function requireToken(config) {
  const token = process.env.XINYU_TOKEN || config.access_token;
  if (!token) {
    const err = new Error('尚未登录，请先执行 xinyu-cli auth login');
    err.exitCode = 4;
    throw err;
  }
  return token;
}
