"""r115: record the lines in tools/voice/lines.json for each lads' voice and write audio/vox/<voice>/.
Each clip is <hash>.mp3 where hash is djb2 of the fixed text (same as tl-vox.js), and m.json lists them.
Recordings are cached in tools/voice/.tts. With ELEVENLABS_API_KEY set, missing lines are recorded.
Without the key, missing lines are written to tools/voice/missing_<voice>.json so they can be recorded
another way (the connector) and dropped in the cache as <voiceid>_<hash>.mp3.
Lines never contain a player's name. Deano is always said Deeno.
usage: python3 tools/voice/build.py alice [north]"""
import json,os,sys,re,hashlib,subprocess,urllib.request
R=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VOICES={'alice':'Xb7hH8MSUJpSbSDYk0k2',  # Alice, British female (already used for stretching)
        'north':os.environ.get('NORTH_VOICE','')}  # Northern lad, set once Tim picks
MODEL='eleven_multilingual_v2'
CACHE=os.path.join(R,'tools/voice/.tts');os.makedirs(CACHE,exist_ok=True)
def fix(t): return re.sub(r'\s+',' ',re.sub(r'\bDeano\b','Deeno',str(t),flags=re.I)).strip()
def djb2(t):
    h=5381
    for ch in fix(t): h=((h<<5)+h+ord(ch))&0xffffffff
    return '%08x'%h
def rec(vid,text,f):
    key=os.environ.get('ELEVENLABS_API_KEY')
    if not key: return False
    body=json.dumps(dict(text=fix(text),model_id=MODEL,voice_settings=dict(stability=0.5,similarity_boost=0.8,style=0.15,use_speaker_boost=True))).encode()
    rq=urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_64',data=body,
        headers={'xi-api-key':key,'content-type':'application/json','accept':'audio/mpeg'})
    open(f,'wb').write(urllib.request.urlopen(rq,timeout=120).read());return True
def main(vs):
    L=json.load(open(os.path.join(R,'tools/voice/lines.json')))['running']
    assert len(set(djb2(t) for t in L))==len(L),'hash clash'
    for v in vs:
        vid=VOICES[v]
        if not vid: print('no voice id for',v);continue
        od=os.path.join(R,'audio/vox',v);os.makedirs(od,exist_ok=True)
        man={};miss=[]
        for t in L:
            h=djb2(t);c=os.path.join(CACHE,vid+'_'+h+'.mp3')
            if not os.path.exists(c) and not rec(vid,t,c): miss.append({'hash':h,'text':fix(t),'file':os.path.relpath(c,R)});continue
            o=os.path.join(od,h+'.mp3')
            # trim leading and trailing silence and keep files small for phones
            subprocess.run(['ffmpeg','-y','-loglevel','error','-i',c,'-af','silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse','-ac','1','-b:a','48k',o],check=True)
            man[h]=hashlib.sha1(open(o,'rb').read()).hexdigest()[:6]
        json.dump(man,open(os.path.join(od,'m.json'),'w'),separators=(',',':'))
        mf=os.path.join(R,'tools/voice','missing_'+v+'.json')
        if miss: json.dump(miss,open(mf,'w'),indent=1)
        elif os.path.exists(mf): os.remove(mf)
        print(v,vid,'clips',len(man),'missing',len(miss))
if __name__=='__main__': main(sys.argv[1:] or ['alice'])
