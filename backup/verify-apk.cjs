const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const root = 'C:/Users/HP/Downloads/Neko Fix';
const apk = root + '/android-online/app/build/outputs/apk/debug/NEKO-online-3.0.43-debug-test.apk';
const bytes = fs.readFileSync(apk);
let end = bytes.length - 22;
while (end >= Math.max(0, bytes.length - 65557) && bytes.readUInt32LE(end) !== 0x06054b50) end--;
if (end < 0) throw Error('ZIP central directory not found');
const count = bytes.readUInt16LE(end + 10);
let offset = bytes.readUInt32LE(end + 16);
const entries = new Map();
for (let i = 0; i < count; i++) {
  if (bytes.readUInt32LE(offset) !== 0x02014b50) throw Error('Bad central directory');
  const method = bytes.readUInt16LE(offset + 10), size = bytes.readUInt32LE(offset + 20);
  const nameLength = bytes.readUInt16LE(offset + 28), extraLength = bytes.readUInt16LE(offset + 30), commentLength = bytes.readUInt16LE(offset + 32);
  const local = bytes.readUInt32LE(offset + 42);
  const name = bytes.toString('utf8', offset + 46, offset + 46 + nameLength);
  const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
  const compressed = bytes.subarray(start, start + size);
  if (method !== 0 && method !== 8) throw Error('Unsupported compression');
  entries.set(name, method === 0 ? compressed : zlib.inflateRawSync(compressed));
  offset += 46 + nameLength + extraLength + commentLength;
}
const assets = [...entries.keys()].filter(n => n.startsWith('assets/neko/') && !n.endsWith('/'));
const mismatches = assets.filter(n => {
  const source = path.join(root, n.slice('assets/neko/'.length));
  return !fs.existsSync(source) || !entries.get(n).equals(fs.readFileSync(source));
});
const unexpected = assets.filter(n => !/^assets\/neko\/(?:index\.html$|favicon\.svg$|manifest\.webmanifest$|(?:css|js|data|assets|public\/icons)\/)/.test(n));
const suspectedSecrets = assets.filter(n => /sb_secret_[A-Za-z0-9_-]{12,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][A-Za-z0-9_.-]{20,}/.test(entries.get(n).toString('utf8')));
const html = entries.get('assets/neko/index.html').toString('utf8');
const refs = [...html.matchAll(/(?:src|href)="\.\/([^"?#]+)/g)].map(m => m[1]);
const missing = refs.filter(n => !entries.has('assets/neko/' + n));
const lint = fs.readFileSync(root + '/android-online/app/build/reports/lint-results-debug.xml', 'utf8');
const result = {
  version: JSON.parse(fs.readFileSync(root + '/package.json', 'utf8')).version,
  bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  assets: assets.length, mismatches, unexpected, suspectedSecrets, missingHtmlReferences: missing,
  lintErrors: (lint.match(/severity="Error"/g) || []).length,
  lintWarnings: (lint.match(/severity="Warning"/g) || []).length
};
console.log(JSON.stringify(result, null, 2));
fs.writeFileSync(root + '/backup/apk-validation.json', JSON.stringify(result, null, 2));
if (mismatches.length || unexpected.length || suspectedSecrets.length || missing.length || result.lintErrors) process.exitCode = 1;
