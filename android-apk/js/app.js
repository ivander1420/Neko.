/* ============================================================
   NEKO · js/app.js
   Kerangka aplikasi: boot loader, shell tema, navigasi hash,
   dan pemasangan setiap layar.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { esc, formatNumber } = Neko.util;
  const { icon } = Neko.icons;

  const views = {
    home: { label: 'Beranda', short: 'Awal', icon: 'home', render: () => Neko.home.render(), bind: (root) => Neko.home.bind(root) },
    materials: { label: 'Perpustakaan', short: 'Buku', icon: 'books', render: () => Neko.book.render(), bind: (root) => Neko.book.bind(root) },
    arena: { label: 'Game', short: 'Game', icon: 'gamepad', render: () => Neko.arena.render(), bind: (root) => Neko.arena.bind(root) },
    mabar: { label: 'Mabar', short: 'Mabar', icon: 'swords', render: () => Neko.rooms.render(), bind: (root) => Neko.rooms.bind(root) },
    messages: { label: 'Pesan', short: 'Pesan', icon: 'chat', render: () => Neko.friends.render(), bind: (root) => Neko.friends.bind(root) },
    profile: { label: 'Profil', short: 'Profil', icon: 'profile', render: () => Neko.profile.render(), bind: (root) => Neko.profile.bind(root) },
    admin: { label: 'Admin', short: 'Admin', icon: 'shield', render: () => Neko.admin.render(), bind: (root) => Neko.admin.bind(root) }
  };

  /* Kontak tidak lagi menjadi tombol di sidebar/dock — isinya pindah ke tab
     di dalam Profil. Rute lama (#kontak) tetap hidup: membuka Profil pada tab
     Kontak sehingga tautan dan lastView lama tidak rusak. */
  const viewAlias = { kontak: 'profile' };

  const ids = Object.keys(views);
  const app = document.getElementById('app');
  const sidebar = document.getElementById('sidebar');
  const topbar = document.getElementById('topbar');
  const dock = document.getElementById('dock');
  const viewRoot = document.getElementById('view');
  const loader = document.getElementById('loader');
  const loaderBar = document.getElementById('loaderBar');
  const loaderStatus = document.getElementById('loaderStatus');

  let current = 'home';
  let started = false;
  let bound = false;

  function canManage() {
    return Boolean(Neko.admin && Neko.admin.canManage());
  }

  function navIds() {
    return canManage() ? ids : ids.filter(id => id !== 'admin');
  }

  function valid(view) {
    const target = viewAlias[view] || view;
    return ids.includes(target) && (target !== 'admin' || canManage());
  }

  /* Rute lama tetap diterima; kembalikan layar tujuan sebenarnya dan
     buka tab yang sesuai di halaman itu. */
  function resolveView(view) {
    const target = viewAlias[view] || view;
    if (target !== view && Neko.profile && Neko.profile.setTab) Neko.profile.setTab(target === 'profile' ? 'kontak' : 'overview');
    return target;
  }

  function applySidebar() {
    const collapsed = Boolean(Neko.store.prefs.sidebarCollapsed);
    document.documentElement.dataset.sidebar = collapsed ? 'collapsed' : 'open';
  }

  function viewFromLocation() {
    const hash = String(location.hash || '').replace(/^#/, '').toLowerCase();
    return valid(hash) ? resolveView(hash) : null;
  }

  /* Tulisan selalu berada di bawah ikon. Lebar kolom dock diketahui, jadi
     ukuran huruf dicari lewat pengukuran nyata: mulai paling besar sampai muat,
     lalu pakai singkatan bila label penuh tidak muat. Tidak pernah ikon saja. */
  const DOCK_SIZES = [11.5, 11, 10.5, 10, 9.5, 9, 8.5, 8, 7.5, 7];

  function fitDock() {
    const root = document.documentElement;
    if (!dock || !dock.getClientRects().length) return;
    const buttons = Array.prototype.slice.call(dock.querySelectorAll('.dock-btn'));
    if (!buttons.length) return;
    const box = getComputedStyle(dock);
    const pad = (parseFloat(box.paddingLeft) || 0) + (parseFloat(box.paddingRight) || 0);
    const gap = parseFloat(box.columnGap) || parseFloat(box.gap) || 0;
    const avail = dock.clientWidth - pad - gap * (buttons.length - 1);
    if (avail <= 0) return;
    const column = avail / buttons.length;
    const pairs = buttons.map(button => ({
      full: button.querySelector('.dock-label:not(.is-short)'),
      short: button.querySelector('.dock-label.is-short')
    }));

    root.classList.add('dock-measure');
    let choice = null;
    for (const which of ['full', 'short']) {
      for (const size of DOCK_SIZES) {
        root.style.setProperty('--dock-label-size', size + 'px');
        let needed = 0;
        for (const item of pairs) {
          const label = item[which];
          if (label) needed = Math.max(needed, Math.ceil(label.scrollWidth));
        }
        if (needed <= column) {
          choice = { which, size };
          break;
        }
      }
      if (choice) break;
    }
    if (!choice) {
      choice = { which: 'short', size: DOCK_SIZES[DOCK_SIZES.length - 1] };
      root.style.setProperty('--dock-label-size', choice.size + 'px');
    }
    const iconSize = Math.round(Math.max(18, Math.min(23, choice.size * 1.9)));
    root.style.setProperty('--dock-ic-size', iconSize + 'px');
    root.classList.remove('dock-measure');
    if (root.dataset.dockFit !== choice.which) root.dataset.dockFit = choice.which;
  }

  let dockFitTimer = null;
  function scheduleDockFit() {
    window.clearTimeout(dockFitTimer);
    dockFitTimer = window.setTimeout(fitDock, 90);
  }

  /* ---------------- Loader ---------------- */

  function bootLoader() {
    const stages = [
      'Menyiapkan dunia NEKO…',
      'Memuat buku materi TJKT…',
      'Menyalakan arena game…',
      'Membangunkan Miko…',
      'Menyiapkan tema dan suara…'
    ];
    let progress = 0;
    let stage = 0;
    if (loaderStatus) loaderStatus.textContent = stages[0];
    const timer = window.setInterval(() => {
      progress = Math.min(92, progress + 4 + Math.random() * 7);
      if (loaderBar) loaderBar.style.width = progress + '%';
      const nextStage = Math.min(stages.length - 1, Math.floor(progress / 20));
      if (nextStage !== stage && loaderStatus) {
        stage = nextStage;
        loaderStatus.textContent = stages[stage];
      }
    }, 190);

    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
    const minimum = new Promise(resolve => window.setTimeout(resolve, 1450));
    Promise.all([fonts, minimum]).then(async () => {
      window.clearInterval(timer);
      if (loaderStatus) loaderStatus.textContent = Neko.store.session ? 'Menyinkronkan akun dari server…' : 'Siap. Selamat belajar!';
      if (Neko.store.session && Neko.store.session.token && location.protocol !== 'file:') {
        console.log('[NEKO Boot] Memulai restoreSession...');
        const fresh = await Neko.api.restoreSession();
        console.log('[NEKO Boot] restoreSession selesai, data:', fresh);
        if (fresh) {
          console.log('[NEKO Boot] Memulai hydrate...');
          Neko.store.hydrate(fresh);
          console.log('[NEKO Boot] Hydrate selesai.');
        }
      }
      if (loaderBar) loaderBar.style.width = '100%';
      if (loaderStatus) loaderStatus.textContent = 'Siap. Selamat belajar!';
      window.setTimeout(() => {
        if (Neko.store.session) start({ intro: false });
        else Neko.auth.show();
        if (loader) {
          loader.classList.add('is-done');
          window.setTimeout(() => { if (loader.isConnected) loader.remove(); }, 900);
        }
      }, 320);
    });
  }

  /* ---------------- Shell ---------------- */

  function shellHTML() {
    const profile = Neko.store.profile;
    const snap = Neko.seasons.seasonForXP(profile?.xp || 0);
    const session = Neko.store.session || { displayName: 'Siswa', role: 'Member' };
    const unread = Neko.store.unreadCount();
    const range = formatNumber(profile?.xp || 0) + ' XP';

    if (sidebar) {
      sidebar.innerHTML =
        '<div class="side-brand"><span class="side-brand-mark"><span class="logo-mask"></span></span>' +
        '<span class="side-brand-name"><b>NEKO</b><small>Belajar TJKT</small></span>' +
        '<button type="button" class="side-collapse" data-sidebar-toggle aria-label="' + (Neko.store.prefs.sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar') + '" aria-pressed="' + String(Neko.store.prefs.sidebarCollapsed) + '">' + icon('sidebar') + '</button></div>' +
        '<nav class="side-nav">' + navIds().map(id => (
          '<button type="button" class="side-link ' + (id === current ? 'on' : '') + '" data-nav="' + id + '" title="' + views[id].label + '">' + icon(views[id].icon) + '<span>' + views[id].label + '</span></button>'
        )).join('') + '</nav>' +
        '<div class="side-season">' +
        '<span class="kicker">SEASON ' + snap.season.id + ' · ' + esc(snap.season.short).toUpperCase() + '</span>' +
        '<b>' + esc(snap.season.title) + '</b>' +
        '<p>' + (snap.next ? formatNumber(snap.xpToNext) + ' XP lagi menuju ' + esc(snap.next.short) : 'Kamu sudah di puncak Legenda') + '</p>' +
        '<div class="progress thin" style="margin-top:9px"><span style="width:' + snap.progress.toFixed(1) + '%"></span></div>' +
        '<button type="button" class="btn btn-ghost btn-sm" style="margin-top:9px;width:100%" data-season="' + snap.season.id + '">' + icon('info') + 'Detail season</button>' +
        '</div>' +
        '<div class="side-foot">NEKO</div>';
    }

    if (topbar) {
      topbar.innerHTML =
        '<div class="topbar-inner">' +
        '<div class="top-brand"><span class="top-brand-mark"><span class="logo-mask"></span></span>' +
        '<span class="top-brand-copy"><b>NEKO</b><small>Media belajar</small></span></div>' +
        '<div class="top-xp" id="topXp">' +
        '<div class="top-xp-line"><b>' + esc(snap.season.title) + '</b><span>' + range + '</span></div>' +
        '<div class="progress"><span style="width:' + snap.progress.toFixed(1) + '%"></span></div>' +
        '</div>' +
        '<div class="top-actions">' +
        '<button type="button" class="top-action" data-notifications aria-label="Notifikasi">' + icon('bell') + (unread ? '<span class="badge-dot"></span>' : '') + '</button>' +
        '<button type="button" class="top-action" data-open-leaderboard aria-label="Leaderboard">' + icon('ranking') + '</button>' +
        '<button type="button" class="top-action" data-top-audio aria-label="Suara"></button>' +
        '<button type="button" class="top-action top-hide-mobile" data-top-music aria-label="Musik" aria-pressed="' + String(Neko.audio.musicOn) + '">' + icon('music') + '</button>' +
        '<button type="button" class="top-action" data-top-mode aria-label="Ganti mode terang atau gelap" title="Mode terang / gelap">' + icon('moon') + '</button>' +
        '<button type="button" class="top-action top-hide-xs" data-open-theme aria-label="Ganti tema">' + icon('palette') + '</button>' +
        '<button type="button" class="top-user" data-nav="profile" aria-label="Buka profil">' +
        '<span class="top-user-avatar">' + (session.avatarMedia || session.avatar
        ? '<img src="' + esc(session.avatarMedia || session.avatar) + '" alt="">'
        : esc(Neko.util.initials(session.displayName))) + '</span>' +
        '<span class="top-user-name">' + esc(session.displayName) + '</span>' +
        '</button>' +
        '</div></div>';
    }

    if (dock) {
      const list = navIds();
      dock.style.setProperty('--dock-cols', list.length);
      dock.innerHTML = list.map(id => (
        '<button type="button" class="dock-btn ' + (id === current ? 'on' : '') + '" data-nav="' + id + '" aria-label="' + views[id].label + '">' +
        '<span class="dock-ic">' + icon(views[id].icon) + '</span>' +
        '<span class="dock-label">' + views[id].label + '</span>' +
        '<span class="dock-label is-short">' + (views[id].short || views[id].label) + '</span></button>'
      )).join('');
      fitDock();
    }

    if (Neko.ui) Neko.ui.refreshAudioButtons();
  }

  function bindShell() {
    if (bound) return;
    bound = true;

    if (sidebar) {
      sidebar.addEventListener('click', event => {
        const nav = event.target.closest('[data-nav]');
        if (nav) { Neko.audio.play('select'); go(nav.dataset.nav); return; }
        if (event.target.closest('[data-sidebar-toggle]')) {
          const next = !Neko.store.prefs.sidebarCollapsed;
          Neko.store.patchPrefs({ sidebarCollapsed: next });
          applySidebar();
          shellHTML();
          Neko.audio.play('toggle');
          Neko.ui.toast(next ? 'Sidebar disembunyikan' : 'Sidebar dibuka', next ? 'Layar lebih lega. Tekan ikon lagi untuk membuka.' : 'Navigasi lengkap kembali tampil.', 'info', 'sidebar');
          return;
        }
        const season = event.target.closest('[data-season]');
        if (season) { Neko.home.seasonSheet(season.dataset.season); }
      });
    }

    document.addEventListener('click', event => {
      if (event.target.closest('[data-open-leaderboard]') && !event.target.closest('#topbar')) {
        Neko.audio.play('select');
        Neko.ui.leaderboardSheet();
        return;
      }
      const goButton = event.target.closest('[data-go]');
      if (goButton && !goButton.closest('[data-nav]')) {
        const target = goButton.dataset.go;
        if (valid(target)) {
          Neko.audio.play('select');
          Neko.ui.closeTop();
          window.setTimeout(() => go(target), 140);
        }
      }
    });

    if (topbar) {
      topbar.addEventListener('click', event => {
        if (event.target.closest('[data-notifications]')) { Neko.audio.play('select'); Neko.ui.notificationsSheet(); return; }
        if (event.target.closest('[data-open-leaderboard]')) { Neko.audio.play('select'); Neko.ui.leaderboardSheet(); return; }
        if (event.target.closest('[data-top-audio]')) { Neko.audio.setSound(!Neko.audio.soundOn); return; }
        if (event.target.closest('[data-top-music]')) { Neko.audio.setMusic(!Neko.audio.musicOn); return; }
        if (event.target.closest('[data-top-mode]')) {
          Neko.audio.play('toggle');
          Neko.theme.toggleMode({ x: event.clientX, y: event.clientY });
          return;
        }
        if (event.target.closest('[data-open-theme]')) { Neko.audio.play('select'); Neko.ui.themeSheet(); return; }
        const nav = event.target.closest('[data-nav]');
        if (nav) { Neko.audio.play('select'); go(nav.dataset.nav); }
      });
    }

    if (dock) {
      dock.addEventListener('click', event => {
        const nav = event.target.closest('[data-nav]');
        if (!nav) return;
        Neko.audio.play('select');
        go(nav.dataset.nav);
      });
      window.addEventListener('resize', scheduleDockFit);
      window.addEventListener('orientationchange', scheduleDockFit);
      if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
        document.fonts.ready.then(() => fitDock()).catch(() => {});
      }
    }

    document.addEventListener('neko:xp', () => { if (started) shellHTML(); });
    document.addEventListener('neko:profile', () => { if (started) shellHTML(); });
    document.addEventListener('neko:notifications', () => { if (started) shellHTML(); });
    document.addEventListener('neko:community', () => { if (started) shellHTML(); });

    window.addEventListener('popstate', route);
    window.addEventListener('hashchange', route);
  }

  function route() {
    if (!started) return;
    const target = viewFromLocation();
    if (!target || target === current) return;
    current = target;
    render();
  }

  /* ---------------- Render ---------------- */

  function render() {
    if (!started) return;
    const info = views[current] || views.home;
    shellHTML();
    if (!viewRoot) return;
    let html = '';
    try {
      html = info.render();
    } catch (error) {
      html = '<div class="empty-state"><span class="empty-ic">' + icon('warning') + '</span><h3>Layar gagal dimuat</h3><p>' + esc(error.message) + '</p></div>';
    }
    viewRoot.innerHTML = '<div class="view on" data-view="' + current + '">' + html + '</div>';
    const node = viewRoot.firstElementChild;
    try {
      info.bind(node);
    } catch (error) {
      /* biarkan layar tetap tampil walau pengikatan gagal */
    }
    document.title = 'NEKO · ' + info.label;
    if (Neko.fx) Neko.fx.unlock();
    document.dispatchEvent(new CustomEvent('neko:view', { detail: { view: current } }));
  }

  function refresh() {
    if (!started) return;
    render();
  }

  function refreshTheme() {
    if (!started) return;
    render();
  }

  function go(view, options = {}) {
    const aliased = Boolean(viewAlias[view]);
    view = resolveView(view);
    if (!valid(view)) return false;
    if (!Neko.store.profile) return false;
    if (view === current && !options.force) {
      if (aliased) render();
      window.scrollTo({ top: 0, behavior: Neko.util.reducedMotion() ? 'auto' : 'smooth' });
      return true;
    }
    current = view;
    Neko.store.patchPrefs({ lastView: view });
    if (location.hash !== '#' + view) {
      try { history.pushState({ view }, '', '#' + view); } catch (error) { location.hash = view; }
    }
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
    return true;
  }

  function start(options = {}) {
    if (!app) return;
    const profile = Neko.store.profile;
    if (!profile) { Neko.auth.show(); return; }
    started = true;
    app.hidden = false;
    Neko.auth.hide();
    applySidebar();
    Neko.theme.applyDom(Neko.store.prefs);
    Neko.scenes.render(Neko.store.prefs.theme, Neko.store.prefs.mode);
    current = viewFromLocation() || (valid(Neko.store.prefs.lastView) ? resolveView(Neko.store.prefs.lastView) : 'home');
    bindShell();
    render();
    Neko.mascot.mount();
    if (Neko.community) Neko.community.submitSelf();
    if (Neko.api) Neko.api.startEvents();
    if (options.intro) {
      window.setTimeout(() => {
        if (Neko.intro && !Neko.intro.isSeen()) Neko.intro.play({ name: profile.displayName });
        else if (Neko.auth && Neko.auth.intro) Neko.auth.intro(profile.displayName);
      }, 320);
    }
    document.dispatchEvent(new CustomEvent('neko:app-start'));
  }

  document.addEventListener('neko:logout', () => {
    started = false;
    if (Neko.api) Neko.api.stopEvents();
    if (Neko.live) Neko.live.unsubscribe();
    Neko.mascot.unmount();
    if (viewRoot) viewRoot.innerHTML = '';
  });

  function boot() {
    Neko.icons.hydrate(document);
    Neko.theme.init();
    Neko.scenes.render(Neko.store.prefs.theme, Neko.store.prefs.mode);
    Neko.audio.init();
    if (Neko.nobar) Neko.nobar.init();
    if (Neko.community) Neko.community.init();
    if (Neko.fx) Neko.fx.init();
    Neko.auth.init();
    bootLoader();
  }

  Neko.app = {
    boot, start, render, refresh, refreshTheme, go,
    get currentView() { return current; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();