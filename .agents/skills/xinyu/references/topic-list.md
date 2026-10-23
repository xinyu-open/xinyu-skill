# topic list / topic sticky（主题列表）

按时间线或分类浏览圈子主题。

## 命令

```bash
# 最新主题
xinyu-cli topic list --group-id 123456789

# 只看精华
xinyu-cli topic list --group-id 123456789 --scope digest

# 待回答的提问
xinyu-cli topic list --group-id 123456789 --scope pending_question

# 按标签筛选
xinyu-cli topic list --group-id 123456789 --tag-id 900001

# 翻页（用上一页返回的 next_cursor 作为 end-time）
xinyu-cli topic list --group-id 123456789 --end-time 1760000000

# 置顶主题
xinyu-cli topic sticky --group-id 123456789
```

## 参数

**`topic list`**

| 参数 | 必填 | 说明 |
|------|------|------|
| `--group-id <id>` | **是** | 圈子 ID |
| `--scope <scope>` | 否 | `all`（默认）/ `digest` 精华 / `question` 问答 / `pending_question` 待回答 / `article` 文章 / `pic` 图片 / `file` 文件 / `owner` 只看圈主 |
| `--tag-id <id>` | 否 | 按标签筛选（与 `--scope` 二选一） |
| `--count <n>` | 否 | 每页数量，默认 `20` |
| `--begin-time <ts>` | 否 | 起始时间（秒） |
| `--end-time <ts>` | 否 | 结束时间（秒），翻页时传上一页的 `next_cursor` |

**`topic sticky`**

| 参数 | 必填 | 说明 |
|------|------|------|
| `--group-id <id>` | **是** | 圈子 ID |

## 输出

| TOPIC_ID | 类型 | 标题/摘要 | 作者 | 发布 | 评论 | 点赞 |
|----------|------|-----------|------|------|------|------|
| 111222333 | 主题 | 本周复盘 | Will | 2026-10-01 12:00 | 8 | 3 |

翻页时末尾提示 `下一页：--end-time <next_cursor>`。

## 说明

- **`--scope` 与 `--tag-id` 至少生效一个**：两者都不传时后端返回空列表，CLI 默认补 `scope=all`
- 主题列表接口要求当前账号是圈子成员，非成员返回 `2430`
- 列表只返回摘要级字段；完整正文用 `topic detail`
- 置顶列表接口本身不校验成员，CLI 会先做一次成员探测，非成员直接以退出码 `3` 失败

## 错误说明

| 症状 | 原因 | 处理 |
|------|------|------|
| `登录的用户不是圈子成员 [code 2430]` | 当前账号未加入该圈子 | 提示用户加入圈子 |
| 返回空列表 | `scope`/`tag_id` 组合无内容，或该圈子无主题 | 换 `--scope all` 重试 |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [topic-detail](topic-detail.md) — 查看完整正文与评论
- [search](search.md) — 按关键词搜索主题
- [group-tags](group-tags.md) — 获取 `tag_id`
