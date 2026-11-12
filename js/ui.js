/* ============================================================
   NEKO · js/ui.js
   Lapisan antarmuka bersama: toast, sheet, dialog, notifikasi,
   pemilih tema cepat, animasi XP, dan konfeti.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { icon } = Neko.icons;
  const { esc, wait, clamp, initials } = Neko.util;
  const overlayRoot = document.getElementById('overlayRoot');
  const toastRoot = document.getElementById('toastRoot');
  const fxLayer = document.getElementById('fxLayer');
  const stack = [];

  const toastIcons = {
    success: 'check-circle', error: 'x-circle', warning: 'warning',
    theme: 'sparkles', reward: 'medal', info: 'info', book: 'books', season: 'trophy',
    announcement: 'megaphone', leaderboard: 'ranking'
  };

  function toast(title, body = '', type = 'info', iconName = '') {
    if (!toastRoot) return;
    const node = document.createElement('div');
    node.className = 'toast ' + (type === 'warning' ? 'error' : type === 'theme' || type === 'reward' || type === 'season' || type === 'announcement' ? 'success' : type);
    node.innerHTML =
      '<span class="toast-ic">' + icon(iconName || toastIcons[type] || 'info') + '</span>' +
      '<div><b>' + esc(title) + '</b>' + (body ? '<div>' + esc(body) + '</div>' : '') + '</div>';
    toastRoot.appendChild(node);
    window.setTimeout(() => {
      node.classList.add('leaving');
      window.setTimeout(() => node.remove(), 240);
    }, 3600);
    while (toastRoot.children.length > 3) toastRoot.firstElementChild.remove();
  }

  function closeTop() {
    const entry = stack[stack.length - 1];
    if (!entry) return false;
    entry.close();
    return true;
  }

  function baseLayer(className) {
    const layer = document.createElement('div');
    layer.className = 'modal-layer ' + (className || '');
    layer.innerHTML = '<div class="modal-backdrop"></div>';
    overlayRoot.appendChild(layer);
    return layer;
  }

  function openShell(layer, onClose) {
    let closed = false;
    const entry = {
      layer,
      close() {
        if (closed) return;
        closed = true;
        const index = stack.indexOf(entry);
        if (index >= 0) stack.splice(index, 1);
        const sheet = layer.querySelector('.sheet');
        if (sheet) sheet.classList.add('closing');
        layer.style.pointerEvents = 'none';
        window.setTimeout(() => layer.remove(), 300);
        if (typeof onClose === 'function') onClose();
        if (Neko.audio) Neko.audio.play('tap');
      }
    };
    stack.push(entry);
    layer.addEventListener('click', event => {
      if (event.target.closest('[data-sheet-close]') || event.target.classList.contains('modal-backdrop')) entry.close();
    });
    return entry;
  }

  function sheet(options = {}) {
    if (!overlayRoot) return null;
    const layer = baseLayer(options.layerClass || '');
    const sheetEl = document.createElement('div');
    sheetEl.className = 'sheet ' + (options.className || '');
    sheetEl.setAttribute('role', 'dialog');
    sheetEl.setAttribute('aria-modal', 'true');
    sheetEl.setAttribute('aria-label', options.title || 'Panel');
    sheetEl.innerHTML =
      '<div class="sheet-grab"></div>' +
      '<div class="sheet-head">' +
      '<div><span class="kicker">' + esc(options.kicker || 'NEKO') + '</span><h3>' + esc(options.title || '') + '</h3>' + (options.sub ? '<p>' + esc(options.sub) + '</p>' : '') + '</div>' +
      '<button type="button" class="sheet-close" data-sheet-close aria-label="Tutup">' + icon('close') + '</button>' +
      '</div>' +
      '<div class="sheet-body">' + (options.body || '') + '</div>' +
      (options.foot ? '<div class="sheet-foot">' + options.foot + '</div>' : '');
    layer.appendChild(sheetEl);
    const entry = openShell(layer, options.onClose);
    entry.sheet = sheetEl;
    if (typeof options.onMount === 'function') options.onMount(sheetEl, entry);
    return entry;
  }

  function dialog(options = {}) {
    return new Promise(resolve => {
      if (!overlayRoot) { resolve(false); return; }
      const layer = baseLayer('dialog-layer');
      const box = document.createElement('div');
      box.className = 'sheet dialog ' + (options.className || '');
      box.setAttribute('role', 'alertdialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', options.title || 'Konfirmasi');
      box.innerHTML =
        '<div class="dialog-ic ' + (options.danger ? 'danger' : '') + '">' + icon(options.icon || (options.danger ? 'warning' : 'help')) + '</div>' +
        '<h3>' + esc(options.title || 'Yakin?') + '</h3>' +
        '<p>' + esc(options.body || '') + '</p>' +
        (options.warning ? '<div class="dialog-warning">' + icon('warning') + '<span>' + esc(options.warning) + '</span></div>' : '') +
        '<div class="dialog-actions">' +
        '<button type="button" class="btn btn-ghost" data-dialog-cancel>' + esc(options.cancelText || 'Batal') + '</button>' +
        '<button type="button" class="btn ' + (options.danger ? 'btn-danger' : 'btn-primary') + '" data-dialog-ok>' + esc(options.confirmText || 'Lanjut') + '</button>' +
        '</div>';
      layer.appendChild(box);
      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        entry.close();
        resolve(value);
      };
      const entry = openShell(layer, () => { if (!settled) { settled = true; resolve(false); } });
      box.querySelector('[data-dialog-ok]').addEventListener('click', () => { Neko.audio.play('select'); finish(true); });
      box.querySelector('[data-dialog-cancel]').addEventListener('click', () => finish(false));
      window.setTimeout(() => box.querySelector('[data-dialog-ok]').focus(), 60);
    });
  }

  function serverSummary() {
    const base = Neko.api && Neko.api.server ? Neko.api.server.base : '';
    return base ? 'Server online: ' + esc(base) : 'Pakai alamat halaman ini';
  }

  async function pingServer(base, note) {
    const target = String(base || '').replace(/\/+$/, '');
    note.textContent = 'Menguji ' + target + ' …';
    try {
      const response = await fetch(target + '/api/health', { cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (response.ok && data && data.status === 'ok') {
        const cloud = data.supabase && data.supabase.configured ? ' · database Supabase' : ' · database lokal server';
        note.textContent = 'Terhubung: NEKO versi ' + (data.version || '?') + cloud + '.';
        return true;
      }
      note.textContent = 'Ada yang menjawab, tapi bukan server NEKO (status ' + response.status + ').';
      return false;
    } catch (error) {
      note.textContent = 'Tidak bisa menghubungi server: ' + (error.message || 'koneksi tertutup') + '.';
      return false;
    }
  }

  function serverSheet() {
    const current = (Neko.api && Neko.api.server && Neko.api.server.base) || '';
    sheet({
      kicker: 'SERVER NEKO', title: 'Alamat server', sub: 'Isi kalau website dan server berada di tempat berbeda, misalnya web di Vercel dan server di Render.',
      body:
        '<label class="field"><span class="form-label">Alamat server (https://…)</span>' +
        '<input type="url" data-server-input placeholder="https://neko-server.onrender.com" value="' + esc(current) + '" autocomplete="off" spellcheck="false"></label>' +
        '<p class="field-hint" data-server-note>Biarkan kosong bila server ikut membuka halaman ini. Kelas Langsung, Mabar, pesan, dan leaderboard butuh server.</p>' +
        '<div class="g-actions">' +
        '<button type="button" class="btn btn-primary" data-server-save>' + icon('check') + 'Simpan &amp; muat ulang</button>' +
        '<button type="button" class="btn btn-soft" data-server-test>' + icon('refresh') + 'Uji koneksi</button>' +
        '<button type="button" class="btn btn-ghost" data-server-clear>' + icon('close') + 'Pakai alamat halaman</button>' +
        '</div>',
      onMount(el) {
        const input = el.querySelector('[data-server-input]');
        const note = el.querySelector('[data-server-note]');
        const clean = () => String(input.value || '').trim().replace(/\/+$/, '');
        el.querySelector('[data-server-save]').addEventListener('click', async () => {
          const value = clean();
          if (value && !/^https?:\/\//i.test(value)) {
            note.textContent = 'Alamat harus diawali http:// atau https://';
            Neko.audio.play('error');
            return;
          }
          if (value) {
            const ok = await pingServer(value, note);
            if (!ok) { Neko.audio.play('error'); return; }
          }
          Neko.api.server.set(value);
          note.textContent = 'Tersimpan. Memuat ulang aplikasi…';
          Neko.audio.play('success');
          window.setTimeout(() => window.location.reload(), 600);
        });
        el.querySelector('[data-server-test]').addEventListener('click', () => {
          const value = clean();
          if (!value) { note.textContent = 'Isi alamat servernya dulu.'; return; }
          pingServer(value, note);
        });
        el.querySelector('[data-server-clear]').addEventListener('click', () => {
          Neko.api.server.clear();
          note.textContent = 'Kembali ke alamat halaman ini. Memuat ulang…';
          window.setTimeout(() => window.location.reload(), 400);
        });
      }
    });
  }

  function settingsSheet() {
    const prefs = Neko.store.prefs;
    const soundOn = Neko.audio.soundOn;
    const musicOn = Neko.audio.musicOn;
    sheet({
      kicker: 'SHELL NEKO', title: 'Pengaturan cepat', sub: 'Audio, dunia, dan kenyamanan tampilan.',
      body:
        '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('volume') + '</span><div><b>Efek suara</b><small>Klik, pilih, benar, salah</small></div></div><button type="button" class="switch" data-audio-toggle aria-pressed="' + String(soundOn) + '" aria-label="Efek suara"></button></div>' +
        '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('music') + '</span><div><b>Musik tema</b><small>Nada mengikuti dunia aktif</small></div></div><button type="button" class="switch" data-music-toggle aria-pressed="' + String(musicOn) + '" aria-label="Musik tema"></button></div>' +
        '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('sun') + '</span><div><b>Mode terang</b><small>' + (Neko.theme.meta(prefs.theme).modes.includes('light') ? 'Berganti siang / malam' : 'Nonaktif di tema mobil') + '</small></div></div><button type="button" class="switch ' + (Neko.theme.meta(prefs.theme).modes.includes('light') ? '' : 'is-disabled') + '" data-quick-mode aria-pressed="' + String(prefs.mode === 'light') + '"></button></div>' +
        '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('palette') + '</span><div><b>Dunia tema</b><small>Ganti dunia dengan animasi</small></div></div><button type="button" class="btn btn-soft btn-sm" data-open-theme>' + icon('sparkles') + 'Pilih</button></div>' +
        '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('vibrate') + '</span><div><b>Getaran haptic</b><small>Sentuhan halus saat aksi penting</small></div></div><button type="button" class="switch" data-haptics-toggle aria-pressed="' + String(prefs.haptics) + '" aria-label="Getaran haptic"></button></div>' +
        '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('cursor') + '</span><div><b>Kursor interaktif</b><small>Ekor cahaya mengikuti kursor</small></div></div><button type="button" class="switch" data-cursor-toggle aria-pressed="' + String(prefs.cursor === 'on') + '" aria-label="Kursor interaktif"></button></div>' +
        '<div class="setting-row"><div class="setting-copy"><span class="setting-ic">' + icon('server') + '</span><div><b>Alamat server NEKO</b><small data-server-state>' + serverSummary() + '</small></div></div><button type="button" class="btn btn-soft btn-sm" data-server-edit>' + icon('edit') + 'Atur</button></div>',
      onMount(el) {
        el.querySelector('[data-audio-toggle]').addEventListener('click', event => {
          Neko.audio.setSound(!Neko.audio.soundOn);
          event.currentTarget.setAttribute('aria-pressed', String(Neko.audio.soundOn));
        });
        el.querySelector('[data-music-toggle]').addEventListener('click', event => {
          Neko.audio.setMusic(!Neko.audio.musicOn);
          event.currentTarget.setAttribute('aria-pressed', String(Neko.audio.musicOn));
        });
        el.querySelector('[data-quick-mode]').addEventListener('click', event => {
          Neko.theme.toggleMode({ x: event.clientX, y: event.clientY });
        });
        el.querySelector('[data-open-theme]').addEventListener('click', () => themeSheet());
        el.querySelector('[data-haptics-toggle]').addEventListener('click', event => {
          const next = !Neko.store.prefs.haptics;
          Neko.store.patchPrefs({ haptics: next });
          event.currentTarget.setAttribute('aria-pressed', String(next));
          if (next && Neko.fx) Neko.fx.haptic('soft');
          Neko.ui.toast(next ? 'Getaran aktif' : 'Getaran mati', next ? 'Perangkat akan bergetar pada momen tertentu.' : 'Tidak ada getaran sampai diaktifkan lagi.', 'info', 'vibrate');
        });
        el.querySelector('[data-cursor-toggle]').addEventListener('click', event => {
          const next = Neko.store.prefs.cursor === 'on' ? 'off' : 'on';
          Neko.store.patchPrefs({ cursor: next });
          event.currentTarget.setAttribute('aria-pressed', String(next === 'on'));
          if (Neko.fx) Neko.fx.refreshCursor();
        });
        el.querySelector('[data-server-edit]').addEventListener('click', () => {
          Neko.audio.play('tap');
          serverSheet();
        });
      }
    });
  }

  function themeSheet() {
    sheet({
      kicker: 'DUNIA NEKO', title: 'Pilih duniamu', sub: 'Delapan dunia dengan ikon, warna, dan musik sendiri.',
      className: 'theme-sheet',
      body: Neko.theme.pickerHTML(),
      onMount(el) {
        Neko.theme.bindPicker(el);
        document.addEventListener('neko:theme', () => {
          const modeWrap = el.querySelector('#modeCardsWrap');
          if (modeWrap) modeWrap.innerHTML = Neko.theme.modeCards();
        }, { once: true });
      }
    });
  }

  function announcementItems() {
    const list = (Neko.community ? Neko.community.announcements : []).slice(0, 10);
    if (!list.length) return '';
    return '<div class="notif-group-label">' + icon('megaphone') + 'Dari admin & developer</div>' +
      '<div class="notif-list announcement-list">' + list.map(item => (
        '<article class="notif-item announcement">' +
        '<span class="notif-ic">' + icon('megaphone') + '</span>' +
        '<div><b>' + esc(item.title) + '</b><p>' + esc(item.body) + '</p>' +
        '<small>' + esc(item.author || 'Admin NEKO') + ' · ' + esc(item.authorRole || 'Admin') + ' · ' + esc(Neko.util.timeAgo(item.time)) + '</small></div>' +
        '</article>'
      )).join('') + '</div>';
  }

  function notificationsSheet() {
    const profile = Neko.store.profile;
    if (!profile) return;
    const items = profile.notifications.slice(0, 24);
    const body =
      announcementItems() +
      (items.length
        ? '<div class="notif-group-label">' + icon('bell') + 'Aktivitasmu</div><div class="notif-list">' + items.map(item => {
          const iconName = item.type === 'season' ? 'trophy' : item.type === 'reward' ? 'medal' : item.type === 'book' ? 'books' : item.type === 'game' ? 'gamepad' : 'bell';
          return '<article class="notif-item ' + (item.read ? 'is-read' : '') + '" data-notif-id="' + esc(item.id) + '"><span class="notif-ic">' + icon(iconName) + '</span><div><b>' + esc(item.title) + '</b><p>' + esc(item.body) + '</p><small>' + esc(Neko.util.timeAgo(item.time)) + '</small></div></article>';
        }).join('') + '</div>'
        : (announcementItems() ? '' : '<div class="empty-state"><span class="empty-ic">' + icon('bell') + '</span><h3>Belum ada kabar</h3><p>Notifikasi season, buku, misi, dan pengumuman admin akan muncul di sini.</p></div>'));
    const unread = Neko.store.unreadCount();
    sheet({
      kicker: 'KOTAK MASUK', title: 'Notifikasi', sub: unread ? unread + ' aktivitas belum dibaca' : 'Semua aktivitas sudah dibaca',
      body,
      foot: '<button type="button" class="btn btn-soft" data-open-leaderboard>' + icon('ranking') + 'Leaderboard</button>' +
        (items.length ? '<button type="button" class="btn btn-ghost" data-mark-all>' + icon('check') + 'Tandai dibaca</button>' : ''),
      onMount(el, entry) {
        const mark = el.querySelector('[data-mark-all]');
        if (mark) mark.addEventListener('click', () => {
          Neko.store.markAllRead();
          mark.disabled = true;
          mark.textContent = 'Sudah dibaca';
          el.querySelectorAll('.notif-item').forEach(node => { node.classList.add('is-read'); });
        });
        el.querySelectorAll('[data-notif-id]').forEach(node => {
          node.addEventListener('click', () => {
            Neko.store.markRead(node.dataset.notifId);
            node.classList.add('is-read');
            Neko.audio.play('tap');
          });
        });
        const board = el.querySelector('[data-open-leaderboard]');
        if (board) board.addEventListener('click', event => {
          event.stopPropagation();
          entry.close();
          window.setTimeout(leaderboardSheet, 260);
        });
      }
    });
  }

  function leaderboardRows() {
    const rows = Neko.community ? Neko.community.leaderboard() : [];
    if (!rows.length) {
      return '<div class="empty-state"><span class="empty-ic">' + icon('ranking') + '</span><h3>Papan masih kosong</h3><p>Mainkan game atau baca buku untuk masuk peringkat.</p></div>';
    }
    return '<div class="rank-list">' + rows.map(item => (
      '<article class="rank-row ' + (item.self ? 'is-self' : '') + ' ' + (item.rank <= 3 ? 'is-top top-' + item.rank : '') + '">' +
      '<span class="rank-num">' + (item.rank <= 3 ? icon(item.rank === 1 ? 'trophy' : 'medal') : item.rank) + '</span>' +
      '<span class="rank-avatar">' + esc(initials(item.displayName)) + (item.active ? '<i class="rank-live" title="Aktif"></i>' : '') + '</span>' +
      '<div class="rank-copy"><b>' + esc(item.displayName) + (item.self ? ' <em>kamu</em>' : '') + '</b><small>' + esc(item.title || item.role) + '</small></div>' +
      '<span class="rank-xp">' + esc(Neko.util.formatNumber(item.xp)) + '<small>XP</small></span>' +
      '</article>'
    )).join('') + '</div>';
  }

  function leaderboardSheet() {
    const active = Neko.community ? Neko.community.activeCount() : 0;
    sheet({
      kicker: 'PAPAN PERINGKAT', title: 'Leaderboard realtime', sub: '25 peringkat teratas · ' + active + ' aktif sekarang',
      className: 'rank-sheet',
      body: '<div data-rank-list>' + leaderboardRows() + '</div>',
      foot: '<button type="button" class="btn btn-soft" data-rank-refresh>' + icon('refresh') + 'Segarkan</button>',
      onMount(el, entry) {
        const list = el.querySelector('[data-rank-list]');
        const refreshButton = el.querySelector('[data-rank-refresh]');
        if (refreshButton) {
          refreshButton.addEventListener('click', async () => {
            refreshButton.disabled = true;
            Neko.audio.play('select');
            await Neko.community.refresh({ force: true });
            if (list) list.innerHTML = leaderboardRows();
            refreshButton.disabled = false;
          });
        }
        const onUpdate = () => {
          if (!entry.sheet || !entry.sheet.isConnected) {
            document.removeEventListener('neko:community', onUpdate);
            return;
          }
          if (list) list.innerHTML = leaderboardRows();
        };
        document.addEventListener('neko:community', onUpdate);
      }
    });
  }

  function avatar(name, size = '') {
    const label = initials(name || 'N');
    return '<span class="top-user-avatar ' + size + '">' + esc(label) + '</span>';
  }

  function refreshAudioButtons() {
    document.querySelectorAll('[data-audio-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(Neko.audio.soundOn));
    });
    document.querySelectorAll('[data-music-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(Neko.audio.musicOn));
    });
    document.querySelectorAll('[data-top-audio]').forEach(button => {
      button.innerHTML = icon(Neko.audio.soundOn ? 'volume' : 'volume-off');
      button.setAttribute('aria-pressed', String(Neko.audio.soundOn));
      button.setAttribute('aria-label', Neko.audio.soundOn ? 'Matikan suara' : 'Nyalakan suara');
    });
    document.querySelectorAll('[data-top-music]').forEach(button => {
      button.setAttribute('aria-pressed', String(Neko.audio.musicOn));
      button.setAttribute('aria-label', Neko.audio.musicOn ? 'Matikan musik' : 'Nyalakan musik');
      button.style.opacity = Neko.audio.musicOn ? '' : '.45';
    });
    document.querySelectorAll('[data-top-mode]').forEach(button => {
      const mode = document.documentElement.dataset.mode || 'dark';
      button.innerHTML = icon(mode === 'dark' ? 'sun' : 'moon');
      button.setAttribute('aria-label', mode === 'dark' ? 'Nyalakan mode terang' : 'Nyalakan mode gelap');
      button.setAttribute('title', mode === 'dark' ? 'Mode terang' : 'Mode gelap');
    });
  }

  function themeColors() {
    const styles = getComputedStyle(document.documentElement);
    return [
      styles.getPropertyValue('--accent').trim() || '#22e1ff',
      styles.getPropertyValue('--accent-2').trim() || '#7c74ff',
      styles.getPropertyValue('--accent-3').trim() || '#3dffb0',
      styles.getPropertyValue('--ink').trim() || '#ffffff'
    ];
  }

  function confetti(x, y, amount = 34) {
    if (!fxLayer || Neko.util.reducedMotion()) return;
    const colors = themeColors();
    const ring = document.createElement('i');
    ring.className = 'spark-ring';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    fxLayer.appendChild(ring);
    window.setTimeout(() => ring.remove(), 760);
    for (let i = 0; i < amount; i += 1) {
      const bit = document.createElement('i');
      bit.className = 'confetti';
      bit.style.left = x + 'px';
      bit.style.top = y + 'px';
      bit.style.background = colors[i % colors.length];
      bit.style.setProperty('--dx', (Math.random() * 260 - 130).toFixed(0) + 'px');
      bit.style.setProperty('--dy', (60 + Math.random() * 240).toFixed(0) + 'px');
      bit.style.setProperty('--rot', (Math.random() * 900 - 450).toFixed(0) + 'deg');
      bit.style.setProperty('--dur', (0.9 + Math.random() * 0.8).toFixed(2) + 's');
      fxLayer.appendChild(bit);
      window.setTimeout(() => bit.remove(), 1900);
    }
  }

  function xpFloat(amount, x, y) {
    if (!fxLayer) return;
    const node = document.createElement('div');
    node.className = 'xp-float';
    node.textContent = '+' + amount + ' XP';
    node.style.left = clamp(x, 30, window.innerWidth - 60) + 'px';
    node.style.top = clamp(y, 70, window.innerHeight - 60) + 'px';
    fxLayer.appendChild(node);
    window.setTimeout(() => node.remove(), 1500);
  }

  document.addEventListener('neko:xp', event => {
    const detail = event.detail || {};
    if (!detail.amount) return;
    const anchor = document.getElementById('topXp') || document.getElementById('topbar');
    const rect = anchor ? anchor.getBoundingClientRect() : { left: window.innerWidth - 120, top: 40, width: 90, height: 20 };
    const x = rect.left + rect.width * (.55 + Math.random() * .25);
    const y = rect.top + rect.height + 24;
    xpFloat(detail.amount, x, y);
    Neko.audio.play('xp');
    if (detail.seasonUp && detail.season) {
      confetti(x, y, 44);
      toast('Season baru: ' + detail.season.short, detail.season.title + ' — ' + detail.season.reward.desc, 'season', 'trophy');
    }
  });

  document.addEventListener('neko:theme', () => {
    refreshAudioButtons();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && stack.length) {
      event.preventDefault();
      closeTop();
    }
  });

  Neko.ui = {
    toast, sheet, dialog, settingsSheet, themeSheet, notificationsSheet, leaderboardSheet,
    avatar, refreshAudioButtons, confetti, xpFloat, closeTop,
    get openCount() { return stack.length; }
  };
})();
