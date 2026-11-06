/* Touchline countdown and matchday screen (r90).
   Patterns from FotMob (kick off time + countdown), F1/MotoGP (home countdown),
   Premier League preview, Spond/TeamSnap (meet time and kit). Offline vanilla JS.
   Meet time is always 30 minutes before kick-off unless an override is set.
   Families never get a personal greet; shirt numbers only on late notices. */
(function (w) {
  var KEY = 'tl.md.shown.';
  var LATE_Q = 'tl.late.q';
  var LATE_ACTIVE = 'tl.late.active.';
  var buzzed = {};

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
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
  /* Meet time = kick-off minus meetBefore (default 30). Team week setting or m.meet / it.meet override wins. */
  function meetBeforeMins() {
    try {
      if (w.TLSched && w.TLSched.meetBefore != null) return Math.max(0, Math.min(90, +w.TLSched.meetBefore));
    } catch (e) { }
    return 30;
  }
  function meetBy(ko, override) {
    var o = String(override || '').trim();
    if (/^\d{1,2}:\d{2}$/.test(o)) return o.length === 4 ? '0' + o : o;
    var m = String(ko || '').match(/(\d{1,2}):(\d{2})/);
    if (!m) return '';
    var t = (+m[1]) * 60 + (+m[2]) - meetBeforeMins();
    if (t < 0) t += 1440;
    return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  }
  function meetChip(ko, override) {
    var m = meetBy(ko, override);
    if (!m) return '';
    return '<span class="tl-meet-chip" title="Meet time is kick-off minus the team meet setting (default 30 minutes)">Meet by ' + esc(m) + '</span>';
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
  /* Coach matchday greet only (first name). Families get a plain Match morning reminder. */
  function greet(opts) {
    opts = opts || {};
    var g = hourGreet();
    var n = (opts.who === 'Tim' || opts.who === 'Deano') ? opts.who : (opts.who || 'Coach');
    return g + ', ' + n;
  }
  function absLine(it) {
    var ko = it.ko || it.time || '';
    return niceDate(it.date) + (ko ? ', ' + ko : '');
  }
  function itemHtml(it) {
    if (!it) return '';
    var ko = it.ko || it.time || '20:00';
    var until = whenMs(it.date, ko);
    var left = fmtLeft(until - Date.now());
    var tag = it.kind === 'train' ? 'Training' : 'Match';
    var title = it.title || (it.kind === 'train' ? 'Training' : ((it.ha === 'A' ? 'at ' : 'v ') + (it.opp || 'opponent')));
    var sub = it.venue ? esc(it.venue) : '';
    var meet = meetChip(ko, it.meet);
    var open = '';
    if (it.href) open = '<a class="btn" href="' + esc(it.href) + '">Open</a>';
    else if (it.go) open = '<button class="btn" type="button" data-cd-go="' + esc(it.go) + '">Open</button>';
    else if (it.act) open = '<button class="btn" data-act="' + esc(it.act) + '"' + (it.id ? ' data-id="' + esc(it.id) + '"' : '') + '>Open</button>';
    var lateBtn = '';
    if (it.late) {
      lateBtn = '<button class="btn" type="button" data-cd-late="1" data-late-kind="' + esc(it.kind || 'game') + '" data-late-ref="' + esc(it.id || it.ref || '') + '" data-late-date="' + esc(it.date || '') + '" data-late-ko="' + esc(ko) + '">Running late</button>';
    }
    return '<div class="tl-cd-item" data-cd-kind="' + esc(it.kind || '') + '">' +
      '<div class="tl-cd-tag">' + esc(tag) + '</div>' +
      '<div class="tl-cd-title">' + esc(title) + '</div>' +
      '<div class="tl-cd-left mdbig" data-cd-until="' + until + '" aria-live="polite">' + esc(left) + '</div>' +
      '<div class="tl-cd-abs small muted">' + esc(absLine(it)) + '</div>' +
      (meet ? '<div class="tl-cd-meet">' + meet + '</div>' : '') +
      (sub ? '<div class="tl-cd-meta">' + sub + '</div>' : '') +
      ((open || lateBtn) ? '<div class="tl-cd-act row" style="flex-wrap:wrap;gap:8px">' + open + lateBtn + '</div>' : '') +
      '</div>';
  }
  /* Rail: at most one next game and one next training. */
  function rail(items) {
    items = (items || []).filter(Boolean);
    var game = null, train = null, out = [];
    items.forEach(function (it) {
      if (!it) return;
      if (it.kind === 'train' && !train) train = it;
      else if (it.kind !== 'train' && !game) game = it;
    });
    if (game) out.push(game);
    if (train) out.push(train);
    if (!out.length) return '';
    return '<div class="card tl-cd-rail" aria-label="Countdown to training and matches">' +
      '<div class="tl-cd-head"><b>Coming up</b><span class="small muted">Live countdown</span></div>' +
      '<div class="tl-cd-row">' + out.map(itemHtml).join('') + '</div></div>';
  }
  function kitKey(m) {
    if (!m) return 'H';
    if (m.kit === 'A' || m.kit === 'T' || m.kit === 'H') return m.kit;
    return m.ha === 'A' ? 'A' : 'H';
  }
  function kitText(m) {
    var k = kitKey(m), note = String((m && m.kitColours) || '').trim();
    if (k === 'A') return note ? ('Away kit: ' + note) : 'Away kit';
    if (k === 'T') return note ? ('Third kit: ' + note) : 'Third kit';
    return note ? ('Home kit: ' + note) : 'Home kit: dark blue and white stripes, black shorts';
  }
  function kitLine(m) {
    if (!m) return 'Bring kit, shin pads, boots and a water bottle.';
    return kitText(m) + '. Shin pads, boots and a water bottle.';
  }
  function lateLabel(num, mins) {
    var n = String(num || '').replace(/\D/g, '') || '?';
    var m = mins === '20+' || mins === 20 ? '20+' : String(mins || '');
    return 'No. ' + n + ' running late, about ' + m + ' mins';
  }
  function activeKey(date, ref) { return LATE_ACTIVE + (date || isoToday()) + ':' + (ref || 'x'); }
  function getActive(date, ref) {
    try { return JSON.parse(localStorage.getItem(activeKey(date, ref)) || 'null'); } catch (e) { return null; }
  }
  function setActive(date, ref, row) {
    try {
      if (!row) localStorage.removeItem(activeKey(date, ref));
      else localStorage.setItem(activeKey(date, ref), JSON.stringify(row));
    } catch (e) { }
  }
  function readQueue() {
    try { return JSON.parse(localStorage.getItem(LATE_Q) || '[]'); } catch (e) { return []; }
  }
  function writeQueue(q) {
    try { localStorage.setItem(LATE_Q, JSON.stringify(q || [])); } catch (e) { }
  }
  function enqueueLate(row) {
    var q = readQueue();
    q.push(row);
    writeQueue(q);
  }
  function matchdayHtml(m, opts) {
    opts = opts || {};
    if (!m) return '';
    var until = whenMs(m.date, m.ko);
    var left = fmtLeft(until - Date.now());
    var op = (m.ha === 'A' ? 'at ' : 'v ') + (m.opp || 'opponent');
    var meet = meetChip(m.ko, m.meet);
    var anim = opts.anim || '12_352_in_transition';
    var animHref = opts.animHref || ('coach/anim/' + anim + '.html?v=90');
    if (opts.coach) animHref = 'anim/' + anim + '.html?v=90&back=' + encodeURIComponent('/coach/');
    var isCoach = opts.role === 'coach' || opts.coach;
    var head = isCoach
      ? ('<p class="tl-md-greet">' + esc(greet(opts)) + '</p>')
      : ('<p class="tl-md-greet">Match morning</p><p class="small">Have a look at your player card before you set off. It has your job for today and anything we worked on in training.</p>');
    var cardBtn = isCoach ? '' : '<button class="btn pri" type="button" id="tl-md-card" data-cd-go="card">Open player card</button>';
    var animBtn = '<a class="btn' + (isCoach ? ' pri' : '') + '" data-ext="1" href="' + esc(animHref) + '">Position animation</a>';
    var lateBtn = '';
    if (!isCoach) {
      var act = getActive(m.date, m.id);
      if (act && !act.undone) {
        lateBtn = '<button class="btn" type="button" id="tl-md-late-undo" data-late-undo="1" data-late-ref="' + esc(m.id || '') + '" data-late-date="' + esc(m.date || '') + '">Undo late notice</button>';
      } else {
        lateBtn = '<button class="btn" type="button" id="tl-md-late" data-cd-late="1" data-late-kind="game" data-late-ref="' + esc(m.id || '') + '" data-late-date="' + esc(m.date || '') + '" data-late-ko="' + esc(m.ko || '') + '">Running late</button>';
      }
    }
    return '<div class="tl-md-screen" id="tl-md" role="dialog" aria-label="It is matchday">' +
      '<div class="tl-md-inner">' +
      '<span class="tag" style="background:#FFB81C;color:#1b1200">It\'s matchday</span>' +
      head +
      '<h2 style="margin:8px 0 4px">' + esc(op) + '</h2>' +
      '<div class="mdbig" data-cd-until="' + until + '" aria-live="polite">' + esc(left) + '</div>' +
      '<p class="tl-cd-abs small muted">' + esc(niceDate(m.date) + (m.ko ? ', ' + m.ko : '')) + '</p>' +
      (meet ? '<div class="tl-cd-meet" style="margin:8px 0">' + meet + '</div>' : '') +
      '<p>Kick off <b>' + esc(m.ko || 'TBC') + '</b></p>' +
      (m.venue ? '<p class="small">' + esc(m.venue) + '</p>' : '') +
      '<p class="small"><b>Kit:</b> ' + esc(kitLine(m)) + '</p>' +
      '<div class="row" style="margin-top:12px;flex-wrap:wrap;gap:8px">' +
      cardBtn + lateBtn + animBtn +
      '<button class="btn" type="button" id="tl-md-go">Let\'s go</button>' +
      '</div>' +
      '<p class="small muted" style="margin-top:10px">Shows once on match morning. Tap Let\'s go to open Today.</p>' +
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
  function pinToday(m) {
    try {
      if (typeof A === 'object' && A && typeof A.go === 'function') A.go('today');
      else if (typeof goTab === 'function') goTab('home');
    } catch (e) { }
    setTimeout(function () {
      var el = document.getElementById('tl-md-pin') ||
        document.querySelector('.card.kcard.md') ||
        document.querySelector('.card.today.md') ||
        document.querySelector('.tl-cd-rail');
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try { if (el) el.classList.add('tl-md-pinned'); } catch (e2) { }
    }, 280);
  }

  function refreshMatchdayLateBtn(m) {
    var root = document.getElementById('tl-md');
    if (!root) return;
    var ref = (m && (m.id || m.ref)) || '';
    var date = (m && m.date) || isoToday();
    var ko = (m && m.ko) || '';
    var act = getActive(date, ref);
    var html;
    if (act && !act.undone) {
      html = '<button class="btn" type="button" id="tl-md-late-undo" data-late-undo="1" data-late-ref="' + esc(ref) + '" data-late-date="' + esc(date) + '">Undo late notice</button>';
    } else {
      html = '<button class="btn" type="button" id="tl-md-late" data-cd-late="1" data-late-kind="game" data-late-ref="' + esc(ref) + '" data-late-date="' + esc(date) + '" data-late-ko="' + esc(ko) + '">Running late</button>';
    }
    var cur = root.querySelector('#tl-md-late, #tl-md-late-undo, [data-cd-late], [data-late-undo]');
    if (cur) {
      var wrap = document.createElement('div');
      wrap.innerHTML = html;
      cur.parentNode.replaceChild(wrap.firstChild, cur);
    }
  }
  function closeLateSheet() {
    var el = document.getElementById('tl-late-sheet');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }
  function showLatePicker(opts) {
    opts = opts || {};
    closeLateSheet();
    var num = String(opts.num || '').replace(/\D/g, '');
    if (!num) {
      try { alert('Add a shirt number on the player card first.'); } catch (e) { }
      return;
    }
    var wrap = document.createElement('div');
    wrap.id = 'tl-late-sheet';
    wrap.className = 'tl-late-sheet';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', 'How late are you');
    wrap.innerHTML = '<div class="tl-late-inner">' +
      '<h3 style="margin-top:0">Running late</h3>' +
      '<p class="small muted">Coaches only see shirt numbers. Other families do not see this. About how late?</p>' +
      '<div class="row" style="flex-wrap:wrap;gap:8px">' +
      [5, 10, 15, '20+'].map(function (m) {
        return '<button class="btn pri" type="button" data-late-mins="' + m + '">About ' + m + ' mins</button>';
      }).join('') +
      '</div>' +
      '<button class="btn block" type="button" id="tl-late-cancel" style="margin-top:12px">Cancel</button>' +
      '</div>';
    document.body.appendChild(wrap);
    wrap.querySelector('#tl-late-cancel').onclick = closeLateSheet;
    wrap.addEventListener('click', function (e) {
      if (e.target === wrap) closeLateSheet();
    });
    wrap.querySelectorAll('[data-late-mins]').forEach(function (b) {
      b.onclick = function () {
        var mins = b.getAttribute('data-late-mins');
        closeLateSheet();
        submitLate({
          num: num,
          mins: mins,
          kind: opts.kind || 'game',
          ref: opts.ref || '',
          date: opts.date || isoToday(),
          ko: opts.ko || '',
          send: opts.send
        });
      };
    });
  }
  function submitLate(opts) {
    opts = opts || {};
    var row = {
      id: 'L' + Date.now().toString(36),
      num: String(opts.num || '').replace(/\D/g, ''),
      mins: opts.mins,
      kind: opts.kind || 'game',
      ref: opts.ref || '',
      date: opts.date || isoToday(),
      ko: opts.ko || '',
      at: Date.now(),
      undone: false,
      op: 'set'
    };
    setActive(row.date, row.ref, row);
    enqueueLate(row);
    if (typeof opts.send === 'function') {
      try { opts.send(row); } catch (e) { }
    } else {
      flushLate();
    }
    try { refreshMatchdayLateBtn({ id: row.ref, date: row.date, ko: row.ko }); } catch (e3) { }
    try {
      var msg = lateLabel(row.num, row.mins);
      if (w.toast) toast(msg + ' (coaches only)');
      else if (typeof alertMsg !== 'undefined') { /* family page may re-render */ }
    } catch (e2) { }
    try {
      if (typeof r === 'function') r();
      else if (typeof render === 'function') render(true);
    } catch (e4) { }
    return row;
  }
  function undoLate(opts) {
    opts = opts || {};
    var cur = getActive(opts.date, opts.ref);
    if (!cur) return null;
    var row = {
      id: cur.id || ('L' + Date.now().toString(36)),
      num: cur.num,
      mins: cur.mins,
      kind: cur.kind || 'game',
      ref: opts.ref || cur.ref || '',
      date: opts.date || cur.date || isoToday(),
      at: Date.now(),
      undone: true,
      op: 'undo'
    };
    setActive(row.date, row.ref, null);
    enqueueLate(row);
    if (typeof opts.send === 'function') {
      try { opts.send(row); } catch (e) { }
    } else {
      flushLate();
    }
    try { refreshMatchdayLateBtn({ id: row.ref, date: row.date, ko: opts.ko || '' }); } catch (e3) { }
    return row;
  }
  function flushLate(callFn) {
    var q = readQueue();
    if (!q.length) return Promise.resolve();
    if (typeof callFn !== 'function') {
      if (typeof w.tlLateSend === 'function') callFn = w.tlLateSend;
      else if (typeof call === 'function') {
        callFn = function (row) {
          return call(row.op === 'undo' ? 'f.late.undo' : 'f.late', {
            id: row.id,
            num: row.num,
            mins: row.mins,
            kind: row.kind,
            ref: row.ref,
            date: row.date
          });
        };
      } else {
        return Promise.resolve();
      }
    }
    if (navigator.onLine === false) return Promise.resolve();
    var left = [];
    var chain = Promise.resolve();
    q.forEach(function (row) {
      chain = chain.then(function () {
        return Promise.resolve(callFn(row)).then(function () { /* ok */ }).catch(function () {
          left.push(row);
        });
      });
    });
    return chain.then(function () { writeQueue(left); });
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
    if (btn) btn.onclick = function () {
      dismiss();
      if (opts.onGo) {
        try { opts.onGo(); } catch (e) { }
      } else {
        pinToday(m);
      }
      setTimeout(function () { pinToday(m); }, 50);
    };
    var card = document.getElementById('tl-md-card');
    if (card) card.onclick = function () {
      dismiss();
      if (opts.onCard) { try { opts.onCard(); } catch (e) { } }
      else if (typeof goTab === 'function') {
        try { goTab('home'); } catch (e) { }
        setTimeout(function () {
          var el2 = document.getElementById('self') || document.querySelector('.card.today') || document.getElementById('child');
          if (el2 && el2.scrollIntoView) el2.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
    };
    tick();
    return true;
  }
  function prefersReducedMotion() {
    try { return !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  }
  function tick() {
    var now = Date.now();
    var reduce = prefersReducedMotion();
    document.querySelectorAll('[data-cd-until]').forEach(function (n) {
      var t = +n.getAttribute('data-cd-until') || 0;
      var left = t - now;
      n.textContent = fmtLeft(left);
      var urgent = left > 0 && left <= 3600000;
      if (urgent && !reduce) n.classList.add('tl-cd-pulse');
      else n.classList.remove('tl-cd-pulse');
      var id = n.getAttribute('data-cd-until');
      if (urgent && !buzzed[id] && !reduce && w.navigator && typeof w.navigator.vibrate === 'function') {
        var act = w.navigator.userActivation;
        if (act && act.isActive === false) return;
        buzzed[id] = 1;
        try { w.navigator.vibrate(30); } catch (e) { }
      }
    });
  }
  if (!w.__tlcdTick) {
    w.__tlcdTick = setInterval(tick, 15000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') { tick(); flushLate(); }
    });
    w.addEventListener('online', function () { flushLate(); });
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest && e.target.closest('[data-cd-go]');
      if (b) {
        var go = b.getAttribute('data-cd-go');
        if (go === 'games' && typeof goTab === 'function') goTab('game');
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
        return;
      }
      var late = e.target && e.target.closest && e.target.closest('[data-cd-late]');
      if (late) {
        e.preventDefault();
        var num = '';
        if (typeof w.tlLateNum === 'function') {
          try { num = w.tlLateNum() || ''; } catch (err) { }
        }
        showLatePicker({
          num: num,
          kind: late.getAttribute('data-late-kind') || 'game',
          ref: late.getAttribute('data-late-ref') || '',
          date: late.getAttribute('data-late-date') || isoToday(),
          ko: late.getAttribute('data-late-ko') || '',
          send: typeof w.tlLateSend === 'function' ? function (row) { return w.tlLateSend(row); } : null
        });
        return;
      }
      var und = e.target && e.target.closest && e.target.closest('[data-late-undo]');
      if (und) {
        e.preventDefault();
        undoLate({
          ref: und.getAttribute('data-late-ref') || '',
          date: und.getAttribute('data-late-date') || isoToday(),
          send: typeof w.tlLateSend === 'function' ? function (row) { return w.tlLateSend(row); } : null
        });
        try {
          if (typeof r === 'function') r();
          else if (typeof render === 'function') render(true);
        } catch (err2) { }
      }
    });
  }
  w.TLCD = {
    isoToday: isoToday,
    niceDate: niceDate,
    meetBy: meetBy,
    meetChip: meetChip,
    whenMs: whenMs,
    fmtLeft: fmtLeft,
    greet: greet,
    rail: rail,
    kitLine: kitLine,
    kitText: kitText,
    kitKey: kitKey,
    matchdayHtml: matchdayHtml,
    showMatchday: showMatchday,
    dismiss: dismiss,
    pinToday: pinToday,
    tick: tick,
    alreadyShown: alreadyShown,
    markShown: markShown,
    lateLabel: lateLabel,
    showLatePicker: showLatePicker,
    submitLate: submitLate,
    undoLate: undoLate,
    flushLate: flushLate,
    getActive: getActive,
    setActive: setActive,
    readQueue: readQueue
  };
})(window);
