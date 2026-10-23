# 探索模式（直接调用底层接口）

当用户请求未命中已封装命令时，用 `api raw` 直接调用后端接口，不要臆造命令。

## 命令

```bash
# GET 请求，query 用 JSON 传
xinyu-cli api raw --method GET --path /group/topics --query '{"group_id":"123456","scope":"all","count":10}'

# POST 请求，body 用 JSON 传
xinyu-cli api raw --method POST --path /group/topic \
  --body '{"data":{"group_id":"123456","topic_type":1,"title":"标题","content":"正文"}}'

# PATCH / DELETE
xinyu-cli api raw --method PATCH --path /group/topic/111 --body '{"edit_data":{"title":"新标题"}}'
xinyu-cli api raw --method DELETE --path /group/topic/111
```

## 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--method <METHOD>` | 否 | HTTP 方法，默认 `GET` |
| `--path <path>` | 是 | 接口路径，相对 `https://xinyu.zone/eden/v1`，如 `/group/topic/111` |
| `--query <json>` | 否 | 查询参数对象 |
| `--body <json>` | 否 | 请求体对象 |

## 输出

恒为接口原始 JSON（`status_code` / `status_msg` / 业务字段），失败时按信封抛出对应退出码。

## 说明

- 服务端接口清单与字段语义见 [endpoint-catalog](endpoint-catalog.md)，**未在清单中的路径视为可能不存在**，不要凭猜测调用
- 写入类接口（POST/PATCH/DELETE）必须先向用户确认内容，与已封装命令的安全规则一致
- 需要登录的接口在未登录时返回 `1006`，先引导 `xinyu-cli auth login`
- 想确认某个路径是否存在，先用只读的 GET 试一次，不要直接试写操作

## 错误说明

| 错误 | 原因 |
|------|------|
| `--path` required | 缺少路径 |
| `--query 不是合法 JSON` / `--body 不是合法 JSON` | JSON 格式错误，注意外层单引号、内部双引号 |

通用错误（1006、102、网络失败等）见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [endpoint-catalog](endpoint-catalog.md) — 接口底表
- [SKILL.md](../SKILL.md) — 能力索引与安全规则
