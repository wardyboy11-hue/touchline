/* Touchline weekly guide: the card in Plan, This week, and the Reflect capture card.
   Coach only. Never loaded by the family, parents or player pages. */
(function(){
'use strict';
var X=window.TLX,G=window.GUIDE,BANK=window.TOPIC_BANK;
if(!X||!G||!BANK)return;
var esc=X.esc,GUI=window.GUI={v:1},LIB=null,LIBP=null,RES=null,BLOAD=0;

function S(){return X.S();}
function V(){return X.view;}
function now(){return Date.now();}
function lsGet(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function save(){X.touch('settings',S().settings);}

/* dev only: ?today=2026-11-05&hm=21:00 on localhost */
function clock(){var d=new Date(),t=X.isoToday(),hm=('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
 try{if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)){var q=new URLSearchParams(location.search);if(q.get('today'))t=q.get('today');if(q.get('hm'))hm=q.get('hm');}}catch(e){}
 return {t:t,hm:hm};}

function loadLib(){if(LIB||LIBP)return;
 LIBP=fetch('library.json').then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(j){LIB=j;if(V().tab==='plan'||V().tab==='sb')X.render(true);}).catch(function(){LIB={items:[],err:1};LIBP=null;if(V().tab==='plan')X.render(true);});}

function resItems(){if(RES)return RES;var L=X.resList(),RT=window.RT||[],RA=window.RA||[];
 RES=L.filter(function(r){return r.v;}).map(function(r,i){var topic=RT[r.k]||'',th=G.tagsFromText(topic+' '+r.t).concat([String(topic).toLowerCase()]);
  var tp=/youtu|vimeo|instagram\.com|youtu\.be/.test(r.v)?'video':'search';
  return {id:'res-'+i,title:r.t,url:r.v,type:tp,src:'res',tags:{moment:[],theme:th,age:[RA[r.a]||''],players:(r.t.match(/\d+v\d+/gi)||[]).map(function(x){return x.toLowerCase();}),system:/3-5-2/.test(r.t)?['3-5-2']:[]}};});
 return RES;}

/* ---------- the block the guide works from ---------- */
function planOf(b){return b.plan||BANK.block3.plan.map(function(t,i){return {wk:i+1,topic:t};});}
function empty(b){return !(b.weeks||[]).some(function(w){return Object.keys(w.s||{}).length;});}
function ensureWB(cb){if(window.WB){cb();return;}if(BLOAD)return;BLOAD=1;var sc=document.createElement('script');sc.src='wb.js?v=62';sc.onload=function(){BLOAD=0;cb();};sc.onerror=function(){BLOAD=0;X.toast('Could not load');};document.head.appendChild(sc);}
function blockOK(){var b=S().settings.sb;if(!b)return null;
 if(b.rcId==='b3'||b.plan){if(!b.plan){b.plan=planOf(b);b.blockStart=b.blockStart||BANK.block3.blockStart;b.day=3;}if(b.weeks)b.weeks.forEach(function(w){if(!w.status)w.status='planned';});return b;}
 return null;}
function autoLoad(){var b=S().settings.sb;if(BLOAD)return;if(b&&!empty(b))return;ensureWB(function(){var bb=X.sb();if(!empty(bb))return;window.WB.loadB3(bb);X.render(true);});}

GUI.sidNow=function(){var b=blockOK(),t=clock().t;if(!b)return t;var best='';b.weeks.forEach(function(w,i){var d=G.weekDate(b,BANK,i);if(d<=t&&d>best)best=d;});return best||t;};
function weekAt(b,sid){var k=-1;b.weeks.forEach(function(w,i){if(G.weekDate(b,BANK,i)<=sid)k=i;});return k;}
function seenKey(){return 'tl.guideSeen.'+(X.who()||'x');}
GUI.badge=function(){var b=blockOK();if(!b)return false;return G.badge(b,BANK,clock().t,lsGet(seenKey()));};

/* ---------- writes ---------- */
function wk(i){var b=S().settings.sb;if(!b.weeks[i])b.weeks[i]={s:{},i:{},lead:{}};return b.weeks[i];}
/* guide edits live in their own sync docs (kind gd): one each for answers, edits and carry, per week */
function gk(i,k){var b=S().settings.sb;return (b.blockStart||BANK.block3.blockStart)+'.'+i+'.'+k;}
function gdv(i,k){var o=(S().gd||{})[gk(i,k)];return (o&&o.v)||{};}
function gdSet(i,k,v){var S_=S();S_.gd=S_.gd||{};var id=gk(i,k),o=S_.gd[id]||(S_.gd[id]={id:id});o.v=v;X.touch('gd',o);}
function hydrate(b){var c=Object.assign({},b);c.weeks=b.weeks.map(function(w,i){var o=Object.assign({},w);['ans','ovr','carry'].forEach(function(k){o[k]=gdv(i,k);});return o;});return c;}
function setAns(i,id,v){var a=Object.assign({},gdv(i,'ans'));a[id]=v;gdSet(i,'ans',a);}
function ovrGet(i){return JSON.parse(JSON.stringify(gdv(i,'ovr')));}
function ovrSet(i,o){gdSet(i,'ovr',o);}

/* ---------- html ---------- */
function dot(st){return '<span aria-hidden="true" style="display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;background:'+({planned:'#8fa0cf',built:'#4da3ff',ran:'#3ecf8e','not-run':'#ff6b6b',moved:'#ffb81c'})[st||'planned']+'"></span>';}
function shortDate(iso){var p=iso.split('-');return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('en-GB',{day:'numeric',month:'short'});}

function strip(b,cur){return '<div class="chips" style="margin:6px 0;flex-wrap:nowrap;overflow-x:auto">'+b.weeks.map(function(w,i){return '<button class="chip'+(cur===i?' on':'')+'" data-act="gWeek" data-i="'+i+'" style="min-width:92px;text-align:left">'+dot(w.status)+'<b>Wk '+(i+1)+'</b><br><span class="small">'+esc(shortDate(G.weekDate(b,BANK,i)))+'</span></button>';}).join('')+'</div>';}

function panelHtml(g){var P=g.panel;if(!P)return '';
 var h='<div class="card"><h3 style="margin-top:0">From last week</h3><p class="small muted">Both coaches side by side. Marks are never averaged. Nothing applies until you tap Use these.</p>';
 h+='<div class="row" style="align-items:flex-start;gap:8px">'+P.names.map(function(n){var r=P.by[n],sc=r.sc||{};
  function ch(x){return (x&&x.chips&&x.chips.length)?esc(x.chips.join(', ')):'<span class="muted">nothing</span>';}
  function en(a){return (a&&a.length)?esc(a.map(function(e){return /^\d+$/.test(String(e.k).replace('#',''))?'#'+String(e.k).replace('#',''):e.k;}).join(', ')):'<span class="muted">none</span>';}
  return '<div class="grow small"><b>'+esc(n)+'</b><div>Went well: '+ch(r.well)+'</div><div>Work on: '+ch(r.improve)+'</div><div>Doing well: '+en(r.stood)+'</div><div>Struggling: '+en(r.strug)+'</div>'+(r.ran==='no'?'<div>Did not run'+(r.why?': '+esc(r.why):'')+'</div>':'')+'</div>';}).join('')+'</div>';
 P.missing.forEach(function(n){if(P.names.length<2)h+='<p class="small muted" style="margin:6px 0 0">'+esc(n)+' hasn’t reflected yet.</p>';});
 if(P.flags.length)h+='<div style="margin-top:8px"><b class="small">Where you differ</b>'+P.flags.map(function(f){return '<div class="small" style="color:var(--amber)">'+esc(f)+'</div>';}).join('')+'</div>';
 if(P.items.length){h+='<div style="margin-top:8px"><b class="small">Carry into this week</b><div class="chips" style="margin-top:4px">'+P.items.map(function(it){return '<button class="chip'+(it.on?' on':'')+'" data-act="gCarry" data-id="'+esc(it.id)+'">'+(it.on?'Include: ':'Dropped: ')+esc(it.label)+'</button>';}).join('')+'</div><button class="btn pri block" style="margin-top:8px;min-height:48px" data-act="gUse">'+(P.applied?'Applied. Tap to apply again':'Use these')+'</button></div>';}
 return h+'</div>';}

function qHtml(g){return '<div class="card"><h3 style="margin-top:0">Build this week’s session</h3>'+g.questions.map(function(q){var v=q.value,h='<label>'+esc(q.q)+'</label>';
 if(q.type==='text')return h+'<input data-gq="'+esc(q.id)+'" value="'+esc(v||'')+'" maxlength="120">';
 return h+'<div class="chips">'+q.opts.map(function(o){var on=q.type==='multi'?(v||[]).indexOf(o)>-1:v===o;return '<button class="chip'+(on?' on':'')+'" data-act="gAns" data-q="'+esc(q.id)+'" data-v="'+esc(o)+'" data-t="'+q.type+'">'+esc(o)+'</button>';}).join('')+'</div>';}).join('')+'</div>';}

function lookRow(x){var open=x.embed?'<button class="btn pri grow" style="min-height:44px" data-act="gView" data-u="'+esc(x.url)+'" data-ty="'+x.type+'">'+esc(x.btn)+'</button>':'<a class="btn pri grow" style="min-height:44px;display:flex;align-items:center;justify-content:center" data-ext="1" target="_blank" rel="noopener" href="'+esc(x.url)+'">'+esc(x.btn)+'</a>';
 return '<div class="it" style="display:block;cursor:default"><div class="row"><div class="grow small"><b>'+esc(x.title)+'</b><div class="muted">'+esc(({pdf:'Coaches Voice plan',masterclass:'Coaches Voice Academy',x:'X post',video:'Video',animation:'Animation',search:'Search'})[x.type]||x.type)+(x.length?' · '+esc(x.length):'')+(x.paid?' · paid, link only':'')+'</div><div>'+esc(x.why)+'</div></div><button class="btn sm" aria-label="Hide" data-act="gHide" data-id="'+esc(x.id)+'" style="min-width:44px;min-height:44px">×</button></div><div class="row" style="margin-top:6px">'+open+'</div></div>';}

function topicHtml(g,b){var t=g.topic,h='<div class="card"><div class="row"><div class="grow"><div class="small muted">Wk '+g.wk+' · '+esc(X.niceDate(g.date))+'</div><b style="font-size:17px">'+esc(t.name||'Pick a topic')+'</b>'+(t.tagline?'<div class="small muted">'+esc(t.tagline)+'</div>':'')+'</div><button class="btn sm" data-act="gEditTop" aria-label="Edit topic">Edit</button></div>';
 var w=b.weeks[g.i]||{};
 h+='<div class="chips" style="margin-top:6px"><span class="chip on" style="cursor:default">'+dotTxt(g.status)+'</span>'+(w.split?'<span class="chip" style="cursor:default">Split week</span>':'')+(w.moved?'<span class="chip" style="cursor:default">Moved from '+esc(shortDate(w.moved.from))+'</span>':'')+(g.ovr.has?'<span class="chip" style="cursor:default">Edited</span>':'')+'</div>';
 if(w.bridge)h+='<p class="small" style="margin:6px 0 0"><b>Bridge into the next block.</b> '+esc(w.bridge)+'</p>';
 if(V().gtp){h+='<label>Change topic</label><div class="chips">'+Object.keys(BANK.topics).map(function(id){return '<button class="chip'+(t.id===id?' on':'')+'" data-act="gTopic" data-id="'+id+'">'+esc(BANK.topics[id].name)+'</button>';}).join('')+'</div>';}
 h+='<details style="margin-top:8px"><summary class="small" style="cursor:pointer;font-weight:700">⋯ More</summary><div class="row wrap2" style="margin-top:6px"><button class="btn grow" data-act="gRan" data-v="ran">Mark ran</button><button class="btn grow" data-act="gRan" data-v="not-run">Didn’t run</button><button class="btn grow" data-act="gMove">Move week</button><button class="btn bad grow" data-act="gReset">Reset week</button></div></details></div>';
 return h;}
function dotTxt(s){return ({planned:'Planned',built:'Built',ran:'Ran','not-run':'Did not run',moved:'Moved'})[s||'planned'];}

function pointsHtml(g){var P=g.topic.points,V_=V();
 var h='<div class="card"><div class="row"><h3 class="grow" style="margin:0">Key coaching points</h3><button class="btn sm" data-act="gEditPts">'+(V_.gpe?'Close':'Edit')+'</button></div>';
 if(V_.gpe){var ta=P.map(function(p){return p.p+' :: '+(p.term||'')+' :: '+(p.means||'');}).join('\n');h+='<p class="small muted">One point per line: the point :: term :: what it means.</p><textarea id="gpts" style="min-height:180px">'+esc(ta)+'</textarea><button class="btn pri block" style="margin-top:6px" data-act="gSavePts">Save points</button>';}
 else h+=P.map(function(p,i){return '<div class="small" style="margin-top:8px"><b>'+(i+1)+'.</b> '+esc(p.p)+(p.term?'<div class="muted"><b>'+esc(p.term)+'</b> means '+esc(p.means)+'</div>':'')+'</div>';}).join('');
 return h+'</div>';}

GUI.card=function(){
 var b=blockOK();
 if(!b){autoLoad();var bb=S().settings.sb;
  return '<div class="card"><h3 style="margin-top:0">Next session guide</h3>'+(bb&&!empty(bb)?'<p class="small">Your current block is not Block 3, so the guide cannot plan from it. Load Block 3 to use the guide (your current block is kept in the archive).</p><button class="btn pri block" data-act="gLoad">Load Block 3</button>':'<p class="muted small">Setting up Block 3...</p>')+'</div>';}
 loadLib();if(!LIB)return '<div class="card"><h3 style="margin-top:0">Next session guide</h3><p class="muted small">Loading the library...</p></div>';
 var c=clock(),sel=V().gwk,shown=(function(){try{return JSON.parse(lsGet('tl.gshown'))||{};}catch(e){return {};}})();
 var st={sb:hydrate(b),revs:X.rvAll(),squad:X.plist().map(function(p){return {num:p.num,pos:X.effPos(p)};}),res:resItems(),shown:shown,week:sel==null?null:sel};
 var g=G.buildGuide(st,BANK,LIB,c.t,c.hm);
 shown[g.i]=g.shownIds;lsSet('tl.gshown',JSON.stringify(shown));
 if(sel==null)lsSet(seenKey(),'wk'+g.wk);
 var h='<h2 style="margin:6px 0">Next session guide</h2>'+strip(b,g.i);
 if(g.done&&sel==null)return h+'<div class="card"><h3 style="margin-top:0">Block finished</h3><p class="small">That is all six weeks. Plan the next block in Build.</p><button class="btn pri block" data-act="gNext">Plan the next block</button></div>';
 h+=topicHtml(g,b)+panelHtml(g)+qHtml(g);
 h+='<div class="card"><h3 style="margin-top:0">Where to look</h3>'+(LIB.err?'<p class="small muted">The library could not load. Showing what is in the app.</p>':'')+(g.look.top.length?g.look.top.map(lookRow).join(''):'<p class="small muted">Nothing matched yet. Add a link.</p>')+'<div class="row wrap2" style="margin-top:6px">'+(g.look.more.length?'<button class="btn grow" data-act="gMore">'+(V().gml?'Fewer':'More')+'</button>':'')+'<button class="btn grow" data-act="gAdd">+ Add link</button></div>'+(V().gml?g.look.more.map(lookRow).join(''):'')+'</div>';
 h+=pointsHtml(g);
 h+='<div class="card"><button class="btn pri block" style="min-height:54px;font-size:17px" data-act="gDrills">Pick the drills</button><p class="small muted">Opens the builder for this week with the answers above already fed in.</p></div>';
 return h;};

/* ---------- reflect capture ---------- */
function srcFor(r){var b=blockOK();if(!b)return [];var i=weekAt(b,r.sid||r.date),w=b.weeks[i]||{},tid=((planOf(b).filter(function(p){return p.wk===i+1;})[0])||{}).topic,t=tid&&BANK.topics[tid],o=[];
 if(t)t.points.forEach(function(p){o.push(G.shortPoint(p.p));});
 Object.keys(w.s||{}).forEach(function(k){var it=w.s[k];if(it&&it.t){var n=String(it.t).replace(/^(Arrival|Practice [a-z0-9 ]+|The game)\s*[:\-]\s*/i,'').slice(0,40);if(o.indexOf(n)<0)o.push(n);}});
 return o;}
GUI.revCard=function(r){var src=srcFor(r),b=blockOK();
 function chipset(key){var cur=(r[key]&&r[key].chips)||[];return '<div class="chips">'+src.map(function(c){return '<button class="chip'+(cur.indexOf(c)>-1?' on':'')+'" data-act="gSet" data-k="'+key+'" data-v="'+esc(c)+'">'+esc(c)+'</button>';}).join('')+'</div><input data-gn="'+key+'" maxlength="140" placeholder="Short note (140 characters)" value="'+esc((r[key]&&r[key].note)||'')+'">';}
 function who(key){var arr=r[key]||[];function has(k){return arr.some(function(e){return String(e.k)===String(k);});}
  var nums=X.plist().filter(function(p){return p.num;});
  return '<div class="chips">'+G.UNITS.map(function(u){return '<button class="chip'+(has(u)?' on':'')+'" data-act="gWho" data-k="'+key+'" data-v="'+esc(u)+'">'+esc(u)+'</button>';}).join('')+'</div><div class="chips" style="margin-top:4px">'+nums.map(function(p){return '<button class="chip'+(has(p.num)?' on':'')+'" data-act="gWho" data-k="'+key+'" data-v="'+esc(p.num)+'">#'+esc(p.num)+'</button>';}).join('')+'</div>'+arr.map(function(e){return '<input data-gn="'+key+'.'+esc(e.k)+'" maxlength="100" placeholder="Note on '+(/^\d+$/.test(String(e.k))?'#'+esc(e.k):esc(e.k))+'" value="'+esc(e.note||'')+'" style="margin-top:4px">';}).join('');}
 return '<div class="card" style="border-color:var(--amber)"><h3 style="margin-top:0">How the session went</h3><p class="small muted">Coaches only. Shirt numbers and units, never names. Session: '+esc(X.niceDate(r.sid||r.date))+'. Your own review, saved under '+esc(r.by)+'. The other coach writes theirs and the guide shows both.</p>'
  +'<label style="margin-top:0">Did it run?</label><div class="chips"><button class="chip'+(r.ran==='yes'?' on':'')+'" data-act="gSet" data-k="ran" data-v="yes">Yes</button><button class="chip'+(r.ran==='no'?' on':'')+'" data-act="gSet" data-k="ran" data-v="no">No</button></div>'
  +(r.ran==='no'?'<div class="chips" style="margin-top:4px">'+['Weather','Pitch','Numbers','Other'].map(function(w){return '<button class="chip'+(r.why===w?' on':'')+'" data-act="gSet" data-k="why" data-v="'+w+'">'+w+'</button>';}).join('')+'</div>':'')
  +'<label>What went well</label>'+chipset('well')+'<label>What to work on</label>'+chipset('improve')
  +'<label>Who did well (units or shirt numbers)</label>'+who('stood')+'<label>Who struggled (units or shirt numbers)</label>'+who('strug')+'</div>';};

/* ---------- actions ---------- */
function curRev(){var id=V().rv;return id?X.rvAll().filter(function(r){return r.id===id;})[0]:null;}
function viewer(url,ty){var m;
 if(ty==='x'&&(m=String(url).match(/status\/(\d+)/))){var d=document.createElement('div');d.id='lnkview';d.setAttribute('role','dialog');d.style.cssText='position:fixed;inset:0;z-index:2000;background:#000;display:flex;flex-direction:column';
  d.innerHTML='<div style="display:flex;gap:8px;padding:8px;background:#111"><button id="lvx" style="min-height:48px;flex:1;font:inherit;font-weight:700;border-radius:12px;border:1px solid #444;background:#222;color:#fff">Close</button><a href="'+esc(url)+'" target="_blank" rel="noopener" data-ext="1" style="min-height:48px;flex:1;display:flex;align-items:center;justify-content:center;font-weight:700;border-radius:12px;border:1px solid #444;color:#fff;text-decoration:none">Open in browser</a></div><iframe title="X post" src="https://platform.twitter.com/embed/Tweet.html?id='+m[1]+'&dnt=true" style="flex:1;border:0;background:#fff"></iframe>';
  document.body.appendChild(d);d.querySelector('#lvx').onclick=function(){d.remove();};return;}
 try{if(X.show(url))return;}catch(e){}
 window.open(url,'_blank','noopener');}
var A={
 gWeek:function(d){V().gwk=Number(d.i);V().gml=false;X.render(true);},
 gAns:function(d){var i=curI(),a=gdv(i,'ans');if(d.t==='multi'){var l=(a[d.q]||[]).slice(),k=l.indexOf(d.v);if(k>-1)l.splice(k,1);else l.push(d.v);setAns(i,d.q,l);}else setAns(i,d.q,a[d.q]===d.v?'':d.v);X.render(true);},
 gEditTop:function(){V().gtp=!V().gtp;X.render(true);},
 gTopic:function(d){var b=blockOK(),i=curI(),pl=planOf(b);b.plan=pl;var e=pl.filter(function(p){return p.wk===i+1;})[0];if(e)e.topic=d.id;else pl.push({wk:i+1,topic:d.id});ovrSet(i,{});V().gtp=false;save();X.render(true);},
 gEditPts:function(){V().gpe=!V().gpe;X.render(true);},
 gSavePts:function(){var i=curI(),t=(document.getElementById('gpts')||{}).value||'',pts=t.split('\n').map(function(l){var p=l.split('::');return {p:(p[0]||'').trim(),term:(p[1]||'').trim(),means:(p[2]||'').trim()};}).filter(function(p){return p.p;}).slice(0,8);var o=ovrGet(i);o.points=pts;ovrSet(i,o);V().gpe=false;X.render(true);},
 gHide:function(d){var i=curI(),o=ovrGet(i);o.hideLook=(o.hideLook||[]).concat([d.id]);ovrSet(i,o);X.render(true);},
 gMore:function(){V().gml=!V().gml;X.render(true);},
 gAdd:function(){var t=prompt('Title of the link');if(!t)return;var u=prompt('Web address (start with https://)');if(!u||!/^https?:\/\//i.test(u.trim())){X.toast('Needs a web address starting https://');return;}var ty=(prompt('Type: pdf, x, video, masterclass or search','search')||'search').trim().toLowerCase();if(G.TYPE_ORDER.indexOf(ty)<0)ty='search';var i=curI(),o=ovrGet(i);o.addLook=(o.addLook||[]).concat([{title:t.trim().slice(0,100),url:u.trim(),type:ty}]);ovrSet(i,o);X.render(true);},
 gView:function(d){viewer(d.u,d.ty);},
 gCarry:function(d){var i=curI(),c=Object.assign({},gdv(i,'carry')),a=(c.drop||[]).slice(),k=a.indexOf(d.id);if(k>-1)a.splice(k,1);else a.push(d.id);c.drop=a;c.applied=false;gdSet(i,'carry',c);X.render(true);},
 gUse:function(){var i=curI(),c=Object.assign({},gdv(i,'carry'));c.applied=true;gdSet(i,'carry',c);X.toast('Applied to this week');X.render(true);},
 gRan:function(d){var i=curI(),w=wk(i);w.status=d.v;w.ran=d.v==='ran';save();X.render(true);},
 gMove:function(){var i=curI();ensureWB(function(){var b=X.sb();b.week=i;X.ACT.wbMove();});},
 gReset:function(){if(!confirm('Put this week back to the bank values? Your edits and answers for this week go.'))return;var i=curI();gdSet(i,'ans',{});gdSet(i,'ovr',{});gdSet(i,'carry',{});X.toast('Week reset');X.render(true);},
 gDrills:function(){var i=curI(),b=blockOK(),c=clock(),g=G.buildGuide({sb:hydrate(b),revs:X.rvAll(),squad:X.plist().map(function(p){return {num:p.num,pos:X.effPos(p)};}),res:resItems(),shown:{},week:i},BANK,LIB||{items:[]},c.t,c.hm),w=wk(i);
  w.rc={};X.sbSlots(w).forEach(function(sl){w.rc[sl[0]]=[g.seed.rc[0],g.seed.rc[1]];});
  if(g.seed.split)w.split=1;
  w.gtags=g.seed.free;
  if(g.topic.points.length)w.cpB=g.topic.points.map(function(p){return G.shortPoint(p.p);});
  b.week=i;save();V().sbs=3;X.ACT.tab({v:'sb',m:'plan'});},
 gLoad:function(){ensureWB(function(){if(!confirm('This replaces the block you have now. The old one is kept in the block archive. Carry on?'))return;window.WB.loadB3(X.sb());X.render(true);});},
 gNext:function(){V().sbs=1;X.ACT.tab({v:'sb',m:'plan'});},
 gSet:function(d){var r=curRev();if(!r)return;if(d.k==='ran'||d.k==='why'){r[d.k]=r[d.k]===d.v?'':d.v;}else{var o=r[d.k]=r[d.k]||{chips:[],note:''};o.chips=o.chips||[];var j=o.chips.indexOf(d.v);if(j>-1)o.chips.splice(j,1);else o.chips.push(d.v);}X.rvSave(r);X.render(true);},
 gWho:function(d){var r=curRev();if(!r)return;var a=r[d.k]=r[d.k]||[],j=-1;a.forEach(function(e,x){if(String(e.k)===String(d.v))j=x;});if(j>-1)a.splice(j,1);else a.push({k:d.v,note:''});X.rvSave(r);X.render(true);}
};
function curI(){var b=blockOK(),c=clock(),sel=V().gwk;if(sel!=null)return sel;return G.pickWeek(b,BANK,c.t,c.hm).i;}
Object.keys(A).forEach(function(k){X.ACT[k]=A[k];});

/* text inputs: answers, notes (a welfare word stops the note being saved) */
document.addEventListener('change',function(e){var t=e.target;if(!t||!t.dataset)return;
 if(t.dataset.gq){setAns(curI(),t.dataset.gq,t.value.trim().slice(0,120));X.render(true);return;}
 if(t.dataset.gn){var r=curRev();if(!r)return;var v=t.value.trim();
  if(G.welfareHit(v)){t.value='';X.toast('That sounds like a welfare matter. Tell the club welfare officer. It does not belong in here.');return;}
  var p=t.dataset.gn.split('.');
  if(p.length===1){r[p[0]]=r[p[0]]||{chips:[]};r[p[0]].note=v.slice(0,140);}
  else{(r[p[0]]||[]).forEach(function(en){if(String(en.k)===p.slice(1).join('.'))en.note=v.slice(0,100);});}
  X.rvSave(r);}});
})();
