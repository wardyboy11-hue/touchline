/* r106. Shared headings for matchday and resources.
   The cards underneath are unchanged: lifts, kit, directions, clips, share. */
function tlPageBand(id, title, lead) {
  return '<section class="tl-simple" id="' + id + '"><h2>' + title + '</h2><p class="small">' + lead + '</p></section>';
}
function tlWrapGames(inner) {
  var player = window.D && D.role === 'player';
  return tlPageBand('tl-matchday', player ? 'Player matchday' : 'Parent matchday', 'Next games are first. Kit, directions, lifts and the share button stay on each game. Emergency is on the Home shortcut row.') + (window.tlSpotifyCard ? tlSpotifyCard() : '') + (window.tlAlarmCard ? tlAlarmCard() : '') + inner;
}
function tlWrapMedia(inner) {
  var player = window.D && D.role === 'player';
  return tlPageBand('tl-resources', player ? 'Player resources' : 'Parent resources', 'Clips and pictures the coaches have checked. Share sits on each clip. Podcasts are under Listen.') + inner;
}
function tlCoachMatchday() {
  return tlPageBand('tl-coach-matchday', 'Coach matchday', 'Clock, substitutions and goals are on this screen. Alerts and the checklist are the button under this heading. Nothing is sent until you press it.') + (window.tlSpotifyCard ? tlSpotifyCard() : '') + (window.tlAlarmCard ? tlAlarmCard() : '');
}
function tlCoachResources() {
  return tlPageBand('tl-coach-resources', 'Coach resources', 'Search, then open, share or heart a practice. Favourites and this week stay on each one. Families do not see coach notes.');
}
