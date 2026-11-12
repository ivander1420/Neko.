/* ============================================================
   NEKO · server/server.js
   Server resmi NEKO: akun sungguhan (PIN di-hash dengan scrypt),
   sinkronisasi profil antar-perangkat, komunitas (pengumuman +
   leaderboard), teman, pesan, dan NEKO LIVE CLASS multiplayer
   dengan PIN via WebSocket. Tanpa dependensi eksternal.

   Jalankan:  node server/server.js   (atau klik Mulai-NEKO.bat)
   Buka:      http://localhost:3000   (atau http://IP-lan:3000)
   ============================================================ */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const vm = require('node:vm');

/* Dimuat PALING AWAL supaya server/.env terbaca sebelum konstanta
   berbasis environment (PORT, dsb.) dipakai. Modul ini boleh mati:
   tanpa .env server tetap berjalan penuh dengan server/db.json. */
let sync = null;
try {
  sync = require('./supabase-sync.js');
} catch (error) {
  console.error('[neko] modul supabase-sync gagal dimuat:', error.message);
}

const ROOT = path.join(__dirname, '..');

/* Versi yang dilaporkan /api/health diambil dari package.json supaya tidak
   pernah tertinggal lagi seperti sebelumnya (pernah tertulis 3.0.35). */
const VERSI_APLIKASI = (() => {
  try {
    return String(JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version || '0.0.0');
  } catch (error) {
    return '0.0.0';
  }
})();

/* Apakah mode serverless punya kunci Supabase? cloud-store dibaca saat
   dibutuhkan saja (modul ini juga dipakai oleh `node server/server.js`). */
function cloudStoreAvailable() {
  if (!IS_SERVERLESS) return false;
  try {
    return Boolean(require('./cloud-store.js').CONFIGURED);
  } catch (error) {
    return false;
  }
}

/* NEKO bisa berjalan dalam dua mode:
   1) Server Node biasa  → `node server/server.js` (lokal, LAN, APK Mode A).
   2) Serverless (Vercel) → api/neko.js memanggil modul ini, tanpa listen(),
      tanpa menulis ke disk, dan seluruh state diambil/disimpan ke Supabase. */
const IS_SERVERLESS = process.env.NEKO_SERVERLESS === '1' || Boolean(process.env.VERCEL);

const DB_FILE = IS_SERVERLESS
  ? path.join(os.tmpdir(), 'neko-db.json')
  : path.join(ROOT, 'server', 'db.json');
const PORT = Number(process.env.PORT || process.env.NEKO_PORT || 3001);
const SCRYPT_N = 1 << 14;
const BACKEND_VERSION = '4.0.0';
let REALTIME_WEBSOCKET = true;   // dimatikan saat berjalan di serverless
let cloudEpoch = 0;              // revision snapshot Supabase yang sedang dipakai

/* ---------------- Database JSON sederhana ---------------- */

const emptyDB = () => ({
  users: {},
  sessions: {},
  community: { announcements: [], info: { title: 'Papan informasi NEKO', body: 'Belum ada informasi baru dari admin. Tetap semangat belajar TJKT!', updatedBy: '', updatedAt: 0 } },
  friends: {},
  chats: {},
  groups: {},
  groupChats: {},
  seen: {},
  posts: []
});

let db = emptyDB();

function loadDB() {
  if (IS_SERVERLESS) return;   // state di serverless selalu berasal dari Supabase
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      db = { ...emptyDB(), ...parsed };
      db.users = parsed.users || {};
      db.sessions = parsed.sessions || {};
      db.friends = parsed.friends || {};
      db.chats = parsed.chats || {};
      db.groups = parsed.groups || {};
      db.groupChats = parsed.groupChats || {};
      db.seen = parsed.seen || {};
      db.posts = Array.isArray(parsed.posts) ? parsed.posts : [];
    }
  } catch (error) {
    console.error('[neko] db.json rusak, memakai basis baru:', error.message);
    db = emptyDB();
  }
}

let saveTimer = null;
let saveChain = Promise.resolve();

function saveDB() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushDB, 500);
}

/* Satu rantai antrean: tiap panggilan flushDB dijamin benar-benar menulis
   (tidak dibuang karena 'masih sibuk'), dan tidak ada dua penulisan paralel. */
function flushDB() {
  saveChain = saveChain.then(writeDB).catch((error) => console.error('[neko] gagal menyimpan db:', error.message));
  return saveChain;
}

async function writeDB() {
  /* Di serverless (Vercel) filesystem bersifat read-only, jadi penulisan
     disk dilewati. Penulisan data di serverless HANYA dilakukan oleh
     function di folder api lewat server/cloud-store.js (compare-and-swap).
     Penulis lama supabase-sync dilewati di sana karena ia menimpa satu
     baris tanpa cek revision — kalau keduanya jalan, update perangkat
     lain bisa hilang. */
  if (IS_SERVERLESS) return;
  try {
    const tmp = DB_FILE + '.tmp';
    await fsp.writeFile(tmp, JSON.stringify(db), 'utf8');
    await fsp.rename(tmp, DB_FILE);
  } catch (error) {
    console.error('[neko] gagal menulis db.json:', error.message);
  }
  if (sync && sync.CONFIGURED && !suppressSync) sync.push(db);
}

if (!IS_SERVERLESS) {
  process.on('exit', () => {
    try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); } catch (error) { /* abaikan */ }
  });
}

/* ---------------- Sinkronisasi Supabase ---------------- */

const STARTED_AT = Date.now();
let suppressSync = false;   // true saat merge boot, supaya tidak kirim dua kali
let shuttingDown = false;

function countData(state) {
  if (!state || typeof state !== 'object') return 0;
  return Object.keys(state.users || {}).length
    + Object.keys(state.friends || {}).length
    + Object.keys(state.chats || {}).length
    + ((state.community || {}).announcements || []).length;
}

function countDetail(state) {
  const s = state || {};
  return Object.keys(s.users || {}).length + ' akun, '
    + Object.keys(s.friends || {}).length + ' pertemanan, '
    + Object.keys(s.chats || {}).length + ' ruang chat, '
    + (((s.community || {}).announcements || []).length) + ' pengumuman';
}

function mergeMap(local, remote) {
  return { ...(remote || {}), ...(local || {}) };
}

/** Gabungkan data lokal + Supabase. Lokal selalu menang saat ada tabrakan. */
function mergeDB(local, remote) {
  const base = { ...emptyDB(), ...(remote || {}), ...(local || {}) };
  base.users = mergeMap(local.users, remote.users);
  base.sessions = mergeMap(local.sessions, remote.sessions);
  base.friends = mergeMap(local.friends, remote.friends);
  base.seen = mergeMap(local.seen, remote.seen);

  const chats = {};
  const keys = new Set([...Object.keys(local.chats || {}), ...Object.keys(remote.chats || {})]);
  for (const key of keys) {
    const a = (local.chats || {})[key] || [];
    const b = (remote.chats || {})[key] || [];
    chats[key] = a.length >= b.length ? a : b;   // riwayat terbaru selalu yang lebih panjang
  }
  base.chats = chats;

  const groups = {};
  for (const key of new Set([...Object.keys(local.groups || {}), ...Object.keys(remote.groups || {})])) {
    const a = (local.groups || {})[key], b = (remote.groups || {})[key];
    groups[key] = a && (!b || Number(a.createdAt || 0) >= Number(b.createdAt || 0)) ? a : b;
  }
  base.groups = groups;

  const groupChats = {};
  for (const key of new Set([...Object.keys(local.groupChats || {}), ...Object.keys(remote.groupChats || {})])) {
    const a = (local.groupChats || {})[key] || [], b = (remote.groupChats || {})[key] || [];
    groupChats[key] = a.length >= b.length ? a : b;
  }
  base.groupChats = groupChats;

  const localInfo = (local.community || {}).info || {};
  const remoteInfo = (remote.community || {}).info || {};
  base.community = { ...emptyDB().community, ...(remote.community || {}), ...(local.community || {}) };
  base.community.info = Number(localInfo.updatedAt || 0) >= Number(remoteInfo.updatedAt || 0)
    ? { ...remoteInfo, ...localInfo }
    : { ...localInfo, ...remoteInfo };

  const announcements = [];
  const byKey = new Set();
  for (const item of [...((local.community || {}).announcements || []), ...((remote.community || {}).announcements || [])]) {
    const mark = (item && (item.id || (item.createdAt || '') + '|' + (item.title || ''))) || JSON.stringify(item);
    if (byKey.has(mark)) continue;
    byKey.add(mark);
    announcements.push(item);
  }
  announcements.sort((a, b) => Number((b && b.createdAt) || 0) - Number((a && a.createdAt) || 0));
  base.community.announcements = announcements.slice(0, 60);

  const postsMap = new Map();
  for (const item of [...((local && local.posts) || []), ...((remote && remote.posts) || [])]) {
    if (item && item.id && !postsMap.has(item.id)) {
      postsMap.set(item.id, item);
    }
  }
  base.posts = Array.from(postsMap.values()).sort((a, b) => Number((b && b.createdAt) || 0) - Number((a && a.createdAt) || 0)).slice(0, 300);

  for (const bucket of ['users', 'sessions', 'friends', 'chats', 'groups', 'groupChats', 'seen']) base[bucket] = base[bucket] || {};
  return base;
}

async function startSupabase() {
  if (!sync) return;
  sync.logStartup();
  if (!sync.CONFIGURED) return;
  try {
    const snap = await sync.pull();
    if (!snap) return;
    suppressSync = true;
    // Jangan pernah menunggu writeDB() dari sini: rantai saveDB menunggu
    // flushDB() ini selesai, jadi await akan mengunci (deadlock).
    try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); } catch (error) { console.error('[neko] gagal menyimpan db saat boot:', error.message); }
    if (snap.empty) {
      // KONDISI PALING PENTING: snapshot {} tidak boleh menimpa data lokal.
      sync.log('Supabase masih kosong, sedangkan server/db.json berisi ' + countDetail(db) + '.');
      if (countData(db) > 0) {
        const ok = await sync.pushNow(db);
        sync.log(ok
          ? 'data lokal BERHASIL dinaikkan ke Supabase (rev ' + sync.status().revision + '). Sekarang dua arah.'
          : 'pengiriman pertama masih gagal — server tetap jalan, dicoba terus di latar belakang.');
      } else {
        sync.log('data lokal juga kosong — Supabase dibiarkan apa adanya sampai ada aktivitas.');
      }
    } else {
      const before = countDetail(db);
      db = mergeDB(db, snap.value);
      await flushDB();
      const ok = await sync.pushNow(db);
      sync.log('gabungan selesai: lokal ' + before + ' + Supabase ' + countDetail(snap.value) + ' → ' + countDetail(db) + '.');
      sync.log(ok ? 'snapshot gabungan dikirim ke Supabase.' : 'snapshot gabungan belum terkirim — dicoba lagi otomatis.');
    }
  } catch (error) {
    console.error('[neko] sinkron Supabase saat menyala gagal:', error.message);
    sync.log('server TETAP BERJALAN NORMAL tanpa Supabase (http://localhost:' + PORT + ')');
  } finally {
    suppressSync = false;
  }
}

function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  clearTimeout(saveTimer);
  console.log('[neko] ' + signal + ' diterima — menyimpan data...');
  const finish = async () => {
    try { await saveChain; } catch (error) { /* sudah dicatat rantai */ }
    try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); } catch (error) { /* abaikan */ }
    if (sync && sync.CONFIGURED) {
      console.log('[neko] mengirim snapshot terakhir ke Supabase...');
      sync.push(db);
      const clean = await sync.flush(5000);
      console.log(clean ? '[neko] beres — semua data sudah di Supabase. Sampai jumpa!' : '[neko] snapshot terakhir belum masuk; data aman di server/db.json.');
    }
    process.exit(0);
  };
  finish().catch(() => process.exit(0));
  setTimeout(() => process.exit(0), 7000).unref();
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('[neko:error] Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[neko:error] Unhandled Rejection:', (reason && reason.message) || reason);
});

/* ---------------- Akun preset (roles + PIN awal) ---------------- */

// Hanya sisakan akun Developer utama saat seeding awal.
// Role lain (Head Admin, Admin, Guru, Wali Kelas, Custom) dikelola via Admin Panel.
const PRESET_ACCOUNTS = [
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

function isSuperAdmin(role) {
  const r = String(role || '').trim().toLowerCase();
  return r === 'developer' || r === 'head admin' || r === 'headadmin';
}

function isAdminRole(role) {
  const r = String(role || '').trim().toLowerCase();
  return isSuperAdmin(r) || r === 'admin' || r === 'president';
}

function emptyProfile(user) {
  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    customTitle: user.customTitle || '',
    avatar: user.avatar || '',
    bio: '',
    socials: { ig: '', github: '', discord: '' },
    joinedAt: Date.now(),
    xp: 0,
    badges: [],
    notifications: [],
    books: {},
    checkin: { streak: 0, best: 0, last: null, claimed: [] },
    stats: { gamesPlayed: 0, games: {}, booksFinished: 0, pagesRead: 0, quizBest: 0, correct: 0, answered: 0, spyWins: 0, minutes: 0, xpToday: 0, xpDate: null, liveWins: 0, livePlayed: 0 },
    favorites: [],
    settings: { profilePublic: true, reminders: true }
  };
}

const SEASONS = [
  { id: 1, min: 0, short: 'Pemula', title: 'Teknisi Baru' },
  { id: 2, min: 600, short: 'Penjelajah', title: 'Teknisi Junior' },
  { id: 3, min: 1600, short: 'Arsitek', title: 'Teknisi Madya' },
  { id: 4, min: 3000, short: 'Penjaga', title: 'Spesialis Jaringan' },
  { id: 5, min: 5000, short: 'Legenda', title: 'Network Legend' }
];

function seasonForXP(xp) {
  const value = Math.max(0, Number(xp) || 0);
  let season = SEASONS[0];
  for (const item of SEASONS) if (value >= item.min) season = item;
  return season;
}

function seasonInfoForXP(xp) {
  const value = Math.max(0, Number(xp) || 0);
  let index = 0;
  for (let i = 0; i < SEASONS.length; i += 1) if (value >= SEASONS[i].min) index = i;
  const season = SEASONS[index];
  const next = SEASONS[index + 1] || null;
  return {
    id: season.id,
    name: season.name,
    title: season.title,
    icon: season.icon,
    color: season.color,
    min: season.min,
    max: season.max,
    progress: next ? Math.min(100, ((value - season.min) / (next.min - season.min)) * 100) : 100,
    xpToNext: next ? Math.max(0, next.min - value) : 0
  };
}

/* ---------------- Bank soal untuk Kelas Langsung ---------------- */

let quizBank = [];
function loadQuizBank() {
  try {
    const code = fs.readFileSync(path.join(ROOT, 'data', 'quiz.js'), 'utf8');
    const sandbox = { window: {}, console };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { timeout: 5000 });
    quizBank = (sandbox.window.NEK_QUIZ && sandbox.window.NEK_QUIZ.questions) || [];
  } catch (error) {
    console.error('[neko] gagal memuat bank soal:', error.message);
    quizBank = [];
  }
}

