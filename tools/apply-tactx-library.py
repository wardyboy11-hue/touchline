#!/usr/bin/env python3
"""Merge public Tactx catalog titles and URLs into the coach Library and Resources.

Link only. Never copy Tactx videos, stills, PDFs or written coaching points.
Safe to run more than once: it replaces any previous tx**** rows first.
"""
from __future__ import annotations
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAT = json.loads((Path(__file__).parent / 'tactx-catalog.json').read_text())

SKIP_CATS = {'Blog', 'Live Stream Recordings', 'Upcoming Live Streams', 'Whats Coming'}
SKIP_SLUG_RE = re.compile(r'(futsal|tactx-homepage)', re.I)

# Official public titles and Goalkeeping topic (index 5) for the keeper set Tim named.
# Titles use a slash in the packed files, because | is the library row separator.
FORCE_GK = {
    'https://tactxcoach.com/programs/gkpo01-9870dd': 'GOALKEEPING | PLAYING OUT | PRACTICE 1',
    'https://tactxcoach.com/programs/gkpo02-c0f087': 'GOALKEEPING | PLAYING OUT | PRACTICE 2',
    'https://tactxcoach.com/programs/gkpo03-6ab41d': 'GOALKEEPING | PLAYING OUT | PRACTICE 3',
    'https://tactxcoach.com/programs/gkpo04-3deb41': 'GOALKEEPING | PLAYING OUT | PRACTICE 4',
    'https://tactxcoach.com/programs/gk-in-possession-talkover-b82eb3': 'RUBEN AMORIM | IN POSSESSION | GOALKEEPING | TALK-OVER',
    'https://tactxcoach.com/programs/ederson-the-best-ball-playing-goalkeeper-in-world-football': 'EDERSON - THE BEST BALL-PLAYING GOALKEEPER IN WORLD FOOTBALL',
}


# Library tab topics (coach/topics.js)
TOPIC = {
    'breaking': 0,  # Breaking lines and positional play
    'defending': 1,
    'finishing': 2,
    'fitness': 3,
    'general': 4,
    'goalkeeping': 5,
    'passing': 6,
    'transition': 7,
    'warmup': 8,
    'wide': 9,
    'technique': 10,
    'analysis': 13,
    'education': 15,
}
# Resources tab only has topics 0-9
RES_TOPIC_FALLBACK = {10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4}

def pack(s: str) -> str:
    s = (s or '').replace('\n', ' ').replace('\r', ' ')
    s = s.replace('|', ' / ').replace('~', ' ')
    return re.sub(r'\s+', ' ', s).strip()

def slug_title(slug: str) -> str:
    parts = [p for p in slug.split('-') if p]
    if parts and re.fullmatch(r'[a-f0-9]{5,8}', parts[-1]):
        parts = parts[:-1]
    # drop trailing practice codes like at18fs01, hp12fs01, gkpo04, rsb0801 if a word precedes them
    small = {'v', 'vs'}
    out = []
    for p in parts:
        if re.fullmatch(r'[a-z]{1,4}\d{2,}[a-z0-9]*', p):
            continue
        if p.lower() in small:
            out.append(p.lower())
            continue
        if p.isdigit():
            out.append(p)
            continue
        out.append(p.upper() if p.lower() in {'gk', 'ip', 'ipp'} else p.capitalize())
    return pack(' '.join(out)) or pack(slug.replace('-', ' '))

def topic_for(title: str, cats: list[str], slug: str) -> int:
    blob = ' '.join([title, slug, ' '.join(cats)]).lower()
    if 'goalkeep' in blob or re.search(r'\bgk\b', blob) or slug.startswith('gk'):
        return TOPIC['goalkeeping']
    if 'warm-up' in blob or 'warm up' in blob or 'warmup' in blob:
        return TOPIC['warmup']
    if any(k in blob for k in ('tactical analysis', 'talkover', 'talk-over', 'talk over', 'live class', 'analysis')) or 'Tactical Analysis' in cats or 'Football Education' in cats:
        if 'goalkeep' in blob:
            return TOPIC['goalkeeping']
        return TOPIC['analysis']
    if 'season planner' in blob or 'Coaching Material' in cats:
        return TOPIC['education']
    if any(k in blob for k in ('transition',)):
        return TOPIC['transition']
    if any(k in blob for k in ('rondo', 'passing', 'possession')):
        return TOPIC['passing']
    if any(k in blob for k in ('crossing', 'shooting', 'finish', 'final third')):
        return TOPIC['finishing']
    if any(k in blob for k in ('wide', 'wing-back', 'wing back', 'width', 'overlap')):
        return TOPIC['wide']
    if any(k in blob for k in ('high press', 'low press', 'pressing', 'defending', 'out of possession', 'rest defence', 'rest defense')):
        return TOPIC['defending']
    if any(k in blob for k in ('playing out', 'build-up', 'build up', 'creating the attack', 'in possession', 'breaking line', 'positional')):
        return TOPIC['breaking']
    if any(k in blob for k in ('dribbl', '1v1', '2v1', '3v3', 'technical', 'technique')):
        return TOPIC['technique']
    return TOPIC['general']

