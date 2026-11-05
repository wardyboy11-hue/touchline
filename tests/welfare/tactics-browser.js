// Release 86: Builder pick team board. Tap to add, tap twice to take off, tap one then another to swap, undo, 3-5-2 default.
// Made up players, fake backend only. SHOTS=dir saves screenshots, VIDEO=dir records a phone video.
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8798,SHOTS=process.env.SHOTS||'',VIDEO=process.env.VIDEO||'';
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const POS=[['GK'],['CB'],['CB'],['CB'],['RWB'],['LWB'],['CDM'],['CM'],['CM'],['ST'],['ST'],['GK'],['CB'],['CM'],['ST'],['RWB']];
const NM=['Alfie','Ben','Cal','Dan','Eli','Finn','Gus','Hal','Ike','Jay','Kit','Leo','Max','Ned','Oli','Pip'];
const players={};POS.forEach((p,i)=>{players['p'+i]={id:'p'+i,name:NM[i]+' Test',num:String(i+1),pos:p,active:true};});
const state={ideas:{},players,matches:{},settings:{id:'main',half:35,subEvery:17,roles:{},updatedAt:0},dirty:{},lastSync:Date.now()};
async function open(b,dev,vid){const cc=await b.newContext({...dev,...(vid?{recordVideo:{dir:vid,size:{width:dev.viewport.width,height:dev.viewport.height}}}:{})});const c=await cc.newPage();const ce=[];c.on('pageerror',e=>ce.push(e.stack.split('\n').slice(0,3).join(' | ')));
 await c.addInitScript(s=>{if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');localStorage.setItem('tl.code','x');localStorage.setItem('tl.state.v1',s);}},JSON.stringify(state));
 await c.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true,data:{}})}));
 await c.goto(`http://localhost:${PORT}/coach/index.html`);await c.waitForTimeout(800);await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
 await c.evaluate(()=>{const b=[...document.querySelectorAll('nav.tabs button, nav.tabs a')].find(x=>/team/i.test(x.textContent));b&&b.click();});await c.waitForTimeout(300);
 await c.click('.seg button:has-text("Builder")');await c.waitForSelector('#labroot');await c.waitForTimeout(600);return {cc,c,ce};}
const n=async c=>c.$$eval('.lsl:not(.empty)',x=>x.length),slot=k=>`.lsl[data-k="${k}"]`,nm=async(c,k)=>c.$eval(slot(k)+' .nm',e=>e.textContent);
(async()=>{const b=await chromium.launch();const dev=devices['iPhone 13'];
 const {cc,c,ce}=await open(b,dev,VIDEO);const w=ms=>c.waitForTimeout(VIDEO?ms:60);
 T('3-5-2 is the default shape',await c.$eval('select[data-lab="form"]',e=>e.value)==='352');
 const fitsc=async(c,H)=>c.evaluate(H=>{const nt=document.querySelector('nav.tabs').getBoundingClientRect().top,nv=nt>innerHeight/2?nt:innerHeight,r=s=>document.querySelector(s).getBoundingClientRect();return r('.labbar').top>=0&&r('.labp .pitch').bottom<=nv+2&&r('#labstrip').bottom<=nv+2;},H);
 T('opening Builder shows the bar, pitch and bench on one phone screen, no scrolling',await fitsc(c));
 await shot(c,'r86_1_phone_empty.png');
 await c.click('.lp[data-id="p0"]');await w(700);T('tap a bench keeper puts him in goal',(await nm(c,'GK'))==='Alfie');
 for(const i of [1,2,3,4,5,6,7,8,9,10]){await c.click(`.lp[data-id="p${i}"]`);await w(450);}
 T('tapping eleven bench players fills the side',(await n(c))===11);
 T('bench now shows only the five left',(await c.$$eval('#labstrip .lp',x=>x.length))===5);
 await shot(c,'r86_2_phone_full.png');
 const a=await nm(c,'RST'),z=await nm(c,'LCB');await c.click(slot('RST'));await w(700);
 T('tap a pitch player highlights him and offers Take off',await c.$(slot('RST')+'.on')!==null&&/Take off/.test(await c.textContent('#labact')));
 await shot(c,'r86_3_phone_selected.png');
 await c.click(slot('LCB'));await w(700);T('tap a second pitch player swaps them',(await nm(c,'RST'))===z&&(await nm(c,'LCB'))===a);
 await c.click(slot('CDM'));await w(500);await c.click('.lp[data-id="p13"]');await w(700);T('tap pitch then bench brings the bench player on',(await nm(c,'CDM'))==='Ned'&&!!(await c.$('.lp[data-id="p6"]')));
 await c.click(slot('CDM'));await w(400);await c.click(slot('CDM'));await w(700);T('tap the same player twice takes him off',(await n(c))===10&&!!(await c.$(slot('CDM')+'.empty')));
 await c.click('[data-act="labUndo"]');await w(700);T('Undo puts him back',(await nm(c,'CDM'))==='Ned');
 await c.click(slot('CDM'));await w(400);await c.click('#labact [data-act="labTake"]');await w(600);
 await c.click(slot('CDM'));await w(500);T('tap an empty spot highlights suitable bench players',(await c.$$eval('#labstrip .lp.hg',x=>x.length))>=1);
 await c.click('.lp[data-id="p6"]');await w(700);T('then tap a bench player to fill it',(await nm(c,'CDM'))==='Gus');
 await c.reload();await c.waitForTimeout(800);await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
 T('lineup is saved on the phone',JSON.parse(await c.evaluate(()=>localStorage.getItem('tl.state.v1'))).settings.lab.lineup.CDM==='p6');
 const ce2=ce.filter(x=>!/privToday/.test(x));T('no page errors on the phone (old Today seed error ignored)',ce2.length===0);if(ce2.length)console.log(ce2);
 const vp=c.video&&c.video();await cc.close();if(vp&&VIDEO){fs.renameSync(await vp.path(),path.join(VIDEO,'r86_phone_demo.webm'));}
 const pc=await open(b,{viewport:{width:1366,height:800},deviceScaleFactor:1,isMobile:false,hasTouch:false},'');
 for(const i of [0,1,2,3,4,5,6,7,8,9,10])await pc.c.click(`.lp[data-id="p${i}"]`);
 const pb=await pc.c.$eval('.labp .pitch',e=>e.getBoundingClientRect()),sr=await pc.c.$eval('#labstrip',e=>e.getBoundingClientRect());
 T('on a PC the bench sits beside the pitch, all on screen',sr.left>pb.right-2&&await fitsc(pc.c));
 await shot(pc.c,'r86_4_pc.png');T('no page errors on the PC',pc.ce.filter(x=>!/privToday/.test(x)).length===0);
 await pc.cc.close();await b.close();srv.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);})();
async function shot(p,f){if(SHOTS)await p.screenshot({path:path.join(SHOTS,f)});}
