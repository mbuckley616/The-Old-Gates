# python3 docs/prototypes/levelup/mh_pack.py [OUTDIR] (Session 770): packs MakeHuman's base body (CC0, released by the
# MakeHuman project in 2020), the targets the slice's genome uses, the default skeleton and its weights into one binary
# for the browser: mh/pack.json (the index) and mh/pack.bin. The files come from MakeHuman's GitHub and are cached in
# ~/.cache/mh. The pack is generated, not committed.
import json, os, struct, sys, urllib.request
here = os.path.dirname(os.path.abspath(__file__)); out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, 'mh'); os.makedirs(out, exist_ok=True)
CACHE = os.path.expanduser('~/.cache/mh'); os.makedirs(CACHE, exist_ok=True)
B = 'https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/'
def get(p):
    f = os.path.join(CACHE, p.replace('/', '_'))
    if not os.path.exists(f):
        try: urllib.request.urlretrieve(B + p, f)
        except Exception as e: print('missing', p, e); return None
    return open(f, encoding='utf-8', errors='replace').read()

# the base mesh: positions (decimetres in the file, metres here), groups of faces
obj = get('data/3dobjs/base.obj'); V = []; groups = {}; g = None
for line in obj.splitlines():
    if line.startswith('v '): V.append([float(x) * .1 for x in line.split()[1:4]])
    elif line.startswith('g '): g = line[2:].strip(); groups.setdefault(g, [])
    elif line.startswith('f '):
        idx = [int(t.split('/')[0]) - 1 for t in line.split()[1:]]
        for k in range(1, len(idx) - 1): groups[g].append((idx[0], idx[k], idx[k + 1]))
keep = ['body', 'helper-tights', 'helper-skirt', 'helper-hair', 'helper-l-eye', 'helper-r-eye']
# targets: sparse deltas, quantised to 1/10 mm
mods = json.loads(get('data/modifiers/modeling_modifiers.json'))
T = []
def target(path):
    s = get('data/targets/' + path + '.target')
    if s is None or s.startswith('404'): return None
    ent = []
    for line in s.splitlines():
        if not line or line.startswith('#'): continue
        p = line.split(); i = int(p[0]); ent.append((i, *[round(float(x) * .1 * 10000) for x in p[1:4]]))
    return ent
names = []
for race in ['caucasian', 'african', 'asian']:
    for gen in ['male', 'female']:
        for age in ['young', 'old']: names.append(f'macrodetails/{race}-{gen}-{age}')
for gen in ['male', 'female']:
    for age in ['young', 'old']:
        for m in ['min', 'average', 'max']:
            for w in ['min', 'average', 'max']:
                if m == 'average' and w == 'average': continue
                names.append(f'macrodetails/universal-{gen}-{age}-{m}muscle-{w}weight')
        for h in ['min', 'max']: names.append(f'macrodetails/height/{gen}-{age}-averagemuscle-averageweight-{h}height')
        names.append(f'macrodetails/proportions/{gen}-{age}-averagemuscle-averageweight-idealproportions')
FACE = ['head-oval', 'head-square', 'head-round', 'head-triangular', 'head-fat', 'head-scale-horiz', 'forehead-trans', 'forehead-temple', 'eyebrows-trans', 'nose-scale-horiz', 'nose-scale-vert',
        'nose-point-width', 'nose-curve', 'nose-width1', 'nose-compression', 'chin-width', 'chin-prominent', 'chin-height', 'chin-bones', 'l-cheek-bones', 'r-cheek-bones', 'mouth-scale-horiz',
        'mouth-lowerlip-height', 'mouth-upperlip-height', 'neck-scale-horiz', 'torso-vshape', 'torso-scale-horiz', 'hip-scale-horiz', 'r-eye-height2', 'l-eye-height2']
group_of = {m['target']: (grp['group'], m) for grp in mods for m in grp['modifiers'] if 'target' in m}
face_names = []
for t in FACE:
    if t not in group_of: print('no modifier', t); continue
    grp, m = group_of[t]
    if 'min' in m: face_names += [(t, m['min'], f'{grp}/{t}-{m["min"]}'), (t, m['max'], f'{grp}/{t}-{m["max"]}')]
    else: face_names.append((t, '', f'{grp}/{t}'))
index = {'targets': [], 'face': []}; blobs = []; off = 0
def add(name, ent, key):
    global off
    if not ent: return
    b = struct.pack(f'<{len(ent)}H', *[e[0] for e in ent]) + struct.pack(f'<{len(ent) * 3}h', *[max(-32767, min(32767, c)) for e in ent for c in e[1:]])
    index[key].append({'name': name, 'n': len(ent), 'off': off}); blobs.append(b); off += len(b); off += (-off) % 4; blobs.append(b'\0' * ((-len(b)) % 4))
for n in names: add(n, target(n), 'targets')
for t, side, p in face_names: e = target(p); add(t + ('|' + side if side else ''), e, 'face')
# the mesh
pos = struct.pack(f'<{len(V) * 3}f', *[c for v in V for c in v]); index['verts'] = {'n': len(V), 'off': off}; blobs.append(pos); off += len(pos)
index['groups'] = {}
for k in keep:
    tri = [i for t in groups[k] for i in t]; b = struct.pack(f'<{len(tri)}I', *tri); index['groups'][k] = {'n': len(tri), 'off': off}; blobs.append(b); off += len(b)
# skeleton: bones in parent-first order, joints as vertex lists
sk = json.loads(get('data/rigs/default.mhskel')); bones = sk['bones']; order = []
def visit(n):
    if n in order: return
    p = bones[n]['parent']
    if p: visit(p)
    order.append(n)
for n in bones: visit(n)
index['bones'] = [{'name': n, 'parent': bones[n]['parent'], 'head': bones[n]['head'], 'tail': bones[n]['tail']} for n in order]
index['joints'] = sk['joints']
# weights: the four largest per vertex
wt = json.loads(get('data/rigs/default_weights.mhw'))['weights']; bi = {n: i for i, n in enumerate(order)}; per = [[] for _ in V]
for bn, L in wt.items():
    for v, w in L: per[int(v)].append((float(w), bi[bn]))
si, sw = [], []
for L in per:
    L.sort(reverse=True); L = (L + [(0., 0)] * 4)[:4]; s = sum(w for w, _ in L) or 1; si += [b for _, b in L]; sw += [w / s for w, _ in L]
b = struct.pack(f'<{len(si)}H', *si); index['skinIndex'] = {'off': off}; blobs.append(b); off += len(b); off += (-off) % 4; blobs.append(b'\0' * ((-len(b)) % 4))
b = struct.pack(f'<{len(sw)}f', *sw); index['skinWeight'] = {'off': off}; blobs.append(b); off += len(b)
open(os.path.join(out, 'pack.bin'), 'wb').write(b''.join(blobs)); json.dump(index, open(os.path.join(out, 'pack.json'), 'w'))
lo = [min(v[i] for v in V) for i in range(3)]; hi = [max(v[i] for v in V) for i in range(3)]
print('pack', off, 'bytes;', len(index['targets']), 'macro targets,', len(index['face']), 'face targets,', len(order), 'bones; bounds', [round(x, 3) for x in lo], [round(x, 3) for x in hi])
