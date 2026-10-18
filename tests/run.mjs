// Run every *.test.mjs in this folder, one browser each, and report. `node tests/run.mjs saves` runs one.
// `node tests/run.mjs --shard=2/8` runs the second of eight shares (CI ran eight side by side from Session 254, twelve since Session 652, fourteen since Session 915).
// `node tests/run.mjs --look=new` boots each suite on three.js 0.170 (Session 822); since 18 Oct 2026 that is the default, but for
// the suites in tests/lib/old-look.json, and `--look=old` boots every suite on r128.
// `node tests/run.mjs --src=PATH` boots PATH instead of the repo's index.html (a split copy in a scratch folder, Session 368).
import fs from 'fs'; import path from 'path'; import { spawnSync } from 'child_process'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const shardArg = args.find(a => a.startsWith('--shard='));
const only = args.find(a => !a.startsWith('--'));
const srcArg = args.find(a => a.startsWith('--src='));
if (srcArg) process.env.OG_SRC = path.resolve(srcArg.slice(6));
// `--look=new` or `--look=old` boots every suite on that look (Session 822); without it a suite boots the new look unless
// tests/lib/old-look.json names it (18 Oct 2026)
const lookArg = args.find(a => a.startsWith('--look='));
if (lookArg) process.env.OG_LOOK = lookArg.slice(7);
let files = fs.readdirSync(here).filter(f => f.endsWith('.test.mjs') && (!only || f.startsWith(only))).sort();
// seconds each took on CI. Every suite refreshed from one run, the twelve shards of faa652b (auto/systems, 11 Oct), in
// Session 745, when shard 3 was cancelled at 60:19: panelfocus took 530 s and stairrail 219 and were counted as 60, and
// carraignight took 250 where 960 was guessed. (Earlier tables: Session 254's local run, CI's runs of 2 and 3 Oct in
// Sessions 434 and 454.) yardpanel was cut off by the cancel and is counted 90; dunwarm (Session 746) is a guess from this machine. A suite
// not listed counts as 60. scaleratio (Session 881) is CI's 567 s on 15 Oct (Session 905): counted as 60 it put twelve minutes too
// many on one shard, which hit the job's hour on its last suite.
// Session 915 (card F2a): refreshed from CI's run 38675675725 (auto/fable-f2a-scale, 15 Oct), where shards 5 and 12 were cut at
// the hour on their last suites with nothing failed: renewal took 339 s where 219 was counted, hourhitch 391 for 286, reader 329
// for 272, autosave 185 for 129, and 34 suites were not listed at all. The 39 suites that run did not time keep their old numbers.
const SECS = { aimbubble: 85, aldwynword: 70, armourfit: 60, armourkit: 46, armourlines: 54, 'armourlines-numbers': 59,
  articles: 57, ashenburn: 86, ashwort: 45, attrdmg: 41, attrpromise: 49, autosave: 185, autumn: 107, backroomdoor: 266,
  backslot: 42, barber: 60, barberbox: 74, barberchair: 68, barberfee: 57, barberway: 50, barter: 55, bear: 44,
  beastfall: 84, beat: 139, bedaim: 70, bedrollprompt: 106, bellwords: 51, bellwreck: 60, blacksail: 151, bladehit: 47,
  bladekey: 50, bladestone: 49, boardlines: 59, bodies: 81, bornhere: 60, bossbarunder: 82, boxseed: 62, boxspots: 87,
  bridgenames: 106, bridges: 53, bronzehelm: 32, buffstack: 43, buildsite: 52, burglary: 105, buyprice: 79, calendar: 73,
  camps: 46, campsack: 56, captainguard: 76, caravan: 52, cargo: 77, carraignight: 232, cavedoor: 48, cellrace: 66,
  chairstash: 57, challenge: 50, chamerchant: 60, chapel: 77, chasesight: 62, chestpicks: 101, churchname: 51,
  churchnames: 56, civicfurn: 88, cloakbody: 49, cloakcorpse: 53, cloakguild: 47, cloaks: 62, coach: 66, coachboard: 54,
  coachinn: 79, coachseat: 72, coachstop: 65, coachvoice: 56, coldhearth: 78, combatmusic: 11, compactclaim: 59,
  compactrefit: 128, constable: 77, containerids: 60, coopsaves: 118, corpsebody: 42, corpseglow: 54, counters: 51,
  cowards: 56, crawler: 56, creator: 19, creatureao: 46, crime1: 64, crime2: 52, crime3: 55, crime4: 48, crime5: 54,
  crownclaim: 72, datedguild: 48, datedwork: 49, dateline: 49, dayseed: 98, dazed: 62, deadkeys: 85, deadtree: 12,
  deathplace: 61, deckprops: 49, demonickit: 19, diedload: 161, dlgkeys: 63, dmgnums: 75, doorbed: 150, doorids: 56,
  doublenames: 10, dragonsize: 59, drydoors: 102, due: 43, duel: 81, duelrhythm: 86, dunconts: 81, dunfurn: 157,
  dungeon: 72, dungeonchase: 54, dungeonexit: 104, dungeonfoes: 55, dungeonpace: 65, dunseed: 72, dunwarm: 193,
  enchantmotes: 48, export: 70, factorpanel: 53, falls: 219, faolchu: 52, feasts: 49, feastsquare: 61, featurenames: 11,
  ferry: 61, fiercewolf: 72, fishseed: 60, fistfight: 107, fists: 58, fistswing: 89, flashshare: 58, foearmour: 48,
  foelogname: 45, foes: 65, foeseed: 76, foewarm: 77, foeweapons: 14, fortbarracks: 68, fortcot: 73, fortdoor: 86,
  fortfurn: 117, forthall: 75, fortify: 55, fortring: 69, fortunecaor: 48, fortunecard: 47, fortwalk: 326, fphands: 55,
  fpshield: 51, fpweapons: 51, furniture: 59, gait: 94, gargoyle: 64, gateblade: 50, gateguards: 194, gateschool: 56,
  ghoulface: 12, ghoulwalk: 8, gladeherbs: 49, goblinbody: 12, goblins: 50, golem: 66, guardarmour: 58, guardintro: 51,
  guardlevel1: 43, guardplay: 154, guardseed: 47, guardsindoor: 152, guildfurn: 70, handback: 72, harbour: 65,
  hearthcast: 61, helmhair: 36, herbhidden: 48, herbids: 53, herbparity: 47, herbstub: 69, hitseed: 48, hoardmetal: 43,
  hoardspot: 58, homefurn: 92, homenames: 90, homesleep: 183, honesttown: 53, horselegs: 11, hourhitch: 391, houseao: 66,
  housebuy: 56, houses: 56, hptail: 69, hubregen: 41, hubreturn: 89, hullbakes: 51, hullshape: 54, huntvariant: 48,
  innrooms: 170, innvoice: 56, inspdungeons: 11, inspector: 20, inspplaces: 20, intaim: 105, intdooraim: 167, intdoors: 57,
  interiors: 59, intnpcs: 50, intreach: 237, investlacks: 55, investwords: 65, ironwork: 60, jnecho: 47, jnlinks: 44,
  jobfoereload: 64, jobids: 50, jobseed: 40, journal: 203, keep: 55, keepercone: 50, keeperwalk: 615, lairdoor: 69,
  lairgrade: 48, lairhoard: 58, lairload: 83, lairmaster: 53, lairname: 65, lairrumour: 44, lairtheme: 83, lampheld: 93,
  ledgerplural: 43, legacyfoes: 46, legacyhalls: 51, legacyshells: 50, legacyshops: 55, levelpanel: 46, livepick: 97,
  lockfair: 56, lockon: 111, lockpicks: 51, locks: 95, locksight: 59, lockswitch: 39, lod: 304, looknew: 101, lookpair: 271,
  lootpicks: 106, lootseed: 61, lvact: 48, mainmarks: 63, mainquest: 68, mainrun: 459, makershermit: 86, makertools: 106,
  makerwords: 55, mapnotes: 137, mapquests: 48, mapseals: 65, mapsharp: 61, masterslam: 55, metkey: 62, mimic: 56,
  mimicspots: 109, moundsolid: 66, mushrooms: 77, names: 63, netclimb: 50, netlook: 66, newelstair: 73, nightpick: 66,
  noonring: 45, oddfurn: 54, ogre: 48, packshape: 58, panelfocus: 542, parryclock: 63, parrydeath: 52, pauseleaf: 248,
  penance: 81, people: 125, peopleao: 61, perf: 136, pickupids: 48, piratehold: 51, pirateram: 54, placenames: 57,
  placesave: 461, plants: 66, player: 73, poinames: 44, poipreview: 48, pois: 51, portlane: 144, posture: 49,
  posturefloor: 45, postureregen: 47, prices: 61, q7world: 205, qsfresh: 44, qtybutton: 51, quaywall: 98, questfoes: 156,
  questgold: 61, questtargets: 127, ragdoll: 89, ragdollsearch: 46, raisevarek: 51, reader: 329, register: 57, renewal: 339,
  restslip: 56, ringtrial: 60, riverquay: 108, rivers: 60, riversail: 52, roadseed: 69, rocks: 63, roll: 55, rowebeats: 265,
  rowelines: 254, sackseed: 47, sailtrim: 68, saltwater: 225, savelabel: 77, savepic: 95, saveretry: 74, saves: 98,
  saveui: 198, scaleratio: 357, scalerooms: 76, schoolroster: 97, scorpion: 49, seahint: 46, seaseed: 52, seasonwx: 49,
  seawear: 65, secondary: 50, selltopic: 57, settingsheet: 136, shark: 61, shells: 61, shipaim: 53, shiparchers: 58,
  shipdead: 59, shiphull: 62, shiphulls: 43, shiplog: 66, shipmoor: 64, shipnets: 74, ships: 50, shipwreck: 51,
  shipwright: 119, shipwrightvoice: 46, shoperrands: 87, shopfurn: 94, shophours: 82, shoprows: 57, shopsight: 225,
  shoreplaces: 58, shoresave: 76, shuttle: 54, shuttleclaim: 74, shuttletrial: 70, siegeturn: 59, signposts: 61, signs: 64,
  sitechest: 63, sitefoes: 66, skirtlegs: 16, slamdamage: 142, sleeperpose: 91, sleeperreach: 96, slimes: 46, slimeseed: 61,
  slimesplit: 57, slipdate: 43, smoke: 119, snowpine: 15, snowrepaint: 68, spentblow: 50, spentguard: 102, spiders: 56,
  stairrail: 134, standingcount: 46, stolenstack: 60, stonecress: 46, stowdeck: 74, streetcone: 60, swingblade: 48,
  talkaim: 63, targetof: 55, taskhomes: 88, tells: 48, theft: 80, theftlevel1: 73, thresholdname: 87, tithe: 45, told: 130,
  toldpages: 45, townbarrels: 126, townbio: 75, towngate: 110, townlocks: 61, townroads: 103, tpfists: 54, tpguard: 54,
  tpshots: 56, tpswing: 51, tpweapons: 44, tradebits: 42, trapseed: 44, trees: 45, trolls: 68, turnin: 53, twins: 55,
  twinsrebuild: 60, underclothes: 47, unequip: 46, walls: 79, wanderface: 52, wardall: 55, wardswift: 50, warwords: 54,
  watch: 69, waybands: 73, wayfinding: 52, wealth: 51, weapons: 51, weather: 102, wholepoints: 46, wildseed: 51,
  windows: 52, witness: 98, witnessrange: 57, wokennight: 85, wolfcloak: 85, wolves: 62, woodenkit: 21, worldjournal: 49,
  worldloot: 48, worldtarget: 58, wraithfloat: 55, wraithhood: 64, wreck: 52, wxplace: 70, wyrm: 51, yardpanel: 61,
  yardplay: 161 };
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