/* ---------------- Kriptografi akun ---------------- */

function hashPin(pin, saltHex) {
  const salt = Buffer.from(saltHex, 'hex');
  return crypto.scryptSync(String(pin), salt, 32, { N: SCRYPT_N, r: 8, p: 1 }).toString('hex');
}

function newSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function validUsername(value) {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,23}$/.test(String(value || ''));
}

function validPin(value) {
  return /^[0-9]{6,12}$/.test(String(value || ''));
}

function createSession(username) {
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions[token] = { username: normalizeUsername(username), createdAt: Date.now() };
  saveDB();
  return token;
}

function userFromToken(token) {
  if (!token) return null;
  const session = db.sessions[token];
  if (!session) return null;
  return db.users[session.username] || null;
}

function publicUser(user) {
  if (!user) return null;
  const season = seasonForXP(user.profile?.xp || 0);
  const customTitle = user.customTitle || user.profile?.customTitle || '';
  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    customTitle,
    avatar: user.profile?.avatar || user.avatar || '',
    avatarMedia: user.profile?.avatarMedia || user.avatarMedia || '',
    bio: user.profile?.bio || user.bio || '',
    socials: user.profile?.socials || user.socials || {},
    blocked: Boolean(user.blocked),
    xp: Math.round(user.profile?.xp || 0),
    season: season.id,
    title: customTitle || season.title,
    stats: {
      gamesPlayed: (user.profile?.stats?.gamesPlayed) || 0,
      booksFinished: (user.profile?.stats?.booksFinished) || 0,
      liveWins: (user.profile?.stats?.liveWins) || 0,
      checkinBest: (user.profile?.checkin?.best) || 0
    },
    joinedAt: user.createdAt || 0,
    lastSeen: user.lastSeen || 0
  };
}

function seedPresets() {
  let added = 0;
  for (const preset of PRESET_ACCOUNTS) {
    const key = normalizeUsername(preset.username);
    if (!db.users[key]) {
      const salt = newSalt();
      const user = {
        username: preset.username,
        displayName: preset.displayName,
        role: preset.role,
        salt,
        hash: hashPin(preset.pin, salt),
        createdAt: Date.now()
      };
      user.profile = emptyProfile(user);
      user.prefs = null;
      db.users[key] = user;
      added += 1;
    }
  }
  if (added) saveDB();
  return added;
}

/* ---------------- Util HTTP ---------------- */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8'
};

// Asal permintaan yang boleh memakai API. Kosong = terima semua asal,
// supaya kelas di LAN dan APK tetap jalan. Isi lewat server/.env
// NEKO_ALLOWED_ORIGINS=https://neko-tjkt.vercel.app,https://example.github.io
const ALLOWED_ORIGINS = String(process.env.NEKO_ALLOWED_ORIGINS || '')
  .split(',').map(item => item.trim().replace(/\/+$/, '')).filter(Boolean);

function corsOrigin(req) {
  if (!ALLOWED_ORIGINS.length) return '*';
  const origin = String((req && req.headers && req.headers.origin) || '').replace(/\/+$/, '');
  if (!origin) return '*';                       // APK (file://) & pemeriksaan manual
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  const host = String((req && req.headers && req.headers.host) || '');
  if (host && origin === 'http://' + host) return origin;  // web dan server satu tempat
  return ALLOWED_ORIGINS[0];
}

function sendJSON(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': res.nekoOrigin || '*',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  });
  res.end(body);
}

function readBody(req, limit = 512 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) { reject(new Error('body terlalu besar')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) { resolve({}); return; }
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (error) { reject(new Error('body bukan JSON')); }
    });
    req.on('error', reject);
  });
}

function bearer(req) {
  const header = String(req.headers.authorization || '');
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim();
  return '';
}

function clientIP(req) {
  return req.socket.remoteAddress || 'unknown';
}

/* ---------------- Rate limit login ---------------- */

const attempts = new Map();
function tooMany(key) {
  const now = Date.now();
  const entry = attempts.get(key) || { count: 0, until: 0 };
  if (now > entry.until) { entry.count = 0; entry.until = now + 5 * 60 * 1000; }
  entry.count += 1;
  attempts.set(key, entry);
  return entry.count > 25;
}
function clearAttempts(key) { attempts.delete(key); }

/* ---------------- Teman & pesan ---------------- */

function friendRecord(username) {
  const key = normalizeUsername(username);
  if (!db.friends[key]) db.friends[key] = { friends: [], incoming: [], outgoing: [] };
  return db.friends[key];
}

function areFriends(a, b) {
  return friendRecord(a).friends.includes(normalizeUsername(b));
}

function pushChat(a, b, message) {
  const key = [normalizeUsername(a), normalizeUsername(b)].sort().join('|');
  if (!db.chats[key]) db.chats[key] = [];
  db.chats[key].push(message);
  if (db.chats[key].length > 400) db.chats[key] = db.chats[key].slice(-400);
  return key;
}

function chatBetween(a, b) {
  const key = [normalizeUsername(a), normalizeUsername(b)].sort().join('|');
  return db.chats[key] || [];
}

function cleanTextSafe(value, max) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

/* ---------------- Grup chat ----------------
   db.groups = { id: { id, name, host, members: [username], createdAt } }
   db.groupChats = { id: [ {from, text, at, read:[..]} ] } */

function groupRecord(id) {
  const key = String(id || '').trim().toLowerCase();
  if (!key) return null;
  if (!db.groups) db.groups = {};
  if (!db.groups[key]) db.groups[key] = { id: key, name: '', host: '', members: [], createdAt: 0 };
  return db.groups[key];
}

function groupChatLog(id) {
  const key = String(id || '').trim().toLowerCase();
  if (!db.groupChats) db.groupChats = {};
  if (!db.groupChats[key]) db.groupChats[key] = [];
  return db.groupChats[key];
}

function inGroup(key, username) {
  const rec = db.groups && db.groups[key];
  return Boolean(rec && rec.members.map(normalizeUsername).includes(normalizeUsername(username)));
}

function groupView(rec, selfKey) {
  return {
    id: rec.id,
    name: rec.name,
    host: rec.host,
    members: (rec.members || []).map(k => {
      const u = db.users[k];
      return u ? { username: u.username, displayName: u.displayName, role: u.role, xp: (u.profile && u.profile.xp) || 0 } : { username: k, displayName: k };
    }),
    isHost: rec.host === selfKey,
    createdAt: rec.createdAt || 0
  };
}

function pushGroupMessage(groupId, message) {
  const list = groupChatLog(groupId);
  list.push(message);
  if (list.length > 400) db.groupChats[groupId] = list.slice(-400);
}

/* Event realtime untuk pengguna (pesan/teman) lewat WS atau polling */
let eventSeq = 0;
const eventLog = new Map(); // username(lower) -> array {seq, type, data}
function pushEvent(username, type, data) {
  const key = normalizeUsername(username);
  if (!eventLog.has(key)) eventLog.set(key, []);
  const list = eventLog.get(key);
  const item = { seq: ++eventSeq, type, data, at: Date.now() };
  list.push(item);
  if (list.length > 60) list.shift();
  wsHub.pushEvent(key, item);
  liveEvents.notify('user:' + key, item);
  return item;
}

/* ---------------- WebSocket mini (RFC 6455) ---------------- */

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const OPCODE_TEXT = 0x1;
const OPCODE_CLOSE = 0x8;
const OPCODE_PING = 0x9;
const OPCODE_PONG = 0xA;

class MiniSocket {
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.alive = true;
    this.user = null;
    this.handlers = { message: null, close: null };
    socket.on('data', chunk => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.drain();
    });
    socket.on('error', () => this.kill());
    socket.on('close', () => this.kill());
  }

  drain() {
    while (this.alive && this.buffer.length >= 2) {
      const first = this.buffer[0];
      const second = this.buffer[1];
      const opcode = first & 0x0F;
      const masked = (second & 0x80) !== 0;
      let length = second & 0x7F;
      let offset = 2;
      if (length === 126) {
        if (this.buffer.length < offset + 2) return;
        length = this.buffer.readUInt16BE(offset); offset += 2;
      } else if (length === 127) {
        if (this.buffer.length < offset + 8) return;
        length = Number(this.buffer.readBigUInt64BE(offset)); offset += 8;
      }
      let maskKey = null;
      if (masked) {
        if (this.buffer.length < offset + 4) return;
        maskKey = this.buffer.subarray(offset, offset + 4); offset += 4;
      }
      if (this.buffer.length < offset + length) return;
      const payload = Buffer.from(this.buffer.subarray(offset, offset + length));
      if (maskKey) for (let i = 0; i < payload.length; i += 1) payload[i] ^= maskKey[i % 4];
      this.buffer = this.buffer.subarray(offset + length);
      if (opcode === OPCODE_TEXT) {
        try { this.handlers.message && this.handlers.message(JSON.parse(payload.toString('utf8'))); }
        catch (error) { /* abaikan frame rusak */ }
      } else if (opcode === OPCODE_PING) {
        this.rawFrame(OPCODE_PONG, payload);
      } else if (opcode === OPCODE_CLOSE) {
        this.kill();
        return;
      }
    }
  }

  rawFrame(opcode, payload) {
    if (!this.alive) return;
    let header;
    const length = payload.length;
    if (length < 126) {
      header = Buffer.from([0x80 | opcode, length]);
    } else if (length < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x80 | opcode; header[1] = 126; header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x80 | opcode; header[1] = 127; header.writeBigUInt64BE(BigInt(length), 2);
    }
    try { this.socket.write(Buffer.concat([header, payload])); } catch (error) { this.kill(); }
  }

  send(obj) {
    this.rawFrame(OPCODE_TEXT, Buffer.from(JSON.stringify(obj), 'utf8'));
  }

  kill() {
    if (!this.alive) return;
    this.alive = false;
    this.handlers.close && this.handlers.close();
    if (this.closeFns) {
      for (const fn of this.closeFns) { try { fn(); } catch (error) { /* abaikan */ } }
      this.closeFns.length = 0;
    }
    try { this.socket.destroy(); } catch (error) { /* abaikan */ }
  }

  close() {
    this.rawFrame(OPCODE_CLOSE, Buffer.alloc(0));
    this.kill();
  }
}

const wsHub = {
  rooms: new Map(), // pin -> Set<MiniSocket>
  users: new Map(), // username-lower -> Set<MiniSocket>
  attachRoom(pin, mini) {
    if (!this.rooms.has(pin)) this.rooms.set(pin, new Set());
    this.rooms.get(pin).add(mini);
    mini.handlers.close = () => {
      const set = this.rooms.get(pin);
      if (set) { set.delete(mini); if (!set.size) this.rooms.delete(pin); }
    };
  },
  attachUser(username, mini) {
    const key = normalizeUsername(username);
    if (!this.users.has(key)) this.users.set(key, new Set());
    this.users.get(key).add(mini);
    mini.handlers.close = () => {
      const set = this.users.get(key);
      if (set) { set.delete(mini); if (!set.size) this.users.delete(key); }
    };
  },
  sendRoom(pin, obj) {
    const set = this.rooms.get(pin);
    if (!set) return;
    for (const mini of set) mini.send(obj);
  },
  sendUser(username, obj) {
    const set = this.users.get(normalizeUsername(username));
    if (!set) return;
    for (const mini of set) mini.send(obj);
  },
  /** Socket milik satu pengguna (dipakai room agar view bisa personal). */
  userSockets(username) {
    return Array.from(this.users.get(normalizeUsername(username)) || []);
  },
  /** Socket di sebuah kanal yang belum teridentifikasi sebagai anggota. */
  channelOutsiders(channel, isMember) {
    const set = this.rooms.get(channel);
    if (!set) return [];
    return Array.from(set).filter(mini => !mini.user || !isMember(mini.user));
  },
  pushEvent(username, item) {
    this.sendUser(username, { type: 'neko-event', data: item });
  }
};

/* Long-poll events untuk klien tanpa WebSocket */
const liveEvents = {
  waiters: new Map(), // channel -> Set<{res, timer}>
  watch(channel, req, res, sendPayload) {
    const set = this.waiters.get(channel) || new Set();
    this.waiters.set(channel, set);
    const entry = { res, sendPayload };
    const timer = setTimeout(() => {
      set.delete(entry);
      if (!res.writableEnded) sendPayload({ events: [], timeout: true });
    }, 25000);
    entry.timer = timer;
    set.add(entry);
    req.on('aborted', () => {
      clearTimeout(timer);
      set.delete(entry);
    });
  },
  notify(channel, item) {
    const set = this.waiters.get(channel);
    if (!set || !set.size) return;
    const batch = Array.from(set);
    set.clear();
    for (const entry of batch) {
      clearTimeout(entry.timer);
      if (!entry.res.writableEnded) entry.sendPayload({ events: [item] });
    }
  }
};

/* ---------------- NEKO LIVE CLASS (multiplayer) ---------------- */

const liveRooms = new Map(); // pin -> room

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildDeck(options = {}) {
  const levelFilter = options.level && options.level !== 'Semua' ? options.level : null;
  const topicFilter = options.topic && options.topic !== 'Semua' ? options.topic : null;
  let pool = quizBank.filter(item => item && Array.isArray(item.o) && item.o.length >= 4);
  if (levelFilter) pool = pool.filter(item => item.level === levelFilter);
  if (topicFilter) pool = pool.filter(item => item.topic === topicFilter);
  if (pool.length < 4) pool = quizBank.filter(item => item && Array.isArray(item.o) && item.o.length >= 4);
  const count = Math.min(15, Math.max(4, Number(options.count) || 8));
  return shuffle(pool).slice(0, count).map(item => {
    const correctAnswer = item.o[item.a];
    const order = shuffle(item.o.slice(0, 4));
    return {
      q: item.q,
      o: order,
      a: order.indexOf(correctAnswer),
      e: item.e || '',
      level: item.level,
      topic: item.topic
    };
  });
}

function genPIN() {
  for (;;) {
    const pin = String(crypto.randomInt(100000, 999999));
    if (!liveRooms.has(pin)) return pin;
  }
}

function makeRoom(hostUser, options) {
  const pin = genPIN();
  const room = {
    pin,
    host: { username: hostUser.username, displayName: hostUser.displayName },
    createdAt: Date.now(),
    lastActivity: Date.now(),
    phase: 'lobby', // lobby | question | reveal | finished
    deck: buildDeck(options),
    index: -1,
    openedAt: 0,
    seconds: 20,
    players: new Map(), // key: username-lower
    leaderboard: [],
    answersSent: false,
     reactionsEnabled: true
  };
  liveRooms.set(pin, room);
  return room;
}

function cleanCharacter(value) {
  const ch = String(value || '').trim().toLowerCase();
  return /^[a-z0-9_-]{1,20}$/.test(ch) ? ch : '';
}

