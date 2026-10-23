#!/usr/bin/env node
import { main } from '../src/main.js';

// 输出被管道截断（如 | head）时静默退出，避免抛出 EPIPE 堆栈
process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') process.exit(0);
  throw err;
});

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code ?? 0;
  })
  .catch((err) => {
    // main 内部已处理业务错误，这里只兜底未捕获异常
    process.stderr.write(`${err && err.stack ? err.stack : String(err)}\n`);
    process.exitCode = 1;
  });
