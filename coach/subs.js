/* r114 Matchday sub suggestions. Runs on the coach phone only, works with no signal.
 * Nothing here makes a change. It builds options; the coach taps to make them.
 * Games are 70 minutes (35 each way). Planned changes at 20', half time, 40' and 50'.
 * Options show about 5 minutes before each change: 15', 30', the half time whistle (for 40') and 45'.
 * Rules: only positions a player nominated (or the same job under another name, such as RB and RWB),
 * level the same or better, fair minutes for everyone, and the coach always decides. */
(function(G){
 'use strict';
 var FORM={fly:{n:'Flying',adj:1},ok:{n:'OK',adj:0},strug:{n:'Struggling',adj:-1},tired:{n:'Tired',adj:-1},knock:{n:'Knock',adj:-9}};
 var OPP={press:{n:'They press high',say:'they press high',lines:[2]},pace:{n:'Pace up front',say:'they have pace up front',lines:[1]},left:{n:'Strong down our left',say:'they are strong down our left',slots:/^(LB|LWB|LCB|LM|LW|LCM|LDM|LAM)$/},right:{n:'Strong down our right',say:'they are strong down our right',slots:/^(RB|RWB|RCB|RM|RW|RCM|RDM|RAM)$/},long:{n:'Long balls',say:'they go long',lines:[1]},phys:{n:'Big and physical',say:'they are big and physical',lines:[1,2]},mid:{n:'Winning midfield',say:'they are winning midfield',lines:[2]},top:{n:'They are on top',say:'they are on top',lines:[1,2]},us:{n:'We are on top',say:'we are on top',calm:true}};
 var LINE={GK:0,RB:1,CB:1,LB:1,RWB:1,LWB:1,CDM:2,CM:2,CAM:2,RM:2,LM:2,RW:3,LW:3,ST:3};
 /* Change points from the half length. 35 gives 20, 35, 40 and 50. */
 function windows(half){half=Number(half)||35;var a=Math.round(half*4/7),b=half,c=half+Math.round(half/7),d=half+Math.round(half*3/7);
  return [{id:'w1',at:a,from:a-5,to:a+2,label:a+"'"},{id:'wht',at:b,from:b-5,to:b,ht:true,label:'half time'},{id:'w2',at:c,from:b,to:c+2,label:c+"'",fromHT:true},{id:'w3',at:d,from:d-5,to:d+2,label:d+"'"}];}
 /* Which windows are open now. t in seconds, status live or ht. */
 function open(half,t,status,period,done){var mm=t/60,out=[];windows(half).forEach(function(w){if(done&&done[w.id])return;var on=false;
   if(status==='ht')on=(w.ht||w.fromHT);
   else if(w.ht)on=period===1&&mm>=w.from;
   else if(w.fromHT)on=period===2&&mm<w.to;
   else on=mm>=w.from&&mm<w.to&&(w.at<=half?period===1:period===2);
   if(on)out.push(w);});return out;}
 function next(half,t,status,period,done){if(status==='ht')return null;var mm=t/60,ws=windows(half);for(var i=0;i<ws.length;i++){var w=ws[i];if(done&&done[w.id])continue;if(w.fromHT){if(period===1)return w;continue;}if(mm<w.from&&(period===1||w.at>half))return w;}return null;}
 function formOf(q,pid){var f=q&&q.p&&q.p[pid];return f&&FORM[f.v]?f.v:'';}
 function oppOn(q){var o=(q&&q.o)||{};return Object.keys(o).filter(function(k){return o[k]&&OPP[k];});}
 function nom(fit,p,pos){return fit(p,pos)>=2;}
 function name(c,id){var p=c.P(id);return p?c.short(p):'?';}
 function numName(c,id){var p=c.P(id);return p?((p.num?'#'+p.num+' ':'')+c.short(p)):'?';}
 /* c = {half,t,period,status,onPitch:[{pid,slot,pos}],bench:[pid],mins(pid),fit(p,pos),P(id),short(p),q,score:[for,against],squad:n} */
 function plan(c){
  var total=c.half*2*60,remain=Math.max(0,total-c.t),fair=Math.round(total*11/Math.max(11,c.squad||11)),floor=c.half*60;
  var q=c.q||{},opp=oppOn(q),calm=opp.indexOf('us')>-1;
  var form=function(pid){return formOf(q,pid);};
  /* Level: nominated position (3, or 2 for the same job under another name) plus the coach's season rating against 6, plus today's quick check. */
  var rate=function(pid){var r=c.rating?c.rating(pid):0;return r?Math.max(-1.5,Math.min(1.5,(r-6)/2)):0;};
  var pfit=function(p,pos){var f=c.fit(p,pos);return f>=3?3:f;};
  var level=function(pid,pos,live){var p=c.P(pid);if(!p)return 0;var f=live?form(pid):'';return pfit(p,pos)+rate(pid)+(f?FORM[f].adj:0);};
  var need=function(pid){return fair-c.mins(pid);};
  var bench=c.bench.filter(function(id){return c.P(id)&&form(id)!=='knock';});
  var benchNeed=bench.slice().sort(function(a,b){return need(b)-need(a);});
  var hot={};opp.forEach(function(k){var o=OPP[k];c.onPitch.forEach(function(s){if((o.lines&&o.lines.indexOf(LINE[s.pos])>-1)||(o.slots&&o.slots.test(s.slot)))hot[s.slot]=(hot[s.slot]||0)+1;});});
  /* Pair an incoming player with a slot he nominated, keeping the level the same or better. */
  function pair(inId,taken,score){var p=c.P(inId),best=null,bs=-1e9;c.onPitch.forEach(function(s){if(taken[s.pid]||taken['slot:'+s.slot])return;if(!nom(c.fit,p,s.pos))return;
    var fi=level(inId,s.pos,false),lo=level(s.pid,s.pos,true);if(fi<lo-0.25)return;var sc=score(s,fi,lo);if(sc>bs){bs=sc;best=s;}});return best;}
  function build(order,k,score){var taken={},ch=[],skipped=[];order.forEach(function(id){if(ch.length>=k)return;var s=pair(id,taken,score);if(!s){skipped.push(id);return;}taken[s.pid]=1;taken['slot:'+s.slot]=1;ch.push({off:s.pid,on:id,slot:s.slot,pos:s.pos});});return {ch:ch,skipped:skipped};}
  /* A knock comes off in every option, with the best bench player who nominated that position. */
  function knockFix(){var used={},ch=[];c.onPitch.filter(function(sl){return form(sl.pid)==='knock';}).forEach(function(sl){var best=null,bs=-1e9;bench.forEach(function(id){if(used[id])return;if(!nom(c.fit,c.P(id),sl.pos))return;var sc2=level(id,sl.pos,false)*10+need(id)/60;if(sc2>bs){bs=sc2;best=id;}});if(best){used[best]=1;ch.push({off:sl.pid,on:best,slot:sl.slot,pos:sl.pos});}});return ch;}
  var KN=knockFix();
  function withKnock(r,k2){if(!KN.length)return r;var ch=KN.slice();r.ch.forEach(function(x){if(ch.length>=Math.max(k2,KN.length))return;if(ch.some(function(y){return y.on===x.on||y.off===x.off||y.slot===x.slot;}))return;ch.push(x);});return {ch:ch,skipped:r.skipped};}
  var left=windowsLeft(c);var needy=benchNeed.filter(function(id){return need(id)>0;});
  var k=Math.min(3,bench.length,Math.max(1,Math.round(needy.length*2/Math.max(1,left))));
  var sc=c.score||[0,0],st=sc[0]>sc[1]?'We are '+sc[0]+'-'+sc[1]+' up':sc[0]<sc[1]?'We are '+sc[0]+'-'+sc[1]+' down':'It is '+sc[0]+'-'+sc[1];
  var opts=[];
  /* A: fair minutes */
  var a=build(benchNeed,k,function(s,fi,lo){return (form(s.pid)==='knock'?100:0)+c.mins(s.pid)/60+(form(s.pid)==='fly'?-15:0)+(fi-lo)*2;});
  a=withKnock(a,k);
  if(a.ch.length)opts.push({key:'fair',title:'Fair minutes',ch:a.ch,why:whyFair(a.ch)});
  /* B: fix what is happening on the pitch */
  var tapped=c.onPitch.filter(function(s){var f=form(s.pid);return f==='knock'||f==='tired'||f==='strug';});
  if(tapped.length||Object.keys(hot).length){
   var urg=function(sl){var f=form(sl.pid);return (f==='knock'?100:f==='tired'?40:f==='strug'?30:0)+(hot[sl.slot]||0)*20+c.mins(sl.pid)/600;};
   var want=c.onPitch.filter(function(sl){return urg(sl)>=20;}).sort(function(x,y){return urg(y)-urg(x);});
   var used={},b={ch:[]},kk=Math.max(1,Math.min(3,Math.max(tapped.length,k),bench.length));
   want.forEach(function(sl){if(b.ch.length>=kk)return;var best=null,bs=-1e9;bench.forEach(function(id){if(used[id])return;var p=c.P(id);if(!nom(c.fit,p,sl.pos))return;var fi=level(id,sl.pos,false),lo=level(sl.pid,sl.pos,true);if(fi<lo-0.25)return;var sc2=fi*10+need(id)/60;if(sc2>bs){bs=sc2;best=id;}});
    if(best){used[best]=1;b.ch.push({off:sl.pid,on:best,slot:sl.slot,pos:sl.pos});}});
   if(b.ch.length)opts.push({key:'fix',title:'Sort what is happening',ch:b.ch,why:whyFix(b.ch)});
  }
  /* C: keep it steady. One change, or none when we are on top and minutes are fine. */
  var atRisk=bench.filter(function(id){return c.mins(id)+Math.max(0,remain-(left>1?600:0))<floor;});
  if(calm&&!atRisk.length&&!tapped.length)opts.push({key:'steady',title:'Keep it steady',ch:[],why:[st+' and we are on top. Minutes are on track, so no change is needed yet.']});
  else{var cc=build(atRisk.length?atRisk.sort(function(x,y){return need(y)-need(x);}):benchNeed,1,function(s,fi,lo){return (fi-lo)*10+c.mins(s.pid)/60-(form(s.pid)==='fly'?50:0)-(hot[s.slot]?5:0);});
   if(!cc.ch.length&&atRisk.length)cc=build(benchNeed,1,function(s,fi,lo){return (fi-lo)*10+c.mins(s.pid)/60-(form(s.pid)==='fly'?50:0);});
   cc=withKnock(cc,1);
   if(cc.ch.length)opts.push({key:'steady',title:'Keep it steady',ch:cc.ch,why:whySteady(cc.ch)});}
  /* drop exact repeats */
  var seen={};opts=opts.filter(function(o){var s=o.ch.map(function(x){return x.off+'>'+x.on+'@'+x.slot;}).sort().join('|');if(seen[s])return false;seen[s]=1;return true;}).slice(0,3);
  var stuck=benchNeed.filter(function(id){return !opts.some(function(o){return o.ch.some(function(x){return x.on===id;});})&&need(id)>0;});
  return {opts:opts,fair:Math.round(fair/60),floor:Math.round(floor/60),state:st,stuck:stuck.map(function(id){return {id:id,why:numName(c,id)+' is not in any option: every position he nominated has someone doing as well or better.'};}),atRisk:atRisk};
  function minsTxt(id){return Math.floor(c.mins(id)/60)+"'";}
  function lst(a){return a.length>1?a.slice(0,-1).join(', ')+' and '+a[a.length-1]:a[0]||'';}
  function whyFair(ch){var ins=ch.filter(function(x){return form(x.off)!=='knock';});var w=[st+'.'];
   if(ch.length>ins.length)w.push(lst(ch.filter(function(x){return form(x.off)==='knock';}).map(function(x){return name(c,x.off);}))+' has a knock, so he comes off first.');
   if(ins.length)w.push('Minutes go to the players who need them most: '+lst(ins.map(function(x){return name(c,x.on)+' ('+minsTxt(x.on)+')';}))+'. Off: '+lst(ins.map(function(x){var f=form(x.off);return name(c,x.off)+' ('+minsTxt(x.off)+(f&&f!=='ok'?', '+FORM[f].n.toLowerCase():'')+')';}))+'.');
   return w;}
  function whyFix(ch){var w=[];ch.forEach(function(x){var f=form(x.off),bits=[];if(f==='knock')bits.push(name(c,x.off)+' has a knock. Take him off and check him');else if(f)bits.push(name(c,x.off)+' is '+FORM[f].n.toLowerCase());
    var why=opp.filter(function(k){var o=OPP[k];return (o.lines&&o.lines.indexOf(LINE[x.pos])>-1)||(o.slots&&o.slots.test(x.slot));}).map(function(k){return OPP[k].say;});
    if(why.length)bits.push((bits.length?'and ':'')+why.join(' and ')+', so fresh legs at '+x.slot);
    var t0=bits.join(' ')||'Fresh legs at '+x.slot;w.push(t0.charAt(0).toUpperCase()+t0.slice(1)+'. '+name(c,x.on)+' '+playsTxt(x)+'.');});return w;}
  function playsTxt(x){var p=c.P(x.on),a=(p&&c.pos?c.pos(p):[])||[];return a.indexOf(x.pos)>-1?'nominated '+x.pos:'nominated '+(a.join(', ')||'it')+', the same job as '+x.pos;}
  function whySteady(ch){var x=ch.filter(function(y){return form(y.off)!=='knock';})[0];if(!x)return [st+'. Only the change you need for the knock: '+lst(ch.map(function(y){return name(c,y.on)+' for '+name(c,y.off)+' at '+y.slot;}))+'.'];return (ch.length>1?[name(c,ch[0].off)+' has a knock, so he comes off first.']:[]).concat([st+'. One like for like change keeps the shape: '+name(c,x.on)+' for '+name(c,x.off)+' at '+x.slot+'.'+(atRisk.indexOf(x.on)>-1?' '+name(c,x.on)+' needs this to reach half the game.':'')]);}
 }
 function windowsLeft(c){var mm=c.t/60,n=0;windows(c.half).forEach(function(w){if(w.at>=mm-2)n++;});return Math.max(1,n);}
 G.TLSubs={FORM:FORM,OPP:OPP,windows:windows,open:open,next:next,plan:plan};
})(window);
