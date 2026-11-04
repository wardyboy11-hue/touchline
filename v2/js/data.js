/* Touchline Pro — club data, match maths and derived views. */
(function () {
  'use strict';
  var TP = window.TP;

  TP.formations = {
    '4231': {
      name: '4-2-3-1',
      slots: [
        { k: 'GK', x: 50, y: 92 },
        { k: 'RB', x: 85, y: 76 },
        { k: 'RCB', x: 63, y: 79 },
        { k: 'LCB', x: 37, y: 79 },
        { k: 'LB', x: 15, y: 76 },
        { k: 'CDM', x: 60, y: 62 },
        { k: 'CM', x: 40, y: 62 },
        { k: 'RW', x: 85, y: 40 },
        { k: 'CAM', x: 50, y: 43 },
        { k: 'LW', x: 15, y: 40 },
        { k: 'ST', x: 50, y: 15 }
      ]
    }
  };

  var LINES = {
    GK: 0,
    RB: 1, RWB: 1, LWB: 1, LB: 1, RCB: 1, CB: 1, LCB: 1,
    CDM: 2, CM: 2, RCM: 2, LCM: 2, CAM: 2,
    RW: 3, LW: 3, ST: 3
  };
  TP.lineOf = function (pos) { return LINES[pos] == null ? 3 : LINES[pos]; };

  var D = null;

  TP.data = {
    ready: false,
    boot: function () {
      return fetch('data/coach.json', { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('Data ' + r.status); return r.json(); })
        .then(function (j) { D = j; TP.data.ready = true; return j; })
        .catch(function (e) {
          D = { club: {}, squad: [], fixtures: [], results: [], sessions: [], drills: [], positions: [], resources: [], messages: [], guides: [] };
          TP.data.ready = true;
          TP.data.error = e;
          throw e;
        });
    },
    club: function () { return (D && D.club) || {}; },
    squad: function () { return (D && D.squad) || []; },
    player: function (id) {
      var s = TP.data.squad();
      for (var i = 0; i < s.length; i++) if (s[i].id === id) return s[i];
      return null;
    },
    fixtures: function () { return (D && D.fixtures) || []; },
    results: function () { return (D && D.results) || []; },
    drills: function () { return (D && D.drills) || []; },
    drill: function (slug) {
      var a = TP.data.drills();
      for (var i = 0; i < a.length; i++) if (a[i].slug === slug) return a[i];
      return null;
    },
    positions: function () { return (D && D.positions) || []; },
    position: function (k) {
      var a = TP.data.positions();
      for (var i = 0; i < a.length; i++) if (a[i].k === k) return a[i];
      return null;
    },
    resources: function () { return (D && D.resources) || []; },
    guides: function () { return (D && D.guides) || []; },
    messages: function () { return (D && D.messages) || []; },

    nextFixture: function () {
      var td = TP.isoToday();
      var live = TP.store.state.match;
      if (live && live.status !== 'done') {
        var all = TP.data.fixtures().concat(TP.data.results());
        for (var j = 0; j < all.length; j++) if (all[j].id === live.id) return all[j];
      }
      var done = live && live.status === 'done' ? live.id : null;
      var f = TP.data.fixtures().filter(function (m) { return m.date >= td && m.id !== done; })
        .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      return f[0] || TP.data.fixtures()[0] || null;
    },
    fixture: function (id) {
      var a = TP.data.fixtures().concat(TP.data.results());
      for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
      return null;
    },
    lastResult: function () { return TP.data.results()[0] || null; },

    sessions: function () {
      var edits = TP.store.state.sessionEdits || {};
      return ((D && D.sessions) || []).map(function (s) {
        return edits[s.id] ? edits[s.id] : s;
      }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    },
    session: function (id) {
      var a = TP.data.sessions();
      for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
      return null;
    },
    nextSession: function () {
      var td = TP.isoToday();
      var a = TP.data.sessions();
      for (var i = 0; i < a.length; i++) if (a[i].date >= td) return a[i];
      return a[a.length - 1] || null;
    },
    sessionMinutes: function (s) {
      return (s.blocks || []).reduce(function (n, b) { return n + (Number(b.mins) || 0); }, 0);
    },
    sessionDone: function (id) { return TP.store.state.sessionDone[id] || {}; },

    assignmentsFor: function (pid) {
      return TP.store.state.assignments.filter(function (a) { return a.playerId === pid; });
    },
    openAssignments: function () {
      return TP.store.state.assignments.filter(function (a) { return !a.done; });
    },
    available: function (p) {
      var a = TP.store.state.avail;
      return a[p.id] !== false;
    }
  };

  /* ---------- lineup ---------- */
  TP.lineup = {
    slots: function () { return TP.formations[TP.store.state.formation || '4231'].slots; },
    get: function () { return TP.store.state.lineup || {}; },
    set: function (slotKey, pid) {
      var l = TP.store.state.lineup;
      // a player can only hold one slot
      Object.keys(l).forEach(function (k) { if (l[k] === pid) delete l[k]; });
      if (pid) l[slotKey] = pid; else delete l[slotKey];
      TP.store.save();
    },
    playerIn: function (pid) {
      var l = TP.lineup.get();
      for (var k in l) if (l[k] === pid) return k;
      return null;
    },
    bench: function () {
      var onPitch = TP.lineup.get();
      var ids = Object.keys(onPitch).map(function (k) { return onPitch[k]; });
      return TP.data.squad().filter(function (p) {
        return TP.data.available(p) && ids.indexOf(p.id) === -1;
      });
    },
    filled: function () {
      var l = TP.lineup.get(), n = 0;
      TP.lineup.slots().forEach(function (s) { if (l[s.k]) n++; });
      return n;
    },
    fit: function (p, slotKey) {
      if (!p) return 0;
      if (p.pos === slotKey) return 3;
      if ((p.alt || []).indexOf(slotKey) > -1) return 2;
      if (TP.lineOf(p.pos) === TP.lineOf(slotKey)) return 1;
      return 0;
    },
    suggest: function () {
      var slots = TP.lineup.slots();
      var used = {};
      var l = {};
      // goalkeeper first, then out from the back
      var order = slots.slice().sort(function (a, b) { return a.y - b.y; });
      order.forEach(function (s) {
        var best = null, bestFit = -1;
        TP.data.squad().forEach(function (p) {
          if (used[p.id] || !TP.data.available(p)) return;
          var f = TP.lineup.fit(p, s.k);
          if (f > bestFit) { bestFit = f; best = p; }
        });
        if (best && bestFit > 0) { l[s.k] = best.id; used[best.id] = true; }
      });
      TP.store.state.lineup = l;
      TP.store.save();
      return Object.keys(l).length;
    },
    clear: function () {
      TP.store.state.lineup = {};
      TP.store.save();
    }
  };

  /* ---------- live match ---------- */
  var M = {
    current: function () { return TP.store.state.match; },
    make: function (fixture) {
      var l = TP.lineup.get();
      var lineup = {};
      Object.keys(l).forEach(function (k) { lineup[k] = l[k]; });
      var m = {
        id: fixture.id,
        opp: fixture.opp,
        ha: fixture.ha,
        date: fixture.date,
        ko: fixture.ko,
        comp: fixture.comp,
        venue: fixture.venue,
        status: 'live',
        period: 1,
        clock: { acc: 0, running: true, t0: Date.now() },
        events: [],
        stints: {},
        lineup: lineup,
        startedAt: Date.now()
      };
      var t0 = 0;
      Object.keys(lineup).forEach(function (k) {
        var pid = lineup[k];
        if (!m.stints[pid]) m.stints[pid] = [];
        m.stints[pid].push({ in: t0, out: null });
      });
      m.events.push({ id: TP.uid('e'), type: 'ko', t: 0 });
      TP.store.state.match = m;
      TP.store.save();
      return m;
    },
    msec: function (m) {
      if (!m) return 0;
      var c = m.clock || {};
      return Math.floor((c.acc || 0) + (c.running ? (Date.now() - c.t0) / 1000 : 0));
    },
    pause: function (m) {
      if (!m || !m.clock.running) return;
      m.clock.acc = M.msec(m);
      m.clock.running = false;
      TP.store.save();
    },
    resume: function (m) {
      if (!m || m.clock.running) return;
      m.clock.t0 = Date.now();
      m.clock.running = true;
      TP.store.save();
    },
    score: function (m) {
      var us = 0, them = 0;
      (m ? m.events : []).forEach(function (e) {
        if (e.type === 'goal') us++;
        else if (e.type === 'ga') them++;
      });
      return [us, them];
    },
    minutes: function (m, pid) {
      if (!m) return 0;
      var t = M.msec(m);
      return ((m.stints || {})[pid] || []).reduce(function (sum, s) {
        return sum + ((s.out == null ? t : s.out) - s.in);
      }, 0);
    },
    onPitch: function (m, pid) {
      var st = ((m.stints || {})[pid] || []);
      var last = st[st.length - 1];
      return !!(last && last.out == null);
    },
    slotOf: function (m, pid) {
      var l = (m && m.lineup) || {};
      for (var k in l) if (l[k] === pid) return k;
      return null;
    },
    addEvent: function (type, extra) {
      var m = M.current();
      if (!m) return null;
      var e = Object.assign({ id: TP.uid('e'), type: type, t: M.msec(m) }, extra || {});
      m.events.push(e);
      TP.store.save();
      return e;
    },
    undo: function () {
      var m = M.current();
      if (!m || !m.events.length) return;
      var e = m.events.pop();
      if (e.type === 'sub') {
        // restore the outgoing player into the slot
        var slot = M.slotOf(m, e.on);
        if (slot) m.lineup[slot] = e.off;
        var so = m.stints[e.off] || [];
        if (so.length) so[so.length - 1].out = null;
        var si = m.stints[e.on] || [];
        if (si.length) si.pop();
      }
      TP.store.save();
    },
    sub: function (off, on) {
      var m = M.current();
      if (!m) return false;
      var slot = M.slotOf(m, off);
      if (!slot) return false;
      var t = M.msec(m);
      var so = m.stints[off] || (m.stints[off] = []);
      if (so.length) so[so.length - 1].out = t;
      m.lineup[slot] = on;
      var si = m.stints[on] || (m.stints[on] = []);
      si.push({ in: t, out: null });
      m.events.push({ id: TP.uid('e'), type: 'sub', t: t, off: off, on: on });
      TP.store.save();
      return true;
    },
    halfTime: function () {
      var m = M.current();
      if (!m) return;
      M.pause(m);
      m.status = 'ht';
      M.addEvent('ht');
    },
    secondHalf: function () {
      var m = M.current();
      if (!m) return;
      m.period = 2;
      m.status = 'live';
      M.addEvent('second');
      M.resume(m);
    },
    fullTime: function () {
      var m = M.current();
      if (!m) return;
      M.pause(m);
      var t = M.msec(m);
      Object.keys(m.stints).forEach(function (pid) {
        var st = m.stints[pid];
        if (st.length && st[st.length - 1].out == null) st[st.length - 1].out = t;
      });
      m.status = 'done';
      M.addEvent('ft');
    },
    reset: function () {
      TP.store.state.match = null;
      TP.store.save();
    }
  };
  TP.match = M;

  /* ---------- lazy resource library ---------- */
  var lib = { items: null, promise: null };
  TP.lib = {
    items: function () { return lib.items; },
    load: function () {
      if (lib.items) return Promise.resolve(lib.items);
      if (lib.promise) return lib.promise;
      lib.promise = fetch('data/library.json')
        .then(function (r) { if (!r.ok) throw new Error('Library ' + r.status); return r.json(); })
        .then(function (j) { lib.items = j.items || []; return lib.items; });
      return lib.promise;
    },
    ready: function () { return !!lib.items; }
  };
})();
