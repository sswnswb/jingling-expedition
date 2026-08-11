/**
 * 自动走局：标题 → 备战（尽量买 + 上阵）→ 战斗（快进）→ 结算 → 循环到远征结束。收集报错。
 * 用法：node scripts/walk.mjs [步数上限]
 */
import { spawn } from 'child_process';
import path from 'path';

const PORT = 4188;
const MAX_STEPS = Number(process.argv[2] ?? 500);

const viteBin = path.resolve('node_modules/vite/bin/vite.js');
const server = spawn(process.execPath, [viteBin, 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((res, rej) => {
  const deadline = Date.now() + 15000;
  const poll = async () => {
    if (Date.now() > deadline) return rej(new Error('timeout'));
    try { const r = await fetch(`http://localhost:${PORT}/`); if (r.ok) return res(); } catch { /* 未就绪 */ }
    setTimeout(poll, 300);
  };
  poll();
});
async function stopServer() {
  server.kill();
  await new Promise((r) => setTimeout(r, 300));
  const { execSync } = await import('child_process');
  try {
    const out = execSync(`netstat -ano | findstr :${PORT} | findstr LISTENING`).toString();
    const pid = out.trim().split(/\s+/).pop();
    if (pid) execSync(`taskkill /F /PID ${pid}`);
  } catch { /* 已清理 */ }
}

import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
await page.waitForSelector('#btn-start', { timeout: 15000 });
await page.click('#btn-start');
await page.waitForSelector('.prep', { timeout: 10000 });

let steps = 0;
let battles = 0;
let outcome = 'running';

async function playPrep() {
  // 尽量买卡（点卡上的购买按钮）
  for (let i = 0; i < 5; i++) {
    const can = await page.$('.shop-card:not(.cant) [data-buy]');
    if (!can) break;
    try { await can.click(); } catch { break; }
    await page.waitForTimeout(50);
  }
  // 把备战席上阵到空格（每次点击后元素会重建，需重新查询）
  for (let i = 0; i < 8; i++) {
    const bench = await page.$('.bench-slot');
    if (!bench) break;
    try { await bench.click(); } catch { break; }
    await page.waitForTimeout(60);
    const slot = await page.$('.slot:not(.filled):not(.locked)');
    if (!slot) break;
    try { await slot.click(); } catch { break; }
    await page.waitForTimeout(60);
  }
  // 出战
  const fight = await page.$('#p-fight');
  if (fight) { try { await fight.click(); } catch {} }
  await page.waitForTimeout(150);
}

while (steps < MAX_STEPS) {
  steps++;
  if (await page.$('.prep')) { await playPrep(); continue; }
  if (await page.$('.battle')) {
    battles++;
    await page.waitForTimeout(600);
    const skip = await page.$('#b-skip');
    if (skip) { try { await skip.click(); } catch {} }
    const cont = await page.waitForSelector('#b-continue', { timeout: 30000 }).catch(() => null);
    if (cont) { try { await cont.click(); } catch {} }
    await page.waitForTimeout(200);
    continue;
  }
  if (await page.$('.screen--modal')) {
    outcome = await page.$eval('.screen--modal h2', (el) => el.textContent).catch(() => '?');
    break;
  }
  await page.waitForTimeout(120);
}

await browser.close();
await stopServer();

if (errors.length > 0) {
  console.error('✗ 控制台报错：');
  errors.slice(0, 10).forEach((e) => console.error('  ', e));
  process.exit(1);
}
console.log(`✓ 走局完成：${steps} 步，${battles} 场战斗，结局=${outcome}`);
