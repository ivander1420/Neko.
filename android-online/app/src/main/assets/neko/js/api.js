/* ============================================================
   NEKO · js/api.js
   Jembatan server NEKO: akun sungguhan, sinkronisasi profil
   lintas perangkat, realtime events (pesan/teman), dan kanal
   WebSocket untuk Kelas Langsung dengan fallback long-poll.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};

  const TOKEN_KEY = 'neko_token_v1';
  const BASE_KEY = 'neko_server_base_v1';

  /* Alamat server NEKO.
     Kosong      = pakai alamat halaman ini (server dan web di tempat sama).
     Terisi      = pakai server lain, misalnya server online sementara webnya
                   di-hosting Vercel/GitHub Pages atau dibuka dari file/APK.
                 Bisa lewat <meta name="neko-server-base" content="https://...">
                 atau disimpan di localStorage (mode Pengaturan → Server). */
  function readServerBase() {
    let raw = '';
    try { raw = localStorage.getItem(BASE_KEY) || ''; } catch (error) { raw = ''; }
    if (!raw) {
      const meta = document.querySelector('meta[name="neko-server-base"]');
      raw = (meta && meta.content) || '';
    }
    raw = String(raw).trim().replace(/\/+$/, '');
    if (!raw || raw === 'same' || raw === 'auto') return '';
    return /^https?:\/\//i.test(raw) ? raw : '';
  }

  const serverBaseInitial = readServerBase();
  // Mode file hanya dianggap offline kalau tidak ada alamat server yang diisi.
  let serverBase = serverBaseInitial;
  let isFile = location.protocol === 'file:' && !serverBase;

  function apiURL(path) {
    return serverBase ? serverBase + path : path;
  }

  let token = '';
  try { token = localStorage.getItem(TOKEN_KEY) || ''; } catch (error) { token = ''; }

  let online = !isFile;
  let lastEventSeq = 0;
  let eventLoop = null;
  let socket = null;
  let socketRetry = 0;
  let liveFallbackTimer = null;
  const liveState = { pin: '', rev: 0, polling: false };

  try {
    lastEventSeq = Number(localStorage.getItem('neko_event_seq_v1') || 0) || 0;
  } catch (error) { lastEventSeq = 0; }

  function setToken(value) {
    token = String(value || '');
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (error) { /* penyimpanan privat */ }
  }

  async function request(path, options = {}) {
    if (isFile) throw new Error('offline');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), options.timeout || 12000);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token && options.auth !== false) headers.Authorization = 'Bearer ' + token;
      const response = await fetch(apiURL(path), {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
        cache: 'no-store'
      });
      let payload = null;
      try { payload = await response.json(); } catch (error) { payload = null; }
      if (!response.ok) {
        if (payload === null) {
          online = false;
          const offlineError = new Error('Server NEKO tidak terhubung ke alamat ini.');
          offlineError.offline = true;
          throw offlineError;
        }
        const pesan = (payload && payload.error) || 'Terjadi kesalahan server (' + response.status + ').';
        if (response.status === 401 && String(pesan).toLowerCase() === 'login') {
          // token lama / sesi kedaluwarsa: jangan menahan status login palsu
          setToken('');
          const perluLogin = new Error('Masuk dulu untuk memakai fitur ini.');
          perluLogin.status = 401;
          perluLogin.perluLogin = true;
          throw perluLogin;
        }
        const error = new Error(pesan);
        error.status = response.status;
        error.payload = payload;
        throw error;
      }
      online = true;
      return payload;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function probe() {
    if (isFile) { online = false; return false; }
    try {
      await request('/api/community?ping=1', { auth: false, timeout: 4000 });
      online = true;
    } catch (error) {
      online = false;
    }
    return online;
  }

  /* ---------------- Sesi & sinkronisasi profil ---------------- */

  async function login(username, pin) {
    const data = await request('/api/auth/login', { method: 'POST', body: { username, pin }, auth: false });
    setToken(data.token);
    return data;
  }

  async function register(displayName, username, pin) {
    const data = await request('/api/auth/register', { method: 'POST', body: { displayName, username, pin }, auth: false });
    setToken(data.token);
    return data;
  }

  async function restoreSession() {
    if (!token || isFile) return null;
    try {
      const data = await request('/api/auth/session');
      return data;
    } catch (error) {
      if (error.status === 401) setToken('');
      return null;
    }
  }

  async function logout() {
    try { if (token) await request('/api/auth/logout', { method: 'POST', timeout: 4000 }); } catch (error) { /* sesi lokal tetap dibersihkan */ }
    setToken('');
  }

  let syncTimer = null;
  let syncInFlight = false;
  let queued = null;

  function scheduleSync(payload) {
    if (!token || isFile) return;
    queued = payload;
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(flushSync, 900);
  }

  async function flushSync(force = false) {
    if (!queued) { if (!force) return; }
    if (syncInFlight) return;
    const payload = queued;
    if (!payload) return;
    syncInFlight = true;
    queued = null;
    try {
      await request('/api/profile', { method: 'PUT', body: payload });
      Neko.api.lastSyncAt = Date.now();
      document.dispatchEvent(new CustomEvent('neko:synced'));
    } catch (error) {
      queued = payload;
      window.clearTimeout(syncTimer);
      syncTimer = window.setTimeout(flushSync, 8000);
    } finally {
      syncInFlight = false;
    }
  }

  /* ---------------- Realtime events (pesan, teman, XP live) ---------------- */

  function dispatchEvent(item) {
    if (!item || !item.type) return;
    if (item.seq) {
      lastEventSeq = Math.max(lastEventSeq, Number(item.seq) || 0);
      try { localStorage.setItem('neko_event_seq_v1', String(lastEventSeq)); } catch (error) { /* abaikan */ }
    }
    document.dispatchEvent(new CustomEvent('neko:event', { detail: item }));
  }

  async function eventLoopOnce() {
    if (!token || isFile) return;
    try {
      const data = await request('/api/notifications/poll?since=' + lastEventSeq, { timeout: 32000 });
      if (Array.isArray(data.events)) data.events.forEach(dispatchEvent);
    } catch (error) {
      await Neko.util.wait(4000);
    }
  }

  function startEvents() {
    stopEvents();
    if (!token || isFile) return;
    let alive = true;
    eventLoop = {
      stop() { alive = false; }
    };
    (async () => {
      while (alive && token) {
        await eventLoopOnce();
      }
    })();
  }

  function stopEvents() {
    if (eventLoop) { eventLoop.stop(); eventLoop = null; }
  }

  /* ---------------- WebSocket Kelas Langsung ---------------- */

  function wsURL() {
    if (serverBase) {
      const secure = /^https:/i.test(serverBase);
      const host = serverBase.replace(/^https?:\/\//i, '');
      return (secure ? 'wss://' : 'ws://') + host + '/ws';
    }
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return proto + '//' + location.host + '/ws';
  }

  function ensureSocket(onLiveMessage) {
    if (isFile) return null;
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return socket;
    try {
      socket = new WebSocket(wsURL());
    } catch (error) {
      scheduleSocketReconnect(onLiveMessage);
      return null;
    }
    socket.onopen = () => {
      socketRetry = 0;
      try { socket.send(JSON.stringify({ type: 'identify', token })); } catch (error) { /* abaikan */ }
      if (liveState.pin) {
        try { socket.send(JSON.stringify({ type: 'live-subscribe', pin: liveState.pin, token })); } catch (error) { /* abaikan */ }
      }
    };
    socket.onmessage = event => {
      let message = null;
      try { message = JSON.parse(event.data); } catch (error) { return; }
      if (!message) return;
      if (message.type === 'live-state' && onLiveMessage) onLiveMessage(message);
      if (String(message.type || '').indexOf('room-') === 0) {
        for (const listener of Array.from(socketListeners)) {
          try { listener(message); } catch (error) { /* listener lain tetap jalan */ }
        }
      }
      if (String(message.type || '').indexOf('nobar-') === 0) {
        for (const listener of Array.from(nobarListeners)) {
          try { listener(message); } catch (error) { /* abaikan */ }
        }
      }
    };
    socket.onclose = () => {
      socket = null;
      scheduleSocketReconnect(onLiveMessage);
    };
    socket.onerror = () => {
      try { socket && socket.close(); } catch (error) { /* abaikan */ }
      socket = null;
    };
    return socket;
  }

  function scheduleSocketReconnect(onLiveMessage) {
    socketRetry += 1;
    const delay = Math.min(15000, 1000 * Math.pow(1.6, socketRetry));
    window.setTimeout(() => ensureSocket(onLiveMessage), delay);
  }

  function subscribeLive(pin, onMessage) {
    liveState.pin = String(pin || '');
    const ws = ensureSocket(onMessage);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify({ type: 'live-subscribe', pin: liveState.pin, token })); } catch (error) { /* fallback polls */ }
    }
    startLiveFallback(onMessage);
  }

  function startLiveFallback(onMessage) {
    window.clearInterval(liveFallbackTimer);
    liveFallbackTimer = window.setInterval(async () => {
      if (!liveState.pin) return;
      const wsOpen = socket && socket.readyState === WebSocket.OPEN;
      if (wsOpen && !liveState.polling) return; // WebSocket sehat: tidak perlu poll
      if (liveState.polling) return;
      liveState.polling = true;
      try {
        const data = await request('/api/live/wait?pin=' + encodeURIComponent(liveState.pin) + '&since=' + liveState.rev, { timeout: 30000 });
        if (data && data.state && (data.rev > liveState.rev || data.timeout)) {
          liveState.rev = data.rev || liveState.rev;
          onMessage({ type: 'live-state', rev: data.rev, state: data.state, host: data.host });
        }
      } catch (error) {
        liveState.polling = false;
        if (error && (error.status === 404 || /tidak ditemukan/i.test(error.message || ''))) {
          unsubscribeLive();
          onMessage({ type: 'live-closed' });
          return;
        }
      }
      liveState.polling = false;
    }, 1500);
  }

  function unsubscribeLive() {
    liveState.pin = '';
    liveState.rev = 0;
    window.clearInterval(liveFallbackTimer);
    liveFallbackTimer = null;
  }

  function sendLiveAnswer(payload) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'live-answer', token, ...payload }));
      return;
    }
    request('/api/live/answer', { method: 'POST', body: { ...payload } }).catch(() => {});
  }

  /* ---------------- Kanal room mabar (realtime) ---------------- */

  const socketListeners = new Set();
  const nobarListeners = new Set();
  const roomChannel = { pin: '', rev: 0, polling: false, timer: null };
  const nobarChannel = { id: '', seq: 0, alive: false };

  function subscribeRoom(pin, listener) {
    roomChannel.pin = String(pin || '');
    roomChannel.rev = 0;
    if (listener) socketListeners.add(listener);
    const ws = ensureSocket(null);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify({ type: 'room-subscribe', pin: roomChannel.pin, token })); } catch (error) { /* fallback polls */ }
    }
    window.clearInterval(roomChannel.timer);
    roomChannel.timer = window.setInterval(async () => {
      if (!roomChannel.pin) return;
      const wsOpen = socket && socket.readyState === WebSocket.OPEN;
      if (wsOpen) return;
      if (roomChannel.polling) return;
      roomChannel.polling = true;
      try {
        const data = await request('/api/room/wait?pin=' + encodeURIComponent(roomChannel.pin) + '&rev=' + roomChannel.rev, { timeout: 30000 });
        const item = data && Array.isArray(data.events) ? data.events[data.events.length - 1] : data;
        if (item && item.state) {
          roomChannel.rev = item.rev || roomChannel.rev;
          for (const fn of Array.from(socketListeners)) {
            try { fn({ type: item.type || 'room-state', rev: item.rev, state: item.state, ...item }); } catch (error) { /* abaikan */ }
          }
        }
      } catch (error) {
        roomChannel.polling = false;
        if (error && error.status === 404) {
          unsubscribeRoom();
          for (const fn of Array.from(socketListeners)) {
            try { fn({ type: 'room-closed', pin: roomChannel.pin }); } catch (inner) { /* abaikan */ }
          }
          return;
        }
      }
      roomChannel.polling = false;
    }, 1800);
    if (roomChannel.timer.unref !== undefined) { /* browser timer: biarkan */ }
  }

  function unsubscribeRoom(listener) {
    if (listener) socketListeners.delete(listener);
    else socketListeners.clear();
    if (!socketListeners.size) {
      window.clearInterval(roomChannel.timer);
      roomChannel.timer = null;
      roomChannel.pin = '';
      roomChannel.rev = 0;
    }
  }

  function sendRoomMessage(payload) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      try { socket.send(JSON.stringify({ token, ...payload })); return; } catch (error) { /* jatuh ke REST */ }
    }
    if (payload.type === 'room-score') {
      request('/api/room/score', { method: 'POST', body: { ...payload } }).catch(() => {});
    }
  }

  /* Kanal nobar (nonton bareng YouTube). Terima lewat long-poll /wait
     (jalan di lokal maupun serverless), kirim lewat REST /send yang aman. */
  function dispatchNobar(item) {
    for (const fn of Array.from(nobarListeners)) {
      try { fn(item); } catch (error) { /* listener lain tetap jalan */ }
    }
  }

  function subscribeNobar(id, listener) {
    if (listener) nobarListeners.add(listener);
    nobarChannel.id = String(id || '');
    nobarChannel.seq = 0;
    nobarChannel.alive = true;
    request('/api/nobar/join', { method: 'POST', body: { id: nobarChannel.id } }).catch(() => {});
    (async () => {
      while (nobarChannel.alive && nobarChannel.id) {
        try {
          const data = await request('/api/nobar/wait?id=' + encodeURIComponent(nobarChannel.id) + '&seq=' + nobarChannel.seq, { timeout: 30000 });
          if (!nobarChannel.alive) break;
          if (data && data.state) {
            nobarChannel.seq = data.seq || nobarChannel.seq;
            dispatchNobar({ type: 'nobar-state', rev: data.rev, state: data.state });
            const events = Array.isArray(data.events) ? data.events : [];
            for (const ev of events) dispatchNobar(ev);
          }
        } catch (error) {
          if (!nobarChannel.alive) break;
          if (error && (error.status === 404 || /hilang|tidak ditemukan/i.test(error.message || ''))) {
            dispatchNobar({ type: 'nobar-closed', id: nobarChannel.id });
            nobarChannel.alive = false;
            break;
          }
          await Neko.util.wait(1500);
        }
      }
    })();
  }

  function unsubscribeNobar(listener) {
    if (listener) nobarListeners.delete(listener);
    else nobarListeners.clear();
    if (!nobarListeners.size) {
      nobarChannel.alive = false;
      nobarChannel.id = '';
      nobarChannel.seq = 0;
    }
  }

  function sendNobar(payload) {
    return request('/api/nobar/send', { method: 'POST', body: payload }).catch(() => {});
  }

  /* ---------------- API publik ---------------- */

  function setServerBase(value) {
    const clean = String(value || '').trim().replace(/\/+$/, '');
    try {
      if (clean) localStorage.setItem(BASE_KEY, clean);
      else localStorage.removeItem(BASE_KEY);
    } catch (error) { /* penyimpanan privat */ }
    serverBase = /^https?:\/\//i.test(clean) ? clean : '';
    isFile = location.protocol === 'file:' && !serverBase;
    return serverBase;
  }

  Neko.api = {
    request, probe, setToken,
    get token() { return token; },
    get online() { return online; },
    server: {
      get base() { return serverBase; },
      set(value) { return setServerBase(value); },
      clear() { return setServerBase(''); }
    },
    lastSyncAt: 0,
    login, register, restoreSession, logout,
    scheduleSync, flushSync,
    startEvents, stopEvents,
    subscribeLive, unsubscribeLive, sendLiveAnswer,
    subscribeRoom, unsubscribeRoom, sendRoomMessage,
    subscribeNobar, unsubscribeNobar, sendNobar,
    room: {
      create(options) { return request('/api/room/create', { method: 'POST', body: options }); },
      join(pin, character) { return request('/api/room/join', { method: 'POST', body: { pin, character } }); },
      leave(pin) { return request('/api/room/leave', { method: 'POST', body: { pin } }); },
      ready(pin, value) { return request('/api/room/ready', { method: 'POST', body: { pin, ready: value } }); },
      character(pin, character) { return request('/api/room/character', { method: 'POST', body: { pin, character } }); },
      start(pin) { return request('/api/room/start', { method: 'POST', body: { pin } }); },
      skip(pin) { return request('/api/room/skip', { method: 'POST', body: { pin } }); },
      score(pin, round, score, won, detail) { return request('/api/room/score', { method: 'POST', body: { pin, round, score, won, detail } }); },
      invite(pin, usernames, kind, game) { return request('/api/room/invite', { method: 'POST', body: { pin, usernames, kind, game } }); },
      state(pin) { return request('/api/room/state?pin=' + encodeURIComponent(pin)); },
      list() { return request('/api/room/list'); }
    },
    live: {
      create(options) { return request('/api/live/create', { method: 'POST', body: options }); },
      join(pin, name, character) { return request('/api/live/join', { method: 'POST', body: { pin, name, character } }); },
      setCharacter(pin, character, joinedKey) { return request('/api/live/character', { method: 'POST', body: { pin, character, joinedKey } }); },
      host(pin, action, extra = {}) { return request('/api/live/host', { method: 'POST', body: { pin, action, ...extra } }); },
      answer(pin, choice, timeMs, joinedKey) {
        return request('/api/live/answer', { method: 'POST', body: { pin, choice, timeMs, joinedKey } });
      },
      state(pin) { return request('/api/live/state?pin=' + encodeURIComponent(pin)); }
    },
    users: {
      search(q) { return request('/api/users/search?q=' + encodeURIComponent(q || '')); }
    },
    friends: {
      list() { return request('/api/friends'); },
      request(username) { return request('/api/friends/request', { method: 'POST', body: { username } }); },
      accept(username) { return request('/api/friends/accept', { method: 'POST', body: { username } }); },
      decline(username) { return request('/api/friends/decline', { method: 'POST', body: { username } }); },
      remove(username) { return request('/api/friends/remove', { method: 'POST', body: { username } }); }
    },
    chats: {
      list() { return request('/api/chats'); },
      messages(withUser) { return request('/api/messages?with=' + encodeURIComponent(withUser)); },
      send(to, text, media) { return request('/api/messages/send', { method: 'POST', body: { to, text, media } }); },
      read(withUser) { return request('/api/messages/read', { method: 'POST', body: { with: withUser } }); }
    },
    groups: {
      list() { return request('/api/groups'); },
      create(name, members) { return request('/api/groups/create', { method: 'POST', body: { name, members } }); },
      messages(id) { return request('/api/groups/messages?id=' + encodeURIComponent(id)); },
      send(id, text, media) { return request('/api/groups/send', { method: 'POST', body: { id, text, media } }); },
      members(id, add, kick) { return request('/api/groups/members', { method: 'POST', body: { id, add, kick } }); },
      leave(id) { return request('/api/groups/leave', { method: 'POST', body: { id } }); }
    },
    call: {
      signal(to, kind, extra) { return request('/api/call/signal', { method: 'POST', body: { to, kind, ...(extra || {}) } }); }
    },
    media: {
      /** Unggah berkas (foto/vidio maksimal 500 MB) langsung dari berkas lokal/galeri. */
      async upload(file, onProgress) {
        if (!token || isFile) throw new Error('login');
        if (file.size > 500 * 1024 * 1024) throw new Error('Berkas melebihi 500 MB. Pilih yang lebih kecil.');
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', apiURL('/api/media'));
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.setRequestHeader('Authorization', 'Bearer ' + token);
          xhr.setRequestHeader('X-Neko-Filename', String(file.name || 'berkas'));
          if (xhr.upload && onProgress) {
            xhr.upload.onprogress = event => {
              if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
            };
          }
          xhr.onload = () => {
            let payload = null;
            try { payload = JSON.parse(xhr.responseText); } catch (error) { payload = null; }
            if (xhr.status >= 200 && xhr.status < 300 && payload && payload.ok) resolve(payload);
            else reject(new Error((payload && payload.error) || 'Unggah gagal (' + xhr.status + ').'));
          };
          xhr.onerror = () => reject(new Error('Koneksi terputus saat mengunggah.'));
          xhr.send(file);
        });
      }
    },
    account: {
      rename(username, pin) { return request('/api/account/rename', { method: 'POST', body: { username, pin } }); },
      changePin(oldPin, newPin) { return request('/api/account/pin', { method: 'POST', body: { oldPin, newPin } }); }
    },
    profileDetail(user) { return request('/api/profile/detail?user=' + encodeURIComponent(user)); },
    miko: {
      ask(question, history) { return request('/api/miko/ask', { method: 'POST', body: { question, history } }); }
    },
    nobar: {
      create(video, options) { return request('/api/nobar/create', { method: 'POST', body: { video, ...(options || {}) } }); },
      join(id) { return request('/api/nobar/join', { method: 'POST', body: { id } }); },
      state(id) { return request('/api/nobar/state?id=' + encodeURIComponent(id)); },
      leave(id) { return request('/api/nobar/leave', { method: 'POST', body: { id } }); },
      list() { return request('/api/nobar/list'); },
      search(q) { return request('/api/nobar/search?q=' + encodeURIComponent(q || '')); },
      send(payload) { return sendNobar(payload); }
    }
  };
})();
