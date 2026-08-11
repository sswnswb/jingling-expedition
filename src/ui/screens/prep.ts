/** 备战屏（局内管理）：商店/合成进化/上阵下阵/装备/羁绊/经济/出战。 */

import type { GameCtx, ScreenMount } from '../router';
import {
  rollShop, buyUnit, sellUnit, placeUnit, equipItem, buyLevel, levelCost, boardUnits,
  benchUnits, resolveBoard, shopRerollCost, MAX_LEVEL, type BoardUnit,
} from '../../engine/run';
import { speciesById } from '../../data/species';
import { itemById, ITEMS } from '../../data/items';
import { genEnemyTeam, isBossStage, chapterOf, TOTAL_STAGES, enemyPower } from '../../data/campaign';
import { TYPE_CN, describeSkill, type SpeciesDef } from '../../engine/rules';
import { nextEvolve, synergyEffect, synergyLine } from '../../engine/run';
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
  let modal: HTMLElement | null = null;

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
        <div class="prep__enemy" id="enemy"></div>
      </div>

      <div class="prep__shop" id="shop"></div>

      <div class="prep__selected" id="selected"></div>
    `;

    // 羁绊（显示实际效果）
    const sy = document.getElementById('synergy')!;
    if (resolved.synergies.length === 0) sy.innerHTML = '<span class="sy-empty">上阵精灵可触发羁绊（点右上角有说明）</span>';
    else {
      sy.innerHTML = resolved.synergies.map((s) => `
        <span class="sy on" title="${s.cn}：${s.effect}">
          ${s.cn} ${s.count}/${s.thresholds.join('/')} · ${s.effect}
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

    // 下一关敌方预览：进关首帧生成一次并缓存，排兵布阵参考。
    if (ctx.enemyStage !== run.stage || ctx.enemy.length === 0) {
      ctx.enemy = genEnemyTeam(ctx.rng, run.stage, isBossStage(run.stage));
      ctx.enemyStage = run.stage;
    }
    {
      const ep = document.getElementById('enemy')!;
      const boss = isBossStage(run.stage);
      const pwr = enemyPower(ctx.enemy);
      ep.innerHTML = `
        <div class="enemy-title">下一关 · 敌方阵容${boss ? ' <span class="boss-tag">BOSS</span>' : ''}</div>
        <div class="enemy-power">战力 ≈ ${pwr}</div>
        <div class="enemy-grid">${ctx.enemy.map((u) => `
          <div class="enemy-unit">
            <img class="enemy-img" src="img/${u.speciesId}.png" loading="lazy">
            <div class="enemy-stars">${'★'.repeat(u.star)}</div>
            <div class="enemy-name">${u.name}</div>
          </div>`).join('')}
        </div>
        <div class="enemy-hint">敌人按列对线 · 前排扛伤，后排输出</div>`;
    }

    // 商店：点卡片看详情，点金币按钮直接买（防误购）。买走一张少一张，不自动刷新。
    const sh = document.getElementById('shop')!;
    sh.innerHTML = `<div class="shop-title">商店 · 攒利息 <button class="btn btn--tiny" id="shop-help">❔ 装备/羁绊说明</button></div>`;
    if (shop.length === 0) {
      sh.innerHTML += `<div class="shop-empty">商店已空 · 点「刷新」或打赢下一关免费换新货</div>`;
    } else {
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
          <button class="btn btn--small ${can ? 'btn--gold' : ''}" data-buy ${can ? '' : 'disabled'}>🪙 ${spec.cost} 买</button>`;
        c.addEventListener('click', () => showInspect(id));
        c.querySelector<HTMLElement>('[data-buy]')?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (buyUnit(run, id, ctx.rng) === null) {
            sfx.buy();
            const idx = shop.lastIndexOf(id);
            if (idx >= 0) shop.splice(idx, 1); // 买走这张，剩下的保留
            render();
          } else sfx.sell();
        });
        row.appendChild(c);
      });
      sh.appendChild(row);
      sh.querySelector('#shop-help')?.addEventListener('click', () => showHelp());
    }

    // 选中单位详情（含装备自选 + 推荐）
    const sel = document.getElementById('selected')!;
    if (selectedUid) {
      const u = run.units.find((x) => x.uid === selectedUid);
      if (u) {
        const spec = speciesById(u.speciesId);
        const rb = resolveBoard(run, boardUnits(run));
        const stat = rb.units.find((x) => x.uid === u.uid);
        const item = u.item ? itemById(u.item) : null;
        const activeSyn = resolved.synergies.filter((s) => spec.tags.includes(s.tag)).map((s) => s.cn).join('、');
        const rec = recommendItem(spec);
        sel.innerHTML = `
          <div class="sel-card">
            <img class="sel-img" src="img/${u.speciesId}.png">
            <div class="sel-info">
              <div class="sel-name">${spec.name} <span class="stars">${'★'.repeat(u.star)}${'☆'.repeat(3 - u.star)}</span></div>
              <div class="sel-skill">技能：${spec.skill.name} — ${describeSkill(spec.skill)}</div>
              ${activeSyn ? `<div class="sel-syn">羁绊：${activeSyn}</div>` : ''}
              ${stat ? `<div class="sel-stats">生命${stat.maxhp} 攻${stat.atk} 特攻${stat.spa} 防${stat.def} 速${stat.spe}</div>` : ''}
            </div>
            <div class="sel-side">
              <div class="sel-equip">
                <div class="sel-equip-title">装备${rec && item?.id !== rec ? `<span class="rec-tip">⭐ 推荐 ${itemById(rec)?.name}</span>` : ''}</div>
                <div class="sel-equip-row">
                  ${item ? `<button class="equip-chip equipped" data-eq-null>${item.icon} ${item.name} · 卸下</button>` : ''}
                  ${run.items.map((it) => `<button class="equip-chip${it === rec ? ' rec' : ''}" data-eq="${it}">${itemById(it)?.icon ?? ''} ${itemById(it)?.name ?? it}</button>`).join('')}
                  ${!item && run.items.length === 0 ? '<span class="equip-none">暂无装备 · 打关卡掉落</span>' : ''}
                </div>
              </div>
              <div class="sel-actions">
                ${u.slot >= 0 ? `<button class="btn btn--small" id="s-bench">下阵</button>` : ''}
                <button class="btn btn--small" id="s-sell">出售 +${spec.cost}</button>
                <button class="btn btn--small" id="s-close">✕</button>
              </div>
            </div>
          </div>`;
        sel.querySelector('#s-sell')?.addEventListener('click', () => { sellUnit(run, u.uid); sfx.sell(); selectedUid = null; render(); });
        sel.querySelector('#s-bench')?.addEventListener('click', () => { placeUnit(run, u.uid, -1); sfx.click(); render(); });
        sel.querySelector('#s-close')?.addEventListener('click', () => { selectedUid = null; render(); });
        sel.querySelector('[data-eq-null]')?.addEventListener('click', () => { equipItem(run, u.uid, null); sfx.equip(); render(); });
        sel.querySelectorAll<HTMLElement>('[data-eq]').forEach((b) => b.addEventListener('click', () => {
          if (item?.id === b.dataset.eq) return; // 已装备同一件
          equipItem(run, u.uid, b.dataset.eq ?? null); sfx.equip(); render();
        }));
      }
    }

    document.getElementById('p-level')?.addEventListener('click', () => { if (buyLevel(run)) { sfx.levelup(); render(); } });
    document.getElementById('p-reroll')?.addEventListener('click', () => {
      if (run.gold >= shopRerollCost(run)) { run.gold -= shopRerollCost(run); shop = rollShop(run, ctx.rng); ctx.offers = shop; sfx.reroll(); render(); }
    });
    document.getElementById('p-fight')?.addEventListener('click', () => {
      if (boardUnits(run).length === 0) { ctx.pendingMsg = ['至少上阵一只精灵才能出战！']; render(); return; }
      // 敌方已在进入本关时生成并缓存（可预览），直接开打
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

  /* ---------- 装备推荐 ---------- */
  const PHYSICAL = new Set(['fighting', 'normal', 'ground', 'rock', 'bug']);
  function recommendItem(spec: SpeciesDef): string {
    const has = (id: string) => run.items.includes(id);
    const power = spec.skill.power ?? (PHYSICAL.has(spec.skill.e) ? 'atk' : 'spa');
    if (spec.mega && has('mega_stone')) return 'mega_stone';          // 能 Mega 优先钥石
    if (spec.tags.includes('tank') && has('iron_shell')) return 'iron_shell'; // 坦克：开局盾
    if (spec.tags.includes('tank') && has('guard_amulet')) return 'guard_amulet';
    if (power === 'spa' && has('mystic_drop')) return 'mystic_drop';  // 特攻手
    if (power === 'atk' && has('vampire_tooth')) return 'vampire_tooth'; // 物攻手：吸血站场
    if (power === 'atk' && has('power_band')) return 'power_band';
    if (has('dragon_teeth')) return 'dragon_teeth';                   // 通用万金油
    if (has('swift_wings')) return 'swift_wings';
    return '';
  }

  /* ---------- 详情弹窗 ---------- */
  function closeModal() { modal?.remove(); modal = null; }

  function showInspect(id: string) {
    const spec = speciesById(id);
    const evo = nextEvolve(id);
    // 场上羁绊计数（与上阵精灵一致）
    const counts = new Map<string, number>();
    for (const bu of boardUnits(run)) for (const t of speciesById(bu.speciesId).tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    const synRows = spec.tags.map((t) => {
      const c = counts.get(t) ?? 0;
      const l = synergyLine(t, c);
      const state = l.tier > 0 ? `<span class="inspect-ok">✓ ${l.tier}档 ${l.effect}</span>` : `已有 ${c} 人 · 还差 ${l.thresholds[0] - c} 人`;
      return `· ${l.cn}（凑 ${l.thresholds.join('/')}）${state}`;
    }).join('<br>');
    closeModal();
    const m = document.createElement('div');
    m.className = 'modal-layer';
    m.innerHTML = `
      <div class="inspect">
        <button class="inspect-x" data-x>✕</button>
        <img class="inspect-img" src="img/${id}.png">
        <div class="inspect-name">${spec.name} <span class="stars">★☆☆</span></div>
        <div class="inspect-tags">${spec.tags.map((t) => `<span class="tag">${TYPE_CN[t] ?? t}</span>`).join('')}</div>
        <div class="inspect-stats">生命${spec.hp} · 攻击${spec.atk} · 特攻${spec.spa} · 防御${spec.def} · 速度${spec.spe}</div>
        <div class="inspect-row"><b>技能</b> ${spec.skill.name}：${describeSkill(spec.skill)}</div>
        <div class="inspect-row"><b>进化</b>${evo ? `：${evo}` : '：已是最终形态'}</div>
        <div class="inspect-row"><b>可成羁绊</b><br>${synRows}</div>
        <div class="inspect-buy">
          <button class="btn btn--gold" data-buy>🪙 ${spec.cost} 购买</button>
          <button class="btn" data-x>关闭</button>
        </div>
      </div>`;
    m.addEventListener('click', (e) => { if (e.target === m) closeModal(); });
    m.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', closeModal));
    m.querySelector('[data-buy]')?.addEventListener('click', () => {
      if (buyUnit(run, id, ctx.rng) === null) {
        sfx.buy();
        const idx = shop.lastIndexOf(id);
        if (idx >= 0) shop.splice(idx, 1);
        closeModal();
        render();
      }
    });
    app.appendChild(m);
    modal = m;
  }

  function showHelp() {
    closeModal();
    const m = document.createElement('div');
    m.className = 'modal-layer';
    const itemRows = ITEMS.map((i) => `<div class="help-row"><b>${i.icon} ${i.name}</b> — ${i.desc}</div>`).join('');
    const synRows: string[] = [];
    for (const [tag, cn] of Object.entries(TYPE_CN)) {
      const thresholds = tag === 'bug' || tag === 'ice' || tag === 'psychic' || tag === 'poison' ? [2, 4] : [2, 4, 6];
      const effects = thresholds.map((_, i) => synergyEffect(tag, i + 1)).filter(Boolean).join(' → ');
      synRows.push(`<div class="help-row"><b>${cn}系</b>（${thresholds.join('/')}）${effects}</div>`);
    }
    for (const [tag, cn] of [['starter', '御三家'], ['money', '喵喵财团'], ['gamble', '伊布赌局'], ['tank', '巨兽'], ['legend', '传说']] as const) {
      const thresholds = tag === 'legend' ? [2, 3] : tag === 'starter' ? [2, 3, 4] : [1, 2];
      const effects = thresholds.map((_, i) => synergyEffect(tag, i + 1)).filter(Boolean).join(' → ');
      synRows.push(`<div class="help-row"><b>${cn}</b>（${thresholds.join('/')}）${effects}</div>`);
    }
    m.innerHTML = `
      <div class="inspect inspect--help">
        <button class="inspect-x" data-x>✕</button>
        <div class="help-title">装备</div>
        ${itemRows}
        <div class="help-title">羁绊（凑够数量生效）</div>
        ${synRows.join('')}
        <button class="btn" data-x style="margin-top:10px">关闭</button>
      </div>`;
    m.addEventListener('click', (e) => { if (e.target === m) closeModal(); });
    m.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', closeModal));
    app.appendChild(m);
    modal = m;
  }

  render();

  return () => { closeModal(); ctx.pendingMsg = []; };
};
