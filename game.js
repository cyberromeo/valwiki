/* SHOOT THE BLIND — Reyna's aim trainer.
   Pixel-art canvas game, rebuilt for the redesign: timed rounds, hi-dpi canvas,
   pointer + touch input, saved best score, and Reyna roasting every miss. */
(function () {
  'use strict';

  const W = 320, H = 180, FLOOR = 166, ROUND_SECONDS = 30;
  const HS_KEY = 'val_retro_highscore';

  const SPRITES = {
    eye: [
      [0,0,0,0,1,1,1,1,1,1,0,0,0,0],
      [0,0,1,1,2,2,2,2,2,2,1,1,0,0],
      [0,1,2,2,3,3,3,3,3,3,2,2,1,0],
      [1,2,2,3,3,4,4,4,4,3,3,2,2,1],
      [1,2,3,3,4,0,0,0,0,4,3,3,2,1],
      [1,2,3,4,0,0,0,0,0,0,4,3,2,1],
      [1,2,3,4,0,0,0,0,0,0,4,3,2,1],
      [1,2,3,4,0,0,0,0,0,0,4,3,2,1],
      [1,2,3,4,0,0,0,0,0,0,4,3,2,1],
      [1,2,3,3,4,0,0,0,0,4,3,3,2,1],
      [1,2,2,3,3,4,4,4,4,3,3,2,2,1],
      [0,1,2,2,3,3,3,3,3,3,2,2,1,0],
      [0,0,1,1,2,2,2,2,2,2,1,1,0,0],
      [0,0,0,0,1,1,1,1,1,1,0,0,0,0]
    ],
    reyna: [
      [0,0,0,0,1,1,1,0,0,0],
      [0,0,0,0,1,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,0,0],
      [0,0,1,0,1,2,1,0,1,0],
      [0,1,3,0,1,2,1,0,3,1],
      [0,1,3,0,2,2,2,0,3,1],
      [0,0,0,1,2,2,2,1,0,0],
      [0,0,0,1,2,4,2,1,0,0],
      [0,0,0,1,1,0,1,1,0,0],
      [0,0,0,1,1,0,1,1,0,0],
      [0,0,1,1,0,0,0,1,1,0]
    ]
  };
  const PALETTE = [null, '#3f1b4f', '#9c27b0', '#e1bee7', '#111111'];
  const ROASTS = ['PATHETIC', 'MISSED AGAIN?', 'ARE YOU BLIND?', 'TRY HARDER', 'MY GRANDMA AIMS BETTER', 'DISAPPOINTING'];

  function verdict(acc, hits) {
    if (hits === 0) return 'DID YOU EVEN SHOOT?';
    if (acc >= 85 && hits >= 25) return 'NOT BAD. FOR A MORTAL.';
    if (acc >= 70) return 'ACCEPTABLE. BARELY.';
    if (acc >= 50) return 'MY GRANDMA AIMS BETTER';
    return 'PATHETIC';
  }

  const Game = {
    root: null, canvas: null, ctx: null, dpr: 1, scale: 1,
    running: false, raf: 0, last: 0, timeLeft: ROUND_SECONDS,
    hits: 0, misses: 0, shots: 0, streak: 0,
    targets: [], particles: [], popups: [], flash: 0,
    mouse: { x: W / 2, y: H / 2 },
    chat: { text: '', t: 0 },
    spawnT: 0,
    get highScore() { return parseInt(localStorage.getItem(HS_KEY) || '0', 10) || 0; },
    set highScore(v) { try { localStorage.setItem(HS_KEY, String(v)); } catch (e) { /* private mode */ } },

    mount(root) {
      this.destroy();
      this.root = root;
      root.innerHTML = `
        <div class="gm">
          <div class="gm__hud" aria-live="off">
            <div class="gm__stat"><span>TIME</span><b id="gm-time">${ROUND_SECONDS}</b></div>
            <div class="gm__stat"><span>HITS</span><b id="gm-hits">0</b></div>
            <div class="gm__stat gm__stat--red"><span>MISS</span><b id="gm-miss">0</b></div>
            <div class="gm__stat"><span>ACC</span><b id="gm-acc">100%</b></div>
            <div class="gm__stat gm__stat--teal"><span>BEST</span><b id="gm-best">${this.highScore}</b></div>
          </div>
          <div class="gm__stage">
            <canvas class="gm__canvas" aria-label="Aim trainer: tap or click the floating eyes"></canvas>
            <div class="gm__overlay" id="gm-start">
              <p class="gm__kicker">REYNA'S RANGE</p>
              <h3 class="gm__title">SHOOT THE BLIND</h3>
              <p class="gm__desc">Destroy the Leers before they cross the range. ${ROUND_SECONDS} seconds. Every miss, she notices.</p>
              <button type="button" class="btn btn--red" data-gm="start">Start round</button>
            </div>
            <div class="gm__overlay" id="gm-over" hidden>
              <p class="gm__kicker" id="gm-newbest" hidden>NEW PERSONAL BEST</p>
              <h3 class="gm__title">ROUND OVER</h3>
              <div class="gm__result"><b id="gm-final">0</b><span>HITS</span><b id="gm-final-acc">0%</b><span>ACCURACY</span></div>
              <p class="gm__roast" id="gm-verdict"></p>
              <button type="button" class="btn btn--red" data-gm="start">Run it back</button>
            </div>
          </div>
        </div>`;
      this.canvas = root.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this._onResize = () => this.resize();
      this._onVis = () => { if (document.hidden && this.running) this.end(); };
      window.addEventListener('resize', this._onResize);
      document.addEventListener('visibilitychange', this._onVis);
      root.querySelectorAll('[data-gm="start"]').forEach(b => b.addEventListener('click', () => this.start()));
      const pos = e => {
        const r = this.canvas.getBoundingClientRect();
        this.mouse.x = (e.clientX - r.left) / r.width * W;
        this.mouse.y = (e.clientY - r.top) / r.height * H;
      };
      this.canvas.addEventListener('pointermove', pos);
      this.canvas.addEventListener('pointerdown', e => { e.preventDefault(); pos(e); this.shoot(); });
      this.resize();
      this.reset();
      this.draw();
    },

    destroy() {
      this.running = false;
      cancelAnimationFrame(this.raf);
      if (this._onResize) window.removeEventListener('resize', this._onResize);
      if (this._onVis) document.removeEventListener('visibilitychange', this._onVis);
      this._onResize = this._onVis = null;
      this.root = this.canvas = this.ctx = null;
    },

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(rect.width * this.dpr);
      this.canvas.height = Math.round(rect.width * (H / W) * this.dpr);
      this.scale = this.canvas.width / W;
      this.ctx.imageSmoothingEnabled = false;
      if (!this.running) this.draw();
    },

    reset() {
      this.hits = this.misses = this.shots = this.streak = 0;
      this.timeLeft = ROUND_SECONDS;
      this.targets = []; this.particles = []; this.popups = [];
      this.chat = { text: '', t: 0 };
      this.spawnT = 0;
      this.hud();
    },

    start() {
      if (!this.root) return;
      this.root.querySelector('#gm-start').hidden = true;
      this.root.querySelector('#gm-over').hidden = true;
      this.reset();
      this.running = true;
      this.last = performance.now();
      cancelAnimationFrame(this.raf);
      const tick = now => {
        if (!this.running) return;
        const dt = Math.min(50, now - this.last) / 16.667; // frames @60
        this.last = now;
        this.update(dt);
        this.draw();
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    },

    end() {
      this.running = false;
      cancelAnimationFrame(this.raf);
      if (!this.root) return;
      const acc = this.shots ? Math.round(this.hits / this.shots * 100) : 0;
      const best = this.highScore;
      const isBest = this.hits > best;
      if (isBest) this.highScore = this.hits;
      this.root.querySelector('#gm-final').textContent = this.hits;
      this.root.querySelector('#gm-final-acc').textContent = acc + '%';
      this.root.querySelector('#gm-verdict').textContent = '“' + verdict(acc, this.hits) + '” — REYNA';
      this.root.querySelector('#gm-newbest').hidden = !isBest;
      this.root.querySelector('#gm-over').hidden = false;
      this.hud();
      this.draw();
    },

    roast() {
      if (this.chat.t > 0) return;
      this.chat = { text: ROASTS[Math.floor(Math.random() * ROASTS.length)], t: 90 };
    },

    shoot() {
      if (!this.running) return;
      this.shots++;
      for (let i = this.targets.length - 1; i >= 0; i--) {
        const t = this.targets[i];
        const half = 14 * t.scale;
        if (Math.abs(this.mouse.x - t.x) < half && Math.abs(this.mouse.y - t.y) < half) {
          this.burst(t.x, t.y);
          this.targets.splice(i, 1);
          this.hits++; this.streak++;
          this.flash = 6;
          this.popups.push({ x: t.x, y: t.y - 10, t: 40, text: this.streak >= 5 ? 'x' + this.streak : '+1' });
          this.hud();
          return;
        }
      }
      this.misses++; this.streak = 0;
      if (this.misses % 3 === 0) this.roast();
      this.hud();
    },

    spawn() {
      const left = Math.random() > 0.5;
      const elapsed = ROUND_SECONDS - this.timeLeft;
      const speed = (Math.random() * 0.9 + 0.55) * (1 + elapsed / 40);
      this.targets.push({
        x: left ? -16 : W + 16,
        y: Math.random() * (FLOOR - 50) + 18,
        vx: (left ? 1 : -1) * speed,
        vy: (Math.random() - 0.5) * 0.9,
        scale: Math.random() * 0.45 + 0.75,
        phase: Math.random() * 6.28
      });
    },

    burst(x, y) {
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2, s = Math.random() * 1.8 + 0.4;
        this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 30, color: i % 3 ? '#9c27b0' : '#e1bee7' });
      }
    },

    update(dt) {
      this.timeLeft -= dt / 60;
      if (this.timeLeft <= 0) { this.timeLeft = 0; this.end(); return; }
      const interval = Math.max(26, 58 - (ROUND_SECONDS - this.timeLeft) * 1.1);
      this.spawnT += dt;
      if (this.spawnT > interval) { this.spawn(); this.spawnT = 0; }
      for (let i = this.targets.length - 1; i >= 0; i--) {
        const t = this.targets[i];
        t.x += t.vx * dt; t.y += t.vy * dt; t.phase += 0.08 * dt;
        if (t.y < 14 || t.y > FLOOR - 22) t.vy *= -1;
        if ((t.vx > 0 && t.x > W + 24) || (t.vx < 0 && t.x < -24)) {
          this.targets.splice(i, 1);
          this.misses++; this.streak = 0;
          this.roast();
          this.hud();
        }
      }
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.03 * dt; p.life -= dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const p = this.popups[i]; p.y -= 0.35 * dt; p.t -= dt;
        if (p.t <= 0) this.popups.splice(i, 1);
      }
      if (this.chat.t > 0) this.chat.t -= dt;
      if (this.flash > 0) this.flash -= dt;
      const tEl = this.root && this.root.querySelector('#gm-time');
      if (tEl) tEl.textContent = Math.ceil(this.timeLeft);
    },

    hud() {
      if (!this.root) return;
      const acc = this.shots ? Math.round(this.hits / this.shots * 100) : 100;
      const set = (id, v) => { const el = this.root.querySelector(id); if (el) el.textContent = v; };
      set('#gm-hits', this.hits);
      set('#gm-miss', this.misses);
      set('#gm-acc', acc + '%');
      set('#gm-best', this.highScore);
      set('#gm-time', Math.ceil(this.timeLeft));
    },

    sprite(m, cx, cy, s) {
      const ctx = this.ctx, h = m.length, w = m[0].length;
      const x0 = Math.floor(cx - w * s / 2), y0 = Math.floor(cy - h * s / 2);
      for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
        const k = m[r][c];
        if (k) { ctx.fillStyle = PALETTE[k]; ctx.fillRect(x0 + c * s, y0 + r * s, Math.ceil(s), Math.ceil(s)); }
      }
    },

    draw() {
      const ctx = this.ctx; if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.scale(this.scale, this.scale);
      // range backdrop
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#16222e'); g.addColorStop(1, '#0b1118');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(236,232,225,0.05)'; ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FLOOR); ctx.stroke(); }
      for (let y = 0; y <= FLOOR; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // floor with perspective lines
      ctx.fillStyle = '#0a0f15'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
      ctx.strokeStyle = 'rgba(255,70,85,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, FLOOR + 0.5); ctx.lineTo(W, FLOOR + 0.5); ctx.stroke();
      ctx.strokeStyle = 'rgba(236,232,225,0.06)';
      for (let x = -160; x <= W + 160; x += 32) { ctx.beginPath(); ctx.moveTo(W / 2 + (x - W / 2) * 0.35, FLOOR); ctx.lineTo(x, H); ctx.stroke(); }
      // targets
      for (const t of this.targets) this.sprite(SPRITES.eye, t.x, t.y + Math.sin(t.phase) * 1.5, t.scale * 2);
      // reyna
      this.sprite(SPRITES.reyna, 286, FLOOR - 22, 4);
      if (this.chat.t > 0) this.bubble(this.chat.text, 270, 112);
      // particles & popups
      for (const p of this.particles) { ctx.globalAlpha = Math.max(0, p.life / 30); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 2, 2); }
      ctx.globalAlpha = 1;
      ctx.font = '700 8px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      for (const p of this.popups) { ctx.globalAlpha = Math.max(0, p.t / 40); ctx.fillStyle = '#3df5c8'; ctx.fillText(p.text, p.x, p.y); }
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
      // crosshair (teal, game-style)
      const mx = this.mouse.x, my = this.mouse.y;
      ctx.strokeStyle = this.flash > 0 ? '#ff4655' : '#3df5c8'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mx - 7, my); ctx.lineTo(mx - 2.5, my); ctx.moveTo(mx + 2.5, my); ctx.lineTo(mx + 7, my);
      ctx.moveTo(mx, my - 7); ctx.lineTo(mx, my - 2.5); ctx.moveTo(mx, my + 2.5); ctx.lineTo(mx, my + 7);
      ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle; ctx.fillRect(mx - 0.5, my - 0.5, 1, 1);
      if (this.flash > 0) { // hit marker
        ctx.beginPath();
        ctx.moveTo(mx - 6, my - 6); ctx.lineTo(mx - 3, my - 3); ctx.moveTo(mx + 6, my - 6); ctx.lineTo(mx + 3, my - 3);
        ctx.moveTo(mx - 6, my + 6); ctx.lineTo(mx - 3, my + 3); ctx.moveTo(mx + 6, my + 6); ctx.lineTo(mx + 3, my + 3);
        ctx.stroke();
      }
    },

    bubble(text, x, y) {
      const ctx = this.ctx;
      ctx.font = '700 7px "JetBrains Mono", monospace';
      const w = Math.ceil(ctx.measureText(text).width) + 10, h = 13;
      ctx.fillStyle = '#ece8e1'; ctx.fillRect(x - w, y, w, h);
      ctx.beginPath(); ctx.moveTo(x - 6, y + h); ctx.lineTo(x, y + h + 5); ctx.lineTo(x, y + h); ctx.fill();
      ctx.fillStyle = '#ff4655'; ctx.fillRect(x - w, y, 2, h);
      ctx.fillStyle = '#0f1923'; ctx.fillText(text, x - w + 6, y + 9);
    }
  };

  window.RetroGame = Game;
})();
