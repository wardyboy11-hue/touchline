/**
 * Help requests: lost codes and "My own training" requests.
 * Add this as a second file in the Apps Script project (File, New, Script file, name it helpdesk).
 * Stores only role, shirt number, first name (lost code only), topic, short note and a time.
 * No contact details. Never returns or reveals a code.
 */
function helpTab_() { return tab_('CodeHelp', ['id', 'at', 'role', 'num', 'first', 'done', 'kind', 'topic', 'note']); }

function rate_(key, max, secs) {
  var c = CacheService.getScriptCache(), n = Number(c.get(key) || 0);
  if (n >= max) throw new Error('Too many requests. Try again later.');
  c.put(key, String(n + 1), secs);
}

function helpRows_() {
  var sh = helpTab_(), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 9).getValues().map(function (r, i) {
    return { row: i + 2, id: String(r[0]), at: Number(r[1]) || 0, role: String(r[2]), num: String(r[3]), first: String(r[4]), done: r[5] ? true : false, kind: String(r[6] || 'code'), topic: String(r[7]), note: String(r[8]) };
  });
}

// Open to anyone (no code). Rate limited. Never returns a code.
function codeHelp_(b) {
  var num = String(b.num || '').replace(/\D/g, '').slice(0, 3);
  if (!num) throw new Error('Add the shirt number.');
  rate_('chelp:all', 10, 3600);
  rate_('chelp:' + num, 3, 3600);
  var role = b.role === 'player' ? 'Player' : 'Parent';
  var dup = helpRows_().some(function (r) { return !r.done && r.kind === 'code' && r.num === num && r.role === role; });
  if (!dup) helpTab_().appendRow([Utilities.getUuid().slice(0, 8), Date.now(), role, num, clean_(b.first, 30), '', 'code', '', '']);
  return { ok: true };
}

// Needs a valid family or player code. Role and shirt number come from the code, never from the request.
function trainReq_(pid, role, me, b) {
  var topic = clean_(b.topic, 20);
  if (!topic) throw new Error('Pick a topic.');
  rate_('treq:' + pid, 6, 3600);
  helpTab_().appendRow([Utilities.getUuid().slice(0, 8), Date.now(), role === 'player' ? 'Player' : 'Parent', String(me.num || ''), '', '', 'train', topic, clean_(b.note, 200)]);
  return { ok: true };
}

// Coach only. Open requests, newest first.
function helpOpen_() {
  return helpRows_().filter(function (r) { return !r.done; }).sort(function (a, b) { return b.at - a.at; })
    .map(function (r) { return { id: r.id, at: r.at, role: r.role, num: r.num, first: r.first, kind: r.kind, topic: r.topic, note: r.note }; });
}

function helpDone_(id) {
  var rows = helpRows_(), sh = helpTab_();
  for (var i = 0; i < rows.length; i++) if (rows[i].id === String(id)) { sh.getRange(rows[i].row, 6).setValue(Date.now()); return { ok: true }; }
  throw new Error('Not found.');
}
