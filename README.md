# xinyu-skill

[![npm version](https://img.shields.io/npm/v/@xinyu-open/xinyu-cli.svg)](https://www.npmjs.com/package/@xinyu-open/xinyu-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

新语圈子官方 CLI 与 Agent Skill —— 让 AI 成为你在新语圈子的运营助手。

[安装](#安装与快速开始) · [能做什么](#能做什么) · [Skill](#agent-skill) · [认证](#认证) · [命令](#功能详情) · [权限](#权限与可见性重要) · [安全](#安全与风险提示)

## 为什么用 xinyu-skill

- **对话即操作** — 一句话完成查圈子、搜内容、发主题、回评论、答提问，不用来回切页面
- **权限不越界** — 只能访问你账号本就有权查看的圈子内容；非成员读不到正文
- **写入可控** — 发帖、评论、回答前必须确认；删除主题强制 `--yes`；token 不打印、不进日志
- **零配置负担** — 一条命令扫码登录，凭据存在本地 `0600` 文件，服务端自动续期
- **可探索** — 未封装的能力用 `xinyu-cli api raw` 直接调接口，不会被卡住

## 能做什么

### 核心能力

- **圈子管理**：列出我加入/创建的圈子，查看详情、标签、成员、合集与绑定专栏
- **成员检索**：分页浏览成员，按昵称/新语号模糊搜索，查看成员详情
- **内容搜索**：按关键词搜索圈子内主题、全站文章、圈子、用户、标签
- **主题查看**：主题列表（全部/精华/问答/待回答/文章/图片/文件）、正文详情、评论、楼中楼回复、置顶
- **发布互动**：发布主题、编辑正文/标题/标签/精华/置顶、删除主题、评论回复、点赞
- **提问问答**：发起提问、查看我发起的与已回答的提问、查看提问详情、回答提问
- **图片上传**：本地图片上传后用于主题、评论、回答配图
- **账号信息**：查看当前登录账号资料
- **兜底探索**：`api raw` 直接调用任意后端接口

### 典型使用场景

- 看看我加入了哪些圈子，某个圈子最近在聊什么
- 搜一下这个圈子里关于「复盘」的主题和文章
- 把这条主题的正文和评论完整看一遍
- 帮我发一条本周复盘，带上图片和标签
- 回复这条评论，语气正式一点
- 有哪些还没回答的提问？挑重点帮我起草回答
- 把这条主题设成精华、换个标题、补两个标签
- 这条帖子写错了，帮我删掉

## 适合谁用

- **圈主 / 运营**：批量整理内容、处理待回答提问、维护标签与精华
- **普通成员**：快速检索圈子里的历史内容、参与讨论
- **开发者**：把 `xinyu-cli` 接进脚本或自动化流程

---

## 安装与快速开始

> **Note for AI assistants:** 如果你是 AI Agent 且正在协助用户安装，直接跳转到[快速开始（AI Agent）](#快速开始ai-agent)，那里列出了你需要执行的全部步骤。

### 快速开始（人类用户）

**第一步：安装 CLI**

```bash
npm install -g @xinyu-open/xinyu-cli
```

要求 Node.js >= 18.17。

**第二步：安装 Skill**

```bash
npx skills add https://github.com/xinyu-open/xinyu-skill --yes
```

**第三步：扫码登录**

```bash
xinyu-cli auth login
```

终端会输出二维码和链接，用微信扫码并在小程序内确认即可，5 分钟内有效。

**第四步：验证**

```bash
xinyu-cli doctor
xinyu-cli group list
```

### 快速开始（AI Agent）

> 以下步骤面向 AI Agent，需要用户在手机或微信中配合完成确认。

**第 1 步 — 安装 CLI**

```bash
npm install -g @xinyu-open/xinyu-cli
xinyu-cli --version
```

**第 2 步 — 安装 Skill**

```bash
npx skills add https://github.com/xinyu-open/xinyu-skill --yes
```

**第 3 步 — 扫码登录**

> 在后台运行此命令。它会输出二维码与链接，把链接转给用户，等待用户在微信中确认后命令自动退出。

```bash
xinyu-cli auth login
```

如果终端无法渲染二维码，加 `--no-qr` 只输出链接。

**第 4 步 — 验证并继续原任务**

```bash
xinyu-cli doctor
xinyu-cli group list
```

验证通过后，自动重试用户原本要执行的操作，不需要用户重复指令。

---

## Agent Skill

只需安装**一个** `xinyu` Skill，即可获得全部能力：

| 能力 | 说明 |
|------|------|
| 认证与排错 | 扫码登录、登录态诊断、错误码与退出码含义 |
| 圈子管理 | 圈子列表与详情、标签、成员与成员搜索、合集 |
| 内容搜索 | 主题、文章、圈子、用户、标签五类搜索 |
| 主题操作 | 列表、详情、评论、回复、发布、编辑、删除、点赞 |
| 提问问答 | 发起提问、查看提问、回答提问 |
| 探索模式 | `api raw` 调底层接口，附接口底表 |

Skill 内部按两层路由执行：**原子操作**（命中已知命令 → 直接调用）→ **探索模式**（未命中 → 用 `api raw` 发现能力）。所有命令细节由 `skills/xinyu/references/` 下的文档承载，`SKILL.md` 只负责触发、路由与安全规则。

---

## 认证

`xinyu-cli` 使用**扫码登录**，不需要密码：

| 命令 | 说明 |
|------|------|
| `xinyu-cli auth login` | 扫码登录（微信小程序内确认） |
| `xinyu-cli auth login --no-qr` | 只输出链接不渲染二维码 |
| `xinyu-cli auth login --timeout 120` | 自定义等待秒数（默认取服务端 300 秒） |
| `xinyu-cli auth status` | 查看登录状态，未登录返回退出码 `4` |
| `xinyu-cli auth logout` | 清除本地凭据 |
| `xinyu-cli doctor` | 自检 Node 版本、接口地址、凭据、登录态 |

**凭据存储**：`~/.config/xinyu/config.json`（权限 `0600`），access token 过期时服务端自动续期并回写。

**环境变量**：`XINYU_BASE_URL`（接口地址）、`XINYU_TOKEN`（临时注入 token）、`XINYU_CONFIG_DIR`（配置目录）。

**退出码**：

| 退出码 | 含义 |
|-------|------|
| `0` | 成功 |
| `1` | 参数或网络错误 |
| `2` | 业务错误（接口返回 `status_code != 0`） |
| `3` | 权限不足（非圈子成员、无权操作、无权查看） |
| `4` | 未登录或登录失效 |

---

## 功能详情

> ⚠️ = 写入操作，执行前需向用户确认。

### 圈子管理（group）

```bash
xinyu-cli group list                              # 我加入的所有圈子
xinyu-cli group list --owned                      # 我创建的圈子
xinyu-cli group list --owned --type 2             # 只看付费圈子
xinyu-cli group detail --group-id <id>            # 详情：成员数、圈主、我的角色、绑定专栏、圈子介绍
xinyu-cli group tags --group-id <id>              # 圈子标签（用于发帖打标签）
```

**成员：**

```bash
xinyu-cli group members --group-id <id>                       # 成员列表（分页）
xinyu-cli group members --group-id <id> --keyword 张三        # 按昵称/新语号搜索
xinyu-cli group member --group-id <id> --user-id <uid>        # 成员详情
```

**合集：**

```bash
xinyu-cli group collections --group-id <id>                   # 合集列表
xinyu-cli group collection-topics --collection-id <id>        # 合集内主题
```

### 内容搜索（search）

```bash
xinyu-cli search topics --group-id <id> --keyword 复盘        # 圈子内主题（必须带 group-id）
xinyu-cli search articles --keyword 复盘                      # 全站文章
xinyu-cli search groups --keyword 读书                        # 圈子
xinyu-cli search users --keyword 张三                         # 用户
xinyu-cli search tags --keyword 写作                          # 标签
```

主题/文章支持排序与时间范围：`--sort 1|2|3`（相关性/最新/热门）、`--time-range 1|2|3|4`（一周/一月/一季/一年），每页默认 20 条。

### 主题查看（topic）

```bash
xinyu-cli topic list --group-id <id>                          # 最新主题
xinyu-cli topic list --group-id <id> --scope digest           # 只看精华
xinyu-cli topic list --group-id <id> --scope pending_question # 待回答的提问
xinyu-cli topic list --group-id <id> --tag-id <tag_id>        # 按标签筛选
xinyu-cli topic sticky --group-id <id>                        # 置顶主题
xinyu-cli topic detail --topic-id <id>                        # 正文、作者、标签、互动数
xinyu-cli topic comments --topic-id <id>                      # 评论列表
xinyu-cli topic replies --topic-id <id> --comment-id <cid>    # 楼中楼回复
```

`--scope` 取值：`all`（默认）、`digest`、`question`、`pending_question`、`article`、`pic`、`file`、`owner`。

翻页时命令会在末尾提示下一页参数（列表用 `--end-time`，评论用 `--cursor`）。

### 发布与互动（topic）

```bash
xinyu-cli topic create --group-id <id> --title "本周复盘" --content "正文"   # 发布主题 ⚠️
xinyu-cli topic create --group-id <id> --content "现场" --pics "a.png,b.jpg" # 带图片 ⚠️
xinyu-cli topic create --group-id <id> --content "读书笔记" --tag-ids "1,2"  # 带标签 ⚠️

xinyu-cli topic reply --topic-id <id> --content "很有启发"                   # 评论 ⚠️
xinyu-cli topic reply --topic-id <id> --comment-id <cid> --content "同意"    # 回复评论 ⚠️

xinyu-cli topic digg --topic-id <id>                                        # 点赞 ⚠️
xinyu-cli topic digg --topic-id <id> --undo                                 # 取消点赞 ⚠️
```

**编辑与删除：**

```bash
xinyu-cli topic edit --topic-id <id> --content "修正后的正文"      # 改正文（作者本人，需送审）⚠️
xinyu-cli topic edit --topic-id <id> --title "新标题"              # 改标题（圈主/管理员）⚠️
xinyu-cli topic edit --topic-id <id> --tag-ids "1,2"               # 标签全量替换 ⚠️
xinyu-cli topic edit --topic-id <id> --digest true                 # 设为精华 ⚠️
xinyu-cli topic edit --topic-id <id> --sticky true                 # 置顶 ⚠️
xinyu-cli topic delete --topic-id <id> --yes                       # 删除主题（不可恢复）⚠️
```

> 正文修改走内容多版本 + 送审链路，审核期间主题可能短暂不可见；文章主题正文请到创作端维护。

### 提问与回答（question）

```bash
xinyu-cli question post --group-id <id> --questionee-uid <uid> --content "问题"  # 发起提问 ⚠️
xinyu-cli question post --group-id <id> --questionee-uid <uid> --content "问题" --anonymous  # 匿名
xinyu-cli question list                                                          # 我发起的提问
xinyu-cli question list --role answered                                          # 我回答过的提问
xinyu-cli question detail --question-id <id>                                     # 提问详情
xinyu-cli question answer --question-id <id> --group-id <id> --content "回答"     # 回答 ⚠️
xinyu-cli question answer --question-id <id> --group-id <id> --content "回答" --close  # 不公开回答
```

- 提问详情仅**提问者与被提问者**可见
- 回答会生成一条问答主题，每个问题只能回答一次

### 图片与账号

```bash
xinyu-cli upload image --file ./cover.png     # 返回 uri，可直接用于 --pics
xinyu-cli user info                           # 我的账号资料
xinyu-cli user info --user-id <uid>           # 指定用户
```

> 当前只支持图片，暂不支持文件附件。

### 高级：直接调用接口

```bash
xinyu-cli api raw --method GET --path /group/topics --query '{"group_id":"1","scope":"all"}'
xinyu-cli api raw --method POST --path /group/topic --body '{"data":{...}}'
```

接口底表见 [`skills/xinyu/references/endpoint-catalog.md`](skills/xinyu/references/endpoint-catalog.md)。未在底表中的路径视为可能不存在，不要凭猜测调用；写入类调用同样需要用户确认。

---

## 权限与可见性（重要）

| 场景 | 行为 |
|------|------|
| 我是圈子有效成员 | 可读正文、评论，可发主题与评论 |
| 从未加入该圈子 | `topic detail` / `topic list` / `search topics` 直接报权限错误（退出码 `3`），**不返回摘要** |
| 会员已过期，主题在过期后发布 | 同上，无权访问 |
| 会员已过期，主题在过期前发布 | 可正常查看 |
| 提问详情 | 仅提问者与被提问者可见，其他人 `无权查看该问题` |
| 精华 / 置顶 / 改标题与标签 | 需要圈主或管理员权限 |

CLI 不会把「摘要」当正文返回，也不会为了成功而换接口绕过权限限制。

---

## 安全与风险提示

本工具以你的账号身份运行，请务必注意：

- **写入前确认**：发主题、编辑、评论、回答、点赞前必须确认内容；删除主题强制 `--yes` 且不可恢复
- **凭据安全**：token 存于本地 `0600` 配置文件，不在终端打印、不写入日志、不建议粘贴到对话中
- **权限边界**：只能访问当前账号有权查看的内容；不会也不应通过换接口绕过限制
- **内容审核**：发布的正文会走平台审核，审核不通过会直接失败，修改后再试
- **`api raw`**：可调用任意接口，写入类操作的风险与已封装命令相同，请同样确认后再执行

---

## 仓库结构

```
packages/xinyu-cli/     # CLI 实现（ESM，Node >= 18.17，唯一依赖 qrcode-terminal）
skills/xinyu/           # Skill：SKILL.md + 21 篇 references
scripts/check-docs.py   # 文档校验：死链、结构、索引完整性
```

## 开发

```bash
npm install
node packages/xinyu-cli/bin/xinyu-cli.js --help
python3 scripts/check-docs.py
```

发布新版本：

```bash
cd packages/xinyu-cli
npm version patch
npm publish
```

开发约定见 [`CLAUDE.md`](CLAUDE.md)。

## License

MIT
