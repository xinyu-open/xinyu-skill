import { optionalInt, requiredStr, str } from '../flags.js';
import { displayName, fmtTime, groupTypeName, memberStatusName, printJson, printTable, stripHtml } from '../output.js';

function groupRow(detail) {
  const info = detail?.group_info || {};
  const member = detail?.user_member_info || {};
  return {
    group_id: info.group_id,
    name: info.group_name,
    type: groupTypeName(info.group_type),
    role: member.role,
    last_publish_time: info.last_publish_time,
    column: detail?.bound_column,
  };
}

const GROUP_COLUMNS = [
  { title: 'GROUP_ID', value: (row) => row.group_id, max: 22 },
  { title: '名称', value: (row) => row.name, max: 30 },
  { title: '类型', value: (row) => row.type, max: 10 },
  { title: '最近发布', value: (row) => fmtTime(row.last_publish_time), max: 18 },
];

function roleName(role) {
  switch (Number(role)) {
    case 1:
      return '圈主';
    case 2:
      return '管理员';
    case 3:
      return '合伙人';
    case 4:
      return '嘉宾';
    case 5:
      return '成员';
    default:
      return role ? String(role) : '非成员';
  }
}

export const group = {
  // 列出我加入 / 我创建的圈子
  async list(ctx) {
    const owned = !!ctx.flags.owned;
    const limit = optionalInt(ctx.flags, 'limit');
    const body = owned
      ? await ctx.client.request('GET', '/group/list', {
          query: { user_role: optionalInt(ctx.flags, 'role') ?? 1, group_type: optionalInt(ctx.flags, 'type') },
        })
      : await ctx.client.request('GET', '/group/user/groups');

    let rows = (body.data || []).map(groupRow);
    if (limit) rows = rows.slice(0, limit);
    if (ctx.json) return printJson(body);
    printTable(GROUP_COLUMNS, rows);
  },

  async detail(ctx) {
    const groupId = requiredStr(ctx.flags, 'group-id');
    const body = await ctx.client.request('GET', '/group', { query: { group_id: groupId } });
    const detail = body.data || {};
    if (ctx.json) return printJson(body);
    const info = detail.group_info || {};
    const intro = info.group_intro || {};
    const rows = [
      ['圈子 ID', info.group_id],
      ['名称', info.group_name],
      ['类型', groupTypeName(info.group_type)],
      ['成员数', info.member_cnt ?? '-'],
      ['主题数', info.topic_cnt ?? '-'],
      ['圈主', displayName(detail.owner?.user_info)],
      ['我的角色', roleName(detail.user_member_info?.role)],
      ['最近发布', fmtTime(info.last_publish_time)],
      ['绑定专栏', detail.bound_column?.column_name || detail.bound_column?.name || '-'],
      ['合集数', (detail.collections || []).length],
      ['简介', intro.group_desc || '-'],
    ];
    for (const [key, value] of rows) process.stdout.write(`${key}：${value ?? '-'}\n`);
    process.stdout.write(`\n---------- 圈子介绍 ----------\n${stripHtml(intro.intro) || '（空）'}\n`);
  },

  async tags(ctx) {
    const groupId = requiredStr(ctx.flags, 'group-id');
    const body = await ctx.client.request('GET', '/group/tags', { query: { group_id: groupId } });
    const tags = body.tags || [];
    if (ctx.json) return printJson(body);
    printTable(
      [
        { title: 'TAG_ID', value: (row) => row.tag_id, max: 22 },
        { title: '标签', value: (row) => row.title, max: 40 },
      ],
      tags,
    );
  },

  // 成员列表；带 --keyword 时走成员搜索接口
  async members(ctx) {
    const groupId = requiredStr(ctx.flags, 'group-id');
    const keyword = str(ctx.flags, 'keyword');
    const cursor = optionalInt(ctx.flags, 'cursor') ?? 0;
    // 后端在 count=0 时只会返回空列表 + has_more，必须显式给默认值
    const count = optionalInt(ctx.flags, 'count') ?? 20;

    const body = keyword
      ? await ctx.client.request('GET', '/group/member/search', {
          query: { group_id: groupId, keyword, cursor, count },
        })
      : await ctx.client.request('GET', '/group/subscriber/list', {
          query: { group_id: groupId, cursor, count },
        });

    const members = body.data || [];
    if (ctx.json) return printJson(body);
    printTable(
      [
        { title: 'USER_ID', value: (row) => row.user_info?.user_id, max: 22 },
        { title: '昵称', value: (row) => displayName(row.user_info), max: 24 },
        { title: '新语号', value: (row) => row.user_info?.xinyu_id, max: 20 },
        { title: '状态', value: (row) => memberStatusName(row.member_info?.status), max: 10 },
        { title: '加入时间', value: (row) => fmtTime(row.member_info?.join_time), max: 18 },
        { title: '到期时间', value: (row) => fmtTime(row.member_info?.expire_time), max: 18 },
      ],
      members,
    );
    const nextCursor = body.next_cursor ?? cursor + members.length;
    if (body.has_more && members.length > 0) {
      process.stdout.write(`\n还有更多，下一页：--cursor ${nextCursor}\n`);
    }
  },

  async member(ctx) {
    const groupId = requiredStr(ctx.flags, 'group-id');
    const userId = requiredStr(ctx.flags, 'user-id');
    const body = await ctx.client.request('GET', `/group/${groupId}/member/${userId}`);
    const data = body.data || {};
    if (ctx.json) return printJson(body);
    printTable(
      [
        { title: '昵称', value: (row) => displayName(row.user_info), max: 24 },
        { title: '新语号', value: (row) => row.user_info?.xinyu_id, max: 20 },
        { title: '状态', value: (row) => memberStatusName(row.member_info?.status), max: 10 },
        { title: '加入时间', value: (row) => fmtTime(row.member_info?.join_time), max: 18 },
        { title: '主题数', value: (row) => row.member_info?.post_cnt ?? 0, max: 8 },
        { title: '介绍', value: (row) => row.member_info?.intro, max: 40 },
      ],
      [data],
    );
  },

  async collections(ctx) {
    const groupId = requiredStr(ctx.flags, 'group-id');
    const body = await ctx.client.request('GET', '/group/collections', { query: { group_id: groupId } });
    const collections = body.data || [];
    if (ctx.json) return printJson(body);
    printTable(
      [
        { title: 'COLLECTION_ID', value: (row) => row.collection_id, max: 22 },
        { title: '名称', value: (row) => row.name, max: 30 },
        { title: '主题数', value: (row) => row.topic_count ?? 0, max: 8 },
        { title: '来源专栏', value: (row) => row.column_id || '-', max: 22 },
      ],
      collections,
    );
  },

  async 'collection-topics'(ctx) {
    const collectionId = requiredStr(ctx.flags, 'collection-id');
    const cursor = optionalInt(ctx.flags, 'cursor') ?? 0;
    const count = optionalInt(ctx.flags, 'count') ?? 20;
    const body = await ctx.client.request('GET', '/group/collection/topics', {
      query: { collection_id: collectionId, cursor, count },
    });
    if (ctx.json) return printJson(body);
    const topics = body.data || [];
    printTable(
      [
        { title: 'TOPIC_ID', value: (row) => row.topic_info?.topic_id, max: 22 },
        { title: '标题', value: (row) => row.topic_info?.title, max: 36 },
        { title: '作者', value: (row) => displayName(row.author), max: 18 },
        { title: '发布', value: (row) => fmtTime(row.topic_info?.publish_time), max: 18 },
      ],
      topics,
    );
    if (body.has_more && topics.length > 0) {
      process.stdout.write(`\n还有更多，下一页：--cursor ${body.next_cursor ?? cursor + topics.length}\n`);
    }
  },
};
