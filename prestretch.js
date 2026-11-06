/* Touchline r90: Pre-game stretch. Niggle chips -> short dynamic sequence from stretch/ assets.
 * Health data: niggles live only in private profile (local + Self sheet via f.niggle / f.prestretch).
 * Visible to that player, his family and coaches. Never on team feed or other family views.
 * Matchday: coaches see shirt-number flags on attendance. Offline queue then send when online.
 */
(function(){
'use strict';
var AREAS=[
 {k:'hamstrings',lab:'Hamstrings',ids:['ham']},
 {k:'calves',lab:'Calves',ids:['calf']},
 {k:'groin',lab:'Groin',ids:['adductor','butterfly']},
 {k:'hips',lab:'Hips',ids:['flexor','glute']},
 {k:'quads',lab:'Quads',ids:['quad']},
 {k:'lowerback',lab:'Lower back',ids:['knee','twist']},
 {k:'ankles',lab:'Ankles',ids:['calf','dog']},
 {k:'none',lab:'None',ids:[]}
];
var BASE=['flexor','ham','calf','twist','adductor']; /* balanced dynamic set when none */
var KEY='tl.prestretch';
var QKEY='tl.niggle.q';
function E(t){return (window.esc||function(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});})(t);}
function G(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
function S(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function today(){try{return (window.today?window.today():new Date().toISOString().slice(0,10));}catch(e){return new Date().toISOString().slice(0,10);}}
function shirtNum(){
 try{if(window.D&&D.role==='parent'&&window.CHD&&CHD.num)return String(CHD.num).replace(/\D/g,'');}catch(e){}
 try{if(window.SELF&&SELF.num)return String(SELF.num).replace(/\D/g,'');}catch(e){}
 try{if(window.D&&D.num)return String(D.num).replace(/\D/g,'');}catch(e){}
 try{var m=JSON.parse(G('fam.cache')||'null');if(m&&m.d&&m.d.num)return String(m.d.num).replace(/\D/g,'');}catch(e){}
 return '';}
function loadProg(){try{return JSON.parse(G(KEY)||'null');}catch(e){return null;}}
function saveProg(p){S(KEY,JSON.stringify(p));}
function queueGet(){try{return JSON.parse(G(QKEY)||'[]');}catch(e){return [];}}
function queueSet(a){S(QKEY,JSON.stringify(a||[]));}
function buildIds(areas){
 var want={},order=[],i,a,j,id;
 if(!areas.length||(areas.length===1&&areas[0]==='none')){
  BASE.forEach(function(id){want[id]=1;order.push(id);});
 }else{
  areas.forEach(function(k){
   for(i=0;i<AREAS.length;i++)if(AREAS[i].k===k){
    AREAS[i].ids.forEach(function(id){if(!want[id]){want[id]=1;order.push(id);}});
   }
  });
  /* always include a light hip opener if not already there */
  if(!want.flexor){want.flexor=1;order.unshift('flexor');}
  if(!want.twist){want.twist=1;order.push('twist');}
 }
 /* Cap to ~8 pose families so with L/R we stay near 2 minutes at 10s holds. */
 return order.slice(0,3);
}
function makeProg(areas){
 areas=(areas||[]).slice();
 if(areas.indexOf('none')>-1)areas=['none'];
 var ids=buildIds(areas);
 return {v:1,areas:areas,ids:ids,hold:15,intro:8,at:Date.now(),date:today(),num:shirtNum()};
}
function flushQueue(){
 var q=queueGet();if(!q.length)return;
 if(typeof window.call!=='function')return;
 var row=q[0];
 window.call(row.act,{num:row.num,areas:row.areas,ids:row.ids,date:row.date,at:row.at,hold:row.hold}).then(function(){
  queueSet(q.slice(1));flushQueue();
 }).catch(function(){/* keep queued for offline */});}
function enqueue(act,prog){
 var q=queueGet();
 q.push({act:act,num:prog.num||shirtNum(),areas:prog.areas,ids:prog.ids,date:prog.date,at:prog.at,hold:prog.hold});
 queueSet(q);flushQueue();
}
function openSheet(){
 var cur=loadProg()||{areas:[]},sel={};
 (cur.areas||[]).forEach(function(k){sel[k]=1;});
 var ov=document.getElementById('tl-pre-sheet');
 if(ov)ov.parentNode.removeChild(ov);
 ov=document.createElement('div');ov.id='tl-pre-sheet';ov.className='tl-pre-sheet';
 ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Pre-game stretch');
 function paint(){
  var chips=AREAS.map(function(a){
   return '<button type="button" class="chip'+(sel[a.k]?' on':'')+'" data-area="'+a.k+'">'+E(a.lab)+'</button>';
  }).join('');
  ov.innerHTML='<div class="tl-pre-inner">'+
   '<h3 style="margin-top:0">Pre-game stretch</h3>'+
   '<p class="small muted">Any niggles or areas that need a stretch? Tap all that apply. We build a short dynamic sequence for you.</p>'+
   '<div class="chips tl-pre-chips" role="group" aria-label="Areas">'+chips+'</div>'+
   '<p class="small" style="margin:10px 0;padding:8px 10px;border-radius:10px;background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.35)"><b>If it hurts, stop and tell a coach.</b> This is a stretch, not treatment.</p>'+
   '<p class="small muted">Niggle answers stay on your private profile. Only you, your family and the coaches can see them. Other families never see this. Coaches see shirt numbers on matchday attendance.</p>'+
   '<button type="button" class="btn pri block" id="tl-pre-go"'+(Object.keys(sel).length?'':' disabled')+'>Build my short stretch</button>'+
   (cur.ids&&cur.ids.length?'<button type="button" class="btn block" id="tl-pre-replay" style="margin-top:8px">Replay my pre-game programme</button>':'')+
   '<button type="button" class="btn block" id="tl-pre-x" style="margin-top:8px">Cancel</button>'+
  '</div>';
  ov.querySelector('#tl-pre-x').onclick=close;
  ov.querySelectorAll('[data-area]').forEach(function(b){
   b.onclick=function(){
    var k=b.getAttribute('data-area');
    if(k==='none'){sel={none:1};}
    else{delete sel.none;if(sel[k])delete sel[k];else sel[k]=1;}
    paint();
   };
  });
  var go=ov.querySelector('#tl-pre-go');
  if(go)go.onclick=function(){
   var areas=Object.keys(sel);if(!areas.length)return;
   var prog=makeProg(areas);saveProg(prog);
   /* Health: sync private profile + flag coaches when not "none". */
   enqueue('f.prestretch.set',prog);
   if(areas.indexOf('none')<0)enqueue('f.niggle',prog);
   close();
   location.href='stretch/index.html?mode=pregame&v=92&back='+encodeURIComponent(location.pathname+(location.search||''));
  };
  var rp=ov.querySelector('#tl-pre-replay');
  if(rp)rp.onclick=function(){close();location.href='stretch/index.html?mode=pregame&v=92&back='+encodeURIComponent(location.pathname+(location.search||''));};
 }
 function close(){if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);}
 document.body.appendChild(ov);paint();
}
function cardExtra(){
 var prog=loadProg(),h='';
 h+='<button type="button" class="btn pri block" style="margin-top:8px" onclick="openPreStretch()">Pre-game stretch</button>';
 h+='<p class="small muted" style="margin-top:6px">short dynamic warm-up. Tell us any niggles (chips only), we weight the sequence, and save it on your profile to replay.</p>';
 if(prog&&prog.ids&&prog.ids.length){
  var labs=(prog.areas||[]).map(function(k){for(var i=0;i<AREAS.length;i++)if(AREAS[i].k===k)return AREAS[i].lab;return k;}).join(', ');
  h+='<p class="small" style="margin-top:6px">Saved programme'+(labs?' · '+E(labs):'')+'. <a href="stretch/index.html?mode=pregame&v=92&back='+encodeURIComponent(location.pathname)+'">Replay</a></p>';
 }
 return h;
}
function profileNiggleCard(forChild){
 var prog=loadProg();if(!prog||!prog.areas||!prog.areas.length)return '';
 if(prog.areas.length===1&&prog.areas[0]==='none')return '';
 /* Private: only on player Me / family child view. Never team feed. */
 var labs=prog.areas.map(function(k){for(var i=0;i<AREAS.length;i++)if(AREAS[i].k===k)return AREAS[i].lab;return k;});
 var shirt='';try{if(forChild&&window.CHD&&CHD.num)shirt='No. '+CHD.num+' · ';}catch(e){}
 return '<div class="card tl-niggle"><h3>'+(forChild?'His niggles':'My niggles')+'</h3>'+
  '<p class="small muted">Private. Only you, your family and the coaches. Not shown to other families.</p>'+
  '<p><b>'+E(shirt)+E(labs.join(', '))+'</b></p>'+
  '<p class="small" style="margin:8px 0;padding:8px 10px;border-radius:10px;background:rgba(248,113,113,.12)"><b>If it hurts, stop and tell a coach.</b></p>'+
  '<a class="btn block" href="stretch/index.html?mode=pregame&v=92&back='+encodeURIComponent(location.pathname)+'">Open pre-game stretch</a></div>';
}
if(!document.getElementById('tl-pre-css')){
 var st=document.createElement('style');st.id='tl-pre-css';
 st.textContent='.tl-pre-sheet{position:fixed;inset:0;z-index:9996;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center}'+
  '.tl-pre-inner{background:var(--card,#122047);color:var(--ink,#fff);width:100%;max-width:520px;border-radius:16px 16px 0 0;padding:16px 16px 24px;max-height:90vh;overflow:auto}'+
  '.tl-pre-chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}'+
  'body.ps .tl-pre-inner{background:#fff;color:#0A0F24}';
 document.head.appendChild(st);
}
window.openPreStretch=openSheet;
window.preStretchExtra=cardExtra;
window.niggleCard=profileNiggleCard;
window.__preStretch={AREAS:AREAS,makeProg:makeProg,loadProg:loadProg,buildIds:buildIds,flushQueue:flushQueue};
try{window.addEventListener('online',flushQueue);}catch(e){}
setTimeout(flushQueue,800);
})();
