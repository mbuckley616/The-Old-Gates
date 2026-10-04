#!/usr/bin/env python3
"""Dissolve the WORLD IIFE (js/80-world.js) into plain files by area (backlog K, step 2; docs/design/split-plan.md §6 B).

  python3 scripts/split_world.py --dry-run     print the table of files, line ranges and sizes; write nothing
  python3 scripts/split_world.py --check       run on a temp copy, rebuild 80-world.js from the pieces, prove sha256 matches
  python3 scripts/split_world.py --out DIR     write the dissolved copy (index.html + js/) to DIR, to test against
  python3 scripts/split_world.py               the real thing, in place: js/8N-world-*.js replace js/80-world.js
  [--src PATH]                                 the index.html to work on (default: the repo's)

What it does, and why it is a no-op for the game:
  - `var WORLD=(()=>{ … return {…}; })();` becomes the body's statements at the top level of several files, in the
    same order, followed by `var WORLD={…};` (the very same object literal, getters and all) at the foot of the last
    file. Every classic script shares one global scope, so a name that was private to the IIFE is now a global the
    same code reaches the same way; the one thing that changes is that a name can now collide with a global another
    file declares. The four that do (DOORS, KEYS, SG, tickNPCs) are renamed inside the world's code by the parser
    (identifier references only, never a property name or a string; the export keeps its old name: `DOORS:CELL_DOORS`).
  - Function hoisting: inside the IIFE a load-time statement could call a function declared anywhere in the body;
    across files it can only reach an earlier file. The script refuses to cut where a load-time call (direct, or
    through the functions it calls, or through a callback passed to a call) reaches a function in a later file.
  - A top-level let/const must not be declared in two files (SyntaxError); parsecheck's concatenation check sees it,
    and this script checks the body's names against every other file first and names the clash.
  - Nothing is re-indented: the pieces are exact line ranges of the source, so the rebuild is byte-identical.

The cut points are PATTERNS (the first line of a region's first statement), checked by the parser as split.py
does; the cut moves up over the comment and blank lines directly above the anchor, so a `// ── banner ──` travels
with its region. js/world-manifest.json records what was done, and rebuild() reverses it (scripts/join.py uses
it, so the one-file build is still provable from the pieces).
"""
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
JS_DIR = 'js'
MANIFEST = 'world-manifest.json'
WORLD_OPEN = 'var WORLD=(()=>{'
WORLD_CLOSE = '})();'
RETURN_PREFIX = '  return '

# (file name, anchor). The anchor is the start of a line of the body (statements start in column 2 inside the IIFE).
# The first file has no anchor: it starts at the top (the banner comment above `var WORLD=` goes with it).
CUTS = [
    ('80-world-terrain.js',    None),                                   # regions, noise, height, colour, geometry, chunks, sky
    ('81-world-cells.js',      '  function camSolid('),                 # solids, the mask, cell data, landmasses, cell load
    ('82-world-structures.js', '  function fortKeepGeoHi('),            # fort compounds, buildings, churches, keeps, walls
    ('83-world-generator.js',  '  const META_ID='),                     # dialog pools, the settlement generator, the maps
    ('84-world-interiors.js',  '  let INT_NPCS='),                      # interior extras, doors inside buildings, ports
    ('85-world-sea.js',        '  const SHIP_MAT='),                    # ships, sea sounds, wrecks, wildlife, other ships
    ('86-world-crime.js',      '  const FP='),                          # footprints, houses, cellars, the crime system, windows
    ('87-world-quests.js',     '  const BOARDERS='),                    # boarding, town quests, guilds, sigils, nations, the war
    ('88-world-ticks.js',      '  function tutTownSite('),              # the town line, the sea line, ticks, the WORLD object
]

# inner name -> new name. These four are declared inside the IIFE and as globals in other files (52-dungeon-gen.js,
# 34-creatures.js, 50-travel.js): at the top level they would be a SyntaxError (const) or silently replace the other
# file's function (tickNPCs). Renamed by the parser on identifier references only.
RENAMES = {
    'DOORS': 'CELL_DOORS',       # the dungeon doors of the loaded cells (52-dungeon-gen.js has the dungeon's own DOORS)
    'KEYS': 'HELD_KEYS',         # the world's own held-key map (ships, swimming); 52-dungeon-gen.js has the dungeon's KEYS
    'SG': 'STAMP_G',             # the stamp grid's cell size (34-creatures.js has SG, a shape-kit table)
    'tickNPCs': 'tickTownNPCs',  # the townsfolk's tick (50-travel.js has the legacy zones' tickNPCs)
}

