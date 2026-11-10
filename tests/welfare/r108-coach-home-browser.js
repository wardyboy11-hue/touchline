/* r108: compact coach Today (Today, Coming up, Players voice, Things to do, then the rest folded) and the parent and player Turn on alerts prompt. Fake backend, nothing real is touched. */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8808,SHOTS=process.env.SHOTS||'/workspace/shots',PRE=process.env.PRE||"r108_";
fs.mkdirSync(SHOTS,{recursive:true});
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/json','.svg':'image/svg+xml'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end('{"v": "108"}');return;}let f=path.join(root,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
const BASE='http://localhost:'+PORT;
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
function errsOf(p){const e=[];p.on('pageerror',x=>e.push('pageerror: '+x.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|favicon|net::ERR/.test(m.text()))e.push('console: '+m.text());});return e;}
const day=process.env.DAY||'2026-11-11',ONLY=process.env.ONLY||'';
const fakeDate=`(()=>{const T=new Date('${day}T17:30:00').getTime(),D0=Date.now(),R=Date;class FD extends R{constructor(...a){if(a.length)super(...a);else super(T+(R.now()-D0));}static now(){return T+(R.now()-D0);}}window.Date=FD;})()`;
const SENT=[];
const VOICE=[{id:'v1',kind:'q',status:'new',text:'Can we do more shooting at training? We never get to finish in the box.\nAlso can we have music',who:''},
 {id:'v2',kind:'pq',status:'new',text:'What time do we need to be there on Sunday for the away game?',who:'Parent of #9'},
 {id:'v3',kind:'q',status:'read',text:'Who is in goal if our keeper is ill?',who:''},
 {id:'v4',kind:'q',status:'answered',text:'Is training on in the rain?',who:'',answer:'Yes, unless the pitch is shut.'},
 {id:'v5',kind:'xi',status:'new',form:'352',xi:[],why:'Pace up top'}];
function coachState(){return {ideas:{},players:{p1:{id:'p1',name:'Alex One',num:'7',active:true},p2:{id:'p2',name:'Ben Two',num:'9',active:true}},
 matches:{t1:{id:'t1',opp:'Training',comp:'Training',kind:'train',date:'2026-11-11',ko:'20:00',venue:'Christopher Park',status:'plan',avail:{},lineup:{},stints:{},events:[],ratings:{},updatedAt:1},
  m1:{id:'m1',opp:'Rivals FC',date:'2026-11-15',ko:'10:30',ha:'A',formation:'352',half:35,avail:{},lineup:{},status:'plan',period:1,clock:{acc:0,running:false,t0:0},stints:{},events:[],ratings:{},updatedAt:1}},
 settings:{id:'main',half:35,roles:{},posts:[{id:'p1',type:'training',date:'2026-11-11',time:'20:00',title:'Training',status:'published'},{id:'p2',type:'match',date:'2026-11-15',time:'10:30',title:'Match at Rivals',status:'published'}],updatedAt:0},dirty:{},lastSync:Date.now()};}
