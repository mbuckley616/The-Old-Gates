// Run every *.test.mjs in this folder, one browser each, and report. `node tests/run.mjs saves` runs one.
import fs from 'fs'; import path from 'path'; import { spawnSync } from 'child_process'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
// `node tests/run.mjs --shard 2/4` runs every fourth suite from the second (CI runs the shards side by side: the
// whole suite outgrew one job's thirty minutes, Session 207)
const args = process.argv.slice(2); const si = args.indexOf('--shard'); const shard = si >= 0 ? args.splice(si, 2)[1].split('/').map(Number) : null;
const only = args[0];
const files = fs.readdirSync(here).filter(f => f.endsWith('.test.mjs') && (!only || f.startsWith(only))).sort().filter((f, i) => !shard || i % shard[1] === shard[0] - 1);
let failed = 0;
for (const f of files) {
  console.log(`\n== ${f} ==`);
  const r = spawnSync('node', [path.join(here, f)], { stdio: 'inherit', timeout: 600000 });
  if (r.status !== 0) failed++;
}
console.log(`\n${files.length - failed}/${files.length} suites passed`);
process.exit(failed ? 1 : 0);