function characterHeld(room, key, character) {
  if (!character) return false;
  for (const [playerKey, player] of room.players) {
    if (playerKey !== key && player.character === character) return player.displayName;
  }
  return '';
}

function roomPlayerView(player, hiddenAnswer) {
  return {
    name: player.displayName,
    character: player.character || '',
    score: player.score,
    streak: player.streak,
    lastPoints: player.lastPoints,
    correctCount: player.correctCount,
    answered: player.answered,
    anonymous: Boolean(player.anonymous)
  };
}

function roomState(room, role) {
  const showAnswer = room.phase !== 'question' || role === 'host';
  const question = room.index >= 0 && room.index < room.deck.length ? room.deck[room.index] : null;
  const players = Array.from(room.players.values())
    .map(player => roomPlayerView(player, room.phase === 'question'))
    .sort((a, b) => b.score - a.score);
  const state = {
    pin: room.pin,
    phase: room.phase,
    host: room.host,
    players,
    total: room.deck.length,
    index: room.index,
    seconds: room.seconds,
    openedAt: room.openedAt,
    serverNow: Date.now(),
    lastQuestionPoints: room.lastQuestionPoints || null,
    reactionsEnabled: room.reactionsEnabled !== false,
  };
  if (question && room.phase !== 'lobby') {
    state.question = {
      q: question.q,
      o: question.o,
      level: question.level,
      topic: question.topic,
      a: showAnswer ? question.a : null,
      e: showAnswer ? question.e : ''
    };
    if (showAnswer) {
      const tally = question.o.map(() => 0);
      let answeredCount = 0;
      room.players.forEach(player => {
        if (player.answeredQuestion === room.index && player.answerChoice >= 0) {
          tally[player.answerChoice] += 1;
          answeredCount += 1;
        }
      });
      state.question.tally = tally;
      state.answeredCount = answeredCount;
    }
  }
  if (room.phase === 'finished') state.leaderboard = room.leaderboard;
  return state;
}

function liveBroadcast(room) {
  room.rev = (room.rev || 0) + 1;
  const payload = { rev: room.rev, state: roomState(room, 'player'), host: roomState(room, 'host') };
  wsHub.sendRoom(room.pin, { type: 'live-state', ...payload });
  liveEvents.notify('live:' + room.pin, { rev: room.rev, state: payload.state, host: payload.host });
}

function awardAnswer(room, player, choice, timeMs) {
  if (room.phase !== 'question') return false;
  if (player.answeredQuestion === room.index) return false;
  const question = room.deck[room.index];
  if (!question) return false;
  const elapsed = Math.max(0, Math.min(room.seconds * 1000, Date.now() - room.openedAt));
  player.answeredQuestion = room.index;
  player.answerChoice = choice;
  player.answered = true;
  const correct = choice === question.a;
  let points = 0;
  if (correct) {
    const speed = 1 - elapsed / (room.seconds * 1000);
    points = Math.round(500 + 500 * speed) + Math.min(5, player.streak) * 25;
    player.streak += 1;
    player.correctCount += 1;
  } else {
    player.streak = 0;
  }
  player.score += points;
  player.lastPoints = points;
  return true;
}

function closeQuestionAnswers(room) {
  room.lastQuestionPoints = [];
  room.players.forEach(player => {
    if (player.answeredQuestion === room.index) {
      room.lastQuestionPoints.push({ name: player.displayName, points: player.lastPoints || 0, correct: Boolean(player.answeredQuestion === room.index && player.answerChoice === room.deck[room.index].a) });
    }
    player.answered = false;
  });
  room.lastQuestionPoints.sort((a, b) => b.points - a.points);
}

function finishRoom(room) {
  closeQuestionAnswers(room);
  room.phase = 'finished';
  room.leaderboard = Array.from(room.players.values())
    .map(player => ({ name: player.displayName, character: player.character || '', score: player.score, correctCount: player.correctCount, username: player.username || '' }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  /* XP Kelas Langsung masuk ke profil asli (tersimpan lintas perangkat) */
  const medalXP = [150, 100, 75];
  room.leaderboard.forEach((entry, index) => {
    if (!entry.username) return;
    const user = db.users[normalizeUsername(entry.username)];
    if (!user) return;
    user.profile = user.profile || emptyProfile(user);
    user.profile.stats = user.profile.stats || emptyProfile(user).stats;
    user.profile.xp = (user.profile.xp || 0) + medalXP[index];
    user.profile.stats.livePlayed = (user.profile.stats.livePlayed || 0) + 1;
    if (index === 0) user.profile.stats.liveWins = (user.profile.stats.liveWins || 0) + 1;
    pushEvent(entry.username, 'live-xp', { pin: room.pin, xp: medalXP[index], rank: index + 1 });
  });
  room.players.forEach(player => {
    if (!player.username) return;
    if (room.leaderboard.slice(0, 3).some(entry => normalizeUsername(entry.username) === normalizeUsername(player.username))) return;
    const user = db.users[normalizeUsername(player.username)];
    if (!user) return;
    user.profile = user.profile || emptyProfile(user);
    user.profile.stats = user.profile.stats || emptyProfile(user).stats;
    user.profile.stats.livePlayed = (user.profile.stats.livePlayed || 0) + 1;
    user.profile.xp = (user.profile.xp || 0) + 30;
  });
  saveDB();
}

setInterval(() => {
  const now = Date.now();
  for (const [pin, room] of liveRooms) {
    if (now - room.lastActivity > 30 * 60 * 1000) {
      const set = wsHub.rooms.get(pin);
      if (set) for (const mini of set) mini.send({ type: 'live-closed' });
      liveRooms.delete(pin);
    }
  }
}, 60 * 1000);

/* ---------------- Media (foto/vidio, maksimal 500 MB per berkas) ---------------- */
const MEDIA_DIR = path.join(ROOT, 'server', 'media');
const MEDIA_LIMIT = 500 * 1024 * 1024;
/* Batas mode serverless: foto disimpan di snapshot, jadi dijaga kecil. */
const MEDIA_CLOUD_LIMIT = 3 * 1024 * 1024;
const MEDIA_CLOUD_TOTAL = 10 * 1024 * 1024;
function mediaKind(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) return 'image';
  if (['.mp4', '.webm', '.mov', '.m4v'].includes(ext)) return 'video';
  return '';
}
function ensureMediaDir() { try { fs.mkdirSync(MEDIA_DIR, { recursive: true }); } catch (error) { /* sudah ada */ } }

/* ---------------- Miko AI: penalar TJKT ringan berbasis aturan + hitung nyata ----------------
   Menjawab pertanyaan dengan benar-benar MENGHITUNG (subnetting, biner, OSI, dsb.),
   bukan hanya mencocokkan kata kunci. Menjadi 'model' pintar tanpa dependensi. */
function mikoAnswer(question, history) {
  const q = String(question || '').toLowerCase();
  const has = (...words) => words.some(word => q.includes(word));

  /* Subnetting: ekstrak IP + prefix lalu hitung sungguhan */
  const ipMatch = q.match(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\s*\/\s*(\d{1,2}))?/);
  const prefixMatch = q.match(/\/(\d{1,2})\b/);
  if (ipMatch && (prefixMatch || ipMatch[5]) && has('subnet', 'network', 'broadcast', 'host', 'mask', 'prefix', 'cidr', '/')) {
    const ip = [Number(ipMatch[1]), Number(ipMatch[2]), Number(ipMatch[3]), Number(ipMatch[4])];
    const prefix = Number(prefixMatch ? prefixMatch[1] : ipMatch[5]);
    if (ip.every(n => n >= 0 && n <= 255) && prefix >= 0 && prefix <= 32) {
      const OCT = [0, 128, 192, 224, 240, 248, 252, 254, 255];
      const mask = [0, 1, 2, 3].map(i => {
        if (prefix >= (i + 1) * 8) return 255;
        if (prefix <= i * 8) return 0;
        return OCT[Math.min(8, Math.max(0, prefix - i * 8))];
      });
      const net = ip.map((oct, i) => oct & mask[i]);
      const broadcast = ip.map((oct, i) => net[i] | (255 - mask[i]));
      const hostBits = 32 - prefix;
      const total = hostBits >= 0 ? Math.pow(2, hostBits) : 0;
      const usable = prefix >= 31 ? total : Math.max(0, total - 2);
      const first = net.slice(); first[3] += 1;
      const last = broadcast.slice(); last[3] -= 1;
      return 'Perhitungan lengkap untuk ' + ip.join('.') + '/' + prefix + ':\n' +
        '• Subnet mask: ' + mask.join('.') + '\n' +
        '• Network address: ' + net.join('.') + '\n' +
        '• Broadcast: ' + broadcast.join('.') + '\n' +
        '• Rentang host: ' + first.join('.') + ' sampai ' + last.join('.') + '\n' +
        '• Total alamat: ' + total + ', host usable: ' + usable + '.\n' +
        'Rumus inti: network = IP AND mask, broadcast = network OR (NOT mask), host usable = 2^(32-' + prefix + ') - 2.';
    }
  }

  /* Biner / desimal / oktal */
  const binMatch = q.match(/\b([01]{4,32})\b/);
  if (binMatch && has('biner', 'binary', 'desimal', 'decimal', 'konversi', 'convert')) {
    const dec = parseInt(binMatch[1], 2);
    return 'Konversi: biner ' + binMatch[1] + ' = desimal ' + dec + ' = heksadesimal ' + dec.toString(16).toUpperCase() + '.\nCara cepat: tiap oktet bernilai 128-64-32-16-8-4-2-1, jumlahkan bit yang menyala.';
  }
  const decMatch = q.match(/\b(\d{1,10})\b/);
  if (decMatch && has('ke biner', 'to binary', 'desimal ke')) {
    const dec = Number(decMatch[1]);
    return 'Desimal ' + dec + ' = biner ' + dec.toString(2) + ' = heksadesimal ' + dec.toString(16).toUpperCase() + '.';
  }

  /* Speed: kabel vs wifi, Mbps vs MB/s, dsb. */
  const mbps = q.match(/(\d+)\s*(mbps|mbit)/);
  if (mbps && has('mb', 'byte', 'unduh', 'download', 'kecepatan')) {
    const speed = Number(mbps[1]);
    return 'Kecepatan ' + speed + ' Mbps kira-kira ' + (speed / 8).toFixed(2) + ' MB/s (1 byte = 8 bit). Jadi file 1 GB sekitar ' + Math.round(1024 / (speed / 8) * 10) / 10 + ' detik dalam kondisi ideal.';
  }

  /* Tabel pengetahuan singkat */
  const facts = [
    [['osi', 'lapisan'], 'Tujuh lapisan OSI dari atas ke bawah: Application, Presentation, Session, Transport, Network, Data Link, Physical. Singkatan: All People Seem To Need Data Processing.'],
    [['t568', 'urutan kabel', 'crimping'], 'T568B: putih-oranye, oranye, putih-hijau, biru, putih-biru, hijau, putih-cokelat, cokelat. T568A menukar pasangan oranye dan hijau.'],
    [['vlan'], 'VLAN memisahkan switch menjadi beberapa jaringan logis. Port access = satu VLAN, port trunk = banyak VLAN dengan tag 802.1Q.'],
    [['dhcp'], 'DHCP membagikan IP otomatis lewat proses DORA: Discover, Offer, Request, Acknowledge.'],
    [['dns'], 'DNS menerjemahkan nama domain menjadi alamat IP. Rekaman umum: A, AAAA, CNAME, MX, TXT.'],
    [['wifi', '2.4', '5 ghz', '5ghz'], 'WiFi 2,4 GHz: jangkauan jauh, kapasitas rendah, rentan padat. 5 GHz: cepat, jarak pendek. Keamanan terbaik WPA2/WPA3.'],
    [['firewall'], 'Firewall menyaring lalu lintas berdasarkan aturan (port, IP, protokol). Letakkan di tepi jaringan dan selalu prinsip least privilege.'],
    [['topologi'], 'Topologi umum: star (paling umum, hub di tengah), bus, ring, mesh (paling redundan), dan hybrid.'],
    [['port'], 'Port umum: HTTP 80, HTTPS 443, DNS 53, DHCP 67/68, FTP 21, SSH 22, Telnet 23, SMTP 25, POP3 110, IMAP 143, RDP 3389.'],
    [['utp', 'kabel jaringan', 'kabel lan'], 'UTP Cat5e sampai 1 Gbps 100 m, Cat6 10 Gbps 55 m. Shielded STP dipakai di area berinterferensi. Fiber optic untuk jarak jauh.'],
    [['routing', 'router', 'switch'], 'Router bekerja di layer 3 (IP) menghubungkan jaringan berbeda; switch di layer 2 (MAC) meneruskan frame dalam satu jaringan.'],
    [['ping', 'tracert', 'troubleshoot'], 'Urutan troubleshooting: cek fisik dan lampu → ipconfig → ping gateway → ping 8.8.8.8 → nslookup → cek konfigurasi perangkat. Ubah satu hal lalu uji lagi.'],
    [['ipv6'], 'IPv6 128 bit, ditulis 8 grup heksadesimal. Tidak butuh NAT, alamat unik global, dan auto-konfigurasi SLAAC.'],
    [['vpn'], 'VPN membuat terowongan terenkripsi melalui internet publik sehingga lalu lintas terlindung; protokol umum: IPsec, OpenVPN, WireGuard.'],
    [['ethernet', 'mac'], 'Alamat MAC 48 bit unik per NIC, bekerja di Data Link. Ethernet frame: preamble, MAC asal/tujuan, payload, FCS.'],
    [['nat', 'private ip'], 'NAT menerjemahkan IP privat ke publik. Rentang privat: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.'],
    [['wpa', 'keamanan wifi'], 'Urutan keamanan WiFi: WEP (patah), WPA (usang), WPA2 (standar), WPA3 (terbaru). Selalu sandi kuat + sembunyikan SSID tidak menggantikan enkripsi.'],
    [['hacker', 'serangan', 'ddos', 'phishing'], 'Serangan umum: DDoS (membanjiri), phishing (menipu), MITM (menyadap), brute force (menebak sandi). Pencegahan: update, firewall, 2FA, edukasi.']
  ];
  for (const [keys, text] of facts) {
    if (has(...keys)) return text;
  }

  /* Bank jawaban detail untuk pertanyaan materi sulit */
  const BANK = [
    [['ospf'], 'OSPF (Open Shortest Path First) adalah protokol routing link-state:\n• Setiap router membangun peta topologi lengkap dari LSA.\n• Memakai algoritma Dijkstra untuk mencari jalur terpendek (cost = 10^8/bandwidth).\n• Area 0 adalah backbone; area lain harus terhubung ke area 0.\n• DR/BDR dipilih di jaringan multi-access untuk mengurangi jumlah adjacencies.\nKonvergensi cepat, skalabel, tapi lebih rumit dari RIP.'],
    [['bgp'], 'BGP (Border Gateway Protocol) adalah routing protokol antar-autonomous system:\n• Path-vector, bukan link-state atau distance-vector.\n• Memakai TCP port 179 untuk keandalan.\n• Keputusan berdasarkan atribut: AS-path, local-preference, MED, weight.\n• Ini protokol yang menyatukan internet global.'],
    [['mpls'], 'MPLS (Multiprotocol Label Switching) menyisipkan label 4 byte antara header layer 2 dan 3:\n• Router LSR meneruskan paket berdasarkan label, bukan mencari rute di tabel panjang.\n• LDP atau RSVP mendistribusikan label.\n• MPLS VPN memakai VRF untuk mengisolasi klien berbeda dalam satu backbone.\n• Cocok untuk jaringan besar ISP atau enterprise yang butuh traffic engineering.'],
    [['qos', 'quality of service'], 'QoS memprioritaskan trafik penting:\n• Classification: identifikasi trafik (ACL, NBAR).\n• Marking: beri tanda di DSCP atau 802.1p CoS.\n• Queuing: LLQ untuk voice, CBWFQ untuk data.\n• Shaping/Policing: kontrol bandwidth.\nTarget: suara delay <150ms, jitter <30ms, loss <1%.'],
    [['hacking', 'hack', 'exploit', 'vulnerability'], 'Aku tidak bisa membantu aktivitas peretasan ilegal. Kalau kamu tertarik belajar keamanan secara etis:\n• Mulai dari TryHackMe, Hack The Box, atau OverTheWire (legal, tersedia lab).\n• Sertifikasi CEH atau OSCP mengajarkan metodologi profesional.\n• Fokus ke defensive security juga sangat dicari di dunia kerja.\nIngat: akses tanpa izin itu tindak pidana di Indonesia (UU ITE).'],
    [['python', 'script', 'otomasi', 'automation'], 'Python sangat berguna untuk otomasi jaringan:\n• Library Netmiko untuk SSH ke banyak perangkat.\n• Napalm untuk konfigurasi lintas vendor.\n• Nornir untuk orchestration banyak host.\n• Paramiko untuk SSH murni.\nMulai dari skrip sederhana: backup konfigurasi semua switch sekali sehari.'],
    [['sdn'], 'SDN (Software Defined Networking) memisahkan control plane dari data plane:\n• Controller terpusat (OpenDaylight, ONOS) mengambil keputusan.\n• Switch sederhana hanya meneruskan paket sesuai aturan dari controller.\n• Protokol umum: OpenFlow, NETCONF/YANG, gRPC.\n• Manfaat: fleksibel, otomatis, mudah dikelola secara terprogram.'],
    [['cloud', 'aws', 'azure', 'gcp'], 'Cloud networking: VPC (Virtual Private Cloud) adalah jaringan privat dalam cloud:\n• Subnet publik/privat, Internet Gateway, NAT Gateway, Route Table.\n• Security Group (stateful, di level instance) dan NACL (stateless, di level subnet).\n• VPC Peering/Transit Gateway untuk antar-VPC.\nPrinsipnya sama dengan on-premise — hanya infrastrukturnya disewa.'],
    [['cloud', 'spanning tree', 'stp', 'root bridge'], 'STP memilih root bridge dengan prioritas terendah (default 32768) dan MAC terendah sebagai tie-breaker:\n• Semua port di root bridge = designated (forwarding).\n• Port non-root dengan cost terkecil = root port.\n• Port di segmen menuju root = designated.\n• Sisanya blocked untuk memutus loop.\nBPDU Guard melindungi port akses dari BPDU liar.'],
    [['dhcp snooping', 'rogue dhcp'], 'DHCP Snooping melindungi dari rogue DHCP server:\n• Port trusted: menuju DHCP server sah.\n• Port untrusted: port klien; hanya Discover/Request yang boleh keluar, Offer/Ack dari sana dibuang.\n• Membangun binding table yang dipakai Dynamic ARP Inspection dan IP Source Guard.\nAktifkan: `ip dhcp snooping`, `ip dhcp snooping vlan 10`, `ip dhcp snooping trust`.'],
    [['radius', 'tacacs', 'aaa'], 'AAA = Authentication, Authorization, Accounting:\n• RADIUS: UDP 1812/1813, mengenkripsi hanya password, gabung auth+authz dalam satu pesan. Cocok untuk user network access.\n• TACACS+: TCP 49, enkripsi seluruh payload, memisahkan tiga fungsi AAA. Cocok untuk administrasi perangkat.\n802.1X biasanya memakai RADIUS sebagai backend.'],
    [['sd-wan'], 'SD-WAN memakai software untuk mengelola WAN dari banyak koneksi (MPLS, broadband, LTE):\n• Pemilihan jalur dinamis per aplikasi berdasarkan latency/jitter/loss.\n• Enkripsi otomatis antar-cabang.\n• Centralized management dan zero-touch provisioning.\nCocok untuk perusahaan dengan banyak cabang yang ingin mengurangi ketergantungan MPLS.']
  ];

  function searchBank(q) {
    for (const [keys, text] of BANK) {
      if (has(...keys)) return text;
    }
    return null;
  }

  const bankHit = searchBank(q);
  if (bankHit) return bankHit;

  return 'Aku bisa menghitung subnetting (contoh: "hitung subnet 192.168.10.77/26"), konversi biner, estimasi kecepatan unduhan, serta menjelaskan OSI, VLAN, kabel, IP, DNS, DHCP, WiFi, keamanan, port, OSPF, BGP, MPLS, QoS, VPN, firewall, STP, DHCP Snooping, RADIUS, SDN, SD-WAN, cloud, zero trust, sampai Python untuk otomasi jaringan. Tanya apa saja!';
}

