/**
 * Touchline r104 additive patch for the live Apps Script (production v36).
 *
 * Do not replace the live project with any full script from this repo.
 * docs/Code_v33.gs and docs/Code_v37.gs are old snapshots. Deploying either
 * would drop later production behaviour:
 *   v34  fav.list, fav.set, fav.del, CoachFav sheet
 *   v35  man of the match automation, setupRelease100Motm
 *   v36  Events.askAtt, f.ev.answer, setupRelease102
 * Leave every existing function and every existing doPost action as it is.
 *
 * How to apply, on a private copy of the real v36 script:
 * 1. In doPost, find the existing line that handles alert.send. It already
 *    sits after auth_(b.code), so only a coach code can reach it. Immediately
 *    AFTER that line, and before the unknown-action error, add only these two
 *    lines. Do not edit the alert.send line. Do not put these actions on the
 *    f. family branch (that branch runs before auth_).
 *
 *      if (b.action === 'travel.send') return out_({ ok: true, data: travelSend_(b) });
 *      if (b.action === 'travel.list') return out_({ ok: true, data: { rows: travelList_() } });
 *
 * 2. Paste the four functions below at the end of the script. They are new
 *    names (travelTab_, travelLine_, travelSend_, travelList_). They call
 *    helpers that v36 already has: tab_, clean_, today_, notify_. Do not
 *    paste replacements for those helpers.
 *
 * 3. notify_ is the coach Pushover alert (Tim and Deano script properties).
 *    This patch does not call pushBody_, so it does not web-push families.
 *    It does not read or write squad rows, contacts, or secrets.
 *
 * 4. Deploy: Manage deployments, edit the current web app, New version.
 *    Do not create a new deployment.
 *
 * Until this is deployed, the coach app sends a travel note with the existing
 * alert.send action only. That is the same coach phone alert. The app does
 * not pretend a shared travel list exists.
 */

function travelTab_() {
  return tab_('Travel', ['id', 'by', 'kind', 'mins', 'text', 'date', 'at']);
}

function travelLine_(kind, mins, text, by) {
  if (kind === 'late') return by + ' is running late' + (mins ? ', about ' + mins + ' minutes' : '') + '.';
  if (kind === 'traffic') return by + ' is stuck in traffic.';
  if (kind === 'cant') return by + ' cannot make it.';
  return by + ': ' + (text || 'Travel note');
}

function travelSend_(b) {
  var kind = clean_(b.kind, 16);
  if (kind !== 'late' && kind !== 'traffic' && kind !== 'cant' && kind !== 'custom') throw new Error('Pick a travel option.');
  var mins = String(b.mins || '').replace(/\D/g, '').slice(0, 3);
  var text = clean_(b.text, 180);
  var by = clean_(b.by, 20) || 'Coach';
  if (by !== 'Tim' && by !== 'Deano' && by !== 'Coach') by = 'Coach';
  if (kind === 'custom' && text.length < 2) throw new Error('Add a short note.');
  if (kind === 'late' && !mins) mins = '15';
  var date = clean_(b.date, 12) || today_();
  var id = clean_(b.id, 40) || ('T' + Date.now().toString(36));
  var msg = travelLine_(kind, mins, text, by);
  travelTab_().appendRow([id, by, kind, mins, text, date, String(Date.now())]);
  var r = notify_('Travel', msg, kind === 'cant' ? 'urgent' : 'normal');
  return { ok: true, id: id, sent: r.sent, text: msg, coachesOnly: true };
}

function travelList_() {
  var sh = travelTab_(), last = sh.getLastRow(), t = today_(), out = [];
  if (last < 2) return out;
  var rows = sh.getRange(2, 1, last - 1, 7).getValues();
  for (var i = rows.length - 1; i >= 0 && out.length < 20; i--) {
    var r = rows[i];
    if (String(r[5] || '') !== t) continue;
    out.push({
      id: String(r[0] || ''),
      by: String(r[1] || ''),
      kind: String(r[2] || ''),
      mins: String(r[3] || ''),
      text: String(r[4] || ''),
      date: String(r[5] || ''),
      at: Number(r[6]) || 0,
      line: travelLine_(String(r[2] || ''), String(r[3] || ''), String(r[4] || ''), String(r[1] || 'Coach'))
    });
  }
  return out;
}
