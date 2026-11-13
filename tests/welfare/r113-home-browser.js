// r113: new Homes, nav, folded help, offline helper for every family, coach Today hero, Let's go opens the match.
// Fake backend and pretend names. Wednesday 18 Nov 2026 17:30 (training 20:00 to 21:00), match Saturday 21 Nov 09:00.
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8831,BASE='http://localhost:'+PORT,H={'access-control-allow-origin':'*'};
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.webmanifest':'application/json'};
const RUN=(fs.readFileSync(path.join(root,'update.js'),'utf8').match(/RUN='(\d+)'/)||[])[1];
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end(JSON.stringify({v:RUN}));return;}let f=path.join(root,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};const w=ms=>new Promise(r=>setTimeout(r,ms));
const fake=day=>`(()=>{const T=new Date('${day}').getTime(),D0=Date.now(),R=Date;class FD extends R{constructor(...a){if(a.length)super(...a);else super(T+(R.now()-D0));}static now(){return T+(R.now()-D0);}}window.Date=FD;})()`;
const WED='2026-11-18T17:30:00',SAT='2026-11-21T07:40:00';
function fam(role){return {first:role==='parent'?'Jo':'Sam',role,num:'7',mine:{},rsn:{},at:Date.now(),photo:'',
 posts:[{id:'t1',type:'training',date:'2026-11-18',time:'20:00',title:'Training',place:'Christopher Park',why:'Pressing',status:'published'}],att:{},
 squadNums:[{id:'p3',num:'3'},{id:'p7',num:'7'}],vote:{motm:{open:false},poty:{open:false}},welcome:'Meet 08:30 on Saturday.',tips:'',res:[],feed:[],
 x:{fixtures:[{id:'fx1',opp:'Westhoughton',date:'2026-11-21',ko:'09:00',ha:'A',comp:'League',venue:'Westhoughton',done:false,pp:0}],news:[{id:'n1',t:'Kit collection Saturday',d:'2026-11-16'}],events:[{id:'e1',title:'Team night',date:'2026-12-12',time:'18:00',place:'Clubhouse'}],lifts:[],media:[]}};}
const M1={id:'m1',opp:'Westhoughton',date:'2026-11-21',ko:'09:00',ha:'A',venue:'Westhoughton',status:'plan',formation:'352',kit:'A',half:35,avail:{},period:1,clock:{acc:0,running:false,t0:0},stints:{},ratings:{},lineup:{},events:[]};
const COACH={ideas:{},revs:{},gd:{},players:{p1:{id:'p1',name:'Alex Test',num:'1',active:true,pos:['GK']}},matches:{m1:M1},settings:{id:'main',half:35,subEvery:17,roles:{},posts:[{id:'t1',type:'training',date:'2026-11-18',time:'20:00',title:'Training',status:'published'}],sched:{trainDay:2,trainStart:'20:00',trainEnd:'21:00',trainMins:60,matchDay:5,meetBefore:30}},dirty:{},lastSync:Date.now()};
async function routes(p,role){await p.route(/^https?:\/\/(?!localhost)/,r=>{if(/macros/.test(r.request().url()))return r.fallback();r.fulfill({status:200,contentType:'application/json',headers:H,body:'{"ok":true}'});});
 await p.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}const d=role&&a.action==='f.home'?fam(role):{rows:[],docs:[],serverTime:Date.now()};r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});});}
async function famPage(b,role,page,dv,day,hash,keep){const ctx=await b.newContext(dv);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(fake(day||WED));await routes(p,role);
 await p.addInitScript(o=>{localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code',o.c);localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.'+o.c,'1');localStorage.setItem('fam.tour','1');},{c:role==='parent'?'PARENT1':'PLAYER1'});
 await p.goto(BASE+'/'+page+(hash||''));await w(2400);await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});await w(200);return {ctx,p,errs};}
