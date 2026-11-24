# r116: wires Game off? into coach/app.js. Run once from the repo root.
f='coach/app.js';s=open(f).read()
add=open('tools/r116/ppday.js').read()
def rep(old,new):
    global s
    assert old in s, old[:80]
    s=s.replace(old,new,1)
anchor="document.addEventListener('change',function(e){if(e.target&&e.target.id==='fc_pp'&&view.fc){fcForm();view.fc.rows=null;render(true);}});\n"
rep(anchor,anchor+add)
rep("function famPush(body,url){return fetch(PUSHW,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({code:CODE,title:'Wigan Junior Latics U15 Blues',body:String(body).trim().slice(0,180),url:url||'/family.html'})})",
    "function famPush(body,url,o){var ur=!!(o&&o.urgent);return fetch(PUSHW,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({code:CODE,title:(ur?'URGENT: ':'')+'Wigan Junior Latics U15 Blues',body:String(body).trim().slice(0,180),url:url||'/family.html',urgent:ur?1:0})})")
rep("body=m.status==='plan'?vPlan(m):(m.status==='done'?vDone(m):vLive(m));}","body=ppdTop(m)+(m.status==='plan'?vPlan(m):(m.status==='done'?vDone(m):vLive(m)));}")
rep(" var h=intro('Plan matches, run them live with the clock and subs, and add results. Tap a match to open it.')+"," var h=ppdTop(ppdMatch())+intro('Plan matches, run them live with the clock and subs, and add results. Tap a match to open it.')+")
rep(" if(nm&&nm.date===td){mdPrefetch(nm);hero+=spine(nm)+mdCard(nm);}"," var ppm=ppdMatch();if(ppm&&ppm.pp)hero+=ppdTop(ppm);\n if(nm&&nm.date===td&&!nm.pp){mdPrefetch(nm);hero+=spine(nm)+mdCard(nm);}")
rep(" if(!(nm&&nm.date===td)){hero+=trainHero(td,ts,ps);if(nm)hero+=matchHero(nm);}"," if(ppm&&!ppm.pp)hero+=ppdTop(ppm);\n if(!(nm&&nm.date===td)){hero+=trainHero(td,ts,ps);if(nm)hero+=matchHero(nm);}")
rep("window.tlHold=function(){try{","window.tlHold=function(){try{if(view.ppd)return 'sheet';")
open(f,'w').write(s)
print('patched')
