const fs = require('fs');
const p = 'js/arena.js';
let s = fs.readFileSync(p, 'utf8');
const startMarker = "    {\r\n      id: 'arcade1', name: 'Flappy Paket'";
const si = s.indexOf(startMarker);
if (si < 0) throw new Error('start marker not found');
const ei = s.indexOf('  ];', si);
if (ei < 0) throw new Error('end marker not found');
const q = t => String(t).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const E = [
  { id: 'stack', name: 'Menara Server', icon: 'server', color: '#22d3ee', roundLabel: 'Target menara', rounds: [10, 15, 20], defaults: 15, tags: ['Arcade', 'Presisi'], desc: 'Tumpuk blok server jadi menara setinggi target. Blok meleset? Terpotong! Pas sempurna dapat combo.' },
  { id: 'knife', name: 'Tancap Konektor', icon: 'cable', color: '#f59e0b', roundLabel: 'Target stage', rounds: [3, 5, 7], defaults: 5, tags: ['Arcade', 'Timing'], desc: 'Lempar konektor ke router yang berputar. Hindari konektor yang sudah menancap — tamat setiap stage.' },
  { id: 'doodle', name: 'Lompat Awan', icon: 'cloud', color: '#a3e635', roundLabel: 'Target (meter)', rounds: [150, 300, 500], defaults: 300, tags: ['Arcade', 'Platform'], desc: 'Paket imut memantul dari awan ke awan. Arahkan kiri-kanan, pijak platform, panjat sampai target.' },
  { id: 'slice', name: 'Tebas Kabel', icon: 'crosshair', color: '#fb7185', roundLabel: 'Target poin', rounds: [200, 400, 600], defaults: 400, tags: ['Arcade', 'Swipe'], desc: 'Tebas perangkat jaringan yang melayang dengan sapuan. Hindari bom, jangan lewatkan 3 perangkat.' },
  { id: 'breakout', name: 'Pantul Brick', icon: 'grid', color: '#a78bfa', roundLabel: 'Target brick', rounds: [40], defaults: 40, tags: ['Arcade', 'Klasik'], desc: 'Pantulkan paket data dengan router, hancurkan semua brick server. Tiga nyawa, makin lama makin cepat.' },
  { id: 'colorswitch', name: 'Gerbang Warna', icon: 'sparkle', color: '#38bdf8', roundLabel: 'Target gerbang', rounds: [8, 12, 18], defaults: 12, tags: ['Arcade', 'Warna'], desc: 'Lompat melewati cincin warna berputar. Hanya warna yang cocok boleh lewat — salah warna, tamat!' },
  { id: 'piano', name: 'Tuts Piano', icon: 'keyboard', color: '#2dd4bf', roundLabel: 'Target tuts', rounds: [30, 50, 80], defaults: 50, tags: ['Arcade', 'Ritme'], desc: 'Tuts jaringan berjatuhan makin cepat. Ketuk tepat di garis untuk memainkannya — meleset satu saja, tamat.' },
  { id: 'shooter', name: 'Tembak Virus', icon: 'rocket', color: '#fb923c', roundLabel: 'Target virus', rounds: [20, 35, 50], defaults: 35, tags: ['Arcade', 'Tembak'], desc: 'Terbangkan router, basmi gelombang virus yang turun. Tiga nyawa — jangan biarkan virus lolos!' },
  { id: 'mines', name: 'Ranjau Jaringan', icon: 'shield', color: '#22d3ee', roundLabel: 'Jumlah virus', rounds: [8, 12, 18], defaults: 12, tags: ['Puzzle', 'Logika'], desc: 'Buka semua node aman tanpa menyentuh virus tersembunyi. Angka = jumlah virus di sekitar. Tandai dengan bendera.' },
  { id: 'pipe', name: 'Sambung Pipa', icon: 'cable', color: '#38bdf8', roundLabel: 'Ukuran papan', rounds: [5, 6, 7], defaults: 6, tags: ['Puzzle', 'Jalur'], desc: 'Putar potongan pipa untuk mengalirkan data dari sumber ke tujuan. Klik untuk memutar 90 derajat.' },
  { id: 'sort', name: 'Sortir Bola', icon: 'dice', color: '#a78bfa', roundLabel: 'Jumlah warna', rounds: [4, 5, 6], defaults: 5, tags: ['Puzzle', 'Sortir'], desc: 'Tuang bola antar tabung sampai tiap tabung berisi satu warna. Rencanakan langkahmu — dua tabung kosong membantumu.' },
  { id: 'match3', name: 'Cocok Tiga', icon: 'sparkle', color: '#fb7185', roundLabel: 'Target skor', rounds: [600, 1000, 1500], defaults: 1000, tags: ['Puzzle', 'Cocokkan'], desc: 'Tukar permata bersebelahan untuk membuat baris 3 atau lebih. Rantai kombo meledak — kejar target skor sebelum langkah habis.' },
  { id: 'lights', name: 'Padam Lampu', icon: 'bolt', color: '#facc15', roundLabel: 'Ukuran papan', rounds: [4, 5, 6], defaults: 5, tags: ['Puzzle', 'Logika'], desc: 'Matikan semua LED router. Menekan satu lampu membalik lampu itu dan tetangganya — temukan pola tepat.' },
  { id: 'gomoku', name: 'Lima Sejajar', icon: 'swords', color: '#a3e635', roundLabel: 'Ukuran papan', rounds: [10, 12, 14], defaults: 12, tags: ['Strategi', 'vs AI'], desc: 'Adu strategi melawan AI: buat lima batu berurutan sebelum lawan. Serang dan bertahan sekaligus.' }
];
const block = E.map(e =>
  "    {\r\n      id: '" + e.id + "', name: '" + q(e.name) + "', icon: '" + e.icon + "', color: '" + e.color + "',\r\n" +
  "      desc: '" + q(e.desc) + "',\r\n" +
  "      tags: " + JSON.stringify(e.tags) + ", players: 1, roundLabel: '" + q(e.roundLabel) + "', rounds: " + JSON.stringify(e.rounds) + ", defaults: " + e.defaults + "\r\n    },"
).join('\r\n');
const removed = s.slice(si, ei).split("id: 'arcade").length - 1;
s = s.slice(0, si) + block + '\r\n' + s.slice(ei);
fs.writeFileSync(p, s);
console.log('Removed arcade clones:', removed, '| Added distinct games:', E.length);