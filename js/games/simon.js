/* ============================================================
   NEKO · js/games/simon.js — Simon Router
   Terinspirasi "Simon Says": ingat urutan port yang menyala.
   ============================================================ */
(function () {
  'use strict';
  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};
  const { clamp } = Neko.util;
  const { icon } = Neko.icons;

  const PORTS = [
    { label: 'Fa0/1', tone: 'var(--accent)' },
    { label: 'Fa0/2', tone: 'var(--accent-2)' },
    { label: 'Fa0/3', tone: 'var(--accent-3)' },
    { label: 'Fa0/4', tone: 'var(--success)' }
  ];

  Neko.games.simon = {
    mount(ctx) {
      const target = clamp(Number(ctx.config.rounds) || 5, 3, 9);
      const bonus = ctx.difficulty.bonus;
      const timers = new Set();
      let seq = [];
      let step = 0;
      let score = 0;
      let round = 0;
      let level = 0;
      let state = 'idle';
      let fails = 0;

      function later(fn, delay) {
        const id = window.setTimeout(() => { timers.delete(id); if (state !== 'over') fn(); }, delay);
        timers.add(id);
        return id;
      }
      ctx.cleanup(() => timers.forEach(id => window.clearTimeout(id)));

      function shell() {
        ctx.setStage(
          '<div class="g-panel g-simon">' +
          '<div class="g-title"><div><span class="g-sub">INGAT URUTAN PORT</span><h2>Ikuti lampu port sampai ronde ' + target + '</h2></div>' +
          '<span class="g-progress-text" data-simon-note>Menyimak…</span></div>' +
          '<div class="g-progress"><span data-simon-progress style="width:0%"></span></div>' +
          '<div class="simon-board" data-simon-board>' +
          PORTS.map((port, index) =>
            '<button type="button" class="simon-pad" data-pad="' + index + '" style="--sp:' + port.tone + '">' +
            '<span class="simon-led"></span><b>' + port.label + '</b></button>'
          ).join('') + '</div>' +
          '<p class="spy-hint" data-simon-msg>Port menyala berurutan. Setelah itu, ulangi urutan yang sama.</p>' +
          '</div>', true
        );
        ctx.frame.querySelector('[data-simon-board]').addEventListener('click', event => {
          const pad = event.target.closest('[data-pad]');
          if (pad) tap(Number(pad.dataset.pad));
        });
      }

      function flash(index, ms) {
        return new Promise(resolve => {
          const pad = ctx.frame.querySelector('[data-pad="' + index + '"]');
          if (!pad) return resolve();
          pad.classList.add('lit');
          Neko.audio.play('tick');
          window.setTimeout(() => {
            pad.classList.remove('lit');
            window.setTimeout(resolve, Math.max(70, ms * .4));
          }, ms);
        });
      }

      function hud() {
        ctx.setHUD([
          { icon: 'layers', label: 'Ronde ' + clamp(round, 1, target) + '/' + target },
          { icon: 'key', label: 'Urutan ' + level, hot: level >= 6 },
          { icon: 'target', label: score + ' poin' }
        ]);
        const bar = ctx.frame.querySelector('[data-simon-progress]');
        if (bar) bar.style.width = (round / target) * 100 + '%';
        const note = ctx.frame.querySelector('[data-simon-note]');
        if (note) note.textContent = state === 'watch' ? 'Menyimak…' : state === 'repeat' ? 'Giliranmu' : state === 'over' ? 'Selesai' : 'Siap';
      }

      function msg(text) {
        const node = ctx.frame.querySelector('[data-simon-msg]');
        if (node) node.textContent = text;
      }

      function nextRound() {
        if (state === 'over') return;
        round += 1;
        if (round > target) return finish();
        level = 2 + round;
        seq = Array.from({ length: level }, () => Math.floor(Math.random() * PORTS.length));
        step = 0;
        state = 'watch';
        hud();
        msg('Hafalkan: ' + level + ' port berurutan.');
        const gap = clamp(620 - round * 40, 260, 620) / (ctx.difficulty.limit / 18);
        (async () => {
          await new Promise(resolve => later(resolve, 650));
          for (const index of seq) {
            if (state !== 'watch') return;
            await flash(index, gap);
          }
          if (state !== 'watch') return;
          state = 'repeat';
          hud();
          msg('Sekarang ulangi dari port pertama.');
        })();
      }

      function tap(index) {
        if (state !== 'repeat') {
          if (state === 'watch') msg('Tunggu sampai lampu selesai menyala.');
          return;
        }
        flash(index, 180);
        if (index === seq[step]) {
          step += 1;
          score += Math.round((10 + step * 4) * bonus);
          hud();
          if (step >= seq.length) {
            state = 'clear';
            msg('Betul! Urutan ' + seq.length + ' port tersambung.');
            Neko.audio.play('success');
            score += 20;
            hud();
            later(nextRound, 900);
          }
          return;
        }
        fails += 1;
        state = 'miss';
        score = Math.max(0, score - 15);
        msg('Salah port. Urutan putus — coba lagi dari awal ronde ini.');
        Neko.audio.play('error');
        hud();
        later(() => {
          step = 0;
          state = 'watch';
          (async () => {
            for (const each of seq) {
              if (state !== 'watch') return;
              await flash(each, 320);
            }
            if (state !== 'watch') return;
            state = 'repeat';
            hud();
            msg('Coba sekali lagi.');
          })();
        }, 900);
      }

      function finish() {
        if (state === 'over') return;
        state = 'over';
        timers.forEach(id => window.clearTimeout(id));
        timers.clear();
        const won = round >= target && fails <= 1;
        const xp = 8 + Math.max(0, round - 1) * 6 + (won ? 12 : 0);
        ctx.finish({
          title: won ? 'Router tersinkron!' : 'Ingatan port ' + round,
          message: won
            ? 'Semua urutan port kamu ulangi dengan benar. Naikkan ronde untuk urutan yang lebih panjang.'
            : 'Pecah urutan jadi kelompok kecil: ingat 3 port dulu, lalu 3 lagi. Lebih mudah daripada menghafal sekaligus.',
          won, score, xp,
          stats: [
            { label: 'Ronde selesai', value: String(Math.max(0, round - 1)) },
            { label: 'Urutan terjauh', value: String(Math.max(0, level - 1)) },
            { label: 'Salah tekan', value: String(fails) }
          ]
        });
      }

      function keydown(event) {
        const map = { 1: 0, 2: 1, 3: 2, 4: 3 };
        if (map[event.key] !== undefined) {
          event.preventDefault();
          tap(map[event.key]);
        }
      }
      document.addEventListener('keydown', keydown);
      ctx.cleanup(() => document.removeEventListener('keydown', keydown));

      (async () => {
        await ctx.countdown(3);
        shell();
        hud();
        later(nextRound, 200);
      })();
    }
  };
})();
