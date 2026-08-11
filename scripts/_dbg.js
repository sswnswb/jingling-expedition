"use strict";

// src/engine/rng.ts
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function createRng(seed) {
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
    }
  };
}

// src/data/species.json
var species_default = [
  { id: "charmander", name: "\u5C0F\u706B\u9F99", dex: 4, tags: ["fire", "starter"], cost: 1, star: 1, evolvesInto: "charmeleon", hp: 52, atk: 10, spa: 11, def: 8, spe: 9, skill: { n: "\u708E\u5F39", e: "fire", t: "single", m: 2, en: 100 } },
  { id: "charmeleon", name: "\u706B\u6050\u9F99", dex: 5, tags: ["fire", "starter"], cost: 1, star: 2, evolvesInto: "charizard", hp: 68, atk: 13, spa: 14, def: 10, spe: 11, skill: { n: "\u70C8\u7130\u65A9", e: "fire", t: "single", m: 2.3, en: 100 } },
  { id: "charizard", name: "\u55B7\u706B\u9F99", dex: 6, tags: ["fire", "flying", "starter"], cost: 1, star: 3, mega: "mega-charizard", hp: 88, atk: 16, spa: 18, def: 12, spe: 15, skill: { n: "\u9F99\u708E\u7206", e: "fire", t: "aoe", m: 1.35, en: 120 } },
  { id: "growlithe", name: "\u5361\u8482\u72D7", dex: 58, tags: ["fire"], cost: 1, star: 1, evolvesInto: "arcanine", hp: 50, atk: 11, spa: 9, def: 9, spe: 10, skill: { n: "\u706B\u7259", e: "fire", t: "single", m: 1.9, en: 100 } },
  { id: "arcanine", name: "\u98CE\u901F\u72D7", dex: 59, tags: ["fire"], cost: 1, star: 2, hp: 84, atk: 16, spa: 12, def: 13, spe: 14, skill: { n: "\u708E\u5578", e: "fire", t: "front", m: 1.5, en: 110 } },
  { id: "squirtle", name: "\u6770\u5C3C\u9F9F", dex: 7, tags: ["water", "starter"], cost: 1, star: 1, evolvesInto: "wartortle", hp: 56, atk: 9, spa: 11, def: 12, spe: 8, skill: { n: "\u6C34\u5F39", e: "water", t: "single", m: 2, en: 100 } },
  { id: "wartortle", name: "\u5361\u54AA\u9F9F", dex: 8, tags: ["water", "starter"], cost: 1, star: 2, evolvesInto: "blastoise", hp: 72, atk: 11, spa: 14, def: 15, spe: 10, skill: { n: "\u6C34\u70AE", e: "water", t: "single", m: 2.3, en: 100 } },
  { id: "blastoise", name: "\u6C34\u7BAD\u9F9F", dex: 9, tags: ["water", "starter"], cost: 1, star: 3, mega: "mega-blastoise", hp: 92, atk: 13, spa: 18, def: 18, spe: 12, skill: { n: "\u9AD8\u538B\u6C34\u70AE", e: "water", t: "aoe", m: 1.35, en: 120 } },
  { id: "staryu", name: "\u6D77\u661F\u661F", dex: 120, tags: ["water"], cost: 1, star: 1, evolvesInto: "starmie", hp: 44, atk: 8, spa: 12, def: 8, spe: 12, skill: { n: "\u6C34\u5203", e: "water", t: "single", m: 1.9, en: 100 } },
  { id: "starmie", name: "\u5B9D\u77F3\u6D77\u661F", dex: 121, tags: ["water", "psychic"], cost: 1, star: 2, hp: 70, atk: 10, spa: 16, def: 11, spe: 15, skill: { n: "\u661F\u6F9C", e: "water", t: "aoe", m: 1.2, en: 115 } },
  { id: "bulbasaur", name: "\u5999\u86D9\u79CD\u5B50", dex: 1, tags: ["grass", "poison", "starter"], cost: 1, star: 1, evolvesInto: "ivysaur", hp: 50, atk: 9, spa: 11, def: 10, spe: 8, skill: { n: "\u85E4\u97AD", e: "grass", t: "single", m: 2, en: 100 } },
  { id: "ivysaur", name: "\u5999\u86D9\u8349", dex: 2, tags: ["grass", "poison", "starter"], cost: 1, star: 2, evolvesInto: "venusaur", hp: 64, atk: 11, spa: 14, def: 13, spe: 10, skill: { n: "\u79CD\u5B50\u70B8\u5F39", e: "grass", t: "single", m: 2.2, en: 100 } },
  { id: "venusaur", name: "\u5999\u86D9\u82B1", dex: 3, tags: ["grass", "poison", "starter"], cost: 1, star: 3, mega: "mega-venusaur", hp: 84, atk: 12, spa: 18, def: 16, spe: 12, skill: { n: "\u82B1\u6D77\u7EFD\u653E", e: "grass", t: "aoe", m: 1.2, heal: 0.15, en: 120 } },
  { id: "treecko", name: "\u6728\u5B88\u5BAB", dex: 252, tags: ["grass"], cost: 1, star: 1, evolvesInto: "grovyle", hp: 48, atk: 11, spa: 10, def: 8, spe: 12, skill: { n: "\u53F6\u5203", e: "grass", t: "single", m: 1.9, en: 100 } },
  { id: "grovyle", name: "\u68EE\u6797\u8725\u8734", dex: 253, tags: ["grass"], cost: 1, star: 2, hp: 72, atk: 15, spa: 12, def: 10, spe: 17, skill: { n: "\u53F6\u5F71\u88AD", e: "grass", t: "single", m: 2.3, en: 100 } },
  { id: "pikachu", name: "\u76AE\u5361\u4E18", dex: 25, tags: ["electric"], cost: 2, star: 1, evolvesInto: "raichu", hp: 48, atk: 9, spa: 12, def: 7, spe: 13, skill: { n: "\u5341\u4E07\u4F0F\u7279", e: "electric", t: "single", m: 2, en: 100 } },
  { id: "raichu", name: "\u96F7\u4E18", dex: 26, tags: ["electric"], cost: 2, star: 2, hp: 74, atk: 11, spa: 16, def: 10, spe: 16, skill: { n: "\u96F7\u795E\u51B2", e: "electric", t: "aoe", m: 1.25, en: 115 } },
  { id: "mareep", name: "\u54A9\u5229\u7F8A", dex: 179, tags: ["electric"], cost: 1, star: 1, evolvesInto: "flaaffy", hp: 52, atk: 8, spa: 11, def: 9, spe: 8, skill: { n: "\u7535\u7403", e: "electric", t: "single", m: 1.8, en: 100 } },
  { id: "flaaffy", name: "\u7EF5\u7EF5", dex: 180, tags: ["electric"], cost: 1, star: 2, evolvesInto: "ampharos", hp: 68, atk: 10, spa: 14, def: 11, spe: 10, skill: { n: "\u96F7\u51FB", e: "electric", t: "single", m: 2.1, en: 100 } },
  { id: "ampharos", name: "\u7535\u9F99", dex: 181, tags: ["electric"], cost: 1, star: 3, hp: 86, atk: 12, spa: 18, def: 14, spe: 12, skill: { n: "\u7535\u78C1\u98CE\u66B4", e: "electric", t: "aoe", m: 1.3, en: 120 } },
  { id: "eevee", name: "\u4F0A\u5E03", dex: 133, tags: ["normal", "gamble"], cost: 1, star: 1, evolvesRandom: ["vaporeon", "jolteon", "flareon"], hp: 50, atk: 9, spa: 10, def: 9, spe: 11, skill: { n: "\u820D\u8EAB\u649E", e: "normal", t: "single", m: 1.8, en: 100 } },
  { id: "vaporeon", name: "\u6C34\u4F0A\u5E03", dex: 134, tags: ["water", "gamble"], cost: 1, star: 2, hp: 90, atk: 10, spa: 14, def: 13, spe: 9, skill: { n: "\u6FC0\u6D41\u51B2", e: "water", t: "single", m: 2.2, en: 100 } },
  { id: "jolteon", name: "\u96F7\u4F0A\u5E03", dex: 135, tags: ["electric", "gamble"], cost: 1, star: 2, hp: 70, atk: 10, spa: 16, def: 9, spe: 18, skill: { n: "\u7535\u5149\u95EA", e: "electric", t: "single", m: 2.2, en: 100 } },
  { id: "flareon", name: "\u706B\u4F0A\u5E03", dex: 136, tags: ["fire", "gamble"], cost: 1, star: 2, hp: 76, atk: 16, spa: 12, def: 10, spe: 11, skill: { n: "\u7206\u708E\u51B2", e: "fire", t: "single", m: 2.2, en: 100 } },
  { id: "meowth", name: "\u55B5\u55B5", dex: 52, tags: ["normal", "money"], cost: 1, star: 1, evolvesInto: "persian", hp: 46, atk: 10, spa: 9, def: 8, spe: 12, skill: { n: "\u805A\u5B9D\u51FB", e: "normal", t: "single", m: 1.8, en: 100 } },
  { id: "persian", name: "\u732B\u8001\u5927", dex: 53, tags: ["normal", "money"], cost: 1, star: 2, hp: 68, atk: 14, spa: 11, def: 10, spe: 15, skill: { n: "\u732B\u7A81", e: "normal", t: "front", m: 1.5, en: 110 } },
  { id: "snorlax", name: "\u5361\u6BD4\u517D", dex: 143, tags: ["normal", "tank"], cost: 4, star: 1, hp: 110, atk: 12, spa: 8, def: 14, spe: 6, skill: { n: "\u6CF0\u5C71\u538B\u9876", e: "normal", t: "aoe", m: 1.2, cc: "stun", en: 120 } },
  { id: "pidgey", name: "\u6CE2\u6CE2", dex: 16, tags: ["normal", "flying"], cost: 1, star: 1, evolvesInto: "pidgeotto", hp: 46, atk: 9, spa: 9, def: 7, spe: 12, skill: { n: "\u75BE\u98CE\u5203", e: "flying", t: "single", m: 1.8, en: 100 } },
  { id: "pidgeotto", name: "\u6BD4\u6BD4\u9E1F", dex: 17, tags: ["normal", "flying"], cost: 1, star: 2, evolvesInto: "pidgeot", hp: 66, atk: 12, spa: 11, def: 9, spe: 14, skill: { n: "\u7A7A\u88AD", e: "flying", t: "single", m: 2.1, en: 100 } },
  { id: "pidgeot", name: "\u5927\u6BD4\u9E1F", dex: 18, tags: ["flying"], cost: 1, star: 3, hp: 84, atk: 15, spa: 14, def: 12, spe: 18, skill: { n: "\u66B4\u98CE", e: "flying", t: "aoe", m: 1.25, en: 115 } },
  { id: "wingull", name: "\u957F\u7FC5\u9E25", dex: 278, tags: ["water", "flying"], cost: 1, star: 1, evolvesInto: "pelipper", hp: 44, atk: 8, spa: 11, def: 7, spe: 12, skill: { n: "\u6CE1\u6CAB\u5F39", e: "water", t: "single", m: 1.8, en: 100 } },
  { id: "pelipper", name: "\u5927\u5634\u9E25", dex: 279, tags: ["water", "flying"], cost: 1, star: 2, hp: 70, atk: 10, spa: 14, def: 11, spe: 12, skill: { n: "\u6C34\u5E55\u98CE\u66B4", e: "water", t: "aoe", m: 1.25, en: 115 } },
  { id: "machop", name: "\u8155\u529B", dex: 66, tags: ["fighting"], cost: 1, star: 1, evolvesInto: "machoke", hp: 56, atk: 12, spa: 7, def: 9, spe: 9, skill: { n: "\u91CD\u62F3", e: "fighting", t: "single", m: 2, en: 100 } },
  { id: "machoke", name: "\u8C6A\u529B", dex: 67, tags: ["fighting"], cost: 1, star: 2, evolvesInto: "machamp", hp: 76, atk: 15, spa: 9, def: 12, spe: 11, skill: { n: "\u8FDE\u73AF\u62F3", e: "fighting", t: "single", m: 2.3, en: 100 } },
  { id: "machamp", name: "\u602A\u529B", dex: 68, tags: ["fighting"], cost: 1, star: 3, hp: 92, atk: 19, spa: 10, def: 14, spe: 12, skill: { n: "\u5341\u5B57\u7206\u88C2", e: "fighting", t: "front", m: 1.5, en: 115 } },
  { id: "riolu", name: "\u5229\u6B27\u8DEF", dex: 447, tags: ["fighting"], cost: 3, star: 1, evolvesInto: "lucario", hp: 54, atk: 12, spa: 10, def: 9, spe: 12, skill: { n: "\u6CE2\u5BFC\u5F39", e: "fighting", t: "single", m: 2, en: 100 } },
  { id: "lucario", name: "\u8DEF\u5361\u5229\u6B27", dex: 448, tags: ["fighting"], cost: 3, star: 2, mega: "mega-lucario", hp: 80, atk: 18, spa: 14, def: 12, spe: 15, skill: { n: "\u6CE2\u5BFC\u51B2\u51FB", e: "fighting", t: "aoe", m: 1.3, en: 120 } },
  { id: "gastly", name: "\u9B3C\u65AF", dex: 92, tags: ["ghost", "poison"], cost: 1, star: 1, evolvesInto: "haunter", hp: 42, atk: 9, spa: 12, def: 7, spe: 11, skill: { n: "\u6697\u5F71\u7403", e: "ghost", t: "single", m: 2, en: 100 } },
  { id: "haunter", name: "\u9B3C\u65AF\u901A", dex: 93, tags: ["ghost", "poison"], cost: 1, star: 2, evolvesInto: "gengar", hp: 60, atk: 11, spa: 15, def: 9, spe: 13, skill: { n: "\u9634\u5F71\u7403", e: "ghost", t: "single", m: 2.3, en: 100 } },
  { id: "gengar", name: "\u803F\u9B3C", dex: 94, tags: ["ghost", "poison"], cost: 1, star: 3, mega: "mega-gengar", hp: 76, atk: 13, spa: 19, def: 10, spe: 17, skill: { n: "\u5E7D\u51A5\u7206\u7834", e: "ghost", t: "aoe", m: 1.35, en: 120 } },
  { id: "misdreavus", name: "\u68A6\u5996", dex: 200, tags: ["ghost"], cost: 1, star: 1, evolvesInto: "mismagius", hp: 48, atk: 8, spa: 12, def: 8, spe: 11, skill: { n: "\u5996\u98CE", e: "ghost", t: "single", m: 1.9, en: 100 } },
  { id: "mismagius", name: "\u68A6\u5996\u9B54", dex: 429, tags: ["ghost"], cost: 1, star: 2, hp: 72, atk: 10, spa: 16, def: 10, spe: 14, skill: { n: "\u5E7B\u5F71\u51B2\u51FB", e: "ghost", t: "front", m: 1.5, en: 110 } },
  { id: "dratini", name: "\u8FF7\u4F60\u9F99", dex: 147, tags: ["dragon"], cost: 2, star: 1, evolvesInto: "dragonair", hp: 56, atk: 10, spa: 11, def: 10, spe: 10, skill: { n: "\u9F99\u606F", e: "dragon", t: "single", m: 2, en: 100 } },
  { id: "dragonair", name: "\u54C8\u514B\u9F99", dex: 148, tags: ["dragon"], cost: 2, star: 2, evolvesInto: "dragonite", hp: 74, atk: 13, spa: 14, def: 12, spe: 12, skill: { n: "\u9F99\u5C3E", e: "dragon", t: "single", m: 2.2, en: 100 } },
  { id: "dragonite", name: "\u5FEB\u9F99", dex: 149, tags: ["dragon", "flying"], cost: 2, star: 3, hp: 92, atk: 17, spa: 16, def: 14, spe: 14, skill: { n: "\u9F99\u661F\u7FA4", e: "dragon", t: "aoe", m: 1.4, en: 125 } },
  { id: "garchomp", name: "\u70C8\u54AC\u9646\u9CA8", dex: 445, tags: ["dragon", "ground", "legend"], cost: 5, star: 1, mega: "mega-garchomp", hp: 100, atk: 20, spa: 11, def: 16, spe: 15, skill: { n: "\u5730\u88C2\u51B2\u51FB", e: "ground", t: "single", m: 2.6, en: 110 } },
  { id: "rayquaza", name: "\u70C8\u7A7A\u5750", dex: 384, tags: ["dragon", "flying", "legend"], cost: 5, star: 1, mega: "mega-rayquaza", hp: 92, atk: 17, spa: 20, def: 13, spe: 18, skill: { n: "\u753B\u9F99\u70B9\u775B", e: "dragon", t: "single", m: 2.8, en: 120 } },
  { id: "rhyhorn", name: "\u72EC\u89D2\u7280\u725B", dex: 111, tags: ["ground", "rock"], cost: 1, star: 1, evolvesInto: "rhydon", hp: 62, atk: 12, spa: 7, def: 13, spe: 8, skill: { n: "\u51B2\u649E", e: "ground", t: "single", m: 1.9, en: 100 } },
  { id: "rhydon", name: "\u94BB\u89D2\u7280\u517D", dex: 112, tags: ["ground", "rock"], cost: 1, star: 2, evolvesInto: "rhyperior", hp: 82, atk: 15, spa: 9, def: 16, spe: 10, skill: { n: "\u5CA9\u5D29", e: "rock", t: "single", m: 2.2, en: 100 } },
  { id: "rhyperior", name: "\u8D85\u7532\u72C2\u7280", dex: 464, tags: ["ground", "rock"], cost: 1, star: 3, hp: 98, atk: 18, spa: 10, def: 19, spe: 10, skill: { n: "\u5927\u5730\u9707\u51FB", e: "ground", t: "aoe", m: 1.3, en: 120 } },
  { id: "tyranitar", name: "\u73ED\u57FA\u62C9\u65AF", dex: 248, tags: ["rock", "ground", "legend"], cost: 5, star: 1, mega: "mega-tyranitar", hp: 104, atk: 19, spa: 13, def: 18, spe: 11, skill: { n: "\u66B4\u5CA9\u5D29", e: "rock", t: "aoe", m: 1.5, en: 125 } },
  { id: "caterpie", name: "\u7EFF\u6BDB\u866B", dex: 10, tags: ["bug"], cost: 1, star: 1, evolvesInto: "metapod", hp: 42, atk: 8, spa: 7, def: 7, spe: 7, skill: { n: "\u649E\u51FB", e: "normal", t: "single", m: 1.6, en: 100 } },
  { id: "metapod", name: "\u94C1\u7532\u86F9", dex: 11, tags: ["bug"], cost: 1, star: 2, evolvesInto: "butterfree", hp: 56, atk: 9, spa: 9, def: 11, spe: 8, skill: { n: "\u649E\u51FB", e: "normal", t: "single", m: 1.8, en: 100 } },
  { id: "butterfree", name: "\u5DF4\u5927\u8776", dex: 12, tags: ["bug", "flying"], cost: 1, star: 3, hp: 70, atk: 10, spa: 14, def: 9, spe: 12, skill: { n: "\u9CDE\u7C89\u98CE\u66B4", e: "bug", t: "aoe", m: 1.25, cc: "sleep", en: 120 } },
  { id: "swinub", name: "\u5C0F\u5C71\u732A", dex: 220, tags: ["ice"], cost: 1, star: 1, evolvesInto: "piloswine", hp: 52, atk: 10, spa: 9, def: 9, spe: 8, skill: { n: "\u51B0\u783E", e: "ice", t: "single", m: 1.9, en: 100 } },
  { id: "piloswine", name: "\u957F\u6BDB\u732A", dex: 221, tags: ["ice"], cost: 1, star: 2, evolvesInto: "mamoswine", hp: 72, atk: 13, spa: 11, def: 13, spe: 9, skill: { n: "\u51B0\u9525", e: "ice", t: "single", m: 2.2, en: 100 } },
  { id: "mamoswine", name: "\u8C61\u7259\u732A", dex: 473, tags: ["ice", "ground"], cost: 1, star: 3, hp: 90, atk: 16, spa: 13, def: 16, spe: 10, skill: { n: "\u51B0\u5C01\u5927\u5730", e: "ice", t: "aoe", m: 1.3, cc: "freeze", en: 125 } },
  { id: "ralts", name: "\u62C9\u9C81\u62C9\u4E1D", dex: 280, tags: ["psychic"], cost: 2, star: 1, evolvesInto: "kirlia", hp: 46, atk: 8, spa: 12, def: 8, spe: 11, skill: { n: "\u5FF5\u529B", e: "psychic", t: "single", m: 1.9, en: 100 } },
  { id: "kirlia", name: "\u5947\u9C81\u8389\u5B89", dex: 281, tags: ["psychic"], cost: 2, star: 2, evolvesInto: "gardevoir", hp: 62, atk: 10, spa: 15, def: 10, spe: 13, skill: { n: "\u7CBE\u795E\u51B2\u51FB", e: "psychic", t: "single", m: 2.2, en: 100 } },
  { id: "gardevoir", name: "\u6C99\u5948\u6735", dex: 282, tags: ["psychic"], cost: 2, star: 3, mega: "mega-gardevoir", hp: 80, atk: 12, spa: 19, def: 12, spe: 16, skill: { n: "\u6708\u534E\u5C4F\u969C", e: "psychic", t: "aoe", m: 1.2, shield: 0.2, en: 120 } },
  { id: "mewtwo", name: "\u8D85\u68A6", dex: 150, tags: ["psychic", "legend"], cost: 5, star: 1, mega: "mega-mewtwo", hp: 92, atk: 15, spa: 22, def: 14, spe: 17, skill: { n: "\u7CBE\u795E\u7834\u706D", e: "psychic", t: "single", m: 2.8, en: 120 } }
];

