/* Touchline countdown and matchday screen (r90).
   Patterns from FotMob (kick off time + countdown, not 0-0), F1/MotoGP (persistent
   home countdown), Premier League (preview to live to recap), Spond/TeamSnap (meet
   time and kit reminder). Offline, vanilla JS, no network. */
(function (w) {
  var KEY = 'tl.md.shown.';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function isoToday() {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch (e) {
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
  }
  function niceDate(s) {
    if (!s) return '';
    var p = String(s).split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function meetBy(ko) {
    var m = String(ko || '').match(/(\d{1,2}):(\d{2})/);
    if (!m) return '';
    var t = (+m[1]) * 60 + (+m[2]) - 30;
    if (t < 0) t += 1440;
    return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  }
  function whenMs(date, ko) {
    if (!date) return 0;
    var p = String(date).split('-');
    var hh = 10, mm = 30;
    var m = String(ko || '').match(/(\d{1,2}):(\d{2})/);
    if (m) { hh = +m[1]; mm = +m[2]; }
    return new Date(+p[0], +p[1] - 1, +p[2], hh, mm, 0, 0).getTime();
  }
  function fmtLeft(ms) {
    if (ms <= 0) return 'Now';
    var s = Math.floor(ms / 1000);
    var d = Math.floor(s / 86400); s -= d * 86400;
    var h = Math.floor(s / 3600); s -= h * 3600;
    var m = Math.floor(s / 60);
    if (d > 0) return d + 'd ' + h + 'h';
    if (h > 0) return h + 'h ' + String(m).padStart(2, '0') + 'm';
    return m + 'm';
  }
  function hourGreet() {
    var h;
    try { h = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: 'numeric', hour12: false }).format(new Date()); }
    catch (e) { h = new Date().getHours(); }
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  }
  /* Coach matchday greet only (first name). Families get a plain Match morning reminder, never a personal greet. */
  function greet(opts) {
    opts = opts || {};
    var g = hourGreet();
    var n = (opts.who === 'Tim' || opts.who === 'Deano') ? opts.who : (opts.who || 'Coach');
    return g + ', ' + n;
  }
  function itemHtml(it) {
    if (!it) return '';
    var until = whenMs(it.date, it.ko || it.time || '20:00');
    var left = fmtLeft(until - Date.now());
    var tag = it.kind === 'train' ? 'Training' : 'Match';
    var title = it.title || (it.kind === 'train' ? 'Training' : ((it.ha === 'A' ? 'at ' : 'v ') + (it.opp || 'opponent')));
    var when = niceDate(it.date) + (it.ko || it.time ? ', ' + (it.ko || it.time) : '');
    var sub = it.venue ? esc(it.venue) : '';
    var open = '';
    if (it.href) open = '<a class="btn" href="' + esc(it.href) + '">Open</a>';
    else if (it.go) open = '<button class="btn" type="button" data-cd-go="' + esc(it.go) + '">Open</button>';
    else if (it.act) open = '<button class="btn" data-act="' + esc(it.act) + '"' + (it.id ? ' data-id="' + esc(it.id) + '"' : '') + '>Open</button>';
    return '<div class="tl-cd-item" data-cd-kind="' + esc(it.kind || '') + '">' +
      '<div class="tl-cd-tag">' + esc(tag) + '</div>' +
      '<div class="tl-cd-title">' + esc(title) + '</div>' +
      '<div class="tl-cd-left mdbig" data-cd-until="' + until + '" aria-live="polite">' + esc(left) + '</div>' +
      '<div class="tl-cd-meta"><b>' + esc(when) + '</b>' + (sub ? '<br>' + sub : '') + '</div>' +
      (open ? '<div class="tl-cd-act">' + open + '</div>' : '') +
      '</div>';
  }
  function rail(items) {
    items = (items || []).filter(Boolean);
    if (!items.length) return '';
    return '<div class="card tl-cd-rail" aria-label="Countdown to training and matches">' +
      '<div class="tl-cd-head"><b>Coming up</b><span class="small muted">Live countdown</span></div>' +
      '<div class="tl-cd-row">' + items.map(itemHtml).join('') + '</div></div>';
  }
  function kitLine(m) {
    if (!m) return 'Bring kit, shin pads, boots and a water bottle.';
    if (m.ha === 'A') return 'Away kit. Shin pads, boots and a water bottle.';
    return 'Home kit. Shin pads, boots and a water bottle.';
  }
  function matchdayHtml(m, opts) {
    opts = opts || {};
    if (!m) return '';
    var until = whenMs(m.date, m.ko);
    var left = fmtLeft(until - Date.now());
    var op = (m.ha === 'A' ? 'at ' : 'v ') + (m.opp || 'opponent');
    var meet = meetBy(m.ko);
    var anim = opts.anim || '12_352_in_transition';
    var animHref = opts.animHref || ('coach/anim/' + anim + '.html?v=90');
    if (opts.coach) animHref = 'anim/' + anim + '.html?v=90&back=' + encodeURIComponent('/coach/');
    var isCoach = opts.role === 'coach' || opts.coach;
    var head = isCoach
      ? ('<p class="tl-md-greet">' + esc(greet(opts)) + '</p>')
      : ('<p class="tl-md-greet">Match morning</p><p class="small">Have a look at your player card before you set off. It has your job for today and anything we worked on in training.</p>');
    var cardBtn = isCoach ? '' : '<button class="btn pri" type="button" id="tl-md-card" data-cd-go="card">Open player card</button>';
    var animBtn = '<a class="btn' + (isCoach ? ' pri' : '') + '" data-ext="1" href="' + esc(animHref) + '">Position animation</a>';
    return '<div class="tl-md-screen" id="tl-md" role="dialog" aria-label="It is matchday">' +
      '<div class="tl-md-inner">' +
      '<span class="tag" style="background:#FFB81C;color:#1b1200">It\'s matchday</span>' +
      head +
      '<h2 style="margin:8px 0 4px">' + esc(op) + '</h2>' +
      '<div class="mdbig" data-cd-until="' + until + '" aria-live="polite">' + esc(left) + '</div>' +
      '<p>Kick off <b>' + esc(m.ko || 'TBC') + '</b>' + (meet ? '. Be there by <b>' + esc(meet) + '</b>.' : '') + '</p>' +
      (m.venue ? '<p class="small">' + esc(m.venue) + '</p>' : '') +
      '<p class="small"><b>Kit:</b> ' + esc(kitLine(m)) + '</p>' +
      '<div class="row" style="margin-top:12px;flex-wrap:wrap;gap:8px">' +
      cardBtn + animBtn +
      '<button class="btn" type="button" id="tl-md-go">Let\'s go</button>' +
      '</div>' +
      '<p class="small muted" style="margin-top:10px">Shows once on match morning. Tap Let\'s go to open the app.</p>' +
      '</div></div>';
  }
  function shownKey(date) { return KEY + (date || isoToday()); }
  function alreadyShown(date) {
    try { return localStorage.getItem(shownKey(date)) === '1'; } catch (e) { return false; }
  }
  function markShown(date) {
    try { localStorage.setItem(shownKey(date), '1'); } catch (e) { }
  }
  function dismiss() {
    var el = document.getElementById('tl-md');
    if (!el) return;
    el.classList.add('off');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
  }
  function showMatchday(m, opts) {
    opts = opts || {};
    if (!m || !m.date) return false;
    if (m.date !== isoToday()) return false;
    if (m.pp || m.done || m.status === 'done') return false;
    if (!opts.force && alreadyShown(m.date)) return false;
    if (document.getElementById('tl-md')) return false;
    var wrap = document.createElement('div');
    wrap.innerHTML = matchdayHtml(m, opts);
    var el = wrap.firstChild;
    document.body.appendChild(el);
    markShown(m.date);
    var btn = document.getElementById('tl-md-go');
    if (btn) btn.onclick = function () { dismiss(); if (opts.onGo) try { opts.onGo(); } catch (e) { } };
    var card = document.getElementById('tl-md-card');
    if (card) card.onclick = function () {
      dismiss();
      if (opts.onCard) { try { opts.onCard(); } catch (e) { } }
      else if (typeof goTab === 'function') {
        try { goTab('home'); } catch (e) { }
        setTimeout(function () {
          var el = document.getElementById('self') || document.querySelector('.card.today') || document.getElementById('child');
          if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
    };
    tick();
    return true;
  }
  function tick() {
    var now = Date.now();
    document.querySelectorAll('[data-cd-until]').forEach(function (n) {
      var t = +n.getAttribute('data-cd-until') || 0;
      n.textContent = fmtLeft(t - now);
    });
  }
  if (!w.__tlcdTick) {
    w.__tlcdTick = setInterval(tick, 30000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') tick(); });
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest && e.target.closest('[data-cd-go]');
      if (!b) return;
      var go = b.getAttribute('data-cd-go');
      if (go === 'games' && typeof goTab === 'function') goTab('games');
      else if (go === 'train' && typeof goTab === 'function') goTab('train');
      else if (go === 'match' && typeof A === 'object' && A && typeof A.go === 'function') A.go('match');
      else if (go === 'card') {
        dismiss();
        if (typeof goTab === 'function') {
          try { goTab('home'); } catch (err) { }
          setTimeout(function () {
            var el = document.getElementById('self') || document.querySelector('[data-act="self"]') || document.querySelector('.tl-player-card') || document.getElementById('child');
            if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 200);
        }
      }
    });
  }
  w.TLCD = {
    isoToday: isoToday,
    niceDate: niceDate,
    meetBy: meetBy,
    whenMs: whenMs,
    fmtLeft: fmtLeft,
    greet: greet,
    rail: rail,
    kitLine: kitLine,
    matchdayHtml: matchdayHtml,
    showMatchday: showMatchday,
    dismiss: dismiss,
    tick: tick,
    alreadyShown: alreadyShown,
    markShown: markShown
  };
})(window);
