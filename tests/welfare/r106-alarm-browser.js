/* Wake-up card. Synthetic fixture. Does not create a phone alarm. */
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const PORT = +process.env.PORT || 8842;
const SHOTS = process.env.SHOTS || '/opt/cursor/artifacts';
fs.mkdirSync(SHOTS, { recursive: true });
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/version.json') { r.writeHead(200, { 'content-type': 'application/json' }); r.end('{"v":"109"}'); return; }
  let f = path.join(root, u);
  if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); r.end(); return; }
    const ext = path.extname(f);
    const mt = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
    r.writeHead(200, { 'content-type': mt[ext] || 'application/octet-stream' });
    r.end(d);
  });
}).listen(PORT);
const fam = { first: 'Pat', role: 'parent', num: '7', mine: {}, at: Date.now(), posts: [], vote: { motm: { open: false }, poty: { open: false } }, x: { fixtures: [{ id: 'fx1', opp: 'Rivals Athletic', date: '2026-11-14', ko: '10:30', ha: 'A', done: false }], news: [], events: [], lifts: [], media: [], contacts: [] } };
let ok = 0, bad = 0;
const T = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'], serviceWorkers: 'block' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load/.test(m.text())) errs.push(m.text()); });
  await p.addInitScript(() => { localStorage.setItem('fam.code', 'p'); localStorage.setItem('fam.ok1', '1'); localStorage.setItem('fam.wel.P', '1'); localStorage.setItem('fam.tour', '1'); });
  await p.route('**/macros/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, data: fam }) }));
  await p.goto('http://localhost:' + PORT + '/parents.html');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); try { r(); } catch (e) {} });
  await p.locator('.tl-q', { hasText: 'Fixtures' }).click();
  await p.waitForSelector('#tl-alarm');
  const empty = await p.locator('#tl-alarm-time').inputValue();
  const html = await p.locator('#tl-alarm').innerHTML();
  T('time starts empty', empty === '');
  T('desktop test build has no clock intent link', html.indexOf('intent:') < 0);
  T('fixture is London kick-off text', /10:30, Europe\/London/.test(await p.locator('#tl-alarm-fixture').innerText()));
  await p.locator('#tl-alarm-arm').click();
  await p.waitForTimeout(200);
  T('arm without a time does not start', /Choose a time/.test(await p.locator('#tl-alarm-status').innerText()));
  await p.screenshot({ path: path.join(SHOTS, 'r106-alarm.png') });
  T('alarm card zero console errors', errs.length === 0);
  if (errs.length) console.log(errs);
  await b.close();
  srv.close();
  console.log(ok + ' passed, ' + bad + ' failed');
  process.exit(bad ? 1 : 0);
})();
