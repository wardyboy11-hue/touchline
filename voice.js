/* Touchline r104: conversational voice assistant. Web Speech on the device only.
   Intent matching is local (fuzzy, over the pages, fixtures and library already on the phone).
   Family answers use shirt numbers and never include Coaches' Voice, the FA squad PDF,
   welfare or niggle data. Nothing is sent until a person taps Confirm send. */
(function(global){
'use strict';
var EXAMPLES=[
 'Confirm attendance',
 'Show fixtures',
 'What time is the game on Saturday?',
 'Where is the game?',
 'What are we doing at training tonight?',
 'Show me a clip of how to shoot',
 'Send me a clip of shooting',
 'Open the emergency head injury page',
 'Reply we are running late',
 'My role',
 'Show my player card',
 'Running late',
 'Start the stretch',
 'Club shop',
 'Latest news',
 'Help'
];
var PAGE_WORDS=[
 {id:'today', go:'today', role:'coach', words:'today home coach home'},
 {id:'match', go:'match', role:'coach', words:'match fixtures games fixture list'},
 {id:'conc', go:'conc', role:'coach', coachOnly:true, words:'head injury concussion suspected head injury emergency head injury'},
 {id:'em', go:'em', role:'coach', coachOnly:true, words:'emergency card emergency contacts emergency page'},
 {id:'admin', go:'admin', role:'coach', coachOnly:true, words:'welfare admin knocks compliance'},
 {id:'fa', go:'fa', role:'coach', coachOnly:true, words:'team sheet fa team sheet fa pdf squad pdf'},
 {id:'mday', go:'mday', role:'coach', coachOnly:true, words:'fa squad list matchday squad list'},
 {id:'att', go:'att', role:'coach', coachOnly:true, words:'attendance register take register who is here'},
 {id:'hub', go:'hub', role:'coach', coachOnly:true, words:'comms hub messages comms'},
 {id:'run', go:'run', role:'coach', words:'tonight run card tonight session'},
 {id:'plan', go:'plan', role:'coach', words:'this week plan weekly plan'},
 {id:'squad', go:'squad', role:'coach', words:'squad team list'},
 {id:'shop', go:'shop', role:'any', words:'shop club shop kit shop'},
 {id:'res', go:'res', role:'coach', words:'resources'},
 {id:'rl', go:'rl', role:'coach', words:'library clips library'},
 {id:'pos', go:'pos', role:'coach', words:'positions'},
 {id:'roles', go:'roles', role:'coach', words:'roles grid role grid'},
 {id:'guides', go:'guides', role:'coach', words:'guides how to guide'},
 {id:'fit', go:'fit', role:'coach', words:'fitness'},
 {id:'board', go:'board', role:'coach', words:'board tactics board'},
 {id:'refs', go:'refs', role:'coach', coachOnly:true, words:'referees refs'},
 {id:'opp', go:'opp', role:'coach', coachOnly:true, words:'opposition'},
 {id:'lg', go:'lg', role:'coach', coachOnly:true, words:'league'},
 {id:'stats', go:'stats', role:'coach', words:'stats minutes'},
 {id:'goals', go:'goals', role:'coach', words:'goals'},
 {id:'priv', go:'priv', role:'coach', words:'privacy my data'},
 {id:'ct', go:'ct', role:'coach', words:'contacts club contacts'},
 {id:'ask', go:'ask', role:'coach', words:'ask helper'},
 {id:'sess', go:'sess', role:'coach', words:'sessions saved sessions'},
 {id:'anim', go:'anim', role:'coach', words:'animations animation'},
 {id:'rev', go:'rev', role:'coach', words:'reflect review'},
 {id:'sb', go:'sb', role:'coach', words:'build session builder block'},
 {id:'lab', go:'lab', role:'coach', words:'team builder lineup builder'},
 {id:'more', go:'more', role:'coach', words:'more settings'},
 {id:'home', go:'home', role:'family', words:'home today'},
 {id:'games', go:'games', role:'family', words:'games fixtures matches fixture list'},
 {id:'events', go:'events', role:'family', words:'events'},
 {id:'media', go:'media', role:'family', words:'media photos'},
 {id:'me', go:'me', role:'family', words:'me profile my page'},
 {id:'faq', go:'faq', role:'family', words:'faq help page questions'},
 {id:'contacts', go:'contacts', role:'family', words:'contacts'},
 {id:'lib', go:'lib', role:'family', words:'library clips'},
 {id:'own', go:'own', role:'family', words:'my own training my goals own training'},
 {id:'stretch', go:'stretch', role:'any', words:'stretch stretching pre game stretch cool down'},
 {id:'child', go:'child', role:'family', words:'his card player card my card'},
 {id:'pq', go:'pq', role:'family', words:'ask coaches ask the coaches'},
 {id:'voice', go:'voice', role:'family', words:'your voice ideas'}
];
var TOPIC_MAP=[
 ['shoot','shoot shooting shot finish finishing strike'],
 ['pass','pass passing'],
 ['defend','defend defending'],
 ['cross','cross crossing'],
 ['dribble','dribble dribbling'],
 ['header','header heading'],
 ['press','press pressing'],
 ['gk','goalkeeper keeper'],
 ['set piece','corner free kick set piece'],
 ['first touch','first touch receive receiving']
];
var LIB=[];
var LIB_ROLE='';

function norm(s){return String(s||'').toLowerCase().replace(/[\u2013\u2014]/g,' ').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
function tokens(s){return norm(s).split(' ').filter(function(w){return w.length>1;});}
function has(t,words){for(var i=0;i<words.length;i++)if(t.indexOf(words[i])>-1)return true;return false;}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function lev(a,b){
 if(a===b)return 0;
 if(!a||!b)return Math.max((a||'').length,(b||'').length);
 if(Math.abs(a.length-b.length)>4)return 9;
 var i,j,p=[],c=[],t;
 for(j=0;j<=b.length;j++)p[j]=j;
 for(i=1;i<=a.length;i++){
  c[0]=i;
  for(j=1;j<=b.length;j++)c[j]=Math.min(c[j-1]+1,p[j]+1,p[j-1]+(a.charAt(i-1)===b.charAt(j-1)?0:1));
  t=p;p=c;c=t;
 }
 return p[b.length];
}
function simWord(a,b){
 if(!a||!b)return 0;
 if(a===b)return 1;
 if(a.length>=3&&b.length>=3&&(a.indexOf(b)===0||b.indexOf(a)===0))return 0.92;
 if(a.length>=4&&b.length>=4&&(a.indexOf(b)>-1||b.indexOf(a)>-1))return 0.84;
 var d=lev(a,b),m=Math.max(a.length,b.length);
 return m?Math.max(0,1-d/m):0;
}
function fuzzyScore(text,phrase){
 var n=norm(text),ph=norm(phrase);
 if(!ph)return 0;
 if(n===ph)return 1;
 if(n.indexOf(ph)>-1)return 0.98;
 var tt=tokens(n),pp=tokens(ph),hit=0,i,best,j;
 if(!pp.length)return 0;
 for(i=0;i<pp.length;i++){
  best=0;
  for(j=0;j<tt.length;j++)best=Math.max(best,simWord(tt[j],pp[i]));
  if(best>=0.72)hit+=best;
 }
 return hit/pp.length;
}
function isoToday(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function londonToday(){try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}catch(e){return isoToday();}}
function addDays(iso,n){var p=String(iso||isoToday()).split('-'),d=new Date(+p[0],+p[1]-1,+p[2]+n);return isoToday(d);}
function nice(iso){var p=String(iso||'').split('-');if(p.length<3)return iso||'';var d=new Date(+p[0],+p[1]-1,+p[2]);if(isNaN(d.getTime()))return iso;return d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});}
function meetBy(ko){var m=String(ko||'').match(/(\d{1,2}):(\d{2})/);if(!m)return '';var t=(+m[1])*60+(+m[2])-30;if(t<0)t+=1440;return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
function upcoming(fixtures,from){
 var iso=from||isoToday();
 return (fixtures||[]).filter(function(m){return m&&!m.done&&!m.pp&&String(m.date||'')>=iso;}).sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
}
function nextSat(fixtures){
 var L=upcoming(fixtures);
 for(var i=0;i<L.length;i++){var d=new Date(L[i].date+'T12:00:00');if(d.getDay()===6)return L[i];}
 return L[0]||null;
}
function explicitKit(m){
 if(!m||m.kit==null||String(m.kit).trim()==='')return '';
 var k=String(m.kit).trim().toLowerCase();
 if(k==='h'||k==='home'||k==='blue')return 'H';
 if(k==='a'||k==='away')return 'A';
 if(k==='t'||k==='third')return 'T';
 return '';
}
function fixtureFor(ctx,t){
 var td=(ctx&&ctx.today)||londonToday();
 var list=upcoming(ctx&&ctx.fixtures,td);
 if(/\btomorrow\b/.test(t)){var tom=addDays(td,1),hit=list.filter(function(m){return m.date===tom;})[0];if(hit)return hit;}
 if(/\btoday\b/.test(t))return list.filter(function(m){return m.date===td;})[0]||null;
 if(/\bsaturday\b/.test(t))return nextSat(ctx&&ctx.fixtures);
 if(ctx&&ctx.memory&&ctx.memory.fixture&&/\b(it|that|the game|the match)\b/.test(t))return ctx.memory.fixture;
 return list[0]||null;
}
function kitSay(m){
 if(!m)return 'No upcoming game is listed yet.';
 var who=(m.ha==='A'?'at ':(m.ha==='H'?'against ':''))+(m.opp||'the opposition');
 var when=m.date?(' on '+nice(m.date)):'';
 var k=explicitKit(m),note=String(m.kitColours||'').trim();
 if(k==='H')return 'For the game '+who+when+', the kit is the home kit: dark blue and white stripes, black shorts.';
 if(k==='A')return 'For the game '+who+when+', the kit is the away kit'+(note?': '+note:'')+'.';
 if(k==='T')return 'For the game '+who+when+', the kit is the third kit'+(note?': '+note:'')+'.';
 return 'For the game '+who+when+', the kit has not been chosen yet. I will not guess it from home or away.';
}
function wantsKit(t){return /\b(kit|strip)\b/.test(t)||/\b(wearing|shirts|colours|colors)\b/.test(t);}
function gameLine(g){
 if(!g)return 'No upcoming game is listed yet.';
 var meet=meetBy(g.ko||g.meet);
 var where=(g.ha==='A'?'Away at ':'Home versus ')+(g.opp||'the opposition');
 return where+' on '+nice(g.date)+'. Kick off '+(g.ko||'to be confirmed')+(meet?'. Meet by '+meet+' (thirty minutes before kick off).':'. Meet thirty minutes before kick off.');
}
function isFamily(role){return role!=='coach';}
function clipTopic(t){
 for(var i=0;i<TOPIC_MAP.length;i++)if(has(t,TOPIC_MAP[i][1].split(' ')))return TOPIC_MAP[i][0];
 var m=t.match(/(?:clip|video|how to|show me|send me)\s+(?:of\s+|a\s+|me\s+|to\s+)?([a-z ]{3,40})/);
 return m?m[1].trim().split(' ').slice(0,3).join(' '):'';
}
function topicWords(topic){
 var t=norm(topic);
 for(var i=0;i<TOPIC_MAP.length;i++)if(TOPIC_MAP[i][0]===t||has(t,TOPIC_MAP[i][1].split(' ')))return TOPIC_MAP[i][1];
 return t;
}
function isCoachOnlyItem(it){
 if(!it)return true;
 if(it.coachOnly||it.private)return true;
 var blob=norm((it.src||'')+' '+(it.by||'')+' '+(it.source||'')+' '+(it.s||'')+' '+(it.title||'')+' '+(it.kind||''));
 if(/coaches?\s*voice|coachesvoice/.test(blob))return true;
 if(/\bniggle\b|\bwelfare\b|\bsafeguard/.test(blob))return true;
 if(/squad list|team sheet|fa pdf/.test(blob))return true;
 return false;
}
function library(){return LIB.slice();}
function addLibrary(items,role){
 (items||[]).forEach(function(it){
  if(!it)return;
  var row={
   id:it.id||it.u||it.url||it.title,
   title:String(it.title||it.t||'').replace(/[\u2013\u2014]/g,' - '),
   url:it.url||it.u||'',
   tags:Array.isArray(it.tags)?it.tags.join(' '):(typeof it.tags==='string'?it.tags:''),
   src:it.src||it.by||it.s||it.source||'',
   by:it.by||it.s||'',
   private:!!it.private,
   coachOnly:!!it.coachOnly
  };
  if(!row.title||!row.url)return;
  row.coachOnly=isCoachOnlyItem(row);
  if(LIB.some(function(x){return x.url===row.url&&x.title===row.title;}))return;
  LIB.push(row);
 });
 if(role)LIB_ROLE=role;
}
function resetLibrary(){LIB=[];}
function bestClip(topic,ctx){
 ctx=ctx||{};
 var q=topicWords(topic||''),role=ctx.role||'family',best=null,bs=0;
 var list=(ctx.library&&ctx.library.length)?ctx.library:LIB;
 for(var i=0;i<list.length;i++){
  var it=list[i];
  if(isFamily(role)&&isCoachOnlyItem(it))continue;
  var blob=norm(it.title+' '+(it.tags||'')+' '+(it.src||'')+' '+(it.by||''));
  var s=fuzzyScore(blob,q);
  if(norm(it.tags).indexOf(norm(topic))>-1)s+=0.35;
  if(s>bs){bs=s;best=it;}
 }
 return bs>=0.45?best:null;
}
function pageFor(raw,ctx){
 var t=norm(raw),role=ctx.role||'family',best=null,bs=0,i,p,s,parts,k;
 for(i=0;i<PAGE_WORDS.length;i++){
  p=PAGE_WORDS[i];
  if(!isFamily(role)&&p.role==='family')continue;
  s=fuzzyScore(t,p.words);
  parts=p.words.split(' ');
  for(k=0;k<parts.length;k++){
   if(parts[k].length>=4&&t.indexOf(parts[k])>-1)s=Math.max(s,0.9);
   if(parts[k].length>=5)s=Math.max(s,fuzzyScore(t,parts[k]));
   if(k+1<parts.length)s=Math.max(s,fuzzyScore(t,parts[k]+' '+parts[k+1]));
  }
  if(p.role===(isFamily(role)?'family':'coach')||p.role==='any')s+=0.03;
  if(s>bs){bs=s;best=p;}
 }
 if(!best||bs<0.55)return null;
 if(isFamily(role)&&(best.coachOnly||best.role==='coach'))return {blocked:true,page:best};
 return best;
}
function draftBody(t){
 var m=String(t||'').match(/\b(?:reply|draft(?:\s+a\s+message)?|message|text|write)\b\s*(?:a\s+message\s+)?(?:saying|that|to\s+say|to\s+them|to\s+the\s+coaches|to\s+parents)?\s*(.*)$/);
 var body=m?m[1]:'';
 body=body.replace(/^(a message|them|the coaches|parents|to parents|to the parents|to tim and deano)\s+/,'').trim();
 return body;
}
function wantsDraft(t){
 if(/\b(reply|draft)\b/.test(t))return true;
 if(/\b(send|write|text)\s+(a\s+)?message\b/.test(t))return true;
 if(/\bmessage\b/.test(t)&&/\b(saying|that we|we are|we're)\b/.test(t))return true;
 return false;
}
function wantsClip(t){
 if(/\b(clip|video)\b/.test(t))return true;
 if(/\b(show me|send me|play|share)\b/.test(t)&&clipTopic(t))return true;
 if(/\bhow to\b/.test(t)&&clipTopic(t))return true;
 return false;
}
function trainingPosts(ctx){
 return (ctx.posts||[]).filter(function(p){return p&&p.date&&p.type!=='match'&&p.type!=='event';});
}
function trainingSay(ctx,span){
 var td=ctx.today||isoToday(),end=span==='week'?addDays(td,6):td;
 var rows=trainingPosts(ctx).filter(function(p){return p.date>=td&&p.date<=end;});
 if(span!=='week'){
  var tonight=rows.filter(function(p){return p.date===td;})[0];
  if(tonight)return 'Training tonight'+(tonight.time?' at '+tonight.time:'')+': '+(tonight.title||'session')+(tonight.place?' at '+tonight.place:'')+'.';
  if(ctx.trainingLine)return ctx.trainingLine;
 }
 if(span==='week'){
  if(ctx.weekLine)return ctx.weekLine;
  if(!rows.length)return 'Nothing is listed for training this week yet. I can open the training page.';
  return 'Training this week: '+rows.slice(0,4).map(function(p){return nice(p.date)+(p.time?' '+p.time:'')+' '+(p.title||'Training');}).join('. ')+'.';
 }
 if(ctx.trainingLine)return ctx.trainingLine;
 return 'I cannot see a session for tonight. I will open the training page.';
}
function helpSay(role){
 var base='You can ask me to confirm attendance, read kick off times, open fixtures, say what training is tonight or this week, find or share a clip, open a page, or draft a message. For example: what time is the game on Saturday. Show me a clip of shooting. Reply we are running late. Nothing is sent until you tap Confirm send.';
 if(isFamily(role))return base+' I use shirt numbers only, and I will not open coach pages.';
 return base+' You can also say open the emergency head injury page, open welfare, or open Comms.';
}
function blockedSay(){return 'That stays with the coaches. I can help with fixtures, training, clips, attendance and messages.';}
function parseIntent(raw,ctx){
 ctx=ctx||{};
 var t=norm(raw),role=ctx.role||'family';
 if(!t)return {intent:'empty',say:'I did not catch that. Try again, or type it.'};
 if(/\b(stop|cancel|dismiss|that is all|that's all|goodbye|close)\b/.test(t)&&t.split(' ').length<=5)return {intent:'dismiss',say:'OK. I will stop there.'};
 if(has(t,['help','what can i say','what can i ask','what can you do','examples','commands']))return {intent:'help',say:helpSay(role)};
 if(isFamily(role)&&(/\bniggle/.test(t)||/\bwelfare\b/.test(t)||/coaches voice/.test(t)||/fa pdf/.test(t)||/fa squad/.test(t)||/team sheet/.test(t)))
  return {intent:'blocked',say:blockedSay()};
 if(wantsDraft(t)&&!/\bclip\b|\bvideo\b/.test(t)){
  var body=draftBody(t);
  if(!body||body.length<3)return {intent:'draft',say:'What should the message say? For example: reply we are running late.',needText:true};
  return {intent:'draft',say:'I have drafted that into Comms: '+body+'. Nothing is sent until you tap Confirm send.',text:body,needConfirm:true,confirmLabel:'Confirm send'};
 }
 if(wantsClip(t)||(clipTopic(t)&&/\b(show|send|play|share|watch|find)\b/.test(t))){
  var topic=clipTopic(t)||'football';
  var share=/\b(send|share)\b/.test(t);
  var hit=bestClip(topic,ctx);
  if(hit&&isFamily(role)&&isCoachOnlyItem(hit))hit=null;
  if(!hit)return {intent:'clip',say:isFamily(role)?'I could not find a clip of '+topic+' that I am allowed to show here. I will open the library.':'I could not find a clip of '+topic+' on this phone yet. I will open the library.',topic:topic,action:share?'share':'play',go:isFamily(role)?'lib':'rl'};
  return {intent:'clip',say:(share?'Here is a clip you can share: ':'Here is a clip: ')+hit.title+'.',topic:topic,action:share?'share':'play',clip:hit,go:isFamily(role)?'lib':'rl'};
 }
 if(/\b(open|go to|show me|take me|jump to)\b/.test(t)){
  var pg=pageFor(t,ctx);
  if(pg&&pg.blocked)return {intent:'blocked',say:blockedSay(),page:pg.page&&pg.page.id};
  if(pg)return {intent:'open',say:'Opening '+(pg.words.split(' ')[0])+' .',page:pg.go,go:pg.go};
 }
 if(has(t,['confirm attendance','mark me in','i am in','i can come','confirm i am coming','say yes to training','say yes to the match','confirm coming']))
  return {intent:'attendance',say:'I can confirm attendance for shirt '+(ctx.shirt||'your player')+' only. Tap Confirm. Nothing is sent until you do.',needConfirm:true,confirmLabel:'Confirm'};
 if(has(t,['running late','we are late','i am late','going to be late'])&&!/\breply\b|\bdraft\b/.test(t))
  return {intent:'late',say:'Opening the running late button.',go:'home'};
 if(has(t,['start the stretch','start stretch','pre game stretch','pregame stretch','cool down','start stretching','open stretch','stretching']))
  return {intent:'stretch',say:'Opening the stretch player.',go:'stretch'};
 if(has(t,['my role','role card','what is my role','show my role']))
  return {intent:'role',say:'Opening your role card.',go:'me'};
 if(has(t,['player card','my card','show my profile','my profile','player profile','his card']))
  return {intent:'card',say:'Opening the player card. Shirt numbers only on family views.',go:isFamily(role)?'me':'squad'};
 if(has(t,['club shop','open shop','kit shop','buy a coat']))
  return {intent:'shop',say:'Opening the club shop.',go:'shop'};
 if(has(t,['latest news','show news','team news','any news']))
  return {intent:'news',say:'Showing the latest news.',go:isFamily(role)?'home':'hub'};
 if(has(t,['show fixtures','fixtures','fixture list','upcoming games','what games','show games']))
  return {intent:'fixtures',say:'Opening fixtures.',go:isFamily(role)?'games':'match'};
 if(has(t,['where is the game','where is the match','venue','where do we play','getting there','parking'])){
  var g=nextSat(ctx.fixtures);
  var where=g?(g.venue||g.addr||(g.vi&&g.vi.pc)||'venue to be confirmed'):'No upcoming game listed yet.';
  return {intent:'where',say:(g?((g.ha==='A'?'Away at ':'Home. ')+where):where),go:isFamily(role)?'games':'match',game:g};
 }
 if(has(t,['what time','kick off','kickoff','when is the game','game on saturday','match on saturday','meet time','be there','what time is the game'])){
  var g2=nextSat(ctx.fixtures);
  if(!g2)return {intent:'kickoff',say:'No upcoming game is listed yet.',go:isFamily(role)?'games':'match'};
  return {intent:'kickoff',say:gameLine(g2),go:isFamily(role)?'games':'match',game:g2};
 }
 if(has(t,['training this week','this week training','what is on this week','sessions this week']))
  return {intent:'training',say:trainingSay(ctx,'week'),span:'week',go:isFamily(role)?'home':'plan'};
 if(has(t,['training tonight','what are we doing at training','what is training','session tonight','what are we working on','tonight']))
  return {intent:'training',say:trainingSay(ctx,'tonight'),span:'tonight',go:isFamily(role)?'home':'run'};
 if(wantsKit(t)&&!/\bshop\b/.test(t)){
  var gk=fixtureFor(ctx,t);
  return {intent:'kit',say:kitSay(gk),game:gk,go:isFamily(role)?'games':'match'};
 }
 var nav=pageFor(t,ctx);
 if(nav&&nav.blocked)return {intent:'blocked',say:blockedSay()};
 if(nav&&fuzzyScore(t,nav.words)>=0.72)return {intent:'open',say:'Opening that page.',page:nav.go,go:nav.go};
 if(role==='coach'&&has(t,['attendance','take register','who is here']))
  return {intent:'coach_att',say:'Opening attendance.',go:'att'};
 return {intent:'unknown',say:'Sorry, I am not sure. Try: '+EXAMPLES[Math.floor(Math.random()*EXAMPLES.length)]+'. Or say help.'};
}
function femaleName(n){return /female|woman|girl|libby|hazel|sonia|serena|martha|kate|susan|fiona|alice|emma|amy|jenny|zira|samantha|moira|karen/i.test(n||'');}
function pickVoice(){
 try{
  var vs=speechSynthesis.getVoices()||[];
  var i,v,localGB=[];
  for(i=0;i<vs.length;i++){v=vs[i];if(v.localService&&/en[-_]GB/i.test(v.lang))localGB.push(v);}
  if(localGB.length){
   for(i=0;i<localGB.length;i++)if(femaleName(localGB[i].name))return localGB[i];
   return localGB[0];
  }
  for(i=0;i<vs.length;i++){v=vs[i];if(/en[-_]GB/i.test(v.lang)&&femaleName(v.name))return v;}
  for(i=0;i<vs.length;i++){v=vs[i];if(/en[-_]GB/i.test(v.lang))return v;}
  for(i=0;i<vs.length;i++){v=vs[i];if(v.localService&&/^en/i.test(v.lang)&&femaleName(v.name))return v;}
  for(i=0;i<vs.length;i++){v=vs[i];if(/^en/i.test(v.lang))return v;}
 }catch(e){}
 return null;
}
function speak(text,done){
 var finished=false;
 function end(ok){if(finished)return;finished=true;if(done)done(!!ok);}
 try{
  if(!global.speechSynthesis){end(false);return;}
  speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(String(text||'').replace(/[\u2013\u2014]/g,', '));
  u.lang='en-GB';u.rate=1;u.pitch=1;
  var v=pickVoice();if(v)u.voice=v;
  u.onend=function(){end(true);};
  u.onerror=function(){end(false);};
  speechSynthesis.speak(u);
 }catch(e){end(false);}
}
function listenMessage(code){
 if(code==='no-speech')return 'I did not hear anything. You can type it, or tap the mic again.';
 if(code==='not-allowed')return 'The microphone is blocked on this phone. Type your question. Nothing was sent away.';
 if(code==='audio-capture')return 'This phone has no microphone I can use. Type your question. The answer stays on screen.';
 if(code==='network')return 'Listening stays on this phone. That attempt failed. Type your question.';
 if(code==='language-not-supported'||code==='service-not-allowed')return 'On-device listening is not available for English here. Type your question.';
 if(code==='local-only'||code==='no-speech-recognition')return 'On-device listening is not available. Type your question. Nothing is sent to a speech service.';
 return 'I could not listen just then. Type your question. The answer stays on screen.';
}
function SR(){return global.SpeechRecognition||global.webkitSpeechRecognition||null;}
function canListen(){return !!SR();}
function ensureLocal(){
 var Ctor=SR();
 if(!Ctor)return Promise.resolve(false);
 if(typeof Ctor.available!=='function')return Promise.resolve(false);
 var opts={langs:['en-GB'],processLocally:true};
 return Promise.resolve(Ctor.available(opts)).then(function(st){
  if(st==='available')return true;
  if((st==='downloadable'||st==='downloading')&&typeof Ctor.install==='function'){
   return Promise.resolve(Ctor.install(opts)).then(function(ok){return !!ok;});
  }
  return false;
 }).catch(function(){return false;});
}
function listenOnce(cb){
 var Ctor=SR();
 if(!Ctor){cb(null,new Error('no-speech-recognition'));return null;}
 var rec;
 try{rec=new Ctor();}catch(e){cb(null,e);return null;}
 rec.lang='en-GB';rec.interimResults=true;rec.maxAlternatives=3;
 try{rec.processLocally=true;}catch(e){}
 if(rec.processLocally!==true){cb(null,new Error('local-only'));return null;}
 var finalText='',interim='';
 rec.onresult=function(ev){
  var i,res,live='';
  for(i=0;i<(ev.results||[]).length;i++){
   res=ev.results[i];
   var piece=(res[0]&&res[0].transcript)||'';
   if(res.isFinal)finalText=(finalText?finalText+' ':'')+String(piece).trim();
   else live=piece;
  }
  interim=live;
  if(finalText)cb(finalText,null,{final:true});
  else if(interim)cb(interim,null,{interim:true});
 };
 rec.onerror=function(ev){var code=(ev&&ev.error)||'listen-failed';if(code==='aborted')return;cb(null,new Error(code));};
 rec.onend=function(){if(finalText)cb(finalText,null,{final:true,end:true});else cb(null,new Error('no-speech'),{end:true});};
 try{rec.start();}catch(e){cb(null,e);return null;}
 return rec;
}
function flattenPos(j){
 var out=[],seen={};
 function push(it){if(!it||seen[it.u||it.url])return;seen[it.u||it.url]=1;out.push(it);}
 function walk(node){
  if(!node)return;
  if(Array.isArray(node)){node.forEach(walk);return;}
  if(node.t&&node.u)push(node);
  ['clips','drills','reading','team','scanning','free_pdf_links'].forEach(function(k){if(node[k])walk(node[k]);});
  if(node.sec)walk(node.sec);
  if(node.slots)walk(node.slots);
 }
 walk(j);
 return out;
}
function flattenLib(j,role){
 var items=(j&&j.items)||[];
 return items.map(function(it){
  var tags=it.tags||{};
  var tagStr=[];
  ['moment','theme','system','age'].forEach(function(k){if(Array.isArray(tags[k]))tagStr=tagStr.concat(tags[k]);});
  return {id:it.id,title:it.title,url:it.url,src:it.src,by:it.coach||it.src,tags:tagStr.join(' '),private:!!it.private,type:it.type};
 });
}
function loadPack(role){
 if(typeof fetch!=='function')return Promise.resolve();
 var jobs=[];
 jobs.push(fetch('positions.json',{cache:'force-cache'}).then(function(r){return r.ok?r.json():null;}).then(function(j){if(j)addLibrary(flattenPos(j),role);}).catch(function(){}));
 jobs.push(fetch('library.json',{cache:'force-cache'}).then(function(r){return r.ok?r.json():null;}).then(function(j){if(j)addLibrary(flattenLib(j),role);}).catch(function(){}));
 return Promise.all(jobs);
}
function mount(opts){
 opts=opts||{};
 var root=opts.root||document.body;
 if(document.getElementById('tl-voice-root'))return api();
 var wrap=document.createElement('div');wrap.id='tl-voice-root';
 wrap.innerHTML='<button type="button" class="tl-voice-fab" id="tl-voice-fab" aria-label="Voice helper" aria-haspopup="dialog" aria-controls="tl-voice-sheet">'+
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg></button>'+
  '<div class="tl-voice-sheet" id="tl-voice-sheet" hidden>'+
  '<div class="tl-voice-inner" role="dialog" aria-modal="true" aria-labelledby="tl-voice-h">'+
  '<div class="tl-voice-top"><h3 id="tl-voice-h">Voice assistant</h3><button type="button" class="btn" id="tl-voice-x" aria-label="Dismiss voice assistant">Close</button></div>'+
  '<p class="small" id="tl-voice-status" role="status" aria-live="assertive" aria-atomic="true">Tap the mic. Audio stays on this phone.</p>'+
  '<div id="tl-voice-log" class="tl-voice-log" aria-live="polite"></div>'+
  '<div class="tl-voice-row"><button type="button" class="btn pri" id="tl-voice-mic" aria-pressed="false">Mic</button></div>'+
  '<label class="small" for="tl-voice-in">Or type your question</label>'+
  '<input id="tl-voice-in" placeholder="e.g. What time is the game on Saturday?" autocomplete="off" enterkeyhint="send">'+
  '<button type="button" class="btn pri block" id="tl-voice-go">Ask</button>'+
  '<p class="small muted" id="tl-voice-note" hidden>On-device listening is not available on this phone. Type your question. Nothing is sent to a speech service.</p>'+
  '</div></div>';
 if(!document.getElementById('tl-voice-css')){
  var st=document.createElement('style');st.id='tl-voice-css';
  st.textContent='.tl-voice-fab{position:fixed;right:14px;bottom:calc(86px + env(safe-area-inset-bottom));z-index:90;width:52px;height:52px;border-radius:50%;border:0;background:#FFB81C;color:#0b1330;box-shadow:0 6px 18px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;cursor:pointer}'+
   '.tl-voice-fab.listening{background:#ef4444;color:#fff;animation:tl-voice-pulse 1s ease-in-out infinite}'+
   '@keyframes tl-voice-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}'+
   '.tl-voice-sheet{position:fixed;inset:0;z-index:95;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center}'+
   '.tl-voice-sheet[hidden]{display:none!important}'+
   '.tl-voice-inner{background:var(--card,#0E1D45);color:var(--ink,#F4F6FC);width:100%;max-width:520px;border-radius:16px 16px 0 0;padding:16px 16px 24px;max-height:88vh;overflow:auto}'+
   '.tl-voice-top{display:flex;align-items:center;gap:8px}.tl-voice-top h3{margin:0;flex:1}'+
   '.tl-voice-row{display:flex;gap:8px;margin:8px 0}'+
   '.tl-voice-log{display:flex;flex-direction:column;gap:8px;margin:8px 0;min-height:48px}'+
   '.tl-voice-b{border-radius:12px;padding:10px 12px;max-width:100%}.tl-voice-b.app{background:rgba(255,184,28,.14)}.tl-voice-b.you{background:rgba(255,255,255,.06)}'+
   '.tl-voice-b p{margin:0}.tl-voice-clip{margin-top:8px;padding:8px;border-radius:10px;border:1px solid #27407F}'+
   '.tl-voice-inner input,.tl-voice-inner button.btn{min-height:48px}'+
   '#tl-voice-status{font-weight:700}'+
   '.tl-voice-inner input{width:100%;border-radius:10px;border:1px solid var(--line,#27407F);background:#0A173A;color:inherit;padding:8px 10px;font:inherit}'+
   'body.ps .tl-voice-inner{background:#fff;color:#0A0F24}body.ps .tl-voice-inner input{background:#fff;color:#0A0F24}body.ps .tl-voice-b.you{background:#f3f4f8}'+
   '@media(min-width:900px){.tl-voice-fab{bottom:24px}.tl-voice-sheet{align-items:center}.tl-voice-inner{border-radius:16px}}';
  document.head.appendChild(st);
 }
 root.appendChild(wrap);
 var fab=document.getElementById('tl-voice-fab'),sheet=document.getElementById('tl-voice-sheet');
 var status=document.getElementById('tl-voice-status'),inp=document.getElementById('tl-voice-in');
 var log=document.getElementById('tl-voice-log'),note=document.getElementById('tl-voice-note'),mic=document.getElementById('tl-voice-mic');
 var handsFree=false,prompting=false,rec=null,localOk=null,open=false,lastEl=null,phase='idle',greeted=false,memory={};
 function ctxNow(){var c=(typeof opts.context==='function'?opts.context():(opts.context||{}))||{};if(!c.library)c.library=LIB;c.memory=memory;if(!c.today)c.today=londonToday();return c;}
 function setPhase(next,msg){phase=next;status.textContent=msg||'';}
 function setListen(on){fab.classList.toggle('listening',!!on);mic.setAttribute('aria-pressed',on?'true':'false');mic.textContent=on?'Listening':'Mic';}
 function stopRec(){var r=rec;rec=null;try{if(r)r.onresult=r.onerror=r.onend=null;}catch(e){}try{if(r)r.abort?r.abort():r.stop();}catch(e2){}setListen(false);}
 function finishListen(){var r=rec;rec=null;setListen(false);if(!r)return;try{r.stop();}catch(e){}}
 function bubble(who,html){
  var d=document.createElement('div');d.className='tl-voice-b '+who;d.innerHTML=html;log.appendChild(d);log.scrollTop=log.scrollHeight;lastEl=d;return d;
 }
 function showNote(on){note.hidden=!on;if(on)status.textContent='Type your question. Listening stays off because on-device speech is not available.';}
 function follow(){
  if(!open||!handsFree||prompting)return;
  if(inp.value)return;
  if(document.activeElement===inp)return;
  startListen();
 }
 function startListen(){
  if(!open||!handsFree)return;
  ensureLocal().then(function(ok){
   localOk=ok;
   if(!open||!handsFree||inp.value||document.activeElement===inp)return;
   if(!ok){showNote(true);return;}
   showNote(false);
   stopRec();
   setPhase('listening','Listening. I stay on this phone.');
   setListen(true);
   var delivered=false;
   rec=listenOnce(function(t,err,meta){
    meta=meta||{};
    if(!open)return;
    if(meta.interim){if(phase==='listening')setPhase('listening','I heard: '+t);return;}
    if(delivered)return;
    if(err){
     if(err.message==='aborted')return;
     if(err.message==='no-speech'&&!meta.end)return;
     delivered=true;setListen(false);rec=null;
     var msg=listenMessage(err.message);
     setPhase('error',msg);
     bubble('app','<p>'+esc(msg)+'</p>');
     return;
    }
    if(!t)return;
    delivered=true;setListen(false);rec=null;
    inp.value='';
    run(t,{relisten:true});
   });
   if(!rec){showNote(true);setListen(false);}
  });
 }
 function greet(){
  if(phase==='listening'||phase==='working'||phase==='answering'||phase==='heard')return;
  handsFree=true;prompting=true;showNote(false);
  setPhase('greeting','How can I help?');
  if(!greeted){greeted=true;bubble('app','<p>How can I help?</p>');}
  speak('How can I help?',function(){
   prompting=false;
   if(!open||!handsFree||phase!=='greeting'||inp.value||document.activeElement===inp)return;
   startListen();
  });
 }
 function openSheet(){
  if(open){dismiss();return;}
  open=true;sheet.hidden=false;log.innerHTML='';inp.value='';
  try{document.getElementById('tl-voice-h').focus();}catch(e){}
  var role=(ctxNow().role)||'family';
  loadPack(role);
  ensureLocal().then(function(ok){localOk=ok;if(!ok&&open)showNote(true);});
  greet();
 }
 function dismiss(){
  open=false;handsFree=false;prompting=false;phase='idle';greeted=false;stopRec();
  try{if(global.speechSynthesis)speechSynthesis.cancel();}catch(e){}
  sheet.hidden=true;
 }
 function clipHtml(intent){
  if(!intent.clip)return '';
  var c=intent.clip;
  return '<div class="tl-voice-clip"><p><b>'+esc(c.title)+'</b></p>'+(c.by||c.src?'<p class="small muted">'+esc(c.by||c.src)+'</p>':'')+
   '<div class="tl-voice-row"><button type="button" class="btn" data-voice-play="1">Play</button><button type="button" class="btn" data-voice-share="1">Share</button></div></div>';
 }
 function run(raw,flag){
  flag=flag||{};
  var text=String(raw||'').trim();
  if(!text){setPhase('error','I did not catch that. You can type it.');bubble('app','<p>I did not catch that. You can type it, or tap the mic.</p>');return;}
  setPhase('working','Working that out.');
  bubble('you','<p>'+esc(text)+'</p>');
  var c=ctxNow(),intent=parseIntent(text,c);
  if(intent.game)memory.fixture=intent.game;
  memory.intent=intent.intent;
  setPhase('answering',intent.say);
  var extra=clipHtml(intent);
  if(intent.needConfirm){
   extra+='<div class="tl-voice-row"><button type="button" class="btn pri" data-voice-yes="1">'+(esc(intent.confirmLabel||'Confirm'))+'</button><button type="button" class="btn" data-voice-no="1">Cancel</button></div>';
  }
  var b=bubble('app','<p>'+esc(intent.say)+'</p>'+extra);
  b._intent=intent;
  if(intent.intent==='draft'&&typeof opts.onIntent==='function')opts.onIntent(Object.assign({},intent,{confirmed:false}),c);
  else if(!intent.needConfirm&&intent.intent!=='dismiss'&&typeof opts.onIntent==='function')opts.onIntent(intent,c);
  if(intent.intent==='dismiss'){speak(intent.say,function(){dismiss();});return;}
  speak(intent.say,function(spoke){
   if(spoke===false)setPhase('answering',intent.say+' The answer is on screen. This phone is not speaking.');
   if(flag.relisten)follow();
  });
 }
 fab.onclick=function(){openSheet();};
 mic.onclick=function(){
  if(!open){openSheet();return;}
  if(phase==='listening'){finishListen();return;}
  if(phase==='greeting'){prompting=false;try{if(global.speechSynthesis)speechSynthesis.cancel();}catch(e){}startListen();return;}
  handsFree=true;inp.blur();startListen();
 };
 document.getElementById('tl-voice-x').onclick=dismiss;
 sheet.addEventListener('click',function(e){if(e.target===sheet)dismiss();});
 document.getElementById('tl-voice-go').onclick=function(){handsFree=false;prompting=false;stopRec();try{speechSynthesis.cancel();}catch(e){}var q=inp.value;inp.value='';if(q.trim())run(q,{relisten:false});};
 inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();document.getElementById('tl-voice-go').click();}});
 inp.addEventListener('input',function(){if(!inp.value)return;handsFree=false;stopRec();if(prompting){prompting=false;try{speechSynthesis.cancel();}catch(e){}}});
 inp.addEventListener('focus',function(){handsFree=false;stopRec();if(prompting){prompting=false;try{speechSynthesis.cancel();}catch(e){}}});
 log.addEventListener('click',function(e){
  var yes=e.target.closest('[data-voice-yes]');
  var no=e.target.closest('[data-voice-no]');
  var play=e.target.closest('[data-voice-play]');
  var share=e.target.closest('[data-voice-share]');
  var box=e.target.closest('.tl-voice-b');
  var intent=box&&box._intent;
  if(no){speak('Cancelled.');return;}
  if(yes&&intent){
   var c=ctxNow();
   speak(intent.intent==='draft'?'Sending that now.':'Confirmed.');
   if(typeof opts.onIntent==='function')opts.onIntent(Object.assign({},intent,{confirmed:true}),c);
   return;
  }
  if(play&&intent&&intent.clip){
   if(typeof opts.onIntent==='function')opts.onIntent(Object.assign({},intent,{action:'play',confirmed:true}),ctxNow());
   try{if(/^https?:/i.test(intent.clip.url))window.open(intent.clip.url,'_blank','noopener');}catch(err){}
   return;
  }
  if(share&&intent&&intent.clip){
   var o={title:intent.clip.title,text:intent.clip.title,url:intent.clip.url,coachOnly:!!intent.clip.coachOnly&&!isFamily((ctxNow().role))};
   if(isFamily((ctxNow().role)))o.coachOnly=false;
   if(global.TLShare&&TLShare.share)TLShare.share(o);
   if(typeof opts.onIntent==='function')opts.onIntent(Object.assign({},intent,{action:'share',confirmed:true}),ctxNow());
  }
 });
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&open){e.preventDefault();dismiss();}});
 try{if(global.speechSynthesis)speechSynthesis.addEventListener('voiceschanged',function(){});}catch(e){}
 function api(){return {open:openSheet,close:dismiss,parse:parseIntent,speak:speak,examples:EXAMPLES};}
 return api();
}
var api={parseIntent:parseIntent,speak:speak,listenOnce:listenOnce,canListen:canListen,mount:mount,EXAMPLES:EXAMPLES,meetBy:meetBy,fuzzyScore:fuzzyScore,bestClip:bestClip,draftBody:draftBody,isCoachOnlyItem:isCoachOnlyItem,addLibrary:addLibrary,resetLibrary:resetLibrary,library:library,ensureLocal:ensureLocal,pickVoice:pickVoice,pageFor:pageFor};
global.TLVoice=api;
})(typeof window!=='undefined'?window:globalThis);
