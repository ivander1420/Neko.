/* ============================================================
   NEKO · data/materials.js
   Katalog buku materi TJKT. Setiap halaman dirender oleh
   js/book.js ke dalam lembar buku dua halaman.
   ============================================================ */
(function () {
  'use strict';

  const icon = name => '<svg class="ic" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';

  const books = [
    {
      id: 'dasar-jaringan',
      title: 'Dasar Jaringan Komputer',
      subtitle: 'Kenali perangkat, topologi, dan cara data berpindah.',
      category: 'Dasar',
      tag: 'Pemula',
      icon: 'network',
      colorA: "color-mix(in oklab, var(--accent) 22%, #08111f)",
      colorB: "color-mix(in oklab, var(--accent) 68%, #08111f)",
      minutes: 14,
      pages: [
        {
          kicker: 'Bab 1 · Pengenalan',
          title: 'Apa itu jaringan komputer?',
          html: `
            <p><strong>Jaringan komputer</strong> adalah kumpulan dua perangkat atau lebih yang saling terhubung agar bisa bertukar data dan berbagi sumber daya seperti file, printer, atau koneksi internet.</p>
            <p>Di balik sebuah video yang berjalan mulus, data dipecah menjadi <strong>paket</strong> kecil. Setiap paket menempuh jalur sendiri, lalu disusun kembali di tujuan. Inilah sebabnya jaringan butuh aturan yang disebut <strong>protokol</strong>.</p>
            <div class="page-callout"><b>Analogi:</b> jaringan seperti sistem pos. Alamat IP adalah alamat rumah, router adalah kantor pos, dan protokol adalah aturan penulisan alamat agar surat sampai dengan benar.</div>
            <figure class="page-figure">
              <svg viewBox="0 0 260 120" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="16" y="40" width="46" height="30" rx="5"/><rect x="106" y="12" width="46" height="30" rx="5"/><rect x="106" y="72" width="46" height="30" rx="5"/><rect x="198" y="40" width="46" height="30" rx="5"/>
                <path d="M62 55h44M152 27h30v28M152 87h30V55"/>
              </svg>
              <figcaption>Empat perangkat berbagi satu jalur komunikasi.</figcaption>
            </figure>
            <div class="page-quiz"><b>Cek pemahaman</b>Mengapa data perlu dipecah menjadi paket?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Agar data bisa dikirim efisien, memakai jalur bersama, dan dikirim ulang hanya bagian yang rusak.</div></div>
          `
        },
        {
          kicker: 'Bab 1 · Jenis jaringan',
          title: 'LAN, MAN, dan WAN',
          html: `
            <ul>
              <li><strong>LAN</strong> (Local Area Network): mencakup satu ruangan, lab, atau gedung. Contohnya jaringan lab TJKT.</li>
              <li><strong>MAN</strong> (Metropolitan Area Network): menghubungkan beberapa lokasi dalam satu kota.</li>
              <li><strong>WAN</strong> (Wide Area Network): mencakup wilayah luas, contohnya internet.</li>
            </ul>
            <table class="page-table"><tr><th>Jenis</th><th>Cakupan</th><th>Contoh</th></tr><tr><td>LAN</td><td>Ruangan–gedung</td><td>Lab komputer</td></tr><tr><td>MAN</td><td>Satu kota</td><td>Jaringan antar-kampus</td></tr><tr><td>WAN</td><td>Antarwilayah</td><td>Internet, MPLS</td></tr></table>
            <div class="page-callout"><b>Ingat:</b> yang membedakan bukan besar kecilnya kabel, tetapi <b>cakupan dan kepemilikan</b> jaringan.</div>
            <p>Selain berdasarkan cakupan, jaringan juga dibedakan berdasarkan peran perangkat: <strong>client–server</strong> (ada server yang melayani) dan <strong>peer-to-peer</strong> (semua perangkat setara).</p>
          `
        },
        {
          kicker: 'Bab 2 · Perangkat',
          title: 'Perangkat yang membangun jaringan',
          html: `
            <ul>
              <li><strong>Switch</strong> — meneruskan frame berdasarkan alamat MAC di dalam LAN.</li>
              <li><strong>Router</strong> — meneruskan paket antarjaringan IP dan memilih jalur terbaik.</li>
              <li><strong>Access Point</strong> — menghubungkan perangkat Wi-Fi ke jaringan kabel.</li>
              <li><strong>NIC</strong> — kartu antarmuka jaringan pada komputer, punya alamat MAC unik.</li>
              <li><strong>Modem</strong> — mengubah sinyal line internet menjadi sinyal jaringan lokal.</li>
            </ul>
            <div class="page-callout"><b>Sering tertukar:</b> switch bekerja di <b>Layer 2</b> dengan MAC, sedangkan router bekerja di <b>Layer 3</b> dengan IP.</div>
            <p>Di lab sekolah, urutan koneksi biasanya: <strong>ISP → modem → router → switch → client</strong>. Access point dan server menempel pada switch.</p>
            <figure class="page-figure"><svg viewBox="0 0 260 100" fill="none" stroke="currentColor" stroke-width="2"><circle cx="30" cy="50" r="16"/><rect x="88" y="34" width="44" height="32" rx="6"/><rect x="172" y="20" width="44" height="20" rx="4"/><rect x="172" y="60" width="44" height="20" rx="4"/><path d="M46 50h42M132 50h20v-20h20M132 50h20v20h20"/></svg><figcaption>Router sebagai pintu antara LAN dan internet.</figcaption></figure>
          `
        },
        {
          kicker: 'Bab 2 · Topologi',
          title: 'Topologi jaringan',
          html: `
            <p><strong>Topologi</strong> adalah susunan hubungan antarperangkat. Pilihan topologi memengaruhi biaya, kemudahan, dan ketahanan jaringan.</p>
            <table class="page-table"><tr><th>Topologi</th><th>Kelebihan</th><th>Kekurangan</th></tr><tr><td>Star</td><td>Mudah dikelola</td><td>Pusat jadi titik gagal</td></tr><tr><td>Bus</td><td>Hemat kabel</td><td>Satu kabel rusak melumpuhkan</td></tr><tr><td>Ring</td><td>Data mengalir teratur</td><td>Gangguan memutus lingkaran</td></tr><tr><td>Mesh</td><td>Sangat andal</td><td>Biaya dan kabel besar</td></tr></table>
            <div class="page-callout"><b>Praktik sekolah:</b> lab TJKT hampir selalu memakai topologi <b>star</b> karena semua client terhubung ke satu switch.</div>
            <p>Topologi fisik menjelaskan kabel dan perangkat nyata. Topologi logis menjelaskan bagaimana data benar-benar mengalir, yang bisa berbeda dari bentuk fisiknya.</p>
          `
        },
        {
          kicker: 'Bab 3 · Cara kerja',
          title: 'Perjalanan sebuah paket',
          html: `
            <ol>
              <li>Kamu membuka sebuah situs. Komputer meminta alamat IP server lewat <strong>DNS</strong>.</li>
              <li>Data dipecah menjadi paket dan diberi alamat IP tujuan.</li>
              <li>Switch meneruskan paket ke router berdasarkan alamat MAC.</li>
              <li>Router memilih jalur menuju internet.</li>
              <li>Server menerima permintaan, lalu mengirim balasan dengan proses sebaliknya.</li>
            </ol>
            <div class="page-callout"><b>Istilah kunci:</b> DNS = buku telepon internet. Gateway = pintu keluar LAN. MAC = alamat fisik perangkat.</div>
            <p>Setiap tahap bisa diperiksa saat troubleshooting: ping untuk keterjangkauan, tracert untuk jalur, dan nslookup untuk DNS.</p>
          `
        },
        {
          kicker: 'Bab 3 · Model',
          title: 'Model OSI dan TCP/IP',
          html: `
            <p>Model <strong>OSI</strong> membagi komunikasi menjadi tujuh lapisan agar mudah dipelajari dan didiagnosis. Model <strong>TCP/IP</strong> menyederhanakannya menjadi empat lapisan yang dipakai internet modern.</p>
            <table class="page-table"><tr><th>OSI</th><th>TCP/IP</th><th>Contoh</th></tr><tr><td>Application, Presentation, Session</td><td>Application</td><td>HTTP, DNS, SSH</td></tr><tr><td>Transport</td><td>Transport</td><td>TCP, UDP</td></tr><tr><td>Network</td><td>Internet</td><td>IP, ICMP, router</td></tr><tr><td>Data Link, Physical</td><td>Network Access</td><td>Ethernet, Wi-Fi, kabel</td></tr></table>
            <div class="page-callout"><b>Tips:</b> saat troubleshooting, periksa dari bawah ke atas: kabel → IP → gateway → DNS → aplikasi.</div>
          `
        },
        {
          kicker: 'Bab 4 · Praktik',
          title: 'Membangun LAN kecil',
          html: `
            <p>Untuk membangun LAN sederhana di lab, siapkan switch, kabel UTP straight, dan komputer dengan NIC. Langkahnya:</p>
            <ol>
              <li>Hubungkan semua komputer ke switch memakai kabel straight.</li>
              <li>Atur IP satu subnet, misalnya <strong>192.168.10.2–254/24</strong>.</li>
              <li>Pasang gateway jika LAN perlu terhubung ke internet.</li>
              <li>Uji dengan <strong>ping</strong> antar-client.</li>
            </ol>
            <div class="page-callout"><b>Perhatian:</b> dua perangkat dengan IP sama akan menyebabkan <b>IP conflict</b> dan koneksi tidak stabil.</div>
            <div class="page-quiz"><b>Cek pemahaman</b>Mengapa client pada LAN kecil tidak memerlukan router?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Karena komunikasi masih dalam satu subnet; router baru dibutuhkan untuk keluar dari LAN.</div></div>
          `
        },
        {
          kicker: 'Rangkuman',
          title: 'Ringkasan bab',
          html: `
            <ul>
              <li>Jaringan = perangkat terhubung + aturan komunikasi.</li>
              <li>LAN, MAN, WAN dibedakan oleh cakupan.</li>
              <li>Switch (MAC) dan router (IP) punya peran berbeda.</li>
              <li>Topologi star paling umum di lab sekolah.</li>
              <li>Model OSI membantu memahami dan menemukan masalah.</li>
            </ul>
            <div class="page-callout"><b>Latihan:</b> buka Arena dan mainkan <b>Network Detective</b> untuk menguji pemahaman dasarmu.</div>
          `
        }
      ]
    },
    {
      id: 'ip-subnetting',
      title: 'IP Address & Subnetting',
      subtitle: 'Hitung network, broadcast, dan host tanpa bingung.',
      category: 'Jaringan',
      tag: 'Wajib',
      icon: 'ip',
      colorA: "color-mix(in oklab, var(--accent-2) 22%, #08111f)",
      colorB: "color-mix(in oklab, var(--accent-2) 68%, #08111f)",
      minutes: 18,
      pages: [
        {
          kicker: 'Bab 1 · Alamat IP',
          title: 'Mengenal IPv4',
          html: `
            <p><strong>IPv4</strong> adalah alamat 32-bit yang ditulis sebagai empat oktet desimal, misalnya <strong>192.168.10.25</strong>. Setiap oktet bernilai 0–255.</p>
            <p>Alamat IP terdiri dari dua bagian: <strong>network</strong> (identitas jaringan) dan <strong>host</strong> (identitas perangkat). Garis pemisahnya ditentukan oleh <strong>subnet mask</strong> atau prefix.</p>
            <table class="page-table"><tr><th>Kelas</th><th>Rentang awal</th><th>Default mask</th></tr><tr><td>A</td><td>1–126</td><td>/8</td></tr><tr><td>B</td><td>128–191</td><td>/16</td></tr><tr><td>C</td><td>192–223</td><td>/24</td></tr></table>
            <div class="page-callout"><b>Alamat privat:</b> 10.0.0.0/8, 172.16.0.0/12, dan 192.168.0.0/16. Alamat ini tidak dirutekan langsung di internet.</div>
          `
        },
        {
          kicker: 'Bab 1 · Biner',
          title: 'Konversi biner dengan cepat',
          html: `
            <p>Subnetting bekerja dalam biner. Hafalkan nilai tempat: <strong>128 64 32 16 8 4 2 1</strong>.</p>
            <p>Contoh: <strong>192 = 128 + 64</strong> → <code>11000000</code>. <strong>168 = 128 + 32 + 8</strong> → <code>10101000</code>.</p>
            <table class="page-table"><tr><th>Desimal</th><th>Biner</th><th>Desimal</th><th>Biner</th></tr><tr><td>192</td><td>11000000</td><td>255</td><td>11111111</td></tr><tr><td>224</td><td>11100000</td><td>240</td><td>11110000</td></tr><tr><td>248</td><td>11111000</td><td>252</td><td>11111100</td></tr></table>
            <div class="page-callout"><b>Triks:</b> jumlah host pada /n adalah <b>2<sup>(32−n)</sup> − 2</b>. Angka 2 dikurangi untuk network dan broadcast.</div>
          `
        },
        {
          kicker: 'Bab 2 · Mask',
          title: 'Subnet mask dan prefix',
          html: `
            <p>Prefix <strong>/24</strong> berarti 24 bit pertama adalah network. Mask-nya <strong>255.255.255.0</strong>. Sisa 8 bit dipakai untuk host.</p>
            <table class="page-table"><tr><th>Prefix</th><th>Mask</th><th>Host usable</th></tr><tr><td>/24</td><td>255.255.255.0</td><td>254</td></tr><tr><td>/25</td><td>255.255.255.128</td><td>126</td></tr><tr><td>/26</td><td>255.255.255.192</td><td>62</td></tr><tr><td>/27</td><td>255.255.255.224</td><td>30</td></tr><tr><td>/28</td><td>255.255.255.240</td><td>14</td></tr><tr><td>/30</td><td>255.255.255.252</td><td>2</td></tr></table>
            <div class="page-callout"><b>Blok subnet:</b> 256 − nilai oktet mask. Contoh /26 → 256 − 192 = <b>64</b>. Subnet kelipatan 64.</div>
          `
        },
        {
          kicker: 'Bab 2 · Perhitungan',
          title: 'Menghitung /26 langkah demi langkah',
          html: `
            <p>Alamat <strong>192.168.10.90/26</strong>. Mask /26 = 255.255.255.192, blok = 64.</p>
            <ol>
              <li>Subnet: 0, 64, 128, 192. Alamat .90 jatuh di subnet <strong>192.168.10.64</strong>.</li>
              <li>Broadcast = subnet berikutnya − 1 = <strong>192.168.10.127</strong>.</li>
              <li>Host usable = .65 sampai .126 → <strong>62 host</strong>.</li>
            </ol>
            <div class="page-callout"><b>Rumus cepat:</b> broadcast = network + block − 1. Host pertama = network + 1. Host terakhir = broadcast − 1.</div>
            <div class="page-quiz"><b>Latihan</b>Berapa network dari 192.168.10.200/26?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">192.168.10.192, broadcast .255, host .193–.254.</div></div>
          `
        },
        {
          kicker: 'Bab 3 · Desain',
          title: 'Memilih prefix sesuai kebutuhan',
          html: `
            <p>Mulai dari jumlah host yang dibutuhkan, lalu pilih prefix terkecil yang masih mencukupi.</p>
            <table class="page-table"><tr><th>Kebutuhan</th><th>Prefix</th><th>Host</th></tr><tr><td>50 host</td><td>/26</td><td>62</td></tr><tr><td>100 host</td><td>/25</td><td>126</td></tr><tr><td>250 host</td><td>/24</td><td>254</td></tr><tr><td>2 host (point-to-point)</td><td>/30</td><td>2</td></tr></table>
            <div class="page-callout"><b>Aturan praktis:</b> sediakan cadangan 20–30% alamat untuk pertumbuhan perangkat.</div>
            <p>Untuk sekolah, pisahkan subnet per ruang: lab, perpustakaan, kantor, dan Wi-Fi tamu. Pemisahan ini memudahkan keamanan dan troubleshooting.</p>
          `
        },
        {
          kicker: 'Bab 3 · VLSM',
          title: 'VLSM: subnet bertingkat',
          html: `
            <p><strong>VLSM</strong> (Variable Length Subnet Mask) memakai prefix berbeda pada satu blok besar agar alamat tidak terbuang.</p>
            <p>Contoh dari 192.168.20.0/24: lab butuh 100 host (/25), kantor 50 host (/26), Wi-Fi tamu 25 host (/27), dan link router /30.</p>
            <ol>
              <li>Urutkan kebutuhan dari terbesar ke terkecil.</li>
              <li>Beri subnet berurutan sesuai blok.</li>
              <li>Sisakan ruang untuk pertumbuhan.</li>
            </ol>
            <div class="page-callout"><b>Hati-hati:</b> VLSM menuntut routing yang benar. Pastikan tabel rute tidak tumpang tindih.</div>
          `
        },
        {
          kicker: 'Bab 4 · Praktik',
          title: 'IP statis vs DHCP',
          html: `
            <p><strong>IP statis</strong> diatur manual dan cocok untuk server, printer, serta perangkat jaringan. <strong>DHCP</strong> memberikan IP otomatis kepada client.</p>
            <ul>
              <li>Server dan perangkat infrastruktur → statis.</li>
              <li>Laptop, ponsel, dan komputer siswa → DHCP.</li>
              <li>Gunakan DHCP reservation untuk perangkat yang perlu alamat tetap.</li>
            </ul>
            <div class="page-callout"><b>Gejala DHCP gagal:</b> client mendapat alamat <b>169.254.x.x</b> (APIPA). Periksa kabel, VLAN, dan pool DHCP.</div>
          `
        },
        {
          kicker: 'Rangkuman',
          title: 'Ringkasan dan latihan',
          html: `
            <ul>
              <li>IP = network + host, dipisahkan mask/prefix.</li>
              <li>Host usable = 2<sup>(32−prefix)</sup> − 2.</li>
              <li>Blok subnet = 256 − oktet mask.</li>
              <li>VLSM menghemat alamat dengan prefix berbeda.</li>
            </ul>
            <div class="page-callout"><b>Latihan:</b> coba game <b>Subnet Master</b> di Arena untuk berlatih menghitung network dan broadcast.</div>
          `
        }
      ]
    },
    {
      id: 'vlan-switching',
      title: 'VLAN & Switching',
      subtitle: 'Pisahkan jaringan secara logis di satu switch.',
      category: 'Jaringan',
      tag: 'Lanjutan',
      icon: 'switch',
      colorA: "color-mix(in oklab, var(--success) 22%, #08111f)",
      colorB: "color-mix(in oklab, var(--success) 68%, #08111f)",
      minutes: 15,
      pages: [
        {
          kicker: 'Bab 1 · Dasar',
          title: 'Mengapa perlu VLAN?',
          html: `
            <p>Satu switch tanpa VLAN membentuk satu <strong>broadcast domain</strong>. Semakin banyak perangkat, semakin ramai lalu lintas broadcast dan semakin longgar keamanannya.</p>
            <p><strong>VLAN</strong> membagi satu switch menjadi beberapa jaringan logis. Guru, siswa, dan server bisa berada di switch yang sama tetapi tidak saling melihat pada Layer 2.</p>
            <div class="page-callout"><b>Manfaat:</b> segmentasi, keamanan, pengurangan broadcast, dan pengelolaan yang lebih rapi.</div>
            <figure class="page-figure"><svg viewBox="0 0 260 110" fill="none" stroke="currentColor" stroke-width="2"><rect x="90" y="44" width="80" height="34" rx="5"/><text x="112" y="66" font-size="10" stroke="none" fill="currentColor">SWITCH</text><path d="M60 26v18M60 26h20M200 26v18M200 26h-20M60 96v-18M60 96h20M200 96v-18M200 96h-20"/><circle cx="60" cy="20" r="6"/><circle cx="200" cy="20" r="6"/><circle cx="60" cy="102" r="6"/><circle cx="200" cy="102" r="6"/></svg><figcaption>Dua VLAN pada satu perangkat switch.</figcaption></figure>
          `
        },
        {
          kicker: 'Bab 1 · Istilah',
          title: 'Access port dan trunk port',
          html: `
            <ul>
              <li><strong>Access port</strong> terhubung ke perangkat akhir dan membawa satu VLAN. Contoh: port ke PC siswa.</li>
              <li><strong>Trunk port</strong> membawa banyak VLAN antar-switch atau ke router. Frame diberi tag <strong>802.1Q</strong>.</li>
              <li><strong>Native VLAN</strong> adalah VLAN yang framenya tidak diberi tag pada trunk.</li>
            </ul>
            <div class="page-callout"><b>Konfigurasi VLAN di switch:</b><br><code>switchport mode access</code> + <code>switchport access vlan 10</code> untuk access; <code>switchport mode trunk</code> untuk trunk. Sintaks dapat berbeda tiap merek perangkat.</div>
            <p>Kesalahan umum adalah menaruh PC di trunk port atau salah menetapkan native VLAN, sehingga VLAN bocor.</p>
          `
        },
        {
          kicker: 'Bab 2 · Routing',
          title: 'Komunikasi antar-VLAN',
          html: `
            <p>Perangkat di VLAN berbeda tidak bisa berkomunikasi langsung di Layer 2. Dibutuhkan <strong>routing Layer 3</strong>, yaitu:</p>
            <ul>
              <li><strong>Router-on-a-stick</strong> — satu interface router dengan subinterface per VLAN.</li>
              <li><strong>Layer 3 switch</strong> — switch melakukan routing antar-VLAN dengan SVI.</li>
            </ul>
            <div class="page-callout"><b>Ingat:</b> setiap VLAN idealnya punya subnet IP sendiri. VLAN 10 → 192.168.10.0/24, VLAN 20 → 192.168.20.0/24.</div>
            <p>Gateway untuk tiap VLAN adalah alamat interface router/SVI, misalnya .1 pada masing-masing subnet.</p>
          `
        },
        {
          kicker: 'Bab 2 · VLAN ID',
          title: 'Rentang dan praktik penomoran',
          html: `
            <table class="page-table"><tr><th>Rentang</th><th>Keterangan</th></tr><tr><td>1</td><td>VLAN default, sebaiknya tidak dipakai untuk data</td></tr><tr><td>2–1001</td><td>VLAN normal</td></tr><tr><td>1002–1005</td><td>Cadangan lama (Token Ring/FDDI)</td></tr><tr><td>1006–4094</td><td>VLAN extended</td></tr></table>
            <p>Buat rencana penomoran sebelum konfigurasi. Contoh: 10 manajemen, 20 guru, 30 siswa, 40 server, 50 tamu, 99 native.</p>
            <div class="page-callout"><b>Kebersihan:</b> beri nama VLAN, dokumentasikan port, dan hapus VLAN yang tidak dipakai.</div>
          `
        },
        {
          kicker: 'Bab 3 · Keamanan',
          title: 'VLAN hopping dan pencegahannya',
          html: `
            <p><strong>VLAN hopping</strong> adalah upaya berpindah VLAN tanpa izin, umumnya lewat penyalahgunaan trunk atau double tagging.</p>
            <ul>
              <li>Matikan port yang tidak dipakai dan pindahkan ke VLAN parkir.</li>
              <li>Jangan gunakan VLAN 1 sebagai native VLAN.</li>
              <li>Set access port secara eksplisit, jangan biarkan auto.</li>
              <li>Aktifkan port security untuk membatasi MAC.</li>
            </ul>
            <div class="page-callout"><b>Prinsip:</b> segmentasi VLAN bukan pengganti firewall. Aturan antar-VLAN tetap perlu dikontrol di Layer 3.</div>
          `
        },
        {
          kicker: 'Bab 4 · Praktik',
          title: 'Skenario lab sekolah',
          html: `
            <p>Sebuah sekolah memiliki satu switch 24 port. Rencananya:</p>
            <table class="page-table"><tr><th>VLAN</th><th>Nama</th><th>Port</th></tr><tr><td>10</td><td>Guru</td><td>1–6</td></tr><tr><td>20</td><td>Siswa</td><td>7–18</td></tr><tr><td>30</td><td>Server</td><td>19–20</td></tr><tr><td>99</td><td>Native</td><td>trunk</td></tr></table>
            <p>Aktifkan trunk ke router pada port 24, lalu buat subinterface router untuk tiap VLAN.</p>
            <div class="page-callout"><b>Uji:</b> ping dari VLAN 20 ke gateway VLAN 20 harus berhasil; ping ke VLAN 30 hanya jika aturan routing mengizinkan.</div>
          `
        },
        {
          kicker: 'Rangkuman',
          title: 'Ringkasan bab',
          html: `
            <ul>
              <li>VLAN memisahkan broadcast domain secara logis.</li>
              <li>Access port satu VLAN, trunk membawa banyak VLAN.</li>
              <li>Antar-VLAN butuh routing Layer 3.</li>
              <li>Amankan trunk dan port yang tidak terpakai.</li>
            </ul>
          `
        }
      ]
    },
    {
      id: 'hardware-kabel',
      title: 'Hardware & Kabel',
      subtitle: 'Dari konektor RJ45 sampai crimping yang rapi.',
      category: 'Praktik',
      tag: 'Praktik',
      icon: 'cable',
      colorA: "color-mix(in oklab, var(--warn) 22%, #08111f)",
      colorB: "color-mix(in oklab, var(--warn) 68%, #08111f)",
      minutes: 12,
      pages: [
        {
          kicker: 'Bab 1 · Media',
          title: 'Kabel UTP dan kategori',
          html: `
            <p><strong>UTP</strong> (Unshielded Twisted Pair) terdiri dari empat pasang kabel yang dipilin untuk mengurangi interferensi. Konektornya <strong>RJ45</strong>.</p>
            <table class="page-table"><tr><th>Kategori</th><th>Kecepatan</th><th>Jarak</th></tr><tr><td>Cat5e</td><td>1 Gbps</td><td>100 m</td></tr><tr><td>Cat6</td><td>1–10 Gbps</td><td>55–100 m</td></tr><tr><td>Cat6a</td><td>10 Gbps</td><td>100 m</td></tr></table>
            <div class="page-callout"><b>Jarak maksimum</b> kabel UTP Ethernet adalah <b>100 meter</b> per segmen. Lebih dari itu gunakan switch perantara atau fiber.</div>
            <p>STP memiliki pelindung tambahan untuk area banyak interferensi, sedangkan FTP memakai foil. Keduanya lebih kaku dan mahal.</p>
          `
        },
        {
          kicker: 'Bab 1 · Urutan',
          title: 'Urutan warna T568A dan T568B',
          html: `
            <p>Standar pemasangan RJ45 yang umum di Indonesia adalah <strong>T568B</strong>:</p>
            <ol><li>Putih–oranye</li><li>Oranye</li><li>Putih–hijau</li><li>Biru</li><li>Putih–biru</li><li>Hijau</li><li>Putih–cokelat</li><li>Cokelat</li></ol>
            <div class="page-callout"><b>Straight-through:</b> T568B di kedua ujung. <b>Crossover:</b> T568A satu ujung, T568B ujung lain. Untuk perangkat modern, banyak port sudah Auto-MDIX.</div>
            <p>T568A menukar pasangan oranye dan hijau: putih-hijau, hijau, putih-oranye, biru, putih-biru, oranye, putih-cokelat, cokelat.</p>
          `
        },
        {
          kicker: 'Bab 2 · Alat',
          title: 'Alat kerja dan fungsinya',
          html: `
            <ul>
              <li><strong>Crimping tool</strong> — menekan pin RJ45 ke kabel.</li>
              <li><strong>LAN tester</strong> — memeriksa urutan dan kontinuitas 8 pin.</li>
              <li><strong>Tang potong &amp; stripper</strong> — memotong dan mengupas jaket kabel.</li>
              <li><strong>Punch-down tool</strong> — memasang kabel ke patch panel atau keystone.</li>
              <li><strong>Multimeter / cable certifier</strong> — pengujian lanjutan.</li>
            </ul>
            <div class="page-callout"><b>Keselamatan:</b> jangan crimp kabel yang masih terhubung ke perangkat aktif. Lepaskan dulu dari port.</div>
          `
        },
        {
          kicker: 'Bab 2 · Langkah',
          title: 'Langkah crimping yang benar',
          html: `
            <ol>
              <li>Ukur kabel dan kupas jaket sekitar 2 cm.</li>
              <li>Susun delapan kabel sesuai T568B, rapikan dan ratakan ujungnya.</li>
              <li>Masukkan ke konektor RJ45 sampai terlihat di ujung.</li>
              <li>Tekan crimping tool hingga klik.</li>
              <li>Uji kedua ujung dengan LAN tester.</li>
            </ol>
            <div class="page-callout"><b>Tanda gagal:</b> lampu tester tidak berurutan 1–8, atau ada pin yang mati. Potong dan pasang ulang konektornya.</div>
            <div class="page-quiz"><b>Cek pemahaman</b>Mengapa jaket kabel tidak boleh masuk terlalu dalam ke konektor?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Karena pin tidak akan menyentuh konduktor dengan benar; jaket harus tepat di belakang pin, bukan menutupi kabel.</div></div>
          `
        },
        {
          kicker: 'Bab 3 · Fiber',
          title: 'Fiber optik: single-mode dan multi-mode',
          html: `
            <p><strong>Fiber optik</strong> mengirim data sebagai pulsa cahaya. Ia tahan interferensi elektromagnetik dan mampu menempuh jarak jauh.</p>
            <table class="page-table"><tr><th>Jenis</th><th>Inti</th><th>Jarak umum</th></tr><tr><td>Single-mode</td><td>±9 µm</td><td>Puluhan km</td></tr><tr><td>Multi-mode</td><td>50/62,5 µm</td><td>Ratusan meter</td></tr></table>
            <div class="page-callout"><b>Konektor umum:</b> LC, SC, ST. Warna kabel patchcord membantu membedakan jenis serta mode.</div>
            <p>Jangan menatap ujung fiber aktif secara langsung. Cahaya laser tidak terlihat dan dapat melukai mata.</p>
          `
        },
        {
          kicker: 'Bab 3 · Perangkat',
          title: 'Hardware jaringan lain',
          html: `
            <ul>
              <li><strong>Patch panel</strong> merapikan terminasi kabel dari ruang kerja.</li>
              <li><strong>Keystone jack</strong> menjadi titik terminasi di dinding.</li>
              <li><strong>PoE injector/switch</strong> mengirim daya lewat kabel Ethernet untuk AP atau kamera IP.</li>
              <li><strong>Rack server</strong> menyusun perangkat dengan sirkulasi udara yang baik.</li>
            </ul>
            <div class="page-callout"><b>Manajemen kabel:</b> gunakan velcro, beri label kedua ujung, dan hindari tekukan tajam pada fiber.</div>
          `
        },
        {
          kicker: 'Rangkuman',
          title: 'Ringkasan praktik',
          html: `
            <ul>
              <li>UTP Cat5e/6 dengan RJ45 untuk Ethernet.</li>
              <li>T568B: putih-oranye, oranye, putih-hijau, biru, putih-biru, hijau, putih-cokelat, cokelat.</li>
              <li>Maksimal 100 meter per segmen tembaga.</li>
              <li>Selalu uji dengan LAN tester.</li>
            </ul>
            <div class="page-callout"><b>Latihan:</b> coba game <b>Cable Master</b> di Arena untuk menyusun urutan kabel.</div>
          `
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting Jaringan',
      subtitle: 'Diagnosis sistematis dari gejala ke solusi.',
      category: 'Praktik',
      tag: 'Penting',
      icon: 'wrench',
      colorA: "color-mix(in oklab, var(--danger) 22%, #08111f)",
      colorB: "color-mix(in oklab, var(--danger) 68%, #08111f)",
      minutes: 16,
      pages: [
        {
          kicker: 'Bab 1 · Metode',
          title: 'Urutan diagnosis yang benar',
          html: `
            <p>Troubleshooting yang baik bergerak dari <strong>gejala → bukti → hipotesis → uji → solusi</strong>. Jangan menebak.</p>
            <ol>
              <li>Tanyakan: apa yang berubah dan sejak kapan?</li>
              <li>Periksa layer terbawah: daya, kabel, lampu port.</li>
              <li>Uji IP, gateway, DNS, lalu aplikasi.</li>
              <li>Ubah satu variabel per langkah dan catat hasilnya.</li>
            </ol>
            <div class="page-callout"><b>Prinsip:</b> satu perubahan, satu pengujian. Jika mengubah banyak hal sekaligus, kamu tidak akan tahu mana yang memperbaiki masalah.</div>
          `
        },
        {
          kicker: 'Bab 1 · Perintah',
          title: 'Perintah diagnosis penting',
          html: `
            <table class="page-table"><tr><th>Perintah</th><th>Fungsi</th></tr><tr><td><code>ipconfig</code></td><td>Melihat IP, mask, gateway</td></tr><tr><td><code>ping</code></td><td>Menguji keterjangkauan host</td></tr><tr><td><code>tracert</code></td><td>Melihat jalur paket</td></tr><tr><td><code>nslookup</code></td><td>Menguji resolusi DNS</td></tr><tr><td><code>netstat</code></td><td>Melihat koneksi aktif</td></tr></table>
            <div class="page-callout"><b>Urutan ping:</b> loopback 127.0.0.1 → IP sendiri → gateway → DNS (8.8.8.8) → nama domain.</div>
            <p>Jika ping IP berhasil tetapi nama domain gagal, masalahnya biasanya di DNS. Jika gateway gagal, periksa kabel, VLAN, atau konfigurasi IP.</p>
          `
        },
        {
          kicker: 'Bab 2 · Kasus',
          title: 'Tidak mendapat IP (APIPA)',
          html: `
            <p>Gejala: komputer mendapat alamat <strong>169.254.x.x</strong> dan tidak bisa mengakses jaringan.</p>
            <ul>
              <li>Periksa kabel dan lampu link pada NIC/switch.</li>
              <li>Pastikan port berada di VLAN yang memiliki DHCP.</li>
              <li>Periksa pool DHCP masih tersedia.</li>
              <li>Jika DHCP di server lain VLAN, pastikan DHCP relay dikonfigurasi.</li>
            </ul>
            <div class="page-callout"><b>APIPA artinya:</b> client gagal menghubungi DHCP, lalu memberi alamat diri sendiri. Ini bukan alamat yang bisa dirutekan.</div>
          `
        },
        {
          kicker: 'Bab 2 · Kasus',
          title: 'Wi-Fi terhubung tetapi tidak ada internet',
          html: `
            <p>Langkah diagnosis:</p>
            <ol>
              <li>Catat SSID, kanal, dan kekuatan sinyal (RSSI).</li>
              <li>Periksa IP yang diterima client.</li>
              <li>Ping gateway Wi-Fi.</li>
              <li>Ping 8.8.8.8, lalu uji DNS dengan nslookup.</li>
              <li>Bandingkan dengan perangkat lain di SSID yang sama.</li>
            </ol>
            <div class="page-callout"><b>Pola umum:</b> sinyal lemah, IP bentrok, DNS salah, captive portal, atau uplink AP terputus.</div>
            <p>Jika hanya satu perangkat bermasalah, fokus pada perangkat itu. Jika semua perangkat di SSID sama bermasalah, periksa AP dan uplink-nya.</p>
          `
        },
        {
          kicker: 'Bab 3 · Kasus',
          title: 'Kabel dan port bermasalah',
          html: `
            <ul>
              <li>Lampu link mati → periksa kabel, konektor, dan port.</li>
              <li>Kecepatan turun ke 100 Mbps → kemungkinan pin rusak atau kabel Cat5.</li>
              <li>Koneksi putus-putus → konektor longgar, kabel tertekuk, atau interferensi.</li>
              <li>Duplex mismatch → setting paksa pada satu sisi dan auto pada sisi lain.</li>
            </ul>
            <div class="page-callout"><b>Alat bantu:</b> LAN tester memastikan urutan pin; cable certifier mengukur kualitas dan panjang kabel.</div>
          `
        },
        {
          kicker: 'Bab 3 · Dokumentasi',
          title: 'Mencatat dan belajar dari insiden',
          html: `
            <p>Setiap gangguan sebaiknya dicatat: waktu, gejala, perangkat terdampak, perubahan terakhir, tindakan, dan hasil.</p>
            <ul>
              <li>Buat <strong>tiket</strong> dengan prioritas yang jelas.</li>
              <li>Simpan bukti (screenshot, log, hasil ping).</li>
              <li>Tuliskan akar masalah, bukan hanya solusi.</li>
            </ul>
            <div class="page-callout"><b>Manfaat:</b> dokumentasi mempercepat penyelesaian kasus serupa dan membantu tim belajar.</div>
          `
        },
        {
          kicker: 'Rangkuman',
          title: 'Ringkasan diagnosis',
          html: `
            <ul>
              <li>Diagnosis sistematis dari layer bawah ke atas.</li>
              <li>ipconfig, ping, tracert, nslookup adalah dasar.</li>
              <li>APIPA = DHCP gagal.</li>
              <li>Ubah satu variabel per pengujian.</li>
              <li>Catat dan dokumentasikan.</li>
            </ul>
            <div class="page-callout"><b>Latihan:</b> mainkan <b>Network Detective</b> dan <b>Reaction Fix</b> di Arena.</div>
          `
        }
      ]
    },
    {
      id: 'keamanan-jaringan',
      title: 'Keamanan Jaringan Dasar',
      subtitle: 'Lindungi akun, perangkat, dan data sekolah.',
      category: 'Keamanan',
      tag: 'Penting',
      icon: 'shield',
      colorA: "color-mix(in oklab, var(--accent-3) 22%, #08111f)",
      colorB: "color-mix(in oklab, var(--accent-3) 68%, #08111f)",
      minutes: 13,
      pages: [
        {
          kicker: 'Bab 1 · Prinsip',
          title: 'CIA Triad',
          html: `
            <p>Keamanan informasi berdiri di atas tiga prinsip:</p>
            <ul>
              <li><strong>Confidentiality</strong> — hanya pihak berwenang yang bisa membaca data.</li>
              <li><strong>Integrity</strong> — data tidak berubah tanpa izin.</li>
              <li><strong>Availability</strong> — data dan layanan tersedia saat dibutuhkan.</li>
            </ul>
            <div class="page-callout"><b>Contoh:</b> enkripsi melindungi confidentiality; checksum melindungi integrity; backup dan redundansi melindungi availability.</div>
            <p>Keamanan bukan produk tunggal, melainkan proses berlapis: kebijakan, konfigurasi, pemantauan, dan kebiasaan pengguna.</p>
          `
        },
        {
          kicker: 'Bab 1 · Akun',
          title: 'Password, MFA, dan PIN',
          html: `
            <p>Gunakan password panjang dan unik. Jangan memakai ulang password antar-layanan.</p>
            <ul>
              <li>Aktifkan <strong>MFA</strong> jika tersedia.</li>
              <li>Gunakan password manager, bukan catatan tempel.</li>
              <li>PIN perangkat sebaiknya tidak mudah ditebak dan tidak dibagikan.</li>
            </ul>
            <div class="page-callout"><b>Di NEKO:</b> PIN disimpan sebagai hash PBKDF2 di perangkat. Server tidak pernah menerima PIN asli.</div>
            <p>Password seperti "123456" atau tanggal lahir sangat mudah ditebak. Gunakan frasa panjang yang unik.</p>
          `
        },
        {
          kicker: 'Bab 2 · Jaringan',
          title: 'Ancaman umum di jaringan sekolah',
          html: `
            <ul>
              <li><strong>Phishing</strong> — tautan atau halaman palsu untuk mencuri akun.</li>
              <li><strong>Sniffing</strong> — penyadapan lalu lintas, terutama di Wi-Fi terbuka.</li>
              <li><strong>ARP spoofing</strong> — penyerang memalsukan identitas di LAN.</li>
              <li><strong>Rogue AP</strong> — access point tidak sah yang menipu pengguna.</li>
              <li><strong>Malware</strong> — perangkat lunak berbahaya dari unduhan tidak jelas.</li>
            </ul>
            <div class="page-callout"><b>Pertahanan dasar:</b> WPA2/WPA3, segmentasi VLAN, pembaruan perangkat, dan edukasi pengguna.</div>
          `
        },
        {
          kicker: 'Bab 2 · Wi-Fi',
          title: 'Mengamankan Wi-Fi sekolah',
          html: `
            <ol>
              <li>Gunakan WPA2-AES atau WPA3, hindari WEP dan WPS.</li>
              <li>Pisahkan SSID guru, siswa, dan tamu lewat VLAN.</li>
              <li>Ganti password admin default perangkat.</li>
              <li>Matikan manajemen jarak jauh yang tidak perlu.</li>
              <li>Perbarui firmware access point secara berkala.</li>
            </ol>
            <div class="page-callout"><b>Jaringan tamu</b> sebaiknya hanya memiliki akses internet, tanpa akses ke perangkat dan server internal.</div>
          `
        },
        {
          kicker: 'Bab 3 · Data',
          title: 'Backup dan enkripsi',
          html: `
            <p>Aturan backup <strong>3-2-1</strong>: tiga salinan data, di dua media berbeda, dengan satu salinan di luar lokasi.</p>
            <ul>
              <li>Uji proses pemulihan, bukan hanya membuat backup.</li>
              <li>Enkripsi data sensitif saat disimpan dan dikirim (HTTPS).</li>
              <li>Batasi akses berdasarkan kebutuhan (least privilege).</li>
            </ul>
            <div class="page-callout"><b>Kesalahan umum:</b> backup hanya di satu disk yang sama dengan data asli. Jika disk rusak, semuanya hilang.</div>
          `
        },
        {
          kicker: 'Bab 3 · Insiden',
          title: 'Jika terjadi insiden',
          html: `
            <ol>
              <li>Putuskan perangkat yang terinfeksi dari jaringan.</li>
              <li>Jangan mematikan bukti; catat gejala dan waktu.</li>
              <li>Laporkan ke guru/admin sesuai prosedur.</li>
              <li>Ganti kredensial yang mungkin bocor.</li>
              <li>Pulihkan dari backup yang bersih, lalu perbaiki akar masalah.</li>
            </ol>
            <div class="page-callout"><b>Jangan:</b> menyembunyikan insiden karena takut dimarahi. Pelaporan cepat mengurangi kerusakan.</div>
          `
        },
        {
          kicker: 'Rangkuman',
          title: 'Ringkasan keamanan',
          html: `
            <ul>
              <li>CIA: confidentiality, integrity, availability.</li>
              <li>Password unik + MFA + update rutin.</li>
              <li>WPA2/WPA3 dan segmentasi VLAN.</li>
              <li>Backup 3-2-1 dan uji pemulihan.</li>
              <li>Laporkan insiden dengan cepat.</li>
            </ul>
          `
        }
      ]
    }
  ];

  window.NEK_MATERIALS = { books: books, icon: icon };
  if (!window.NEK_MATERIALS_EXPANDED && window.NEK_MATERIALS_EXPAND && typeof window.NEK_MATERIALS_EXPAND.expandAll === 'function') {
    window.NEK_MATERIALS_EXPANDED = true;
    const tambahan = window.NEK_MATERIALS_EXPAND.expandAll(window.NEK_MATERIALS);
    if (tambahan) console.info('[neko] materi tambahan: +' + tambahan + ' halaman');
  }
})();
