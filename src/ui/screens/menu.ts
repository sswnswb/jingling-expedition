/** 主菜单：起名 → 开始远征。 */

import type { GameCtx, ScreenMount } from '../router';
import { createRun, rollShop } from '../../engine/run';
import { sfx } from '../sfx';
import { prepScreen } from './prep';

const NAME_KEY = 'jingling_expedition_name';

export const menuScreen: ScreenMount = (app, ctx: GameCtx, router) => {
  const saved = (() => { try { return localStorage.getItem(NAME_KEY) ?? ''; } catch { return ''; } })();

  app.className = 'screen screen--title';
  app.innerHTML = `
    <div class="title-wrap">
      <h1 class="title-name">精灵远征</h1>
      <p class="title-sub">宝可梦 × 自走棋 · 单人闯关远征</p>
      <label class="title__namebox">
        <span>远征者名</span>
        <input id="inp-name" maxlength="8" placeholder="无名训练师" value="${saved}" />
      </label>
      <button class="btn btn--primary" id="btn-start">开始远征</button>
      <div class="title-tips">
        <div>🪙 攒利息 · 🧬 三只合成进化 · ⭐ 凑羁绊</div>
        <div>🔮 装上进化钥石，满能量 Mega 进化</div>
      </div>
      <div class="title-ver">v0.2</div>
    </div>
  `;

  app.querySelector('#btn-start')?.addEventListener('click', () => {
    const name = (app.querySelector<HTMLInputElement>('#inp-name')?.value ?? '').trim();
    ctx.name = name || '无名训练师';
    try { localStorage.setItem(NAME_KEY, name); } catch { /* 忽略 */ }
    ctx.run = createRun(ctx.seed, ctx.name);
    ctx.offers = rollShop(ctx.run, ctx.rng);
    ctx.enemy = [];
    ctx.pendingItems = [];
    ctx.pendingMsg = [];
    ctx.lastEnemyPower = 0;
    sfx.click();
    router.show(prepScreen);
  });
};
