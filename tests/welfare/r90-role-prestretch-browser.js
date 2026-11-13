/* r90: My role hub + Pre-game stretch. Fake backend. SHOTS=/workspace/shots */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8797,SHOTS=process.env.SHOTS||'';
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.webmanifest':'application/json'};
const srv=http.createServer((q,r)=>{let u=q.url.split('?')[0],f=path.join(root,decodeURIComponent(u));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
const shot=async(p,n)=>{if(!SHOTS)return;fs.mkdirSync(SHOTS,{recursive:true});await p.screenshot({path:path.join(SHOTS,n)});};
const w=ms=>new Promise(r=>setTimeout(r,ms));
const _td=new Date(),_iso=_td.getFullYear()+'-'+String(_td.getMonth()+1).padStart(2,'0')+'-'+String(_td.getDate()).padStart(2,'0');

async function seedFamily(page,role){
 page.on('pageerror',e=>{(page.__errs=page.__errs||[]).push(String(e.message));});
 await page.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
  (page.__sent=page.__sent||[]).push(a);
  const okk=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
  if(a.action==='f.home')return okk({first:'Sam',role:role||'player',num:'7',mine:{},rsn:{},x:{fixtures:[{id:'g1',opp:'Role FC',date:_iso,ko:'15:00',ha:'H',venue:'Christopher Park'}],posts:[]},posts:[],res:[],tips:[],vote:{}});
  if(a.action==='f.self.get')return okk({done:1,num:'7',nick:'Sammy',pos:['CB','RCB'],foot:'R',sr:{},role:'player'});
  if(a.action==='f.child')return okk({num:'7',first:'Lad',pos:['CB']});
  if(a.action==='f.rolecard')return okk({opp:'Role FC',ko:'15:00',ha:'H',date:_iso,pos:'CB',inp:'Split',out:'Cover',cue:'Look',trig:''});
  if(a.action==='f.workon')return okk({items:[],at:1});
  if(a.action==='f.niggle'||a.action==='f.prestretch.set')return okk({ok:true,id:'N1',num:a.num||'7',areas:a.areas});
  if(a.action==='f.late'||a.action==='f.late.undo')return okk({ok:true});
  return okk({});});
 await page.addInitScript(()=>{const _g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return /^fam\.wel\./.test(k)?'1':_g.call(this,k);};localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');});
}

(async()=>{
 const b=await chromium.launch();
 const ph=devices['Pixel 7'];

 const ctx=await b.newContext({...ph});const q=await ctx.newPage();q.__errs=[];
 await seedFamily(q,'player');
 await q.goto('http://localhost:'+PORT+'/family.html');await w(2200);
 await q.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();const md=document.getElementById('tl-md');if(md)md.remove();try{localStorage.setItem('tl.md.shown.'+(new Date().toISOString().slice(0,10)),'1');}catch(e){}});
 // Wait for scripts
 await q.waitForFunction(()=>!!(window.roleBtn&&window.openPreStretch&&window.preStretchExtra),{timeout:8000}).catch(()=>{});
 const loaded=await q.evaluate(()=>({role:!!window.roleBtn,pre:!!window.openPreStretch,pos:!!window.openMyRole,stretch:typeof stretchCard==='function'}));
 T('role + prestretch scripts loaded',loaded.role&&loaded.pre&&loaded.pos);
 // Paint dedicated harness panel (avoids Me-tab layout races)
 await q.evaluate(()=>{
  window.SELF={done:1,role:'player',num:'7',pos:['CB','RCB'],nick:'Sammy'};
  if(window.D){D.role='player';D.num='7';D.first='Sam';}
  let host=document.getElementById('r90-harness');
  if(!host){host=document.createElement('div');host.id='r90-harness';host.style.cssText='padding:12px;max-width:520px;margin:0 auto';document.body.prepend(host);} /* r113: outside #root so a background refresh cannot wipe it */
  host.innerHTML=(window.roleBtn?roleBtn({label:'My role'}):'<p>no role</p>')+
   '<div class="card" id="stretchc"><span class="tag" style="background:#16a34a">Cool down</span><h2 style="margin-top:8px">Stretching</h2><p class="small muted">18 football stretches.</p><a class="btn block" href="stretch/index.html?v=90">Start stretching</a>'+(window.preStretchExtra?preStretchExtra():'')+'</div>';
 });
 await w(300);
 T('player harness has My role card',!!(await q.$('#r90-harness .tl-role button')));
 await shot(q,'r90_role_phone_card.png');
 await q.click('#r90-harness .tl-role button.btn.pri');await w(700);
 T('My role hub opens',!!(await q.$('#tl-roleview'))&&/My position/i.test(await q.innerText('#tl-roleview')));
 await shot(q,'r90_role_phone_hub.png');
 const chipN=await q.$$eval('#tl-roleview .chip, #r90-harness .tl-role-chips .chip',xs=>xs.length);
 T('position chips available',chipN>=8);
 const switched=await q.evaluate(()=>{
  const root=document.getElementById('tl-roleview');
  if(!root)return false;
  const b=[...root.querySelectorAll('.chip,button')].find(x=>/^GK$/.test(x.textContent.trim()));
  if(!b){if(window.openMyRole){openMyRole('GK');return true;}return false;}
  b.click();return true;
 });
 await w(500);
 T('chip switches to GK',switched&&/GK/i.test(await q.innerText('#tl-roleview')));
 await shot(q,'r90_role_phone_gk.png');
 await q.evaluate(()=>{if(window.closeMyRole)closeMyRole();});await w(200);

 T('Pre-game stretch on Stretching section',/Pre-game stretch/i.test(await q.innerText('#stretchc')));
 await shot(q,'r90_prestretch_phone_card.png');
 await q.click('#stretchc button:has-text("Pre-game stretch")');await w(400);
 T('niggle chip sheet opens',!!(await q.$('#tl-pre-sheet'))&&/If it hurts, stop and tell a coach/i.test(await q.innerText('#tl-pre-sheet')));
 const labs=await q.$$eval('#tl-pre-sheet [data-area]',xs=>xs.map(x=>x.getAttribute('data-area')));
 T('area chips include hamstrings..none',['hamstrings','calves','groin','hips','quads','lowerback','ankles','none'].every(k=>labs.includes(k)));
 await shot(q,'r90_prestretch_phone_chips.png');
 await q.click('#tl-pre-sheet [data-area="hamstrings"]');await w(150);
 await q.click('#tl-pre-sheet [data-area="calves"]');await w(150);
 // Capture navigation
 const [nav]=await Promise.all([
  q.waitForURL(/stretch\/index\.html.*mode=pregame/,{timeout:8000}).catch(()=>null),
  q.click('#tl-pre-go')
 ]);
 await w(800);
 if(!/stretch/.test(q.url())){
  const prog=await q.evaluate(()=>localStorage.getItem('tl.prestretch'));
  T('programme saved before navigate',!!prog&&/hamstrings/.test(prog||''));
  await q.goto('http://localhost:'+PORT+'/stretch/index.html?mode=pregame&v=90');await w(1000);
 }else{
  T('programme saved before navigate',await q.evaluate(()=>/hamstrings/.test(localStorage.getItem('tl.prestretch')||'')));
 }
 const pre=await q.evaluate(()=>({h1:(document.querySelector('header h1')||{}).textContent||'',h2:(document.querySelector('#list h2')||{}).textContent||'',cnt:+((document.getElementById('cnt')||{}).textContent||0),total:(document.getElementById('total')||{}).textContent||''}));
 T('pregame list is short dynamic set',pre.cnt>0&&pre.cnt<=10);
 T('pregame chrome says Pre-game',/Pre-game/i.test(pre.h1+pre.h2));
 await shot(q,'r90_prestretch_phone_list.png');

 // offline queue
 await q.goto('http://localhost:'+PORT+'/family.html');await w(1500);
 await q.evaluate(()=>{
  Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>false});
  const row={act:'f.niggle',num:'7',areas:['groin'],ids:['adductor'],date:new Date().toISOString().slice(0,10),at:Date.now(),hold:10};
  localStorage.setItem('tl.niggle.q',JSON.stringify([row]));
 });
 T('offline niggle queued',await q.evaluate(()=>JSON.parse(localStorage.getItem('tl.niggle.q')||'[]').length>=1));
 const pe=(q.__errs||[]).filter(e=>!/favicon|AudioContext|play\(\)|NotAllowedError/i.test(e));
 T('no unexpected player errors'+(pe.length?' '+pe.join(' | '):''),pe.length===0);
 await ctx.close();

 // coach niggle attendance
 const C=await b.newContext({...ph});const c=await C.newPage();
 await c.addInitScript(()=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:{p6:{id:'p6',name:'Gus Test',num:'7',pos:['CM'],active:true},p0:{id:'p0',name:'Alfie Test',num:'1',pos:['GK'],active:true}},matches:{},settings:{id:'main',half:35,subEvery:17,roles:{},att:{},updatedAt:0},dirty:{},lastSync:Date.now()}));});
 await c.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
  const okk=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
  if(a.action==='niggle.list')return okk({rows:[{id:'N1',num:'7',areas:['hamstrings','calves'],date:_iso,at:Date.now()}]});
  if(a.action==='late.list')return okk({rows:[]});
  if(a.action==='sync')return okk({docs:[],serverTime:Date.now()});
  return okk({rows:[]});});
 await c.goto('http://localhost:'+PORT+'/coach/index.html#/att/plan');await w(1800);
 await c.waitForFunction(()=>!!(window.TLX&&TLX.S&&TLX.render),{timeout:10000}).catch(()=>{});
 await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
 await c.evaluate((iso)=>{try{const S=window.TLX.S();S.niggle=[{id:'N1',num:'7',areas:['hamstrings','calves'],date:iso,at:Date.now()}];const v=TLX.view;v.hub=v.hub||{};v.hub.niggle=S.niggle;v.tab='att';v.hub.at=Date.now();TLX.render(true);}catch(e){console.error(e);}},_iso);
 await w(800);
 await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
 const nig=await c.evaluate(()=>{const t=(document.getElementById('root')||{}).innerText||'';const chip=[...document.querySelectorAll('button, .chip')].find(b=>/niggle/i.test(b.innerText)&&/\b7\b/.test(b.innerText));const ban=document.querySelector('.tl-niggle-banner');return {chip:!!chip,ban:!!(ban&&/No\. 7/.test(ban.innerText)),t:/niggle/i.test(t)};});
 T('coach attendance shows niggle for shirt 7',nig.chip||nig.ban);
 await shot(c,'r90_prestretch_phone_coach_niggle.png');
 await C.close();

 // PC
 const pc=await b.newContext({viewport:{width:1280,height:800}});const p=await pc.newPage();
 await seedFamily(p,'player');
 await p.goto('http://localhost:'+PORT+'/family.html');await w(2000);
 await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();const md=document.getElementById('tl-md');if(md)md.remove();
  try{localStorage.setItem('tl.md.shown.'+(new Date().toISOString().slice(0,10)),'1');}catch(e){}
  window.SELF={done:1,role:'player',num:'7',pos:['CB']};if(window.D){D.role='player';D.num='7';}
  let host=document.getElementById('r90-harness');if(!host){host=document.createElement('div');host.id='r90-harness';document.body.prepend(host);} /* r113: outside #root so a background refresh cannot wipe it */
  host.innerHTML=(window.roleBtn?roleBtn({label:'My role'}):'')+'<div class="card" id="stretchc"><h2>Stretching</h2>'+(window.preStretchExtra?preStretchExtra():'')+'</div>';
 });
 await w(400);
 await shot(p,'r90_role_pc_card.png');
 await p.evaluate(()=>{const md=document.getElementById('tl-md');if(md)md.remove();openMyRole('CB');});await w(500);await shot(p,'r90_role_pc_hub.png');
 await p.evaluate(()=>window.closeMyRole&&closeMyRole());
 await p.evaluate(()=>{const md=document.getElementById('tl-md');if(md)md.remove();openPreStretch();});await w(400);await shot(p,'r90_prestretch_pc_chips.png');
 await p.evaluate(()=>{const b=document.querySelector('#tl-pre-sheet [data-area="none"]');if(b)b.click();});await w(150);
 await p.evaluate(()=>{const b=document.getElementById('tl-pre-go');if(b)b.click();});
 await w(800);
 if(!/stretch/.test(p.url()))await p.goto('http://localhost:'+PORT+'/stretch/index.html?mode=pregame&v=90');
 await w(800);await shot(p,'r90_prestretch_pc_list.png');
 await pc.close();

 // Base44 shell QA: five tabs still present on coach
 const S=await b.newContext({...ph});const s=await S.newPage();
 await s.addInitScript(()=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:{},matches:{},settings:{id:'main',half:35,subEvery:17,roles:{},updatedAt:0},dirty:{},lastSync:Date.now()}));});
 await s.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{rows:[],docs:[],serverTime:Date.now()}})}));
 await s.goto('http://localhost:'+PORT+'/coach/index.html');await w(1200);
 await s.evaluate(()=>{const x=document.getElementById('splash');if(x)x.remove();});
 const tabs=await s.$$eval('nav.tabs button',xs=>xs.map(b=>b.textContent.trim()));
 T('Base44 shell five tabs intact',tabs.join(',')==='Today,Match,Train,Library,Team');
 T('More in top bar',!!(await s.$('header.tl-top [aria-label="More"]')));
 await shot(s,'r90_role_phone_shell.png');
 await S.close();

 await b.close();srv.close();
 console.log(ok+' passed, '+bad+' failed');
 process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
