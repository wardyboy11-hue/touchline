function attWeek(){var td=today(),p=td.split('-'),dow=new Date(+p[0],+p[1]-1,+p[2]).getDay(),end=addD(td,(6-dow+7)%7);return {start:addD(end,-6),end:end};}
function attLive(x){return x&&x.status!=='removed'&&x.status!=='draft'&&!x.deleted;}
function attRow(use,kind,fx){var x=X(),who=D.role==='player'?'you':esc(D.first),td=today(),mt=kind==='match';
 var q=mt?(D.role==='player'?'Playing?':'Is '+who+' playing?'):(D.role==='player'?'Can you come?':'Can '+who+' come?');
 if(mt&&!fx&&use)fx=x.fixtures.filter(function(m){return m.date===use.date;})[0]||null;
 var head='<p class="att-q" style="margin:0 0 2px;font-size:18px;font-weight:800">'+q+'</p>';
 if(mt&&fx&&fx.pp)return '<div class="att-row att-pp" id="att-match" style="padding:10px 0;border-top:1px solid var(--line)"><p class="att-q" style="margin:0 0 2px;font-size:18px;font-weight:800">Match called off</p><p style="margin:2px 0"><b>'+esc((fx.ha==='A'?'at ':'v ')+(fx.opp||'opponent'))+'</b><br>'+esc(nice(fx.date))+'</p><p class="small" style="margin:4px 0 0">'+esc(fx.ppnote||'This game is postponed. New date to follow.')+'</p></div>';
 if(!use){var when=mt&&fx?esc(nice(fx.date))+(fx.ko?', kick off '+esc(fx.ko):''):'';
  if(!mt){var w=attWeek(),wd=addD(w.start,3);if(wd<td)return '';when=esc(nice(wd))+', 20:00 to 21:00';}
  if(mt&&!fx)return '';
  return '<div class="att-row att-wait" id="att-'+(mt?'match':'train')+'" style="padding:10px 0;border-top:1px solid var(--line)"><p class="att-q" style="margin:0 0 2px;font-size:18px;font-weight:800">'+(mt?'Match':'Training')+'</p><p style="margin:2px 0">'+(mt&&fx?'<b>'+esc((fx.ha==='A'?'at ':'v ')+(fx.opp||'opponent'))+'</b><br>':'')+when+'</p><p class="small muted" style="margin:4px 0 0">The coaches have not asked yet. Your Yes or No buttons show here when they do.</p></div>';}
 var mine=(D.mine||{})[use.id]||'',past=use.date<td,pl=use.place||(fx&&fx.venue)||'';
 var h='<div class="att-row" id="att-'+(mt?'match':'train')+'" data-post="'+esc(use.id)+'" style="padding:10px 0;border-top:1px solid var(--line)">'+head;
 h+='<p style="margin:2px 0"><b>'+esc(use.title||(mt?'Match':'Training'))+'</b><br>'+esc(nice(use.date))+(use.time?', '+esc(use.time)+(!mt&&use.time==='20:00'?' to 21:00':''):'')+(pl?'<br>'+esc(pl):'')+'</p>';
 if(mt&&fx&&!past){var meet=(window.TLCD&&TLCD.meetChip)?TLCD.meetChip(fx.ko,fx.meet):(meetBy(fx.ko)?'Meet by '+esc(meetBy(fx.ko)):'');h+='<p class="small" style="margin:2px 0">'+(fx.ko?'Kick off <b>'+esc(fx.ko)+'</b> · ':'')+(meet?meet+' · ':'')+esc(famKit(fx))+'</p>';}
 h+='<p class="small att-now" style="margin:6px 0"><b>'+(mine?'Your answer: '+attAnsLabel(mine):'Not answered yet')+'</b>'+(past?' · Been and gone':'')+'</p>';
 if(!past){h+='<div class="ybig"><button class="btn'+(mine==='Y'?' on-y':'')+'" aria-pressed="'+(mine==='Y')+'" style="background:#14532d;border-color:#4ADE80;min-height:56px;font-size:18px" onclick="ans(\''+use.id+'\',\'Y\')">Yes</button><button class="btn'+(mine==='N'?' on-n':'')+'" aria-pressed="'+(mine==='N')+'" style="background:#7f1d33;border-color:#FB7185;min-height:56px;font-size:18px" onclick="ans(\''+use.id+'\',\'N\')">No</button></div>';
  if(mine==='N'&&typeof whyBox==='function')h+=whyBox(use);
  if(!mt)h+='<button class="btn block'+(mine==='M'?' on-m':'')+'" aria-pressed="'+(mine==='M')+'" style="margin-top:8px" onclick="ans(\''+use.id+'\',\'M\')">Maybe</button>';}
 var sb=attShirtBlock(use);if(sb)h+='<details class="att-squad"><summary class="small" style="cursor:pointer;padding:6px 0">Squad answers (shirt numbers only)</summary>'+sb+'</details>';
 return h+'</div>';}
/* r116: the week's training and match answers sit on the front of Home and stay put until that Saturday is over. */
function attTopCard(){if(!D)return '';var w=attWeek(),x=X(),posts=((D.posts)||[]).filter(function(p){return attLive(p)&&p.date>=w.start&&p.date<=w.end;}).sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
 var tr=posts.filter(function(p){return p.type!=='match';}),ms=posts.filter(function(p){return p.type==='match';});
 var fxs=x.fixtures.filter(function(m){return m.date>=w.start&&m.date<=w.end;}).sort(function(a,b){return a.date<b.date?-1:1;});
 var rows=[];tr.forEach(function(p){rows.push({d:p.date,h:attRow(p,'train')});});if(!tr.length)rows.push({d:addD(w.start,3),h:attRow(null,'train')});
 var used={};ms.forEach(function(p){var fx=fxs.filter(function(m){return m.date===p.date;})[0]||null;if(fx)used[fx.id||fx.date]=1;rows.push({d:p.date,m:1,h:attRow(p,'match',fx)});});
 fxs.forEach(function(fx){if(used[fx.id||fx.date])return;rows.push({d:fx.date,m:1,h:attRow(null,'match',fx)});});
 rows=rows.filter(function(r){return r.h;}).sort(function(a,b){return a.d<b.d?-1:a.d>b.d?1:(a.m?0:1)-(b.m?0:1);});if(!rows.length)return '';
 var td=today(),need=posts.some(function(p){return p.date>=td&&!(D.mine||{})[p.id];});
 var h='<div class="card today" id="att-top" style="border-color:#FFB81C;border-width:2px"><span class="tag" style="background:#FFB81C;color:#1b1200">'+(need?'Needs your answer':'Your answers')+'</span><h2 style="margin:8px 0 2px">This week</h2>';
 h+=rows.map(function(r){return r.h;}).join('');
 h+='<p class="small muted" style="margin-top:8px">Stays here until after '+esc(new Date(w.end+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'}))+'. Tap to change your answer any time before. If it is No, you can tell the coaches why. You do not have to.</p></div>';
 return h;}
