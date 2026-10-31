/* Tests for the PR #9 review fixes: Reflect migration, library.json in the service worker, flags units, pickWeek. */
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
global.window=global;
const root=path.join(__dirname,'..','..','coach');
require(path.join(root,'topic-bank.js'));const G=require(path.join(root,'guide.js'));
const bank=global.TOPIC_BANK,B=bank.block3;

// 1. Reflect migration
const legacy=[{id:'a',kind:'train',by:'Tim',at:100},{id:'b',kind:'train',by:'Deano',at:200}];
let revs={},ack={},dirty={};
let m=G.migrateRevs(legacy,revs,ack,dirty,1000);
assert.deepStrictEqual(m.dirty.sort(),['a','b']);assert.strictEqual(m.clear,false,'never clear before the server confirms');
assert.ok(revs.a&&revs.b&&revs.a!==legacy[0],'copied, legacy object untouched');
dirty={'rev:a':1,'rev:b':1};
m=G.migrateRevs(legacy,revs,ack,dirty,1000);assert.deepStrictEqual(m.dirty,[]);assert.strictEqual(m.clear,false,'still dirty');
// old backend drops kind rev: no ack, dirty cleared by sync, still not cleared
dirty={};m=G.migrateRevs(legacy,revs,ack,dirty,1000);assert.strictEqual(m.clear,false,'no ack means keep the legacy list');
ack={a:1};m=G.migrateRevs(legacy,revs,ack,dirty,1000);assert.strictEqual(m.clear,false,'partial ack');
ack={a:1,b:1};m=G.migrateRevs(legacy,revs,ack,dirty,1000);assert.strictEqual(m.clear,true,'all confirmed');
// an older app edits a legacy item after migration: re-copied and needs a fresh ack before clearing
const L2=[{id:'a',kind:'train',by:'Tim',at:5000}];m=G.migrateRevs(L2,revs,ack,{},6000);
assert.deepStrictEqual(m.dirty,['a']);assert.strictEqual(m.clear,false);assert.strictEqual(revs.a.at,5000);
assert.strictEqual(G.migrateRevs([],{},{},{},1).clear,false);
// merge: legacy still readable, de-duplicated by id, newest wins
const merged=G.mergeRevs([{id:'x',at:1,t:'old'},{id:'y',at:1}],{x:{id:'x',at:9,t:'new'},z:{id:'z',at:3}});
assert.deepStrictEqual(merged.map(r=>r.id),['x','y','z']);assert.strictEqual(merged[0].t,'new');
assert.strictEqual(G.mergeRevs([{id:'x',at:9,t:'legacy newer'}],{x:{id:'x',at:2}})[0].t,'legacy newer');
assert.strictEqual(G.mergeRevs(undefined,{}).length,0);
// app.js wiring: settings.rev is only cleared through the ack path
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const mig=app.slice(app.indexOf('function rvMigrate('),app.indexOf('\n',app.indexOf('function rvMigrate(')));
assert.ok(/if\(m\.clear\)\{s\.rev=\[\]/.test(mig),'clear only on m.clear');assert.ok(/S\.revAck\[r\.id\]=1/.test(app),'ack from server read back');

// 2. service worker: library.json network first, cache fallback, version bumped
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
assert.ok(/touchline-shell-v67/.test(sw)&&/touchline-run-v67/.test(sw),'cache version bumped');
const idx=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.ok(!/v=62/.test(idx)&&/app\.js\?v=67/.test(idx));
async function swRun(netOk){
  const store=new Map(),handlers={},calls=[];
  const cache={put:(r,res)=>{store.set(r.url,res);return Promise.resolve();},match:(r)=>Promise.resolve(store.get(r.url)),add:()=>Promise.resolve(),addAll:()=>Promise.resolve()};
  const ctx={self:{addEventListener:(t,f)=>handlers[t]=f,skipWaiting(){},clients:{claim(){}}},location:{origin:'https://x.test'},URL,Promise,setTimeout,
    caches:{open:()=>Promise.resolve(cache),match:()=>Promise.resolve(undefined),keys:()=>Promise.resolve([])},
    Response:{error:()=>({error:true})},
    fetch:(r)=>{calls.push(r.url);return netOk?Promise.resolve({ok:true,body:'net',clone(){return {ok:true,body:'cached'};}}):Promise.reject(new Error('offline'));}};
  vm.runInNewContext(sw,ctx);
  const req={url:'https://x.test/coach/library.json',method:'GET',mode:'cors',headers:{has:()=>false}};
  if(!netOk)store.set(req.url,{ok:true,body:'cached'});
  let p;handlers.fetch({request:req,respondWith:x=>p=x});assert.ok(p,'library.json handled');
  return {res:await p,calls,store};
}
(async()=>{
  let r=await swRun(true);assert.strictEqual(r.res.body,'net','network first');assert.strictEqual(r.calls.length,1);assert.ok(r.store.has('https://x.test/coach/library.json'),'cached for offline');
  r=await swRun(false);assert.strictEqual(r.res.body,'cached','cache fallback offline');

  // 4. flags: unit names do not get a '#' entry, shirt numbers do; pickWeek before
  const sq=[{num:'5',pos:['CB']},{num:'9',pos:['ST']}];
  const rv=(by,stood)=>({id:by,kind:'train',by,date:'2026-11-04',sid:'2026-11-04',stood,strug:{},sc:{},tx:{},c:{},w:{},d:{}});
  const P=G.panel([rv('Tim',{'Back three':1}),rv('Deano',{'#9':1})],'2026-11-05',sq,{},[],[]);
  const txt=JSON.stringify(P);assert.ok(!/#Back three/.test(txt),'no # for unit names');
  const b={time:'20:00',blockStart:B.blockStart,plan:B.plan.map((t,i)=>({wk:i+1,topic:t})),weeks:B.plan.map(()=>({status:'planned'}))};
  assert.strictEqual(G.pickWeek(b,bank,'2026-10-29','12:00').before,true);
  assert.strictEqual(G.pickWeek(b,bank,'2026-11-04','12:00').before,false);
  assert.strictEqual(G.pickWeek(b,bank,'2026-11-05','12:00').before,false);
  const gsrc=fs.readFileSync(path.join(root,'guide.js'),'utf8');assert.ok(!/\|\|true/.test(gsrc),'no ||true');
  console.log('fix tests ok');
})().catch(e=>{console.error(e);process.exit(1);});
