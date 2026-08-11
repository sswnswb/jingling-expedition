import { createRng } from './engine/rng';
import { createRun } from './engine/run';
import { autoCombine } from './engine/run';
const run = createRun(1, 't');
const rng = createRng(1);
for (let i = 0; i < 9; i++) {
  run.units.push({ uid: `u${i}`, speciesId: 'charmander', star: 1, item: null, slot: -1 });
  autoCombine(run, rng);
  console.log(`买${i+1}:`, run.units.map(u => `${u.speciesId}${u.star}@${u.uid}`).join(','));
}
