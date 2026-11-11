/* r106. Shared headings for matchday and resources.
   The cards underneath are unchanged: lifts, kit, directions, clips, share. */
function tlPageBand(id, title, lead) {
  return '<section class="tl-simple" id="' + id + '"><h2>' + title + '</h2><p class="small">' + lead + '</p></section>';
}
function tlWrapGames(inner) {
  var player = window.D && D.role === 'player';
  return tlPageBand('tl-matchday', 'Match days', 'Your next game is first in the list below. Each game shows the kit, directions, lifts and a Share button. If something goes wrong on the day, use Emergency on Home.') + (window.tlSpotifyCard ? tlSpotifyCard() : '') + (window.tlAlarmCard ? tlAlarmCard() : '') + inner;
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
