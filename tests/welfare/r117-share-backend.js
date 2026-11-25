/* r117: backend v39 share rules and coach prompts. Runs the real Code_v39.gs in Node with a pretend Sheet.
   Pretend players only. Nothing real is touched and nothing is sent anywhere. */
const vm = require('vm'), fs = require('fs'), path = require('path');
const FULL = process.env.V39 || '/workspace/Code_v39.gs', HAVEFULL = fs.existsSync(FULL);
const ADDON = path.resolve(__dirname, '../../docs/r117-share-addon.gs');
/* Helpers copied from the live v38 Code.gs (no secrets), used when the full v39 file is not on this machine. */
const HELP = `function clean_(s, n) { return String(s == null ? '' : s).replace(/[<>]/g, '').trim().slice(0, n || 200); }
function attClean_(a) { return (Array.isArray(a) ? a : []).slice(0, 6).map(function (x) { var u = clean_(x && x.u, 400), t = clean_(x && x.t, 120); if (u && !/^https:\\/\\//.test(u)) u = ''; return { t: t || u.replace(/^https:\\/\\/(www\\.)?/, '').slice(0, 60), u: u, kind: clean_(x && x.kind, 12) }; }).filter(function (x) { return x.t; }); }
function coachWho_(code) { var p = PropertiesService.getScriptProperties(); return code === p.getProperty('DEANO_CODE') ? 'Deano' : 'Tim'; }
function feedTab_() { return tab_('PlayerFeed', ['id', 'pid', 'at', 'json', 'status']); }
function feedRows_() { var sh = feedTab_(), last = sh.getLastRow(); if (last < 2) return []; return sh.getRange(2, 1, last - 1, 5).getValues().map(function (r, i) { var j = {}; try { j = JSON.parse(String(r[3])); } catch (e) {} return { row: i + 2, id: String(r[0]), pid: String(r[1]), at: Number(r[2]) || 0, d: j, status: String(r[4] || 'live') }; }); }
function settingsObj_() { return (allDocs_().settings) || settings_() || {}; }
function londonParts_(d) { var fmt = function (p) { return Utilities.formatDate(d || new Date(), 'Europe/London', p); }; return { ymd: fmt('yyyy-MM-dd'), hm: fmt('HH:mm'), dow: Number(fmt('u')) }; }
function notify_(title, msg, level) { var p = PropertiesService.getScriptProperties(), app = p.getProperty('PUSHOVER_APP'); if (!app) return { sent: 0 }; var targets = [['PUSHOVER_TIM', level === 'urgent' ? 2 : level === 'normal' ? 1 : 0], ['PUSHOVER_DEANO', level === 'urgent' ? 1 : level === 'normal' ? 0 : -1]]; var sent = 0; targets.forEach(function (t) { var user = p.getProperty(t[0]); if (!user) return; var pay = { token: app, user: user, title: clean_(title, 100), message: clean_(msg, 900), priority: String(t[1]) }; var r = UrlFetchApp.fetch('https://api.pushover.net/1/messages.json', { method: 'post', payload: pay }); if (r.getResponseCode() === 200) sent++; }); return { sent: sent }; }
`;
let ok = 0, bad = 0; const T = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };
const sheets = {};
function sheet(name) {
  if (!sheets[name]) sheets[name] = [];
  const rows = sheets[name];
  return {
    getLastRow: () => rows.length + 1,
    appendRow: row => rows.push(row.map(String)),
    getRange: (r, c, n) => ({
      getValues: () => rows.slice(r - 2, r - 2 + (n || 1)).map(x => x.slice()),
      setValue: v => { rows[r - 2][c - 1] = String(v); }
    })
  };
}
const players = { p1: { id: 'p1', name: 'Alex Sample', num: '1', active: true }, p2: { id: 'p2', name: 'Blair Sample', num: '4', active: true }, p3: { id: 'p3', name: 'Casey Sample', num: '9', active: true } };
const props = { DEANO_CODE: 'deano-test', COACH_CODE: 'coach-test', PUSHOVER_APP: 'app', PUSHOVER_TIM: 'tim', PUSHOVER_DEANO: 'deano' };
const outbound = []; let fakeNow = new Date('2026-11-24T19:05:00Z'); let settings = {};
const pad = n => String(n).padStart(2, '0');
const ctx = {
  console, JSON, Date, Math, String, Number, Array, Object, RegExp, Error,
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
  UrlFetchApp: { fetch: (u, o) => { outbound.push({ u, o }); return { getResponseCode: () => 200, getContentText: () => '{}' }; } },
  Utilities: { getUuid: () => 'u' + Math.random().toString(36).slice(2, 12), formatDate: (d, tz, p) => { const x = fakeNow; return p === 'yyyy-MM-dd' ? x.getUTCFullYear() + '-' + pad(x.getUTCMonth() + 1) + '-' + pad(x.getUTCDate()) : p === 'HH:mm' ? pad(x.getUTCHours()) + ':' + pad(x.getUTCMinutes()) : p === 'u' ? String(((x.getUTCDay() + 6) % 7) + 1) : ''; } },
  ContentService: { createTextOutput: s => ({ setMimeType: () => s, s }), MimeType: { JSON: 'json' } },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ScriptApp: { getProjectTriggers: () => [], deleteTrigger() {}, newTrigger: () => { throw new Error('no triggers in tests'); } },
  Logger: { log() {} }
};
vm.createContext(ctx);
const src = HAVEFULL ? fs.readFileSync(FULL, 'utf8') : HELP + fs.readFileSync(ADDON, 'utf8');
console.log('Testing ' + (HAVEFULL ? FULL : 'docs/r117-share-addon.gs with v38 helpers'));
vm.runInContext(src, ctx, { filename: 'v39' });
ctx.tab_ = sheet; ctx.players_ = () => players; ctx.allDocs_ = () => ({ settings, matches: [] }); ctx.settings_ = () => settings;
const C = ctx;
function send(b) { try { return C.feedSend_(Object.assign({ code: 'coach-test' }, b)); } catch (e) { return { err: e.message }; } }
const rows = () => (sheets.PlayerFeed || []).length;

