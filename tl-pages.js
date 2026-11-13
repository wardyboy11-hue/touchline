/* r106. Shared headings for matchday and resources.
   The cards underneath are unchanged: lifts, kit, directions, clips, share. */
/* r113: help text folds away. It is open the first time you see a page, then closed, so the real stuff is at the top.
   Opening or closing it is remembered for this visit only. */
function tlFold(id, title, inner, cls) {
  var k = 'tl.band.' + id, open = false;
  try {
    var ss = sessionStorage.getItem(k);
    if (ss) open = ss === '1';
    else if (!localStorage.getItem(k)) { open = true; localStorage.setItem(k, '1'); sessionStorage.setItem(k, '1'); }
  } catch (e) {}
  return '<details class="tl-fold' + (cls ? ' ' + cls : '') + '" data-fold="' + id + '"' + (open ? ' open' : '') + ' ontoggle="try{sessionStorage.setItem(\'' + k + '\',this.open?\'1\':\'0\')}catch(e){}"><summary>' + title + '</summary><div class="tl-fold-in">' + inner + '</div></details>';
}
(function () {
  if (typeof document === 'undefined' || document.getElementById('tl-fold-css')) return;
  var st = document.createElement('style'); st.id = 'tl-fold-css';
  st.textContent = '.tl-fold{border:1px solid #27407F;border-radius:12px;margin:0 0 12px;background:rgba(14,29,69,.6)}.tl-fold>summary{cursor:pointer;min-height:44px;display:flex;align-items:center;padding:0 14px;font-weight:700;font-size:15px;color:#A6B2D4;list-style:none}.tl-fold>summary::-webkit-details-marker{display:none}.tl-fold>summary::before{content:"i";display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;border:2px solid currentColor;font-size:13px;margin-right:10px;font-style:normal}.tl-fold[open]>summary{color:#F4F6FC}.tl-fold-in{padding:0 14px 12px}.tl-fold-in p{margin:6px 0}.tl-fold .tl-simple{margin:0;padding:0;border:0;background:none}body.ps .tl-fold{background:#fff;border-color:#021945}body.ps .tl-fold>summary{color:#021945}';
  (document.head || document.documentElement).appendChild(st);
})();
function tlPageBand(id, title, lead) {
  return tlFold(id, 'About ' + title.toLowerCase(), '<section class="tl-simple" id="' + id + '"><h2>' + title + '</h2><p class="small">' + lead + '</p></section>');
}
function tlWrapGames(inner) {
  var player = window.D && D.role === 'player';
  /* r113: fixtures first. Help, music and alarm sit under the list. */
  return inner + tlPageBand('tl-matchday', 'Match days', 'Your next game is first in the list. Each game shows the kit, directions, lifts and a Share button. If something goes wrong on the day, open More and tap Contacts and emergency.') + (window.tlSpotifyCard ? tlSpotifyCard() : '') + (window.tlAlarmCard ? tlAlarmCard() : '');
}
function tlWrapMedia(inner) {
  var player = window.D && D.role === 'player';
  return tlPageBand('tl-resources', 'Videos and pictures', 'Videos and pictures the coaches have checked. Each one has a Share button. Podcasts are under Listen.') + inner;
}
function tlCoachMatchday() {
  return tlPageBand('tl-coach-matchday', 'Coach matchday', 'Clock, substitutions and goals are on this screen. Alerts and the checklist are the button under this heading. Nothing is sent until you press it.') + (window.tlSpotifyCard ? tlSpotifyCard() : '') + (window.tlAlarmCard ? tlAlarmCard() : '');
}
function tlCoachResources() {
  return tlPageBand('tl-coach-resources', 'Coach resources', 'Search, then open, share or heart a practice. Favourites and this week stay on each one. Families do not see coach notes.');
}
