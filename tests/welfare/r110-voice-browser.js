/* Typed kit question on the live-shaped pages. Speech recognition is not claimed.
   No alert, vote, or fixture write. */
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const PORT = +process.env.PORT || 8866;
const SHOTS = process.env.SHOTS || '/opt/cursor/artifacts';
fs.mkdirSync(SHOTS, { recursive: true });
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/version.json') { r.writeHead(200, { 'content-type': 'application/json' }); r.end('{"v":"110"}'); return; }
  let f = path.join(root, u);
  if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); r.end(); return; }
    const mt = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
    r.writeHead(200, { 'content-type': mt[path.extname(f)] || 'application/octet-stream' });
    r.end(d);
  });
}).listen(PORT);
const fam = { first: 'Sam', role: 'parent', num: '7', mine: {}, at: Date.now(), posts: [{ id: 'tr1', type: 'training', date: '2026-11-11', time: '19:00', title: 'Sample session', place: 'Pitch' }], vote: { motm: { open: false }, poty: { open: false } }, x: { fixtures: [{ id: 'fx7', opp: 'Atherton Town Eagles', date: '2026-11-07', ko: '11:00', ha: 'A', venue: 'Atherton', done: false, pp: 0, kit: 'H' }], news: [], events: [], lifts: [], media: [], contacts: [] } };
let ok = 0, bad = 0;
const T = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };
(async () => {
  const b = await chromium.launch();
  const phone = { ...devices['Pixel 7'], serviceWorkers: 'block' };
  const ctx = await b.newContext(phone);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('fam.code', 'p'); localStorage.setItem('fam.ok1', '1'); localStorage.setItem('fam.wel.P', '1'); localStorage.setItem('fam.tour', '1'); });
  await p.route('**/macros/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, data: fam }) }));
  await p.goto('http://localhost:' + PORT + '/parents.html');
  await p.waitForTimeout(1600);
  await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); });
  const heard = await p.evaluate(() => ({ sr: !!(window.SpeechRecognition || window.webkitSpeechRecognition), synth: !!window.speechSynthesis }));
  console.log('BROWSER_SPEECH recognition=' + heard.sr + ' synthesis=' + heard.synth);
  await p.locator('button[aria-label="Voice helper"]').first().click();
  await p.waitForSelector('#tl-voice-in');
  await p.fill('#tl-voice-in', 'what kit is it tomorrow');
  await p.click('#tl-voice-go');
  await p.waitForTimeout(400);
  const text = await p.locator('#tl-voice-log').innerText();
  const status = await p.locator('#tl-voice-status').innerText();
  T('typed question is visible', /what kit is it tomorrow/.test(text));
  T('answer uses the saved home kit and not the away ground', /dark blue and white stripes/.test(text) && !/Away kit/.test(text));
  T('status shows the answer', /dark blue|not speaking|chosen/.test(status));
  await p.screenshot({ path: path.join(SHOTS, 'r110-voice-kit.png') });
  T('parent voice view has no JavaScript exception', errs.length === 0);
  if (errs.length) console.log(errs);
  await ctx.close();
  await b.close();
  srv.close();
  console.log(ok + ' passed, ' + bad + ' failed');
  console.log('REAL_MICROPHONE tested: no');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });