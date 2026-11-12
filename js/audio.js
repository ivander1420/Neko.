/* ============================================================
   NEKO · js/audio.js
   Musik dan efek suara prosedural (Web Audio). Setiap tema
   memiliki skala, tempo, dan warna suara sendiri.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};

  const STORAGE_KEY = 'neko_audio_v2';
  const audio = {
    ctx: null,
    master: null,
    musicBus: null,
    musicFilter: null,
    sfxBus: null,
    timer: null,
    step: 0,
    theme: document.documentElement.dataset.theme || 'paper',
    sound: true,
    music: true,
    volume: 78,
    started: false,
    lastTap: 0,
    watchParty: false,
    musicWasOn: false,
    sfxWasOn: true
  };

  function loadPrefs() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        audio.sound = saved.sound !== false;
        audio.music = saved.music !== false;
        audio.volume = Math.max(0, Math.min(100, Number(saved.volume) || 78));
      }
    } catch (error) { /* abaikan preferensi rusak */ }
  }

  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sound: audio.sound, music: audio.music, volume: audio.volume }));
    } catch (error) { /* penyimpanan opsional */ }
  }

  const profiles = {
    default: {
      tempo: 96, wave: 'triangle', scale: [57, 60, 62, 64, 67, 69, 72, 76], pattern: [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 4, 6, 5, 4, 2, 1],
      chords: [[0, 2, 4], [1, 3, 5], [0, 2, 4], [3, 5, 7]], bass: [0, 0, 3, 3], level: .055, pad: .028, filter: 3400, drum: true,
      sfx: { base: 660, wave: 'sine', intervals: [0, 4, 7, 12], press: { notes: [0], duration: .055, level: .026, gap: 0, wave: 'sine', glide: 7, noise: 0 } }
    },
    forest: {
      tempo: 72, wave: 'sine', scale: [50, 52, 55, 57, 59, 62, 64, 67], pattern: [0, 2, 4, 3, 2, 4, 5, 4, 2, 0, 2, 6, 5, 4, 2, 1],
      chords: [[0, 2, 4], [1, 3, 5], [2, 4, 6], [1, 3, 5]], bass: [0, 4, 2, 5], level: .05, pad: .032, filter: 2200, drum: false,
      sfx: { base: 540, wave: 'sine', intervals: [0, 5, 7, 12], press: { notes: [0], duration: .07, level: .03, gap: 0, wave: 'triangle', glide: -2, noise: .008 } }
    },
    ocean: {
      tempo: 66, wave: 'sine', scale: [55, 57, 60, 62, 64, 67, 69, 72], pattern: [0, 2, 3, 5, 4, 2, 3, 1, 0, 4, 5, 6, 5, 3, 2, 1],
      chords: [[0, 2, 4], [2, 4, 6], [1, 3, 5], [0, 2, 4]], bass: [0, 2, 1, 3], level: .045, pad: .036, filter: 1800, drum: false,
      sfx: { base: 480, wave: 'sine', intervals: [0, 3, 7, 12], press: { notes: [0], duration: .11, level: .032, gap: 0, wave: 'sine', glide: 12, noise: .014 } }
    },
    candy: {
      tempo: 122, wave: 'triangle', scale: [60, 62, 64, 65, 67, 69, 72, 74], pattern: [0, 2, 4, 2, 4, 6, 5, 4, 2, 0, 2, 4, 7, 6, 4, 2],
      chords: [[0, 2, 4], [1, 3, 5], [0, 2, 4], [2, 4, 6]], bass: [0, 1, 0, 3], level: .06, pad: .03, filter: 4200, drum: true,
      sfx: { base: 880, wave: 'triangle', intervals: [0, 4, 7, 12], press: { notes: [0, 12], duration: .07, level: .028, gap: .045, wave: 'triangle', glide: 14, noise: 0 } }
    },
    red: {
      tempo: 134, wave: 'sawtooth', scale: [45, 48, 50, 52, 55, 57, 60, 62], pattern: [0, 0, 3, 2, 0, 5, 3, 2, 0, 0, 4, 2, 6, 5, 3, 1],
      chords: [[0, 2, 4], [0, 3, 5], [0, 2, 4], [0, 4, 6]], bass: [0, 0, 1, 1], level: .045, pad: .022, filter: 2600, drum: true,
      sfx: { base: 380, wave: 'sawtooth', intervals: [0, 2, 5, 7], press: { notes: [0], duration: .045, level: .022, gap: 0, wave: 'square', glide: -5, noise: 0 } }
    },
    car: {
      tempo: 146, wave: 'square', scale: [45, 48, 50, 51, 52, 55, 57, 60], pattern: [0, 2, 3, 2, 5, 4, 2, 0, 0, 2, 5, 3, 6, 5, 3, 1],
      chords: [[0, 2, 4], [0, 3, 5], [0, 2, 4], [0, 3, 6]], bass: [0, 0, 2, 2], level: .045, pad: .02, filter: 3000, drum: true,
      sfx: { base: 420, wave: 'square', intervals: [0, 3, 7, 10], press: { notes: [0], duration: .04, level: .022, gap: 0, wave: 'square', glide: 5, noise: .01 } }
    },
    astronaut: {
      tempo: 60, wave: 'sine', scale: [48, 50, 52, 54, 56, 58, 60, 62], pattern: [0, 2, 4, 1, 3, 5, 2, 4, 6, 5, 3, 1, 2, 0, 4, 3],
      chords: [[0, 2, 4], [1, 3, 5], [2, 4, 6], [1, 3, 5]], bass: [0, 2, 1, 3], level: .04, pad: .038, filter: 1600, drum: false,
      sfx: { base: 520, wave: 'sine', intervals: [0, 2, 7, 12], press: { notes: [0, 7], duration: .2, level: .026, gap: .05, wave: 'sine', glide: 12, noise: 0 } }
    },
    paper: {
      tempo: 104, wave: 'triangle', scale: [53, 55, 57, 60, 62, 65, 67, 69], pattern: [0, 2, 4, 5, 4, 2, 3, 1, 0, 2, 4, 6, 5, 3, 2, 1],
      chords: [[0, 2, 4], [2, 4, 6], [1, 3, 5], [0, 3, 5]], bass: [0, 2, 1, 3], level: .05, pad: .03, filter: 2400, drum: true,
      sfx: { base: 500, wave: 'triangle', intervals: [0, 5, 7, 12], press: { notes: [0, 5], duration: .06, level: .026, gap: .035, wave: 'triangle', glide: 9, noise: .012 } }
    }
  };

  function freq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function ensureContext() {
    if (audio.ctx) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume().catch(() => {});
      return audio.ctx;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audio.ctx = new AudioContextClass();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = audio.volume / 100;
    audio.master.connect(audio.ctx.destination);

    audio.musicBus = audio.ctx.createGain();
    audio.musicBus.gain.value = audio.music ? 1 : 0;
    const filter = audio.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = profiles[audio.theme]?.filter || 3000;
    filter.Q.value = .6;
    audio.musicFilter = filter;
    audio.musicBus.connect(filter);
    filter.connect(audio.master);

    audio.sfxBus = audio.ctx.createGain();
    audio.sfxBus.gain.value = 1;
    audio.sfxBus.connect(audio.master);
    return audio.ctx;
  }

  function tone(destination, midi, duration, level, wave, when = 0, glideTo = null) {
    const ctx = audio.ctx;
    if (!ctx || !destination) return;
    const start = ctx.currentTime + when;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = wave || 'sine';
    oscillator.frequency.setValueAtTime(freq(midi), start);
    if (glideTo) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, freq(glideTo)), start + duration);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(.0002, level), start + .015);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .03);
    return oscillator;
  }

  function noise(destination, duration, level, when = 0) {
    const ctx = audio.ctx;
    if (!ctx) return;
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = level;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(destination);
    source.start(ctx.currentTime + when);
  }

  function musicTick() {
    if (!audio.music || !audio.ctx || audio.ctx.state !== 'running' || document.hidden) return;
    const profile = profiles[audio.theme] || profiles.default;
    const scale = profile.scale;
    const step = audio.step % profile.pattern.length;
    const noteIndex = profile.pattern[step];
    const midi = scale[Math.min(scale.length - 1, noteIndex)];
    tone(audio.musicBus, midi, audio.theme === 'astronaut' ? 1.3 : .5, profile.level, profile.wave);

    if (step % 4 === 0) {
      const chord = profile.chords[Math.floor(step / 4) % profile.chords.length];
      chord.forEach((index, order) => {
        const pad = scale[Math.min(scale.length - 1, index + (order === 2 ? 0 : 0))];
        tone(audio.musicBus, pad + 12, audio.theme === 'astronaut' ? 3.2 : 1.8, profile.pad, 'sine', .02 + order * .04);
      });
      const bass = scale[profile.bass[Math.floor(step / 4) % profile.bass.length]] - 12;
      tone(audio.musicBus, bass, 1.1, profile.pad * .9, profile.wave === 'square' ? 'triangle' : 'sine');
    }
    if (profile.drum) {
      if (step % 4 === 0) tone(audio.musicBus, 38, .18, .018, 'sine', 0, 27);
      if (step % 2 === 1) noise(audio.musicBus, .03, .0045);
      if (step % 8 === 6) noise(audio.musicBus, .12, .009);
    }
    if (audio.theme === 'car' && step % 8 === 0) noise(audio.musicBus, .18, .012);
    if (audio.theme === 'forest' && step % 8 === 6) {
      tone(audio.musicBus, scale[5] + 24, .1, .012, 'sine');
      tone(audio.musicBus, scale[6] + 24, .08, .009, 'sine', .12);
    }
    if (audio.theme === 'paper' && step % 8 === 3) noise(audio.musicBus, .09, .006);
    audio.step += 1;
  }

  function startMusic() {
    if (!audio.music) return;
    const ctx = ensureContext();
    if (!ctx) return;
    if (audio.timer) return;
    audio.started = true;
    ctx.resume().catch(() => {});
    const profile = profiles[audio.theme] || profiles.default;
    const interval = Math.max(220, Math.round(60000 / profile.tempo / 2));
    audio.step = 0;
    audio.timer = setInterval(musicTick, interval);
    musicTick();
  }

  function stopMusic() {
    if (audio.timer) {
      clearInterval(audio.timer);
      audio.timer = null;
    }
  }

  function applyVolumes() {
    if (!audio.ctx) return;
    audio.master.gain.setTargetAtTime(audio.volume / 100, audio.ctx.currentTime, .1);
    audio.musicBus.gain.setTargetAtTime(audio.music ? 1 : 0, audio.ctx.currentTime, .12);
  }

  function setSound(enabled) {
    audio.sound = Boolean(enabled);
    savePrefs();
    if (audio.sound) play('toggle');
    if (Neko.ui && Neko.ui.refreshAudioButtons) Neko.ui.refreshAudioButtons();
  }

  function setMusic(enabled) {
    audio.music = Boolean(enabled);
    savePrefs();
    if (audio.music) startMusic(); else stopMusic();
    applyVolumes();
    if (Neko.ui && Neko.ui.refreshAudioButtons) Neko.ui.refreshAudioButtons();
  }

  function setVolume(value) {
    audio.volume = Math.max(0, Math.min(100, Number(value) || 0));
    savePrefs();
    applyVolumes();
  }

  function setTheme(theme) {
    audio.theme = profiles[theme] ? theme : 'default';
    if (audio.ctx && audio.musicFilter) {
      const next = profiles[audio.theme].filter;
      audio.musicFilter.frequency.setTargetAtTime(next, audio.ctx.currentTime, .25);
    }
    if (audio.timer) {
      stopMusic();
      startMusic();
    }
  }

  const sfxKinds = {
    tap: { notes: [0], duration: .07, level: .028, gap: 0 },
    toggle: { notes: [0, 7], duration: .08, level: .03, gap: .05 },
    select: { notes: [0, 4], duration: .1, level: .03, gap: .06 },
    success: { notes: [0, 4, 7, 12], duration: .12, level: .04, gap: .07 },
    xp: { notes: [0, 7, 12, 19], duration: .13, level: .035, gap: .06 },
    error: { notes: [3, 0], duration: .16, level: .035, gap: .08 },
    login: { notes: [0, 4, 7, 12, 16], duration: .16, level: .04, gap: .09 },
    flip: { notes: [12, 7], duration: .1, level: .025, gap: .05 },
    count: { notes: [0], duration: .1, level: .04, gap: 0 },
    go: { notes: [7, 12], duration: .14, level: .05, gap: .06 },
    win: { notes: [0, 4, 7, 12, 16, 19], duration: .18, level: .045, gap: .08 },
    lose: { notes: [5, 3, 0], duration: .2, level: .035, gap: .11 },
    reveal: { notes: [0, 5, 9], duration: .12, level: .03, gap: .06 },
    whoosh: { notes: [2, 9], duration: .12, level: .02, gap: .03 },
    alert: { notes: [12, 12], duration: .12, level: .04, gap: .14 },
    tick: { notes: [19], duration: .04, level: .018, gap: 0 },
    timer: { notes: [12, 19], duration: .05, level: .024, gap: .05 },
    fail: { notes: [5, 2, 0], duration: .24, level: .036, gap: .12 },
    notify: { notes: [12, 16, 19], duration: .12, level: .032, gap: .07 },
    levelup: { notes: [0, 4, 7, 12, 16, 19, 24], duration: .18, level: .042, gap: .075 },
    press: { notes: [0], duration: .06, level: .026, gap: 0 }
  };

  function play(kind = 'tap') {
    if (audio.watchParty || !audio.sound) return;
    const ctx = ensureContext();
    if (!ctx) return;
    const now = performance.now();
    if (kind === 'tap' && now - audio.lastTap < 45) return;
    if (kind === 'tap') audio.lastTap = now;
    const profile = profiles[audio.theme] || profiles.default;
    const sfx = profile.sfx;
    const spec = sfxKinds[kind] || sfxKinds.tap;
    const press = kind === 'tap' && sfx.press;
    const notes = press ? sfx.press.notes : spec.notes;
    const duration = press ? sfx.press.duration : spec.duration;
    const level = press ? sfx.press.level : spec.level;
    const gap = press ? sfx.press.gap : spec.gap;
    const wave = press ? sfx.press.wave : sfx.wave;
    notes.forEach((semitone, index) => {
      const midi = 60 + Math.round(12 * Math.log2(sfx.base / 440)) + semitone;
      const timed = index * gap;
      const oscillator = tone(audio.sfxBus, midi, duration, level, wave, timed, press ? midi + sfx.press.glide : null);
      if (kind === 'error' && index === 0 && oscillator) {
        oscillator.frequency.exponentialRampToValueAtTime(freq(midi - 7), audio.ctx.currentTime + duration);
      }
    });
    if (press && sfx.press.noise) noise(audio.sfxBus, .1, sfx.press.noise);
    if (kind === 'flip') noise(audio.sfxBus, .12, .012);
    if (kind === 'whoosh') noise(audio.sfxBus, .18, .01);
    if (kind === 'notify' || kind === 'levelup') noise(audio.sfxBus, .06, .008);
  }

  function init() {
    loadPrefs();
    const start = () => {
      ensureContext();
      if (audio.music) startMusic();
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
    window.addEventListener('pointerdown', start, { passive: true });
    window.addEventListener('keydown', start);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopMusic();
      else if (audio.music) startMusic();
    });
  }

  function enterWatchParty() {
    ensureContext();
    audio.musicWasOn = audio.music;
    if (audio.timer) stopMusic();
    /* semua bunyi aplikasi (SFX + musik) dipadamkan total saat nobar
       supaya yang terdengar hanya audio video YouTube & mic */
    audio.sfxWasOn = audio.sound;
    audio.sound = false;
    audio.music = false;
    audio.watchParty = true;
    if (audio.master && audio.ctx) audio.master.gain.value = 0;
    try { localStorage.setItem('neko_watchparty_muted', '1'); } catch (error) { }
    if (Neko.ui && Neko.ui.refreshAudioButtons) Neko.ui.refreshAudioButtons();
  }

  function exitWatchParty() {
    audio.watchParty = false;
    audio.sound = audio.sfxWasOn !== false;
    audio.music = Boolean(audio.musicWasOn);
    if (audio.master && audio.ctx) audio.master.gain.value = audio.volume / 100;
    try { localStorage.removeItem('neko_watchparty_muted'); } catch (error) { }
    if (audio.musicWasOn) startMusic();
    if (Neko.ui && Neko.ui.refreshAudioButtons) Neko.ui.refreshAudioButtons();
  }

  Neko.audio = {
    init, play, startMusic, stopMusic, setTheme, setSound, setMusic, setVolume, enterWatchParty, exitWatchParty,
    get soundOn() { return audio.sound; },
    get musicOn() { return audio.music; },
    get volume() { return audio.volume; },
    get context() { return audio.ctx; }
  };
})();