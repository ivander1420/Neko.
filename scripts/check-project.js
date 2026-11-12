/* ============================================================
   NEKO · scripts/check-project.js
   Pemeriksaan cepat sebelum commit: semua file JavaScript harus
   bisa dibaca Node, manifest harus JSON valid, dan tidak ada
   kunci rahasia yang nyangkut di berkas yang ikut ter-commit.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
let masalah = 0;

function report(bad, message) {
  if (bad) { masalah += 1; console.error('[neko] ' + message); }
}

function walk(dir, skip) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (skip && skip.includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, skip);
    return [full];
  });
}

const folders = [
  ['js', ['node_modules']],
  ['data', []],
  ['server', ['supabase', 'tmp-roomtest.js', 'tmp-roomtest2.js', 'tmp-roomws.js']],
  ['scripts', []]
];

let jumlah = 0;
folders.forEach(([nama, skip]) => {
  walk(path.join(ROOT, nama), skip).forEach(file => {
    if (!file.endsWith('.js')) return;
    jumlah += 1;
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (error) {
      report(true, 'sintaks salah di ' + path.relative(ROOT, file) + ' -> ' + String(error.stderr || error.message).split('\n').slice(0, 3).join(' '));
    }
  });
});

['manifest.webmanifest', 'package.json'].forEach(nama => {
  const file = path.join(ROOT, nama);
  if (!fs.existsSync(file)) { report(true, nama + ' tidak ditemukan'); return; }
  try { JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { report(true, nama + ' bukan JSON yang valid -> ' + error.message); }
});

// Berkas yang ikut ter-commit tidak boleh menyimpan kunci layanan.
const polaKunci = /sb_secret_[A-Za-z0-9_-]{10,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|service_role["'\s]*[:=]/;
const kandidat = [
  ...walk(path.join(ROOT, 'js'), []),
  ...walk(path.join(ROOT, 'data'), []),
  ...walk(path.join(ROOT, 'server'), ['supabase']),
  path.join(ROOT, 'index.html'),
  path.join(ROOT, 'README.md')
].filter(file => /\.(js|html|md|json|css|example|bat|webmanifest)$/.test(file) && fs.existsSync(file));

kandidat.forEach(file => {
  const teks = fs.readFileSync(file, 'utf8');
  if (!polaKunci.test(teks)) return;
  const nama = path.basename(file);
  if (['.env', '.env.bak', 'db.json', 'db.json.bak'].includes(nama)) return; // sudah di .gitignore
  report(true, 'dugaan rahasia di ' + path.relative(ROOT, file) + ' — pindahkan ke server/.env');
});

console.log('[neko] memeriksa ' + jumlah + ' berkas JavaScript, manifest, dan pola rahasia.');
if (masalah) {
  console.error('[neko] ada ' + masalah + ' masalah. Perbaiki sebelum commit.');
  process.exitCode = 1;
} else {
  console.log('[neko] semua pemeriksaan lolos.');
}
