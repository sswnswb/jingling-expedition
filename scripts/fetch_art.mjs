/**
 * 从 PokéAPI 下载精灵官方高清立绘 + Mega 形态，打包到 public/img/（本地加载，不依赖网速）。
 * 用法：node scripts/fetch_art.mjs
 */
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import path from 'path';

const species = JSON.parse(readFileSync(path.resolve('src/data/species.json'), 'utf8'));
const OUT = path.resolve('public/img');
mkdirSync(OUT, { recursive: true });

const AGENT = { 'User-Agent': 'Mozilla/5.0 (jingling-expedition art fetcher)' };
const ART = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
const HOME = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/home/';

async function download(url, dest) {
  if (existsSync(dest)) return 'cached';
  const r = await fetch(url, { headers: AGENT });
  if (!r.ok) return null;
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(dest, buf);
  return 'ok';
}

/** 通过 species 接口的 varieties 解析 Mega 形态的 pokemon id */
async function resolveMegaId(baseId) {
  const r = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${baseId}`, { headers: AGENT }).catch(() => null);
  if (!r || !r.ok) return null;
  const j = await r.json();
  const varieties = j.varieties ?? [];
  const megas = varieties.filter((v) => /mega/i.test(v.pokemon.name));
  if (megas.length === 0) return null;
  const pick = megas.find((v) => /mega-y/i.test(v.pokemon.name)) ?? megas[0];
  return Number(pick.pokemon.url.replace(/.*\/pokemon\//, '').replace(/\/$/, ''));
}

const results = { ok: 0, fallback: 0, failed: [] };

// 1) 基础立绘：官方高清立绘 → home → 失败记录
const tasks = species.map(async (s) => {
  const dest = path.join(OUT, `${s.id}.png`);
  if (existsSync(dest)) { results.ok++; return; }
  const r1 = await download(`${ART}${s.dex}.png`, dest);
  if (r1) { results.ok++; return; }
  const r2 = await download(`${HOME}${s.dex}.png`, dest);
  if (r2) { results.fallback++; return; }
  results.failed.push(s.id);
});

for (let i = 0; i < tasks.length; i += 6) {
  await Promise.all(tasks.slice(i, i + 6));
}
console.log(`基础立绘：${species.length - results.failed.length} 成功（含回退 ${results.fallback}），失败 ${results.failed.length}`);

// 2) Mega 形态
const megaTasks = species.filter((s) => s.mega).map(async (s) => {
  const dest = path.join(OUT, `mega_${s.id}.png`);
  if (existsSync(dest)) return;
  const megaId = await resolveMegaId(s.dex);
  if (!megaId) { results.failed.push(`mega_${s.id}`); return; }
  const r1 = await download(`${ART}${megaId}.png`, dest);
  if (r1) return;
  const r2 = await download(`${HOME}${megaId}.png`, dest);
  if (!r2) {
    // 最后兜底：用原形立绘 + 标记（前端加 Mega 光环）
    const r3 = await download(`${ART}${s.dex}.png`, dest);
    if (!r3) results.failed.push(`mega_${s.id}`);
  }
});

for (let i = 0; i < megaTasks.length; i += 3) {
  await Promise.all(megaTasks.slice(i, i + 3));
}

const fileList = species.map((s) => s.id).concat(species.filter((s) => s.mega).map((s) => `mega_${s.id}`));
writeFileSync(path.resolve('public/img/manifest.json'), JSON.stringify(fileList, null, 0));

console.log('完成。图片数:', results.ok + results.fallback, '失败:', JSON.stringify(results.failed));
