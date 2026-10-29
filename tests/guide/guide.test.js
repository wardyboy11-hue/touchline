const assert=require('assert'),fs=require('fs'),path=require('path');
global.window=global;
const root=path.join(__dirname,'..','..','coach');
require(path.join(root,'topic-bank.js'));const G=require(path.join(root,'guide.js'));
const bank=global.TOPIC_BANK,lib=JSON.parse(fs.readFileSync(path.join(root,'library.json'),'utf8'));
const B=bank.block3;
function blk(){return {time:'20:00',blockStart:B.blockStart,plan:B.plan.map((t,i)=>({wk:i+1,topic:t})),weeks:B.plan.map(()=>({status:'planned'}))};}
const sq=[{num:'1',pos:['GK']},{num:'5',pos:['CB']},{num:'7',pos:['RWB']},{num:'8',pos:['CM']},{num:'9',pos:['ST']}];
const run=(today,hm,extra)=>G.buildGuide(Object.assign({sb:blk(),revs:[],squad:sq,res:[],shown:{}},extra||{}),bank,lib,today,hm||'12:00');
// which week
assert.strictEqual(run('2026-10-29').wk,1);assert.strictEqual(run('2026-10-29').date,'2026-11-04');
assert.strictEqual(run('2026-11-04','12:00').wk,1);assert.strictEqual(run('2026-11-04','21:00').wk,2);
assert.strictEqual(run('2026-11-05').wk,2);assert.strictEqual(run('2026-11-26','21:00').wk,5);
assert.strictEqual(run('2026-12-10').done,true);
// ran / moved
let s=blk();s.weeks[0].status='ran';assert.strictEqual(G.buildGuide({sb:s,revs:[],squad:sq,res:[],shown:{}},bank,lib,'2026-11-03','12:00').wk,2);
s=blk();s.weeks[0].date='2026-11-11';assert.strictEqual(G.buildGuide({sb:s,revs:[],squad:sq,res:[],shown:{}},bank,lib,'2026-11-04','12:00').date,'2026-11-11');
// determinism
const a=JSON.stringify(run('2026-10-29')),b2=JSON.stringify(run('2026-10-29'));assert.strictEqual(a,b2);
// week 1 ranking
const g1=run('2026-10-29');
assert.ok(g1.look.top.length>=4&&g1.look.top.length<=8,'count '+g1.look.top.length);
const pdf12=g1.look.top.filter(x=>x.type==='pdf'&&/U12-U16/.test(x.title)&&/receiv|break|lines|forward/i.test(x.title));
assert.ok(pdf12.length>=2,'wk1 needs 2 U12-U16 receiving/breaking lines pdfs, got '+pdf12.length+': '+g1.look.top.map(x=>x.title).join(' | '));
assert.ok(g1.look.top.some(x=>x.type==='animation'&&/3-5-2/.test(x.title)||x.type==='animation'),'wk1 animation');
const types=g1.look.top.reduce((o,x)=>(o[x.type]=(o[x.type]||0)+1,o),{});Object.values(types).forEach(n=>assert.ok(n<=3));
g1.look.top.forEach(x=>{assert.ok(x.btn);assert.ok(/^https?:/.test(x.url));});
// week 2
const g2=run('2026-11-05');
assert.ok(g2.look.top.some(x=>x.type==='x'),'wk2 x transition post: '+g2.look.top.map(x=>x.type+':'+x.title).join(' | '));
assert.ok(g2.look.top.some(x=>/U17/.test(x.title)&&/counter/i.test(x.title)),'wk2 U17 counter: '+g2.look.top.map(x=>x.title).join(' | '));
// recent penalty
const g2b=run('2026-11-05','12:00',{shown:{0:g1.shownIds}});assert.ok(g2b.look.top.length>=4);
// hide/add
s=blk();s.weeks[0].ovr={hideLook:[g1.look.top[0].id],addLook:[{title:'My link',url:'https://example.com',type:'video'}]};
const g3=G.buildGuide({sb:s,revs:[],squad:sq,res:[],shown:{}},bank,lib,'2026-10-29','12:00');
assert.ok(!g3.look.top.some(x=>x.id===g1.look.top[0].id));assert.strictEqual(g3.look.top[0].title,'My link');assert.strictEqual(g3.look.top[0].btn,'Watch');
// REFLECT_MAP + units
assert.deepStrictEqual(G.tagsFromText('Five second counter press'),['pressing','transition']);
assert.strictEqual(G.unitOfPos(['RWB']),'Wing-backs');assert.strictEqual(G.unitOfNum('#5',sq),'Back 3');assert.strictEqual(G.unitOfNum(9,sq),'Front 2');
// reflections side by side with flags
const revs=[
 {id:'a',kind:'train',by:'Tim',sid:'2026-11-04',date:'2026-11-04',at:1,sc:{eng:4,pd:3},well:{chips:['Show for the ball']},improve:{chips:['Scan']},stood:[{k:'GK'}],strug:[{k:'5'}]},
 {id:'b',kind:'train',by:'Deano',sid:'2026-11-04',date:'2026-11-04',at:2,sc:{eng:2,pd:3},well:{chips:['Scan']},improve:{chips:['Show for the ball']},stood:[{k:'5'}],strug:[{k:'GK'}]}];
s=blk();const g4=G.buildGuide({sb:s,revs,squad:sq,res:[],shown:{}},bank,lib,'2026-11-05','12:00');
assert.deepStrictEqual(g4.panel.names,['Deano','Tim']);
const fl=g4.panel.flags.join('\n');assert.ok(/Scan/.test(fl)&&/Show for the ball/.test(fl),fl);assert.ok(/Marks differ/.test(fl));assert.ok(/Back 3|GK/.test(fl));
assert.strictEqual(g4.panel.applied,false);assert.ok(g4.panel.items.some(i=>i.id==='u:Back three'));
const q4=g4.questions.find(q=>q.id==='target');assert.deepStrictEqual(q4.value,[]); // nothing applies before Use these
// drop one, apply
s=blk();s.weeks[1].carry={applied:true,drop:['t:Scan']};const g5=G.buildGuide({sb:s,revs,squad:sq,res:[],shown:{}},bank,lib,'2026-11-05','12:00');
assert.ok(g5.questions.find(q=>q.id==='target').value.indexOf('Back three')>-1);
assert.ok(!/scan/.test(g5.seed.free)&&/show/.test(g5.seed.free+' show')); 
// one coach only
const g6=G.buildGuide({sb:blk(),revs:[revs[0]],squad:sq,res:[],shown:{}},bank,lib,'2026-11-05','12:00');assert.deepStrictEqual(g6.panel.missing,['Deano']);
// no reviews: panel hidden
assert.strictEqual(run('2026-11-05').panel,null);
// badge
s=blk();assert.strictEqual(G.badge(s,bank,'2026-11-05',''),true);assert.strictEqual(G.badge(s,bank,'2026-11-05','wk2'),false);assert.strictEqual(G.badge(s,bank,'2026-10-29',''),false);
console.log('guide tests ok');
