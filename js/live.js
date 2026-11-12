/* ============================================================
   NEKO · js/live.js
   NEKO LIVE CLASS — kelas langsung multiplayer: guru membuat sesi,
   siswa bergabung lewat PIN enam angka dari perangkat masing-
   masing. Skor ditentukan kecepatan + ketepatan, papan peringkat
   live, podium akhir, dan XP tersimpan ke akun server.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { esc, clamp } = Neko.util;
  const { icon } = Neko.icons;

  const SHAPES = ['▲', '◆', '●', '■'];
  const SHAPE_NAMES = ['Segitiga', 'Belah ketupat', 'Lingkaran', 'Persegi'];

  let layer = null;
  let role = null; // 'host' | 'player'
  let pin = '';
  let serverSkew = 0;
  let timerRAF = null;
  let lastRev = -1;
  let lastState = null;
  let joinedKey = '';
  let myAnswer = null;
  let myChar = '';
  let joinPreview = null;
  let chosenChar = '';
  let joinTimer = null;
  let swapOpen = false;
  let setup = { level: 'Semua', topic: 'Semua', count: 8, seconds: 20 };

  const LEVELS = ['Semua', 'Mudah', 'Sedang', 'Sulit'];
  const TOPICS = ['Semua', 'Layanan', 'Perangkat', 'OSI', 'Media', 'Subnetting', 'IP', 'VLAN', 'Topologi', 'Protokol', 'Keamanan', 'Troubleshooting'];

  /* ---------------- Karakter (pack avatar) ---------------- */

  const pack = () => window.NekoAvatarPack || null;

  function takenMap(state) {
    const map = new Map();
    ((state && state.players) || []).forEach(player => { if (player.character) map.set(player.character, player.name); });
    return map;
  }

  function avatarHTML(player) {
    const lib = pack();
    if (lib && player && player.character && lib.has(player.character)) return lib.av(player.character, 'idle', 'live-svg');
    return esc(Neko.util.initials((player && player.name) || '?'));
  }

  function avatarSpanHTML(player, cls) {
    const lib = pack();
    const isImage = Boolean(lib && player && player.character && lib.has(player.character));
    return '<span class="' + cls + (isImage ? ' is-img' : '') + '">' + avatarHTML(player) + '</span>';
  }

  function charLabel(id) {
    const lib = pack();
    const found = lib && lib.AVATARS.find(a => a.id === id);
    return found ? found.name + ' · ' + found.label : 'Karakter belum dipilih';
  }

  function charPickerHTML(taken, selected, selfName) {
    const lib = pack();
    if (!lib) return '<p class="live-join-hint">Pack karakter belum termuat. Muat ulang halaman.</p>';
    return '<div class="live-char-packs">' + lib.PACKS.map(group => {
      const items = lib.AVATARS.filter(a => a.pack === group.id);
      return '<section class="live-char-group"><h4>' + esc(group.name) + '</h4><div class="live-char-grid">' + items.map(a => {
        const holder = taken.get(a.id);
        const blocked = Boolean(holder) && holder !== selfName;
        return '<button type="button" class="live-char' + (a.id === selected ? ' on' : '') + (blocked ? ' is-taken' : '') + '" data-char="' + a.id + '" aria-label="' + esc(a.name) + '"' + (blocked ? ' disabled' : '') + '>' +
          lib.av(a.id, 'happy', 'live-char-svg') + '<b>' + esc(a.name) + '</b>' +
          (blocked ? '<small>' + esc(holder) + '</small>' : '') +
          '</button>';
      }).join('') + '</div></section>';
    }).join('') + '</div>';
  }

  function bindCharPicker(scope, onPick) {
    scope.querySelectorAll('[data-char]').forEach(button => {
      button.addEventListener('click', () => {
        if (button.disabled) return;
        scope.querySelectorAll('[data-char]').forEach(node => node.classList.toggle('on', node === button));
        Neko.audio.play('tap');
        onPick(button.dataset.char);
      });
    });
  }

  function firstFreeCharacter(taken, selfName) {
    const lib = pack();
    if (!lib) return '';
    const free = lib.AVATARS.find(a => !taken.has(a.id) || taken.get(a.id) === selfName);
    return free ? free.id : '';
  }

  function closeSheetSafe() {
    if (Neko.ui && Neko.ui.openCount) {
      while (Neko.ui.openCount) Neko.ui.closeTop();
    }
  }

  function detachLayer() {
    if (timerRAF) window.cancelAnimationFrame(timerRAF);
    timerRAF = null;
    if (layer && layer.isConnected) layer.remove();
    layer = null;
  }

  function mount(inner, kind) {
    detachLayer();
    if (kind) role = kind;
    layer = document.createElement('div');
    layer.className = 'live-layer is-open';
    layer.innerHTML = inner;
    document.body.appendChild(layer);
    document.body.style.overflow = 'hidden';
    closeSheetSafe();
  }

  function unmount() {
    detachLayer();
    if (joinTimer) { window.clearInterval(joinTimer); joinTimer = null; }
    document.body.style.overflow = '';
    Neko.api.unsubscribeLive();
    pin = '';
    role = null;
    lastRev = -1;
    lastState = null;
    myAnswer = null;
    myChar = '';
    joinPreview = null;
    chosenChar = '';
    swapOpen = false;
  }

  function header(titleText, sub) {
    return (
      '<header class="live-bar">' +
      '<div class="live-bar-brand"><span class="live-bar-mark">' + icon('live') + '</span><div><b>' + esc(titleText) + '</b><small>' + esc(sub) + '</small></div></div>' +
      (pin ? '<div class="live-bar-pin"><span>PIN</span><strong>' + esc(pin) + '</strong></div>' : '') +
      '<button type="button" class="btn btn-ghost btn-sm" data-live-exit aria-label="Keluar sesi">' + icon('exit') + '<span class="btn-label-full">Keluar</span></button>' +
      '</header>'
    );
  }

  function paintLiveBar(titleText, sub) {
    if (!layer) return;
    const bar = layer.querySelector('.live-bar');
    if (!bar) return;
    bar.outerHTML = header(titleText, sub);
    bindExit();
  }

  function bindExit() {
    if (!layer) return;
    const exit = layer.querySelector('[data-live-exit]');
    if (exit) exit.addEventListener('click', () => {
      Neko.audio.play('tap');
      if (role === 'host' && pin) {
        Neko.api.request('/api/live/host', { method: 'POST', body: { pin, action: 'close' } }).catch(() => {});
      }
      unmount();
      if (Neko.app) Neko.app.refresh();
    });
  }

  /* ---------------- Pembuka: pilih peran ---------------- */

  function openChooser() {
    if (location.protocol === 'file:' || !Neko.api.online) {
      Neko.ui.toast('Kelas Langsung butuh server', 'Jalankan Mulai-NEKO.bat lalu buka http://alamat-server dari perangkat yang satu jaringan. Situs statis tanpa server tidak bisa mode ini.', 'error', 'warning');
      return;
    }
    const entry = Neko.ui.sheet({
      kicker: 'KELAS LANGSUNG',
      title: 'NEKO LIVE CLASS',
      sub: 'Satu layar jadi host, semua perangkat lain jadi pemain dengan PIN.',
      body:
        '<div class="live-chooser">' +
        '<button type="button" class="live-choose-card host" data-live-host><span class="live-choose-ic">' + icon('shield') + '</span><b>Buat Kelas</b><small>Jadi host: layar PIN, kendali soal, dan podium tampil di sini.</small></button>' +
        '<button type="button" class="live-choose-card player" data-live-player><span class="live-choose-ic">' + icon('bolt') + '</span><b>Masuk dengan PIN</b><small>Jadi pemain: jawab dari HP atau laptop sendiri secepat mungkin.</small></button>' +
        '</div>' +
        '<div class="live-chooser-tip">' + icon('info') + '<span>Semua pemain harus login akun NEKO agar skor &amp; XP tersimpan permanen.</span></div>',
      onMount(el) {
        el.querySelector('[data-live-host]').addEventListener('click', () => { Neko.audio.play('select'); entry.close(); window.setTimeout(openHostSetup, 240); });
        el.querySelector('[data-live-player]').addEventListener('click', () => { Neko.audio.play('select'); entry.close(); window.setTimeout(openJoin, 240); });
      }
    });
  }

  /* ---------------- Host: pengaturan ---------------- */

  function chipGroup(items, current, attr) {
    return '<div class="setup-choice live-chips" data-' + attr + '>' + items.map(item => (
      '<button type="button" class="' + (item === current ? 'on' : '') + '" data-' + attr + '-pick="' + esc(item) + '">' + esc(item) + '</button>'
    )).join('') + '</div>';
  }

  function openHostSetup() {
    pin = '';
    mount(
      header('Kelas Langsung · Setelan', 'Pilih materi dan durasi soal') +
      '<div class="live-body setup">' +
      '<section class="setup-section"><span class="setup-label">Tingkat soal</span>' + chipGroup(LEVELS, setup.level, 'level') + '</section>' +
      '<section class="setup-section"><span class="setup-label">Topik</span>' + chipGroup(TOPICS, setup.topic, 'topic') + '</section>' +
      '<section class="setup-section"><span class="setup-label">Jumlah soal</span>' + chipGroup([5, 8, 10, 15], setup.count, 'count') + '</section>' +
      '<section class="setup-section"><span class="setup-label">Waktu per soal</span>' + chipGroup([10, 20, 30], setup.seconds, 'seconds') + '</section>' +
      '<div class="live-note">' + icon('info') + '<span>Sistem skor Kelas Langsung: jawab benar mendapat 500–1000 poin, makin cepat makin besar; +25 bonus tiap soal benar beruntun.</span></div>' +
      '<button type="button" class="btn btn-primary btn-block live-start" data-live-create>' + icon('play') + 'Buat sesi & tampilkan PIN</button>' +
      '</div>',
      'host'
    );
    bindExit();
    layer.querySelectorAll('[data-level-pick]').forEach(b => b.addEventListener('click', () => { setup.level = b.dataset.levelPick; paintActive(b); }));
    layer.querySelectorAll('[data-topic-pick]').forEach(b => b.addEventListener('click', () => { setup.topic = b.dataset.topicPick; paintActive(b); }));
    layer.querySelectorAll('[data-count-pick]').forEach(b => b.addEventListener('click', () => { setup.count = Number(b.dataset.countPick); paintActive(b); }));
    layer.querySelectorAll('[data-seconds-pick]').forEach(b => b.addEventListener('click', () => { setup.seconds = Number(b.dataset.secondsPick); paintActive(b); }));
    layer.querySelector('[data-live-create]').addEventListener('click', async event => {
      const btn = event.currentTarget;
      btn.classList.add('btn-loading');
      btn.disabled = true;
      try {
        const data = await Neko.api.live.create({ level: setup.level, topic: setup.topic, count: setup.count });
        pin = data.pin;
        Neko.audio.play('go');
        renderHostLobby();
        Neko.api.subscribeLive(pin, onLiveMessage);
      } catch (error) {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
        Neko.ui.toast('Gagal membuat kelas', error.message || 'Coba lagi.', 'error', 'warning');
      }
    });
  }

  function paintActive(button) {
    const group = button.parentElement;
    group.querySelectorAll('button').forEach(node => node.classList.toggle('on', node === button));
    Neko.audio.play('tap');
  }

  /* ---------------- Pemain: masuk PIN ---------------- */

  function openJoin() {
    const session = Neko.store.session || { displayName: 'Pemain' };
    pin = '';
    joinPreview = null;
    chosenChar = '';
    mount(
      header('Kelas Langsung · Gabung', 'Masukkan PIN dari layar guru') +
      '<div class="live-body join" id="playerBody">' +
      '<div class="live-join-as">' + icon('profile') + '<span>' + esc(session.displayName) + '<small>Poin masuk ke akun ini</small></span></div>' +
      '<div class="live-pin-input" id="livePinBox" aria-label="Enam angka PIN">' +
      [0, 1, 2, 3, 4, 5].map(i => '<b data-slot="' + i + '"></b>').join('') +
      '</div>' +
      '<input class="live-pin-real" id="livePinReal" inputmode="numeric" autocomplete="off" maxlength="6" aria-label="PIN">' +
      '<div class="live-char-wrap" id="charPick" hidden></div>' +
      '<button type="button" class="btn btn-primary btn-block live-start" data-live-join disabled>' + icon('login') + 'Gabung kelas</button>' +
      '<p class="live-join-hint">PIN enam angka, contoh: 4 1 9 2 6 0</p>' +
      '</div>',
      'player'
    );
    bindExit();
    const real = layer.querySelector('#livePinReal');
    const slots = layer.querySelectorAll('[data-slot]');
    const joinBtn = layer.querySelector('[data-live-join]');
    const box = layer.querySelector('#livePinBox');
    const wrap = layer.querySelector('#charPick');

    const sync = () => {
      joinBtn.disabled = !(real.value.length === 6 && chosenChar);
    };

    const paintPicker = () => {
      wrap.hidden = false;
      wrap.innerHTML =
        '<div class="live-char-head"><span class="setup-label">Pilih karaktermu</span><small>' + icon('users') + 'Karakter yang sudah dipakai pemain lain ditandai dan tidak bisa dipilih lagi.</small></div>' +
        charPickerHTML(takenMap(joinPreview), chosenChar, session.displayName);
      bindCharPicker(wrap, id => { chosenChar = id; sync(); });
      sync();
    };

    const loadRoom = async () => {
      const value = real.value;
      if (value.length !== 6) return;
      try {
        const snapshot = await Neko.api.live.state(value);
        if (real.value !== value) return;
        joinPreview = snapshot.state;
        const taken = takenMap(joinPreview);
        if (!chosenChar || (taken.has(chosenChar) && taken.get(chosenChar) !== session.displayName)) chosenChar = firstFreeCharacter(taken, session.displayName);
        paintPicker();
        if (!joinTimer) joinTimer = window.setInterval(() => { if (joinPreview && !pin) loadRoom(); }, 4000);
      } catch (error) {
        joinPreview = null;
        wrap.hidden = true;
        wrap.innerHTML = '';
        chosenChar = '';
        sync();
      }
    };

    const onInput = () => {
      const value = real.value.replace(/\D/g, '').slice(0, 6);
      const changed = value !== real.value;
      real.value = value;
      slots.forEach((slot, index) => {
        slot.textContent = value[index] || '';
        slot.classList.toggle('filled', Boolean(value[index]));
      });
      sync();
      if (value.length === 6 && !changed) loadRoom();
    };

    box.addEventListener('click', () => { real.focus(); box.classList.add('focus'); });
    real.addEventListener('input', onInput);
    real.addEventListener('blur', () => box.classList.remove('focus'));
    window.setTimeout(() => real.focus(), 350);
    joinBtn.addEventListener('click', async () => {
      joinBtn.classList.add('btn-loading');
      joinBtn.disabled = true;
      try {
        const data = await Neko.api.live.join(real.value.trim(), session.displayName, chosenChar);
        pin = data.pin;
        joinedKey = data.joinedKey || '';
        myChar = data.character || chosenChar;
        if (joinTimer) { window.clearInterval(joinTimer); joinTimer = null; }
        Neko.audio.play('success');
        Neko.api.subscribeLive(pin, onLiveMessage);
        const snapshot = await Neko.api.live.state(pin);
        lastState = snapshot.state;
        renderPlayerState(snapshot.state, true);
      } catch (error) {
        joinBtn.classList.remove('btn-loading');
        Neko.audio.play('error');
        const boxEl = layer ? layer.querySelector('#livePinBox') : null;
        if (boxEl) { boxEl.classList.add('shake'); window.setTimeout(() => boxEl.classList.remove('shake'), 450); }
        sync();
        if (/karakter/i.test(error.message || '')) {
          Neko.ui.toast('Karakter sudah diambil', error.message, 'error', 'warning');
          chosenChar = '';
          loadRoom();
        } else {
          Neko.ui.toast('Tidak bisa gabung', error.message || 'Periksa PIN lagi.', 'error', 'warning');
        }
      }
    });
  }

  /* ---------------- Pesan realtime ---------------- */

  function onLiveMessage(message) {
    if (!layer) return;
    if (message.type === 'live-closed') {
      Neko.ui.toast('Kelas ditutup', 'Host mengakhiri sesi Kelas Langsung.', 'info', 'megaphone');
      unmount();
      return;
    }
    if (message.type !== 'live-state') return;
    const state = role === 'host' ? (message.host || message.state) : message.state;
    if (!state) return;
    if (message.rev && message.rev <= lastRev && lastState) return;
    lastRev = message.rev || lastRev;
    serverSkew = (Number(state.serverNow) || Date.now()) - Date.now();
    const phaseChanged = !lastState || lastState.phase !== state.phase || lastState.index !== state.index;
    lastState = state;
    if (role === 'host') renderHostState(state, phaseChanged);
    else renderPlayerState(state, phaseChanged);
  }

  /* ---------------- Host state views ---------------- */

  function renderHostLobby() {
    mount(
      header('Kelas Langsung · Lobby', 'Siswa bergabung memakai PIN di bawah') +
      '<div class="live-body lobby-host" id="hostBody"></div>',
      'host'
    );
    bindExit();
    lastState = null;
    lastRev = -1;
    Neko.api.subscribeLive(pin, onLiveMessage);
  }

  function renderHostState(state, changed) {
    if (!layer) { renderHostLobby(); return; }
    const body = layer.querySelector('#hostBody');
    if (!body || !changed) { updateHostDynamic(state); return; }
    if (state.phase === 'lobby') {
      body.innerHTML =
        '<div class="live-pin-display"><span class="live-pin-label">MASUKKAN PIN INI</span><b>' + esc(state.pin) + '</b>' +
        '<small>Buka NEKO di perangkat siswa → Arena → Kelas Langsung → Masuk dengan PIN</small></div>' +
        '<div class="live-players-grid" id="hostPlayers"></div>' +
        '<button type="button" class="btn btn-primary btn-block live-start" data-host-start ' + (state.players.length ? '' : 'disabled') + '>' + icon('play') + 'Mulai ' + state.total + ' soal (' + state.players.length + ' pemain)</button>';
      body.querySelector('[data-host-start]').addEventListener('click', async () => {
        try { await Neko.api.live.host(pin, 'start', { seconds: setup.seconds }); } catch (error) { Neko.ui.toast('Gagal memulai', error.message, 'error', 'warning'); }
      });
      paintPlayers(state, body);
    } else if (state.phase === 'question') {
      body.innerHTML =
        '<div class="live-q-host">' + questionHTML(state) + '</div>' +
        '<div class="live-host-controls"><div class="live-answered" id="hostAnswered"></div>' +
        '<button type="button" class="btn btn-primary btn-block" data-host-reveal>' + icon('eye') + 'Tampilkan jawaban benar</button></div>';
      body.querySelector('[data-host-reveal]').addEventListener('click', async () => {
        try { await Neko.api.live.host(pin, 'reveal'); Neko.audio.play('select'); } catch (error) { /* abaikan */ }
      });
    } else if (state.phase === 'reveal') {
      body.innerHTML =
        '<div class="live-q-host">' + questionHTML(state, true) + '</div>' +
        '<div class="live-host-controls">' + miniLeaderHTML(state) +
        '<button type="button" class="btn btn-primary btn-block" data-host-next>' + icon('arrow-right') + (state.index >= state.total - 1 ? 'Lihat podium' : 'Soal berikutnya') + '</button></div>';
      body.querySelector('[data-host-next]').addEventListener('click', async () => {
        try { await Neko.api.live.host(pin, 'next', { seconds: setup.seconds }); Neko.audio.play('select'); } catch (error) { /* abaikan */ }
      });
    } else if (state.phase === 'finished') {
      body.innerHTML = '<div class="live-podium" id="livePodium"></div><div class="live-host-controls"><button type="button" class="btn btn-primary btn-block" data-host-again>' + icon('restart') + 'Main lagi dari awal</button></div>';
      paintPodium(body.querySelector('#livePodium'), state.leaderboard || []);
      body.querySelector('[data-host-again]').addEventListener('click', async () => {
        try { await Neko.api.live.host(pin, 'restart', { options: { level: setup.level, topic: setup.topic, count: setup.count } }); } catch (error) { /* abaikan */ }
      });
    }
    const hostBar = {
      lobby: ['Kelas Langsung · Lobby', 'Siswa bergabung memakai PIN di bawah'],
      question: ['Kelas Langsung · Soal ' + (state.index + 1) + '/' + state.total, state.players.length + ' pemain ikut serta'],
      reveal: ['Kelas Langsung · Pembahasan', 'Soal ' + (state.index + 1) + ' dari ' + state.total],
      finished: ['Kelas Langsung · Podium', 'Sesi selesai, XP sudah tersimpan']
    }[state.phase] || ['Kelas Langsung', ''];
    paintLiveBar(hostBar[0], hostBar[1]);
    updateHostDynamic(state);
  }

  function updateHostDynamic(state) {
    if (!layer) return;
    const body = layer.querySelector('#hostBody');
    if (!body) return;
    const players = body.querySelector('#hostPlayers');
    if (players) paintPlayersHTML(players, state);
    const startBtn = body.querySelector('[data-host-start]');
    if (startBtn) {
      startBtn.disabled = state.players.length === 0;
      startBtn.innerHTML = icon('play') + 'Mulai ' + state.total + ' soal (' + state.players.length + ' pemain)';
    }
    const answered = body.querySelector('#hostAnswered');
    if (answered) {
      const done = state.players.filter(p => p.answered).length;
      answered.innerHTML = '<span class="live-answered-pill">' + icon('users') + done + ' / ' + state.players.length + ' sudah jawab</span>' + timerPill(state);
    }
    const podium = body.querySelector('#livePodium');
    if (podium && (!podium.dataset.rendered)) paintPodium(podium, state.leaderboard || []);
  }

  function paintPlayers(state, scope) {
    const grid = scope.querySelector('#hostPlayers');
    if (grid) paintPlayersHTML(grid, state);
  }

  function paintPlayersHTML(grid, state) {
    grid.innerHTML = state.players.length
      ? state.players.map((p, index) => (
        '<div class="live-player-chip" style="--pi:' + index + '">' + avatarSpanHTML(p, 'live-player-avatar') + '<b>' + esc(p.name) + '</b>' + (p.character ? '' : '<small>tanpa karakter</small>') + '</div>'
      )).join('')
      : '<div class="live-empty-lobby"><span class="logo-mask" aria-hidden="true"></span>' + '<p>Menunggu siswa bergabung…<br><small>Bagikan PIN ' + esc(state.pin) + ' ke perangkat mereka.</small></p></div>';
    grid.dataset.count = state.players.length;
  }

  function miniLeaderHTML(state) {
    const rows = state.players.slice(0, 5);
    return '<div class="live-mini-leader">' + rows.map((p, index) => (
      '<div class="live-mini-row"><span class="live-mini-rank">' + (index + 1) + '</span>' + avatarSpanHTML(p, 'live-mini-avatar') + '<b>' + esc(p.name) + '</b><em>' + p.score + '</em></div>'
    )).join('') + '</div>';
  }

  /* ---------------- Pemain state views ---------------- */

  function renderPlayerState(state, changed) {
    if (!layer) return;
    const body = layer.querySelector('#playerBody');
    if (!body || !changed) { updatePlayerDynamic(state); return; }
    if (state.phase === 'lobby') {
      body.innerHTML =
        '<div class="live-pin-display small"><span class="live-pin-label">KAMU DIKUNCI DI KELAS</span><b>' + esc(state.pin) + '</b><small>Menunggu guru menekan Mulai…</small></div>' +
        '<div id="myCard"></div>' +
        '<div class="live-players-grid" id="playerList"></div>';
    } else if (state.phase === 'question') {
      myAnswer = null;
      body.innerHTML =
        '<div class="live-countdown">' + state.seconds + '</div>' +
        '<div class="live-q" id="liveQ"></div>' +
        '<div class="live-answers">' + state.question.o.map((text, index) => (
          '<button type="button" class="live-answer s' + index + '" data-choice="' + index + '">' +
          '<span class="live-shape">' + SHAPES[index] + '</span><span class="live-answer-text">' + esc(text) + '</span></button>'
        )).join('') + '</div>' +
        '<div class="live-waiting" id="liveWaiting" hidden>' + icon('check') + 'Terkirim! Menunggu pemain lain…</div>';
      bindAnswers(body);
    } else if (state.phase === 'reveal') {
      body.innerHTML =
        '<div class="live-q reveal" id="liveQ"></div>' +
        '<div class="live-reveal-strip" id="revealStrip"></div>' +
        '<div class="live-answers reveal">' + state.question.o.map((text, index) => (
          '<div class="live-answer s' + index + '" data-reveal-choice="' + index + '">' +
          '<span class="live-shape">' + SHAPES[index] + '</span><span class="live-answer-text">' + esc(text) + '</span><span class="live-tally" data-tally="' + index + '"></span></div>'
        )).join('') + '</div>';
      paintReveal(state);
    } else if (state.phase === 'finished') {
      body.innerHTML = '<div class="live-podium" id="livePodium"></div><p class="live-join-hint">XP Kelas Langsung otomatis tersimpan di akunmu.</p>';
      paintPodium(body.querySelector('#livePodium'), state.leaderboard || []);
      const session = Neko.store.session;
      const rank = (state.leaderboard || []).findIndex(entry => session && entry.name === session.displayName);
      Neko.audio.play(rank >= 0 && rank < 3 ? 'win' : 'success');
    }
    const barCopy = {
      lobby: ['Kelas Langsung · Menunggu guru', state.pin + ' · ' + charLabel(myChar)],
      question: ['Kelas Langsung · Soal ' + (state.index + 1) + '/' + state.total, 'Jawab sebelum waktu habis'],
      reveal: ['Kelas Langsung · Pembahasan', 'Soal ' + (state.index + 1) + ' dari ' + state.total],
      finished: ['Kelas Langsung · Podium', 'XP tersimpan otomatis di akunmu']
    }[state.phase] || ['Kelas Langsung', state.pin];
    paintLiveBar(barCopy[0], barCopy[1]);
    updatePlayerDynamic(state);
  }

  function bindAnswers(body) {
    body.querySelectorAll('[data-choice]').forEach(button => {
      button.addEventListener('click', () => {
        if (myAnswer !== null) return;
        const choice = Number(button.dataset.choice);
        myAnswer = choice;
        body.querySelectorAll('[data-choice]').forEach(node => node.classList.toggle('locked', node !== button));
        button.classList.add('picked');
        Neko.audio.play('select');
        if (Neko.fx) Neko.fx.haptic('soft');
        const timeMs = Math.max(0, Date.now() + serverSkew - (lastState.openedAt || Date.now()));
        Neko.api.sendLiveAnswer({ pin, choice, timeMs, joinedKey });
        const waiting = body.querySelector('#liveWaiting');
        if (waiting) waiting.hidden = false;
      });
    });
  }

  function updatePlayerDynamic(state) {
    if (!layer) return;
    const body = layer.querySelector('#playerBody');
    if (!body) return;
    if (state.phase === 'lobby') {
      paintMyCard(body, state);
      const list = body.querySelector('#playerList');
      if (list) list.innerHTML = state.players.map((p, index) => (
        '<div class="live-player-chip' + (isMe(p) ? ' is-me' : '') + '" style="--pi:' + index + '">' + avatarSpanHTML(p, 'live-player-avatar') + '<b>' + esc(p.name) + '</b></div>'
      )).join('');
      return;
    }
    if (state.phase === 'question') {
      const qBox = body.querySelector('#liveQ');
      if (qBox && !qBox.dataset.painted) {
        qBox.innerHTML = questionTextHTML(state);
        qBox.dataset.painted = '1';
      }
      const cd = body.querySelector('.live-countdown');
      if (cd) {
        const remaining = clamp(((state.openedAt + state.seconds * 1000) - (Date.now() + serverSkew)) / 1000, 0, state.seconds);
        cd.textContent = Math.ceil(remaining);
        cd.style.setProperty('--pct', ((remaining / state.seconds) * 100).toFixed(1) + '%');
        cd.classList.toggle('danger', remaining <= 5);
        if (remaining > 0) {
          if (!timerRAF) {
            const tick = () => {
              timerRAF = null;
              if (!layer || !lastState) return;
              if (lastState.phase !== 'question') return;
              const left = clamp(((lastState.openedAt + lastState.seconds * 1000) - (Date.now() + serverSkew)) / 1000, 0, lastState.seconds);
              const node = layer.querySelector('.live-countdown');
              if (node) {
                node.textContent = Math.ceil(left);
                node.style.setProperty('--pct', ((left / lastState.seconds) * 100).toFixed(1) + '%');
                node.classList.toggle('danger', left <= 5);
                if (Math.ceil(left) === 5 && node.dataset.beep !== '1') { node.dataset.beep = '1'; Neko.audio.play('count'); }
                if (Math.ceil(left) === 3 && node.dataset.beep2 !== '1') { node.dataset.beep2 = '1'; Neko.audio.play('count'); }
              }
              if (left > 0 && lastState.phase === 'question') timerRAF = window.requestAnimationFrame(tick);
            };
            timerRAF = window.requestAnimationFrame(tick);
          }
        }
      }
      return;
    }
    if (state.phase === 'reveal') paintReveal(state);
    if (state.phase === 'finished') {
      const podium = body.querySelector('#livePodium');
      if (podium && !podium.dataset.rendered) paintPodium(podium, state.leaderboard || []);
    }
  }

  function isMe(player) {
    const session = Neko.store.session;
    if (session && player.name === session.displayName) return true;
    return false;
  }

  function paintMyCard(body, state) {
    const slot = body.querySelector('#myCard');
    if (!slot) return;
    const session = Neko.store.session || { displayName: 'Pemain' };
    const me = state.players.find(isMe) || { name: session.displayName, character: myChar };
    const lib = pack();
    slot.innerHTML =
      '<div class="live-my-card">' +
      '<span class="live-my-avatar' + (lib && me.character ? ' is-img' : '') + '">' + (lib && me.character ? lib.av(me.character, 'happy', 'live-svg') : icon('profile')) + '</span>' +
      '<div class="live-my-id"><b>' + esc(me.name) + '</b><small>' + esc(charLabel(me.character)) + '</small></div>' +
      '<button type="button" class="btn btn-ghost btn-sm' + (swapOpen ? ' on' : '') + '" data-swap-char>' + icon(swapOpen ? 'close' : 'restart') + (swapOpen ? 'Tutup' : 'Ganti karakter') + '</button>' +
      '</div>' +
      '<div class="live-char-wrap"' + (swapOpen ? '' : ' hidden') + ' id="charSwap">' + (swapOpen ? charPickerHTML(takenMap(state), myChar, session.displayName) : '') + '</div>';
    slot.querySelector('[data-swap-char]').addEventListener('click', () => {
      swapOpen = !swapOpen;
      Neko.audio.play('tap');
      paintMyCard(body, state);
    });
    if (!swapOpen) return;
    bindCharPicker(slot, id => {
      Neko.api.live.setCharacter(pin, id, joinedKey).then(() => {
        myChar = id;
        swapOpen = false;
        Neko.audio.play('success');
        paintMyCard(body, lastState && lastState.phase === 'lobby' ? lastState : state);
      }).catch(error => {
        Neko.ui.toast('Karakter sudah diambil', error.message || 'Pilih karakter lain.', 'error', 'warning');
        paintMyCard(body, lastState && lastState.phase === 'lobby' ? lastState : state);
      });
    });
  }

  function paintReveal(state) {
    if (!layer) return;
    const body = layer.querySelector('#playerBody');
    if (!body) return;
    const qBox = body.querySelector('#liveQ');
    if (qBox && !qBox.dataset.painted) { qBox.innerHTML = questionTextHTML(state); qBox.dataset.painted = '1'; }
    const correct = state.question.a;
    body.querySelectorAll('[data-reveal-choice]').forEach(node => {
      const index = Number(node.dataset.revealChoice);
      node.classList.toggle('correct', index === correct);
      const tally = node.querySelector('[data-tally]');
      if (tally && state.question.tally) tally.textContent = state.question.tally[index] + (state.question.tally[index] === 1 ? ' orang' : ' orang');
    });
    const strip = body.querySelector('#revealStrip');
    if (strip && state.players) {
      const me = state.players.find(p => isMe(p));
      const points = me ? (me.lastPoints || 0) : 0;
      const got = points > 0;
      strip.innerHTML =
        '<div class="live-result-pop ' + (got ? 'win' : 'lose') + '">' +
        (got ? icon('trophy') + 'Benar! +' + points + ' poin' : icon('x-circle') + (myAnswer === null ? 'Tepat waktu… tapi kamu tidak menjawab' : 'Belum tepat, semangat!')) +
        '</div>' +
        (state.answeredCount !== undefined ? '<div class="live-tally-note">' + icon('users') + state.answeredCount + ' pemain menjawab</div>' : '');
    }
    const note = state.question.e;
    if (note) {
      const existing = body.querySelector('.live-explain');
      if (!existing) {
        const el = document.createElement('div');
        el.className = 'live-explain';
        el.innerHTML = icon('info') + '<span>' + esc(note) + '</span>';
        body.querySelector('.live-answers').after(el);
      }
    }
  }

  /* ---------------- Potongan HTML bersama ---------------- */

  function timerPill(state) {
    if (state.phase !== 'question') return '';
    const remaining = clamp(((state.openedAt + state.seconds * 1000) - (Date.now() + serverSkew)) / 1000, 0, state.seconds);
    return '<span class="live-answered-pill timer">' + icon('clock') + Math.ceil(remaining) + 's</span>';
  }

  function questionTextHTML(state) {
    return (
      '<span class="live-q-kicker">' + esc(state.question.topic || 'TJKT') + ' · ' + esc(state.question.level || '') + ' · Soal ' + (state.index + 1) + '/' + state.total + '</span>' +
      '<h2 class="live-q-text">' + esc(state.question.q) + '</h2>'
    );
  }

  function questionHTML(state, showAnswer) {
    const q = state.question;
    return (
      '<div class="live-q">' + questionTextHTML(state) + '</div>' +
      '<div class="live-answers host reveal">' + q.o.map((text, index) => (
        '<div class="live-answer s' + index + (showAnswer && index === q.a ? ' correct' : '') + '">' +
        '<span class="live-shape">' + SHAPES[index] + '</span><span class="live-answer-text">' + esc(text) + '</span>' +
        (showAnswer && q.tally ? '<span class="live-tally">' + q.tally[index] + ' jawab</span>' : '') +
        '</div>'
      )).join('') + '</div>'
    );
  }

  function paintPodium(box, leaderboard) {
    if (!box) return;
    box.dataset.rendered = '1';
    const order = [1, 0, 2];
    const podium = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3, 9);
    box.innerHTML =
      '<div class="live-podium-stage">' +
      order.map(pos => {
        const entry = podium[pos];
        if (!entry) return '';
        const heights = [220, 160, 120];
        return '<div class="live-pod pos-' + (pos + 1) + '" style="--h:' + heights[pos] + 'px">' +
          avatarSpanHTML(entry, 'live-pod-avatar') +
          '<b class="live-pod-name">' + esc(entry.name) + '</b>' +
          '<span class="live-pod-score">' + entry.score + ' poin</span>' +
          '<div class="live-pod-block">' + (pos + 1) + '</div></div>';
      }).join('') +
      '</div>' +
      (rest.length ? '<div class="live-rest">' + rest.map((entry, index) => (
        '<div class="live-rest-row"><span>' + (index + 4) + '</span>' + avatarSpanHTML(entry, 'live-mini-avatar') + '<b>' + esc(entry.name) + '</b><em>' + entry.score + '</em></div>'
      )).join('') + '</div>' : '');
    const me = leaderboard.findIndex(entry => {
      const session = Neko.store.session;
      return session && entry.name === session.displayName;
    });
    if (me >= 0 && me < 3) {
      Neko.ui.confetti(window.innerWidth / 2, window.innerHeight * 0.4, 60);
    }
  }

  /* ---------------- Bind global (dipanggil dari arena/home) ---------------- */

  function boot() {
    document.addEventListener('neko:app-start', () => {
      if (Neko.fx) Neko.fx.unlock();
    });
  }

  boot();

  Neko.live = {
    openChooser,
    openHostSetup,
    openJoin,
    unsubscribe() { Neko.api.unsubscribeLive(); },
    get isActive() { return Boolean(layer); },
    close: unmount
  };
})();
