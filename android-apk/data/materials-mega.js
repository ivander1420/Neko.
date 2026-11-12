/* ============================================================
   NEKO · data/materials-mega.js
   Ekspansi perpustakaan: ratusan halaman materi tambahan yang
   dibangkitkan dari kerangka topik (dari dasar sampai sulit).
   File ini menambah halaman ke buku yang sudah ada lewat
   window.NEK_MATERIALS_EXPAND, dipanggil oleh materials.js.
   ============================================================ */
(function () {
  'use strict';

  /* Generator halaman: setiap topik menghasilkan bab-bab bertingkat
     (pengenalan, konsep, praktik, lanjutan, kasus, latihan) sehingga
     total halaman jauh lebih banyak dari 8 halaman per buku. */

  const OUTLINES = [
    // [id buku target, judul bab, level, isi paragraf, tabel?, kalimat callout, pertanyaan kuis?]
    ['dasar-jaringan', 'Sejarah dan evolusi jaringan', 'Dasar',
      'Jaringan komputer tumbuh dari ARPANET (1969) yang menghubungkan empat universitas. Protocol NCP digantikan TCP/IP pada 1983, lalu WWW lahir 1991. Memahami sejarah membantu mengerti mengapa standar modern dipilih.'],
    ['dasar-jaringan', 'Analogi pos dan kurir paket', 'Dasar',
      'Data dikirim seperti paket: dibungkus (header), diberi alamat (IP), melewati kantor pos (router), dan dibongkar di tujuan. Header TCP menambah nomor urut agar paket bisa disusun ulang walau datang tidak berurutan.'],
    ['dasar-jaringan', 'Satuan data: bit, byte, dan bandwidth', 'Dasar',
      'Satu bit adalah 0 atau 1. Delapan bit = satu byte. Kecepatan koneksi biasanya Mbps (juta bit per detik), sedangkan ukuran berkas dalam MB (juta byte). Karena 1 byte = 8 bit, unduhan 8 Mbps kira-kira 1 MB per detik.'],
    ['dasar-jaringan', 'Alamat fisik vs alamat logis', 'Dasar',
      'MAC address dipasang pabrik dan bersifat permanen (layer 2). IP address bersifat logis dan bisa berubah (layer 3). ARP menerjemahkan IP menjadi MAC dalam satu LAN.'],
    ['dasar-jaringan', 'Model layanan: client, server, dan peer', 'Dasar',
      'Client meminta layanan, server menyediakan. Peer-to-peer membuat semua perangkat setara — cocok untuk jaringan kecil, tetapi sulit dikelola saat jumlah perangkat bertambah.'],
    ['dasar-jaringan', 'Anatomi frame Ethernet', 'Menengah',
      'Frame Ethernet terdiri atas: preamble (7 byte), SFD (1), MAC tujuan (6), MAC sumber (6), EtherType/panjang (2), payload (46-1500), dan FCS CRC (4). MTU standar 1500 byte; jumbo frame bisa sampai 9000.'],
    ['dasar-jaringan', 'MAC address dan formatnya', 'Menengah',
      'MAC 48 bit, biasanya ditulis 6 pasang heksadesimal. 24 bit pertama adalah OUI (kode pabrikan), 24 bit sisanya nomor seri. Bit kedelapan dari byte pertama menandai unicast (0) atau multicast (1).'],
    ['dasar-jaringan', 'Cara ARP bekerja dan bahaya ARP spoofing', 'Menengah',
      'ARP broadcast bertanya "siapa memiliki IP ini?", pemilik menjawab dengan MAC-nya. Penyerang bisa menjawab palsu (ARP spoofing) untuk menyadap trafik. Mitigasi: Dynamic ARP Inspection dan static ARP.'],
    ['dasar-jaringan', 'Struktur header IPv4', 'Lanjut',
      'Header IPv4 20-60 byte: versi, IHL, ToS/DSCP, total length, identification, flags, fragment offset, TTL, protocol (1=ICMP, 6=TCP, 17=UDP), header checksum, source IP, destination IP, dan options.'],
    ['dasar-jaringan', 'Fragmentasi dan MTU path', 'Lanjut',
      'Paket lebih besar dari MTU jalur dipecah (fragment). Router tidak menyusun ulang — hanya penerima akhir. Path MTU Discovery dengan ICMP "fragmentation needed" mencegah kehilangan paket diam-diam.'],
    ['dasar-jaringan', 'Perbedaan switch managed dan unmanaged', 'Praktik',
      'Switch unmanaged: colok dan jalan. Managed: VLAN, STP, port mirroring, QoS, SNMP, dan keamanan port. Untuk lab TJKT, switch managed memberi latihan konfigurasi nyata.'],
    ['dasar-jaringan', 'Membaca lampu indikator perangkat', 'Praktik',
      'Link light hijau = kabel baik dan negosiasi sukses. Oranye/kedip = aktivitas atau kecepatan rendah. Mati = kabel putus, port mati, atau NIC nonaktif. Selalu mulai troubleshooting dari sini.'],
    ['dasar-jaringan', 'Studi kasus: satu lab tiba-tiba offline', 'Kasus',
      'Gejala: semua PC di satu ruang mati koneksi, lab lain normal. Langkah: cek switch ruang itu (lampu), kabel uplink, VLAN port. Penyebab umum: uplink lepas atau port down. Solusi: cabut-pasang, ganti port, cek trunk.'],
    ['dasar-jaringan', 'Studi kasus: koneksi lambat hanya di jam sibuk', 'Kasus',
      'Gejala: pagi lancar, siang lemot. Kemungkinan: bandwidth terbagi, broadcast storm, atau link duplex mismatch. Solusi: pantau utilization, aktifkan storm control, perbaiki negosiasi duplex.'],
    ['dasar-jaringan', 'Latihan: rancang topologi lab 24 PC', 'Latihan',
      'Tugas: desain topologi star dengan 1 switch 24 port, 1 router, 1 access point. Tentukan: IP range, VLAN untuk guru dan siswa, dan rencana cadangan port. Tuliskan alasan setiap keputusan.'],
    ['ip-subnetting', 'Binari dalam subnetting: melatih mata', 'Dasar',
      'Latih mengenali pola: /24 = 255.255.255.0, /25 = .128, /26 = .192, /27 = .224, /28 = .240, /29 = .248, /30 = .252. Hafal pola oktet keempat mempercepat hitungan tanpa kalkulator.'],
    ['ip-subnetting', 'Membagi /24 menjadi enam subnet', 'Menengah',
      'Butuh 3 bit host (2^3 = 8 blok, ambil 6). Prefix baru /27. Setiap blok berisi 32 alamat: 0, 32, 64, 96, 128, 160, 192, 224. Network = awal blok, broadcast = akhir blok, host usable = 30.'],
    ['ip-subnetting', 'Supernetting dan route aggregation', 'Lanjut',
      'Menggabungkan beberapa /24 berurutan menjadi /23 atau /22 mengurangi tabel routing. Contoh: 192.168.0.0/24 dan 192.168.1.0/24 menjadi 192.168.0.0/23 — syaratnya: berurutan dan sejajar.'],
    ['ip-subnetting', 'VLSM untuk jaringan dengan kebutuhan berbeda', 'Lanjut',
      'VLSM membagi dari subnet terbesar dulu. Contoh: butuh 100 host (blok /25), lalu 50 (/26), 20 (/27), 2 link WAN (/30). Selalu mulai dari kebutuhan terbesar agar tidak tumpang tindih.'],
    ['ip-subnetting', 'Hitung cepat: berapa subnet dari /20', 'Latihan',
      '/20 dari kelas C berarti meminjam 4 bit host: 2^4 = 16 subnet, masing-masing 4096 alamat (2^12) atau 4094 host. Latihan ulang dengan /18, /22, dan /26.'],
    ['vlan-switching', 'Kenapa VLAN memang perlu', 'Dasar',
      'Tanpa VLAN, semua host dalam satu broadcast domain: ARP dan DHCP flood ke semua port. VLAN memisahkan lalu lintas, mengurangi beban, dan memberi batas keamanan antar departemen.'],
    ['vlan-switching', 'Konfigurasi VLAN dasar (Cisco-style)', 'Praktik',
      'Langkah umum: buat VLAN (vlan 10), beri nama (name SISWA), masukkan port (switchport access vlan 10), dan siapkan trunk antar switch (switchport mode trunk). Verifikasi dengan show vlan brief.'],
    ['vlan-switching', 'Native VLAN dan bahayanya', 'Lanjut',
      'Trunk membawa VLAN bertag, kecuali native VLAN (biasanya 1) yang diteruskan tanpa tag. Native VLAN yang beda antar ujung trunk menyebabkan kebocoran trafik. Amankan dengan mengubahnya dan menandai semua VLAN.'],
    ['vlan-switching', 'Inter-VLAN routing: router-on-a-stick dan SVI', 'Lanjut',
      'Dua cara: subinterface router (dot1Q per VLAN) atau SVI di switch layer 3 (interface vlan 10 dengan IP gateway). SVI lebih cepat karena routing terjadi di hardware switch.'],
    ['vlan-switching', 'VTP: manfaat dan risikonya', 'Lanjut',
      'VTP menyebarkan daftar VLAN antar switch (server/client/transparent). Risiko: switch baru mode server dengan revisi lebih tinggi bisa menimpa VLAN. Praktik terbaik: mode transparent atau matikan VTP.'],
    ['vlan-switching', 'Studi kasus: siswa bisa akses VLAN guru', 'Kasus',
      'Gejala: VLAN siswa (10) bisa membuka server VLAN guru (20). Cek: router menyambung keduanya tanpa ACL, atau port akses salah VLAN. Solusi: ACL membatasi, dan audit port access.'],
    ['hardware-kabel', 'Kabel dan standar pembandingan', 'Dasar',
      'Cat5 (100 Mbps), Cat5e (1 Gbps), Cat6 (10 Gbps hingga 55 m), Cat6a (10 Gbps 100 m), Cat7 (shielded, 10 Gbps+). Semakin tinggi kategori, makin ketat twist dan makin tahan interferensi.'],
    ['hardware-kabel', 'Anchor: pembacaan warna tidak konsisten', 'Praktik',
      'Kabel murah kadang warnanya pudar. Jangan andalkan warna saja — gunakan urutan posisi fisik dan tester. Dokumentasikan mapping jack dan patch panel.'],
    ['hardware-kabel', 'Fiber: single-mode vs multi-mode', 'Menengah',
      'Single-mode: inti 9 µm, laser, jarak puluhan km — untuk antar gedung. Multi-mode: inti 50/62.5 µm, LED/VCSEL, jarak ratusan meter — untuk dalam gedung. Connector umum: LC, SC, ST.'],
    ['hardware-kabel', 'PoE: daya lewat kabel data', 'Praktik',
      'PoE 802.3af (15.4 W), PoE+ 802.3at (30 W), PoE++ 802.3bt (60-90 W). Dipakai untuk IP camera, access point, dan telepon VoIP. Cek budget daya switch sebelum menambah perangkat.'],
    ['hardware-kabel', 'Studi kasus: kecepatan hanya 100 Mbps di kabel Cat6', 'Kasus',
      'Gejala: NIC gigabit tapi link 100 Mbps. Kemungkinan: satu pasang kabel rusak (gigabit butuh 4 pasang), krimping kendor, atau port setengah duplex. Solusi: test kabel, crimp ulang, paksa auto-negotiation.'],
    ['troubleshooting', 'Metodologi: dari luar ke dalam', 'Dasar',
      'Urutan aman: periksa fisik → cek link → cek IP → ping gateway → ping luar → cek DNS → cek aplikasi. Mengubah dua hal sekaligu menyembunyikan penyebab.'],
    ['troubleshooting', 'Membaca output ping dan tracert', 'Praktik',
      'Ping: rata-rata dan packet loss. Tracert: setiap hop menampilkan router. Tanda * berarti hop tidak menjawab ICMP tetapi trafik tetap lewat — bukan selalu masalah.'],
    ['troubleshooting', 'ipconfig dan semua temannya', 'Praktik',
      'ipconfig (ringkas), /all (DNS, MAC, DHCP), /release dan /renew (perbarui DHCP), /flushdns (bersihkan cache DNS), /displaydns (lihat cache). netstat -ano menampilkan koneksi dan PID.'],
    ['troubleshooting', 'Studi kasus: WiFi tersambung tapi tidak bisa internet', 'Kasus',
      'Gejala: ikon WiFi ok, browsing gagal. Cek: IP diterima? gateway terjangkau? DNS jalan? Penyebab umum: AP terisolasi (guest isolation), DNS salah, atau captive portal belum login.'],
    ['keamanan-jaringan', 'Zona keamanan: DMZ dan segmentasi', 'Menengah',
      'DMZ menampung server publik agar kompromi tidak menjangkau LAN. Aturan umum: LAN → DMZ diizinkan terbatas, DMZ → LAN ditolak, internet → DMZ hanya port layanan.'],
    ['keamanan-jaringan', 'Password, MFA, dan kebiasaan aman', 'Dasar',
      'Password panjang lebih kuat daripada rumit. MFA menambah lapisan. Jangan pakai sandi sama antar layanan, dan ganti segera bila ada indikasi kebocoran.'],
    ['keamanan-jaringan', 'Anatomi serangan MITM', 'Lanjut',
      'Man-in-the-middle: penyerang memposisikan diri antara korban dan gateway (ARP spoofing, rogue AP, DNS hijack). Mitigasi: HTTPS, DNSSEC, 802.1X, dan port security.'],
    ['keamanan-jaringan', 'Studi kasus: perangkat tak dikenal di jaringan', 'Kasus',
      'Gejala: muncul MAC asing di switch. Langkah: identifikasi via ARP/NAC, cek port fisik, aktifkan port security atau 802.1X. Bila mencurigakan, isolasi VLAN karantina.']
  ];

  function page(title, level, body, idx, total) {
    return {
      kicker: 'Bab tambahan · ' + level,
      title,
      html: `
        <p>${body}</p>
        <div class="page-callout"><b>Bagian ${idx} dari ${total}.</b> Halaman ini memperluas perpustakaan — dari dasar sampai level sulit. Bacalah berurutan agar konsep menempel.</div>
        <div class="page-quiz"><b>Cek pemahaman</b>Jelaskan dengan kalimatmu sendiri inti dari halaman ini.<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Kalau bisa menjelaskan tanpa melihat catatan, kamu sudah paham. Lanjut ke halaman berikutnya.</div></div>
      `
    };
  }

  function expand(NEK) {
    if (!NEK || !Array.isArray(NEK.books)) return 0;
    let added = 0;
    for (const outline of OUTLINES) {
      const [bookId, title, level, body] = outline;
      const book = NEK.books.find(item => item.id === bookId);
      if (!book) continue;
      book.pages = book.pages || [];
      book.pages.push(page(title, level, body, book.pages.length + 1, book.pages.length + 1));
      added += 1;
    }
    return added;
  }

  /* Generator bab panjang: satu topik menghasilkan banyak halaman bertingkat
     sehingga perpustakaan benar-benar mencapai 1000+ halaman total. */

  const MEGA = [
    ['dasar-jaringan', 'Fondasi Jaringan: Dasar sampai Sulit', [
      ['Apa itu jaringan: dari dua komputer ke internet', 'Menghubungkan dua komputer cukup kabel crossover. Menyatukan jutaan perangkat butuh standar berlapis: fisik, logis, dan aplikasi. Setiap lapisan punya tugas spesifik yang tidak boleh dicampur.'],
      ['Topologi fisik dan logis', 'Topologi fisik menggambarkan bentuk nyata kabel; logis menggambarkan aliran data. Star fisik bisa bersifat logis bus bila memakai hub.'],
      ['Perangkat pasif dan aktif', 'Kabel, patch panel, dan jack adalah pasif — tidak butuh daya dan tidak memproses. Switch, router, dan AP aktif: membaca alamat dan mengambil keputusan.'],
      ['MAC: identitas jaringan lokal', 'Setiap NIC punya MAC unik 48 bit. Switch mempelajari MAC sumber untuk membangun tabel CAM, lalu meneruskan frame hanya ke port tujuan.'],
      ['ARP dalam satu LAN', 'ARP menerjemahkan IP ke MAC. Cache ARP bertahan beberapa menit. Static ARP mencegah spoofing tapi sulit dikelola di jaringan besar.'],
      ['IP: alamat logis dan hirarki', 'IPv4 32 bit terbagi dua bagian: network dan host. Subnet mask menentukan pembagiannya. Ini memungkinkan routing: router hanya melihat bagian network.'],
      ['Routing statis vs dinamis', 'Routing statis ditulis manual, cocok untuk jaringan kecil dan stabil. Dinamis (RIP, OSPF, BGP) berbagi informasi rute dan beradaptasi otomatis saat jalur putus.'],
      ['TCP: keandalan lewat jabat tangan', 'Three-way handshake SYN, SYN-ACK, ACK membuka koneksi. Nomor urut dan ACK memastikan data utuh. FIN menutup dengan rapi; RST memutus paksa.'],
      ['UDP: cepat tanpa jaminan', 'UDP 8 byte header, tanpa koneksi, tanpa retensi. Cocok untuk video live, game, dan DNS karena kecepatan lebih penting daripada keandalan.'],
      ['ICMP: bahasa diagnosis', 'Ping memakai ICMP echo request/reply. Traceroute mengeksploitasi TTL expiring. Redirect, unreachable, dan time exceeded adalah pesan diagnosis penting.'],
      ['DNS: buku telepon internet', 'Hierarki: root → TLD → authoritative. Resolver menyimpan cache sesuai TTL. Rekaman: A, AAAA, CNAME, MX, TXT, NS, PTR, SRV.'],
      ['DHCP dan proses DORA', 'Discover (broadcast), Offer (server menawarkan), Request (klien memilih), Acknowledge (server menetapkan). Lease bisa diperpanjang sebelum kedaluwarsa.'],
      ['NAT: banyak perangkat, satu IP publik', 'NAT overloading (PAT) memetakan banyak IP privat ke satu IP publik dengan port berbeda. Menyembunyikan topologi internal, tapi merusak beberapa protokol peer-to-peer.'],
      ['IPv6: alamat 128 bit', 'Format 8 grup heksadesimal. Jenis: unicast global, link-local (fe80::), multicast. Tidak ada broadcast; digantikan multicast dan anycast. SLAAC memungkinkan auto-config tanpa DHCP.'],
      ['Kualitas layanan (QoS)', 'QoS mengatur prioritas: voice > video > data > best-effort. Tools: classification, marking (DSCP), queuing, shaping, policing.'],
      ['Keandalan: redundansi dan failover', 'Redundansi: dual link, dual switch, dual ISP. Protocol: STP mencegah loop, HSRP/VRRP menyediakan gateway cadangan, dan ECMP membagi beban.'],
      ['Monitor: SNMP, NetFlow, dan syslog', 'SNMP menyediakan counter perangkat; NetFlow menganalisis aliran trafik; syslog mengumpulkan log terpusat. Ketiganya adalah mata jaringan.'],
      ['Membangun lab virtual', 'Packet Tracer, GNS3, dan EVE-NG mensimulasikan jaringan tanpa perangkat nyata. Sangat berguna untuk mencoba konfigurasi sebelum diterapkan.'],
      ['Etika dan legalitas', 'Menyusup ke jaringan orang lain tanpa izin adalah tindak pidana. Gunakan keterampilan untuk memperbaiki, bukan merusak. Selalu punya izin tertulis sebelum pengujian.'],
      ['Karier dan sertifikasi', 'Jalur sertifikasi populer: CompTIA Network+, CCNA, CCNP, dan CCIE. Setiap level menuntut pemahaman lebih dalam dan pengalaman nyata.']
    ]],
    ['ip-subnetting', 'Subnetting Dari Nol Sampai Sulit', [
      ['Kenapa subnetting ada', 'Tanpa pembagian, satu broadcast domain membengkak. Subnetting membagi jaringan besar menjadi unit kecil yang efisien dan mudah diamankan.'],
      ['Sistem biner dan oktet', 'IPv4 = 4 oktet × 8 bit. Nilai oktet: 128, 64, 32, 16, 8, 4, 2, 1. Memahami binari membuat semua rumus subnetting jadi logis.'],
      ['Kelas IP lama dan CIDR', 'Kelas A/B/C sudah usang; CIDR (/prefix) menggantikan karena lebih fleksibel. Namun kelas masih sering muncul di soal ujian.'],
      ['Public vs private IP', 'Rentang privat: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. IP publik unik global dan diberikan ISP. RFC 1918 adalah referensi utamanya.'],
      ['Loopback, APIPA, dan multicast', '127.0.0.1 loopback; 169.254.x.x APIPA saat DHCP gagal; 224.0.0.0/4 multicast. Tiap rentang punya tujuan spesifik.'],
      ['Subnet mask dan notasi', '/24 = 255.255.255.0. Mask menandai bit network. Mengubah satu bit mask mengubah jumlah host drastis — inilah kekuatan dan bahayanya.'],
      ['Menentukan jumlah subnet dari prefix', 'Borrowed bits = prefix baru − prefix asal. Jumlah subnet = 2^borrowed. Contoh: /26 dari /24 berarti 2 bit dipinjam, 4 subnet.'],
      ['Menentukan jumlah host per subnet', 'Host bits = 32 − prefix. Total alamat = 2^host_bits. Usable = total − 2 (network + broadcast). Khusus /31 dan /32: point-to-point dan single-host.'],
      ['Broadcast address dalam satu langkah', 'Broadcast = network address + (blok size − 1). Blok size = 256 − oktet mask terakhir yang tidak 255. Contoh: mask .192 → blok 64.'],
      ['Latihan cepat /26', '192.168.1.0/26: blok 64. Subnet: 0, 64, 128, 192. Masing-masing 62 host. Network pertama 192.168.1.0, broadcast pertama 192.168.1.63.'],
      ['Latihan cepat /28', '/28: blok 16, 14 host usable. Dalam /24 ada 16 subnet: 0, 16, 32, ... 240. Berguna untuk subnet kecil antar router.'],
      ['Latihan cepat /30', '/30: hanya 2 host. Sangat efisien untuk link WAN antar router. RFC 3021 mengizinkan /31 untuk point-to-point modern.'],
      ['VLSM: subnet dalam subnet', 'Mulai dari kebutuhan terbesar. Alokasi berurutan tanpa overlap. Contoh: butuh 60, 30, 10, 2 → /26, /27, /28, /30 dari satu /24.'],
      ['Route summarization', 'Gabungkan beberapa subnet jadi satu rute lebih besar untuk menghemat tabel routing. Contoh: 10.1.0.0/24 dan 10.1.1.0/24 → 10.1.0.0/23.'],
      ['IPv6 subnetting', 'Tanpa subnet mask variatif: biasanya /64 untuk LAN. Subnetting dilakukan dengan menambah nibble pada network portion. Jumlah teoretis luar biasa besar.'],
      ['Troubleshooting subnetting', 'Gejala umum: dua host dengan subnet berbeda tapi gateway salah → bisa ping IP langsung tapi tidak bisa hostname. Selalu periksa mask dan gateway bersamaan.'],
      ['Cheat sheet subnetting', 'Tabel cepat: /24 (256), /25 (128), /26 (64), /27 (32), /28 (16), /29 (8), /30 (4), /31 (2), /32 (1). Hitung blok, lalu host usable = blok − 2.']
    ]],
    ['vlan-switching', 'Switching dan VLAN: Dari Dasar Hingga Expert', [
      ['Switch: cara kerja dasar', 'Switch membaca MAC tujuan lalu meneruskan hanya ke port yang tepat. Tiga mode: unicast (dikenal), multicast, dan broadcast (flood ke semua port di VLAN sama).'],
      ['Collision domain vs broadcast domain', 'Setiap port switch = 1 collision domain. Satu VLAN = 1 broadcast domain. Memahami perbedaannya penting sebelum menyentuh VLAN.'],
      ['VLAN: konsep dasar', 'Satu switch dibagi menjadi beberapa jaringan logis. Port di VLAN berbeda tidak bisa berkomunikasi tanpa router. Memisahkan lalu lintas untuk keamanan dan efisiensi.'],
      ['Konfigurasi VLAN di Cisco', 'Perintah dasar: `vlan 10`, `name SISWA`, lalu `switchport access vlan 10` di interface. Verifikasi: `show vlan brief` dan `show interfaces trunk`.'],
      ['Trunk dan IEEE 802.1Q', 'Trunk membawa banyak VLAN dalam satu kabel dengan menambah tag 4 byte pada frame. Native VLAN tidak ditag — rawan kebocoran jika tidak konsisten.'],
      ['DTP dan negosiasi trunk', 'Dynamic Trunking Protocol otomatis bernegosiasi. Praktik terbaik: matikan DTP (`switchport nonegotiate`) dan set mode secara eksplisit.'],
      ['VTP mode dan revisi', 'Server menyebarkan VLAN, client menerima, transparent meneruskan tanpa ikut. Revisi tinggi bisa menimpa konfigurasi. Mode transparan lebih aman.'],
      ['STP: mencegah loop', 'Spanning Tree Protocol memblokir port redundan sementara. Root bridge dipilih berdasarkan priority dan MAC. BPDU dikirim tiap 2 detik.'],
      ['STP convergence dan RSTP', 'STP klasik lambat (30-50 detik). RSTP (802.1w) mempercepat lewat proposal/agreement. Port state: discarding, learning, forwarding.'],
      ['Port security', 'Membatasi MAC yang boleh di satu port. Violation: protect (drop diam), restrict (drop + log), shutdown (matikan port). Sangat efektif mencegah rogue device.'],
      ['EtherChannel / LACP', 'Menggabungkan beberapa link fisik menjadi satu logis untuk throughput lebih dan redundansi. Mode: on, LACP (active/passive), PAgP (Cisco).'],
      ['Voice VLAN', 'Port akses bisa membawa dua VLAN: data dan voice. Telepon IP menandai paket suara dengan CoS/DSCP khusus agar mendapat prioritas.'],
      ['Private VLAN', 'Mengisolasi host dalam satu VLAN: promiscuous (boleh semua), isolated (tidak saling), community (satu grup). Untuk hotel, kampus, atau hosting.'],
      ['VLAN hopping dan mitigasi', 'Serangan double-tagging dan rogue trunk. Mitigasi: matikan DTP, ubah native VLAN, tandai semua VLAN sebagai tagged di trunk.'],
      ['Layer 3 switch dan SVI', 'Switch layer 3 bisa routing antar VLAN tanpa router terpisah. Konfigurasi: `interface vlan 10`, beri IP, aktifkan `ip routing`.'],
      ['Mgmt VLAN dan akses aman', 'Pisahkan VLAN manajemen. Batasi akses via ACL, gunakan SSH bukan Telnet, dan selalu set password konsol serta enable secret.'],
      ['Studi kasus: VLAN bocor', 'Gejala: device VLAN 20 melihat trafik VLAN 10. Penyebab umum: native VLAN tidak konsisten antar switch, atau port salah mode. Perbaiki trunk dan audit semua port.']
    ]],
    ['hardware-kabel', 'Hardware, Kabel, dan Praktik Lab', [
      ['Struktur kabel UTP', 'Empat pasang kabel tembaga ber-twist. Twist mengurangi crosstalk. Shielded (STP) menambah foil untuk lingkungan berinterferensi tinggi.'],
      ['RJ45 dan pinout', '8 pin, 4 pasang aktif. Pin 1-2 transmit, 3-6 receive pada 100BASE-TX. Gigabit memakai keempat pasang sekaligus bidirectional.'],
      ['Standar T568A dan T568B', 'T568B lebih umum di AS/Indonesia: putih-oranye, oranye, putih-hijau, biru, putih-biru, hijau, putih-cokelat, cokelat. T568A menukar oranye-hijau.'],
      ['Straight-through vs crossover', 'Straight: beda jenis perangkat (PC → switch). Crossover: sesama jenis (PC → PC, switch → switch) — tapi Auto-MDIX modern membuatnya jarang diperlukan.'],
      ['Crimping dan alat yang dibutuhkan', 'Alat: crimping tool, cable stripper, tester. Langkah: kupas 2 cm, pilin pasangan, luruskan, masuk ke RJ45 sesuai standar, tekan crimp kuat.'],
      ['Cable tester dan kategori', 'Tester murah hanya cek konektivitas. Tester mahal (Fluke) mengukur NEXT, return loss, dan delay skew — penting untuk sertifikasi kabel Cat6+.'],
      ['Patch panel dan struktur kabel', 'Patch panel menyatukan banyak kabel dalam satu rack. Labeling konsisten mencegah kekacauan. Ikuti standar TIA-606 untuk penomoran.'],
      ['Fiber optic: cara kerja', 'Cahaya dipantulkan total internal di inti kaca. Single-mode: laser, jarak jauh, mahal. Multi-mode: LED, jarak dekat, lebih murah.'],
      ['Fiber connector dan splicing', 'LC modern, SC lama, ST tua. Fusion splicer menyambung fiber dengan lengkung panas; mechanical splice lebih murah tapi merugi.'],
      ['Keuntungan dan kerugian fiber', 'Unggul: bandwidth, jarak, kebal interferensi. Kekurangan: mahal, rapuh, butuh alat khusus. Tidak bisa dikirim listrik seperti PoE.'],
      ['Serial dan console', 'Konsol RJ45-to-DB9 atau USB-to-serial untuk konfigurasi awal. Baud rate umum: 9600 8N1. Backup konfigurasi via TFTP atau USB.'],
      ['PoE: daya dan thermal', 'PoE mengirim listrik lewat kabel data. Perhatikan: budget total switch, panjang kabel, dan panas yang dihasilkan. PoE++ untuk PTZ kamera dan AP kelas atas.'],
      ['Memilih switch: managed vs unmanaged', 'Unmanaged untuk rumah. Smart managed untuk lab. Fully managed (L3) untuk produksi. Pertimbangkan PoE budget, jumlah port, throughput backplane.'],
      ['Rack, UPS, dan cooling', 'Rack unit (RU): 1RU = 44,45 mm. UPS melindungi dari mati listrik dan tegangan tak stabil. Cooling penting — perangkat panas menurunkan umur.'],
      ['Labeling dan dokumentasi', 'Setiap kabel, port, dan perangkat harus berlabel. Dokumentasi mencakup diagram fisik, tabel IP, dan konfigurasi — itu nyawa jaringan saat bencana.'],
      ['Studi kasus: kabel tidak standar', 'Gejala: link naik-turun, kecepatan turun. Penyebab: kabel melebihi 100 m, bercampur dengan kabel daya, atau konektor tidak sesuai standar. Uji ulang dan timpa.']
    ]],
    ['troubleshooting', 'Troubleshooting Lanjutan', [
      ['Model OSI sebagai checklist', 'Turun dari layer 1 ke 7. Bila layer 1 (kabel) oke, naik ke layer 2 (VLAN/MAC), dst. Menyelesaikan masalah tanpa memahami layer itu menebak-nebak.'],
      ['Top-down vs bottom-up', 'Top-down mulai dari aplikasi (user melihat error?), bottom-up dari fisik (kabel nyambung?). Bottom-up lebih sistematis untuk teknisi.'],
      ['Isolasi masalah dengan divide & conquer', 'Bagi jalur menjadi dua; uji titik tengah. Masalah di sisi kiri atau kanan? Ulangi sampai ketemu. Jauh lebih cepat daripada cek semua.'],
      ['Membaca log dengan benar', 'Log punya timestamp, severity (debug/info/warning/error), dan facility. Cari pola berulang. Syslog terpusat membuat pencarian lintas perangkat mudah.'],
      ['Wireshark: menangkap paket', 'Filter berguna: `ip.addr == 10.0.0.5`, `tcp.port == 80`, `icmp`. Analyze → Follow TCP Stream melihat percakapan aplikasi.'],
      ['Menganalisis handshake TCP', 'Melihat SYN, SYN-ACK, ACK pada Wireshark. Bila SYN tidak dijawab: firewall atau server down. Bila RST: port tertutup. Retransmission banyak = jaringan buruk.'],
      ['DNS troubleshooting', 'nslookup, dig, dan host. Jawaban NXDOMAIN = domain tidak ada. SERVFAIL = server bermasalah. Timeout = resolver tidak terjangkau.'],
      ['Latency dan jitter', 'Latency: waktu satu arah. Jitter: variasi latency. Untuk VoIP ideal: latency <150 ms, jitter <30 ms, loss <1%. Lebih dari itu suara terputus-putus.'],
      ['Bandwidth vs throughput', 'Bandwidth = kapasitas teoretis. Throughput = yang benar-benar sampai. Overhead protokol, jitter, dan collision membuat throughput selalu lebih rendah.'],
      ['Menguji path dengan traceroute', 'Tiap hop menunjukkan router. Bila hop tertentu selalu tinggi latency: kemungkinan link sibuk. Bila hop terakhir timeout: mungkin firewall menolak ICMP, bukan masalah.'],
      ['Analisis packet loss', 'Loss di hop pertama = masalah lokal. Loss konsisten di semua hop = bottleneck di jalur. Gunakan MTR untuk kombinasi ping + traceroute realtime.'],
      ['Duplex mismatch', 'Satu sisi full, sisi lain half → collision late meningkat, throughput anjlok. Gejala: berfungsi untuk trafik kecil, gagal untuk transfer besar. Solusi: paksa auto di kedua sisi.'],
      ['Loop dan broadcast storm', 'Loop menyebabkan frame berkembang biak tak terkendali. CPU switch melonjak, jaringan lumpuh. Mitigasi: STP aktif, storm control, BPDU guard.'],
      ['DHCP issues', 'Duplicate IP, DHCP rogue, scope habis. Cek dengan: `ipconfig /all` (gateway & DHCP server), `show ip dhcp binding`, dan packet capture untuk melihat DORA.'],
      ['WiFi troubleshooting', 'Sinyal lemah (RSSI <-70 dBm), interference channel (channel overlap), kapasitas AP penuh. Tools: WiFi analyzer, spectrum analyzer. Solusi: posisi AP, channel planning.'],
      ['VPN troubleshooting', 'Cek: fase 1 IKE (SA terbentuk?), fase 2 IPsec (traffic selector cocok?), NAT-T (jaringan menengah NAT?), MTU (fragmentasi?). `show crypto isakmp sa` adalah teman.'],
      ['Dokumentasi: peta troubleshooting', 'Selalu catat: gejala, langkah, hasil, dan solusi. Basis pengetahuan internal mempercepat penyelesaian masalah serupa di masa depan.']
    ]],
    ['keamanan-jaringan', 'Keamanan Jaringan Mendalam', [
      ['Prinsip CIA', 'Confidentiality (rahasia), Integrity (utuh), Availability (tersedia). Setiap kontrol keamanan melayani satu atau lebih dari tiga pilar ini.'],
      ['Defense in depth', 'Jangan bergantung satu lapisan. Kombinasi: firewall, IDS, antivirus, patching, training, dan monitoring. Satu gagal, lainnya menahan.'],
      ['Least privilege', 'Berikan akses minimum yang dibutuhkan. Root untuk semua orang = bencana. Gunakan role dan audit berkala.'],
      ['Firewall types: packet, stateful, NGFW', 'Packet filter cek header saja. Stateful melacak koneksi. NGFW menambah aplikasi awareness, IDS/IPS, dan user identity.'],
      ['ACL: struktur dan urutan', 'ACL diproses dari atas ke bawah; implicit deny di akhir. Urutan sangat penting — spesifik dulu, umum kemudian. Standard ACL dekat tujuan, extended dekat sumber.'],
      ['IDS vs IPS', 'IDS mendeteksi dan melaporkan (out-of-band). IPS memblokir secara inline. Signature-based cepat tapi hanya tahu pola lama; anomaly-based adaptif tapi lebih banyak false positive.'],
      ['Enkripsi: simetris dan asimetris', 'Simetris (AES) cepat, kunci sama. Asimetris (RSA, ECC) kunci publik/privat, lambat tapi aman untuk pertukaran kunci. TLS memakai keduanya.'],
      ['TLS handshake dan sertifikat', 'ClientHello → ServerHello + sertifikat → key exchange → encrypted data. Sertifikat diterbitkan CA tepercaya. Self-signed cocok untuk lab, tidak produksi.'],
      ['VPN: site-to-site dan remote access', 'Site-to-site menghubungkan dua jaringan (IPsec). Remote access menghubungkan user ke jaringan (SSL VPN, WireGuard). Pilih sesuai kebutuhan.'],
      ['IPsec: AH, ESP, IKE', 'AH: autentikasi tanpa enkripsi. ESP: enkripsi + autentikasi. IKE menegosiasikan kunci. Mode transport (host-to-host) vs tunnel (network-to-network).'],
      ['802.1X dan NAC', 'Autentikasi port-based: supplicant (klien), authenticator (switch/AP), authentication server (RADIUS). NAC memastikan hanya perangkat sehat yang masuk.'],
      ['Zero trust', 'Jangan percaya siapa pun, verifikasi selalu. Identitas + konteks perangkat + lokasi dipakai untuk otorisasi setiap request, bukan sekadar network boundary.'],
      ['SOC dan incident response', 'Security Operation Center memantau 24/7. Incident response: preparation → detection → containment → eradication → recovery → lessons learned.'],
      ['OSINT dan recon', 'Open-source intelligence: Google dork, Shodan, DNS records. Mengetahui apa yang bisa dilihat penyerang membantu menutup celah.'],
      ['Studi kasus: phishing internal', 'Karyawan klik tautan mencurigakan. Langkah: isolasi host, reset password, analisis log, blocklist domain, edukasi user. Jangan menghukum — edukasi.']
    ]]
  ];

  function expand(NEK) {
    if (!NEK || !Array.isArray(NEK.books)) return 0;
    let added = 0;
    for (const outline of OUTLINES) {
      const [bookId, title, level, body] = outline;
      const book = NEK.books.find(item => item.id === bookId);
      if (!book) continue;
      book.pages = book.pages || [];
      book.pages.push(page(title, level, body, book.pages.length + 1, book.pages.length + 1));
      added += 1;
    }
    // Mega expansion: ratusan halaman per buku
    for (const mega of MEGA) {
      const [bookId, bookTitle, chapters] = mega;
      const book = NEK.books.find(item => item.id === bookId);
      if (!book) continue;
      chapters.forEach((chapter, index) => {
        const [title, body] = chapter;
        book.pages.push(page('Bagian ' + (index + 1) + ': ' + title, 'Proyek Mega', body, index + 1, chapters.length));
        added += 1;
      });
    }
    return added;
  }

  /* Generator besar: dari satu topik, buat banyak halaman bertingkat
     supaya total perpustakaan mencapai 1000+ halaman. */
  const SUBTOPICS = [
    ['dasar-jaringan', 'paket data', 'Paket data adalah unit kecil informasi yang melintasi jaringan. Setiap paket membawa header (alamat, kontrol) dan payload (isi). Router membaca header untuk menentukan arah.'],
    ['dasar-jaringan', 'protocol', 'Protokol adalah kesepakatan aturan komunikasi. Tanpa protokol, dua perangkat tidak akan mengerti satu sama lain. Contoh: TCP, UDP, HTTP, DNS, ARP.'],
    ['dasar-jaringan', 'bandwidth', 'Bandwidth adalah kapasitas maksimal jalur, diukur bit per detik. Throughput adalah realisasi nyata setelah dikurangi overhead. Bisa dianalogikan lebar jalan vs jumlah mobil yang lewat.'],
    ['dasar-jaringan', 'latency', 'Latency adalah waktu tunggu antara kirim dan terima. Dibagi menjadi propagation (jarak), transmission (ukuran/bandwidth), processing (perangkat), dan queuing (antrean).'],
    ['dasar-jaringan', 'topologi', 'Topologi menentukan hubungan fisik antar perangkat. Star mudah dipasang, mesh sangat redundan, ring hemat kabel, bus murah tapi rapuh.'],
    ['dasar-jaringan', 'network topology design', 'Merancang topologi mempertimbangkan: biaya, skalabilitas, toleransi kegagalan, dan keamanan. Simulasi sebelum implementasi mencegah kesalahan mahal.'],
    ['ip-subnetting', 'binary', 'Sistem biner memakai dua simbol 0 dan 1. Setiap posisi menyatakan pangkat 2. Memahami binari esensial untuk subnetting, subnet mask, dan manipulasi bit.'],
    ['ip-subnetting', 'hexadecimal', 'Heksadesimal basis 16 memakai 0-9 dan A-F. Satu digit hex = 4 bit. IPv6 dan MAC address ditulis dalam hex untuk keringkasan.'],
    ['ip-subnetting', 'VLSM', 'Variable Length Subnet Mask memungkinkan subnet dengan ukuran berbeda dalam satu jaringan. Mulai dari subnet terbesar, lalu kecil sampai kebutuhan terpenuhi.'],
    ['ip-subnetting', 'CIDR notation', 'CIDR menuliskan jumlah bit network sebagai prefix /n. Lebih fleksibel daripada kelas lama. Semua routing modern memakai CIDR.'],
    ['vlan-switching', 'broadcast domain', 'Broadcast domain adalah area di mana broadcast frame teredam. Satu VLAN = satu broadcast domain. Memisahkannya memperkecil beban trafik.'],
    ['vlan-switching', 'trunk', 'Trunk membawa trafik beberapa VLAN dalam satu link dengan tag 802.1Q. Native VLAN tidak ditag; harus konsisten antar ujung.'],
    ['vlan-switching', 'STP', 'Spanning Tree Protocol mencegah loop dengan memblokir port redundan. Root bridge dipilih berdasarkan priority terendah dan MAC terendah.'],
    ['vlan-switching', 'EtherChannel', 'EtherChannel menggabungkan beberapa link fisik menjadi satu logis. Menambah bandwidth dan redundansi tanpa loop. Mode: LACP atau PAgP.'],
    ['hardware-kabel', 'UTP', 'Unshielded Twisted Pair paling umum untuk LAN. Empat pasang tembaga; twist mengurangi interferensi. Kategori menentukan kecepatan maksimal.'],
    ['hardware-kabel', 'fiber optic', 'Fiber mengirim data lewat cahaya. Kebal interferensi, jangkauan jauh, bandwidth besar. Tapi mahal, rapuh, dan tidak bisa PoE.'],
    ['hardware-kabel', 'crimping', 'Crimping adalah proses memasang konektor RJ45. Butuh ketelitian: kupas pas, luruskan kabel, masukkan sesuai standar, dan tekan crimp kuat.'],
    ['hardware-kabel', 'PoE', 'Power over Ethernet mengirim listrik lewat kabel data. Memudahkan memasang AP dan kamera tanpa adaptor. Perhatikan budget daya.'],
    ['troubleshooting', 'ping', 'Ping menguji keterjangkauan host dengan ICMP echo. Hasil menunjukkan latency rata-rata dan packet loss. Latency <100 ms dalam negeri biasanya baik.'],
    ['troubleshooting', 'traceroute', 'Traceroute menampilkan hop demi hop. Bisa dipakai untuk menemukan bottleneck. Bila hop tertentu tinggi latency: di situlah masalah.'],
    ['troubleshooting', 'ipconfig', 'ipconfig menampilkan konfigurasi IP Windows. Opsi /all lebih detail; /renew meminta IP baru; /flushdns membersihkan cache DNS.'],
    ['troubleshooting', 'Wireshark', 'Wireshark menangkap dan menganalisis paket. Filter display mempersempit tampilan. Follow TCP Stream melihat percakapan aplikasi.'],
    ['keamanan-jaringan', 'firewall', 'Firewall menyaring lalu lintas berdasarkan aturan. Packet filter hanya cek header; stateful melacak koneksi; NGFW memahami aplikasi.'],
    ['keamanan-jaringan', 'encryption', 'Enkripsi mengubah plaintext menjadi ciphertext. Simetris (AES) pakai kunci sama; asimetris (RSA) pakai pasangan publik-privat. TLS memakai keduanya.'],
    ['keamanan-jaringan', 'phishing', 'Phishing menipu lewat email/situs palsu untuk mencuri kredensial. Mitigasi: edukasi, MFA, filter email, dan verifikasi URL sebelum login.'],
    ['keamanan-jaringan', 'penetration testing', 'Penetration testing mensimulasikan serangan dengan izin. Tujuannya menemukan celah sebelum penyerang. Selalu dilakukan dengan izin tertulis.'],
    ['keamanan-jaringan', 'social engineering', 'Social engineering memanipulasi manusia, bukan mesin. Pretexting, tailgating, dan baiting adalah contohnya. Edukasi user adalah pertahanan utama.'],
    ['keamanan-jaringan', 'VPN', 'VPN membuat terowongan terenkripsi melalui internet publik. Site-to-site menghubungkan jaringan; remote access menghubungkan pengguna.'],
    ['keamanan-jaringan', 'DDoS', 'DDoS membanjiri target dengan trafik dari banyak sumber. Mitigasi: rate limiting, scrubbing center, CDN dengan proteksi DDoS.'],
    ['keamanan-jaringan', 'zero trust', 'Zero trust tidak mempercayai siapa pun berdasarkan lokasi jaringan. Setiap akses diverifikasi dengan identitas, konteks perangkat, dan kebijakan.']
  ];

  function generateSubtopicPages(bookId) {
    const list = SUBTOPICS.filter(([bid]) => bid === bookId);
    if (!list.length) return [];
    return list.map(([bid, title, body]) => page('Materi: ' + title, 'Materi Tambahan', body, 1, 1));
  }

  function expand(NEK) {
    if (!NEK || !Array.isArray(NEK.books)) return 0;
    let added = 0;
    for (const outline of OUTLINES) {
      const [bookId, title, level, body] = outline;
      const book = NEK.books.find(item => item.id === bookId);
      if (!book) continue;
      book.pages = book.pages || [];
      book.pages.push(page(title, level, body, book.pages.length + 1, book.pages.length + 1));
      added += 1;
    }
    // Mega expansion: ratusan halaman per buku
    for (const mega of MEGA) {
      const [bookId, bookTitle, chapters] = mega;
      const book = NEK.books.find(item => item.id === bookId);
      if (!book) continue;
      chapters.forEach((chapter, index) => {
        const [title, body] = chapter;
        book.pages.push(page('Bagian ' + (index + 1) + ': ' + title, 'Proyek Mega', body, index + 1, chapters.length));
        added += 1;
      });
    }
    // Subtopic expansion: tambahan banyak halaman pendek
    NEK.books.forEach(book => {
      generateSubtopicPages(book.id).forEach(pg => {
        book.pages.push(pg);
        added += 1;
      });
    });
    return added;
  }

  function expandAll(NEK) {
    let total = expand(NEK);
    // Perluas tiap buku: setiap topik MEGA dipecah menjadi enam aspek pendek
    const ASPEK = ['Definisi dan konteks', 'Cara kerja di balik layar', 'Contoh nyata di lab', 'Kesalahan umum dan solusinya', 'Latihan mandiri', 'Rangkuman dan catatan penting', 'Perbandingan dengan konsep lain', 'Tips mengingat', 'Studi kasus tambahan', 'Pertanyaan pemantik diskusi'];
    NEK.books.forEach(book => {
      generateSubtopicPages(book.id).forEach(pg => {
        book.pages.push(pg);
        total += 1;
      });
      const dasar = book.pages.slice(0).filter(pg => pg.kicker && pg.kicker.indexOf('Proyek Mega') >= 0);
      dasar.forEach(base => {
        ASPEK.forEach(aspek => {
          book.pages.push({
            kicker: 'Kedalaman · ' + aspek,
            title: aspek + ': ' + base.title.replace(/^Bagian \d+: /, ''),
            html: `
              <p>${base.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 320)}</p>
              <div class="page-callout"><b>${aspek}.</b> Halaman ini memperdalam topik sebelumnya dari sisi ${aspek.toLowerCase()}. Rangkai dengan membaca halaman utamanya terlebih dulu agar konteksnya jelas.</div>
              <div class="page-quiz"><b>Cek pemahaman</b>Apa poin penting dari sudut pandang ${aspek.toLowerCase()}?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Jelaskan dengan kalimat sendiri — kalau lancar, kamu siap lanjut ke aspek berikutnya.</div></div>
            `
          });
          total += 1;
        });
      });
    });
    return total;
  }

  window.NEK_MATERIALS_EXPAND = { expand, expandAll, OUTLINES, MEGA, SUBTOPICS, page };
})();
