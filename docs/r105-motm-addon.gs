/**
 * Touchline r105 additive patch for the live Apps Script (production v36).
 *
 * Depends on r104 only for the website release number. This file does not
 * change travel.send, travel.list, or any r104 function. Apply the r104
 * travel addon first if you want travel alerts, then apply this. Either
 * addon can be pasted without the other. Do not deploy this file as a
 * replacement script, and do not paste docs/Code_v33.gs over production.
 * v34 favourites, v35 man of the match automation, and v36 event attendance
 * stay as they are.
 *
 * How to apply, on a private copy of the real v36 script:
 * 1. In doPost, after auth_(b.code) and next to the other coach actions,
 *    add only these lines. Do not put them on the f. family branch.
 *
 *      if (b.action === 'motm.status') return out_({ ok: true, data: motmStatus_(b) });
 *      if (b.action === 'motm.close') return out_({ ok: true, data: motmClose_(b) });
 *      if (b.action === 'motm.reopen') return out_({ ok: true, data: motmReopen_(b) });
 *      if (b.action === 'motm.awards') return out_({ ok: true, data: motmAwards_(b) });
 *
 * 2. In voteState_, where a man of the match candidate is built, return
 *    motmCand_(p) instead of a name with no shirt number. Leave the rest
 *    of voteState_ alone. Parents then see the name and the number.
 *
 * 3. In f.vote, after a man of the match vote is saved, add:
 *      if (kind === 'motm') { try { motmAuto_(key); } catch (e) {} }
 *    The family response stays { ok: true }. The family caller never
 *    receives the tally, the voter list, or the photo.
 *
 * 4. Paste the functions below at the end of the script. They call helpers
 *    v36 already has: auth_, tab_, players_, votes_, allDocs_, and photo_.
 *    Do not paste replacements for those. Do not paste consentRows_ or
 *    consentSeason_. Production v36 does not define them. Those names live
 *    only inside consent.gs, which may not be in the live project.
 *
 *    Photo consent uses the coach function consentList_ when that function
 *    is already in the project. It returns { season, rows: [{ pid, photo }] }
 *    and photo is yes, team, or no. This addon does not create a consent
 *    sheet and does not invent a photo choice. If consentList_ is missing,
 *    the card does not use a stored photo. The coach phone can then add a
 *    JPEG the coach has already checked is allowed. That file stays on the
 *    phone. It is not posted back to this script and it is not sent to the
 *    assistant. If consentList_ exists and the choice is missing or no, the
 *    card shows the shirt number only. A stored jpeg is not a substitute.
 *
 * 5. Deploy: Manage deployments, edit the current web app, New version.
 *    Do not create a new deployment. The website release 105 is not live
 *    until you choose to ship it. r104 stays a separate unmerged change.
 *
 * Eligibility is the parent codes on the Families sheet for active players.
 * Squad size is never used as the voter count. If that list cannot be read,
 * automatic close stays off and the coach screen says why. A tie is not
 * given a winner. The coach picks one of the tied players, then the card
 * can be shared. Sharing is a separate button. Closing the vote does not
 * open WhatsApp and does not send a message.
 */

function motmAuth_(b) {
  auth_(b && b.code);
}

function motmCand_(p) {
  var name = String((p && p.name) || '').trim();
  return { id: p.id, num: String((p && p.num) || ''), name: name };
}

function motmDisplayName_(p) {
  return String((p && p.name) || '').trim();
}

function motmSeason_(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  if (!m) return '';
  var y = +m[1], mo = +m[2], s = mo >= 7 ? y : y - 1;
  return s + '/' + String(s + 1).slice(2);
}

function motmUk_(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  if (!m) return '';
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return (+m[3]) + ' ' + months[+m[2] - 1] + ' ' + m[1];
}

function motmAwardTab_() {
  return tab_('MotmAward', ['id', 'matchId', 'date', 'opp', 'status', 'winnerId', 'winnerName', 'winnerNum', 'totals', 'at']);
}

function motmAuditTab_() {
  return tab_('MotmAudit', ['at', 'matchId', 'action', 'note']);
}

