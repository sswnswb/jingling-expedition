/**
 * 确定性自动战斗引擎：固定 dt 步进，一切随机从注入 rng 派生。
 * 单位站在固定格子上（前排 0-2 / 后排 3-5），自动普攻/攒能量/放技能；
 * 产生事件流供 UI 做演出（弹道/伤害数字/控制/进化Mega）。
 * 同 seed + 同棋盘 ⇒ 同结果（可复现、可异步镜像）。
 */

import type { Rng } from './rng';
import { typeAdv, attackInterval, type SkillDef } from './rules';

export type SimEvent =
  | { type: 'attack'; side: 'ally' | 'enemy'; from: number; to: number; dmg: number; crit: boolean; elem: string }
  | { type: 'cast'; side: 'ally' | 'enemy'; from: number; elem: string; shape: string; dmg: number; heal: number; shield: number; cc: string; target: number }
  | { type: 'damage'; side: 'ally' | 'enemy'; slot: number; amount: number }
  | { type: 'heal'; side: 'ally' | 'enemy'; slot: number; amount: number }
  | { type: 'shield'; side: 'ally' | 'enemy'; slot: number; amount: number }
  | { type: 'cc'; side: 'ally' | 'enemy'; slot: number; kind: string }
  | { type: 'die'; side: 'ally' | 'enemy'; slot: number }
  | { type: 'mega'; side: 'ally' | 'enemy'; slot: number }
  | { type: 'win' } | { type: 'lose' };

export interface BUnit {
  uid: string;
  speciesId: string;
  name: string;
  tags: string[];
  elem: string;          // 普攻属性
  star: number;          // 1/2/3
  slot: number;          // 0-5
  hp: number; maxhp: number;
  atk: number; spa: number; def: number; spe: number;
  skill: SkillDef;
  item: string | null;
  canMega: boolean;
  // 战斗内状态
  energy: number;
  atkTimer: number;
  cc: string; ccTimer: number;
  shield: number;
  mega: boolean; megaUsed: boolean;
  poison: number; poisonTimer: number;
  regenTimer: number;
  // 强化（synergy/item 结算后的最终值）
  crit: number; dodge: number; lifesteal: number; regen: number; poisonOnHit: number;
  energyGain: number;
  ghostBonus: number;    // 每损失 1 个己方单位 +伤害
  ccBonus: number;       // 控制附加概率
  startEnergy: number;   // 开场能量
}

export interface BattleState {
  rng: Rng;
  time: number;
  over: false | 'win' | 'lose';
  ally: BUnit[];
  enemy: BUnit[];
  events: SimEvent[];
  allyTotal: number;
  enemyTotal: number;
  /** 每单位的累计伤害（结算面板） */
  dmgDealt: { uid: string; name: string; dmg: number; kills: number }[];
}

const DT = 0.1;
const MAX_TIME = 90;

export function startBattle(ally: BUnit[], enemy: BUnit[], rng: Rng): BattleState {
  return {
    rng, time: 0, over: false,
    ally: ally.map((u) => ({ ...u, energy: u.startEnergy ?? 45, atkTimer: 0, cc: '', ccTimer: 0, shield: 0, mega: false, megaUsed: false, poison: 0, poisonTimer: 0, regenTimer: 0 })),
    enemy: enemy.map((u) => ({ ...u, energy: u.startEnergy ?? 45, atkTimer: 0, cc: '', ccTimer: 0, shield: 0, mega: false, megaUsed: false, poison: 0, poisonTimer: 0, regenTimer: 0 })),
    events: [],
    allyTotal: ally.length, enemyTotal: enemy.length,
    dmgDealt: [],
  };
}

function alive(side: BUnit[]): BUnit[] { return side.filter((u) => u.hp > 0); }

function targetOf(opp: BUnit[]): BUnit | null {
  const t = alive(opp).sort((a, b) => a.slot - b.slot);
  return t[0] ?? null;
}

function otherSide(b: BattleState, side: 'ally' | 'enemy'): BUnit[] { return side === 'ally' ? b.enemy : b.ally; }
function mySide(b: BattleState, side: 'ally' | 'enemy'): BUnit[] { return side === 'ally' ? b.ally : b.enemy; }

