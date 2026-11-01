// r71: coach Contacts + FA squad list. Uses made-up data only (real data lives in the private sheet).
// SEED=/path/seed.json SHOTS=/dir node contacts-browser.js  -> uses that data and saves screenshots (run off-repo only).
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+(process.env.PORT||8796);
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':/\.m?js$/.test(f)?'text/javascript':f.endsWith('.html')?'text/html':f.endsWith('.css')?'text/css':'application/octet-stream'});r.end(d);});}).listen(PORT);
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
// r78: the FA squad list is the FA's own PDF (made-up PDF here), never our own table
function mkPdf(lines){const txt=lines.map((l,i)=>'BT /F1 12 Tf 40 '+(800-i*18)+' Td ('+l+') Tj ET').join('\n');const o=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>','<< /Length '+txt.length+' >>\nstream\n'+txt+'\nendstream','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];let out='%PDF-1.4\n';const off=[];o.forEach((x,i)=>{off.push(out.length);out+=(i+1)+' 0 obj\n'+x+'\nendobj\n';});const xr=out.length;out+='xref\n0 '+(o.length+1)+'\n0000000000 65535 f \n'+off.map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+(o.length+1)+' /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF';return Buffer.from(out,'latin1');}
const PDF1=mkPdf(['Example FC U15 Squad List','Exported by Test Coach on 22 October 2026 at 18:40','Alex Sample','Age: 14 Reg: 17 Aug 2026','Sam Dummy','Age: 15 Reg: 18 Sep 2026']);
const PDF0=mkPdf(['Example FC U15 Squad List','Exported on 1 September 2026 at 10:00','Old Name','Age: 14 Reg: 17 Aug 2026']);
let pdfSet=null;
await p.unroute('**/macros/**');await p.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}')}catch(e){}
 const okk=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
 if(a.action==='contacts.get')return okk({rows:D.contacts});
 if(a.action==='squad.get')return okk({meta:Object.assign({club:D.club,team:D.team},D.squad_meta,pdfSet?{pdf_id:'f1',pdf_exported:pdfSet.exported,pdf_uploaded:'2026-11-01T23:00'}:{}),rows:D.squad});
 if(a.action==='squad.set'){saved=a;return okk({saved:a.rows.length,exported:a.meta.exported});}
 if(a.action==='squad.pdf.set'){pdfSet=a;return okk({pdf_id:'f1',pdf_name:'FA squad list.pdf',pdf_exported:a.exported,pdf_uploaded:'2026-11-01T23:00'});}
 if(a.action==='squad.pdf.get')return okk(pdfSet?{pdf_id:'f1',pdf_exported:pdfSet.exported,pdf_uploaded:'2026-11-01T23:00',b64:pdfSet.b64}:{none:true});
 return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:false,error:'nope'})});});
await p.evaluate(()=>{TLX.view.tab='mday';TLX.render(true);});await p.waitForTimeout(600);
t=await p.innerText('#root');
T('No PDF yet: clear upload prompt, no generated table',/Upload the FA squad PDF/.test(t)&&!D.squad.some(s=>t.includes(s.fan))&&!/<table/.test(await p.innerHTML('#root .card')));
p.once('dialog',d=>d.accept());await p.setInputFiles('#sqpfile',{name:'squad.pdf',mimeType:'application/pdf',buffer:PDF1});await p.waitForTimeout(2500);
T('Upload sends the original PDF with its export date',!!pdfSet&&pdfSet.exported==='2026-10-22T18:40'&&Buffer.from(pdfSet.b64,'base64').slice(0,4).toString()==='%PDF');
t=await p.innerText('#root');
T('Shows the UK export date',/Exported 22 Oct 2026, 18:40/.test(t));
T('PDF is drawn inline',await p.locator('#sqpview canvas').count()>0);
if(SH)await p.screenshot({path:SH+'/2_fa_pdf_inline.png',fullPage:true});
await p.click('button:has-text("Full screen")');await p.waitForTimeout(1200);
T('Full screen viewer opens in the app',await p.locator('#dview canvas').count()>0&&await p.locator('#dview a[data-drive]').count()===0);
if(SH)await p.screenshot({path:SH+'/3_fa_pdf_fullscreen.png'});
await p.evaluate(()=>document.exitFullscreen&&document.exitFullscreen()).catch(()=>{});await p.click('#dvback');await p.waitForTimeout(400);
p.once('dialog',d=>d.accept());
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('button:has-text("Share to WhatsApp")')]);
const fp='/tmp/opp_share_test.pdf';await dl.saveAs(fp);T('Share sends the FA PDF itself',fs.readFileSync(fp).slice(0,4).toString()==='%PDF');
// offline: reload with backend failing, PDF still opens from IndexedDB
await p.unroute('**/macros/**');await p.route('**/macros/**',r=>r.abort());await p.reload();await p.waitForTimeout(1000);
await p.evaluate(()=>{TLX.view.tab='mday';TLX.render(true);});await p.waitForTimeout(1500);
T('Opens offline from the phone copy',/Exported 22 Oct 2026/.test(await p.innerText('#root'))&&await p.locator('#sqpview canvas').count()>0);
// older export is refused
await p.setInputFiles('#sqpfile',{name:'old.pdf',mimeType:'application/pdf',buffer:PDF0});await p.waitForTimeout(1500);
T('Older export is not saved',/older/i.test(await p.innerText('#sqpmsg')));
T('No page errors',errs.length===0);if(errs.length)console.log(errs);
// family page never asks for private data
const f=await ctx.newPage();const fa=[];await f.route('**/macros/**',r=>{try{fa.push(JSON.parse(r.request().postData()||'{}').action)}catch(e){}r.fulfill({status:200,contentType:'application/json',headers:H,body:'{"ok":false,"error":"nope"}'});});
await f.goto('http://localhost:'+PORT+'/family.html');await f.waitForTimeout(800);T('Family page never calls contacts or squad actions',!fa.some(a=>/contacts|squad/.test(a||'')));
await b.close();srv.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);})().catch(e=>{console.error(e);process.exit(1);});
