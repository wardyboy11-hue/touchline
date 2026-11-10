/* Touchline coach app shell service worker (P0).
   Precache: shell only. Runtime: network first for HTML/JS so a broken release can be replaced
   even if update.js never runs; cache first for versioned images/css. Apps Script and other
   origins are never touched. No PDFs, video or audio are cached here. */
var V='touchline-shell-v110',RT='touchline-run-v110',MATCH='tl-matchday';
var SHELL=['./','index.html','app.css?v=110','../tl-ui.css?v=110','../tl-spotify.js?v=110','../tl-alarm.js?v=110','../tl-pages.js?v=110','topics.js?v=110','topic-bank.js?v=110','guide.js?v=110','motm105.js?v=110','app.js?v=110','gui.js?v=110','positions.js?v=110','positions.json','cdev.js?v=110','../pod.js','../acct.js?v=110','../voice.js?v=110','../share.js?v=110','../update.js?v=110','../shop.css?v=110','../shop.js?v=110','../fitness.js?v=110','../fitness.css?v=110','../cd.js?v=110','../shop/img/ss-core-supporters-coat-navy.webp?v=110','../shop/img/ss-core-thermal-jacket-navy.webp?v=110','../shop/img/end-of-line-ss-bench-coat-navy.webp?v=110','../shop/img/ss-core-softshell-jacket-navy.webp?v=110','../shop/img/ss-core-padded-gilet-navy.webp?v=110','../shop/img/new-ss-core-rain-jacket-navy.webp?v=110','../shop/img/ss-core-softshell-gilet-navy.webp?v=110','manifest.webmanifest','../badge.png','../icon-192.png','../icon-512.png'];
var SKIP=/\.(pdf|mp4|mp3|m4a|webm|mov)$|version\.json$/i;
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(SHELL);}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V&&k!==RT&&k!==MATCH;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('message',function(e){var d=e.data||{};if(d.type==='SKIP_WAITING'){self.skipWaiting();return;}if(d.type==='prefetch'&&Array.isArray(d.urls)){e.waitUntil(caches.open(RT).then(function(c){return Promise.all(d.urls.filter(function(u){return !SKIP.test(u);}).map(function(u){return c.add(u).catch(function(){});}));}));}});
self.addEventListener('fetch',function(e){
 var r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin||r.headers.has('range'))return;
 if(/\/shape\//.test(u.pathname)||/12_352_in_transition\.html$/.test(u.pathname)){
  e.respondWith(caches.open(MATCH).then(function(c){return c.match(r).then(function(hit){
   var net=fetch(r).then(function(res){if(res&&res.ok)c.put(r,res.clone());return res;}).catch(function(){return hit||Response.error();});
   return hit||net;});}));
  return;
 }
 if(SKIP.test(u.pathname))return;
 function netFirst(cacheName){
  return caches.open(cacheName).then(function(c){return fetch(r).then(function(res){if(res&&res.ok)c.put(r,res.clone());return res;}).catch(function(){return c.match(r,{ignoreSearch:true}).then(function(hit){return hit||Response.error();});});});
 }
 if(r.mode==='navigate'){
  /* Always prefer network for HTML so a broken cached shell cannot stick. Offline falls back to cache. */
  e.respondWith(netFirst(/\/coach\/(index\.html)?$/.test(u.pathname)?V:RT));return;
 }
 /* JS (and update.js) network first so syntax fixes land even without a version-query bump race. */
 if(/\.js$/i.test(u.pathname)){e.respondWith(netFirst(V));return;}
 if(/\/library\.json$/.test(u.pathname)){e.respondWith(netFirst(RT));return;}
 if(u.search.indexOf('v=')>-1){
  e.respondWith(caches.match(r).then(function(hit){return hit||fetch(r).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp);});}return res;});}));return;}
 e.respondWith(caches.open(RT).then(function(c){return c.match(r).then(function(hit){
  var net=fetch(r).then(function(res){if(res&&res.ok)c.put(r,res.clone());return res;}).catch(function(){return hit;});
  return hit||net;});}));
});