# The acorn pass, as JSON: the IIFE's lines, its body's statements and comments, the identifier edits for a rename
# map, and the load-time reach of every non-function statement (which functions it can call before the next file loads).
ACORN_JS = r"""
const fs = require('fs');
let acorn, walk;
try { acorn = require('internal/deps/acorn/acorn/dist/acorn'); walk = require('internal/deps/acorn/acorn-walk/dist/walk'); }
catch (e) { acorn = require('acorn'); walk = require('acorn-walk'); }
const [,, srcPath, renamesJson, mode] = process.argv;
const renames = JSON.parse(renamesJson);
const src = fs.readFileSync(srcPath, 'utf8');
const lines = src.split('\n');
const comments = [];
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', locations: true,
  onComment: (block, text, start, end, sl, el) => comments.push({ block, sl, el }) });
const out = { comments: [], edits: [], collisions: [] };
for (const c of comments) {
  const first = lines[c.sl.line - 1], last = lines[c.el.line - 1];
  out.comments.push({ line: c.sl.line, endLine: c.el.line,
    leadingBlank: /^\s*$/.test(first.slice(0, c.sl.column)), trailingBlank: /^\s*$/.test(last.slice(c.el.column)) });
}
// identifier edits: every reference named in `renames` that is a binding or a reference, never a property name
const newNames = new Set(Object.values(renames));
// acorn-walk hands a binding identifier (a declared name, a parameter) to VariablePattern, not Identifier
const ident = (n, _s, anc) => {
  const p = anc[anc.length - 2];
  if (newNames.has(n.name)) out.collisions.push({ name: n.name, line: n.loc.start.line });
  if (!(n.name in renames)) return;
  // a shorthand property `{DOORS}`: acorn-walk visits only its value (a copy of the key), so that one visit writes
  // `DOORS:CELL_DOORS` over the range, keeping the property's name (the export) and renaming the reference
  if (p && p.type === 'Property' && p.shorthand) { out.edits.push({ start: n.start, end: n.end, text: n.name + ':' + renames[n.name] }); return; }
  if (p && p.type === 'MemberExpression' && p.property === n && !p.computed) return;
  if (p && (p.type === 'Property' || p.type === 'PropertyDefinition' || p.type === 'MethodDefinition') && p.key === n && !p.computed) {
    if (p.type === 'Property' && p.shorthand) out.edits.push({ start: n.start, end: n.end, text: n.name + ':' + renames[n.name] });
    return; }
  if (p && (p.type === 'LabeledStatement' || p.type === 'BreakStatement' || p.type === 'ContinueStatement')) return;
  out.edits.push({ start: n.start, end: n.end, text: renames[n.name] });
};
walk.ancestor(ast, { Identifier: ident, VariablePattern: ident });
// when reversing, `KEY:OLD` written by the forward pass goes back to the shorthand `KEY`
// never two edits on one range (the check above should make this a no-op)
{ const seen = new Set(); out.edits = out.edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }); }
if (mode === 'reverse') {
  walk.simple(ast, { Property(p) {
    if (!p.shorthand && !p.computed && p.key.type === 'Identifier' && p.value.type === 'Identifier' && (p.value.name in renames) && renames[p.value.name] === p.key.name)
      out.edits.push({ start: p.start, end: p.end, text: p.key.name, replacesProperty: true });
  } });
  out.edits = out.edits.filter(e => e.replacesProperty || !out.edits.some(o => o.replacesProperty && o.start <= e.start && e.end <= o.end));
}
if (mode === 'wrapped') {
  const st = ast.body.find(s => s.type === 'VariableDeclaration' && s.declarations.length === 1 && s.declarations[0].id.name === 'WORLD');
  if (!st) { out.error = 'no `var WORLD=` statement'; }
  else {
    const init = st.declarations[0].init;
    if (!init || init.type !== 'CallExpression' || init.callee.type !== 'ArrowFunctionExpression' || init.arguments.length) out.error = 'WORLD is not an arrow IIFE';
    else {
      const body = init.callee.body.body;
      const ret = body[body.length - 1];
      out.iife = { stmtLine: st.loc.start.line, stmtCol: st.loc.start.column, bodyOpenLine: init.callee.body.loc.start.line, endLine: st.loc.end.line,
        returnLine: ret.loc.start.line, returnCol: ret.loc.start.column, returnEndLine: ret.loc.end.line, returnIsLast: ret.type === 'ReturnStatement',
        argStart: ret.argument && ret.argument.start, argEnd: ret.argument && ret.argument.end, returnEnd: ret.end,
        topLevelOthers: ast.body.length - 1 };
      out.statements = body.map(s => ({ type: s.type, line: s.loc.start.line, col: s.loc.start.column, endLine: s.loc.end.line }));
      // declared names of the body (what becomes global), by kind
      const names = [];
      const addPat = (p, kind) => { if (!p) return; if (p.type === 'Identifier') names.push([p.name, kind]); else if (p.type === 'ObjectPattern') p.properties.forEach(q => addPat(q.type === 'RestElement' ? q.argument : q.value, kind)); else if (p.type === 'ArrayPattern') p.elements.forEach(e => addPat(e, kind)); else if (p.type === 'AssignmentPattern') addPat(p.left, kind); else if (p.type === 'RestElement') addPat(p.argument, kind); };
      for (const s of body) { if (s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration') names.push([s.id.name, s.type === 'FunctionDeclaration' ? 'function' : 'class']); else if (s.type === 'VariableDeclaration') s.declarations.forEach(d => addPat(d.id, s.kind)); }
      out.names = names;
      // load-time reach: for each non-function statement, the functions it can call synchronously (transitively)
      const fdecl = new Map(); body.forEach((s, i) => { if (s.type === 'FunctionDeclaration') fdecl.set(s.id.name, { i, line: s.loc.start.line, node: s }); });
      const syncCalls = (node, set) => { (function rec(n, allow) { if (!n || typeof n.type !== 'string') return;
        if ((n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression' || n.type === 'FunctionDeclaration') && !allow) return;
        if (n.type === 'CallExpression' || n.type === 'NewExpression') { if (n.callee.type === 'Identifier') set.add(n.callee.name);
          for (const a of n.arguments) { if (a.type === 'FunctionExpression' || a.type === 'ArrowFunctionExpression') rec(a.body, true); else rec(a, false); }
          rec(n.callee, false); return; }
        for (const k in n) { if (k === 'loc') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => rec(c, false)); else if (v && typeof v.type === 'string') rec(v, false); } })(node, false); };
      out.reach = [];
      for (const s of body) { if (s.type === 'FunctionDeclaration') continue;
        const seen = new Set(), queue = new Set(); syncCalls(s, queue); const via = new Map(); for (const q of queue) via.set(q, null);
        while (queue.size) { const name = queue.values().next().value; queue.delete(name); if (seen.has(name)) continue; seen.add(name);
          const d = fdecl.get(name); if (!d) continue; const more = new Set(); syncCalls(d.node.body, more);
          for (const m of more) if (!seen.has(m)) { queue.add(m); if (!via.has(m)) via.set(m, name); } }
        const reached = [...seen].filter(n => fdecl.has(n)).map(n => ({ fn: n, line: fdecl.get(n).line, via: via.get(n) }));
        if (reached.length) out.reach.push({ line: s.loc.start.line, reached });
      }
    }
  }
}
process.stdout.write(JSON.stringify(out));
"""


