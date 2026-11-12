/* ============================================================
   NEKO · js/games/merge.js — Subnet 2048
   Terinspirasi 2048: gabungkan blok subnet sampai prefix
   terbesar. Setiap gabungan melebarkan jaringan.
   ============================================================ */
(function () {
  'use strict';
  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};
  const { clamp } = Neko.util;
  const { icon } = Neko.icons;

  const SIZE = 4;
  // level 1..10 → prefix dan jumlah host
  const LADDER = [
    null,
    { pre: '/30', host: '4 host' },
    { pre: '/29', host: '8 host' },
    { pre: '/28', host: '16 host' },
    { pre: '/27', host: '32 host' },
    { pre: '/26', host: '64 host' },
    { pre: '/25', host: '128 host' },
    { pre: '/24', host: '256 host' },
    { pre: '/23', host: '512 host' },
    { pre: '/22', host: '1.024 host' },
    { pre: '/21', host: '2.048 host' }
  ];

  function label(level) {
    const info = LADDER[level] || LADDER[LADDER.length - 1];
    return '<b>' + info.pre + '</b><small>' + info.host + '</small>';
  }

  Neko.games.merge = {
    mount(ctx) {
      const goal = clamp(Number(ctx.config.rounds) || 8, 5, 10);
      const bonus = ctx.difficulty.bonus;
      let grid = [];
      let score = 0;
      let moves = 0;
      let best = 1;
      let merged = 0;
      let state = 'play';

      function blank() {
        return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
      }

      function empties() {
        const list = [];
        for (let r = 0; r < SIZE; r += 1) {
          for (let c = 0; c < SIZE; c += 1) if (!grid[r][c]) list.push([r, c]);
        }
        return list;
      }

      function spawn() {
        const spots = empties();
        if (!spots.length) return;
        const [r, c] = spots[Math.floor(Math.random() * spots.length)];
        grid[r][c] = Math.random() < .78 ? 1 : 2;
      }

      function slide(row) {
        const items = row.filter(value => value);
        const out = [];
        let gained = 0;
        for (let index = 0; index < items.length; index += 1) {
          if (items[index] && items[index] === items[index + 1]) {
            const level = items[index] + 1;
            out.push(level);
            gained += level * level * 4;
            merged += 1;
            index += 1;
          } else {
            out.push(items[index]);
          }
        }
        while (out.length < SIZE) out.push(0);
        score += Math.round(gained * bonus);
        return out;
      }

      function transpose(rows) {
        return rows[0].map((_, index) => rows.map(row => row[index]));
      }

      function rotateRight(rows) {
        return transpose(rows).map(row => row.slice().reverse());
      }

      function canMove() {
        for (let r = 0; r < SIZE; r += 1) {
          for (let c = 0; c < SIZE; c += 1) {
            if (!grid[r][c]) return true;
            if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true;
            if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true;
          }
        }
        return false;
      }

      function move(direction) {
        if (state !== 'play') return;
        const turns = { left: 0, up: 1, right: 2, down: 3 }[direction];
        if (turns === undefined) return;
        let work = grid.map(row => row.slice());
        for (let index = 0; index < turns; index += 1) work = rotateRight(work);
        const moved = work.map(slide);
        for (let index = 0; index < (4 - turns) % 4; index += 1) moved.push(moved.shift());
        const before = JSON.stringify(grid);
        grid = moved.map(row => row.slice());
        if (JSON.stringify(grid) === before) {
          if (canMove()) {
            ctx.frame.querySelector('[data-merge-msg]').textContent = 'Arah itu buntu, coba arah lain.';
          }
          return;
        }
        moves += 1;
        spawn();
        for (const row of grid) for (const value of row) best = Math.max(best, value);
        paint();
        Neko.audio.play('tick');
        if (best >= goal) return finish(true);
        if (!canMove()) finish(false);
      }

      function paint() {
        const board = ctx.frame.querySelector('[data-merge-board]');
        if (!board) return;
        board.innerHTML = grid.flatMap((row, r) => row.map((value, c) =>
          '<div class="merge-tile' + (value ? ' lv' + Math.min(value, 10) : ' empty') + '" data-r="' + r + '" data-c="' + c + '">' +
          (value ? label(value) : '') + '</div>'
        )).join('');
        ctx.setHUD([
          { icon: 'grid', label: moves + ' langkah' },
          { icon: 'layers', label: 'Besar ' + (LADDER[best] || LADDER[10]).pre, hot: best >= goal - 1 },
          { icon: 'target', label: score + ' poin' }
        ]);
        const bar = ctx.frame.querySelector('[data-merge-progress]');
        if (bar) bar.style.width = clamp(((best - 1) / (goal - 1)) * 100, 0, 100) + '%';
        const note = ctx.frame.querySelector('[data-merge-note]');
        if (note) note.textContent = 'target ' + (LADDER[goal] || LADDER[10]).pre;
      }

      function shell() {
        ctx.setStage(
          '<div class="g-panel g-merge">' +
          '<div class="g-title"><div><span class="g-sub">GABUNGKAN SUBNET</span><h2>Satukan prefix sama sampai ' + (LADDER[goal] || LADDER[10]).pre + '</h2></div>' +
          '<span class="g-progress-text" data-merge-note>target</span></div>' +
          '<div class="g-progress"><span data-merge-progress style="width:0%"></span></div>' +
          '<div class="merge-board" data-merge-board></div>' +
          '<div class="merge-keys">' +
          '<button type="button" class="btn btn-soft btn-sm" data-dir="left">' + icon('arrow-left') + '</button>' +
          '<button type="button" class="btn btn-soft btn-sm" data-dir="up">' + icon('arrow-up') + '</button>' +
          '<button type="button" class="btn btn-soft btn-sm" data-dir="down">' + icon('arrow-down') + '</button>' +
          '<button type="button" class="btn btn-soft btn-sm" data-dir="right">' + icon('arrow-right') + '</button>' +
          '</div>' +
          '<p class="spy-hint" data-merge-msg>Geser papan (atau tombol panah). Dua blok dengan prefix sama melebur jadi satu jaringan yang lebih lebar.</p>' +
          '</div>', true
        );
        ctx.frame.querySelector('[data-merge-keys]').addEventListener('click', event => {
          const button = event.target.closest('[data-dir]');
          if (button) move(button.dataset.dir);
        });
        ctx.frame.addEventListener('keydown', event => {
          const map = { ArrowLeft: 'left', ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down' };
          if (map[event.key]) {
            event.preventDefault();
            move(map[event.key]);
          }
        });
        const board = ctx.frame.querySelector('[data-merge-board]');
        let touchStart = null;
        board.addEventListener('touchstart', event => {
          touchStart = [event.changedTouches[0].clientX, event.changedTouches[0].clientY];
        }, { passive: true });
        board.addEventListener('touchend', event => {
          if (!touchStart) return;
          const dx = event.changedTouches[0].clientX - touchStart[0];
          const dy = event.changedTouches[0].clientY - touchStart[1];
          touchStart = null;
          if (Math.abs(dx) < 26 && Math.abs(dy) < 26) return;
          move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        }, { passive: true });
      }

      function finish(won) {
        if (state !== 'play') return;
        state = 'over';
        const xp = 6 + Math.round(score / 40) + best * 4 + merged * 2;
        ctx.finish({
          title: won ? 'Jaringan melebar!' : 'Papan penuh',
          message: won
            ? 'Kamu mencapai ' + (LADDER[best] || LADDER[10]).pre + '. Ingat polanya: /30 + /30 = /29, /29 + /29 = /28, dst.'
            : 'Prefix terbesar ' + (LADDER[best] || LADDER[10]).pre + '. Simpan blok terbesar di satu sudut supaya tidak tercampur.',
          won, score, xp,
          stats: [
            { label: 'Prefix terbesar', value: (LADDER[best] || LADDER[10]).pre },
            { label: 'GABUNGAN', value: String(merged) },
            { label: 'Langkah', value: String(moves) }
          ]
        });
      }

      function keydown(event) {
        const map = { ArrowLeft: 'left', ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
        const dir = map[event.key];
        if (dir && !ctx.ended) {
          event.preventDefault();
          move(dir);
        }
      }
      document.addEventListener('keydown', keydown);
      ctx.cleanup(() => document.removeEventListener('keydown', keydown));

      (async () => {
        await ctx.countdown(3);
        grid = blank();
        spawn();
        spawn();
        shell();
        paint();
        const board = ctx.frame.querySelector('[data-merge-board]');
        if (board) board.tabIndex = 0;
      })();
    }
  };
})();
