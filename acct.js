/* Touchline account menu: one round button in the top corner of the coach, parent and player pages.
   Keeps a short list of the logins used on THIS phone (kept on the phone only), so Tim, Deano, a parent
   and a player can each switch without retyping a code. Coach, Player and Parent rows are always shown;
   a role with no login on this phone is greyed out. */
(function(){
var LK='tl.accts',DEF='https://script.google.com/macros/s/AKfycby3YUAg5QncW-hb2tKDapu108F2RDlgEhFmluVsXPctKdlLP33ADPbVcJ8kEJSLmoij/exec';
var COACH=/\/coach\/?(index\.html)?$/.test(location.pathname);
var ROLES=[['coach','Coach'],['player','Player'],['parent','Parent']];
function g(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
function s(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function rm(k){try{localStorage.removeItem(k);}catch(e){}}
function list(){try{var a=JSON.parse(g(LK));return Array.isArray(a)?a.filter(function(x){return x&&x.code&&x.role;}):[];}catch(e){return [];}}
function save(a){s(LK,JSON.stringify(a.slice(0,12)));}
function put(role,code,label){var a=list(),f=false;a.forEach(function(x){if(x.code===code&&x.role===role){x.label=label||x.label;f=true;}});if(!f)a.push({role:role,code:code,label:label||''});save(a);}
function dropCode(code){save(list().filter(function(x){return x.code!==code;}));}
function cur(){
 if(COACH){var c=g('tl.code');return c?{role:'coach',code:c}:null;}
 var f=g('fam.code'),D=window.D;if(!f)return null;
 return {role:(D&&D.role)||'',code:f,first:(D&&D.first)||''};
}
function labelFor(role,first){return role==='coach'?'Coach':(role==='player'?'Player':'Parent')+(first?' of '+first:'');}
function learn(){var c=cur();if(!c)return;if(c.role==='coach')put('coach',c.code,'Coach');else if(c.role)put(c.role,c.code,labelFor(c.role,c.first));}
function api(){return window.TL_API||(typeof API==='string'?API:DEF);}
function post(body){return fetch(api(),{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)}).then(function(r){return r.json();});}
function probe(code){
 return post({code:code,action:'f.home'}).then(function(j){
  if(j&&j.ok&&j.data&&(j.data.role==='player'||j.data.role==='parent'))return {role:j.data.role,first:j.data.first||''};
  return post({code:code,action:'sync',docs:[],since:Date.now()}).then(function(k){if(k&&k.ok)return {role:'coach',first:''};throw new Error('That code did not work.');});
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
  if(dirty&&!confirm('Some changes have not synced yet. Sign out anyway?'))return;
  ['tl.code','tl.state.v1','tl.em','tl.conc'].forEach(rm);
 }
 if(all||!COACH){rm('fam.code');rm('fam.cache');}
 if(all){['tl.code','tl.state.v1','tl.em','tl.conc'].forEach(rm);save([]);}
 else if(c)dropCode(c.code);
 location.reload();
}
var open=false,msg='',busy=false;
function css(){if(document.getElementById('acctcss'))return;var st=document.createElement('style');st.id='acctcss';st.textContent=
'#acctbtn{width:36px;height:36px;border-radius:50%;border:2px solid #ffb81c;background:#12204a;color:#fff;font:700 15px system-ui,sans-serif;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex:none;padding:0;margin-left:4px}'+
'#acctbtn.out{background:#ffb81c;color:#0b1330}'+
'#acctmenu{position:fixed;z-index:9999;top:58px;right:10px;width:min(92vw,330px);max-height:80vh;overflow:auto;background:#0f1a3d;color:#fff;border:1px solid #2b3f7a;border-radius:14px;padding:14px;font:15px/1.35 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5)}'+
'#acctmenu h4{margin:12px 0 6px;font-size:13px;letter-spacing:.5px;text-transform:uppercase;color:#9fb2e6}'+
'#acctmenu button{font:inherit;color:inherit}'+
'#acctmenu .row{display:flex;align-items:center;gap:8px;width:100%;text-align:left;background:#16275a;border:1px solid #2b3f7a;border-radius:10px;padding:10px 12px;margin:0 0 6px;cursor:pointer}'+
'#acctmenu .row.on{border-color:#ffb81c}'+
'#acctmenu .row.off{opacity:.4;cursor:default;background:transparent;border-style:dashed}'+
'#acctmenu .sm{font-size:13px;color:#9fb2e6}'+
'#acctmenu input{width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid #2b3f7a;background:#0b1330;color:#fff;font:inherit;margin:4px 0}'+
'#acctmenu .go{background:#ffb81c;color:#0b1330;border:0;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;width:100%;margin:4px 0}'+
'#acctmenu .lnk{background:none;border:0;padding:8px 0;text-decoration:underline;cursor:pointer;color:#9fb2e6;display:block}';
document.head.appendChild(st);}
function ini(){var c=cur();if(!c)return '?';var r=c.role;return r==='coach'?'C':r==='player'?'P':r==='parent'?'F':'?';}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
function draw(){
 var m=document.getElementById('acctmenu');if(m)m.remove();
 var b=document.getElementById('acctbtn');
 if(b){var c=cur();b.textContent=c&&c.role?(c.role==='coach'?'C':c.role==='player'?'P':'Pa'):'+';b.className=c?'':'out';b.setAttribute('aria-expanded',open?'true':'false');b.setAttribute('aria-label',c?'Account menu, signed in as '+labelFor(c.role,c.first):'Sign in');}
 if(!open)return;
 m=el('div');m.id='acctmenu';m.setAttribute('role','dialog');m.setAttribute('aria-label','Accounts');
 var c2=cur(),a=list();
 m.appendChild(el('div','sm',c2?'Signed in as '+(c2.role?labelFor(c2.role,c2.first):'this account'):'Not signed in on this page'));
 ROLES.forEach(function(r){
  m.appendChild(el('h4',0,r[1]));
  var mine=a.filter(function(x){return x.role===r[0];});
  if(!mine.length){var d=el('div','row off',r[1]+': not signed in on this phone');d.setAttribute('aria-disabled','true');m.appendChild(d);return;}
  mine.forEach(function(x){
   var on=c2&&c2.code===x.code,bt=el('button','row'+(on?' on':''),(on?'✓ ':'')+(x.label||labelFor(x.role)));bt.type='button';
   bt.onclick=function(){if(on){open=false;draw();}else go(x);};m.appendChild(bt);
  });
 });
 m.appendChild(el('h4',0,'Add another account'));
 var inp=el('input');inp.id='acctcode';inp.placeholder='Type a code';inp.autocomplete='off';inp.setAttribute('autocapitalize','off');inp.setAttribute('aria-label','Code');m.appendChild(inp);
 var go2=el('button','go',busy?'Checking':'Add and switch');go2.type='button';go2.id='acctadd';
 go2.onclick=function(){var v=(inp.value||'').trim();if(!v||busy)return;busy=true;msg='';draw();
  probe(v).then(function(p){busy=false;var x={role:p.role,code:v,label:labelFor(p.role,p.first)};put(x.role,x.code,x.label);go(x);}).catch(function(e){busy=false;msg=/fetch|network/i.test(e.message)?'No signal. Try again.':e.message;draw();});};
 m.appendChild(go2);
 if(msg)m.appendChild(el('div','sm',msg));
 var rf=el('button','lnk','Refresh the app (get the latest version)');rf.type='button';rf.id='acctrefresh';rf.onclick=function(){if(window.tlRefresh)window.tlRefresh();else location.reload();};m.appendChild(rf);
 if(c2){var so=el('button','lnk','Sign out of this account');so.type='button';so.onclick=function(){signOut(false);};m.appendChild(so);}
 if(a.length>1||c2){var sa=el('button','lnk','Sign out of all accounts on this phone');sa.type='button';sa.onclick=function(){signOut(true);};m.appendChild(sa);}
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
