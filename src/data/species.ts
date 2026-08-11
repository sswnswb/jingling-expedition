import raw from './species.json';
import type { SpeciesDef } from '../engine/rules';

export const SPECIES: SpeciesDef[] = raw as unknown as SpeciesDef[];
export const SPECIES_MAP = new Map(SPECIES.map((s) => [s.id, s]));

export function speciesById(id: string): SpeciesDef {
  const s = SPECIES_MAP.get(id);
  if (!s) throw new Error(`未知精灵: ${id}`);
  return s;
}

/** 商店卖的一星池 */
export function shopPool(): SpeciesDef[] {
  return SPECIES.filter((s) => s.star === 1);
}

/** 该精灵的 mega 资源图（如无返回 null） */
export function megaArt(speciesId: string): string | null {
  return SPECIES_MAP.get(speciesId)?.mega ?? null;
}
