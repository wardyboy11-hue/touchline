/**
 * Personal goals on the FA Four Corners (welfare P1, "IDP lite").
 * Add as a file in the Apps Script project (File, New, Script file, name it goals).
 * Then add the dispatcher lines shown in Code.gs and Deploy, Manage deployments, edit, New version.
 *
 * The player sets one or two goals per half term (technical and tactical, physical, psychological,
 * social). A coach agrees, changes the words or declines with a kind note. Agreed goals appear in the
 * player's Work on card. At the end of a half term the player reviews each goal in their own words.
 *
 * Who sees what: the player, the linked parent (read only) and coaches. Never other players or parents.
 * No scores, grades or comparisons. A worrying word in a goal raises a quiet alert to the coaches.
 * Retention: goals from before last season are deleted by the monthly clean up.
 */
var GOAL_HEAD_ = ['id', 'pid', 'season', 'ht', 'corner', 'txt', 'status', 'note', 'at', 'review', 'rnote'];
var GOAL_CORNERS_ = { tec: 'Technical and tactical', phy: 'Physical', psy: 'Psychological', soc: 'Social' };
function goalTab_() { return tab_('Goals', GOAL_HEAD_); }

/** Half terms by calendar: Sep and Oct, Nov and Dec, Jan and Feb, Mar and Apr, May to Aug. */
function goalHT_() {
  var d = new Date(), y = Number(Utilities.formatDate(d, 'Europe/London', 'yyyy')), m = Number(Utilities.formatDate(d, 'Europe/London', 'M'));
  var s = m >= 7 ? y : y - 1, season = s + '/' + String(s + 1).slice(2);
  var ht = (m === 9 || m === 10) ? 'Autumn 1' : (m === 11 || m === 12) ? 'Autumn 2' : (m === 1 || m === 2) ? 'Spring 1' : (m === 3 || m === 4) ? 'Spring 2' : 'Summer';
  return { season: season, ht: ht };
}
function goalRows_() {
  var sh = goalTab_(), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, GOAL_HEAD_.length).getValues().map(function (r, i) {
    return { row: i + 2, id: String(r[0]), pid: String(r[1]), season: String(r[2]), ht: String(r[3]), corner: String(r[4]), txt: String(r[5]), status: String(r[6]), note: String(r[7]), at: Number(r[8]) || 0, review: String(r[9]), rnote: String(r[10]) };
  });
}
function goalOut_(r) { return { id: r.id, season: r.season, ht: r.ht, corner: r.corner, txt: r.txt, status: r.status, note: r.note, review: r.review, rnote: r.rnote }; }
function goalSet_(sh, r) {
  sh.getRange(r.row, 1, 1, GOAL_HEAD_.length).setNumberFormat('@').setValues([[r.id, r.pid, r.season, r.ht, r.corner, r.txt, r.status, r.note, r.at, r.review, r.rnote].map(String)]);
}

/** Player or parent: this season's goals for the linked player. */
function goalsGet_(pid, role) {
  var cur = goalHT_();
  var mine = goalRows_().filter(function (r) { return r.pid === pid && r.season === cur.season && r.status !== 'declined'; });
  return { season: cur.season, ht: cur.ht, corners: GOAL_CORNERS_, goals: mine.map(goalOut_), canEdit: role === 'player' };
}

