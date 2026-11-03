(function(){
/* Touchline animation player, r83.
   One practice (window.PRACTICE) or a whole session (window.SESSION = {slug,title,phases:[practice,...]}).
   r83: Play is ready as soon as the first voice line is in, the rest load in the background (retry once),
   a Close button and the Esc key always get you out, and the session has a phase list to jump to. */
const SS=window.SESSION||{slug:window.PRACTICE.slug,title:window.PRACTICE.title,phases:[window.PRACTICE]};
const PH=SS.phases,MULTI=PH.length>1;
const Q=new URLSearchParams(location.search),RENDER=Q.has('render');
const cv=document.getElementById('cv');const ctx=cv.getContext('2d');
const W=1280,H=720;cv.width=W;cv.height=H;
const COL={R:'#e53935',B:'#1e88e5',Y:'#fdd835',K:'#8e24aa'};
const clone=o=>JSON.parse(JSON.stringify(o));
const LINES=[];/* every voice line in time order: {t0,win,dur,url} */
let T=0;
PH.forEach((P,pi)=>{
  const AD=P.audio||null;P._t0=T;P.INTRO=AD?Math.max(5,AD[0]+0.8):5;P.OUTRO=MULTI?7:8;
  const base=P.abase||('audio/'+P.slug+'/');
  let pos={};P.players.forEach(p=>pos[p.id]=[p.x,p.y]);
  P.team={};P.players.forEach(p=>P.team[p.id]=p.team);
  let ball={holder:P.ball,pt:null};const segs=[];let t=P.INTRO;
  P.steps.forEach((s,i)=>{
    const start=clone(pos),end=clone(pos);for(const k in (s.moves||{}))end[k]=s.moves[k];
    const dd=AD&&AD[i+1]?Math.max(4,AD[i+1]+1.0):s.dur;
    const seg={t0:t,t1:t+dd,s,start,end,h0:ball.holder,pt0:ball.pt,i};
    if(s.pass){seg.kind='pass';seg.to=s.pass;ball={holder:s.pass,pt:null};}
    else if(s.shoot){seg.kind='shoot';seg.pt=s.shoot;ball={holder:null,pt:s.shoot};}
    else seg.kind='carry';
    seg.h1=ball.holder;seg.pt1=ball.pt;segs.push(seg);pos=end;t+=dd;});
  P.segs=segs;P.LEN=t+P.OUTRO;
  if(AD){LINES.push({t0:T,win:P.INTRO,dur:AD[0],url:base+(P.apre||'')+'0.mp3'});
    segs.forEach((s,i)=>LINES.push({t0:T+s.t0,win:s.t1-s.t0,dur:AD[i+1]||0,url:base+(P.apre||'')+(i+1)+'.mp3'}));}
  T+=P.LEN;P._t1=T;});
const TOTAL=T,HASV=LINES.length>0;
const STEPS=[];PH.forEach(P=>{STEPS.push(P._t0);P.segs.forEach(s=>STEPS.push(P._t0+s.t0));STEPS.push(P._t0+P.LEN-P.OUTRO);});
let P=PH[0],sc,ox,oy;
function use(ph){P=ph;const top=84,bot=H-134,margin=40;sc=Math.min((W-2*margin)/P.L,(bot-top)/P.W);ox=(W-P.L*sc)/2;oy=top+((bot-top)-P.W*sc)/2;}
use(P);
const X=x=>ox+x*sc,Y=y=>oy+y*sc;
const ease=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
function wrap(t,x,y,w,lh,font,color){ctx.font=font;ctx.fillStyle=color;ctx.textAlign='left';const words=t.split(' ');let line='',n=0;
  for(const wd of words){const test=line?line+' '+wd:wd;if(ctx.measureText(test).width>w&&line){ctx.fillText(line,x,y+n*lh);n++;line=wd;}else line=test;}
  ctx.fillText(line,x,y+n*lh);return n+1;}
function pitch(){
  ctx.fillStyle='#06102B';ctx.fillRect(0,0,W,H);
  const gx=ox-18,gy=oy-18,gw=P.L*sc+36,gh=P.W*sc+36;
  ctx.fillStyle='#2e7d32';ctx.fillRect(gx,gy,gw,gh);
  const n=10;for(let i=0;i<n;i++){ctx.fillStyle=i%2?'rgba(255,255,255,0.035)':'rgba(0,0,0,0.05)';ctx.fillRect(gx+i*gw/n,gy,gw/n,gh);}
  (P.zones||[]).forEach(z=>{ctx.fillStyle=z.fill||'rgba(255,255,255,0.10)';ctx.fillRect(X(z.x0),Y(z.y0),(z.x1-z.x0)*sc,(z.y1-z.y0)*sc);
    ctx.strokeStyle='rgba(255,255,255,0.55)';ctx.setLineDash([8,6]);ctx.lineWidth=2;ctx.strokeRect(X(z.x0),Y(z.y0),(z.x1-z.x0)*sc,(z.y1-z.y0)*sc);ctx.setLineDash([]);
    if(z.label){ctx.font='600 15px Segoe UI, Arial, sans-serif';ctx.fillStyle='rgba(255,255,255,0.85)';ctx.textAlign='center';ctx.fillText(z.label,X((z.x0+z.x1)/2),Y(z.y0)+20);}});
  ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.strokeRect(X(0),Y(0),P.L*sc,P.W*sc);
  (P.lines||[]).forEach(l=>{ctx.beginPath();ctx.moveTo(X(l[0]),Y(l[1]));ctx.lineTo(X(l[2]),Y(l[3]));ctx.stroke();});
  (P.goals||[]).forEach(g=>{const w=g.w*sc,d=22;ctx.fillStyle='rgba(255,255,255,0.25)';ctx.strokeStyle='#fff';ctx.lineWidth=3;
    if(g.side==='right'){ctx.fillRect(X(g.x),Y(g.y)-w/2,d,w);ctx.strokeRect(X(g.x),Y(g.y)-w/2,d,w);}
    else if(g.side==='left'){ctx.fillRect(X(g.x)-d,Y(g.y)-w/2,d,w);ctx.strokeRect(X(g.x)-d,Y(g.y)-w/2,d,w);}
    else{/* small gate: two cones */const y0=Y(g.y)-w/2,y1=Y(g.y)+w/2;ctx.fillStyle='#fff';[y0,y1].forEach(y=>{ctx.beginPath();ctx.arc(X(g.x),y,6,0,6.3);ctx.fill();});}});
  (P.cones||[]).forEach(c=>{const x=X(c[0]),y=Y(c[1]);ctx.fillStyle='#FFB81C';ctx.beginPath();ctx.moveTo(x,y-9);ctx.lineTo(x-7,y+7);ctx.lineTo(x+7,y+7);ctx.closePath();ctx.fill();});
}
function arrow(a,b,color,dash){const x1=X(a[0]),y1=Y(a[1]),x2=X(b[0]),y2=Y(b[1]);const d=Math.hypot(x2-x1,y2-y1);if(d<20)return;
  ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=3;ctx.setLineDash(dash?[9,7]:[]);const ang=Math.atan2(y2-y1,x2-x1);const e=[x2-Math.cos(ang)*18,y2-Math.sin(ang)*18];
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(e[0],e[1]);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(x2-Math.cos(ang)*16,y2-Math.sin(ang)*16);ctx.lineTo(e[0]+Math.cos(ang+1.57)*7-Math.cos(ang)*2,e[1]+Math.sin(ang+1.57)*7-Math.sin(ang)*2);ctx.lineTo(e[0]+Math.cos(ang-1.57)*7-Math.cos(ang)*2,e[1]+Math.sin(ang-1.57)*7-Math.sin(ang)*2);ctx.closePath();ctx.fill();}
function player(id,p){const x=X(p[0]),y=Y(p[1]);const t=P.team[id];ctx.beginPath();ctx.arc(x,y+3,17,0,6.3);ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fill();
  ctx.beginPath();ctx.arc(x,y,16,0,6.3);ctx.fillStyle=COL[t];ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.stroke();
  ctx.font='700 13px Segoe UI, Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=(t==='Y')?'#111':'#fff';ctx.fillText(P.nums&&t!=='R'?id.replace(/^[A-Z]/,''):id,x,y+1);ctx.textBaseline='alphabetic';}
function ballAt(p){if(!p)return;const x=X(p[0]),y=Y(p[1]);ctx.beginPath();ctx.arc(x,y,8,0,6.3);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#111';ctx.stroke();}
function playersAt(seg,p){const e=ease(p),o={};for(const id in seg.start)o[id]=lerp(seg.start[id],seg.end[id],e);return o;}
const off=[1.5,1.1];
function ballPos(seg,p,pp){const hp=h=>[pp[h][0]+off[0],pp[h][1]+off[1]];
  if(seg.kind==='carry')return seg.h0?hp(seg.h0):seg.pt0;
  const a=.15,b=.72;if(p<a)return seg.h0?hp(seg.h0):seg.pt0;
  const q=Math.min(1,(p-a)/(b-a));const pa=playersAt(seg,a);const from=seg.h0?[pa[seg.h0][0]+off[0],pa[seg.h0][1]+off[1]]:seg.pt0;
  const to=seg.kind==='pass'?[pp[seg.to][0]+off[0],pp[seg.to][1]+off[1]]:seg.pt;
  return lerp(from,to,1-Math.pow(1-q,2));}
function caption(seg){ctx.fillStyle='rgba(10,16,24,0.94)';ctx.fillRect(0,H-96,W,96);ctx.fillStyle='#FFB81C';ctx.fillRect(0,H-96,6,96);
  ctx.font='700 14px Segoe UI, Arial, sans-serif';ctx.fillStyle='#FFB81C';ctx.textAlign='left';ctx.fillText('STEP '+(seg.i+1)+' OF '+P.segs.length,26,H-70);
  wrap(seg.s.say,26,H-42,W-60,28,'600 24px Segoe UI, Arial, sans-serif','#fff');}
function header(){ctx.fillStyle='rgba(10,16,24,0.94)';ctx.fillRect(0,0,W,62);ctx.fillStyle='#FFB81C';ctx.fillRect(0,60,W,2);
  ctx.textAlign='left';ctx.font='700 24px Segoe UI, Arial, sans-serif';ctx.fillStyle='#fff';ctx.fillText((P.phase?P.phase+': ':'')+P.title,26,38);
  ctx.textAlign='right';ctx.font='600 15px Segoe UI, Arial, sans-serif';ctx.fillStyle='#b0bec5';ctx.fillText(P.age+'  |  '+P.format,W-26,36);}
function panel(x,y,w,h){ctx.fillStyle='rgba(10,16,24,0.90)';ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,14):ctx.rect(x,y,w,h);ctx.fill();}
function intro(){panel(W/2-420,110,840,420);ctx.textAlign='left';let x=W/2-390,y=160;
  ctx.font='700 14px Segoe UI, Arial, sans-serif';ctx.fillStyle='#FFB81C';ctx.fillText(((P.phase?P.phase+'  |  ':'')+P.theme).toUpperCase(),x,y);y+=34;
  ctx.font='700 34px Segoe UI, Arial, sans-serif';ctx.fillStyle='#fff';ctx.fillText(P.title,x,y);y+=40;
  [['Age group',P.age],['Format',P.format],['Area',P.area],['Kit',P.kit],['Start',P.start]].forEach(r=>{ctx.font='700 16px Segoe UI, Arial, sans-serif';ctx.fillStyle='#90a4ae';ctx.fillText(r[0],x,y+4);const n=wrap(r[1],x+120,y+4,640,24,'500 18px Segoe UI, Arial, sans-serif','#fff');y+=Math.max(36,n*24+14);});}
function outro(){panel(W/2-460,100,920,470);ctx.textAlign='left';let x=W/2-430,y=148;
  ctx.font='700 14px Segoe UI, Arial, sans-serif';ctx.fillStyle='#FFB81C';ctx.fillText('COACHING POINTS',x,y);y+=14;
  P.points.forEach(p=>{const n=wrap(p,x+16,y+22,860,26,'500 19px Segoe UI, Arial, sans-serif','#fff');ctx.fillStyle='#FFB81C';ctx.fillRect(x,y+8,6,6);y+=n*26+8;});
  y+=30;ctx.font='700 14px Segoe UI, Arial, sans-serif';ctx.fillStyle='#FFB81C';ctx.fillText('MAKE IT HARDER',x,y);y+=14;
  P.progress.forEach(p=>{const n=wrap(p,x+16,y+22,860,26,'500 19px Segoe UI, Arial, sans-serif','#fff');ctx.fillStyle='#FFB81C';ctx.fillRect(x,y+8,6,6);y+=n*26+8;});
  if(MULTI){const nx=PH[PH.indexOf(P)+1];ctx.font='700 16px Segoe UI, Arial, sans-serif';ctx.fillStyle='#A6B2D4';ctx.fillText(nx?'Next: '+(nx.phase?nx.phase+', ':'')+nx.title:'End of the session',x,540);}}
function keyBar(){ctx.font='600 13px Segoe UI, Arial, sans-serif';let x=26,y=H-108;ctx.textAlign='left';
  (P.key||[]).forEach(k=>{ctx.beginPath();ctx.arc(x+8,y-4,8,0,6.3);ctx.fillStyle=COL[k[0]];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.fillText(k[1],x+22,y);x+=ctx.measureText(k[1]).width+52;});}
function phaseAt(t){for(const p of PH)if(t<p._t1)return p;return PH[PH.length-1];}
function draw(tt){
  tt=Math.max(0,Math.min(TOTAL-.001,tt));const ph=phaseAt(tt);use(ph);const t=tt-ph._t0;pitch();header();
  const segs=P.segs;let seg=null;for(const s of segs){if(t>=s.t0&&t<s.t1){seg=s;break;}}
  if(t<P.INTRO){const s0=segs[0];const pp=s0.start;for(const id in pp)player(id,pp[id]);ballAt(s0.h0?[pp[s0.h0][0]+1.5,pp[s0.h0][1]+1.1]:s0.pt0);intro();return;}
  if(!seg){const l=segs[segs.length-1];const pp=l.end;for(const id in pp)player(id,pp[id]);ballAt(l.h1?[pp[l.h1][0]+1.5,pp[l.h1][1]+1.1]:l.pt1);outro();return;}
  const p=(t-seg.t0)/(seg.t1-seg.t0);const pp=playersAt(seg,p);
  ctx.globalAlpha=.75*Math.min(1,p*4);
  for(const id in seg.end)arrow(seg.start[id],seg.end[id],'#ffffff',true);
  if(seg.kind!=='carry'){const a=seg.h0?[seg.start[seg.h0][0]+1.5,seg.start[seg.h0][1]+1.1]:seg.pt0;const b=seg.kind==='pass'?[seg.end[seg.to][0]+1.5,seg.end[seg.to][1]+1.1]:seg.pt;arrow(a,b,'#ffeb3b',false);}
  ctx.globalAlpha=1;for(const id in pp)player(id,pp[id]);ballAt(ballPos(seg,p,pp));keyBar();caption(seg);}
window.setT=draw;window.TOTAL=TOTAL;window.SEGS=[];PH.forEach(ph=>ph.segs.forEach(s=>window.SEGS.push([ph._t0+s.t0,ph._t0+s.t1])));window.PHS=PH.map(p=>[p._t0,p.INTRO,p.LEN]);
window.LINES=LINES.map(l=>[l.t0,l.url]);
if(RENDER){document.body.classList.add('render');draw(0);return;}

const $=id=>document.getElementById(id);
/* ---- close: always a way out, on PC and phone ---- */
function close(){
  try{if(window.parent!==window){window.parent.postMessage({type:'tl-anim-close'},'*');return;}}catch(e){}
  setPlaying(false);
  let ref='';try{ref=document.referrer&&new URL(document.referrer).origin===location.origin?document.referrer:'';}catch(e){}
  if(ref&&history.length>1){history.back();return;}
  try{window.close();}catch(e){}
  setTimeout(()=>{location.href=Q.get('back')&&/^\/[a-z0-9_\-\/.]*$/i.test(Q.get('back'))?Q.get('back'):(/coach=1/.test(location.search)?'../':'../../family.html');},250);}
if($('close'))$('close').onclick=close;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}
  else if(e.key===' '&&e.target===document.body){e.preventDefault();$('play').click();}
  else if(e.key==='ArrowRight'&&e.target.tagName!=='INPUT')$('next').click();else if(e.key==='ArrowLeft'&&e.target.tagName!=='INPUT')$('prev').click();});

