/* r108 share dialog. Synthetic names. Cancel must not call the server. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.resolve(__dirname, '../../tl-share-inapp.js'), 'utf8');
const shareSrc = fs.readFileSync(path.resolve(__dirname, '../../share.js'), 'utf8');
const calls = [];
const store = {};
const opened = [];
function el(tag) { return { tag: tag, id: '', children: [], innerHTML: '', onclick: null, disabled: false, setAttribute: function (k, v) { this[k] = v; }, getAttribute: function (k) { return this[k] || ''; }, appendChild: function (c) { this.children.push(c); }, remove: function () { if (this.id) delete sandbox._els[this.id]; }, querySelectorAll: function () { return []; }, addEventListener: function () {} }; }
const sandbox = {
  document: {
    getElementById: function (id) { return sandbox._els[id] || null; },
    createElement: function (tag) { var e = el(tag); e.id = ''; return e; },
    head: { appendChild: function (n) { sandbox._els[n.id] = n; } },
    body: { appendChild: function (n) { sandbox._els[n.id] = n; n.querySelectorAll = function () { return []; }; } }
  },
  localStorage: {
    getItem: function (k) { return store[k] || null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
  },
  location: { pathname: '/shape/index.html', origin: 'https://touchline.example', href: 'https://touchline.example/shape/index.html' },
  navigator: { onLine: true, share: function () { calls.push({ action: 'navigator.share' }); } },
  open: function (u) { opened.push(u); },
  call: function (action, body) { calls.push({ action: action, body: body }); return Promise.resolve({ n: 1, sent: true }); },
  setInterval: function () { return 1; },
  _els: {}
};
sandbox.window = sandbox;
sandbox.document.body.classList = { contains: function () { return false; } };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
let ok = 0, bad = 0;
const T = function (n, c) { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };

store['tl.code'] = 'coach-test';
sandbox.TLInShare.open({ kind: 'shape', ref: '352', title: 'Our 352 in 3D', path: '/shape/index.html', roster: [{ id: 'p1', num: '9', name: 'Alex Sample' }] });
T('share opens the in-app selector', !!sandbox._els['tl-inshare'] && /Share in Touchline/.test(sandbox._els['tl-inshare'].innerHTML) && /Alex Sample/.test(sandbox._els['tl-inshare'].innerHTML));
T('the default dialog does not call the phone share sheet', calls.length === 0);
sandbox.TLInShare.close();
T('cancel removes the dialog and writes nothing', !sandbox._els['tl-inshare'] && calls.length === 0);

sandbox.navigator.onLine = false;
sandbox.TLInShare.open({ kind: 'shape', title: 'Our 352 in 3D', path: '/shape/index.html', roster: [{ id: 'p1', num: '9', name: 'Alex Sample' }] });
sandbox._stateHack = true;
T('a restricted item is not a WhatsApp page', sandbox.TLInShare.waAllowed('clip', '/family.html#clip/c1') === false);
T('a public team page may offer WhatsApp separately', sandbox.TLInShare.waAllowed('shape', '/shape/index.html') === true);
T('coach-only kind is refused', sandbox.TLInShare.allowed('cv') === false && sandbox.TLInShare.allowed('paid') === false);
const click = shareSrc.slice(shareSrc.indexOf('function bind'), shareSrc.indexOf('w.TLShare'));
T('the share button path does not call navigator.share', click.indexOf('navigator.share') < 0 && click.indexOf('inApp') >= 0);
T('queue clear drops the local copy', (function () { store['tl.shareq'] = '[]'; sandbox.TLInShare.clearQueue(); return !store['tl.shareq']; })());

console.log(ok + ' passed, ' + bad + ' failed');
process.exit(bad ? 1 : 0);
