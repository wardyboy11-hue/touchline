/* Touchline release 74: player position resources (family.html, player code only).
 * Reads positions.json (public, titles and links only, Coaches' Voice removed at build time).
 * Suggestions are matched on this phone from things already shown to this player
 * (their work ons and goals). Nothing about the player is sent anywhere.
 */
(function(){
'use strict';
var P={d:null,err:'',slot:'',open:{},more:0,busy:false},CACHE={},PDFJS=null;
var NUM={GK:1,RCB:2,CB:3,LCB:4,RWB:5,LWB:6,CDM:7,RCM:8,LCM:9,RST:10,LST:11};
/* 352 slot from what the app already knows: next game role card, then the player's own picks */
var MAP={GK:'GK',RB:'RCB',CB:'CB',LB:'LCB',RWB:'RWB',LWB:'LWB',CDM:'CDM',CM:'RCM',CAM:'LCM',RM:'RWB',LM:'LWB',RW:'RST',LW:'LST',ST:'RST',RCB:'RCB',LCB:'LCB',RCM:'RCM',LCM:'LCM',RST:'RST',LST:'LST',RS:'RST',LS:'LST',DM:'CDM'};
var ROLEMAP={'Goalkeeper':'GK','Centre back':'CB','Wing back':'RWB','Midfield':'RCM','Striker':'RST'};
var GROUP={GK:'Goalkeeper',RCB:'Centre back',CB:'Centre back',LCB:'Centre back',RWB:'Wing back',LWB:'Wing back',CDM:'Midfield',RCM:'Midfield',LCM:'Midfield',RST:'Striker',LST:'Striker'};
var TAGRX={'scanning':/scan|shoulder|look(ing)? (around|before)|awareness/i,'1v1 defending':/1 ?v ?1|one[- ]on[- ]one|defend|tackl|jockey|duel/i,'heading':/head(er|ing|s)?\b|aerial|in the air/i,
 'passing':/pass|distribut|switch|play(ing)? out/i,'first touch':/first touch|touch|receiv|turn/i,'finishing':/finish|shoot|shot|score|goals?\b/i,'pressing':/press|win (it|the ball) back/i,
 'crossing':/cross/i,'dribbling':/dribbl|beat (a|the|my) (man|player)|1v1 attack|take (him|them|people) on|carry/i,'positioning':/position|shape|cover|space/i,'communication':/talk|communicat|organis|loud|voice/i,
 'shot stopping':/sav(e|es|ing)|shot[- ]?stop|diving|handling|catch/i,'movement':/movement|off the ball|in behind|runs?\b|spin/i,'weak foot':/weak(er)? foot|left foot|right foot|both feet/i,'fitness':/fit|stamina|recover|sprint|quick|pace|speed/i};
var SKT={pass:'passing',touch:'first touch',drib:'dribbling',shot:'finishing',head:'heading',weak:'weak foot',iq:'scanning',posn:'positioning',comm:'communication',pace:'fitness',fit:'fitness',gkh:'shot stopping',gkd:'passing'};
function E(t){return (window.esc||function(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});})(t);}
function G(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
function S(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function rr(){if(window.r)window.r();}
function load(){if(P.d||P.busy||P.err)return;P.busy=true;fetch('positions.json',{cache:'no-cache'}).then(function(x){if(!x.ok)throw new Error('x');return x.json();}).then(function(j){P.d=j;P.busy=false;rr();}).catch(function(){P.busy=false;P.err='Position videos could not load. Check your signal.';rr();});}
function slotOf(v){v=String(v||'').toUpperCase().replace(/[^A-Z]/g,'');return MAP[v]||'';}
function mySlot(){
 if(P.slot)return P.slot;var p=G('fam.pslot');if(NUM[p])return p;
 try{if(window.RCD&&RCD.pos&&slotOf(RCD.pos))return slotOf(RCD.pos);}catch(e){}
 try{if(window.SELF&&SELF.pos&&SELF.pos.length&&slotOf(SELF.pos[0]))return slotOf(SELF.pos[0]);}catch(e){}
 try{var rl=window.myRole&&myRole();if(ROLEMAP[rl])return ROLEMAP[rl];}catch(e){}
 return '';}
function slotRow(k){var L=(P.d&&P.d.slots)||[];for(var i=0;i<L.length;i++)if(L[i].k===k)return L[i];return null;}
/* Things already on this player's page: coach work ons (and agreed goals in them), their own goals. */
function focusTexts(){var t=[];
 try{(window.WON&&WON.items||[]).forEach(function(x){t.push({txt:x.txt||'',k:x.k||''});});}catch(e){}
 try{((window.GL&&GL.d&&GL.d.goals)||[]).forEach(function(x){if(x.status!=='parked')t.push({txt:x.txt||'',k:''});});}catch(e){}
 try{((window.LB&&LB.d&&LB.d.reqs)||[]).forEach(function(x){if(x.text)t.push({txt:x.text,k:''});});}catch(e){}
 return t;}
function wantTags(){var w={};focusTexts().forEach(function(f){if(SKT[f.k])w[SKT[f.k]]=1;for(var k in TAGRX)if(TAGRX[k].test(f.txt))w[k]=1;});return Object.keys(w);}
function oneThing(){var f=focusTexts();return f.length?f[0].txt:'';}
function suggested(row){var w=wantTags();if(!w.length||!row)return {tags:[],items:[]};var out=[],seen={};
 ['clips','drills','reading'].forEach(function(s){((row.sec||{})[s]||[]).forEach(function(it){if(seen[it.u])return;var hit=(it.tags||[]).filter(function(t){return w.indexOf(t)>-1;});if(hit.length){seen[it.u]=1;out.push({it:it,hit:hit});}});});
 ((P.d.scanning||[]).concat(P.d.team||[])).forEach(function(it){if(seen[it.u])return;var hit=(it.tags||[]).filter(function(t){return w.indexOf(t)>-1;});if(hit.length){seen[it.u]=1;out.push({it:it,hit:hit});}});
 out.sort(function(a,b){return b.hit.length-a.hit.length;});return {tags:w,items:out.slice(0,4)};}
function clipCard(it){var img=it.yt?'<img loading="lazy" decoding="async" alt="" src="https://i.ytimg.com/vi/'+E(it.yt)+'/mqdefault.jpg" style="width:120px;height:68px;object-fit:cover;border-radius:8px;flex:none;background:#111">':'<div style="width:120px;height:68px;border-radius:8px;flex:none;background:#1e293b;display:flex;align-items:center;justify-content:center;font-size:12px;color:#cbd5e1">'+E({x:'X post',instagram:'Instagram',web:'Web'}[it.ty]||'Link')+'</div>';
 return '<a class="poscl" href="'+E(it.u)+'" target="_blank" rel="noopener" style="display:flex;gap:10px;align-items:center;padding:8px;margin:6px 0;border-radius:12px;background:rgba(255,255,255,.06);color:inherit;text-decoration:none;min-height:60px">'+img+'<span style="min-width:0"><b style="display:block;font-size:14px;line-height:1.25">'+E(it.t)+'</b><span class="small muted">'+E(it.w)+'</span></span></a>';}
function linkRow(it){return '<a href="'+E(it.u)+'" target="_blank" rel="noopener" data-ext="1" style="display:block;padding:10px;margin:6px 0;border-radius:12px;background:rgba(255,255,255,.06);color:inherit;text-decoration:none"><b style="font-size:14px">'+E(it.t)+'</b><br><span class="small muted">'+E(it.w)+(it.s?' &middot; '+E(it.s):'')+'</span></a>';}
function picker(cur){return '<div class="chips" role="group" aria-label="Pick a position">'+((P.d&&P.d.slots)||[]).map(function(s){return '<button class="chip'+(s.k===cur?' on':'')+'" onclick="posPick(\''+s.k+'\')">'+E(s.k)+'</button>';}).join('')+'</div>';}
function card(){
 if(!window.D||D.role!=='player')return '';load();
 if(P.err)return '<div class="card"><h2>My position</h2><p class="small muted">'+E(P.err)+'</p></div>';
 if(!P.d)return '<div class="card"><h2>My position</h2><p class="small muted">Loading</p></div>';
 var k=mySlot(),row=slotRow(k);
 if(!row)return '<div class="card" id="posCard"><span class="tag" style="background:#1e3a8a">My position</span><h2 style="margin-top:8px">Pick your position</h2><p class="small muted">Pick where you play in our 3-5-2 and you get the guide, clips and drills for it.</p>'+picker('')+'</div>';
 var sec=row.sec||{},clips=sec.clips||[],n=P.open.clips?clips.length:3,sg=suggested(row);
 var h='<div class="card" id="posCard" style="border-color:#60a5fa"><span class="tag" style="background:#1e3a8a">My position</span><h2 style="margin-top:8px">'+E(row.num.replace(/^0/,''))+' &middot; '+E(row.k)+' '+E(row.name)+'</h2>';
 h+='<button class="btn pri block" onclick="posGuide(\''+row.k+'\')">Open my role guide</button>';
 if(sg.items.length)h+='<h3 style="margin:14px 0 2px">Suggested for you</h3><p class="small muted">Matches what you are working on: '+E(sg.tags.join(', '))+'.</p>'+sg.items.map(function(x){return x.it.yt||/x|instagram/.test(x.it.ty)?clipCard(x.it):linkRow(x.it);}).join('');
 if(clips.length)h+='<h3 style="margin:14px 0 2px">Top clips</h3>'+clips.slice(0,n).map(clipCard).join('')+(clips.length>3?'<button class="btn block" onclick="posMore(\'clips\')">'+(P.open.clips?'Show fewer':'Show all '+clips.length+' clips')+'</button>':'');
 if((sec.drills||[]).length)h+='<details style="margin-top:10px"'+(P.open.dr?' open':'')+' ontoggle="posTog(\'dr\',this.open)"><summary><b>Drills</b> <span class="small muted">'+sec.drills.length+'</span></summary>'+sec.drills.map(function(it){return it.yt?clipCard(it):linkRow(it);}).join('')+'</details>';
 var dl=(sec.free_pdf_links||[]).concat(sec.reading||[]);
 if(dl.length)h+='<details style="margin-top:6px"'+(P.open.dl?' open':'')+' ontoggle="posTog(\'dl\',this.open)"><summary><b>Downloads and reading</b> <span class="small muted">'+dl.length+'</span></summary>'+dl.map(linkRow).join('')+'</details>';
 h+='<details style="margin-top:6px"'+(P.open.pk?' open':'')+' ontoggle="posTog(\'pk\',this.open)"><summary><b>Look at another position</b></summary>'+picker(row.k)+(G('fam.pslot')?'<button class="btn block" style="margin-top:6px" onclick="posPick(\'\')">Go back to my position</button>':'')+'</details>';
 return h+'</div>';}
var CHK=['Boots, shin pads, water and kit packed','Eat well and drink water before the game','Warm up properly with the team','Scan: look over your shoulder before the ball comes','Talk: tell a team mate one thing early'];
function prep(){
 if(!window.D||D.role!=='player'||!P.d)return '';var k=mySlot(),grp=GROUP[k],jobs=(grp&&window.ROLES&&ROLES[grp])?ROLES[grp].slice(0,3):[],items=CHK.concat(jobs.map(function(j){return 'My job: '+j;})),done={};
 try{done=JSON.parse(G('fam.pchk'))||{};}catch(e){}var td=(window.today?today():new Date().toISOString().slice(0,10));if(done.d!==td)done={d:td};
 var one=oneThing();
 var h='<div class="card" id="prepCard" style="border-color:#fbbf24"><span class="tag" style="background:#78350f">Match prep</span><h2 style="margin-top:8px">Matchday checklist</h2>';
 h+=items.map(function(t,i){return '<label style="display:flex;gap:10px;align-items:center;min-height:44px;margin:2px 0"><input type="checkbox" style="width:22px;height:22px;flex:none"'+(done[i]?' checked':'')+' onchange="posChk('+i+',this.checked)"><span>'+E(t)+'</span></label>';}).join('');
 h+='<h3 style="margin:12px 0 4px">One thing I am working on</h3>'+(one?'<p style="font-size:17px;margin:0">'+E(one)+'</p><p class="small muted">From your work ons and goals with the coaches.</p>':'<p class="small muted">Nothing set yet. Pick one thing for today with Tim or Deano, or set a goal on your page.</p>');
 return h+'</div>';}
/* full screen guide viewer: f.pos.file only returns the 11 role guides */
function pdfLib(){if(PDFJS)return PDFJS;PDFJS=import(new URL('coach/vendor/pdfjs/pdf.min.mjs',document.baseURI).href).then(function(m){m.GlobalWorkerOptions.workerSrc=new URL('coach/vendor/pdfjs/pdf.worker.min.mjs',document.baseURI).href;return m;}).catch(function(e){PDFJS=null;throw e;});return PDFJS;}
function b64Blob(b){var bin=atob(b),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type:'application/pdf'});}
function shell(title){var o=document.getElementById('posview');if(o)o.remove();var d=document.createElement('div');d.id='posview';d.setAttribute('role','dialog');d.setAttribute('aria-label',title);
 d.style.cssText='position:fixed;inset:0;z-index:2100;background:#0b1020;display:flex;flex-direction:column';
 d.innerHTML='<div style="display:flex;gap:8px;padding:8px;background:#111;align-items:center"><button id="pvback" style="min-height:48px;min-width:96px;font:inherit;font-weight:700;border-radius:12px;border:1px solid #444;background:#222;color:#fff">&larr; Back</button><div style="flex:1;color:#fff;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+E(title)+'</div><span id="pvz" style="display:none;gap:6px"><button data-z="-1" aria-label="Zoom out" style="min-height:48px;min-width:48px;border-radius:12px;border:1px solid #444;background:#222;color:#fff;font-size:20px">&minus;</button><button data-z="1" aria-label="Zoom in" style="min-height:48px;min-width:48px;border-radius:12px;border:1px solid #444;background:#222;color:#fff;font-size:20px">+</button></span></div><div id="pvbody" style="flex:1;overflow:auto;-webkit-overflow-scrolling:touch;color:#fff"><p style="padding:16px">Opening your guide...</p></div>';
 document.body.appendChild(d);var close=function(){d.remove();window.removeEventListener('popstate',close);};
 try{history.pushState({posview:1},'');window.addEventListener('popstate',close);}catch(e){}
 d.querySelector('#pvback').onclick=function(){if(history.state&&history.state.posview)history.back();else close();};return d;}
