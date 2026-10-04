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
// seconds each took on CI (Session 254's local run; refreshed from CI's 2 Oct run on f71586a, Session 434; every suite
// refreshed from CI's 3 Oct run on 0af251a (auto/systems), Session 454, when shard 2 ran past its 45 minutes: keeperwalk took
// 605 s and was counted as 60). A suite not listed counts as 60.
const SECS = { keeperwalk: 605, mainrun: 462, falls: 449, fortwalk: 381, placesave: 363, renewal: 360, intreach: 279,
  hourhitch: 258, reader: 254, shopsight: 244, saltwater: 226, innrooms: 210, smoke: 207, guardsindoor: 187, lod: 173,
  questfoes: 169, saveui: 163, people: 162, guardplay: 158, burglary: 151, questtargets: 146, beat: 136, perf: 134,
  boxspots: 133, dungeonexit: 132, q7world: 132, lockon: 131, fortfurn: 124, bedrollprompt: 123, weather: 121,
  shoperrands: 119, dunfurn: 117, shipwright: 115, mimicspots: 113, livepick: 112, witness: 112, towngate: 108,
  chestpicks: 107, penance: 106, autosave: 105, fistswing: 105, theft: 104, shopfurn: 103, drydoors: 102, coachinn: 96,
  ragdoll: 94, riverquay: 94, watch: 92, wxplace: 91, duel: 90, wolves: 90, ashenburn: 89, saves: 89, shoreplaces: 88, shoresave: 150, blacksail: 180, rowebeats: 150, cellrace: 90,
  civicfurn: 87, harbour: 85, dunconts: 84, constable: 83, foes: 83, shophours: 82, locks: 81, buyprice: 80, cargo: 80,
  coachseat: 80, plants: 80, townroads: 80, walls: 80, homefurn: 77, intdoors: 77, lockfair: 77, mainquest: 76,
  seawear: 76, signs: 76, coach: 75, cowards: 74, dungeon: 74, houses: 74, investwords: 74, captainguard: 73, chapel: 73,
  houseao: 73, player: 73, investlacks: 72, rivers: 72, sailtrim: 72, twins: 72, aimbubble: 71, tpshots: 71,
  waybands: 71, chamerchant: 70, fortcot: 70, snowrepaint: 70, attrpromise: 69, dlgkeys: 69, guildfurn: 67, herbstub: 67,
  parryclock: 67, dazed: 66, ferry: 66, gargoyle: 66, shiphull: 66, trolls: 66, gait: 65, locksight: 65, beastfall: 64,
  crime1: 64, golem: 64, guardarmour: 64, buildsite: 63, dungeonfoes: 63, fistfight: 63, furniture: 63, piratehold: 63,
  rocks: 63, churchname: 62, coachvoice: 62, crime2: 62, lockpicks: 62, questgold: 62, twinsrebuild: 62, bridges: 61,
  campsack: 61, corpsebody: 61, intnpcs: 61, ironwork: 61, keepercone: 60, qtybutton: 60, shark: 60, wealth: 60,
  crime3: 59, crime5: 59, masterslam: 59, names: 59, placenames: 59, pois: 59, signposts: 59, slimes: 59, keep: 58,
  oddfurn: 58, register: 58, theftlevel1: 58, tpguard: 58, witnessrange: 58, crawler: 57, pirateram: 57, ships: 57,
  siegeturn: 57, spiders: 57, crime4: 56, duelrhythm: 56, export: 56, herbparity: 56, shipwreck: 56, slimesplit: 56,
  tpfists: 56, trees: 56, wayfinding: 56, ashwort: 55, legacyhalls: 55, legacyshops: 55, lvact: 55, roll: 55,
  tpswing: 55, wholepoints: 55, wreck: 55, wyrm: 55, bear: 54, camps: 54, fortify: 54, prices: 54, scorpion: 54,
  tpweapons: 54, coachboard: 53, interiors: 53, mimic: 53, shoprows: 53, barter: 52, coachstop: 52, faolchu: 52,
  wardswift: 52, weapons: 52, cavedoor: 51, fpweapons: 51, goblins: 51, legacyshells: 51, caravan: 50, fists: 50,
  peopleao: 50, tells: 50, counters: 49, creatureao: 49, guardlevel1: 49, tithe: 49, underclothes: 49, buffstack: 48,
  fortunecaor: 48, fortunecard: 48, hubregen: 48, shipwrightvoice: 48, attrdmg: 47, foearmour: 47, innvoice: 47,
  postureregen: 47, windows: 47, armourkit: 46, ogre: 46, riversail: 46, shells: 46, posture: 45, stonecress: 45,
  secondary: 44, tradebits: 43, wardall: 43, herbhidden: 42, lockswitch: 42, unequip: 41, combatmusic: 16, creator: 14,
  featurenames: 9 };
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