/** 通用命中：含闪避/克制/残局/护盾/吸血/暴击（普攻与技能共用） */
function hit(b: BattleState, side: 'ally' | 'enemy', source: BUnit | null, target: BUnit, raw: number, elem: string, ghost: number, crit: boolean): number {
  if (target.hp <= 0) return 0;
  if (b.rng.chance(target.dodge)) {
    b.events.push({ type: 'damage', side, slot: target.slot, amount: 0 });
    return 0;
  }
  const adv = typeAdv(elem, target.tags);
  const lost = b[side === 'ally' ? 'allyTotal' : 'enemyTotal'] - alive(mySide(b, side)).length;
  let out = Math.round(raw * adv * (1 + Math.max(0, lost) * ghost));
  if (crit) out = Math.round(out * 1.6);
  const shieldAbs = Math.min(target.shield, out);
  target.shield -= shieldAbs;
  out -= shieldAbs;
  out = Math.max(0, out);
  target.hp -= out;
  b.events.push({ type: 'attack', side, from: source ? source.slot : -1, to: target.slot, dmg: out, crit, elem });
  if (source && source.lifesteal > 0 && out > 0) {
    const h = Math.round(out * source.lifesteal);
    source.hp = Math.min(source.maxhp, source.hp + h);
    b.events.push({ type: 'heal', side, slot: source.slot, amount: h });
  }
  if (target.hp <= 0) {
    target.hp = 0;
    b.events.push({ type: 'die', side, slot: target.slot });
    const rec = b.dmgDealt.find((d) => d.uid === source?.uid);
    if (rec) rec.kills++;
  }
  if (source) {
    let rec = b.dmgDealt.find((d) => d.uid === source.uid);
    if (!rec) { rec = { uid: source.uid, name: source.name, dmg: 0, kills: 0 }; b.dmgDealt.push(rec); }
    rec.dmg += out;
  }
  return out;
}

function applyHeal(b: BattleState, side: 'ally' | 'enemy', u: BUnit, amount: number, isShield: boolean) {
  if (isShield) {
    u.shield += amount;
    b.events.push({ type: 'shield', side, slot: u.slot, amount });
  } else {
    const before = u.hp;
    u.hp = Math.min(u.maxhp, u.hp + amount);
    b.events.push({ type: 'heal', side, slot: u.slot, amount: Math.max(0, u.hp - before) });
  }
}

function castSkill(b: BattleState, side: 'ally' | 'enemy', u: BUnit, ghost: number) {
  const s = u.skill;
  u.energy = 0;
  const power = s.power === 'atk' ? u.atk : u.spa;
  const units = mySide(b, side);
  const opp = otherSide(b, side);
  const dmgBase = Math.round(power * s.m);
  let dmg = 0, heal = 0, shield = 0, cc = '';
  let targetSlot = -1;

  switch (s.t) {
    case 'single': {
      const t = targetOf(opp);
      if (t) { targetSlot = t.slot; hit(b, side, u, t, dmgBase, s.e, ghost, b.rng.chance(u.crit)); }
      break;
    }
    case 'front': {
      for (const t of alive(opp).filter((o) => o.slot < 3)) hit(b, side, u, t, dmgBase, s.e, ghost, false);
      break;
    }
    case 'aoe': {
      for (const t of alive(opp)) hit(b, side, u, t, dmgBase, s.e, ghost, false);
      break;
    }
    case 'random': {
      const av = alive(opp);
      if (av.length) { const t = b.rng.pick(av); targetSlot = t.slot; hit(b, side, u, t, dmgBase, s.e, ghost, false); }
      break;
    }
    case 'heal_self':
      heal = Math.round(u.maxhp * (s.heal ?? 0.4)); applyHeal(b, side, u, heal, false); break;
    case 'heal_lowest': {
      const lowest = alive(units).sort((a, c) => a.hp / a.maxhp - c.hp / c.maxhp)[0];
      if (lowest) { heal = Math.round(lowest.maxhp * (s.heal ?? 0.4)); applyHeal(b, side, lowest, heal, false); }
      break;
    }
  }
  // 控制（有 cc 属性时额外附加）
  if (s.cc) {
    const t = targetOf(opp);
    if (t && b.rng.chance(Math.min(1, 0.35 + u.ccBonus))) {
      cc = s.cc; t.cc = s.cc; t.ccTimer = 2.2;
      b.events.push({ type: 'cc', side, slot: t.slot, kind: s.cc });
    }
  }
  b.events.push({ type: 'cast', side, from: u.slot, elem: s.e, shape: s.t, dmg, heal, shield, cc, target: targetSlot });
}

