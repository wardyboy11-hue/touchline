/* Touchline Pro — role guides: what each position does, and the clips we teach it with. */
(function () {
  'use strict';
  var TP = window.TP;
  var esc = TP.esc;

  function docUrl(id) {
    return 'https://docs.google.com/document/d/' + id + '/edit';
  }

  function render() {
    var positions = TP.data.positions();
    var clips = positions.reduce(function (n, p) { return n + (p.clips || []).length; }, 0);
    return '<div class="page-head"><div><p class="eyebrow">Team</p><h1>Role guides</h1>' +
        '<p>' + positions.length + ' positions · ' + clips + ' clips. Tap a role to see the clips we use.</p></div></div>' +
      '<div class="posgrid">' + positions.map(function (p) {
        return '<button class="poscard" data-act="openRole" data-k="' + esc(p.k) + '">' +
          '<span class="posnum">' + esc(p.num) + '</span>' +
          '<span class="grow"><b>' + esc(p.name) + '</b>' +
            '<span>' + (p.clips || []).length + ' clip' + ((p.clips || []).length === 1 ? '' : 's') + '</span></span>' +
          TP.ui.icon('chevron', 'style="width:16px;height:16px;fill:none;stroke:var(--muted);stroke-width:2"') +
        '</button>';
      }).join('') + '</div>' +
      '<p class="footnote">Clips open the original source. Set one for a player from the library.</p>';
  }

  function open(k) {
    var p = TP.data.position(k);
    if (!p) return;
    var html = '<div class="row" style="border:0;padding:0;min-height:0;margin:4px 0 14px">' +
        '<span class="avatar amber">' + esc(p.num) + '</span>' +
        '<span class="grow"><span class="t">' + esc(p.name) + '</span>' +
        '<span class="s">' + (p.clips || []).length + ' clips for this role</span></span></div>' +
      (p.guide ? '<a class="btn block pri" href="' + esc(docUrl(p.guide)) + '" target="_blank" rel="noopener" style="margin-bottom:14px">' +
        TP.ui.icon('file') + 'Open the written role guide</a>' : '') +
      '<div class="list">' + (p.clips || []).map(function (c) {
        return '<a class="row" href="' + esc(c.u) + '" target="_blank" rel="noopener" style="text-decoration:none;align-items:flex-start">' +
          '<span class="avatar small">' + TP.ui.icon(c.ty === 'youtube' ? 'video' : 'link') + '</span>' +
          '<span class="grow"><span class="t" style="font-size:13.5px;font-weight:600">' + esc(c.t) + '</span>' +
            '<span class="s">' + esc(c.w || c.s || '') + '</span></span>' +
          '<span class="end">' + TP.ui.icon('external', 'style="width:16px;height:16px;fill:none;stroke:var(--muted);stroke-width:2"') + '</span>' +
        '</a>';
      }).join('') + '</div>';
    TP.ui.sheet(p.name, html);
  }

  TP.views = TP.views || {};
  TP.views.roles = { render: render, open: open };
})();
