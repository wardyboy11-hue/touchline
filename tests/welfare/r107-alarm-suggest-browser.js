/* r107 parent suggestion and player confirm. Synthetic players. No clock alarm is created. */
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const PORT = +process.env.PORT || 8847;
const SHOTS = process.env.SHOTS || '/opt/cursor/artifacts';
fs.mkdirSync(SHOTS, { recursive: true });
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/version.json') { r.writeHead(200, { 'content-type': 'application/json' }); r.end('{"v":"107"}'); return; }
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
const base = { mine: {}, at: Date.now(), posts: [], vote: { motm: { open: false }, poty: { open: false } }, x: { fixtures: [{ id: 'fx1', opp: 'Rivals Athletic', date: '2026-11-14', ko: '10:30', ha: 'A', done: false }], news: [], events: [], lifts: [], media: [], contacts: [] } };
let saved = null;
function reply(a) {
  if (a.action === 'f.alarm.set') {
    saved = a;
    return { time: a.clear ? '' : a.time, zone: 'Europe/London', kind: 'preference', armed: false, device: false, saved: true };
  }
  if (a.action === 'f.alarm.get') return { time: '07:15', zone: 'Europe/London', kind: 'preference', armed: false, device: false };
  if (a.action === 'f.child') return { num: '7', pos: [], work: [], voice: [] };
  if (a.action === 'f.home') return Object.assign({ first: 'Pat', role: a._role || 'player', num: '7' }, base);
  return { ok: 1 };
}
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
  await p.route('**/macros/**', async (r) => {
    let a = {};
    try { a = JSON.parse(r.request().postData() || '{}'); } catch (e) {}
    a._role = 'player';
    await r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, data: reply(a) }) });
  });
  await p.goto('http://localhost:' + PORT + '/family.html');
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); });
  await p.locator('.tl-q', { hasText: 'Fixtures' }).click();
  await p.waitForSelector('#tl-alarm-use');
  T('player time box stays empty until he confirms', await p.locator('#tl-alarm-time').inputValue() === '');
  T('the suggestion is labelled as not an alarm', /Parent suggestion, not an alarm/.test(await p.locator('#tl-alarm-suggest').innerText()) && /Europe\/London/.test(await p.locator('#tl-alarm-suggest').innerText()));
  const before = p.url();
  await p.locator('#tl-alarm-use').click();
  T('confirm fills the time and stays on the page', await p.locator('#tl-alarm-time').inputValue() === '07:15' && p.url() === before && p.url().indexOf('intent:') < 0);
  T('confirm says nothing is armed', /Nothing is armed/.test(await p.locator('#tl-alarm-status').innerText()));
  const kept = await p.evaluate(() => localStorage.getItem('tl.alarm.pref') || '');
  T('the phone copy has the time and no code', kept.indexOf('07:15') >= 0 && kept.indexOf('"p"') < 0 && kept.indexOf('code') < 0);
  await p.screenshot({ path: path.join(SHOTS, 'r107-player-suggestion.png') });
  await p.evaluate(() => out());
  T('sign out clears the local copy', (await p.evaluate(() => localStorage.getItem('tl.alarm.pref'))) === null);
  await ctx.close();

  const ctx2 = await b.newContext(phone);
  const q = await ctx2.newPage();
  q.on('pageerror', e => errs.push(e.message));
  await q.addInitScript(() => { localStorage.setItem('fam.code', 'f'); localStorage.setItem('tl.alarm.pref', JSON.stringify({ time: '06:00', zone: 'Europe/London' })); localStorage.setItem('fam.ok1', '1'); localStorage.setItem('fam.wel.F', '1'); localStorage.setItem('fam.tour', '1'); });
  await q.route('**/macros/**', async (r) => {
    let a = {};
    try { a = JSON.parse(r.request().postData() || '{}'); } catch (e) {}
    a._role = 'parent';
    await r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, data: reply(a) }) });
  });
  await q.goto('http://localhost:' + PORT + '/parents.html');
  await q.waitForTimeout(1200);
  await q.evaluate(() => { const s = document.getElementById('splash'); if (s) s.remove(); try { goTab('child'); } catch (e) {} });
  await q.waitForSelector('#tl-alarm-parent-save');
  T('parent profile says the suggestion is not a device alarm', /does not set his phone alarm/.test(await q.locator('#tl-alarm-parent').innerText()));
  await q.locator('#tl-alarm-parent-time').fill('06:45');
  await q.locator('#tl-alarm-parent-save').click();
  await q.waitForTimeout(300);
  T('parent save does not send another child or a code in the alarm fields', saved && saved.time === '06:45' && !saved.playerId && !saved.clear);
  T('a phone file from the previous account is replaced by the server time', (await q.evaluate(() => localStorage.getItem('tl.alarm.pref') || '')).indexOf('06:00') < 0);
  await q.screenshot({ path: path.join(SHOTS, 'r107-parent-suggestion.png') });
  T('suggestion screens have no console errors', errs.length === 0);
  if (errs.length) console.log(errs);
  await b.close();
  srv.close();
  console.log(ok + ' passed, ' + bad + ' failed');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
