#!/usr/bin/env python3
"""Build the position resource files from the Drive positions index.

  python3 tools/positions/build.py [path/to/positions_index.json]

Writes:
  coach/positions.json  every item, Coaches' Voice items flagged cv:1 (coach app only)
  positions.json        player/family copy: Coaches' Voice, masterclass and Drive-only items removed

Only titles, links, Drive IDs, types and tags. No player data ever goes in here.
"""
import json, re, sys, os
SRC = sys.argv[1] if len(sys.argv) > 1 else '/workspace/positions/positions_index.json'
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SLOTS = ['GK','RCB','CB','LCB','RWB','LWB','CDM','RCM','LCM','RST','LST']
NAMES = {'GK':'Goalkeeper','RCB':'Right centre-back','CB':'Centre-back','LCB':'Left centre-back','RWB':'Right wing-back',
 'LWB':'Left wing-back','CDM':'Holding midfielder','RCM':'Right centre-mid','LCM':'Left centre-mid','RST':'Right striker','LST':'Left striker'}
# tag -> keyword pattern (title + watch text). Same tags are matched against work-ons, goals and requests in the apps.
TAGS = {
 'scanning': r'scan|shoulder|look before|awareness|check(ing)? (your|his) shoulder',
 '1v1 defending': r'1v1|1 v 1|one[- ]on[- ]one|defend(ing)? 1|jockey|tackl|duel',
 'heading': r'head(er|ing|s)?\b|aerial|in the air',
 'passing': r'pass|distribut|range|switch(ing)? play|playing out|build[- ]?up|play out',
 'first touch': r'first touch|receiv|half[- ]turn|turn(ing)? on|open body|body shape',
 'finishing': r'finish|shoot|shot|goal ?scor|striker.*box|in the box',
 'pressing': r'press|counter[- ]?press|win (it|the ball) back|high line',
 'crossing': r'cross',
 'dribbling': r'dribbl|beat (a|the) man|take (him|them) on|carry',
 'positioning': r'position|shape|starting spot|space|cover|line|compact',
 'communication': r'talk|communicat|organis|leader|voice',
 'shot stopping': r'save|shot[- ]?stop|dive|goalkeep|keeper|handling|catch',
 'movement': r'run(s|ning)? (in )?behind|movement|off the ball|run beyond|in behind|spin',
 'weak foot': r'weak(er)? foot|both feet|two[- ]footed',
 'fitness': r'recover|up and down|stamina|fitness|sprint',
}
def tags(it):
    t = (it.get('title','') + ' ' + it.get('watch','')).lower()
    return [k for k, p in TAGS.items() if re.search(p, t)]
def is_cv(it):
    s = (it.get('src','') + ' ' + it.get('title','')).lower()
    return ('coaches\' voice' in s or 'coachesvoice' in it.get('url','') or 'cv academy' in s
            or it.get('type') in ('masterclass',))
def drive_id(u):
    m = re.search(r'(?:/d/|[?&]id=|/folders/)([A-Za-z0-9_-]{20,80})', u or '')
    return m.group(1) if m else ''
def yt(u):
    m = re.search(r'(?:youtu\.be/|youtube\.com/(?:watch\?(?:.*&)?v=|shorts/|embed/))([\w-]{11})', u or '')
    return m.group(1) if m else ''
def item(it):
    o = {'t': it['title'], 'u': it['url'], 'ty': it.get('type','web'), 'w': it.get('watch',''), 's': it.get('src',''), 'tags': tags(it)}
    if drive_id(it['url']): o['id'] = drive_id(it['url'])
    if yt(it['url']): o['yt'] = yt(it['url'])
    if is_cv(it): o['cv'] = 1
    # Drive copies only open for coaches (file.get is coach-only); families get the public link items.
    if o['ty'].startswith('drive'): o['drv'] = 1
    return o
SECS = [('clips','Clips'),('drills','Drills'),('reading','Reading'),('free_pdf_links','Downloads'),('drive_resources','Drive folders')]
def build(d, fam):
    keep = (lambda o: not o.get('cv') and not o.get('drv')) if fam else (lambda o: True)
    def lst(xs): return [o for o in (item(x) for x in xs) if keep(o)]
    out = {'v': 1, 'note': 'Position resources. Titles, links and Drive IDs only. No player data.', 'tags': list(TAGS),
           'team': lst(d.get('team_wide', [])), 'scanning': lst(d.get('scanning', [])), 'slots': []}
    if not fam: out['folder'] = d.get('positions_folder', '')
    for k in SLOTS:
        s = d['slots'][k]
        o = {'k': k, 'num': s['num'], 'name': NAMES[k], 'guide': s['guide_doc_id'], 'sec': {}}
        if not fam:
            o.update({'folder': s['folder_id'], 'sub': s.get('subfolders', {}), 'clipsSheet': s.get('clips_sheet_id',''),
                      'drillsDoc': s.get('drills_doc_id',''), 'downloadsDoc': s.get('downloads_doc_id',''), 'pdfs': s.get('uploaded_pdf_ids', [])})
        for key, lab in SECS:
            xs = lst(s.get('items', {}).get(key, []))
            if xs: o['sec'][key] = xs
        out['slots'].append(o)
    return out
d = json.load(open(SRC))
for fam, path in ((False, 'coach/positions.json'), (True, 'positions.json')):
    j = build(d, fam)
    s = json.dumps(j, ensure_ascii=False, separators=(',', ':'))
    if fam: assert 'coachesvoice' not in s.lower() and "coaches' voice" not in s.lower(), 'CV leaked into family file'
    open(os.path.join(ROOT, path), 'w').write(s + '\n')
    n = sum(len(v) for sl in j['slots'] for v in sl['sec'].values())
    print(path, len(s), 'bytes,', n, 'slot items')
