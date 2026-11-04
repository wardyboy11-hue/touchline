/* Touchline Pro — core helpers and local state. No dependencies. */
(function () {
  'use strict';
  var TP = window.TP = window.TP || {};

  var KEY = 'tlp.v1';

  function blank() {
    return {
      v: 1,
      avail: {},          // playerId -> false when unavailable
      lineup: {},         // slot -> playerId
      formation: '4231',
      match: null,        // live or finished match state
      assignments: [],    // {id, playerId, kind, refId, title, url, at, done}
      sessionEdits: {},   // sessionId -> session override
      sessionDone: {},    // sessionId -> {blockId: true}
      messages: [],       // {id, at, name, body}
      att: {},            // session date -> playerId -> {p: 1, s: 1}
      prefs: {}
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      var s = JSON.parse(raw);
      var b = blank();
      for (var k in b) if (s[k] === undefined) s[k] = b[k];
      return s;
    } catch (e) {
      return blank();
    }
  }

  var state = load();

  TP.store = {
    get: function () { return state; },
    save: function () {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    },
    reset: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      state = blank();
      TP.store.state = state;
    }
  };
  TP.store.state = state;

  /* ---------- strings ---------- */
  TP.esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  TP.uid = function (p) {
    return (p || 'i') + Math.random().toString(36).slice(2, 9);
  };
  TP.pad = function (n) { return String(n).padStart(2, '0'); };

  /* ---------- dates ---------- */
  TP.isoToday = function (d) {
    d = d || new Date();
    return d.getFullYear() + '-' + TP.pad(d.getMonth() + 1) + '-' + TP.pad(d.getDate());
  };
  TP.addDays = function (iso, n) {
    var p = iso.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2] + n);
    return TP.isoToday(d);
  };
  TP.dateOf = function (iso) {
    var p = String(iso).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  };
  TP.ukDate = function (iso, opts) {
    if (!iso) return '';
    var d = TP.dateOf(iso);
    return d.toLocaleDateString('en-GB', Object.assign({ weekday: 'short', day: 'numeric', month: 'short' }, opts || {}));
  };
  TP.longDate = function (iso) {
    return TP.ukDate(iso, { weekday: 'long', day: 'numeric', month: 'long' });
  };
  TP.daysUntil = function (iso) {
    var a = TP.dateOf(TP.isoToday()).getTime();
    var b = TP.dateOf(iso).getTime();
    return Math.round((b - a) / 86400000);
  };
  TP.countdown = function (iso) {
    var d = TP.daysUntil(iso);
    if (d === 0) return 'Today';
    if (d === 1) return 'Tomorrow';
    if (d > 1) return 'In ' + d + ' days';
    return Math.abs(d) + ' days ago';
  };
  TP.fmtClock = function (sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return TP.pad(m) + ':' + TP.pad(s);
  };

  /* ---------- router ---------- */
  TP.route = { path: '#/today', parts: ['today'] };
  TP.parseRoute = function () {
    var h = location.hash.replace(/^#\/?/, '');
    if (!h) h = 'today';
    var bits = h.split('/');
    TP.route.path = '#/' + h;
    TP.route.parts = bits;
    return bits;
  };
  TP.go = function (hash) {
    if (location.hash === hash) {
      TP.app && TP.app.render();
      return;
    }
    location.hash = hash;
  };

  /* ---------- misc ---------- */
  TP.debounce = function (fn, ms) {
    var t;
    return function () {
      var a = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, a); }, ms || 120);
    };
  };
  TP.onIdle = function (fn) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 2000 });
    else setTimeout(fn, 300);
  };
})();
