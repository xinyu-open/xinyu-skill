# question post（发起提问）

向圈子内的某个成员发起提问；对方回答后才会生成一条问答主题。

> [!CAUTION]
> 这是写入操作，提问会通知被提问者。执行前必须确认：目标圈子、被提问者的 `user_id` 与昵称、问题内容、是否匿名。

> [!IMPORTANT]
> - 必须是被提问者所在圈子，且提问者是该圈子成员
> - 部分圈子设置了每月免费提问次数上限，超限会失败
> - 不能向自己提问

## 命令

```bash
# 向成员提问
xinyu-cli question post --group-id 123456789 --questionee-uid 10001 --content "这门课适合零基础吗？"

# 匿名提问
xinyu-cli question post --group-id 123456789 --questionee-uid 10001 --content "想问一个敏感问题" --anonymous

# 带图片
xinyu-cli question post --group-id 123456789 --questionee-uid 10001 --content "如图" --pics "abc123.png"
```

## 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--group-id <id>` | **是** | 圈子 ID |
| `--questionee-uid <uid>` | **是** | 被提问者用户 ID（用 `group members` 查） |
| `--content <text>` | **是** | 问题内容 |
| `--anonymous` | 否 | 匿名提问 |
| `--pics <uris>` | 否 | 图片 `uri`，逗号分隔 |

## 输出

`✓ 提问已发送：777888`（返回 `question_id`）

## 推荐工作流

1. `xinyu-cli group members --group-id <id> --keyword <昵称>` 找到被提问者 `user_id`
2. 向用户确认「向谁提问 + 问题内容 + 是否匿名」
3. 执行本命令，记下返回的 `question_id`
4. 需要查看进度时用 `question detail --question-id <id>` 或 `question list`

## 失败语义

提问失败不会创建问题记录，不消耗提问次数。

## 错误说明

| 错误 | 原因 |
|------|------|
| `登录的用户不是圈子成员 [code 2430]` | 提问者未加入该圈子 |
| `当月免费提问次数已用完 [code 2470]` | 超过免费提问额度 |
| `圈子不存在 [code 2400]` | `group_id` 无效 |
| `参数不合法 [code 102]` | 缺少必填参数或内容为空 |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [group-members](group-members.md) — 查被提问者 `user_id`
- [question-list](question-list.md) — 查看我发起的提问
- [question-answer](question-answer.md) — 被提问者回答
