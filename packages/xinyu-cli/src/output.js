const CJK = /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/;

export function displayWidth(text) {
  let width = 0;
  for (const char of String(text)) {
    width += CJK.test(char) ? 2 : 1;
  }
  return width;
}

// 用户的 nickname 可能未设置，按 nickname → user_name → 新语号 → user_id 兜底
export function displayName(user) {
  if (!user) return '-';
  return user.nickname || user.user_name || user.xinyu_id || user.user_id || '-';
}

export function truncate(text, max) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (max === undefined || displayWidth(value) <= max) return value;
  let out = '';
  let width = 0;
  for (const char of value) {
    const w = CJK.test(char) ? 2 : 1;
    if (width + w > max - 1) break;
    out += char;
    width += w;
  }
  return `${out}…`;
}

export function stripHtml(html) {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

export function fmtTime(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) return '-';
  const date = new Date(value * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

// columns: [{ title, value(row), max }]
export function printTable(columns, rows) {
  if (!rows || rows.length === 0) {
    process.stdout.write('（无数据）\n');
    return;
  }
  const cells = rows.map((row) => columns.map((col) => truncate(col.value(row), col.max)));
  const headers = columns.map((col) => col.title);
  const widths = headers.map((header, index) =>
    Math.max(displayWidth(header), ...cells.map((line) => displayWidth(line[index] ?? ''))),
  );

  const renderLine = (line) =>
    line
      .map((cell, index) => {
        const value = cell ?? '';
        return value + ' '.repeat(Math.max(0, widths[index] - displayWidth(value)));
      })
      .join('  ')
      .trimEnd();

  process.stdout.write(`${renderLine(headers)}\n`);
  process.stdout.write(`${widths.map((w) => '-'.repeat(w)).join('  ')}\n`);
  for (const line of cells) {
    process.stdout.write(`${renderLine(line)}\n`);
  }
}

export function printKV(pairs) {
  const width = Math.max(...pairs.map(([key]) => displayWidth(key)));
  for (const [key, value] of pairs) {
    process.stdout.write(`${key}${' '.repeat(width - displayWidth(key))}  ${value ?? ''}\n`);
  }
}

export function groupTypeName(type) {
  switch (Number(type)) {
    case 1:
      return '免费';
    case 2:
      return '付费';
    case 3:
      return '专栏圈子';
    default:
      return String(type ?? '-');
  }
}

export function topicTypeName(type) {
  switch (Number(type)) {
    case 1:
      return '主题';
    case 2:
      return '提问';
    case 3:
      return '文章';
    default:
      return String(type ?? '-');
  }
}

export function memberStatusName(status) {
  switch (Number(status)) {
    case 1:
      return '正常';
    case 2:
      return '已过期';
    default:
      return String(status ?? '-');
  }
}
