"""r115: write stretch/ssw.js. Precache the page, Alice audio, lad pictures and clips.
The Northern voice (audio/north) and the plain figure (fig/) are cached when first used, so a phone
only stores the voice and demo the lad picked. usage: python3 tools/stretch/ssw.py 115"""
import os,sys,json
R=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))));S=os.path.join(R,'stretch')
v=sys.argv[1]
F=['./','index.html','app.js?v='+v,'data.js?v='+v,'../tl-vox.js?v='+v,'../badge.webp','../badge.png','../icon-192.png']
for d in ['img','audio','vid']:
    for f in sorted(os.listdir(os.path.join(S,d))):
        if os.path.isfile(os.path.join(S,d,f)): F.append(d+'/'+f+'?v='+v)
src=open(os.path.join(S,'ssw.js')).read().split('\n')
src[0]='/* Touchline stretch service worker r%s (written by tools/stretch/ssw.py) */'%v
src[1]="var V='touchline-stretch-v%s',F=%s;"%(v,json.dumps(F))
open(os.path.join(S,'ssw.js'),'w').write('\n'.join(src))
print(len(F),'files')
