// Which suites a CI run takes. 20 Oct 2026 (Michael, in chat: "We don't need bulletproof testing in this manner. Why can't we
// just have basic tests?"): a pull request runs the smoke set and any suite it adds or changes, nothing more; every suite runs
// once a week (check.yml's schedule) or when check is run by hand. It replaces 19 Oct's selection by the names a change reaches
// with a full run on main after each merge: 522 suites, each booting the whole game on software GL, came to 709 runner-minutes
// a merge, and the pull requests queued behind them.
//   node tests/lib/select.mjs --base=SHA [--head=SHA] [--github-output]   prints {mode, n, shards, suites, reason}
//   node tests/lib/select.mjs --full [--github-output]                     every suite (the weekly run, a manual run)
// mode 'none': only docs/ changed, no suite runs. 'some': the suites below. 'full': everything.
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '..', '..');
// the game boots on the new look, saves and autosaves, a swing lands, the player's body builds, a dungeon builds
export const SMOKE = ['looknew', 'saves', 'resolver', 'player', 'dungeon', 'autosave'];
// a pull request's few suites go in short shards so it reports in minutes; the weekly run's in long ones under the job's hour
const SOME_SHARD_SECS = 6 * 60, FULL_SHARD_SECS = 35 * 60, MAX_SHARDS = 20;

const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
const suiteNames = () => fs.readdirSync(path.join(root, 'tests')).filter(f => f.endsWith('.test.mjs')).map(f => f.slice(0, -9)).sort();

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
    const per = mode === 'full' ? FULL_SHARD_SECS : SOME_SHARD_SECS;
    const n = mode === 'none' ? 0 : Math.max(1, Math.min(MAX_SHARDS, Math.ceil(cost(suites) / per)));
    return { mode, n, shards: Array.from({ length: n }, (_, i) => i + 1), suites, reason };
  };
  if (full || !base) return pack('full', all, full ? 'asked for every suite' : 'no base to compare with');
  const changed = git('diff', '--name-only', `${base}...${head}`).split('\n').filter(Boolean);
  if (changed.length && changed.every(f => f.startsWith('docs/'))) return pack('none', [], 'only docs/ changed');
  const picked = new Set(SMOKE.filter(s => all.includes(s)));
  for (const f of changed) { const m = /^tests\/([^/]+)\.test\.mjs$/.exec(f); if (m && all.includes(m[1])) picked.add(m[1]); }
  const suites = all.filter(s => picked.has(s)), extra = suites.length - SMOKE.filter(s => all.includes(s)).length;
  return pack('some', suites, `the smoke set${extra ? ` and ${extra} suite${extra > 1 ? 's' : ''} the change adds or edits` : ''}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
  const r = selectSuites({ base: arg('base'), head: arg('head') || 'HEAD', full: process.argv.includes('--full') });
  console.log(JSON.stringify({ ...r, suites: r.mode === 'full' ? `(all ${r.suites.length})` : r.suites }, null, 1));
  if (process.argv.includes('--github-output') && process.env.GITHUB_OUTPUT)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `mode=${r.mode}\nn=${r.n}\nshards=${JSON.stringify(r.shards)}\n`);
}
