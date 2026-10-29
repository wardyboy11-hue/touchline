const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':'text/css'});r.end(d);});}).listen(8769);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
(async()=>{const b=await chromium.launch();
// coach
let decided=[];let rows=[{id:'g1',pid:'a',corner:'tec',txt:'use my left foot',status:'proposed',ht:'Autumn 2',note:'',review:''},{id:'g2',pid:'a',corner:'soc',txt:'talk more',status:'agreed',ht:'Autumn 2',note:'',review:'working'}];
let p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}')}catch(e){}
 const okk=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
 if(a.action==='goals.list')return okk({season:'2026/27',ht:'Autumn 2',rows});
 if(a.action==='goals.decide'){decided.push(a);rows=rows.map(x=>x.id===a.id?Object.assign({},x,{status:a.act==='agree'?'agreed':'declined',txt:a.txt||x.txt}):x);return okk({ok:true});}
 return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:false,error:'nope'})});});
await p.addInitScript(()=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:{a:{id:'a',name:'Player A',num:'4',active:true,pos:['CB']}},matches:{},settings:{id:'main',half:35,subEvery:17,roles:{},updatedAt:0},dirty:{},lastSync:Date.now()}));});
await p.goto('http://localhost:8769/coach/index.html');await p.waitForTimeout(700);
await p.click('nav.tabs >> text=Team');await p.click('.seg button:has-text("Goals")');await p.waitForTimeout(600);
let t=await p.innerText('#root');
T('coach sees waiting goal with shirt and name',/4\s+Player A/.test(t)&&/use my left foot/.test(t));
T('coach sees agreed goal and player review',/talk more/.test(t)&&/still working on it/.test(t));
await p.click('button:has-text("Change or decline")');await p.waitForTimeout(200);
await p.fill('#glt','Pass with my left foot in every game');await p.fill('#gln','Nice');await p.click('#sheet button:has-text("Agree with these words")');await p.waitForTimeout(700);
T('coach agree with edited words sent',decided.length===1&&decided[0].act==='agree'&&/every game/.test(decided[0].txt)&&decided[0].note==='Nice');
console.log('coach errors',errs);
// family
for(const role of ['player','parent']){
 const q=await b.newPage();const e2=[];q.on('pageerror',e=>e2.push(e.message));let added=null;
 await q.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}')}catch(e){}
  const okk=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
  if(a.action==='f.home')return okk({first:'Sam',role,x:{},posts:[],res:[],tips:[],head:{n:1}});
  if(a.action==='f.goals.get')return okk({season:'2026/27',ht:'Autumn 2',canEdit:role==='player',goals:[{id:'g2',corner:'soc',txt:'talk more',status:'agreed',ht:'Autumn 2',note:'Good',review:''}]});
  if(a.action==='f.goals.add'){added=a;return okk({ok:true});}
  return okk({});});
 await q.addInitScript((c)=>{localStorage.setItem('fam.code',c);localStorage.setItem('fam.ok1','1');},role);
 await q.goto('http://localhost:8769/family.html');await q.waitForTimeout(1500);
 const tx=await q.innerText('body');
 if(role==='player'){T('player sees goals card with agreed goal',/my goals/i.test(tx)&&/talk more/.test(tx)&&/Agreed with the coaches/.test(tx));
  T('player sees heading tick',/heading this week/i.test(tx));
  await q.click('.chip:has-text("Physical")');await q.fill('textarea[maxlength="140"]','be quicker off the mark');await q.click('button:has-text("Send to Tim and Deano")');await q.waitForTimeout(500);
  T('goal sent with corner and words',added&&added.corner==='phy'&&added.txt==='be quicker off the mark');
  T('player has review buttons',/How is it going/.test(tx));}
 else{T('parent sees goals read only',/Goals/.test(tx)&&/talk more/.test(tx)&&!/Send to Tim and Deano/.test(tx)&&!/How is it going/.test(tx));
  T('parent sees heading tick',/heading this week/i.test(tx));}
 console.log(role,'errors',e2);await q.close();}
console.log(ok,'passed',bad,'failed');await b.close();srv.close();})();
