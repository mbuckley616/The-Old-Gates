# python3 docs/prototypes/levelup/bundle.py OUTDIR (Session 769): one self-contained page per scene for a host that
# allows scripts only from a CDN (the claude.ai artifact). three.js comes from jsDelivr at the vendored version; the
# slice's own modules are inlined.
import re, sys, os, json
here = os.path.dirname(os.path.abspath(__file__)); out = sys.argv[1]; os.makedirs(out, exist_ok=True)
V = '0.170.0'
HEAD = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title><style>html,body{{margin:0;height:100%;background:#0d1014;overflow:hidden}}canvas{{display:block;width:100vw;height:100vh}}
#note{{position:fixed;left:12px;bottom:10px;color:#f3ead6;font:13px/1.4 system-ui,sans-serif;text-shadow:0 1px 2px #000}}#note a{{color:#f0c96a}}</style>
<script type="importmap">{{"imports":{{"three":"https://cdn.jsdelivr.net/npm/three@{V}/build/three.module.min.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@{V}/examples/jsm/"}}}}</script>
<script>window.MH_BIN = 'pack.wasm';</script></head><body><div id="note">{note} · <a href="./">all scenes</a></div><script type="module">
'''
def strip_common(src):
    src = re.sub(r"^export (const|function|let|async function)", r"\1", src, flags=re.M)
    return src
def scene(src):
    return re.sub(r"^import \{[^}]*\} from './(common|people).js';\n", '', src, flags=re.M)
_c = strip_common(open(os.path.join(here, 'common.js'), encoding='utf-8').read()); _p = strip_common(open(os.path.join(here, 'people.js'), encoding='utf-8').read())
# a top-level name people.js keeps to itself and common.js also declares (people.js's WIND from Session 1024 until 1095) is renamed in
# people.js's copy: the two modules share one scope here, and a module cannot both import a name and declare it, so none is shared
_top = lambda src: set(re.findall(r"^(?:const|let|var|function|async function|class) (\w+)", src, flags=re.M))
for _n in sorted(_top(_c) & _top(_p)): _p = re.sub(r"\b%s\b" % _n, 'P_' + _n, _p)
# people.js imports the helms (Session 1197); the host serves no relative module, so the bundle carried a dead `import ... from
# './helms.js'` into every page with people (22 of 23, found 20 Oct 2026). helms.js goes in as a closure ahead of people.js, and
# people.js's three names are renamed P_ so a page that also wraps helms.js (helmkit) does not meet them
def _helms_for_people(p):
    m = re.search(r"^import \{([^}]*)\} from './helms.js';\n", p, flags=re.M)
    if not m: return p
    hs = open(os.path.join(here, 'helms.js'), encoding='utf-8').read(); names = re.findall(r"^export (?:const|function) (\w+)", hs, flags=re.M)
    body = re.sub(r"^import .*;\n", '', strip_common(hs), flags=re.M); pairs = [x.strip().split(' as ') for x in m.group(1).split(',') if x.strip()]
    local = [pr[-1] for pr in pairs]
    for n in local: p = re.sub(r"\b%s\b" % n, 'P_' + n, p)
    m = re.search(r"^import \{([^}]*)\} from './helms.js';\n", p, flags=re.M)
    wrapped = 'const P_HELMS = (() => {\n' + body + '\nreturn { ' + ', '.join(names) + ' };\n})();\nconst { ' + ', '.join(pr[0] + ': P_' + pr[-1] for pr in pairs) + ' } = P_HELMS;\n'
    return p[:m.start()] + wrapped + p[m.end():]
_p = _helms_for_people(_p)
common = _c + '\n' + _p
imports_c = re.findall(r"^import .*;$", common, flags=re.M)
common_body = re.sub(r"^import .*;\n", '', common, flags=re.M)
# the world's corruption (concept, 20 Oct 2026): any number of the folder's kits, each as one closure in the order given, a kit's own
# imports of the kits before it read from their closures; then the page's imports from them
def kits(s, mods):
    done = {}
    def exports(src):
        names = [(n, n) for n in re.findall(r"^export (?:const|let|function|async function|class) (\w+)", src, flags=re.M)]
        for lst in re.findall(r"^export \{([^}]*)\};?$", src, flags=re.M): names += [(x.strip().split(' as ')[0], x.strip().split(' as ')[-1]) for x in lst.split(',') if x.strip()]
        return names
    def uses(src):
        out = []
        for names, mod in re.findall(r"^import \{([^}]*)\} from './(\w+)\.js';\n", src, flags=re.M):
            if mod in done: out.append('const { ' + ', '.join(': '.join(dict.fromkeys(x.strip().split(' as '))) for x in names.split(',') if x.strip()) + ' } = ' + done[mod] + ';')
        return out
    pre = []
    for mod in mods:
        src = open(os.path.join(here, mod + '.js'), encoding='utf-8').read(); ex = exports(src); tag = 'K_' + mod
        imps = [i for i in re.findall(r"^import .*;$", src, flags=re.M) if not re.search(r"from '\./", i)]
        body = re.sub(r"^export \{[^}]*\};?\n", '', strip_common(src), flags=re.M); body = re.sub(r"^import .*;\n", '', body, flags=re.M)
        pre.append('\n'.join(imps) + '\nconst ' + tag + ' = (() => {\n' + '\n'.join(uses(src)) + '\n' + body + '\nreturn { ' + ', '.join(o if o == n else o + ': ' + n for n, o in ex) + ' };\n})();')
        done[mod] = tag
    head = '\n'.join(pre) + '\n' + '\n'.join(uses(s)) + '\n'
    s = re.sub(r"^import \{[^}]*\} from './(%s)\.js';\n" % '|'.join(mods), '', s, flags=re.M)
    return head + s
# light indoors (concept, 26 Oct 2026): two kits importing the same name from one module (pieces.js and places.js both take
# mergeGeometries) met as a duplicate declaration; named imports are merged by module, each name once
def merge_imports(imps):
    named, other = {}, []
    for i in imps:
        m = re.match(r"^import \{([^}]*)\} from '([^']+)';$", i)
        if m: named.setdefault(m.group(2), []).extend(x.strip() for x in m.group(1).split(',') if x.strip())
        else: other.append(i)
    return list(dict.fromkeys(other)) + ['import { ' + ', '.join(dict.fromkeys(v)) + " } from '" + k + "';" for k, v in named.items()]
def build(name, title, note, srcfile, use_common, query=''):
    src = open(os.path.join(here, srcfile), encoding='utf-8').read()
    if use_common:
        s = scene(src)
        if "from './halls.js'" in s: s = kits(s, ['pieces', 'ships', 'places', 'rooms', 'light', 'halls'])
        if "from './light.js'" in s: s = kits(s, ['pieces', 'ships', 'places', 'rooms', 'light'])
        if "from './air.js'" in s: s = kits(s, ['gatekit', 'pieces', 'shrines', 'corruption', 'air'])
        if "from './weather.js'" in s: s = kits(s, ['gatekit', 'pieces', 'shrines', 'corruption', 'seasons', 'weather'])
        if "from './hours.js'" in s: s = kits(s, ['gatekit', 'pieces', 'shrines', 'corruption', 'hours'])
        if "from './seasons.js'" in s: s = kits(s, ['gatekit', 'pieces', 'shrines', 'corruption', 'seasons'])
        if "from './corruption.js'" in s: s = kits(s, ['gatekit', 'pieces', 'shrines', 'corruption'])
        if "from './pieces.js'" in s: s = kits(s, ['pieces'])
        if "from './creatures.js'" in s: s = kit(s)
        if "from './implements.js'" in s: s = implkit(s)
        if "from './helms.js'" in s: s = helmkit(s)
        if "from './shrines.js'" in s: s = shrinekit(s)
        if "from './musicians.js'" in s: s = musickit(s)
        imps = re.findall(r"^import .*;$", s, flags=re.M); body = re.sub(r"^import .*;\n", '', s, flags=re.M)
        allimps = merge_imports(imports_c + imps); code = '\n'.join(allimps) + '\n' + common_body + '\n' + body
    else: code = src
    if query: code = code.replace("new URLSearchParams(location.search)", f"new URLSearchParams(location.search || '{query}')")
    open(os.path.join(out, name), 'w', encoding='utf-8').write(HEAD.format(title=title, note=note, V=V) + code + '\n</script></body></html>\n')
# Session 772: the creature kit goes in as one closure, so its many small names cannot meet the slices' own
def kit(s):
    src = open(os.path.join(here, 'creatures.js'), encoding='utf-8').read()
    names = re.findall(r"^export (?:const|function) (\w+)", src, flags=re.M)
    imps = re.findall(r"^import .*;$", src, flags=re.M); body = re.sub(r"^import .*;\n", '', strip_common(src), flags=re.M)
    m = re.search(r"^import \{([^}]*)\} from './creatures.js';\n", s, flags=re.M)
    wrapped = '\n'.join(imps) + '\nconst CK = (() => {\n' + body + '\nreturn { ' + ', '.join(names) + ' };\n})();\nconst {' + m.group(1) + '} = CK;\n'
    return s[:m.start()] + wrapped + s[m.end():]
build('vista.html', 'The Gatelands vista', 'The hero vista. Drag to look.', 'main.js', False)
build('lane.html', 'A village lane', 'A village lane at eye level. Drag to look.', 'street.js', True)
build('gate.html', 'An old gate', 'An old gate, from the path: the outer arch is 100 m high. Drag to look.', 'gate.js', True, '?view=gate')
build('door.html', 'At the gate', 'At the door of an old gate: the slit is 24 m high. Drag to look.', 'gate.js', True, '?view=gate&cam=foot')
build('people.html', 'Markfolk from a genome', 'Markfolk from a genome (MakeHuman body, our wardrobe). Drag to look.', 'lineup.js', True)
build('hall.html', 'Inside a gate', 'Inside a gate: the vault is 50 m up. Drag to look.', 'gate.js', True, '?view=hall')
build('creatures.html', 'Creatures from parts', 'Creatures from parts: one kit of skeletons, one gait engine, at true size beside a 1.8 m figure. Drag to look.', 'bestiary.js', True)
build('creature.html', 'One creature', 'One creature walking: change the plan, the gait, the seed and the sliders.', 'bestiary.js', True, '?view=one&plan=ironwolf')
build('gatelands-pieces.html', 'Gatelands building pieces', 'The Gatelands’ buildings as pieces (F6): a town street running out to its cottages. ?mix=a|b|c, &cam=eye|high|cottage|town. Drag to look.', 'pieces-gatelands.js', True, '?view=street&mix=a')
build('gatelands-plans.html', 'Gatelands plans in a row', 'Six Gatelands plans at true size, a person at each door. Drag to look.', 'pieces-gatelands.js', True, '?view=line')
build('gatelands-kit.html', 'Gatelands pieces, one by one', 'The Gatelands pieces one by one beside a person. Drag to look.', 'pieces-gatelands.js', True, '?view=kit')
# the schools' implements (concept, 16 Oct 2026): implements.js goes in as one closure, as the creature kit does, its common.js
# import dropped (common.js is inlined already)
def implkit(s):
    src = open(os.path.join(here, 'implements.js'), encoding='utf-8').read()
    names = re.findall(r"^export (?:const|function) (\w+)", src, flags=re.M)
    imps = [i for i in re.findall(r"^import .*;$", src, flags=re.M) if "./common.js" not in i]; body = re.sub(r"^import .*;\n", '', strip_common(src), flags=re.M)
    m = re.search(r"^import \{([^}]*)\} from './implements.js';\n", s, flags=re.M)
    wrapped = '\n'.join(imps) + '\nconst IK = (() => {\n' + body + '\nreturn { ' + ', '.join(names) + ' };\n})();\nconst {' + m.group(1) + '} = IK;\n'
    return s[:m.start()] + wrapped + s[m.end():]
build('gates-six.html', 'The six great gates', 'The six schools’ great gates (F5): one skeleton, the outer arch 100 m high, dressed by school. ?school=tine|uisce|cloch|scath|solas|gaoth &cam=wide|far|foot|scale. Drag to look.', 'gates.js', True, '?school=tine&cam=wide')
build('implements-schools.html', 'The schools’ implements', 'The six schools’ magical implements (L7, OG-094): a staff, a hand piece, a focus and a tome each. &cam=wide|tine|uisce|cloch|scath|solas|gaoth. Drag to look.', 'implements-view.js', True, '?view=schools')
build('implements-islands.html', 'Staffs by island', 'The common staff in each island’s make, the school in its stone; each rack holds the six schools. Drag to look.', 'implements-view.js', True, '?view=islands')
build('implements-hand.html', 'Staffs in hand', 'A Gatelander, a Markman and an Aurennais with a staff in the fist. ?tier=island|school. Drag to look.', 'implements-view.js', True, '?view=hand&tier=school')
# the armour's helms by tier (concept, 17 Oct 2026): helms.js goes in as one closure, as implements.js does
def helmkit(s):
    src = open(os.path.join(here, 'helms.js'), encoding='utf-8').read()
    names = re.findall(r"^export (?:const|function) (\w+)", src, flags=re.M)
    imps = [i for i in re.findall(r"^import .*;$", src, flags=re.M) if "./common.js" not in i]; body = re.sub(r"^import .*;\n", '', strip_common(src), flags=re.M)
    m = re.search(r"^import \{([^}]*)\} from './helms.js';\n", s, flags=re.M)
    wrapped = '\n'.join(imps) + '\nconst HK = (() => {\n' + body + '\nreturn { ' + ', '.join(names) + ' };\n})();\nconst {' + m.group(1) + '} = HK;\n'
    return s[:m.start()] + wrapped + s[m.end():]
build('helms-line.html', 'Helms by tier', 'The heavy line’s ten helms, Wooden to Cosmic (L7, OG-052 and OG-019). ?set=a (one shape) | b (OG-052’s silhouettes) | c (b, visors shut), &cam=whole|far|heads|close. Drag to look.', 'helms-view.js', True, '?view=line&set=b')
build('helms-hoods.html', 'Hoods by tier', 'The robe line’s raised hoods, Mithril to Cosmic: circlets (?set=a) or antlers, horns, a crescent and a halo (?set=b). Drag to look.', 'helms-view.js', True, '?view=robes&set=b')
# the six gods' shrines by island (concept, 18 Oct 2026): shrines.js goes in as one closure, as helms.js does
def shrinekit(s):
    src = open(os.path.join(here, 'shrines.js'), encoding='utf-8').read()
    names = re.findall(r"^export (?:const|function) (\w+)", src, flags=re.M)
    imps = [i for i in re.findall(r"^import .*;$", src, flags=re.M) if "./common.js" not in i]; body = re.sub(r"^import .*;\n", '', strip_common(src), flags=re.M)
    m = re.search(r"^import \{([^}]*)\} from './shrines.js';\n", s, flags=re.M)
    wrapped = '\n'.join(imps) + '\nconst SK_ = (() => {\n' + body + '\nreturn { ' + ', '.join(names) + ' };\n})();\nconst {' + m.group(1) + '} = SK_;\n'
    return s[:m.start()] + wrapped + s[m.end():]
build('shrines-row.html', 'Shrines by island', 'The six gods’ niches and the Guest’s, the common form dressed by island (L9, OG-113). ?island=gatelands|mark|aurenne, &cam=wide|figures|guest|far, &time=dusk. Drag to look.', 'shrines-view.js', True, '?view=row&island=gatelands')
build('shrines-wayside.html', 'Wayside shrines', 'One god’s wayside shrine in the three islands’ dress, a person of each island beside it. &god=teallach|muir|speir|beithigh|cloch|fiodoir, &time=dusk. Drag to look.', 'shrines-view.js', True, '?view=three')
# the players by island (concept, 19 Oct 2026): musicians.js goes in as one closure (its H and V would meet common.js's), as shrines.js does
def musickit(s):
    src = open(os.path.join(here, 'musicians.js'), encoding='utf-8').read()
    names = re.findall(r"^export (?:const|function) (\w+)", src, flags=re.M)
    imps = re.findall(r"^import .*;$", src, flags=re.M); body = re.sub(r"^import .*;\n", '', strip_common(src), flags=re.M)
    m = re.search(r"^import \{([^}]*)\} from './musicians.js';\n", s, flags=re.M)
    wrapped = '\n'.join(imps) + '\nconst MU_ = (() => {\n' + body + '\nreturn { ' + ', '.join(names) + ' };\n})();\nconst {' + m.group(1) + '} = MU_;\n'
    return s[:m.start()] + wrapped + s[m.end():]
build('players-band.html', 'Players by island', 'Each island’s five players with OG-112’s instruments, held (L9). ?island=gatelands|mark|aurenne, &cam=wide|close|far|scale. Drag to look.', 'musicians-view.js', True, '?view=band&island=gatelands')
build('players-kit.html', 'The fifteen instruments', 'OG-112’s fifteen instruments at their true size, an island a row, the 1.8 m post beside them. &cam=wide|close. Drag to look.', 'musicians-view.js', True, '?view=kit')
# the HUD in the new look (concept, 15 Oct 2026): the slice's scene, then hud.js in place of its dynamic import, the
# approved kit's CSS, icons and fonts inlined (fonts from Google, the host allows no others)
def hud(name, title, note, scene_src, query):
    css = open(os.path.join(here, '..', 'hud', 'kit.css'), encoding='utf-8').read() + open(os.path.join(here, 'hud.css'), encoding='utf-8').read()
    defs = open(os.path.join(here, '..', 'hud', 'defs.html'), encoding='utf-8').read()
    h = open(os.path.join(here, 'hud.js'), encoding='utf-8').read()
    h = re.sub(r"// HUD-SCENE .*?// HUD-SCENE-END\n", '', h, flags=re.S)
    h = h.replace('const DEFS = window.HUD_DEFS ||', 'const DEFS = ' + json.dumps(defs) + ' ||')
    s = scene(open(os.path.join(here, scene_src), encoding='utf-8').read())
    hs = scene(h); himps = re.findall(r"^import .*;$", hs, flags=re.M); hbody = re.sub(r"^import .*;\n", '', hs, flags=re.M)
    # hud.js's catch goes in before the scene renders; the rest after it, in a block of its own
    cut = hbody.index('const until'); pre, post = hbody[:cut], hbody[cut:]
    src = '\n'.join(himps) + '\n' + pre + '\n' + s + '\n{\n' + post + '\n}\n'
    if "from './creatures.js'" in src: src = kit(src)
    if "from './pieces.js'" in src: src = kits(src, ['pieces'])
    imps = re.findall(r"^import .*;$", src, flags=re.M); body = re.sub(r"^import .*;\n", '', src, flags=re.M)
    code = '\n'.join(dict.fromkeys(imports_c + imps)) + '\n' + common_body + '\n' + body
    code = code.replace("new URLSearchParams(location.search)", f"new URLSearchParams(location.search || '{query}')")
    head = HEAD.format(title=title, note=note, V=V).replace('<style>', '<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&display=swap" rel="stylesheet"><style>' + css, 1)
    open(os.path.join(out, name), 'w', encoding='utf-8').write(head + code + '\n</script></body></html>\n')
hud('hud-lane.html', 'The HUD in the new look', 'The approved HUD over the new look, in a Gatelands lane. ?frame=metal|carved|bare. Drag to look.', 'street.js', '?scene=lane&frame=metal')
hud('hud-hall.html', 'The HUD inside a gate', 'The approved HUD over the new look, a skeleton in a gate’s hall. ?frame=metal|carved|bare. Drag to look.', 'gate.js', '?scene=hall&view=hall&frame=metal')
build('corruption-field.html', 'The world corrupted', 'The world’s corruption, 0 to 6 (L12, OG-145; F12): one Gatelands lane as each great gate is torn. The slider and the cast switch are top left; ?level=0..6, &cast=none|sky|world, &cam=field|hill|scale. Drag to look.', 'corruption-view.js', True, '?level=3')
build('seasons-field.html', 'The seasons in the land', 'The seasons in the land (L12, OG-139; F3): one Gatelands lane through the year. The year, the rows (OG-139’s four seasons or OG-140’s green all year) and the snow are top left; ?season=spring|summer|autumn|winter, &rows=full|gentle, &snow=0..1, &cam=field|high|hedge|scale. Drag to look.', 'seasons-view.js', True, '?season=autumn')
build('hours-lane.html', 'The hours of the day', 'The hours, island by island (L12, OG-137; F3): one Gatelands lane through a summer day and night. The hour, the night (A readable, B by the moon’s phase, C by phase with a starlit floor) and the moon are top left; ?hour=dawn|sunrise|midday|golden|twilight|moonlit|deep, &night=readable|phase|floor, &moon=0..1, &cam=field|hill|scale|high. Drag to look.', 'hours-view.js', True, '?hour=twilight')
build('weather-lane.html', 'Weather that matters', 'Weather that matters (L12, OG-138; F3): one Gatelands lane through OG-138’s nine conditions, a rainbow and a gate storm. The weather, how far you see (A a veil, B as drawn, C by kind) and the season are top left; ?wx=clear|partly|overcast|rain|heavy|storm|snow|blizzard|fog|rainbow|gate, &sight=veil|drawn|kind, &cam=field|hill|scale|high. Drag to look.', 'weather-view.js', True, '?wx=rain')
build('air-islands.html', 'Each island’s air', 'Each island’s air (L12, OG-140; F3): one viewpoint an island at a summer mid-afternoon, its light, sky, haze, grade, land and trees as one row. The island and the air (A one air, B each its own, C its mark always on) are top left; ?island=gatelands|mark|aurenne, &air=one|own|marked, &cam=vista|scale|high. Drag to look.', 'air-view.js', True, '?island=mark')
build('light-rooms.html', 'Light indoors', 'Light indoors (L12, OG-141; F2 and F3): one rule lights three rooms from what each records, its openings, fires and lamps, at four hours. ?room=cottage|longhouse|home, &hour=morning|noon|golden|night, &mode=even|sources|eye (A the eye wide open, B the sources alone, C the sources and the eye half open), &view=room|scale, &hand=1. Drag to look.', 'light-view.js', True, '?room=cottage&hour=night&mode=eye')
build('light-halls.html', 'Lighting the halls', 'Lighting the halls (L12, OG-141; F2 and F3): the fixtures a hall carries by night, under the lights and the eye half open (C on #765). ?hall=guild|alehall|tavern|inn, &fix=own|torches|island (A the room’s own, B torches on every wall, C each island’s own: Gatelands candle sconces, the Mark’s torches, Aurenne’s lamp stands and wall lamps), &hour=night|golden|noon, &view=hall|scale|crowd. Drag to look.', 'halls-view.js', True, '?hall=guild&fix=island')
print('ok')
