# topic edit（编辑主题）

修改主题的标题、标签、精华、置顶状态。

> [!CAUTION]
> 这是**公开写入操作**。执行前必须向用户确认：目标主题 ID、要修改的字段与修改后的完整内容。

> [!IMPORTANT]
> - **只支持 4 个字段**：`title`、`tag_ids`、`digested`、`sticky`。服务端 `edit_data` 只有这几个字段。
> - **`--content` / `--pics` / `--files` 不生效**：CLI 会把这些参数发出去，但服务端不认识，会**静默丢弃**并照样返回成功（打印 `✓ 主题已更新`）。改正文或换图请参考下方「改正文 / 换图：做不到」。
> - **标题 / 标签 / 精华 / 置顶** 走管理权限校验，通常需要圈主或管理员。

## 命令

```bash
# 改标题（圈主/管理员）
xinyu-cli topic edit --topic-id 111222333 --title "新的标题"

# 设置标签（全量替换）
xinyu-cli topic edit --topic-id 111222333 --tag-ids "900001,900002"

# 设为精华
xinyu-cli topic edit --topic-id 111222333 --digest true

# 置顶 / 取消置顶
xinyu-cli topic edit --topic-id 111222333 --sticky true
xinyu-cli topic edit --topic-id 111222333 --sticky false
```

## 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--topic-id <id>` | **是** | 主题 ID |
| `--title <text>` | 否 | 新标题（≤100 字） |
| `--tag-ids <ids>` | 否 | 标签 ID 列表，**全量替换** |
| `--digest <true\|false>` | 否 | 设为/取消精华 |
| `--sticky <true\|false>` | 否 | 置顶/取消置顶 |
| `--content <text>` | 否 | ⚠️ **无效**，服务端忽略，不报错 |
| `--pics <uris>` | 否 | ⚠️ **无效**，服务端忽略，不报错 |
| `--files <uris>` | 否 | ⚠️ **无效**，服务端忽略，不报错 |

## 输出

`✓ 主题已更新：111222333`。

注意：这个成功提示**只表示请求被受理**，不代表所有字段都写入了。如果本次只传了 `--content` / `--pics`，接口同样返回成功，但主题没有任何变化。

## 改正文 / 换图：做不到

当前编辑接口不接收正文和图片（`biz` 层的更新能力存在，但没有暴露 HTTP 入口），所以：

- **改正文**：没有可用命令。只能删除主题后重新发布。
- **加图 / 换图 / 删图**：同上。图片只能在 `topic create` 时带上。
- **验证图片是否真的在**：`topic detail --topic-id <id> --json`，看 `data.topic_info.pics`。这个字段是 `omitempty`，**不存在就等于没有图**——不要因为详情里看不到报错就以为图还在。

删除重建会换新的 `topic_id`，已有评论和链接都会失效，执行前务必跟用户确认。

## 推荐工作流

1. `xinyu-cli topic detail --topic-id <id>` 读取当前内容（含标签、精华/置顶状态）
2. 与用户确认要改哪些字段、改成什么（只能选标题 / 标签 / 精华 / 置顶）
3. 执行本命令；多个字段可一次传入
4. 用 `topic detail` 复核

## 失败语义

标题、标签、精华、置顶相互独立；任一步失败会中断本次请求，后续字段不再处理。没有任何字段真正生效时（例如只传了 `--pics`），接口仍返回成功。

## 错误说明

| 错误 | 原因 |
|------|------|
| `无权限操作 [code 112]` | 不是主题作者 |
| `无管理权限 [code 2431]` | 改标题/标签/精华/置顶但无管理权限 |
| `主题不存在` | `topic_id` 无效 |

> 正文相关的错误码（`2446` 仅支持编辑普通主题正文、`2447` 正文不能为空、`2033` 内容审核中、`2445` 含有不当内容）来自旧版本链路，当前编辑接口不处理正文，不会触发。

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [topic-detail](topic-detail.md) — 修改前读取当前内容
- [group-tags](group-tags.md) — 获取标签 ID
- [topic-create](topic-create.md) — 图片只能在这里带
- [topic-delete](topic-delete.md) — 需要改正文/图片时先删除
