/* ============================================================
   NEKO · js/store.js
   Penyimpanan profil: cache cepat di perangkat ini + sumber
   kebenaran di server NEKO, sehingga XP, buku, statistik, dan
   preferensi ikut ke perangkat lain saat login ulang.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { safeStorage, todayKey, dayDiff } = Neko.util;

  const KEYS = {
    prefs: 'neko_prefs_v2',
    accounts: 'neko_accounts_v2',
    session: 'neko_session_v2'
  };

  const presetAccounts = [
    { username: 'ivander', displayName: 'Ivander', pin: '141210', role: 'Developer' },
    { username: 'Muh.haditrafanizam', displayName: 'Rafanizam', pin: '220810', role: 'President' },
    { username: 'AkhsanJauharSantoso', displayName: 'Akhsan', pin: '140411', role: 'Admin' },
    { username: 'Pakandy', displayName: 'Pak Andy', pin: '123321', role: 'Guru' },
    { username: 'Pakharry', displayName: 'Pak Harry', pin: '456654', role: 'Guru' },
    { username: 'Buksri', displayName: 'Bu Sri', pin: '789987', role: 'Guru' },
    { username: 'Firmansyah', displayName: 'Pak Firman', pin: '100110', role: 'Wali Kelas' },
    { username: 'Nurlinda', displayName: 'Bu Linda', pin: '120200', role: 'Guru' },
    { username: 'Norma.S.Kom', displayName: 'Bu Norma', pin: '344334', role: 'Guru' },
    { username: 'Wahyu.', displayName: 'Pak Wahyu', pin: '456756', role: 'Guru' },
    { username: 'demo', displayName: 'Siswa Demo', pin: '111111', role: 'Member' }
  ];

  const defaultPrefs = {
    theme: 'paper',
    mode: 'dark',
    car: 'red',
    motion: 'auto',
    ambient: true,
    fontScale: 1,
    lastView: 'home',
    haptics: true,
    cursor: 'on',
    charVoice: true,
    sidebarCollapsed: false,
    pushNotify: true,
    mascotHidden: false
  };

  const checkinRewards = [20, 25, 30, 35, 40, 50, 80];

  const state = {
    prefs: { ...defaultPrefs },
    session: null,
    localAccounts: [],
    profile: null
  };

  function readJSON(key, fallback) {
    return safeStorage(() => {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    }, fallback);
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function normalizeUsername(value) {
    return String(value || '').trim().toLocaleLowerCase('id');
  }

  function profileKey(username) {
    return 'neko_profile_' + normalizeUsername(username).replace(/[^a-z0-9._-]/g, '_');
  }

  function emptyBooks() {
    return {};
  }

  function emptyProfile(session) {
    return {
      username: session.username,
      displayName: session.displayName,
      role: session.role,
      joinedAt: Date.now(),
      xp: 0,
      badges: [],
      notifications: [],
      books: emptyBooks(),
      checkin: { streak: 0, best: 0, last: null, claimed: [] },
      stats: {
        gamesPlayed: 0,
        games: {},
        booksFinished: 0,
        pagesRead: 0,
        quizBest: 0,
        correct: 0,
        answered: 0,
        spyWins: 0,
        minutes: 0,
        xpToday: 0,
        xpDate: null,
        livePlayed: 0,
        liveWins: 0
      },
      favorites: [],
      settings: { profilePublic: false, reminders: true }
    };
  }

  function loadAccounts() {
    const accounts = readJSON(KEYS.accounts, []);
    state.localAccounts = Array.isArray(accounts) ? accounts.filter(item => item && typeof item.username === 'string' && typeof item.salt === 'string' && typeof item.hash === 'string') : [];
  }

  function saveAccounts() {
    writeJSON(KEYS.accounts, state.localAccounts);
  }

  function loadPrefs() {
    const saved = readJSON(KEYS.prefs, {});
    state.prefs = { ...defaultPrefs, ...(saved && typeof saved === 'object' ? saved : {}) };
    if (state.prefs.theme === 'car') state.prefs.mode = 'dark';
    if (!['red', 'blue', 'pink'].includes(state.prefs.car)) state.prefs.car = 'red';
    if (!['default', 'forest', 'ocean', 'candy', 'red', 'car', 'astronaut', 'paper'].includes(state.prefs.theme)) state.prefs.theme = 'paper';
    if (!['auto', 'off'].includes(state.prefs.motion)) state.prefs.motion = 'auto';
    if (typeof state.prefs.haptics !== 'boolean') state.prefs.haptics = true;
    if (!['on', 'off'].includes(state.prefs.cursor)) state.prefs.cursor = 'on';
    if (typeof state.prefs.charVoice !== 'boolean') state.prefs.charVoice = true;
    if (typeof state.prefs.sidebarCollapsed !== 'boolean') state.prefs.sidebarCollapsed = false;
    if (typeof state.prefs.pushNotify !== 'boolean') state.prefs.pushNotify = true;
    if (typeof state.prefs.mascotHidden !== 'boolean') state.prefs.mascotHidden = false;
    if (state.prefs.theme === 'paper' && !['dark', 'light'].includes(state.prefs.mode)) state.prefs.mode = 'dark';
  }

  function savePrefs() {
    writeJSON(KEYS.prefs, state.prefs);
  }

  function patchPrefs(patch) {
    state.prefs = { ...state.prefs, ...patch };
    if (state.prefs.theme === 'car') state.prefs.mode = 'dark';
    savePrefs();
    queueServerSync();
    return state.prefs;
  }

  function mergeProfile(session, stored) {
    const base = emptyProfile(session);
    if (!stored || typeof stored !== 'object') return base;
    return {
      ...base,
      ...stored,
      stats: { ...base.stats, ...(stored.stats || {}) },
      checkin: { ...base.checkin, ...(stored.checkin || {}) },
      books: stored.books && typeof stored.books === 'object' ? stored.books : {},
      notifications: Array.isArray(stored.notifications) ? stored.notifications : [],
      badges: Array.isArray(stored.badges) ? stored.badges : [],
      favorites: Array.isArray(stored.favorites) ? stored.favorites : []
    };
  }

  function loadSession() {
    const session = readJSON(KEYS.session, null);
    if (session && typeof session.username === 'string' && typeof session.displayName === 'string') {
      state.session = { username: session.username, displayName: session.displayName, role: session.role || 'Member', token: session.token || '' };
    } else {
      state.session = null;
    }
  }

  function setSession(account, server) {
    const session = {
      username: account.username,
      displayName: account.displayName,
      role: account.role || 'Member',
      token: Neko.api ? Neko.api.token : ''
    };
    writeJSON(KEYS.session, session);
    state.session = session;
    const cached = readJSON(profileKey(session.username), null);
    if (server && server.profile && typeof server.profile === 'object') {
      const serverProfile = mergeProfile(session, server.profile);
      const cachedXP = cached && Number(cached.xp) || 0;
      const serverXP = serverProfile.xp || 0;
      // Progres lama di perangkat ini dipindah ke server saat server masih kosong
      state.profile = serverXP >= cachedXP ? serverProfile : mergeProfile(session, cached);
      if (server.prefs && typeof server.prefs === 'object') {
        state.prefs = { ...state.prefs, ...server.prefs, sidebarCollapsed: state.prefs.sidebarCollapsed };
        savePrefs();
      }
    } else {
      loadProfile();
    }
    state.profile.displayName = session.displayName;
    state.profile.role = session.role;
    saveProfile();
    return session;
  }

  /* Isi ulang profil dari server saat aplikasi dibuka kembali. */
  function hydrate(server) {
    if (!state.session || !server) return;
    if (server.profile && typeof server.profile === 'object') {
      const serverProfile = mergeProfile(state.session, server.profile);
      const cached = readJSON(profileKey(state.session.username), null);
      const cachedXP = cached && Number(cached.xp) || 0;
      const merged = (serverProfile.xp || 0) >= cachedXP ? serverProfile : mergeProfile(state.session, cached);
      merged.displayName = state.session.displayName;
      merged.role = state.session.role;
      state.profile = merged;
      saveProfile();
      emit('neko:profile', { profile: state.profile });
    }
    if (server.prefs && typeof server.prefs === 'object') {
      state.prefs = { ...state.prefs, ...server.prefs, sidebarCollapsed: state.prefs.sidebarCollapsed, lastView: state.prefs.lastView };
      savePrefs();
    }
  }

  function syncablePrefs() {
    const { sidebarCollapsed, ...rest } = state.prefs;
    return rest;
  }

  function queueServerSync() {
    if (!Neko.api || !state.session || !state.session.token || !state.profile) return;
    if (location.protocol === 'file:') return;
    Neko.api.scheduleSync({ profile: state.profile, prefs: syncablePrefs() });
  }

  function clearSession() {
    state.session = null;
    state.profile = null;
    try { localStorage.removeItem(KEYS.session); } catch (error) { /* abaikan */ }
  }

  function loadProfile() {
    if (!state.session) {
      state.profile = null;
      return null;
    }
    const stored = readJSON(profileKey(state.session.username), null);
    state.profile = mergeProfile(state.session, stored);
    state.profile.displayName = state.session.displayName;
    state.profile.role = state.session.role;
    return state.profile;
  }

  function saveProfile() {
    if (!state.profile || !state.session) return false;
    const ok = writeJSON(profileKey(state.session.username), state.profile);
    queueServerSync();
    return ok;
  }

  function emit(name, detail) {
    try {
      document.dispatchEvent(new CustomEvent(name, { detail }));
    } catch (error) { /* abaikan */ }
  }

  function touchDay() {
    if (!state.profile) return;
    const today = todayKey();
    if (state.profile.stats.xpDate !== today) {
      state.profile.stats.xpDate = today;
      state.profile.stats.xpToday = 0;
    }
  }

  function addNotification(title, body, type = 'info') {
    if (!state.profile) return null;
    const item = {
      id: Neko.util.uid('notif'),
      title,
      body,
      type,
      time: Date.now(),
      read: false
    };
    state.profile.notifications.unshift(item);
    state.profile.notifications = state.profile.notifications.slice(0, 40);
    saveProfile();
    emit('neko:notifications', { item });
    return item;
  }

  function seasonSnapshot(xp) {
    return Neko.seasons.seasonForXP(xp);
  }

  function awardXP(amount, reason = '', options = {}) {
    if (!state.profile) return { amount: 0, seasonUp: false };
    const gained = Math.max(0, Math.round(Number(amount) || 0));
    if (!gained) return { amount: 0, seasonUp: false };
    touchDay();
    const before = seasonSnapshot(state.profile.xp).season;
    state.profile.xp += gained;
    state.profile.stats.xpToday += gained;
    const after = seasonSnapshot(state.profile.xp).season;
    let seasonUp = false;
    if (after.id > before.id) {
      seasonUp = true;
      if (!state.profile.badges.includes(after.reward.badge)) state.profile.badges.push(after.reward.badge);
      addNotification('Season baru: ' + after.short, 'Selamat! Gelar baru: ' + after.title + '. ' + after.reward.desc + ' telah terbuka.', 'season');
    }
    saveProfile();
    emit('neko:xp', { amount: gained, reason, xp: state.profile.xp, seasonUp, season: after });
    emit('neko:profile', { profile: state.profile });
    return { amount: gained, xp: state.profile.xp, seasonUp, before, after, reason };
  }

  function claimCheckin() {
    if (!state.profile) return { ok: false, reason: 'login' };
    const today = todayKey();
    const checkin = state.profile.checkin;
    if (checkin.last === today) return { ok: false, reason: 'claimed', streak: checkin.streak };
    const gap = checkin.last ? dayDiff(checkin.last, today) : null;
    checkin.streak = gap === 1 ? checkin.streak + 1 : 1;
    if (checkin.streak > 7) checkin.streak = 1;
    checkin.last = today;
    checkin.best = Math.max(checkin.best || 0, checkin.streak);
    const reward = checkinRewards[Math.min(6, checkin.streak - 1)];
    const result = awardXP(reward, 'Check-in hari ke-' + checkin.streak);
    addNotification('Check-in berhasil', 'Streak hari ke-' + checkin.streak + '. Kamu mendapat +' + reward + ' XP.', 'reward');
    saveProfile();
    return { ok: true, xp: reward, streak: checkin.streak, seasonUp: result.seasonUp };
  }

  function checkinState() {
    if (!state.profile) return { streak: 0, claimedToday: false, canClaim: false, rewards: checkinRewards };
    const checkin = state.profile.checkin;
    const claimedToday = checkin.last === todayKey();
    const gap = checkin.last ? dayDiff(checkin.last, todayKey()) : null;
    const streak = gap === 0 ? checkin.streak : (gap === 1 ? checkin.streak : 0);
    return { streak, claimedToday, canClaim: !claimedToday, rewards: checkinRewards };
  }

  function recordGame(key, data = {}) {
    if (!state.profile) return;
    const stats = state.profile.stats;
    const entry = stats.games[key] || { plays: 0, best: 0, wins: 0, last: 0 };
    entry.plays += 1;
    entry.last = Date.now();
    if (typeof data.score === 'number') entry.best = Math.max(entry.best, Math.round(data.score));
    if (data.won) entry.wins += 1;
    stats.games[key] = entry;
    stats.gamesPlayed += 1;
    if (typeof data.correct === 'number') stats.correct += data.correct;
    if (typeof data.answered === 'number') stats.answered += data.answered;
    if (typeof data.minutes === 'number') stats.minutes += data.minutes;
    if (key === 'quiz' && typeof data.score === 'number') stats.quizBest = Math.max(stats.quizBest, data.score);
    if (key === 'spy' && data.won) stats.spyWins += 1;
    saveProfile();
    emit('neko:profile', { profile: state.profile });
  }

  function recordBookPage(bookId, pageIndex, totalPages) {
    if (!state.profile) return { award: 0, isNew: false };
    const books = state.profile.books;
    const entry = books[bookId] || { page: 0, maxPage: 0, read: [], finished: false };
    const read = new Set(entry.read || []);
    const isNew = !read.has(pageIndex);
    read.add(pageIndex);
    entry.read = Array.from(read).sort((a, b) => a - b);
    entry.page = pageIndex;
    entry.maxPage = Math.max(entry.maxPage || 0, pageIndex);
    books[bookId] = entry;
    let result = { award: 0, isNew };
    if (isNew) {
      state.profile.stats.pagesRead += 1;
      result = { ...awardXP(4, 'Membaca halaman baru'), isNew };
    }
    if (!entry.finished && entry.read.length >= totalPages) {
      entry.finished = true;
      state.profile.stats.booksFinished += 1;
      result = { ...awardXP(40, 'Menyelesaikan buku'), finished: true, isNew };
      addNotification('Buku selesai!', 'Kamu menyelesaikan buku materi dan mendapat +40 XP.', 'book');
    }
    saveProfile();
    emit('neko:profile', { profile: state.profile });
    return result;
  }

  function bookState(bookId) {
    return state.profile?.books?.[bookId] || null;
  }

  function toggleFavorite(bookId) {
    if (!state.profile) return false;
    const list = new Set(state.profile.favorites || []);
    if (list.has(bookId)) list.delete(bookId); else list.add(bookId);
    state.profile.favorites = Array.from(list);
    saveProfile();
    return list.has(bookId);
  }

  function findAccount(username) {
    const normalized = normalizeUsername(username);
    const preset = presetAccounts.find(item => normalizeUsername(item.username) === normalized);
    if (preset) return { ...preset, preset: true };
    const local = state.localAccounts.find(item => normalizeUsername(item.username) === normalized);
    return local ? { ...local, preset: false } : null;
  }

  function usernameTaken(username) {
    return Boolean(findAccount(username));
  }

  function addLocalAccount(account) {
    state.localAccounts.push(account);
    saveAccounts();
    return account;
  }

  function markAllRead() {
    if (!state.profile) return;
    state.profile.notifications.forEach(item => { item.read = true; });
    saveProfile();
    emit('neko:notifications', { all: true });
  }

  function markRead(id) {
    if (!state.profile) return;
    const item = state.profile.notifications.find(entry => entry.id === id);
    if (item) item.read = true;
    saveProfile();
    emit('neko:notifications', { id });
  }

  function unreadCount() {
    return state.profile ? state.profile.notifications.filter(item => !item.read).length : 0;
  }

  function resetProgress() {
    if (!state.profile) return;
    const fresh = emptyProfile(state.session);
    fresh.joinedAt = state.profile.joinedAt;
    state.profile = fresh;
    saveProfile();
    emit('neko:profile', { profile: state.profile });
    emit('neko:xp', { amount: 0, xp: 0, season: seasonSnapshot(0) });
  }

  function logout() {
    if (state.profile) saveProfile();
    if (Neko.api && state.session && state.session.token) {
      Neko.api.flushSync(true);
      Neko.api.logout();
      if (Neko.api.stopEvents) Neko.api.stopEvents();
    }
    clearSession();
    emit('neko:logout', {});
  }

  function init() {
    loadPrefs();
    loadAccounts();
    loadSession();
    loadProfile();
  }

  init();

  Neko.store = {
    KEYS, presetAccounts,
    init,
    get prefs() { return state.prefs; },
    get session() { return state.session; },
    get profile() { return state.profile; },
    get accounts() { return state.localAccounts; },
    patchPrefs, savePrefs,
    findAccount, usernameTaken, addLocalAccount, setSession, hydrate, logout,
    awardXP, claimCheckin, checkinState,
    addNotification, markAllRead, markRead, unreadCount,
    recordGame, recordBookPage, bookState, toggleFavorite,
    seasonSnapshot,
    resetProgress,
    normalizeUsername
  };
})();
