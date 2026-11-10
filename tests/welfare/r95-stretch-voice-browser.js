/* r95: stretch timeline + family three-dots + voice parser smoke. SHOTS=/workspace/shots */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8798,SHOTS=process.env.SHOTS||'/workspace/shots';
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.webmanifest':'application/json','.jpg':'image/jpeg'};
const srv=http.createServer((q,r)=>{let u=q.url.split('?')[0],f=path.join(root,decodeURIComponent(u));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const w=ms=>new Promise(r=>setTimeout(r,ms));
const shot=async(p,n)=>{fs.mkdirSync(SHOTS,{recursive:true});await p.screenshot({path:path.join(SHOTS,n),fullPage:true});};
(async()=>{
 const b=await chromium.launch();
 const ph=devices['Pixel 7'];
 const ctx=await b.newContext({...ph});const q=await ctx.newPage();
 q.on('pageerror',e=>console.log('PAGEERR',e.message));
 await q.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true,data:{first:'Sam',role:'player',num:'7',mine:{},posts:[{id:'t1',type:'train',title:'Pressing',date:'2026-11-05',time:'20:00',why:'Win it back'}],x:{fixtures:[{id:'g1',opp:'Demo FC',date:'2026-11-07',ko:'15:00',ha:'H',venue:'Christopher Park'}]},tips:'',vote:{}}})}));
 await q.addInitScript(()=>{localStorage.setItem('fam.pushAsk','9999999999999');localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.p','1');});
 await q.goto('http://localhost:'+PORT+'/family.html');await w(2500);
 await q.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
 const moreBtn=await q.$('button[aria-label="More"]');
 T('family three-dots More button',!!moreBtn);
 if(moreBtn){await moreBtn.click();await w(400);await shot(q,'r95_family_more.png');T('more sheet open',!!(await q.$('.tl-fmore')));await q.evaluate(()=>{try{closeMore();}catch(e){}}).catch(()=>{});}
 const mic=await q.$('button[aria-label="Voice helper"]');
 T('voice helper button',!!mic);
 const voiceOk=await q.evaluate(()=>!!(window.TLVoice&&TLVoice.parseIntent('show fixtures',{fixtures:[]}).intent==='fixtures'));
 T('TLVoice parser loaded',voiceOk);
 await shot(q,'r95_family_home.png');

 // Stretch player
 await q.goto('http://localhost:'+PORT+'/stretch/index.html?v=95');await w(1500);
 const total=await q.evaluate(()=>window.__total);
 const hold=await q.evaluate(()=>window.__holdMin);
 const rest=await q.evaluate(()=>window.__rest);
 const seg=await q.evaluate(()=>window.__seg.map(s=>s.k));
 T('stretch total > 0',total>60);
 T('hold min 15',hold===15);
 T('rest 15',rest===15);
 T('has rest segments',seg.includes('rest')&&seg.includes('hold')&&seg.includes('intro'));
 // jump into a hold and a rest for screenshots
 await q.evaluate(()=>{window.__silent=1;document.getElementById('start').click();});
 await w(800);
 await q.evaluate(()=>{const s=window.__seg.find(x=>x.k==='hold');window.__at(s.t0+1);});
 await w(300);await shot(q,'r95_stretch_hold.png');
 await q.evaluate(()=>{const s=window.__seg.find(x=>x.k==='rest');if(s)window.__at(s.t0+2);});
 await w(300);await shot(q,'r95_stretch_rest.png');
 await q.evaluate(()=>{const s=window.__seg.find(x=>x.k==='intro');window.__at(s.t0+1);document.getElementById('fig').click();});
 await w(400);await shot(q,'r95_stretch_howto.png');
 T('howto panel',!(await q.$('#howto[hidden]')));

 // Pre-game mode lengths
 await q.goto('http://localhost:'+PORT+'/stretch/index.html?mode=pregame&v=95');await w(1200);
 const pre=await q.evaluate(()=>({total:window.__total,n:window.__seg.filter(s=>s.k==='hold').length,holds:window.__seg.filter(s=>s.k==='hold').every(s=>s.d>=15),rests:window.__seg.filter(s=>s.k==='rest').every(s=>s.d===15)}));
 T('pregame shorter',pre.total<600&&pre.n<=4);
 T('pregame holds/rests',pre.holds&&(pre.n<=1||pre.rests));
 await shot(q,'r95_stretch_pregame.png');

 console.log(ok+' passed, '+bad+' failed');
 await b.close();srv.close();process.exit(bad?1:0);
})();