def fmt_for(topic: int, cats: list[str], collection: bool, media: str) -> str:
    if topic in (TOPIC['analysis'], TOPIC['education']):
        return 'v'
    # Animated practices and full session collections
    return 'n'

def should_skip(it: dict, title: str, slug: str) -> str | None:
    if SKIP_SLUG_RE.search(slug) or SKIP_SLUG_RE.search(title):
        return 'futsal or homepage leftover'
    cats = set(it.get('categories') or [])
    # Skip if every real category is a skipped one (or there are no practice cats and only skipped)
    real = cats - SKIP_CATS
    if cats and not real:
        return 'blog, live recording or coming-soon listing'
    if not cats and not it.get('title') and re.search(r'\bclip-\d+\b|painted|paint-', slug):
        # opaque match-clip leftovers with no public catalog title
        return 'sitemap clip without a public catalog title'
    return None

def build_rows():
    added, skipped = [], []
    seen = set()
    n = 0
    for it in CAT['items']:
        path = it['path']
        slug = path.rsplit('/', 1)[-1]
        if path in seen:
            continue
        seen.add(path)
        title = pack(it.get('title') or slug_title(it.get('slug') or slug))
        if it.get('url') in FORCE_GK:
            title = pack(FORCE_GK[it['url']])
        reason = should_skip(it, title, slug)
        if reason:
            skipped.append({'url': it['url'], 'title': title, 'reason': reason})
            continue
        cats = it.get('categories') or []
        free = 'Free Content' in cats
        topic = topic_for(title, cats, slug)
        if it.get('url') in FORCE_GK:
            topic = TOPIC['goalkeeping']
        fmt = fmt_for(topic, cats, it.get('collection'), it.get('media') or '')
        rec = {
            'id': f'tx{n:04d}',
            'title': title,
            'url': it['url'],
            'aud': 'c',
            'fmt': fmt,
            'emb': 'l',
            'paid': not free,
            'u15': True,
            'appr': False,
            't': topic,
            'tag': 'tactx',
            'by': 'Tactx',
            'free': free,
            'categories': cats,
            'titleSource': it.get('titleSource') or 'catalog',
            'collection': bool(it.get('collection')),
        }
        added.append(rec)
        n += 1
    return added, skipped

def pack_libd(rows):
    parts = []
    for r in rows:
        # id~aud~fmt~emb~paid~u15~appr~t~tag~by~title~url
        parts.append('~'.join([
            r['id'], r['aud'], r['fmt'], r['emb'],
            '1' if r['paid'] else '0',
            '1' if r['u15'] else '0',
            '1' if r['appr'] else '0',
            str(r['t']), r['tag'], r['by'], r['title'], r['url']
        ]))
    return '|'.join(parts)

def pack_rd(rows):
    # s~a~k~t~v  source 9 = Tactx, age 2 = U12 to U16, topic clipped to 0-9
    parts = []
    for r in rows:
        k = RES_TOPIC_FALLBACK.get(r['t'], r['t'])
        a = '0' if r['t'] in (TOPIC['analysis'], TOPIC['education']) else '2'
        parts.append('~'.join(['9', a, str(k), r['title'], r['url']]))
    return '|'.join(parts)

def replace_packed(text: str, var: str, new_chunk: str, id_prefix: str) -> str:
    """Replace previous id_prefix rows inside window.VAR="..."; keep other rows."""
    m = re.search(r'(window\.' + var + r'=")(.*)"', text, re.S)
    if not m:
        raise SystemExit(f'window.{var} not found')
    body = m.group(2)
    rows = [row for row in body.split('|') if row and not row.startswith(id_prefix)]
    # For RD, rows do not start with tx; we will strip previous Tactx by URL instead if re-run
    if var == 'RD':
        rows = [row for row in body.split('|') if row and 'tactxcoach.com' not in row]
    merged = '|'.join(rows + ([new_chunk] if new_chunk else []))
    return text[:m.start()] + m.group(1) + merged + '"' + text[m.end():]

