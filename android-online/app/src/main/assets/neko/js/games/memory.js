/* ============================================================
   NEKO · games/memory.js — Kartu Memori
   ============================================================ */
(function () {
  'use strict';
  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};
  const { esc, shuffle } = Neko.util;
  const { icon } = Neko.icons;

  const terms = [
    ['Router', 'Meneruskan paket antarjaringan berbeda'],
    ['Switch', 'Menghubungkan perangkat dalam satu LAN'],
    ['DNS', 'Menerjemahkan nama domain menjadi IP'],
    ['DHCP', 'Membagikan alamat IP secara otomatis'],
    ['Subnet Mask', 'Menentukan bagian network dan host'],
    ['Gateway', 'Pintu keluar menuju jaringan lain'],
    ['VLAN', 'Membagi jaringan logis tanpa perangkat fisik'],
    ['Fiber Optic', 'Media transmisi berbasis cahaya'],
    ['Ping', 'Menguji keterjangkauan host tujuan'],
    ['Firewall', 'Menyaring lalu lintas berdasarkan aturan'],
    ['Bandwidth', 'Kapasitas maksimum jalur komunikasi'],
    ['NAT', 'Menerjemahkan IP privat ke IP publik']
  ];

  Neko.games.memory = {
    mount(ctx) {
      const pairCount = Math.min(terms.length, Math.max(4, ctx.config.rounds || 8));
      const chosen = shuffle(terms.slice()).slice(0, pairCount);
      let cards = [];
      chosen.forEach((pair, index) => {
        cards.push({ key: index + '-a', pair: index, text: pair[0], kind: 'term' });
        cards.push({ key: index + '-b', pair: index, text: pair[1], kind: 'def' });
      });
      cards = shuffle(cards);
      let open = [];
      let done = new Set();
      let moves = 0;
      let busy = false;
      const startedAt = Date.now();
      let clock = null;

      ctx.cleanup(() => window.clearInterval(clock));

      function hud() {
        const seconds = Math.floor((Date.now() - startedAt) / 1000);
        ctx.setHUD([
          { icon: 'memory', label: done.size + '/' + pairCount + ' pasangan' },
          { icon: 'refresh', label: moves + ' langkah' },
          { icon: 'clock', label: seconds + 's' }
        ]);
      }

      function render() {
        ctx.setStage(
          '<div class="g-panel">' +
          '<div class="g-title"><div><span class="g-sub">KARTU MEMORI</span><h2>Temukan pasangan istilah</h2></div><span class="g-progress-text">' + done.size + '/' + pairCount + '</span></div>' +
          '<div class="g-progress"><span style="width:' + (done.size / pairCount) * 100 + '%"></span></div>' +
          '<p class="spy-hint" style="margin-top:8px">Balik dua kartu. Istilah harus bertemu dengan definisi yang tepat.</p>' +
          '<div class="memory-grid">' + cards.map((card, index) => {
            const flipped = open.includes(index) || done.has(card.pair);
            const matched = done.has(card.pair);
            return '<button type="button" class="mem-card ' + (flipped ? 'flip' : '') + ' ' + (matched ? 'done' : '') + '" data-mem="' + index + '" ' + (matched ? 'disabled' : '') + ' aria-label="Kartu ' + (index + 1) + '">' +
              '<span class="mem-inner"><span class="mem-face">' + icon('paw') + '</span>' +
              '<span class="mem-face back"><span style="font-size:' + (card.kind === 'term' ? 'clamp(12px, 2vw, 17px)' : 'clamp(9px, 1.35vw, 12px)') + ';line-height:1.25;padding:6px;text-align:center;font-weight:' + (card.kind === 'term' ? '800' : '600') + '">' + esc(card.text) + '</span></span></span>' +
              '</button>';
          }).join('') + '</div>' +
          '</div>'
        );
        bindCards();
        hud();
      }

      function bindCards() {
        ctx.frame.querySelectorAll('[data-mem]').forEach(button => {
          button.addEventListener('click', () => {
            const index = Number(button.dataset.mem);
            // Blokir klik ganda di kartu yang sama dan kartu yang sudah pas
            if (busy || open.includes(index) || done.has(cards[index].pair)) return;
            open.push(index);
            button.classList.add('flip');
            Neko.audio.play('flip');
            if (open.length === 2) {
              const [a, b] = open;
              if (a === b) { open = [a]; return; }  // kartu sama dua kali: tunggu kartu kedua
              moves += 1;
              if (cards[a].pair === cards[b].pair) {
                done.add(cards[a].pair);
                open = [];
                Neko.audio.play('success');
                window.setTimeout(() => {
                  render();
                  if (done.size === pairCount) window.setTimeout(finish, 600);
                }, 380);
              } else {
                busy = true;
                window.setTimeout(() => {
                  open = [];
                  busy = false;
                  render();
                  Neko.audio.play('error');
                }, 820);
              }
            }
            hud();
          });
        });
      }

      function finish() {
        const seconds = Math.round((Date.now() - startedAt) / 1000);
        const perfect = pairCount * 2;
        const penalty = Math.max(0, moves - pairCount) * 6;
        const score = Math.max(40, Math.round(perfect * 20 - penalty));
        const won = moves <= pairCount * 2;
        ctx.finish({
          title: won ? 'Ingatan tajam!' : 'Pasangan lengkap',
          message: won ? 'Kamu menemukan semua pasangan dengan langkah efisien.' : 'Semua pasangan ketemu. Coba lagi dengan lebih sedikit langkah.',
          won, score,
          xp: 15 + Math.round(pairCount * 2.5) + (won ? 8 : 0),
          minutes: Math.max(1, Math.round(seconds / 60)),
          stats: [
            { label: 'Pasangan', value: String(pairCount) },
            { label: 'Langkah', value: String(moves) },
            { label: 'Waktu', value: seconds + 's' }
          ]
        });
      }

      render();
      clock = window.setInterval(hud, 1000);
    }
  };
})();
