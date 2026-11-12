const https = require('https');
const t0 = Date.now();
const req = https.get({
  host: 'www.youtube.com',
  path: '/results?search_query=lofi&hl=id&gl=ID&bpctr=9999999999&has_verified=1',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept-Language': 'id-ID,id;q=0.9',
    'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+419; SOCS=CAI'
  }
}, res => {
  console.log('STATUS', res.statusCode, 'loc', res.headers.location || '-', 'at', Date.now() - t0, 'ms');
  let html = '';
  res.setEncoding('utf8');
  res.on('data', c => { html += c; });
  res.on('end', () => {
    console.log('END len', html.length, 'at', Date.now() - t0, 'ms');
    console.log('idx ytInitialData =', html.indexOf('ytInitialData = '));
    console.log('idx var ytInitialData', html.indexOf('var ytInitialData'));
    console.log('idx videoRenderer', html.indexOf('videoRenderer'));
    console.log('consent/captcha?', /consent|before you continue|CAPTCHA|unusual traffic/i.test(html.slice(0, 5000)));
  });
});
req.on('error', e => console.log('ERR', e.message, 'at', Date.now() - t0));
setTimeout(() => { console.log('HARD DEADLINE 10s'); req.destroy(); process.exit(0); }, 10000);