// header and deployment rules
T('header says not deployed and existing deployment only', /NOT deployed/.test(src) && /AKfycby3YUAg5Qnc/.test(src) && /Never New deployment/.test(src));
if (HAVEFULL) {
T('share.caps is a coach action, after auth', /b\.action === 'share\.caps'/.test(src) && src.indexOf("b.action === 'share.caps'") > src.indexOf("b.action === 'feed.send'"));
T('families cannot call feed.send (only in the coach branch)', (src.match(/'feed\.send'/g) || []).length === 1);
T('f.feed passes the role', /f\.feed'\) return \{ rows: feedFor_\(pid, role\) \}/.test(src));
}

// audiences
let r = send({ all: true, aud: 'parents', item: { t: 'Subs due Friday', kind: 'note', note: 'Pay on TeamFeePay' } });
T('parents only send is accepted', r.ok && r.aud === 'parents');
T('parents only item hidden from a player code', C.feedFor_('p1', 'player').length === 0);
T('parents only item shown to a parent code', C.feedFor_('p1', 'parent').length === 1 && C.feedFor_('p1', 'parent')[0].aud === 'parents');
r = send({ all: true, aud: 'team', item: { t: 'Meet 09:30 Saturday', kind: 'note' } });
T('whole team item shown to player and parent', C.feedFor_('p2', 'player').some(x => x.t === 'Meet 09:30 Saturday') && C.feedFor_('p2', 'parent').some(x => x.t === 'Meet 09:30 Saturday'));
r = send({ pids: ['p3'], aud: 'players', item: { t: 'Keeper focus', kind: 'note', note: 'Starting position as the ball goes wide' } });
T('chosen player gets it, and their parent sees it', C.feedFor_('p3', 'player').some(x => x.t === 'Keeper focus') && C.feedFor_('p3', 'parent').some(x => x.t === 'Keeper focus'));
T('another player does not see a chosen player item', !C.feedFor_('p2', 'player').some(x => x.t === 'Keeper focus') && !C.feedFor_('p2', 'parent').some(x => x.t === 'Keeper focus'));
r = send({ pids: ['p2'], aud: 'parents', item: { t: 'Lift for Saturday', kind: 'note' } });
T('parents of a chosen player only: parent yes, player no', C.feedFor_('p2', 'parent').some(x => x.t === 'Lift for Saturday') && !C.feedFor_('p2', 'player').some(x => x.t === 'Lift for Saturday'));
r = send({ all: true, aud: 'nonsense', item: { t: 'Odd audience', kind: 'link', u: 'https://example.com' } });
T('unknown audience falls back to players', r.aud === 'players');
sheets.PlayerFeed.push(['old1', '*', String(Date.now()), JSON.stringify({ t: 'Old item', kind: 'link' }), 'live']);
T('old rows with no audience still show to both', C.feedFor_('p1', 'player').some(x => x.t === 'Old item') && C.feedFor_('p1', 'parent').some(x => x.t === 'Old item'));
T('wrong player id writes nothing', send({ pids: ['nobody'], item: { t: 'x' } }).err === 'Pick at least one player.');

// refusals
const before = rows();
const refuse = [
  ['coach only flag', { t: 'Our set pieces', coachOnly: true }],
  ['ratings kind', { t: 'Player ratings', kind: 'rating' }],
  ['coach note kind', { t: 'Notes', kind: 'coachnote' }],
  ['welfare kind', { t: 'Check in', kind: 'welfare' }],
  ['medical kind', { t: 'Knee', kind: 'medical' }],
  ['attitude kind', { t: 'Effort', kind: 'attitude' }],
  ["Coaches' Voice link", { t: 'Back three', kind: 'link', u: 'https://www.coachesvoice.com/cv/x' }],
  ['rating words in the note', { t: 'Saturday', kind: 'note', note: 'Ratings: 7 for passing' }],
  ['rated words', { t: 'Rated 6 by Deano', kind: 'note' }],
  ['welfare words', { t: 'Welfare check', kind: 'note' }],
  ['attitude words', { t: 'Attitude', kind: 'note', note: 'his attitude was poor' }],
  ['coach only words', { t: 'Coach only plan', kind: 'link', u: 'https://example.com' }]
];
refuse.forEach(([n, it]) => { const x = send({ all: true, aud: 'team', item: it }); T('refused: ' + n, !!x.err); });
T('refused items wrote nothing', rows() === before);
T('a date like 21/10 is not mistaken for a rating', send({ all: true, aud: 'team', item: { t: 'Tournament 21/10', kind: 'note' } }).ok === true);
T('feed list shows the audience', C.feedList_().some(x => x.aud === 'parents' && x.to === 'All parents'));
T('nothing left the server while sending', outbound.length === 0);

// coach prompts
fakeNow = new Date('2026-11-24T19:05:00Z'); // Tuesday 19:05 (UK is UTC+0 in November)
let p = C.coachPromptRun_();
T('Tuesday 19:00 sends the weekly review prompt', p.sent === 2 && outbound.length === 2 && /Weekly review/.test(outbound[0].o.payload.title));
T('prompt goes only to Tim and Deano', outbound.every(o => ['tim', 'deano'].indexOf(o.o.payload.user) > -1));
T('prompt has no player names', outbound.every(o => !/Alex|Blair|Casey/.test(o.o.payload.message)));
p = C.coachPromptRun_();
T('same Tuesday is not sent twice', p.sent === 0 && outbound.length === 2);
fakeNow = new Date('2026-11-25T19:05:00Z'); p = C.coachPromptRun_();
T('Wednesday 19:00 sends nothing', p.sent === 0 && outbound.length === 2);
fakeNow = new Date('2026-11-27T18:10:00Z'); p = C.coachPromptRun_();
T('Friday 18:00 sends Saturday prep', p.sent === 2 && /Saturday prep/.test(outbound[2].o.payload.title));
fakeNow = new Date('2026-12-01T19:05:00Z'); settings = { prompts117: false }; p = C.coachPromptRun_();
T('switched off in settings sends nothing', p.sent === 0 && outbound.length === 4);
T('setup function exists but was not run', typeof C.setupRelease117Prompts === 'function');
console.log(ok + ' passed, ' + bad + ' failed');
process.exit(bad ? 1 : 0);
