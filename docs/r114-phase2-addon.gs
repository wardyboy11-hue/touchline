/**
 * Touchline r114 (Phase 2) backend addon for the EXISTING live Apps Script.
 *
 * One file, paste ready. It adds:
 *   1. Comments on a game from players and parents (f.cmt.add, f.cmt.mine).
 *      Coaches read them (cmt.list), remove or put back (cmt.set), or delete (cmt.del).
 *      Opposition notes from families are part of the same sheet with kind "opp".
 *   2. Coaches edit media titles (media.title) and clip titles (clip.title).
 *   Previous questions (the archive) needs no backend change. It is worked out on the phone.
 *
 * Safety rules this file keeps:
 *   Every action checks its own code. Family actions use famAuth_, coach actions use auth_.
 *   A family caller only ever gets back its own comments. Never another family's,
 *   never the coach's ratings, never the opposition notes of anyone else.
 *   No replies go from coach to child through this. It is one way, to the coaches.
 *   Welfare words in a comment send the coaches an alert, the same as Your voice.
 *   Nothing here posts to the club website, WhatsApp or email.
 *
 * HOW TO APPLY (click by click). Do not create a new deployment. Do not paste Code_v33.gs.
 *   1. Open the Touchline Apps Script project you already use (Extensions > Apps Script
 *      from the Touchline sheet, or script.google.com > the Touchline project).
 *   2. Left side, Files, click the + next to Files, choose Script. Name it r114_phase2
 *      (Apps Script adds .gs). Delete the empty function it shows.
 *   3. Paste this whole file into r114_phase2.gs. Press Save (the disk icon).
 *   4. Open Code.gs. Find function doPost(e). Find the line
 *        var b = JSON.parse(e.postData.contents);
 *      Straight under it, add this one line:
 *        var p2 = phase2_(b); if (p2) return out_(p2);
 *      Press Save. Nothing else in Code.gs changes.
 *   5. Top right, Deploy > Manage deployments. Pick the web app deployment that is live now
 *      (the one the app already uses). Click the pencil (Edit).
 *   6. Version: choose New version. Description: r114 comments and titles. Click Deploy.
 *      The web app URL stays the same. Do NOT click New deployment.
 *   7. If Google asks to authorise again, review and allow. It only uses the same sheet.
 *   8. Check: open the coach app, Hub, Edit title on any media item, save. The "waiting for
 *      the update" tag should go. On a finished game, the Comments card stops saying it
 *      needs the backend update.
 *
 * Uses helpers the live script already has: out_, auth_, famAuth_, tab_, clean_, players_,
 * allDocs_, notify_, mediaMeta_, mediaTab_, clipRows_, clipTab_. Do not paste copies of those.
 */

var P2_CMT_HEAD = ['id', 'at', 'mid', 'opp', 'pid', 'role', 'kind', 'text', 'status'];
var P2_WELFARE = /(hurt|harm|scared|afraid|bully|abuse|unsafe|suicid|kill myself|want to die|depress|hit me|touch(ed)? me|self.?harm|hate myself|cutting)/i;

/* Returns a response object for the actions it owns, or null so doPost carries on as before. */
function phase2_(b) {
  var a = String((b && b.action) || '');
  if (a === 'f.cmt.add') return { ok: true, data: p2CmtAdd_(b) };
  if (a === 'f.cmt.mine') return { ok: true, data: p2CmtMine_(b) };
  if (a === 'cmt.list' || a === 'cmt.set' || a === 'cmt.del' || a === 'media.title' || a === 'clip.title') {
    auth_(b.code);
    if (a === 'cmt.list') return { ok: true, data: p2CmtList_() };
    if (a === 'cmt.set') return { ok: true, data: p2CmtSet_(b) };
    if (a === 'cmt.del') return { ok: true, data: p2CmtDel_(b) };
    if (a === 'media.title') return { ok: true, data: p2MediaTitle_(b) };
    if (a === 'clip.title') return { ok: true, data: p2ClipTitle_(b) };
  }
  return null;
}

function p2CmtTab_() { return tab_('Comments', P2_CMT_HEAD); }

function p2CmtRows_() {
  var sh = p2CmtTab_(), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, P2_CMT_HEAD.length).getValues().map(function (r, i) {
    return { row: i + 2, id: String(r[0]), at: Number(r[1]) || 0, mid: String(r[2]), opp: String(r[3]), pid: String(r[4]), role: String(r[5]), kind: String(r[6]), text: String(r[7]), status: String(r[8] || 'new') };
  });
}

function p2Today_() { return Utilities.formatDate(new Date(), 'Europe/London', 'yyyy-MM-dd'); }

