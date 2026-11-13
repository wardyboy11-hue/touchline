/* Pre-match Spotify. Canonical links only. No pt or si. No load until a tap. */
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const PORT = +process.env.PORT || 8848;
const SHOTS = process.env.SHOTS || require('path').join(require('os').tmpdir(),'touchline-shots');
const OPEN = 'https://open.spotify.com/playlist/37i9dQZF1Fx1qy2m6cIsqW';
const EMBED = 'https://open.spotify.com/embed/playlist/37i9dQZF1Fx1qy2m6cIsqW';
fs.mkdirSync(SHOTS, { recursive: true });
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/version.json') { r.writeHead(200, { 'content-type': 'application/json' }); r.end(JSON.stringify({v:(require('fs').readFileSync(require('path').join(__dirname,'../../update.js'),'utf8').match(/RUN='(\d+)'/)||[])[1]})); return; }
  let f = path.join(root, u);
  if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); r.end(); return; }
    const mt = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
    r.writeHead(200, { 'content-type': mt[path.extname(f)] || 'application/octet-stream' });
    r.end(d);
  });
}).listen(PORT);
const fam = (role) => ({ first: 'Pat', role: role, num: '7', mine: {}, at: Date.now(), posts: [], vote: { motm: { open: false }, poty: { open: false } }, x: { fixtures: [{ id: 'fx1', opp: 'Rivals Athletic', date: '2026-11-14', ko: '10:30', ha: 'A', done: false }], news: [], events: [], lifts: [], media: [], contacts: [] } });
let ok = 0, bad = 0;
const T = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };
function dirty(s) { return /[?&](pt|si)=/i.test(s) || /[?&]pt\b/i.test(s); }
(async () => {
  const src = fs.readFileSync(path.join(root, 'tl-spotify.js'), 'utf8');
  T('source uses the canonical open link', src.indexOf(OPEN) >= 0 && !dirty(src));
  T('source uses the canonical embed link', src.indexOf(EMBED) >= 0);
  const b = await chromium.launch();
  const phone = devices['Pixel 7'];
  {
    const ctx = await b.newContext({ ...phone, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    const errs = [];
    const hits = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load/.test(m.text())) errs.push(m.text()); });
    p.on('request', req => { if (/spotify\.com/i.test(req.url())) hits.push(req.url()); });
    await p.addInitScript(() => { localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code', 'p'); localStorage.setItem('fam.ok1', '1'); localStorage.setItem('fam.wel.P', '1'); localStorage.setItem('fam.tour', '1'); });
    await p.route('**/macros/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, data: fam('parent') }) }));
    await p.goto('http://localhost:' + PORT + '/parents.html');
    await p.waitForTimeout(1400);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); try { r(); } catch (e) {} });
    await p.locator('nav.tabs button', { hasText: 'Calendar' }).click(); // r113: the Fixtures shortcut became the Calendar tab
    await p.waitForSelector('#tl-spotify-title');
    T('accessible title', (await p.locator('#tl-spotify-title').innerText()) === 'Pre-match music');
    const openHref = await p.locator('#tl-spotify-open').getAttribute('href');
    T('open link is canonical', openHref === OPEN);
    T('no player before the tap', await p.locator('#tl-spotify-slot iframe').count() === 0 && hits.length === 0);
    await p.screenshot({ path: path.join(SHOTS, 'r106-spotify.png') });
    await p.locator('#tl-spotify-load').click();
    await p.waitForSelector('#tl-spotify-slot iframe');
    const frame = await p.locator('#tl-spotify-slot iframe').evaluate(el => ({
      src: el.getAttribute('src'), title: el.getAttribute('title'), w: el.getAttribute('width'), h: el.getAttribute('height'),
      allow: el.getAttribute('allow'), loading: el.getAttribute('loading'), radius: el.style.borderRadius, cssW: getComputedStyle(el).width
    }));
    T('embed src is canonical', frame.src === EMBED && !dirty(frame.src));
    T('embed size and lazy load', frame.w === '100%' && frame.h === '352' && frame.loading === 'lazy' && frame.radius === '12px');
    T('no autoplay permission', frame.allow === 'encrypted-media' && frame.title === 'Spotify playlist');
    T('player fits the phone width', parseFloat(frame.cssW) > 200 && parseFloat(frame.cssW) <= 412);
    const desk = await b.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
    const d = await desk.newPage();
    await d.addInitScript(() => { localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code', 'p'); localStorage.setItem('fam.ok1', '1'); localStorage.setItem('fam.wel.P', '1'); localStorage.setItem('fam.tour', '1'); });
    await d.route('**/macros/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, data: fam('player') }) }));
    await d.goto('http://localhost:' + PORT + '/family.html');
    await d.waitForTimeout(1200);
    await d.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); try { goTab('games'); } catch (e) {} });
    await d.waitForSelector('#tl-spotify');
    await d.locator('#tl-spotify-load').click();
    await d.waitForSelector('#tl-spotify-slot iframe');
    const wide = await d.locator('#tl-spotify-slot iframe').evaluate(el => parseFloat(getComputedStyle(el).width));
    T('player matchday has the player and it stays within the column', wide > 300 && wide <= 960);
    await desk.close();
    T('spotify card zero console errors', errs.length === 0);
    if (errs.length) console.log(errs);
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ ...phone, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    await p.addInitScript(() => {
      localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code', 'p'); localStorage.setItem('fam.ok1', '1'); localStorage.setItem('fam.wel.P', '1'); localStorage.setItem('fam.tour', '1');
      try { Object.defineProperty(navigator, 'onLine', { get: function () { return false; } }); } catch (e) {}
    });
    await p.route('**/macros/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, data: fam('parent') }) }));
    await p.goto('http://localhost:' + PORT + '/parents.html');
    await p.waitForTimeout(1200);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); try { goTab('games'); } catch (e) {} });
    await p.waitForSelector('#tl-spotify-open');
    await p.locator('#tl-spotify-load').click();
    const note = await p.locator('#tl-spotify-note').innerText();
    T('offline keeps the open button and refuses the player', (await p.locator('#tl-spotify-open').getAttribute('href')) === OPEN && /unavailable|offline/i.test(note) && await p.locator('#tl-spotify-slot iframe').count() === 0);
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ viewport: { width: 1100, height: 800 }, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { localStorage.setItem('tl.code', 'coach-test'); localStorage.setItem('tl.who', 'Tim'); localStorage.setItem('tl.state.v1', JSON.stringify({ ideas: {}, players: {}, matches: {}, settings: { id: 'main', half: 35, subEvery: 17, roles: {}, updatedAt: 0 }, dirty: {}, lastSync: Date.now() })); });
    await p.route('**/macros/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, data: { docs: [], serverTime: Date.now(), rows: [] } }) }));
    await p.goto('http://localhost:' + PORT + '/coach/index.html');
    await p.waitForFunction(() => window.__tlTest);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); window.__tlTest(function (S, view, render) { S.matches.fx1 = { id: 'fx1', opp: 'Rivals Athletic', date: '2026-11-14', ko: '10:30', ha: 'H', comp: 'League', status: 'live', formation: '352', half: 35, avail: {}, lineup: {}, events: [], stints: {}, clock: { acc: 0, running: false, t0: 0 }, ratings: {}, notes: '', period: 1 }; view.mid = 'fx1'; render(); }); });
    await p.waitForSelector('#tl-spotify-title');
    T('coach matchday has pre-match music', (await p.locator('#tl-spotify-open').getAttribute('href')) === OPEN);
    T('coach spotify zero console errors', errs.length === 0);
    if (errs.length) console.log(errs);
    await ctx.close();
  }
  await b.close();
  srv.close();
  console.log(ok + ' passed, ' + bad + ' failed');
  process.exit(bad ? 1 : 0);
})();
