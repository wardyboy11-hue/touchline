/* r120: tonight's session page (coach/anim/s2511_switching_play.html). Phone turned sideways fills the screen,
   Full screen in and out (with Exit and Back always there), and the coach's voice follows Play, Pause, Next, Previous, Jump and Sound off.
   Portrait 390x844, landscape 844x390 and a 1366 wide laptop. */
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8820,SHOTS=process.env.SHOTS||'/workspace/shots',PRE=process.env.PRE||'r120_';
fs.mkdirSync(SHOTS,{recursive:true});
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.mp3':'audio/mpeg','.png':'image/png'};
let NOSOUND=false;const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(NOSOUND&&u.endsWith('.mp3')){r.writeHead(404);r.end();return;}let f=path.join(root,u);fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
const BASE='http://localhost:'+PORT,URL=BASE+'/coach/anim/s2511_switching_play.html?back=%2Ffamily.html';
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
function errsOf(p){const e=[];p.on('pageerror',x=>e.push('pageerror: '+x.message));p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(m.text()))e.push('console: '+m.text());});return e;}
const W=ms=>new Promise(r=>setTimeout(r,ms));
const box=p=>p.evaluate(()=>{const r=document.getElementById('c').getBoundingClientRect();return {w:r.width,h:r.height,vw:innerWidth,vh:innerHeight,fs:document.body.classList.contains('fs'),land:document.body.classList.contains('land'),rail:getComputedStyle(document.getElementById('rail')).display,back:document.getElementById('rback').getAttribute('href'),exit:getComputedStyle(document.getElementById('fsx')).display,notes:getComputedStyle(document.getElementById('notes')).display};});
const au=p=>p.evaluate(()=>{const v=document.getElementById('vo');return {src:(v.getAttribute('src')||'').split('?')[0],paused:v.paused,t:v.currentTime};});
(async()=>{
 const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 /* every clip in the page is on disk and small */
 const html=fs.readFileSync(path.join(root,'coach/anim/s2511_switching_play.html'),'utf8');const AUD=JSON.parse(html.match(/const AUD = (\{[^}]+\});/)[1]);
 const dir=path.join(root,'coach/anim/audio/s2511_switching_play');let tot=0,miss=[];
 Object.keys(AUD).forEach(k=>{const f=path.join(dir,'p'+k+'.mp3');if(!fs.existsSync(f))miss.push(k);else tot+=fs.statSync(f).size;});
 T('31 voice clips (5 intros and 26 steps), all there', Object.keys(AUD).length===31&&miss.length===0);
 T('all voice clips together under 1.2 MB ('+Math.round(tot/1024)+' KB)', tot<1.2e6);
 T('no names in the page apart from coaches', !/Thomas/.test(html));
 /* portrait phone */
 {const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await ctx.newPage();const E=errsOf(p);
  await p.goto(URL);await W(700);
  let s=await box(p);T('portrait: normal page, notes showing, no rail', !s.land&&!s.fs&&s.notes!=='none'&&s.rail==='none');
  T('portrait: audio element there, nothing loaded before Play', (await au(p)).src==='');
  await p.click('#play');await W(1200);let a=await au(p);
  T('portrait: Play starts the warm up intro voice', /p0_0\.mp3$/.test(a.src)&&!a.paused);
  await p.screenshot({path:path.join(SHOTS,PRE+'portrait_playing.png')});
  await p.click('#play');await W(300);a=await au(p);T('portrait: Pause pauses the voice', a.paused);
  const t0=a.t;await p.click('#play');await W(600);a=await au(p);T('portrait: Play again carries on from the same place', !a.paused&&/p0_0/.test(a.src)&&a.t>=t0);
  await p.click('#next');await W(700);a=await au(p);T('portrait: Next moves the voice to step 1', /p0_1\.mp3$/.test(a.src)&&!a.paused);
  await p.click('#prev');await W(500);a=await au(p);T('portrait: Previous moves it back to the intro', /p0_0\.mp3$/.test(a.src));
  await p.selectOption('#jump','2');await W(700);a=await au(p);T('portrait: Jump to Part 2 plays the Part 2 intro', /p2_0\.mp3$/.test(a.src)&&!a.paused);
  await p.click('#mute');await W(300);a=await au(p);T('portrait: Sound off stops the voice, animation keeps playing', a.paused&&await p.evaluate(()=>playing===true));
  await p.click('#next');await W(500);T('portrait: no voice while Sound off', (await au(p)).paused);
  await p.click('#mute');await W(600);a=await au(p);T('portrait: Sound on again speaks the current step', /p2_1\.mp3$/.test(a.src)&&!a.paused);
  /* voice steers the timing: a 13.5 second intro is not cut off at 7 seconds */
  T('portrait: step waits for the voice', await p.evaluate(()=>{const i=SEQ.findIndex(s=>s.part===2&&s.type==='intro');return durOf(i)>13;}));
  /* Full screen (CSS fallback in portrait) */
  await p.click('#fs');await W(600);s=await box(p);
  T('portrait: Full screen fills the width', s.fs&&s.w>=s.vw-2&&s.rail==='flex'&&s.exit!=='none'&&s.back==='/family.html');
  await p.screenshot({path:path.join(SHOTS,PRE+'portrait_fullscreen.png')});
  await p.click('#fsx');await W(500);s=await box(p);T('portrait: Exit goes back to the normal page', !s.fs&&s.notes!=='none');
  T('portrait: zero console errors', E.length===0);if(E.length)console.log(E);
  /* turn the phone sideways */
  await p.setViewportSize({width:844,height:390});await W(600);s=await box(p);
  T('turned sideways: pitch fills the screen height', s.land&&Math.abs(s.h-s.vh)<=2&&Math.abs(s.w/s.h-16/9)<0.02&&s.notes==='none');
  T('turned sideways: controls and Back on the side', s.rail==='flex'&&s.back==='/family.html');
  await p.screenshot({path:path.join(SHOTS,PRE+'landscape_from_turn.png')});
  await p.setViewportSize({width:390,height:844});await W(500);s=await box(p);T('turned back upright: normal page again', !s.land&&s.notes!=='none');
  await ctx.close();}
 /* landscape phone from the start */
 {const ctx=await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await ctx.newPage();const E=errsOf(p);
  await p.goto(URL);await W(700);let s=await box(p);
  T('landscape: pitch fitted 16:9 and fills the height', s.land&&Math.abs(s.h-s.vh)<=2&&s.w<=s.vw);
  const rail=await p.evaluate(()=>{const r=document.getElementById('rail').getBoundingClientRect();return {b:r.bottom,r:r.right};});
  T('landscape: every side button on screen', rail.b<=390&&rail.r<=844);
  await p.click('#rplay');await W(1000);let a=await au(p);T('landscape: side Play starts the voice', /p0_0/.test(a.src)&&!a.paused);
  await p.click('#rnext');await W(600);a=await au(p);T('landscape: side Next moves the voice', /p0_1/.test(a.src));
  await p.click('#rplay');await W(300);T('landscape: side Pause', (await au(p)).paused);
  await p.screenshot({path:path.join(SHOTS,PRE+'landscape.png')});
  await p.click('#rmute');T('landscape: side Sound off', await p.evaluate(()=>muted===true));await p.click('#rmute');
  T('landscape: zero console errors', E.length===0);if(E.length)console.log(E);
  await ctx.close();}
 /* laptop */
 {const ctx=await b.newContext({viewport:{width:1366,height:800}});const p=await ctx.newPage();const E=errsOf(p);
  await p.goto(URL);await W(700);let s=await box(p);T('laptop: normal page', !s.land&&!s.fs&&s.notes!=='none');
  await p.click('#fs');await W(900);s=await box(p);
  const real=await p.evaluate(()=>!!document.fullscreenElement);
  T('laptop: Full screen on (browser full screen '+(real?'yes':'no, CSS')+')', s.fs&&s.rail==='flex'&&s.exit!=='none');
  T('laptop: pitch as big as it can be at 16:9', Math.abs(s.h-s.vh)<=2||Math.abs(s.w-(s.vw-72))<=2);
  await p.screenshot({path:path.join(SHOTS,PRE+'laptop_fullscreen.png')});
  await p.keyboard.press('Escape');await W(600);s=await box(p);T('laptop: Escape leaves Full screen', !s.fs&&!(await p.evaluate(()=>!!document.fullscreenElement)));
  await p.click('#fs');await W(600);await p.click('#fsx');await W(600);s=await box(p);T('laptop: Exit button leaves Full screen', !s.fs);
  /* sound fails: animation still runs with words on screen */
  NOSOUND=true;await p.selectOption('#jump','3');await p.click('#play');await W(1500);
  const st=await p.evaluate(()=>({ok:!BAD['3_0'],playing:playing,msg:document.getElementById('snd').textContent,idx:idx}));
  T('laptop: if the sound fails the animation keeps going with a short note', !st.ok&&st.playing&&/words are on screen/.test(st.msg));
  T('laptop: zero console errors (apart from the blocked sound)', E.filter(x=>!/mp3|Failed to load|ERR_FAILED|NotSupported/.test(x)).length===0);if(E.length)console.log(E);
  await ctx.close();}
 await b.close();srv.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);
})();
