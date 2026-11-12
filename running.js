/* Touchline r112: Running and Fuel.
 * Ready made plans (Build up to 5k, position runs, steady, intervals, sprints, recovery, play speed)
 * or build your own from timed blocks. Big timer with beeps, spoken cues (browser speech) or silent.
 * Progress lives on this phone only (localStorage tl.run.v1). Nothing is sent to the backend,
 * the coaches or other families. Links out to Spotify, Strava, Nike Run Club and Google Fit only:
 * no accounts, no data sharing. Fuel and water: food first, no products, no medical advice.
 * Vanilla JS, works offline once cached by fsw.js. */
(function(G){
'use strict';
var KEY='tl.run.v1';
var BT={
 warm:{lab:'Warm up',col:'#1d4ed8',say:'Warm up. Brisk walk and loosen up.'},
 run:{lab:'Run',col:'#15803d',say:'Run. A pace where you could still chat.'},
 walk:{lab:'Walk',col:'#0e7490',say:'Walk. Get your breath back.'},
 jog:{lab:'Easy jog',col:'#4d7c0f',say:'Easy jog. Nice and relaxed.'},
 hard:{lab:'Hard run',col:'#c2410c',say:'Pick it up. Strong and quick.'},
 sprint:{lab:'Sprint',col:'#b91c1c',say:'Sprint. Full effort.'},
 rest:{lab:'Rest',col:'#6d28d9',say:'Rest. Stand tall and breathe.'},
 cool:{lab:'Cool down',col:'#1d4ed8',say:'Cool down. Walk it off.'}
};
var BUILD_TYPES=['run','walk','jog','hard','sprint','rest'];
var DUR=[10,15,20,30,45,60,90,120,180,300,600,1200];
var WU=[['warm',300]],CD=[['cool',300]];
function rep(n,a){var o=[];for(var i=0;i<n;i++)o=o.concat(a);return o;}
function wrap(main){return WU.concat(main,CD);}

/* Build up to 5k: 9 weeks, 3 runs a week. Our own schedule. */
var B5K=[
 {w:1,main:rep(8,[['run',60],['walk',90]]),tip:'Short runs with walks between. Go slower than you think.'},
 {w:2,main:rep(6,[['run',90],['walk',120]]),tip:'A bit more running each time. Still no rush.'},
 {w:3,main:rep(4,[['run',180],['walk',120]]),tip:'Three minute runs. Relax your shoulders.'},
 {w:4,main:rep(3,[['run',300],['walk',150]]),tip:'Five minutes at a time. Breathe out long.'},
 {w:5,main:[['run',480],['walk',180],['run',480],['walk',180],['run',300]],tip:'Longer runs. Keep the pace easy.'},
 {w:6,main:[['run',600],['walk',180],['run',600]],tip:'Two ten minute runs. You have done the hard part.'},
 {w:7,main:[['run',900],['walk',120],['run',600]],tip:'Fifteen minutes in one go first. Steady.'},
 {w:8,main:[['run',1500]],tip:'Twenty five minutes without stopping.'},
 {w:9,main:[['run',1800]],tip:'Thirty minutes. For most people that is about 5k. If it is less, that is fine.'}
];
var PLANS=[
 {id:'cb',grp:'pos',name:'Centre back',sub:'Win it, then recover',why:'Short bursts to win the first ball, then turn and get back. Lots of rest between, like a real game.',blocks:wrap([['jog',180]].concat(rep(6,[['sprint',6],['walk',54]]),[['jog',120]],rep(6,[['hard',15],['walk',45]])))},
 {id:'wb',grp:'pos',name:'Wing back',sub:'Up and down the line',why:'In our 352 the wing backs cover the whole flank. Repeated runs with short jogs between build that engine.',blocks:wrap(rep(2,rep(6,[['hard',30],['jog',30]]).concat([['rest',180]])).concat(rep(4,[['sprint',10],['walk',50]])))},
 {id:'cm',grp:'pos',name:'Centre mid',sub:'Box to box engine',why:'Longer hard spells to keep going all game, then quick bursts to get on the ball.',blocks:wrap(rep(3,[['hard',240],['jog',120]]).concat(rep(6,[['hard',15],['jog',45]])))},
 {id:'st',grp:'pos',name:'Striker',sub:'Sharp runs in behind',why:'Explosive runs in behind with full rest, so every one is quick.',blocks:wrap([['jog',120]].concat(rep(8,[['sprint',8],['walk',52]]),[['jog',180]],rep(6,[['sprint',10],['walk',50]])))},
 {id:'gk',grp:'pos',name:'Goalkeeper',sub:'Quick feet and spring',why:'Very short bursts, like coming off your line, with plenty of rest. Light on the long running.',blocks:wrap(rep(2,rep(8,[['sprint',5],['rest',40]]).concat([['rest',120]])).concat([['jog',300]]))},
 {id:'steady',grp:'type',name:'Steady run',sub:'20 minutes, chatting pace',why:'Builds the base. You should be able to talk in full sentences.',blocks:wrap([['run',1200]])},
 {id:'ints',grp:'type',name:'Intervals',sub:'30 seconds hard, 90 easy',why:'Hard then easy, over and over. Great for lasting the full game.',blocks:wrap(rep(8,[['hard',30],['walk',90]]))},
 {id:'sprints',grp:'type',name:'Sprints',sub:'Short and full effort',why:'Ten second sprints with full rest. Quality, not tiredness.',blocks:wrap([['jog',180]].concat(rep(8,[['sprint',10],['walk',80]])))},
 {id:'fart',grp:'type',name:'Play speed',sub:'Steady with quick bursts',why:'Steady running with a quick burst every couple of minutes.',blocks:wrap(rep(6,[['run',120],['hard',30]]).concat([['run',120]]))},
 {id:'rec',grp:'type',name:'Recovery jog',sub:'Easy, the day after',why:'Very easy. Use it the day after a game or hard training, or skip it and rest.',blocks:[['walk',180],['jog',900],['walk',300]]}
];
function b5kPlan(w){var x=B5K[(w||1)-1]||B5K[0];return {id:'b5k-w'+x.w,grp:'b5k',name:'Build up to 5k: week '+x.w,sub:'3 runs this week',why:x.tip,blocks:wrap(x.main),week:x.w};}

/* ---------- storage: this phone only ---------- */
function load(){try{var o=JSON.parse(localStorage.getItem(KEY)||'{}');o.custom=o.custom||[];o.log=o.log||[];o.b5k=o.b5k||{};o.cue=o.cue||'voice';return o;}catch(e){return {custom:[],log:[],b5k:{},cue:'voice'};}}
function save(o){try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}}
function E(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function mmss(s){s=Math.max(0,Math.round(s));var m=Math.floor(s/60),x=s%60;return m+':'+(x<10?'0':'')+x;}
function durLab(s){if(s<60)return s+' sec';var m=Math.floor(s/60),x=s%60;return m+' min'+(x?' '+x+' sec':'');}
function sayDur(s){var m=Math.floor(s/60),x=s%60,o=[];if(m)o.push(m+(m===1?' minute':' minutes'));if(x)o.push(x+' seconds');return o.join(' ');}
function total(b){return b.reduce(function(a,x){return a+x[1];},0);}
function bl(x){return (BT[x[0]]||{lab:x[0]}).lab+' '+durLab(x[1]);}
/* "Warm up 5 min, 8 x (Run 1 min, Walk 90 sec), Cool down 5 min" */
function summary(b){var out=[],i=0;
 while(i<b.length){var best=null;
  for(var len=1;len<=20&&i+2*len<=b.length;len++){var n=1;
   while(i+(n+1)*len<=b.length&&same(b.slice(i,i+len),b.slice(i+n*len,i+(n+1)*len)))n++;
   if(n>=2&&(!best||n*len>best.n*best.len))best={n:n,len:len};
  }
  if(best){out.push(best.n+' x ('+summary(b.slice(i,i+best.len))+')');i+=best.n*best.len;}
  else{out.push(bl(b[i]));i++;}
 }
 return out.join(', ');}
function same(a,b){return a.length===b.length&&a.every(function(x,k){return x[0]===b[k][0]&&x[1]===b[k][1];});}
function findPlan(id){if(/^b5k-w\d$/.test(id))return b5kPlan(Number(id.slice(5)));var p=PLANS.filter(function(x){return x.id===id;})[0];if(p)return p;return load().custom.filter(function(x){return x.id===id;})[0]||null;}
function b5kNext(st){for(var w=1;w<=9;w++)for(var r=1;r<=3;r++)if(!st.b5k['w'+w+'r'+r])return {w:w,r:r};return null;}
function weekCount(st){var a=Date.now()-7*864e5;return st.log.filter(function(x){return x.at>a;}).length;}

/* ---------- styles (inline so it works offline with the js) ---------- */
function css(){if(document.getElementById('tl-run-css'))return;var s=document.createElement('style');s.id='tl-run-css';s.textContent=
'.tl-runview{position:fixed;inset:0;z-index:96;background:rgba(2,10,30,.78);display:flex;align-items:flex-end;justify-content:center;padding:10px}'+
'.tl-run-sheet{background:var(--card,#0E1D45);color:var(--ink,#F4F6FC);border:1px solid var(--line,#27407F);border-radius:16px 16px 12px 12px;max-width:620px;width:100%;max-height:94vh;overflow:auto;padding:14px 14px 28px;box-shadow:0 -8px 40px rgba(0,0,0,.45)}'+
'html body .tl-run-sheet .btn,html body .tl-run-sheet .btn.sm{min-height:48px}html body .tl-run-sheet .chip{min-height:48px;min-width:48px}'+
'.tl-run-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px}'+
'.tl-run-tile{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:2px;min-height:72px;padding:10px 12px;border-radius:12px;border:1px solid var(--line,#27407F);background:var(--card2,#15295A);color:inherit;font:inherit;cursor:pointer}'+
'.tl-run-tile b{font-size:16px}.tl-run-tile span{font-size:13px;opacity:.85}'+
'.tl-run-blocks{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0}.tl-run-blk{border-radius:8px;padding:6px 8px;font-size:13px;color:#fff}'+
'.tl-run-b5k{display:grid;grid-template-columns:auto repeat(3,1fr);gap:6px;align-items:center;margin-top:8px}'+
'.tl-run-b5k button{min-height:48px;border-radius:10px;border:1px solid var(--line,#27407F);background:transparent;color:inherit;font:inherit}'+
'.tl-run-b5k button.on{background:#15803d;border-color:#15803d;font-weight:700}'+
'.tl-run-timer{position:fixed;inset:0;z-index:98;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:calc(16px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom));color:#fff;background:#15803d;transition:background .3s}'+
'.tl-run-tlab{font-size:clamp(28px,7vw,52px);font-weight:800;text-align:center;margin-top:8px}'+
'.tl-run-big{font-size:clamp(88px,26vw,220px);font-weight:800;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-2px}'+
'.tl-run-next{font-size:clamp(18px,4.5vw,26px);opacity:.92;text-align:center}'+
'.tl-run-bar{width:100%;max-width:640px;height:12px;border-radius:6px;background:rgba(0,0,0,.25);overflow:hidden}.tl-run-bar i{display:block;height:100%;background:#fff;width:0}'+
'.tl-run-ctl{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:100%;max-width:640px}'+
'.tl-run-ctl button{min-height:64px;border-radius:14px;border:2px solid rgba(255,255,255,.7);background:rgba(0,0,0,.18);color:#fff;font:inherit;font-size:18px;font-weight:700}'+
'.tl-run-cues{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}.tl-run-cues button{min-height:48px;padding:0 14px;border-radius:24px;border:1px solid rgba(255,255,255,.7);background:transparent;color:#fff;font:inherit}.tl-run-cues button.on{background:#fff;color:#0b1330;font-weight:700}'+
'.tl-run-fuel h3{margin:16px 0 6px}.tl-run-fuel li{margin:4px 0}.tl-run-fuel a{color:#93c5fd}'+
'@media(min-width:720px){.tl-runview{align-items:center}.tl-run-sheet{border-radius:16px;max-height:88vh}}';
document.head.appendChild(s);}

/* ---------- views ---------- */
var V={view:'hub',id:null,draft:null,msg:''};
function cueChips(cue,inTimer){var L=[['beeps','Beeps'],['voice','Voice'],['silent','Silent']];
 return '<div class="'+(inTimer?'tl-run-cues':'chips tl-fit-chips')+'" role="group" aria-label="Sound">'+L.map(function(x){return '<button type="button" class="'+(inTimer?'':'chip')+(cue===x[0]?' on':'')+'" data-run="cue" data-v="'+x[0]+'" aria-pressed="'+(cue===x[0])+'">'+x[1]+'</button>';}).join('')+'</div>';}
function tile(p){return '<button type="button" class="tl-run-tile" data-run="plan" data-id="'+E(p.id)+'"><b>'+E(p.name)+'</b><span>'+E(p.sub)+'</span><span>'+Math.round(total(p.blocks)/60)+' min</span></button>';}
function musicLinks(){var open=(typeof TL_SPOTIFY_OPEN==='string')?TL_SPOTIFY_OPEN:'https://open.spotify.com/';
 return '<div class="card" id="tl-run-music"><h3 style="margin-top:0">Music</h3><p class="small muted">Start your music first, then start the timer. The cues play over the top. We do not see what you play.</p>'+
 '<div class="row wrap2" style="gap:6px"><a class="btn grow" id="tl-run-spot" href="'+E(open)+'" target="_blank" rel="noopener noreferrer">Coaches\' playlist on Spotify</a>'+
 '<a class="btn grow" id="tl-run-spot2" href="https://open.spotify.com/search/running%20playlist" target="_blank" rel="noopener noreferrer">Find a running playlist</a></div></div>';}
function appLinks(p){return '<div class="card" id="tl-run-apps"><h3 style="margin-top:0">Use your own app as well</h3><p class="small muted">Want to track distance or keep a record? Open your own app alongside this timer. These are just links: nothing from Touchline goes to them and you do not need an account with us. Strava is 13 and over and under 18s need a parent\'s OK, so ask at home before you sign up to any app.</p>'+
 '<div class="row wrap2" style="gap:6px"><a class="btn grow" href="https://www.strava.com/" target="_blank" rel="noopener noreferrer">Strava</a><a class="btn grow" href="https://www.nike.com/nrc-app" target="_blank" rel="noopener noreferrer">Nike Run Club</a><a class="btn grow" href="https://www.google.com/fit/" target="_blank" rel="noopener noreferrer">Google Fit</a></div>'+
 (p?'<button type="button" class="btn block" style="margin-top:8px" data-run="copy" data-id="'+E(p.id)+'">Copy this session as text</button><p class="small muted" id="tl-run-copied" role="status" style="margin:6px 0 0">Paste it into any interval timer app or your notes.</p>':'')+'</div>';}
function hubHtml(st){
 var nx=b5kNext(st),wk=weekCount(st);
 var h='<div class="card"><span class="tag" style="background:#15803d">Running</span><h2 style="margin-top:8px">Running</h2><p class="small">Pick a ready made run or build your own. The timer tells you when to run, walk, sprint or rest.</p>'+
  '<p class="small muted">Two or three runs a week on top of training is plenty. Keep the day before a game easy. If anything hurts, stop and tell a parent or a coach.</p>'+
  '<p class="small"><b>'+wk+'</b> run'+(wk===1?'':'s')+' in the last 7 days on this phone.</p>'+
  '<label style="margin-top:6px;display:block">Sound during the timer</label>'+cueChips(st.cue)+'</div>';
 h+='<div class="card" id="tl-run-b5k"><h3 style="margin-top:0">Build up to 5k</h3><p class="small">New to running, or getting back into it? Nine weeks, three runs a week, starting with one minute runs. By week 9 you run for 30 minutes.</p>'+
  (nx?'<button type="button" class="btn pri block" data-run="plan" data-id="b5k-w'+nx.w+'" data-r="'+nx.r+'">Start week '+nx.w+', run '+nx.r+'</button>':'<p><b>All 27 runs done. Brilliant.</b> Keep it going with a Steady run or Play speed.</p>')+
  '<details style="margin-top:8px"><summary>Your 9 weeks (tap a run to tick it)</summary><div class="tl-run-b5k">'+
  B5K.map(function(x){var row='<span class="small">Week '+x.w+'</span>';for(var r=1;r<=3;r++){var k='w'+x.w+'r'+r,on=!!st.b5k[k];row+='<button type="button" class="'+(on?'on':'')+'" data-run="tick" data-k="'+k+'" aria-pressed="'+on+'" aria-label="Week '+x.w+' run '+r+(on?' done':'')+'">'+(on?'Done':'Run '+r)+'</button>';}return row;}).join('')+
  '</div><p class="small muted">Rest a day between runs. Repeat a week if you need to, that is normal.</p></details></div>';
 h+='<h3 class="tl-mh">By position</h3><div class="tl-run-grid">'+PLANS.filter(function(p){return p.grp==='pos';}).map(tile).join('')+'</div>';
 h+='<h3 class="tl-mh">Other runs</h3><div class="tl-run-grid">'+PLANS.filter(function(p){return p.grp==='type';}).map(tile).join('')+'</div>';
 h+='<h3 class="tl-mh">Your own runs</h3>'+(st.custom.length?'<div class="tl-run-grid">'+st.custom.map(tile).join('')+'</div>':'<p class="small muted">None yet.</p>')+
  '<button type="button" class="btn pri block" style="margin-top:8px" data-run="build">Build your own run</button>';
 h+='<div class="card" style="margin-top:12px"><h3 style="margin-top:0">Fuel and water</h3><p class="small muted">What to eat and drink before and after games and training.</p><button type="button" class="btn block" data-run="fuel">Open Fuel and water</button></div>';
 h+=musicLinks()+appLinks(null);
 h+='<p class="small muted">Your runs are saved on this phone only. The coaches and other families do not see them.</p>';
 return h;}
function blocksHtml(b){return '<div class="tl-run-blocks">'+b.map(function(x){var t=BT[x[0]]||{lab:x[0],col:'#334155'};return '<span class="tl-run-blk" style="background:'+t.col+'">'+E(t.lab)+' '+durLab(x[1])+'</span>';}).join('')+'</div>';}
function planHtml(p,st){
 var h='<div class="card" id="tl-run-plan" data-id="'+E(p.id)+'"><h2 style="margin-top:0">'+E(p.name)+'</h2><p class="small muted">'+E(p.sub||'')+' · about '+Math.round(total(p.blocks)/60)+' min</p>'+(p.why?'<p class="small">'+E(p.why)+'</p>':'')+
  '<p class="small"><b>The session:</b> '+E(summary(p.blocks))+'</p><details><summary>See every block ('+p.blocks.length+')</summary>'+blocksHtml(p.blocks)+'</details>'+
  '<label style="display:block;margin-top:6px">Sound</label>'+cueChips(st.cue)+
  '<button type="button" class="btn pri block" style="margin-top:10px;min-height:56px;font-size:18px" data-run="start" data-id="'+E(p.id)+'">Start the timer</button>'+
  (p.grp==='custom'?'<button type="button" class="btn block" style="margin-top:8px" data-run="del" data-id="'+E(p.id)+'">Delete this run</button>':'')+
  '<button type="button" class="btn block" style="margin-top:8px" data-run="back">Back to running</button></div>';
 return h+musicLinks()+appLinks(p);}
function builderHtml(d){
 var main=d.blocks,full=(d.wu?WU:[]).concat(rep(d.reps,main),d.cd?CD:[]);
 var h='<div class="card" id="tl-run-build"><h2 style="margin-top:0">Build your own run</h2><p class="small muted">Pick a type, pick how long, tap Add. Add as many as you like, then choose how many times to repeat them.</p>'+
  '<label for="tl-run-name">Name</label><input id="tl-run-name" maxlength="40" placeholder="For example Tuesday hills" value="'+E(d.name||'')+'">'+
  '<label style="display:block;margin-top:10px">Type</label><div class="chips tl-fit-chips">'+BUILD_TYPES.map(function(k){return '<button type="button" class="chip'+(d.type===k?' on':'')+'" data-run="btype" data-v="'+k+'">'+BT[k].lab+'</button>';}).join('')+'</div>'+
  '<label style="display:block;margin-top:10px">How long</label><div class="chips tl-fit-chips">'+DUR.map(function(s){return '<button type="button" class="chip'+(d.secs===s?' on':'')+'" data-run="bdur" data-v="'+s+'">'+durLab(s)+'</button>';}).join('')+'</div>'+
  '<button type="button" class="btn block" style="margin-top:10px" data-run="badd">Add '+E(BT[d.type].lab)+' '+durLab(d.secs)+'</button>'+
  '<h3 style="margin:14px 0 4px">Your blocks</h3>'+(main.length?main.map(function(x,i){return '<div class="row" style="align-items:center;margin-top:4px"><span class="tl-run-blk grow" style="background:'+BT[x[0]].col+';flex:1">'+E(BT[x[0]].lab)+' '+durLab(x[1])+'</span><button type="button" class="btn sm" style="flex:0 0 auto" data-run="brm" data-i="'+i+'" aria-label="Remove '+E(BT[x[0]].lab)+'">Remove</button></div>';}).join(''):'<p class="small muted">Nothing added yet.</p>')+
  '<label style="display:block;margin-top:10px">Repeat these blocks</label><div class="chips tl-fit-chips">'+[1,2,3,4,5,6,8,10].map(function(n){return '<button type="button" class="chip'+(d.reps===n?' on':'')+'" data-run="breps" data-v="'+n+'">'+n+(n===1?' time':' times')+'</button>';}).join('')+'</div>'+
  '<div class="chips tl-fit-chips" style="margin-top:10px"><button type="button" class="chip'+(d.wu?' on':'')+'" data-run="bwu" aria-pressed="'+d.wu+'">5 min warm up</button><button type="button" class="chip'+(d.cd?' on':'')+'" data-run="bcd" aria-pressed="'+d.cd+'">5 min cool down</button></div>'+
  '<p class="small" id="tl-run-btotal" style="margin-top:10px"><b>Total:</b> '+mmss(total(full))+(full.length?' · '+E(summary(full)):'')+'</p>'+
  (total(full)>90*60?'<p class="small" style="color:#fbbf24">That is over 90 minutes. Keep it shorter: more is not always better.</p>':'')+
  (V.msg?'<p class="small" role="status">'+E(V.msg)+'</p>':'')+
  '<button type="button" class="btn pri block" style="margin-top:8px" data-run="bsave"'+(main.length?'':' disabled')+'>Save and open</button>'+
  '<button type="button" class="btn block" style="margin-top:8px" data-run="back">Cancel</button></div>';
 return h;}
function fuelHtml(){
 var a=function(u,t){return '<a href="'+u+'" target="_blank" rel="noopener noreferrer">'+t+'</a>';};
 return '<div class="card tl-run-fuel" id="tl-run-fuel"><span class="tag" style="background:#b45309">Fuel and water</span><h2 style="margin-top:8px">Fuel and water</h2>'+
 '<p>Food is your fuel. Normal meals do the job. You do not need anything special or expensive.</p>'+
 '<h3>Before a game or training</h3><ul>'+
 '<li>Have a proper meal two to three hours before: pasta, rice, potatoes, bread or cereal, with some chicken, fish, eggs, beans or cheese.</li>'+
 '<li>Short on time? A small snack an hour before: a banana, toast, a cereal bar or yoghurt.</li>'+
 '<li>For a 9am kick off, eat breakfast early: porridge, cereal or toast with eggs or peanut butter.</li>'+
 '<li>Skip crisps, sweets and fizzy drinks just before. The sugar rush drops off fast.</li></ul>'+
 '<h3>Water</h3><ul>'+
 '<li>Drink through the day, not all at once. Six to eight glasses is a good guide, more when it is hot or you are training.</li>'+
 '<li>Bring your own bottle to every game and session and sip at breaks.</li>'+
 '<li>A quick check: pale wee means you are drinking enough. Dark means drink more.</li>'+
 '<li>Water or milk is best. Skip energy drinks: they are full of caffeine and sugar and are not meant for under 18s.</li></ul>'+
 '<h3>On matchday</h3><ul>'+
 '<li>Pack a water bottle and a banana or orange for half time.</li>'+
 '<li>Eat what you are used to. Matchday is not the day to try new food.</li></ul>'+
 '<h3>After a game or training</h3><ul>'+
 '<li>Eat within an hour or so: a meal, or milk, yoghurt, a sandwich or beans on toast.</li>'+
 '<li>Something starchy for energy plus some protein to help your muscles recover.</li></ul>'+
 '<h3>Protein shakes, aminos and supplements</h3>'+
 '<p>You do not need them. Under 18s get all the protein they need from normal food, and most teenagers already eat more than enough. Shakes, amino drinks and powders cost a lot, do not help a growing body more than food does, and some contain things that are banned in sport. The England Football, British Dietetic Association and UK Anti-Doping advice is food first.</p>'+
 '<p class="small"><b>Anything health related</b>, like allergies, feeling dizzy or tired all the time, or thinking about your weight: talk to your parent or your GP. This card is general football guidance, not medical advice.</p>'+
 '<h3>Read more</h3><ul class="small">'+
 '<li>'+a('https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/','NHS: The Eatwell Guide')+'</li>'+
 '<li>'+a('https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/water-drinks-nutrition/','NHS: Water, drinks and hydration')+'</li>'+
 '<li>'+a('https://learn.englandfootball.com/articles-and-resources/Welfare/resources/2024/How-to-help-young-people-eat-well','England Football: How to help young people eat well')+'</li>'+
 '<li>'+a('https://www.bda.uk.com/resource/sport-exercise-nutrition.html','British Dietetic Association: Sport and exercise')+'</li>'+
 '<li>'+a('https://www.bda.uk.com/resource/healthy-eating-for-children.html','British Dietetic Association: Healthy eating for children')+'</li>'+
 '<li>'+a('https://www.ukad.org.uk/athletes/managing-supplement-risks','UK Anti-Doping: Supplement risks')+'</li></ul>'+
 '<button type="button" class="btn block" style="margin-top:10px" data-run="back">Back to running</button></div>';}
function newDraft(){return {name:'',type:'run',secs:60,blocks:[],reps:1,wu:true,cd:true};}
function paint(){css();var ov=document.getElementById('tl-runview');
 if(!ov){ov=document.createElement('div');ov.id='tl-runview';ov.className='tl-runview';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Running');document.body.appendChild(ov);}
 var st=load(),h='';
 if(V.view==='fuel')h=fuelHtml();
 else if(V.view==='build')h=builderHtml(V.draft||(V.draft=newDraft()));
 else if(V.view==='plan'){var p=findPlan(V.id);h=p?planHtml(p,st):'<div class="card"><p>That run is not on this phone.</p><button type="button" class="btn" data-run="back">Back</button></div>';}
 else h=hubHtml(st);
 var title=V.view==='fuel'?'Fuel and water':'Running';
 ov.setAttribute('aria-label',title);
 var sc=ov.querySelector('.tl-run-sheet'),keep=sc&&ov.getAttribute('data-v')===V.view+(V.id||'')?sc.scrollTop:0;
 ov.innerHTML='<div class="tl-run-sheet"><div class="row" style="align-items:center;margin:0 0 8px"><b style="font-size:19px">'+title+'</b><span class="grow" style="flex:1"></span><button type="button" class="btn sm" style="flex:0 0 auto" data-run="x" aria-label="Close">Close</button></div>'+h+'</div>';
 ov.setAttribute('data-v',V.view+(V.id||''));
 if(keep)ov.querySelector('.tl-run-sheet').scrollTop=keep;}
function open(o){o=o||{};try{if(G.TLFit&&TLFit.close)TLFit.close();}catch(e){}V.view=o.view||'hub';V.id=o.id||null;V.msg='';if(V.view==='build')V.draft=newDraft();paint();}
function close(){var ov=document.getElementById('tl-runview');if(ov)ov.remove();}

/* ---------- timer ---------- */
var T=null,AC=null,WL=null;
function log(kind,text){(R._log=R._log||[]).push({k:kind,t:text,at:Date.now()});if(R._log.length>200)R._log.shift();}
function beep(f,ms){log('beep',String(f));try{AC=AC||new (G.AudioContext||G.webkitAudioContext)();if(AC.state==='suspended')AC.resume();var o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;o.type='sine';g.gain.setValueAtTime(0.0001,AC.currentTime);g.gain.exponentialRampToValueAtTime(0.4,AC.currentTime+0.02);g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+ms/1000);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+ms/1000+0.05);}catch(e){}}
function say(t){log('say',t);try{if(!G.speechSynthesis)return;speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.lang='en-GB';u.rate=1;var v=(speechSynthesis.getVoices()||[]).filter(function(x){return /en-GB/i.test(x.lang);})[0];if(v)u.voice=v;speechSynthesis.speak(u);}catch(e){}}
function buzz(p){try{if(navigator.vibrate)navigator.vibrate(p);}catch(e){}}
function cue(){return load().cue||'voice';}
function blockStartCue(b,next){var c=cue();buzz(200);if(c==='silent')return;if(c==='beeps'){beep(880,450);return;}var t=BT[b[0]]||{say:''};say(t.say+' '+sayDur(b[1])+'.');}
function nowMs(){return (G.performance&&performance.now)?performance.now():Date.now();}
function speed(){return Number(R._speed)||1;}
function start(id){var p=findPlan(id);if(!p)return;close();css();
 T={p:p,i:-1,left:0,endAt:0,paused:false,said:{},startedAt:Date.now(),iv:null,r:(V.r||null)};
 var el=document.createElement('div');el.id='tl-run-timer';el.className='tl-run-timer';el.setAttribute('role','dialog');el.setAttribute('aria-label','Run timer');document.body.appendChild(el);
 try{if(navigator.wakeLock)navigator.wakeLock.request('screen').then(function(w){WL=w;}).catch(function(){});}catch(e){}
 try{AC=AC||new (G.AudioContext||G.webkitAudioContext)();}catch(e){}
 go(0);T.iv=setInterval(tick,200);}
function go(i){if(!T)return;if(i>=T.p.blocks.length){finish();return;}if(i<0)i=0;T.i=i;var b=T.p.blocks[i];T.left=b[1];T.endAt=nowMs()+b[1]*1000/speed();T.said={};T.paused=false;blockStartCue(b,T.p.blocks[i+1]);paintTimer();}
function tick(){if(!T||T.paused)return;var b=T.p.blocks[T.i],ms=(T.endAt-nowMs())*speed(),left=Math.ceil(ms/1000);
 if(left!==T.left){T.left=left;var c=cue();
  if(c!=='silent'&&left<=3&&left>=1&&!T.said['c'+left]){T.said['c'+left]=1;beep(660,140);}
  if(c==='voice'&&b[1]>=60&&left===Math.round(b[1]/2)&&!T.said.h){T.said.h=1;say('Halfway. Keep it going.');}
  if(c==='voice'&&b[1]>=30&&left===10&&!T.said.t){T.said.t=1;say('Ten seconds.');}
  paintTimer();}
 if(ms<=0)go(T.i+1);}
function paintTimer(){var el=document.getElementById('tl-run-timer');if(!el||!T)return;var b=T.p.blocks[T.i],t=BT[b[0]]||{lab:b[0],col:'#334155'},nx=T.p.blocks[T.i+1];
 var done=total(T.p.blocks.slice(0,T.i))+(b[1]-T.left),all=total(T.p.blocks);
 el.style.background=t.col;
 el.innerHTML='<div style="width:100%;max-width:640px"><div class="row" style="align-items:center;margin:0"><b style="flex:1;font-size:17px">'+E(T.p.name)+'</b><span style="font-size:15px">Block '+(T.i+1)+' of '+T.p.blocks.length+'</span></div><div class="tl-run-bar" style="margin-top:8px" aria-hidden="true"><i style="width:'+Math.round(100*done/all)+'%"></i></div><p style="margin:6px 0 0;font-size:15px">'+mmss(all-done)+' left in total</p></div>'+
  '<div style="text-align:center"><div class="tl-run-tlab" id="tl-run-tlab">'+E(t.lab)+(T.paused?' (paused)':'')+'</div><div class="tl-run-big" id="tl-run-left" role="timer" aria-live="off">'+mmss(T.left)+'</div><div class="tl-run-next" id="tl-run-next">'+(nx?'Next: '+E((BT[nx[0]]||{lab:nx[0]}).lab)+' '+durLab(nx[1]):'Last block')+'</div></div>'+
  '<div style="width:100%;max-width:640px;display:flex;flex-direction:column;gap:10px;align-items:center">'+cueChips(cue(),true)+
  '<div class="tl-run-ctl"><button type="button" data-run="tprev" aria-label="Previous block">Back</button><button type="button" data-run="tpause">'+(T.paused?'Resume':'Pause')+'</button><button type="button" data-run="tskip" aria-label="Next block">Skip</button><button type="button" data-run="tstop">Stop</button></div></div>';}
function release(){try{if(T&&T.iv)clearInterval(T.iv);}catch(e){}try{if(WL)WL.release();}catch(e){}WL=null;try{if(G.speechSynthesis)speechSynthesis.cancel();}catch(e){}}
function record(complete){if(!T)return;var st=load(),secs=Math.round((Date.now()-T.startedAt)/1000);
 if(complete||secs>=120){st.log.unshift({id:T.p.id,name:T.p.name,at:Date.now(),secs:secs,full:!!complete});while(st.log.length>200)st.log.pop();}
 if(complete&&T.p.week){var k=null;for(var r=1;r<=3;r++){if(!st.b5k['w'+T.p.week+'r'+r]){k='w'+T.p.week+'r'+r;break;}}if(k)st.b5k[k]=Date.now();}
 save(st);}
function finish(){var c=cue();if(c==='voice')say('Session done. Well played. Stretch off and have a drink.');else if(c==='beeps'){beep(880,300);setTimeout(function(){beep(1100,500);},350);}
 record(true);var p=T.p;release();var el=document.getElementById('tl-run-timer');
 if(el){el.style.background='#0b1330';el.innerHTML='<div></div><div style="text-align:center;max-width:520px"><div class="tl-run-tlab">Session done</div><p style="font-size:20px">'+E(p.name)+', '+mmss(total(p.blocks))+'. Saved on this phone.</p><p class="small">Stretch off, have a drink and something to eat.</p></div><div style="width:100%;max-width:640px;display:grid;gap:8px"><button type="button" class="btn pri block" style="min-height:56px" data-run="tdone">Back to running</button><button type="button" class="btn block" style="min-height:56px" data-run="fuel">Fuel and water</button></div>';}
 T=null;}
function stop(){if(!T)return;record(false);release();T=null;var el=document.getElementById('tl-run-timer');if(el)el.remove();V.view='hub';paint();}
var prevHold=G.tlHold;
G.tlHold=function(){if(T)return 'session';try{return prevHold?prevHold():'';}catch(e){return '';}};

/* ---------- events ---------- */
function onClick(e){var t=e.target.closest&&e.target.closest('[data-run]');if(!t)return;var a=t.getAttribute('data-run');e.preventDefault();
 if(a==='hub'){open({view:'hub'});return;}
 if(a==='fuel'){var tm=document.getElementById('tl-run-timer');if(tm&&!T)tm.remove();open({view:'fuel'});return;}
 if(a==='x'){close();return;}
 if(a==='back'){V.view='hub';V.id=null;V.msg='';paint();return;}
 if(a==='cue'){var st=load();st.cue=t.getAttribute('data-v');save(st);if(T){paintTimer();if(st.cue==='voice')say('Voice on.');else if(st.cue==='beeps')beep(880,200);}else paint();return;}
 if(a==='plan'){V.view='plan';V.id=t.getAttribute('data-id');V.r=Number(t.getAttribute('data-r'))||null;paint();return;}
 if(a==='tick'){var s2=load(),k=t.getAttribute('data-k');if(s2.b5k[k])delete s2.b5k[k];else s2.b5k[k]=Date.now();save(s2);paint();return;}
 if(a==='start'){start(t.getAttribute('data-id'));return;}
 if(a==='build'){V.view='build';V.draft=newDraft();V.msg='';paint();return;}
 if(a==='del'){if(!confirm('Delete this run from this phone?'))return;var s3=load();s3.custom=s3.custom.filter(function(x){return x.id!==t.getAttribute('data-id');});save(s3);V.view='hub';paint();return;}
 if(a==='copy'){var p=findPlan(t.getAttribute('data-id'));if(!p)return;var txt=p.name+' ('+mmss(total(p.blocks))+'): '+summary(p.blocks);var n=document.getElementById('tl-run-copied');
  var okc=function(){if(n)n.textContent='Copied. Paste it into your timer app or notes.';};
  try{navigator.clipboard.writeText(txt).then(okc,function(){if(n)n.textContent=txt;});}catch(err){if(n)n.textContent=txt;}return;}
 var d=V.draft;
 if(d&&a.charAt(0)==='b'&&a!=='back'&&a!=='build'){var nm=document.getElementById('tl-run-name');if(nm)d.name=nm.value;V.msg='';
  if(a==='btype')d.type=t.getAttribute('data-v');
  else if(a==='bdur')d.secs=Number(t.getAttribute('data-v'));
  else if(a==='badd'){if(d.blocks.length<30)d.blocks.push([d.type,d.secs]);else V.msg='That is the most blocks you can add.';}
  else if(a==='brm')d.blocks.splice(Number(t.getAttribute('data-i')),1);
  else if(a==='breps')d.reps=Number(t.getAttribute('data-v'));
  else if(a==='bwu')d.wu=!d.wu;
  else if(a==='bcd')d.cd=!d.cd;
  else if(a==='bsave'){if(!d.blocks.length)return;var full=(d.wu?WU:[]).concat(rep(d.reps,d.blocks),d.cd?CD:[]);
   var cp={id:'my'+Date.now().toString(36),grp:'custom',name:(String(d.name||'').trim()||'My run').slice(0,40),sub:'Your own run',why:'',blocks:full,at:Date.now()};
   var s4=load();s4.custom.unshift(cp);while(s4.custom.length>20)s4.custom.pop();save(s4);V.view='plan';V.id=cp.id;V.draft=null;}
  paint();return;}
 if(!T)return;
 if(a==='tpause'){if(T.paused){T.endAt=nowMs()+T.left*1000/speed();T.paused=false;}else{T.left=Math.max(0,Math.ceil((T.endAt-nowMs())*speed()/1000));T.paused=true;}paintTimer();return;}
 if(a==='tskip'){go(T.i+1);return;}
 if(a==='tprev'){go(T.i-1);return;}
 if(a==='tstop'){if(T.i>0&&!confirm('Stop this run?'))return;stop();return;}
}
document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('[data-run]');if(t&&t.getAttribute('data-run')==='tdone'){e.preventDefault();var el=document.getElementById('tl-run-timer');if(el)el.remove();V.view='hub';paint();return;}onClick(e);});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!T&&document.getElementById('tl-runview'))close();});

var R=G.TLRun={open:open,close:close,start:start,plans:PLANS,b5k:B5K,b5kPlan:b5kPlan,summary:summary,total:total,load:load,
 state:function(){return T?{id:T.p.id,i:T.i,left:T.left,paused:T.paused,type:T.p.blocks[T.i][0],n:T.p.blocks.length}:null;},_log:[],_speed:1};
})(window);
