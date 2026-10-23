# xinyu-skill

新语圈子（xinyu）的 CLI 与 AI Agent Skill —— 让 AI 在对话里帮你查圈子、搜内容、发主题、回评论、答提问。

- **xinyu-cli**：命令行工具（Node.js >= 18.17，唯一依赖 `qrcode-terminal`）
- **xinyu Skill**：纯 Markdown 的能力文档包，供 Claude Code、Codex、Cursor、OpenClaw 等 Agent 使用

## 能做什么

- **圈子管理**：列出我加入/创建的圈子，查看详情、标签、成员、合集与绑定专栏
- **内容搜索**：按关键词搜索圈子内主题、文章、圈子、用户、标签
- **主题查看**：主题列表、正文详情、评论、楼中楼回复、置顶
- **发布互动**：发布主题、编辑正文/标题/标签/精华/置顶、删除主题、评论回复、点赞
- **提问问答**：发起提问、查看提问、回答提问

## 安装

```bash
# 1. 安装 CLI
npm install -g @xinyu-open/xinyu-cli

# 2. 安装 Skill
npx skills add https://github.com/xinyu-open/xinyu-skill --yes

# 3. 扫码登录
xinyu-cli auth login
```

登录时终端会输出二维码与链接，用微信扫码并在小程序内确认即可，5 分钟内有效。

## 快速上手

```bash
# 我加入了哪些圈子
xinyu-cli group list

# 看圈子标签、成员
xinyu-cli group tags --group-id 123456789
xinyu-cli group members --group-id 123456789 --keyword 张三

# 搜圈子里的主题
xinyu-cli search topics --group-id 123456789 --keyword 复盘

# 看主题正文与评论
xinyu-cli topic detail --topic-id 111222333
xinyu-cli topic comments --topic-id 111222333

# 发主题
xinyu-cli topic create --group-id 123456789 --title "本周复盘" --content "正文内容"

# 评论
xinyu-cli topic reply --topic-id 111222333 --content "很有启发"
```

完整命令见 `xinyu-cli --help`。

## 仓库结构

```
packages/xinyu-cli/   # CLI 实现
skills/xinyu/         # Skill：SKILL.md + references
scripts/check-docs.py # 文档静态校验
```

## 开发

```bash
npm install
node packages/xinyu-cli/bin/xinyu-cli.js --help
python3 scripts/check-docs.py
```

## 退出码

| 退出码 | 含义 |
|-------|------|
| 0 | 成功 |
| 1 | 参数或网络错误 |
| 2 | 业务错误 |
| 3 | 权限不足 |
| 4 | 未登录或登录失效 |

## 许可

MIT