/* ---- voice ---- */
let t=0,playing=false,last=0,speed=1,wait=0;
const N=LINES.length,BLOB=new Array(N).fill(null);let loaded=0,voiceOn=true,cur=-2,curSrc='';
const au=new Audio();au.preload='auto';au.setAttribute('playsinline','');window.__au=au;
function lineAt(tt){for(let i=0;i<N;i++){const L=LINES[i];if(tt>=L.t0&&tt<L.t0+L.win)return [i,tt-L.t0];}return [-1,0];}
function syncAudio(force){if(!HASV)return;const [k,o]=lineAt(t);
 if(!playing||!voiceOn||k<0||o>=LINES[k].dur-0.05){if(!au.paused)au.pause();cur=k;return;}
 if(k!==cur||force){cur=k;const src=BLOB[k]||LINES[k].url;/* not fetched yet: stream it straight from the server */
  if(curSrc!==src){curSrc=src;au.src=src;}try{au.currentTime=o;}catch(e){}au.playbackRate=speed;const p=au.play();if(p&&p.catch)p.catch(()=>{});}
 else if(au.paused&&o<LINES[k].dur-0.2){const p=au.play();if(p&&p.catch)p.catch(()=>{});}}
function setPlaying(v){playing=v;$('play').textContent=v?'Pause':'Play';$('play').setAttribute('aria-pressed',v?'true':'false');if(!v)au.pause();syncAudio(true);}
function get(k,n){return fetch(LINES[k].url,{cache:'force-cache'}).then(r=>{if(!r.ok)throw 0;return r.blob();}).then(b=>{BLOB[k]=URL.createObjectURL(b);}).catch(()=>n?new Promise(r=>setTimeout(r,800)).then(()=>get(k,n-1)):null);}
function status(){const l=$('ld');if(l)l.style.display='none';const s=$('vst');if(s)s.textContent=loaded<N?'Voice loading '+loaded+' of '+N:'';}
/* first line first, then the rest three at a time in order, so Play works straight away */
if(HASV){let next=1;const pump=()=>{if(next>=N)return;const k=next++;get(k,1).then(()=>{loaded++;status();pump();});};
 get(0,2).then(()=>{loaded++;status();pump();pump();pump();});}
