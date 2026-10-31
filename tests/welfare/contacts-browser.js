// r71: coach Contacts + FA squad list. Uses made-up data only (real data lives in the private sheet).
// SEED=/path/seed.json SHOTS=/dir node contacts-browser.js  -> uses that data and saves screenshots (run off-repo only).
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+(process.env.PORT||8796);
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':f.endsWith('.css')?'text/css':'application/octet-stream'});r.end(d);});}).listen(PORT);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
let D={club:'Example FC',team:'U15',squad_meta:{exported:'2026-10-22T18:40',officials:[{name:'Test Coach',role:'Team Manager'}]},
 squad:[{name:'Alex Sample',fan:'10000001',dob:'2012-01-01',age:14,reg:'2026-08-17',ec_name:'Pat Sample',ec_phone:'07000000001'},{name:'Sam Dummy',fan:'10000002',dob:'2011-10-01',age:15,reg:'2026-09-18',ec_name:'',ec_phone:''}],
 contacts:[{group:'club',name:'Club Sec',role:'Secretary',email:'sec@example.com',phone:'07000000009'},{group:'parent',player:'Alex Sample',name:'Pat Sample',role:'Parent/carer',email:'pat@example.com',phone:'07000000001'},{group:'parent',player:'Sam Dummy',name:'Jo Dummy',role:'Parent/carer',email:'jo@example.com',phone:''}]};
if(process.env.SEED)D=JSON.parse(fs.readFileSync(process.env.SEED,'utf8'));
const SH=process.env.SHOTS;const H={'access-control-allow-origin':'*'};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:430,height:900},deviceScaleFactor:2,acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const seen=[];let saved=null;
await p.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}')}catch(e){}seen.push(a.action);
 const okk=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
 if(a.action==='contacts.get')return okk({rows:D.contacts});
 if(a.action==='squad.get')return okk({meta:Object.assign({club:D.club,team:D.team},D.squad_meta),rows:D.squad});
 if(a.action==='squad.set'){saved=a;return okk({saved:a.rows.length,exported:a.meta.exported});}
 return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:false,error:'nope'})});});
const pl={};if(!process.env.SEED)D.squad.forEach((s,i)=>{const id='p'+i;pl[id]={id,name:s.name,num:String(i+2),active:true,pos:['CM']};});
await p.addInitScript(pl=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:pl,matches:{},settings:{id:'main'},revs:{},gd:{},dirty:{}}));localStorage.setItem('tl.who','Tim');},pl);
await p.goto('http://localhost:'+PORT+'/coach/index.html');await p.waitForTimeout(1200);
await p.evaluate(()=>{TLX.view.tab='ct';TLX.render(true);});await p.waitForTimeout(800);
let t=await p.innerText('#root');
T('Contacts shows Lancashire FA safeguarding with email',/rachael\.murphy@lancashirefa\.com/.test(t)&&/01772 237137/.test(t));
T('Contacts shows FA and NSPCC backups',/Safeguarding@TheFA\.com/.test(t)&&/0808 800 5000/.test(t));
T('Parents listed with player and shirt number',/#2 /.test(t)&&new RegExp(D.contacts.find(c=>c.group==='parent').name).test(t));
const bcc=await p.getAttribute('a:has-text("Email all parents")','href');T('Email all parents uses BCC',/^mailto:\?bcc=/.test(bcc));
T('WhatsApp links use wa.me with 44',await p.locator('a[href^="https://wa.me/447"]').count()>0);
if(SH)await p.screenshot({path:SH+'/1_coach_contacts.png',fullPage:true});
await p.evaluate(()=>{TLX.view.tab='mday';TLX.render(true);});await p.waitForTimeout(500);
t=await p.innerText('#mdayfs');
T('Squad list shows UK export date',/Exported 22 Oct 2026, 18:40/.test(t));
T('Squad list has no DOB, parents or phones',!/07\d{9}/.test(t)&&!D.squad.some(s=>s.dob&&t.includes(s.dob))&&!/@/.test(t));
await p.click('button:has-text("Full screen")');await p.waitForTimeout(500);
if(SH)await p.screenshot({path:SH+'/2_fullscreen_squad.png',fullPage:true});
T('Full screen engaged',await p.evaluate(()=>!!document.fullscreenElement));
await p.evaluate(()=>document.exitFullscreen&&document.exitFullscreen()).catch(()=>{});
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('button:has-text("Share to WhatsApp")')]);
const fp=SH?SH+'/3_opposition_share.png':'/tmp/opp_share_test.png';await dl.saveAs(fp);T('Share falls back to a PNG download',fs.statSync(fp).size>5000);
// offline: reload with backend failing, list still opens from IndexedDB
await p.unroute('**/macros/**');await p.route('**/macros/**',r=>r.abort());await p.reload();await p.waitForTimeout(1000);
await p.evaluate(()=>{TLX.view.tab='mday';TLX.render(true);});await p.waitForTimeout(800);
T('Opens offline from the phone copy',/Exported 22 Oct 2026/.test(await p.innerText('#root')));
// older export is refused
await p.evaluate(()=>{document.querySelector('details').open=true;});
await p.fill('#sqpaste','Squad List\nExported on 1 September 2026 at 10:00\nOld Name\nAge: 14 Reg: 17 Aug 2026\n');p.once('dialog',d=>d.accept());await p.click('button:has-text("Check and save")');await p.waitForTimeout(300);
T('Older export is not saved',/older/i.test(await p.innerText('#sqmsg')));
T('No page errors',errs.length===0);if(errs.length)console.log(errs);
// family page never asks for private data
const f=await ctx.newPage();const fa=[];await f.route('**/macros/**',r=>{try{fa.push(JSON.parse(r.request().postData()||'{}').action)}catch(e){}r.fulfill({status:200,contentType:'application/json',headers:H,body:'{"ok":false,"error":"nope"}'});});
await f.goto('http://localhost:'+PORT+'/family.html');await f.waitForTimeout(800);T('Family page never calls contacts or squad actions',!fa.some(a=>/contacts|squad/.test(a||'')));
await b.close();srv.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);})().catch(e=>{console.error(e);process.exit(1);});
