/* ============================================================
   NEKO · server/nobar.js
   Room nobar (nonton bareng YouTube): host memasukkan link,
   semua yang join melihat layar yang sama, daftar penonton
   realtime, chat, mic (WebRTC signaling), mute & volume per
   penonton, dan kontrol membesarkan layar di klien.
   ============================================================ */
'use strict';

const crypto = require('crypto');
const https = require('https');

/* Pencarian YouTube untuk tab "Cari" di nobar. Kita ambil halaman hasil
   pencarian YouTube lalu ekstrak ytInitialData JSON di dalamnya — tanpa API key. */
function ytSearch(query) {
  return new Promise(resolve => {
    let settled = false;
    let req = null;
    // Deadline keras: DNS/connect/slow-drip tidak boleh menggantung selamanya.
    const guard = setTimeout(() => { try { if (req) req.destroy(); } catch (error) { /* abaikan */ } finish([]); }, 8000);
    function finish(results) {
      if (settled) return;
      settled = true;
      clearTimeout(guard);
      resolve(Array.isArray(results) ? results : []);
    }
    const fail = () => finish([]);
    try {
      req = https.get({
        host: 'www.youtube.com',
        path: '/results?search_query=' + encodeURIComponent(String(query || '').slice(0, 80)) + '&hl=id&gl=ID&bpctr=9999999999&has_verified=1',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          'Accept-Language': 'id-ID,id;q=0.9',
          // Cookie consent publik agar YouTube tidak menyajikan halaman interstitial.
          'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+419; SOCS=CAI'
        },
        timeout: 7000
      }, res => {
        if (res.statusCode !== 200) { res.resume(); return fail(); }
        let html = '';
        res.setEncoding('utf8');
        // Halaman hasil ~1.5MB; jangan potong di tengah JSON ytInitialData.
        res.on('data', chunk => { if (html.length < 4000000) html += chunk; });
        res.on('error', fail);
        res.on('aborted', fail);
        res.on('end', () => {
          try {
            const start = html.indexOf('ytInitialData = ');
            if (start < 0) return fail();
            const jsonStart = html.indexOf('{', start);
            let depth = 0, end = -1, inStr = false, esc = false;
            for (let i = jsonStart; i < html.length; i += 1) {
              const ch = html[i];
              if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
              if (ch === '"') { inStr = true; continue; }
              if (ch === '{') depth += 1;
              else if (ch === '}') { depth -= 1; if (!depth) { end = i; break; } }
            }
            if (end < 0) return fail();
            const data = JSON.parse(html.slice(jsonStart, end + 1));
            const out = [];
            const walk = node => {
              if (!node || typeof node !== 'object' || out.length >= 24) return;
              if (Array.isArray(node)) { node.forEach(walk); return; }
              const render = node.videoRenderer;
              if (render && render.videoId) {
                const title = (((render.title || {}).runs || [{}])[0] || {}).text || '';
                const channel = (((render.ownerText || {}).runs || [{}])[0] || {}).text || '';
                const length = (((render.lengthText || {}).runs || [{}])[0] || {}).text || '';
                const thumb = (((render.thumbnail || {}).thumbnails || []).slice(-1)[0] || {}).url || '';
                if (title) out.push({ id: render.videoId, title, channel, length, thumb });
              }
              Object.values(node).forEach(walk);
            };
            walk(data);
            finish(out);
          } catch (error) { fail(); }
        });
      });
      req.on('timeout', () => { req.destroy(); fail(); });
      req.on('error', fail);
    } catch (error) { fail(); }
  });
}

let ctx = null;
const rooms = new Map(); // id -> { id, host, hostName, video, state, time, viewers: Map, rev }

function genId() {
  return crypto.randomBytes(3).toString('hex');
}

/* mode = 'all'  : semua orang boleh atur video (ganti, play/pause, seek)
   mode = 'host' : hanya host yang boleh atur (bawaan untuk room publik) */
function roomView(room, viewerKey) {
  const viewers = Array.from(room.viewers.values()).map(v => ({
    key: v.key,
    name: v.name,
    muted: Boolean(v.muted),
    volume: typeof v.volume === 'number' ? v.volume : 1,
    isHost: v.key === room.host,
    micOn: Boolean(v.micOn),
    speaking: false
  }));
  return {
    id: room.id,
    host: room.host,
    hostName: room.hostName,
    video: room.video,
    playing: room.playing,
    position: room.position,
    updatedAt: room.updatedAt,
    rev: room.rev,
    seq: room.seq || 0,
    isHost: viewerKey === room.host,
    canControl: room.control === 'all' || viewerKey === room.host,
    control: room.control || 'host',
    isPublic: room.isPublic !== false,
    viewers,
    messages: (room.chat || []).slice(-60),
    bigScreen: room.bigScreen || false
  };
}

function touch(room) { room.updatedAt = Date.now(); }

/* Setiap perubahan menaikkan seq agar long-poll /wait tahu ada yang baru.
   Event chat & signal disimpan di buffer supaya tidak hilang di antara poll. */
