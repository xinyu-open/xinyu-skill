# group members / group member（成员列表与搜索）

分页查看圈子成员，按昵称/新语号搜索成员，或查看单个成员详情。

## 命令

```bash
# 成员列表（按加入时间倒序）
xinyu-cli group members --group-id 123456789

# 翻页
xinyu-cli group members --group-id 123456789 --cursor 20 --count 20

# 按昵称/新语号搜索（关键词至少 2 个字）
xinyu-cli group members --group-id 123456789 --keyword 张三

# 单个成员详情
xinyu-cli group member --group-id 123456789 --user-id 10001
```

## 参数

**`group members`**

| 参数 | 必填 | 说明 |
|------|------|------|
| `--group-id <id>` | **是** | 圈子 ID |
| `--keyword <kw>` | 否 | 提供时走成员搜索接口，匹配昵称/新语号/用户名，至少 2 个字 |
| `--cursor <n>` | 否 | 偏移量，默认 `0` |
| `--count <n>` | 否 | 每页数量，默认 `20`，搜索上限 `50` |

**`group member`**

| 参数 | 必填 | 说明 |
|------|------|------|
| `--group-id <id>` | **是** | 圈子 ID |
| `--user-id <uid>` | **是** | 目标成员的用户 ID |

## 输出

`group members` 表格：USER_ID、昵称、新语号、状态（正常/已过期）、加入时间、到期时间。

翻页时末尾提示 `下一页：--cursor <n>`。

`group member` 表格：昵称、新语号、状态、加入时间、主题数、介绍。

## 说明

- 成员范围与前端成员列表一致：仅普通成员（不含圈主/合伙人/嘉宾），含已过期成员
- `expire_time` 仅对圈主/管理员等有管理权限的账号返回，其他账号显示 `-`
- 成员搜索是前缀无关的模糊匹配（昵称、新语号、用户名任一命中），关键词 ≥2 字、单页 ≤50 条
- 成员列表与搜索均为分页偏移量语义，成员变动时可能重复或漏项，不要用它做全量统计

## 错误说明

| 症状 | 原因 | 处理 |
|------|------|------|
| `参数不合法 [code 102]` | `--keyword` 少于 2 字，或 `count`/`cursor` 非法 | 补足关键词长度 |
| 搜索无结果 | 成员昵称不含该关键词 | 换更短的关键词，或改用成员列表逐页查 |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [group-list](group-list.md) — 获取 `group_id`
- [question-post](question-post.md) — 向成员提问时需要对方的 `user_id`
