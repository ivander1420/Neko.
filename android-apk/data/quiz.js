/* ============================================================
   NEKO · data/quiz.js
   Bank soal TJKT untuk Kuis Arena, Network Challenge, dan
   latihan harian. Semua jawaban memakai indeks opsi.
   ============================================================ */
(function () {
  'use strict';

  const questions = [
    { q: 'Apa fungsi utama DNS?', o: ['Memberi daya pada switch', 'Menerjemahkan nama domain menjadi alamat IP', 'Mengatur kapasitas RAM', 'Mencetak dokumen'], a: 1, e: 'DNS memetakan nama domain seperti neko.sch.id ke alamat IP.', level: 'Mudah', topic: 'Layanan' },
    { q: 'DHCP berfungsi untuk…', o: ['Memberikan konfigurasi IP secara otomatis', 'Membuat kabel jaringan', 'Mengubah resolusi layar', 'Menghapus file sementara'], a: 0, e: 'DHCP membagikan IP, subnet mask, gateway, dan DNS kepada client.', level: 'Mudah', topic: 'Layanan' },
    { q: 'Perangkat yang meneruskan paket antarjaringan berbeda adalah…', o: ['Switch', 'Hub', 'Router', 'Printer'], a: 2, e: 'Router bekerja pada Layer 3 dan meneruskan paket berdasarkan alamat IP.', level: 'Mudah', topic: 'Perangkat' },
    { q: 'Layer OSI yang menangani alamat IP adalah…', o: ['Physical', 'Data Link', 'Network', 'Application'], a: 2, e: 'IP, routing, dan ICMP berada pada layer Network (Layer 3).', level: 'Mudah', topic: 'OSI' },
    { q: 'Port standar HTTPS adalah…', o: ['21', '53', '80', '443'], a: 3, e: 'HTTPS memakai port 443; HTTP memakai port 80.', level: 'Mudah', topic: 'Layanan' },
    { q: 'Kabel fiber optik mengirim data menggunakan…', o: ['Pulsa cahaya', 'Gelombang suara', 'Aliran air', 'Panas'], a: 0, e: 'Fiber optik memakai pulsa cahaya di dalam inti kaca.', level: 'Mudah', topic: 'Media' },
    { q: 'Prefix /24 menyediakan host usable sebanyak…', o: ['24', '62', '126', '254'], a: 3, e: '2^(32−24) − 2 = 254 host usable.', level: 'Mudah', topic: 'Subnetting' },
    { q: 'Alamat 169.254.x.x pada komputer biasanya menunjukkan…', o: ['DHCP gagal', 'DNS sangat cepat', 'Router aktif', 'Fiber putus'], a: 0, e: 'APIPA diberikan ketika client tidak berhasil memperoleh lease DHCP.', level: 'Sedang', topic: 'Troubleshooting' },
    { q: 'Alamat MAC bekerja pada layer…', o: ['Physical', 'Data Link', 'Network', 'Transport'], a: 1, e: 'MAC address digunakan oleh switch pada Data Link (Layer 2).', level: 'Mudah', topic: 'OSI' },
    { q: 'Topologi yang menghubungkan semua perangkat ke satu switch pusat disebut…', o: ['Bus', 'Ring', 'Star', 'Mesh'], a: 2, e: 'Topologi star memusatkan koneksi pada switch atau hub.', level: 'Mudah', topic: 'Topologi' },
    { q: 'Kabel UTP Cat5e memiliki jarak maksimum sekitar…', o: ['10 meter', '50 meter', '100 meter', '1 kilometer'], a: 2, e: 'Ethernet di atas UTP memiliki batas 100 meter per segmen.', level: 'Mudah', topic: 'Media' },
    { q: 'Urutan warna T568B yang benar diawali dengan…', o: ['Putih-oranye', 'Putih-hijau', 'Oranye', 'Biru'], a: 0, e: 'T568B dimulai putih-oranye, oranye, putih-hijau, biru, dan seterusnya.', level: 'Sedang', topic: 'Media' },
    { q: 'VLAN berfungsi untuk…', o: ['Segmentasi jaringan secara logis', 'Menambah RAM', 'Mengganti monitor', 'Membuat backup'], a: 0, e: 'VLAN memisahkan broadcast domain secara logis pada switch.', level: 'Mudah', topic: 'VLAN' },
    { q: 'Port yang membawa banyak VLAN antar-switch disebut…', o: ['Access port', 'Trunk port', 'Console port', 'Mirror port'], a: 1, e: 'Trunk port membawa frame bertag 802.1Q dari banyak VLAN.', level: 'Sedang', topic: 'VLAN' },
    { q: 'Perintah Windows untuk melihat konfigurasi IP adalah…', o: ['ipconfig', 'mkdir', 'format', 'clear'], a: 0, e: 'ipconfig menampilkan alamat IP, mask, dan gateway.', level: 'Mudah', topic: 'Troubleshooting' },
    { q: 'Jika ping ke IP berhasil tetapi nama domain gagal, kemungkinan masalahnya…', o: ['Kabel putus', 'DNS', 'Monitor', 'Keyboard'], a: 1, e: 'Resolusi nama gagal berarti DNS bermasalah, bukan konektivitas IP.', level: 'Sedang', topic: 'Troubleshooting' },
    { q: 'Subnet mask /26 dalam bentuk desimal adalah…', o: ['255.255.255.0', '255.255.255.128', '255.255.255.192', '255.255.255.224'], a: 2, e: '/26 = 11111111.11111111.11111111.11000000 = 255.255.255.192.', level: 'Sedang', topic: 'Subnetting' },
    { q: 'Alamat 192.168.10.90/26 berada pada network…', o: ['192.168.10.0', '192.168.10.64', '192.168.10.90', '192.168.10.128'], a: 1, e: 'Blok /26 adalah 64; alamat .90 berada pada subnet .64.', level: 'Sedang', topic: 'Subnetting' },
    { q: 'Broadcast dari 192.168.10.90/26 adalah…', o: ['192.168.10.63', '192.168.10.127', '192.168.10.128', '192.168.10.255'], a: 1, e: 'Network .64 + block 64 − 1 = .127.', level: 'Sedang', topic: 'Subnetting' },
    { q: 'Jumlah host usable pada prefix /27 adalah…', o: ['14', '30', '62', '126'], a: 1, e: '2^(32−27) − 2 = 30 host.', level: 'Sedang', topic: 'Subnetting' },
    { q: 'Alamat privat IPv4 berikut yang benar adalah…', o: ['8.8.8.8', '192.168.10.5', '203.0.113.10', '1.1.1.1'], a: 1, e: '192.168.0.0/16 termasuk rentang privat RFC 1918.', level: 'Mudah', topic: 'IP' },
    { q: 'Port SSH adalah…', o: ['21', '22', '25', '443'], a: 1, e: 'SSH menggunakan port 22 untuk akses jarak jauh yang terenkripsi.', level: 'Mudah', topic: 'Layanan' },
    { q: 'Protokol yang menjamin pengiriman data dengan handshake adalah…', o: ['UDP', 'TCP', 'ICMP', 'ARP'], a: 1, e: 'TCP memakai three-way handshake dan menjamin urutan data.', level: 'Sedang', topic: 'Protokol' },
    { q: 'APIPA berada pada rentang…', o: ['10.0.0.0/8', '127.0.0.0/8', '169.254.0.0/16', '224.0.0.0/4'], a: 2, e: 'APIPA memakai 169.254.0.0/16 ketika DHCP tidak tersedia.', level: 'Sedang', topic: 'IP' },
    { q: 'Perangkat yang bekerja pada Layer 2 dan mempelajari MAC address adalah…', o: ['Router', 'Switch', 'Modem', 'Repeater'], a: 1, e: 'Switch membangun MAC address table untuk meneruskan frame.', level: 'Mudah', topic: 'Perangkat' },
    { q: 'Gateway berfungsi sebagai…', o: ['Pintu keluar menuju jaringan lain', 'Alamat cadangan DHCP', 'Nama perangkat', 'Protokol enkripsi'], a: 0, e: 'Gateway adalah alamat interface router yang menjadi pintu keluar subnet.', level: 'Mudah', topic: 'IP' },
    { q: 'Model TCP/IP memiliki berapa lapisan?', o: ['3', '4', '5', '7'], a: 1, e: 'TCP/IP memiliki Application, Transport, Internet, dan Network Access.', level: 'Mudah', topic: 'OSI' },
    { q: 'DNS record yang memetakan nama ke alamat IPv4 adalah…', o: ['AAAA', 'A', 'MX', 'CNAME'], a: 1, e: 'Record A memetakan nama domain ke alamat IPv4.', level: 'Sedang', topic: 'Layanan' },
    { q: 'WPA3 adalah standar untuk…', o: ['Keamanan Wi-Fi', 'Kabel fiber', 'Alamat IP', 'Routing'], a: 0, e: 'WPA3 adalah standar keamanan nirkabel generasi terbaru.', level: 'Mudah', topic: 'Keamanan' },
    { q: 'Prinsip backup 3-2-1 berarti…', o: ['3 salinan, 2 media, 1 di luar lokasi', '3 server, 2 router, 1 switch', '3 hari, 2 jam, 1 menit', '3 admin, 2 password, 1 PIN'], a: 0, e: 'Aturan 3-2-1 menjaga data tetap pulih saat terjadi kerusakan.', level: 'Sedang', topic: 'Keamanan' },
    { q: 'Serangan yang memalsukan identitas di LAN melalui protokol alamat fisik disebut…', o: ['ARP spoofing', 'Phishing', 'DDoS', 'SQL injection'], a: 0, e: 'ARP spoofing memalsukan pemetaan IP–MAC untuk menyadap lalu lintas.', level: 'Sulit', topic: 'Keamanan' },
    { q: 'VLSM bertujuan untuk…', o: ['Menghemat alamat IP', 'Mempercepat kabel', 'Menambah VLAN', 'Menghapus routing'], a: 0, e: 'VLSM memakai prefix berbeda sesuai kebutuhan host agar alamat tidak terbuang.', level: 'Sulit', topic: 'Subnetting' },
    { q: 'Native VLAN pada trunk sebaiknya…', o: ['VLAN 1', 'VLAN yang tidak dipakai untuk data', 'VLAN server', 'VLAN tamu'], a: 1, e: 'Gunakan VLAN khusus yang tidak dipakai data untuk mengurangi risiko VLAN hopping.', level: 'Sulit', topic: 'VLAN' },
    { q: 'Perintah tracert digunakan untuk…', o: ['Melihat jalur paket menuju tujuan', 'Menghapus cache DNS', 'Mengubah IP', 'Membuat folder'], a: 0, e: 'tracert menampilkan hop router yang dilalui paket.', level: 'Mudah', topic: 'Troubleshooting' },
    { q: 'NIC memiliki alamat unik yang disebut…', o: ['IP address', 'MAC address', 'Subnet mask', 'Gateway'], a: 1, e: 'MAC address adalah alamat fisik yang dibakar pada NIC.', level: 'Mudah', topic: 'Perangkat' },
    { q: 'Straight-through cable memakai urutan…', o: ['T568A di kedua ujung', 'T568B di kedua ujung', 'T568A dan T568B', 'Bebas'], a: 1, e: 'Kabel straight memakai standar yang sama di kedua ujung, umumnya T568B.', level: 'Sedang', topic: 'Media' },
    { q: 'Perangkat PoE switch berguna untuk…', o: ['Mengirim daya lewat kabel Ethernet', 'Mempercepat CPU', 'Menyimpan log', 'Membuat VLAN'], a: 0, e: 'PoE mengirim daya dan data melalui satu kabel Ethernet.', level: 'Sedang', topic: 'Perangkat' },
    { q: 'Langkah pertama troubleshooting yang baik adalah…', o: ['Mengganti semua perangkat', 'Mengumpulkan gejala dan bukti', 'Menghapus konfigurasi', 'Mematikan server'], a: 1, e: 'Diagnosis dimulai dari gejala dan bukti, bukan menebak.', level: 'Mudah', topic: 'Troubleshooting' },
    { q: 'Alamat loopback IPv4 adalah…', o: ['0.0.0.0', '127.0.0.1', '255.255.255.255', '192.168.1.1'], a: 1, e: '127.0.0.1 menguji stack TCP/IP lokal tanpa jaringan fisik.', level: 'Mudah', topic: 'IP' },
    { q: 'Keamanan yang memastikan data tidak diubah tanpa izin disebut…', o: ['Confidentiality', 'Integrity', 'Availability', 'Scalability'], a: 1, e: 'Integrity menjaga keutuhan dan ketepatan data.', level: 'Sedang', topic: 'Keamanan' }
  ];

  window.NEK_QUIZ = { questions: questions };
})();