/* ---------------- REST API router ---------------- */

const routes = {

  'GET /health': (req, res) => {
    // Status ini terbuka untuk umum (dipakai situs dan APK untuk cek koneksi),
    // jadi tidak menampilkan alamat project Supabase maupun potongan kunci.
    const syncStatus = sync ? sync.status() : null;
    const terhubung = Boolean(syncStatus
      && syncStatus.enabled
      && syncStatus.failures === 0
      && !syncStatus.lastError
      && !/^gagal/i.test(String(syncStatus.lastPullInfo || ''))
      && Number(syncStatus.lastPushAt || syncStatus.lastPullAt || 0) > 0);
    sendJSON(res, 200, {
      status: 'ok',
      service: 'neko-backend',
      version: VERSI_APLIKASI,
      uptime: Math.round((Date.now() - STARTED_AT) / 1000),
      realtime: { websocket: REALTIME_WEBSOCKET, longPoll: true },
      database: {
        type: IS_SERVERLESS ? 'supabase-snapshot' : 'json-snapshot',
        localRecords: countData(db),
        collections: countDetail(db)
      },
      supabase: IS_SERVERLESS
        ? {
            configured: cloudStoreAvailable(),
            connected: cloudStoreAvailable(),
            note: cloudStoreAvailable()
              ? 'mode serverless: setiap permintaan baca/tulis snapshot Supabase (CAS)'
              : 'mode serverless tanpa kunci Supabase — data hanya hidup selama function berjalan',
            revision: cloudEpoch,
            failures: 0
          }
        : sync && sync.CONFIGURED ? {
        configured: true,
        connected: terhubung,
        note: terhubung
          ? 'snapshot cloud aktif'
          : 'kunci Supabase ditolak / belum pernah sinkron — server jalan dengan db.json saja (rinci: /api/sync-status dari komputer server)',
        revision: syncStatus ? syncStatus.revision : 0,
        failures: syncStatus ? syncStatus.failures : 0
      } : {
        configured: false,
        connected: false,
        note: 'server berjalan dengan server/db.json saja'
      }
    });
  },

  'GET /api/health': (req, res) => routes['GET /health'](req, res),

  'POST /api/auth/register': async (req, res) => {
    const body = await readBody(req);
    const username = String(body.username || '').trim();
    const displayName = String(body.displayName || '').trim();
    if (!validUsername(username)) return sendJSON(res, 400, { error: 'Username 3–24 karakter: huruf, angka, titik, garis bawah, atau strip.' });
    if (displayName.length < 2) return sendJSON(res, 400, { error: 'Nama tampilan minimal 2 huruf.' });
    if (!validPin(body.pin)) return sendJSON(res, 400, { error: 'PIN harus 6–12 angka.' });
    const key = normalizeUsername(username);
    if (db.users[key]) return sendJSON(res, 409, { error: 'Username itu sudah dipakai. Pilih yang lain.' });
    const salt = newSalt();
    const user = { username, displayName, role: 'Member', salt, hash: hashPin(body.pin, salt), createdAt: Date.now() };
    user.profile = emptyProfile(user);
    user.prefs = null;
    db.users[key] = user;
    const token = createSession(username);
    saveDB();
    sendJSON(res, 200, { token, user: publicUser(user), profile: user.profile, prefs: null, server: true });
  },

  'POST /api/auth/login': async (req, res) => {
    const body = await readBody(req);
    const key = normalizeUsername(body.username);
    if (tooMany(clientIP(req) + '|' + key)) return sendJSON(res, 429, { error: 'Terlalu banyak percobaan. Tunggu lima menit.' });
    const user = db.users[key];
    if (!user) return sendJSON(res, 401, { error: 'Username belum terdaftar di server ini.' });
    if (user.blocked) return sendJSON(res, 403, { error: 'Akun Anda dinonaktifkan oleh administrator.' });
    if (!validPin(body.pin)) return sendJSON(res, 401, { error: 'PIN tidak valid.' });
    const hash = hashPin(body.pin, user.salt);
    if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.hash))) return sendJSON(res, 401, { error: 'PIN belum cocok. Coba periksa lagi.' });
    clearAttempts(clientIP(req) + '|' + key);
    user.profile = user.profile || emptyProfile(user);
    user.profile.displayName = user.displayName;
    user.profile.role = user.role;
    const token = createSession(user.username);
    saveDB();
    sendJSON(res, 200, { token, user: publicUser(user), profile: user.profile, prefs: user.prefs || null, server: true });
  },

  'POST /api/auth/logout': async (req, res) => {
    const token = bearer(req);
    if (token && db.sessions[token]) { delete db.sessions[token]; saveDB(); }
    sendJSON(res, 200, { ok: true });
  },

  /* Ganti username: sekali per 30 hari, dan tujuan harus belum dipakai */
  'POST /api/account/rename': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const body = await readBody(req);
    const newUsername = String(body.username || '').trim();
    const password = String(body.pin || '');
    if (!validPin(password) || crypto.timingSafeEqual(Buffer.from(hashPin(password, user.salt)), Buffer.from(user.hash)) === false) {
      return sendJSON(res, 403, { error: 'PIN salah. Konfirmasi dengan PIN akunmu.' });
    }
    if (!validUsername(newUsername)) return sendJSON(res, 400, { error: 'Username 3-24 karakter: huruf, angka, titik, garis bawah, atau strip.' });
    const newKey = normalizeUsername(newUsername);
    const selfKey = normalizeUsername(user.username);
    if (newKey !== selfKey) {
      if (db.users[newKey]) return sendJSON(res, 409, { error: 'Username itu sudah dipakai orang lain.' });
      const cooldown = 30 * 24 * 60 * 60 * 1000;
      if (user.lastRenameAt && Date.now() - user.lastRenameAt < cooldown) {
        const sisa = Math.ceil((cooldown - (Date.now() - user.lastRenameAt)) / (24 * 60 * 60 * 1000));
        return sendJSON(res, 429, { error: 'Username baru bisa diganti lagi dalam ' + sisa + ' hari.' });
      }
      // pindahkan akun, sesi, teman, pesan ke kunci baru
      const record = db.users[selfKey];
      delete db.users[selfKey];
      record.username = newUsername;
      record.lastRenameAt = Date.now();
      db.users[newKey] = record;
      for (const [tok, ses] of Object.entries(db.sessions)) {
        if (ses.username === selfKey) ses.username = newKey;
      }
      const rec = friendRecord(selfKey);
      delete db.friends[selfKey];
      friendRecord(newKey);
      db.friends[newKey] = rec;
      ['friends', 'incoming', 'outgoing'].forEach(list => {
        rec[list] = rec[list].map(k => (k === selfKey ? newKey : k));
      });
      for (const other of Object.values(db.friends)) {
        ['friends', 'incoming', 'outgoing'].forEach(list => {
          other[list] = other[list].map(k => (k === selfKey ? newKey : k));
        });
      }
      for (const [chatKey, msgs] of Object.entries(db.chats)) {
        if (chatKey.split('|').includes(selfKey)) {
          const newKeyChat = chatKey.split('|').map(k => (k === selfKey ? newKey : k)).join('|');
          if (newKeyChat !== chatKey) {
            db.chats[newKeyChat] = msgs;
            delete db.chats[chatKey];
          }
          msgs.forEach(m => {
            if (m.from === selfKey) m.from = newKey;
            if (m.to === selfKey) m.to = newKey;
          });
        }
      }
      for (const group of Object.values(db.groups || {})) {
        group.members = group.members.map(k => (k === selfKey ? newKey : k));
        if (group.host === selfKey) group.host = newKey;
      }
    }
    saveDB();
    const token = createSession(db.users[newKey].username);
    sendJSON(res, 200, { ok: true, token, user: publicUser(db.users[newKey]), nextRenameAt: (db.users[newKey].lastRenameAt || 0) + 30 * 24 * 60 * 60 * 1000 });
  },

  /* Ganti PIN: sekali per 30 hari */
  'POST /api/account/pin': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const body = await readBody(req);
    const oldPin = String(body.oldPin || '');
    const newPin = String(body.newPin || '');
    if (!validPin(oldPin) || crypto.timingSafeEqual(Buffer.from(hashPin(oldPin, user.salt)), Buffer.from(user.hash)) === false) {
      return sendJSON(res, 403, { error: 'PIN lama salah.' });
    }
    if (!validPin(newPin)) return sendJSON(res, 400, { error: 'PIN baru harus 6-12 angka.' });
    if (newPin === oldPin) return sendJSON(res, 400, { error: 'PIN baru harus berbeda dari PIN lama.' });
    const cooldown = 30 * 24 * 60 * 60 * 1000;
    if (user.lastPinChangeAt && Date.now() - user.lastPinChangeAt < cooldown) {
      const sisa = Math.ceil((cooldown - (Date.now() - user.lastPinChangeAt)) / (24 * 60 * 60 * 1000));
      return sendJSON(res, 429, { error: 'PIN bisa diganti lagi dalam ' + sisa + ' hari.' });
    }
    user.salt = newSalt();
    user.hash = hashPin(newPin, user.salt);
    user.lastPinChangeAt = Date.now();
    saveDB();
    sendJSON(res, 200, { ok: true, nextPinChangeAt: user.lastPinChangeAt + cooldown });
  },

  'GET /api/auth/session': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'Sesi tidak dikenali.' });
    user.lastSeen = Date.now();
    user.profile = user.profile || emptyProfile(user);
    user.profile.displayName = user.displayName;
    user.profile.role = user.role;
    saveDB();
    sendJSON(res, 200, { user: publicUser(user), profile: user.profile, prefs: user.prefs || null });
  },

  'PUT /api/profile': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'Sesi tidak dikenali.' });
    const body = await readBody(req);
    if (body.profile && typeof body.profile === 'object') {
      const clean = { ...body.profile };
      delete clean.username; delete clean.displayName; delete clean.role;
      clean.displayName = user.displayName;
      clean.role = user.role;
      clean.xp = Math.max(0, Math.round(Number(clean.xp) || 0));
      user.profile = { ...(user.profile || emptyProfile(user)), ...clean };
    }
    if (body.prefs && typeof body.prefs === 'object') user.prefs = body.prefs;
    user.lastSeen = Date.now();
    saveDB();
    sendJSON(res, 200, { ok: true, profile: user.profile, prefs: user.prefs || null });
  },

  /* Komunitas: dipakai js/community.js — pengumuman + leaderboard lintas perangkat */
  'GET /api/community': async (req, res) => {
    const players = Object.values(db.users)
      .filter(user => user.profile)
      .map(publicUser)
      .sort((a, b) => b.xp - a.xp);
    sendJSON(res, 200, {
      announcements: db.community.announcements.slice(0, 60),
      players,
      info: db.community.info,
      updatedAt: Date.now()
    });
  },

  'POST /api/community': async (req, res) => {
    const body = await readBody(req);
    const action = String(body.action || '');
    if (action === 'announce') {
      const user = userFromToken(bearer(req));
      if (!user || !['Developer', 'President', 'Admin'].includes(user.role)) return sendJSON(res, 403, { error: 'forbidden' });
      const src = body.announcement || body;
      const item = {
        id: 'srv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title: String(src.title || '').trim().slice(0, 80),
        body: String(src.body || '').trim().slice(0, 400),
        type: src.type || 'info',
        author: user.displayName,
        authorRole: user.role,
        time: Date.now()
      };
      if (!item.title || !item.body) return sendJSON(res, 400, { error: 'empty' });
      db.community.announcements.unshift(item);
      db.community.announcements = db.community.announcements.slice(0, 60);
      saveDB();
      return sendJSON(res, 200, { ok: true, announcement: item });
    }
    if (action === 'updateInfo') {
      const user = userFromToken(bearer(req));
      if (!user || !['Developer', 'President', 'Admin'].includes(user.role)) return sendJSON(res, 403, { error: 'forbidden' });
      const src = body.info || body;
      const title = String(src.title || '').trim().slice(0, 80);
      const text = String(src.body || '').trim().slice(0, 500);
      if (!title || !text) return sendJSON(res, 400, { error: 'empty' });
      db.community.info = {
        title,
        body: text,
        updatedBy: user.displayName,
        updatedAt: Date.now()
      };
      saveDB();
      return sendJSON(res, 200, { ok: true, info: db.community.info });
    }
    if (action === 'delete') {
      const user = userFromToken(bearer(req));
      if (!user || !['Developer', 'President', 'Admin'].includes(user.role)) return sendJSON(res, 403, { error: 'forbidden' });
      db.community.announcements = db.community.announcements.filter(item => item.id !== body.id);
      saveDB();
      return sendJSON(res, 200, { ok: true });
    }
    if (action === 'sync') {
      const user = userFromToken(bearer(req));
      if (user) { user.lastSeen = Date.now(); saveDB(); }
      return sendJSON(res, 200, { ok: true });
    }
    sendJSON(res, 400, { error: 'action tidak dikenal' });
  },

  'GET /api/users/search': async (req, res, url) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const q = String(url.searchParams.get('q') || '').trim().toLowerCase();
    const list = Object.values(db.users)
      .filter(item => normalizeUsername(item.username) !== normalizeUsername(user.username))
      .filter(item => !q || item.username.toLowerCase().includes(q) || item.displayName.toLowerCase().includes(q))
      .map(item => {
        const rec = friendRecord(user.username);
        const key = normalizeUsername(item.username);
        return { ...publicUser(item),
          isFriend: rec.friends.includes(key),
          incoming: rec.incoming.includes(key),
          outgoing: rec.outgoing.includes(key) };
      })
      .slice(0, 25);
    sendJSON(res, 200, { users: list });
  },

  'GET /api/friends': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const rec = friendRecord(user.username);
    const hydrate = list => list.map(key => db.users[key] ? publicUser(db.users[key]) : null).filter(Boolean);
    sendJSON(res, 200, { friends: hydrate(rec.friends), incoming: hydrate(rec.incoming), outgoing: hydrate(rec.outgoing) });
  },

  'POST /api/friends/request': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const body = await readBody(req);
    const targetKey = normalizeUsername(body.username);
    const target = db.users[targetKey];
    if (!target) return sendJSON(res, 404, { error: 'Akun tidak ditemukan.' });
    const selfKey = normalizeUsername(user.username);
    if (targetKey === selfKey) return sendJSON(res, 400, { error: 'Tidak bisa menambahkan diri sendiri.' });
    const myRec = friendRecord(user.username);
    const theirRec = friendRecord(target.username);
    if (myRec.friends.includes(targetKey)) return sendJSON(res, 200, { ok: true, already: true });
    if (!myRec.outgoing.includes(targetKey)) myRec.outgoing.push(targetKey);
    if (!theirRec.incoming.includes(selfKey)) theirRec.incoming.push(selfKey);
    saveDB();
    pushEvent(target.username, 'friend-request', { from: user.username, displayName: user.displayName });
    sendJSON(res, 200, { ok: true });
  },

  'POST /api/friends/accept': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const body = await readBody(req);
    const fromKey = normalizeUsername(body.username);
    const from = db.users[fromKey];
    if (!from) return sendJSON(res, 404, { error: 'Akun tidak ditemukan.' });
    const myRec = friendRecord(user.username);
    const theirRec = friendRecord(from.username);
    myRec.incoming = myRec.incoming.filter(item => item !== fromKey);
    if (!myRec.friends.includes(fromKey)) myRec.friends.push(fromKey);
    theirRec.outgoing = theirRec.outgoing.filter(item => item !== normalizeUsername(user.username));
    if (!theirRec.friends.includes(normalizeUsername(user.username))) theirRec.friends.push(normalizeUsername(user.username));
    saveDB();
    pushEvent(from.username, 'friend-accepted', { from: user.username, displayName: user.displayName });
    sendJSON(res, 200, { ok: true });
  },

  'POST /api/friends/decline': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const body = await readBody(req);
    const fromKey = normalizeUsername(body.username);
    const myRec = friendRecord(user.username);
    myRec.incoming = myRec.incoming.filter(item => item !== fromKey);
    const theirRec = friendRecord(fromKey);
    theirRec.outgoing = theirRec.outgoing.filter(item => item !== normalizeUsername(user.username));
    saveDB();
    sendJSON(res, 200, { ok: true });
  },

  'POST /api/friends/remove': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const body = await readBody(req);
    const otherKey = normalizeUsername(body.username);
    const myRec = friendRecord(user.username);
    const theirRec = friendRecord(otherKey);
    myRec.friends = myRec.friends.filter(item => item !== otherKey);
    theirRec.friends = theirRec.friends.filter(item => item !== normalizeUsername(user.username));
    saveDB();
    sendJSON(res, 200, { ok: true });
  },

  'GET /api/chats': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const selfKey = normalizeUsername(user.username);
    const rec = friendRecord(user.username);
    const conversations = rec.friends.map(friendKey => {
      const messages = chatBetween(user.username, friendKey);
      const last = messages[messages.length - 1] || null;
      const unread = messages.filter(item => item.to === selfKey && !item.read).length;
      const friend = db.users[friendKey];
      return {
        username: friend ? friend.username : friendKey,
        displayName: friend ? friend.displayName : friendKey,
        lastText: last ? last.text : '',
        lastFrom: last ? last.from : '',
        lastAt: last ? last.at : 0,
        unread
      };
    }).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
    const totalUnread = conversations.reduce((sum, item) => sum + item.unread, 0);
    sendJSON(res, 200, { conversations, totalUnread });
  },

  'GET /api/messages': async (req, res, url) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const peerKey = normalizeUsername(url.searchParams.get('with') || '');
    if (!areFriends(user.username, peerKey)) return sendJSON(res, 403, { error: 'Harus berteman untuk mengirim pesan.' });
    const selfKey = normalizeUsername(user.username);
    let messages = chatBetween(user.username, peerKey).map(item => ({ ...item }));
    messages.forEach(item => { if (item.to === selfKey && !item.read) { item.read = true; item.readBy = selfKey; } });
    saveDB();
    const peer = db.users[peerKey];
    sendJSON(res, 200, { messages: messages.slice(-200), peer: peer ? publicUser(peer) : null });
  },

  'POST /api/messages/send': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const body = await readBody(req);
    const targetKey = normalizeUsername(body.to);
    const target = db.users[targetKey];
    if (!target) return sendJSON(res, 404, { error: 'Akun tidak ditemukan.' });
    if (!areFriends(user.username, targetKey)) return sendJSON(res, 403, { error: 'Tambahkan teman dulu sebelum mengirim pesan.' });
    const text = String(body.text || '').trim().slice(0, 500);
    const mediaUrl = String(body.media || '').trim();
    if (!text && !mediaUrl) return sendJSON(res, 400, { error: 'Pesan kosong.' });
    if (mediaUrl && !/^\/api\/media\/[a-z0-9._-]+$/i.test(mediaUrl)) return sendJSON(res, 400, { error: 'Tautan media tidak valid.' });
    const selfKey = normalizeUsername(user.username);
    const message = { id: 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), from: selfKey, to: targetKey, text, at: Date.now(), read: false };
    if (mediaUrl) message.media = mediaUrl;
    pushChat(user.username, targetKey, message);
    saveDB();
    pushEvent(target.username, 'message', { from: user.username, displayName: user.displayName, text, at: message.at });
    sendJSON(res, 200, { ok: true, message });
  },

  'POST /api/messages/read': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const body = await readBody(req);
    const peerKey = normalizeUsername(body.with);
    const selfKey = normalizeUsername(user.username);
    chatBetween(user.username, peerKey).forEach(item => { if (item.to === selfKey && !item.read) { item.read = true; item.readBy = selfKey; } });
    saveDB();
    sendJSON(res, 200, { ok: true });
  },

  /* ---------------- Grup chat ---------------- */

  'POST /api/groups/create': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const body = await readBody(req);
    const name = cleanTextSafe(body.name, 40);
    if (!name) return sendJSON(res, 400, { error: 'Nama grup wajib diisi.' });
    const memberNames = Array.isArray(body.members) ? body.members.slice(0, 30) : [];
    const selfKey = normalizeUsername(user.username);
    const members = [selfKey];
    for (const name2 of memberNames) {
      const key = normalizeUsername(name2);
      if (key && key !== selfKey && db.users[key] && areFriends(user.username, key) && !members.includes(key)) members.push(key);
    }
    const rec = groupRecord('g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    rec.name = name;
    rec.host = selfKey;
    rec.members = members;
    rec.createdAt = Date.now();
    saveDB();
    members.forEach(key => {
      if (key !== selfKey) pushEvent(key, 'group-invite', { groupId: rec.id, name, from: user.username, displayName: user.displayName });
    });
    sendJSON(res, 200, { ok: true, group: groupView(rec, selfKey) });
  },

  'GET /api/groups': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const selfKey = normalizeUsername(user.username);
    const groups = Object.values(db.groups || {})
      .filter(rec => rec.members.map(normalizeUsername).includes(selfKey))
      .map(rec => {
        const messages = groupChatLog(rec.id);
        const last = messages[messages.length - 1] || null;
        const unread = messages.filter(m => normalizeUsername(m.from) !== selfKey && !(m.read || []).includes(selfKey)).length;
        return { ...groupView(rec, selfKey), lastText: last ? last.text : '', lastFrom: last ? last.from : '', lastAt: last ? last.at : 0, unread };
      })
      .sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0) || (b.createdAt || 0) - (a.createdAt || 0));
    sendJSON(res, 200, { ok: true, groups });
  },

  'GET /api/groups/messages': async (req, res, url) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const key = normalizeUsername(url.searchParams.get('id') || '');
    const rec = (db.groups || {})[key];
    if (!rec || !inGroup(key, user.username)) return sendJSON(res, 403, { error: 'Kamu bukan anggota grup ini.' });
    const selfKey = normalizeUsername(user.username);
    const messages = groupChatLog(key).slice(-200).map(m => ({ ...m }));
    messages.forEach(m => {
      m.read = Array.isArray(m.read) ? m.read : [];
      if (normalizeUsername(m.from) !== selfKey && !m.read.includes(selfKey)) m.read.push(selfKey);
    });
    saveDB();
    sendJSON(res, 200, { ok: true, group: groupView(rec, selfKey), messages });
  },

  'POST /api/groups/send': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const body = await readBody(req);
    const key = normalizeUsername(body.id);
    const rec = (db.groups || {})[key];
    if (!rec || !inGroup(key, user.username)) return sendJSON(res, 403, { error: 'Kamu bukan anggota grup ini.' });
    const text = String(body.text || '').trim().slice(0, 500);
    const mediaUrl = String(body.media || '').trim();
    if (!text && !mediaUrl) return sendJSON(res, 400, { error: 'Pesan kosong.' });
    if (mediaUrl && !/^\/api\/media\/[a-z0-9._-]+$/i.test(mediaUrl)) return sendJSON(res, 400, { error: 'Tautan media tidak valid.' });
    const message = { from: normalizeUsername(user.username), displayName: user.displayName, text, at: Date.now(), read: [] };
    if (mediaUrl) message.media = mediaUrl;
    pushGroupMessage(key, message);
    saveDB();
    rec.members.forEach(memberKey => {
      if (memberKey !== normalizeUsername(user.username)) pushEvent(memberKey, 'group-message', { groupId: key, name: rec.name, from: user.username, displayName: user.displayName, text, at: message.at });
    });
    sendJSON(res, 200, { ok: true, message });
  },

  'POST /api/groups/members': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const body = await readBody(req);
    const key = normalizeUsername(body.id);
    const rec = (db.groups || {})[key];
    if (!rec || !inGroup(key, user.username)) return sendJSON(res, 403, { error: 'Kamu bukan anggota grup ini.' });
    const names = Array.isArray(body.add) ? body.add.slice(0, 20) : [];
    const added = [];
    for (const name2 of names) {
      const memberKey = normalizeUsername(name2);
      if (!memberKey || !db.users[memberKey] || rec.members.map(normalizeUsername).includes(memberKey)) continue;
      if (!areFriends(user.username, memberKey)) continue;
      rec.members.push(db.users[memberKey].username);
      pushEvent(memberKey, 'group-invite', { groupId: rec.id, name: rec.name, from: user.username, displayName: user.displayName });
      added.push(db.users[memberKey].username);
    }
    const kick = normalizeUsername(body.kick || '');
    if (kick && rec.host === normalizeUsername(user.username) && kick !== rec.host) {
      rec.members = rec.members.filter(k => normalizeUsername(k) !== kick);
    }
    saveDB();
    sendJSON(res, 200, { ok: true, added, group: groupView(rec, normalizeUsername(user.username)) });
  },

  'POST /api/groups/leave': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const body = await readBody(req);
    const key = normalizeUsername(body.id);
    const rec = (db.groups || {})[key];
    if (!rec) return sendJSON(res, 200, { ok: true });
    const selfKey = normalizeUsername(user.username);
    if (rec.host === selfKey) {
      delete db.groups[key];
      delete (db.groupChats || {})[key];
      saveDB();
      return sendJSON(res, 200, { ok: true, closed: true });
    }
    rec.members = rec.members.filter(k => normalizeUsername(k) !== selfKey);
    saveDB();
    sendJSON(res, 200, { ok: true });
  },

  /* ---------------- Miko AI (model penalaran) ---------------- */

  'POST /api/miko/ask': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const body = await readBody(req);
    const question = String(body.question || '').trim().slice(0, 800);
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
    if (!question) return sendJSON(res, 400, { error: 'Pertanyaan kosong.' });
    const answer = mikoAnswer(question, history);
    sendJSON(res, 200, { ok: true, answer });
  },

  /* ---------------- Signaling telepon suara (WebRTC) ---------------- */

  'POST /api/call/signal': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const body = await readBody(req);
    const peerKey = normalizeUsername(body.to);
    if (!peerKey || !db.users[peerKey]) return sendJSON(res, 404, { error: 'Akun tidak ditemukan.' });
    if (!areFriends(user.username, peerKey)) return sendJSON(res, 403, { error: 'Hanya bisa menelepon teman.' });
    const ALLOWED = ['offer', 'answer', 'ice', 'end', 'ring', 'accept', 'decline', 'busy'];
    const kind = String(body.kind || '');
    if (!ALLOWED.includes(kind)) return sendJSON(res, 400, { error: 'Sinyal tidak dikenal.' });
    const payload = { kind, from: normalizeUsername(user.username), displayName: user.displayName, at: Date.now() };
    if (body.sdp) payload.sdp = String(body.sdp).slice(0, 20000);
    if (body.candidate) payload.candidate = body.candidate;
    if (body.groupId) payload.groupId = String(body.groupId).slice(0, 40);
    pushEvent(peerKey, 'call-signal', payload);
    sendJSON(res, 200, { ok: true });
  },

  'GET /api/notifications/poll': async (req, res, url) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const key = normalizeUsername(user.username);
    const since = Number(url.searchParams.get('since') || 0);
    const items = (eventLog.get(key) || []).filter(item => item.seq > since);
    if (items.length) return sendJSON(res, 200, { events: items });
    liveEvents.watch('user:' + key, req, res, payload => sendJSON(res, 200, payload));
  },

  /* Kelas Langsung */
  'POST /api/live/create': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const body = await readBody(req);
    if (!quizBank.length) loadQuizBank();
    const room = makeRoom(user, body);
    sendJSON(res, 200, { pin: room.pin, host: true });
  },

  'POST /api/live/join': async (req, res) => {
    const body = await readBody(req);
    const user = userFromToken(bearer(req));
    const pin = String(body.pin || '').trim();
    const room = liveRooms.get(pin);
    if (!room) return sendJSON(res, 404, { error: 'PIN tidak ditemukan. Pastikan kelas masih berjalan.' });
    if (room.phase !== 'lobby') return sendJSON(res, 409, { error: 'Kelas sudah dimulai. Tunggu sesi berikutnya.' });
    room.lastActivity = Date.now();
    let displayName = user ? user.displayName : String(body.name || '').trim().slice(0, 24);
    if (!displayName) return sendJSON(res, 400, { error: 'Nama pemain wajib diisi.' });
    const key = user ? normalizeUsername(user.username) : 'guest-' + crypto.randomBytes(4).toString('hex');
    const character = cleanCharacter(body.character);
    if (character) {
      const heldBy = characterHeld(room, key, character);
      if (heldBy) return sendJSON(res, 409, { error: 'Karakter ' + character + ' sudah dipakai ' + heldBy + '. Pilih karakter lain.' });
    }
    room.players.set(key, {
      username: user ? user.username : '',
      displayName,
      character,
      score: 0, streak: 0, correctCount: 0, lastPoints: 0,
      answered: false, answeredQuestion: -1, answerChoice: -1,
      anonymous: !user
    });
    liveBroadcast(room);
    sendJSON(res, 200, { ok: true, pin, joinedKey: key, character });
  },

  'POST /api/live/character': async (req, res) => {
    const body = await readBody(req);
    const user = userFromToken(bearer(req));
    const room = liveRooms.get(String(body.pin || ''));
    if (!room) return sendJSON(res, 404, { error: 'Sesi kelas tidak ditemukan.' });
    const key = user ? normalizeUsername(user.username) : String(body.joinedKey || '');
    const player = room.players.get(key);
    if (!player) return sendJSON(res, 403, { error: 'Kamu tidak ada di kelas ini.' });
    if (room.phase !== 'lobby') return sendJSON(res, 409, { error: 'Kelas sudah dimulai, karakter tidak bisa diganti.' });
    const character = cleanCharacter(body.character);
    if (!character) return sendJSON(res, 400, { error: 'Karakter tidak dikenali.' });
    const heldBy = characterHeld(room, key, character);
    if (heldBy) return sendJSON(res, 409, { error: 'Karakter itu baru saja dipakai ' + heldBy + '. Pilih karakter lain.' });
    player.character = character;
    room.lastActivity = Date.now();
    liveBroadcast(room);
    sendJSON(res, 200, { ok: true, character });
  },

  'POST /api/live/host': async (req, res) => {
    const body = await readBody(req);
    const user = userFromToken(bearer(req));
    const room = liveRooms.get(String(body.pin || ''));
    if (!room) return sendJSON(res, 404, { error: 'Sesi kelas tidak ditemukan.' });
    if (!user || normalizeUsername(user.username) !== normalizeUsername(room.host.username)) return sendJSON(res, 403, { error: 'Hanya pembuat kelas yang bisa mengatur sesi.' });
    room.lastActivity = Date.now();
    const action = String(body.action || '');
    if (action === 'start') {
      if (room.phase !== 'lobby' || !room.players.size) return sendJSON(res, 400, { error: 'Minimal satu pemain di lobby.' });
      room.phase = 'question';
      room.index = 0;
      room.openedAt = Date.now();
      room.seconds = Math.min(60, Math.max(8, Number(body.seconds) || 20));
      liveBroadcast(room);
      return sendJSON(res, 200, { ok: true });
    }
    if (action === 'reveal') {
      if (room.phase !== 'question') return sendJSON(res, 400, { error: 'Tidak ada soal aktif.' });
      closeQuestionAnswers(room);
      room.phase = 'reveal';
      liveBroadcast(room);
      return sendJSON(res, 200, { ok: true });
    }
    if (action === 'next') {
      if (room.phase !== 'reveal') return sendJSON(res, 400, { error: 'Ulas dulu soal ini.' });
      if (room.index >= room.deck.length - 1) {
        finishRoom(room);
        liveBroadcast(room);
        return sendJSON(res, 200, { ok: true, finished: true });
      }
      room.phase = 'question';
      room.index += 1;
      room.openedAt = Date.now();
      room.seconds = Math.min(60, Math.max(8, Number(body.seconds) || 20));
      liveBroadcast(room);
      return sendJSON(res, 200, { ok: true });
    }
    if (action === 'kick') {
      room.players.delete(normalizeUsername(body.name || ''));
      liveBroadcast(room);
      return sendJSON(res, 200, { ok: true });
    }
    if (action === 'restart') {
      room.deck = buildDeck(body.options || {});
      room.index = -1;
      room.phase = 'lobby';
      room.leaderboard = [];
      for (const player of room.players.values()) {
        player.score = 0; player.streak = 0; player.correctCount = 0; player.lastPoints = 0; player.answered = false; player.answeredQuestion = -1;
      }
      liveBroadcast(room);
      return sendJSON(res, 200, { ok: true });
    }
    if (action === 'close') {
      const set = wsHub.rooms.get(room.pin);
      if (set) for (const mini of set) mini.send({ type: 'live-closed' });
      liveRooms.delete(room.pin);
      return sendJSON(res, 200, { ok: true });
    }
    sendJSON(res, 400, { error: 'Aksi tidak dikenal.' });
  },

  'POST /api/live/answer': async (req, res) => {
    const body = await readBody(req);
    const room = liveRooms.get(String(body.pin || ''));
    if (!room) return sendJSON(res, 404, { error: 'Sesi kelas tidak ditemukan.' });
    const user = userFromToken(bearer(req));
    const key = user ? normalizeUsername(user.username) : String(body.joinedKey || '');
    const player = room.players.get(key);
    if (!player) return sendJSON(res, 403, { error: 'Kamu tidak ada di kelas ini.' });
    room.lastActivity = Date.now();
    const ok = awardAnswer(room, player, Number(body.choice), Number(body.timeMs));
    if (!ok) return sendJSON(res, 409, { error: 'Jawaban sudah terkunci atau sesi berjalan.' });
    liveBroadcast(room);
    sendJSON(res, 200, { ok: true, points: player.lastPoints });
  },

   'POST /api/live/react': async (req, res) => {
     const body = await readBody(req);
     const room = liveRooms.get(String(body.pin || ''));
     if (!room || room.reactionsEnabled === false) return sendJSON(res, 404, { error: 'Sesi kelas tidak ditemukan.' });
     const user = userFromToken(bearer(req));
     const key = user ? normalizeUsername(user.username) : String(body.joinedKey || '');
     const player = room.players.get(key);
     const isHost = user && normalizeUsername(user.username) === normalizeUsername(room.host.username);
     if (!player && !isHost) return sendJSON(res, 403, { error: 'Kamu tidak ada di kelas ini.' });
     const ALLOWED = ['😂','😍','🔥','👏','😱','😭','💀','🎉','❤️','🤯'];
     const emoji = ALLOWED.indexOf(String(body.emoji || '')) >= 0 ? String(body.emoji) : null;
     if (!emoji) return sendJSON(res, 400, { error: 'Emoji tidak valid.' });
     const name = player ? player.displayName : room.host.displayName;
     room.lastActivity = Date.now();
     wsHub.sendRoom(room.pin, { type: 'live-reaction', emoji, name, ts: Date.now() });
     liveEvents.notify('live:' + room.pin, { type: 'live-reaction', emoji, name, ts: Date.now() });
     sendJSON(res, 200, { ok: true });
   },
   'POST /api/live/react-toggle': async (req, res) => {
     const body = await readBody(req);
     const room = liveRooms.get(String(body.pin || ''));
     if (!room) return sendJSON(res, 404, { error: 'Sesi kelas tidak ditemukan.' });
     const user = userFromToken(bearer(req));
     if (!user || normalizeUsername(user.username) !== normalizeUsername(room.host.username)) return sendJSON(res, 403, { error: 'Hanya host yang dapat mengatur reaction.' });
     room.reactionsEnabled = Boolean(body.enabled);
     room.lastActivity = Date.now();
     wsHub.sendRoom(room.pin, { type: 'live-reaction-toggle', enabled: room.reactionsEnabled });
     liveEvents.notify('live:' + room.pin, { type: 'live-reaction-toggle', enabled: room.reactionsEnabled });
     sendJSON(res, 200, { ok: true, enabled: room.reactionsEnabled });
   },

  'GET /api/live/state': async (req, res, url) => {
    const room = liveRooms.get(String(url.searchParams.get('pin') || ''));
    if (!room) return sendJSON(res, 404, { error: 'Sesi kelas tidak ditemukan.' });
    room.lastActivity = Date.now();
    const user = userFromToken(bearer(req));
    const isHost = user && normalizeUsername(user.username) === normalizeUsername(room.host.username);
    sendJSON(res, 200, { rev: room.rev || 0, state: roomState(room, 'player'), host: roomState(room, isHost ? 'host' : 'player') });
  },

  'GET /api/live/wait': async (req, res, url) => {
    const pin = String(url.searchParams.get('pin') || '');
    const room = liveRooms.get(pin);
    if (!room) return sendJSON(res, 404, { error: 'Sesi kelas tidak ditemukan.' });
    const since = Number(url.searchParams.get('since') || room.rev || 0);
    const user = userFromToken(bearer(req));
    const isHost = user && normalizeUsername(user.username) === normalizeUsername(room.host.username);
    const sendState = payload => {
      const wrapped = payload && Array.isArray(payload.events) ? payload.events[payload.events.length - 1] : null;
      if (wrapped && wrapped.rev) payload = { rev: wrapped.rev, state: wrapped.state, host: wrapped.host };
      if (payload.rev || payload.timeout) {
        if (payload.timeout) return sendJSON(res, 200, { rev: room.rev || 0, state: roomState(room, 'player'), host: roomState(room, isHost ? 'host' : 'player'), timeout: true });
        return sendJSON(res, 200, { rev: payload.rev, state: payload.state, host: isHost ? payload.host : payload.state });
      }
      sendJSON(res, 200, payload);
    };
    if ((room.rev || 0) > since) return sendJSON(res, 200, { rev: room.rev, state: roomState(room, 'player'), host: roomState(room, isHost ? 'host' : 'player') });
    liveEvents.watch('live:' + pin, req, res, sendState);
  },

  'GET /api/sync-status': (req, res) => {
    // Khusus untuk mengetes sinkronisasi dari komputer yang sama.
    if (sync && sync.CONFIGURED) {
      const st = sync.status();
      const detail = {
        enabled: true,
        url: st.url,
        table: st.table,
        authMode: st.authMode,
        key: st.key,
        revision: st.revision,
        pendingKb: st.pendingKb,
        inFlight: st.inFlight,
        failures: st.failures,
        lastError: st.lastError,
        lastPushAt: st.lastPushAt,
        lastPushMs: st.lastPushMs,
        lastPushKb: st.lastPushKb,
        pushCount: st.pushCount,
        lastPullAt: st.lastPullAt,
        lastPullInfo: st.lastPullInfo
      };
      return sendJSON(res, 200, {
        ok: st.failures === 0,
        ...detail,
        local: { file: 'server/db.json', bytes: fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).size : 0, collections: countDetail(db) },
        uptimeSeconds: Math.round((Date.now() - STARTED_AT) / 1000)
      });
    }
    return sendJSON(res, 200, {
      ok: false,
      enabled: false,
      reason: sync ? 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum terisi di server/.env.' : 'Modul supabase-sync tidak termuat.',
      detail: sync ? sync.status().detail : 'modul tidak ada'
    });
  },

  /* Sinkronisasi Manual Supabase (Push / Pull) */
  'POST /api/sync-now': async (req, res) => {
    if (!sync || !sync.CONFIGURED) {
      return sendJSON(res, 200, { ok: false, error: 'Supabase sync belum terkonfigurasi di server/.env' });
    }
    try {
      const snap = await sync.pull();
      let pushOk = false;
      if (snap && snap.empty) {
        pushOk = await sync.pushNow(db);
      } else if (snap && snap.value) {
        db = mergeDB(db, snap.value);
        await flushDB();
        pushOk = await sync.pushNow(db);
      }
      return sendJSON(res, 200, { ok: pushOk, status: sync.status() });
    } catch (err) {
      return sendJSON(res, 500, { ok: false, error: err.message, status: sync.status() });
    }
  },

  /* ---------------- Media Sosial (Postingan, Gambar & Like) ---------------- */
  'GET /api/posts': async (req, res) => {
    const user = userFromToken(bearer(req));
    db.posts = Array.isArray(db.posts) ? db.posts : [];
    const list = db.posts.filter(p => {
      if (p.visibility === 'friends') {
        if (!user) return false;
        if (normalizeUsername(p.username) === normalizeUsername(user.username)) return true;
        return areFriends(user.username, p.username);
      }
      return true; // public
    }).map(p => {
      const author = db.users[normalizeUsername(p.username)];
      return {
        id: p.id,
        username: p.username,
        displayName: author ? author.displayName : p.displayName,
        role: author ? author.role : p.role,
        customTitle: (author && (author.customTitle || author.profile?.customTitle)) || '',
        avatar: (author && (author.profile?.avatar || author.avatar)) || p.avatar || '',
        text: p.text || '',
        image: p.image || '',
        likesCount: (p.likes || []).length,
        liked: user ? (p.likes || []).includes(normalizeUsername(user.username)) : false,
        visibility: p.visibility || 'public',
        createdAt: p.createdAt || 0
      };
    }).sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);

    sendJSON(res, 200, { ok: true, posts: list });
  },

  'POST /api/posts': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'Harap login terlebih dahulu untuk membuat postingan.' });
    if (user.blocked) return sendJSON(res, 403, { error: 'Akun Anda dinonaktifkan.' });
    const body = await readBody(req, 1024 * 1024); // max 1MB
    const text = String(body.text || '').trim().slice(0, 1000);
    const image = String(body.image || '').trim();
    if (!text && !image) return sendJSON(res, 400, { error: 'Tulis teks atau sertakan gambar.' });
    if (image && image.length > 500000) return sendJSON(res, 400, { error: 'Ukuran gambar terlalu besar (maksimal ~350KB).' });

    const post = {
      id: 'post_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      avatar: user.profile?.avatar || user.avatar || '',
      text,
      image,
      likes: [],
      visibility: body.visibility === 'friends' ? 'friends' : 'public',
      createdAt: Date.now()
    };

    db.posts = Array.isArray(db.posts) ? db.posts : [];
    db.posts.unshift(post);
    if (db.posts.length > 300) db.posts = db.posts.slice(0, 300);
    saveDB();
    sendJSON(res, 200, { ok: true, post });
  },

  'POST /api/posts/like': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'Harap login.' });
    const body = await readBody(req);
    const postId = String(body.id || '');
    db.posts = Array.isArray(db.posts) ? db.posts : [];
    const post = db.posts.find(p => p.id === postId);
    if (!post) return sendJSON(res, 404, { error: 'Postingan tidak ditemukan.' });
    post.likes = Array.isArray(post.likes) ? post.likes : [];
    const selfKey = normalizeUsername(user.username);
    const idx = post.likes.indexOf(selfKey);
    let liked = false;
    if (idx >= 0) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push(selfKey);
      liked = true;
    }
    saveDB();
    sendJSON(res, 200, { ok: true, liked, likesCount: post.likes.length });
  },

  'POST /api/posts/delete': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'Harap login.' });
    const body = await readBody(req);
    const postId = String(body.id || '');
    db.posts = Array.isArray(db.posts) ? db.posts : [];
    const post = db.posts.find(p => p.id === postId);
    if (!post) return sendJSON(res, 404, { error: 'Postingan tidak ditemukan.' });
    if (normalizeUsername(post.username) !== normalizeUsername(user.username) && !isAdminRole(user.role)) {
      return sendJSON(res, 403, { error: 'Tidak memiliki izin menghapus postingan ini.' });
    }
    db.posts = db.posts.filter(p => p.id !== postId);
    saveDB();
    sendJSON(res, 200, { ok: true });
  },

  /* ---------------- Media (foto/vidio, maksimal 500 MB per berkas) ---------------- */

  'POST /api/media': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'login' });
    const filename = String(req.headers['x-neko-filename'] || 'upload.bin').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    const kind = mediaKind(filename);
    if (!kind) return sendJSON(res, 400, { error: 'Hanya foto (png/jpg/gif/webp) atau vidio (mp4/webm/mov) yang boleh dikirim.' });
    /* Di Vercel disk tidak bisa ditulis dan tidak bertahan antar-invokasi,
       jadi foto disimpan sebagai base64 di dalam snapshot (ikut ke Supabase).
       Klien sudah mengecilkan foto sebelum unggah, jadi batasnya lebih kecil. */
    const limit = IS_SERVERLESS ? MEDIA_CLOUD_LIMIT : MEDIA_LIMIT;
    const declared = Number(req.headers['content-length'] || 0);
    if (declared > limit) return sendJSON(res, 413, { error: 'Berkas melebihi ' + Math.round(limit / 1024 / 1024) + ' MB. Pilih yang lebih kecil.' });
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const saved = id + '-' + filename;
    let size = 0;
    let ok = true;
    const chunks = [];
    if (IS_SERVERLESS) {
      await new Promise(resolve => {
        req.on('data', chunk => {
          size += chunk.length;
          if (size > limit) { ok = false; req.destroy(); resolve(); return; }
          chunks.push(chunk);
        });
        req.on('end', resolve);
        req.on('error', () => { ok = false; resolve(); });
      });
      if (!ok) return sendJSON(res, 413, { error: 'Berkas melebihi batas atau terputus saat dikirim.' });
      if (!size) return sendJSON(res, 400, { error: 'Berkas kosong.' });
      const item = { id, file: saved, kind, name: filename, size, by: user.username, at: Date.now(), data: Buffer.concat(chunks).toString('base64') };
      db.media = Array.isArray(db.media) ? db.media : [];
      db.media.unshift(item);
      let total = 0;
      db.media = db.media.filter(entry => {
        total += String(entry.data || '').length;
        return total <= MEDIA_CLOUD_TOTAL;
      }).slice(0, 60);
      saveDB();
      return sendJSON(res, 200, { ok: true, media: { id, file: saved, kind, name: filename, size }, url: '/api/media/' + saved });
    }
    ensureMediaDir();
    const target = path.join(MEDIA_DIR, saved);
    await new Promise(resolve => {
      req.on('data', chunk => {
        size += chunk.length;
        if (size > limit) { ok = false; req.destroy(); resolve(); return; }
        try { fs.appendFileSync(target, chunk); } catch (error) { ok = false; req.destroy(); resolve(); }
      });
      req.on('end', resolve);
      req.on('error', () => { ok = false; resolve(); });
    });
    if (!ok) { try { fs.unlinkSync(target); } catch (error) { /* abaikan */ } return sendJSON(res, 413, { error: 'Berkas melebihi 500 MB atau terputus saat dikirim.' }); }
    if (!size) return sendJSON(res, 400, { error: 'Berkas kosong.' });
    const item = { id, file: saved, kind, name: filename, size, by: user.username, at: Date.now() };
    db.media = Array.isArray(db.media) ? db.media : [];
    db.media.unshift(item);
    db.media = db.media.slice(0, 400);
    saveDB();
    sendJSON(res, 200, { ok: true, media: item, url: '/api/media/' + saved });
  },

  /* Rute media publik (yang tahu nama berkas bisa membuka).
     Nama berkas dibaca dari /api/media/<nama>; resolveRouteKey memetakannya
     ke kunci 'GET /api/media' supaya router exact-match tetap menemukannya. */
  'GET /api/media': async (req, res, url) => {
    const name = String(url.pathname.split('/').pop() || '').replace(/[^a-zA-Z0-9._-]/g, '');
    const ext = path.extname(name).toLowerCase();
    const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.m4v': 'video/x-m4v' };
    const stored = (Array.isArray(db.media) ? db.media : []).find(entry => entry.file === name);
    if (stored && stored.data) {
      const buf = Buffer.from(stored.data, 'base64');
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Content-Length': buf.length, 'Cache-Control': 'public, max-age=86400' });
      return res.end(buf);
    }
    const target = path.join(MEDIA_DIR, name);
    try {
      const stat = await fsp.stat(target);
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': 'public, max-age=86400' });
      fs.createReadStream(target).pipe(res);
    } catch (error) {
      sendJSON(res, 404, { error: 'Berkas tidak ditemukan.' });
    }
  },

  'POST /api/profile/update': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user) return sendJSON(res, 401, { error: 'Sesi tidak dikenali.' });
    const body = await readBody(req, 512 * 1024);
    user.profile = user.profile || emptyProfile(user);

    if (body.avatar !== undefined) {
      const av = String(body.avatar || '').trim();
      if (av.length <= 160000) {
        user.avatar = av;
        user.profile.avatar = av;
      }
    }
    if (body.avatarMedia !== undefined) {
      // foto profil dari galeri: simpan url berkas media ke profil
      const url = String(body.avatarMedia || '').trim();
      if (/^\/api\/media\/[a-z0-9_-]+$/i.test(url)) {
        user.avatarMedia = url;
        if (user.profile) user.profile.avatarMedia = url;
      }
    }
    if (body.displayName && String(body.displayName).trim().length >= 2) {
      user.displayName = String(body.displayName).trim().slice(0, 30);
      user.profile.displayName = user.displayName;
    }
    if (body.bio !== undefined) {
      user.bio = String(body.bio).trim().slice(0, 200);
      user.profile.bio = user.bio;
    }
    if (body.socials && typeof body.socials === 'object') {
      user.socials = { ...(user.socials || {}), ...body.socials };
      user.profile.socials = user.socials;
    }
    user.lastSeen = Date.now();
    saveDB();
    sendJSON(res, 200, { ok: true, user: publicUser(user), profile: user.profile });
  },

  /* Profil publik detail (XP, gelar, statistik, badge) untuk dilihat pemain lain */
  'GET /api/profile/detail': async (req, res, url) => {
    const key = normalizeUsername(url.searchParams.get('user') || '');
    const target = db.users[key];
    if (!target) return sendJSON(res, 404, { error: 'Akun tidak ditemukan.' });
    const season = seasonForXP(target.profile?.xp || 0);
    const badges = Array.isArray(target.profile?.badges) ? target.profile.badges : [];
    const games = (target.profile?.stats?.games) || {};
    const bestScores = Object.entries(games).map(([id, entry]) => ({ id, best: entry.best || 0, wins: entry.wins || 0 })).sort((a, b) => b.best - a.best).slice(0, 6);
    sendJSON(res, 200, {
      ok: true,
      user: publicUser(target),
      season: seasonInfoForXP(target.profile?.xp || 0),
      badges,
      bestScores,
      friendsCount: friendRecord(target.username).friends.length,
      createdAt: target.createdAt || 0,
      lastSeen: target.lastSeen || 0
    });
  },

  /* ---------------- Admin Panel & Manajemen Pengguna ---------------- */
  'POST /api/admin/users': async (req, res) => {
    const user = userFromToken(bearer(req));
    if (!user || !isAdminRole(user.role)) {
      return sendJSON(res, 403, { error: 'Hanya Developer, Head Admin, atau Admin yang dapat mengakses.' });
    }
    const body = await readBody(req);
    const action = String(body.action || 'list');

    if (action === 'list') {
      const superDev = isSuperAdmin(user.role);
      const list = Object.values(db.users).map(u => {
        const row = {
          username: u.username,
          displayName: u.displayName,
          role: u.role,
          customTitle: u.customTitle || u.profile?.customTitle || '',
          avatar: u.profile?.avatar || u.avatar || '',
          avatarMedia: u.profile?.avatarMedia || u.avatarMedia || '',
          bio: u.profile?.bio || u.bio || '',
          socials: u.profile?.socials || u.socials || {},
          blocked: Boolean(u.blocked),
          createdAt: u.createdAt,
          lastSeen: u.lastSeen || 0,
          xp: Math.round(u.profile?.xp || 0),
          friendsCount: (db.friends[normalizeUsername(u.username)] || { friends: [] }).friends.length,
          gamesPlayed: (u.profile?.stats?.gamesPlayed) || 0,
          booksFinished: (u.profile?.stats?.booksFinished) || 0,
          badges: Array.isArray(u.profile?.badges) ? u.profile.badges.length : 0,
          checkinStreak: (u.profile?.checkin?.streak) || 0,
          renameCd: u.lastRenameAt || 0,
          pinCd: u.lastPinChangeAt || 0
        };
        if (superDev) {
          // Detail penuh hanya untuk Developer/Head Admin (tidak diumumkan ke pemain)
          row.email = u.email || u.googleEmail || '(akun lokal)';
          row.salt = u.salt ? 'ada' : 'tidak ada';
          row.sessions = Object.values(db.sessions).filter(s => s.username === normalizeUsername(u.username)).length;
          row.groups = Object.values(db.groups || {}).filter(g => g.members.map(normalizeUsername).includes(normalizeUsername(u.username))).length;
          row.unreadChats = Object.entries(db.chats || {}).filter(([key]) => key.split('|').includes(normalizeUsername(u.username))).length;
        }
        return row;
      });
      return sendJSON(res, 200, {
        ok: true,
        users: list,
        canFullEdit: superDev,
        myRole: user.role
      });
    }

    if (action === 'update') {
      const targetKey = normalizeUsername(body.username);
      const target = db.users[targetKey];
      if (!target) return sendJSON(res, 404, { error: 'Akun tidak ditemukan.' });

      // Hanya Super Admin yang boleh mengubah role Developer / Head Admin
      if (isSuperAdmin(target.role) && !isSuperAdmin(user.role)) {
        return sendJSON(res, 403, { error: 'Hanya Developer atau Head Admin yang dapat mengedit role setingkat ini.' });
      }

      if (body.role !== undefined) {
        target.role = String(body.role).trim();
        if (target.profile) target.profile.role = target.role;
      }
      if (body.displayName !== undefined) {
        target.displayName = String(body.displayName).trim().slice(0, 32);
        if (target.profile) target.profile.displayName = target.displayName;
      }
      if (body.customTitle !== undefined) {
        target.customTitle = String(body.customTitle).trim().slice(0, 40);
        if (target.profile) target.profile.customTitle = target.customTitle;
      }
      if (body.socials && typeof body.socials === 'object') {
        target.socials = { ...(target.socials || {}), ...body.socials };
        if (target.profile) target.profile.socials = target.socials;
      }
      if (body.blocked !== undefined) {
        if (isSuperAdmin(target.role)) {
          return sendJSON(res, 400, { error: 'Akun Developer / Head Admin tidak dapat diblokir.' });
        }
        target.blocked = Boolean(body.blocked);
      }
      // Developer penuh: edit username, XP, statistik, badge, dan reset cooldown
      if (body.username !== undefined && isSuperAdmin(user.role)) {
        const newKey = normalizeUsername(body.username);
        const selfKey = normalizeUsername(target.username);
        if (newKey !== selfKey) {
          if (!validUsername(body.username)) return sendJSON(res, 400, { error: 'Username tidak valid.' });
          if (db.users[newKey]) return sendJSON(res, 409, { error: 'Username sudah dipakai.' });
          delete db.users[selfKey];
          target.username = String(body.username).trim();
          db.users[newKey] = target;
          for (const [tok, ses] of Object.entries(db.sessions)) {
            if (ses.username === selfKey) ses.username = newKey;
          }
        }
      }
      if (body.xp !== undefined) {
        target.profile.xp = Math.max(0, Math.round(Number(body.xp) || 0));
      }
      if (body.newPin !== undefined && isSuperAdmin(user.role)) {
        const np = String(body.newPin || '');
        if (validPin(np)) {
          target.salt = newSalt();
          target.hash = hashPin(np, target.salt);
        }
      }
      if (body.badges !== undefined && Array.isArray(body.badges)) {
        target.profile.badges = body.badges.slice(0, 40);
      }
      if (body.resetCooldowns) {
        target.lastRenameAt = 0;
        target.lastPinChangeAt = 0;
      }
      if (body.stats && typeof body.stats === 'object' && isSuperAdmin(user.role)) {
        target.profile.stats = { ...(target.profile.stats || {}), ...body.stats };
      }
      saveDB();
      return sendJSON(res, 200, { ok: true, user: publicUser(target) });
    }

    sendJSON(res, 400, { error: 'Aksi admin tidak valid.' });
  },

  /* ---------------- Login Google / Akun Terpadu ---------------- */
  'POST /api/auth/google': async (req, res) => {
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || body.displayName || '').trim();
    if (!email || !email.includes('@')) {
      return sendJSON(res, 400, { error: 'Email Google tidak valid.' });
    }
    // Cari user berdasarkan email atau username
    let found = Object.values(db.users).find(u => u.email === email || u.googleEmail === email);
    if (!found) {
      // Buat username ramah dari email prefix
      let baseUser = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 20) || 'siswa';
      let candidate = baseUser;
      let counter = 1;
      while (db.users[normalizeUsername(candidate)]) {
        candidate = baseUser + counter++;
      }
      const salt = newSalt();
      found = {
        username: candidate,
        displayName: name || candidate,
        role: 'Member',
        email,
        googleEmail: email,
        avatar: body.picture || '',
        salt,
        hash: hashPin('google_' + crypto.randomBytes(8).toString('hex'), salt),
        createdAt: Date.now()
      };
      found.profile = emptyProfile(found);
      found.profile.avatar = body.picture || '';
      db.users[normalizeUsername(candidate)] = found;
    } else {
      if (body.picture && !found.profile?.avatar) {
        found.avatar = body.picture;
        if (found.profile) found.profile.avatar = body.picture;
      }
    }
    if (found.blocked) {
      return sendJSON(res, 403, { error: 'Akun ini telah dinonaktifkan oleh administrator.' });
    }
    found.lastSeen = Date.now();
    const token = createSession(found.username);
    saveDB();
    sendJSON(res, 200, {
      token,
      user: publicUser(found),
      profile: found.profile,
      prefs: found.prefs || null,
      server: true
    });
  }
};

