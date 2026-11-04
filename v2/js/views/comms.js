/* Touchline Pro — comms: the four messages a coach actually sends, filled in for you. */
(function () {
  'use strict';
  var TP = window.TP;
  var esc = TP.esc;
  var current = { playerId: null, name: '' };

  function absolute(path) {
    try { return new URL(path.replace(/^\.\.\//, ''), location.origin + '/').href; } catch (e) { return path; }
  }

  function context(playerId) {
    var club = TP.data.club();
    var f = TP.data.nextFixture();
    var s = TP.data.nextSession();
    var p = playerId ? TP.data.player(playerId) : null;
    return {
      NAME: p ? p.name.replace(/\s+[A-Z]\.$/, '').split(' ')[0] : 'there',
      TEAM: club.name || 'Wigan Junior Latics Blues U15',
      OPP: f ? f.opp : 'the opposition',
      HOME_AWAY: f ? (f.ha === 'H' ? 'host' : 'travel to') : 'play',
      DATE: f ? TP.longDate(f.date) : '',
      KO: f ? f.ko : '',
      VENUE: f ? f.venue : '',
      ADDRESS: f ? (f.addr || f.venue) : '',
      LINK: absolute('../Wigan_Junior_Latics_Visiting_Teams_Guide.pdf'),
      TIME: s ? s.time : '',
      PLACE: s ? s.place : '',
      THEME: s ? s.theme : '',
      TITLE: '',
      NOTE: ''
    };
  }

  function fill(tpl, playerId) {
    var ctx = context(playerId);
    return String(tpl || '').replace(/\[([A-Z_]+)\]/g, function (m, k) {
      return ctx[k] != null ? ctx[k] : m;
    });
  }

  function recent() {
    var list = TP.store.state.messages.slice(-3).reverse();
    if (!list.length) return '';
    return '<h3 style="margin:20px 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">Sent recently</h3>' +
      '<div class="list">' + list.map(function (m) {
        return '<div class="row" style="align-items:flex-start"><span class="avatar small">' + TP.ui.icon('message') + '</span>' +
          '<span class="grow"><span class="t" style="font-size:13px;font-weight:600">' + esc(m.name || 'Message') + '</span>' +
            '<span class="s" style="white-space:pre-wrap;line-height:1.4">' + esc(m.body.slice(0, 110)) + (m.body.length > 110 ? '…' : '') + '</span></span>' +
          '<button class="btn sm ghost" data-act="reuseMsg" data-id="' + esc(m.id) + '">Use</button></div>';
      }).join('') + '</div>';
  }

  function open(opts) {
    opts = opts || {};
    current = { playerId: opts.playerId || null, name: opts.name || '' };
    var templates = TP.data.messages();
    var first = opts.body ? { body: opts.body, name: opts.title || 'Message' } : null;
    var initial = first ? first.body : fill(templates[0] ? templates[0].body : '', current.playerId);
    var html = '<p class="small muted" style="margin:8px 0 12px">Pick a template, change what you need, then copy or share. Everything fills in from the next fixture and session.</p>' +
      '<div class="chips" style="margin-bottom:6px">' + templates.map(function (t, i) {
        return '<button class="chip" data-act="pickTemplate" data-id="' + esc(t.id) + '" aria-pressed="' + (!first && i === 0 ? 'true' : 'false') + '">' + esc(t.name) + '</button>';
      }).join('') + '</div>' +
      '<div class="field"><label for="msgBody">Message</label>' +
        '<textarea class="input" id="msgBody">' + esc(initial) + '</textarea></div>' +
      '<div class="btnrow">' +
        '<button class="btn pri" data-act="copyMsg">' + TP.ui.icon('copy') + 'Copy</button>' +
        '<button class="btn" data-act="shareMsg">' + TP.ui.icon('share') + 'Share</button>' +
        '<a class="btn ghost" data-act="waMsg" href="#" target="_blank" rel="noopener">WhatsApp</a>' +
      '</div>' +
      recent();
    TP.ui.sheet(opts.name || 'Message the team', html);
  }

  function body() {
    var el = document.getElementById('msgBody');
    return el ? el.value : '';
  }

  function remember() {
    var text = body().trim();
    if (!text) return;
    TP.store.state.messages.push({ id: TP.uid('m'), at: Date.now(), name: current.name || 'Message', body: text });
    TP.store.state.messages = TP.store.state.messages.slice(-20);
    TP.store.save();
  }

  TP.views = TP.views || {};
  TP.views.comms = {
    open: open,
    fill: fill,
    pickTemplate: function (id) {
      var t = TP.data.messages().filter(function (x) { return x.id === id; })[0];
      if (!t) return;
      var el = document.getElementById('msgBody');
      if (el) el.value = fill(t.body, current.playerId);
      current.name = t.name;
      Array.prototype.forEach.call(document.querySelectorAll('[data-act="pickTemplate"]'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-id') === id ? 'true' : 'false');
      });
    },
    copy: function () {
      var text = body().trim();
      if (!text) return;
      TP.ui.copy(text).then(function () {
        remember();
        TP.ui.closeSheet();
        TP.ui.toast('Message copied');
      });
    },
    share: function () {
      var text = body().trim();
      if (!text) return;
      remember();
      TP.ui.share(text, current.name || 'Touchline');
      TP.ui.closeSheet();
    },
    whatsapp: function () {
      var text = body().trim();
      if (!text) return;
      remember();
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
      TP.ui.closeSheet();
    },
    reuse: function (id) {
      var m = TP.store.state.messages.filter(function (x) { return x.id === id; })[0];
      if (!m) return;
      var el = document.getElementById('msgBody');
      if (el) el.value = m.body;
      current.name = m.name;
    },
    /* match report text used by the full-time screen */
    report: function () {
      var m = TP.match.current();
      if (!m) return '';
      var sc = TP.match.score(m);
      var result = sc[0] > sc[1] ? 'won' : sc[0] === sc[1] ? 'drew' : 'lost';
      var motm = m.motm ? TP.data.player(m.motm) : null;
      return 'Full time: ' + TP.data.club().short + ' ' + result + ' ' + sc[0] + '–' + sc[1] + ' ' + (m.ha === 'H' ? 'against ' : 'at ') + m.opp +
        ' (' + m.comp + ').' + (motm ? ' Man of the match: ' + motm.name + '.' : '') + ' Well done lads. Tim';
    }
  };
})();
