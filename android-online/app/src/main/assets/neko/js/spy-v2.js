/* ============================================================
   NEKO · js/spy-v2.js
   WHO IS THE SPY 2.0 — tampilan baru, penuh warna & fun.
   Alur: lobi pemain (undang teman) → kartu kata → giliran
   (chat ATAU suara) → diskusi → voting → hasil.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { esc, initials } = Neko.util;
  const { icon } = Neko.icons;

  Neko.games = Neko.games || {};

  const STORAGE_KEY = 'neko_spy_v2_roster';
  const COLORS = ['#f97316', '#a855f7', '#22c55e', '#ec4899', '#0ea5e9', '#eab308', '#14b8a6', '#f43f5e'];

  let players = [];
  let rounds = 1;
  let round = 1;
  let score = 0;
  let history = [];
  let spyIndex = 0;
  let civWord = '';
  let spyClue = '';
  let chatLog = [];
  let voiceOn = true;

  function sound(name) { try { Neko.audio.play(name); } catch (error) { /* abaikan */ } }

  function say(text) {
    if (!voiceOn || !Neko.voice || !Neko.voice.enabled()) return;
    try { Neko.voice.say(text, 'miko'); } catch (error) { /* abaikan */ }
  }

  function speechSupported() {
    return typeof webkitSpeechRecognition !== 'undefined' || typeof SpeechRecognition !== 'undefined';
  }

  function createRecognition(onResult) {
    const Ctor = typeof SpeechRecognition !== 'undefined' ? SpeechRecognition : webkitSpeechRecognition;
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = 'id-ID';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    rec.onresult = event => {
      const text = String(event.results[0][0].transcript || '').trim();
      if (text) onResult(text);
    };
    return rec;
  }

  function readSaved() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (error) { return null; }
  }

  function saveSaved(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (error) { /* abaikan */ }
  }

  function selfName() {
    return (Neko.store && Neko.store.session && Neko.store.session.displayName) || 'Kamu';
  }

  /* ---------------- Lobi ---------------- */

  function renderLobby(ctx) {
    if (!players.length) {
      players = [{ id: 'p1', name: selfName() }];
      const saved = readSaved();
      if (saved && Array.isArray(saved.names)) {
        saved.names.slice(0, 7).forEach((name, i) => {
          if (players.length < ctx.meta.players) players.push({ id: 'p' + (i + 2), name: String(name || 'Pemain ' + (i + 2)) });
        });
      }
    }
    rounds = Math.max(1, Number(ctx.config && ctx.config.rounds) || 1);

    const chips = players.map((p, i) =>
      '<div class="spv-lobby-player" style="--c:' + COLORS[i % COLORS.length] + '">' +
      '<span class="spv-lobby-avatar">' + esc(initials(p.name)) + '</span>' +
      '<b>' + esc(p.name) + '</b>' +
      (i === 0 ? '<small>host</small>' : '<button type="button" class="spv-remove" data-remove="' + i + '" title="Keluarkan">' + icon('close') + '</button>') +
      '</div>').join('');

    const stage = ctx.setStage(
      '<div class="spv-wrap">' +
      '<div class="spv-hero">' +
      '<span class="spv-hero-badge">' + icon('spy') + 'WHO IS THE SPY 2.0</span>' +
      '<h2>Siapa Mata-Matanya?</h2>' +
      '<p>Satu pemain punya kata yang berbeda. Jelaskan pakai <b>chat atau suara</b>, lalu tangkap penyusupnya!</p>' +
      '</div>' +
      '<div class="spv-lobby-grid">' + chips +
      (players.length < ctx.meta.players ? '<button type="button" class="spv-lobby-add" data-add><span>+</span><b>Tambah pemain</b></button>' : '') +
      '</div>' +
      '<div class="spv-rounds"><span class="setup-label">Jumlah putaran</span><div class="spv-seg" data-rounds>' +
      [1, 2, 3].map(n => '<button type="button" class="spv-seg-btn' + (n === rounds ? ' on' : '') + '" data-rounds-pick="' + n + '">' + n + '</button>').join('') +
      '</div></div>' +
      (speechSupported()
        ? '<label class="spv-voice-toggle"><input type="checkbox" data-voice-toggle ' + (voiceOn ? 'checked' : '') + '><span>' + icon('microphone') + ' Input suara aktif (bicara ke mikrofon)</span></label>'
        : '') +
      '<button type="button" class="btn btn-primary btn-block spv-start"' + (players.length < (ctx.meta.minPlayers || 3) ? ' disabled' : '') + '>' +
      icon('play') + (players.length < 3 ? ' Butuh minimal 3 pemain' : ' Mulai Petualangan') + '</button>' +
      '</div>'
    );

    stage.querySelectorAll('[data-rounds-pick]').forEach(button => button.addEventListener('click', () => {
      rounds = Number(button.dataset.roundsPick);
      stage.querySelectorAll('[data-rounds-pick]').forEach(node => node.classList.toggle('on', node === button));
      sound('tick');
    }));
    const voiceToggle = stage.querySelector('[data-voice-toggle]');
    if (voiceToggle) voiceToggle.addEventListener('change', () => {
      voiceOn = voiceToggle.checked;
      sound('tap');
    });
    const add = stage.querySelector('[data-add]');
    if (add) add.addEventListener('click', () => {
      players.push({ id: 'p' + Date.now().toString(36), name: 'Pemain ' + (players.length + 1) });
      sound('select');
      persist();
      renderLobby(ctx);
    });
    stage.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
      players.splice(Number(button.dataset.remove), 1);
      sound('tap');
      persist();
      renderLobby(ctx);
    }));
    stage.querySelector('.spv-start').addEventListener('click', () => {
      players.forEach((p, i) => { p.name = String(p.name || '').trim() || 'Pemain ' + (i + 1); });
      persist();
      sound('go');
      startRound(ctx);
    });
  }

  function persist() {
    saveSaved({ names: players.map(p => p.name) });
  }

  /* ---------------- Ronde: bagikan kartu, giliran ---------------- */

  function startRound(ctx) {
    chatLog = [];
    const categories = (window.NEK_SPY && window.NEK_SPY.categories) || [];
    if (!categories.length) {
      ctx.finish({ title: 'Data kata belum ada', message: 'data/spy-words.js belum termuat.', score: 0, won: false, xp: 0, stats: [] });
      return;
    }
    const category = categories[Math.floor(Math.random() * categories.length)];
    const pair = category.pairs[Math.floor(Math.random() * category.pairs.length)];
    civWord = pair[0];
    spyClue = pair[1];
    spyIndex = Math.floor(Math.random() * players.length);
    round = Math.max(round, 1);
    dealCards(ctx);
  }

  function dealCards(ctx) {
    let viewer = 0;
    sound('reveal');
    const next = () => {
      if (viewer >= players.length) { turnLoop(ctx); return; }
      const p = players[viewer];
      const isSpy = viewer === spyIndex;
      Promise.resolve(ctx.pass(
        '<div class="spv-pass">' +
        '<span class="spv-pass-avatar" style="--c:' + COLORS[viewer % COLORS.length] + '">' + esc(initials(p.name)) + '</span>' +
        '<small>GILIRAN ' + (viewer + 1) + ' DARI ' + players.length + '</small>' +
        '<h2>Oper ke ' + esc(p.name) + '</h2>' +
        '</div>', p.name, 'Lihat kartu rahasiamu.'
      )).then(() => showCard(ctx, viewer, isSpy, () => { viewer += 1; next(); }));
    };
    next();
  }

  function showCard(ctx, index, isSpy, done) {
    const p = players[index];
    ctx.setStage(
      '<div class="spv-wrap spv-card-wrap">' +
      '<span class="spv-kicker" style="--c:' + COLORS[index % COLORS.length] + '">' + esc(p.name) + '</span>' +
      '<button type="button" class="spv-secret ' + (isSpy ? 'is-spy' : '') + '" data-flip>' +
      '<span class="spv-secret-face front"><span class="spv-secret-ic">' + icon('eye') + '</span><b>Kartu Rahasia</b><small>ketuk untuk membuka</small></span>' +
      '<span class="spv-secret-face back">' +
      (isSpy ? '<span class="spv-spy-tag">' + icon('spy') + 'MATA-MATA</span><strong class="spv-word">' + esc(spyClue) + '</strong><small>Petunjukmu berbeda — jangan ketahuan!</small>' :
        '<span class="spv-civ-tag">' + icon('users') + 'WARGA</span><strong class="spv-word">' + esc(civWord) + '</strong><small>Kata asli timmu</small>') +
      '</span>' +
      '</button>' +
      '<button type="button" class="btn btn-primary spv-next" data-done hidden>' + icon('arrow-right') + ' Lanjut</button>' +
      '</div>'
    );
    const frame = ctx.stage.querySelector('[data-flip]');
    frame.addEventListener('click', () => {
      if (frame.classList.contains('open')) return;
      frame.classList.add('open');
      sound(isSpy ? 'select' : 'reveal');
      const doneBtn = ctx.stage.querySelector('[data-done]');
      doneBtn.hidden = false;
      doneBtn.addEventListener('click', done);
    });
  }

  /* ---------------- Giliran: chat / suara ---------------- */

  function turnLoop(ctx) {
    let turn = 0;
    const next = () => {
      if (turn >= players.length) { discussion(ctx); return; }
      renderTurn(ctx, turn, answer => {
        chatLog.push({ player: turn, text: answer, via: answer.__via || 'chat' });
        sound('send');
        turn += 1;
        next();
      });
    };
    next();
  }

  function renderTurn(ctx, turn, submit) {
    const p = players[turn];
    const micAvailable = speechSupported() && voiceOn;

    ctx.setStage(
      '<div class="spv-wrap">' +
      '<div class="spv-turn-head" style="--c:' + COLORS[turn % COLORS.length] + '">' +
      '<span class="spv-turn-avatar">' + esc(initials(p.name)) + '</span>' +
      '<div><small>GILIRAN ' + (turn + 1) + '/' + players.length + '</small><b>' + esc(p.name) + '</b>' +
      '<span class="spv-turn-word" data-turn-word></span></div>' +
      '<span class="spv-turn-round">Putaran ' + round + '/' + rounds + '</span>' +
      '</div>' +
      '<div class="spv-chat-log" data-log>' + chatLog.map(entry => (
        '<div class="spv-chat-row">' +
        '<span class="spv-chat-who" style="--c:' + COLORS[entry.player % COLORS.length] + '">' + esc(initials(players[entry.player].name)) + '</span>' +
        '<div class="spv-chat-bubble"><b>' + esc(players[entry.player].name) + '</b>' +
        (entry.via === 'voice' ? '<i>' + icon('microphone') + ' lewat suara</i>' : '<i>' + icon('chat') + ' lewat chat</i>') +
        '<span>' + esc(entry.text) + '</span></div></div>'
      )).join('') + '</div>' +
      '<div class="spv-input-area">' +
      '<input type="text" class="spv-input" maxlength="120" placeholder="Jelaskan kata tanpa menyebutnya…">' +
      (micAvailable ? '<button type="button" class="spv-mic" data-mic title="Jawab dengan suara">' + icon('microphone') + '</button>' : '') +
      '<button type="button" class="spv-send" data-send>' + icon('send') + '</button>' +
      '</div>' +
      '<p class="spv-hint">' + icon('info') + (micAvailable ? ' Ketik jawabanmu, atau nyalakan mikrofon dan bicara — jawabanmu muncul di samping avatarmu.' : ' Ketik jawabanmu lalu kirim.') + '</p>' +
      '</div>'
    );

    const isSpyTurn = turn === spyIndex;
    const wordEl = ctx.stage.querySelector('[data-turn-word]');
    if (wordEl) {
      wordEl.textContent = isSpyTurn ? '💡 ' + spyClue + ' (petunjukmu)' : '📖 ' + civWord;
      wordEl.classList.add(isSpyTurn ? 'is-spy' : 'is-civ');
    }

    const log = ctx.stage.querySelector('[data-log]');
    log.scrollTop = log.scrollHeight;

    const input = ctx.stage.querySelector('.spv-input');
    input.focus();

    const submitText = (text, via) => {
      if (!text) return;
      chatLog.push({ player: turn, text, via });
      sound('send');
      if (log) {
        const row = document.createElement('div');
        row.className = 'spv-chat-row';
        row.innerHTML =
          '<span class="spv-chat-who" style="--c:' + COLORS[turn % COLORS.length] + '">' + esc(initials(p.name)) + '</span>' +
          '<div class="spv-chat-bubble"><b>' + esc(p.name) + '</b>' +
          (via === 'voice' ? '<i>' + icon('microphone') + ' lewat suara</i>' : '<i>' + icon('chat') + ' lewat chat</i>') +
          '<span>' + esc(text) + '</span></div>';
        log.appendChild(row);
        log.scrollTop = log.scrollHeight;
      }
      window.setTimeout(() => submit({ __via: via, toString: () => text, valueOf: () => text }), 360);
    };

    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitText(input.value.trim(), 'chat');
        input.value = '';
      }
    });
    ctx.stage.querySelector('[data-send]').addEventListener('click', () => {
      submitText(input.value.trim(), 'chat');
      input.value = '';
    });
    const mic = ctx.stage.querySelector('[data-mic]');
    if (mic) mic.addEventListener('click', () => {
      const rec = createRecognition(text => {
        mic.classList.remove('listening');
        submitText(text, 'voice');
      });
      if (!rec) { Neko.ui.toast('Suara tidak didukung', 'Peramban ini belum punya pengenalan suara.', 'warn', 'warning'); return; }
      mic.classList.add('listening');
      Neko.ui.toast('Mendengarkan…', 'Bicara sekarang — jawabanmu dikirim otomatis.', 'info', 'microphone');
      rec.onerror = () => mic.classList.remove('listening');
      rec.onend = () => mic.classList.remove('listening');
      try { rec.start(); } catch (error) { mic.classList.remove('listening'); }
    });
  }

  /* ---------------- Diskusi + voting ---------------- */

  function discussion(ctx) {
    say('Waktunya diskusi. Diskusikan jawaban, lalu voting siapa mata-matanya!');
    ctx.setStage(
      '<div class="spv-wrap spv-discuss">' +
      '<span class="spv-hero-badge">' + icon('chat') + 'SESI DISKUSI</span>' +
      '<h2>Bahas jawaban semua pemain</h2>' +
      '<div class="spv-recap">' +
      chatLog.map(entry => (
        '<div class="spv-recap-row"><b>' + esc(players[entry.player].name) + '</b>' +
        (entry.via === 'voice' ? '<i>' + icon('microphone') + '</i>' : '') +
        '<span>' + esc(entry.text) + '</span></div>'
      )).join('') +
      '</div>' +
      '<button type="button" class="btn btn-primary btn-block" data-vote>' + icon('check-circle') + ' Lanjut ke Voting</button>' +
      '</div>'
    );
    ctx.stage.querySelector('[data-vote]').addEventListener('click', () => { sound('select'); voting(ctx); });
  }

  function voting(ctx) {
    const votes = players.map(() => 0);
    let voter = 0;
    const renderVoter = () => {
      if (voter >= players.length) { showResult(ctx, votes); return; }
      const current = players[voter];
      ctx.setStage(
        '<div class="spv-wrap">' +
        '<span class="spv-kicker" style="--c:' + COLORS[voter % COLORS.length] + '">VOTING · ' + (voter + 1) + '/' + players.length + '</span>' +
        '<h2>' + esc(current.name) + ', pilih tersangkamu</h2>' +
        '<div class="spv-vote-grid">' +
        players.map((p, i) => (
          '<button type="button" class="spv-vote-card" data-vote="' + i + '"' + (i === voter ? ' disabled' : '') + ' style="--c:' + COLORS[i % COLORS.length] + '">' +
          '<span>' + esc(initials(p.name)) + '</span><b>' + esc(p.name) + '</b>' + (i === voter ? '<small>kamu</small>' : '') + '</button>'
        )).join('') +
        '</div></div>'
      );
      ctx.stage.querySelectorAll('[data-vote]').forEach(button => button.addEventListener('click', () => {
        const target = Number(button.dataset.vote);
        if (target === voter) { Neko.ui.toast('Tidak bisa', 'Pilih pemain lain, bukan dirimu sendiri.', 'warn', 'warning'); return; }
        votes[target] += 1;
        sound('check');
        voter += 1;
        window.setTimeout(renderVoter, 260);
      }));
    };
    renderVoter();
  }

  function showResult(ctx, votes) {
    const rows = players.map((p, i) => ({ p, i, votes: votes[i] })).sort((a, b) => b.votes - a.votes || a.i - b.i);
    const tie = rows.length > 1 && rows[0].votes === rows[1].votes;
    const eliminated = tie ? -1 : rows[0].i;
    const caught = !tie && eliminated === spyIndex;
    if (caught) score += 100;
    history.push({ round, spy: players[spyIndex].name, caught, tie });
    say(caught ? 'Mata-mata tertangkap! Kerja bagus, detektif!' : 'Mata-mata berhasil lolos. Semangat, coba lagi!');
    sound(caught ? 'win' : 'lose');

    const spyPlayer = players[spyIndex];
    ctx.setStage(
      '<div class="spv-wrap spv-result' + (caught ? ' win' : '') + '">' +
      '<span class="spv-result-badge">' + (caught ? icon('trophy') : icon('spy')) + '</span>' +
      '<h2>' + (tie ? 'Suara Seri!' : caught ? 'Penyusup Tertangkap!' : 'Mata-Mata Lolos!') + '</h2>' +
      '<p>' + (tie ? 'Tidak ada yang tereliminasi.' : caught ? '<b>' + esc(spyPlayer.name) + '</b> berhasil diintai.' : 'Penyusup sebenarnya adalah <b>' + esc(spyPlayer.name) + '</b>.') + '</p>' +
      '<p class="spv-word-reveal">Kata warga: <b>' + esc(civWord) + '</b> · Petunjuk mata-mata: <b>' + esc(spyClue) + '</b></p>' +
      '<div class="spv-result-rows">' +
      rows.map((row, rank) => (
        '<div class="spv-result-row' + (row.i === spyIndex ? ' is-spy' : '') + (row.i === eliminated ? ' is-out' : '') + '">' +
        '<span class="spv-rank">' + (rank + 1) + '</span><b>' + esc(row.p.name) + '</b>' +
        (row.i === spyIndex ? '<span class="spv-tag">SPY</span>' : '') +
        '<em>' + row.votes + ' suara</em></div>'
      )).join('') +
      '</div>' +
      '<button type="button" class="btn btn-primary btn-block" data-next>' +
      (round >= rounds ? 'Lihat Rekap' : 'Putaran Berikutnya') + ' ' + icon('arrow-right') + '</button>' +
      '</div>'
    );
    if (caught) ctx.confetti();
    ctx.stage.querySelector('[data-next]').addEventListener('click', () => {
      round += 1;
      if (round > rounds) finish(ctx); else { sound('go'); startRound(ctx); }
    });
  }

  function finish(ctx) {
    const caught = history.filter(r => r.caught).length;
    ctx.finish({
      title: caught ? 'Detektif Hebat!' : 'Mata-Mata Menang',
      message: 'Penyusup tertangkap ' + caught + ' dari ' + rounds + ' putaran.',
      score,
      won: caught > 0,
      xp: 25 + Math.round(score / 4),
      stats: [{ label: 'Putaran', value: String(rounds) }, { label: 'Tertangkap', value: String(caught) }]
    });
  }

  Neko.games['spy-v2'] = {
    mount(ctx) {
      players = [];
      rounds = 1;
      round = 1;
      score = 0;
      history = [];
      try { voiceOn = JSON.parse(localStorage.getItem('neko_prefs_v2') || '{}').charVoice !== false; } catch (error) { voiceOn = true; }
      renderLobby(ctx);
    }
  };
})();
