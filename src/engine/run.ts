/**
 * 跑局引擎：一局的全部逻辑——经济（利息/连胜连败）、商店、合成进化、上场/出售、
 * 羁绊计算、装备、最终属性结算（喂给战斗引擎）。
 */

import { SPECIES, speciesById } from '../data/species';
import { itemById } from '../data/items';
import { starMult, traitTier, type SpeciesDef } from './rules';
import type { Rng } from './rng';
import type { BUnit } from './battle';

export interface BoardUnit {
  uid: string;
  speciesId: string;
  star: 1 | 2 | 3;
  item: string | null;
  slot: number; // -1 = 备战席，0..5 = 场上
}

export interface SynergyInfo {
  tag: string;
  cn: string;
  count: number;
  tier: number;
  thresholds: number[];
  desc: string;
  effect: string; // 当前档位的实际效果文字
  isFun: boolean;
}

export interface RunState {
  seed: number;
  name: string;
  stage: number;
  chapter: number;
  gold: number;
  level: number;
  hp: number;
  units: BoardUnit[];
  streak: number;
  dragonStacks: number;
  clearedStages: number;
  items: string[];
  wins: number;
  kills: number;
  over: boolean;
  result: 'dead' | 'victory' | null;
}

export const TOTAL_STAGES = 25;
export const MAX_LEVEL = 6;
export const MAX_UNITS = 12;
const LEVEL_COST = [0, 4, 8, 14, 22, 32]; // 升到下一级的花费（下标=当前级）
const TYPE_CN: Record<string, string> = {
  fire: '火', water: '水', grass: '草', electric: '电', normal: '一般', flying: '飞行',
  fighting: '格斗', ghost: '幽灵', dragon: '龙', ground: '地面', rock: '岩石',
  bug: '虫', ice: '冰', psychic: '超能', poison: '毒',
};

export function createRun(seed: number, name: string): RunState {
  return {
    seed, name: name || '无名修士', stage: 1, chapter: 1, gold: 12, level: 1, hp: 100,
    units: [], streak: 0, dragonStacks: 0, clearedStages: 0, items: [], wins: 0, kills: 0,
    over: false, result: null,
  };
}

export function boardUnits(run: RunState): BoardUnit[] {
  return run.units.filter((u) => u.slot >= 0 && u.slot < run.level).sort((a, b) => a.slot - b.slot);
}
export function benchUnits(run: RunState): BoardUnit[] {
  return run.units.filter((u) => u.slot < 0);
}

/* ---------- 商店 ---------- */

const COST_WEIGHTS = [50, 30, 13, 5, 2]; // cost 1-5 档出现权重

/** 一族进化链上的全部精灵 id（含随机进化分支） */
function familyIds(spec: SpeciesDef): Set<string> {
  const out = new Set([spec.id]);
  const queue = [spec.id];
  let guard = 0;
  while (queue.length && guard++ < 40) {
    const cur = speciesById(queue.shift()!);
    if (!cur) continue;
    if (cur.evolvesInto && !out.has(cur.evolvesInto)) { out.add(cur.evolvesInto); queue.push(cur.evolvesInto); }
    for (const eid of cur.evolvesRandom ?? []) if (!out.has(eid)) { out.add(eid); queue.push(eid); }
  }
  return out;
}

/** 进化线是否已有一只三星（满级）——已满级的线从商店剔除，不再重复刷出 */
function lineHas3(run: RunState, spec: SpeciesDef): boolean {
  const threes = new Set(run.units.filter((u) => u.star === 3).map((u) => u.speciesId));
  for (const id of familyIds(spec)) if (threes.has(id)) return true;
  return false;
}

export function rollShop(_run: RunState, rng: Rng): string[] {
  let pool = SPECIES.filter((s) => s.star === 1 && !lineHas3(_run, s));
  if (pool.length === 0) pool = SPECIES.filter((s) => s.star === 1); // 兜底：全部满级也不至于空池
  const offers: string[] = [];
  for (let i = 0; i < 3; i++) {
    const cost = 1 + rng.weighted([0, 1, 2, 3, 4], COST_WEIGHTS);
    const tier = pool.filter((s) => s.cost === cost);
    offers.push(tier.length ? rng.pick(tier).id : rng.pick(pool).id);
  }
  return offers;
}

export function buyUnit(run: RunState, speciesId: string, rng: Rng): string | null {
  const spec = speciesById(speciesId);
  if (!spec || run.gold < spec.cost) return '金币不足';
  if (run.units.length >= MAX_UNITS) return '队伍已满';
  run.gold -= spec.cost;
  run.units.push({ uid: `u${run.units.length}_${Math.random()}`, speciesId, star: 1, item: null, slot: -1 });
  autoCombine(run, rng);
  return null;
}

