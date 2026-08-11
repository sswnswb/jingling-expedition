/** 引擎自检：bundle src/_engine_test.ts 后运行（引擎逻辑纯 node 可测，不进浏览器） */
import { build } from 'esbuild';
import { execSync } from 'child_process';
import path from 'path';
const out = path.resolve('scripts/_eng.js');
await build({ entryPoints: ['src/_engine_test.ts'], bundle: true, outfile: out, platform: 'node', format: 'cjs', target: 'node20' });
try { execSync(`node "${out}"`, { stdio: 'inherit' }); } finally { /* 保留产物 */ }
