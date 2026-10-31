const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':'text/css'});r.end(d);});}).listen(8766);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
(async()=>{const b=await chromium.launch();
// ---------- coach
let ctx=await b.newContext();let p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
let listCalls=0;
await p.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}')}catch(e){}
 if(a.action==='consent.list'){listCalls++;return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true,data:{season:'2026/27',at:1,rows:[{pid:'a',photo:'no',c1:{n:'Mum A',p:'07000 111111',r:'Mum'},c2:{n:'',p:'',r:''},med:'Inhaler in bag'}]}})});}
 return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:false,error:'nope'})});});
const today=new Date().toISOString().slice(0,10);
const done=(id,date)=>({id,opp:'X'+id,date,ko:'10:00',status:'done',ha:'H',half:35,avail:{},lineup:{},stints:{a:[{in:0,out:4200}],b:[]},events:[],clock:{acc:4200,running:false,t0:0}});
await p.addInitScript(([t])=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:{a:{id:'a',name:'Test One',num:'4',active:true,pos:['CB']},b:{id:'b',name:'Test Two',num:'9',active:true,pos:['ST']},c:{id:'c',name:'Test Three',num:'7',active:true,pos:['RW']}},matches:{d1:{id:'d1',opp:'Old1',date:'2026-09-01',ko:'10:00',status:'done',ha:'H',half:35,avail:{},lineup:{},stints:{a:[{in:0,out:4200}],b:[]},events:[],clock:{acc:4200,running:false,t0:0}},d2:{id:'d2',opp:'Old2',date:'2026-09-08',ko:'10:00',status:'done',ha:'H',half:35,avail:{c:false},lineup:{},stints:{a:[{in:0,out:4200}],b:[{in:0,out:1200}]},events:[],clock:{acc:4200,running:false,t0:0}},m1:{id:'m1',opp:'Rivals',date:t,ko:'10:30',status:'plan',ha:'H',avail:{},lineup:{},stints:{},events:[]}},settings:{id:'main',half:35,subEvery:17,roles:{},updatedAt:0},dirty:{},lastSync:Date.now()}));},[today]);
await p.goto('http://localhost:8766/coach/index.html');await p.waitForTimeout(800);
await p.click('nav.tabs >> text=Team');await p.click('.seg button:has-text("Team sheet")');await p.waitForTimeout(300);
let t=await p.innerText('#root');
T('minutes watch lists shirt 9 under line',/minutes watch/i.test(t)&&/9 Test T\. \d+%/.test(t));
T('minutes watch does not list shirt 4 or unavailable shirt 7',!/4 Test O\.? \d+%/.test(t)&&!/4 Test.{0,6}\d+%/.test(t));
T('minutes watch not on the printed/referee table',!/Minutes watch/.test(await p.evaluate(()=>'')));
await p.click('.seg button:has-text("Emergency")');await p.waitForTimeout(600);
t=await p.innerText('#root');
T('emergency card shows contact',/Mum A/.test(t)&&/Inhaler in bag/.test(t));
T('no photos flagged',/NO PHOTOS/.test(t));
T('players without a card listed',/no card yet/i.test(t)&&/9 Test/i.test(t));
T('cached in localStorage',!!(await p.evaluate(()=>localStorage.getItem('tl.em'))));
// offline: kill API entirely and reload
await p.unroute('**/macros/**');await p.route('**/macros/**',r=>r.abort());
await p.reload();await p.waitForTimeout(800);await p.click('nav.tabs >> text=Team');await p.click('.seg button:has-text("Emergency")');await p.waitForTimeout(400);
t=await p.innerText('#root');T('emergency card opens with the network blocked',/Mum A/.test(t)&&/Works with no signal/.test(t));
// sign out clears
const hasLogout=await p.evaluate(()=>!!document.querySelector('[data-act=logout]'));
await p.click('nav.tabs >> text=Comms');await p.click('.seg button:has-text("More")');await p.waitForTimeout(500);
console.log(await p.evaluate(()=>[...new Set([...document.querySelectorAll('[data-act]')].map(e=>e.dataset.act))].join(',')));console.log('logout button present',await p.evaluate(()=>!!document.querySelector('[data-act=logout]')));
p.on('dialog',d=>d.accept());
await p.evaluate(()=>{const e=document.querySelector('[data-act=logout]');if(e)e.click();});await p.waitForTimeout(300);
T('sign out clears emergency data',!(await p.evaluate(()=>localStorage.getItem('tl.em'))));
console.log('coach errors',errs);
// ---------- parent
ctx=await b.newContext();p=await ctx.newPage();const e2=[];p.on('pageerror',e=>e2.push(e.message));
let saved=null;
await p.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}')}catch(e){}
 const H={'access-control-allow-origin':'*'};const ok=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
 if(a.action==='f.home')return ok({first:'Sam',role:a.code==='PLAYER'?'player':'parent',x:{},posts:[],res:[],tips:[]});
 if(a.action==='f.consent.get')return ok({season:'2026/27',card:saved?{photo:saved.photo,c1:{n:saved.c1n,p:saved.c1p,r:saved.c1r},c2:{n:'',p:'',r:''},med:saved.med,at:1}:null});
 if(a.action==='f.consent.save'){saved=a;return ok({ok:true});}
 return ok({});});
for(const [code,role] of [['PARENT','parent'],['PLAYER','player']]){
 await p.addInitScript(()=>{const _g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return /^fam\.wel\./.test(k)?'1':_g.call(this,k);};}); // welcome screen already seen
 await p.addInitScript(([c])=>{localStorage.setItem('fam.code',c);localStorage.setItem('fam.ok1','1');},[code]);
 await p.goto('http://localhost:8766/family.html');await p.waitForTimeout(1200);
 await p.evaluate(()=>{if(typeof goTab==='function')goTab('me');});await p.waitForTimeout(500);
 t=await p.innerText('body');
 if(role==='parent'){T('parent sees the consent card',/Photos and emergency contacts/.test(t));
  await p.check('input[name=cnph][value=no]');await p.fill('#cn1n','Mum A');await p.fill('#cn1p','07000 111111');await p.fill('#cnmed','Inhaler');await p.evaluate(()=>cnSave());await p.waitForTimeout(700);
  console.log(JSON.stringify(saved));T('save sent the right fields',saved&&saved.photo==='no'&&saved.c1n==='Mum A'&&saved.med==='Inhaler');
  t=await p.innerText('body');T('shows saved state',/You have done this one/.test(t));}
 else T('player never sees the consent card',!/Photos and emergency contacts/.test(t));
 await p.evaluate(()=>localStorage.clear());}
console.log('parent errors',e2);
console.log(ok,'passed',bad,'failed');await b.close();srv.close();})();
