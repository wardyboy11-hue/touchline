/* r107 suggested wake-up. Synthetic codes only. No live sheet and no assistant call. */
const vm = require('vm'), fs = require('fs'), path = require('path');
const sheets = {};
function sheet(name) {
  if (!sheets[name]) sheets[name] = [];
  const rows = sheets[name];
  return {
    getLastRow: function () { return rows.length + 1; },
    appendRow: function (row) { rows.push(row.map(String)); },
    getRange: function (r, c, n) {
      return {
        getValues: function () { return rows.slice(r - 2, r - 2 + (n || 1)).map(function (x) { return x.slice(); }); },
        setValues: function (vals) { vals.forEach(function (val, i) { rows[r - 2 + i] = val.map(String); }); }
      };
    }
  };
}
const who = { PARENT1: { pid: 'p1', role: 'parent' }, PLAYER1: { pid: 'p1', role: 'player' }, PARENT2: { pid: 'p2', role: 'parent' }, PLAYER2: { pid: 'p2', role: 'player' } };
const outbound = [];
const ctx = {
  tab_: sheet,
  UrlFetchApp: { fetch: function (url, opt) { outbound.push(String(url) + String(opt && opt.payload || '')); } },
  Date: Date, JSON: JSON, String: String, Object: Object
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../../docs/r107-alarm-addon.gs'), 'utf8'), ctx);
let ok = 0, bad = 0;
const T = function (n, c) { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };
function auth(code) {
  if (!who[code]) throw new Error('That code did not work.');
  return who[code];
}
function route(code, action, body) {
  const fa = auth(code);
  const b = Object.assign({}, body || {}, { action: action });
  if (b.action === 'f.alarm.get') return ctx.alarmPrefGet_(fa.pid, fa.role);
  if (b.action === 'f.alarm.set') return ctx.alarmPrefSet_(fa.pid, fa.role, b);
  throw new Error('Unknown action');
}
function call(code, action, body) {
  try { return { v: route(code, action, body) }; } catch (e) { return { e: e.message }; }
}

let saved = call('PARENT1', 'f.alarm.set', { time: '07:15', playerId: 'p2', code: 'PARENT1' });
T('parent saves a London time for their own child', saved.v && saved.v.time === '07:15' && saved.v.zone === 'Europe/London' && saved.v.armed === false && saved.v.device === false && saved.v.kind === 'preference');
T('the save ignores a different player id', sheets.AlarmPref.length === 1 && sheets.AlarmPref[0][0] === 'p1' && sheets.AlarmPref[0][1] === '07:15');
T('the private code is not stored', !JSON.stringify(sheets.AlarmPref).includes('PARENT1') && !JSON.stringify(saved.v).includes('PARENT1'));

let mine = call('PLAYER1', 'f.alarm.get', { playerId: 'p2' });
T('the linked player can read the suggestion', mine.v && mine.v.time === '07:15' && mine.v.armed === false && mine.v.device === false);
T('the read does not include a code', !JSON.stringify(mine.v).includes('PLAYER1') && !JSON.stringify(mine.v).includes('p1'));

let other = call('PARENT2', 'f.alarm.get', { playerId: 'p1' });
T('another parent cannot read the first child', other.v && other.v.time === '');
let steal = call('PARENT2', 'f.alarm.set', { time: '09:40', playerId: 'p1' });
T('another parent writes only their own child', steal.v && steal.v.time === '09:40' && sheets.AlarmPref[0][1] === '07:15' && sheets.AlarmPref[1][0] === 'p2');
let still = call('PLAYER1', 'f.alarm.get', {});
T('the first suggestion is unchanged', still.v.time === '07:15');
let second = call('PLAYER2', 'f.alarm.get', {});
T('the second player sees only his suggestion', second.v.time === '09:40');

let denied = call('PLAYER1', 'f.alarm.set', { time: '06:00' });
T('the player cannot overwrite the suggestion', /Only a parent/.test(denied.e || '') && call('PLAYER1', 'f.alarm.get', {}).v.time === '07:15');
let stranger = call('COACH', 'f.alarm.get', {});
T('an unknown code cannot read', /did not work/.test(stranger.e || ''));
let loose = call('PARENT1', 'f.alarm.set', { time: '7:15' });
T('a loose time is refused', /24 hour/.test(loose.e || '') && call('PLAYER1', 'f.alarm.get', {}).v.time === '07:15');
let cleared = call('PARENT1', 'f.alarm.set', { clear: true, time: '08:00', playerId: 'p2' });
T('clear removes only that child', cleared.v && cleared.v.time === '' && call('PLAYER1', 'f.alarm.get', {}).v.time === '' && call('PLAYER2', 'f.alarm.get', {}).v.time === '09:40');
T('nothing was sent off the script', outbound.length === 0);

const src = fs.readFileSync(path.resolve(__dirname, '../../docs/r107-alarm-addon.gs'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
T('the addon does not call the assistant or read a code', !/claude_|UrlFetchApp|b\.code|b\.playerId/.test(src));

console.log(ok + ' passed, ' + bad + ' failed');
process.exit(bad ? 1 : 0);
