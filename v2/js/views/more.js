/* Touchline Pro — more: every tool that is not on the bar, plus the club's pages. */
(function () {
  'use strict';
  var TP = window.TP;
  var esc = TP.esc;

  function rows(items) {
    return '<div class="card tight"><div class="list">' + items.map(function (i) {
      return '<button class="row" style="width:100%;text-align:left;border:0;border-bottom:1px solid var(--line)" data-act="go" data-to="' + esc(i.to) + '">' +
        '<span class="avatar small">' + TP.ui.icon(i.ic) + '</span>' +
        '<span class="grow"><span class="t">' + esc(i.t) + '</span><span class="s">' + esc(i.s) + '</span></span>' +
        '<span class="end">' + TP.ui.icon('chevron', 'style="width:18px;height:18px;fill:none;stroke:var(--muted);stroke-width:2"') + '</span>' +
      '</button>';
    }).join('') + '</div></div>';
  }

  function links(items) {
    return '<div class="card tight"><div class="list">' + items.map(function (i) {
      return '<a class="row" href="' + esc(i.u) + '" target="_blank" rel="noopener" style="text-decoration:none">' +
        '<span class="avatar small">' + TP.ui.icon(i.ic) + '</span>' +
        '<span class="grow"><span class="t">' + esc(i.t) + '</span><span class="s">' + esc(i.s) + '</span></span>' +
        '<span class="end">' + TP.ui.icon('external', 'style="width:18px;height:18px;fill:none;stroke:var(--muted);stroke-width:2"') + '</span>' +
      '</a>';
    }).join('') + '</div></div>';
  }

  function render() {
    var club = TP.data.club();
    var ground = 'https://www.google.com/maps/dir/?api=1&destination=';
    return '<div class="page-head"><div><p class="eyebrow">Touchline Pro</p><h1>More</h1>' +
        '<p>Everything else, in two taps or fewer.</p></div></div>' +

      '<section class="section"><div class="section-head"><h2>Coach tools</h2></div>' +
        rows([
          { to: '#/guides', ic: 'book', t: 'How-to guides', s: 'Videos, walkthroughs and the club PDFs' },
          { to: '#/attendance', ic: 'check', t: 'Attendance', s: 'Who was there, who stood out' },
          { to: '#/roles', ic: 'users', t: 'Role guides', s: 'Every position and the clips for it' },
          { to: '#/sessions', ic: 'whistle', t: 'Session planner', s: 'Blocks, drills and the running order' },
          { to: '#/library', ic: 'library', t: 'Library', s: 'Drills, clips and the coaches’ index' },
          { to: '#/squad', ic: 'squad', t: 'Squad', s: 'Availability, minutes and work set' }
        ]) +
      '</section>' +

      '<section class="section"><div class="section-head"><h2>Club</h2></div>' +
        links([
          { u: ground + encodeURIComponent(club.home || ''), ic: 'pin', t: club.home || 'Home ground', s: 'Directions to home' },
          { u: ground + encodeURIComponent(club.training || ''), ic: 'pin', t: club.training || 'Training venue', s: 'Directions to training' },
          { u: club.guide || '../Wigan_Junior_Latics_Visiting_Teams_Guide.pdf', ic: 'file', t: 'Visiting teams guide', s: 'Send this to away teams' },
          { u: '../parents.html', ic: 'link', t: 'Parents page', s: 'What families see each week' },
          { u: '../family.html', ic: 'link', t: 'Family page', s: 'Fixtures, results and notices' },
          { u: '../coach/index.html', ic: 'external', t: 'Full club app', s: 'Contacts, welfare and the FA squad list' }
        ]) +
      '</section>' +

      '<section class="section"><div class="section-head"><h2>About</h2></div>' +
        '<div class="card tight">' +
          '<p class="small" style="line-height:1.6">Touchline Pro is the coach console for ' + esc(club.name || 'the club') +
            '. Same jobs as the club app, in a shell that opens instantly.</p>' +
          '<div class="stats" style="margin-top:14px">' +
            '<div class="stat"><span class="v" style="font-size:16px">' + esc(club.season || '') + '</span><span class="k">Season</span></div>' +
            '<div class="stat"><span class="v" style="font-size:16px">' + TP.data.squad().length + '</span><span class="k">Squad</span></div>' +
            '<div class="stat"><span class="v" style="font-size:16px">' + TP.data.drills().length + '</span><span class="k">Drills</span></div>' +
          '</div>' +
          '<div class="note" style="margin-top:14px"><b>Sample squad.</b> Club, badge, drills and the library are real. Players, fixtures and results are sample data kept on this phone until the club code is connected.</div>' +
          '<button class="btn block ghost" style="margin-top:14px" data-act="resetDemo">' + TP.ui.icon('close') + 'Reset demo data</button>' +
        '</div>' +
      '</section>' +

      '<div class="sponsor"><span>Proudly sponsored by</span><img src="../mfs.png" alt="MFS Limited"></div>';
  }

  TP.views = TP.views || {};
  TP.views.more = { render: render };
})();
