/* NEKO · api/neko.js
   Satu-satunya function Vercel untuk seluruh API. Isi sebenarnya ada di
   server/vercel-api.js; jalur asli dibaca dari permintaan (lihat rewrite
   /api/:path* di vercel.json). Jangan diedit manual kalau tidak perlu. */
'use strict';

module.exports = require('../server/vercel-api.js');
