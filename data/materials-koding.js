/* ============================================================
   NEKO · data/materials-koding.js
   Buku materi pemrograman: HTML, CSS, JavaScript, Python, logika.
   Ditambahkan ke katalog perpustakaan yang dibuat data/materials.js.
   ============================================================ */
(function () {
  'use strict';

  const books = [
    /* ---------- Buku 1: HTML ---------- */
    {
      id: 'html-dasar',
      title: 'HTML untuk Pemula',
      subtitle: 'Susun halaman web dari teks sampai struktur.',
      category: 'Koding',
      tag: 'Pemula',
      icon: 'scroll',
      colorA: "color-mix(in oklab, var(--accent) 22%, #08111f)",
      colorB: "color-mix(in oklab, var(--accent) 68%, #08111f)",
      minutes: 16,
      pages: [
        {
          kicker: 'Bab 1 · Pengenalan',
          title: 'Apa itu HTML?',
          html: `
            <p><strong>HTML</strong> (HyperText Markup Language) bukan bahasa pemrograman, melainkan bahasa markah. Ia memberi tanda pada teks lewat <em>tag</em> agar browser tahu mana judul, paragraf, atau gambar.</p>
            <p>Browser membaca file dari atas ke bawah, mengubah tag menjadi struktur pohon bernama <strong>DOM</strong>, lalu menampilkannya. Satu tag yang dibuka harus selalu ditutup.</p>
            <pre class="page-code" data-label="contoh"><code>&lt;p&gt;Halo, ini tugas TJKT.&lt;/p&gt;</code></pre>
            <div class="page-flow"><span>Teks HTML</span><i>→</i><span>Parser browser</span><i>→</i><span>DOM</span><i>→</i><span>Halaman tampil</span></div>
            <div class="page-callout"><b>Analogi:</b> HTML itu rangka bangunan, CSS cat dan hiasannya, JavaScript listrik dan sakelarnya.</div>
          `
        },
        {
          kicker: 'Bab 1 · Anatomi',
          title: 'Tag, elemen, dan atribut',
          html: `
            <p>Sebuah <strong>elemen</strong> terdiri dari tag pembuka, isi, dan tag penutup. <strong>Atribut</strong> menambah informasi pada tag pembuka, selalu ditulis sebagai pasangan nama dan nilai.</p>
            <pre class="page-code" data-label="tag"><code>&lt;a href="https://sekolah.sch.id"&gt;Kembali ke sekolah&lt;/a&gt;</code></pre>
            <table class="page-table"><tr><th>Istilah</th><th>Contoh</th><th>Fungsi</th></tr><tr><td>Tag pembuka</td><td>&lt;p&gt;</td><td>Mulai elemen</td></tr><tr><td>Tag penutup</td><td>&lt;/p&gt;</td><td>Akhiri elemen</td></tr><tr><td>Atribut</td><td>class="x"</td><td>Data tambahan</td></tr></table>
            <div class="page-callout"><b>Penulisan:</b> nilai atribut sebaiknya diapit tanda kutip agar tidak error saat mengandung spasi.</div>
          `
        },
        {
          kicker: 'Bab 2 · Struktur',
          title: 'Kerangka dokumen',
          html: `
            <p>Setiap halaman punya kerangka tetap. <strong>doctype</strong> memberi tahu browser ini HTML5, elemen <strong>html</strong> membungkus semuanya, <strong>head</strong> berisi pengaturan, dan <strong>body</strong> berisi yang terlihat.</p>
            <pre class="page-code" data-label="index.html"><code>&lt;!DOCTYPE html&gt;
&lt;html lang="id"&gt;
  &lt;head&gt;
    &lt;meta charset="UTF-8"&gt;
    &lt;title&gt;Tugas Ku&lt;/title&gt;
  &lt;/head&gt;
  &lt;body&gt;
    &lt;h1&gt;Halo TJKT&lt;/h1&gt;
  &lt;/body&gt;
&lt;/html&gt;</code></pre>
            <div class="page-quiz"><b>Cek pemahaman</b>Apa bedanya head dan body?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Head berisi metadata yang tidak langsung tampil; body berisi konten yang dilihat pengguna.</div></div>
            <div class="page-callout"><b>Tip:</b> tambahkan meta viewport agar halaman rapi dibuka lewat ponsel di lab.</div>
          `
        },
        {
          kicker: 'Bab 2 · Teks',
          title: 'Heading, paragraf, dan daftar',
          html: `
            <p>Judul memakai <strong>h1</strong> sampai <strong>h6</strong> dengan h1 paling penting. Paragraf memakai <strong>p</strong>. Daftar memakai <strong>ul</strong> untuk butir tak berurutan dan <strong>ol</strong> untuk langkah bernomor.</p>
            <pre class="page-code" data-label="teks"><code>&lt;h1&gt;Profil Saya&lt;/h1&gt;
&lt;p&gt;Siswa XI TJKT 2.&lt;/p&gt;
&lt;ul&gt;&lt;li&gt;Jaringan&lt;/li&gt;&lt;li&gt;Koding&lt;/li&gt;&lt;/ul&gt;</code></pre>
            <div class="page-cols">
              <div><strong>ul</strong><p>Butir tanpa urutan, seperti daftar hobi.</p></div>
              <div><strong>ol</strong><p>Bernomor otomatis, cocok untuk langkah crimping.</p></div>
            </div>
            <div class="page-callout"><b>Hati-hati:</b> jangan lompat level, misal dari h1 langsung ke h4. Urutan heading membantu pembaca layar.</div>
          `
        },
        {
          kicker: 'Bab 3 · Tautan & Gambar',
          title: 'Menyisipkan tautan dan gambar',
          html: `
            <p>Tautan dibuat dengan <strong>a</strong> dan atribut <strong>href</strong>. Gambar memakai <strong>img</strong> dengan <strong>src</strong> (lokasi file) dan <strong>alt</strong> (teks pengganti).</p>
            <pre class="page-code" data-label="media"><code>&lt;a href="kontak.html"&gt;Kontak&lt;/a&gt;
&lt;img src="logo.png" alt="Logo sekolah" width="120"&gt;</code></pre>
            <table class="page-table"><tr><th>Atribut</th><th>Fungsi</th></tr><tr><td>href</td><td>Alamat tujuan tautan</td></tr><tr><td>target</td><td>Membuka di tab baru (_blank)</td></tr><tr><td>src</td><td>Sumber gambar</td></tr><tr><td>alt</td><td>Teks saat gambar gagal</td></tr></table>
            <div class="page-callout"><b>Selalu isi alt.</b> Selain membantu saat koneksi lambat, alt dibaca oleh pembaca layar dan mesin pencari.</div>
          `
        },
        {
          kicker: 'Bab 3 · Tabel',
          title: 'Menampilkan data berkolom',
          html: `
            <p>Tabel untuk <strong>data</strong>, bukan untuk menata letak. Baris memakai <strong>tr</strong>, sel kepala <strong>th</strong>, dan sel isi <strong>td</strong>.</p>
            <pre class="page-code" data-label="tabel"><code>&lt;table&gt;
  &lt;tr&gt;&lt;th&gt;No&lt;/th&gt;&lt;th&gt;Nama&lt;/th&gt;&lt;/tr&gt;
  &lt;tr&gt;&lt;td&gt;1&lt;/td&gt;&lt;td&gt;Andi&lt;/td&gt;&lt;/tr&gt;
&lt;/table&gt;</code></pre>
            <ul class="page-check">
              <li>Gunakan thead untuk kepala dan tbody untuk isi.</li>
              <li>Beri atribut scope pada th agar jelas ia kepala kolom.</li>
              <li>Hindari tabel terlalu lebar di layar ponsel.</li>
            </ul>
            <div class="page-quiz"><b>Cek pemahaman</b>Kapan th digunakan?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Untuk sel judul yang menjelaskan isi kolom atau baris, biasanya di baris paling atas.</div></div>
          `
        },
        {
          kicker: 'Bab 4 · Form',
          title: 'Mengumpulkan input pengguna',
          html: `
            <p><strong>Form</strong> mengumpulkan data dari pengguna. Atribut <strong>action</strong> menentukan tujuan kirim dan <strong>method</strong> menentukan caranya (GET atau POST).</p>
            <pre class="page-code" data-label="form"><code>&lt;form action="kirim" method="post"&gt;
  &lt;label for="nama"&gt;Nama&lt;/label&gt;
  &lt;input id="nama" name="nama" type="text"&gt;
  &lt;button type="submit"&gt;Kirim&lt;/button&gt;
&lt;/form&gt;</code></pre>
            <ul>
              <li><strong>type="number"</strong> — hanya menerima angka.</li>
              <li><strong>type="password"</strong> — ketikan tersamar.</li>
              <li><strong>type="email"</strong> — memeriksa format alamat.</li>
            </ul>
            <div class="page-callout"><b>Hubungkan label</b> ke input lewat atribut for yang sama dengan id input; ini penting untuk aksesibilitas.</div>
          `
        },
        {
          kicker: 'Bab 5 · Semantik',
          title: 'Halaman profil dengan tag semantik',
          html: `
            <p>Tag <strong>semantik</strong> menjelaskan makna bagian halaman, bukan hanya tampilannya: <strong>header</strong>, <strong>nav</strong>, <strong>main</strong>, <strong>section</strong>, dan <strong>footer</strong>. Atribut <strong>aria-label</strong> memberi nama pada tombol yang hanya berupa ikon.</p>
            <pre class="page-code" data-label="profil.html"><code>&lt;main class="profil"&gt;
  &lt;img src="foto.jpg" alt="Foto Andi"&gt;
  &lt;h1&gt;Andi&lt;/h1&gt;
  &lt;p&gt;Siswa XI TJKT 2&lt;/p&gt;
  &lt;a href="mailto:andi@sekolah.sch.id"&gt;Email&lt;/a&gt;
&lt;/main&gt;</code></pre>
            <figure class="page-figure">
              <svg viewBox="0 0 260 110" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="20" y="12" width="220" height="20" rx="4"/><rect x="20" y="38" width="60" height="46" rx="4"/><rect x="86" y="38" width="154" height="46" rx="4"/><rect x="20" y="90" width="220" height="14" rx="4"/>
              </svg>
              <figcaption>Wilayah header, nav, main, dan footer pada halaman.</figcaption>
            </figure>
            <div class="page-callout"><b>Proyek:</b> gabungkan doctype, heading, gambar, dan tautan menjadi satu halaman profil, lalu buka di browser dengan menekan <span class="page-key">F5</span>.</div>
          `
        },
        {
          kicker: 'Rangkuman',
          title: 'Ringkasan bab',
          html: `
            <p>Ringkasan cepat poin penting dari bab HTML.</p>
            <ul>
              <li>HTML menandai teks; browser mengubahnya menjadi DOM.</li>
              <li>Elemen = tag pembuka + isi + penutup; atribut menambah info.</li>
              <li>Kerangka wajib: doctype, html, head, body.</li>
              <li>Teks, tautan, gambar, tabel, dan form adalah konten dasar.</li>
              <li>Tag semantik serta alt dan aria membuat halaman lebih ramah.</li>
            </ul>
            <div class="page-callout"><b>Lanjut:</b> buka buku <b>CSS Menghias Halaman</b> untuk mewarnai halaman profilmu, lalu adu paham di Arena.</div>
          `
        }
      ]
    },
    /* ---------- Buku 2: CSS ---------- */
    {
      id: 'css-dasar',
      title: 'CSS Menghias Halaman',
      subtitle: 'atur warna, tata letak, dan gerak dengan CSS.',
      category: 'Koding',
      tag: 'Wajib',
      icon: 'palette',
      colorA: "color-mix(in oklab, var(--accent-2) 22%, #08111f)",
      colorB: "color-mix(in oklab, var(--accent-2) 68%, #08111f)",
      minutes: 17,
      pages: [
        {
          kicker: 'Bab 1 · Selector',
          title: 'Selector dan spesifisitas',
          html: `
            <p>CSS memakai aturan: <em>selector</em> memilih elemen, lalu blok deklarasi memberi sifatnya. Titik memilih class, pagar memilih id. Saat dua aturan bentrok, yang lebih <strong>spesifik</strong> menang: id lebih kuat dari class, class lebih kuat dari tag.</p>
            <pre class="page-code" data-label="style.css"><code>h1 { color: navy; }
.teks { color: red; }
#logo { width: 80px; }</code></pre>
            <table class="page-table"><tr><th>Bobot</th><th>Contoh</th><th>Kuasa</th></tr><tr><td>id</td><td>#logo</td><td>paling tinggi</td></tr><tr><td>class</td><td>.teks</td><td>sedang</td></tr><tr><td>tag</td><td>h1</td><td>paling rendah</td></tr></table>
            <div class="page-quiz"><b>Cek pemahaman</b>Mana yang lebih menentukan, class atau tag?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Class, karena class lebih spesifik daripada tag, jadi warna dari class yang dipakai.</div></div>
            <div class="page-callout"><b>Kebiasaan baik:</b> pakai class untuk styling dan simpan id untuk penanda unik, jangan sering memakai tanda seru penting.</div>
          `
        },
        {
          kicker: 'Bab 2 · Box Model',
          title: 'Kotak elemen',
          html: `
            <p>Setiap elemen adalah kotak berlapis: <strong>isi</strong> (content), <strong>padding</strong> (jarak dalam), <strong>border</strong> (garis tepi), dan <strong>margin</strong> (jarak luar ke tetangga).</p>
            <pre class="page-code" data-label="kotak"><code>.kartu {
  padding: 12px;
  border: 2px solid navy;
  margin: 8px;
  box-sizing: border-box;
}</code></pre>
            <figure class="page-figure">
              <svg viewBox="0 0 260 100" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="8" y="8" width="244" height="84" rx="4"/><rect x="34" y="26" width="192" height="48" rx="4"/><rect x="58" y="38" width="144" height="24" rx="3"/>
              </svg>
              <figcaption>Dari luar ke dalam: margin, border, padding, lalu konten.</figcaption>
            </figure>
            <div class="page-callout"><b>Box sizing:</b> atur border-box agar lebar tetap termasuk padding dan border, sehingga tata letak tidak bergeser.</div>
          `
        },
        {
          kicker: 'Bab 2 · Warna & Tipografi',
          title: 'Warna, satuan, dan huruf',
          html: `
            <p>Warna bisa ditulis nama, kode heks, atau fungsi. Satuan panjang populer adalah <strong>px</strong>, <strong>rem</strong> (relatif ke ukuran dasar), dan <strong>%</strong>.</p>
            <pre class="page-code" data-label="tampilan"><code>body {
  background: #08111f;
  color: white;
  font-size: 16px;
  font-weight: 600;
}</code></pre>
            <table class="page-table"><tr><th>Satuan</th><th>Cocok untuk</th></tr><tr><td>px</td><td>garis tipis, radius</td></tr><tr><td>rem</td><td>ukuran teks, jarak</td></tr><tr><td>%</td><td>lebar terhadap induk</td></tr></table>
            <div class="page-callout"><b>Kontras:</b> teks terang di atas latar gelap harus tetap terbaca; jangan pakai warna pucat untuk huruf kecil.</div>
          `
        },
        {
          kicker: 'Bab 3 · Flexbox',
          title: 'Menata satu baris',
          html: `
            <p><strong>Flexbox</strong> menata anak sejajar satu arah, cocok untuk navbar atau baris kartu yang bisa menyusut. Induk diberi <strong>display: flex</strong>.</p>
            <pre class="page-code" data-label="flex"><code>.bar {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
}</code></pre>
            <ul>
              <li><strong>justify-content</strong> mengatur sumbu utama.</li>
              <li><strong>align-items</strong> mengatur sumbu silang.</li>
              <li><strong>gap</strong> memberi jarak antar anak tanpa margin tambahan.</li>
            </ul>
            <div class="page-callout"><b>Flex-wrap:</b> tambahkan wrap agar anak turun ke baris baru saat ruang menyempit.</div>
          `
        },
        {
          kicker: 'Bab 3 · Grid',
          title: 'Tata letak dua arah',
          html: `
            <p><strong>Grid</strong> menata dalam kolom dan baris sekaligus, pas untuk deret kartu materi di perpustakaan.</p>
            <pre class="page-code" data-label="grid"><code>.rak {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}</code></pre>
            <div class="page-quiz"><b>Cek pemahaman</b>Apa arti satuan fr pada lebar kolom?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">fr adalah pecahan ruang yang tersisa, jadi tiga 1fr membagi wadah jadi tiga kolom sama besar.</div></div>
            <div class="page-callout"><b>Grid vs Flex:</b> pakai flex untuk satu arah (baris), pakai grid untuk dua arah (kolom dan baris sekaligus).</div>
          `
        },
        {
          kicker: 'Bab 4 · Posisi',
          title: 'Posisi dan overflow',
          html: `
            <p>Sifat <strong>position</strong> mengatur letak elemen: <strong>relative</strong> digeser dari posisi asal, <strong>absolute</strong> lepas terhadap induk ber-position, dan <strong>fixed</strong> menempel di layar.</p>
            <pre class="page-code" data-label="posisi"><code>.badge { position: absolute; top: 8px; right: 8px; }
.wrapper { position: relative; }</code></pre>
            <ul>
              <li><strong>z-index</strong> menentukan mana tampil di depan.</li>
              <li><strong>overflow: hidden</strong> menyembunyikan isi yang melewati kotak.</li>
              <li><strong>overflow: auto</strong> menambah gulir bila isi terlalu panjang.</li>
            </ul>
            <div class="page-callout"><b>Contoh nyata:</b> label buku yang menempel di pojok cover memakai absolute di dalam cover yang relative.</div>
          `
        },
        {
          kicker: 'Bab 4 · Variabel',
          title: 'Variabel CSS dan tema gelap',
          html: `
            <p>Simpan warna berulang sebagai <strong>variabel</strong> di dalam <strong>:root</strong> agar mudah diganti satu kali saat berganti tema.</p>
            <pre class="page-code" data-label="tema"><code>:root { --accent: #38bdf8; }
.kartu {
  color: var(--accent);
  background: color-mix(in oklab, var(--accent) 22%, #08111f);
}</code></pre>
            <ul>
              <li>Nama variabel selalu diawali dua garis pisah.</li>
              <li>Tema cukup ubah nilai di :root, seluruh halaman ikut berubah.</li>
            </ul>
            <div class="page-quiz"><b>Cek pemahaman</b>Kenapa warna sebaiknya disimpan sebagai variabel?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Agar cukup diganti satu kali di :root saat berganti tema, tanpa harus mengubah banyak aturan.</div></div>
            <div class="page-callout"><b>color-mix:</b> menggabungkan dua warna dengan takaran persentase, seperti pada cover buku NEKO ini.</div>
          `
        },
        {
          kicker: 'Bab 5 · Gerak & Responsif',
          title: 'Gerak halus dan tampilan menyesuaikan',
          html: `
            <p><strong>Transisi</strong> memperhalus perubahan satu sifat seperti warna saat kursor masuk, sementara <strong>animasi</strong> menjalankan rangkaian lewat keyframes. Matikan keduanya saat <strong>prefers-reduced-motion</strong> aktif demi kenyamanan pengguna.</p>
            <pre class="page-code" data-label="gerak"><code>.btn { transition: background .2s ease; }
.btn:hover { background: var(--accent); }
@media (prefers-reduced-motion: reduce) {
  .btn { transition: none; }
}</code></pre>
            <p>Agar halaman rapi di semua ukuran, gunakan <strong>media query</strong> dan satuan <strong>clamp</strong> untuk teks yang tumbuh mulus.</p>
            <pre class="page-code" data-label="media"><code>h1 { font-size: clamp(1.2rem, 4vw, 2rem); }
@media (max-width: 600px) {
  .rak { grid-template-columns: 1fr; }
}</code></pre>
            <div class="page-callout"><b>Uji di lab:</b> tekan <span class="page-key">F12</span> lalu ubah lebar jendela untuk melihat tata letak menyesuaikan diri.</div>
          `
        },
        {
          kicker: 'Rangkuman',
          title: 'Ringkasan bab',
          html: `
            <p>Ringkasan cepat dari bab CSS.</p>
            <ul>
              <li>Selector memilih elemen; spesifisitas menentukan pemenang.</li>
              <li>Box model: content, padding, border, margin.</li>
              <li>Flex untuk satu arah, grid untuk dua arah.</li>
              <li>Variabel :root memudahkan tema dan color-mix.</li>
              <li>Media query dan clamp membuat halaman responsif.</li>
            </ul>
            <div class="page-callout"><b>Lanjut:</b> tambahkan aksi lewat buku <b>JavaScript Interaktif</b>, lalu coba menghias kartu di Arena.</div>
          `
        }
      ]
    },
    /* ---------- Buku 3: JavaScript ---------- */
    {
      id: 'javascript-dasar',
      title: 'JavaScript Interaktif',
      subtitle: 'Buat halaman bereaksi terhadap aksi pengguna.',
      category: 'Koding',
      tag: 'Interaktif',
      icon: 'zap',
      colorA: "color-mix(in oklab, var(--warn) 22%, #08111f)",
      colorB: "color-mix(in oklab, var(--warn) 68%, #08111f)",
      minutes: 18,
      pages: [
        {
          kicker: 'Bab 1 · Dasar',
          title: 'Variabel dan tipe data',
          html: `
            <p>JavaScript menjalankan logika di browser. Simpan nilai dengan <strong>const</strong> untuk hal yang tidak berubah dan <strong>let</strong> untuk yang berubah.</p>
            <pre class="page-code" data-label="js"><code>const nama = "Andi";
let poin = 0;
const aktif = true;
poin = poin + 10;
console.log(nama, poin);</code></pre>
            <table class="page-table"><tr><th>Tipe</th><th>Contoh</th></tr><tr><td>string</td><td>"tjkt"</td></tr><tr><td>number</td><td>42</td></tr><tr><td>boolean</td><td>true</td></tr><tr><td>null</td><td>kosong yang disengaja</td></tr></table>
            <div class="page-callout"><b>Kebiasaan:</b> mulai dengan const, baru ganti ke let bila memang perlu mengubah nilai.</div>
          `
        },
        {
          kicker: 'Bab 1 · Operator',
          title: 'Operator dan kondisi',
          html: `
            <p>Operator membandingkan dan menggabungkan nilai. Percabangan <strong>if</strong> memilih langkah berdasarkan kondisi yang benar.</p>
            <pre class="page-code" data-label="kondisi"><code>if (poin &gt;= 75) {
  label = "lulus";
} else {
  label = "mengulang";
}</code></pre>
            <ul>
              <li><strong>===</strong> membandingkan nilai dan tipe, hindari ==.</li>
              <li><strong>&amp;&amp;</strong> dan <strong>||</strong> menggabungkan kondisi.</li>
              <li><strong>!</strong> membalik nilai benar.</li>
            </ul>
            <div class="page-callout"><b>Tips:</b> gunakan === agar angka dan teks tidak tertukar; 0 dan "0" dianggap berbeda.</div>
          `
        },
        {
          kicker: 'Bab 2 · Perulangan',
          title: 'Mengulang langkah',
          html: `
            <p>Perulangan menjalankan blok yang sama berkali-kali. <strong>for</strong> cocok saat jumlah ulangan diketahui, <strong>while</strong> saat yang tahu kondisi berhenti.</p>
            <pre class="page-code" data-label="ulangi"><code>for (let i = 1; i &lt;= 5; i++) {
  console.log("Baris " + i);
}</code></pre>
            <ul>
              <li><strong>i++</strong> menaikkan pencacah tiap putaran.</li>
              <li>Jangan lupa batasnya, kalau tidak perulangan jalan terus.</li>
            </ul>
            <div class="page-quiz"><b>Cek pemahaman</b>Berapa kali blok for di atas berjalan?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Lima kali, saat i bernilai 1 sampai 5.</div></div>
            <div class="page-callout"><b>Hati-hati:</b> while tanpa kondisi berhenti membuat program macet total.</div>
          `
        },
        {
          kicker: 'Bab 2 · Fungsi',
          title: 'Fungsi dan fungsi panah',
          html: `
            <p><strong>Fungsi</strong> menyimpan blok yang bisa dipanggil ulang. <strong>Fungsi panah</strong> adalah bentuk ringkas untuk perhitungan sederhana.</p>
            <pre class="page-code" data-label="fungsi"><code>function sapa(nama) {
  return "Halo, " + nama;
}
kaliDua = (n) =&gt; n * 2;
console.log(sapa("Siswa"), kaliDua(6));</code></pre>
            <ul>
              <li><strong>return</strong> mengirim hasil keluar dari fungsi.</li>
              <li>Parameter menerima masukan saat fungsi dipanggil.</li>
            </ul>
            <div class="page-callout"><b>Manfaat:</b> fungsi membuat kode tidak diulang dan mudah diuji satu per satu.</div>
          `
        },
        {
          kicker: 'Bab 3 · Array',
          title: 'Mengelola daftar data',
          html: `
            <p><strong>Array</strong> menyimpan banyak nilai dalam satu variabel. Metode bawaan memudahkan mengubah daftar tanpa loop manual.</p>
            <pre class="page-code" data-label="array"><code>const nilai = [80, 65, 90];
nilai.push(70);
const lulus = nilai.filter((n) =&gt; n &gt;= 75);
console.log(lulus);</code></pre>
            <table class="page-table"><tr><th>Metode</th><th>Hasil</th></tr><tr><td>map</td><td>daftar baru hasil olahan</td></tr><tr><td>filter</td><td>daftar yang lolos syarat</td></tr><tr><td>find</td><td>satu item pertama yang cocok</td></tr><tr><td>push</td><td>menambah di akhir</td></tr></table>
            <div class="page-callout"><b>Pilhan umum:</b> map untuk mengubah bentuk, filter untuk menyaring, find untuk mencari satu.</div>
          `
        },
        {
          kicker: 'Bab 3 · Objek',
          title: 'Objek dan destrukturisasi',
          html: `
            <p><strong>Objek</strong> menyimpan pasangan kunci dan nilai. Destrukturisasi mengambil beberapa properti sekaligus ke variabel.</p>
            <pre class="page-code" data-label="objek"><code>const siswa = { nama: "Andi", kelas: "XI TJKT 2" };
const { nama, kelas } = siswa;
console.log(nama, kelas);</code></pre>
            <ul>
              <li>Akses lewat titik, misal siswa.nama.</li>
              <li>Akses dinamis lewat kurung, misal siswa["kelas"].</li>
            </ul>
            <div class="page-quiz"><b>Cek pemahaman</b>Apa itu destrukturisasi?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Mengambil beberapa properti objek sekaligus ke variabel baru dengan nama yang sama.</div></div>
            <div class="page-callout"><b>Kegunaan:</b> objek cocok mewakili satu hal nyata, misalnya buku materi dengan judul, kategori, dan halaman.</div>
          `
        },
        {
          kicker: 'Bab 4 · DOM & Event',
          title: 'Mengubah halaman dan merespons aksi',
          html: `
            <p>DOM adalah perwakilan halaman yang bisa diubah lewat <strong>querySelector</strong>. Ubah isi dengan <strong>textContent</strong> atau <strong>classList</strong>, lalu pasang <strong>addEventListener</strong> agar halaman merespons klik.</p>
            <pre class="page-code" data-label="dom"><code>const kotak = document.querySelector(".kartu");
kotak.textContent = "Berhasil dimuat";
kotak.addEventListener("click", () =&gt; {
  kotak.classList.toggle("aktif");
});</code></pre>
            <div class="page-flow"><span>Aksi</span><i>→</i><span>Event</span><i>→</i><span>Function</span><i>→</i><span>Ubah DOM</span></div>
            <ul>
              <li>querySelectorAll mengambil semua elemen yang cocok.</li>
              <li>CustomEvent mengirim pesan buatan sendiri antarbagian aplikasi.</li>
            </ul>
            <div class="page-callout"><b>Aman:</b> pakai textContent untuk masukan pengguna, hindari innerHTML. <b>Delegasi:</b> dengarkan satu induk untuk banyak anak agar lebih hemat.</div>
          `
        },
        {
          kicker: 'Bab 5 · Penyimpanan & Modul',
          title: 'Menyimpan skor dan menata modul',
          html: `
            <p><strong>localStorage</strong> menyimpan teks kecil yang tetap ada setelah halaman ditutup, misalnya skor terbaik.</p>
            <pre class="page-code" data-label="simpan"><code>localStorage.setItem("skor", "120");
const skor = localStorage.getItem("skor");</code></pre>
            <p>Proyek ini menata fitur jadi modul pada satu objek global; pola permainan memakai fungsi <strong>mount</strong> dan <strong>unmount</strong>.</p>
            <pre class="page-code" data-label="modul.js"><code>window.Neko = window.Neko || {};
window.Neko.games.kuis = {
  mount(ctx) { ctx.el.textContent = ""; },
  unmount() {}
};</code></pre>
            <div class="page-quiz"><b>Cek pemahaman</b>Apa arti baris window.Neko = window.Neko atau objek kosong?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Memakai objek yang ada bila sudah dibuat, atau membuat baru bila belum.</div></div>
            <div class="page-callout"><b>Ingat:</b> jangan menaruh password di localStorage; tiap fitur cukup menambah propertinya tanpa saling menimpa.</div>
          `
        },
        {
          kicker: 'Rangkuman',
          title: 'Ringkasan bab',
          html: `
            <p>Ringkasan cepat dari bab JavaScript.</p>
            <ul>
              <li>const untuk nilai tetap, let untuk yang berubah.</li>
              <li>if dan perulangan mengontrol alur program.</li>
              <li>Array dan objek menyusun data; map, filter, find mengolahnya.</li>
              <li>querySelector mengubah DOM, addEventListener merespons aksi.</li>
              <li>localStorage menyimpan skor, pola modul merapikan proyek.</li>
            </ul>
            <div class="page-callout"><b>Lanjut:</b> baca buku <b>Logika dan Algoritma</b> agar kodemu cerdas, lalu adu cepat di Arena.</div>
          `
        }
      ]
    },
    /* ---------- Buku 4: Python ---------- */
    {
      id: 'python-dasar',
      title: 'Python dari Nol',
      subtitle: 'Bahasa sederhana untuk otomasi dan jaringan.',
      category: 'Koding',
      tag: 'Otomatisasi',
      icon: 'cube',
      colorA: "color-mix(in oklab, var(--success) 22%, #08111f)",
      colorB: "color-mix(in oklab, var(--success) 68%, #08111f)",
      minutes: 16,
      pages: [
        {
          kicker: 'Bab 1 · Mulai',
          title: 'Kenapa Python dan cara menjalankannya',
          html: `
            <p>Python populer karena sintaksnya dekat dengan bahasa manusia, cocok untuk belajar logika dan menulis skrip otomasi di lab.</p>
            <pre class="page-code" data-label="hello.py"><code>print("Halo dari XI TJKT 2")</code></pre>
            <p>Jalankan dari terminal dengan perintah python diikuti nama file, atau gunakan IDLE lalu tekan <span class="page-key">F5</span>.</p>
            <div class="page-flow"><span>Tulis file .py</span><i>→</i><span>Simpan</span><i>→</i><span>Jalankan</span><i>→</i><span>Lihat hasil</span></div>
            <div class="page-callout"><b>Di lab:</b> satu file python bisa dipakai menghitung IP, mengecek jangkauan, sampai merapikan daftar perangkat.</div>
          `
        },
        {
          kicker: 'Bab 1 · Nilai',
          title: 'Variabel, tipe, dan f-string',
          html: `
            <p>Python tidak perlu mendeklarasikan tipe; tipe diketahui otomatis. Gabungkan teks memakai <strong>f-string</strong> agar rapi.</p>
            <pre class="page-code" data-label="nilai.py"><code>nama = "Andi"
umur = 16
tinggi = 1.65
print(f"{nama} umur {umur} tahun")</code></pre>
            <table class="page-table"><tr><th>Tipe</th><th>Contoh</th></tr><tr><td>str</td><td>"tjkt"</td></tr><tr><td>int</td><td>16</td></tr><tr><td>float</td><td>1.65</td></tr><tr><td>bool</td><td>True</td></tr></table>
            <div class="page-callout"><b>f-string:</b> huruf f di awal tanda kutip membuat isi kurung berbunga dievaluasi jadi nilai.</div>
          `
        },
        {
          kicker: 'Bab 2 · Logika',
          title: 'Operator dan kondisi',
          html: `
            <p>Python memakai <strong>if, elif, else</strong> untuk memilih. Perbandingan memakai <strong>==</strong>, dan logika memakai kata <strong>and</strong> serta <strong>or</strong>.</p>
            <pre class="page-code" data-label="kondisi.py"><code>nilai = 82
if nilai &gt;= 75:
    keterangan = "Tuntas"
else:
    keterangan = "Belum tuntas"
print(keterangan)</code></pre>
            <ul>
              <li><strong>Indentasi</strong> (baris menjorok) menandai blok, bukan kurung.</li>
              <li>Satu kesalahan indentasi bisa membuat program berhenti.</li>
            </ul>
            <div class="page-callout"><b>Ingat:</b> setelah titik dua, baris berikutnya wajib menjorok empat spasi.</div>
          `
        },
        {
          kicker: 'Bab 2 · Perulangan',
          title: 'Perulangan for dan while',
          html: `
            <p><strong>for</strong> menelusuri daftar, sementara <strong>while</strong> mengulang selama kondisi masih benar.</p>
            <pre class="page-code" data-label="ulangi.py"><code>host = [10, 11, 12]
for h in host:
    print("Cek 192.168.1." + str(h))
i = 3
while i &gt; 0:
    i -= 1</code></pre>
            <ul>
              <li><strong>range(5)</strong> menghasilkan 0 sampai 4.</li>
              <li><strong>break</strong> menghentikan perulangan lebih awal.</li>
            </ul>
            <div class="page-quiz"><b>Cek pemahaman</b>Apa yang dicetak for pertama kali?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Cek 192.168.1.10, karena h mengambil nilai pertama daftar.</div></div>
            <div class="page-callout"><b>Praktis:</b> for sangat berguna untuk menyapu rentang alamat, misalnya ping ke beberapa host.</div>
          `
        },
        {
          kicker: 'Bab 3 · Struktur Data',
          title: 'List, tuple, dict, dan set',
          html: `
            <p>Python punya beberapa wadah data dengan karakter berbeda.</p>
            <pre class="page-code" data-label="wadah.py"><code>angka = [10, 20, 30]
titik = (192, 168)
router = {"vlan10": "192.168.10.1"}
unik = {1, 2, 2, 3}</code></pre>
            <table class="page-table"><tr><th>Jenis</th><th>Sifat</th></tr><tr><td>list</td><td>urut dan bisa diubah</td></tr><tr><td>tuple</td><td>urut dan tetap</td></tr><tr><td>dict</td><td>pasangan kunci dan nilai</td></tr><tr><td>set</td><td>tanpa duplikat</td></tr></table>
            <div class="page-callout"><b>Kunci dict</b> memudahkan pencarian cepat, misal mengambil gateway lewat nama VLAN.</div>
          `
        },
        {
          kicker: 'Bab 3 · Fungsi',
          title: 'Fungsi dan argumen',
          html: `
            <p><strong>def</strong> membuat fungsi sendiri. Argumen menerima masukan dan <strong>return</strong> mengirim hasil keluar.</p>
            <pre class="page-code" data-label="fungsi.py"><code>def host_ke(n):
    return "192.168.10." + str(n)

print(host_ke(5))</code></pre>
            <ul>
              <li><strong>def</strong> di awal, lalu nama dan kurung.</li>
              <li>Bila tidak ada return, fungsi mengembalikan None.</li>
            </ul>
            <div class="page-quiz"><b>Cek pemahaman</b>Apa yang dikembalikan fungsi bila tidak ada return?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Nilai None, artinya tidak mengembalikan apa pun secara khusus.</div></div>
            <div class="page-callout"><b>Penamaan:</b> gunakan nama yang menjelaskan kerja, misal host_ke bukan f, agar skrip mudah dibaca teman.</div>
          `
        },
        {
          kicker: 'Bab 4 · Berkas & Modul',
          title: 'Mengelola file dan pustaka',
          html: `
            <p>Perintah <strong>with open</strong> membuka berkas dan otomatis menutupnya walau terjadi error. Mode <strong>"w"</strong> menulis baru, <strong>"a"</strong> menambah di akhir.</p>
            <pre class="page-code" data-label="berkas.py"><code>with open("catatan.txt", "w") as f:
    f.write("VLAN 10 sudah dikonfigurasi")</code></pre>
            <p>Python punya pustaka bawaan dan tambahan. <strong>import</strong> mengambil modul, sementara <strong>pip</strong> dijalankan di terminal untuk memasang pustaka luar.</p>
            <pre class="page-code" data-label="modul.py"><code>import socket
from datetime import date
# jalankan di terminal: pip install requests</code></pre>
            <div class="page-callout"><b>Etika pustaka:</b> pasang hanya paket dari sumber tepercaya, dan simpan log pemindaian ke berkas agar bisa dibaca lagi.</div>
          `
        },
        {
          kicker: 'Bab 5 · Jaringan',
          title: 'Python untuk jaringan',
          html: `
            <p>Modul socket membuka hubungan ke host, ping menguji jangkauan, dan berkas CSV merapikan konfigurasi perangkat.</p>
            <pre class="page-code" data-label="cek.py"><code>import socket
host = "192.168.10.1"
socket.setdefaulttimeout(1)
hasil = socket.connect_ex((host, 80))
print("terbuka" if hasil == 0 else "tertutup")</code></pre>
            <div class="page-flow"><span>Daftar IP</span><i>→</i><span>Socket</span><i>→</i><span>Hasil</span><i>→</i><span>CSV</span></div>
            <div class="page-callout"><b>Etika:</b> gunakan hanya pada jaringan lab sekolah dengan izin guru, bukan perangkat orang lain.</div>
            <div class="page-quiz"><b>Cek pemahaman</b>Apa arti hasil connect_ex bernilai nol?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Port berhasil dibuka, artinya host merespons di port tersebut.</div></div>
          `
        },
        {
          kicker: 'Rangkuman',
          title: 'Ringkasan bab',
          html: `
            <p>Ringkasan cepat dari bab Python.</p>
            <ul>
              <li>Python dijalankan dengan perintah python namafile.py atau IDLE.</li>
              <li>f-string menggabungkan teks dan nilai dengan rapi.</li>
              <li>Indentasi menentukan blok kode.</li>
              <li>List, dict, dan set menampung data dengan cara berbeda.</li>
              <li>with open membaca serta menulis berkas, socket memeriksa host.</li>
            </ul>
            <div class="page-callout"><b>Latihan:</b> mainkan <b>Subnet Master</b> di Arena, lalu buat skrip kecil yang menghitung host per subnet.</div>
          `
        }
      ]
    },
    /* ---------- Buku 5: Logika & Algoritma ---------- */
    {
      id: 'logika-algoritma',
      title: 'Logika & Algoritma',
      subtitle: 'Berpikir runtut sebelum menulis kode.',
      category: 'Koding',
      tag: 'Problem Solving',
      icon: 'brain',
      colorA: "color-mix(in oklab, var(--danger) 22%, #08111f)",
      colorB: "color-mix(in oklab, var(--danger) 68%, #08111f)",
      minutes: 15,
      pages: [
        {
          kicker: 'Bab 1 · Konsep',
          title: 'Apa itu algoritma?',
          html: `
            <p><strong>Algoritma</strong> adalah urutan langkah logis yang pasti berhenti untuk menyelesaikan masalah. Tulis langkahnya sebelum mengetik kode.</p>
            <pre class="page-code" data-label="pseudocode"><code>AMBIL daftarhost
UNTUK tiap IP
    JIKA ping berhasil
        CATAT sebagai aktif
ULANGI
TAMPILKAN hasil</code></pre>
            <p><strong>Pseudocode</strong> adalah tulisan mirip kode tapi memakai bahasa manusia, fungsinya menjembatani ide dan program.</p>
            <div class="page-callout"><b>Syarat algoritma:</b> punya masukan, langkah jelas, keluaran, dan berhenti pada waktu tertentu.</div>
          `
        },
        {
          kicker: 'Bab 1 · Flowchart',
          title: 'Menggambar alur berpikir',
          html: `
            <p>Flowchart menggambarkan alur memakai bentuk baku: persegi panjang untuk proses, belah ketupat untuk keputusan, oval untuk mulai dan selesai.</p>
            <figure class="page-figure">
              <svg viewBox="0 0 260 100" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <ellipse cx="30" cy="50" rx="20" ry="14"/><rect x="118" y="38" width="52" height="24" rx="4"/><path d="M206 50l22-14l22 14l-22 14z"/><path d="M50 50h68M170 50h58"/>
              </svg>
              <figcaption>Alur: mulai, proses, lalu titik keputusan.</figcaption>
            </figure>
            <ul>
              <li>Satu proses mengalir ke satu panah berikutnya.</li>
              <li>Keputusan punya sedikitnya dua cabang, ya dan tidak.</li>
            </ul>
            <div class="page-callout"><b>Manfaat:</b> flowchart memudahkan menjelaskan program ke guru atau teman tanpa membaca baris kode.</div>
          `
        },
        {
          kicker: 'Bab 2 · Kompleksitas',
          title: 'Seberapa cepat solusimu?',
          html: `
            <p>Kompleksitas memperkirakan pertumbuhan kerja saat data membesar, cukup bandingkan jumlah langkahnya, bukan detik pada satu komputer.</p>
            <table class="page-table"><tr><th>Notasi</th><th>Arti</th><th>Contoh</th></tr><tr><td>O(n)</td><td>sebanding jumlah data</td><td>mencari satu per satu</td></tr><tr><td>O(log n)</td><td>setengah tiap langkah</td><td>binary search</td></tr><tr><td>O(n pangkat 2)</td><td>tumbuh cepat</td><td>bubble sort</td></tr></table>
            <div class="page-quiz"><b>Cek pemahaman</b>Kenapa mencari di daftar terurut lebih cepat?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Kita bisa membagi ruang cari jadi separuh tiap langkah, sehingga jumlah pengecekan jauh berkurang.</div></div>
            <div class="page-callout"><b>Prinsip:</b> untuk data ribuan baris, hindari metode yang tumbuh kuadrat.</div>
          `
        },
        {
          kicker: 'Bab 2 · Contoh Angka',
          title: 'Pencarian dan pengurutan',
          html: `
            <p>Contoh pada angka <strong>4, 7, 1, 9, 3</strong> untuk mencari angka 9. Linear mencoba satu per satu dan butuh hingga lima langkah. Kalau data sudah <strong>terurut</strong>, binary memotong setengah: mulai dari tengah, buang separuh yang tidak mungkin, lalu ulangi.</p>
            <div class="page-flow"><span>Sudah terurut</span><i>→</i><span>Lihat tengah</span><i>→</i><span>Buang separuh</span><i>→</i><span>Ulangi</span></div>
            <p>Untuk <strong>mengurut</strong>, bubble berulang kali menukar tetangga yang belum berurutan sampai daftar rapi.</p>
            <div class="page-callout"><b>Ingat:</b> binary search butuh data terurut; kalau belum, urutkan dulu atau pakai linear.</div>
          `
        },
        {
          kicker: 'Bab 3 · Rekursi',
          title: 'Fungsi memanggil dirinya',
          html: `
            <p><strong>Rekursi</strong> menyelesaikan masalah dengan memanggil fungsi yang sama pada bagian lebih kecil. Wajib ada <strong>basis</strong> supaya berhenti.</p>
            <pre class="page-code" data-label="faktorial.py"><code>def faktorial(n):
    if n &lt;= 1:
        return 1
    return n * faktorial(n - 1)</code></pre>
            <div class="page-figure">
              <svg viewBox="0 0 260 96" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="86" y="8" width="88" height="20" rx="4"/><rect x="100" y="38" width="72" height="18" rx="4"/><rect x="114" y="66" width="56" height="18" rx="4"/><path d="M130 28v10M136 56v10"/>
              </svg>
              <figcaption>Panggilan menumpuk lalu kembali ke atas saat basis tercapai.</figcaption>
            </div>
            <div class="page-callout"><b>Bahaya:</b> tanpa basis, rekursi tak pernah berhenti dan program kelebihan muatan.</div>
          `
        },
        {
          kicker: 'Bab 3 · Ruang Lingkup',
          title: 'Variabel, ruang lingkup, dan memori',
          html: `
            <p>Setiap variabel hanya hidup di wilayah tertentu. Yang dibuat di dalam fungsi bersifat lokal dan hilang saat fungsi selesai.</p>
            <table class="page-table"><tr><th>Jenis</th><th>Berlaku di</th><th>Hidup sampai</th></tr><tr><td>Lokal</td><td>dalam fungsi</td><td>fungsi selesai</td></tr><tr><td>Global</td><td>seluruh program</td><td>program berakhir</td></tr></table>
            <div class="page-quiz"><b>Cek pemahaman</b>Kenapa memakai variabel lokal lebih aman?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Karena tidak bisa tak sengaja diubah dari bagian program lain, sehingga sulit memunculkan bug.</div></div>
            <p>Memori dibersihkan otomatis, tetapi variabel global yang menumpuk membuat program makin berat.</p>
            <div class="page-callout"><b>Kebiasaan:</b> buat variabel di tempat paling sempit ia dibutuhkan.</div>
          `
        },
        {
          kicker: 'Bab 4 · Debugging',
          title: 'Mengurutkan masalah secara sistematis',
          html: `
            <p>Sama seperti troubleshooting jaringan, cari bug dengan langkah yang tertib, bukan menebak.</p>
            <ol>
              <li>Baca pesan error sampai selesai, catat nomor baris.</li>
              <li>Reproduksi: jalankan lagi dengan input yang sama.</li>
              <li>Kecilkan: hapus bagian yang tidak perlu sampai tersisa inti masalah.</li>
              <li>Cetak atau log variabel mencurigakan pada tiap titik.</li>
            </ol>
            <div class="page-callout"><b>Rubber duck:</b> jelaskan kode keras-keras ke benda atau teman; sering bug terlihat saat kamu mendengar dirimu sendiri.</div>
            <p>Setelah menemukan penyebabnya, ubah satu hal lalu jalankan ulang untuk memastikan.</p>
          `
        },
        {
          kicker: 'Rangkuman',
          title: 'Ringkasan bab',
          html: `
            <p><strong>Pola berpikir untuk proyek nyata:</strong> pecah masalah besar menjadi bagian kecil, selesaikan satu per satu, lalu gabungkan. Misal membuat fitur pencarian materi: pisahkan ambil data, saring, lalu tampilkan.</p>
            <ul>
              <li>Algoritma adalah langkah runtut yang pasti berhenti.</li>
              <li>Flowchart dan pseudocode merencanakan sebelum mengode.</li>
              <li>Kompleksitas memperkirakan kerja saat data membesar.</li>
              <li>Linear untuk data acak, binary butuh data terurut.</li>
              <li>Debugging sistematis: baca, reproduksi, kecilkan, log.</li>
            </ul>
            <div class="page-callout"><b>Lanjut:</b> terapkan pola ini di buku <b>JavaScript Interaktif</b>, lalu uji ketelitianmu di Arena.</div>
          `
        }
      ]
    }
  ];

  const katalog = window.NEK_MATERIALS = window.NEK_MATERIALS || { books: [], icon: function (n) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + n + '"></use></svg>'; } };
  if (!Array.isArray(katalog.books)) katalog.books = [];
  const sudah = new Set(katalog.books.map(b => b.id));
  books.forEach(b => { if (!sudah.has(b.id)) katalog.books.push(b); });
  window.NEK_MATERIALS_KODING = books;
})();
