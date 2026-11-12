/* r112: Running (ready made plans, Build up to 5k, position runs, build your own, timer with cues) and Fuel and water.
   Phone (Pixel 7) and laptop (1366 x 768). Fake backend, nothing real is touched.
   Checks: choose a plan, build one, timer blocks count down, cue choice, Fuel links, direct links, nothing sent to the backend, zero console errors.
   SHOTS=/workspace/shots PORT default 8812 */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8812,SHOTS=process.env.SHOTS||'/workspace/shots',PRE='r112_';
fs.mkdirSync(SHOTS,{recursive:true});
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/json','.svg':'image/svg+xml','.vtt':'text/vtt'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end('{"v": "112"}');return;}let f=path.join(root,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
const BASE='http://localhost:'+PORT;
let ok=0,bad=0;const T=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  '+JSON.stringify(x)));c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
const w=ms=>new Promise(r=>setTimeout(r,ms));
const shot=(p,n)=>p.screenshot({path:path.join(SHOTS,PRE+n),fullPage:false});
function watch(p){const e={err:[],res404:[],sent:[]};
 p.on('pageerror',x=>e.err.push('pageerror: '+x.message));
 p.on('console',m=>{if(m.type()==='error')e.err.push('console: '+m.text());});
 p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(BASE))e.res404.push(r.status()+' '+r.url());});
 return e;}
async function family(b,opts,role){
 const ctx=await b.newContext(opts);const p=await ctx.newPage();const e=watch(p);
 await p.route(/^https?:\/\/(?!localhost)/,r=>{const u=r.request().url();if(/macros/.test(u))return r.fallback();r.fulfill({status:204,body:''});});
 await p.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(x){}e.sent.push(a.action||'');
  const okk=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
  if(a.action==='f.home')return okk({first:role==='parent'?'Pat':'Sam',role:role,num:'7',mine:{},rsn:{},x:{fixtures:[],posts:[],news:[]},posts:[],res:[],tips:[],vote:{},feed:[]});
  if(a.action==='f.self.get')return okk({done:1,num:'7',nick:'S',pos:['CM'],foot:'R',sr:{},role:'player'});
  return okk({rows:[]});});
 await p.addInitScript(()=>{const _g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return /^fam\.wel\./.test(k)?'1':_g.call(this,k);};localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.push','1');try{Object.defineProperty(window,'Notification',{value:{permission:'granted',requestPermission:()=>Promise.resolve('granted')},configurable:true});}catch(x){}});
 return {ctx,p,e};}
async function ready(p,hash){await p.goto(BASE+'/family.html'+(hash||''));await w(1800);await p.evaluate(()=>{['splash','tl-md'].forEach(i=>{const s=document.getElementById(i);if(s)s.remove();});});await p.waitForFunction(()=>!!(window.TLRun&&window.TLFit),{timeout:8000}).catch(()=>{});await w(300);}
async function tapSizes(p,sel){return p.evaluate(s=>[...document.querySelectorAll(s)].filter(x=>x.offsetParent!==null).map(x=>{const r=x.getBoundingClientRect();return {t:(x.innerText||x.getAttribute('aria-label')||'').trim().slice(0,24),h:Math.round(r.height),w:Math.round(r.width)};}).filter(x=>x.h<48||x.w<48),sel);}

