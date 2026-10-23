# upload image（上传图片）

上传本地图片，返回可直接用于主题/评论/回答的图片 `uri`。

## 命令

```bash
xinyu-cli upload image --file ./cover.png
xinyu-cli upload image --file ./shot.png --dir cmt/
```

## 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--file <path>` | **是** | 本地图片路径（png / jpg / jpeg / gif / webp / bmp / heic） |
| `--dir <prefix>` | 否 | 目录前缀，默认 `post/`；评论用 `cmt/`，头像 `avatar/`，封面 `cover/` |

## 输出

```
post/dbdoedlb0fteou062110.png
图片地址：https://p2-eden.millewill.com/post/dbdoedlb0fteou062110.png?auth_key=...
```

第一行是 `uri`，可直接传给 `--pics`；第二行是带签名的访问地址，有有效期，仅供人工预览。

## 说明

- 上传需要登录
- 两段式上传：先向服务端取 STS 临时凭证，再用签名直传 OSS，图片内容不经过业务接口
- 单张图片不超过 5MB
- 扩展名沿用原文件，CLI 不做格式转换（web 端会压缩转 webp，这里保持原格式与内容一致）
- 一次只能上传一张；多图请多次调用，再用逗号拼接 `--pics`
- 当前**只支持图片**，暂不支持文件附件（主题的 `files` 字段 CLI 不提供上传入口）
- 上传成功但未被使用时不会自动清理，避免上传大量无用图片

## 错误说明

| 错误 | 原因 |
|------|------|
| `读取图片失败：...` | 路径不存在或无权限读取 |
| `不支持的图片格式 .txt` | 扩展名不在支持列表内 |
| `图片大小 6.2MB，超过 5MB 限制` | 文件过大 |
| `获取 OSS 上传凭证失败` | 服务端未返回凭证，重试一次 |
| `上传到 OSS 失败（HTTP 403）` | STS 凭证过期或签名失败，重试 |
| `上传图片需要登录` | 未登录 |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [topic-create](topic-create.md) — 发主题带图
- [topic-reply](topic-reply.md) — 评论带图
- [question-answer](question-answer.md) — 回答带图
