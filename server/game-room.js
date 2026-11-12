/* ============================================================
   NEKO · server/game-room.js
   Room mabar realtime: buat room, undang teman, main game yang
   sama bareng-bareng, nilai tiap ronde dikirim ke server dan
   papan peringkat diperbarui seketika.
   Modul ini murni Node bawaan dan tidak mengubah alur lama.
   ============================================================ */
'use strict';

const crypto = require('crypto');

let ctx = null;          // bantuan yang disuntikkan server.js
const gameRooms = new Map();
const cleanupTimers = [];

/* ---------------- util ---------------- */

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function genPIN() {
  for (;;) {
    const pin = String(crypto.randomInt(100000, 999999));
    if (!gameRooms.has(pin)) return pin;
  }
}

const GAMES = new Set([
  'memory', 'spy', 'spyv2', 'osi', 'subnet', 'cable', 'detective', 'quiz', 'reaction',
  'simon', 'portrush', 'merge', 'typing'
]);

const RACE_ONLY = new Set(['reaction', 'typing', 'portrush', 'simon', 'merge', 'cable', 'subnet', 'detective']);

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function levelOf(value) {
  const key = String(value || 'normal').toLowerCase();
  return key === 'santai' || key === 'easy' ? 'easy'
    : key === 'tantangan' || key === 'hard' ? 'hard' : 'normal';
}

function cleanText(value, max) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

/* ---------------- state room ---------------- */

function makePlayer(user, character) {
  return {
    key: ctx.normalizeUsername(user.username),
    username: user.username,
    displayName: user.displayName,
    character: cleanText(character, 24),
    ready: false,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
    connected: true,
    rounds: [],
    submitted: false,
    total: 0,
    best: 0,
    wins: 0,
    xp: 0
  };
}

function createRoom(user, body) {
  const game = String(body.game || '').trim();
  if (!GAMES.has(game)) throw new Error('Game itu belum tersedia untuk mabar.');
  const room = {
    pin: genPIN(),
    game,
    config: {
      rounds: clampInt(body.rounds, 1, 5, 3),
      sessionRounds: clampInt(body.sessionRounds, 3, 10, 5),
      level: levelOf(body.level)
    },
    hostKey: ctx.normalizeUsername(user.username),
    host: { username: user.username, displayName: user.displayName },
    public: body.public !== false,
    phase: 'lobby',
    round: 0,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    startedAt: 0,
    rev: 0,
    players: new Map(),
    feed: [],
    results: null
  };
  const host = makePlayer(user, body.character);
  host.ready = true;
  room.players.set(host.key, host);
  gameRooms.set(room.pin, room);
  return room;
}

function touch(room) {
  room.lastActivity = Date.now();
}

function findRoom(req, body, url) {
  const pin = cleanText((body && body.pin) || (url && url.searchParams.get('pin')), 6);
  return gameRooms.get(pin) || null;
}

function requireUser(req) {
  const user = ctx.userFromToken(ctx.bearer(req));
  if (!user) { const error = new Error('login'); error.status = 401; throw error; }
  if (user.blocked) { const error = new Error('Akun Anda dinonaktifkan oleh administrator.'); error.status = 403; throw error; }
  return user;
}

function playerOf(room, user) {
  return room.players.get(ctx.normalizeUsername(user.username)) || null;
}

function characterHeld(room, key, character) {
  if (!character) return '';
  for (const [playerKey, player] of room.players) {
    if (playerKey !== key && player.character === character) return player.displayName;
  }
  return '';
}

/* ---------------- view + broadcast ---------------- */

function playerView(player, room) {
  return {
    key: player.key,
    username: player.username,
    displayName: player.displayName,
    character: player.character,
    ready: player.ready,
    connected: player.connected,
    isHost: room.hostKey === player.key,
    total: player.total,
    best: player.best,
    wins: player.wins,
    xp: player.xp,
    submitted: room.phase === 'playing' ? player.submitted : player.rounds.length,
    rounds: player.rounds.map(round => round.score)
  };
}

