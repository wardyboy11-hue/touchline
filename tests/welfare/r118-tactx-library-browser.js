// r118 preview: Tactx titles appear as link-only cards in the coach Library and Resources.
// Fake backend and pretend names only. Nothing real is sent.
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=process.env.ROOT||path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8860,BASE='http://localhost:'+PORT,H={'access-control-allow-origin':'*'};
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.webmanifest':'application/json','.jpg':'image/jpeg'};
const RUN=(fs.readFileSync(path.join(root,'update.js'),'utf8').match(/RUN='(\d+)'/)||[])[1];
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end(JSON.stringify({v:RUN}));return;}let f=path.join(root,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};const w=ms=>new Promise(r=>setTimeout(r,ms));
const SHOTS=process.env.SHOTS||'';if(SHOTS)fs.mkdirSync(SHOTS,{recursive:true});const shot=async(p,n)=>{if(SHOTS)await p.screenshot({path:path.join(SHOTS,n+'.png'),fullPage:true});};
const coachState=()=>({ideas:{},players:{p1:{id:'p1',name:'Alex One',num:'7',active:true}},matches:{},settings:{id:'main',half:35,roles:{},posts:[],sched:{trainDay:2,trainStart:'20:00',trainEnd:'21:00',trainMins:60,matchDay:5,half:35,meetBefore:30,maxPersonal:2},updatedAt:0},dirty:{},lastSync:Date.now()});
(async()=>{
  const b=await chromium.launch();
  const errsOf=p=>{const E=[];p.on('pageerror',e=>E.push(String(e)));p.on('console',m=>{if(m.type()==='error')E.push(m.text());});return E;};
  // Phone: Library
  const ph=devices['Pixel 7'];
  const ctx=await b.newContext({...ph});const c=await ctx.newPage();const E=errsOf(c);
  await c.addInitScript(st=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',JSON.stringify(st));},coachState());
  await c.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{rows:[]}})}));
  await c.goto(BASE+'/coach/index.html#/rl');await w(2500);
  await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
  await c.evaluate(()=>{location.hash='#/rl';});
  await c.waitForFunction(()=>/Library/.test(document.body.innerText||'')&&!!window.LIBL, {timeout:8000}).catch(()=>{});
  await w(400);
  await c.evaluate(()=>{const b=[...document.querySelectorAll('button.chip, button')].find(x=>/^Tactx$/.test((x.textContent||'').trim()));if(b)b.click();});
  await w(500);
  const lib=await c.evaluate(()=>{
    const t=document.body.innerText||'';
    const links=[...document.querySelectorAll('a[href*="tactxcoach.com/programs/"]')].map(a=>a.getAttribute('href'));
    const iframe=[...document.querySelectorAll('iframe')].filter(i=>/tactxcoach|uscreencdn/.test(i.src||''));
    return {t,links,iframes:iframe.length,hasWarm:/WARM-UP PRACTICES/.test(t)||/Warm-Up Practices/.test(t)||/WARM-UP PRACTICES - SEASON 1/.test(t),hasPaid:/paid/i.test(t)||/Paid/.test(t),hasTactx:/Tactx/.test(t),shown:/of \d+ shown/.test(t)? (t.match(/(\d+) of (\d+) shown/)||[]) : []};
  });
  T('library names Tactx', lib.hasTactx);
  T('library has Tactx programme links', lib.links.length>0);
  T('library does not embed Tactx media', lib.iframes===0);
  T('library can show a known free title', lib.hasWarm);
  await shot(c,'phone-library-tactx');
  T('coach library zero console errors', E.length===0); if(E.length) console.log(E);
  // Phone: Resources
  await c.evaluate(()=>{location.hash='#/res';});
  await c.waitForFunction(()=>!!window.RD||/Resources/.test(document.body.innerText||''), {timeout:8000}).catch(()=>{});
  await w(800);
  await c.evaluate(()=>{const b=[...document.querySelectorAll('button, .chip')].find(x=>/^Tactx$/.test((x.textContent||'').trim()));if(b)b.click();});
  await w(600);
  const res=await c.evaluate(()=>{
    const t=document.body.innerText||'';
    const links=[...document.querySelectorAll('a[href*="tactxcoach.com/programs/"]')].map(a=>a.getAttribute('href'));
    return {t,links,hasTactx:/Tactx/.test(t),hasTitle:/WARM-UP PRACTICES|Playing Out|High Press|GOALKEEPING/.test(t)};
  });
  T('resources names Tactx', res.hasTactx);
  T('resources lists Tactx titles or links', res.links.length>0||res.hasTitle);
  await shot(c,'phone-resources-tactx');
  await ctx.close();

  // PC Library
  const ctx2=await b.newContext({viewport:{width:1366,height:900}});const p=await ctx2.newPage();const E2=errsOf(p);
  await p.addInitScript(st=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',JSON.stringify(st));},coachState());
  await p.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{rows:[]}})}));
  await p.goto(BASE+'/coach/index.html#/rl');await w(2500);
  await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();location.hash='#/rl';});
  await p.waitForFunction(()=>/Library/.test(document.body.innerText||'')&&!!window.LIBL, {timeout:8000}).catch(()=>{});
  await w(400);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button.chip, button')].find(x=>/^Tactx$/.test((x.textContent||'').trim()));if(b)b.click();});
  await w(500);
  const pc=await p.evaluate(()=>({links:[...document.querySelectorAll('a[href*="tactxcoach.com/programs/"]')].length,tactx:/Tactx/.test(document.body.innerText)}));
  T('pc library shows Tactx links', pc.links>0 && pc.tactx);
  await shot(p,'pc-library-tactx');
  await p.evaluate(()=>{location.hash='#/res';});
  await p.waitForFunction(()=>!!window.RD||/Resources/.test(document.body.innerText||''), {timeout:8000}).catch(()=>{});
  await w(800);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button, .chip')].find(x=>/^Tactx$/.test((x.textContent||'').trim()));if(b)b.click();});
  await w(600);
  const pcr=await p.evaluate(()=>({tactx:/Tactx/.test(document.body.innerText),links:[...document.querySelectorAll('a[href*="tactxcoach.com/programs/"]')].length,txt:document.body.innerText.slice(0,500)}));
  T('pc resources names Tactx', pcr.tactx);
  await shot(p,'pc-resources-tactx');
  T('pc zero console errors', E2.length===0); if(E2.length) console.log(E2);
  await ctx2.close();

  // Family page must not list unapproved coach-only Tactx rows
  const ctx3=await b.newContext({...ph});const f=await ctx3.newPage();const E3=errsOf(f);
  await f.addInitScript(()=>{localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.P','1');localStorage.setItem('fam.tour','1');});
  await f.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{rows:[]}})}));
  await f.goto(BASE+'/family.html');await w(2500);
  const fam=await f.evaluate(()=>{
    const t=document.body.innerText||'';
    const links=[...document.querySelectorAll('a[href*="tactxcoach.com"]')].length;
    return {links,leaks:/tactxcoach\.com/.test(t)||/WARM-UP PRACTICES - SEASON 1/.test(t)};
  });
  T('family page has no Tactx programme links', fam.links===0 && !fam.leaks);
  await shot(f,'phone-family-no-tactx');
  T('family zero console errors', E3.length===0); if(E3.length) console.log(E3);
  await ctx3.close();

  await b.close();srv.close();
  console.log(ok+' passed, '+bad+' failed');
  process.exit(bad?1:0);
})().catch(e=>{console.error(e);try{srv.close();}catch(x){}process.exit(1);});
