// r114: Matchday tab, sub suggestions, comments, archive, after the game card, scores as 1-2, share pack, media titles.
// Fake backend and pretend names only. Saturday 21 Nov 2026, kick off 09:00, 35 minutes each way.
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8841,BASE='http://localhost:'+PORT,H={'access-control-allow-origin':'*'};
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
(async()=>{const b=await chromium.launch();{const nc=b.newContext.bind(b);b.newContext=async(...a)=>{const c=await nc(...a);await c.addInitScript(()=>{try{for(const k of ['SpeechRecognition','webkitSpeechRecognition'])if(window[k])Object.defineProperty(window[k],'available',{value:undefined});}catch(e){}});return c;};}
 const phone={...devices['Pixel 7']},laptop={viewport:{width:1366,height:768}};
 for(const [dn,dv] of [['phone',phone],['1366',laptop]]){
  // 1. Saturday login opens Matchday
  let {ctx,p,errs,calls}=await coach(b,dv,state(match()),'2026-11-21T07:40:00');
  T(dn+' Saturday login opens Matchday',await p.evaluate(()=>/^#\/m\/m1/.test(location.hash)||!!document.getElementById('md-start')));
  T(dn+' nav says Matchday',/Matchday/.test(await p.evaluate(()=>document.body.innerText)));
  T(dn+' pick team then Start match button',!!(await p.$('#md-start')));
  await shot(p,'r114_'+dn+'_matchday');
  T(dn+' Matchday no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
  // 2. not matchday: Wednesday does not jump
  ({ctx,p,errs}=await coach(b,dv,state(match()),'2026-11-18T17:30:00'));
  T(dn+' Wednesday login stays on Today',await p.evaluate(()=>!/^#\/m\//.test(location.hash)&&!document.getElementById('md-start')));await ctx.close();
  // 3. live at 15: sub suggestions, coach decides
  ({ctx,p,errs,calls}=await coach(b,dv,state(live(15)),'2026-11-21T09:15:00',{shown:1,hash:'#/m/m1'}));
  const opts=await p.$$eval('.md-opt',x=>x.length);
  T(dn+' 15 min: 2 or 3 options for the 20 minute changes',opts>=2&&opts<=3);
  T(dn+' each option has a reason',await p.$$eval('.md-opt',x=>x.every(o=>o.innerText.split('\n').filter(Boolean).length>=2)));
  const before=await p.evaluate(()=>JSON.stringify((JSON.parse(localStorage.getItem('tl.state.v1')||'{}').matches||{}).m1.lineup));
  await p.evaluate(()=>{const e=document.querySelector('.md-sub');if(e)e.scrollIntoView({block:'start'});});await w(200);await shot(p,'r114_'+dn+'_sub15');
  await tap(p,'.md-opt [data-act="mdUse"]');await w(300);
  T(dn+' tapping an option asks first, nothing changed yet',before===await p.evaluate(()=>JSON.stringify((JSON.parse(localStorage.getItem('tl.state.v1')||'{}').matches||{}).m1.lineup))&&/Make these changes/.test(await p.textContent('#sheet')));
  await tap(p,'#sheet [data-act="mdDoIt"]');await w(300);
  T(dn+' Make changes does the swap',before!==await p.evaluate(()=>JSON.stringify((JSON.parse(localStorage.getItem('tl.state.v1')||'{}').matches||{}).m1.lineup)));
  T(dn+' live no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
  // 4. 30 min with quick check answers, half time warning
  ({ctx,p,errs}=await coach(b,dv,state(live(30,{mdq:{p:{p8:{v:'tired'},p2:{v:'knock'}},o:{left:1,press:1}}})),'2026-11-21T09:30:00',{shown:1,hash:'#/m/m1'}));
  const txt30=await p.evaluate(()=>[...document.querySelectorAll('.md-opt')].map(x=>x.innerText).join(' || '));
  T(dn+' 30 min: half time options shown',(await p.$$eval('.md-opt',x=>x.length))>=2);
  T(dn+' knocked player comes off in every option',await p.evaluate(()=>[...document.querySelectorAll('.md-opt')].every(o=>/Ben/.test(o.innerText))));
  T(dn+' reasons mention form or opposition',/tired|knock|press|left/i.test(txt30));
  await p.evaluate(()=>{const e=document.querySelector('.md-sub');if(e)e.scrollIntoView({block:'start'});});await w(200);await shot(p,'r114_'+dn+'_sub30');
  T(dn+' 30 min no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
  // 5. full time: score 2-1, comments card, remove and delete
  const doneM=live(70,{status:'done',period:2,events:[{id:'e0',t:0,type:'ko'},{id:'e1',t:600,type:'goal',pid:'p10'},{id:'e2',t:900,type:'ga'},{id:'e3',t:3000,type:'goal',pid:'p11'}],ratings:{p10:8}});
  const rows=[{id:'c1',at:Date.now(),mid:'m1',opp:'Westhoughton Town FC U15',kind:'game',text:'Great second half',status:'new',who:'Parent of Gus',role:'parent'},{id:'c2',at:Date.now(),mid:'m1',opp:'Westhoughton',kind:'opp',text:'Their 9 is quick',status:'new',who:'Gus (#7)',role:'player'}];
  ({ctx,p,errs,calls}=await coach(b,dv,state(doneM),'2026-11-21T10:30:00',{shown:1,hash:'#/m/m1',api:a=>a.action==='cmt.list'?{rows}:null}));
  await w(800);
  const body=await p.evaluate(()=>document.body.innerText);if(process.env.DBG)console.log(body.match(/.{0,40}\d.{0,3}(to|-).{0,3}\d.{0,40}/g));
  T(dn+' full time score shows as 2-1, never 2 to 1',/Latics 2-1 Westhoughton/.test(body)&&!/\d+ to \d+ (Westhoughton|Latics)|Latics \d+ to \d+/.test(body));
  T(dn+' comments card lists both comments, coaches only',await p.evaluate(()=>{const c=document.getElementById('cmt-card');return !!c&&/Great second half/.test(c.innerText)&&/Their 9 is quick/.test(c.innerText)&&/coaches only/i.test(c.innerText);}));
  await tap(p,'#cmt-card [data-act="cmtSet"][data-id="c1"]');await w(300);
  T(dn+' Remove calls cmt.set removed',calls.some(c=>c.action==='cmt.set'&&c.id==='c1'&&c.status==='removed'));
  await tap(p,'#cmt-card [data-act="cmtDel"][data-id="c2"]');await w(300);
  T(dn+' Delete asks then calls cmt.del',calls.some(c=>c.action==='cmt.del'&&c.id==='c2'));
  T(dn+' full time no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
  // 6. backend not updated: comments card explains, title edit waits on phone
  const media=[{id:'md1',src:'coach',title:'Old title',kind:'link',link:'https://example.com/a',status:'published',at:1,who:'Coaches'}];
  const clips=[{id:'cl1',title:'Rondo drill',kind:'drill',status:'live',at:1,who:'Coaches'}];
  ({ctx,p,errs,calls}=await coach(b,dv,state(doneM),'2026-11-21T10:30:00',{shown:1,hash:'#/hub',api:a=>/^(cmt\.|media\.title|clip\.title)/.test(a.action)?{__err:'Unknown action'}:a.action==='media.list'?{rows:media}:a.action==='clip.list'?{rows:clips,pt:'x'}:a.action==='feed.send'?{n:15}:null}));
  await p.evaluate(()=>{if(typeof go==='function')go('hub');else location.hash='#/hub';});await w(1500);
  const eb=await p.$('[data-act="ttlEdit"][data-k="media"]');T(dn+' Hub media has Edit title',!!eb);
  if(eb){await eb.click();await w(200);await p.fill('#ttl_in','New title for the drill');if(process.env.DBG)console.log(await p.evaluate(()=>{const b=document.querySelector('#sheet [data-act="ttlSave"]'),r=b.getBoundingClientRect(),e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return JSON.stringify(r)+' '+(e&&e.outerHTML.slice(0,200))+' sheets '+document.querySelectorAll('#sheet').length+' '+innerHeight;}));await p.$eval('#sheet [data-act="ttlSave"]',x=>x.click());await w(500);
   T(dn+' title edit calls media.title',calls.some(c=>c.action==='media.title'&&c.id==='md1'&&c.title==='New title for the drill'));
   T(dn+' unknown action: new title shown with waiting tag',/New title for the drill/.test(await p.evaluate(()=>document.body.innerText))&&/waiting for the update/.test(await p.evaluate(()=>document.body.innerText)));}
  // share pack
  T(dn+' share pack card is there with training films',await p.evaluate(()=>{const c=document.getElementById('pack-card');return !!c&&/Rondo drill/.test(c.innerText)&&/Nothing goes outside the app/.test(c.innerText);}));
  await tap(p,'#pack-card [data-act="packTog"]');await w(200);await tap(p,'#pack-card [data-act="packGo"]');await w(300);
  T(dn+' pack opens with Send and Cancel',!!(await p.$('#pk_go'))&&!!(await p.$('#pk_x')));
  await tap(p,'#pk_go');await w(500);
  T(dn+' pack sends inside Touchline (feed.send, whole squad)',calls.some(c=>c.action==='feed.send'&&c.all===true&&/Rondo/.test(c.item.t)));
  T(dn+' hub no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
  // 7. family after the game
  for(const page of ['family.html','parents.html']){for(const role of ['parent','player']){
   let fx={ctx:null};const api=a=>a.action==='f.home'?famData(role,DONEFX):a.action==='f.cmt.add'?{ok:true}:null;
   ({ctx,p,errs,calls}=await fam(b,dv,page,role,'2026-11-21T11:00:00',api));
   const card=await p.$('#pm-card');T(dn+' '+page+' '+role+' After the game card on Home',!!card);
   if(card){const t=await card.innerText();T(dn+' '+page+' '+role+' card shows 2-1 and says coaches only',/2-1/.test(t)&&/Only Tim and Deano see this/.test(t)&&/Played against them\? Tell the coaches what you spotted/.test(t));
    if(role==='parent'&&page==='family.html')await shot(p,'r114_'+dn+'_family_home_after');
    await p.fill('#pm-game','Good shape in the second half');await p.fill('#pm-opp','Their number 9 is quick on the left');await p.click('#pm-card button.pri');await w(300);
    T(dn+' '+page+' '+role+' confirm shows Send and Cancel',!!(await p.$('#pm-send'))&&/Cancel/.test(await p.textContent('#pm-card')));
    await p.click('#pm-card button:has-text("Cancel")');await w(200);T(dn+' '+page+' '+role+' Cancel goes back, nothing sent',!calls.some(c=>c.action==='f.cmt.add')&&!!(await p.$('#pm-game')));
    await p.click('#pm-card button.pri');await w(200);await p.click('#pm-send');await w(600);
    const adds=calls.filter(c=>c.action==='f.cmt.add');T(dn+' '+page+' '+role+' Send posts game and opposition notes',adds.length===2&&adds.some(c=>c.kind==='opp')&&adds.some(c=>c.kind==='game')&&adds.every(c=>c.mid==='m1'));
    T(dn+' '+page+' '+role+' thank you shown',/Sent to Tim and Deano/.test(await p.textContent('#pm-card')));}
   T(dn+' '+page+' '+role+' family page never shows coach ratings or quick check',!/rating|mdq|tired|knock/i.test(await p.evaluate(()=>document.getElementById('root').innerText)));
   T(dn+' '+page+' '+role+' no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();}}
  // 8. backend not updated: family note waits on the phone
  ({ctx,p,errs,calls}=await fam(b,dv,'family.html','parent','2026-11-21T11:00:00',a=>a.action==='f.home'?famData('parent',DONEFX):a.action==='f.cmt.add'?{__err:'Unknown action'}:null));
  await p.fill('#pm-opp','They press high from the start');await p.click('#pm-card button.pri');await w(200);await p.click('#pm-send');await w(600);
  T(dn+' unknown action: note saved on the phone to send later',/saved on this phone/.test(await p.textContent('#pm-card'))&&await p.evaluate(()=>JSON.parse(localStorage.getItem('fam.cmtq')||'[]').length===1));
  // before the game: no card
  await ctx.close();
  ({ctx,p,errs}=await fam(b,dv,'family.html','parent','2026-11-21T08:00:00',a=>a.action==='f.home'?famData('parent',[Object.assign({},DONEFX[0],{done:false,f:0,a:0})]):null));
  T(dn+' no After the game card before kick off',!(await p.$('#pm-card')));await ctx.close();
  // 9. archive: answered questions move to Previous questions
  ({ctx,p,errs}=await fam(b,dv,'family.html','parent','2026-11-21T11:00:00',a=>a.action==='f.home'?famData('parent',[]):null));
  const arch=await p.evaluate(()=>{const seen={};['Old one A|5','Old one B|5'].forEach(k=>seen[(k.split('|')[0])+'|'+'Answer'.length]=1);localStorage.setItem('fam.qseen',JSON.stringify(seen));
   const h=tlQList([{q:'Waiting one',a:''},{q:'Fresh one',a:'Answer'},{q:'Old one A',a:'Answer'},{q:'Old one B',a:'Answer'}],function(x,st){return '<p data-st="'+st+'">'+x.q+'</p>';},{id:'t-prevq'});const d=document.createElement('div');d.className='card';d.id='t-arch';d.innerHTML='<h2>Your questions</h2>'+h;document.getElementById('root').prepend(d);return h;});
  T(dn+' archive: waiting and new stay on top, answered go under Previous questions (2)',/Previous questions \(2\)/.test(arch)&&/data-st="wait">Waiting one/.test(arch)&&/data-st="new">Fresh one/.test(arch));
  await p.click('#t-prevq summary');await w(200);await shot(p,'r114_'+dn+'_family_archive');
  T(dn+' archive opens on request',await p.evaluate(()=>document.getElementById('t-prevq').open));await ctx.close();
  // coach archive
  ({ctx,p,errs}=await coach(b,dv,state(match()),'2026-11-18T17:30:00',{api:a=>a.action==='voice.list'?{rows:[{id:'v1',kind:'q',status:'answered',at:Date.now()-9*864e5,text:'When is the next tournament?',answer:'In March'},{id:'v2',kind:'q',status:'new',at:Date.now(),text:'Can we do more shooting?'}]}:null,hash:'#/hub'}));
  await p.evaluate(()=>{if(typeof go==='function')go('hub');else location.hash='#/hub';});await w(1500);const cprev=await p.$('#c-prevq');T(dn+' coach side moves answered questions to Previous questions',!!cprev&&/When is the next tournament/.test(await cprev.textContent())&&!(await cprev.evaluate(d=>d.open))&&/Can we do more shooting/.test(await p.evaluate(()=>document.getElementById('tl-voice').innerText)));
  if(cprev){await tap(p,'#c-prevq summary');await w(200);T(dn+' coach Previous questions opens on request',await cprev.evaluate(d=>d.open));}
  if(cprev){await cprev.scrollIntoViewIfNeeded();await shot(p,'r114_'+dn+'_coach_archive');}
  await ctx.close();
 }
 console.log(ok+' passed, '+bad+' failed');await b.close();srv.close();process.exit(bad?1:0);})().catch(e=>{console.error(e);process.exit(1);});
