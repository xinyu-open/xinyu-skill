# group list / group detail（圈子列表与详情）

列出我加入或创建的圈子，并查看单个圈子的详情（含绑定专栏与合集）。

## 命令

```bash
# 我加入的所有圈子
xinyu-cli group list

# 我创建的圈子
xinyu-cli group list --owned

# 只看前 5 个
xinyu-cli group list --limit 5

# 圈子详情（含绑定专栏、合集列表）
xinyu-cli group detail --group-id 123456789
```

## 参数

**`group list`**

| 参数 | 必填 | 说明 |
|------|------|------|
| `--owned` | 否 | 改为列出我创建的圈子（`/group/list`） |
| `--role <n>` | 否 | 配合 `--owned`，角色过滤，默认 `1`（圈主） |
| `--type <n>` | 否 | 圈子类型：`1` 免费 / `2` 付费 / `3` 专栏圈子 |
| `--limit <n>` | 否 | 最多展示条数（客户端截断） |

**`group detail`**

| 参数 | 必填 | 说明 |
|------|------|------|
| `--group-id <id>` | **是** | 圈子 ID |

## 输出

`group list` 表格：

| GROUP_ID | 名称 | 类型 | 最近发布 |
|----------|------|------|---------|
| 123456789 | 示例圈子 | 付费 | 2026-10-01 12:00 |

`group detail` 为分行键值：圈子 ID、名称、类型、圈主、我的角色、最近发布、绑定专栏、合集数。

## 说明

- `group_id` 是纯数字字符串，后续 `topic`、`group tags`、`group members` 等命令都依赖它
- `group list` 同时包含加入和创建的圈子；需要区分时用 `group list --owned`
- 详情里的「绑定专栏」只在专栏圈子中存在
- 加 `--json` 可拿到 `user_member_info`、`bound_column`、`collections` 等完整字段

## 错误说明

| 症状 | 原因 | 处理 |
|------|------|------|
| 返回空列表 | 该账号尚未加入/创建任何圈子 | 用 `xinyu-cli auth status` 确认账号 |
| `圈子不存在 [code 2400]` | `group_id` 无效 | 先用 `group list` 或 `search groups` 核对 |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [group-tags](group-tags.md) — 圈子标签
- [group-members](group-members.md) — 圈子成员
- [search](search.md) — 按关键词搜索圈子
