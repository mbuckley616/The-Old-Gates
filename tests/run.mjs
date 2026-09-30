// Run every *.test.mjs in this folder, one browser each, and report. `node tests/run.mjs saves` runs one.
// `node tests/run.mjs --shard=2/8` runs the second of eight shares (CI runs the eight side by side, Session 254).
import fs from 'fs'; import path from 'path'; import { spawnSync } from 'child_process'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const shardArg = args.find(a => a.startsWith('--shard='));
const only = args.find(a => !a.startsWith('--'));
let files = fs.readdirSync(here).filter(f => f.endsWith('.test.mjs') && (!only || f.startsWith(only))).sort();
// seconds each took in a full local run (Session 254); a suite not listed counts as 60. Shares are dealt heaviest first to the lightest.
const SECS = { placesave: 324, mainrun: 318, hourhitch: 288, guardsindoor: 134, reader: 131, lod: 115, saveui: 110, people: 108, perf: 96, beat: 95, waybands: 120, questtargets: 91, witness: 90, burglary: 150, weather: 87, shoperrands: 81, theft: 76 };
if (shardArg) { const [k, n] = shardArg.slice(8).split('/').map(Number); const load = Array(n).fill(0), mine = new Set();
  const w = f => SECS[f.replace('.test.mjs', '')] || 60;
  [...files].sort((a, b) => w(b) - w(a) || a.localeCompare(b)).forEach(f => { const j = load.indexOf(Math.min(...load)); load[j] += w(f); if (j === k - 1) mine.add(f); });
  files = files.filter(f => mine.has(f)); }
let failed = 0; const times = [];
for (const f of files) {
  console.log(`\n== ${f} ==`);
  const t0 = Date.now();
  const r = spawnSync('node', [path.join(here, f)], { stdio: 'inherit', timeout: 900000 });
  times.push(`${f.replace('.test.mjs', '')} ${Math.round((Date.now() - t0) / 1000)}s${r.status !== 0 ? ' FAILED' : ''}`);
  if (r.status !== 0) failed++;
}
if (files.length > 1) console.log('\n' + times.join('\n'));
console.log(`\n${files.length - failed}/${files.length} suites passed`);
process.exit(failed ? 1 : 0);
