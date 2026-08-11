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

// src/data/items.ts
var ITEMS = [
  { id: "mega_stone", name: "\u8FDB\u5316\u94A5\u77F3", desc: "\u88C5\u5907\u540E\u6218\u6597\u5185\u6EE1\u80FD\u91CF\u65F6 Mega \u8FDB\u5316\uFF08\u4EC5\u9650\u6709 Mega \u5F62\u6001\u7684\u7CBE\u7075\uFF09", icon: "\u{1F52E}", mega: true, allMult: 0.1 },
  { id: "power_band", name: "\u529B\u91CF\u5934\u5E26", desc: "\u653B\u51FB +25%", icon: "\u{1F4AA}", atkMult: 0.25 },
  { id: "mystic_drop", name: "\u795E\u79D8\u6C34\u73E0", desc: "\u7279\u653B +25%", icon: "\u{1F4A7}", spaMult: 0.25 },
  { id: "guard_amulet", name: "\u5B88\u62A4\u62A4\u7B26", desc: "\u9632\u5FA1 +25%\uFF0C\u751F\u547D +15%", icon: "\u{1F6E1}\uFE0F", defMult: 0.25, hpMult: 0.15 },
  { id: "swift_wings", name: "\u75BE\u98CE\u4E4B\u7FFC", desc: "\u901F\u5EA6 +25%\uFF08\u653B\u5F97\u66F4\u5FEB\uFF09", icon: "\u{1FABD}", speMult: 0.25 },
  { id: "dragon_teeth", name: "\u9F99\u7259", desc: "\u5168\u5C5E\u6027 +15%", icon: "\u{1F9B7}", allMult: 0.15 },
  { id: "vampire_tooth", name: "\u5438\u8840\u7360\u7259", desc: "\u653B\u51FB\u5438\u8840 +20%", icon: "\u{1FA78}", lifesteal: 0.2 },
  { id: "iron_shell", name: "\u94C1\u58F3", desc: "\u6218\u6597\u5F00\u573A\u83B7\u5F97\u6700\u5927\u751F\u547D 30% \u7684\u62A4\u76FE", icon: "\u{1F41A}", startShield: 0.3 }
];
var itemById = (id) => ITEMS.find((i) => i.id === id);

// src/engine/rules.ts
var ADV = {
  fire: { grass: 1.5, bug: 1.5, ice: 1.5, water: 0.5, ground: 0.5, rock: 0.5 },
  water: { fire: 1.5, ground: 1.5, rock: 1.5, grass: 0.5, electric: 0.5 },
  grass: { water: 1.5, ground: 1.5, rock: 1.5, fire: 0.5, flying: 0.5, bug: 0.5, poison: 0.5 },
  electric: { water: 1.5, flying: 1.5, ground: 0.5 },
  normal: {},
  flying: { grass: 1.5, fighting: 1.5, bug: 1.5, electric: 0.5, rock: 0.5 },
  fighting: { normal: 1.5, ice: 1.5, rock: 1.5, flying: 0.5, psychic: 0.5, ghost: 0.5 },
  ghost: { ghost: 1.5, psychic: 1.5, normal: 0.5 },
  dragon: { dragon: 1.5, ice: 0.5 },
  ground: { fire: 1.5, electric: 1.5, rock: 1.5, poison: 1.5, grass: 0.5, flying: 0.5, water: 0.5 },
  rock: { fire: 1.5, ice: 1.5, flying: 1.5, bug: 1.5, water: 0.5, grass: 0.5, fighting: 0.5, ground: 0.5 },
  bug: { grass: 1.5, psychic: 1.5, fire: 0.5, flying: 0.5, rock: 0.5 },
  ice: { grass: 1.5, ground: 1.5, flying: 1.5, dragon: 1.5, fire: 0.5, fighting: 0.5, rock: 0.5 },
  psychic: { fighting: 1.5, poison: 1.5, bug: 0.5, ghost: 0.5 },
  poison: { grass: 1.5, ground: 0.5, psychic: 0.5 }
};
function typeAdv(attacker, defenderTypes) {
  let m = 1;
  for (const t of defenderTypes) {
    const a = ADV[attacker]?.[t] ?? 1;
    m *= a;
  }
  return m;
}
var STAR_MULT = [1, 2.2, 4.5];
function starMult(star) {
  return STAR_MULT[Math.min(2, Math.max(0, star - 1))];
}
function attackInterval(spe) {
  return Math.max(0.6, 1.8 - spe * 0.06);
}
function traitTier(count, thresholds) {
  let tier = 0;
  for (const th of thresholds) if (count >= th) tier++;
  return tier;
}

