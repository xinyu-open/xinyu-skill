# question answer（回答提问）

被提问者回答一条提问，回答会生成一条问答主题。

> [!CAUTION]
> 这是**公开写入操作**。执行前必须确认：提问 ID 与问题内容、回答正文、是否公开（`--close` 表示不公开）。

> [!IMPORTANT]
> - 只有**被提问者**能回答；每个问题只能回答一次
> - 回答正文走内容审核
> - `--close` 表示回答不向其他成员公开（仅问答双方可见）

## 命令

```bash
# 公开回答
xinyu-cli question answer --question-id 777888 --group-id 123456789 \
  --content "适合零基础，前两章有完整的环境准备。"

# 不公开回答
xinyu-cli question answer --question-id 777888 --group-id 123456789 \
  --content "这部分内容涉及个人情况，私下回复。" --close
```

## 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--question-id <id>` | **是** | 提问 ID |
| `--group-id <id>` | **是** | 问题所属圈子 ID |
| `--content <text>` | **是** | 回答正文 |
| `--title <text>` | 否 | 回答主题标题（可选） |
| `--pics <uris>` | 否 | 图片 `uri`，逗号分隔 |
| `--close` | 否 | 不公开回答（默认公开） |

## 输出

`✓ 已回答：111222333`（返回生成的 `topic_id`）

## 推荐工作流

1. `xinyu-cli question detail --question-id <id>` 读取问题内容与提问者
2. 起草回答，交用户确认（含是否公开）
3. 执行本命令，记下返回的 `topic_id`
4. 可选：`topic detail --topic-id <topic_id>` 复核

## 失败语义

回答失败不会创建主题，问题仍保持待回答状态。

## 错误说明

| 错误 | 原因 |
|------|------|
| `该问题已被回答 [code 2460]` | 问题已有人回答，不能重复 |
| `无权限操作 [code 112]` | 当前账号不是被提问者 |
| `问题不存在 [code 2461]` | `question_id` 无效 |
| `该问题已被忽略 [code 2462]` | 问题已被忽略 |
| `含有不当内容，请检查 [code 2410]` | 回答审核不通过 |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [question-detail](question-detail.md) — 回答前读取问题
- [topic-list](topic-list.md) — 找待回答的提问
