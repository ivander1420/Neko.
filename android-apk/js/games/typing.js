/* ============================================================
   NEKO · js/games/typing.js — Terminal Kilat
   Terinspirasi game mengetik cepat: selesaikan perintah
   Cisco IOS seakurat mungkin sebelum waktu habis.
   ============================================================ */
(function () {
  'use strict';
  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};
  const { clamp } = Neko.util;
  const { icon } = Neko.icons;

  const COMMANDS = [
    { line: 'enable', hint: 'Masuk ke privileged mode.' },
    { line: 'configure terminal', hint: 'Mulai mengubah konfigurasi.' },
    { line: 'hostname ROUTER-1', hint: 'Ganti nama perangkat.' },
    { line: 'interface gigabitEthernet 0/0', hint: 'Masuk ke konfigurasi port.' },
    { line: 'ip address 192.168.10.1 255.255.255.0', hint: 'Pasang IP dan subnet mask.' },
    { line: 'no shutdown', hint: 'Aktifkan interface yang mati.' },
    { line: 'ip route 0.0.0.0 0.0.0.0 10.0.0.2', hint: 'Static route default.' },
    { line: 'show ip interface brief', hint: 'Ringkasan status semua port.' },
    { line: 'show running-config', hint: 'Lihat konfigurasi aktif.' },
    { line: 'copy running-config startup-config', hint: 'Simpan konfigurasi ke NVRAM.' },
    { line: 'ping 8.8.8.8', hint: 'Uji koneksi ke luar.' },
    { line: 'tracert 8.8.8.8', hint: 'Lacak jalur paket ke tujuan.' },
    { line: 'switchport mode trunk', hint: 'Jadikan port sebagai trunk.' },
    { line: 'spanning-tree vlan 1 root primary', hint: 'Tetapkan switch sebagai root bridge.' },
    { line: 'access-list 101 permit ip any any', hint: 'Izinkan semua trafik di ACL.' },
    { line: 'service password-encryption', hint: 'Enkripsi semua password di config.' }
  ];

  Neko.games.typing = {
    mount(ctx) {
      const total = clamp(Number(ctx.config.rounds) || 6, 3, 12);
      const bonus = ctx.difficulty.bonus;
      let order = [];
      let index = 0;
      let score = 0;
      let done = 0;
      let errors = 0;
      let typedChars = 0;
      let correctChars = 0;
      let seconds = 0;
      let tick = null;
      let state = 'idle';

      function shell() {
        ctx.setStage(
          '<div class="g-panel g-type">' +
          '<div class="g-title"><div><span class="g-sub">MODE TERMINAL</span><h2>Ketik perintahnya persis</h2></div>' +
          '<span class="g-progress-text" data-type-clock>0 dtk</span></div>' +
          '<div class="g-progress"><span data-type-progress style="width:0%"></span></div>' +
          '<div class="type-screen"><div class="type-prompt">Router&gt;</div>' +
          '<div class="type-target" data-type-target></div>' +
          '<input class="type-input" data-type-input type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Ketik di sini…">' +
          '</div>' +
          '<p class="spy-hint" data-type-msg>Enter untuk mengirim. Huruf yang benar hijau, yang salah merah.</p>' +
          '</div>', true
        );
        const input = ctx.frame.querySelector('[data-type-input]');
        input.addEventListener('input', compare);
        input.addEventListener('keydown', event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            submit();
          }
        });
        window.setTimeout(() => input.focus(), 120);
      }

      function paintTarget() {
        const item = order[index];
        const node = ctx.frame.querySelector('[data-type-target]');
        const typed = ctx.frame.querySelector('[data-type-input]').value;
        if (!node) return;
        node.innerHTML = item.line.split('').map((char, position) => {
          let cls = '';
          if (position < typed.length) cls = typed[position] === char ? 'ok' : 'no';
          return '<span class="' + cls + '">' + (char === ' ' ? '&nbsp;' : char.replace(/&/g, '&amp;').replace(/</g, '&lt;')) + '</span>';
        }).join('');
        const hint = ctx.frame.querySelector('[data-type-msg]');
        if (hint) hint.textContent = item.hint;
      }

      function compare() {
        const typed = ctx.frame.querySelector('[data-type-input]').value;
        typedChars += 1;
        if (typed.length && typed[typed.length - 1] === order[index].line[typed.length - 1]) correctChars += 1;
        else if (typed.length) errors += 0;
        paintTarget();
      }

      function hud() {
        ctx.setHUD([
          { icon: 'keyboard', label: (done + 1) + '/' + total },
          { icon: 'timer', label: seconds + ' dtk', hot: seconds > 90 },
          { icon: 'target', label: score + ' poin' }
        ]);
        const clock = ctx.frame.querySelector('[data-type-clock]');
        if (clock) clock.textContent = seconds + ' dtk';
        const bar = ctx.frame.querySelector('[data-type-progress]');
        if (bar) bar.style.width = (done / total) * 100 + '%';
      }

      function submit() {
        if (state !== 'play') return;
        const input = ctx.frame.querySelector('[data-type-input]');
        const wanted = order[index].line;
        const value = input.value.trim();
        if (!value) return;
        const exact = value.toLowerCase() === wanted.toLowerCase();
        if (!exact) {
          errors += 1;
          score = Math.max(0, score - 15);
          Neko.audio.play('error');
          const hint = ctx.frame.querySelector('[data-type-msg]');
          if (hint) hint.textContent = 'Belum cocok. Perhatikan tanda baca, spasi, dan angka interface.';
          input.value = '';
          paintTarget();
          hud();
          return;
        }
        const speed = clamp(Math.round(120 - seconds * 1.5), 20, 120);
        score += Math.round((60 + speed) * bonus);
        done += 1;
        index += 1;
        input.value = '';
        Neko.audio.play('success');
        if (index >= order.length) index = 0;
        paintTarget();
        hud();
        if (done >= total) finish();
      }

      function finish() {
        if (state === 'over') return;
        state = 'over';
        clearInterval(tick);
        const accuracy = typedChars ? Math.round((correctChars / typedChars) * 100) : 0;
        const won = done >= total && accuracy >= 80;
        const xp = 6 + done * 5 + Math.round(accuracy / 6);
        const input = ctx.frame.querySelector('[data-type-input]');
        if (input) input.disabled = true;
        ctx.finish({
          title: won ? 'Operator handal!' : 'Masih perlu latihan',
          message: won
            ? 'Perintah Cisco kamu cepat dan rapi. Coba tempo Tantangan dengan perintah trunking dan ACL.'
            : 'Ketikan ' + accuracy + '% akurat. Biasakan menghafal bentuk panjang interface, lalu tekan tab untuk melengkapi.',
          won, score, xp,
          stats: [
            { label: 'Perintah selesai', value: String(done) },
            { label: 'Akurasi', value: accuracy + '%' },
            { label: 'Waktu', value: seconds + ' dtk' }
          ]
        });
      }

      (async () => {
        await ctx.countdown(3);
        order = COMMANDS.slice().sort(() => Math.random() - .5).slice(0, Math.max(4, total));
        state = 'play';
        shell();
        paintTarget();
        hud();
        tick = window.setInterval(() => {
          if (state !== 'play') return;
          seconds += 1;
          hud();
        }, 1000);
        ctx.cleanup(() => clearInterval(tick));
      })();
    }
  };
})();
