/**
 * Respect code sign off and the "My data" page (welfare P3).
 * Add as a file in the Apps Script project (File, New, Script file, name it mydata).
 * Then add the dispatcher lines shown in Code.gs and Deploy, Manage deployments, edit, New version.
 * The monthly clean up (consentInstallTrigger_ in consent.gs) also clears old Respect rows.
 *
 * RESPECT: once a season each parent reads the FA Respect code for spectators and parents/carers and taps
 * "I agree". A player can sign the players' code too, but it is optional and nobody chases them.
 * Stores only: child id, season, parent or player, the name typed, the date. Resets every season.
 *
 * MY DATA: a parent can see what is held about their own child, download it, and ask for it to be deleted.
 * The download holds only that child's own entries. It leaves out coach notes, marks and welfare records,
 * which the club gives on request. A deletion request lands in a coach queue; nothing is deleted until a
 * coach reviews it and taps Erase. Squad registration is a separate step the coaches do themselves.
 */
var RESP_HEAD_ = ['pid', 'season', 'who', 'name', 'date'];
var REQ_HEAD_ = ['id', 'pid', 'num', 'kind', 'at', 'status', 'note', 'doneAt'];
function respTab_() { return tab_('Respect', RESP_HEAD_); }
function reqTab_() { return tab_('DataRequests', REQ_HEAD_); }
function respSeason_() { return typeof consentSeason_ === 'function' ? consentSeason_() : String(new Date().getFullYear()); }
function myRows_(sh, n) { var last = sh.getLastRow(); return last < 2 ? [] : sh.getRange(2, 1, last - 1, n).getValues().map(function (r, i) { r.row = i + 2; return r; }); }

/** Parent or player. This season's sign off for their own child. */
function respectGet_(pid, role) {
  var s = respSeason_(), who = role === 'player' ? 'player' : 'parent', hit = null;
  myRows_(respTab_(), 5).forEach(function (r) { if (String(r[0]) === pid && String(r[1]) === s && String(r[2]) === who) hit = r; });
  return { season: s, who: who, signed: hit ? { name: String(hit[3]), date: String(hit[4]).slice(0, 10) } : null };
}
function respectSign_(pid, role, me, b) {
  rate_('rs_' + pid, 8, 3600);
  var s = respSeason_(), who = role === 'player' ? 'player' : 'parent';
  var name = who === 'player' ? String(me.name || '').trim().split(/\s+/)[0] : clean_(b.name, 60);
  if (name.length < 2) throw new Error('Type your name to sign.');
  var today = Utilities.formatDate(new Date(), 'Europe/London', 'yyyy-MM-dd'), sh = respTab_(), hit = null;
  myRows_(sh, 5).forEach(function (r) { if (String(r[0]) === pid && String(r[1]) === s && String(r[2]) === who) hit = r; });
  var vals = [[pid, s, who, name, today].map(String)];
  (hit ? sh.getRange(hit.row, 1, 1, 5) : sh.getRange(sh.getLastRow() + 1, 1, 1, 5)).setNumberFormat('@').setValues(vals);
  return { ok: true };
}
/** Coach only. Who has signed this season and who is outstanding (parents). */
function respectList_() {
  var s = respSeason_(), pl = players_(), signed = {}, rows = [];
  myRows_(respTab_(), 5).forEach(function (r) {
    if (String(r[1]) !== s) return;
    rows.push({ pid: String(r[0]), who: String(r[2]), name: String(r[3]), date: String(r[4]).slice(0, 10) });
    if (String(r[2]) === 'parent') signed[String(r[0])] = 1;
  });
  var out = Object.keys(pl).filter(function (pid) { return !signed[pid]; }).map(function (pid) { return { pid: pid, num: String(pl[pid].num || '') }; });
  return { season: s, signed: rows, outstanding: out };
}

