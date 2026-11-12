/* ============================================================
   NEKO · games/quiz.js — Kuis Kilat TJKT
   ============================================================ */
(function () {
  'use strict';
  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};
  const { esc, shuffle, clamp } = Neko.util;
  const { icon } = Neko.icons;

  function poolFor(level) {
    const all = window.NEK_QUIZ?.questions || [];
    if (level === 'santai') return all.filter(item => item.level === 'Mudah');
    if (level === 'tantangan') return all.filter(item => item.level !== 'Mudah');
    return all;
  }

  Neko.games.quiz = {
    mount(ctx) {
      const count = clamp(Number(ctx.config.rounds) || 8, 3, 12);
      const pool = shuffle(poolFor(ctx.config.level).length >= count ? poolFor(ctx.config.level) : (window.NEK_QUIZ?.questions || [])).slice(0, count);
      const limit = ctx.difficulty.limit;
      const bonus = ctx.difficulty.bonus;
      let index = 0;
      let score = 0;
      let correct = 0;
      let answered = 0;
      let locked = false;
      let timer = null;
      let remaining = limit;
      let started = false;

      ctx.setHUD([{ icon: 'list', label: '0/' + count }, { icon: 'target', label: '0 poin' }, { icon: 'timer', label: limit + 's' }]);
      ctx.cleanup(() => window.clearInterval(timer));

      function hud() {
        ctx.setHUD([
          { icon: 'list', label: (index + 1) + '/' + count },
          { icon: 'target', label: score + ' poin' },
          { icon: 'timer', label: remaining + 's', hot: remaining <= 5 }
        ]);
      }

      function startTimer(onTimeout) {
        remaining = limit;
        if (timer) window.clearInterval(timer);
        timer = window.setInterval(() => {
          if (!started || locked) return;
          remaining -= 1;
          ctx.setHUD([
            { icon: 'list', label: (index + 1) + '/' + count },
            { icon: 'target', label: score + ' poin' },
            { icon: 'timer', label: remaining + 's', hot: remaining <= 5 }
          ]);
          const bar = ctx.frame.querySelector('.g-timer-bar span');
          if (bar) bar.style.width = (remaining / limit) * 100 + '%';
          const wrap = ctx.frame.querySelector('.g-timer');
          if (wrap) wrap.classList.toggle('danger', remaining <= 5);
          if (remaining <= 5 && remaining > 0) Neko.audio.play(remaining <= 3 ? 'timer' : 'tick');
          if (remaining <= 0) {
            window.clearInterval(timer);
            onTimeout();
          }
        }, 1000);
      }

      function question() {
        if (index >= pool.length) return finish();
        locked = false;
        started = true;
        const item = pool[index];
        ctx.setStage(
          '<div class="g-panel">' +
          '<div class="g-title"><div><span class="g-sub">' + esc(item.topic) + ' · ' + esc(item.level) + '</span><h2>Soal ' + (index + 1) + '</h2></div><span class="g-progress-text">' + score + ' poin</span></div>' +
          '<div class="g-progress"><span style="width:' + (index / count) * 100 + '%"></span></div>' +
          '<div class="g-question"><small>' + esc(item.topic) + '</small>' + esc(item.q) + '</div>' +
          '<div class="g-answers">' + item.o.map((option, optionIndex) => (
            '<button type="button" class="g-answer" data-answer="' + optionIndex + '"><span class="g-key">' + String.fromCharCode(65 + optionIndex) + '</span><span>' + esc(option) + '</span></button>'
          )).join('') + '</div>' +
          '<div class="g-timer"><div class="g-timer-bar"><span style="width:100%"></span></div></div>' +
          '<div class="g-feedback" data-feedback></div>' +
          '<div class="g-actions" data-actions></div>' +
          '</div>'
        );
        hud();
        startTimer(() => resolve(null, true));
        ctx.frame.querySelectorAll('[data-answer]').forEach(button => {
          button.addEventListener('click', () => resolve(Number(button.dataset.answer), false));
        });
      }

      function resolve(choice, timedOut) {
        if (locked) return;
        locked = true;
        started = false;
        window.clearInterval(timer);
        const item = pool[index];
        answered += 1;
        const isCorrect = !timedOut && choice === item.a;
        if (isCorrect) {
          correct += 1;
          score += Math.round((100 + remaining * 4) * bonus);
          Neko.audio.play('success');
        } else {
          Neko.audio.play('error');
        }
        ctx.frame.querySelectorAll('.g-answer').forEach((button, optionIndex) => {
          button.disabled = true;
          if (optionIndex === item.a) button.classList.add('correct');
          if (!timedOut && optionIndex === choice && optionIndex !== item.a) button.classList.add('wrong');
        });
        const feedback = ctx.frame.querySelector('[data-feedback]');
        if (feedback) {
          feedback.className = 'g-feedback show ' + (isCorrect ? 'ok' : 'no');
          feedback.innerHTML = '<b>' + (isCorrect ? 'Tepat!' : timedOut ? 'Waktu habis' : 'Belum tepat') + '</b><p>' + esc(item.e) + '</p>';
        }
        const actions = ctx.frame.querySelector('[data-actions]');
        if (actions) {
          actions.innerHTML = '<button type="button" class="btn btn-primary" data-next>' + (index + 1 >= count ? 'Lihat hasil' : 'Soal berikutnya') + icon('arrow-right') + '</button>';
          actions.querySelector('[data-next]').addEventListener('click', () => {
            index += 1;
            Neko.audio.play('tap');
            question();
          });
        }
        ctx.setHUD([{ icon: 'list', label: (index + 1) + '/' + count }, { icon: 'target', label: score + ' poin' }]);
      }

      function finish() {
        const accuracy = answered ? correct / answered : 0;
        const won = accuracy >= .6;
        const xp = 12 + correct * 7 + (accuracy === 1 ? 18 : 0);
        ctx.finish({
          title: accuracy === 1 ? 'Sempurna!' : accuracy >= .6 ? 'Kerja bagus!' : 'Terus berlatih',
          message: accuracy === 1 ? 'Semua jawaban tepat. Kamu siap jadi tutor di kelas.' : accuracy >= .6 ? 'Sebagian besar jawaban tepat. Ulangi untuk skor lebih tinggi.' : 'Baca ulang buku materi lalu coba lagi — kamu pasti bisa.',
          won, score, xp,
          correct, answered,
          stats: [
            { label: 'Skor', value: score },
            { label: 'Benar', value: correct + '/' + answered },
            { label: 'Akurasi', value: Math.round(accuracy * 100) + '%' }
          ]
        });
      }

      function keydown(event) {
        if (event.key >= '1' && event.key <= '4' && !locked) {
          const button = ctx.frame.querySelector('[data-answer="' + (Number(event.key) - 1) + '"]');
          if (button) button.click();
        }
        if (event.key === 'Enter' && locked) {
          const next = ctx.frame.querySelector('[data-next]');
          if (next) next.click();
        }
      }
      document.addEventListener('keydown', keydown);
      ctx.cleanup(() => document.removeEventListener('keydown', keydown));

      (async () => {
        await ctx.countdown(3);
        question();
      })();
    }
  };
})();