(async()=>{
 const b=await chromium.launch();const ph=devices['Pixel 7'];
 if(!ONLY||ONLY==='coach'){const ctx=await b.newContext({...ph});const c=await ctx.newPage();const E=errsOf(c);
  await c.addInitScript(fakeDate);
  await c.addInitScript(st=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',JSON.stringify(st));},coachState());
  await c.route('**/touchline-push.wardyboy11.workers.dev/**',r=>{SENT.push(r.request().url());r.fulfill({status:200,contentType:'application/json',headers:H,body:'{"ok":true,"sent":0,"total":0}'});});
  await c.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
    const D={'voice.list':{rows:VOICE},'push.stats':{squad:16,on:12,missing:[{num:'4',name:'Sam'},{num:'11',name:'Joe'},{num:'14',name:'Kai'},{num:'19',name:'Max'}]}}[a.action]||{rows:[],docs:[],serverTime:Date.now()};
    r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:D})});});
  await c.goto(BASE+'/coach/index.html');await c.waitForTimeout(2500);
  await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
  await c.waitForTimeout(500);
  await c.screenshot({path:path.join(SHOTS,PRE+'coach_today.png'),fullPage:false});
  await c.screenshot({path:path.join(SHOTS,PRE+'coach_today_full.png'),fullPage:true});
  if(!process.env.BEFORE){
   const st=await c.evaluate(()=>{const ids=[...document.querySelectorAll('#main details.tl-sec, details.tl-sec')].map(d=>d.id);const sm=id=>{const d=document.getElementById(id);return d?d.querySelector('summary').innerText.replace(/\s+/g,' ').trim():'';};
     return {ids,open:[...document.querySelectorAll('details.tl-acc')].filter(d=>d.open).map(d=>d.id),today:sm('sec-today'),coming:sm('sec-coming'),voice:sm('sec-voice'),todo:sm('sec-todo'),rail:document.querySelectorAll('.tlcd-rail,.tl-cd-rail,[class*="tlcd"]').length};});
   console.log(JSON.stringify(st));
   T('first four sections in order', st.ids.slice(0,4).join()==='sec-today,sec-coming,sec-voice,sec-todo');
   T('all compact on first open', st.open.length===0);
   T('today is one line: training 20:00 to 21:00', /Training 20:00 to 21:00/.test(st.today));
   T('today offers the session send', /Session ready: send to players/.test(st.today));
   T('coming up one line', /This week: 1 training, 1 match/.test(st.coming));
   T('players voice counts', /2 new, 3 unanswered/.test(st.voice));
   T('no countdown carousel on Today', st.rail===0);
   T('ref fees due from the 1st', /ref fees/i.test(await c.evaluate(()=>document.getElementById('sec-todo').innerText)));
   T('old cards still there, folded', st.ids.length>=6);
   await c.evaluate(()=>{['sec-today','sec-voice','sec-todo'].forEach(id=>{document.getElementById(id).open=true;});});
   await c.waitForTimeout(300);
   const vt=await c.evaluate(()=>document.getElementById('sec-voice').innerText);
   T('voice shows first line only', /Can we do more shooting at training\?/.test(vt)&&!/music/.test(vt));
   T('voice has Open all', /Open all/.test(vt));
   await c.screenshot({path:path.join(SHOTS,PRE+'coach_today_open.png'),fullPage:true});
   // ref fees tick for this month
   await c.evaluate(()=>{const x=document.querySelector('[data-act="todoRef"]');x&&x.click();});await c.waitForTimeout(300);
   const ref=await c.evaluate(()=>({st:window.__tlTest(S=>(S.settings.todo||{}).ref),txt:document.getElementById('sec-todo').innerText}));
   T('ref fees ticked for November', ref.st&&ref.st['2026-11']);
   // forum item
   await c.evaluate(()=>{document.getElementById('sec-todo').open=true;document.querySelector('#sec-todo .tl-forum').open=true;});
   await c.fill('#tf_t','County cup draw Thursday');await c.fill('#tf_n','Need a manager at the meeting');await c.selectOption('#tf_w','Deano');
   await c.evaluate(()=>document.querySelector('[data-act="todoForumAdd"]').click());await c.waitForTimeout(300);
   const fo=await c.evaluate(()=>({l:window.__tlTest(S=>((S.settings.todo||{}).forum||[]).length),txt:document.getElementById('sec-todo').innerText}));
   T('forum note added for Deano', fo.l===1&&/County cup draw Thursday/.test(fo.txt)&&/Deano/.test(fo.txt));
   T('alerts on count shown to coach', /12 of 16/.test(fo.txt));
   // open the send flow: nothing is sent
   await c.evaluate(()=>{document.getElementById('sec-today').open=true;});
   await c.evaluate(()=>document.querySelector('[data-act="sessReady"]').click());await c.waitForTimeout(800);
   const pat=await c.evaluate(()=>(document.getElementById('pat')||{}).value||'');
   T('send flow opens Comms with the words ready', /Training 11\/11/.test(pat));
   T('nothing sent without Send', SENT.filter(u=>/\/send/.test(u)).length===0);
   await c.screenshot({path:path.join(SHOTS,PRE+'coach_send_flow.png'),fullPage:false});
   c.once('dialog',dlg=>dlg.dismiss());
   await c.evaluate(()=>document.querySelector('[data-act="pushParents"]').click());await c.waitForTimeout(500);
   T('Cancel on the confirm sends nothing', SENT.filter(u=>/\/send/.test(u)).length===0);
   T('coach zero console errors', E.length===0); if(E.length) console.log(E);
  }
  await ctx.close();}
 if(!ONLY||ONLY==='family'){
 for(const pg of ['family.html','parents.html']){
  const role=pg.startsWith('parents')?'parent':'player';
  const ctx=await b.newContext({...ph});const q=await ctx.newPage();const E=errsOf(q);
  const data={first:'Pat',role:role,num:'7',mine:{},rsn:{},at:Date.now(),photo:'',posts:[],att:{},welcome:'',tips:'',vote:{},res:[],matchDay:false,x:{fixtures:[],news:[],welcome:'',matchDay:false,events:[],lifts:[],media:[],contacts:[]}};
  await q.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:a.action==='f.home'?data:{}})});});
  await q.addInitScript(fakeDate);
  await q.addInitScript(()=>{localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.P','1');localStorage.setItem('fam.tour','1');
    try{Object.defineProperty(Notification,'permission',{get(){return window.__perm||'default';}});Notification.requestPermission=()=>{window.__asked=(window.__asked||0)+1;window.__perm='denied';return Promise.resolve('denied');};}catch(e){}});
  await q.goto(BASE+'/'+pg);await q.waitForTimeout(3500);
  await q.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
  await q.screenshot({path:path.join(SHOTS,PRE+pg.replace('.html','')+'_alerts_prompt.png')});
  if(!process.env.BEFORE){
   const sh=await q.evaluate(()=>{const d=document.getElementById('tl-pushask');return d?d.innerText:'';});
   T(pg+' first open shows Turn on alerts', /Turn on alerts/.test(sh));
   await q.evaluate(()=>document.querySelector('#tl-pushask [data-pa="later"]').click());await q.waitForTimeout(300);
   T(pg+' Not now hides it', !(await q.$('#tl-pushask')));
   await q.reload();await q.waitForTimeout(3500);
   T(pg+' not shown again straight away', !(await q.$('#tl-pushask')));
   await q.evaluate(()=>localStorage.setItem('fam.pushAsk','1'));await q.reload();await q.waitForTimeout(3500);
   if(process.env.DBG)console.log(await q.evaluate(()=>({ask:localStorage.getItem('fam.pushAsk'),now:Date.now(),off:localStorage.getItem('fam.pushOff'),ans:localStorage.getItem('fam.pushAns'),md:!!document.getElementById('tl-md'),perm:Notification.permission})));
   T(pg+' asks again politely later', !!(await q.$('#tl-pushask')));
   await q.evaluate(()=>document.querySelector('#tl-pushask [data-pa="on"]').click());await q.waitForTimeout(800);
   T(pg+' one tap asks the phone', await q.evaluate(()=>window.__asked===1));
   await q.reload();await q.waitForTimeout(3500);
   T(pg+' answered (blocked) so it stops asking', !(await q.$('#tl-pushask')));
   await q.evaluate(()=>{try{goTab('me');}catch(e){}});await q.waitForTimeout(600);
   T(pg+' Me has the alerts switch', /Notifications/.test(await q.evaluate(()=>document.body.innerText)));
   await q.screenshot({path:path.join(SHOTS,PRE+pg.replace('.html','')+'_me_alerts.png')});
   T(pg+' zero console errors', E.length===0); if(E.length) console.log(E);
  }
  await ctx.close();}}
 await b.close();srv.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);
})();