function bump(room) { room.seq = (room.seq || 0) + 1; touch(room); }

function wake(room) {
  ctx.liveEvents.notify('nobar:' + room.id, { type: 'nobar-wake', seq: room.seq });
}

function pushEvent(room, item) {
  bump(room);
  item.seq = room.seq;
  room.events.push(item);
  if (room.events.length > 300) room.events.splice(0, room.events.length - 300);
  wake(room);
}

function broadcast(room) {
  room.rev = (room.rev || 0) + 1;
  bump(room);
  wake(room);
}

function onMessage(message, send) {
  const type = String(message.type || '');
  if (!type.startsWith('nobar-')) return false;
  const room = rooms.get(String(message.id || '').slice(0, 12));
  if (!room) { send({ type: 'nobar-error', error: 'Room nobar tidak ditemukan.' }); return true; }
  const userKey = ctx.normalizeUsername(message.user || '');
  const viewer = room.viewers.get(userKey);
  if (type === 'nobar-chat') {
    const text = String(message.text || '').slice(0, 300).replace(/[<>]/g, '');
    if (!text) return true;
    const item = { type: 'nobar-chat', id: room.id, from: userKey, name: (viewer && viewer.name) || userKey, text, at: Date.now() };
    room.chat.push(item);
    if (room.chat.length > 120) room.chat.splice(0, room.chat.length - 120);
    pushEvent(room, item);
    return true;
  }
  if (!viewer && type !== 'nobar-join') return true;
  if ((type === 'nobar-sync' || type === 'nobar-video') && viewer && viewer.key === room.host) {
    if (type === 'nobar-video') {
      const vid = String(message.video || '').slice(0, 300);
      if (!vid) return true;
      room.video = vid;
      room.position = 0;
      room.playing = true;
    }
    if (type === 'nobar-sync') {
      room.playing = Boolean(message.playing);
      room.position = Math.max(0, Number(message.position) || 0);
    }
    touch(room);
    broadcast(room);
    return true;
  }
  /* penonton non-host hanya boleh atur kalau host membuka izin 'semua' */
  if ((type === 'nobar-sync' || type === 'nobar-video') && viewer && room.control === 'all') {
    if (type === 'nobar-video') {
      const vid = String(message.video || '').slice(0, 300);
      if (!vid) return true;
      room.video = vid;
      room.position = 0;
      room.playing = true;
    } else {
      room.playing = Boolean(message.playing);
      room.position = Math.max(0, Number(message.position) || 0);
    }
    touch(room);
    broadcast(room);
    return true;
  }
  if (type === 'nobar-control' && viewer && viewer.key === room.host) {
    room.control = message.mode === 'all' ? 'all' : 'host';
    touch(room);
    broadcast(room);
    return true;
  }
  if (type === 'nobar-mic' && viewer) {
    viewer.micOn = Boolean(message.micOn);
    touch(room);
    broadcast(room);
    return true;
  }
  if (type === 'nobar-signal' && viewer) {
    const to = room.viewers.get(ctx.normalizeUsername(message.to || ''));
    if (to && to.key !== viewer.key) {
      pushEvent(room, {
        type: 'nobar-signal', id: room.id, from: viewer.key, to: to.key,
        kind: String(message.kind || ''), sdp: message.sdp, candidate: message.candidate
      });
    }
    return true;
  }
  if (type === 'nobar-action' && viewer) {
    // host mute/volume: target diubah dari klien host
    const targetKey = ctx.normalizeUsername(message.target || '');
    const target = room.viewers.get(targetKey);
    if (!target) return true;
    if (message.action === 'mute' && (viewer.key === room.host || targetKey === viewer.key)) {
      target.muted = Boolean(message.value);
      touch(room); broadcast(room);
    } else if (message.action === 'volume' && targetKey === viewer.key) {
      target.volume = Math.min(1, Math.max(0, Number(message.value) || 0));
    }
    return true;
  }
  return true;
}

