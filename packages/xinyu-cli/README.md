# xinyu-cli

新语圈子命令行工具：圈子管理、内容搜索、主题查看、发布互动、提问问答。

```bash
npm install -g xinyu-cli
xinyu-cli auth login     # 微信扫码登录
xinyu-cli group list     # 我加入的圈子
xinyu-cli --help         # 全部命令
```

- Node.js >= 18.17
- 唯一依赖：`qrcode-terminal`（终端二维码渲染）
- 凭据存于 `~/.config/xinyu/config.json`（权限 0600）

退出码：`0` 成功 / `1` 参数或网络 / `2` 业务错误 / `3` 权限不足 / `4` 未登录。
