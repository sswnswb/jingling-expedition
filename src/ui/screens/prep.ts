/** 备战屏（局内管理）：商店/合成进化/上阵下阵/装备/羁绊/经济/出战。 */

import type { GameCtx, ScreenMount } from '../router';
import {
  rollShop, buyUnit, sellUnit, placeUnit, equipItem, buyLevel, levelCost, boardUnits,
  benchUnits, resolveBoard, shopRerollCost, MAX_LEVEL, type BoardUnit,
} from '../../engine/run';
import { speciesById } from '../../data/species';
import { itemById } from '../../data/items';
import { genEnemyTeam, isBossStage, chapterOf, TOTAL_STAGES } from '../../data/campaign';
import { TYPE_CN } from '../../engine/rules';
import { sfx } from '../sfx';
import { battleScreen } from './battle';

export const prepScreen: ScreenMount = (app, ctx: GameCtx, router) => {
  const run = ctx.run;
  // 战利品入库存
  if (ctx.pendingItems.length) {
    for (const it of ctx.pendingItems) run.items.push(it);
    ctx.pendingMsg.push(`📦 获得装备：${ctx.pendingItems.map((i) => itemById(i)?.name ?? i).join('、')}`);
    ctx.pendingItems = [];
  }
  if (ctx.pendingMsg.length === 0 && run.stage === 1) {
    ctx.pendingMsg.push('开局：买精灵合成进化，凑羁绊，闯过所有关卡！');
  }

  let selectedUid: string | null = null;
  let shop = ctx.offers;

  const render = () => {
    const board = boardUnits(run);
    const bench = benchUnits(run);
    const resolved = resolveBoard(run, board);
    const ch = chapterOf(run.stage);
    const lc = levelCost(run);

    app.className = 'screen prep';
    app.innerHTML = `
      <header class="prep__hud">
        <div class="prep__stage">${ch.title}<br><span class="prep__stage-sub">第 ${run.stage}/${TOTAL_STAGES} 关${isBossStage(run.stage) ? ' · BOSS' : ''}</span></div>
        <div class="prep__stats">
          <span class="stat gold">🪙 ${run.gold}</span>
          <span class="stat">❤️ ${run.hp}</span>
          <span class="stat">🏆 ${run.streak > 0 ? `连胜${run.streak}` : run.streak < 0 ? `连败${-run.streak}` : '—'}</span>
          <span class="stat">${run.dragonStacks > 0 ? `🐲 ${run.dragonStacks}` : ''}</span>
          <button class="btn btn--small" id="p-level">升级 ${lc ? `(${lc}金)` : 'MAX'} Lv.${run.level}/${MAX_LEVEL}</button>
        </div>
        <div class="prep__actions">
          <button class="btn btn--small" id="p-reroll">刷新 ${shopRerollCost(run)}金</button>
          <button class="btn btn--primary btn--sm" id="p-fight">出 战</button>
        </div>
      </header>

      ${ctx.pendingMsg.length ? `<div class="prep__toast">${ctx.pendingMsg.join('<br>')}</div>` : ''}

      <div class="prep__synergy" id="synergy"></div>

      <div class="prep__boardwrap">
        <div class="prep__board" id="board"></div>
        <div class="prep__bench" id="bench"></div>
      </div>

      <div class="prep__shop" id="shop"></div>

      <div class="prep__selected" id="selected"></div>
    `;

    // 羁绊
    const sy = document.getElementById('synergy')!;
    if (resolved.synergies.length === 0) sy.innerHTML = '<span class="sy-empty">上阵精灵可触发羁绊</span>';
    else {
      sy.innerHTML = resolved.synergies.map((s) => `
        <span class="sy ${s.tier > 0 ? 'on' : ''}">
          ${s.cn} ${s.count}/${s.thresholds.map((t) => t).join('/')}
          ${s.tier > 0 ? `<b>·${s.tier}层</b>` : ''}
        </span>`).join('');
    }

    // 棋盘
    const bd = document.getElementById('board')!;
    const slots = document.createElement('div');
    slots.className = 'prep__grid';
    for (let s = 0; s < MAX_LEVEL; s++) {
      const u = board.find((x) => x.slot === s);
      const cell = document.createElement('div');
      cell.className = `slot${s >= run.level ? ' locked' : ''}${u ? ' filled' : ''}${selectedUid === u?.uid ? ' sel' : ''}`;
      cell.innerHTML = u
        ? unitHtml(u, true)
        : `<div class="slot-empty">${s < run.level ? `${s + 1}` : '🔒'}</div>`;
      cell.addEventListener('click', () => {
        if (s >= run.level) return;
        if (u) { selectedUid = selectedUid === u.uid ? null : u.uid; sfx.click(); render(); return; }
        if (selectedUid) {
          const sel = run.units.find((x) => x.uid === selectedUid);
          if (sel) { placeUnit(run, sel.uid, s); sfx.click(); selectedUid = null; render(); }
        }
      });
      slots.appendChild(cell);
    }
    bd.appendChild(slots);

    // 备战席
    const bn = document.getElementById('bench')!;
    bench.forEach((u) => {
      const c = document.createElement('div');
      c.className = `bench-slot${selectedUid === u.uid ? ' sel' : ''}`;
      c.innerHTML = unitHtml(u, false);
      c.addEventListener('click', () => { selectedUid = selectedUid === u.uid ? null : u.uid; sfx.click(); render(); });
      bn.appendChild(c);
    });
    if (bench.length === 0) {
      const h = document.createElement('div');
      h.className = 'bench-hint';
      h.textContent = '备战席（买来的精灵先到这儿）';
      bn.appendChild(h);
    }

    // 商店
    const sh = document.getElementById('shop')!;
    sh.innerHTML = `<div class="shop-title">商店 · 攒利息</div>`;
    const row = document.createElement('div');
    row.className = 'shop-row';
    shop.forEach((id) => {
      const spec = speciesById(id);
      const can = run.gold >= spec.cost;
      const c = document.createElement('div');
      c.className = `shop-card${can ? '' : ' cant'}`;
      c.innerHTML = `
        <img class="shop-img" src="img/${id}.png" loading="lazy">
        <div class="shop-name">${spec.name}</div>
        <div class="shop-tags">${spec.tags.map((t) => `<span class="tag">${TYPE_CN[t] ?? t}</span>`).join('')}</div>
        <div class="shop-skill">${spec.skill.name}</div>
        <button class="btn btn--small ${can ? 'btn--gold' : ''}" ${can ? '' : 'disabled'}>🪙 ${spec.cost}</button>`;
      c.addEventListener('click', () => {
        if (buyUnit(run, id, ctx.rng) === null) { sfx.buy(); shop = rollShop(run, ctx.rng); render(); }
        else sfx.sell();
      });
      row.appendChild(c);
    });
    sh.appendChild(row);

    // 选中单位详情
    const sel = document.getElementById('selected')!;
    if (selectedUid) {
      const u = run.units.find((x) => x.uid === selectedUid);
      if (u) {
        const spec = speciesById(u.speciesId);
        const rb = resolveBoard(run, boardUnits(run));
        const stat = rb.units.find((x) => x.uid === u.uid);
        sel.innerHTML = `
          <div class="sel-card">
            <img class="sel-img" src="img/${u.speciesId}.png">
            <div class="sel-info">
              <div class="sel-name">${spec.name} <span class="stars">${'★'.repeat(u.star)}${'☆'.repeat(3 - u.star)}</span></div>
              <div class="sel-skill">技能：${spec.skill.name}</div>
              <div class="sel-item">${u.item ? `装备：${itemById(u.item)?.name ?? ''}` : '装备：无'}</div>
              ${stat ? `<div class="sel-stats">生命${stat.maxhp} 攻${stat.atk} 特攻${stat.spa} 防${stat.def} 速${stat.spe}</div>` : ''}
            </div>
            <div class="sel-actions">
              ${u.item ? `<button class="btn btn--small" id="s-unequip">卸下</button>` : ''}
              ${run.items.length && !u.item ? `<button class="btn btn--small" id="s-equip">装备(${run.items.length})</button>` : ''}
              ${u.slot >= 0 ? `<button class="btn btn--small" id="s-bench">下阵</button>` : ''}
              <button class="btn btn--small" id="s-sell">出售 +${spec.cost}</button>
              <button class="btn btn--small" id="s-close">✕</button>
            </div>
          </div>`;
        sel.querySelector('#s-sell')?.addEventListener('click', () => { sellUnit(run, u.uid); sfx.sell(); selectedUid = null; render(); });
        sel.querySelector('#s-bench')?.addEventListener('click', () => { placeUnit(run, u.uid, -1); sfx.click(); render(); });
        sel.querySelector('#s-equip')?.addEventListener('click', () => { equipItem(run, u.uid, run.items[0]); sfx.equip(); render(); });
        sel.querySelector('#s-unequip')?.addEventListener('click', () => { equipItem(run, u.uid, null); sfx.equip(); render(); });
        sel.querySelector('#s-close')?.addEventListener('click', () => { selectedUid = null; render(); });
      }
    }

    document.getElementById('p-level')?.addEventListener('click', () => { if (buyLevel(run)) { sfx.levelup(); render(); } });
    document.getElementById('p-reroll')?.addEventListener('click', () => {
      if (run.gold >= shopRerollCost(run)) { run.gold -= shopRerollCost(run); shop = rollShop(run, ctx.rng); sfx.reroll(); render(); }
    });
    document.getElementById('p-fight')?.addEventListener('click', () => {
      if (boardUnits(run).length === 0) { ctx.pendingMsg = ['至少上阵一只精灵才能出战！']; render(); return; }
      ctx.enemy = genEnemyTeam(ctx.rng, run.stage, isBossStage(run.stage));
      ctx.offers = shop;
      ctx.pendingMsg = [];
      router.show(battleScreen);
    });
  };

  function unitHtml(u: BoardUnit, _onBoard: boolean): string {
    const spec = speciesById(u.speciesId);
    return `
      <div class="unit">
        <img class="unit-img" src="img/${u.speciesId}.png" loading="lazy">
        <div class="unit-stars">${'★'.repeat(u.star)}</div>
        ${u.item ? `<div class="unit-item">${itemById(u.item)?.icon ?? ''}</div>` : ''}
        <div class="unit-name">${spec.name}</div>
      </div>`;
  }

  render();

  return () => { ctx.pendingMsg = []; };
};
