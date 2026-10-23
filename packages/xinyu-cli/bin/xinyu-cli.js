#!/usr/bin/env node
import { main } from '../src/main.js';

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code ?? 0;
  })
  .catch((err) => {
    // main 内部已处理业务错误，这里只兜底未捕获异常
    process.stderr.write(`${err && err.stack ? err.stack : String(err)}\n`);
    process.exitCode = 1;
  });
