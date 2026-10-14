#!/usr/bin/env python3
"""Make the classic-script build of three.js 0.170 that the new look loads (Session 822, card F1).

three.js stopped shipping a classic (non-module) build after r160, and the game is plain classic scripts that a downloaded
folder opens by double-clicking, so no `type=module` and no fetch over file://. This turns the ES module build,
build/three.module.min.js of the npm package three@0.170.0, into one classic script that sets `window.THREE`:
the module body goes inside a function, and its closing `export{a as B,…}` becomes `return{B:a,…}`. No addons are
bundled; F1 needs none (the game merges its geometry without BufferGeometryUtils).

  python3 scripts/three_bundle.py            writes vendor/three.r170.min.js
  python3 scripts/three_bundle.py --check    exits 1 if the committed bundle is not what this script makes

The source is the copy the prototypes already vendor (docs/prototypes/levelup/vendor/three.module.min.js); if it is
missing, the npm tarball is fetched. Either way its SHA-256 must match the pin below, so the output is the same on
every machine."""
import hashlib, io, os, re, sys, tarfile, urllib.request

VERSION = '0.170.0'
MODULE_SHA256 = '08fd7545d13d2c7fb65ab691530a802dafefd638596501854f267d0fb13c39e7'
TARBALL = f'https://registry.npmjs.org/three/-/three-{VERSION}.tgz'
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LOCAL = os.path.join(ROOT, 'docs', 'prototypes', 'levelup', 'vendor', 'three.module.min.js')
OUT = os.path.join(ROOT, 'vendor', 'three.r170.min.js')


def source():
    if os.path.exists(LOCAL):
        data = open(LOCAL, 'rb').read()
    else:
        tgz = urllib.request.urlopen(TARBALL).read()
        with tarfile.open(fileobj=io.BytesIO(tgz)) as t:
            data = t.extractfile('package/build/three.module.min.js').read()
    if hashlib.sha256(data).hexdigest() != MODULE_SHA256:
        sys.exit(f'three.module.min.js is not three@{VERSION} (SHA-256 differs)')
    return data.decode('utf-8')


def bundle(src):
    if re.search(r'(^|[;}\s])import[\s{*]', src) or 'import.meta' in src:
        sys.exit('the module imports something; a classic bundle of it would need those too')
    m = re.search(r'export\{([^}]*)\};?\s*$', src)
    if not m:
        sys.exit('no closing export{…} found')
    pairs = []
    for part in m.group(1).split(','):
        bits = part.strip().split(' as ')
        local, name = bits[0].strip(), bits[-1].strip()
        pairs.append(f'{name}:{local}')
    lic = re.match(r'/\*\*.*?\*/\s*', src, re.S)
    head = lic.group(0) if lic else ''
    body = src[len(head):m.start()]
    return (head + f'/* three.js {VERSION} as one classic script, made by scripts/three_bundle.py from build/three.module.min.js */\n'
            + 'window.THREE=(function(){"use strict";' + body + '\nreturn {'
            + ','.join(pairs) + '};})();\n')


if __name__ == '__main__':
    out = bundle(source())
    if '--check' in sys.argv:
        same = os.path.exists(OUT) and open(OUT, encoding='utf-8').read() == out
        print('vendor/three.r170.min.js: ' + ('matches' if same else 'DIFFERS from what the script makes'))
        sys.exit(0 if same else 1)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(out)
    print(f'wrote vendor/three.r170.min.js ({len(out.encode()):,} bytes)')
