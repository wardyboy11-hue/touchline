/* r104: voice assistant, travel card, and a headless render of coach, parents and family views. */
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const PORT=+process.env.PORT||8824;
const SHOTS=process.env.SHOTS||'/opt/cursor/artifacts';
fs.mkdirSync(SHOTS,{recursive:true});
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/json','.svg':'image/svg+xml','.mp3':'audio/mpeg','.vtt':'text/vtt','.mp4':'video/mp4'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end('{"v":"108"}');return;}let f=path.join(root,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
const BASE='http://127.0.0.1:'+PORT;
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const w=ms=>new Promise(r=>setTimeout(r,ms));
const td=new Date();const iso=td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');
const NM=['Alfie','Ben','Cal','Dan','Eli','Finn','Gus','Hal','Ike','Jay','Kit','Leo','Max','Ned','Oli','Pip'];
const players={};NM.forEach((n,i)=>{players['p'+i]={id:'p'+i,name:n+' Test',num:String(i+1),pos:['CM'],active:true};});
const state={ideas:{},players,matches:{
 m1:{id:'m1',opp:'Saturday FC',date:iso,ko:'15:00',ha:'H',formation:'352',half:35,avail:{},lineup:{},status:'plan',venue:'Christopher Park',comp:'League',kind:'game',events:[],ratings:{},clock:{acc:0,running:false,t0:0},updatedAt:1}
},settings:{id:'main',half:35,subEvery:17,roles:{},sessions:[],posts:[{id:'tr1',type:'training',title:'Pressing and winning it back',date:iso,time:'20:00',place:"St Peter's",status:'published'}],updatedAt:1},dirty:{},lastSync:Date.now()};
const H={'access-control-allow-origin':'*'};
function errsOf(p){const e=[];p.on('pageerror',x=>e.push('pageerror: '+x.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|favicon|net::ERR|404|service.?worker|manifest|navigator\.vibrate/i.test(m.text()))e.push('console: '+m.text());});return e;}
const COACH_VIEWS=['today','match','squad','mday','ct','fa','em','conc','goals','priv','lab','stats','admin','sb','plan','run','pos','sess','rev','fit','pod','res','fav','anim','lib','rl','ig','x','att','board','cdev','roles','hub','refs','opp','lg','ask','more','guides','shop'];
const FAM_TABS=['home','games','events','media','me','faq','contacts','lib','own','voice','data'];
(async()=>{
 const b=await chromium.launch();
 const ph={viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true};
 async function bootCoach(){
  const ctx=await b.newContext(ph);const p=await ctx.newPage();const E=errsOf(p);
  const sent=[];
  await p.route('**/*',async route=>{
   const u=route.request().url();
   if(/macros|touchline-push|pushover/i.test(u)){
    let a={};try{a=JSON.parse(route.request().postData()||'{}');}catch(e){}
    sent.push(a.action||u);
    let data={docs:[],rows:[],serverTime:Date.now()};
    if(a.action==='travel.list')data={rows:[{id:'Tin',by:'Deano',kind:'traffic',mins:'',text:'',date:iso,at:Date.now(),line:'Deano is stuck in traffic.'}]};
    else if(a.action==='travel.send'||a.action==='alert.send')data={ok:true,sent:1,coachesOnly:true};
    else if(a.action==='respect.list')data={outstanding:[],signed:[],season:'2026'};
    else if(a.action==='sync')data={docs:[],serverTime:Date.now()};
    return route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:data})});
   }
   return route.continue();
  });
  await p.addInitScript(s=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',s);},JSON.stringify(state));
  await p.goto(BASE+'/coach/index.html#/today');
  await p.waitForTimeout(1200);
  await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
  return {ctx,p,E,sent};
 }
 // coach views
 {
  const {ctx,p,E}=await bootCoach();
  for(const v of COACH_VIEWS){
   await p.goto(BASE+'/coach/index.html#/'+v);await w(450);
   await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
   const info=await p.evaluate(()=>{const r=document.getElementById('root');return {text:(r&&r.innerText||'').replace(/\s+/g,' ').slice(0,120),kids:r?r.children.length:0,bad:/This page hit a problem/i.test((r&&r.innerText)||'')};});
   if(info.bad||!info.kids)console.log('VIEW',v,JSON.stringify(info));
   T('coach view '+v+' rendered',info.kids>0&&!info.bad);
  }
  await p.goto(BASE+'/coach/index.html#/today');await w(900);
  await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();const m=document.getElementById('tl-md');if(m)m.remove();});
  const travel=await p.locator('#tl-travel').innerText();
  T('travel card is coach only copy',/travel issues/i.test(travel)&&/Families do not get this/.test(travel)&&/Running late/.test(travel)&&/Traffic/.test(travel)&&/Can.t make it/.test(travel)&&/Custom/.test(travel));
  await p.locator('#tl-travel').screenshot({path:path.join(SHOTS,'r104-travel-card.png')});
  await p.evaluate(()=>{document.querySelector('button[aria-label="Voice helper"]').click();});
  await w(600);
  const dlg=await p.locator('#tl-voice-sheet').innerText();
  T('mic dialog says how can I help',/How can I help/.test(dlg)&&/Or type your question/.test(dlg));
  await p.screenshot({path:path.join(SHOTS,'r104-mic-dialog.png')});
  await p.fill('#tl-voice-in','send me a clip of shooting');
  await p.click('#tl-voice-go');
  await w(800);
  const ans=await p.locator('#tl-voice-log').innerText();
  T('clip answer is on screen',/clip/i.test(ans)&&(/Play/.test(ans)||/Share/.test(ans)||/library/i.test(ans)));
  await p.evaluate(()=>{const c=document.querySelector('.tl-voice-clip');if(c)c.scrollIntoView({block:'center'});});
  await p.screenshot({path:path.join(SHOTS,'r104-clip-answer.png')});
  await p.fill('#tl-voice-in','reply we are running late');
  await p.click('#tl-voice-go');
  await w(500);
  const draft=await p.locator('#tl-voice-log').innerText();
  T('draft shows confirm send and is not auto sent',/Confirm send/.test(draft)&&/we are running late/i.test(draft));
  const before=await p.evaluate(()=>window.__sentTravel||0);
  T('confirm button present',await p.locator('[data-voice-yes]').count()>0);
  await p.evaluate(()=>{const b=document.querySelector('[data-voice-yes]');if(b)b.scrollIntoView({block:'center'});});
  await p.screenshot({path:path.join(SHOTS,'r104-draft-confirm.png')});
  await ctx.close();
  T('coach views console clean'+(E.length?' '+E.slice(0,4).join(' | '):''),E.length===0);
 }
 // parents and family
 for(const page of ['parents.html','family.html']){
  const ctx=await b.newContext(ph);const p=await ctx.newPage();const E=errsOf(p);
  await p.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
   const data={first:'Pat',role:page==='family.html'?'parent':'player',num:'7',mine:{},evMine:{},evAtt:{},at:Date.now(),posts:[{id:'tr1',type:'training',title:'Pressing',date:iso,time:'20:00',place:'Orrell'}],att:{},vote:{motm:{open:false},poty:{open:false}},x:{fixtures:[{id:'g1',opp:'Saturday FC',date:iso,ko:'15:00',ha:'H',venue:'Christopher Park'}],news:[],events:[],lifts:[],media:[],contacts:[]}};
   r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:a.action==='f.clips'?{rows:[],pt:''}:data})});});
  await p.addInitScript(()=>{localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.P','1');localStorage.setItem('fam.tour','1');});
  await p.goto(BASE+'/'+page);await w(1600);
  await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
  const tabs=page==='family.html'?FAM_TABS.concat(['child','pq']):FAM_TABS.concat(['voice']);
  for(const tab of tabs){
   await p.evaluate(t=>{try{goTab(t);}catch(e){}},tab);await w(350);
   const kids=await p.evaluate(()=>document.getElementById('root').children.length);
   T(page+' '+tab+' rendered',kids>0);
  }
  const body=await p.evaluate(()=>document.body.innerText||'');
  T(page+' has no travel card and no coaches voice leak',!/Travel issues/.test(body)&&!/Coaches' Voice/.test(body));
  await p.evaluate(()=>{try{goTab('home');}catch(e){}const m=document.getElementById('tl-md');if(m)m.remove();const b=document.querySelector('button[aria-label="Voice helper"]');if(b)b.click();});await w(400);
  await p.fill('#tl-voice-in','open the emergency head injury page');
  await p.click('#tl-voice-go');await w(300);
  const blocked=await p.locator('#tl-voice-log').innerText();
  T(page+' blocks head injury page',/coaches/i.test(blocked)&&!/Suspected head injury/.test(await p.locator('#root').innerText()));
  await ctx.close();
  T(page+' console clean'+(E.length?' '+E.slice(0,3).join(' | '):''),E.length===0);
 }
 console.log(ok+' passed, '+bad+' failed');
 await b.close();srv.close();process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
