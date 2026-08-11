import { readFileSync } from 'fs';
const SPECIES = JSON.parse(readFileSync('src/data/species.json', 'utf8'));
const themes = ['fire','water','grass','electric','normal','flying','fighting','ghost','dragon','ground','rock','bug','ice','psychic','poison'];
console.log('=== 各属性是否有 1/2/3 星精灵（敌方按主题抽取，缺 1 星会回退到高星！）===');
for (const t of themes) {
  const by = {1:[],2:[],3:[]};
  for (const s of SPECIES) if (s.tags.includes(t)) by[s.star].push(s.name);
  const stars = [1,2,3].map(n => `⭐${n}:${by[n].length}`).join(' ');
  const flag = by[1].length === 0 ? '  <<< 无1星! 第1关敌人会抽到高星' : '';
  console.log(`${t.padEnd(9)} ${stars}${flag}`);
}
console.log('\n=== 只出现1次的标签（无法成对触发羁绊）===');
const tagCount = {};
for (const s of SPECIES) for (const t of s.tags) tagCount[t] = (tagCount[t]||0)+1;
for (const [t,c] of Object.entries(tagCount).sort((a,b)=>a[1]-b[1])) {
  if (c < 2) console.log(`  ${t} 只出现在 ${c} 只: ${SPECIES.filter(s=>s.tags.includes(t)).map(s=>s.name).join(',')}`);
}
console.log('\n=== 完全没有任何属性标签的精灵 ===');
for (const s of SPECIES) if (!s.tags.some(t=>themes.includes(t))) console.log(' ', s.name, s.tags.join('/'));
console.log('\n=== 费用分布（1-5金）===');
for (let c=1;c<=5;c++){ const list = SPECIES.filter(s=>s.cost===c).map(s=>`${s.name}(⭐${s.star})`); console.log(`${c}金(${list.length}):`, list.join(' ')); }
