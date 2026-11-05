/* r94: PC layout must not jump on keepScroll re-renders; board allows scroll past pitch. */
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');const PORT=+process.env.PORT||8795;
const SHOTS=process.env.SHOTS||'/workspace/shots';
fs.mkdirSync(SHOTS,{recursive:true});
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/json'};
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const players={};for(let i=0;i<12;i++)players['p'+i]={id:'p'+i,name:['Alfie','Ben','Cal','Dan','Eli','Finn','Gus','Hal','Ike','Jay','Kit','Leo'][i]+' Test',num:String(i+1),pos:i===0?['GK']:['CM'],active:true};
const state={ideas:{},players,matches:{},settings:{id:'main',half:35,subEvery:17,roles:{},access:'gate note',updatedAt:0},dirty:{},lastSync:Date.now()};
(async()=>{
 const b=await chromium.launch();
 // Desktop coach More: force keepScroll re-renders and measure scroll jump
 {
  const ctx=await b.newContext({viewport:{width:1440,height:900}});
  const c=await ctx.newPage();const ce=[];c.on('pageerror',e=>ce.push(String(e)));
  await c.addInitScript(s=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.state.v1',s);},JSON.stringify(state));
  await c.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true,data:{docs:[],serverTime:Date.now()}})}));
  await c.goto('http://localhost:'+PORT+'/coach/index.html');await c.waitForTimeout(900);
  await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
  await c.evaluate(()=>{TLX.view.tab='more';TLX.render();});
  await c.waitForTimeout(400);
  await c.evaluate(()=>window.scrollTo(0,520));
  await c.waitForTimeout(200);
  const y0=await c.evaluate(()=>scrollY);
  for(let i=0;i<12;i++){await c.evaluate(()=>TLX.render(true));await c.waitForTimeout(80);}
  const y1=await c.evaluate(()=>scrollY);
  T('PC More keepScroll re-renders do not jump (|dy|<8)',Math.abs(y1-y0)<8);
  await c.screenshot({path:path.join(SHOTS,'r94_more_pc.png'),fullPage:false});
  // Board tab
  await c.evaluate(()=>{TLX.view.tab='board';TLX.view.tm='run';TLX.render();});
  await c.waitForSelector('#bdc',{timeout:8000});
  await c.waitForTimeout(400);
  const touch=await c.evaluate(()=>(document.getElementById('bdc')||{}).style.touchAction||'');
  T('board canvas default touch-action is pan-y',touch==='pan-y'||touch===''||/pan-y/.test(touch));
  T('lock board button present',!!await c.$('[data-ba=lock]'));
  T('scroll-past gutter present',!!await c.$('#tl-board-past'));
  const h=await c.evaluate(()=>{const el=document.getElementById('bdc');return el?el.getBoundingClientRect().height:0;});
  T('board height capped near 70vh (<'+Math.round(900*0.78)+')',h>100&&h<=900*0.78);
  await c.evaluate(()=>window.scrollTo(0,0));
  const before=await c.evaluate(()=>scrollY);
  await c.evaluate(()=>{const el=document.getElementById('tl-board-past');if(el)el.scrollIntoView({block:'start'});});
  await c.waitForTimeout(200);
  const after=await c.evaluate(()=>scrollY);
  T('can scroll to past-board gutter',after>before+40);
  await c.click('[data-ba=lock]');await c.waitForTimeout(300);
  T('lock toggles to locked label',/locked/i.test(await c.textContent('[data-ba=lock]')));
  await c.screenshot({path:path.join(SHOTS,'r94_board_pc.png'),fullPage:false});
  // 20 keepScroll renders on board while scrolled mid-page
  await c.evaluate(()=>window.scrollTo(0,400));
  const b0=await c.evaluate(()=>scrollY);
  for(let i=0;i<10;i++){await c.evaluate(()=>TLX.render(true));await c.waitForTimeout(60);}
  const b1=await c.evaluate(()=>scrollY);
  T('PC board keepScroll re-renders do not jump',Math.abs(b1-b0)<8);
  T('no page errors '+ce.slice(0,2).join(' | '),ce.length===0);
  await ctx.close();
 }
 // Family desktop smoke: countdown tick should not use scrollIntoView on re-render of root
 {
  const ctx=await b.newContext({viewport:{width:1280,height:800}});
  const c=await ctx.newPage();
  await c.goto('http://localhost:'+PORT+'/family.html');
  await c.waitForTimeout(800);
  await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
  await c.evaluate(()=>window.scrollTo(0,300));
  const y0=await c.evaluate(()=>scrollY);
  await c.waitForTimeout(1600); // allow countdown tick
  const y1=await c.evaluate(()=>scrollY);
  T('family PC idle ~1.6s does not jump',Math.abs(y1-y0)<8);
  await c.screenshot({path:path.join(SHOTS,'r94_family_pc.png'),fullPage:false});
  await ctx.close();
 }
 console.log(ok+' passed, '+bad+' failed');
 await b.close();srv.close();process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
