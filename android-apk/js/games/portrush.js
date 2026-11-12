/* ============================================================
   NEKO · js/games/portrush.js — Serang Port
   Terinspirasi Whack-a-Mole: port muncul di switch, sentuh
   hanya port layanan yang diminta, hindari port palsu.
   ============================================================ */
(function () {
  'use strict';
  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};
  const { clamp } = Neko.util;
  const { icon } = Neko.icons;

  const SERVICES = [
    { port: 80, name: 'HTTP' },
    { port: 443, name: 'HTTPS' },
    { port: 53, name: 'DNS' },
    { port: 22, name: 'SSH' },
    { port: 67, name: 'DHCP' },
    { port: 3389, name: 'RDP' }
  ];

  const FAKE = [21, 23, 25, 110, 135, 139, 445, 1433, 3306, 8080];

  Neko.games.portrush = {
    mount(ctx) {
      const total = clamp(Number(ctx.config.rounds) || 6, 4, 10);
      const bonus = ctx.difficulty.bonus;
      const speed = ctx.difficulty.limit;
      const timers = new Set();
      let round = 0;
      let score = 0;
      let hits = 0;
      let misses = 0;
      let combo = 0;
      let bestCombo = 0;
      let wanted = null;
      let state = 'idle';
      let holes = 9;

      function later(fn, delay) {
        const id = window.setTimeout(() => { timers.delete(id); if (state !== 'over') fn(); }, delay);
        timers.add(id);
        return id;
      }
      ctx.cleanup(() => timers.forEach(id => window.clearTimeout(id)));

      function shell() {
        ctx.setStage(
          '<div class="g-panel g-port">' +
          '<div class="g-title"><div><span class="g-sub">SERAH TERIMA TRAFIK</span><h2>Sentuh hanya port yang diminta</h2></div>' +
          '<span class="g-progress-text" data-port-timer>—</span></div>' +
          '<div class="port-target" data-port-target></div>' +
          '<div class="g-progress"><span data-port-progress style="width:0%"></span></div>' +
          '<div class="port-board" data-port-board>' +
          Array.from({ length: holes }, (_, index) =>
            '<button type="button" class="port-hole" data-hole="' + index + '">' +
            '<span class="port-jack"></span><b class="port-num"></b><small class="port-name"></small></button>'
          ).join('') + '</div>' +
          '<p class="spy-hint" data-port-msg>Port asli menyala, port palsu juga muncul. Salah sentuh memutus koneksi.</p>' +
          '</div>', true
        );
        ctx.frame.querySelector('[data-port-board]').addEventListener('click', event => {
          const hole = event.target.closest('[data-hole]');
          if (hole) pick(Number(hole.dataset.hole));
        });
      }

      function hud() {
        ctx.setHUD([
          { icon: 'bolt', label: 'Ronde ' + clamp(round, 1, total) + '/' + total },
          { icon: 'flame', label: 'Rantai ' + combo, hot: combo >= 3 },
          { icon: 'target', label: score + ' poin' }
        ]);
        const bar = ctx.frame.querySelector('[data-port-progress]');
        if (bar) bar.style.width = (round / total) * 100 + '%';
        const target = ctx.frame.querySelector('[data-port-target]');
        if (target && wanted) {
          target.innerHTML = '<span>Layanan yang dicari</span><b>' + wanted.name + '</b><i>port ' + wanted.port + '</i>';
        }
      }

      function msg(text) {
        const node = ctx.frame.querySelector('[data-port-msg]');
        if (node) node.textContent = text;
      }

      function clearBoard() {
        ctx.frame.querySelectorAll('.port-hole').forEach(node => {
          node.classList.remove('up', 'good', 'bad');
          node.querySelector('.port-num').textContent = '';
          node.querySelector('.port-name').textContent = '';
        });
      }

      function nextRound() {
        if (state === 'over') return;
        round += 1;
        if (round > total) return finish();
        wanted = SERVICES[Math.floor(Math.random() * SERVICES.length)];
        state = 'running';
        clearBoard();
        hud();
        msg('Ronde ' + round + ': cari ' + wanted.name + ' (' + wanted.port + ').');
        const live = clamp(1100 + speed * 45, 900, 2400);
        let popped = 0;
        const totalPops = 3 + Math.min(4, round);
        const realAt = 1 + Math.floor(Math.random() * totalPops);
        (function pop() {
          if (state !== 'running') return;
          if (popped >= totalPops) {
            later(() => {
              if (state === 'running') {
                misses += 1;
                combo = 0;
                msg('Port ' + wanted.port + ' terlewat — koneksi timeout.');
                Neko.audio.play('error');
                hud();
                later(nextRound, 700);
              }
            }, 400);
            return;
          }
          popped += 1;
          const isReal = popped === realAt;
          const hole = Math.floor(Math.random() * holes);
          const node = ctx.frame.querySelector('[data-hole="' + hole + '"]');
          if (!node) { later(pop, 120); return; }
          const port = isReal ? wanted.port : FAKE[Math.floor(Math.random() * FAKE.length)];
          const name = isReal ? wanted.name : (SERVICES.find(s => s.port === port) || { name: 'UNKNOWN' }).name;
          node.classList.add('up');
          node.querySelector('.port-num').textContent = String(port);
          node.querySelector('.port-name').textContent = name;
          node.dataset.port = String(port);
          node.dataset.real = isReal ? '1' : '0';
          later(() => {
            node.classList.remove('up');
            node.dataset.port = '';
            later(pop, 180);
          }, live);
        })();
      }

      function pick(index) {
        if (state !== 'running') return;
        const node = ctx.frame.querySelector('[data-hole="' + index + '"]');
        if (!node || !node.classList.contains('up')) {
          msg('Jangan sentuh port kosong.');
          return;
        }
        const real = node.dataset.real === '1';
        node.classList.remove('up');
        node.classList.add(real ? 'good' : 'bad');
        if (real) {
          hits += 1;
          combo += 1;
          bestCombo = Math.max(bestCombo, combo);
          score += Math.round((40 + combo * 10) * bonus);
          Neko.audio.play('success');
          msg('Tersambung! ' + wanted.name + ' masuk ke ' + node.querySelector('.port-num').textContent + '.');
          state = 'between';
          hud();
          later(nextRound, 700);
        } else {
          misses += 1;
          combo = 0;
          score = Math.max(0, score - 20);
          Neko.audio.play('error');
          msg('Itu port ' + node.dataset.port + ', bukan layanan yang diminta. Trafik tersumbat.');
          state = 'between';
          hud();
          later(nextRound, 700);
        }
      }

      function finish() {
        if (state === 'over') return;
        state = 'over';
        timers.forEach(id => window.clearTimeout(id));
        timers.clear();
        clearBoard();
        const won = hits >= Math.ceil(total * .6);
        const xp = 8 + hits * 6 + bestCombo * 3;
        ctx.finish({
          title: won ? 'Switch aman!' : 'Trafik belum stabil',
          message: won
            ? 'Kamu mengenali port layanan dengan cepat. Hafalkan juga 20 (FTP) dan 25 (SMTP) untuk ronde berikutnya.'
            : 'Cara cepat mengingat: 53 DNS, 67 DHCP, 80 HTTP, 443 HTTPS, 22 SSH, 3389 RDP. Ulangi sampai refleks.',
          won, score, xp,
          stats: [
            { label: 'Port benar', value: String(hits) },
            { label: 'Salah/terlewat', value: String(misses) },
            { label: 'Rantai terbaik', value: String(bestCombo) }
          ]
        });
      }

      (async () => {
        await ctx.countdown(3);
        shell();
        hud();
        later(nextRound, 300);
      })();
    }
  };
})();
