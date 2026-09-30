#!/usr/bin/env python3
"""Cut index.html's one inline script into plain <script src> files (backlog K, step 1; docs/design/split-plan.md).

  python3 scripts/split.py --dry-run          print the table of files, line ranges and sizes; write nothing
  python3 scripts/split.py --check            split into a temp folder, join it back, prove the sha256 matches
  python3 scripts/split.py --out DIR          write DIR/index.html and DIR/js/NN-name.js (a copy to test against)
  python3 scripts/split.py                    the real thing: write js/ next to index.html and rewrite index.html
  [--src PATH]                                the index.html to split (default: the repo's)

The cut points are PATTERNS, not marker comments: each entry in CUTS is the first line of the region's first
statement. Main keeps moving until switch-over day, so every anchor is checked against the code as it is then:
it must match exactly one line, that line must begin a Program-level statement (acorn says so — Node's bundled
copy, via --expose-internals), and no statement or comment may straddle the cut. Any of those failing stops the
script and names the anchor. The cut is then moved up over the blank and comment-only lines directly above the
anchor (never past the end of the previous statement), so a region's banner comment travels with it.

Each piece is the exact byte range of the source (the CSS and markup stay in index.html), and the tags are
plain classic scripts sharing globals exactly as one script did — no modules, no fetch, so a downloaded copy
still opens by double-clicking. js/manifest.json records what was done; scripts/join.py reverses it.
"""
import argparse, hashlib, json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
JS_DIR = 'js'

# (file name, anchor). The anchor is matched against the start of a line of the script (no leading whitespace:
# top-level statements start in column 0). The first file has no anchor: it starts where the script starts.
# Two-digit prefixes are the load order and nothing else; the gaps leave room to slot a file in later.
CUTS = [
    ('10-player.js',           None),                          # renderer boot, player state, combat rules
    ('12-character.js',        'const ATTRS={'),               # attributes, archetypes, level-up
    ('14-items.js',            'const EQ={'),                  # EQ, BAG, item tables, loot
    ('16-viewmodel.js',        'let vmSword=null'),            # first-person hands and weapons
    ('20-quests.js',           'function mkTex('),             # helpers, legacy terrain/portals, quests, journal
    ('22-dialogue.js',         'const NPC_DEF=['),             # dialogue, shops' talk, zone state, worldState
    ('24-forts.js',            'const FORT_EXTERIORS = {'),    # FORT_EXTERIORS data
    ('30-plants.js',           'const HIDDEN_UNLOCK_COUNT='),  # herbs and plant kit
    ('32-people.js',           'const PEOPLE_RIGS='),          # SK, personGenome, buildPerson, tickPeople
    ('34-creatures.js',        'const WOLF_KINDS={'),          # wolves, spiders, bears
    ('40-legacy-zones.js',     'const ASHENMOOR_GATES='),      # gates, Ashenmoor, Hearthwick, Bealach
    ('42-zone-enemies.js',     'const BOSSES={'),              # bosses, zone enemies, strike resolve
    ('44-legacy-towns.js',     'const PROP_BUILDERS={'),       # props, wilderness, forest, Ironhaven, ZONE_BUILDERS
    ('50-travel.js',           'function goToZone('),          # travel, buffs, clock, day/night, interact
    ('52-dungeon-gen.js',      'const FLOOR2_Y='),             # footholds, dungeon generation, dSolid
    ('54-thirdperson.js',      'let thirdPerson=false'),       # TP body and camera
    ('56-dungeon-build.js',    'let _exhaustedStrike='),       # dungeon shell, furniture, buildDungeon
    ('58-interiors-legacy.js', 'const intTX={'),               # legacy room kits, buildInterior
    ('60-shop.js',             'function openShop(){'),        # shop, loot, stash, sleep
    ('62-actions.js',          'function doBash(){'),          # attack, cast, potions, HUD, minimap
    ('64-spells.js',           'const SPELLS=['),              # spells, sigils, spell fx
    ('66-hub.js',              'let _bookState={'),            # book reader, log, hub, inventory
    ('68-dungeon-misc.js',     'const _LPS='),                 # decor, traps, portal fx, lockpicking, lair, death
    ('70-saves.js',            'const SAVE_VERSION='),         # SS, save/load
    ('72-audio.js',            'let AX=null'),                 # AudioContext, sfx
    ('74-strikes.js',          'function applySpellDamage('),  # strike damage, variants
    ('76-music.js',            'function sndSpell('),          # spell sounds, the music by place
    ('78-placeholder-zones.js','let _stepT='),                 # footsteps, registerPlaceholderZone data
    ('80-world.js',            'var WORLD=(()=>{'),            # the WORLD IIFE, whole
    ('90-main.js',             'buildOW();'),                  # boot calls, dev helpers, K, PERF, the loop
    ('92-creator.js',          'function _enterGame(){'),      # _enterGame, character creator, title buttons
    ('94-worldmap.js',         'const WM={'),                  # world map
    ('96-animdebug.js',        '(function buildAnimDebugPanel('),  # the backtick panel
]

