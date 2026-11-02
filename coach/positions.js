/* Touchline release 74: coach Positions area (Library > Positions).
 * All 11 slots of the 3-5-2. Coaches' Voice items are shown here only (Tim's personal non-commercial licence),
 * never in player or family views. Release 81: "Send to player profile" posts the item into the chosen players' feed in the app.
 * No WhatsApp, share menu, email or direct messages.
 */
(function(){
'use strict';
var P={d:null,err:'',k:'',busy:false,cv:true};
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function rr(){var el=document.getElementById('posArea');if(el)el.outerHTML=area();}
function load(){if(P.d||P.busy)return;P.busy=true;fetch('positions.json',{cache:'no-cache'}).then(function(x){return x.json();}).then(function(j){P.d=j;P.busy=false;rr();}).catch(function(){P.busy=false;P.err='Could not load positions. Check your signal.';rr();});}
var SECN={clips:'Clips',drills:'Drills',reading:'Reading',free_pdf_links:'Downloads',drive_resources:'Drive folders'};
function itemRow(it,i){var drv=it.ty==='drive-folder'||it.ty==='drive-pdf';
 return '<div class="it" style="align-items:flex-start"><div class="grow"><b>'+E(it.t)+'</b>'+(it.cv?' <span class="tag" style="background:#7c2d12" title="Coaches\' Voice, Tim\'s personal licence. Coach use only.">CV coach only</span>':'')+'<div class="small muted">'+E(it.w)+(it.s?' &middot; '+E(it.s):'')+'</div>'+((it.tags||[]).length?'<div class="small" style="opacity:.8">'+E(it.tags.join(', '))+'</div>':'')+'</div>'
 +'<div style="display:flex;flex-direction:column;gap:6px">'+(drv&&it.id&&window.driveView?'<button class="btn" data-pact="drv" data-id="'+E(it.id)+'" data-f="'+(it.ty==='drive-folder'?1:0)+'" data-t="'+E(it.t)+'">Open</button>':'<a class="btn" href="'+E(it.u)+'" target="_blank" rel="noopener" data-title="'+E(it.t)+'">Open</a>')
 +(it.cv?'':'<button class="btn" data-pact="share" data-u="'+E(it.u)+'" data-t="'+E(it.t)+'">Send to player profile</button>')+'</div></div>';}
function area(){if(!P.d){load();return '<div id="posArea">'+(P.err?'<p class="muted">'+E(P.err)+'</p>':'<p class="muted">Loading positions</p>')+'</div>';}
 var L=P.d.slots,k=P.k&&L.some(function(s){return s.k===P.k;})?P.k:L[0].k,row=L.filter(function(s){return s.k===k;})[0];
 var h='<div id="posArea"><h2 style="margin:6px 0">Positions</h2><p class="small muted">Guide, clips, drills and downloads for every slot in the 3-5-2. Send to player profile posts it into the player feed in the app: one player, several or the whole squad. Coaches\' Voice items are marked and stay coach only, so they have no send buttoe button.</p>';
 h+='<div class="chips">'+L.map(function(s){return '<button class="chip'+(s.k===k?' on':'')+'" data-pact="slot" data-k="'+s.k+'">'+E(s.num.replace(/^0/,''))+' '+E(s.k)+'</button>';}).join('')+'</div>';
 h+='<div class="card"><h3 style="margin-top:0">'+E(row.num)+' '+E(row.k)+' &middot; '+E(row.name)+'</h3><div style="display:flex;gap:8px;flex-wrap:wrap">'
  +'<button class="btn pri" data-pact="drv" data-id="'+E(row.guide)+'" data-f="0" data-t="'+E(row.k+' role guide')+'">Role guide</button>'
  +'<button class="btn" data-pact="share" data-u="https://docs.google.com/document/d/'+E(row.guide)+'/view" data-t="'+E(row.k+' role guide')+'">Send guide to player profile</button>'
  +(row.folder?'<button class="btn" data-pact="drv" data-id="'+E(row.folder)+'" data-f="1" data-t="'+E(row.k+' folder')+'">Folder</button>':'')+'</div>'
  +'<p class="small muted" style="margin:8px 0 0">Players open the guide in their app under My position. A shared guide link needs Drive access.</p></div>';
 Object.keys(SECN).forEach(function(sk){var xs=(row.sec||{})[sk]||[];if(!xs.length)return;h+='<details class="card"'+(sk==='clips'?' open':'')+'><summary><b>'+SECN[sk]+'</b> <span class="small muted">'+xs.length+'</span></summary>'+xs.map(itemRow).join('')+'</details>';});
 [['team','Team-wide: the 3-5-2'],['scanning','Scanning']].forEach(function(x){var xs=P.d[x[0]]||[];if(xs.length)h+='<details class="card"><summary><b>'+x[1]+'</b> <span class="small muted">'+xs.length+'</span></summary>'+xs.map(itemRow).join('')+'</details>';});
 return h+'</div>';}
function share(u,t){if(window.sendToProfile)window.sendToProfile({t:t,u:u,kind:'position'});}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-pact]');if(!b)return;e.preventDefault();var a=b.dataset.pact;
 if(a==='slot'){P.k=b.dataset.k;rr();}
 else if(a==='share')share(b.dataset.u,b.dataset.t);
 else if(a==='drv'&&window.driveView)window.driveView(b.dataset.id,b.dataset.t,b.dataset.f==='1');});
window.vPos=area;window.__posShare=share;
})();