function showPdf(d,url){var body=d.querySelector('#pvbody'),zoom=1,doc=null,gen=0;
 function paint(){var my=++gen;body.innerHTML='';var w=Math.min(body.clientWidth||360,1400)-8;
  for(var i=1;i<=doc.numPages;i++){(function(n){var c=document.createElement('canvas');c.style.cssText='display:block;margin:4px auto;background:#fff';c.setAttribute('aria-label','Page '+n);body.appendChild(c);
   doc.getPage(n).then(function(pg){if(my!==gen)return;var v0=pg.getViewport({scale:1}),dpr=Math.min(window.devicePixelRatio||1,2),v=pg.getViewport({scale:w*zoom/v0.width*dpr});c.width=v.width;c.height=v.height;c.style.width=(v.width/dpr)+'px';c.style.height=(v.height/dpr)+'px';return pg.render({canvasContext:c.getContext('2d'),viewport:v}).promise;}).catch(function(){});})(i);}}
 return pdfLib().then(function(lib){return lib.getDocument({url:url,isEvalSupported:false}).promise;}).then(function(p){doc=p;var z=d.querySelector('#pvz');z.style.display='flex';z.onclick=function(e){var b=e.target.closest('[data-z]');if(!b)return;zoom=Math.max(0.5,Math.min(4,zoom*(b.dataset.z==='1'?1.4:1/1.4)));paint();};paint();})
  .catch(function(){body.innerHTML='<iframe title="Guide" src="'+url+'" style="width:100%;height:100%;border:0;background:#fff"></iframe>';});}
