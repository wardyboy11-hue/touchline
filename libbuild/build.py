import json,re,sys
TH={ # keyword -> theme
 'build':'build-up','playing out':'playing out','play out':'playing out','building':'build-up','press':'pressing','counter':'counter-attack','transition':'transition',
 'low block':'low block','mid-block':'mid block','mid block':'mid block','high block':'high press','defend':'defending','box':'defending the box','overload':'overloads',
 'wide':'wide play','width':'wide play','wing-back':'wing-backs','wing back':'wing-backs','full-back':'full-backs','cross':'crossing','finish':'finishing',
 'possession':'possession','rondo':'possession','third man':'third man','between the lines':'between the lines','break':'breaking lines','line':'breaking lines',
 'midfield':'midfield','combination':'combinations','switch':'switching play','1v1':'1v1','turn':'turning','dribbl':'dribbling','goalkeep':'goalkeeping','gk':'goalkeeping',
 'set piece':'set pieces','corner':'set pieces','free kick':'set pieces','throw':'set pieces','recovery run':'recovery runs','compact':'compactness','create':'creating chances','chance':'creating chances','attack':'attacking','shape':'shape','rotation':'rotations','striker':'strikers','front two':'front two','front 2':'front two','pass':'passing','receiv':'receiving','marker':'marking','marking':'marking','support':'support play','progress':'progression','direct':'direct play','strength':'physical','conditioning':'physical','behind':'in behind','runs':'runs','forward':'playing forward','technical':'technique','awareness':'defensive awareness','final-third':'final third','final third':'final third','centre-back':'centre-backs','winger':'wingers','striker':'strikers','unit':'units','possess':'possession','control':'first touch','touch':'first touch','scor':'finishing','shoot':'finishing','goal':'finishing','tackl':'defending','intercept':'defending','space':'space','stay on the ball':'ball retention','warm':'warm-up','overlap':'overlaps','defensive':'defending','organisation':'shape','principles':'principles','false 9':'false 9','role':'player roles','style':'playing style'}
MOM={'in possession':['build','playing out','play out','possession','attack','creat','overload','combination','finish','cross','break','third man','between the lines','rotation','switch'],
 'out of possession':['defend','press','block','compact','box','recovery'],
 'transition':['counter','transition','regain','win it','lose','losing','delay'],'set pieces':['set piece','corner','free kick','throw']}
SYS=['3-5-2','3-4-3','4-3-3','4-4-2','4-2-3-1','5-3-2','3-4-2-1','5-2-3']
def tag(text,age=None,extra=None):
  t=text.lower(); th=sorted({v for k,v in TH.items() if k in t}); mo=sorted({m for m,ks in MOM.items() if any(k in t for k in ks)})
  sy=sorted({s for s in SYS if s in t.replace('–','-')}); 
  if 'back three' in t or 'back 3' in t: sy=sorted(set(sy)|{'back three'})
  pl=sorted(set(re.findall(r'\b\d{1,2}v\d{1,2}\b',t)))
  ag=[age] if age else sorted(set(re.findall(r'\bu\d{1,2}(?:\s*-\s*u\d{1,2})?\b',t)))
  ag=[a.upper().replace(' ','') for a in ag]
  d={'moment':mo,'theme':th,'age':ag,'players':pl,'system':sy}
  return d
out=[]
def add(id,title,url,typ,src,tags,**k):
  out.append(dict(id=id,title=title,url=url,type=typ,src=src,tags=tags,**k))
# 1 Coaches' Voice session plans (U12-U16, U17, U16-U17, U14-U15, U12-U13 etc kept: all 12+)
inv=json.load(open('/workspace/cv/drive_inventory.json'))['items']; seen=set()
keep=lambda a: a and (a.startswith('U1') and a not in ('U10','U10-U11') or a=='U17+')
for x in inv:
  a=x.get('age_group') or ''
  if not keep(a) or x.get('duplicate_copy'): continue
  if x['session_key'] in seen: continue
  seen.add(x['session_key'])
  title=re.sub(r'\.pdf$','',x['name']); 
  add('cv-'+x['id'],title,x['link'].split('?')[0],'pdf','coachesvoice',tag(title+' '+(x.get('topic') or ''),a),private=True,coach=x.get('coach'))
# 2 Masterclasses
for line in open('/workspace/cv/mc_index.md'):
  m=re.match(r'\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*\[(https://academy[^\]]+)\]',line)
  if m:
    c,t,l,u=m.groups(); 
    if any(o['url']==u for o in out): continue
    tg=tag(t,'Adult')
    if re.search(r'\d+\s*(v|-)?\s*\d+|\bv\b',t) and not tg['theme']: tg['theme']=['match analysis']
    add('mc-'+u.rsplit('/',1)[1][:40],f'{c}: {t}',u,'masterclass','coachesvoice',tg,paid=True,length=l)
# 3 X Sessions notes
s=open(sys.argv[1]).read(); s=s[s.find('{'):s.rfind('}')+1]; xs=json.loads(s)['files']
xm=json.load(open('xmap.json'))
for f in xs:
  t=re.sub(r'^\d{4}-\d\d-\d\d\s*','',f['title']); u=xm['bydoc'].get(f['id']) or xm['bytitle'].get(f['title'].split('—')[-1].strip()[:30])
  if not u: print('NO X URL:',f['title']); continue
  if any(o['url']==u for o in out): continue
  add('x-'+u.rsplit('/',1)[1],t,u,'x','x-sessions',tag(t+' '+(f.get('contentSnippet') or '')[:600]),note=f['viewUrl'].split('?')[0])
# 4 Animations (folder per session + featured narrated files)
an=json.load(open('anim.json'))
for i,n in an['folders']: add('an-'+i,n+' (animations)',f'https://drive.google.com/drive/folders/{i}','animation','animations',tag(n))
for i,n in an['files']: add('an-'+i,n,f'https://drive.google.com/file/d/{i}/view','animation','animations',tag(n+' U17 3-5-2 building from the back'))
ov=json.load(open('overrides.json'))
res=[]
for o in out:
  k=o['id'].split('-',1)[1]; v=ov.get(k) or ov.get(o['url'])
  if v:
    if v.get('drop'): continue
    for kk,vv in v.get('tags',{}).items(): o['tags'][kk]=sorted(set(o['tags'].get(kk,[]))|set(vv))
  res.append(o)
lib={'version':1,'built':'2026-10-29','note':"Links only. Coaches' Voice is paid: never rehost or copy content. res.js items are merged at runtime by the app (resList()), not duplicated here.",'vocab':{'type':['pdf','masterclass','x','video','animation','search'],'moment':sorted(MOM),'system':SYS+['back three']},'items':res}
json.dump(lib,open('/workspace/touchline/library.json','w'),ensure_ascii=False,indent=0)
import collections as C;print(len(res),C.Counter(o['type'] for o in res),sum(1 for o in res if not o['tags']['theme']))
