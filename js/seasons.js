/* ============================================================
   NEKO · js/seasons.js
   Lima season XP. Setiap season penuh memberi gelar, badge,
   dan bingkai profil baru.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};

  const seasons = [
    {
      id: 1,
      name: 'Season 1 · Langkah Pertama',
      short: 'Pemula',
      title: 'Teknisi Baru',
      min: 0,
      max: 600,
      icon: 'sparkle',
      color: Neko.util.tone(0),
      reward: { badge: 'Pemula', frame: 'frame-basic', desc: 'Bingkai profil Pemula' },
      blurb: 'Kenali perangkat, kabel, dan dasar jaringan.'
    },
    {
      id: 2,
      name: 'Season 2 · Penjelajah',
      short: 'Penjelajah',
      title: 'Teknisi Junior',
      min: 600,
      max: 1600,
      icon: 'layers',
      color: Neko.util.tone(3),
      reward: { badge: 'Penjelajah', frame: 'frame-leaf', desc: 'Bingkai profil Penjelajah' },
      blurb: 'Mulai membaca buku, mencoba lab, dan menaklukkan arena.'
    },
    {
      id: 3,
      name: 'Season 3 · Arsitek',
      short: 'Arsitek',
      title: 'Teknisi Madya',
      min: 1600,
      max: 3000,
      icon: 'puzzle',
      color: Neko.util.tone(1),
      reward: { badge: 'Arsitek', frame: 'frame-violet', desc: 'Bingkai profil Arsitek' },
      blurb: 'Rancang subnet, VLAN, dan alur jaringan yang rapi.'
    },
    {
      id: 4,
      name: 'Season 4 · Penjaga',
      short: 'Penjaga',
      title: 'Spesialis Jaringan',
      min: 3000,
      max: 5000,
      icon: 'shield',
      color: Neko.util.tone(2),
      reward: { badge: 'Penjaga', frame: 'frame-gold', desc: 'Bingkai profil Emas' },
      blurb: 'Amankan jaringan dan pecahkan kasus yang rumit.'
    },
    {
      id: 5,
      name: 'Season 5 · Legenda',
      short: 'Legenda',
      title: 'Network Legend',
      min: 5000,
      max: Infinity,
      icon: 'trophy',
      color: Neko.util.tone(4),
      reward: { badge: 'Legenda', frame: 'frame-legend', desc: 'Bingkai legenda + mahkota profil' },
      blurb: 'Tempat para master NEKO. Teruskan warisan ilmu jaringan.'
    }
  ];

  function seasonForXP(xp) {
    const value = Math.max(0, Number(xp) || 0);
    let season = seasons[0];
    for (const item of seasons) if (value >= item.min) season = item;
    const span = season.max === Infinity ? 1 : season.max - season.min;
    const progress = season.max === Infinity ? 100 : Math.max(0, Math.min(100, ((value - season.min) / span) * 100));
    return {
      season,
      progress,
      next: seasons[season.id] || null,
      xpToNext: season.max === Infinity ? 0 : Math.max(0, season.max - value)
    };
  }

  function titleForXP(xp) {
    return seasonForXP(xp).season.title;
  }

  function preview(seasonId) {
    return seasons.find(item => item.id === seasonId) || seasons[0];
  }

  Neko.seasons = { list: seasons, seasonForXP, titleForXP, preview };
})();
