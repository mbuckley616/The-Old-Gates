#!/usr/bin/env python3
"""Reassemble a split index.html (scripts/split.py) into the one-file build and prove it is byte-identical.

  python3 scripts/join.py [--src index.html] [--against ORIGINAL] [--out FILE]

Reads the <script src="js/…"> tags of the split index.html in order, checks them against js/manifest.json,
concatenates the pieces between the original <script> and </script> lines with the untouched head and tail, and
prints the sha256 of the result next to the source hash the manifest recorded (or the hash of --against, the
pre-split file). Exit 1 if they differ. --out writes the joined file (for node --check, or to go back).
"""
import argparse, hashlib, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TAG = re.compile(r'<script src="(js/[^"]+)"></script>')


def fail(msg):
    sys.exit('join.py: ' + msg)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def read(path):
    with open(path, 'rb') as f:
        return f.read().decode('utf-8')


def join(index_path):
    """The joined one-file build as text. Fails loudly on any disagreement between the tags and the manifest."""
    html = read(index_path)
    base = os.path.dirname(os.path.abspath(index_path))
    tags = list(TAG.finditer(html))
    if not tags:
        fail(f'{index_path} has no <script src="js/…"> tags; is it already the one-file build?')
    if re.search(r'<script(?![^>]*\ssrc)[^>]*>', html):
        fail(f'{index_path} still has an inline <script> block next to its js/ tags')
    mpath = os.path.join(base, 'js', 'manifest.json')
    if not os.path.exists(mpath):
        fail('no js/manifest.json beside ' + index_path)
    manifest = json.load(open(mpath, encoding='utf-8'))
    names = [m.group(1)[3:] for m in tags]
    listed = [f['name'] for f in manifest['files']]
    if names != listed:
        fail(f'the tag order {names} is not the manifest\'s {listed}')
    for i in range(1, len(tags)):
        between = html[tags[i - 1].end():tags[i].start()]
        if between != '\n':
            fail(f'unexpected text between the {names[i - 1]} and {names[i]} tags: {between!r}')
    on_disk = sorted(f for f in os.listdir(os.path.join(base, 'js')) if f.endswith('.js'))
    if on_disk != sorted(names):
        fail(f'js/ holds {on_disk}, the tags name {sorted(names)}')
    body = ''.join(read(os.path.join(base, 'js', n)) for n in names)
    return html[:tags[0].start()] + manifest['script_open'] + body + manifest['script_close'] + html[tags[-1].end():]


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--src', default=os.path.join(ROOT, 'index.html'))
    ap.add_argument('--against', help='the pre-split index.html to compare with (default: the manifest\'s recorded hash)')
    ap.add_argument('--out', help='write the joined file here')
    args = ap.parse_args()
    joined = join(args.src)
    data = joined.encode('utf-8')
    manifest = json.load(open(os.path.join(os.path.dirname(os.path.abspath(args.src)), 'js', 'manifest.json'), encoding='utf-8'))
    want = sha(open(args.against, 'rb').read()) if args.against else manifest['source_sha256']
    got = sha(data)
    print(f'joined  {got}  ({len(data):,} bytes, {joined.count(chr(10)):,} lines)')
    print(f'{"against" if args.against else "recorded"} {want}')
    if args.out:
        with open(args.out, 'wb') as f:
            f.write(data)
        print('wrote ' + args.out)
    if got != want:
        fail('the joined file is NOT identical to the original')
    print('byte-identical')


if __name__ == '__main__':
    main()
