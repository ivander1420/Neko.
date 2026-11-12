/* ============================================================
   NEKO · js/contact.js
   Halaman Kontak: guru pembimbing, anggota Kelompok 1, dan
   formulir laporan bug yang dikirim lewat email perangkat.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { esc } = Neko.util;
  const { icon } = Neko.icons;

  const TEACHER = {
    name: 'Pak Andy Musly',
    initials: 'AM',
    role: 'Guru Pembimbing',
    bio: 'Pembimbing proyek NEKO TJKT — media pembelajaran interaktif untuk siswa Teknik Jaringan Komputer dan Telekomunikasi. Guru KKJ 1.',
    tags: ['Pembelajaran TJKT', 'Jaringan Komputer', 'Proyek Kelompok'],
    accounts: [
      ['Google / Gmail', '@andy.musly@gmail.com'],
      ['Instagram', '@aprhy9', 'https://www.instagram.com/aprhy9'],
      ['Blog', 'aprhy.WordPress.com'],
      ['GitHub', 'Belum ditambahkan'],
    ]
  };

  const MEMBERS = [
    {
      name: 'Ivander',
      accounts: [
        ['Google / Gmail', 'ivander1420@gmail.com', 'mailto:ivander1420@gmail.com'],
        ['Instagram', '@vndee_r', 'https://www.instagram.com/vndee_r'],
        ['TikTok', '@user02_1413', 'https://www.tiktok.com/@user02_1413'],
        ['GitHub', 'ivander1420', 'https://github.com/ivander1420']
      ]
    },
    {
      name: 'Muh. Hadit Rafanizam',
      accounts: [
        ['Google / Gmail', 'Belum ditambahkan'],
        ['Instagram', '@mhdrafanzm', 'https://www.instagram.com/mhdrafanzm'],
        ['TikTok', '@rfaanzmm', 'https://www.tiktok.com/@rfaanzmm'],
        ['GitHub', 'rafanizam2010', 'https://github.com/rafanizam2010'],
        ['Red Hat', 'Rafa Nizam']
      ]
    },
    {
      name: 'Muh. Fikron Ainun Najib',
      accounts: [
        ['Google / Gmail', 'Belum ditambahkan'],
        ['Instagram', '@Belum ada', 'Belum ditambahkan'],
        ['TikTok', '@Belum ada', 'Belum ditambahkan'],
        ['GitHub', 'fikronainun', 'Belum ditambahkan'],
        ['Red Hat', 'Belum ditambahkan']
      ]
    },
    {
      name: 'Akhsan Jauhar Santoso',
      accounts: [
        ['Google / Gmail', 'Belum ditambahkan'],
        ['Instagram', '@akhsanzzj', 'https://www.instagram.com/akhsanzzj'],
        ['TikTok', '@aksnjs', 'https://www.tiktok.com/@aksnjs'],
        ['GitHub', 'akhsanjs', 'https://github.com/akhsanjs'],
        ['Red Hat', 'Belum ditambahkan']
      ]
    }
  ];

  const REPORT_TO = 'ivander1420@gmail.com';

  function accountRows(accounts) {
    return '<div class="kontak-rows">' + accounts.map(entry => {
      const platform = entry[0];
      const label = entry[1];
      const url = entry[2];
      const value = url
        ? '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a>'
        : '<span class="' + (/^Belum/.test(label) ? 'is-empty' : '') + '">' + esc(label) + '</span>';
      return '<div class="kontak-row"><b>' + esc(platform) + '</b>' + value + '</div>';
    }).join('') + '</div>';
  }

  function memberCard(person, index) {
    return (
      '<article class="kontak-card member" style="--kc:' + Neko.util.tone(index) + '">' +
      '<div class="kontak-card-head">' +
      '<span class="kontak-avatar">' + esc(Neko.util.initials(person.name)) + '</span>' +
      '<div><b>' + esc(person.name) + '</b><small>Anggota Kelompok 1 · XI TJKT 2</small></div>' +
      '</div>' + accountRows(person.accounts) + '</article>'
    );
  }

  function teacherCard() {
    return (
      '<article class="kontak-card teacher">' +
      '<div class="kontak-card-head">' +
      '<span class="kontak-avatar">' + esc(TEACHER.initials) + '</span>' +
      '<div><span class="kontak-pill">' + esc(TEACHER.role) + '</span><b>' + esc(TEACHER.name) + '</b></div>' +
      '</div>' +
      '<p class="kontak-bio">' + esc(TEACHER.bio) + '</p>' +
      '<div class="kontak-tags">' + TEACHER.tags.map(tag => '<span>' + esc(tag) + '</span>').join('') + '</div>' +
      accountRows(TEACHER.accounts) +
      '</article>'
    );
  }

  function reportCard() {
    return (
      '<article class="kontak-card report">' +
      '<div class="kontak-card-head"><span class="kontak-ic">' + icon('wrench') + '</span>' +
      '<div><b>Laporkan Bug / Masalah</b><small>Laporan dikirim sebagai draf email dari perangkatmu</small></div></div>' +
      '<form class="kontak-form" data-kontak-form>' +
      '<label class="field"><span>Judul laporan</span>' +
      '<input name="title" maxlength="100" required placeholder="Contoh: Kuis Kilat tidak memuat soal"></label>' +
      '<label class="field"><span>Detail masalah</span>' +
      '<textarea name="detail" rows="4" maxlength="1200" required placeholder="Ceritakan kendalanya, perangkat yang dipakai, dan halamannya."></textarea></label>' +
      '<button type="submit" class="btn btn-primary btn-block">' + icon('send') + 'Siapkan laporan</button>' +
      '<p class="kontak-status" data-kontak-status role="status" aria-live="polite"></p>' +
      '</form>' +
      '<div class="kontak-note">' + icon('info') +
      '<span>Alamat tujuan: <b>' + esc(REPORT_TO) + '</b> · bisa juga langsung temui anggota Kelompok 1 di kelas.</span></div>' +
      '</article>'
    );
  }

  function render() {
    return (
      '<section class="kontak-view">' +
      '<header class="kontak-head">' +
      '<span class="kicker">INFORMASI PROYEK</span>' +
      '<h1>Kontak &amp; Informasi</h1>' +
      '<p>Kenal pembuat media pembelajaran ini dan sampaikan masukan. NEKO dibuat oleh Kelompok 1 di bawah bimbingan guru pembimbing.</p>' +
      '<div class="kontak-meta">' +
      '<span>' + icon('school') + 'SMKN 3 Kendari</span>' +
      '<span>' + icon('users') + 'Kelompok 1 · XI TJKT 2</span>' +
      '<span>' + icon('user') + 'Guru pembimbing: Pak Andy Musly</span>' +
      '</div>' +
      '</header>' +
      '<div class="kontak-block"><div class="kontak-block-head"><span class="kicker">GURU PEMBIMBING</span><h2>' + icon('school') + 'Pembimbing Proyek</h2></div>' +
      teacherCard() + '</div>' +
      '<div class="kontak-block"><div class="kontak-block-head"><span class="kicker">KELOMPOK 1</span><h2>' + icon('users') + 'Kontak Anggota</h2>' +
      '<p>Satu kartu berisi seluruh akun yang tersedia. Akun yang belum ditambahkan ditandai.</p></div>' +
      '<div class="kontak-grid">' + MEMBERS.map(memberCard).join('') + '</div></div>' +
      '<div class="kontak-block"><div class="kontak-block-head"><span class="kicker">MASUKAN</span><h2>' + icon('wrench') + 'Lapor Masalah</h2></div>' +
      reportCard() + '</div>' +
      '</section>'
    );
  }

  function bind(root) {
    const form = root.querySelector('[data-kontak-form]');
    if (!form) return;
    const status = root.querySelector('[data-kontak-status]');
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      const title = String(data.get('title') || '').trim();
      const detail = String(data.get('detail') || '').trim();
      if (!title || !detail) {
        if (status) status.textContent = 'Judul dan detail laporan wajib diisi.';
        return;
      }
      const body = [
        'Laporan NEKO TJKT',
        '',
        'Judul: ' + title,
        'Detail:',
        detail,
        '',
        'Akun: ' + ((Neko.store.session || {}).displayName || 'belum login'),
        'Peramban: ' + navigator.userAgent,
        'Waktu: ' + new Date().toLocaleString('id-ID')
      ].join('\n');
      const url = 'mailto:' + REPORT_TO + '?subject=' + encodeURIComponent('[NEKO Bug] ' + title) + '&body=' + encodeURIComponent(body);
      if (status) status.textContent = 'Draf email disiapkan…';
      window.location.href = url;
      Neko.audio.play('success');
      window.setTimeout(() => {
        if (status) status.textContent = 'Draf laporan dibuka di aplikasi email kamu. Kalau tidak muncul, kirim manual ke ' + REPORT_TO + '.';
      }, 900);
      form.reset();
    });
  }

  Neko.contact = { render, bind, teacher: TEACHER, members: MEMBERS };
})();
