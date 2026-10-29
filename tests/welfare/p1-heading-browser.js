const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':'text/css'});r.end(d);});}).listen(8768);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:false,error:'nope'})}));
const d0=new Date();const iso=x=>x.toISOString().slice(0,10);
const today=iso(d0);
await p.addInitScript(([t])=>{localStorage.setItem('tl.code','x');
const rc=(s)=>({out:['can do a'],pts:['say b'],qs:[],prac:[{slot:'Practice one',mins:10,t:'Drill A',lead:'Tim',u:'https://x.y',a:false},{slot:'Main practice',mins:20,t:'Drill B',lead:'Deano',u:'https://x.y',a:false}]});
localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:{},matches:{},settings:{id:'main',half:35,subEvery:17,roles:{},updatedAt:0,sessions:[{id:'t1',date:t,title:'Test one',time:'19:00',files:[],videos:[],rc:rc()},{id:'t2',date:t,title:'Test two',time:'19:00',files:[],videos:[],rc:rc()}],heading:{}},dirty:{},lastSync:Date.now()}));},[today]);
await p.goto('http://localhost:8768/coach/index.html');await p.waitForTimeout(700);
await p.click('nav.tabs >> text=Train');await p.waitForTimeout(500);
let t=await p.innerText('#root');
console.log(t.slice(0,150).replace(/\n/g,' | '));
T('run card shows heading card',/heading/i.test(t)&&/Practice one: none/.test(t));
const chip=()=>p.click('button.chip:has-text("Main practice: ")');
await chip();await p.waitForTimeout(150);await chip();await p.waitForTimeout(150);
t=await p.innerText('#root');T('two taps = 10 headers',/Main practice: 10 headers/.test(t)&&/Total: 10 headers/i.test(t)&&!/no more than 10 a session for/i.test(t.split('Total')[1]||''));
await chip();await p.waitForTimeout(150);t=await p.innerText('#root');T('third tap = 15 and warns over 10',/Total: 15/i.test(t)&&/no more than 10 a session/i.test(t));
// second session same week
await p.click('.chip:has-text("Practice one")');await p.waitForTimeout(150);
const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('tl.state.v1')).settings.heading);
T('counts stored with date, no names',Object.keys(st).length===1&&Object.values(st)[0].date.length===10);
// switch to other session (runPick) and tick heading
await p.evaluate(()=>{});
await p.click('[data-act=runPick][data-id=t1]');await p.waitForTimeout(250);await p.click('button.chip:has-text("Practice one: ")');await p.waitForTimeout(200);t=await p.innerText('#root');T('second heading session in the week warns',/second heading session/i.test(t));await p.click('[data-act=runPick][data-id=t2]');await p.waitForTimeout(200);t=await p.innerText('#root');T('and the first one now warns too',/second heading session/i.test(t));
console.log('errors',errs);console.log(ok,'passed',bad,'failed');await b.close();srv.close();})();
