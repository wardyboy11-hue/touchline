/* r97: resources browse home, instant search, filters, favourites (offline until backend v34), zero console errors on coach/family/parents.
   BASE=https://touchline.cipher-training.co.uk for a live render check (backend faked). PORT default 8798. */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8798,SHOTS=process.env.SHOTS||'/workspace/shots',PRE=process.env.PRE||'r97_';
fs.mkdirSync(SHOTS,{recursive:true});
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm','.webmanifest':'application/json'};
let srv=null;if(!process.env.BASE)srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
const BASE=process.env.BASE||('http://localhost:'+PORT);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
const state={ideas:{},players:{p1:{id:'p1',name:'Test Lad',num:'7',pos:['CM'],active:true}},matches:{},settings:{id:'main',half:35,roles:{},updatedAt:0},dirty:{},lastSync:Date.now()};
let FAVROWS=null;
function errsOf(p){const e=[];p.on('pageerror',x=>e.push('pageerror: '+x.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))e.push('console: '+m.text());});return e;}
async function coach(b,vp,v34){const ctx=await b.newContext(vp);const c=await ctx.newPage();const E=errsOf(c);
 await c.addInitScript(s=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',s);},JSON.stringify(state));
 await c.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
  if(/^fav\./.test(a.action)){if(!v34)return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:false,error:'Unknown action'})});
   FAVROWS=FAVROWS||[];if(a.action==='fav.set'){FAVROWS=FAVROWS.filter(x=>!(x.key===a.key&&x.by===a.who));FAVROWS.push({key:a.key,title:a.title,by:a.who,note:a.note,at:Date.now()});}if(a.action==='fav.del')FAVROWS=FAVROWS.filter(x=>x.key!==a.key);
   return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{rows:FAVROWS}})});}
  r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{docs:[],serverTime:Date.now(),rows:[]}})});});
 await c.goto(BASE+'/coach/index.html');await c.waitForTimeout(1200);
 await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();TLX.view.tab='res';TLX.render();});
 await c.waitForFunction(()=>!!document.querySelector('.tl-tiles'),{timeout:15000}).catch(()=>{});
 return {ctx,c,E};}
(async()=>{const b=await chromium.launch();const ph=devices['Pixel 7'];
 // Mobile coach, backend before v34
 {const {ctx,c,E}=await coach(b,{...ph},false);
  T('browse home shows a tile per topic with counts',await c.locator('.tl-tiles').first().locator('.tl-tile').count()===await c.evaluate(()=>window.RT.length));
  T('defaults to U15 with a one tap clear chip',await c.locator('.tl-fbar .chip.on',{hasText:'U15'}).count()===1);
  T('no long flat list on the home',await c.locator('.tl-rr').count()===0);
  await c.screenshot({path:path.join(SHOTS,PRE+'browse_mobile.png')});
  await c.fill('#rq','rondo');await c.waitForTimeout(400);
  const n=await c.locator('.tl-rr').count();T('instant search shows results without a button (max 30 rows)',n>0&&n<=30);
  T('search box keeps focus while typing',await c.evaluate(()=>document.activeElement&&document.activeElement.id==='rq'));
  await c.screenshot({path:path.join(SHOTS,PRE+'search_mobile.png')});
  await c.locator('.tl-rr [data-act="favTog"]').first().click();await c.waitForTimeout(500);
  T('heart works with old backend and says not synced yet',await c.locator('.tl-fns').count()>0&&await c.locator('.tl-rr .tl-ib.on').count()>=1);
  await c.locator('.tl-rr .tl-rt').first().click();await c.waitForTimeout(300);
  await c.fill('#favnote','This worked well');await c.click('[data-act="favNoteSave"]');await c.waitForTimeout(400);
  T('note shows with who and UK date',await c.locator('#sheet .it',{hasText:'This worked well'}).count()===1&&/Tim, /.test(await c.locator('#sheet .it').first().innerText()));
  await c.screenshot({path:path.join(SHOTS,PRE+'item_mobile.png')});
  await c.click('#sheet [data-act="closeSheet"]');
  await c.click('[data-act="resFil"]');await c.waitForTimeout(300);
  T('filter sheet has live counts',await c.locator('#sheet .chip .muted').count()>20);
  await c.screenshot({path:path.join(SHOTS,PRE+'filters_mobile.png')});
  await c.click('#sheet [data-act="resClrAll"]');await c.click('#sheet [data-act="closeSheet"]');
  await c.evaluate(()=>{TLX.view.tab='fav';TLX.render();});await c.waitForTimeout(300);
  T('favourites page lists the heart',await c.locator('.tl-rr').count()===1);
  await c.screenshot({path:path.join(SHOTS,PRE+'favourites_mobile.png')});
  const st=await c.evaluate(()=>JSON.parse(localStorage.getItem('tl.fav')));T('favourite cached locally with pending sync',st.rows.length===1&&st.pend.length>=1);
  T('filters remembered',!!(await c.evaluate(()=>localStorage.getItem('tl.resf'))));
  T('coach mobile zero console errors',E.length===0);if(E.length)console.log(E);await ctx.close();}
 // PC coach, backend v34 present: syncs
 {FAVROWS=[{key:'1~x',title:'Shared one',by:'Deano',note:'Good for the back three',at:Date.now()}];const {ctx,c,E}=await coach(b,{viewport:{width:1440,height:900}},true);
  await c.waitForTimeout(800);await c.evaluate(()=>TLX.render(true));await c.waitForTimeout(300);
  await c.screenshot({path:path.join(SHOTS,PRE+'browse_pc.png')});
  await c.click('[data-act="resTile"][data-i="1"]');await c.waitForTimeout(300);
  T('topic tile opens a filtered list',await c.locator('.tl-rr').count()>0);
  await c.locator('.tl-rr [data-act="favTog"]').first().click();await c.waitForTimeout(800);
  T('with v34 the heart syncs (no not synced note)',await c.locator('.tl-fns').count()===0&&FAVROWS.some(x=>x.by==='Tim'));
  await c.screenshot({path:path.join(SHOTS,PRE+'list_pc.png')});
  T('coach PC zero console errors',E.length===0);if(E.length)console.log(E);await ctx.close();}
 // Family and parents: render, no coach-only favourites
 for(const pg of ['family.html','parents.html'])for(const [vn,vp] of [['mobile',{...ph}],['pc',{viewport:{width:1440,height:900}}]]){const ctx=await b.newContext(vp);const q=await ctx.newPage();const E=errsOf(q);
  await q.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}const d=a.action==='f.home'?{first:'Pat',role:pg==='parents.html'?'parent':'player',num:'7',mine:{},rsn:{},x:{fixtures:[],posts:[]},posts:[],res:[],tips:[],vote:{}}:{};r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});});
  await q.addInitScript(()=>{localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');});
  await q.goto(BASE+'/'+pg);await q.waitForTimeout(2500);
  const body=await q.evaluate(()=>document.body.innerText);
  T(pg+' '+vn+' renders',body.length>50);T(pg+' '+vn+' has no coach favourites or notes',!/Favourites|Coach notes/.test(body));
  await q.screenshot({path:path.join(SHOTS,PRE+pg.replace('.html','')+'_'+vn+'.png')});
  T(pg+' '+vn+' zero console errors',E.length===0);if(E.length)console.log(E);await ctx.close();}
 await b.close();if(srv)srv.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);})();
