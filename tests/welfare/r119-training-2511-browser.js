/* r119: Training 25/11 (switching play) card; based on r107. Training 11/11 card lands at the top of Home for players, parents and coaches, and the 3D session page loads with voice files present. */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8819,SHOTS=process.env.SHOTS||'/workspace/shots',PRE=process.env.PRE||"r119_";
fs.mkdirSync(SHOTS,{recursive:true});
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/json','.svg':'image/svg+xml'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end(JSON.stringify({v:(require('fs').readFileSync(require('path').join(__dirname,'../../update.js'),'utf8').match(/RUN='(\d+)'/)||[])[1]}));return;}let f=path.join(root,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
const BASE='http://localhost:'+PORT;
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
function errsOf(p){const e=[];p.on('pageerror',x=>e.push('pageerror: '+x.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|favicon|net::ERR/.test(m.text()))e.push('console: '+m.text());});return e;}
const td=new Date();const ymd=td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');
const day=process.env.DAY||'2026-11-25';
function famData(role){return {first:'Pat',role:role,num:'7',mine:{},rsn:{},at:Date.now(),photo:'',posts:[{id:'t1',type:'training',title:'Training',date:'2026-11-25',time:'20:00',place:'Christopher Park'}],att:{},welcome:'',tips:'',vote:{},res:[],matchDay:false,x:{fixtures:[],news:[],welcome:'',matchDay:false,events:[],lifts:[],media:[],contacts:[]}};}
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
  const st=await q.evaluate(()=>{const t=document.getElementById('tonight');const a=t&&t.querySelector('a.btn.pri');const al=document.getElementById('sec-alerts'),td=document.getElementById('tlh-todo')||document.getElementById('tlh-feed');
    return {card:!!t,inAlerts:!!(al&&t&&al.contains(t))||!!(t&&td&&(t.compareDocumentPosition(td)&Node.DOCUMENT_POSITION_FOLLOWING)),href:a?a.getAttribute('href'):'',text:t?t.innerText:'',count:document.querySelectorAll('#tonight').length};});
  T(pg+' tonight card on Home', st.card&&/switching play/.test(st.text)&&/20:00 to 21:00/.test(st.text));
  T(pg+' PDF button', /plans\/s2511_switching_play\.pdf/.test(await q.evaluate(()=>document.getElementById('tonight').innerHTML)));
  T(pg+' card sits at the top of Home (r113: above Things to do)', st.inAlerts);
  T(pg+' card shows once', st.count===1);
  T(pg+' links to the session page', /^coach\/anim\/s2511_switching_play\.html\?v=\d+&back=/.test(st.href));
  T(pg+' '+role+' wording', role==='player'?/Keeper \(1\)/.test(st.text)&&!/What to look for/.test(st.text):/What to look for/.test(st.text));
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
  T('coach Today shows Training 25/11', st.card&&/Training 25\/11/.test(st.text)&&/40 to 57/.test(st.text));
  T('coach card links to anim/s2511_switching_play.html', /^anim\/s2511_switching_play\.html\?v=\d+/.test(st.href));
  await c.evaluate(()=>{const t=document.getElementById('tonight');if(t)t.scrollIntoView();});
  await c.screenshot({path:path.join(SHOTS,PRE+'coach_card.png')});
  T('coach zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();}
 for(const vp of [['phone',ph],['pc',{viewport:{width:1366,height:800}}]]){const ctx=await b.newContext({...vp[1]});const s=await ctx.newPage();const E=errsOf(s);const ext=[];
  s.on('request',r=>{if(!r.url().startsWith(BASE))ext.push(r.url());});
  await s.goto(BASE+'/coach/anim/s2511_switching_play.html?back=%2Ffamily.html');await s.waitForTimeout(800);
  const st=await s.evaluate(()=>({back:document.getElementById('back').getAttribute('href'),jump:document.querySelectorAll('#jump option').length,ow:document.documentElement.scrollWidth>innerWidth+1}));
  T(vp[0]+' back link returns to the home page', st.back==='/family.html');
  T(vp[0]+' five parts in the jump list', st.jump===5);
  T(vp[0]+' no sideways scroll', !st.ow);
  await s.click('#play');await s.waitForTimeout(600);await s.click('#next');await s.selectOption('#jump','3');await s.waitForTimeout(400);
  await s.screenshot({path:path.join(SHOTS,PRE+'session_'+vp[0]+'.png')});
  T(vp[0]+' session page loads nothing from outside', ext.length===0); if(ext.length) console.log(ext);
  T(vp[0]+' session page zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();}
 T('plan PDF is there', fs.existsSync(path.join(root,'plans/s2511_switching_play.pdf')));
 {const ctx=await b.newContext({...ph});const q=await ctx.newPage();await q.addInitScript(`(()=>{const T=new Date('2026-11-26T18:00:00').getTime(),D0=Date.now(),R=Date;class FD extends R{constructor(...a){if(a.length)super(...a);else super(T+(R.now()-D0));}static now(){return T+(R.now()-D0);}}window.Date=FD;})()`);
  await q.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:famData('player')})}));
  await q.addInitScript(()=>{localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.P','1');localStorage.setItem('fam.tour','1');});
  await q.goto(BASE+'/family.html');await q.waitForTimeout(2800);await q.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();try{if(window.goTab)goTab('home');}catch(e){}});await q.waitForTimeout(500);
  T('card gone the day after', await q.evaluate(()=>!document.getElementById('tonight')));await ctx.close();}
 await b.close();srv.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);
})();
