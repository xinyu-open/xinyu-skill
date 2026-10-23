# user info（账号信息）

查看当前登录账号或指定用户的基础资料。

## 命令

```bash
# 我的资料
xinyu-cli user info

# 指定用户
xinyu-cli user info --user-id 10001
```

## 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--user-id <id>` | 否 | 不传则为当前登录用户 |

## 输出

分行键值：用户 ID、昵称、新语号、简介、头像。

## 说明

- 常用于确认「当前登录的是谁」，等价信息也可用 `auth status` 查看
- 不传 `--user-id` 且未登录时返回空结果，不会报错
- 需要更多字段（等级、关注数等）时加 `--json`

## 错误说明

| 症状 | 原因 | 处理 |
|------|------|------|
| 输出为空 | 未登录且未指定 `--user-id` | 先登录，或指定用户 ID |
| `账号或者密码不正确 [code 1005]` | 指定的用户不存在或不可见 | 核对 `user_id` |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [group-members](group-members.md) — 查看某人在圈子内的信息
- [auth-errors](auth-errors.md) — 登录状态排查
