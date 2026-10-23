# @xinyu-open/xinyu-cli

新语圈子命令行工具：圈子管理、内容搜索、主题查看、发布互动、提问问答。

```bash
npm install -g @xinyu-open/xinyu-cli

xinyu-cli auth login     # 微信扫码登录（5 分钟内有效）
xinyu-cli group list     # 我加入的圈子
xinyu-cli --help         # 全部命令
```

## 能力

```bash
# 圈子
xinyu-cli group list | group detail | group tags | group members | group collections

# 搜索（主题 / 文章 / 圈子 / 用户 / 标签）
xinyu-cli search topics --group-id <id> --keyword 复盘

# 主题
xinyu-cli topic list --group-id <id> --scope digest
xinyu-cli topic detail --topic-id <id>
xinyu-cli topic create --group-id <id> --content "正文"
xinyu-cli topic edit --topic-id <id> --content "修正后的正文"
xinyu-cli topic reply --topic-id <id> --content "评论"

# 提问
xinyu-cli question post --group-id <id> --questionee-uid <uid> --content "问题"
xinyu-cli question answer --question-id <id> --group-id <id> --content "回答"

# 图片（直传 OSS，返回 uri）
xinyu-cli upload image --file ./a.png
xinyu-cli upload image --file ./a.png --dir cmt/

# 兜底：直接调接口
xinyu-cli api raw --method GET --path /group/topics --query '{"group_id":"1","scope":"all"}'
```

## 说明

- Node.js >= 18.17，唯一依赖 `qrcode-terminal`
- 凭据存于 `~/.config/xinyu/config.json`（权限 `0600`），token 过期自动续期
- 环境变量：`XINYU_BASE_URL`、`XINYU_TOKEN`、`XINYU_CONFIG_DIR`
- 退出码：`0` 成功 / `1` 参数或网络 / `2` 业务错误 / `3` 权限不足 / `4` 未登录
- 非圈子成员无法读取主题正文，命令直接报权限错误，不返回摘要

完整的命令说明与 Agent Skill 见 [github.com/xinyu-open/xinyu-skill](https://github.com/xinyu-open/xinyu-skill)。

## License

MIT
