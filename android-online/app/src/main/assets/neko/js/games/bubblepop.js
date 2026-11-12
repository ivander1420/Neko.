/* ============================================================
   NEKO · js/games/bubblepop.js
   BUBBLE POP — pecah gelembung yang muncul secepat mungkin.
   Murni refleks, bukan kuis.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};

  Neko.games.bubblepop = {
    mount(ctx) {
      let score = 0, missed = 0, spawned = 0, ended = false;
      const TOTAL = 30;
      let area;

      const start = () => {
        area = document.createElement('div');
        area.className = 'gbp-area';
        const hud = document.createElement('div');
        hud.className = 'gbp-hud';
        const wrap = document.createElement('div');
        wrap.className = 'gbp-wrap';
        wrap.appendChild(hud); wrap.appendChild(area);
        ctx.setStage(wrap);
        next();
      };

      const next = () => {
        if (ended) return;
        if (spawned >= TOTAL) {
          ended = true;
          finish();
          return;
        }
        spawned++;
        const bubble = document.createElement('button');
        bubble.type = 'button';
        bubble.className = 'gbp-bubble';
        const size = 40 + Math.random() * 40;
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.left = Math.random() * (area.clientWidth - size) + 'px';
        bubble.style.top = Math.random() * (area.clientHeight - size) + 'px';
        bubble.style.setProperty('--hue', Math.round(Math.random() * 360));
        bubble.innerHTML = '<span></span>';
        area.appendChild(bubble);

        const life = 1100 - Math.min(500, score * 2);
        const timeout = window.setTimeout(() => {
          if (bubble.isConnected) {
            bubble.remove();
            missed++;
            ctx.audio.play('error');
            paintHud();
            next();
          }
        }, life);

        bubble.addEventListener('click', () => {
          window.clearTimeout(timeout);
          bubble.remove();
          score += Math.max(5, Math.round(60 / (size / 40)));
          ctx.audio.play('select');
          if (score % 50 === 0) ctx.confetti();
          paintHud();
          next();
        });
        paintHud();
      };

      const paintHud = () => {
        if (hud) hud.innerHTML = '<b>' + score + ' poin</b><span>' + (TOTAL - spawned) + ' gelembung lagi · ' + missed + ' lolos</span>';
      };

      const finish = () => {
        ctx.finish({
          title: 'Sesi Selesai',
          message: 'Skor ' + score + '. Gelembung lolos: ' + missed + ' dari ' + TOTAL + '.',
          score, won: score >= 300, xp: Math.round(score / 2),
          stats: [{ label: 'Skor', value: String(score) }, { label: 'Lolos', value: String(missed) }]
        });
      };

      ctx.cleanup(() => { ended = true; });
      start();
    }
  };
})();
