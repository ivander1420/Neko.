/* ============================================================
   NEKO · js/theme.js
   Delapan dunia tema, mode terang/gelap, warna mobil, animasi
   transisi, dan pembangun pemilih tema.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { icon } = Neko.icons;
  const { clamp } = Neko.util;

  const themes = [
    {
      id: 'paper', name: 'Paper Quest', short: 'Kertas', desc: 'Peta, gulungan & kayu',
      icon: 'scroll', icons: ['scroll', 'map', 'swords', 'feather'],
      preview: { bg: '#241812', a: '#e0ab4b', b: '#b84a3e', c: '#4ba094' },
      meta: '#2a1c16', modes: ['dark', 'light'], world: 'Dunia petualangan kertas',
      defaultMode: 'dark'
    },
    {
      id: 'forest', name: 'Hutan Rimba', short: 'Hutan', desc: 'Gunung, pohon & burung',
      icon: 'tree', icons: ['tree', 'leaf', 'cloud', 'paw'],
      preview: { bg: '#0d2419', a: '#5fd68a', b: '#1f9d63', c: '#ffe08a' },
      meta: '#0a1f16', modes: ['dark', 'light'], world: 'Dunia hutan berkabut'
    },
    {
      id: 'ocean', name: 'Samudra', short: 'Laut', desc: 'Ikan, karang & ombak',
      icon: 'fish', icons: ['fish', 'cloud', 'sparkle', 'star-outline'],
      preview: { bg: '#07345a', a: '#4fe3ff', b: '#0e86c4', c: '#a8f7ff' },
      meta: '#052a45', modes: ['dark', 'light'], world: 'Dunia bawah laut'
    },
    {
      id: 'candy', name: 'Permen Manis', short: 'Pink', desc: 'Boneka, pita & hati',
      icon: 'heart', icons: ['heart', 'bow', 'sparkle', 'cat'],
      preview: { bg: '#3a1830', a: '#ff8cc6', b: '#f45aa8', c: '#ffe1f2' },
      meta: '#3a1830', modes: ['dark', 'light'], world: 'Dunia permen merah muda'
    },
    {
      id: 'red', name: 'Crimson Core', short: 'Merah', desc: 'Lab merah & sirkuit',
      icon: 'bolt', icons: ['bolt', 'server', 'shield', 'crosshair'],
      preview: { bg: '#22070c', a: '#ff4d5e', b: '#ff8a3d', c: '#ffd0c0' },
      meta: '#1b060a', modes: ['dark', 'light'], world: 'Dunia inti merah'
    },
    {
      id: 'car', name: 'Velocity', short: 'Mobil', desc: 'Balap malam & mobil kartun',
      icon: 'steering', icons: ['steering', 'car', 'flag', 'bolt'],
      preview: { bg: '#0a0c14', a: '#ff3d5a', b: '#2f6bff', c: '#ffd166' },
      meta: '#07080f', modes: ['dark'], world: 'Sirkuit balap malam'
    },
    {
      id: 'astronaut', name: 'Orbit NEKO', short: 'Astronot', desc: 'Bintang, meteor & alien',
      icon: 'rocket', icons: ['rocket', 'planet', 'star', 'alien'],
      preview: { bg: '#0c0822', a: '#a78bfa', b: '#34d3ff', c: '#ffd166' },
      meta: '#080516', modes: ['dark', 'light'], world: 'Dunia luar angkasa'
    },
    {
      id: 'default', name: 'Neon Circuit', short: 'Neon', desc: 'Komputer & jaringan',
      icon: 'monitor', icons: ['monitor', 'network', 'server', 'ip'],
      preview: { bg: '#071426', a: '#22e1ff', b: '#7c74ff', c: '#3dffb0' },
      meta: '#07101f', modes: ['dark', 'light'], world: 'Dunia sirkuit neon'
    }
  ];

  const carColors = [
    { id: 'red', name: 'Merah', dot: '#ff3d5a', accent: '#ff3d5a', accent2: '#ff8a5c' },
    { id: 'blue', name: 'Biru', dot: '#2f6bff', accent: '#2f6bff', accent2: '#38d9ff' },
    { id: 'pink', name: 'Pink', dot: '#ff5eb0', accent: '#ff5eb0', accent2: '#ff9ad5' }
  ];

  let switching = false;

  function meta(id) {
    return themes.find(item => item.id === id) || themes[0];
  }

  function current() {
    return {
      theme: document.documentElement.dataset.theme || 'paper',
      mode: document.documentElement.dataset.mode || 'dark',
      car: document.documentElement.dataset.car || 'red'
    };
  }

  function applyDom(prefs) {
    const root = document.documentElement;
    const target = prefs.theme || 'paper';
    const info = meta(target);
    const mode = target === 'car' ? 'dark' : (info.modes.includes(prefs.mode) ? prefs.mode : 'dark');
    root.dataset.theme = target;
    root.dataset.mode = mode;
    root.dataset.car = prefs.car || 'red';
    root.dataset.motion = prefs.motion === 'off' ? 'off' : 'on';
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', info.meta);
    if (Neko.audio) Neko.audio.setTheme(target);
    updateAuthDots();
  }

  function init() {
    applyDom(Neko.store.prefs);
    document.addEventListener('pointerdown', unlockAudio, { once: true });
  }

  function unlockAudio() {
    if (Neko.audio) Neko.audio.startMusic();
  }

  function updateAuthDots() {
    const container = document.getElementById('authThemeDots');
    if (!container) return;
    const active = current().theme;
    container.querySelectorAll('button[data-theme-dot]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeDot === active));
    });
  }

  function buildAuthDots() {
    const container = document.getElementById('authThemeDots');
    if (!container) return;
    container.innerHTML = themes.map(item => (
      '<button type="button" data-theme-dot="' + item.id + '" title="' + item.name + '" aria-label="Tema ' + item.name + '" aria-pressed="false" style="background:linear-gradient(135deg,' + item.preview.a + ',' + item.preview.b + ')"></button>'
    )).join('');
    container.addEventListener('click', event => {
      const button = event.target.closest('[data-theme-dot]');
      if (!button) return;
      Neko.audio.play('select');
      setTheme(button.dataset.themeDot, { x: event.clientX, y: event.clientY });
    });
    updateAuthDots();
  }

  function burst(targetTheme, x, y) {
    const layer = document.getElementById('themeLayer');
    if (!layer) return;
    const info = meta(targetTheme);
    layer.innerHTML = '';
    const wipe = document.createElement('div');
    wipe.className = 'theme-wipe';
    wipe.style.setProperty('--wipe-a', info.preview.a);
    wipe.style.setProperty('--wipe-bg', info.preview.bg);
    wipe.style.setProperty('--tx', x + 'px');
    wipe.style.setProperty('--ty', y + 'px');
    layer.appendChild(wipe);

    const explode = document.createElement('div');
    explode.className = 'theme-burst';
    explode.style.setProperty('--tx', x + 'px');
    explode.style.setProperty('--ty', y + 'px');
    const iconSet = info.icons;
    for (let index = 0; index < 12; index += 1) {
      const node = document.createElement('i');
      const angle = (Math.PI * 2 * index) / 12 + Math.random() * .4;
      const distance = 90 + Math.random() * 160;
      node.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
      node.style.setProperty('--dy', Math.sin(angle) * distance + 'px');
      node.style.setProperty('--rot', (Math.random() * 240 - 120) + 'deg');
      node.style.setProperty('--delay', (Math.random() * .12) + 's');
      node.innerHTML = icon(iconSet[index % iconSet.length]);
      explode.appendChild(node);
    }
    layer.appendChild(explode);
    return wipe;
  }

  function commitTheme(themeId, options = {}) {
    const prefs = Neko.store.prefs;
    const target = meta(themeId);
    const preferredMode = target.defaultMode || prefs.mode;
    const next = {
      ...prefs,
      theme: themeId,
      mode: themeId === 'car' ? 'dark' : (target.modes.includes(preferredMode) ? preferredMode : 'dark')
    };
    Neko.store.patchPrefs(next);
    applyDom(Neko.store.prefs);
    document.dispatchEvent(new CustomEvent('neko:theme', { detail: { ...Neko.store.prefs, themeInfo: target } }));
    if (Neko.app && Neko.app.refreshTheme) Neko.app.refreshTheme();
    if (Neko.scenes && Neko.scenes.render) Neko.scenes.render(themeId, Neko.store.prefs.mode);
    if (Neko.ui && Neko.ui.refreshAudioButtons) Neko.ui.refreshAudioButtons();
    if (!options.silent && Neko.ui && Neko.ui.toast) {
      Neko.ui.toast('Dunia ' + target.name, target.world, 'theme', target.icon);
    }
  }

  function setTheme(themeId, options = {}) {
    const active = current().theme;
    if (themeId === active || switching || !meta(themeId)) return false;
    const x = typeof options.x === 'number' ? options.x : window.innerWidth / 2;
    const y = typeof options.y === 'number' ? options.y : window.innerHeight * .35;
    if (Neko.util.reducedMotion()) {
      commitTheme(themeId, options);
      Neko.audio.play('whoosh');
      return true;
    }
    switching = true;
    const wipe = burst(themeId, x, y);
    Neko.audio.play('whoosh');
    window.setTimeout(() => {
      commitTheme(themeId, options);
      Neko.audio.play('success');
      if (wipe) wipe.classList.add('out');
      window.setTimeout(() => {
        const layer = document.getElementById('themeLayer');
        if (layer) layer.innerHTML = '';
        switching = false;
      }, 560);
    }, 430);
    return true;
  }

  function setMode(mode, options = {}) {
    const active = current();
    const info = meta(active.theme);
    if (!info.modes.includes(mode)) {
      if (Neko.ui) Neko.ui.toast('Mode tidak tersedia', 'Tema ' + info.name + ' hanya memakai mode gelap.', 'warning', 'warning');
      Neko.audio.play('error');
      return false;
    }
    if (mode === active.mode) return true;
    if (Neko.util.reducedMotion()) {
      Neko.store.patchPrefs({ mode });
      applyDom(Neko.store.prefs);
      document.dispatchEvent(new CustomEvent('neko:theme', { detail: Neko.store.prefs }));
      if (Neko.scenes) Neko.scenes.render(active.theme, mode);
      if (Neko.app && Neko.app.refreshTheme) Neko.app.refreshTheme();
      return true;
    }
    const x = typeof options.x === 'number' ? options.x : window.innerWidth / 2;
    const y = typeof options.y === 'number' ? options.y : window.innerHeight * .3;
    switching = true;
    const wipe = burst(active.theme, x, y);
    Neko.audio.play('toggle');
    window.setTimeout(() => {
      Neko.store.patchPrefs({ mode });
      applyDom(Neko.store.prefs);
      document.dispatchEvent(new CustomEvent('neko:theme', { detail: Neko.store.prefs }));
      if (Neko.scenes) Neko.scenes.render(active.theme, mode);
      if (Neko.app && Neko.app.refreshTheme) Neko.app.refreshTheme();
      if (wipe) wipe.classList.add('out');
      window.setTimeout(() => {
        const layer = document.getElementById('themeLayer');
        if (layer) layer.innerHTML = '';
        switching = false;
      }, 560);
    }, 380);
    return true;
  }

  function setCar(color) {
    if (!carColors.some(item => item.id === color)) return false;
    Neko.store.patchPrefs({ car: color, theme: 'car', mode: 'dark' });
    applyDom(Neko.store.prefs);
    document.dispatchEvent(new CustomEvent('neko:theme', { detail: Neko.store.prefs }));
    if (Neko.app && Neko.app.refreshTheme) Neko.app.refreshTheme();
    if (Neko.scenes) Neko.scenes.render('car', 'dark');
    Neko.audio.play('select');
    return true;
  }

  function toggleMode(origin) {
    const active = current();
    const info = meta(active.theme);
    if (!info.modes.includes('light')) {
      if (Neko.ui) Neko.ui.toast('Tema mobil selalu gelap', 'Mode terang dinonaktifkan pada tema Velocity. Pilih tema lain untuk mode terang.', 'warning', 'warning');
      Neko.audio.play('error');
      return;
    }
    setMode(active.mode === 'dark' ? 'light' : 'dark', origin);
  }

  function themeCards() {
    const active = current().theme;
    return themes.map(item => {
      const style = '--tp-bg:' + item.preview.bg + ';--tp-accent:' + item.preview.a + ';--tp-accent2:' + item.preview.b + ';--tp-accent3:' + item.preview.c;
      return (
        '<button type="button" class="theme-card" data-theme-pick="' + item.id + '" aria-pressed="' + String(item.id === active) + '">' +
        '<span class="theme-preview" style="' + style + '"><i></i><i></i><i></i></span>' +
        '<span class="theme-name">' + icon(item.icon) + item.name + '</span>' +
        '<span class="theme-meta">' + item.desc + '</span>' +
        '</button>'
      );
    }).join('');
  }

  function modeCards() {
    const active = current();
    const info = meta(active.theme);
    const lightDisabled = !info.modes.includes('light');
    return (
      '<div class="mode-grid">' +
      '<button type="button" class="mode-card" data-mode-pick="dark" aria-pressed="' + String(active.mode === 'dark') + '"><span class="mode-swatch">' + icon('moon') + '</span><span><b>Gelap</b><small>Nyaman di malam hari</small></span></button>' +
      '<button type="button" class="mode-card ' + (lightDisabled ? 'is-disabled' : '') + '" data-mode-pick="light" aria-pressed="' + String(active.mode === 'light') + '" ' + (lightDisabled ? 'aria-disabled="true" tabindex="-1"' : '') + '><span class="mode-swatch">' + icon('sun') + '</span><span><b>Terang</b><small>' + (lightDisabled ? 'Nonaktif di tema mobil' : 'Cerah dan bersih') + '</small></span></button>' +
      '</div>' +
      (lightDisabled ? '<div class="theme-notice">' + icon('info') + '<span>Tema Velocity selalu memakai mode gelap. Tombol mode terang dinonaktifkan agar tampilan balap tetap konsisten.</span></div>' : '')
    );
  }

  function carColorCards() {
    const active = current().car;
    return (
      '<div class="car-colors">' + carColors.map(color => (
        '<button type="button" class="car-color" data-car-pick="' + color.id + '" aria-pressed="' + String(active === color.id) + '" style="--car-dot:' + color.dot + '"><i></i><span>' + color.name + '</span></button>'
      )).join('') + '</div>'
    );
  }

  function pickerHTML() {
    const active = current();
    return (
      '<section class="setup-section"><span class="setup-label">Dunia tema</span><div class="theme-grid">' + themeCards() + '</div></section>' +
      '<section class="setup-section"><span class="setup-label">Mode tampilan</span><div id="modeCardsWrap">' + modeCards() + '</div></section>' +
      '<section class="setup-section" id="carColorSection" ' + (active.theme === 'car' ? '' : 'hidden') + '><span class="setup-label">Warna mobil</span>' + carColorCards() + '</section>'
    );
  }

  function bindPicker(root) {
    if (!root || root.dataset.themePickerBound) return;
    root.dataset.themePickerBound = 'true';
    root.addEventListener('click', event => {
      const themeButton = event.target.closest('[data-theme-pick]');
      if (themeButton) {
        setTheme(themeButton.dataset.themePick, { x: event.clientX, y: event.clientY });
        window.setTimeout(() => {
          root.querySelectorAll('.theme-card').forEach(card => card.setAttribute('aria-pressed', String(card.dataset.themePick === current().theme)));
          const carSection = root.querySelector('#carColorSection');
          if (carSection) carSection.hidden = current().theme !== 'car';
          const modeWrap = root.querySelector('#modeCardsWrap');
          if (modeWrap) modeWrap.innerHTML = modeCards();
        }, 1000);
        return;
      }
      const modeButton = event.target.closest('[data-mode-pick]');
      if (modeButton) {
        const mode = modeButton.dataset.modePick;
        setMode(mode, { x: event.clientX, y: event.clientY });
        window.setTimeout(() => {
          root.querySelectorAll('[data-mode-pick]').forEach(card => card.setAttribute('aria-pressed', String(card.dataset.modePick === current().mode)));
        }, 1000);
        return;
      }
      const carButton = event.target.closest('[data-car-pick]');
      if (carButton) {
        setCar(carButton.dataset.carPick);
        root.querySelectorAll('[data-car-pick]').forEach(card => card.setAttribute('aria-pressed', String(card.dataset.carPick === current().car)));
      }
    });
  }

  Neko.theme = {
    list: themes, carColors, meta, current, init, setTheme, setMode, setCar, toggleMode,
    applyDom, buildAuthDots, updateAuthDots, pickerHTML, bindPicker, themeCards, modeCards, carColorCards
  };
})();
