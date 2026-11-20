// Top-level names declared twice (QA, Session 2452). Every js/ file shares one global scope (CLAUDE.md, "The split layout"):
// a `let`/`const`/`class` declared twice is a SyntaxError that parsecheck's concatenation catches, but two `function`s (or a
// `function` and a `var`, or two `var`s) of one name are legal, and the later declaration wins in silence. That cost the game
// three systems in two days: magic B's `riderTick` (64) replaced by the road rider's (87, S2436), the road's `caravanDef` by the
// festival's in the same file (S2437), and S112's weapon-class hit sounds by 72's plain `sndHitEnemy` (S2443). Found each time by
// a hand sweep; this suite is that sweep. It boots no browser: it parses each `js/` file named by index.html's tags, in tag order,
// with Node's own acorn, and lists every top-level `function` and `var` name held by two declarations.
import fs from 'fs'; import path from 'path'; import { spawnSync } from 'child_process'; import { fileURLToPath } from 'url';
import { check } from './lib/game.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// A clash judged harmless, with who judged it and why. Add to it only with the reason; a new name here is a choice to keep a clash.
const KNOWN = {
  roadPoint: 'S2436: 82 and 87 each build a road point; their callers read either shape, so the later copy serving both is harmless',
};
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="(js\/[^"]+\.js)"/g)].map(m => m[1]);
const PARSE = `
let acorn; try { acorn = require('internal/deps/acorn/acorn/dist/acorn'); } catch (e) { acorn = require('acorn'); }
const fs = require('fs'), out = [];
for (const f of JSON.parse(process.argv[1])) {
  const ast = acorn.parse(fs.readFileSync(f, 'utf8'), { ecmaVersion: 'latest', sourceType: 'script', locations: true });
  for (const st of ast.body) {
    if (st.type === 'FunctionDeclaration' && st.id) out.push([st.id.name, f, st.loc.start.line, 'function']);
    else if (st.type === 'VariableDeclaration' && st.kind === 'var')
      for (const d of st.declarations) if (d.id.type === 'Identifier') out.push([d.id.name, f, d.loc.start.line, 'var']);
  }
}
process.stdout.write(JSON.stringify(out));`;
const r = spawnSync(process.execPath, ['--expose-internals', '-e', PARSE, JSON.stringify(files)], { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 });
const decls = r.status === 0 ? JSON.parse(r.stdout) : [];
check('index.html names the js/ files and every one parses', files.length > 40 && r.status === 0 && decls.length > 1000,
  { files: files.length, status: r.status, decls: decls.length, err: (r.stderr || '').slice(0, 400) });
const by = new Map();
for (const [name, f, line, kind] of decls) { if (!by.has(name)) by.set(name, []); by.get(name).push(`${kind} ${f.replace('js/', '')}:${line}`); }
const clashes = [...by].filter(([n, at]) => at.length > 1);
const fresh = clashes.filter(([n]) => !(n in KNOWN));
console.log(`  ${files.length} files, ${decls.length} top-level function and var declarations, ${by.size} names, ${clashes.length} held twice`);
for (const [n, at] of clashes) console.log(`  ${n in KNOWN ? 'known' : 'NEW  '} ${n}: ${at.join(', ')}`);
check('no top-level function or var name is declared twice (the later one would win in silence)', fresh.length === 0,
  Object.fromEntries(fresh.map(([n, at]) => [n, at])));
const stale = Object.keys(KNOWN).filter(n => !clashes.some(([c]) => c === n));
check('every known clash still exists (strike it from KNOWN when it is gone)', stale.length === 0, stale);
