/* Touchline stretching player, release 95.
 * One timeline drives voice and visuals. Clips are preloaded. A segment timer starts on audio 'playing'.
 * Hold at least 15s. 15s rest between stretches with relax cue and badge countdown.
 * Tap image for how-to panel with slowed demo. Big Pause. Offline via ssw.js.
 * No player data leaves this page (pregame may read tl.prestretch from localStorage only). */
(function(){
var S=STRETCH,IT=S.items,$=function(i){return document.getElementById(i);},vo=$('vo');
var HOLD_MIN=15,REST=15,V='96';
var PRE=false;
(function(){
 var q=new URLSearchParams(location.search),mode=q.get('mode')||'';
 if(mode!=='pregame')return;
 PRE=true;
 var prog=null;try{prog=JSON.parse(localStorage.getItem('tl.prestretch')||'null');}catch(e){}
 var ids=(prog&&prog.ids)||['flexor','ham','calf','twist'];
 var hold=Math.max(HOLD_MIN,Math.min(20,(prog&&prog.hold)||HOLD_MIN));
 var want={};ids.forEach(function(id){want[id]=1;});
 var filtered=[],seen={};
 S.items.forEach(function(x){
  if(!want[x.id]||x.id==='wall')return;
  var key=x.id+(x.side||'');
  if(seen[key])return;seen[key]=1;
  var y={};for(var k in x)y[k]=x[k];
  y.secs=hold;y.intro=Math.max(6,Math.min(12,y.ad?Math.ceil(y.ad+1):8));
  filtered.push(y);
 });
 if(!filtered.length){
  ['flexor','ham','calf'].forEach(function(id){
   S.items.forEach(function(x){if(x.id===id&&!filtered.some(function(f){return f.id===id&&f.side===x.side;})){var y={};for(var k in x)y[k]=x[k];y.secs=hold;y.intro=8;filtered.push(y);}});
  });
 }
 /* Keep pre-game short: up to 4 stretch slots (L/R count separately). */
 IT=filtered.slice(0,4);S.items=IT;
 S.welcome={a:'welcome',d:Math.min(8,S.welcome.d||8)};
 S.finish={a:'finish',d:Math.min(6,S.finish.d||6)};
 try{
  var tag=document.querySelector('header h1');
  if(tag){tag.innerHTML='Pre-game stretch<small id="hdr-len"></small>';}
  var h2=document.querySelector('#list h2');if(h2)h2.textContent='Pre-game stretch';
  var lead=document.querySelector('#list .card p.muted');
  if(lead)lead.textContent='Short match-day warm-up. Weighted to the areas you picked. If it hurts, stop and tell a coach.';
  document.title='Pre-game stretch | Wigan Junior Latics U15 Blues';
 }catch(e){}
})();

/* Ensure minimum holds on cool-down too */
IT.forEach(function(x){if(x.secs<HOLD_MIN)x.secs=HOLD_MIN;});

function buildSeg(){
 var seg=[{k:'welcome',d:Math.ceil((S.welcome&&S.welcome.d)||6)+1,a:'welcome'}];
 IT.forEach(function(x,i){
  seg.push({k:'intro',i:i,d:Math.max(6,x.intro||Math.ceil((x.ad||5)+1.5)),a:x.a});
  seg.push({k:'hold',i:i,d:Math.max(HOLD_MIN,x.secs||HOLD_MIN)});
  if(i<IT.length-1)seg.push({k:'rest',i:i,d:REST,a:'relax',next:i+1});
 });
 seg.push({k:'done',d:Math.ceil((S.finish&&S.finish.d)||5)+1,a:'finish'});
 var st=0;seg.forEach(function(s){s.t0=st;st+=s.d;});return {seg:seg,total:st};
}
var built=buildSeg(),SEG=built.seg,TOTAL=built.total;
function mmss(s){s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+('0'+s%60).slice(-2);}
function sideTxt(x){return x.side==='L'?'Left':x.side==='R'?'Right':'';}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function poseSrc(pose,kind){
 return 'img/'+pose+(kind==='start'?'_s':'')+'.webp?v='+V;
}
function vidSrc(pose,ext){return 'vid/'+pose+'.'+ext+'?v='+V;}
function hasStart(pose){return !!window.__stretchStarts&&window.__stretchStarts[pose];}
function hasVid(pose){return !!window.__stretchVids&&window.__stretchVids[pose];}
function vidHtml(pose,side,opts){
 opts=opts||{};
 var flip=side==='R'?' mr':'';
 var loop=opts.loop?' loop':'';
 var rate=opts.rate!=null?opts.rate:1;
 var cls='stretch-vid'+flip+(opts.cls?' '+opts.cls:'');
 return '<video class="'+cls+'" playsinline muted'+loop+' preload="auto" poster="'+poseSrc(pose,'')+'" data-pose="'+pose+'" data-rate="'+rate+'">'+
  '<source src="'+vidSrc(pose,'webm')+'" type="video/webm">'+
  '<source src="'+vidSrc(pose,'mp4')+'" type="video/mp4">'+
  '</video>';
}
function syncVid(mode){
 var v=document.querySelector('#fig video.stretch-vid');
 if(!v)return;
 try{
  var rate=parseFloat(v.getAttribute('data-rate')||'1')||1;
  if(mode==='howto'){v.playbackRate=0.5;v.loop=true;if(v.paused){var p=v.play();if(p&&p.catch)p.catch(function(){});}}
  else if(mode==='hold'){
   v.playbackRate=1;v.loop=true;
   /* Prefer looping the last ~40% (the hold). */
   if(v.duration&&isFinite(v.duration)){var start=Math.max(0,v.duration*0.55);if(v.currentTime<start)v.currentTime=start;}
   if(v.paused&&!howOpen&&playing){var p2=v.play();if(p2&&p2.catch)p2.catch(function(){});}
  }
  else if(mode==='intro'){
   v.playbackRate=1;v.loop=false;
   if(v.paused&&playing&&!howOpen){var p3=v.play();if(p3&&p3.catch)p3.catch(function(){});}
   v.onended=function(){try{v.pause();if(v.duration)v.currentTime=Math.max(0,v.duration-0.05);}catch(e){}};
  }
  else if(mode==='pause'){v.pause();}
 }catch(e){}
}

$('cnt').textContent=IT.length;$('total').textContent=mmss(TOTAL)+' total';
try{var hl=$('hdr-len');if(hl)hl.textContent=mmss(TOTAL)+' · If it hurts, stop and tell a coach';
 var lead2=document.querySelector('#list .card p.muted');
 if(PRE&&lead2){/* already set */}
 else{
  var tip=document.querySelector('#list .tot');
 }
 var listLead=document.querySelector('#list .card p.muted');
 if(!PRE&&listLead)listLead.textContent='After training or a match. Each stretch is held at least 15 seconds, with a 15 second rest between. Voice and pictures stay in step.';
}catch(e){}

$('items').innerHTML=IT.map(function(x,i){
 return '<li data-i="'+i+'"><div class="th"><img src="img/'+x.pose+'_t.webp?v='+V+'" alt=""'+(x.side==='R'?' class="mr"':'')+'></div><div class="nm">'+esc(x.name)+(x.side?' <span class="sd">'+sideTxt(x)+'</span>':'')+'</div><div class="tm">'+mmss(x.secs)+'</div></li>';
}).join('');

/* Preload audio clips into a map. Playback starts, then the segment clock starts on 'playing'. */
var clips={},readyN=0,readyNeed=0;
function clipKey(a){return a||'';}
function preload(){
 var names={'welcome':1,'finish':1,'count':1,'switch':1,'relax':1};
 IT.forEach(function(x){if(x.a)names[x.a]=1;});
 var list=Object.keys(names);readyNeed=list.length;readyN=0;
 list.forEach(function(n){
  var a=new Audio('audio/'+n+'.mp3?v='+V);a.preload='auto';
  clips[n]=a;
  var done=function(){if(a.__ok)return;a.__ok=1;readyN++;if(readyN>=readyNeed){var b=$('start');if(b&&!b.__lab){b.__lab=1;b.textContent='Start';}}};
  a.addEventListener('canplaythrough',done);a.addEventListener('loadeddata',done);
  try{a.load();}catch(e){done();}
 });
}
preload();

var t=0,playing=false,last=0,how=false,fired={},ac=null,cur=-1,segClock=0,awaitingAudio=false,raf=0;
var howOpen=false,pauseBtnBig=true;

function segAt(tt){for(var i=SEG.length-1;i>=0;i--)if(tt>=SEG[i].t0)return i;return 0;}
function beep(){try{if(!ac)return;var o=ac.createOscillator(),g=ac.createGain();o.frequency.value=880;g.gain.setValueAtTime(.18,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.35);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+.36);}catch(e){}}

function stopVo(){Object.keys(clips).forEach(function(k){try{clips[k].pause();clips[k].currentTime=0;}catch(e){}});try{vo.pause();vo.removeAttribute('src');}catch(e){}}

function playClip(name,off,onPlaying){
 if(window.__silent){if(onPlaying)onPlaying();return null;}
 var a=clips[name];
 if(!a){a=new Audio('audio/'+name+'.mp3?v='+V);clips[name]=a;}
 try{a.pause();a.currentTime=off||0;}catch(e){}
 var started=false;
 function go(){if(started)return;started=true;if(onPlaying)onPlaying();}
 a.onplaying=go;
 var p=a.play();
 if(p&&p.then)p.then(function(){/* playing event should fire */}).catch(function(){go();});
 /* Safety: if playing never fires (autoplay quirks), unstick after 400ms */
 setTimeout(function(){if(!started&&!a.paused)go();else if(!started)go();},450);
 return a;
}

function badgeHtml(rem,total){
 var n=15,left=Math.max(0,Math.ceil(rem)),gone=n-Math.min(n,left);
 var segs='';
 for(var i=0;i<n;i++){
  var a=(-90+i*(360/n))*Math.PI/180,b=(-90+(i+1)*(360/n))*Math.PI/180;
  var r=42,cx=50,cy=50;
  var x1=cx+r*Math.cos(a),y1=cy+r*Math.sin(a),x2=cx+r*Math.cos(b),y2=cy+r*Math.sin(b);
  var on=i>=gone;
  segs+='<path d="M'+x1.toFixed(2)+' '+y1.toFixed(2)+' A'+r+' '+r+' 0 0 1 '+x2.toFixed(2)+' '+y2.toFixed(2)+'" fill="none" stroke="'+(on?'#FFB81C':'#334155')+'" stroke-width="6" stroke-linecap="round" opacity="'+(on?1:0.35)+'"/>';
 }
 return '<div class="restwrap"><img class="restbadge" src="../badge.png" alt="Club badge"><svg class="restclock" viewBox="0 0 100 100" aria-hidden="true">'+segs+'</svg><div class="restnum">'+left+'</div><div class="restlab">Relax · next stretch loading</div></div>';
}

function figFor(s,local,x){
 if(s.k==='done')return '<div class="wd">Well done!</div>';
 if(s.k==='rest'){
  var nx=IT[s.next];
  var prev='';
  if(nx){
   if(hasVid(nx.pose))prev='<div class="restprev">'+vidHtml(nx.pose,nx.side,{loop:1,cls:'mini'})+'<span>Next: '+esc(nx.name)+(nx.side?' ('+sideTxt(nx)+')':'')+'</span></div>';
   else prev='<div class="restprev"><img src="img/'+nx.pose+'_t.webp?v='+V+'" alt=""'+(nx.side==='R'?' class="mr"':'')+'><span>Next: '+esc(nx.name)+(nx.side?' ('+sideTxt(nx)+')':'')+'</span></div>';
  }
  return badgeHtml(s.d-local,s.d)+prev;
 }
 var pose=x.pose,flip=x.side==='R'?' mr':'';
 if(hasVid(pose)&&(s.k==='intro'||s.k==='hold'||s.k==='welcome')){
  return vidHtml(pose,x.side,{loop:s.k==='hold'?1:0});
 }
 /* Fallback stills / crossfade if a clip is missing */
 var start=hasStart(pose);
 if(s.k==='intro'||s.k==='welcome'){
  if(start){
   var p=Math.min(1,local/Math.max(1,s.d*0.7));
   return '<div class="anim"><img class="a0" src="'+poseSrc(pose,'start')+'" alt="" style="opacity:'+(1-p).toFixed(3)+'"><img class="a1'+flip+'" src="img/'+pose+'.webp?v='+V+'" alt="'+esc(x.name)+'" style="opacity:'+p.toFixed(3)+'"></div>';
  }
  return '<img id="pimg" class="pulsein'+flip+'" src="img/'+pose+'.webp?v='+V+'" alt="'+esc(x.name)+' demo">';
 }
 if(start){
  var ph=(Math.sin(local*1.2)+1)/2;
  return '<div class="anim holdanim"><img class="a0" src="'+poseSrc(pose,'start')+'" alt="" style="opacity:'+(0.15+0.1*ph).toFixed(3)+'"><img class="a1'+flip+'" src="img/'+pose+'.webp?v='+V+'" alt="'+esc(x.name)+'" style="opacity:'+(0.85-0.05*ph).toFixed(3)+'"></div>';
 }
 return '<img id="pimg" class="breathe'+flip+'" src="img/'+pose+'.webp?v='+V+'" alt="'+esc(x.name)+' demo">';
}

function render(){
 var si=segAt(t),s=SEG[si],local=Math.max(0,t-s.t0),rem=Math.max(0,s.d-local);
 var ix=s.i!=null?s.i:(s.k==='welcome'?0:IT.length-1),x=IT[Math.max(0,Math.min(IT.length-1,ix))];
 var pl=playing||window.__rec;
 var fk=s.k+':'+(x?x.pose:'')+(x?x.side:'')+':'+(s.next||'')+':'+(howOpen?'h':'');
 var fg=$('fig');
 var needPaint=fg.dataset.k!==fk;
 if(s.k==='rest'){
  /* Update rest countdown each tick */
  needPaint=true;fk=fk+':'+Math.ceil(rem);
 }
 if(needPaint){
  fg.dataset.k=fk;
  fg.innerHTML=figFor(s,local,x);
  if(s.k==='rest'){
   var pv=fg.querySelector('video.stretch-vid');
   if(pv){try{pv.muted=true;pv.playbackRate=1;pv.loop=true;var pp=pv.play();if(pp&&pp.catch)pp.catch(function(){});}catch(e){}}
  }
 }
 if(!howOpen){
  if(s.k==='intro'||s.k==='welcome')syncVid('intro');
  else if(s.k==='hold')syncVid(playing?'hold':'pause');
  else if(s.k!=='rest')syncVid('pause');
 }
 var ph=$('phase');
 ph.className='phase'+(s.k==='hold'?' hold':s.k==='rest'?' rest':'');
 ph.textContent=s.k==='welcome'?'Get ready':s.k==='intro'?(ix&&IT[ix-1]&&IT[ix-1].id===x.id?'Switch':'Next up'):s.k==='hold'?'Hold':s.k==='rest'?'Relax':'Finished';
 $('pname').textContent=s.k==='done'?'All done':s.k==='rest'?'Rest':x.name;
 $('pside').textContent=s.k==='done'||s.k==='rest'?'':sideTxt(x)+(x.side?' side':'');
 var ck=$('clock');
 if(s.k==='rest'){ck.textContent=String(Math.ceil(rem));ck.className='big restc';}
 else if(s.k==='hold'&&rem<=3.2&&rem>0.2){ck.textContent=String(Math.ceil(rem-.2));ck.className='big go';}
 else{ck.textContent=mmss(rem);ck.className='big'+(s.k==='hold'?' go':'');}
 $('prog').style.width=(100*t/TOTAL).toFixed(1)+'%';
 $('pos').textContent=(s.k==='done'?IT.length:(ix+1))+' of '+IT.length;
 $('left').textContent=mmss(TOTAL-t)+' left';
 var nx=null;
 if(s.k==='hold'&&ix+1<IT.length)nx=IT[ix+1];
 if(s.k==='rest')nx=IT[s.next];
 if(s.k==='intro'&&ix+1<IT.length){/* keep current */}
 $('upnext').textContent=nx?'Up next: '+nx.name+(nx.side?' ('+sideTxt(nx)+')':''):(s.k==='rest'?'':'');
 $('pp').textContent=pl?'Pause':(t>=TOTAL?'Start again':'Play');
 if(cur!==ix*10+(s.k==='done'?9:s.k==='rest'?8:0)+ (howOpen?100:0)){
  cur=ix*10+(s.k==='done'?9:s.k==='rest'?8:0)+(howOpen?100:0);
  if(s.k==='done')$('info').innerHTML='<h4>Nice one</h4><p>Water, food and a good sleep. Sleep is when you grow and recover.</p>';
  else if(s.k==='rest')$('info').innerHTML='<h4>Rest</h4><p>Breathe out and relax. The next stretch is loading.</p>';
  else $('info').innerHTML='<h4>How to do it</h4><ul>'+x.how.map(function(h){return '<li>'+esc(h)+'</li>';}).join('')+'</ul><h4>Why for football</h4><p>'+esc(x.why)+'</p><h4>Also good for you</h4><p>'+esc(x.more)+'</p>'+(x.note?'<p class="small muted" style="margin-top:6px">⚠️ '+esc(x.note)+'</p>':'');
 }
 return {si:si,local:local,s:s,x:x};
}

function cues(si,local){
 var s=SEG[si],key;
 function once(k,f){key=si+':'+k;if(!fired[key]){fired[key]=1;f();}}
 if(s.k==='welcome')once('w',function(){awaitingAudio=true;playClip('welcome',0,function(){awaitingAudio=false;});});
 if(s.k==='done')once('f',function(){awaitingAudio=true;playClip('finish',0,function(){awaitingAudio=false;});});
 if(s.k==='intro')once('i',function(){
  awaitingAudio=true;
  playClip(IT[s.i].a,0,function(){awaitingAudio=false;});
 });
 if(s.k==='rest')once('r',function(){
  awaitingAudio=true;
  playClip('relax',0,function(){awaitingAudio=false;});
 });
 if(s.k==='hold'){
  once('b',beep);
  var x=IT[s.i];
  if(x.mid&&local>=x.secs/2)once('m',function(){playClip('switch',0);});
  var cs=s.d-((S.count&&S.count.d)||2)+.25;
  if(local>=cs&&local<s.d-.2)once('c',function(){playClip('count',Math.max(0,local-cs));});
 }
}

function tick(now){
 if(!playing)return;
 if(awaitingAudio){last=now;raf=requestAnimationFrame(tick);return;}
 var dt=Math.min(.25,(now-last)/1000);last=now;t+=dt;
 if(t>=TOTAL){t=TOTAL;playing=false;}
 var r=render();cues(r.si,r.local);
 raf=requestAnimationFrame(tick);
}
function animIdle(){if(playing)return;render();if(document.body.classList.contains('playing'))setTimeout(function(){requestAnimationFrame(animIdle);},80);}

function play(){
 if(t>=TOTAL){t=0;fired={};}
 if(!ac){try{ac=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}
 if(ac&&ac.resume)ac.resume();
 howOpen=false;closeHow();
 playing=true;last=performance.now();
 var r=render();cues(r.si,r.local);
 cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);
}
function pause(){playing=false;Object.keys(clips).forEach(function(k){try{clips[k].pause();}catch(e){}});syncVid('pause');animIdle();}
function jump(nt){
 stopVo();awaitingAudio=false;t=Math.max(0,Math.min(TOTAL,nt));fired={};
 if(playing){last=performance.now();var r=render();cues(r.si,r.local);}
 else animIdle();
}
function itemStart(i){for(var n=0;n<SEG.length;n++)if(SEG[n].k==='intro'&&SEG[n].i===i)return SEG[n].t0;return 0;}
function curItem(){var s=SEG[segAt(t)];return s.k==='welcome'?-1:s.k==='done'?IT.length:s.i;}
function open(i){document.body.classList.add('playing');window.scrollTo(0,0);jump(i==null?0:itemStart(i));play();}
function toList(){pause();closeHow();document.body.classList.remove('playing');}

/* How-to panel: tap image pauses and shows steps + slowed demo */
function openHow(){
 if(howOpen)return;
 howOpen=true;pause();
 var s=SEG[segAt(t)],ix=s.i!=null?s.i:0,x=IT[Math.max(0,Math.min(IT.length-1,ix))];
 var ov=$('howto');if(!ov)return;
 ov.hidden=false;
 var demo='';
 if(hasVid(x.pose))demo=vidHtml(x.pose,x.side,{loop:1,rate:0.5,cls:'howto'});
 else if(hasStart(x.pose))demo='<img class="hs" src="'+poseSrc(x.pose,'start')+'" alt=""><img class="he'+(x.side==='R'?' mr':'')+'" src="img/'+x.pose+'.webp?v='+V+'" alt="">';
 else demo='<img src="img/'+x.pose+'.webp?v='+V+'" alt=""'+(x.side==='R'?' class="mr"':'')+'>';
 ov.innerHTML='<div class="howto-in" role="dialog" aria-label="How to do this stretch">'+
  '<h3 style="margin-top:0">'+esc(x.name)+(x.side?' · '+sideTxt(x):'')+'</h3>'+
  '<div class="howto-demo'+(hasVid(x.pose)||hasStart(x.pose)?' has-anim':'')+'">'+demo+'</div>'+
  '<h4>Steps</h4><ol>'+x.how.map(function(h){return '<li>'+esc(h)+'</li>';}).join('')+'</ol>'+
  '<h4>What you should feel</h4><p>'+esc(x.why)+'</p>'+
  '<h4>Common mistakes</h4><ul><li>Do not bounce or force the stretch.</li><li>Stop if you feel sharp pain and tell a coach.</li>'+(x.note?'<li>'+esc(x.note)+'</li>':'')+'</ul>'+
  '<button type="button" class="btn pri block" id="howto-close">Close and resume</button>'+
  '</div>';
 ov.querySelector('#howto-close').onclick=function(){closeHow();play();};
 var hv=ov.querySelector('video.stretch-vid');if(hv){try{hv.muted=true;hv.playbackRate=0.5;hv.loop=true;var hp=hv.play();if(hp&&hp.catch)hp.catch(function(){});}catch(e){}}
}
function closeHow(){howOpen=false;var ov=$('howto');if(ov){ov.hidden=true;ov.innerHTML='';}}

$('start').onclick=function(){open(null);};
$('items').onclick=function(e){var li=e.target.closest('li');if(li)open(+li.dataset.i);};
$('pp').onclick=function(){playing?pause():play();};
$('back').onclick=function(){var i=curItem(),s=SEG[segAt(t)];if(i>0&&t-s.t0<2&&s.k==='intro')i--;jump(i<0?0:itemStart(Math.min(i,IT.length-1)));};
$('nxt').onclick=function(){var i=curItem()+1;jump(i>=IT.length?SEG[SEG.length-1].t0:itemStart(i));};
$('demo').onclick=function(){openHow();};
$('fig').addEventListener('click',function(e){e.stopPropagation();openHow();});
$('tolist').onclick=toList;
function close(){if(howOpen){closeHow();return;}if(document.body.classList.contains('playing')){toList();return;}var b=new URLSearchParams(location.search).get('back');if(b&&/^\/[\w\/.-]*$/.test(b))location.href=b;else if(history.length>1)history.back();else location.href='../family.html';}
$('close').onclick=close;
document.addEventListener('keydown',function(e){
 if(e.key==='Escape')close();
 else if(e.key===' '&&document.body.classList.contains('playing')){e.preventDefault();$('pp').click();}
 else if(e.key==='ArrowRight')$('nxt').click();
 else if(e.key==='ArrowLeft')$('back').click();
});
document.addEventListener('visibilitychange',function(){if(document.hidden&&playing)pause();});

/* Which start-pose images exist (filled by build or a tiny manifest) */
window.__stretchStarts=window.__stretchStarts||{};
window.__stretchVids=window.__stretchVids||{};
(function(){
 var poses={};IT.forEach(function(x){poses[x.pose]=1;});
 Object.keys(poses).forEach(function(p){
  var im=new Image();im.onload=function(){window.__stretchStarts[p]=1;};im.onerror=function(){};im.src=poseSrc(p,'start');
  var v=document.createElement('video');v.preload='auto';v.muted=true;v.playsInline=true;
  v.onloadeddata=function(){window.__stretchVids[p]=1;};
  v.onerror=function(){};
  v.src=vidSrc(p,'mp4');
  try{v.load();}catch(e){}
 });
})();

window.__at=function(nt){document.body.classList.add('playing');playing=false;awaitingAudio=false;t=nt;cur=-1;render();return {seg:SEG[segAt(t)].k};};
window.__seg=SEG;window.__total=TOTAL;window.__holdMin=HOLD_MIN;window.__rest=REST;
window.__buildSeg=buildSeg;
if('serviceWorker' in navigator)navigator.serviceWorker.register('ssw.js',{scope:'./'}).catch(function(){});
})();