def fail(msg):
    sys.exit('split_world.py: ' + msg)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def read(path):
    """The file as text with LF line endings: a Windows checkout with core.autocrlf holds CRLF in the working copy
    while the index (what git commits and what the sha256 proof is about) holds LF. Outputs are written with LF."""
    with open(path, 'rb') as f:
        return f.read().decode('utf-8').replace('\r\n', '\n')


def write(path, text):
    with open(path, 'wb') as f:
        f.write(text.encode('utf-8'))


def tags_of(html):
    return re.findall(r'<script src="(' + JS_DIR + r'/[^"]+)"></script>', html)


def acorn_pass(text, renames, mode):
    with tempfile.TemporaryDirectory() as d:
        js = os.path.join(d, 'acorn.js'); srcp = os.path.join(d, 'script.js')
        write(js, ACORN_JS)
        with open(srcp, 'w', encoding='utf-8', newline='') as f:
            f.write(text)
        r = subprocess.run(['node', '--expose-internals', '--no-warnings', js, srcp, json.dumps(renames), mode],
                           capture_output=True, text=True, encoding='utf-8')
    if r.returncode != 0:
        fail('acorn failed to parse the script:\n' + r.stderr[-2000:])
    out = json.loads(r.stdout)
    if out.get('error'):
        fail(out['error'])
    return out


