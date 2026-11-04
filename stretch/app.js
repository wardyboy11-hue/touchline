/* Touchline stretching player, release 84. No player data, works offline once loaded. */
(function(){
var S=STRETCH,IT=S.items,$=function(i){return document.getElementById(i);},vo=$('vo');
var SEG=[{k:'welcome',d:Math.ceil(S.welcome.d+1)}];IT.forEach(function(x,i){SEG.push({k:'intro',i:i,d:x.intro});SEG.push({k:'hold',i:i,d:x.secs});});SEG.push({k:'done',d:Math.ceil(S.finish.d+1)});
var st=0;SEG.forEach(function(s){s.t0=st;st+=s.d;});var TOTAL=st;
function mmss(s){s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+('0'+s%60).slice(-2);}
function sideTxt(x){return x.side==='L'?'Left':x.side==='R'?'Right':'';}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
/* list */
$('cnt').textContent=IT.length;$('total').textContent=mmss(TOTAL)+' total';
$('items').innerHTML=IT.map(function(x,i){return '<li data-i="'+i+'"><div class="th"><img src="img/'+x.pose+'_t.webp?v=84" alt=""'+(x.side==='R'?' class="mr"':'')+'></div><div class="nm">'+esc(x.name)+(x.side?' <span class="sd">'+sideTxt(x)+'</span>':'')+'</div><div class="tm">'+mmss(x.secs)+'</div></li>';}).join('');
/* state */
var t=0,playing=false,last=0,how=false,fired={},ac=null,cur=-1;
function segAt(tt){for(var i=SEG.length-1;i>=0;i--)if(tt>=SEG[i].t0)return i;return 0;}
function beep(){try{if(!ac)return;var o=ac.createOscillator(),g=ac.createGain();o.frequency.value=880;g.gain.setValueAtTime(.18,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.35);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+.36);}catch(e){}}
function say(a,off){if(window.__silent)return;vo.src='audio/'+a+'.mp3?v=84';try{vo.currentTime=off||0;}catch(e){}var p=vo.play();if(p&&p.catch)p.catch(function(){});}
function cues(si,local){var s=SEG[si],key;
 function once(k,f){key=si+':'+k;if(!fired[key]){fired[key]=1;f();}}
 if(s.k==='welcome')once('w',function(){say('welcome');});
 if(s.k==='done')once('f',function(){say('finish');});
 if(s.k==='intro')once('i',function(){if(local<IT[s.i].ad-.5)say(IT[s.i].a,local);});
 if(s.k==='hold'){once('b',beep);var x=IT[s.i];if(x.mid&&local>=x.secs/2)once('m',function(){say('switch');});
  var cs=s.d-S.count.d+.25;if(local>=cs&&local<s.d-.2)once('c',function(){say('count',local-cs);});}
}
function render(){
 var si=segAt(t),s=SEG[si],local=t-s.t0,rem=s.d-local,ix=s.i!=null?s.i:(s.k==='welcome'?0:IT.length-1),x=IT[ix];
 var pl=playing||window.__rec,mode=(s.k==='hold'&&!how&&pl)?'hold':'demo';
 var fk=s.k==='done'?'done':x.pose+x.side,fg=$('fig');
 if(fg.dataset.k!==fk){fg.dataset.k=fk;fg.innerHTML=s.k==='done'?'<div class="wd">Well done!</div>':'<img id="pimg" src="img/'+x.pose+'.webp?v=84" alt="'+esc(x.name)+' demo">';}
 var pi=$('pimg');if(pi&&s.k!=='done'){var z=mode==='hold'?1.03+.05*Math.min(1,local/s.d):1.03+.03*Math.sin(t*.9);pi.style.transform='scale('+(x.side==='R'?-z:z)+','+z+')';}
 var ph=$('phase');ph.className='phase'+(s.k==='hold'?' hold':'');ph.textContent=s.k==='welcome'?'Get ready':s.k==='intro'?(ix&&IT[ix-1].id===x.id?'Switch':'Next up'):s.k==='hold'?'Hold':'Finished';
 $('pname').textContent=s.k==='done'?'All done':x.name;$('pside').textContent=s.k==='done'?'':sideTxt(x)+(x.side?' side':'');
 var ck=$('clock');ck.textContent=s.k==='hold'&&rem<=3.2&&rem>0.2?String(Math.ceil(rem-.2)):mmss(rem);ck.className='big'+(s.k==='hold'?' go':'');
 $('prog').style.width=(100*t/TOTAL).toFixed(1)+'%';$('pos').textContent=(s.k==='done'?IT.length:ix+1)+' of '+IT.length;$('left').textContent=mmss(TOTAL-t)+' left';
 var nx=s.k==='hold'?IT[ix+1]:null;$('upnext').textContent=nx?'Up next: '+nx.name+(nx.side?' ('+sideTxt(nx)+')':''):'';
 $('pp').textContent=pl?'Pause':(t>=TOTAL?'Start again':'Play');
 if(cur!==ix*10+(s.k==='done'?9:0)){cur=ix*10+(s.k==='done'?9:0);$('info').innerHTML=s.k==='done'?'<h4>Nice one</h4><p>Water, food and a good sleep. Sleep is when you grow and recover.</p>':
  '<h4>How to do it</h4><ul>'+x.how.map(function(h){return '<li>'+esc(h)+'</li>';}).join('')+'</ul><h4>Why for football</h4><p>'+esc(x.why)+'</p><h4>Also good for you</h4><p>'+esc(x.more)+'</p>'+(x.note?'<p class="small muted" style="margin-top:6px">⚠️ '+esc(x.note)+'</p>':'');}
 return {si:si,local:local};
}
function tick(now){if(!playing)return;var dt=Math.min(.25,(now-last)/1000);last=now;t+=dt;if(t>=TOTAL){t=TOTAL;playing=false;}var r=render();cues(r.si,r.local);requestAnimationFrame(tick);}
function anim(){if(playing)return;render();if(document.body.classList.contains('playing'))setTimeout(function(){requestAnimationFrame(anim);},60);}
function play(){if(t>=TOTAL){t=0;fired={};}if(!ac){try{ac=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(ac&&ac.resume)ac.resume();
 playing=true;how=false;last=performance.now();var si=segAt(t),s=SEG[si],l=t-s.t0;
 if(vo.src&&vo.paused&&vo.currentTime>0&&!vo.ended){var p=vo.play();if(p&&p.catch)p.catch(function(){});}
 render();requestAnimationFrame(tick);}
function pause(){playing=false;vo.pause();anim();}
function jump(nt){vo.pause();vo.removeAttribute('src');t=Math.max(0,Math.min(TOTAL,nt));fired={};var si=segAt(t);for(var k in fired);if(playing){last=performance.now();var r=render();cues(r.si,r.local);}else anim();}
function itemStart(i){return SEG[1+2*i].t0;}
function curItem(){var s=SEG[segAt(t)];return s.k==='welcome'?-1:s.k==='done'?IT.length:s.i;}
function open(i){document.body.classList.add('playing');window.scrollTo(0,0);jump(i==null?0:itemStart(i));play();}
function toList(){pause();document.body.classList.remove('playing');}
$('start').onclick=function(){open(null);};
$('items').onclick=function(e){var li=e.target.closest('li');if(li)open(+li.dataset.i);};
$('pp').onclick=function(){playing?pause():play();};
$('back').onclick=function(){var i=curItem(),s=SEG[segAt(t)];if(i>0&&t-s.t0<2&&s.k==='intro')i--;jump(i<0?0:itemStart(Math.min(i,IT.length-1)));};
$('nxt').onclick=function(){var i=curItem()+1;jump(i>=IT.length?SEG[SEG.length-1].t0:itemStart(i));};
$('demo').onclick=function(){if(playing){pause();}how=true;anim();};
$('tolist').onclick=toList;
function close(){if(document.body.classList.contains('playing')){toList();return;}var b=new URLSearchParams(location.search).get('back');if(b&&/^\/[\w\/.-]*$/.test(b))location.href=b;else if(history.length>1)history.back();else location.href='../family.html';}
$('close').onclick=close;
document.addEventListener('keydown',function(e){if(e.key==='Escape')close();else if(e.key===' '&&document.body.classList.contains('playing')){e.preventDefault();$('pp').click();}else if(e.key==='ArrowRight')$('nxt').click();else if(e.key==='ArrowLeft')$('back').click();});
document.addEventListener('visibilitychange',function(){if(document.hidden&&playing)pause();});
/* preview hook: draw any moment without audio */
window.__at=function(nt){document.body.classList.add('playing');playing=false;t=nt;cur=-1;render();return {seg:SEG[segAt(t)].k};};
window.__seg=SEG;window.__total=TOTAL;
if('serviceWorker' in navigator)navigator.serviceWorker.register('ssw.js',{scope:'./'}).catch(function(){});
})();
