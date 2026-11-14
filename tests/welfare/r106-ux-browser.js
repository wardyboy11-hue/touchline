/* r106 preview: role homes, 44px shortcuts, guide note, every listed view, no console errors. Synthetic data. */
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const PORT = +process.env.PORT || 8836;
const SHOTS = process.env.SHOTS || require('path').join(require('os').tmpdir(),'touchline-shots');
fs.mkdirSync(SHOTS, { recursive: true });
const MT = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.webmanifest': 'application/json', '.vtt': 'text/vtt', '.webm': 'video/webm', '.mp4': 'video/mp4' };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/version.json') { r.writeHead(200, { 'content-type': 'application/json' }); r.end(JSON.stringify({v:(require('fs').readFileSync(require('path').join(__dirname,'../../update.js'),'utf8').match(/RUN='(\d+)'/)||[])[1]})); return; }
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
  return { first: 'Pat', role: role, num: '7', mine: {}, at: Date.now(), photo: '', posts: [{ id: 'tr1', type: 'training', date: '2026-11-11', time: '20:00', title: 'Training', place: 'Pitch' }], squadNums: [], vote: { motm: { open: false, elig: role === 'parent', cands: [{ id: 'p9', num: '9', name: 'Alex Sample' }], mine: [] }, poty: { open: false } }, x: { fixtures: [{ id: 'fx1', opp: 'Rivals Athletic', date: '2026-11-14', ko: '10:30', ha: 'A', done: false, pp: 0, venue: 'Rivals ground' }], news: [], events: [], lifts: [], media: [], contacts: [{ n: 'Club welfare', r: 'Welfare', e: '', p: '' }] } };
}
(async () => {
  const b = await chromium.launch();{const _nc=b.newContext.bind(b);b.newContext=async(...a)=>{const c=await _nc(...a);await c.addInitScript(()=>{try{const d=new Date();localStorage.setItem('tl.md.shown.'+d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),'1');}catch(e){}});return c;};} /* r113: the match morning screen is tested elsewhere; hide it if the run lands on a Saturday */
  const phone = devices['Pixel 7'];
  const desk = { viewport: { width: 1280, height: 800 } };
  async function bootFamily(page, role) {
    await page.addInitScript(() => { localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code', 'p'); localStorage.setItem('fam.ok1', '1'); localStorage.setItem('fam.wel.P', '1'); localStorage.setItem('fam.tour', '1'); });
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
    await p.waitForSelector('.tlh-tile'); // r113: the shortcut row became four big buttons on the new Home
    const q = (await p.locator('.tlh-tile').allInnerTexts()).map(t=>t.replace(/[^A-Za-z ]/g,'').trim());
    const h = await p.locator('.tlh-tile').first().evaluate(el => el.getBoundingClientRect().height);
    const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
    T('parent shortcuts', q.join('|') === 'Emergency|Lifts|Training|Clips');
    T('parent shortcut at least 44px', h >= 44);
    T('kit navy background', bg === 'rgb(2, 25, 69)');
    await p.screenshot({ path: path.join(SHOTS, 'r106-parent-home.png') });
    await p.locator('nav.tabs button', { hasText: 'Calendar' }).click(); // r113: the Fixtures shortcut became the Calendar tab
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
    await p.waitForSelector('.tlh-tile');
    const q = (await p.locator('.tlh-tile').allInnerTexts()).map(t=>t.replace(/[^A-Za-z ]/g,'').trim());
    T('player shortcuts', q.join('|') === 'Run|Stretch|My goals|Ask');
    await p.screenshot({ path: path.join(SHOTS, 'r106-player-home.png') });
    await p.locator('nav.tabs button', { hasText: 'Calendar' }).click();
    await p.waitForSelector('#tl-matchday');
    T('player matchday heading', /Match days/.test(await p.locator('#tl-matchday').innerText()));
    await p.screenshot({ path: path.join(SHOTS, 'r106-player-matchday.png') });
    await p.locator('nav.tabs button', { hasText: 'Videos' }).click();
    await p.waitForSelector('#tl-resources');
    T('player resources heading', /Videos and pictures/.test(await p.locator('#tl-resources').innerText()));
    await p.screenshot({ path: path.join(SHOTS, 'r106-player-resources.png') });
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
  {
    const ctx = await b.newContext({ ...phone, serviceWorkers: 'block', recordVideo: { dir: SHOTS, size: { width: 412, height: 915 } } });
    const p = await ctx.newPage();
    const E = errsOf(p);
    await bootFamily(p, 'parent');
    await p.goto(BASE + '/parents.html');
    await p.waitForTimeout(1400);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); try { r(); } catch (e) {} });
    await p.locator('nav.tabs button', { hasText: 'Calendar' }).click(); // r113: the Fixtures shortcut became the Calendar tab
    await p.waitForSelector('#tl-matchday');
    T('parent matchday heading', /Match days/.test(await p.locator('#tl-matchday').innerText()));
    T('fixture opponent still listed', /Rivals Athletic/.test(await p.locator('#root').innerText()));
    T('share bar still on games', await p.locator('[data-tlshare], .tl-share-btn, button:has-text("Share")').count() > 0);
    await p.screenshot({ path: path.join(SHOTS, 'r106-parent-matchday.png') });
    await p.waitForTimeout(1200);
    await ctx.close();
    T('matchday flow zero console errors', E.length === 0);
    if (E.length) console.log(E);
  }
  {
    const ctx = await b.newContext({ ...phone, serviceWorkers: 'block', recordVideo: { dir: SHOTS, size: { width: 412, height: 915 } } });
    const p = await ctx.newPage();
    const E = errsOf(p);
    await bootFamily(p, 'parent');
    await p.goto(BASE + '/parents.html');
    await p.waitForTimeout(1400);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); try { r(); } catch (e) {} });
    await p.locator('nav.tabs button', { hasText: 'Videos' }).click(); // r113: Media is Videos in the nav
    await p.waitForSelector('#tl-resources');
    T('parent resources heading', /Videos and pictures/.test(await p.locator('#tl-resources').innerText()));
    T('listen still on resources', /Open the podcast list/.test(await p.locator('#root').innerText()));
    await p.screenshot({ path: path.join(SHOTS, 'r106-parent-resources.png') });
    await p.locator('nav.tabs button', { hasText: 'Home' }).click();
    await p.locator('.tlh-tile', { hasText: 'Emergency' }).click();
    await p.waitForTimeout(300);
    T('emergency still lists 999', /999/.test(await p.locator('#root').innerText()));
    await ctx.close();
    T('resources flow zero console errors', E.length === 0);
    if (E.length) console.log(E);
  }
  {
    const ctx = await b.newContext({ ...phone, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    await p.addInitScript(() => {
      localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code', 'p');
      localStorage.setItem('fam.ok1', '1');
      localStorage.setItem('fam.wel.P', '1');
      localStorage.setItem('fam.tour', '1');
      try { Object.defineProperty(navigator, 'onLine', { get: function () { return false; } }); } catch (e) {}
    });
    // r113: pin the clock to the day before training (Tuesday 10 Nov) so the Yes or No card shows whatever the real date is
    await p.addInitScript("(()=>{const T=new Date('2026-11-10T18:00:00').getTime(),D0=Date.now(),R=Date;class FD extends R{constructor(...a){if(a.length)super(...a);else super(T+(R.now()-D0));}static now(){return T+(R.now()-D0);}}window.Date=FD;})()");
    await p.route('**/macros/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ ok: true, data: fam('parent') }) }));
    await p.goto(BASE + '/parents.html');
    await p.waitForTimeout(1400);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); try { r(); } catch (e) {} });
    const yes = p.locator('#att-top button', { hasText: 'Yes' }).first();
    if (await yes.count()) await yes.click();
    await p.waitForTimeout(300);
    const queued = await p.evaluate(() => localStorage.getItem('fam.attq') || '');
    T('offline attendance queues', /"a":"Y"/.test(queued) || /Y/.test(queued));
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ ...phone, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    const data = fam('parent');
    data.vote.motm.open = true;
    data.vote.motm.elig = true;
    await p.addInitScript(() => { localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code', 'p'); localStorage.setItem('fam.ok1', '1'); localStorage.setItem('fam.wel.P', '1'); localStorage.setItem('fam.tour', '1'); });
    await p.route('**/macros/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ ok: true, data: data }) }));
    await p.goto(BASE + '/parents.html');
    await p.waitForTimeout(1400);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); try { r(); } catch (e) {} });
    const motm = await p.locator('#motm-home').innerText();
    T('MoM still shows name and number', /Alex Sample/.test(motm) && /9/.test(motm));
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ ...desk, serviceWorkers: 'block', recordVideo: { dir: SHOTS, size: { width: 900, height: 700 } } });
    const p = await ctx.newPage();
    const E = errsOf(p);
    await p.addInitScript(() => { localStorage.setItem('tl.code', 'coach-test'); localStorage.setItem('tl.who', 'Tim'); localStorage.setItem('tl.state.v1', JSON.stringify({ ideas: {}, players: {}, matches: {}, settings: { id: 'main', half: 35, subEvery: 17, roles: {}, updatedAt: 0 }, dirty: {}, lastSync: Date.now() })); });
    await p.route('**/macros/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ ok: true, data: { docs: [], serverTime: Date.now(), rows: [] } }) }));
    await p.goto(BASE + '/coach/index.html');
    await p.waitForFunction(() => window.__tlTest);
    await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); });
    await p.evaluate(() => window.__tlTest(function (S, view, render) {
      S.players = { p9: { id: 'p9', name: 'Alex Sample', num: '9', active: true, pos: ['ST'] } };
      S.matches.fx1 = { id: 'fx1', opp: 'Rivals Athletic', date: '2026-11-14', ko: '10:30', ha: 'H', comp: 'League', status: 'live', formation: '352', half: 35, avail: { p9: true }, lineup: {}, events: [], stints: {}, clock: { acc: 0, running: false, t0: 0 }, ratings: {}, notes: '', period: 1 };
      view.mid = 'fx1';
      render();
    }));
    await p.waitForSelector('#tl-coach-matchday');
    T('coach matchday heading', /Coach matchday/.test(await p.locator('#tl-coach-matchday').innerText()));
    await p.screenshot({ path: path.join(SHOTS, 'r106-coach-matchday.png') });
    await p.evaluate(() => window.__tlTest(function (S, view, render) { view.mid = null; view.tab = 'res'; render(); }));
    await p.waitForSelector('#tl-coach-resources');
    T('coach resources heading', /Coach resources/.test(await p.locator('#tl-coach-resources').innerText()));
    await p.screenshot({ path: path.join(SHOTS, 'r106-coach-resources.png') });
    T('coach matchday and resources zero console errors', E.length === 0);
    if (E.length) console.log(E);
    await ctx.close();
  }
  await b.close();
  srv.close();
  console.log(ok + ' passed, ' + bad + ' failed');
  process.exit(bad ? 1 : 0);
})();