export function sellUnit(run: RunState, uid: string): void {
  const u = run.units.find((x) => x.uid === uid);
  if (!u) return;
  if (u.item) { run.items.push(u.item); }
  run.gold += speciesById(u.speciesId).cost;
  run.units = run.units.filter((x) => x.uid !== uid);
}

export function placeUnit(run: RunState, uid: string, slot: number): void {
  const u = run.units.find((x) => x.uid === uid);
  if (!u) return;
  if (slot >= 0) {
    if (slot >= run.level) return; // 未解锁
    const occupied = run.units.find((x) => x.slot === slot);
    if (occupied) { const t = occupied.slot; occupied.slot = u.slot; u.slot = t; return; }
  }
  u.slot = slot;
}

export function equipItem(run: RunState, uid: string, itemId: string | null): void {
  const u = run.units.find((x) => x.uid === uid);
  if (!u) return;
  if (u.item) run.items.push(u.item);
  if (itemId) run.items = run.items.filter((i) => i !== itemId);
  u.item = itemId;
}

/** 三合一：3 只同名同星 → 进化/升星（伊布随机进化） */
export function autoCombine(run: RunState, rng: Rng): void {
  let merged = true;
  while (merged) {
    merged = false;
    const groups = new Map<string, BoardUnit[]>();
    for (const u of run.units) {
      const k = `${u.speciesId}|${u.star}`;
      const g = groups.get(k);
      if (g) g.push(u); else groups.set(k, [u]);
    }
    for (const [, list] of groups) {
      if (list.length < 3) continue;
      const three = list.slice(0, 3);
      const spec = speciesById(three[0].speciesId);
      let nextId = three[0].speciesId;
      let nextStar: 1 | 2 | 3 = (three[0].star + 1) as 1 | 2 | 3;
      if (three[0].star < 3) {
        if (spec.evolvesInto) nextId = spec.evolvesInto;
        else if (spec.evolvesRandom) nextId = rng.pick(spec.evolvesRandom);
      }
      // 结果放在场上的那个位置（优先场上，其次备战席）
      const keep = [...three].sort((x, y) => (x.slot < 0 ? 99 : x.slot) - (y.slot < 0 ? 99 : y.slot))[0];
      const keepItem = three.map((u) => u.item).find((i) => i !== null) ?? null;
      for (const u of three) if (u.item && u.item !== keepItem) run.items.push(u.item);
      keep.speciesId = nextId;
      keep.star = nextStar;
      keep.item = keepItem;
      run.units = run.units.filter((u) => u !== three[1] && u !== three[2]);
      merged = true;
      break;
    }
  }
}

/* ---------- 升级 / 经济 ---------- */

export function levelCost(run: RunState): number | null {
  if (run.level >= MAX_LEVEL) return null;
  return LEVEL_COST[run.level];
}

export function buyLevel(run: RunState): boolean {
  const cost = levelCost(run);
  if (cost === null || run.gold < cost) return false;
  run.gold -= cost;
  run.level++;
  return true;
}

export function shopRerollCost(_run: RunState): number { return 2; }

/** 关卡结算：加钱（利息/连胜连败/喵喵财团），处理队伍血量 */
export function settleStage(run: RunState, won: boolean, board: BoardUnit[]): string[] {
  const msg: string[] = [];
  const interest = Math.min(5, Math.floor(run.gold / 10));
  const base = won ? 6 : 3;
  run.gold += base + interest;
  msg.push(`${won ? '胜' : '败'} ${base}金 + 利息 ${interest}金`);

  if (won) {
    run.streak = run.streak >= 0 ? run.streak + 1 : 1;
    if (run.streak >= 2) { const b = Math.min(run.streak - 1, 3); run.gold += b; msg.push(`连胜 +${b}金`); }
    run.clearedStages++;
    run.dragonStacks++;
    run.wins++;
    run.hp = Math.min(100, run.hp + 3);
  } else {
    run.streak = run.streak <= 0 ? run.streak - 1 : -1;
    if (run.streak <= -2) { const b = Math.min(-run.streak - 1, 2); run.gold += b; msg.push(`连败补偿 +${b}金`); }
    const dmg = 15 + run.stage;
    run.hp -= dmg;
    msg.push(`队伍受创 -${dmg} 生命`);
  }

  // 喵喵财团
  const moneyCount = board.filter((u) => speciesById(u.speciesId).tags.includes('money')).length;
  if (moneyCount > 0) {
    const bonus = moneyCount >= 2 ? 6 : 3;
    run.gold += won ? bonus : bonus / 2;
    msg.push(`喵喵财团 +${Math.round(won ? bonus : bonus / 2)}金`);
  }

  if (run.hp <= 0) { run.hp = 0; run.over = true; run.result = 'dead'; }
  return msg;
}

/* ---------- 羁绊 ---------- */

