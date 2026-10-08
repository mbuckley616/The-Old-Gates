# Inline the parchment kit (kit.css, defs.html, copied from docs/prototypes/ui via saves) and today's numbers
# (current.json from shoot-current.mjs) into src.html -> index.html.
import json, pathlib
h = pathlib.Path(__file__).parent
s = (h/'src.html').read_text(encoding='utf-8')
d = json.loads((h/'current.json').read_text(encoding='utf-8'))
s = s.replace('/*KIT*/', (h/'kit.css').read_text(encoding='utf-8')).replace('<!--DEFS-->', (h/'defs.html').read_text(encoding='utf-8'))
s = s.replace('/*DATA*/', 'const DATA=' + json.dumps(d, ensure_ascii=False) + ';')
(h/'index.html').write_text(s, encoding='utf-8')
