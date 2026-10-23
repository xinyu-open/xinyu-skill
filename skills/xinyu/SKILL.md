---
name: xinyu
description: "新语圈子（xinyu-cli）完整操作指南。当用户提到新语、xinyu、圈子、社群、发主题、发帖、编辑主题、删帖、评论、回复评论、点赞、提问、回答问题、精华、置顶、标签、成员、合集、专栏、搜索圈子/主题/文章，或需要登录/查看登录状态/排查认证与接口错误、查看我的账号信息时，必须使用本 Skill。即使只涉及单一操作（如查圈子 ID、看一条主题详情、回复一条评论），也应触发。"
metadata:
  version: "0.1.0"
  channels: "cli（xinyu-cli）"
  cliHelp: "xinyu-cli --help"
---

# 新语圈子操作指南（CLI 通道）

本 Skill 覆盖通过 `xinyu-cli` 操作新语圈子的全部场景：认证、圈子管理、内容搜索、主题查看与发布、评论互动、提问与回答。

> **默认假设 `xinyu-cli` 已安装且已登录**，不要每次主动检查。仅在命令报错时按需处理（见 [`references/auth-errors.md`](references/auth-errors.md)）。

> 本 Skill 示例中的圈子 ID、主题 ID、用户 ID 均为示例值，执行前必须通过查询结果或用户输入取得真实 ID，不得直接复用示例值。

## 执行通道

本 Skill 只有 **CLI 通道**（`xinyu-cli`）：

