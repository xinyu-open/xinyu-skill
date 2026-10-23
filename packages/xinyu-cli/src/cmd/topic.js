import { CliError, EXIT, permissionError, usageError } from '../errors.js';
import { boolFlag, optionalInt, optionalList, requiredStr, requireYes, str } from '../flags.js';
import { displayName, fmtTime, printJson, printTable, stripHtml, topicTypeName } from '../output.js';

const GROUP_TOPIC_ID_TYPE = 11;

/**
 * 圈子成员校验：主题列表接口对非成员直接返回 2430，是最轻量的成员探测方式。
 * 列表类接口不返回可靠的 allow_view 字段，因此需要用它对圈子级读取做前置校验。
 */
export async function assertGroupMember(client, groupId) {
  try {
    await client.request('GET', '/group/topics', { query: { group_id: groupId, scope: 'all', count: 1 } });
  } catch (err) {
    if (err.code === 2430) {
      throw permissionError('无权访问该圈子内容：当前账号不是圈子成员');
    }
    throw err;
  }
}

/**
 * 统一的主题访问校验：非成员 / 会员过期后发布的主题，后端只会返回摘要。
 * CLI 不做摘要降级，直接按「无权访问」失败，避免把摘要当成正文使用。
 */
export async function fetchTopicOrFail(client, topicId) {
  const body = await client.request('GET', `/group/topic/${topicId}`);
  const data = body?.data;
  if (!data) throw new CliError(`主题不存在或已删除：${topicId}`, EXIT.BIZ);
  if (data.allow_view !== true) {
    throw permissionError('无权查看该主题：未加入该圈子，或会员已过期（该主题发布于过期之后）');
  }
  return { body, data };
}

function topicRow(detail) {
  const info = detail?.topic_info || {};
  return {
    topic_id: info.topic_id,
    title: info.title,
    type: topicTypeName(info.topic_type),
    author: displayName(detail?.author),
    publish_time: info.publish_time,
    comment_cnt: info.comment_cnt,
    digg_cnt: info.digg_cnt,
    content: info.content,
    digested: info.digested,
    sticky: info.sticky,
    tags: info.tags,
  };
}

const TOPIC_COLUMNS = [
  { title: 'TOPIC_ID', value: (row) => row.topic_id, max: 22 },
  { title: '类型', value: (row) => row.type, max: 8 },
  { title: '标题/摘要', value: (row) => row.title || stripHtml(row.content), max: 40 },
  { title: '作者', value: (row) => row.author, max: 18 },
  { title: '发布', value: (row) => fmtTime(row.publish_time), max: 18 },
  { title: '评论', value: (row) => row.comment_cnt ?? 0, max: 6 },
  { title: '点赞', value: (row) => row.digg_cnt ?? 0, max: 6 },
];

