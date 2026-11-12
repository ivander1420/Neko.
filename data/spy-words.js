/* ============================================================
   NEKO — DATA KATA "WHO IS THE SPY"
   Bentuk: window.NEK_SPY.categories = [{ id, name, pairs }]
   pairs = [ kata warga sipil, kata petunjuk mata-mata ]
   Dimuat sebelum data/spy.js membaca window.NEK_SPY.
   ============================================================ */

(() => {
  'use strict';

  const spy = window.NEK_SPY = window.NEK_SPY || { categories: [] };
  const punya = id => spy.categories.some(c => c.id === id);

  const DATA = [
    ['jaringan', 'Jaringan Komputer', [
      ['router', 'switch'],
      ['LAN', 'WAN'],
      ['IP publik', 'IP privat'],
      ['DHCP', 'DNS'],
      ['kabel UTP', 'fiber optik'],
      ['access point', 'repeater'],
      ['hotspot', 'modem'],
      ['subnet mask', 'gateway default'],
      ['ping', 'traceroute'],
      ['bandwidth', 'latency'],
      ['firewall', 'antivirus'],
      ['server', 'klien'],
      ['topologi star', 'topologi ring'],
      ['HTTP', 'HTTPS'],
      ['unggah', 'unduhan'],
      ['Wi-Fi', 'Bluetooth'],
      ['switch', 'hub'],
      ['kabel straight', 'kabel crossover'],
      ['konektor RJ-45', 'konektor ST'],
      ['upload speed', 'download speed']
    ]],
    ['perangkat-keras', 'Perangkat Keras', [
      ['monitor', 'proyektor'],
      ['SSD', 'HDD'],
      ['RAM', 'ROM'],
      ['CPU', 'GPU'],
      ['printer', 'scanner'],
      ['keyboard', 'mouse'],
      ['motherboard', 'sound card'],
      ['flashdisk', 'memory card'],
      ['heatsink', 'kipas CPU'],
      ['casing', 'power supply'],
      ['webcam', 'mikrofon'],
      ['laptop', 'tablet'],
      ['speaker', 'headset'],
      ['drive DVD', 'Blu-ray'],
      ['kartu jaringan', 'USB Wi-Fi'],
      ['joystick', 'gamepad'],
      ['server rak', 'PC client'],
      ['kabel HDMI', 'kabel VGA']
    ]],
    ['perangkat-lunak', 'Sistem & Perangkat Lunak', [
      ['Windows', 'Linux'],
      ['driver', 'aplikasi'],
      ['format disk', 'partisi'],
      ['BIOS', 'UEFI'],
      ['instalasi', 'update'],
      ['desktop', 'taskbar'],
      ['folder', 'shortcut'],
      ['antivirus', 'malware'],
      ['backup', 'restore'],
      ['terminal', 'GUI'],
      ['zip', 'ISO'],
      ['notepad', 'WordPad'],
      ['Cmd', 'PowerShell'],
      ['booting', 'shutting down'],
      ['lisensi resmi', 'bajakan'],
      ['SSO', 'kata sandi']
    ]],
    ['koding', 'Dasar Pemrograman', [
      ['HTML', 'CSS'],
      ['variabel', 'fungsi'],
      ['array', 'objek'],
      ['perulangan', 'kondisi'],
      ['bug', 'debugging'],
      ['frontend', 'backend'],
      ['JavaScript', 'Python'],
      ['komentar', 'kode'],
      ['sintaks', 'logika'],
      ['tag pembuka', 'tag penutup'],
      ['padding', 'margin'],
      ['komponen', 'properti'],
      ['API', 'endpoint'],
      ['class', 'instans'],
      ['string', 'angka'],
      ['if', 'else'],
      ['commit', 'push'],
      ['kolom database', 'baris tabel'],
      ['desain web', 'prototipe'],
      ['kursor', 'terminal']
    ]],
    ['desain', 'Desain Grafis', [
      ['poster', 'banner'],
      ['tipografi', 'palet warna'],
      ['RGB', 'CMYK'],
      ['vektor', 'bitmap'],
      ['layer', 'kanvas'],
      ['logo', 'maskot'],
      ['gradasi', 'kontras'],
      ['grid', 'margin'],
      ['mockup', 'prototipe'],
      ['PNG', 'JPEG'],
      ['PSD', 'SVG'],
      ['judul besar', 'isi teks'],
      ['warm tone', 'cool tone'],
      ['resolusi', 'orientasi'],
      ['poster film', 'poster acara'],
      ['font serif', 'font sans-serif'],
      ['kirim ke printer', 'cetak uji'],
      ['ikon', 'ilustrasi']
    ]],
    ['sekolah', 'Sekolah & TJKT', [
      ['siswa', 'guru'],
      ['praktikum', 'teori'],
      ['rapor', 'nilai'],
      ['PKL', 'sertifikasi'],
      ['portofolio', 'jurnal'],
      ['laboratorium', 'ruang kelas'],
      ['ekskul', 'osis'],
      ['ujian praktik', 'ujian tulis'],
      ['absen', 'izin'],
      ['PR', 'kuis'],
      ['bel istirahat', 'jam kosong'],
      ['pembimbing', 'penguji'],
      ['juara kelas', 'juara umum'],
      ['seragam', 'atribut'],
      ['upacara', 'senam'],
      ['perpustakaan', 'lab jaringan'],
      ['paket keahlian', 'matapelajaran'],
      ['koding di kelas', 'praktik kabel']
    ]],
    ['gawai', 'Gawai & Internet', [
      ['aplikasi', 'situs web'],
      ['notifikasi', 'pesan masuk'],
      ['kuota', 'paket data'],
      ['layar sentuh', 'tombol fisik'],
      ['baterai', 'charger'],
      ['kamera depan', 'kamera belakang'],
      ['sim card', 'eSIM'],
      ['panggilan', 'video call'],
      ['mode pesawat', 'mode hemat'],
      ['jaringan seluler', 'wifi rumah'],
      ['aplikasi chat', 'aplikasi email'],
      ['play store', 'browser'],
      ['screenshot', 'rekaman layar'],
      ['penyimpanan internal', 'penyimpanan awan'],
      ['speaker bluetooth', 'earphone berkabel'],
      ['kabel data', 'adaptor']
    ]],
    ['main', 'Game & E-sports', [
      ['MVP', 'noob'],
      ['lobi', 'pertandingan'],
      ['buff', 'nerf'],
      ['ranked', 'santai'],
      ['karakter', 'skin'],
      ['quest', 'achievement'],
      ['map', 'mode'],
      ['tim musuh', 'tim sendiri'],
      ['solo', 'squad'],
      ['server Asia', 'server Eropa'],
      ['join mabar', 'tolak undangan'],
      ['kalah', 'menang'],
      ['pause', 'resume'],
      ['berita patch', 'peluncuran baru'],
      ['joystick', 'keyboard gaming'],
      ['nonton orang lain', 'siaran langsung']
    ]],
    ['hobi', 'Hobi & Kehidupan', [
      ['kopi', 'teh'],
      ['goreng', 'rebus'],
      ['manis', 'asin'],
      ['pasar', 'minimarket'],
      ['sepeda', 'motor'],
      ['buku', 'film'],
      ['menggambar', 'memasak'],
      ['mendaki', 'berkemah'],
      ['hujan', 'pancaroba'],
      ['pagi buta', 'tengah malam'],
      ['kucing peliharaan', 'ikan hias'],
      ['futsal', 'bulu tangkis'],
      ['padat karya', 'sibuk belajar'],
      ['perpustakaan', 'kafe'],
      ['liburan sekolah', 'libur akhir pekan'],
      ['foto pemandangan', 'foto makanan']
    ]],
    ['profesi', 'Dunia Kerja', [
      ['network engineer', 'help desk'],
      ['desainer', 'pengembang'],
      ['manajer', 'staf'],
      ['gaji', 'bonus'],
      ['wawancara', 'kontrak'],
      ['jam kantor', 'lembur'],
      ['pengalaman', 'magang'],
      ['surat lamaran', 'cv'],
      ['perusahaan', 'klien'],
      ['ruang rapat', 'area kerja'],
      ['freelance', 'karyawan tetap'],
      ['servis komputer', 'instalasi jaringan'],
      ['dokumentasi', 'laporan harian'],
      ['target', 'tenggat'],
      ['kantor cabang', 'kantor pusat'],
      ['purna tugas', 'promosi']
    ]]
  ];

  DATA.forEach(([id, name, pairs]) => {
    if (punya(id)) return;
    spy.categories.push({
      id,
      name,
      pairs: pairs.map(pair => [String(pair[0]), String(pair[1])])
    });
  });

  window.NEK_SPY = spy;
})();
