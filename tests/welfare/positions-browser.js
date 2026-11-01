// Release 74: My position card, full screen guide (f.pos.file), Match prep, coach Positions area.
// Fake backend only. SHOTS=dir saves mobile screenshots.
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=8797,SHOTS=process.env.SHOTS||'';
const MT={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png'};
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'},shot=async(p,n)=>{if(SHOTS)await p.screenshot({path:path.join(SHOTS,n)});};
const fam=JSON.parse(fs.readFileSync(path.join(root,'positions.json'),'utf8'));
(async()=>{const b=await chromium.launch(),dev=devices['Pixel 7'];
 // a small guide PDF for the fake backend
 const g=await b.newPage();await g.setContent('<style>body{font:16px sans-serif;padding:24px}h1{font-size:22px}</style><h1>How to play Right centre-back (RCB) in our 3-5-2</h1><h2>Your job WITH the ball</h2><ul><li>Split wide when the GK has the ball.</li><li>First look forward: RWB, CDM or a striker dropping.</li><li>Carry it forward into midfield if there is space.</li></ul><h2>Your job WITHOUT the ball</h2><ul><li>Cover the channel between the middle CB and the RWB.</li><li>Stay connected to the middle CB.</li></ul>');
 const pdf=(await g.pdf({format:'A4'})).toString('base64');await g.close();
 // ---------- player ----------
 const ctx=await b.newContext({...dev});const q=await ctx.newPage();const errs=[],calls=[];q.on('pageerror',e=>errs.push(e.message));
 await q.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}')}catch(e){}calls.push(a);
  const okk=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
  if(a.action==='f.home')return okk({first:'Sam',role:'player',x:{},posts:[],res:[],tips:[]});
  if(a.action==='f.rolecard')return okk({opp:'Opponents',ko:'10:30',ha:'H',date:'2026-11-08',pos:'RCB',inp:'Split wide',out:'Cover the channel',cue:'Look before it comes',trig:'Their 9 drops'});
  if(a.action==='f.workon')return okk({items:[{k:'iq',txt:'Scan over your shoulder before the ball comes'},{k:'',txt:'Win your 1v1 defending by staying on your feet'}],at:1});
  if(a.action==='f.pos.file')return a.id===fam.slots[1].guide?okk({name:'RCB guide',mime:'application/pdf',kind:'pdf',size:1,b64:pdf}):r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:false,error:'That file is not a position guide.'})});
  return okk({});});
 await q.addInitScript(()=>{const _g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return /^fam\.wel\./.test(k)?'1':_g.call(this,k);};localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');});
 await q.goto(`http://localhost:${PORT}/family.html`);await q.waitForSelector('#posCard',{timeout:8000});await q.waitForTimeout(2500);await q.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
 let tx=await q.innerText('#posCard');
 T('player sees My position for RCB from the role card',/RCB Right centre-back/.test(tx)&&/Open my role guide/.test(tx));
 T('Suggested for you from work ons (scanning, 1v1 defending)',/Suggested for you/i.test(tx)&&/scanning/.test(tx)&&/1v1 defending/.test(tx));
 T('top clips are lazy cards',await q.$$eval('#posCard img[loading="lazy"]',x=>x.length)>=3);
 const body=await q.innerText('body');T('no Coaches\' Voice in the player view',!/coaches.?voice|CV Academy/i.test(body)&&!(await q.content()).includes('coachesvoice'));
 await q.$eval('#posCard',e=>e.scrollIntoView());await q.waitForTimeout(400);await shot(q,'1_player_my_position.png');
 await q.$eval('#prepCard',e=>e.scrollIntoView());await q.waitForTimeout(200);tx=await q.innerText('#prepCard');
 T('Match prep: checklist and one thing I am working on',/Matchday checklist/.test(tx)&&/Scan over your shoulder/.test(tx)&&/My job:/.test(tx));
 await q.click('#prepCard input[type=checkbox]');T('checklist tick saved on the phone',/"0":1/.test(await q.evaluate(()=>localStorage.getItem('fam.pchk'))));
 await shot(q,'3_match_prep.png');
 await q.$eval('#posCard',e=>e.scrollIntoView());await q.click('text=Open my role guide');await q.waitForSelector('#posview canvas',{timeout:15000});await q.waitForTimeout(1500);
 T('guide opens full screen through f.pos.file',calls.some(c=>c.action==='f.pos.file'&&c.id===fam.slots[1].guide)&&!calls.some(c=>c.action==='file.get'));
 await shot(q,'2_full_screen_guide.png');
 await q.click('#pvback');await q.waitForTimeout(300);T('Back closes the guide',!(await q.$('#posview')));
 await q.click('#posCard summary:has-text("Look at another position")');await q.click('#posCard .chip:has-text("GK")');await q.waitForTimeout(300);
 T('picker opens another position',/GK Goalkeeper/.test(await q.innerText('#posCard')));
 T('player page has no errors',errs.length===0);if(errs.length)console.log(errs);
 // parent sees no position card
 const pc=await b.newContext({...dev}),pp=await pc.newPage();await pp.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}')}catch(e){}r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:a.action==='f.home'?{first:'Sam',role:'parent',x:{},posts:[],res:[],tips:[]}:{}})});});
 await pp.addInitScript(()=>{const _g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return /^fam\.wel\./.test(k)?'1':_g.call(this,k);};localStorage.setItem('fam.code','q');localStorage.setItem('fam.ok1','1');});
 await pp.goto(`http://localhost:${PORT}/family.html`);await pp.waitForTimeout(1500);T('parent view has no position card',!(await pp.$('#posCard')));
 // ---------- coach ----------
 const cc=await b.newContext({...dev});const c=await cc.newPage();const ce=[];c.on('pageerror',e=>ce.push(e.message));
 await c.addInitScript(()=>{window.__shared=[];Object.defineProperty(navigator,'share',{value:d=>{window.__shared.push(d);return Promise.resolve();},configurable:true});localStorage.setItem('tl.code','x');localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:{},matches:{},settings:{id:'main',half:35,subEvery:17,roles:{},updatedAt:0},dirty:{},lastSync:Date.now()}));});
 await c.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{}})}));
 await c.goto(`http://localhost:${PORT}/coach/index.html`);await c.waitForTimeout(800);
 await c.evaluate(()=>{const b=[...document.querySelectorAll('nav.tabs button, nav.tabs a')].find(x=>/train/i.test(x.textContent));b&&b.click();});await c.waitForTimeout(300);
 await c.click('.seg button:has-text("Library")');await c.waitForTimeout(200);await c.click('.seg.sub button:has-text("Positions")');await c.waitForSelector('#posArea .chip',{timeout:8000});
 await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});const ct=await c.$eval('#posArea',e=>e.textContent);T('coach sees all 11 positions',(await c.$$eval('#posArea .chips .chip',x=>x.length))===11);
 T('coach sees CV items marked coach only',/CV coach only/.test(ct));
 await c.click('#posArea [data-pact="share"] >> nth=1');await c.waitForTimeout(200);const sh=await c.evaluate(()=>window.__shared);
 T('Share with player uses the native share menu with the link',sh.length===1&&/^https?:/.test(sh[0].url));
 await shot(c,'4_coach_positions.png');
 T('coach page has no errors',ce.length===0);if(ce.length)console.log(ce);
 await b.close();srv.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);})().catch(e=>{console.error(e);process.exit(1);});
