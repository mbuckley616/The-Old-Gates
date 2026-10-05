# Inline the parchment kit (kit.css, defs.html, copied from docs/prototypes/ui via creator), the open book's CSS (from
# docs/prototypes/books/src.html) and the game's own data (current.json from shoot-current.mjs) into src.html -> index.html.
import json, pathlib, re
h = pathlib.Path(__file__).parent
s = (h/'src.html').read_text(encoding='utf-8')
books = (h/'..'/'books'/'src.html').read_text(encoding='utf-8')
tome = books[books.index(':root{--leaf:'):books.index('.turn span')]
tome += re.search(r'\.turn span\{[^}]*\}', books).group(0)
d = json.loads((h/'current.json').read_text(encoding='utf-8'))
s = s.replace('/*KIT*/', (h/'kit.css').read_text(encoding='utf-8')).replace('/*TOME*/', tome).replace('<!--DEFS-->', (h/'defs.html').read_text(encoding='utf-8'))
s = s.replace('/*DATA*/', 'const DATA=' + json.dumps(d, ensure_ascii=False) + ';')
(h/'index.html').write_text(s, encoding='utf-8')
