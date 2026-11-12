
/* ============================================================
   NEKO · js/intro.js
   Cinematic Introduction — Manual Navigation
   No Auto Advance | Back | Next | Skip | Replay
   ============================================================ */

(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { esc, reducedMotion } = Neko.util;
  const { icon } = Neko.icons;

  const SEEN_KEY = 'neko_cine_intro_v1';

  const TOUR = [
    {
      view: 'home',
      icon: 'home',
      tint: 'var(--accent)',
      title: 'Beranda',
      line: 'XP hari ini, check-in, dan pintasan ke semua dunia.'
    },
    {
      view: 'materials',
      icon: 'books',
      tint: 'var(--warn)',
      title: 'Perpustakaan',
      line: 'Materi TJKT per bab, catatan, dan kuis yang tersimpan.'
    },
    {
      view: 'arena',
      icon: 'gamepad',
      tint: 'var(--accent-2)',
      title: 'Game',
      line: 'Belasan game adu paham: Memory, Spy, Kabel LAN, dan lainnya.'
    },
    {
      view: null,
      icon: 'live',
      tint: 'var(--danger)',
      title: 'Kelas Langsung',
      line: 'Satu PIN, sekelas berlomba bersamaan seperti kuis besar.'
    },
    {
      view: 'messages',
      icon: 'chat',
      tint: 'var(--success)',
      title: 'Pesan & Teman',
      line: 'Tambah teman, ngobrol, dan lihat siapa paling rajin.'
    },
    {
      view: 'profile',
      icon: 'profile',
      tint: 'var(--accent-3)',
      title: 'Profil',
      line: 'Badge, season, koleksi bacaan, dan pengaturan tampilan.'
    }
  ];

  const CAST = [
    {
      id: 'miko',
      tint: 'var(--accent-2)',
      line: 'Aku Miko, teman belajarmu di NEKO. Tanya apa saja soal TJKT — aku tahu semuanya!'
    }
  ];

  let current = null;

  function readFlag(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : raw === '1';
    } catch (_) {
      return fallback;
    }
  }

  function writeFlag(key, value) {
    try {
      localStorage.setItem(key, value ? '1' : '0');
    } catch (_) {}
  }

  function isSeen() {
    return readFlag(SEEN_KEY, false);
  }

  function resetSeen() {
    writeFlag(SEEN_KEY, false);
  }

  function narrationOn() {
    return !Neko.voice || Neko.voice.enabled();
  }

  function sfx(kind) {
    try {
      if (Neko.audio) Neko.audio.play(kind);
    } catch (_) {}
  }

  function haptic() {
    try {
      if (Neko.fx && Neko.fx.haptic) {
        Neko.fx.haptic('soft');
      }
    } catch (_) {}
  }

  function say(text, persona) {
    if (!current || !Neko.voice || !narrationOn()) return;

    Neko.voice.say(text, persona || 'narrator');
  }

  function markup(name) {
    const letters = 'NEKO'.split('').map((ch, index) =>
      '<span style="--d:' + (120 + index * 130) + '">' +
      esc(ch) +
      '</span>'
    ).join('');

    const sparks = Array.from({ length: 16 }, (_, i) =>
      '<b style="left:' + ((i * 37) % 96 + 2) +
      '%;top:' + ((i * 53) % 92 + 3) +
      '%;animation-delay:' + ((i % 7) * .42) +
      's"></b>'
    ).join('');

    const tiles = TOUR.map((tile, index) =>
      '<button type="button" class="cine-tile" data-tile="' +
      index +
      '" style="--tc:' + tile.tint + ';--d:' +
      (index * 110) +
      '"' +
      (tile.view ? ' data-goto="' + tile.view + '"' : '') +
      '>' +
      '<span class="cine-tile-ic">' + icon(tile.icon) + '</span>' +
      '<span><b>' + esc(tile.title) + '</b>' +
      '<small>' + esc(tile.line) + '</small></span>' +
      '</button>'
    ).join('');

    const cats = CAST.map((who, index) => {
      const info =
        (Neko.mascot && Neko.mascot.cast &&
        Neko.mascot.cast[who.id]) ||
        { name: who.id, role: '' };

      return '<button type="button" class="cine-cat" data-cat="' +
        who.id +
        '" style="--cc:' + who.tint + ';--d:' +
        (index * 150) + '">' +
        Neko.mascot.svg(
          who.id,
          'cheer'
        ) +
        '<b>' + esc(info.name) + '</b>' +
        '<i>' + esc(info.role) + '</i>' +
        '<small>' + esc(who.line) + '</small>' +
        '</button>';
    }).join('');

    return (
      '<div class="cine-aura" aria-hidden="true">' +
      '<i></i><i></i><i></i></div>' +

      '<div class="cine-sparks" aria-hidden="true">' +
      sparks + '</div>' +

      '<div class="cine-beam" aria-hidden="true"></div>' +

      '<div class="cine-rail" aria-hidden="true">' +
      '<i></i><i></i><i></i><i></i></div>' +

      '<button type="button" class="cine-voice" data-cine-voice ' +
      'aria-pressed="' + String(narrationOn()) +
      '" aria-label="Narasi suara">' +
      icon(narrationOn() ? 'volume' : 'volume-off') +
      '</button>' +

      '<button type="button" class="cine-skip" data-cine-skip>' +
      'Lewati ' + icon('arrow-right') +
      '</button>' +

      '<div class="cine-stage">' +

      '<section class="cine-scene" data-scene="0">' +
      '<div class="cine-mark"><span class="logo-mask"></span></div>' +
      '<div class="cine-word">' + letters + '</div>' +
      '<p class="cine-tag">Belajar TJKT Sambil Bermain</p>' +
      '</section>' +

      '<section class="cine-scene" data-scene="1">' +
      '<p class="cine-tiles-head">Enam tempat yang akan kamu pakai</p>' +
      '<div class="cine-tiles">' + tiles + '</div>' +
      '</section>' +

      '<section class="cine-scene" data-scene="2">' +
      '<p class="cine-tiles-head">Miko — Teman yang menemani belajarmu</p>' +
      '<div class="cine-cats">' + cats + '</div>' +
      '</section>' +

      '<section class="cine-scene" data-scene="3">' +
      '<div class="cine-go">' +
      '<p class="cine-go-title">Siap belajar, ' +
      esc(name || 'kamu') + '?</p>' +
      '<p class="cine-go-sub">Semua progres tersimpan di akunmu. ' +
      'Mulai dari Beranda, atau langsung buka Kelas Langsung ' +
      'saat guru memberi PIN.</p>' +
      '<button type="button" class="cine-go-btn" data-cine-go>' +
      icon('rocket') + 'Mulai belajar</button>' +
      '<div class="cine-go-chips">' +
      '<span>' + icon('flame') + 'Check-in harian</span>' +
      '<span>' + icon('bolt') + 'XP & badge</span>' +
      '<span>' + icon('live') + 'Kelas Langsung</span>' +
      '</div></div></section>' +

      '</div>' +

      '<div class="cine-controls">' +
      '<button type="button" class="cine-back" data-cine-prev>' +
      icon('arrow-left') + ' Kembali</button>' +

      '<span class="cine-step" data-cine-step>1 / 4</span>' +

      '<button type="button" class="cine-next" data-cine-next>' +
      'Lanjutkan ' + icon('arrow-right') +
      '</button>' +
      '</div>' +

      '<p class="cine-caption" role="status" aria-live="polite">' +
      '<span></span></p>'
    );
  }

  function play(options = {}) {
    if (current) current.close('replace');

    const rm = reducedMotion();

    const node = document.createElement('div');
    node.className = 'cine';
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-label', 'Perkenalan NEKO');
    node.innerHTML = markup(options.name || '');

    document.body.appendChild(node);
    document.documentElement.classList.add('cine-open');

    const scenes = [...node.querySelectorAll('.cine-scene')];
    const dots = [...node.querySelectorAll('.cine-rail i')];

    const caption = node.querySelector('.cine-caption span');
    const prevButton = node.querySelector('[data-cine-prev]');
    const nextButton = node.querySelector('[data-cine-next]');
    const stepLabel = node.querySelector('[data-cine-step]');
    const voiceButton = node.querySelector('[data-cine-voice]');

    let index = 0;
    let closed = false;
    let finish;

    const done = new Promise(resolve => {
      finish = resolve;
    });

    function setCaption(text, spoken, persona) {
      caption.textContent = text;

      caption.style.animation = 'none';
      void caption.offsetWidth;
      caption.style.animation = '';

      if (spoken !== false) {
        say(
          typeof spoken === 'string' ? spoken : text,
          persona || 'narrator'
        );
      }
    }

    function showScene(n, shouldSpeak = true) {
      if (closed) return;

      index = Math.max(0, Math.min(3, n));

      scenes.forEach((scene, i) => {
        scene.classList.toggle('on', i === index);
      });

      dots.forEach((dot, i) => {
        dot.classList.toggle('on', i <= index);
      });

      prevButton.disabled = index === 0;

      nextButton.innerHTML = index === 3
        ? icon('rocket') + ' Mulai Belajar'
        : 'Lanjutkan ' + icon('arrow-right');

      stepLabel.textContent = (index + 1) + ' / 4';

      // Hentikan suara halaman sebelumnya agar tidak bertumpuk.
      if (Neko.voice) Neko.voice.cancel();

      const messages = [
        'Selamat datang di NEKO. Belajar TJKT kini menjadi lebih seru melalui materi, permainan, dan aktivitas bersama teman.',

        'Ini adalah fitur utama NEKO. Kamu bisa menjelajahi Beranda, Perpustakaan, Game, Kelas Langsung, Pesan, dan Profil.',

        'Kenalkan, aku Miko, teman belajarmu di NEKO. Aku tahu semua materi TJKT dan fitur aplikasi ini. Tanya apa saja lewat chat, atau ketik "kuis" untuk diuji.',

        'Semua sudah siap. Jelajahi NEKO, pelajari materi, bermain, dan kumpulkan pengalaman belajar bersama teman.'
      ];

      const captions = [
        'NEKO — Belajar TJKT Sambil Bermain.',
        'Jelajahi setiap fitur NEKO untuk menemukan pengalaman belajar yang kamu butuhkan.',
        'Mereka siap menemani perjalanan belajarmu di NEKO.',
        'Tekan Mulai Belajar untuk masuk ke aplikasi.'
      ];

      setCaption(captions[index], shouldSpeak ? messages[index] : false);

      sfx('whoosh');
    }

    function next() {
      if (index < 3) {
        showScene(index + 1);
      } else {
        close('go');
      }
    }

    function previous() {
      if (index > 0) {
        showScene(index - 1);
      }
    }

    function close(reason) {
      if (closed) return;

      closed = true;

      document.removeEventListener('keydown', onKey);

      if (Neko.voice) Neko.voice.cancel();

      if (reason !== 'replace') {
        writeFlag(SEEN_KEY, true);
      }

      node.classList.add('is-leaving');
      document.documentElement.classList.remove('cine-open');

      window.setTimeout(() => {
        if (node.isConnected) node.remove();
      }, rm ? 60 : 450);

      current = null;

      if (reason !== 'replace') finish(true);
    }

    prevButton.addEventListener('click', () => {
      previous();
      sfx('tick');
    });

    nextButton.addEventListener('click', () => {
      next();
      sfx(index === 3 ? 'success' : 'tick');
      haptic();
    });

    node.addEventListener('click', event => {
      const voice = event.target.closest('[data-cine-voice]');

      if (voice) {
        const nextState = !narrationOn();

        if (Neko.voice) {
          Neko.voice.setEnabled(nextState);
        }

        voice.setAttribute('aria-pressed', String(nextState));
        voice.innerHTML = icon(
          nextState ? 'volume' : 'volume-off'
        );

        sfx('toggle');

        if (nextState) {
          setCaption(caption.textContent);
        }

        return;
      }

      if (event.target.closest('[data-cine-skip]')) {
        close('skip');
        return;
      }

      if (event.target.closest('[data-cine-go]')) {
        close('go');
        return;
      }

      const tile = event.target.closest('[data-goto]');
      if (tile) {
        tile.classList.add('pulse');
        window.setTimeout(() => tile.classList.remove('pulse'), 400);
        const idx = Number(tile.dataset.tile || 0);
        const item = TOUR[idx];
        if (item) {
          setCaption(item.title + ' — ' + item.line, item.line);
          sfx('tap');
        }
        return;
      }

      const cat = event.target.closest('.cine-cat');
      if (cat) {
        cat.classList.add('pulse');
        window.setTimeout(() => cat.classList.remove('pulse'), 400);
        const id = cat.dataset.cat;
        const who = CAST.find(c => c.id === id);
        if (who) {
          const info = (Neko.mascot && Neko.mascot.cast && Neko.mascot.cast[id]) || { name: id };
          setCaption(info.name + ': ' + who.line, 'Halo! Aku ' + info.name + '. ' + who.line, id);
          sfx('tap');
        }
        return;
      }
    });

    function onKey(event) {
      if (event.key === 'Escape') {
        close('key');
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previous();
      }
    }

    document.addEventListener('keydown', onKey);

    current = {
      close: reason => close(reason || 'api')
    };

    showScene(0);

    return done;
  }

  Neko.intro = {
    play,
    isSeen,
    resetSeen,

    get open() {
      return Boolean(current);
    }
  };

})();
