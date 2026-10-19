// Which suites a pull request runs (Michael's A on the pipeline decision, 19 Oct 2026). Main runs every suite after each merge;
// a pull request runs the suites its change can reach, plus a short smoke set, so one PR is a few shards, not twenty.
//   node tests/lib/select.mjs --base=SHA [--head=SHA] [--github-output]   prints {mode, n, shards, suites, reason}
//   node tests/lib/select.mjs --full [--github-output]                     every suite (pushes to main, a manual run)
// mode 'none': only docs/ changed, no suite runs. 'some': the suites below. 'full': everything.
// How a change reaches a suite: each changed line of a js/ file sits inside one top-level statement (a function, a const, a
// class, or a statement like `BOOKS.push(…)`, named by BOOKS); those names, and every top-level statement in js/ that names
// one of them (one step of callers, skipped for a hub with more than twelve), are the change's names. A comment-only change
// reaches nothing. A suite runs when its file names one of them, when the suite itself changed, or when it is in SMOKE. A change
// to the harness, the page, the vendored three.js, the CI or package files runs everything, and so does a selection that would
// cost over half of the full suite's time. A break this misses is caught by main's full run after the merge.
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '..', '..');
export const SMOKE = ['looknew', 'saves', 'resolver', 'player', 'dungeon', 'autosave'];
const FULL = [/^index\.html$/, /^tests\/lib\//, /^tests\/run\.mjs$/, /^vendor\//, /^\.github\//, /^package(-lock)?\.json$/, /^scripts\/parsecheck\.py$/];
const SHARD_SECS = 35 * 60, MAX_SHARDS = 20, CALLER_CAP = 12;
const IDENT = /[A-Za-z_$][\w$]*/g;

const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
const suiteNames = () => fs.readdirSync(path.join(root, 'tests')).filter(f => f.endsWith('.test.mjs')).map(f => f.slice(0, -9)).sort();

// js/ files' top-level statements, from tests/lib/toplevel.cjs (Node's own acorn): {file: [{name, line, endLine, ids}]}
function topLevel(files) {
  if (!files.length) return {};
  const out = execFileSync(process.execPath, ['--expose-internals', '--no-warnings', path.join(here, 'toplevel.cjs'), ...files],
    { cwd: root, encoding: 'utf8', maxBuffer: 1 << 29 });
  return JSON.parse(out);
}

// the new-side line numbers each changed js file was touched at (a deletion counts at the line it sat before)
function touched(base, head) {
  const diff = git('diff', '-U0', '--no-color', `${base}...${head}`, '--', 'js/');
  const by = {}; let file = null;
  for (const l of diff.split('\n')) {
    if (l.startsWith('+++ ')) { file = l.slice(4).replace(/^b\//, ''); if (file === '/dev/null') file = null; else by[file] = by[file] || []; continue; }
    const h = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(l);
    if (h && file) { const s = +h[1], n = h[2] === undefined ? 1 : +h[2]; if (n === 0) by[file].push(Math.max(1, s)); else for (let k = 0; k < n; k++) by[file].push(s + k); }
  }
  return by;
}

// run.mjs's table of seconds, read from its text so the two never drift apart
function loadSecs() {
  const t = fs.readFileSync(path.join(root, 'tests', 'run.mjs'), 'utf8');
  const i = t.indexOf('const SECS = {'), j = t.indexOf('};', i), out = {};
  for (const m of t.slice(i, j).matchAll(/'?([\w-]+)'?: (\d+)/g)) out[m[1]] = +m[2];
  return out;
}

export function selectSuites({ base, head = 'HEAD', full = false } = {}) {
  const all = suiteNames(), secs = loadSecs();
  const cost = list => list.reduce((t, s) => t + (secs[s] || 60), 0);
  const pack = (mode, suites, reason) => {
    const n = mode === 'none' ? 0 : Math.max(1, Math.min(MAX_SHARDS, Math.ceil(cost(suites) / SHARD_SECS)));
    return { mode, n, shards: Array.from({ length: n }, (_, i) => i + 1), suites, reason };
  };
  if (full || !base) return pack('full', all, full ? 'asked for every suite' : 'no base to compare with');
  const changed = git('diff', '--name-only', `${base}...${head}`).split('\n').filter(Boolean);
  if (!changed.length) return pack('some', SMOKE.filter(s => all.includes(s)), 'nothing changed: the smoke set');
  if (changed.every(f => f.startsWith('docs/'))) return pack('none', [], 'only docs/ changed');
  // the build number's line in index.html is the stamp's (main sets it after each merge), so a change to it alone runs nothing
  const real = changed.filter(f => f !== 'index.html' || git('diff', '-U0', '--no-color', `${base}...${head}`, '--', 'index.html')
    .split('\n').some(l => /^[-+](?![-+])/.test(l) && !/build s\d+<\/span>/.test(l)));
  const big = real.find(f => FULL.some(r => r.test(f)));
  if (big) return pack('full', all, `${big} changed`);

  // the names the change touches, and one step of their callers (a name with more than CALLER_CAP callers is a hub: its
  // callers would reach most suites, so only the name itself counts)
  const at = touched(base, head), files = Object.keys(at).filter(f => fs.existsSync(path.join(root, f)));
  const jsFiles = fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f);
  const byFile = topLevel(jsFiles), rows = Object.values(byFile).flat();
  const names = new Set();
  for (const f of files) for (const n of at[f]) for (const r of byFile[f] || []) if (r.name && n >= r.line && n <= r.endLine) names.add(r.name);
  const direct = [...names];
  for (const d of direct) {
    const callers = [...new Set(rows.filter(r => r.name && r.name !== d && r.ids.includes(d)).map(r => r.name))];
    if (callers.length <= CALLER_CAP) callers.forEach(c => names.add(c));
  }
  const usable = new Set([...names].filter(n => n.length >= 3));

  const picked = new Set(SMOKE.filter(s => all.includes(s)));
  for (const f of changed) { const m = /^tests\/([^/]+)\.test\.mjs$/.exec(f); if (m && all.includes(m[1])) picked.add(m[1]); }
  if (usable.size) for (const s of all) {
    const text = fs.readFileSync(path.join(root, 'tests', s + '.test.mjs'), 'utf8');
    for (const id of text.match(IDENT) || []) if (usable.has(id)) { picked.add(s); break; }
  }
  const suites = all.filter(s => picked.has(s));
  if (cost(suites) > cost(all) / 2) return pack('full', all, `the change reaches ${suites.length} of ${all.length} suites`);
  return pack('some', suites, `${direct.length} names changed (${direct.slice(0, 8).join(', ')}${direct.length > 8 ? ', …' : ''}), ${usable.size} with their callers; ${suites.length} suites`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
  const r = selectSuites({ base: arg('base'), head: arg('head') || 'HEAD', full: process.argv.includes('--full') });
  console.log(JSON.stringify({ ...r, suites: r.mode === 'full' ? `(all ${r.suites.length})` : r.suites }, null, 1));
  if (process.argv.includes('--github-output') && process.env.GITHUB_OUTPUT)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `mode=${r.mode}\nn=${r.n}\nshards=${JSON.stringify(r.shards)}\n`);
}
