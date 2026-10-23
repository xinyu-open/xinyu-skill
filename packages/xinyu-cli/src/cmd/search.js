import { usageError } from '../errors.js';
import { optionalInt, requiredStr } from '../flags.js';
import { fmtTime, printJson, printTable, stripHtml } from '../output.js';
import { assertGroupMember } from './topic.js';

// 后端统一搜索接口的 item_type 取值
const ITEM_TYPES = {
  users: 1,
  articles: 2,
  tags: 4,
  groups: 10,
  topics: 11,
};

async function runSearch(ctx, itemType, render) {
  const keyword = requiredStr(ctx.flags, 'keyword');
  const body = await ctx.client.request('GET', '/search', {
    query: {
      keyword,
      item_type: itemType,
      group_id: optionalInt(ctx.flags, 'group-id'),
      cursor: optionalInt(ctx.flags, 'cursor') ?? 0,
      count: optionalInt(ctx.flags, 'count'),
      sort_type: optionalInt(ctx.flags, 'sort'),
      time_range_type: optionalInt(ctx.flags, 'time-range'),
    },
  });
  if (ctx.json) return printJson(body);
  render(body.data || []);
  if (body.has_more) process.stdout.write(`\n还有更多，下一页：--cursor ${body.next_cursor}\n`);
}

export const search = {
  async topics(ctx) {
    if (!ctx.flags['group-id']) throw usageError('搜索圈子内主题需要 --group-id');
    // 搜索接口不校验成员身份，但结果包含主题内容，先做成员探测
    await assertGroupMember(ctx.client, ctx.flags['group-id']);
    await runSearch(ctx, ITEM_TYPES.topics, (items) =>
      printTable(
        [
          { title: 'TOPIC_ID', value: (row) => row.group_topic?.topic_info?.topic_id, max: 22 },
          { title: '标题/摘要', value: (row) => stripHtml(row.highlight?.title) || stripHtml(row.highlight?.desc), max: 44 },
          { title: '作者', value: (row) => row.group_topic?.author?.nickname, max: 16 },
          { title: '发布', value: (row) => fmtTime(row.group_topic?.topic_info?.publish_time), max: 18 },
        ],
        items,
      ),
    );
  },

  async articles(ctx) {
    await runSearch(ctx, ITEM_TYPES.articles, (items) =>
      printTable(
        [
          { title: 'ARTICLE_ID', value: (row) => row.article?.article_info?.article_id, max: 22 },
          { title: '标题', value: (row) => stripHtml(row.highlight?.title) || row.article?.article_info?.title, max: 44 },
          { title: '作者', value: (row) => row.article?.author_info?.nickname, max: 16 },
          { title: '摘要', value: (row) => stripHtml(row.highlight?.desc), max: 36 },
        ],
        items,
      ),
    );
  },

  async groups(ctx) {
    await runSearch(ctx, ITEM_TYPES.groups, (items) =>
      printTable(
        [
          { title: 'GROUP_ID', value: (row) => row.group?.group_info?.group_id, max: 22 },
          { title: '名称', value: (row) => stripHtml(row.highlight?.title) || row.group?.group_info?.group_name, max: 30 },
          { title: '简介', value: (row) => stripHtml(row.highlight?.desc), max: 36 },
        ],
        items,
      ),
    );
  },

  async users(ctx) {
    await runSearch(ctx, ITEM_TYPES.users, (items) =>
      printTable(
        [
          { title: 'USER_ID', value: (row) => row.user?.user_id, max: 22 },
          { title: '昵称', value: (row) => row.user?.nickname, max: 24 },
          { title: '新语号', value: (row) => row.user?.xinyu_id, max: 20 },
        ],
        items,
      ),
    );
  },

  async tags(ctx) {
    await runSearch(ctx, ITEM_TYPES.tags, (items) =>
      printTable(
        [
          { title: 'TAG_ID', value: (row) => row.tag?.tag_id, max: 22 },
          { title: '标签', value: (row) => row.tag?.display_text || row.tag?.slug_name, max: 40 },
          { title: '文章数', value: (row) => row.tag?.article_cnt ?? 0, max: 8 },
        ],
        items,
      ),
    );
  },
};
