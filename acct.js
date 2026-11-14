/* Touchline account menu: one round button in the top corner of the coach, parent and player pages.
   Keeps a short list of the logins used on THIS phone (kept on the phone only), so Tim, Deano, a parent
   and a player can each switch without retyping a code. Coach, Player and Parent rows are always shown;
   a role with no login on this phone is greyed out. */
(function(){
var LK='tl.accts',DEF='https://script.google.com/macros/s/AKfycby3YUAg5QncW-hb2tKDapu108F2RDlgEhFmluVsXPctKdlLP33ADPbVcJ8kEJSLmoij/exec';
var COACH=/\/coach\/?(index\.html)?$/.test(location.pathname);
var ROLES=[['coach','Coach'],['player','Player'],['parent','Parent']],ROLEH={coach:'Coach',player:'Players',parent:'Parents'},ROLE0={coach:'No coach code on this phone',player:'No player code on this phone yet',parent:'No parent code on this phone yet'};
function g(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
function s(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function rm(k){try{localStorage.removeItem(k);}catch(e){}}
function list(){try{var a=JSON.parse(g(LK));return Array.isArray(a)?a.filter(function(x){return x&&x.code&&x.role;}):[];}catch(e){return [];}}
function save(a){s(LK,JSON.stringify(a.slice(0,12)));}
function put(role,code,label,first){var a=list(),f=false;a.forEach(function(x){if(x.code===code&&x.role===role){x.label=label||x.label;if(first)x.first=first;f=true;}});if(!f)a.push({role:role,code:code,label:label||'',first:first||''});save(a);}
function dropCode(code){save(list().filter(function(x){return x.code!==code;}));}
function cur(){
 if(COACH){var c=g('tl.code');return c?{role:'coach',code:c}:null;}
 var f=g('fam.code'),D=window.D;if(!f)return null;
 return {role:(D&&D.role)||'',code:f,first:(D&&D.first)||''};
}
/* r109: plain labels. A player is 'Rohan (player)', a parent is 'Rohan\'s parent', a coach is 'Coach'. Old saved labels such as 'Player of Rohan' are read back into a first name. */
function poss(n){return n+'\'s';}
function labelFor(role,first){first=(first||'').trim();if(role==='coach')return 'Coach';if(role==='player')return first?first+' (player)':'Player';return first?poss(first)+' parent':'Parent';}
function firstOf(x){if(x.first)return x.first;var m=/^(?:Player|Parent) of (.+)$/.exec(x.label||'')||/^(.+?) \(player\)$/.exec(x.label||'')||/^(.+?)'s? parent$/.exec(x.label||'');return m?m[1]:'';}
function nice(x){return x.role==='coach'?'Coach':labelFor(x.role,firstOf(x));}
function learn(){var c=cur();if(!c)return;if(c.role==='coach')put('coach',c.code,'Coach');else if(c.role)put(c.role,c.code,labelFor(c.role,c.first),c.first);}
function api(){return window.TL_API||(typeof API==='string'?API:DEF);}
function post(body){return fetch(api(),{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)}).then(function(r){return r.json();});}
function probe(code){
 return post({code:code,action:'who.am.i'}).then(function(j){
  if(j&&j.ok&&j.data&&j.data.role)return {role:j.data.role,first:j.data.first||''};
  throw new Error((j&&j.error)||'That code did not work.');
 });
}
function go(a){
 if(a.role==='coach'){s('tl.code',a.code);if(COACH)location.reload();else location.href='/coach/';return;}
 s('fam.code',a.code);rm('fam.cache');
 if(COACH)location.href='/family.html';else location.reload();
}
function signOut(all){
 var c=cur();
 if(COACH){
  var dirty=0;try{dirty=Object.keys((JSON.parse(g('tl.state.v1'))||{}).dirty||{}).length;}catch(e){}
  if(dirty&&!confirm('Some changes have not been saved to the team yet. Sign out anyway?'))return;
  ['tl.code','tl.state.v1','tl.em','tl.conc'].forEach(rm);try{indexedDB.deleteDatabase('tl.pdf');}catch(e){}
 }
 if(all||!COACH){rm('fam.code');rm('fam.cache');}
 if(all){['tl.code','tl.state.v1','tl.em','tl.conc'].forEach(rm);try{indexedDB.deleteDatabase('tl.pdf');}catch(e){}save([]);}
 else if(c)dropCode(c.code);
 location.reload();
}
var open=false,msg='',busy=false;
function css(){if(document.getElementById('acctcss'))return;var st=document.createElement('style');st.id='acctcss';st.textContent=
'#acctbtn{min-width:44px;height:44px;border-radius:22px;border:2px solid #ffb81c;background:#12204a;color:#fff;font:700 13px system-ui,sans-serif;display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;flex:none;padding:0 10px 0 4px;margin-left:4px}'+
'#acctbtn .ab{width:30px;height:30px;border-radius:50%;background:#ffb81c;color:#0b1330;display:inline-flex;align-items:center;justify-content:center;font-size:15px}#acctbtn .aw{line-height:1}#acctbtn.out .ab{background:#0b1330;color:#ffb81c}#acctbtn .ac{display:none;font-size:12px;line-height:1;color:#ffb81c}@media (max-width:430px){#acctbtn .aw{display:none}#acctbtn .ac{display:inline}#acctbtn{padding:0 6px 0 4px;gap:3px}}'+
'#acctbtn.out{background:#ffb81c;color:#0b1330}'+
'#acctmenu{position:fixed;z-index:9999;top:58px;right:10px;width:min(92vw,330px);max-height:80vh;overflow:auto;background:#0f1a3d;color:#fff;border:1px solid #2b3f7a;border-radius:14px;padding:14px;font:15px/1.35 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5)}'+
'#acctmenu h4{margin:12px 0 6px;font-size:13px;letter-spacing:.5px;text-transform:uppercase;color:#9fb2e6}'+
'#acctmenu button{font:inherit;color:inherit}'+
'#acctmenu .row{display:flex;align-items:center;gap:8px;width:100%;min-height:48px;font-size:16px;text-align:left;background:#16275a;border:1px solid #2b3f7a;border-radius:10px;padding:10px 12px;margin:0 0 6px;cursor:pointer}'+
'#acctmenu .row.on{border-color:#ffb81c}'+
'#acctmenu .row.off{opacity:.4;cursor:default;background:transparent;border-style:dashed}'+
'#acctmenu .sm{font-size:15px;color:#c3d0f0}'+
'#acctmenu input{width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid #2b3f7a;background:#0b1330;color:#fff;font:inherit;margin:4px 0}'+
'#acctmenu .go{background:#ffb81c;color:#0b1330;border:0;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;width:100%;margin:4px 0}'+
'#acctmenu .lnk{background:none;border:0;padding:12px 0;min-height:44px;font-size:16px;text-decoration:underline;cursor:pointer;color:#9fb2e6;display:block}';
document.head.appendChild(st);}
function ini(){var c=cur();if(!c)return '?';var r=c.role;return r==='coach'?'C':r==='player'?'P':r==='parent'?'F':'?';}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
function draw(){
 var m=document.getElementById('acctmenu');if(m)m.remove();
 var b=document.getElementById('acctbtn');
 if(b){var c=cur();/* r113: a clearer button. A letter bubble for who you are, and the word Switch (or Sign in). */var f=c&&c.first?String(c.first).trim().charAt(0).toUpperCase():'';var ini=c&&c.role?(c.role==='coach'?'C':c.role==='player'?(f||'P'):'P'):'+';b.innerHTML='';var bub=el('span','ab',ini);bub.setAttribute('aria-hidden','true');b.appendChild(bub);b.appendChild(el('span','aw',c?'Switch':'Sign in'));var cv=el('span','ac','\u25BE');cv.setAttribute('aria-hidden','true');b.appendChild(cv);b.className=c?'':'out';b.setAttribute('aria-expanded',open?'true':'false');b.setAttribute('aria-label',c?'Switch account. Signed in as '+labelFor(c.role,c.first):'Sign in');b.title=c?'Switch account':'Sign in';}
 if(!open)return;
 m=el('div');m.id='acctmenu';m.setAttribute('role','dialog');m.setAttribute('aria-label','Accounts');
 var c2=cur(),a=list();
 m.appendChild(el('div','sm',c2?'You are signed in as '+(c2.role?labelFor(c2.role,c2.first):'this account'):'You are not signed in on this page'));m.appendChild(el('div','sm','Tap a name to switch.'));
 ROLES.forEach(function(r){
  var mine=a.filter(function(x){return x.role===r[0];});
  if(!mine.length&&r[0]==='coach'&&!COACH)return; /* families never need an empty Coach row */
  m.appendChild(el('h4',0,ROLEH[r[0]]));
  if(!mine.length){var d=el('div','row off',ROLE0[r[0]]);d.setAttribute('aria-disabled','true');m.appendChild(d);return;}
  mine.forEach(function(x){
   var on=c2&&c2.code===x.code,bt=el('button','row'+(on?' on':''),(on?'✓ ':'')+nice(x));bt.type='button';
   bt.onclick=function(){if(on){open=false;draw();}else go(x);};m.appendChild(bt);
  });
 });
 m.appendChild(el('h4',0,'Add someone else'));
 var inp=el('input');inp.id='acctcode';inp.placeholder='Type their code';inp.autocomplete='off';inp.setAttribute('autocapitalize','off');inp.setAttribute('aria-label','Code');m.appendChild(inp);
 var go2=el('button','go',busy?'Checking':'Add and open');go2.type='button';go2.id='acctadd';
 go2.onclick=function(){var v=(inp.value||'').trim();if(!v||busy)return;busy=true;msg='';draw();
  probe(v).then(function(p){busy=false;var x={role:p.role,code:v,label:labelFor(p.role,p.first),first:p.first||''};put(x.role,x.code,x.label,x.first);go(x);}).catch(function(e){busy=false;msg=/fetch|network/i.test(e.message)?'No signal. Try again.':e.message;draw();});};
 m.appendChild(go2);
 if(msg)m.appendChild(el('div','sm',msg));
 var rf=el('button','lnk','Get the latest version of the app');rf.type='button';rf.id='acctrefresh';rf.onclick=function(){if(window.tlRefresh)window.tlRefresh();else location.reload();};m.appendChild(rf);
 if(c2){var so=el('button','lnk','Sign out');so.type='button';so.onclick=function(){signOut(false);};m.appendChild(so);}
 if(a.length>1||c2){var sa=el('button','lnk','Sign everyone out on this phone');sa.type='button';sa.onclick=function(){signOut(true);};m.appendChild(sa);}
 document.body.appendChild(m);
}
function mount(){
 css();
 var h=document.querySelector('header');
 if(h&&!h.querySelector('#acctbtn')){var b=document.getElementById('acctbtn');if(!b){b=el('button');b.id='acctbtn';b.type='button';b.onclick=function(e){e.stopPropagation();open=!open;msg='';draw();if(open){var i=document.getElementById('acctcode');}};}
  h.appendChild(b);draw();}
}
document.addEventListener('click',function(e){if(open&&!e.target.closest('#acctmenu')&&!e.target.closest('#acctbtn')){open=false;draw();}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&open){open=false;draw();}});
function boot(){mount();learn();new MutationObserver(function(){mount();}).observe(document.body,{childList:true,subtree:true});setInterval(function(){learn();var b=document.getElementById('acctbtn');if(b&&!open)draw();},1500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
