# 认证与常见错误

本文档覆盖 `xinyu-cli` 的登录、登出、登录态排查与通用错误处理。

## 登录方式

`xinyu-cli` 使用**扫码登录**：命令输出二维码与链接，用户用微信扫码后在小程序内确认，CLI 轮询到确认结果后自动换取并保存 token。

| 命令 | 说明 |
|------|------|
| `xinyu-cli auth login` | 扫码登录（首次使用、token 失效或切换账户） |
| `xinyu-cli auth login --no-qr` | 只输出链接不渲染二维码（终端不支持二维码时） |
| `xinyu-cli auth login --qr-png /tmp/qr.png` | 二维码存成 PNG，图片在聊天窗口里能正常扫 |
| `xinyu-cli auth login > log 2>&1` | 输出被重定向时 CLI 会自动跳过二维码，只留链接 |
| `xinyu-cli auth login --timeout 120` | 自定义等待确认的秒数（默认取服务端 300 秒） |
| `xinyu-cli auth status` | 查看当前登录账户，未登录返回退出码 `4` |
| `xinyu-cli auth logout` | 清除本地凭据 |
| `xinyu-cli doctor` | 自检 Node 版本、接口地址、本地凭据、登录态 |

## 扫码登录流程

`xinyu-cli auth login` 启动后：

1. 真终端里输出二维码和 `https://wxmpurl.cn/...` 链接，**5 分钟内有效**
2. 用户用微信扫码（或在微信中打开链接），进入小程序授权页并点击确认
3. CLI 每 2 秒轮询一次，确认后自动换取 token 并保存
4. 输出「✓ 已登录：昵称（user_id）」

> 作为 AI Agent 帮用户登录时，在后台运行 `xinyu-cli auth login`（输出重定向到日志），然后二选一：
>
> **A. 只给链接**（最简单，微信里打开链接即可确认）：
>
> ```bash
> nohup xinyu-cli auth login > /tmp/xinyu_login.log 2>&1 &
> sleep 3; grep -o 'https://wxmpurl\.cn/[A-Za-z0-9]*' /tmp/xinyu_login.log | head -1
> ```
>
> **B. 给一张能扫的图**（用户更愿意扫码时）：加 `--qr-png`，把生成的 PNG 当图片展示给用户。
>
> ```bash
> nohup xinyu-cli auth login --qr-png /tmp/xinyu-qr.png > /tmp/xinyu_login.log 2>&1 &
> sleep 3; ls -l /tmp/xinyu-qr.png
> ```

> **不要 `cat` 日志把字符二维码贴进对话**：它是半块字符（`▀▄█`）画的，只有等宽字体 + 相称行高的真终端才扫得出来，聊天窗口/网页必然把方块拉歪、行错位。CLI 在输出被重定向时已自动跳过字符二维码，`cat` 出来只有链接。
> **不要要求用户把验证码、token 粘贴到对话中**。链接和图片都 5 分钟过期，过期后重新执行命令换一份。

## 凭据存储

- 位置：`~/.config/xinyu/config.json`（权限 `0600`）
- 内容：接口地址、access token、refresh token、user_id、昵称
- 可通过环境变量覆盖：`XINYU_BASE_URL`、`XINYU_TOKEN`、`XINYU_CONFIG_DIR`
- access token 过期时服务端会自动续期，CLI 会把续期后的 token 写回配置文件

## 常见错误处理

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| `xinyu-cli: command not found` | CLI 未安装 | 见下方 [CLI 未安装恢复流程](#cli-未安装恢复流程) |
| `✗ 未登录 [code 1006]` / 退出码 `4` | 未登录或 token 失效 | `xinyu-cli auth login` |
| `认证校验失败 [code 1001]` / `认证已过期 [code 1003]` | token 无效或服务端拒绝 | 重新登录 |
| `登录的用户不是圈子成员 [code 2430]` / 退出码 `3` | 当前账号不在该圈子 | 提示用户加入圈子；不要换接口绕过 |
| `无权查看该主题` / 退出码 `3` | 非成员，或会员已过期（主题发布于过期之后） | 提示用户加入/续费，不要重试 |
| `无权查看该问题 [code 2463]` | 提问详情仅提问者与被提问者可见 | 说明权限限制 |
| `无权限操作 [code 112]` / `无管理权限 [code 2431]` | 需要圈主/管理员权限 | 说明需要圈主操作 |
| `参数不合法 [code 102]` | 缺少必填参数或参数非法 | 对照命令的「参数」表补齐 |
| `请求失败（...）：fetch failed` / 退出码 `1` | 网络不可达或接口地址错误 | 检查网络；必要时 `--base-url` 指定其他环境 |
| `HTTP 502/504` | 网关或服务端异常 | 稍后重试 |

## CLI 未安装恢复流程

命令报 `command not found` 时不要中止任务，按以下流程恢复：

**1. 确认 Node.js 版本（需 >= 18.17）：**

```bash
node -v
```

**2. 全局安装并验证：**

```bash
npm install -g @xinyu-open/xinyu-cli
xinyu-cli --version
```

**3. 引导登录：**

```bash
xinyu-cli auth login
```

**4. 安装并登录成功后，自动重试用户原本要执行的操作**，不需要用户重复指令。

## 参考

- [cli-exploration](cli-exploration.md) — 探索模式与直接调用接口
- [SKILL.md](../SKILL.md) — 能力索引与安全规则
