/* ============================================================
   NEKO · js/icons.js
   Sistem ikon SVG. Tidak memakai emoji. Ikon inti berubah
   mengikuti tema aktif.
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};

  const base = {
    home: '<path d="M3 11.2 12 3.5l9 7.7"/><path d="M5.5 9.8V20h5v-5.4h3V20h5V9.8"/>',
    books: '<path d="M4 5.2A2.2 2.2 0 0 1 6.2 3H20v15.4H6.4A2.4 2.4 0 0 0 4 20.8z"/><path d="M4 20.8V5.2M8 7.4h7.6M8 10.6h5.4"/>',
    book: '<path d="M4 5.2A2.2 2.2 0 0 1 6.2 3H20v15.4H6.4A2.4 2.4 0 0 0 4 20.8z"/><path d="M4 20.8V5.2"/>',
    arena: '<rect x="2.6" y="7" width="18.8" height="10" rx="5"/><path d="M8 11.2v1.6M6.2 12.6h3.6M15.6 11.4h.01M17.8 13.4h.01"/>',
    gamepad: '<rect x="2.6" y="7" width="18.8" height="10" rx="5"/><path d="M8 11.2v1.6M6.2 12.6h3.6M15.6 11.4h.01M17.8 13.4h.01"/>',
    profile: '<circle cx="12" cy="8.2" r="3.4"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    user: '<circle cx="12" cy="8.2" r="3.4"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    users: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.7a3 3 0 0 1 0 5.6M17.5 14.2a5.5 5.5 0 0 1 3 4.8"/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><path d="M19 13.4a7.4 7.4 0 0 0 0-2.8l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2.4-1.4L13.8 2h-3.6l-.4 2.6A7.4 7.4 0 0 0 7.4 6L5 5 3 8.4l2 1.6a7.4 7.4 0 0 0 0 2.8l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2.4 1.4l.4 2.6h3.6l.4-2.6a7.4 7.4 0 0 0 2.4-1.4l2.4 1 2-3.4z"/>',
    palette: '<path d="M12 3a9 9 0 0 0 0 18c1.6 0 2.4-1 2.4-2.2 0-1.5-1.4-2-1.4-3.3 0-1.1.9-2 2.1-2H18a3 3 0 0 0 3-3c0-4-4-7.5-9-7.5z"/><circle cx="7.6" cy="10" r="1"/><circle cx="10" cy="6.8" r="1"/><circle cx="14.4" cy="6.6" r="1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/>',
    moon: '<path d="M20.5 14.8A8.6 8.6 0 0 1 9.2 3.5 8.8 8.8 0 1 0 20.5 14.8z"/>',
    volume: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.3 5.7a9 9 0 0 1 0 12.6"/>',
    'volume-off': '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m4.5 12.5 5 5L20 6.8"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12.4 2.7 2.7L16.4 9.4"/>',
    'x-circle': '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    'chevron-left': '<path d="m14.5 5-7 7 7 7"/>',
    'chevron-right': '<path d="m9.5 5 7 7-7 7"/>',
    'chevron-down': '<path d="m5 9 7 7 7-7"/>',
    'chevron-up': '<path d="m5 15 7-7 7 7"/>',
    'arrow-left': '<path d="M20 12H4m6-6-6 6 6 6"/>',
    'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    'arrow-up-right': '<path d="M7 17 17 7M9 7h8v8"/>',
    'arrow-up': '<path d="M12 20V4m-6 6 6-6 6 6"/>',
    'arrow-down': '<path d="M12 4v16m6-6-6 6-6-6"/>',
    play: '<path d="M8 5.5v13L19 12z"/>',
    exit: '<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M9 12h10M14.5 7.5 19 12l-4.5 4.5M4 4v16"/>',
    logout: '<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M9 12h10M14.5 7.5 19 12l-4.5 4.5M4 4v16"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/>',
    medal: '<circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 10 5 3.5h4L12 9M15.5 10 19 3.5h-4L12 9"/><path d="m12 12 .8 1.7 1.9.2-1.4 1.3.4 1.9-1.7-.9-1.7.9.4-1.9-1.4-1.3 1.9-.2z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.4l3.4 2"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9 2.5h6M12 2.5V6M18.4 7.6l1.4-1.4"/>',
    flame: '<path d="M12 21c4 0 6.5-2.6 6.5-6 0-4.5-4.5-6.4-4-11.5-2.5 1-4 3.3-4 5.5 0 1.5.7 2.5 1.4 3.3-1.4-.2-2.4-1.2-2.9-2.4-1 1.2-2 2.9-2 5.1 0 3.4 2.5 6 5 6z"/>',
    bolt: '<path d="M13 2 4.5 14H11l-1 8 8.5-12H12z"/>',
    live: '<circle cx="12" cy="12" r="3"/><path d="M7.4 7.4a6.5 6.5 0 0 0 0 9.2M16.6 16.6a6.5 6.5 0 0 0 0-9.2"/><path d="M4.6 4.6a10.4 10.4 0 0 0 0 14.8M19.4 19.4a10.4 10.4 0 0 0 0-14.8"/>',
    login: '<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 12h9M15 8l4 4-4 4M4 4v16"/>',
    zap: '<path d="M13 2 4.5 14H11l-1 8 8.5-12H12z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.3"/>',
    crosshair: '<circle cx="12" cy="12" r="8"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',
    'user-plus': '<circle cx="9.5" cy="8" r="3.2"/><path d="M3.5 19.5a6 6 0 0 1 12 0M18 9v6M15 12h6"/>',
    minus: '<path d="M5 12h14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 6"/><path d="M20 4v7h-7"/>',
    restart: '<path d="M4 11a8 8 0 1 1 2.3 6"/><path d="M4 4v7h7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 10.8V17M12 7.4h.01"/>',
    warning: '<path d="M12 3 2.5 20h19z"/><path d="M12 9v5M12 17.2h.01"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.4 9.2a2.7 2.7 0 1 1 3.6 2.6c-.8.3-1 1-1 1.8M12 17h.01"/>',
    bell: '<path d="M18 8.5a6 6 0 0 0-12 0c0 6.5-2.5 7-2.5 8.5h17c0-1.5-2.5-2-2.5-8.5M10 20h4"/>',
    sparkle: '<path d="M12 3c.7 4.8 1.8 6.2 6.5 7-4.7.8-5.8 2.2-6.5 7-.7-4.8-1.8-6.2-6.5-7 4.7-.8 5.8-2.2 6.5-7z"/><path d="M18.5 15.5c.3 1.8.8 2.3 2.5 2.5-1.7.2-2.2.7-2.5 2.5-.3-1.8-.8-2.3-2.5-2.5 1.7-.2 2.2-.7 2.5-2.5z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.8" cy="9" r="1.8"/><path d="m21 16-5.2-5.2L9 17"/>',
    sparkles: '<path d="M12 3c.7 4.8 1.8 6.2 6.5 7-4.7.8-5.8 2.2-6.5 7-.7-4.8-1.8-6.2-6.5-7 4.7-.8 5.8-2.2 6.5-7z"/><path d="M18.5 15.5c.3 1.8.8 2.3 2.5 2.5-1.7.2-2.2.7-2.5 2.5-.3-1.8-.8-2.3-2.5-2.5 1.7-.2 2.2-.7 2.5-2.5z"/>',
    heart: '<path d="M12 20.3 4.6 13a4.7 4.7 0 0 1 6.6-6.6l.8.8.8-.8A4.7 4.7 0 0 1 19.4 13z"/>',
    fish: '<path d="M3 12c3-4.3 8.5-5 12.5-1.5L20 7v10l-4.5-3.5C11.5 17 6 16.3 3 12z"/><circle cx="8" cy="11.2" r=".9" fill="currentColor" stroke="none"/>',
    leaf: '<path d="M4.5 19.5C4 12 8.5 5 20 4c.4 10.5-5.5 16-12.5 15.5z"/><path d="M4.5 19.5C7 14 11.5 9.5 17 7.5"/>',
    tree: '<path d="M12 3 6.5 11h3L5 16.5h14L14.5 11h3z"/><path d="M12 16.5V21M9 21h6"/>',
    car: '<path d="M4 15.5 5.5 9h13L20 15.5v3h-2.5v-1.5h-11V18.5H4z"/><path d="M6.2 12h11.6M7.5 15.2h.01M16.5 15.2h.01"/>',
    steering: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.2"/><path d="M12 9.8V3.2M9.9 12.8 4.5 16.6M14.1 12.8l5.4 3.8"/>',
    rocket: '<path d="M14.5 4.5c3 1 4 2 5 5-2 4-5.5 7-9 8.5l-4-4C8 10.5 11 7 14.5 4.5z"/><circle cx="14.8" cy="9.2" r="1.6"/><path d="M7.5 13.5 4 14l1.5-3M10.5 16.5 10 20l3-1.5M5 19l2-2"/>',
    planet: '<circle cx="12" cy="12" r="6.5"/><ellipse cx="12" cy="12" rx="10.5" ry="3.4" transform="rotate(-18 12 12)"/>',
    alien: '<path d="M12 3c4.4 0 7 3 7 7.2 0 5-4.2 10.8-7 10.8S5 15.2 5 10.2C5 6 7.6 3 12 3z"/><path d="M8.6 10.5c1.4-1.4 2.8-1.4 4.2 0M15.4 10.5c-1.4-1.4-2.8-1.4-4.2 0M10.5 15h3M12 3v-1"/>',
    cat: '<path d="M5 9 4 4l4.5 3a9 9 0 0 1 7 0L20 4l-1 5a7.5 7.5 0 0 1 1 3.5c0 4.1-3.6 6.5-8 6.5S4 16.6 4 12.5A7.5 7.5 0 0 1 5 9z"/><path d="M9 12h.01M15 12h.01M12 15l-1 .8M12 15l1 .8"/>',
    paw: '<ellipse cx="7" cy="8.5" rx="1.8" ry="2.4"/><ellipse cx="12" cy="6.6" rx="1.8" ry="2.5"/><ellipse cx="17" cy="8.5" rx="1.8" ry="2.4"/><path d="M12 11c-2.8 0-5 2.5-5 4.6 0 2.2 2.4 3.4 5 3.4s5-1.2 5-3.4C17 13.5 14.8 11 12 11z"/>',
    bow: '<path d="M12 12 4 7.5V5l6 3M12 12l8-4.5V5l-6 3M12 12 4 16.5V19l6-3M12 12l8 4.5V19l-6-3"/><circle cx="12" cy="12" r="1.6"/>',
    cloud: '<path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 9.5 4.2 4.2 0 0 1 17.5 18z"/>',
    wifi: '<path d="M3 9a13 13 0 0 1 18 0M6 12.5a8.6 8.6 0 0 1 12 0M9 16a4.5 4.5 0 0 1 6 0M12 19.5h.01"/>',
    'wifi-off': '<path d="M3 9a13 13 0 0 1 8-3.4M15.5 7.4A13 13 0 0 1 21 9M6 12.5a8.6 8.6 0 0 1 4-2.3M9 16a4.5 4.5 0 0 1 6 0M12 19.5h.01"/><path d="m3.5 3.5 17 17"/>',
    router: '<rect x="3" y="12" width="18" height="7" rx="2"/><path d="M7 15.5h.01M11 15.5h.01M8 12V8M8 8 5 5M8 8l3-3M16 12V8"/>',
    server: '<rect x="3.5" y="3.5" width="17" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="17" height="7" rx="1.6"/><path d="M7 7h.01M7 17h.01M11 7h5M11 17h5"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    laptop: '<rect x="5" y="5" width="14" height="10" rx="1.8"/><path d="M2 19h20"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M10.5 5h3M11 19h2"/>',
    keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M6 14h8M16 14h2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
    'map-pin': '<path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    'phone-call': '<path d="M5 3h3.5l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L15 12l4 1.5V17a2 2 0 0 1-2.2 2A16 16 0 0 1 3 5.2 2 2 0 0 1 5 3z"/>',
    share: '<circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="m8.2 10.8 7.6-3.8M8.2 13.2l7.6 3.8"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 20h16"/>',
    edit: '<path d="M4 20h4l11-11-4-4L4 16z"/><path d="m13.5 6.5 4 4M4 20v-4"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/>',
    pin: '<path d="m9 4 6 0-1 5 4 4v2h-5v5l-2 2-2-2v-5H4v-2l4-4z"/>',
    brain: '<path d="M9.5 4a3 3 0 0 0-3 3 3.2 3.2 0 0 0-2 5.5A3.4 3.4 0 0 0 7 18a3 3 0 0 0 5 1.5V5.5A1.5 1.5 0 0 0 10.5 4z"/><path d="M14.5 4a3 3 0 0 1 3 3 3.2 3.2 0 0 1 2 5.5A3.4 3.4 0 0 1 17 18a3 3 0 0 1-5 1.5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5M3 17.5l9 5 9-5"/>',
    puzzle: '<path d="M9 3h6v3a2 2 0 1 0 4 0h2v6h-3a2 2 0 1 0 0 4h3v5h-5v-2a2 2 0 1 0-4 0v2H7v-5H4a2 2 0 0 1 0-4h3V7H9z"/>',
    flag: '<path d="M5 21V4M5 5h11l-2 4 2 4H5"/>',
    cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
    cards: '<rect x="7" y="3" width="12" height="16" rx="2" transform="rotate(8 13 11)"/><rect x="4" y="5" width="12" height="16" rx="2"/>',
    memory: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 6V3M12 6V3M17 6V3M7 21v-3M12 21v-3M17 21v-3M7 10h10v4H7z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    shield: '<path d="M12 3 5 6v6c0 4.4 3 7.5 7 9 4-1.5 7-4.6 7-9V6z"/>',
    'shield-check': '<path d="M12 3 5 6v6c0 4.4 3 7.5 7 9 4-1.5 7-4.6 7-9V6z"/><path d="m8.8 12 2.3 2.3 4.2-4.4"/>',
    cable: '<path d="M4 4v4a3 3 0 0 0 3 3h1M20 20v-4a3 3 0 0 0-3-3h-1"/><rect x="8.5" y="8.5" width="7" height="7" rx="2"/><path d="M4 3v1M20 20v1"/>',
    ip: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h.01M10.5 9h.01M14 9h.01M17.5 9h.01M7 14h10"/>',
    switch: '<rect x="2.5" y="7" width="19" height="10" rx="2.5"/><path d="M6 12h.01M9.5 12h.01M13 12h.01M16.5 12h.01M20 12h.01"/>',
    network: '<rect x="8" y="2.5" width="8" height="6" rx="2"/><rect x="2" y="16" width="8" height="6" rx="2"/><rect x="14" y="16" width="8" height="6" rx="2"/><path d="M12 8.5v4M6 16v-3.5h12V16"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    school: '<path d="M3 10 12 3l9 7v10H3z"/><path d="M9 20v-6h6v6M12 3v4M6 13h.01M18 13h.01"/>',
    eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M3 3l18 18M10.6 6.1A11 11 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.1 3.7M6.3 6.3C3.6 8.1 2 12 2 12s3.6 6 10 6c1.2 0 2.3-.2 3.3-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    lock: '<rect x="4.5" y="10" width="15" height="10" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10M12 14v2"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 4l3 3M14 6l3 3"/>',
    dot: '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>',
    microphone: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
    send: '<path d="M21 3 10.5 13.5M21 3l-6.5 18-4-8-8-4z"/>',
    chat: '<path d="M4 4h16v12H9l-5 4z"/><path d="M8 8h8M8 11.5h5"/>',
    spy: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3.2"/><path d="M5 5.5 7 8M19 5.5 17 8"/>',
    detective: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5M4.5 4.5 8 7M16.5 4.5 13 7"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
    'volume-up': '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.3 5.7a9 9 0 0 1 0 12.6"/>',
    'rotate-ccw': '<path d="M4 11a8 8 0 1 1 2.3 6"/><path d="M4 4v7h7"/>',
    'grid': '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    'list-check': '<path d="M9 6h12M9 12h12M9 18h12M4 6l1.5 1.5L8 5M4 18l1.5 1.5L8 17M4.5 12h.01"/>',
    scroll: '<path d="M7 4h11a3 3 0 0 1 0 6h-9a2 2 0 0 0 0 4h10a3 3 0 0 1 0 6H5"/><path d="M7 4a2 2 0 0 0 0 4h2V4zM17 20a2 2 0 0 0 0-4h-2v4z"/><path d="M10 7.5h6M10 11.5h4M12 15.5h4"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/><path d="m12 9 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9.5 11.3 11.5 11z"/>',
    swords: '<path d="M5 3v4l9 9 3-3-9-9H5zM19 3h-4l-9 9 3 3 9-9V3z"/><path d="m8.5 15.5-4 4M15.5 15.5l4 4M4.5 3.5l3 3M19.5 3.5l-3 3"/>',
    feather: '<path d="M20 3c-1.2 7-4.4 11.8-9 14.6l-3.5 2.6L5 18l2.6-3.5C10.4 9.2 15 6 20 3z"/><path d="M5 21 9 17M10 14l3 3M20 3c-4 0-8 2-11 6"/>',
    megaphone: '<path d="M3 10v4l5 1 8 5V4L8 9z"/><path d="M8 9v6M18 8a4 4 0 0 1 0 8M16 19l-2-3"/>',
    crown: '<path d="M3 8l4 3 5-6 5 6 4-3v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 20h18M6.5 16.5h.01M12 16.5h.01M17.5 16.5h.01"/>',
    dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none"/>',
    ranking: '<path d="M4 20v-6h4v6M10 20V9h4v11M16 20v-8h4v8M3 20h18"/><path d="m12 2 1 2.2 2.4.3-1.8 1.7.5 2.4L12 7.4 9.9 8.6l.5-2.4L8.6 4.5 11 4.2z"/>',
    vibrate: '<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4.5 9v6M2.5 11v2M19.5 9v6M21.5 11v2M12 16.6h.01"/>',
    cursor: '<path d="m4 3 6.7 17 2.5-6.6L20 10.8z"/><path d="m12.8 12.8 5.2 5.2"/>',
    sidebar: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M13 9h4M13 13h4"/>',
    note: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h4M9 12h7M9 16h5"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="m12 7 1.5 2.9 3.2.5-2.3 2.2.5 3.1-2.9-1.5-2.9 1.5.5-3.1-2.3-2.2 3.2-.5z"/>',
    banner: '<path d="M5 3h14v14l-7-3-7 3z"/><path d="M9 7h6M9 10h4"/>',
    'star-outline': '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-3-5.5 3 1-6.2L3 9.6l6.2-.9z"/>'
  };

  const extra = {
    /* forest */
    't-forest-home': '<path d="M3 11.5 12 4l9 7.5"/><path d="M6 10v9h12v-9M10 19v-5h4v5"/><path d="M3.5 4.5c2.5 0 4 1.3 4 3.5-2.5 0-4-1.2-4-3.5zM20.5 4.5c-2.5 0-4 1.3-4 3.5 2.5 0 4-1.2 4-3.5z"/>',
    't-forest-books': '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M12 6c2.8-1.6 5.2-1.2 6.5 0-2.8 1.6-5.2 1.2-6.5 0z"/>',
    't-forest-arena': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><path d="M15.5 6.5c1.5 1.6 1.8 3.4.8 4.6-1.2-1.3-1.4-3-.8-4.6z"/>',
    't-forest-profile': '<ellipse cx="7" cy="8.5" rx="1.8" ry="2.4"/><ellipse cx="12" cy="6.6" rx="1.8" ry="2.5"/><ellipse cx="17" cy="8.5" rx="1.8" ry="2.4"/><path d="M12 11c-2.8 0-5 2.5-5 4.6 0 2.2 2.4 3.4 5 3.4s5-1.2 5-3.4C17 13.5 14.8 11 12 11z"/>',
    't-forest-settings': '<circle cx="12" cy="12" r="3"/><path d="M19 13.4a7.4 7.4 0 0 0 0-2.8l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2.4-1.4L13.8 2h-3.6l-.4 2.6A7.4 7.4 0 0 0 7.4 6L5 5 3 8.4l2 1.6a7.4 7.4 0 0 0 0 2.8l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2.4 1.4l.4 2.6h3.6l.4-2.6a7.4 7.4 0 0 0 2.4-1.4l2.4 1 2-3.4z"/><path d="M12 3c-1.5 1.5-1.7 3.1-.8 4.4 1.4-.9 1.7-2.5.8-4.4z"/>',
    't-forest-volume': '<path d="M4 15c3.2-2.2 5.6-2.2 8 0 1.6 1.5 3.6 1.7 6 .4"/><path d="M8 11.5c2.8-1.6 4.8-1.5 6.6 0M16 8.2c2.6-.9 4.5-.5 6 .7"/><circle cx="7" cy="17" r="1.6"/>',
    't-forest-music': '<path d="M9 18V7l10-2v10"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="15" r="3"/><path d="M9 7c3 1.5 6 1.5 9 0"/>',
    't-forest-xp': '<path d="M12 3c4 0 7 2.7 7 6.5 0 3.2-2.2 5.5-4 8.5H9c-1.8-3-4-5.3-4-8.5C5 5.7 8 3 12 3z"/><path d="M9 18h6M10 21h4M9 9c1-1.4 2-1.4 3 0s2 1.4 3 0"/>',
    't-forest-star': '<path d="M12 3c.9 4.5 2.5 6 7 7-4.5 1-6.1 2.5-7 7-.9-4.5-2.5-6-7-7 4.5-1 6.1-2.5 7-7z"/>',
    't-forest-sparkle': '<circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M17.7 6.3l-2.1 2.1M8.4 15.6l-2.1 2.1"/>',

    /* ocean */
    't-ocean-home': '<path d="M12 3C7 6 4.5 11 5.5 16c.6 3 3 5 6.5 5s5.9-2 6.5-5c1-5-1.5-10-6.5-13z"/><path d="M12 21V9M12 13l-4-3M12 16l4-3M12 9l-2.5-2"/>',
    't-ocean-books': '<path d="M3 6c3-1.7 6-1.4 9 .7V21c-3-2.1-6-2.4-9-.7zM21 6c-3-1.7-6-1.4-9 .7V21c3-2.1 6-2.4 9-.7z"/>',
    't-ocean-arena': '<path d="M3 12c3-4.4 8.5-5 12.5-1.5L20 7v10l-4.5-3.5C11.5 17 6 16.3 3 12z"/><circle cx="8" cy="11.2" r=".9" fill="currentColor" stroke="none"/>',
    't-ocean-profile': '<path d="M4 9c2.5-2 5.5-3 8-3s5.5 1 8 3"/><path d="M5 9c0 6.5 3 11 7 11s7-4.5 7-11"/><path d="M9 13h.01M15 13h.01M12 16c-1.2 1.4-1.2 2.6 0 4"/>',
    't-ocean-settings': '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/><path d="M12 2c2.5 3 2.5 5.5 0 8.5-2.5-3-2.5-5.5 0-8.5z"/>',
    't-ocean-volume': '<path d="M2 12c1.6-2.4 3.2-2.4 4.8 0s3.2 2.4 4.8 0 3.2-2.4 4.8 0 3.2 2.4 4.8 0M2 17c1.6-2.4 3.2-2.4 4.8 0s3.2 2.4 4.8 0 3.2-2.4 4.8 0 3.2 2.4 4.8 0"/>',
    't-ocean-music': '<circle cx="12" cy="12" r="8"/><circle cx="15" cy="9" r="1"/><circle cx="10" cy="14" r="1"/><path d="M15 9v5.5a3 3 0 0 1-5 2M15 9 10 14"/>',
    't-ocean-xp': '<circle cx="12" cy="12" r="8"/><circle cx="9" cy="10" r="1.2" fill="currentColor" stroke="none"/><circle cx="13.5" cy="8.5" r=".8" fill="currentColor" stroke="none"/><path d="M8 15c2.5 1.5 5.5 1.5 8 0"/>',
    't-ocean-star': '<path d="M12 3l2.3 5.6 5.7.4-4.4 3.8 1.4 5.9L12 15.5l-5 3.2 1.4-5.9-4.4-3.8 5.7-.4z"/>',
    't-ocean-sparkle': '<circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="6" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="17" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="18" cy="16" r=".9" fill="currentColor" stroke="none"/><circle cx="5" cy="17" r="1.1" fill="currentColor" stroke="none"/>',

    /* candy */
    't-candy-home': '<path d="M6 11c0-3.3 2.7-6 6-6s6 2.7 6 6v6H6z"/><path d="M6 12c-2 0-3 1-3 2.5S4 17 6 17v-5M18 12c2 0 3 1 3 2.5S20 17 18 17v-5"/><path d="M9 17v3M15 17v3M9 9c1-1 2-1 3 0s2 1 3 0"/>',
    't-candy-books': '<path d="M12 20.3 4.6 13a4.7 4.7 0 0 1 6.6-6.6l.8.8.8-.8A4.7 4.7 0 0 1 19.4 13z"/><path d="M8 8.5h8M8 11h8M8 13.5h5"/>',
    't-candy-arena': '<path d="M12 12 4 7.5V5l6 3M12 12l8-4.5V5l-6 3M12 12 4 16.5V19l6-3M12 12l8 4.5V19l-6-3"/><circle cx="12" cy="12" r="1.6"/>',
    't-candy-profile': '<circle cx="8" cy="8.5" r="2.3"/><circle cx="16" cy="8.5" r="2.3"/><circle cx="12" cy="12.5" r="4.8"/><path d="M9.7 12h.01M14.3 12h.01M10.5 14.5c1 1 2 1 3 0"/>',
    't-candy-settings': '<circle cx="12" cy="13" r="3.2"/><path d="M12 4v3M12 19v2M4.5 7.5 7 9.2M17 16.8l2.5 1.7M3 15l3-1M18 10l3-1M7 17l-2.5 1.7"/>',
    't-candy-volume': '<path d="M12 20.3 4.6 13a4.7 4.7 0 0 1 6.6-6.6l.8.8.8-.8A4.7 4.7 0 0 1 19.4 13z"/><path d="M9 10.5c1.5-.8 3-.8 4.5 0"/>',
    't-candy-music': '<path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/><path d="M12 8.5c1.5 1 3 1 4.5 0"/>',
    't-candy-xp': '<path d="M12 20.3 4.6 13a4.7 4.7 0 0 1 6.6-6.6l.8.8.8-.8A4.7 4.7 0 0 1 19.4 13z"/><path d="M12 8v6M9 11h6"/>',
    't-candy-star': '<path d="M12 20.3 4.6 13a4.7 4.7 0 0 1 6.6-6.6l.8.8.8-.8A4.7 4.7 0 0 1 19.4 13z"/>',
    't-candy-sparkle': '<path d="M12 3c.7 4.8 1.8 6.2 6.5 7-4.7.8-5.8 2.2-6.5 7-.7-4.8-1.8-6.2-6.5-7 4.7-.8 5.8-2.2 6.5-7z"/><circle cx="6" cy="17" r="1.4"/><circle cx="18" cy="18" r="1"/>',

    /* red */
    't-red-home': '<path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z"/><path d="M7.5 10.5 12 8l4.5 2.5V16L12 18.5 7.5 16z"/>',
    't-red-books': '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 4v16M8 9h8M8 13h8M8 17h5"/>',
    't-red-arena': '<circle cx="12" cy="12" r="8"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6"/><circle cx="12" cy="12" r="2.4"/>',
    't-red-profile': '<path d="M4.5 13a7.5 7.5 0 0 1 15 0v3.5a3 3 0 0 1-3 3H7.5a3 3 0 0 1-3-3z"/><path d="M4.5 13h15M8 13V9.5M16 13V9.5M9 19.5 8 21M15 19.5l1 1.5"/>',
    't-red-settings': '<path d="M12 2.8 19.5 7v10L12 21.2 4.5 17V7z"/><circle cx="12" cy="12" r="3.4"/><path d="M12 6v2.6M12 15.4V18M7.8 9.8l2.2 1.3M14 12.9l2.2 1.3M16.2 9.8 14 11.1M10 12.9l-2.2 1.3"/>',
    't-red-volume': '<path d="M2 12h4l2-4 3 8 3-11 3 14 2-7h3"/>',
    't-red-music': '<path d="M3 12h2l2-5 3 10 3-13 3 15 2-7h3"/>',
    't-red-xp': '<path d="M13 2 4.5 14H11l-1 8 8.5-12H12z"/>',
    't-red-star': '<path d="m12 2 2.5 7.5H22l-6 4.5 2.5 8-6.5-5-6.5 5 2.5-8-6-4.5h7.5z"/>',
    't-red-sparkle': '<path d="M12 2v8M12 14v8M2 12h8M14 12h8M5 5l5 5M14 14l5 5M19 5l-5 5M10 14l-5 5"/>',

    /* car */
    't-car-home': '<path d="M3 20V10l3-4h12l3 4v10"/><path d="M3 15h18M7 20v-4M17 20v-4M7 10h10"/><path d="M6 18h.01M18 18h.01"/>',
    't-car-books': '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><circle cx="11" cy="11" r="2.6"/><path d="M11 8.4V11l1.8 1.2"/>',
    't-car-arena': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.4"/><path d="M12 9.6V3M9.9 12.8 4.5 16.6M14.1 12.8l5.4 3.8"/>',
    't-car-profile': '<path d="M4.5 13a7.5 7.5 0 0 1 15 0v3.5a3 3 0 0 1-3 3H7.5a3 3 0 0 1-3-3z"/><path d="M4.5 13h15M8 13V9.5M16 13V9.5M9 19.5 8 21M15 19.5l1 1.5"/>',
    't-car-settings': '<circle cx="12" cy="12" r="3.2"/><path d="M19 13.4a7.4 7.4 0 0 0 0-2.8l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2.4-1.4L13.8 2h-3.6l-.4 2.6A7.4 7.4 0 0 0 7.4 6L5 5 3 8.4l2 1.6a7.4 7.4 0 0 0 0 2.8l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2.4 1.4l.4 2.6h3.6l.4-2.6a7.4 7.4 0 0 0 2.4-1.4l2.4 1 2-3.4z"/>',
    't-car-volume': '<path d="M4 14c0-3 2-5 5-5s4 2 4 2 1-2 4-2 3 1 3 3-2 4-7 6c-5-2-9-2-9-4z"/><path d="M6 9 5 6M15 9l1-3"/>',
    't-car-music': '<rect x="3" y="8" width="18" height="11" rx="2"/><circle cx="8" cy="12.5" r="1.2"/><circle cx="13" cy="12.5" r="1.2"/><path d="M6 16h8M7 5c1.5-2 3.5-2 5 0s3.5 2 5 0"/>',
    't-car-xp': '<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 17 4-5"/><path d="M2 17h4M18 17h4M12 5v2"/>',
    't-car-star': '<path d="M4 20V9l2-4h2l1 4h6l1-4h2l2 4v11z"/><path d="M4 20h16M8 13h.01M16 13h.01M10 17h4"/>',
    't-car-sparkle': '<path d="M5 3v4M3 5h4M19 16v5M16.5 18.5h5M12 8l1.4 3.6L17 13l-3.6 1.4L12 18l-1.4-3.6L7 13l3.6-1.4z"/>',

    /* astronaut */
    't-astronaut-home': '<path d="M4 20V12a8 8 0 0 1 16 0v8z"/><path d="M3 20h18M9 20v-5a3 3 0 0 1 6 0v5"/><path d="M16 5l1-2M19 8l2-1M5 8 3 7"/>',
    't-astronaut-books': '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M8 7h8M8 10h5"/><circle cx="15" cy="15" r="2"/><path d="M15 13v-2"/>',
    't-astronaut-arena': '<path d="M14.5 4.5c3 1 4 2 5 5-2 4-5.5 7-9 8.5l-4-4C8 10.5 11 7 14.5 4.5z"/><circle cx="14.8" cy="9.2" r="1.6"/><path d="M7.5 13.5 4 14l1.5-3M10.5 16.5 10 20l3-1.5M5 19l2-2"/>',
    't-astronaut-profile': '<path d="M7 9a5 5 0 0 1 10 0v4a5 5 0 0 1-10 0z"/><path d="M9 9h6M9 12h6"/><path d="M5 8a7 7 0 0 1 14 0v7a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4zM9 19l-1 2M15 19l1 2"/>',
    't-astronaut-settings': '<circle cx="12" cy="12" r="2.4"/><path d="M8.5 6 6 3.5M15.5 6 18 3.5M6 12H2M22 12h-4M8 17l-3 3M16 17l3 3"/><path d="M8.5 12a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0zM5 12h3M16 12h3"/>',
    't-astronaut-volume': '<circle cx="12" cy="12" r="2"/><path d="M8 16a6 6 0 0 1 0-8M16 8a6 6 0 0 1 0 8M5 19a10 10 0 0 1 0-14M19 5a10 10 0 0 1 0 14"/>',
    't-astronaut-music': '<circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="9" ry="3" transform="rotate(-20 12 12)"/><path d="M19 4v5l-4 1"/>',
    't-astronaut-xp': '<path d="m12 2 2.7 6.3 6.8.6-5.2 4.5 1.6 6.6L12 16.5 6.1 20l1.6-6.6L2.5 8.9l6.8-.6z"/>',
    't-astronaut-star': '<path d="M12 2c.8 4.5 2.3 6 6.8 6.8C14.3 9.6 12.8 11 12 15.5 11.2 11 9.7 9.6 5.2 8.8 9.7 8 11.2 6.5 12 2z"/><path d="M18 16c.3 1.8.8 2.3 2.5 2.5-1.7.2-2.2.7-2.5 2.5-.3-1.8-.8-2.3-2.5-2.5 1.7-.2 2.2-.7 2.5-2.5z"/>',
    't-astronaut-sparkle': '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/>',

    /* paper */
    't-paper-home': '<path d="M3 20V9.5L12 3l9 6.5V20"/><path d="M3 20h18"/><path d="M7 10h10M7 13.5h7M7 17h4"/>',
    't-paper-books': '<path d="M4 4.5h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v13h-6a3 3 0 0 0-2 1 3 3 0 0 0-2-1H4z"/><path d="M12 5.5v13"/><path d="M7 8.5h2M7 11.5h2M15 8.5h2M15 11.5h2"/>',
    't-paper-arena': '<path d="m14 3 7 7-3 3-7-7z"/><path d="m10 10-7 7 4 4 7-7"/><path d="m6 6 4 4M14 14l4 4"/><path d="m3 21 1-3M21 3l-3 1"/>',
    't-paper-profile': '<circle cx="12" cy="8" r="4"/><path d="M4.5 20c.7-3.6 3.7-6 7.5-6s6.8 2.4 7.5 6"/><path d="M12 4v-.5M19 4l1-1M5 4 4 3"/>',
    't-paper-settings': '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
    't-paper-volume': '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
    't-paper-music': '<path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    't-paper-xp': '<path d="m12 2 2.6 6.4 6.9.5-5.3 4.5 1.7 6.7L12 16.4 6.1 20l1.7-6.7L2.5 8.9l6.9-.5z"/><path d="M9.5 12.2 11 13.8l3.8-3.8"/>',
    't-paper-star': '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8z"/>',
    't-paper-sparkle': '<path d="M12 3v5M12 16v5M3 12h5M16 12h5"/><path d="m6 6 2.5 2.5M18 18l-2.5-2.5M18 6l-2.5 2.5M6 18l2.5-2.5"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>'
  };

  const themeMap = {
    forest: { home: 't-forest-home', books: 't-forest-books', book: 't-forest-books', arena: 't-forest-arena', gamepad: 't-forest-arena', profile: 't-forest-profile', user: 't-forest-profile', settings: 't-forest-settings', volume: 't-forest-volume', 'volume-up': 't-forest-volume', music: 't-forest-music', xp: 't-forest-xp', star: 't-forest-star', sparkle: 't-forest-sparkle', sparkles: 't-forest-sparkle' },
    ocean: { home: 't-ocean-home', books: 't-ocean-books', book: 't-ocean-books', arena: 't-ocean-arena', gamepad: 't-ocean-arena', profile: 't-ocean-profile', user: 't-ocean-profile', settings: 't-ocean-settings', volume: 't-ocean-volume', 'volume-up': 't-ocean-volume', music: 't-ocean-music', xp: 't-ocean-xp', star: 't-ocean-star', sparkle: 't-ocean-sparkle', sparkles: 't-ocean-sparkle' },
    candy: { home: 't-candy-home', books: 't-candy-books', book: 't-candy-books', arena: 't-candy-arena', gamepad: 't-candy-arena', profile: 't-candy-profile', user: 't-candy-profile', settings: 't-candy-settings', volume: 't-candy-volume', 'volume-up': 't-candy-volume', music: 't-candy-music', xp: 't-candy-xp', star: 't-candy-star', sparkle: 't-candy-sparkle', sparkles: 't-candy-sparkle' },
    red: { home: 't-red-home', books: 't-red-books', book: 't-red-books', arena: 't-red-arena', gamepad: 't-red-arena', profile: 't-red-profile', user: 't-red-profile', settings: 't-red-settings', volume: 't-red-volume', 'volume-up': 't-red-volume', music: 't-red-music', xp: 't-red-xp', star: 't-red-star', sparkle: 't-red-sparkle', sparkles: 't-red-sparkle' },
    car: { home: 't-car-home', books: 't-car-books', book: 't-car-books', arena: 't-car-arena', gamepad: 't-car-arena', profile: 't-car-profile', user: 't-car-profile', settings: 't-car-settings', volume: 't-car-volume', 'volume-up': 't-car-volume', music: 't-car-music', xp: 't-car-xp', star: 't-car-star', sparkle: 't-car-sparkle', sparkles: 't-car-sparkle' },
    astronaut: { home: 't-astronaut-home', books: 't-astronaut-books', book: 't-astronaut-books', arena: 't-astronaut-arena', gamepad: 't-astronaut-arena', profile: 't-astronaut-profile', user: 't-astronaut-profile', settings: 't-astronaut-settings', volume: 't-astronaut-volume', 'volume-up': 't-astronaut-volume', music: 't-astronaut-music', xp: 't-astronaut-xp', star: 't-astronaut-star', sparkle: 't-astronaut-sparkle', sparkles: 't-astronaut-sparkle' },
    paper: { home: 't-paper-home', books: 't-paper-books', book: 't-paper-books', arena: 't-paper-arena', gamepad: 't-paper-arena', profile: 't-paper-profile', user: 't-paper-profile', settings: 't-paper-settings', volume: 't-paper-volume', 'volume-up': 't-paper-volume', music: 't-paper-music', xp: 't-paper-xp', star: 't-paper-star', sparkle: 't-paper-sparkle', sparkles: 't-paper-sparkle' }
  };

    /* Koreksi optik hasil pengukuran getBBox: tiap glyph digeser atau
     diperkecil secukupnya agar tintanya tepat di tengah grid 24. */
  const nudge = {
    'alien': 'translate(0 0.5)',
    'banner': 'translate(0 2)',
    'bell': 'translate(0 0.75)',
    'bolt': 'translate(0.5 0)',
    'car': 'translate(0 -1.75)',
    'cat': 'translate(0 0.5)',
    'chevron-down': 'translate(0 -0.5)',
    'chevron-left': 'translate(1 0)',
    'chevron-right': 'translate(-1 0)',
    'chevron-up': 'translate(0 0.5)',
    'crown': 'translate(0 -0.5)',
    'cursor': 'translate(0 0.5)',
    'detective': 'translate(-0.5 -0.5)',
    'download': 'translate(0 0.5)',
    'edit': 'translate(0.5 -0.5)',
    'feather': 'translate(-0.5 0)',
    'fish': 'translate(0.5 0)',
    'flag': 'translate(1.5 -0.5)',
    'flame': 'translate(-0.75 -0.25)',
    'heart': 'translate(0 -0.85)',
    'key': 'translate(0 1)',
    'layers': 'translate(0 -0.75)',
    'list-check': 'translate(-0.5 -0.25)',
    'live': 'translate(0.33 0.33) scale(0.972)',
    'megaphone': 'translate(-0.5 0)',
    'music': 'translate(0.5 0)',
    'note': 'translate(-0.5 0)',
    'paw': 'translate(0 0.45)',
    'phone-call': 'translate(1.01 0.99)',
    'pin': 'translate(1 -1)',
    'planet': 'translate(0.91 0.91) scale(0.924)',
    'puzzle': 'translate(0.5 0)',
    'ranking': 'translate(0 1)',
    'refresh': 'translate(0 0.62)',
    'restart': 'translate(0 0.62)',
    'rotate-ccw': 'translate(0 0.62)',
    'school': 'translate(0 0.5)',
    'scroll': 'translate(-1.5 0)',
    'search': 'translate(-0.75 -0.75)',
    'settings': 'translate(0 0.6)',
    'sparkle': 'translate(-1.25 0.25)',
    'sparkles': 'translate(-1.25 0.25)',
    'swords': 'translate(0 0.75)',
    't-astronaut-home': 'translate(0 0.5)',
    't-astronaut-music': 'translate(0 1.05)',
    't-astronaut-profile': 'translate(0 1)',
    't-astronaut-star': 'translate(-0.85 0.5)',
    't-astronaut-xp': 'translate(0 1)',
    't-candy-books': 'translate(0 -0.85)',
    't-candy-home': 'translate(0 -0.5)',
    't-candy-music': 'translate(1 -0.5)',
    't-candy-settings': 'translate(0 -0.5)',
    't-candy-sparkle': 'translate(0.2 1)',
    't-candy-star': 'translate(0 -0.85)',
    't-candy-volume': 'translate(0 -0.85)',
    't-candy-xp': 'translate(0 -0.85)',
    't-car-home': 'translate(0 -1)',
    't-car-music': 'translate(0 0.75)',
    't-car-profile': 'translate(0 -1.25)',
    't-car-settings': 'translate(0 0.6)',
    't-car-star': 'translate(0 -0.5)',
    't-car-xp': 'translate(0 1)',
    't-forest-home': 'translate(0 0.5)',
    't-forest-music': 'translate(1 -1)',
    't-forest-profile': 'translate(0 0.45)',
    't-forest-settings': 'translate(0 0.6)',
    't-forest-star': 'translate(0 2)',
    't-forest-volume': 'translate(-1 -1.15)',
    't-ocean-arena': 'translate(0.5 0)',
    't-ocean-books': 'translate(0 -0.95)',
    't-ocean-profile': 'translate(0 -1)',
    't-ocean-sparkle': 'translate(0.6 0.55)',
    't-ocean-star': 'translate(0 1.15)',
    't-ocean-volume': 'translate(0.4 -2.2)',
    't-paper-books': 'translate(0 0.5)',
    't-paper-home': 'translate(0 0.5)',
    't-paper-music': 'translate(0.5 0.25)',
    't-paper-profile': 'translate(0 0.5)',
    't-paper-star': 'translate(0 0.6)',
    't-paper-volume': 'translate(-0.85 0)',
    't-paper-xp': 'translate(0 0.95)',
    't-red-music': 'translate(0 0.5)',
    't-red-profile': 'translate(0 -1.25)',
    't-red-xp': 'translate(0.5 0)',
    'trophy': 'translate(0 -0.5)',
    'warning': 'translate(0 0.5)',
    'wrench': 'translate(-0.54 0.54)',
    'zap': 'translate(0.5 0)',
  };

  const all = Object.assign({}, base, extra);

  function symbol(id, inner) {
    const fix = nudge[id];
    const body = fix ? '<g transform="' + fix + '">' + inner + '</g>' : inner;
    return '<symbol id="i-' + id + '" viewBox="0 0 24 24">' + body + '</symbol>';
  }

  function mountSprite() {
    if (document.getElementById('neko-icon-sprite')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'neko-icon-sprite';
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.style.overflow = 'hidden';
    svg.innerHTML = '<defs>' + Object.keys(all).map(id => symbol(id, all[id])).join('') + '</defs>';
    document.body.prepend(svg);
  }

  function resolve(name) {
    const theme = document.documentElement.dataset.theme || 'paper';
    const map = themeMap[theme];
    return (map && map[name]) || name;
  }

  function icon(name, className) {
    const id = resolve(name);
    const cls = 'ic' + (className ? ' ' + className : '');
    const exists = all[id] || all[name];
    const finalId = all[id] ? id : (all[name] ? name : 'dot');
    return '<svg class="' + cls + '" aria-hidden="true" focusable="false"><use href="#i-' + finalId + '"></use></svg>';
  }

  function hydrate(scope = document) {
    scope.querySelectorAll('[data-icon]').forEach(node => {
      const name = node.getAttribute('data-icon');
      if (!name) return;
      const span = document.createElement('span');
      span.innerHTML = icon(name);
      const svg = span.firstChild;
      node.replaceWith(svg);
    });
  }

  Neko.icons = { icon, hydrate, mountSprite, has: name => Boolean(all[name]), themeMap };
  mountSprite();
})();