def patch_topics(text: str) -> str:
    if '"tactx"' in text:
        return text
    return text.replace(
        'window.TAGS={"352":"3-5-2 / back three","pin":"Always visible to players"};',
        'window.TAGS={"352":"3-5-2 / back three","pin":"Always visible to players","tactx":"Tactx"};'
    )

def patch_rsrc(text: str) -> str:
    old = "var RSRC=['Coaches Voice','Football DNA','Elliot Hord','Instagram','X','Sport Session Planner','Modern Soccer Coach','The FA','Tifo (YouTube)'];"
    new = "var RSRC=['Coaches Voice','Football DNA','Elliot Hord','Instagram','X','Sport Session Planner','Modern Soccer Coach','The FA','Tifo (YouTube)','Tactx'];"
    if "Tactx']" in text or 'Tactx"]' in text:
        return text
    if old not in text:
        raise SystemExit('RSRC array not found in app.js')
    return text.replace(old, new)

def patch_loaders(text: str) -> str:
    text = text.replace("sc.src='lib.js'", "sc.src='lib.js?v=118'")
    text = text.replace("sc.src='res.js'", "sc.src='res.js?v=118'")
    return text

def bump_version():
    files = [
        ROOT / 'version.json',
        ROOT / 'update.js',
        ROOT / 'coach/index.html',
        ROOT / 'coach/sw.js',
        ROOT / 'coach/app.js',
        ROOT / 'family.html',
        ROOT / 'parents.html',
        ROOT / 'fsw.js',
        ROOT / 'home.js',
    ]
    for p in files:
        t = p.read_text()
        if p.name == 'version.json':
            p.write_text(t.replace('"117"', '"118"'))
            continue
        if p.name == 'update.js':
            p.write_text(re.sub(r"RUN='117'", "RUN='118'", t, count=1))
            continue
        p.write_text(t.replace('v=117', 'v=118'))

def main():
    added, skipped = build_rows()
    # lib.js
    libp = ROOT / 'coach/lib.js'
    lib = libp.read_text()
    if not lib.startswith('/*'):
        pass
    # ensure header mentions Tactx once
    if 'Tactx rows' not in lib:
        lib = lib.replace(
            'Everything starts NOT approved. The coach approves and publishes in the app. */',
            'Everything starts NOT approved. The coach approves and publishes in the app. '
            'Tactx rows (id tx0000 up, by Tactx, tag tactx) are titles and URLs only, link only. '
            'Never copy Tactx videos, stills or written coaching points. */'
        )
    lib = replace_packed(lib, 'LIBD', pack_libd(added), 'tx')
    libp.write_text(lib)

    # res.js
    resp = ROOT / 'coach/res.js'
    res = resp.read_text()
    res = replace_packed(res, 'RD', pack_rd(added), 'tx')
    resp.write_text(res)

    # topics, app.js
    tp = ROOT / 'coach/topics.js'
    tp.write_text(patch_topics(tp.read_text()))
    app = ROOT / 'coach/app.js'
    at = patch_rsrc(app.read_text())
    at = patch_loaders(at)
    app.write_text(at)

    bump_version()

    report = {
        'added': len(added),
        'skipped': len(skipped),
        'free': sum(1 for r in added if not r['paid']),
        'paid': sum(1 for r in added if r['paid']),
        'fmt': {},
        'topic': {},
        'titleSource': {},
        'skippedByReason': {},
    }
    from collections import Counter
    report['fmt'] = dict(Counter(r['fmt'] for r in added))
    report['topic'] = dict(Counter(r['t'] for r in added))
    report['titleSource'] = dict(Counter(r['titleSource'] for r in added))
    report['skippedByReason'] = dict(Counter(s['reason'] for s in skipped))
    (ROOT / 'tools/tactx-apply-report.json').write_text(json.dumps({'report': report, 'skipped': skipped}, indent=2) + '\n')
    print(json.dumps(report, indent=2))
    return 0

if __name__ == '__main__':
    sys.exit(main())