window.posGuide=function(k){var row=slotRow(k);if(!row)return;var d=shell(row.k+' '+row.name+' guide');
 var go=CACHE[row.guide]?Promise.resolve(CACHE[row.guide]):window.call('f.pos.file',{id:row.guide}).then(function(x){var u=URL.createObjectURL(b64Blob(x.b64));CACHE[row.guide]=u;return u;});
 go.then(function(u){if(document.body.contains(d))return showPdf(d,u);}).catch(function(e){if(!document.body.contains(d))return;var m=/unknown/i.test(e.message)?'The guides are nearly ready. Tim needs to switch them on.':e.message;d.querySelector('#pvbody').innerHTML='<div style="padding:16px"><p>'+E(m)+'</p><button class="btn block" id="pvretry">Try again</button></div>';d.querySelector('#pvretry').onclick=function(){window.posGuide(k);};});};
window.posPick=function(k){S('fam.pslot',k||'');P.slot='';P.open={};rr();var c=document.getElementById('posCard');if(c)c.scrollIntoView({block:'start'});};
window.posMore=function(s){P.open[s]=!P.open[s];rr();};
window.posTog=function(s,o){P.open[s]=o;};
window.posChk=function(i,v){var done={};try{done=JSON.parse(G('fam.pchk'))||{};}catch(e){}var td=(window.today?today():'');if(done.d!==td)done={d:td};done[i]=v?1:0;S('fam.pchk',JSON.stringify(done));};
window.posCard=card;window.prepCard=prep;
window.__posTest={slotOf:slotOf,wantTags:wantTags,suggested:suggested,P:P,mySlot:mySlot};
})();