1. 宿主可执行 `xinyu-cli` → 直接按本 Skill 调用
2. 命令不存在 → 按 [`references/auth-errors.md`](references/auth-errors.md#cli-未安装恢复流程) 引导安装（`npm i -g @xinyu-open/xinyu-cli`）后重试原操作
3. 未登录 / 登录失效 → 引导执行 `xinyu-cli auth login`（扫码登录，详见 [`references/auth-errors.md`](references/auth-errors.md)）

## 执行模式

按以下顺序路由，命中即执行：

1. **原子操作** — 请求明确对应一个命令：读对应 reference，直接调用
2. **探索模式** — 未命中：用 `xinyu-cli api raw` 或 `xinyu-cli --help` 发现能力（见 [`references/cli-exploration.md`](references/cli-exploration.md)）

> 执行原子操作时**不得**预先运行无关的 `doctor` 或 `--help`。仅在能力不匹配或调用失败时回退到探索模式。

## 快速索引

| 用户想要… | 去哪看 |
|----------|--------|
| 登录 / 查看登录状态 / 排查认证或错误码 | → [`references/auth-errors.md`](references/auth-errors.md) |
| 列出我加入或我创建的圈子 / 查圈子详情（含绑定专栏） | → [`references/group-list.md`](references/group-list.md) |
| 查看圈子标签 | → [`references/group-tags.md`](references/group-tags.md) |
| 查看成员列表 / 按昵称搜索成员 / 看成员详情 | → [`references/group-members.md`](references/group-members.md) |
| 查看合集 / 合集内主题 | → [`references/group-collections.md`](references/group-collections.md) |
| 按关键词搜索圈子、主题、文章、用户、标签 | → [`references/search.md`](references/search.md) |
| 浏览圈子主题列表（全部/精华/问答/待回答/文章/图片） | → [`references/topic-list.md`](references/topic-list.md) |
| 查看主题详情 / 评论 / 楼中楼回复 | → [`references/topic-detail.md`](references/topic-detail.md) |
| 发布主题 | → [`references/topic-create.md`](references/topic-create.md) |
| 编辑主题（正文 / 标题 / 标签 / 精华 / 置顶） | → [`references/topic-edit.md`](references/topic-edit.md) |
| 删除主题 | → [`references/topic-delete.md`](references/topic-delete.md) |
| 评论 / 回复某条评论 | → [`references/topic-reply.md`](references/topic-reply.md) |
| 点赞 / 取消点赞 | → [`references/topic-digg.md`](references/topic-digg.md) |
| 发起提问 | → [`references/question-post.md`](references/question-post.md) |
| 查看我发起的 / 我回答过的提问 | → [`references/question-list.md`](references/question-list.md) |
| 查看提问详情 | → [`references/question-detail.md`](references/question-detail.md) |
| 回答别人向我提的问题 | → [`references/question-answer.md`](references/question-answer.md) |
| 上传图片（发主题/评论配图） | → [`references/upload-image.md`](references/upload-image.md) |
| 查看我的账号信息 | → [`references/user-info.md`](references/user-info.md) |
| 直接调底层接口 / 探索未封装能力 | → [`references/cli-exploration.md`](references/cli-exploration.md) |
| 查接口路径与字段（探索模式底表） | → [`references/endpoint-catalog.md`](references/endpoint-catalog.md) |
| 了解安全规则（写入确认） | → [安全规则](#安全规则) |

## 资源关系

```
User (user_id) — 已登录账户
│
├── Group (group_id) — 圈子
│   ├── Topic (topic_id) — 主题 / 提问 / 文章
│   │   ├── Comment (comment_id)
│   │   │   └── 楼中楼 Reply (reply_to_comment_id)
│   │   ├── Question (question_id) — 提问类型专属
│   │   └── Tag (tag_id)
│   ├── Member (user_id) — 成员
│   └── Collection (collection_id) — 合集；圈子可绑定一个专栏
└── User (user_id) — 其他用户
```

**核心概念：**

- **圈子（Group）**：内容单元，由 `group_id` 唯一标识；类型有免费 / 付费 / 专栏圈子。
- **主题（Topic）**：圈子内内容，`topic_type`：`1` 普通主题、`2` 提问、`3` 文章。
- **提问（Question）**：独立于主题存在，被提问者回答后才生成一条 `topic_type=2` 的主题；提问详情只有提问者与被提问者可见。
- **精华（Digested）/ 置顶（Sticky）**：圈主/管理员权限操作，通过 `topic edit` 设置。
- **会员与可见性**：主题正文对**圈子成员**开放；非成员、或会员过期后发布的主题**无法获取**（CLI 会直接报权限错误，不会返回摘要）。

## 安全规则

- **禁止输出或传播登录凭证** —— token 存在本地配置文件，不在终端明文打印、不分享给他人
- **写入操作前必须确认用户意图**：发主题、编辑主题、删除主题、评论、点赞、发起提问、回答提问
- 删除主题需要 `--yes`，执行前必须向用户二次确认
- 不确定 `group_id` / `topic_id` / `comment_id` / `question_id` 时，先用查询命令确认，再执行写入
- 正文修改需通过内容审核；审核期间主题可能短暂不可见，不要重复提交
- 权限类错误（退出码 `3`，如 `2430` 非圈子成员、`2463` 无权查看该问题）应先向用户说明，不要通过换接口绕过
- `api raw` 不得绕过上述确认规则；探索模式发现的写入接口同样需要用户确认

## 命令总览

| 域 | 命令 |
|----|------|
| 认证 | `auth login` / `auth status` / `auth logout` / `doctor` |
| 圈子 | `group list` / `group detail` / `group tags` / `group members` / `group member` / `group collections` / `group collection-topics` |
| 搜索 | `search topics` / `search articles` / `search groups` / `search users` / `search tags` |
| 主题 | `topic list` / `topic sticky` / `topic detail` / `topic comments` / `topic replies` / `topic create` / `topic edit` / `topic delete` / `topic reply` / `topic digg` |
| 提问 | `question post` / `question list` / `question detail` / `question answer` |
| 其他 | `upload image` / `user info` / `api raw` |

全局参数：`--json`（输出完整响应体，含 `has_more` / `next_cursor` 等分页字段）、`--base-url`（覆盖接口地址）、`--version`、`--help`。

## 退出码约定

| 退出码 | 含义 |
|-------|------|
| `0` | 成功 |
| `1` | 参数错误或网络错误 |
| `2` | 业务错误（接口返回 `status_code != 0`） |
| `3` | 权限不足（非成员 / 无权操作 / 无权查看） |
| `4` | 未登录或登录失效 |

## 反例（不要做）

| ❌ 不要做 | ✅ 应该做 |
|----------|----------|
| 用 `topic list` 翻页人工筛选关键词 | 用 `search topics --group-id <id> --keyword` |
| 用户只给圈子名称时，要求用户自己提供 `group_id` | 先 `group list` 或 `search groups` 查到 ID 再继续 |
| 名称命中多个圈子时默认取第一个 | 列出候选（`group_id` + 名称）让用户确认 |
| `topic detail` 报权限错误时改用 `topic comments` 绕过 | 告知用户需加入圈子 / 会员已过期 |
| 编辑正文后立刻重复提交 | 等待审核结果，审核中重复提交会失败 |
| 用 `topic edit` 改文章主题或问答主题的正文 | 文章主题正文在创作端维护，问答主题用 `question answer` |
