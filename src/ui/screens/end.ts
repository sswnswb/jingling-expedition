/** 远征结算：通关 / 团灭，展示战绩。 */

import type { GameCtx, ScreenMount } from '../router';
import { TOTAL_STAGES } from '../../engine/run';
import { menuScreen } from './menu';
import { sfx } from '../sfx';

export const endScreen: ScreenMount = (app, ctx: GameCtx, router) => {
  const run = ctx.run;
  const won = run.result === 'victory';
  if (won) sfx.win(); else sfx.lose();

  const power = (run.clearedStages * 30 + run.wins * 15 + run.kills * 5).toLocaleString();

  app.className = 'screen screen--modal';
  app.innerHTML = `
    <div class="modal ${won ? 'modal--win' : 'modal--lose'}">
      <h2>${won ? '远征通关！' : '远征结束'}</h2>
      <p class="modal__sub">${ctx.name} · ${won ? '你率队打穿了所有关卡，登顶冠军之路！' : `倒在了第 ${run.stage}/${TOTAL_STAGES} 关。`}</p>
      <div class="modal__stats">
        <div class="stat-row"><span>远征者</span><b>${ctx.name}</b></div>
        <div class="stat-row"><span>推进关卡</span><b>${Math.min(run.stage, TOTAL_STAGES)} / ${TOTAL_STAGES}</b></div>
        <div class="stat-row"><span>胜场</span><b>${run.wins}</b></div>
        <div class="stat-row"><span>斩杀</span><b>${run.kills}</b></div>
        <div class="stat-row"><span>战力评分</span><b class="gold">${power}</b></div>
        <div class="stat-row"><span>最终阵容</span><b>${run.units.length} 只</b></div>
      </div>
      <button class="btn btn--primary" id="end-again">再开一局</button>
      <p class="modal__tiny">每次远征都是一条新的命数 · 下次换个羁绊试试</p>
    </div>
  `;

  app.querySelector('#end-again')?.addEventListener('click', () => {
    sfx.click();
    router.show(menuScreen);
  });
};