# The acorn pass: Program-level statement lines and comment lines, as JSON.
ACORN_JS = r"""
const fs = require('fs');
let acorn; try { acorn = require('internal/deps/acorn/acorn/dist/acorn'); } catch (e) { acorn = require('acorn'); }
const src = fs.readFileSync(process.argv[2], 'utf8');
const lines = src.split('\n');
const comments = [];
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', locations: true,
  onComment: (block, text, start, end, sl, el) => comments.push({ block, sl, el }) });
const out = { statements: [], comments: [] };
for (const st of ast.body) out.statements.push({ type: st.type, line: st.loc.start.line, col: st.loc.start.column, endLine: st.loc.end.line });
for (const c of comments) {
  const first = lines[c.sl.line - 1], last = lines[c.el.line - 1];
  out.comments.push({ line: c.sl.line, endLine: c.el.line,
    leadingBlank: /^\s*$/.test(first.slice(0, c.sl.column)), trailingBlank: /^\s*$/.test(last.slice(c.el.column)) });
}
process.stdout.write(JSON.stringify(out));
"""


def fail(msg):
    sys.exit('split.py: ' + msg)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def read(path):
    with open(path, 'rb') as f:
        return f.read().decode('utf-8')


def find_script(html):
    """The one inline <script> block. Returns (open_start, body_start, body_end, close_end) as str offsets."""
    opens = [m for m in re.finditer(r'<script(?![^>]*\ssrc)[^>]*>', html)]
    if not opens:
        return None
    if len(opens) != 1:
        fail(f'expected one inline <script> block, found {len(opens)}')
    m = opens[0]
    if m.group(0) != '<script>' or html[m.end()] != '\n':
        fail('the inline block must open with a bare <script> tag followed by a newline')
    close = html.find('</script>', m.end())
    if close < 0:
        fail('the inline block has no </script>')
    if html[close - 1] != '\n':
        fail('the inline block must end with a newline before </script>')
    return m.start(), m.end() + 1, close, close + len('</script>')


def local_tags(html):
    return re.findall(r'<script src="(' + JS_DIR + r'/[^"]+)"></script>', html)


def acorn_pass(body):
    with tempfile.TemporaryDirectory() as d:
        js = os.path.join(d, 'acorn.js'); srcp = os.path.join(d, 'script.js')
        open(js, 'w', encoding='utf-8').write(ACORN_JS)
        with open(srcp, 'w', encoding='utf-8', newline='') as f:
            f.write(body)
        r = subprocess.run(['node', '--expose-internals', '--no-warnings', js, srcp], capture_output=True, text=True)
    if r.returncode != 0:
        fail('acorn failed to parse the script:\n' + r.stderr[-2000:])
    return json.loads(r.stdout)


