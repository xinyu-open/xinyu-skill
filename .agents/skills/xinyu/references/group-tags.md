# group tags（圈子标签）

查看圈子内配置的标签，用于发主题/编辑主题时填 `--tag-ids`。

## 命令

```bash
xinyu-cli group tags --group-id 123456789
xinyu-cli group tags --group-id 123456789 --json
```

## 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--group-id <id>` | **是** | 圈子 ID |

## 输出

| TAG_ID | 标签 |
|--------|------|
| 900001 | 读书笔记 |
| 900002 | 工具推荐 |

## 说明

- 标签由圈主维护；发主题时把 `tag_id` 传给 `--tag-ids`（逗号分隔）
- 标签列表只包含 ID 与名称，没有主题数量统计
- 想让主题带上已有标签体系，先查标签再发帖，避免让用户口述标签名

## 错误说明

通用错误（`group_id` 缺失为 `102`，未登录为 `1006`）见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [topic-create](topic-create.md) — 发主题时使用标签
- [topic-edit](topic-edit.md) — 修改主题标签
