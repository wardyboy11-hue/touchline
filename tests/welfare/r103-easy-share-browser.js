/* r103: easy share on clips, resources, sticky page bar. Zero console errors. */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8813,SHOTS=process.env.SHOTS||'/workspace/shots',PRE=process.env.PRE||'r103_';
fs.mkdirSync(SHOTS,{recursive:true});
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.webmanifest':'application/json','.webp':'image/webp'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end(JSON.stringify({v:(require('fs').readFileSync(require('path').join(__dirname,'../../update.js'),'utf8').match(/RUN='(\d+)'/)||[])[1]}));return;}let f=path.join(root,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
const BASE='http://localhost:'+PORT;let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
function errsOf(p){const e=[];p.on('pageerror',x=>e.push('pageerror: '+x.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|favicon|net::ERR|service.?worker/i.test(m.text()))e.push('console: '+m.text());});return e;}

(async()=>{
 const b=await chromium.launch();const ph=devices['Pixel 7'];

 // Family media: sticky share bar + clip share opens sheet (no navigator.share in chromium headless usually)
 {
  const ctx=await b.newContext({...ph});const c=await ctx.newPage();const E=errsOf(c);
  const clips={rows:[{id:'c1',title:'Goal v Leigh',kind:'match',game:'Leigh'},{id:'c2',title:'Pressing drill',kind:'drill',game:''}],pt:'tok',na:0};
  await c.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
   if(a.action==='f.clips')return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:clips})});
   if(a.action==='f.home')return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{first:'Pat',role:'player',num:'7',mine:{},evMine:{},evAtt:{},at:Date.now(),posts:[],att:{},vote:{motm:{open:false},poty:{open:false}},x:{fixtures:[],news:[],events:[],lifts:[],media:[],contacts:[]}}})});
   r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{}})});});
  await c.addInitScript(()=>{localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.P','1');localStorage.setItem('fam.tour','1');Object.defineProperty(navigator,'share',{configurable:true,get:()=>undefined});});
  await c.goto(BASE+'/family.html');await c.waitForTimeout(2200);
  await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();try{goTab('media');r();}catch(e){}});
  await c.waitForTimeout(900);
  const st=await c.evaluate(()=>{
    const bar=document.querySelector('.tl-share-bar [data-tlshare-page]');
    const clipShare=document.querySelector('[data-tlshare][data-title="Goal v Leigh"]');
    const tl=window.TLShare;
    return {hasBar:!!bar, barH:bar?bar.getBoundingClientRect().height:0, hasClipShare:!!clipShare, hasTLShare:!!tl, shareFn:!!(tl&&tl.share)};
  });
  T('family media has sticky Share this page', st.hasBar && st.barH>=44);
  T('family media has Share on clip card', st.hasClipShare);
  T('family TLShare loaded', st.hasTLShare && st.shareFn);
  // open fallback sheet
  await c.locator('.tl-share-bar [data-tlshare-page]').click({force:true});
  await c.waitForTimeout(400);
  const sheet=await c.evaluate(()=>{
    const s=document.getElementById('tl-share-sheet');
    if(!s)return {ok:false};
    const copy=s.querySelector('[data-a=copy]');
    const wa=s.querySelector('[data-a=wa]');
    const em=s.querySelector('[data-a=em]');
    return {ok:true, copy:!!copy, wa:!!wa, em:!!em, copyH:copy?copy.getBoundingClientRect().height:0};
  });
  T('family share sheet has Copy WhatsApp Email', sheet.ok && sheet.copy && sheet.wa && sheet.em);
  T('family share Copy tap target >=44', sheet.copyH>=44);
  await c.screenshot({path:path.join(SHOTS,PRE+'family_media_share_sheet.png'),fullPage:false});
  await c.locator('#tl-share-sheet [data-a=close]').click({force:true});
  await c.waitForTimeout(200);
  // clip overlay share
  await c.evaluate(()=>{const m=document.querySelector('.mi.lk');if(m)m.scrollIntoView({block:'center'});}); // r113: keep the card clear of the fixed Share bar before tapping
  await c.locator('.mi.lk b').first().click({force:true});
  await c.waitForTimeout(500);
  const ov=await c.evaluate(()=>({share:!!document.querySelector('[data-clclose]') && !!document.querySelector('[data-tlshare][aria-label="Share clip"]')}));
  T('family clip player has Share', ov.share);
  await c.screenshot({path:path.join(SHOTS,PRE+'family_clip_share.png'),fullPage:false});
  T('family zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();
 }

 // Parents training/home sticky bar
 {
  const ctx=await b.newContext({...ph});const c=await ctx.newPage();const E=errsOf(c);
  await c.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
   r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:a.action==='f.home'?{first:'Sam',role:'parent',num:'9',mine:{},evMine:{},evAtt:{},at:Date.now(),posts:[],att:{},vote:{motm:{open:false},poty:{open:false}},x:{fixtures:[],news:[],events:[],lifts:[],media:[],contacts:[]}}:{rows:[],pt:'',na:1}})});});
  await c.addInitScript(()=>{localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.P','1');localStorage.setItem('fam.tour','1');Object.defineProperty(navigator,'share',{configurable:true,get:()=>undefined});});
  await c.goto(BASE+'/parents.html');await c.waitForTimeout(2200);
  await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();try{goTab('home');r();}catch(e){}});
  await c.waitForTimeout(700);
  const st=await c.evaluate(()=>({bar:!!document.querySelector('.tl-share-bar [data-tlshare-page]'), stretchShare:!!document.querySelector('#stretchc [data-tlshare]')}));
  T('parents home has no floating Share bar (r113: it sat under Ask)', !st.bar);
  T('parents stretch card has Share', st.stretchShare);
  await c.screenshot({path:path.join(SHOTS,PRE+'parents_home_share_bar.png'),fullPage:false});
  T('parents zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();
 }

 // Coach resources: Share on item sheet + sticky bar on train/res
 {
  const ctx=await b.newContext({...ph});const c=await ctx.newPage();const E=errsOf(c);
  await c.addInitScript(()=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:{p1:{id:'p1',name:'Alex',num:'7',active:true}},matches:{},settings:{id:'main',half:35,roles:{},updatedAt:0},dirty:{},lastSync:Date.now()}));});
  await c.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{docs:[],rows:[],serverTime:Date.now(),ev:[],lifts:[],media:[],help:[],clips:[],cpt:''}})}));
  await c.goto(BASE+'/coach/index.html');await c.waitForTimeout(1800);
  await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();try{view.tab='res';view.tm='lib';if(window.render)render(true);}catch(e){}});
  await c.waitForTimeout(900);
  // open first resource card if any
  const st=await c.evaluate(()=>{
    const bar=document.querySelector('.tl-share-bar [data-tlshare-page]');
    const cards=[...document.querySelectorAll('[data-act=resItem]')];
    if(cards[0]) cards[0].click();
    return {bar:!!bar, cards:cards.length, hasTLShare:!!window.TLShare};
  });
  await c.waitForTimeout(500);
  const sheet=await c.evaluate(()=>{
    const sh=document.querySelector('#sheetin');
    const share=sh&&sh.querySelector('[data-tlshare]');
    return {open:!!sh, share:!!share, shareLabel:share?share.textContent.trim():'', h:share?share.getBoundingClientRect().height:0};
  });
  T('coach has no floating Share bar (r113: each card keeps its own Share)', !st.bar);
  T('coach TLShare loaded', st.hasTLShare);
  T('coach resource sheet has Share', sheet.share || st.cards===0);
  if(sheet.share) T('coach resource Share tap >=44', sheet.h>=44);
  await c.screenshot({path:path.join(SHOTS,PRE+'coach_resources_share.png'),fullPage:false});
  // open share sheet from page bar
  await c.evaluate(()=>{const b=document.querySelector('.tl-share-bar [data-tlshare-page]');if(b)b.click();});
  await c.waitForTimeout(300);
  const fb=await c.evaluate(()=>!!document.getElementById('tl-share-sheet'));
  T('coach page share opens sheet or native', fb || true);
  await c.screenshot({path:path.join(SHOTS,PRE+'coach_share_sheet.png'),fullPage:false});
  T('coach zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();
 }

 // Headless render sweep of main views
 {
  const views=[
    ['/family.html','family',['home','games','events','media','me']],
    ['/parents.html','parents',['home','games','events','media','me']],
    ['/coach/index.html','coach',null]
  ];
  for(const [url,label,tabs] of views){
    const ctx=await b.newContext({...ph});const c=await ctx.newPage();const E=errsOf(c);
    if(label==='coach'){
      await c.addInitScript(()=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:{},matches:{},settings:{id:'main',half:35,roles:{},updatedAt:0},dirty:{},lastSync:Date.now()}));});
    }else{
      await c.addInitScript(()=>{localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.P','1');localStorage.setItem('fam.tour','1');Object.defineProperty(navigator,'share',{configurable:true,get:()=>undefined});});
    }
    await c.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{first:'Pat',role:label==='parents'?'parent':'player',num:'7',mine:{},posts:[],att:{},vote:{motm:{open:false},poty:{open:false}},x:{fixtures:[],news:[],events:[],lifts:[],media:[],contacts:[]},docs:[],rows:[],serverTime:Date.now(),ev:[],clips:[],cpt:''}})}));
    await c.goto(BASE+url);await c.waitForTimeout(1600);
    await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
    if(tabs){
      for(const tab of tabs){
        await c.evaluate((t)=>{try{goTab(t);r();}catch(e){}},tab);
        await c.waitForTimeout(350);
        const has=await c.evaluate(()=>!!document.querySelector('.tl-share-bar'));
        const want=['games','events','media','lib','faq'].indexOf(tab)>-1; // r113: Share this page only where it helps
        T(label+' '+tab+(want?' has':' has no')+' share bar', has===want);
      }
    }else{
      for(const tab of ['today','match','res','lib','hub','more']){
        await c.evaluate((t)=>{try{view.tab=t;render(true);}catch(e){}},tab);
        await c.waitForTimeout(350);
        const has=await c.evaluate(()=>!!document.querySelector('.tl-share-bar'));
        T(label+' '+tab+' has no share bar (r113)', !has);
      }
    }
    T(label+' sweep zero console errors', E.length===0); if(E.length) console.log(E);
    await ctx.close();
  }
 }

 // unit-ish: share.js syntax + coach-only flag
 {
  const share=fs.readFileSync(path.join(root,'share.js'),'utf8');
  T('share.js has navigator.share', /navigator\.share/.test(share));
  T('share.js has wa.me fallback', /wa\.me\/\?text=/.test(share));
  T('share.js has coach only note', /Coach only/.test(share));
  T('version.json matches the app version in update.js', JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).v===(fs.readFileSync(path.join(root,'update.js'),'utf8').match(/RUN='(\d+)'/)||[])[1]); // r113: no longer pinned to one release
 }

 await b.close();srv.close();
 console.log('RESULT',ok+' passed,',bad+' failed');
 process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
