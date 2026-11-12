/* ============================================================
   NEKO · js/book.js
   Perpustakaan buku materi TJKT dan pembaca buku dua halaman
   dengan animasi balik halaman.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { esc, clamp, wait } = Neko.util;
  const { icon } = Neko.icons;
  const books = () => (window.NEK_MATERIALS?.books || []);

  let filter = 'Semua';
  let query = '';
  let reader = null;
  let keyHandler = null;
  let touchStart = null;

  function stateFor(book) {
    return Neko.store.bookState(book.id) || { read: [], maxPage: 0, finished: false };
  }

  function categories() {
    const list = ['Semua'];
    books().forEach(book => { if (!list.includes(book.category)) list.push(book.category); });
    return list;
  }

  function visibleBooks() {
    const needle = query.trim().toLowerCase();
    return books().filter(book => {
      const inCategory = filter === 'Semua' || book.category === filter;
      const inSearch = !needle || (book.title + ' ' + book.subtitle + ' ' + book.tag).toLowerCase().includes(needle);
      return inCategory && inSearch;
    });
  }

  function shelfHTML() {
    const list = visibleBooks();
    if (!list.length) {
      return '<div class="library-empty"><b>Buku tidak ditemukan</b><p>Coba kata kunci atau kategori lain.</p></div>';
    }
    return list.map(book => {
      const state = stateFor(book);
      const read = (state.read || []).length;
      const dots = book.pages.map((page, index) => '<i class="' + (index < (state.maxPage || 0) + 1 ? 'on' : '') + '"></i>').join('');
      return (
        '<button type="button" class="book-card" data-book-id="' + book.id + '" aria-label="Buka buku ' + esc(book.title) + '">' +
        '<span class="book-cover" style="--cover-a:' + book.colorA + ';--cover-b:' + book.colorB + '">' +
        '<span class="book-tag">' + esc(book.tag) + '</span>' +
        '<span class="book-spine-text">' + esc(book.title) + '</span>' +
        '<span class="book-cover-top"><span class="book-emblem">' + icon(book.icon) + '</span></span>' +
        '<span class="book-cover-body"><small>' + esc(book.category) + ' · ' + book.pages.length + ' halaman</small><h3>' + esc(book.title) + '</h3><span>' + esc(book.subtitle) + '</span></span>' +
        '</span>' +
        '<span class="book-meta"><b>' + (state.finished ? 'Selesai dibaca' : read ? read + '/' + book.pages.length + ' halaman' : book.minutes + ' menit') + '</b>' +
        '<span class="book-progress-dots">' + dots + '</span></span>' +
        '</button>'
      );
    }).join('');
  }

  function render() {
    const profile = Neko.store.profile;
    if (!profile) return '';
    const totalPages = books().reduce((sum, book) => sum + book.pages.length, 0);
    const finished = books().filter(book => stateFor(book).finished).length;
    return (
      '<section class="library-hero">' + (Neko.ornaments ? Neko.ornaments.cluster('library') : '') +
      '<div class="library-hero-copy"><span class="kicker">PERPUSTAKAAN TJKT</span>' +
      '<h1>Buku materi yang bisa kamu buka seperti buku asli.</h1>' +
      '<p>' + books().length + ' buku materi — ' + totalPages + ' halaman — dengan gambar, tabel, kode, dan cek pemahaman. Setiap halaman baru memberi XP, dan menamatkan buku membuka badge koleksi.</p>' +
      '<div class="library-hero-actions"><button type="button" class="btn btn-primary" data-scroll-shelf>' + icon('books') + 'Mulai membaca</button>' +
      '<button type="button" class="btn btn-soft" data-go="arena">' + icon('gamepad') + 'Uji di arena</button></div></div>' +
      '<div class="library-stats">' +
      '<div class="library-stat"><strong>' + books().length + '</strong><span>Buku materi</span></div>' +
      '<div class="library-stat"><strong>' + totalPages + '</strong><span>Halaman bacaan</span></div>' +
      '<div class="library-stat"><strong>' + (profile.stats.pagesRead || 0) + '</strong><span>Halaman dibaca</span></div>' +
      '<div class="library-stat"><strong>' + finished + '</strong><span>Buku tamat</span></div>' +
      '</div></section>' +
      '<div class="book-toolbar">' +
      '<div class="book-filters">' + categories().map(category => '<button type="button" class="book-filter ' + (filter === category ? 'on' : '') + '" data-book-filter="' + esc(category) + '">' + esc(category) + '</button>').join('') + '</div>' +
      '<label class="book-search">' + icon('search') + '<input type="search" placeholder="Cari materi…" value="' + esc(query) + '" data-book-search aria-label="Cari buku"></label>' +
      '</div>' +
      '<div class="shelf" id="bookShelf">' + shelfHTML() + '</div>' +
      '<div class="shelf-board" aria-hidden="true"></div>'
    );
  }

  function bind(root, context) {
    root.addEventListener('click', event => {
      const bookButton = event.target.closest('[data-book-id]');
      if (bookButton) { open(bookButton.dataset.bookId); return; }
      const filterButton = event.target.closest('[data-book-filter]');
      if (filterButton) {
        filter = filterButton.dataset.bookFilter;
        root.querySelectorAll('[data-book-filter]').forEach(button => button.classList.toggle('on', button === filterButton));
        const shelf = root.querySelector('#bookShelf');
        if (shelf) shelf.innerHTML = shelfHTML();
        Neko.audio.play('select');
        return;
      }
      if (event.target.closest('[data-scroll-shelf]')) {
        const shelf = root.querySelector('#bookShelf');
        if (shelf) shelf.scrollIntoView({ behavior: Neko.util.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
        return;
      }
      const go = event.target.closest('[data-go]');
      if (go) Neko.app.go(go.dataset.go);
    });
    root.addEventListener('input', event => {
      const search = event.target.closest('[data-book-search]');
      if (!search) return;
      query = search.value;
      const shelf = root.querySelector('#bookShelf');
      if (shelf) shelf.innerHTML = shelfHTML();
    });
  }

  /* ---------------- Pembaca ---------------- */

  function contentPage(page, index, book) {
    return (
      '<div class="page-inner">' +
      '<span class="page-kicker">' + esc(page.kicker || '') + '</span>' +
      '<h2>' + esc(page.title || '') + '</h2>' +
      (page.html || '') +
      '<span class="page-num">' + (index + 1) + ' / ' + book.pages.length + ' · ' + esc(book.title) + '</span>' +
      '</div>'
    );
  }

  function blankPage(book) {
    return '<div class="page-inner"><span class="page-num">' + esc(book.title) + ' · NEKO</span></div>';
  }

  function coverPage(book, side) {
    if (side === 'left') {
      return (
        '<div class="page-inner cover-art">' +
        '<span class="cover-badge">' + icon(book.icon) + '</span>' +
        '<div class="cover-art-title">' + book.title.split(' ').map(word => '<span>' + esc(word) + '</span>').join('') + '</div>' +
        '<small>' + esc(book.category) + ' · NEKO LIBRARY</small>' +
        '</div>'
      );
    }
    return (
      '<div class="cover-page-inner">' +
      '<div class="cover-badge">' + icon(book.icon) + '</div>' +
      '<div><small>' + esc(book.tag) + '</small><h2>' + esc(book.title) + '</h2><p>' + esc(book.subtitle) + '</p></div>' +
      '<div class="cover-foot"><span>NEKO</span><span>' + book.pages.length + ' halaman</span></div>' +
      '</div>'
    );
  }

  function pageMarkup(book, index, side, extraClass = '') {
    if (index === -1) {
      return '<div class="book-page ' + side + ' ' + extraClass + '">' + coverPage(book, side) + '</div>';
    }
    if (index < 0 || index >= book.pages.length) {
      return '<div class="book-page ' + side + ' ' + extraClass + '">' + blankPage(book) + '</div>';
    }
    return '<div class="book-page ' + side + ' ' + extraClass + '" data-page-index="' + index + '">' + pageCorners() + contentPage(book.pages[index], index, book) + '</div>';
  }

  /* Hiasan sudut bergaya buku dongeng — murni CSS, tidak menutupi teks. */
  function pageCorners() {
    return '<span class="page-orn tl" aria-hidden="true"></span>' +
      '<span class="page-orn tr" aria-hidden="true"></span>' +
      '<span class="page-orn bl" aria-hidden="true"></span>' +
      '<span class="page-orn br" aria-hidden="true"></span>' +
      '<span class="page-ribbon" aria-hidden="true"></span>';
  }

  function isMobile() {
    return window.matchMedia('(max-width: 800px)').matches;
  }

  function maxSpread(book) {
    return Math.ceil(book.pages.length / 2);
  }

  function spreadIndices(book, state) {
    if (isMobile()) {
      return { left: null, right: state.index };
    }
    if (state.spread === 0) return { left: -1, right: -1 };
    return { left: (state.spread - 1) * 2, right: (state.spread - 1) * 2 + 1 };
  }

  function bookMarkup(book, state) {
    const indices = spreadIndices(book, state);
    const cover = !isMobile() && state.spread === 0;
    return (
      '<div class="book ' + (cover ? 'page-cover' : '') + '" style="--book-color:' + book.colorA + '">' +
      (isMobile() ? '' : pageMarkup(book, indices.left, 'left', 'turn-shadow')) +
      pageMarkup(book, indices.right, 'right') +
      '<div class="book-flip" aria-hidden="true"></div>' +
      '</div>'
    );
  }

  function totalPages(book) { return book.pages.length; }

  function indicatorText(book, state) {
    if (isMobile()) {
      if (state.index < 0) return 'Sampul buku';
      return 'Halaman ' + (state.index + 1) + ' dari ' + totalPages(book);
    }
    if (state.spread === 0) return 'Sampul buku';
    const start = (state.spread - 1) * 2 + 1;
    const end = Math.min(start + 1, totalPages(book));
    return start === end ? 'Halaman ' + start + ' dari ' + totalPages(book) : 'Halaman ' + start + '–' + end + ' dari ' + totalPages(book);
  }

  function progressValue(book, state) {
    if (state.index < 0) return 0;
    return Math.round(((state.index + 1) / totalPages(book)) * 100);
  }

  function recordVisible(book, state) {
    const indices = spreadIndices(book, state);
    [indices.left, indices.right].forEach(index => {
      if (index == null || index < 0 || index >= totalPages(book)) return;
      Neko.store.recordBookPage(book.id, index, totalPages(book));
    });
  }

  function refreshReaderChrome() {
    if (!reader) return;
    const { book, state } = reader;
    const indicator = reader.node.querySelector('.page-indicator');
    if (indicator) indicator.textContent = indicatorText(book, state);
    const progress = reader.node.querySelector('.reader-progress span');
    if (progress) progress.style.width = progressValue(book, state) + '%';
    const prev = reader.node.querySelector('[data-reader-prev]');
    const next = reader.node.querySelector('[data-reader-next]');
    if (prev) prev.setAttribute('aria-disabled', String(state.index <= -1));
    if (next) next.setAttribute('aria-disabled', String(isMobile() ? state.index >= totalPages(book) - 1 : state.spread >= maxSpread(book)));
    const heart = reader.node.querySelector('[data-reader-fav]');
    if (heart) {
      const fav = (Neko.store.profile.favorites || []).includes(book.id);
      heart.setAttribute('aria-pressed', String(fav));
      heart.innerHTML = icon(fav ? 'heart' : 'star-outline');
      heart.setAttribute('aria-label', fav ? 'Hapus dari favorit' : 'Tambahkan ke favorit');
    }
  }

  function redraw() {
    if (!reader) return;
    const { book, state, node } = reader;
    const shell = node.querySelector('.book-shell');
    if (shell) shell.innerHTML = bookMarkup(book, state);
    bindReveals();
    refreshReaderChrome();
  }

  function bindReveals() {
    if (!reader) return;
    reader.node.querySelectorAll('[data-reveal]').forEach(button => {
      button.addEventListener('click', () => {
        const quiz = button.closest('.page-quiz');
        if (!quiz) return;
        quiz.classList.add('revealed');
        button.style.display = 'none';
        Neko.audio.play('reveal');
      });
    });
  }

  function desktopTarget(state, direction) {
    return direction > 0 ? state.spread + 1 : state.spread - 1;
  }

  async function flip(direction) {
    if (!reader || reader.flipping) return;
    const { book, state, node } = reader;
    if (isMobile()) {
      const nextIndex = state.index + direction;
      if (nextIndex < -1 || nextIndex >= totalPages(book)) return;
      state.index = nextIndex;
      redraw();
      recordVisible(book, state);
      Neko.audio.play('flip');
      return;
    }
    const target = desktopTarget(state, direction);
    if (target < 0 || target > maxSpread(book)) return;
    reader.flipping = true;
    const bookEl = node.querySelector('.book');
    const current = spreadIndices(book, state);
    const nextState = Object.assign({}, state, { spread: target });
    const next = spreadIndices(book, nextState);
    const frontIndex = direction > 0 ? current.right : current.left;
    const backIndex = direction > 0 ? next.left : next.right;
    const frontSide = direction > 0 ? 'right' : 'left';
    const backSide = direction > 0 ? 'left' : 'right';
    state.spread = target;
    const replacement = document.createElement('div');
    replacement.innerHTML = bookMarkup(book, state);
    const newBook = replacement.firstElementChild;
    const flipEl = newBook.querySelector('.book-flip');
    if (flipEl) {
      flipEl.innerHTML =
        '<div class="flip-face">' + pageMarkup(book, frontIndex, frontSide) + '</div>' +
        '<div class="flip-face back">' + pageMarkup(book, backIndex, backSide) + '</div>';
    }
    newBook.classList.add(direction > 0 ? 'is-flipping-next' : 'is-flipping-prev');
    bookEl.replaceWith(newBook);
    Neko.audio.play('flip');
    window.setTimeout(() => {
      newBook.classList.remove('is-flipping-next', 'is-flipping-prev');
      const oldFlip = newBook.querySelector('.book-flip');
      if (oldFlip) oldFlip.innerHTML = '';
      reader.flipping = false;
      recordVisible(book, state);
      refreshReaderChrome();
      bindReveals();
    }, Neko.util.reducedMotion() ? 20 : 740);
  }

  function closeReader() {
    if (!reader) return;
    const node = reader.node;
    const previous = reader.previousOverflow;
    reader = null;
    node.classList.add('is-closing');
    document.body.style.overflow = previous || '';
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
    Neko.audio.play('tap');
    window.setTimeout(() => {
      node.remove();
      if (Neko.app) Neko.app.refresh();
    }, 340);
  }

  function open(bookId, pageIndex = null) {
    const book = books().find(item => item.id === bookId);
    if (!book || reader) return;
    const saved = stateFor(book);
    const requested = Number(pageIndex);
    const startPage = clamp(pageIndex == null || !Number.isFinite(requested) ? (saved.maxPage || 0) : requested, 0, book.pages.length - 1);
    const state = {
      index: startPage,
      spread: isMobile() ? 0 : Math.floor(startPage / 2) + 1
    };
    const node = document.createElement('div');
    node.className = 'book-reader';
    node.innerHTML =
      '<header class="reader-bar">' +
      '<button type="button" class="btn btn-icon btn-soft" data-reader-close aria-label="Tutup buku">' + icon('arrow-left') + '</button>' +
      '<div class="reader-bar-title"><b>' + esc(book.title) + '</b><small>' + esc(book.category) + ' · ' + esc(book.tag) + '</small></div>' +
      '<div class="reader-bar-spacer"></div>' +
      '<button type="button" class="btn btn-icon btn-soft" data-reader-fav aria-label="Favorit"></button>' +
      '</header>' +
      '<div class="reader-body"><div class="book-shell">' + bookMarkup(book, state) + '</div></div>' +
      '<footer class="reader-foot">' +
      '<button type="button" class="btn btn-soft" data-reader-prev>' + icon('chevron-left') + 'Sebelumnya</button>' +
      '<span class="page-indicator"></span>' +
      '<button type="button" class="btn btn-primary" data-reader-next>Berikutnya' + icon('chevron-right') + '</button>' +
      '</footer>' +
      '<div class="reader-progress"><span></span></div>' +
      '<div class="book-hint">Gunakan tombol panah atau geser untuk membalik halaman.</div>';
    reader = { book, state, node, flipping: false, previousOverflow: document.body.style.overflow };
    document.body.appendChild(node);
    document.body.style.overflow = 'hidden';
    Neko.audio.play('flip');
    window.requestAnimationFrame(() => node.classList.add('is-open'));
    node.querySelector('[data-reader-close]').addEventListener('click', closeReader);
    node.querySelector('[data-reader-prev]').addEventListener('click', () => flip(-1));
    node.querySelector('[data-reader-next]').addEventListener('click', () => flip(1));
    node.querySelector('[data-reader-fav]').addEventListener('click', () => {
      const active = Neko.store.toggleFavorite(book.id);
      Neko.ui.toast(active ? 'Masuk favorit' : 'Dihapus dari favorit', book.title, active ? 'success' : 'info', active ? 'heart' : 'star-outline');
      refreshReaderChrome();
    });
    bindReveals();
    refreshReaderChrome();
    recordVisible(book, state);
    keyHandler = event => {
      if (!reader) return;
      if (event.key === 'Escape') { event.preventDefault(); closeReader(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); flip(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); flip(-1); }
    };
    document.addEventListener('keydown', keyHandler);
    node.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse') return;
      touchStart = { x: event.clientX, y: event.clientY };
    });
    node.addEventListener('pointerup', event => {
      if (!touchStart || event.pointerType === 'mouse') return;
      const dx = event.clientX - touchStart.x;
      const dy = event.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) < 54 || Math.abs(dx) < Math.abs(dy)) return;
      flip(dx < 0 ? 1 : -1);
    });
    window.setTimeout(() => {
      const hint = node.querySelector('.book-hint');
      if (hint) hint.remove();
    }, 5200);
  }

  Neko.book = { render, bind, open, close: closeReader, get isOpen() { return Boolean(reader); } };
})();
