# 安装指南（面向 AI Agent）

本文档供 AI Agent 阅读并执行，帮助用户完成 `xinyu-cli` 与 Skill 的安装。

## 前置条件

- Node.js >= 18.17（`node -v` 检查）
- 一台上手边可用的手机（微信扫码登录）

## 安装步骤

### 1. 安装 CLI

```bash
npm install -g xinyu-cli
xinyu-cli --version
```

### 2. 安装 Skill

```bash
npx skills add https://github.com/xinyu-open/xinyu-skill --yes
```

### 3. 扫码登录

> 在后台运行，命令会输出二维码与链接，把链接转给用户，等待其微信确认后命令自动退出。

```bash
xinyu-cli auth login
```

如果终端无法渲染二维码，用 `--no-qr` 只输出链接。

### 4. 验证

```bash
xinyu-cli doctor
xinyu-cli group list
```

## 常见安装问题

| 现象 | 处理 |
|------|------|
| `command not found: xinyu-cli` | 确认 npm 全局 bin 目录在 `PATH` 中，或改用 `npx xinyu-cli` |
| 二维码扫不开 | 用 `--no-qr` 拿链接，在微信里直接打开；链接 5 分钟有效 |
| 提示 `未登录 [code 1006]` | 重新执行 `xinyu-cli auth login` |
| 无法访问接口 | 检查网络；可用 `--base-url` 指定其他环境 |

## 安装完成后

AI Agent 即可通过 `xinyu-cli` 覆盖圈子管理、内容搜索、主题查看、发布互动、提问问答等能力。能力索引见 `skills/xinyu/SKILL.md`。
