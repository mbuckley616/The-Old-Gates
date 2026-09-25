#!/usr/bin/env python3
"""Extract every inline <script> block from index.html and syntax-check it with node.
Exit 1 on the first failure. Run before every commit; CI runs it on push."""
import re, subprocess, sys, tempfile, os
path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'index.html')
src = open(path, encoding='utf-8').read()
blocks = re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', src, re.S)
ok = True
for i, b in enumerate(blocks):
    with tempfile.NamedTemporaryFile('w', suffix=f'.blk{i}.js', delete=False, encoding='utf-8') as f:
        f.write(b); tmp = f.name
    r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
    os.unlink(tmp)
    if r.returncode != 0:
        ok = False; print(f'block {i}: FAIL\n{r.stderr[:1200]}')
    else:
        print(f'block {i}: OK ({len(b):,} chars)')
sys.exit(0 if ok else 1)
