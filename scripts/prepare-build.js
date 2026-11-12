/* ============================================================
   NEKO · scripts/prepare-build.js
   Vercel memanggil "npm run build". Website NEKO file statis,
   jadi tidak ada yang dikompilasi. Skrip ini memeriksa bahwa
   semua berkas yang dibutuhkan benar-benar ada sebelum upload.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const WAJIB = [
  'index.html',
  'manifest.webmanifest',
  'favicon.svg',
  'vercel.json',
  'js/app.js',
  'js/api.js',
  'js/arena.js',
  'js/avatars.js',
  'js/book.js',
  'js/live.js',
  'js/rooms.js',
  'css/base.css',
  'css/book.css',
  'css/games.css',
  'css/rooms.css',
  'data/materials.js',
  'data/quiz.js',
  'data/spy.js'
];

const GAMES = fs.readdirSync(path.join(ROOT, 'js', 'games')).filter(name => name.endsWith('.js'));

function fail(message) {
  console.error('[neko] BUILD GAGAL: ' + message);
  process.exitCode = 1;
}

const hilang = WAJIB.filter(rel => !fs.existsSync(path.join(ROOT, rel)));
if (hilang.length) fail('berkas wajib tidak ditemukan -> ' + hilang.join(', '));

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const versi = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;

const refs = html.match(/\?v=([0-9.]+)/g) || [];
if (!refs.length) fail('index.html tidak memakai penanda versi ?v= untuk cache busting.');
const beda = Array.from(new Set(refs.map(item => item.slice(3)))).filter(item => item !== versi);
if (beda.length) console.warn('[neko] PERHATIAN: penanda ?v= di index.html ' + beda.join(', ') + ' berbeda dari package.json ' + versi + '.');

const scripts = (html.match(/<script[^>]+src="\.\/([^"]+)"/g) || []).map(tag => tag.replace(/^<script[^>]+src="\.\//, '').replace(/"?$/, ''));
const belum = scripts.filter(rel => !fs.existsSync(path.join(ROOT, rel.split('?')[0])));
if (belum.length) fail('script di index.html menunjuk berkas yang tidak ada -> ' + belum.join(', '));

const styles = (html.match(/<link[^>]+href="\.\/([^"]+\.css[^"]*)"/g) || []).map(tag => tag.replace(/^<link[^>]+href="\.\//, '').replace(/"?$/, ''));
const cssBelum = styles.filter(rel => !fs.existsSync(path.join(ROOT, rel.split('?')[0])));
if (cssBelum.length) fail('stylesheet di index.html menunjuk berkas yang tidak ada -> ' + cssBelum.join(', '));

const metaServer = /<meta name="neko-server-base" content="([^"]*)"/.exec(html);
if (!metaServer) fail('index.html kehilangan <meta name="neko-server-base"> untuk alamat server.');

/* --- API di Vercel: satu function + satu rewrite, bukan satu per endpoint ---
   Plan Hobby membatasi 12 function, jadi seluruh /api/... harus lewat
   api/neko.js. Periksa juga endpoint yang dipanggil browser benar-benar
   ada di server supaya tidak ada yang jadi 404 di produksi. */
const routing = require('./check-api-routing.js');
const hasilRouting = routing.periksa();
for (const masalah of hasilRouting.masalah) fail(masalah);

const dipanggil = new Set();
for (const nama of fs.readdirSync(path.join(ROOT, 'js'))) {
  if (!nama.endsWith('.js')) continue;
  const teks = fs.readFileSync(path.join(ROOT, 'js', nama), 'utf8');
  for (const cocok of teks.matchAll(/['"`]\/?api\/([a-z0-9_-]+(?:\/[a-z0-9_-]+)*)/gi)) {
    dipanggil.add('/api/' + cocok[1].toLowerCase());
  }
}
const tanpaRute = Array.from(dipanggil).filter((rel) => !hasilRouting.jalur.includes(rel));
if (tanpaRute.length) console.warn('[neko] PERHATIAN: js/ memanggil endpoint yang tidak ada di server -> ' + tanpaRute.join(', '));
console.log('[neko] api: ' + hasilRouting.jalur.length + ' endpoint lewat 1 function (api/neko.js)');

console.log('[neko] berkas statis: ' + WAJIB.length + ' wajib, ' + scripts.length + ' script, ' + styles.length + ' stylesheet OK');
console.log('[neko] game di arena: ' + GAMES.length + ' (' + GAMES.map(name => name.replace('.js', '')).join(', ') + ')');
console.log('[neko] alamat server bawaan: ' + (metaServer[1] ? metaServer[1] : 'sama dengan alamat halaman (konfigurasi lewat Pengaturan → Alamat server)'));
console.log('[neko] versi ' + versi + ' — build siap diunggah.');
