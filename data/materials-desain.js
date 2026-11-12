/* ============================================================
   NEKO · data/materials-desain.js
   Buku materi desain grafis, poster, alat desain, dan panduan NEKO.
   ============================================================ */
(function () {
  'use strict';

  const books = [
    {
      id: 'desain-grafis',
      title: 'Dasar Desain Grafis',
      subtitle: 'Pahami elemen dan prinsip yang membuat desain terlihat rapi.',
      category: 'Desain',
      tag: 'Dasar',
      icon: 'palette',
      colorA: 'color-mix(in oklab, var(--accent) 22%, #08111f)',
      colorB: 'color-mix(in oklab, var(--accent) 68%, #08111f)',
      minutes: 16,
      pages: [
        {
          kicker: 'Bab 1 · Pengenalan',
          title: 'Apa itu desain grafis?',
          html: `
            <p><strong>Desain grafis</strong> adalah seni menyusun teks, gambar, dan warna untuk menyampaikan pesan tertentu kepada orang tertentu. Hasilnya selalu punya tujuan: memberi informasi, mengajak, atau menjual.</p>
            <p>Beda dengan <strong>seni rupa</strong>. Seni rupa dibuat untuk diekspresikan dan dinikmati tanpa tugas khusus, sedangkan desain grafis menjawab sebuah kebutuhan dan diukur dari apakah pesannya sampai.</p>
            <div class="page-callout"><b>Contoh sekolah:</b> poster lomba 17 Agustus itu desain grafis karena punya tujuan jelas (mengundang) dan audiens jelas (warga sekolah). Lukisan di dinding koridor lebih ke seni rupa.</div>
            <div class="page-quiz"><b>Cek pemahaman</b>Sebuah karya disebut desain grafis bila apa yang tercapai?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Bila pesannya dipahami oleh target audiens sesuai tujuan pembuatannya, bukan hanya karena terlihat indah.</div></div>
          `
        },
        {
          kicker: 'Bab 1 · Elemen',
          title: 'Elemen visual pembentuk desain',
          html: `
            <p>Semua desain tersusun dari lima elemen dasar. Kenali agar kamu tahu harus menambahkan atau mengurangi apa.</p>
            <ul>
              <li><strong>Garis</strong> — mengarahkan mata, memisahkan ruang, atau memberi kesan gerak.</li>
              <li><strong>Bentuk</strong> — kotak, lingkaran, segitiga, atau bentuk bebas yang membentuk objek.</li>
              <li><strong>Ruang</strong> — area kosong di sekitar elemen; ruang kosong bukan ruang terbuang.</li>
              <li><strong>Tekstur</strong> — kesan permukaan, halus atau kasar, nyata maupun semu.</li>
              <li><strong>Warna</strong> — pengatur suasana, penanda pentingnya informasi, dan pemisah kelompok.</li>
            </ul>
            <div class="page-callout"><b>Praktik:</b> jika sebuah tampilan terasa berantakan, biasanya bukan karena kurang elemen, tetapi karena satu elemen tidak punya arah atau ruang yang jelas.</div>
          `
        },
        {
          kicker: 'Bab 2 · Prinsip',
          title: 'Delapan prinsip yang membuat desain menyatu',
          html: `
            <p>Elemen yang sama bisa menghasilkan susunan yang rapi atau kacau. Yang membedakan adalah delapan prinsip berikut.</p>
            <table class="page-table"><tr><th>Prinsip</th><th>Fungsi</th></tr><tr><td>Keseimbangan</td><td>Berat visual tersebar merata, simetris atau pun tidak</td></tr><tr><td>Kontras</td><td>Membedakan penting dan biasa lewat ukuran, warna, atau bentuk</td></tr><tr><td>Hierarki</td><td>Menentukan apa dibaca lebih dulu</td></tr><tr><td>Penekanan</td><td>Satu titik fokus utama menarik perhatian</td></tr><tr><td>Repetisi</td><td>Pengulangan gaya menjaga kesan konsisten</td></tr><tr><td>Alignment</td><td>Semua elemen tersambung pada satu garis rujukan</td></tr><tr><td>Proximity</td><td>Elemen terkait dikelompokkan berdekatan</td></tr><tr><td>Whitespace</td><td>Ruang kosong memberi napas dan kejelasan</td></tr></table>
            <div class="page-callout"><b>Pasangan yang sering dilupakan:</b> <b>proximity</b> dan <b>alignment</b>. Dua judul dan isinya harus berdekatan dan sejajar, jika tidak, pembaca salah mengelompokkan informasi.</div>
          `
        },
        {
          kicker: 'Bab 2 · Warna',
          title: 'Teori warna untuk keputusan yang aman',
          html: `
            <p>Roda warna menyusun dua belas hue. <strong>Primer</strong> (merah, kuning, biru), <strong>sekunder</strong> hasil campuran dua primer, dan <strong>tersier</strong> di antaranya. Warna <em>warm</em> seperti oranye terasa aktif dan dekat; warna <em>cool</em> seperti biru terasa tenang dan jauh.</p>
            <div class="page-swatches"><span style="background:#c0392b">Merah</span><span style="background:#d68910">Oranye</span><span style="background:#1e6f5c">Hijau</span><span style="background:#24466b">Biru</span><span style="background:#5b3a86">Ungu</span></div>
            <figure class="page-figure"><svg viewBox="0 0 260 110" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="130" cy="55" r="44"/><circle cx="130" cy="55" r="16"/><polygon points="130,17 163,68 97,68"/><path d="M130 11v18M130 81v18M91 33l16 10M153 33l-16 10M91 77l16-10M153 77l-16-10"/></svg><figcaption>Segitiga primer di dalam roda warna; warna sekunder terletak di antara dua primernya.</figcaption></figure>
            <div class="page-callout"><b>Aturan 60-30-10:</b> 60 persen warna dasar, 30 persen warna pendukung, 10 persen warna aksen. Psikologi warna bersifat umum, misalnya merah menandai peringatan, tetapi selalu sesuaikan dengan konteks sekolah.</div>
          `
        },
        {
          kicker: 'Bab 3 · Tipografi',
          title: 'Memilih dan memasangkan huruf',
          html: `
            <ul>
              <li><strong>Serif</strong> punya kaki kecil, resmi, dan enak dibaca pada teks panjang cetakan.</li>
              <li><strong>Sans-serif</strong> bersih dan modern, paling aman untuk layar dan poster jarak jauh.</li>
              <li><strong>Display</strong> sangat khas, pakai hanya untuk judul besar, jangan untuk isi.</li>
            </ul>
            <p>Pasang satu font display untuk judul dengan satu font sans yang netral untuk isi; hal itu disebut <em>pairing</em>. Jaga <strong>leading</strong> sekitar 1,4 sampai 1,6 kali ukuran huruf, dan beri spasi antarparagraf lebih besar daripada spasi baris.</p>
            <div class="page-callout"><b>Batas aman:</b> maksimal dua jenis font, tiga sudah batas atas. Semakin banyak huruf, desain semakin terlihat tidak terencana.</div>
            <div class="page-quiz"><b>Cek pemahaman</b>Mengapa font display tidak dipakai untuk isi paragraf?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Bentuknya ramai sehingga melelahkan mata saat dipakai untuk banyak kata.</div></div>
          `
        },
        {
          kicker: 'Bab 3 · Komposisi',
          title: 'Komposisi, grid, dan alur mata',
          html: `
            <p>Grid adalah garis tak terlihat yang menjadi tempat elemen berpijak. Mulai dari <strong>margin</strong> yang seragam di tepi, lalu bagi ruang dengan kolom dan baris.</p>
            <figure class="page-figure"><svg viewBox="0 0 260 110" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="18" y="10" width="224" height="90" rx="4"/><line x1="93" y1="10" x2="93" y2="100"/><line x1="167" y1="10" x2="167" y2="100"/><line x1="18" y1="40" x2="242" y2="40"/><line x1="18" y1="70" x2="242" y2="70"/><circle cx="93" cy="40" r="4"/><circle cx="167" cy="40" r="4"/><circle cx="93" cy="70" r="4"/><circle cx="167" cy="70" r="4"/></svg><figcaption>Rule of thirds: bagi bidang jadi sembilan bagian dan letakkan fokus pada titik potongnya.</figcaption></figure>
            <p>Letakkan unsur penting di <strong>rule of thirds</strong>, yaitu empat titik potong grid, bukan selalu di tengah. Mata pembaca bergerak membentuk <strong>Z</strong> pada halaman sedikit teks, dan <strong>F</strong> pada halaman banyak teks: menyapu baris bagian atas lalu turun ke kiri.</p>
            <div class="page-callout"><b>Akibatnya:</b> taruh logo kiri atas, judul mengikuti jalur sapuan mata, dan tombol atau ajakan di bagian bawah jalur tersebut.</div>
          `
        },
        {
          kicker: 'Bab 4 · Teknis',
          title: 'Resolusi, format file, dan mode warna',
          html: `
            <p>Layar memakai <strong>RGB</strong> karena memancarkan cahaya; mesin cetak memakai <strong>CMYK</strong> karena menyerap tinta. Warna hijau neon atau biru menyala di layar bisa terlihat kusam saat dicetak.</p>
            <table class="page-table"><tr><th>Format</th><th>Karakter</th><th>Pakai untuk</th></tr><tr><td>PNG</td><td>Raster, kualitas terjaga, bisa transparan</td><td>Logo, hasil ekspor layar</td></tr><tr><td>JPG</td><td>Raster, dikompresi, ukuran kecil</td><td>Foto</td></tr><tr><td>SVG</td><td>Vektor, tidak pecah diperbesar</td><td>Ikon, logo</td></tr><tr><td>PDF</td><td>Siap cetak, tata letak terkunci</td><td>Poster dan laporan</td></tr></table>
            <div class="page-callout"><b>Satuan:</b> layar cukup 72 sampai 150 ppi; bahan cetak butuh 300 dpi pada ukuran asli. Poster A3 perlu sekitar 3508 x 4961 piksel pada 300 dpi.</div>
            <div class="page-quiz"><b>Cek pemahaman</b>Kenapa warna biru menyala di layar bisa kusam saat dicetak?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Layar memakai RGB yang memancarkan cahaya, sedangkan cetak memakai CMYK yang menyerap tinta, sehingga gamutnya berbeda.</div></div>
          `
        },
        {
          kicker: 'Bab 4 · Alur kerja',
          title: 'Cara desainer bekerja dari tugas ke file akhir',
          html: `
            <p>Jangan langsung membuka aplikasi. Urutan kerja yang terbiasa dipakai desainer membuat hasil lebih cepat selesai dan revisinya tidak berkali-kali.</p>
            <div class="page-flow"><span>Brief</span><i>→</i><span>Riset</span><i>→</i><span>Sketsa</span><i>→</i><span>Digital</span><i>→</i><span>Revisi</span><i>→</i><span>Ekspor</span></div>
            <ol>
              <li><strong>Brief</strong> — tulis tujuan, audiens, pesan wajib, ukuran, dan tenggat.</li>
              <li><strong>Sketsa</strong> — blok kasar posisi elemen dengan pensil, tanpa warna.</li>
              <li><strong>Digital</strong> — baru bangun di aplikasi sambil menjaga grid dan palet.</li>
              <li><strong>Revisi</strong> — minta umpan balik dengan pertanyaan spesifik, bukan apakah sudah bagus.</li>
            </ol>
            <div class="page-callout"><b>Tips sekolah:</b> simpan file mentah dan file ekspor terpisah. Saat panitia minta perubahan ukuran, kamu tinggal membuka mentahnya.</div>
          `
        },
        {
          kicker: 'Rangkuman',
          title: 'Ringkasan bab',
          html: `
            <ul>
              <li>Desain grafis = pesan untuk audiens; seni rupa = ekspresi.</li>
              <li>Lima elemen: garis, bentuk, ruang, tekstur, warna.</li>
              <li>Delapan prinsip menjaga desain menyatu dan terbaca.</li>
              <li>Palet 60-30-10 dan maksimal dua sampai tiga font.</li>
              <li>Grid dan rule of thirds mengatur alur mata.</li>
              <li>RGB untuk layar, CMYK untuk cetak, 300 dpi untuk poster.</li>
            </ul>
            <div class="page-callout"><b>Lanjutkan:</b> buka buku <b>Aturan Membuat Poster</b> untuk menerapkan semua prinsip ini pada satu karya nyata.</div>
          `
        }
      ]
    },
    {
      id: 'poster-aturan',
      title: 'Aturan Membuat Poster',
      subtitle: 'Komposisi, teks, warna, dan checklist lomba.',
      category: 'Desain',
      tag: 'Praktik',
      icon: 'banner',
      colorA: 'color-mix(in oklab, var(--accent-2) 22%, #08111f)',
      colorB: 'color-mix(in oklab, var(--accent-2) 68%, #08111f)',
      minutes: 14,
      pages: [
        {
          kicker: 'Bab 1 · Fungsi',
          title: 'Jenis poster dan satu tujuan tunggal',
          html: `
            <p>Sebelum menentukan bentuk visual, tetapkan dulu jenis posternya. Setiap jenis punya pembaca dan cara menilai yang berbeda.</p>
            <ul>
              <li><strong>Poster informasi</strong> — pengumuman kegiatan, jadwal, atau layanan sekolah.</li>
              <li><strong>Poster propaganda</strong> — mengajak perubahan sikap, misalnya anti narkoba.</li>
              <li><strong>Poster acara</strong> — menjual tiket atau mengundang, butuh tanggal dan tempat yang tegas.</li>
              <li><strong>Poster ilmiah</strong> — ringkasan penelitian, dibaca dengan urutan hasil lalu metode.</li>
              <li><strong>Poster lomba</strong> — dinilai juri, sehingga syarat teknis sama pentingnya dengan estetika.</li>
            </ul>
            <div class="page-callout"><b>Aturan satu tujuan:</b> pilih satu hal yang harus dilakukan pembaca. Poster yang ingin memberi informasi sekaligus menjual sekaligus menghibur biasanya tidak berhasil pada ketiganya.</div>
          `
        },
        {
          kicker: 'Bab 2 · Hierarki Baca',
          title: 'Urutan yang harus terbaca dalam tiga detik',
          html: `
            <p>Ujiannya sederhana: tempel poster di dinding, mundur tiga meter, dan lihat hanya tiga detik. Bila pembaca tidak dapat menangkap judul dan satu pesan utama, hierarkinya belum bekerja.</p>
            <figure class="page-figure"><svg viewBox="0 0 260 110" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="26" y="8" width="208" height="22" rx="4"/><rect x="54" y="38" width="152" height="14" rx="3"/><rect x="78" y="58" width="104" height="12" rx="3"/><rect x="96" y="76" width="68" height="12" rx="3"/><rect x="112" y="94" width="36" height="8" rx="2"/></svg><figcaption>Blok makin kecil dari atas ke bawah: judul, subjudul, info utama, ajakan, lalu detail.</figcaption></figure>
            <ol>
              <li>Judul paling besar dan paling kontras.</li>
              <li>Subjudul satu baris penjelas tema.</li>
              <li>Info utama yang dicari pembaca lebih dulu.</li>
              <li>Ajakan atau CTA seperti cara mendaftar.</li>
              <li>Detail kecil: panitia, kontak, sumber.</li>
            </ol>
            <div class="page-callout"><b>Takaran:</b> selisih ukuran judul dan body minimal dua kali agar mata langsung tahu mana yang lebih penting.</div>
            <div class="page-quiz"><b>Cek pemahaman</b>Bagaimana menguji hierarki sebelum poster dicetak?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Tempel lalu mundur tiga meter dan lihat hanya tiga detik; jika judul dan pesan utama tidak tertangkap, hierarkinya masih lemah.</div></div>
          `
        },
        {
          kicker: 'Bab 3 · Komposisi',
          title: 'Menata ruang poster',
          html: `
            <p>Poster yang baik terasa lapang. Sediakan <strong>margin aman</strong> di seluruh tepi, sekitar lima persen lebar poster, agar teks tidak terpotong saat dicetak atau dipasang.</p>
            <figure class="page-figure"><svg viewBox="0 0 260 110" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="8" y="6" width="244" height="98" rx="5"/><rect x="26" y="20" width="208" height="70" rx="4" stroke-dasharray="5 4"/><rect x="38" y="28" width="112" height="18" rx="3"/><circle cx="196" cy="52" r="22"/><rect x="38" y="60" width="86" height="10" rx="3"/><rect x="38" y="78" width="60" height="9" rx="3"/></svg><figcaption>Garis putus-putus adalah area aman; area di luarnya tidak boleh berisi informasi penting.</figcaption></figure>
            <ul>
              <li><strong>Satu titik fokus</strong> saja, misalnya gambar utama, jangan dua yang bersaing.</li>
              <li>Rapikan ke garis rujukan yang sama, baik rata kiri maupun rata tengah secara konsisten.</li>
              <li>Biarkan <strong>whitespace</strong>; ruang kosong memisahkan kelompok informasi.</li>
            </ul>
            <div class="page-callout"><b>Jangan penuhi ruang:</b> poster kosong tujuh puluh persen jauh lebih terbaca daripada poster penuh seratus persen.</div>
          `
        },
        {
          kicker: 'Bab 4 · Teks',
          title: 'Aturan teks agar terbaca dari jauh',
          html: `
            <ul>
              <li>Judul harus tetap terbaca dari jarak <strong>tiga meter</strong>. Untuk A3, mulai dari sekitar 100 pt.</li>
              <li><strong>Body cetak minimal 24 pt</strong>; di bawah itu pembaca harus menempel hidung ke poster.</li>
              <li><strong>Maksimal dua jenis font</strong> dalam satu poster.</li>
              <li>Hindari teks rata tengah lebih dari <strong>tiga baris</strong>; mata kehilangan titik awal baris.</li>
            </ul>
            <table class="page-table"><tr><th>Ukuran</th><th>Judul</th><th>Subjudul</th><th>Body</th></tr><tr><td>A3</td><td>90–120 pt</td><td>40–50 pt</td><td>24–28 pt</td></tr><tr><td>A2</td><td>130–170 pt</td><td>55–65 pt</td><td>32–40 pt</td></tr><tr><td>4B</td><td>180–220 pt</td><td>70–80 pt</td><td>40–48 pt</td></tr></table>
            <div class="page-quiz"><b>Cek pemahaman</b>Kenapa teks panjang lebih baik rata kiri daripada rata tengah?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Karena tepi kiri yang lurus memberi acuan tetap untuk memulai tiap baris, sehingga mata tidak perlu mencari posisi mulai.</div></div>
          `
        },
        {
          kicker: 'Bab 5 · Warna',
          title: 'Palet poster dan keterbacaan',
          html: `
            <p>Pilih <strong>dua sampai tiga warna</strong> saja: satu latar, satu teks atau bentuk utama, satu aksen. Tambahkan hitam dan putih bila perlu sebagai penengah.</p>
            <div class="page-swatches"><span style="background:#0f1a2e">Navy</span><span style="background:#f4f1ea">Krem</span><span style="background:#e0a458">Aksen</span></div>
            <ul>
              <li>Kontras teks dan latar memenuhi <strong>WCAG 4.5:1</strong> untuk teks normal; uji dengan memotret poster lalu lihat dalam mode hitam putih, jika masih terbaca kontrasnya cukup.</li>
              <li><strong>Hindari teks merah di atas biru</strong> (atau sebaliknya); keduanya bergetar di mata dan gagal saat dicetak.</li>
              <li>Warna layar lebih terang dari hasil cetak, sehingga hindari hue paling menyala untuk teks.</li>
            </ul>
            <div class="page-callout"><b>Cek cepat:</b> putih di atas krem terlihat rapi, kuning di atas putih hampir mustahil dibaca, bahkan pada ukuran besar.</div>
          `
        },
        {
          kicker: 'Bab 6 · Wajib Ada',
          title: 'Checklist elemen poster sekolah dan lomba',
          html: `
            <p>Sebelum mengekspor, centang satu per satu. Poster yang indah tetapi kehilangan satu data penting tetap dianggap tidak lengkap oleh juri maupun panitia.</p>
            <ul class="page-check">
              <li>Judul atau nama kegiatan yang singkat.</li>
              <li>Tema atau pesan utama yang ingin disampaikan.</li>
              <li>Tanggal dan jam pelaksanaan.</li>
              <li>Tempat atau lokasi, termasuk ruang atau tautan jika daring.</li>
              <li>Penyelenggara dan nama pembimbing, misalnya Kelompok 1 dan Pak Andy Musly.</li>
              <li>Logo sekolah atau panitia dengan ukuran yang masih terbaca.</li>
              <li>Kontak atau QR yang masih bisa dipindai dari jarak satu meter.</li>
              <li>Sumber data dan kredit gambar, wajib pada poster ilmiah.</li>
            </ul>
            <div class="page-callout"><b>Paling sering hilang:</b> kontak dan sumber. Tambahkan keduanya di baris detail paling bawah.</div>
          `
        },
        {
          kicker: 'Bab 7 · Lomba',
          title: 'Teknik yang dinilai juri',
          html: `
            <ol>
              <li><strong>Kesesuaian tema</strong> — baca ulang judul lomba dan pastikan pesan utama persis menjawabnya.</li>
              <li><strong>Orisinalitas</strong> — susunan karya sendiri; hindari clipart generik, template yang diedit sedikit, dan font bawaan aplikasi apa adanya.</li>
              <li><strong>Kekuatan pesan</strong> — satu kalimat yang masih diingat juri setelah poster ditutup.</li>
            </ol>
            <pre class="page-code" data-label="syarat teknis"><code>Ukuran   : A3 portrait atau 4B sesuai panitia
Orientasi: cek apakah landscape atau portrait
Bleed    : 3 mm tiap tepi, latar penuh sampai tepi
Resolusi : 300 dpi pada ukuran asli
Ekspor   : PDF cetak + PNG 300 dpi
Nama file: lomba-poster-namamu-v1.pdf</code></pre>
            <div class="page-callout"><b>Bleed 3 mm</b> berarti latar belakang digambar sampai memenuhi area ekstra tersebut, karena mesin potong selalu punya toleransi dan menyisakan garis putih bila desain berhenti tepat di tepi.</div>
          `
        },
        {
          kicker: 'Bab 8 · Koreksi',
          title: 'Kesalahan umum poster siswa dan solusinya',
          html: `
            <div class="page-cols">
              <div>
                <h3>Kesalahannya</h3>
                <ul>
                  <li>Teks terlalu banyak, seperti makalah yang ditempel.</li>
                  <li>Font dekoratif dipakai untuk isi.</li>
                  <li>Warna pelangi tanpa dominasi.</li>
                  <li>Tidak ada ajakan yang jelas.</li>
                  <li>Logo terlalu kecil atau warna latar tidak kontras.</li>
                </ul>
              </div>
              <div>
                <h3>Perbaikinya</h3>
                <ul>
                  <li>Pangkas menjadi tiga poin, sisanya taruh di QR.</li>
                  <li>Dekoratif hanya untuk judul, body pakai sans.</li>
                  <li>Kunci palet 60-30-10 dengan satu aksen.</li>
                  <li>Tulis CTA satu kalimat dan beri tombol atau kotak.</li>
                  <li>Besarkan logo sampai terbaca satu meter.</li>
                </ul>
              </div>
            </div>
            <div class="page-quiz"><b>Cek pemahaman</b>Poster penuh teks dan tidak ada ruang kosong. Tindakan pertama?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Buang separuh kata, lalu kelompokkan sisa informasi dengan proximity agar tiap blok punya jarak sendiri.</div></div>
          `
        },
        {
          kicker: 'Rangkuman',
          title: 'Ringkasan bab',
          html: `
            <ul>
              <li>Satu poster, satu tujuan, dan satu titik fokus.</li>
              <li>Hierarki: judul, subjudul, info utama, ajakan, detail.</li>
              <li>Uji tiga meter tiga detik sebelum mengekspor.</li>
              <li>Body cetak minimal 24 pt, maksimal dua font, kontras 4.5:1.</li>
              <li>Syarat lomba: ukuran, bleed 3 mm, 300 dpi, PDF dan PNG.</li>
            </ul>
            <div class="page-callout"><b>Uji pengetahuanmu:</b> buka buku <b>Perangkat Lunak Desain</b> untuk memilih alat, lalu mainkan <b>Kartu Memori</b> di Arena untuk mengulang istilah.</div>
          `
        }
      ]
    },
    {
      id: 'alat-desain',
      title: 'Perangkat Lunak Desain',
      subtitle: 'Pilih alat yang tepat, kerjakan dengan alur yang rapi.',
      category: 'Desain',
      tag: 'Alat',
      icon: 'layers',
      colorA: 'color-mix(in oklab, var(--success) 22%, #08111f)',
      colorB: 'color-mix(in oklab, var(--success) 68%, #08111f)',
      minutes: 15,
      pages: [
        {
          kicker: 'Bab 1 · Memilih',
          title: 'Tugas menentukan alat, bukan kebiasaan',
          html: `
            <p>Tidak ada satu aplikasi terbaik untuk semua pekerjaan. Mulailah dari pertanyaan: hasilnya akan berupa tata letak, foto, atau bentuk vektor.</p>
            <table class="page-table"><tr><th>Kebutuhan</th><th>Alat pas</th><th>Karena</th></tr><tr><td>Poster cepat untuk mading</td><td>Canva</td><td>Preset ukuran dan banyak elemen siap pakai</td></tr><tr><td>Ikon dan logo</td><td>Figma atau Inkscape</td><td>Bekerja vektor, tidak pecah diperbesar</td></tr><tr><td>Edit foto dan retouch</td><td>Photoshop, GIMP, Photopea</td><td>Layer raster, mask, dan koreksi warna</td></tr><tr><td>Ilustrasi tangan</td><td>Illustrator atau Inkscape</td><td>Pen tool dan bentuk presisi</td></tr></table>
            <div class="page-callout"><b>Untuk sekolah:</b> Canva paling aman karena gratis dan berjalan di browser lab; ekspor PDF Cetak juga tersedia di versi gratis.</div>
          `
        },
        {
          kicker: 'Bab 2 · Canva',
          title: 'Canva untuk desain cepat',
          html: `
            <ol>
              <li>Buat desain lewat <strong>ukuran khusus</strong> atau preset Poster, supaya rasio tidak berubah di tengah jalan.</li>
              <li>Ambil <strong>Template</strong> hanya sebagai kerangka, lalu ganti warna dan huruf agar tidak terlihat seragam dengan karya teman.</li>
              <li>Tata posisi lewat menu <strong>Posisikan</strong>: rata kiri, tengah, atau atas, plus <em>kirim ke belakang</em> agar latar tidak menutupi teks.</li>
              <li>Pakai <strong>Elemen</strong> untuk bentuk dan ikon, kelompokkan agar bisa digeser bersamaan.</li>
            </ol>
            <pre class="page-code" data-label="ekspor canva"><code>Bagikan &gt; Unduh
File type  : PNG
Centang    : Latar belakang transparan (butuh Pro)
Untuk cetak: File type PDF, lalu pilih Cetak
Foto raster: centang kualitas tinggi sebelum unduh</code></pre>
            <div class="page-callout"><b>CATATAN:</b> latar transparan hanya tersedia pada paket berbayar. Alternatifnya potong gambar di remove.bg lalu unggah hasilnya sebagai PNG.</div>
          `
        },
        {
          kicker: 'Bab 2 · Figma',
          title: 'Figma dasar untuk tata letak dan ikon',
          html: `
            <ul>
              <li><strong>Frame</strong> adalah kanvas per ukuran; buat satu frame per versi agar mudah dibandingkan.</li>
              <li><strong>Auto layout</strong> sederhana menambahkan jarak dan padding otomatis saat teks bertambah panjang.</li>
              <li><strong>Component</strong> menyimpan elemen berulang seperti tombol; ubah sekali, berubah di semua halaman.</li>
              <li><strong>Color style</strong> menyimpan palet poster sehingga warna tidak dipakai sembarangan.</li>
            </ul>
            <p>Ekspor seleksi lewat panel kanan: pilih PNG untuk layar, PDF untuk cetak, dan SVG untuk ikon atau logo.</p>
            <div class="page-quiz"><b>Cek pemahaman</b>Kapan memakai component daripada menyalin objek?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Saat elemen diulang lebih dari tiga kali dan kemungkinan direvisi, misalnya tombol, label, atau kartu.</div></div>
          `
        },
        {
          kicker: 'Bab 3 · Raster',
          title: 'Photoshop dan alternatif gratisnya',
          html: `
            <div class="page-cols">
              <div>
                <h3>Photoshop</h3>
                <ul>
                  <li>Standar industri, berbayar.</li>
                  <li>Adjustment layer nondestruktif.</li>
                  <li>Cocok untuk retouch dan compositing.</li>
                </ul>
              </div>
              <div>
                <h3>GIMP dan Photopea</h3>
                <ul>
                  <li>GIMP gratis dan dipasang offline di lab.</li>
                  <li>Photopea gratis di browser, bisa membuka PSD.</li>
                  <li>Keduanya punya layer dan mask.</li>
                </ul>
              </div>
            </div>
            <p>Tiga konsep yang wajib dipahami: <strong>layer</strong> menumpuk gambar, <strong>mask</strong> menyembunyikan sebagian layer tanpa menghapusnya, dan <strong>Color Balance</strong> menggeser nuansa warna per bayangan, tengah, atau highlight.</p>
            <div class="page-callout"><b>Selalu pakai mask</b> daripada eraser. Mask bisa diubah kapan saja, hasil hapusan tidak bisa dikembalikan setelah file ditutup.</div>
          `
        },
        {
          kicker: 'Bab 3 · Vektor',
          title: 'Illustrator dan Inkscape',
          html: `
            <p><strong>Vektor</strong> menyimpan bentuk sebagai rumus garis dan lengkung, sehingga logo bisa diperbesar dari kartu nama ke spanduk tanpa pecah.</p>
            <ul>
              <li><strong>Pen tool</strong> membuat <em>path</em> dari titik anchor; sedikit titik berarti kurva lebih bersih.</li>
              <li><strong>Boolean operation</strong> menggabungkan bentuk: tambah, potong, kurangi, atau iris.</li>
              <li><strong>Offset path</strong> membuat garis tepi untuk teks logo.</li>
            </ul>
            <table class="page-table"><tr><th>Aspek</th><th>Illustrator</th><th>Inkscape</th></tr><tr><td>Lisensi</td><td>Berbayar</td><td>Gratis dan terbuka</td></tr><tr><td>Format asli</td><td>AI</td><td>SVG</td></tr><tr><td>Belajar</td><td>Kurva melimpah</td><td>Cocok untuk sekolah</td></tr></table>
            <div class="page-callout"><b>Ekspor:</b> di Inkscape aktifkan Ukuran Halaman Gambar agar SVG tidak membawa kanvas berlebih.</div>
            <div class="page-quiz"><b>Cek pemahaman</b>Apa yang membuat logo vektor aman diperbesar ke spanduk?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Bentuknya berupa rumus garis dan lengkung, jadi dihitung ulang pada ukuran berapa pun.</div></div>
          `
        },
        {
          kicker: 'Bab 4 · Alat bantu',
          title: 'Empat situs yang menghemat waktu',
          html: `
            <p>Empat situs berikut bukan pengganti aplikasi desain, tetapi menghemat waktu paling banyak pada tahap persiapan.</p>
            <ul>
              <li><strong>Coolors</strong> — menghasilkan palet, bisa dikunci satu warna lalu diacak ulang, diekspor ke PNG atau CSS.</li>
              <li><strong>Google Fonts</strong> — font gratis untuk layar dan cetak; unduh sebagai satu keluarga agar bobotnya lengkap.</li>
              <li><strong>remove.bg</strong> — memotong latar foto menjadi PNG transparan dengan sekali unggah.</li>
              <li><strong>Unsplash dan Pexels</strong> — foto kualitas cetak tanpa biaya.</li>
            </ul>
            <div class="page-callout"><b>Lisensi tetap harus dibaca.</b> Gratis tidak berarti bebas pakai untuk semua hal. Cek apakah perlu mencantumkan kredit, apakah boleh dipakai komersial, dan apakah gambar orang atau logo merek boleh disalin. Untuk lomba, simpan tautan sumber setiap aset.</div>
          `
        },
        {
          kicker: 'Bab 5 · Alur',
          title: 'Poster dari nol sampai siap cetak',
          html: `
            <div class="page-flow"><span>Ukuran</span><i>→</i><span>Grid</span><i>→</i><span>Palet</span><i>→</i><span>Tipografi</span><i>→</i><span>Konten</span><i>→</i><span>Uji</span><i>→</i><span>Ekspor</span></div>
            <ol>
              <li>Buat frame A3 300 dpi dengan bleed 3 mm di aplikasi pilihan.</li>
              <li>Tarik guide margin dan tiga kolom, lalu kunci posisinya.</li>
              <li>Blok area judul, gambar utama, dan detail sebelum memasukkan teks nyata.</li>
              <li>Terapkan dua font dan tiga warna, kunci sebagai style.</li>
              <li>Isi data wajib dari checklist poster, lalu uji jarak tiga meter.</li>
            </ol>
            <div class="page-callout"><b>Ekspor akhir:</b> PDF untuk cetak, PNG untuk layar, plus file mentah yang diberi versi, misal nama-v1 dan nama-v2, agar revisi tidak saling menimpa.</div>
            <div class="page-quiz"><b>Cek pemahaman</b>Mengapa guide dan margin dikunci di awal pekerjaan?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Supaya semua elemen berpijak pada garis rujukan yang sama sejak awal, sehingga tidak perlu merapikan ulang seluruh poster di akhir.</div></div>
          `
        },
        {
          kicker: 'Rangkuman',
          title: 'Ringkasan bab',
          html: `
            <ul>
              <li>Canva untuk cepat, Figma untuk vektor dan tata letak.</li>
              <li>Raster untuk foto pakai layer dan mask, vektor untuk logo.</li>
              <li>Coolors, Google Fonts, remove.bg, Unsplash melengkapi kerja.</li>
              <li>Cek lisensi aset sebelum dipakai lomba atau publikasi.</li>
              <li>Alur: ukuran, grid, palet, tipografi, konten, uji, ekspor.</li>
            </ul>
            <div class="page-callout"><b>Terapkan:</b> buka buku <b>Panduan Menggunakan NEKO</b> untuk menyusun hasil kerjamu di Perpustakaan, lalu tantang nilaimu lewat <b>Kuis Kilat</b> di Arena.</div>
          `
        }
      ]
    },
    {
      id: 'panduan-neko',
      title: 'Panduan Menggunakan NEKO',
      subtitle: 'Cara membuka, membaca materi, dan bermain dengan teman.',
      category: 'Panduan',
      tag: 'Wajib Baca',
      icon: 'help',
      colorA: 'color-mix(in oklab, var(--warn) 22%, #08111f)',
      colorB: 'color-mix(in oklab, var(--warn) 68%, #08111f)',
      minutes: 12,
      pages: [
        {
          kicker: 'Bab 1 · Membuka & Navigasi',
          title: 'Menjalankan NEKO dan isi setiap tab',
          html: `
            <p><strong>Mode lokal</strong> berjalan tanpa server: cukup buka file halamannya, progres hanya tersimpan di perangkat itu. <strong>Mode online</strong> memakai <strong>Mulai-NEKO.bat</strong> di localhost port 3000, lalu setiap perangkat di WiFi yang sama membuka alamat itu.</p>
            <div class="page-callout"><b>Login di mode online</b> menyimpan akun di server sehingga leaderboard, progres baca, dan nilai Kelas Langsung berpindah antar perangkat. Pesan dan Mabar hanya aktif di mode ini.</div>
            <figure class="page-figure"><svg viewBox="0 0 260 110" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="14" y="14" width="232" height="70" rx="8"/><rect x="28" y="28" width="52" height="42" rx="6"/><line x1="96" y1="30" x2="232" y2="30"/><line x1="96" y1="46" x2="200" y2="46"/><line x1="96" y1="62" x2="220" y2="62"/><line x1="24" y1="94" x2="236" y2="94"/><circle cx="52" cy="94" r="6"/><circle cx="104" cy="94" r="6"/><circle cx="156" cy="94" r="6"/><circle cx="208" cy="94" r="6"/></svg><figcaption>Navigasi tampil sebagai sidebar di layar besar dan sebagai dock di bawah pada ponsel.</figcaption></figure>
            <ul>
              <li><strong>Beranda</strong> — check-in harian dan lanjut baca.</li>
              <li><strong>Perpustakaan</strong> — rak buku materi.</li>
              <li><strong>Arena</strong> — pilihan game dan Kelas Langsung.</li>
              <li><strong>Mabar</strong> — room multiplayer lewat PIN.</li>
              <li><strong>Pesan</strong> — chat dan teman.</li>
              <li><strong>Profil</strong> — statistik, koleksi, panduan, tab Kontak (pembimbing dan pembuat aplikasi), serta pengaturan.</li>
            </ul>
          `
        },
        {
          kicker: 'Bab 2 · Perpustakaan',
          title: 'Membaca buku materi',
          html: `
            <ol>
              <li>Pilih kategori lewat tombol filter atau ketik kata kunci di kotak cari.</li>
              <li>Ketuk sampul buku untuk membukanya dalam format lembar dua halaman.</li>
              <li>Balik halaman memakai tombol <strong>Berikutnya</strong>, panah kiri dan kanan pada keyboard, atau geser layar ke kiri di ponsel.</li>
              <li>Tekan tombol hati di bilah atas untuk menandai buku favorit.</li>
            </ol>
            <div class="page-callout"><b>Halaman yang tercatat memberi XP.</b> Membaca satu halaman baru menambah XP, dan menamatkan satu buku membuka badge koleksi serta XP tambahan yang lebih besar.</div>
            <p>Titik kecil di bawah setiap sampul menunjukkan halaman mana yang sudah dibaca. Pertanyaan berlabel <em>Lihat jawaban</em> membuka pembahasan ketika kamu sudah mencoba menjawab lebih dulu.</p>
          `
        },
        {
          kicker: 'Bab 3 · Arena',
          title: 'Bermain dan memecahkan rekor sendiri',
          html: `
            <p>Arena memuat dua belas mode latihan. Pilih kartu game, atur sesi, lalu tekan mulai.</p>
            <table class="page-table"><tr><th>Pengaturan</th><th>Pilihan</th></tr><tr><td>Tingkat kesulitan</td><td>Santai, Normal, Tantangan</td></tr><tr><td>Jumlah ronde atau soal</td><td>Tiga pilihan per game</td></tr><tr><td>Pemain bergiliran</td><td>Untuk game sosial seperti Who Is The Spy</td></tr></table>
            <p>Skor, kemenangan, dan <strong>rekor terbaik</strong> per game tersimpan di statistik akun. Tantangan memberi bonus poin paling besar, santai paling longgar waktunya.</p>
            <div class="page-callout"><b>Tersedia antara lain:</b> Kuis Kilat, Lab Kabel, Kartu Memori, Subnet Master, Menara OSI, Detektif Jaringan, Refleks Neko, Simon Router, Serang Port, Subnet 2048, dan Terminal Kilat.</div>
            <div class="page-quiz"><b>Cek pemahaman</b>Bagian mana yang menyimpan skor tertinggi setiap game?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Rekor terbaik per game tersimpan di statistik profil, dan ditampilkan pada kartu game di Arena.</div></div>
          `
        },
        {
          kicker: 'Bab 4 · Kelas Langsung',
          title: 'Kuis realtime satu layar banyak ponsel',
          html: `
            <div class="page-flow"><span>Guru buat sesi</span><i>→</i><span>PIN tampil</span><i>→</i><span>Siswa masuk PIN</span><i>→</i><span>Pilih karakter</span><i>→</i><span>Jawab soal</span><i>→</i><span>Podium</span></div>
            <ul>
              <li>Sebagai <strong>host</strong>, guru mengatur tingkat, topik, jumlah soal, dan durasi, lalu membuat sesi sampai <strong>PIN enam angka</strong> muncul di layar.</li>
              <li>Sebagai <strong>pemain</strong>, siswa membuka Arena, memilih Kelas Langsung, lalu memasukkan PIN tersebut dari ponselnya.</li>
              <li>Siswa memilih karakter dari pack avatar; <strong>karakter yang sudah diambil tidak boleh dipakai orang kedua</strong> dan tombolnya terkunci.</li>
              <li>Skor gabungan <strong>kecepatan dan ketepatan</strong>; papan peringkat bergerak seketika, dan podium juara tampil di akhir sesi.</li>
            </ul>
            <div class="page-callout"><b>XP Kelas Langsung otomatis masuk akun</b> di server, jadi hasilmu tetap tercatat meski bermain dari HP yang berbeda.</div>
          `
        },
        {
          kicker: 'Bab 5 · Mabar',
          title: 'Room multiplayer dengan teman sekelas',
          html: `
            <p>Tab Mabar membuka room yang sedang berjalan di perangkat lain. Kamu bisa membuat room baru, memasukkan PIN room enam angka untuk bergabung, atau ikut menonton dulu.</p>
            <ol>
              <li>Buat room, pilih game dan tingkat kesulitan, lalu bagikan PIN-nya.</li>
              <li>Undang teman dari daftar akun, atau tunggu mereka masuk sendiri lewat PIN.</li>
              <li>Tetapkan karakter agar tidak sama dengan pemain lain.</li>
              <li>Setiap ronde selesai, skor terkirim ke server dan papan peringkat diperbarui di semua perangkat.</li>
            </ol>
            <div class="page-callout"><b>Syarat:</b> mode online lewat Mulai-NEKO.bat dan WiFi yang sama. Daftar game yang bisa dibarengkan adalah game arena kecuali Who Is The Spy.</div>
          `
        },
        {
          kicker: 'Bab 6 · Pesan dan Teman',
          title: 'Mengobrol dan berteman lintas perangkat',
          html: `
            <p>Tab Pesan punya empat bagian: percakapan, daftar teman, permintaan masuk, dan cari akun.</p>
            <ul>
              <li>Cari username teman, lalu kirim <strong>permintaan berteman</strong>.</li>
              <li>Setelah diterima, percakapan langsung terbuka dan berjalan realtime.</li>
              <li>Indikator sedang mengetik dan penanda pesan belum dibaca muncul di bilah notifikasi.</li>
            </ul>
            <div class="page-callout"><b>Riwayat tersimpan di server</b>, jadi chat ikut pindah ketika kamu login di perangkat lain. Fitur ini tidak muncul pada mode lokal, dan halaman akan menampilkan peringatan bahwa Pesan butuh server NEKO.</div>
            <div class="page-quiz"><b>Cek pemahaman</b>Tab Pesan kosong dan muncul peringatan butuh server. Apa yang kurang?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Aplikasi sedang dibuka pada mode lokal; jalankan Mulai-NEKO.bat lalu buka alamat server dari perangkat itu.</div></div>
          `
        },
        {
          kicker: 'Bab 7 · Profil',
          title: 'Gelar, statistik, pengaturan, dan keluar',
          html: `
            <p>Tab Profil terbagi menjadi empat bagian: Profil, Koleksi, Panduan, dan Atur.</p>
            <ul>
              <li><strong>Gelar dan season</strong> berubah seiring total XP, lengkap dengan progress menuju tingkat berikutnya.</li>
              <li><strong>Statistik</strong> mencatat halaman baca, buku tamat, sesi dimainkan, skor terbaik, dan panjang beruntun check-in harian.</li>
              <li><strong>Koleksi</strong> menampilkan badge dan karakter pilihan.</li>
              <li><strong>Atur</strong> berisi dunia tema, mode terang atau gelap, efek suara, suara karakter, musik latar, dan animasi.</li>
            </ul>
            <div class="page-callout"><b>Tombol Keluar</b> ada di bagian paling bawah tab Atur. Progres tetap tersimpan, dan kamu masuk lagi dengan username serta PIN yang sama.</div>
          `
        },
        {
          kicker: 'Bab 8 · Bantuan',
          title: 'Miko, asisten belajarmu, dan kontak pembimbing',
          html: `
            <p>Ketuk maskot kucing di layar untuk membuka obrolan, atau dari tab Profil. Satu asisten memegang semua topik.</p>
            <ul>
              <li><strong>Materi TJKT</strong> — subnet, OSI, VLAN, kabel, IP, WiFi, troubleshooting, dan keamanan.</li>
              <li><strong>Arena &amp; Kelas Langsung</strong> — memilih game, mode kesulitan, dan urusan XP.</li>
              <li><strong>Fitur aplikasi</strong> — tema, check-in harian, buku, dan rekomendasi bacaan.</li>
            </ul>
            <p>Jawaban maskot bisa dibacakan sebagai suara karakter; matikan lewat tab Profil lalu Atur.</p>
            <div class="page-callout"><b>Tab Kontak</b> memuat data guru pembimbing <b>Pak Andy Musly</b>, daftar anggota Kelompok 1, dan formulir laporan bug yang dikirim lewat email perangkat.</div>
            <div class="page-quiz"><b>Cek pemahaman</b>Siapa yang menjawab pertanyaan materi, game, dan fitur aplikasi?<button type="button" data-reveal>Lihat jawaban</button><div class="answer">Miko, satu-satunya AI assistant NEKO. Semua topik dijawabnya sendiri.</div></div>
          `
        },
        {
          kicker: 'Rangkuman',
          title: 'Ringkasan bab',
          html: `
            <ul>
              <li>Mode lokal untuk latihan sendiri, mode online untuk kelas dan teman.</li>
              <li>Setiap halaman baca menambah XP, tamat buku membuka badge.</li>
              <li>Arena mengatur kesulitan dan menyimpan rekor; Kelas Langsung memakai PIN enam angka.</li>
              <li>Mabar dan Pesan hanya aktif saat terhubung ke server.</li>
              <li>Profil mengatur tema, suara, dan tombol keluar.</li>
            </ul>
            <div class="page-callout"><b>Mulai dari mana:</b> check-in di Beranda, baca buku <b>Dasar Desain Grafis</b> sampai tamat, lalu uji ingatanmu lewat game <b>Kartu Memori</b> di Arena dan tantang kelas di <b>Kelas Langsung</b>.</div>
          `
        }
      ]
    }
  ];

  const katalog = window.NEK_MATERIALS = window.NEK_MATERIALS || { books: [], icon: function (n) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + n + '"></use></svg>'; } };
  if (!Array.isArray(katalog.books)) katalog.books = [];
  const sudah = new Set(katalog.books.map(b => b.id));
  books.forEach(b => { if (!sudah.has(b.id)) katalog.books.push(b); });
  window.NEK_MATERIALS_DESAIN = books;
})();
