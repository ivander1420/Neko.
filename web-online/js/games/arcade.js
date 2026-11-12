/* ============================================================
   NEKO · js/games/arcade.js — Arcade kreatif (terinspirasi CrazyGames)
   Bukan klon beda-nama: tiap game punya mekanik unik.
   Kit kanvas imut (bulat, gradien, partikel, wajah) dipakai bersama.
   ============================================================ */
(function () {
  'use strict';
  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};
  const { esc, clamp, rand, pick } = Neko.util;
  const { icon } = Neko.icons;

  const PALETTE = ['#22d3ee', '#f59e0b', '#fb7185', '#a3e635', '#a78bfa', '#38bdf8', '#2dd4bf', '#fb923c', '#f472b6', '#facc15'];

  /* ---------------- Kit kanvas imut ---------------- */
  const Kit = {
    make(ctx, o) {
      const W = o.w || 420, H = o.h || 640;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      ctx.setStage(
        '<div class="ak-stage" style="--ak:' + (o.color || '#22d3ee') + '">' +
        '<div class="ak-lab-label">' + icon('network') + '<span>LAB TJKT</span><small>Zona latihan · ' + esc(o.name || 'Arcade') + '</small></div><div class="ak-frame">' +
        '<canvas class="ak-canvas" width="' + Math.round(W * dpr) + '" height="' + Math.round(H * dpr) + '"></canvas>' +
        '</div>' + (o.hint ? '<p class="ak-hint">' + icon('info') + '<span>' + esc(o.hint) + '</span></p>' : '') + '</div>', true);
      const canvas = ctx.frame.querySelector('.ak-canvas');
      const c = canvas.getContext('2d');
      c.scale(dpr, dpr);
      return { canvas, c, W, H };
    },
    pos(canvas, W, H, e) {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
    },
    pointer(ctx, canvas, W, H, h) {
      let dragging = false;
      const down = e => { e.preventDefault(); dragging = true; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); h.down && h.down(Kit.pos(canvas, W, H, e), e); };
      const move = e => { if (!dragging) return; h.move && h.move(Kit.pos(canvas, W, H, e), e); };
      const up = e => { dragging = false; h.up && h.up(e); };
      canvas.addEventListener('pointerdown', down);
      canvas.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
      ctx.cleanup(() => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); });
    },
    tap(ctx, canvas, W, H, fn) { Kit.pointer(ctx, canvas, W, H, { down: fn }); },
    keys(ctx, map) {
      const down = e => { const fn = map[e.code]; if (fn) { e.preventDefault(); fn(e); } };
      window.addEventListener('keydown', down);
      ctx.cleanup(() => window.removeEventListener('keydown', down));
    },
    held(ctx) {
      const s = {};
      const down = e => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault(); s[e.code] = true; };
      const up = e => { s[e.code] = false; };
      window.addEventListener('keydown', down); window.addEventListener('keyup', up);
      ctx.cleanup(() => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); });
      return s;
    },
    run(ctx, step) {
      let raf = 0, last = performance.now(), stopped = false;
      const frame = now => {
        if (stopped || ctx.ended) return;
        const dt = Math.min(2.5, (now - last) / 16.667); last = now;
        step(dt, now);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      ctx.cleanup(() => { stopped = true; cancelAnimationFrame(raf); });
    },
    rr(c, x, y, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    },
    alpha(hex, a) {
      const n = parseInt(hex.slice(1), 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    },
    light(hex, amt) {
      const n = parseInt(hex.slice(1), 16);
      const r = Math.min(255, ((n >> 16) & 255) + Math.round(255 * amt));
      const g = Math.min(255, ((n >> 8) & 255) + Math.round(255 * amt));
      const b = Math.min(255, (n & 255) + Math.round(255 * amt));
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    },
    bg(c, W, H, color, t) {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0a0f1f'); g.addColorStop(1, '#141b33');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      const rg = c.createRadialGradient(W / 2, H * 0.18, 8, W / 2, H * 0.18, W * 0.95);
      rg.addColorStop(0, Kit.alpha(color, 0.20)); rg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = rg; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 26; i++) {
        const x = (i * 73 + (t || 0) * 0.01) % W, y = (i * 137) % H;
        c.beginPath(); c.arc(x, y, 1.6, 0, 7); c.fill();
      }
    },
    face(c, x, y, r, mood) {
      c.fillStyle = '#0a0f1f';
      const ex = r * 0.36, ey = -r * 0.12, er = Math.max(1.5, r * 0.14);
      c.beginPath(); c.arc(x - ex, y + ey, er, 0, 7); c.arc(x + ex, y + ey, er, 0, 7); c.fill();
      c.strokeStyle = '#0a0f1f'; c.lineWidth = Math.max(1.1, r * 0.09); c.lineCap = 'round';
      c.beginPath();
      if (mood === 'sad') c.arc(x, y + r * 0.5, r * 0.26, Math.PI * 1.15, Math.PI * 1.85);
      else if (mood === 'wow') { c.arc(x, y + r * 0.3, r * 0.16, 0, 7); }
      else c.arc(x, y + r * 0.16, r * 0.3, 0.15 * Math.PI, 0.85 * Math.PI);
      c.stroke();
    },
    burst(list, x, y, color, n, spd) {
      for (let i = 0; i < (n || 12); i++) {
        const a = Math.random() * Math.PI * 2, v = (spd || 3) * (0.4 + Math.random());
        list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 1, r: 2 + Math.random() * 3, color });
      }
    },
    parts(c, list, dt) {
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.16 * dt; p.life -= 0.022 * dt;
        if (p.life <= 0) { list.splice(i, 1); continue; }
        c.globalAlpha = Math.max(0, p.life); c.fillStyle = p.color;
        c.beginPath(); c.arc(p.x, p.y, p.r * p.life, 0, 7); c.fill();
      }
      c.globalAlpha = 1;
    },
    /* ---- Sprite & latar bertema TJKT (jaringan komputer) ---- */
    wifi(c, x, y, r, color, alpha) {
      c.strokeStyle = Kit.alpha(color, alpha == null ? 0.4 : alpha); c.lineWidth = 2.4; c.lineCap = 'round';
      for (let i = 1; i <= 3; i++) { c.beginPath(); c.arc(x, y, r * i / 3, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
      c.fillStyle = Kit.alpha(color, alpha == null ? 0.5 : alpha); c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.fill();
    },
    netBg(c, W, H, color, t) {
      Kit.bg(c, W, H, color, t);
      const N = 12, pts = [];
      for (let i = 0; i < N; i++) pts.push({ x: (i * 137 + 40) % W, y: (i * 89 + 30) % H });
      c.strokeStyle = Kit.alpha(color, 0.10); c.lineWidth = 1; c.beginPath();
      for (let i = 0; i < N; i++) { const a = pts[i], b = pts[(i + 1) % N], d = pts[(i + 4) % N]; c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.moveTo(a.x, a.y); c.lineTo(d.x, d.y); }
      c.stroke();
      pts.forEach((p, i) => { const on = Math.sin((t || 0) * 0.002 + i) > 0; c.fillStyle = Kit.alpha(color, on ? 0.5 : 0.2); c.beginPath(); c.arc(p.x, p.y, on ? 2.4 : 1.6, 0, 7); c.fill(); });
      for (let k = 0; k < 5; k++) { const a = pts[k % N], b = pts[(k + 1) % N], u = ((t || 0) * 0.00012 + k * 0.2) % 1; c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, 1.8, 0, 7); c.fill(); }
      Kit.wifi(c, W - 34, 44, 24, color, 0.22);
    },
    rack(c, x, y, w, h, color, t) {
      const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, Kit.light(color, 0.22)); g.addColorStop(1, color);
      c.fillStyle = g; Kit.rr(c, x, y, w, h, Math.min(9, h / 2)); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1.4; c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x + 6, y + h * 0.3 + i * h * 0.2); c.lineTo(x + Math.min(14, w * 0.2), y + h * 0.3 + i * h * 0.2); c.stroke(); }
      for (let i = 0; i < 3; i++) { const on = Math.sin((t || 0) * 0.004 + i * 2 + x) > 0; c.fillStyle = on ? '#a3e635' : 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(x + w - 8 - i * 7, y + h / 2, 2, 0, 7); c.fill(); }
      if (w > 50) Kit.face(c, x + w / 2, y + h / 2, Math.min(12, h * 0.34), 'happy');
    },
    router(c, cx, cy, w, h, color, t, mood) {
      const x = cx - w / 2, y = cy - h / 2;
      c.strokeStyle = color; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x + w * 0.25, y); c.lineTo(x + w * 0.15, y - h * 0.7); c.moveTo(x + w * 0.75, y); c.lineTo(x + w * 0.85, y - h * 0.7); c.stroke();
      const blink = Math.sin((t || 0) * 0.005) > 0;
      c.fillStyle = blink ? '#facc15' : Kit.alpha('#facc15', 0.4); c.beginPath(); c.arc(x + w * 0.15, y - h * 0.7, 3, 0, 7); c.fill();
      c.fillStyle = !blink ? '#facc15' : Kit.alpha('#facc15', 0.4); c.beginPath(); c.arc(x + w * 0.85, y - h * 0.7, 3, 0, 7); c.fill();
      const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, Kit.light(color, 0.25)); g.addColorStop(1, color);
      c.fillStyle = g; Kit.rr(c, x, y, w, h, Math.min(10, h / 2)); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1.5; c.stroke();
      for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(10,15,31,.45)'; Kit.rr(c, x + w * 0.14 + i * w * 0.19, y + h * 0.62, w * 0.13, h * 0.2, 2); c.fill(); }
      Kit.face(c, cx, y + h * 0.34, Math.min(10, h * 0.3), mood || 'happy');
    },
    rj45(c, x, y, w, h, color) {
      c.strokeStyle = color; c.lineWidth = w * 0.35; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x + w / 2, y + h); c.lineTo(x + w / 2, y + h + w * 0.8); c.stroke();
      const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, Kit.light(color, 0.3)); g.addColorStop(1, color);
      c.fillStyle = g; Kit.rr(c, x, y, w, h, 3); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = '#facc15'; for (let i = 0; i < 4; i++) c.fillRect(x + w * 0.15 + i * w * 0.2, y + 2, w * 0.1, h * 0.22);
      c.fillStyle = Kit.light(color, 0.4); Kit.rr(c, x + w * 0.3, y + h * 0.4, w * 0.4, h * 0.25, 2); c.fill();
    },
    packet(c, x, y, r, color, t, mood) {
      c.save(); c.translate(x, y);
      c.strokeStyle = color; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -r); c.lineTo(0, -r - 6); c.stroke();
      c.fillStyle = '#facc15'; c.beginPath(); c.arc(0, -r - 7, 2.4, 0, 7); c.fill();
      const g = c.createLinearGradient(0, -r, 0, r); g.addColorStop(0, Kit.light(color, 0.3)); g.addColorStop(1, color);
      c.fillStyle = g; Kit.rr(c, -r, -r, r * 2, r * 2, r * 0.5); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.6; c.stroke();
      Kit.face(c, 0, 0, r * 0.6, mood || 'happy');
      c.restore();
    },
    device(c, x, y, r, type, color, t) {
      c.save(); c.translate(x, y);
      const g = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r); g.addColorStop(0, Kit.light(color, 0.3)); g.addColorStop(1, color);
      c.fillStyle = g;
      if (type === 'cloud') { c.beginPath(); c.arc(-r * 0.4, 0, r * 0.55, 0, 7); c.arc(0, -r * 0.3, r * 0.65, 0, 7); c.arc(r * 0.4, 0, r * 0.55, 0, 7); c.rect(-r * 0.4, 0, r * 0.8, r * 0.5); c.fill(); }
      else if (type === 'wifi') { c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2.4; for (let i = 1; i <= 3; i++) { c.beginPath(); c.arc(0, r * 0.4, r * i * 0.3, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); } c.fillStyle = '#fff'; c.beginPath(); c.arc(0, r * 0.4, 2, 0, 7); c.fill(); }
      else if (type === 'server') { Kit.rr(c, -r * 0.8, -r, r * 1.6, r * 2, r * 0.3); c.fill(); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-r * 0.8, 0); c.lineTo(r * 0.8, 0); c.stroke(); c.fillStyle = '#a3e635'; c.beginPath(); c.arc(-r * 0.5, -r * 0.5, 2, 0, 7); c.arc(-r * 0.5, r * 0.5, 2, 0, 7); c.fill(); }
      else if (type === 'cable') { c.strokeStyle = color; c.lineWidth = r * 0.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 0.7, r * 0.5); c.quadraticCurveTo(0, -r * 0.6, r * 0.7, r * 0.4); c.stroke(); c.fillStyle = Kit.light(color, 0.3); Kit.rr(c, -r * 0.95, r * 0.2, r * 0.5, r * 0.6, 3); c.fill(); Kit.rr(c, r * 0.45, r * 0.1, r * 0.5, r * 0.6, 3); c.fill(); }
      else if (type === 'globe') { c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, r, 0, 7); c.moveTo(-r, 0); c.lineTo(r, 0); c.moveTo(0, -r); c.ellipse(0, 0, r * 0.45, r, 0, 0, 7); c.stroke(); }
      else { Kit.rr(c, -r, -r * 0.6, r * 2, r * 1.2, r * 0.35); c.fill(); c.strokeStyle = color; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-r * 0.5, -r * 0.6); c.lineTo(-r * 0.7, -r * 1.1); c.moveTo(r * 0.5, -r * 0.6); c.lineTo(r * 0.7, -r * 1.1); c.stroke(); }
      if (type !== 'wifi' && type !== 'cable') Kit.face(c, 0, type === 'server' ? -r * 0.4 : 0, r * 0.4, 'happy');
      c.restore();
    },
    end(ctx, game, score, won, extra) {
      const xp = Math.max(10, Math.round(score * (game.xpMul || 2) + (won ? 25 : 0)));
      ctx.audio.play(won ? 'win' : 'lose');
      if (won) ctx.confetti(undefined, undefined, 44);
      ctx.finish(Object.assign({
        title: won ? 'Keren! Kamu menang!' : 'Sesi selesai',
        message: game.name + (won ? ' — target tercapai. Main lagi?' : ' — coba lagi, kamu pasti bisa!'),
        won: !!won, score: Math.max(0, Math.round(score)), xp,
        stats: [{ label: 'Skor', value: Math.round(score) }, { label: 'Target', value: game.target }]
      }, extra || {}));
    }
  };
  Neko.arcadeKit = Kit;

  /* ---------------- 1. Menara Server (Stack) ---------------- */
  function runStack(ctx, game) {
    const { canvas, c, W, H } = Kit.make(ctx, game);
    const BH = 34, baseW = 210;
    const blocks = [{ x: (W - baseW) / 2, w: baseW, y: H - 90, color: game.color }];
    let moving = null, dir = 1, speed = 2.4 * game.speed, score = 0, combo = 0, cam = 0, over = false, ci = 0;
    const chops = [], parts = [];
    const top = () => blocks[blocks.length - 1];
    function spawn() {
      const t = top(); ci++;
      moving = { x: 0, w: t.w, y: t.y - BH, color: PALETTE[ci % PALETTE.length] };
      dir = Math.random() < 0.5 ? 1 : -1;
      moving.x = dir > 0 ? -t.w : W;
    }
    function drop() {
      if (over || !moving) return;
      const t = top();
      const overlap = Math.min(moving.x + moving.w, t.x + t.w) - Math.max(moving.x, t.x);
      if (overlap <= 2) {
        over = true; ctx.audio.play('error');
        chops.push({ x: moving.x, y: moving.y, w: moving.w, vy: 0, color: moving.color });
        Kit.end(ctx, game, score, false); return;
      }
      const perfect = Math.abs(moving.x - t.x) < 8;
      let nx = Math.max(moving.x, t.x), nw = overlap;
      if (perfect) { nx = t.x; nw = t.w; combo++; ctx.audio.play('success'); Kit.burst(parts, nx + nw / 2, moving.y, '#facc15', 16, 4); }
      else {
        combo = 0; ctx.audio.play('tap');
        const cx = moving.x < t.x ? moving.x : t.x + t.w;
        chops.push({ x: cx, y: moving.y, w: Math.max(2, moving.w - nw), vy: -1, color: moving.color });
      }
      blocks.push({ x: nx, w: nw, y: moving.y, color: moving.color });
      score++;
      ctx.setHUD([{ icon: 'server', label: score + ' blok' }, { icon: 'target', label: 'Target ' + game.target }]);
      if (score >= game.target) { over = true; Kit.end(ctx, game, score, true); return; }
      speed += 0.13; spawn();
    }
    spawn();
    Kit.tap(ctx, canvas, W, H, drop);
    Kit.keys(ctx, { Space: drop, Enter: drop });
    ctx.setHUD([{ icon: 'server', label: '0 blok' }, { icon: 'target', label: 'Target ' + game.target }]);
    function block(b, time) { Kit.rack(c, b.x, b.y, b.w, BH, b.color, time); }
    Kit.run(ctx, (dt, t) => {
      const tc = Math.max(0, H * 0.6 - top().y);
      cam += (tc - cam) * 0.09 * dt;
      if (moving && !over) { moving.x += dir * speed * dt; if (moving.x > W) dir = -1; if (moving.x + moving.w < 0) dir = 1; }
      Kit.netBg(c, W, H, game.color, t);
      c.save(); c.translate(0, cam);
      blocks.forEach(b => block(b, t));
      if (moving && !over) block(moving, t);
      for (let i = chops.length - 1; i >= 0; i--) { const ch = chops[i]; ch.vy += 0.5 * dt; ch.y += ch.vy * dt; c.globalAlpha = 0.85; Kit.rr(c, ch.x, ch.y, ch.w, BH, 8); c.fillStyle = ch.color; c.fill(); c.globalAlpha = 1; if (ch.y > H + 300) chops.splice(i, 1); }
      c.restore();
      Kit.parts(c, parts, dt);
      if (combo > 1) { c.fillStyle = '#facc15'; c.font = '800 22px system-ui,sans-serif'; c.textAlign = 'center'; c.fillText('COMBO x' + combo, W / 2, 56); }
    });
  }

  /* ---------------- 2. Tancap Konektor (Knife Hit) ---------------- */
  function runKnife(ctx, game) {
    const { canvas, c, W, H } = Kit.make(ctx, game);
    const cx = W / 2, cy = H * 0.32, R = 86;
    let stage = 1, score = 0, over = false;
    let rot = 0, rotSpeed = 0.02 * game.speed;
    let stuck = [], knivesLeft = 0, flying = null, shake = 0;
    const parts = [];
    function setup() {
      knivesLeft = 5 + stage; stuck = [];
      const pre = Math.min(stage + 1, 6);
      for (let i = 0; i < pre; i++) stuck.push({ a: (i / pre) * Math.PI * 2 + Math.random() * 0.3 });
      rotSpeed = (0.018 + stage * 0.004) * game.speed * (Math.random() < 0.5 ? 1 : -1);
      ctx.setHUD([{ icon: 'cable', label: knivesLeft + ' konektor' }, { icon: 'layers', label: 'Stage ' + stage }, { icon: 'target', label: score + ' poin' }]);
    }
    setup();
    function throwKnife() {
      if (over || flying || knivesLeft <= 0) return;
      flying = { y: H - 70, v: 16 };
      ctx.audio.play('tap');
    }
    Kit.tap(ctx, canvas, W, H, throwKnife);
    Kit.keys(ctx, { Space: throwKnife });
    function impact() {
      const rel = ((Math.PI / 2 - rot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const hit = stuck.some(k => { let d = Math.abs(k.a - rel); d = Math.min(d, Math.PI * 2 - d); return d < 0.22; });
      if (hit) {
        over = true; shake = 16; ctx.audio.play('error');
        Kit.burst(parts, cx, cy + R, '#fb7185', 20, 5);
        Kit.end(ctx, game, score, false); return;
      }
      stuck.push({ a: rel }); knivesLeft--; score += 10;
      ctx.audio.play('success'); Kit.burst(parts, cx, cy + R, game.color, 12, 3);
      flying = null;
      ctx.setHUD([{ icon: 'cable', label: knivesLeft + ' konektor' }, { icon: 'layers', label: 'Stage ' + stage }, { icon: 'target', label: score + ' poin' }]);
      if (knivesLeft <= 0) {
        stage++; score += 30;
        if (stage > game.target) { over = true; Kit.end(ctx, game, score, true); return; }
        ctx.confetti(cx, cy, 18); setup();
      }
    }
    Kit.run(ctx, (dt, t) => {
      rot += rotSpeed * dt;
      if (flying) { flying.y -= flying.v * dt; if (flying.y <= cy + R) impact(); }
      if (shake > 0) shake -= dt;
      Kit.netBg(c, W, H, game.color, t);
      c.save();
      if (shake > 0) c.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      // target router
      c.save(); c.translate(cx, cy); c.rotate(rot);
      const g = c.createRadialGradient(-20, -20, 10, 0, 0, R);
      g.addColorStop(0, Kit.light(game.color, 0.3)); g.addColorStop(1, game.color);
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 3; c.stroke();
      c.strokeStyle = Kit.alpha('#ffffff', 0.18); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, R * 0.78, 0, 7); c.stroke();
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2, px = Math.cos(a) * R * 0.6, py = Math.sin(a) * R * 0.6;
        c.fillStyle = 'rgba(10,15,31,.42)'; Kit.rr(c, px - 6, py - 4, 12, 8, 2); c.fill();
        const on = Math.sin(t * 0.004 + i) > 0; c.fillStyle = on ? '#a3e635' : 'rgba(0,0,0,.3)'; c.beginPath(); c.arc(px + 4, py - 6, 1.7, 0, 7); c.fill();
      }
      stuck.forEach(k => { c.save(); c.rotate(k.a); Kit.rj45(c, -6, R - 10, 12, 26, '#cbd5e1'); c.restore(); });
      c.restore();
      Kit.face(c, cx, cy, 30, over ? 'sad' : 'happy');
      // player connector (RJ45)
      const ky = flying ? flying.y : H - 70;
      Kit.rj45(c, cx - 7, ky, 14, 30, game.color);
      c.restore();
      Kit.parts(c, parts, dt);
      c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '600 13px system-ui,sans-serif'; c.textAlign = 'center';
      c.fillText('Ketuk untuk menancapkan — jangan kena konektor lain!', W / 2, H - 20);
    });
  }

  /* ---------------- 3. Lompat Awan (Doodle Jump) ---------------- */
  function runDoodle(ctx, game) {
    const { canvas, c, W, H } = Kit.make(ctx, game);
    const held = Kit.held(ctx);
    const PW = 64;
    let player = { x: W / 2, y: H - 120, vx: 0, vy: -11, w: 34 };
    let plats = [], cam = 0, best = 0, score = 0, over = false, touchX = null;
    const parts = [];
    const grav = 0.42 * game.speed, jump = -11.5;
    function makePlat(y, type) { return { x: rand(10, W - PW - 10), y, w: PW, type: type || 'normal', dir: 1, broken: false }; }
    plats.push(makePlat(H - 80, 'normal'));
    for (let y = H - 160; y > -H; y -= rand(55, 90)) plats.push(makePlat(y, Math.random() < 0.18 ? 'move' : (Math.random() < 0.15 ? 'break' : 'normal')));
    function steer(dt) {
      let ax = 0;
      if (held.ArrowLeft || held.KeyA) ax -= 1;
      if (held.ArrowRight || held.KeyD) ax += 1;
      if (touchX != null) ax = clamp((touchX - player.x) / 40, -1, 1);
      player.vx += ax * 0.9 * dt; player.vx *= 0.86; player.x += player.vx * dt;
      if (player.x < -20) player.x = W + 20; if (player.x > W + 20) player.x = -20;
    }
    Kit.pointer(ctx, canvas, W, H, { down: p => { touchX = p.x; }, move: p => { touchX = p.x; }, up: () => { touchX = null; } });
    ctx.setHUD([{ icon: 'cloud', label: '0 m' }, { icon: 'target', label: 'Target ' + game.target + ' m' }]);
    Kit.run(ctx, (dt, t) => {
      if (over) return;
      steer(dt);
      player.vy += grav * dt; player.y += player.vy * dt;
      plats.forEach(p => {
        if (p.type === 'move' && !p.broken) { p.x += p.dir * 1.4 * game.speed * dt; if (p.x < 6 || p.x + p.w > W - 6) p.dir *= -1; }
        if (player.vy > 0 && !p.broken && player.x + 14 > p.x && player.x - 14 < p.x + p.w && player.y + 18 > p.y && player.y + 18 < p.y + 20) {
          if (p.type === 'break') { p.broken = true; ctx.audio.play('tap'); Kit.burst(parts, p.x + p.w / 2, p.y, '#fb923c', 10, 3); }
          else { player.vy = jump; player.y = p.y - 18; ctx.audio.play('tap'); Kit.burst(parts, player.x, p.y, game.color, 6, 2); }
        }
      });
      const height = Math.max(0, Math.round((H - 120 - player.y) / 10));
      if (height > best) { best = height; score = best; ctx.setHUD([{ icon: 'cloud', label: score + ' m' }, { icon: 'target', label: 'Target ' + game.target + ' m' }]); }
      if (score >= game.target) { over = true; Kit.end(ctx, game, score, true); return; }
      const tc = Math.max(0, H * 0.45 - player.y);
      if (tc > cam) {
        const diff = tc - cam; cam = tc;
        plats.forEach(p => p.y += diff);
        player.y += diff;
      }
      plats = plats.filter(p => p.y < H + 40);
      let highest = Math.min(...plats.map(p => p.y));
      while (highest > -40) { highest -= rand(55, 92); plats.push(makePlat(highest, Math.random() < 0.2 ? 'move' : (Math.random() < 0.16 ? 'break' : 'normal'))); }
      if (player.y > H + 60) { over = true; ctx.audio.play('error'); Kit.end(ctx, game, score, false); return; }
      Kit.netBg(c, W, H, game.color, t);
      c.save();
      plats.forEach(p => {
        if (p.broken) return;
        const col = p.type === 'move' ? '#38bdf8' : p.type === 'break' ? '#fb923c' : game.color;
        const g = c.createLinearGradient(p.x, p.y, p.x, p.y + 16);
        g.addColorStop(0, Kit.light(col, 0.28)); g.addColorStop(1, col);
        c.fillStyle = g; Kit.rr(c, p.x, p.y, p.w, 16, 8); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1.2; c.stroke();
        for (let k = 0; k < 4; k++) { const on = Math.sin(t * 0.005 + k + p.x) > 0; c.fillStyle = on ? '#a3e635' : 'rgba(10,15,31,.4)'; c.beginPath(); c.arc(p.x + 13 + k * 11, p.y + 8, 2, 0, 7); c.fill(); }
        if (p.type === 'move') Kit.wifi(c, p.x + p.w / 2, p.y - 3, 11, '#7dd3fc', 0.75);
        if (p.type === 'break') { c.strokeStyle = 'rgba(10,15,31,.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x + p.w * 0.42, p.y + 2); c.lineTo(p.x + p.w * 0.54, p.y + 8); c.lineTo(p.x + p.w * 0.44, p.y + 14); c.stroke(); }
      });
      // cute packet hero
      Kit.packet(c, player.x, player.y, 16, '#facc15', t, player.vy < 0 ? 'wow' : 'happy');
      c.restore();
      Kit.parts(c, parts, dt);
    });
  }

  /* ---------------- 4. Tebas Kabel (Fruit Slice) ---------------- */
  function runSlice(ctx, game) {
    const { canvas, c, W, H } = Kit.make(ctx, game);
    let objs = [], score = 0, lives = 3, over = false, spawnT = 0, combo = 0, comboT = 0;
    const trail = [], parts = [];
    const grav = 0.32 * game.speed;
    function spawn() {
      const bomb = Math.random() < 0.16;
      const x = rand(50, W - 50);
      objs.push({ x, y: H + 30, vx: (W / 2 - x) * 0.012 + rand(-2, 2), vy: -(11 + Math.random() * 3) * Math.sqrt(game.speed), r: bomb ? 24 : 26, bomb, type: pick(['cloud', 'wifi', 'server', 'cable', 'globe', 'router']), color: pick(PALETTE), sliced: false, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2 });
    }
    function sliceAt(x, y) {
      if (over) return;
      let hitAny = false;
      objs.forEach(o => {
        if (o.sliced) return;
        const d = Math.hypot(o.x - x, o.y - y);
        if (d < o.r + 12) {
          o.sliced = true; hitAny = true;
          if (o.bomb) { over = true; ctx.audio.play('error'); Kit.burst(parts, o.x, o.y, '#fb7185', 30, 6); Kit.end(ctx, game, score, false); }
          else { score += 10 + combo * 2; combo++; comboT = 30; ctx.audio.play('success'); Kit.burst(parts, o.x, o.y, o.color, 16, 4); ctx.setHUD([{ icon: 'crosshair', label: score + ' poin' }, { icon: 'heart', label: lives + ' nyawa' }]); }
        }
      });
      if (hitAny && !over && score >= game.target) { over = true; Kit.end(ctx, game, score, true); }
    }
    Kit.pointer(ctx, canvas, W, H, {
      down: p => { trail.length = 0; trail.push({ x: p.x, y: p.y, life: 1 }); sliceAt(p.x, p.y); },
      move: p => { trail.push({ x: p.x, y: p.y, life: 1 }); if (trail.length > 14) trail.shift(); sliceAt(p.x, p.y); }
    });
    ctx.setHUD([{ icon: 'crosshair', label: '0 poin' }, { icon: 'heart', label: '3 nyawa' }, { icon: 'target', label: 'Target ' + game.target }]);
    Kit.run(ctx, (dt, t) => {
      if (!over) { spawnT += dt; if (spawnT > Math.max(26, 60 - score * 0.1)) { spawn(); if (Math.random() < 0.4) spawn(); spawnT = 0; } }
      if (comboT > 0) comboT -= dt; else combo = 0;
      for (let i = objs.length - 1; i >= 0; i--) {
        const o = objs[i];
        o.vy += grav * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt;
        if (o.y > H + 60) {
          if (!o.sliced && !o.bomb && !over) { lives--; ctx.audio.play('error'); ctx.setHUD([{ icon: 'crosshair', label: score + ' poin' }, { icon: 'heart', label: lives + ' nyawa' }]); if (lives <= 0) { over = true; Kit.end(ctx, game, score, false); } }
          objs.splice(i, 1);
        }
      }
      Kit.netBg(c, W, H, game.color, t);
      objs.forEach(o => {
        c.save(); c.translate(o.x, o.y); c.rotate(o.rot);
        if (o.bomb) {
          c.fillStyle = '#4c1d2f';
          for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; c.beginPath(); c.arc(Math.cos(a) * o.r, Math.sin(a) * o.r, o.r * 0.24, 0, 7); c.fill(); }
          c.beginPath(); c.arc(0, 0, o.r * 0.84, 0, 7); c.fill();
          c.strokeStyle = '#fb7185'; c.lineWidth = 2.5; c.stroke();
          Kit.face(c, 0, -2, o.r * 0.46, 'sad');
          c.fillStyle = '#fb7185'; c.font = '800 12px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', 0, o.r * 0.5);
        } else if (o.sliced) {
          c.globalAlpha = 0.5; c.fillStyle = o.color;
          c.beginPath(); c.arc(-8, 0, o.r * 0.8, Math.PI * 0.5, Math.PI * 1.5); c.fill();
          c.beginPath(); c.arc(8, 0, o.r * 0.8, -Math.PI * 0.5, Math.PI * 0.5); c.fill();
          c.globalAlpha = 1;
        } else {
          Kit.device(c, 0, 0, o.r, o.type, o.color, t);
        }
        c.restore();
      });
      // slice trail
      for (let i = trail.length - 1; i >= 0; i--) { trail[i].life -= 0.06 * dt; if (trail[i].life <= 0) trail.splice(i, 1); }
      if (trail.length > 1) {
        c.lineCap = 'round'; c.lineJoin = 'round';
        for (let i = 1; i < trail.length; i++) {
          c.strokeStyle = Kit.alpha('#ffffff', trail[i].life * 0.8); c.lineWidth = trail[i].life * 9;
          c.beginPath(); c.moveTo(trail[i - 1].x, trail[i - 1].y); c.lineTo(trail[i].x, trail[i].y); c.stroke();
        }
      }
      Kit.parts(c, parts, dt);
      if (combo > 1 && comboT > 0) { c.fillStyle = '#facc15'; c.font = '800 24px system-ui'; c.textAlign = 'center'; c.fillText('COMBO x' + combo, W / 2, 60); }
    });
  }

  /* ---------------- 5. Pantul Brick (Breakout) ---------------- */
  function runBreakout(ctx, game) {
    const { canvas, c, W, H } = Kit.make(ctx, game);
    const held = Kit.held(ctx);
    const paddle = { x: W / 2, w: 92, h: 16, y: H - 46 };
    let ball = { x: W / 2, y: H - 70, vx: 3.4 * game.speed, vy: -4.2 * game.speed, r: 8 };
    let bricks = [], score = 0, lives = 3, over = false, touchX = null;
    const parts = [];
    const cols = 8, rows = 5, bw = (W - 40) / cols, bh = 26;
    for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
      bricks.push({ x: 20 + col * bw, y: 70 + r * (bh + 6), w: bw - 6, h: bh, hp: r < 1 ? 2 : 1, color: PALETTE[(r + col) % PALETTE.length], alive: true });
    }
    const total = bricks.length;
    game.target = total;
    function resetBall() { ball.x = paddle.x; ball.y = H - 70; ball.vx = (Math.random() < 0.5 ? -1 : 1) * 3.4 * game.speed; ball.vy = -4.2 * game.speed; }
    Kit.pointer(ctx, canvas, W, H, { down: p => { touchX = p.x; }, move: p => { touchX = p.x; }, up: () => { touchX = null; } });
    ctx.setHUD([{ icon: 'grid', label: '0/' + total }, { icon: 'heart', label: '3 nyawa' }]);
    function loseLife() {
      lives--; ctx.audio.play('error');
      ctx.setHUD([{ icon: 'grid', label: score + '/' + total }, { icon: 'heart', label: lives + ' nyawa' }]);
      if (lives <= 0) { over = true; Kit.end(ctx, game, score, false); } else resetBall();
    }
    Kit.run(ctx, (dt, t) => {
      if (over) return;
      if (held.ArrowLeft || held.KeyA) paddle.x -= 8 * dt;
      if (held.ArrowRight || held.KeyD) paddle.x += 8 * dt;
      if (touchX != null) paddle.x += (touchX - paddle.x) * 0.35 * dt;
      paddle.x = clamp(paddle.x, paddle.w / 2 + 6, W - paddle.w / 2 - 6);
      ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      if (ball.x < ball.r + 4) { ball.x = ball.r + 4; ball.vx *= -1; }
      if (ball.x > W - ball.r - 4) { ball.x = W - ball.r - 4; ball.vx *= -1; }
      if (ball.y < ball.r + 4) { ball.y = ball.r + 4; ball.vy *= -1; }
      if (ball.y > H + 20) { loseLife(); return; }
      // paddle
      if (ball.vy > 0 && ball.y + ball.r > paddle.y && ball.y < paddle.y + paddle.h && ball.x > paddle.x - paddle.w / 2 - ball.r && ball.x < paddle.x + paddle.w / 2 + ball.r) {
        ball.y = paddle.y - ball.r;
        const rel = (ball.x - paddle.x) / (paddle.w / 2);
        const sp = Math.hypot(ball.vx, ball.vy);
        ball.vx = rel * sp * 0.85; ball.vy = -Math.sqrt(Math.max(1, sp * sp - ball.vx * ball.vx));
        ctx.audio.play('tap');
      }
      // bricks
      for (const b of bricks) {
        if (!b.alive) continue;
        if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w && ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
          b.hp--; ctx.audio.play(b.hp <= 0 ? 'success' : 'tap');
          Kit.burst(parts, ball.x, ball.y, b.color, b.hp <= 0 ? 14 : 6, 3);
          if (b.hp <= 0) { b.alive = false; score++; ctx.setHUD([{ icon: 'grid', label: score + '/' + total }, { icon: 'heart', label: lives + ' nyawa' }]); }
          const ox = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
          const oy = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
          if (ox < oy) ball.vx *= -1; else ball.vy *= -1;
          break;
        }
      }
      if (score >= total) { over = true; Kit.end(ctx, game, score, true); return; }
      Kit.netBg(c, W, H, game.color, t);
      bricks.forEach(b => {
        if (!b.alive) return;
        Kit.rack(c, b.x, b.y, b.w, b.h, b.color, t);
        if (b.hp > 1) { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; Kit.rr(c, b.x + 1, b.y + 1, b.w - 2, b.h - 2, 6); c.stroke(); }
      });
      // paddle router
      Kit.router(c, paddle.x, paddle.y + paddle.h / 2, paddle.w, paddle.h, game.color, t, 'happy');
      // ball packet
      c.shadowColor = game.color; c.shadowBlur = 14;
      Kit.packet(c, ball.x, ball.y, 9, '#ffffff', t, 'wow');
      c.shadowBlur = 0;
      Kit.parts(c, parts, dt);
    });
  }

  /* ---------------- 6. Gerbang Warna (Color Switch) ---------------- */
  function runColor(ctx, game) {
    const { canvas, c, W, H } = Kit.make(ctx, game);
    const COLORS4 = ['#fb7185', '#facc15', '#22d3ee', '#a78bfa'];
    let ball = { y: H * 0.7, vy: 0, color: 0, r: 13 };
    let rings = [], score = 0, over = false, cam = 0, spawnY = H * 0.3;
    const parts = [];
    const grav = 0.4 * game.speed, flap = -7.4;
    function addRing(y) { rings.push({ y, rot: Math.random() * 6, spin: (Math.random() < 0.5 ? 1 : -1) * (0.02 + Math.random() * 0.02) * game.speed, passed: false, r: 62 }); }
    addRing(H * 0.3); addRing(H * 0.3 - 220); addRing(H * 0.3 - 440);
    spawnY = H * 0.3 - 440;
    function flapFn() { if (!over) { ball.vy = flap; ctx.audio.play('tap'); } }
    Kit.tap(ctx, canvas, W, H, flapFn);
    Kit.keys(ctx, { Space: flapFn, ArrowUp: flapFn });
    ctx.setHUD([{ icon: 'sparkle', label: '0 gerbang' }, { icon: 'target', label: 'Target ' + game.target }]);
    Kit.run(ctx, (dt, t) => {
      if (over) return;
      ball.vy += grav * dt; ball.y += ball.vy * dt;
      rings.forEach(r => r.rot += r.spin * dt);
      const tc = Math.max(0, H * 0.62 - ball.y);
      if (tc > cam) { const d = tc - cam; cam = tc; ball.y += d; rings.forEach(r => r.y += d); spawnY += d; }
      while (spawnY > -80) { spawnY -= 220; addRing(spawnY); }
      rings = rings.filter(r => r.y < H + 100);
      // collision with ring bottom arc
      for (const r of rings) {
        if (r.passed) continue;
        if (Math.abs(ball.y - r.y) < ball.r + 6 && ball.vy < 0) {
          // color at bottom of ring (angle PI/2)
          const a = ((Math.PI / 2 - r.rot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          const idx = Math.floor(a / (Math.PI / 2)) % 4;
          if (idx === ball.color) {
            r.passed = true; score++; ctx.audio.play('success');
            ball.color = (ball.color + 1) % 4;
            Kit.burst(parts, W / 2, r.y, COLORS4[idx], 16, 4);
            ctx.setHUD([{ icon: 'sparkle', label: score + ' gerbang' }, { icon: 'target', label: 'Target ' + game.target }]);
            if (score >= game.target) { over = true; Kit.end(ctx, game, score, true); return; }
          } else {
            over = true; ctx.audio.play('error'); Kit.burst(parts, W / 2, ball.y, '#fb7185', 24, 5); Kit.end(ctx, game, score, false); return;
          }
        }
      }
      if (ball.y > H + 40) { over = true; ctx.audio.play('error'); Kit.end(ctx, game, score, false); return; }
      Kit.netBg(c, W, H, COLORS4[ball.color], t);
      rings.forEach(r => {
        c.save(); c.translate(W / 2, r.y); c.rotate(r.rot);
        c.lineWidth = 13; c.lineCap = 'butt';
        for (let i = 0; i < 4; i++) {
          c.strokeStyle = r.passed ? 'rgba(255,255,255,.15)' : COLORS4[i];
          c.beginPath(); c.arc(0, 0, r.r, i * Math.PI / 2 + 0.04, (i + 1) * Math.PI / 2 - 0.04); c.stroke();
        }
        c.restore();
        c.fillStyle = r.passed ? 'rgba(255,255,255,.2)' : Kit.alpha(COLORS4[ball.color], 0.5); c.beginPath(); c.arc(W / 2, r.y, 3, 0, 7); c.fill();
      });
      // ball packet
      c.shadowColor = COLORS4[ball.color]; c.shadowBlur = 16;
      Kit.packet(c, W / 2, ball.y, ball.r, COLORS4[ball.color], t, 'happy');
      c.shadowBlur = 0;
      Kit.parts(c, parts, dt);
      c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '600 12px system-ui'; c.textAlign = 'center';
      c.fillText('Ketuk untuk melompat — tembus warna yang sama!', W / 2, H - 16);
    });
  }

  /* ---------------- 7. Tuts Piano (Piano Tiles) ---------------- */
  function runPiano(ctx, game) {
    const { canvas, c, W, H } = Kit.make(ctx, game);
    const cols = 4, cw = W / cols;
    let tiles = [], score = 0, over = false, speed = 3.4 * game.speed, spawnT = 0, combo = 0;
    const parts = [], flashes = [0, 0, 0, 0];
    const tileH = 130, hitY = H - 90;
    function spawn() {
      const col = rand(0, cols - 1);
      tiles.push({ col, y: -tileH, h: tileH, hit: false, color: PALETTE[(col + score) % PALETTE.length] });
    }
    spawn();
    function tapCol(col) {
      if (over) return;
      flashes[col] = 1;
      let best = null;
      tiles.forEach(tl => { if (tl.col === col && !tl.hit && tl.y + tl.h > hitY - 60 && tl.y < hitY + 70) { if (!best || tl.y > best.y) best = tl; } });
      if (best) {
        best.hit = true; score++; combo++; ctx.audio.play('success');
        Kit.burst(parts, col * cw + cw / 2, hitY, best.color, 12, 3);
        ctx.setHUD([{ icon: 'keyboard', label: score + ' tuts' }, { icon: 'bolt', label: 'Combo ' + combo }]);
        if (score >= game.target) { over = true; Kit.end(ctx, game, score, true); }
        speed += 0.05;
      } else {
        over = true; combo = 0; ctx.audio.play('error'); Kit.end(ctx, game, score, false);
      }
    }
    Kit.pointer(ctx, canvas, W, H, { down: p => { tapCol(clamp(Math.floor(p.x / cw), 0, cols - 1)); } });
    Kit.keys(ctx, { KeyD: () => tapCol(0), KeyF: () => tapCol(1), KeyJ: () => tapCol(2), KeyK: () => tapCol(3) });
    ctx.setHUD([{ icon: 'keyboard', label: '0 tuts' }, { icon: 'target', label: 'Target ' + game.target }]);
    Kit.run(ctx, (dt, t) => {
      if (!over) { spawnT += dt; const gap = Math.max(34, 70 - score * 0.4); if (spawnT > gap / speed * 3) { spawn(); spawnT = 0; } }
      for (let i = tiles.length - 1; i >= 0; i--) {
        const tl = tiles[i]; tl.y += speed * dt;
        if (!tl.hit && tl.y > H) { over = true; ctx.audio.play('error'); Kit.end(ctx, game, score, false); }
        if (tl.y > H + 20) tiles.splice(i, 1);
      }
      for (let i = 0; i < 4; i++) if (flashes[i] > 0) flashes[i] -= 0.06 * dt;
      Kit.netBg(c, W, H, game.color, t);
      // lanes
      for (let i = 0; i < cols; i++) {
        c.fillStyle = i % 2 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.06)';
        c.fillRect(i * cw, 0, cw, H);
        if (flashes[i] > 0) { c.fillStyle = Kit.alpha(game.color, flashes[i] * 0.3); c.fillRect(i * cw, 0, cw, H); }
        c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1; c.beginPath(); c.moveTo(i * cw, 0); c.lineTo(i * cw, H); c.stroke();
      }
      // hit line
      c.strokeStyle = Kit.alpha(game.color, 0.7); c.lineWidth = 3; c.setLineDash([8, 6]);
      c.beginPath(); c.moveTo(0, hitY); c.lineTo(W, hitY); c.stroke(); c.setLineDash([]);
      tiles.forEach(tl => {
        const x = tl.col * cw + 6;
        const g = c.createLinearGradient(x, tl.y, x, tl.y + tl.h);
        if (tl.hit) { g.addColorStop(0, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,.04)'); }
        else { g.addColorStop(0, Kit.light(tl.color, 0.25)); g.addColorStop(1, tl.color); }
        c.fillStyle = g; Kit.rr(c, x, tl.y, cw - 12, tl.h - 8, 14); c.fill();
        if (!tl.hit) {
          c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1.5; c.stroke();
          const kx = x + (cw - 12) / 2, ky = tl.y + (tl.h - 8) / 2;
          c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.arc(kx, ky, 16, 0, 7); c.fill();
          c.strokeStyle = '#0a0f1f'; c.lineWidth = 2; c.lineCap = 'round';
          const ty = tl.col % 4;
          if (ty === 0) { for (let i = 1; i <= 3; i++) { c.beginPath(); c.arc(kx, ky + 5, i * 4, Math.PI * 1.2, Math.PI * 1.8); c.stroke(); } c.fillStyle = '#0a0f1f'; c.beginPath(); c.arc(kx, ky + 5, 1.6, 0, 7); c.fill(); }
          else if (ty === 1) { Kit.rr(c, kx - 8, ky - 9, 16, 18, 3); c.stroke(); c.beginPath(); c.moveTo(kx - 8, ky - 3); c.lineTo(kx + 8, ky - 3); c.moveTo(kx - 8, ky + 3); c.lineTo(kx + 8, ky + 3); c.stroke(); c.fillStyle = '#0a0f1f'; c.beginPath(); c.arc(kx - 4, ky - 6, 1.4, 0, 7); c.arc(kx - 4, ky, 1.4, 0, 7); c.arc(kx - 4, ky + 6, 1.4, 0, 7); c.fill(); }
          else if (ty === 2) { Kit.rr(c, kx - 9, ky - 2, 18, 9, 3); c.stroke(); c.beginPath(); c.moveTo(kx - 5, ky - 2); c.lineTo(kx - 7, ky - 9); c.moveTo(kx + 5, ky - 2); c.lineTo(kx + 7, ky - 9); c.stroke(); c.fillStyle = '#0a0f1f'; c.beginPath(); c.arc(kx - 4, ky + 2, 1.3, 0, 7); c.arc(kx, ky + 2, 1.3, 0, 7); c.arc(kx + 4, ky + 2, 1.3, 0, 7); c.fill(); }
          else { Kit.rr(c, kx - 6, ky - 8, 12, 12, 2); c.stroke(); c.beginPath(); c.moveTo(kx, ky + 4); c.lineTo(kx, ky + 10); c.stroke(); c.fillStyle = '#0a0f1f'; for (let i = 0; i < 3; i++) c.fillRect(kx - 4 + i * 3, ky - 6, 1.6, 4); }
        }
      });
      Kit.parts(c, parts, dt);
      c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '600 12px system-ui'; c.textAlign = 'center';
      c.fillText('Ketuk kolom saat tuts di garis — D F J K', W / 2, H - 16);
    });
  }

  /* ---------------- 8. Tembak Virus (Space Shooter) ---------------- */
  function runShooter(ctx, game) {
    const { canvas, c, W, H } = Kit.make(ctx, game);
    const held = Kit.held(ctx);
    let ship = { x: W / 2, y: H - 70, w: 40 }, bullets = [], enemies = [], score = 0, lives = 3, over = false, fireT = 0, spawnT = 0, touchX = null, wave = 1;
    const parts = [], stars = [];
    for (let i = 0; i < 40; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, s: 0.5 + Math.random() * 1.5 });
    function spawn() {
      const tough = Math.random() < 0.2 + wave * 0.02;
      enemies.push({ x: rand(30, W - 30), y: -30, r: tough ? 24 : 18, hp: tough ? 3 : 1, vy: (1.1 + Math.random() * 0.8 + wave * 0.12) * game.speed, vx: (Math.random() - 0.5) * 1.2, color: tough ? '#fb7185' : pick(['#a3e635', '#a78bfa', '#fb923c']), wob: Math.random() * 6 });
    }
    function fire() { bullets.push({ x: ship.x, y: ship.y - 24, vy: -9 }); ctx.audio.play('tap'); }
    Kit.pointer(ctx, canvas, W, H, { down: p => { touchX = p.x; }, move: p => { touchX = p.x; }, up: () => { touchX = null; } });
    Kit.keys(ctx, { Space: fire });
    ctx.setHUD([{ icon: 'rocket', label: '0 virus' }, { icon: 'heart', label: '3 nyawa' }, { icon: 'target', label: 'Target ' + game.target }]);
    function hurt() {
      lives--; ctx.audio.play('error');
      ctx.setHUD([{ icon: 'rocket', label: score + ' virus' }, { icon: 'heart', label: lives + ' nyawa' }]);
      if (lives <= 0) { over = true; Kit.end(ctx, game, score, false); }
    }
    Kit.run(ctx, (dt, t) => {
      if (over) return;
      if (held.ArrowLeft || held.KeyA) ship.x -= 7 * dt;
      if (held.ArrowRight || held.KeyD) ship.x += 7 * dt;
      if (touchX != null) ship.x += (touchX - ship.x) * 0.3 * dt;
      ship.x = clamp(ship.x, 24, W - 24);
      fireT += dt; if (fireT > 16) { fire(); fireT = 0; }
      spawnT += dt; if (spawnT > Math.max(20, 55 - wave * 3)) { spawn(); spawnT = 0; }
      wave = 1 + Math.floor(score / 8);
      stars.forEach(s => { s.y += s.s * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } });
      for (let i = bullets.length - 1; i >= 0; i--) { bullets[i].y += bullets[i].vy * dt; if (bullets[i].y < -10) bullets.splice(i, 1); }
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i]; e.y += e.vy * dt; e.wob += 0.05 * dt; e.x += Math.sin(e.wob) * 0.8 * dt + e.vx * dt;
        e.x = clamp(e.x, e.r, W - e.r);
        if (e.y > H + 20) { enemies.splice(i, 1); hurt(); continue; }
        if (Math.hypot(e.x - ship.x, e.y - ship.y) < e.r + 18) { enemies.splice(i, 1); Kit.burst(parts, e.x, e.y, '#fb7185', 18, 4); hurt(); continue; }
        for (let j = bullets.length - 1; j >= 0; j--) {
          if (Math.hypot(e.x - bullets[j].x, e.y - bullets[j].y) < e.r + 4) {
            bullets.splice(j, 1); e.hp--;
            if (e.hp <= 0) { score++; ctx.audio.play('success'); Kit.burst(parts, e.x, e.y, e.color, 16, 4); enemies.splice(i, 1); ctx.setHUD([{ icon: 'rocket', label: score + ' virus' }, { icon: 'heart', label: lives + ' nyawa' }]); if (score >= game.target) { over = true; Kit.end(ctx, game, score, true); } }
            else ctx.audio.play('tap');
            break;
          }
        }
      }
      Kit.netBg(c, W, H, game.color, t);
      c.fillStyle = 'rgba(255,255,255,.6)'; stars.forEach(s => { c.beginPath(); c.arc(s.x, s.y, s.s * 0.7, 0, 7); c.fill(); });
      bullets.forEach(b => { c.fillStyle = '#facc15'; c.shadowColor = '#facc15'; c.shadowBlur = 10; Kit.rr(c, b.x - 4, b.y - 6, 8, 12, 3); c.fill(); c.shadowBlur = 0; c.fillStyle = 'rgba(10,15,31,.5)'; c.fillRect(b.x - 2, b.y - 3, 4, 2); });
      enemies.forEach(e => {
        c.save(); c.translate(e.x, e.y);
        c.fillStyle = e.color;
        for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + e.wob * 0.3; c.beginPath(); c.arc(Math.cos(a) * e.r, Math.sin(a) * e.r, e.r * 0.28, 0, 7); c.fill(); }
        c.beginPath(); c.arc(0, 0, e.r * 0.85, 0, 7); c.fill();
        Kit.face(c, 0, 0, e.r * 0.5, 'sad');
        c.restore();
      });
      // ship router
      c.save(); c.translate(ship.x, ship.y);
      c.fillStyle = Kit.alpha('#facc15', 0.75); c.beginPath(); c.moveTo(-7, 14); c.lineTo(0, 26 + Math.random() * 7); c.lineTo(7, 14); c.closePath(); c.fill();
      c.strokeStyle = game.color; c.lineWidth = 2.6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-12, -6); c.lineTo(-17, -20); c.moveTo(12, -6); c.lineTo(17, -20); c.stroke();
      const blink = Math.sin(t * 0.006) > 0;
      c.fillStyle = blink ? '#facc15' : Kit.alpha('#facc15', 0.4); c.beginPath(); c.arc(-17, -20, 2.6, 0, 7); c.fill();
      c.fillStyle = !blink ? '#facc15' : Kit.alpha('#facc15', 0.4); c.beginPath(); c.arc(17, -20, 2.6, 0, 7); c.fill();
      const g = c.createLinearGradient(0, -14, 0, 14); g.addColorStop(0, Kit.light(game.color, 0.3)); g.addColorStop(1, game.color);
      c.fillStyle = g; Kit.rr(c, -20, -12, 40, 26, 10); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 2; c.stroke();
      for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(10,15,31,.4)'; Kit.rr(c, -14 + i * 8, 6, 5, 4, 1); c.fill(); }
      Kit.face(c, 0, -2, 9, 'happy');
      c.restore();
      Kit.parts(c, parts, dt);
    });
  }

  /* ---------------- Metadata + registrasi ---------------- */
  const GAMES = [
    { id: 'stack', name: 'Menara Server', icon: 'server', color: '#22d3ee', run: runStack, w: 420, h: 640, xpMul: 3, hint: 'Klik / ketuk / SPASI untuk menjatuhkan blok. Sejajarkan setepat mungkin — yang lebih akan terpotong!', roundLabel: 'Target menara', rounds: [10, 15, 20], defaults: 15, tags: ['Arcade', 'Presisi'], desc: 'Tumpuk blok server jadi menara setinggi target. Blok meleset? Terpotong! Pas sempurna dapat combo.' },
    { id: 'knife', name: 'Tancap Konektor', icon: 'cable', color: '#f59e0b', run: runKnife, w: 420, h: 640, xpMul: 2, hint: 'Ketuk untuk menancapkan konektor ke router berputar. Jangan menabrak konektor lain!', roundLabel: 'Target stage', rounds: [3, 5, 7], defaults: 5, tags: ['Arcade', 'Timing'], desc: 'Lempar konektor ke router yang berputar. Hindari konektor yang sudah menancap — tamat setiap stage.' },
    { id: 'doodle', name: 'Lompat Awan', icon: 'cloud', color: '#a3e635', run: runDoodle, w: 420, h: 640, xpMul: 1, hint: 'Geser / tombol ← → untuk mengarahkan. Paket memantul otomatis — panjat setinggi target!', roundLabel: 'Target (meter)', rounds: [150, 300, 500], defaults: 300, tags: ['Arcade', 'Platform'], desc: 'Paket imut memantul dari awan ke awan. Arahkan kiri-kanan, pijak platform, panjat sampai target.' },
    { id: 'slice', name: 'Tebas Kabel', icon: 'crosshair', color: '#fb7185', run: runSlice, w: 420, h: 640, xpMul: 2, hint: 'Sapukan jari / mouse untuk menebas perangkat yang melayang. JANGAN tebas bom merah!', roundLabel: 'Target poin', rounds: [200, 400, 600], defaults: 400, tags: ['Arcade', 'Swipe'], desc: 'Tebas perangkat jaringan yang melayang dengan sapuan. Hindari bom, jangan lewatkan 3 perangkat.' },
    { id: 'breakout', name: 'Pantul Brick', icon: 'grid', color: '#a78bfa', run: runBreakout, w: 420, h: 640, xpMul: 3, hint: 'Geser / ← → untuk menggerakkan router. Pantulkan paket, hancurkan semua brick!', roundLabel: 'Target brick', rounds: [40], defaults: 40, tags: ['Arcade', 'Klasik'], desc: 'Pantulkan paket data dengan router, hancurkan semua brick server. Tiga nyawa, makin lama makin cepat.' },
    { id: 'colorswitch', name: 'Gerbang Warna', icon: 'sparkle', color: '#38bdf8', run: runColor, w: 420, h: 640, xpMul: 3, hint: 'Ketuk / SPASI untuk melompat. Tembus cincin hanya pada warna yang SAMA dengan bolamu!', roundLabel: 'Target gerbang', rounds: [8, 12, 18], defaults: 12, tags: ['Arcade', 'Warna'], desc: 'Lompat melewati cincin warna berputar. Hanya warna yang cocok boleh lewat — salah warna, tamat!' },
    { id: 'piano', name: 'Tuts Piano', icon: 'keyboard', color: '#2dd4bf', run: runPiano, w: 420, h: 640, xpMul: 2, hint: 'Ketuk kolom saat tuts mencapai garis putus-putus. Keyboard: D F J K. Jangan meleset!', roundLabel: 'Target tuts', rounds: [30, 50, 80], defaults: 50, tags: ['Arcade', 'Ritme'], desc: 'Tuts jaringan berjatuhan makin cepat. Ketuk tepat di garis untuk memainkannya — meleset satu saja, tamat.' },
    { id: 'shooter', name: 'Tembak Virus', icon: 'rocket', color: '#fb923c', run: runShooter, w: 420, h: 640, xpMul: 2, hint: 'Geser / ← → untuk bergerak, pesawat menembak otomatis. SPASI untuk tembakan tambahan!', roundLabel: 'Target virus', rounds: [20, 35, 50], defaults: 35, tags: ['Arcade', 'Tembak'], desc: 'Terbangkan router, basmi gelombang virus yang turun. Tiga nyawa — jangan biarkan virus lolos!' }
  ];

  GAMES.forEach((g, i) => {
    g.color = g.color || PALETTE[i % PALETTE.length];
    Neko.games[g.id] = {
      mount(ctx) {
        const target = clamp(Number(ctx.config.rounds) || g.defaults, g.rounds[0], g.rounds[g.rounds.length - 1]);
        const speed = (ctx.difficulty && ctx.difficulty.bonus) || 1;
        const opts = Object.assign({}, g, { target, speed });
        const begin = () => {
          if (ctx.ended) return;
          try {
            g.run(ctx, opts);
          } catch (error) {
            ctx.setStage('<div class="g-panel g-center"><span class="g-center-icon">' + icon('warning') + '</span><h2>Game gagal dimuat</h2><p>' + esc(error.message) + '</p></div>');
          }
        };
        if (typeof ctx.countdown === 'function') ctx.countdown(0, { hint: g.hint }).then(begin);
        else begin();
      }
    };
  });

  Neko.arcadeGames = GAMES;
})();