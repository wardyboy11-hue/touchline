global.window=global;require('/workspace/touchline/coach/subs.js');const T=window.TLSubs;
const P={a:{num:'1',name:'Gk A',pos:['GK']},b:{num:'2',name:'Rb B',pos:['RWB','RB']},c:{num:'3',name:'Cb C',pos:['CB']},d:{num:'4',name:'Cb D',pos:['CB']},e:{num:'5',name:'Cb E',pos:['CB']},f:{num:'6',name:'Lwb F',pos:['LWB']},g:{num:'7',name:'Dm G',pos:['CDM']},h:{num:'8',name:'Cm H',pos:['CM']},i:{num:'9',name:'Cm I',pos:['CM']},j:{num:'10',name:'St J',pos:['ST']},k:{num:'11',name:'St K',pos:['ST']},
 l:{num:'12',name:'Sub L',pos:['LB','CB']},m:{num:'14',name:'Sub M',pos:['CM','CDM']},n:{num:'15',name:'Sub N',pos:['ST']},o:{num:'16',name:'Sub O',pos:['RB']}};
const slots=[['GK','GK','a'],['RCB','CB','c'],['CB','CB','d'],['LCB','CB','e'],['RWB','RWB','b'],['LWB','LWB','f'],['CDM','CDM','g'],['RCM','CM','h'],['LCM','CM','i'],['RST','ST','j'],['LST','ST','k']];
const ALIAS=[['RM','RW'],['LM','LW'],['RB','RWB'],['LB','LWB'],['CAM','CM'],['CDM','CM']];
function fit(p,pos){const a=p.pos,i=a.indexOf(pos);if(i===0)return 4;if(i>0)return 3;for(const g of ALIAS)if(g.includes(pos)&&a.some(x=>g.includes(x)))return 2;return 0;}
function ctx(t,q,mins){return {half:35,t:t*60,period:t>35?2:1,status:'live',onPitch:slots.map(s=>({slot:s[0],pos:s[1],pid:s[2]})),bench:['l','m','n','o'],mins:id=>(mins&&mins[id]!=null?mins[id]:(slots.some(s=>s[2]===id)?t*60:0)),fit,P:id=>P[id],short:p=>p.name.split(' ')[1],q,score:[1,0],squad:15,pos:p=>p.pos,rating:id=>({h:5,m:7}[id]||0)};}
console.log('windows',JSON.stringify(T.windows(35)));
for(const [t,st,per] of [[10,'live',1],[15,'live',1],[30,'live',1],[35,'ht',1],[41,'live',2],[45,'live',2],[55,'live',2]])console.log(t,st,T.open(35,t*60,st,per,{}).map(w=>w.id).join(','),'next',(T.next(35,t*60,st,per,{})||{}).id);
let r=T.plan(ctx(15,{}));console.log(JSON.stringify(r,null,1));
r=T.plan(ctx(30,{p:{h:{v:'tired'},b:{v:'knock'}},o:{left:1,press:1}}));console.log(JSON.stringify(r.opts,null,1));
r=T.plan(ctx(45,{o:{us:1}},{l:20*60,m:15*60,n:10*60,o:0}));console.log(JSON.stringify(r.opts.map(o=>[o.title,o.ch,o.why]),null,1),r.stuck);
