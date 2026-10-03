// Run every *.test.mjs in this folder, one browser each, and report. `node tests/run.mjs saves` runs one.
// `node tests/run.mjs --shard=2/8` runs the second of eight shares (CI runs the eight side by side, Session 254).
// `node tests/run.mjs --src=PATH` boots PATH instead of the repo's index.html (a split copy in a scratch folder, Session 368).
import fs from 'fs'; import path from 'path'; import { spawnSync } from 'child_process'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const shardArg = args.find(a => a.startsWith('--shard='));
const only = args.find(a => !a.startsWith('--'));
const srcArg = args.find(a => a.startsWith('--src='));
if (srcArg) process.env.OG_SRC = path.resolve(srcArg.slice(6));
let files = fs.readdirSync(here).filter(f => f.endsWith('.test.mjs') && (!only || f.startsWith(only))).sort();
// seconds each took on CI (Session 254's local run; refreshed from CI's 2 Oct run on f71586a, Session 434, when shard 3
// ran past its 45 minutes: falls, renewal, shopsight, smoke and innrooms were counted as 60). A suite not listed counts as 60.
const SECS = { mainrun: 451, falls: 437, placesave: 436, hourhitch: 288, renewal: 275, shopsight: 249, reader: 247, smoke: 229,
  innrooms: 209, q7world: 194, guardsindoor: 178, lod: 170, guardplay: 150, burglary: 150, questtargets: 149, saveui: 145,
  beat: 145, people: 144, perf: 134, lockon: 121, weather: 121, fistfight: 120, boxspots: 119, shoperrands: 112, mimicspots: 111,
  chestpicks: 111, dungeonexit: 109, fortfurn: 109, livepick: 105, chapel: 101, shopfurn: 101, saves: 99, theft: 98,
  coachinn: 97, penance: 97, witness: 93, fistswing: 92, mainquest: 92, constable: 91, aimbubble: 90, signs: 90,
  placenames: 90, ashenburn: 88, duel: 87, homefurn: 85, civicfurn: 84, fortcot: 84, shophours: 83, dunconts: 82, townroads: 82 };
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