(async()=>{const b=await chromium.launch();const phone={...devices['Pixel 7']},laptop={viewport:{width:1366,height:768}};
 for(const page of ['family.html','parents.html']){
  // parent, phone
  let {ctx,p,errs}=await famPage(b,'parent',page,phone);
  T(page+' parent nav is Home, Calendar, Videos, Ask, Me',(await p.$$eval('nav.tabs button',x=>x.map(b=>b.getAttribute('aria-label')).join())) ==='Home,Calendar,Videos,Ask,Me');
  T(page+' parent Home starts with hello and the Yes or No card',await p.evaluate(()=>{const h=document.getElementById('tlh-hello'),a=document.getElementById('att-top');return !!h&&!!a&&a.getBoundingClientRect().top<innerHeight*0.6;}));
  T(page+' parent Home shows Wednesday 20:00 training',/Wednesday 18 November, 20:00/.test(await p.textContent('#att-top')));
  T(page+' Home has no old shortcut row or jump chips',await p.evaluate(()=>!document.querySelector('#root .tl-jump')&&!/Shortcuts: Playing/.test(document.body.innerText)));
  T(page+' Home has no share bar and no floating Ask',await p.evaluate(()=>!document.querySelector('.tl-share-bar')&&(!document.getElementById('tl-voice-fab')||getComputedStyle(document.getElementById('tl-voice-fab')).display==='none')));
  T(page+' More for you is folded',await p.evaluate(()=>{const m=document.getElementById('tlh-more');return !!m&&[...m.querySelectorAll('details')].every(d=>!d.open);}));
  await p.evaluate(()=>goTab('games'));await w(500);
  T(page+' Calendar: Games and Events switch, Calendar lit',await p.evaluate(()=>!!document.querySelector('.tl-calsw')&&document.querySelector('nav.tabs button.on').getAttribute('aria-label')==='Calendar'));
  T(page+' Games: fixtures come before the help fold',await p.evaluate(()=>{const f=document.querySelector('[data-fold="tl-matchday"]'),x=[...document.querySelectorAll('#root *')].find(e=>/Westhoughton/.test(e.textContent)&&e.children.length===0);return !!f&&!!x&&(x.compareDocumentPosition(f)&Node.DOCUMENT_POSITION_FOLLOWING);}));
  T(page+' Games keeps Share this page',!!(await p.$('.tl-share-bar')));
  await p.evaluate(()=>goTab('events'));await w(400);
  T(page+' Events still lights Calendar',await p.evaluate(()=>document.querySelector('nav.tabs button.on').getAttribute('aria-label')==='Calendar'));
  await p.evaluate(()=>goTab('voice'));await w(400);
  T(page+' parent Ask tab opens ask the coaches',await p.evaluate(()=>document.querySelector('nav.tabs button.on').getAttribute('aria-label')==='Ask'));
  await p.evaluate(()=>{if(window.openMore)openMore();else{const b=[...document.querySelectorAll('button')].find(x=>/More/.test(x.textContent));b&&b.click();}});await w(400);
  const more=await p.evaluate(()=>document.body.innerText);
  T(page+' More still reaches every feature',['Training','Contacts','FAQ','Clips','Games','Events','Media'].every(k=>new RegExp(k,'i').test(more)));
  T(page+' account button says Switch with a letter',await p.evaluate(()=>{const b=document.getElementById('acctbtn');return !!b&&/Switch/.test(b.textContent)&&!!b.querySelector('.ab');}));
  await w(1500);
  T(page+' offline helper is on without turning on alerts',await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return !!r&&/fsw\.js/.test((r.active||r.installing||r.waiting||{}).scriptURL||'');}));
  T(page+' family source has friendly alert errors',await p.evaluate(()=>fetch(location.pathname).then(r=>r.text()).then(t=>/That did not work\. Check you have signal/.test(t)&&!/Could not switch on alerts\. '\+/.test(t))));
  T(page+' MoM keeps names already shown, falls back to Shirt number',await p.evaluate(()=>{D.vote={motm:{open:true,cands:[{id:'p7',num:'7',name:'Sam'}]}};motmCands();D.vote={motm:{open:true,cands:[]}};D.squadNums=[{id:'p7',num:'7'},{id:'p9',num:'9'}];const c=motmCands();return c[0].name==='Sam'&&!c[1].name&&motmPersonLabel(c[1])==='Shirt 9'&&motmPersonLabel(c[0])==='Sam · 7';}));
  T(page+' parent no page errors',errs.length===0);if(errs.length)console.log(errs);
  await ctx.close();
  // old links
  for(const [h,t] of [['#games','games'],['#media','media'],['#lib','lib'],['#events','events'],['#faq','faq'],['#contacts','contacts'],['#ask','voice'],['#train','train'],['#calendar','games'],['#videos','media']]){
   ({ctx,p,errs}=await famPage(b,'parent',page,phone,WED,h));T(page+' link '+h+' opens '+t,await p.evaluate(()=>tab)===t);await ctx.close();}
  ({ctx,p,errs}=await famPage(b,'player',page,phone,WED,'#running'));T(page+' link #running opens Running',!!(await p.$('#tl-runview')));await ctx.close();
  // player, phone
  ({ctx,p,errs}=await famPage(b,'player',page,phone));
  T(page+' player nav is Home, Calendar, Videos, Train, Me',(await p.$$eval('nav.tabs button',x=>x.map(b=>b.getAttribute('aria-label')).join()))==='Home,Calendar,Videos,Train,Me');
  T(page+' player hero is Saturday\'s game',/Saturday/.test(await p.textContent('#tl-next'))&&/Westhoughton/.test(await p.textContent('#tl-next')));
  T(page+' player tiles: Run, Stretch, My goals, Ask',await p.evaluate(()=>[...document.querySelectorAll('.tlh-tile')].map(x=>x.textContent.trim()).join('|').replace(/[^A-Za-z| ]/g,'').trim()==='Run|Stretch|My goals|Ask'));
  await p.click('#tl-next .btn');await w(500);
  T(page+' Your job on Saturday opens Train',await p.evaluate(()=>tab)==='train');
  T(page+' player no page errors',errs.length===0);if(errs.length)console.log(errs);
  await ctx.close();
  // help bands fold after the first view
  ({ctx,p,errs}=await famPage(b,'parent',page,phone));await p.evaluate(()=>goTab('games'));await w(400);
  const first=await p.evaluate(()=>document.querySelector('[data-fold="tl-matchday"]').open);
  await p.evaluate(()=>{sessionStorage.clear();goTab('home');goTab('games');});await w(400);
  const second=await p.evaluate(()=>document.querySelector('[data-fold="tl-matchday"]').open);
  T(page+' help is open the first time, folded after',first===true&&second===false);await ctx.close();
  // laptop
  ({ctx,p,errs}=await famPage(b,'parent',page,laptop));
  const nr=await p.evaluate(()=>{const r=document.querySelector('nav.tabs').getBoundingClientRect();return [r.x,r.width,r.height];});
  T(page+' 1366 laptop nav is a rail on the left',nr[0]===0&&nr[1]<=100&&nr[2]>=700);
  T(page+' 1366 laptop no sideways scroll',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  await ctx.close();
  // match day: Home puts the match first
  ({ctx,p,errs}=await famPage(b,'parent',page,phone,SAT));
  T(page+' match day screen says see today\'s match',/see today's match/.test(await p.evaluate(()=>{const m=document.getElementById('tl-md');return m?m.innerText:'';})));
  await p.click('#tl-md-go');await w(700);
  T(page+' match day Home opens with the match card',await p.evaluate(()=>{const m=document.getElementById('tl-md-pin')||document.querySelector('#root .tl-md-card,#root [id^="tl-md"]');const a=document.getElementById('att-top');return !!m&&(!a||m.compareDocumentPosition(a)&Node.DOCUMENT_POSITION_FOLLOWING);}));
  await ctx.close();
 }
 // consent card
 {const {ctx,p,errs}=await famPage(b,'parent','family.html',phone);await p.evaluate(()=>{CN.d={season:'',card:null};CN.err='';goTab('me');});await w(500);
  const t=await p.evaluate(()=>document.body.innerText);T('consent card has no empty Season',!/Season \./.test(t));
  T('consent radios are big enough to tap',await p.evaluate(()=>{const r=document.querySelector('.cn-opt input');if(!r)return false;const b=r.getBoundingClientRect(),l=r.closest('label').getBoundingClientRect();return b.width>=20&&l.height>=48;}));await ctx.close();}
 // coach, Wednesday
 for(const dv of [phone,laptop]){const ctx=await b.newContext(dv);const c=await ctx.newPage();const errs=[];c.on('pageerror',e=>errs.push(e.message));await c.addInitScript(fake(WED));
  await c.addInitScript(s=>{localStorage.setItem('tl.code','COACH1');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',JSON.stringify(s));},COACH);await routes(c,null);
  await c.goto(BASE+'/coach/index.html');await w(2500);await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
  const tag=dv===phone?'phone':'laptop';
  T(tag+' coach Today hero: Tonight, Training 20:00 to 21:00',/Tonight/.test(await c.textContent('#tlc-train'))&&/20:00 to 21:00/.test(await c.textContent('#tlc-train')));
  T(tag+' coach Today: Saturday match with Pick team',/Saturday/.test(await c.textContent('#tlc-match'))&&/Pick team/.test(await c.textContent('#tlc-match')));
  T(tag+' coach Today: Waiting for you card',!!(await c.$('#tlc-wait')));
  T(tag+' coach header has no Bright and no Saved pill',await c.evaluate(()=>!document.querySelector('header [data-act="ps"]')&&(document.getElementById('st').hidden||getComputedStyle(document.getElementById('st')).display==='none')));
  T(tag+' coach has no share bar',!(await c.$('.tl-share-bar')));
  T(tag+' coach old Today sections still there',await c.evaluate(()=>['sec-today','sec-coming','sec-voice','sec-todo'].every(i=>!!document.getElementById(i))));
  await c.evaluate(()=>{location.hash='#/more';});await w(700);T(tag+' Bright screen is in More',!!(await c.$('#root [data-act="ps"]')));
  T(tag+' coach no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();}
 // coach, Saturday: Let's go opens the match
 {const ctx=await b.newContext(phone);const c=await ctx.newPage();const errs=[];c.on('pageerror',e=>errs.push(e.message));await c.addInitScript(fake(SAT));
  await c.addInitScript(s=>{localStorage.setItem('tl.code','COACH1');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',JSON.stringify(s));},COACH);await routes(c,null);
  await c.goto(BASE+'/coach/index.html');await w(2500);
  T('coach match day screen says open the match',/open the match/.test(await c.textContent('#tl-md')));
  await c.click('#tl-md-go');await w(900);T('Let\'s go opens the match',await c.evaluate(()=>location.hash)==='#/m/m1'&&/Plan match/.test(await c.textContent('#root')));
  await c.evaluate(()=>{location.hash='#/today';});await w(900);
  T('coach match day: Today opens with the match',await c.evaluate(()=>{const t=document.getElementById('tlc-top');return !!t&&!!t.querySelector('#tl-md-pin')&&!document.getElementById('tlc-train');}));
  T('coach match day no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();}
 // stretch label and Deeno
 {const ctx=await b.newContext(phone);const s=await ctx.newPage();await s.goto(BASE+'/stretch/index.html');await w(1500);
  T('stretch videos say computer made demo',/Computer made demo, not a real player/.test(await s.textContent('body')));await ctx.close();}
 const src=f=>fs.readFileSync(path.join(root,f),'utf8');
 T('voice, coach and running speech say Deeno',/Deano\\b\/g,'Deeno'/.test(src('voice.js'))&&/Deano\\b\/g,'Deeno'/.test(src('coach/app.js'))&&/Deano\\b\/g,'Deeno'/.test(src('running.js')));
 T('TTS build scripts say Deeno',/'Deeno'/.test(src('tools/stretch/build.py'))&&/'Deeno'/.test(src('tools/anim/build.py')));
 T('team week defaults are Wednesday 20:00 to 21:00 and Saturday',/trainDay:2,trainStart:'20:00',trainEnd:'21:00'/.test(src('coach/app.js'))&&/dayN=\['Mon','Tue','Wed'/.test(src('coach/app.js'))&&/matchDay:5/.test(src('coach/app.js')));
 console.log(ok+' passed, '+bad+' failed');await b.close();srv.close();process.exit(bad?1:0);})().catch(e=>{console.error(e);process.exit(2);});
