// Run every *.test.mjs in this folder, one browser each, and report. `node tests/run.mjs saves` runs one.
// `node tests/run.mjs --shard=2/8` runs the second of eight shares (CI ran eight side by side from Session 254, twelve since Session 652, fourteen since Session 915, sixteen since Session 1138).
// `node tests/run.mjs --look=old` boots each suite on the old look, r128 (Session 822); since Session 1226 the new look is the default.
// `node tests/run.mjs --src=PATH` boots PATH instead of the repo's index.html (a split copy in a scratch folder, Session 368).
import fs from 'fs'; import path from 'path'; import { spawnSync } from 'child_process'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const shardArg = args.find(a => a.startsWith('--shard='));
const only = args.find(a => !a.startsWith('--'));
const srcArg = args.find(a => a.startsWith('--src='));
if (srcArg) process.env.OG_SRC = path.resolve(srcArg.slice(6));
// `--look=old` or `--look=new` boots every suite on that look (`?look=…`, Session 822); the default is the page's, the new look since Session 1226
const lookArg = args.find(a => a.startsWith('--look='));
if (lookArg) process.env.OG_LOOK = lookArg.slice(7);
let files = fs.readdirSync(here).filter(f => f.endsWith('.test.mjs') && (!only || f.startsWith(only))).sort();
// seconds each suite takes on CI, in tests/times.json (Session 1226: kept out of this file, so a refresh of the times is not a change
// to the harness and runs no suites); its history to Session 1138 is in this file's git log. A suite not listed counts as 60.
const SECS = JSON.parse(fs.readFileSync(path.join(here, 'times.json'), 'utf8')).secs;
// Session 1226 (Michael, 20 Oct 2026): every suite boots the new look, and one that fails there is named in tests/skip.json and does
// not run until it is fixed and struck from that list (QA's cards: docs/qa/skipped.md). Naming a suite (`node tests/run.mjs falls`)
// still runs it.
const SKIP = JSON.parse(fs.readFileSync(path.join(here, 'skip.json'), 'utf8')).suites;
if (!only) { const n = files.length; files = files.filter(f => !(f.replace('.test.mjs', '') in SKIP)); if (n > files.length) console.log(`skipped: ${n - files.length} suites named in tests/skip.json`); }
// `--changed=BASE` (CI on a pull request, Michael's A on the pipeline, 19 Oct 2026): only the suites the change since BASE can
// reach, by tests/lib/select.mjs; main and a plain run take every suite.
const changedArg = args.find(a => a.startsWith('--changed='));
if (changedArg && !only) { const { selectSuites } = await import('./lib/select.mjs'); const sel = selectSuites({ base: changedArg.slice(10) });
  console.log(`selection: ${sel.mode}, ${sel.reason}`); if (sel.mode !== 'full') { const keep = new Set(sel.suites.map(s => s + '.test.mjs')); files = files.filter(f => keep.has(f)); } }
if (shardArg) { const [k, n] = shardArg.slice(8).split('/').map(Number); const load = Array(n).fill(0), mine = new Set();
  const w = f => SECS[f.replace('.test.mjs', '')] || 60;
  [...files].sort((a, b) => w(b) - w(a) || a.localeCompare(b)).forEach(f => { const j = load.indexOf(Math.min(...load)); load[j] += w(f); if (j === k - 1) mine.add(f); });
  files = files.filter(f => mine.has(f)); }
// Session 804 (Michael, 13 Oct 2026): a suite that fails is run once more before the shard is called red. Since 10 Oct about
// one CI attempt in three went red on a suite that passes on the same code elsewhere (poinames, pauseleaf, saveui, hourhitch,
// dunwarm), and each red cost a 50-minute re-run or a "merge anyway?" card for Michael. A pass on the retry keeps the shard
// green and is named FLAKY in the summary, in tests/out/flaky.txt and, on CI, as a warning on the run, so the suite still
// gets fixed. A real fault fails twice. The retry is skipped when it could push the shard past its budget (CI's job stops
// at 60 minutes: RETRY_BUDGET_MIN, default 50, minus the time spent so far), and `--no-retry` turns it off for local runs.
const retry = !args.includes('--no-retry'), budget = +(process.env.RETRY_BUDGET_MIN || 50) * 60000, start = Date.now();
const run = f => spawnSync('node', [path.join(here, f)], { stdio: 'inherit', timeout: 900000 }).status === 0;
let failed = 0; const times = [], flaky = [];
for (const f of files) {
  console.log(`\n== ${f} ==`);
  const t0 = Date.now(), name = f.replace('.test.mjs', '');
  let ok = run(f), note = '';
  if (!ok && retry && Date.now() - start + (SECS[name] || 60) * 1500 < budget) {
    console.log(`\n== ${f} (failed; running it once more) ==`);
    ok = run(f); note = ok ? ' FLAKY (failed, then passed on the retry)' : ' (failed twice)';
    if (ok) { flaky.push(name); if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Flaky test::${name} failed, then passed on the retry`); }
  }
  times.push(`${name} ${Math.round((Date.now() - t0) / 1000)}s${ok ? note : ' FAILED' + note}`);
  if (!ok) failed++;
}
if (flaky.length) { try { fs.mkdirSync(path.join(here, 'out'), { recursive: true }); fs.appendFileSync(path.join(here, 'out', 'flaky.txt'), flaky.map(n => `${new Date().toISOString()} ${n}\n`).join('')); } catch (e) {} }
if (files.length > 1) console.log('\n' + times.join('\n'));
console.log(`\n${files.length - failed}/${files.length} suites passed${flaky.length ? `; ${flaky.length} flaky, passed on the retry: ${flaky.join(', ')}` : ''}`);
process.exit(failed ? 1 : 0);