export const topic = {
  // 圈子主题列表：scope 必须是合法值，否则后端会返回空列表
  async list(ctx) {
    const groupId = requiredStr(ctx.flags, 'group-id');
    const tagId = optionalInt(ctx.flags, 'tag-id');
    const body = await ctx.client.request('GET', '/group/topics', {
      query: {
        group_id: groupId,
        scope: str(ctx.flags, 'scope') || 'all',
        tag_id: tagId,
        count: optionalInt(ctx.flags, 'count'),
        begin_time: optionalInt(ctx.flags, 'begin-time'),
        end_time: optionalInt(ctx.flags, 'end-time'),
      },
    });
    if (ctx.json) return printJson(body);
    printTable(TOPIC_COLUMNS, (body.data || []).map(topicRow));
    if (body.has_more) {
      process.stdout.write(`\n还有更多，下一页：--end-time ${body.next_cursor}\n`);
    }
  },

  async sticky(ctx) {
    const groupId = requiredStr(ctx.flags, 'group-id');
    // 置顶列表接口本身不校验成员，先做一次成员探测再读取
    await assertGroupMember(ctx.client, groupId);
    const body = await ctx.client.request('GET', '/group/topics/sticky', { query: { group_id: groupId } });
    if (ctx.json) return printJson(body.data || []);
    printTable(TOPIC_COLUMNS, (body.data || []).map(topicRow));
  },

  async detail(ctx) {
    const topicId = requiredStr(ctx.flags, 'topic-id');
    const { body, data } = await fetchTopicOrFail(ctx.client, topicId);
    if (ctx.json) return printJson(body);

    const info = data.topic_info || {};
    const tags = (info.tags || []).map((tag) => tag.title).filter(Boolean);
    process.stdout.write(`主题 ID：${info.topic_id}\n`);
    process.stdout.write(`类型：${topicTypeName(info.topic_type)}\n`);
    if (info.title) process.stdout.write(`标题：${info.title}\n`);
    process.stdout.write(`作者：${displayName(data.author)}（${data.author?.user_id || '-'}）\n`);
    process.stdout.write(`圈子：${data.group_data?.group_info?.group_name || '-'}（${data.group_data?.group_info?.group_id || '-'}）\n`);
    process.stdout.write(`发布：${fmtTime(info.publish_time)}\n`);
    process.stdout.write(`互动：评论 ${info.comment_cnt ?? 0} / 点赞 ${info.digg_cnt ?? 0} / 浏览 ${info.view_cnt ?? 0}\n`);
    process.stdout.write(`标签：${tags.length ? tags.join('、') : '-'}\n`);
    process.stdout.write(`属性：${info.digested ? '精华 ' : ''}${info.sticky ? '置顶' : ''}${!info.digested && !info.sticky ? '-' : ''}\n`);
    if (info.question) {
      process.stdout.write(`提问 ID：${info.question.question_id || '-'}（状态 ${info.question.status ?? '-'}）\n`);
    }
    process.stdout.write('\n---------- 正文 ----------\n');
    process.stdout.write(`${stripHtml(info.content) || '（空）'}\n`);
  },

  async comments(ctx) {
    const topicId = requiredStr(ctx.flags, 'topic-id');
    await fetchTopicOrFail(ctx.client, topicId);
    const body = await ctx.client.request('GET', '/group/topic/comment/list', {
      query: {
        topic_id: topicId,
        cursor: optionalInt(ctx.flags, 'cursor'),
        limit: optionalInt(ctx.flags, 'limit'),
        sort: optionalInt(ctx.flags, 'sort'),
      },
    });
    if (ctx.json) return printJson(body);
    printTable(
      [
        { title: 'COMMENT_ID', value: (row) => row.comment_info?.comment_id, max: 22 },
        { title: '作者', value: (row) => displayName(row.author_info), max: 18 },
        { title: '内容', value: (row) => stripHtml(row.comment_info?.content), max: 50 },
        { title: '回复', value: (row) => row.comment_info?.reply_cnt ?? 0, max: 6 },
        { title: '时间', value: (row) => fmtTime(row.comment_info?.ctime), max: 18 },
      ],
      body.data || [],
    );
    if (body.has_more) process.stdout.write(`\n还有更多，下一页：--cursor ${body.cursor}\n`);
  },

  async replies(ctx) {
    const topicId = requiredStr(ctx.flags, 'topic-id');
    const commentId = requiredStr(ctx.flags, 'comment-id');
    await fetchTopicOrFail(ctx.client, topicId);
    const body = await ctx.client.request('GET', '/group/topic/comment/reply/list', {
      query: {
        topic_id: topicId,
        comment_id: commentId,
        cursor: optionalInt(ctx.flags, 'cursor'),
        limit: optionalInt(ctx.flags, 'limit'),
      },
    });
    if (ctx.json) return printJson(body);
    printTable(
      [
        { title: 'COMMENT_ID', value: (row) => row.comment_info?.comment_id, max: 22 },
        { title: '作者', value: (row) => displayName(row.author_info), max: 18 },
        { title: '内容', value: (row) => stripHtml(row.comment_info?.content), max: 50 },
        { title: '时间', value: (row) => fmtTime(row.comment_info?.ctime), max: 18 },
      ],
      body.data || [],
    );
    if (body.has_more) process.stdout.write(`\n还有更多，下一页：--cursor ${body.cursor}\n`);
  },

  // 发布主题（普通主题；文章主题请走创作端）
  async create(ctx) {
    const groupId = requiredStr(ctx.flags, 'group-id');
    const content = str(ctx.flags, 'content');
    const pics = optionalList(ctx.flags, 'pics');
    const title = str(ctx.flags, 'title') || '';
    if (!content && (!pics || pics.length === 0)) {
      throw usageError('至少通过 --content 或 --pics 提供内容');
    }
    const body = await ctx.client.request('POST', '/group/topic', {
      body: {
        data: {
          group_id: String(groupId),
          topic_type: 1,
          title,
          content: content || '',
          pics: pics || [],
          tag_ids: (optionalList(ctx.flags, 'tag-ids') || []).map(String),
        },
      },
    });
    const info = body?.data?.topic_info;
    if (ctx.json) return printJson(body);
    if (info?.topic_id) {
      process.stdout.write(`✓ 主题已发布：${info.topic_id}\n`);
    } else {
      process.stdout.write('✓ 主题已发布\n');
    }
  },

  // 编辑主题：正文走送审链路，标题/标签/精华/置顶沿用原有权限
  async edit(ctx) {
    const topicId = requiredStr(ctx.flags, 'topic-id');
    const editData = {};

    const content = str(ctx.flags, 'content');
    if (content !== undefined) editData.content = content;
    const pics = optionalList(ctx.flags, 'pics');
    if (pics !== undefined) editData.pics = pics;
    const files = optionalList(ctx.flags, 'files');
    if (files !== undefined) editData.files = files;
    const title = str(ctx.flags, 'title');
    if (title !== undefined) editData.title = title;
    const tagIds = optionalList(ctx.flags, 'tag-ids');
    if (tagIds !== undefined) editData.tag_ids = tagIds.map(String);
    if (ctx.flags.digest !== undefined) editData.digested = boolFlag(ctx.flags, 'digest');
    if (ctx.flags.sticky !== undefined) editData.sticky = boolFlag(ctx.flags, 'sticky');

    if (Object.keys(editData).length === 0) {
      throw usageError('至少提供一个要修改的字段（--content/--title/--tag-ids/--digest/--sticky）');
    }

    await ctx.client.request('PATCH', `/group/topic/${topicId}`, { body: { edit_data: editData } });
    if (ctx.json) return printJson({ topic_id: topicId, edit_data: editData });
    process.stdout.write(`✓ 主题已更新：${topicId}\n`);
    if (editData.content !== undefined) {
      process.stdout.write('提示：正文修改需通过内容审核，审核期间主题可能短暂不可见。\n');
    }
  },

  async delete(ctx) {
    const topicId = requiredStr(ctx.flags, 'topic-id');
    requireYes(ctx.flags, '删除主题');
    await ctx.client.request('DELETE', `/group/topic/${topicId}`);
    if (ctx.json) return printJson({ topic_id: topicId, deleted: true });
    process.stdout.write(`✓ 主题已删除：${topicId}\n`);
  },

  // 评论 / 楼中楼回复
  async reply(ctx) {
    const topicId = requiredStr(ctx.flags, 'topic-id');
    const content = requiredStr(ctx.flags, 'content');
    // 兼容 --reply-to-comment-id 与 --comment-id 两种写法
    const replyTo = str(ctx.flags, 'reply-to-comment-id') || str(ctx.flags, 'comment-id');
    const pics = optionalList(ctx.flags, 'pics');

    const commentInfo = {
      item_id: String(topicId),
      item_type: GROUP_TOPIC_ID_TYPE,
      content,
    };
    if (replyTo) commentInfo.reply_to_comment_id = String(replyTo);
    if (pics && pics.length) commentInfo.pics = pics;

    const body = await ctx.client.request('POST', '/group/topic/comment', {
      body: { comment_info: commentInfo },
    });
    if (ctx.json) return printJson(body);
    const commentId = body?.data?.comment_info?.comment_id;
    process.stdout.write(commentId ? `✓ 评论已发布：${commentId}\n` : '✓ 评论已发布\n');
  },

  async digg(ctx) {
    const topicId = requiredStr(ctx.flags, 'topic-id');
    const undo = boolFlag(ctx.flags, 'undo');
    await ctx.client.request('POST', '/interact/digg/topic', {
      body: { topic_id: String(topicId), action: undo ? 2 : 1 },
    });
    if (ctx.json) return printJson({ topic_id: topicId, digg: !undo });
    process.stdout.write(undo ? `✓ 已取消点赞：${topicId}\n` : `✓ 已点赞：${topicId}\n`);
  },
};
