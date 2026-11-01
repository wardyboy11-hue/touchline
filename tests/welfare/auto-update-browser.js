const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');let VER='76';
const srv=http.createServer((q,r)=>{const u=q.url.split('?')[0];if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end(JSON.stringify({v:VER}));return;}let f=path.join(root,decodeURIComponent(u));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':'text/html'});r.end(d);});}).listen(8773);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
(async()=>{const b=await chromium.launch();
async function run(name,setup,expectReload){
 const ctx=await b.newContext();const q=await ctx.newPage();let loads=0;q.on('load',()=>loads++);
 await q.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true,data:{docs:[],serverTime:1}})}));
 await q.addInitScript(setup);await q.goto('http://localhost:8773/family.html');
 if(/typing/.test(name))await q.evaluate(()=>{var i=document.createElement('input');i.id='tt';document.body.appendChild(i);i.focus();});
 await q.waitForTimeout(4500);T(name,expectReload?loads>=2:loads===1);await ctx.close();}
VER='77';await run('newer version on the server refreshes the app',()=>{},true);
VER='76';await run('same version does not refresh',()=>{},false);
VER='76';await run('does not refresh while typing in a box',()=>{},false);
VER='76';await run('does not refresh with unsynced coach changes',()=>{localStorage.setItem('tl.state.v1',JSON.stringify({players:{},dirty:{a:1}}));},false);
console.log(ok+' passed, '+bad+' failed');await b.close();srv.close();process.exit(bad?1:0);})();
