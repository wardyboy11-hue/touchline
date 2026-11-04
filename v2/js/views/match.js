/* Touchline Pro — match day. Pick the XI, run the clock, make the sub, take the result. */
(function () {
  'use strict';
  var TP = window.TP;
  var esc = TP.esc;
  var HALF = 35 * 60;
  var sel = { off: null, on: null };
  var tick = null;

  function fixture() {
    var m = TP.match.current();
    if (m) return TP.data.fixture(m.id) || m;
    return TP.data.nextFixture();
  }

  function fitTag(f) {
    if (f >= 3) return '<span class="tag green">Natural</span>';
    if (f === 2) return '<span class="tag blue">Covers it</span>';
    if (f === 1) return '<span class="tag">Same line</span>';
    return '<span class="tag red">Out of position</span>';
  }

  function fixtureHead(f) {
    return '<div class="page-head"><div>' +
      '<p class="eyebrow">Match day</p>' +
      '<h1>' + (f.ha === 'H' ? 'v ' : 'at ') + esc(f.opp) + '</h1>' +
      '<p>' + esc(TP.longDate(f.date)) + ' · ' + esc(f.ko) + ' · ' + esc(f.comp) + ' · ' + esc(f.venue) + '</p>' +
      '</div></div>';
  }

  /* ---------- pre-match ---------- */
  function preMatch(f) {
    var filled = TP.lineup.filled();
    var avail = TP.data.squad().filter(function (p) { return TP.data.available(p); });
    var tokens = TP.lineup.slots().map(function (s) {
      var pid = TP.lineup.get()[s.k];
      var p = pid ? TP.data.player(pid) : null;
      return {
        x: s.x, y: s.y, k: s.k, id: pid || '',
        num: p ? p.num : s.k, name: p ? p.name : 'Pick',
        cls: p ? '' : 'empty', act: 'slotPick'
      };
    });
    return fixtureHead(f) +
      '<article class="card">' +
        '<div class="row" style="border:0;padding:0;min-height:0">' +
          '<div class="grow"><h2>' + (f.ha === 'H' ? 'Home' : 'Away') + ' · ' + esc(f.ko) + '</h2>' +
            '<p class="sub">' + esc(f.venue) + '</p></div>' +
          '<a class="btn sm ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(f.addr || f.venue) + '">' + TP.ui.icon('pin') + 'Directions</a>' +
        '</div>' +
      '</article>' +
      '<section class="section"><div class="section-head"><h2>Starting XI</h2><span class="spacer"></span>' +
        '<span class="pill ' + (filled === 11 ? 'green' : 'amber') + '">' + filled + ' of 11</span></div>' +
        '<div class="card">' +
          '<div class="row" style="border:0;padding:0;min-height:0;margin-bottom:12px">' +
            '<span class="pill blue">' + esc(TP.formations[TP.store.state.formation || '4231'].name) + '</span>' +
            '<span class="spacer" style="flex:1"></span>' +
            '<button class="btn sm" data-act="suggestXI">Suggest XI</button>' +
            '<button class="btn sm ghost" data-act="clearXI">Clear</button>' +
          '</div>' +
          TP.ui.pitch(tokens) +
          '<p class="small muted" style="margin-top:10px">Tap a shirt to pick the player. The list puts natural positions first.</p>' +
        '</div>' +
      '</section>' +
      '<section class="section"><div class="section-head"><h2>Bench</h2><span class="spacer"></span><span class="pill">' + TP.lineup.bench().length + ' available</span></div>' +
        '<div class="card tight"><div class="list">' +
          (TP.lineup.bench().length ? TP.lineup.bench().map(function (p) {
            return '<div class="row"><span class="avatar">' + esc(p.num) + '</span>' +
              '<span class="grow"><span class="t">' + esc(p.name) + '</span><span class="s">' + esc(p.pos) + (p.alt && p.alt.length ? ' · ' + esc(p.alt.join(', ')) : '') + '</span></span>' +
              '</div>';
          }).join('') : TP.ui.empty('Everyone is in the XI', 'Nobody left on the bench.')) +
        '</div></div>' +
      '</section>' +
      '<section class="section"><div class="section-head"><h2>Availability</h2><span class="spacer"></span><span class="pill">' + avail.length + ' of ' + TP.data.squad().length + '</span></div>' +
        '<div class="card tight"><div class="list">' + TP.data.squad().map(function (p) {
          var on = TP.data.available(p);
          return '<button class="switch" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" data-act="toggleAvail" data-id="' + esc(p.id) + '">' +
            '<span class="avatar small">' + esc(p.num) + '</span>' +
            '<span class="grow"><b style="font-size:14px">' + esc(p.name) + '</b><span class="s" style="display:block;font-size:12px;color:var(--muted)">' + esc(p.pos) + '</span></span>' +
            '<span class="track" aria-hidden="true"></span></button>';
        }).join('') + '</div></div>' +
        '<p class="small muted" style="margin-top:8px">Toggle a player off if he cannot play. He drops out of the bench and the picker.</p>' +
      '</section>' +
      '<button class="btn pri block" data-act="kickoff" ' + (filled === 11 ? '' : 'disabled') + '>' + TP.ui.icon('play') + 'Kick off' + (filled === 11 ? '' : ' · pick all 11') + '</button>' +
      '<p class="footnote">The clock, goals and minutes stay on this phone.</p>';
  }

  function slotPicker(slotKey) {
    var f = fixture();
    var current = TP.lineup.get()[slotKey] || '';
    var picked = TP.lineup.get();
    var taken = Object.keys(picked).filter(function (k) { return k !== slotKey; }).map(function (k) { return picked[k]; });
    var rows = TP.data.squad().filter(function (p) {
      return TP.data.available(p) && taken.indexOf(p.id) === -1;
    }).map(function (p) {
      return { p: p, fit: TP.lineup.fit(p, slotKey) };
    }).sort(function (a, b) { return b.fit - a.fit || (Number(a.p.num) || 99) - (Number(b.p.num) || 99); });

    var html = '<p class="small muted" style="margin:10px 0 4px">' + (f ? esc(f.opp) + ' · ' : '') + 'pick the player for <b>' + esc(slotKey) + '</b>.</p>' +
      '<div class="list">' + (rows.length ? rows.map(function (r) {
        return '<button class="row" style="width:100%;text-align:left;border:0;border-bottom:1px solid var(--line)" data-act="setSlot" data-k="' + esc(slotKey) + '" data-id="' + esc(r.p.id) + '">' +
          '<span class="avatar' + (r.fit >= 3 ? ' amber' : '') + '">' + esc(r.p.num) + '</span>' +
          '<span class="grow"><span class="t">' + esc(r.p.name) + '</span><span class="s">' + esc(r.p.pos) + (r.p.alt && r.p.alt.length ? ' · ' + esc(r.p.alt.join(', ')) : '') + '</span></span>' +
          '<span class="end">' + fitTag(r.fit) + (r.p.id === current ? '<span class="tag amber">In</span>' : '') + '</span>' +
        '</button>';
      }).join('') : TP.ui.empty('Nobody free', 'Everyone else is unavailable or already in the XI.')) + '</div>' +
      '<button class="btn block ghost" style="margin-top:12px" data-act="setSlot" data-k="' + esc(slotKey) + '" data-id="">Leave this slot empty</button>';
    TP.ui.sheet('Pick ' + slotKey, html);
  }

  /* ---------- live ---------- */
  function scoreboard(m) {
    var sc = TP.match.score(m);
    var us = sc[0], them = sc[1];
    var phase = m.status === 'ht' ? 'Half time' : m.period === 2 ? 'Second half' : 'First half';
    return '<div class="scoreboard">' +
      '<div class="team"><b>Latics Blues</b><span class="goals">' + us + '</span></div>' +
      '<div class="middle"><span class="clock' + (m.status === 'ht' ? ' small' : '') + '" id="matchClock">' + TP.fmtClock(TP.match.msec(m)) + '</span>' +
        '<span class="phase">' + phase + '</span></div>' +
      '<div class="team right"><b>' + esc(m.opp) + '</b><span class="goals">' + them + '</span></div>' +
    '</div>';
  }

  function live(m) {
    var t = TP.match.msec(m);
    var onPitch = Object.keys(m.lineup).map(function (k) { return m.lineup[k]; });
    var bench = TP.lineup.bench().filter(function (p) { return onPitch.indexOf(p.id) === -1; });
    var every = onPitch.concat(bench.map(function (p) { return p.id; }));

    var controls = m.status === 'ht'
      ? '<button class="btn pri block" data-act="secondHalf">' + TP.ui.icon('play') + 'Start second half</button>'
      : '<div class="btnrow">' +
          '<button class="btn pri" data-act="goal">' + TP.ui.icon('ball') + 'Goal</button>' +
          '<button class="btn danger" data-act="ga">Goal against</button>' +
          '<button class="btn ghost" data-act="toggleClock">' + TP.ui.icon(m.clock.running ? 'pause' : 'play') + (m.clock.running ? 'Pause' : 'Resume') + '</button>' +
          '<button class="btn ghost" data-act="' + (m.period === 1 ? 'halfTime' : 'fullTime') + '">' + (m.period === 1 ? 'Half time' : 'Full time') + '</button>' +
        '</div>' +
        (m.period === 1 ? '<button class="btn sm ghost block" style="margin-top:8px" data-act="fullTime">Finish the match</button>' : '');

    var subCard = '<article class="card"><h3>Quick sub</h3>' +
      '<p class="small muted" style="margin:4px 0 10px">' + (sel.off ? 'Now tap who comes on.' : 'Tap the player coming off.') + '</p>' +
      '<div class="list">' +
        onPitch.map(function (pid) {
          var p = TP.data.player(pid); if (!p) return '';
          var mins = TP.match.minutes(m, pid);
          var pct = Math.min(100, mins / HALF * 100);
          return '<button class="row" style="width:100%;text-align:left;border:0;border-bottom:1px solid var(--line)" data-act="pickOff" data-id="' + esc(pid) + '">' +
            '<span class="avatar' + (sel.off === pid ? ' amber' : '') + '">' + esc(p.num) + '</span>' +
            '<span class="grow"><span class="t">' + esc(p.name) + '</span>' + TP.ui.meter(pct, pct < 50 ? 'low' : '') +
              '<span class="s" data-mins="' + esc(pid) + '">' + Math.floor(mins / 60) + ' minutes</span></span>' +
            '<span class="end">' + (sel.off === pid ? '<span class="tag amber">Coming off</span>' : '') + '</span>' +
          '</button>';
        }).join('') +
        (bench.length ? bench.map(function (p) {
          var mins = TP.match.minutes(m, p.id);
          return '<button class="row" style="width:100%;text-align:left;border:0;border-bottom:1px solid var(--line);background:rgba(108,151,255,.05)" data-act="pickOn" data-id="' + esc(p.id) + '">' +
            '<span class="avatar' + (sel.on === p.id ? ' amber' : '') + ' small">' + esc(p.num) + '</span>' +
            '<span class="grow"><span class="t">' + esc(p.name) + ' <span class="tag blue">Bench</span></span>' +
              '<span class="s">' + (mins ? Math.floor(mins / 60) + ' minutes played' : 'Not on yet') + '</span></span>' +
            '<span class="end">' + TP.ui.icon('chevron', 'style="width:16px;height:16px;fill:none;stroke:var(--muted);stroke-width:2"') + '</span>' +
          '</button>';
        }).join('') : '') +
      '</div></article>';

    var feed = (m.events || []).slice(-7).reverse().map(function (e) {
      return '<div class="row" style="min-height:44px"><span class="avatar small mono" style="font-size:11px">' + esc(e.t == null ? '' : Math.floor(e.t / 60) + "'") + '</span>' +
        '<span class="grow"><span class="t" style="font-weight:600;font-size:13.5px">' + eventText(m, e) + '</span></span></div>';
    }).join('');

    return '<div class="page-head"><div><p class="eyebrow">Live</p><h1>' + (m.ha === 'H' ? 'v ' : 'at ') + esc(m.opp) + '</h1>' +
        '<p>' + esc(m.comp) + ' · ' + esc(TP.ukDate(m.date)) + '</p></div></div>' +
      scoreboard(m) +
      '<div class="card tight">' + controls + '</div>' +
      '<section class="section">' + subCard + '</section>' +
      '<section class="section"><div class="section-head"><h2>Minutes</h2><span class="spacer"></span><span class="pill">Half is ' + (HALF / 60) + ' min</span></div>' +
        '<div class="card tight"><div class="list">' + every.sort(function (a, b) { return TP.match.minutes(m, a) - TP.match.minutes(m, b); }).map(function (pid) {
          var p = TP.data.player(pid); if (!p) return '';
          var mins = TP.match.minutes(m, pid);
          var pct = Math.min(100, mins / HALF * 100);
          return '<div class="row" style="min-height:44px"><span class="avatar small">' + esc(p.num) + '</span>' +
            '<span class="grow"><span class="t" style="font-size:13.5px">' + esc(p.name) + '</span>' + TP.ui.meter(pct, pct < 50 ? 'low' : '') + '</span>' +
            '<span class="end small mono" data-mins="' + esc(pid) + '">' + Math.floor(mins / 60) + "'" + '</span></div>';
        }).join('') + '</div></div></section>' +
      '<section class="section"><div class="section-head"><h2>Match log</h2><span class="spacer"></span>' +
        '<button class="btn sm ghost" data-act="undo"' + (m.events.length ? '' : ' disabled') + '>Undo</button></div>' +
        '<div class="card tight">' + (feed || TP.ui.empty('Nothing logged yet', 'Goals, subs and the clock land here.')) + '</div></section>' +
      '<button class="btn danger block" data-act="fullTime">' + TP.ui.icon('flag') + 'Full time</button>';
  }

  function eventText(m, e) {
    function name(pid) { var p = TP.data.player(pid); return p ? esc(p.name) : ''; }
    switch (e.type) {
      case 'ko': return 'Kick off';
      case 'ht': return 'Half time';
      case 'second': return 'Second half starts';
      case 'ft': return 'Full time';
      case 'goal': return '<b>Goal</b>' + (e.pid ? ' · ' + name(e.pid) : '');
      case 'ga': return '<b>Goal against</b>';
      case 'sub': return 'Sub · ' + name(e.on) + ' on for ' + name(e.off);
      default: return esc(e.type);
    }
  }

  function scorerSheet() {
    var m = TP.match.current();
    if (!m) return;
    var ids = Object.keys(m.lineup).map(function (k) { return m.lineup[k]; });
    var rows = ids.map(function (pid) {
      var p = TP.data.player(pid); if (!p) return '';
      return '<button class="row" style="width:100%;text-align:left;border:0;border-bottom:1px solid var(--line)" data-act="pickScorer" data-id="' + esc(pid) + '">' +
        '<span class="avatar amber">' + esc(p.num) + '</span>' +
        '<span class="grow"><span class="t">' + esc(p.name) + '</span><span class="s">' + esc(p.pos) + '</span></span></button>';
    }).join('');
    TP.ui.sheet('Who scored?', '<div class="list" style="margin-top:8px">' + rows + '</div>' +
      '<button class="btn block ghost" style="margin-top:12px" data-act="pickScorer" data-id="">Team goal, no scorer</button>');
  }

  /* ---------- full time ---------- */
  function summary(m) {
    var sc = TP.match.score(m);
    var ours = sc[0], theirs = sc[1];
    var result = ours > theirs ? 'Won' : ours === theirs ? 'Drew' : 'Lost';
    var f = TP.data.fixture(m.id) || m;
    var ids = Object.keys(m.stints);
    var motm = m.motm ? TP.data.player(m.motm) : null;
    return '<div class="page-head"><div><p class="eyebrow">Full time</p><h1>' + result + ' ' + ours + '–' + theirs + '</h1>' +
        '<p>' + (m.ha === 'H' ? 'v ' : 'at ') + esc(m.opp) + ' · ' + esc(TP.ukDate(m.date)) + '</p></div></div>' +
      '<article class="hero"><div class="hero-top"><span class="pill ' + (result === 'Won' ? 'green' : result === 'Drew' ? 'blue' : 'red') + '">' + result + '</span>' +
        '<span class="pill">' + esc(m.comp) + '</span></div>' +
        '<div class="stats" style="margin-top:16px;position:relative">' +
          '<div class="stat"><span class="v">' + ours + '–' + theirs + '</span><span class="k">Score</span></div>' +
          '<div class="stat"><span class="v">' + (ids.length) + '</span><span class="k">Players used</span></div>' +
          '<div class="stat"><span class="v">' + Math.floor(TP.match.msec(m) / 60) + "'" + '</span><span class="k">Clock</span></div>' +
        '</div></article>' +
      '<section class="section"><div class="section-head"><h2>Minutes</h2></div>' +
        '<div class="card tight"><div class="list">' + ids.map(function (pid) {
          var p = TP.data.player(pid); if (!p) return '';
          var mins = TP.match.minutes(m, pid);
          return '<div class="row" style="min-height:48px"><span class="avatar small">' + esc(p.num) + '</span>' +
            '<span class="grow"><span class="t">' + esc(p.name) + '</span>' + TP.ui.meter(mins / HALF * 100, mins / HALF * 100 < 50 ? 'low' : '') + '</span>' +
            '<span class="end small mono">' + Math.floor(mins / 60) + "'" + '</span></div>';
        }).join('') + '</div></div></section>' +
      '<section class="section"><div class="section-head"><h2>Man of the match</h2></div>' +
        '<div class="card tight"><button class="switch" data-act="pickMotm">' +
          '<span class="avatar amber">' + (motm ? esc(motm.num) : '?') + '</span>' +
          '<span class="grow"><b style="font-size:14px">' + (motm ? esc(motm.name) : 'Pick your man of the match') + '</b>' +
            '<span class="s" style="display:block;font-size:12px;color:var(--muted)">' + (motm ? esc(motm.pos) + ' · tap to change' : 'Tap to choose') + '</span></span>' +
          '<span class="track" style="visibility:hidden"></span></button></div></section>' +
      '<div class="btnrow"><button class="btn pri" data-act="shareReport">' + TP.ui.icon('share') + 'Share report</button>' +
        '<button class="btn ghost" data-act="newMatch">' + TP.ui.icon('plus') + 'New match</button></div>' +
      '<p class="footnote">Result stays on this phone until you start the next match.</p>';
  }

  function motmSheet() {
    var m = TP.match.current();
    if (!m) return;
    var rows = Object.keys(m.stints).map(function (pid) {
      var p = TP.data.player(pid); if (!p) return '';
      return '<button class="row" style="width:100%;text-align:left;border:0;border-bottom:1px solid var(--line)" data-act="setMotm" data-id="' + esc(pid) + '">' +
        '<span class="avatar">' + esc(p.num) + '</span><span class="grow"><span class="t">' + esc(p.name) + '</span>' +
        '<span class="s">' + Math.floor(TP.match.minutes(m, pid) / 60) + ' minutes</span></span></button>';
    }).join('');
    TP.ui.sheet('Man of the match', '<div class="list" style="margin-top:8px">' + rows + '</div>');
  }

  TP.views = TP.views || {};
  TP.views.match = {
    render: function () {
      var m = TP.match.current();
      if (m && m.status !== 'done') return live(m);
      if (m && m.status === 'done') return summary(m);
      var f = TP.data.nextFixture();
      if (!f) return TP.ui.empty('No fixture', 'Add a fixture to plan the next match.');
      return preMatch(f);
    },
    mount: function () {
      clearInterval(tick);
      var m = TP.match.current();
      if (!m || m.status !== 'live') return;
      tick = setInterval(function () {
        var mm = TP.match.current();
        if (!mm) return;
        var el = document.getElementById('matchClock');
        if (el) el.textContent = TP.fmtClock(TP.match.msec(mm));
        document.querySelectorAll('[data-mins]').forEach(function (node) {
          var secs = TP.match.minutes(mm, node.getAttribute('data-mins'));
          node.textContent = node.classList.contains('mono') ? Math.floor(secs / 60) + "'" : Math.floor(secs / 60) + ' minutes';
        });
      }, 500);
    },
    unmount: function () { clearInterval(tick); tick = null; },
    /* actions used by the router */
    slotPicker: slotPicker,
    scorerSheet: scorerSheet,
    motmSheet: motmSheet,
    selection: sel,
    resetSelection: function () { sel.off = null; sel.on = null; }
  };
})();
