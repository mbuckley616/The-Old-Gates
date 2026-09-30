#!/usr/bin/env python3
"""Syntax-check the game's script with node. Exit 1 on the first failure. Run before every commit; CI runs it on push.

Works on both layouts (backlog K):
  - every inline <script> block in index.html, as always;
  - after the split, every js/*.js a <script src="js/…"> tag names, in tag order, then the CONCATENATION of them
    in that order — a top-level let/const declared in two files is a SyntaxError only the concatenation shows,
    because all classic scripts share one global lexical scope;
  - and it fails if a js/*.js sits on disk that no tag names, or a tag names a file that is missing.
  python3 scripts/parsecheck.py [PATH]   PATH defaults to the repo's index.html; js/ is looked up beside it."""
import re, subprocess, sys, tempfile, os
path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'index.html')
base = os.path.dirname(os.path.abspath(path))
src = open(path, encoding='utf-8').read()
ok = True


def node_check(text, label, suffix):
    global ok
    with tempfile.NamedTemporaryFile('w', suffix=suffix, delete=False, encoding='utf-8', newline='') as f:
        f.write(text); tmp = f.name
    r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
    os.unlink(tmp)
    if r.returncode != 0:
        ok = False; print(f'{label}: FAIL\n{r.stderr[:1200].replace(tmp, label)}')
    else:
        print(f'{label}: OK ({len(text):,} chars)')


blocks = re.findall(r'<script(?![^>]*\ssrc)[^>]*>(.*?)</script>', src, re.S)
for i, b in enumerate(blocks):
    node_check(b, f'block {i}', f'.blk{i}.js')

tags = re.findall(r'<script src="(js/[^"]+)"></script>', src)
if tags:
    texts = []
    for t in tags:
        p = os.path.join(base, t)
        if not os.path.exists(p):
            ok = False; print(f'{t}: MISSING (a tag names it, the file is not there)'); continue
        text = open(p, encoding='utf-8', newline='').read()
        texts.append(text); node_check(text, t, '.' + os.path.basename(t))
    jsdir = os.path.join(base, 'js')
    if os.path.isdir(jsdir):
        stray = sorted(f for f in os.listdir(jsdir) if f.endswith('.js') and 'js/' + f not in tags)
        if stray:
            ok = False; print('js/ holds files no tag names: ' + ', '.join(stray))
    if ok:
        node_check(''.join(texts), f'concatenation of {len(texts)} files', '.all.js')
elif not blocks:
    ok = False; print('no inline <script> block and no js/ tags in ' + path)
sys.exit(0 if ok else 1)
