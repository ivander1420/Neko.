
/* ============================================================
   NEKO VOICE SYSTEM
   Indonesian TTS • Character Personas • Queue Manager
   ============================================================ */

(() => {
  'use strict';

  const PERSONAS = {
    narrator: {
      gender: 'female',
      pitch: 1.02,
      rate: 0.91,
      volume: 1
    },

    // Miko: AI assistant — ramah, hangat, suara laki-laki muda
    miko: {
      gender: 'male',
      pitch: 1.0,
      rate: 1.0,
      volume: 1
    }
  };

  const MAX_QUEUE = 8;
  const DUPLICATE_DELAY = 2600;
  const MAX_CHUNK = 170;          // satu utterance tidak boleh terlalu panjang
  const CANCEL_GAP = 140;         // jeda wajib sesudah cancel() (bug Chrome/WebView)
  const STALL_MS = 1200;          // watchdog: onend tidak datang -> lepas antrian

  const activeUtterances = new Set();
  let keepAliveTimer = null;
  let watchdog = null;

  function cleanSpeechText(str) {
    if (!str) return '';
    return str
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/[*_#`~[\]()>]/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* Pecah teks panjang jadi potongan per kalimat.
     Ini penyebab utama suara 'putus': satu utterance panjang di Android
     sering dipotong di tengah, sedangkan potongan pendek selalu selesai. */
  function splitForSpeech(text) {
    const clean = cleanSpeechText(text);
    if (!clean) return [];
    if (clean.length <= MAX_CHUNK) return [clean];

    const sentences = clean.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [clean];
    const chunks = [];
    let buffer = '';

    for (const sentence of sentences) {
      const piece = sentence.trim();
      if (!piece) continue;

      if ((buffer + ' ' + piece).trim().length <= MAX_CHUNK) {
        buffer = (buffer + ' ' + piece).trim();
        continue;
      }

      if (buffer) chunks.push(buffer);
      buffer = '';

      if (piece.length > MAX_CHUNK) {
        // kalimat tunggal yang kepanjangan: potong di spasi terdekat
        let rest = piece;
        while (rest.length > MAX_CHUNK) {
          let cut = rest.lastIndexOf(' ', MAX_CHUNK);
          if (cut < 40) cut = MAX_CHUNK;
          chunks.push(rest.slice(0, cut).trim());
          rest = rest.slice(cut).trim();
        }
        buffer = rest;
      } else {
        buffer = piece;
      }
    }

    if (buffer) chunks.push(buffer);
    return chunks.filter(Boolean);
  }

  let voices = [];
  let queue = [];
  let speaking = false;
  let enabled = true;
  let voicesLoaded = false;
  /* Sinkron dengan preferensi "Suara karakter" (Profil → Atur / tombol mute chat) */
  try { enabled = JSON.parse(localStorage.getItem('neko_prefs_v2') || '{}').charVoice !== false; } catch (e) { enabled = true; }
  let lastText = '';
  let lastTime = 0;
  let currentUtterance = null;
  let cancelledAt = 0;

  const synth = window.speechSynthesis;

  if (!('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined') {
    console.warn('[NEKO Voice] Browser tidak mendukung Speech Synthesis.');
    return;
  }

  /* ============================================================
     VOICE LIST
     ============================================================ */

  function refreshVoices() {
    voices = synth.getVoices() || [];
    voicesLoaded = voices.length > 0;

    return voices;
  }

  function isIndonesia(voice) {
    const lang = String(voice?.lang || '').toLowerCase();

    return lang === 'id' || lang.startsWith('id-');
  }

  function isFemale(voice) {
    const name = String(voice?.name || '').toLowerCase();

    return /female|woman|perempuan|gadis|google indonesia female/i.test(name);
  }

  function isMale(voice) {
    const name = String(voice?.name || '').toLowerCase();

    return /male|man|laki|pria|boy/i.test(name);
  }

  function getIndonesianVoices() {
    return voices.filter(isIndonesia);
  }

  /* ============================================================
     VOICE SELECTION
     Tidak memilih voice Inggris untuk teks Indonesia.
     ============================================================ */

  function chooseVoice(persona = 'miko') {
    const spec = PERSONAS[persona] || PERSONAS.miko;
    const indonesian = getIndonesianVoices();

    if (!indonesian.length) {
      return null;
    }

    const matching = indonesian.filter(voice => {
      if (spec.gender === 'female') {
        return isFemale(voice);
      }

      if (spec.gender === 'male') {
        return isMale(voice);
      }

      return false;
    });

    const neutral = indonesian.filter(voice => {
      return !isFemale(voice) && !isMale(voice);
    });

    return matching[0] || neutral[0] || indonesian[0];
  }

  function getVoice(persona) {
    return chooseVoice(persona);
  }

  /* ============================================================
     CHARACTER TONE — dinamis mengikuti isi kalimat.
     Pertanyaan: nada naik di akhir. Kalimat semangat: lebih cepat
     dan ceria. Penjelasan panjang: santai. Jadi tidak terdengar
     monoton seperti robot.
     ============================================================ */

  function getTone(persona, text) {
    const spec = PERSONAS[persona] || PERSONAS.miko;
    let pitch = spec.pitch;
    let rate = spec.rate;

    const t = String(text || '').toLowerCase();
    if (t) {
      const isQuestion = /\?\s*$/.test(t) || /^(apa|apakah|gimana|bagaimana|kenapa|mengapa|siapa|berapa|dimana|di mana|bisakah|boleh)\b/.test(t);
      const isExcited = /(mantap|keren|hebat|semangat|yeay|wow|gas!|ayok|ayo |bagus!)/.test(t) || /!/.test(t);
      const isExplain = t.length > 120 || /(artinya|yaitu|contohnya|langkah|urutan|definisi)/.test(t);

      if (isQuestion) { pitch += .18; rate += .04; }       // nada akhir naik — terdengar hidup
      else if (isExcited) { pitch += .14; rate += .1; }    // ceria & cepat
      else if (isExplain) { pitch -= .06; rate -= .05; }   // tenang saat menjelaskan

      // Jeda alami: teks dengan koma bicara sedikit lebih pelan di awal.
      if ((t.match(/,/g) || []).length >= 2) rate -= .03;
    }

    pitch = Math.max(.6, Math.min(1.8, pitch));
    rate = Math.max(.6, Math.min(1.6, rate));
    return { pitch, rate, volume: spec.volume };
  }

  /* ============================================================
     UTTERANCE
     ============================================================ */

  function createUtterance(item) {
    const speechText = cleanSpeechText(item.text);
    const utterance = new SpeechSynthesisUtterance(speechText);
    const voice = getVoice(item.persona);
    const tone = getTone(item.persona, item.text);

    // Paksa bahasa Indonesia.
    utterance.lang = 'id-ID';

    // Pasang voice Indonesia jika tersedia.
    if (voice && isIndonesia(voice)) {
      utterance.voice = voice;
    }

    utterance.pitch = tone.pitch;
    utterance.rate = tone.rate;
    utterance.volume = tone.volume;

    // Simpan referensi objek agar tidak di-garbage-collect oleh Chrome / Android
    activeUtterances.add(utterance);

    utterance.onstart = () => {
      speaking = true;
      currentUtterance = utterance;
      clearTimeout(watchdog);

      // Keep-alive: Chrome/WebView berhenti di tengah kalimat panjang setelah ±15 detik.
      clearInterval(keepAliveTimer);
      keepAliveTimer = setInterval(() => {
        if (!synth.speaking || synth.paused) {
          clearInterval(keepAliveTimer);
          return;
        }
        try {
          synth.pause();
          synth.resume();
        } catch (error) { /* abaikan */ }
      }, 9000);
    };

    const cleanup = () => {
      // onend/onerror dari utterance lama kadang datang terlambat.
      // Tanpa penjaga ini, dua kalimat bisa bertumpuk dan suara jadi putus-putus.
      if (currentUtterance && currentUtterance !== utterance) {
        activeUtterances.delete(utterance);
        return;
      }

      speaking = false;
      currentUtterance = null;
      activeUtterances.delete(utterance);
      clearInterval(keepAliveTimer);
      clearTimeout(watchdog);
      processQueue();
    };

    utterance.onend = cleanup;
    utterance.onerror = (event) => {
      const kind = event && event.error;
      // 'interrupted' / 'canceled' itu normal setiap kali kita ganti halaman.
      if (kind !== 'interrupted' && kind !== 'canceled') {
        console.warn('[NEKO Voice] TTS error:', kind);
      }
      cleanup();
    };

    return utterance;
  }

  /* ============================================================
     QUEUE MANAGER
     ============================================================ */

  function processQueue() {
    if (!enabled || speaking || !queue.length) {
      return;
    }

    // sesudah cancel(), Chrome/WebView butuh sebentar sebelum speak() berikutnya,
    // kalau tidak: utterance baru dibuang diam-diam -> kalimat terdengar terpotong.
    const sinceCancel = Date.now() - cancelledAt;
    if (sinceCancel < CANCEL_GAP) {
      setTimeout(processQueue, CANCEL_GAP - sinceCancel + 10);
      return;
    }

    const item = queue.shift();

    if (!item || !item.text) {
      processQueue();
      return;
    }

    const utterance = createUtterance(item);

    speaking = true;
    currentUtterance = utterance;

    try {
      synth.speak(utterance);
    } catch (error) {
      console.error('[NEKO Voice] Gagal memulai suara:', error);

      speaking = false;
      currentUtterance = null;

      processQueue();
      return;
    }

    // Penunggu: kalau browser lupa mengirim onend, antrian tidak macet selamanya.
    clearTimeout(watchdog);
    watchdog = setTimeout(checkStall, STALL_MS);
  }

  function checkStall() {
    if (!speaking) return;
    if (synth.speaking || synth.pending) {
      clearTimeout(watchdog);
      watchdog = setTimeout(checkStall, STALL_MS);   // masih bicara, perpanjang penjagaan
      return;
    }
    speaking = false;
    currentUtterance = null;
    clearInterval(keepAliveTimer);
    processQueue();
  }

  /* ============================================================
     SAY
     ============================================================ */

  function say(text, persona = 'miko', options = {}) {
    if (!enabled || typeof text !== 'string') {
      return false;
    }

    const cleanText = text.trim();

    if (!cleanText) {
      return false;
    }

    const now = Date.now();

    // Hindari ucapan yang sama berulang terlalu cepat.
    if (
      cleanText === lastText &&
      now - lastTime < DUPLICATE_DELAY
    ) {
      return false;
    }

    lastText = cleanText;
    lastTime = now;

    const normalizedPersona = PERSONAS[persona]
      ? persona
      : 'miko';

    const chunks = splitForSpeech(cleanText);

    if (!chunks.length) {
      return false;
    }

    const items = chunks.map((chunk) => ({
      text: chunk,
      persona: normalizedPersona,
      priority: options.priority || false
    }));

    if (options.priority) {
      queue.unshift(...items);
    } else {
      for (const item of items) {
        if (queue.length >= MAX_QUEUE) {
          queue.shift();
        }
        queue.push(item);
      }
    }

    processQueue();

    return true;
  }

  /* ============================================================
     CANCEL
     ============================================================ */

  function cancel() {
    queue = [];
    speaking = false;
    currentUtterance = null;
    activeUtterances.clear();
    clearInterval(keepAliveTimer);
    clearTimeout(watchdog);
    cancelledAt = Date.now();

    try {
      synth.cancel();
    } catch (error) {
      console.warn('[NEKO Voice] Cancel gagal:', error);
    }
  }

  /* Ganti kalimat tanpa jeda kosong: bersihkan antrian, lalu ucapkan baru.
     Dipakai halaman yang bubble-nya sering berganti (maskot, intro). */
  function speak(text, persona = 'miko', options = {}) {
    cancel();
    return say(text, persona, options);
  }

  /* ============================================================
     ENABLE / DISABLE
     ============================================================ */

  function setEnabled(value) {
    enabled = Boolean(value);
    try {
      const prefs = JSON.parse(localStorage.getItem('neko_prefs_v2') || '{}');
      prefs.charVoice = enabled;
      localStorage.setItem('neko_prefs_v2', JSON.stringify(prefs));
    } catch (e) { /* penyimpanan opsional */ }

    if (!enabled) {
      cancel();
    }

    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  /* ============================================================
     CHARACTER INFORMATION
     ============================================================ */

  function getCharacters() {
    return {
      narrator: {
        name: 'Narrator',
        description: 'Tenang, jelas, dan nyaman didengar.'
      },

      miko: {
        name: 'Miko',
        description: 'Teman belajar — tahu semua materi TJKT, ramah, dan hangat.'
      }
    };
  }

  function getVoiceInfo() {
    const indonesian = getIndonesianVoices();

    return {
      supported: true,
      enabled,
      speaking,
      queueLength: queue.length,
      voicesLoaded,
      totalVoices: voices.length,
      indonesiaAvailable: indonesian.length > 0,

      indonesiaVoices: indonesian.map(voice => ({
        name: voice.name,
        lang: voice.lang,
        default: voice.default
      }))
    };
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */

  window.Neko = window.Neko || {};

  window.Neko.voice = {
    say,
    speak,
    cancel,
    enabled: isEnabled,
    setEnabled,
    refresh: refreshVoices,
    getCharacters,
    getVoiceInfo,

    get isSpeaking() {
      return speaking;
    },

    get queueLength() {
      return queue.length;
    },

    get indonesiaAvailable() {
      return getIndonesianVoices().length > 0;
    },

    get voicesLoaded() {
      return voicesLoaded;
    }
  };

  /* ============================================================
     INITIALIZATION
     ============================================================ */

  refreshVoices();

  if (typeof synth.addEventListener === 'function') {
    synth.addEventListener('voiceschanged', refreshVoices);
  } else {
    synth.onvoiceschanged = refreshVoices;
  }

  // Beberapa browser baru memuat daftar voice setelah halaman aktif.
  window.addEventListener('load', refreshVoices);

  console.info('[NEKO Voice] Voice system initialized.');
})();
