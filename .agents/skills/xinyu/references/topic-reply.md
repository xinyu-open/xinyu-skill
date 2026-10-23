# topic reply（评论 / 回复评论）

在主题下发表评论，或回复某条评论（楼中楼）。

> [!CAUTION]
> 这是**公开写入操作**，评论对圈子成员可见。执行前必须向用户确认：目标主题、评论内容、是否需要回复某条评论并 @ 对方。

> [!IMPORTANT]
> - 回复某条评论时传 `--reply-to-comment-id`，后端会自动归到同一楼层
> - 评论内容有长度上限（约 1000 字），且会做内容检测

## 命令

```bash
# 发表评论
xinyu-cli topic reply --topic-id 111222333 --content "很有启发，谢谢分享"

# 回复某条评论
xinyu-cli topic reply --topic-id 111222333 --comment-id 444555 --content "同意这个观点"

# 带图片评论（先上传拿 uri）
xinyu-cli topic reply --topic-id 111222333 --content "见图" --pics "abc123.png"
```

## 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--topic-id <id>` | **是** | 主题 ID |
| `--content <text>` | **是** | 评论内容 |
| `--reply-to-comment-id <id>` | 否 | 要回复的评论 ID（`topic comments` 获取）；也接受 `--comment-id` 简写 |
| `--pics <uris>` | 否 | 图片 `uri`，逗号分隔 |

## 输出

`✓ 评论已发布：555666`

## 推荐工作流

1. `xinyu-cli topic comments --topic-id <id>` 查看现有评论，确认要回复的对象
2. 把拟回复内容交用户确认
3. 执行本命令；回复评论时带上 `--reply-to-comment-id`
4. 可选：再次 `topic comments` 确认已出现

## 失败语义

发布失败不会产生评论。

## 错误说明

| 错误 | 原因 |
|------|------|
| `评论不可为空 [code 3002]` | 内容为空或全是空白 |
| `评论字数超出限制 [code 3001]` | 内容过长 |
| `评论图片数量超出限制 [code 3003]` | 图片过多 |
| `评论已删除 [code 3004]` | `--reply-to-comment-id` 指向的评论已删除 |
| `登录的用户不是圈子成员 [code 2430]` | 未加入圈子 |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [topic-detail](topic-detail.md) — 查看评论列表
- [upload-image](upload-image.md) — 上传评论配图
- [topic-digg](topic-digg.md) — 点赞主题
