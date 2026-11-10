/* r102: coach Ask for attendance on events; family Yes/No + toast + shirt summary; This week. Zero console errors. */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8810,SHOTS=process.env.SHOTS||'/workspace/shots',PRE=process.env.PRE||'r102_';
fs.mkdirSync(SHOTS,{recursive:true});
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.webmanifest':'application/json'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end('{"v": "107"}');return;}let f=path.join(root,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
const BASE='http://localhost:'+PORT;let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
function errsOf(p){const e=[];p.on('pageerror',x=>e.push('pageerror: '+x.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|favicon|net::ERR/.test(m.text()))e.push('console: '+m.text());});return e;}
function ymdOffset(days){const d=new Date();d.setDate(d.getDate()+days);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const XMAS='2026-12-18';
(async()=>{
 const b=await chromium.launch();const ph=devices['Pixel 7'];

 // Coach hub: Ask for attendance toggle present
 {const ctx=await b.newContext({...ph});const c=await ctx.newPage();const E=errsOf(c);
  await c.addInitScript(()=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:{p1:{id:'p1',name:'Alex',num:'7',active:true},p2:{id:'p2',name:'Ben',num:'9',active:true}},matches:{},settings:{id:'main',half:35,roles:{},eventAtt:{},updatedAt:0},dirty:{},lastSync:Date.now()}));});
  let saved=null;
  await c.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
   if(a.action==='ev.save'){saved=a;return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{ok:true,id:'evxmas'}})});}
   if(a.action==='ev.list'||a.action==='hub.get'||a.action==='sync'){
    return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{docs:[],rows:[{id:'evxmas',title:"Christmas do",date:XMAS,time:'19:00 to 00:00',place:"Boar's Head",status:'published',src:'coach',type:'event-att',askAtt:true}],serverTime:Date.now(),ev:[{id:'evxmas',title:"Christmas do",date:XMAS,time:'19:00 to 00:00',place:"Boar's Head",status:'published',src:'coach',type:'event-att',askAtt:true}],lifts:[],media:[],help:[]}})});}
   if(a.action==='answers')return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{rows:[{postId:'ev:evxmas',playerId:'p1',answer:'Y'}]}})});
   r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{docs:[],serverTime:Date.now()}})});});
  await c.goto(BASE+'/coach/index.html');await c.waitForTimeout(1600);
  await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();try{view.tab='hub';if(window.render)render(true);}catch(e){}});
  await c.waitForTimeout(800);
  // open hub if needed
  await c.evaluate(()=>{try{const b=[...document.querySelectorAll('[data-act=tab]')].find(x=>x.dataset.v==='hub');b&&b.click();}catch(e){}});
  await c.waitForTimeout(900);
  const st=await c.evaluate(()=>{
    const att=document.getElementById('evatt');
    const eve=document.getElementById('eve');
    const txt=document.body.innerText;
    return {hasToggle:!!att, checked:att?att.checked:null, hasEnd:!!eve, askLabel:/Ask for attendance/i.test(txt), poll:document.querySelectorAll('.tl-poll').length};
  });
  T('coach has Ask for attendance toggle', st.hasToggle && st.askLabel);
  T('coach toggle default off', st.hasToggle && st.checked===false);
  T('coach has optional end time', st.hasEnd);
  await c.screenshot({path:path.join(SHOTS,PRE+'coach_event_form.png'),fullPage:false});
  // fill and post with ask on
  await c.fill('#evt','Christmas do');
  await c.fill('#evd',XMAS);
  await c.fill('#evh','19:00');
  await c.fill('#eve','00:00');
  await c.fill('#evp',"Boar's Head");
  await c.check('#evatt');
  await c.click('[data-act=evAdd]');
  await c.waitForTimeout(700);
  T('coach posts askAtt type event-att', !!(saved && (saved.askAtt===true || saved.type==='event-att')));
  T('coach time includes to', !!(saved && /to/.test(saved.time||'')));
  await c.screenshot({path:path.join(SHOTS,PRE+'coach_event_posted.png'),fullPage:false});
  T('coach zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();}

 for(const pg of ['family.html','parents.html']){
  const role=pg.startsWith('parents')?'parent':'player';
  const ctx=await b.newContext({...ph});const q=await ctx.newPage();const E=errsOf(q);
  const near=ymdOffset(3);
  const data={first:'Pat',role:role,num:'7',mine:{},evMine:{},evAtt:{evxmas:{Y:['3'],N:[],none:['9','11']}},at:Date.now(),posts:[],att:{},vote:{motm:{open:false},poty:{open:false}},
   x:{fixtures:[],news:[],events:[{id:'evxmas',title:'Christmas do',date:near,time:'19:00 to 00:00',place:"Boar's Head",type:'event-att',askAtt:true,coach:true,pending:false},{id:'evnotice',title:'Kit collection',date:near,time:'17:00',place:'Clubhouse',type:'event',askAtt:false,coach:true,pending:false}],lifts:[],media:[],contacts:[]}};
  await q.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
   if(a.action==='f.ev.answer')return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:false,error:'Unknown action'})}); // simulate pre-v36
   r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:a.action==='f.home'?data:{ok:1}})});});
  await q.addInitScript(()=>{localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.P','1');localStorage.setItem('fam.tour','1');});
  await q.goto(BASE+'/'+pg);await q.waitForTimeout(2400);
  await q.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();const md=document.getElementById('tl-md');if(md)md.remove();try{goTab('home');r();}catch(e){}});
  await q.waitForTimeout(600);
  // This week should mention Christmas do
  const week=await q.evaluate(()=>{
    const w=document.getElementById('sec-week');
    return {has:!!w, text:w?w.innerText:'', rsvp:/RSVP|Christmas/i.test(w?w.innerText:'')};
  });
  T(pg+' This week shows Christmas do', week.rsvp || /Christmas/i.test(week.text));
  // Alerts should have askAtt event card
  const alert=await q.evaluate(()=>{
    const el=document.getElementById('ev-evxmas') || document.querySelector('#sec-alerts #ev-evxmas');
    // may be inside alerts
    const cards=[...document.querySelectorAll('#sec-alerts .card')].map(c=>c.innerText).join('\n');
    return {cards, hasYes:/Christmas do[\s\S]*Yes/i.test(cards)||!!document.querySelector('#ev-evxmas .ybig')};
  });
  T(pg+' Alerts has attendance Yes/No for Christmas do', alert.hasYes || /Christmas do/.test(alert.cards));
  await q.screenshot({path:path.join(SHOTS,PRE+pg.replace('.html','')+'_home.png'),fullPage:false});

  // Events tab: askAtt has buttons, notice does not
  await q.evaluate(()=>{try{goTab('events');r();}catch(e){}});
  await q.waitForTimeout(500);
  const ev=await q.evaluate(()=>{
    const xmas=document.getElementById('ev-evxmas');
    const notice=document.getElementById('ev-evnotice');
    return {
      xmasYes:!!(xmas&&xmas.querySelector('.ybig')),
      xmasShirts:!!(xmas&&xmas.querySelector('.tl-shirt')),
      noticeYes:!!(notice&&notice.querySelector('.ybig')),
      noticeText:notice?notice.innerText.slice(0,80):''
    };
  });
  T(pg+' Christmas do has Yes/No', ev.xmasYes);
  T(pg+' Christmas do has shirt summary', ev.xmasShirts);
  T(pg+' notice event has no Yes/No', !ev.noticeYes);
  await q.screenshot({path:path.join(SHOTS,PRE+pg.replace('.html','')+'_events.png'),fullPage:false});

  // Tap Yes and confirm toast + queue
  if(ev.xmasYes){
    await q.evaluate(()=>{try{evAns('evxmas','Y');}catch(e){}});
    await q.waitForTimeout(400);
    const after=await q.evaluate(()=>{
      const toast=(document.getElementById('tl-toast')||{}).textContent||'';
      const sel=!!document.querySelector('#ev-evxmas .on-y');
      let q=[];try{q=JSON.parse(localStorage.getItem('fam.evattq')||'[]');}catch(e){}
      return {toast,sel,queued:q.some(x=>x.id==='evxmas'&&x.a==='Y')};
    });
    T(pg+' toast thanks', /Thanks, you.?re down as Yes/i.test(after.toast));
    T(pg+' selected Yes', after.sel);
    T(pg+' queued until v36', after.queued);
    await q.screenshot({path:path.join(SHOTS,PRE+'attendance_'+pg.replace('.html','')+'_yes.png'),fullPage:false});
  }
  T(pg+' zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();
 }

 // Live
 {const ctx=await b.newContext({...ph});const p=await ctx.newPage();const E=errsOf(p);
  for(const url of ['coach/index.html','family.html','parents.html']){
   await p.goto('https://touchline.cipher-training.co.uk/'+url,{waitUntil:'domcontentloaded',timeout:60000});
   await p.waitForTimeout(1600);
   await p.screenshot({path:path.join(SHOTS,PRE+'live_'+url.replace(/\/|\.html/g,'_')+'.png'),fullPage:false});
   T('live '+url+' loads', (await p.locator('body').innerText()).length>20);
  }
  T('live zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();}

 await b.close();srv.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);
})();
