#!/usr/bin/env python3
"""Build coach/idx.js, the static practice index used by Plan > Build > Build this week.

Usage:  python tools/build_idx.py drive_export.csv [--out coach/idx.js] [--overrides tools/tags_override.json]

drive_export.csv columns (header row required): id, name, folder
  id      Drive file id
  name    file name (a trailing .pdf is dropped)
  folder  parent folder path, e.g. Coaches Voice/Session plans/U12 to U16

It also merges the rows in coach/res.js (window.RD) and our animations (ANI in coach/app.js),
so one index covers everything. res.js and app.js are left alone.
Output is deterministic: same inputs give the same bytes. Rows are sorted by id.
The app never reads Drive live. Re-run this after new files land.
"""
import csv, json, re, sys, os, argparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VOCAB = {
  'moment': ['ip', 'op', 'att-trans', 'def-trans', 'sp'],
  'theme': ['build-out', 'play-forward', 'third-man', 'split-lines', 'counter', 'counter-press', 'press',
            'rotations', 'overloads', 'wide', 'finishing', 'shape', 'rondo', 'gk'],
  'fmt': ['arrival', 'technical', 'opposed', 'ssg', 'phase', 'game'],
  'age': ['U8-U11', 'U12-U16', 'U17', 'all'],
}

# Title keyword map: regex -> tags. Also written into idx.js (window.IDXKW) so the app uses the same map.
KW = [
  [r'counter.?press|counter.?pressure|gegen', ['counter-press', 'def-trans']],
  [r'lose it|losing it|lost the ball|react after|slow to react|defensive transition|defence to attack|defense to attack', ['def-trans']],
  [r'win it|won the ball|regain|attacking transition|possession transition|exploiting space in attacking', ['att-trans']],
  [r'counter.?attack', ['counter', 'att-trans']],
  [r'build(?:ing)? out|play(?:ing)? out|build from|build up|out from the back|noden', ['build-out', 'ip']],
  [r'play(?:ing)? forward|first pass forward|forward pass|through lines|break(?:ing)? lines?|split(?:s|ting)? the lines|line.?breaking|penetrat', ['play-forward', 'split-lines']],
  [r'third.?man|hidden runner', ['third-man']],
  [r'rotation|rotate|interchange|swap', ['rotations']],
  [r'overload|extra man|numerical', ['overloads']],
  [r'\bwide\b|width|overlap|crossing|\bcross\b', ['wide']],
  [r'finish|shooting|shoot\b', ['finishing']],
  [r'shape|compact|structure|as a unit|formation|\b3 ?5 ?2\b|\b352\b|defensive principles', ['shape']],
  [r'rondo', ['rondo', 'ip']],
  [r'\bpress(?:ing)?\b|\btrap', ['press', 'op']],
  [r'set piece|corner|free kick', ['sp']],
  [r'possession|passing|receiving', ['ip']],
  [r'defend|defensive|defending', ['op']],
  [r'goalkeep|keeper|\bgk\b', ['gk']],
]
KW_FMT = [
  ['game', r'\bgame\b|match'],
  ['ssg', r'small.?sided|\bssg\b|\d ?v ?\d ?v ?\d|\d ?v ?\d.*game'],
  ['arrival', r'rondo|arrival|warm|activation'],
  ['phase', r'phase|full.?pitch|unit v unit|unit versus unit'],
  ['technical', r'technical|passing|receiving|first touch|dribbl|turning|control|technique'],
]
AGE_RA = {0: 'all', 1: 'U8-U11', 2: 'U12-U16', 3: 'U12-U16', 4: 'U17', 5: 'all'}
SRC = ['Coaches Voice', 'Football DNA', 'Elliot Hord', 'Instagram', 'X', 'Sport Session Planner',
       'Modern Soccer Coach', 'The FA', 'Tifo (YouTube)', 'Our animation']
SRC_ANIM = 9


def tags_for(title):
    t = title.lower()
    tags = []
    for rx, tg in KW:
        if re.search(rx, t):
            for x in tg:
                if x not in tags:
                    tags.append(x)
    return tags


def fmt_for(title, slot_hint=None):
    t = title.lower()
    for f, rx in KW_FMT:
        if re.search(rx, t):
            return f
    return 'opposed'


def players_for(title):
    m = re.search(r'(\d{1,2})\s*v\s*(\d{1,2})(?:\s*v\s*(\d{1,2}))?', title.lower())
    if not m:
        return ''
    return 'v'.join(x for x in m.groups() if x)


def area_for(title):
    t = title.lower()
    if re.search(r'full.?pitch', t): return 'full'
    if re.search(r'half', t): return 'half'
    if re.search(r'third', t): return 'third'
    if re.search(r'\bbox\b|penalty area', t): return 'box'
    return ''


def system_for(title):
    m = re.search(r'\b(3 ?5 ?2|3 ?4 ?3|2 ?1 ?3 ?1|4 ?3 ?3|4 ?4 ?2|4 ?2 ?3 ?1)\b', title.lower())
    return m.group(1).replace(' ', '') if m else ''


def age_from_folder(folder, name):
    f = (folder + ' ' + name).lower()
    if re.search(r'u17', f): return 'U17'
    if re.search(r'u12\s*(?:to|-)?\s*u?16|u1[2-6]|u13|u14|u15', f): return 'U12-U16'
    if re.search(r'u8\s*(?:to|-)?\s*u?11|u[89]\b|u1[01]\b', f): return 'U8-U11'
    return 'all'


