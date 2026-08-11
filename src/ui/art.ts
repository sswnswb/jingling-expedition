/** 精灵美术预加载：官方高清立绘（本地 public/img）。 */
import { SPECIES } from '../data/species';
import { ELEM_COLOR } from '../engine/rules';

const cache = new Map<string, HTMLImageElement>();

export function preloadAll(onDone?: () => void): void {
  const ids = new Set<string>();
  for (const s of SPECIES) ids.add(s.id);
  for (const s of SPECIES) if (s.mega) ids.add(`mega_${s.id}`);
  let loaded = 0;
  const total = ids.size;
  for (const id of ids) {
    const img = new Image();
    img.src = `img/${id}.png`;
    cache.set(id, img);
    img.onload = img.onerror = () => { if (++loaded >= total) onDone?.(); };
  }
}

export function img(id: string): HTMLImageElement | null {
  return cache.get(id) ?? null;
}

/** 取单位立绘（mega 形态优先） */
export function unitImg(speciesId: string, mega: boolean): HTMLImageElement | null {
  if (mega) { const m = img(`mega_${speciesId}`); if (m) return m; }
  return img(speciesId);
}

export function elemColor(elem: string): string {
  return ELEM_COLOR[elem] ?? '#b8bcc6';
}
