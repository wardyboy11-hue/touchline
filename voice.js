/* Touchline r95: on-device voice helper. Web Speech API only. No audio leaves the phone.
 * Family views use shirt numbers only. Typed fallback when SpeechRecognition is missing. */
(function(global){
'use strict';
var EXAMPLES=[
 'Confirm attendance',
 'Show fixtures',
 'What time is the game on Saturday?',
 'Where is the game?',
 'What are we doing at training tonight?',
 'Show me a clip of how to shoot',
 'My role',
 'Show my player card',
 'Running late',
 'Start the stretch',
 'Club shop',
 'Latest news',
 'Help'
];
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
function has(t,words){for(var i=0;i<words.length;i++)if(t.indexOf(words[i])>-1)return true;return false;}
function meetBy(ko){var m=String(ko||'').match(/(\d{1,2}):(\d{2})/);if(!m)return '';var t=(+m[1])*60+(+m[2])-30;if(t<0)t+=1440;return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
function nextSat(fixtures){
 var td=new Date(),iso=td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');
 var L=(fixtures||[]).filter(function(m){return !m.done&&!m.pp&&m.date>=iso;}).sort(function(a,b){return a.date<b.date?-1:1;});
 for(var i=0;i<L.length;i++){var d=new Date(L[i].date+'T12:00:00');if(d.getDay()===6)return L[i];}
 return L[0]||null;
}
function clipTopic(t){
 var map=[['shoot','shoot finish finishing strike'],['pass','pass passing'],['defend','defend defending'],['cross','cross crossing'],['dribble','dribble'],['header','header heading'],['press','press pressing'],['gk','goalkeeper keeper'],['set piece','corner free kick set piece'],['first touch','first touch receive']];
 for(var i=0;i<map.length;i++)if(has(t,map[i][1].split(' ')))return map[i][0];
 var m=t.match(/(?:clip|video|how to|show me)\s+(?:of\s+|a\s+|to\s+)?([a-z ]{3,40})/);
 return m?m[1].trim().split(' ').slice(0,3).join(' '):'';
}
function parseIntent(raw,ctx){
 ctx=ctx||{};
 var t=norm(raw),role=ctx.role||'family';
 if(!t)return {intent:'empty',say:'I did not catch that. Try again, or type it.'};
 if(has(t,['help','what can i say','examples','commands']))return {intent:'help',say:'You can say things like: '+EXAMPLES.slice(0,6).join('; ')+'.'};
 if(has(t,['confirm attendance','mark me in','i am in','i can come','confirm i am coming','say yes to training','say yes to the match','confirm coming']))
  return {intent:'attendance',say:'Opening attendance so you can confirm for your own player.',needConfirm:true};
 if(has(t,['running late','we are late','i am late','going to be late']))
  return {intent:'late',say:'Opening the running late button.'};
 if(has(t,['start the stretch','start stretch','pre game stretch','pregame stretch','cool down','start stretching','open stretch']))
  return {intent:'stretch',say:'Opening the stretch player.'};
 if(has(t,['my role','role card','what is my role','show my role']))
  return {intent:'role',say:'Opening your role card.'};
 if(has(t,['player card','my card','show my profile','my profile','player profile']))
  return {intent:'card',say:'Opening your player card. Shirt numbers only on family views.'};
 if(has(t,['club shop','open shop','kit shop','buy a coat']))
  return {intent:'shop',say:'Opening the club shop.'};
 if(has(t,['latest news','show news','team news','any news']))
  return {intent:'news',say:'Showing the latest news.'};
 if(has(t,['show fixtures','fixtures','fixture list','upcoming games','what games']))
  return {intent:'fixtures',say:'Opening fixtures.'};
 if(has(t,['where is the game','where is the match','venue','where do we play','getting there','parking'])){
  var g=nextSat(ctx.fixtures);var where=g?(g.venue||g.addr||(g.vi&&g.vi.pc)||'venue to be confirmed'):'No upcoming game listed yet.';
  return {intent:'where',say:(g?((g.ha==='A'?'Away at ':'Home. ')+where):where),go:'games',game:g};
 }
 if(has(t,['what time','kick off','kickoff','when is the game','game on saturday','match on saturday','meet time','be there'])){
  var g2=nextSat(ctx.fixtures);
  if(!g2)return {intent:'kickoff',say:'No upcoming game is listed yet.',go:'games'};
  var meet=meetBy(g2.ko||g2.meet);
  var line=(g2.ha==='A'?'Away at ':'Home versus ')+(g2.opp||'the opposition')+' on '+String(g2.date).split('-').reverse().join('/')+'. Kick off '+(g2.ko||'to be confirmed')+(meet?'. Meet by '+meet+' (thirty minutes before kick off).':'. Meet thirty minutes before kick off.');
  return {intent:'kickoff',say:line,go:'games',game:g2};
 }
 if(has(t,['training tonight','training this week','what are we doing at training','what is training','session tonight','this week training','what are we working on']))
  return {intent:'training',say:ctx.trainingLine||'Opening this week\'s training card.',go:'home'};
 if(has(t,['clip','video','how to','show me'])||has(t,['shoot','pass','defend','cross','dribble'])){
  var topic=clipTopic(t)||'football';
  return {intent:'clip',say:'Searching the library for '+topic+'.',topic:topic,go:'lib'};
 }
 if(has(t,['contacts','welfare','who do i call']))
  return {intent:'contacts',say:'Opening contacts.',go:'contacts'};
 if(has(t,['faq','help page']))
  return {intent:'faq',say:'Opening the FAQ.',go:'faq'};
 if(role==='coach'&&has(t,['attendance','take register','who is here']))
  return {intent:'coach_att',say:'Opening attendance.',go:'att'};
 return {intent:'unknown',say:'Sorry, I am not sure. Try: '+EXAMPLES[Math.floor(Math.random()*EXAMPLES.length)]+'. Or say help.'};
}
function pickVoice(){
 try{
  var vs=speechSynthesis.getVoices()||[],i,v;
  for(i=0;i<vs.length;i++){v=vs[i];if(/en-GB/i.test(v.lang)&&/female|woman|girl|susan|serena|martha|kate|libby|jenny|zira|samantha|moira|fiona|karen/i.test(v.name))return v;}
  for(i=0;i<vs.length;i++){v=vs[i];if(/en-GB/i.test(v.lang))return v;}
  for(i=0;i<vs.length;i++){v=vs[i];if(/en-US/i.test(v.lang)&&/female|samantha|karen|moira/i.test(v.name))return v;}
  for(i=0;i<vs.length;i++){v=vs[i];if(/^en/i.test(v.lang))return v;}
 }catch(e){}
 return null;
}
function speak(text,done){
 try{
  if(!global.speechSynthesis){if(done)done();return;}
  speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(String(text||''));
  u.lang='en-GB';u.rate=1;u.pitch=1;
  var v=pickVoice();if(v)u.voice=v;
  u.onend=function(){if(done)done();};u.onerror=function(){if(done)done();};
  speechSynthesis.speak(u);
 }catch(e){if(done)done();}
}
function canListen(){return !!(global.SpeechRecognition||global.webkitSpeechRecognition);}
function listenOnce(cb){
 var SR=global.SpeechRecognition||global.webkitSpeechRecognition;
 if(!SR){cb(null,new Error('no-speech-recognition'));return null;}
 var rec=new SR();rec.lang='en-GB';rec.interimResults=false;rec.maxAlternatives=3;
 rec.onresult=function(ev){var t=(ev.results[0]&&ev.results[0][0]&&ev.results[0][0].transcript)||'';cb(t,null);};
 rec.onerror=function(ev){cb(null,new Error(ev.error||'listen-failed'));};
 try{rec.start();}catch(e){cb(null,e);}
 return rec;
}
function mount(opts){
 opts=opts||{};
 var root=opts.root||document.body;
 if(document.getElementById('tl-voice-root'))return;
 var wrap=document.createElement('div');wrap.id='tl-voice-root';
 wrap.innerHTML='<button type="button" class="tl-voice-fab" id="tl-voice-fab" aria-label="Voice helper">'+
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg></button>'+
  '<div class="tl-voice-sheet" id="tl-voice-sheet" hidden>'+
  '<div class="tl-voice-inner" role="dialog" aria-label="Voice helper">'+
  '<h3 style="margin:0 0 6px">Voice helper</h3>'+
  '<p class="small muted" id="tl-voice-status">Tap the mic, or type below. Audio stays on this phone.</p>'+
  '<div class="tl-voice-row"><button type="button" class="btn pri" id="tl-voice-mic"'+(canListen()?'':' disabled')+'>'+(canListen()?'Listen':'Mic not supported')+'</button>'+
  '<button type="button" class="btn" id="tl-voice-x">Close</button></div>'+
  '<label class="small" for="tl-voice-in">Type instead</label>'+
  '<input id="tl-voice-in" placeholder="e.g. What time is the game on Saturday?" autocomplete="off">'+
  '<button type="button" class="btn pri block" id="tl-voice-go" style="margin-top:8px">Go</button>'+
  '<details style="margin-top:10px"><summary style="cursor:pointer;font-weight:700">Example phrases</summary><ul class="small" id="tl-voice-ex"></ul></details>'+
  '<div id="tl-voice-confirm" hidden style="margin-top:10px;padding:10px;border-radius:12px;border:1px solid #27407F;background:rgba(255,184,28,.1)">'+
  '<p class="small" id="tl-voice-confirm-txt"></p>'+
  '<div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn pri" id="tl-voice-yes">Confirm</button><button type="button" class="btn" id="tl-voice-no">Cancel</button></div></div>'+
  '</div></div>';
 if(!document.getElementById('tl-voice-css')){
  var st=document.createElement('style');st.id='tl-voice-css';
  st.textContent='.tl-voice-fab{position:fixed;right:14px;bottom:calc(86px + env(safe-area-inset-bottom));z-index:90;width:52px;height:52px;border-radius:50%;border:0;background:#FFB81C;color:#0b1330;box-shadow:0 6px 18px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;cursor:pointer}'+
   '.tl-voice-fab.listening{background:#ef4444;color:#fff;animation:tl-voice-pulse 1s ease-in-out infinite}'+
   '@keyframes tl-voice-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}'+
   '.tl-voice-sheet{position:fixed;inset:0;z-index:95;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center}'+
   '.tl-voice-inner{background:var(--card,#0E1D45);color:var(--ink,#F4F6FC);width:100%;max-width:520px;border-radius:16px 16px 0 0;padding:16px 16px 24px;max-height:88vh;overflow:auto}'+
   '.tl-voice-row{display:flex;gap:8px;margin:8px 0}'+
   '.tl-voice-inner input{width:100%;min-height:44px;border-radius:10px;border:1px solid var(--line,#27407F);background:#0A173A;color:inherit;padding:8px 10px;font:inherit}'+
   'body.ps .tl-voice-inner{background:#fff;color:#0A0F24}body.ps .tl-voice-inner input{background:#fff;color:#0A0F24}'+
   '@media(min-width:900px){.tl-voice-fab{bottom:24px}.tl-voice-sheet{align-items:center}.tl-voice-inner{border-radius:16px}}';
  document.head.appendChild(st);
 }
 root.appendChild(wrap);
 var fab=document.getElementById('tl-voice-fab'),sheet=document.getElementById('tl-voice-sheet');
 var status=document.getElementById('tl-voice-status'),inp=document.getElementById('tl-voice-in');
 var conf=document.getElementById('tl-voice-confirm'),confTxt=document.getElementById('tl-voice-confirm-txt');
 var pending=null,listening=false;
 document.getElementById('tl-voice-ex').innerHTML=EXAMPLES.map(function(x){return '<li>'+x+'</li>';}).join('');
 function open(){sheet.hidden=false;}
 function close(){sheet.hidden=true;conf.hidden=true;pending=null;fab.classList.remove('listening');}
 function ctxNow(){return (typeof opts.context==='function'?opts.context():(opts.context||{}))||{};}
 function run(raw){
  var c=ctxNow(),intent=parseIntent(raw,c);
  status.textContent='Heard: "'+String(raw||'')+'"';
  if(intent.needConfirm||intent.intent==='attendance'){
   pending=intent;conf.hidden=false;
   confTxt.textContent='Confirm attendance for your own player only (shirt number '+(c.shirt||'?')+')?';
   speak('Confirm attendance for shirt number '+(c.shirt||'your player')+'?');
   return;
  }
  conf.hidden=true;pending=null;
  speak(intent.say);
  if(typeof opts.onIntent==='function')opts.onIntent(intent,c);
 }
 fab.onclick=open;
 document.getElementById('tl-voice-x').onclick=close;
 sheet.addEventListener('click',function(e){if(e.target===sheet)close();});
 document.getElementById('tl-voice-go').onclick=function(){run(inp.value);};
 inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();run(inp.value);}});
 document.getElementById('tl-voice-mic').onclick=function(){
  if(!canListen()){status.textContent='This browser has no speech recognition. Type instead.';return;}
  if(listening)return;
  listening=true;fab.classList.add('listening');status.textContent='Listening...';
  listenOnce(function(t,err){
   listening=false;fab.classList.remove('listening');
   if(err||!t){status.textContent='Could not hear that. Type it instead.';return;}
   inp.value=t;run(t);
  });
 };
 document.getElementById('tl-voice-yes').onclick=function(){
  if(!pending)return;var c=ctxNow(),intent=pending;pending=null;conf.hidden=true;
  speak('Confirmed.');
  if(typeof opts.onIntent==='function')opts.onIntent(Object.assign({},intent,{confirmed:true}),c);
 };
 document.getElementById('tl-voice-no').onclick=function(){pending=null;conf.hidden=true;speak('Cancelled.');};
 try{if(global.speechSynthesis)speechSynthesis.addEventListener('voiceschanged',function(){});}catch(e){}
 return {open:open,close:close,parse:parseIntent,speak:speak,examples:EXAMPLES};
}
global.TLVoice={parseIntent:parseIntent,speak:speak,listenOnce:listenOnce,canListen:canListen,mount:mount,EXAMPLES:EXAMPLES,meetBy:meetBy};
})(typeof window!=='undefined'?window:globalThis);
