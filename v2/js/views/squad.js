/* Touchline Pro — squad: who is available, who needs minutes, what they have been set. */
(function () {
  'use strict';
  var TP = window.TP;
  var esc = TP.esc;

  var GROUPS = [
    { k: 'GK', t: 'Goalkeepers' },
    { k: 'DEF', t: 'Defenders' },
    { k: 'MID', t: 'Midfielders' },
    { k: 'ATT', t: 'Forwards' }
  ];

  function groupOf(p) {
    var line = TP.lineOf(p.pos);
    return line === 0 ? 'GK' : line === 1 ? 'DEF' : line === 2 ? 'MID' : 'ATT';
  }

  function row(p) {
    var mins = p.mins || 0;
    var open = TP.data.assignmentsFor(p.id).filter(function (a) { return !a.done; }).length;
    var avail = TP.data.available(p);
    return '<button class="row" style="width:100%;text-align:left;border:0;border-bottom:1px solid var(--line)" data-act="openPlayer" data-id="' + esc(p.id) + '">' +
      '<span class="avatar' + (avail ? '' : ' small') + '">' + esc(p.num) + '</span>' +
      '<span class="grow"><span class="t">' + esc(p.name) + (avail ? '' : ' <span class="tag red">Unavailable</span>') + '</span>' +
        '<span class="s">' + esc(p.pos) + (p.alt && p.alt.length ? ' · ' + esc(p.alt.join(', ')) : '') + ' · ' + mins + ' min last match</span>' +
        TP.ui.meter(mins / 70 * 100, mins < 30 ? 'low' : '') + '</span>' +
      '<span class="end">' + (open ? '<span class="tag blue">' + open + ' set</span>' : '') +
        TP.ui.icon('chevron', 'style="width:18px;height:18px;fill:none;stroke:var(--muted);stroke-width:2"') + '</span></button>';
  }

  function list() {
    var squad = TP.data.squad();
    var avail = squad.filter(function (p) { return TP.data.available(p); }).length;
    return '<div class="page-head"><div><p class="eyebrow">Team</p><h1>Squad</h1>' +
        '<p>' + squad.length + ' players · ' + avail + ' available</p></div></div>' +
      '<div class="card tight" style="margin-bottom:18px">' +
        '<div class="stats">' +
          '<div class="stat"><span class="v">' + avail + '</span><span class="k">Available</span></div>' +
          '<div class="stat"><span class="v">' + TP.data.openAssignments().length + '</span><span class="k">Clips out</span></div>' +
          '<div class="stat"><span class="v">' + squad.filter(function (p) { return (p.mins || 0) < 30; }).length + '</span><span class="k">Need minutes</span></div>' +
        '</div>' +
      '</div>' +
      GROUPS.map(function (g) {
        var ps = squad.filter(function (p) { return groupOf(p) === g.k; });
        if (!ps.length) return '';
        return '<section class="section"><div class="section-head"><h2>' + g.t + '</h2><span class="spacer"></span><span class="pill">' + ps.length + '</span></div>' +
          '<div class="card tight"><div class="list">' + ps.map(row).join('') + '</div></div></section>';
      }).join('') +
      '<p class="footnote">Tap a player to see his minutes, availability and the work you have set.</p>';
  }

  function detail(id) {
    var p = TP.data.player(id);
    if (!p) return TP.ui.empty('Player not found', 'Check the squad list.');
    var mins = p.mins || 0;
    var assignments = TP.data.assignmentsFor(p.id);
    var avail = TP.data.available(p);
    var pos = TP.data.position(p.pos);
    var clips = pos ? pos.clips.slice(0, 4) : [];

    return '<div class="page-head" style="align-items:center">' +
        '<button class="iconbtn" data-act="go" data-to="#/squad" aria-label="Back to squad">' + TP.ui.icon('back') + '</button>' +
        '<div class="grow"><p class="eyebrow">Player</p><h1 style="font-size:26px">' + esc(p.name) + '</h1></div></div>' +
      '<article class="hero">' +
        '<div class="row" style="border:0;padding:0;min-height:0">' +
          '<span class="avatar big amber">' + esc(p.num) + '</span>' +
          '<div class="grow" style="margin-left:12px"><h2 style="margin:0;font-size:22px">' + esc(p.name) + '</h2>' +
            '<p class="meta" style="margin-top:4px">' + esc(p.pos) + (p.alt && p.alt.length ? ' · covers ' + esc(p.alt.join(', ')) : '') + ' · ' + esc(p.foot || '') + ' foot</p></div>' +
        '</div>' +
        '<div class="stats" style="margin-top:16px;position:relative">' +
          '<div class="stat"><span class="v">' + mins + "'" + '</span><span class="k">Last match</span></div>' +
          '<div class="stat"><span class="v">' + assignments.filter(function (a) { return !a.done; }).length + '</span><span class="k">Work set</span></div>' +
          '<div class="stat"><span class="v" style="font-size:15px">' + (avail ? 'Yes' : 'No') + '</span><span class="k">Available</span></div>' +
        '</div>' +
        '<div class="cta"><button class="btn pri" data-act="msgPlayer" data-id="' + esc(p.id) + '">' + TP.ui.icon('message') + 'Message</button>' +
          '<button class="btn ghost" data-act="go" data-to="#/library">' + TP.ui.icon('plus') + 'Set work</button></div>' +
      '</article>' +
      '<section class="section"><div class="section-head"><h2>Availability</h2></div>' +
        '<div class="card tight"><button class="switch" role="switch" aria-checked="' + (avail ? 'true' : 'false') + '" data-act="toggleAvail" data-id="' + esc(p.id) + '">' +
          '<span class="avatar small">' + esc(p.num) + '</span>' +
          '<span class="grow"><b style="font-size:14px">' + (avail ? 'Available for selection' : 'Not available') + '</b>' +
            '<span class="s" style="display:block;font-size:12px;color:var(--muted)">Tap to change</span></span>' +
          '<span class="track" aria-hidden="true"></span></button></div></section>' +
      '<section class="section"><div class="section-head"><h2>Work set</h2><span class="spacer"></span><span class="pill">' + assignments.length + '</span></div>' +
        '<div class="card tight">' + (assignments.length ? '<div class="list">' + assignments.map(function (a) {
          return '<div class="row" style="min-height:52px">' +
            '<button class="iconbtn" style="width:38px;height:38px" data-act="toggleDone" data-id="' + esc(a.id) + '" aria-label="' + (a.done ? 'Mark not done' : 'Mark done') + '">' +
              TP.ui.icon(a.done ? 'check' : 'play') + '</button>' +
            '<span class="grow"><span class="t" style="font-size:13.5px;' + (a.done ? 'text-decoration:line-through;color:var(--muted)' : '') + '">' + esc(a.title) + '</span>' +
              '<span class="s">' + (a.done ? 'Done' : 'Waiting') + ' · set ' + TP.ukDate(new Date(a.at).toISOString().slice(0, 10)) + '</span></span>' +
            (a.url ? '<a class="btn sm ghost" href="' + esc(a.url) + '" target="_blank" rel="noopener" aria-label="Open">' + TP.ui.icon('external') + '</a>' : '') +
          '</div>';
        }).join('') + '</div>' : TP.ui.empty('Nothing set', 'Assign a drill or a clip from the library.')) + '</div></section>' +
      (clips.length ? '<section class="section"><div class="section-head"><h2>For his position</h2><span class="spacer"></span><span class="pill">' + esc(p.pos) + '</span></div>' +
        '<div class="card tight"><div class="list">' + clips.map(function (c) {
          return '<a class="itemrow" href="' + esc(c.u) + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">' +
            '<span class="kind ' + (c.ty === 'youtube' ? 'play' : '') + '">' + TP.ui.icon(c.ty === 'youtube' ? 'video' : 'link') + '</span>' +
            '<span class="body"><span class="t">' + esc(c.t) + '</span><span class="m"><span>' + esc(c.s || '') + '</span></span></span></a>';
        }).join('') + '</div></div></section>' : '') +
      '<p class="footnote">Minutes come from the last match you ran on this phone.</p>';
  }

  TP.views = TP.views || {};
  TP.views.squad = {
    render: function () {
      var parts = TP.route.parts;
      if (parts[0] === 'player') return detail(parts[1]);
      return list();
    },
    mount: function () {},
    unmount: function () {},
    toggleDone: function (aid) {
      var a = TP.store.state.assignments.filter(function (x) { return x.id === aid; })[0];
      if (!a) return;
      a.done = !a.done;
      TP.store.save();
      TP.app.render();
    },
    msgPlayer: function (id) {
      TP.views.comms.open({ playerId: id, name: 'Message ' + (TP.data.player(id) || {}).name });
    }
  };
})();
