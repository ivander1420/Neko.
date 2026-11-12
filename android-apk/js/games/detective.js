/* ============================================================
   NEKO · games/detective.js — Detektif Jaringan
   ============================================================ */
(function () {
  'use strict';
  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};
  const { esc, clamp, shuffle } = Neko.util;
  const { icon } = Neko.icons;

  const cases = [
    {
      title: 'Lab komputer tanpa internet',
      brief: 'Pagi ini seluruh komputer di Lab 2 tidak bisa membuka internet, padahal kemarin normal.',
      clues: [
        'Lampu indikator pada switch dan router menyala normal.',
        'Komputer mendapat alamat 169.254.x.x secara otomatis.',
        'Guru mencatat listrik sempat padam sekitar 20 menit.',
        'Komputer di Lab 1 bisa internet seperti biasa.'
      ],
      options: ['Kabel fiber backbone putus', 'Layanan DHCP tidak berjalan setelah listrik padam', 'Switch Lab 2 rusak total', 'Alamat DNS salah di semua komputer'],
      answer: 1,
      explanation: 'Alamat 169.254.x.x (APIPA) muncul karena DHCP tidak merespons. Setelah listrik padam, server DHCP di router perlu dinyalakan ulang.'
    },
    {
      title: 'Sinyal hilang di sudut kelas',
      brief: 'Siswa di barisan belakang mengeluh WiFi sangat lambat, sementara meja depan cepat.',
      clues: [
        'Kekuatan sinyal di belakang hanya satu bar.',
        'Kecepatan normal saat perangkat berada dekat access point.',
        'Ada dua dinding beton antara kelas dan access point.',
        'Banyak perangkat memakai frekuensi 2,4 GHz bersamaan.'
      ],
      options: ['Kabel LAN access point longgar', 'Access point terbakar', 'Jangkauan dan interferensi sinyal lemah di area itu', 'Password WiFi salah'],
      answer: 2,
      explanation: 'Dinding tebal melemahkan sinyal dan kanal 2,4 GHz padat. Solusinya menambah access point atau memindahkannya lebih dekat.'
    },
    {
      title: 'Ping jalan, website tidak terbuka',
      brief: 'Sebuah laptop bisa ping 8.8.8.8, tetapi browser gagal membuka google.com.',
      clues: [
        'Ping ke 8.8.8.8 mendapat balasan normal.',
        'Ping ke google.com gagal menemukan alamat.',
        'Konfigurasi IP memakai DHCP.',
        'Tidak ada perubahan pada kabel atau switch.'
      ],
      options: ['Kabel jaringan putus', 'Gateway salah', 'Server DNS tidak dapat dijangkau', 'Bandwidth habis'],
      answer: 2,
      explanation: 'Ping ke IP berhasil tetapi nama domain gagal berarti masalah resolusi nama. Periksa alamat DNS pada konfigurasi jaringan.'
    },
    {
      title: 'Dua PC tidak saling terhubung',
      brief: 'Dua komputer di ruang yang sama tidak bisa saling ping meski kabel sudah diganti.',
      clues: [
        'PC A memakai 192.168.1.10/24.',
        'PC B memakai 192.168.2.10/24.',
        'Kedua PC bisa ping ke gateway masing-masing.',
        'Kabel dan port switch sudah diuji dan normal.'
      ],
      options: ['Kabel UTP terlalu panjang', 'Kedua PC berada di subnet berbeda', 'Switch kekurangan daya', 'Firewall memblokir ICMP'],
      answer: 1,
      explanation: 'Tanpa router yang merutekan 192.168.1.0/24 dan 192.168.2.0/24, kedua PC tidak satu jaringan. Samakan subnet atau gunakan routing.'
    },
    {
      title: 'Kabel baru tidak menyala',
      brief: 'Kabel LAN hasil praktik tidak menghasilkan link saat dicolok ke PC dan switch.',
      clues: [
        'Lampu link pada port switch tidak menyala.',
        'Konektor terlihat longgar saat digoyang.',
        'Tester hanya menyalakan pin 1, 2, 3, dan 6.',
        'Kabel lain di port yang sama berfungsi normal.'
      ],
      options: ['Switch harus diganti', 'PC kehabisan IP', 'Urutan pin tidak lengkap akibat krimping tidak rapi', 'Kabel terlalu pendek'],
      answer: 2,
      explanation: 'Hanya pin 1, 2, 3, dan 6 yang tersambung menandakan pin lain tidak terkrimping. Ulangi krimping dengan urutan T568B dan pastikan semua pin menekan.'
    },
    {
      title: 'Jaringan kantor mati mendadak',
      brief: 'Setelah teknisi menambah satu kabel antar-switch, seluruh jaringan kantor melambat lalu putus.',
      clues: [
        'Lampu port switch berkedip sangat cepat dan bersamaan.',
        'CPU switch mencapai 100%.',
        'Ada kabel baru yang menghubungkan dua switch di dua jalur berbeda.',
        'Memutus kabel baru membuat jaringan pulih.'
      ],
      options: ['Terjadi loop dan broadcast storm', 'Router kehilangan lisensi', 'Kabel power switch salah', 'IP address habis'],
      answer: 0,
      explanation: 'Dua jalur antar-switch tanpa STP membuat frame berputar tanpa henti (broadcast storm). Aktifkan Spanning Tree Protocol atau hapus jalur berlebih.'
    }
  ];

  Neko.games.detective = {
    mount(ctx) {
      const totalCases = clamp(Number(ctx.config.rounds) || 3, 2, cases.length);
      const deck = shuffle(cases).slice(0, totalCases);
      let index = 0;
      let score = 0;
      let correctCount = 0;
      let revealed = 1;
      let locked = false;

      function hud() {
        ctx.setHUD([
          { icon: 'detective', label: 'Kasus ' + (index + 1) + '/' + totalCases },
          { icon: 'target', label: score + ' poin' },
          { icon: 'check-circle', label: correctCount + ' terpecahkan' }
        ]);
      }

      function render() {
        if (index >= totalCases) return finish();
        const item = deck[index];
        locked = false;
        revealed = 1;
        ctx.setStage(
          '<div class="g-panel">' +
          '<div class="g-title"><div><span class="g-sub">KASUS ' + (index + 1) + ' DARI ' + totalCases + '</span><h2>' + esc(item.title) + '</h2></div><span class="g-progress-text">' + score + ' poin</span></div>' +
          '<div class="g-progress"><span style="width:' + (index / totalCases) * 100 + '%"></span></div>' +
          '<div class="detective-scene">' +
          '<h3>' + icon('search') + ' Laporan awal</h3>' +
          '<p class="spy-hint" style="margin:0 0 10px">' + esc(item.brief) + '</p>' +
          '<div class="clue-list" data-clues></div>' +
          '<div class="g-actions" style="margin-top:10px"><button type="button" class="btn btn-soft" data-reveal-clue>' + icon('eye') + 'Buka petunjuk berikutnya</button><span class="chip" data-clue-count>1/' + item.clues.length + ' petunjuk</span></div>' +
          '</div>' +
          '<div class="g-answers two" data-options>' + item.options.map((option, optionIndex) => (
            '<button type="button" class="g-answer" data-answer="' + optionIndex + '"><span class="g-key">' + String.fromCharCode(65 + optionIndex) + '</span><span>' + esc(option) + '</span></button>'
          )).join('') + '</div>' +
          '<div class="g-feedback" data-feedback></div>' +
          '<div class="g-actions" data-actions></div>' +
          '</div>'
        );
        paintClues();
        hud();
        ctx.frame.querySelectorAll('[data-answer]').forEach(button => {
          button.addEventListener('click', () => resolve(Number(button.dataset.answer)));
        });
        const reveal = ctx.frame.querySelector('[data-reveal-clue]');
        if (reveal) reveal.addEventListener('click', () => {
          if (locked || revealed >= item.clues.length) return;
          revealed += 1;
          Neko.audio.play('reveal');
          paintClues();
        });
      }

      function paintClues() {
        const item = deck[index];
        const list = ctx.frame.querySelector('[data-clues]');
        if (!list) return;
        list.innerHTML = item.clues.slice(0, revealed).map((clue, clueIndex) => (
          '<div class="clue found"><span class="clue-ic">' + icon(clueIndex === 0 ? 'info' : 'eye') + '</span><span>' + esc(clue) + '</span></div>'
        )).join('');
        const count = ctx.frame.querySelector('[data-clue-count]');
        if (count) count.textContent = revealed + '/' + item.clues.length + ' petunjuk';
        const reveal = ctx.frame.querySelector('[data-reveal-clue]');
        if (reveal) {
          reveal.disabled = revealed >= item.clues.length || locked;
          reveal.innerHTML = icon('eye') + (revealed >= item.clues.length ? 'Semua petunjuk terbuka' : 'Buka petunjuk berikutnya');
        }
        const progress = ctx.frame.querySelector('.detective-progress');
        if (progress) progress.innerHTML = item.clues.map((_, clueIndex) => '<i class="' + (clueIndex < revealed ? 'on' : '') + '"></i>').join('');
      }

      function resolve(choice) {
        if (locked) return;
        locked = true;
        const item = deck[index];
        const isCorrect = choice === item.answer;
        const earned = isCorrect ? Math.max(40, 130 - (revealed - 1) * 18) : 0;
        score += earned;
        if (isCorrect) { correctCount += 1; Neko.audio.play('success'); }
        else Neko.audio.play('error');
        ctx.frame.querySelectorAll('[data-answer]').forEach((button, optionIndex) => {
          button.disabled = true;
          if (optionIndex === item.answer) button.classList.add('correct');
          if (optionIndex === choice && !isCorrect) button.classList.add('wrong');
        });
        const reveal = ctx.frame.querySelector('[data-reveal-clue]');
        if (reveal) reveal.disabled = true;
        const feedback = ctx.frame.querySelector('[data-feedback]');
        if (feedback) {
          feedback.className = 'g-feedback show ' + (isCorrect ? 'ok' : 'no');
          feedback.innerHTML = '<b>' + (isCorrect ? 'Kasus terpecahkan! +' + earned + ' poin' : 'Belum tepat') + '</b><p>' + esc(item.explanation) + '</p>';
        }
        const actions = ctx.frame.querySelector('[data-actions]');
        if (actions) {
          actions.innerHTML = '<button type="button" class="btn btn-primary" data-next>' + (index + 1 >= totalCases ? 'Lihat hasil' : 'Kasus berikutnya') + icon('arrow-right') + '</button>';
          actions.querySelector('[data-next]').addEventListener('click', () => {
            index += 1;
            Neko.audio.play('tap');
            render();
          });
        }
        hud();
      }

      function finish() {
        const ratio = correctCount / totalCases;
        const won = ratio >= .6;
        const xp = 15 + correctCount * 12;
        ctx.finish({
          title: ratio === 1 ? 'Detektif sempurna' : won ? 'Kasus hampir tuntas' : 'Butuh penyelidikan lanjutan',
          message: ratio === 1 ? 'Semua kasus terpecahkan dengan petunjuk minim. Analisismu tajam.' : won ? 'Sebagian besar kasus berhasil dipecahkan. Buka petunjuk lebih sedikit untuk poin lebih besar.' : 'Baca buku Troubleshooting Jaringan, lalu selidiki lagi dari petunjuk paling awal.',
          won, score, xp,
          stats: [
            { label: 'Poin', value: String(score) },
            { label: 'Kasus', value: correctCount + '/' + totalCases },
            { label: 'Akurasi', value: Math.round(ratio * 100) + '%' }
          ]
        });
      }

      (async () => {
        await ctx.countdown(3);
        render();
      })();
    }
  };
})();
