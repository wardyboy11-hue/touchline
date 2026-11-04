/* Touchline Pro — sessions: plan the week, run the session, keep the timings honest. */
(function () {
  'use strict';
  var TP = window.TP;
  var esc = TP.esc;
  var run = null;
  var editing = {};

  function total(s) { return TP.data.sessionMinutes(s); }

  function blockDrill(b) { return b.drill ? TP.data.drill(b.drill) : null; }

  function list() {
    var all = TP.data.sessions();
    var td = TP.isoToday();
    var next = all.filter(function (s) { return s.date >= td; });
    var past = all.filter(function (s) { return s.date < td; }).reverse();
    function card(s) {
      var mins = total(s);
      var today = s.date === td;
      return '<button class="card clickable" data-act="openSession" data-id="' + esc(s.id) + '" style="width:100%;text-align:left;display:block">' +
        '<span class="row" style="border:0;padding:0;min-height:0">' +
          '<span class="grow"><span class="eyebrow" style="display:block">' + (today ? 'Tonight' : TP.ukDate(s.date)) + ' · ' + esc(s.time || '') + '</span>' +
            '<b style="display:block;font-size:18px;margin-top:5px;letter-spacing:-.01em">' + esc(s.title) + '</b>' +
            '<span class="sub" style="display:block">' + esc(s.theme) + ' · ' + mins + ' min · ' + (s.blocks || []).length + ' blocks</span></span>' +
          '<span class="avatar amber">' + TP.ui.icon('whistle') + '</span>' +
        '</span></button>';
    }
    return '<div class="page-head"><div><p class="eyebrow">Training</p><h1>Sessions</h1>' +
        '<p>' + esc(TP.data.club().training || '') + '</p></div>' +
        '<span class="spacer"></span>' +
        '<button class="btn sm pri" data-act="newSession">' + TP.ui.icon('plus') + 'New</button></div>' +
      (next.length ? '<section class="section"><div class="section-head"><h2>Coming up</h2></div><div class="grid">' + next.map(card).join('') + '</div></section>' : '') +
      (past.length ? '<section class="section"><div class="section-head"><h2>Done</h2></div><div class="grid">' + past.map(card).join('') + '</div></section>' : '') +
      '<p class="footnote">Every drill opens the animated practice, with the voice notes.</p>';
  }

  function detail(id) {
    var s = TP.data.session(id);
    if (!s) return TP.ui.empty('Session not found', 'It may have been removed.');
    var done = TP.data.sessionDone(id);
    var mins = total(s);
    var isEditing = !!editing[id];
    var rows = (s.blocks || []).map(function (b, i) {
      var d = blockDrill(b);
      var isDone = !!done[b.id];
      if (isEditing) {
        return '<div class="blockrow">' +
          '<span class="idx">' + (i + 1) + '</span>' +
          '<span class="body"><span class="nm">' + esc(b.name) + '</span>' +
            '<span class="meta">' + esc(d ? d.title : 'Simple block') + ' · ' + esc(b.focus || '') + '</span></span>' +
          '<span class="end" style="display:flex;gap:6px;align-items:center;margin-left:auto">' +
            '<button class="iconbtn" style="width:34px;height:34px" data-act="blockMinus" data-id="' + esc(s.id) + '" data-b="' + esc(b.id) + '" aria-label="Less time">' + TP.ui.icon('minus') + '</button>' +
            '<b class="mins" style="min-width:44px;text-align:center">' + (b.mins || 0) + "'" + '</b>' +
            '<button class="iconbtn" style="width:34px;height:34px" data-act="blockPlus" data-id="' + esc(s.id) + '" data-b="' + esc(b.id) + '" aria-label="More time">' + TP.ui.icon('plus') + '</button>' +
          '</span></div>';
      }
      return '<button class="blockrow' + (isDone ? ' done' : '') + '" data-act="' + (d ? 'openDrill' : 'blockInfo') + '" data-id="' + esc(d ? d.slug : b.id) + '">' +
        '<span class="idx">' + (isDone ? TP.ui.icon('check') : i + 1) + '</span>' +
        '<span class="body"><span class="nm">' + esc(b.name) + '</span>' +
          '<span class="meta">' + (d ? esc(d.theme) + ' · ' + esc(d.format) : esc(b.focus || '')) + '</span>' +
          (b.focus && d ? '<span class="meta">' + esc(b.focus) + '</span>' : '') + '</span>' +
        '<span class="mins">' + (b.mins || 0) + "'" + '</span>' +
      '</button>';
    }).join('');

    var points = [];
    (s.blocks || []).forEach(function (b) {
      var d = blockDrill(b);
      if (d && d.points) points = points.concat(d.points.slice(0, 2));
    });

    return '<div class="page-head" style="align-items:center">' +
        '<button class="iconbtn" data-act="go" data-to="#/sessions" aria-label="Back to sessions">' + TP.ui.icon('back') + '</button>' +
        '<div class="grow"><p class="eyebrow">' + (s.date === TP.isoToday() ? 'Tonight' : TP.ukDate(s.date)) + ' · ' + esc(s.time || '') + '</p>' +
          '<h1 style="font-size:26px">' + esc(s.title) + '</h1></div></div>' +
      '<article class="hero">' +
        '<div class="hero-top"><span class="pill amber">' + esc(s.theme) + '</span><span class="pill">' + (s.blocks || []).length + ' blocks</span></div>' +
        '<p class="meta" style="margin-top:12px">' + esc(s.focus || '') + '</p>' +
        '<div class="stats" style="margin-top:16px;position:relative">' +
          '<div class="stat"><span class="v">' + mins + "'" + '</span><span class="k">Total</span></div>' +
          '<div class="stat"><span class="v">' + (s.blocks || []).filter(function (b) { return b.drill; }).length + '</span><span class="k">Drills</span></div>' +
          '<div class="stat"><span class="v">' + esc(s.time || '') + '</span><span class="k">Start</span></div>' +
        '</div>' +
        '<div class="cta">' +
          '<button class="btn pri" data-act="runSession" data-id="' + esc(s.id) + '">' + TP.ui.icon('play') + 'Run session</button>' +
          '<button class="btn ghost" data-act="shareSession" data-id="' + esc(s.id) + '">' + TP.ui.icon('share') + 'Share plan</button>' +
        '</div>' +
      '</article>' +
      '<section class="section"><div class="section-head"><h2>Running order</h2><span class="spacer"></span>' +
        '<button class="linkbtn" data-act="toggleEdit" data-id="' + esc(s.id) + '">' + (isEditing ? 'Done' : 'Adjust times') + '</button></div>' +
        '<div class="card tight">' + rows +
        (isEditing ? '<button class="btn ghost block" style="margin-top:12px" data-act="addBlock" data-id="' + esc(s.id) + '">' + TP.ui.icon('plus') + 'Add a block</button>' : '') +
        '</div></section>' +
      (points.length ? '<section class="section"><div class="section-head"><h2>Coaching points</h2></div>' +
        '<div class="card"><div class="list">' + points.slice(0, 6).map(function (p) {
          return '<div class="row" style="min-height:44px"><span class="avatar small amber">' + TP.ui.icon('target') + '</span>' +
            '<span class="grow"><span class="t" style="font-weight:600;font-size:13.5px">' + esc(p) + '</span></span></div>';
        }).join('') + '</div></div></section>' : '') +
      '<p class="small muted">Place: ' + esc(s.place || TP.data.club().training || '') + '</p>';
  }

  /* ---------- run mode ---------- */
  function startRun(id) {
    var s = TP.data.session(id);
    if (!s || !s.blocks || !s.blocks.length) return;
    run = { s: s, i: 0, left: (s.blocks[0].mins || 0) * 60, running: true, last: Date.now(), timer: null };
    if (!TP.store.state.sessionDone[id]) TP.store.state.sessionDone[id] = {};
    var el = document.createElement('div');
    el.className = 'run';
    el.id = 'run';
    el.innerHTML = '<div class="run-top"><span class="pill amber">Session</span><b>' + esc(s.title) + '</b>' +
      '<button class="iconbtn" data-act="runEnd" aria-label="End session">' + TP.ui.icon('close') + '</button></div>' +
      '<div class="run-body"></div>' +
      '<div class="run-next" id="runNext"></div>' +
      '<div class="run-actions" style="margin-top:12px">' +
        '<button class="btn pri" data-act="runToggle">' + TP.ui.icon('pause') + 'Pause</button>' +
        '<button class="btn" data-act="runPlus">+1 min</button>' +
        '<button class="btn ghost" data-act="runPrev">' + TP.ui.icon('back') + 'Back</button>' +
        '<button class="btn ghost" data-act="runNext">Next block ' + TP.ui.icon('chevron') + '</button>' +
      '</div>';
    document.body.appendChild(el);
    paintRun();
    run.timer = setInterval(function () {
      if (!run) return;
      var now = Date.now();
      if (run.running) {
        run.left -= (now - run.last) / 1000;
        if (run.left < 0) run.left = 0;
      }
      run.last = now;
      paintRun();
    }, 250);
  }

  function paintRun() {
    if (!run) return;
    var s = run.s, b = s.blocks[run.i];
    var panel = document.getElementById('run');
    if (!panel) return;
    var left = Math.ceil(run.left);
    var done = TP.store.state.sessionDone[s.id] || {};
    var pct = (run.i + 1) / s.blocks.length * 100;
    panel.querySelector('.run-body').innerHTML =
      '<span class="phase-label">Block ' + (run.i + 1) + ' of ' + s.blocks.length + ' · ' + (b.mins || 0) + ' min</span>' +
      '<span class="now">' + esc(b.name) + '</span>' +
      '<span class="timer' + (left <= 60 ? ' low' : '') + '">' + TP.fmtClock(left) + '</span>' +
      '<span class="focus">' + esc(b.focus || '') + '</span>' +
      '<div class="meter" style="width:min(420px,100%);height:8px"><i class="' + (left <= 60 ? 'low' : '') + '" style="width:' + pct + '%"></i></div>';
    var next = s.blocks[run.i + 1];
    document.getElementById('runNext').innerHTML = next
      ? '<span class="tiny">Next</span><b style="font-size:14px">' + esc(next.name) + ' · ' + (next.mins || 0) + "'" + '</b>'
      : '<span class="tiny">Last block</span><b style="font-size:14px">Finish and debrief</b>';
    var toggle = panel.querySelector('[data-act="runToggle"]');
    if (toggle) toggle.innerHTML = TP.ui.icon(run.running ? 'pause' : 'play') + (run.running ? 'Pause' : 'Resume');
    // mark the finished block done when the timer has passed
    if (run.left <= 0 && !done[b.id]) {
      TP.store.state.sessionDone[s.id][b.id] = true;
      TP.store.save();
    }
  }

  function endRun() {
    if (run) {
      clearInterval(run.timer);
      run = null;
    }
    var el = document.getElementById('run');
    if (el) el.remove();
    TP.app.render();
  }

  function step(delta) {
    if (!run) return;
    var done = TP.store.state.sessionDone[run.s.id];
    var b = run.s.blocks[run.i];
    done[b.id] = true;
    run.i = Math.max(0, Math.min(run.s.blocks.length - 1, run.i + delta));
    run.left = (run.s.blocks[run.i].mins || 0) * 60;
    run.last = Date.now();
    TP.store.save();
    paintRun();
  }

  /* ---------- editing ---------- */
  function editOf(id) {
    if (!TP.store.state.sessionEdits[id]) {
      var s = TP.data.session(id);
      TP.store.state.sessionEdits[id] = JSON.parse(JSON.stringify(s));
    }
    TP.store.save();
    return TP.store.state.sessionEdits[id];
  }

  function addBlockSheet(id) {
    var drills = TP.data.drills();
    var html = '<p class="small muted" style="margin:10px 0 6px">Add a drill from the animated library, or a simple block you run yourself.</p>' +
      '<button class="btn block ghost" style="margin-bottom:10px" data-act="addSimple" data-id="' + esc(id) + '">' + TP.ui.icon('plus') + 'Simple block</button>' +
      '<div class="list">' + drills.map(function (d) {
        return '<button class="itemrow" data-act="addDrill" data-id="' + esc(id) + '" data-slug="' + esc(d.slug) + '">' +
          '<span class="kind drill">' + TP.ui.icon('play') + '</span>' +
          '<span class="body"><span class="t">' + esc(d.title) + '</span>' +
            '<span class="m"><span>' + esc(d.theme) + '</span><span>·</span><span>' + Math.round(d.seconds / 60 * 10) / 10 + ' min animation</span></span></span></button>';
      }).join('') + '</div>';
    TP.ui.sheet('Add a block', html);
  }

  TP.views = TP.views || {};
  TP.views.sessions = {
    render: function () {
      var parts = TP.route.parts;
      if (parts[0] === 'session') return detail(parts[1]);
      return list();
    },
    mount: function () {},
    unmount: function () {},
    startRun: startRun,
    endRun: endRun,
    runToggle: function () {
      if (!run) return;
      run.running = !run.running;
      run.last = Date.now();
      paintRun();
    },
    runPlus: function () {
      if (!run) return;
      run.left += 60;
      paintRun();
    },
    runNext: function () { step(1); },
    runPrev: function () { step(-1); },
    toggleEdit: function (id) {
      editing[id] = !editing[id];
      if (editing[id]) editOf(id);
      TP.app.render();
    },
    adjust: function (id, blockId, delta) {
      var s = editOf(id);
      s.blocks.forEach(function (b) {
        if (b.id === blockId) b.mins = Math.max(0, (Number(b.mins) || 0) + delta);
      });
      TP.store.save();
      TP.app.render();
    },
    addBlock: addBlockSheet,
    addDrill: function (id, slug) {
      var s = editOf(id);
      var d = TP.data.drill(slug);
      s.blocks.splice(s.blocks.length - 1, 0, {
        id: TP.uid('b'), name: d.title, mins: 20, drill: slug, focus: d.points && d.points[0] ? d.points[0] : ''
      });
      TP.store.save();
      TP.ui.closeSheet();
      TP.app.render();
      TP.ui.toast('Block added');
    },
    addSimple: function (id) {
      var s = editOf(id);
      s.blocks.splice(s.blocks.length - 1, 0, { id: TP.uid('b'), name: 'New block', mins: 10, drill: '', focus: '' });
      TP.store.save();
      TP.ui.closeSheet();
      TP.app.render();
    },
    newSession: function () {
      var id = 's' + Date.now();
      var s = {
        id: id, date: TP.isoToday(), time: '19:00', place: TP.data.club().training,
        title: 'New session', theme: 'Pick a theme', focus: 'What is this session for?',
        blocks: [
          { id: TP.uid('b'), name: 'Activation and rondo', mins: 12, drill: '', focus: '' },
          { id: TP.uid('b'), name: 'Practice', mins: 25, drill: '02_pressing_trap_and_spring', focus: '' },
          { id: TP.uid('b'), name: 'The Whole Game', mins: 18, drill: '11_shape_and_transition_game', focus: '' },
          { id: TP.uid('b'), name: 'Debrief', mins: 6, drill: '', focus: '' }
        ]
      };
      TP.store.state.sessionEdits[id] = s;
      TP.store.save();
      TP.go('#/session/' + id);
      editing[id] = true;
      setTimeout(function () { TP.app.render(); }, 0);
    },
    shareText: function (id) {
      var s = TP.data.session(id);
      if (!s) return '';
      var club = TP.data.club();
      var lines = [s.title + ' — ' + TP.longDate(s.date), s.theme, ''];
      (s.blocks || []).forEach(function (b, i) {
        lines.push((i + 1) + '. ' + b.name + ' · ' + (b.mins || 0) + ' min' + (b.focus ? ' — ' + b.focus : ''));
      });
      lines.push('', s.place || club.training || '', 'Coach: ' + (club.coach || ''));
      return lines.join('\n');
    }
  };
})();
