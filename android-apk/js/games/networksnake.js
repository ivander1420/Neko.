/* ============================================================
   NEKO · js/games/networksnake.js
   SNAKE JARINGAN — kendalikan paket data, makan node, hindari
   tabrakan. Berbeda dari kuis: refleks + strategi.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};

  const GRID = 20;
  const CELL = 24;

  Neko.games.networksnake = {
    mount(ctx) {
      let snake = [{ x: 10, y: 10 }];
      let dir = { x: 1, y: 0 };
      let nextDir = { x: 1, y: 0 };
      let food = { x: 5, y: 5 };
      let score = 0;
      let eaten = 0;
      let dead = false;
      let paused = false;
      let timer = null;
      let speed = 140;

      const canvas = document.createElement('canvas');
      canvas.width = GRID * CELL;
      canvas.height = GRID * CELL;
      canvas.className = 'gsn-canvas';
      const board = document.createElement('div');
      board.className = 'gsn-wrap';
      board.appendChild(canvas);

      const hud = document.createElement('div');
      hud.className = 'gsn-hud';
      board.appendChild(hud);

      ctx.setStage('<div class="g-center g-panel">' +
        '<h2>Snake Jaringan</h2>' +
        '<p>Gunakan panah / WASD / geser. Ambil node data, jangan tabrak dinding atau badan sendiri.</p>' +
        '</div>');
      ctx.setStage(board);

      const paint = () => {
        const c = canvas.getContext('2d');
        const style = getComputedStyle(document.documentElement);
        const accent = style.getPropertyValue('--accent').trim() || '#f97316';
        const line = style.getPropertyValue('--line').trim() || '#333';
        const danger = style.getPropertyValue('--danger').trim() || '#ef4444';
        c.fillStyle = style.getPropertyValue('--surface').trim() || '#1a1a2e';
        c.fillRect(0, 0, canvas.width, canvas.height);
        c.strokeStyle = line;
        c.lineWidth = 0.5;
        for (let i = 0; i <= GRID; i++) {
          c.beginPath(); c.moveTo(i * CELL, 0); c.lineTo(i * CELL, canvas.height); c.stroke();
          c.beginPath(); c.moveTo(0, i * CELL); c.lineTo(canvas.width, i * CELL); c.stroke();
        }
        c.fillStyle = accent;
        c.beginPath();
        c.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2.4, 0, Math.PI * 2);
        c.fill();
        snake.forEach((seg, i) => {
          c.fillStyle = i === 0 ? danger : accent;
          c.globalAlpha = i === 0 ? 1 : Math.max(0.35, 1 - i / snake.length);
          c.fillRect(seg.x * CELL + 2, seg.y * CELL + 2, CELL - 4, CELL - 4);
          c.globalAlpha = 1;
        });
        hud.innerHTML = '<b>Skor: ' + score + '</b><span>Node: ' + eaten + '</span>';
      };

      const spawnFood = () => {
        let ok = false;
        while (!ok) {
          food = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
          ok = !snake.some(s => s.x === food.x && s.y === food.y);
        }
      };

      const step = () => {
        if (paused || dead) return;
        dir = nextDir;
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID ||
          snake.some(s => s.x === head.x && s.y === head.y)) {
          dead = true;
          ctx.audio.play('fail');
          finish();
          return;
        }
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
          score += 10;
          eaten += 1;
          if (eaten % 3 === 0 && speed > 60) { speed -= 8; restart(); }
          ctx.audio.play('select');
          spawnFood();
        } else {
          snake.pop();
        }
        paint();
      };

      const restart = () => {
        if (timer) clearInterval(timer);
        timer = setInterval(step, speed);
      };

      const finish = () => {
        clearInterval(timer);
        ctx.finish({
          title: 'Game Over',
          message: 'Skormu: ' + score + ' poin. Node data yang terkumpul: ' + eaten + '.',
          score,
          won: score >= 100,
          xp: Math.round(score / 2),
          stats: [{ label: 'Skor', value: String(score) }, { label: 'Node', value: String(eaten) }]
        });
      };

      const onKey = e => {
        const key = e.key.toLowerCase();
        if (['arrowup', 'w'].includes(key) && dir.y === 0) nextDir = { x: 0, y: -1 };
        else if (['arrowdown', 's'].includes(key) && dir.y === 0) nextDir = { x: 0, y: 1 };
        else if (['arrowleft', 'a'].includes(key) && dir.x === 0) nextDir = { x: -1, y: 0 };
        else if (['arrowright', 'd'].includes(key) && dir.x === 0) nextDir = { x: 1, y: 0 };
        else if (key === ' ') { paused = !paused; }
        else return;
        e.preventDefault();
      };

      document.addEventListener('keydown', onKey);
      ctx.cleanup(() => { document.removeEventListener('keydown', onKey); clearInterval(timer); });

      // touch controls
      let touchStart = null;
      canvas.addEventListener('touchstart', e => { touchStart = e.touches[0]; }, { passive: true });
      canvas.addEventListener('touchend', e => {
        if (!touchStart) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStart.clientX;
        const dy = t.clientY - touchStart.clientY;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0 && dir.x === 0) nextDir = { x: 1, y: 0 };
          else if (dx < 0 && dir.x === 0) nextDir = { x: -1, y: 0 };
        } else {
          if (dy > 0 && dir.y === 0) nextDir = { x: 0, y: 1 };
          else if (dy < 0 && dir.y === 0) nextDir = { x: 0, y: -1 };
        }
        touchStart = null;
      });

      paint();
      restart();
    }
  };
})();
