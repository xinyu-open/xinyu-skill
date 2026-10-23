# search（按关键词搜索）

按关键词搜索圈子内的主题、全站文章、圈子、用户、标签。

## 命令

```bash
# 搜索圈子内主题（必须带 group-id）
xinyu-cli search topics --group-id 123456789 --keyword 复盘

# 搜索文章
xinyu-cli search articles --keyword 复盘

# 搜索圈子
xinyu-cli search groups --keyword 读书

# 搜索用户
xinyu-cli search users --keyword 张三

# 搜索标签
xinyu-cli search tags --keyword 写作

# 排序与时间范围（仅主题/文章支持）
xinyu-cli search topics --group-id 123456789 --keyword 复盘 --sort 1 --time-range 2
```

## 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--keyword <kw>` | **是** | 关键词 |
| `--group-id <id>` | 搜索主题时**必填** | 圈子 ID |
| `--cursor <n>` | 否 | 偏移量，默认 `0` |
| `--count <n>` | 否 | 每页数量，默认 `20`（服务端要求必须 > 0） |
| `--sort <n>` | 否 | 排序：`1` 相关性（默认）/ `2` 最新 / `3` 热门（仅文章） |
| `--time-range <n>` | 否 | 时间范围：`1` 一周 / `2` 一个月 / `3` 一季 / `4` 一年 |

## 输出

- 主题：TOPIC_ID、标题/摘要、作者、发布
- 文章：ARTICLE_ID、标题、作者、摘要
- 圈子：GROUP_ID、名称、简介
- 用户：USER_ID、昵称、新语号
- 标签：TAG_ID、标签、文章数

翻页时末尾提示 `下一页：--cursor <n>`。

## 说明

- 主题搜索为全文检索，高亮标签（`<em>`）在输出时已剥离
- 主题搜索必须指定圈子；跨圈搜索请先确定圈子，或分别搜索
- 主题搜索结果包含正文，因此 CLI 会先做成员探测：非成员以退出码 `3` 失败，不会返回结果
- 搜索结果为空不一定是关键词问题：主题索引只包含已发布内容
- 想浏览而不是搜索时用 `topic list`（按时间倒序）

## 错误说明

| 症状 | 原因 | 处理 |
|------|------|------|
| `搜索圈子内主题需要 --group-id` | 主题搜索缺少圈子 ID | 先 `group list` 取 ID |
| 结果为空 | 关键词无命中 / 内容未发布 | 换关键词，或用 `topic list` 浏览 |

通用错误见 [auth-errors](auth-errors.md#常见错误处理)。

## 参考

- [topic-list](topic-list.md) — 浏览主题列表
- [group-list](group-list.md) — 获取 `group_id`
