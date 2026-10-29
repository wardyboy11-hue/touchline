/**
 * Suspected head injury log and graduated return to play (welfare P1).
 * Add as a file in the Apps Script project (File, New, Script file, name it concussion).
 * Then add the dispatcher lines shown in Code.gs and Deploy, Manage deployments, edit, New version.
 * The monthly clean up (consentInstallTrigger_ in consent.gs) also clears old records from here.
 *
 * Follows the UK wide concussion guidelines for grassroots sport: remove from play straight away,
 * 24 to 48 hours of relative rest, six stages, no stage shorter than a day, unrestricted training
 * only from day 15, and no return to competition before day 21 (children and teenagers can take longer).
 * This is a log and a checklist, not medical advice and not a clearance. If in doubt, sit them out.
 *
 * What it stores: player id, shirt, injury date, the date the parent confirmed each stage, and the
 * date the player became available again. No symptoms, no diagnosis, no notes.
 * Who sees it: coaches, and the linked parent for their own child. A player only ever sees "not available".
 * Retention: a record is deleted a year after the return date.
 */
var CONC_HEAD_ = ['id', 'pid', 'num', 'inj', 'st', 'closed', 'at'];
var CONC_MIN_ = { s5: 15, s6: 21 };
function concTab_() { return tab_('Concussion', CONC_HEAD_); }
function concToday_() { return Utilities.formatDate(new Date(), 'Europe/London', 'yyyy-MM-dd'); }
function concDays_(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000); }
function concDate_(v) { return v instanceof Date ? Utilities.formatDate(v, 'Europe/London', 'yyyy-MM-dd') : String(v || ''); }
function concRows_() {
  var sh = concTab_(), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, CONC_HEAD_.length).getValues().map(function (r, i) {
    var st = {}; try { st = JSON.parse(String(r[4] || '{}')) || {}; } catch (e) {}
    return { row: i + 2, id: String(r[0]), pid: String(r[1]), num: String(r[2]), inj: concDate_(r[3]), st: st, closed: concDate_(r[5]), at: Number(r[6]) || 0 };
  });
}
function concOut_(r) { return { id: r.id, pid: r.pid, num: r.num, inj: r.inj, st: r.st, closed: r.closed, at: r.at }; }
function concWrite_(sh, row, o) {
  var vals = [[o.id, o.pid, o.num, o.inj, JSON.stringify(o.st || {}), o.closed || '', o.at]];
  var rng = row ? sh.getRange(row, 1, 1, CONC_HEAD_.length) : sh.getRange(sh.getLastRow() + 1, 1, 1, CONC_HEAD_.length);
  rng.setNumberFormat('@').setValues(vals.map(function (a) { return a.map(String); }));
}
function concDay_(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) ? String(s) : ''; }

/** Coach only. Every record. */
function concList_() { return { at: Date.now(), rows: concRows_().map(concOut_) }; }

/** Coach only. Creates a record, or merges: confirmed stage dates only ever get added, closed only ever gets set. */
function concUpsert_(b) {
  var id = String(b.id || ''), pid = String(b.pid || '');
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(id) || !pid) throw new Error('Bad record.');
  var pl = players_(); if (!pl[pid]) throw new Error('Unknown player.');
  var inj = concDay_(b.inj); if (!inj) throw new Error('Bad injury date.');
  var sh = concTab_(), hit = null; concRows_().forEach(function (r) { if (r.id === id) hit = r; });
  var st = {}, closed = '';
  if (hit) { st = hit.st; closed = hit.closed; }
  if (!hit) { var o = { id: id, pid: pid, num: String(pl[pid].num || ''), inj: inj, st: {}, closed: '', at: Date.now() }; concWrite_(sh, 0, o); return { ok: true }; }
  var inSt = (b.st && typeof b.st === 'object') ? b.st : {};
  for (var k = 1; k <= 6; k++) { var d = concDay_(inSt[k]); if (d && !st[k]) st[k] = d; }
  if (!closed && concDay_(b.closed)) closed = concDay_(b.closed);
  hit.st = st; hit.closed = closed; concWrite_(sh, hit.row, hit);
  return { ok: true };
}
/** Coach only. Removes a record entered by mistake. Refused once a parent has confirmed a stage. */
function concVoid_(b) {
  var id = String(b.id || ''), sh = concTab_(), hit = null; concRows_().forEach(function (r) { if (r.id === id) hit = r; });
  if (!hit) return { ok: true };
  if (Object.keys(hit.st).length) throw new Error('A parent has already confirmed a stage, so this cannot be removed.');
  sh.deleteRow(hit.row); return { ok: true };
}

