"""Build coach/anim/<slug>.html + pre-recorded voice (ElevenLabs, same voice as shape/audio).
Usage: python3 tools/anim/build.py [slug ...]   (needs ELEVENLABS_API_KEY only for new or changed lines)"""
import sys,json,os,glob,hashlib,html,urllib.request,subprocess
R=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VOICE=os.environ.get('VO_VOICE','1zZSINK3SPk5qpVKuo3e');MODEL='eleven_multilingual_v2'
CACHE=os.path.join(R,'tools/anim/.tts');os.makedirs(CACHE,exist_ok=True)
def tts(text):
    h=hashlib.sha1((VOICE+MODEL+text).encode()).hexdigest()[:16];f=os.path.join(CACHE,h+'.mp3')
    if not os.path.exists(f):
        rq=urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128',
          data=json.dumps(dict(text=text,model_id=MODEL,voice_settings=dict(stability=0.5,similarity_boost=0.8,style=0.15,use_speaker_boost=True))).encode(),
          headers={'xi-api-key':os.environ['ELEVENLABS_API_KEY'],'content-type':'application/json','accept':'audio/mpeg'})
        open(f+'.tmp','wb').write(urllib.request.urlopen(rq,timeout=120).read());os.rename(f+'.tmp',f)
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
want=sys.argv[1:]
for s in sorted(glob.glob(os.path.join(R,'tools/anim/specs/*.json'))):
    if not want or any(w in s for w in want):build(s)
