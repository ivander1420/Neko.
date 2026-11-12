/* ============================================================
   NEKO · js/profile.js
   Profil siswa: gelar season, statistik, badge, koleksi buku,
   karakter, panduan lengkap, dan pengaturan detail.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { esc, formatNumber, timeAgo, clamp } = Neko.util;
  const { icon } = Neko.icons;

  let tab = 'overview';

  const tabs = [
    { id: 'overview', label: 'Profil', icon: 'user' },
    { id: 'collection', label: 'Koleksi', icon: 'medal' },
    { id: 'guide', label: 'Panduan', icon: 'help' },
    { id: 'kontak', label: 'Kontak', icon: 'school' },
    { id: 'settings', label: 'Atur', icon: 'settings' }
  ];

  const characters = [
    {
      id: 'miko', name: 'Miko', role: 'Teman Belajar', icon: 'paw', color: Neko.util.tone(1),
      desc: 'Teman belajar di aplikasi ini. Miko tahu semua materi TJKT (subnet, OSI, VLAN, kabel, IP, WiFi, troubleshooting, keamanan), semua fitur aplikasi, rekomendasi buku, dan bisa mengujimu dengan kuis.',
      hello: 'Miko siap! Tanya apa saja soal TJKT atau fitur NEKO.'
    }
  ];

  function badgeList(profile) {
    const games = profile.stats.games || {};
    const wins = Object.values(games).reduce((sum, entry) => sum + (entry.wins || 0), 0);
    const playedKinds = Object.keys(games).length;
    const earned = new Set(profile.badges || []);
    const seasonBadges = Neko.seasons.list.map(season => ({
      id: season.reward.badge,
      name: season.reward.badge,
      desc: season.reward.desc + ' · ' + season.title,
      icon: season.icon,
      color: season.color,
      ok: earned.has(season.reward.badge) || Neko.seasons.seasonForXP(profile.xp).season.id > season.id
    }));
    return seasonBadges.concat([
      { id: 'pembaca', name: 'Pembaca Tekun', desc: 'Selesaikan satu buku materi', icon: 'books', color: Neko.util.tone(3), ok: profile.stats.booksFinished >= 1 },
      { id: 'kolektor', name: 'Kolektor Buku', desc: 'Tamatkan semua buku materi', icon: 'school', color: Neko.util.tone(0), ok: profile.stats.booksFinished >= 6 },
      { id: 'juara', name: 'Juara Game', desc: 'Menangkan lima sesi game', icon: 'trophy', color: Neko.util.tone(6), ok: wins >= 5 },
      { id: 'penjelajah', name: 'Penjelajah Game', desc: 'Mainkan kedelapan game arena', icon: 'gamepad', color: Neko.util.tone(1), ok: playedKinds >= 8 },
      { id: 'streak', name: 'Api Semangat', desc: 'Streak check-in tujuh hari', icon: 'flame', color: Neko.util.tone(7), ok: (profile.checkin.best || 0) >= 7 },
      { id: 'sniper', name: 'Sniper Kuis', desc: 'Skor kuis terbaik 500+', icon: 'target', color: Neko.util.tone(5), ok: profile.stats.quizBest >= 500 }
    ]);
  }

  function currentSeason(profile) {
    return Neko.seasons.seasonForXP(profile.xp);
  }

  function hero(profile) {
    const snap = currentSeason(profile);
    const season = snap.season;
    const frame = season.reward.frame || 'frame-basic';
    const accuracy = profile.stats.answered ? Math.round((profile.stats.correct / profile.stats.answered) * 100) : 0;
    return (
      '<section class="profile-hero">' + (Neko.ornaments ? Neko.ornaments.cluster('profile') : '') +
      '<div class="profile-identity">' +
      '<div class="profile-avatar-wrap ' + frame + '">' +
      (profile.avatarMedia
        ? '<img class="profile-avatar is-photo" src="' + esc(profile.avatarMedia) + '" alt="Foto profil">'
        : '<span class="profile-avatar">' + icon('cat') + '</span>') +
      '<button type="button" class="profile-avatar-edit" data-avatar-pick title="Ganti foto profil">' + icon('image') + '</button>' +
      '<input type="file" id="avatarFile" accept="image/*" hidden>' +
      '<span class="profile-rank-dot" style="--sc:' + season.color + '">' + icon(season.icon) + '</span>' +
      '</div>' +
      '<div class="profile-id-copy">' +
      '<span class="kicker">' + esc(profile.role || 'MEMBER') + ' · SEJAK ' + new Date(profile.joinedAt || Date.now()).getFullYear() + '</span>' +
      '<h1>' + esc(profile.displayName) + '</h1>' +
      '<p class="profile-handle">@' + esc(profile.username) + '</p>' +
      '<div class="profile-tags">' +
      '<span class="chip">' + icon('medal') + esc(season.title) + '</span>' +
      '<span class="chip">' + icon('bolt') + formatNumber(profile.xp) + ' XP</span>' +
      '<span class="chip">' + icon('flame') + 'Streak ' + (profile.checkin.streak || 0) + '</span>' +
      '<span class="chip">' + icon('target') + 'Akurasi ' + accuracy + '%</span>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="profile-season-card" style="--sc:' + season.color + '">' +
      '<div class="profile-season-head"><span class="profile-season-ic">' + icon(season.icon) + '</span><div><small>' + esc(season.name) + '</small><b>' + esc(season.title) + '</b></div><span class="profile-season-pct">' + Math.round(snap.progress) + '%</span></div>' +
      '<div class="progress"><span style="width:' + snap.progress.toFixed(1) + '%"></span></div>' +
      '<p>' + (snap.next ? formatNumber(snap.xpToNext) + ' XP lagi menuju ' + esc(snap.next.short) + ' · ' + esc(snap.next.reward.desc) : 'Kamu sudah di puncak Legenda. Teruskan warisan ilmu jaringan.') + '</p>' +
      '<button type="button" class="btn btn-soft btn-sm" data-season="' + season.id + '">' + icon('info') + 'Lihat perjalanan season</button>' +
      '</div>' +
      '</section>'
    );
  }

  function statsGrid(profile) {
    const stats = profile.stats;
    const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;
    const items = [
      { icon: 'gamepad', value: formatNumber(stats.gamesPlayed || 0), label: 'Sesi arena', color: Neko.util.tone(0) },
      { icon: 'books', value: formatNumber(stats.booksFinished || 0) + '/6', label: 'Buku tamat', color: Neko.util.tone(3) },
      { icon: 'layers', value: formatNumber(stats.pagesRead || 0), label: 'Halaman dibaca', color: Neko.util.tone(1) },
      { icon: 'target', value: formatNumber(stats.quizBest || 0), label: 'Rekor kuis', color: Neko.util.tone(2) },
      { icon: 'check-circle', value: accuracy + '%', label: 'Akurasi jawaban', color: Neko.util.tone(5) },
      { icon: 'flame', value: (profile.checkin.best || 0) + ' hari', label: 'Streak terbaik', color: Neko.util.tone(7) }
    ];
    return '<div class="profile-stats">' + items.map(item => (
      '<div class="profile-stat" style="--pc:' + item.color + '"><span>' + icon(item.icon) + '</span><div><b>' + item.value + '</b><small>' + item.label + '</small></div></div>'
    )).join('') + '</div>';
  }

  function seasonRoad(profile) {
    const snap = currentSeason(profile);
    return (
      '<div class="profile-road">' +
      Neko.seasons.list.map(season => {
        const done = season.id < snap.season.id;
        const active = season.id === snap.season.id;
        return '<button type="button" class="road-step ' + (done ? 'done' : '') + ' ' + (active ? 'on' : '') + '" data-season="' + season.id + '" style="--sc:' + season.color + '">' +
          '<span class="road-dot">' + icon(done ? 'check' : season.icon) + '</span>' +
          '<span class="road-copy"><b>' + esc(season.title) + '</b><small>' + esc(season.name) + ' · ' + formatNumber(season.min) + (season.max === Infinity ? '+ XP' : '–' + formatNumber(season.max) + ' XP') + '</small></span>' +
          '<span class="road-reward">' + esc(season.reward.badge) + '</span>' +
          '</button>';
      }).join('') + '</div>'
    );
  }

  function overview(profile) {
    return hero(profile) +
      '<section class="profile-section"><div class="profile-section-head"><div><span class="kicker">RINGKASAN</span><h2>Perjalananmu sejauh ini</h2></div><button type="button" class="btn btn-ghost btn-sm" data-profile-tab="collection">' + icon('medal') + 'Lihat koleksi</button></div>' +
      statsGrid(profile) +
      '</section>' +
      '<section class="profile-section"><div class="profile-section-head"><div><span class="kicker">LIMA SEASON</span><h2>Tangga gelar NEKO</h2></div><button type="button" class="btn btn-ghost btn-sm" data-go="arena">' + icon('gamepad') + 'Cari XP</button></div>' +
      seasonRoad(profile) +
      '</section>' +
      '<section class="profile-section"><div class="profile-section-head"><div><span class="kicker">TEMAN BELAJAR</span><h2>Miko, satu-satunya asisten NEKO</h2></div></div>' +
      '<div class="character-grid">' + characters.map(item => (
        '<button type="button" class="character-card" data-character="' + item.id + '" style="--cc:' + item.color + '">' +
        '<span class="character-avatar">' + icon(item.icon) + '</span>' +
        '<span class="character-copy"><b>' + esc(item.name) + '</b><small>' + esc(item.role) + '</small><span>' + esc(item.desc) + '</span></span>' +
        '<span class="character-chat">' + icon('chat') + 'Ngobrol</span>' +
        '</button>'
      )).join('') + '</div></section>';
  }

  function collection(profile) {
    const badges = badgeList(profile);
    const unlocked = badges.filter(item => item.ok).length;
    const books = window.NEK_MATERIALS?.books || [];
    return (
      '<section class="profile-section"><div class="profile-section-head"><div><span class="kicker">KOLEKSI BADGE</span><h2>' + unlocked + ' dari ' + badges.length + ' badge terbuka</h2></div></div>' +
      '<div class="badge-grid">' + badges.map(item => (
        '<div class="badge-tile ' + (item.ok ? 'on' : 'locked') + '" style="--bc:' + item.color + '">' +
        '<span class="badge-ic">' + icon(item.ok ? item.icon : 'lock') + '</span>' +
        '<b>' + esc(item.name) + '</b><small>' + esc(item.desc) + '</small>' +
        (item.ok ? '<span class="badge-state">Terbuka</span>' : '<span class="badge-state">Terkunci</span>') +
        '</div>'
      )).join('') + '</div></section>' +
      '<section class="profile-section"><div class="profile-section-head"><div><span class="kicker">RAK BUKU</span><h2>Koleksi bacaanmu</h2></div><button type="button" class="btn btn-ghost btn-sm" data-go="materials">' + icon('books') + 'Perpustakaan</button></div>' +
      '<div class="profile-books">' + books.map(book => {
        const state = Neko.store.bookState(book.id) || {};
        const read = (state.read || []).length;
        const percent = Math.round((read / book.pages.length) * 100);
        const favorite = (profile.favorites || []).includes(book.id);
        return '<button type="button" class="profile-book" data-read-book="' + book.id + '" data-page="' + (state.maxPage || 0) + '">' +
          '<span class="profile-book-cover" style="--c1:' + book.colorA + ';--c2:' + book.colorB + '">' + icon(book.icon) + '</span>' +
          '<span class="profile-book-copy"><b>' + esc(book.title) + '</b><small>' + (state.finished ? 'Selesai' : read ? read + '/' + book.pages.length + ' halaman' : 'Belum dibuka') + (favorite ? ' · Favorit' : '') + '</small>' +
          '<span class="progress thin"><span style="width:' + percent + '%"></span></span></span>' +
          '<span class="profile-book-pct">' + percent + '%</span>' +
          '</button>';
      }).join('') + '</div></section>' +
      '<section class="profile-section"><div class="profile-section-head"><div><span class="kicker">AKTIVITAS</span><h2>Kabar terakhir</h2></div><button type="button" class="btn btn-ghost btn-sm" data-notifications>' + icon('bell') + 'Notifikasi</button></div>' +
      ((profile.notifications || []).length
        ? '<div class="profile-news">' + profile.notifications.slice(0, 5).map(item => (
          '<div class="profile-news-row"><span>' + icon(item.type === 'season' ? 'trophy' : item.type === 'book' ? 'books' : item.type === 'game' ? 'gamepad' : 'bell') + '</span><div><b>' + esc(item.title) + '</b><small>' + esc(item.body) + '</small></div><time>' + esc(timeAgo(item.time)) + '</time></div>'
        )).join('') + '</div>'
        : '<div class="empty-state"><span class="empty-ic">' + icon('bell') + '</span><h3>Belum ada kabar</h3><p>Mainkan game atau baca buku untuk mengisi kabar terbaru.</p></div>') +
      '</section>'
    );
  }

  function guide() {
    const steps = [
      { icon: 'palette', title: 'Pilih duniamu', body: 'Buka Pengaturan atau tombol tema. Delapan dunia mengubah warna, ikon, latar bergerak, hingga suara. Tema Velocity khusus balap dan selalu gelap, sedangkan Paper Quest membawa suasana peta petualangan.' },
      { icon: 'books', title: 'Baca buku seperti aslinya', body: 'Di Perpustakaan, pilih buku lalu balik halaman dengan tombol, geser, atau tombol panah. Halaman baru memberi XP, menamatkan buku membuka badge.' },
      { icon: 'gamepad', title: 'Mulai dari Game', body: 'Game menampilkan pilihan game lebih dulu. Atur kesulitan dan jumlah ronde, lalu tekan Mulai. Saat bermain, layar penuh berisi game. Tombol Keluar memberi pilihan lanjut atau mengakhiri sesi.' },
      { icon: 'bolt', title: 'Naik lima season', body: 'Kumpulkan XP dari check-in, membaca, dan game. Setiap season penuh memberi gelar, badge, dan bingkai profil baru. Notifikasi season muncul otomatis.' },
      { icon: 'chat', title: 'Ngobrol dengan Miko', body: 'Tekan bulatan maskot untuk langsung membuka chat dengan Miko, teman belajarmu di NEKO. Dia tahu semua materi TJKT dan fitur aplikasi — ketik "kuis" untuk diuji soal.' },
      { icon: 'shield', title: 'Jaga akunmu', body: 'PIN disimpan ter-hash di perangkat ini. Jangan bagikan PIN. Gunakan tombol keluar di profil bila memakai perangkat bersama.' }
    ];
    return (
      '<section class="profile-section"><div class="profile-section-head"><div><span class="kicker">PANDUAN LENGKAP</span><h2>Cara memakai NEKO</h2><p>Semua yang kamu butuhkan, dari tema sampai tips belajar.</p></div></div>' +
      '<div class="guide-grid">' + steps.map((step, index) => (
        '<article class="guide-card"><span class="guide-num">0' + (index + 1) + '</span><span class="guide-ic">' + icon(step.icon) + '</span><h3>' + esc(step.title) + '</h3><p>' + esc(step.body) + '</p></article>'
      )).join('') + '</div></section>' +
      '<section class="profile-section profile-two-col">' +
      '<article class="profile-about"><span class="kicker">TENTANG NEKO</span><h3>Media belajar TJKT yang hidup</h3><p>NEKO mengumpulkan materi, kuis, game, dan progres belajar dalam satu aplikasi. Semua data tersimpan di perangkatmu.</p>' +
      '<div class="about-meta"><span>' + icon('bolt') + 'Delapan dunia tema</span><span>' + icon('info') + 'Penyimpanan lokal</span></div></article>' +
      '<article class="profile-about"><span class="kicker">BANTUAN</span><h3>Butuh bantuan?</h3><p>Tanya Miko lewat tombol ngobrol, atau buka tab Kontak untuk melihat pembimbing, pembuat aplikasi, dan formulir lapor masalah.</p>' +
      '<div class="about-meta"><span>' + icon('chat') + 'Tanya Miko</span><span>' + icon('lock') + 'Data tidak dikirim ke server</span></div>' +
      '<button type="button" class="btn btn-soft btn-sm" data-profile-tab="kontak">' + icon('school') + 'Buka Kontak</button></article>' +
      '</section>'
    );
  }

  function settings(profile) {
    const prefs = Neko.store.prefs;
    const info = Neko.theme.meta(prefs.theme);
    const lightDisabled = !info.modes.includes('light');
    const levelInfo = Neko.theme.carColors;
    const renameCd = profile.renameCd || 0;
    const pinCd = profile.pinCd || 0;
    const inCooldown = ts => ts && (Date.now() - ts) < 30 * 86400000;
    return (
      '<section class="profile-section"><div class="profile-section-head"><div><span class="kicker">AKUN</span><h2>Nama, username, dan PIN</h2><p>Username dan PIN hanya bisa diganti sekali setiap 30 hari. Foto profil bisa diganti kapan saja dari galeri.</p></div></div>' +
      '<div class="settings-panel">' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('user') + '</span><div><b>Nama tampilan</b><small>Bebas diganti kapan saja</small></div></div><button type="button" class="btn btn-soft btn-sm" data-account-name>' + icon('edit') + 'Ganti nama</button></div>' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('at') + '</span><div><b>Username</b><small>' + (renameCd ? 'Bisa diganti lagi ' + timeAgo(renameCd + 30 * 86400000) : 'Sekali per 30 hari') + '</small></div></div><button type="button" class="btn btn-soft btn-sm" data-account-rename>' + icon('edit') + 'Ganti username</button></div>' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('lock') + '</span><div><b>PIN akun</b><small>' + (pinCd ? 'Bisa diganti lagi ' + timeAgo(pinCd + 30 * 86400000) : 'Sekali per 30 hari') + '</small></div></div><button type="button" class="btn btn-soft btn-sm" data-account-pin>' + icon('edit') + 'Ganti PIN</button></div>' +
      '</div></section>' +
      '<section class="profile-section"><div class="profile-section-head"><div><span class="kicker">PENGATURAN DETAIL</span><h2>Sesuaikan NEKO denganmu</h2></div></div>' +
      '<div class="settings-panel">' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('volume') + '</span><div><b>Efek suara</b><small>Klik tombol, jawaban benar, dan notifikasi</small></div></div><button type="button" class="switch" data-audio-toggle aria-pressed="' + String(Neko.audio.soundOn) + '" aria-label="Efek suara"></button></div>' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('chat') + '</span><div><b>Suara karakter</b><small>Narasi intro dan setiap bubble Miko dibacakan</small></div></div><button type="button" class="switch" data-voice-toggle aria-pressed="' + String(!Neko.voice || Neko.voice.enabled()) + '" aria-label="Suara karakter"></button></div>' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('music') + '</span><div><b>Musik tema</b><small>Nada latar mengikuti dunia aktif</small></div></div><button type="button" class="switch" data-music-toggle aria-pressed="' + String(Neko.audio.musicOn) + '" aria-label="Musik tema"></button></div>' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('volume-up') + '</span><div><b>Volume</b><small>Atur kenyaringan efek dan musik</small></div></div><div class="range-row"><input type="range" min="0" max="100" step="1" value="' + Neko.audio.volume + '" data-volume aria-label="Volume"><output data-volume-out>' + Neko.audio.volume + '%</output></div></div>' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('sun') + '</span><div><b>Mode terang</b><small>' + (lightDisabled ? 'Nonaktif pada tema Velocity (mobil)' : 'Berganti suasana siang dan malam') + '</small></div></div><button type="button" class="switch ' + (lightDisabled ? 'is-disabled' : '') + '" data-mode-toggle aria-pressed="' + String(prefs.mode === 'light') + '" aria-label="Mode terang"' + (lightDisabled ? ' aria-disabled="true"' : '') + '></button></div>' +
      (lightDisabled ? '<div class="theme-notice" style="margin:4px 0 10px">' + icon('info') + '<span>Tema Velocity hanya tersedia dalam mode gelap agar tampilan balap tetap konsisten.</span></div>' : '') +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('sparkles') + '</span><div><b>Animasi & gerak</b><small>' + (prefs.motion === 'off' ? 'Animasi latar dimatikan' : 'Latar bergerak aktif') + '</small></div></div><button type="button" class="switch" data-motion-toggle aria-pressed="' + String(prefs.motion !== 'off') + '" aria-label="Animasi latar"></button></div>' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('vibrate') + '</span><div><b>Getaran haptic</b><small>Getaran halus saat menang, kalah, dan menekan tombol</small></div></div><button type="button" class="switch" data-haptics-toggle aria-pressed="' + String(prefs.haptics) + '" aria-label="Getaran haptic"></button></div>' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('cursor') + '</span><div><b>Kursor interaktif</b><small>Kursor bercahaya yang mengikuti tema aktif</small></div></div><button type="button" class="switch" data-cursor-toggle aria-pressed="' + String(prefs.cursor === 'on') + '" aria-label="Kursor interaktif"></button></div>' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('cat') + '</span><div><b>Maskot melayang</b><small>Miko duduk di sisi layar. Bisa juga dimatikan lewat tombol silang di atasnya.</small></div></div><button type="button" class="switch" data-mascot-toggle aria-pressed="' + String(!prefs.mascotHidden) + '" aria-label="Maskot melayang"></button></div>' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('palette') + '</span><div><b>Dunia tema</b><small>' + esc(info.name) + ' · ' + esc(info.desc) + '</small></div></div><button type="button" class="btn btn-soft btn-sm" data-open-theme>' + icon('sparkles') + 'Ganti tema</button></div>' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('play') + '</span><div><b>Intro sambutan</b><small>Putar lagi perkenalan NEKO, halaman penting, dan ketiga asisten</small></div></div><button type="button" class="btn btn-soft btn-sm" data-cine-replay>' + icon('rocket') + 'Putar ulang</button></div>' +
      (prefs.theme === 'car' ? '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('car') + '</span><div><b>Warna mobil</b><small>Merah, biru, atau pink</small></div></div><div class="car-colors compact">' + levelInfo.map(color => '<button type="button" class="car-color" data-car-pick="' + color.id + '" aria-pressed="' + String(prefs.car === color.id) + '" style="--car-dot:' + color.dot + '"><i></i><span>' + color.name + '</span></button>').join('') + '</div></div>' : '') +
      '</div></section>' +
      '<section class="profile-section"><div class="profile-section-head"><div><span class="kicker">NOTIFIKASI</span><h2>Kabar & pengingat</h2></div></div>' +
      '<div class="settings-panel">' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('bell') + '</span><div><b>Kotak masuk</b><small>' + Neko.store.unreadCount() + ' kabar belum dibaca</small></div></div><button type="button" class="btn btn-soft btn-sm" data-notifications>' + icon('bell') + 'Buka</button></div>' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('megaphone') + '</span><div><b>Notifikasi HP</b><small>Kabar admin & developer tampil di layar kunci</small></div></div><button type="button" class="switch" data-push-toggle aria-pressed="' + String(prefs.pushNotify) + '" aria-label="Notifikasi HP"></button></div>' +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('ranking') + '</span><div><b>Leaderboard realtime</b><small>25 peringkat teratas dan pemain yang sedang aktif</small></div></div><button type="button" class="btn btn-soft btn-sm" data-open-leaderboard>' + icon('ranking') + 'Lihat</button></div>' +
      (Neko.admin && Neko.admin.canManage() ? '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('shield') + '</span><div><b>Panel admin</b><small>Kelola papan informasi dan pengumuman global</small></div></div><button type="button" class="btn btn-soft btn-sm" data-go="admin">' + icon('arrow-right') + 'Buka</button></div>' : '') +
      '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('flame') + '</span><div><b>Check-in harian</b><small>Streak ' + (profile.checkin.streak || 0) + ' hari · terbaik ' + (profile.checkin.best || 0) + ' hari</small></div></div><button type="button" class="btn btn-soft btn-sm" data-go="home">' + icon('arrow-right') + 'Ke beranda</button></div>' +
      '</div></section>' +
      '<section class="profile-section profile-danger"><div class="profile-section-head"><div><span class="kicker">ZONA HATI-HATI</span><h2>Akun & data</h2></div></div>' +
      '<div class="danger-row"><div><b>Keluar dari akun</b><small>Kamu perlu memasukkan PIN lagi untuk masuk.</small></div><button type="button" class="btn btn-soft" data-logout>' + icon('exit') + 'Keluar</button></div>' +
      '<div class="danger-row"><div><b>Reset seluruh progres</b><small>XP, badge, buku, dan statistik kembali ke nol. Tindakan ini tidak bisa dibatalkan.</small></div><button type="button" class="btn btn-danger" data-reset-progress>' + icon('restart') + 'Reset progres</button></div>' +
      '</section>'
    );
  }

  function render() {
    const profile = Neko.store.profile;
    if (!profile) return '';
    const body =
      tab === 'collection' ? collection(profile) :
      tab === 'guide' ? guide() :
      tab === 'kontak' ? contactTab() :
      tab === 'settings' ? settings(profile) :
      overview(profile);
    return (
      '<div class="profile-page">' +
      '<div class="profile-tabs segmented" role="tablist" aria-label="Bagian profil">' +
      tabs.map(item => '<button type="button" class="' + (item.id === tab ? 'on' : '') + '" data-profile-tab="' + item.id + '" role="tab" aria-selected="' + String(item.id === tab) + '" ' + (item.id === tab ? 'tabindex="0"' : 'tabindex="-1"') + '>' + icon(item.icon) + item.label + '</button>').join('') +
      '</div>' +
      body +
      '</div>'
    );
  }

  /* Tab Kontak: seluruh informasi proyek (pembimbing, anggota Kelompok 1,
     dan laporan bug) hanya muncul di sini. */
  function contactTab() {
    const inner = Neko.contact ? Neko.contact.render() : '<div class="empty-state"><span class="empty-ic">' + icon('school') + '</span><h3>Kontak belum tersedia</h3><p>Muat ulang halaman untuk memuat data kontak.</p></div>';
    return '<section class="profile-section kontak-in-profile">' + inner + '</section>';
  }

  function characterSheet(id) {
    const item = characters.find(entry => entry.id === id) || characters[0];
    const entry = Neko.ui.sheet({
      kicker: 'TEMAN BELAJAR', title: item.name, sub: item.role,
      className: 'character-sheet',
      body:
        '<div class="character-sheet-body" style="--cc:' + item.color + '">' +
        '<span class="character-avatar big">' + icon(item.icon) + '</span>' +
        '<p>' + esc(item.desc) + '</p>' +
        '<div class="character-quote">“' + esc(item.hello) + '”</div>' +
        '</div>',
      foot: '<button type="button" class="btn btn-soft" data-sheet-close>Tutup</button><button type="button" class="btn btn-primary" data-character-chat>' + icon('chat') + 'Mulai ngobrol</button>',
      onMount(el) {
        el.querySelector('[data-character-chat]').addEventListener('click', () => {
          entry.close();
          window.setTimeout(() => Neko.mascot.openChat(item.id), 260);
        });
      }
    });
  }

  function accountFieldSheet(options) {
    const entry = Neko.ui.sheet({
      kicker: options.kicker,
      title: options.title,
      sub: options.sub || '',
      body:
        '<div class="account-form">' +
        (options.fields || []).map(field => (
          '<label class="field"><span>' + field.label + '</span>' +
          '<input type="' + (field.type || 'text') + '" id="' + field.id + '" ' +
          (field.maxlength ? 'maxlength="' + field.maxlength + '" ' : '') +
          (field.pattern ? 'pattern="' + field.pattern + '" ' : '') +
          'autocomplete="off" placeholder="' + (field.placeholder || '') + '"></label>'
        )).join('') +
        '</div>',
      foot: '<button type="button" class="btn btn-soft" data-sheet-close>Batal</button>' +
        '<button type="button" class="btn btn-primary" data-account-save>' + options.confirm || 'Simpan' + '</button>',
      onMount(el) {
        el.querySelector('[data-account-save]').addEventListener('click', async () => {
          const values = {};
          (options.fields || []).forEach(field => { values[field.id] = el.querySelector('#' + field.id).value.trim(); });
          const button = el.querySelector('[data-account-save]');
          button.disabled = true;
          try {
            await options.onSubmit(values);
            Neko.audio.play('success');
            Neko.ui.closeTop();
          } catch (error) {
            button.disabled = false;
            Neko.ui.toast('Gagal', error.message || 'Coba lagi.', 'error', 'warning');
          }
        });
      }
    });
    return entry;
  }

  function accountNameSheet() {
    accountFieldSheet({
      kicker: 'NAMA TAMPILAN', title: 'Ganti nama',
      fields: [{ id: 'displayName', label: 'Nama baru', maxlength: 30, placeholder: (Neko.store.session || {}).displayName || '' }],
      onSubmit: async values => {
        if (values.displayName.length < 2) throw new Error('Nama minimal 2 huruf.');
        const data = await Neko.api.request('/api/profile/update', { method: 'POST', body: { displayName: values.displayName } });
        if (data && data.user) Neko.store.hydrate({ user: data.user, profile: data.profile });
        Neko.ui.toast('Nama diganti', 'Sekarang kamu tampil sebagai ' + values.displayName, 'success', 'check');
        Neko.app.refresh();
      }
    });
  }

  function accountRenameSheet() {
    const session = Neko.store.session || {};
    if (session.renameCd && (Date.now() - session.renameCd) < 30 * 86400000) {
      Neko.ui.toast('Belum bisa ganti', 'Username hanya bisa diganti sekali setiap 30 hari.', 'warn', 'warning');
      return;
    }
    accountFieldSheet({
      kicker: 'GANTI USERNAME', title: 'Ganti username',
      sub: 'Sekali per 30 hari. Teman, chat, dan XP ikut pindah.',
      fields: [
        { id: 'newUsername', label: 'Username baru', maxlength: 24, placeholder: '@username-baru' },
        { id: 'confirmPin', label: 'PIN akun (konfirmasi)', type: 'password', maxlength: 12 }
      ],
      onSubmit: async values => {
        const data = await Neko.api.account.rename(values.newUsername, values.confirmPin);
        if (data && data.token) {
          try { localStorage.setItem('neko_token_v1', data.token); } catch (error) { /* abaikan */ }
          const fresh = await Neko.api.restoreSession();
          if (fresh) Neko.store.hydrate(fresh);
        }
        Neko.ui.toast('Username diganti', 'Sekarang @' + values.newUsername + '. Ganti lagi bisa 30 hari dari sekarang.', 'success', 'check');
        Neko.app.refresh();
      }
    });
  }

  function accountPinSheet() {
    const session = Neko.store.session || {};
    if (session.pinCd && (Date.now() - session.pinCd) < 30 * 86400000) {
      Neko.ui.toast('Belum bisa ganti', 'PIN hanya bisa diganti sekali setiap 30 hari.', 'warn', 'warning');
      return;
    }
    accountFieldSheet({
      kicker: 'GANTI PIN', title: 'Ganti PIN',
      sub: 'Sekali per 30 hari. Pastikan PIN baru 6-12 angka.',
      fields: [
        { id: 'oldPin', label: 'PIN lama', type: 'password', maxlength: 12 },
        { id: 'newPin', label: 'PIN baru', type: 'password', maxlength: 12 }
      ],
      onSubmit: async values => {
        await Neko.api.account.changePin(values.oldPin, values.newPin);
        Neko.ui.toast('PIN diganti', 'PIN baru aktif sekarang.', 'success', 'lock');
      }
    });
  }

  Neko.profileAccount = { accountNameSheet, accountRenameSheet, accountPinSheet };

  function bind(root) {
    root.addEventListener('click', event => {
      const tabButton = event.target.closest('[data-profile-tab]');
      if (tabButton) {
        tab = tabButton.dataset.profileTab;
        Neko.audio.play('select');
        Neko.app.render();
        document.getElementById('view')?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const season = event.target.closest('[data-season]');
      if (season) { Neko.home.seasonSheet(season.dataset.season); return; }
      const book = event.target.closest('[data-read-book]');
      if (book) { Neko.book.open(book.dataset.readBook, Number(book.dataset.page) || 0); return; }
      const character = event.target.closest('[data-character]');
      if (character) { characterSheet(character.dataset.character); return; }
      if (event.target.closest('[data-notifications]')) { Neko.ui.notificationsSheet(); return; }
      if (event.target.closest('[data-open-theme]')) { Neko.ui.themeSheet(); return; }
      if (event.target.closest('[data-cine-replay]')) {
        Neko.audio.play('select');
        if (Neko.intro) Neko.intro.play({ name: (Neko.store.session || {}).displayName, force: true });
        return;
      }
      const car = event.target.closest('[data-car-pick]');
      if (car) {
        Neko.theme.setCar(car.dataset.carPick);
        root.querySelectorAll('[data-car-pick]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.carPick === car.dataset.carPick)));
        return;
      }
      const audio = event.target.closest('[data-audio-toggle]');
      if (audio) {
        Neko.audio.setSound(!Neko.audio.soundOn);
        audio.setAttribute('aria-pressed', String(Neko.audio.soundOn));
        return;
      }
      const voice = event.target.closest('[data-voice-toggle]');
      if (voice) {
        const next = !Neko.voice.enabled();
        Neko.voice.setEnabled(next);
        voice.setAttribute('aria-pressed', String(next));
        if (next) Neko.voice.say('Suara karakter aktif. Aku Miko, siap menemani belajarmu.', 'miko');
        return;
      }
      const music = event.target.closest('[data-music-toggle]');
      if (music) {
        Neko.audio.setMusic(!Neko.audio.musicOn);
        music.setAttribute('aria-pressed', String(Neko.audio.musicOn));
        return;
      }
      const mode = event.target.closest('[data-mode-toggle]');
      if (mode) {
        const info = Neko.theme.meta(Neko.store.prefs.theme);
        if (!info.modes.includes('light')) {
          Neko.ui.toast('Tema mobil selalu gelap', 'Mode terang dinonaktifkan pada tema Velocity. Ganti tema untuk mode terang.', 'warning', 'warning');
          Neko.audio.play('error');
          return;
        }
        mode.setAttribute('aria-pressed', String(mode.getAttribute('aria-pressed') !== 'true'));
        Neko.theme.toggleMode({ x: event.clientX, y: event.clientY });
        return;
      }
      const motion = event.target.closest('[data-motion-toggle]');
      if (motion) {
        const off = Neko.store.prefs.motion !== 'off';
        Neko.store.patchPrefs({ motion: off ? 'off' : 'auto' });
        Neko.theme.applyDom(Neko.store.prefs);
        motion.setAttribute('aria-pressed', String(!off));
        Neko.ui.toast(off ? 'Animasi dimatikan' : 'Animasi diaktifkan', off ? 'Latar akan diam agar lebih nyaman.' : 'Latar tema bergerak kembali.', 'info', off ? 'moon' : 'sparkles');
        if (Neko.scenes) Neko.scenes.render(Neko.store.prefs.theme, Neko.store.prefs.mode);
        return;
      }
      const haptics = event.target.closest('[data-haptics-toggle]');
      if (haptics) {
        const next = !Neko.store.prefs.haptics;
        Neko.store.patchPrefs({ haptics: next });
        haptics.setAttribute('aria-pressed', String(next));
        Neko.audio.play('toggle');
        if (next && Neko.fx) Neko.fx.haptic('soft');
        Neko.ui.toast(next ? 'Getaran aktif' : 'Getaran dimatikan', next ? 'NEKO akan bergetar halus pada momen penting.' : 'Perangkat tidak akan bergetar lagi.', 'info', 'vibrate');
        return;
      }
      const cursor = event.target.closest('[data-cursor-toggle]');
      if (cursor) {
        const next = Neko.store.prefs.cursor === 'on' ? 'off' : 'on';
        Neko.store.patchPrefs({ cursor: next });
        cursor.setAttribute('aria-pressed', String(next === 'on'));
        if (Neko.fx) Neko.fx.refreshCursor();
        Neko.audio.play('toggle');
        return;
      }
      const mascot = event.target.closest('[data-mascot-toggle]');
      if (mascot) {
        const show = Neko.store.prefs.mascotHidden;
        mascot.setAttribute('aria-pressed', String(show));
        if (Neko.mascot) {
          if (show) Neko.mascot.show();
          else Neko.mascot.hide();
        } else {
          Neko.store.patchPrefs({ mascotHidden: !show });
        }
        return;
      }
      const push = event.target.closest('[data-push-toggle]');
      if (push) {
        const next = !Neko.store.prefs.pushNotify;
        Neko.store.patchPrefs({ pushNotify: next });
        push.setAttribute('aria-pressed', String(next));
        Neko.audio.play('toggle');
        (async () => {
          if (next && Neko.community) {
            const status = await Neko.community.requestPushPermission();
            if (status === 'denied') {
              Neko.ui.toast('Izin notifikasi ditolak', 'Aktifkan izin notifikasi lewat pengaturan peramban.', 'warning', 'bell');
            } else if (status === 'unsupported') {
              Neko.ui.toast('Belum didukung', 'Peramban ini belum mendukung notifikasi sistem.', 'warning', 'bell');
            } else if (status === 'granted') {
              Neko.ui.toast('Notifikasi HP aktif', 'Kabar admin akan tampil di perangkatmu.', 'success', 'megaphone');
            }
          }
        })();
        return;
      }
      if (event.target.closest('[data-logout]')) {
        Neko.ui.dialog({
          title: 'Keluar dari akun?', body: 'Progres tetap tersimpan di perangkat ini. Kamu bisa masuk lagi dengan username dan PIN yang sama.', confirmText: 'Ya, keluar', icon: 'exit'
        }).then(ok => { if (ok) Neko.store.logout(); });
        return;
      }
      if (event.target.closest('[data-reset-progress]')) {
        Neko.ui.dialog({
          title: 'Reset semua progres?', body: 'XP, season, badge, koleksi buku, dan statistik game akan dihapus dari akun ini.', warning: 'Tindakan ini tidak bisa dibatalkan. Buku yang sudah dibaca akan dianggap belum dibaca lagi.', confirmText: 'Reset sekarang', danger: true, icon: 'restart'
        }).then(ok => {
          if (!ok) return;
          Neko.store.resetProgress();
          tab = 'overview';
          Neko.app.refresh();
          Neko.ui.toast('Progres direset', 'Akunmu kembali ke Season 1. Mulai perjalanan baru.', 'info', 'restart');
        });
        return;
      }
      const go = event.target.closest('[data-go]');
      if (go) { Neko.app.go(go.dataset.go); return; }
      const avatarPick = event.target.closest('[data-avatar-pick]');
      if (avatarPick) {
        const picker = root.querySelector('#avatarFile');
        if (picker) picker.click();
        return;
      }
      const accName = event.target.closest('[data-account-name]');
      if (accName) { accountNameSheet(); return; }
      const accRename = event.target.closest('[data-account-rename]');
      if (accRename) { accountRenameSheet(); return; }
      const accPin = event.target.closest('[data-account-pin]');
      if (accPin) { accountPinSheet(); return; }
    });

    const avatarFile = root.querySelector('#avatarFile');
    if (avatarFile) avatarFile.addEventListener('change', async () => {
      const file = avatarFile.files && avatarFile.files[0];
      avatarFile.value = '';
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        Neko.ui.toast('Bukan foto', 'Pilih berkas gambar dari galeri.', 'warn', 'warning');
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        Neko.ui.toast('Terlalu besar', 'Foto profil maksimal 500 MB.', 'warn', 'warning');
        return;
      }
      Neko.ui.toast('Mengunggah foto…', 'Saat selesai foto profil otomatis terpasang.', 'info', 'image');
      try {
        const data = await Neko.api.media.upload(file);
        const url = data.url || '';
        if (url && Neko.api.request) {
          await Neko.api.request('/api/profile/update', { method: 'POST', body: { avatarMedia: url } });
          const fresh = await Neko.api.restoreSession();
          if (fresh) Neko.store.hydrate(fresh);
          Neko.audio.play('success');
          Neko.ui.toast('Foto profil terpasang', 'Foto barumu tampil di profil dan topbar.', 'success', 'check');
          Neko.app.refresh();
        }
      } catch (error) {
        Neko.ui.toast('Gagal memasang foto', error.message || 'Coba lagi.', 'error', 'warning');
      }
    });

    root.addEventListener('input', event => {
      const range = event.target.closest('[data-volume]');
      if (!range) return;
      Neko.audio.setVolume(range.value);
      const out = root.querySelector('[data-volume-out]');
      if (out) out.textContent = range.value + '%';
    });
    root.addEventListener('change', event => {
      if (event.target.closest('[data-volume]')) Neko.audio.play('tick');
    });

    /* Formulir laporan bug di tab Kontak memakai pengikatan milik halaman Kontak. */
    if (tab === 'kontak' && Neko.contact && Neko.contact.bind) Neko.contact.bind(root);
  }

  Neko.profile = {
    render, bind, characterSheet,
    get tab() { return tab; },
    setTab(value) { if (tabs.some(item => item.id === value)) tab = value; }
  };
})();
