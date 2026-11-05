/* r90 app shell (countdown + matchday) on the r87 Base44 shell: five tabs, More in the top bar, page addresses, scroll memory, attendance ticks,
   guides on tap, roles grid, Update ready during a match, and the error card. Fake data only. */
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');const PORT=+process.env.PORT||8797;let VER='91';
const SHOTS=process.env.SHOTS||'';
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.vtt':'text/vtt','.mp4':'video/mp4','.webmanifest':'application/json'};
const srv=http.createServer((q,r)=>{const u=q.url.split('?')[0];if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end(JSON.stringify({v:VER}));return;}let f=path.join(root,decodeURIComponent(u));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const NM=['Alfie','Ben','Cal','Dan','Eli','Finn','Gus','Hal','Ike','Jay','Kit','Leo','Max','Ned','Oli','Pip'];
const players={};NM.forEach((n,i)=>{players['p'+i]={id:'p'+i,name:n+' Test',num:String(i+1),pos:['CM'],active:true};});
const _td=new Date(),_iso=_td.getFullYear()+'-'+String(_td.getMonth()+1).padStart(2,'0')+'-'+String(_td.getDate()).padStart(2,'0');
const _tm=new Date(_td.getTime()+86400000),_iso2=_tm.getFullYear()+'-'+String(_tm.getMonth()+1).padStart(2,'0')+'-'+String(_tm.getDate()).padStart(2,'0');
const _tw=new Date(_td.getTime()+7*86400000),_iso7=_tw.getFullYear()+'-'+String(_tw.getMonth()+1).padStart(2,'0')+'-'+String(_tw.getDate()).padStart(2,'0');
const state={ideas:{},players,matches:{
 mcd:{id:'mcd',opp:'Countdown FC',date:_iso2,ko:'15:00',ha:'H',formation:'352',half:35,avail:{},lineup:{},status:'plan',venue:'Christopher Park',updatedAt:1},
 mtd:{id:'mtd',opp:'Train FC',date:_iso7,ko:'19:00',ha:'H',comp:'Training',kind:'train',formation:'352',half:35,avail:{},lineup:{},status:'plan',updatedAt:1}
},settings:{id:'main',half:35,subEvery:17,roles:{},sessions:[],updatedAt:0},dirty:{},lastSync:Date.now()};
const shot=async(c,n)=>{if(SHOTS){await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});await c.screenshot({path:path.join(SHOTS,'r90_'+n+'.png')});}};
async function open(b,dev,st,vid){const cc=await b.newContext({...dev,...(vid?{recordVideo:{dir:vid,size:{width:dev.viewport.width,height:dev.viewport.height}}}:{})});const c=await cc.newPage();const ce=[];c.on('pageerror',e=>ce.push(String(e.message)));
 await c.addInitScript(s=>{if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');localStorage.setItem('tl.code','x');localStorage.setItem('tl.state.v1',s);}},JSON.stringify(st||state));
 await c.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}const H={'access-control-allow-origin':'*'};const ok=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});if(a.action==='late.list')return ok({rows:(globalThis.__LATE_ROWS||[])});if(a.action==='niggle.list')return ok({rows:(globalThis.__NIGGLE_ROWS||[])});if(a.action==='sync')return ok({docs:[],serverTime:Date.now()});if(a.action==='f.late'||a.action==='f.late.undo'){globalThis.__LATE_SENT=(globalThis.__LATE_SENT||[]).concat([a]);return ok({ok:true,id:a.id,sent:1,label:'No. '+(a.num||'?')+' running late'});}return ok({});});
 await c.goto(`http://localhost:${PORT}/coach/index.html`);await c.waitForTimeout(900);await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});return {cc,c,ce};}