def apply_edits(text, edits):
    """Replace the ranges acorn gave; they never overlap and never add a newline. Acorn's offsets are UTF-16 code
    units (a JavaScript string's indices) and the file holds emoji, so the edits are applied on the UTF-16 form."""
    b = text.encode('utf-16-le')
    for e in sorted(edits, key=lambda e: e['start'], reverse=True):
        assert '\n' not in e['text']
        b = b[:e['start'] * 2] + e['text'].encode('utf-16-le') + b[e['end'] * 2:]
    return b.decode('utf-16-le')


def other_globals(base, html, world_name):
    """Top-level names declared by every other js/ file, name -> [(file, kind)]."""
    names = {}
    for t in tags_of(html):
        if t == JS_DIR + '/' + world_name:
            continue
        out = acorn_pass(read(os.path.join(base, t)), {}, 'wrapped-other') if False else None  # placeholder for clarity
    # one pass over the concatenation of the others is cheaper: parse each with the plain statement walker
    js = r"""
const fs=require('fs'); let acorn; try{acorn=require('internal/deps/acorn/acorn/dist/acorn');}catch(e){acorn=require('acorn');}
const out={}; for(const f of process.argv.slice(2)){ const ast=acorn.parse(fs.readFileSync(f,'utf8'),{ecmaVersion:'latest',sourceType:'script'});
  const add=(n,k)=>{(out[n]=out[n]||[]).push([require('path').basename(f),k]);};
  const pat=(p,k)=>{ if(!p) return; if(p.type==='Identifier') add(p.name,k); else if(p.type==='ObjectPattern') p.properties.forEach(q=>pat(q.type==='RestElement'?q.argument:q.value,k)); else if(p.type==='ArrayPattern') p.elements.forEach(e=>pat(e,k)); else if(p.type==='AssignmentPattern') pat(p.left,k); else if(p.type==='RestElement') pat(p.argument,k); };
  for(const s of ast.body){ if(s.type==='FunctionDeclaration'||s.type==='ClassDeclaration') add(s.id.name,s.type==='FunctionDeclaration'?'function':'class'); else if(s.type==='VariableDeclaration') s.declarations.forEach(d=>pat(d.id,s.kind)); } }
process.stdout.write(JSON.stringify(out));
"""
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, 'names.js'); write(p, js)
        files = [os.path.join(base, t) for t in tags_of(html) if t != JS_DIR + '/' + world_name]
        r = subprocess.run(['node', '--expose-internals', '--no-warnings', p] + files, capture_output=True, text=True, encoding='utf-8')
    if r.returncode != 0:
        fail('acorn failed on the other files:\n' + r.stderr[-2000:])
    return json.loads(r.stdout)


def find_world(base, html):
    for t in tags_of(html):
        text = read(os.path.join(base, t))
        if ('\n' + WORLD_OPEN + '\n') in text or text.startswith(WORLD_OPEN + '\n'):
            return t[len(JS_DIR) + 1:], text
    return None, None


