/* Touchline Pro — the library: drills, position clips, club guides and the coaches' index.
   The shell loads instantly; the 449-row index is fetched once, in the background, and cached. */
(function () {
  'use strict';
  var TP = window.TP;
  var esc = TP.esc;
  var filter = 'all';
  var query = '';
  var limit = 40;
  var built = null;

  function build() {
    if (built) return built;
    var out = [];
    TP.data.drills().forEach(function (d) {
      out.push({
        id: 'd:' + d.slug, kind: 'drill', ty: 'animation', t: d.title,
        s: d.theme, d: d.format, tags: [d.theme], url: d.page, drill: d
      });
    });
    TP.data.positions().forEach(function (p) {
      p.clips.forEach(function (c, i) {
        out.push({
          id: 'c:' + p.k + ':' + i, kind: 'clip', ty: c.ty === 'youtube' ? 'video' : 'web', t: c.t,
          s: p.name + ' · ' + (c.s || ''), d: c.w || '', tags: [p.k].concat(c.tags || []), url: c.u
        });
      });
    });
    TP.data.resources().forEach(function (c, i) {
      out.push({
        id: 'r:' + i, kind: 'club', ty: c.ty === 'youtube' ? 'video' : 'web', t: c.t,
        s: 'Club library · ' + (c.s || ''), d: c.w || '', tags: c.tags || [], url: c.u
      });
    });
    TP.data.guides().forEach(function (g) {
      out.push({ id: 'g:' + g.id, kind: 'guide', ty: g.ty, t: g.t, s: 'Club guide', d: g.d, tags: [], url: g.u });
    });
    (TP.lib.items() || []).forEach(function (c) {
      out.push({
        id: 'l:' + c.id, kind: c.s === 'x-sessions' ? 'x' : 'cv', ty: c.ty, t: c.t,
        s: c.s === 'x-sessions' ? 'X thread' : 'Coaches’ Voice', d: (c.th || []).join(', '),
        tags: (c.th || []).concat(c.m || []), url: c.u, age: (c.a || []).join(' ')
      });
    });
    built = out;
    return built;
  }

  var FILTERS = [
    { id: 'all', t: 'Everything', test: function () { return true; } },
    { id: 'drill', t: 'Drills', test: function (x) { return x.kind === 'drill'; } },
    { id: 'clip', t: 'Position', test: function (x) { return x.kind === 'clip'; } },
    { id: 'video', t: 'Watch', test: function (x) { return x.ty === 'video'; } },
    { id: 'club', t: 'Club', test: function (x) { return x.kind === 'club' || x.kind === 'guide'; } },
    { id: 'cv', t: 'Coaches’ Voice', test: function (x) { return x.kind === 'cv'; } },
    { id: 'x', t: 'X posts', test: function (x) { return x.kind === 'x'; } }
  ];

  function matches(x) {
    var f = FILTERS.filter(function (v) { return v.id === filter; })[0] || FILTERS[0];
    if (!f.test(x)) return false;
    if (!query) return true;
    var hay = (x.t + ' ' + x.s + ' ' + x.d + ' ' + (x.tags || []).join(' ')).toLowerCase();
    return query.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
  }

  function kindIcon(x) {
    var cls = x.kind === 'drill' ? 'drill' : (x.ty === 'video' || x.ty === 'animation') ? 'play' : '';
    return '<span class="kind ' + cls + '">' + TP.ui.icon(x.ty === 'video' && x.kind !== 'drill' ? 'video' : x.kind === 'drill' ? 'play' : x.ty === 'pdf' ? 'file' : 'link') + '</span>';
  }

  function rows() {
    var all = build().filter(matches);
    var shown = all.slice(0, limit);
    var html = shown.map(function (x) {
      return '<button class="itemrow" data-act="openItem" data-id="' + esc(x.id) + '">' + kindIcon(x) +
        '<span class="body"><span class="t">' + esc(x.t) + '</span>' +
        '<span class="m">' + (x.s ? '<span>' + esc(x.s) + '</span>' : '') +
          (x.d ? '<span>·</span><span>' + esc(x.d) + '</span>' : '') + '</span></span>' +
        '</button>';
    }).join('');
    return { html: html, total: all.length, shown: shown.length };
  }

  function list() {
    if (!TP.lib.items()) {
      TP.lib.load().then(function () {
        built = null;
        TP.app.render();
      }).catch(function () {
        TP.ui.toast('The index could not be loaded');
      });
    }
    var r = rows();
    var counts = {};
    var all = build();
    FILTERS.forEach(function (f) {
      counts[f.id] = all.filter(function (x) { return f.test(x) && (!query || (x.t + ' ' + x.s + ' ' + (x.tags || []).join(' ')).toLowerCase().indexOf(query.toLowerCase()) > -1); }).length;
    });
    return '<div class="page-head"><div><p class="eyebrow">Resources</p><h1>Library</h1>' +
        '<p>' + (TP.lib.items() ? all.length + ' items · drills load in the app' : 'Loading the index…') + '</p></div></div>' +
      '<div class="search">' + TP.ui.icon('search') +
        '<input id="libSearch" type="search" inputmode="search" placeholder="Search drills, positions, themes" value="' + esc(query) + '" aria-label="Search the library">' +
        (query ? '<button class="clear" data-act="clearSearch">Clear</button>' : '') +
      '</div>' +
      '<div class="chips" style="margin:12px 0 4px">' + FILTERS.map(function (f) {
        return '<button class="chip" aria-pressed="' + (filter === f.id ? 'true' : 'false') + '" data-act="libFilter" data-v="' + f.id + '">' +
          esc(f.t) + ' <span class="n">' + (counts[f.id] || 0) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="card tight" style="margin-top:10px">' +
        (r.html || TP.ui.empty('Nothing matched', 'Try a different word or filter.')) +
      '</div>' +
      (r.total > r.shown ? '<button class="btn block ghost" style="margin-top:12px" data-act="libMore">Show ' + Math.min(40, r.total - r.shown) + ' more</button>' : '') +
      '<p class="footnote">Drills play inside the app. Coaches’ Voice and X open the original source.</p>';
  }

  function item(id) {
    var x = build().filter(function (v) { return v.id === id; })[0];
    if (!x) return;
    if (x.kind === 'drill') return drillSheet(x.drill);
    var assigned = TP.store.state.assignments.filter(function (a) { return a.refId === x.id; }).length;
    var html = '<div class="row" style="border:0;padding:0;min-height:0;margin:6px 0 14px">' +
        '<span class="avatar">' + TP.ui.icon(x.ty === 'video' ? 'video' : x.ty === 'pdf' ? 'file' : 'link') + '</span>' +
        '<span class="grow"><span class="t">' + esc(x.s || '') + '</span><span class="s">' + esc(x.d || '') + '</span></span></div>' +
      ((x.tags || []).length ? '<div class="chips" style="margin-bottom:14px">' + x.tags.slice(0, 6).map(function (t) {
        return '<span class="tag">' + esc(t) + '</span>';
      }).join('') + '</div>' : '') +
      '<div class="btnrow">' +
        '<a class="btn pri" href="' + esc(x.url) + '" target="_blank" rel="noopener">' + TP.ui.icon('external') + (x.ty === 'pdf' ? 'Open PDF' : 'Open source') + '</a>' +
        '<button class="btn ghost" data-act="assignItem" data-id="' + esc(x.id) + '">' + TP.ui.icon('users') + 'Assign</button>' +
      '</div>' +
      (assigned ? '<p class="small muted" style="margin-top:12px">Set for ' + assigned + ' player' + (assigned > 1 ? 's' : '') + '.</p>' : '') +
      '<p class="small muted" style="margin-top:12px">' + (x.kind === 'cv' ? 'Paid Coaches’ Voice resource. Opens the original, never a copy.' : x.kind === 'x' ? 'Opens the original post on X.' : 'Opens in a new tab.') + '</p>';
    TP.ui.sheet(x.s || 'Resource', html);
  }

  function drillSheet(d) {
    var points = (d.points || []).map(function (p) {
      return '<div class="row" style="min-height:44px"><span class="avatar small amber">' + TP.ui.icon('target') + '</span>' +
        '<span class="grow"><span class="t" style="font-weight:600;font-size:13.5px">' + esc(p) + '</span></span></div>';
    }).join('');
    var html = '<div class="row" style="border:0;padding:0;min-height:0;margin:4px 0 14px">' +
        '<span class="avatar amber">' + TP.ui.icon('play') + '</span>' +
        '<span class="grow"><span class="t">' + esc(d.theme) + ' · ' + esc(d.age) + '</span>' +
        '<span class="s">' + esc(d.players) + ' players · ' + Math.round(d.seconds / 60 * 10) / 10 + ' min animation</span></span></div>' +
      '<div class="stats" style="margin-bottom:14px">' +
        '<div class="stat"><span class="v" style="font-size:15px">' + esc(d.format.split(',')[0]) + '</span><span class="k">Format</span></div>' +
        '<div class="stat"><span class="v" style="font-size:15px">' + esc(d.area.split(',')[0]) + '</span><span class="k">Area</span></div>' +
        '<div class="stat"><span class="v" style="font-size:15px">' + esc(d.age) + '</span><span class="k">Age</span></div>' +
      '</div>' +
      '<div class="btnrow" style="margin-bottom:16px">' +
        '<button class="btn pri" data-act="playDrill" data-slug="' + esc(d.slug) + '">' + TP.ui.icon('play') + 'Play the animation</button>' +
        '<button class="btn ghost" data-act="assignDrill" data-slug="' + esc(d.slug) + '">' + TP.ui.icon('users') + 'Assign</button>' +
      '</div>' +
      '<h3 style="margin:16px 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">Set up</h3>' +
      '<ul class="small" style="margin:0;padding-left:18px;color:var(--ink-2);line-height:1.6">' + (d.setup || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' +
      '<h3 style="margin:16px 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">Coaching points</h3>' +
      '<div class="list">' + points + '</div>' +
      '<h3 style="margin:16px 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">Make it harder</h3>' +
      '<ul class="small" style="margin:0;padding-left:18px;color:var(--ink-2);line-height:1.6">' + (d.progress || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' +
      '<button class="btn block ghost" style="margin-top:16px" data-act="addDrillToSession" data-slug="' + esc(d.slug) + '">' + TP.ui.icon('plus') + 'Add to a session</button>';
    TP.ui.sheet(d.title, html);
  }

  function playDrill(slug) {
    var d = TP.data.drill(slug);
    if (!d) return;
    TP.ui.closeSheet();
    var el = document.createElement('div');
    el.className = 'player';
    el.id = 'player';
    el.innerHTML = '<div class="player-bar"><b>' + esc(d.title) + '</b>' +
      '<button class="btn sm ghost" data-act="closePlayer">Close</button></div>' +
      '<iframe src="' + esc(d.page) + '" title="' + esc(d.title) + ' animation" allow="autoplay"></iframe>';
    document.body.appendChild(el);
  }

  function closePlayer() {
    var el = document.getElementById('player');
    if (el) el.remove();
  }

  function assignSheet(payload) {
    var players = TP.data.squad();
    var existing = TP.store.state.assignments;
    var html = '<p class="small muted" style="margin:8px 0 12px">' + esc(payload.title) + '</p>' +
      '<div class="list">' + players.map(function (p) {
        var on = existing.some(function (a) { return a.refId === payload.refId && a.playerId === p.id; });
        return '<button class="switch" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" data-act="toggleAssign" data-id="' + esc(p.id) + '" data-ref="' + esc(payload.refId) + '">' +
          '<span class="avatar small">' + esc(p.num) + '</span>' +
          '<span class="grow"><b style="font-size:14px">' + esc(p.name) + '</b><span class="s" style="display:block;font-size:12px;color:var(--muted)">' + esc(p.pos) + '</span></span>' +
          '<span class="track" aria-hidden="true"></span></button>';
      }).join('') + '</div>' +
      '<p class="small muted" style="margin-top:12px">Assigned work shows on the player and on your squad list. Send it with a message in Comms.</p>';
    TP.ui.sheet('Assign to players', html);
    TP.views.library._payload = payload;
  }

  function toggleAssign(pid) {
    var payload = TP.views.library._payload;
    if (!payload) return;
    var list = TP.store.state.assignments;
    var i = -1;
    list.forEach(function (a, n) { if (a.refId === payload.refId && a.playerId === pid) i = n; });
    if (i > -1) list.splice(i, 1);
    else list.push({
      id: TP.uid('a'), playerId: pid, kind: payload.kind, refId: payload.refId,
      title: payload.title, url: payload.url || '', at: Date.now(), done: false
    });
    TP.store.save();
    var p = TP.data.player(pid);
    TP.ui.toast((i > -1 ? 'Removed from ' : 'Set for ') + (p ? p.name : 'player'));
    // repaint the switches without losing scroll
    var btn = document.querySelector('[data-act="toggleAssign"][data-id="' + pid + '"]');
    if (btn) {
      var on = i === -1;
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    }
  }

  function toSession(slug) {
    var d = TP.data.drill(slug);
    if (!d) return;
    TP.ui.closeSheet();
    TP.go('#/sessions');
    TP.ui.toast('Open a session and tap Adjust times to add ' + d.title);
  }

  TP.views = TP.views || {};
  TP.views.library = {
    render: list,
    mount: function () {
      var input = document.getElementById('libSearch');
      if (!input) return;
      var onType = TP.debounce(function () {
        query = input.value;
        limit = 40;
        TP.app.render({ keepFocus: '#libSearch' });
      }, 160);
      input.addEventListener('input', onType);
      if (query) {
        input.focus();
        input.setSelectionRange(query.length, query.length);
      }
    },
    unmount: function () {},
    setFilter: function (id) {
      filter = id;
      limit = 40;
      TP.app.render();
    },
    setQuery: function (v) {
      query = v;
      limit = 40;
      TP.app.render();
    },
    more: function () {
      limit += 40;
      TP.app.render();
    },
    openItem: item,
    drillSheet: drillSheet,
    playDrill: playDrill,
    closePlayer: closePlayer,
    assignDrill: function (slug) {
      var d = TP.data.drill(slug);
      if (!d) return;
      assignSheet({ kind: 'drill', refId: 'd:' + slug, title: d.title, url: d.page });
    },
    assignItem: function (id) {
      var x = build().filter(function (v) { return v.id === id; })[0];
      if (!x) return;
      assignSheet({ kind: 'resource', refId: x.id, title: x.t, url: x.url });
    },
    toggleAssign: toggleAssign,
    addDrillToSession: toSession
  };
})();
