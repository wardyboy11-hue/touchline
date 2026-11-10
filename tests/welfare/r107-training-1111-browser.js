/* r107: Training 11/11 card lands at the top of Home for players, parents and coaches, and the 3D session page loads with voice files present. */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8807,SHOTS=process.env.SHOTS||'/workspace/shots',PRE=process.env.PRE||"r107_";
fs.mkdirSync(SHOTS,{recursive:true});
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/json','.svg':'image/svg+xml'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end('{"v": "108"}');return;}let f=path.join(root,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
const BASE='http://localhost:'+PORT;
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
function errsOf(p){const e=[];p.on('pageerror',x=>e.push('pageerror: '+x.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|favicon|net::ERR/.test(m.text()))e.push('console: '+m.text());});return e;}
const td=new Date();const ymd=td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');
const day=process.env.DAY||'2026-11-10';
function famData(role){return {first:'Pat',role:role,num:'7',mine:{},rsn:{},at:Date.now(),photo:'',posts:[{id:'t1',type:'training',title:'Training',date:'2026-11-11',time:'19:00',place:'Christopher Park'}],att:{},welcome:'',tips:'',vote:{},res:[],matchDay:false,x:{fixtures:[],news:[],welcome:'',matchDay:false,events:[],lifts:[],media:[],contacts:[]}};}
const fakeDate=`(()=>{const T=new Date('${day}T18:00:00').getTime(),D0=Date.now(),R=Date;class FD extends R{constructor(...a){if(a.length)super(...a);else super(T+(R.now()-D0));}static now(){return T+(R.now()-D0);}}window.Date=FD;})()`;
(async()=>{
 const b=await chromium.launch();const ph=devices['Pixel 7'];
 for(const pg of ['family.html','parents.html']){
  const role=pg.startsWith('parents')?'parent':'player';
  const ctx=await b.newContext({...ph});const q=await ctx.newPage();const E=errsOf(q);const data=famData(role);
  await q.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:a.action==='f.home'?data:{}})});});
  await q.addInitScript(fakeDate);
  await q.addInitScript(()=>{localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.P','1');localStorage.setItem('fam.tour','1');});
  await q.goto(BASE+'/'+pg);await q.waitForTimeout(2800);
  await q.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();try{if(window.goTab)goTab('home');}catch(e){}try{r();}catch(e){}});
  await q.waitForTimeout(700);
  const st=await q.evaluate(()=>{const t=document.getElementById('tonight');const a=t&&t.querySelector('a.btn.pri');const al=document.getElementById('sec-alerts');
    return {card:!!t,inAlerts:!!(al&&t&&al.contains(t)),href:a?a.getAttribute('href'):'',text:t?t.innerText:'',count:document.querySelectorAll('#tonight').length};});
  T(pg+' Training 11/11 card on Home', st.card&&/Training 11\/11/.test(st.text));
  T(pg+' card sits in the Alerts section at the top', st.inAlerts);
  T(pg+' card shows once', st.count===1);
  T(pg+' links to the session page', /^coach\/anim\/s1111_training\.html\?v=108&back=/.test(st.href));
  T(pg+' '+role+' wording', role==='player'?/My role/.test(st.text):/What to look for/.test(st.text));
  await q.evaluate(()=>{const t=document.getElementById('tonight');if(t)t.scrollIntoView();});
  await q.screenshot({path:path.join(SHOTS,PRE+pg.replace('.html','')+'_card.png')});
  T(pg+' zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();
 }
 {const ctx=await b.newContext({...ph});const c=await ctx.newPage();const E=errsOf(c);
  await c.addInitScript(fakeDate);
  await c.addInitScript(()=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.who','Tim');});
  await c.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{docs:[],serverTime:Date.now()}})}));
  await c.goto(BASE+'/coach/index.html');await c.waitForTimeout(1800);
  await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
  await c.evaluate(()=>{const d=document.getElementById('sec-today');if(d)d.open=true;});await c.waitForTimeout(200); // r108: Today is folded by default
  const st=await c.evaluate(()=>{const t=document.getElementById('tonight');const a=t&&t.querySelector('a.btn.pri');return {card:!!t,href:a?a.getAttribute('href'):'',text:t?t.innerText:''};});
  T('coach Today shows Training 11/11', st.card&&/Training 11\/11/.test(st.text)&&/31 to 46/.test(st.text));
  T('coach card links to anim/s1111_training.html', /^anim\/s1111_training\.html\?v=108/.test(st.href));
  await c.evaluate(()=>{const t=document.getElementById('tonight');if(t)t.scrollIntoView();});
  await c.screenshot({path:path.join(SHOTS,PRE+'coach_card.png')});
  T('coach zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();}
 {const ctx=await b.newContext({...ph});const s=await ctx.newPage();const E=errsOf(s);
  await s.goto(BASE+'/coach/anim/s1111_training.html?back=%2Ffamily.html');await s.waitForFunction('window.__ready===true',null,{timeout:30000});
  const st=await s.evaluate(()=>({parts:document.querySelectorAll('#parts button').length,back:document.getElementById('back').getAttribute('href'),aud:window.__s3d.audio}));
  T('session page has six parts', st.parts===6);
  T('back link returns to the home page', st.back==='/family.html');
  const missing=Object.values(st.aud).filter(a=>!fs.existsSync(path.join(root,'coach/anim/audio/s1111_training',a[0])));
  T('every voice file is there ('+Object.keys(st.aud).length+' lines)', missing.length===0);
  T('plan PDF is there', fs.existsSync(path.join(root,'plans/Block3_W2_session_v2_11Nov2026.pdf')));
  T('session page zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();}
 await b.close();srv.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);
})();