def plan(world_text, html, base, world_name):
    """Everything the cut needs: the renamed text, the layout [(name, first, last)] in ORIGINAL line numbers, the acorn facts."""
    for ch, what in (('\r', 'a carriage return'), (' ', 'U+2028'), (' ', 'U+2029')):
        if ch in world_text:
            fail(f'the world file holds {what}; acorn and this script would count lines differently')
    if not world_text.endswith('\n'):
        fail('the world file must end with a newline')
    A = acorn_pass(world_text, RENAMES, 'wrapped')
    I = A['iife']
    if I['topLevelOthers']:
        fail(f'the world file holds {I["topLevelOthers"]} top-level statements besides `var WORLD=`; this script expects only the IIFE')
    if not I['returnIsLast']:
        fail('the last statement of the IIFE body is not its return')
    if I['stmtCol'] != 0:
        fail('`var WORLD=` does not start its line')
    lines = world_text.split('\n')[:-1]
    if lines[I['stmtLine'] - 1] != WORLD_OPEN:
        fail(f'line {I["stmtLine"]} is {lines[I["stmtLine"] - 1]!r}, expected {WORLD_OPEN!r} alone')
    if lines[I['endLine'] - 1] != WORLD_CLOSE or I['endLine'] != len(lines):
        fail(f'the IIFE must close with {WORLD_CLOSE!r} alone on the last line (line {I["endLine"]} of {len(lines)})')
    if not lines[I['returnLine'] - 1].startswith(RETURN_PREFIX + '{'):
        fail(f'line {I["returnLine"]} does not start with {RETURN_PREFIX + "{"!r}')
    if I['returnEndLine'] != I['endLine'] - 1 or not lines[I['returnEndLine'] - 1].endswith('};'):
        fail('the return statement must end with `};` on the line before the close')
    if A['collisions']:
        c = A['collisions'][0]
        fail(f'the new name {c["name"]!r} is already used in the world file (line {c["line"]}); pick another in RENAMES')
    # names that would clash with another file's globals, after the renames
    others = other_globals(base, html, world_name)
    renamed = {n: RENAMES.get(n, n) for n, _ in A['names']}
    clashes = sorted({renamed[n] for n, _ in A['names'] if renamed[n] in others})
    if clashes:
        fail('these names are declared inside the WORLD IIFE and at the top level of another file; add them to RENAMES: '
             + ', '.join(f'{n} ({", ".join(f + ":" + k for f, k in others[n])})' for n in clashes))
    for n in RENAMES.values():
        if n in others:
            fail(f'the new name {n!r} is already a global in {others[n]}')
    # the cut lines
    stmts = A['statements']
    n = len(lines)
    covered = [False] * (n + 2)
    for i, ln in enumerate(lines, 1):
        if ln.strip() == '':
            covered[i] = True
    for c in A['comments']:
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
        if not starts or starts[0]['col'] != 2:
            fail(f'{name}: line {L} ({anchor!r}) does not begin a statement of the IIFE body')
        straddle = [s for s in stmts if s['line'] < L <= s['endLine']]
        if straddle:
            fail(f'{name}: a statement starting at line {straddle[0]["line"]} runs across line {L}')
        prev_end = max((s['endLine'] for s in stmts if s['endLine'] < L), default=I['bodyOpenLine'])
        C = L
        while C - 1 > prev_end and covered[C - 1]:
            C -= 1
        for c in A['comments']:
            if c['line'] < C <= c['endLine']:
                fail(f'{name}: a comment starting at line {c["line"]} runs across the cut at line {C}')
        if cuts and C <= cuts[-1][1]:
            fail(f'{name}: its cut at line {C} is not after {cuts[-1][0]}\'s at line {cuts[-1][1]}')
        cuts.append((name, C))
    layout = []
    for i, (name, a) in enumerate(cuts):
        b = cuts[i + 1][1] - 1 if i + 1 < len(cuts) else n
        layout.append((name, a, b))
    # load-time reach across the cuts
    def file_of(line):
        k = 0
        for _, a, _b in layout:
            if line >= a:
                k = layout.index((_, a, _b))
        return k
    bad = []
    for r in A['reach']:
        f = file_of(r['line'])
        for x in r['reached']:
            if file_of(x['line']) > f:
                bad.append(f'line {r["line"]} ({layout[f][0]}) calls {x["fn"]} (line {x["line"]}, {layout[file_of(x["line"])][0]})' + (f' through {x["via"]}' if x['via'] else ''))
    if bad:
        fail('a load-time call would reach a function in a later file (move the cut, or the code, first):\n  ' + '\n  '.join(bad))
    text = apply_edits(world_text, A['edits'])
    return text, layout, A


