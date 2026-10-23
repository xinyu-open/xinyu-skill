# question detail（提问详情）

查看一条提问的内容、状态与回答内容。

## 命令

```bash
xinyu-cli question detail --question-id 777888
```

## 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--question-id <id>` | **是** | 提问 ID（`question post` 的返回值） |

## 输出

分行键值：问题 ID、圈子、提问者、被提问者、状态，随后是提问内容与（若已回答）回答内容。

## 说明

- **只有提问者与被提问者**能查看详情，其他人返回 `无权查看该问题 [code 2463]`
- 匿名提问不会展示提问者昵称，显示为「匿名」
- `status` 为服务端枚举：未解决 / 已回答 / 已忽略
- 已回答的问题会关联一条问答主题，可用返回的 `topic_id` 走 `topic detail`

## 错误说明

| 错误 | 原因 |
|------|------|
| `无权查看该问题 [code 2463]` | 当前账号既不是提问者也不是被提问者 |
| `问题不存在 [code 2461]` | `question_id` 无效 |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [question-answer](question-answer.md) — 回答提问
- [question-list](question-list.md) — 找到 `question_id`
