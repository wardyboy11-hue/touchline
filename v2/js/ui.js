/* Touchline Pro — icons, overlays and shared UI fragments. */
(function () {
  'use strict';
  var TP = window.TP;
  var esc = TP.esc;

  var P = {
    today: '<path d="M4 9.5 12 3l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="m12 7 4 3-1.5 4.5h-5L8 10z"/><path d="M12 3v4M4.6 9.6 8 10M19.4 9.6 16 10M7 20l2.5-5.5M17 20l-2.5-5.5"/>',
    sessions: '<path d="M8 4h8a2 2 0 0 1 2 2v14l-6-4-6 4V6a2 2 0 0 1 2-2z"/><path d="M9.5 9h5"/>',
    library: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 19.5V5.5"/><path d="M9 8h7M9 12h5"/>',
    squad: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.6a3.2 3.2 0 0 1 0 6.3"/><path d="M17.4 14.5A5.5 5.5 0 0 1 20.5 20"/>',
    message: '<path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6a8 8 0 0 1 8-8h2a8 8 0 0 1 8 3z"/><path d="M9 12h6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    back: '<path d="m14 6-6 6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    play: '<path d="M8 5.5v13l11-6.5z"/>',
    pause: '<path d="M9 5v14M15 5v14"/>',
    check: '<path d="m5 13 4.5 4.5L19 7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/>',
    pin: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    share: '<path d="M12 16V4"/><path d="m8 8 4-4 4 4"/><path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15"/>',
    file: '<path d="M6 3h7l5 5v13H6z"/><path d="M13 3v5h5"/>',
    video: '<rect x="3" y="6" width="12" height="12" rx="2"/><path d="m15 11 6-3.5v9L15 13z"/>',
    link: '<path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 6"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    whistle: '<circle cx="9" cy="15" r="5"/><path d="M13.5 12.5 21 6l-1.5 5.5z"/><path d="M9 13v2"/>',
    users: '<circle cx="12" cy="8" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    flag: '<path d="M6 21V4"/><path d="M6 5h11l-2.5 4L17 13H6z"/>',
    sparkle: '<path d="M12 4l1.8 5.2L19 11l-5.2 1.8L12 18l-1.8-5.2L5 11l5.2-1.8z"/>',
    menu: '<rect x="4" y="4" width="7" height="7" rx="1.8"/><rect x="13" y="4" width="7" height="7" rx="1.8"/><rect x="4" y="13" width="7" height="7" rx="1.8"/><rect x="13" y="13" width="7" height="7" rx="1.8"/>',
    star: '<path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.8l5.9-.9z"/>'
  };

  TP.ui = {};

  TP.ui.icon = function (name, attrs) {
    var d = P[name] || P.info;
    return '<svg viewBox="0 0 24 24" aria-hidden="true" ' + (attrs || '') + '>' + d + '</svg>';
  };

  TP.ui.toast = function (msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(TP.ui._tt);
    TP.ui._tt = setTimeout(function () { t.classList.remove('on'); }, 2400);
  };

  /* ---------- sheet ---------- */
  var lastFocus = null;
  TP.ui.sheet = function (title, html, onMount) {
    var sheet = document.getElementById('sheet');
    var scrim = document.getElementById('scrim');
    lastFocus = document.activeElement;
    document.getElementById('sheetTitle').textContent = title;
    document.getElementById('sheetBody').innerHTML = html;
    sheet.hidden = false;
    scrim.hidden = false;
    document.body.style.overflow = 'hidden';
    var panel = document.getElementById('sheetPanel');
    panel.scrollTop = 0;
    document.getElementById('sheetBody').scrollTop = 0;
    var close = sheet.querySelector('[data-act="closeSheet"]');
    if (close) close.focus({ preventScroll: true });
    if (onMount) onMount(document.getElementById('sheetBody'));
  };

  TP.ui.closeSheet = function () {
    var sheet = document.getElementById('sheet');
    if (sheet.hidden) return;
    sheet.hidden = true;
    document.getElementById('scrim').hidden = true;
    document.getElementById('sheetBody').innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };

  TP.ui.sheetOpen = function () {
    return !document.getElementById('sheet').hidden;
  };

  /* ---------- pitch ---------- */
  TP.ui.pitch = function (tokens) {
    var svg = '<svg viewBox="0 0 100 133" preserveAspectRatio="none" aria-hidden="true">' +
      '<rect x="1" y="1" width="98" height="131"/>' +
      '<line x1="1" y1="66.5" x2="99" y2="66.5"/>' +
      '<circle cx="50" cy="66.5" r="13"/>' +
      '<circle cx="50" cy="66.5" r="1.4"/>' +
      '<rect x="22" y="1" width="56" height="17"/>' +
      '<rect x="36" y="1" width="28" height="7"/>' +
      '<rect x="22" y="115" width="56" height="17"/>' +
      '<rect x="36" y="125" width="28" height="7"/>' +
      '</svg>';
    var body = tokens.map(function (t) {
      var cls = 'token' + (t.cls ? ' ' + t.cls : '');
      var inner = t.empty
        ? '<span class="shirt">' + esc(t.num || t.label || '') + '</span>'
        : '<span class="shirt">' + esc(t.num || '') + '</span>' +
          (t.name ? '<span class="nm">' + esc(t.name) + '</span>' : '') +
          (t.mins ? '<span class="mins">' + esc(t.mins) + '</span>' : '');
      var tag = t.act ? 'button' : 'div';
      return '<' + tag + ' class="' + cls + '" style="left:' + t.x + '%;top:' + t.y + '%"' +
        (t.act ? ' data-act="' + t.act + '" data-k="' + esc(t.k || '') + '" data-id="' + esc(t.id || '') + '" aria-label="' + esc(t.name || t.label || '') + '"' : '') +
        '>' + inner + '</' + tag + '>';
    }).join('');
    return '<div class="pitchwrap"><div class="pitch">' + svg + body + '</div></div>';
  };

  /* ---------- small pieces ---------- */
  TP.ui.meter = function (pct, cls) {
    var p = Math.max(0, Math.min(100, Math.round(pct || 0)));
    return '<div class="meter"><i class="' + (cls || '') + '" style="width:' + p + '%"></i></div>';
  };

  TP.ui.empty = function (title, note) {
    return '<div class="empty"><b>' + esc(title) + '</b>' + esc(note || '') + '</div>';
  };

  TP.ui.avatar = function (p, cls) {
    return '<span class="avatar ' + (cls || '') + '">' + esc(p ? p.num : '') + '</span>';
  };

  TP.ui.kindIcon = function (ty) {
    var map = { pdf: 'file', video: 'video', animation: 'play', drill: 'target', web: 'link', x: 'link', masterclass: 'video' };
    return TP.ui.icon(map[ty] || 'file');
  };

  /* ---------- clipboard / share ---------- */
  TP.ui.copy = function (text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(fallback);
    }
    fallback();
    return Promise.resolve();
  };

  TP.ui.share = function (text, title) {
    if (navigator.share) {
      return navigator.share({ text: text, title: title || 'Touchline' }).catch(function () {});
    }
    return TP.ui.copy(text).then(function () { TP.ui.toast('Copied to the clipboard'); });
  };
})();
