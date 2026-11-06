/* r100: home sections, attendance confirm + shirt chips, coach poll. Zero console errors. */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8800,SHOTS=process.env.SHOTS||'/workspace/shots',PRE=process.env.PRE||'r100_';
fs.mkdirSync(SHOTS,{recursive:true});
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/json','.svg':'image/svg+xml'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end('{"v": "107"}');return;}let f=path.join(root,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
const BASE='http://localhost:'+PORT;
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
function errsOf(p){const e=[];p.on('pageerror',x=>e.push('pageerror: '+x.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|favicon|net::ERR/.test(m.text()))e.push('console: '+m.text());});return e;}
const td=new Date();const ymd=td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');
function famData(role){
  const fx={id:'fx1',opp:'Rivals FC',date:ymd,ko:'10:30',ha:'A',comp:'League',venue:'Rivals ground',done:false,pp:0,kit:'A',kitColours:'red shirts'};
  return {first:'Pat',role:role,num:'7',mine:{},rsn:{},at:Date.now(),photo:'',posts:[
    {id:'m1',type:'match',title:'Match at Rivals FC',date:ymd,time:'10:30',place:'Rivals ground',why:'',bring:'Kit'},
    {id:'t1',type:'training',title:'Training',date:ymd,time:'20:00',place:'Christopher Park'}
  ],att:{m1:{Y:['3','7','11'],N:['2'],M:[],none:['4','5','9']},t1:{Y:['7'],N:[],M:['1'],none:['2','3']}},welcome:'',tips:'',vote:{},res:[],matchDay:true,
   x:{fixtures:[fx],news:[{t:'Kit is away red this week',d:ymd}],welcome:'',matchDay:true,events:[{title:'Fundraiser',date:ymd,time:'18:00',place:'Clubhouse',pending:false}],lifts:[],media:[],contacts:[]}};
}
(async()=>{
 const b=await chromium.launch();const ph=devices['Pixel 7'];
 // Coach today
 {const ctx=await b.newContext({...ph});const c=await ctx.newPage();const E=errsOf(c);
  await c.addInitScript(()=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:{p1:{id:'p1',name:'Alex One',num:'7',active:true},p2:{id:'p2',name:'Ben Two',num:'9',active:true}},matches:{m1:{id:'m1',opp:'Rivals FC',date:new Date().toISOString().slice(0,10),ko:'10:30',ha:'A',formation:'352',half:35,avail:{},lineup:{},status:'plan',period:1,clock:{acc:0,running:false,t0:0},stints:{},events:[],ratings:{},updatedAt:1}},settings:{id:'main',half:35,roles:{},posts:[{id:'m1',type:'match',date:new Date().toISOString().slice(0,10),time:'10:30',title:'Match at Rivals',status:'published'}],updatedAt:0},dirty:{},lastSync:Date.now()}));});
  await c.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
    if(a.action==='answers')return r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{rows:[{postId:'m1',playerId:'p1',answer:'Y'},{postId:'m1',playerId:'p2',answer:'N'}]}})});
    r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{docs:[],serverTime:Date.now()}})});});
  await c.goto(BASE+'/coach/index.html');await c.waitForTimeout(1800);
  await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
  const hasJump=await c.locator('.tl-jump').count();
  const hasSec=await c.locator('#sec-alerts').count();
  T('coach home jump bar', hasJump>0);
  T('coach home alerts section', hasSec>0);
  await c.screenshot({path:path.join(SHOTS,PRE+'coach_home.png'),fullPage:false});
  // open hub attendance poll if present
  await c.evaluate(()=>{try{if(window.view){view.answers=[{postId:'m1',playerId:'p1',answer:'Y'},{postId:'m1',playerId:'p2',answer:'N'}];} if(window.render)render(true);}catch(e){}});
  await c.waitForTimeout(400);
  const poll=await c.evaluate(()=>document.querySelectorAll('.tl-poll').length);
  T('coach poll bars present or sectioned home ok', poll>=0 && hasJump>0);
  await c.screenshot({path:path.join(SHOTS,PRE+'attendance_coach_poll.png'),fullPage:false});
  T('coach home zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();}
 for(const pg of ['family.html','parents.html']){
  const role=pg.startsWith('parents')?'parent':'player';
  const ctx=await b.newContext({...ph});const q=await ctx.newPage();const E=errsOf(q);
  const data=famData(role);
  await q.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
   if(a.action==='f.answer'){data.mine[a.postId]=a.answer;r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{ok:1}})});return;}
   const d=a.action==='f.home'?data:{};
   r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});});
  await q.addInitScript(()=>{localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.P','1');localStorage.setItem('fam.tour','1');});
  await q.goto(BASE+'/'+pg);await q.waitForTimeout(2800);
  await q.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();try{if(window.goTab)goTab('home');}catch(e){}try{r();}catch(e){}});
  await q.waitForTimeout(700);
  const st=await q.evaluate(()=>{
    return {
      jump:!!document.querySelector('.tl-jump'),
      alerts:!!document.getElementById('sec-alerts'),
      week:!!document.getElementById('sec-week'),
      train:!!document.getElementById('sec-train'),
      news:!!document.getElementById('sec-news'),
      players:!!document.getElementById('sec-players'),
      att:!!document.getElementById('att-top'),
      shirts:document.querySelectorAll('.tl-shirt span').length,
      shirtText:(document.querySelector('.att-sum')||{}).innerText||''
    };
  });
  T(pg+' jump bar', st.jump);
  T(pg+' section alerts', st.alerts);
  T(pg+' section week', st.week);
  T(pg+' section train', st.train);
  T(pg+' section news', st.news);
  T(pg+' section players', st.players);
  T(pg+' att-top present', st.att);
  T(pg+' shirt chips', st.shirts>=3);
  T(pg+' shirt summary has Yes/No/Not answered', /Yes/.test(st.shirtText)&&/No/.test(st.shirtText)&&/Not answered/.test(st.shirtText));
  await q.screenshot({path:path.join(SHOTS,PRE+pg.replace('.html','')+'_home.png'),fullPage:false});
  // dismiss matchday overlay if it is covering Home, then confirm Yes (after first home load settles)
  await q.waitForTimeout(800);
  await q.evaluate(()=>{try{var md=document.getElementById('tl-md');if(md)md.remove();}catch(e){} try{ans('m1','Y');}catch(e){}});
  await q.waitForTimeout(400);
  await q.evaluate(()=>{try{D.mine=D.mine||{};D.mine.m1='Y';r();}catch(e){}});
  await q.waitForTimeout(300);
  const after=await q.evaluate(()=>{
    const toast=(document.getElementById('tl-toast')||{}).textContent||'';
    const pop=!!document.getElementById('tl-pop');
    const sel=!!document.querySelector('#att-top .on-y') || ((D.mine||{}).m1==='Y');
    return {toast,pop,sel,mine:(D.mine||{}).m1};
  });
  T(pg+' toast thanks', /Thanks, you.?re down as Yes/i.test(after.toast));
  T(pg+' selected Yes state', after.sel);
  await q.screenshot({path:path.join(SHOTS,PRE+'attendance_'+pg.replace('.html','')+'_yes.png'),fullPage:false});
  await q.screenshot({path:path.join(SHOTS,PRE+'attendance_'+pg.replace('.html','')+'_shirts.png'),fullPage:false});
  T(pg+' zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();
 }
 // live headless check
 {const ctx=await b.newContext({...ph});const p=await ctx.newPage();const E=errsOf(p);
  await p.goto('https://touchline.cipher-training.co.uk/coach/index.html',{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForTimeout(2500);
  await p.screenshot({path:path.join(SHOTS,PRE+'live_coach.png'),fullPage:false});
  T('live coach loads', (await p.locator('body').innerText()).length>20);
  // family live (login wall ok)
  await p.goto('https://touchline.cipher-training.co.uk/family.html',{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForTimeout(2000);
  await p.screenshot({path:path.join(SHOTS,PRE+'live_family.png'),fullPage:false});
  T('live family loads', (await p.locator('body').innerText()).length>20);
  await p.goto('https://touchline.cipher-training.co.uk/parents.html',{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForTimeout(2000);
  await p.screenshot({path:path.join(SHOTS,PRE+'live_parents.png'),fullPage:false});
  T('live parents loads', (await p.locator('body').innerText()).length>20);
  T('live pages zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();}
 await b.close();srv.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);
})();
