/* family service worker. r112: push alerts, offline shop images, and the family pages plus Running work offline.
   r113: registered for every family (not only those with alerts on), and faster repeat visits:
   versioned files (?v=) come from the cache, pages try the network for 3 seconds then use the saved copy,
   pictures and styles show the saved copy and refresh in the background. */
var FV='tl-fam-v113';
var FSHELL=['tl-ui.css?v=113','tl-spotify.js?v=113','tl-alarm.js?v=113','tl-pages.js?v=113','tl-quick.js?v=113','share.js?v=113','voice.js?v=113','shop.js?v=113','fitness.js?v=113','fitness.css?v=113','running.js?v=113','positions.js?v=113','acct.js?v=113','update.js?v=113','pq.js?v=113','family.html','parents.html','badge.png','icon-192.png','prestretch.js?v=113','cd.js?v=113','home.js?v=113','shop.css?v=113'].concat(['ss-core-supporters-coat-navy','ss-core-thermal-jacket-navy','end-of-line-ss-bench-coat-navy','ss-core-softshell-jacket-navy','ss-core-padded-gilet-navy','new-ss-core-rain-jacket-navy','ss-core-softshell-gilet-navy'].map(function(s){return 'shop/img/'+s+'.webp?v=113';}));
self.addEventListener('install',function(e){e.waitUntil(caches.open(FV).then(function(c){return c.addAll(FSHELL);}).then(function(){return self.skipWaiting();}).catch(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf('tl-fam-')===0&&k!==FV;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
function put(r,res){if(res&&res.ok&&res.type==='basic'){var cp=res.clone();caches.open(FV).then(function(c){c.put(r,cp);});}return res;}
function timeout(p,ms){return new Promise(function(ok,no){var t=setTimeout(function(){no(new Error('slow'));},ms);p.then(function(x){clearTimeout(t);ok(x);},function(e){clearTimeout(t);no(e);});});}
self.addEventListener('fetch',function(e){
 var r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin)return;
 if(/version\.json$/.test(u.pathname))return;
 /* pages: network first (3 second wait), then the saved copy, so a fix still reaches everyone */
 if(r.mode==='navigate'){
  var key=new Request(u.origin+u.pathname);
  var net=fetch(r).then(function(res){return put(key,res);});
  e.respondWith(timeout(net,3000).catch(function(){return caches.match(key).then(function(hit){return hit||caches.match(r,{ignoreSearch:true})||net;}).then(function(hit){return hit||net;});}));
  return;
 }
 /* versioned files never change, so the saved copy is right */
 if(/[?&]v=\d+/.test(u.search)){
  e.respondWith(caches.match(r).then(function(hit){return hit||fetch(r).then(function(res){return put(r,res);});}));
  return;
 }
 /* other scripts: network first so a broken client can pick up the fix */
 if(/\.(js|html)$/i.test(u.pathname)){
  e.respondWith(fetch(r).then(function(res){return put(r,res);}).catch(function(){return caches.match(r,{ignoreSearch:true});}));
  return;
 }
 /* pictures and styles: show the saved copy, refresh it quietly */
 if(/\.(png|jpe?g|webp|gif|svg|css|woff2?)$/i.test(u.pathname)){
  e.respondWith(caches.match(r).then(function(hit){var f=fetch(r).then(function(res){return put(r,res);}).catch(function(){return hit;});return hit||f;}));
 }
});
self.addEventListener('push',function(e){
 e.waitUntil(fetch('https://touchline-push.wardyboy11.workers.dev/latest',{cache:'no-store'}).then(function(r){return r.json();}).catch(function(){return {title:'Wigan Junior Latics U15 Blues',body:'Open the page for the latest news.',url:'/family.html'};}).then(function(m){
  return self.registration.showNotification(m.title||'Wigan Junior Latics U15 Blues',{body:m.body||'',icon:'icon-192.png',badge:'badge.png',data:{url:m.url||'/family.html'},tag:'latics-alert',renotify:true});
 }));
});
self.addEventListener('notificationclick',function(e){
 e.notification.close();
 var u=(e.notification.data&&e.notification.data.url)||'/family.html';
 e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(l){
  for(var i=0;i<l.length;i++){if((l[i].url.indexOf('family')>-1||l[i].url.indexOf('parents')>-1)&&'focus' in l[i])return l[i].focus();}
  return self.clients.openWindow(u);
 }));
});