function ranking(room) {
  return Array.from(room.players.values())
    .slice()
    .sort((a, b) => b.total - a.total || b.best - a.best || a.joinedAt - b.joinedAt)
    .map((player, index) => ({
      rank: index + 1,
      key: player.key,
      displayName: player.displayName,
      character: player.character,
      total: player.total,
      best: player.best,
      wins: player.wins,
      xp: player.xp,
      rounds: player.rounds.length
    }));
}

function roomView(room, viewerKey) {
  return {
    pin: room.pin,
    game: room.game,
    gameName: (ctx.gameNames && ctx.gameNames[room.game]) || room.game,
    config: room.config,
    total: room.config.rounds,
    phase: room.phase,
    round: room.phase === 'playing' ? Math.min(room.round + 1, room.config.rounds) : room.round,
    roundTarget: room.config.rounds,
    roundDeadline: room.phase === 'playing' ? (room.roundDeadline || 0) : 0,
    roundLimitSeconds: Math.round(ROUND_LIMIT_MS / 1000),
    host: room.host,
    public: room.public,
    createdAt: room.createdAt,
    startedAt: room.startedAt,
    rev: room.rev,
    isMember: room.players.has(viewerKey || ''),
    isHost: Boolean(viewerKey) && room.hostKey === viewerKey,
    canStart: room.hostKey === viewerKey && room.players.size >= 1 &&
      Array.from(room.players.values()).every(player => player.ready || player.key === room.hostKey),
    players: Array.from(room.players.values()).map(player => playerView(player, room)),
    leaderboard: ranking(room),
    feed: room.feed.slice(-8),
    results: room.results
  };
}

function broadcast(room, extra) {
  room.rev += 1;
  const base = { type: 'room-state', rev: room.rev };
  if (extra) Object.assign(base, extra);
  const channel = 'game:' + room.pin;

  // Anggota menerima view miliknya sendiri (tombol host hanya muncul untuk host).
  const set = ctx.wsHub.rooms.get(channel);
  if (set) {
    for (const mini of Array.from(set)) {
      const key = mini.user ? ctx.normalizeUsername(mini.user) : '';
      mini.send({ ...base, state: roomView(room, key) });
    }
  }
  ctx.liveEvents.notify(channel, { ...base, state: roomView(room, '') });

  for (const player of room.players.values()) {
    if (!player.username) continue;
    const mine = { ...base, state: roomView(room, player.key) };
    for (const mini of ctx.wsHub.userSockets(player.username)) mini.send(mine);
  }
}

function pushFeed(room, text) {
  room.feed.push({ text, at: Date.now() });
  if (room.feed.length > 24) room.feed.shift();
}

/* ---------------- alur ronde ---------------- */

let advanceTimer = null;

function scheduleAdvance(room, delay) {
  if (advanceTimer) clearTimeout(advanceTimer);
  advanceTimer = setTimeout(() => {
    advanceTimer = null;
    if (room.phase === 'playing') completeRound(room, true);
  }, delay);
  if (advanceTimer.unref) advanceTimer.unref();
}

function activePlayers(room) {
  return Array.from(room.players.values()).filter(player => player.connected);
}

const ROUND_LIMIT_MS = 120000; // 2 menit per ronde: setelah itu ronde ditutup otomatis

function scheduleRoundDeadline(room) {
  room.roundDeadline = Date.now() + ROUND_LIMIT_MS;
  scheduleAdvance(room, ROUND_LIMIT_MS);
}