def plan(body):
    """Decide the cut lines. Returns [(name, first_line, last_line)] with 1-based inclusive script lines."""
    for ch, what in (('\r', 'a carriage return'), (' ', 'U+2028'), (' ', 'U+2029')):
        if ch in body:
            fail(f'the script holds {what}; acorn and this script would count lines differently')
    lines = body.split('\n')
    if lines[-1] != '':
        fail('the script must end with a newline')
    lines = lines[:-1]
    n = len(lines)
    ast = acorn_pass(body)
    stmts = ast['statements']
    if not stmts:
        fail('no top-level statements')
    # lines that are blank or hold nothing but comment
    covered = [False] * (n + 2)
    for i, ln in enumerate(lines, 1):
        if ln.strip() == '':
            covered[i] = True
    for c in ast['comments']:
        a, b = c['line'], c['endLine']
        for i in range(a + 1, b):
            covered[i] = True
        if a == b:
            if c['leadingBlank'] and c['trailingBlank']:
                covered[a] = True
        else:
            if c['leadingBlank']:
                covered[a] = True
            if c['trailingBlank']:
                covered[b] = True
    cuts = []
    for name, anchor in CUTS:
        if anchor is None:
            cuts.append((name, 1)); continue
        hits = [i for i, ln in enumerate(lines, 1) if ln.startswith(anchor)]
        if len(hits) != 1:
            fail(f'{name}: anchor {anchor!r} matches {len(hits)} lines' + (f' ({", ".join(map(str, hits))})' if hits else '') + ', not one')
        L = hits[0]
        starts = [s for s in stmts if s['line'] == L]
        if not starts or starts[0]['col'] != 0:
            inside = [s for s in stmts if s['line'] < L <= s['endLine']]
            where = f"; it sits inside the {inside[0]['type']} that starts at line {inside[0]['line']} (is the if(REN){{ wrapper back?)" if inside else ''
            fail(f'{name}: line {L} ({anchor!r}) does not begin a top-level statement{where}')
        straddle = [s for s in stmts if s['line'] < L <= s['endLine']]
        if straddle:
            fail(f'{name}: a statement starting at line {straddle[0]["line"]} runs across line {L}')
        prev_end = max((s['endLine'] for s in stmts if s['endLine'] < L), default=0)
        C = L
        while C - 1 > prev_end and covered[C - 1]:
            C -= 1
        for c in ast['comments']:
            if c['line'] < C <= c['endLine']:
                fail(f'{name}: a comment starting at line {c["line"]} runs across the cut at line {C}')
        if cuts and C <= cuts[-1][1]:
            fail(f'{name}: its cut at line {C} is not after {cuts[-1][0]}\'s at line {cuts[-1][1]}')
        cuts.append((name, C))
    out = []
    for i, (name, a) in enumerate(cuts):
        b = cuts[i + 1][1] - 1 if i + 1 < len(cuts) else n
        out.append((name, a, b))
    return out


def pieces(body, layout):
    """The exact text of each piece, in order; they concatenate back to body."""
    lines = body.split('\n')[:-1]
    out = []
    for name, a, b in layout:
        out.append((name, '\n'.join(lines[a - 1:b]) + '\n'))
    assert ''.join(t for _, t in out) == body
    return out


def split_html(html, layout_pieces):
    open_start, body_start, body_end, close_end = find_script(html)
    tags = '\n'.join(f'<script src="{JS_DIR}/{name}"></script>' for name, _ in layout_pieces)
    return html[:open_start] + tags + html[close_end:]