status();
$('play').disabled=false;
$('voice').onclick=()=>{voiceOn=!voiceOn;$('voice').textContent=voiceOn?'Voice on':'Voice off';syncAudio(true);};
function loop(ts){if(playing){const [k,o]=lineAt(t);
  if(HASV&&voiceOn&&k>=0&&k===cur&&!au.paused&&au.currentTime>0){const at=LINES[k].t0+au.currentTime;t=Math.max(t,at);}
  else if(HASV&&voiceOn&&k>=0&&au.paused&&o<LINES[k].dur-0.05&&(wait+=ts-last)<1500){}
  else{wait=0;t+=(ts-last)/1000*speed;}
  if(!au.paused)wait=0;
  if(t>=TOTAL){t=TOTAL-.01;setPlaying(false);}}
 last=ts;draw(t);if(playing)syncAudio(false);$('bar').value=t/TOTAL*1000;phaseUI();requestAnimationFrame(loop);}
$('play').onclick=()=>{if(t>=TOTAL-.05)t=0;setPlaying(!playing);};
$('restart')&&($('restart').onclick=()=>{t=0;cur=-2;setPlaying(true);});
$('bar').oninput=e=>{t=e.target.value/1000*TOTAL;cur=-2;syncAudio(true);};
function jump(to,keep){t=to;cur=-2;if(keep&&playing)syncAudio(true);else setPlaying(playing);}
$('prev').onclick=()=>{let i=STEPS.length-1;while(i>0&&STEPS[i]>t-0.6)i--;jump(STEPS[i],1);};
$('next').onclick=()=>{const n=STEPS.find(s=>s>t+0.05);jump(n===undefined?TOTAL-0.5:n,1);};
$('speed').onchange=e=>{speed=parseFloat(e.target.value);au.playbackRate=speed;};
/* phase list (session only) */
const pl=$('phases');let lastPh=-1;
if(pl&&MULTI){pl.innerHTML=PH.map((p,i)=>'<button data-i="'+i+'">'+(i+1)+'. '+(p.phase||p.title)+'</button>').join('');pl.style.display='flex';
  pl.onclick=e=>{const b=e.target.closest('button');if(!b)return;jump(PH[+b.dataset.i]._t0,1);if(!playing)setPlaying(true);};}
function phaseUI(){if(!pl||!MULTI)return;const i=PH.indexOf(phaseAt(t));if(i===lastPh)return;lastPh=i;[...pl.children].forEach((b,j)=>b.classList.toggle('on',j===i));}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)setPlaying(false);});
if(Q.has('autoplay'))setPlaying(true);
requestAnimationFrame(loop);
})();
