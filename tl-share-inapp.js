/* In-app share. The first action sends the item to chosen players inside Touchline.
   WhatsApp is a separate button, and only for public team pages.
   Cancel writes nothing. A private code is never put in the link or the queue. */
(function (w) {
  'use strict';
  var WA_OK = { shape: 1, stretch: 1, guide: 1, formation: 1 };
  var NO = { cv: 1, coachesvoice: 1, paid: 1, welfare: 1, niggle: 1, consent: 1, marks: 1, health: 1, plan: 1 };
  var KEY = 'tl.shareq';
  var state = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function kindOf(opts) {
    var k = String((opts && opts.kind) || '').toLowerCase();
    if (k) return k;
    var u = String((opts && (opts.path || opts.url)) || '');
    if (/\/shape\//.test(u)) return 'shape';
    if (/\/stretch\//.test(u)) return 'stretch';
    if (/guide\.html/.test(u)) return 'guide';
    if (/#clip\//.test(u)) return 'clip';
    if (/youtube\.com|youtu\.be/.test(u)) return 'clip';
    return 'resource';
  }
  function pathOf(opts) {
    var u = String((opts && (opts.path || opts.url)) || '').trim();
    if (!u) return '';
    try {
      if (/^https?:\/\//i.test(u)) {
        var abs = new URL(u, location.href);
        if (abs.origin === location.origin) return abs.pathname + abs.hash;
        return abs.href.split('&')[0];
      }
    } catch (e) {}
    if (u.charAt(0) === '/') return u.split('?')[0];
    try {
      var rel = new URL(u, location.href);
      if (rel.origin === location.origin) return rel.pathname + rel.hash;
    } catch (e2) {}
    return u;
  }
  function allowed(kind) { return !NO[kind] && !!{ shape: 1, clip: 1, session: 1, training: 1, position: 1, stretch: 1, guide: 1, resource: 1, formation: 1 }[kind]; }
  function waAllowed(kind, path) {
    if (!WA_OK[kind]) return false;
    return path.charAt(0) === '/' && path.indexOf('..') < 0;
  }
  function queueLoad() {
    try { var a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function queueSave(a) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, 12))); } catch (e) {} }
  function clearQueue() { try { localStorage.removeItem(KEY); } catch (e) {} }
  function coachMode() {
    var path = (typeof location !== 'undefined' && location.pathname) || '';
    if (path.indexOf('/coach/') >= 0) return true;
    if (/\/(family|parents)\.html/.test(path)) return false;
    try {
      var back = document.getElementById('back');
      var href = back ? (back.getAttribute('href') || '') : '';
      if (href.indexOf('coach') >= 0) return true;
      if (href.indexOf('family') >= 0 || href.indexOf('parents') >= 0) return false;
      if (localStorage.getItem('fam.code') && !localStorage.getItem('tl.code')) return false;
      return !!localStorage.getItem('tl.code');
    } catch (e) { return false; }
  }
  function roster() {
    if (typeof w.tlShareRoster === 'function') return w.tlShareRoster() || [];
    return state && state.roster ? state.roster : [];
  }
  function call(action, body) {
    if (typeof w.tlCall === 'function') return w.tlCall(action, body);
    if (typeof w.call === 'function' && w.call !== call) return w.call(action, body);
    var code = '';
    try { code = localStorage.getItem('tl.code') || localStorage.getItem('fam.code') || ''; } catch (e) {}
    var api = w.TL_API || 'https://script.google.com/macros/s/AKfycby3YUAg5QncW-hb2tKDapu108F2RDlgEhFmluVsXPctKdlLP33ADPbVcJ8kEJSLmoij/exec';
    return fetch(api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ code: code, action: action }, body || {})) }).then(function (r) { return r.json(); }).then(function (j) { if (!j.ok) throw new Error(j.error || 'Failed'); return j.data; });
  }
  function close() {
    var el = document.getElementById('tl-inshare');
    if (el) el.remove();
    state = null;
  }
  function note(t) {
    var n = document.getElementById('tl-inshare-note');
    if (n) n.textContent = t || '';
  }
  function ensureCss() {
    if (document.getElementById('tl-inshare-css')) return;
    var s = document.createElement('style');
    s.id = 'tl-inshare-css';
    s.textContent = '#tl-inshare{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center}#tl-inshare .tl-inshare-in{background:#0E1D45;color:#F4F6FC;width:100%;max-width:520px;max-height:88vh;overflow:auto;border-radius:16px 16px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom));border-top:4px solid #FFB81C}#tl-inshare h2{margin:0 0 8px}#tl-inshare .btn{display:block;width:100%;background:#12283f;color:#F4F6FC;border:1px solid #27407F;border-radius:12px;font:700 16px/1.2 system-ui,sans-serif}#tl-inshare .btn.pri{background:#FFB81C;color:#1a1200;border-color:#FFB81C}#tl-inshare .tl-inshare-person[aria-pressed="true"]{border-color:#FFB81C;color:#FFB81C}';
    document.head.appendChild(s);
  }
  function paint() {
    ensureCss();
    var old = document.getElementById('tl-inshare');
    if (old) old.remove();
    if (!state) return;
    var d = document.createElement('div');
    d.id = 'tl-inshare';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-modal', 'true');
    d.setAttribute('aria-labelledby', 'tl-inshare-h');
    var body = '';
    if (!allowed(state.kind) || state.coachOnly) {
      body = '<p>This stays with the coaches. It is not sent to players or parents.</p><button type="button" class="btn block" id="tl-inshare-cancel" style="min-height:48px">Close</button>';
    } else if (state.step === 'review') {
      var who = state.own ? 'Your own player, and their parent, on their own codes.' : (state.all ? 'The whole squad. Each player and their parent see it on their own code.' : (state.picked.length + ' player' + (state.picked.length === 1 ? '' : 's') + '. Each one and their parent see it on their own code.'));
      body = '<p class="small">Review, then send. Nothing has been sent yet.</p><p><b>' + esc(state.title) + '</b></p><p class="small">' + esc(who) + '</p><button type="button" class="btn pri block" id="tl-inshare-send" style="min-height:48px">Send in Touchline</button><button type="button" class="btn block" id="tl-inshare-back" style="min-height:48px;margin-top:8px">Back</button>';
    } else if (state.own) {
      body = '<p class="small">This goes to your own player inside Touchline. It does not open WhatsApp and it does not use the phone share sheet.</p><button type="button" class="btn pri block" id="tl-inshare-review" style="min-height:48px">Review</button>';
    } else {
      var people = roster();
      body = '<p class="small">Choose who should see this in Touchline. A player and their parent both open it with their own code. Nothing is sent until you review and press Send.</p>';
      body += '<label class="small" style="display:flex;gap:8px;align-items:center;min-height:44px"><input type="checkbox" id="tl-inshare-all"> Whole squad</label>';
      body += '<div id="tl-inshare-people">' + people.map(function (p) {
        return '<button type="button" class="btn block tl-inshare-person" data-pid="' + esc(p.id) + '" aria-pressed="false" style="min-height:48px;margin-top:8px;text-align:left">' + esc((p.name || 'Player') + (p.num ? ' · ' + p.num : '')) + '</button>';
      }).join('') + '</div>';
      body += '<button type="button" class="btn pri block" id="tl-inshare-review" style="min-height:48px;margin-top:8px">Review</button>';
    }
    if (state.wa && allowed(state.kind) && !state.coachOnly) {
      body += '<button type="button" class="btn block" id="tl-inshare-wa" style="min-height:48px;margin-top:8px">WhatsApp instead</button><p class="small">WhatsApp is separate. It is not the send button.</p>';
    }
    body += '<p class="small" id="tl-inshare-note" role="status"></p><button type="button" class="btn block" id="tl-inshare-cancel" style="min-height:48px;margin-top:8px">Cancel</button>';
    d.innerHTML = '<div class="tl-inshare-in"><h2 id="tl-inshare-h">Share in Touchline</h2>' + body + '</div>';
    document.body.appendChild(d);
    var cancel = document.getElementById('tl-inshare-cancel');
    if (cancel) cancel.onclick = function () { close(); };
    d.addEventListener('click', function (e) {
      if (e.target === d) close();
    });
    var review = document.getElementById('tl-inshare-review');
    if (review) review.onclick = function () {
      if (!state.own) {
        state.all = !!(document.getElementById('tl-inshare-all') && document.getElementById('tl-inshare-all').checked);
        state.picked = [];
        var nodes = d.querySelectorAll('.tl-inshare-person[aria-pressed="true"]');
        for (var i = 0; i < nodes.length; i++) state.picked.push(nodes[i].getAttribute('data-pid'));
        if (!state.all && !state.picked.length) { note('Pick a player, or the whole squad. Nothing has been sent.'); return; }
      }
      state.step = 'review';
      paint();
    };
    var back = document.getElementById('tl-inshare-back');
    if (back) back.onclick = function () { state.step = 'pick'; paint(); };
    var send = document.getElementById('tl-inshare-send');
    if (send) send.onclick = doSend;
    var peopleBtns = d.querySelectorAll('.tl-inshare-person');
    for (var j = 0; j < peopleBtns.length; j++) {
      peopleBtns[j].onclick = function () {
        var on = this.getAttribute('aria-pressed') === 'true';
        this.setAttribute('aria-pressed', on ? 'false' : 'true');
      };
    }
    var wa = document.getElementById('tl-inshare-wa');
    if (wa) wa.onclick = function () {
      var path = state.path.indexOf('/') === 0 ? (location.origin + state.path) : state.path;
      w.open('https://wa.me/?text=' + encodeURIComponent(state.title + '\n' + path), '_blank', 'noopener');
    };
  }
  function doSend() {
    if (!state) return;
    var body = { kind: state.kind, ref: state.ref, title: state.title, path: state.path };
    var action = 'f.share.send';
    if (!state.own) {
      action = 'share.send';
      body.all = !!state.all;
      body.pids = state.all ? [] : state.picked.slice();
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      var q = queueLoad();
      q.push({ kind: body.kind, ref: body.ref, title: body.title, path: body.path, pids: body.pids || [], all: !!body.all, own: !!state.own, at: Date.now() });
      queueSave(q);
      note('Saved on this phone. Not sent yet. It will send when you are back online.');
      state.pending = true;
      return;
    }
    call(action, body).then(function (res) {
      note('Sent in Touchline' + (res && res.n ? ' to ' + res.n : '') + '. They see it when they open the app. Nothing was sent on WhatsApp.');
      var c = document.getElementById('tl-inshare-send');
      if (c) c.disabled = true;
    }).catch(function (e) {
      var msg = (e && e.message) || 'Not sent.';
      if (/unknown|not found/i.test(msg)) msg = 'Sharing is not on the server yet. Nothing was stored.';
      note(msg);
    });
  }
  function open(opts) {
    opts = opts || {};
    var kind = kindOf(opts);
    var path = pathOf(opts);
    state = {
      kind: kind,
      ref: String(opts.ref || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40),
      title: String(opts.title || 'Touchline').slice(0, 80),
      path: path,
      coachOnly: !!opts.coachOnly,
      own: !coachMode() || !!opts.own,
      wa: waAllowed(kind, path),
      step: 'pick',
      all: false,
      picked: [],
      roster: opts.roster || null
    };
    if (state.own) paint();
    else if (roster().length) paint();
    else {
      paint();
      call('share.roster', {}).then(function (d) {
        if (!state) return;
        state.roster = (d && d.length) ? d : (d && d.rows) || [];
        if (!Array.isArray(state.roster)) state.roster = [];
        paint();
      }).catch(function () {
        note('The player list is not available. Nothing has been sent.');
      });
    }
  }
  function inboxHtml(rows) {
    if (!rows || !rows.length) return '';
    return '<div class="card" id="tl-share-inbox"><h2>Shared with you</h2><p class="small">Sent in Touchline to your own player. Open it here. It is not a phone notification.</p>' + rows.slice(0, 8).map(function (r) {
      var link = r.path && String(r.path).charAt(0) === '/' ? '<a class="btn block" style="min-height:48px;margin-top:8px" href="' + esc(r.path) + '">Open</a>' : '';
      return '<p style="margin:10px 0 0"><b>' + esc(r.title || 'Item') + '</b></p>' + link;
    }).join('') + '</div>';
  }
  var loaded = false;
  function loadInbox() {
    if (loaded || !w.D || (D.role !== 'parent' && D.role !== 'player') || typeof w.call !== 'function') return;
    loaded = true;
    w.call('f.share.list', {}).then(function (d) {
      w.__tlShareRows = (d && d.rows) || [];
      if (typeof w.r === 'function') w.r();
    }).catch(function () { w.__tlShareRows = []; });
  }
  function inboxHtmlNow() { return inboxHtml(w.__tlShareRows || []); }
  if (typeof document !== 'undefined') {
    setInterval(loadInbox, 800);
  }
  w.TLInShare = { open: open, close: close, clearQueue: clearQueue, allowed: allowed, waAllowed: waAllowed, kindOf: kindOf, pathOf: pathOf, inboxHtml: inboxHtmlNow };
  w.tlShareInboxHtml = inboxHtmlNow;
})(window);