function completeRound(room, auto) {
  if (room.phase !== 'playing') return;
  if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
  const done = activePlayers(room);
  const board = done.slice().sort((a, b) => (b.rounds[b.rounds.length - 1] || { score: 0 }).score - (a.rounds[a.rounds.length - 1] || { score: 0 }).score);
  const roundNo = room.round + 1;
  pushFeed(room, 'Ronde ' + roundNo + ' selesai' + (board[0] ? ' — pemimpin ' + board[0].displayName + ' (' + (board[0].rounds[board[0].rounds.length - 1] || {}).score + ' poin)' : ''));
  ctx.wsHub.sendRoom('game:' + room.pin, {
    type: 'room-round',
    round: roundNo,
    total: room.config.rounds,
    auto: Boolean(auto),
    board: board.map((player, index) => ({
      rank: index + 1,
      displayName: player.displayName,
      character: player.character,
      score: (player.rounds[player.rounds.length - 1] || {}).score || 0,
      total: player.total
    }))
  });
  ctx.liveEvents.notify('game:' + room.pin, { type: 'room-round', round: roundNo, total: room.config.rounds });
  if (roundNo >= room.config.rounds) {
    finishRoom(room);
    return;
  }
  room.round = roundNo;
  room.players.forEach(player => { player.submitted = false; });
  touch(room);
  scheduleRoundDeadline(room);
  broadcast(room, { startedRound: roundNo + 1 });
  ctx.wsHub.sendRoom('game:' + room.pin, { type: 'room-start-round', round: roundNo + 1, total: room.config.rounds });
  ctx.liveEvents.notify('game:' + room.pin, { type: 'room-start-round', round: roundNo + 1 });
}

function finishRoom(room) {
  room.phase = 'finished';
  const board = ranking(room);
  const medals = [60, 40, 25];
  board.forEach((row, index) => {
    const player = room.players.get(row.key);
    if (!player) return;
    const bonus = medals[index] || 5;
    player.xp += bonus;
    if (ctx.awardRoomXP) ctx.awardRoomXP(player, room.game, bonus);
  });
  room.results = {
    at: Date.now(),
    game: room.game,
    rounds: room.config.rounds,
    board,
    champion: board[0] ? board[0].displayName : ''
  };
  pushFeed(room, board[0] ? 'Juara room ini: ' + board[0].displayName + ' dengan ' + board[0].total + ' poin.' : 'Sesi selesai.');
  touch(room);
  broadcast(room, { finished: true });
  for (const player of room.players.values()) {
    if (!player.username) continue;
    ctx.pushEvent(player.username, 'room-finished', {
      pin: room.pin, game: room.game, rank: board.findIndex(row => row.key === player.key) + 1,
      total: board.find(row => row.key === player.key) ? board.find(row => row.key === player.key).total : 0
    });
  }
}

function startRoom(room) {
  room.phase = 'playing';
  room.round = 0;
  room.startedAt = Date.now();
  room.results = null;
  room.feed = [];
  scheduleRoundDeadline(room);
  room.players.forEach(player => {
    player.rounds = [];
    player.total = 0;
    player.best = 0;
    player.wins = 0;
    player.submitted = false;
  });
  pushFeed(room, 'Sesi dimulai oleh ' + room.host.displayName + '. ' + room.config.rounds + ' ronde, semua pemain mulai bersamaan.');
  touch(room);
  broadcast(room, { sessionStarted: true });
  ctx.wsHub.sendRoom('game:' + room.pin, { type: 'room-start-round', round: 1, total: room.config.rounds });
  ctx.liveEvents.notify('game:' + room.pin, { type: 'room-start-round', round: 1 });
}

/* ---------------- endpoints ---------------- */

