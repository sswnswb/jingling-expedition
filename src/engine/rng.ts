/** 确定性随机：mulberry32。一切随机都从注入的 rng 派生 → 同 seed 必同局。 */
export interface Rng {
  next(): number; // [0,1)
  int(n: number): number; // [0,n)
  range(a: number, b: number): number;
  chance(p: number): boolean;
  pick<T>(arr: readonly T[]): T;
  weighted<T>(items: readonly T[], weights: readonly number[]): T;
  shuffle<T>(arr: readonly T[]): T[];
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: number): Rng {
  const rand = mulberry32(seed);
  return {
    next: rand,
    int: (n) => Math.floor(rand() * n),
    range: (a, b) => a + rand() * (b - a),
    chance: (p) => rand() < p,
    pick: (arr) => arr[Math.floor(rand() * arr.length)],
    weighted: (items, weights) => {
      let sum = 0;
      for (const w of weights) sum += w;
      let x = rand() * sum;
      for (let i = 0; i < items.length; i++) {
        x -= weights[i];
        if (x <= 0) return items[i];
      }
      return items[items.length - 1];
    },
    shuffle: (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}

/** 日期 → 每日种子 */
export function dateToSeed(date: Date = new Date()): number {
  const s = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
