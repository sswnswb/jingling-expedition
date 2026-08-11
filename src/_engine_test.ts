/** 引擎自检（bundle 后 node 运行，不进 UI） */
import { createRng } from './engine/rng';
import { createRun, buyUnit, rollShop, autoCombine, settleStage, boardUnits, resolveBoard, levelCost, buyLevel } from './engine/run';
import { startBattle, simulate, type BUnit } from './engine/battle';
import { genEnemyTeam, isBossStage, TOTAL_STAGES } from './data/campaign';
import { SPECIES, speciesById } from './data/species';
import { starMult } from './engine/rules';

let pass = 0, fail = 0;
function check(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${extra}`); }
}

console.log('== 数据自洽 ==');
check('精灵池非空', SPECIES.length > 40, `(${SPECIES.length})`);
for (const s of SPECIES) {
  const sm = starMult(s.star);
  if (s.evolvesInto) check(`进化链 ${s.id}→${s.evolvesInto}`, SPECIES.some((x) => x.id === s.evolvesInto));
  if (s.evolvesRandom) for (const e of s.evolvesRandom) check(`随机进化 ${s.id}→${e}`, SPECIES.some((x) => x.id === e));
}
console.log('== 跑局引擎 ==');
{
  const rng = createRng(12345);
  const run = createRun(12345, '测试');
  run.gold = 999;
  // 买 9 只小火龙 → 应合成出 1 只喷火龙(3星) + 0 剩余
  for (let i = 0; i < 9; i++) { buyUnit(run, 'charmander', rng); }
  const char = run.units.find((u) => u.speciesId === 'charizard');
  check('9 小火龙 → 1 喷火龙3星', !!char && char.star === 3, JSON.stringify(run.units.map((u) => `${u.speciesId}${u.star}`)));
  check('剩余单位数 = 1', run.units.length === 1);
  // 经济：结算
  settleStage(run, true, boardUnits(run));
  check('胜利后金币增加', run.gold > 0, `gold=${run.gold}`);
  check('连胜计数', run.streak === 1);
  // 升等级
  const cost = levelCost(run);
  check('升级花费存在', cost !== null);
  check('金币够升 1 级', buyLevel(run), `gold=${run.gold}, level=${run.level}`);
  // 商店
  const offers = rollShop(run, rng);
  check('商店 3 个商品', offers.length === 3);
  for (const o of offers) check(`商品存在 ${o}`, SPECIES.some((s) => s.id === o));
}

console.log('== 敌人生成 ==');
{
  const rng = createRng(999);
  for (const stage of [1, 5, 10, 15, 20, 25]) {
    const team = genEnemyTeam(rng, stage, isBossStage(stage));
    check(`第${stage}关敌方 ${team.length} 人`, team.length >= 1 && team.length <= 6, `(${team.length})`);
    for (const u of team) {
      check(`敌方单位数据完整 ${u.name}`, u.hp > 0 && u.skill && u.skill.name !== '', `${u.name} hp=${u.hp}`);
    }
  }
}

console.log('== 战斗确定性 ==');
{
  const rng = createRng(555);
  const run = createRun(555, '玩家');
  run.gold = 999;
  for (let i = 0; i < 12; i++) buyUnit(run, ['machop', 'pikachu', 'gastly', 'charmander'][i % 4], rng);
  run.units.forEach((u, i) => { u.slot = i % 3; });
  const rb = resolveBoard(run, boardUnits(run));
  const enemy = genEnemyTeam(rng, 5, true);

  const run1 = () => {
    const b = startBattle(rb.units, enemy, createRng(111));
    return simulate(b);
  };
  const r1 = run1();
  const r2 = run1();
  check('同 seed 同结果', r1.result === r2.result, `${r1.result} vs ${r2.result}`);
  // 我方属性能算出来
  check('我方单位已结算属性', rb.units.length > 0 && rb.units[0].maxhp > 0, `hp=${rb.units[0]?.maxhp}`);
  console.log(`  样本战斗：我方 ${rb.units.length} vs 敌方 ${enemy.length} → ${r1.result}（${r1.time.toFixed(1)}s）`);
}

console.log(`\n${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);