def pieces(text, layout, I):
    """[(name, text)]: exact line ranges of the renamed source, minus the wrapper; the last piece ends `var WORLD={…};`."""
    lines = text.split('\n')[:-1]
    out = []
    for k, (name, a, b) in enumerate(layout):
        seg = lines[a - 1:b]
        if k == 0:
            # drop the `var WORLD=(()=>{` line (the banner above it stays)
            j = I['stmtLine'] - a
            assert seg[j] == WORLD_OPEN
            seg = seg[:j] + seg[j + 1:]
        if k == len(layout) - 1:
            # `  return {…};` → `var WORLD={…};` and drop the `})();` line
            assert seg[-1] == WORLD_CLOSE
            seg = seg[:-1]
            j = I['returnLine'] - a
            assert seg[j].startswith(RETURN_PREFIX)
            seg[j] = 'var WORLD=' + seg[j][len(RETURN_PREFIX):]
        out.append((name, '\n'.join(seg) + '\n'))
    return out


def rebuild(index_path):
    """The original 80-world.js text from the pieces named in js/world-manifest.json, renames reversed. For join.py."""
    base = os.path.dirname(os.path.abspath(index_path))
    mpath = os.path.join(base, JS_DIR, MANIFEST)
    if not os.path.exists(mpath):
        return None, None
    m = json.load(open(mpath, encoding='utf-8'))
    names = [f['name'] for f in m['files']]
    tags = [t[len(JS_DIR) + 1:] for t in tags_of(read(index_path))]
    i = tags.index(names[0]) if names[0] in tags else -1
    if i < 0 or tags[i:i + len(names)] != names:
        fail(f'the world files {names} are not contiguous in index.html\'s tags, in that order')
    text = ''.join(read(os.path.join(base, JS_DIR, n)) for n in names)
    lines = text.split('\n')[:-1]
    # the `var WORLD={` line is the last top-level statement; put the wrapper back
    j = m['return_line_in_pieces'] - 1
    if not lines[j].startswith('var WORLD={'):
        fail(f'line {j + 1} of the pieces is not `var WORLD={{`')
    lines[j] = RETURN_PREFIX + lines[j][len('var WORLD='):]
    lines.append(WORLD_CLOSE)
    lines.insert(m['open_line'] - 1, WORLD_OPEN)
    wrapped = '\n'.join(lines) + '\n'
    inverse = {v: k for k, v in m['renames'].items()}
    A = acorn_pass(wrapped, inverse, 'reverse')
    return m, apply_edits(wrapped, A['edits'])


def dissolve(base, html, world_name, world_text, out_dir):
    text, layout, A = plan(world_text, html, base, world_name)
    I = A['iife']
    ps = pieces(text, layout, I)
    jsdir = os.path.join(out_dir, JS_DIR)
    os.makedirs(jsdir, exist_ok=True)
    for name, _ in ps:
        if os.path.exists(os.path.join(jsdir, name)):
            fail(f'{jsdir}/{name} already exists')
    files = []
    for (name, t), (_, a, b) in zip(ps, layout):
        write(os.path.join(jsdir, name), t)
        files.append({'name': name, 'lines': [a, b], 'bytes': len(t.encode('utf-8')), 'sha256': sha(t.encode('utf-8'))})
    # where `var WORLD={` sits in the concatenated pieces: the return line, minus the dropped open line
    manifest = {
        'what': f'{world_name}\'s WORLD IIFE dissolved into these files, in load order; scripts/split_world.py rebuild() reverses it',
        'source': JS_DIR + '/' + world_name, 'source_sha256': sha(world_text.encode('utf-8')), 'source_lines': world_text.count('\n'),
        'open_line': I['stmtLine'], 'return_line_in_pieces': I['returnLine'] - 1, 'renames': RENAMES, 'files': files}
    with open(os.path.join(jsdir, MANIFEST), 'w', encoding='utf-8') as f:
        head = {k: v for k, v in manifest.items() if k != 'files'}
        f.write(json.dumps(head, indent=1, ensure_ascii=False)[:-2] + ',\n "files": [\n  '
                + ',\n  '.join(json.dumps(x, ensure_ascii=False) for x in files) + '\n ]\n}\n')
    old_tag = f'<script src="{JS_DIR}/{world_name}"></script>'
    if html.count(old_tag) != 1:
        fail(f'index.html does not hold exactly one {old_tag}')
    new_html = html.replace(old_tag, '\n'.join(f'<script src="{JS_DIR}/{n}"></script>' for n, _ in ps))
    write(os.path.join(out_dir, 'index.html'), new_html)
    old = os.path.join(jsdir, world_name)
    if os.path.exists(old):
        os.remove(old)
    return layout, ps, manifest


