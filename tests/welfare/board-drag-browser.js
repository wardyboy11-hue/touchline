// Release 89: tactics board bench picture drag onto the pitch (mouse), Hub cards present.
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8799,SHOTS=process.env.SHOTS||'';
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg'};
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const players={};for(let i=0;i<12;i++)players['p'+i]={id:'p'+i,name:['Alfie','Ben','Cal','Dan','Eli','Finn','Gus','Hal','Ike','Jay','Kit','Leo'][i]+' Test',num:String(i+1),pos:i===0?['GK']:['CM'],active:true};
const state={ideas:{},players,matches:{},settings:{id:'main',half:35,subEvery:17,roles:{},updatedAt:0},dirty:{},lastSync:Date.now()};
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1100,height:900}});
 const c=await ctx.newPage();const ce=[];c.on('pageerror',e=>ce.push(String(e)));
 await c.addInitScript(s=>{sessionStorage.setItem('seeded','1');localStorage.setItem('tl.code','x');localStorage.setItem('tl.state.v1',s);},JSON.stringify(state));
 await c.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true,data:{}})}));
 await c.goto('http://localhost:'+PORT+'/coach/index.html');await c.waitForTimeout(1000);
 await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove(); TLX.view.tab='board';TLX.render(true);});
 await c.waitForSelector('#bdc',{timeout:8000});
 T('board canvas present',!!await c.$('#bdc'));
 await c.selectOption('#bfb','352').catch(()=>{});
 await c.waitForTimeout(700);
 await c.evaluate(()=>{const BD=TLX.BD;BD.items=BD.items.filter(i=>i.t==='ball'||i.team!=='b');TLX.bDraw();TLX.render(true);});
 await c.waitForTimeout(400);
 const chip=await c.$('[data-ba="sq"]');
 T('bench chip present',!!chip);
 if(chip){
  await chip.scrollIntoViewIfNeeded();
  await c.waitForTimeout(200);
  const box=await chip.boundingBox();
  const cv=await c.$('#bdc');
  await cv.scrollIntoViewIfNeeded();
  const cb=await cv.boundingBox();
  const before=await c.evaluate(()=>TLX.BD.items.filter(i=>i.t==='p'&&i.team==='b'&&i.pid).length);
  // Use PointerEvents so document-level BDG listeners fire reliably
  // UX QA: no long-press; activate after ~5px move; ghost appears; pitch gets drop highlight; tap still picks
  const ux=await c.evaluate(()=>{
   const el=document.querySelector('[data-ba="sq"]');
   const cs=getComputedStyle(el);
   return {touchAction:cs.touchAction,cursor:cs.cursor,hasClass:el.classList.contains('bdg-chip')};
  });
  T('bench chip has touch-action none (dnd-kit / Chrome guidance)',ux.touchAction==='none'&&ux.hasClass);
  T('bench chip uses grab cursor',/grab/.test(ux.cursor));
  const res=await c.evaluate(({sx,sy,ex,ey})=>{
   const el=document.querySelector('[data-ba="sq"]');
   el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:sx,clientY:sy,pointerId:1,pointerType:'mouse',button:0,buttons:1}));
   // sub-threshold move must NOT start a drag
   el.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:sx+2,clientY:sy+1,pointerId:1,pointerType:'mouse',buttons:1}));
   const earlyGhost=!!document.querySelector('.bdg');
   // past 5px threshold
   el.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:sx+8,clientY:sy+4,pointerId:1,pointerType:'mouse',buttons:1}));
   const midGhost=!!document.querySelector('.bdg');
   el.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:ex,clientY:ey,pointerId:1,pointerType:'mouse',buttons:1}));
   const over=!!document.querySelector('#bdc.bdg-over');
   el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:ex,clientY:ey,pointerId:1,pointerType:'mouse',button:0,buttons:0}));
   return new Promise(resolve=>setTimeout(()=>resolve({
     earlyGhost, midGhost, over,
     after:TLX.BD.items.filter(i=>i.t==='p'&&i.team==='b'&&i.pid).length,
     leftoverGhost:!document.querySelector('.bdg'),
     leftoverOver:!document.querySelector('#bdc.bdg-over')
   }),500));
  },{sx:box.x+box.width/2,sy:box.y+box.height/2,ex:cb.x+cb.width*0.5,ey:cb.y+cb.height*0.55});
  T('sub-threshold move does not start a drag',!res.earlyGhost);
  T('past 5px threshold shows a ghost',res.midGhost);
  T('pitch shows drop highlight while over',res.over);
  T('drag from bench places a blue player on the pitch',res.after>before);
  T('ghost and highlight clear after drop',res.leftoverGhost&&res.leftoverOver);
  // tap-to-pick still works (WCAG 2.5.7 single-pointer alternative)
  const tap=await c.evaluate(()=>{
   const beforeBench=TLX.BD.bench||'';
   const el=document.querySelector('[data-ba="sq"]');
   const pid=el.dataset.pid;
   el.click();
   return {pid,picked:TLX.BD.bench===pid||TLX.BD.sel};
  });
  T('tap-to-pick still works alongside drag',!!tap.picked);
  if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await c.screenshot({path:path.join(SHOTS,'r89_board_drag.png')});}
 }
 await c.evaluate(()=>{TLX.view.tab='hub';TLX.render(true);});
 await c.waitForTimeout(600);
 const hubTxt=await c.textContent('body');
 T('Hub has game and training reminders',/Game and training reminders/i.test(hubTxt));
 T('Hub has match morning pack',/Match morning pack/i.test(hubTxt));
 T('Hub has draft posts',/Draft posts for players/i.test(hubTxt));
 if(SHOTS){await c.screenshot({path:path.join(SHOTS,'r89_hub_reminders.png'),fullPage:false});}
 await c.evaluate(()=>{TLX.view.tab='anim';TLX.view.an=TLX.ANI.length-1;TLX.render(true);});
 await c.waitForTimeout(900);
 const an=await c.textContent('body');
 T('animation list includes 3-5-2 in transition',/3-5-2 in transition/i.test(an));
 if(SHOTS){await c.screenshot({path:path.join(SHOTS,'r89_anim_352.png')});}
 await c.goto('http://localhost:'+PORT+'/coach/anim/12_352_in_transition.html?v=90');
 await c.waitForTimeout(1400);
 if(SHOTS){await c.screenshot({path:path.join(SHOTS,'r89_anim_preview.png')});}
 const errs=ce.filter(x=>!/privToday|favicon|Failed to load/i.test(x));
 T('no page errors',errs.length===0);
 if(errs.length)console.log(errs.slice(0,5));
 await ctx.close();await b.close();srv.close();
 console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);
})();
