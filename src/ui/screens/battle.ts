/** 战斗屏：Canvas 自动战斗演出（立绘/血条/弹道/技能特效/伤害数字/Mega）。 */

import type { GameCtx, ScreenMount } from '../router';
import { startBattle, stepSim, simulate, type BattleState, type BUnit, type SimEvent } from '../../engine/battle';
import { resolveBoard, boardUnits, settleStage, TOTAL_STAGES } from '../../engine/run';
import { isBossStage, chapterOf, enemyPower } from '../../data/campaign';
import { elemColor, unitImg } from '../art';
import { prepScreen } from './prep';
import { endScreen } from './end';
import { sfx } from '../sfx';

const DT = 0.1;

type FX =
  | { kind: 'proj'; x0: number; y0: number; x1: number; y1: number; t0: number; dur: number; color: string; big: boolean }
  | { kind: 'num'; x: number; y: number; t0: number; dur: number; text: string; color: string; big: boolean }
  | { kind: 'ring'; x: number; y: number; t0: number; dur: number; color: string; r: number }
  | { kind: 'flash'; x: number; y: number; t0: number; dur: number; color: string; r: number }
  | { kind: 'label'; x: number; y: number; t0: number; dur: number; text: string; color: string }
  | { kind: 'cellflash'; x: number; y: number; t0: number; dur: number; w: number; h: number };

interface SlotPos { x: number; y: number; cell: number; w: number; h: number }

function slotPos(side: 'ally' | 'enemy', slot: number, W: number, H: number): SlotPos {
  const col = slot % 3;
  const row = slot < 3 ? 0 : 1;
  const cell = Math.min(W * 0.16, H * 0.20);
  const x = W / 2 + (col - 1) * cell * 1.2;
  const isE = side === 'enemy';
  const y = isE ? (row === 0 ? H * 0.3 : H * 0.13) : (row === 0 ? H * 0.7 : H * 0.87);
  return { x, y, cell, w: cell * 1.15, h: cell * 1.15 };
}

