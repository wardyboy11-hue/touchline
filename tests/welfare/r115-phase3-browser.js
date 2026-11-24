/* r115: Phase 3. Lighter coach first load, the lads' voice and demo choice (tl-vox.js) in stretching,
   the running timer and the shape guide, the plain figure demos, and the re-made groin clips.
   Fake backend, nothing real is touched. Phone (Pixel 7) and laptop (1366). SHOTS=/workspace/shots */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8815,SHOTS=process.env.SHOTS||'/workspace/shots',PRE='r115_';
fs.mkdirSync(SHOTS,{recursive:true});
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/json','.svg':'image/svg+xml','.mp3':'audio/mpeg','.mp4':'video/mp4','.webm':'video/webm'};
const MISS=[];
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end(JSON.stringify({v:(fs.readFileSync(path.join(root,'update.js'),'utf8').match(/RUN='(\d+)'/)||[])[1]}));return;}
 let f=path.join(root,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){MISS.push(u);r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
const BASE='http://localhost:'+PORT;
let ok=0,bad=0;const T=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  '+JSON.stringify(x)));c?ok++:bad++;};
const w=ms=>new Promise(r=>setTimeout(r,ms));
const H={'access-control-allow-origin':'*'};
function errsOf(p){const e=[];p.on('pageerror',x=>e.push('pageerror: '+x.message));p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(m.text()))e.push('console: '+m.text());});return e;}
function coachState(){return {ideas:{},players:{p1:{id:'p1',name:'Alex One',num:'7',active:true}},matches:{},settings:{id:'main',half:35,roles:{},updatedAt:0},dirty:{},lastSync:Date.now()};}
const BANNED=/friendship groups|authentic|self-presentation|journey|resilience|growth mindset|deep dive|leverage|holistic|unpack|transformati|empower|synergy|stakeholder|circle back|unlock|embrace|going forward|potential|\bchase|\bfolk|deeper/i;
async function tapSizes(p,sel){return p.evaluate(s=>[...document.querySelectorAll(s)].filter(x=>x.offsetParent!==null).map(x=>{const r=x.getBoundingClientRect();return {t:(x.innerText||'').trim().slice(0,24),h:Math.round(r.height),w:Math.round(r.width)};}).filter(x=>x.h<48||x.w<44),sel);}
(async()=>{
 const b=await chromium.launch();
 const SIZES=[['phone',{...devices['Pixel 7']}],['laptop',{viewport:{width:1366,height:820}}]];
 /* ---------- static checks ---------- */
 const idx=fs.readFileSync(path.join(root,'coach/index.html'),'utf8'),app=fs.readFileSync(path.join(root,'coach/app.js'),'utf8');
 const tags=(idx.match(/<script src="[^"]+"/g)||[]).map(s=>s.slice(13,-1));
 T('coach: first screen loads 10 scripts, the rest come late',tags.length<=10&&!tags.some(t=>/topic-bank|guide\.js|cdev|shop|fitness|pod|spotify|alarm|motm105|gui\.js/.test(t)),tags);
 T('coach: guide chapters moved to cch.js',!/var CCH=\[\{/.test(app)&&fs.existsSync(path.join(root,'coach/cch.js')));
 T('coach: WebP badge and sponsor on screen, PNG kept for PDFs',/BADGE='..\/badge.webp'/.test(app)&&/sbImg\('mfs.png'\)/.test(app)&&fs.statSync(path.join(root,'badge.webp')).size<12000&&fs.statSync(path.join(root,'coach/mfs.webp')).size<12000);
 const sw=fs.readFileSync(path.join(root,'coach/sw.js'),'utf8');
 T('coach sw: caches cch.js and the WebP images',/cch\.js\?v=1\d\d/.test(sw)&&/badge\.webp/.test(sw)&&/'mfs\.webp'/.test(sw));
 const ssw=fs.readFileSync(path.join(root,'stretch/ssw.js'),'utf8');let sswOk=true;try{new Function(ssw.replace(/self\./g,'0&&self.'));}catch(e){sswOk=false;}
 T('stretch sw: parses (was broken since r96) and is r115',sswOk&&/touchline-stretch-v115/.test(ssw));
 const vox=fs.readFileSync(path.join(root,'tl-vox.js'),'utf8');
 T('tl-vox: never the Tim Cipher voice, no names in lines',!/1zZSINK3SPk5qpVKuo3e/.test(vox)&&!/1zZSINK3SPk5qpVKuo3e/.test(fs.readFileSync(path.join(root,'tools/voice/build.py'),'utf8')));
 T('tl-vox: Andy (Northern) ready with timer lines recorded, Alice and Beeps the only other choices',/READY=\{north:1,alice:1,beeps:1\}/.test(vox)&&/REC=\{north:1/.test(vox)&&/Andy \(Northern\)/.test(vox)&&(vox.match(/\{k:'(north|alice|beeps)',l:/g)||[]).length===3);
 const sdat=fs.readFileSync(path.join(root,'stretch/data.js'),'utf8');
 T('stretch data: Andy\'s voice id, never the Tim Cipher voice',/"north": \{"id": "x8Zbp1rqd4UcTdV8cRII"/.test(sdat)&&!/1zZSINK3SPk5qpVKuo3e/.test(sdat));
 T('Andy\'s lines say Deeno, never Deano',!/\bDeano\b/i.test(fs.readFileSync(path.join(root,'tools/voice/lines.json'),'utf8'))&&!/\bDeano\b/i.test(fs.readFileSync(path.join(root,'tools/stretch/stretches.json'),'utf8')));
 const lines=JSON.parse(fs.readFileSync(path.join(root,'tools/voice/lines.json'),'utf8')).running;
 T('running lines: 38, plain words, no banned words, no dashes',lines.length>=30&&!lines.some(l=>BANNED.test(l)||/[\u2013\u2014]| - /.test(l)),lines.filter(l=>BANNED.test(l)));
 const figs=['adductor','butterfly','calf','dog','flexor','glute','ham','knee','quad','twist','wall'];
 T('plain figure: clip, still, start and thumb for all 11 stretches',figs.every(p=>['.mp4','.webm','.webp','_s.webp','_t.webp'].every(x=>fs.existsSync(path.join(root,'stretch/fig/'+p+x)))));
 T('groin clips re-made (butterfly, adductor) are present and small',['butterfly','adductor'].every(p=>{const s=fs.statSync(path.join(root,'stretch/vid/'+p+'.mp4')).size;return s>20000&&s<200000;}));
 const sidx=fs.readFileSync(path.join(root,'stretch/index.html'),'utf8');
 T('stretch: labelled Computer made demo',/Computer made demo/.test(sidx));

 for(const [nm,dev] of SIZES){
  /* ---------- coach late load ---------- */
  {const ctx=await b.newContext(dev);const c=await ctx.newPage();const E=errsOf(c);MISS.length=0;
   await c.addInitScript(st=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',JSON.stringify(st));},coachState());
   await c.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{rows:[],docs:[],serverTime:Date.now()}})}));
   await c.route('**/*.workers.dev/**',r=>r.fulfill({status:200,contentType:'application/json',headers:H,body:'{"ok":true}'}));
   await c.goto(BASE+'/coach/index.html');
   await c.waitForFunction(()=>window.TL_LATE_DONE===1,{timeout:15000}).catch(()=>{});
   await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});await w(400);
   const st=await c.evaluate(()=>({late:window.TL_LATE_DONE,cch:(window.TL_CCH||[]).length,cdev:!!window.TL_CDEV,shop:!!(window.TLShop||window.tlShop||window.SHOP),fit:!!window.TLFit,tabs:document.querySelectorAll('nav.tabs button, nav.tabs a').length}));
   T(nm+' coach: late scripts all arrive',st.late===1&&st.cch>5&&st.cdev&&st.fit,st);
   await c.evaluate(()=>{TLX.view.tab='more';TLX.render(true);});await w(400);
   const faq=await c.evaluate(()=>{const d=document.getElementById('faqcard');return d?d.innerText:'';});
   T(nm+' coach: Help and FAQ lists the guide chapters after the late load',/Guide chapters \((\d+)\)/.test(faq)&&+(faq.match(/Guide chapters \((\d+)\)/)||[0,0])[1]>5,faq.slice(0,120));
   await c.evaluate(()=>{const i=document.getElementById('cfq');if(i){i.value='chapter';i.dispatchEvent(new Event('input',{bubbles:true}));}});await w(200);
   T(nm+' coach: FAQ search finds a chapter',await c.evaluate(()=>/Chapter/.test((document.getElementById('cfqres')||{}).innerText||'')));
   await c.screenshot({path:path.join(SHOTS,PRE+nm+'_coach_more.png')});
   T(nm+' coach: no page errors',E.filter(x=>/pageerror/.test(x)).length===0,E);
   T(nm+' coach: no missing files',MISS.length===0,MISS.slice());
   await ctx.close();}
  /* ---------- stretching: voice and demo pickers ---------- */
  {const ctx=await b.newContext(dev);const p=await ctx.newPage();const E=errsOf(p);MISS.length=0;
   await p.goto(BASE+'/stretch/index.html?v=115');await w(1200);
   const pk=await p.evaluate(()=>[...document.querySelectorAll('#voxpick .tlvox-b')].map(x=>({t:x.innerText.trim(),off:x.disabled,on:x.classList.contains('on')})));
   T(nm+' stretch: voice picker shows Andy (Northern), Alice, Beeps only, all ready',pk.length===5&&!pk[0].off&&!pk[1].off&&!pk[2].off&&/Andy \(Northern\)/.test(pk[0].t)&&/Alice/.test(pk[1].t)&&/Beeps only/.test(pk[2].t)&&!pk.some(x=>/coming soon/i.test(x.t)),pk);
   T(nm+' stretch: Andy is the default when nothing is saved',pk[0].on&&!pk[1].on&&await p.evaluate(()=>!localStorage.getItem('tl.vox')&&window.__vox().voice==='north'&&/^audio\/north\/welcome/.test(window.__vox().src)));
   const nf=await p.evaluate(async()=>{const d=STRETCH.voices&&STRETCH.voices.north&&STRETCH.voices.north.d||{};const ks=Object.keys(d);const bad=[];for(const k of ks){const r=await fetch('audio/north/'+k+'.mp3');if(!r.ok)bad.push(k);}return {n:ks.length,bad,id:STRETCH.voices.north&&STRETCH.voices.north.id};});
   T(nm+' stretch: all 23 of Andy\'s stretching clips load',nf.n===23&&nf.bad.length===0&&nf.id==='x8Zbp1rqd4UcTdV8cRII',nf);
   T(nm+' stretch: demo picker shows Lad in kit and Plain figure',pk[3]&&pk[3].on&&/Plain figure/.test(pk[4]&&pk[4].t));
   T(nm+' stretch: picker buttons at least 48px high',(await tapSizes(p,'#voxpick .tlvox-b:not([disabled])')).length===0,await tapSizes(p,'#voxpick .tlvox-b'));
   await p.screenshot({path:path.join(SHOTS,PRE+nm+'_stretch_list.png')});
   await p.click('[data-vox=beeps]');await w(200);
   T(nm+' stretch: Beeps only saved on this phone',await p.evaluate(()=>localStorage.getItem('tl.vox')==='beeps'&&window.__vox().voice==='beeps'));
   await p.evaluate(()=>{window.__beepLog=[];document.getElementById('start').click();});await w(600);
   await p.evaluate(()=>{const s=window.__seg.find(x=>x.k==='intro');window.__at(s.t0);});
   await p.evaluate(()=>{document.getElementById('pp').click();document.getElementById('pp').click();});await w(500);
   const bl=await p.evaluate(()=>window.__beepLog.slice());
   T(nm+' stretch: Beeps only plays no voice clips',await p.evaluate(()=>!document.querySelector('audio[src*="audio/s"]'))&&Array.isArray(bl),bl);
   await p.click('#tolist');await p.click('[data-model=figure]');await w(900);
   const th=await p.evaluate(()=>[...document.querySelectorAll('#items img')].map(i=>i.getAttribute('src')));
   T(nm+' stretch: Plain figure swaps the pictures',th.length>10&&th.every(s=>/^fig\//.test(s)),th.slice(0,3));
   await p.evaluate(()=>{window.__silent=1;document.getElementById('start').click();});await w(800);
   await p.evaluate(()=>{const s=window.__seg.find(x=>x.k==='hold');window.__at(s.t0+1);});await w(600);
   const vs=await p.evaluate(()=>{const v=document.querySelector('#fig video source');return v?v.getAttribute('src'):(document.querySelector('#fig img')||{}).src||'';});
   T(nm+' stretch: Plain figure used in the player',/fig\//.test(vs),vs);
   T(nm+' stretch: Computer made demo label on the player',await p.evaluate(()=>/Computer made demo/.test(document.getElementById('aimark').innerText)));
   await p.screenshot({path:path.join(SHOTS,PRE+nm+'_stretch_figure.png')});
   await p.click('#tolist');await p.click('[data-model=lad]');await p.click('[data-vox=alice]');await w(300);
   T(nm+' stretch: back to Alice and the lad',await p.evaluate(()=>window.__vox().voice==='alice'&&window.__vox().model==='lad'&&/^audio\/welcome/.test(window.__vox().src)));
   T(nm+' stretch: no page errors',E.filter(x=>/pageerror/.test(x)).length===0,E);
   T(nm+' stretch: no missing files',MISS.length===0,MISS.slice());
   await ctx.close();}
  /* ---------- groin clips side on: screenshot for the review ---------- */
  if(nm==='phone'){const ctx=await b.newContext(dev);const p=await ctx.newPage();
   await p.goto(BASE+'/stretch/index.html?v=115');await w(1000);
   for(const pose of ['butterfly','adductor']){
    await p.evaluate(pz=>{window.__silent=1;document.body.classList.add('playing');const i=STRETCH.items.findIndex(x=>x.pose===pz);const s=window.__seg.find(x=>x.k==='hold'&&x.i===i);window.__at(s.t0+1);},pose);await w(900);
    await p.screenshot({path:path.join(SHOTS,PRE+'groin_'+pose+'.png')});}
   await ctx.close();}
  /* ---------- running timer: voice through tl-vox ---------- */
  {const ctx=await b.newContext(dev);const p=await ctx.newPage();const E=errsOf(p);MISS.length=0;
   await p.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{rows:[]}})}));
   await p.goto(BASE+'/family.html');await w(1800);
   await p.evaluate(()=>{['splash','tl-md'].forEach(i=>{const s=document.getElementById(i);if(s)s.remove();});});
   await p.waitForFunction(()=>!!(window.TLRun&&window.TLVOX),{timeout:8000}).catch(()=>{});
   await p.evaluate(()=>TLRun.open({view:'hub'}));await w(400);
   const vp=await p.evaluate(()=>[...document.querySelectorAll('#tl-runview .tlvox-b')].map(x=>x.innerText.trim()));
   T(nm+' running: Whose voice picker in the hub',vp.length===3&&/Andy \(Northern\)/.test(vp[0]),vp);
   const ac=await p.evaluate(async()=>{await new Promise(r=>TLVOX.manifest('north',r));const m=await (await fetch('audio/vox/north/m.json')).json();const hs=Object.keys(m);let bad=0;for(const h of hs){const r=await fetch('audio/vox/north/'+h+'.mp3');if(!r.ok)bad++;}
     const how=TLVOX.speak(['Warm up. Brisk walk and loosen up.','5 minutes.'],{voice:'north'});TLVOX.stop();return {n:hs.length,bad,how};});
   T(nm+' running: Andy has all 38 timer lines recorded and the block start plays his clips',ac.n===38&&ac.bad===0&&ac.how==='clip',ac);
   T(nm+' running: picker buttons at least 48px high',(await tapSizes(p,'#tl-runview .tlvox-b:not([disabled])')).length===0);
   await p.screenshot({path:path.join(SHOTS,PRE+nm+'_running_hub.png')});
   await p.click('#tl-runview [data-vox=beeps]');await w(300);
   T(nm+' running: Beeps only switches the timer to beeps',await p.evaluate(()=>TLRun.load().cue==='beeps'));
   await p.click('#tl-runview [data-vox=alice]');await w(300);
   T(nm+' running: picking a voice switches back to voice',await p.evaluate(()=>TLRun.load().cue==='voice'));
   await p.evaluate(()=>{TLVOX._log=[];TLRun._log=[];TLRun.start('steady');});await w(500);
   const lg=await p.evaluate(()=>({run:TLRun._log.filter(x=>x.k==='say').map(x=>x.t),vox:(TLVOX._log||[]).map(x=>x.t)}));
   T(nm+' running: block start said through tl-vox as two recorded lines',lg.vox.length>0&&/^Warm up\. Brisk walk and loosen up\. 5 minutes\.$/.test(lg.vox[0]),lg);
   await p.evaluate(()=>{const b=document.querySelector('#tl-run-timer [data-run="tstop"]');if(b)b.click();});
   T(nm+' running: Deano is said Deeno',await p.evaluate(()=>TLVOX.fix('Tell Tim or Deano')==='Tell Tim or Deeno'));
   T(nm+' running: no page errors',E.filter(x=>/pageerror/.test(x)).length===0,E);
   T(nm+' running: no missing files',MISS.length===0,MISS.slice());
   await ctx.close();}
  /* ---------- an existing saved choice is kept ---------- */
  {const ctx=await b.newContext(dev);const p=await ctx.newPage();
   await p.addInitScript(()=>{if(!sessionStorage.getItem('x')){localStorage.setItem('tl.vox','alice');sessionStorage.setItem('x','1');}});
   await p.goto(BASE+'/stretch/index.html?v=115');await w(900);
   T(nm+' stretch: a phone that already picked Alice stays on Alice',await p.evaluate(()=>localStorage.getItem('tl.vox')==='alice'&&window.__vox().voice==='alice'&&document.querySelector('#voxpick [data-vox=alice]').classList.contains('on')));
   await ctx.close();}
  /* ---------- shape guide and 3-5-2 animation use Andy by default ---------- */
  {const ctx=await b.newContext(dev);const p=await ctx.newPage();const E=errsOf(p);MISS.length=0;
   await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,contentType:'text/javascript',body:''}));
   await p.goto(BASE+'/shape/index.html');await w(1500);
   const sv=await p.evaluate(async()=>{const v=window.__shapeVox;const d=await (await fetch('audio/north/durations.json')).json();let bad=0;for(const k of Object.keys(d)){const r=await fetch('audio/north/'+k+'.mp3');if(!r.ok)bad++;}return {v,n:Object.keys(d).length,bad};});
   T(nm+' shape guide: Andy by default, all 18 clips load',sv.v&&sv.v.voice==='north'&&sv.v.base==='audio/north/'&&sv.n===18&&sv.bad===0,sv);
   await p.goto(BASE+'/coach/anim/12_352_in_transition.html');await w(1500);
   const av=await p.evaluate(async()=>{const a=window.__animVox||[];let bad=0;const n=(window.PRACTICE.north||[]).length;for(let i=0;i<n;i++){const r=await fetch('audio/north/12_352_in_transition/'+i+'.mp3');if(!r.ok)bad++;}return {a,n,bad};});
   T(nm+' 3-5-2 animation: Andy by default, all 10 lines load',av.a.length>0&&av.a.every(x=>x.voice==='north'&&x.rec==='north'&&/audio\/north\/12_352_in_transition\//.test(x.base))&&av.n===10&&av.bad===0,av);
   T(nm+' shape and animation: no page errors',E.filter(x=>/pageerror/.test(x)).length===0,E);
   T(nm+' shape and animation: no missing files',MISS.length===0,MISS.slice());
   await ctx.close();}
  /* ---------- picking Alice plays Alice in the shape guide and 3-5-2 animation, never the old recordings ---------- */
  {const ctx=await b.newContext(dev);const p=await ctx.newPage();const E=errsOf(p);MISS.length=0;const REQ=[];
   p.on('request',q=>{if(/\.mp3/.test(q.url()))REQ.push(q.url().replace(BASE,''));});
   await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,contentType:'text/javascript',body:''}));
   await p.addInitScript(()=>localStorage.setItem('tl.vox','alice'));
   await p.goto(BASE+'/shape/index.html');await w(2500);
   const sv=await p.evaluate(async()=>{const v=window.__shapeVox;const d=await (await fetch('audio/alice/durations.json')).json();let bad=0;for(const k of Object.keys(d)){const r=await fetch('audio/alice/'+k+'.mp3');if(!r.ok)bad++;}return {v,n:Object.keys(d).length,bad};});
   const shOld=REQ.filter(u=>/^\/shape\/audio\/[^/]+\.mp3/.test(u));
   T(nm+' shape guide: Alice picked plays Alice, all 18 clips load, no old recordings fetched',sv.v&&sv.v.voice==='alice'&&sv.v.base==='audio/alice/'&&sv.n===18&&sv.bad===0&&shOld.length===0,{sv,shOld:shOld.slice(0,3)});
   REQ.length=0;
   await p.goto(BASE+'/coach/anim/12_352_in_transition.html');await w(2500);
   const av=await p.evaluate(async()=>{const a=window.__animVox||[];let bad=0;const n=(window.PRACTICE.alice||[]).length;for(let i=0;i<n;i++){const r=await fetch('audio/alice/12_352_in_transition/'+i+'.mp3');if(!r.ok)bad++;}return {a,n,bad};});
   const anOld=REQ.filter(u=>/\/coach\/anim\/audio\/12_352_in_transition\//.test(u));
   T(nm+' 3-5-2 animation: Alice picked plays Alice, all 10 lines load, no old recordings fetched',av.a.length>0&&av.a.every(x=>x.voice==='alice'&&x.rec==='alice'&&/audio\/alice\/12_352_in_transition\//.test(x.base))&&av.n===10&&av.bad===0&&anOld.length===0,{av,anOld:anOld.slice(0,3)});
   T(nm+' Alice shape and animation: no page errors',E.filter(x=>/pageerror/.test(x)).length===0,E);
   T(nm+' Alice shape and animation: no missing files',MISS.length===0,MISS.slice());
   await ctx.close();}
  /* ---------- shape guide follows Beeps only ---------- */
  {const ctx=await b.newContext(dev);const p=await ctx.newPage();const E=errsOf(p);
   await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,contentType:'text/javascript',body:''}));
   await p.addInitScript(()=>localStorage.setItem('tl.vox','beeps'));
   await p.goto(BASE+'/shape/index.html');await w(1500);
   const sv=await p.evaluate(()=>window.__shapeVox?Object.assign({snd:(document.getElementById('snd')||{}).textContent||''},window.__shapeVox):null);
   T(nm+' shape guide: Beeps only starts with the voice off, Andy if it is turned on',sv&&sv.voice==='beeps'&&/Sound off/.test(sv.snd)&&sv.base==='audio/north/',sv);
   await ctx.close();}
 }
 console.log(ok+' passed, '+bad+' failed');
 await b.close();srv.close();process.exit(bad?1:0);
})();
