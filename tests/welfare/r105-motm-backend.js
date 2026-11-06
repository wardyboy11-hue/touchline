/* r105: man of the match close. Synthetic players only. No live sheet. */
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
  p2: { id: 'p2', name: 'Blair Sample', num: '4', active: true },
  p3: { id: 'p3', name: 'Casey Sample', num: '11', active: true },
  p4: { id: 'p4', name: 'Drew Sample', num: '2', active: true },
  p5: { id: 'p5', name: 'Eden Sample', num: '6', active: true }
};
let votes = [];
const photos = {};
const consent = [];
const outbound = [];
let consentMode = 'list';
const ctx = {
  tab_: sheet,
  players_: function () { return players; },
  votes_: function () { return votes.slice(); },
  allDocs_: function () { return { matches: [{ id: 'fx1', date: '2026-11-07', opp: 'Rivals Athletic', status: 'done' }] }; },
  photo_: function (id) { return photos[id] || ''; },
  consentList_: function () {
    if (consentMode === 'throw') throw new Error('sheet down');
    if (consentMode === 'missing') throw new Error('consentList_ should not be called when it is removed');
    return { season: '2026/27', at: 1, rows: consent.slice() };
  },
  UrlFetchApp: { fetch: function (url, opt) { outbound.push(String(url) + '\n' + JSON.stringify(opt || {})); return { getResponseCode: function () { return 200; }, getContentText: function () { return '{}'; } }; } },
  auth_: function (code) { if (code !== 'coach-test') throw new Error('That code did not work.'); },
  Utilities: { getUuid: function () { return 'id-' + (sheets.MotmAward || []).length + '-xxxx'; } },
  Date: Date, JSON: JSON, Math: Math, String: String, Object: Object, Number: Number
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../../docs/r105-motm-addon.gs'), 'utf8'), ctx);
let ok = 0, bad = 0;
const T = function (n, c) { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };
function call(src) { try { return { v: vm.runInContext(src, ctx) }; } catch (e) { return { e: e.message }; } }
function seedFamilies(ids) {
  sheets.Families = ids.map(function (id, i) { return ['CODE' + i, id, '1', 'parent']; });
}
function awardCount() { return (sheets.MotmAward || []).length; }
function auditCount() { return (sheets.MotmAudit || []).length; }

let cand = call("motmCand_({id:'p1',name:'Alex Sample',num:'9'})");
if (!cand.v) console.log('cand error', cand.e);
T('ballot label is name and number', cand.v && cand.v.name === 'Alex Sample' && cand.v.num === '9');

sheets.Families = [];
let off = call("motmClose_({code:'coach-test',matchId:'fx1',mode:'auto'})").v;
T('auto stays off with no parent codes', off && off.auto === false && off.closed === false && /Squad size is not used/.test(off.reason));
T('auto off writes no award', awardCount() === 0);

seedFamilies(['p1', 'p2', 'p3', 'p4']);
votes = [{ kind: 'motm', key: 'fx1', voter: 'parent:p1', cand: 'p2' }];
let wait = call("motmClose_({code:'coach-test',matchId:'fx1',mode:'auto'})").v;
T('auto waits for every parent code', wait && wait.closed === false && wait.need === 4 && wait.have === 1);
T('voter count is parent codes, not the squad size', wait.need === 4 && Object.keys(players).length === 5);

votes = [
  { kind: 'motm', key: 'fx1', voter: 'parent:p1', cand: 'p2' },
  { kind: 'motm', key: 'fx1', voter: 'parent:p2', cand: 'p2' },
  { kind: 'motm', key: 'fx1', voter: 'parent:p3', cand: 'p2' },
  { kind: 'motm', key: 'fx1', voter: 'coach', cand: 'p1' }
];
let early = call("motmClose_({code:'coach-test',matchId:'fx1',mode:'auto'})").v;
T('missing parent blocks auto even if a coach has voted', early.have === 3 && early.need === 4 && early.closed === false);

votes.push({ kind: 'motm', key: 'fx1', voter: 'parent:p4', cand: 'p1' });
let won = call("motmClose_({code:'coach-test',matchId:'fx1',mode:'auto'})").v;
T('all parent votes close on the leading name', won.closed === true && won.winnerName === 'Blair Sample' && won.winnerNum === '4' && won.dateUK === '7 November 2026');
T('coach vote did not decide it', won.winnerId === 'p2');
let n1 = awardCount();
let won2 = call("motmClose_({code:'coach-test',matchId:'fx1',mode:'manual'})").v;
T('second close is the same award', won2.repeat === true && won2.id === won.id && awardCount() === n1);
T('repeat is audited', auditCount() > 0 && sheets.MotmAudit.some(function (r) { return r[2] === 'close-repeat'; }));
votes.forEach(function (v) { if (v.key === 'fx1' && String(v.voter).indexOf('parent:') === 0) v.cand = 'p1'; });
let blockedChange = call("motmClose_({code:'coach-test',matchId:'fx1',mode:'manual'})");
T('a different winner is refused while closed', /Reopen/.test(blockedChange.e || ''));
T('the stored winner is unchanged', call("motmLatest_('fx1')").v.winnerId === 'p2');

let manualTieVotes = [
  { kind: 'motm', key: 'fx2', voter: 'parent:p1', cand: 'p2' },
  { kind: 'motm', key: 'fx2', voter: 'parent:p2', cand: 'p3' }
];
votes = votes.concat(manualTieVotes);
seedFamilies(['p1', 'p2']);
let tie = call("motmClose_({code:'coach-test',matchId:'fx2',mode:'manual'})").v;
T('tie has no winner', tie.tie === true && tie.closed === false && tie.tied.length === 2);
T('tie writes no award', !sheets.MotmAward.some(function (r) { return r[1] === 'fx2' && (r[4] === 'closed' || r[4] === 'resolved'); }));
T('resolve refuses a player who is not tied', /tied players/.test(call("motmClose_({code:'coach-test',matchId:'fx2',mode:'resolve',winnerId:'p1'})").e || ''));
let resolved = call("motmClose_({code:'coach-test',matchId:'fx2',mode:'resolve',winnerId:'p3'})").v;
T('coach picks one tied player', resolved.closed === true && resolved.status === 'resolved' && resolved.winnerName === 'Casey Sample');
let n2 = sheets.MotmAward.filter(function (r) { return r[1] === 'fx2'; }).length;
call("motmClose_({code:'coach-test',matchId:'fx2',mode:'resolve',winnerId:'p3'})");
T('resolve twice does not add another award', sheets.MotmAward.filter(function (r) { return r[1] === 'fx2'; }).length === n2);

let re = call("motmReopen_({code:'coach-test',matchId:'fx2'})").v;
T('reopen keeps history', re.reopened === true && sheets.MotmAward.filter(function (r) { return r[1] === 'fx2' && r[4] === 'reopened'; }).length === 1);
let again = call("motmClose_({code:'coach-test',matchId:'fx2',mode:'resolve',winnerId:'p2'})").v;
T('correct after reopen records the new winner', again.winnerId === 'p2' && again.repeat !== true);

let list = call("motmAwards_({code:'coach-test'})").v;
T('awards list is coach data with no player of the year', list.playerOfYear === null && list.fixtures.some(function (f) { return f.matchId === 'fx1' && f.winnerNum === '4'; }));
T('season total counts the latest result only', list.seasons.some(function (s) { return s.season === '2026/27' && s.players.some(function (p) { return p.id === 'p2' && p.n >= 1; }); }));
T('family code cannot read awards', /code did not work/.test(call("motmAwards_({code:'parent-test'})").e || ''));
T('family code cannot close', /code did not work/.test(call("motmClose_({code:'parent-test',matchId:'fx1',mode:'manual'})").e || ''));

const jpeg = 'data:image/jpeg;base64,' + 'abc'.repeat(20);
photos.p2 = jpeg;
consent.push({ pid: 'p2', photo: 'yes', med: 'SECRET-NOTE', c1: { n: 'Pat', p: '07000999888', r: 'Mum' } });
let withPhoto = call("motmStatus_({code:'coach-test',matchId:'fx1'})").v;
if (!withPhoto || !withPhoto.award) console.log('photo status', withPhoto);
T('approved photo is the stored jpeg', withPhoto && withPhoto.award && withPhoto.award.photo === jpeg && withPhoto.award.photoLocal === false);
T('approved photo does not carry the consent card', !/SECRET-NOTE|07000999888/.test(JSON.stringify(withPhoto)));
consent[0].photo = 'team';
let teamPhoto = call("motmStatus_({code:'coach-test',matchId:'fx1'})").v;
T('team consent also selects the stored jpeg', teamPhoto.award.photo === jpeg && teamPhoto.award.photoLocal === false);
consent[0].photo = 'no';
let blocked = call("motmStatus_({code:'coach-test',matchId:'fx1'})").v;
T('rejected consent returns no photo', blocked.award && blocked.award.photo === '' && blocked.award.photoLocal === false && /shirt number only/.test(blocked.award.photoNote));
T('a stored jpeg is not used after rejection', blocked.award.photo !== jpeg);
T('status hides who voted', !JSON.stringify(blocked).match(/parent:/));
consent.length = 0;
let missing = call("motmStatus_({code:'coach-test',matchId:'fx1'})").v;
T('missing consent fails closed', missing.award.photo === '' && missing.award.photoLocal === false && /No photo choice/.test(missing.award.photoNote));
photos.p2 = 'https://touchline.example/p2.jpg';
consent.push({ pid: 'p2', photo: 'yes' });
let remote = call("motmStatus_({code:'coach-test',matchId:'fx1'})").v;
T('a remote photo address is not used', remote.award.photo === '' && /no approved photo/i.test(remote.award.photoNote));
consentMode = 'throw';
let unread = call("motmStatus_({code:'coach-test',matchId:'fx1'})").v;
T('a consent read error fails closed', unread.award.photo === '' && unread.award.photoLocal === false && /could not be read/.test(unread.award.photoNote));
consentMode = 'missing';
ctx.consentList_ = undefined;
photos.p2 = jpeg;
let absent = call("motmStatus_({code:'coach-test',matchId:'fx1'})").v;
T('missing consent function does not use the stored photo', absent.award.photo === '' && absent.award.photoLocal === true && /not uploaded/.test(absent.award.photoNote));
T('no photo or private note was sent off the script', outbound.length === 0);
const addon = fs.readFileSync(path.resolve(__dirname, '../../docs/r105-motm-addon.gs'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
T('addon does not call the missing consent helpers', !/consentRows_\s*\(|consentSeason_\s*\(/.test(addon) && /consentList_\s*\(/.test(addon));
ctx.consentList_ = function () { return { season: '2026/27', rows: [{ pid: 'p2', photo: 'yes', med: 'SECRET-NOTE' }] }; };
photos.p2 = jpeg;
seedFamilies(['p1']);
votes.push({ kind: 'motm', key: 'fx9', voter: 'parent:p1', cand: 'p2' });
let auto = call("motmAuto_('fx9')").v;
T('automatic close does not hand a photo back', auto && auto.closed === true && auto.photo === '' && !/SECRET-NOTE|data:image/.test(JSON.stringify(auto)));
let coachStill = call("motmStatus_({code:'coach-test',matchId:'fx9'})").v;
T('the coach card still receives the approved photo', coachStill.award && coachStill.award.photo === jpeg);

console.log(ok + ' passed, ' + bad + ' failed');
process.exit(bad ? 1 : 0);
