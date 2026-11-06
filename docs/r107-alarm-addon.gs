/**
 * Touchline r107 additive patch for the assembled live script (v37_release).
 *
 * v37_release means production v36 plus the r104 travel addon and the r105
 * man of the match addon (blob 3ea97b37877d11ad411242c5984598418ddc1e2d).
 * Do not replace that script. Do not paste docs/Code_v33.gs, docs/Code_v32.gs
 * or an older full snapshot. Leave travel.send, travel.list, the motm
 * actions, consentList_ and every existing function as they are.
 *
 * What this adds: one suggested wake-up time for a player, saved by a parent
 * code that is already linked to that player. It is a preference. It does
 * not create a phone alarm, does not arm the in-app sound, and does not
 * call the clock app.
 *
 * How to apply, on a private copy of v37_release:
 * 1. Open the existing fam_ function. It already calls famAuth_(b.code),
 *    which turns the signed-in code into one player id and a role. Before
 *    the throw new Error('Unknown action') at the end of fam_, add only:
 *
 *      if (b.action === 'f.alarm.get') return alarmPrefGet_(pid, role);
 *      if (b.action === 'f.alarm.set') return alarmPrefSet_(pid, role, b);
 *
 *    Do not add these lines in doPost next to alert.send. That branch is
 *    for coaches. Do not add a second fam_ function. Do not let the request
 *    choose a player id. pid and role come only from famAuth_.
 *
 * 2. Paste the functions below at the end of the script. They call tab_,
 *    which v36 already has. Do not paste a replacement for tab_.
 *
 * 3. Deploy: Manage deployments, edit the current web app, New version.
 *    Do not create a new deployment. The AlarmPref sheet is created the
 *    first time a parent saves a time. There is no setup function and no
 *    rewrite of existing rows.
 *
 * The row is keyed by the player id from the Families code map. The private
 * code is not stored. A parent can read and write only the player that
 * their own code maps to. The matching player code can read that same time
 * and cannot write it. Any other code fails closed. The reply is the time,
 * the zone Europe/London, and the flags armed:false and device:false.
 * It never includes a code, and this patch does not send the time to the
 * assistant.
 */

function alarmPrefTab_() {
  return tab_('AlarmPref', ['playerId', 'time', 'zone', 'at']);
}

function alarmPrefTime_(v) {
  var m = /^(\d{2}):(\d{2})$/.exec(String(v || '').trim());
  if (!m) throw new Error('Use a 24 hour time, such as 07:15.');
  if (+m[1] > 23 || +m[2] > 59) throw new Error('Use a 24 hour time, such as 07:15.');
  return m[1] + ':' + m[2];
}

function alarmPrefRead_(pid) {
  var sh = alarmPrefTab_(), last = sh.getLastRow();
  if (last < 2) return { row: 0, time: '' };
  var rows = sh.getRange(2, 1, last - 1, 4).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(pid)) return { row: i + 2, time: String(rows[i][1] || '') };
  }
  return { row: 0, time: '' };
}

function alarmPrefShape_(time) {
  return { time: time || '', zone: 'Europe/London', kind: 'preference', armed: false, device: false };
}

function alarmPrefGet_(pid, role) {
  if (role !== 'parent' && role !== 'player') throw new Error('That code did not work.');
  var hit = alarmPrefRead_(pid);
  var time = /^\d{2}:\d{2}$/.test(hit.time) ? hit.time : '';
  return alarmPrefShape_(time);
}

function alarmPrefSet_(pid, role, b) {
  if (role !== 'parent') throw new Error('Only a parent can save a suggested time. The player confirms it on his own phone.');
  var time = (b && b.clear) ? '' : alarmPrefTime_(b && b.time);
  var hit = alarmPrefRead_(pid);
  var now = String(Date.now());
  if (hit.row) alarmPrefTab_().getRange(hit.row, 1, 1, 4).setValues([[String(pid), time, 'Europe/London', now]]);
  else alarmPrefTab_().appendRow([String(pid), time, 'Europe/London', now]);
  var out = alarmPrefShape_(time);
  out.saved = true;
  return out;
}
