/* Touchline self update. When the app is opened, or comes back to the front after a few minutes away,
   it asks the server which version is current (version.json, never cached). If it is newer than the one
   this phone is running, it refreshes the app by itself. It will not refresh while you are typing,
   or while there are changes on this phone not yet synced. Bump version.json with every release.
   r87: during a live match or a running session (window.tlHold) it never reloads by itself. It shows an
   Update ready button instead and you tap it when you are ready. After a refresh the page address brings you back. */
(function(){
var RUN='94',KEY='tl.ver.try',GAP=5*60*1000;
var hiddenAt=0;
function g(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
function s(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function busy(){
 var a=document.activeElement;if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.type!=='button')return true;
 try{var f=document.querySelectorAll('input,textarea');for(var i=0;i<f.length;i++){var e=f[i];if(!/^(button|submit|checkbox|radio|file|hidden|password|range)$/i.test(e.type||'')&&e.value&&e.value!==e.defaultValue)return true;}}catch(e){}
 try{var st=JSON.parse(g('tl.state.v1')||'{}');if(st.dirty&&Object.keys(st.dirty).length)return true;}catch(e){}
 return false;
}
function note(){var d=document.createElement('div');d.textContent='Updating Touchline';d.style.cssText='position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#ffb81c;color:#0b1330;padding:10px 16px;border-radius:12px;font:700 14px system-ui,sans-serif;z-index:99999';document.body.appendChild(d);}
function ready(){if(document.getElementById('tl-upd'))return;var b=document.createElement('button');b.id='tl-upd';b.type='button';b.textContent='Update ready';b.setAttribute('aria-label','Update ready. Tap to update Touchline');b.style.cssText='position:fixed;right:14px;top:calc(62px + env(safe-area-inset-top));background:#ffb81c;color:#0b1330;border:0;padding:10px 14px;border-radius:999px;font:700 14px system-ui,sans-serif;z-index:99998;box-shadow:0 4px 14px rgba(0,0,0,.4);cursor:pointer';b.onclick=function(){b.remove();refresh();};document.body.appendChild(b);}
function held(){try{return !!(window.tlHold&&window.tlHold());}catch(e){return false;}}
function refresh(){
 s(KEY,String(Date.now()));note();
 var done=function(){location.reload();};
 var wipe=function(){try{if(window.caches)return caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k);}));});}catch(e){}return Promise.resolve();};
 var upd=function(){try{if(navigator.serviceWorker)return navigator.serviceWorker.getRegistrations().then(function(rs){return Promise.all(rs.map(function(r){return r.update().catch(function(){});}));});}catch(e){}return Promise.resolve();};
 upd().then(wipe).then(done,done);
}
function check(){
 if(document.visibilityState==='hidden')return;
 var last=+g(KEY)||0;if(Date.now()-last<60000)return;
 fetch('/version.json?'+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).then(function(j){
  if(!j||!j.v||String(j.v)===RUN)return;
  if(held()){ready();return;}
  if(busy()){setTimeout(check,20000);return;}
  refresh();
 }).catch(function(){});
}
document.addEventListener('visibilitychange',function(){
 if(document.visibilityState==='hidden'){hiddenAt=Date.now();return;}
 if(hiddenAt&&Date.now()-hiddenAt>GAP)check();
});
window.addEventListener('online',check);
window.tlRefresh=refresh;window.tlCheckUpdate=function(){s(KEY,'0');check();};
if(document.readyState==='complete')setTimeout(check,1500);else window.addEventListener('load',function(){setTimeout(check,1500);});
})();
