/* r106. Shortcuts on Home. One file for the parent page and the family page. */
function tlQuickRow(){
  if(!window.D)return '';
  var player=D.role==='player';
  var third=player
    ?'<button type="button" class="tl-q" onclick="goTab(\'me\')">My page</button>'
    :'<button type="button" class="tl-q" onclick="goTab(\'contacts\')">Emergency</button>';
  return '<p class="tl-role">'+(player?'Player home':'Parent home')+'</p><nav class="tl-quick" aria-label="Shortcuts"><button type="button" class="tl-q" onclick="goTab(\'home\');var el=document.getElementById(\'att-top\');if(el)el.scrollIntoView({block:\'start\'})">Playing?</button><button type="button" class="tl-q" onclick="goTab(\'games\')">Fixtures</button>'+third+'<button type="button" class="tl-q" onclick="goTab(\'media\')">Clips</button></nav>';
}
