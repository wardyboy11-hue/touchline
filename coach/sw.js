/* Touchline coach app shell service worker (P0).
   Precache: shell only. Runtime: cache first for versioned static, network first for pages,
   Apps Script and other origins are never touched. No PDFs, video or audio are cached here. */
var V='touchline-shell-v57',RT='touchline-run-v57';
var SHELL=['./','index.html','app.css?v=57','topics.js?v=57','app.js?v=57','../pod.js','manifest.webmanifest','../badge.png','../icon-192.png','../icon-512.png'];
var SKIP=/\.(pdf|mp4|mp3|m4a|webm|mov)$/i;
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(SHELL);}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V&&k!==RT;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('message',function(e){var d=e.data||{};if(d.type==='prefetch'&&Array.isArray(d.urls)){e.waitUntil(caches.open(RT).then(function(c){return Promise.all(d.urls.filter(function(u){return !SKIP.test(u);}).map(function(u){return c.add(u).catch(function(){});}));}));}});
self.addEventListener('fetch',function(e){
 var r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin||SKIP.test(u.pathname)||r.headers.has('range'))return;
 if(r.mode==='navigate'){
  /* network first, shell as the offline fallback. Never block first paint on an update check. */
  var cached=function(){return caches.match('index.html',{ignoreSearch:true}).then(function(h){return h||caches.match('./');});};
  e.respondWith(Promise.race([fetch(r),new Promise(function(_,no){setTimeout(no,3500);})]).catch(function(){return cached().then(function(h){return h||fetch(r);});}));return;}
 if(u.search.indexOf('v=')>-1){
  e.respondWith(caches.match(r).then(function(hit){return hit||fetch(r).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp);});}return res;});}));return;}
 /* other same origin static (res.js, ig.js, x.js, anim, images): stale while revalidate */
 e.respondWith(caches.open(RT).then(function(c){return c.match(r).then(function(hit){
  var net=fetch(r).then(function(res){if(res&&res.ok)c.put(r,res.clone());return res;}).catch(function(){return hit;});
  return hit||net;});}));
});
