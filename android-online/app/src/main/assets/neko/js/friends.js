/* ============================================================
   NEKO · js/friends.js
   View "Pesan": chat 1-on-1 + grup, telepon suara (WebRTC),
   cari akun, dan manajemen teman. Semua realtime lewat server.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { esc, timeAgo, initials, formatNumber } = Neko.util;
  const { icon } = Neko.icons;

  const state = {
    tab: 'chats',        // chats | groups | friends | requests | find
    query: '',
    mode: 'dm',          // dm | group
    peer: '',
    group: '',
    loading: false,
    chats: null,
    groups: null,
    friends: null,
    search: null,
    thread: null,
    threadPeer: null,
    typingPeer: false
  };

  let boundRoot = null;
  let searchDebounce = null;

  function enabled() {
    return Boolean(Neko.api && Neko.api.token) && location.protocol !== 'file:';
  }

  /* ============================================================
     TELEPON SUARA (WebRTC 1-on-1, signaling lewat server events)
     ============================================================ */

  const call = {
    active: false, pc: null, local: null, remote: null,
    peer: '', name: '', dir: '', muted: false,
    ui: null, ringTimer: null, incoming: null, candidates: [], uiTimer: null
  };

  function callPeerCandidates() {
    const pc = call.pc;
    if (!pc) return;
    const list = call.candidates.splice(0);
    list.forEach(item => { try { pc.addIceCandidate(new RTCSessionDescription(item)); } catch (error) { /* abaikan */ } });
  }

  function ensurePC() {
    if (call.pc) return call.pc;
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    });
    call.pc = pc;
    call.local.getTracks().forEach(track => pc.addTrack(track, call.local));
    const remote = new MediaStream();
    call.remote = remote;
    pc.ontrack = event => {
      event.streams[0].getTracks().forEach(track => remote.addTrack(track));
      const audio = call.ui && call.ui.querySelector('[data-call-remote]');
      if (audio) { audio.srcObject = remote; audio.play().catch(() => { }); }
    };
    pc.onicecandidate = event => {
      if (event.candidate) Neko.api.call.signal(call.peer, 'ice', { candidate: event.candidate.toJSON() }).catch(() => { });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') paintCallStatus('Terhubung');
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) endCall(false);
    };
    callPeerCandidates();
    return pc;
  }

  async function grabMic() {
    /* pengaturan broadcast-quality: AGC + noise suppression + echo cancel
       sejalan dengan pengalaman panggilan Discord yang jernih */
    call.local = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true },
        channelCount: 1,
        sampleRate: { ideal: 48000 },
        sampleSize: { ideal: 16 }
      }
    });
    const track = call.local && call.local.getAudioTracks()[0];
    if (track) {
      try {
        const caps = track.getCapabilities ? track.getCapabilities() : {};
        if (caps.echoCancellation) await track.applyConstraints({ echoCancellation: true, noiseSuppression: true, autoGainControl: true });
      } catch (error) { /* browser tidak mendukung applyConstraints */ }
    }
  }

  function callRing(on) {
    window.clearInterval(call.ringTimer);
    call.ringTimer = null;
    if (on) {
      Neko.audio.play('notify');
      call.ringTimer = window.setInterval(() => Neko.audio.play('notify'), 2200);
    }
  }

  function callLayerHTML(kind) {
    const label = call.name || call.peer || 'Teman';
    return (
      '<div class="call-layer is-open" data-call-layer>' +
      '<div class="call-card">' +
      '<span class="call-avatar">' + esc(initials(label)) + '</span>' +
      '<b>' + esc(label) + '</b>' +
      '<small data-call-status>' + esc(kind === 'in' ? 'Panggilan masuk…' : 'Memanggil…') + '</small>' +
      '<audio autoplay data-call-remote></audio>' +
      '<div class="call-actions">' +
      (kind === 'in'
        ? '<button type="button" class="call-btn accept" data-call-accept>' + icon('phone-call') + '</button>' +
        '<button type="button" class="call-btn decline" data-call-end>' + icon('close') + '</button>'
        : '<button type="button" class="call-btn mute" data-call-mute title="Bisukan">' + icon('microphone') + '</button>' +
        '<button type="button" class="call-btn decline" data-call-end>' + icon('close') + '</button>') +
      '</div>' +
      '</div></div>'
    );
  }

  function showCallUI(kind) {
    hideCallUI();
    const layer = document.createElement('div');
    layer.innerHTML = callLayerHTML(kind);
    document.body.appendChild(layer.firstElementChild);
    call.ui = document.body.querySelector('[data-call-layer]');
    const end = call.ui.querySelector('[data-call-end]');
    if (end) end.addEventListener('click', () => { endCall(true); });
    const accept = call.ui.querySelector('[data-call-accept]');
    if (accept) accept.addEventListener('click', () => { acceptCall(); });
    const mute = call.ui.querySelector('[data-call-mute]');
    if (mute) mute.addEventListener('click', () => {
      call.muted = !call.muted;
      call.local && call.local.getAudioTracks().forEach(track => { track.enabled = !call.muted; });
      mute.classList.toggle('off', call.muted);
      paintCallStatus(call.muted ? 'Mikrofon dibisukan' : 'Terhubung');
    });
  }

  function paintCallStatus(text) {
    const node = call.ui && call.ui.querySelector('[data-call-status]');
    if (node) node.textContent = text;
  }

  function hideCallUI() {
    if (call.ui) { call.ui.remove(); call.ui = null; }
  }

  function resetCall() {
    callRing(false);
    window.clearTimeout(call.uiTimer);
    hideCallUI();
    try { call.pc && call.pc.close(); } catch (error) { /* abaikan */ }
    if (call.local) call.local.getTracks().forEach(track => track.stop());
    call.pc = call.local = call.remote = null;
    call.active = call.muted = false;
    call.peer = call.name = call.dir = '';
    call.incoming = null;
    call.candidates = [];
  }

  async function startCall(peer, displayName) {
    if (call.active) { Neko.ui.toast('Masih menelepon', 'Tutup panggilan yang berjalan dulu.', 'warn', 'warning'); return; }
    if (!navigator.mediaDevices || !window.RTCPeerConnection) {
      Neko.ui.toast('Tidak didukung', 'Peramban ini belum mendukung telepon suara.', 'error', 'warning');
      return;
    }
    try {
      call.active = true;
      call.peer = peer; call.name = displayName || peer; call.dir = 'out';
      await grabMic();
      showCallUI('out');
      const pc = ensurePC();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await Neko.api.call.signal(peer, 'offer', { sdp: pc.localDescription.sdp });
      paintCallStatus('Berdering… tunggu jawaban');
      callRing(true);
    } catch (error) {
      Neko.ui.toast('Panggilan gagal', error.message || 'Izinkan mikrofon lalu coba lagi.', 'error', 'warning');
      resetCall();
    }
  }

  async function acceptCall() {
    if (!call.incoming) return;
    const offer = call.incoming;
    call.active = true;
    call.peer = offer.from;
    call.name = offer.displayName || offer.from;
    call.dir = 'in';
    showCallUI('out');
    paintCallStatus('Menyambungkan…');
    try {
      await grabMic();
      const pc = ensurePC();
      await pc.setRemoteDescription({ type: 'offer', sdp: offer.sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await Neko.api.call.signal(call.peer, 'answer', { sdp: pc.localDescription.sdp });
      paintCallStatus('Terhubung');
      callRing(false);
    } catch (error) {
      Neko.ui.toast('Tidak bisa menyambung', error.message || 'Izinkan mikrofon.', 'error', 'warning');
      endCall(true);
    }
  }

  function endCall(sendSignal) {
    if (sendSignal && call.peer) Neko.api.call.signal(call.peer, 'end', {}).catch(() => { });
    resetCall();
  }

  function handleCallSignal(data) {
    const kind = String(data.kind || '');
    if (kind === 'offer') {
      if (call.active) { Neko.api.call.signal(data.from, 'busy', {}).catch(() => { }); return; }
      call.incoming = data;
      call.active = true;
      call.peer = data.from;
      call.name = data.displayName || data.from;
      call.dir = 'in';
      showCallUI('in');
      callRing(true);
      return;
    }
    if (kind === 'answer' && call.pc && call.dir === 'out') {
      call.pc.setRemoteDescription({ type: 'answer', sdp: data.sdp }).catch(() => { });
      callRing(false);
      paintCallStatus('Terhubung');
      return;
    }
    if (kind === 'ice' && data.candidate) {
      if (call.pc) { try { call.pc.addIceCandidate(new RTCSessionDescription(data.candidate)); } catch (error) { /* abaikan */ } }
      else call.candidates.push(data.candidate);
      return;
    }
    if (kind === 'decline' || kind === 'busy' || kind === 'end') {
      if (call.active) {
        const notes = { decline: 'Panggilan ditolak.', busy: 'Temanmu sedang menelepon orang lain.', end: 'Panggilan berakhir.' };
        Neko.ui.toast('Telepon suara', notes[kind] || 'Panggilan berakhir.', 'info', 'phone-call');
      }
      resetCall();
    }
  }

  /* ============================================================
     Render
     ============================================================ */

  function render() {
    if (!enabled()) {
      return (
        '<section class="msg-offline">' +
        '<span class="msg-offline-ic">' + icon('wifi-off') + '</span>' +
        '<h2>Pesan butuh server NEKO</h2>' +
        '<p>Cari teman, add friend, grup chat, dan telepon suara baru aktif saat aplikasi dibuka dari server. Jalankan <b>Mulai-NEKO.bat</b>, lalu buka alamat server di setiap perangkat.</p>' +
        '<div class="msg-offline-tip">' + icon('info') + '<span>Semua riwayat pesan dan grup tersimpan di server, jadi tetap ada saat pindah perangkat.</span></div>' +
        '</section>'
      );
    }
    return (
      '<section class="msg-view" data-thread-open="' + ((state.peer || state.group) && (state.tab === 'chats' || state.tab === 'groups') ? '1' : '0') + '">' +
      '<header class="msg-head">' +
      '<div><span class="kicker">KOMUNITAS NEKO</span><h1>Pesan & Teman</h1>' +
      '<p>Ngobrol, bikin grup, telepon suara, dan kumpulkan teman dari perangkat mana pun.</p></div>' +
      '<div class="msg-head-actions">' +
      '<div class="msg-search">' + icon('search') + '<input id="msgSearch" type="search" placeholder="Cari username atau nama…" value="' + esc(state.query) + '" autocomplete="off"></div>' +
      '<button type="button" class="btn btn-soft btn-sm" data-msg-refresh>' + icon('restart') + 'Muat ulang</button>' +
      '</div></header>' +
      '<nav class="msg-tabs" role="tablist">' +
      msgTab('chats', 'Pesan', 'chat') +
      msgTab('groups', 'Grup', 'users') +
      msgTab('friends', 'Teman', 'user') +
      msgTab('requests', 'Permintaan', 'bell') +
      msgTab('find', 'Cari akun', 'search') +
      '</nav>' +
      '<div class="msg-body" id="msgBody">' + panelHTML() + '</div>' +
      '</section>'
    );
  }

  function msgTab(id, label, ic) {
    const n = id === 'chats' ? totalUnread() : id === 'requests' ? incomingCount() : id === 'groups' ? groupUnread() : 0;
    return (
      '<button type="button" role="tab" class="msg-tab ' + (state.tab === id ? 'on' : '') + '" data-msg-tab="' + id + '" aria-selected="' + String(state.tab === id) + '">' +
      icon(ic) + '<span>' + label + '</span>' + (n ? '<i class="msg-tab-n">' + n + '</i>' : '') + '</button>'
    );
  }

  function totalUnread() {
    return state.chats ? state.chats.totalUnread || 0 : 0;
  }

  function groupUnread() {
    return state.groups ? (state.groups || []).reduce((sum, g) => sum + (g.unread || 0), 0) : 0;
  }

  function incomingCount() {
    return state.friends && state.friends.incoming ? state.friends.incoming.length : 0;
  }

  function panelHTML() {
    if (state.loading) return '<div class="msg-loading">' + icon('restart') + '<span>Mengambil data dari server…</span></div>';
    if (state.tab === 'chats') return chatsHTML();
    if (state.tab === 'groups') return groupsHTML();
    if (state.tab === 'friends') return friendsHTML();
    if (state.tab === 'requests') return requestsHTML();
    return searchHTML();
  }

  function chatsHTML() {
    const list = state.chats ? state.chats.conversations : [];
    const peers = list.filter(item => item.lastAt > 0);
    const idle = list.filter(item => !item.lastAt);
    const rows = peers.concat(idle);
    if (!rows.length) {
      return emptyState('users', 'Belum ada percakapan', 'Cari akun temanmu di tab "Cari akun", kirim permintaan berteman, lalu mulai ngobrol di sini.');
    }
    return (
      '<div class="msg-split">' +
      '<div class="msg-list">' + rows.map(convoRow).join('') + '</div>' +
      '<div class="msg-thread" id="msgThread">' + (state.peer ? threadHTML() : threadPlaceholder()) + '</div>' +
      '</div>'
    );
  }

  function groupsHTML() {
    const list = state.groups || [];
    if (!list.length && !state.group) {
      return (
        '<div class="msg-groups-head">' +
        '<button type="button" class="btn btn-primary" data-group-create>' + icon('plus') + ' Buat grup baru</button>' +
        '</div>' +
        emptyState('users', 'Belum ada grup', 'Buat grup dengan teman-temanmu, lalu ngobrol bareng dalam satu ruangan.')
      );
    }
    return (
      '<div class="msg-split">' +
      '<div class="msg-list">' +
      '<div class="msg-groups-head"><button type="button" class="btn btn-soft btn-sm" data-group-create>' + icon('plus') + ' Buat grup</button></div>' +
      list.map(groupRow).join('') + '</div>' +
      '<div class="msg-thread" id="msgThread">' + (state.group ? threadHTML() : threadPlaceholder()) + '</div>' +
      '</div>'
    );
  }

  function convoRow(item) {
    const active = state.mode === 'dm' && state.peer && normalize(item.username) === normalize(state.peer);
    const preview = item.lastText ? (normalize(item.lastFrom) === normalize(selfName()) ? 'Kamu: ' : '') + item.lastText : 'Belum ada pesan';
    return (
      '<button type="button" class="msg-convo ' + (active ? 'on' : '') + '" data-msg-peer="' + esc(item.username) + '">' +
      '<span class="msg-avatar">' + esc(initials(item.displayName)) + (item.unread ? '<i class="msg-dot"></i>' : '') + '</span>' +
      '<span class="msg-convo-copy"><b>' + esc(item.displayName) + '</b>' +
      '<small>' + esc(preview) + '</small></span>' +
      '<span class="msg-convo-time">' + (item.lastAt ? timeAgo(item.lastAt) : '') + (item.unread ? '<i class="msg-pill">' + item.unread + '</i>' : '') + '</span>' +
      '</button>'
    );
  }

  function groupRow(item) {
    const active = state.mode === 'group' && state.group === item.id;
    const preview = item.lastText ? item.lastText : 'Belum ada pesan';
    return (
      '<button type="button" class="msg-convo ' + (active ? 'on' : '') + '" data-msg-group="' + esc(item.id) + '">' +
      '<span class="msg-avatar is-group">' + icon('users') + (item.unread ? '<i class="msg-dot"></i>' : '') + '</span>' +
      '<span class="msg-convo-copy"><b>' + esc(item.name) + '</b>' +
      '<small>' + esc(preview) + '</small></span>' +
      '<span class="msg-convo-time">' + (item.lastAt ? timeAgo(item.lastAt) : '') + (item.unread ? '<i class="msg-pill">' + item.unread + '</i>' : '') + '</span>' +
      '</button>'
    );
  }

  function threadPlaceholder() {
    return (
      '<div class="msg-thread-empty"><span class="logo-mask" aria-hidden="true"></span>' +
      '<p>Pilih percakapan di sebelah untuk mulai membaca dan membalas.</p></div>'
    );
  }

  function threadHTML() {
    if (!state.thread) {
      return '<div class="msg-loading">' + icon('restart') + '<span>Membuka percakapan…</span></div>';
    }
    const messages = state.thread.messages || [];
    const isGroup = state.mode === 'group';
    const title = isGroup ? (state.thread.group ? state.thread.group.name : 'Grup') : threadName();
    const sub = isGroup
      ? ((state.thread.group ? state.thread.group.members.length : 0) + ' anggota')
      : '@' + esc(state.peer) + (state.typingPeer ? ' · sedang menulis…' : '');
    const actions = isGroup
      ? '<button type="button" class="btn btn-ghost btn-sm" data-group-members title="Anggota grup">' + icon('user-plus') + '</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-group-leave title="Keluar grup">' + icon('exit') + '</button>'
      : '<button type="button" class="btn btn-ghost btn-sm" data-msg-profile="' + esc(state.peer) + '" title="Lihat profil">' + icon('user') + '</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-msg-call title="Telepon suara">' + icon('phone-call') + '</button>';
    return (
      '<header class="msg-thread-head">' +
      '<button type="button" class="btn btn-ghost btn-sm msg-back" data-msg-back>' + icon('arrow-left') + '</button>' +
      (isGroup ? '<span class="msg-avatar is-group">' + icon('users') + '</span>' : '<span class="msg-avatar">' + esc(initials(title)) + '</span>') +
      '<div class="msg-thread-id"><b>' + esc(title) + '</b><small>' + sub + '</small></div>' +
      '<div class="msg-thread-actions">' + actions + '</div>' +
      '</header>' +
      '<div class="msg-bubbles" id="msgBubbles">' + (messages.length ? messages.map(bubbleHTML).join('') : '<div class="msg-bubbles-empty">Belum ada pesan. Kirim yang pertama!</div>') + '</div>' +
      '<form class="msg-composer" id="msgComposer">' +
      '<input type="file" id="msgMediaFile" accept="image/*" hidden>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-msg-attach title="Kirim foto">' + icon('image') + '</button>' +
      '<input id="msgText" type="text" maxlength="500" placeholder="Tulis pesan…" autocomplete="off">' +
      '<button type="submit" class="btn btn-primary btn-sm" data-msg-send>' + icon('send') + 'Kirim</button>' +
      '</form>'
    );
  }

  function threadName() {
    if (state.thread && state.thread.peer) return state.thread.peer.displayName;
    const found = state.chats && state.chats.conversations.find(item => normalize(item.username) === normalize(state.peer));
    return found ? found.displayName : state.peer;
  }

  /* Foto dari galeri HP sering 3–8 MB; dikecilkan dulu supaya cepat terkirim
     dan muat di penyimpanan server. GIF dibiarkan apa adanya agar animasinya
     tidak hilang. */
  function siapkanFoto(file) {
    if (file.type === 'image/gif' || file.size <= 300 * 1024) return Promise.resolve(file);
    return new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob(blob => {
          if (!blob || blob.size >= file.size) return resolve(file);
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  /* Bubble: milikku menempel ke kanan (POV pengirim), ukuran mengikuti teks.
     Pesan bisa berupa teks atau foto. */
  function mediaHTML(item) {
    const url = String(item.media || '');
    const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(url);
    if (isVideo) {
      return '<video class="msg-bubble-media" src="' + esc(url) + '" controls preload="metadata" playsinline></video>';
    }
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener"><img class="msg-bubble-media" src="' + esc(url) + '" alt="foto" loading="lazy"></a>';
  }

  function bubbleHTML(item) {
    const isGroup = state.mode === 'group';
    const mine = isGroup
      ? normalize(item.from) === normalize(selfName())
      : item.from === normalize(selfName());
    const sender = isGroup ? (item.displayName || item.from) : '';
    const body = (item.media ? mediaHTML(item) : '') +
      (item.text ? '<span class="msg-bubble-text">' + esc(item.text) + '</span>' : '');
    return (
      '<div class="msg-bubble-row ' + (mine ? 'me' : 'them') + '">' +
      (isGroup && !mine ? '<span class="msg-bubble-avatar">' + esc(initials(sender)) + '</span>' : '') +
      '<div class="msg-bubble ' + (mine ? 'me' : 'them') + (item.media ? ' has-media' : '') + '">' +
      (isGroup && !mine ? '<span class="msg-bubble-name">' + esc(sender) + '</span>' : '') +
      body +
      '<span class="msg-bubble-meta">' + timeAgo(item.at) + (mine ? (state.mode === 'dm' ? (item.read ? ' · dibaca' : ' · terkirim') : (item.read && item.read.length ? ' · dibaca ' + item.read.length : '')) : '') + '</span>' +
      '</div></div>'
    );
  }

  /* Sheet profil detail: XP, badge, statistik, tombol hapus teman ada di sini saja */
  async function profileSheet(username) {
    let data = null;
    try {
      data = await Neko.api.profileDetail(username);
    } catch (error) {
      Neko.ui.toast('Profil tidak terbuka', error.message || 'Coba lagi.', 'error', 'warning');
      return;
    }
    const user = data.user || {};
    const season = data.season || {};
    const isFriend = (state.friends && state.friends.friends || []).some(item => normalize(item.username) === normalize(username));
    const stats = user.stats || {};
    const rows = [
      ['XP', formatNumber(user.xp || 0)],
      ['Gelar', user.title || season.title || '-'],
      ['Season', season.name ? season.name + ' · ' + Math.round(season.progress || 0) + '%' : '-'],
      ['Sesi game', String(stats.gamesPlayed || 0)],
      ['Buku tamat', String(stats.booksFinished || 0)],
      ['Menang live', String(stats.liveWins || 0)],
      ['Streak check-in', String(stats.checkinBest || 0) + ' hari'],
      ['Teman', String(data.friendsCount || 0)],
      ['Bergabung', data.createdAt ? new Date(data.createdAt).toLocaleDateString('id-ID') : '-']
    ];
    const badges = (data.badges || []).slice(0, 12);
    const best = data.bestScores || [];
    Neko.ui.sheet({
      kicker: 'PROFIL PEMAIN',
      title: user.displayName || username,
      sub: '@' + (user.username || username) + ' · ' + (user.role || 'Member'),
      body:
        '<div class="profile-viewer">' +
        '<div class="profile-viewer-head">' +
        (user.avatarMedia || user.avatar
          ? '<img class="profile-viewer-avatar" src="' + esc(user.avatarMedia || user.avatar) + '" alt="">'
          : '<span class="profile-viewer-avatar">' + esc(initials(user.displayName || username)) + '</span>') +
        '<div class="profile-viewer-meta"><b>' + esc(season.title || 'Member') + '</b><small>' + esc(season.name || '') + '</small></div>' +
        '</div>' +
        (user.bio ? '<p class="profile-viewer-bio">' + esc(user.bio) + '</p>' : '') +
        '<div class="profile-viewer-rows">' + rows.map(([k, v]) => '<div class="pv-row"><b>' + esc(k) + '</b><span>' + esc(v) + '</span></div>').join('') + '</div>' +
        (best.length ? '<div class="setup-label" style="margin-top:12px">Skor terbaik</div><div class="pv-best">' + best.map(item => '<span class="pv-best-chip">' + esc(item.id) + ' · ' + item.best + '</span>').join('') + '</div>' : '') +
        (badges.length ? '<div class="setup-label" style="margin-top:12px">Penghargaan (' + badges.length + ')</div><div class="pv-badges">' + badges.map(b => '<span class="pv-badge">' + icon('medal') + esc(b) + '</span>').join('') + '</div>' : '') +
        '</div>',
      foot:
        '<button type="button" class="btn btn-soft" data-sheet-close>Tutup</button>' +
        (isFriend ? '<button type="button" class="btn btn-danger" data-pv-remove="' + esc(user.username) + '">' + icon('close') + ' Hapus teman</button>'
          : '<button type="button" class="btn btn-primary" data-pv-add="' + esc(user.username) + '">' + icon('user-plus') + ' Tambah teman</button>') +
        (isFriend ? '<button type="button" class="btn btn-primary" data-pv-chat="' + esc(user.username) + '">' + icon('chat') + ' Chat</button>' : ''),
      onMount(el) {
        const remove = el.querySelector('[data-pv-remove]');
        if (remove) remove.addEventListener('click', async () => {
          const ok = await Neko.ui.dialog({
            danger: true, title: 'Hapus teman @' + user.username + '?',
            body: 'Koneksi berteman akan diputus dan riwayat chat tidak bisa dilanjutkan.',
            warning: 'Perlu mengirim permintaan teman baru dan menunggu disetujui.',
            confirmText: 'Ya, putuskan', icon: 'warning'
          });
          if (!ok) return;
          try {
            await Neko.api.friends.remove(user.username);
            Neko.ui.toast('Teman dihapus', '@' + user.username + ' keluar dari daftar teman.', 'info', 'close');
            Neko.ui.closeTop();
            loadShell(false);
          } catch (error) {
            Neko.ui.toast('Gagal', error.message || 'Coba lagi.', 'error', 'warning');
          }
        });
        const add = el.querySelector('[data-pv-add]');
        if (add) add.addEventListener('click', () => { mutate(Neko.api.friends.request(user.username), 'Permintaan terkirim ke @' + user.username + '.'); Neko.ui.closeTop(); });
        const chat = el.querySelector('[data-pv-chat]');
        if (chat) chat.addEventListener('click', () => { Neko.ui.closeTop(); window.setTimeout(() => loadThread(user.username), 220); });
      }
    });
  }

  function friendsHTML() {
    const list = state.friends && state.friends.friends ? state.friends.friends : [];
    const outgoing = state.friends && state.friends.outgoing ? state.friends.outgoing : [];
    if (!list.length && !outgoing.length) {
      return emptyState('users', 'Daftar teman masih kosong', 'Begitu permintaanmu diterima, nama mereka muncul di sini lengkap dengan level XP-nya.');
    }
    return (
      '<div class="msg-friends">' +
      list.map(friendRow).join('') +
      (outgoing.length ? '<div class="msg-outgoing"><span class="setup-label">Permintaan terkirim</span><div class="msg-out-row">' + outgoing.map(item => '<span class="msg-out-chip">' + esc(item.displayName) + '</span>').join('') + '</div></div>' : '') +
      '</div>'
    );
  }

  function friendRow(item) {
    return (
      '<div class="msg-friend-card">' +
      '<button type="button" class="msg-avatar lg" data-msg-profile="' + esc(item.username) + '" title="Lihat profil">' + esc(initials(item.displayName)) + '</button>' +
      '<div class="msg-friend-copy"><b>' + esc(item.displayName) + '</b><small>@' + esc(item.username) + ' · ' + esc(item.role || 'Member') + '</small>' +
      '<span class="msg-friend-xp">' + icon('xp') + (item.xp || 0) + ' XP · ' + esc(item.title || '') + '</span></div>' +
      '<div class="msg-friend-actions">' +
      '<span class="msg-state-chip friend-ok">' + icon('check-circle') + 'Friend</span>' +
      '<button type="button" class="btn btn-soft btn-sm" data-msg-peer="' + esc(item.username) + '" data-msg-open>' + icon('chat') + 'Chat</button>' +
      '<button type="button" class="btn btn-soft btn-sm" data-msg-call-from="' + esc(item.username) + '" data-call-name="' + esc(item.displayName) + '">' + icon('phone-call') + 'Telepon</button>' +
      '</div></div>'
    );
  }

  function requestsHTML() {
    const incoming = state.friends && state.friends.incoming ? state.friends.incoming : [];
    if (!incoming.length) {
      return emptyState('bell', 'Tidak ada permintaan masuk', 'Permintaan berteman dari akun lain akan muncul di sini beserta tombol Terima / Tolak.');
    }
    return (
      '<div class="msg-requests">' + incoming.map(item => (
        '<div class="msg-request-card">' +
        '<span class="msg-avatar lg">' + esc(initials(item.displayName)) + '</span>' +
        '<div class="msg-friend-copy"><b>' + esc(item.displayName) + '</b><small>@' + esc(item.username) + ' · ' + (item.xp || 0) + ' XP</small></div>' +
        '<div class="msg-friend-actions">' +
        '<button type="button" class="btn btn-primary btn-sm" data-msg-accept="' + esc(item.username) + '">' + icon('check') + 'Terima</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-msg-decline="' + esc(item.username) + '">' + icon('close') + 'Tolak</button>' +
        '</div></div>'
      )).join('') + '</div>'
    );
  }

  function searchHTML() {
    if (state.search === null) {
      return emptyState('search', 'Mulai cari akun', 'Ketik nama atau username di kolom pencarian. Hasil datang langsung dari server.');
    }
    if (!state.search.length) {
      return emptyState('spy', 'Tidak ada akun ditemukan', 'Coba kata kunci lain, atau minta teman mendaftar lewat tab Daftar di halaman masuk.');
    }
    return (
      '<div class="msg-results">' + state.search.map(resultRow).join('') + '</div>'
    );
  }

  function resultRow(item) {
    let action;
    if (item.isFriend) action = '<span class="msg-state-chip friend-ok">' + icon('check-circle') + 'Friend</span>';
    else if (item.incoming) action = '<button type="button" class="btn btn-primary btn-sm" data-msg-accept="' + esc(item.username) + '">' + icon('check') + 'Terima</button>';
    else if (item.outgoing) action = '<span class="msg-state-chip pending">' + icon('clock') + 'Terkirim</span>';
    else action = '<button type="button" class="btn btn-primary btn-sm" data-msg-add="' + esc(item.username) + '">' + icon('user-plus') + 'Add</button>';
    return (
      '<div class="msg-friend-card">' +
      '<span class="msg-avatar lg">' + esc(initials(item.displayName)) + '</span>' +
      '<div class="msg-friend-copy"><b>' + esc(item.displayName) + '</b><small>@' + esc(item.username) + ' · ' + esc(item.role || 'Member') + '</small>' +
      '<span class="msg-friend-xp">' + icon('xp') + (item.xp || 0) + ' XP</span></div>' +
      '<div class="msg-friend-actions">' + action + '</div>' +
      '</div>'
    );
  }

  function emptyState(ic, title, sub) {
    return (
      '<div class="msg-empty">' +
      '<span class="msg-empty-ic">' + icon(ic) + '</span>' +
      '<h3>' + esc(title) + '</h3><p>' + esc(sub) + '</p>' +
      '</div>'
    );
  }

  /* ============================================================
     Sheet grup
     ============================================================ */

  async function createGroupSheet() {
    let friends = [];
    try {
      const data = await Neko.api.friends.list();
      friends = (data.friends || []).filter(item => item && item.username);
    } catch (error) {
      Neko.ui.toast('Daftar teman', error.message || 'Coba lagi.', 'error', 'warning');
      return;
    }
    const chosen = new Set();
    Neko.ui.sheet({
      kicker: 'GRUP BARU',
      title: 'Buat grup chat',
      sub: 'Pilih nama grup dan teman yang mau diajak.',
      body: '<div class="room-invite">' +
        '<label class="field"><span>Nama grup</span><input id="groupName" maxlength="40" placeholder="Contoh: Kelompok 1 TJKT"></label>' +
        (friends.length ? '<div class="room-friend-list">' + friends.map(friend =>
          '<label class="room-friend" data-friend="' + esc(friend.username) + '">' +
          '<input type="checkbox"><b>' + esc(friend.displayName || friend.username) + '</b>' +
          '<small>@' + esc(friend.username) + '</small></label>').join('') + '</div>'
          : '<div class="room-empty">Tambah teman dulu di tab Teman sebelum membuat grup.</div>') +
        '</div>',
      foot: '<button type="button" class="btn btn-soft" data-sheet-close>Batal</button>' +
        '<button type="button" class="btn btn-primary" data-group-go>' + icon('users') + ' Buat grup</button>',
      onMount(el) {
        el.querySelectorAll('[data-friend]').forEach(row => {
          row.addEventListener('click', () => {
            const box = row.querySelector('input');
            box.checked = !box.checked;
            row.classList.toggle('on', box.checked);
            if (box.checked) chosen.add(row.dataset.friend);
            else chosen.delete(row.dataset.friend);
            Neko.audio.play('tick');
          });
        });
        el.querySelector('[data-group-go]').addEventListener('click', async () => {
          const name = String(el.querySelector('#groupName').value || '').trim();
          if (!name) { Neko.ui.toast('Nama grup', 'Isi nama grup dulu ya.', 'warn', 'warning'); return; }
          const button = el.querySelector('[data-group-go]');
          button.disabled = true;
          try {
            await Neko.api.groups.create(name, Array.from(chosen));
            Neko.ui.toast('Grup dibuat', name + ' siap dipakai ngobrol.', 'success', 'users');
            Neko.audio.play('success');
            Neko.ui.closeTop();
            state.tab = 'groups';
            paintTabs();
            await loadShell(false);
          } catch (error) {
            button.disabled = false;
            Neko.ui.toast('Gagal membuat grup', error.message || 'Coba lagi.', 'error', 'warning');
          }
        });
      }
    });
  }

  function addMembersSheet() {
    const group = state.thread && state.thread.group;
    if (!group) return;
    const memberKeys = (group.members || []).map(m => normalize(m.username));
    Neko.api.friends.list().then(data => {
      const friends = (data.friends || []).filter(item => item && item.username && !memberKeys.includes(normalize(item.username)));
      const chosen = new Set();
      Neko.ui.sheet({
        kicker: 'TAMBAH ANGGOTA',
        title: 'Undang teman ke grup',
        sub: group.name,
        body: friends.length
          ? '<div class="room-friend-list">' + friends.map(friend =>
            '<label class="room-friend" data-friend="' + esc(friend.username) + '">' +
            '<input type="checkbox"><b>' + esc(friend.displayName || friend.username) + '</b>' +
            '<small>@' + esc(friend.username) + '</small></label>').join('') + '</div>'
          : '<div class="room-empty">Semua temanmu sudah ada di grup ini.</div>',
        foot: '<button type="button" class="btn btn-soft" data-sheet-close>Batal</button>' +
          '<button type="button" class="btn btn-primary" data-add-go>' + icon('user-plus') + ' Tambahkan</button>',
        onMount(el) {
          el.querySelectorAll('[data-friend]').forEach(row => {
            row.addEventListener('click', () => {
              const box = row.querySelector('input');
              box.checked = !box.checked;
              row.classList.toggle('on', box.checked);
              if (box.checked) chosen.add(row.dataset.friend);
              else chosen.delete(row.dataset.friend);
            });
          });
          el.querySelector('[data-add-go]').addEventListener('click', async () => {
            if (!chosen.size) { Neko.ui.toast('Pilih teman', 'Centang minimal satu teman.', 'warn', 'warning'); return; }
            try {
              await Neko.api.groups.members(group.id, Array.from(chosen));
              Neko.ui.toast('Anggota ditambahkan', chosen.size + ' teman masuk grup.', 'success', 'users');
              Neko.ui.closeTop();
              loadGroup(group.id);
            } catch (error) {
              Neko.ui.toast('Gagal', error.message || 'Coba lagi.', 'error', 'warning');
            }
          });
        }
      });
    }).catch(error => Neko.ui.toast('Gagal', error.message || 'Coba lagi.', 'error', 'warning'));
  }

  function memberListSheet() {
    const group = state.thread && state.thread.group;
    if (!group) return;
    const rows = (group.members || []).map(member =>
      '<div class="msg-member-row">' +
      '<span class="msg-avatar">' + esc(initials(member.displayName)) + '</span>' +
      '<div class="msg-friend-copy"><b>' + esc(member.displayName) + '</b><small>@' + esc(member.username) + (member.username === group.host ? ' · pemilik grup' : '') + '</small></div>' +
      '</div>').join('');
    Neko.ui.sheet({
      kicker: 'ANGGOTA GRUP',
      title: group.name,
      sub: (group.members || []).length + ' anggota',
      body: '<div class="msg-members">' + rows + '</div>',
      foot: '<button type="button" class="btn btn-primary" data-sheet-close>Tutup</button>'
    });
  }

  /* ============================================================
     Data
     ============================================================ */

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function selfName() {
    return Neko.store.session ? Neko.store.session.username : '';
  }

  async function loadShell(force) {
    if (!enabled()) return;
    if (force) state.loading = true;
    paintBody();
    const jobs = [Neko.api.chats.list(), Neko.api.friends.list(), Neko.api.groups.list()];
    try {
      const [chats, friends, groups] = await Promise.all(jobs);
      state.chats = chats;
      state.friends = friends;
      state.groups = (groups && groups.groups) || [];
    } catch (error) {
      state.chats = state.chats || { conversations: [], totalUnread: 0 };
      state.friends = state.friends || { friends: [], incoming: [], outgoing: [] };
      state.groups = state.groups || [];
      if (error.status === 401) return;
    } finally {
      state.loading = false;
    }
    paintTabs();
    paintBody();
    if (state.peer && state.tab === 'chats') loadThread(state.peer);
    if (state.group && state.tab === 'groups') loadGroup(state.group);
  }

  async function loadThread(peer) {
    state.mode = 'dm';
    state.peer = peer;
    state.group = '';
    state.thread = null;
    paintBody();
    try {
      state.thread = await Neko.api.chats.messages(peer);
      await Neko.api.chats.read(peer).catch(() => { });
      if (state.chats) {
        state.chats.conversations.forEach(item => {
          if (normalize(item.username) === normalize(peer)) item.unread = 0;
        });
        state.chats.totalUnread = state.chats.conversations.reduce((sum, item) => sum + (item.unread || 0), 0);
      }
    } catch (error) {
      state.thread = { messages: [], peer: null, error: error.message };
    }
    paintTabs();
    paintBody();
    scrollBubbles();
  }

  async function loadGroup(id) {
    state.mode = 'group';
    state.group = id;
    state.peer = '';
    state.thread = null;
    paintBody();
    try {
      state.thread = await Neko.api.groups.messages(id);
      if (state.groups) {
        state.groups.forEach(g => { if (g.id === id) g.unread = 0; });
      }
    } catch (error) {
      state.thread = { messages: [], group: null, error: error.message };
    }
    paintTabs();
    paintBody();
    scrollBubbles();
  }

  async function runSearch() {
    if (!enabled()) return;
    try {
      const data = await Neko.api.users.search(state.query);
      state.search = data.users || [];
    } catch (error) {
      state.search = [];
    }
    paintBody();
  }

  async function mutate(promise, successText, reload) {
    try {
      await promise;
      if (successText) Neko.ui.toast('Berhasil', successText, 'success', 'check');
      Neko.audio.play('success');
      if (reload !== false) await loadShell(false);
    } catch (error) {
      Neko.audio.play('error');
      Neko.ui.toast('Gagal', error.message || 'Coba lagi sebentar lagi.', 'error', 'warning');
    }
  }

  async function confirmUnfriend(who, done) {
    const ok = await Neko.ui.dialog({
      danger: true,
      title: 'Hapus teman @' + who + '?',
      body: 'Koneksi berteman akan diputus dan seluruh riwayat chat dengan akun ini tidak bisa dilanjutkan.',
      warning: 'Aksi ini tidak mudah dibatalkan — kamu harus mengirim permintaan teman baru dan menunggu disetujui.',
      confirmText: 'Ya, putuskan',
      cancelText: 'Batal',
      icon: 'warning'
    });
    if (!ok) return;
    await mutate(Neko.api.friends.remove(who), 'Teman dihapus dari daftar.');
    if (done) done();
  }

  /* ============================================================
     Bind
     ============================================================ */

  function bind(root) {
    boundRoot = root;
    if (!enabled()) return;
    loadShell(true);

    root.addEventListener('click', event => {
      const tab = event.target.closest('[data-msg-tab]');
      if (tab) {
        state.tab = tab.dataset.msgTab;
        Neko.audio.play('select');
        if (state.tab === 'find' && state.query && state.search === null) runSearch();
        paintTabs();
        paintBody();
        return;
      }
      const refresh = event.target.closest('[data-msg-refresh]');
      if (refresh) { Neko.audio.play('tap'); loadShell(true); return; }

      const openPeer = event.target.closest('[data-msg-peer]');
      if (openPeer) {
        Neko.audio.play('select');
        state.tab = 'chats';
        paintTabs();
        loadThread(openPeer.dataset.msgPeer);
        return;
      }
      const openGroup = event.target.closest('[data-msg-group]');
      if (openGroup) {
        Neko.audio.play('select');
        state.tab = 'groups';
        paintTabs();
        loadGroup(openGroup.dataset.msgGroup);
        return;
      }
      if (event.target.closest('[data-msg-back]')) {
        state.peer = '';
        state.group = '';
        state.thread = null;
        paintBody();
        return;
      }
      if (event.target.closest('[data-group-create]')) { createGroupSheet(); return; }
      if (event.target.closest('[data-group-members]')) { memberListSheet(); return; }
      const groupAdd = event.target.closest('[data-group-members-add]');
      if (groupAdd) { addMembersSheet(); return; }
      const groupLeave = event.target.closest('[data-group-leave]');
      if (groupLeave) {
        const group = state.thread && state.thread.group;
        if (!group) return;
        Neko.ui.dialog({
          danger: true,
          title: 'Keluar dari grup?',
          body: group.host === normalize(selfName())
            ? 'Kamu pemilik grup ini — keluar akan menutup grup dan seluruh riwayatnya.'
            : 'Kamu akan berhenti menerima pesan dari grup ' + group.name + '.',
          confirmText: 'Keluar',
          icon: 'exit'
        }).then(async ok => {
          if (!ok) return;
          try {
            await Neko.api.groups.leave(group.id);
            Neko.ui.toast('Keluar grup', 'Kamu sudah keluar dari grup.', 'info', 'exit');
            state.group = '';
            state.thread = null;
            await loadShell(false);
          } catch (error) {
            Neko.ui.toast('Gagal', error.message || 'Coba lagi.', 'error', 'warning');
          }
        });
        return;
      }
      const callBtn = event.target.closest('[data-msg-call]');
      if (callBtn) {
        startCall(normalize(state.peer), threadName());
        return;
      }
      const profileView = event.target.closest('[data-msg-profile]');
      if (profileView) { profileSheet(profileView.dataset.msgProfile); return; }
      const callFrom = event.target.closest('[data-msg-call-from]');
      if (callFrom) {
        startCall(normalize(callFrom.dataset.msgCallFrom), callFrom.dataset.callName || '');
        return;
      }
      const attach = event.target.closest('[data-msg-attach]');
      if (attach) {
        const picker = root.querySelector('#msgMediaFile');
        if (picker) picker.click();
        return;
      }
      const add = event.target.closest('[data-msg-add]');
      if (add) { mutate(Neko.api.friends.request(add.dataset.msgAdd), 'Permintaan teman terkirim ke @' + add.dataset.msgAdd + '.'); return; }
      const accept = event.target.closest('[data-msg-accept]');
      if (accept) { mutate(Neko.api.friends.accept(accept.dataset.msgAccept), 'Sekarang berteman. Silakan chat!'); return; }
      const decline = event.target.closest('[data-msg-decline]');
      if (decline) { mutate(Neko.api.friends.decline(decline.dataset.msgDecline), 'Permintaan ditolak.'); return; }
      const remove = event.target.closest('[data-msg-remove]');
      if (remove) { confirmUnfriend(remove.dataset.msgRemove); return; }
      const unfriend = event.target.closest('[data-msg-unfriend]');
      if (unfriend && state.peer) {
        confirmUnfriend(state.peer, () => {
          state.peer = '';
          state.thread = null;
          paintBody();
        });
      }
    });

    root.addEventListener('submit', event => {
      if (!event.target.matches('#msgComposer')) return;
      event.preventDefault();
      const input = root.querySelector('#msgText');
      const text = input ? input.value.trim() : '';
      if (!text) return;
      const isGroup = state.mode === 'group';
      if (!isGroup && !state.peer) return;
      if (isGroup && !state.group) return;
      const sendBtn = root.querySelector('[data-msg-send]');
      if (sendBtn) sendBtn.disabled = true;
      optimisticPush(text);
      if (input) input.value = '';
      const request = isGroup ? Neko.api.groups.send(state.group, text) : Neko.api.chats.send(state.peer, text);
      request.then(() => {
        if (!isGroup && state.chats) {
          const convo = state.chats.conversations.find(item => normalize(item.username) === normalize(state.peer));
          if (convo) { convo.lastText = text; convo.lastFrom = normalize(selfName()); convo.lastAt = Date.now(); }
        }
        if (isGroup && state.groups) {
          const g = state.groups.find(item => item.id === state.group);
          if (g) { g.lastText = text; g.lastAt = Date.now(); }
        }
        if (state.thread && state.thread.messages) {
          state.thread.messages.forEach(item => {
            if (normalize(item.from) !== normalize(selfName())) return;
            if (isGroup) item.read = (item.read || []).concat(state.thread.group ? state.thread.group.members.map(m => normalize(m.username)) : []);
            else item.read = true;
          });
        }
        paintBubbles();
      }).catch(error => {
        dropOptimistic(text);
        Neko.ui.toast('Pesan gagal terkirim', error.message || 'Coba lagi.', 'error', 'warning');
        Neko.audio.play('error');
      }).finally(() => {
        if (sendBtn) sendBtn.disabled = false;
        const again = root.querySelector('#msgText');
        if (again) again.focus();
      });
      Neko.audio.play('select');
    });

    /* Picker foto ikut dibuat ulang setiap thread dibuka, jadi listener
       dipasang di root (delegasi), bukan pada elemen yang bisa hilang. */
    root.addEventListener('change', event => {
      if (event.target.id !== 'msgMediaFile') return;
      const picker = event.target;
      const file = picker.files && picker.files[0];
      picker.value = '';
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        Neko.ui.toast('Bukan foto', 'Tombol ini hanya untuk mengirim foto. Pilih berkas gambar.', 'warn', 'warning');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        Neko.ui.toast('Terlalu besar', 'Foto maksimal 20 MB. Pilih yang lebih kecil.', 'warn', 'warning');
        return;
      }
      const isGroup = state.mode === 'group';
      const target = isGroup ? state.group : state.peer;
      if (!target) {
        Neko.ui.toast('Belum ada tujuan', 'Buka percakapan dulu sebelum mengirim foto.', 'warn', 'warning');
        return;
      }
      const attachBtn = root.querySelector('[data-msg-attach]');
      if (attachBtn) attachBtn.disabled = true;
      Neko.ui.toast('Menyiapkan foto…', file.name, 'info', 'image');
      siapkanFoto(file).then(foto => {
        Neko.ui.toast('Mengunggah foto…', Math.round(foto.size / 1024) + ' KB', 'info', 'image');
        return Neko.api.media.upload(foto, persen => {
          if (attachBtn) attachBtn.title = 'Mengunggah ' + persen + '%';
        });
      }).then(data => {
        const url = data.url || '';
        return (isGroup ? Neko.api.groups.send(target, '', url) : Neko.api.chats.send(target, '', url));
      }).then(() => {
        Neko.audio.play('success');
        Neko.ui.toast('Foto terkirim', 'Foto sudah tampil di percakapan.', 'success', 'check');
        if (isGroup) loadGroup(target); else loadThread(target);
      }).catch(error => {
        Neko.ui.toast('Gagal mengirim foto', error.message || 'Coba lagi.', 'error', 'warning');
      }).finally(() => {
        if (attachBtn) { attachBtn.disabled = false; attachBtn.title = 'Kirim foto'; }
      });
    });

    root.addEventListener('input', event => {
      if (event.target.id !== 'msgSearch') return;
      state.query = event.target.value.trim();
      window.clearTimeout(searchDebounce);
      if (state.query.length && state.query.length < 3) return;
      searchDebounce = window.setTimeout(() => {
        if (!state.query) { state.search = []; paintBody(); return; }
        state.tab = 'find';
        paintTabs();
        paintBody('<div class="msg-loading">' + icon('restart') + '<span>Mencari akun…</span></div>');
        runSearch();
      }, 420);
    });

    root.addEventListener('keydown', event => {
      if (event.key === 'Escape' && (state.peer || state.group) && boundRoot && boundRoot.contains(event.target)) {
        state.peer = '';
        state.group = '';
        state.thread = null;
        paintBody();
      }
    });

    window.clearInterval(state.pollTimer);
    state.pollTimer = window.setInterval(() => {
      if (document.hidden || !state.chats) return;
      if (currentVisible() !== 'messages') return;
      loadShell(false);
    }, 5000);
  }

  function currentVisible() {
    return Neko.app ? Neko.app.currentView : null;
  }

  function optimisticPush(text) {
    const isGroup = state.mode === 'group';
    const message = isGroup
      ? { from: normalize(selfName()), displayName: (Neko.store.session || {}).displayName || selfName(), text, at: Date.now(), read: [], pending: true }
      : { id: 'tmp_' + Date.now(), from: normalize(selfName()), to: normalize(state.peer), text, at: Date.now(), read: false, pending: true };
    if (!state.thread) state.thread = { messages: [], peer: null };
    if (!state.thread.messages) state.thread.messages = [];
    state.thread.messages.push(message);
    paintBubbles();
    scrollBubbles();
  }

  function dropOptimistic(text) {
    if (!state.thread || !state.thread.messages) return;
    const index = state.thread.messages.map(item => item.text).lastIndexOf(text);
    if (index >= 0) state.thread.messages.splice(index, 1);
    paintBubbles();
  }

  /* ============================================================
     Lukis ulang sebagian
     ============================================================ */

  function bodyEl() {
    return boundRoot ? boundRoot.querySelector('#msgBody') : null;
  }

  function paintBody(replacement) {
    const body = bodyEl();
    if (!body) return;
    const view = boundRoot.querySelector('.msg-view');
    if (view) view.dataset.threadOpen = (state.peer || state.group) && (state.tab === 'chats' || state.tab === 'groups') ? '1' : '0';
    body.innerHTML = replacement || panelHTML();
    if (!replacement) scrollBubbles();
  }

  function paintTabs() {
    if (!boundRoot) return;
    boundRoot.querySelectorAll('[data-msg-tab]').forEach(tab => {
      const on = tab.dataset.msgTab === state.tab;
      tab.classList.toggle('on', on);
      tab.setAttribute('aria-selected', String(on));
      const id = tab.dataset.msgTab;
      const n = id === 'chats' ? totalUnread() : id === 'groups' ? groupUnread() : id === 'requests' ? incomingCount() : 0;
      let badge = tab.querySelector('.msg-tab-n');
      if (n) {
        if (!badge) {
          badge = document.createElement('i');
          badge.className = 'msg-tab-n';
          tab.appendChild(badge);
        }
        badge.textContent = String(n);
      } else if (badge) badge.remove();
    });
  }

  function paintBubbles() {
    const box = boundRoot ? boundRoot.querySelector('#msgBubbles') : null;
    if (!box || !state.thread || !state.thread.messages) return;
    box.innerHTML = state.thread.messages.length
      ? state.thread.messages.map(bubbleHTML).join('')
      : '<div class="msg-bubbles-empty">Belum ada pesan. Kirim yang pertama!</div>';
  }

  function scrollBubbles() {
    const box = boundRoot ? boundRoot.querySelector('#msgBubbles') : null;
    if (box) box.scrollTop = box.scrollHeight;
  }

  /* ============================================================
     Dispatcher realtime
     ============================================================ */

  function showInThisView() {
    return Boolean(boundRoot && boundRoot.isConnected);
  }

  document.addEventListener('neko:event', event => {
    const item = event.detail || {};
    const data = item.data || item.payload || {};
    if (item.type === 'message') {
      if (showInThisView()) {
        if (state.mode === 'dm' && state.peer && normalize(data.from) === normalize(state.peer) && state.thread && state.thread.messages) {
          state.thread.messages.push({ from: data.from, to: normalize(selfName()), text: data.text, at: data.at || Date.now(), read: true });
          paintBubbles();
          scrollBubbles();
          Neko.api.chats.read(state.peer).catch(() => { });
          return;
        }
        loadShell(false);
      } else if (state.chats) {
        loadShell(false);
      }
      Neko.store.addNotification('Pesan dari ' + (data.displayName || data.from), String(data.text || '').slice(0, 90), 'message');
      if (!showInThisView()) Neko.ui.toast('Pesan baru', (data.displayName || data.from) + ': ' + String(data.text || '').slice(0, 60), 'info', 'chat');
      Neko.audio.play('notify');
      return;
    }
    if (item.type === 'group-message') {
      if (showInThisView() && state.mode === 'group' && state.group === data.groupId && state.thread && state.thread.messages) {
        state.thread.messages.push({ from: data.from, displayName: data.displayName, text: data.text, at: data.at || Date.now(), read: [normalize(selfName())] });
        paintBubbles();
        scrollBubbles();
        return;
      }
      if (showInThisView()) loadShell(false);
      Neko.store.addNotification('Grup ' + (data.name || ''), (data.displayName || data.from) + ': ' + String(data.text || '').slice(0, 80), 'message');
      Neko.ui.toast('Pesan grup', (data.name || 'Grup') + ' — ' + (data.displayName || data.from) + ': ' + String(data.text || '').slice(0, 50), 'info', 'users');
      Neko.audio.play('notify');
      return;
    }
    if (item.type === 'group-invite') {
      Neko.store.addNotification('Undangan grup', (data.displayName || data.from) + ' menambahkanmu ke grup ' + (data.name || ''), 'friend');
      Neko.ui.toast('Masuk grup baru', (data.displayName || data.from) + ' menambahkanmu ke grup "' + (data.name || '') + '".', 'info', 'users');
      Neko.audio.play('notify');
      if (showInThisView()) loadShell(false);
      return;
    }
    if (item.type === 'call-signal') {
      handleCallSignal(data);
      return;
    }
    if (item.type === 'friend-request') {
      Neko.store.addNotification('Permintaan teman', (data.displayName || data.from) + ' ingin berteman denganmu.', 'friend');
      Neko.ui.toast('Permintaan teman baru', (data.displayName || data.from) + ' (@' + data.from + ') mengirim permintaan.', 'info', 'users');
      Neko.audio.play('notify');
      if (showInThisView()) loadShell(false);
      return;
    }
    if (item.type === 'friend-accepted') {
      Neko.store.addNotification('Teman baru', (data.displayName || data.from) + ' menerima permintaanmu.', 'friend');
      Neko.ui.toast('Teman baru!', (data.displayName || data.from) + ' sekarang ada di daftar teman.', 'success', 'check');
      if (showInThisView()) loadShell(false);
      return;
    }
    if (item.type === 'live-xp') {
      refreshAfterLiveXP(data);
      return;
    }
  });

  async function refreshAfterLiveXP(data) {
    const gained = Number(data.xp || data.amount || 0);
    if (gained) Neko.ui.toast('XP Kelas Langsung', '+' + gained + ' XP masuk ke akunmu.', 'success', 'xp');
    try {
      const fresh = await Neko.api.restoreSession();
      if (fresh) Neko.store.hydrate(fresh);
    } catch (error) { /* tetap pakai XP lokal */ }
    if (Neko.app && Neko.app.refresh) Neko.app.refresh();
  }

  document.addEventListener('neko:logout', () => {
    window.clearInterval(state.pollTimer);
    endCall(false);
    state.chats = null;
    state.groups = null;
    state.friends = null;
    state.search = null;
    state.thread = null;
    state.peer = '';
    state.group = '';
    state.query = '';
    state.tab = 'chats';
    boundRoot = null;
  });

  Neko.friends = {
    render,
    bind,
    get unread() { return totalUnread(); },
    refresh() { if (showInThisView()) loadShell(false); }
  };
})();
