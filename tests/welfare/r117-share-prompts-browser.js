// r117: in-app Share sheet (5 audiences, More ways only for public team pages, server refusal mirrored on the phone), Tuesday 19:00 weekly review and Friday 18:00 Saturday prep.
// Fake backend and pretend names only. Nothing real is sent. No push alerts.
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=process.env.ROOT||path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8841,BASE='http://localhost:'+PORT,H={'access-control-allow-origin':'*'};
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.webmanifest':'application/json','.jpg':'image/jpeg'};
const RUN=(fs.readFileSync(path.join(root,'update.js'),'utf8').match(/RUN='(\d+)'/)||[])[1];
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end(JSON.stringify({v:RUN}));return;}let f=path.join(root,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};const w=ms=>new Promise(r=>setTimeout(r,ms));const tap=(p,sel)=>p.$eval(sel,x=>x.click()); /* coach app can zoom text, which upsets pointer hit tests */
const SHOTS=process.env.SHOTS||'';if(SHOTS)fs.mkdirSync(SHOTS,{recursive:true});const shot=async(p,n)=>{if(SHOTS)await p.screenshot({path:path.join(SHOTS,n+'.png')});};
const fake=day=>`(()=>{const T=new Date('${day}').getTime(),D0=Date.now(),R=Date;class FD extends R{constructor(...a){if(a.length)super(...a);else super(T+(R.now()-D0));}static now(){return T+(R.now()-D0);}}window.Date=FD;})()`;
const NAMES=[['p1','Alex Test','1',['GK']],['p2','Ben Sample','2',['RWB','RB']],['p3','Cal Demo','3',['CB']],['p4','Dan Pretend','4',['CB','CDM']],['p5','Eli Mock','5',['CB']],['p6','Finn Fake','6',['LWB','LB']],['p7','Gus Trial','7',['CDM','CM']],['p8','Hal Draft','8',['CM']],['p9','Ian Model','9',['CM','CAM']],['p10','Jay Sketch','10',['ST']],['p11','Kit Proto','11',['ST','RW']],['p12','Lou Spare','12',['LB','CB']],['p14','Max Bench','14',['CM','CDM']],['p15','Ned Reserve','15',['ST']],['p16','Oli Standby','16',['RB','RM']]];
const squad=()=>{const o={};NAMES.forEach(n=>o[n[0]]={id:n[0],name:n[1],num:n[2],pos:n[3],active:true});return o;};
const LINEUP={GK:'p1',RCB:'p3',CB:'p4',LCB:'p5',RWB:'p2',LWB:'p6',CDM:'p7',RCM:'p8',LCM:'p9',RST:'p10',LST:'p11'};
const match=o=>Object.assign({id:'m1',opp:'Westhoughton Town FC U15',date:'2026-11-21',ko:'09:00',ha:'A',kit:'H',venue:'Westhoughton',addr:'Westhoughton',comp:'League',formation:'352',half:35,avail:{},lineup:{},status:'plan',period:1,clock:{acc:0,running:false,t0:0},stints:{},events:[],ratings:{},notes:'',updatedAt:1},o||{});
const live=(min,o)=>{const st={};Object.keys(LINEUP).forEach(k=>st[LINEUP[k]]=[{in:0,out:null,slot:k}]);return match(Object.assign({lineup:Object.assign({},LINEUP),status:min===35?'ht':'live',period:min>35?2:1,clock:{acc:min*60,running:false,t0:0},stints:st,events:[{id:'e0',t:0,type:'ko'},{id:'e1',t:600,type:'goal',pid:'p10'}]},o||{}));};
const state=(m,extra)=>Object.assign({ideas:{},revs:{},gd:{},players:squad(),matches:{m1:m},settings:Object.assign({id:'main',half:35,subEvery:17,roles:{},posts:[],sched:{trainDay:2,trainStart:'20:00',trainEnd:'21:00',trainMins:60,matchDay:5,half:35,meetBefore:30,maxPersonal:2},updatedAt:0},(extra&&extra.settings)||{}),dirty:{},lastSync:Date.now()});
async function routes(p,fn,calls){await p.route(/^https?:\/\/(?!localhost)/,r=>{const u=r.request().url();if(!/macros/.test(u))return r.fulfill({status:200,contentType:'application/json',headers:H,body:'{}'});let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}calls&&calls.push(a);const d=fn?fn(a):null;
 if(d&&d.__err)return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:false,error:d.__err})});r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d||{rows:[],docs:[],serverTime:Date.now()}})});});}
