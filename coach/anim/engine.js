(function(){

const P=window.PRACTICE;
const RENDER=new URLSearchParams(location.search).has('render');
const cv=document.getElementById('cv');const ctx=cv.getContext('2d');
const W=1280,H=720;cv.width=W;cv.height=H;
const AD=P.audio||null;/* real voice durations: [intro, step1..] */
const INTRO=AD?Math.max(5,AD[0]+0.8):5,OUTRO=8;
const COL={R:'#e53935',B:'#1e88e5',Y:'#fdd835',K:'#8e24aa'};
const clone=o=>JSON.parse(JSON.stringify(o));
let pos={};P.players.forEach(p=>pos[p.id]=[p.x,p.y]);
const team={};P.players.forEach(p=>team[p.id]=p.team);
let ball={holder:P.ball,pt:null};
const segs=[];let T=INTRO;
P.steps.forEach((s,i)=>{
  const start=clone(pos),end=clone(pos);
  for(const k in (s.moves||{}))end[k]=s.moves[k];
  const dd=AD&&AD[i+1]?Math.max(4,AD[i+1]+1.0):s.dur;
  const seg={t0:T,t1:T+dd,s,start,end,h0:ball.holder,pt0:ball.pt,i};
  if(s.pass){seg.kind='pass';seg.to=s.pass;ball={holder:s.pass,pt:null};}
  else if(s.shoot){seg.kind='shoot';seg.pt=s.shoot;ball={holder:null,pt:s.shoot};}
  else seg.kind='carry';
  seg.h1=ball.holder;seg.pt1=ball.pt;
  segs.push(seg);pos=end;T+=dd;
});
const TOTAL=T+OUTRO;
// layout
const top=84,bot=H-134,margin=40;
const sc=Math.min((W-2*margin)/P.L,(bot-top)/P.W);
const ox=(W-P.L*sc)/2,oy=top+((bot-top)-P.W*sc)/2;
const X=x=>ox+x*sc,Y=y=>oy+y*sc;
const ease=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
function wrap(t,x,y,w,lh,font,color,maxLines){ctx.font=font;ctx.fillStyle=color;ctx.textAlign='left';const words=t.split(' ');let line='',n=0;
  for(const wd of words){const test=line?line+' '+wd:wd;if(ctx.measureText(test).width>w&&line){ctx.fillText(line,x,y+n*lh);n++;line=wd;}else line=test;}
  ctx.fillText(line,x,y+n*lh);return n+1;}
function pitch(){
  ctx.fillStyle='#06102B';ctx.fillRect(0,0,W,H);
  // grass band
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
    else{ctx.fillRect(X(g.x)-d,Y(g.y)-w/2,d,w);ctx.strokeRect(X(g.x)-d,Y(g.y)-w/2,d,w);}});
  (P.cones||[]).forEach(c=>{const x=X(c[0]),y=Y(c[1]);ctx.fillStyle='#FFB81C';ctx.beginPath();ctx.moveTo(x,y-9);ctx.lineTo(x-7,y+7);ctx.lineTo(x+7,y+7);ctx.closePath();ctx.fill();});
}
function arrow(a,b,color,dash){const x1=X(a[0]),y1=Y(a[1]),x2=X(b[0]),y2=Y(b[1]);const d=Math.hypot(x2-x1,y2-y1);if(d<20)return;
  ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=3;ctx.setLineDash(dash?[9,7]:[]);const ang=Math.atan2(y2-y1,x2-x1);const e=[x2-Math.cos(ang)*18,y2-Math.sin(ang)*18];
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(e[0],e[1]);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(x2-Math.cos(ang)*16,y2-Math.sin(ang)*16);ctx.lineTo(e[0]+Math.cos(ang+1.57)*7-Math.cos(ang)*2,e[1]+Math.sin(ang+1.57)*7-Math.sin(ang)*2);ctx.lineTo(e[0]+Math.cos(ang-1.57)*7-Math.cos(ang)*2,e[1]+Math.sin(ang-1.57)*7-Math.sin(ang)*2);ctx.closePath();ctx.fill();}
function player(id,p){const x=X(p[0]),y=Y(p[1]);const t=team[id];ctx.beginPath();ctx.arc(x,y+3,17,0,6.3);ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fill();
  ctx.beginPath();ctx.arc(x,y,16,0,6.3);ctx.fillStyle=COL[t];ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.stroke();
  ctx.font='700 13px Segoe UI, Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=(t==='Y')?'#111':'#fff';ctx.fillText(P.nums&&t!=='R'?id.replace(/^[A-Z]/,''):id,x,y+1);ctx.textBaseline='alphabetic';}
function ballAt(p){const x=X(p[0]),y=Y(p[1]);ctx.beginPath();ctx.arc(x,y,8,0,6.3);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#111';ctx.stroke();}
function playersAt(seg,p){const e=ease(p),o={};for(const id in seg.start)o[id]=lerp(seg.start[id],seg.end[id],e);return o;}
function ballPos(seg,p,pp){const off=[1.5,1.1];
  const hp=h=>[pp[h][0]+off[0],pp[h][1]+off[1]];
  if(seg.kind==='carry'){return seg.h0?hp(seg.h0):seg.pt0;}
  const a=.15,b=.72;
  if(p<a)return seg.h0?hp(seg.h0):seg.pt0;
  const q=Math.min(1,(p-a)/(b-a));const pa=playersAt(seg,a);const from=seg.h0?[pa[seg.h0][0]+off[0],pa[seg.h0][1]+off[1]]:seg.pt0;
  const to=seg.kind==='pass'?[pp[seg.to][0]+off[0],pp[seg.to][1]+off[1]]:seg.pt;
  const qe=1-Math.pow(1-q,2);return lerp(from,to,qe);}
function caption(seg){ctx.fillStyle='rgba(10,16,24,0.94)';ctx.fillRect(0,H-96,W,96);ctx.fillStyle='#FFB81C';ctx.fillRect(0,H-96,6,96);
  ctx.font='700 14px Segoe UI, Arial, sans-serif';ctx.fillStyle='#FFB81C';ctx.textAlign='left';ctx.fillText('STEP '+(seg.i+1)+' OF '+segs.length,26,H-70);
  wrap(seg.s.say,26,H-42,W-60,28,'600 24px Segoe UI, Arial, sans-serif','#fff');}
function header(){ctx.fillStyle='rgba(10,16,24,0.94)';ctx.fillRect(0,0,W,62);ctx.fillStyle='#FFB81C';ctx.fillRect(0,60,W,2);
  ctx.textAlign='left';ctx.font='700 24px Segoe UI, Arial, sans-serif';ctx.fillStyle='#fff';ctx.fillText(P.title,26,38);
  ctx.textAlign='right';ctx.font='600 15px Segoe UI, Arial, sans-serif';ctx.fillStyle='#b0bec5';ctx.fillText(P.age+'  |  '+P.format,W-26,36);
  // key
  }
function panel(x,y,w,h){ctx.fillStyle='rgba(10,16,24,0.90)';ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,14):ctx.rect(x,y,w,h);ctx.fill();}
function intro(t){panel(W/2-420,110,840,420);ctx.textAlign='left';let x=W/2-390,y=160;
  ctx.font='700 14px Segoe UI, Arial, sans-serif';ctx.fillStyle='#FFB81C';ctx.fillText(P.theme.toUpperCase(),x,y);y+=34;
  ctx.font='700 34px Segoe UI, Arial, sans-serif';ctx.fillStyle='#fff';ctx.fillText(P.title,x,y);y+=40;
  const rows=[['Age group',P.age],['Format',P.format],['Area',P.area],['Kit',P.kit],['Start',P.start]];
  rows.forEach(r=>{ctx.font='700 16px Segoe UI, Arial, sans-serif';ctx.fillStyle='#90a4ae';ctx.fillText(r[0],x,y+4);const n=wrap(r[1],x+120,y+4,640,24,'500 18px Segoe UI, Arial, sans-serif','#fff');y+=Math.max(36,n*24+14);});}
function outro(t){panel(W/2-460,100,920,470);ctx.textAlign='left';let x=W/2-430,y=148;
  ctx.font='700 14px Segoe UI, Arial, sans-serif';ctx.fillStyle='#FFB81C';ctx.fillText('COACHING POINTS',x,y);y+=14;
  P.points.forEach(p=>{const n=wrap(p,x+16,y+22,860,26,'500 19px Segoe UI, Arial, sans-serif','#fff');ctx.fillStyle='#FFB81C';ctx.fillRect(x,y+8,6,6);y+=n*26+8;});
  y+=30;ctx.font='700 14px Segoe UI, Arial, sans-serif';ctx.fillStyle='#FFB81C';ctx.fillText('MAKE IT HARDER',x,y);y+=14;
  P.progress.forEach(p=>{const n=wrap(p,x+16,y+22,860,26,'500 19px Segoe UI, Arial, sans-serif','#fff');ctx.fillStyle='#FFB81C';ctx.fillRect(x,y+8,6,6);y+=n*26+8;});}
function keyBar(){ctx.font='600 13px Segoe UI, Arial, sans-serif';let x=26,y=H-108;ctx.textAlign='left';
  (P.key||[]).forEach(k=>{ctx.beginPath();ctx.arc(x+8,y-4,8,0,6.3);ctx.fillStyle=COL[k[0]];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.fillText(k[1],x+22,y);x+=ctx.measureText(k[1]).width+52;});}
function draw(t){
  t=Math.max(0,Math.min(TOTAL-.001,t));pitch();header();
  let seg=null;for(const s of segs){if(t>=s.t0&&t<s.t1){seg=s;break;}}
  if(t<INTRO){const s0=segs[0];const pp=s0.start;for(const id in pp)player(id,pp[id]);const b=s0.h0?[pp[s0.h0][0]+1.5,pp[s0.h0][1]+1.1]:s0.pt0;ballAt(b);intro(t);return;}
  if(!seg){const l=segs[segs.length-1];const pp=l.end;for(const id in pp)player(id,pp[id]);ballAt(l.h1?[pp[l.h1][0]+1.5,pp[l.h1][1]+1.1]:l.pt1);outro(t);return;}
  const p=(t-seg.t0)/(seg.t1-seg.t0);const pp=playersAt(seg,p);
  const fade=Math.min(1,p*4);ctx.globalAlpha=.75*fade;
  for(const id in seg.end){const a=seg.start[id],b=seg.end[id];arrow(a,b,'#ffffff',true);}
  if(seg.kind!=='carry'){const a=seg.h0?[seg.start[seg.h0][0]+1.5,seg.start[seg.h0][1]+1.1]:seg.pt0;const b=seg.kind==='pass'?[seg.end[seg.to][0]+1.5,seg.end[seg.to][1]+1.1]:seg.pt;arrow(a,b,'#ffeb3b',false);}
  ctx.globalAlpha=1;
  for(const id in pp)player(id,pp[id]);ballAt(ballPos(seg,p,pp));keyBar();caption(seg);}
window.setT=draw;window.TOTAL=TOTAL;window.SEGS=segs.map(s=>[s.t0,s.t1]);
if(RENDER){document.body.classList.add('render');draw(0);return;}
let t=0,playing=false,last=0,speed=1,wait=0;const $=id=>document.getElementById(id);
/* ---- voice: every line is a pre-recorded MP3, all fetched before Play is enabled ---- */
const N=P.steps.length+1,BLOB=new Array(N).fill(null);let ready=!AD,loaded=0,voiceOn=true,cur=-2;
const au=new Audio();au.preload='auto';au.setAttribute('playsinline','');
window.__au=au;const base='audio/'+P.slug+'/';
function lineAt(tt){if(tt<INTRO)return [0,tt];const i=segs.findIndex(s=>tt>=s.t0&&tt<s.t1);return i<0?[-1,0]:[i+1,tt-segs[i].t0];}
function lineDur(k){return AD?AD[k]:0;}
function syncAudio(force){if(!AD)return;const [k,off]=lineAt(t);
 if(!playing||!voiceOn||k<0||off>=lineDur(k)-0.05){if(!au.paused)au.pause();cur=k;return;}
 if(k!==cur||force){cur=k;if(!BLOB[k]){return;}if(au.src!==BLOB[k])au.src=BLOB[k];try{au.currentTime=off;}catch(e){}au.playbackRate=speed;const p=au.play();if(p&&p.catch)p.catch(()=>{});}
 else if(au.paused&&off<lineDur(k)-0.2){const p=au.play();if(p&&p.catch)p.catch(()=>{});}}
function setPlaying(v){playing=v;$('play').textContent=v?'Pause':'Play';if(!v)au.pause();syncAudio(true);}
function loadingUI(){const b=$('play');if(ready){b.disabled=false;b.textContent=playing?'Pause':'Play';$('ld')&&($('ld').style.display='none');return;}
 b.disabled=true;b.textContent='Loading voice '+loaded+'/'+N;const l=$('ld');if(l){l.style.display='flex';l.querySelector('b').style.width=(loaded/N*100)+'%';l.querySelector('span').textContent='Getting the voice ready: '+loaded+' of '+N;}}
if(AD){Promise.all(Array.from({length:N},(_,k)=>fetch(base+k+'.mp3').then(r=>{if(!r.ok)throw 0;return r.blob();}).then(b=>{BLOB[k]=URL.createObjectURL(b);loaded++;loadingUI();}).catch(()=>{loaded++;loadingUI();})))
 .then(()=>{ready=true;loadingUI();if(new URLSearchParams(location.search).has('autoplay'))setPlaying(true);});}
loadingUI();
$('voice').onclick=()=>{voiceOn=!voiceOn;$('voice').textContent=voiceOn?'Voice on':'Voice off';syncAudio(true);};
au.addEventListener('ended',()=>{});
function loop(ts){if(playing){const [k,off]=lineAt(t);
  /* while a line is speaking the audio is the clock, so pictures never drift from the words */
  if(AD&&voiceOn&&k>=0&&k===cur&&!au.paused&&BLOB[k]){const at=(k===0?0:segs[k-1].t0)+au.currentTime;t=Math.max(t,at);}
  else if(AD&&voiceOn&&k>=0&&BLOB[k]&&au.paused&&off<lineDur(k)-0.05&&(wait+=ts-last)<1500){}/* line about to start: hold the pictures (max 1.5s) */
  else{wait=0;t+=(ts-last)/1000*speed;}
  if(!au.paused)wait=0;
  if(t>=TOTAL){t=TOTAL-.01;setPlaying(false);}}
 last=ts;draw(t);if(playing)syncAudio(false);$('bar').value=t/TOTAL*1000;requestAnimationFrame(loop);}
/* the Play tap itself starts audio, which unlocks sound on phones */
$('play').onclick=()=>{if(!ready)return;if(t>=TOTAL-.05)t=0;setPlaying(!playing);};
$('restart').onclick=()=>{if(!ready)return;t=0;cur=-2;setPlaying(true);};
$('bar').oninput=e=>{t=e.target.value/1000*TOTAL;cur=-2;syncAudio(true);};
$('prev').onclick=()=>{const idx=segs.findIndex(s=>t>=s.t0&&t<s.t1);t=idx>0?segs[idx-1].t0:0;setPlaying(false);};
$('next').onclick=()=>{const idx=segs.findIndex(s=>t>=s.t0&&t<s.t1);t=idx>=0&&idx<segs.length-1?segs[idx+1].t0:(idx<0&&t<INTRO?segs[0].t0:TOTAL-OUTRO);setPlaying(false);};
$('speed').onchange=e=>{speed=parseFloat(e.target.value);au.playbackRate=speed;};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)setPlaying(false);});
requestAnimationFrame(loop);
})();
