/* ============================================================
   NEKO · games/osi.js — Menara OSI
   ============================================================ */
(function () {
  'use strict';
  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};
  const { esc, shuffle } = Neko.util;
  const { icon } = Neko.icons;

  const layers = [
    { id: 'application', name: 'Application', num: 7, hint: 'Layanan jaringan untuk pengguna, seperti HTTP dan DNS.' },
    { id: 'presentation', name: 'Presentation', num: 6, hint: 'Format, kompresi, dan enkripsi data.' },
    { id: 'session', name: 'Session', num: 5, hint: 'Membuka, menjaga, dan menutup sesi komunikasi.' },
    { id: 'transport', name: 'Transport', num: 4, hint: 'Segmentasi, port, dan keandalan data (TCP/UDP).' },
    { id: 'network', name: 'Network', num: 3, hint: 'Pengalamatan IP dan pemilihan rute paket.' },
    { id: 'datalink', name: 'Data Link', num: 2, hint: 'Frame, MAC address, dan deteksi error per tautan.' },
    { id: 'physical', name: 'Physical', num: 1, hint: 'Sinyal listrik, kabel, dan media transmisi.' }
  ];

  Neko.games.osi = {
    mount(ctx) {
      const totalTowers = Math.max(1, Number(ctx.config.rounds) || 2);
      let tower = 1;
      let score = 0;
      let slots = layers.map(() => null);
      let pool = [];
      let selected = null;
      let checked = false;

      function setup() {
        slots = layers.map(() => null);
        pool = shuffle(layers.map(layer => layer.id));
        selected = null;
        checked = false;
        render();
      }

      function hud() {
        ctx.setHUD([
          { icon: 'layers', label: 'Menara ' + tower + '/' + totalTowers },
          { icon: 'target', label: score + ' poin' },
          { icon: 'grid', label: slots.filter(Boolean).length + '/7 terisi' }
        ]);
      }

      function byId(id) {
        return layers.find(layer => layer.id === id);
      }

      function render() {
        const filled = slots.every(Boolean);
        ctx.setStage(
          '<div class="g-panel">' +
          '<div class="g-title"><div><span class="g-sub">MENARA ' + tower + '</span><h2>Susun tujuh lapisan OSI</h2></div><span class="g-progress-text">' + score + ' poin</span></div>' +
          '<div class="g-progress"><span style="width:' + ((tower - 1) / totalTowers) * 100 + '%"></span></div>' +
          '<p class="spy-hint" style="margin-top:8px">Mulai dari lapisan paling atas (Application) sampai paling bawah (Physical). Ketuk nama lapisan, lalu ketuk tingkatnya.</p>' +
          '<div class="osi-stack">' +
          layers.map((layer, index) => {
            const chosen = slots[index] ? byId(slots[index]) : null;
            const valid = checked && chosen && slots[index] === layer.id;
            return '<div class="osi-slot ' + (chosen ? 'filled' : '') + ' ' + (checked && chosen ? (valid ? 'valid' : 'invalid') : '') + '" data-slot="' + index + '">' +
              '<span class="num">' + layer.num + '</span>' +
              (chosen ? '<span style="font-weight:700">' + esc(chosen.name) + '</span><span class="remove" data-remove="' + index + '">' + icon('close') + '</span>'
                : '<span style="color:var(--muted);font-size:12px">' + (index === 0 ? 'Paling atas' : index === 6 ? 'Paling bawah' : 'Lapisan ' + layer.num) + '</span>') +
              (checked ? '<span style="margin-left:auto;font-size:10.5px;color:' + (valid ? 'var(--success)' : 'var(--danger)') + '">' + (valid ? 'tepat' : layer.name) + '</span>' : '') +
              '</div>';
          }).join('') + '</div>' +
          '<div class="osi-pool">' + pool.map(id => {
            const layer = byId(id);
            const used = slots.includes(id);
            return '<button type="button" class="osi-chip" data-chip="' + id + '" ' + (used || checked ? 'disabled' : '') + '>' + esc(layer.name) + '</button>';
          }).join('') + '</div>' +
          '<div class="g-actions">' +
          '<button type="button" class="btn btn-soft" data-reset ' + (checked ? 'disabled' : '') + '>' + icon('restart') + 'Acak ulang</button>' +
          '<button type="button" class="btn btn-primary" data-check ' + (filled && !checked ? '' : 'disabled') + '>' + icon('check-circle') + 'Periksa menara</button>' +
          '</div>' +
          (checked ? '<div class="g-feedback show ' + (slots.every((id, index) => id === layers[index].id) ? 'ok' : 'no') + '"><b>Menara diperiksa</b><p>' + slots.filter((id, index) => id === layers[index].id).length + ' dari 7 lapisan sudah di posisi tepat.</p></div>' : '') +
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
            button.style.transform = 'translateY(-2px)';
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
                ctx.frame.querySelectorAll('[data-chip]').forEach(node => {
                  if (node.dataset.chip === selected) node.style.transform = 'translateY(-2px)';
                });
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
        if (check) check.addEventListener('click', checkTower);
        const reset = ctx.frame.querySelector('[data-reset]');
        if (reset) reset.addEventListener('click', () => {
          if (checked) return;
          slots = layers.map(() => null);
          pool = shuffle(layers.map(layer => layer.id));
          selected = null;
          Neko.audio.play('whoosh');
          render();
        });
      }

      function checkTower() {
        checked = true;
        const correct = slots.filter((id, index) => id === layers[index].id).length;
        score += correct * 25;
        Neko.audio.play(correct >= 6 ? 'success' : 'error');
        render();
        const actions = ctx.frame.querySelector('.g-actions');
        actions.innerHTML = '<button type="button" class="btn btn-primary" data-next-tower>' + (tower >= totalTowers ? 'Lihat hasil' : 'Menara berikutnya') + icon('arrow-right') + '</button>';
        actions.querySelector('[data-next-tower]').addEventListener('click', () => {
          tower += 1;
          if (tower > totalTowers) finish();
          else setup();
        });
      }

      function finish() {
        const max = totalTowers * 175;
        const won = score >= max * .6;
        const xp = 16 + Math.round(score / 7);
        ctx.finish({
          title: won ? 'Menara OSI kokoh' : 'Menara masih goyah',
          message: won ? 'Urutan tujuh lapisan sudah kamu kuasai. Ingat singkatan "All People Seem To Need Data Processing".' : 'Ulangi dari atas: Application, Presentation, Session, Transport, Network, Data Link, Physical.',
          won, score, xp,
          stats: [
            { label: 'Poin', value: String(score) },
            { label: 'Menara', value: String(totalTowers) },
            { label: 'Maksimal', value: String(max) }
          ]
        });
      }

      setup();
    }
  };
})();
