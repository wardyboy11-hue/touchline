/* r108 in-app share. Synthetic players only. No live sheet and no assistant call. */
const vm = require('vm'), fs = require('fs'), path = require('path');
const sheets = {};
function sheet(name) {
  if (!sheets[name]) sheets[name] = [];
  const rows = sheets[name];
  return {
    getLastRow: function () { return rows.length + 1; },
    appendRow: function (row) { rows.push(row.map(String)); },
    getRange: function (r, c, n) {
      return { getValues: function () { return rows.slice(r - 2, r - 2 + (n || 1)).map(function (x) { return x.slice(); }); } };
    }
  };
}
const players = {
  p1: { id: 'p1', name: 'Alex Sample', num: '9', active: true },
  p2: { id: 'p2', name: 'Blair Sample', num: '4', active: true }
};
const outbound = [];
const ctx = {
  tab_: sheet,
  players_: function () { return players; },
  clean_: function (v, n) { return String(v || '').replace(/[<>]/g, '').slice(0, n || 80); },
  auth_: function (code) { if (code !== 'coach-test') throw new Error('That code did not work.'); },
  Utilities: { getUuid: function () { return 'id-' + (sheets.ShareBox || []).length + '-xxxx'; } },
  UrlFetchApp: { fetch: function (u) { outbound.push(String(u)); } },
  Date: Date, JSON: JSON, String: String, Object: Object
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../../docs/r108-share-addon.gs'), 'utf8'), ctx);
let ok = 0, bad = 0;
const T = function (n, c) { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };
function call(src) { try { return { v: vm.runInContext(src, ctx) }; } catch (e) { return { e: e.message }; } }

let sent = call("shareSend_({code:'coach-test',kind:'shape',ref:'352',title:'Our 352 in 3D',path:'/shape/index.html',pids:['p1']})");
T('coach send stores the item for that player', sent.v && sent.v.sent === true && sent.v.n === 1 && sheets.ShareBox[0][1] === 'p1' && sheets.ShareBox[0][2] === 'shape');
T('the private code is not stored', !JSON.stringify(sheets.ShareBox).includes('coach-test'));
let mine = call("shareFor_('p1')");
T('the linked player can read the item', mine.v && mine.v.rows[0].title === 'Our 352 in 3D' && mine.v.rows[0].path === '/shape/index.html');
let other = call("shareFor_('p2')");
T('another family cannot read it', other.v && other.v.rows.length === 0);
let steal = call("shareFamilySend_('p2','parent',{kind:'shape',title:'Our 352 in 3D',path:'/shape/index.html',pids:['p1']})");
T('a parent cannot send to another family', /own player/.test(steal.e || '') && sheets.ShareBox.length === 1);
let own = call("shareFamilySend_('p2','parent',{kind:'guide',title:'Touchline tour',path:'/guide.html'})");
T('a parent can send only to their own player', own.v && own.v.n === 1 && sheets.ShareBox[1][1] === 'p2');
let blocked = call("shareSend_({code:'coach-test',kind:'cv',title:'Paid pack',path:'/shape/index.html',pids:['p1']})");
T('a restricted item is refused', /cannot be sent/.test(blocked.e || '') && sheets.ShareBox.length === 2);
let welfare = call("shareSend_({code:'coach-test',kind:'shape',title:'Notes',path:'/welfare.html',pids:['p1']})");
T('a welfare path is refused', /cannot be sent/.test(welfare.e || ''));
let stranger = call("shareSend_({code:'nope',kind:'shape',title:'Our 352 in 3D',path:'/shape/index.html',pids:['p1']})");
T('an unknown code cannot send', /did not work/.test(stranger.e || ''));
T('nothing was sent off the script', outbound.length === 0);
const src = fs.readFileSync(path.resolve(__dirname, '../../docs/r108-share-addon.gs'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
T('the addon does not call the assistant', !/claude_|UrlFetchApp/.test(src));

console.log(ok + ' passed, ' + bad + ' failed');
process.exit(bad ? 1 : 0);
