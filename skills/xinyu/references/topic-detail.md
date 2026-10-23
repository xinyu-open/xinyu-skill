# topic detail / topic comments / topic replies（查看主题）

查看主题正文、标签、互动数据，以及主题下的评论和楼中楼回复。

## 命令

```bash
# 主题详情
xinyu-cli topic detail --topic-id 111222333

# 评论列表
xinyu-cli topic comments --topic-id 111222333 --limit 20

# 评论翻页
xinyu-cli topic comments --topic-id 111222333 --cursor 1760000000

# 某条评论下的回复（需同时给 topic-id 以便校验访问权限）
xinyu-cli topic replies --topic-id 111222333 --comment-id 444555
```

## 参数

**`topic detail`**

| 参数 | 必填 | 说明 |
|------|------|------|
| `--topic-id <id>` | **是** | 主题 ID |

**`topic comments`**

| 参数 | 必填 | 说明 |
|------|------|------|
| `--topic-id <id>` | **是** | 主题 ID |
| `--cursor <n>` | 否 | 游标，取上一页返回的 `cursor` |
| `--limit <n>` | 否 | 每页数量，默认 `20` |
| `--sort <n>` | 否 | 排序：`1` 最新（默认）/ 其他服务端枚举 |

**`topic replies`**

| 参数 | 必填 | 说明 |
|------|------|------|
| `--topic-id <id>` | **是** | 主题 ID（用于访问校验） |
| `--comment-id <id>` | **是** | 父评论 ID |
| `--cursor <n>` | 否 | 游标 |
| `--limit <n>` | 否 | 每页数量，默认 `20` |

## 输出

`topic detail` 为分行信息：主题 ID、类型、标题、作者、圈子、发布、互动数、标签、属性（精华/置顶）、提问 ID（若为问答），随后输出正文。

`topic comments` / `topic replies` 表格：COMMENT_ID、作者、内容、回复数（仅评论）、时间。

## 说明

- **访问权限**：主题正文只对圈子成员开放。非成员、或会员过期后发布的主题，CLI 会直接报「无权查看该主题」（退出码 `3`），**不会返回摘要**，不要重试或改用其他接口绕过
- 评论/回复命令会先校验主题可见性；无权限时同样以退出码 `3` 失败
- 正文为 HTML，CLI 已转为纯文本输出；需要原始 HTML 用 `--json` 读取 `html_content`
- 文章型主题（`topic_type=3`）正文在文章侧，需要完整内容时用 `xinyu-cli api raw --method GET --path /group/topic/<id>/article`
- 问答主题的 `topic_info.question` 会带 `question_id`，回答用 `question answer`

## 错误说明

| 症状 | 原因 | 处理 |
|------|------|------|
| `无权查看该主题：未加入该圈子，或会员已过期` / 退出码 `3` | 非成员或会员过期 | 说明限制，不要重试 |
| `主题不存在或已删除` | `topic_id` 无效 | 用 `topic list` 或 `search topics` 重新确认 |
| 评论为空 | 主题无评论，或无权限（已先行拦截） | 正常返回空列表 |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [topic-reply](topic-reply.md) — 发表评论/回复
- [topic-list](topic-list.md) — 找到要看的主题
