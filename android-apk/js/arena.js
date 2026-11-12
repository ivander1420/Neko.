/* ============================================================
   NEKO · js/arena.js
   Arena game: pilih game, atur sesi, lalu mainkan delapan game
   TJKT dalam lapisan layar penuh dengan tombol keluar.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { esc, clamp, formatNumber, wait, tone } = Neko.util;
  const { icon } = Neko.icons;
  const overlayRoot = document.getElementById('overlayRoot');

  const catalog = [
    {
      id: 'quiz', name: 'Kuis Kilat', icon: 'brain', color: tone(0),
      desc: 'Jawab soal TJKT pilihan ganda sebelum waktu habis. Setiap jawaban benar menambah skor dan XP.',
      tags: ['TJKT', 'Pilihan ganda'], players: 1, roundLabel: 'Jumlah soal', rounds: [5, 8, 12], defaults: 8
    },
    {
      id: 'spy', name: 'Who Is The Spy', icon: 'spy', color: tone(1),
      desc: 'Satu pemain mendapat kata berbeda. Beri petunjuk, diskusikan, lalu temukan penyusupnya.',
      tags: ['Sosial', '3–8 pemain'], players: 8, minPlayers: 3, roundLabel: 'Putaran', rounds: [1, 2, 3], defaults: 1
    },
    {
      id: 'spy-v2', name: 'Who Is The Spy 2.0', icon: 'voice', color: tone(1),
      desc: 'Mode baru dengan input suara/chat bergiliran. Lebih seru dan interaktif!',
      tags: ['Mabar', 'Sosial', 'Suara', '3-8 pemain'], players: 8, minPlayers: 3, roundLabel: 'Putaran', rounds: [1, 2, 3], defaults: 1, mabarOnly: true
    },
    {
      id: 'cable', name: 'Lab Kabel', icon: 'cable', color: tone(2),
      desc: 'Pasangkan kabel, konektor, dan fungsinya ke slot yang tepat. Cocok untuk hafalan praktik.',
      tags: ['Praktik', 'Pasangkan'], players: 1, roundLabel: 'Papan', rounds: [1, 2, 3], defaults: 2
    },
    {
      id: 'memory', name: 'Kartu Memori', icon: 'memory', color: tone(3),
      desc: 'Balik kartu dan temukan pasangan istilah dengan definisinya. Latih ingatan istilah jaringan.',
      tags: ['Memori', 'Istilah'], players: 1, roundLabel: 'Jumlah pasangan', rounds: [6, 8, 10], defaults: 8
    },
    {
      id: 'subnet', name: 'Subnet Master', icon: 'calc', color: tone(4),
      desc: 'Hitung network address, broadcast, dan jumlah host dari IP dan prefix. Otak subnetmu diuji.',
      tags: ['Hitung', 'IP'], players: 1, roundLabel: 'Jumlah soal', rounds: [5, 8, 10], defaults: 8
    },
    {
      id: 'osi', name: 'Menara OSI', icon: 'layers', color: tone(5),
      desc: 'Susun tujuh lapisan OSI dari Application sampai Physical. Satu kesalahan menggeser semuanya.',
      tags: ['OSI', 'Urutan'], players: 1, roundLabel: 'Menara', rounds: [1, 2, 3], defaults: 2
    },
    {
      id: 'detective', name: 'Detektif Jaringan', icon: 'detective', color: tone(6),
      desc: 'Buka petunjuk kasus, hubungkan gejala, lalu pilih penyebab gangguan yang paling tepat.',
      tags: ['Kasus', 'Troubleshooting'], players: 1, roundLabel: 'Kasus', rounds: [3, 4, 5], defaults: 3
    },
    {
      id: 'reaction', name: 'Refleks Neko', icon: 'bolt', color: tone(7),
      desc: 'Tunggu sinyal berubah, lalu sentuh secepat mungkin. Fokus dan kecepatan tangan diuji.',
      tags: ['Refleks', 'Kilat'], players: 1, roundLabel: 'Percobaan', rounds: [5, 7, 10], defaults: 5
    },
    {
      id: 'simon', name: 'Simon Router', icon: 'router', color: tone(0),
      desc: 'Lampu port menyala berurutan. Hafal urutannya, lalu tekan ulang persis sama.',
      tags: ['Ingatan', 'Urutan port'], players: 1, roundLabel: 'Ronde', rounds: [4, 5, 7], defaults: 5
    },
    {
      id: 'portrush', name: 'Serang Port', icon: 'crosshair', color: tone(2),
      desc: 'Port muncul di papan switch. Sentuh hanya port layanan yang diminta, abaikan yang palsu.',
      tags: ['Refleks', 'Port layanan'], players: 1, roundLabel: 'Ronde', rounds: [5, 6, 8], defaults: 6
    },
    {
      id: 'merge', name: 'Subnet 2048', icon: 'grid', color: tone(4),
      desc: 'Geser papan, gabungkan prefix yang sama sampai jaringan melebar ke target yang ditentukan.',
      tags: ['Gabung', 'Prefix'], players: 1, roundLabel: 'Target', rounds: [6, 8, 10], defaults: 8
    },
    {
      id: 'networksnake', name: 'Snake Jaringan', icon: 'network', color: tone(2),
      desc: 'Kendalikan paket data, makan node, hindari tabrakan. Refleks dan strategi murni.',
      tags: ['Refleks', 'Arcade'], players: 1, roundLabel: 'Panjang', rounds: [1], defaults: 1
    },
    {
      id: 'blockdrop', name: 'Blok Jatuh', icon: 'grid', color: tone(5),
      desc: 'Susun balok, bersihkan baris penuh, bertahan sebelum papan meluap.',
      tags: ['Puzzle', 'Strategi'], players: 1, roundLabel: 'Ronde', rounds: [1], defaults: 1
    },
    {
      id: 'bubblepop', name: 'Bubble Pop', icon: 'sparkle', color: tone(7),
      desc: 'Pecah gelembung sebelum lewat. Makin lama makin cepat — refleks murni.',
      tags: ['Refleks', 'Kilat'], players: 1, roundLabel: 'Gelembung', rounds: [30], defaults: 30
    },
    {
      id: 'typing', name: 'Terminal Kilat', icon: 'keyboard', color: tone(6),
      desc: 'Ketik perintah Cisco IOS persis seperti tertulis. Semakin cepat, semakin besar poinnya.',
      tags: ['Cisco', 'Mengetik'], players: 1, roundLabel: 'Perintah', rounds: [5, 6, 10], defaults: 6
    },
    {
      id: 'netquest', name: 'Petualangan Jaringan', icon: 'network', color: tone(3),
      desc: 'Koleksi 50 game mini bertema jaringan: tebak IP, susun kabel, ketik perintah, dan refleks paket. Bukan kuis — benar-benar game.',
      tags: ['50 game', 'Jaringan', 'Campuran'], players: 1, roundLabel: 'Jumlah game', rounds: [6, 8, 12], defaults: 8
    }
  ];

  const difficulty = {
    santai: { label: 'Santai', sub: 'Waktu longgar', limit: 26, bonus: .8 },
    normal: { label: 'Normal', sub: 'Tempo seimbang', limit: 18, bonus: 1 },
    tantangan: { label: 'Tantangan', sub: 'Waktu ketat', limit: 11, bonus: 1.3 }
  };

  let active = null;

  function meta(id) {
    return catalog.find(item => item.id === id) || catalog[0];
  }

  function bestOf(id) {
    const entry = Neko.store.profile?.stats?.games?.[id];
    return entry && entry.best ? entry.best : 0;
  }

  function render() {
    const profile = Neko.store.profile;
    const played = profile?.stats?.gamesPlayed || 0;
    const totalBest = catalog.reduce((sum, item) => sum + bestOf(item.id), 0);
    return (
      '<section class="arena-hero">' + (Neko.ornaments ? Neko.ornaments.cluster('arena') : '') +
      '<div class="arena-hero-copy"><span class="kicker">GAME TJKT</span>' +
      '<h1>Pilih game, atur sesi, lalu buktikan ilmumu.</h1>' +
      '<p>Dua belas mode latihan: sebelas game lokal plus Kelas Langsung online antarperangkat. Pilih kartu untuk melihat pengaturan sebelum mulai.</p>' +
      '<div class="arena-mode"><span class="chip">' + icon('gamepad') + '11 game + live</span><span class="chip">' + icon('users') + 'Mode bergiliran</span><span class="chip">' + icon('bolt') + 'XP tiap sesi</span></div>' +
      '<div class="home-meta" style="margin-top:16px"><span class="chip">' + icon('trophy') + 'Total rekor ' + formatNumber(totalBest) + '</span><span class="chip">' + icon('target') + played + ' sesi dimainkan</span></div>' +
      '</div>' +
      '<div class="arena-hero-visual" aria-hidden="true"><div class="arena-orbit">' +
      '<div class="arena-core">' + icon('gamepad') + '</div>' +
      '<span class="arena-orbit-dot d1">' + icon('brain') + '</span>' +
      '<span class="arena-orbit-dot d2">' + icon('spy') + '</span>' +
      '<span class="arena-orbit-dot d3">' + icon('calc') + '</span>' +
      '<span class="arena-orbit-dot d4">' + icon('bolt') + '</span>' +
      '</div></div></section>' +
      '<button type="button" class="live-class-banner" data-live-open>' +
      '<span class="live-class-ic">' + icon('live') + '</span>' +
      '<span class="live-class-copy"><b>NEKO LIVE CLASS</b><small>Guru menampilkan PIN, semua siswa menjawab dari HP masing-masing. Skor cepat + benar, papan peringkat live, XP masuk akun.</small></span>' +
      '<span class="live-class-chips"><i>Pin 6 digit</i><i>Online</i><i>1 layar + banyak HP</i></span>' +
      '<span class="live-class-go">' + icon('play') + 'Buka</span>' +
      '</button>' +
      '<div class="arena-grid">' + catalog.filter(item => item.id !== 'spy-v2').map(gameCard).join('') + '</div>' +
      '<section class="arena-spy-banner">' +
      '<button type="button" class="live-class-banner" data-go="mabar">' +
      '<span class="live-class-ic">' + icon('spy') + '</span>' +
      '<span class="live-class-copy"><b>WHO IS THE SPY</b><small>Mode 2.0 bergiliran dengan chat & suara. Buka di halaman Mabar, undang teman yang saling add, lalu mainkan bareng.</small></span>' +
      '<span class="live-class-chips"><i>Mabar</i><i>Giliran</i><i>Suara</i></span>' +
      '<span class="live-class-go">' + icon('play') + 'Buka di Mabar</span>' +
      '</button></section>'
    );
  }

  function gameCard(item) {
    const best = bestOf(item.id);
    const label = item.id === 'spy-v2' ? 'Who Is The Spy' : item.name;
    return (
      '<button type="button" class="game-card" data-game="' + item.id + '" style="--gc:' + item.color + '">' +
      '<span class="game-card-top"><span class="game-icon">' + icon(item.icon) + '</span><span class="game-best">' + (best ? 'Rekor ' + formatNumber(best) : 'Belum dimainkan') + '</span></span>' +
      '<h3>' + esc(label) + '</h3><p>' + esc(item.desc) + '</p>' +
      '<span class="game-tags">' + item.tags.map(tag => '<span>' + esc(tag) + '</span>').join('') + '</span>' +
      '<span class="game-card-foot"><span class="game-play">' + icon('play') + 'Atur & main</span><span class="game-best">' + item.defaults + ' ' + item.roundLabel.toLowerCase() + ' awal</span></span>' +
      '</button>'
    );
  }

  function bind(root) {
    root.addEventListener('click', event => {
      if (event.target.closest('[data-live-open]')) {
        Neko.audio.play('select');
        if (Neko.live) Neko.live.openChooser();
        return;
      }
      const card = event.target.closest('[data-game]');
      if (card) {
        Neko.audio.play('select');
        setupSheet(card.dataset.game);
      }
    });
  }

  function setupSheet(gameId) {
    const item = meta(gameId);
    let rounds = item.defaults;
    let players = item.minPlayers || 1;
    let level = 'normal';
    const body =
      '<div class="game-setup-head"><span class="game-icon" style="--gc:' + item.color + '">' + icon(item.icon) + '</span><div><h3>' + esc(item.name) + '</h3><p>' + esc(item.desc) + '</p></div></div>' +
      '<div class="setup-grid">' +
      '<section class="setup-section"><span class="setup-label">Tingkat kesulitan</span><div class="setup-choice" data-level>' +
      Object.entries(difficulty).map(([key, value]) => '<button type="button" class="' + (key === level ? 'on' : '') + '" data-level-pick="' + key + '">' + value.label + '<small>' + value.sub + '</small></button>').join('') +
      '</div></section>' +
      '<section class="setup-section"><span class="setup-label">' + esc(item.roundLabel) + '</span><div class="setup-choice" data-rounds>' +
      item.rounds.map(value => '<button type="button" class="' + (value === rounds ? 'on' : '') + '" data-round-pick="' + value + '">' + value + '<small>pilihan</small></button>').join('') +
      '</div></section>' +
      '</div>' +
      (item.players > 1 ? '<section class="setup-section"><span class="setup-label">Pemain</span><div class="setup-players"><div class="setting-copy"><b>Jumlah pemain</b><small>Bergiliran di satu perangkat</small></div><div class="stepper"><button type="button" data-player-down aria-label="Kurangi pemain">−</button><b data-player-count>' + players + ' pemain</b><button type="button" data-player-up aria-label="Tambah pemain">+</button></div></div></section>' : '') +
      '<div class="setup-note">' + icon('info') + '<span>Butuh fokus? Tekan tombol keluar kapan saja. Keluar dari game akan mengakhiri sesi dan permainan dimulai dari awal.</span></div>';
    const entry = Neko.ui.sheet({
      kicker: 'PENGATURAN GAME', title: item.name, sub: item.tags.join(' · '),
      className: 'game-setup-sheet',
      body,
      foot: '<button type="button" class="btn btn-soft" data-sheet-close>Batal</button><button type="button" class="btn btn-primary" data-start-game style="--gc:' + item.color + '">' + icon('play') + 'Mulai sekarang</button>',
      onMount(el) {
        const count = el.querySelector('[data-player-count]');
        el.querySelector('[data-level]').addEventListener('click', event => {
          const button = event.target.closest('[data-level-pick]');
          if (!button) return;
          level = button.dataset.levelPick;
          el.querySelectorAll('[data-level-pick]').forEach(node => node.classList.toggle('on', node === button));
          Neko.audio.play('select');
        });
        el.querySelector('[data-rounds]').addEventListener('click', event => {
          const button = event.target.closest('[data-round-pick]');
          if (!button) return;
          rounds = Number(button.dataset.roundPick);
          el.querySelectorAll('[data-round-pick]').forEach(node => node.classList.toggle('on', node === button));
          Neko.audio.play('select');
        });
        const setPlayers = value => {
          players = clamp(value, item.minPlayers || 1, item.players);
          if (count) count.textContent = players + ' pemain';
          Neko.audio.play('tap');
        };
        const up = el.querySelector('[data-player-up]');
        const down = el.querySelector('[data-player-down]');
        if (up) up.addEventListener('click', () => setPlayers(players + 1));
        if (down) down.addEventListener('click', () => setPlayers(players - 1));
        el.querySelector('[data-start-game]').addEventListener('click', () => {
          entry.close();
          window.setTimeout(() => start(item.id, { rounds, players, level }), 240);
        });
      }
    });
  }

  /* ---------------- Lapisan game ---------------- */

  function start(gameId, config) {
    const item = meta(gameId);
    if (!Neko.games || !Neko.games[gameId]) {
      Neko.ui.toast('Game belum siap', 'Modul game ini belum termuat.', 'error', 'warning');
      return;
    }
    closeConfirmSheets();
    const layer = document.createElement('div');
    layer.className = 'game-layer';
    layer.style.setProperty('--gc', item.color);
    layer.innerHTML =
      '<div class="game-bar">' +
      '<button type="button" class="game-exit" data-game-exit aria-label="Keluar dari game">' + icon('exit') + '<span>Keluar</span></button>' +
      '<div class="game-title-wrap"><span class="game-icon">' + icon(item.icon) + '</span><div><b>' + esc(item.name) + '</b><small data-game-sub>' + esc(difficulty[config.level]?.label || 'Normal') + '</small></div></div>' +
      '<div class="spacer"></div><div class="game-hud" data-game-hud></div>' +
      '</div>' +
      '<div class="game-stage"><div class="game-frame"></div></div>';
    document.body.appendChild(layer);
    document.body.style.overflow = 'hidden';
    if (overlayRoot) overlayRoot.classList.add('game-active');
    window.requestAnimationFrame(() => layer.classList.add('is-open'));
    Neko.audio.play('go');

    const ctx = buildContext(item, layer, config);
    active = ctx;
    try {
      Neko.games[gameId].mount(ctx);
    } catch (error) {
      ctx.setStage('<div class="g-panel g-center"><span class="g-center-icon">' + icon('warning') + '</span><h2>Game gagal dimuat</h2><p>' + esc(error.message) + '</p></div>');
    }
  }

  function closeConfirmSheets() {
    document.querySelectorAll('.modal-layer.game-exit-layer').forEach(node => node.remove());
  }

  function buildContext(item, layer, config) {
    const stage = layer.querySelector('.game-stage');
    const frame = layer.querySelector('.game-frame');
    const hud = layer.querySelector('[data-game-hud]');
    const sub = layer.querySelector('[data-game-sub]');
    const cleanups = [];
    let hudCache = [];
    let ended = false;
    let exiting = false;

    const ctx = {
      id: item.id,
      meta: item,
      config,
      sessionId: item.id + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      difficulty: difficulty[config.level] || difficulty.normal,
      layer,
      stage,
      frame,
      audio: Neko.audio,
      util: Neko.util,
      store: Neko.store,
      get ended() { return ended; },
      setStage(html, wide = false) {
        stage.classList.toggle('wide', Boolean(wide));
        frame.innerHTML = html;
        return frame;
      },
      setHUD(items) {
        if (!hud) return;
        const list = items || [];
        hud.innerHTML = list.map(pill => '<span class="game-hud-pill ' + (pill.hot ? 'hot' : '') + '">' + (pill.icon ? icon(pill.icon) : '') + esc(pill.label) + '</span>').join('');
        Array.from(hud.children).forEach((pill, index) => {
          if (hudCache[index] !== undefined && hudCache[index] !== list[index].label) {
            pill.classList.add('bump');
            pill.addEventListener('animationend', () => pill.classList.remove('bump'), { once: true });
          }
        });
        hudCache = list.map(pill => pill.label);
      },
      setSub(text) {
        if (sub) sub.textContent = text;
      },
      cleanup(fn) {
        if (typeof fn === 'function') cleanups.push(fn);
      },
      confetti(x, y, amount) {
        Neko.ui.confetti(x ?? window.innerWidth / 2, y ?? window.innerHeight / 2, amount || 34);
      },
      toast: Neko.ui.toast,
      async countdown(seconds = 3) {
        const box = document.createElement('div');
        box.className = 'g-countdown';
        box.innerHTML = '<strong>' + seconds + '</strong><p>Bersiap…</p>';
        frame.innerHTML = '';
        frame.appendChild(box);
        for (let value = seconds; value > 0; value -= 1) {
          box.querySelector('strong').textContent = value;
          box.querySelector('strong').style.animation = 'none';
          void box.querySelector('strong').offsetWidth;
          box.querySelector('strong').style.animation = '';
          Neko.audio.play('count');
          await wait(720);
        }
        box.innerHTML = '<strong>Mulai!</strong><p>Semangat</p>';
        Neko.audio.play('go');
        await wait(480);
      },
      pass(titleText, name, hint) {
        return new Promise(resolve => {
          const box = document.createElement('div');
          box.className = 'g-pass';
          box.innerHTML =
            '<div class="g-pass-avatar">' + esc(Neko.util.initials(name)) + '</div>' +
            '<h2>' + titleText + '</h2>' +
            '<p class="pass-hint">' + esc(hint || '') + '</p>' +
            '<button type="button" class="btn btn-primary" data-pass-ok>' + icon('eye') + 'Saya siap</button>';
          frame.innerHTML = '';
          frame.appendChild(box);
          box.querySelector('[data-pass-ok]').addEventListener('click', () => {
            Neko.audio.play('select');
            resolve();
          });
        });
      },
      finish(result) {
        if (ended) return;
        ended = true;
        cleanups.forEach(fn => { try { fn(); } catch (error) { /* abaikan */ } });
        showResult(ctx, item, result);
      },
      exit() {
        if (exiting) return;
        if (ended) { closeGame(); return; }
        exiting = true;
        const entry = Neko.ui.sheet({
          layerClass: 'game-exit-layer',
          kicker: 'KELUAR DARI GAME',
          title: 'Sudahi sesi ini?',
          body:
            '<div class="exit-pop"><span class="exit-pop-icon">' + icon('exit') + '</span>' +
            '<h3>Permainan sedang berjalan</h3>' +
            '<p>Kamu bisa lanjut bermain, atau mengakhiri sesi sekarang.</p>' +
            '<div class="exit-pop-warning">Keluar sekarang akan mengakhiri permainan. Jika ingin bermain lagi, game akan dimulai dari awal.</div></div>',
          foot: '<button type="button" class="btn btn-soft" data-keep-playing>' + icon('play') + 'Lanjutkan main</button><button type="button" class="btn btn-danger" data-end-game>' + icon('close') + 'Sudahi & keluar</button>',
          onMount(el) {
            el.querySelector('[data-keep-playing]').addEventListener('click', () => { exiting = false; entry.close(); });
            el.querySelector('[data-end-game]').addEventListener('click', () => { entry.close(); exiting = false; closeGame(); });
          },
          onClose() {
            exiting = false;
          }
        });
      }
    };

    function closeGame() {
      if (!layer.isConnected) return;
      ended = true;
      cleanups.forEach(fn => { try { fn(); } catch (error) { /* abaikan */ } });
      if (overlayRoot) overlayRoot.classList.remove('game-active');
      layer.classList.add('is-closing');
      layer.classList.remove('is-open');
      document.body.style.overflow = '';
      active = null;
      Neko.audio.play('tap');
      const finished = ctx.lastResult;
      window.setTimeout(() => {
        layer.remove();
        if (finished) {
          document.dispatchEvent(new CustomEvent('neko:game-result', { detail: finished }));
        }
        if (Neko.app) Neko.app.refresh();
      }, 320);
    }

    ctx.close = closeGame;

    layer.querySelector('[data-game-exit]').addEventListener('click', () => ctx.exit());
    const escHandler = event => {
      if (event.key !== 'Escape') return;
      if (Neko.ui.openCount) return;
      event.preventDefault();
      ctx.exit();
    };
    document.addEventListener('keydown', escHandler);
    cleanups.push(() => document.removeEventListener('keydown', escHandler));

    layer.addEventListener('click', event => {
      if (event.target.closest('[data-replay]')) {
        closeGame();
        window.setTimeout(() => start(item.id, config), 260);
      }
      if (event.target.closest('[data-menu]')) closeGame();
    });

    return ctx;
  }

  function showResult(ctx, item, result = {}) {
    const score = Math.max(0, Math.round(result.score || 0));
    const won = Boolean(result.won);
    const xp = Math.max(0, Math.round(result.xp ?? 0));
    Neko.store.recordGame(item.id, {
      score, won,
      correct: result.correct,
      answered: result.answered,
      minutes: result.minutes
    });
    if (xp) Neko.store.awardXP(xp, item.name);
    Neko.audio.play(won ? 'win' : 'fail');
    if (won) window.setTimeout(() => ctx.confetti(window.innerWidth / 2, window.innerHeight * .36, 40), 180);
    const stats = (result.stats || []).map(stat => '<div class="g-result-stat"><strong>' + esc(stat.value) + '</strong><span>' + esc(stat.label) + '</span></div>').join('');
    const list = result.list && result.list.length
      ? '<div class="g-result-list">' + result.list.map((row, index) => '<div class="g-result-row ' + (row.win ? 'win' : '') + '"><span class="rank">' + (index + 1) + '</span><b>' + esc(row.name) + '</b><span class="score">' + formatNumber(row.score) + '</span></div>').join('') + '</div>'
      : '';
    ctx.setStage(
      '<div class="g-panel g-result">' +
      '<span class="g-result-medal">' + icon(won ? 'trophy' : 'medal') + '</span>' +
      '<h2>' + esc(result.title || (won ? 'Hebat, kamu menang!' : 'Sesi selesai')) + '</h2>' +
      '<p>' + esc(result.message || 'Terus berlatih agar makin cepat dan tepat.') + '</p>' +
      (xp ? '<span class="g-xp-earned">' + icon('xp') + '+' + xp + ' XP diperoleh</span>' : '') +
      '<div class="g-result-stats">' + stats + '</div>' +
      list +
      '<div class="g-result-actions"><button type="button" class="btn btn-primary" data-replay>' + icon('restart') + 'Main lagi</button><button type="button" class="btn btn-soft" data-menu>' + icon('grid') + 'Pilih game lain</button></div>' +
      '</div>'
    );
    ctx.lastResult = { id: item.id, name: item.name, won, score, xp, title: result.title || '' };
    // modul room mabar memakai event ini untuk mengirim skor ke server
    document.dispatchEvent(new CustomEvent('neko:game-score', {
      detail: { ...ctx.lastResult, stats: result.stats || [], sessionId: ctx.sessionId || '' }
    }));
    if (Neko.app) Neko.app.refresh();
  }

  function quickStart(gameId) {
    if (!Neko.store.profile) return;
    setupSheet(gameId);
  }

  Neko.arena = {
    list: catalog,
    meta,
    render,
    bind,
    setupSheet,
    quickStart,
    start,
    get active() { return active; }
  };
})();