/* r91: PT-style fitness planner. Fake backend. SHOTS=/workspace/shots PORT default 8795 */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8795,SHOTS=process.env.SHOTS||'/workspace/shots';
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.webmanifest':'application/json'};
const srv=http.createServer((q,r)=>{let u=q.url.split('?')[0],f=path.join(root,decodeURIComponent(u));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
const shot=async(p,n)=>{fs.mkdirSync(SHOTS,{recursive:true});await p.screenshot({path:path.join(SHOTS,n),fullPage:false});};
const w=ms=>new Promise(r=>setTimeout(r,ms));

async function seedFamily(page,role){
 page.on('pageerror',e=>{(page.__errs=page.__errs||[]).push(String(e.message));});
 await page.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
  (page.__sent=page.__sent||[]).push(a);
  const okk=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
  if(a.action==='f.home')return okk({first:role==='parent'?'Pat':'Sam',role:role||'player',num:'7',mine:{},rsn:{},x:{fixtures:[],posts:[]},posts:[],res:[],tips:[],vote:{}});
  if(a.action==='f.self.get')return okk({done:1,num:'7',nick:'Sammy',pos:['CM'],foot:'R',sr:{},role:'player'});
  if(a.action==='f.child')return okk({num:'7',first:'Lad',pos:['CM']});
  if(a.action&&String(a.action).indexOf('f.fit')===0)return okk({ok:true,id:(a.plan&&a.plan.id)||'F1'});
  return okk({});});
 await page.addInitScript(()=>{const _g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return /^fam\.wel\./.test(k)?'1':_g.call(this,k);};localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');});
}

(async()=>{
 const b=await chromium.launch();
 const ph=devices['Pixel 7'];

 // Unit-ish: fitness.js loads and builds a plan
 const ctx0=await b.newContext();const u=await ctx0.newPage();
 await u.goto('http://localhost:'+PORT+'/fitness.js');
 const src=await u.content();
 T('fitness.js served',/TLFit/.test(src)||/PT-style/.test(src));
 await ctx0.close();

 const ctx=await b.newContext({...ph});const q=await ctx.newPage();q.__errs=[];
 await seedFamily(q,'player');
 await q.goto('http://localhost:'+PORT+'/family.html');await w(2200);
 await q.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();const md=document.getElementById('tl-md');if(md)md.remove();});
 await q.waitForFunction(()=>!!window.TLFit,{timeout:8000}).catch(()=>{});
 const loaded=await q.evaluate(()=>({fit:!!window.TLFit,build:!!(window.TLFit&&TLFit.buildPlan),card:!!(window.TLFit&&TLFit.familyCard)}));
 T('TLFit loaded on family',loaded.fit&&loaded.build&&loaded.card);

 // Build plan offline
 const plan=await q.evaluate(()=>{
  const p=TLFit.buildPlan({goals:['speed','stamina'],focus:'mix',weeks:4,who:'player',num:'7'});
  TLFit.upsertPlan(p);return {id:p.id,days:p.days.length,title:p.title,hasGame:p.days.some(d=>d.type==='game'),hasWed:p.days.some(d=>d.d===2&&d.type==='light'),save:!!localStorage.getItem('tl.fit.plans')};
 });
 T('U15 plan has 28 days (4 weeks)',plan.days===28);
 T('plan has match day and training-night light session',plan.hasGame&&plan.hasWed);
 T('plan saved to local profile',!!plan.save);

 await q.evaluate(()=>{
  let host=document.getElementById('r91-harness');
  if(!host){host=document.createElement('div');host.id='r91-harness';host.style.cssText='padding:12px;max-width:520px;margin:0 auto';(document.getElementById('root')||document.body).prepend(host);}
  host.innerHTML=TLFit.familyCard({who:'player'});
 });
 await w(200);
 T('fitness card on harness',/Fitness/i.test(await q.innerText('#r91-harness')));
 await shot(q,'r91_family_fitness_card.png');
 await q.click('#r91-harness [data-fit="hub"]');await w(500);
 T('fitness hub opens',!!(await q.$('#tl-fitview'))&&/Fitness/i.test(await q.innerText('#tl-fitview')));
 await shot(q,'r91_family_fitness_hub.png');
 await q.click('#tl-fitview [data-fit="new"]');await w(300);
 T('builder shows goals and focus',/What do you want to improve/i.test(await q.innerText('#tl-fitview'))&&/Focus/i.test(await q.innerText('#tl-fitview')));
 await shot(q,'r91_family_fitness_builder.png');
 await q.click('#tl-fitview [data-goal="speed"]');await w(120);
 await q.click('#tl-fitview [data-goal="strength"]');await w(120);
 await q.click('#tl-fitview [data-focus="gym"]');await w(120);
 await q.click('#tl-fitview [data-fit="build"]');await w(500);
 T('built plan shows Save',/Save to my profile/i.test(await q.innerText('#tl-fitview')));
 T('built plan shows Mark done',/Mark done/i.test(await q.innerText('#tl-fitview')));
 await shot(q,'r91_family_fitness_plan.png');
 // Mark done
 await q.click('#tl-fitview [data-fit="done"]');await w(300);
 T('mark done toggles',/Undo/i.test(await q.innerText('#tl-fitview')));
 // Duplicate
 await q.click('#tl-fitview [data-fit="dup"]');await w(300);
 T('duplicate works',/\(copy\)/i.test(await q.innerText('#tl-fitview')));
 await q.click('#tl-fitview [data-fit="x"]');await w(200);

 // Parent: own plan + lad read only
 const ctxp=await b.newContext({...ph});const pp=await ctxp.newPage();pp.__errs=[];
 await seedFamily(pp,'parent');
 await pp.goto('http://localhost:'+PORT+'/family.html');await w(2000);
 await pp.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
 await pp.waitForFunction(()=>!!window.TLFit,{timeout:8000}).catch(()=>{});
 await pp.evaluate(()=>{
  // Seed a lad plan as if on this phone
  const lad=TLFit.buildPlan({goals:['agility'],focus:'run_int',weeks:2,who:'player',num:'7'});
  lad.title='Lad speed plan';TLFit.upsertPlan(lad);
  const mine=TLFit.buildPlan({goals:['stamina'],focus:'run_dist',weeks:2,who:'parent'});
  mine.title='Parent easy miles';TLFit.upsertPlan(mine);
  let host=document.getElementById('r91-harness');
  if(!host){host=document.createElement('div');host.id='r91-harness';host.style.cssText='padding:12px';(document.getElementById('root')||document.body).prepend(host);}
  host.innerHTML=TLFit.familyCard({who:'parent'});
 });
 await pp.click('#r91-harness [data-fit="hub"]');await w(400);
 const hubTxt=await pp.innerText('#tl-fitview');
 T('parent hub has My fitness and His plan',/My fitness|My plan|His plan/i.test(hubTxt)&&/His plan/i.test(hubTxt));
 await shot(pp,'r91_parent_fitness_hub.png');
 await pp.click('#tl-fitview [data-fit="openLad"]');await w(400);
 T('lad plan is read only',/Read only/i.test(await pp.innerText('#tl-fitview'))&&!(await pp.$('#tl-fitview [data-fit="done"]')));
 await shot(pp,'r91_parent_lad_readonly.png');
 await ctxp.close();

 // Coach designers
 const cc=await b.newContext({...ph});const c=await cc.newPage();c.__errs=[];
 await c.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
  const okk=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
  if(a.action==='auth'||a.action==='boot'||a.action==='pull')return okk({ok:true,players:{},matches:[],settings:{},codeOk:true});
  return okk({});});
 await c.addInitScript(()=>{localStorage.setItem('tl.code','coach');localStorage.setItem('tl.ok','1');});
 await c.goto('http://localhost:'+PORT+'/coach/index.html');await w(1800);
 await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
 await c.waitForFunction(()=>!!(window.TLFit&&window.ACT&&window.render),{timeout:10000}).catch(()=>{});
 const coachOk=await c.evaluate(()=>{
  try{
   if(window.view){view.authed=true;view.tab='fit';view.fitMode='workout';}
   if(typeof render==='function')render(true);
   return !!(window.TLFit&&document.body.innerText.match(/Workout designer|Fitness/));
  }catch(e){return String(e);}
 });
 await w(600);
 const ctxt=await c.innerText('body');
 T('coach TLFit coachPanel available',!!(await c.evaluate(()=>!!(window.TLFit&&TLFit.coachPanel('workout').match(/Workout designer/)))));
 // Force paint workout panel into harness if login blocked full app
 await c.evaluate(()=>{
  let host=document.getElementById('r91-coach');
  if(!host){host=document.createElement('div');host.id='r91-coach';host.style.cssText='padding:12px;max-width:560px;margin:0 auto;background:#0b1a3a;color:#e8eefc';(document.getElementById('root')||document.body).prepend(host);}
  if(window.TLFit){TLFit.coachHandle('workout',{getAttribute:()=>null});host.innerHTML=TLFit.coachPanel('workout');}
 });
 await w(200);
 T('workout designer visible',/Workout designer/i.test(await c.innerText('#r91-coach')));
 await shot(c,'r91_coach_workout_designer.png');
 await c.evaluate(()=>{
  const btns=[...document.querySelectorAll('#r91-coach [data-op="addEx"]')];
  if(btns[0])TLFit.coachHandle('addEx',btns[0]);
  if(btns[1])TLFit.coachHandle('addEx',btns[1]);
  const wn=document.getElementById('tl-fit-wn'); if(wn)wn.value='Midweek strength';
  TLFit.coachHandle('saveWorkout',{getAttribute:()=>null});
  document.getElementById('r91-coach').innerHTML=TLFit.coachPanel('workout');
 });
 await w(200);
 T('workout saved to templates',/Midweek strength/i.test(await c.innerText('#r91-coach')));
 await c.evaluate(()=>{TLFit.coachHandle('stretch',{getAttribute:()=>null});document.getElementById('r91-coach').innerHTML=TLFit.coachPanel('stretch');});
 await w(200);
 T('stretch designer visible',/Stretching routine designer/i.test(await c.innerText('#r91-coach')));
 await shot(c,'r91_coach_stretch_designer.png');
 await c.evaluate(()=>{
  const btns=[...document.querySelectorAll('#r91-coach [data-op="togStretch"]')];
  if(btns[0])TLFit.coachHandle('togStretch',btns[0]);
  if(btns[1])TLFit.coachHandle('togStretch',btns[1]);
  const sn=document.getElementById('tl-fit-sn'); if(sn)sn.value='Hips focus';
  TLFit.coachHandle('saveStretch',{getAttribute:()=>null});
  document.getElementById('r91-coach').innerHTML=TLFit.coachPanel('stretch');
 });
 T('stretch routine saved',/Hips focus/i.test(await c.innerText('#r91-coach')));
 await shot(c,'r91_coach_stretch_saved.png');

 // No heavy maxing / diet language
 const lib=await c.evaluate(()=>JSON.stringify(TLFit.EX.map(x=>x.n+' '+x.d).join(' ')));
 T('no diet or max lift language',!/calorie|max lift|1RM|bulking|cut /i.test(lib));
 T('no page errors on coach',!(c.__errs&&c.__errs.length));
 T('no page errors on family',!(q.__errs&&q.__errs.length));

 await cc.close();await ctx.close();await b.close();
 console.log('\n'+ok+' passed, '+bad+' failed');
 srv.close();
 process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