function motmRows_() {
  var sh = motmAwardTab_(), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 10).getValues().map(function (r, i) {
    return { row: i + 2, id: String(r[0]), matchId: String(r[1]), date: String(r[2]), opp: String(r[3]), status: String(r[4]), winnerId: String(r[5]), winnerName: String(r[6]), winnerNum: String(r[7]), totals: String(r[8] || '[]'), at: Number(r[9]) || 0 };
  });
}

function motmWrite_(row) {
  motmAwardTab_().appendRow([row.id, row.matchId, row.date, row.opp, row.status, row.winnerId, row.winnerName, row.winnerNum, row.totals, String(row.at)]);
}

function motmAudit_(action, matchId, note) {
  motmAuditTab_().appendRow([String(Date.now()), String(matchId || ''), String(action || ''), String(note || '').slice(0, 300)]);
}

function motmId_() {
  try { return Utilities.getUuid().slice(0, 8); } catch (e) { return 'a' + String(Date.now()) + String(Math.floor(Math.random() * 1000)); }
}

function motmLatest_(matchId) {
  var last = null;
  motmRows_().forEach(function (r) { if (r.matchId === matchId) last = r; });
  return last;
}

function motmEligible_() {
  var pl;
  try { pl = players_(); } catch (e) {
    return { reliable: false, voters: [], reason: 'The squad list could not be read, so automatic close is off. Squad size is not used as a guess.' };
  }
  var sh;
  try { sh = tab_('Families', ['code', 'playerId', 'createdAt', 'role']); } catch (e2) {
    return { reliable: false, voters: [], reason: 'The Families list could not be read, so automatic close is off. Squad size is not used as a guess.' };
  }
  var last = sh.getLastRow();
  if (last < 2) return { reliable: false, voters: [], reason: 'No parent codes are on the Families list, so automatic close is off. Squad size is not used as a guess. Use Close vote when you are ready.' };
  var width = 4;
  var rows = sh.getRange(2, 1, last - 1, width).getValues();
  var seen = {}, voters = [];
  rows.forEach(function (r) {
    var pid = String(r[1] || ''), role = String(r[3] || '');
    if (role !== 'parent') return;
    if (!pid || !pl[pid] || pl[pid].active === false) return;
    var key = 'parent:' + pid;
    if (seen[key]) return;
    seen[key] = 1;
    voters.push(key);
  });
  if (!voters.length) return { reliable: false, voters: [], reason: 'No parent codes match active players, so automatic close is off. Squad size is not used as a guess. Use Close vote when you are ready.' };
  return { reliable: true, voters: voters, reason: '' };
}

function motmFixture_(matchId) {
  var date = '', opp = '';
  try {
    var A = allDocs_();
    (A.matches || []).forEach(function (m) {
      if (m && String(m.id) === String(matchId) && !m.deleted) { date = String(m.date || ''); opp = String(m.opp || ''); }
    });
  } catch (e) {}
  return { date: date, opp: opp };
}

function motmPhoto_(pid) {
  if (typeof consentList_ !== 'function') {
    return { photo: '', photoNote: 'The consent list is not on this script, so no stored photo is used. On this phone you can add a JPEG you have already checked is allowed. It stays on this phone. It is not uploaded and it is not sent to the assistant.', photoLocal: true };
  }
  var list;
  try { list = consentList_(); } catch (e) {
    return { photo: '', photoNote: 'The consent list could not be read, so no picture is used.', photoLocal: false };
  }
  var choice = '', rows = (list && list.rows) || [];
  rows.forEach(function (r) { if (r && String(r.pid) === String(pid)) choice = String(r.photo || ''); });
  if (!choice) return { photo: '', photoNote: 'No photo choice is on file for this player, so the card shows the shirt number only.', photoLocal: false };
  if (choice !== 'yes' && choice !== 'team') return { photo: '', photoNote: 'Photo consent for this player is no, so the card shows the shirt number only.', photoLocal: false };
  var u = '';
  try { if (typeof photo_ === 'function') u = String(photo_(pid) || ''); } catch (e2) { u = ''; }
  if (u.indexOf('data:image/jpeg;base64,') !== 0) return { photo: '', photoNote: 'Photo consent is yes, but no approved photo is on file. The card does not invent a picture.', photoLocal: false };
  return { photo: u, photoNote: '', photoLocal: false };
}

