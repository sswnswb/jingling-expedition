/** 规则表：属性克制、羁绊、星级成长、数值公式。一切战斗/经济数值的唯一定义处。 */

export type Elem = string; // fire/water/.../normal

/** 属性克制：攻 → 守 的倍率（1.5 克制 / 0.5 抗性），简版图，覆盖本游出现的属性 */
const ADV: Record<string, Record<string, number>> = {
  fire:     { grass: 1.5, bug: 1.5, ice: 1.5, water: 0.5, ground: 0.5, rock: 0.5 },
  water:    { fire: 1.5, ground: 1.5, rock: 1.5, grass: 0.5, electric: 0.5 },
  grass:    { water: 1.5, ground: 1.5, rock: 1.5, fire: 0.5, flying: 0.5, bug: 0.5, poison: 0.5 },
  electric: { water: 1.5, flying: 1.5, ground: 0.5 },
  normal:   {},
  flying:   { grass: 1.5, fighting: 1.5, bug: 1.5, electric: 0.5, rock: 0.5 },
  fighting: { normal: 1.5, ice: 1.5, rock: 1.5, flying: 0.5, psychic: 0.5, ghost: 0.5 },
  ghost:    { ghost: 1.5, psychic: 1.5, normal: 0.5 },
  dragon:   { dragon: 1.5, ice: 0.5 },
  ground:   { fire: 1.5, electric: 1.5, rock: 1.5, poison: 1.5, grass: 0.5, flying: 0.5, water: 0.5 },
  rock:     { fire: 1.5, ice: 1.5, flying: 1.5, bug: 1.5, water: 0.5, grass: 0.5, fighting: 0.5, ground: 0.5 },
  bug:      { grass: 1.5, psychic: 1.5, fire: 0.5, flying: 0.5, rock: 0.5 },
  ice:      { grass: 1.5, ground: 1.5, flying: 1.5, dragon: 1.5, fire: 0.5, fighting: 0.5, rock: 0.5 },
  psychic:  { fighting: 1.5, poison: 1.5, bug: 0.5, ghost: 0.5 },
  poison:   { grass: 1.5, ground: 0.5, psychic: 0.5 },
};

/** 克制倍率：攻击属性 vs 防守方所有属性取乘积 */
export function typeAdv(attacker: string, defenderTypes: readonly string[]): number {
  let m = 1;
  for (const t of defenderTypes) {
    const a = ADV[attacker]?.[t] ?? 1;
    m *= a;
  }
  return m;
}

export const ELEM_COLOR: Record<string, string> = {
  fire: '#f27d3f', water: '#4fa3e8', grass: '#6fbf5f', electric: '#f2d34a',
  normal: '#b8bcc6', flying: '#8fc0e8', fighting: '#d97b4a', ghost: '#9a7fd4',
  dragon: '#7a5fd4', ground: '#c49a5f', rock: '#a89a7f', bug: '#7fb069',
  ice: '#7fd4d4', psychic: '#e87ab0', poison: '#a45fd4',
};

export const TYPE_CN: Record<string, string> = {
  fire: '火', water: '水', grass: '草', electric: '电', normal: '一般',
  flying: '飞行', fighting: '格斗', ghost: '幽灵', dragon: '龙', ground: '地面',
  rock: '岩石', bug: '虫', ice: '冰', psychic: '超能', poison: '毒',
};

export const STAR_MULT = [1, 2.2, 4.5]; // 1/2/3 星属性倍率

export type SkillShape =
  | { t: 'single'; m: number }
  | { t: 'front'; m: number }
  | { t: 'aoe'; m: number }
  | { t: 'random'; m: number }
  | { t: 'heal_self'; m: number }
  | { t: 'heal_lowest'; m: number };

export interface SkillDef {
  name: string;
  e: string;                 // 元素
  t: string;                 // 形态（见 battle.ts 解释）
  m: number;                 // 倍率
  en: number;                // 能量需求
  cc?: 'stun' | 'sleep' | 'freeze';
  heal?: number;             // 治疗倍率（对 maxhp）
  shield?: number;           // 护盾倍率（对 maxhp）
  power?: 'atk' | 'spa';     // 吃物攻还是特攻
}

