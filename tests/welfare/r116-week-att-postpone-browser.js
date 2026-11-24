// r116: this week's training and match Yes or No on the front of Home (stays until Saturday is over, then rolls on),
// and Game off? (postponed or called off) on the coach's match day screens, with Send and Cancel before anything goes.
// Fake backend and pretend names only. Week of Wednesday 25 Nov (training 20:00 to 21:00) and Saturday 28 Nov 2026 (kick off 11:30).
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8916,BASE='http://localhost:'+PORT,H={'access-control-allow-origin':'*'};
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.webmanifest':'application/json','.jpg':'image/jpeg'};
const RUN=(fs.readFileSync(path.join(root,'update.js'),'utf8').match(/RUN='(\d+)'/)||[])[1];
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end(JSON.stringify({v:RUN}));return;}let f=path.join(root,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};const w=ms=>new Promise(r=>setTimeout(r,ms));const tap=(p,sel)=>p.$eval(sel,x=>x.click());
const SHOTS=process.env.SHOTS||'';if(SHOTS)fs.mkdirSync(SHOTS,{recursive:true});const PRE=process.env.PRE||'r116_';const shot=async(p,n,sel)=>{if(!SHOTS)return;try{if(sel)await p.evaluate(s=>{const e=document.querySelector(s);if(e)e.scrollIntoView({block:'start'});},sel);}catch(e){}await w(150);await p.screenshot({path:path.join(SHOTS,PRE+n+'.png')});};
const fake=day=>`(()=>{const T=new Date('${day}').getTime(),D0=Date.now(),R=Date;class FD extends R{constructor(...a){if(a.length)super(...a);else super(T+(R.now()-D0));}static now(){return T+(R.now()-D0);}}window.Date=FD;})()`;
const BADP=/\u2014|\u2013| - /;
/* ---------- families ---------- */
const FX=o=>Object.assign({id:'m1',opp:'Cherrybrook U15 Rangers',date:'2026-11-28',ko:'11:30',ha:'H',comp:'League',venue:'Orrell St James',done:false,pp:0,ppnote:''},o||{});
const POSTS=()=>[
 {id:'t1',type:'training',title:'Training',date:'2026-11-25',time:'20:00',place:'Christopher Park'},
 {id:'m1p',type:'match',title:'Match v Cherrybrook U15 Rangers',date:'2026-11-28',time:'11:30',place:'Orrell St James'},
 {id:'t2',type:'training',title:'Training',date:'2026-12-02',time:'20:00',place:'Christopher Park'}];
function famData(role,o){o=o||{};return {first:role==='parent'?'Jo':'Sam',role,num:'7',mine:o.mine||{},rsn:{},at:Date.now(),photo:'',posts:o.posts||POSTS(),att:{},squadNums:[{id:'p7',num:'7'}],vote:{motm:{open:false},poty:{open:false}},welcome:'',tips:'',res:[],feed:[],x:{fixtures:o.fx||[FX()],news:[],events:[],lifts:[],media:[],contacts:[]}};}
async function famRoutes(p,data,calls){await p.route(/^https?:\/\/(?!localhost)/,r=>{const u=r.request().url();if(!/macros/.test(u))return r.fulfill({status:200,contentType:'application/json',headers:H,body:'{}'});let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}calls.push(a);
 const d=a.action==='f.home'?data:{ok:1};r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});});}
async function fam(b,dv,page,role,day,o){const ctx=await b.newContext(dv);const p=await ctx.newPage();const errs=[],calls=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());await p.addInitScript(fake(day));
 await famRoutes(p,famData(role,o),calls);await p.addInitScript(c=>{localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code',c);localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.'+c,'1');localStorage.setItem('fam.tour','1');},role==='parent'?'PARENT1':'PLAYER1');
 await p.goto(BASE+'/'+page);await w(2400);await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();const m=document.getElementById('tl-md');if(m)m.remove();try{goTab('home');}catch(e){}});await w(400);return {ctx,p,errs,calls};}
