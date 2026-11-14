// r114 sub suggestion engine, no browser. Pretend names only.
global.window=global;require('../../coach/subs.js');const T=window.TLSubs;
let pass=0,fail=0;function ok(n,c,x){if(c){pass++;console.log('PASS '+n);}else{fail++;console.log('FAIL '+n,x===undefined?'':JSON.stringify(x));}}
const P={a:{num:'1',name:'Gk A',pos:['GK']},b:{num:'2',name:'Rb B',pos:['RWB','RB']},c:{num:'3',name:'Cb C',pos:['CB']},d:{num:'4',name:'Cb D',pos:['CB']},e:{num:'5',name:'Cb E',pos:['CB']},f:{num:'6',name:'Lwb F',pos:['LWB']},g:{num:'7',name:'Dm G',pos:['CDM']},h:{num:'8',name:'Cm H',pos:['CM']},i:{num:'9',name:'Cm I',pos:['CM']},j:{num:'10',name:'St J',pos:['ST']},k:{num:'11',name:'St K',pos:['ST']},
 l:{num:'12',name:'Sub L',pos:['LB','CB']},m:{num:'14',name:'Sub M',pos:['CM','CDM']},n:{num:'15',name:'Sub N',pos:['ST']},o:{num:'16',name:'Sub O',pos:['RB']}};
const slots=[['GK','GK','a'],['RCB','CB','c'],['CB','CB','d'],['LCB','CB','e'],['RWB','RWB','b'],['LWB','LWB','f'],['CDM','CDM','g'],['RCM','CM','h'],['LCM','CM','i'],['RST','ST','j'],['LST','ST','k']];
const ALIAS=[['RM','RW'],['LM','LW'],['RB','RWB'],['LB','LWB'],['CAM','CM'],['CDM','CM']];
function fit(p,pos){const a=p.pos,i=a.indexOf(pos);if(i===0)return 4;if(i>0)return 3;for(const g of ALIAS)if(g.includes(pos)&&a.some(x=>g.includes(x)))return 2;return 0;}
function ctx(t,q,mins,rating){return {half:35,t:t*60,period:t>35?2:1,status:'live',onPitch:slots.map(s=>({slot:s[0],pos:s[1],pid:s[2]})),bench:['l','m','n','o'],mins:id=>(mins&&mins[id]!=null?mins[id]:(slots.some(s=>s[2]===id)?t*60:0)),fit,pos:p=>p.pos,P:id=>P[id],short:p=>p.name.split(' ')[1],q,score:[1,0],squad:15,rating:rating||(()=>0)};}
const W=T.windows(35);
ok('changes planned at 20, half time, 40 and 50',W.map(w=>w.at).join()==='20,35,40,50',W);
ok('options show 5 minutes before: 15, 30, half time whistle, 45',W.map(w=>w.from).join()==='15,30,35,45'&&W[2].fromHT===true);
const o=(t,st,per)=>T.open(35,t*60,st,per,{}).map(w=>w.id).join();
ok('nothing open at 10 minutes',o(10,'live',1)==='');
ok('20 minute options open at 15',o(15,'live',1)==='w1');
ok('half time options open at 30',o(30,'live',1)==='wht');
ok('at the half time whistle: half time and 40 minute options',o(35,'ht',1)==='wht,w2');
ok('50 minute options open at 45',o(45,'live',2)==='w3');
ok('a window you skipped stays closed',T.open(35,15*60,'live',1,{w1:'skip'}).length===0);
ok('next change shown before 15',(T.next(35,600,'live',1,{})||{}).id==='w1');
const all=[];
for(const [t,q] of [[15,{}],[30,{p:{h:{v:'tired'},b:{v:'knock'}},o:{left:1,press:1}}],[45,{}]]){const c=ctx(t,q);const before=JSON.stringify(c.onPitch);const r=T.plan(c);all.push([t,q,r]);
 ok(t+"': at least one option",r.opts.length>=1,r);
 ok(t+"': every change is a position the player nominated",r.opts.every(op=>op.ch.every(x=>fit(P[x.on],x.pos)>=2)),r.opts);
 ok(t+"': nobody comes on twice in one option, no slot used twice",r.opts.every(op=>new Set(op.ch.map(x=>x.on)).size===op.ch.length&&new Set(op.ch.map(x=>x.slot)).size===op.ch.length));
 ok(t+"': only bench players come on",r.opts.every(op=>op.ch.every(x=>['l','m','n','o'].includes(x.on))));
 ok(t+"': every option has a reason",r.opts.every(op=>op.why.length&&op.why.join(' ').length>20));
 ok(t+"': the engine changes nothing itself",JSON.stringify(c.onPitch)===before);}
const r30=all[1][2];
ok("30': more than one option to choose from",r30.opts.length>=2,r30.opts.map(x=>x.title));
ok("30': the player with a knock comes off in every option",r30.opts.every(op=>op.ch.some(x=>x.off==='b')));
ok("30': reasons use the quick check (tired, press high, left side)",/tired/.test(JSON.stringify(r30.opts))&&/press high/.test(JSON.stringify(r30.opts))&&/left/.test(JSON.stringify(r30.opts)));
ok("scores read 1-0, never 1 to 0",/1-0/.test(JSON.stringify(r30.opts))&&!/1 to 0/.test(JSON.stringify(all)));
ok("fair share for 15 players is about 51 minutes, floor is 35",r30.fair===51&&r30.floor===35);
// level: a much weaker player does not replace a stronger one in the same position unless he is tired or struggling
const rate=id=>({h:8,i:8,g:8,m:4}[id]||0);
let r=T.plan(ctx(15,{},null,rate));
ok('level kept: weaker sub not paired with a stronger midfielder',r.opts.every(op=>!op.ch.some(x=>x.on==='m'&&['h','i','g'].includes(x.off))),r.opts);
r=T.plan(ctx(15,{p:{h:{v:'knock'}}},null,rate));
ok('a knock lets anyone who nominated the position come on',r.opts.some(op=>op.ch.some(x=>x.off==='h'&&x.on==='m')),r.opts);
r=T.plan(ctx(45,{o:{us:1}},{l:30*60,m:30*60,n:30*60,o:30*60}));
ok('we are on top and minutes are fine: a no change option',r.opts.some(op=>op.key==='steady'&&op.ch.length===0),r.opts);
console.log(pass+' passed, '+fail+' failed');process.exit(fail?1:0);
