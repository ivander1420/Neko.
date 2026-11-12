/* ============================================================
   NEKO · js/games/blockdrop.js
   BLOK JATUH — susun balok ala tetris, bersihkan baris. Bukan
   kuis: murni logika dan refleks.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};

  const COLS = 10, ROWS = 20;
  const SHAPES = [
    { id: 'I', cells: [[1, 0], [1, 1], [1, 2], [1, 3]], w: 4, color: '#22d3ee' },
    { id: 'O', cells: [[0, 0], [0, 1], [1, 0], [1, 1]], w: 2, color: '#eab308' },
    { id: 'T', cells: [[0, 0], [0, 1], [0, 2], [1, 1]], w: 3, color: '#a855f7' },
    { id: 'S', cells: [[0, 1], [0, 2], [1, 0], [1, 1]], w: 3, color: '#22c55e' },
    { id: 'Z', cells: [[0, 0], [0, 1], [1, 1], [1, 2]], w: 3, color: '#ef4444' },
    { id: 'J', cells: [[0, 0], [1, 0], [1, 1], [1, 2]], w: 3, color: '#3b82f6' },
    { id: 'L', cells: [[0, 2], [1, 0], [1, 1], [1, 2]], w: 3, color: '#f97316' }
  ];

  Neko.games.blockdrop = {
    mount(ctx) {
      let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
      let cur = null, curX = 3, curY = 0;
      let score = 0, lines = 0, dead = false;
      let timer = null, speed = 700;
      let canvas, hud;

      const buildBoard = () => {
        canvas = document.createElement('canvas');
        canvas.width = COLS * 26; canvas.height = ROWS * 26;
        canvas.className = 'gbd-canvas';
        hud = document.createElement('div');
        hud.className = 'gbd-hud';
        const wrap = document.createElement('div');
        wrap.className = 'gbd-wrap';
        wrap.appendChild(canvas); wrap.appendChild(hud);
        ctx.setStage(wrap);
      };

      const spawn = () => {
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        cur = shape;
        curX = Math.floor((COLS - shape.w) / 2);
        curY = 0;
        if (collides(curX, curY)) { dead = true; finish(); }
      };

      const collides = (x, y) => {
        for (const cell of cur.cells) {
          const nx = x + cell[0], ny = y + cell[1];
          if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && grid[ny][nx])) return true;
        }
        return false;
      };

      const lockPiece = () => {
        for (const cell of cur.cells) {
          const ny = curY + cell[1], nx = curX + cell[0];
          if (ny >= 0) grid[ny][nx] = cur.color;
        }
        let cleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (grid[r].every(c => c)) {
            grid.splice(r, 1);
            grid.unshift(Array(COLS).fill(null));
            cleared++; r++;
          }
        }
        if (cleared) {
          score += cleared * 100;
          lines += cleared;
          ctx.audio.play('success');
          if (lines % 4 === 0 && speed > 250) { speed -= 50; restartTimer(); }
        } else ctx.audio.play('tap');
        spawn();
      };

      const drop = () => {
        if (dead) return;
        if (!collides(curX, curY + 1)) curY++;
        else lockPiece();
        paint();
      };

      const paint = () => {
        const c = canvas.getContext('2d');
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#111';
        c.fillStyle = bg;
        c.fillRect(0, 0, canvas.width, canvas.height);
        for (let r = 0; r < ROWS; r++) {
          for (let col = 0; col < COLS; col++) {
            if (grid[r][col]) {
              c.fillStyle = grid[r][col];
              c.fillRect(col * 26 + 1, r * 26 + 1, 24, 24);
            }
          }
        }
        if (cur) {
          c.fillStyle = cur.color;
          for (const cell of cur.cells) {
            c.fillRect((curX + cell[0]) * 26 + 1, (curY + cell[1]) * 26 + 1, 24, 24);
          }
        }
        hud.innerHTML = '<b>' + score + ' poin</b><span>' + lines + ' baris</span>';
      };

      const restartTimer = () => {
        if (timer) clearInterval(timer);
        timer = setInterval(drop, speed);
      };

      const finish = () => {
        clearInterval(timer);
        ctx.finish({
          title: 'Papan Penuh',
          message: 'Skor ' + score + '. Baris dibersihkan: ' + lines + '.',
          score, won: score >= 500, xp: Math.round(score / 3),
          stats: [{ label: 'Skor', value: String(score) }, { label: 'Baris', value: String(lines) }]
        });
      };

      const onKey = e => {
        if (dead) return;
        const k = e.key.toLowerCase();
        if (k === 'arrowleft' && !collides(curX - 1, curY)) { curX--; paint(); }
        else if (k === 'arrowright' && !collides(curX + 1, curY)) { curX++; paint(); }
        else if (k === 'arrowdown') { drop(); }
        else if (k === 'arrowup') {
          // rotasi sederhana: transpose + reverse
          const rotated = cur.cells.map(([r, c]) => [c, cur.w - 1 - r]);
          const old = cur;
          const oldX = curX;
          cur = { ...cur, cells: rotated, w: cur.cells.length };
          if (collides(curX, curY)) { cur = old; curX = oldX; }
          paint();
        } else return;
        e.preventDefault();
      };

      document.addEventListener('keydown', onKey);
      ctx.cleanup(() => { document.removeEventListener('keydown', onKey); clearInterval(timer); });

      buildBoard();
      spawn();
      paint();
      restartTimer();
    }
  };
})();
