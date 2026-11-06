/* r108: 352 Share opens the in-app recipient list. Synthetic names. No real send. */
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const PORT = +process.env.PORT || 8858;
const SHOTS = process.env.SHOTS || '/opt/cursor/artifacts';
fs.mkdirSync(SHOTS, { recursive: true });
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/version.json') { r.writeHead(200, { 'content-type': 'application/json' }); r.end('{"v":"108"}'); return; }
  if (/three\.min\.js/.test(u)) { r.writeHead(200, { 'content-type': 'text/javascript' }); r.end('var THREE=undefined;'); return; }
  let f = path.join(root, u);
  if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); r.end(); return; }
    const mt = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
    r.writeHead(200, { 'content-type': mt[path.extname(f)] || 'application/octet-stream' });
    r.end(d);
  });
}).listen(PORT);
const sent = [];
let ok = 0, bad = 0;
const T = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };
(async () => {
  const b = await chromium.launch();
  const phone = { ...devices['Pixel 7'], serviceWorkers: 'block' };
  const ctx = await b.newContext(phone);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('tl.code', 'coach-test'); });
  await p.route('**/macros/**', async (r) => {
    let a = {};
    try { a = JSON.parse(r.request().postData() || '{}'); } catch (e) {}
    sent.push(a.action || '');
    const data = a.action === 'share.roster' ? [{ id: 'p1', num: '9', name: 'Alex Sample' }, { id: 'p2', num: '4', name: 'Blair Sample' }] : { ok: 1, n: 1, sent: true };
    await r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, data: data }) });
  });
  await p.goto('http://localhost:' + PORT + '/shape/index.html?back=../coach/');
  await p.waitForSelector('#share');
  T('352 page has a Share button', (await p.locator('#share').boundingBox()).height >= 44);
  await p.locator('#share').click();
  await p.waitForSelector('#tl-inshare');
  const text = await p.locator('#tl-inshare').innerText();
  T('recipient selector lists synthetic players', /Alex Sample/.test(text) && /Blair Sample/.test(text) && /Share in Touchline/.test(text));
  T('WhatsApp sits after the Touchline choice', text.indexOf('Review') >= 0 && text.indexOf('Review') < text.indexOf('WhatsApp instead'));
  await p.screenshot({ path: path.join(SHOTS, 'r108-352-share.png') });
  await p.locator('#tl-inshare-cancel').click();
  T('cancel does not send', sent.indexOf('share.send') < 0 && await p.locator('#tl-inshare').count() === 0);
  await p.locator('#share').click();
  await p.locator('.tl-inshare-person', { hasText: 'Alex Sample' }).click();
  await p.locator('#tl-inshare-review').click();
  await p.locator('#tl-inshare-send').click();
  await p.waitForTimeout(300);
  T('send is only the mocked in-app action', sent.indexOf('share.send') >= 0 && sent.indexOf('f.vote') < 0);
  T('352 share has no JavaScript exception', errs.length === 0);
  if (errs.length) console.log(errs);
  await ctx.close();
  await b.close();
  srv.close();
  console.log(ok + ' passed, ' + bad + ' failed');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
