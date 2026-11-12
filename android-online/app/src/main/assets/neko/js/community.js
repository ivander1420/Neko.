/* ============================================================
   NEKO · js/community.js
   Sinkronisasi komunitas: pengumuman admin, papan informasi,
   dan leaderboard XP realtime hingga 25 peringkat.
   Server menyimpan data; localStorage + BroadcastChannel menjadi
   lapisan cepat dan cadangan saat offline.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const CACHE_KEY = 'neko_community_cache_v1';
  const SEEN_KEY = 'neko_seen_announcements_v1';
  const MAX_RANKS = 25;
  const MANAGER_ROLES = ['Developer', 'President', 'Admin'];

  const empty = () => ({
    announcements: [],
    players: [],
    info: { title: 'Papan informasi NEKO', body: 'Belum ada informasi baru dari admin. Tetap semangat belajar TJKT!', updatedBy: '', updatedAt: 0 },
    updatedAt: 0,
    pending: [],
    pendingInfo: null
  });

  let state = empty();
  let ready = false;
  let channel = null;
  let polling = null;
  let submitTimer = null;
  let fetching = false;
  let lastFetch = 0;

  function readCache() {
    try {
      const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (raw && typeof raw === 'object') {
        state = {
          ...empty(),
          ...raw,
          announcements: Array.isArray(raw.announcements) ? raw.announcements : [],
          players: Array.isArray(raw.players) ? raw.players : [],
          pending: Array.isArray(raw.pending) ? raw.pending : []
        };
      }
    } catch (error) { /* cache opsional */ }
  }

  function saveCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        announcements: state.announcements.slice(0, 60),
        players: state.players.slice(0, 400),
        info: state.info,
        updatedAt: state.updatedAt,
        pending: state.pending,
        pendingInfo: state.pendingInfo
      }));
    } catch (error) { /* penyimpanan penuh */ }
  }

  function emit() {
    try {
      document.dispatchEvent(new CustomEvent('neko:community', { detail: { announcements: state.announcements, players: state.players, info: state.info } }));
    } catch (error) { /* abaikan */ }
  }

  function broadcast() {
    if (!channel) return;
    try { channel.postMessage({ at: Date.now() }); } catch (error) { /* abaikan */ }
  }

  function seenIds() {
    try {
      const list = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
      return new Set(Array.isArray(list) ? list : []);
    } catch (error) {
      return new Set();
    }
  }

  function saveSeen(ids) {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(ids).slice(-80))); } catch (error) { /* abaikan */ }
  }

  function pushNotification(item) {
    if (!item || !('Notification' in window) || Notification.permission !== 'granted') return;
    const prefs = Neko.store.prefs;
    if (!prefs.pushNotify) return;
    try {
      const note = new Notification(item.title, {
        body: item.body,
        icon: './public/icons/neko-192.png',
        badge: './public/icons/neko-192.png',
        tag: item.id,
        silent: false
      });
      note.onclick = () => {
        try { window.focus(); } catch (error) { /* abaikan */ }
        if (Neko.ui && Neko.ui.notificationsSheet) Neko.ui.notificationsSheet();
        note.close();
      };
    } catch (error) { /* notifikasi tidak didukung */ }
  }

  function handleNewAnnouncements(list, initial) {
    const seen = seenIds();
    const fresh = list.filter(item => item && item.id && !seen.has(item.id));
    list.forEach(item => { if (item && item.id) seen.add(item.id); });
    saveSeen(seen);
    if (initial || !fresh.length) return;
    fresh.slice().reverse().forEach((item, index) => {
      window.setTimeout(() => {
        Neko.audio.play('notify');
        if (Neko.ui && Neko.ui.toast) Neko.ui.toast(item.title, item.body, 'announcement', 'megaphone');
        pushNotification(item);
        if (Neko.mascot && Neko.mascot.react) Neko.mascot.react('announcement', item);
        if (Neko.fx) Neko.fx.haptic('soft');
      }, index * 900);
    });
  }

  async function api(action, payload) {
    if (location.protocol === 'file:') throw new Error('offline');
    return Neko.api.request('/api/community', { method: 'POST', body: { action, ...payload } });
  }

  async function refresh(options = {}) {
    if (fetching) return;
    if (!options.force && Date.now() - lastFetch < 4000) return;
    fetching = true;
    const initial = !ready;
    try {
      if (location.protocol !== 'file:') {
        const data = await Neko.api.request('/api/community?t=' + Date.now(), { auth: false });
        const remote = Array.isArray(data.announcements) ? data.announcements : state.announcements;
        const remoteIds = new Set(remote.map(item => item.id));
        const waiting = state.pending.filter(item => !remoteIds.has(item.id));
        state = {
          ...state,
          announcements: remote.concat(waiting),
          players: Array.isArray(data.players) ? data.players : state.players,
          info: data.info && typeof data.info === 'object' ? data.info : state.info,
          updatedAt: Number(data.updatedAt) || state.updatedAt
        };
        handleNewAnnouncements(state.announcements, initial);
        saveCache();
        emit();
        await flushPending();
      }
    } catch (error) {
      /* offline: cache tetap dipakai */
    } finally {
      lastFetch = Date.now();
      ready = true;
      fetching = false;
    }
  }

  async function flushPending() {
    if (!state.pending.length && !state.pendingInfo) return;
    const queue = state.pending.slice();
    for (const item of queue) {
      try {
        const result = await api('announce', { announcement: item });
        if (result && result.ok && result.announcement) {
          const index = state.announcements.findIndex(entry => entry.id === item.id);
          if (index >= 0) state.announcements[index] = result.announcement;
          state.pending = state.pending.filter(entry => entry.id !== item.id);
          saveCache();
        }
      } catch (error) {
        break;
      }
    }
    if (state.pendingInfo) {
      try {
        const info = state.pendingInfo;
        const result = await api('updateInfo', { info });
        if (result && result.ok) {
          state.info = result.info;
          state.pendingInfo = null;
          saveCache();
        }
      } catch (error) { /* coba lagi nanti */ }
    }
  }

  function submitSelf() {
    const profile = Neko.store.profile;
    const session = Neko.store.session;
    if (!profile || !session) return;
    const snap = Neko.seasons.seasonForXP(profile.xp || 0);
    const player = {
      username: String(session.username || '').toLowerCase(),
      displayName: profile.displayName || session.displayName,
      role: session.role || 'Member',
      xp: Math.round(profile.xp || 0),
      season: snap.season.id,
      title: snap.season.title
    };
    const index = state.players.findIndex(item => String(item.username).toLowerCase() === player.username);
    const local = { ...player, updatedAt: Date.now() };
    if (index >= 0) state.players[index] = { ...state.players[index], ...local };
    else state.players.push(local);
    state.players.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    saveCache();
    emit();
    api('sync', { player }).catch(() => {});
  }

  function queueSubmit() {
    window.clearTimeout(submitTimer);
    submitTimer = window.setTimeout(submitSelf, 1400);
  }

  function leaderboard() {
    const players = state.players.slice();
    const profile = Neko.store.profile;
    const session = Neko.store.session;
    if (profile && session) {
      const snap = Neko.seasons.seasonForXP(profile.xp || 0);
      const username = String(session.username || '').toLowerCase();
      const self = {
        username,
        displayName: profile.displayName || session.displayName,
        role: session.role || 'Member',
        xp: Math.round(profile.xp || 0),
        season: snap.season.id,
        title: snap.season.title,
        updatedAt: Date.now(),
        self: true
      };
      const index = players.findIndex(item => String(item.username).toLowerCase() === username);
      if (index >= 0) players[index] = { ...players[index], ...self };
      else players.push(self);
    }
    const seen = new Set();
    const clean = [];
    players.forEach(item => {
      if (!item || !item.username) return;
      const key = String(item.username).toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      clean.push({
        username: key,
        displayName: item.displayName || key,
        role: item.role || 'Member',
        xp: Math.max(0, Math.round(Number(item.xp) || 0)),
        season: Number(item.season) || 1,
        title: item.title || '',
        updatedAt: Number(item.updatedAt) || 0,
        self: profile && Neko.store.session && key === String(Neko.store.session.username).toLowerCase()
      });
    });
    clean.sort((a, b) => b.xp - a.xp);
    return clean.slice(0, MAX_RANKS).map((item, index) => ({
      ...item,
      rank: index + 1,
      active: Date.now() - item.updatedAt < 5 * 60 * 1000
    }));
  }

  function activeCount() {
    return leaderboard().filter(item => item.active).length;
  }

  function manager() {
    const session = Neko.store.session;
    return Boolean(session && MANAGER_ROLES.includes(session.role));
  }

  async function announce(entry) {
    const session = Neko.store.session;
    if (!session || !manager()) return { ok: false, error: 'forbidden' };
    const item = {
      id: 'local_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: String(entry.title || '').trim().slice(0, 80),
      body: String(entry.body || '').trim().slice(0, 400),
      type: entry.type || 'info',
      author: session.displayName || session.username,
      authorRole: session.role,
      time: Date.now(),
      local: true
    };
    if (!item.title || !item.body) return { ok: false, error: 'empty' };
    state.announcements.unshift(item);
    state.announcements = state.announcements.slice(0, 60);
    state.pending.push(item);
    saveCache();
    broadcast();
    emit();
    try {
      const result = await api('announce', { announcement: item });
      if (result && result.ok && result.announcement) {
        const index = state.announcements.findIndex(entryItem => entryItem.id === item.id);
        if (index >= 0) state.announcements[index] = result.announcement;
        state.pending = state.pending.filter(entryItem => entryItem.id !== item.id);
        saveCache();
        emit();
      }
    } catch (error) { /* tetap tersimpan lokal, dikirim saat online */ }
    return { ok: true, item };
  }

  async function updateInfo(info) {
    const session = Neko.store.session;
    if (!session || !manager()) return { ok: false, error: 'forbidden' };
    const title = String(info.title || '').trim().slice(0, 80);
    const body = String(info.body || '').trim().slice(0, 500);
    if (!title || !body) return { ok: false, error: 'empty' };
    state.info = { title, body, updatedBy: session.displayName || session.username, updatedAt: Date.now() };
    state.pendingInfo = { ...state.info };
    saveCache();
    broadcast();
    emit();
    try {
      const result = await api('updateInfo', { info: state.info });
      if (result && result.ok) {
        state.info = result.info;
        state.pendingInfo = null;
        saveCache();
        emit();
      }
    } catch (error) { /* dikirim nanti */ }
    return { ok: true, info: state.info };
  }

  async function remove(id) {
    if (!manager()) return { ok: false, error: 'forbidden' };
    state.announcements = state.announcements.filter(item => item.id !== id);
    state.pending = state.pending.filter(item => item.id !== id);
    saveCache();
    broadcast();
    emit();
    api('delete', { id }).catch(() => {});
    return { ok: true };
  }

  async function requestPushPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    try {
      return await Notification.requestPermission();
    } catch (error) {
      return 'denied';
    }
  }

  function init() {
    readCache();
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('neko_community');
        channel.addEventListener('message', () => refresh({ force: true }));
      } catch (error) { channel = null; }
    }
    document.addEventListener('neko:app-start', () => {
      refresh({ force: true });
      submitSelf();
    });
    document.addEventListener('neko:xp', queueSubmit);
    document.addEventListener('neko:profile', queueSubmit);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) { refresh({ force: true }); submitSelf(); }
    });
    window.addEventListener('online', () => refresh({ force: true }));
    refresh({ force: true });
    polling = window.setInterval(() => {
      if (!document.hidden && Neko.store.session) refresh();
    }, 4000);
  }

  Neko.community = {
    init,
    refresh,
    submitSelf,
    leaderboard,
    activeCount,
    manager,
    announce,
    updateInfo,
    remove,
    requestPushPermission,
    get announcements() { return state.announcements; },
    get info() { return state.info; },
    get ready() { return ready; }
  };
})();