export function stepSim(b: BattleState, allyGhost: number, enemyGhost: number): void {
  if (b.over) return;
  b.time += DT;

  const processSide = (side: 'ally' | 'enemy') => {
    const units = mySide(b, side);
    const opp = otherSide(b, side);
    const ghost = side === 'ally' ? allyGhost : enemyGhost;
    for (const u of alive(units)) {
      if (b.over) break;
      if (u.ccTimer > 0) {
        u.ccTimer -= DT;
        if (u.ccTimer <= 0) u.cc = '';
        continue;
      }
      u.energy += u.energyGain * DT;
      u.atkTimer -= DT;
      const target = targetOf(opp);
      if (target && u.atkTimer <= 0) {
        u.atkTimer = attackInterval(u.spe);
        const crit = b.rng.chance(u.crit);
        const raw = Math.round(u.atk * (0.9 + b.rng.next() * 0.2));
        hit(b, side, u, target, raw, u.elem, ghost, crit);
        u.energy += 12;
        if (u.poisonOnHit > 0 && target.hp > 0) target.poison += u.poisonOnHit;
      }
      // 中毒 tick
      if (u.poison > 0) {
        u.poisonTimer -= DT;
        if (u.poisonTimer <= 0) {
          u.poisonTimer = 1;
          const dot = Math.max(1, Math.round(u.maxhp * 0.02 * u.poison));
          hit(b, side, null, u, dot, 'poison', 0, false);
        }
      }
      // 持续回血
      if (u.regen > 0) {
        u.regenTimer -= DT;
        if (u.regenTimer <= 0) { u.regenTimer = 3; applyHeal(b, side, u, Math.round(u.maxhp * u.regen), false); }
      }
      // 能量满：Mega 变身（一次性）或放技能
      if (u.energy >= u.skill.en) {
        if (u.canMega && !u.megaUsed) {
          u.megaUsed = true;
          u.mega = true;
          u.maxhp = Math.round(u.maxhp * 1.6);
          u.hp = u.maxhp;
          u.atk = Math.round(u.atk * 1.6);
          u.spa = Math.round(u.spa * 1.6);
          u.def = Math.round(u.def * 1.6);
          b.events.push({ type: 'mega', side, slot: u.slot });
        }
        castSkill(b, side, u, ghost);
      }
    }
    if (alive(opp).length === 0 && !b.over) {
      b.over = side === 'ally' ? 'win' : 'lose';
      b.events.push({ type: b.over === 'win' ? 'win' : 'lose' });
    }
  };

  processSide('ally');
  if (b.over) return;
  processSide('enemy');
  if (b.time > MAX_TIME) {
    // 超时：血多的一方胜
    const aHp = alive(b.ally).reduce((s, u) => s + u.hp, 0) / Math.max(1, b.ally.length);
    const eHp = alive(b.enemy).reduce((s, u) => s + u.hp, 0) / Math.max(1, b.enemy.length);
    b.over = aHp >= eHp ? 'win' : 'lose';
    b.events.push({ type: b.over === 'win' ? 'win' : 'lose' });
  }
}

/** 预模拟到结束，返回结果与时长（用于测试 / 异步镜像秒出结果） */
export function simulate(b: BattleState, allyGhost = 0, enemyGhost = 0): { result: 'win' | 'lose'; time: number } {
  let guard = 0;
  while (b.over === false && guard++ < 2000) stepSim(b, allyGhost, enemyGhost);
  return { result: b.over === 'win' ? 'win' : 'lose', time: b.time };
}
