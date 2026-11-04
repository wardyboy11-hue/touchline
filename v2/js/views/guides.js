/* Touchline Pro — guides and how-to. The videos and documents from the club app,
   one tap away. Nothing streams until a card is tapped. */
(function () {
  'use strict';
  var TP = window.TP;
  var esc = TP.esc;

  var COACH = [
    {
      id: 'tour', t: 'A quick tour', s: 'Start here. The five tabs and where everything lives, in two minutes.',
      len: '1:52', poster: '../coach/howto/01-tour.jpg',
      src: '../coach/howto/01-tour.mp4', vtt: '../coach/howto/01-tour.vtt'
    },
    {
      id: 'match', t: 'Match day, step by step', s: 'Confirm the referee, pull in answers, pick the side, run it live.',
      len: '1:55', poster: '../coach/howto/02-match-day.jpg',
      src: '../coach/howto/02-match-day.mp4', vtt: '../coach/howto/02-match-day.vtt'
    },
    {
      id: 'train', t: 'Plan and run training', s: 'Publish the session, run it on the night, take attendance after.',
      len: '1:11', poster: '../coach/howto/03-training.jpg',
      src: '../coach/howto/03-training.mp4', vtt: '../coach/howto/03-training.vtt'
    },
    {
      id: 'comms', t: 'Sending messages', s: 'Alerts, polls, and the anonymous player voice.',
      len: '1:23', poster: '../coach/howto/04-comms.jpg',
      src: '../coach/howto/04-comms.mp4', vtt: '../coach/howto/04-comms.vtt'
    }
  ];

  var FAMILY = [
    {
      id: 'parents', t: 'Guide for parents', s: 'What the season looks like, and what we ask of families.',
      len: '0:58', poster: '../guide_parents_new.jpg',
      src: '../guide_parents_new.mp4', vtt: '../guide_parents_new.vtt'
    },
    {
      id: 'players', t: 'Guide for players', s: 'How to use Touchline, from the lads’ side.',
      len: '1:37', poster: '../guide_players.jpg',
      src: '../guide_players.mp4', vtt: '../guide_players.vtt'
    }
  ];

  var READING = [
    { t: 'Touchline coach guide', s: 'The club’s walkthrough of the app, week to week', u: '../coach/Touchline_Coach_Guide.pdf' },
    { t: 'Visiting teams guide', s: 'Maps, parking, toilets and refreshments for away teams', u: '../Wigan_Junior_Latics_Visiting_Teams_Guide.pdf' },
    { t: 'Week 1 session plan', s: 'Shape to receive, first pass forward, full plan', u: '../plans/w1_shape_to_receive_session.pdf' }
  ];

  var PAGES = [
    { t: 'Parents page', s: 'What families see each week', u: '../parents.html' },
    { t: 'Family page', s: 'Fixtures, results and club notices', u: '../family.html' },
    { t: 'Ten minute stretch', s: 'Players can do this at home', u: '../stretch/index.html' },
    { t: 'Shape walkthrough', s: 'Every role in the 4-2-3-1', u: '../shape/index.html' }
  ];

  function card(v, first) {
    return '<button class="vcard" data-act="guideVideo" data-id="' + esc(v.id) + '">' +
      '<span class="vframe">' +
        '<img src="' + esc(v.poster) + '" alt="" loading="lazy" decoding="async">' +
        '<span class="vplay">' + TP.ui.icon('play') + '</span>' +
        (v.len ? '<span class="vlen">' + esc(v.len) + '</span>' : '') +
      '</span>' +
      '<span class="vcap"><b>' + esc(v.t) + '</b><span>' + esc(v.s) + '</span></span>' +
    '</button>';
  }

  function animations() {
    return TP.data.drills().map(function (d) {
      return '<button class="itemrow" data-act="playDrill" data-slug="' + esc(d.slug) + '">' +
        '<span class="kind drill">' + TP.ui.icon('play') + '</span>' +
        '<span class="body"><span class="t">' + esc(d.title) + '</span>' +
          '<span class="m"><span>' + esc(d.theme) + '</span><span>·</span><span>' + esc(d.age) + '</span></span></span>' +
      '</button>';
    }).join('');
  }

  function render() {
    return '<div class="page-head"><div><p class="eyebrow">Help</p><h1>How-to guides</h1>' +
        '<p>Watch it once, then coach. Every walkthrough from the club app, in one place.</p></div></div>' +

      '<section class="section"><div class="section-head"><h2>Start here</h2><span class="spacer"></span><span class="pill amber">2 min</span></div>' +
        card(COACH[0], true) +
      '</section>' +

      '<section class="section"><div class="section-head"><h2>Coach walkthroughs</h2></div>' +
        '<div class="vgrid">' + COACH.slice(1).map(function (v) { return card(v); }).join('') + '</div>' +
      '</section>' +

      '<section class="section"><div class="section-head"><h2>For families</h2><span class="spacer"></span><button class="linkbtn" data-act="go" data-to="#/comms">Share</button></div>' +
        '<div class="vgrid">' + FAMILY.map(function (v) { return card(v); }).join('') + '</div>' +
      '</section>' +

      '<section class="section"><div class="section-head"><h2>Drill animations</h2><span class="spacer"></span><span class="pill">' + TP.data.drills().length + '</span></div>' +
        '<div class="card tight">' + animations() + '</div>' +
        '<button class="btn block ghost" style="margin-top:10px" data-act="go" data-to="#/roles">' + TP.ui.icon('users') + 'Role guides by position</button>' +
      '</section>' +

      '<section class="section"><div class="section-head"><h2>Read and share</h2></div>' +
        '<div class="card tight"><div class="list">' + READING.map(function (r) {
          return '<a class="row" href="' + esc(r.u) + '" target="_blank" rel="noopener" style="text-decoration:none">' +
            '<span class="avatar small">' + TP.ui.icon('file') + '</span>' +
            '<span class="grow"><span class="t">' + esc(r.t) + '</span><span class="s">' + esc(r.s) + '</span></span>' +
            '<span class="end">' + TP.ui.icon('external', 'style="width:18px;height:18px;fill:none;stroke:var(--muted);stroke-width:2"') + '</span>' +
          '</a>';
        }).join('') + '</div></div>' +
      '</section>' +

      '<section class="section"><div class="section-head"><h2>Club pages</h2></div>' +
        '<div class="card tight"><div class="list">' + PAGES.map(function (p) {
          return '<a class="row" href="' + esc(p.u) + '" target="_blank" rel="noopener" style="text-decoration:none">' +
            '<span class="avatar small">' + TP.ui.icon('link') + '</span>' +
            '<span class="grow"><span class="t">' + esc(p.t) + '</span><span class="s">' + esc(p.s) + '</span></span>' +
            '<span class="end">' + TP.ui.icon('external', 'style="width:18px;height:18px;fill:none;stroke:var(--muted);stroke-width:2"') + '</span>' +
          '</a>';
        }).join('') + '</div></div>' +
      '</section>' +

      '<p class="footnote">Videos play in the app and only download when you tap one.</p>';
  }

  function video(id) {
    var v = COACH.concat(FAMILY).filter(function (x) { return x.id === id; })[0];
    if (!v) return;
    var html = '<div class="video"><video controls playsinline preload="metadata" poster="' + esc(v.poster) + '">' +
        '<source src="' + esc(v.src) + '" type="video/mp4">' +
        (v.vtt ? '<track kind="captions" src="' + esc(v.vtt) + '" srclang="en" label="English" default>' : '') +
      '</video></div>' +
      '<p class="small muted" style="margin-top:12px">Captions are on. Share it with the families from Comms.</p>';
    TP.ui.sheet(v.t, html);
  }

  TP.views = TP.views || {};
  TP.views.guides = { render: render, video: video };
})();
