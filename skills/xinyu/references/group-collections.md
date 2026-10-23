# group collections / group collection-topics（合集）

查看圈子的合集列表，以及某个合集内的主题。

## 命令

```bash
# 合集列表
xinyu-cli group collections --group-id 123456789

# 合集内主题（分页）
xinyu-cli group collection-topics --collection-id 555001 --count 20
```

## 参数

**`group collections`**

| 参数 | 必填 | 说明 |
|------|------|------|
| `--group-id <id>` | **是** | 圈子 ID |

**`group collection-topics`**

| 参数 | 必填 | 说明 |
|------|------|------|
| `--collection-id <id>` | **是** | 合集 ID |
| `--cursor <n>` | 否 | 偏移量，默认 `0` |
| `--count <n>` | 否 | 每页数量，默认 `20` |

## 输出

`group collections` 表格：COLLECTION_ID、名称、主题数、来源专栏（普通合集为 `-`）。

`group collection-topics` 表格：TOPIC_ID、标题、作者、发布。

## 说明

- 合集由圈主维护；部分合集来自专栏导入，`column_id` 非空表示来源专栏
- 合集内主题是圈子的主题，读取正文时仍受成员可见性限制，用 `topic detail` 查看
- 合集本身不支持通过 CLI 创建/编辑（暂无对应接口），不要臆造命令

## 错误说明

| 症状 | 原因 | 处理 |
|------|------|------|
| `合集不存在 [code 2452]` | `collection_id` 无效或不属于该圈子 | 先 `group collections` 查真实 ID |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [group-list](group-list.md) — 圈子详情里也返回合集列表
- [topic-detail](topic-detail.md) — 查看合集内主题正文
