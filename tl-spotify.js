/* Pre-match playlist. Public Spotify links only.
   No invite token, no si tracking, no autoplay, no load until a tap. */
var TL_SPOTIFY_OPEN = 'https://open.spotify.com/playlist/37i9dQZF1Fx1qy2m6cIsqW';
var TL_SPOTIFY_EMBED = 'https://open.spotify.com/embed/playlist/37i9dQZF1Fx1qy2m6cIsqW';

function tlSpotifyBare(url) {
  return String(url || '').split('?')[0].split('#')[0];
}
function tlSpotifyCard() {
  var offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  return '<section class="tl-simple" id="tl-spotify" aria-labelledby="tl-spotify-title"><h2 id="tl-spotify-title">Pre-match music</h2><p class="small">The coaches\' playlist. Open in Spotify opens the Spotify app. Play it here plays it on this page. We do not see what you play.</p><a class="btn block" id="tl-spotify-open" href="' + TL_SPOTIFY_OPEN + '" target="_blank" rel="noopener noreferrer">Open in Spotify</a><button type="button" class="btn block" id="tl-spotify-load" style="margin-top:8px">Play it here</button><p class="small" id="tl-spotify-note" role="status">' + (offline ? 'You are offline. The player is unavailable until you have a connection. Open in Spotify stays here.' : '') + '</p><div id="tl-spotify-slot"></div></section>';
}
function tlSpotifyLoad() {
  var note = document.getElementById('tl-spotify-note');
  var slot = document.getElementById('tl-spotify-slot');
  if (!slot) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    if (note) note.textContent = 'The player needs a connection, so it is unavailable. Open in Spotify is still there. Touchline does not download the songs or sign you in.';
    return;
  }
  if (slot.querySelector('iframe')) return;
  var frame = document.createElement('iframe');
  frame.title = 'Spotify playlist';
  frame.src = TL_SPOTIFY_EMBED;
  frame.setAttribute('width', '100%');
  frame.setAttribute('height', '352');
  frame.style.cssText = 'border:0;border-radius:12px;width:100%;max-width:100%;height:352px';
  frame.loading = 'lazy';
  frame.setAttribute('allow', 'encrypted-media');
  slot.appendChild(frame);
  if (note) note.textContent = 'The player is loading from Spotify.';
}
if (typeof document !== 'undefined') {
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && t.id === 'tl-spotify-load') tlSpotifyLoad();
  });
}
