/* ============================================================
   NEKO · js/games/puzzle.js — Puzzle & strategi kreatif (CrazyGames-inspired)
   Enam game dengan mekanik berbeda: ranjau, pipa, sortir bola,
   cocok-tiga, padam lampu, dan gomoku. Tampilan bulat & imut.
   ============================================================ */
(function () {
  'use strict';
  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};
  const { esc, clamp, rand, pick, shuffle } = Neko.util;
  const { icon } = Neko.icons;
  const PAL = ['#fb7185', '#facc15', '#22d3ee', '#a78bfa', '#a3e635', '#fb923c', '#f472b6', '#38bdf8'];

  function stage(ctx, game, html) {
    ctx.setStage('<div class="pz-stage"><div class="pz-card" style="--pz:' + game.color + '">' + html + '</div></div>', true);
    return ctx.frame.querySelector('.pz-card');
  }
  function grid(cols, cls) {
    const g = document.createElement('div');
    g.className = 'pz-grid ' + (cls || '');
    g.style.gridTemplateColumns = 'repeat(' + cols + ',minmax(0,1fr))';
    return g;
  }
  function end(ctx, game, score, won, extra) {
    const xp = Math.max(12, Math.round(score * (game.xpMul || 1) + (won ? 30 : 0)));
    ctx.audio.play(won ? 'win' : 'lose');
    if (won) ctx.confetti(undefined, undefined, 46);
    ctx.finish(Object.assign({
      title: won ? 'Hebat! Selesai!' : 'Belum berhasil',
      message: game.name + (won ? ' — kamu menaklukkannya. Main lagi?' : ' — coba lagi, pasti bisa!'),
      won: !!won, score: Math.max(0, Math.round(score)), xp,
      stats: [{ label: 'Skor', value: Math.round(score) }, { label: 'Target', value: game.target }]
    }, extra || {}));
  }

  /* ---------------- 9. Ranjau Jaringan (Minesweeper) ---------------- */
  function runMines(ctx, game) {
    const N = 9, mines = clamp(game.target, 6, 24);
    const card = stage(ctx, game, '<div class="pz-head"><span class="pz-emoji">' + icon('shield') + '</span><div><b>Ranjau Jaringan</b><small>Buka semua node aman. Klik kanan / mode bendera untuk menandai virus.</small></div><button type="button" class="pz-flagbtn" data-flag>' + icon('flag') + '<span>Mode bendera</span></button></div><div class="pz-board" data-board></div>');
    const board = card.querySelector('[data-board]');
    const g = grid(N, 'pz-mines'); board.appendChild(g);
    let cells = [], started = false, over = false, flagMode = false, revealed = 0, flags = 0;
    for (let i = 0; i < N * N; i++) cells.push({ mine: false, open: false, flag: false, n: 0 });
    const idx = (r, c) => r * N + c;
    const neigh = i => { const r = Math.floor(i / N), c = i % N, out = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < N && nc >= 0 && nc < N) out.push(idx(nr, nc)); } return out; };
    function plant(safe) {
      const banned = new Set([safe, ...neigh(safe)]);
      let placed = 0;
      while (placed < mines) { const i = rand(0, N * N - 1); if (banned.has(i) || cells[i].mine) continue; cells[i].mine = true; placed++; }
      cells.forEach((c, i) => { c.n = neigh(i).filter(j => cells[j].mine).length; });
    }
    const btns = [];
    for (let i = 0; i < N * N; i++) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pz-cell'; b.dataset.i = i;
      b.addEventListener('click', () => flagMode ? toggleFlag(i) : reveal(i));
      b.addEventListener('contextmenu', e => { e.preventDefault(); toggleFlag(i); });
      g.appendChild(b); btns.push(b);
    }
    card.querySelector('[data-flag]').addEventListener('click', e => { flagMode = !flagMode; e.currentTarget.classList.toggle('on', flagMode); ctx.audio.play('select'); });
    function paint(i) {
      const c = cells[i], b = btns[i];
      b.className = 'pz-cell' + (c.open ? ' open' : '') + (c.flag ? ' flag' : '') + (c.open && c.mine ? ' boom' : '');
      b.innerHTML = c.open ? (c.mine ? icon('alien') : (c.n ? '<span class="pz-n n' + c.n + '">' + c.n + '</span>' : '')) : (c.flag ? icon('flag') : '');
      b.disabled = c.open || over;
    }
    function toggleFlag(i) {
      if (over || cells[i].open) return;
      cells[i].flag = !cells[i].flag; flags += cells[i].flag ? 1 : -1;
      ctx.audio.play('tap'); paint(i); hud();
    }
    function reveal(i) {
      if (over || cells[i].open || cells[i].flag) return;
      if (!started) { started = true; plant(i); }
      const c = cells[i]; c.open = true; revealed++;
      if (c.mine) { over = true; cells.forEach((cc, j) => { if (cc.mine) { cc.open = true; paint(j); } }); paint(i); ctx.audio.play('error'); end(ctx, game, revealed, false); return; }
      ctx.audio.play('tap'); paint(i);
      if (c.n === 0) neigh(i).forEach(j => { if (!cells[j].open && !cells[j].flag) reveal(j); });
      hud();
      if (revealed >= N * N - mines) { over = true; btns.forEach((b, j) => b.disabled = true); end(ctx, game, revealed + mines * 5, true); }
    }
    function hud() { ctx.setHUD([{ icon: 'alien', label: (mines - flags) + ' virus' }, { icon: 'grid', label: revealed + '/' + (N * N - mines) }]); }
    cells.forEach((c, i) => paint(i)); hud();
  }

  /* ---------------- 10. Sambung Pipa (Pipe Connect) ---------------- */
  function runPipe(ctx, game) {
    const N = clamp(game.target, 4, 7);
    const card = stage(ctx, game, '<div class="pz-head"><span class="pz-emoji">' + icon('cable') + '</span><div><b>Sambung Pipa</b><small>Putar jalur kabel agar data mengalir dari server sumber (kiri-atas) ke perangkat tujuan (kanan-bawah).</small></div></div><div class="pz-board" data-board></div><p class="pz-note">' + icon('info') + '<span>Klik kabel untuk memutar 90°. Sambungkan jalur fiber dari sumber ke tujuan — jalur aktif akan menyala.</span></p>');
    const board = card.querySelector('[data-board]');
    const g = grid(N, 'pz-pipe'); board.appendChild(g);
    const rot = m => { let x = 0; if (m & 1) x |= 2; if (m & 2) x |= 4; if (m & 4) x |= 8; if (m & 8) x |= 1; return x; };
    const rotN = (m, t) => { for (let i = 0; i < ((t % 4) + 4) % 4; i++) m = rot(m); return m; };
    // monotone random path right/down from (0,0) to (N-1,N-1)
    const path = [[0, 0]]; let r = 0, c = 0;
    while (r < N - 1 || c < N - 1) { if (r === N - 1) c++; else if (c === N - 1) r++; else if (Math.random() < 0.5) c++; else r++; path.push([r, c]); }
    const base = Array(N * N).fill(0), rotation = Array(N * N).fill(0), onPath = new Set();
    const dirBit = (from, to) => { const dr = to[0] - from[0], dc = to[1] - from[1]; if (dr === -1) return 1; if (dc === 1) return 2; if (dr === 1) return 4; return 8; };
    for (let i = 0; i < path.length; i++) {
      const id = path[i][0] * N + path[i][1]; onPath.add(id);
      let m = 0;
      if (i > 0) m |= dirBit(path[i], path[i - 1]);
      if (i < path.length - 1) m |= dirBit(path[i], path[i + 1]);
      base[id] = m;
    }
    for (let i = 0; i < N * N; i++) { if (!base[i]) base[i] = pick([3, 5, 6, 9, 10, 12, 7, 11, 13, 14, 15]); rotation[i] = rand(0, 3); }
    // ensure path not already solved
    const tiles = [];
    function svg(m) {
      let arms = '';
      const ends = { 1: [50, 0], 2: [100, 50], 4: [50, 100], 8: [0, 50] };
      [1, 2, 4, 8].forEach(b => { if (m & b) arms += '<line x1="50" y1="50" x2="' + ends[b][0] + '" y2="' + ends[b][1] + '"/>'; });
      return '<svg viewBox="0 0 100 100" aria-hidden="true"><g class="pz-pipe-arms">' + arms + '</g><g class="pz-pipe-signal">' + arms + '</g><circle cx="50" cy="50" r="15" class="pz-pipe-hub"/><g class="pz-node-face"><circle cx="45" cy="48" r="2"/><circle cx="55" cy="48" r="2"/><path d="M46 54q4 4 8 0"/></g></svg>';
    }
    for (let i = 0; i < N * N; i++) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pz-cell pz-pipecell';
      b.innerHTML = svg(base[i]);
      b.querySelector('svg').style.transform = 'rotate(' + (rotation[i] * 90) + 'deg)';
      b.addEventListener('click', () => { if (solved) return; rotation[i] = (rotation[i] + 1) % 4; b.querySelector('svg').style.transform = 'rotate(' + (rotation[i] * 90) + 'deg)'; ctx.audio.play('tap'); moves++; check(); });
      g.appendChild(b); tiles.push(b);
    }
    // mark source/sink
    tiles[0].classList.add('src'); tiles[N * N - 1].classList.add('sink');
    let solved = false, moves = 0;
    const mask = i => rotN(base[i], rotation[i]);
    function check() {
      const seen = new Set([0]), q = [0];
      const D = [[1, -1, 0, 4], [2, 0, 1, 8], [4, 1, 0, 1], [8, 0, -1, 2]];
      while (q.length) {
        const i = q.shift(), rr = Math.floor(i / N), cc = i % N, m = mask(i);
        for (const [bit, dr, dc, need] of D) {
          if (!(m & bit)) continue;
          const nr = rr + dr, nc = cc + dc; if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
          const j = nr * N + nc; if (seen.has(j) || !(mask(j) & need)) continue;
          seen.add(j); q.push(j);
        }
      }
      tiles.forEach((b, i) => b.classList.toggle('wet', seen.has(i)));
      ctx.setHUD([{ icon: 'refresh', label: moves + ' putaran' }, { icon: 'cable', label: seen.size + ' tersambung' }]);
      if (seen.has(N * N - 1) && !solved) { solved = true; tiles.forEach(b => b.disabled = true); ctx.audio.play('success'); end(ctx, game, Math.max(20, 200 - moves * 3), true, { stats: [{ label: 'Putaran', value: moves }, { label: 'Pipa', value: N * N }] }); }
    }
    check();
  }

  /* ---------------- 11. Sortir Bola (Ball Sort) ---------------- */
  function runSort(ctx, game) {
    const colors = clamp(game.target, 3, 7), CAP = 4, tubes = colors + 2;
    const card = stage(ctx, game, '<div class="pz-head"><span class="pz-emoji">' + icon('dice') + '</span><div><b>Sortir Bola</b><small>Pindahkan paket data hingga tiap rak server berisi satu warna. Klik rak asal lalu rak tujuan.</small></div><button type="button" class="pz-flagbtn" data-reset>' + icon('restart') + '<span>Acak ulang</span></button></div><div class="pz-tubes" data-tubes></div>');
    const wrap = card.querySelector('[data-tubes]');
    let data = [], sel = -1, moves = 0, over = false;
    function deal() {
      const balls = [];
      for (let c = 0; c < colors; c++) for (let k = 0; k < CAP; k++) balls.push(c);
      let guard = 0;
      do {
        const mixed = shuffle(balls);
        data = [];
        for (let t = 0; t < colors; t++) data.push(mixed.slice(t * CAP, t * CAP + CAP));
        for (let t = 0; t < 2; t++) data.push([]);
      } while (done() && guard++ < 24);
      sel = -1; moves = 0; over = false; render(); hud();
    }
    function topColor(t) { return data[t].length ? data[t][data[t].length - 1] : -1; }
    function canPour(a, b) {
      if (a === b || !data[a].length || data[b].length >= CAP) return false;
      return topColor(b) === -1 || topColor(b) === topColor(a);
    }
    function done() { return data.every(t => t.length === 0 || (t.length === CAP && t.every(x => x === t[0]))); }
    function render() {
      wrap.innerHTML = '';
      data.forEach((t, i) => {
        const el = document.createElement('button'); el.type = 'button'; el.className = 'pz-tube' + (i === sel ? ' sel' : '');
        el.style.setProperty('--cap', CAP);
        for (let p = 0; p < CAP; p++) {
          const slot = document.createElement('span'); slot.className = 'pz-slot';
          const a = CAP - 1 - p;
          if (a < t.length) { const color = t[a]; const ball = document.createElement('span'); ball.className = 'pz-ball'; ball.style.background = 'radial-gradient(circle at 32% 28%, ' + PAL[color] + 'ff, ' + PAL[color] + ' 60%, rgba(0,0,0,.25))'; ball.style.backgroundColor = PAL[color]; if (a === t.length - 1 && i === sel) ball.classList.add('lift'); slot.appendChild(ball); }
          el.appendChild(slot);
        }
        el.addEventListener('click', () => click(i));
        wrap.appendChild(el);
      });
    }
    function click(i) {
      if (over) return;
      if (sel === -1) { if (!data[i].length) return; sel = i; ctx.audio.play('select'); render(); return; }
      if (sel === i) { sel = -1; render(); return; }
      if (canPour(sel, i)) {
        const col = topColor(sel);
        while (data[sel].length && topColor(sel) === col && data[i].length < CAP) { data[i].push(data[sel].pop()); }
        moves++; sel = -1; ctx.audio.play('tap'); render(); hud();
        if (done()) { over = true; ctx.audio.play('success'); end(ctx, game, Math.max(30, 300 - moves * 5), true, { stats: [{ label: 'Langkah', value: moves }, { label: 'Warna', value: colors }] }); }
      } else { sel = data[i].length ? i : -1; ctx.audio.play('error'); render(); }
    }
    function hud() { ctx.setHUD([{ icon: 'dice', label: colors + ' warna' }, { icon: 'refresh', label: moves + ' langkah' }]); }
    card.querySelector('[data-reset]').addEventListener('click', () => { deal(); ctx.audio.play('select'); });
    deal();
  }

  /* ---------------- 12. Cocok Tiga (Match-3) ---------------- */
  function runMatch(ctx, game) {
    const N = 7, types = 6;
    const card = stage(ctx, game, '<div class="pz-head"><span class="pz-emoji">' + icon('sparkle') + '</span><div><b>Cocok Tiga</b><small>Tukar dua permata bersebelahan untuk membuat baris 3+. Kejar target skor!</small></div></div><div class="pz-board" data-board></div>');
    const board = card.querySelector('[data-board]');
    const g = grid(N, 'pz-match'); board.appendChild(g);
    let cells = [], sel = -1, score = 0, moves = 22, busy = false, over = false;
    const btns = [];
    function noMatchBoard() {
      cells = [];
      for (let i = 0; i < N * N; i++) {
        let t;
        do { t = rand(0, types - 1); } while ((i % N >= 2 && cells[i - 1] === t && cells[i - 2] === t) || (i >= 2 * N && cells[i - N] === t && cells[i - 2 * N] === t));
        cells.push(t);
      }
    }
    for (let i = 0; i < N * N; i++) { const b = document.createElement('button'); b.type = 'button'; b.className = 'pz-cell pz-gem'; b.addEventListener('click', () => click(i)); g.appendChild(b); btns.push(b); }
    const DEV = ['wifi', 'server', 'router', 'cable', 'globe', 'cloud'];
    function paint() {
      btns.forEach((b, i) => {
        const t = cells[i];
        b.className = 'pz-cell pz-gem' + (i === sel ? ' sel' : '');
        b.style.background = t < 0 ? 'transparent' : 'radial-gradient(circle at 32% 26%, ' + PAL[t] + ', ' + PAL[t] + ' 55%, rgba(0,0,0,.28))';
        b.style.boxShadow = t < 0 ? 'none' : '0 4px 12px -4px ' + PAL[t];
        b.innerHTML = t < 0 ? '' : '<span class="pz-gem-face"></span><span class="pz-gem-ic">' + icon(DEV[t % DEV.length]) + '</span>';
        b.disabled = over;
      });
    }
    function findMatches() {
      const hit = new Set();
      for (let r = 0; r < N; r++) for (let c = 0; c < N - 2; c++) { const i = r * N + c, t = cells[i]; if (t < 0) continue; if (cells[i + 1] === t && cells[i + 2] === t) { let k = i; while (k < N * N && Math.floor(k / N) === r && cells[k] === t) { hit.add(k); k++; } } }
      for (let c = 0; c < N; c++) for (let r = 0; r < N - 2; r++) { const i = r * N + c, t = cells[i]; if (t < 0) continue; if (cells[i + N] === t && cells[i + 2 * N] === t) { let k = i; while (k < N * N && cells[k] === t) { hit.add(k); k += N; } } }
      return hit;
    }
    function resolve() {
      const hit = findMatches();
      if (!hit.size) { busy = false; if (moves <= 0 && !over) { over = true; end(ctx, game, score, score >= game.target); } return; }
      score += hit.size * 10; ctx.audio.play('success');
      hit.forEach(i => { cells[i] = -1; btns[i].classList.add('pop'); });
      hud(); paint();
      window.setTimeout(() => {
        for (let c = 0; c < N; c++) {
          const col = []; for (let r = N - 1; r >= 0; r--) { const t = cells[r * N + c]; if (t >= 0) col.push(t); }
          for (let r = N - 1; r >= 0; r--) { const v = col[N - 1 - r]; cells[r * N + c] = v === undefined ? rand(0, types - 1) : v; }
        }
        paint();
        if (score >= game.target && !over) { over = true; busy = false; end(ctx, game, score, true); return; }
        window.setTimeout(resolve, 220);
      }, 240);
    }
    function adjacent(a, b) { const ar = Math.floor(a / N), ac = a % N, br = Math.floor(b / N), bc = b % N; return Math.abs(ar - br) + Math.abs(ac - bc) === 1; }
    function click(i) {
      if (busy || over) return;
      if (sel === -1) { sel = i; ctx.audio.play('select'); paint(); return; }
      if (sel === i) { sel = -1; paint(); return; }
      if (!adjacent(sel, i)) { sel = i; ctx.audio.play('select'); paint(); return; }
      const a = sel; sel = -1; busy = true; moves--;
      [cells[a], cells[i]] = [cells[i], cells[a]]; paint();
      const hit = findMatches();
      if (!hit.size) { ctx.audio.play('error'); window.setTimeout(() => { [cells[a], cells[i]] = [cells[i], cells[a]]; paint(); busy = false; hud(); if (moves <= 0) { over = true; end(ctx, game, score, score >= game.target); } }, 260); }
      else { ctx.audio.play('tap'); hud(); window.setTimeout(resolve, 180); }
    }
    function hud() { ctx.setHUD([{ icon: 'sparkle', label: score + ' poin' }, { icon: 'refresh', label: moves + ' langkah' }, { icon: 'target', label: 'Target ' + game.target }]); }
    noMatchBoard(); paint(); hud();
  }

  /* ---------------- 13. Padam Lampu (Lights Out) ---------------- */
  function runLights(ctx, game) {
    const N = clamp(game.target, 3, 6);
    const card = stage(ctx, game, '<div class="pz-head"><span class="pz-emoji">' + icon('bolt') + '</span><div><b>Padam Lampu</b><small>Matikan semua LED router. Menekan satu lampu membalik lampu itu + tetangganya.</small></div><button type="button" class="pz-flagbtn" data-reset>' + icon('restart') + '<span>Acak ulang</span></button></div><div class="pz-board" data-board></div>');
    const board = card.querySelector('[data-board]');
    const g = grid(N, 'pz-lights'); board.appendChild(g);
    let on = [], moves = 0, over = false;
    const btns = [];
    function neighbors(i) { const r = Math.floor(i / N), c = i % N, out = [i]; if (r > 0) out.push(i - N); if (r < N - 1) out.push(i + N); if (c > 0) out.push(i - 1); if (c < N - 1) out.push(i + 1); return out; }
    function toggle(i, count) { neighbors(i).forEach(j => on[j] = !on[j]); if (count) { moves++; ctx.audio.play('tap'); } }
    function scramble() {
      on = Array(N * N).fill(false); moves = 0; over = false;
      const clicks = Math.max(4, N + 2);
      const used = new Set();
      for (let k = 0; k < clicks; k++) { let i; do { i = rand(0, N * N - 1); } while (used.has(i)); used.add(i); toggle(i, false); }
      if (on.every(x => !x)) toggle(rand(0, N * N - 1), false);
      paint(); hud();
    }
    function paint() { btns.forEach((b, i) => { b.className = 'pz-cell pz-light' + (on[i] ? ' on' : ''); b.innerHTML = on[i] ? icon('bolt') : ''; b.disabled = over; }); }
    function won() { return on.every(x => !x); }
    for (let i = 0; i < N * N; i++) { const b = document.createElement('button'); b.type = 'button'; b.addEventListener('click', () => { if (over) return; toggle(i, true); paint(); hud(); if (won()) { over = true; paint(); ctx.audio.play('success'); end(ctx, game, Math.max(30, 300 - moves * 6), true, { stats: [{ label: 'Tekanan', value: moves }, { label: 'Lampu', value: N * N }] }); } }); g.appendChild(b); btns.push(b); }
    function hud() { ctx.setHUD([{ icon: 'bolt', label: on.filter(Boolean).length + ' menyala' }, { icon: 'refresh', label: moves + ' tekanan' }]); }
    card.querySelector('[data-reset]').addEventListener('click', () => { scramble(); ctx.audio.play('select'); });
    scramble();
  }

  /* ---------------- 14. Lima Sejajar (Gomoku vs AI) ---------------- */
  function runGomoku(ctx, game) {
    const N = clamp(game.target, 9, 14);
    const card = stage(ctx, game, '<div class="pz-head"><span class="pz-emoji">' + icon('swords') + '</span><div><b>Lima Sejajar</b><small>Kamu ● melawan AI ○. Buat 5 batu berurutan — horizontal, vertikal, atau diagonal.</small></div></div><div class="pz-board" data-board></div>');
    const board = card.querySelector('[data-board]');
    const g = grid(N, 'pz-gomoku'); board.appendChild(g);
    let cells = Array(N * N).fill(0), over = false, turn = 1, moves = 0;
    const btns = [];
    for (let i = 0; i < N * N; i++) { const b = document.createElement('button'); b.type = 'button'; b.className = 'pz-cell pz-stone'; b.addEventListener('click', () => play(i)); g.appendChild(b); btns.push(b); }
    function paint(winLine) {
      btns.forEach((b, i) => {
        b.className = 'pz-cell pz-stone' + (cells[i] === 1 ? ' p1' : cells[i] === 2 ? ' p2' : '') + (winLine && winLine.includes(i) ? ' winl' : '');
        b.innerHTML = cells[i] ? '<span class="pz-stone-dot"></span>' : '';
        b.disabled = over || cells[i] !== 0 || turn !== 1;
      });
    }
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    function lineAt(i, who) {
      const r = Math.floor(i / N), c = i % N;
      for (const [dr, dc] of dirs) {
        const line = [i];
        for (let s = 1; s < 5; s++) { const nr = r + dr * s, nc = c + dc * s; if (nr < 0 || nr >= N || nc < 0 || nc >= N || cells[nr * N + nc] !== who) break; line.push(nr * N + nc); }
        for (let s = 1; s < 5; s++) { const nr = r - dr * s, nc = c - dc * s; if (nr < 0 || nr >= N || nc < 0 || nc >= N || cells[nr * N + nc] !== who) break; line.unshift(nr * N + nc); }
        if (line.length >= 5) return line;
      }
      return null;
    }
    function scoreCell(i, who) {
      const r = Math.floor(i / N), c = i % N; let total = 0;
      for (const [dr, dc] of dirs) {
        let count = 1, open = 0;
        for (const s of [1, -1]) {
          let k = 1;
          while (true) { const nr = r + dr * k * s, nc = c + dc * k * s; if (nr < 0 || nr >= N || nc < 0 || nc >= N) break; const v = cells[nr * N + nc]; if (v === who) { count++; k++; } else { if (v === 0) open++; break; } }
        }
        if (count >= 5) total += 100000;
        else if (count === 4) total += open === 2 ? 12000 : (open === 1 ? 1500 : 0);
        else if (count === 3) total += open === 2 ? 1200 : (open === 1 ? 180 : 0);
        else if (count === 2) total += open === 2 ? 160 : (open === 1 ? 30 : 0);
        else total += open * 8;
      }
      return total;
    }
    function aiMove() {
      let best = -1, bestScore = -1;
      const center = (N - 1) / 2;
      for (let i = 0; i < N * N; i++) {
        if (cells[i]) continue;
        const r = Math.floor(i / N), c = i % N;
        const near = cells.some((v, j) => v && Math.abs(Math.floor(j / N) - r) <= 2 && Math.abs(j % N - c) <= 2);
        if (!near && moves > 0) continue;
        const s = scoreCell(i, 2) * 1.05 + scoreCell(i, 1) + (N - Math.abs(r - center) - Math.abs(c - center)) * 2 + Math.random() * 10;
        if (s > bestScore) { bestScore = s; best = i; }
      }
      if (best < 0) best = cells.findIndex(v => !v);
      return best;
    }
    function finish(who, line) {
      over = true; paint(line);
      if (who === 1) { ctx.audio.play('success'); end(ctx, game, Math.max(40, 400 - moves * 4), true, { stats: [{ label: 'Langkah', value: moves }] }); }
      else { ctx.audio.play('error'); end(ctx, game, moves * 3, false, { stats: [{ label: 'Langkah', value: moves }] }); }
    }
    function play(i) {
      if (over || turn !== 1 || cells[i]) return;
      cells[i] = 1; moves++; ctx.audio.play('tap');
      const w = lineAt(i, 1); paint();
      if (w) return finish(1, w);
      if (cells.every(v => v)) { over = true; return end(ctx, game, moves * 3, false, { title: 'Seri!' }); }
      turn = 2; paint();
      ctx.setHUD([{ icon: 'swords', label: 'AI berpikir…' }, { icon: 'refresh', label: moves + ' langkah' }]);
      window.setTimeout(() => {
        if (over) return;
        const a = aiMove(); if (a < 0) { over = true; return end(ctx, game, moves * 3, false, { title: 'Seri!' }); }
        cells[a] = 2; ctx.audio.play('select');
        const aw = lineAt(a, 2); turn = 1; paint();
        if (aw) return finish(2, aw);
        ctx.setHUD([{ icon: 'swords', label: 'Giliranmu ●' }, { icon: 'refresh', label: moves + ' langkah' }]);
      }, 420);
    }
    ctx.setHUD([{ icon: 'swords', label: 'Giliranmu ●' }, { icon: 'refresh', label: '0 langkah' }]);
    paint();
  }

  /* ---------------- Metadata + registrasi ---------------- */
  const GAMES = [
    { id: 'mines', name: 'Ranjau Jaringan', icon: 'shield', color: '#22d3ee', run: runMines, xpMul: 2, roundLabel: 'Jumlah virus', rounds: [8, 12, 18], defaults: 12, tags: ['Puzzle', 'Logika'], desc: 'Buka semua node aman tanpa menyentuh virus tersembunyi. Angka = jumlah virus di sekitar. Tandai dengan bendera.' },
    { id: 'pipe', name: 'Sambung Pipa', icon: 'cable', color: '#38bdf8', run: runPipe, xpMul: 2, roundLabel: 'Ukuran papan', rounds: [5, 6, 7], defaults: 6, tags: ['Puzzle', 'Jalur'], desc: 'Putar potongan pipa untuk mengalirkan data dari sumber ke tujuan. Klik untuk memutar 90°.' },
    { id: 'sort', name: 'Sortir Bola', icon: 'dice', color: '#a78bfa', run: runSort, xpMul: 2, roundLabel: 'Jumlah warna', rounds: [4, 5, 6], defaults: 5, tags: ['Puzzle', 'Sortir'], desc: 'Tuang bola antar tabung sampai tiap tabung berisi satu warna. Rencanakan langkahmu — dua tabung kosong membantumu.' },
    { id: 'match3', name: 'Cocok Tiga', icon: 'sparkle', color: '#fb7185', run: runMatch, xpMul: 1, roundLabel: 'Target skor', rounds: [600, 1000, 1500], defaults: 1000, tags: ['Puzzle', 'Cocokkan'], desc: 'Tukar permata bersebelahan untuk membuat baris 3 atau lebih. Rantai kombo meledak — kejar target skor sebelum langkah habis.' },
    { id: 'lights', name: 'Padam Lampu', icon: 'bolt', color: '#facc15', run: runLights, xpMul: 2, roundLabel: 'Ukuran papan', rounds: [4, 5, 6], defaults: 5, tags: ['Puzzle', 'Logika'], desc: 'Matikan semua LED router. Menekan satu lampu membalik lampu itu dan tetangganya — temukan pola tepat.' },
    { id: 'gomoku', name: 'Lima Sejajar', icon: 'swords', color: '#a3e635', run: runGomoku, xpMul: 2, roundLabel: 'Ukuran papan', rounds: [10, 12, 14], defaults: 12, tags: ['Strategi', 'vs AI'], desc: 'Adu strategi melawan AI: buat lima batu berurutan sebelum lawan. Serang dan bertahan sekaligus.' }
  ];

  GAMES.forEach(g => {
    Neko.games[g.id] = {
      mount(ctx) {
        const target = clamp(Number(ctx.config.rounds) || g.defaults, g.rounds[0], g.rounds[g.rounds.length - 1]);
        const opts = Object.assign({}, g, { target });
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

  Neko.puzzleGames = GAMES;
})();