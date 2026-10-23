# CLAUDE.md

本仓库的 AI Agent 开发指南（Codex、Cursor、Claude Code 等通用）。

## 项目概览

`xinyu-skill` 由两部分组成：

- `packages/xinyu-cli/`：Node.js CLI（ESM，Node >= 18.17），唯一运行时依赖 `qrcode-terminal`
- `skills/xinyu/`：纯 Markdown 的 Skill 文档包，无构建、无测试

CLI 通过 HTTPS 调用新语后端（`https://xinyu.zone/eden/v1`），认证为扫码登录（复用服务端 `mini-web-login` 设备流）。

## 目录结构

```
skills/xinyu/
├── SKILL.md                 # 触发词、执行通道、路由、能力索引、安全规则
└── references/
    ├── auth-errors.md       # 认证与通用错误（唯一来源）
    ├── cli-exploration.md   # 探索模式：api raw
    ├── endpoint-catalog.md  # 接口底表
    └── <domain>-<verb>.md   # 原子操作文档
```

## Reference 文档模板

**只读类**：`# 标题` → 描述 → `## 命令` → `## 参数` → `## 输出` → `## 说明` → `## 错误说明` → `## 参考`

**写入/删除类**：`# 标题` → 描述 → `> [!CAUTION]`（确认项）→ 可选 `> [!IMPORTANT]` → `## 命令` → `## 参数` → `## 输出` → `## 推荐工作流` → `## 失败语义` → `## 错误说明` → `## 参考`

约定：

- 本仓库只有 CLI 通道，不再写 MCP 段落
- 通用错误（1006、102、网络失败）统一写在 `auth-errors.md`，各文档只列特有错误，末尾给 fallback 链接
- 每个新增 reference 必须在 `SKILL.md` 的快速索引表中登记，否则 `scripts/check-docs.py` 会报错

## 新增命令的步骤

1. 在 `packages/xinyu-cli/src/cmd/<domain>.js` 中新增 handler（参数用 `src/flags.js` 的 `str/optionalInt/optionalList/boolFlag`）
2. 若需要新接口，先把路径补进 `skills/xinyu/references/endpoint-catalog.md`
3. 更新 `src/main.js` 的帮助文本
4. 新增/更新对应 reference，并在 SKILL.md 索引登记
5. 运行 `python3 scripts/check-docs.py` 与本地冒烟测试

## 代码约定

- ID 一律按字符串处理（后端 int64 序列化为字符串）
- 成功判定：`status_code === 0`；非 0 由 `src/errors.js` 转成带退出码的错误
- 退出码：`0` 成功 / `1` 参数或网络 / `2` 业务 / `3` 权限 / `4` 认证
- 写入命令要支持 `--json`，删除类必须要求 `--yes`
- 主题正文读取统一走 `fetchTopicOrFail`：`allow_view !== true` 视为无权访问，**不做摘要降级**

## 安全

- 不打印、不记录 token；配置文件权限 `0600`
- 写入类操作在文档里必须有 `> [!CAUTION]` 确认项
- 不得为了「让命令成功」而绕过权限错误