/** Parent: their child's open record with stage dates. Player: only that there is one. */
function concGet_(pid, role) {
  var open = null; concRows_().forEach(function (r) { if (r.pid === pid && !r.closed) open = r; });
  if (!open) return { open: false };
  if (role === 'player') return { open: true };
  var today = concToday_();
  return { open: true, id: open.id, inj: open.inj, st: open.st, day: concDays_(open.inj, today), min5: CONC_MIN_.s5, min6: CONC_MIN_.s6 };
}
function concNext_(rec) { var n = 1; while (rec.st[n]) n++; return n; }

/** Parent only. Confirms the next stage for their own child, if the rules allow it today. */
function concConfirm_(pid, role, b) {
  if (role !== 'parent') throw new Error('Only a parent can confirm a stage.');
  rate_('cc_' + pid, 10, 3600);
  var sh = concTab_(), rec = null; concRows_().forEach(function (r) { if (r.pid === pid && !r.closed) rec = r; });
  if (!rec) throw new Error('There is no open head injury record.');
  var k = concNext_(rec), want = Number(b.stage);
  if (want !== k || k > 6) throw new Error('Confirm the stages in order. The next one is stage ' + Math.min(k, 6) + '.');
  var today = concToday_(), day = concDays_(rec.inj, today);
  if (k === 1 && day < 1) throw new Error('Stage 1 is at least 24 hours of rest. Check back tomorrow.');
  if (k > 1 && concDays_(rec.st[k - 1], today) < 1) throw new Error('No stage should last less than a day. Come back tomorrow.');
  if (k === 5 && day < CONC_MIN_.s5) throw new Error('Training with possible head contact starts from day 15 at the earliest. It is day ' + day + '.');
  if (k === 6 && day < CONC_MIN_.s6) throw new Error('No return to matches before day 21. It is day ' + day + '.');
  rec.st[k] = today;
  if (k === 6 && day >= CONC_MIN_.s6) rec.closed = today;
  concWrite_(sh, rec.row, rec);
  try { notify_('Head injury plan', 'Shirt ' + rec.num + ': parent confirmed stage ' + k + (rec.closed ? ' and the plan is complete' : '') + '.', 'quiet'); } catch (e) {}
  return { ok: true, stage: k, closed: !!rec.closed };
}
/** Parent only. Symptoms are back: step back one stage. */
function concBack_(pid, role) {
  if (role !== 'parent') throw new Error('Only a parent can do this.');
  var sh = concTab_(), rec = null; concRows_().forEach(function (r) { if (r.pid === pid && !r.closed) rec = r; });
  if (!rec) throw new Error('There is no open head injury record.');
  var k = concNext_(rec) - 1;
  if (k >= 1) delete rec.st[k];
  concWrite_(sh, rec.row, rec);
  try { notify_('Head injury plan', 'Shirt ' + rec.num + ': parent says symptoms are back. Stepped back a stage.', 'normal'); } catch (e) {}
  return { ok: true };
}
/** Run by the monthly job. Deletes records closed more than a year ago. */
function concPurge_() {
  var sh = concTab_(), rows = concRows_(), gone = 0, today = concToday_();
  for (var i = rows.length - 1; i >= 0; i--) { if (rows[i].closed && concDays_(rows[i].closed, today) > 365) { sh.deleteRow(rows[i].row); gone++; } }
  if (gone) tab_('RetentionLog', ['at', 'what', 'count']).appendRow([new Date(), 'Head injury records a year after return', gone]);
  return gone;
}
