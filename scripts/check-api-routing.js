/* ============================================================
   NEKO · scripts/check-api-routing.js
   Memeriksa cara API NEKO diterbitkan di Vercel:

     1. satu function saja : api/neko.js
        (plan Hobby membatasi 12 function per deployment, jadi satu
         berkas per endpoint tidak mungkin dipakai)
     2. satu rewrite       : semua /api/... diarahkan ke /api/neko
     3. jalur asli diambil dari req.url — sudah diuji di deployment:
        Vercel mengirim URL asli apa adanya ke function tujuan rewrite.

   Daftar endpoint diambil dari server/server.js + server/game-room.js supaya
   pemeriksaan tidak memakai daftar yang ditulis tangan (cepat basi).
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SUMBER = ['server/server.js', 'server/game-room.js', 'server/nobar.js'];
const POLA = /['"](GET|POST|PUT|PATCH|DELETE) (\/api\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*)['"]/g;

function kumpulkanJalur() {
  const jalur = new Set();
  for (const rel of SUMBER) {
    const teks = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const cocok of teks.matchAll(POLA)) jalur.add(cocok[2]);
  }
  return Array.from(jalur).sort();
}

function periksa() {
  const masalah = [];
  const jalur = kumpulkanJalur();
  if (!jalur.length) masalah.push('tidak ada route /api yang ditemukan di ' + SUMBER.join(', '));

  if (!fs.existsSync(path.join(ROOT, 'api', 'neko.js'))) {
    masalah.push('api/neko.js hilang — semua /api/... akan 404');
  }

  const isiAPI = fs.existsSync(path.join(ROOT, 'api'))
    ? fs.readdirSync(path.join(ROOT, 'api'), { recursive: true, encoding: 'utf8' })
    : [];
  const functionLain = isiAPI.filter((nama) => typeof nama === 'string' && nama.endsWith('.js') && nama !== 'neko.js');
  if (functionLain.length > 1) {
    masalah.push('terlalu banyak function di api/ (' + functionLain.join(', ') +
      '). Plan Hobby membatasi 12 function: biarkan hanya api/neko.js.');
  }

  let konfigurasi = {};
  try {
    konfigurasi = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  } catch (error) {
    masalah.push('vercel.json tidak terbaca: ' + error.message);
  }
  const rewriteAPI = (konfigurasi.rewrites || []).some((aturan) =>
    String(aturan.source || '') === '/api/:path*' && String(aturan.destination || '') === '/api/neko');
  if (!rewriteAPI) masalah.push('vercel.json tidak punya rewrite { source: "/api/:path*", destination: "/api/neko" }');

  return { jalur, masalah };
}

module.exports = { kumpulkanJalur, periksa };
