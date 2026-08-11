/** 程序化音效（WebAudio 合成，无素材依赖）。 */

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;

  unlock() {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch { /* 忽略 */ }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.4, slide = 0) {
    if (this.muted || !this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const gn = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(vol, t + 0.01);
    gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(gn); gn.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  click() { this.tone(600, 0.06, 'square', 0.15); }
  hit() { this.tone(220, 0.09, 'sawtooth', 0.22, -60); }
  crit() { this.tone(520, 0.12, 'sawtooth', 0.3, 160); this.tone(260, 0.14, 'square', 0.2, -40); }
  cast() { this.tone(340, 0.16, 'sawtooth', 0.2, 200); }
  mega() { this.tone(200, 0.5, 'sawtooth', 0.35, 400); this.tone(150, 0.5, 'sine', 0.25, 300); }
  buy() { this.tone(760, 0.08, 'triangle', 0.2); this.tone(1140, 0.1, 'triangle', 0.16); }
  sell() { this.tone(500, 0.08, 'triangle', 0.2, -200); }
  gold() { this.tone(980, 0.07, 'triangle', 0.2); this.tone(1300, 0.1, 'triangle', 0.16); }
  reroll() { this.tone(420, 0.07, 'square', 0.14, 120); }
  levelup() { this.tone(392, 0.1, 'triangle', 0.25); this.tone(523, 0.1, 'triangle', 0.22); this.tone(659, 0.16, 'triangle', 0.2); }
  win() { this.tone(523, 0.12, 'triangle', 0.3); this.tone(659, 0.12, 'triangle', 0.28); this.tone(784, 0.22, 'triangle', 0.26); }
  lose() { this.tone(330, 0.16, 'sawtooth', 0.25, -80); this.tone(220, 0.3, 'sawtooth', 0.2, -60); }
  equip() { this.tone(700, 0.08, 'triangle', 0.2); }
  chest() { this.tone(660, 0.08, 'triangle', 0.22); this.tone(880, 0.1, 'triangle', 0.2); this.tone(1100, 0.14, 'triangle', 0.18); }
}

export const sfx = new Sfx();
