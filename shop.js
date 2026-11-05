/* Touchline club shop (r88). Shared by the coach More page and the family kit page.
   Product links open Serious Sport / Empire Kits in a new tab. Sample images only. */
(function(G){
 var BASE='https://www.serioussport.co.uk/teamstores/wigan-junior-latics-u15-blues';
 var COATS=[
  ['ss-core-supporters-coat-navy','Core+ Supporters Coat','£89.99','','Sizes LY to 3XL. Crest and initials available.'],
  ['ss-core-thermal-jacket-navy','Core+ Thermal Jacket','£64.99','','Sizes SY to 3XL.'],
  ['end-of-line-ss-bench-coat-navy','Bench Coat (end of line)','£48.99','£69.99','Sale price while stocks last.'],
  ['ss-core-softshell-jacket-navy','Core+ Softshell Jacket','£49.99','','Ladies and mens sizes.'],
  ['ss-core-padded-gilet-navy','Core+ Padded Gilet','£49.99','',''],
  ['new-ss-core-rain-jacket-navy','Core+ Rain Jacket','£42.99','','Sizes Y3XS to 5XL.'],
  ['ss-core-softshell-gilet-navy','Core+ Softshell Gilet','£29.99','','']
 ];
 var HATS=[
  ['ss-beanie-navy','Beanie, Navy','£11.99'],
  ['ss-beanie-yellow','Beanie, Yellow','£11.99'],
  ['ss-bobble-hat-navy','Bobble Hat','£14.99'],
  ['bucket-hat-navy','Bucket Hat','£19.99']
 ];
 var OTHER=[
  ['ss-core-training-hoodie-navy-yellow','Training Hoodie','£39.99'],
  ['ss-core-leisure-hoodie-grey-white','Leisure Hoodie, Grey/White','£34.99'],
  ['ss-core-leisure-hoodie-navy-yellow','Leisure Hoodie, Navy/Yellow','£34.99'],
  ['ss-core-midlayer-navy-yellow','Midlayer','£34.99'],
  ['ss-core-sweatshirt-navy-yellow','Sweatshirt','£34.99'],
  ['ss-core-tracksuit-top-navy-yellow','Tracksuit Top','£34.99'],
  ['ss-core-polo-shirt-navy','Polo','£26.99'],
  ['ss-baselayer-top-navy','Baselayer','£25.99'],
  ['players-bag-medium-navy','Players Bag','£24.99'],
  ['ss-core-training-pant-navy','Training Pant','£29.99'],
  ['ss-core-tracksuit-bottoms-navy','Tracksuit Bottoms','£29.99'],
  ['ss-core-training-shorts-navy','Training Shorts','£19.99'],
  ['ss-core-training-shirt-navy-yellow','Training Shirt','£19.99'],
  ['ss-core-training-shirt-womens-navy-yellow','Womens Training Shirt','£19.99'],
  ['backpack-navy','Backpack','£19.99'],
  ['ss-players-shorts-navy','Players Shorts','£9.99'],
  ['ss-crew-sock-white','Crew Sock, White','£5.99'],
  ['ss-socks-royal-blue','Socks, Royal Blue','£4.99']
 ];
 var EMPIRE={name:'Blues Winter Jacket',price:'£35',url:'https://empirekits.co.uk/products/wigan-junior-latics-blues-winter-jacket'};
 var EMPIRE_COL='https://empirekits.co.uk/collections/wigan-junior-latics-blues';
 function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
 function url(slug){return BASE+'/product/'+slug;}
 function img(root,slug){return root+'shop/img/'+slug+'.webp?v=88';}
 function card(root,p,big){
  var slug=p[0],name=p[1],price=p[2],was=p[3]||'',note=p[4]||'';
  return '<a class="tl-shop-card'+(big?' tl-shop-big':'')+'" href="'+esc(url(slug))+'" target="_blank" rel="noopener">'+
   '<img src="'+esc(img(root,slug))+'" alt="'+esc(name)+'" width="600" height="600" loading="lazy">'+
   '<span class="tl-shop-meta"><b>'+esc(name)+'</b>'+
   '<span class="tl-shop-price">'+esc(price)+(was?' <s class="tl-shop-was">'+esc(was)+'</s>':'')+'</span>'+
   (note?'<span class="tl-shop-note">'+esc(note)+'</span>':'')+
   '</span></a>';
 }
 function html(opts){
  opts=opts||{};
  var root=opts.root||'';
  var back=opts.back||'';
  var h='';
  h+='<div class="tl-shop">';
  h+='<div class="tl-shop-pitch card"><h2 style="margin-top:0">Stay warm on the touchline</h2>'+
   '<p>Sunday mornings get cold. A proper coat with the club crest keeps you warm and dry, and people can see who you are with. Stand together as Blues.</p>'+
   '<p class="small muted">Navy kit items from the Serious Sport team store. Crest and initials available on most coats. Prices checked 05/11/2026. Check the shop for current prices. Pictures are sample visuals from the shop.</p>'+
   '<a class="btn pri block" href="'+esc(BASE)+'" target="_blank" rel="noopener">Open the full Serious Sport shop</a></div>';
  h+='<h3 class="tl-mh">Winter coats</h3><p class="small muted">Swipe sideways. Tap a coat to open it on Serious Sport.</p>';
  h+='<div class="tl-shop-rail" role="list">'+COATS.map(function(p){return '<div role="listitem">'+card(root,p,true)+'</div>';}).join('')+'</div>';
  h+='<h3 class="tl-mh">Hats</h3><div class="tl-shop-grid">'+HATS.map(function(p){return card(root,p,false);}).join('')+'</div>';
  h+='<h3 class="tl-mh">Training and leisure</h3><div class="tl-shop-grid tl-shop-compact">'+OTHER.map(function(p){return card(root,p,false);}).join('')+'</div>';
  h+='<h3 class="tl-mh">Players\' kit</h3><div class="card tl-shop-empire"><h3 style="margin-top:0">Empire Kits</h3>'+
   '<p>Playing kit and the Blues Winter Jacket are from Empire Kits, sponsored by MFS Limited.</p>'+
   '<a class="btn pri block" href="'+esc(EMPIRE.url)+'" target="_blank" rel="noopener">'+esc(EMPIRE.name)+' · '+esc(EMPIRE.price)+'</a>'+
   '<a class="btn block" style="margin-top:8px" href="'+esc(EMPIRE_COL)+'" target="_blank" rel="noopener">Open the Empire Kits club shop</a></div>';
  if(opts.kits){
   h+='<h3 class="tl-mh">Our kit</h3><div class="tl-shop-grid">'+opts.kits.map(function(x){
    return '<div class="tl-shop-card"><img src="'+esc(root+'kit-'+x[0]+'.jpg')+'" alt="'+esc(x[1])+'" loading="lazy"><span class="tl-shop-meta"><b>'+esc(x[1])+'</b></span></div>';
   }).join('')+'</div>';
  }
  if(back)h+='<button class="btn block" style="margin-top:12px" type="button" data-act="shopBack">'+esc(back)+'</button>';
  h+='</div>';
  return h;
 }
 function urls(root){
  root=root||'';
  var u=[];
  COATS.concat(HATS).concat(OTHER).forEach(function(p){u.push(img(root,p[0]));});
  return u;
 }
 G.TLShop={html:html,urls:urls,COATS:COATS,HATS:HATS,OTHER:OTHER,BASE:BASE,EMPIRE:EMPIRE};
})(typeof window!=='undefined'?window:this);
