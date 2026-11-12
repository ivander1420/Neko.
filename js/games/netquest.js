/* ============================================================
   NEKO · games/netquest.js — Petualangan Jaringan
   50 game mini bertema jaringan & TJKT (bukan kuis teori):
   pilih jawaban, susun urutan, ketik perintah, dan refleks.
   Satu sesi mengacak dari kumpulan data/netgames.js.
   ============================================================ */
(function () {
  'use strict';
  const Neko = window.Neko || {};
  Neko.games = Neko.games || {};
  const { esc, shuffle, clamp } = Neko.util;
  const { icon } = Neko.icons;

  const TONE = {
    cyan: 'tone(0)', amber: 'tone(1)', rose: 'tone(2)', lime: 'tone(3)',
    violet: 'tone(4)', sky: 'tone(5)', teal: 'tone(6)', orange: 'tone(7)'
  };
  const COLORS = {
    cyan: '#22d3ee', amber: '#f59e0b', rose: '#fb7185', lime: '#a3e635',
    violet: '#a78bfa', sky: '#38bdf8', teal: '#2dd4bf', orange: '#fb923c'
  };

  function pool() {
    return (window.NEK_NETGAMES || []).slice();
  }

  Neko.games.netquest = {
    mount(ctx) {
      const all = pool();
      const count = clamp(Number(ctx.config.rounds) || 8, 3, Math.min(12, all.length));
      const deck = shuffle(all).slice(0, count);
      let index = 0;
      let score = 0;
      let correct = 0;
      let answered = 0;
      let finished = false;
      let reactionTimer = null;
      ctx.cleanup(() => { if (reactionTimer) window.clearTimeout(reactionTimer); });

      function hud() {
        ctx.setHUD([
          { icon: 'list', label: (index + 1) + '/' + count },
          { icon: 'target', label: score + ' poin' }
        ]);
      }

      function next() {
        index += 1;
        if (index >= deck.length) return finish();
        const item = deck[index];
        if (item.type === 'pilih') renderPilih(item);
        else if (item.type === 'urut') renderUrut(item);
        else if (item.type === 'ketik') renderKetik(item);
        else renderReaksi(item);
        hud();
      }

      function head(item, extra) {
        return '<div class="g-title"><div><span class="g-sub" style="color:' + (COLORS[item.color] || '#22d3ee') + '">' +
          esc(item.name) + ' · Game ' + item.id + '/50</span><h2>' + esc(item.name) + '</h2></div>' +
          '<span class="g-progress-text">' + score + ' poin</span></div>' +
          '<div class="g-progress"><span style="width:' + (index / count) * 100 + '%"></span></div>' + extra;
      }

      function feedbackAndNext(item, ok) {
        answered += 1;
        if (ok) { correct += 1; score += 100; Neko.audio.play('success'); ctx.confetti(window.innerWidth / 2, window.innerHeight / 2, 18); }
        else Neko.audio.play('error');
        hud();
        const actions = ctx.frame.querySelector('[data-actions]');
        if (actions) {
          actions.innerHTML = '<div class="g-feedback show ' + (ok ? 'ok' : 'no') + '"><b>' + (ok ? 'Tepat!' : 'Belum tepat') + '</b><p>' + esc(item.e || '') + '</p></div>' +
            '<button type="button" class="btn btn-primary" data-next>' + (index + 1 >= count ? 'Lihat hasil' : 'Lanjut') + icon('arrow-right') + '</button>';
          actions.querySelector('[data-next]').addEventListener('click', () => { Neko.audio.play('tap'); next(); });
        }
      }

      /* ---------------- tipe 1: pilih ---------------- */
      function renderPilih(item) {
        ctx.setStage('<div class="g-panel">' + head(item,
          '<div class="g-question"><small>Pilih jawaban yang benar</small>' + esc(item.q) + '</div>' +
          '<div class="g-answers">' + item.o.map((o, i) =>
            '<button type="button" class="g-answer" data-pick="' + i + '"><span class="g-key">' + String.fromCharCode(65 + i) + '</span><span>' + esc(o) + '</span></button>').join('') +
          '</div><div data-actions></div>') + '</div>');
        ctx.frame.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => {
          const ok = Number(b.dataset.pick) === item.a;
          ctx.frame.querySelectorAll('[data-pick]').forEach((n, i) => {
            n.disabled = true;
            if (i === item.a) n.classList.add('correct');
            if (n === b && !ok) n.classList.add('wrong');
          });
          feedbackAndNext(item, ok);
        }));
      }

      /* ---------------- tipe 2: urut ---------------- */
      function renderUrut(item) {
        const shuffled = shuffle(item.items.map((label, i) => ({ label, i })));
        const picked = [];
        ctx.setStage('<div class="g-panel">' + head(item,
          '<div class="g-question"><small>Ketuk berurutan dari yang pertama</small></div>' +
          '<div class="g-answers" data-urut-pool>' + shuffled.map(o =>
            '<button type="button" class="g-answer" data-order="' + o.i + '"><span>' + esc(o.label) + '</span></button>').join('') +
          '</div>' +
          '<div class="netquest-order" data-urut-slot></div>' +
          '<div data-actions></div>') + '</div>');
        const slot = ctx.frame.querySelector('[data-urut-slot]');
        ctx.frame.querySelectorAll('[data-urut-pool] [data-order]').forEach(b => b.addEventListener('click', () => {
          if (b.disabled) return;
          picked.push(Number(b.dataset.order));
          b.disabled = true;
          b.classList.add('picked');
          const row = document.createElement('span');
          row.textContent = (picked.length) + '. ' + b.textContent.trim();
          slot.appendChild(row);
          Neko.audio.play('tick');
          if (picked.length === item.items.length) {
            const ok = picked.every((v, i) => v === i);
            feedbackAndNext(item, ok);
          }
        }));
      }

      /* ---------------- tipe 3: ketik ---------------- */
      function renderKetik(item) {
        ctx.setStage('<div class="g-panel">' + head(item,
          '<div class="g-question"><small>Tulis jawaban singkat</small>' + esc(item.prompt) + '</div>' +
          '<div class="netquest-typing"><input type="text" data-netquest-input autocomplete="off" spellcheck="false" placeholder="Ketik di sini…">' +
          '<button type="button" class="btn btn-primary" data-netquest-ok>' + icon('check') + '</button></div>' +
          '<div data-actions></div>') + '</div>');
        const input = ctx.frame.querySelector('[data-netquest-input]');
        input.focus();
        const submit = () => {
          const val = String(input.value || '').trim().toLowerCase();
          if (!val) return;
          const ok = item.answers.some(a => val === a.toLowerCase() || val.includes(a.toLowerCase()));
          input.disabled = true;
          feedbackAndNext(item, ok);
        };
        ctx.frame.querySelector('[data-netquest-ok]').addEventListener('click', submit);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
      }

      /* ---------------- tipe 4: reaksi ---------------- */
      function renderReaksi(item) {
        let hits = 0;
        let misses = 0;
        let spawned = 0;
        const total = 12;
        ctx.setStage('<div class="g-panel">' + head(item,
          '<div class="g-question"><small>' + esc(item.desc) + '</small></div>' +
          '<div class="netquest-arena" data-arena></div>' +
          '<div data-actions></div>') + '</div>');
        const arena = ctx.frame.querySelector('[data-arena]');
        hud();

        function spawn() {
          spawned += 1;
          if (spawned > total || finished) return;
          const isTarget = Math.random() < .55;
          const node = document.createElement('button');
          node.type = 'button';
          node.className = 'netquest-cell' + (isTarget ? ' is-target' : ' is-decoy');
          node.textContent = isTarget ? item.target : item.decoy;
          node.style.left = (Math.random() * 74 + 4) + '%';
          node.style.top = (Math.random() * 68 + 6) + '%';
          node.style.animationDuration = (1.5 + Math.random()) + 's';
          node.addEventListener('click', () => {
            if (isTarget) { hits += 1; score += 90; Neko.audio.play('success'); node.classList.add('hit'); }
            else { misses += 1; Neko.audio.play('error'); node.classList.add('miss'); }
            node.disabled = true;
            hud();
          });
          arena.appendChild(node);
          window.setTimeout(() => { if (node.parentNode) node.remove(); }, 2200);
          if (spawned < total) reactionTimer = window.setTimeout(spawn, 850 + Math.random() * 700);
          else reactionTimer = window.setTimeout(() => {
            const ok = hits >= Math.ceil(total * .45) && misses <= 3;
            feedbackAndNext({ e: hits + ' tangkapan, ' + misses + ' salah ketuk.' }, ok);
          }, 2400);
        }
        spawn();
      }

      function finish() {
        if (finished) return;
        finished = true;
        const accuracy = answered ? correct / answered : 0;
        const won = accuracy >= .6;
        const xp = 10 + correct * 6 + (accuracy === 1 ? 15 : 0);
        ctx.finish({
          title: accuracy === 1 ? 'Legenda jaringan!' : accuracy >= .6 ? 'Kerja bagus!' : 'Terus berlatih',
          message: 'Kamu menyelesaikan ' + count + ' game mini TJKT dari koleksi 50 Petualangan Jaringan.',
          won, score, xp,
          correct, answered,
          stats: [
            { label: 'Skor', value: score },
            { label: 'Benar', value: correct + '/' + answered },
            { label: 'Akurasi', value: Math.round(accuracy * 100) + '%' }
          ]
        });
      }

      (async () => {
        await ctx.countdown(3);
        const first = deck[0];
        if (first.type === 'pilih') renderPilih(first);
        else if (first.type === 'urut') renderUrut(first);
        else if (first.type === 'ketik') renderKetik(first);
        else renderReaksi(first);
        hud();
      })();
    }
  };
})();
