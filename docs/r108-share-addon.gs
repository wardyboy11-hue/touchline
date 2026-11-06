/**
 * Touchline r108 additive patch for the assembled live script (v37).
 *
 * v37 means production v36 plus the r104 travel addon and the fixed r105
 * man of the match addon. consent.gs, helpdesk, plans, concussion, goals,
 * mydata and library.gs stay as they are. Do not paste docs/Code_v33.gs
 * or any older full snapshot over the live script.
 *
 * This patch stores an in-app share against the player id that a family
 * code already maps to. It does not use a phone, a shirt number, or the
 * private code as the key. The code is not written on the row.
 *
 * How to apply, on a private copy of v37:
 * 1. In doPost, after auth_(b.code), next to the other coach actions, add
 *    only these lines. Do not put them on the f. family branch.
 *
 *      if (b.action === 'share.roster') return out_({ ok: true, data: shareRoster_() });
 *      if (b.action === 'share.send') return out_({ ok: true, data: shareSend_(b) });
 *
 * 2. Inside the existing fam_ function, after famAuth_ has set pid and role,
 *    and before its throw new Error('Unknown action'), add only:
 *
 *      if (b.action === 'f.share.list') return shareFor_(pid);
 *      if (b.action === 'f.share.send') return shareFamilySend_(pid, role, b);
 *
 * 3. Paste the functions below at the end. They call auth_, tab_, players_
 *    and clean_, which v37 already has. Do not paste replacements.
 *
 * 4. Deploy: Manage deployments, edit the current web app, New version.
 *    The ShareBox sheet is created on the first send. There is no setup
 *    function and no rewrite of existing rows.
 *
 * A coach can send a family-safe item to chosen players, or to the whole
 * squad. A parent or player can send only to their own linked player.
 * Another family's id is refused. Coach-only, paid and welfare items are
 * refused. Cancel never calls these actions.
 */

var SHARE_OK_ = { shape: 1, clip: 1, session: 1, training: 1, position: 1, stretch: 1, guide: 1, resource: 1, formation: 1 };
var SHARE_NO_ = { cv: 1, coachesvoice: 1, paid: 1, welfare: 1, niggle: 1, consent: 1, marks: 1, health: 1, plan: 1 };

function shareTab_() {
  return tab_('ShareBox', ['id', 'pid', 'kind', 'ref', 'title', 'path', 'at', 'status']);
}

function shareRows_() {
  var sh = shareTab_(), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 8).getValues().map(function (r, i) {
    return { row: i + 2, id: String(r[0]), pid: String(r[1]), kind: String(r[2]), ref: String(r[3]), title: String(r[4]), path: String(r[5]), at: Number(r[6]) || 0, status: String(r[7] || '') };
  });
}

function shareId_() {
  try { return Utilities.getUuid().slice(0, 8); } catch (e) { return 's' + String(Date.now()); }
}

function shareKind_(k) {
  k = String(k || '').toLowerCase();
  if (SHARE_NO_[k] || !SHARE_OK_[k]) throw new Error('That item cannot be sent to families.');
  return k;
}

function shareRef_(v) {
  var s = String(v || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  return s;
}

function sharePath_(p) {
  p = String(p || '').trim();
  if (!p) return '';
  if (/code=|fam\.code|playercode/i.test(p) || p.indexOf('..') >= 0) throw new Error('That link cannot be sent.');
  if (/^\//.test(p)) {
    if (/^\/coach\/(?!anim\/)/.test(p) || /welfare|niggle|consent/i.test(p)) throw new Error('That item cannot be sent to families.');
    return p.slice(0, 180);
  }
  if (/^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+/.test(p)) return p.split('&')[0].slice(0, 180);
  throw new Error('That link cannot be sent.');
}

function shareTitle_(t) {
  var s = clean_(t, 80);
  if (!s || String(s).length < 2) throw new Error('Add a title.');
  return s;
}

function shareWrite_(pids, kind, ref, title, path) {
  var sh = shareTab_(), at = Date.now(), n = 0;
  pids.slice(0, 24).forEach(function (pid) {
    sh.appendRow([shareId_(), String(pid), kind, ref, title, path, String(at), 'live']);
    n++;
  });
  return { ok: true, n: n, pending: false, sent: true };
}

function shareTargets_(b) {
  var pl = players_();
  if (b && b.all === true) {
    return Object.keys(pl).filter(function (id) { return pl[id] && pl[id].active !== false; }).slice(0, 24);
  }
  var ids = (Array.isArray(b && b.pids) ? b.pids : []).map(String);
  var out = [], seen = {};
  ids.forEach(function (id) {
    if (!pl[id] || pl[id].active === false || seen[id]) return;
    seen[id] = 1;
    out.push(id);
  });
  if (!out.length) throw new Error('Pick at least one player.');
  return out.slice(0, 24);
}

function shareRoster_() {
  var pl = players_();
  return Object.keys(pl).filter(function (id) { return pl[id] && pl[id].active !== false; }).map(function (id) {
    var parts = String(pl[id].name || '').trim().split(/\s+/);
    var name = parts[0] ? (parts[0] + (parts.length > 1 ? ' ' + parts[parts.length - 1].charAt(0) : '')) : 'Player';
    return { id: id, num: String(pl[id].num || ''), name: name };
  });
}

function shareSend_(b) {
  auth_(b && b.code);
  var kind = shareKind_(b && b.kind);
  var path = sharePath_(b && b.path);
  var title = shareTitle_(b && b.title);
  var ref = shareRef_(b && b.ref);
  return shareWrite_(shareTargets_(b), kind, ref, title, path);
}

function shareFamilySend_(pid, role, b) {
  if (role !== 'parent' && role !== 'player') throw new Error('That code did not work.');
  var asked = Array.isArray(b && b.pids) ? b.pids.map(String) : [];
  if (b && b.all === true) throw new Error('You can only send this to your own player.');
  if (asked.some(function (id) { return id && id !== String(pid); })) throw new Error('You can only send this to your own player.');
  var kind = shareKind_(b && b.kind);
  var path = sharePath_(b && b.path);
  var title = shareTitle_(b && b.title);
  return shareWrite_([String(pid)], kind, shareRef_(b && b.ref), title, path);
}

function shareFor_(pid) {
  var rows = shareRows_().filter(function (r) { return r.status === 'live' && r.pid === String(pid); });
  rows.sort(function (a, c) { return c.at - a.at; });
  return { rows: rows.slice(0, 30).map(function (r) { return { id: r.id, kind: r.kind, ref: r.ref, title: r.title, path: r.path, at: r.at }; }) };
}
