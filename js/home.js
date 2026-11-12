/* ============================================================
   NEKO · js/home.js
   Beranda: sapaan, season, check-in, lanjut belajar, arena,
   dan pintasan dunia.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { esc, clamp, formatNumber } = Neko.util;
  const { icon } = Neko.icons;

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 5) return 'Selamat malam';
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 19) return 'Selamat sore';
    return 'Selamat malam';
  }

  function bookById(id) {
    return (window.NEK_MATERIALS?.books || []).find(book => book.id === id);
  }

  function readingCards(profile) {
    const entries = Object.entries(profile.books || {})
      .filter(([, state]) => state && state.maxPage > 0 && !state.finished)
      .sort((a, b) => (b[1].updatedAt || b[1].page || 0) - (a[1].updatedAt || a[1].page || 0))
      .slice(0, 2)
      .map(([id, state]) => ({ book: bookById(id), state }))
      .filter(item => item.book);
    if (!entries.length) {
      const first = window.NEK_MATERIALS?.books?.[0];
      if (!first) return '';
      return (
        '<button type="button" class="home-continue empty" data-read-book="' + first.id + '">' +
        '<span class="home-continue-cover" style="--c1:' + first.colorA + ';--c2:' + first.colorB + '">' + icon(first.icon) + '</span>' +
        '<span class="home-continue-copy"><small>Mulai petualangan</small><b>' + esc(first.title) + '</b><span>Belum dibuka — mulai dari halaman pertama.</span></span>' +
        '<span class="btn btn-soft btn-sm">Baca ' + icon('arrow-right') + '</span>' +
        '</button>'
      );
    }
    return entries.map(({ book, state }) => {
      const total = book.pages.length;
      const page = clamp((state.maxPage || 0) + 1, 1, total);
      const percent = Math.round((page / total) * 100);
      return (
        '<button type="button" class="home-continue" data-read-book="' + book.id + '" data-page="' + (state.maxPage || 0) + '">' +
        '<span class="home-continue-cover" style="--c1:' + book.colorA + ';--c2:' + book.colorB + '">' + icon(book.icon) + '</span>' +
        '<span class="home-continue-copy"><small>Lanjut halaman ' + page + ' dari ' + total + '</small><b>' + esc(book.title) + '</b><span>' + percent + '% selesai · ' + book.minutes + ' menit</span></span>' +
        '<span class="home-continue-ring" style="--p:' + percent + '">' + percent + '<small>%</small></span>' +
        '</button>'
      );
    }).join('');
  }

  function seasonStrip(snapshot) {
    return Neko.seasons.list.map(season => {
      const active = snapshot.season.id === season.id;
      const done = snapshot.season.id > season.id;
      return (
        '<button type="button" class="season-node ' + (active ? 'on' : '') + ' ' + (done ? 'done' : '') + '" data-season="' + season.id + '" aria-label="' + esc(season.name) + '">' +
        '<span class="season-node-dot" style="--sc:' + season.color + '">' + icon(done ? 'check' : season.icon) + '</span>' +
        '<b>' + esc(season.short) + '</b>' +
        '<small>' + (done ? 'Selesai' : active ? formatNumber(snapshot.season.min) + ' XP' : formatNumber(season.min) + ' XP') + '</small>' +
        '</button>'
      );
    }).join('');
  }

  function worlds() {
    return Neko.theme.list.map(item => (
      '<button type="button" class="world-pill ' + (Neko.theme.current().theme === item.id ? 'on' : '') + '" data-world="' + item.id + '" style="--wa:' + item.preview.a + ';--wb:' + item.preview.b + '">' +
      '<span>' + icon(item.icon) + '</span><b>' + esc(item.short) + '</b></button>'
    )).join('');
  }

  function communityFeedBody() {
    const community = Neko.community;
    if (!community) return '';
    const info = community.info || {};
    const announcements = (community.announcements || []).slice(0, 3);
    const active = community.activeCount ? community.activeCount() : 0;
    const infoCard = info.title
      ? '<article class="community-info">' +
        '<span class="kicker">' + icon('note') + 'PAPAN INFORMASI</span>' +
        '<h3>' + esc(info.title) + '</h3>' +
        '<p>' + esc(info.body) + '</p>' +
        '<div class="community-info-meta"><span class="chip">' + icon('users') + active + ' aktif</span>' +
        (info.updatedBy ? '<span class="chip">' + icon('shield') + esc(info.updatedBy) + '</span>' : '') +
        '</div></article>'
      : '<article class="community-info community-empty">' + icon('note') + '<b>Belum ada papan informasi</b><span>Admin dan developer akan menaruh kabar penting di sini.</span></article>';
    const feed = announcements.length
      ? announcements.map(item => (
        '<div class="community-note"><span class="ic">' + icon('megaphone') + '</span><div><b>' + esc(item.title) + '</b><p>' + esc(item.body) + '</p><small>' + esc(item.author || 'Admin') + ' · ' + esc(Neko.util.timeAgo(item.time)) + '</small></div></div>'
      )).join('')
      : '<div class="community-empty">' + icon('megaphone') + '<b>Belum ada pengumuman</b><span>Kabar dari admin akan tampil di sini dan di notifikasi HP.</span></div>';
    return infoCard +
      '<div class="community-feed"><div class="community-feed-head"><b>Pengumuman terbaru</b><span><i></i>LANGSUNG</span></div>' +
      feed +
      '<button type="button" class="btn btn-ghost btn-sm community-feed-more" data-open-notifications>' + icon('bell') + 'Buka kotak masuk</button></div>';
  }

  function communityFeed() {
    return (
      '<section class="home-section home-community">' +
      '<div class="home-section-head"><div><span class="kicker">KABAR KOMUNITAS</span><h2>Dari admin & developer</h2></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-open-leaderboard>' + icon('ranking') + 'Leaderboard</button></div>' +
      '<div class="community-grid" data-home-community>' + communityFeedBody() + '</div>' +
      '</section>'
    );
  }

  function statCard(iconName, value, label, extra = '') {
    return '<div class="home-stat"><span class="home-stat-ic">' + icon(iconName) + '</span><div><b>' + esc(value) + '</b><small>' + esc(label) + '</small>' + (extra ? '<em>' + esc(extra) + '</em>' : '') + '</div></div>';
  }

  function render() {
    const profile = Neko.store.profile;
    if (!profile) return '';
    const snap = Neko.seasons.seasonForXP(profile.xp);
    const checkin = Neko.store.checkinState();
    const session = Neko.store.session || { displayName: 'Siswa' };
    const games = profile.stats.gamesPlayed || 0;
    const booksDone = profile.stats.booksFinished || 0;
    const bestQuiz = profile.stats.quizBest || 0;
    const nextLabel = snap.next ? snap.next.short : 'Legenda';
    const nextXp = snap.next ? formatNumber(snap.xpToNext) + ' XP menuju ' + snap.next.short : 'Kamu sudah di puncak legenda';
    const checkinDone = checkin.claimedToday;

    return (
      '<section class="home-hero">' + (Neko.ornaments ? Neko.ornaments.cluster('hero') : '') +
      '<div class="home-hero-glow" aria-hidden="true"></div>' +
      '<div class="home-hero-copy">' +
      '<span class="kicker">' + esc(greeting().toUpperCase()) + ' · ' + esc(session.role || 'MEMBER') + '</span>' +
      '<h1 class="home-title">Hai, <span>' + esc(session.displayName) + '</span>.<br>Mau jelajah apa hari ini?</h1>' +
      '<p class="home-sub">Baca buku TJKT, uji nyali di arena, dan kumpulkan XP untuk membuka lima season gelar baru.</p>' +
      '<div class="home-actions">' +
      '<button type="button" class="btn btn-primary" data-go="materials">' + icon('books') + 'Buka perpustakaan</button>' +
      '<button type="button" class="btn btn-soft" data-go="arena">' + icon('gamepad') + 'Masuk arena</button>' +
      '</div>' +
      '<div class="home-meta">' +
      '<span class="chip">' + icon('flame') + 'Streak ' + checkin.streak + ' hari</span>' +
      '<span class="chip">' + icon('bolt') + formatNumber(profile.xp) + ' XP</span>' +
      '<span class="chip">' + icon('medal') + esc(snap.season.title) + '</span>' +
      '</div></div>' +
      '<div class="home-hero-side">' +
      '<div class="home-ring" style="--p:' + snap.progress.toFixed(1) + '">' +
      '<div class="home-ring-inner">' + icon(snap.season.icon) + '<b>' + Math.round(snap.progress) + '%</b><small>Season ' + snap.season.id + '</small></div>' +
      '</div>' +
      '<div class="home-ring-info"><b>' + esc(snap.season.name) + '</b><small>' + nextXp + '</small>' +
      '<div class="progress thin"><span style="width:' + snap.progress.toFixed(1) + '%"></span></div></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-season="' + snap.season.id + '">' + icon('info') + 'Detail season</button>' +
      '</div>' +
      '</section>' +
      '<div class="season-strip">' + seasonStrip(snap) + '</div>' +
      communityFeed() +

      '<section class="home-section">' +
      '<div class="home-section-head"><div><span class="kicker">RUTINITAS</span><h2>Selamat datang kembali</h2></div><button type="button" class="btn btn-ghost btn-sm" data-open-chat>' + icon('chat') + 'Tanya Miko (AI)</button></div>' +
      '<div class="home-dash">' +
      '<article class="checkin-card ' + (checkinDone ? 'done' : '') + '">' +
      '<div class="checkin-head"><span class="checkin-ic">' + icon(checkinDone ? 'check-circle' : 'flame') + '</span><div><b>' + (checkinDone ? 'Check-in selesai' : 'Check-in harian') + '</b><small>Streak ' + checkin.streak + ' hari · hadiah makin besar</small></div></div>' +
      '<div class="checkin-days">' + checkin.rewards.map((reward, index) => {
        const day = index + 1;
        const done = day <= checkin.streak || (checkinDone && day === checkin.streak);
        return '<span class="' + (done ? 'on' : '') + '"><i>' + day + '</i><small>+' + reward + '</small></span>';
      }).join('') + '</div>' +
      '<button type="button" class="btn ' + (checkinDone ? 'btn-soft' : 'btn-primary') + ' btn-block" data-checkin ' + (checkinDone ? 'disabled' : '') + '>' + icon(checkinDone ? 'check' : 'sparkles') + (checkinDone ? 'Sampai jumpa besok' : 'Ambil hadiah hari ini') + '</button>' +
      '</article>' +
      '<div class="home-stats">' +
      statCard('gamepad', formatNumber(games), 'Game dimainkan', 'Game TJKT') +
      statCard('books', formatNumber(booksDone), 'Buku selesai', profile.stats.pagesRead + ' halaman dibaca') +
      statCard('target', formatNumber(bestQuiz), 'Skor quiz terbaik', 'Dari 100') +
      statCard('flame', formatNumber(profile.stats.xpToday || 0), 'XP hari ini', 'Terus bertambah') +
      '</div>' +
      '</div></section>' +

      '<section class="home-section">' +
      '<div class="home-section-head"><div><span class="kicker">LANJUT BELAJAR</span><h2>Buku yang sedang kamu baca</h2></div><button type="button" class="btn btn-ghost btn-sm" data-go="materials">' + icon('arrow-right') + 'Semua buku</button></div>' +
      '<div class="home-continue-list">' + readingCards(profile) + '</div>' +
      '</section>' +

      '<section class="home-section">' +
      '<div class="home-section-head"><div><span class="kicker">PILIHAN CEPAT</span><h2>Mulai dalam satu ketukan</h2></div></div>' +
      '<div class="home-quick">' +
      '<button type="button" class="quick-card" data-quick-game="quiz"><span class="quick-ic" style="--qc:' + Neko.util.tone(0) + '">' + icon('brain') + '</span><b>Quiz kilat</b><small>8 soal acak</small>' + icon('arrow-up-right') + '</button>' +
      '<button type="button" class="quick-card" data-quick-game="memory"><span class="quick-ic" style="--qc:' + Neko.util.tone(3) + '">' + icon('memory') + '</span><b>Kartu memori</b><small>Latih ingatan</small>' + icon('arrow-up-right') + '</button>' +
      '<button type="button" class="quick-card" data-quick-live><span class="quick-ic" style="--qc:' + Neko.util.tone(1) + '">' + icon('live') + '</span><b>Kelas Langsung</b><small>Pin &amp; main bareng</small>' + icon('arrow-up-right') + '</button>' +
      '<button type="button" class="quick-card" data-go="messages"><span class="quick-ic" style="--qc:' + Neko.util.tone(2) + '">' + icon('chat') + '</span><b>Pesan &amp; teman</b><small>Cari akun, chat</small>' + icon('arrow-up-right') + '</button>' +
      '<button type="button" class="quick-card" data-go="profile"><span class="quick-ic" style="--qc:' + Neko.util.tone(4) + '">' + icon('shield') + '</span><b>Profil &amp; gelar</b><small>Koleksi badge</small>' + icon('arrow-up-right') + '</button>' +
      '</div></section>' +

      '<section class="home-section">' +
      '<div class="home-section-head"><div><span class="kicker">DUNIA NEKO</span><h2>Ganti suasana belajar</h2></div><button type="button" class="btn btn-ghost btn-sm" data-open-theme>' + icon('palette') + 'Semua tema</button></div>' +
      '<div class="world-strip">' + worlds() + '</div>' +
      '</section>'
    );
  }

  function seasonSheet(seasonId) {
    const season = Neko.seasons.preview(Number(seasonId));
    const snap = Neko.seasons.seasonForXP(Neko.store.profile.xp);
    const active = snap.season.id === season.id;
    Neko.ui.sheet({
      kicker: 'PERJALANAN XP', title: season.name, sub: season.title,
      body:
        '<div class="season-detail" style="--sc:' + season.color + '">' +
        '<span class="season-detail-ic">' + icon(season.icon) + '</span>' +
        '<p>' + esc(season.blurb) + '</p>' +
        '<div class="season-detail-meta"><span>' + icon('bolt') + formatNumber(season.min) + (season.max === Infinity ? ' XP+' : ' – ' + formatNumber(season.max) + ' XP') + '</span><span>' + icon('medal') + esc(season.reward.desc) + '</span></div>' +
        '<div class="progress"><span style="width:' + (active ? snap.progress : season.id < snap.season.id ? 100 : 0) + '%"></span></div>' +
        '<small class="season-detail-note">' + (season.id < snap.season.id ? 'Season ini sudah kamu lewati.' : active ? 'Sedang berjalan — ' + (snap.next ? formatNumber(snap.xpToNext) + ' XP lagi menuju ' + snap.next.short : 'kamu sudah di puncak.') : 'Masih terkunci. Kumpulkan XP untuk membukanya.') + '</small>' +
        '</div>',
      foot: '<button type="button" class="btn btn-soft" data-go="arena">' + icon('gamepad') + 'Cari XP di arena</button>'
    });
  }

  function bind(root) {
    root.addEventListener('click', async event => {
      const go = event.target.closest('[data-go]');
      if (go) { Neko.app.go(go.dataset.go); return; }
      const checkin = event.target.closest('[data-checkin]');
      if (checkin && !checkin.disabled) {
        const result = Neko.store.claimCheckin();
        if (result.ok) {
          Neko.ui.confetti(window.innerWidth / 2, window.innerHeight * .65, 30);
          Neko.ui.toast('Check-in hari ke-' + result.streak, '+' + result.xp + ' XP masuk ke akunmu.', 'success', 'flame');
          Neko.app.refresh();
        }
        return;
      }
      const read = event.target.closest('[data-read-book]');
      if (read) { Neko.book.open(read.dataset.readBook, Number(read.dataset.page) || 0); return; }
      const quick = event.target.closest('[data-quick-game]');
      if (quick) { Neko.arena.quickStart(quick.dataset.quickGame); return; }
      if (event.target.closest('[data-quick-live]')) {
        Neko.audio.play('select');
        if (Neko.live) Neko.live.openChooser();
        return;
      }
      const season = event.target.closest('[data-season]');
      if (season) { seasonSheet(season.dataset.season); return; }
      const world = event.target.closest('[data-world]');
      if (world) {
        Neko.theme.setTheme(world.dataset.world, { x: event.clientX, y: event.clientY });
        window.setTimeout(() => { if (Neko.app.currentView === 'home') Neko.app.render(); }, 1050);
        return;
      }
      if (event.target.closest('[data-open-chat]')) { Neko.mascot.openChat('miko'); return; }
      if (event.target.closest('[data-open-theme]')) { Neko.ui.themeSheet(); return; }
      if (event.target.closest('[data-open-notifications]')) { Neko.ui.notificationsSheet(); return; }
    });

    const grid = root.querySelector('[data-home-community]');
    const onCommunity = () => {
      if (!root.isConnected) {
        document.removeEventListener('neko:community', onCommunity);
        return;
      }
      if (!grid) return;
      grid.innerHTML = communityFeedBody();
    };
    document.addEventListener('neko:community', onCommunity);
  }

  Neko.home = { render, bind, seasonSheet };
})();