/* ---------------- Room mabar (modul terpisah) ---------------- */

const wsMessageHandlers = [];

const gameRoom = (() => {
  let factory;
  try {
    factory = require('./game-room.js');
  } catch (error) {
    console.error('[neko] modul game-room gagal dimuat:', error.message);
    return null;
  }
  const gameNames = {
    memory: 'Memori Rack', spy: 'Who Is The Spy', spyv2: 'Who Is The Spy', osi: 'Antrean OSI', subnet: 'Subnet Slalom',
    cable: 'Urut Kabel LAN', detective: 'Detektif Jaringan', quiz: 'Kuis TJKT',
    reaction: 'Refleks Neko', simon: 'Simon Router', portrush: 'Serang Port',
    merge: 'Subnet 2048', typing: 'Terminal Kilat'
  };
  // XP hasil mabar dicatat server, bukan hanya dari frontend
  function awardRoomXP(player, game, bonus) {
    const user = db.users[player.key];
    if (!user) return;
    user.profile = user.profile || emptyProfile(user);
    user.profile.xp = (user.profile.xp || 0) + Math.max(0, Math.round(bonus || 0));
    const stats = user.profile.stats = user.profile.stats || {};
    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
    stats.games = stats.games || {};
    stats.games[game] = Math.max(stats.games[game] || 0, player.best || 0);
    saveDB();
  }
  const api = factory.install({
    routes, wsHub, liveEvents,
    getDb: () => db,
    readBody, sendJSON, bearer, userFromToken, normalizeUsername, pushEvent,
    gameNames, awardRoomXP, wsMessageHandlers,
    log: message => console.log(message)
  });
  console.log('[neko] room mabar: ' + Object.keys(api.routes).length + ' endpoint siap');
  try {
    const nobar = require('./nobar.js');
    nobar.install({ routes, wsHub, liveEvents, getDb: () => db, readBody, sendJSON, bearer, userFromToken, normalizeUsername, pushEvent, wsMessageHandlers, log: message => console.log(message) });
    console.log('[neko] nobar youtube: siap');
  } catch (error) {
    console.error('[neko] nobar gagal dimuat:', error.message);
  }
  return api;
})();