const routes = {
  'POST /api/room/create': async (req, res) => {
    const user = requireUser(req);
    const body = await ctx.readBody(req);
    let room;
    try {
      room = createRoom(user, body);
    } catch (error) {
      return ctx.sendJSON(res, 400, { error: error.message });
    }
    // satu orang tidak boleh punya banyak room terbuka
    for (const [pin, existing] of gameRooms) {
      if (existing.hostKey === room.hostKey && existing.phase === 'lobby' && pin !== room.pin) gameRooms.delete(pin);
    }
    broadcast(room, { created: true });
    ctx.sendJSON(res, 200, { ok: true, pin: room.pin, state: roomView(room, room.hostKey) });
  },

  'POST /api/room/join': async (req, res) => {
    const user = requireUser(req);
    const body = await ctx.readBody(req);
    const room = findRoom(req, body);
    if (!room) return ctx.sendJSON(res, 404, { error: 'Room tidak ditemukan. Minta PIN terbaru dari pembuatnya.' });
    const key = ctx.normalizeUsername(user.username);
    if (room.phase === 'playing') return ctx.sendJSON(res, 409, { error: 'Sesi sedang berjalan. Tunggu ronde berikutnya atau mulai sesi baru.' });
    if (room.players.size >= 12 && !room.players.has(key)) return ctx.sendJSON(res, 409, { error: 'Room sudah penuh (maksimal 12 pemain).' });
    const character = cleanText(body.character, 24);
    if (character) {
      const heldBy = characterHeld(room, key, character);
      if (heldBy) return ctx.sendJSON(res, 409, { error: 'Karakter ' + character + ' sudah dipakai ' + heldBy + '.' });
    }
    const existing = room.players.get(key);
    if (existing) {
      if (character) existing.character = character;
      existing.connected = true;
      existing.lastSeen = Date.now();
    } else {
      room.players.set(key, makePlayer(user, character));
      pushFeed(room, user.displayName + ' bergabung ke room.');
    }
    touch(room);
    broadcast(room, { joined: user.displayName });
    ctx.pushEvent(room.host.username, 'room-join', { pin: room.pin, from: user.username, displayName: user.displayName });
    ctx.sendJSON(res, 200, { ok: true, state: roomView(room, key) });
  },

  'POST /api/room/ready': async (req, res) => {
    const user = requireUser(req);
    const body = await ctx.readBody(req);
    const room = findRoom(req, body);
    if (!room) return ctx.sendJSON(res, 404, { error: 'Room tidak ditemukan.' });
    const player = playerOf(room, user);
    if (!player) return ctx.sendJSON(res, 403, { error: 'Kamu bukan anggota room ini.' });
    if (room.phase !== 'lobby') return ctx.sendJSON(res, 409, { error: 'Sesi sudah berjalan.' });
    player.ready = body.ready !== false;
    touch(room);
    broadcast(room, {});
    ctx.sendJSON(res, 200, { ok: true, ready: player.ready });
  },

  'POST /api/room/character': async (req, res) => {
    const user = requireUser(req);
    const body = await ctx.readBody(req);
    const room = findRoom(req, body);
    if (!room) return ctx.sendJSON(res, 404, { error: 'Room tidak ditemukan.' });
    const player = playerOf(room, user);
    if (!player) return ctx.sendJSON(res, 403, { error: 'Kamu bukan anggota room ini.' });
    if (room.phase !== 'lobby') return ctx.sendJSON(res, 409, { error: 'Karakter hanya bisa diganti sebelum sesi dimulai.' });
    const character = cleanText(body.character, 24);
    if (!character) return ctx.sendJSON(res, 400, { error: 'Karakter tidak dikenali.' });
    const heldBy = characterHeld(room, player.key, character);
    if (heldBy) return ctx.sendJSON(res, 409, { error: 'Karakter ' + character + ' sudah dipakai ' + heldBy + '. Pilih yang lain.' });
    player.character = character;
    touch(room);
    broadcast(room, {});
    ctx.sendJSON(res, 200, { ok: true, character });
  },

  'POST /api/room/invite': async (req, res) => {
    const user = requireUser(req);
    const body = await ctx.readBody(req);
    const kind = body.kind === 'live' ? 'live' : 'game';
    const pin = cleanText(body.pin, 6);
    if (!pin) return ctx.sendJSON(res, 400, { error: 'PIN room wajib diisi.' });
    const names = Array.isArray(body.usernames) ? body.usernames.slice(0, 20) : [];
    if (!names.length) return ctx.sendJSON(res, 400, { error: 'Pilih minimal satu teman.' });
    const sent = [];
    const skipped = [];
    for (const name of names) {
      const target = ctx.getDb().users[ctx.normalizeUsername(name)];
      if (!target) { skipped.push(String(name)); continue; }
      if (target.blocked) { skipped.push(target.username); continue; }
      ctx.pushEvent(target.username, 'room-invite', {
        kind, pin, from: user.username, displayName: user.displayName,
        game: cleanText(body.game, 24), at: Date.now()
      });
      sent.push(target.username);
    }
    ctx.sendJSON(res, 200, { ok: true, sent, skipped, message: sent.length + ' undangan dikirim' + (skipped.length ? ', ' + skipped.length + ' tidak terkirim' : '') });
  },

  'POST /api/room/start': async (req, res) => {
    const user = requireUser(req);
    const body = await ctx.readBody(req);
    const room = findRoom(req, body);
    if (!room) return ctx.sendJSON(res, 404, { error: 'Room tidak ditemukan.' });
    if (room.hostKey !== ctx.normalizeUsername(user.username)) return ctx.sendJSON(res, 403, { error: 'Hanya pembuat room yang bisa memulai sesi.' });
    if (room.phase === 'playing') return ctx.sendJSON(res, 409, { error: 'Sesi sudah berjalan.' });
    if (room.players.size < 1) return ctx.sendJSON(res, 400, { error: 'Belum ada pemain.' });
    if (RACE_ONLY.has(room.game) && room.players.size < 2) {
      return ctx.sendJSON(res, 400, { error: 'Game adu skor butuh minimal 2 pemain. Undang teman dulu.' });
    }
    startRoom(room);
    ctx.sendJSON(res, 200, { ok: true, state: roomView(room, room.hostKey) });
  },

  'POST /api/room/score': async (req, res) => {
    const user = requireUser(req);
    const body = await ctx.readBody(req);
    const room = findRoom(req, body);
    if (!room) return ctx.sendJSON(res, 404, { error: 'Room sudah ditutup.' });
    const player = playerOf(room, user);
    if (!player) return ctx.sendJSON(res, 403, { error: 'Kamu bukan anggota room ini.' });
    if (room.phase !== 'playing') return ctx.sendJSON(res, 409, { error: 'Sesi belum berjalan.' });
    if (player.submitted) return ctx.sendJSON(res, 409, { error: 'Nilai ronde ini sudah terkirim.' });
    const score = clampInt(body.score, 0, 99999, 0);
    const won = Boolean(body.won);
    // nomor ronde harus persis ronde aktif; nilai di luar rentang tidak boleh dibulatkan
    const requested = Math.round(Number(body.round));
    if (!Number.isFinite(requested) || requested !== room.round + 1) {
      return ctx.sendJSON(res, 409, { error: 'Ronde ' + body.round + ' bukan ronde aktif (ronde ' + (room.round + 1) + ').' });
    }
    const roundNo = requested;
    player.rounds.push({ score, won, at: Date.now(), detail: cleanText(body.detail, 60) });
    player.total += score;
    player.best = Math.max(player.best, score);
    if (won) player.wins += 1;
    player.submitted = true;
    player.lastSeen = Date.now();
    touch(room);
    broadcast(room, { scored: player.displayName });
    const waiting = activePlayers(room).filter(item => !item.submitted);
    if (!waiting.length) completeRound(room, false);
    // pemain yang lambat akan ditutup oleh deadline ronde
    ctx.sendJSON(res, 200, { ok: true, total: player.total, waiting: waiting.length });
  },

  'POST /api/room/skip': async (req, res) => {
    const user = requireUser(req);
    const body = await ctx.readBody(req);
    const room = findRoom(req, body);
    if (!room) return ctx.sendJSON(res, 404, { error: 'Room tidak ditemukan.' });
    if (room.hostKey !== ctx.normalizeUsername(user.username)) return ctx.sendJSON(res, 403, { error: 'Hanya pembuat room yang bisa melewatkan ronde.' });
    if (room.phase !== 'playing') return ctx.sendJSON(res, 409, { error: 'Sesi tidak sedang berjalan.' });
    activePlayers(room).forEach(player => {
      if (!player.submitted) {
        player.rounds.push({ score: 0, won: false, at: Date.now(), detail: 'lewat' });
        player.submitted = true;
      }
    });
    completeRound(room, true);
    ctx.sendJSON(res, 200, { ok: true });
  },

  'POST /api/room/leave': async (req, res) => {
    const user = requireUser(req);
    const body = await ctx.readBody(req);
    const room = findRoom(req, body);
    if (!room) return ctx.sendJSON(res, 200, { ok: true });
    const key = ctx.normalizeUsername(user.username);
    if (!room.players.has(key)) return ctx.sendJSON(res, 200, { ok: true });
    if (room.hostKey === key) {
      gameRooms.delete(room.pin);
      ctx.wsHub.sendRoom('game:' + room.pin, { type: 'room-closed', pin: room.pin });
      ctx.liveEvents.notify('game:' + room.pin, { type: 'room-closed', pin: room.pin });
      return ctx.sendJSON(res, 200, { ok: true, closed: true });
    }
    room.players.delete(key);
    pushFeed(room, user.displayName + ' keluar dari room.');
    touch(room);
    broadcast(room, { left: user.displayName });
    ctx.sendJSON(res, 200, { ok: true });
  },

  'GET /api/room/state': async (req, res, url) => {
    const room = findRoom(req, null, url);
    if (!room) return ctx.sendJSON(res, 404, { error: 'Room tidak ditemukan atau sudah ditutup.' });
    const user = ctx.userFromToken(ctx.bearer(req));
    const key = user ? ctx.normalizeUsername(user.username) : '';
    const player = key ? room.players.get(key) : null;
    if (player) { player.connected = true; player.lastSeen = Date.now(); }
    ctx.sendJSON(res, 200, { ok: true, state: roomView(room, key) });
  },

  'GET /api/room/wait': async (req, res, url) => {
    const room = findRoom(req, null, url);
    if (!room) return ctx.sendJSON(res, 404, { error: 'room hilang' });
    const since = Number(url.searchParams.get('rev') || 0);
    const user = ctx.userFromToken(ctx.bearer(req));
    const viewerKey = user ? ctx.normalizeUsername(user.username) : '';
    const player = viewerKey ? room.players.get(viewerKey) : null;
    if (player) { player.connected = true; player.lastSeen = Date.now(); }
    const sendPayload = payload => {
      const events = Array.isArray(payload.events) ? payload.events : [];
      // ganti view anonim dengan view milik pemanggil
      const fixed = events.map(item => (item && item.type === 'room-state' ? { ...item, state: roomView(room, viewerKey) } : item));
      ctx.sendJSON(res, 200, { events: fixed, timeout: payload.timeout });
    };
    if (room.rev > since) return sendPayload({ events: [{ type: 'room-state', rev: room.rev, state: roomView(room, viewerKey) }] });
    ctx.liveEvents.watch('game:' + room.pin, req, res, sendPayload);
  },

  'GET /api/room/list': async (req, res) => {
    const user = ctx.userFromToken(ctx.bearer(req));
    const key = user ? ctx.normalizeUsername(user.username) : '';
    const list = Array.from(gameRooms.values())
      .filter(room => room.public && room.phase !== 'finished')
      .filter(room => !key || !room.players.has(key))
      .sort((a, b) => b.lastActivity - a.lastActivity)
      .slice(0, 20)
      .map(room => ({
        // PIN room tidak ditampilkan di daftar publik: hanya host bisa membagikan PIN.
        pin: '',
        code: 'room-' + room.pin.slice(0, 2) + 'xx',
        game: room.game,
        gameName: (ctx.gameNames && ctx.gameNames[room.game]) || room.game,
        host: room.host.displayName,
        players: room.players.size,
        phase: room.phase,
        round: room.round,
        total: room.config.rounds,
        level: room.config.level,
        locked: true
      }));
    const mine = user ? Array.from(gameRooms.values())
      .filter(room => room.players.has(key) && room.phase !== 'finished')
      .map(room => ({ pin: room.pin, game: room.game, phase: room.phase, players: room.players.size })) : [];
    ctx.sendJSON(res, 200, { ok: true, rooms: list, mine });
  }
};

