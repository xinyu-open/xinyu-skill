# topic digg（点赞 / 取消点赞）

对主题点赞或取消点赞。

> [!CAUTION]
> 写入操作，会以当前账号身份产生互动记录。先确认目标主题，再执行。

## 命令

```bash
# 点赞
xinyu-cli topic digg --topic-id 111222333

# 取消点赞
xinyu-cli topic digg --topic-id 111222333 --undo
```

## 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--topic-id <id>` | **是** | 主题 ID |
| `--undo` | 否 | 取消点赞 |

## 输出

`✓ 已点赞：111222333` / `✓ 已取消点赞：111222333`

## 推荐工作流

1. `xinyu-cli topic detail --topic-id <id>` 确认主题
2. 询问用户是点赞还是取消点赞
3. 执行 `topic digg`（取消时加 `--undo`）

## 失败语义

点赞失败不会产生互动记录，可安全重试。

## 说明

- 重复点赞不会报错，服务端以最终状态为准
- 点赞数可在 `topic detail` 的「互动」行查看
- 评论点赞暂未封装，如确有需要走 `api raw`

## 错误说明

| 错误 | 原因 |
|------|------|
| `参数不合法 [code 102]` | 缺少 `--topic-id` 或 `action` 非法 |
| `未登录 [code 1006]` | 未登录 |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [topic-detail](topic-detail.md) — 查看点赞数
- [topic-reply](topic-reply.md) — 评论互动