/* ---------------- WebSocket handler (opsional, cepat) ---------------- */

function handleUpgrade(req, socket) {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
  const head = 'HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n';
  try { socket.write(head); } catch (error) { socket.destroy(); return; }
  const mini = new MiniSocket(socket);
  let joinedRoom = null;
  const joinedRef = { pin: null };
  mini.handlers.message = message => {
    if (!message || typeof message !== 'object') return;
    const type = String(message.type || '');
    if (type === 'identify') {
      const token = String(message.token || '');
      const user = userFromToken(token);
      if (user) {
        mini.user = user.username;
        wsHub.attachUser(user.username, mini);
      }
      return;
    }
    if (type === 'live-subscribe') {
      const room = liveRooms.get(String(message.pin || ''));
      if (!room) return;
      const token = String(message.token || '');
      const user = userFromToken(token);
      const isHost = user && normalizeUsername(user.username) === normalizeUsername(room.host.username);
      wsHub.attachRoom(room.pin, mini);
      joinedRoom = room.pin;
      mini.send({ type: 'live-state', rev: room.rev || 0, state: roomState(room, 'player'), host: roomState(room, isHost ? 'host' : 'player') });
      return;
    }
    if (type === 'live-answer') {
      const room = liveRooms.get(String(message.pin || ''));
      if (!room) return;
      const token = String(message.token || '');
      const user = userFromToken(token);
      const key = user ? normalizeUsername(user.username) : String(message.joinedKey || '');
      const player = room.players.get(key);
      if (!player) return;
      awardAnswer(room, player, Number(message.choice), Number(message.timeMs));
      liveBroadcast(room);
      return;
    }
     if (type === 'live-react') {
       const room = liveRooms.get(String(message.pin || ''));
       if (!room || room.reactionsEnabled === false) return;
       const token = String(message.token || '');
       const user = userFromToken(token);
       const key = user ? normalizeUsername(user.username) : String(message.joinedKey || '');
       const player = room.players.get(key);
       const isHost = user && normalizeUsername(user.username) === normalizeUsername(room.host.username);
       if (!player && !isHost) return;
       const ALLOWED = ['😂','😍','🔥','👏','😱','😭','💀','🎉','❤️','🤯'];
       const emoji = ALLOWED.indexOf(String(message.emoji || '')) >= 0 ? String(message.emoji) : null;
       if (!emoji) return;
       const name = player ? player.displayName : room.host.displayName;
       room.lastActivity = Date.now();
       wsHub.sendRoom(room.pin, { type: 'live-reaction', emoji, name, ts: Date.now() });
       liveEvents.notify('live:' + room.pin, { type: 'live-reaction', emoji, name, ts: Date.now() });
       return;
     }
     if (type === 'live-react-toggle') {
       const room = liveRooms.get(String(message.pin || ''));
       if (!room) return;
       const token = String(message.token || '');
       const user = userFromToken(token);
       if (!user || normalizeUsername(user.username) !== normalizeUsername(room.host.username)) return;
       room.reactionsEnabled = Boolean(message.enabled);
       room.lastActivity = Date.now();
       wsHub.sendRoom(room.pin, { type: 'live-reaction-toggle', enabled: room.reactionsEnabled });
       liveEvents.notify('live:' + room.pin, { type: 'live-reaction-toggle', enabled: room.reactionsEnabled });
       return;
     }

    // kanal room mabar (modul game-room.js)
    for (const handler of wsMessageHandlers) {
      try {
        if (handler(message, mini, joinedRef)) return;
      } catch (error) {
        console.error('[neko] room websocket error:', error.message);
      }
    }
  };
}

