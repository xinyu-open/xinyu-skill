import { boolFlag, optionalInt, optionalList, requiredStr, str } from '../flags.js';
import { displayName, fmtTime, printJson, printTable, stripHtml } from '../output.js';

const QUESTION_COLUMNS = [
  { title: 'TOPIC_ID', value: (row) => row.topic_info?.topic_id, max: 22 },
  { title: '问题/回答', value: (row) => row.topic_info?.title || stripHtml(row.topic_info?.content), max: 40 },
  { title: '提问者', value: (row) => displayName(row.questioner), max: 18 },
  { title: '被提问者', value: (row) => displayName(row.questionee), max: 18 },
  { title: '发布', value: (row) => fmtTime(row.topic_info?.publish_time), max: 18 },
];

export const question = {
  // 向圈子成员发起提问
  async post(ctx) {
    const groupId = requiredStr(ctx.flags, 'group-id');
    const questioneeUid = requiredStr(ctx.flags, 'questionee-uid');
    const content = requiredStr(ctx.flags, 'content');
    const pics = optionalList(ctx.flags, 'pics');

    const body = await ctx.client.request('POST', '/group/question', {
      body: {
        data: {
          group_id: String(groupId),
          content,
          questionee_uid: String(questioneeUid),
          anonymous: boolFlag(ctx.flags, 'anonymous'),
          ...(pics && pics.length ? { pics } : {}),
        },
      },
    });
    if (ctx.json) return printJson(body);
    process.stdout.write(body?.question_id ? `✓ 提问已发送：${body.question_id}\n` : '✓ 提问已发送\n');
  },

  // 我发起的提问 / 我回答过的提问
  async list(ctx) {
    const role = str(ctx.flags, 'role') || 'questioner';
    const path = role === 'answered' ? '/group/questions/answered_topics' : '/group/questions/questioner';
    const body = await ctx.client.request('GET', path, {
      query: { cursor: optionalInt(ctx.flags, 'cursor') ?? 0, count: optionalInt(ctx.flags, 'count') },
    });
    if (ctx.json) return printJson(body);
    printTable(QUESTION_COLUMNS, body.data || []);
    if (body.has_more && (body.data || []).length) process.stdout.write(`\n还有更多，下一页：--cursor ${body.next_cursor}\n`);
  },

  // 提问详情：仅提问者与被提问者可查看
  async detail(ctx) {
    const questionId = requiredStr(ctx.flags, 'question-id');
    const body = await ctx.client.request('GET', `/group/question/${questionId}`);
    const data = body.data || {};
    if (ctx.json) return printJson(body);
    const info = data.topic_info || {};
    const questionInfo = info.question || {};
    process.stdout.write(`问题 ID：${questionInfo.question_id || questionId}\n`);
    process.stdout.write(`圈子：${data.group_data?.group_info?.group_name || '-'}\n`);
    process.stdout.write(`提问者：${data.questioner ? displayName(data.questioner) : '匿名'}\n`);
    process.stdout.write(`被提问者：${displayName(data.questionee)}\n`);
    process.stdout.write(`状态：${questionInfo.status ?? '-'}\n`);
    process.stdout.write('\n---------- 提问内容 ----------\n');
    process.stdout.write(`${stripHtml(questionInfo.content) || '（空）'}\n`);
    if (info.content) {
      process.stdout.write('\n---------- 回答内容 ----------\n');
      process.stdout.write(`${stripHtml(info.content)}\n`);
    }
  },

  // 回答提问（仅被提问者），回答会生成一条问答主题
  async answer(ctx) {
    const questionId = requiredStr(ctx.flags, 'question-id');
    const groupId = requiredStr(ctx.flags, 'group-id');
    const content = requiredStr(ctx.flags, 'content');
    const pics = optionalList(ctx.flags, 'pics');
    const open = !boolFlag(ctx.flags, 'close');

    const body = await ctx.client.request('POST', `/group/question/${questionId}/answer`, {
      body: {
        data: {
          group_id: String(groupId),
          topic_type: 1,
          title: str(ctx.flags, 'title') || '',
          content,
          question_id: String(questionId),
          is_question_open: open,
          ...(pics && pics.length ? { pics } : {}),
        },
      },
    });
    if (ctx.json) return printJson(body);
    process.stdout.write(body?.topic_id ? `✓ 已回答：${body.topic_id}\n` : '✓ 已回答\n');
  },
};