async function coach(b,dv,st,day,o){o=o||{};const ctx=await b.newContext(dv);const p=await ctx.newPage();const errs=[],calls=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());await p.addInitScript(fake(day));
 await p.addInitScript(a=>{localStorage.setItem('tl.code','COACH1');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',JSON.stringify(a.s));if(a.shown){const d=new Date();localStorage.setItem('tl.md.shown.'+d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),'1');}},{s:st,shown:!!o.shown});
 await routes(p,o.api,calls);await p.goto(BASE+'/coach/index.html'+(o.hash||''));await w(2300);await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});return {ctx,p,errs,calls};}
function famData(role,fx){return {first:role==='parent'?'Jo':'Sam',role,num:'7',mine:{},rsn:{},at:Date.now(),photo:'',posts:[],att:{},squadNums:[{id:'p7',num:'7'}],vote:{motm:{open:false},poty:{open:false}},welcome:'',tips:'',res:[],feed:[],x:{fixtures:fx,news:[],events:[],lifts:[],media:[]}};}
async function fam(b,dv,page,role,day,api){const ctx=await b.newContext(dv);const p=await ctx.newPage();const errs=[],calls=[];p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(fake(day));
 await routes(p,api,calls);await p.addInitScript(c=>{localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code',c);localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.'+c,'1');localStorage.setItem('fam.tour','1');},role==='parent'?'PARENT1':'PLAYER1');
 await p.goto(BASE+'/'+page);await w(2400);await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});await w(300);return {ctx,p,errs,calls};}
