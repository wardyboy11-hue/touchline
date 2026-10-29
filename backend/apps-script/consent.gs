/**
 * Photo consent and emergency card (welfare P0).
 * Add as a file in the Apps Script project (File, New, Script file, name it consent).
 * Then add the dispatcher lines shown in Code.gs and Deploy, Manage deployments, edit, New version.
 * Run consentInstallTrigger_ once to switch on the monthly clean up.
 *
 * What it stores, per child per season: photo choice, up to two emergency contacts (name, phone,
 * relationship) and one optional note the parent chooses to share. Nothing else. No diagnoses.
 * Who sees it: the linked parent (their own child only) and coaches. Never players, never other parents.
 * It lives in the restricted Consent tab of this Sheet. Never in the repo, never in a push alert.
 * Retention: rows from an earlier season are deleted by the monthly job, and the job logs the count.
 */
var CONSENT_HEAD_ = ['pid', 'season', 'photo', 'c1n', 'c1p', 'c1r', 'c2n', 'c2p', 'c2r', 'med', 'at'];
function consentTab_() { return tab_('Consent', CONSENT_HEAD_); }

/** Season runs 1 July to 30 June, written 2026/27. */
function consentSeason_() {
  var d = new Date(), y = Number(Utilities.formatDate(d, 'Europe/London', 'yyyy')), m = Number(Utilities.formatDate(d, 'Europe/London', 'M'));
  var s = m >= 7 ? y : y - 1;
  return s + '/' + String(s + 1).slice(2);
}
function consentRows_() {
  var sh = consentTab_(), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, CONSENT_HEAD_.length).getValues().map(function (r, i) {
    return { row: i + 2, pid: String(r[0]), season: String(r[1]), photo: String(r[2]), c1: { n: String(r[3]), p: String(r[4]), r: String(r[5]) }, c2: { n: String(r[6]), p: String(r[7]), r: String(r[8]) }, med: String(r[9]), at: Number(r[10]) || 0 };
  });
}
function consentPhone_(v) {
  var s = String(v || '').replace(/[^0-9+() -]/g, '').trim();
  if (s && (s.replace(/\D/g, '').length < 7 || s.length > 20)) throw new Error('Check that phone number.');
  return s;
}

/** Parent only. Their own child's current season card, or null. */
function consentGet_(pid, role) {
  if (role !== 'parent') throw new Error('The consent card is for parents.');
  var s = consentSeason_(), hit = null;
  consentRows_().forEach(function (r) { if (r.pid === pid && r.season === s) hit = r; });
  return { season: s, card: hit ? { photo: hit.photo, c1: hit.c1, c2: hit.c2, med: hit.med, at: hit.at } : null };
}

/** Parent only. Saves or replaces this season's card for their own child. */
function consentSave_(pid, role, b) {
  if (role !== 'parent') throw new Error('The consent card is for parents.');
  rate_('cn_' + pid, 12, 3600);
  var photo = String(b.photo || '');
  if (['yes', 'team', 'no'].indexOf(photo) < 0) throw new Error('Choose a photo option.');
  var c1 = { n: clean_(b.c1n, 60), p: consentPhone_(b.c1p), r: clean_(b.c1r, 30) };
  var c2 = { n: clean_(b.c2n, 60), p: consentPhone_(b.c2p), r: clean_(b.c2r, 30) };
  if (!c1.n || !c1.p) throw new Error('Add a name and phone number for the first emergency contact.');
  if ((c2.n && !c2.p) || (!c2.n && c2.p)) throw new Error('Add both a name and a phone number for the second contact, or leave both empty.');
  var med = clean_(b.med, 300), s = consentSeason_(), now = Date.now();
  var row = [pid, s, photo, c1.n, c1.p, c1.r, c2.n, c2.p, c2.r, med, now];
  var sh = consentTab_(), hit = null;
  consentRows_().forEach(function (r) { if (r.pid === pid && r.season === s) hit = r; });
  var rng = hit ? sh.getRange(hit.row, 1, 1, row.length) : sh.getRange(sh.getLastRow() + 1, 1, 1, row.length);
  rng.setNumberFormat('@').setValues([row.map(String)]);
  return { ok: true, season: s, at: now };
}

/** Coach only. Everyone's current season card, for the offline emergency card. */
function consentList_() {
  var s = consentSeason_();
  return { season: s, at: Date.now(), rows: consentRows_().filter(function (r) { return r.season === s; }).map(function (r) {
    return { pid: r.pid, photo: r.photo, c1: r.c1, c2: r.c2, med: r.med, at: r.at };
  }) };
}

/** Shirt numbers whose parent chose "no photos" this season. Used to hide tagged pictures from families. */
function consentNoShirts_() {
  var s = consentSeason_(), no = {}, out = [];
  consentRows_().forEach(function (r) { if (r.season === s && r.photo === 'no') no[r.pid] = 1; });
  var pl = players_();
  Object.keys(no).forEach(function (pid) { if (pl[pid] && pl[pid].num) out.push(String(pl[pid].num)); });
  return out;
}

/** Monthly job. Deletes every row from an earlier season and logs how many went. */
function consentPurgeJob_() {
  var s = consentSeason_(), sh = consentTab_(), rows = consentRows_(), gone = 0;
  for (var i = rows.length - 1; i >= 0; i--) { if (rows[i].season !== s) { sh.deleteRow(rows[i].row); gone++; } }
  if (gone) tab_('RetentionLog', ['at', 'what', 'count']).appendRow([new Date(), 'Consent cards from earlier seasons', gone]);
  return gone;
}
/** Run this once from the editor to switch the monthly clean up on. */
function consentInstallTrigger_() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'consentPurgeJob_') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('consentPurgeJob_').timeBased().onMonthDay(1).atHour(4).create();
}