def write_split(html, out_dir, src_path):
    open_start, body_start, body_end, close_end = find_script(html)
    body = html[body_start:body_end]
    layout = plan(body)
    ps = pieces(body, layout)
    jsdir = os.path.join(out_dir, JS_DIR)
    os.makedirs(jsdir, exist_ok=True)
    stale = [f for f in os.listdir(jsdir) if f.endswith('.js') and f not in {n for n, _ in ps}]
    if stale:
        fail(f'{jsdir} already holds files not in the layout: {", ".join(sorted(stale))}')
    files = []
    for (name, text), (_, a, b) in zip(ps, layout):
        data = text.encode('utf-8')
        with open(os.path.join(jsdir, name), 'wb') as f:
            f.write(data)
        files.append({'name': name, 'lines': [a + line_of(html, body_start) - 1, b + line_of(html, body_start) - 1],
                      'bytes': len(data), 'sha256': sha(data)})
    manifest = {
        'what': 'index.html\'s inline script cut into these files, in load order; scripts/join.py reverses it',
        'source': os.path.relpath(src_path, ROOT), 'source_sha256': sha(html.encode('utf-8')),
        'source_lines': html.count('\n'), 'script_open': '<script>\n', 'script_close': '</script>',
        'files': files}
    with open(os.path.join(jsdir, 'manifest.json'), 'w', encoding='utf-8') as f:
        head = {k: v for k, v in manifest.items() if k != 'files'}
        f.write(json.dumps(head, indent=1, ensure_ascii=False)[:-2] + ',\n "files": [\n  '
                + ',\n  '.join(json.dumps(x, ensure_ascii=False) for x in files) + '\n ]\n}\n')
    new_html = split_html(html, ps)
    with open(os.path.join(out_dir, 'index.html'), 'wb') as f:
        f.write(new_html.encode('utf-8'))
    return layout, ps, manifest


def line_of(html, offset):
    return html.count('\n', 0, offset) + 1


def table(html, layout, ps):
    open_start, body_start, body_end, close_end = find_script(html)
    base = line_of(html, body_start) - 1
    total = 0
    print(f'{"file":26} {"index.html lines":>18} {"n":>6} {"bytes":>9}  first line')
    for (name, a, b), (_, text) in zip(layout, ps):
        nb = len(text.encode('utf-8')); total += nb
        first = next((l for l in text.split('\n') if l.strip() and not l.lstrip().startswith('//')), '')[:60]
        print(f'{JS_DIR + "/" + name:26} {f"{a + base}–{b + base}":>18} {b - a + 1:>6} {nb:>9,}  {first}')
    print(f'{len(layout)} files, {total:,} bytes of script; index.html keeps {open_start + len(html) - close_end:,} bytes of markup and CSS')


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--src', default=os.path.join(ROOT, 'index.html'))
    ap.add_argument('--out', help='write the split copy here instead of in place')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--check', action='store_true', help='split to a temp folder, join back, compare sha256')
    args = ap.parse_args()
    src = os.path.abspath(args.src)
    html = read(src)
    if find_script(html) is None:
        if local_tags(html):
            print(f'{os.path.relpath(src, ROOT)} is already split ({len(local_tags(html))} <script src> tags, no inline block); nothing to do')
            sys.exit(0)
        fail('no inline <script> block and no js/ tags in ' + src)
    if args.dry_run:
        _, body_start, body_end, _ = find_script(html)
        body = html[body_start:body_end]
        layout = plan(body); table(html, layout, pieces(body, layout)); return
    if args.check:
        sys.path.insert(0, HERE)
        import join as joiner
        with tempfile.TemporaryDirectory() as d:
            layout, ps, manifest = write_split(html, d, src)
            table(html, layout, ps)
            joined = joiner.join(os.path.join(d, 'index.html'))
            h0, h1 = sha(html.encode('utf-8')), sha(joined.encode('utf-8'))
            print(f'source sha256 {h0}\njoined sha256 {h1}')
            if h0 != h1:
                fail('the joined copy differs from the source')
            print('join: byte-identical')
            r = subprocess.run([sys.executable, os.path.join(HERE, 'parsecheck.py'), os.path.join(d, 'index.html')], capture_output=True, text=True)
            print(r.stdout.strip().split('\n')[-1])
            if r.returncode != 0:
                fail('parsecheck failed on the split copy:\n' + r.stdout + r.stderr)
        return
    out_dir = os.path.abspath(args.out) if args.out else os.path.dirname(src)
    if not args.out and os.path.isdir(os.path.join(out_dir, JS_DIR)):
        fail(f'{JS_DIR}/ already exists next to {src}; remove it or use --out')
    layout, ps, manifest = write_split(html, out_dir, src)
    table(html, layout, ps)
    print(f'wrote {out_dir}/index.html and {out_dir}/{JS_DIR}/ ({len(ps)} files + manifest.json)')


if __name__ == '__main__':
    main()
