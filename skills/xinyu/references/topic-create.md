# topic create（发布主题）

在指定圈子内发布一条普通主题，可带图片与标签。

> [!CAUTION]
> 这是**公开写入操作**，发布后对圈子成员可见。执行前必须向用户确认：
> 1. 目标圈子（`group_id` 与圈子名称）
> 2. 标题与完整正文
> 3. 图片清单（已上传的 `uri`）
> 4. 标签（使用圈子已有标签）
> 5. 若对草稿做了排版或改写：把**完整确认稿**交用户核对，待其明确表示「确认发布」后再执行

> [!IMPORTANT]
> - 正文走内容审核，审核不通过会返回 `含有不当内容，请检查`
> - 只支持普通主题；文章主题需在创作端发布，问答主题用 `question` 相关命令
> - 正文为 HTML，纯文本中的换行会被原样保存

## 命令

```bash
# 纯文本主题
xinyu-cli topic create --group-id 123456789 --title "本周复盘" --content "这周做了三件事……"

# 带图片（先上传拿 uri）
xinyu-cli topic create --group-id 123456789 --content "现场照片" --pics "abc123.png,def456.jpg"

# 带标签
xinyu-cli topic create --group-id 123456789 --content "读书笔记" --tag-ids "900001,900002"

# 只要图片不要正文
xinyu-cli topic create --group-id 123456789 --pics "abc123.png"
```

## 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--group-id <id>` | **是** | 目标圈子 ID |
| `--content <text>` | 否* | 正文（支持 `\n` 换行） |
| `--title <text>` | 否 | 标题 |
| `--pics <uris>` | 否 | 图片 `uri`，逗号分隔（先从 `upload image` 获取） |
| `--tag-ids <ids>` | 否 | 标签 ID，逗号分隔（从 `group tags` 获取） |

\* `--content` 与 `--pics` 至少提供一个。

## 输出

```json
{"status_code": 0, "status_msg": "", "data": {"topic_info": {"topic_id": "111222333", "title": "本周复盘"}}}
```

CLI 表格/文本输出为 `✓ 主题已发布：111222333`。

## 推荐工作流

1. **确认目标圈子**：`xinyu-cli group list`，如有多个候选先让用户选
2. **准备配图**：`xinyu-cli upload image --file ./a.png`，把返回的 `uri` 收集起来
3. **对齐标签**：`xinyu-cli group tags --group-id <id>`，只用已存在的标签
4. **交用户确认完整稿**（圈子、标题、正文、图片、标签），得到明确同意
5. **发布**：执行本命令
6. **校验**（可选）：`xinyu-cli topic detail --topic-id <新 ID>` 核对正文与标签

## 失败语义

发布失败不会留下半成品主题；审核不通过时无主题生成，按错误提示修改内容后重试。

## 错误说明

| 错误 | 原因 |
|------|------|
| `至少通过 --content 或 --pics 提供内容` | 正文与图片都为空 |
| `含有不当内容，请检查 [code 2410]` | 内容审核不通过 |
| `无发布话题权限 [code 2440]` | 当前账号在该圈子无发帖权限（如已过期） |
| `登录的用户不是圈子成员 [code 2430]` | 未加入该圈子 |
| `标题不能超过100字 [code 2444]` | 标题过长 |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [upload-image](upload-image.md) — 上传配图
- [group-tags](group-tags.md) — 获取标签 ID
- [topic-edit](topic-edit.md) — 发布后修改
- [topic-reply](topic-reply.md) — 发完主题引导互动