(async()=>{
 const b=await chromium.launch();
 const VIEWS=[['phone',{...devices['Pixel 7']}],['laptop',{viewport:{width:1366,height:768}}]];
 for(const [vn,vo] of VIEWS){
  const {ctx,p,e}=await family(b,vo,'player');
  await ready(p,'#me');
  const tabOn=await p.evaluate(()=>{const b=document.querySelector('nav.tabs button.on');return b?b.innerText.trim():'';});
  T(vn+': #me direct link opens Me',/Me/.test(tabOn),tabOn);
  const card=await p.evaluate(()=>{const c=document.getElementById('fitc');return c?c.innerText:'';});
  T(vn+': Fitness card has Running and Fuel and water',/Running/.test(card)&&/Fuel and water/.test(card),card);
  await p.evaluate(()=>document.getElementById('fitc').scrollIntoView({block:'center'}));await w(200);
  await shot(p,vn+'_fitness_card.png');
  const sentBefore=e.sent.length;
  await p.click('#fitc [data-run="hub"]');await w(400);
  let hub=await p.textContent('#tl-runview');
  T(vn+': Running hub opens',/Build up to 5k/.test(hub)&&/By position/.test(hub)&&/Other runs/.test(hub));
  T(vn+': no "Couch to 5k" name anywhere',!/couch/i.test(hub));
  T(vn+': position plans listed',['Centre back','Wing back','Centre mid','Striker','Goalkeeper'].every(x=>hub.includes(x)));
  T(vn+': other run types listed',['Steady run','Intervals','Sprints','Recovery jog','Play speed'].every(x=>hub.includes(x)));
  T(vn+': says saved on this phone only',/saved on this phone only/i.test(hub));
  T(vn+': no player named (Callum)',!/callum/i.test(hub));
  await shot(p,vn+'_running_hub.png');
  const small=await tapSizes(p,'#tl-runview button, #tl-runview a.btn, #tl-runview summary');
  T(vn+': running tap targets at least 48px',small.length===0,small);
  if(vn==='laptop'){const g=await p.evaluate(()=>{const r=document.querySelector('.tl-run-sheet').getBoundingClientRect();return {w:r.width,l:r.left,rr:innerWidth-r.right};});T('laptop: sheet centred and not stretched',g.w<=620&&Math.abs(g.l-g.rr)<4,g);}
  // links out
  const links=await p.evaluate(()=>[...document.querySelectorAll('#tl-runview a[href]')].map(a=>a.href));
  T(vn+': Spotify, Strava, Nike Run Club and Google Fit links',links.some(x=>/open\.spotify\.com\/playlist/.test(x))&&links.some(x=>/open\.spotify\.com\/search/.test(x))&&links.some(x=>/strava\.com/.test(x))&&links.some(x=>/nike\.com\/nrc-app/.test(x))&&links.some(x=>/google\.com\/fit/.test(x)),links);
  // cue choice
  await p.click('#tl-runview [data-run="cue"][data-v="beeps"]');await w(200);
  T(vn+': cue choice saved as beeps',await p.evaluate(()=>JSON.parse(localStorage.getItem('tl.run.v1')).cue==='beeps'));
  // choose a ready made plan
  await p.click('#tl-runview [data-run="plan"][data-id="wb"]');await w(300);
  const pv=await p.textContent('#tl-runview');
  T(vn+': choose Wing back shows the session',/Wing back/.test(pv)&&/2 x|6 x/.test(pv)&&/Start the timer/.test(pv),pv.slice(0,300));
  await shot(p,vn+'_plan_wingback.png');
  // timer counts down through blocks with beeps
  await p.evaluate(()=>{TLRun._speed=1;TLRun._log=[];});
  await p.click('#tl-runview [data-run="start"]');await w(1300);
  const s1=await p.evaluate(()=>TLRun.state());
  T(vn+': timer starts on Warm up block 1',s1&&s1.type==='warm'&&s1.i===0,s1);
  await w(1200);const s1b=await p.evaluate(()=>TLRun.state());
  T(vn+': countdown goes down',s1b.left<s1.left,{a:s1.left,b:s1b.left});
  await shot(p,vn+'_timer_warmup.png');
  const big=await p.evaluate(()=>{const r=document.getElementById('tl-run-left').getBoundingClientRect();return Math.round(r.height);});
  T(vn+': big countdown (at least 80px tall)',big>=80,big);
  const tsmall=await tapSizes(p,'#tl-run-timer button');
  T(vn+': timer buttons at least 48px',tsmall.length===0,tsmall);
  await p.click('#tl-run-timer [data-run="tskip"]');await w(300);
  const s2=await p.evaluate(()=>TLRun.state());
  T(vn+': Skip moves to next block (Hard run 30 sec)',s2.i===1&&s2.type==='hard'&&s2.left===30,s2);
  await p.evaluate(()=>{TLRun._speed=10;});await p.click('#tl-run-timer [data-run="tprev"]');await p.click('#tl-run-timer [data-run="tskip"]');
  await w(3400);
  const s3=await p.evaluate(()=>TLRun.state());const lg=await p.evaluate(()=>TLRun._log.slice());
  T(vn+': blocks roll on by themselves (now past block 2)',s3.i>=2,s3);
  T(vn+': beeps mode beeps and does not speak',lg.some(x=>x.k==='beep')&&!lg.some(x=>x.k==='say'),lg.slice(-6));
  await shot(p,vn+'_timer_jog.png');
  // switch to voice during the timer
  await p.evaluate(()=>{TLRun._log=[];});
  await p.click('#tl-run-timer [data-run="cue"][data-v="voice"]');await w(200);
  await p.click('#tl-run-timer [data-run="tskip"]');await w(300);
  const lg2=await p.evaluate(()=>TLRun._log.slice());
  T(vn+': voice mode speaks the cue for the new block',lg2.some(x=>x.k==='say'&&/Pick it up|Easy jog|Rest|Sprint|Walk/.test(x.t)),lg2);
  // pause
  await p.click('#tl-run-timer [data-run="tpause"]');const pa=await p.evaluate(()=>TLRun.state().left);await w(1200);
  const pb=await p.evaluate(()=>TLRun.state());
  T(vn+': Pause holds the clock',pb.paused&&pb.left===pa,{pa,pb});
  await shot(p,vn+'_timer_paused.png');
  p.once('dialog',d=>d.accept());await p.click('#tl-run-timer [data-run="tstop"]');await w(400);
  T(vn+': Stop closes the timer',!(await p.$('#tl-run-timer'))&&!!(await p.$('#tl-runview')));
  // update hold
  T(vn+': update waits while not running',await p.evaluate(()=>!window.tlHold||!window.tlHold()));
  // build your own
  await p.click('#tl-runview [data-run="build"]');await w(300);
  await p.fill('#tl-run-name','Hill reps');
  await p.click('#tl-runview [data-run="btype"][data-v="sprint"]');await p.click('#tl-runview [data-run="bdur"][data-v="15"]');await p.click('#tl-runview [data-run="badd"]');await w(150);
  await p.click('#tl-runview [data-run="btype"][data-v="walk"]');await p.click('#tl-runview [data-run="bdur"][data-v="45"]');await p.click('#tl-runview [data-run="badd"]');await w(150);
  await p.click('#tl-runview [data-run="breps"][data-v="4"]');await w(150);
  const bt=await p.textContent('#tl-run-btotal');
  T(vn+': builder total 14:00 with 4 repeats',/14:00/.test(bt)&&/4 x \(Sprint 15 sec, Walk 45 sec\)/.test(bt),bt);
  await shot(p,vn+'_builder.png');
  await p.click('#tl-runview [data-run="bsave"]');await w(300);
  const bv=await p.textContent('#tl-runview');
  T(vn+': saved own run opens with its name',/Hill reps/.test(bv)&&/Start the timer/.test(bv));
  T(vn+': own run saved on the phone',await p.evaluate(()=>JSON.parse(localStorage.getItem('tl.run.v1')).custom[0].name==='Hill reps'));
  await p.evaluate(()=>{TLRun._speed=1;});
  await p.click('#tl-runview [data-run="start"]');await w(300);await p.click('#tl-run-timer [data-run="tskip"]');await w(1300);
  const s4=await p.evaluate(()=>TLRun.state());
  T(vn+': own run timer on Sprint 15 counting down',s4.type==='sprint'&&s4.left<15&&s4.left>=12,s4);
  T(vn+': update is held while the timer runs',await p.evaluate(()=>window.tlHold&&window.tlHold()==='session'));
  await shot(p,vn+'_timer_sprint.png');
  p.once('dialog',d=>d.accept());await p.click('#tl-run-timer [data-run="tstop"]');await w(300);
  // Build up to 5k: finish week 1 run 1 quickly and check the tick
  await p.click('#tl-runview [data-run="back"]').catch(()=>{});await w(200);
  await p.click('#tl-run-b5k [data-run="plan"]');await w(300);
  T(vn+': Build up to 5k week 1 is 8 x (Run 1 min, Walk 1 min 30 sec)',/8 x \(Run 1 min, Walk 1 min 30 sec\)/.test(await p.textContent('#tl-runview')));
  await shot(p,vn+'_b5k_week1.png');
  await p.evaluate(()=>{TLRun._speed=3000;});await p.click('#tl-runview [data-run="start"]');
  await p.waitForFunction(()=>!window.TLRun.state(),{timeout:15000}).catch(()=>{});await w(300);
  T(vn+': finished run shows Session done',/Session done/.test(await p.textContent('#tl-run-timer')));
  await shot(p,vn+'_session_done.png');
  const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('tl.run.v1')));
  T(vn+': week 1 run 1 ticked and logged on the phone',!!st.b5k.w1r1&&st.log.length>=1,st.b5k);
  await p.click('#tl-run-timer [data-run="tdone"]');await w(300);
  T(vn+': next run offered is week 1 run 2',/Start week 1, run 2/.test(await p.textContent('#tl-runview')));
  await p.evaluate(()=>{const d=document.querySelector('#tl-run-b5k details');d.open=true;d.scrollIntoView();});await w(200);
  await shot(p,vn+'_b5k_progress.png');
  // Fuel and water, via the direct link
  await p.click('#tl-runview [data-run="x"]');await w(200);
  await p.evaluate(()=>{location.hash='#fuel';});await w(600);
  const fuel=await p.textContent('#tl-runview');
  T(vn+': #fuel direct link opens Fuel and water',/Fuel and water/.test(fuel)&&/Before a game or training/.test(fuel));
  T(vn+': says under 18s do not need shakes or aminos',/Protein shakes, aminos and supplements/.test(fuel)&&/You do not need them/.test(fuel));
  T(vn+': points to a parent or GP, not medical advice',/parent or your GP/.test(fuel)&&/not medical advice/.test(fuel));
  const fl=await p.evaluate(()=>[...document.querySelectorAll('#tl-run-fuel a[href]')].map(a=>a.href));
  T(vn+': Fuel links go to NHS, England Football, BDA and UKAD only',fl.length===6&&fl.every(u=>/^https:\/\/(www\.nhs\.uk|learn\.englandfootball\.com|www\.bda\.uk\.com|www\.ukad\.org\.uk)\//.test(u)),fl);
  T(vn+': no supplement shop links',!fl.some(u=>/myprotein|amazon|bulk|informed-sport|shop/i.test(u)));
  await shot(p,vn+'_fuel.png');
  await p.evaluate(()=>{document.querySelector('.tl-run-sheet').scrollTop=99999;});await w(150);
  await shot(p,vn+'_fuel_more.png');
  await p.click('#tl-runview [data-run="x"]');
  // #running and #fitness direct links
  await p.evaluate(()=>{location.hash='#running';});await w(600);
  T(vn+': #running direct link opens Running',!!(await p.$('#tl-runview'))&&/By position/.test(await p.textContent('#tl-runview')));
  await p.click('#tl-runview [data-run="x"]');
  await p.evaluate(()=>{location.hash='#fitness';});await w(600);
  T(vn+': #fitness direct link opens Fitness',!!(await p.$('#tl-fitview')));
  await p.click('#tl-fitview [data-fit="x"]');
  // nothing sent to the backend by Running
  const extra=e.sent.slice(sentBefore).filter(a=>/run|fit/i.test(a));
  T(vn+': Running sent nothing to the backend',extra.length===0,extra);
  // tab direct links
  for(const [h,lab] of [['#games','Games'],['#events','Events'],['#media','Media'],['#home','Home']]){await p.evaluate(x=>{location.hash=x;},h);await w(400);const on=await p.evaluate(()=>{const b=document.querySelector('nav.tabs button.on');return b?b.innerText.trim():'';});T(vn+': '+h+' opens '+lab,on.indexOf(lab)===0,on);}
  await p.evaluate(()=>{location.hash='#ask';});await w(400);
  T(vn+': #ask opens Ask the coaches',/Ask the coaches|Your voice|My team idea/i.test(await p.innerText('#root')));
  await p.evaluate(()=>{location.hash='#faq';});await w(400);
  T(vn+': #faq opens questions',/question/i.test(await p.innerText('#root')));
  await p.evaluate(()=>{goTab('games');});await w(200);
  T(vn+': tapping a tab updates the address',await p.evaluate(()=>location.hash==='#games'));
  T(vn+': zero console errors',e.err.length===0,e.err);
  T(vn+': no missing files',e.res404.length===0,e.res404);
  await ctx.close();
 }
 // parent: Running and Fuel open too, on parents.html as well
 for(const pg of ['family.html','parents.html']){
  const {ctx,p,e}=await family(b,{...devices['Pixel 7']},'parent');
  await p.goto(BASE+'/'+pg+'#running');await w(2200);await p.evaluate(()=>{['splash','tl-md'].forEach(i=>{const s=document.getElementById(i);if(s)s.remove();});});await w(600);
  T('parent '+pg+': #running opens Running',!!(await p.$('#tl-runview')));
  if(pg==='family.html')await shot(p,'parent_running.png');
  T('parent '+pg+': zero console errors',e.err.length===0,e.err);
  await ctx.close();
 }
 // offline shell lists running.js
 const fsw=fs.readFileSync(path.join(root,'fsw.js'),'utf8');
 T('fsw.js caches running.js and the family pages for offline',/running\.js\?v=112/.test(fsw)&&/'family\.html'/.test(fsw)&&/'parents\.html'/.test(fsw));
 const run=fs.readFileSync(path.join(root,'running.js'),'utf8');
 T('running.js makes no network calls',!/fetch\(|XMLHttpRequest|\bcall\(|sendBeacon/.test(run));
 T('running.js has no keys or tokens',!/api[_-]?key|token|secret/i.test(run));
 console.log('\n'+ok+' passed, '+bad+' failed');
 await b.close();srv.close();process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
