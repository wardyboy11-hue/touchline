import json,html,base64
from playwright.sync_api import sync_playwright
R='/workspace/touchline';S=json.load(open(R+'/tools/anim/sessions/w1_shape_to_receive_session.json'))
B='http://localhost:8794/coach/anim/w1_shape_to_receive_session.html?render'
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1280,'height':900});pg.goto(B);pg.wait_for_timeout(800)
    phs=pg.evaluate('PHS');imgs=[]
    for t0,intro,L in phs:
        pg.evaluate(f'setT({t0+intro+0.02})');pg.wait_for_timeout(150)
        imgs.append(base64.b64encode(pg.locator('#stage').screenshot()).decode())
    data=pg.evaluate('SESSION')
    e=html.escape;ul=lambda a:'<ul>'+''.join('<li>'+e(x)+'</li>' for x in a)+'</ul>'
    body=f'''<h1>{e(S["title"])}</h1><p class=m>{e(S["week"])}, Wednesday 4 November 2026. Theme: {e(S["theme"])}. Cue: “{e(S["cue"])}”</p>
<p><b>For parents and players:</b> {e(S["parents"])} Players are shown by shirt number. Blue is us, red is the opposition.</p>'''
    for i,P in enumerate(data['phases']):
        body+=f'''<section><h2>{e(P.get("phase",""))}: {e(P["title"])}</h2><p class=m>{e(P["format"])}, {e(P["area"])}. {e(P.get("kit",""))}</p>
<img src="data:image/png;base64,{imgs[i]}"><div class=g><div><h3>Set up</h3>{ul(P["setup"])}<h3>Rules</h3>{ul(P["rules"])}<h3>How it starts</h3>{ul([P["start"]]+P["restart"])}</div>
<div><h3>What happens</h3><ol>{"".join("<li>"+e(s["say"])+"</li>" for s in P["steps"])}</ol><h3>Coaching points</h3>{ul(P["points"])}<h3>Make it harder</h3>{ul(P["progress"])}</div></div></section>'''
    doc=f'''<html><head><meta charset=utf-8><style>body{{font:12px/1.4 Arial,sans-serif;color:#0b1330;margin:0}}h1{{font-size:22px;margin:0 0 4px}}h2{{font-size:17px;border-bottom:3px solid #ffb81c;padding-bottom:3px}}h3{{font-size:12px;margin:8px 0 2px;text-transform:uppercase;color:#1e3a8a}}.m{{color:#555}}section{{page-break-before:always}}section:first-of-type{{page-break-before:auto}}img{{max-width:100%;max-height:330px;display:block;margin:6px auto}}.g{{display:grid;grid-template-columns:1fr 1fr;gap:16px}}ul,ol{{margin:2px 0;padding-left:18px}}</style></head><body>{body}<p class=m style="margin-top:14px">Watch the animated session with voice over in the Touchline family app. Wigan Junior Latics.</p></body></html>'''
    pg2=b.new_page();pg2.set_content(doc);pg2.pdf(path=R+'/plans/w1_shape_to_receive_session.pdf',format='A4',margin={'top':'14mm','bottom':'14mm','left':'12mm','right':'12mm'},print_background=True)
    print(phs)
