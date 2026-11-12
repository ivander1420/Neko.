/* ============================================================
   NEKO · games/subnet.js — Subnet Master
   ============================================================ */
(function () {
  'use strict';
  const Neko = window.Neko = window.Neko || {};
  Neko.games = Neko.games || {};
  const { esc, clamp, shuffle, rand, pick } = Neko.util;
  const { icon } = Neko.icons;

  function ipToInt(ip) {
    return ip.split('.').reduce((acc, part) => (acc << 8) + (Number(part) & 255), 0) >>> 0;
  }

  function intToIp(value) {
    return [24, 16, 8, 0].map(shift => (value >>> shift) & 255).join('.');
  }

  function maskFor(prefix) {
    return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  }

  function randomIp() {
    const base = pick([10, 172, 192, 192, 172]);
    if (base === 10) return '10.' + rand(1, 60) + '.' + rand(0, 255) + '.' + rand(1, 254);
    if (base === 172) return '172.' + rand(16, 31) + '.' + rand(0, 255) + '.' + rand(1, 254);
    return '192.168.' + rand(0, 255) + '.' + rand(1, 254);
  }

  function buildQuestion() {
    const prefix = rand(8, 30);
    const ip = randomIp();
    const ipInt = ipToInt(ip);
    const mask = maskFor(prefix);
    const network = (ipInt & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const hosts = prefix >= 31 ? 0 : Math.pow(2, 32 - prefix) - 2;
    const kind = pick(['network', 'broadcast', 'hosts', 'mask']);
    let prompt = '';
    let answer = '';
    let explanation = '';
    let format = 'ip';

    if (kind === 'network') {
      prompt = 'Berapa network address dari blok ini?';
      answer = intToIp(network);
      explanation = 'Network address didapat dari IP AND subnet mask, sehingga bit host menjadi 0.';
    } else if (kind === 'broadcast') {
      prompt = 'Berapa broadcast address dari blok ini?';
      answer = intToIp(broadcast);
      explanation = 'Broadcast address adalah network address dengan semua bit host diisi 1.';
    } else if (kind === 'hosts') {
      prompt = 'Berapa jumlah host yang bisa dipakai?';
      answer = String(hosts);
      format = 'num';
      explanation = 'Host usable = 2^(32 − prefix) − 2, karena network dan broadcast tidak bisa dipakai.';
    } else {
      prompt = 'Berapa subnet mask untuk prefix /' + prefix + '?';
      answer = intToIp(mask);
      explanation = 'Prefix /' + prefix + ' berarti ' + prefix + ' bit pertama bernilai 1 pada subnet mask.';
    }

    const choices = new Set([answer]);
    const candidates = {
      ip: [
        intToIp((network + Math.pow(2, 32 - prefix)) >>> 0),
        intToIp((network - 1) >>> 0),
        intToIp((network + 1) >>> 0),
        intToIp(network),
        intToIp(broadcast),
        ip
      ],
      num: [String(hosts + 2), String(Math.max(1, hosts / 2)), String(hosts + 1), String(Math.pow(2, 32 - prefix)), String(Math.max(0, hosts - 2))]
    };
    let guard = 0;
    while (choices.size < 4 && guard < 40) {
      const distractor = pick(candidates[format]);
      if (distractor !== answer) choices.add(distractor);
      guard += 1;
    }
    return {
      ip, prefix, mask, network, broadcast, hosts, kind, prompt, answer,
      explanation,
      options: shuffle(Array.from(choices)),
      bits: Array.from({ length: 32 }, (_, index) => index < prefix)
    };
  }

  Neko.games.subnet = {
    mount(ctx) {
      const total = clamp(Number(ctx.config.rounds) || 8, 4, 12);
      const limit = ctx.difficulty.limit;
      const bonus = ctx.difficulty.bonus;
      let index = 0;
      let score = 0;
      let correct = 0;
      let answered = 0;
      let locked = false;
      let remaining = limit;
      let timer = null;
      let current = null;

      ctx.cleanup(() => window.clearInterval(timer));

      function hud() {
        ctx.setHUD([
          { icon: 'list', label: (index + 1) + '/' + total },
          { icon: 'target', label: score + ' poin' },
          { icon: 'timer', label: remaining + 's', hot: remaining <= 5 }
        ]);
      }

      function startTimer() {
        remaining = limit;
        window.clearInterval(timer);
        timer = window.setInterval(() => {
          if (locked) return;
          remaining -= 1;
          hud();
          const bar = ctx.frame.querySelector('.g-timer-bar span');
          if (bar) bar.style.width = (remaining / limit) * 100 + '%';
          if (remaining <= 0) {
            window.clearInterval(timer);
            resolve(null, true);
          }
        }, 1000);
      }

      function render() {
        if (index >= total) return finish();
        current = buildQuestion();
        locked = false;
        ctx.setStage(
          '<div class="g-panel">' +
          '<div class="g-title"><div><span class="g-sub">SOAL ' + (index + 1) + ' DARI ' + total + '</span><h2>Hitung blok subnet</h2></div><span class="g-progress-text">' + score + ' poin</span></div>' +
          '<div class="g-progress"><span style="width:' + (index / total) * 100 + '%"></span></div>' +
          '<div class="subnet-cells">' +
          '<div class="subnet-cell"><label>IP address</label><b style="font-family:var(--font-mono);font-size:15px">' + esc(current.ip) + '</b></div>' +
          '<div class="subnet-cell"><label>Prefix</label><b style="font-family:var(--font-mono);font-size:15px">/' + current.prefix + '</b></div>' +
          '</div>' +
          '<div class="subnet-bits" aria-hidden="true">' + current.bits.map((on, i) => '<i class="' + (on ? '' : 'off') + '" title="bit ' + (i + 1) + '"></i>').join('') + '</div>' +
          '<div class="g-question"><small>' + esc(current.prompt) + '</small></div>' +
          '<div class="g-answers two">' + current.options.map((option, optionIndex) => (
            '<button type="button" class="g-answer" data-answer="' + optionIndex + '"><span class="g-key">' + String.fromCharCode(65 + optionIndex) + '</span><span style="font-family:var(--font-mono)">' + esc(option) + '</span></button>'
          )).join('') + '</div>' +
          '<div class="g-timer" style="margin-top:12px"><div class="g-timer-bar"><span style="width:100%"></span></div></div>' +
          '<div class="g-feedback" data-feedback></div>' +
          '<div class="g-actions" data-actions></div>' +
          '</div>'
        );
        hud();
        startTimer();
        ctx.frame.querySelectorAll('[data-answer]').forEach(button => {
          button.addEventListener('click', () => resolve(Number(button.dataset.answer), false));
        });
      }

      function resolve(choice, timedOut) {
        if (locked) return;
        locked = true;
        window.clearInterval(timer);
        answered += 1;
        const isCorrect = !timedOut && current.options[choice] === current.answer;
        if (isCorrect) {
          correct += 1;
          score += Math.round((120 + remaining * 5) * bonus);
          Neko.audio.play('success');
        } else {
          Neko.audio.play('error');
        }
        ctx.frame.querySelectorAll('.g-answer').forEach((button, optionIndex) => {
          button.disabled = true;
          if (current.options[optionIndex] === current.answer) button.classList.add('correct');
          if (!timedOut && optionIndex === choice && !isCorrect) button.classList.add('wrong');
        });
        const feedback = ctx.frame.querySelector('[data-feedback]');
        if (feedback) {
          feedback.className = 'g-feedback show ' + (isCorrect ? 'ok' : 'no');
          feedback.innerHTML = '<b>' + (isCorrect ? 'Tepat sekali' : timedOut ? 'Waktu habis' : 'Belum tepat') + '</b>' +
            '<p>Jawaban benar: <strong>' + esc(current.answer) + '</strong>. ' + esc(current.explanation) + '</p>';
        }
        const actions = ctx.frame.querySelector('[data-actions]');
        if (actions) {
          actions.innerHTML = '<button type="button" class="btn btn-primary" data-next>' + (index + 1 >= total ? 'Lihat hasil' : 'Soal berikutnya') + icon('arrow-right') + '</button>';
          actions.querySelector('[data-next]').addEventListener('click', () => {
            index += 1;
            Neko.audio.play('tap');
            render();
          });
        }
        ctx.setHUD([{ icon: 'list', label: (index + 1) + '/' + total }, { icon: 'target', label: score + ' poin' }]);
      }

      function finish() {
        const accuracy = answered ? correct / answered : 0;
        const won = accuracy >= .6;
        const xp = 14 + correct * 8 + (accuracy === 1 ? 20 : 0);
        ctx.finish({
          title: accuracy === 1 ? 'Master subnet!' : won ? 'Subnetmu rapi' : 'Latihan lagi, ya',
          message: accuracy === 1 ? 'Semua perhitungan tepat tanpa cela. Kamu siap mengajar subnetting.' : won ? 'Sebagian besar blok subnet sudah tepat. Percepat hitunganmu untuk skor penuh.' : 'Ingat rumus 2^(32−prefix) − 2 dan cara AND dengan subnet mask, lalu coba lagi.',
          won, score, xp, correct, answered,
          stats: [
            { label: 'Poin', value: String(score) },
            { label: 'Benar', value: correct + '/' + answered },
            { label: 'Akurasi', value: Math.round(accuracy * 100) + '%' }
          ]
        });
      }

      function keydown(event) {
        if (!locked) {
          const key = ['a', 'b', 'c', 'd'].indexOf(event.key.toLowerCase());
          const num = Number(event.key) - 1;
          const indexPick = key >= 0 ? key : (num >= 0 && num < 4 ? num : -1);
          if (indexPick >= 0) {
            const button = ctx.frame.querySelector('[data-answer="' + indexPick + '"]');
            if (button) button.click();
          }
        } else if (event.key === 'Enter') {
          const next = ctx.frame.querySelector('[data-next]');
          if (next) next.click();
        }
      }
      document.addEventListener('keydown', keydown);
      ctx.cleanup(() => document.removeEventListener('keydown', keydown));

      (async () => {
        await ctx.countdown(3);
        render();
      })();
    }
  };
})();
