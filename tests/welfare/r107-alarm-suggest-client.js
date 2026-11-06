/* r107 suggestion on the phone. Synthetic time only. No upload and no clock alarm. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.resolve(__dirname, '../../tl-alarm-suggest.js'), 'utf8');
const store = {};
const calls = [];
const armed = [];
let href = 'https://touchline.example/family.html';
const els = {};
function el(id) {
  if (!els[id]) els[id] = { id: id, value: '', textContent: '', attributes: {}, parentNode: null, getAttribute: function (k) { return this.attributes[k] || ''; }, setAttribute: function (k, v) { this.attributes[k] = v; }, removeAttribute: function (k) { delete this.attributes[k]; }, remove: function () { delete els[id]; } };
  return els[id];
}
const sandbox = {
  document: {
    getElementById: function (id) { return els[id] || null; },
    createElement: function () {
      return { innerHTML: '', firstChild: null, set innerHTML(v) { this._html = v; this.firstChild = { id: 'tl-alarm-suggest', outerHTML: v, getAttribute: function () { return ''; } }; } };
    }
  },
  localStorage: {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
  },
  tlAlarmSetStatus: function (t) { armed.push(t); },
  tlAlarmArm: function () { armed.push('ARM'); },
  tlAlarmStop: function () { armed.push('STOP'); },
  call: function (action, body) { calls.push({ action: action, body: body }); return Promise.resolve(sandbox._reply(action, body)); },
  D: { role: 'player', first: 'Pat' },
  setInterval: function () { return 1; },
  console: console
};
sandbox.window = sandbox;
sandbox._reply = function () { return { time: '07:15', zone: 'Europe/London', armed: false, device: false, kind: 'preference' }; };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
let ok = 0, bad = 0;
const T = function (n, c) { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };

const host = el('tl-alarm');
const input = el('tl-alarm-time');
input.parentNode = {
  insertBefore: function (node) { els['tl-alarm-suggest'] = { id: 'tl-alarm-suggest', textContent: node.outerHTML || '', attributes: { 'data-time': '07:15', 'data-from': 'server' }, getAttribute: function (k) { return this.attributes[k] || ''; }, remove: function () { delete els['tl-alarm-suggest']; } }; }
};
sandbox.tlAlarmPrefLoad();
(async function () {
await new Promise(function (r) { setImmediate(r); });
T('the suggestion loads into the banner and not the time box', input.value === '' && els['tl-alarm-suggest'] && /07:15 Europe\/London/.test(els['tl-alarm-suggest'].textContent) && /not an alarm/i.test(els['tl-alarm-suggest'].textContent));
T('the saved copy has no private code', store['tl.alarm.pref'] && store['tl.alarm.pref'].indexOf('07:15') >= 0 && !/code|PARENT|PLAYER/.test(store['tl.alarm.pref']));
const before = calls.length;
sandbox.tlAlarmUseSuggestion();
T('confirm fills the time and does not arm or open Clock', input.value === '07:15' && armed.indexOf('ARM') < 0 && href.indexOf('intent:') < 0 && /Nothing is armed/.test(armed.join(' ')));
T('confirm does not call the server', calls.length === before);

sandbox.D = { role: 'parent', first: 'Sam' };
calls.length = 0;
sandbox.tlAlarmSuggestState.loaded = false;
sandbox._reply = function (action, body) { return { time: body && body.time || '', zone: 'Europe/London', armed: false, device: false, saved: true }; };
el('tl-alarm-parent-time').value = '06:45';
el('tl-alarm-parent-note');
el('tl-alarm-parent-state');
sandbox.tlAlarmParentSave();
T('parent save sends only the time', calls.length === 1 && calls[0].action === 'f.alarm.set' && calls[0].body.time === '06:45' && !calls[0].body.code && !calls[0].body.playerId);

store['tl.alarm.pref'] = JSON.stringify({ time: '07:15', zone: 'Europe/London' });
sandbox.tlAlarmPrefClear();
T('account clear removes the local copy and the filled time', !store['tl.alarm.pref'] && input.value === '' && armed.indexOf('STOP') >= 0);

const acct = fs.readFileSync(path.resolve(__dirname, '../../acct.js'), 'utf8');
const fam = fs.readFileSync(path.resolve(__dirname, '../../family.html'), 'utf8');
T('sign out and account switch clear the local copy', /tl\.alarm\.pref/.test(acct) && /function out\(\)\{[\s\S]*tl\.alarm\.pref/.test(fam) && /function login\(\)\{[\s\S]*tl\.alarm\.pref/.test(fam));
T('the client does not put the time in a prompt or a url', !/claude_|anthropic|location\.href|playerId/.test(src));

console.log(ok + ' passed, ' + bad + ' failed');
process.exit(bad ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
