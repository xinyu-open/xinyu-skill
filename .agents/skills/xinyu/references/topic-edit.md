# topic edit（编辑主题）

修改主题正文、标题、标签、精华、置顶状态。

> [!CAUTION]
> 这是**公开写入操作**。执行前必须向用户确认：目标主题 ID、要修改的字段与修改后的完整内容。

> [!IMPORTANT]
> - **正文**：仅普通主题（`topic_type=1`）的作者本人可改；文章主题改正文请到创作端，问答主题用重新回答的方式维护
> - 正文变更需重新送审，审核期间主题可能短暂不可见；审核中再次提交会失败（`内容审核中`）
> - **标题 / 标签 / 精华 / 置顶** 走管理权限校验，通常需要圈主或管理员
> - `--pics` 不传表示保留原图片；传空字符串表示清空图片

## 命令

```bash
# 改正文（作者本人）
xinyu-cli topic edit --topic-id 111222333 --content "修正后的正文"

# 改正文并替换图片
xinyu-cli topic edit --topic-id 111222333 --content "修正后的正文" --pics "abc123.png"

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
| `--content <text>` | 否 | 新正文（触发审核） |
| `--pics <uris>` | 否 | 图片 `uri` 列表，逗号分隔；传空字符串清空 |
| `--files <uris>` | 否 | 附件 `uri` 列表（当前 CLI 无文件上传接口，一般不用） |
| `--title <text>` | 否 | 新标题（≤100 字） |
| `--tag-ids <ids>` | 否 | 标签 ID 列表，**全量替换** |
| `--digest <true\|false>` | 否 | 设为/取消精华 |
| `--sticky <true\|false>` | 否 | 置顶/取消置顶 |

至少提供一个要修改的字段。

## 输出

`✓ 主题已更新：111222333`；修改正文时额外提示审核说明。

## 推荐工作流

1. `xinyu-cli topic detail --topic-id <id>` 读取当前内容（含标签、精华/置顶状态）
2. 与用户确认要改哪些字段、改成什么
3. 执行本命令；多个字段可一次传入
4. 修改正文后用 `topic detail` 复核（审核通过后才会展示新内容）

## 失败语义

正文修改为「提交新版本 + 送审」：审核不通过时不生效，原内容保持不变。标题、标签、精华、置顶相互独立，正文失败会中断本次请求，其余字段也不会被修改。

## 错误说明

| 错误 | 原因 |
|------|------|
| `仅支持编辑普通主题的正文 [code 2446]` | 对文章/问答主题改正文 |
| `主题正文不能为空 [code 2447]` | 传了空正文且无图片 |
| `无权限操作 [code 112]` | 不是正文作者 |
| `无管理权限 [code 2431]` | 改标题/标签/精华/置顶但无管理权限 |
| `内容审核中 [code 2033]` / `内容申诉中` | 上一版仍在审核，等待后再试 |
| `含有不当内容，请检查 [code 2445]` | 新正文审核不通过 |
| `主题不存在` | `topic_id` 无效 |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [topic-detail](topic-detail.md) — 修改前读取当前内容
- [group-tags](group-tags.md) — 获取标签 ID
- [topic-delete](topic-delete.md) — 删除主题
