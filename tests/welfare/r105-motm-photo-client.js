/* r105 photo card. Synthetic JPEG only. The phone photo must not leave the page. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.resolve(__dirname, '../../coach/motm105.js'), 'utf8');
const calls = [];
const timers = [];
const drawn = [];
const els = {};
function el(id) {
  if (!els[id]) els[id] = {
    id: id, hidden: true, textContent: '', innerHTML: '', files: [], checked: false, style: {}, value: '',
    width: 800, height: 1000,
    getContext: function () {
      return { fillStyle: '', font: '', textAlign: '', lineWidth: 0, strokeStyle: '', fillRect: function () {}, fillText: function () {}, beginPath: function () {}, arc: function () {}, fill: function () {}, stroke: function () {}, save: function () {}, restore: function () {}, clip: function () {}, drawImage: function () {} };
    },
    toDataURL: function () { return 'data:image/png;base64,card'; },
    toBlob: function (cb) { cb(new Uint8Array()); }
  };
  return els[id];
}
const listeners = {};
const sandbox = {
  document: {
    getElementById: function (id) { return el(id); },
    addEventListener: function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    createElement: function () { return { href: '', download: '', click: function () {}, remove: function () {} }; },
    body: { appendChild: function () {} }
  },
  fetch: function (url, opt) { calls.push({ kind: 'fetch', url: String(url), body: String(opt && opt.body || '') }); return Promise.resolve({ ok: true }); },
  tlCall: function (action, body) { calls.push({ kind: 'tlCall', action: action, body: JSON.stringify(body || {}) }); return Promise.resolve(sandbox._status); },
  XMLHttpRequest: function () { calls.push({ kind: 'xhr' }); },
  navigator: {
    sendBeacon: function (url, body) { calls.push({ kind: 'beacon', url: String(url), body: String(body || '') }); return true; },
    clipboard: { writeText: function () { return Promise.resolve(); } },
    share: function () { calls.push({ kind: 'share' }); return Promise.resolve(); },
    canShare: function () { return false; }
  },
  localStorage: { setItem: function (k, v) { calls.push({ kind: 'storage', key: String(k), value: String(v) }); }, getItem: function () { return null; } },
  FileReader: function () {
    this.readAsDataURL = function (file) {
      calls.push({ kind: 'read' });
      this.result = file._data;
      if (this.onload) this.onload();
    };
  },
  Image: function () {
    var self = this;
    Object.defineProperty(this, 'src', { set: function (v) { drawn.push(v); if (self.onload) self.onload(); } });
  },
  setInterval: function () { return 1; },
  setTimeout: function (fn) { timers.push(fn); return timers.length; },
  clearInterval: function () {},
  console: console,
  Promise: Promise,
  Uint8Array: Uint8Array
};
sandbox.window = sandbox;
sandbox._status = null;
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

function fire(ev, target) { (listeners[ev] || []).forEach(function (fn) { fn({ target: target }); }); }
function flush() { timers.splice(0).forEach(function (fn) { fn(); }); }
function leak(list) { return JSON.stringify(list); }
function posted() { return calls.filter(function (c) { return c.kind !== 'read'; }); }

const jpeg = 'data:image/jpeg;base64,' + 'abc'.repeat(20);
const other = 'data:image/jpeg;base64,' + 'zzz'.repeat(20);
const code = 'PRIVCODE99';
let ok = 0, bad = 0;
const T = function (n, c) { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };

function boot(status) {
  calls.length = 0;
  drawn.length = 0;
  sandbox._status = status;
  sandbox.TLMotm.matchHtml('fx1');
  flush();
  return new Promise(function (r) { setImmediate(r); });
}

(async function () {
  await boot({ ok: true, closed: true, photoLocal: true, photo: '', photoNote: 'The consent list is not on this script, so no stored photo is used.', winnerName: 'Blair Sample', winnerNum: '4' });
  T('local picker is offered when server consent is unavailable', els['tl-motm-local'].hidden === false);
  const file = { name: code + '.jpg', _data: jpeg };
  el('tl-motm-local-file').files = [file];
  el('tl-motm-local-ok').checked = false;
  const before = calls.length;
  fire('change', el('tl-motm-local-file'));
  T('an unchecked photo is refused', drawn.indexOf(jpeg) < 0 && /checked this photo/.test(el('tl-motm-photo-note').textContent));
  T('a refused phone photo is not uploaded', calls.slice(before).every(function (c) { return c.kind === 'read'; }));
  T('the private code is not sent', leak(posted()).indexOf(code) < 0 && leak(posted()).indexOf(jpeg) < 0);

  el('tl-motm-local-ok').checked = true;
  const postedBefore = posted().length;
  fire('change', el('tl-motm-local-file'));
  await new Promise(function (r) { setImmediate(r); });
  T('a checked JPEG is drawn on the card', drawn.indexOf(jpeg) >= 0);
  T('a checked JPEG is not posted to a host or the assistant', posted().length === postedBefore && leak(posted()).indexOf(jpeg) < 0 && leak(posted()).indexOf(code) < 0 && leak(posted()).indexOf('anthropic') < 0);

  const refused = sandbox.TLMotm.acceptLocal({ photoLocal: false, photoFrom: '' }, jpeg, true);
  T('rejection blocks a phone photo', refused.ok === false && refused.photo === '');
  const remote = sandbox.TLMotm.acceptLocal({ photoLocal: true, photoFrom: '' }, 'https://files.example/' + code + '.jpg', true);
  T('a web address is not accepted as a phone photo', remote.ok === false);

  await boot({ ok: true, closed: true, photoLocal: false, photo: '', photoNote: 'Photo consent for this player is no, so the card shows the shirt number only.', winnerName: 'Blair Sample', winnerNum: '4' });
  T('rejected consent hides the phone picker', els['tl-motm-local'].hidden === true && /shirt number only/.test(el('tl-motm-photo-note').textContent));
  el('tl-motm-local-ok').checked = true;
  el('tl-motm-local-file').files = [{ name: code + '.jpg', _data: other }];
  const mid = calls.length;
  fire('change', el('tl-motm-local-file'));
  T('a phone file cannot override a rejection', drawn.indexOf(other) < 0 && calls.slice(mid).every(function (c) { return c.kind === 'read'; }));

  await boot({ ok: true, closed: true, photoLocal: false, photo: jpeg, photoNote: '', winnerName: 'Blair Sample', winnerNum: '4' });
  T('an approved server JPEG is drawn', drawn.indexOf(jpeg) >= 0 && els['tl-motm-local'].hidden === true);
  const kept = drawn.length;
  fire('change', el('tl-motm-local-file'));
  T('a phone file cannot replace the approved photo', drawn.length === kept);

  await boot({ ok: true, closed: true, photoLocal: false, photo: 'https://files.example/' + code + '.jpg', photoNote: 'No photo choice is on file for this player, so the card shows the shirt number only.', winnerName: 'Blair Sample', winnerNum: '4' });
  T('a remote photo address is not loaded', drawn.length === 0 && leak(calls).indexOf(code) < 0 && leak(drawn).indexOf('http') < 0);

  const pick = src.slice(src.indexOf("t.id !== 'tl-motm-local-file'"), src.indexOf('reader.readAsDataURL'));
  T('the phone file name is not read or sent', !/\.name/.test(pick));
  T('the card script does not call the assistant', !/anthropic|claude_|UrlFetchApp/.test(src));
  console.log(ok + ' passed, ' + bad + ' failed');
  process.exit(bad ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
