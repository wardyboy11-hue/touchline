/* Kit display. Synthetic fixture only. No alert is sent. */
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const PORT = +process.env.PORT || 8861;
const SHOTS = process.env.SHOTS || '/opt/cursor/artifacts';
fs.mkdirSync(SHOTS, { recursive: true });
const td = new Date();
const iso = td.getFullYear() + '-' + String(td.getMonth() + 1).padStart(2, '0') + '-' + String(td.getDate()).padStart(2, '0');
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/version.json') { r.writeHead(200, { 'content-type': 'application/json' }); r.end('{"v":"109"}'); return; }
  let f = path.join(root, u);
  if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); r.end(); return; }
    const mt = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
    r.writeHead(200, { 'content-type': mt[path.extname(f)] || 'application/octet-stream' });
    r.end(d);
  });
}).listen(PORT);
function fam(kit) {
  return { first: 'Sam', role: 'parent', num: '7', mine: {}, at: Date.now(), posts: [], vote: { motm: { open: false }, poty: { open: false } }, x: { fixtures: [{ id: 'fx1', opp: 'Rivals Athletic', date: iso, ko: '10:30', ha: 'A', venue: 'Their ground', done: false, pp: 0, kit: kit }], news: [], events: [], lifts: [], media: [], contacts: [] } };
}
let ok = 0, bad = 0;
const T = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };
(async () => {
  const b = await chromium.launch();
  const phone = { ...devices['Pixel 7'], serviceWorkers: 'block' };
  {
    const ctx = await b.newContext(phone);
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { localStorage.setItem('fam.code', 'p'); localStorage.setItem('fam.ok1', '1'); localStorage.setItem('fam.wel.P', '1'); localStorage.setItem('fam.tour', '1'); });
    await p.route('**/macros/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, data: fam('') }) }));
    await p.goto('http://localhost:' + PORT + '/parents.html');
    await p.waitForTimeout(1500);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); });
    const text = await p.locator('#root').innerText();
    T('unset away game says kit to be confirmed', /Kit to be confirmed/.test(text) && !/Away kit/.test(text));
    T('family page has no kit editor', await p.locator('[data-kit-for]').count() === 0);
    await p.screenshot({ path: path.join(SHOTS, 'r109-kit-family.png') });
    T('unset kit view has no JavaScript exception', errs.length === 0);
    if (errs.length) console.log(errs);
    await ctx.close();
  }
  {
    const ctx = await b.newContext(phone);
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { localStorage.setItem('fam.code', 'p'); localStorage.setItem('fam.ok1', '1'); localStorage.setItem('fam.wel.P', '1'); localStorage.setItem('fam.tour', '1'); });
    await p.route('**/macros/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, data: fam('blue') }) }));
    await p.goto('http://localhost:' + PORT + '/family.html');
    await p.waitForTimeout(1500);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); });
    const text = await p.locator('#root').innerText();
    T('saved blue stays on an away ground', /dark blue/.test(text) && !/Away kit/.test(text));
    T('blue kit view has no JavaScript exception', errs.length === 0);
    await ctx.close();
  }
  {
    const ctx = await b.newContext(phone);
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    const state = { ideas: {}, players: {}, matches: { m1: { id: 'm1', opp: 'Rivals Athletic', date: iso, ko: '10:30', ha: 'A', kit: 'blue', venue: 'Their ground', addr: 'Their ground', comp: 'League', formation: '352', half: 35, avail: {}, lineup: {}, status: 'plan', events: [], ratings: {}, clock: { acc: 0, running: false, t0: 0 }, updatedAt: 1 } }, settings: { id: 'main', half: 35, roles: {}, updatedAt: 1 }, dirty: {}, lastSync: Date.now() };
    await p.addInitScript(s => { localStorage.setItem('tl.code', 'x'); localStorage.setItem('tl.state.v1', s); }, JSON.stringify(state));
    await p.route('**/macros/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, data: { docs: [], serverTime: Date.now(), rows: [] } }) }));
    await p.goto('http://localhost:' + PORT + '/coach/index.html#/today');
    await p.waitForTimeout(1500);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); });
    const before = await p.evaluate(() => { const raw = JSON.parse(localStorage.getItem('tl.state.v1')); return raw.matches.m1.kit; });
    T('opening the match alert leaves the saved blue kit', before === 'blue');
    const shown = await p.locator('#root').innerText();
    T('coach alert shows the blue kit and a selector', /dark blue/.test(shown) && await p.locator('[data-kit-for="m1"]').count() === 1);
    await p.locator('[data-kit-for="m1"]').selectOption('');
    await p.waitForTimeout(400);
    const cleared = await p.evaluate(() => JSON.parse(localStorage.getItem('tl.state.v1')).matches.m1.kit);
    T('an explicit clear is saved and does not become away', cleared === '' );
    const line = await p.locator('#tl-md-pin p.small').first().innerText();
    T('cleared kit is neutral on the coach screen', /Kit to be confirmed/.test(line) && !/Away kit/.test(line));
    T('coach kit view has no JavaScript exception', errs.length === 0);
    if (errs.length) console.log(errs);
    await ctx.close();
  }
  await b.close();
  srv.close();
  console.log(ok + ' passed, ' + bad + ' failed');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });