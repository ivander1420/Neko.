/* ============================================================
   NEKO · js/nobar.js
   Logika untuk fitur Watch Party (Nobar) YouTube.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { esc } = Neko.util;

  let nobarContainer = null;
  let player = null;
  let isVisible = false;
  let youtubeApiReady = false;
  let roomState = null;
  let isHost = false;
  let lastPlayerState = -1;

  function init() {
    if (window.YT && window.YT.Player) {
      youtubeApiReady = true;
      return;
    }

    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    const timeout = setTimeout(() => {
      if (!youtubeApiReady) {
        console.error('NEKO Nobar: Gagal memuat YouTube IFrame API.');
        // Di sini kita bisa menampilkan pesan error ke pengguna jika diperlukan
      }
    }, 10000); // Timeout 10 detik

    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      youtubeApiReady = true;
    };
  }

  function createUI() {
    if (nobarContainer) return;
    nobarContainer = document.createElement('div');
    nobarContainer.id = 'nobar-layer';
    nobarContainer.innerHTML = `
      <div class="nobar-layout">
        <main class="nobar-main">
          <div id="nobar-player-container" class="nobar-player-container"></div>
          <div id="nobar-controls"></div>
        </main>
        <aside class="nobar-sidebar">
          <div class="nobar-sidebar-tabs">
            <button class="active" data-tab="chat">Chat</button>
            <button data-tab="participants">Participants</button>
          </div>
          <div class="nobar-sidebar-content">
            <div class="nobar-panel active" data-panel="chat">
              <div id="nobar-chat-messages"></div>
              <form id="nobar-chat-form"><input type="text" placeholder="Ketik pesan..." required maxlength="200"></form>
            </div>
            <div class="nobar-panel" data-panel="participants" hidden></div>
          </div>
        </aside>
      </div>
    `;
    document.body.appendChild(nobarContainer);
    bindUIEvents();
  }

  function bindUIEvents() {
    nobarContainer.querySelector('.nobar-sidebar-tabs').addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        const tab = e.target.dataset.tab;
        nobarContainer.querySelector('.nobar-sidebar-tabs button.active').classList.remove('active');
        e.target.classList.add('active');
        nobarContainer.querySelectorAll('.nobar-panel').forEach(p => p.hidden = true);
        nobarContainer.querySelector(`.nobar-panel[data-panel="${tab}"]`).hidden = false;
      }
    });

    nobarContainer.querySelector('#nobar-chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = e.target.querySelector('input');
      const text = input.value.trim();
      if (text && roomState) {
        Neko.api.nobar.send(roomState.id, { type: 'chat', text });
        input.value = '';
      }
    });
  }

  function renderControls() {
    const controls = nobarContainer.querySelector('#nobar-controls');
    if (!roomState) {
      controls.innerHTML = `
        <input type="text" id="nobar-video-id" placeholder="YouTube Video ID or URL">
        <button id="nobar-create-btn">Create Room</button>
        <input type="text" id="nobar-room-id" placeholder="Room Code">
        <button id="nobar-join-btn">Join Room</button>
      `;
      document.getElementById('nobar-create-btn').addEventListener('click', createRoom);
      document.getElementById('nobar-join-btn').addEventListener('click', joinRoom);
    } else {
      controls.innerHTML = `<p>Room Code: <strong>${roomState.id}</strong> <button id="nobar-leave-btn">Leave</button></p>`;
      document.getElementById('nobar-leave-btn').addEventListener('click', closeNobar);
    }
  }

  async function createRoom() {
    const videoId = document.getElementById('nobar-video-id').value.trim();
    if (!videoId) { alert('Please enter a YouTube video ID.'); return; }
    const result = await Neko.api.nobar.create(videoId);
    if (result.ok) {
      isHost = true;
      await connectToRoom(result.state.id);
    } else {
      alert('Error creating room: ' + result.error);
    }
  }

  async function joinRoom() {
    const roomId = document.getElementById('nobar-room-id').value.trim();
    if (!roomId) { alert('Please enter a room code.'); return; }
    const result = await Neko.api.nobar.join(roomId);
    if (result.ok) {
      isHost = false;
      await connectToRoom(result.state.id);
    } else {
      alert('Error joining room: ' + result.error);
    }
  }

  async function connectToRoom(id) {
    const state = await Neko.api.nobar.state(id);
    if (!state.ok) return;
    roomState = state.state;
    Neko.api.nobar.subscribe(id, handleServerMessage);
    renderAll();
    if (!player) {
      loadVideo(roomState.video);
    }
  }

  function openNobar() {
    if (isVisible) return;
    createUI();
    Neko.audio.enterWatchParty();
    nobarContainer.style.display = 'block';
    isVisible = true;
    renderControls();
  }

  function closeNobar() {
    if (!isVisible) return;
    if (roomState) {
      Neko.api.nobar.unsubscribe(roomState.id);
      Neko.api.nobar.leave(roomState.id);
    }
    Neko.audio.exitWatchParty();
    if (player) {
      player.destroy();
      player = null;
    }
    document.getElementById('nobar-player-container').innerHTML = ''; // Clear player div
    roomState = null;
    isHost = false;
    nobarContainer.style.display = 'none';
    isVisible = false;
  }

  function loadVideo(videoId) {
    if (!youtubeApiReady) return;
    if (player) {
      player.loadVideoById(videoId);
    } else {
      player = new YT.Player('nobar-player-container', {
        height: '100%', width: '100%', videoId: videoId,
        playerVars: { 'playsinline': 1, 'autoplay': 1, 'controls': isHost ? 1 : 0, 'rel': 0 },
        events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange }
      });
    }
  }

  function onPlayerReady(event) {
    if (isHost) event.target.playVideo();
  }

  function onPlayerStateChange(event) {
    if (!isHost || !roomState) return;
    const state = event.data;
    if (state === lastPlayerState) return;
    lastPlayerState = state;
    if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.PAUSED) {
      Neko.api.nobar.send(roomState.id, {
        type: 'sync',
        playing: state === YT.PlayerState.PLAYING,
        position: player.getCurrentTime()
      });
    }
  }

  function handleServerMessage(data) {
    if (data.type === 'nobar-state') {
      roomState = data.state;
      renderAll();
      syncPlayer(data.state);
    } else if (data.type === 'nobar-chat') {
      renderChatMessage(data);
    }
  }

  function syncPlayer(state) {
    if (isHost || !player) return;
    if (player.getVideoData().video_id !== state.video) {
      player.loadVideoById(state.video);
    }
    const timeDiff = Math.abs(player.getCurrentTime() - state.position);
    if (timeDiff > 1.5) {
      player.seekTo(state.position, true);
    }
    const playerState = player.getPlayerState();
    if (state.playing && playerState !== YT.PlayerState.PLAYING) player.playVideo();
    else if (!state.playing && playerState !== YT.PlayerState.PAUSED) player.pauseVideo();
  }

  function renderAll() {
    renderControls();
    renderParticipants();
  }

  function renderParticipants() {
    const panel = nobarContainer.querySelector('[data-panel="participants"]');
    panel.innerHTML = (roomState.viewers || []).map(u => `<p>${esc(u.name)} ${u.isHost ? '<b>(Host)</b>' : ''}</p>`).join('');
  }

  function renderChatMessage(msg) {
    const panel = nobarContainer.querySelector('#nobar-chat-messages');
    const el = document.createElement('div');
    el.innerHTML = `<b>${esc(msg.name)}:</b> ${esc(msg.text)}`;
    panel.appendChild(el);
    panel.scrollTop = panel.scrollHeight;
  }

  Neko.nobar = { init, open: openNobar, close: closeNobar };
})();