const DONEFX=[{id:'m1',opp:'Westhoughton',date:'2026-11-21',ko:'09:00',ha:'A',comp:'League',venue:'Westhoughton',done:true,pp:0,f:2,a:1,motm:'Sam'}];
/* r117 helpers */
const SAT=o=>match(Object.assign({id:'m2',opp:'Rivals Athletic',date:'2026-11-28',ko:'10:00',ha:'H',kit:'H',venue:'Robin Park',scout:[{tag:'danger',txt:'Their 9 is quick'}]},o||{}));
const LAST=()=>match({id:'m0',opp:'Old Lane',date:'2026-11-21',status:'done',f:1,a:2});
const st2=(ms,extra)=>{const s=state(SAT(),extra);s.matches=ms;return s;};
const v39=a=>a.action==='share.caps'?{v:39,aud:['team','players','parents'],guard:true}:a.action==='feed.send'?{ok:true,n:(a.pids||[]).length||12,aud:a.aud}:null;
const stubShare=()=>{window.__nativeShare=0;try{Object.defineProperty(navigator,'share',{value:function(){window.__nativeShare++;return Promise.resolve();},configurable:true});}catch(e){}};
async function openFake(p,o){await p.evaluate(o=>{const b=document.createElement('button');b.type='button';b.id='fk';b.setAttribute('data-tlshare','1');b.setAttribute('data-title',o.t);b.setAttribute('data-text',o.t);b.setAttribute('data-url',o.u);if(o.co)b.setAttribute('data-coach-only','1');b.textContent='Share';document.getElementById('root').appendChild(b);b.click();},o);await w(350);}
const fs2=calls=>calls.filter(c=>c.action==='feed.send');
const lum=c=>{const m=c.match(/\d+(\.\d+)?/g).map(Number);const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};return 0.2126*f(m[0])+0.7152*f(m[1])+0.0722*f(m[2]);};
(async()=>{const b=await chromium.launch();{const nc=b.newContext.bind(b);b.newContext=async(...a)=>{const c=await nc(...a);await c.addInitScript(()=>{try{for(const k of ['SpeechRecognition','webkitSpeechRecognition'])if(window[k])Object.defineProperty(window[k],'available',{value:undefined});}catch(e){}});return c;};}
 const phone={...devices['Pixel 7']},laptop={viewport:{width:1366,height:768}};
 // wording rules on everything new in this release
 const app=fs.readFileSync(path.join(root,'coach/app.js'),'utf8'),blk=app.slice(app.indexOf('Release 117: Share inside Touchline'),app.indexOf("sh117FriGo:function"));
 const strs=(blk.match(/'[^'\n]{3,}'/g)||[]).join(' ');
 T('new words: no em dashes',!/\u2014/.test(blk));
 T('new words: no banned words',!/\b(journey|leverage|unlock|empower|holistic|deep dive|resilience|potential|embrace|stakeholder|chase)\b/i.test(strs));
 T('Comms card no longer says WhatsApp',!/data-act="waSend">Share to WhatsApp/.test(app)&&/<h3>Share a message<\/h3>/.test(app)&&/data-act="waSend">Share</.test(app));
 for(const [dn,dv] of [['phone',phone],['1366',laptop]]){
  // 1. Wednesday, old backend (v38): Share opens the in-app sheet, never the phone share sheet
  let {ctx,p,errs,calls}=await coach(b,dv,st2({m0:LAST(),m2:SAT()}),'2026-11-25T10:00:00');
  await p.evaluate(stubShare);
  await openFake(p,{t:'Our 3-5-2 shape',u:'/shape/'});
  T(dn+' Share opens the in-app sheet',await p.evaluate(()=>!!document.querySelector('#sh117[role="dialog"][aria-modal="true"]')));
  T(dn+' phone share sheet not used',await p.evaluate(()=>window.__nativeShare===0));
  const labels=await p.$$eval('#sh117 .sh117opt b',x=>x.map(y=>y.textContent));
  T(dn+' five audiences in order',JSON.stringify(labels)===JSON.stringify(['Whole team','Players','Parents only','Choose people','Coaches only']));
  T(dn+' Players is the default',await p.evaluate(()=>document.querySelector('#sh117 .sh117opt.on b').textContent==='Players'));
  T(dn+' old backend: Parents only waits for v39',await p.evaluate(()=>{const o=[...document.querySelectorAll('#sh117 .sh117opt')].find(x=>/Parents only/.test(x.innerText));return o.disabled&&/v39/.test(o.innerText);}));
  T(dn+' public team page: More ways with WhatsApp',await p.evaluate(()=>{const d=document.querySelector('#sh117 .sh117more');return !!d&&/WhatsApp/.test(d.textContent)&&!!d.querySelector('a[href^="https://wa.me/"]');}));
  await shot(p,'r117_'+dn+'_sheet_public');
  // accessibility basics
  const a11y=await p.evaluate(()=>{const out={small:[],noname:[],contrast:[]};document.querySelectorAll('#sh117 button, #sh117 summary, #sh117 a, #sh117 textarea').forEach(el=>{const r=el.getBoundingClientRect();if(r.width&&r.height&&(r.width<44||r.height<44)&&el.tagName!=='TEXTAREA')out.small.push(el.textContent.trim().slice(0,20)+' '+Math.round(r.width)+'x'+Math.round(r.height));const nm=(el.getAttribute('aria-label')||el.textContent||'').trim()||(el.id&&document.querySelector('label[for="'+el.id+'"]')||{}).textContent;if(!nm)out.noname.push(el.outerHTML.slice(0,60));});
   document.querySelectorAll('#sh117 .sh117opt:not([disabled]) b, #sh117 .sh117opt:not([disabled]) .small, #sh117 h2, #sh117 .btn').forEach(el=>{let bg=null,n=el;while(n&&!bg){const c=getComputedStyle(n).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))bg=c;n=n.parentElement;}out.contrast.push([getComputedStyle(el).color,bg||'rgb(6,16,43)',el.textContent.trim().slice(0,16)]);});return out;});
  T(dn+' tap targets at least 44 px',a11y.small.length===0);if(a11y.small.length)console.log(a11y.small);
  T(dn+' every control has a name',a11y.noname.length===0);if(a11y.noname.length)console.log(a11y.noname);
  const lowC=a11y.contrast.filter(([f,bg])=>{const L1=lum(f),L2=lum(bg);return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05)<4.5;});
  T(dn+' text contrast at least 4.5 to 1',lowC.length===0);if(lowC.length)console.log(lowC);
  T(dn+' dialog has a heading label and radio group',await p.evaluate(()=>{const d=document.getElementById('sh117');return document.getElementById(d.getAttribute('aria-labelledby'))&&d.querySelector('[role="radiogroup"]')&&[...d.querySelectorAll('[role="radio"]')].every(x=>x.hasAttribute('aria-checked'));}));
  T(dn+' sheet fits the screen without page scroll behind',await p.evaluate(()=>{const r=document.querySelector('#sh117 .sh117in').getBoundingClientRect();return r.top>=0&&r.bottom<=window.innerHeight+1;}));
  await p.keyboard.press('Escape');await w(200);
  T(dn+' Escape closes and writes nothing',await p.evaluate(()=>!document.getElementById('sh117'))&&fs2(calls).length===0);
  // non public link: no More ways, no WhatsApp anywhere
  await openFake(p,{t:'Rondo video',u:'https://www.youtube.com/watch?v=abc'});
  T(dn+' ordinary link: no More ways and no WhatsApp',await p.evaluate(()=>!document.querySelector('#sh117 .sh117more')&&!document.querySelector('#sh117 a[href*="wa.me"]')&&!/WhatsApp/.test(document.getElementById('sh117').innerText)));
  // whole team: Send, then Cancel on the check step writes nothing, then Send sends
  await tap(p,'#sh117 [data-sh="aud"][data-v="team"]');await w(150);
  await p.fill('#sh117n','Watch before Wednesday');
  await tap(p,'#sh117send');await w(200);
  T(dn+' Send asks first',await p.evaluate(()=>/Send to Whole team\?/.test(document.getElementById('sh117').innerText)&&!!document.getElementById('sh117go')));
  await shot(p,'r117_'+dn+'_sheet_check');
  await tap(p,'#sh117 [data-sh="back"]');await w(150);
  T(dn+' Cancel on the check step sends nothing',fs2(calls).length===0&&await p.evaluate(()=>document.getElementById('sh117n').value==='Watch before Wednesday'));
  await tap(p,'#sh117send');await w(150);await tap(p,'#sh117go');await w(600);
  let fc=fs2(calls);
  T(dn+' whole team goes to every profile with audience team',fc.length===1&&fc[0].all===true&&fc[0].aud==='team'&&fc[0].item.note==='Watch before Wednesday'&&fc[0].item.u==='https://www.youtube.com/watch?v=abc');
  T(dn+' sheet closes after sending',await p.evaluate(()=>!document.getElementById('sh117')));
  // choose people: Keepers group picks the keeper only
  await openFake(p,{t:'Keeper distribution clip',u:'https://www.youtube.com/watch?v=gk1'});
  await tap(p,'#sh117 [data-sh="aud"][data-v="pick"]');await w(150);
  T(dn+' Choose people shows groups and shirt numbers',await p.evaluate(()=>/Keepers/.test(document.getElementById('sh117').innerText)&&document.querySelectorAll('#sh117 [data-sh="pid"]').length>=11));
  await tap(p,'#sh117 [data-sh="grp"][data-v="k"]');await w(150);
  T(dn+' Keepers picks #1 only',await p.evaluate(()=>[...document.querySelectorAll('#sh117 [data-sh="pid"].on')].map(x=>x.getAttribute('data-v')).join()==='p1'));
  T(dn+' old backend: no parents only switch',await p.evaluate(()=>!document.getElementById('sh117par')));
  await shot(p,'r117_'+dn+'_sheet_choose');
  await tap(p,'#sh117send');await w(150);await tap(p,'#sh117go');await w(600);fc=fs2(calls);
  T(dn+' chosen player sent with their id, parent sees it (players)',fc.length===2&&fc[1].all===false&&JSON.stringify(fc[1].pids)==='["p1"]'&&fc[1].aud==='players');
  // coach only item: only Coaches only, saved for coaches, nothing to families
  await openFake(p,{t:'Coaches Voice: back three',u:'https://www.coachesvoice.com/x',co:1});
  T(dn+' coach only: only Coaches only can be picked',await p.evaluate(()=>[...document.querySelectorAll('#sh117 .sh117opt')].filter(x=>!x.disabled).map(x=>x.querySelector('b').textContent).join()==='Coaches only'));
  await shot(p,'r117_'+dn+'_sheet_coachonly');
  await tap(p,'#sh117send');await w(150);await tap(p,'#sh117go');await w(500);
  T(dn+' coach only saved, nothing sent to families',fs2(calls).length===2&&await p.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('tl.state.v1')).gd||{}).some(k=>/^sh117c_/.test(k))));
  await p.evaluate(()=>{location.hash='#/today';});await w(600);
  T(dn+' For coaches only card on Today',await p.evaluate(()=>{const c=document.getElementById('sh117box');return !!c&&/Coaches Voice: back three/.test(c.innerText);}));
  // rating style words are refused on the phone too
  await p.evaluate(()=>window.sendToProfile({t:'Ratings: 7 for passing',kind:'note'}));await w(300);
  T(dn+' rating words: only Coaches only allowed',await p.evaluate(()=>[...document.querySelectorAll('#sh117 .sh117opt')].filter(x=>!x.disabled).length===1&&/stay with the coaches/.test(document.getElementById('sh117').innerText)));
  await tap(p,'#sh117 [data-sh="x"]');await w(150);
  // Comms message button opens the same sheet
  await p.evaluate(()=>{location.hash='#/hub';});await w(900);
  const hasWat=await p.$('#wat');
  if(hasWat){await p.fill('#wat','Training moved to 19:30 tonight\nSame pitch');await tap(p,'[data-act="waSend"]');await w(300);
   T(dn+' Comms Share opens the in-app sheet with the message',await p.evaluate(()=>{const d=document.getElementById('sh117');return !!d&&/Training moved to 19:30 tonight/.test(d.innerText)&&window.__nativeShare===0;}));
   await shot(p,'r117_'+dn+'_comms_sheet');await tap(p,'#sh117 [data-sh="x"]');}
  else T(dn+' Comms Share card found',false);
  T(dn+' no page errors (old backend)',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
  // 2. new backend (v39): Parents only works
  ({ctx,p,errs,calls}=await coach(b,dv,st2({m0:LAST(),m2:SAT()}),'2026-11-25T10:00:00',{api:v39}));
  await openFake(p,{t:'Subs reminder',u:'https://example.com/subs'});await w(300);
  T(dn+' v39: Parents only can be picked',await p.evaluate(()=>{const o=[...document.querySelectorAll('#sh117 .sh117opt')].find(x=>/Parents only/.test(x.innerText));return !o.disabled;}));
  await tap(p,'#sh117 [data-sh="aud"][data-v="parents"]');await w(150);
  T(dn+' v39: Parents only says players do not see it',await p.evaluate(()=>/Players do not see it/.test(document.getElementById('sh117who').innerText)));
  await tap(p,'#sh117send');await w(150);await tap(p,'#sh117go');await w(600);fc=fs2(calls);
  T(dn+' v39: parents only sent with audience parents',fc.length===1&&fc[0].aud==='parents'&&fc[0].all===true);
  await openFake(p,{t:'Lift list',u:'https://example.com/lifts'});await tap(p,'#sh117 [data-sh="aud"][data-v="pick"]');await w(150);
  await tap(p,'#sh117 [data-sh="pid"][data-v="p3"]');await w(100);await p.check('#sh117par');await w(100);
  T(dn+' v39: chosen people, parents only line',await p.evaluate(()=>/Parents of 1 chosen player only/.test(document.getElementById('sh117who').innerText)));
  await shot(p,'r117_'+dn+'_sheet_parents');
  await tap(p,'#sh117send');await w(150);await tap(p,'#sh117go');await w(600);fc=fs2(calls);
  T(dn+' v39: parents of chosen player sent',fc.length===2&&fc[1].aud==='parents'&&JSON.stringify(fc[1].pids)==='["p3"]');
  T(dn+' no page errors (v39)',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
  // 3. Tuesday 19:30: weekly review card, shared with Deano
  const dRev={rd1:{id:'rd1',kind:'train',date:'2026-11-18',by:'Deano',title:'Pressing',sc:{eng:4},tx:{},c:{},w:{},d:{},at:1}};
  ({ctx,p,errs,calls}=await coach(b,dv,Object.assign(st2({m0:LAST(),m2:SAT()}),{revs:dRev}),'2026-11-24T19:30:00'));
  T(dn+' Tuesday 19:30: Weekly review card',await p.evaluate(()=>{const c=document.getElementById('sh117tue');return !!c&&/Reflection on Saturday/.test(c.innerText)&&/Training scores/.test(c.innerText)&&/Plan Wednesday/.test(c.innerText);}));
  T(dn+' shows Deano done and a Read Deano\u2019s button',await p.evaluate(()=>/Deano: done/.test(document.getElementById('sh117tue').innerText)&&!!document.querySelector('#sh117tue [data-act="sh117RvOpen"][data-id="rd1"]')));
  await p.evaluate(()=>document.getElementById('sh117tue').scrollIntoView({block:'start'}));await w(150);await shot(p,'r117_'+dn+'_tuesday');
  await tap(p,'#sh117tue [data-act="sh117RvNew"][data-k="train"]');await w(600);
  T(dn+' Start opens a new training review by Tim',await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('tl.state.v1'));return Object.values(s.revs).some(r=>r.by==='Tim'&&r.kind==='train');})&&/Reflect/.test(await p.evaluate(()=>document.body.innerText)));
  T(dn+' no page errors (Tuesday)',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
  ({ctx,p,errs}=await coach(b,dv,st2({m0:LAST(),m2:SAT()}),'2026-11-24T18:30:00'));
  T(dn+' Tuesday 18:30: no review card yet',await p.evaluate(()=>!document.getElementById('sh117tue')));await ctx.close();
  ({ctx,p,errs}=await coach(b,dv,st2({m0:LAST(),m2:SAT()}),'2026-11-23T19:30:00'));
  T(dn+' Monday: no review card',await p.evaluate(()=>!document.getElementById('sh117tue')));await ctx.close();
  // 4. Friday 18:30: Saturday prep
  const pushReq=[];
  ({ctx,p,errs,calls}=await coach(b,dv,st2({m0:LAST(),m2:SAT()}),'2026-11-27T18:30:00'));
  p.on('request',r=>{if(/push|pushover|onesignal|fcm/i.test(r.url()))pushReq.push(r.url());});
  const fri=await p.evaluate(()=>{const c=document.getElementById('sh117fri');return c?c.innerText:'';});
  T(dn+' Friday 18:30: Saturday prep card',/Saturday prep/i.test(fri)&&/Rivals Athletic/.test(fri));
  T(dn+' meet time worked out: 09:30 for a 10:00 kick off',/Meet 09:30 for a 10:00 kick off at Robin Park/.test(fri));
  T(dn+' ideas: team, shape, keeper, coaches only scouting',await p.$$eval('#sh117fri .sh117idea',x=>x.map(y=>y.getAttribute('data-k')).join())==='meet,shape,gk,scout');
  T(dn+' keeper idea goes to 1 chosen, scouting to coaches only',/1 chosen/.test(fri)&&/Coaches only/.test(fri));
  T(dn+' Send is off until something is approved',await p.evaluate(()=>{const x=document.querySelector('#sh117fri [data-act="sh117FriChk"]');return x&&x.disabled;}));
  await tap(p,'#sh117fri [data-act="sh117FriSet"][data-k="meet"][data-v="ok"]');await w(200);
  await tap(p,'#sh117fri [data-act="sh117FriSet"][data-k="gk"][data-v="ok"]');await w(200);
  await tap(p,'#sh117fri [data-act="sh117FriSet"][data-k="scout"][data-v="skip"]');await w(200);
  await tap(p,'#sh117fri [data-act="sh117FriEdit"][data-k="shape"]');await w(200);
  await p.fill('#sh117fri textarea','Look at where you stand when we lose the ball.');await tap(p,'#sh117fri [data-act="sh117FriSave"]');await w(250);
  T(dn+' Edit saves the words and approves',/Look at where you stand when we lose the ball/.test(await p.evaluate(()=>document.getElementById('sh117fri').innerText)));
  T(dn+' Send 3 approved',/Send 3 approved/.test(await p.evaluate(()=>document.getElementById('sh117fri').innerText)));
  await p.evaluate(()=>document.getElementById('sh117fri').scrollIntoView({block:'start'}));await w(150);await shot(p,'r117_'+dn+'_friday');
  await tap(p,'#sh117fri [data-act="sh117FriChk"][data-v="1"]');await w(250);
  T(dn+' check step lists what goes where',await p.evaluate(()=>/Send 3 approved items\?/.test(document.getElementById('sh117fri').innerText)));
  await tap(p,'#sh117fri [data-act="sh117FriChk"][data-v="0"]');await w(200);
  T(dn+' Cancel sends nothing',fs2(calls).length===0);
  await tap(p,'#sh117fri [data-act="sh117FriChk"][data-v="1"]');await w(250);await tap(p,'#sh117fgo');await w(1200);fc=fs2(calls);
  T(dn+' Send sends the 3 approved and not the skipped',fc.length===3&&fc.some(c=>c.aud==='team'&&c.all===true)&&fc.some(c=>JSON.stringify(c.pids)==='["p1"]'&&c.all===false)&&!fc.some(c=>/Their 9 is quick/.test(JSON.stringify(c))));
  T(dn+' sent items marked Sent',(await p.evaluate(()=>(document.getElementById('sh117fri').innerText.match(/Sent by Tim/g)||[]).length))===3);
  T(dn+' no push alerts sent',pushReq.length===0);
  T(dn+' no page errors (Friday)',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
  ({ctx,p}=await coach(b,dv,st2({m0:LAST(),m2:SAT()}),'2026-11-27T17:30:00'));
  T(dn+' Friday 17:30: no prep card yet',await p.evaluate(()=>!document.getElementById('sh117fri')));await ctx.close();
  ({ctx,p}=await coach(b,dv,st2({m0:LAST()}),'2026-11-27T18:30:00'));
  T(dn+' Friday with no Saturday match: no prep card',await p.evaluate(()=>!document.getElementById('sh117fri')));await ctx.close();
 }
 console.log(ok+' passed, '+bad+' failed');await b.close();srv.close();process.exit(bad?1:0);})().catch(e=>{console.error(e);process.exit(1);});
