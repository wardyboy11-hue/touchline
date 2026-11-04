/* Touchline Pro — training attendance. One tap after the session: who was there, who stood out. */
(function () {
  'use strict';
  var TP = window.TP;
  var esc = TP.esc;
  var picked = null;

  function keyOf() {
    var s = TP.data.session(picked);
    return s ? s.date : TP.isoToday();
  }

  function record() {
    var state = TP.store.state;
    state.att = state.att || {};
    return state.att[keyOf()] || (state.att[keyOf()] = {});
  }

  function isOn(pid, kind) {
    var r = record()[pid];
    return !!(r && r[kind]);
  }

  function counts() {
    var rec = record();
    var squad = TP.data.squad();
    return {
      in: squad.filter(function (p) { return rec[p.id] && rec[p.id].p; }).length,
      starred: squad.filter(function (p) { return rec[p.id] && rec[p.id].s; }).length,
      out: squad.filter(function (p) { return !(rec[p.id] && rec[p.id].p); }).length
    };
  }

  function paint() {
    var c = counts();
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('attIn', c.in);
    set('attOut', c.out);
    set('attStar', c.starred);
    var rec = record();
    TP.data.squad().forEach(function (p) {
      var row = document.querySelector('[data-att-row="' + p.id + '"]');
      if (!row) return;
      ['p', 's'].forEach(function (k) {
        var b = row.querySelector('[data-att="' + k + '"]');
        if (b) b.setAttribute('aria-pressed', rec[p.id] && rec[p.id][k] ? 'true' : 'false');
      });
    });
  }

  function toggle(pid, kind) {
    var rec = record();
    var r = rec[pid] || (rec[pid] = {});
    r[kind] = r[kind] ? 0 : 1;
    if (!r.p && !r.s) delete rec[pid];
    TP.store.save();
    paint();
  }

  function markAll(on) {
    var state = TP.store.state;
    if (!on) {
      state.att[keyOf()] = {};
    } else {
      var rec = {};
      TP.data.squad().forEach(function (p) { rec[p.id] = { p: 1 }; });
      state.att[keyOf()] = rec;
    }
    TP.store.save();
    TP.app.render({ keepScroll: true });
  }

  function messageMissing() {
    var rec = record();
    var names = TP.data.squad().filter(function (p) { return !(rec[p.id] && rec[p.id].p); })
      .map(function (p) { return p.name; });
    if (!names.length) { TP.ui.toast('Everyone was ticked in'); return; }
    var s = TP.data.session(picked);
    TP.views.comms.open({
      name: 'Training attendance',
      body: 'Hi all, we missed you at training on ' + TP.ukDate(keyOf()) + ': ' + names.join(', ') +
        '. If you could not make it, tell me why and we will catch you up.' +
        (s ? ' ' + s.place + '.' : '') + ' Thanks, Tim'
    });
  }

  function render() {
    var sessions = TP.data.sessions().slice().reverse();
    if (picked == null) picked = (TP.data.nextSession() || sessions[0] || {}).id || null;
    var c = counts();
    var s = TP.data.session(picked);
    return '<div class="page-head"><div><p class="eyebrow">Train</p><h1>Attendance</h1>' +
        '<p>Tick who was there. It feeds minutes, the team pick and the message home.</p></div></div>' +

      '<div class="chips" style="margin-bottom:14px">' + sessions.map(function (x) {
        return '<button class="chip" aria-pressed="' + (x.id === picked ? 'true' : 'false') + '" data-act="attPick" data-id="' + esc(x.id) + '">' +
          esc(TP.ukDate(x.date, { weekday: 'short' })) + ' <span class="n">' + esc(x.title) + '</span></button>';
      }).join('') + '</div>' +

      '<div class="card tight" style="margin-bottom:14px">' +
        '<div class="stats">' +
          '<div class="stat"><span class="v" id="attIn">' + c.in + '</span><span class="k">Ticked in</span></div>' +
          '<div class="stat"><span class="v" id="attOut">' + c.out + '</span><span class="k">Missing</span></div>' +
          '<div class="stat"><span class="v" id="attStar">' + c.starred + '</span><span class="k">Stood out</span></div>' +
        '</div>' +
        (s ? '<p class="sub" style="margin-top:10px">' + esc(s.title) + ' · ' + esc(s.place) + '</p>' : '') +
      '</div>' +

      '<div class="card tight"><div class="list">' + TP.data.squad().map(function (p) {
        var on = isOn(p.id, 'p');
        return '<div class="row" data-att-row="' + esc(p.id) + '" style="gap:10px">' +
          '<span class="avatar small' + (on ? ' amber' : '') + '">' + esc(p.num) + '</span>' +
          '<span class="grow"><span class="t">' + esc(p.name) + '</span><span class="s">' + esc(p.pos) + '</span></span>' +
          '<span class="end">' +
            '<button class="attbtn star" data-att="s" aria-pressed="' + (isOn(p.id, 's') ? 'true' : 'false') + '" data-act="attStar" data-id="' + esc(p.id) + '" aria-label="Stood out: ' + esc(p.name) + '">' + TP.ui.icon('star') + '</button>' +
            '<button class="attbtn in" data-att="p" aria-pressed="' + (isOn(p.id, 'p') ? 'true' : 'false') + '" data-act="attToggle" data-id="' + esc(p.id) + '" aria-label="Present: ' + esc(p.name) + '">' + TP.ui.icon('check') + '</button>' +
          '</span>' +
        '</div>';
      }).join('') + '</div></div>' +

      '<div class="btnrow" style="margin-top:12px">' +
        '<button class="btn ghost" data-act="attAll">Everyone in</button>' +
        '<button class="btn ghost" data-act="attClear">Clear</button>' +
      '</div>' +
      '<button class="btn block ghost" style="margin-top:8px" data-act="attMsg">' + TP.ui.icon('message') + 'Message the ones missing</button>' +
      '<p class="footnote">Ticks stay on this phone until the club code is connected.</p>';
  }

  TP.views = TP.views || {};
  TP.views.attendance = {
    render: render,
    pick: function (id) { picked = id; TP.app.render(); },
    toggle: toggle,
    star: function (pid) { toggle(pid, 's'); },
    all: function () { markAll(true); },
    clear: function () { markAll(false); },
    message: messageMissing
  };
})();
