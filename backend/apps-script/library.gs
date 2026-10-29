/**
 * Resource library: player requests, coach decisions and gives.
 * Add this as a file in the Apps Script project (File, New, Script file, name it library).
 * Needs helpdesk.gs too (it provides rate_ and tab_ comes from Code.gs).
 * Then add the dispatcher lines shown in Code.gs and Deploy, Manage deployments, edit, New version.
 *
 * What it stores: shirt number, a short request, an item id, status, a short coach note, times.
 * No names, no contact details. Players only ever see their own rows. Parents see only what their
 * linked player has been given. Lists of approved items come from the coach settings (libPub),
 * which the coach publishes from the app.
 */
function libReqTab_() { return tab_('LibReq', ['id', 'at', 'pid', 'num', 'text', 'item', 'status', 'note', 'by', 'decidedAt']); }
function libGiveTab_() { return tab_('LibGive', ['pid', 'item', 'at', 'by', 'note', 'used', 'usedAt']); }
function libItem_(v) { var s = String(v || ''); if (!/^[A-Za-z][A-Za-z0-9_-]{1,40}$/.test(s)) return ''; return s; }

function libRows_(sh, n) { var last = sh.getLastRow(); return last < 2 ? [] : sh.getRange(2, 1, last - 1, n).getValues(); }

/** Player or parent. Published item ids, items given to this player, and (players) their own requests. */
function libGet_(pid, role) {
  var s = settings_(), pub = (s.libPub || []).filter(function (x) { return libItem_(x); }).slice(0, 500);
  var mine = libRows_(libGiveTab_(), 7).filter(function (r) { return String(r[0]) === pid; }).map(function (r) {
    return { item: String(r[1]), at: Number(r[2]) || 0, note: clean_(r[4], 140), used: r[5] === 'yes' };
  }).sort(function (a, b) { return b.at - a.at; }).slice(0, 60);
  var reqs = [];
  if (role === 'player') {
    reqs = libRows_(libReqTab_(), 10).filter(function (r) { return String(r[2]) === pid; }).map(function (r) {
      return { id: String(r[0]), at: Number(r[1]) || 0, text: clean_(r[4], 120), item: String(r[5]), status: String(r[6]), note: clean_(r[7], 140) };
    }).sort(function (a, b) { return b.at - a.at; }).slice(0, 20);
  }
  return { pub: role === 'player' ? pub : [], mine: mine, reqs: reqs, at: Number(s.libPubAt) || 0 };
}

/** Player only. A request is either a library item id or a short typed topic. */
function libReq_(pid, role, me, b) {
  if (role !== 'player') throw new Error('Requests are for players.');
  rate_('lq_' + pid, 5, 3600);
  var item = libItem_(b.item), text = clean_(b.text, 120);
  if (!item && text.length < 3) throw new Error('Write a few words about what you want help with.');
  var num = String(me.num || '');
  var worry = /(hurt|harm|scared|afraid|bully|abuse|unsafe|suicid|kill myself|want to die|depress|hit me|touch(ed)? me|self.?harm|hate myself|cutting)/i.test(text);
  if (worry) { try { notify_('Your voice: please read today', 'A library request from shirt ' + num + ' may be about how they are feeling. Please check on them.', 'urgent'); } catch (e) {} }
  libReqTab_().appendRow([Utilities.getUuid().slice(0, 8), Date.now(), pid, num, text, item, worry ? 'review' : 'new', '', '', '']);
  try { notify_('Library request', 'Shirt ' + num + ' asked for ' + (text || item), 'quiet'); } catch (e) {}
  return { ok: true, review: worry };
}

/** Player or parent (own linked player only). Marks an item as tried. */
function libUsed_(pid, role, b) {
  if (role !== 'player') throw new Error('This is for players.');
  var item = libItem_(b.item);
  if (!item) throw new Error('Pick an item.');
  var sh = libGiveTab_(), rows = libRows_(sh, 7);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === pid && String(rows[i][1]) === item) { sh.getRange(i + 2, 6, 1, 2).setValues([['yes', Date.now()]]); return { ok: true }; }
  }
  throw new Error('That item was not given to you.');
}

/** Coach. Open and recent requests plus who has tried what (shirt numbers only). */
function libReqList_() {
  var rows = libRows_(libReqTab_(), 10).map(function (r) {
    return { id: String(r[0]), at: Number(r[1]) || 0, num: String(r[3]), text: clean_(r[4], 120), item: String(r[5]), status: String(r[6]), note: clean_(r[7], 140) };
  }).filter(function (r) { return r.status === 'new' || r.status === 'review' || (Date.now() - r.at) < 14 * 86400000; }).sort(function (a, b) { return b.at - a.at; }).slice(0, 60);
  var pl = players_(), num = {};
  Object.keys(pl).forEach(function (k) { num[k] = String(pl[k].num || ''); });
  var used = libRows_(libGiveTab_(), 7).filter(function (r) { return r[5] === 'yes'; }).map(function (r) { return { num: num[String(r[0])] || '', item: String(r[1]) }; }).slice(-100);
  return { rows: rows, used: used };
}

/** Coach. decision approve, swap or decline. approve and swap need an item. */
function libDecide_(b) {
  var id = clean_(b.id, 20), d = String(b.decision), item = libItem_(b.item), note = clean_(b.note, 140);
  if (d !== 'approve' && d !== 'swap' && d !== 'decline') throw new Error('Unknown decision.');
  if (d === 'decline' && note.length < 3) throw new Error('Add a short note to decline.');
  if (d !== 'decline' && !item) throw new Error('Pick an item to give.');
  var sh = libReqTab_(), rows = libRows_(sh, 10), who = clean_(b.who, 20) || 'Coach';
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) !== id) continue;
    var status = d === 'decline' ? 'declined' : (d === 'swap' ? 'swapped' : 'approved');
    sh.getRange(i + 2, 7, 1, 4).setValues([[status, note, who, Date.now()]]);
    if (d !== 'decline') libGiveTab_().appendRow([String(rows[i][2]), item, Date.now(), who, note, '', '']);
    return { ok: true };
  }
  throw new Error('That request was not found.');
}

/** Coach. Give an item to shirt numbers. */
function libGive_(b) {
  var item = libItem_(b.item);
  if (!item) throw new Error('Pick an item.');
  var nums = (Array.isArray(b.nums) ? b.nums : []).map(function (x) { return String(x).replace(/[^0-9]/g, ''); }).filter(Boolean).slice(0, 20);
  if (!nums.length) throw new Error('Add shirt numbers.');
  var pl = players_(), ids = Object.keys(pl), sh = libGiveTab_(), n = 0, at = Date.now(), note = clean_(b.note, 140);
  nums.forEach(function (num) {
    ids.forEach(function (k) { if (String(pl[k].num || '') === num) { sh.appendRow([k, item, at, 'Coach', note, '', '']); n++; } });
  });
  return { ok: true, n: n };
}
