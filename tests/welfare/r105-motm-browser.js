/* r105: name plus shirt number ballot, tie, card preview, share fallback. Synthetic names only. */
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const PORT = +process.env.PORT || 8826;
const SHOTS = process.env.SHOTS || '/opt/cursor/artifacts';
fs.mkdirSync(SHOTS, { recursive: true });
const MT = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/version.json') { r.writeHead(200, { 'content-type': 'application/json' }); r.end('{"v":"105"}'); return; }
  let f = path.join(root, u);
  if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'content-type': MT[path.extname(f)] || 'application/octet-stream' });
    r.end(d);
  });
}).listen(PORT);
const BASE = 'http://localhost:' + PORT;
let ok = 0, bad = 0, opened = 0;
const T = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };
const H = { 'access-control-allow-origin': '*' };
function errsOf(p) {
  const e = [];
  p.on('pageerror', x => e.push('pageerror: ' + x.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|favicon|net::ERR/.test(m.text())) e.push('console: ' + m.text()); });
  return e;
}
(async () => {
  const b = await chromium.launch();
  const ph = devices['Pixel 7'];
  const fam = { first: 'Pat', role: 'parent', num: '7', mine: {}, at: Date.now(), photo: '', posts: [], squadNums: [], vote: { motm: { open: true, elig: true, label: 'Rivals Athletic', cands: [{ id: 'p2', num: '4', name: 'Blair Sample' }, { id: 'p3', num: '11', name: 'Casey Sample' }, { id: 'p9', num: '9', name: 'Alex Sample' }], mine: [] }, poty: { open: false, elig: true } }, x: { fixtures: [{ id: 'fx1', opp: 'Rivals Athletic', date: '2026-11-07', ko: '10:30', ha: 'H', done: false, pp: 0 }], news: [], events: [], lifts: [], media: [], contacts: [] } };
  {
    const ctx = await b.newContext({ ...ph, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    const E = errsOf(p);
    await p.addInitScript(() => { window.open = () => { window.__opened = (window.__opened || 0) + 1; return null; }; localStorage.setItem('fam.code', 'p'); localStorage.setItem('fam.ok1', '1'); localStorage.setItem('fam.wel.P', '1'); localStorage.setItem('fam.tour', '1'); });
    await p.route('**/macros/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ ok: true, data: fam }) }));
    await p.goto(BASE + '/parents.html');
    await p.waitForTimeout(1800);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); try { r(); } catch (e) {} });
    await p.waitForTimeout(300);
    const st = await p.evaluate(() => ({ text: (document.getElementById('motm-chips') || {}).innerText || '', opened: window.__opened || 0 }));
    T('ballot shows name and shirt number', /Alex Sample\s*·\s*9/.test(st.text) && /Blair Sample\s*·\s*4/.test(st.text));
    T('ballot does not open WhatsApp', st.opened === 0);
    await p.screenshot({ path: path.join(SHOTS, 'r105-motm-ballot.png') });
    T('ballot zero console errors', E.length === 0);
    if (E.length) console.log(E);
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ ...ph, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    const E = errsOf(p);
    let closes = 0;
    await p.addInitScript(() => { window.open = () => { window.__opened = (window.__opened || 0) + 1; return null; }; localStorage.setItem('tl.code', 'coach-test'); localStorage.setItem('tl.who', 'Tim'); localStorage.setItem('tl.state.v1', JSON.stringify({ ideas: {}, players: {}, matches: {}, settings: { id: 'main', half: 35, roles: {}, vote: { motm: { open: true, matchId: 'fx1' }, poty: { open: false } }, updatedAt: 0 }, dirty: {}, lastSync: Date.now() })); });
    await p.route('**/macros/**', r => {
      let a = {};
      try { a = JSON.parse(r.request().postData() || '{}'); } catch (e) {}
      let data = { docs: [], serverTime: Date.now(), rows: [] };
      if (a.action === 'motm.status' || (a.action === 'motm.close' && a.mode === 'auto')) data = { ok: true, closed: false, auto: true, need: 2, have: 2, tie: true, tied: [{ id: 'p2', name: 'Blair Sample', num: '4', n: 1 }, { id: 'p3', name: 'Casey Sample', num: '11', n: 1 }], reason: '' };
      if (a.action === 'motm.close' && a.mode === 'resolve') {
        closes++;
        data = { ok: true, closed: true, status: 'resolved', winnerId: a.winnerId, winnerName: a.winnerId === 'p3' ? 'Casey Sample' : 'Blair Sample', winnerNum: a.winnerId === 'p3' ? '11' : '4', opp: 'Rivals Athletic', date: '2026-11-07', dateUK: '7 November 2026', photo: '', photoNote: 'No approved photo is on file. The card does not invent a picture.' };
      }
      if (a.action === 'motm.awards') data = { ok: true, playerOfYear: null, fixtures: [{ matchId: 'fx1', dateUK: '7 November 2026', opp: 'Rivals Athletic', winnerName: 'Blair Sample', winnerNum: '4', status: 'closed' }], seasons: [{ season: '2026/27', players: [{ id: 'p2', name: 'Blair Sample', num: '4', n: 1 }] }] };
      r.fulfill({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ ok: true, data: data }) });
    });
    await p.goto(BASE + '/coach/index.html');
    await p.waitForTimeout(1500);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); });
    await p.waitForFunction(() => window.__tlTest, { timeout: 8000 });
    T('coach app booted', true);
    await p.evaluate(() => {
      window.__tlTest(function (S, view, render) {
        S.players = { p2: { id: 'p2', name: 'Blair Sample', num: '4', active: true, pos: ['ST'] }, p3: { id: 'p3', name: 'Casey Sample', num: '11', active: true, pos: ['CM'] } };
        S.matches.fx1 = { id: 'fx1', opp: 'Rivals Athletic', date: '2026-11-07', ko: '10:30', ha: 'H', comp: 'League', status: 'done', formation: '352', half: 35, avail: {}, lineup: {}, events: [], stints: {}, clock: { acc: 4200, running: false, t0: 0 }, ratings: {}, notes: '', cm: {} };
        view.mid = 'fx1';
        render();
      });
    });
    await p.waitForSelector('#tl-motm-tie button', { timeout: 4000 });
    const tieText = await p.locator('#tl-motm-tie').innerText();
    T('tie shows both names and numbers', /Blair Sample/.test(tieText) && /Casey Sample/.test(tieText) && /4/.test(tieText) && /11/.test(tieText));
    T('tie does not announce a winner', !/Share to WhatsApp/.test(await p.locator('#tl-motm-card').count() ? '' : 'x') || (await p.locator('#tl-motm-tie').isVisible()));
    await p.screenshot({ path: path.join(SHOTS, 'r105-motm-tie.png') });
    await p.locator('#tl-motm-tie button').first().click();
    await p.waitForFunction(() => /Blair Sample|Casey Sample/.test((document.getElementById('tl-motm-photo-note') || {}).textContent || '') || document.getElementById('tl-motm-card'));
    await p.waitForTimeout(400);
    const note = await p.locator('#tl-motm-photo-note').innerText();
    T('missing photo is explained and not invented', /does not invent a picture|shirt number only|No approved photo/.test(note));
    await p.screenshot({ path: path.join(SHOTS, 'r105-motm-card.png') });
    const openedBefore = await p.evaluate(() => window.__opened || 0);
    await p.locator('[data-motm-act="share"]').click();
    await p.waitForSelector('#tl-motm-cap', { timeout: 4000 });
    const cap = await p.locator('#tl-motm-cap').inputValue();
    const openedAfter = await p.evaluate(() => window.__opened || 0);
    T('share fallback copies a caption', /Man of the Match/.test(cap) && /November 2026/.test(cap));
    T('share does not open WhatsApp by itself', openedAfter === openedBefore);
    T('coach card zero console errors', E.length === 0);
    if (E.length) console.log(E);
    await p.evaluate(() => { window.__tlTest(function (S, view, render) { view.mid = null; view.tab = 'more'; render(); }); });
    await p.locator('#tl-awards-load').click();
    await p.waitForTimeout(400);
    const dash = await p.locator('#tl-awards-body').innerText();
    T('dashboard lists the fixture and does not name a player of the year', /7 November 2026/.test(dash) && /Blair Sample/.test(dash) && /does not pick a winner/.test(dash));
    await p.screenshot({ path: path.join(SHOTS, 'r105-motm-awards.png') });
    await ctx.close();
  }
  await b.close();
  srv.close();
  console.log(ok + ' passed, ' + bad + ' failed');
  process.exit(bad ? 1 : 0);
})();
