/* r106 preview: role homes, 44px shortcuts, guide note, every listed view, no console errors. Synthetic data. */
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const PORT = +process.env.PORT || 8836;
const SHOTS = process.env.SHOTS || '/opt/cursor/artifacts';
fs.mkdirSync(SHOTS, { recursive: true });
const MT = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.webmanifest': 'application/json', '.vtt': 'text/vtt', '.webm': 'video/webm', '.mp4': 'video/mp4' };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/version.json') { r.writeHead(200, { 'content-type': 'application/json' }); r.end('{"v":"106"}'); return; }
  let f = path.join(root, u);
  if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'content-type': MT[path.extname(f)] || 'application/octet-stream' });
    r.end(d);
  });
}).listen(PORT);
const BASE = 'http://localhost:' + PORT;
let ok = 0, bad = 0;
const T = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };
const H = { 'access-control-allow-origin': '*' };
function errsOf(p) {
  const e = [];
  p.on('pageerror', x => e.push(x.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|favicon|net::ERR/.test(m.text())) e.push(m.text()); });
  return e;
}
function fam(role) {
  return { first: 'Pat', role: role, num: '7', mine: {}, at: Date.now(), photo: '', posts: [{ id: 'tr1', type: 'training', date: '2026-11-11', time: '19:00', title: 'Training', place: 'Pitch' }], squadNums: [], vote: { motm: { open: false, elig: role === 'parent', cands: [{ id: 'p9', num: '9', name: 'Alex Sample' }], mine: [] }, poty: { open: false } }, x: { fixtures: [{ id: 'fx1', opp: 'Rivals Athletic', date: '2026-11-14', ko: '10:30', ha: 'A', done: false, pp: 0, venue: 'Rivals ground' }], news: [], events: [], lifts: [], media: [], contacts: [{ n: 'Club welfare', r: 'Welfare', e: '', p: '' }] } };
}
(async () => {
  const b = await chromium.launch();
  const phone = devices['Pixel 7'];
  const desk = { viewport: { width: 1280, height: 800 } };
  async function bootFamily(page, role) {
    await page.addInitScript(() => { localStorage.setItem('fam.code', 'p'); localStorage.setItem('fam.ok1', '1'); localStorage.setItem('fam.wel.P', '1'); localStorage.setItem('fam.tour', '1'); });
    await page.route('**/macros/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ ok: true, data: fam(role) }) }));
  }
  {
    const ctx = await b.newContext({ ...phone, serviceWorkers: 'block', recordVideo: { dir: SHOTS, size: { width: 412, height: 915 } } });
    const p = await ctx.newPage();
    const E = errsOf(p);
    await bootFamily(p, 'parent');
    await p.goto(BASE + '/parents.html');
    await p.waitForTimeout(1600);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); try { r(); } catch (e) {} });
    await p.waitForSelector('.tl-q');
    const q = await p.locator('.tl-q').allInnerTexts();
    const h = await p.locator('.tl-q').first().evaluate(el => el.getBoundingClientRect().height);
    const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
    T('parent shortcuts', q.join('|') === 'Playing?|Fixtures|Emergency|Clips');
    T('parent shortcut at least 44px', h >= 44);
    T('kit navy background', bg === 'rgb(2, 25, 69)');
    await p.screenshot({ path: path.join(SHOTS, 'r106-parent-home.png') });
    await p.locator('.tl-q', { hasText: 'Fixtures' }).click();
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(SHOTS, 'r106-parent-fixtures.png') });
    T('parent home zero console errors', E.length === 0);
    if (E.length) console.log(E);
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ ...phone, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    const E = errsOf(p);
    await bootFamily(p, 'player');
    await p.goto(BASE + '/family.html');
    await p.waitForTimeout(1600);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); try { r(); } catch (e) {} });
    await p.waitForSelector('.tl-q');
    const q = await p.locator('.tl-q').allInnerTexts();
    T('player shortcuts', q.join('|') === 'Playing?|Fixtures|My page|Clips');
    await p.screenshot({ path: path.join(SHOTS, 'r106-player-home.png') });
    T('player home zero console errors', E.length === 0);
    if (E.length) console.log(E);
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ ...desk, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    const E = errsOf(p);
    await p.addInitScript(() => { localStorage.setItem('tl.code', 'coach-test'); localStorage.setItem('tl.who', 'Tim'); localStorage.setItem('tl.state.v1', JSON.stringify({ ideas: {}, players: {}, matches: {}, settings: { id: 'main', half: 35, roles: {}, updatedAt: 0 }, dirty: {}, lastSync: Date.now() })); });
    await p.route('**/macros/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ ok: true, data: { docs: [], serverTime: Date.now(), rows: [] } }) }));
    await p.goto(BASE + '/coach/index.html');
    await p.waitForTimeout(1600);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); });
    await p.screenshot({ path: path.join(SHOTS, 'r106-coach-home.png') });
    const wide = await p.evaluate(() => document.querySelector('.wrap').getBoundingClientRect().width);
    T('coach desktop uses a wider column', wide > 700);
    T('coach home zero console errors', E.length === 0);
    if (E.length) console.log(E);
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ ...phone, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    const E = errsOf(p);
    for (const url of ['guide.html', 'listen.html', 'stretch/index.html', 'shape/index.html']) {
      await p.goto(BASE + '/' + url, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(400);
      const text = await p.locator('body').innerText();
      T(url + ' renders', text.length > 20);
    }
    await p.goto(BASE + '/guide.html');
    const g = await p.locator('body').innerText();
    T('guide says films are not re-recorded', /have not been re-recorded/.test(g));
    const href = await p.locator('a[href="guide_preview_silent.webm"]').count();
    T('guide links the silent preview', href === 1);
    T('guide and other views zero console errors', E.length === 0);
    if (E.length) console.log(E);
    await ctx.close();
  }
  await b.close();
  srv.close();
  console.log(ok + ' passed, ' + bad + ' failed');
  process.exit(bad ? 1 : 0);
})();