const firstCard=p=>p.evaluate(()=>{const c=[...document.querySelectorAll('#root .card')].filter(x=>x.offsetParent!==null);return c[0]?c[0].id:'';});
const attTxt=p=>p.evaluate(()=>{const a=document.getElementById('att-top');return a?a.innerText:'';});
/* ---------- coach ---------- */
const NAMES=[['p1','Alex Test','1',['GK']],['p2','Ben Sample','2',['RWB']],['p3','Cal Demo','3',['CB']],['p4','Dan Pretend','4',['CB']],['p5','Eli Mock','5',['CB']],['p6','Finn Fake','6',['LWB']],['p7','Gus Trial','7',['CDM']],['p8','Hal Draft','8',['CM']],['p9','Ian Model','9',['CM']],['p10','Jay Sketch','10',['ST']],['p11','Kit Proto','11',['ST']],['p12','Lou Spare','12',['CB']]];
const squad=()=>{const o={};NAMES.forEach(n=>o[n[0]]={id:n[0],name:n[1],num:n[2],pos:n[3],active:true});return o;};
const LINEUP={GK:'p1',RCB:'p3',CB:'p4',LCB:'p5',RWB:'p2',LWB:'p6',CDM:'p7',RCM:'p8',LCM:'p9',RST:'p10',LST:'p11'};
const match=o=>Object.assign({id:'m1',opp:'Cherrybrook U15 Rangers',date:'2026-11-28',ko:'11:30',ha:'H',kit:'H',venue:'Orrell St James',addr:'Orrell St James',comp:'League',formation:'352',half:35,avail:{},lineup:{},status:'plan',period:1,clock:{acc:0,running:false,t0:0},stints:{},events:[],ratings:{},notes:'',postId:'m1p',updatedAt:1},o||{});
const live=(min,o)=>{const st={};Object.keys(LINEUP).forEach(k=>st[LINEUP[k]]=[{in:0,out:null,slot:k}]);return match(Object.assign({lineup:Object.assign({},LINEUP),status:'live',period:1,clock:{acc:min*60,running:true,t0:Date.now()},stints:st,events:[{id:'e0',t:0,type:'ko'}]},o||{}));};
const state=m=>({ideas:{},revs:{},gd:{},players:squad(),matches:{m1:m},settings:{id:'main',half:35,subEvery:17,roles:{},news:[],posts:[{id:'m1p',type:'match',date:'2026-11-28',time:'11:30',title:'Match v Cherrybrook U15 Rangers',status:'published'}],sched:{trainDay:2,trainStart:'20:00',trainEnd:'21:00',trainMins:60,matchDay:5,half:35,meetBefore:30,maxPersonal:2},updatedAt:0},dirty:{},lastSync:Date.now()});
async function coachRoutes(p,calls,push,pushOk){await p.route(/^https?:\/\/(?!localhost)/,r=>{const u=r.request().url();let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
 if(/touchline-push/.test(u)&&/\/send/.test(u)){push.push(a);return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(pushOk?{ok:true,sent:12,total:15}:{ok:false,error:'x'})});}
 if(!/macros/.test(u))return r.fulfill({status:200,contentType:'application/json',headers:H,body:'{}'});calls.push(a);r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{rows:[],docs:[],serverTime:Date.now()}})});});}
async function coach(b,dv,st,day,o){o=o||{};const ctx=await b.newContext(dv);const p=await ctx.newPage();const errs=[],calls=[],push=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());await p.addInitScript(fake(day));
 await p.addInitScript(a=>{localStorage.setItem('tl.code','COACH1');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',JSON.stringify(a.s));const d=new Date(),k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');localStorage.setItem('tl.md.shown.'+k,'1');if(a.today){localStorage.setItem('tl.mdOpen',k);localStorage.setItem('tl.mid','');}},{s:st,today:!!o.today});
 await coachRoutes(p,calls,push,o.pushOk!==false);await p.goto(BASE+'/coach/index.html'+(o.hash||''));await w(2300);await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});await w(200);return {ctx,p,errs,calls,push};}
