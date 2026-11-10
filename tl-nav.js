/* Release 112 page index. Find and the home shortcuts use this list.
   Taps are from Home after sign in. A main tab is one tap. Anything else is
   the tab, then one labelled button, or Find then the result. */
(function (w) {
  var F = [
    { id: 'coach.today', roles: ['coach'], label: 'Today', taps: 1, route: 'today', group: 'Home' },
    { id: 'coach.match', roles: ['coach'], label: 'Matches', taps: 1, route: 'match', group: 'Match' },
    { id: 'coach.train', roles: ['coach'], label: 'Training', taps: 1, route: 'run', group: 'Train' },
    { id: 'coach.library', roles: ['coach'], label: 'Library', taps: 1, route: 'rl', group: 'Library' },
    { id: 'coach.team', roles: ['coach'], label: 'Team', taps: 1, route: 'squad', group: 'Team' },
    { id: 'coach.kit', roles: ['coach'], label: 'Set kit', taps: 2, route: 'match', group: 'Match' },
    { id: 'coach.alert', roles: ['coach'], label: 'Match alert', taps: 2, route: 'match', group: 'Match' },
    { id: 'coach.attendance', roles: ['coach'], label: 'Attendance', taps: 2, route: 'att', group: 'Train' },
    { id: 'coach.roles', roles: ['coach'], label: 'Role cards', taps: 2, route: 'roles', group: 'Library' },
    { id: 'coach.vote', roles: ['coach'], label: 'Man of the match', taps: 2, route: 'more', group: 'More' },
    { id: 'coach.questions', roles: ['coach'], label: 'Questions and player voice', taps: 1, route: 'today', group: 'Home' },
    { id: 'coach.comms', roles: ['coach'], label: 'Comms', taps: 2, route: 'hub', group: 'Comms' },
    { id: 'coach.welfare', roles: ['coach'], label: 'Welfare', taps: 2, route: 'admin', group: 'Team' },
    { id: 'coach.head', roles: ['coach'], label: 'Head injury', taps: 2, route: 'conc', group: 'Team' },
    { id: 'coach.emergency', roles: ['coach'], label: 'Emergency contacts', taps: 2, route: 'em', group: 'Team' },
    { id: 'coach.sheet', roles: ['coach'], label: 'Team sheet', taps: 2, route: 'fa', group: 'Team' },
    { id: 'coach.goals', roles: ['coach'], label: 'Player goals', taps: 2, route: 'goals', group: 'Team' },
    { id: 'coach.privacy', roles: ['coach'], label: 'Privacy', taps: 2, route: 'priv', group: 'Team' },
    { id: 'coach.builder', roles: ['coach'], label: 'Team builder', taps: 2, route: 'lab', group: 'Team' },
    { id: 'coach.stats', roles: ['coach'], label: 'Stats', taps: 2, route: 'stats', group: 'Team' },
    { id: 'coach.contacts', roles: ['coach'], label: 'Club contacts', taps: 2, route: 'ct', group: 'Team' },
    { id: 'coach.plan', roles: ['coach'], label: 'This week plan', taps: 2, route: 'plan', group: 'Train' },
    { id: 'coach.build', roles: ['coach'], label: 'Session builder', taps: 2, route: 'sb', group: 'Train' },
    { id: 'coach.tonight', roles: ['coach'], label: 'Tonight', taps: 2, route: 'run', group: 'Train' },
    { id: 'coach.sessions', roles: ['coach'], label: 'Saved sessions', taps: 2, route: 'sess', group: 'Train' },
    { id: 'coach.reflect', roles: ['coach'], label: 'Reflect', taps: 2, route: 'rev', group: 'Train' },
    { id: 'coach.fitness', roles: ['coach'], label: 'Fitness', taps: 2, route: 'fit', group: 'Train' },
    { id: 'coach.board', roles: ['coach'], label: 'Tactics board', taps: 2, route: 'board', group: 'Train' },
    { id: 'coach.anim', roles: ['coach'], label: 'Animations', taps: 2, route: 'anim', group: 'Library' },
    { id: 'coach.shape', roles: ['coach'], label: '352 animation', taps: 2, route: 'anim', group: 'Library' },
    { id: 'coach.resources', roles: ['coach'], label: 'Resources', taps: 2, route: 'res', group: 'Library' },
    { id: 'coach.positions', roles: ['coach'], label: 'Positions', taps: 2, route: 'pos', group: 'Library' },
    { id: 'coach.clips', roles: ['coach'], label: 'Clips', taps: 2, route: 'lib', group: 'Library' },
    { id: 'coach.listen', roles: ['coach'], label: 'Listen', taps: 2, route: 'pod', group: 'Library' },
    { id: 'coach.ask', roles: ['coach'], label: 'Ask', taps: 2, route: 'ask', group: 'Comms' },
    { id: 'coach.refs', roles: ['coach'], label: 'Referees', taps: 2, route: 'refs', group: 'Comms' },
    { id: 'coach.opp', roles: ['coach'], label: 'Opposition', taps: 2, route: 'opp', group: 'Comms' },
    { id: 'coach.league', roles: ['coach'], label: 'League', taps: 2, route: 'lg', group: 'Comms' },
    { id: 'coach.shop', roles: ['coach'], label: 'Club shop', taps: 2, route: 'shop', group: 'More' },
    { id: 'coach.guides', roles: ['coach'], label: 'Guides', taps: 2, route: 'guides', group: 'More' },
    { id: 'coach.codes', roles: ['coach'], label: 'Access codes', taps: 2, route: 'more', group: 'More' },
    { id: 'fam.home', roles: ['parent', 'player'], label: 'Home', taps: 1, route: 'home', group: 'Home' },
    { id: 'fam.games', roles: ['parent', 'player'], label: 'Games', taps: 1, route: 'games', group: 'Games' },
    { id: 'fam.events', roles: ['parent', 'player'], label: 'Events', taps: 1, route: 'events', group: 'Events' },
    { id: 'fam.media', roles: ['parent', 'player'], label: 'Media', taps: 1, route: 'media', group: 'Media' },
    { id: 'fam.me', roles: ['parent', 'player'], label: 'Me', taps: 1, route: 'me', group: 'Me' },
    { id: 'fam.kit', roles: ['parent', 'player'], label: 'Kit', taps: 2, route: 'games', group: 'Games' },
    { id: 'fam.lifts', roles: ['parent', 'player'], label: 'Lifts', taps: 2, route: 'games', group: 'Games' },
    { id: 'fam.attendance', roles: ['parent', 'player'], label: 'Attendance', taps: 1, route: 'home', group: 'Home' },
    { id: 'fam.role', roles: ['parent', 'player'], label: 'Role card', taps: 2, route: 'me', group: 'Me' },
    { id: 'fam.vote', roles: ['parent', 'player'], label: 'Vote', taps: 2, route: 'me', group: 'Me' },
    { id: 'fam.alarm', roles: ['parent'], label: 'Wake up time', taps: 2, route: 'games', group: 'Games' },
    { id: 'fam.clips', roles: ['parent', 'player'], label: 'Clips', taps: 2, route: 'lib', group: 'Media' },
    { id: 'fam.shape', roles: ['parent', 'player'], label: '352 animation', taps: 2, route: 'media', group: 'Media' },
    { id: 'fam.stretch', roles: ['parent', 'player'], label: 'Stretching', taps: 2, route: 'me', group: 'Me' },
    { id: 'fam.shop', roles: ['parent', 'player'], label: 'Club shop', taps: 2, route: 'me', group: 'Me' },
    { id: 'fam.contacts', roles: ['parent', 'player'], label: 'Contacts', taps: 2, route: 'contacts', group: 'Me' },
    { id: 'fam.faq', roles: ['parent', 'player'], label: 'FAQ', taps: 2, route: 'faq', group: 'Me' },
    { id: 'fam.data', roles: ['parent'], label: 'My data', taps: 2, route: 'data', group: 'Me' },
    { id: 'fam.child', roles: ['parent'], label: 'Player card', taps: 2, route: 'child', group: 'Me' },
    { id: 'fam.ask', roles: ['parent', 'player'], label: 'Ask the coaches', taps: 2, route: 'pq', group: 'Me' },
    { id: 'fam.voice', roles: ['player'], label: 'Your voice', taps: 2, route: 'voice', group: 'Me' },
    { id: 'fam.goals', roles: ['player'], label: 'My goals', taps: 2, route: 'own', group: 'Me' },
    { id: 'fam.listen', roles: ['parent', 'player'], label: 'Podcasts', taps: 2, route: 'media', group: 'Media' }
  ];
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function forRole(role) {
    var r = role === 'family' ? 'parent' : (role || 'parent');
    return F.filter(function (x) { return x.roles.indexOf(r) >= 0; });
  }
  function search(q, role) {
    var n = norm(q);
    if (!n) return [];
    return forRole(role).filter(function (x) {
      return norm(x.label).indexOf(n) >= 0 || norm(x.group).indexOf(n) >= 0 || n.indexOf(norm(x.label)) >= 0;
    }).slice(0, 6);
  }
  function bar(role) {
    return '<div class="tl-findbar card"><label for="tl-find">Find</label><div class="row"><input id="tl-find" placeholder="Kit, lifts, welfare, 352" autocomplete="off"><button type="button" class="btn pri" id="tl-find-go" onclick="if(window.tlPageFind)tlPageFind()">Find</button></div><div id="tl-find-out"></div></div>';
  }
  function resourceCard(it) {
    it = it || {};
    var title = it.title || 'Untitled';
    var src = it.source || it.by || '';
    var dur = it.duration ? String(it.duration) : '';
    var thumb = it.thumb ? '<img alt="" src="' + it.thumb + '">' : '<span>No preview</span>';
    return '<article class="tl-rcard"><div class="tl-rthumb">' + thumb + '</div><h3>' + title + '</h3>' +
      (src || dur ? '<p class="small">' + src + (dur ? ' · ' + dur : '') + '</p>' : '') +
      '<div class="tl-rcard-actions"><button type="button" class="btn pri" data-tl-view="1">View</button><button type="button" class="btn" data-tlshare="1">Share</button></div></article>';
  }
  function reach(role, id) {
    var hit = forRole(role).filter(function (x) { return x.id === id; })[0];
    return hit ? { taps: hit.taps, route: hit.route, label: hit.label } : null;
  }
  if (!w.document.getElementById('tl-nav-css')) {
    var st = w.document.createElement('style');
    st.id = 'tl-nav-css';
    st.textContent = '.tl-findbar input,.tl-findbar button,.tl-rcard-actions .btn,nav.tabs button{min-height:48px}' +
      '.tl-rcard{background:var(--card,#0E1D45);border:1px solid var(--line,#27407F);border-radius:12px;padding:10px;margin:0 0 12px;display:flex;flex-direction:column;gap:8px}' +
      '.tl-rthumb{background:#0b1733;border-radius:8px;min-height:88px;display:flex;align-items:center;justify-content:center;overflow:hidden}' +
      '.tl-rthumb img{width:100%;aspect-ratio:16/9;object-fit:cover}' +
      '.tl-rcard h3{margin:0;font-size:16px}' +
      '.tl-rcard-actions{display:flex;gap:8px}.tl-rcard-actions .btn{flex:1}' +
      '@media(min-width:900px){nav.tabs.tl-nav{left:0!important;right:auto!important;top:0;bottom:0;width:108px;max-width:108px;transform:none!important;flex-direction:column;border-radius:0;justify-content:flex-start;padding-top:72px}.wrap{padding-left:124px}}';
    (w.document.head || w.document.documentElement).appendChild(st);
  }
  w.TLNav = { features: F, forRole: forRole, search: search, bar: bar, resourceCard: resourceCard, reach: reach, norm: norm };
})(window);