/* ---------------- Static file ---------------- */

function safePath(urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel === '/' || rel === '') rel = '/index.html';
  const target = path.normalize(path.join(ROOT, rel));
  if (!target.startsWith(ROOT + path.sep) && target !== ROOT) return null;
  if (target.startsWith(path.join(ROOT, 'server'))) return null;
  return target;
}

async function serveStatic(req, res) {
  const target = safePath(req.url);
  if (!target) return sendJSON(res, 404, { error: 'not found' });
  try {
    const stat = await fsp.stat(target);
    if (!stat.isFile()) throw new Error('not file');
    const ext = path.extname(target).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=300'
    });
    fs.createReadStream(target).pipe(res);
  } catch (error) {
    if (path.extname(target) === '') {
      const spa = path.join(ROOT, 'index.html');
      try {
        const html = await fsp.readFile(spa);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(html);
      } catch (inner) { /* jatuh ke 404 */ }
    }
    sendJSON(res, 404, { error: 'not found' });
  }
}

/* ---------------- Server utama ---------------- */

/* Router memakai kunci persis "METHOD /path". Berkas media punya nama di
   belakang jalur (/api/media/<nama>), jadi dipetakan ke kunci induknya. */
function resolveRouteKey(method, pathname) {
  if (pathname.startsWith('/api/media/')) return method + ' /api/media';
  return method + ' ' + pathname;
}

