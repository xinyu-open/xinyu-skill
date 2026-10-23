# upload image（上传图片）

上传本地图片或公网图片链接，返回可直接用于主题/评论/回答的图片 `uri`。

## 命令

```bash
xinyu-cli upload image --file ./cover.png
xinyu-cli upload image --file ./shot.png --dir cmt/
xinyu-cli upload image --url "https://example.com/a.png"
```

## 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--file <path>` | 二选一 | 本地图片路径（png / jpg / jpeg / gif / webp / bmp / heic） |
| `--url <link>` | 二选一 | 公网图片链接，CLI 会先下载再上传 |
| `--dir <prefix>` | 否 | 目录前缀，默认 `post/`；评论用 `cmt/`，头像 `avatar/`，封面 `cover/` |

`--file` 与 `--url` 必须且只能提供一个。

## 输出

```
post/dbdoedlb0fteou062110.png
图片地址：https://p2-eden.millewill.com/post/dbdoedlb0fteou062110.png?auth_key=...
```

第一行是 `uri`，可直接传给 `--pics`；第二行是带签名的访问地址，有有效期，仅供人工预览。

## 用户直接贴图时

宿主（CodeBuddy、Codex、Claude Code 等）通常会把聊天框里粘贴的图片落盘，并在消息中给出路径，形如 `@image:/…/assets/image.xxxx.png`。**直接取该路径走 `--file`，不要要求用户再提供一次。**

| 用户给的是 | 用什么 |
|-----------|--------|
| 本地路径 / 已落盘的贴图路径 | `--file` |
| 公网图片链接 | `--url` |
| 只有图片、上下文里没有路径 | 请用户保存到工作区，或改发可访问的链接 |

## 说明

- 上传需要登录
- 两段式上传：先向服务端取 STS 临时凭证，再用签名直传 OSS，图片内容不经过业务接口
- 单张图片不超过 5MB
- 扩展名沿用原文件，CLI 不做格式转换（web 端会压缩转 webp，这里保持原格式与内容一致）
- 远端 URL 下载超时 30 秒；CDN 返回 `application/octet-stream` 时按 URL 后缀判断格式
- 一次只能上传一张；多图请多次调用，再用逗号拼接 `--pics`
- 当前**只支持图片**，暂不支持文件附件（主题的 `files` 字段 CLI 不提供上传入口）
- 上传成功但未被使用时不会自动清理，避免上传大量无用图片

## 错误说明

| 错误 | 原因 |
|------|------|
| `需要 --file <本地路径> 或 --url <图片地址>` | 两者都没给 |
| `--file 与 --url 只能二选一` | 两者同时给了 |
| `读取图片失败：...` | 路径不存在或无权限读取 |
| `不支持的图片格式 .txt` | 扩展名不在支持列表内 |
| `图片大小 6.2MB，超过 5MB 限制` | 文件或远端图片过大 |
| `下载图片失败（HTTP 403）` | 链接失效、需要登录态，或 CDN 拒绝访问 |
| `无法识别远程图片格式` | URL 无后缀且 content-type 不可用，请先下载到本地用 `--file` |
| `获取 OSS 上传凭证失败` | 服务端未返回凭证，重试一次 |
| `上传到 OSS 失败（HTTP 403）` | STS 凭证过期或签名失败，重试 |
| `上传图片需要登录` | 未登录 |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [topic-create](topic-create.md) — 发主题带图
- [topic-reply](topic-reply.md) — 评论带图
- [question-answer](question-answer.md) — 回答带图
