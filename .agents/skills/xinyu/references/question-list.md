# question list（我的提问）

查看我发起的提问，或我回答过的提问。

## 命令

```bash
# 我发起的提问（默认）
xinyu-cli question list

# 我回答过的提问
xinyu-cli question list --role answered

# 翻页
xinyu-cli question list --cursor 20 --count 20
```

## 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--role <questioner\|answered>` | 否 | `questioner` 我发起的（默认）/ `answered` 我回答过的 |
| `--cursor <n>` | 否 | 偏移量，默认 `0` |
| `--count <n>` | 否 | 每页数量，默认 `20` |

## 输出

| TOPIC_ID | 问题/回答 | 提问者 | 被提问者 | 发布 |
|----------|-----------|--------|----------|------|
| 111222333 | 这门课适合零基础吗？ | 张三 | 李四 | 2026-10-01 12:00 |

未回答的提问 `TOPIC_ID` 可能为空，用 `question detail` 查看问题状态。

翻页时末尾提示 `下一页：--cursor <n>`。

## 说明

- 「待回答的提问」是**回答者视角**的列表，用 `topic list --group-id <id> --scope pending_question`
- 本命令是账号级列表，跨圈子返回；需要限定圈子时按 `--json` 里的 `group_data.group_info.group_id` 过滤
- 只返回当前账号相关的提问，不包含他人的提问

## 错误说明

| 症状 | 原因 | 处理 |
|------|------|------|
| 返回空列表 | 该账号还没有提问记录 | 正常返回 |
| `未登录 [code 1006]` | 未登录 | `xinyu-cli auth login` |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [question-detail](question-detail.md) — 查看单个提问
- [topic-list](topic-list.md) — 待回答列表（`--scope pending_question`）
