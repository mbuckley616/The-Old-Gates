#!/usr/bin/env python3
"""Show or bump the build tag in index.html.
  python3 scripts/tag.py          -> prints the current tag, e.g. s148
  python3 scripts/tag.py bump     -> s148 -> s149 (in place)
  python3 scripts/tag.py set s150 -> sets it explicitly"""
import re, sys, os
path = os.path.join(os.path.dirname(__file__), '..', 'index.html')
src = open(path, encoding='utf-8').read()
m = re.search(r'build (s\d+)</span>', src)
if not m: sys.exit('no build tag found')
cur = m.group(1)
if len(sys.argv) == 1: print(cur); sys.exit(0)
new = f's{int(cur[1:])+1}' if sys.argv[1] == 'bump' else sys.argv[2]
assert src.count(f'build {cur}</span>') == 1
open(path, 'w', encoding='utf-8').write(src.replace(f'build {cur}</span>', f'build {new}</span>'))
print(f'{cur} -> {new}')
