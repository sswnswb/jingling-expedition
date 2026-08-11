import type { Rng } from '../engine/rng';
import type { RunState } from '../engine/run';
import type { BUnit } from '../engine/battle';

export interface GameCtx {
  seed: number;
  rng: Rng;
  name: string;
  run: RunState;
  offers: string[];
  enemy: BUnit[];
  /** 当前敌方对应的关卡号（用于缓存：同一关不重复生成） */
  enemyStage: number;
  /** 上一场战斗的敌方（结算面板用） */
  lastEnemyPower: number;
  /** 待领取的战利品（击杀/宝箱掉的装备） */
  pendingItems: string[];
  pendingMsg: string[];
}

export type ScreenMount = (app: HTMLElement, ctx: GameCtx, router: Router) => (() => void) | void;

export class Router {
  private app: HTMLElement;
  private ctx: GameCtx;
  private cleanup: (() => void) | undefined;

  constructor(app: HTMLElement, ctx: GameCtx) {
    this.app = app;
    this.ctx = ctx;
  }

  get context(): GameCtx { return this.ctx; }

  show(mount: ScreenMount): void {
    if (this.cleanup) { this.cleanup(); this.cleanup = undefined; }
    this.app.replaceChildren();
    const ret = mount(this.app, this.ctx, this);
    if (typeof ret === 'function') this.cleanup = ret;
  }
}