/* ---------------- WebSocket ---------------- */

function onSocketMessage(message, mini, joinedRef) {
  const type = String(message.type || '');
  if (!type.startsWith('room-')) return false;
  const room = gameRooms.get(cleanText(message.pin, 6));
  const user = ctx.userFromToken(String(message.token || ''));
  if (type === 'room-subscribe') {
    if (!room) { mini.send({ type: 'room-error', error: 'room tidak ditemukan' }); return true; }
    ctx.wsHub.attachRoom('game:' + room.pin, mini);
    joinedRef.pin = room.pin;
    const key = user ? ctx.normalizeUsername(user.username) : '';
    const player = key ? room.players.get(key) : null;
    if (player) { player.connected = true; player.lastSeen = Date.now(); }
    mini.send({ type: 'room-state', rev: room.rev, state: roomView(room, key) });
    return true;
  }
  if (!room || !user) return true;
  const player = room.players.get(ctx.normalizeUsername(user.username));
  if (!player) return true;
  if (type === 'room-score') {
    const body = { pin: room.pin, score: message.score, won: message.won, round: message.round, detail: message.detail };
    return routes['POST /api/room/score'].__ws(body, user, room, player);
  }
  if (type === 'room-ping') {
    player.lastSeen = Date.now();
    if (!player.connected) { player.connected = true; broadcast(room, {}); }
    mini.send({ type: 'room-pong', rev: room.rev });
    return true;
  }
  return true;
}