export interface SpeciesDef {
  id: string;
  name: string;
  dex: number;
  tags: string[];            // 属性 + 特殊羁绊标签
  cost: number;              // 商店档位 1-5
  star: 1 | 2 | 3;
  evolvesInto?: string;
  evolvesRandom?: string[];
  mega?: string;             // mega 资源 slug
  hp: number; atk: number; spa: number; def: number; spe: number;
  skill: SkillDef;
}

/** 属性羁绊：档位 → 效果描述（具体实现在 battle.ts/run.ts） */
export const TYPE_SYNERGY: Record<string, { at: number[]; desc: string }> = {
  fire:     { at: [2, 4, 6], desc: '攻击+' },
  water:    { at: [2, 4, 6], desc: '吸血' },
  grass:    { at: [2, 4, 6], desc: '持续回血' },
  electric: { at: [2, 4, 6], desc: '攻速+' },
  normal:   { at: [2, 4, 6], desc: '生命+' },
  flying:   { at: [2, 4, 6], desc: '闪避' },
  fighting: { at: [2, 4, 6], desc: '暴击' },
  ghost:    { at: [2, 4, 6], desc: '残局越少越强' },
  dragon:   { at: [2, 4, 6], desc: '每关成长' },
  ground:   { at: [2, 4, 6], desc: '防御+' },
  rock:     { at: [2, 4, 6], desc: '护甲+' },
  bug:      { at: [2, 4],     desc: '生命+' },
  ice:      { at: [2, 4],     desc: '控制概率+' },
  psychic:  { at: [2, 4],     desc: '能量回复+' },
  poison:   { at: [2, 4],     desc: '中毒持续伤害' },
};

/** 娱乐羁绊 */
export const FUN_SYNERGY: Record<string, { at: number[]; desc: string }> = {
  starter: { at: [2, 3, 4], desc: '御三家组合·攻击+' },
  money:   { at: [1, 2],     desc: '喵喵财团·每关金币+' },
  gamble:  { at: [1, 2],     desc: '伊布赌局·随机进化' },
  tank:    { at: [1, 2],     desc: '巨兽·前排减伤' },
  legend:  { at: [2, 3],     desc: '传说·开场能量+' },
};

/** 星级属性倍率 */
export function starMult(star: number): number {
  return STAR_MULT[Math.min(2, Math.max(0, star - 1))];
}

/** 普攻间隔（秒）：由速度换算 */
export function attackInterval(spe: number): number {
  return Math.max(0.6, 1.8 - spe * 0.06);
}

/** 一项羁绊在场上凑了多少个 */
export function countTrait(units: { tags: string[] }[], tag: string): number {
  return units.reduce((n, u) => (u.tags.includes(tag) ? n + 1 : n), 0);
}

/** 把数量映射到已解锁档位（返回命中的最高档 index+1，0=未解锁） */
export function traitTier(count: number, thresholds: number[]): number {
  let tier = 0;
  for (const th of thresholds) if (count >= th) tier++;
  return tier;
}

/** 技能效果 → 中文说明 */
export function describeSkill(s: SkillDef): string {
  const power = s.power ?? (['fighting', 'normal', 'ground', 'rock', 'bug'].includes(s.e) ? 'atk' : 'spa');
  const stat = power === 'atk' ? '攻击' : '特攻';
  const pct = Math.round(s.m * 100);
  let head = '';
  switch (s.t) {
    case 'single': head = `对单体造成${stat}×${(s.m).toFixed(1).replace(/\.0$/, '')}伤害`; break;
    case 'front': head = `对敌方前排造成${stat}×${(s.m).toFixed(1).replace(/\.0$/, '')}伤害`; break;
    case 'aoe': head = `对全体敌人造成${stat}×${(s.m).toFixed(1).replace(/\.0$/, '')}伤害`; break;
    case 'random': head = `对随机敌人造成${stat}×${(s.m).toFixed(1).replace(/\.0$/, '')}伤害`; break;
    case 'heal_self': head = `恢复自身最大生命 ${pct}%`; break;
    case 'heal_lowest': head = `治疗生命最低的队友最大生命 ${pct}%`; break;
    default: head = '特殊技能';
  }
  if (s.cc) head += `，附带${s.cc === 'stun' ? '眩晕' : s.cc === 'sleep' ? '催眠' : '冰冻'}`;
  if (s.e !== 'normal') head += `（${TYPE_CN[s.e] ?? s.e}系）`;
  return head;
}