const routes = {
  'POST /api/nobar/create': async (req, res) => {
    const user = ctx.userFromToken(ctx.bearer(req));
    if (!user) { const e = new Error('login'); e.status = 401; throw e; }
    const body = await ctx.readBody(req);
    const id = genId();
    const video = String(body.video || '').trim().slice(0, 300);
    if (!video) return ctx.sendJSON(res, 400, { error: 'Tautan YouTube wajib diisi.' });
    const roomId = 'nb' + id;
    /* bawaan: publik -> hanya host yang atur video; body.public=false -> privat */
    const room = {
      id: roomId,
      host: ctx.normalizeUsername(user.username),
      hostName: user.displayName,
      video,
      playing: false,
      position: 0,
      updatedAt: Date.now(),
      rev: 0,
      seq: 0,
      events: [],
      chat: [],
      bigScreen: false,
      isPublic: body.public !== false,
      control: body.control === 'all' ? 'all' : 'host',
      viewers: new Map()
    };
    room.viewers.set(room.host, { key: room.host, name: user.displayName, muted: false, volume: 1, micOn: false });
    rooms.set(roomId, room);
    broadcast(room);
    ctx.sendJSON(res, 200, { ok: true, state: roomView(room, room.host) });
  },

  'POST /api/nobar/join': async (req, res) => {
    const user = ctx.userFromToken(ctx.bearer(req));
    if (!user) { const e = new Error('login'); e.status = 401; throw e; }
    const body = await ctx.readBody(req);
    const room = rooms.get(String(body.id || '').slice(0, 12));
    if (!room) return ctx.sendJSON(res, 404, { error: 'Room nobar tidak ditemukan.' });
    const key = ctx.normalizeUsername(user.username);
    if (!room.viewers.has(key)) {
      room.viewers.set(key, { key, name: user.displayName, muted: false, volume: 1, micOn: false });
      broadcast(room);
    }
    ctx.sendJSON(res, 200, { ok: true, state: roomView(room, key) });
  },

  'GET /api/nobar/state': async (req, res, url) => {
    const room = rooms.get(String(url.searchParams.get('id') || '').slice(0, 12));
    if (!room) return ctx.sendJSON(res, 404, { error: 'Room nobar tidak ditemukan.' });
    const user = ctx.userFromToken(ctx.bearer(req));
    const key = user ? ctx.normalizeUsername(user.username) : '';
    ctx.sendJSON(res, 200, { ok: true, state: roomView(room, key) });
  },

  'GET /api/nobar/wait': async (req, res, url) => {
    const room = rooms.get(String(url.searchParams.get('id') || '').slice(0, 12));
    if (!room) return ctx.sendJSON(res, 404, { error: 'Room nobar hilang.' });
    const since = Number(url.searchParams.get('seq') || url.searchParams.get('rev') || 0);
    const user = ctx.userFromToken(ctx.bearer(req));
    const key = user ? ctx.normalizeUsername(user.username) : '';
    const flush = () => {
      if (res.writableEnded) return;
      const events = (room.events || []).filter(e => e.seq > since);
      ctx.sendJSON(res, 200, { ok: true, seq: room.seq, rev: room.rev, state: roomView(room, key), events });
    };
    if ((room.seq || 0) > since) return flush();
    ctx.liveEvents.watch('nobar:' + room.id, req, res, () => flush());
  },

  /* Kirim aksi nobar via REST (aman di serverless tanpa WebSocket).
     Identitas diambil dari token, bukan dari klien, supaya tidak bisa dipalsukan. */
  'POST /api/nobar/send': async (req, res) => {
    const user = ctx.userFromToken(ctx.bearer(req));
    if (!user) { const e = new Error('login'); e.status = 401; throw e; }
    const body = await ctx.readBody(req);
    const type = String(body.type || '');
    if (!type.startsWith('nobar-')) return ctx.sendJSON(res, 400, { error: 'Jenis pesan nobar tidak valid.' });
    const message = { ...body, user: user.username };
    let reply = null;
    onMessage(message, payload => { reply = payload; });
    if (reply && reply.error) return ctx.sendJSON(res, 404, { error: reply.error });
    ctx.sendJSON(res, 200, { ok: true });
  },

  'POST /api/nobar/leave': async (req, res) => {
    const user = ctx.userFromToken(ctx.bearer(req));
    if (!user) return ctx.sendJSON(res, 200, { ok: true });
    const body = await ctx.readBody(req);
    const room = rooms.get(String(body.id || '').slice(0, 12));
    if (room) {
      const key = ctx.normalizeUsername(user.username);
      if (room.viewers.has(key)) {
        room.viewers.delete(key);
        broadcast(room);
      }
      if (room.host === key) rooms.delete(room.id);
    }
    ctx.sendJSON(res, 200, { ok: true });
  },

  'GET /api/nobar/search': async (req, res, url) => {
    const q = String(url.searchParams.get('q') || '').trim().slice(0, 80);
    if (!q) return ctx.sendJSON(res, 200, { ok: true, results: [] });
    const results = await ytSearch(q);
    ctx.sendJSON(res, 200, { ok: true, results });
  },

  'GET /api/nobar/list': async (req, res) => {
    const list = Array.from(rooms.values()).slice(0, 30).map(room => ({
      id: room.id, host: room.hostName, video: room.video, viewers: room.viewers.size,
      updatedAt: room.updatedAt, isPublic: room.isPublic !== false
    }));
    ctx.sendJSON(res, 200, { ok: true, rooms: list });
  }
};

function install(context) {
  ctx = context;
  Object.assign(ctx.routes, routes);
  ctx.wsMessageHandlers.push((message, mini) => onMessage(message, data => mini.send(data)));
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [id, room] of rooms) {
      if (now - room.updatedAt > 45 * 60 * 1000) rooms.delete(id);
    }
  }, 60000);
  if (timer.unref) timer.unref();
  ctx.log('[neko] nobar: ' + Object.keys(routes).length + ' endpoint siap');
  return { rooms, routes };
}

module.exports = { install };
