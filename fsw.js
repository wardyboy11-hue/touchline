/* family service worker, r88: push alerts + offline shop images */
var FV='tl-fam-v104';
var FSHELL=['share.js?v=104','voice.js?v=104','shop.js?v=104','fitness.js?v=104','fitness.css?v=104','prestretch.js?v=104','cd.js?v=104','shop.css?v=104'].concat(['ss-core-supporters-coat-navy','ss-core-thermal-jacket-navy','end-of-line-ss-bench-coat-navy','ss-core-softshell-jacket-navy','ss-core-padded-gilet-navy','new-ss-core-rain-jacket-navy','ss-core-softshell-gilet-navy'].map(function(s){return 'shop/img/'+s+'.webp?v=104';}));
self.addEventListener('install',function(e){e.waitUntil(caches.open(FV).then(function(c){return c.addAll(FSHELL);}).then(function(){return self.skipWaiting();}).catch(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf('tl-fam-')===0&&k!==FV;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){
 var r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin)return;
 /* network first for html/js so a broken r95 client can pick up the fix without a stuck cache */
 if(r.mode==='navigate'||/\.(html|js)$/i.test(u.pathname)){
  e.respondWith(fetch(r).then(function(res){if(res&&res.ok&&/voice\.js$/.test(u.pathname)){var cp=res.clone();caches.open(FV).then(function(c){c.put(r,cp);});}return res;}).catch(function(){return caches.match(r);}));
  return;
 }
 if(/\/shop\//.test(u.pathname)||/shop\.(js|css)$/.test(u.pathname)){
  e.respondWith(caches.match(r).then(function(hit){return hit||fetch(r).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(FV).then(function(c){c.put(r,cp);});}return res;});}));
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