/** Player only. Proposes a goal for this half term. Two at most. */
function goalAdd_(pid, role, me, b) {
  if (role !== 'player') throw new Error('Goals are set by the player.');
  rate_('ga_' + pid, 6, 3600);
  var corner = String(b.corner || ''), txt = clean_(b.txt, 140);
  if (!GOAL_CORNERS_[corner]) throw new Error('Pick one of the four corners.');
  if (txt.length < 6) throw new Error('Write a few words about what you want to get better at.');
  var cur = goalHT_();
  var n = goalRows_().filter(function (r) { return r.pid === pid && r.season === cur.season && r.ht === cur.ht && r.status !== 'declined'; }).length;
  if (n >= 2) throw new Error('Two goals is plenty for one half term. Finish those first.');
  var worry = /(hurt|harm|scared|afraid|bully|abuse|unsafe|suicid|kill myself|want to die|depress|hit me|touch(ed)? me|self.?harm|hate myself|cutting)/i.test(txt);
  if (worry) { try { notify_('Your voice: please read today', 'A goal from shirt ' + String(me.num || '') + ' may be about how they are feeling. Please check on them.', 'urgent'); } catch (e) {} }
  var id = 'g' + Utilities.getUuid().slice(0, 8);
  var sh = goalTab_();
  sh.getRange(sh.getLastRow() + 1, 1, 1, GOAL_HEAD_.length).setNumberFormat('@').setValues([[id, pid, cur.season, cur.ht, corner, txt, worry ? 'review' : 'proposed', '', String(Date.now()), '', ''].map(String)]);
  try { notify_('New goal', 'Shirt ' + String(me.num || '') + ' set a ' + GOAL_CORNERS_[corner] + ' goal.', 'quiet'); } catch (e) {}
  return { ok: true, review: worry };
}

/** Player only. End of half term review in their own words. */
function goalReview_(pid, role, b) {
  if (role !== 'player') throw new Error('Reviews are written by the player.');
  var id = String(b.id || ''), st = String(b.review || '');
  if (['done', 'working', 'parked'].indexOf(st) < 0) throw new Error('Pick how it went.');
  var hit = null; goalRows_().forEach(function (r) { if (r.id === id && r.pid === pid) hit = r; });
  if (!hit || hit.status !== 'agreed') throw new Error('You can review a goal once the coaches have agreed it.');
  hit.review = st; hit.rnote = clean_(b.note, 140); goalSet_(goalTab_(), hit);
  return { ok: true };
}

/** Coach only. Every goal this season, with player ids. */
function goalsList_() {
  var cur = goalHT_();
  return { season: cur.season, ht: cur.ht, rows: goalRows_().filter(function (r) { return r.season === cur.season; }).map(function (r) { var o = goalOut_(r); o.pid = r.pid; o.at = r.at; return o; }) };
}
/** Coach only. Agree (optionally with new words) or decline with a kind note. */
function goalDecide_(b) {
  var id = String(b.id || ''), act = String(b.act || '');
  if (['agree', 'decline'].indexOf(act) < 0) throw new Error('Bad action.');
  var hit = null; goalRows_().forEach(function (r) { if (r.id === id) hit = r; });
  if (!hit) throw new Error('Goal not found.');
  var txt = clean_(b.txt, 140);
  if (act === 'agree') { if (txt.length >= 6) hit.txt = txt; hit.status = 'agreed'; }
  else hit.status = 'declined';
  hit.note = clean_(b.note, 140);
  goalSet_(goalTab_(), hit);
  return { ok: true };
}
/** For the Work on card: this half term's agreed goals for the player. */
function goalWorkon_(pid) {
  var cur = goalHT_();
  return goalRows_().filter(function (r) { return r.pid === pid && r.season === cur.season && r.ht === cur.ht && r.status === 'agreed' && !r.review; })
    .slice(0, 2).map(function (r) { return { k: 'goal', txt: 'My goal (' + (GOAL_CORNERS_[r.corner] || '') + '): ' + clean_(r.txt, 140) }; });
}
/** Monthly job. Deletes goals from before last season. */
function goalsPurge_() {
  var cur = goalHT_(), y = Number(cur.season.slice(0, 4)), keep = [cur.season, (y - 1) + '/' + String(y).slice(2)];
  var sh = goalTab_(), rows = goalRows_(), gone = 0;
  for (var i = rows.length - 1; i >= 0; i--) { if (keep.indexOf(rows[i].season) < 0) { sh.deleteRow(rows[i].row); gone++; } }
  if (gone) tab_('RetentionLog', ['at', 'what', 'count']).appendRow([new Date(), 'Personal goals older than last season', gone]);
  return gone;
}
