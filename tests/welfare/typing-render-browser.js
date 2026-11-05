/* r83: typing in a coach box must survive background syncs and re-renders (no wipe, no jump, focus kept). PORT env, default 8794. */
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');const PORT=+process.env.PORT||8794;
const srv=http.createServer((q,r)=>{const u=q.url.split('?')[0];if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end('{"v":"90"}');return;}let f=path.join(root,decodeURIComponent(u));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':'text/html'});r.end(d);});}).listen(PORT);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
(async()=>{const b=await chromium.launch();
for(const vp of [{width:1366,height:800},{width:390,height:844}]){
 const ctx=await b.newContext({viewport:vp});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message+' @ '+String(e.stack).split('\n').slice(1,3).join(' ')));let syncs=0;
 await p.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}')}catch(e){}if(a.action!=='sync')return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"ok":false,"error":"not mocked"}'});syncs++;
  r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true,data:{docs:[{kind:'settings',id:'main',updatedAt:Date.now(),json:JSON.stringify({id:'main',half:35,subEvery:17,roles:{},updatedAt:Date.now()})}],serverTime:Date.now()}})});});
 await p.addInitScript(()=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:{},matches:{},settings:{id:'main',half:35,subEvery:17,roles:{},updatedAt:0},dirty:{},lastSync:1}));});
 await p.goto('http://localhost:'+PORT+'/coach/index.html');await p.waitForTimeout(1500);
 await p.evaluate(()=>{const b=document.querySelector('[data-act=tab][data-v=train]');b&&b.click();});await p.waitForTimeout(300);
 await p.evaluate(()=>{const b=document.querySelector('nav.tabs [data-act=tab][data-v=pos][data-m=lib]');b&&b.click();});await p.waitForTimeout(300);
 await p.evaluate(()=>{const b=[...document.querySelectorAll('[data-act=tab]')].find(x=>x.dataset.v==='sess');b&&b.click();});await p.waitForTimeout(500);
 let sel=await p.evaluate(()=>{const i=[...document.querySelectorAll('#root input:not([type]),#root input[type=text],#root textarea')].filter(x=>x.offsetParent)[0];if(!i)return null;i.scrollIntoView({block:'center'});return '#'+i.id;});
 T('found a text box to type in ('+vp.width+')',!!sel);if(!sel){await ctx.close();continue;}
 await p.click(sel);const y0=await p.evaluate(()=>scrollY);const msg='Bring bibs and the pop up goals for Wednesday';
 for(let k=0;k<msg.length;k++){await p.keyboard.type(msg[k]);if(k%8===0)await p.evaluate(()=>{window.dispatchEvent(new Event('online'));});await p.waitForTimeout(25);}
 await p.waitForTimeout(800);
 const st=await p.evaluate(s=>{const a=document.activeElement;return {v:(document.querySelector(s)||{}).value,focused:a===document.querySelector(s),y:scrollY};},sel);
 T('syncs fired while typing ('+syncs+')',syncs>=3);
 T('text kept while syncs fire ('+vp.width+')',st.v===msg);T('box keeps focus ('+vp.width+')',st.focused);T('page did not jump ('+vp.width+')',Math.abs(st.y-y0)<2);
 await p.evaluate(()=>document.activeElement.blur());await p.waitForTimeout(700);
 const after=await p.evaluate(()=>[...document.querySelectorAll('#root input,#root textarea')].some(x=>x.value==='Bring bibs and the pop up goals for Wednesday'));
 T('draft kept after the deferred refresh ('+vp.width+')',after);T('no page errors '+errs.slice(0,3).join(' | '),errs.length===0);
 await p.screenshot({path:'/workspace/shots/typing_'+vp.width+'.png'});await ctx.close();}
console.log(ok+' passed, '+bad+' failed');await b.close();srv.close();process.exit(bad?1:0);})();