function p2CmtAdd_(b) {
  var fa = famAuth_(b.code), pid = fa.pid, role = fa.role, pl = players_();
  if (!pl[pid]) throw new Error('That code is not active.');
  var mid = clean_(b.mid, 40), kind = String(b.kind) === 'opp' ? 'opp' : 'game', text = clean_(b.text, 600);
  if (text.length < 3) throw new Error('Write a little more first.');
  var m = null; allDocs_().matches.forEach(function (x) { if (x.id === mid && !x.pp) m = x; });
  if (!m) throw new Error('That game is not open for comments.');
  var td = p2Today_(), age = (new Date(td) - new Date(String(m.date))) / 86400000;
  if (!(m.status === 'done' || String(m.date) === td) || age < 0 || age > 14) throw new Error('That game is not open for comments.');
  var cache = CacheService.getScriptCache(), ck = 'cmt:' + pid + ':' + td, n = Number(cache.get(ck) || 0);
  if (n >= 12) throw new Error('That is plenty for today. Thank you.');
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var mine = p2CmtRows_().filter(function (r) { return r.pid === pid && r.mid === mid && r.role === role; });
    if (mine.length >= 6) throw new Error('You have sent plenty for this game. Thank you.');
    var dup = mine.some(function (r) { return r.kind === kind && r.text === text; });
    if (dup) return { ok: true, dup: true };
    var id = Utilities.getUuid().replace(/-/g, '').slice(0, 10);
    p2CmtTab_().appendRow([id, String(Date.now()), mid, clean_(m.opp, 60), pid, role, kind, text, 'new']);
  } finally { lock.releaseLock(); }
  cache.put(ck, String(n + 1), 86400);
  if (P2_WELFARE.test(text)) { try { notify_('Game comment: please read today', 'A comment about the ' + clean_(m.opp, 40) + ' game has welfare words in it. Open the game in Matchday and read it today.', 'normal'); } catch (e) {} }
  return { ok: true };
}

/* The author sees only their own comments, and not ones a coach removed. */
function p2CmtMine_(b) {
  var fa = famAuth_(b.code);
  return { rows: p2CmtRows_().filter(function (r) { return r.pid === fa.pid && r.role === fa.role && r.status !== 'removed'; })
    .map(function (r) { return { id: r.id, at: r.at, mid: r.mid, kind: r.kind, text: r.text }; }) };
}

/* Coaches only. Who wrote it is shown as a first name, player or parent. */
function p2CmtList_() {
  var pl = players_();
  return { rows: p2CmtRows_().map(function (r) {
    var p = pl[r.pid] || {}, first = String(p.name || '').trim().split(/\s+/)[0] || 'Someone';
    var who = r.role === 'player' ? first + (p.num ? ' (#' + p.num + ')' : '') : 'Parent of ' + first;
    return { id: r.id, at: r.at, mid: r.mid, opp: r.opp, kind: r.kind, text: r.text, status: r.status, who: who, role: r.role };
  }).sort(function (x, y) { return y.at - x.at; }) };
}

function p2CmtFind_(id) {
  var hit = null; p2CmtRows_().forEach(function (r) { if (r.id === id) hit = r; });
  if (!hit) throw new Error('Not found.');
  return hit;
}

function p2CmtSet_(b) {
  var st = String(b.status) === 'removed' ? 'removed' : 'new';
  var hit = p2CmtFind_(clean_(b.id, 20));
  p2CmtTab_().getRange(hit.row, 9).setValue(st);
  return { ok: true };
}

function p2CmtDel_(b) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { var hit = p2CmtFind_(clean_(b.id, 20)); p2CmtTab_().deleteRow(hit.row); } finally { lock.releaseLock(); }
  return { ok: true };
}

function p2Title_(t) {
  var s = clean_(t, 80);
  if (s.length < 3) throw new Error('Give it a title of 3 letters or more.');
  return s;
}

function p2MediaTitle_(b) {
  var id = clean_(b.id, 40), t = p2Title_(b.title), hit = null;
  mediaMeta_().forEach(function (r) { if (r.id === id) hit = r; });
  if (!hit) throw new Error('Not found.');
  mediaTab_().getRange(hit.row, 3).setNumberFormat('@').setValue(t);
  return { ok: true };
}

function p2ClipTitle_(b) {
  var id = clean_(b.id, 40), t = p2Title_(b.title), hit = null;
  clipRows_().forEach(function (r) { if (r.id === id) hit = r; });
  if (!hit) throw new Error('Not found.');
  clipTab_().getRange(hit.row, 2).setNumberFormat('@').setValue(t);
  return { ok: true };
}
