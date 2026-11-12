/* ============================================================
   NEKO · js/mascot.js
   Miko: satu-satunya maskot dan asisten. SVG berekspresi, teman
   mengobrol, dan pemahaman pertanyaan TJKT dalam bahasa santai.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { esc } = Neko.util;
  const { icon } = Neko.icons;

  const tint = (token, pct, toward) => 'color-mix(in oklab, ' + (token.startsWith('--') ? 'var(' + token + ')' : token) + ') ' + pct + '%, ' + toward + ')';

  const cast = {
    miko: {
      id: 'miko', name: 'Miko', role: 'Teman Belajar', icon: 'paw',
      colors: { fur: 'var(--accent-2)', shade: tint('--accent-2', 64, '#04101c'), cheek: tint('--danger', 55, '#fff'), inner: tint('--accent-2', 30, '#fff') },
      greeting: 'Hai, aku Miko — teman belajarmu di NEKO. Aku tahu semua materi TJKT: subnet, OSI, VLAN, kabel, IP, WiFi, troubleshooting, keamanan, sampai fitur aplikasi ini. Tanya apa saja, ya!',
      voice: 'Ada yang bisa kubantu?'
    }
  };

  /* Semua topik dipegang Miko; tidak ada lagi pembagian tugas antar maskot. */
  const owner = {
    subnet: 'miko', osi: 'miko', vlan: 'miko', cable: 'miko', ip: 'miko', wifi: 'miko',
    troubleshoot: 'miko', security: 'miko', basic: 'miko', book: 'miko',
    game: 'miko', live: 'miko', xp: 'miko', motivation: 'miko',
    theme: 'miko', checkin: 'miko', message: 'miko',
    help: 'miko', identity: 'miko', thanks: 'miko', greeting: 'miko', farewell: 'miko'
  };

  const territory = {
    miko: 'materi TJKT, arena game, XP, dan seluruh fitur NEKO'
  };

  function ownTopics(charId) {
    return order.filter(id => owner[id] === charId);
  }

  const books = () => (window.NEK_MATERIALS?.books || []);

  function palette(id) {
    const info = cast[id] || cast.miko;
    return '--m-fur:' + info.colors.fur + ';--m-shade:' + info.colors.shade + ';--m-cheek:' + info.colors.cheek + ';--m-inner:' + info.colors.inner;
  }

  function uid(prefix) { return prefix + '-' + Math.random().toString(36).slice(2, 7); }

  function accessory(id, mood) {
    if (id === 'miko') {
      return (
        '<path d="M32 39c8 5 18 7 28 7s20-2 28-7" fill="none" stroke="var(--m-shade)" stroke-width="7" stroke-linecap="round" opacity=".85"/>' +
        '<path d="M60 31.5l5.8 9.2h-4.4l3 8.2-7.4-10.2h4.5z" fill="var(--warn)" stroke="color-mix(in srgb,var(--m-shade) 55%,#000)" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<ellipse cx="60" cy="39.5" rx="2.8" ry="1.2" fill="#fff" opacity=".55"/>' +
        (mood === 'cheer' ? '<path d="M16 46l3 3-3 3M104 46l-3 3 3 3" stroke="var(--warn)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : '')
      );
    }
    if (id === 'neksya') {
      return (
        /* Pita pink di telinga kiri */
        '<g><path d="M30 18c-4-5-9-6-12-3 2 4 5 6 9 7z" fill="#ff5fa8" stroke="#c2306e" stroke-width="1"/><path d="M33 16c-1-6 2-10 6-10 2 4 1 8-2 11z" fill="#ff8cc6" stroke="#c2306e" stroke-width="1"/><circle cx="31.5" cy="18.5" r="3" fill="#ffb3dd" stroke="#c2306e" stroke-width="1"/></g>' +
        /* Kacamata bulat besar imut */
        '<g opacity=".95"><ellipse cx="47.5" cy="51" rx="12.4" ry="11.6" fill="color-mix(in srgb,#ff5fa8 14%,#fff)" fill-opacity=".28" stroke="#c2306e" stroke-width="2.6"/>' +
        '<ellipse cx="72.5" cy="51" rx="12.4" ry="11.6" fill="color-mix(in srgb,#ff5fa8 14%,#fff)" fill-opacity=".28" stroke="#c2306e" stroke-width="2.6"/>' +
        '<path d="M59.9 51h.2M36.3 49.5l-8-3.2M83.7 49.5l8-3.2" stroke="#c2306e" stroke-width="2.4" stroke-linecap="round"/>' +
        /* Kilau mata di lensa */
        '<path d="M42 47c2-2.4 5.4-3 7.6-1.2" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/>' +
        '<path d="M67 47c2-2.4 5.4-3 7.6-1.2" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/>' +
        '<circle cx="43.5" cy="55" r="1.6" fill="#fff" opacity=".5"/><circle cx="68.5" cy="55" r="1.6" fill="#fff" opacity=".5"/></g>' +
        /* Buku pink yang dipeluk */
        '<g><rect x="44" y="78.5" width="32" height="10" rx="2.6" fill="#e75fa0" stroke="#a83468" stroke-width="1"/>' +
        '<path d="M60 78.5v10" stroke="#a83468" stroke-width="1.2"/>' +
        '<rect x="46.5" y="80.5" width="11" height="2.4" rx="1.2" fill="#fff" opacity=".4"/>' +
        '<rect x="46.5" y="84.5" width="7" height="1.8" rx=".9" fill="#fff" opacity=".25"/>' +
        '<rect x="62" y="80.5" width="11" height="2.4" rx="1.2" fill="#ffd" opacity=".55"/></g>'
      );
    }
    return (
      '<ellipse cx="60" cy="84.5" rx="10.5" ry="6.2" fill="var(--m-shade)" opacity=".9"/>' +
      '<path d="M53 82.5c2.2-2.8 11.8-2.8 14 0l-2 5.8H55z" fill="var(--m-shade)" opacity=".95"/>' +
      '<circle cx="60" cy="86.5" r="3.5" fill="var(--warn)" stroke="color-mix(in srgb,var(--m-shade) 55%,#000)" stroke-width=".9"/>' +
      '<ellipse cx="59" cy="85.4" rx="1.4" ry=".9" fill="#fff" opacity=".65"/>' +
      '<path d="M28 45c2-5.5 6.5-9.5 13-11" stroke="var(--m-shade)" stroke-width="2.8" fill="none" stroke-linecap="round" opacity=".45"/>'
    );
  }

  function svg(id = 'miko', mood = 'happy', className = '') {
    const info = cast[id] || cast.miko;
    const gid = uid('m');
    const eyes =
      mood === 'cheer' ? '<path d="M41 52.5c2.6-4.2 5.8-6 8.2-6s5.6 1.8 8.2 6M62.6 52.5c2.6-4.2 5.8-6 8.2-6s5.6 1.8 8.2 6" stroke="#1a2438" stroke-width="4.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' :
      mood === 'sad' ? '<path d="M41.5 49.5c3 3.4 6 4.8 8.5 4.8s5.5-1.4 8.5-4.8M61.5 49.5c3 3.4 6 4.8 8.5 4.8s5.5-1.4 8.5-4.8" stroke="#1a2438" stroke-width="3.8" fill="none" stroke-linecap="round"/><ellipse cx="45.5" cy="58.5" rx="2.2" ry="2.8" fill="color-mix(in srgb,var(--accent) 55%,#fff)" opacity=".65"/><ellipse cx="74.5" cy="58.5" rx="2.2" ry="2.8" fill="color-mix(in srgb,var(--accent) 55%,#fff)" opacity=".65"/>' :
      mood === 'sleepy' ? '<path d="M41 53c3 3.2 6 4.4 8.5 4.4s5.5-1.2 8.5-4.4M62 53c3 3.2 6 4.4 8.5 4.4s5.5-1.2 8.5-4.4" stroke="#1a2438" stroke-width="3.8" fill="none" stroke-linecap="round"/>' :
      mood === 'thinking' ? '<g><ellipse cx="48.5" cy="51.5" rx="6.4" ry="7" fill="#1a2438"/><ellipse cx="46.6" cy="49.2" rx="2.3" ry="2.6" fill="#fff"/><ellipse cx="50.2" cy="53.4" rx="1.1" ry="1.2" fill="#fff" opacity=".7"/></g><path d="M63.5 52.5c2.8-2.8 6.2-4 9-4s5.8 1 8.2 3.2" stroke="#1a2438" stroke-width="3.8" fill="none" stroke-linecap="round"/>' :
      mood === 'surprised' ? '<g><ellipse cx="48.5" cy="51.5" rx="7.8" ry="8.4" fill="#1a2438"/><ellipse cx="46" cy="48.5" rx="2.6" ry="3" fill="#fff"/><ellipse cx="50.8" cy="54.2" rx="1.2" ry="1.3" fill="#fff" opacity=".75"/></g><g><ellipse cx="71.5" cy="51.5" rx="7.8" ry="8.4" fill="#1a2438"/><ellipse cx="69" cy="48.5" rx="2.6" ry="3" fill="#fff"/><ellipse cx="73.8" cy="54.2" rx="1.2" ry="1.3" fill="#fff" opacity=".75"/></g>' :
      '<g><ellipse cx="48.5" cy="51.5" rx="6.6" ry="7.2" fill="#1a2438"/><ellipse cx="46.5" cy="49" rx="2.4" ry="2.7" fill="#fff"/><ellipse cx="50.4" cy="53.6" rx="1.1" ry="1.2" fill="#fff" opacity=".7"/></g><g><ellipse cx="71.5" cy="51.5" rx="6.6" ry="7.2" fill="#1a2438"/><ellipse cx="69.5" cy="49" rx="2.4" ry="2.7" fill="#fff"/><ellipse cx="73.4" cy="53.6" rx="1.1" ry="1.2" fill="#fff" opacity=".7"/></g>';

    const mouth =
      mood === 'cheer' ? '<path d="M52 65.5c2.4 5.5 13.6 5.5 16 0z" fill="#4a1830"/><path d="M55 68.8c2 2.4 8 2.4 10 0" fill="none" stroke="var(--m-cheek)" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>' :
      mood === 'sad' ? '<path d="M54 70.5c2.2-3.4 9.8-3.4 12 0" stroke="#1a2438" stroke-width="3.2" fill="none" stroke-linecap="round"/>' :
      mood === 'surprised' ? '<ellipse cx="60" cy="68.5" rx="4.8" ry="5.8" fill="#4a1830"/><ellipse cx="60" cy="70.5" rx="2.4" ry="2.2" fill="var(--m-cheek)" opacity=".55"/>' :
      mood === 'thinking' ? '<path d="M54.5 67.5c2.2 2.2 8.8 2.2 11 0" stroke="#1a2438" stroke-width="3" fill="none" stroke-linecap="round"/>' :
      '<path d="M53 65c2.4 4.8 11.6 4.8 14 0" stroke="#1a2438" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M58 63.2h4" stroke="#1a2438" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>';

    return (
      '<svg class="mascot-svg ' + className + '" viewBox="0 0 120 120" style="' + palette(info.id) + '" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<radialGradient id="' + gid + '-fur" cx="38%" cy="28%" r="70%">' +
          '<stop offset="0%" stop-color="#fff" stop-opacity=".35"/>' +
          '<stop offset="55%" stop-color="var(--m-fur)" stop-opacity="1"/>' +
          '<stop offset="100%" stop-color="var(--m-shade)" stop-opacity=".55"/>' +
        '</radialGradient>' +
        '<radialGradient id="' + gid + '-body" cx="40%" cy="25%" r="75%">' +
          '<stop offset="0%" stop-color="#fff" stop-opacity=".28"/>' +
          '<stop offset="60%" stop-color="var(--m-fur)"/>' +
          '<stop offset="100%" stop-color="var(--m-shade)" stop-opacity=".45"/>' +
        '</radialGradient>' +
        '<radialGradient id="' + gid + '-belly" cx="50%" cy="35%" r="65%">' +
          '<stop offset="0%" stop-color="#fff" stop-opacity=".95"/>' +
          '<stop offset="100%" stop-color="#fff" stop-opacity=".45"/>' +
        '</radialGradient>' +
        '<filter id="' + gid + '-shadow" x="-30%" y="-20%" width="160%" height="160%">' +
          '<feDropShadow dx="0" dy="3" stdDeviation="2.4" flood-color="#0b1220" flood-opacity=".18"/>' +
        '</filter>' +
      '</defs>' +
      '<g filter="url(#' + gid + '-shadow)">' +
        '<path d="M90 89c16 2 21-14 11-23" fill="none" stroke="var(--m-shade)" stroke-width="8.5" stroke-linecap="round" opacity=".85"/>' +
        '<ellipse cx="60" cy="90.5" rx="28.5" ry="23.5" fill="url(#' + gid + '-body)"/>' +
        '<ellipse cx="60" cy="94" rx="17.5" ry="15" fill="url(#' + gid + '-belly)"/>' +
        '<ellipse cx="39" cy="94.5" rx="8.5" ry="6.8" fill="var(--m-fur)"/>' +
        '<ellipse cx="81" cy="94.5" rx="8.5" ry="6.8" fill="var(--m-fur)"/>' +
        '<path d="M34.5 33.5c-1.5-8.5-.2-17 4.5-25 6.5 4 13.5 9.5 19 15.5z" fill="url(#' + gid + '-fur)"/>' +
        '<path d="M85.5 33.5c1.5-8.5.2-17-4.5-25-6.5 4-13.5 9.5-19 15.5z" fill="url(#' + gid + '-fur)"/>' +
        '<path d="M39.5 29c-.8-5.2 0-10 2.8-14.2 4 2.8 8 6 11.5 9.5z" fill="var(--m-inner)" opacity=".9"/>' +
        '<path d="M80.5 29c.8-5.2 0-10-2.8-14.2-4 2.8-8 6-11.5 9.5z" fill="var(--m-inner)" opacity=".9"/>' +
        '<ellipse cx="60" cy="55" rx="32.5" ry="31.5" fill="url(#' + gid + '-fur)"/>' +
        '<ellipse cx="46" cy="36" rx="12" ry="7" fill="#fff" opacity=".3"/>' +
        '<ellipse cx="40" cy="39.5" rx="5.5" ry="3.2" fill="#fff" opacity=".18"/>' +
        '<ellipse cx="37.5" cy="62.5" rx="7" ry="5.2" fill="var(--m-cheek)" opacity=".42"/>' +
        '<ellipse cx="82.5" cy="62.5" rx="7" ry="5.2" fill="var(--m-cheek)" opacity=".42"/>' +
        eyes +
        '<path d="M60 59.5l-4.6 3.8c-.4.3-.1 1 .4 1h8.4c.5 0 .8-.7.4-1z" fill="var(--m-cheek)"/>' +
        '<ellipse cx="58.8" cy="60.8" rx="1.2" ry=".7" fill="#fff" opacity=".55"/>' +
        mouth +
        '<g stroke="var(--m-shade)" stroke-width="2.2" stroke-linecap="round" fill="none" opacity=".55">' +
          '<path d="M33 56.5h-10M34 62l-9.5 3M87 56.5h10M86 62l9.5 3"/>' +
        '</g>' +
        accessory(info.id, mood) +
      '</g>' +
      '</svg>'
    );
  }
/* ---------------- Pengetahuan singkat ---------------- */

  const knowledge = {
    subnet: {
      keywords: ['subnet', 'subnetting', 'cidr', 'prefix', 'netmask', 'subnet mask', 'network address', 'broadcast', 'jumlah host', 'host usable'],
      book: 'ip-subnetting', game: 'subnet',
      answer: 'Subnetting membagi satu jaringan besar menjadi blok yang lebih kecil.\n• Network address = IP AND subnet mask.\n• Broadcast = semua bit host diisi 1.\n• Host usable = 2^(32 − prefix) − 2.\nContoh /26 punya 64 alamat, jadi 62 host bisa dipakai.'
    },
    osi: {
      keywords: ['osi', 'lapisan', 'layer', 'application', 'presentation', 'session', 'transport', 'data link', 'datalink', 'physical'],
      book: 'dasar-jaringan', game: 'osi',
      answer: 'Tujuh lapisan OSI dari atas ke bawah:\n1 Application, 2 Presentation, 3 Session, 4 Transport, 5 Network, 6 Data Link, 7 Physical.\nIngat singkatan: All People Seem To Need Data Processing.'
    },
    vlan: {
      keywords: ['vlan', 'trunk', 'access port', 'switching', 'switch', 'segmentasi'],
      book: 'vlan-switching', game: 'osi',
      answer: 'VLAN memisahkan satu switch menjadi beberapa jaringan logis. Port access melayani satu VLAN, port trunk membawa banyak VLAN antar-switch memakai tag 802.1Q. VLAN mengurangi domain broadcast dan menambah keamanan.'
    },
    cable: {
      keywords: ['kabel', 'konektor', 'rj45', 'rj11', 'utp', 'stp', 'fiber', 'fo', 'coaxial', 'krimping', 'crimp', 't568'],
      book: 'hardware-kabel', game: 'cable',
      answer: 'Media jaringan yang sering dipakai:\n• UTP/STP dengan konektor RJ45 untuk LAN.\n• Fiber optic untuk jarak jauh dan bandwidth besar.\n• Coaxial untuk TV kabel dan kamera analog.\nUrutan T568B: putih oranye, oranye, putih hijau, biru, putih biru, hijau, putih cokelat, cokelat.'
    },
    ip: {
      keywords: ['ip', 'ipv4', 'alamat ip', 'dhcp', 'dns', 'gateway', 'apipa', '169.254'],
      book: 'ip-subnetting', game: 'subnet',
      answer: 'IPv4 terdiri dari 32 bit dan ditulis empat oktet. Rentang privat: 10.0.0.0/8, 172.16.0.0/12, dan 192.168.0.0/16. DHCP membagikan IP otomatis, DNS menerjemahkan nama domain, gateway menjadi pintu keluar jaringan.'
    },
    troubleshoot: {
      keywords: ['troubleshooting', 'rusak', 'tidak bisa', 'gak bisa', 'gabisa', 'gagal', 'lambat', 'lemot', 'putus', 'ping', 'lampu', 'mati', 'error', 'bermasalah', 'no internet'],
      book: 'troubleshooting', game: 'detective',
      answer: 'Urutan troubleshooting yang aman:\n1 Cek fisik: kabel, lampu indikator, dan daya.\n2 Cek IP, gateway, dan DNS.\n3 Uji ping ke gateway lalu ke 8.8.8.8.\n4 Baru periksa konfigurasi switch, router, atau firewall.\nUbah satu hal lalu uji lagi agar penyebabnya jelas.'
    },
    security: {
      keywords: ['keamanan', 'security', 'firewall', 'password', 'sandi', 'hacker', 'malware', 'serangan', 'enkripsi', 'phishing'],
      book: 'keamanan-jaringan', game: 'detective',
      answer: 'Dasar keamanan jaringan: gunakan password kuat dan berbeda, aktifkan firewall, perbarui firmware, matikan port yang tidak dipakai, serta waspadai tautan phishing. Enkripsi seperti WPA2/WPA3 melindungi data di jaringan nirkabel.'
    },
    basic: {
      keywords: ['jaringan', 'lan', 'wan', 'man', 'topologi', 'router', 'dasar jaringan', 'pengertian jaringan', 'internet'],
      book: 'dasar-jaringan', game: 'quiz',
      answer: 'Jaringan komputer menghubungkan perangkat agar bisa bertukar data. LAN mencakup area kecil seperti lab, WAN menghubungkan lokasi jauh, dan internet adalah jaringan jaringan global. Topologi umum: star, bus, ring, dan mesh.'
    },
    wifi: {
      keywords: ['wifi', 'wi fi', 'nirkabel', 'wireless', 'access point', 'ssid', 'wpa', 'frekuensi', '2.4', '5ghz'],
      book: 'dasar-jaringan', game: 'quiz',
      answer: 'WiFi memakai gelombang radio: 2,4 GHz punya jangkauan jauh tapi rentan padat, 5 GHz lebih cepat tapi jaraknya pendek. Keamanan terbaik: WPA2/WPA3 dengan sandi kuat. Access point menyiarkan SSID; banyak SSID bisa berbagi satu AP lewat VLAN.'
    },
    game: {
      keywords: ['main', 'game', 'arena', 'kuis', 'quiz', 'tantangan', 'skor', 'rekor', 'bermain'],
      book: '', game: 'quiz',
      answer: 'Arena NEKO punya delapan game solo — Kuis Kilat, Who Is The Spy, Lab Kabel, Kartu Memori, Subnet Master, Menara OSI, Detektif Jaringan, Refleks Neko — plus satu mode online bernama Kelas Langsung. Pilih kartu game, atur kesulitan, lalu tekan Mulai.'
    },
    live: {
      keywords: ['live class', 'kelas langsung', 'neko live class', 'pin kelas', 'main bareng', 'multiplayer', 'lawan teman'],
      book: '', game: '',
      answer: 'NEKO LIVE CLASS: guru menekan Buat Kelas, layar menampilkan PIN enam angka, lalu siswa join dari HP masing-masing. Jawaban lebih cepat memberi poin lebih besar, dan XP akhir sesi langsung tersimpan ke akun.'
    },
    message: {
      keywords: ['chat', 'mengobrol', 'pesan', 'teman', 'friend', 'add friend', 'sms'],
      book: '', game: '',
      answer: 'Buka tab Pesan untuk mencari akun lain, mengirim permintaan berteman, lalu chatting real-time. Semua percakapan tersimpan di server, jadi riwayat ikut pindah saat kamu login di perangkat lain.'
    },
    xp: {
      keywords: ['xp', 'season', 'level', 'gelar', 'rank', 'naik tingkat', 'naik season', 'badge'],
      book: '', game: 'quiz',
      answer: 'Ada lima season: Pemula 0–600 XP, Penjelajah 600–1600, Arsitek 1600–3000, Penjaga 3000–5000, dan Legenda 5000+. Setiap season penuh memberi gelar, badge, dan bingkai profil baru. XP didapat dari check-in, halaman buku baru, dan game.'
    },
    book: {
      keywords: ['buku', 'materi', 'baca', 'halaman', 'rekomendasi', 'rak', 'perpustakaan'],
      book: '', game: '',
      answer: 'Perpustakaan NEKO punya enam buku: Dasar Jaringan, IP & Subnetting, VLAN & Switching, Hardware & Kabel, Troubleshooting, dan Keamanan Jaringan. Setiap buku punya tabel, gambar, dan kuis kecil.'
    },
    checkin: {
      keywords: ['checkin', 'check in', 'absen', 'hadiah harian', 'streak', 'login harian'],
      book: '', game: '',
      answer: 'Check-in harian ada di beranda. Semakin panjang streak, hadiah XP makin besar: 20 sampai 80 XP. Check-in juga membuka badge Api Semangat saat mencapai tujuh hari.'
    },
    theme: {
      keywords: ['tema', 'tampilan', 'warna', 'mode', 'gelap', 'terang', 'mobil', 'balap', 'astronot', 'hutan', 'laut', 'pink', 'paper', 'kertas', 'neon'],
      book: '', game: '',
      answer: 'Ada delapan dunia: Paper Quest (tema utama NEKO), Hutan Rimba, Samudra, Permen Manis, Crimson Core, Velocity, Orbit NEKO, dan Neon Circuit. Velocity khusus balap dan selalu gelap; dunia lain punya mode terang dan gelap. Semua tema mengubah latar, ikon, font, dan suara.'
    },
    identity: {
      keywords: ['siapa kamu', 'kamu siapa', 'namamu', 'nama kamu', 'miki', 'miko', 'neksya', 'sasha', 'mochi'],
      book: '', game: '',
      answer: 'Aku Miko, teman belajarmu di NEKO. Aku memegang semuanya: materi TJKT, game, XP, dan setiap fitur NEKO. Tanya apa saja.'
    },
    thanks: {
      keywords: ['makasih', 'terima kasih', 'thanks', 'thx', 'terimakasih'],
      book: '', game: '',
      answer: 'Sama-sama! Senang bisa membantu. Kalau ada istilah yang masih mengganjal, tanyakan lagi ya.'
    },
    motivation: {
      keywords: ['semangat', 'capek', 'lelah', 'bosan', 'malas', 'takut', 'sulit', 'susah', 'bingung', 'pusing', 'cara belajar', 'tips belajar', 'belajar yang baik', 'fokus', 'ngantuk'],
      book: '', game: '',
      answer: 'Tidak apa-apa merasa berat. Istirahat sebentar, tarik napas, lalu pilih satu langkah kecil: satu halaman buku atau satu game singkat. Kemajuan kecil tetap kemajuan.'
    },
    greeting: {
      keywords: ['halo', 'hai', 'hi', 'hello', 'pagi', 'siang', 'sore', 'malam', 'assalamualaikum', 'assalam', 'apa kabar', 'kabar'],
      book: '', game: '',
      answer: 'Halo juga! Mau belajar materi, memilih game, atau sekadar mengobrol? Aku siap menemani.'
    },
    help: {
      keywords: ['bantuan', 'bantu', 'bisa apa', 'fitur', 'panduan', 'cara pakai', 'cara main'],
      book: '', game: '',
      answer: 'Aku bisa menjelaskan materi (subnet, OSI, VLAN, kabel, IP, troubleshooting, keamanan), merekomendasikan buku, membantu memilih game, menjelaskan XP season, dan memberi semangat. Klik salah satu saran di bawah untuk mulai.'
    },
    farewell: {
      keywords: ['bye', 'dadah', 'sampai jumpa', 'selamat tinggal', 'good night', 'selamat malam'],
      book: '', game: '',
      answer: 'Sampai jumpa! Simpan energimu, dan kembali lagi saat siap belajar. Aku Miko selalu di sini kalau butuh bantuan.'
    }
  };

  const order = ['subnet', 'osi', 'vlan', 'cable', 'ip', 'troubleshoot', 'security', 'basic', 'wifi', 'game', 'live', 'message', 'xp', 'book', 'checkin', 'theme', 'identity', 'thanks', 'motivation', 'help', 'greeting', 'farewell'];

  const suggestionsByChar = {
    miko: ['Apa itu subnetting?', 'Bedanya switch dan router?', 'Urutan kabel T568B', 'Cara cepat dapat XP?', 'Cara kerja WiFi?', 'Rekomendasi buku', 'Mode kuis dong']
  };

  function normalize(text) {
    const clean = String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    return ' ' + clean + ' ';
  }

  function scoreIntent(text, spec) {
    return (spec.keywords || []).reduce((score, keyword) => {
      const needle = ' ' + keyword.toLowerCase() + ' ';
      // Pencocokan lengkap (paling kuat)
      if (text.includes(needle)) return score + (keyword.includes(' ') ? 3 : 1.4);
      // Pencocokan awal kata: "subnetting" tetap kena "subnet"
      const stem = needle.trim();
      if (stem.length >= 4 && text.includes(' ' + stem)) return score + (stem === keyword ? .9 : .6);
      return score;
    }, 0);
  }

  function pickIntent(text) {
    let best = null;
    let bestScore = 0;
    order.forEach(id => {
      const score = scoreIntent(text, knowledge[id]);
      if (score > bestScore) { bestScore = score; best = id; }
    });
    return bestScore >= 1.4 ? best : null;
  }

  const flavorCursor = new Map();

  const opener = {
    miko: ['Gas! ', 'Nih, versi cepatnya! ', 'Aku suka pertanyaan begini! ', 'Langsung ke intinya, ya: ']
  };

  function flavor(charId, topicId, text) {
    const list = opener[charId] || opener.miko;
    const key = String(topicId || '') + ':' + charId;
    let index = flavorCursor.get(key);
    if (index === undefined) { index = Math.floor(Math.random() * list.length); }
    flavorCursor.set(key, (index + 1) % list.length);
    const lead = list[index] || '';
    if (charId === 'miko' && topicId === 'game') return lead + text + ' Kalau mau adu cepat, ajak teman lewat Kelas Langsung.';
    return lead + text;
  }

  function topicReply(topicId, charId) {
    const info = knowledge[topicId];
    const actions = [];
    if (info.book) {
      const book = books().find(item => item.id === info.book);
      if (book) actions.push({ type: 'book', id: book.id, label: 'Baca ' + book.title, icon: 'books' });
    }
    if (info.game) actions.push({ type: 'game', id: info.game, label: 'Coba di arena', icon: 'gamepad' });
    if (topicId === 'theme') actions.push({ type: 'theme', label: 'Pilih tema', icon: 'palette' });
    if (topicId === 'xp') actions.push({ type: 'guide', label: 'Lihat panduan season', icon: 'trophy' });
    if (topicId === 'checkin') actions.push({ type: 'go', view: 'home', label: 'Ke beranda', icon: 'home' });
    if (topicId === 'book') actions.push({ type: 'go', view: 'materials', label: 'Buka perpustakaan', icon: 'books' });
    if (topicId === 'game') actions.push({ type: 'go', view: 'arena', label: 'Buka arena', icon: 'gamepad' });
    if (topicId === 'live') actions.push({ type: 'live', label: 'Buka Kelas Langsung', icon: 'live' });
    if (topicId === 'message') actions.push({ type: 'go', view: 'messages', label: 'Buka Pesan', icon: 'chat' });
    return { text: flavor(charId, topicId, info.answer), actions };
  }

  function recommendBook(charId) {
    const profile = Neko.store.profile;
    const states = Object.entries(profile?.books || {}).filter(([, state]) => state && !state.finished && state.maxPage > 0);
    const finished = new Set(Object.entries(profile?.books || {}).filter(([, state]) => state?.finished).map(([id]) => id));
    const next = books().find(book => !finished.has(book.id) && !states.some(([id]) => id === book.id)) || books().find(book => !finished.has(book.id));
    if (!next) return { text: 'Semua buku sudah kamu tamatkan. Hebat! Sekarang uji pemahamanmu di arena atau ulangi buku favoritmu.', actions: [{ type: 'go', view: 'arena', label: 'Ke arena', icon: 'gamepad' }] };
    const started = states.find(([id]) => id === next.id);
    const hint = started ? 'Kamu sudah mulai buku ini. Lanjutkan dari halaman terakhir.' : 'Buku ini cocok sebagai langkah berikutnya.';
    const voice = 'Ini pilihan cepatku. ';
    return {
      text: voice + hint + ' Rekomendasiku: ' + next.title + ' — ' + next.subtitle,
      actions: [
        { type: 'book', id: next.id, label: 'Baca ' + next.title, icon: 'books' },
        { type: 'go', view: 'materials', label: 'Lihat semua buku', icon: 'books' }
      ]
    };
  }

  function seasonReply() {
    const profile = Neko.store.profile;
    const snap = Neko.seasons.seasonForXP(profile ? profile.xp : 0);
    const line = snap.next
      ? 'Sekarang kamu di ' + snap.season.name + ' sebagai ' + snap.season.title + '. Butuh ' + Neko.util.formatNumber(snap.xpToNext) + ' XP lagi untuk mencapai ' + snap.next.short + '.'
      : 'Kamu sudah berada di puncak Legenda. Gelar Network Legend ada di namamu.';
    return {
      text: line + ' Cara cepat menambah XP: check-in harian, buka halaman buku baru, dan menangkan game di arena.',
      actions: [{ type: 'guide', label: 'Buka panduan', icon: 'trophy' }, { type: 'go', view: 'arena', label: 'Cari XP', icon: 'bolt' }]
    };
  }

  const topicTitle = {
    subnet: 'subnetting', osi: 'lapisan OSI', vlan: 'VLAN dan switching', cable: 'kabel dan konektor',
    ip: 'alamat IP', troubleshoot: 'troubleshooting', security: 'keamanan jaringan', basic: 'dasar jaringan',
    wifi: 'jaringan nirkabel', book: 'rekomendasi bacaan', game: 'game arena', live: 'Kelas Langsung', xp: 'XP dan season',
    motivation: 'semangat belajar', theme: 'tema dan tampilan', checkin: 'check-in harian', message: 'chat dan teman'
  };

  function fallback(charId) {
    const who = cast[charId] || cast.miko;
    const profile = Neko.store.profile;
    const snap = profile ? Neko.seasons.seasonForXP(profile.xp) : null;
    // Sarankan topik berdasar aktivitas: belum tamat buku → rekomendasi; XP rendah → cara naik XP
    let hint = '';
    const unread = books().filter(book => !(profile?.books?.[book.id] || {}).finished);
    if (profile && unread.length && (profile.stats?.pagesRead || 0) < 4) {
      hint = ' Kelihatannya kamu belum banyak membaca — mau kubantu pilih buku?';
    } else if (snap && snap.next && profile?.xp < 600) {
      hint = ' XP-mu masih di awal season. Mau kujelaskan cara cepat naik XP?';
    }
    return {
      text: who.voice + ' Aku belum menangkap maksudnya. Aku memegang ' + territory[who.id] +
        ' — coba sebutkan salah satu itu.' + hint,
      actions: unread.length && hint.includes('buku')
        ? [{ type: 'book', id: unread[0].id, label: 'Baca ' + unread[0].title, icon: 'books' }]
        : hint.includes('XP') ? [{ type: 'go', view: 'arena', label: 'Cari XP di arena', icon: 'bolt' }]
        : []
    };
  }

  function handoff(topicId, charId) {
    /* Miko satu-satunya asisten, jadi tidak ada lagi serah terima. */
    return topicReply(topicId, cast[charId] ? charId : 'miko');
  }

  function identityReply() {
    return {
      text: 'Aku Miko, teman belajarmu di NEKO. Aku tahu semua materi TJKT (subnet, OSI, VLAN, kabel, IP, WiFi, troubleshooting, keamanan), semua fitur aplikasi, dan bisa mengarahkanmu belajar. Tanya apa saja!',
      actions: [{ type: 'quiz', label: 'Uji aku dengan kuis', icon: 'brain' }]
    };
  }

  function helpReply() {
    return {
      text: 'Tanya apa saja padaku: materi TJKT (subnet, OSI, VLAN, kabel, IP, WiFi, troubleshooting, keamanan), rekomendasi buku, pilih game, XP & season, tema, check-in — semua kubantu. Coba ketuk salah satu saran di bawah!',
      actions: [
        { type: 'quiz', label: 'Uji aku dengan kuis', icon: 'brain' },
        { type: 'go', view: 'materials', label: 'Buka perpustakaan', icon: 'books' }
      ]
    };
  }

  function renameNote() {
    return {
      text: 'Aku Miko, satu-satunya asisten di NEKO. Nama lama teman belajar dulu sudah tidak dipakai lagi. ' + knowledge.identity.answer,
      actions: [{ type: 'quiz', label: 'Uji aku dengan kuis', icon: 'brain' }]
    };
  }

  /* ---------------- Mode kuis interaktif (Miko AI) ----------------
     Ketik "kuis" atau jawab soal dengan angka → Miko menilai jawaban,
     memberi tahu benar/salah beserta alasannya, lalu menawarkan soal baru.
     Sesi berlanjut selama user menjawab. */

  const quizState = { active: false, current: null, asked: new Set() };

  function quizPool() {
    const bank = window.NEK_QUIZ && Array.isArray(window.NEK_QUIZ.questions) ? window.NEK_QUIZ.questions : [];
    return bank.filter(item => item && Array.isArray(item.o) && item.o.length >= 3 && item.a < item.o.length);
  }

  function nextQuizQuestion() {
    const pool = quizPool().filter(item => !quizState.asked.has(item.q));
    const list = pool.length ? pool : shuffleSafe(quizPool());
    if (!list.length) return null;
    const item = list[Math.floor(Math.random() * list.length)];
    quizState.asked.add(item.q);
    if (quizState.asked.size > 80) quizState.asked.clear();
    return item;
  }

  function shuffleSafe(list) {
    const copy = (list || []).slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function startQuiz() {
    const item = nextQuizQuestion();
    if (!item) return { text: 'Bank soal kuis belum termuat. Coba lagi sebentar, ya!', actions: [] };
    quizState.active = true;
    quizState.current = item;
    const options = item.o.map((option, index) => (index + 1) + ') ' + option).join('\n');
    return {
      text: 'Oke, kuis dimulai! 🎯\n\n' + item.q + '\n\n' + options + '\n\nBalas dengan angka 1–' + item.o.length + '.',
      actions: [{ type: 'quizskip', label: 'Skip soal ini', icon: 'arrow-right' }]
    };
  }

  function gradeQuiz(choice) {
    const item = quizState.current;
    if (!item) return null;
    quizState.active = false;
    quizState.current = null;
    const correct = choice === item.a;
    const answerText = item.o[item.a];
    const head = correct
      ? randomOf(['Benar sekali! 🎉', 'Tepat! Kamu jago. 💪', 'Yes, jawabanmu benar! ✨'])
      : 'Belum tepat, jawaban yang benar: "' + answerText + '".';
    const explain = item.e ? '\n\nPenjelasan: ' + item.e : '';
    return {
      text: head + explain + '\n\nMau soal lagi? Ketuk tombol di bawah atau ketik "kuis".',
      actions: [{ type: 'quiz', label: 'Soal berikutnya', icon: 'brain' }]
    };
  }

  /* ---------------- Miko AI: tanya server AI dulu, gagal → fallback lokal ---------------- */

  async function askServerAI(rawText) {
    try {
      const data = await Neko.api.request('/api/miko/ask', {
        method: 'POST',
        body: { question: String(rawText || ''), history: hist(activeId).slice(-8).map(item => ({ role: item.role, text: item.text })) }
      });
      if (data && data.answer) return data.answer;
    } catch (error) { /* offline atau gagal → fallback lokal */ }
    return null;
  }

  function replyFor(rawText, charId) {
    const text = normalize(rawText);
    if (!text.trim()) return fallback(charId);
    if (/mochi/.test(text) || /(^|\s)sasha(\s|$)/.test(text)) return renameNote(charId);

    /* Mode kuis aktif: jawaban angka dinilai, "skip" ganti soal. */
    if (quizState.active) {
      if (/(skip|lewat|ganti soal|soal lain)/.test(text)) {
        const fresh = startQuiz();
        fresh.text = 'Oke, soal baru:\n\n' + fresh.text.split('\n\n').slice(1).join('\n\n');
        return fresh;
      }
      const numberMatch = text.trim().match(/\b([0-9])\b/);
      if (numberMatch) {
        const graded = gradeQuiz(Number(numberMatch[1]) - 1);
        if (graded) return graded;
      }
      /* bukan angka: anggap keluar dari mode kuis */
      quizState.active = false;
      quizState.current = null;
    }

    /* Memicu kuis: kata kunci atau tombol */
    if (/(^|\s)(kuis|quiz|uji aku|tes aku|ujian|soal|latihan soal)(\s|$)/.test(text) || /mau.*(kuis|tes|latihan)/.test(text)) {
      if (charId === 'miko') return startQuiz();
      return {
        text: 'Mode kuis aktif di Miko. Ketik "kuis" lagi kapan saja untuk mulai.',
        actions: [{ type: 'quiz', label: 'Mulai kuis', icon: 'brain' }]
      };
    }

    let topicId = null;
    if (/(mau|ingin|pengen).*(buku|materi|baca)/.test(text) || /(rekomendasi|saran|pilih).*(buku|bacaan)/.test(text)) topicId = 'book';
    else if (/(cara|gimana|bagaimana).*(naik|tambah|dapat).*(xp|season|level)/.test(text) || /(berapa|sisa).*(xp|season)/.test(text)) topicId = 'xp';
    else topicId = pickIntent(text);
    if (!topicId) return fallback(charId);
    const boss = owner[topicId];
    if (boss && boss !== charId) return handoff(topicId, charId);
    if (topicId === 'identity') return identityReply(charId);
    if (topicId === 'help') return helpReply(charId);
    if (topicId === 'book') return recommendBook(charId);
    if (topicId === 'xp') return seasonReply();
    return topicReply(topicId, charId);
  }

  /* ---------------- Percakapan ---------------- */

  const history = { miki: [], miko: [], neksya: [] };
  let activeId = 'miko';
  let sheetEntry = null;
  let typingTimer = null;
  let lastQuestion = '';

  /* Riwayat lama bisa masih menyebut karakter yang sudah dihapus; semua masuk ke Miko. */
  function hist(who) {
    const id = cast[who] ? who : 'miko';
    if (!history[id]) history[id] = [];
    return history[id];
  }

  function pushMessage(who, text, actions = []) {
    hist(who).push({ role: 'bot', text, actions, time: Date.now() });
    if (hist(who).length > 60) hist(who).shift();
    if (Neko.voice) Neko.voice.say(text, who);
  }

  function ensureGreeting(who) {
    if (!hist(who).length) pushMessage(who, (cast[who] || cast.miko).greeting, []);
  }

  function timeLabel(time) {
    return new Date(time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  function messagesHTML(who) {
    return hist(who).map(message => {
      if (message.role === 'user') {
        return '<div class="chat-row user"><div class="chat-bubble user-bubble">' + esc(message.text).replace(/\n/g, '<br>') + '<time>' + timeLabel(message.time) + '</time></div></div>';
      }
      const actions = message.actions && message.actions.length
        ? '<div class="chat-actions">' + message.actions.map(action => (
          '<button type="button" data-chat-action="' + action.type + ':' + (action.id || action.view || '') + '">' + icon(action.icon || 'arrow-right') + esc(action.label) + '</button>'
        )).join('') + '</div>'
        : '';
      return '<div class="chat-row bot"><span class="chat-avatar" style="' + palette(who) + '">' + svg(who, 'happy') + '</span><div class="chat-bubble bot-bubble">' + esc(message.text).replace(/\n/g, '<br>') + '<time>' + timeLabel(message.time) + '</time></div>' + actions + '</div>';
    }).join('');
  }

  function renderMessages(chatEl, who) {
    const box = chatEl.querySelector('[data-chat-messages]');
    if (!box) return;
    box.innerHTML = messagesHTML(who);
    const typing = chatEl.querySelector('[data-chat-typing]');
    if (typing) box.appendChild(typing);
    box.scrollTop = box.scrollHeight;
    chatEl.querySelectorAll('[data-chat-tab]').forEach(button => {
      const on = button.dataset.chatTab === who;
      button.classList.toggle('on', on);
      button.setAttribute('aria-selected', String(on));
    });
    const title = sheetEntry?.sheet?.querySelector('.sheet-head h3');
    const sub = sheetEntry?.sheet?.querySelector('.sheet-head p');
    if (title) title.textContent = 'Ngobrol dengan ' + cast[who].name;
    if (sub) sub.textContent = cast[who].role;
    const input = chatEl.querySelector('[data-chat-input]');
    if (input) input.placeholder = 'Tulis pesan untuk ' + cast[who].name + '…';
    const chips = chatEl.querySelector('[data-chat-suggest]');
    if (chips) {
      chips.innerHTML = (suggestionsByChar[who] || suggestionsByChar.miko)
        .map(text => '<button type="button" data-chat-suggest="' + esc(text) + '">' + esc(text) + '</button>').join('');
    }
  }

  function showTyping(chatEl) {
    const box = chatEl.querySelector('[data-chat-messages]');
    let node = chatEl.querySelector('[data-chat-typing]');
    if (!node) {
      node = document.createElement('div');
      node.className = 'chat-typing';
      node.setAttribute('data-chat-typing', '');
      node.innerHTML = '<i></i><i></i><i></i>';
    }
    if (box) {
      box.appendChild(node);
      box.scrollTop = box.scrollHeight;
    }
  }

  function send(chatEl, raw) {
    const text = String(raw || '').trim();
    if (!text) return;
    const who = activeId;
    lastQuestion = text;
    hist(who).push({ role: 'user', text, time: Date.now() });
    if (hist(who).length > 60) hist(who).shift();
    const input = chatEl.querySelector('[data-chat-input]');
    if (input) { input.value = ''; input.focus(); }
    renderMessages(chatEl, who);
    Neko.audio.play('tap');
    showTyping(chatEl);
    window.clearTimeout(typingTimer);
    /* Pertanyaan “berat” (bukan kuis aktif) lewat server AI dulu; offline jatuh ke balasan lokal. */
    const useServer = !quizState.active && Neko.api && Neko.api.token && location.protocol !== 'file:';
    typingTimer = window.setTimeout(async () => {
      let reply = replyFor(text, who);
      if (useServer && reply && reply.server !== true) {
        const ai = await askServerAI(text);
        if (ai) reply = { text: ai, actions: reply.actions || [] };
      }
      pushMessage(who, reply.text, reply.actions);
      renderMessages(chatEl, who);
      Neko.audio.play('select');
      typingTimer = null;
    }, 420 + Math.random() * 360);
  }

  function closeSheet() {
    window.clearTimeout(typingTimer);
    typingTimer = null;
    if (Neko.voice) Neko.voice.cancel();
    if (sheetEntry) {
      try { sheetEntry.close(); } catch (error) { /* abaikan */ }
      sheetEntry = null;
    }
  }

  function switchTo(id, reask) {
    const target = cast[id] ? id : 'miko';
    const chat = sheetEntry && sheetEntry.layer ? sheetEntry.layer.querySelector('[data-chat]') : null;
    activeId = target;
    ensureGreeting(target);
    Neko.audio.play('select');
    if (chat) {
      renderMessages(chat, target);
      if (reask && lastQuestion) window.setTimeout(() => send(chat, lastQuestion), 260);
    }
  }

  function runAction(action) {
    const [type, id] = String(action || '').split(':');
    if (type === 'ask') { switchTo(id, true); return; }
    if (type === 'quiz' || type === 'quizskip') {
      const chat = sheetEntry && sheetEntry.layer ? sheetEntry.layer.querySelector('[data-chat]') : null;
      if (chat) send(chat, type === 'quiz' ? 'kuis' : 'skip');
      return;
    }
    closeSheet();
    window.setTimeout(() => {
      if (type === 'book' && id) { Neko.book.open(id); return; }
      if (type === 'game' && id) { Neko.arena.setupSheet(id); return; }
      if (type === 'live') { if (Neko.live) Neko.live.openChooser(); return; }
      if (type === 'theme') { Neko.ui.themeSheet(); return; }
      if (type === 'guide') {
        Neko.profile.setTab('guide');
        Neko.app.go('profile');
        return;
      }
      if (type === 'go' && id) { Neko.app.go(id); }
    }, 280);
  }

  function openChat(characterId) {
    const who = cast[characterId] ? characterId : activeId;
    /* Miko adalah AI assistant utama: kalau dipanggil tanpa argumen, buka Miko. */
    activeId = who;
    hideBubble();
    ensureGreeting(who);
    if (sheetEntry) {
      const current = sheetEntry.layer;
      const chat = current?.querySelector('[data-chat]');
      if (chat) renderMessages(chat, who);
      return sheetEntry;
    }
    const entry = Neko.ui.sheet({
      kicker: 'TEMAN BELAJAR',
      title: 'Ngobrol dengan ' + cast[who].name,
      sub: cast[who].role,
      className: 'chat-sheet',
      layerClass: 'chat-layer',
      body:
        '<div class="mascot-chat" data-chat>' +
        '<div class="chat-tabs" role="tablist" aria-label="Pilih maskot">' +
        Object.values(cast).map(item => (
          '<button type="button" role="tab" data-chat-tab="' + item.id + '" class="' + (item.id === who ? 'on' : '') + '" aria-selected="' + String(item.id === who) + '" style="' + palette(item.id) + '">' +
          '<span class="chat-tab-avatar">' + svg(item.id, 'happy') + '</span><span><b>' + item.name + '</b><small>' + item.role + '</small></span>' +
          '</button>'
        )).join('') +
        '<button type="button" class="chat-mute" data-chat-mute aria-pressed="' + String(!Neko.voice.enabled()) + '" aria-label="' +
        (Neko.voice.enabled() ? 'Matikan suara maskot' : 'Nyalakan suara maskot') + '" title="Suara maskot">' +
        icon(Neko.voice.enabled() ? 'volume' : 'volume-off') + '</button>' +
        '</div>' +
        '<div class="mascot-messages" data-chat-messages aria-live="polite"></div>' +
        '<div class="chat-suggest" data-chat-suggest></div>' +
        '<form class="chat-composer" data-chat-form>' +
        '<input type="text" data-chat-input maxlength="280" autocomplete="off" enterkeyhint="send" aria-label="Tulis pesan" placeholder="Tulis pesan untuk ' + cast[who].name + '…">' +
        '<button type="submit" class="chat-send" aria-label="Kirim pesan">' + icon('send') + '</button>' +
        '</form>' +
        '<p class="chat-note">' + icon('lock') + 'Percakapan hanya ada di perangkat ini dan tidak dikirim ke mana pun.</p>' +
        '</div>',
      onMount(el) {
        chatBind(el);
      },
      onClose() {
        window.clearTimeout(typingTimer);
        typingTimer = null;
        sheetEntry = null;
      }
    });
    sheetEntry = entry;
    return entry;
  }

  function chatBind(el) {
    renderMessages(el, activeId);
    el.addEventListener('click', event => {
      const tab = event.target.closest('[data-chat-tab]');
      if (tab) {
        activeId = tab.dataset.chatTab;
        ensureGreeting(activeId);
        Neko.audio.play('select');
        renderMessages(el, activeId);
        return;
      }
      const mute = event.target.closest('[data-chat-mute]');
      if (mute) {
        const next = !Neko.voice.enabled();
        Neko.voice.setEnabled(next);
        Neko.store.patchPrefs({ charVoice: next });
        if (!next && Neko.voice) Neko.voice.cancel();
        Neko.audio.play('toggle');
        Neko.ui.toast(next ? 'Suara maskot dinyalakan' : 'Suara maskot dimatikan', next ? 'Narasi dan gelembung chat akan bersuara lagi.' : 'Maskot tetap membalas, hanya tanpa suara.', 'info', next ? 'volume' : 'volume-off');
        mute.setAttribute('aria-pressed', String(!next));
        mute.setAttribute('aria-label', next ? 'Matikan suara maskot' : 'Nyalakan suara maskot');
        mute.innerHTML = icon(next ? 'volume' : 'volume-off');
        return;
      }
      const suggest = event.target.closest('[data-chat-suggest]');
      if (suggest) {
        send(el, suggest.dataset.chatSuggest);
        return;
      }
      const action = event.target.closest('[data-chat-action]');
      if (action) {
        Neko.audio.play('select');
        runAction(action.dataset.chatAction);
      }
    });
    el.addEventListener('submit', event => {
      if (!event.target.matches('[data-chat-form]')) return;
      event.preventDefault();
      const input = el.querySelector('[data-chat-input]');
      send(el, input ? input.value : '');
    });
    window.setTimeout(() => {
      const input = el.querySelector('[data-chat-input]');
      if (input) input.focus();
    }, 320);
  }

  /* ---------------- Maskot mengambang ---------------- */

  const pet = {
    root: null,
    dock: null,
    node: null,
    body: null,
    bubble: null,
    close: null,
    id: 'miko',
    mood: 'happy',
    mounted: false,
    wanderTimer: null,
    swapTimer: null,
    bubbleTimer: null,
    reactTimer: null,
    comfortTimer: null,
    x: 0,
    y: 0,
    side: 'right',
    dragId: null,
    dragMoved: false,
    grabX: 0,
    grabY: 0
  };

  const WIN_LINES = [
    'Yeay, menang! Kerja bagus, lanjutkan!',
    'Keren! Jawabanmu cepat dan tepat.',
    'Mantap! Aku sampai ikut bangga.'
  ];
  const LOSE_LINES = [
    'Yah, belum menang. Tidak apa-apa, semangat!',
    'Belum beruntung, tapi kamu sudah berusaha. Semangat!',
    'Satu sesi selesai. Tarik napas, lalu coba lagi ya!'
  ];
  const IDLE_LINES = [
    'Aku di sini kalau kamu butuh teman belajar.',
    'Mau baca satu halaman atau main satu game?'
  ];

  function randomOf(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function paintPet() {
    if (!pet.node || !pet.body) return;
    const name = cast[pet.id].name;
    pet.body.innerHTML = svg(pet.id, pet.mood);
    pet.node.setAttribute('aria-label', 'Ngobrol dengan ' + name);
    if (pet.bubble) pet.bubble.setAttribute('aria-label', 'Buka chat dengan ' + name);
  }

  function hideBubble() {
    if (!pet.bubble) return;
    pet.bubble.classList.remove('on');
  }

  function openChatFromPet() {
    if (pet.dragMoved) return;
    Neko.audio.play('select');
    hideBubble();
    if (pet.node) {
      pet.node.classList.add('is-chatting');
      window.setTimeout(() => { if (pet.node) pet.node.classList.remove('is-chatting'); }, 600);
    }
    openChat(pet.id);
  }

  function showBubble(text, ms = 4200) {
    if (!pet.bubble || !text) return;
    if (sheetEntry) return;
    pet.bubble.innerHTML = '<span class="mascot-bubble-text" role="status" aria-live="polite">' + esc(text) + '</span>' +
      '<span class="mascot-bubble-hint">' + icon('chat') + 'ketuk</span>';
    pet.bubble.classList.add('on');
    if (Neko.voice) Neko.voice.say(text, pet.id);
    window.clearTimeout(pet.bubbleTimer);
    pet.bubbleTimer = window.setTimeout(hideBubble, ms);
  }

  function react(kind, detail = {}) {
    if (!pet.mounted || !pet.node) return;
    pet.node.classList.remove('is-react');
    void pet.node.offsetWidth;
    pet.node.classList.add('is-react');
    window.clearTimeout(pet.reactTimer);
    pet.reactTimer = window.setTimeout(() => { if (pet.node) pet.node.classList.remove('is-react'); }, 700);

    if (kind === 'win') {
      pet.mood = 'cheer';
      paintPet();
      showBubble(randomOf(WIN_LINES));
      return;
    }
    if (kind === 'lose') {
      pet.mood = 'sad';
      paintPet();
      showBubble(randomOf(LOSE_LINES), 2600);
      window.clearTimeout(pet.comfortTimer);
      pet.comfortTimer = window.setTimeout(() => {
        if (!pet.mounted) return;
        pet.mood = 'cheer';
        paintPet();
        showBubble('Semangat! Aku yakin kamu bisa lebih baik di percobaan berikutnya. ' + (detail.name ? 'Ayo coba ' + detail.name + ' lagi!' : ''), 5600);
      }, 2700);
      return;
    }
    if (kind === 'announcement') {
      pet.mood = 'surprised';
      paintPet();
      showBubble('Kabar baru dari ' + (detail.author || 'admin') + ': ' + (detail.title || 'ada pengumuman baru.'));
      window.setTimeout(() => {
        if (pet.mounted && pet.mood === 'surprised') { pet.mood = 'happy'; paintPet(); }
      }, 4200);
      return;
    }
    pet.mood = 'cheer';
    paintPet();
    showBubble(detail.message || 'Semangat terus, ya!');
  }

  function wander() {
    if (!pet.mounted || !pet.node) return;
    if (pet.dragId !== null) { scheduleWander(); return; }
    const spread = window.innerWidth < 760 ? 10 : 34;
    const dx = Math.round((Math.random() * 2 - 1) * spread);
    const dy = Math.round((Math.random() * 2 - 1) * 12);
    pet.node.style.setProperty('--wx', dx + 'px');
    pet.node.style.setProperty('--wy', dy + 'px');
    if (Math.random() < .55 && !(pet.bubble && pet.bubble.classList.contains('on')) && !sheetEntry) {
      pet.mood = randomOf(['happy', 'thinking', 'cheer']);
      paintPet();
    }
    scheduleWander();
  }

  function scheduleWander() {
    window.clearTimeout(pet.wanderTimer);
    pet.wanderTimer = window.setTimeout(wander, 5200 + Math.random() * 5200);
  }

  /* ---------------- Seret maskot: snap ke tepi kiri/kanan ---------------- */

  const POS_KEY = 'neko_pet_pos_v1';
  const LAND_LINES = [
    'Sip, aku diam di sini ya.',
    'Enak juga di tepi ini.',
    'Kalau mau ngobrol, ketuk aku saja.'
  ];

  function limit(value, min, max) {
    if (max < min) return min;
    return Math.min(max, Math.max(min, value));
  }

  function cssNum(name, fallback) {
    try {
      const n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
      return Number.isFinite(n) ? n : fallback;
    } catch (error) {
      return fallback;
    }
  }

  /** Batas area maskot: mulai dari bawah bar atas, berhenti di atas bar bawah. */
  function petArea() {
    const topbar = document.getElementById('topbar');
    const dockEl = document.getElementById('dock');
    const sidebar = document.getElementById('sidebar');
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const topRect = topbar ? topbar.getBoundingClientRect() : null;
    const dockRect = dockEl ? dockEl.getBoundingClientRect() : null;
    const sideRect = sidebar ? sidebar.getBoundingClientRect() : null;
    const barFloor = cssNum('--topbar-h', 56) + 10;
    const onScreenBar = topRect && topRect.height > 0 && topRect.top >= 0 ? topRect.bottom + 10 : null;
    const minY = Math.round(Math.max(8, Math.min(onScreenBar === null ? barFloor : onScreenBar, vh - 90)));
    const barCeil = dockRect && dockRect.height > 0 ? vh - cssNum('--dock-h', 64) - 10 : vh - 14;
    const dockVisible = dockRect && dockRect.height > 0 && dockRect.top > 0 && dockRect.top < vh;
    const maxY = Math.round(Math.max(minY + 60, dockVisible ? Math.min(dockRect.top - 10, barCeil) : barCeil));
    const edge = sideRect && sideRect.width > 0 && sideRect.right > 0 && sideRect.right < vw * .55 ? Math.round(sideRect.right) + 12 : 12;
    return { minX: edge, inset: 12, minY, maxY };
  }

  function petSize() {
    if (!pet.dock) return { w: 92, h: 70 };
    return { w: pet.dock.offsetWidth || 92, h: pet.dock.offsetHeight || 70 };
  }

  function applyDock(instant) {
    if (!pet.dock) return;
    const x = Number.isFinite(pet.x) ? Math.round(pet.x) : 0;
    const y = Number.isFinite(pet.y) ? Math.round(pet.y) : 0;
    if (instant) pet.dock.classList.add('is-instant');
    pet.dock.style.setProperty('--dock-x', x + 'px');
    pet.dock.style.setProperty('--dock-y', y + 'px');
    pet.dock.dataset.side = pet.side;
    if (instant) {
      void pet.dock.offsetWidth;
      pet.dock.classList.remove('is-instant');
    }
  }

  /** Kembalikan ke tepi paling dekat — maskot tidak boleh berhenti di tengah. */
  function snapToEdge(instant) {
    const area = petArea();
    const size = petSize();
    const middle = pet.x + size.w / 2 < window.innerWidth / 2;
    pet.side = middle ? 'left' : 'right';
    pet.x = middle ? area.minX : Math.max(area.minX, window.innerWidth - area.inset - size.w);
    pet.y = limit(pet.y, area.minY, area.maxY - size.h);
    applyDock(instant);
  }

  function savePos() {
    const area = petArea();
    const size = petSize();
    const span = area.maxY - size.h - area.minY;
    try {
      localStorage.setItem(POS_KEY, JSON.stringify({
        side: pet.side,
        ratio: span > 0 ? (pet.y - area.minY) / span : 1
      }));
    } catch (error) { /* penyimpanan privat */ }
  }

  function restorePos() {
    const area = petArea();
    const size = petSize();
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(POS_KEY) || 'null'); } catch (error) { saved = null; }
    if (saved && (saved.side === 'left' || saved.side === 'right')) {
      pet.side = saved.side;
      const ratio = limit(Number(saved.ratio), 0, 1);
      pet.x = pet.side === 'left' ? area.minX : Math.max(area.minX, window.innerWidth - area.inset - size.w);
      pet.y = limit(area.minY + ratio * (area.maxY - size.h - area.minY), area.minY, area.maxY - size.h);
      applyDock(true);
      return true;
    }
    pet.side = 'right';
    pet.x = Math.max(area.minX, window.innerWidth - area.inset - size.w);
    pet.y = area.maxY - size.h;
    applyDock(true);
    return false;
  }

  function onPetDown(event) {
    if (!pet.node || pet.dragId !== null) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pet.dragId = event.pointerId;
    pet.dragMoved = false;
    pet.grabX = event.clientX - pet.x;
    pet.grabY = event.clientY - pet.y;
    pet.node.style.setProperty('--wx', '0px');
    pet.node.style.setProperty('--wy', '0px');
    window.clearTimeout(pet.wanderTimer);
    try { pet.node.setPointerCapture(event.pointerId); } catch (error) { /* tetap jalan tanpa capture */ }
    if (pet.dock) pet.dock.classList.add('is-dragging');
  }

  function onPetMove(event) {
    if (pet.dragId === null || event.pointerId !== pet.dragId || !pet.dock) return;
    const area = petArea();
    const size = petSize();
    const x = event.clientX - pet.grabX;
    const y = event.clientY - pet.grabY;
    if (!pet.dragMoved && Math.abs(x - pet.x) + Math.abs(y - pet.y) > 7) {
      pet.dragMoved = true;
      hideBubble();
    }
    if (!pet.dragMoved) return;
    event.preventDefault();
    pet.x = limit(x, area.minX, Math.max(area.minX, window.innerWidth - 8 - size.w));
    pet.y = limit(y, area.minY, Math.max(area.minY, area.maxY - size.h));
    applyDock(true);
  }

  function onPetUp(event) {
    if (pet.dragId === null || (event && event.pointerId !== pet.dragId)) return;
    pet.dragId = null;
    if (pet.dock) pet.dock.classList.remove('is-dragging');
    if (pet.dragMoved) {
      snapToEdge();
      if (pet.dock) {
        pet.dock.classList.add('is-landing');
        window.setTimeout(() => { if (pet.dock) pet.dock.classList.remove('is-landing'); }, 640);
      }
      window.setTimeout(() => { pet.dragMoved = false; }, 180);
      savePos();
      Neko.audio.play('select');
      window.setTimeout(() => showBubble(randomOf(LAND_LINES), 2600), 420);
    }
    scheduleWander();
  }

  function onPetResize() {
    if (!pet.mounted || !pet.dock) return;
    if (pet.dragId !== null) return;
    snapToEdge(true);
    savePos();
  }

  function swapCharacter() {
    /* Miko adalah AI assistant utama — tidak dirotasi otomatis lagi. */
    return;
  }
  void swapCharacter;

  /* Simpan pilihan user: maskot bisa dimunculkan atau disembunyikan. */
  function hidePet() {
    Neko.store.patchPrefs({ mascotHidden: true });
    if (pet.dock) {
      pet.dock.classList.add('is-hiding');
      window.setTimeout(() => { unmount(); }, 240);
    } else {
      unmount();
    }
    Neko.audio.play('toggle');
    if (Neko.ui && Neko.ui.toast) {
      Neko.ui.toast('Maskot disembunyikan', 'Munculkan lagi di Profil tab Atur, baris Maskot melayang.', 'info', 'cat');
    }
  }

  function showPet() {
    Neko.store.patchPrefs({ mascotHidden: false });
    if (Neko.store.profile) mount();
  }

  function mount() {
    const root = document.getElementById('mascotRoot');
    if (!root || root.querySelector('.mascot-pet')) return;
    if (Neko.store.prefs.mascotHidden) return;
    pet.root = root;
    pet.id = 'miko';
    pet.mood = 'happy';
    pet.mounted = true;
    pet.dragId = null;
    pet.dragMoved = false;
    pet.side = 'right';

    const dock = document.createElement('div');
    dock.className = 'mascot-dock';
    dock.dataset.side = 'right';
    pet.dock = dock;

    const bubble = document.createElement('button');
    bubble.type = 'button';
    bubble.className = 'mascot-bubble';
    bubble.addEventListener('click', openChatFromPet);
    dock.appendChild(bubble);
    pet.bubble = bubble;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mascot-pet';
    button.style.setProperty('--wx', '0px');
    button.style.setProperty('--wy', '0px');
    button.innerHTML = '<span class="mascot-pet-frame"><span class="mascot-pet-body" style="' + palette('miko') + '">' + svg('miko', 'happy') + '</span></span>';
    button.addEventListener('click', openChatFromPet);
    button.addEventListener('pointerdown', onPetDown);
    button.addEventListener('pointermove', onPetMove);
    button.addEventListener('pointerup', onPetUp);
    button.addEventListener('pointercancel', onPetUp);
    button.addEventListener('lostpointercapture', onPetUp);
    button.addEventListener('dragstart', (event) => event.preventDefault());
    button.setAttribute('title', 'Seret ke tepi, atau ketuk untuk ngobrol');
    pet.node = button;
    pet.body = button.querySelector('.mascot-pet-body');
    dock.appendChild(button);

    /* Tombol silang kecil di atas kepala: menyembunyikan maskot. */
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'mascot-pet-close';
    close.setAttribute('aria-label', 'Sembunyikan maskot');
    close.title = 'Sembunyikan maskot';
    close.innerHTML = icon('close');
    close.addEventListener('click', event => {
      event.stopPropagation();
      event.preventDefault();
      hidePet();
    });
    close.addEventListener('pointerdown', event => event.stopPropagation());
    pet.close = close;
    dock.appendChild(close);
    root.appendChild(dock);

    paintPet();
    const known = restorePos();
    window.setTimeout(() => { if (pet.mounted && pet.dock && pet.dragId === null) restorePos(); }, 150);
    if (!known) {
      dock.classList.add('is-hint');
      window.setTimeout(() => { if (pet.dock) pet.dock.classList.remove('is-hint'); }, 2200);
      window.setTimeout(() => showBubble('Aku bisa digeser ke tepi, lho. Ketuk untuk ngobrol.', 5200), 1900);
    }
    window.addEventListener('resize', onPetResize);
    window.addEventListener('orientationchange', onPetResize);
    window.setTimeout(() => { if (pet.mounted) showBubble(randomOf(IDLE_LINES), 5000); }, 1400);
    scheduleWander();
  }

  function unmount() {
    closeSheet();
    pet.mounted = false;
    window.clearTimeout(pet.wanderTimer);
    window.clearTimeout(pet.bubbleTimer);
    window.clearTimeout(pet.reactTimer);
    window.clearTimeout(pet.comfortTimer);
    window.clearInterval(pet.swapTimer);
    window.removeEventListener('resize', onPetResize);
    window.removeEventListener('orientationchange', onPetResize);
    pet.wanderTimer = pet.bubbleTimer = pet.reactTimer = pet.comfortTimer = pet.swapTimer = null;
    pet.dragId = null;
    pet.dragMoved = false;
    pet.root = pet.node = pet.body = pet.bubble = pet.close = pet.dock = null;
    const root = document.getElementById('mascotRoot');
    if (root) root.innerHTML = '';
  }

  Neko.mascot = {
    cast, svg, openChat, close: closeSheet, mount, unmount, react,
    hide: hidePet, show: showPet,
    get hidden() { return Boolean(Neko.store.prefs.mascotHidden); },
    ask(text, characterId) { return replyFor(text, characterId || 'miko'); }
  };
})();