const stM=p=>p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('tl.state.v1')||'{}');return {m:(s.matches||{}).m1,posts:(s.settings||{}).posts||[],news:(s.settings||{}).news||[]};});
(async()=>{const b=await chromium.launch();{const nc=b.newContext.bind(b);b.newContext=async(...a)=>{const c=await nc(...a);await c.addInitScript(()=>{try{for(const k of ['SpeechRecognition','webkitSpeechRecognition'])if(window[k])Object.defineProperty(window[k],'available',{value:undefined});}catch(e){}});return c;};}
 const phone={...devices['Pixel 7']},laptop={viewport:{width:1366,height:768}};
 for(const [dn,dv] of [['phone',phone],['1366',laptop]]){
  /* ===== 1. families: the week card ===== */
  for(const [page,role] of [['parents.html','parent'],['family.html','player'],['family.html','parent']]){
   const tag=dn+' '+page+' '+role;
   let {ctx,p,errs,calls}=await fam(b,dv,page,role,'2026-11-24T10:00:00');
   T(tag+' Tuesday: week card is the first card on Home',await firstCard(p)==='att-top');
   let t=await attTxt(p);
   T(tag+' shows Wednesday training 20:00 to 21:00',/Wednesday 25 November, 20:00 to 21:00/.test(t));
   T(tag+' shows Saturday match',/Match v Cherrybrook/.test(t)&&/Saturday 28 November/.test(t));
   T(tag+' does not show next week yet',!/2 December/.test(t));
   T(tag+' says not answered yet and needs an answer',/Not answered yet/.test(t)&&/needs your answer/i.test(t));
   T(tag+' wording for '+role,role==='player'?(/Can you come\?/.test(t)&&/Playing\?/.test(t)):(/Can Jo come\?/.test(t)&&/Is Jo playing\?/.test(t)));
   T(tag+' says it stays until after Saturday',/Stays here until after Saturday 28 November/.test(t));
   T(tag+' no dashes as punctuation',!BADP.test(t));
   await shot(p,dn+'_'+page.replace('.html','')+'_'+role+'_home_tue');
   await tap(p,'#att-train .ybig button:first-child');await w(500);
   t=await attTxt(p);
   T(tag+' Yes for training shows Your answer: Yes',/Your answer: Yes/.test(await p.textContent('#att-train')));
   T(tag+' Yes is sent to the backend',calls.some(a=>a.action==='f.answer'&&a.postId==='t1'&&a.answer==='Y'));
   T(tag+' card has not moved after answering',await firstCard(p)==='att-top'&&!!(await p.$('#att-match .ybig')));
   await tap(p,'#att-train .ybig button:nth-child(2)');await w(500);
   T(tag+' can change to No',/Your answer: No/.test(await p.textContent('#att-train'))&&calls.some(a=>a.action==='f.answer'&&a.postId==='t1'&&a.answer==='N'));
   T(tag+' No offers the optional why box',!!(await p.$('#att-train #rs_t1')));
   await tap(p,'#att-match .ybig button:first-child');await w(500);
   T(tag+' match Yes shows and card stays first',/Your answer: Yes/.test(await p.textContent('#att-match'))&&await firstCard(p)==='att-top');
   T(tag+' all answered says Your answers',/your answers/i.test(await p.textContent('#att-top .tag')));
   await shot(p,dn+'_'+page.replace('.html','')+'_'+role+'_home_answered');
   T(tag+' no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
   if(dn==='1366'&&role==='parent'&&page==='family.html')continue;
   // Thursday: training has gone, still shown with the answer, match still answerable
   ({ctx,p,errs}=await fam(b,dv,page,role,'2026-11-26T18:00:00',{mine:{t1:'Y'}}));
   t=await attTxt(p);
   T(tag+' Thursday: card still first with both rows',await firstCard(p)==='att-top'&&/Training/.test(t)&&/Cherrybrook/.test(t));
   T(tag+' Thursday: training shows Been and gone with the answer, no buttons',/Your answer: Yes/.test(await p.textContent('#att-train'))&&/Been and gone/.test(await p.textContent('#att-train'))&&!(await p.$('#att-train .ybig')));
   T(tag+' Thursday: match still has Yes and No',!!(await p.$('#att-match .ybig')));
   await ctx.close();
   // Saturday after the game: still there
   ({ctx,p,errs}=await fam(b,dv,page,role,'2026-11-28T16:00:00',{mine:{t1:'Y',m1p:'Y'},fx:[FX({done:true,f:1,a:2})]}));
   T(tag+' Saturday after the game: week card still on Home',!!(await p.$('#att-top'))&&/Cherrybrook/.test(await attTxt(p)));
   T(tag+' Saturday no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
   // Sunday: rolls on to next week
   ({ctx,p,errs}=await fam(b,dv,page,role,'2026-11-29T09:00:00',{mine:{t1:'Y',m1p:'Y'},fx:[FX({done:true,f:1,a:2}),FX({id:'m2',opp:'Horwich RMI U15',date:'2026-12-05',ko:'10:00',ha:'A'})]}));
   t=await attTxt(p);
   T(tag+' Sunday: rolls on to Wednesday 2 December',/2 December/.test(t)&&!/25 November/.test(t)&&!/Cherrybrook/.test(t));
   T(tag+' Sunday: match not asked yet says so',/Horwich/.test(t)&&/have not asked yet/.test(t));
   await ctx.close();
   // Saturday, game called off: the row says so
   ({ctx,p,errs}=await fam(b,dv,page,role,'2026-11-28T10:40:00',{mine:{t1:'Y',m1p:'Y'},posts:POSTS().filter(x=>x.id!=='m1p'),fx:[FX({pp:1,ppnote:'The pitch is not fit to play on. New date to follow.'})]}));
   t=await attTxt(p);
   T(tag+' called off game shows Called off and the reason',/Called off/.test(t)&&/pitch is not fit/.test(t));
   await shot(p,dn+'_'+page.replace('.html','')+'_'+role+'_called_off','#att-top');
   T(tag+' called off no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
  }
  /* ===== 2. coach: Game off? on match day ===== */
  // before kick off, Matchday screen
  let {ctx,p,errs,calls,push}=await coach(b,dv,state(match()),'2026-11-28T10:20:00');
  T(dn+' coach Saturday opens Matchday with Game off? card',!!(await p.$('#md-start'))&&!!(await p.$('#tl-ppd #ppd-open')));
  T(dn+' Matchday still has no floating Ask',await p.evaluate(()=>{const f=document.getElementById('tl-voice-fab');return !f||getComputedStyle(f).display==='none';}));
  await shot(p,dn+'_coach_matchday');
  await tap(p,'#ppd-open');await w(300);
  T(dn+' form has reason, new date, kick off, message and urgent',!!(await p.$('#pd_reason'))&&!!(await p.$('#pd_date'))&&!!(await p.$('#pd_ko'))&&!!(await p.$('#pd_msg'))&&!!(await p.$('#pd_urgent')));
  let msg=await p.$eval('#pd_msg',x=>x.value);
  T(dn+' message is filled in, plain words, no names',/Game off: U15 Blues v Cherrybrook U15 Rangers today is postponed/.test(msg)&&/head home/.test(msg)&&!NAMES.some(n=>msg.includes(n[1].split(' ')[0]))&&!BADP.test(msg));
  await p.selectOption('#pd_reason','ref');await p.fill('#pd_date','2026-12-05');await p.dispatchEvent('#pd_date','change');await p.fill('#pd_ko','10:30');await p.dispatchEvent('#pd_ko','change');await w(200);
  msg=await p.$eval('#pd_msg',x=>x.value);
  T(dn+' message updates with reason and new date',/No referee/.test(msg)&&/New date 05\/12\/2026 10:30/.test(msg)&&/Playing\? Yes or No again/.test(msg));
  await p.$eval('#pd_urgent',x=>{x.checked=false;x.dispatchEvent(new Event('change',{bubbles:true}));});
  await shot(p,dn+'_coach_ppd_form','#tl-ppd');
  await tap(p,'#ppd-check');await w(300);
  T(dn+' Check shows the message with Send and Cancel, nothing sent yet',!!(await p.$('#ppd-send'))&&!!(await p.$('#ppd-cancel'))&&/No referee/.test(await p.textContent('#ppd-preview'))&&push.length===0);
  await shot(p,dn+'_coach_ppd_check','#tl-ppd');
  await tap(p,'#ppd-cancel');await w(300);
  T(dn+' Cancel goes back, keeps the words, sends nothing',!!(await p.$('#pd_msg'))&&/No referee/.test(await p.$eval('#pd_msg',x=>x.value))&&push.length===0&&(await stM(p)).m.date==='2026-11-28');
  await tap(p,'#ppd-check');await w(200);await tap(p,'#ppd-send');await w(1800);
  let s=await stM(p);
  T(dn+' Send moves the game to the new date',s.m.date==='2026-12-05'&&s.m.ko==='10:30'&&!s.m.pp);
  T(dn+' families asked Playing? again for the new date',s.posts.some(x=>x.type==='match'&&x.date==='2026-12-05'&&x.status==='published')&&s.posts.some(x=>x.id==='m1p'&&x.status==='removed'));
  T(dn+' one family push, not urgent',push.length===1&&!/^URGENT/.test(push[0].title)&&/No referee/.test(push[0].body)&&push[0].url==='/family.html');
  T(dn+' not urgent: no coach ringing alert',!calls.some(a=>a.action==='alert.send'));
  T(dn+' team page news says Game off',s.news.length>0&&/^Game off/.test(s.news[0].t));
  T(dn+' before kick off no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
  // after kick off: live match, urgent
  ({ctx,p,errs,calls,push}=await coach(b,dv,state(live(22)),'2026-11-28T11:55:00',{hash:'#/m/m1'}));
  T(dn+' live match screen has Game off? card',!!(await p.$('#tl-ppd #ppd-open'))&&!!(await p.$('#clk')));
  await shot(p,dn+'_coach_live');
  await tap(p,'#ppd-open');await w(300);
  T(dn+' after kick off the reason starts as abandoned and urgent is on',(await p.$eval('#pd_reason',x=>x.value))==='abandoned'&&await p.$eval('#pd_urgent',x=>x.checked));
  msg=await p.$eval('#pd_msg',x=>x.value);
  T(dn+' abandoned message, new date to follow, no head home',/abandoned/.test(msg)&&/New date to follow/.test(msg)&&!/head home/.test(msg));
  await tap(p,'#ppd-check');await w(300);
  T(dn+' urgent check step says URGENT',/URGENT/.test(await p.textContent('#tl-ppd')));
  await tap(p,'#ppd-send');await w(1800);
  s=await stM(p);
  T(dn+' game marked off, clock stopped, goes on the relist list',s.m.pp===1&&s.m.relist===1&&s.m.status==='plan'&&!s.m.clock.running&&!!s.m.abnd);
  T(dn+' urgent push to families and players says URGENT',push.length===1&&/^URGENT/.test(push[0].title)&&push[0].urgent===1);
  T(dn+' urgent also rings the coach phones',calls.some(a=>a.action==='alert.send'&&a.level==='urgent'));
  T(dn+' match post removed so the Yes or No goes',s.posts.every(x=>x.id!=='m1p'||x.status==='removed'));
  await w(300);
  T(dn+' card now says the game is off and how many phones',/is off/.test(await p.textContent('#tl-ppd'))&&/12 of 15 phones/.test(await p.textContent('#tl-ppd')));
  await shot(p,dn+'_coach_called_off','#tl-ppd');
  T(dn+' live no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
  // Today tab on match day, after kick off
  ({ctx,p,errs}=await coach(b,dv,state(live(10)),'2026-11-28T11:45:00',{today:1,hash:'#/today'}));
  T(dn+' Today after kick off shows Game off? at the top',await p.evaluate(()=>{const t=document.getElementById('tlc-top');return !!t&&!!t.querySelector('#tl-ppd');}));
  T(dn+' Today has no floating Ask',await p.evaluate(()=>{const f=document.getElementById('tl-voice-fab');return !f||getComputedStyle(f).display==='none';}));
  await shot(p,dn+'_coach_today_live');
  T(dn+' Today no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
  // push fails: retry offered, Send and Cancel again
  ({ctx,p,errs,calls,push}=await coach(b,dv,state(match()),'2026-11-28T10:30:00',{pushOk:false}));
  await tap(p,'#ppd-open');await w(200);await tap(p,'#ppd-check');await w(200);await tap(p,'#ppd-send');await w(1800);
  T(dn+' failed alert: saved and offers Try the alert again',/did not go/.test(await p.textContent('#tl-ppd'))&&!!(await p.$('[data-act="ppdRetry"]')));
  await tap(p,'[data-act="ppdRetry"]');await w(200);
  T(dn+' retry asks Send or Cancel first',!!(await p.$('#ppd-send'))&&push.length===1);
  await tap(p,'#ppd-send');await w(1200);
  T(dn+' retry sends once more',push.length===2);
  await ctx.close();
  // not match day: no card
  ({ctx,p,errs}=await coach(b,dv,state(match()),'2026-11-27T18:00:00'));
  T(dn+' Friday: no Game off? card',!(await p.$('#tl-ppd')));
  T(dn+' Friday no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();
 }
 await b.close();srv.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
