/* Touchline Pro — router, navigation and every action in one delegated handler. */
(function () {
  'use strict';
  var TP = window.TP;
  var esc = TP.esc;

  var TABS = [
    { id: 'today', t: 'Today', ic: 'today' },
    { id: 'match', t: 'Match', ic: 'ball' },
    { id: 'sessions', t: 'Sessions', ic: 'whistle' },
    { id: 'library', t: 'Library', ic: 'library' },
    { id: 'squad', t: 'Squad', ic: 'squad' }
  ];

  function viewFor(parts) {
    var root = parts[0];
    if (root === 'session') return 'sessions';
    if (root === 'player') return 'squad';
    if (TP.views[root] && TP.views[root].render) return root;
    return 'today';
  }

  function activeTab(parts) {
    return viewFor(parts);
  }

  function buildNav() {
    var tabs = TABS.map(function (t) {
      return '<a class="tab" href="#/' + t.id + '" data-nav="' + t.id + '">' + TP.ui.icon(t.ic) + '<span>' + t.t + '</span></a>';
    }).join('');
    document.getElementById('tabbar').innerHTML = tabs;

    var club = TP.data.club();
    var rail = '<div class="rail-club"><img src="../badge.png" alt="">' +
      '<div><b>' + esc(club.short || 'Latics Blues') + '</b><i>' + esc(club.league || '') + '</i></div></div>' +
      TABS.map(function (t) {
        return '<a class="railnav" href="#/' + t.id + '" data-nav="' + t.id + '">' + TP.ui.icon(t.ic) + t.t + '</a>';
      }).join('') +
      '<div class="rail-foot">Demo club data on this phone.<br>Match clock, availability and work set stay local.</div>';
    document.getElementById('rail').innerHTML = rail;
    document.getElementById('clubName').textContent = club.short || 'Latics Blues U15';
  }

  function paintNav(parts) {
    var active = activeTab(parts);
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  var currentView = null;
  var scrolls = {};

  var app = {
    render: function (opts) {
      opts = opts || {};
      var parts = TP.parseRoute();
      var name = viewFor(parts);
      if (currentView && TP.views[currentView] && TP.views[currentView].unmount) {
        try { TP.views[currentView].unmount(); } catch (e) {}
      }
      var view = TP.views[name];
      var html;
      try {
        html = view.render();
      } catch (e) {
        html = '<div class="card"><h2>Something went wrong</h2><p class="small muted">' + esc(e.message) + '</p>' +
          '<button class="btn pri" style="margin-top:12px" data-act="go" data-to="#/today">Back to Today</button></div>';
      }
      document.getElementById('view').innerHTML = html;
      currentView = name;
      paintNav(parts);
      if (view.mount) {
        try { view.mount(); } catch (e) {}
      }
      if (opts.keepFocus) {
        var el = document.querySelector(opts.keepFocus);
        if (el) {
          el.focus({ preventScroll: true });
          if (el.setSelectionRange) {
            var n = el.value.length;
            el.setSelectionRange(n, n);
          }
        }
      } else if (opts.keepScroll && scrolls[TP.route.path] != null) {
        window.scrollTo(0, scrolls[TP.route.path]);
      } else {
        window.scrollTo(0, 0);
      }
      document.title = (parts[0] === 'today' ? 'Today' : name.charAt(0).toUpperCase() + name.slice(1)) + ' · Touchline Pro';
    },
    rememberScroll: function () {
      scrolls[TP.route.path] = window.scrollY;
    },
    demo: function () {
      var club = TP.data.club();
      TP.ui.sheet('About this app',
        '<p class="small" style="margin-top:8px;line-height:1.6">Touchline Pro is a rebuild of the Touchline coach app for ' + esc(club.name || 'the club') + '. ' +
        'It keeps the same jobs — plan the week, run match day, set work — in a shell that opens instantly and never clips the scoreboard.</p>' +
        '<div class="list" style="margin-top:14px">' +
          '<div class="row" style="min-height:48px"><span class="avatar small amber">' + TP.ui.icon('check') + '</span><span class="grow"><span class="t" style="font-size:13.5px">Fast by design</span><span class="s">One small shell, 11 animated drills on demand, the 449-item index fetched in the background.</span></span></div>' +
          '<div class="row" style="min-height:48px"><span class="avatar small blue">' + TP.ui.icon('clock') + '</span><span class="grow"><span class="t" style="font-size:13.5px">Match day first</span><span class="s">Score, clock, quick sub and minutes that survive a refresh.</span></span></div>' +
          '<div class="row" style="min-height:48px"><span class="avatar small">' + TP.ui.icon('users') + '</span><span class="grow"><span class="t" style="font-size:13.5px">Players engaged</span><span class="s">Assign a drill or clip to a player, tick it off, message it over.</span></span></div>' +
        '</div>' +
        '<div class="note" style="margin-top:16px"><b>Sample squad.</b> The club, badge, drills, position clips and library are real. Players, fixtures and results are sample data kept on this phone — connect the club’s coach code to use the live squad.</div>' +
        '<button class="btn block ghost" style="margin-top:16px" data-act="resetDemo">Reset demo data</button>');
    }
  };
  TP.app = app;

  /* ---------- actions ---------- */
  var actions = {
    go: function (el) {
      var to = el.getAttribute('data-to');
      if (to) TP.go(to);
    },
    comms: function () { TP.views.comms.open(); },
    demo: function () { app.demo(); },
    closeSheet: function () { TP.ui.closeSheet(); },
    closePlayer: function () { TP.views.library.closePlayer(); },
    resetDemo: function () {
      TP.store.reset();
      TP.ui.closeSheet();
      location.reload();
    },

    /* library */
    libFilter: function (el) { TP.views.library.setFilter(el.getAttribute('data-v')); },
    libMore: function () { TP.views.library.more(); },
    clearSearch: function () { TP.views.library.setQuery(''); },
    openItem: function (el) { TP.views.library.openItem(el.getAttribute('data-id')); },
    openDrill: function (el) {
      var d = TP.data.drill(el.getAttribute('data-id'));
      if (d) TP.views.library.drillSheet(d);
    },
    playDrill: function (el) { TP.views.library.playDrill(el.getAttribute('data-slug')); },
    assignDrill: function (el) { TP.views.library.assignDrill(el.getAttribute('data-slug')); },
    assignItem: function (el) { TP.views.library.assignItem(el.getAttribute('data-id')); },
    toggleAssign: function (el) { TP.views.library.toggleAssign(el.getAttribute('data-id')); },
    addDrillToSession: function (el) { TP.views.library.addDrillToSession(el.getAttribute('data-slug')); },

    /* sessions */
    openSession: function (el) { TP.go('#/session/' + el.getAttribute('data-id')); },
    runSession: function (el) { TP.views.sessions.startRun(el.getAttribute('data-id')); },
    shareSession: function (el) {
      var id = el.getAttribute('data-id');
      TP.views.comms.open({ body: TP.views.sessions.shareText(id), name: 'Share session plan' });
    },
    toggleEdit: function (el) { TP.views.sessions.toggleEdit(el.getAttribute('data-id')); },
    blockPlus: function (el) { TP.views.sessions.adjust(el.getAttribute('data-id'), el.getAttribute('data-b'), 5); },
    blockMinus: function (el) { TP.views.sessions.adjust(el.getAttribute('data-id'), el.getAttribute('data-b'), -5); },
    addBlock: function (el) { TP.views.sessions.addBlock(el.getAttribute('data-id')); },
    addDrill: function (el) { TP.views.sessions.addDrill(el.getAttribute('data-id'), el.getAttribute('data-slug')); },
    addSimple: function (el) { TP.views.sessions.addSimple(el.getAttribute('data-id')); },
    newSession: function () { TP.views.sessions.newSession(); },
    blockInfo: function () { TP.ui.toast('Simple block — adjust the time with Adjust times'); },
    runToggle: function () { TP.views.sessions.runToggle(); },
    runPlus: function () { TP.views.sessions.runPlus(); },
    runNext: function () { TP.views.sessions.runNext(); },
    runPrev: function () { TP.views.sessions.runPrev(); },
    runEnd: function () { TP.views.sessions.endRun(); },

    /* match */
    slotPick: function (el) { TP.views.match.slotPicker(el.getAttribute('data-k')); },
    setSlot: function (el) {
      TP.lineup.set(el.getAttribute('data-k'), el.getAttribute('data-id') || null);
      TP.ui.closeSheet();
      app.render();
    },
    suggestXI: function () {
      var n = TP.lineup.suggest();
      app.render();
      TP.ui.toast(n + ' players picked');
    },
    clearXI: function () {
      TP.lineup.clear();
      app.render();
    },
    kickoff: function () {
      var f = TP.data.nextFixture();
      if (!f) return;
      if (TP.lineup.filled() < 11) { TP.ui.toast('Pick all 11 first'); return; }
      TP.match.make(f);
      TP.views.match.resetSelection();
      app.render();
      TP.ui.toast('Kick off');
    },
    toggleAvail: function (el) {
      var id = el.getAttribute('data-id');
      var p = TP.data.player(id);
      if (!p) return;
      var now = TP.data.available(p);
      TP.store.state.avail[id] = !now;
      if (now) {
        var slot = TP.lineup.playerIn(id);
        if (slot) TP.lineup.set(slot, null);
      }
      TP.store.save();
      app.render();
      TP.ui.toast(p.name + (now ? ' is unavailable' : ' is available'));
    },
    toggleClock: function () {
      var m = TP.match.current();
      if (!m) return;
      if (m.clock.running) TP.match.pause(m); else TP.match.resume(m);
      app.render();
    },
    goal: function () { TP.views.match.scorerSheet(); },
    pickScorer: function (el) {
      var pid = el.getAttribute('data-id');
      TP.match.addEvent('goal', { pid: pid || null });
      TP.ui.closeSheet();
      app.render();
      TP.ui.toast(pid ? 'Goal recorded' : 'Goal recorded');
    },
    ga: function () {
      TP.match.addEvent('ga');
      app.render();
      TP.ui.toast('Goal against recorded');
    },
    halfTime: function () {
      TP.match.halfTime();
      app.render();
      TP.ui.toast('Half time');
    },
    secondHalf: function () {
      TP.match.secondHalf();
      app.render();
    },
    fullTime: function () {
      TP.match.fullTime();
      app.render();
      TP.ui.toast('Full time');
    },
    undo: function () { TP.match.undo(); app.render(); },
    pickOff: function (el) {
      TP.views.match.selection.off = el.getAttribute('data-id');
      TP.views.match.selection.on = null;
      app.render();
      app.rememberScroll();
      window.scrollTo(0, scrolls[TP.route.path] || 0);
    },
    pickOn: function (el) {
      var sel = TP.views.match.selection;
      if (!sel.off) { TP.ui.toast('Tap the player coming off first'); return; }
      var on = el.getAttribute('data-id');
      var ok = TP.match.sub(sel.off, on);
      TP.views.match.resetSelection();
      app.render();
      if (ok) TP.ui.toast('Sub made');
    },
    pickMotm: function () { TP.views.match.motmSheet(); },
    setMotm: function (el) {
      var m = TP.match.current();
      if (!m) return;
      m.motm = el.getAttribute('data-id');
      TP.store.save();
      TP.ui.closeSheet();
      app.render();
    },
    shareReport: function () {
      TP.views.comms.open({ body: TP.views.comms.report(), name: 'Match report' });
    },
    newMatch: function () {
      TP.match.reset();
      app.render();
      TP.go('#/match');
    },

    /* squad */
    openPlayer: function (el) { TP.go('#/player/' + el.getAttribute('data-id')); },
    msgPlayer: function (el) { TP.views.squad.msgPlayer(el.getAttribute('data-id')); },
    toggleDone: function (el) { TP.views.squad.toggleDone(el.getAttribute('data-id')); },

    /* comms */
    pickTemplate: function (el) { TP.views.comms.pickTemplate(el.getAttribute('data-id')); },
    copyMsg: function () { TP.views.comms.copy(); },
    shareMsg: function () { TP.views.comms.share(); },
    waMsg: function () { TP.views.comms.whatsapp(); },
    reuseMsg: function (el) { TP.views.comms.reuse(el.getAttribute('data-id')); }
  };

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act');
    var fn = actions[act];
    if (!fn) return;
    if (el.tagName === 'A' && !el.getAttribute('href')) ev.preventDefault();
    if (el.tagName === 'A' && el.getAttribute('href') === '#') ev.preventDefault();
    if (act !== 'go' && el.tagName !== 'A') ev.preventDefault();
    try { fn(el, ev); } catch (e) {
      TP.ui.toast(e.message || 'That did not work');
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (document.getElementById('run')) { TP.views.sessions.endRun(); return; }
    if (document.getElementById('player')) { TP.views.library.closePlayer(); return; }
    if (TP.ui.sheetOpen()) TP.ui.closeSheet();
  });

  document.getElementById('scrim').addEventListener('click', function () { TP.ui.closeSheet(); });

  window.addEventListener('hashchange', function () {
    app.rememberScroll();
    app.render();
  });

  /* ---------- boot ---------- */
  function skeleton() {
    return '<div class="page-head"><div><p class="eyebrow">Touchline Pro</p><h1>Loading the dressing room</h1><p>One moment.</p></div></div>' +
      '<div class="card" style="height:190px;opacity:.45"></div>' +
      '<div class="card" style="height:120px;opacity:.3;margin-top:12px"></div>';
  }

  document.getElementById('view').innerHTML = skeleton();

  TP.data.boot().then(function () {
    buildNav();
    if (!Object.keys(TP.store.state.lineup || {}).length) TP.lineup.suggest();
    app.render();
    TP.onIdle(function () {
      TP.lib.load().catch(function () {});
    });
  }).catch(function () {
    document.getElementById('view').innerHTML =
      '<div class="card" style="margin-top:24px"><h2>The club data did not load</h2>' +
      '<p class="small muted">Check data/coach.json is being served, then reload.</p>' +
      '<button class="btn pri" style="margin-top:14px" onclick="location.reload()">Reload</button></div>';
  });
})();