// src/data/species.ts
var SPECIES = species_default;
var SPECIES_MAP = new Map(SPECIES.map((s) => [s.id, s]));
function speciesById(id) {
  const s = SPECIES_MAP.get(id);
  if (!s) throw new Error(`\u672A\u77E5\u7CBE\u7075: ${id}`);
  return s;
}

// src/engine/run.ts
function createRun(seed, name) {
  return {
    seed,
    name: name || "\u65E0\u540D\u4FEE\u58EB",
    stage: 1,
    chapter: 1,
    gold: 8,
    level: 1,
    hp: 100,
    units: [],
    streak: 0,
    dragonStacks: 0,
    clearedStages: 0,
    items: [],
    wins: 0,
    kills: 0,
    over: false,
    result: null
  };
}
function autoCombine(run2, rng2) {
  let merged = true;
  while (merged) {
    merged = false;
    const groups = /* @__PURE__ */ new Map();
    for (const u of run2.units) {
      const k = `${u.speciesId}|${u.star}`;
      const g = groups.get(k);
      if (g) g.push(u);
      else groups.set(k, [u]);
    }
    for (const [, list] of groups) {
      if (list.length < 3) continue;
      const three = list.slice(0, 3);
      const spec = speciesById(three[0].speciesId);
      let nextId = three[0].speciesId;
      let nextStar = three[0].star + 1;
      if (three[0].star < 3) {
        if (spec.evolvesInto) nextId = spec.evolvesInto;
        else if (spec.evolvesRandom) nextId = rng2.pick(spec.evolvesRandom);
      }
      const keep = [...three].sort((x, y) => (x.slot < 0 ? 99 : x.slot) - (y.slot < 0 ? 99 : y.slot))[0];
      const keepItem = three.map((u) => u.item).find((i) => i !== null) ?? null;
      for (const u of three) if (u.item && u.item !== keepItem) run2.items.push(u.item);
      keep.speciesId = nextId;
      keep.star = nextStar;
      keep.item = keepItem;
      run2.units = run2.units.filter((u) => u !== three[1] && u !== three[2]);
      merged = true;
      break;
    }
  }
}

// src/_dbg_test.ts
var run = createRun(1, "t");
var rng = createRng(1);
for (let i = 0; i < 9; i++) {
  run.units.push({ uid: `u${i}`, speciesId: "charmander", star: 1, item: null, slot: -1 });
  autoCombine(run, rng);
  console.log(`\u4E70${i + 1}:`, run.units.map((u) => `${u.speciesId}${u.star}@${u.uid}`).join(","));
}