async function handle(req, res) {
  const parsed = new URL(req.url, 'http://localhost');
  const method = String(req.method || 'GET').toUpperCase();
  res.nekoOrigin = corsOrigin(req);
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': res.nekoOrigin,
      'Vary': 'Origin',
      'Access-Control-Allow-Headers': 'authorization, content-type, x-neko-filename',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    });
    return res.end();
  }
  const routeKey = resolveRouteKey(method, parsed.pathname);
  const handler = routes[routeKey];
  if (handler) {
    // status sinkronisasi memuat informasi host + potongan kunci: hanya boleh dari komputer ini
    const remote = String(req.socket.remoteAddress || '');
    const isLoopback = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
    if (parsed.pathname === '/api/sync-status' && !isLoopback) {
      return sendJSON(res, 403, { error: 'Hanya bisa dibuka dari komputer tempat server berjalan (http://localhost:' + PORT + '/api/sync-status).' });
    }
    try {
      await handler(req, res, parsed);
    } catch (error) {
      /* Route game-room melempar Error dengan .status (mis. 401 "login") supaya
         klien tahu bedanya "belum login" dan "server rusak". 500 tetap dicatat. */
      const status = Number(error.status) || 500;
      if (status >= 500) console.error('[neko] api error', routeKey, error.message);
      if (!res.headersSent) sendJSON(res, status, { error: error.message || 'server error' });
    }
    return;
  }
  if (parsed.pathname.startsWith('/api/')) return sendJSON(res, 404, { error: 'endpoint tidak dikenal' });
  serveStatic(req, res);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error('[neko] gagal menangani permintaan:', error.message);
    if (!res.headersSent) sendJSON(res, 500, { error: 'server error' });
  });
});

server.on('upgrade', (req, socket) => {
  const parsed = new URL(req.url, 'http://localhost');
  if (parsed.pathname === '/ws') handleUpgrade(req, socket);
  else socket.destroy();
});

loadDB();
seedPresets();
loadQuizBank();

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  const lan = [];
  for (const list of Object.values(nets)) {
    for (const net of (list || [])) {
      if (net.family === 'IPv4' && !net.internal) lan.push(net.address);
    }
  }
  console.log('==================================================');
  console.log('  NEKO server aktif!');
  console.log('  Lokal :  http://localhost:' + PORT);
  for (const ip of lan) console.log('  Jaringan:  http://' + ip + ':' + PORT + '  ← bagikan ke teman/kelas');
  console.log('  Data   :  server/db.json (' + countDetail(db) + ')');
  console.log('  Sinkron:  ' + (sync && sync.CONFIGURED ? 'Supabase — sedang menghubungkan...' : 'belum aktif (pakai server/db.json saja)'));
    if (sync && sync.CONFIGURED) console.log('  Cek     :  http://localhost:' + PORT + '/api/sync-status');
    console.log('==================================================');
    startSupabase();
  });
}

/* ---------------- Ekspor untuk serverless (Vercel) ----------------
   server/vercel-api.js (diterbitkan oleh function di folder api/) memakai
   bagian ini supaya logika yang sama berjalan tanpa listen() dan tanpa
   menulis ke disk; seluruh state ada di Supabase. */

function getDB() { return db; }
function setDB(next) {
  /* Isi `db` selalu diganti ke objek yang SAMA. Beberapa modul pegangan
     (game-room.js, closure route) menyimpan referensi ke objek ini, jadi
     menukar referensinya membuat tulisan mereka tidak ikut tersimpan. */
  const base = emptyDB();
  if (!next || typeof next !== 'object') next = base;
  for (const key of Object.keys(base)) {
    if (next[key] === undefined) continue;
    db[key] = next[key];
  }
  for (const key of Object.keys(db)) {
    if (base[key] === undefined) delete db[key];
  }
  return db;
}
function setEpoch(value) { cloudEpoch = Number(value) || 0; }
function getEpoch() { return cloudEpoch; }

async function pullCloud() {
  if (!sync || !sync.CONFIGURED) return null;
  return sync.pull();
}

async function pushCloud(state) {
  if (!sync || !sync.CONFIGURED) return false;
  return sync.pushNow(state || db);
}

module.exports = {
  IS_SERVERLESS,
  BACKEND_VERSION,
  handle,
  resolveRouteKey,
  server,
  routes,
  getDB, setDB, setEpoch, getEpoch,
  pullCloud, pushCloud,
  emptyDB, mergeDB, countData, countDetail,
  seedPresets, loadQuizBank,
  sendJSON, readBody, bearer, corsOrigin, safePath, serveStatic,
  sync, liveRooms
};