function tagCounts(board: BoardUnit[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const u of board) for (const t of speciesById(u.speciesId).tags) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

const FUN_TAGS = new Set(['starter', 'money', 'gamble', 'tank', 'legend']);
const FUN_CN: Record<string, string> = { starter: '御三家', money: '喵喵财团', gamble: '伊布赌局', tank: '巨兽', legend: '传说' };
const FUN_DESC: Record<string, string> = {
  starter: '场上不同御三家越多，全队攻击越高', money: '每关额外金币', gamble: '伊布进化随机（满编更强）',
  tank: '坦克减伤', legend: '传说单位开场能量满',
};

/** 各羁绊每档的实际效果（与 resolveBoard 数值一一对应，是唯一真源） */
const SYNERGY_TEXT: Record<string, (tier: number) => string> = {
  fire: (t) => `全队攻击 +${[15, 35, 70][t - 1]}%`,
  water: (t) => `全队吸血 ${[8, 18, 30][t - 1]}%`,
  grass: (t) => `每3秒回血 ${[2, 4, 7][t - 1]}%`,
  electric: (t) => `全队攻速 +${[18, 40, 80][t - 1]}%`,
  normal: (t) => `全队生命 +${[10, 25, 45][t - 1]}%`,
  flying: (t) => `闪避 ${[10, 22, 40][t - 1]}%`,
  fighting: (t) => `暴击率 ${[15, 30, 55][t - 1]}%`,
  ghost: (t) => `每损失1个队友，伤害 +${[6, 10, 16][t - 1]}%`,
  dragon: (t) => `每通关一关，全属性 +${[1.5, 3, 5][t - 1]}%`,
  ground: (t) => `防御 +${[25, 50, 90][t - 1]}%`,
  rock: (t) => `开场护盾 ${[15, 30, 50][t - 1]}% 最大生命`,
  bug: (t) => `生命 +${[8, 20][t - 1]}%`,
  ice: (t) => `控制概率 +${[25, 60][t - 1]}%`,
  psychic: (t) => `能量回复 +${[4, 10][t - 1]}/秒`,
  poison: (t) => `普攻附加中毒 ${[1, 2][t - 1]}层`,
  starter: (t) => `全队攻击 +${[8, 20, 35][t - 1]}%`,
  money: (t) => `每关金币 +${[3, 6][t - 1]}（连败翻倍）`,
  gamble: (t) => `伊布随机进化；伊布家族属性 +${[0, 12][t - 1]}%`,
  tank: (t) => `坦克防御 +${[20, 40][t - 1]}%`,
  legend: (t) => `传说开场满能量；全队属性 +${[0, 15, 35][t - 1]}%`,
};

export function synergyEffect(tag: string, tier: number): string {
  return SYNERGY_TEXT[tag]?.(tier) ?? '';
}

export function computeSynergies(_run: RunState, board: BoardUnit[]): SynergyInfo[] {
  const counts = tagCounts(board);
  const out: SynergyInfo[] = [];
  // 属性
  for (const [tag, cn] of Object.entries(TYPE_CN)) {
    const c = counts.get(tag) ?? 0;
    const thresholds = tag === 'bug' || tag === 'ice' || tag === 'psychic' || tag === 'poison' ? [2, 4] : [2, 4, 6];
    if (c > 0) out.push({ tag, cn, count: c, tier: traitTier(c, thresholds), thresholds, desc: `${cn}系羁绊`, effect: '', isFun: false });
  }
  // 娱乐
  for (const tag of FUN_TAGS) {
    const c = counts.get(tag) ?? 0;
    const thresholds = tag === 'legend' ? [2, 3] : tag === 'starter' ? [2, 3, 4] : [1, 2];
    if (c > 0) out.push({ tag, cn: FUN_CN[tag], count: c, tier: traitTier(c, thresholds), thresholds, desc: FUN_DESC[tag], effect: '', isFun: true });
  }
  return out
    .filter((s) => s.tier > 0)
    .map((s) => ({ ...s, effect: synergyEffect(s.tag, s.tier) }))
    .sort((a, b) => b.tier - a.tier);
}

/* ---------- 最终属性结算 → 战斗单位 ---------- */

export interface ResolvedBoard {
  units: BUnit[];
  synergies: SynergyInfo[];
}

const PHYSICAL_ELEM = new Set(['fighting', 'normal', 'ground', 'rock', 'bug']);

function resolveSkill(spec: SpeciesDef) {
  const s = spec.skill;
  return { ...s, power: s.power ?? (PHYSICAL_ELEM.has(s.e) ? 'atk' : 'spa') as 'atk' | 'spa' };
}

export function resolveBoard(run: RunState, board: BoardUnit[]): ResolvedBoard {
  const synergies = computeSynergies(run, board);
  const t = (tag: string) => synergies.find((s) => s.tag === tag)?.tier ?? 0;

  const tierVal = (tier: number, arr: number[]) => (tier > 0 ? arr[tier - 1] : 0);

  const dragonRate = tierVal(t('dragon'), [0.015, 0.03, 0.05]);
  const dragonMult = 1 + run.dragonStacks * dragonRate;

  const units: BUnit[] = board.map((u) => {
    const spec = speciesById(u.speciesId);
    const sm = starMult(u.star);
    let hp = spec.hp * sm, atk = spec.atk * sm, spa = spec.spa * sm, def = spec.def * sm, spe = spec.spe * sm;
    let crit = 0, dodge = 0, lifesteal = 0, regen = 0, poisonOnHit = 0, energyGain = 4, ghost = 0, ccBonus = 0, startShield = 0, startEnergy = 45;

    // —— 属性羁绊 ——
    atk *= 1 + tierVal(t('fire'), [0.15, 0.35, 0.7]);
    lifesteal += tierVal(t('water'), [0.08, 0.18, 0.3]);
    regen += tierVal(t('grass'), [0.02, 0.04, 0.07]);
    spe *= 1 + tierVal(t('electric'), [0.18, 0.4, 0.8]);
    hp *= 1 + tierVal(t('normal'), [0.1, 0.25, 0.45]);
    dodge += tierVal(t('flying'), [0.1, 0.22, 0.4]);
    crit += tierVal(t('fighting'), [0.15, 0.3, 0.55]);
    ghost += tierVal(t('ghost'), [0.06, 0.1, 0.16]);
    def *= 1 + tierVal(t('ground'), [0.25, 0.5, 0.9]);
    startShield += tierVal(t('rock'), [0.15, 0.3, 0.5]);
    hp *= 1 + tierVal(t('bug'), [0.08, 0.2]);
    ccBonus += tierVal(t('ice'), [0.25, 0.6]);
    energyGain += tierVal(t('psychic'), [4, 10]);
    poisonOnHit += tierVal(t('poison'), [1, 2]);

    // —— 娱乐羁绊 ——
    atk *= 1 + tierVal(t('starter'), [0.08, 0.2, 0.35]);
    if (spec.tags.includes('tank')) def *= 1 + tierVal(t('tank'), [0.2, 0.4]);
    if (spec.tags.includes('gamble')) {
      const gm = 1 + tierVal(t('gamble'), [0, 0.12]);
      hp *= gm; atk *= gm; spa *= gm; def *= gm; spe *= gm;
    }
    if (spec.tags.includes('legend')) {
      startEnergy = 85;
      const lm = 1 + tierVal(t('legend'), [0, 0.15, 0.35]);
      hp *= lm; atk *= lm; spa *= lm; def *= lm; spe *= lm;
    }

    // —— 龙系慢热成长 ——
    if (spec.tags.includes('dragon')) { hp *= dragonMult; atk *= dragonMult; spa *= dragonMult; def *= dragonMult; spe *= dragonMult; }

    // —— 装备 ——
    const it = u.item ? itemById(u.item) : null;
    if (it) {
      const am = it.allMult ?? 0;
      atk *= 1 + am + (it.atkMult ?? 0);
      spa *= 1 + am + (it.spaMult ?? 0);
      def *= 1 + am + (it.defMult ?? 0);
      hp *= 1 + am + (it.hpMult ?? 0);
      spe *= 1 + am + (it.speMult ?? 0);
      lifesteal += it.lifesteal ?? 0;
      startShield += it.startShield ?? 0;
    }

    hp = Math.round(hp); atk = Math.round(atk); spa = Math.round(spa); def = Math.round(def); spe = Math.round(spe);
    return {
      uid: u.uid, speciesId: u.speciesId, name: spec.name, tags: spec.tags, star: u.star,
      elem: spec.tags.find((x) => TYPE_CN[x]) ?? 'normal',
      slot: u.slot, hp, maxhp: hp, atk, spa, def, spe,
      skill: resolveSkill(spec), item: u.item, canMega: !!it?.mega && !!spec.mega,
      energy: 45, atkTimer: 0, cc: '', ccTimer: 0, shield: Math.round(hp * startShield), mega: false, megaUsed: false,
      poison: 0, poisonTimer: 0, regenTimer: 0,
      crit, dodge, lifesteal, regen, poisonOnHit, energyGain, ghostBonus: ghost, ccBonus, startEnergy,
    };
  });

  return { units, synergies };
}

/** 总览：合成进化链是否可达 */
export function nextEvolve(speciesId: string): string | null {
  const spec = speciesById(speciesId);
  if (spec.evolvesInto) return speciesById(spec.evolvesInto).name;
  if (spec.evolvesRandom) return `随机：${spec.evolvesRandom.map((id) => speciesById(id).name).join('/')}`;
  return spec.star < 3 ? '同名升星' : null;
}
