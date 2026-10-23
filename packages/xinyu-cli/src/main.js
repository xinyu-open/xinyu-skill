import { readConfig, writeConfig } from './config.js';
import { CliError, EXIT } from './errors.js';
import { parseFlags } from './flags.js';
import { Client, resolveBaseUrl } from './http.js';
import { api } from './cmd/api.js';
import { auth } from './cmd/auth.js';
import { doctor } from './cmd/doctor.js';
import { group } from './cmd/group.js';
import { question } from './cmd/question.js';
import { search } from './cmd/search.js';
import { topic } from './cmd/topic.js';
import { upload } from './cmd/upload.js';
import { user } from './cmd/user.js';

const COMMANDS = { api, auth, doctor, group, question, search, topic, upload, user };

const HELP = `xinyu-cli — 新语圈子命令行工具

用法：xinyu-cli <domain> <command> [--参数 值] [--json]

认证
  auth login [--no-qr] [--timeout 300]   扫码登录（微信小程序确认）
  auth status                            查看登录状态
  auth logout                            清除本地凭据
  doctor                                 环境与登录态自检

圈子
  group list [--owned] [--limit 20]      我加入 / 我创建的圈子
  group detail --group-id <id>           圈子详情（含绑定专栏、合集）
  group tags --group-id <id>             圈子标签
  group members --group-id <id> [--keyword 昵称] [--cursor 0] [--count 20]
  group member --group-id <id> --user-id <uid>
  group collections --group-id <id>      合集列表
  group collection-topics --collection-id <id>

内容搜索
  search topics --group-id <id> --keyword <kw> [--sort 0] [--time-range 0]
  search articles --keyword <kw>
  search groups --keyword <kw>
  search users --keyword <kw>
  search tags --keyword <kw>

主题
  topic list --group-id <id> [--scope all|digest|question|pending_question|article|pic|file|owner] [--tag-id <id>] [--end-time <ts>]
  topic detail --topic-id <id>
  topic comments --topic-id <id> [--cursor 0] [--limit 20] [--sort 0]
  topic replies --topic-id <id> --comment-id <id>
  topic sticky --group-id <id>
  topic create --group-id <id> [--title 标题] --content 正文 [--pics uri1,uri2] [--tag-ids 1,2]
  topic edit --topic-id <id> [--content 正文] [--title 标题] [--tag-ids 1,2] [--pics uri1,uri2] [--digest true|false] [--sticky true|false]
  topic delete --topic-id <id> --yes
  topic reply --topic-id <id> --content 评论内容 [--reply-to-comment-id <id>] [--pics uri1]
  topic digg --topic-id <id> [--undo]

提问
  question post --group-id <id> --questionee-uid <uid> --content 问题 [--anonymous]
  question list [--role questioner|answered]
  question detail --question-id <id>
  question answer --question-id <id> --group-id <id> --content 回答 [--close]

其他
  upload image --file ./a.png            上传图片，返回 uri
  user info [--user-id <id>]
  api raw --method GET --path /group/topics --query '{"group_id":"1"}'

全局参数
  --json        输出原始 JSON
  --base-url    覆盖接口地址（默认 https://xinyu.zone/eden/v1）
`;

function domainHelp(domain, commands) {
  const actions = Object.keys(commands).join(' / ');
  return `可用子命令：${actions}\n执行 xinyu-cli --help 查看完整用法\n（当前：${domain}）`;
}

export async function main(argv) {
  const { positional, flags } = parseFlags(argv);
  if (argv.length === 0 || flags.help) {
    process.stdout.write(HELP);
    return EXIT.OK;
  }

  const [domain] = positional;
  // doctor 是单动作命令，允许省略子命令
  const action = positional[1] || (domain === 'doctor' ? 'run' : undefined);
  const commands = COMMANDS[domain];
  if (!commands) {
    process.stderr.write(`未知命令：${domain}\n\n${HELP}`);
    return EXIT.USAGE;
  }
  if (!action) {
    process.stderr.write(domainHelp(domain, commands));
    return EXIT.USAGE;
  }
  const handler = commands[action];
  if (typeof handler !== 'function') {
    process.stderr.write(`未知子命令：${domain} ${action}\n\n${domainHelp(domain, commands)}`);
    return EXIT.USAGE;
  }

  const config = readConfig();
  const baseUrl = resolveBaseUrl(flags, config);
  const token = process.env.XINYU_TOKEN || config.access_token;
  const persist = !process.env.XINYU_TOKEN && config.access_token;
  const client = new Client({
    baseUrl,
    token,
    refreshToken: config.refresh_token,
    onTokens: persist ? (tokens) => writeConfig(tokens) : undefined,
  });

  const ctx = { client, flags, args: positional.slice(2), json: !!flags.json, config, baseUrl };

  try {
    const code = await handler(ctx);
    return typeof code === 'number' ? code : EXIT.OK;
  } catch (err) {
    if (err instanceof CliError) {
      process.stderr.write(`✗ ${err.message}\n`);
      return err.exitCode;
    }
    if (err && typeof err.exitCode === 'number') {
      process.stderr.write(`✗ ${err.message}\n`);
      return err.exitCode;
    }
    throw err;
  }
}
