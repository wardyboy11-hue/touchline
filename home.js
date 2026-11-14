/* r113: one shared Home for family.html and parents.html.
   Short Home: hello, Next up, Things to do, From the coaches, four big buttons, then More for you (folded).
   Uses the page's own functions (D, X, attTopCard and so on), so both pages show the same thing.
   Nothing new is sent to the backend and no child data is shown that the page did not already show. */
(function(G){
 function has(n){return typeof G[n]==='function';}
 function call(n){try{return has(n)?(G[n]()||''):'';}catch(e){try{console.warn('home',n,e);}catch(x){}return '';}}
 function e(s){return has('esc')?G.esc(s):String(s==null?'':s);}
 function role(){return (G.D&&G.D.role)==='player'?'player':'parent';}
 function iso(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
 function td(){return has('today')?G.today():iso(new Date());}
 function dayWord(d){var t=td();if(d===t)return 'Today';var n=new Date();n.setDate(n.getDate()+1);if(d===iso(n))return 'Tomorrow';var p=String(d).split('-');if(p.length<3)return d;return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('en-GB',{weekday:'long'});}
 function nextFx(){var x=has('X')?G.X():{fixtures:[]},t=td();return (x.fixtures||[]).filter(function(m){return !m.done&&!m.pp&&m.date>=t;}).sort(function(a,b){return String(a.date+(a.ko||'')).localeCompare(String(b.date+(b.ko||'')));})[0]||null;}
 function opp(m){return (m.ha==='A'?'at ':'v ')+(m.opp||'opponent');}
 function meet(m){var t=has('meetBy')?G.meetBy(m.ko):'';return t;}
 function css(){if(document.getElementById('tlh-css'))return;var s=document.createElement('style');s.id='tlh-css';s.textContent=
  '.tlh-hello{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 10px;margin:4px 2px 12px}.tlh-hello b{font-size:22px}.tlh-hello span{color:#A6B2D4;font-size:15px}'+
  '.tlh-hero{background:linear-gradient(135deg,#0B2F8A,#15295A);border:1px solid #3a5ab0;border-radius:18px;padding:16px;margin:0 0 12px}'+
  '.tlh-lab{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#FFB81C;font-weight:800}.tlh-big{font-size:24px;font-weight:800;margin:4px 0}.tlh-meta{color:#dfe5f5;font-size:16px;margin:0}'+
  '.tlh-hero .btn{margin-top:12px;min-height:52px;font-size:17px}'+
  '.tlh-h{font-size:18px;margin:16px 2px 8px}'+
  '.tl-prevq{margin-top:10px;border-top:1px solid rgba(255,255,255,.12);padding-top:8px}.tl-prevq>summary{cursor:pointer;font-weight:700;padding:8px 0;min-height:40px}'+
  '.tlh-row{display:flex;align-items:center;gap:12px;min-height:56px;width:100%;text-align:left;background:#0E1D45;border:1px solid #27407F;border-radius:14px;padding:10px 14px;margin:0 0 8px;color:inherit;font:inherit;cursor:pointer}'+
  '.tlh-row .t{flex:1}.tlh-row .t small{display:block;color:#A6B2D4;font-size:14px}.tlh-row .go{color:#FFB81C;font-weight:800}'+
  '.tlh-tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.tlh-tile{background:#0E1D45;border:1px solid #27407F;border-radius:14px;min-height:76px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font:700 14px system-ui,sans-serif;color:#F4F6FC;cursor:pointer;text-decoration:none;padding:6px}.tlh-tile b{font-size:22px;line-height:1}'+
  '.tlh-feed p{margin:6px 0}.tlh-more{margin-top:18px}.tlh-more>h2{font-size:18px;margin:0 2px 6px}'+
  'body.ps .tlh-hero,body.ps .tlh-row,body.ps .tlh-tile{background:#fff;color:#021945;border-color:#021945}body.ps .tlh-meta,body.ps .tlh-hello span{color:#021945}'+
  /* The floating Ask button is hidden on family pages: Help sits in the header, so nothing covers Share. */
  '#tl-voice-fab{display:none!important}'+
  /* Header: never wider than the phone. Title on the first row, buttons wrap under it. */
  'header.tl-top{flex-wrap:wrap!important;row-gap:6px}header.tl-top h1{flex:1 1 170px;min-width:150px}header.tl-top .tl-ib,header.tl-top #acctbtn{flex:none}'+
  /* Laptop: the nav is a rail down the left, like the coach page, not a squashed strip over the page. */
  '@media (min-width:900px){body:has(nav.tl-famnav){padding-left:96px}nav.tabs.tl-famnav{top:0;bottom:0;left:0;right:auto;width:92px;max-width:none;transform:none;border-radius:0;border-top:0;border-right:1px solid #27407F;flex-direction:column;justify-content:flex-start;gap:4px;padding:16px 0 0}nav.tabs.tl-famnav button{flex:0 0 auto;width:100%;padding:12px 2px;font-size:13px}nav.tabs.tl-famnav button.on{box-shadow:inset 3px 0 0 #FFB81C}.tl-share-bar{left:112px!important;right:auto!important;transform:none!important;bottom:16px!important}}'+
  '.tlh-hero .tlh-meta b{color:#fff}'+
  '@media (min-width:900px){#root>.tlh-hello,#root>.tlh-h,#root>.tlh-row,#root>.tlh-tiles,#root>.tlh-more,#root>.tl-calsw,#root>.tl-fold{grid-column:1/-1}}'+
  /* Consent card: big, clear choices */
  '.cn-opt{display:flex;align-items:center;gap:12px;min-height:52px;margin:6px 0;padding:8px 12px;border:1px solid #27407F;border-radius:12px;cursor:pointer;line-height:1.35}.cn-opt input{width:22px;height:22px;min-height:22px;flex:none;margin:0;accent-color:#FFB81C}.cn-opt:has(input:checked){border-color:#FFB81C;background:rgba(255,184,28,.08)}';
  (document.head||document.documentElement).appendChild(s);}
 try{css();}catch(x){}
 function hello(){var D=G.D||{},first=D.first||'';
  if(role()==='player')return '<div class="tlh-hello" id="tlh-hello"><b>Alright'+(first?' '+e(first):'')+'</b><span>U15 Blues'+(D.num?' · #'+e(D.num):'')+'</span></div>';
  return '<div class="tlh-hello" id="tlh-hello"><b>Hello</b><span>'+(first?e(first)+'\'s team · ':'')+'U15 Blues</span></div>';}
 /* Player hero: the next game and his job in it. */
 function playerHero(){var m=nextFx();if(!m)return '';var mt=meet(m);
  return '<div class="tlh-hero" id="tl-next"><div class="tlh-lab">Next game · '+e(dayWord(m.date))+'</div><div class="tlh-big">'+e(opp(m))+'</div><p class="tlh-meta">'+(m.ha==='A'?'Away':'Home')+(mt?' · meet '+e(mt):'')+(m.ko?' · kick off '+e(m.ko):'')+'</p>'+
   '<button type="button" class="btn pri block" onclick="tlHomeJob()">Your job on '+e(dayWord(m.date))+'</button><p class="small" style="margin:8px 0 0;color:#dfe5f5">Your role card and this week\'s session, in one place.</p></div>';}
 /* Parent hero: the availability card (Yes, No, Maybe) if there is one, otherwise the next game. */
 function nextRow(){var m=nextFx();if(!m)return '';var mt=meet(m);
  return '<button type="button" class="tlh-row" id="tlh-nextmatch" onclick="goTab(\'games\')"><span class="t"><b>'+e(dayWord(m.date))+' '+e(opp(m))+'</b><small>'+(m.ko?'Kick off '+e(m.ko):'Kick off to be confirmed')+(mt?', meet '+e(mt):'')+'</small></span><span class="go">Details</span></button>';}
 function feed(){var D=G.D||{},x=has('X')?G.X():{},out=[];
  if(x.welcome)out.push('<p>'+e(x.welcome).replace(/\n/g,'<br>')+'</p>');
  (x.news||[]).slice(0,2).forEach(function(n){out.push('<p>&bull; '+e(n.t||n.title||'')+'</p>');});
  (D.feed||[]).slice(0,2).forEach(function(f){out.push('<p><b>'+(f.u&&/^https:\/\//.test(f.u)?'<a target="_blank" rel="noopener" href="'+e(f.u)+'">'+e(f.t)+'</a>':e(f.t))+'</b>'+(f.note?'<br><span class="small">'+e(f.note)+'</span>':'')+'</p>');});
  if(!out.length)return '';
  return '<div class="card tlh-feed" id="tlh-feed"><h2 style="margin-top:0">From the coaches</h2>'+out.join('')+'<button type="button" class="btn block" onclick="tlHomeOpen(\'news\')">See all news</button></div>';}
 function tiles(){var back=encodeURIComponent(location.pathname),T;
  if(role()==='player')T=[['<b>&#127939;</b>Run','href="#running"'],['<b>&#129496;</b>Stretch','href="stretch/index.html?v=114&back='+back+'"'],['<b>&#127919;</b>My goals','onclick="tlHomeGoals()"'],['<b>&#10067;</b>Ask','onclick="goTab(\'voice\')"']];
  else T=[['<b>&#9742;&#65039;</b>Emergency','onclick="goTab(\'contacts\')"'],['<b>&#128663;</b>Lifts','onclick="goTab(\'games\')"'],['<b>&#127939;</b>Training','onclick="goTab(\'train\')"'],['<b>&#127916;</b>Clips','onclick="goTab(\'lib\')"']];
  return '<nav class="tlh-tiles" aria-label="Shortcuts">'+T.map(function(t){return t[1].indexOf('href')===0?'<a class="tlh-tile" '+t[1]+'>'+t[0]+'</a>':'<button type="button" class="tlh-tile" '+t[1]+'>'+t[0]+'</button>';}).join('')+'</nav>';}
 function sec(id,title,inner){return has('homeSec')?G.homeSec(id,title,inner,false):'';}
 G.tlHomeOpen=function(id){try{var d=document.getElementById('sec-'+id);if(d){d.open=true;d.scrollIntoView({block:'start'});}}catch(x){}};
 G.tlHomeGoals=function(){try{goTab('train');setTimeout(function(){var el=document.getElementById('tlh-goals');if(el&&el.scrollIntoView)el.scrollIntoView({block:'start'});else goTab('own');},150);}catch(x){}};
 G.tlHomeJob=function(){try{goTab('train');setTimeout(function(){var el=document.getElementById('posCard')||document.getElementById('prepCard')||document.getElementById('tonight');if(el&&el.scrollIntoView)el.scrollIntoView({block:'start'});},120);}catch(x){}};
 G.tlHomeBody=function(){css();var pl=role()==='player',h=hello();
  /* Match day: the match card goes near the top. */
  var m=nextFx(),md=m&&m.date===td();
  /* Order: the tour for new families, then anything that needs an answer (r98: Yes or No always comes first),
     then tonight's session, then the match on match day, then the next game. */
  var att=call('attTopCard'),ask=att.indexOf('Needs your answer')>-1;
  h+=call('tourCard');
  if(ask)h+=att;
  h+=call('tonightCard');
  if(md)h+=call('todayCard')+call('mdpCard');
  if(pl){if(!md)h+=playerHero();if(!ask)h+=att;}
  else if(!ask){h+=att||(md?'':(has('homeMatchStrip')?call('homeMatchStrip'):''));}
  if(!pl&&!md&&att)h+=nextRow();
  var rs='';try{rs=has('rsCard')?G.rsCard('home')||'':'';}catch(e){}
  var todo=rs+call('selfPrompt')+call('motmHomeCard')+call('evAttHomeCards')+call('notifCard')+call('hcCard')+call('headCard')+call('landVotes');
  if(todo)h+='<h2 class="tlh-h" id="tlh-todo">Things to do</h2>'+todo;
  h+=feed()+tiles();
  var more=sec('week','This week',call('homeThisWeek'))+(pl?'':sec('train','Training this week',call('homeTraining')))+sec('news','News and check these out',call('homeNewsShelf'))+sec('players',pl?'Your stuff':'Players',call('homePlayers'));
  h+='<div class="tlh-more" id="tlh-more"><h2>More for you</h2>'+more+'</div>';
  if(!md)h+=call('todayCard');
  return h+(G.SPONX||'');};
 /* Train tab (players' nav, and Training for parents): this week's session, role card, stretching, fitness, running. */
 G.tlTrainBody=function(){var pl=role()==='player',back=encodeURIComponent(location.pathname.split('/').pop());
  var h=(has('intro')?G.intro(pl?'This week\'s session, your role, stretching, fitness and running.':'This week\'s training, what to look for, stretching and fitness.'):'');
  if(pl){var gl=call('glCard');if(gl)h+='<div id="tlh-goals">'+gl+'</div>';}
  h+=call('tonightCard')+call('homeTraining');
  h+='<div class="card"><h2 style="margin-top:0">More training</h2><div class="row wrap2"><button class="btn grow" onclick="goTab(\'lib\')">Library</button>'+(pl?'<button class="btn grow" onclick="goTab(\'own\')">My own training</button>':'')+'<a class="btn grow" href="#running">Running</a><a class="btn grow" href="#fuel">Fuel and water</a><a class="btn grow" href="shape/index.html?mode=squad&back='+back+'">Our 352</a></div></div>';
  return h;};
 /* Calendar: Games and Events side by side. */
 G.tlCalSwitch=function(cur){return '<div class="seg tl-calsw" role="tablist" aria-label="Calendar" style="display:flex;gap:8px;margin:4px 0 12px"><button type="button" role="tab" class="btn'+(cur==='games'?' pri':'')+'" style="flex:1" aria-selected="'+(cur==='games')+'" onclick="goTab(\'games\')">Games</button><button type="button" role="tab" class="btn'+(cur==='events'?' pri':'')+'" style="flex:1" aria-selected="'+(cur==='events')+'" onclick="goTab(\'events\')">Events</button></div>';};
 
/* r114: answered questions move to Previous questions. A new answer shows once, then it is archived but still there on request. */
G.tlQSeen=G.tlQSeen||{};
G.tlQList=function(rows,item,opts){opts=opts||{};rows=rows||[];var seen={};try{seen=JSON.parse(localStorage.getItem('fam.qseen')||'{}')||{};}catch(e){}
 var key=function(x){return String(x.q||'').slice(0,80)+'|'+String(x.a||'').length;};
 var wait=rows.filter(function(x){return !x.a;}),ans=rows.filter(function(x){return x.a;});
 var fresh=ans.filter(function(x){var k=key(x);return !seen[k]||G.tlQSeen[k];}),old=ans.filter(function(x){var k=key(x);return seen[k]&&!G.tlQSeen[k];});
 if(opts.freshMax!=null&&fresh.length>opts.freshMax){old=fresh.slice(opts.freshMax).concat(old);fresh=fresh.slice(0,opts.freshMax);}
 fresh.forEach(function(x){var k=key(x);if(!seen[k]){seen[k]=Date.now();G.tlQSeen[k]=1;}});try{localStorage.setItem('fam.qseen',JSON.stringify(seen));}catch(e){}
 var h=wait.map(function(x){return item(x,'wait');}).join('')+fresh.map(function(x){return item(x,'new');}).join('');
 if(old.length)h+='<details class="tl-prevq" id="'+(opts.id||'tl-prevq')+'"><summary>Previous questions ('+old.length+')</summary>'+old.map(function(x){return item(x,'old');}).join('')+'</details>';
 return h;};
/* Nav: parents Home, Calendar, Videos, Ask, Me. Players Home, Calendar, Videos, Train, Me. */
 G.tlNavTabs=function(){return role()==='player'?[['home','Home','home'],['games','Calendar','cal'],['media','Videos','img'],['train','Train','run'],['me','Me','user']]:[['home','Home','home'],['games','Calendar','cal'],['media','Videos','img'],['voice','Ask','chat'],['me','Me','user']];};
 G.tlNavOn=function(t,cur){if(t==='games')return cur==='games'||cur==='events';if(t==='media')return cur==='media'||cur==='lib';if(t==='home')return cur==='home'||cur==='today';if(t==='voice')return cur==='voice'||cur==='pq';return cur===t;};
})(window);
