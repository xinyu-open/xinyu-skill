# 接口底表

`xinyu-cli` 各命令对应的后端接口（前缀 `https://xinyu.zone/eden/v1`）。探索模式下只能调用本表列出的路径。

## 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/mini-web-login/start` | 发起扫码登录，返回 `transaction_id`、`url_link`、`expires_in` |
| GET | `/auth/mini-web-login/status` | 查询登录状态（`PENDING` / `APPROVED` / `CONSUMED` / `CANCELLED`） |
| POST | `/auth/mini-web-login/complete` | 换取 token（通过 `Set-Cookie` 下发） |
| POST | `/user/logout` | 登出 |

## 圈子

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/group/user/groups` | 我加入的圈子 |
| GET | `/group/list` | 我创建的圈子（`user_role`、`group_type`） |
| GET | `/group` | 圈子详情（`group_id`），含绑定专栏与合集 |
| GET | `/group/tags` | 圈子标签 |
| GET | `/group/subscriber/list` | 成员列表（`group_id`、`cursor`、`count`） |
| GET | `/group/member/search` | 成员搜索（`group_id`、`keyword` >= 2 字、`cursor`、`count` <= 50） |
| GET | `/group/:id/member/:user_id` | 成员详情 |
| GET | `/group/collections` | 合集列表（`group_id`） |
| GET | `/group/collection/topics` | 合集内主题（`collection_id`） |

## 搜索

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/search` | 统一搜索：`item_type` 1 用户 / 2 文章 / 4 标签 / 10 圈子 / 11 圈子主题；主题搜索必须带 `group_id`；`count` 必须 > 0，`sort_type` 必须显式给值（0 会报错） |

## 主题

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/group/topics` | 主题列表（`group_id`、`scope`、`tag_id`、`begin_time`、`end_time`、`count`），`scope` 与 `tag_id` 至少一个 |
| GET | `/group/topics/sticky` | 置顶主题（`group_id`） |
| GET | `/group/topic/:id` | 主题详情 |
| GET | `/group/topic/:id/article` | 文章型主题的文章详情 |
| GET | `/group/topic/comment/list` | 评论列表（`topic_id`、`cursor`、`limit`、`sort`） |
| GET | `/group/topic/comment/reply/list` | 楼中楼回复（`topic_id`、`comment_id`、`cursor`、`limit`） |
| POST | `/group/topic` | 发布主题，返回新主题详情（含 `topic_id`） |
| PATCH | `/group/topic/:id` | 编辑主题：`edit_data.{title,tag_ids,sticky,digested}`（**只支持这 4 个**；`content/pics/files` 服务端不接收，传了静默丢弃） |
| DELETE | `/group/topic/:id` | 删除主题 |
| POST | `/group/topic/comment` | 发表评论 / 回复（`comment_info.{item_id,item_type=11,content,reply_to_comment_id,pics}`） |
| DELETE | `/group/topic/comment` | 删除评论（`comment_id`） |
| POST | `/interact/digg/topic` | 点赞 / 取消点赞（`topic_id`、`action` 1 点赞 / 2 取消） |

## 提问

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/group/question` | 发起提问，返回 `question_id` |
| GET | `/group/questions/questioner` | 我发起的提问 |
| GET | `/group/questions/answered_topics` | 我回答过的提问 |
| GET | `/group/question/:id` | 提问详情（仅提问者与被提问者） |
| POST | `/group/question/:id/answer` | 回答提问，返回生成的 `topic_id` |

## 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/platform/ali_sts/get` | 取 OSS 临时凭证（`file_type` 1=图片 / 2=视频、`file_name`、`oss_dir`），返回 `credential` / `xid` / `signed_url` |
| GET | `/user/info` | 用户信息（默认当前登录用户） |

直传流程：`/platform/ali_sts/get` 取凭证 → 用 STS 签名 `PUT` 到 `eden-app.oss-cn-shanghai.aliyuncs.com/{oss_dir}{xid}{ext}`，`uri` 即该对象 key。旧的 `POST /upload/image`（multipart）已废弃。

## 通用约定

- 响应信封：`{ "status_code": 0, "status_msg": "", ... }`，`0` 表示成功，非 `0` 为业务错误
- 所有 ID 在 JSON 中均为字符串（int64 序列化），构造请求时按字符串传
- 需要登录的接口在未登录时返回 `status_code: 1006`
