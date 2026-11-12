/* ============================================================
   NEKO — Hiasan 3D (gaya render Blender / clay soft-shading)
   Digambar sebagai SVG supaya tajam di semua ukuran layar dan
   warnanya otomatis ikut tema (lewat custom property --orn-*).
   ============================================================ */

(() => {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  let seq = 0;

  function uid() { return 'orn' + (++seq); }

  /* Bayangan kontak lembut di bawah objek. */
  function ground(id, cx = 50, cy = 88, rx = 30, ry = 6.5, opacity = .45) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#ao${id})" opacity="${opacity}"/>`;
  }

  function aoDefs(id) {
    return `<radialGradient id="ao${id}" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#120f0c" stop-opacity=".62"/>
      <stop offset="70%" stop-color="#120f0c" stop-opacity=".22"/>
      <stop offset="100%" stop-color="#120f0c" stop-opacity="0"/>
    </radialGradient>`;
  }

  /* Bola clay: highlight kiri-atas, terminator hangat, rim light kanan-bawah. */
  function sphere(id) {
    return `<radialGradient id="b${id}" cx="34%" cy="27%" r="82%">
      <stop offset="0" style="stop-color:var(--orn-hi)"/>
      <stop offset="38%" style="stop-color:var(--orn-main)"/>
      <stop offset="76%" style="stop-color:var(--orn-mid)"/>
      <stop offset="100%" style="stop-color:var(--orn-lo)"/>
    </radialGradient>
    <radialGradient id="s${id}" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff" stop-opacity=".92"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>`;
  }

  function sphereBody(id, cx = 50, cy = 48, r = 32) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#b${id})"/>
      <ellipse cx="${cx - r * .34}" cy="${cy - r * .42}" rx="${r * .3}" ry="${r * .2}" fill="url(#s${id})" transform="rotate(-28 ${cx - r * .34} ${cy - r * .42})"/>
      <path d="M${cx + r * .86} ${cy + r * .3} A${r} ${r} 0 0 1 ${cx + r * .1} ${cy + r * .97}" fill="none" style="stroke:var(--orn-rim)" stroke-width="${(r * .1).toFixed(1)}" stroke-linecap="round" opacity=".5"/>
      <path d="M${cx - r * .78} ${cy + r * .58} A${r * 1.02} ${r * 1.02} 0 0 0 ${cx + r * .34} ${cy + r * .93}" fill="none" stop-color="none" stroke="#0a0d12" stroke-width="${(r * .16).toFixed(1)}" opacity=".14" stroke-linecap="round"/>`;
  }

  const SHAPES = {
    /* bola tunggal */
    sphere(id) {
      return {
        defs: aoDefs(id) + sphere(id),
        body: ground(id, 50, 88, 28, 6, .5) + sphereBody(id, 50, 48, 32)
      };
    },

    /* sepasang bola (dekorasi beranda) */
    orbs(id) {
      return {
        defs: aoDefs(id) + sphere(id),
        body: ground(id, 34, 86, 20, 5, .45) + ground(id, 72, 78, 14, 3.6, .35) +
          sphereBody(id, 32, 52, 26) +
          `<g opacity=".92">${sphereBody(id, 74, 46, 17)}</g>`
      };
    },

    /* kubus isometrik tiga sisi */
    cube(id) {
      return {
        defs: aoDefs(id) + `
          <linearGradient id="t${id}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style="stop-color:var(--orn-hi)"/>
            <stop offset="100%" style="stop-color:var(--orn-main)"/>
          </linearGradient>
          <linearGradient id="l${id}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style="stop-color:var(--orn-mid)"/>
            <stop offset="100%" style="stop-color:var(--orn-lo)"/>
          </linearGradient>
          <linearGradient id="r${id}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style="stop-color:var(--orn-main)"/>
            <stop offset="100%" style="stop-color:var(--orn-mid)"/>
          </linearGradient>`,
        body: ground(id, 52, 88, 28, 6, .5) + `
          <path d="M50 16 84 34 50 52 16 34Z" fill="url(#t${id})"/>
          <path d="M16 34 50 52v36L16 70Z" fill="url(#l${id})"/>
          <path d="M84 34 50 52v36l34-18Z" fill="url(#r${id})"/>
          <path d="M50 16 84 34 50 52 16 34Z" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1"/>
          <path d="M50 52v36" stroke="#0a0d12" stroke-opacity=".18" stroke-width="1.2"/>`
      };
    },

    /* donut / torus clay */
    torus(id) {
      return {
        defs: aoDefs(id) + `
          <linearGradient id="g${id}" x1=".18" y1=".05" x2=".82" y2=".95">
            <stop offset="0" style="stop-color:var(--orn-hi)"/>
            <stop offset="42%" style="stop-color:var(--orn-main)"/>
            <stop offset="78%" style="stop-color:var(--orn-mid)"/>
            <stop offset="100%" style="stop-color:var(--orn-lo)"/>
          </linearGradient>
          <radialGradient id="h${id}" cx="50%" cy="50%" r="50%">
            <stop offset="0" style="stop-color:var(--orn-lo)" stop-opacity=".9"/>
            <stop offset="100%" style="stop-color:var(--orn-lo)" stop-opacity="0"/>
          </radialGradient>`,
        body: ground(id, 50, 84, 30, 6.5, .48) + `
          <ellipse cx="50" cy="48" rx="34" ry="30" fill="url(#g${id})"/>
          <ellipse cx="50" cy="49" rx="14" ry="11" fill="url(#h${id})"/>
          <ellipse cx="50" cy="50" rx="13" ry="10" fill="#0c1116" opacity=".38"/>
          <path d="M22 32a34 30 0 0 1 22-12" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="3.4" stroke-linecap="round"/>
          <path d="M76 62a34 30 0 0 1-24 14" fill="none" style="stroke:var(--orn-rim)" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>`
      };
    },

    /* kapsul (obor/pil) */
    capsule(id) {
      return {
        defs: aoDefs(id) + `
          <linearGradient id="c${id}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style="stop-color:var(--orn-lo)"/>
            <stop offset="22%" style="stop-color:var(--orn-main)"/>
            <stop offset="42%" style="stop-color:var(--orn-hi)"/>
            <stop offset="78%" style="stop-color:var(--orn-mid)"/>
            <stop offset="100%" style="stop-color:var(--orn-lo)"/>
          </linearGradient>`,
        body: ground(id, 50, 90, 22, 5, .46) + `
          <rect x="26" y="14" width="48" height="66" rx="24" fill="url(#c${id})"/>
          <rect x="34" y="22" width="9" height="34" rx="4.5" fill="#fff" opacity=".3"/>
          <path d="M62 76a24 24 0 0 0 10-14" fill="none" style="stroke:var(--orn-rim)" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>`
      };
    },

    /* kristal / berlian */
    crystal(id) {
      return {
        defs: aoDefs(id) + `
          <linearGradient id="f1${id}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#fff" stop-opacity=".78"/>
            <stop offset="100%" style="stop-color:var(--orn-main)"/>
          </linearGradient>
          <linearGradient id="f2${id}" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" style="stop-color:var(--orn-main)"/>
            <stop offset="100%" style="stop-color:var(--orn-lo)"/>
          </linearGradient>
          <linearGradient id="f3${id}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style="stop-color:var(--orn-mid)"/>
            <stop offset="100%" style="stop-color:var(--orn-lo)"/>
          </linearGradient>`,
        body: ground(id, 50, 88, 22, 5, .5) + `
          <path d="M50 10 74 32 50 86 26 32Z" fill="url(#f3${id})"/>
          <path d="M50 10 74 32 50 44Z" fill="url(#f1${id})"/>
          <path d="M26 32 50 44 50 86Z" fill="url(#f2${id})" opacity=".72"/>
          <path d="M50 10 74 32 50 86 26 32Z" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1"/>
          <path d="M26 32h48M50 44 50 10" stroke="#fff" stroke-opacity=".26" stroke-width="1"/>`
      };
    },

    /* kerucut / gunung kecil clay */
    cone(id) {
      return {
        defs: aoDefs(id) + `
          <linearGradient id="k${id}" x1=".1" y1="0" x2=".95" y2=".9">
            <stop offset="0" style="stop-color:var(--orn-hi)"/>
            <stop offset="45%" style="stop-color:var(--orn-main)"/>
            <stop offset="100%" style="stop-color:var(--orn-lo)"/>
          </linearGradient>`,
        body: ground(id, 50, 84, 30, 6, .48) + `
          <path d="M50 12 82 78a32 12 0 0 1-64 0Z" fill="url(#k${id})"/>
          <ellipse cx="50" cy="78" rx="32" ry="9" fill="var(--orn-lo)" opacity=".55"/>
          <path d="M50 12 62 38q-12 6-24 2Z" fill="#fff" opacity=".22"/>`
      };
    },

    /* awan kartun bertumpuk — juga dipakai di latar dunia */
    cloud(id) {
      return {
        defs: aoDefs(id) + `
          <radialGradient id="w${id}" cx="32%" cy="24%" r="86%">
            <stop offset="0" stop-color="#ffffff"/>
            <stop offset="58%" stop-color="#f3f6fb"/>
            <stop offset="100%" stop-color="#c9d4e4"/>
          </radialGradient>
          <radialGradient id="wd${id}" cx="34%" cy="26%" r="86%">
            <stop offset="0" stop-color="#eaf1fb"/>
            <stop offset="100%" style="stop-color:var(--orn-mid)" stop-opacity=".55"/>
          </radialGradient>`,
        body: ground(id, 50, 82, 26, 5, .3) + `
          <g>
            <ellipse cx="30" cy="56" rx="20" ry="16" fill="url(#wd${id})"/>
            <ellipse cx="70" cy="56" rx="18" ry="14" fill="url(#wd${id})"/>
            <ellipse cx="50" cy="60" rx="30" ry="15" fill="url(#w${id})"/>
            <circle cx="42" cy="40" r="19" fill="url(#w${id})"/>
            <circle cx="62" cy="46" r="14" fill="url(#w${id})"/>
            <circle cx="36" cy="36" r="7" fill="#fff" opacity=".7"/>
          </g>`
      };
    },

    /* planet bercincin */
    planet(id) {
      return {
        defs: aoDefs(id) + sphere(id) + `
          <linearGradient id="rg${id}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style="stop-color:var(--orn-rim)" stop-opacity=".15"/>
            <stop offset="45%" style="stop-color:var(--orn-hi)"/>
            <stop offset="100%" style="stop-color:var(--orn-rim)" stop-opacity=".2"/>
          </linearGradient>`,
        body: ground(id, 50, 86, 24, 5, .45) + `
          <ellipse cx="50" cy="50" rx="42" ry="12" fill="none" stroke="url(#rg${id})" stroke-width="6" transform="rotate(-18 50 50)" opacity=".9"/>
          ${sphereBody(id, 50, 48, 24)}
          <path d="M12 62a42 12 -18 0 0 76 -18" fill="none" stroke="url(#rg${id})" stroke-width="6" opacity=".95"/>`
      };
    }
  };

  function svg(name, cls = '', opts = {}) {
    const shape = SHAPES[name] || SHAPES.sphere;
    const id = uid();
    const built = shape(id);
    const label = opts.label || 'hiasan';
    const style = opts.style ? ` style="${opts.style}"` : '';
    const size = opts.size ? ` width="${opts.size}" height="${opts.size}"` : '';
    return `<svg class="orn orn-${name} ${cls}"${size}${style} viewBox="0 0 100 100" role="img" aria-label="${label}" data-ornament="${name}"><defs>${built.defs}</defs>${built.body}</svg>`;
  }

  /* Rangkaian dekorasi untuk sudut/hero: beberapa objek dengan skala & offset. */
  function cluster(preset = 'hero') {
    const set = {
      hero: [['sphere', 'o1', ''], ['crystal', 'o2', ''], ['cloud', 'o3', '']],
      arena: [['cube', 'o1', ''], ['orbs', 'o2', ''], ['planet', 'o3', '']],
      library: [['capsule', 'o1', ''], ['cloud', 'o2', ''], ['crystal', 'o3', '']],
      profile: [['torus', 'o1', ''], ['sphere', 'o2', ''], ['cone', 'o3', '']],
      light: [['cloud', 'o1', ''], ['cloud', 'o2', ''], ['sphere', 'o3', '']]
    }[preset] || [];
    return `<span class="orn-cluster" data-preset="${preset}" aria-hidden="true">` +
      set.map(([name, cls]) => svg(name, cls, { label: 'Hiasan ' + name })).join('') +
      '</span>';
  }

  Neko.ornaments = { svg, cluster, shapes: Object.keys(SHAPES) };
})();
