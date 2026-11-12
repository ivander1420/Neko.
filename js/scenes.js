/* ============================================================
   NEKO · js/scenes.js
   Dunia latar animasi untuk tujuh tema. Semua dekorasi berupa
   SVG/CSS, tanpa emoji, dan dibangun ulang saat tema berganti.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const icon = Neko.icons.icon;
  const scene = document.getElementById('scene');
  let currentTheme = '';
  let currentMode = '';

  function mulberry(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  const rng = mulberry(20261103);
  const between = (min, max) => min + rng() * (max - min);
  const round = (value, digits = 1) => Number(value.toFixed(digits));

  function stars(count, prefix, top = 100) {
    let out = '';
    for (let i = 0; i < count; i += 1) {
      out += '<i class="' + prefix + '" style="left:' + round(between(1, 99)) + '%;top:' + round(between(1, top)) + '%;--w:' + round(between(1.2, 2.8)) + 'px;--dur:' + round(between(2.6, 6.5)) + 's;--delay:' + round(between(0, 6)) + 's"></i>';
    }
    return out;
  }

  /* ------------------------------------------------------------
     Pembentuk bentuk kartun: gunung, awan, dan pohon cemara.
     Semuanya SVG inline supaya warnanya ikut tema (lewat CSS
     variable) dan tetap tajam di semua ukuran layar.
     ------------------------------------------------------------ */

  let shapeSeq = 0;
  const uid = prefix => prefix + '-' + (++shapeSeq);

  /** Titik punggungan → kurva mulus (Catmull-Rom dijadikan Bezier). */
  function smoothRidge(points) {
    if (points.length < 2) return '';
    const pull = .34;
    let d = 'M' + round(points[0][0]) + ' ' + round(points[0][1]);
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      d += 'C' + round(p1[0] + (p2[0] - p0[0]) * pull) + ' ' + round(p1[1] + (p2[1] - p0[1]) * pull) +
        ' ' + round(p2[0] - (p3[0] - p1[0]) * pull) + ' ' + round(p2[1] - (p3[1] - p1[1]) * pull) +
        ' ' + round(p2[0]) + ' ' + round(p2[1]);
    }
    return d;
  }

  /** Topi salju: memuncak di puncak, tepi bawahnya bergelombang seperti salju menetes. */
  function snowCap(cx, topY, size) {
    const foot = topY + size * .95;
    return 'M' + round(cx - size) + ' ' + round(foot) +
      'C' + round(cx - size * .82) + ' ' + round(topY + size * .18) + ' ' + round(cx - size * .46) + ' ' + round(topY - size * .16) + ' ' + round(cx) + ' ' + round(topY - size * .08) +
      'C' + round(cx + size * .5) + ' ' + round(topY - size * .14) + ' ' + round(cx + size * .84) + ' ' + round(topY + size * .24) + ' ' + round(cx + size) + ' ' + round(foot + size * .06) +
      'C' + round(cx + size * .72) + ' ' + round(foot - size * .12) + ' ' + round(cx + size * .58) + ' ' + round(foot + size * .22) + ' ' + round(cx + size * .32) + ' ' + round(foot + size * .02) +
      'C' + round(cx + size * .1) + ' ' + round(foot - size * .14) + ' ' + round(cx - size * .1) + ' ' + round(foot + size * .24) + ' ' + round(cx - size * .34) + ' ' + round(foot + size * .04) +
      'C' + round(cx - size * .56) + ' ' + round(foot - size * .12) + ' ' + round(cx - size * .74) + ' ' + round(foot + size * .2) + ' ' + round(cx - size) + ' ' + round(foot) + 'Z';
  }

  /** Deretan gunung: punggungan melengkung, sisi kanan berbayang, puncak bersalju, kaki berkabut. */
  function mountainSvg(cfg) {
    const clip = uid('mtc');
    const haze = uid('mth');
    const base = cfg.base || 560;
    const ridge = smoothRidge(cfg.points);
    const body = ridge + ' L1260 ' + base + ' L-60 ' + base + ' Z';
    const peaks = [];
    for (let i = 1; i < cfg.points.length - 1; i += 1) {
      const p = cfg.points[i];
      if (p[1] < cfg.points[i - 1][1] && p[1] <= cfg.points[i + 1][1] && p[1] <= cfg.snowline) peaks.push(p);
    }
    let detail = '';
    peaks.forEach((p, index) => {
      const size = Math.max(44, cfg.snow - index * 13);
      detail += '<path class="mt-shade" d="M' + round(p[0]) + ' ' + round(p[1]) +
        'C' + round(p[0] + 42) + ' ' + round(p[1] + 150) + ' ' + round(p[0] + 100) + ' ' + round(p[1] + 300) + ' ' + round(p[0] + 170) + ' ' + base +
        ' L' + round(p[0] + 380) + ' ' + base +
        'C' + round(p[0] + 246) + ' ' + round(p[1] + 250) + ' ' + round(p[0] + 112) + ' ' + round(p[1] + 100) + ' ' + round(p[0] + 14) + ' ' + round(p[1] - 4) + 'Z"/>' +
        '<path class="mt-snow" d="' + snowCap(p[0], p[1], size) + '"/>' +
        '<path class="mt-line" d="M' + round(p[0] - size * .3) + ' ' + round(p[1] + size * .8) +
        'C' + round(p[0] - size * .52) + ' ' + round(p[1] + 150) + ' ' + round(p[0] - size * .82) + ' ' + round(p[1] + 300) + ' ' + round(p[0] - size * .96) + ' ' + base + '"/>' +
        '<path class="mt-line" d="M' + round(p[0] + size * .34) + ' ' + round(p[1] + size * .92) +
        'C' + round(p[0] + size * .6) + ' ' + round(p[1] + 170) + ' ' + round(p[0] + size * .92) + ' ' + round(p[1] + 320) + ' ' + round(p[0] + size * 1.08) + ' ' + base + '"/>';
    });
    return '<svg class="' + cfg.cls + '" viewBox="0 0 1200 560" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><clipPath id="' + clip + '"><path d="' + body + '"/></clipPath>' +
      '<linearGradient id="' + haze + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" style="stop-color:var(--mtn-haze);stop-opacity:0"/>' +
      '<stop offset="1" style="stop-color:var(--mtn-haze);stop-opacity:.92"/>' +
      '</linearGradient></defs>' +
      '<g clip-path="url(#' + clip + ')">' +
      '<path class="mt-body" d="' + body + '"/>' + detail +
      '<rect x="-60" y="' + (base - 190) + '" width="1320" height="210" fill="url(#' + haze + ')"/>' +
      '</g>' +
      '<path class="mt-edge" d="' + ridge + '"/>' +
      '</svg>';
  }

  /** Awan kartun bertumpuk: sisi bawah berbayang, atas mengilap. */
  function cloudSvg(cls, style) {
    const puffs = '<ellipse cx="56" cy="70" rx="34" ry="27"/><ellipse cx="102" cy="48" rx="42" ry="35"/>' +
      '<ellipse cx="148" cy="72" rx="30" ry="25"/><rect x="22" y="66" width="150" height="32" rx="16"/>';
    return '<svg class="' + cls + '"' + (style ? ' style="' + style + '"' : '') + ' viewBox="0 0 200 116" aria-hidden="true">' +
      '<g class="cl-lo" transform="translate(0 9)">' + puffs + '</g>' +
      '<g class="cl-mid">' + puffs + '</g>' +
      '<g class="cl-hi"><ellipse cx="98" cy="30" rx="27" ry="15"/><ellipse cx="56" cy="52" rx="17" ry="9"/><ellipse cx="146" cy="56" rx="14" ry="8"/></g>' +
      '</svg>';
  }

  /** Satu tingkat daun cemara: sisi samping cembung, dasar menggantung. */
  function pineTier(cx, topY, bottomY, half) {
    const rise = (bottomY - topY) * .42;
    return 'M' + cx + ' ' + round(topY) +
      'Q' + round(cx + half * .5) + ' ' + round(topY + rise) + ' ' + round(cx + half) + ' ' + round(bottomY) +
      'Q' + round(cx + half * .42) + ' ' + round(bottomY + 9) + ' ' + cx + ' ' + round(bottomY + 3) +
      'Q' + round(cx - half * .42) + ' ' + round(bottomY + 9) + ' ' + round(cx - half) + ' ' + round(bottomY) +
      'Q' + round(cx - half * .5) + ' ' + round(topY + rise) + ' ' + cx + ' ' + round(topY) + 'Z';
  }

  function pineSvg() {
    const grad = uid('pine');
    return '<svg viewBox="0 0 100 176" aria-hidden="true" class="sf-pine">' +
      '<defs><linearGradient id="' + grad + '" x1="0" y1=".1" x2="1" y2=".9">' +
      '<stop offset="0" style="stop-color:var(--pine-lit)"/>' +
      '<stop offset="1" style="stop-color:var(--pine-dark)"/>' +
      '</linearGradient></defs>' +
      '<ellipse class="pt-shadow" cx="50" cy="168" rx="27" ry="6"/>' +
      '<rect class="pt-trunk" x="45" y="118" width="10" height="48" rx="4"/>' +
      '<g fill="url(#' + grad + ')"><path d="' + pineTier(50, 60, 132, 44) + '"/>' +
      '<path d="' + pineTier(50, 32, 100, 33) + '"/>' +
      '<path d="' + pineTier(50, 10, 70, 23) + '"/></g>' +
      '</svg>';
  }

  /** Bukit rerumputan: punggung bergelombang, bukan setengah lingkaran kaku. */
  function hillSvg() {
    const pts = [[-60, 176], [110, 132], [290, 96], [470, 136], [640, 172], [806, 128], [980, 94], [1140, 140], [1260, 172]];
    const ridge = smoothRidge(pts);
    const grad = uid('hill');
    return '<svg class="sf-hill" viewBox="0 0 1200 320" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><linearGradient id="' + grad + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" style="stop-color:var(--hill-lit)"/>' +
      '<stop offset="1" style="stop-color:var(--hill-dark)"/>' +
      '</linearGradient></defs>' +
      '<path d="' + ridge + ' L1260 320 L-60 320 Z" fill="url(#' + grad + ')"/>' +
      '<path class="hill-edge" d="' + ridge + '"/>' +
      '</svg>';
  }

  /* ---------------------------------------------------------- */

  function sceneDefault() {
    const floats = ['monitor', 'router', 'server', 'ip', 'network'];
    let floatMarkup = '';
    floats.forEach((name, index) => {
      floatMarkup += '<span class="sd-float f' + (index + 1) + '">' + icon(name) + '</span>';
    });
    let particles = '';
    for (let i = 0; i < 18; i += 1) {
      particles += '<i style="left:' + round(between(2, 98)) + '%;bottom:' + round(between(2, 46)) + '%;--dur:' + round(between(7, 16)) + 's;--delay:' + round(between(0, 11)) + 's;opacity:' + round(between(.2, .7), 2) + '"></i>';
    }
    return (
      '<div class="s-default">' +
      '<div class="sd-grid"></div>' +
      '<div class="sd-floats">' + floatMarkup + '</div>' +
      '<div class="sd-particles">' + particles + '</div>' +
      '</div>'
    );
  }

  /* ---------------------------------------------------------- */

  function bird() {
    return '<svg viewBox="0 0 64 24" aria-hidden="true"><path d="M2 16C10 6 18 5 27 15c9-10 17-9 27 1" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
  }

  /* Punggungan tiga lapis: yang jauh paling landai dan kebiruan, yang dekat
     paling tinggi dan paling hijau. Titiknya ditulis tangan supaya bentuknya
     benar-benar menyerupai rangkaian gunung, bukan segitiga kaku. */
  const FOREST_RANGES = [
    {
      cls: 'sf-mountain m1', snowline: 215, snow: 78,
      points: [[-60, 300], [80, 262], [180, 196], [268, 242], [360, 268], [470, 180], [560, 128], [656, 196], [752, 246], [852, 272], [948, 208], [1052, 168], [1140, 220], [1260, 262]]
    },
    {
      cls: 'sf-mountain m2', snowline: 250, snow: 88,
      points: [[-60, 362], [90, 318], [200, 246], [300, 302], [400, 334], [520, 238], [610, 186], [700, 258], [800, 322], [900, 354], [1000, 292], [1100, 242], [1200, 302], [1260, 332]]
    },
    {
      cls: 'sf-mountain m3', snowline: 262, snow: 104,
      points: [[-60, 432], [120, 388], [240, 306], [350, 372], [470, 410], [585, 300], [690, 206], [795, 316], [900, 400], [1010, 366], [1120, 300], [1210, 360], [1260, 396]]
    }
  ];

  function sceneForest() {
    const trees = [
      { x: 3, s: 1.15, op: .9 }, { x: 13, s: .8, op: .7 }, { x: 22, s: 1.4, op: .95 },
      { x: 36, s: .7, op: .6 }, { x: 66, s: .9, op: .75 }, { x: 78, s: 1.35, op: .9 },
      { x: 89, s: .8, op: .65 }, { x: 96, s: 1.1, op: .8 }
    ];
    let treeMarkup = '';
    trees.forEach((tree, index) => {
      treeMarkup += '<div class="sf-tree" style="--x:' + tree.x + '%;--s:' + tree.s + ';--op:' + tree.op + ';--delay:-' + round(index * .7) + 's;--sway:' + round(6 + index * .3) + 's">' + pineSvg() + '</div>';
    });
    let birds = '';
    for (let i = 0; i < 7; i += 1) {
      birds += '<span class="sf-bird" style="--y:' + round(between(8, 42)) + '%;--s:' + round(between(.7, 1.3)) + ';--dur:' + round(between(22, 42)) + 's;--delay:-' + round(between(0, 32)) + 's;--op:' + round(between(.3, .6), 2) + '">' + bird() + '</span>';
    }
    let leaves = '';
    for (let i = 0; i < 9; i += 1) {
      leaves += '<i class="sf-leaf" style="--x:' + round(between(2, 98)) + '%;--dur:' + round(between(14, 26)) + 's;--delay:-' + round(between(0, 20)) + 's"></i>';
    }
    let fireflies = '';
    for (let i = 0; i < 12; i += 1) {
      fireflies += '<i class="sf-firefly" style="--x:' + round(between(4, 96)) + '%;--y:' + round(between(46, 92)) + '%;--dur:' + round(between(4, 9)) + 's;--delay:-' + round(between(0, 8)) + 's"></i>';
    }
    /* Awan: ukuran, tinggi, dan kecepatannya beda-beda supaya tidak seragam. */
    const cloudData = [
      [11, 'clamp(170px,26vw,330px)', 66, 0, .82],
      [21, 'clamp(120px,17vw,220px)', 88, -24, .58],
      [6, 'clamp(96px,13vw,170px)', 74, -48, .44],
      [28, 'clamp(140px,20vw,260px)', 104, -70, .5]
    ];
    let cloudMarkup = '';
    cloudData.forEach(item => {
      cloudMarkup += cloudSvg('sf-cloud', '--top:' + item[0] + '%;--w:' + item[1] + ';--dur:' + item[2] + 's;--delay:' + item[3] + 's;--op:' + item[4]);
    });
    let mountains = '';
    FOREST_RANGES.forEach(range => { mountains += mountainSvg(range); });
    return (
      '<div class="s-forest">' +
      '<div class="sf-sun"></div>' +
      cloudMarkup +
      mountains +
      hillSvg() +
      '<div class="sf-trees">' + treeMarkup + '</div>' +
      '<div class="sf-birds">' + birds + '</div>' +
      leaves +
      fireflies +
      '</div>'
    );
  }

  /* ---------------------------------------------------------- */

  function fishSvg(variant) {
    const stripes = variant % 2 === 0
      ? '<path d="M34 12v16M44 10v20" stroke="rgba(255,255,255,.35)" stroke-width="3" stroke-linecap="round" fill="none"/>'
      : '<circle cx="43" cy="19" r="4" fill="rgba(255,255,255,.28)"/>';
    return (
      '<svg viewBox="0 0 64 40" aria-hidden="true">' +
      '<g class="fish-tail"><path d="M16 20 3 7v26z" fill="currentColor"/></g>' +
      '<ellipse cx="34" cy="20" rx="23" ry="14" fill="currentColor"/>' +
      '<path d="M30 7c4-5 10-6 14-3-3 3-5 5-6 8z" fill="currentColor" opacity=".8"/>' +
      stripes +
      '<circle cx="48" cy="16" r="2.6" fill="rgba(10,30,40,.7)"/><circle cx="48.8" cy="15.2" r=".9" fill="#fff"/>' +
      '</svg>'
    );
  }

  function jellySvg() {
    return (
      '<svg viewBox="0 0 64 88" aria-hidden="true">' +
      '<path d="M5 40a27 27 0 0 1 54 0c0 4-4 6-8 6H13c-4 0-8-2-8-6z" fill="currentColor"/>' +
      '<path d="M14 48c2 12-3 20 1 32M25 48c3 12-2 24 2 34M39 48c-3 12 2 22-1 33M50 48c-2 10 3 18 0 30" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none" opacity=".75"/>' +
      '<circle cx="24" cy="35" r="2.6" fill="rgba(70,20,70,.55)"/><circle cx="40" cy="35" r="2.6" fill="rgba(70,20,70,.55)"/>' +
      '<path d="M29 42c2 2 4 2 6 0" stroke="rgba(70,20,70,.5)" stroke-width="2" stroke-linecap="round" fill="none"/>' +
      '</svg>'
    );
  }

  function turtleSvg() {
    return (
      '<svg viewBox="0 0 96 72" aria-hidden="true">' +
      '<ellipse cx="46" cy="38" rx="32" ry="22" fill="currentColor"/>' +
      '<path d="M46 17c10 8 10 34 0 42M30 20c-5 10-5 26 0 36M62 20c5 10 5 26 0 36" stroke="rgba(255,255,255,.35)" stroke-width="2" fill="none"/>' +
      '<circle cx="80" cy="34" r="10" fill="currentColor"/>' +
      '<circle cx="84" cy="32" r="1.9" fill="#082018"/>' +
      '<path d="M20 48c-8 2-12 8-10 12 4 1 9-3 12-7M66 52c2 8 8 12 12 9 1-4-3-9-7-11" fill="currentColor" opacity=".85"/>' +
      '</svg>'
    );
  }

  function coralSvg() {
    return (
      '<svg viewBox="0 0 80 90" aria-hidden="true">' +
      '<path d="M40 88V36M40 56c-10-2-16-10-16-22M40 46c10-2 16-12 16-24M24 34c-6 0-10-4-10-10M56 22c6 0 10-4 10-10M28 64c-8 0-14-4-14-12" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>' +
      '</svg>'
    );
  }

  /** Dasar laut: bukit pasir melengkung + batuan bundar, bukan garis patah. */
  function seabedSvg() {
    const pts = [[-60, 150], [90, 104], [210, 158], [330, 122], [450, 92], [560, 148], [690, 126], [810, 96], [930, 152], [1050, 128], [1160, 100], [1260, 140]];
    const ridge = smoothRidge(pts);
    const grad = uid('sand');
    let pebbles = '';
    const local = mulberry(77213);
    for (let i = 0; i < 9; i += 1) {
      const x = round(-20 + local() * 1240);
      const y = round(178 + local() * 46);
      const rx = round(7 + local() * 16);
      pebbles += '<ellipse class="sb-pebble" cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + round(rx * .55) + '"/>';
    }
    return '<svg class="so-seabed" viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><linearGradient id="' + grad + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" style="stop-color:var(--sand-lit)"/>' +
      '<stop offset="1" style="stop-color:var(--sand-dark)"/></linearGradient></defs>' +
      '<path d="' + ridge + ' L1260 240 L-60 240 Z" fill="url(#' + grad + ')"/>' +
      '<path class="sb-rim" d="' + ridge + '"/>' +
      pebbles +
      '</svg>';
  }

  function sceneOcean() {
    const fish = [
      { y: 22, s: 1, dur: 24, delay: 0, color: 'var(--warn)', dir: 'right' },
      { y: 34, s: .7, dur: 31, delay: -8, color: 'var(--danger)', dir: 'left' },
      { y: 48, s: 1.35, dur: 27, delay: -14, color: 'var(--warn)', dir: 'right' },
      { y: 58, s: .55, dur: 36, delay: -4, color: 'var(--accent)', dir: 'left' },
      { y: 68, s: .9, dur: 22, delay: -18, color: 'var(--success)', dir: 'right' },
      { y: 40, s: .45, dur: 42, delay: -26, color: 'color-mix(in oklab, var(--danger) 55%, #fff)', dir: 'left' },
      { y: 76, s: 1.1, dur: 29, delay: -12, color: 'color-mix(in oklab, var(--warn) 60%, var(--danger))', dir: 'right' },
      { y: 27, s: .6, dur: 34, delay: -30, color: 'color-mix(in oklab, var(--success) 65%, #fff)', dir: 'left' },
      { y: 62, s: .75, dur: 26, delay: -21, color: 'color-mix(in oklab, var(--warn) 55%, #fff)', dir: 'right' }
    ];
    let fishMarkup = '';
    fish.forEach((item, index) => {
      fishMarkup += '<span class="so-fish" data-dir="' + (item.dir === 'left' ? 'left' : 'right') + '" style="--y:' + item.y + '%;--s:' + item.s + ';--dur:' + item.dur + 's;--delay:' + item.delay + 's;--fish:' + item.color + ';--op:' + round(between(.65, .95), 2) + '">' + fishSvg(index) + '</span>';
    });
    let bubbles = '';
    for (let i = 0; i < 16; i += 1) {
      bubbles += '<i class="so-bubble" style="--x:' + round(between(3, 97)) + '%;--w:' + round(between(5, 14)) + 'px;--dur:' + round(between(9, 20)) + 's;--delay:-' + round(between(0, 18)) + 's"></i>';
    }
    let rays = '';
    [12, 30, 52, 74, 90].forEach((x, index) => {
      rays += '<i style="--x:' + x + '%;--w:' + round(between(4, 11)) + 'vw;--r:' + round(between(-14, 14)) + 'deg;--delay:-' + index * 1.4 + 's"></i>';
    });
    let weeds = '';
    const weedData = [[6, 120, 5], [17, 86, 6], [30, 140, 4.5], [70, 110, 5.5], [84, 78, 6.5], [93, 130, 4]];
    weedData.forEach(item => {
      weeds += '<i class="so-seaweed" style="--x:' + item[0] + '%;--h:' + item[1] + 'px;--dur:' + item[2] + 's"></i>';
    });
    return (
      '<div class="s-ocean">' +
      '<div class="so-rays">' + rays + '</div>' +
      seabedSvg() +
      weeds +
      '<div class="so-fishes">' + fishMarkup + '</div>' +
      bubbles +
      '<span class="so-jelly" style="--x:16%;--y:18%;--dur:13s">' + jellySvg() + '</span>' +
      '<span class="so-jelly" style="--x:78%;--y:30%;--dur:16s;opacity:.55">' + jellySvg() + '</span>' +
      '<span class="so-turtle">' + turtleSvg() + '</span>' +
      '<span class="so-floor-star">' + icon('star-outline') + '</span>' +
      '<span class="so-coral">' + coralSvg() + '</span>' +
      '</div>'
    );
  }

  function sceneOceanNight() {
    let starMarkup = '';
    for (let i = 0; i < 46; i += 1) {
      starMarkup += '<i class="son-star" style="left:' + round(between(1, 99)) + '%;top:' + round(between(2, 60)) + '%;--w:' + round(between(1, 2.6)) + 'px;--dur:' + round(between(2.4, 6)) + 's;--delay:-' + round(between(0, 5)) + 's"></i>';
    }
    const fish = [
      { y: 58, s: 1, dur: 26, delay: 0, color: 'var(--accent)', dir: 'right' },
      { y: 70, s: .7, dur: 33, delay: -9, color: 'var(--warn)', dir: 'left' },
      { y: 64, s: 1.25, dur: 29, delay: -16, color: 'color-mix(in oklab, var(--danger) 60%, #fff)', dir: 'right' },
      { y: 80, s: .55, dur: 38, delay: -5, color: 'color-mix(in oklab, var(--success) 45%, #fff)', dir: 'left' },
      { y: 74, s: .9, dur: 24, delay: -20, color: 'var(--warn)', dir: 'right' },
      { y: 86, s: .75, dur: 31, delay: -12, color: 'var(--accent-2)', dir: 'left' },
      { y: 55, s: .5, dur: 40, delay: -24, color: 'color-mix(in oklab, var(--success) 65%, #fff)', dir: 'right' }
    ];
    let fishMarkup = '';
    fish.forEach((item, index) => {
      fishMarkup += '<span class="son-fish" data-dir="' + (item.dir === 'left' ? 'left' : 'right') + '" style="--y:' + item.y + '%;--s:' + item.s + ';--dur:' + item.dur + 's;--delay:' + item.delay + 's;--fish:' + item.color + '">' + fishSvg(index) + '</span>';
    });
    let bubbles = '';
    for (let i = 0; i < 12; i += 1) {
      bubbles += '<i class="so-bubble" style="--x:' + round(between(4, 96)) + '%;--w:' + round(between(5, 12)) + 'px;--dur:' + round(between(10, 18)) + 's;--delay:-' + round(between(0, 16)) + 's"></i>';
    }
    const nightClouds = [
      cloudSvg('son-cloud', '--top:22%;--w:clamp(150px,24vw,290px);--dur:74s;--delay:-6s;--op:.5'),
      cloudSvg('son-cloud', '--top:34%;--w:clamp(110px,17vw,210px);--dur:92s;--delay:-38s;--op:.34'),
      cloudSvg('son-cloud', '--top:12%;--w:clamp(90px,13vw,160px);--dur:104s;--delay:-70s;--op:.26')
    ].join('');
    return (
      '<div class="s-ocean-night">' +
      '<div class="son-sky">' + starMarkup + '<div class="son-moon"></div>' + nightClouds + '</div>' +
      '<div class="son-wave"></div><div class="son-wave w2"></div>' +
      '<div class="son-under"></div>' +
      '<div class="son-fishes">' + fishMarkup + '</div>' + bubbles +
      '</div>'
    );
  }

  /* ---------------------------------------------------------- */

  function plushBear() {
    return (
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle cx="30" cy="30" r="17" fill="currentColor"/><circle cx="90" cy="30" r="17" fill="currentColor"/>' +
      '<circle cx="30" cy="30" r="9" fill="rgba(255,255,255,.35)"/><circle cx="90" cy="30" r="9" fill="rgba(255,255,255,.35)"/>' +
      '<circle cx="60" cy="62" r="44" fill="currentColor"/>' +
      '<ellipse cx="60" cy="78" rx="21" ry="15" fill="rgba(255,255,255,.4)"/>' +
      '<circle cx="46" cy="56" r="4.4" fill="#7a3d5b"/><circle cx="74" cy="56" r="4.4" fill="#7a3d5b"/>' +
      '<ellipse cx="60" cy="72" rx="5" ry="4" fill="#7a3d5b"/>' +
      '<path d="M60 76v4M60 80c-3 4-8 4-10 1M60 80c3 4 8 4 10 1" stroke="#7a3d5b" stroke-width="2" stroke-linecap="round" fill="none"/>' +
      '<circle cx="46" cy="92" r="7" fill="rgba(255,255,255,.28)"/><circle cx="74" cy="92" r="7" fill="rgba(255,255,255,.28)"/>' +
      '<path d="M52 24c2-8 14-8 16 0" stroke="var(--danger)" stroke-width="5" stroke-linecap="round" fill="none"/>' +
      '</svg>'
    );
  }

  function plushBunny() {
    return (
      '<svg viewBox="0 0 120 130" aria-hidden="true">' +
      '<ellipse cx="44" cy="24" rx="11" ry="24" fill="currentColor" transform="rotate(-8 44 24)"/>' +
      '<ellipse cx="78" cy="24" rx="11" ry="24" fill="currentColor" transform="rotate(8 78 24)"/>' +
      '<ellipse cx="44" cy="24" rx="5" ry="15" fill="rgba(255,255,255,.4)" transform="rotate(-8 44 24)"/>' +
      '<ellipse cx="78" cy="24" rx="5" ry="15" fill="rgba(255,255,255,.4)" transform="rotate(8 78 24)"/>' +
      '<circle cx="60" cy="70" r="42" fill="currentColor"/>' +
      '<ellipse cx="60" cy="84" rx="20" ry="14" fill="rgba(255,255,255,.42)"/>' +
      '<circle cx="46" cy="64" r="4.2" fill="#8a4266"/><circle cx="74" cy="64" r="4.2" fill="#8a4266"/>' +
      '<path d="M54 76c2 3 4 4 6 4s4-1 6-4" stroke="#8a4266" stroke-width="2" stroke-linecap="round" fill="none"/>' +
      '<path d="M60 78v5M60 83c-3 4-8 3-9 0M60 83c3 4 8 3 9 0" stroke="#8a4266" stroke-width="2" stroke-linecap="round" fill="none"/>' +
      '<circle cx="42" cy="80" r="6" fill="rgba(255,120,170,.28)"/><circle cx="78" cy="80" r="6" fill="rgba(255,120,170,.28)"/>' +
      '</svg>'
    );
  }

  function sceneCandy() {
    let hearts = '';
    const heartColors = ['color-mix(in oklab, var(--danger) 55%, #fff)', 'var(--danger)', 'color-mix(in oklab, var(--danger) 38%, #fff)', 'color-mix(in oklab, var(--danger) 85%, #fff)'];
    for (let i = 0; i < 10; i += 1) {
      hearts += '<span class="sc-heart" style="--x:' + round(between(3, 95)) + '%;--y:' + round(between(10, 70)) + '%;--s:' + round(between(.7, 1.5)) + ';--dur:' + round(between(11, 22)) + 's;--delay:-' + round(between(0, 18)) + 's;--hc:' + heartColors[i % 4] + '">' + icon('heart') + '</span>';
    }
    let sparkles = '';
    for (let i = 0; i < 12; i += 1) {
      sparkles += '<span class="sc-sparkle" style="--x:' + round(between(4, 96)) + '%;--y:' + round(between(8, 82)) + '%;--dur:' + round(between(2.4, 4.6)) + 's;--delay:-' + round(between(0, 4)) + 's">' + icon('sparkle') + '</span>';
    }
    let ribbons = '';
    [18, 42, 64, 86].forEach((x, index) => {
      ribbons += '<i class="sc-ribbon" style="--x:' + x + '%;--r:' + (index % 2 ? -10 : 12) + 'deg;--delay:-' + index * 1.3 + 's"></i>';
    });
    let bows = '';
    [[8, 14, 70], [46, 9, 46], [82, 20, 58]].forEach((item, index) => {
      bows += '<span class="sc-bow" style="--x:' + item[0] + '%;--y:' + item[1] + '%;--s:' + item[2] + 'px;--delay:-' + index * 2 + 's">' + icon('bow') + '</span>';
    });
    return (
      '<div class="s-candy">' +
      cloudSvg('sc-cloud', '--x:4%;--y:12%;--w:clamp(150px,22vw,280px);--op:.7;--dur:52s;--delay:0s') +
      cloudSvg('sc-cloud', '--x:52%;--y:6%;--w:clamp(100px,15vw,190px);--op:.44;--dur:74s;--delay:-26s') +
      cloudSvg('sc-cloud', '--x:76%;--y:26%;--w:clamp(80px,12vw,150px);--op:.36;--dur:92s;--delay:-52s') +
      bows + ribbons +
      '<div class="sc-hearts">' + hearts + '</div>' +
      '<div class="sc-sparkles">' + sparkles + '</div>' +
      '<span class="sc-bear">' + plushBear() + '</span>' +
      '<span class="sc-bunny">' + plushBunny() + '</span>' +
      '</div>'
    );
  }

  /* ---------------------------------------------------------- */

  function circuitSvg() {
    return (
      '<svg class="sr-circuit" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="1.6">' +
      '<path d="M0 620h120l40-40h90l30-30h180l50 50h140"/>' +
      '<path d="M1200 240h-140l-40 40h-90l-40-40H760l-40 40H580"/>' +
      '<path d="M0 160h160l40 40h100l30-30h120M1200 660h-180l-50-50h-120l-40 40H700"/>' +
      '<path d="M340 800V680l30-30V520M860 0v140l40 40v120M520 0v90l-30 30v80M1000 800V690l-40-40V540"/>' +
      '</g>' +
      '<g fill="currentColor" stroke="none">' +
      '<circle cx="400" cy="580" r="3"/><circle cx="700" cy="240" r="3"/><circle cx="420" cy="160" r="3"/><circle cx="940" cy="650" r="3"/><circle cx="860" cy="300" r="3"/>' +
      '</g>' +
      '</svg>'
    );
  }

  function sceneRed() {
    let sparks = '';
    for (let i = 0; i < 18; i += 1) {
      sparks += '<i class="sr-spark" style="--x:' + round(between(3, 97)) + '%;--y:' + round(between(8, 92)) + '%;--dur:' + round(between(2, 5)) + 's;--delay:-' + round(between(0, 5)) + 's"></i>';
    }
    const racks = [
      { x: 8, delay: 0 }, { x: 24, delay: .4 }, { x: 74, delay: .9 }, { x: 90, delay: 1.3 }
    ];
    let rackMarkup = '';
    racks.forEach(rack => {
      let cells = '';
      for (let i = 0; i < 7; i += 1) {
        cells += '<i style="--delay:-' + round(rack.delay + i * .3) + 's"></i>';
      }
      rackMarkup += '<div class="sr-rack" style="--x:' + rack.x + '%">' + cells + '</div>';
    });
    return (
      '<div class="s-red">' +
      '<div class="sr-grid"></div><div class="sr-scan"></div>' +
      circuitSvg() +
      '<div class="sr-racks">' + rackMarkup + '</div>' +
      sparks +
      '<div class="sr-beam"></div>' +
      '</div>'
    );
  }

  /* ---------------------------------------------------------- */

  function carSvg() {
    return (
      '<svg viewBox="0 0 220 84" aria-hidden="true">' +
      '<path d="M18 58c2-12 10-17 22-19 12-2 18-12 33-14h49c14 0 24 7 34 16l31 5c10 2 16 7 17 16-1 7-6 10-14 10h-6a17 17 0 0 0-33 0H77a17 17 0 0 0-33 0h-9c-11 0-18-5-17-14z" fill="currentColor"/>' +
      '<path d="M84 28h33v15H76c0-6 3-12 8-15zM124 28h-1c9 2 16 8 21 15h-20z" fill="rgba(180,230,255,.8)"/>' +
      '<path d="M15 55h190" stroke="rgba(0,0,0,.25)" stroke-width="3"/>' +
      '<g class="sk-wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="61" cy="65" r="14" fill="#0a0b10"/><circle cx="61" cy="65" r="6" fill="#c9d4e2"/></g>' +
      '<g class="sk-wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="161" cy="65" r="14" fill="#0a0b10"/><circle cx="161" cy="65" r="6" fill="#c9d4e2"/></g>' +
      '<rect x="16" y="48" width="11" height="6" rx="3" class="sk-tail" fill="var(--warn)"/>' +
      '<path d="M196 52h8" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>' +
      '</svg>'
    );
  }

  function sceneCar() {
    let starsMarkup = '';
    for (let i = 0; i < 44; i += 1) {
      starsMarkup += '<i class="sk-star" style="left:' + round(between(1, 99)) + '%;top:' + round(between(2, 90)) + '%;--dur:' + round(between(2.6, 6)) + 's;--delay:-' + round(between(0, 6)) + 's;opacity:' + round(between(.25, .8), 2) + '"></i>';
    }
    let speed = '';
    for (let i = 0; i < 14; i += 1) {
      speed += '<i style="--x:' + round(between(4, 96)) + '%;--y:' + round(between(4, 90)) + '%;--w:' + round(between(50, 170)) + 'px;--dur:' + round(between(1.1, 2.8)) + 's;--delay:-' + round(between(0, 2.4)) + 's"></i>';
    }
    const cars = [
      { s: 150, dur: 15, delay: -2, rev: false },
      { s: 96, dur: 22, delay: -12, rev: true },
      { s: 118, dur: 18, delay: -8, rev: false }
    ];
    let carMarkup = '';
    cars.forEach(car => {
      carMarkup += '<span class="sk-car' + (car.rev ? ' rev' : '') + '" style="--s:' + car.s + 'px;--dur:' + car.dur + 's;--delay:' + car.delay + 's">' + carSvg() + '</span>';
    });
    return (
      '<div class="s-car">' +
      '<div class="sk-stars">' + starsMarkup + '</div>' +
      '<div class="sk-checker"></div>' +
      '<div class="sk-road"></div>' +
      '<div class="sk-speed">' + speed + '</div>' +
      carMarkup +
      '<span class="sk-steer">' + icon('steering') + '</span>' +
      '</div>'
    );
  }

  /* ---------------------------------------------------------- */

  function astronautSvg() {
    return (
      '<svg viewBox="0 0 140 170" aria-hidden="true">' +
      '<path d="M34 156c-4-26 2-40 8-50 4-8 4-14 2-20h52c-2 6-2 12 2 20 6 10 12 24 8 50-16 8-56 8-72 0z" fill="#e9eefc"/>' +
      '<path d="M38 138h24v22H40zM78 138h24v22H78z" fill="#c3cdec"/>' +
      '<rect x="44" y="62" width="52" height="44" rx="16" fill="#f7f9ff"/>' +
      '<circle cx="70" cy="52" r="34" fill="#dfe7fb"/>' +
      '<circle cx="70" cy="52" r="26" fill="#101a3a"/>' +
      '<path d="M50 40c6-12 18-16 27-14" stroke="rgba(255,255,255,.65)" stroke-width="4" stroke-linecap="round" fill="none"/>' +
      '<circle cx="60" cy="52" r="3.4" fill="var(--accent)"/><circle cx="80" cy="52" r="3.4" fill="var(--accent)"/>' +
      '<path d="M64 63c4 3 8 3 12 0" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" fill="none"/>' +
      '<rect x="34" y="88" width="16" height="34" rx="8" fill="#e9eefc" transform="rotate(18 42 105)"/>' +
      '<rect x="90" y="88" width="16" height="34" rx="8" fill="#e9eefc" transform="rotate(-18 98 105)"/>' +
      '<rect x="52" y="108" width="36" height="20" rx="6" fill="#9fb7ff"/>' +
      '<circle cx="61" cy="118" r="3" fill="var(--danger)"/><circle cx="70" cy="118" r="3" fill="var(--warn)"/><circle cx="79" cy="118" r="3" fill="var(--success)"/>' +
      '<path d="M36 150c-17-6-24-2-25 4 6 7 19 7 27 3" fill="#e9eefc"/>' +
      '</svg>'
    );
  }

  function ufoSvg() {
    return (
      '<svg viewBox="0 0 120 90" aria-hidden="true">' +
      '<path d="M60 50 18 84h84z" fill="url(#ufoBeam)" class="ufo-beam" opacity=".35"/>' +
      '<defs><linearGradient id="ufoBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".9"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>' +
      '<ellipse cx="60" cy="44" rx="48" ry="16" fill="currentColor" opacity=".55"/>' +
      '<path d="M28 40c6-18 56-18 64 0z" fill="currentColor"/>' +
      '<ellipse cx="60" cy="40" rx="20" ry="9" fill="rgba(255,255,255,.65)"/>' +
      '<circle cx="34" cy="44" r="3.4" fill="#fff"/><circle cx="60" cy="49" r="3.4" fill="#fff"/><circle cx="86" cy="44" r="3.4" fill="#fff"/>' +
      '</svg>'
    );
  }

  function satelliteSvg() {
    return (
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
      '<rect x="22" y="22" width="20" height="20" rx="4" fill="currentColor"/>' +
      '<rect x="2" y="25" width="16" height="14" rx="2" fill="currentColor" opacity=".6"/>' +
      '<rect x="46" y="25" width="16" height="14" rx="2" fill="currentColor" opacity=".6"/>' +
      '<path d="M18 32h4M42 32h4M32 18v4" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="32" cy="32" r="3" fill="rgba(255,255,255,.7)"/>' +
      '</svg>'
    );
  }

  function sceneAstronaut() {
    let starsMarkup = '';
    for (let i = 0; i < 60; i += 1) {
      starsMarkup += '<i class="ss-star" style="left:' + round(between(1, 99)) + '%;top:' + round(between(2, 96)) + '%;--w:' + round(between(1, 3)) + 'px;--dur:' + round(between(2.6, 7)) + 's;--delay:-' + round(between(0, 6)) + 's"></i>';
    }
    let meteors = '';
    for (let i = 0; i < 4; i += 1) {
      meteors += '<i class="ss-meteor" style="--x:' + round(between(46, 96)) + '%;--y:' + round(between(2, 46)) + '%;--dur:' + round(between(10, 18)) + 's;--delay:-' + round(between(0, 14)) + 's"></i>';
    }
    return (
      '<div class="s-space">' +
      '<div class="ss-nebula n1"></div><div class="ss-nebula n2"></div><div class="ss-nebula n3"></div>' +
      starsMarkup + meteors +
      '<span class="ss-astronaut">' + astronautSvg() + '</span>' +
      '<span class="ss-satellite">' + satelliteSvg() + '</span>' +
      '<span class="ss-ufo">' + ufoSvg() + '</span>' +
      '</div>'
    );
  }

  /* ---------------------------------------------------------- */

  function compassSvg() {
    return (
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="2" opacity=".5"/>' +
      '<circle cx="60" cy="60" r="41" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 7" opacity=".55"/>' +
      '<path d="M60 12v10M60 98v10M12 60h10M98 60h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M60 26 70 60 60 94 50 60z" fill="currentColor" opacity=".75"/>' +
      '<path d="M60 26 60 94 50 60z" fill="currentColor" opacity=".35"/>' +
      '<circle cx="60" cy="60" r="4" fill="currentColor"/>' +
      '</svg>'
    );
  }

  function paperMapSvg() {
    return (
      '<svg viewBox="0 0 420 300" aria-hidden="true">' +
      '<path d="M14 26c30-8 62-8 92 2 38 12 70 4 100-6 40-12 78 6 100 14l96-16v254l-96 16c-22-8-60-26-100-14-30 10-62 18-100 6-30-10-62-10-92-2z" fill="rgba(224,199,150,.28)" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M14 26c30-8 62-8 92 2 38 12 70 4 100-6 40-12 78 6 100 14l96-16" fill="none" stroke="currentColor" stroke-width="1" opacity=".45"/>' +
      '<path d="M60 220c42-40 52-92 108-108 44-12 66 24 112 18 38-5 52-34 76-48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="9 9" opacity=".55"/>' +
      '<path d="M60 220c42-40 52-92 108-108 44-12 66 24 112 18 38-5 52-34 76-48" fill="none" stroke="currentColor" stroke-width="1" opacity=".35"/>' +
      '<circle cx="60" cy="220" r="7" fill="currentColor" opacity=".7"/><circle cx="356" cy="82" r="7" fill="currentColor" opacity=".7"/>' +
      '<path d="M170 70l14-22 16 22-16 8zM268 176l16-22 12 24-14 6z" fill="currentColor" opacity=".45"/>' +
      '<path d="M130 250c22-8 44-6 64 4M210 60c14 10 22 24 26 40M300 210c16-6 30-4 44 6" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".4"/>' +
      '</svg>'
    );
  }

  function bannerSvg() {
    return (
      '<svg viewBox="0 0 120 220" aria-hidden="true">' +
      '<path d="M18 0h84l-8 26H26z" fill="currentColor" opacity=".85"/>' +
      '<path d="M26 26h68v140l-34 26-34-26z" fill="currentColor" opacity=".72"/>' +
      '<path d="M26 26h68v140l-34 26-34-26z" fill="none" stroke="rgba(255,240,205,.5)" stroke-width="2"/>' +
      '<path d="M60 64l10 20 22 3-16 16 4 22-20-10-20 10 4-22-16-16 22-3z" fill="none" stroke="rgba(255,240,205,.85)" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M60 78v30M50 92h20" stroke="rgba(255,240,205,.85)" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>'
    );
  }

  function sparkIconSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  }

  function scenePaper() {
    let dust = '';
    for (let i = 0; i < 30; i += 1) {
      dust += '<i class="sp-dust" style="--x:' + round(between(2, 98)) + '%;--y:' + round(between(4, 96)) + '%;--w:' + round(between(2, 5)) + 'px;--dur:' + round(between(8, 22)) + 's;--delay:-' + round(between(0, 18)) + 's;--drift:' + round(between(-40, 40)) + 'px"></i>';
    }
    let tokens = '';
    const hexes = [[10, 58, 0], [20, 74, -12], [87, 62, 9], [72, 78, 16]];
    hexes.forEach((item, index) => {
      tokens += '<span class="sp-token" style="--x:' + item[0] + '%;--y:' + item[1] + '%;--r:' + item[2] + 'deg;--dur:' + round(between(8, 13)) + 's;--delay:-' + (index * 1.7) + 's">' + sparkIconSvg() + '</span>';
    });
    return (
      '<div class="s-paper">' +
      '<div class="sp-glow"></div>' +
      '<div class="sp-beams"></div>' +
      '<div class="sp-planks"></div>' +
      '<div class="sp-map">' + paperMapSvg() + '</div>' +
      '<div class="sp-compass">' + compassSvg() + '</div>' +
      '<div class="sp-banner b1">' + bannerSvg() + '</div>' +
      '<div class="sp-banner b2">' + bannerSvg() + '</div>' +
      '<div class="sp-candles"><i class="c1"></i><i class="c2"></i><i class="c3"></i></div>' +
      tokens + dust +
      '</div>'
    );
  }

  const builders = {
    default: sceneDefault,
    forest: sceneForest,
    ocean: sceneOcean,
    candy: sceneCandy,
    red: sceneRed,
    car: sceneCar,
    astronaut: sceneAstronaut,
    paper: scenePaper
  };

  function render(themeId, mode) {
    if (!scene) return;
    const target = builders[themeId] ? themeId : 'default';
    const activeMode = mode || Neko.theme.current().mode;
    if (themeId === 'ocean' && activeMode === 'dark') {
      currentTheme = 'ocean-night';
      currentMode = activeMode;
      scene.innerHTML = '<div class="scene-inner">' + sceneOceanNight() + '</div>';
      return;
    }
    currentTheme = target;
    currentMode = activeMode;
    scene.innerHTML = '<div class="scene-inner">' + builders[target]() + '</div>';
  }

  Neko.scenes = {
    render,
    get current() { return currentTheme; }
  };
})();
