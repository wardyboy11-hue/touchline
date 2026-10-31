const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':'text/css'});r.end(d);});}).listen(8770);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
(async()=>{const b=await chromium.launch();
// ---- family
for(const role of ['parent','player']){
 const ctx=await b.newContext({acceptDownloads:true});const q=await ctx.newPage();const errs=[];q.on('pageerror',e=>errs.push(e.message));
 let signed=null,asked=0;
 await q.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}')}catch(e){}
  const okk=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
  if(a.action==='f.home')return okk({first:'Sam',role,x:{},posts:[],res:[],tips:[]});
  if(a.action==='f.respect.get')return okk({season:'2026/27',who:role,signed:signed?{name:signed,date:'2026-11-01'}:null});
  if(a.action==='f.respect.sign'){if(role==='parent'&&!(a.name||'').trim())return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:false,error:'Type your name to sign.'})});signed=a.name||'Sam';return okk({ok:true});}
  if(a.action==='f.mydata.get')return okk({player:{name:'Sam Smith',shirt:'7'},answers:[{post:'a',answer:'Y'}],goals:[{goal:'use "left" foot'}]});
  if(a.action==='f.mydata.reqs')return okk({rows:asked?[{at:Date.now(),status:'open',note:''}]:[]});
  if(a.action==='f.mydata.delete'){asked++;return okk({ok:true});}
  return okk({});});
 await q.addInitScript(()=>{const _g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return /^fam\.wel\./.test(k)?'1':_g.call(this,k);};}); // welcome screen already seen
 await q.addInitScript((c)=>{localStorage.setItem('fam.code',c);localStorage.setItem('fam.ok1','1');},role);
 await q.goto('http://localhost:8770/family.html');await q.waitForTimeout(1500);
 let tx=await q.innerText('body');
 if(role==='parent'){
  T('parent sees Respect code on Home with six points and FA link',/Parents Respect code/i.test(tx)&&(await q.$$('.card li')).length>=6&&!!(await q.$('a[href*="thefa.com"]')));
  await q.click('button:has-text("I agree")');await q.waitForTimeout(300);
  T('name required',/type your name|name/i.test(await q.innerText('body'))&&!signed);
  await q.fill('#rsn','Pat Smith');await q.click('button:has-text("I agree")');await q.waitForTimeout(600);
  T('signing stores the typed name',signed==='Pat Smith');
  T('card disappears from Home once signed',!/Parents Respect code/i.test(await q.innerText('body')));
  await q.evaluate(()=>goTab('me'));await q.waitForTimeout(400);tx=await q.innerText('body');
  T('Me shows signed state and My data button',/Signed by Pat Smith/.test(tx)&&/Open My data/.test(tx));
  await q.click('button:has-text("Open My data")');await q.waitForTimeout(500);tx=await q.innerText('body');
  T('My data explains what, why, who, how long',/Why:/.test(tx)&&/Who sees it:/.test(tx)&&/How long:/.test(tx)&&/Photo choice and emergency contacts/.test(tx));
  const [dl]=await Promise.all([q.waitForEvent('download'),q.click('button:has-text("Download as a file")')]);
  const j=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));
  T('JSON download holds the child data',j.player.name==='Sam Smith'&&j.answers.length===1);
  const [dl2]=await Promise.all([q.waitForEvent('download'),q.click('button:has-text("Download for a spreadsheet")')]);
  const csv=fs.readFileSync(await dl2.path(),'utf8');
  T('CSV download is field,value rows with quotes escaped',/^"field","value"/.test(csv)&&/player\.name","Sam Smith"/.test(csv)&&/""left""/.test(csv));
  q.on('dialog',d=>d.accept());await q.click('button:has-text("Ask for the app data to be deleted")');await q.waitForTimeout(600);
  T('deletion request sent and shown as waiting',asked===1&&/waiting for a coach/.test(await q.innerText('body')));
 } else {
  T('player does not see the parent card on Home',!/Parents Respect code/i.test(tx));
  await q.evaluate(()=>goTab('me'));await q.waitForTimeout(400);tx=await q.innerText('body');
  T('player sees optional team code, no My data',/Our team code/i.test(tx)&&/optional/i.test(tx)&&!/Open My data/.test(tx));
  await q.click('button:has-text("I agree")');await q.waitForTimeout(500);
  T('player can agree with one tap',signed==='Sam'||/You agreed/.test(await q.innerText('body')));
  await q.evaluate(()=>goTab('data'));await q.waitForTimeout(300);
  T('player cannot open My data',/for parents/i.test(await q.innerText('body')));
 }
 console.log(role,'errors',errs);await ctx.close();}
// ---- coach
const p=await b.newPage();const e3=[];p.on('pageerror',e=>e3.push(e.message));let act=[];
let reqs=[{id:'r1',pid:'a',num:'4',kind:'delete',at:Date.now(),status:'open',note:'',doneAt:0}];
await p.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}')}catch(e){}
 const okk=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
 if(a.action==='respect.list')return okk({season:'2026/27',signed:[{pid:'a',who:'parent',name:'Pat',date:'2026-11-01'}],outstanding:[{pid:'b',num:'9'}]});
 if(a.action==='datareq.list')return okk({rows:reqs});
 if(a.action==='datareq.erase'){act.push(a);reqs=reqs.map(x=>Object.assign({},x,{status:'done',note:'Erased'}));return okk({ok:true,removed:6});}
 return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:false,error:'nope'})});});
await p.addInitScript(()=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:{a:{id:'a',name:'Player A',num:'4',active:true,pos:['CB']},b:{id:'b',name:'Player B',num:'9',active:true,pos:['ST']}},matches:{},settings:{id:'main',half:35,subEvery:17,roles:{},updatedAt:0},dirty:{},lastSync:Date.now()}));});
await p.goto('http://localhost:8770/coach/index.html');await p.waitForTimeout(1200);
let t=await p.innerText('#root');
T('Today shows privacy card with outstanding parents and requests',/privacy/i.test(t)&&/1 data request/i.test(t)&&/1 parent has not signed/i.test(t));
await p.click('nav.tabs >> text=Team');await p.click('.seg button:has-text("Privacy")');await p.waitForTimeout(500);
t=await p.innerText('#root');
T('Privacy tab lists the request and who is outstanding',/data requests \(1\)/i.test(t)&&/9\s+Player B/.test(t)&&/Still to sign \(1\)/i.test(t));
p.on('dialog',d=>d.accept());await p.click('button:has-text("Erase")');await p.waitForTimeout(700);
T('erase sent for the request',act.length===1&&act[0].id==='r1');
T('queue now empty',/none waiting/i.test(await p.innerText('#root')));
console.log('coach errors',e3);console.log(ok,'passed',bad,'failed');await b.close();srv.close();})();
