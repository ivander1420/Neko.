/* ============================================================
   NEKO · js/rooms.js — Room Mabar
   Buat room, undang teman, mainkan game yang sama bersamaan.
   Skor tiap ronde dikirim ke server; papan peringkat diperbarui
   seketika untuk semua peserta.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { esc } = Neko.util;
  const { icon } = Neko.icons;

  const LEVEL_KEYS = { easy: 'santai', normal: 'normal', hard: 'tantangan' };
  const LEVEL_LABELS = { easy: 'Santai', normal: 'Normal', hard: 'Tantangan' };

  const state = {
    pin: '',
    view: null,
    layer: null,
    race: null,        // { round, submitted, sessionId }
    pendingRound: 0,
    lastBoard: null,
    inviteFrom: '',
    busy: false
  };

  const pack = () => window.NekoAvatarPack || null;

  function me() {
    return (Neko.store && Neko.store.profile) || null;
  }

  function myName() {
    const profile = me();
    return (profile && profile.displayName) || '';
  }

  function isSelf(player) {
    const profile = me();
    if (!profile) return false;
    return String(player.username || '').toLowerCase() === String(profile.username || '').toLowerCase();
  }

  /* ---------------- daftar game yang bisa dibarengkan ---------------- */

  function raceGames() {
    const list = (Neko.arena && Neko.arena.list) || [];
    // semua game bisa mabar; spy punya mode bergiliran khusus spyv2
    return list.filter(item => item.id !== 'spy-v2');
  }

  /* ---------------- layar Mabar (view aplikasi) ---------------- */

  function render() {
    const profile = me();
    const games = raceGames();
    return '<div class="room-view">' +
      '<section class="room-hero">' +
      '<div class="room-hero-copy">' +
      '<span class="room-kicker">' + icon('swords') + ' Mode multiplayer</span>' +
      '<h1>Room Mabar</h1>' +
      '<p>Buat room, bagikan PIN enam angkanya, lalu adu skor game yang sama bareng teman sekelas. Papan peringkat berjalan langsung di semua perangkat.</p>' +
      '</div>' +
      '<div class="room-hero-stats">' +
      '<div><b data-room-count>—</b><span>room terbuka</span></div>' +
      '<div><b data-room-players>—</b><span>pemain di dalam room</span></div>' +
      '</div>' +
      '</section>' +

      '<section class="room-actions">' +
      '<button type="button" class="btn btn-primary" data-room-create>' + icon('plus') + ' Buat room baru</button>' +
      '<button type="button" class="btn btn-soft" data-nobar-open>' + icon('live') + ' Nobar YouTube</button>' +
      '<div class="room-join-inline">' +
      '<input type="text" inputmode="numeric" maxlength="6" placeholder="PIN room" data-room-pin aria-label="PIN room">' +
      '<button type="button" class="btn btn-soft" data-room-join>' + icon('key') + ' Masuk</button>' +
      '</div>' +
      '<button type="button" class="btn btn-soft" data-room-refresh>' + icon('refresh') + ' Muat ulang</button>' +
      '</section>' +

      (profile ? '' : '<div class="room-notice">' + icon('warning') + ' Login dulu untuk bisa membuat atau bergabung ke room.</div>') +

      '<div data-room-invite></div>' +

      '<section class="room-block">' +
      '<div class="room-block-head"><h2>' + icon('live') + ' Room yang sedang dibuka</h2><small>Klik untuk ikut menonton atau bermain</small></div>' +
      '<div class="room-list" data-room-list><div class="room-empty">Memuat daftar room…</div></div>' +
      '</section>' +

      '<section class="room-block">' +
      '<div class="room-block-head"><h2>' + icon('gamepad') + ' Game yang bisa mabar</h2><small>' + games.length + ' game siap dibalapkan</small></div>' +
      '<div class="room-game-chips">' + games.map(item =>
        '<span class="room-game-chip" style="--gc:' + item.color + '">' + icon(item.icon) + esc(item.name === 'Who Is The Spy 2.0' ? 'Who Is The Spy' : item.name) + '</span>').join('') +
      '</div>' +
      '<p class="room-foot-note">Who Is The Spy dimainkan bergiliran di satu perangkat; game lain adu skor realtime.</p>' +
      '</section>' +
      '</div>';
  }

  function roomRowHTML(room) {
    // PIN tidak ditampilkan di daftar publik — hanya host & undangan yang membagikan PIN.
    if (room.locked || !room.pin) {
      return '<div class="room-card is-locked" style="opacity:.72">' +
        '<span class="room-card-pin">' + icon('lock') + '</span>' +
        '<span class="room-card-main"><b>' + esc(room.gameName || room.game) + '</b>' +
        '<small>' + esc(room.host) + ' · ' + room.players + ' pemain · PIN hanya untuk yang diundang</small></span>' +
        '<span class="room-card-phase ' + (room.phase === 'playing' ? 'is-live' : '') + '">' + (room.phase === 'playing' ? 'Berjalan' : 'Lobby') + '</span>' +
        '</div>';
    }
    return '<button type="button" class="room-card" data-room-open="' + esc(room.pin) + '">' +
      '<span class="room-card-pin">' + esc(room.pin) + '</span>' +
      '<span class="room-card-main"><b>' + esc(room.gameName || room.game) + '</b>' +
      '<small>' + esc(room.host) + ' · ' + room.players + ' pemain · ' + LEVEL_LABELS[room.level] + ' · ronde ' + (room.round + 1) + '/' + room.total + '</small></span>' +
      '<span class="room-card-phase ' + (room.phase === 'playing' ? 'is-live' : '') + '">' + (room.phase === 'playing' ? 'Berjalan' : 'Lobby') + '</span>' +
      '</button>';
  }

  async function loadList(root) {
    const scope = root || document;
    const box = scope.querySelector('[data-room-list]');
    if (!box) return;
    try {
      const data = await Neko.api.room.list();
      const rooms = data.rooms || [];
      const mine = data.mine || [];
      box.innerHTML = rooms.length
        ? rooms.map(roomRowHTML).join('')
        : '<div class="room-empty">Belum ada room yang terbuka. Jadilah yang pertama — tekan <b>Buat room baru</b>.</div>';
      const count = scope.querySelector('[data-room-count]');
      const players = scope.querySelector('[data-room-players]');
      if (count) count.textContent = String(rooms.length);
      if (players) players.textContent = String(rooms.reduce((sum, room) => sum + (room.players || 0), 0));
      if (mine.length && !state.pin) openRoom(mine[0].pin, { silent: true });
      box.querySelectorAll('[data-room-open]').forEach(button => {
        button.addEventListener('click', () => {
          Neko.audio.play('tap');
          openRoom(button.dataset.roomOpen);
        });
      });
    } catch (error) {
      box.innerHTML = '<div class="room-empty">' + esc(niceError(error)) + '</div>';
    }
  }

  function niceError(error) {
    const message = String((error && error.message) || '');
    if (/offline|tidak terhubung/i.test(message)) return 'Server NEKO tidak terhubung. Nyalakan server untuk mabar.';
    return message || 'Terjadi kesalahan.';
  }

  function bind(root) {
    root.querySelector('[data-room-create]').addEventListener('click', () => {
      Neko.audio.play('tap');
      createSheet();
    });
    root.querySelector('[data-nobar-open]').addEventListener('click', () => {
        Neko.audio.play('tap');
        Neko.nobar.open();
      });
    root.querySelector('[data-room-refresh]').addEventListener('click', event => {
      const button = event.currentTarget;
      button.classList.add('is-busy');
      loadList(root).finally(() => button.classList.remove('is-busy'));
    });
    root.querySelector('[data-room-join]').addEventListener('click', () => {
      const pin = String(root.querySelector('[data-room-pin]').value || '').trim();
      if (!/^\d{6}$/.test(pin)) {
        Neko.ui.toast('PIN belum benar', 'Masukkan enam angka PIN room.', 'warn', 'warning');
        return;
      }
      openRoom(pin);
    });
    root.querySelector('[data-room-pin]').addEventListener('keydown', event => {
      if (event.key === 'Enter') root.querySelector('[data-room-join]').click();
    });
    if (state.inviteFrom) paintInviteBanner(root);
    loadList(root);
  }

  function paintInviteBanner(root) {
    const box = (root || document).querySelector('[data-room-invite]');
    if (!box || !state.inviteFrom) return;
    box.innerHTML = '<div class="room-invite-banner">' +
      '<span class="room-invite-ic">' + icon('bell') + '</span>' +
      '<div><b>' + esc(state.inviteFrom.displayName || state.inviteFrom.from) + '</b> mengundangmu mabar' +
      (state.inviteFrom.game ? ' di ' + esc(state.inviteFrom.game) : '') + '.</div>' +
      '<button type="button" class="btn btn-primary" data-room-accept>' + icon('play') + ' Gabung PIN ' + esc(state.inviteFrom.pin) + '</button>' +
      '</div>';
    const button = box.querySelector('[data-room-accept]');
    if (button) button.addEventListener('click', () => {
      openRoom(state.inviteFrom.pin);
      state.inviteFrom = '';
      box.innerHTML = '';
    });
  }

  /* ---------------- sheet pembuatan room ---------------- */

  function createSheet() {
    if (!Neko.api.online) {
      Neko.ui.toast('Butuh server', 'Room mabar berjalan lewat server NEKO — nyalakan servernya.', 'error', 'warning');
      return;
    }
    const games = raceGames();
    let gameId = games[0] ? games[0].id : 'reaction';
    let level = 'normal';
    let sessions = 3;
    let roundsPer = 5;
    let isPublic = true;

    Neko.ui.sheet({
      kicker: 'ROOM MABAR',
      title: 'Atur sesi balapan',
      body:
        '<div class="room-setup">' +
        '<label class="room-setup-field"><span>Pilih game</span><div class="room-setup-grid" data-setup-games>' +
        games.map(item => '<button type="button" class="room-setup-game' + (item.id === gameId ? ' on' : '') + '" data-game-id="' + esc(item.id) + '" style="--gc:' + item.color + '">' +
          icon(item.icon) + '<b>' + esc(item.name) + '</b></button>').join('') +
        '</div></label>' +
        '<div class="room-setup-row">' +
        '<label class="room-setup-field"><span>Jumlah ronde</span><div class="room-seg" data-setup-sessions>' +
        [1, 2, 3, 4, 5].map(n => '<button type="button" class="room-seg-btn' + (n === sessions ? ' on' : '') + '" data-sessions="' + n + '">' + n + '</button>').join('') +
        '</div></label>' +
        '<label class="room-setup-field"><span>Intensitas</span><div class="room-seg" data-setup-level>' +
        [['easy', 'Santai'], ['normal', 'Normal'], ['hard', 'Tantangan']].map(([key, label]) =>
          '<button type="button" class="room-seg-btn' + (key === level ? ' on' : '') + '" data-level="' + key + '">' + label + '</button>').join('') +
        '</div></label>' +
        '</div>' +
        '<label class="room-setup-field"><span>Isi tiap ronde</span><div class="room-seg" data-setup-rounds>' +
        [3, 5, 8].map(n => '<button type="button" class="room-seg-btn' + (n === roundsPer ? ' on' : '') + '" data-rounds="' + n + '">' + n + ' babak</button>').join('') +
        '</div></label>' +
        '<label class="room-check"><input type="checkbox" data-setup-public checked><span>Tampilkan room ini di daftar kelas (boleh ditonton orang lain)</span></label>' +
        '<p class="room-setup-hint">Setiap ronde, semua pemain memainkan game yang sama dengan setelan identik. Skor ronde dikirim ke server dan papan peringkat diperbarui otomatis.</p>' +
        '</div>',
      foot: '<button type="button" class="btn btn-soft" data-close>Batal</button><button type="button" class="btn btn-primary" data-room-go>' + icon('bolt') + ' Buat & buka room</button>',
      onMount(el) {
        el.querySelector('[data-setup-games]').addEventListener('click', event => {
          const button = event.target.closest('[data-game-id]');
          if (!button) return;
          gameId = button.dataset.gameId;
          el.querySelectorAll('[data-game-id]').forEach(node => node.classList.toggle('on', node === button));
          Neko.audio.play('tick');
        });
        el.querySelector('[data-setup-sessions]').addEventListener('click', event => {
          const button = event.target.closest('[data-sessions]');
          if (!button) return;
          sessions = Number(button.dataset.sessions);
          el.querySelectorAll('[data-sessions]').forEach(node => node.classList.toggle('on', node === button));
        });
        el.querySelector('[data-setup-level]').addEventListener('click', event => {
          const button = event.target.closest('[data-level]');
          if (!button) return;
          level = button.dataset.level;
          el.querySelectorAll('[data-level]').forEach(node => node.classList.toggle('on', node === button));
        });
        el.querySelector('[data-setup-rounds]').addEventListener('click', event => {
          const button = event.target.closest('[data-rounds]');
          if (!button) return;
          roundsPer = Number(button.dataset.rounds);
          el.querySelectorAll('[data-rounds]').forEach(node => node.classList.toggle('on', node === button));
        });
        el.querySelector('[data-room-go]').addEventListener('click', async () => {
          const button = el.querySelector('[data-room-go]');
          button.disabled = true;
          button.textContent = 'Membuat…';
          isPublic = el.querySelector('[data-setup-public]').checked;
          try {
            const data = await Neko.api.room.create({
              game: gameId, rounds: sessions, sessionRounds: roundsPer, level, public: isPublic
            });
            state.pin = data.pin;
            state.view = data.state;
            Neko.ui.closeTop();
            Neko.audio.play('success');
            showLayer();
          } catch (error) {
            button.disabled = false;
            button.innerHTML = icon('bolt') + ' Buat & buka room';
            Neko.ui.toast('Room gagal dibuat', niceError(error), 'error', 'warning');
          }
        });
      }
    });
  }

  /* ---------------- lapisan room ---------------- */

  function showLayer() {
    if (state.layer && state.layer.isConnected) { paintLayer(); return; }
    const layer = document.createElement('div');
    layer.className = 'room-layer';
    layer.innerHTML = '<div class="room-shell"><div class="room-shell-inner" data-room-inner></div></div>';
    document.body.appendChild(layer);
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => layer.classList.add('is-open'));
    state.layer = layer;
    paintLayer();
    subscribe();
  }

  function closeLayer() {
    const layer = state.layer;
    state.layer = null;
    unsubscribe();
    if (!layer) return;
    layer.classList.add('is-closing');
    window.setTimeout(() => layer.remove(), 260);
    document.body.style.overflow = '';
    if (Neko.app && Neko.app.currentView === 'mabar') loadList(document.getElementById('view'));
  }

  function playerChip(player) {
    const lib = pack();
    const avatar = lib && player.character && lib.has(player.character)
      ? lib.av(player.character, player.connected ? 'happy' : 'sleep', 'room-avatar-svg')
      : '<span class="room-avatar-fallback">' + esc((player.displayName || '?').slice(0, 2).toUpperCase()) + '</span>';
    return '<div class="room-player' + (player.connected ? '' : ' is-off') + (isSelf(player) ? ' is-me' : '') + (player.isHost ? ' is-host' : '') + '" style="--pi:' + (player.total || 0) + '">' +
      '<span class="room-avatar">' + avatar + '</span>' +
      '<span class="room-player-id"><b>' + esc(player.displayName) + (player.isHost ? ' <i>' + icon('crown') + '</i>' : '') + '</b>' +
      '<small>' + esc(player.character ? charName(player.character) : 'belum pilih karakter') + '</small></span>' +
      '<span class="room-player-state">' +
      (player.ready || player.isHost ? '<em class="is-ready">' + icon('check') + ' siap</em>' : '<em>menunggu</em>') +
      (state.view && state.view.phase === 'playing' ? '<i>' + (player.submitted ? icon('check') + ' terkirim' : 'main…') + '</i>' : '') +
      '</span>' +
      '<span class="room-player-score"><b>' + (player.total || 0) + '</b><span>poin</span></span>' +
      '</div>';
  }

  function charName(id) {
    const lib = pack();
    const found = lib && lib.AVATARS.find(a => a.id === id);
    return found ? found.name : id;
  }

  function takenMap() {
    const map = new Map();
    ((state.view && state.view.players) || []).forEach(player => {
      if (player.character) map.set(player.character, player.displayName);
    });
    return map;
  }

  function leaderboardHTML(rows) {
    if (!rows || !rows.length) return '';
    const max = Math.max(1, rows[0].total);
    return rows.map(row =>
      '<div class="room-board-row' + (row.rank <= 3 ? ' top' : '') + '" style="--bar:' + Math.round((row.total / max) * 100) + '%">' +
      '<span class="room-board-rank r' + row.rank + '">' + (row.rank === 1 ? icon('trophy') : row.rank) + '</span>' +
      '<span class="room-board-name">' + esc(row.displayName) + '</span>' +
      '<span class="room-board-bar"><i></i></span>' +
      '<b>' + row.total + '</b>' +
      '</div>').join('');
  }

  function paintLayer() {
    const inner = state.layer && state.layer.querySelector('[data-room-inner]');
    if (!inner) return;
    const view = state.view;
    if (!view) {
      inner.innerHTML = '<div class="room-loading">' + icon('bolt') + '<p>Menghubungkan ke room…</p></div>';
      return;
    }
    const self = view.players.find(isSelf) || null;
    const phase = view.phase;
    inner.innerHTML =
      '<header class="room-top">' +
      '<button type="button" class="room-exit" data-room-exit>' + icon('exit') + '<span>Keluar</span></button>' +
      '<div class="room-top-title"><b>' + icon('swords') + ' ' + esc(view.gameName || view.game) + '</b>' +
      '<small>' + esc(LEVEL_LABELS[view.config.level] || 'Normal') + ' · ' + view.config.rounds + ' ronde × ' + (view.config.sessionRounds || 5) + ' babak</small></div>' +
      '<button type="button" class="room-pin-btn" data-room-copy>' +
      '<span>PIN</span><b>' + esc(view.pin) + '</b>' + icon('share') + '</button>' +
      '</header>' +

      '<div class="room-body">' +
      '<section class="room-col room-col-left">' +
      '<div class="room-col-head"><h2>' + icon('users') + ' Pemain <small>' + view.players.length + '/12</small></h2>' +
      (phase === 'lobby' ? '<button type="button" class="btn btn-soft btn-mini" data-room-invite>' + icon('user-plus') + ' Undang teman</button>' : '') +
      '</div>' +
      '<div class="room-players">' + view.players.map(playerChip).join('') + '</div>' +
      (phase === 'lobby' ? charPickerBlock(view, self) : '') +
      '</section>' +

      '<section class="room-col room-col-right">' +
      (phase === 'playing'
        ? '<div class="room-race">' +
          '<div class="room-race-head"><span>Ronde</span><b>' + view.round + '<small>/' + view.config.rounds + '</small></b>' +
          '<span class="room-race-clock" data-room-clock>' + icon('timer') + ' <b data-room-clock-seconds>—</b></span></div>' +
          (state.race && state.race.round === view.round
            ? '<div class="room-race-status">' + (state.race.submitted ? icon('check') + ' Skor terkirim — tunggu yang lain' : icon('bolt') + ' Sesi ronde ini sudah dipakai') + '</div>'
            : '<div class="room-race-status">' + icon('live') + ' ronde berjalan di semua perangkat</div>') +
          '<div class="room-waiting">' + waitingHTML(view) + '</div>' +
          (view.isHost ? '<button type="button" class="btn btn-soft btn-mini" data-room-skip>' + icon('refresh') + ' Lewati ronde ini</button>' : '') +
          '</div>'
        : '') +
      (phase === 'lobby' ? '<div class="room-race"><div class="room-race-status">' + icon('target') + ' ' + lobbyHint(view) + '</div></div>' : '') +
      (phase === 'finished' && view.results ? '<div class="room-podium">' + podiumHTML(view.results) + '</div>' : '') +
      '<div class="room-col-head"><h2>' + icon('ranking') + ' Papan peringkat</h2></div>' +
      '<div class="room-board">' + (leaderboardHTML(view.leaderboard) || '<div class="room-empty">Skor muncul setelah ronde pertama.</div>') + '</div>' +
      '<div class="room-col-head"><h2>' + icon('chat') + ' Aktivitas</h2></div>' +
      '<div class="room-feed">' + (view.feed || []).map(item => '<div class="room-feed-row">' + esc(item.text) + '</div>').join('') + '</div>' +
      '</section>' +
      '</div>' +

      '<footer class="room-foot">' +
      (phase === 'lobby'
        ? (view.isHost
            ? '<button type="button" class="btn btn-primary" data-room-start' + (view.players.length < 1 ? ' disabled' : '') + '>' + icon('play') + ' Mulai ' + view.config.rounds + ' ronde</button>'
            : (self && self.ready
              ? '<button type="button" class="btn btn-soft" data-room-ready-off>' + icon('check-circle') + ' Batal siap</button>'
              : '<button type="button" class="btn btn-primary" data-room-ready>' + icon('check') + ' Tandai aku siap</button>')) +
          (view.isHost
            ? ''
            : '<span class="room-foot-hint">' + icon('timer') + ' Menunggu ' + esc(view.host.displayName) + ' memulai</span>')
        : phase === 'finished'
          ? (view.isHost
            ? '<button type="button" class="btn btn-primary" data-room-start>' + icon('restart') + ' Jalankan sesi lagi</button>'
            : '<span class="room-foot-hint">' + icon('trophy') + ' Sesi selesai. Host bisa memulai ronde baru.</span>') + '<button type="button" class="btn btn-soft" data-room-leave>' + icon('exit') + ' Tinggalkan room</button>'
          : '<span class="room-foot-hint">' + icon('bolt') + ' Main di perangkatmu — skor terkirim otomatis tiap ronde selesai.</span>') +
      '</footer>';

    bindLayer(inner, view);
  }

  function lobbyHint(view) {
    if (view.players.length < 2) return 'Room masih sendiri. Bagikan PIN ' + view.pin + ' atau undang teman.';
    const belum = view.players.filter(player => !player.ready && !player.isHost).length;
    return belum ? belum + ' pemain belum menekan siap.' : 'Semua siap. Host bisa memulai.';
  }

  function waitingHTML(view) {
    const menunggu = view.players.filter(player => player.connected && player.submitted === false);
    if (!menunggu.length) return '<div class="room-empty">Semua skor masuk. Menutup ronde…</div>';
    return menunggu.map(player =>
      '<div class="room-wait-chip"><b>' + esc(player.displayName) + '</b><span>' + icon('timer') + ' masih bermain</span></div>').join('');
  }

  function charPickerBlock(view, self) {
    if (!view.isMember) return '';
    const lib = pack();
    if (!lib) return '';
    const taken = takenMap();
    const selected = self ? self.character : '';
    return '<div class="room-char"><h3>' + icon('paw') + ' Karaktermu <small>tidak boleh sama</small></h3>' +
      '<div class="live-char-grid">' + lib.AVATARS.slice(0, 24).map(a => {
        const holder = taken.get(a.id);
        const blocked = Boolean(holder) && holder !== myName();
        return '<button type="button" class="live-char' + (a.id === selected ? ' on' : '') + (blocked ? ' is-taken' : '') + '" data-pick-char="' + esc(a.id) + '"' + (blocked ? ' disabled' : '') + '>' +
          lib.av(a.id, 'happy', 'live-char-svg') + '<b>' + esc(a.name) + '</b>' +
          (blocked ? '<small>' + esc(holder) + '</small>' : '') + '</button>';
      }).join('') + '</div></div>';
  }

  function podiumHTML(results) {
    const rows = (results.board || []).slice(0, 3);
    if (!rows.length) return '';
    return '<div class="room-podium-row">' + rows.map((row, index) =>
      '<div class="room-pod pod' + (index + 1) + '">' +
      '<span class="room-pod-medal">' + icon(index === 0 ? 'trophy' : 'medal') + '</span>' +
      '<b>' + esc(row.displayName) + '</b>' +
      '<small>' + row.total + ' poin · terbaik ' + row.best + '</small>' +
      '</div>').join('') + '</div>' +
      '<div class="room-podium-note">' + icon('xp') + ' XP bonus dibagi: 60 / 40 / 25 untuk tiga besar.</div>';
  }

  let clockTimer = null;

  function startClock(inner, view) {
    window.clearInterval(clockTimer);
    clockTimer = null;
    const node = inner.querySelector('[data-room-clock-seconds]');
    if (!node || !view.roundDeadline) return;
    const tick = () => {
      const left = Math.max(0, Math.round((view.roundDeadline - Date.now()) / 1000));
      node.textContent = left + ' dtk';
      const clock = inner.querySelector('[data-room-clock]');
      if (clock) clock.classList.toggle('is-hot', left <= 20);
      if (!left && clockTimer) { window.clearInterval(clockTimer); clockTimer = null; }
    };
    tick();
    clockTimer = window.setInterval(tick, 1000);
  }

  function bindLayer(inner, view) {
    startClock(inner, view);
    inner.querySelector('[data-room-exit]').addEventListener('click', () => {
      Neko.audio.play('tap');
      if (state.pin && !state.race) Neko.api.room.leave(state.pin).catch(() => {});
      if (state.pin && !state.race) state.pin = '';
      closeLayer();
    });
    const copy = inner.querySelector('[data-room-copy]');
    if (copy) copy.addEventListener('click', async () => {
      const text = 'Masuk room mabar NEKO saya pakai PIN ' + view.pin + ' di ' + location.origin;
      try {
        if (navigator.share) await navigator.share({ title: 'Room mabar NEKO', text });
        else {
          await navigator.clipboard.writeText(text);
          Neko.ui.toast('PIN disalin', view.pin + ' — kirim ke temanmu.', 'success', 'check');
        }
      } catch (error) {
        Neko.ui.toast('Bagikan manual', text, 'info', 'share');
      }
      Neko.audio.play('tap');
    });
    inner.querySelectorAll('[data-pick-char]').forEach(button => {
      button.addEventListener('click', async () => {
        if (button.disabled) return;
        try {
          await Neko.api.room.character(view.pin, button.dataset.pickChar);
          Neko.audio.play('tap');
        } catch (error) {
          Neko.ui.toast('Karakter dipakai', niceError(error), 'warn', 'warning');
          refresh(view.pin);
        }
      });
    });
    const ready = inner.querySelector('[data-room-ready]');
    if (ready) ready.addEventListener('click', async () => {
      await Neko.api.room.ready(view.pin, true).catch(error => Neko.ui.toast('Gagal', niceError(error), 'error', 'warning'));
      Neko.audio.play('check');
      refresh(view.pin);
    });
    const readyOff = inner.querySelector('[data-room-ready-off]');
    if (readyOff && view.isMember && !view.isHost) readyOff.addEventListener('click', async () => {
      await Neko.api.room.ready(view.pin, false).catch(() => {});
      refresh(view.pin);
    });
    const start = inner.querySelector('[data-room-start]');
    if (start) start.addEventListener('click', async () => {
      start.disabled = true;
      try {
        await Neko.api.room.start(view.pin);
        Neko.audio.play('go');
      } catch (error) {
        start.disabled = false;
        Neko.ui.toast('Belum bisa mulai', niceError(error), 'warn', 'warning');
      }
    });
    const skip = inner.querySelector('[data-room-skip]');
    if (skip) skip.addEventListener('click', async () => {
      skip.disabled = true;
      try { await Neko.api.room.skip(view.pin); } catch (error) { Neko.ui.toast('Gagal', niceError(error), 'error', 'warning'); }
    });
    const leave = inner.querySelector('[data-room-leave]');
    if (leave) leave.addEventListener('click', async () => {
      await Neko.api.room.leave(view.pin).catch(() => {});
      state.pin = '';
      state.race = null;
      closeLayer();
    });
    const invite = inner.querySelector('[data-room-invite]');
    if (invite) invite.addEventListener('click', () => inviteSheet(view.pin));
  }

  async function refresh(pinValue) {
    try {
      const data = await Neko.api.room.state(pinValue);
      if (data && data.state) {
        state.view = data.state;
        if (data.rev) state.lastRev = data.rev;
        paintLayer();
      }
    } catch (error) {
      if (error && error.status === 404) { state.pin = ''; closeLayer(); }
    }
  }

  async function openRoom(pinValue, options = {}) {
    const target = String(pinValue || '').trim();
    if (!/^\d{6}$/.test(target)) {
      Neko.ui.toast('PIN tidak valid', 'PIN room terdiri atas enam angka.', 'warn', 'warning');
      return false;
    }
    state.pin = target;
    showLayer();
    if (options.silent) { refresh(target); return true; }
    try {
      const data = await Neko.api.room.state(target);
      state.view = data.state;
      paintLayer();
      if (!data.state.isMember) {
        await Neko.api.room.join(target);
        Neko.audio.play('success');
        const after = await Neko.api.room.state(target);
        state.view = after.state;
        paintLayer();
      }
      return true;
    } catch (error) {
      Neko.ui.toast('Room tidak bisa dibuka', niceError(error), 'error', 'warning');
      state.pin = '';
      state.view = null;
      closeLayer();
      return false;
    }
  }

  /* ---------------- undang teman ---------------- */

  async function inviteSheet(pinValue, kind) {
    let friends = [];
    try {
      const data = await Neko.api.friends.list();
      friends = (data.friends || []).filter(item => item && item.username);
    } catch (error) {
      Neko.ui.toast('Daftar teman', niceError(error), 'error', 'warning');
      return;
    }
    const chosen = new Set();
    const room = state.view;
    Neko.ui.sheet({
      kicker: 'UNDANGAN',
      title: kind === 'live' ? 'Undang teman ke Kelas Langsung' : 'Undang teman ke room mabar',
      body: '<div class="room-invite">' +
        '<p class="room-invite-hint">PIN ' + esc(pinValue) + ' — undangan masuk ke notifikasi mereka.</p>' +
        (friends.length ? '<div class="room-friend-list">' + friends.map(friend =>
          '<label class="room-friend" data-friend="' + esc(friend.username) + '">' +
          '<input type="checkbox"><b>' + esc(friend.displayName || friend.username) + '</b>' +
          '<small>@' + esc(friend.username) + '</small></label>').join('') + '</div>'
          : '<div class="room-empty">Belum punya teman di sini. Tambah teman lewat halaman Pesan.</div>') +
        '</div>',
      foot: '<button type="button" class="btn btn-soft" data-close>Batal</button>' +
        '<button type="button" class="btn btn-primary" data-send-invite' + (friends.length ? '' : ' disabled') + '>' + icon('send') + ' Kirim undangan</button>',
      onMount(el) {
        el.querySelectorAll('[data-friend]').forEach(row => {
          row.addEventListener('click', () => {
            const box = row.querySelector('input');
            box.checked = !box.checked;
            row.classList.toggle('on', box.checked);
            if (box.checked) chosen.add(row.dataset.friend);
            else chosen.delete(row.dataset.friend);
            Neko.audio.play('tick');
          });
        });
        const button = el.querySelector('[data-send-invite]');
        if (button) button.addEventListener('click', async () => {
          if (!chosen.size) { Neko.ui.toast('Pilih teman', 'Centang minimal satu teman.', 'warn', 'warning'); return; }
          button.disabled = true;
          try {
            const data = await Neko.api.room.invite(pinValue, Array.from(chosen), kind || 'game', room ? room.gameName : '');
            Neko.ui.toast('Undangan terkirim', data.message || (chosen.size + ' teman diundang.'), 'success', 'send');
            Neko.audio.play('success');
            Neko.ui.closeTop();
          } catch (error) {
            button.disabled = false;
            Neko.ui.toast('Undangan gagal', niceError(error), 'error', 'warning');
          }
        });
      }
    });
  }

  /* ---------------- realtime ---------------- */

  let listener = null;

  function subscribe() {
    if (!state.pin) return;
    if (!listener) {
      listener = message => onRoomMessage(message);
    }
    Neko.api.subscribeRoom(state.pin, listener);
    refresh(state.pin);
  }

  function unsubscribe() {
    if (listener) Neko.api.unsubscribeRoom(listener);
  }

  function onRoomMessage(message) {
    if (!message) return;
    if (message.type === 'room-closed') {
      state.pin = '';
      state.race = null;
      closeLayer();
      Neko.ui.toast('Room ditutup', 'Pembuat room mengakhiri sesi.', 'info', 'exit');
      return;
    }
    if (message.state) {
      state.view = message.state;
      if (message.rev) state.lastRev = message.rev;
      if (state.layer && state.layer.isConnected) paintLayer();
      else if (state.pin) showLayer();
    }
    if (message.type === 'room-round' && message.board) {
      state.lastBoard = message.board;
      Neko.audio.play('success');
    }
    if (message.type === 'room-start-round') startRace(message.round);
    if (message.finished) {
      state.race = null;
      Neko.audio.play('win');
    }
  }

  function startRace(round) {
    const view = state.view;
    if (!view || !view.isMember) return;
    if (!view.players.some(player => player.username && isSelf(player) && player.connected)) return;
    state.pendingRound = Number(round) || 1;
    if (Neko.arena && Neko.arena.active) return; // sesi sebelumnya belum selesai
    launchRound(state.pendingRound);
  }

  function launchRound(round) {
    const view = state.view;
    if (!view) return;
    state.pendingRound = 0;
    state.race = { round, submitted: false, sessionId: '' };
    const config = {
      rounds: view.config.sessionRounds || 5,
      level: LEVEL_KEYS[view.config.level] || 'normal',
      players: view.players.length
    };
    // spy-v2 dimainkan bergiliran tanpa peluncuran sesi arena biasa
    if (view.game === 'spyv2') {
      Neko.ui.toast('Who Is The Spy', 'Bergiliran di satu perangkat — mainkan di layar host, skor dikirim tiap putaran.', 'info', 'spy');
      state.race.submitted = true;
      if (Neko.arena) Neko.arena.quickStart('spy-v2');
      return;
    }
    Neko.arena.start(view.game, config);
    Neko.ui.toast('Ronde ' + round + ' mulai', 'Main sekarang — skor terkirim saat sesi selesai.', 'info', 'bolt');
  }

  document.addEventListener('neko:game-score', async event => {
    const detail = event.detail || {};
    if (!state.race || state.race.submitted) return;
    if (!state.pin) return;
    state.race.submitted = true;
    state.race.sessionId = detail.sessionId || '';
    const bestStat = (detail.stats || [])[0];
    try {
      const data = await Neko.api.room.score(state.pin, state.race.round, detail.score || 0, Boolean(detail.won), bestStat ? bestStat.label + ': ' + bestStat.value : '');
      Neko.ui.toast('Skor ronde ' + state.race.round, (detail.score || 0) + ' poin masuk' + (data && data.waiting ? ' · ' + data.waiting + ' pemain masih bermain' : '.'), 'success', 'trophy');
    } catch (error) {
      Neko.ui.toast('Skor tertahan', niceError(error), 'warn', 'warning');
      state.race.submitted = false;
    }
    // setelah mengirim, buka lagi lapisan room sambil menunggu ronde berikutnya
    window.setTimeout(() => {
      if (state.pin) showLayer();
      if (state.pendingRound && !(Neko.arena && Neko.arena.active)) launchRound(state.pendingRound);
    }, 320);
  });

  /* ============================================================
     NOBAR — nonton bareng YouTube
     Layar besar di atas, penonton di bawah, chat untuk yang
     tidak on mic, mute/volume per orang via tekan lama avatar.
     ============================================================ */

  const nobar = {
    layer: null, id: '', view: null, mutedOthers: new Map(), chatLog: [], micOn: false, big: false,
    fullscreen: false, searchResults: [], searchQuery: '', searching: false, tab: 'chat'
  };

  function ytId(url) {
    const m = String(url || '').match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : '';
  }

  async function nobarCreate() {
    if (!Neko.api.online) { Neko.ui.toast('Butuh server', 'Nobar lewat server NEKO.', 'error', 'warning'); return; }
    Neko.ui.sheet({
      kicker: 'NOBAR', title: 'Nonton bareng YouTube',
      sub: 'Cari video langsung di YouTube, semua yang join melihat layar sama.',
      body: '<div class="nobar-pick">' +
        '<label class="field"><span>Cari video di YouTube</span><input id="nobarSearch" placeholder="mis. lofi study beats…" autocomplete="off"></label>' +
        '<div class="nobar-pick-results" data-pick-results><div class="nobar-pick-empty">Ketik lalu tekan Enter untuk mencari.</div></div>' +
        '<label class="field nobar-pick-url"><span>Atau tempel tautan / ID video</span><input id="nobarUrl" placeholder="https://youtube.com/watch?v=…" autocomplete="off"></label>' +
        '<div class="setup-choice" data-privacy>' +
        '<button type="button" class="on" data-privacy-pick="public">Publik<small>Terlihat di daftar room</small></button>' +
        '<button type="button" data-privacy-pick="private">Privat<small>Hanya lewat undangan</small></button>' +
        '</div>' +
        '<div class="setup-choice" data-control>' +
        '<button type="button" class="on" data-control-pick="host">Host saja<small>Yang buat room atur video</small></button>' +
        '<button type="button" data-control-pick="all">Semua orang<small>Semua bisa ganti & atur video</small></button>' +
        '</div>' +
        '</div>',
      foot: '<button type="button" class="btn btn-soft" data-sheet-close>Batal</button>' +
        '<button type="button" class="btn btn-primary" data-nobar-go>' + icon('live') + ' Buat nobar</button>',
      onMount(el) {
        let privacy = 'public';
        let control = 'host';
        const searchInput = el.querySelector('#nobarSearch');
        const resultsBox = el.querySelector('[data-pick-results]');
        const doSearch = async () => {
          const q = searchInput.value.trim();
          if (!q) return;
          resultsBox.innerHTML = '<div class="nobar-pick-empty">Mencari…</div>';
          try {
            const data = await Neko.api.request('/api/nobar/search?q=' + encodeURIComponent(q));
            const results = (data && data.results) || [];
            if (!results.length) { resultsBox.innerHTML = '<div class="nobar-pick-empty">Tidak ada hasil.</div>'; return; }
            resultsBox.innerHTML = results.map(r =>
              '<button type="button" class="nobar-pick-item" data-pick-id="' + esc(r.id) + '" data-pick-title="' + esc(r.title) + '">' +
              (r.thumb ? '<img src="' + esc(r.thumb) + '" alt="" loading="lazy">' : '') +
              '<span><b>' + esc(r.title) + '</b><small>' + esc(r.channel) + (r.length ? ' · ' + esc(r.length) : '') + '</small></span></button>').join('');
            resultsBox.querySelectorAll('[data-pick-id]').forEach(button => button.addEventListener('click', () => {
              resultsBox.querySelectorAll('.nobar-pick-item').forEach(n => n.classList.remove('on'));
              button.classList.add('on');
              el.querySelector('#nobarUrl').value = button.dataset.pickId;
              Neko.audio.play('select');
            }));
          } catch (error) {
            resultsBox.innerHTML = '<div class="nobar-pick-empty">Pencarian gagal — pakai tautan saja.</div>';
          }
        };
        searchInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); doSearch(); } });
        el.querySelector('[data-privacy]').addEventListener('click', event => {
          const b = event.target.closest('[data-privacy-pick]');
          if (!b) return;
          privacy = b.dataset.privacyPick;
          el.querySelectorAll('[data-privacy-pick]').forEach(n => n.classList.toggle('on', n === b));
        });
        el.querySelector('[data-control]').addEventListener('click', event => {
          const b = event.target.closest('[data-control-pick]');
          if (!b) return;
          control = b.dataset.controlPick;
          el.querySelectorAll('[data-control-pick]').forEach(n => n.classList.toggle('on', n === b));
        });
        el.querySelector('[data-nobar-go]').addEventListener('click', async () => {
          const url = String(el.querySelector('#nobarUrl').value || '').trim();
          if (!ytId(url)) { Neko.ui.toast('Pilih video dulu', 'Cari video atau tempel tautan YouTube.', 'warn', 'warning'); return; }
          const button = el.querySelector('[data-nobar-go]');
          button.disabled = true;
          try {
            const data = await Neko.api.request('/api/nobar/create', { method: 'POST', body: { video: url, public: privacy === 'public', control } });
            Neko.ui.closeTop();
            nobar.id = data.state.id;
            nobar.view = data.state;
            nobar.chatLog = [];
            openNobarLayer();
            subscribeNobar();
          } catch (error) {
            button.disabled = false;
            Neko.ui.toast('Gagal', niceError(error), 'error', 'warning');
          }
        });
      }
    });
  }

  function openNobarLayer() {
    if (nobar.layer && nobar.layer.isConnected) { paintNobar(); return; }
    const layer = document.createElement('div');
    layer.className = 'room-layer is-open nobar-layer';
    layer.innerHTML = '<div class="room-shell"><div class="nobar-inner" data-nobar-inner></div></div>';
    document.body.appendChild(layer);
    document.body.style.overflow = 'hidden';
    nobar.layer = layer;
    /* suara aplikasi (SFX + musik) hilang total saat nobar */
    if (Neko.audio.enterWatchParty) Neko.audio.enterWatchParty();
    paintNobar();
  }

  function nobarToggleFullscreen() {
    const screen = nobar.layer && nobar.layer.querySelector('.nobar-screen');
    if (!screen) return;
    Neko.audio.play('tap');
    if (document.fullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    const req = screen.requestFullscreen || screen.webkitRequestFullscreen;
    if (req) { try { req.call(screen); } catch (error) { screen.classList.add('is-fs'); } }
    else screen.classList.add('is-fs');
  }

  document.addEventListener('fullscreenchange', () => {
    const screen = nobar.layer && nobar.layer.querySelector('.nobar-screen');
    const on = Boolean(document.fullscreenElement);
    if (screen) screen.classList.toggle('is-fs', on);
    const btn = nobar.layer && nobar.layer.querySelector('[data-nobar-full]');
    if (btn) btn.innerHTML = icon(on ? 'shrink' : 'expand') + '<span>' + (on ? 'Keluar layar penuh' : 'Layar penuh') + '</span>';
  });

  function nobarSearch(query) {
    const box = nobar.layer && nobar.layer.querySelector('[data-nobar-results]');
    if (!box || !String(query).trim()) return;
    box.innerHTML = '<div class="nobar-search-empty">Mencari…</div>';
    Neko.api.request('/api/nobar/search?q=' + encodeURIComponent(String(query).trim())).then(data => {
      const results = (data && data.results) || [];
      if (!results.length) { box.innerHTML = '<div class="nobar-search-empty">Tidak ada hasil.</div>'; return; }
      box.innerHTML = results.map(r =>
        '<button type="button" class="nobar-pick-item" data-play-id="' + esc(r.id) + '">' +
        (r.thumb ? '<img src="' + esc(r.thumb) + '" alt="" loading="lazy">' : '') +
        '<span><b>' + esc(r.title) + '</b><small>' + esc(r.channel) + (r.length ? ' · ' + esc(r.length) : '') + '</small></span></button>').join('');
      box.querySelectorAll('[data-play-id]').forEach(button => button.addEventListener('click', () => {
        if (!nobar.view || !nobar.view.canControl) { Neko.ui.toast('Tidak diizinkan', 'Host belum membuka izin atur video.', 'warn', 'lock'); return; }
        Neko.audio.play('select');
        sendSocket({ type: 'nobar-video', id: nobar.id, user: ((Neko.store.session || {}).username || ''), video: button.dataset.playId });
        box.querySelectorAll('.nobar-pick-item').forEach(n => n.classList.remove('on'));
        button.classList.add('on');
      }));
    }).catch(() => { box.innerHTML = '<div class="nobar-search-empty">Pencarian gagal. Coba lagi.</div>'; });
  }

  function closeNobarLayer() {
    const layer = nobar.layer;
    nobar.layer = null;
    if (nobar.id) Neko.api.nobar.leave(nobar.id).catch(() => {});
    nobar.id = '';
    /* suara aplikasi kembali saat keluar nobar */
    if (Neko.audio.exitWatchParty) Neko.audio.exitWatchParty();
    if (!layer) return;
    layer.remove();
    document.body.style.overflow = '';
  }

  function paintNobar() {
    const inner = nobar.layer && nobar.layer.querySelector('[data-nobar-inner]');
    if (!inner) return;
    const view = nobar.view;
    if (!view) { inner.innerHTML = '<div class="room-loading">Memuat nobar…</div>'; return; }
    const videoId = ytId(view.video) || '';
    /* Kerangka dibuat sekali — pembaruan state tidak boleh me-reload iframe video. */
    if (!inner.querySelector('.nobar-video-wrap')) {
      inner.innerHTML =
        '<div class="nobar-video-col">' +
        '<header class="room-top nobar-top">' +
        '<button type="button" class="room-exit" data-nobar-exit>' + icon('exit') + '<span>Keluar</span></button>' +
        '<div class="room-top-title"><b>' + icon('live') + ' NOBAR</b><small data-nobar-meta></small></div>' +
        '<div class="nobar-top-actions">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-nobar-full>' + icon('expand') + '<span>Layar penuh</span></button>' +
        '</div>' +
        '</header>' +
        '<div class="nobar-video-wrap">' +
        '<div class="nobar-screen" data-nobar-screen>' +
        (videoId ? '<iframe id="nobar-frame" src="https://www.youtube.com/embed/' + esc(videoId) + '?autoplay=1&rel=0&vq=hd1080" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen frameborder="0"></iframe>' :
          '<div class="room-loading">Pilih video di panel kanan</div>') +
        '</div>' +
        '</div>' +
        '<div class="nobar-people" data-nobar-people></div>' +
        '</div>' +
        '<aside class="nobar-side">' +
        '<div class="nobar-side-tabs">' +
        '<button type="button" class="on" data-side-tab="chat">' + icon('chat') + ' Chat</button>' +
        '<button type="button" data-side-tab="search">' + icon('search') + ' Cari video</button>' +
        '</div>' +
        '<div class="nobar-side-panel" data-side-panel="chat">' +
        '<div class="nobar-chat-log" data-nobar-log></div>' +
        '<form class="nobar-compose" data-nobar-compose>' +
        '<input type="text" maxlength="300" placeholder="Ketik pesan…">' +
        '<button type="button" class="spv-mic" data-nobar-mic title="Mic">' + icon('microphone') + '</button>' +
        '<button type="submit" class="btn btn-primary btn-sm">' + icon('send') + '</button>' +
        '</form>' +
        '</div>' +
        '<div class="nobar-side-panel" data-side-panel="search" hidden>' +
        '<div class="nobar-search-box">' +
        '<input type="text" data-nobar-search-input placeholder="Cari di YouTube…" maxlength="80">' +
        '<button type="button" class="btn btn-primary btn-sm" data-nobar-search-go>' + icon('search') + '</button>' +
        '</div>' +
        '<div class="nobar-search-results" data-nobar-results><div class="nobar-search-empty">Ketik lalu tekan Enter. Hasil bisa langsung diputar untuk semua.</div></div>' +
        '</div>' +
        '</aside>';
      bindNobar(inner, view);
    }
    const myKey = ((Neko.store.session || {}).username || '').toLowerCase();
    const viewers = (view.viewers || []).map(v => {
      const muted = v.key === myKey ? nobar.micOn === false : nobar.mutedOthers.get(v.key) !== false && v.muted !== false;
      return '<button type="button" class="nobar-viewer" data-viewer="' + esc(v.key) + '" data-name="' + esc(v.name) + '">' +
        '<span class="nobar-avatar" style="--c:' + COLORS[(v.key || '').length % COLORS.length] + '">' + esc(initials(v.name)) + '</span>' +
        '<b>' + esc(v.name) + (v.isHost ? ' <i class="nobar-host-tag">' + icon('crown') + '</i>' : '') + '</b>' +
        '<i class="nobar-mic' + (muted ? ' is-muted' : '') + '">' + icon(muted ? 'volume-off' : 'microphone') + '</i>' +
        '</button>';
    }).join('');
    inner.querySelector('[data-nobar-meta]').textContent = (view.viewers || []).length + ' penonton · host ' + view.hostName + (view.canControl ? ' · kamu bisa atur' : '');
    inner.querySelector('[data-nobar-people]').innerHTML = viewers;
    const log = inner.querySelector('[data-nobar-log]');
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    log.innerHTML = nobar.chatLog.map(item => '<div class="nobar-chat-row"><b>' + esc(item.name) + '</b><span>' + esc(item.text) + '</span></div>').join('');
    if (atBottom || nobar.chatLog.length === 1) log.scrollTop = log.scrollHeight;
  }

  function bindNobar(inner, view) {
    inner.querySelector('[data-nobar-exit]').addEventListener('click', closeNobarLayer);
    inner.querySelector('[data-nobar-full]').addEventListener('click', nobarToggleFullscreen);
    const screen = inner.querySelector('[data-nobar-screen]');
    if (screen) screen.addEventListener('dblclick', nobarToggleFullscreen);
    /* tab sidebar ala Discord */
    inner.querySelector('.nobar-side-tabs').addEventListener('click', event => {
      const button = event.target.closest('[data-side-tab]');
      if (!button) return;
      inner.querySelectorAll('[data-side-tab]').forEach(n => n.classList.toggle('on', n === button));
      inner.querySelectorAll('[data-side-panel]').forEach(p => { p.hidden = p.dataset.sidePanel !== button.dataset.sideTab; });
      Neko.audio.play('tap');
      if (button.dataset.sideTab === 'search') {
        const input = inner.querySelector('[data-nobar-search-input]');
        if (input) input.focus();
      }
    });
    const searchGo = () => nobarSearch(inner.querySelector('[data-nobar-search-input]').value);
    inner.querySelector('[data-nobar-search-go]').addEventListener('click', searchGo);
    inner.querySelector('[data-nobar-search-input]').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); searchGo(); } });
    /* kontrol video via YouTube iframe API ringan: ganti video host/semua */
    if (view.isHost && view.viewers && view.viewers.length) {
      const actions = document.createElement('div');
      actions.className = 'nobar-host-actions';
      const mode = view.control === 'all' ? 'all' : 'host';
      actions.innerHTML =
        '<button type="button" class="btn btn-soft btn-sm" data-nobar-mode>' + icon('shield') + (mode === 'all' ? ' Semua bisa atur' : ' Hanya host') + '</button>' +
        '<button type="button" class="btn btn-soft btn-sm" data-nobar-sync-now>' + icon('refresh') + ' Sinkron semua</button>';
      const people = inner.querySelector('[data-nobar-people]');
      people.parentNode.insertBefore(actions, people);
      actions.querySelector('[data-nobar-mode]').addEventListener('click', () => {
        const next = view.control === 'all' ? 'host' : 'all';
        sendSocket({ type: 'nobar-control', id: nobar.id, user: (Neko.store.session || {}).username || '', mode: next });
        Neko.audio.play('select');
      });
      actions.querySelector('[data-nobar-sync-now]').addEventListener('click', () => {
        sendSocket({ type: 'nobar-sync', id: nobar.id, user: (Neko.store.session || {}).username || '', playing: nobar.playing !== false, position: nobar.currentTime || 0 });
        Neko.audio.play('tap');
        Neko.ui.toast('Sinkron', 'Posisi video dikirim ke semua penonton.', 'success', 'refresh');
      });
    }
    const micBtn = inner.querySelector('[data-nobar-mic]');
    if (micBtn) micBtn.addEventListener('click', () => {
      nobar.micOn = !nobar.micOn;
      micBtn.classList.toggle('listening', nobar.micOn);
      Neko.audio.play('tap');
      if (nobar.micOn) Neko.ui.toast('Mic aktif', 'Suaramu terdengar penonton lain.', 'success', 'microphone');
      paintNobar();
    });
    inner.querySelectorAll('[data-viewer]').forEach(node => {
      let pressTimer = null;
      const target = node.dataset.viewer;
      const me = (Neko.store.session || {}).username || '';
      const openActions = () => {
        const isMe = target === me;
        Neko.ui.sheet({
          kicker: 'PENONTON', title: node.dataset.name,
          body: '<div class="nobar-actions">' +
            (isMe || view.isHost ? '<button type="button" class="btn btn-soft btn-block" data-na-mute>' + icon('volume-off') + ' Mute' + (isMe ? ' diriku' : ' dia') + '</button>' : '') +
            (isMe ? '<label class="field"><span>Volume suaramu</span><input type="range" min="0" max="100" value="' + Math.round((nobar.mineVolume === undefined ? 1 : nobar.mineVolume) * 100) + '" data-na-vol></label>' : '') +
            '</div>',
          foot: '<button type="button" class="btn btn-primary" data-sheet-close>Tutup</button>',
          onMount(el) {
            const mute = el.querySelector('[data-na-mute]');
            if (mute) mute.addEventListener('click', () => {
              if (isMe) nobar.micOn = false;
              else nobar.mutedOthers.set(target, !(nobar.mutedOthers.get(target) !== false));
              Neko.audio.play('tap');
              Neko.ui.closeTop();
              paintNobar();
            });
            const vol = el.querySelector('[data-na-vol]');
            if (vol) vol.addEventListener('input', () => { nobar.mineVolume = Number(vol.value) / 100; });
          }
        });
      };
      node.addEventListener('click', () => { if (!pressTimer) openActions(); });
      node.addEventListener('pointerdown', () => {
        pressTimer = window.setTimeout(() => { pressTimer = 'long'; openActions(); pressTimer = null; }, 550);
      });
      ['pointerup', 'pointerleave'].forEach(evt => node.addEventListener(evt, () => {
        window.clearTimeout(pressTimer);
        pressTimer = null;
      }));
    });
    const compose = inner.querySelector('[data-nobar-compose]');
    if (compose) compose.addEventListener('submit', event => {
      event.preventDefault();
      const input = compose.querySelector('input');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      sendSocket({ type: 'nobar-chat', id: nobar.id, user: me, text });
    });
  }

  function sendSocket(payload) {
    if (Neko.api.sendNobar) Neko.api.sendNobar(payload);
  }

  let nobarListener = null;
  function subscribeNobar() {
    if (!nobarListener) {
      nobarListener = data => {
        if (!data || !nobar.id) return;
        if (data.type === 'nobar-state' && data.state && data.state.id === nobar.id) {
          const prevVideo = ytId(nobar.view ? nobar.view.video : '');
          nobar.view = data.state;
          if (nobar.layer && nobar.layer.isConnected) {
            /* ganti video hanya jika berubah — iframe tidak di-reload tiap update */
            const nextVideo = ytId(data.state.video || '');
            const frame = nobar.layer.querySelector('#nobar-frame');
            if (frame && nextVideo && nextVideo !== prevVideo) {
              frame.src = 'https://www.youtube.com/embed/' + nextVideo + '?autoplay=1&rel=0&vq=hd1080';
            }
            paintNobar();
          }
        }
        if (data.type === 'nobar-chat' && data.id === nobar.id) {
          nobar.chatLog.push({ name: data.name, text: data.text });
          if (nobar.chatLog.length > 60) nobar.chatLog.shift();
          paintNobar();
        }
      };
    }
    // nobar memakai kanal liveEvents; gunakan poll WS yang ada
    if (Neko.api.subscribeNobar) Neko.api.subscribeNobar(nobar.id, nobarListener);
  }

  /* ---------------- undangan dari notifikasi ---------------- */

  document.addEventListener('neko:event', event => {
    const item = event.detail || {};
    const data = item.data || {};
    if (item.type === 'room-invite') {
      state.inviteFrom = data;
      Neko.store.addNotification('Undangan mabar', (data.displayName || data.from) + ' mengundang ke PIN ' + data.pin, 'friend');
      Neko.ui.toast('Undangan mabar', (data.displayName || data.from) + ' mengundangmu (PIN ' + data.pin + ').', 'info', 'swords');
      Neko.audio.play('notify');
      if (Neko.app && Neko.app.currentView === 'mabar') paintInviteBanner(document.getElementById('view'));
      return;
    }
    if (item.type === 'room-join' && state.pin === data.pin) {
      Neko.audio.play('tick');
      refresh(data.pin);
      return;
    }
    if (item.type === 'room-finished') {
      Neko.store.addNotification('Hasil mabar', 'Room ' + data.pin + ' selesai — peringkat ' + (data.rank || '-') + ' dengan ' + (data.total || 0) + ' poin.', 'xp');
      if (Neko.store && Neko.store.hydrate) {
        Neko.api.restoreSession().then(fresh => {
          if (fresh) Neko.store.hydrate(fresh);
          if (Neko.app && Neko.app.refresh) Neko.app.refresh();
        }).catch(() => {});
      }
    }
  });

  document.addEventListener('neko:logout', () => {
    state.pin = '';
    state.view = null;
    state.race = null;
    closeLayer();
  });

  Neko.rooms = {
    render,
    bind,
    loadList,
    openRoom,
    async joinByPin(pinValue) {
      try {
        await Neko.api.room.join(pinValue);
        state.pin = String(pinValue);
        showLayer();
        Neko.audio.play('success');
        return true;
      } catch (error) {
        Neko.ui.toast('Gagal masuk room', niceError(error), 'error', 'warning');
        return false;
      }
    },
    inviteToLive(pinValue) { return inviteSheet(pinValue, 'live'); },
    get inRace() { return Boolean(state.race && !state.race.submitted); },
    get pin() { return state.pin; },
    get view() { return state.view; },
    stats() { return { pin: state.pin, round: state.race ? state.race.round : 0 }; }
  };
})();