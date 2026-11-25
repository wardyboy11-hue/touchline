/**
 * Touchline r117 backend changes (Code_v39). NOT deployed. Tim must say yes first.
 *
 * The full file is kept off GitHub (this repo is public): /workspace/Code_v39.gs on the build box,
 * made from the live v38 source (clasp pull --versionNumber 38) with only the changes below.
 * Deploy: Manage deployments, edit the EXISTING deployment AKfycby3YUAg5Qnc..., New version.
 * Never New deployment. Never paste Code_v33.gs. Leave the other .gs files as they are.
 *
 * Changes in Code.gs:
 *   1. Replace feedSend_, feedList_ and feedFor_ with the versions below, and add shareGuard_.
 *   2. In fam_: f.feed passes the role:  if (b.action === 'f.feed') return { rows: feedFor_(pid, role) };
 *   3. In doPost, coach branch, under feed.send add:
 *        if (b.action === 'share.caps') return out_({ ok: true, data: { v: 39, aud: ['team', 'players', 'parents'], guard: true, prompts: true } });
 *   4. Add coachPromptRun_ and setupRelease117Prompts at the end. Run setupRelease117Prompts() once only after Tim says yes.
 *
 * Safety: parents only items never reach a player code. Ratings, coach notes, attitude, welfare, medical,
 * Coaches' Voice and coach only items are refused on the server. Prompts go to Tim and Deano only, no names.
 */
/* r117: what can never be shared with players or parents. Checked here, on the server, whatever the app sends. */
var SHARE_BLOCK_KINDS_ = ['coach', 'coachonly', 'coach-only', 'rating', 'ratings', 'coachnote', 'coachnotes', 'notes-coach', 'attitude', 'welfare', 'niggle', 'medical', 'health', 'injury', 'concussion', 'consent', 'marks', 'fm', 'scoutpriv', 'selection', 'review', 'rev', 'reflect'];
function shareGuard_(it) {
  it = it || {};
  var kind = String(it.kind || 'link').toLowerCase();
  if (it.coachOnly === true || it.coachOnly === 1 || it.coachOnly === '1') throw new Error('Coach only. This cannot be shared with players or parents.');
  if (SHARE_BLOCK_KINDS_.indexOf(kind) > -1) throw new Error('Ratings, coach notes, welfare and medical items stay with the coaches. Not sent.');
  var u = String(it.u || '');
  if (/coachesvoice\.com/i.test(u)) throw new Error('Coaches\' Voice is coach only. Not sent.');
  var txt = String(it.t || '') + ' ' + String(it.note || '');
  if (/\bcoach(es)? only\b|\bratings?\s*[:=]|\brated\s+\d|\bwelfare\b|\bsafeguarding concern|\bconcussion\b|\bmedical\b|\battitude\b/i.test(txt)) throw new Error('This looks like a rating, coach note, attitude or welfare item. Those stay with the coaches. Not sent.');
  return true;
}

function feedSend_(b) {
  var pl = players_(), ids = b.all === true ? ['*'] : (Array.isArray(b.pids) ? b.pids : []).map(String).filter(function (x) { return pl[x]; });
  if (!ids.length) throw new Error('Pick at least one player.');
  var it = b.item || {};
  shareGuard_(it);
  var aud = String(b.aud || it.aud || 'players');
  if (['team', 'players', 'parents'].indexOf(aud) < 0) aud = 'players';
  var a = attClean_([{ t: it.t, u: it.u, kind: it.kind }])[0];
  if (!a) throw new Error('Nothing to send.');
  var d = { t: a.t, u: a.u, kind: a.kind || 'link', note: clean_(it.note, 400), by: coachWho_(b.code), aud: aud }, sh = feedTab_(), at = Date.now();
  ids.slice(0, 40).forEach(function (pid) { sh.appendRow([Utilities.getUuid().slice(0, 8), pid, String(at), JSON.stringify(d), 'live']); });
  return { ok: true, n: ids.length, aud: aud };
}

function feedList_() {
  var pl = players_();
  return feedRows_().filter(function (r) { return r.status === 'live'; }).sort(function (a, b) { return b.at - a.at; }).slice(0, 80).map(function (r) {
    return { id: r.id, at: r.at, aud: r.d.aud || 'players', to: r.pid === '*' ? (r.d.aud === 'parents' ? 'All parents' : 'Whole squad') : (pl[r.pid] ? '#' + (pl[r.pid].num || '?') + ' ' + String(pl[r.pid].name || '').split(/\s+/)[0] : 'Player'), t: r.d.t, u: r.d.u, note: r.d.note || '', by: r.d.by || '' };
  });
}

/* r117: parents only items never reach a player code. Old rows have no aud and show to both, as before. */
function feedFor_(pid, role) {
  /* r117: parents only items never reach a player code. Old rows have no aud and show to both, as before. */
  return feedRows_().filter(function (r) { return r.status === 'live' && (r.pid === pid || r.pid === '*') && !(r.d && r.d.aud === 'parents' && role !== 'parent'); }).sort(function (a, b) { return b.at - a.at; }).slice(0, 40)
    .map(function (r) { return { id: r.id, at: r.at, t: r.d.t, u: r.d.u, kind: r.d.kind || 'link', note: r.d.note || '', squad: r.pid === '*', aud: r.d.aud || 'players', by: r.d.by || 'Coaches' }; });
}

function coachPromptRun_() {
  var lp = londonParts_(), hh = Number(lp.hm.slice(0, 2)), s = settingsObj_() || {};
  if (s.prompts117 === false) return { sent: 0, note: 'off' };
  var kind = (lp.dow === 2 && hh === 19) ? 'tue' : (lp.dow === 5 && hh === 18) ? 'fri' : '';
  if (!kind) return { sent: 0, note: 'not now' };
  var p = PropertiesService.getScriptProperties(), key = 'prompt117_' + kind + '_' + lp.ymd;
  if (p.getProperty(key)) return { sent: 0, note: 'already sent' };
  p.setProperty(key, '1');
  if (kind === 'tue') return notify_('Weekly review', 'Three minutes: your reflection, scores for last training and the plan for Wednesday. Open Touchline, Today.', 'normal');
  return notify_('Saturday prep', 'Share ideas for Saturday are ready to check. Approve, edit or skip, then Send. Open Touchline, Today.', 'normal');
}

function setupRelease117Prompts() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'coachPromptRun_') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('coachPromptRun_').timeBased().everyHours(1).inTimezone('Europe/London').create();
  Logger.log('Release 117: hourly coach prompt check installed (Tuesday 19:00, Friday 18:00).');
}
