/** 装备数据。效果以最终属性修正实现（见 engine/run.ts finalStats）。 */

export interface ItemDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  /** 属性修正（乘/加） */
  atkMult?: number;
  spaMult?: number;
  defMult?: number;
  hpMult?: number;
  speMult?: number;
  allMult?: number;
  /** 特殊 */
  mega?: boolean;        // 进化钥石：战斗内 Mega
  lifesteal?: number;
  startShield?: number;  // 战斗开场护盾（对 maxhp）
}

export const ITEMS: ItemDef[] = [
  { id: 'mega_stone', name: '进化钥石', desc: '装备后战斗内满能量时 Mega 进化（仅限有 Mega 形态的精灵）', icon: '🔮', mega: true, allMult: 0.1 },
  { id: 'power_band', name: '力量头带', desc: '攻击 +25%', icon: '💪', atkMult: 0.25 },
  { id: 'mystic_drop', name: '神秘水珠', desc: '特攻 +25%', icon: '💧', spaMult: 0.25 },
  { id: 'guard_amulet', name: '守护护符', desc: '防御 +25%，生命 +15%', icon: '🛡️', defMult: 0.25, hpMult: 0.15 },
  { id: 'swift_wings', name: '疾风之翼', desc: '速度 +25%（攻得更快）', icon: '🪽', speMult: 0.25 },
  { id: 'dragon_teeth', name: '龙牙', desc: '全属性 +15%', icon: '🦷', allMult: 0.15 },
  { id: 'vampire_tooth', name: '吸血獠牙', desc: '攻击吸血 +20%', icon: '🩸', lifesteal: 0.2 },
  { id: 'iron_shell', name: '铁壳', desc: '战斗开场获得最大生命 30% 的护盾', icon: '🐚', startShield: 0.3 },
];

export const itemById = (id: string): ItemDef | undefined => ITEMS.find((i) => i.id === id);

export function randomItem(rng: import('../engine/rng').Rng): string {
  // 进化钥石稀有（低概率）
  const weighted = ['power_band', 'mystic_drop', 'guard_amulet', 'swift_wings', 'dragon_teeth', 'vampire_tooth', 'iron_shell', 'power_band', 'mystic_drop', 'guard_amulet', 'swift_wings', 'mega_stone', 'mega_stone'];
  return rng.pick(weighted);
}
