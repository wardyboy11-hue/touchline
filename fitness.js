/* Touchline r91: PT-style fitness planner.
 * Goals and focus -> age-appropriate U15 plan (bodyweight gym, running, stretching or combined).
 * Save, edit, duplicate, mark sessions done. Coaches design workouts and stretch routines and assign them.
 * Parents get their own adult plan and see their lad's plan read only.
 * Health and goals stay private to the player, his family and coaches. Family views use shirt numbers only.
 * No diet, calorie or weight tracking. Technique first, never to failure. FIFA 11+ style prep.
 * Offline first, then sync when online. Vanilla JS only.
 */
(function(G){
'use strict';
var KEY='tl.fit.plans', DRAFT='tl.fit.draft', QKEY='tl.fit.q', TMPL='tl.fit.tmpl';
var GOALS=[
 {k:'speed',lab:'Speed',hint:'Quicker over 10 yards'},
 {k:'stamina',lab:'Stamina',hint:'Last the full game'},
 {k:'strength',lab:'Strength',hint:'Stronger in duels'},
 {k:'agility',lab:'Agility',hint:'Sharper turns and stops'},
 {k:'flexibility',lab:'Flexibility',hint:'Move freer, fewer niggles'},
 {k:'recovery',lab:'Recovery',hint:'Bounce back after games'}
];
var FOCUS=[
 {k:'gym',lab:'Gym (bodyweight)',hint:'No heavy maxing. A grown up nearby.'},
 {k:'run_dist',lab:'Running · distance',hint:'Easy miles that build the engine'},
 {k:'run_int',lab:'Running · intervals',hint:'Short, sharp, full rest'},
 {k:'stretch',lab:'Stretching',hint:'Uses our animated stretch figure'},
 {k:'mix',lab:'Combined',hint:'A bit of each across the week'}
];
/* Exercise library: bodyweight + run + stretch links. Original wording. FIFA 11+ and England Football youth-safe. */
var EX=[
 {id:'jog',kind:'prep',goals:['stamina','recovery'],n:'Jog and open the hips',d:'20 yards out and back, then knees up. Open the hip across the body.',dose:'2 lengths each way',reg:'Walk it',pro:'Add a skip'},
 {id:'shuf',kind:'prep',goals:['agility'],n:'Side shuffle and carioca',d:'Stay low, chest up, quick feet. Do not cross feet on the shuffle.',dose:'2 lengths each way',reg:'Slow it down',pro:'Ball in hands'},
 {id:'lung',kind:'prep',goals:['flexibility','strength'],n:'Walking lunge with a twist',d:'Long step, back knee soft, twist over the front leg.',dose:'8 each leg',reg:'Short steps, no twist',pro:'Ball overhead'},
 {id:'swing',kind:'prep',goals:['flexibility'],n:'Leg swings',d:'Hold a partner or the fence. Swing front and back, then across. Stay tall.',dose:'10 each leg, each way',reg:'Smaller swings',pro:'Add speed, keep control'},
 {id:'sq',kind:'gym',goals:['strength'],n:'Slow squat',d:'Three seconds down, one up. Knees over toes, heels down, chest up.',dose:'3 x 8 to 10',reg:'Squat to a bench',pro:'Pause at the bottom'},
 {id:'split',kind:'gym',goals:['strength'],n:'Reverse lunge',d:'Step back, back knee soft, push through the front heel. Front knee does not fall in.',dose:'3 x 6 to 8 each',reg:'Hold the fence',pro:'Three second lower'},
 {id:'rdl',kind:'gym',goals:['strength'],n:'Single leg Romanian deadlift',d:'Hinge at the hip, long back, back leg reaching. Touch the floor, stand tall.',dose:'3 x 6 each',reg:'Hold a partner',pro:'Ball in both hands'},
 {id:'calf',kind:'gym',goals:['strength','speed'],n:'Calf raise',d:'Up on both feet, lower slowly on one. Smooth, no bounce.',dose:'3 x 10 each',reg:'Both feet',pro:'One foot up and down'},
 {id:'brid',kind:'gym',goals:['strength','recovery'],n:'Glute bridge march',d:'Back flat, hips up, march without letting hips drop.',dose:'3 x 8 each',reg:'Plain bridge',pro:'Single leg bridge'},
 {id:'push',kind:'gym',goals:['strength'],n:'Press up (or incline)',d:'Hands under shoulders, body straight. Chest near the floor, push up. Knees or a bench is fine.',dose:'3 x 6 to 10',reg:'Against a wall or bench',pro:'Slow lower, three seconds'},
 {id:'plank',kind:'gym',goals:['strength','stamina'],n:'Front and side plank',d:'Straight line head to heels. Squeeze everything. Breathe.',dose:'20s front, 15s each side x 2',reg:'On knees',pro:'Lift one foot'},
 {id:'nord',kind:'gym',goals:['strength'],n:'Partner hamstring lower',d:'Kneel, partner holds ankles. Lean forward slowly, hands catch you, push back up. Technique first.',dose:'2 x 3 to 5',reg:'Lean only half way',pro:'Lower slower'},
 {id:'acc',kind:'run',goals:['speed','agility'],n:'10 yard starts',d:'Lean in, drive the knees, push the floor away. Walk back for full rest.',dose:'6 reps, full rest',reg:'Jog at 70 percent',pro:'Start from lying or turning'},
 {id:'dec',kind:'run',goals:['speed','agility'],n:'Sprint and stop in two steps',d:'Run 10 yards, brake with short steps, chest over knees. Quiet feet means a good landing.',dose:'4 reps',reg:'Jog and stop',pro:'Stop then go the other way'},
 {id:'cod',kind:'run',goals:['agility','speed'],n:'5, 10, 5 turn',d:'Cones 5 yards apart. Touch each line, plant outside foot, drive off.',dose:'3 each way',reg:'Walk the turns',pro:'Ball at feet'},
 {id:'easy',kind:'run',goals:['stamina','recovery'],n:'Easy run',d:'Comfortable pace. You can talk in full sentences. Soft landing, tall posture.',dose:'12 to 20 minutes',reg:'Brisk walk with jogs',pro:'Add 2 minutes next week'},
 {id:'fartlek',kind:'run',goals:['stamina','speed'],n:'Fartlek (play speed)',d:'Jog easy, then pick 20 to 40 second bursts when you choose. Easy between.',dose:'12 to 16 minutes',reg:'Shorter bursts',pro:'More bursts, same easy pace'},
 {id:'ints',kind:'run',goals:['speed','stamina'],n:'30 on, 90 off',d:'Run hard for 30 seconds, walk or jog 90 seconds. Quality over tiredness.',dose:'6 to 8 reps',reg:'20 on, 100 off',pro:'8 reps, keep the pace'},
 {id:'str_flex',kind:'stretch',goals:['flexibility','recovery'],n:'Cool down stretch set',d:'Follow our animated stretch figure. Hold each pose. If it hurts, stop and tell a coach.',dose:'About 8 to 14 minutes',reg:'Skip any sore area',pro:'Add the full 18',stretchIds:['quad','ham','calf','flexor','glute','adductor']},
 {id:'str_hip',kind:'stretch',goals:['flexibility'],n:'Hips and groin focus',d:'Hip flexor, butterfly and side lunge from the stretch player.',dose:'About 6 minutes',reg:'Gentle holds',pro:'Full set both sides',stretchIds:['flexor','butterfly','adductor','glute']},
 {id:'str_pre',kind:'stretch',goals:['flexibility','recovery'],n:'Pre-game dynamic set',d:'Short dynamic holds. Same idea as Pre-game stretch on the Stretching card.',dose:'About 2 minutes',reg:'Skip if sore',pro:'Add calves and twists',stretchIds:['flexor','ham','calf','twist','adductor']},
 {id:'mir',kind:'run',goals:['agility'],n:'Mirror pairs',d:'One leads, one mirrors in a 5 yard box. Swap every 15 seconds.',dose:'4 rounds',reg:'Smaller box',pro:'Ball to the leader'},
 {id:'land',kind:'gym',goals:['agility','strength'],n:'Drop, land and stick',d:'Step off a low step, land on both feet, soft knees, hold two seconds. Knees over toes.',dose:'2 x 6',reg:'Step down only',pro:'Land on one foot'}
];
var STRETCH_LIB=[
 {id:'quad',n:'Standing quad'},
 {id:'calf',n:'Calf on the wall'},
 {id:'flexor',n:'Kneeling hip flexor'},
 {id:'ham',n:'Sitting hamstring'},
 {id:'adductor',n:'Side lunge groin'},
 {id:'butterfly',n:'Butterfly'},
 {id:'glute',n:'Lying glute'},
 {id:'twist',n:'Spinal twist'},
 {id:'knee',n:'Knee hug'},
 {id:'dog',n:'Down dog calf'},
 {id:'wall',n:'Wall recovery'}
];
function E(t){return (G.esc||function(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});})(t);}
function g(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
function s(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function today(){try{return (G.today?G.today():new Date().toISOString().slice(0,10));}catch(e){return new Date().toISOString().slice(0,10);}}
function uid(){return 'F'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function shirtNum(){
 try{if(G.D&&G.D.role==='parent'&&G.CHD&&G.CHD.num)return String(G.CHD.num).replace(/\D/g,'');}catch(e){}
 try{if(G.SELF&&G.SELF.num)return String(G.SELF.num).replace(/\D/g,'');}catch(e){}
 try{if(G.D&&G.D.num)return String(G.D.num).replace(/\D/g,'');}catch(e){}
 return '';
}
function loadAll(){try{return JSON.parse(g(KEY)||'[]');}catch(e){return [];}}
function saveAll(a){s(KEY,JSON.stringify(a||[]));}
function loadDraft(){try{return JSON.parse(g(DRAFT)||'null');}catch(e){return null;}}
function saveDraft(d){if(d)s(DRAFT,JSON.stringify(d));else try{localStorage.removeItem(DRAFT);}catch(e){}}
function loadTmpl(){try{return JSON.parse(g(TMPL)||'[]');}catch(e){return [];}}
function saveTmpl(a){s(TMPL,JSON.stringify(a||[]));}
function queueGet(){try{return JSON.parse(g(QKEY)||'[]');}catch(e){return [];}}
function queueSet(a){s(QKEY,JSON.stringify(a||[]));}
function flushQueue(){
 var q=queueGet();if(!q.length)return;
 if(typeof G.call!=='function')return;
 var row=q[0];
 G.call(row.act,row.payload||{}).then(function(){queueSet(q.slice(1));flushQueue();}).catch(function(){});
}
function enqueue(act,payload){var q=queueGet();q.push({act:act,payload:payload});queueSet(q);flushQueue();}

function pickEx(kind,goals,n,seed){
 var pool=EX.filter(function(x){
  if(kind&&x.kind!==kind)return false;
  if(!goals||!goals.length)return true;
  return (x.goals||[]).some(function(gg){return goals.indexOf(gg)>-1;});
 });
 if(!pool.length)pool=EX.filter(function(x){return !kind||x.kind===kind;});
 var out=[],i,idx;
 for(i=0;i<n&&pool.length;i++){
  idx=Math.abs((seed*31+i*17))%pool.length;
  out.push(pool[idx]);
  pool=pool.slice(0,idx).concat(pool.slice(idx+1));
 }
 return out;
}
function dayLabel(i){return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i];}
/* Team week: coaches set training day/time, match day, half length. Defaults = Tim's winter week. */
var SKEY='tl.fit.sched';
function defaultSched(){
 return {
  trainDay:2, /* Mon=0 → Wednesday */
  trainStart:'20:00',
  trainEnd:'21:00',
  trainMins:60,
  matchDay:5, /* Saturday */
  half:35, /* 70 min game, 35 each way */
  meetBefore:30, /* meet = KO minus 30 */
  maxPersonal:2 /* U15s: at most 2 to 3 personal sessions a week */
 };
}
function clampDay(n){n=Number(n);if(!isFinite(n))return 2;n=Math.round(n)%7;return n<0?n+7:n;}
function normSched(s){
 var d=defaultSched();s=s||{};
 var out={
  trainDay:clampDay(s.trainDay!=null?s.trainDay:d.trainDay),
  trainStart:String(s.trainStart||d.trainStart).slice(0,5),
  trainEnd:String(s.trainEnd||d.trainEnd).slice(0,5),
  trainMins:Math.max(30,Math.min(120,Number(s.trainMins)||d.trainMins)),
  matchDay:clampDay(s.matchDay!=null?s.matchDay:d.matchDay),
  half:Math.max(10,Math.min(45,Number(s.half)||d.half)),
  meetBefore:Math.max(0,Math.min(90,Number(s.meetBefore)!=null?s.meetBefore:d.meetBefore)),
  maxPersonal:Math.max(1,Math.min(3,Number(s.maxPersonal)||d.maxPersonal))
 };
 if(!/^\d{1,2}:\d{2}$/.test(out.trainStart))out.trainStart=d.trainStart;
 if(!/^\d{1,2}:\d{2}$/.test(out.trainEnd))out.trainEnd=d.trainEnd;
 return out;
}
function getSched(){
 try{if(G.TLSched)return normSched(G.TLSched);}catch(e){}
 try{if(G.S&&G.S.settings&&G.S.settings.sched)return normSched(G.S.settings.sched);}catch(e){}
 try{var raw=g(SKEY);if(raw)return normSched(JSON.parse(raw));}catch(e){}
 return defaultSched();
}
function setSched(raw){
 var n=normSched(raw);s(SKEY,JSON.stringify(n));
 try{G.TLSched=n;}catch(e){}
 try{if(G.S&&G.S.settings){G.S.settings.sched=n;if(typeof G.touch==='function')G.touch('settings',G.S.settings);}}catch(e){}
 return n;
}
/* JS getDay (Sun=0) ↔ Mon=0 index used by plans */
function monToJs(d){return (clampDay(d)+1)%7;}
function jsToMon(d){return (Number(d)+6)%7;}
function nextTrainDate(from){
 var sch=getSched(),js=monToJs(sch.trainDay);
 var d=from?new Date(from):new Date();
 var add=(js-d.getDay()+7)%7;d.setDate(d.getDate()+add);
 return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
/* Role per weekday from team schedule. Personal main sessions only on 'open' slots. */
function dayRoles(sch){
 sch=normSched(sch);
 var t=sch.trainDay,m=sch.matchDay;
 var afterT=(t+1)%7,beforeM=(m+6)%7,afterM=(m+1)%7;
 var roles=[],d;
 for(d=0;d<7;d++){
  if(d===t)roles[d]='train';
  else if(d===m)roles[d]='game';
  else if(d===beforeM)roles[d]='prematch';
  else if(d===afterM)roles[d]='recovery';
  else if(d===afterT)roles[d]='recovery';
  else roles[d]='open';
 }
 return roles;
}
function pickPersonalDays(roles,maxN){
 var open=[];
 for(var d=0;d<7;d++)if(roles[d]==='open')open.push(d);
 /* Prefer earlier weekdays so load sits Mon/Tue when Wed/Sat are team days */
 return open.slice(0,Math.max(1,Math.min(3,maxN||2)));
}
function personalSession(focus,goals,seed,w,vol,slot){
 var day={type:'rest',title:'Rest',items:[]};
 if(focus==='stretch'){
  day.type='stretch';day.title=slot===0?'Mobility focus':'Full stretch set';
  day.items=pickEx('stretch',goals,1,seed+w*3+slot);
  return day;
 }
 if(focus==='run_dist'){
  day.type='run';day.title=slot===0?'Easy distance':'Steady run';
  day.items=pickEx('prep',goals,1+slot,seed).concat(pickEx('run',['stamina','recovery'],1,seed+w+slot));
  return day;
 }
 if(focus==='run_int'){
  day.type='run';day.title=slot===0?'Speed / intervals':'Agility and turns';
  day.items=pickEx('prep',goals,2,seed+4).concat(pickEx('run',['speed','agility','stamina'],1+(slot?1:0),seed+5+w));
  return day;
 }
 if(focus==='gym'){
  day.type='gym';day.title=slot===0?'Bodyweight strength':'Strength and core';
  day.items=pickEx('gym',goals,3+Math.min(1,vol),seed+8+w+slot).concat(slot===0?pickEx('prep',goals,1,seed+2):[]);
  return day;
 }
 /* mix: first personal = gym, second = run or agility, third (if allowed) = light stretch */
 if(slot===0){day.type='gym';day.title='Bodyweight strength';day.items=pickEx('gym',goals,3+Math.min(1,vol),seed+10+w).concat(pickEx('prep',goals,1,seed+2));}
 else if(slot===1){
  if(goals.indexOf('speed')>-1||goals.indexOf('agility')>-1){day.type='run';day.title='Speed and agility';day.items=pickEx('prep',goals,2,seed+4).concat(pickEx('run',['speed','agility'],2,seed+5+w));}
  else{day.type='run';day.title='Easy engine run';day.items=pickEx('prep',goals,1,seed).concat(pickEx('run',['stamina','recovery'],1,seed+6+w));}
 }
 else{day.type='stretch';day.title='Optional mobility';day.items=pickEx('stretch',['flexibility','recovery'],1,seed+7+w);}
 return day;
}
/* Build a progressive plan around the team's training and match days.
 * U15: Wed (or set day) = team only + short optional mobility; Thu recovery; Fri pre-match light;
 * Sat match + pre-game stretch; Sun recovery; Mon/Tue = main personal (moderate, progressive).
 * At most 2 to 3 personal sessions a week. */
function buildPlan(opts){
 opts=opts||{};
 var goals=(opts.goals||[]).slice(0,4);
 var focus=opts.focus||'mix';
 var weeks=Math.max(2,Math.min(6,Number(opts.weeks)||4));
 var who=opts.who||'player'; /* player | parent */
 var title=opts.title||'';
 var sch=normSched(opts.sched||getSched());
 var seed=0;String(goals.join(',')+focus+who+sch.trainDay+sch.matchDay).split('').forEach(function(c){seed=seed*33+c.charCodeAt(0);});
 seed=Math.abs(seed)||7;
 var roles=dayRoles(sch);
 var personal=who==='player'?pickPersonalDays(roles,sch.maxPersonal):[];
 var trainLab=dayLabel(sch.trainDay);
 var matchLab=dayLabel(sch.matchDay);
 var notePlayer='U15 plan around '+trainLab+' training ('+sch.trainStart+'-'+sch.trainEnd+', '+sch.trainMins+' min) and '+matchLab+' matches ('+(sch.half*2)+' min, '+sch.half+' each way). At most '+sch.maxPersonal+' personal sessions a week. Bodyweight and technique first. A grown up knows what you are doing at home. School and sleep come first. If it hurts, stop and tell a coach.';
 var noteParent='Adult plan: build steadily. Rest when you need to. This sits separate from your lad\'s plan.';
 var plan={id:uid(),v:1,at:Date.now(),date:today(),who:who,role:opts.role||who,num:opts.num||(who==='player'?shirtNum():''),
  goals:goals,focus:focus,weeks:weeks,title:title||defaultTitle(goals,focus,who),
  note:who==='player'?notePlayer:noteParent,
  sched:{trainDay:sch.trainDay,trainStart:sch.trainStart,trainEnd:sch.trainEnd,trainMins:sch.trainMins,matchDay:sch.matchDay,half:sch.half,meetBefore:sch.meetBefore,maxPersonal:sch.maxPersonal},
  days:[],done:{},owner:'self'};
 var w,d,day,vol,slot;
 for(w=0;w<weeks;w++){
  vol=1+(w>=2?1:0)+(w>=3?1:0); /* progressive, still moderate */
  for(d=0;d<7;d++){
   day={w:w+1,d:d,lab:dayLabel(d),type:'rest',title:'Rest',items:[]};
   if(who==='parent'){
    /* Parents: own week, no team load. Two to three moderate sessions, rest around the weekend. */
    if(d===0||d===2||(d===4&&sch.maxPersonal>=3)){
     slot=(d===0?0:d===2?1:2);
     var ps=personalSession(focus,goals,seed,w,vol,slot);
     day.type=ps.type;day.title=ps.title;day.items=ps.items;
    }else if(d===5||d===6){day.type='rest';day.title=d===5?'Rest or easy walk':'Recovery';day.items=d===6?pickEx('stretch',['recovery','flexibility'],1,seed+11):[];}
    else{day.type='stretch';day.title='Easy mobility';day.items=pickEx('stretch',['recovery','flexibility'],1,seed+3+w+d);}
   }else{
    var role=roles[d];
    if(role==='train'){
     day.type='light';day.title='Team training ('+sch.trainStart+'-'+sch.trainEnd+')';
     day.items=[{id:'str_pre',kind:'stretch',n:'Optional short mobility',d:'Keep it short. No extra hard session on training night. Save the legs for the '+sch.trainMins+'-minute session. Skip if you feel tired.',dose:'About 2 minutes',stretchIds:['flexor','ham','calf']}];
    }else if(role==='game'){
     day.type='game';day.title='Match day ('+(sch.half*2)+' min, '+sch.half+' each way)';
     day.items=[{id:'str_pre',kind:'stretch',n:'Pre-game stretch',d:'Dynamic only. Meet by kick-off minus '+sch.meetBefore+' minutes. If anything niggling, use the Pre-game stretch button and tell a coach.',dose:'About 2 minutes',stretchIds:['flexor','ham','calf','twist','adductor']}];
    }else if(role==='prematch'){
     day.type='light';day.title='Pre-match light / stretch only';
     day.items=pickEx('stretch',['flexibility','recovery'],1,seed+10).concat([{id:'str_pre',kind:'stretch',n:'Activation',d:'Easy dynamic moves only. No gym, no intervals the day before a game.',dose:'About 5 minutes',stretchIds:['flexor','ham','calf','twist']}]);
    }else if(role==='recovery'){
     day.type='recovery';day.title='Recovery / light';
     day.items=pickEx('stretch',['recovery','flexibility'],1,seed+11+d);
    }else if(personal.indexOf(d)>-1){
     slot=personal.indexOf(d);
     var ps2=personalSession(focus,goals,seed,w,vol,slot);
     day.type=ps2.type;day.title=ps2.title;day.items=ps2.items;
    }else{
     day.type='rest';day.title='Rest';day.items=[];
    }
   }
   plan.days.push(day);
  }
 }
 return plan;
}
function defaultTitle(goals,focus,who){
 var fl=(FOCUS.filter(function(f){return f.k===focus;})[0]||{}).lab||focus;
 var gl=goals.map(function(k){var g0=GOALS.filter(function(x){return x.k===k;})[0];return g0?g0.lab:k;}).join(', ');
 return (who==='parent'?'My plan':('U15 '+fl))+(gl?': '+gl:'');
}
function upsertPlan(plan){
 var all=loadAll().filter(function(p){return p.id!==plan.id;});
 all.unshift(plan);while(all.length>20)all.pop();saveAll(all);
 enqueue('f.fit.set',{plan:slim(plan)});
 return plan;
}
function slim(p){
 return {id:p.id,v:p.v,at:p.at,date:p.date,who:p.who,role:p.role,num:p.num||'',goals:p.goals,focus:p.focus,weeks:p.weeks,title:p.title,note:p.note,days:p.days,done:p.done||{},owner:p.owner||'self',sched:p.sched||null};
}
function getPlan(id){return loadAll().filter(function(p){return p.id===id;})[0]||null;}
function removePlan(id){saveAll(loadAll().filter(function(p){return p.id!==id;}));enqueue('f.fit.del',{id:id});}
function duplicatePlan(id){
 var p=getPlan(id);if(!p)return null;
 var n=JSON.parse(JSON.stringify(p));n.id=uid();n.at=Date.now();n.date=today();n.title=(p.title||'Plan')+' (copy)';n.done={};n.owner='self';
 return upsertPlan(n);
}
function markDone(planId,key,on){
 var p=getPlan(planId);if(!p)return null;
 p.done=p.done||{};if(on===false)delete p.done[key];else p.done[key]=Date.now();
 p.at=Date.now();upsertPlan(p);enqueue('f.fit.done',{id:planId,key:key,on:on!==false,at:Date.now()});
 return p;
}
function stretchHref(ids){
 var q='stretch/index.html?v=96&mode=pregame&back='+encodeURIComponent(location.pathname);
 /* stash a one-shot programme for the stretch player */
 try{localStorage.setItem('tl.prestretch',JSON.stringify({v:1,areas:['none'],ids:ids||['flexor','ham','calf'],hold:10,intro:4,at:Date.now(),date:today(),num:shirtNum()}));}catch(e){}
 return q;
}

/* ---------- UI: family / player ---------- */
function chipRow(list,sel,attr){
 return '<div class="chips tl-fit-chips">'+list.map(function(x){
  var on=sel&&(Array.isArray(sel)?sel.indexOf(x.k)>-1:sel===x.k);
  return '<button type="button" class="chip'+(on?' on':'')+'" data-'+attr+'="'+E(x.k)+'">'+E(x.lab)+'</button>';
 }).join('')+'</div>';
}
function itemHtml(it){
 var stretch=it.kind==='stretch'||(it.stretchIds&&it.stretchIds.length);
 return '<div class="tl-fit-ex"><b>'+E(it.n)+'</b><div class="small">'+E(it.d||'')+'</div><div class="small muted">'+E(it.dose||'')+(it.reg?'. Easier: '+E(it.reg):'')+(it.pro?'. Harder: '+E(it.pro):'')+'</div>'+
  (stretch?'<a class="btn sm" href="'+E(stretchHref(it.stretchIds))+'" style="margin-top:6px">Open stretch player</a>':'')+'</div>';
}
function dayKey(day){return 'w'+day.w+'d'+day.d;}
function planViewHtml(p,opts){
 opts=opts||{};
 var ro=!!opts.readonly;
 var h='<div class="tl-fit-plan" data-id="'+E(p.id)+'">';
 h+='<div class="card"><span class="tag" style="background:#1e3a8a">'+(p.who==='parent'?'My fitness':'Fitness plan')+'</span>';
 h+='<h2 style="margin-top:8px">'+E(p.title)+'</h2>';
 h+='<p class="small muted">'+E((FOCUS.filter(function(f){return f.k===p.focus;})[0]||{}).lab||p.focus)+' · '+E((p.goals||[]).map(function(k){var g0=GOALS.filter(function(x){return x.k===k;})[0];return g0?g0.lab:k;}).join(', ')||'Goals')+' · '+E(String(p.weeks))+' weeks</p>';
 h+='<p class="small">'+E(p.note||'')+'</p>';
 if(!ro){
  h+='<div class="row wrap2" style="gap:6px;margin-top:8px">';
  h+='<button type="button" class="btn pri grow" data-fit="save" data-id="'+E(p.id)+'">Save to my profile</button>';
  h+='<button type="button" class="btn grow" data-fit="dup" data-id="'+E(p.id)+'">Duplicate</button>';
  h+='<button type="button" class="btn grow" data-fit="edit" data-id="'+E(p.id)+'">Edit goals</button>';
  h+='</div>';
 }else{
  h+='<p class="small muted">Read only. This is his plan. Yours is separate under My fitness.</p>';
 }
 h+='</div>';
 var byW={};
 (p.days||[]).forEach(function(day){(byW[day.w]=byW[day.w]||[]).push(day);});
 Object.keys(byW).forEach(function(w){
  h+='<h3 class="tl-mh">Week '+E(w)+'</h3>';
  byW[w].forEach(function(day){
   var k=dayKey(day),done=p.done&&p.done[k];
   h+='<div class="card tl-fit-day'+(done?' tl-fit-done':'')+'" data-day="'+E(k)+'">';
   h+='<div class="row" style="align-items:center;gap:8px"><b>'+E(day.lab)+'</b> <span class="tag">'+E(day.type)+'</span><span class="grow"></span>';
   if(!ro)h+='<button type="button" class="btn sm" data-fit="done" data-id="'+E(p.id)+'" data-key="'+E(k)+'" data-on="'+(done?'0':'1')+'">'+(done?'Undo':'Mark done')+'</button>';
   else if(done)h+='<span class="small" style="color:#7bd88f">Done</span>';
   h+='</div><div class="small muted" style="margin:4px 0 8px">'+E(day.title)+'</div>';
   h+=(day.items||[]).map(itemHtml).join('')||'<p class="small muted">Rest day.</p>';
   h+='</div>';
  });
 });
 if(!ro)h+='<button type="button" class="btn block" data-fit="back" style="margin-top:8px">Back to fitness</button>';
 h+='</div>';
 return h;
}
function builderHtml(draft,opts){
 opts=opts||{};
 draft=draft||{goals:[],focus:'mix',weeks:4,who:opts.who||'player'};
 var h='<div class="tl-fit-build card">';
 h+='<h2 style="margin-top:0">'+(draft.who==='parent'?'Build my fitness plan':'Build a fitness plan')+'</h2>';
 h+='<p class="small muted">Tap what you want to improve, pick a focus, then we build a plan like a PT would. U15 plans are bodyweight-led and progressive: personal sessions on Mon and Tue, team training night stays light, pre-match and recovery around the game. At most two or three personal sessions a week. No diet or weight tracking.</p>';
 h+='<label>What do you want to improve?</label>'+chipRow(GOALS,draft.goals||[],'goal');
 h+='<label style="margin-top:10px">Focus</label>'+chipRow(FOCUS,draft.focus||'mix','focus');
 h+='<label style="margin-top:10px">How many weeks?</label><div class="chips">'+[2,3,4,6].map(function(n){return '<button type="button" class="chip'+(Number(draft.weeks)===n?' on':'')+'" data-weeks="'+n+'">'+n+' weeks</button>';}).join('')+'</div>';
 h+='<p class="small muted" style="margin-top:10px">'+E((FOCUS.filter(function(f){return f.k===draft.focus;})[0]||{}).hint||'')+'</p>';
 h+='<button type="button" class="btn pri block" data-fit="build" '+(draft.goals&&draft.goals.length?'':'disabled')+'>Build my plan</button>';
 h+='<button type="button" class="btn block" data-fit="back" style="margin-top:8px">Cancel</button>';
 h+='</div>';
 return h;
}
function listHtml(opts){
 opts=opts||{};
 var who=opts.who||'player';
 var all=loadAll();
 var mine=all.filter(function(p){return (p.who||'player')===who&&(p.owner||'self')==='self';});
 var assigned=all.filter(function(p){return p.owner==='coach'&&(who==='player'||p.who==='player');});
 var lad=opts.ladPlan||null;
 var h='<div class="tl-fit">';
 h+='<div class="card"><span class="tag" style="background:#16a34a">Fitness</span><h2 style="margin-top:8px">'+(who==='parent'?'My fitness':'Fitness plan')+'</h2>';
 h+='<p class="small muted">'+(who==='parent'?'Your own goals and plan. Separate from your lad\'s. You can still open his plan read only below.':'Tell us what you want to improve. We build a safe U15 plan around team training and match day (coaches set the days).')+'</p>';
 h+='<button type="button" class="btn pri block" data-fit="new" data-who="'+E(who)+'">New plan</button></div>';
 h+='<div class="card"><span class="tag" style="background:#15803d">Running</span><h3 style="margin:8px 0 4px">Running and Fuel</h3><p class="small muted">Ready made runs, Build up to 5k, runs for your position, or build your own with a timer. Plus what to eat and drink.</p><div class="row wrap2" style="gap:6px"><button type="button" class="btn pri grow" data-run="hub">Running</button><button type="button" class="btn grow" data-run="fuel">Fuel and water</button></div></div>';
 if(mine.length){
  h+='<h3 class="tl-mh">Saved plans</h3>';
  mine.forEach(function(p){
   var doneN=Object.keys(p.done||{}).length;
   h+='<div class="card"><b>'+E(p.title)+'</b><div class="small muted">'+E(p.focus)+' · '+doneN+' sessions done</div>';
   h+='<div class="row wrap2" style="gap:6px;margin-top:8px"><button type="button" class="btn pri grow" data-fit="open" data-id="'+E(p.id)+'">Open</button>';
   h+='<button type="button" class="btn grow" data-fit="dup" data-id="'+E(p.id)+'">Duplicate</button>';
   h+='<button type="button" class="btn grow" data-fit="del" data-id="'+E(p.id)+'">Delete</button></div></div>';
  });
 }
 if(assigned.length){
  h+='<h3 class="tl-mh">From the coaches</h3>';
  assigned.forEach(function(p){
   h+='<div class="card"><b>'+E(p.title)+'</b><div class="small muted">Assigned to '+(p.num?'No. '+E(p.num):'you')+'</div>';
   h+='<button type="button" class="btn pri block" style="margin-top:8px" data-fit="open" data-id="'+E(p.id)+'">Open</button></div>';
  });
 }
 if(who==='parent'){
  h+='<h3 class="tl-mh">His plan</h3><div class="card"><p class="small muted">Read only. Goals and how he feels stay private to you, him and the coaches.</p>';
  if(lad)h+='<b>'+E(lad.title)+'</b><button type="button" class="btn block" style="margin-top:8px" data-fit="openLad" data-id="'+E(lad.id)+'">View his plan</button>';
  else h+='<p class="small muted">No saved plan for him on this phone yet. When he builds one, it shows here.</p>';
  h+='</div>';
 }
 h+='<p class="small muted">Plans save on this phone and to his private profile when you are online. Other families never see them.</p>';
 h+='</div>';
 return h;
}
function familyCard(opts){
 opts=opts||{};
 var who=opts.who||(G.D&&G.D.role==='parent'?'parent':'player');
 return '<div class="card" id="fitc"><span class="tag" style="background:#16a34a">Fitness</span><h2 style="margin-top:8px">'+(who==='parent'?'Fitness':'My fitness')+'</h2><p class="small muted">'+(who==='parent'?'Your own plan, plus his plan read only.':'Set a goal, get a plan like a personal trainer would give you, and tick off each session. Running has ready made runs with a timer.')+'</p><button type="button" class="btn pri block" data-fit="hub" data-who="'+E(who)+'">Open fitness</button><div class="row wrap2" style="gap:6px;margin-top:8px"><button type="button" class="btn grow" data-run="hub">Running</button><button type="button" class="btn grow" data-run="fuel">Fuel and water</button></div></div>';
}

/* ---------- Coach designers ---------- */
function coachTabs(mode){
 return '<div class="chips tl-fit-tabs" style="margin:8px 0">'+[
  ['session','Session fitness'],
  ['workout','Workout designer'],
  ['stretch','Stretch designer'],
  ['plans','Squad plans'],
  ['week','Team week']
 ].map(function(x){return '<button type="button" class="chip'+(mode===x[0]?' on':'')+'" data-act="fitC" data-op="'+x[0]+'">'+x[1]+'</button>';}).join('')+'</div>';
}
function weekDesignerHtml(){
 var sch=getSched(),days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 var h='<div class="card"><h3 style="margin-top:0">Team week</h3><p class="small muted">Training day and time, match day, and half length. Fitness plans follow this. Change it if the league moves you.</p>';
 h+='<label>Training day</label><div class="chips">'+days.map(function(lab,i){return '<button type="button" class="chip'+(sch.trainDay===i?' on':'')+'" data-act="fitC" data-op="schedDay" data-k="trainDay" data-v="'+i+'">'+lab+'</button>';}).join('')+'</div>';
 h+='<div class="row" style="margin-top:8px"><div class="grow"><label>Starts</label><input type="time" id="tl-fit-ts" value="'+E(sch.trainStart)+'"></div>';
 h+='<div class="grow"><label>Ends</label><input type="time" id="tl-fit-te" value="'+E(sch.trainEnd)+'"></div>';
 h+='<div class="grow"><label>Minutes</label><input type="number" min="30" max="120" id="tl-fit-tm" value="'+E(String(sch.trainMins))+'"></div></div>';
 h+='<label style="margin-top:10px">Match day</label><div class="chips">'+days.map(function(lab,i){return '<button type="button" class="chip'+(sch.matchDay===i?' on':'')+'" data-act="fitC" data-op="schedDay" data-k="matchDay" data-v="'+i+'">'+lab+'</button>';}).join('')+'</div>';
 h+='<div class="row" style="margin-top:8px"><div class="grow"><label>Half length (minutes)</label><input type="number" min="10" max="45" id="tl-fit-half" value="'+E(String(sch.half))+'"></div>';
 h+='<div class="grow"><label>Meet before KO (min)</label><input type="number" min="0" max="90" id="tl-fit-meet" value="'+E(String(sch.meetBefore))+'"></div>';
 h+='<div class="grow"><label>Max personal sessions / week</label><input type="number" min="1" max="3" id="tl-fit-maxp" value="'+E(String(sch.maxPersonal))+'"></div></div>';
 h+='<p class="small muted" style="margin-top:8px">Defaults for this group: Wednesday 20:00-21:00 (60 min), Saturday 70 min games (35 each way), meet 30 minutes before kick-off. New plans use these.</p>';
 h+='<button type="button" class="btn pri block" style="margin-top:10px" data-act="fitC" data-op="saveSched">Save team week</button></div>';
 return h;
}
function workoutDesignerHtml(state){
 state=state||{name:'',items:[],mins:20};
 var h='<div class="card"><h3 style="margin-top:0">Workout designer</h3><p class="small muted">Build a bodyweight session, save it, then assign by shirt number. Technique first, never to failure.</p>';
 h+='<label>Name</label><input id="tl-fit-wn" value="'+E(state.name||'')+'" placeholder="e.g. Midweek strength">';
 h+='<label>Add exercises</label><div class="chips">'+EX.filter(function(x){return x.kind==='gym'||x.kind==='prep'||x.kind==='run';}).map(function(x){
  return '<button type="button" class="chip" data-act="fitC" data-op="addEx" data-ex="'+E(x.id)+'">'+E(x.n)+'</button>';
 }).join('')+'</div>';
 h+='<h4 style="margin:12px 0 4px">In this workout</h4>';
 if(!(state.items||[]).length)h+='<p class="small muted">Tap exercises above to add them.</p>';
 else h+=(state.items||[]).map(function(id,i){var x=EX.filter(function(e){return e.id===id;})[0];if(!x)return '';return '<div class="it"><div class="grow small"><b>'+E(x.n)+'</b><div class="muted">'+E(x.dose)+'</div></div><button type="button" class="btn sm" data-act="fitC" data-op="rmEx" data-i="'+i+'">Remove</button></div>';}).join('');
 h+='<div class="row wrap2" style="margin-top:10px"><button type="button" class="btn pri grow" data-act="fitC" data-op="saveWorkout">Save workout</button></div></div>';
 var tmpls=loadTmpl().filter(function(t){return t.kind==='workout';});
 if(tmpls.length){
  h+='<h3 class="tl-mh">Saved workouts</h3>';
  tmpls.forEach(function(t){
   h+='<div class="card"><b>'+E(t.name)+'</b><div class="small muted">'+(t.items||[]).length+' exercises</div>';
   h+='<div class="row wrap2" style="gap:6px;margin-top:8px"><button type="button" class="btn pri grow" data-act="fitC" data-op="assign" data-tid="'+E(t.id)+'">Assign</button>';
   h+='<button type="button" class="btn grow" data-act="fitC" data-op="delTmpl" data-tid="'+E(t.id)+'">Delete</button></div></div>';
  });
 }
 return h;
}
function stretchDesignerHtml(state){
 state=state||{name:'',ids:[],hold:20};
 var h='<div class="card"><h3 style="margin-top:0">Stretching routine designer</h3><p class="small muted">Pick poses from our animated stretch figure, set the hold, save and assign. Opens in the stretch player.</p>';
 h+='<label>Name</label><input id="tl-fit-sn" value="'+E(state.name||'')+'" placeholder="e.g. Hamstring focus">';
 h+='<label>Hold (seconds)</label><div class="chips">'+[10,15,20,30].map(function(n){return '<button type="button" class="chip'+(Number(state.hold)===n?' on':'')+'" data-act="fitC" data-op="hold" data-v="'+n+'">'+n+'s</button>';}).join('')+'</div>';
 h+='<label style="margin-top:8px">Poses</label><div class="chips">'+STRETCH_LIB.map(function(x){
  var on=(state.ids||[]).indexOf(x.id)>-1;
  return '<button type="button" class="chip'+(on?' on':'')+'" data-act="fitC" data-op="togStretch" data-sid="'+E(x.id)+'">'+E(x.n)+'</button>';
 }).join('')+'</div>';
 h+='<div class="row wrap2" style="margin-top:10px"><button type="button" class="btn pri grow" data-act="fitC" data-op="saveStretch">Save routine</button>';
 h+='<a class="btn grow" href="'+E(stretchHref(state.ids&&state.ids.length?state.ids:['flexor','ham','calf']))+'" style="text-align:center">Preview</a></div></div>';
 var tmpls=loadTmpl().filter(function(t){return t.kind==='stretch';});
 if(tmpls.length){
  h+='<h3 class="tl-mh">Saved routines</h3>';
  tmpls.forEach(function(t){
   h+='<div class="card"><b>'+E(t.name)+'</b><div class="small muted">'+(t.ids||[]).length+' poses · '+E(String(t.hold||20))+'s</div>';
   h+='<div class="row wrap2" style="gap:6px;margin-top:8px"><button type="button" class="btn pri grow" data-act="fitC" data-op="assign" data-tid="'+E(t.id)+'">Assign</button>';
   h+='<button type="button" class="btn grow" data-act="fitC" data-op="delTmpl" data-tid="'+E(t.id)+'">Delete</button></div></div>';
  });
 }
 return h;
}
function squadPlansHtml(plist){
 var h='<div class="card"><h3 style="margin-top:0">Squad plans</h3><p class="small muted">Plans you have assigned show against shirt numbers. Family views never show names here.</p></div>';
 var all=loadAll().filter(function(p){return p.owner==='coach';});
 if(!all.length)h+='<p class="small muted">No assigned plans yet. Save a workout or stretch routine, then tap Assign.</p>';
 all.forEach(function(p){
  h+='<div class="card"><b>'+E(p.title)+'</b><div class="small muted">'+(p.num?'No. '+E(p.num):'Whole group')+' · '+E(p.focus||p.kind||'')+'</div>';
  h+='<button type="button" class="btn sm" data-act="fitC" data-op="delPlan" data-id="'+E(p.id)+'" style="margin-top:8px">Remove</button></div>';
 });
 if(plist&&plist.length){
  h+='<p class="small muted">Assign picks a shirt number from the squad list.</p>';
 }
 return h;
}

/* ---------- Overlay + events for family ---------- */
var STATE={view:'hub',draft:null,planId:null,who:'player',ladReadonly:null};
function closeFit(){var el=document.getElementById('tl-fitview');if(el)el.parentNode.removeChild(el);STATE={view:'hub',draft:null,planId:null,who:'player',ladReadonly:null};}
function openFit(opts){
 opts=opts||{};
 STATE.who=opts.who||(G.D&&G.D.role==='parent'?'parent':'player');
 STATE.view=opts.view||'hub';
 STATE.planId=opts.planId||null;
 STATE.ladReadonly=opts.ladReadonly||null;
 paintFit();
}
function paintFit(){
 var ov=document.getElementById('tl-fitview');
 if(!ov){
  ov=document.createElement('div');ov.id='tl-fitview';ov.className='tl-fitview';
  ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Fitness');
  document.body.appendChild(ov);
 }
 var html='';
 if(STATE.view==='build')html=builderHtml(STATE.draft||{goals:[],focus:'mix',weeks:4,who:STATE.who},{who:STATE.who});
 else if(STATE.view==='plan'){
  var p=STATE.ladReadonly||getPlan(STATE.planId);
  html=p?planViewHtml(p,{readonly:!!STATE.ladReadonly}):'<div class="card"><p>Plan not found.</p><button type="button" class="btn" data-fit="back">Back</button></div>';
 }
 else{
  var lad=null;
  if(STATE.who==='parent'){
   lad=loadAll().filter(function(p){return p.who==='player'&&(p.owner||'self')==='self';})[0]||null;
  }
  html=listHtml({who:STATE.who,ladPlan:lad});
 }
 ov.innerHTML='<div class="tl-fit-sheet"><div class="row" style="align-items:center;margin-bottom:8px"><b style="font-size:18px">Fitness</b><span class="grow"></span><button type="button" class="btn sm" data-fit="x" aria-label="Close">Close</button></div>'+html+'</div>';
}
function onFitClick(e){
 var t=e.target.closest('[data-fit],[data-goal],[data-focus],[data-weeks]');
 if(!t)return;
 if(t.hasAttribute('data-goal')||t.hasAttribute('data-focus')||t.hasAttribute('data-weeks')){
  if(!document.getElementById('tl-fitview'))return;
  e.preventDefault();
  var d=STATE.draft||{goals:[],focus:'mix',weeks:4,who:STATE.who};
  if(t.hasAttribute('data-goal')){
   var k=t.getAttribute('data-goal');
   var i=(d.goals||[]).indexOf(k);if(i>-1)d.goals.splice(i,1);else{d.goals=d.goals||[];if(d.goals.length<4)d.goals.push(k);}
  }
  if(t.hasAttribute('data-focus'))d.focus=t.getAttribute('data-focus');
  if(t.hasAttribute('data-weeks'))d.weeks=Number(t.getAttribute('data-weeks'));
  STATE.draft=d;STATE.view='build';paintFit();return;
 }
 var act=t.getAttribute('data-fit');if(!act)return;
 /* allow hub button outside overlay */
 if(act==='hub'||act==='new'){
  e.preventDefault();
  STATE.who=t.getAttribute('data-who')||STATE.who||'player';
  if(act==='new'){STATE.view='build';STATE.draft={goals:[],focus:'mix',weeks:4,who:STATE.who};}
  else STATE.view='hub';
  openFit({who:STATE.who,view:STATE.view});return;
 }
 if(!document.getElementById('tl-fitview')&&act!=='hub')return;
 e.preventDefault();
 if(act==='x'){closeFit();return;}
 if(act==='back'){STATE.view='hub';STATE.ladReadonly=null;STATE.planId=null;paintFit();return;}
 if(act==='build'){
  var dr=STATE.draft||{};if(!(dr.goals&&dr.goals.length))return;
  var plan=buildPlan({goals:dr.goals,focus:dr.focus||'mix',weeks:dr.weeks||4,who:STATE.who,role:STATE.who,num:STATE.who==='player'?shirtNum():''});
  upsertPlan(plan);saveDraft(null);STATE.planId=plan.id;STATE.view='plan';STATE.ladReadonly=null;paintFit();
  try{if(G.toast)G.toast('Plan saved to your profile');}catch(err){}
  return;
 }
 if(act==='open'){STATE.planId=t.getAttribute('data-id');STATE.view='plan';STATE.ladReadonly=null;paintFit();return;}
 if(act==='openLad'){var lp=getPlan(t.getAttribute('data-id'));STATE.ladReadonly=lp;STATE.view='plan';paintFit();return;}
 if(act==='save'){var sp=getPlan(t.getAttribute('data-id'));if(sp){upsertPlan(sp);try{if(G.toast)G.toast('Saved');}catch(err){}}return;}
 if(act==='dup'){var np=duplicatePlan(t.getAttribute('data-id'));if(np){STATE.planId=np.id;STATE.view='plan';STATE.ladReadonly=null;paintFit();try{if(G.toast)G.toast('Duplicated');}catch(err){}}return;}
 if(act==='edit'){var ep=getPlan(t.getAttribute('data-id'));if(!ep)return;STATE.draft={goals:(ep.goals||[]).slice(),focus:ep.focus||'mix',weeks:ep.weeks||4,who:ep.who||STATE.who};STATE.view='build';paintFit();return;}
 if(act==='del'){if(!confirm('Delete this plan from your profile?'))return;removePlan(t.getAttribute('data-id'));paintFit();return;}
 if(act==='done'){markDone(t.getAttribute('data-id'),t.getAttribute('data-key'),t.getAttribute('data-on')!=='0');paintFit();return;}
}
document.addEventListener('click',onFitClick);

/* Coach event hook: host page calls TLFit.coachHandle */
var COACH={mode:'session',workout:{name:'',items:[]},stretch:{name:'',ids:[],hold:20}};
function coachHandle(act,el,ctx){
 ctx=ctx||{};
 if(act==='session'||act==='workout'||act==='stretch'||act==='plans'||act==='week'){COACH.mode=act;return true;}
 if(act==='schedDay'){var sch0=getSched();sch0[el.getAttribute('data-k')]=Number(el.getAttribute('data-v'));setSched(sch0);return true;}
 if(act==='saveSched'){
  var sch1=getSched();
  var ts=(document.getElementById('tl-fit-ts')||{}).value,te=(document.getElementById('tl-fit-te')||{}).value;
  var tm=(document.getElementById('tl-fit-tm')||{}).value,hf=(document.getElementById('tl-fit-half')||{}).value;
  var mt=(document.getElementById('tl-fit-meet')||{}).value,mp=(document.getElementById('tl-fit-maxp')||{}).value;
  if(ts)sch1.trainStart=ts;if(te)sch1.trainEnd=te;if(tm)sch1.trainMins=Number(tm);
  if(hf)sch1.half=Number(hf);if(mt!=null&&mt!=='')sch1.meetBefore=Number(mt);if(mp)sch1.maxPersonal=Number(mp);
  setSched(sch1);try{if(G.toast)G.toast('Team week saved');}catch(e){}return true;
 }
 if(act==='addEx'){var id=el.getAttribute('data-ex');if(id&&COACH.workout.items.indexOf(id)<0)COACH.workout.items.push(id);return true;}
 if(act==='rmEx'){COACH.workout.items.splice(Number(el.getAttribute('data-i')||0),1);return true;}
 if(act==='hold'){COACH.stretch.hold=Number(el.getAttribute('data-v')||20);return true;}
 if(act==='togStretch'){var sid=el.getAttribute('data-sid'),ix=COACH.stretch.ids.indexOf(sid);if(ix>-1)COACH.stretch.ids.splice(ix,1);else COACH.stretch.ids.push(sid);return true;}
 if(act==='saveWorkout'){
  var wn=(document.getElementById('tl-fit-wn')||{}).value||'';wn=wn.trim()||'Workout';
  if(!COACH.workout.items.length){try{if(G.toast)G.toast('Add an exercise first');}catch(e){}return true;}
  var tm=loadTmpl();tm.unshift({id:uid(),kind:'workout',name:wn,items:COACH.workout.items.slice(),at:Date.now()});while(tm.length>40)tm.pop();saveTmpl(tm);
  COACH.workout={name:'',items:[]};try{if(G.toast)G.toast('Workout saved');}catch(e){}
  enqueue('f.fit.tmpl',{tmpl:tm[0]});return true;
 }
 if(act==='saveStretch'){
  var sn=(document.getElementById('tl-fit-sn')||{}).value||'';sn=sn.trim()||'Stretch routine';
  if(!COACH.stretch.ids.length){try{if(G.toast)G.toast('Pick a pose first');}catch(e){}return true;}
  var ts=loadTmpl();ts.unshift({id:uid(),kind:'stretch',name:sn,ids:COACH.stretch.ids.slice(),hold:COACH.stretch.hold||20,at:Date.now()});while(ts.length>40)ts.pop();saveTmpl(ts);
  COACH.stretch={name:'',ids:[],hold:20};try{if(G.toast)G.toast('Routine saved');}catch(e){}
  enqueue('f.fit.tmpl',{tmpl:ts[0]});return true;
 }
 if(act==='delTmpl'){saveTmpl(loadTmpl().filter(function(t){return t.id!==el.getAttribute('data-tid');}));return true;}
 if(act==='delPlan'){removePlan(el.getAttribute('data-id'));return true;}
 if(act==='assign'){
  var tid=el.getAttribute('data-tid'),tmpl=loadTmpl().filter(function(t){return t.id===tid;})[0];
  if(!tmpl)return true;
  var num=prompt('Assign to which shirt number? (leave empty for a general template note)','');
  if(num===null)return true;
  num=String(num||'').replace(/\D/g,'');
  var plan;
  if(tmpl.kind==='stretch'){
   plan={id:uid(),v:1,at:Date.now(),date:today(),who:'player',role:'player',num:num,goals:['flexibility'],focus:'stretch',weeks:1,title:tmpl.name,note:'Assigned by the coaches. Opens in the stretch player.',days:[{w:1,d:0,lab:'Routine',type:'stretch',title:tmpl.name,items:[{id:'custom',kind:'stretch',n:tmpl.name,d:'Follow the poses. If it hurts, stop and tell a coach.',dose:(tmpl.hold||20)+'s holds',stretchIds:tmpl.ids}]}],done:{},owner:'coach',kind:'stretch'};
  }else{
   var items=(tmpl.items||[]).map(function(id){return EX.filter(function(x){return x.id===id;})[0];}).filter(Boolean);
   plan={id:uid(),v:1,at:Date.now(),date:today(),who:'player',role:'player',num:num,goals:['strength'],focus:'gym',weeks:1,title:tmpl.name,note:'Assigned by the coaches. Bodyweight, technique first.',days:[{w:1,d:0,lab:'Session',type:'gym',title:tmpl.name,items:items}],done:{},owner:'coach',kind:'workout'};
  }
  upsertPlan(plan);
  enqueue('f.fit.assign',{plan:slim(plan)});
  try{if(G.toast)G.toast(num?'Assigned to No. '+num:'Saved as assigned plan');}catch(e){}
  return true;
 }
 return false;
}
function coachPanel(mode,plist){
 mode=mode||COACH.mode||'session';
 COACH.mode=mode;
 var h=coachTabs(mode);
 if(mode==='workout')h+=workoutDesignerHtml(COACH.workout);
 else if(mode==='stretch')h+=stretchDesignerHtml(COACH.stretch);
 else if(mode==='plans')h+=squadPlansHtml(plist);
 else if(mode==='week')h+=weekDesignerHtml();
 return h;
}

G.TLFit={
 GOALS:GOALS,FOCUS:FOCUS,EX:EX,STRETCH_LIB:STRETCH_LIB,
 buildPlan:buildPlan,upsertPlan:upsertPlan,getPlan:getPlan,duplicatePlan:duplicatePlan,markDone:markDone,removePlan:removePlan,loadAll:loadAll,
 familyCard:familyCard,listHtml:listHtml,builderHtml:builderHtml,planViewHtml:planViewHtml,
 open:openFit,close:closeFit,flush:flushQueue,
 coachPanel:coachPanel,coachHandle:coachHandle,coachState:function(){return COACH;},
 stretchHref:stretchHref,
 getSched:getSched,setSched:setSched,defaultSched:defaultSched,dayRoles:dayRoles,nextTrainDate:nextTrainDate,monToJs:monToJs,jsToMon:jsToMon
};
try{flushQueue();}catch(e){}
try{G.addEventListener('online',flushQueue);}catch(e){}
})(window);
