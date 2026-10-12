# python3 docs/prototypes/levelup/bundle.py OUTDIR (Session 769): one self-contained page per scene for a host that
# allows scripts only from a CDN (the claude.ai artifact). three.js comes from jsDelivr at the vendored version; the
# slice's own modules are inlined.
import re, sys, os
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
common = strip_common(open(os.path.join(here, 'common.js')).read()) + '\n' + strip_common(open(os.path.join(here, 'people.js')).read())
imports_c = re.findall(r"^import .*;$", common, flags=re.M)
common_body = re.sub(r"^import .*;\n", '', common, flags=re.M)
def build(name, title, note, srcfile, use_common, query=''):
    src = open(os.path.join(here, srcfile)).read()
    if use_common:
        s = scene(src); imps = re.findall(r"^import .*;$", s, flags=re.M); body = re.sub(r"^import .*;\n", '', s, flags=re.M)
        allimps = list(dict.fromkeys(imports_c + imps)); code = '\n'.join(allimps) + '\n' + common_body + '\n' + body
    else: code = src
    if query: code = code.replace("new URLSearchParams(location.search)", f"new URLSearchParams(location.search || '{query}')")
    open(os.path.join(out, name), 'w').write(HEAD.format(title=title, note=note, V=V) + code + '\n</script></body></html>\n')
build('vista.html', 'The Gatelands vista', 'The hero vista. Drag to look.', 'main.js', False)
build('lane.html', 'A village lane', 'A village lane at eye level. Drag to look.', 'street.js', True)
build('gate.html', 'An old gate', 'An old gate, from the path: the outer arch is 100 m high. Drag to look.', 'gate.js', True, '?view=gate')
build('door.html', 'At the gate', 'At the door of an old gate: the slit is 24 m high. Drag to look.', 'gate.js', True, '?view=gate&cam=foot')
build('people.html', 'Markfolk from a genome', 'Markfolk from a genome (MakeHuman body, our wardrobe). Drag to look.', 'lineup.js', True)
build('hall.html', 'Inside a gate', 'Inside a gate: the vault is 50 m up. Drag to look.', 'gate.js', True, '?view=hall')
print('ok')
