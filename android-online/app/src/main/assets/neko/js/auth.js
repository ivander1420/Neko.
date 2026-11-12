/* ============================================================

NEKO · js/auth.js
   Layar masuk & daftar. Akun utama berada di server NEKO agar
   data mengikuti akun ke perangkat lain. Saat server tidak
   terjangkau, aplikasi jatuh ke mode lokal (PBKDF2 + salt).
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { $, esc } = Neko.util;
  const { icon } = Neko.icons;
  const auth = $('#auth');
  const form = $('#authForm');
  const nameField = $('#authNameField');
  const nameInput = $('#authDisplayName');
  const userInput = $('#authUsername');
  const pinInput = $('#authPin');
  const errorBox = $('#authError');
  const submitButton = $('#authSubmit');
  const title = $('#authTitle');
  const sub = $('#authSub');
  const kicker = $('#authKicker');
  let mode = 'login';
  let busy = false;
  let serverMode = true;

  const copy = {
    login: {
      kicker: 'AKUN NEKO', title: 'Selamat datang kembali',
      sub: 'Lanjutkan perjalananmu dari tempat terakhir.',
      button: 'Masuk ke NEKO'
    },
    register: {
      kicker: 'AKUN BARU', title: 'Buat petualanganmu',
      sub: 'Pilih nama, username, dan PIN rahasia enam angka atau lebih.',
      button: 'Buat akun & mulai'
    }
  };

  function setMode(next) {
    mode = next;
    auth.querySelectorAll('[data-auth-tab]').forEach(tab => {
      const active = tab.dataset.authTab === mode;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    nameField.hidden = mode !== 'register';
    nameInput.required = mode === 'register';
    pinInput.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    title.textContent = copy[mode].title;
    sub.textContent = copy[mode].sub;
    kicker.textContent = copy[mode].kicker;
    submitButton.innerHTML = copy[mode].button + ' ' + icon('arrow-right');
    setError('');
    Neko.audio.play('select');
  }

  function setError(message) {
    errorBox.textContent = message || '';
    errorBox.style.color = message ? '' : 'transparent';
    if (message) auth.querySelector('.auth-card').classList.add('shake');
    window.setTimeout(() => auth.querySelector('.auth-card').classList.remove('shake'), 420);
  }

  function setBusy(value) {
    busy = value;
    submitButton.disabled = value;
    submitButton.classList.toggle('btn-loading', value);
  }

  function setServerMode(value) {
    serverMode = value;
    const note = auth.querySelector('.auth-note .auth-note-text');
    if (note) {
      note.textContent = serverMode
        ? 'Akun tersimpan di server NEKO agar datamu mengikuti akun di perangkat lain. PIN di-hash, bukan teks biasa.'
        : 'Mode lokal: server NEKO tidak ada di alamat ini. Akun dan progres hanya tersimpan di perangkat ini — untuk sinkron lintas perangkat jalankan Mulai-NEKO.bat dan buka alamat servernya.';
    }
  }

  function toBase64(buffer) {
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer))));
  }

  function fromBase64(text) {
    return Uint8Array.from(atob(text), char => char.charCodeAt(0));
  }

  async function derivePin(pin, salt, iterations = 150000) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({
      name: 'PBKDF2', salt, iterations, hash: 'SHA-256'
    }, key, 256);
    return toBase64(bits);
  }

  function validUsername(value) {
    return /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,23}$/.test(value);
  }

  function validPin(value) {
    return /^[0-9]{6,12}$/.test(value);
  }

  async function loginLocal(username, pin) {
    const account = Neko.store.findAccount(username);
    if (!account) throw new Error('Username belum terdaftar. Buat akun baru dulu, ya.');
    if (account.preset) {
      if (String(account.pin) !== pin) throw new Error('PIN belum cocok. Coba periksa lagi.');
    } else {
      const hashed = await derivePin(pin, fromBase64(account.salt), account.iterations || 150000);
      if (hashed !== account.hash) throw new Error('PIN belum cocok. Coba periksa lagi.');
    }
    return account;
  }

  async function registerLocal(displayName, username, pin) {
    if (displayName.length < 2) throw new Error('Nama tampilan minimal 2 huruf.');
    if (!validUsername(username)) throw new Error('Username 3–24 karakter: huruf, angka, titik, garis bawah, atau strip.');
    if (Neko.store.usernameTaken(username)) throw new Error('Username itu sudah dipakai. Pilih yang lain.');
    if (!validPin(pin)) throw new Error('PIN harus 6–12 angka.');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derivePin(pin, salt);
    const account = {
      username,
      displayName,
      role: 'Member',
      salt: toBase64(salt),
      hash,
      iterations: 150000,
      createdAt: Date.now()
    };
    Neko.store.addLocalAccount(account);
    return account;
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const displayName = nameInput.value.trim();
    const username = userInput.value.trim();
    const pin = pinInput.value.trim();
    if (!username) { setError('Isi username dulu, ya.'); userInput.focus(); Neko.audio.play('error'); return; }
    if (!pin) { setError('PIN belum diisi.'); pinInput.focus(); Neko.audio.play('error'); return; }
    setBusy(true);
    setError('');
    try {
      Neko.api.setToken('');
      if (serverMode) {
        try {
          const data = mode === 'login'
            ? await Neko.api.login(username, pin)
            : await Neko.api.register(displayName, username, pin);
          enterApp({ username: data.user.username, displayName: data.user.displayName, role: data.user.role }, { profile: data.profile, prefs: data.prefs });
          return;
        } catch (error) {
          const unreachable = error.offline === true
            || error.name === 'AbortError'
            || (error.status === undefined && /fetch|offline|network|abort/i.test(String(error.message || '') + ' ' + String(error.name || '')));
          if (unreachable) {
            serverMode = false;
            setServerMode(false);
            Neko.ui.toast('Server tidak terjangkau', 'Masuk memakai akun lokal perangkat ini.', 'warning', 'warning');
          } else {
            throw error;
          }
        }
      }
      const account = mode === 'login'
        ? await loginLocal(username, pin)
        : await registerLocal(displayName, username, pin);
      enterApp(account, null);
    } catch (error) {
      setError(error && error.message ? error.message : 'Ada yang salah. Coba lagi.');
      Neko.audio.play('error');
      setBusy(false);
    }
  }

  function enterApp(account, server) {
    Neko.store.setSession(account, server);
    Neko.audio.play('login');
    auth.classList.add('is-leaving');
    window.setTimeout(() => {
      auth.hidden = true;
      auth.classList.remove('is-leaving');
      form.reset();
      setBusy(false);
      if (Neko.app && Neko.app.start) Neko.app.start({ intro: true });
    }, 420);
  }

  function show() {
    if (!auth) return;
    auth.hidden = false;
    document.getElementById('app').hidden = true;
    Neko.theme.buildAuthDots();
    Neko.api.probe().then(ok => setServerMode(ok));
    window.setTimeout(() => userInput.focus(), 250);
  }

  function hide() {
    if (auth) auth.hidden = true;
  }

  function intro(name) {
    return new Promise(resolve => {
      const node = document.createElement('div');
      node.className = 'intro';
      node.innerHTML =
        '<div class="intro-shapes" aria-hidden="true"><i style="left:18%;top:22%"></i><i style="left:78%;top:32%;animation-delay:-2s"></i><i style="left:32%;top:74%;animation-delay:-4s"></i><i style="left:68%;top:82%;animation-delay:-1s"></i></div>' +
        '<div class="intro-inner"><div class="intro-mark"><span class="logo-mask"></span></div>' +
        '<div class="intro-word">Neko<span class="dot-run" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></div>' +
        '<p class="intro-hi">Halo, ' + esc(name) + '. Selamat datang di duniamu.</p></div>';
      document.body.appendChild(node);
      Neko.audio.play('success');
      window.setTimeout(() => {
        node.classList.add('is-leaving');
        window.setTimeout(() => { node.remove(); resolve(); }, 800);
      }, 1350);
    });
  }

  function init() {
    if (!form || !auth) return;
    Neko.theme.buildAuthDots();
    form.addEventListener('submit', submit);
    form.addEventListener('input', () => { if (errorBox.textContent) setError(''); });
    auth.querySelectorAll('[data-auth-tab]').forEach(tab => {
      tab.addEventListener('click', () => setMode(tab.dataset.authTab));
    });
    const toggle = $('#pinToggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const visible = pinInput.type === 'text';
        pinInput.type = visible ? 'password' : 'text';
        toggle.setAttribute('aria-pressed', String(!visible));
        toggle.setAttribute('aria-label', visible ? 'Tampilkan PIN' : 'Sembunyikan PIN');
        toggle.innerHTML = icon(visible ? 'eye' : 'eye-off');
        pinInput.focus();
      });
    }
    auth.querySelectorAll('.auth-theme-dots').forEach(dots => {
      dots.addEventListener('click', () => Neko.audio.play('tap'));
    });
    document.addEventListener('neko:logout', () => {
      setServerMode(Neko.api.online && location.protocol !== 'file:');
      show();
    });
    setMode('login');
    Neko.audio.play('tap');
    Neko.api.probe().then(ok => setServerMode(ok));
  }

  Neko.auth = { init, show, hide, intro, setMode, enterApp, isServerMode: () => serverMode };
})();