/** Parent only. Everything the family app holds that this child or family entered. */
function myDataGet_(pid, role) {
  if (role !== 'parent') throw new Error('The data page is for parents.');
  var pl = players_()[pid] || {}, d = allDocs_().players[pid] || {};
  var self = selfAll_()[pid] || {};
  var out = {
    generated: new Date().toISOString(), note: 'This is what the Touchline family app holds that you or your child entered, or that the club uses to show you things. Coach notes, marks and welfare records are not in this file. Ask Tim for a full copy if you want one.',
    player: { name: String(d.name || pl.name || ''), shirt: String(d.num || pl.num || ''), fan: String(d.fan || ''), dob: String(d.dob || ''), positions: d.pos || [], objectives: d.objOn ? String(d.obj || '') : '' },
    profile: { nickname: self.nick || '', foot: self.foot || '', positions: self.pos || [] },
    answers: answers_().filter(function (r) { return String(r.playerId) === pid; }).map(function (r) { return { post: String(r.postId), answer: String(r.answer) }; }),
    photoConsent: null, goals: [], respect: [], libraryGiven: [], headInjury: []
  };
  var s = respSeason_();
  if (typeof consentRows_ === 'function') consentRows_().forEach(function (r) { if (r.pid === pid && r.season === s) out.photoConsent = { season: r.season, photo: r.photo, contact1: r.c1, contact2: r.c2, note: r.med }; });
  if (typeof goalRows_ === 'function') goalRows_().forEach(function (r) { if (r.pid === pid) out.goals.push({ season: r.season, halfTerm: r.ht, corner: r.corner, goal: r.txt, status: r.status, review: r.review }); });
  myRows_(respTab_(), 5).forEach(function (r) { if (String(r[0]) === pid) out.respect.push({ season: String(r[1]), who: String(r[2]), name: String(r[3]), date: String(r[4]).slice(0, 10) }); });
  if (typeof libGiveTab_ === 'function') myRows_(libGiveTab_(), 7).forEach(function (r) { if (String(r[0]) === pid) out.libraryGiven.push({ item: String(r[1]), tried: String(r[5]) === 'yes' }); });
  if (typeof concRows_ === 'function') concRows_().forEach(function (r) { if (r.pid === pid) out.headInjury.push({ injured: r.inj, stagesConfirmed: r.st, returned: r.closed }); });
  return out;
}
/** Parent only. Asks for the child's app data to be deleted. One open request at a time. */
function myDataDelete_(pid, role, me) {
  if (role !== 'parent') throw new Error('Only a parent can ask for this.');
  rate_('md_' + pid, 3, 86400);
  var sh = reqTab_(), open = false;
  myRows_(sh, 8).forEach(function (r) { if (String(r[1]) === pid && String(r[5]) === 'open') open = true; });
  if (open) return { ok: true, already: true };
  sh.appendRow([Utilities.getUuid().slice(0, 8), pid, String(me.num || ''), 'delete', Date.now(), 'open', '', '']);
  try { notify_('Data request', 'Shirt ' + String(me.num || '') + ': a parent has asked for their data to be deleted. See Team, Privacy.', 'normal'); } catch (e) {}
  return { ok: true };
}
function myDataReqs_(pid) {
  return myRows_(reqTab_(), 8).filter(function (r) { return String(r[1]) === pid; }).map(function (r) { return { at: Number(r[4]) || 0, status: String(r[5]), note: String(r[6]) }; }).slice(-3);
}
/** Coach only. The queue. */
function dataReqList_() {
  return { rows: myRows_(reqTab_(), 8).map(function (r) { return { id: String(r[0]), pid: String(r[1]), num: String(r[2]), kind: String(r[3]), at: Number(r[4]) || 0, status: String(r[5]), note: String(r[6]), doneAt: Number(r[7]) || 0 }; }).slice(-60) };
}
/** Coach only. Erases what the family app holds for the child, then closes the request. Squad registration is untouched. */
function dataErase_(b) {
  var id = String(b.id || ''), req = null;
  myRows_(reqTab_(), 8).forEach(function (r) { if (String(r[0]) === id) req = r; });
  if (!req) throw new Error('Request not found.');
  if (String(req[5]) !== 'open') throw new Error('That request is already closed.');
  var pid = String(req[1]), gone = 0;
  [['Consent', 1], ['Goals', 2], ['Respect', 1], ['Answers', 2], ['Self', 1], ['FtMarks', 1], ['Photos', 1], ['LibReq', 3], ['LibGive', 1]].forEach(function (t) {
    var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SSID')), sh = ss.getSheetByName(t[0]);
    if (!sh || sh.getLastRow() < 2) return;
    var vals = sh.getRange(2, t[1], sh.getLastRow() - 1, 1).getValues();
    for (var i = vals.length - 1; i >= 0; i--) { if (String(vals[i][0]) === pid) { sh.deleteRow(i + 2); gone++; } }
  });
  /* A head injury record is only removed once the plan is complete, never in the middle of one. */
  if (typeof concRows_ === 'function') { var csh = concTab_(); concRows_().reverse().forEach(function (r) { if (r.pid === pid && r.closed) { csh.deleteRow(r.row); gone++; } }); }
  var sh2 = reqTab_(), row = null; myRows_(sh2, 8).forEach(function (r) { if (String(r[0]) === id) row = r; });
  sh2.getRange(row.row, 6, 1, 3).setValues([['done', clean_(b.note, 140) || 'Erased', Date.now()]]);
  tab_('RetentionLog', ['at', 'what', 'count']).appendRow([new Date(), 'Erased on parent request (shirt ' + String(req[2]) + ')', gone]);
  return { ok: true, removed: gone };
}
/** Coach only. Close a request without erasing (for example the parent changed their mind). */
function dataReqClose_(b) {
  var id = String(b.id || ''), row = null;
  myRows_(reqTab_(), 8).forEach(function (r) { if (String(r[0]) === id) row = r; });
  if (!row) throw new Error('Request not found.');
  reqTab_().getRange(row.row, 6, 1, 3).setValues([['closed', clean_(b.note, 140) || 'Closed', Date.now()]]);
  return { ok: true };
}
/** Run by the monthly job. Respect sign offs reset each season. */
function respectPurge_() {
  var s = respSeason_(), sh = respTab_(), rows = myRows_(sh, 5), gone = 0;
  for (var i = rows.length - 1; i >= 0; i--) { if (String(rows[i][1]) !== s) { sh.deleteRow(rows[i].row); gone++; } }
  if (gone) tab_('RetentionLog', ['at', 'what', 'count']).appendRow([new Date(), 'Respect sign offs from earlier seasons', gone]);
  return gone;
}
