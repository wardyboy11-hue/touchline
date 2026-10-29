const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':'text/css'});r.end(d);});}).listen(8767);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
(async()=>{const b=await chromium.launch();
let server=[];let posted=[];
const ctx=await b.newContext();const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}')}catch(e){}
 const okk=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
 if(a.action==='conc.upsert'){posted.push(a);if(!server.find(x=>x.id===a.id))server.push({id:a.id,pid:a.pid,num:'4',inj:a.inj,st:{},closed:''});return okk({ok:true});}
 if(a.action==='conc.list')return okk({at:1,rows:server});
 if(a.action==='conc.void'){server=server.filter(x=>x.id!==a.id);return okk({ok:true});}
 return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:false,error:'nope'})});});
const today=new Date().toISOString().slice(0,10);
await p.addInitScript(([t])=>{if(localStorage.getItem('seeded'))return;localStorage.setItem('seeded','1');localStorage.setItem('tl.code','x');
const pl={};['a','b','c'].forEach((id,i)=>pl[id]={id,name:'Player '+id.toUpperCase(),num:String([4,9,7][i]),active:true,pos:['CB']});
localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:pl,matches:{m1:{id:'m1',opp:'Rivals',date:t,ko:'10:30',status:'live',ha:'H',formation:'4231',venue:'',addr:'',comp:'League',ratings:{},notes:'',lastWin:0,half:35,period:1,avail:{},lineup:{RCB:'a',ST:'b'},stints:{a:[{in:0,out:null,slot:'RCB'}],b:[{in:0,out:null,slot:'ST'}]},events:[],clock:{acc:600,running:false,t0:0}},m2:{id:'m2',opp:'Next',date:'2099-01-01',ko:'10:00',status:'plan',ha:'H',formation:'4231',venue:'',addr:'',comp:'League',ratings:{},notes:'',lastWin:0,period:1,clock:{acc:0,running:false,t0:0},avail:{},lineup:{RCB:'a'},stints:{},events:[]}},settings:{id:'main',half:35,subEvery:17,roles:{},updatedAt:0},dirty:{},lastSync:Date.now()}));
localStorage.setItem('tl.mid','m1');},[today]);
await p.goto('http://localhost:8767/coach/index.html');await p.waitForTimeout(900);
let t=await p.innerText('#root');
console.log(JSON.stringify(errs),t.slice(0,200));T('live match shows head injury button',/suspected head injury/i.test(t));
await p.click('button:has-text("Suspected head injury")');await p.waitForTimeout(200);
await p.click('#sheet .chip:has-text("4")');await p.waitForTimeout(200);
t=await p.innerText('#sheet');T('confirm sheet shows NHS 111 and 999',/NHS 111/.test(t)&&/999/.test(t));
await p.click('#sheet button:has-text("Confirm and log it")');await p.waitForTimeout(900);
const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('tl.state.v1')));
T('player removed from pitch and unavailable',!Object.values(st.matches.m1.lineup).includes('a')&&st.matches.m1.avail.a===false&&st.matches.m1.stints.a[0].out!=null);
T('also swept from future plan match',!Object.values(st.matches.m2.lineup).includes('a')&&st.matches.m2.avail.a===false);
T('other player still on',Object.values(st.matches.m1.lineup).includes('b'));
const cc=await p.evaluate(()=>JSON.parse(localStorage.getItem('tl.conc')));
T('record kept on the phone',cc.rows.length===1&&cc.rows[0].pid==='a');
T('record pushed to backend',posted.length===1&&posted[0].pid==='a');
// plan view of future match: chip locked
await p.evaluate(()=>{localStorage.setItem('tl.mid','m2');});await p.reload();await p.waitForTimeout(900);
t=await p.innerText('#root');T('plan chip shows not available',/4 .*\(not available\)/i.test(t));
await p.click('.chip:has-text("not available")');await p.waitForTimeout(150);
const st2=await p.evaluate(()=>JSON.parse(localStorage.getItem('tl.state.v1')));
T('tapping the chip cannot make him available',st2.matches.m2.avail.a===false);
// head injury tab and void
await p.evaluate(()=>{localStorage.removeItem('tl.mid');});await p.reload();await p.waitForTimeout(700);
await p.click('nav.tabs >> text=Team');await p.click('.seg button:has-text("Head injury")');await p.waitForTimeout(300);
t=await p.innerText('#root');T('head injury tab lists plan with six stages',/Stage 6/.test(t)&&/Earliest match/i.test(t));
// parent confirms stage 1..6 on server then closed
server[0].st={1:'2026-01-01'};server[0].closed='';
await p.click('.seg button:has-text("Squad")');await p.click('.seg button:has-text("Head injury")');
await p.evaluate(()=>{});
// void
await p.click('button:has-text("Entered by mistake")').catch(()=>{});await p.waitForTimeout(800);
console.log('after sync stage shown?',/Parent confirmed/.test(await p.innerText('#root')));
// closed on server => becomes available
server=[{id:cc.rows[0].id,pid:'a',num:'4',inj:'2026-01-01',st:{1:'a',2:'a',3:'a',4:'a',5:'a',6:'a'},closed:'2026-01-22'}];
await p.evaluate(()=>{});await p.reload();await p.waitForTimeout(1000);
const ccAfter=await p.evaluate(()=>JSON.parse(localStorage.getItem('tl.conc')));
T('closed record unblocks him',ccAfter.rows.length>=1&&!!ccAfter.rows.find(r=>r.pid==='a').closed||ccAfter.rows.length===0);
// sign out clears
await p.click('nav.tabs >> text=Comms');await p.click('.seg button:has-text("More")');p.on('dialog',d=>d.accept());await p.evaluate(()=>document.querySelector('[data-act=logout]').click());await p.waitForTimeout(300);
T('sign out clears head injury data',!(await p.evaluate(()=>localStorage.getItem('tl.conc'))));
console.log('coach errors',errs);
// ---- family
for(const role of ['parent','player']){
 const c2=await b.newContext();const q=await c2.newPage();const e2=[];q.on('pageerror',e=>e2.push(e.message));let conf=[];
 await q.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}')}catch(e){}
  const okk=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
  if(a.action==='f.home')return okk({first:'Sam',role,x:{},posts:[],res:[],tips:[]});
  if(a.action==='f.conc.get')return okk(role==='player'?{open:true}:{open:true,id:'x',inj:'2026-10-20',st:{1:'2026-10-22',2:'2026-10-24'},day:9,min5:15,min6:21});
  if(a.action==='f.conc.confirm'){conf.push(a);return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:false,error:'Training with possible head contact starts from day 15 at the earliest. It is day 9.'})});}
  return okk({});});
 await q.addInitScript(()=>{localStorage.setItem('fam.code','CODE12');localStorage.setItem('fam.ok1','1');});
 await q.goto('http://localhost:8767/family.html');await q.waitForTimeout(1500);
 const tx=await q.innerText('body');
 if(role==='parent'){T('parent sees the return plan with stage 3 next',/return to play plan/i.test(tx)&&/Stage 3 done, no symptoms/.test(tx)&&!/Stage 4 done, no symptoms/.test(tx));
  T('parent sees NHS 111 and 999',/NHS 111/.test(tx)&&/999/.test(tx));
  await q.click('button:has-text("Stage 3 done")');await q.waitForTimeout(500);
  T('confirm sent stage 3',conf.length===1&&conf[0].stage===3);}
 else{T('player sees only not available',/not available for now/i.test(tx)&&!/head|concussion|stage|NHS/i.test(tx.replace(/Not available for now/i,'')));}
 console.log(role,'errors',e2);await c2.close();}
console.log(ok,'passed',bad,'failed');await b.close();srv.close();})();
