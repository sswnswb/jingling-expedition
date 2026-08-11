import './style.css';
import { Router, type GameCtx } from './ui/router';
import { createRng, dateToSeed } from './engine/rng';
import { preloadAll } from './ui/art';
import { sfx } from './ui/sfx';
import { menuScreen } from './ui/screens/menu';

const app = document.getElementById('app');
if (!app) throw new Error('#app not found');

const seed = dateToSeed();
const ctx: GameCtx = {
  seed,
  rng: createRng(seed),
  name: '',
  run: null as never,
  offers: [],
  enemy: [],
  enemyStage: 0,
  lastEnemyPower: 0,
  pendingItems: [],
  pendingMsg: [],
};
const router = new Router(app, ctx);

// 首次交互解锁音频
window.addEventListener('pointerdown', () => sfx.unlock(), { once: true });

// 竖屏提示
const rotateHint = document.getElementById('rotate-hint');
const rotateX = document.getElementById('rotate-x');
if (rotateHint && rotateX) {
  rotateX.addEventListener('click', () => {
    try { localStorage.setItem('nmt_rotate_off', '1'); } catch { /* 忽略 */ }
    rotateHint.style.display = 'none';
  });
  try { if (localStorage.getItem('nmt_rotate_off')) rotateHint.style.display = 'none'; } catch { /* 忽略 */ }
}

(window as unknown as { router: Router }).router = router;

// 先预加载美术，再进菜单
preloadAll(() => router.show(menuScreen));
