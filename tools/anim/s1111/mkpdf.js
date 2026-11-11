/* Session plan PDF for Training 11/11. Serve the repo on 127.0.0.1:8811 first.
   NODE_PATH must reach puppeteer-core. Writes plans/Block3_W2_session_v2_11Nov2026.pdf */
const puppeteer=require('puppeteer-core');const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'../../..');const PARTS=require('./specs.js');const plan=require('./plan.js');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ul=a=>'<ul>'+(a||[]).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
const SHOTS={warmup:[1,'angle'],rondo:[2,'top'],defence:[2,'angle'],attack:[1,'behind'],game:[1,'top'],cooldown:[0,'behind']};
(async()=>{
  const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const pg=await b.newPage();await pg.setViewport({width:1100,height:900});
  await pg.goto('http://127.0.0.1:8811/coach/anim/s1111_training.html',{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('window.__ready===true');
  await pg.addStyleTag({content:'#cams{display:none!important}#stageWrap{height:520px!important}'});
  await pg.evaluate(()=>window.dispatchEvent(new Event('resize')));
  const img={};
  for(let i=0;i<PARTS.length;i++){const P=PARTS[i],s=SHOTS[P.id];
    await pg.evaluate((i,si,cn)=>window.__s3d.pose(i,si,cn),i,s[0],s[1]);await new Promise(r=>setTimeout(r,600));
    img[P.id]=(await (await pg.$('#stageWrap')).screenshot({type:'jpeg',quality:80})).toString('base64');}
  const rows=plan.rows.map(r=>`<tr><td class=t>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('');
  let body=`<div class=hd><div><h1>Training 11/11: recover, play out, wing backs and three runners</h1><p class=m>${esc(plan.sub)}</p></div><div class=bd>WJL U15 Blues<br>3-5-2</div></div>
  <h2>Running order (60 minutes)</h2><table>${rows}</table>
  <h2>Groups and the wing back swap</h2>${ul(plan.groups)}
  <h2>Numbers on the night</h2>${ul(['Rondo: one rondo of 5v2 up to 11 players, two rondos from 12 (5v2 and 4v2).','Defence (Tim): four centre backs means one attacker plus the coach; six means rotate two in and out.','Attack (Deano): 4v1 plus keeper with 12 or fewer, 5v2 as drawn with 14, 6v3 with 16.','Game: 6v6 with 12, add a yellow floater for 13 or 15, 7v7 with 14, 8v8 with 16, 5v5 with 10 or 11.','Only one keeper: he stays on Deano\'s pitch and in the big goal for the game. No keeper at all: shrink the big goal to two cones three metres apart and finish below knee height.'])}
  <h2>Kit</h2><p>Balls (one each plus spares), blue, red, orange and one yellow bib, flat cones and tall cones, 1 full size goal, 2 mini goals for Tim, 1 mini goal for Deano (3 mini goals in total, 2 again for the game), 1 mannequin, 2 poles.</p>
  <p class=m>On the diagrams: blue is us, red is the opposition, orange is the attack unit in bibs, green is the keeper, amber is the coach. Watch every part with voice over in the Touchline app: Training 11/11. Tap Just my position to see what you do.</p>`;
  PARTS.forEach(P=>{
    body+=`<section><h2>${esc(P.when)} min: ${esc(P.name)}</h2><p class=m>${esc(P.coach)} | ${esc(P.area)} | ${esc(P.numbers)}</p>
    <img src="data:image/jpeg;base64,${img[P.id]}"><div class=g><div>${P.setup?'<h3>Set up</h3>'+ul(P.setup):''}${P.points?'<h3>Coaching points</h3>'+ul(P.points):''}${P.harder?'<h3>Harder and easier</h3>'+ul(P.harder):''}</div>
    <div><h3>How it runs, step by step</h3><ol>${P.steps.map(s=>'<li><b>'+esc(s.title)+'.</b> '+esc(s.text)+'</li>').join('')}</ol>${P.variants?'<h3>Numbers on the night</h3>'+ul(P.variants):''}</div></div></section>`;
  });
  const doc=`<html><head><meta charset=utf-8><style>body{font:10.5px/1.4 Arial,sans-serif;color:#0b1330;margin:0}.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #ffb81c;padding-bottom:6px}.bd{background:#0b1b2e;color:#ffb81c;font-weight:700;padding:6px 10px;border-radius:8px;text-align:right}
  h1{font-size:20px;margin:0 0 3px}h2{font-size:15px;border-bottom:2px solid #ffb81c;padding-bottom:2px;margin:12px 0 5px}h3{font-size:11px;margin:7px 0 2px;text-transform:uppercase;color:#1e3a8a}.m{color:#555;margin:2px 0}
  table{border-collapse:collapse;width:100%}td{padding:3px 6px;border-bottom:1px solid #ddd;vertical-align:top}td.t{white-space:nowrap;font-weight:700;width:70px}
  section{page-break-before:always}img{max-width:100%;max-height:260px;width:auto;border-radius:8px;display:block;margin:5px auto}.g{display:grid;grid-template-columns:1fr 1.25fr;gap:14px}ul,ol{margin:2px 0;padding-left:16px}li{margin-bottom:2px}</style></head><body>${body}</body></html>`;
  const p2=await b.newPage();await p2.setContent(doc,{waitUntil:'load'});
  fs.mkdirSync(path.join(R,'plans'),{recursive:true});
  await p2.pdf({path:path.join(R,'plans',plan.pdf),format:'A4',printBackground:true,margin:{top:'12mm',bottom:'14mm',left:'11mm',right:'11mm'},displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font-size:8px;color:#777;width:100%;padding:0 11mm;display:flex;justify-content:space-between"><span>Wigan Junior Latics U15 Blues | Training 11/11 | Coaches and squad only, not for the club website</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>'});
  await b.close();console.log('pdf done');
})();
