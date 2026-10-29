/* Touchline weekly guide. Pure logic: no network, no randomness, no clock reads.
   buildGuide(state, bank, lib, today, hm) gives the same output for the same input.
   Coach only. Never loaded by the family, parents or player pages. */
(function(root){
'use strict';
var G={v:1};

/* ---------- small helpers ---------- */
function addDays(iso,n){var p=iso.split('-'),d=new Date(Date.UTC(+p[0],+p[1]-1,+p[2]+n));return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');}
function uniq(a){var o=[];a.forEach(function(x){if(o.indexOf(x)<0)o.push(x);});return o;}
function inter(a,b){return a.filter(function(x){return b.indexOf(x)>-1;});}
function lc(s){return String(s||'').toLowerCase();}

/* ---------- fixed mapping tables (unit tested) ---------- */
G.TYPE_ORDER=['pdf','animation','x','masterclass','video','search'];
G.BTN={pdf:'Open PDF',masterclass:'Watch masterclass',x:'Open post',video:'Watch',animation:'Play animation',search:'Search'};
G.EMBED={x:1,video:1};
G.UNITS=['GK','Back 3','Wing-backs','Midfield','Front 2'];
G.UNIT_TARGET={'GK':'Keeper','Back 3':'Back three','Wing-backs':'Wing-backs','Midfield':'Midfield','Front 2':'Front two'};
G.POS_UNIT={GK:'GK',CB:'Back 3',RB:'Back 3',LB:'Back 3',RWB:'Wing-backs',LWB:'Wing-backs',RM:'Wing-backs',LM:'Wing-backs',CDM:'Midfield',CM:'Midfield',CAM:'Midfield',RW:'Front 2',LW:'Front 2',ST:'Front 2',CF:'Front 2'};
G.THEME_SYN={'build-up':['build-up','playing out'],'playing out':['playing out','build-up'],'receiving':['receiving','first touch','playing forward'],'breaking lines':['breaking lines','progression'],'third man':['third man','combinations'],'wing-play':['wide play','wing-backs','overlaps','full-backs','crossing'],'overlap':['overlaps','wing-backs'],'crossing':['crossing'],'defending':['defending','units','mid block','low block'],'compact':['units','mid block','low block'],'set pieces':['set pieces'],'goalkeeper':['goalkeeping'],'final third':['final third','creating chances'],'finishing':['finishing'],'pressing':['pressing'],'transition':['transition','counter-attack'],'counter-attack':['counter-attack','transition'],'possession':['possession','passing'],'rotations':['combinations','overloads'],'shape':['units','principles']};
/* reflection words: chip or note text to library themes */
G.REFLECT_MAP=[[/press|squeeze|trigger|five second/,'pressing'],[/counter|transition|win it|lose it|react|spring/,'transition'],[/receiv|half turn|scan|show for|first touch/,'receiving'],[/third man|rotat|swap/,'third man'],[/build|keeper|play out|width and depth|bait/,'build-up'],[/line|split|forward/,'breaking lines'],[/finish|shoot|box/,'finishing'],[/shape|skeleton|compact|rest defence|drop/,'compact'],[/wing|overlap|cross/,'wing-play'],[/set piece|corner|free kick/,'set pieces']];
G.tagsFromText=function(t){t=lc(t);var o=[];G.REFLECT_MAP.forEach(function(m){if(m[0].test(t)&&o.indexOf(m[1])<0)o.push(m[1]);});return o;};
G.unitOfPos=function(pos){var a=Array.isArray(pos)?pos:[pos];for(var i=0;i<a.length;i++){var u=G.POS_UNIT[String(a[i]||'').toUpperCase()];if(u)return u;}return '';};
G.unitOfNum=function(num,squad){num=String(num).replace(/^#/,'');var p=(squad||[]).filter(function(x){return String(x.num)===num;})[0];return p?G.unitOfPos(p.pos):'';};
G.shortPoint=function(p){var s=String(p||'');var c=s.indexOf(':');if(c>0&&c<40)return s.slice(0,c);var d=s.indexOf('.');return (d>0?s.slice(0,d):s).slice(0,48);};
var WELFARE=/\b(hurt|injur|knock|concussion|abus|bully|self.?harm|cry|upset|scared|afraid|welfare|safeguard)/i;
G.welfareHit=function(t){return WELFARE.test(String(t||''));};

/* ---------- which week ---------- */
G.blockStart=function(b,bank){return b.blockStart||(bank&&bank.block3&&bank.block3.blockStart)||b.start;};
G.weekDate=function(b,bank,i){var w=(b.weeks||[])[i]||{};return w.date||addDays(G.blockStart(b,bank),7*i);};
G.pickWeek=function(b,bank,today,hm){var n=(b.weeks||[]).length||6,t=b.time||'20:00';hm=hm||'00:00';
 for(var i=0;i<n;i++){var w=(b.weeks||[])[i]||{},d=G.weekDate(b,bank,i),st=w.status;
  if(st==='ran'||st==='not-run')continue;
  if(d>today||(d===today&&hm<t))return {i:i,before:i===0&&today<d&&today<G.weekDate(b,bank,0),done:false};}
 return {i:n-1,before:false,done:true};};

/* ---------- reflections ---------- */
function coachOf(r){return r.by||'Tim';}
G.lastReflections=function(revs,beforeDate){
 var rs=(revs||[]).filter(function(r){return !r.del&&r.kind==='train'&&(r.sid||r.date)<beforeDate;});
 if(!rs.length)return {sid:'',by:{}};
 var key=rs.map(function(r){return r.sid||r.date;}).sort().pop(),by={};
 rs.filter(function(r){return (r.sid||r.date)===key;}).sort(function(a,b){return (a.at||0)-(b.at||0);}).forEach(function(r){by[coachOf(r)]=r;});
 return {sid:key,by:by};};
function chips(x){return (x&&x.chips)||[];}
function entries(x){return Array.isArray(x)?x:[];}
G.flags=function(by,squad){var names=Object.keys(by).sort(),out=[];if(names.length<2)return out;
 var A=by[names[0]],B=by[names[1]],a=names[0],b=names[1];
 function cross(w1,i2,n1,n2){chips(w1).forEach(function(c){if(chips(i2).indexOf(c)>-1)out.push(n1+' said "'+c+'" went well, '+n2+' wants it better');});}
 cross(A.well,B.improve,a,b);cross(B.well,A.improve,b,a);
 function units(r){var o={st:{},sg:{}};entries(r.stood).forEach(function(e){var k=/^\d+$/.test(String(e.k).replace('#',''))?(G.unitOfNum(e.k,squad)||'#'+String(e.k).replace('#','')):e.k;o.st[k]=1;if(/^\d/.test(String(e.k).replace('#',''))||true)o.st['#'+String(e.k).replace('#','')]=1;});entries(r.strug).forEach(function(e){var k=/^\d+$/.test(String(e.k).replace('#',''))?(G.unitOfNum(e.k,squad)||'#'+String(e.k).replace('#','')):e.k;o.sg[k]=1;o.sg['#'+String(e.k).replace('#','')]=1;});return o;}
 var ua=units(A),ub=units(B);
 Object.keys(ua.st).forEach(function(k){if(ub.sg[k])out.push(a+' had '+k+' doing well, '+b+' had '+k+' struggling');});
 Object.keys(ub.st).forEach(function(k){if(ua.sg[k])out.push(b+' had '+k+' doing well, '+a+' had '+k+' struggling');});
 var sa=A.sc||{},sb=B.sc||{};Object.keys(sa).forEach(function(q){if(sb[q]&&Math.abs(sa[q]-sb[q])>=2)out.push('Marks differ by '+Math.abs(sa[q]-sb[q])+' on "'+q+'": '+a+' '+sa[q]+', '+b+' '+sb[q]);});
 return uniq(out);};
G.panel=function(revs,beforeDate,squad,carry,lib,topicThemes){
 var L=G.lastReflections(revs,beforeDate),names=Object.keys(L.by).sort();
 if(!names.length)return null;
 var items=[],seen={};
 function add(id,kind,label,tags){if(seen[id])return;seen[id]=1;items.push({id:id,kind:kind,label:label,tags:tags||[]});}
 names.forEach(function(n){var r=L.by[n];
  entries(r.strug).forEach(function(e){var k=String(e.k).replace('#','');var u=/^\d+$/.test(k)?G.unitOfNum(k,squad):e.k;if(u&&G.UNIT_TARGET[u])add('u:'+G.UNIT_TARGET[u],'unit','Target: '+G.UNIT_TARGET[u],[]);});
  chips(r.improve).forEach(function(c){add('t:'+c,'focus','Work on: '+c,G.tagsFromText(c).concat(topicThemes||[]).slice(0,3));});
  chips(r.well).forEach(function(c){var pg=G.progression(c,lib);add('n:'+c,'next','Next: '+pg,[]);});});
 var drop=(carry&&carry.drop)||[];
 items.forEach(function(it){it.on=drop.indexOf(it.id)<0;});
 return {sid:L.sid,names:names,by:L.by,missing:['Tim','Deano'].filter(function(x){return names.indexOf(x)<0;}),flags:G.flags(L.by,squad),items:items,applied:!!(carry&&carry.applied)};};
G.progression=function(chip,lib){var t=lc(chip).split(/[^a-z0-9]+/).filter(function(x){return x.length>3;});
 var hit=((lib&&lib.items)||[]).filter(function(i){return /progress|overload|\+1|next level/.test(lc(i.title))&&t.some(function(x){return lc(i.title).indexOf(x)>-1;});}).sort(function(a,b){return a.title<b.title?-1:1;})[0];
 return hit?hit.title:'Repeat with a constraint';};
G.applied=function(panel){if(!panel||!panel.applied)return {units:[],tags:[],focus:[]};var on=panel.items.filter(function(i){return i.on;});
 return {units:on.filter(function(i){return i.kind==='unit';}).map(function(i){return i.id.slice(2);}),tags:uniq([].concat.apply([],on.filter(function(i){return i.kind==='focus';}).map(function(i){return i.tags;}))),focus:on.filter(function(i){return i.kind==='focus';}).map(function(i){return i.id.slice(2);})};};

/* ---------- library ranking ---------- */
G.ageScore=function(ages){var best=0;(ages||[]).forEach(function(a){a=String(a).toUpperCase();var s=/^(U12-U16|U14-U15|U14U15|U16-U17|U15)$/.test(a)?2:/^U17/.test(a)?1:0;if(s>best)best=s;});return best;};
function expandThemes(t){var o=[];(t||[]).forEach(function(x){o.push(x);(G.THEME_SYN[x]||[]).forEach(function(y){o.push(y);});});return uniq(o);}
G.playersScore=function(tags,ans){if(!ans)return 0;var m=String(ans).match(/(\d+)\D*(\d+)?/);if(!m)return 0;var lo=+m[1],hi=m[2]?+m[2]:+m[1]+4;
 return (tags||[]).some(function(p){var x=String(p).match(/(\d+)v(\d+)/);if(!x)return false;var s=+x[1]+ +x[2];return s>=lo-2&&s<=hi+3;})?1:0;};
G.score=function(it,ctx){var tg=it.tags||{},s=0,th=inter(tg.theme||[],ctx.themes);
 s+=3*th.length;if(ctx.moment&&(tg.moment||[]).indexOf(ctx.moment)>-1)s+=3;
 if((tg.system||[]).some(function(x){return x==='3-5-2'||x==='back three';}))s+=2;
 s+=G.ageScore(tg.age);s+=G.playersScore(tg.players,ctx.players);
 s+=3*inter(tg.theme||[],ctx.boost).length;
 if(ctx.pinned.indexOf(it.id)>-1)s+=4;
 if(ctx.recent.indexOf(it.id)>-1)s-=2;
 return {s:s,th:th};};
G.why=function(it,sc,ctx){var p=[];(sc.th||[]).slice(0,2).forEach(function(x){p.push(x);});
 if(ctx.moment&&((it.tags||{}).moment||[]).indexOf(ctx.moment)>-1)p.push(ctx.moment);
 var tg=it.tags||{};if((tg.system||[]).indexOf('3-5-2')>-1)p.unshift('3-5-2');else if((tg.system||[]).indexOf('back three')>-1)p.unshift('back three');
 (tg.age||[]).slice(0,1).forEach(function(a){if(G.ageScore([a])>0)p.push(a);});
 return uniq(p).slice(0,4).join(' · ')||'matches the week';};
G.rank=function(items,ctx,hide,add){
 var hid=hide||[],pool=items.filter(function(i){return hid.indexOf(i.id)<0&&i.url;}).map(function(i){var sc=G.score(i,ctx);return {it:i,s:sc.s,sc:sc};});
 var to=G.TYPE_ORDER;
 pool.sort(function(a,b){return b.s-a.s||to.indexOf(a.it.type)-to.indexOf(b.it.type)||(a.it.title<b.it.title?-1:a.it.title>b.it.title?1:0)||(a.it.id<b.it.id?-1:1);});
 var out=[],cnt={},rest=pool.filter(function(p){return p.s>0;});
 var hasPdf=rest.some(function(p){return p.it.type==='pdf';});
 var typesSeen={};
 while(out.length<ctx.max&&rest.length){
  var best=-1,bs=-1e9;
  for(var k=0;k<rest.length;k++){var p=rest[k];if((cnt[p.it.type]||0)>=3)continue;var s=p.s+(typesSeen[p.it.type]?0:1);if(s>bs){bs=s;best=k;}}
  if(best<0)break;var pk=rest.splice(best,1)[0];out.push(pk);cnt[pk.it.type]=(cnt[pk.it.type]||0)+1;typesSeen[pk.it.type]=1;}
 if(hasPdf&&!out.some(function(p){return p.it.type==='pdf';})){var pp=pool.filter(function(p){return p.it.type==='pdf'&&p.s>0;})[0];if(pp)out[out.length-1]=pp;}
 var chosen=out.map(function(p){return {id:p.it.id,title:p.it.title,url:p.it.url,type:p.it.type,src:p.it.src,length:p.it.length||'',priv:!!p.it.private,paid:!!p.it.paid,why:G.why(p.it,p.sc,ctx),score:p.s,btn:G.BTN[p.it.type]||'Open',embed:!!G.EMBED[p.it.type]};});
 var more=pool.filter(function(p){return p.s>0&&out.indexOf(p)<0;}).slice(0,8).map(function(p){return {id:p.it.id,title:p.it.title,url:p.it.url,type:p.it.type,src:p.it.src,length:p.it.length||'',priv:!!p.it.private,paid:!!p.it.paid,why:G.why(p.it,p.sc,ctx),score:p.s,btn:G.BTN[p.it.type]||'Open',embed:!!G.EMBED[p.it.type]};});
 (add||[]).slice().reverse().forEach(function(a){chosen.unshift({id:a.id||('add-'+a.url),title:a.title,url:a.url,type:a.type||'search',src:'added',length:'',priv:false,paid:false,why:'added by you',score:99,btn:G.BTN[a.type||'search']||'Open',embed:!!G.EMBED[a.type]});});
 return {top:chosen,more:more};};

/* ---------- the guide ---------- */
G.buildGuide=function(st,bank,lib,today,hm){
 var b=st.sb,res={};
 var pw=G.pickWeek(b,bank,today,hm);if(st.week!=null&&st.week>=0&&st.week<(b.weeks||[]).length)pw={i:st.week,before:false,done:false};var i=pw.i,w=(b.weeks||[])[i]||{};
 var plan=(b.plan||[]).filter(function(x){return x.wk===i+1;})[0],tid=(plan&&plan.topic)||'';
 var base=tid&&bank.topics[tid]?bank.topics[tid]:null,ovr=w.ovr||{},ans=w.ans||{};
 var date=G.weekDate(b,bank,i);
 var topic={id:tid,name:ovr.topicName||(base&&base.name)||'',tagline:ovr.tagline!=null?ovr.tagline:(base&&base.tagline)||'',points:(ovr.points&&ovr.points.length)?ovr.points:((base&&base.points)||[]),moment:(base&&base.moment)||'',set:!!base};
 var themes=expandThemes(base?base.libTags.theme:[]),mom=base?(base.libTags.moment||[])[0]:'';
 var momentAns=ans.moment||'';
 var themeNames=base?base.libTags.theme:[];
 var panel=G.panel(st.revs,date,st.squad,w.carry,lib,themeNames);
 var ap=G.applied(panel),boost=expandThemes(ap.tags);
 /* questions with prefills */
 var qs=[].concat(bank.common_questions||[],(base&&base.questions)||[],ovr.questions||[]);
 var preMap={};if(ap.units.length)preMap.target=ap.units;
 if(panel&&panel.applied&&ap.focus.length)preMap.last='Last week: work on '+ap.focus.join(', ');
 if(w.split)preMap.split='Yes';
 var qout=qs.map(function(q){var v=ans[q.id];if(v==null||v==='')v=preMap[q.id]!=null?preMap[q.id]:(q.def!=null?q.def:(q.type==='multi'?[]:''));
  return {id:q.id,q:q.q,type:q.type,opts:q.opts||[],value:v};});
 var ctx={themes:themes,moment:mom,players:ans.players||'13-15',boost:boost,pinned:(base&&base.pinned)||[],recent:uniq([].concat((st.shown||{})[i]||[],(st.shown||{})[i-1]||[])).filter(Boolean),max:6};
 var all=((lib&&lib.items)||[]).concat(st.res||[]);
 var look=G.rank(all,ctx,ovr.hideLook,ovr.addLook);
 /* drill seed */
 var toks=[];(base?base.drillTags.words:[]).forEach(function(x){toks.push(x);});
 var mAns=qout.filter(function(q){return q.id==='moment'||q.id==='area';}).map(function(q){return lc(q.value);}).filter(Boolean);
 mAns.forEach(function(x){x.split(/[^a-z0-9]+/).filter(function(t){return t.length>3;}).forEach(function(t){toks.push(t);});});
 ap.focus.forEach(function(x){lc(x).split(/[^a-z0-9]+/).filter(function(t){return t.length>3;}).forEach(function(t){toks.push(t);});});
 toks=uniq(toks);
 var seed={rc:[base?base.drillTags.topic:-1,toks],free:toks.join(' '),split:(qout.filter(function(q){return q.id==='split';})[0]||{}).value==='Yes'};
 return {i:i,wk:i+1,date:date,status:w.status||'planned',done:pw.done,before:pw.before,topic:topic,questions:qout,panel:panel,look:look,seed:seed,
  ovr:{has:!!(w.ovr&&Object.keys(w.ovr).some(function(k){return k!=='at';}))},shownIds:look.top.map(function(x){return x.id;})};};

/* the "guide ready" badge: day after a session, or once that session is marked ran, until the next guide is opened (per coach) */
G.badge=function(b,bank,today,seen){var n=(b.weeks||[]).length;if(!n)return false;
 for(var i=0;i<n;i++){var w=b.weeks[i]||{},d=G.weekDate(b,bank,i);
  if(i+1<n&&(today>d||w.status==='ran')){var nx=G.weekDate(b,bank,i+1);if(today<=nx){return (seen||'')!==('wk'+(i+2));}}}
 return false;};

if(typeof module!=='undefined'&&module.exports)module.exports=G;
root.GUIDE=G;
})(typeof window!=='undefined'?window:globalThis);
