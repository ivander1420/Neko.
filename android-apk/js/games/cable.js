/* ============================================================
   NEKO · games/cable.js — Lab Kabel
   ============================================================ */
(function () {
  'use strict';
  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};
  const { esc, shuffle } = Neko.util;
  const { icon } = Neko.icons;

  const mix = (a, pct, b) => 'color-mix(in oklab, var(' + a + ') ' + pct + '%, var(' + b + '))';
  const cables = [
    { id: 'utp', name: 'UTP Cat6', short: 'Tembaga 4 pasang twisted pair', color: 'var(--accent)' },
    { id: 'stp', name: 'STP', short: 'Twisted pair dengan pelindung foil', color: 'var(--accent-2)' },
    { id: 'fiber', name: 'Fiber Optic', short: 'Mengirim data melalui cahaya', color: 'var(--warn)' },
    { id: 'coax', name: 'Coaxial', short: 'Kabel antena TV & kamera analog', color: 'var(--danger)' },
    { id: 'rj45', name: 'Konektor RJ45', short: 'Konektor delapan pin untuk UTP', color: 'var(--success)' },
    { id: 'rj11', name: 'Konektor RJ11', short: 'Konektor empat pin kabel telepon', color: mix('--muted', 62, '--accent-2') },
    { id: 'console', name: 'Kabel Console', short: 'Konfigurasi perangkat lewat port serial', color: mix('--accent-3', 70, '--accent') },
    { id: 'patch', name: 'Patch Panel', short: 'Titik terminasi kabel dari ruang kerja', color: mix('--warn', 58, '--danger') },
    { id: 'power', name: 'Kabel Power', short: 'Menyalurkan listrik ke perangkat', color: mix('--warn', 72, '--success') },
    { id: 'usb', name: 'Kabel USB', short: 'Menghubungkan periferal jarak dekat', color: mix('--accent-2', 62, '--danger') }
  ];

  Neko.games.cable = {
    mount(ctx) {
      const totalBoards = Math.max(1, ctx.config.rounds || 2);
      let board = 1;
      let score = 0;
      let boardItems = [];
      let pool = [];
      let slots = [];
      let selected = null;
      let checked = false;

      function setupBoard() {
        boardItems = shuffle(cables).slice(0, 5);
        pool = shuffle(boardItems.map(item => item.id));
        slots = boardItems.map(() => null);
        selected = null;
        checked = false;
        render();
      }

      function hud() {
        ctx.setHUD([
          { icon: 'grid', label: 'Papan ' + board + '/' + totalBoards },
          { icon: 'target', label: score + ' poin' },
          { icon: 'layers', label: slots.filter(Boolean).length + '/5 terisi' }
        ]);
      }

      function itemById(id) {
        return cables.find(item => item.id === id);
      }

      function render() {
        const allFilled = slots.every(Boolean);
        ctx.setStage(
          '<div class="g-panel">' +
          '<div class="g-title"><div><span class="g-sub">PAPAN ' + board + '</span><h2>Pasangkan media dengan fungsinya</h2></div><span class="g-progress-text">' + score + ' poin</span></div>' +
          '<div class="g-progress"><span style="width:' + ((board - 1) / totalBoards) * 100 + '%"></span></div>' +
          '<p class="spy-hint" style="margin-top:8px">Ketuk fungsi di kanan, lalu ketuk nama kabel di kiri. Ketuk slot terisi untuk melepas.</p>' +
          '<div class="cable-board">' +
          '<div class="cable-slots"><span class="cable-label">Nama kabel</span>' +
          boardItems.map((item, index) => {
            const chosen = slots[index] ? itemById(slots[index]) : null;
            return '<div class="cable-slot ' + (chosen ? 'filled' : '') + ' ' + (checked && chosen ? (chosen.id === item.id ? 'valid' : 'invalid') : '') + ' ' + (selected === 'slot-' + index ? 'filled' : '') + '" data-slot="' + index + '">' +
              '<span class="num">' + (index + 1) + '</span>' +
              (chosen ? '<span class="swatch" style="background:' + chosen.color + '"></span><span>' + esc(chosen.name) + '</span><span class="remove" data-remove="' + index + '">' + icon('close') + '</span>' : '<span>' + esc(item.name) + '</span>') +
              '</div>';
          }).join('') + '</div>' +
          '<div class="wire-pool"><span class="cable-label">Fungsi / ciri</span>' +
          pool.map(id => {
            const item = itemById(id);
            const used = slots.includes(id);
            return '<button type="button" class="wire-chip" data-chip="' + id + '" ' + (used || checked ? 'disabled' : '') + '>' +
              '<span class="swatch" style="background:' + item.color + '"></span><span>' + esc(item.short) + '</span></button>';
          }).join('') + '</div>' +
          '</div>' +
          '<div class="g-actions end"><button type="button" class="btn btn-primary" data-check ' + (allFilled && !checked ? '' : 'disabled') + '>' + icon('check-circle') + 'Periksa papan</button></div>' +
          (checked ? '<div class="g-feedback show ' + (slots.every((id, index) => id === boardItems[index].id) ? 'ok' : 'no') + '"><b>Papan diperiksa</b><p>' + slots.filter((id, index) => id === boardItems[index].id).length + ' dari 5 pasangan tepat.</p></div>' : '') +
          '</div>'
        );
        hud();
        bindStage();
      }

      function bindStage() {
        ctx.frame.querySelectorAll('[data-chip]').forEach(button => {
          button.addEventListener('click', () => {
            if (checked) return;
            selected = button.dataset.chip;
            ctx.frame.querySelectorAll('[data-chip]').forEach(node => node.classList.toggle('on', node === button));
            Neko.audio.play('select');
          });
        });
        ctx.frame.querySelectorAll('[data-slot]').forEach(slot => {
          slot.addEventListener('click', event => {
            if (checked) return;
            const index = Number(slot.dataset.slot);
            if (event.target.closest('[data-remove]')) {
              slots[index] = null;
              Neko.audio.play('tap');
              render();
              return;
            }
            if (!selected) {
              if (slots[index]) {
                selected = slots[index];
                slots[index] = null;
                Neko.audio.play('tap');
                render();
                ctx.frame.querySelectorAll('[data-chip]').forEach(node => node.classList.toggle('on', node.dataset.chip === selected));
              }
              return;
            }
            const occupied = slots.indexOf(selected);
            if (occupied >= 0) slots[occupied] = null;
            slots[index] = selected;
            selected = null;
            Neko.audio.play('tap');
            render();
          });
        });
        const check = ctx.frame.querySelector('[data-check]');
        if (check) check.addEventListener('click', checkBoard);
      }

      function checkBoard() {
        checked = true;
        const correct = slots.filter((id, index) => id === boardItems[index].id).length;
        score += correct * 20;
        Neko.audio.play(correct >= 4 ? 'success' : 'error');
        render();
        const actions = ctx.frame.querySelector('.g-actions.end');
        actions.innerHTML = '<button type="button" class="btn btn-primary" data-next-board>' + (board >= totalBoards ? 'Lihat hasil' : 'Papan berikutnya') + icon('arrow-right') + '</button>';
        actions.querySelector('[data-next-board]').addEventListener('click', () => {
          board += 1;
          if (board > totalBoards) finish();
          else setupBoard();
        });
      }

      function finish() {
        const max = totalBoards * 100;
        const won = score >= max * .6;
        const xp = 14 + Math.round(score / 8);
        ctx.finish({
          title: won ? 'Teknisi kabel siap praktik' : 'Hampir hafal semua kabel',
          message: won ? 'Kamu bisa membedakan media dan konektor dengan cepat. Siap untuk praktik laboratorium.' : 'Baca lagi buku Hardware & Kabel, lalu ulangi papan ini.',
          won, score, xp,
          stats: [
            { label: 'Poin', value: String(score) },
            { label: 'Papan', value: String(totalBoards) },
            { label: 'Maksimal', value: String(max) }
          ]
        });
      }

      setupBoard();
    }
  };
})();
