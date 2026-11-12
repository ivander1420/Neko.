/* ============================================================
   NEKO · js/fx.js
   Efek interaksi: kursor hidup, ripple tekan, getaran haptic,
   dan pengunci scroll yang aman.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};

  const state = {
    initialized: false,
    dot: null,
    ring: null,
    raf: 0,
    x: -100,
    y: -100,
    ringX: -100,
    ringY: -100,
    targetX: -100,
    targetY: -100,
    lastVibrate: 0
  };

  const INTERACTIVE = 'button, a, [role="button"], .side-link, .dock-btn, .game-card, .theme-card, .car-color, .switch, .chip, .segmented button, label.mode-option, .book-card, .material-card';

  function reduced() {
    return Boolean(Neko.util && Neko.util.reducedMotion && Neko.util.reducedMotion());
  }

  function finePointer() {
    try {
      return window.matchMedia('(pointer: fine)').matches && window.matchMedia('(hover: hover)').matches;
    } catch (error) {
      return false;
    }
  }

  function cursorEnabled() {
    return false;
  }

  /* ---------------- Haptic ---------------- */

  const PATTERNS = {
    soft: [8],
    light: [12],
    medium: [16],
    success: [10, 36, 14],
    win: [12, 26, 12, 26, 22],
    error: [30, 46, 30],
    timer: [24, 40, 24]
  };

  function haptic(kind = 'soft') {
    if (!Neko.store || !Neko.store.prefs.haptics) return;
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    const pattern = PATTERNS[kind] || PATTERNS.soft;
    const now = Date.now();
    if (now - state.lastVibrate < 90) return;
    state.lastVibrate = now;
    try { navigator.vibrate(pattern); } catch (error) { /* perangkat tidak mendukung */ }
  }

  /* ---------------- Kursor ---------------- */

  function ensureCursor() {
    if (state.dot) return;
    state.dot = document.createElement('div');
    state.dot.className = 'fx-cursor-dot';
    state.dot.setAttribute('aria-hidden', 'true');
    state.ring = document.createElement('div');
    state.ring.className = 'fx-cursor-ring';
    state.ring.setAttribute('aria-hidden', 'true');
    document.body.append(state.ring, state.dot);
    state.dot.style.transform = 'translate3d(-100px,-100px,0)';
    state.ring.style.transform = 'translate3d(-100px,-100px,0)';
  }

  function loop() {
    state.ringX += (state.targetX - state.ringX) * .18;
    state.ringY += (state.targetY - state.ringY) * .18;
    if (state.dot) state.dot.style.transform = 'translate3d(' + state.x + 'px,' + state.y + 'px,0) translate(-50%,-50%)';
    if (state.ring) state.ring.style.transform = 'translate3d(' + state.ringX + 'px,' + state.ringY + 'px,0) translate(-50%,-50%)';
    state.raf = window.requestAnimationFrame(loop);
  }

  function startCursor() {
    if (state.raf) return;
    ensureCursor();
    state.raf = window.requestAnimationFrame(loop);
  }

  function stopCursor() {
    if (state.raf) window.cancelAnimationFrame(state.raf);
    state.raf = 0;
    if (state.dot) state.dot.classList.remove('is-visible');
    if (state.ring) state.ring.classList.remove('is-visible', 'is-hot', 'is-down');
  }

  function refreshCursor() {
    const on = cursorEnabled();
    document.documentElement.dataset.fxCursor = on ? 'on' : 'off';
    if (on) startCursor(); else stopCursor();
  }

  function onPointerMove(event) {
    if (event.pointerType === 'touch') return;
    state.x = event.clientX;
    state.y = event.clientY;
    state.targetX = event.clientX;
    state.targetY = event.clientY;
    if (state.dot) state.dot.classList.add('is-visible');
    if (state.ring) {
      state.ring.classList.add('is-visible');
      const hot = event.target.closest ? event.target.closest(INTERACTIVE) : null;
      state.ring.classList.toggle('is-hot', Boolean(hot));
    }
  }

  /* ---------------- Tekan, ripple, suara ---------------- */

  function ripple(target, event) {
    if (!target || reduced()) return;
    const node = target.closest(INTERACTIVE);
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const size = Math.max(rect.width, rect.height) * 1.6;
    const layer = document.createElement('span');
    layer.className = 'fx-ripple';
    layer.style.width = size + 'px';
    layer.style.height = size + 'px';
    layer.style.left = (event.clientX - rect.left - size / 2) + 'px';
    layer.style.top = (event.clientY - rect.top - size / 2) + 'px';
    if (getComputedStyle(node).position === 'static') node.classList.add('fx-ripple-host');
    node.appendChild(layer);
    window.setTimeout(() => layer.remove(), 620);
  }

  function onPointerDown(event) {
    if (event.button !== undefined && event.button > 0) return;
    if (state.ring) state.ring.classList.add('is-down');
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const hits = target.closest(INTERACTIVE);
    if (!hits || hits.matches(':disabled, [aria-disabled="true"], input, textarea, select')) return;
    ripple(target, event);
    haptic('soft');
    if (Neko.audio) Neko.audio.play('tap');
  }

  function onPointerUp() {
    if (state.ring) state.ring.classList.remove('is-down');
  }

  /* ---------------- Scroll aman ---------------- */

  function unlock() {
    const busy = document.querySelector('.game-layer:not(.is-closing), .book-reader:not(.is-closing), .modal-layer');
    if (busy) return;
    if (document.body.style.overflow === 'hidden') document.body.style.overflow = '';
    document.body.classList.remove('is-locked');
  }

  /* ---------------- Reaksi global ---------------- */

  function wireEvents() {
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointerup', onPointerUp, { passive: true });
    document.addEventListener('pointercancel', onPointerUp, { passive: true });

    document.addEventListener('neko:theme', refreshCursor);
    document.addEventListener('neko:profile', unlock);
    document.addEventListener('neko:logout', () => { stopCursor(); unlock(); });
    document.addEventListener('neko:app-start', () => { refreshCursor(); unlock(); });
    document.addEventListener('neko:view', unlock);

    document.addEventListener('neko:game-result', event => {
      const detail = event.detail || {};
      if (detail.won) haptic('win'); else haptic('error');
      if (Neko.mascot && Neko.mascot.react) Neko.mascot.react(detail.won ? 'win' : 'lose', detail);
    });

    document.addEventListener('neko:xp', event => {
      const detail = event.detail || {};
      if (detail.seasonUp) {
        haptic('success');
        if (Neko.mascot && Neko.mascot.react) Neko.mascot.react('cheer', { message: 'Season baru terbuka. Keren!' });
      }
    });

    window.addEventListener('blur', () => {
      if (state.dot) state.dot.classList.remove('is-visible');
      if (state.ring) state.ring.classList.remove('is-visible');
    });
  }

  function init() {
    if (state.initialized) { refreshCursor(); return; }
    state.initialized = true;
    wireEvents();
    refreshCursor();
    unlock();
  }

  Neko.fx = {
    init,
    haptic,
    ripple: (event) => { if (event) ripple(event.target, event); },
    refreshCursor,
    unlock,
    get cursorOn() { return cursorEnabled(); }
  };
})();