def topic_for(title, tags):
    # topic index into window.TOPICS (coach/topics.js)
    t = title.lower()
    if 'gk' in tags: return 5
    if 'counter' in tags or 'att-trans' in tags or 'def-trans' in tags or 'counter-press' in tags: return 7
    if 'finishing' in tags: return 2
    if 'wide' in tags or 'overloads' in tags or 'rotations' in tags: return 9
    if 'rondo' in tags: return 6
    if 'press' in tags or 'shape' in tags or 'op' in tags: return 1
    if 'build-out' in tags or 'play-forward' in tags or 'third-man' in tags or 'split-lines' in tags: return 0
    if re.search(r'warm|game', t): return 8
    return 4


def row(id_, title, src, age, tags, url='', priv=0, topic=None, fmt=None, over=None):
    tags = list(tags)
    fm = fmt or fmt_for(title)
    if over:
        o = over.get(id_) or over.get(title) or {}
        if 'tags' in o: tags = list(o['tags'])
        if 'fmt' in o: fm = o['fmt']
        if 'age' in o: age = o['age']
        if 'topic' in o: topic = o['topic']
    tp = topic if topic is not None else topic_for(title, tags)
    return [id_, title, src, age, tp, ','.join(tags), players_for(title), area_for(title), fm, url, priv]


def read_rd():
    s = open(os.path.join(ROOT, 'coach', 'res.js'), encoding='utf-8').read()
    m = re.search(r'window\.RD\s*=\s*"((?:[^"\\]|\\.)*)"', s)
    if not m:
        return []
    out = []
    for i, r in enumerate(m.group(1).split('|')):
        p = r.split('~')
        if len(p) < 4: continue
        out.append((i, int(p[0]), int(p[1]), int(p[2]), p[3], p[4] if len(p) > 4 else ''))
    return out


def read_ani():
    s = open(os.path.join(ROOT, 'coach', 'app.js'), encoding='utf-8').read()
    m = re.search(r"var ANI=\[(.*?)\];", s, re.S)
    if not m:
        return []
    return re.findall(r"\['([^']+)','([^']+)','([^']+)'\]", m.group(1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('csv')
    ap.add_argument('--out', default=os.path.join(ROOT, 'coach', 'idx.js'))
    ap.add_argument('--overrides', default=os.path.join(ROOT, 'tools', 'tags_override.json'))
    a = ap.parse_args()
    over = {}
    if os.path.exists(a.overrides):
        over = json.load(open(a.overrides, encoding='utf-8'))
    rows = {}
    # 1. Drive export (private, link only)
    with open(a.csv, newline='', encoding='utf-8') as f:
        for r in csv.DictReader(f):
            did, name, folder = r['id'].strip(), re.sub(r'\.pdf$', '', r['name'].strip(), flags=re.I), r['folder'].strip()
            if not did or not name: continue
            src = 0
            fl = folder.lower()
            if 'football dna' in fl: src = 1
            elif 'elliot' in fl: src = 2
            tags = tags_for(name)
            age = age_from_folder(folder, name)
            rows['d' + did] = row('d' + did, name, src, age, tags, 'https://drive.google.com/file/d/%s/view' % did, 1, over=over)
    # 2. res.js rows (no new links: Drive rows fall back to a Drive search in the app)
    for i, s, a_, k, t, v in read_rd():
        id_ = 'r%d' % i
        rows[id_] = row(id_, t, s, AGE_RA.get(a_, 'all'), tags_for(t), v, 1 if s == 0 else 0, topic=k, over=over)
    # 3. our animations
    for slug, title, sub in read_ani():
        id_ = 'a' + slug[:2]
        tg = tags_for(title + ' ' + sub)
        rows[id_] = row(id_, title, SRC_ANIM, 'all', tg, 'https://touchline.cipher-training.co.uk/coach/anim/%s.html' % slug, 0,
                        fmt='phase', over=over)
        rows[id_][9] = slug  # slug only: app builds the URL
    data = [rows[k] for k in sorted(rows)]
    head = ('/* Touchline practice index. GENERATED by tools/build_idx.py. Do not edit by hand.\n'
            '   Row: [id, title, srcIdx, ageBand, topicIdx, tags, players, area, fmt, url, priv]\n'
            '   srcIdx: index into SRC below. priv:1 = private Drive link, open as a link only. Never embed, copy or cache the file.\n'
            '   Tag vocabulary: %s */\n' % json.dumps(VOCAB, separators=(',', ':')))
    body = 'window.IDXSRC=%s;\nwindow.IDXKW=%s;\nwindow.IDXFMT=%s;\nwindow.IDX=%s;\n' % (
        json.dumps(SRC, separators=(',', ':')),
        json.dumps(KW, separators=(',', ':'), ensure_ascii=False),
        json.dumps(KW_FMT, separators=(',', ':'), ensure_ascii=False),
        json.dumps(data, separators=(',', ':'), ensure_ascii=False))
    with open(a.out, 'w', encoding='utf-8', newline='\n') as f:
        f.write(head + body)
    print('wrote %s: %d rows, %d bytes' % (a.out, len(data), len(head + body)))


if __name__ == '__main__':
    main()
