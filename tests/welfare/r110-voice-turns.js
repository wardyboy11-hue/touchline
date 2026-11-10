/* Voice turns: transcript, typed question, errors and a second mic tap.
   Speech APIs are stubs. This does not claim a real microphone was used. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const code = fs.readFileSync(path.resolve(__dirname, '../../voice.js'), 'utf8');
const spoken = [];
const bubbles = [];
function el(id) {
  return { id: id, hidden: false, value: '', textContent: '', innerHTML: '', className: '', children: [], style: {},
    setAttribute: function (k, v) { this[k] = v; }, getAttribute: function (k) { return this[k]; },
    appendChild: function (c) { this.children.push(c); if (c.className && String(c.className).indexOf('tl-voice-b') >= 0) bubbles.push(c.innerHTML); },
    classList: { toggle: function () {}, add: function () {}, remove: function () {} },
    addEventListener: function (ev, fn) { this['on' + ev] = fn; },
    focus: function () {}, blur: function () {}, click: function () {} };
}
const els = {};
function make(id) { if (!els[id]) els[id] = el(id); return els[id]; }
['tl-voice-fab', 'tl-voice-sheet', 'tl-voice-status', 'tl-voice-in', 'tl-voice-log', 'tl-voice-note', 'tl-voice-mic', 'tl-voice-h', 'tl-voice-x', 'tl-voice-go'].forEach(make);
let recs = [];
function LocalSR() {
  this.lang = '';
  this.interimResults = false;
  var self = this;
  Object.defineProperty(this, 'processLocally', { get: function () { return true; }, set: function () {} });
  this.start = function () { recs.push(self); };
  this.stop = function () { if (self.onend) self.onend(); };
  this.abort = function () { if (self.onend) self.onend(); };
}
LocalSR.available = function () { return Promise.resolve('available'); };
const sandbox = {
  document: {
    getElementById: function (id) { return els[id] || null; },
    createElement: function () { return el('n' + Math.random()); },
    head: { appendChild: function () {} },
    body: { appendChild: function () {} },
    addEventListener: function (ev, fn) { this['on' + ev] = fn; },
    activeElement: null
  },
  speechSynthesis: {
    cancel: function () {},
    speak: function (u) { spoken.push(u.text); if (u.onend) u.onend(); },
    getVoices: function () { return []; },
    addEventListener: function () {}
  },
  SpeechSynthesisUtterance: function (t) { this.text = t; this.onend = null; this.onerror = null; },
  SpeechRecognition: LocalSR,
  navigator: {},
  location: { href: 'https://touchline.example/parents.html' },
  fetch: function () { return Promise.resolve({ ok: false, json: function () { return Promise.resolve(null); } }); },
  setTimeout: function (fn) { fn(); return 1; },
  clearTimeout: function () {},
  Promise: Promise
};
sandbox.window = sandbox;
sandbox.global = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const V = sandbox.TLVoice;
const fx = [{ date: '2026-11-07', ko: '11:00', opp: 'Atherton Town Eagles', ha: 'A', venue: 'Atherton', kit: 'H' }];
let ok = 0, bad = 0;
const T = function (n, c) { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };
const ui = V.mount({ context: function () { return { role: 'parent', today: '2026-11-06', fixtures: fx }; } });
function flush() { return new Promise(function (r) { setImmediate(r); }); }
(async function () {
ui.open();
await flush();
T('opening greets once', spoken.filter(function (s) { return s === 'How can I help?'; }).length === 1);
T('listening started on the device stub', recs.length === 1);
var beforeHelp = bubbles.filter(function (h) { return h.indexOf('How can I help?') >= 0; }).length;
recs[0].onresult({ results: [{ isFinal: true, 0: { transcript: 'what kit is it tomorrow' } }] });
T('the heard question is on screen', els['tl-voice-in'].value.indexOf('what kit is it tomorrow') >= 0 && /Heard/.test(els['tl-voice-status'].textContent) && !bubbles.some(function (h) { return h.indexOf('dark blue') >= 0; }));
els['tl-voice-go'].onclick();
T('the answer names the saved blue kit', bubbles.some(function (h) { return h.indexOf('dark blue and white stripes') >= 0; }) && spoken.some(function (s) { return s.indexOf('dark blue') >= 0; }));
els['tl-voice-mic'].onclick();
T('a second mic tap does not add another greeting', bubbles.filter(function (h) { return h.indexOf('How can I help?') >= 0; }).length === beforeHelp);
els['tl-voice-in'].value = 'what kit are we wearing tomorrow';
els['tl-voice-go'].onclick();
T('typing the same kind of question shows the kit', bubbles.filter(function (h) { return h.indexOf('dark blue and white stripes') >= 0; }).length >= 2);
sandbox.speechSynthesis = null;
els['tl-voice-in'].value = 'what kit is it tomorrow';
els['tl-voice-go'].onclick();
T('the answer stays on screen when speech is unavailable', bubbles.filter(function (h) { return h.indexOf('dark blue and white stripes') >= 0; }).length >= 3 && /not speaking/.test(els['tl-voice-status'].textContent));
T('speech stubs were used, not a real microphone', true);
console.log(ok + ' passed, ' + bad + ' failed');
console.log('MIC_HARDWARE tested: no');
process.exit(bad ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