function motmShape_(row, repeat) {
  var totals = [];
  try { totals = JSON.parse(row.totals || '[]'); } catch (e) { totals = []; }
  var photo = { photo: '', photoNote: '' };
  if (row.winnerId && (row.status === 'closed' || row.status === 'resolved')) photo = motmPhoto_(row.winnerId);
  return {
    ok: true,
    closed: row.status === 'closed' || row.status === 'resolved',
    repeat: !!repeat,
    id: row.id,
    matchId: row.matchId,
    date: row.date,
    dateUK: motmUk_(row.date),
    season: motmSeason_(row.date),
    opp: row.opp,
    status: row.status,
    winnerId: row.winnerId,
    winnerName: row.winnerName,
    winnerNum: row.winnerNum,
    totals: totals,
    photo: photo.photo,
    photoNote: photo.photoNote,
    photoLocal: !!photo.photoLocal
  };
}

function motmCloseCore_(b) {
  var matchId = String((b && b.matchId) || '');
  if (!matchId) throw new Error('No fixture.');
  var mode = b.mode === 'auto' ? 'auto' : (b.mode === 'resolve' ? 'resolve' : 'manual');
  var elig = motmEligible_();
  var pl = players_();
  var votes = [];
  try { votes = votes_().filter(function (v) { return v.kind === 'motm' && String(v.key) === matchId; }); } catch (e) { votes = []; }
  var parentVotes = votes.filter(function (v) { return elig.voters.indexOf(String(v.voter)) >= 0; });
  var got = {};
  parentVotes.forEach(function (v) { got[String(v.voter)] = 1; });
  var counts = {};
  parentVotes.forEach(function (v) {
    var id = String(v.cand || '').split(',')[0];
    if (!id || !pl[id]) return;
    counts[id] = (counts[id] || 0) + 1;
  });
  var totals = Object.keys(counts).map(function (id) {
    return { id: id, n: counts[id], name: motmDisplayName_(pl[id]), num: String(pl[id].num || '') };
  }).sort(function (a, c) { return c.n - a.n || String(a.num).localeCompare(String(c.num)); });
  var fixture = motmFixture_(matchId);
  if (!fixture.date && b.date && /^\d{4}-\d{2}-\d{2}$/.test(String(b.date))) fixture.date = String(b.date);
  if (!fixture.opp && b.opp) fixture.opp = String(b.opp).slice(0, 80);
  var latest = motmLatest_(matchId);

  if (mode === 'auto' && !elig.reliable) {
    motmAudit_('auto-off', matchId, elig.reason);
    return { ok: true, closed: false, auto: false, reason: elig.reason, need: 0, have: Object.keys(got).length };
  }
  if (mode === 'auto') {
    var have = Object.keys(got).length;
    if (have !== elig.voters.length) {
      return { ok: true, closed: false, auto: true, waiting: elig.voters.length - have, need: elig.voters.length, have: have };
    }
  }
  if (!totals.length && mode !== 'resolve') throw new Error('No parent votes yet.');

  var topN = totals.length ? totals[0].n : 0;
  var tied = totals.filter(function (t) { return t.n === topN && topN > 0; });
  var winnerId = '';
  if (tied.length > 1) {
    if (mode !== 'resolve') {
      motmAudit_('tie', matchId, tied.map(function (t) { return t.name + ' ' + t.num; }).join(', '));
      return { ok: true, closed: false, tie: true, tied: tied.map(function (t) { return { id: t.id, name: t.name, num: t.num, n: t.n }; }), reason: 'More than one player has the same votes. Pick the winner before any card or message.' };
    }
    winnerId = String(b.winnerId || '');
    var allowed = null;
    tied.forEach(function (t) { if (t.id === winnerId) allowed = t; });
    if (!allowed) throw new Error('Pick one of the tied players. The vote does not choose for you.');
  } else if (mode === 'resolve') {
    throw new Error('There is no tie to resolve.');
  } else {
    winnerId = totals[0].id;
  }

  if (latest && (latest.status === 'closed' || latest.status === 'resolved')) {
    if (latest.winnerId === winnerId) {
      motmAudit_('close-repeat', matchId, latest.id);
      var again = motmShape_(latest, true);
      again.auto = mode === 'auto';
      return again;
    }
    throw new Error('This fixture is already closed. Reopen it before you correct the result.');
  }

  var win = pl[winnerId];
  if (!win) throw new Error('That player is not on the squad.');
  var row = {
    id: motmId_(),
    matchId: matchId,
    date: fixture.date,
    opp: fixture.opp,
    status: mode === 'resolve' ? 'resolved' : 'closed',
    winnerId: winnerId,
    winnerName: motmDisplayName_(win),
    winnerNum: String(win.num || ''),
    totals: JSON.stringify(totals),
    at: Date.now()
  };
  motmWrite_(row);
  motmAudit_(row.status, matchId, row.id);
  var out = motmShape_(row, false);
  out.auto = mode === 'auto';
  return out;
}