def table(layout, ps, world_name):
    total = 0
    print(f'{"file":28} {world_name + " lines":>20} {"n":>6} {"bytes":>9}  first line')
    for (name, a, b), (_, t) in zip(layout, ps):
        nb = len(t.encode('utf-8')); total += nb
        first = next((l for l in t.split('\n') if l.strip() and not l.lstrip().startswith('//')), '').strip()[:60]
        print(f'{JS_DIR + "/" + name:28} {f"{a}-{b}":>20} {b - a + 1:>6} {nb:>9,}  {first}')
    print(f'{len(layout)} files, {total:,} bytes; renames: ' + ', '.join(f'{k}->{v}' for k, v in RENAMES.items()))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--src', default=os.path.join(ROOT, 'index.html'))
    ap.add_argument('--out', help='write the dissolved copy (index.html + js/) here instead of in place')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--check', action='store_true', help='dissolve a temp copy, rebuild the world file, compare sha256, parsecheck')
    args = ap.parse_args()
    src = os.path.abspath(args.src)
    base = os.path.dirname(src)
    html = read(src)
    if os.path.exists(os.path.join(base, JS_DIR, MANIFEST)):
        print(f'{os.path.relpath(src, ROOT)}: the world is already dissolved ({MANIFEST} exists); nothing to do')
        sys.exit(0)
    world_name, world_text = find_world(base, html)
    if not world_name:
        fail(f'no js/ file beside {src} holds {WORLD_OPEN!r}')
    if args.dry_run:
        text, layout, A = plan(world_text, html, base, world_name)
        table(layout, pieces(text, layout, A['iife']), world_name); return
    if args.check or args.out:
        out_dir = os.path.abspath(args.out) if args.out else tempfile.mkdtemp(prefix='world-')
        os.makedirs(os.path.join(out_dir, JS_DIR), exist_ok=True)
        for t in tags_of(html):
            shutil.copy(os.path.join(base, t), os.path.join(out_dir, t))
        if os.path.exists(os.path.join(base, JS_DIR, 'manifest.json')):  # step 1's record, so join.py works on the copy
            shutil.copy(os.path.join(base, JS_DIR, 'manifest.json'), os.path.join(out_dir, JS_DIR, 'manifest.json'))
        write(os.path.join(out_dir, 'index.html'), html)
        layout, ps, manifest = dissolve(out_dir, html, world_name, world_text, out_dir)
        table(layout, ps, world_name)
        if args.check:
            m, rebuilt = rebuild(os.path.join(out_dir, 'index.html'))
            h0, h1 = sha(world_text.encode('utf-8')), sha(rebuilt.encode('utf-8'))
            print(f'source  sha256 {h0}\nrebuilt sha256 {h1}')
            if h0 != h1:
                diff = next((i for i, (a, b) in enumerate(zip(world_text.split('\n'), rebuilt.split('\n'))) if a != b), None)
                fail(f'the rebuilt world file differs from the source (first differing line {diff + 1 if diff is not None else "?"})')
            print('rebuild: byte-identical')
            r = subprocess.run([sys.executable, os.path.join(HERE, 'parsecheck.py'), os.path.join(out_dir, 'index.html')], capture_output=True, text=True, encoding='utf-8')
            print(r.stdout.strip().split('\n')[-1])
            if r.returncode != 0:
                fail('parsecheck failed on the dissolved copy:\n' + r.stdout + r.stderr)
            if not args.out:
                shutil.rmtree(out_dir, ignore_errors=True)
        else:
            print(f'wrote {out_dir}/index.html and {out_dir}/{JS_DIR}/')
        return
    layout, ps, manifest = dissolve(base, html, world_name, world_text, base)
    table(layout, ps, world_name)
    print(f'wrote {len(ps)} files to {base}/{JS_DIR}/, {MANIFEST}, and rewrote index.html; {world_name} removed')


if __name__ == '__main__':
    main()
