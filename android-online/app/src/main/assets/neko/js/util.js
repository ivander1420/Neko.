/* ============================================================
   NEKO · js/util.js
   Helper kecil yang dipakai seluruh modul.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = list => list[Math.floor(Math.random() * list.length)];

  function shuffle(list) {
    const copy = list.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    return copy;
  }

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  function debounce(fn, delay = 160) {
    let timer = null;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('id-ID').format(Math.round(Number(value) || 0));
  }

  function timeAgo(timestamp) {
    const diff = Math.max(0, Date.now() - Number(timestamp));
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'baru saja';
    if (minutes < 60) return minutes + ' menit lalu';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + ' jam lalu';
    const days = Math.floor(hours / 24);
    if (days < 7) return days + ' hari lalu';
    return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  function todayKey(date = new Date()) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function dayDiff(a, b) {
    const first = new Date(a + 'T00:00:00');
    const second = new Date(b + 'T00:00:00');
    return Math.round((second - first) / 86400000);
  }

  function safeStorage(getter, fallback) {
    try {
      return getter();
    } catch (error) {
      return fallback;
    }
  }

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';

  function uid(prefix = 'id') {
    const source = window.crypto && crypto.getRandomValues ? crypto.getRandomValues(new Uint32Array(2)) : [Date.now(), Math.random() * 1e9];
    return prefix + '-' + Array.from(source, part => Number(part).toString(36)).join('');
  }

  function initials(name) {
    const clean = String(name || 'N').trim();
    if (!clean) return 'N';
    return clean.split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
  }

  function capitalize(value) {
    const text = String(value || '');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function stripHtml(value) {
    const node = document.createElement('div');
    node.innerHTML = String(value || '');
    return node.textContent || '';
  }

  function focusable(scope) {
    return $$('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', scope)
      .filter(node => node.offsetParent !== null || node === document.activeElement);
  }

  const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

  /* Nada warna yang selalu mengikuti tema aktif. Setiap entri adalah
     ekspresi CSS, bukan hex mentah, supaya ganti tema ikut mengubah
     warna aksen game, badge, maskot, dan musim. */
  const toneRamp = [
    'var(--accent)',
    'var(--accent-2)',
    'var(--accent-3)',
    'color-mix(in oklab, var(--accent) 55%, var(--accent-2))',
    'color-mix(in oklab, var(--accent-2) 62%, var(--danger))',
    'color-mix(in oklab, var(--accent-3) 65%, var(--accent))',
    'color-mix(in oklab, var(--warn) 78%, var(--accent-2))',
    'color-mix(in oklab, var(--danger) 70%, var(--accent-2))'
  ];

  function tone(index) {
    const length = toneRamp.length;
    return toneRamp[((Math.round(Number(index) || 0) % length) + length) % length];
  }

  function toneMix(index, amount, other) {
    const base = tone(index);
    const second = other || 'transparent';
    const percent = Math.round(clamp(Number(amount), 0, 100));
    return 'color-mix(in oklab, ' + base + ' ' + percent + '%, ' + second + ')';
  }

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(value);
    return new Promise((resolve, reject) => {
      try {
        const area = document.createElement('textarea');
        area.value = value;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  Neko.util = {
    $, $$, esc, clamp, rand, pick, shuffle, wait, debounce, formatNumber, timeAgo,
    todayKey, dayDiff, safeStorage, reducedMotion, uid, initials, capitalize,
    stripHtml, focusable, isTouch, copyText, tone, toneMix
  };
})();