// src/engine/run.ts
var MAX_LEVEL = 6;
var MAX_UNITS = 12;
var LEVEL_COST = [0, 5, 9, 15, 22, 32];
var TYPE_CN = {
  fire: "\u706B",
  water: "\u6C34",
  grass: "\u8349",
  electric: "\u7535",
  normal: "\u4E00\u822C",
  flying: "\u98DE\u884C",
  fighting: "\u683C\u6597",
  ghost: "\u5E7D\u7075",
  dragon: "\u9F99",
  ground: "\u5730\u9762",
  rock: "\u5CA9\u77F3",
  bug: "\u866B",
  ice: "\u51B0",
  psychic: "\u8D85\u80FD",
  poison: "\u6BD2"
};
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
function boardUnits(run) {
  return run.units.filter((u) => u.slot >= 0 && u.slot < run.level).sort((a, b) => a.slot - b.slot);
}
var COST_WEIGHTS = [50, 30, 13, 5, 2];
function rollShop(_run, rng) {
  const pool = SPECIES.filter((s) => s.star === 1);
  const offers = [];
  for (let i = 0; i < 3; i++) {
    const cost = 1 + rng.weighted([0, 1, 2, 3, 4], COST_WEIGHTS);
    const tier = pool.filter((s) => s.cost === cost);
    offers.push(tier.length ? rng.pick(tier).id : rng.pick(pool).id);
  }
  return offers;
}
function buyUnit(run, speciesId, rng) {
  const spec = speciesById(speciesId);
  if (!spec || run.gold < spec.cost) return "\u91D1\u5E01\u4E0D\u8DB3";
  if (run.units.length >= MAX_UNITS) return "\u961F\u4F0D\u5DF2\u6EE1";
  run.gold -= spec.cost;
  run.units.push({ uid: `u${run.units.length}_${Math.random()}`, speciesId, star: 1, item: null, slot: -1 });
  autoCombine(run, rng);
  return null;
}
function autoCombine(run, rng) {
  let merged = true;
  while (merged) {
    merged = false;
    const groups = /* @__PURE__ */ new Map();
    for (const u of run.units) {
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
        else if (spec.evolvesRandom) nextId = rng.pick(spec.evolvesRandom);
      }
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
function levelCost(run) {
  if (run.level >= MAX_LEVEL) return null;
  return LEVEL_COST[run.level];
}
function buyLevel(run) {
  const cost = levelCost(run);
  if (cost === null || run.gold < cost) return false;
  run.gold -= cost;
  run.level++;
  return true;
}
function settleStage(run, won, board) {
  const msg = [];
  const interest = Math.min(5, Math.floor(run.gold / 10));
  const base = won ? 6 : 3;
  run.gold += base + interest;
  msg.push(`${won ? "\u80DC" : "\u8D25"} ${base}\u91D1 + \u5229\u606F ${interest}\u91D1`);
  if (won) {
    run.streak = run.streak >= 0 ? run.streak + 1 : 1;
    if (run.streak >= 2) {
      const b = Math.min(run.streak - 1, 3);
      run.gold += b;
      msg.push(`\u8FDE\u80DC +${b}\u91D1`);
    }
    run.clearedStages++;
    run.dragonStacks++;
    run.wins++;
    run.hp = Math.min(100, run.hp + 3);
  } else {
    run.streak = run.streak <= 0 ? run.streak - 1 : -1;
    if (run.streak <= -2) {
      const b = Math.min(-run.streak - 1, 2);
      run.gold += b;
      msg.push(`\u8FDE\u8D25\u8865\u507F +${b}\u91D1`);
    }
    const dmg = 15 + run.stage;
    run.hp -= dmg;
    msg.push(`\u961F\u4F0D\u53D7\u521B -${dmg} \u751F\u547D`);
  }
  const moneyCount = board.filter((u) => speciesById(u.speciesId).tags.includes("money")).length;
  if (moneyCount > 0) {
    const bonus = moneyCount >= 2 ? 6 : 3;
    run.gold += won ? bonus : bonus / 2;
    msg.push(`\u55B5\u55B5\u8D22\u56E2 +${Math.round(won ? bonus : bonus / 2)}\u91D1`);
  }
  if (run.hp <= 0) {
    run.hp = 0;
    run.over = true;
    run.result = "dead";
  }
  return msg;
}
function tagCounts(board) {
  const m = /* @__PURE__ */ new Map();
  for (const u of board) for (const t of speciesById(u.speciesId).tags) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}
var FUN_TAGS = /* @__PURE__ */ new Set(["starter", "money", "gamble", "tank", "legend"]);
var FUN_CN = { starter: "\u5FA1\u4E09\u5BB6", money: "\u55B5\u55B5\u8D22\u56E2", gamble: "\u4F0A\u5E03\u8D4C\u5C40", tank: "\u5DE8\u517D", legend: "\u4F20\u8BF4" };
var FUN_DESC = {
  starter: "\u573A\u4E0A\u4E0D\u540C\u5FA1\u4E09\u5BB6\u8D8A\u591A\uFF0C\u5168\u961F\u653B\u51FB\u8D8A\u9AD8",
  money: "\u6BCF\u5173\u989D\u5916\u91D1\u5E01",
  gamble: "\u4F0A\u5E03\u8FDB\u5316\u968F\u673A\uFF08\u6EE1\u7F16\u66F4\u5F3A\uFF09",
  tank: "\u5766\u514B\u51CF\u4F24",
  legend: "\u4F20\u8BF4\u5355\u4F4D\u5F00\u573A\u80FD\u91CF\u6EE1"
};
function computeSynergies(_run, board) {
  const counts = tagCounts(board);
  const out = [];
  for (const [tag, cn] of Object.entries(TYPE_CN)) {
    const c = counts.get(tag) ?? 0;
    const thresholds = tag === "bug" || tag === "ice" || tag === "psychic" || tag === "poison" ? [2, 4] : [2, 4, 6];
    if (c > 0) out.push({ tag, cn, count: c, tier: traitTier(c, thresholds), thresholds, desc: `${cn}\u7CFB\u7F81\u7ECA`, isFun: false });
  }
  for (const tag of FUN_TAGS) {
    const c = counts.get(tag) ?? 0;
    const thresholds = tag === "legend" ? [2, 3] : tag === "starter" ? [2, 3, 4] : [1, 2];
    if (c > 0) out.push({ tag, cn: FUN_CN[tag], count: c, tier: traitTier(c, thresholds), thresholds, desc: FUN_DESC[tag], isFun: true });
  }
  return out.filter((s) => s.tier > 0).sort((a, b) => b.tier - a.tier);
}
var PHYSICAL_ELEM = /* @__PURE__ */ new Set(["fighting", "normal", "ground", "rock", "bug"]);
function resolveSkill(spec) {
  const s = spec.skill;
  return { ...s, power: s.power ?? (PHYSICAL_ELEM.has(s.e) ? "atk" : "spa") };
}
function resolveBoard(run, board) {
  const synergies = computeSynergies(run, board);
  const t = (tag) => synergies.find((s) => s.tag === tag)?.tier ?? 0;
  const tierVal = (tier, arr) => tier > 0 ? arr[tier - 1] : 0;
  const dragonRate = tierVal(t("dragon"), [0.015, 0.03, 0.05]);
  const dragonMult = 1 + run.dragonStacks * dragonRate;
  const units = board.map((u) => {
    const spec = speciesById(u.speciesId);
    const sm = starMult(u.star);
    let hp = spec.hp * sm, atk = spec.atk * sm, spa = spec.spa * sm, def = spec.def * sm, spe = spec.spe * sm;
    let crit = 0, dodge = 0, lifesteal = 0, regen = 0, poisonOnHit = 0, energyGain = 4, ghost = 0, ccBonus = 0, startShield = 0, startEnergy = 45;
    atk *= 1 + tierVal(t("fire"), [0.15, 0.35, 0.7]);
    lifesteal += tierVal(t("water"), [0.08, 0.18, 0.3]);
    regen += tierVal(t("grass"), [0.02, 0.04, 0.07]);
    spe *= 1 + tierVal(t("electric"), [0.18, 0.4, 0.8]);
    hp *= 1 + tierVal(t("normal"), [0.1, 0.25, 0.45]);
    dodge += tierVal(t("flying"), [0.1, 0.22, 0.4]);
    crit += tierVal(t("fighting"), [0.15, 0.3, 0.55]);
    ghost += tierVal(t("ghost"), [0.06, 0.1, 0.16]);
    def *= 1 + tierVal(t("ground"), [0.25, 0.5, 0.9]);
    startShield += tierVal(t("rock"), [0.15, 0.3, 0.5]);
    hp *= 1 + tierVal(t("bug"), [0.08, 0.2]);
    ccBonus += tierVal(t("ice"), [0.25, 0.6]);
    energyGain += tierVal(t("psychic"), [4, 10]);
    poisonOnHit += tierVal(t("poison"), [1, 2]);
    atk *= 1 + tierVal(t("starter"), [0.08, 0.2, 0.35]);
    if (spec.tags.includes("tank")) def *= 1 + tierVal(t("tank"), [0.2, 0.4]);
    if (spec.tags.includes("gamble")) {
      const gm = 1 + tierVal(t("gamble"), [0, 0.12]);
      hp *= gm;
      atk *= gm;
      spa *= gm;
      def *= gm;
      spe *= gm;
    }
    if (spec.tags.includes("legend")) {
      startEnergy = 85;
      const lm = 1 + tierVal(t("legend"), [0, 0.15, 0.35]);
      hp *= lm;
      atk *= lm;
      spa *= lm;
      def *= lm;
      spe *= lm;
    }
    if (spec.tags.includes("dragon")) {
      hp *= dragonMult;
      atk *= dragonMult;
      spa *= dragonMult;
      def *= dragonMult;
      spe *= dragonMult;
    }
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
    hp = Math.round(hp);
    atk = Math.round(atk);
    spa = Math.round(spa);
    def = Math.round(def);
    spe = Math.round(spe);
    return {
      uid: u.uid,
      speciesId: u.speciesId,
      name: spec.name,
      tags: spec.tags,
      elem: spec.tags.find((x) => TYPE_CN[x]) ?? "normal",
      slot: u.slot,
      hp,
      maxhp: hp,
      atk,
      spa,
      def,
      spe,
      skill: resolveSkill(spec),
      item: u.item,
      canMega: !!it?.mega && !!spec.mega,
      energy: 45,
      atkTimer: 0,
      cc: "",
      ccTimer: 0,
      shield: Math.round(hp * startShield),
      mega: false,
      megaUsed: false,
      poison: 0,
      poisonTimer: 0,
      regenTimer: 0,
      crit,
      dodge,
      lifesteal,
      regen,
      poisonOnHit,
      energyGain,
      ghostBonus: ghost,
      ccBonus,
      startEnergy
    };
  });
  return { units, synergies };
}

// src/engine/battle.ts
var DT = 0.1;
var MAX_TIME = 90;
function startBattle(ally, enemy, rng) {
  return {
    rng,
    time: 0,
    over: false,
    ally: ally.map((u) => ({ ...u, energy: u.startEnergy ?? 45, atkTimer: 0, cc: "", ccTimer: 0, shield: 0, mega: false, megaUsed: false, poison: 0, poisonTimer: 0, regenTimer: 0 })),
    enemy: enemy.map((u) => ({ ...u, energy: u.startEnergy ?? 45, atkTimer: 0, cc: "", ccTimer: 0, shield: 0, mega: false, megaUsed: false, poison: 0, poisonTimer: 0, regenTimer: 0 })),
    events: [],
    allyTotal: ally.length,
    enemyTotal: enemy.length,
    dmgDealt: []
  };
}
function alive(side) {
  return side.filter((u) => u.hp > 0);
}
function targetOf(opp) {
  const t = alive(opp).sort((a, b) => a.slot - b.slot);
  return t[0] ?? null;
}
function otherSide(b, side) {
  return side === "ally" ? b.enemy : b.ally;
}
function mySide(b, side) {
  return side === "ally" ? b.ally : b.enemy;
}
function hit(b, side, source, target, raw, elem, ghost, crit) {
  if (target.hp <= 0) return 0;
  if (b.rng.chance(target.dodge)) {
    b.events.push({ type: "damage", side, slot: target.slot, amount: 0 });
    return 0;
  }
  const adv = typeAdv(elem, target.tags);
  const lost = b[side === "ally" ? "allyTotal" : "enemyTotal"] - alive(mySide(b, side)).length;
  let out = Math.round(raw * adv * (1 + Math.max(0, lost) * ghost));
  if (crit) out = Math.round(out * 1.6);
  const shieldAbs = Math.min(target.shield, out);
  target.shield -= shieldAbs;
  out -= shieldAbs;
  out = Math.max(0, out);
  target.hp -= out;
  b.events.push({ type: "attack", side, from: source ? source.slot : -1, to: target.slot, dmg: out, crit, elem });
  if (source && source.lifesteal > 0 && out > 0) {
    const h = Math.round(out * source.lifesteal);
    source.hp = Math.min(source.maxhp, source.hp + h);
    b.events.push({ type: "heal", side, slot: source.slot, amount: h });
  }
  if (target.hp <= 0) {
    target.hp = 0;
    b.events.push({ type: "die", side, slot: target.slot });
    const rec = b.dmgDealt.find((d) => d.uid === source?.uid);
    if (rec) rec.kills++;
  }
  if (source) {
    let rec = b.dmgDealt.find((d) => d.uid === source.uid);
    if (!rec) {
      rec = { uid: source.uid, name: source.name, dmg: 0, kills: 0 };
      b.dmgDealt.push(rec);
    }
    rec.dmg += out;
  }
  return out;
}
function applyHeal(b, side, u, amount, isShield) {
  if (isShield) {
    u.shield += amount;
    b.events.push({ type: "shield", side, slot: u.slot, amount });
  } else {
    const before = u.hp;
    u.hp = Math.min(u.maxhp, u.hp + amount);
    b.events.push({ type: "heal", side, slot: u.slot, amount: Math.max(0, u.hp - before) });
  }
}
function castSkill(b, side, u, ghost) {
  const s = u.skill;
  u.energy = 0;
  const power = s.power === "atk" ? u.atk : u.spa;
  const units = mySide(b, side);
  const opp = otherSide(b, side);
  const dmgBase = Math.round(power * s.m);
  let dmg = 0, heal = 0, shield = 0, cc = "";
  let targetSlot = -1;
  switch (s.t) {
    case "single": {
      const t = targetOf(opp);
      if (t) {
        targetSlot = t.slot;
        hit(b, side, u, t, dmgBase, s.e, ghost, b.rng.chance(u.crit));
      }
      break;
    }
    case "front": {
      for (const t of alive(opp).filter((o) => o.slot < 3)) hit(b, side, u, t, dmgBase, s.e, ghost, false);
      break;
    }
    case "aoe": {
      for (const t of alive(opp)) hit(b, side, u, t, dmgBase, s.e, ghost, false);
      break;
    }
    case "random": {
      const av = alive(opp);
      if (av.length) {
        const t = b.rng.pick(av);
        targetSlot = t.slot;
        hit(b, side, u, t, dmgBase, s.e, ghost, false);
      }
      break;
    }
    case "heal_self":
      heal = Math.round(u.maxhp * (s.heal ?? 0.4));
      applyHeal(b, side, u, heal, false);
      break;
    case "heal_lowest": {
      const lowest = alive(units).sort((a, c) => a.hp / a.maxhp - c.hp / c.maxhp)[0];
      if (lowest) {
        heal = Math.round(lowest.maxhp * (s.heal ?? 0.4));
        applyHeal(b, side, lowest, heal, false);
      }
      break;
    }
  }
  if (s.cc) {
    const t = targetOf(opp);
    if (t && b.rng.chance(Math.min(1, 0.35 + u.ccBonus))) {
      cc = s.cc;
      t.cc = s.cc;
      t.ccTimer = 2.2;
      b.events.push({ type: "cc", side, slot: t.slot, kind: s.cc });
    }
  }
  b.events.push({ type: "cast", side, from: u.slot, elem: s.e, shape: s.t, dmg, heal, shield, cc, target: targetSlot });
}
function stepSim(b, allyGhost, enemyGhost) {
  if (b.over) return;
  b.time += DT;
  const processSide = (side) => {
    const units = mySide(b, side);
    const opp = otherSide(b, side);
    const ghost = side === "ally" ? allyGhost : enemyGhost;
    for (const u of alive(units)) {
      if (b.over) break;
      if (u.ccTimer > 0) {
        u.ccTimer -= DT;
        if (u.ccTimer <= 0) u.cc = "";
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
      if (u.poison > 0) {
        u.poisonTimer -= DT;
        if (u.poisonTimer <= 0) {
          u.poisonTimer = 1;
          const dot = Math.max(1, Math.round(u.maxhp * 0.02 * u.poison));
          hit(b, side, null, u, dot, "poison", 0, false);
        }
      }
      if (u.regen > 0) {
        u.regenTimer -= DT;
        if (u.regenTimer <= 0) {
          u.regenTimer = 3;
          applyHeal(b, side, u, Math.round(u.maxhp * u.regen), false);
        }
      }
      if (u.energy >= u.skill.en) {
        if (u.canMega && !u.megaUsed) {
          u.megaUsed = true;
          u.mega = true;
          u.maxhp = Math.round(u.maxhp * 1.6);
          u.hp = u.maxhp;
          u.atk = Math.round(u.atk * 1.6);
          u.spa = Math.round(u.spa * 1.6);
          u.def = Math.round(u.def * 1.6);
          b.events.push({ type: "mega", side, slot: u.slot });
        }
        castSkill(b, side, u, ghost);
      }
    }
    if (alive(opp).length === 0 && !b.over) {
      b.over = side === "ally" ? "win" : "lose";
      b.events.push({ type: b.over === "win" ? "win" : "lose" });
    }
  };
  processSide("ally");
  if (b.over) return;
  processSide("enemy");
  if (b.time > MAX_TIME) {
    const aHp = alive(b.ally).reduce((s, u) => s + u.hp, 0) / Math.max(1, b.ally.length);
    const eHp = alive(b.enemy).reduce((s, u) => s + u.hp, 0) / Math.max(1, b.enemy.length);
    b.over = aHp >= eHp ? "win" : "lose";
    b.events.push({ type: b.over === "win" ? "win" : "lose" });
  }
}
function simulate(b, allyGhost = 0, enemyGhost = 0) {
  let guard = 0;
  while (b.over === false && guard++ < 2e3) stepSim(b, allyGhost, enemyGhost);
  return { result: b.over === "win" ? "win" : "lose", time: b.time };
}

// src/data/campaign.ts
var CHAPTERS = [
  { title: "\u7B2C\u4E00\u7AE0 \xB7 \u521D\u5165\u68EE\u6797", boss: "\u8349\u4E1B\u9738\u4E3B", scale: 0.9, theme: "grass" },
  { title: "\u7B2C\u4E8C\u7AE0 \xB7 \u6EAA\u8C37\u8BD5\u70BC", boss: "\u6C34\u7CFB\u9986\u4E3B", scale: 1.12, theme: "water" },
  { title: "\u7B2C\u4E09\u7AE0 \xB7 \u5E7D\u6697\u6D1E\u7A9F", boss: "\u5E7D\u7075\u9986\u4E3B", scale: 1.36, theme: "ghost" },
  { title: "\u7B2C\u56DB\u7AE0 \xB7 \u9F99\u4E4B\u88C2\u8C37", boss: "\u9F99\u4E4B\u957F\u8001", scale: 1.62, theme: "dragon" },
  { title: "\u7B2C\u4E94\u7AE0 \xB7 \u51A0\u519B\u4E4B\u8DEF", boss: "\u7CBE\u7075\u51A0\u519B", scale: 1.9, theme: "legend" }
];
var CHAPTERS_TOTAL = CHAPTERS.length;
var STAGE_PER_CHAPTER = 5;
var TOTAL_STAGES = CHAPTERS_TOTAL * STAGE_PER_CHAPTER;
function chapterOf(stage) {
  return CHAPTERS[Math.min(CHAPTERS_TOTAL - 1, Math.floor((stage - 1) / STAGE_PER_CHAPTER))];
}
function isBossStage(stage) {
  return stage % STAGE_PER_CHAPTER === 0;
}
var THEMES = ["fire", "water", "grass", "electric", "normal", "flying", "fighting", "ghost", "dragon", "ground", "rock", "bug", "ice", "psychic"];
var PHYSICAL = /* @__PURE__ */ new Set(["fighting", "normal", "ground", "rock", "bug"]);
function resolveSkill2(spec) {
  const s = spec.skill;
  return { ...s, power: s.power ?? (PHYSICAL.has(s.e) ? "atk" : "spa") };
}
function genEnemyTeam(rng, stage, isBoss = false) {
  const ch = chapterOf(stage);
  const scale = ch.scale * (1 + stage * 0.02);
  let theme;
  if (isBoss) {
    theme = ch.theme === "legend" ? rng.pick(["dragon", "psychic", "ground", "fire"]) : ch.theme;
  } else {
    theme = rng.pick(THEMES);
  }
  const themed = SPECIES.filter((s) => s.tags.includes(theme));
  const teamSize = isBoss ? Math.min(6, 3 + Math.floor(stage / 4)) : Math.min(6, 1 + Math.floor(stage / 3));
  const p3 = Math.min(0.55, Math.max(0, (stage - 10) / 14));
  const p2 = Math.min(0.6, Math.max(0, (stage - 4) / 12));
  const units = [];
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
    if (isBoss) {
      hp *= 1.35;
      atk *= 1.15;
      spa *= 1.15;
    }
    hp = Math.round(hp);
    atk = Math.round(atk);
    spa = Math.round(spa);
    def = Math.round(def);
    spe = Math.round(spe);
    units.push({
      uid: `enemy_${i}`,
      speciesId: spec.id,
      name: spec.name,
      tags: spec.tags,
      elem: spec.tags.find((x) => THEMES.includes(x)) ?? "normal",
      slot: i,
      hp,
      maxhp: hp,
      atk,
      spa,
      def,
      spe,
      skill: resolveSkill2(spec),
      item: null,
      canMega: false,
      energy: 45,
      atkTimer: 0,
      cc: "",
      ccTimer: 0,
      shield: 0,
      mega: false,
      megaUsed: false,
      poison: 0,
      poisonTimer: 0,
      regenTimer: 0,
      crit: 0,
      dodge: 0,
      lifesteal: 0,
      regen: 0,
      poisonOnHit: 0,
      energyGain: 4,
      ghostBonus: 0,
      ccBonus: 0,
      startEnergy: 45
    });
  }
  return units;
}

// src/_engine_test.ts
var pass = 0;
var fail = 0;
function check(name, cond, extra = "") {
  if (cond) {
    pass++;
    console.log(`  \u2713 ${name}`);
  } else {
    fail++;
    console.log(`  \u2717 ${name} ${extra}`);
  }
}
console.log("== \u6570\u636E\u81EA\u6D3D ==");
check("\u7CBE\u7075\u6C60\u975E\u7A7A", SPECIES.length > 40, `(${SPECIES.length})`);
for (const s of SPECIES) {
  const sm = starMult(s.star);
  if (s.evolvesInto) check(`\u8FDB\u5316\u94FE ${s.id}\u2192${s.evolvesInto}`, SPECIES.some((x) => x.id === s.evolvesInto));
  if (s.evolvesRandom) for (const e of s.evolvesRandom) check(`\u968F\u673A\u8FDB\u5316 ${s.id}\u2192${e}`, SPECIES.some((x) => x.id === e));
}
console.log("== \u8DD1\u5C40\u5F15\u64CE ==");
{
  const rng = createRng(12345);
  const run = createRun(12345, "\u6D4B\u8BD5");
  run.gold = 999;
  for (let i = 0; i < 9; i++) {
    buyUnit(run, "charmander", rng);
  }
  const char = run.units.find((u) => u.speciesId === "charizard");
  check("9 \u5C0F\u706B\u9F99 \u2192 1 \u55B7\u706B\u9F993\u661F", !!char && char.star === 3, JSON.stringify(run.units.map((u) => `${u.speciesId}${u.star}`)));
  check("\u5269\u4F59\u5355\u4F4D\u6570 = 1", run.units.length === 1);
  settleStage(run, true, boardUnits(run));
  check("\u80DC\u5229\u540E\u91D1\u5E01\u589E\u52A0", run.gold > 0, `gold=${run.gold}`);
  check("\u8FDE\u80DC\u8BA1\u6570", run.streak === 1);
  const cost = levelCost(run);
  check("\u5347\u7EA7\u82B1\u8D39\u5B58\u5728", cost !== null);
  check("\u91D1\u5E01\u591F\u5347 1 \u7EA7", buyLevel(run), `gold=${run.gold}, level=${run.level}`);
  const offers = rollShop(run, rng);
  check("\u5546\u5E97 3 \u4E2A\u5546\u54C1", offers.length === 3);
  for (const o of offers) check(`\u5546\u54C1\u5B58\u5728 ${o}`, SPECIES.some((s) => s.id === o));
}
console.log("== \u654C\u4EBA\u751F\u6210 ==");
{
  const rng = createRng(999);
  for (const stage of [1, 5, 10, 15, 20, 25]) {
    const team = genEnemyTeam(rng, stage, isBossStage(stage));
    check(`\u7B2C${stage}\u5173\u654C\u65B9 ${team.length} \u4EBA`, team.length >= 1 && team.length <= 6, `(${team.length})`);
    for (const u of team) {
      check(`\u654C\u65B9\u5355\u4F4D\u6570\u636E\u5B8C\u6574 ${u.name}`, u.hp > 0 && u.skill && u.skill.name !== "", `${u.name} hp=${u.hp}`);
    }
  }
}
console.log("== \u6218\u6597\u786E\u5B9A\u6027 ==");
{
  const rng = createRng(555);
  const run = createRun(555, "\u73A9\u5BB6");
  run.gold = 999;
  for (let i = 0; i < 12; i++) buyUnit(run, ["machop", "pikachu", "gastly", "charmander"][i % 4], rng);
  run.units.forEach((u, i) => {
    u.slot = i % 3;
  });
  const rb = resolveBoard(run, boardUnits(run));
  const enemy = genEnemyTeam(rng, 5, true);
  const run1 = () => {
    const b = startBattle(rb.units, enemy, createRng(111));
    return simulate(b);
  };
  const r1 = run1();
  const r2 = run1();
  check("\u540C seed \u540C\u7ED3\u679C", r1.result === r2.result, `${r1.result} vs ${r2.result}`);
  check("\u6211\u65B9\u5355\u4F4D\u5DF2\u7ED3\u7B97\u5C5E\u6027", rb.units.length > 0 && rb.units[0].maxhp > 0, `hp=${rb.units[0]?.maxhp}`);
  console.log(`  \u6837\u672C\u6218\u6597\uFF1A\u6211\u65B9 ${rb.units.length} vs \u654C\u65B9 ${enemy.length} \u2192 ${r1.result}\uFF08${r1.time.toFixed(1)}s\uFF09`);
}
console.log(`
${pass} \u901A\u8FC7, ${fail} \u5931\u8D25`);
if (fail > 0) process.exit(1);