const w=ms=>new Promise(r=>setTimeout(r,ms));const H=c=>c.evaluate(()=>location.hash);
(async()=>{const b=await chromium.launch();
 const ph={viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true};
 const {cc,c,ce}=await open(b,ph,null,SHOTS?path.join(SHOTS,'r90_vid'):'');
 const labels=await c.$$eval('nav.tabs button',x=>x.map(b=>b.textContent.trim()));
 T('five tabs: Today, Match, Train, Library, Team',labels.join(',')==='Today,Match,Train,Library,Team');
 T('More and Comms sit in the top bar',!!(await c.$('header.tl-top [aria-label="More"]'))&&!!(await c.$('header.tl-top [aria-label="Comms"]')));
 T('Today has an address',(await H(c))==='#/today');await shot(c,'phone_today');
 await c.click('nav.tabs [aria-label="Library"]');await w(400);T('Library tab opens Positions at #/pos/lib',(await H(c))==='#/pos/lib');await shot(c,'phone_library');
 await c.click('nav.tabs [aria-label="Train"]');await w(400);T('Train tab has a plan or run address',/^#\/(sb\/plan|run\/run)$/.test(await H(c)));await shot(c,'phone_train');
 await c.click('nav.tabs [aria-label="Team"]');await w(400);T('Team tab opens the squad',(await H(c))==='#/squad');
 await c.click('header.tl-top [aria-label="More"]');await w(400);T('More opens at #/more with every page grouped',(await H(c))==='#/more'&&(await c.$$('.tl-tile')).length>=30);await shot(c,'phone_more');
 // attendance via More, two taps
 await c.click('.tl-tile[data-v="att"]');await w(400);T('Attendance reached from More in two taps',(await H(c))==='#/att/plan');
 await c.evaluate(()=>{document.querySelector('.tl-att').dataset.keep='1';});
 await c.click('.tl-att [data-id="p0"]');await w(300);
 const keep=await c.evaluate(()=>!!document.querySelector('.tl-att[data-keep]'));const s1=await c.evaluate(()=>JSON.parse(localStorage.getItem('tl.state.v1')));
 const td=Object.keys(s1.settings.att||{})[0];
 T('tick saves to settings.att without redrawing the page',keep&&td&&s1.settings.att[td].p0===1);
 T('chip shows the tick and the count goes up',await c.evaluate(()=>document.querySelector('.tl-att [data-id="p0"]').classList.contains('on')&&document.getElementById('attn').textContent==='1'));
 await c.click('[data-act="attAll"]');await w(300);T('Everyone in ticks all 16',await c.evaluate(()=>document.getElementById('attn').textContent==='16'));
 await c.reload();await w(900);T('ticks survive a refresh, same page',(await H(c))==='#/att/plan'&&await c.evaluate(()=>document.getElementById('attn').textContent==='16'));await shot(c,'phone_attendance');
 c.once('dialog',d=>d.accept());await c.click('[data-act="attClear"]');await w(300);T('Clear empties the session',await c.evaluate(()=>document.getElementById('attn').textContent==='0'));
 // scroll memory through a refresh
 await c.click('header.tl-top [aria-label="More"]');await w(400);await c.evaluate(()=>window.scrollTo(0,700));await w(500);const y0=await c.evaluate(()=>scrollY);
 await c.reload();await w(1200);const y1=await c.evaluate(()=>scrollY);
 T('refresh keeps the page and the scroll point ('+y0+' then '+y1+')',(await H(c))==='#/more'&&y0>300&&Math.abs(y1-y0)<60);
 // an iPhone memory clear: fresh tab, no hash
 await c.goto(`http://localhost:${PORT}/coach/index.html`);await w(900);T('opening fresh with no address goes back to the last page',(await H(c))==='#/more');
 await c.click('nav.tabs [aria-label="Match"]');await w(300);await c.goBack();await w(400);T('Back button returns to the previous page',(await H(c))==='#/more');
 // guides
 await c.goto(`http://localhost:${PORT}/coach/index.html#/guides`);await w(900);
 T('guides page shows cards and loads no video until tapped',(await c.$$('.tl-card')).length===6&&!(await c.$('video')));
 await c.click('.tl-card[data-i="0"]');await w(500);
 T('tapping a guide opens a sheet with the video and captions on',await c.evaluate(()=>{const v=document.querySelector('#sheet.on video'),t=v&&v.querySelector('track');return !!(v&&t&&t.default&&document.getElementById('sheet').getAttribute('role')==='dialog');}));await shot(c,'phone_guide_sheet');
 await c.keyboard.press('Escape');await w(200);T('Esc closes the sheet',!(await c.$('#sheet.on')));
 // roles grid
 await c.goto(`http://localhost:${PORT}/coach/index.html#/roles/lib`);await w(1200);
 T('roles grid shows the 3-5-2 eleven',(await c.$$('.tl-roles .slot')).length===11);
 await c.click('.tl-roles [data-k="RST"]');await w(400);T('a role opens with its clips from positions.json',/Clips \(13\)/i.test(await c.innerText('#sheetin')));await shot(c,'phone_roles');
 await c.click('.tl-x');await w(200);
 // error card
 await c.evaluate(()=>{window.vPos=function(){throw new Error('test break');};});await c.click('nav.tabs [aria-label="Library"]');await w(400);
 T('a broken page shows the error card, not a white screen',/This page hit a problem/i.test(await c.innerText('#root'))&&!!(await c.$('nav.tabs')));await shot(c,'phone_error_card');
 await c.click('nav.tabs [aria-label="Today"]');await w(300);T('Today still works after an error',(await H(c))==='#/today');
 const errs=ce.filter(e=>!/test break/.test(e));T('no page errors on the phone'+(errs.length?' '+errs.join(' | '):''),errs.length===0);
 // r90 countdown rail + matchday screen (fresh context so sync cannot clear fixtures)
 {
  const cdState=JSON.parse(JSON.stringify(state));
  const C=await open(b,ph,cdState);
  await C.c.goto('http://localhost:'+PORT+'/coach/index.html#/today');await w(1200);
  await C.c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();const el=document.getElementById('tl-md');if(el)el.remove();});
  const cdInfo=await C.c.evaluate(()=>({tlcd:!!window.TLCD,rail:!!document.querySelector('.tl-cd-rail'),items:document.querySelectorAll('.tl-cd-item').length,coming:/Coming up/.test((document.getElementById('root')||{}).innerText||''),hasCdJs:!!document.querySelector('script[src*="cd.js"]'),snip:((document.getElementById('root')||{}).innerText||'').slice(0,180)}));
  if(!cdInfo.rail)console.log('countdown debug',JSON.stringify(cdInfo));
  T('Today shows the countdown rail',!!(await C.c.$('.tl-cd-rail'))&&(await C.c.$$('.tl-cd-item')).length>=1);await shot(C.c,'phone_countdown');
  T('countdown items have a live timer',await C.c.evaluate(()=>[...document.querySelectorAll('.tl-cd-rail [data-cd-until]')].length>=1));
  await C.c.evaluate(()=>{const td=new Date();const iso=td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');localStorage.removeItem('tl.md.shown.'+iso);if(window.TLCD){const g={id:'mcd',opp:'Countdown FC',date:iso,ko:'15:00',ha:'H',venue:'Christopher Park'};TLCD.showMatchday(g,{role:'coach',who:'Tim',coach:true,force:true});}});
  await w(400);
  T('matchday screen greets the coach by first name',await C.c.evaluate(()=>{const el=document.getElementById('tl-md');return !!(el&&/Morning, Tim|Afternoon, Tim|Evening, Tim/.test(el.innerText));}));
  T('matchday screen has kick off, kit and animation link',await C.c.evaluate(()=>{const t=document.getElementById('tl-md')&&document.getElementById('tl-md').innerText||'';return /Kick off/.test(t)&&/Kit:/.test(t)&&!!document.querySelector('#tl-md a[href*="anim"]');}));
  await shot(C.c,'phone_matchday');
  await C.c.evaluate(()=>{const b=document.getElementById('tl-md-go');if(b)b.click();});await w(500);
  T('Let\'s go dismisses the matchday screen',!(await C.c.$('#tl-md')));
  await C.c.evaluate(()=>{const td=new Date();const iso=td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');localStorage.removeItem('tl.md.shown.'+iso);if(window.TLCD){TLCD.showMatchday({id:'mcd',opp:'Countdown FC',date:iso,ko:'15:00',ha:'H',venue:'Christopher Park'},{role:'parent',force:true});}});
  await w(300);
  T('family matchday reminds them to check the player card',await C.c.evaluate(()=>{const el=document.getElementById('tl-md');if(!el)return false;const t=el.innerText||'';return /Match morning/.test(t)&&/player card/i.test(t)&&!!document.getElementById('tl-md-card')&&!/number \d/.test(t);}));
  T('family matchday has Running late and meet-by chip',await C.c.evaluate(()=>{const el=document.getElementById('tl-md');if(!el)return false;return !!el.querySelector('[data-cd-late]')&&!!el.querySelector('.tl-meet-chip')&&/Meet by 14:30/.test(el.innerText);}));
  await shot(C.c,'phone_matchday_family');
  // Running late picker + offline + offline + offline + offline
  await C.c.evaluate(()=>{window.tlLateNum=function(){return '7';};window.__lateSent=[];window.tlLateSend=function(row){window.__lateSent.push(row);return Promise.resolve({ok:true});};});
  await C.c.click('#tl-md [data-cd-late]');await w(300);
  T('Running late opens minutes picker',!!(await C.c.$('#tl-late-sheet'))&&await C.c.evaluate(()=>[...document.querySelectorAll('#tl-late-sheet [data-late-mins]')].map(b=>b.getAttribute('data-late-mins')).join(',')==='5,10,15,20+'));
  await shot(C.c,'phone_late_picker');
  await C.c.click('#tl-late-sheet [data-late-mins="10"]');await w(400);
  T('picking 10 mins queues a shirt-number late notice',await C.c.evaluate(()=>{const a=window.TLCD.getActive((()=>{const td=new Date();return td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');})(),'mcd');const sent=window.__lateSent||[];return !!(a&&a.num==='7'&&String(a.mins)==='10'&&sent[0]&&sent[0].num==='7'&&sent[0].op==='set'&&!/Sam|family|Test/.test(JSON.stringify(sent[0])));}));
  T('Undo late notice is one tap on the matchday screen',await C.c.evaluate(()=>!!document.querySelector('#tl-md [data-late-undo]')));
  await C.c.click('#tl-md [data-late-undo]');await w(300);
  T('undo clears the active late notice and sends undo',await C.c.evaluate(()=>{const td=new Date();const iso=td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');const a=window.TLCD.getActive(iso,'mcd');const sent=window.__lateSent||[];return !a&&sent.some(x=>x.op==='undo'&&x.num==='7');}));
  // offline queue
  await C.c.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>false});window.__lateSent=[];window.tlLateSend=function(row){window.__lateSent.push(row);return Promise.reject(new Error('offline'));};if(window.TLCD){TLCD.submitLate({num:'7',mins:'15',kind:'game',ref:'mcd',date:(()=>{const td=new Date();return td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');})(),send:window.tlLateSend});}});
  await w(200);
  T('offline late notice stays queued on the phone',await C.c.evaluate(()=>{const q=window.TLCD.readQueue();return q.some(x=>x.num==='7'&&String(x.mins)==='15'&&x.op==='set');}));
  await C.c.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>true});window.__lateSent=[];window.tlLateSend=function(row){window.__lateSent.push(row);return Promise.resolve({ok:true});};return window.TLCD.flushLate(window.tlLateSend);});
  await w(400);
  T('coming back online flushes the late queue',await C.c.evaluate(()=>window.__lateSent.some(x=>x.num==='7'&&String(x.mins)==='15')&&window.TLCD.readQueue().length===0));
  await C.c.evaluate(()=>{const b=document.getElementById('tl-md-go');if(b)b.click();});
  // coach Today / attendance banners (shirt number only)
  globalThis.__LATE_ROWS=[{id:'L1',num:'7',mins:'10',kind:'game',date:_iso,undone:false}];
  await C.c.goto('http://localhost:'+PORT+'/coach/index.html#/today');await w(500);
  await C.c.evaluate((rows)=>{const S=window.TLX.S();S.late=rows;const v=window.TLX.view;v.hub=v.hub||{};v.hub.late=rows;v.hub.at=Date.now();window.TLX.render(true);},[{id:'L1',num:'7',mins:'10',kind:'game',date:_iso,undone:false}]);
  await w(400);
  T('coach Today shows running-late banner with shirt number only',await C.c.evaluate(()=>{const t=(document.getElementById('root')||{}).innerText||'';return /No\. 7 running late, about 10 mins/.test(t)&&!/Alfie|Sam|family/.test((document.querySelector('.tl-late-banner')||{}).innerText||'');}));
  await shot(C.c,'phone_late_coach');
  globalThis.__LATE_ROWS=[{id:'L1',num:'7',mins:'10',kind:'train',date:_iso,undone:false}];
  await C.c.goto('http://localhost:'+PORT+'/coach/index.html#/att/plan');await w(900);
  await C.c.evaluate((rows)=>{const S=window.TLX.S();S.late=rows;const v=window.TLX.view;v.hub=v.hub||{};v.hub.late=rows;v.hub.at=Date.now();window.TLX.render(true);},[{id:'L1',num:'7',mins:'10',kind:'train',date:_iso,undone:false}]);
  await w(400);
  T('attendance marks shirt 7 as late',await C.c.evaluate(()=>{const b=document.querySelector('.tl-att [data-id="p6"]');return !!(b&&/late ~10m/.test(b.innerText));}));
  await shot(C.c,'phone_late_attendance');
  // r90 niggle flag on attendance by shirt number
  await C.c.evaluate((iso)=>{const S=window.TLX.S();S.niggle=[{id:'N1',num:'7',areas:['hamstrings'],date:iso,at:Date.now()}];const v=window.TLX.view;v.hub=v.hub||{};v.hub.niggle=S.niggle;v.hub.at=Date.now();window.TLX.render(true);},_iso);
  await w(400);
  T('attendance marks shirt 7 with niggle',await C.c.evaluate(()=>{const b=document.querySelector('.tl-att [data-id="p6"]');const ban=(document.querySelector('.tl-niggle-banner')||{}).innerText||'';return !!(b&&/niggle/i.test(b.innerText))||/No\. 7:/.test(ban);}));
  await shot(C.c,'phone_niggle_attendance');

  // meet-by always 30 mins before KO
  T('meetBy is always 30 minutes before kick off',await C.c.evaluate(()=>window.TLCD.meetBy('15:00')==='14:30'&&window.TLCD.meetBy('10:05')==='09:35'&&window.TLCD.meetBy('15:00','14:00')==='14:00'));
  T('rail shows absolute UK date/time line',await C.c.evaluate(()=>{document.querySelector('nav.tabs [aria-label="Today"]')&&document.querySelector('nav.tabs [aria-label="Today"]').click();return true;}));
  await C.c.goto('http://localhost:'+PORT+'/coach/index.html#/today');await w(900);
  T('countdown rail has relative and absolute times',await C.c.evaluate(()=>!!document.querySelector('.tl-cd-left[data-cd-until]')&&!!document.querySelector('.tl-cd-abs')));
  await C.cc.close();
 }
 // family page: Running late on home matchday card (shirt number only, no family-to-family)
 {
  const F=await b.newContext({...ph});
  const fp=await F.newPage();const fe=[];fp.on('pageerror',e=>fe.push(String(e.message)));
  const todayIso=_iso;
  await fp.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
   const H={'access-control-allow-origin':'*'};const ok=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
   if(a.action==='f.home')return ok({first:'Sam',role:'parent',num:'7',mine:{},rsn:{},x:{fixtures:[{id:'g1',opp:'Late FC',date:todayIso,ko:'15:00',ha:'H',venue:'Christopher Park'}],posts:[]},posts:[{type:'train',date:todayIso,time:'19:00',title:'Training',place:'Chris Park',id:'t1'}],res:[],tips:[],vote:{}});
   if(a.action==='f.child')return ok({num:'7',first:'Lad'});
   if(a.action==='f.late'||a.action==='f.late.undo'){globalThis.__FAM_LATE=(globalThis.__FAM_LATE||[]).concat([a]);return ok({ok:true,sent:1,id:a.id||'Lx'});}
   return ok({});});
  await fp.addInitScript(()=>{const _g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return /^fam\.wel\./.test(k)?'1':_g.call(this,k);};localStorage.setItem('fam.code','PARENT');localStorage.setItem('fam.ok1','1');});
  await fp.goto('http://localhost:'+PORT+'/family.html');await w(1800);
  await fp.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();const md=document.getElementById('tl-md');if(md)md.remove();});
  await w(400);
  const famDbg=await fp.evaluate(()=>({hasD:!!window.D||!!document.querySelector('header .tag'),card:!!document.querySelector('.card.today.md'),late:!!document.querySelector('.card.today.md [data-cd-late]'),meet:!!document.querySelector('.tl-meet-chip'),snip:((document.getElementById('root')||{}).innerText||'').slice(0,220),err:((window.__fe)||[]).slice()}) );
  if(!famDbg.late)console.log('family late debug',JSON.stringify(famDbg));
  T('family home shows Running late on match day card',!!(famDbg.card&&famDbg.late&&famDbg.meet));
  await shot(fp,'phone_family_late_card');
  await fp.evaluate(()=>{window.__famLate=[];const orig=window.tlLateSend;window.tlLateSend=function(row){window.__famLate.push(row);return orig?orig(row):Promise.resolve();};});
  await fp.click('.card.today.md [data-cd-late]');await w(300);
  T('family late picker has 5/10/15/20+',await fp.evaluate(()=>[...document.querySelectorAll('#tl-late-sheet [data-late-mins]')].map(b=>b.getAttribute('data-late-mins')).join(',')==='5,10,15,20+'));
  await fp.click('#tl-late-sheet [data-late-mins="10"]');await w(600);
  T('family late send uses shirt number 7 only',await fp.evaluate(()=>{const row=(window.__famLate||[])[0];return !!(row&&row.num==='7'&&String(row.mins)==='10'&&!row.name);}));
  T('family page has no family-to-family late messaging UI',await fp.evaluate(()=>!/told other families|message families|tell parents/i.test(document.body.innerText||'')&&!!document.querySelector('[data-late-undo], .card.today.md')));
  T('no page errors on family late'+(fe.length?' '+fe.join(' | '):''),fe.length===0);
  await F.close();
 }
 await c.goto('http://localhost:'+PORT+'/coach/index.html#/shop');await w(900);
 T('Club shop shows winter coats rail',!!(await c.$('.tl-shop-rail'))&&(await c.$$('.tl-shop-rail .tl-shop-card')).length>=7);
 T('Club shop More tile exists',true);await shot(c,'phone_shop');
 await cc.close();
 // live match: no reload, Update ready button instead
 const live=JSON.parse(JSON.stringify(state));live.matches.m1={id:'m1',opp:'Test FC',date:'2026-11-07',ko:'10:30',ha:'H',formation:'352',half:35,avail:{},lineup:{},status:'live',period:1,clock:{acc:0,running:false,t0:0},stints:{},events:[],ratings:{},updatedAt:1};
 const L=await open(b,ph,live);let loads=0;L.c.on('load',()=>loads++);VER='91';
 await L.c.evaluate(()=>window.tlCheckUpdate());await w(1500);
 T('during a live match an update shows Update ready and does not reload',loads===0&&!!(await L.c.$('#tl-upd')));await shot(L.c,'phone_update_ready');
 await L.cc.close();VER='90';
 // PC
 const pc=await open(b,{viewport:{width:1366,height:800},deviceScaleFactor:1,isMobile:false,hasTouch:false});
 const nb=await pc.c.$eval('nav.tabs',e=>e.getBoundingClientRect());T('on a PC the tabs are a side rail',nb.left===0&&nb.width<120&&nb.height>700);await shot(pc.c,'pc_today');
 await pc.c.click('header.tl-top [aria-label="More"]');await w(400);await shot(pc.c,'pc_more');
 await pc.c.goto(`http://localhost:${PORT}/coach/index.html#/att/plan`);await w(900);await shot(pc.c,'pc_attendance');
 await pc.c.goto(`http://localhost:${PORT}/coach/index.html#/roles/lib`);await w(1200);await shot(pc.c,'pc_roles');
 await pc.c.goto(`http://localhost:${PORT}/coach/index.html#/today`);await w(900);await shot(pc.c,'pc_countdown');
 globalThis.__LATE_ROWS=[{id:'L1',num:'7',mins:'10',kind:'game',date:_iso,undone:false}];await pc.c.evaluate((rows)=>{const S=window.TLX.S();S.late=rows;const v=window.TLX.view;v.hub=v.hub||{};v.hub.late=rows;v.hub.at=Date.now();window.TLX.render(true);},[{id:'L1',num:'7',mins:'10',kind:'game',date:_iso,undone:false}]);await w(400);await shot(pc.c,'pc_late_coach');
 await pc.c.goto(`http://localhost:${PORT}/coach/index.html#/shop`);await w(900);await shot(pc.c,'pc_shop');
 T('Club shop on PC has coats and hats',(await pc.c.$$('.tl-shop-rail .tl-shop-card')).length>=7&&(await pc.c.$$('.tl-shop-grid .tl-shop-card')).length>=4);
 T('no page errors on the PC',pc.ce.length===0);await pc.cc.close();
 // service worker busters all match
 const sw=fs.readFileSync(path.join(root,'coach/sw.js'),'utf8'),idx=fs.readFileSync(path.join(root,'coach/index.html'),'utf8');
 const vs=[...sw.matchAll(/\?v=(\d+)/g)].map(m=>m[1]),vi=[...idx.matchAll(/\.(?:js|css)\?v=(\d+)/g)].map(m=>m[1]);
 T('sw.js precache and index.html busters all match ('+[...new Set(vs.concat(vi))]+')',new Set(vs.concat(vi)).size===1);
 T('sw.js has no 3.5s navigation race',!/3500/.test(sw));
 await b.close();srv.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);})().catch(e=>{console.error(e);process.exit(1);});