export const battleScreen: ScreenMount = (app, ctx: GameCtx, router) => {
  const run = ctx.run;
  const resolved = resolveBoard(run, boardUnits(run));
  const allyGhost = resolved.units.find((u) => u.ghostBonus > 0)?.ghostBonus ?? 0;
  const enemyGhost = 0;
  const enemyTeam = ctx.enemy;
  const b: BattleState = startBattle(resolved.units, enemyTeam, ctx.rng);

  const ch = chapterOf(run.stage);
  const boss = isBossStage(run.stage);

  let speed: 1 | 2 | 4 = 1;
  let simAcc = 0;
  let cursor = 0;
  let raf = 0;
  let last = performance.now();
  let overShown = false;
  const fx: FX[] = [];

  app.className = 'screen battle';
  app.innerHTML = `
    <div class="battle__hud">
      <div class="battle__title">${ch.title} · 第 ${run.stage}/${TOTAL_STAGES} 关${boss ? ' <span class="boss-tag">BOSS</span>' : ''}</div>
      <div class="battle__vshp">我方 ${resolved.units.length} · 敌方 ${enemyTeam.length}</div>
      <div class="battle__btns">
        <button class="btn btn--small" id="b-speed">速度 ×${speed}</button>
        <button class="btn btn--small" id="b-skip">快进结束</button>
      </div>
    </div>
    <canvas id="arena"></canvas>
    <div class="battle__overlay" id="b-overlay" style="display:none"></div>
  `;

  const canvas = app.querySelector<HTMLCanvasElement>('#arena')!;
  const overlay = app.querySelector<HTMLElement>('#b-overlay')!;
  const g = canvas.getContext('2d')!;

  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- FX 生成 ---------- */
  function spawn(ev: SimEvent, now: number) {
    switch (ev.type) {
      case 'attack': {
        const side = ev.side;
        const opp = ev.side === 'ally' ? 'enemy' : 'ally';
        const from = slotPos(side, ev.from, W, H);
        const to = slotPos(opp, ev.to, W, H);
        if (ev.dmg > 0) {
          fx.push({ kind: 'proj', x0: from.x, y0: from.y, x1: to.x, y1: to.y, t0: now, dur: 0.28, color: elemColor(ev.elem), big: ev.crit });
          fx.push({ kind: 'num', x: to.x, y: to.y - 40, t0: now + 0.2, dur: 0.7, text: `-${ev.dmg}`, color: ev.crit ? '#ffd25e' : '#fff', big: ev.crit });
          fx.push({ kind: 'cellflash', x: to.x, y: to.y, t0: now + 0.2, dur: 0.16, w: to.w, h: to.h });
          if (ev.crit) sfx.crit(); else sfx.hit();
        }
        break;
      }
      case 'cast': {
        const side = ev.side;
        const u = (side === 'ally' ? b.ally : b.enemy).find((x) => x.slot === ev.from);
        const from = slotPos(side, ev.from, W, H);
        const color = elemColor(ev.elem);
        fx.push({ kind: 'label', x: from.x, y: from.y - from.cell * 0.7, t0: now, dur: 1.0, text: u?.skill.name ?? '', color });
        if (ev.shape === 'aoe' || ev.shape === 'front') {
          const opp = side === 'ally' ? 'enemy' : 'ally';
          const oppY = opp === 'enemy' ? H * 0.22 : H * 0.78;
          fx.push({ kind: 'flash', x: W / 2, y: oppY, t0: now, dur: 0.45, color, r: W * 0.42 });
        } else {
          const opp = side === 'ally' ? 'enemy' : 'ally';
          const to = ev.target >= 0 ? slotPos(opp, ev.target, W, H) : { x: W / 2, y: opp === 'enemy' ? H * 0.22 : H * 0.78 };
          fx.push({ kind: 'proj', x0: from.x, y0: from.y, x1: to.x, y1: to.y, t0: now, dur: 0.24, color, big: true });
        }
        sfx.cast();
        break;
      }
      case 'damage':
        if (ev.amount === 0) fx.push({ kind: 'num', x: slotPos(ev.side, ev.slot, W, H).x, y: slotPos(ev.side, ev.slot, W, H).y - 40, t0: now, dur: 0.7, text: '闪避', color: '#8ad4ff', big: false });
        break;
      case 'heal': {
        const p = slotPos(ev.side, ev.slot, W, H);
        if (ev.amount > 0) fx.push({ kind: 'num', x: p.x, y: p.y - 40, t0: now, dur: 0.7, text: `+${ev.amount}`, color: '#7fd48f', big: false });
        break;
      }
      case 'shield': {
        const p = slotPos(ev.side, ev.slot, W, H);
        fx.push({ kind: 'ring', x: p.x, y: p.y, t0: now, dur: 0.5, color: '#7fd4ff', r: p.cell * 0.8 });
        if (ev.amount > 0) fx.push({ kind: 'num', x: p.x, y: p.y - 40, t0: now, dur: 0.7, text: `+${ev.amount}`, color: '#7fd4ff', big: false });
        break;
      }
      case 'cc': {
        const p = slotPos(ev.side, ev.slot, W, H);
        fx.push({ kind: 'ring', x: p.x, y: p.y, t0: now, dur: 0.6, color: '#c9b4ff', r: p.cell * 0.6 });
        break;
      }
      case 'die': {
        const p = slotPos(ev.side, ev.slot, W, H);
        fx.push({ kind: 'ring', x: p.x, y: p.y, t0: now, dur: 0.5, color: '#666', r: p.cell });
        break;
      }
      case 'mega': {
        const p = slotPos(ev.side, ev.slot, W, H);
        fx.push({ kind: 'flash', x: p.x, y: p.y, t0: now, dur: 0.7, color: '#ffd25e', r: p.cell * 2.2 });
        fx.push({ kind: 'label', x: p.x, y: p.y - p.cell * 0.7, t0: now, dur: 1.4, text: 'MEGA进化！', color: '#ffd25e' });
        sfx.mega();
        break;
      }
      default:
        break;
    }
  }

  /* ---------- 绘制 ---------- */
  function drawArena() {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#141b30');
    grad.addColorStop(0.45, '#101624');
    grad.addColorStop(0.55, '#101624');
    grad.addColorStop(1, '#141b30');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    // 中线
    g.strokeStyle = 'rgba(120,140,180,0.18)';
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, H * 0.5); g.lineTo(W, H * 0.5); g.stroke();
    // 格位
    for (const side of ['ally', 'enemy'] as const) {
      for (let s = 0; s < 6; s++) {
        const p = slotPos(side, s, W, H);
        const aliveU = (side === 'ally' ? b.ally : b.enemy).find((u) => u.slot === s);
        g.strokeStyle = aliveU ? 'rgba(160,180,220,0.16)' : 'rgba(120,140,180,0.10)';
        g.strokeRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
      }
    }
  }

  function roundRect(x: number, y: number, w: number, h: number, r: number) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function drawUnit(u: BUnit, side: 'ally' | 'enemy', now: number) {
    if (u.hp <= 0) return;
    const p = slotPos(side, u.slot, W, H);
    const bob = Math.sin(now * 3 + u.slot) * 3;
    const x = p.x, y = p.y + bob;
    const color = elemColor(u.elem);
    const img = unitImg(u.speciesId, u.mega);
    const scale = u.mega ? 1.35 : 1;

    // 光环
    const aura = g.createRadialGradient(x, y, p.cell * 0.1, x, y, p.cell * 0.9 * scale);
    aura.addColorStop(0, color + '55');
    aura.addColorStop(1, color + '00');
    g.fillStyle = aura;
    g.beginPath(); g.arc(x, y, p.cell * 0.9 * scale, 0, Math.PI * 2); g.fill();

    // 立绘
    const iw = p.w * 0.92 * scale, ih = p.w * 0.72 * scale;
    if (img && img.complete && img.naturalWidth > 0) {
      const ar = img.naturalWidth / img.naturalHeight;
      let dw = iw, dh = ih;
      if (dw / dh > ar) { dw = dh * ar; } else { dh = dw / ar; }
      g.drawImage(img, x - dw / 2, y - dh / 2, dw, dh);
    } else {
      // 占位
      g.fillStyle = color + '44';
      g.beginPath(); g.arc(x, y, p.cell * 0.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = color;
      g.font = `bold ${p.cell * 0.5}px sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(u.name[0] ?? '?', x, y);
    }

    // 血条
    const bw = p.w * 0.82;
    const bx = x - bw / 2;
    const hpRatio = Math.max(0, u.hp / u.maxhp);
    g.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(bx - 1, y + p.h / 2 - 14, bw + 2, 8, 3); g.fill();
    g.fillStyle = hpRatio > 0.5 ? '#5fc05f' : hpRatio > 0.25 ? '#e0b03f' : '#e05f5f';
    roundRect(bx, y + p.h / 2 - 13, bw * hpRatio, 6, 2); g.fill();
    // 能量条
    g.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(bx, y + p.h / 2 - 5, bw, 4, 2); g.fill();
    g.fillStyle = '#ffd25e';
    roundRect(bx, y + p.h / 2 - 5, bw * Math.min(1, u.energy / (u.skill.en || 100)), 4, 2); g.fill();
    // 护盾
    if (u.shield > 0) {
      g.strokeStyle = '#7fd4ff';
      g.lineWidth = 2.5;
      g.beginPath(); g.arc(x, y, p.cell * 0.62 * scale, 0, Math.PI * 2); g.stroke();
    }
    // 名字 + 星级 + cc
    g.font = '12px sans-serif';
    g.textAlign = 'center';
    g.fillStyle = u.mega ? '#ffd25e' : '#dfe6f2';
    const nameY = y - p.h / 2 - 6;
    g.fillText(u.mega ? `MEGA ${u.name}` : u.name, x, nameY);
    const starY = y + p.h / 2 + 8;
    g.font = '10px sans-serif';
    g.fillStyle = '#ffd25e';
    g.fillText('★'.repeat(u.star) + '☆'.repeat(3 - u.star), x, starY);
    if (u.cc) {
      g.fillStyle = '#c9b4ff';
      g.fillText(u.cc === 'stun' ? '💫' : u.cc === 'freeze' ? '❄' : '💤', x + p.w * 0.35, nameY);
    }
  }

  function drawFX(now: number) {
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i];
      const t = (now - f.t0) / f.dur;
      if (t >= 1) { fx.splice(i, 1); continue; }
      const k = Math.min(1, t);
      switch (f.kind) {
        case 'proj': {
          const ease = k * k;
          const x = f.x0 + (f.x1 - f.x0) * ease;
          const y = f.y0 + (f.y1 - f.y0) * ease - Math.sin(k * Math.PI) * 30;
          const r = f.big ? 9 : 6;
          const glow = g.createRadialGradient(x, y, 1, x, y, r * 3);
          glow.addColorStop(0, f.color);
          glow.addColorStop(1, f.color + '00');
          g.fillStyle = glow;
          g.beginPath(); g.arc(x, y, r * 3, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#fff';
          g.beginPath(); g.arc(x, y, r * 0.6, 0, Math.PI * 2); g.fill();
          break;
        }
        case 'num': {
          g.globalAlpha = 1 - k;
          g.font = `bold ${f.big ? 26 : 20}px sans-serif`;
          g.textAlign = 'center';
          g.fillStyle = f.color;
          g.shadowColor = 'rgba(0,0,0,0.8)';
          g.shadowBlur = 6;
          g.fillText(f.text, f.x, f.y - k * 34);
          g.shadowBlur = 0;
          g.globalAlpha = 1;
          break;
        }
        case 'ring': {
          g.strokeStyle = f.color;
          g.lineWidth = 3 * (1 - k);
          g.beginPath(); g.arc(f.x, f.y, f.r * (0.4 + k * 0.9), 0, Math.PI * 2); g.stroke();
          break;
        }
        case 'flash': {
          const grad = g.createRadialGradient(f.x, f.y, 1, f.x, f.y, f.r * (0.3 + k));
          grad.addColorStop(0, f.color + 'aa');
          grad.addColorStop(1, f.color + '00');
          g.fillStyle = grad;
          g.beginPath(); g.arc(f.x, f.y, f.r, 0, Math.PI * 2); g.fill();
          break;
        }
        case 'label': {
          g.globalAlpha = 1 - k * 0.7;
          g.font = `bold 17px sans-serif`;
          g.textAlign = 'center';
          g.fillStyle = f.color;
          g.shadowColor = 'rgba(0,0,0,0.8)';
          g.shadowBlur = 4;
          g.fillText(f.text, f.x, f.y - k * 20);
          g.shadowBlur = 0;
          g.globalAlpha = 1;
          break;
        }
        case 'cellflash': {
          g.globalAlpha = (1 - k) * 0.5;
          g.fillStyle = '#fff';
          g.fillRect(f.x - f.w / 2, f.y - f.h / 2, f.w, f.h);
          g.globalAlpha = 1;
          break;
        }
      }
    }
  }

  function draw(now: number) {
    drawArena();
    for (const u of b.enemy) drawUnit(u, 'enemy', now);
    for (const u of b.ally) drawUnit(u, 'ally', now);
    drawFX(now);
  }

  /* ---------- 主循环 ---------- */
  function frame(t: number) {
    raf = requestAnimationFrame(frame);
    const now = t / 1000;
    const dt = Math.min(0.1, (t - last) / 1000);
    last = t;

    if (!b.over) {
      if (speed === 4) {
        for (let i = 0; i < 24; i++) { stepSim(b, allyGhost, enemyGhost); if (b.over) break; }
        // 快进不播 FX：直接消费事件
        cursor = b.events.length;
      } else {
        simAcc += dt * speed;
        while (simAcc >= DT && !b.over) { stepSim(b, allyGhost, enemyGhost); simAcc -= DT; }
        while (cursor < b.events.length) spawn(b.events[cursor++], now);
      }
      if (b.over && !overShown) {
        overShown = true;
        showOverlay();
      }
    }
    draw(now);
  }

  function showOverlay() {
    const won = b.over === 'win';
    const board = boardUnits(run);
    const msgs = settleStage(run, won, board);
    ctx.lastEnemyPower = enemyPower(enemyTeam);
    // 通关最后一关
    if (won && run.stage >= TOTAL_STAGES) { run.over = true; run.result = 'victory'; }
    let button = '';
    if (run.over) button = '查看远征结算';
    else if (won) button = '进入休整';
    else button = '重整旗鼓';
    overlay.innerHTML = `
      <div class="battle__result ${won ? 'win' : 'lose'}">
        <h2>${won ? '胜利！' : '战败…'}</h2>
        <div class="battle__msgs">${msgs.map((m) => `<div>${m}</div>`).join('')}</div>
        <div class="battle__hplost">${won ? `队伍回复 +3` : `队伍生命 ${Math.max(0, run.hp)}/100`}</div>
        <button class="btn btn--primary" id="b-continue">${button}</button>
      </div>`;
    overlay.style.display = 'flex';
    overlay.querySelector('#b-continue')?.addEventListener('click', () => {
      if (run.over) { router.show(endScreen); return; }
      if (won) {
        run.stage++;
        // 每 3 关掉一个装备
        if (run.stage % 3 === 0 && run.stage <= TOTAL_STAGES) ctx.pendingItems.push(randomItemName());
      }
      router.show(prepScreen);
    });
  }

  function randomItemName(): string {
    // 简单随机给一件装备
    const list = ['power_band', 'mystic_drop', 'guard_amulet', 'swift_wings', 'dragon_teeth', 'vampire_tooth', 'iron_shell'];
    return ctx.rng.pick(list);
  }

  app.querySelector('#b-speed')?.addEventListener('click', (e) => {
    speed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
    (e.target as HTMLElement).textContent = `速度 ×${speed === 4 ? '快进' : speed}`;
  });
  app.querySelector('#b-skip')?.addEventListener('click', () => {
    simulate(b, allyGhost, enemyGhost);
    cursor = b.events.length;
    if (b.over && !overShown) { overShown = true; showOverlay(); }
  });

  requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
  };
};