// pembungkus agar route skor bisa dipakai ulang dari WebSocket
routes['POST /api/room/score'].__ws = function viaSocket(body, user, room, player) {
  if (room.phase !== 'playing' || player.submitted) return false;
  const score = clampInt(body.score, 0, 99999, 0);
  const requested = Math.round(Number(body.round));
  if (!Number.isFinite(requested) || requested !== room.round + 1) return false;
  player.rounds.push({ score, won: Boolean(body.won), at: Date.now(), detail: cleanText(body.detail, 60) });
  player.total += score;
  player.best = Math.max(player.best, score);
  if (body.won) player.wins += 1;
  player.submitted = true;
  player.lastSeen = Date.now();
  touch(room);
  broadcast(room, { scored: player.displayName });
  const waiting = activePlayers(room).filter(item => !item.submitted);
  if (!waiting.length) completeRound(room, false);
  // deadline ronde yang menangani pemain lambat
  return true;
};

/* ---------------- pemeliharaan ---------------- */

function sweep() {
  const now = Date.now();
  for (const [pin, room] of gameRooms) {
    for (const [key, player] of room.players) {
      if (now - player.lastSeen > 90000) {
        if (player.connected) {
          player.connected = false;
          pushFeed(room, player.displayName + ' tidak terdeteksi.');
          if (room.phase === 'playing' && !player.submitted) completeRound(room, true);
          broadcast(room, {});
        }
        if (now - player.lastSeen > 10 * 60 * 1000 && room.hostKey !== key) room.players.delete(key);
      }
    }
    if (room.players.size === 0 || now - room.lastActivity > 30 * 60 * 1000) {
      ctx.wsHub.sendRoom('game:' + pin, { type: 'room-closed', pin });
      ctx.liveEvents.notify('game:' + pin, { type: 'room-closed', pin });
      gameRooms.delete(pin);
    }
  }
}

/* ---------------- pemasangan ke server.js ---------------- */

function install(context) {
  ctx = context;
  Object.assign(ctx.routes, routes);
  ctx.wsMessageHandlers.push(onSocketMessage);
  const timer = setInterval(sweep, 45000);
  if (timer.unref) timer.unref();
  cleanupTimers.push(timer);
  ctx.log('[neko] modul room mabar aktif — ' + Object.keys(routes).length + ' endpoint, ' + GAMES.size + ' game siap balap');
  return {
    gameRooms,
    routes,
    roomView,
    onSocketMessage,
    stats: () => ({
      rooms: gameRooms.size,
      players: Array.from(gameRooms.values()).reduce((sum, room) => sum + room.players.size, 0),
      playing: Array.from(gameRooms.values()).filter(room => room.phase === 'playing').length
    })
  };
}

module.exports = { install, gameRooms };
