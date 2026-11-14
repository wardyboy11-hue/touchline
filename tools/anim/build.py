"""Build coach/anim/<slug>.html + pre-recorded voice (ElevenLabs, same voice as shape/audio).
Usage: python3 tools/anim/build.py [slug ...]   (needs ELEVENLABS_API_KEY only for new or changed lines)"""
import sys,json,os,glob,hashlib,html,urllib.request,subprocess,re
R=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VOICE=os.environ.get('VO_VOICE','1zZSINK3SPk5qpVKuo3e');MODEL='eleven_multilingual_v2'
CACHE=os.path.join(R,'tools/anim/.tts');os.makedirs(CACHE,exist_ok=True)
def tts(text):
    text=re.sub(r'\bDeano\b','Deeno',text)  # r113: Deano is said Deeno
    h=hashlib.sha1((VOICE+MODEL+text).encode()).hexdigest()[:16];f=os.path.join(CACHE,h+'.mp3')
    if not os.path.exists(f):
        rq=urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128',
          data=json.dumps(dict(text=text,model_id=MODEL,voice_settings=dict(stability=0.5,similarity_boost=0.8,style=0.15,use_speaker_boost=True))).encode(),
          headers={'xi-api-key':os.environ['ELEVENLABS_API_KEY'],'content-type':'application/json','accept':'audio/mpeg'})
        for n in range(4):
            try:open(f+'.tmp','wb').write(urllib.request.urlopen(rq,timeout=120).read());break
            except Exception as e:
                if n==3:raise
                import time;time.sleep(3+n*4)
        os.rename(f+'.tmp',f)
    return f
dur=lambda f: float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]))
HEAD=open(os.path.join(R,'tools/anim/head.html')).read();FOOT=open(os.path.join(R,'tools/anim/foot.html')).read()
def ul(a):return '<ul>'+''.join('<li>'+html.escape(x)+'</li>' for x in a)+'</ul>'
def build(spec):
    P=json.load(open(spec));slug=P['slug']
    lines=[P.get('intro_vo') or f"{P['title']}. {P['theme']}."]+[s.get('vo') or s['say'] for s in P['steps']]
    od=os.path.join(R,'coach/anim/audio',slug);os.makedirs(od,exist_ok=True)
    for f in glob.glob(od+'/*.mp3'):os.remove(f)
    ad=[]
    for i,t in enumerate(lines):
        c=tts(t);o=os.path.join(od,f'{i}.mp3');open(o,'wb').write(open(c,'rb').read());ad.append(round(dur(o),2))
    P['audio']=ad
    txt=('<div class="txt">'+(('<h2>For parents: what to look for</h2><p>'+html.escape(P['parents'])+'</p>') if P.get('parents') else '')+
      '<div class="grid"><div><h2>Set up</h2>'+ul(P['setup'])+'<h2>Rules</h2>'+ul(P['rules'])+'<h2>How it starts and restarts</h2><ul><li>'+html.escape(P['start'])+'</li>'+''.join('<li>'+html.escape(x)+'</li>' for x in P['restart'])+'</ul></div>'
      '<div><h2>Coaching points</h2>'+ul(P['points'])+'<h2>Progressions</h2>'+ul(P['progress'])+'</div></div></div>')
    out=HEAD.replace('{{TITLE}}',html.escape(P['title']))+txt+'</div>\n<script>window.PRACTICE='+json.dumps(P,ensure_ascii=False)+';</script><script src="engine.js?v={{V}}"></script>'+FOOT
    out=out.replace('{{V}}',open(os.path.join(R,'version.json')).read().split('"v":"')[1].split('"')[0])
    open(os.path.join(R,'coach/anim',slug+'.html'),'w').write(out);print(slug,ad)
def phase_html(P,h=3):
    return ('<h%d>'%h+html.escape((P.get('phase','')+': ' if P.get('phase') else '')+P['title'])+'</h%d>'%h+
      '<p class="m">'+html.escape(P['format']+', '+P['area'])+'</p><div class="grid"><div><h2>Set up</h2>'+ul(P['setup'])+'<h2>Rules</h2>'+ul(P['rules'])+'<h2>How it starts</h2>'+ul([P['start']]+P['restart'])+'</div>'
      '<div><h2>Coaching points</h2>'+ul(P['points'])+'<h2>Make it harder</h2>'+ul(P['progress'])+'</div></div>')
def build_session(spec):
    S=json.load(open(spec));slug=S['slug'];od=os.path.join(R,'coach/anim/audio',slug);os.makedirs(od,exist_ok=True)
    for f in glob.glob(od+'/*.mp3'):os.remove(f)
    ph=[]
    for i,P in enumerate(S['phases']):
        if 'ref' in P:
            B=json.load(open(os.path.join(R,'tools/anim/specs',P['ref']+'.json')))
            for k,v in P.items():
                if k!='ref':B[k]=v
            B.pop('parents',None);P=B
        lines=[P.get('intro_vo') or f"{P['title']}. {P['theme']}."]+[s.get('vo') or s['say'] for s in P['steps']]
        ad=[]
        for k,t in enumerate(lines):
            c=tts(t);o=os.path.join(od,f'p{i}_{k}.mp3');open(o,'wb').write(open(c,'rb').read());ad.append(round(dur(o),2))
        P['audio']=ad;P['abase']='audio/'+slug+'/';P['apre']=f'p{i}_';ph.append(P)
    S['phases']=ph
    v=open(os.path.join(R,'version.json')).read().split('"v":"')[1].split('"')[0]
    pdf=S.get('pdf')
    txt=('<div class="txt"><h2>For parents and players: what to look for</h2><p>'+html.escape(S['parents'])+'</p>'+
      ('<p><a class="pdf" href="'+html.escape(pdf)+'?v='+v+'">Open the session plan (PDF)</a></p>' if pdf else '')+
      ''.join(phase_html(P) for P in ph)+'</div>')
    out=HEAD.replace('{{TITLE}}',html.escape(S['title']))+txt+'</div>\n<script>window.SESSION='+json.dumps(S,ensure_ascii=False)+';</script><script src="engine.js?v={{V}}"></script>'+FOOT
    out=out.replace('{{V}}',v)
    open(os.path.join(R,'coach/anim',slug+'.html'),'w').write(out);print(slug,[p['audio'] for p in ph],'total',round(sum(sum(p['audio']) for p in ph)),'s voice')
want=sys.argv[1:]
for s in sorted(glob.glob(os.path.join(R,'tools/anim/sessions/*.json'))):
    if not want or any(w in s for w in want):build_session(s)
for s in sorted(glob.glob(os.path.join(R,'tools/anim/specs/*.json'))):
    if not want or any(w in s for w in want):build(s)
