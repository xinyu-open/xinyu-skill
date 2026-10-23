# upload image（上传图片）

上传本地图片，返回可直接用于主题/评论/回答的图片 `uri`。

## 命令

```bash
xinyu-cli upload image --file ./cover.png
```

## 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--file <path>` | **是** | 本地图片路径（jpg / png / gif / webp） |

## 输出

```
abc123.png
图片地址：https://img.xinyu.zone/abc123.png
```

第一行是 `uri`，可直接传给 `--pics`；第二行是可直接访问的地址。

## 说明

- 上传需要登录
- 服务端会做压缩与大小校验，超大图片会返回 `图片太大，无法上传`
- 一次只能上传一张；多图请多次调用，再用逗号拼接 `--pics`
- 当前**只支持图片**，暂不支持文件附件（主题的 `files` 字段 CLI 不提供上传入口）
- 上传成功但未被使用时不会自动清理，避免上传大量无用图片

## 错误说明

| 错误 | 原因 |
|------|------|
| `读取图片失败：...` | 路径不存在或无权限读取 |
| `图片太大，无法上传 [code 101]` | 超过服务端大小限制 |
| `上传成功但未返回图片 uri` | 服务端异常，重试一次 |
| `上传图片需要登录` | 未登录 |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [topic-create](topic-create.md) — 发主题带图
- [topic-reply](topic-reply.md) — 评论带图
- [question-answer](question-answer.md) — 回答带图
