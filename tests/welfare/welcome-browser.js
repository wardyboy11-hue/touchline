// First sign in welcome screen on family.html (parents and players). Fakes the backend. Saves screenshots if SHOTS is set.
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),SHOTS=process.env.SHOTS||'';
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':f.endsWith('.json')?'application/json':f.endsWith('.jpg')?'image/jpeg':'application/octet-stream'});r.end(d);});}).listen(8774);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
const X={news:[{t:'Great win at Ashton. Brilliant team shape in the second half.',d:'2026-10-25'},{t:'Training moves to 6pm on Wednesday.',d:'2026-10-27'}],fixtures:[{id:'m1',done:true,date:'2026-10-25',opp:'Ashton Athletic',ha:'A',f:3,a:1,comp:'League'}]};
(async()=>{const b=await chromium.launch();if(SHOTS)fs.mkdirSync(SHOTS,{recursive:true});
for(const role of ['parent','player']){
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const q=await ctx.newPage();const errs=[];q.on('pageerror',e=>errs.push(e.message));
 let saved=null,signed=null;
 await q.route('**/macros/**',async r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}')}catch(e){}
  const okk=d=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});
  if(a.action==='f.home')return okk({first:'Sam',role,x:X,posts:[],res:[],tips:[]});
  if(a.action==='f.name.get')return okk({name:saved||''});
  if(a.action==='f.name.set'){saved=a.name;return okk({name:a.name});}
  if(a.action==='f.respect.get')return okk({season:'2026/27',who:role,signed:signed?{name:signed,date:'2026-11-01'}:null});
  if(a.action==='f.respect.sign'){signed=a.name||'Sam';return okk({ok:true});}
  return okk({});});
 await q.addInitScript((c)=>{if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');localStorage.setItem('fam.code',c);localStorage.setItem('fam.ok1','1');}},role==='parent'?'PAR123':'PLA123');
 await q.goto('http://localhost:8774/family.html');await q.waitForTimeout(1800);
 let tx=await q.innerText('body');
 const vid=await q.$('#welcome video');
 T(role+': welcome shows first with the tour video',!!vid&&await vid.evaluate((v,f)=>!v.autoplay&&v.hasAttribute('playsinline')&&v.innerHTML.indexOf(f)>-1,role==='parent'?'guide_parents':'guide_players'));
 T(role+': hello uses the first name',/Sam/.test(tx)&&/Welcome to Touchline/.test(tx));
 T(role+': last week news shown',/Great win at Ashton/.test(tx));
 T(role+': quote of the week with source',/This week/i.test(tx)&&!!(await q.$('#welcome ~ .card blockquote a[href^="http"]')));
 T(role+': name box only for parents',role==='parent'?!!(await q.$('#welname')):!(await q.$('#welname')));
 if(SHOTS){await q.screenshot({path:path.join(SHOTS,role+'-welcome-top.png')});await q.screenshot({path:path.join(SHOTS,role+'-welcome-full.png'),fullPage:true});}
 if(role==='parent'){
  await q.fill('#welname','Pat, Sam\'s dad');await q.click('#welgo');await q.waitForTimeout(800);
  T('parent: Continue saves the name',saved==='Pat, Sam\'s dad');
  tx=await q.innerText('body');T('parent: Respect code step follows',/Parents Respect code/.test(tx)&&!!(await q.$('#welrsskip')));
  if(SHOTS)await q.screenshot({path:path.join(SHOTS,'parent-respect-step.png'),fullPage:true});
  await q.click('#welrsskip');await q.waitForTimeout(500);tx=await q.innerText('body');
  T('parent: skip Respect goes Home, tour card at the top',!(await q.$('#welrsskip'))&&/Watch the 5 minute tour/.test(tx)&&(await q.evaluate(()=>{var c=document.querySelector('#root>.card');return c&&/5 minute tour/.test(c.innerText);})));
  if(SHOTS)await q.screenshot({path:path.join(SHOTS,'parent-home-after.png')});
  await q.reload();await q.waitForTimeout(1500);T('parent: welcome not shown again after reload',!(await q.$('#welcome')));
  T('parent: name never shown on family pages',!/Pat, Sam/.test(await q.innerText('body')));
  await q.evaluate(()=>goTab('data'));await q.waitForTimeout(800);tx=await q.innerText('body');
  T('parent: My data lists the name with Clear',/Pat, Sam's dad/.test(tx)&&!!(await q.$('#mdnameclear')));
  q.once('dialog',d=>d.accept());await q.click('#mdnameclear');await q.waitForTimeout(500);T('parent: Clear sends empty name',saved==='');
  await q.evaluate(()=>{goTab('me');showHelp=true;r();});await q.click('#welagain');await q.waitForTimeout(400);T('parent: See the welcome again works',!!(await q.$('#welcome')));
 }else{
  await q.click('#welskip');await q.waitForTimeout(500);T('player: Skip goes straight Home',!(await q.$('#welcome'))&&!(await q.$('#welrsskip')));
 }
 T(role+': no page errors',errs.length===0);if(errs.length)console.log(errs);await ctx.close();}
console.log(ok+' passed, '+bad+' failed');await b.close();srv.close();process.exit(bad?1:0);})();
