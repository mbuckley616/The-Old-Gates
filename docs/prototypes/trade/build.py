# Inline the parchment kit (kit.css, defs.html, copied from docs/prototypes/ui) into src.html -> index.html.
import pathlib
h = pathlib.Path(__file__).parent
s = (h/'src.html').read_text(encoding='utf-8')
s = s.replace('/*KIT*/', (h/'kit.css').read_text(encoding='utf-8')).replace('<!--DEFS-->', (h/'defs.html').read_text(encoding='utf-8'))
(h/'index.html').write_text(s, encoding='utf-8')
