/* r115: one voice choice and one demo choice for the lads, saved on this phone only (localStorage).
 * Voices: north (Northern lad, recorded), alice (Alice, recorded), beeps (beeps only, no words).
 * Recorded lines live in audio/vox/<voice>/<hash>.mp3 with a list in audio/vox/<voice>/m.json.
 * If a line is not recorded yet we fall back to the phone's own speech, so nothing goes quiet.
 * Every spoken line goes through fix() so Deano is always said Deeno.
 * No names of players are ever in these lines, and nothing here is sent anywhere. */
(function(G){
'use strict';
var VK='tl.vox',MK='tl.model';
/* Which voices have recordings in this release. Northern goes to 1 once Tim has picked the voice. */
var READY={north:0,alice:1,beeps:1};
/* Which voices have the running timer lines recorded in audio/vox/<voice>/. Until then the phone's speech says them. */
var REC={north:0,alice:0};
var OPTS=[{k:'north',l:'Northern lad'},{k:'alice',l:'Alice'},{k:'beeps',l:'Beeps only'}];
var MODELS=[{k:'lad',l:'Lad in kit'},{k:'figure',l:'Plain figure'}];
function ls(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function ready(k){return !!READY[k];}
function get(){var v=ls(VK);if(v&&READY[v])return v;return READY.north?'north':'alice';}
function set(v){if(!READY[v])return get();lsSet(VK,v);fire();return v;}
function model(){var m=ls(MK);return m==='figure'?'figure':'lad';}
function setModel(m){lsSet(MK,m==='figure'?'figure':'lad');fire();return model();}
function fire(){try{G.dispatchEvent(new CustomEvent('tl-vox',{detail:{voice:get(),model:model()}}));}catch(e){}}
function fix(t){return String(t==null?'':t).replace(/\bDeano\b/gi,'Deeno').replace(/\s+/g,' ').trim();}
/* Same hash as tools/voice/build.py: djb2 over the fixed text, as 8 hex characters. */
function hash(t){t=fix(t);var h=5381;for(var i=0;i<t.length;i++){h=((h<<5)+h+t.charCodeAt(i))>>>0;}return ('0000000'+h.toString(16)).slice(-8);}
var MAN={},AUD=null,Q=[];
var ROOT=(function(){try{var s=document.currentScript&&document.currentScript.src;if(s)return s.replace(/tl-vox\.js.*$/,'');}catch(e){}return '';})();
function manifest(v,cb){if(!REC[v]){MAN[v]={};cb(MAN[v]);return;}if(MAN[v]!==undefined){cb(MAN[v]);return;}
 MAN[v]=null;try{fetch(ROOT+'audio/vox/'+v+'/m.json?v=115').then(function(r){return r.ok?r.json():null;}).then(function(j){MAN[v]=j||{};cb(MAN[v]);}).catch(function(){MAN[v]={};cb(MAN[v]);});}catch(e){MAN[v]={};cb({});}}
function phoneSay(t){try{if(!G.speechSynthesis)return;speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(fix(t));u.lang='en-GB';u.rate=1;var vv=(speechSynthesis.getVoices()||[]).filter(function(x){return /en-GB/i.test(x.lang);})[0];if(vv)u.voice=vv;speechSynthesis.speak(u);}catch(e){}}
function stop(){Q=[];try{if(AUD){AUD.pause();AUD.onended=null;}}catch(e){}try{if(G.speechSynthesis)speechSynthesis.cancel();}catch(e){}}
function playNext(){var f=Q.shift();if(!f)return;try{AUD=AUD||new Audio();AUD.onended=playNext;AUD.src=f;var p=AUD.play();if(p&&p.catch)p.catch(function(){Q=[];});}catch(e){Q=[];}}
/* speak(parts): parts is a list of sentences said one after another. Uses recorded clips for the chosen voice
 * when every part is recorded, otherwise the phone's speech for the whole thing. Beeps only says nothing. */
function speak(parts,opt){opt=opt||{};parts=[].concat(parts).filter(Boolean).map(fix);var v=opt.voice||get();
 log('say',parts.join(' '));
 if(v==='beeps'||G.__silent)return 'none';
 stop();
 var m=MAN[v];
 if(m===undefined){manifest(v,function(){});phoneSay(parts.join(' '));return 'phone';}
 if(m&&parts.every(function(p){return m[hash(p)];})){Q=parts.map(function(p){return ROOT+'audio/vox/'+v+'/'+hash(p)+'.mp3?v='+m[hash(p)];});playNext();return 'clip';}
 phoneSay(parts.join(' '));return 'phone';}
function log(k,t){(API._log=API._log||[]).push({k:k,t:t,at:Date.now()});if(API._log.length>100)API._log.shift();}
function picker(opts){opts=opts||{};var cur=get();
 return '<div class="tlvox" role="group" aria-label="Voice">'+OPTS.map(function(o){var off=!READY[o.k];
  return '<button type="button" class="tlvox-b'+(cur===o.k?' on':'')+'" data-vox="'+o.k+'"'+(off?' disabled aria-disabled="true" title="Coming soon"':'')+' aria-pressed="'+(cur===o.k)+'">'+o.l+(off?' <small>(coming soon)</small>':'')+'</button>';}).join('')+'</div>';}
function modelPicker(){var cur=model();
 return '<div class="tlvox" role="group" aria-label="Demo">'+MODELS.map(function(o){return '<button type="button" class="tlvox-b'+(cur===o.k?' on':'')+'" data-model="'+o.k+'" aria-pressed="'+(cur===o.k)+'">'+o.l+'</button>';}).join('')+'</div>';}
var API={get:get,set:set,ready:ready,model:model,setModel:setModel,fix:fix,hash:hash,speak:speak,stop:stop,picker:picker,modelPicker:modelPicker,opts:OPTS,models:MODELS,_ready:READY,_rec:REC,manifest:manifest};
G.TLVOX=API;
/* One click handler for every picker on the page. Pages listen for the tl-vox event to repaint. */
document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('[data-vox],[data-model]');if(!b||b.disabled)return;
 if(b.hasAttribute('data-vox'))set(b.getAttribute('data-vox'));else setModel(b.getAttribute('data-model'));
 var g=b.parentNode;if(g)[].forEach.call(g.querySelectorAll('.tlvox-b'),function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',String(on));});
 if(b.hasAttribute('data-vox')&&get()!=='beeps'){manifest(get(),function(){});}});
(function(){if(document.getElementById('tlvox-css'))return;var st=document.createElement('style');st.id='tlvox-css';
 st.textContent='.tlvox{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.tlvox-b{min-height:48px;padding:6px 14px;border-radius:22px;border:1px solid currentColor;background:transparent;color:inherit;font:inherit;font-weight:600;cursor:pointer;opacity:.9}.tlvox-b.on{background:#1d4ed8;border-color:#1d4ed8;color:#fff;opacity:1}.tlvox-b[disabled]{opacity:.45;cursor:not-allowed}.tlvox-b small{font-weight:400}';
 (document.head||document.documentElement).appendChild(st);})();
try{manifest(get(),function(){});}catch(e){}
})(window);
