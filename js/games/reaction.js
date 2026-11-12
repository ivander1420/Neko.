/* ============================================================
   NEKO · games/reaction.js — Refleks Neko
   ============================================================ */
(function () {
  'use strict';
  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};
  const { esc, clamp } = Neko.util;
  const { icon } = Neko.icons;

  Neko.games.reaction = {
    mount(ctx) {
      const total = clamp(Number(ctx.config.rounds) || 5, 3, 10);
      const bonus = ctx.difficulty.bonus;
      const times = [];
      const timers = new Set();
      let round = 0;
      let score = 0;
      let best = Infinity;
      let falseStarts = 0;
      let state = 'idle';
      let goAt = 0;
      let started = false;

      function later(fn, delay) {
        const id = window.setTimeout(() => {
          timers.delete(id);
          if (state !== 'over') fn();
        }, delay);
        timers.add(id);
        return id;
      }

      ctx.cleanup(() => timers.forEach(id => window.clearTimeout(id)));

      function hud() {
        const average = times.length ? Math.round(times.reduce((sum, value) => sum + value, 0) / times.length) : 0;
        ctx.setHUD([
          { icon: 'bolt', label: 'Ronde ' + Math.min(round, total) + '/' + total },
          { icon: 'timer', label: best === Infinity ? '— ms' : best + ' ms', hot: best !== Infinity && best < 260 },
          { icon: 'target', label: score + ' poin' }
        ]);
        const status = ctx.frame.querySelector('[data-reaction-summary]');
        if (status) status.innerHTML = times.length
          ? '<span class="best">Terbaik ' + best + ' ms</span><span>Rata-rata ' + average + ' ms</span>' + (falseStarts ? '<span style="color:var(--danger)">' + falseStarts + ' salah mulai</span>' : '')
          : '<span>Rata-rata —</span>';
      }

      function shell() {
        ctx.setStage(
          '<div class="g-panel">' +
          '<div class="g-title"><div><span class="g-sub">UJI REFLEKS</span><h2>Sentuh saat sinyal berubah hijau</h2></div><span class="g-progress-text" data-best-label>—</span></div>' +
          '<div class="g-progress"><span data-reaction-progress style="width:0%"></span></div>' +
          '<div class="reaction-stage">' +
          '<button type="button" class="reaction-pad wait" data-pad><strong>Tunggu…</strong><small>Jangan sentuh dulu</small></button>' +
          '<div class="reaction-times" data-reaction-summary><span>Rata-rata —</span></div>' +
          '<p class="spy-hint" data-reaction-message>Fokus pada tombol. Sentuhan sebelum hijau dihitung salah mulai.</p>' +
          '</div>' +
          '</div>'
        );
        ctx.frame.querySelector('[data-pad]').addEventListener('click', onPad);
        hud();
      }

      function setPad(mode, title, sub) {
        const pad = ctx.frame.querySelector('[data-pad]');
        if (!pad) return;
        pad.className = 'reaction-pad ' + mode;
        pad.innerHTML = '<strong>' + esc(title) + '</strong><small>' + esc(sub) + '</small>';
      }

      function message(text) {
        const node = ctx.frame.querySelector('[data-reaction-message]');
        if (node) node.textContent = text;
      }

      function armRound() {
        if (round >= total) return finish();
        state = 'waiting';
        const delay = 900 + Math.random() * 1900;
        setPad('wait', 'Tunggu…', 'Ronde ' + (round + 1) + ' dari ' + total);
        message('Jangan sentuh sebelum tombol berubah hijau.');
        ctx.frame.querySelector('[data-pad]').disabled = false;
        later(() => {
          if (state !== 'waiting') return;
          state = 'go';
          goAt = performance.now();
          setPad('go', 'KLIK!', 'Sekarang!');
          Neko.audio.play('go');
        }, delay);
      }

      function onPad() {
        if (state === 'waiting') {
          falseStarts += 1;
          state = 'false';
          score = Math.max(0, score - 20);
          setPad('false-start', 'Terlalu cepat!', 'Tunggu sinyal hijau');
          message('Sabar sedikit. Sentuhan sebelum sinyal hijau tidak dihitung.');
          Neko.audio.play('error');
          hud();
          later(armRound, 1200);
          return;
        }
        if (state !== 'go') return;
        state = 'result';
        const elapsed = Math.max(1, Math.round(performance.now() - goAt));
        times.push(elapsed);
        best = Math.min(best, elapsed);
        const points = Math.round(clamp(900 - elapsed * .55, 20, 600) * bonus);
        score += points;
        round += 1;
        Neko.audio.play(elapsed < 260 ? 'success' : 'tick');
        setPad('go', elapsed + ' ms', '+' + points + ' poin');
        message(elapsed < 240 ? 'Kilat! Refleksmu luar biasa.' : elapsed < 360 ? 'Cepat sekali, pertahankan.' : 'Masih bisa lebih cepat. Fokus ke tombol.');
        const progress = ctx.frame.querySelector('[data-reaction-progress]');
        if (progress) progress.style.width = (round / total) * 100 + '%';
        const bestLabel = ctx.frame.querySelector('[data-best-label]');
        if (bestLabel) bestLabel.textContent = 'terbaik ' + best + ' ms';
        hud();
        if (round >= total) later(finish, 850);
        else later(armRound, 900);
      }

      function finish() {
        if (state === 'over') return;
        state = 'over';
        timers.forEach(id => window.clearTimeout(id));
        timers.clear();
        const average = times.length ? Math.round(times.reduce((sum, value) => sum + value, 0) / times.length) : 999;
        const won = average <= 420;
        const xp = 10 + Math.max(0, Math.round((700 - average) / 14)) + times.length * 2;
        ctx.finish({
          title: average <= 260 ? 'Refleks kilat!' : won ? 'Tanganmu cepat' : 'Latih fokus lagi',
          message: average <= 260 ? 'Waktu reaksimu luar biasa cepat. Neko pun kewalahan.' : won ? 'Reaksi di atas rata-rata. Coba tingkat Tantangan untuk ujian berikutnya.' : 'Kurangi distraksi dan arahkan pandangan tepat ke tombol. Ulangi untuk hasil lebih baik.',
          won, score, xp,
          stats: [
            { label: 'Poin', value: String(score) },
            { label: 'Terbaik', value: best === Infinity ? '—' : best + ' ms' },
            { label: 'Rata-rata', value: times.length ? average + ' ms' : '—' }
          ]
        });
      }

      function keydown(event) {
        if (event.key === ' ' || event.key === 'Enter') {
          const pad = ctx.frame.querySelector('[data-pad]');
          if (pad && state !== 'over') {
            event.preventDefault();
            pad.click();
          }
        }
      }
      document.addEventListener('keydown', keydown);
      ctx.cleanup(() => document.removeEventListener('keydown', keydown));

      (async () => {
        await ctx.countdown(3);
        started = true;
        shell();
        later(armRound, 500);
      })();
    }
  };
})();