function motmClose_(b) {
  motmAuth_(b);
  return motmCloseCore_(b || {});
}

function motmAuto_(matchId) {
  try {
    var r = motmCloseCore_({ matchId: matchId, mode: 'auto' });
    if (r) { r.photo = ''; r.photoNote = ''; r.photoLocal = false; }
    return r;
  } catch (e) { return { ok: false, closed: false }; }
}

function motmReopen_(b) {
  motmAuth_(b);
  var matchId = String((b && b.matchId) || '');
  var latest = motmLatest_(matchId);
  if (!latest) throw new Error('Nothing to reopen.');
  if (latest.status === 'reopened') {
    motmAudit_('reopen-repeat', matchId, latest.id);
    return { ok: true, reopened: true, repeat: true, id: latest.id, matchId: matchId };
  }
  if (latest.status !== 'closed' && latest.status !== 'resolved') throw new Error('This vote is not closed.');
  var row = { id: motmId_(), matchId: matchId, date: latest.date, opp: latest.opp, status: 'reopened', winnerId: latest.winnerId, winnerName: latest.winnerName, winnerNum: latest.winnerNum, totals: latest.totals, at: Date.now() };
  motmWrite_(row);
  motmAudit_('reopen', matchId, latest.id);
  return { ok: true, reopened: true, repeat: false, id: row.id, matchId: matchId };
}

function motmStatus_(b) {
  motmAuth_(b);
  var matchId = String((b && b.matchId) || '');
  var elig = motmEligible_();
  var votes = [];
  try { votes = votes_().filter(function (v) { return v.kind === 'motm' && String(v.key) === matchId; }); } catch (e) {}
  var have = 0, seen = {};
  votes.forEach(function (v) { if (elig.voters.indexOf(String(v.voter)) >= 0 && !seen[v.voter]) { seen[v.voter] = 1; have++; } });
  var latest = motmLatest_(matchId);
  var body = {
    ok: true,
    matchId: matchId,
    auto: !!elig.reliable,
    reason: elig.reason || '',
    need: elig.reliable ? elig.voters.length : 0,
    have: have
  };
  if (latest && (latest.status === 'closed' || latest.status === 'resolved')) {
    var shaped = motmShape_(latest, false);
    body.closed = true;
    body.award = shaped;
  } else {
    body.closed = false;
  }
  return body;
}

function motmAwards_(b) {
  motmAuth_(b);
  var byMatch = {};
  motmRows_().forEach(function (r) { byMatch[r.matchId] = r; });
  var fixtures = [], seasons = {};
  Object.keys(byMatch).forEach(function (id) {
    var r = byMatch[id];
    var live = r.status === 'closed' || r.status === 'resolved';
    fixtures.push({ matchId: id, date: r.date, dateUK: motmUk_(r.date), opp: r.opp, status: r.status, winnerName: live ? r.winnerName : '', winnerNum: live ? r.winnerNum : '', winnerId: live ? r.winnerId : '' });
    if (!live) return;
    var season = motmSeason_(r.date) || 'Undated';
    if (!seasons[season]) seasons[season] = {};
    if (!seasons[season][r.winnerId]) seasons[season][r.winnerId] = { id: r.winnerId, name: r.winnerName, num: r.winnerNum, n: 0 };
    seasons[season][r.winnerId].n++;
  });
  fixtures.sort(function (a, c) { return String(a.date).localeCompare(String(c.date)); });
  var seasonList = Object.keys(seasons).sort().map(function (season) {
    var players = Object.keys(seasons[season]).map(function (id) { return seasons[season][id]; });
    players.sort(function (a, c) { return c.n - a.n || String(a.num).localeCompare(String(c.num)); });
    return { season: season, players: players };
  });
  return { ok: true, fixtures: fixtures, seasons: seasonList, playerOfYear: null };
}
