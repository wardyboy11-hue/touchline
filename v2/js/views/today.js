/* Touchline Pro — Today. One glance: the next match, tonight's session, what needs you. */
(function () {
  'use strict';
  var TP = window.TP;
  var esc = TP.esc;

  function greet() {
    var h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  function fixtureHero(f) {
    if (!f) return '';
    var d = TP.daysUntil(f.date);
    var when = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : d > 1 ? f.ha === 'H' ? 'Home' : 'Away' : '';
    return '<article class="hero">' +
      '<div class="hero-top">' +
        '<span class="pill amber">Next match</span>' +
        '<span class="pill">' + esc(f.comp) + '</span>' +
      '</div>' +
      '<h2>' + (f.ha === 'H' ? 'v ' : 'at ') + esc(f.opp) + '</h2>' +
      '<p class="meta">' + esc(TP.longDate(f.date)) + ' · ' + esc(f.ko) + ' · ' + esc(f.venue) + '</p>' +
      '<div class="when"><b>' + (d === 0 ? 'Today' : d === 1 ? '1' : d > 0 ? d : '—') + '</b>' +
        '<span>' + (d > 1 ? 'days to go' : d === 1 ? 'day to go' : d === 0 ? 'Kick off ' + esc(f.ko) : '') + '</span></div>' +
      '<div class="cta">' +
        '<button class="btn pri" data-act="go" data-to="#/match">' + TP.ui.icon('ball') + 'Open match day</button>' +
        '<a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' +
          encodeURIComponent(f.addr || f.venue) + '">' + TP.ui.icon('pin') + 'Directions</a>' +
      '</div>' +
    '</article>';
  }

  function liveCard() {
    var m = TP.match.current();
    if (!m || m.status === 'done') return '';
    var sc = TP.match.score(m);
    var us = sc[0], them = sc[1];
    var left = m.ha === 'H' ? us : them, right = m.ha === 'H' ? them : us;
    return '<button class="card card-accent clickable" data-act="go" data-to="#/match" style="width:100%;text-align:left;margin-bottom:14px">' +
      '<span class="row" style="border:0;padding:0;min-height:0">' +
        '<span class="grow"><span class="badge-live">Live now</span>' +
          '<b style="display:block;font-size:17px;margin-top:6px">' + esc(m.opp) + ' · ' + left + '–' + right + '</b>' +
          '<span class="sub" style="display:block">' + TP.fmtClock(TP.match.msec(m)) + ' · tap to go back to the touchline</span></span>' +
        '<span class="avatar amber">' + TP.ui.icon('ball') + '</span>' +
      '</span></button>';
  }

  function sessionCard(s) {
    if (!s) return '';
    var mins = TP.data.sessionMinutes(s);
    var today = s.date === TP.isoToday();
    var bar = (s.blocks || []).map(function (b, i) {
      var cls = i === 0 ? 'a' : i === (s.blocks.length - 1) ? 'c' : 'b';
      return '<i class="' + cls + '" style="flex:' + (Number(b.mins) || 1) + '"></i>';
    }).join('');
    return '<article class="card">' +
      '<div class="row" style="border:0;padding:0;min-height:0">' +
        '<div class="grow">' +
          '<span class="eyebrow">' + (today ? 'Tonight' : TP.ukDate(s.date)) + '</span>' +
          '<h2 style="margin-top:4px">' + esc(s.title) + '</h2>' +
          '<p class="sub">' + esc(s.theme) + ' · ' + mins + ' minutes · ' + (s.blocks || []).length + ' blocks</p>' +
        '</div>' +
        '<span class="avatar amber">' + TP.ui.icon('whistle') + '</span>' +
      '</div>' +
      '<div class="blocksbar" aria-hidden="true">' + bar + '</div>' +
      '<div class="card-actions">' +
        '<button class="btn pri" data-act="openSession" data-id="' + esc(s.id) + '">Open session</button>' +
        '<button class="btn ghost" data-act="runSession" data-id="' + esc(s.id) + '">' + TP.ui.icon('play') + 'Start</button>' +
      '</div>' +
    '</article>';
  }

  function quickActions() {
    var items = [
      { act: 'go', to: '#/match', ic: 'ball', t: 'Match day', s: 'Clock, goals, subs' },
      { act: 'go', to: '#/sessions', ic: 'whistle', t: 'Plan session', s: 'Blocks and drills' },
      { act: 'go', to: '#/library', ic: 'library', t: 'Find a drill', s: 'Library and clips' },
      { act: 'comms', ic: 'message', t: 'Message team', s: 'Templates that fill in' }
    ];
    return '<div class="grid two">' + items.map(function (i) {
      return '<button class="card tight clickable" data-act="' + i.act + '"' + (i.to ? ' data-to="' + i.to + '"' : '') + ' style="text-align:left;display:flex;gap:12px;align-items:center">' +
        '<span class="avatar">' + TP.ui.icon(i.ic) + '</span>' +
        '<span class="grow"><b style="display:block;font-size:14px">' + i.t + '</b><span class="tiny muted">' + i.s + '</span></span>' +
        '</button>';
    }).join('') + '</div>';
  }

  function needsYou() {
    var rows = [];
    var unavailable = TP.data.squad().filter(function (p) { return !TP.data.available(p); });
    if (unavailable.length) {
      rows.push({ ic: 'users', t: unavailable.length + ' unavailable for Sunday', s: unavailable.map(function (p) { return p.name; }).join(', '), to: '#/match' });
    }
    var low = TP.data.squad().filter(function (p) { return (p.mins || 0) > 0 && p.mins < 30; });
    if (low.length) {
      rows.push({ ic: 'target', t: low.length + ' lads short of minutes', s: low.map(function (p) { return p.name; }).join(', '), to: '#/squad' });
    }
    var open = TP.data.openAssignments();
    if (open.length) {
      rows.push({ ic: 'library', t: open.length + ' clips outstanding', s: 'Set this week for players to watch', to: '#/squad' });
    }
    if (!rows.length) {
      rows.push({ ic: 'check', t: 'Nothing waiting', s: 'Squad available, work up to date' });
    }
    return '<div class="list">' + rows.map(function (r) {
      return '<button class="row" data-act="go" data-to="' + (r.to || '#/today') + '" style="width:100%;text-align:left;border:0;border-bottom:1px solid var(--line)">' +
        '<span class="avatar">' + TP.ui.icon(r.ic) + '</span>' +
        '<span class="grow"><span class="t">' + esc(r.t) + '</span><span class="s">' + esc(r.s) + '</span></span>' +
        (r.to ? TP.ui.icon('chevron', 'class="chev" style="width:18px;height:18px;fill:none;stroke:var(--muted);stroke-width:2"') : '') +
      '</button>';
    }).join('') + '</div>';
  }

  function lastResult() {
    var m = TP.match.current();
    var r = m && m.status === 'done' ? m : TP.data.lastResult();
    if (!r) return '';
    var sc;
    var motm = null;
    if (r.events) {
      sc = TP.match.score(r);
      var ours = sc[0], theirs = sc[1];
      var win = ours > theirs ? 'Won' : ours === theirs ? 'Drew' : 'Lost';
    } else {
      ours = r.score[0]; theirs = r.score[1];
      win = ours > theirs ? 'Won' : ours === theirs ? 'Drew' : 'Lost';
      motm = TP.data.player(r.motm);
    }
    var m2 = TP.store.state.match;
    if (m2 && m2.status === 'done' && m2.motm) motm = TP.data.player(m2.motm);
    return '<article class="card tight">' +
      '<div class="row" style="border:0;padding:0;min-height:0">' +
        '<div class="grow"><span class="eyebrow">Last match</span>' +
          '<h2 style="margin-top:4px">' + win + ' ' + ours + '–' + theirs + ' ' + (r.ha === 'H' ? 'v' : 'at') + ' ' + esc(r.opp) + '</h2>' +
          '<p class="sub">' + TP.ukDate(r.date) + (motm ? ' · Man of the match: ' + esc(motm.name) : '') + '</p></div>' +
        '<span class="pill ' + (win === 'Won' ? 'green' : win === 'Drew' ? 'blue' : 'red') + '">' + win + '</span>' +
      '</div></article>';
  }

  TP.views = TP.views || {};
  TP.views.today = {
    render: function () {
      var f = TP.data.nextFixture();
      var s = TP.data.nextSession();
      var club = TP.data.club();
      return '<div class="page-head"><div><p class="eyebrow">' + esc(TP.ukDate(TP.isoToday(), { weekday: 'long', day: 'numeric', month: 'long' })) + '</p>' +
          '<h1>' + greet() + ', ' + esc(club.coach || 'coach') + '</h1>' +
          '<p>' + esc(club.short || '') + ' · ' + esc(club.season || '') + '</p></div></div>' +
        liveCard() +
        fixtureHero(f) +
        '<section class="section"><div class="section-head"><h2>Tonight’s session</h2><span class="spacer"></span><button class="linkbtn" data-act="go" data-to="#/sessions">All sessions</button></div>' +
          sessionCard(s) + '</section>' +
        '<section class="section"><div class="section-head"><h2>Quick actions</h2></div>' + quickActions() + '</section>' +
        '<section class="section"><div class="section-head"><h2>Needs you</h2><span class="spacer"></span><button class="linkbtn" data-act="go" data-to="#/squad">Squad</button></div>' +
          '<div class="card tight">' + needsYou() + '</div></section>' +
        '<section class="section"><div class="section-head"><h2>Form</h2></div>' + lastResult() + '</section>' +
        '<div class="sponsor"><span>Proudly sponsored by</span><img src="../mfs.png" alt="MFS Limited"></div>' +
        '<p class="footnote">Touchline Pro · demo club data</p>';
    }
  };
})();
