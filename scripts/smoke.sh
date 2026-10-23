#!/usr/bin/env bash
# xinyu-cli 基础契约冒烟测试：不依赖登录态，不做写入。
# 运行：bash scripts/smoke.sh
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI=(node "$ROOT/packages/xinyu-cli/bin/xinyu-cli.js")
PASS=0
FAIL=0

ok() {
  PASS=$((PASS + 1))
  printf '✓ %s\n' "$1"
}

ng() {
  FAIL=$((FAIL + 1))
  printf '✗ %s\n' "$1"
  if [ $# -gt 1 ]; then printf '  %s\n' "$2"; fi
}

# 断言退出码
expect_exit() {
  local desc="$1" want="$2"
  shift 2
  local out
  out="$("$@" 2>&1)"
  local code=$?
  if [ "$code" -eq "$want" ]; then
    ok "$desc"
  else
    ng "$desc" "期望退出码 $want，实际 $code；输出：$(printf '%s' "$out" | head -2)"
  fi
}

# 1. --version / -v 输出语义化版本
for flag in --version -v; do
  out="$("${CLI[@]}" "$flag" 2>&1)"
  code=$?
  if [ "$code" -eq 0 ] && printf '%s' "$out" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    ok "$flag 输出版本号（$out）"
  else
    ng "$flag 输出版本号" "退出码 $code，输出：$(printf '%s' "$out" | head -2)"
  fi
done

# 2. --help 正常输出
out="$("${CLI[@]}" --help 2>&1)"
if [ $? -eq 0 ] && printf '%s' "$out" | grep -q '用法：xinyu-cli'; then
  ok '--help 输出帮助'
else
  ng '--help 输出帮助'
fi

# 3. 未知命令 / 缺少子命令按参数错误处理
expect_exit '未知命令返回 1' 1 "${CLI[@]}" nosuchdomain
expect_exit '缺少子命令返回 1' 1 "${CLI[@]}" group
expect_exit '只给全局参数返回 1' 1 "${CLI[@]}" --json

# 4. 缺少必填参数
expect_exit '缺少 --topic-id 返回 1' 1 "${CLI[@]}" topic detail

# 5. 网络不可达
expect_exit '接口不可达返回 1' 1 "${CLI[@]}" group list --base-url http://127.0.0.1:9

# 6. auth status：未登录返回 4，已登录返回 0
"${CLI[@]}" auth status >/dev/null 2>&1
code=$?
if [ "$code" -eq 0 ] || [ "$code" -eq 4 ]; then
  ok "auth status 退出码合法（$code）"
else
  ng 'auth status 退出码合法' "实际 $code"
fi

printf '\n通过 %d 项，失败 %d 项\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
