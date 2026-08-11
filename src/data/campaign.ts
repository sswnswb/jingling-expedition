/**
 * 关卡与敌人生成：敌人按章节/关卡缩放，队伍成体系（主题属性、高关出现进化星级），
 * 用同一套精灵池 → 跟玩家"会玩的人"打。
 */

import { SPECIES } from './species';
import { starMult, type SkillDef } from '../engine/rules';
import type { BUnit } from '../engine/battle';
import type { Rng } from '../engine/rng';

export interface ChapterDef {
  title: string;
  boss: string;
  scale: number;
  theme: string; // 该章 Boss 主题
}

export const CHAPTERS: ChapterDef[] = [
  { title: '第一章 · 初入森林', boss: '草丛霸主', scale: 0.9, theme: 'grass' },
  { title: '第二章 · 溪谷试炼', boss: '水系馆主', scale: 1.12, theme: 'water' },
  { title: '第三章 · 幽暗洞窟', boss: '幽灵馆主', scale: 1.36, theme: 'ghost' },
  { title: '第四章 · 龙之裂谷', boss: '龙之长老', scale: 1.62, theme: 'dragon' },
  { title: '第五章 · 冠军之路', boss: '精灵冠军', scale: 1.9, theme: 'legend' },
];

export const CHAPTERS_TOTAL = CHAPTERS.length;
export const STAGE_PER_CHAPTER = 5;
export const TOTAL_STAGES = CHAPTERS_TOTAL * STAGE_PER_CHAPTER;

export function chapterOf(stage: number): ChapterDef {
  return CHAPTERS[Math.min(CHAPTERS_TOTAL - 1, Math.floor((stage - 1) / STAGE_PER_CHAPTER))];
}

export function isBossStage(stage: number): boolean {
  return stage % STAGE_PER_CHAPTER === 0;
}

const THEMES = ['fire', 'water', 'grass', 'electric', 'normal', 'flying', 'fighting', 'ghost', 'dragon', 'ground', 'rock', 'bug', 'ice', 'psychic'];
const PHYSICAL = new Set(['fighting', 'normal', 'ground', 'rock', 'bug']);

function resolveSkill(spec: { skill: SkillDef }): SkillDef {
  const s = spec.skill;
  return { ...s, power: s.power ?? (PHYSICAL.has(s.e) ? 'atk' : 'spa') as 'atk' | 'spa' };
}

/** 生成敌方队伍（返回可直接开打的 BUnit[]） */
export function genEnemyTeam(rng: Rng, stage: number, isBoss = false): BUnit[] {
  const ch = chapterOf(stage);
  const scale = ch.scale * (1 + stage * 0.02);

  // 主题
  let theme: string;
  if (isBoss) {
    theme = ch.theme === 'legend' ? rng.pick(['dragon', 'psychic', 'ground', 'fire']) : ch.theme;
  } else {
    theme = rng.pick(THEMES);
  }
  const themed = SPECIES.filter((s) => s.tags.includes(theme));

  const teamSize = isBoss ? Math.min(6, 3 + Math.floor(stage / 4)) : Math.min(6, 1 + Math.floor(stage / 3));
  const p3 = Math.min(0.55, Math.max(0, (stage - 10) / 14));
  const p2 = Math.min(0.6, Math.max(0, (stage - 4) / 12));

  const units: BUnit[] = [];
  for (let i = 0; i < teamSize; i++) {
    const roll = rng.next();
    const wantStar = roll < p3 ? 3 : roll < p3 + p2 ? 2 : 1;
    let pool = themed.filter((s) => s.star === wantStar);
    if (pool.length === 0) pool = themed.filter((s) => s.star >= wantStar);
    if (pool.length === 0) pool = themed;
    const spec = rng.pick(pool);
    const sm = starMult(spec.star);
    let hp = spec.hp * sm * scale;
    let atk = spec.atk * sm * scale;
    let spa = spec.spa * sm * scale;
    let def = spec.def * sm * scale;
    let spe = spec.spe * sm * scale;
    if (isBoss) { hp *= 1.35; atk *= 1.15; spa *= 1.15; }
    hp = Math.round(hp); atk = Math.round(atk); spa = Math.round(spa); def = Math.round(def); spe = Math.round(spe);

    units.push({
      uid: `enemy_${i}`, speciesId: spec.id, name: spec.name, tags: spec.tags, star: spec.star,
      elem: spec.tags.find((x) => THEMES.includes(x)) ?? 'normal',
      slot: i, hp, maxhp: hp, atk, spa, def, spe,
      skill: resolveSkill(spec), item: null, canMega: false,
      energy: 45, atkTimer: 0, cc: '', ccTimer: 0, shield: 0, mega: false, megaUsed: false,
      poison: 0, poisonTimer: 0, regenTimer: 0,
      crit: 0, dodge: 0, lifesteal: 0, regen: 0, poisonOnHit: 0, energyGain: 4, ghostBonus: 0, ccBonus: 0, startEnergy: 45,
    });
  }
  return units;
}

/** 敌方队伍战力估算（用于结算显示 / 血量惩罚强度） */
export function enemyPower(team: BUnit[]): number {
  return team.reduce((s, u) => s + u.maxhp + u.atk * 2 + u.spa * 2, 0);
}
