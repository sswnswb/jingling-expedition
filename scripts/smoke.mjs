/**
 * 浏览器冒烟：标题 → 备战（买/上阵）→ 战斗（快进）→ 结算，截屏 + 收集报错。
 * 用法：node scripts/smoke.mjs
 */
import { spawn } from 'child_process';
import { mkdirSync } from 'fs';
import path from 'path';

const PORT = 4187;
const QA = path.resolve('qa');
mkdirSync(QA, { recursive: true });

const viteBin = path.resolve('node_modules/vite/bin/vite.js');
const server = spawn(process.execPath, [viteBin, 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((res, rej) => {
  const deadline = Date.now() + 15000;
  const poll = async () => {
    if (Date.now() > deadline) return rej(new Error('preview 启动超时'));
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
let browser;
try {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#btn-start', { timeout: 15000 });
  await page.screenshot({ path: path.join(QA, '01-title.png') });

  await page.fill('#inp-name', '测试');
  await page.click('#btn-start');
  await page.waitForSelector('.prep', { timeout: 10000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(QA, '02-prep.png') });

  // 买 2 张卡（点卡上的购买按钮；点卡本身是看详情）
  const buy = page.locator('.shop-card [data-buy]');
  for (let i = 0; i < 2; i++) { await buy.nth(0).click(); await page.waitForTimeout(120); }

  // 上阵：点备战席第一只 → 点棋盘第 1 格
  const bench = await page.$('.bench-slot');
  if (bench) { await bench.click(); await page.waitForTimeout(100); }
  await page.locator('.slot').nth(0).click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(QA, '03-prep-board.png') });

  // 出战
  await page.click('#p-fight');
  await page.waitForSelector('.battle', { timeout: 10000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(QA, '04-battle.png') });

  // 快进结束
  await page.click('#b-skip');
  await page.waitForSelector('#b-continue', { timeout: 15000 });
  await page.screenshot({ path: path.join(QA, '05-result.png') });
  await page.click('#b-continue');
  await page.waitForSelector('.prep', { timeout: 10000 });

  if (errors.length > 0) {
    console.error('✗ 控制台报错：');
    errors.slice(0, 8).forEach((e) => console.error('  ', e));
    process.exitCode = 1;
  } else {
    console.log('✓ 冒烟测试通过，截图在 qa/');
  }
} finally {
  if (browser) await browser.close();
  await stopServer();
}
