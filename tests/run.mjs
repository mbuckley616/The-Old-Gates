// Run every *.test.mjs in this folder, one browser each, and report. `node tests/run.mjs saves` runs one.
// `node tests/run.mjs --shard=2/8` runs the second of eight shares (CI ran eight side by side from Session 254, twelve since Session 652, fourteen since Session 915, sixteen since Session 1138).
// `node tests/run.mjs --look=new` boots each suite on three.js 0.170 (Session 822).
// `node tests/run.mjs --src=PATH` boots PATH instead of the repo's index.html (a split copy in a scratch folder, Session 368).
import fs from 'fs'; import path from 'path'; import { spawnSync } from 'child_process'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const shardArg = args.find(a => a.startsWith('--shard='));
const only = args.find(a => !a.startsWith('--'));
const srcArg = args.find(a => a.startsWith('--src='));
if (srcArg) process.env.OG_SRC = path.resolve(srcArg.slice(6));
// `--look=new` boots every suite on three.js 0.170 (`?look=new`, Session 822); the default is the old look, r128
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
// Session 1138: refreshed from CI's run 39146959449 (auto/systems af62671, 18 Oct, 502 suites), whose shard 14 was cut at the
// hour on its last suite with nothing failed: kittown took 346 s where 60 was counted, rowelines 354 for 254, mapnotes 144
// for 137, and 49 suites were not listed. 491 suites timed (fistfight's FLAKY 264 s halved); the ten that run did not time
// keep their old numbers. CI runs sixteen shards from this session (check.yml).
const SECS = { aimbubble: 88, aircap: 65, airdash: 86, airstep: 98, aldwynword: 77, armourfit: 66, armourkit: 56,
 armourlines: 63, 'armourlines-numbers': 59, articles: 60, ashenburn: 82, ashwort: 52, attrdmg: 47, attrpromise: 57,
 autosave: 158, autumn: 88, backroomdoor: 247, backslot: 51, backtobread: 56, barber: 74, barberbox: 72, barberchair: 67,
 barberfee: 72, barberway: 62, barter: 58, bear: 49, beastfall: 92, beat: 128, bedaim: 93, bedrollprompt: 108, bellwords: 44,
 bellwreck: 71, blacksail: 186, bladehit: 46, bladekey: 53, bladestone: 61, boardlines: 57, bodies: 73, bornhere: 60,
 bossbarunder: 86, bowsway: 52, boxseed: 57, boxspots: 101, bridgenames: 103, bridges: 56, bronzehelm: 31, buffstack: 46,
 buildsite: 71, burglary: 156, buyprice: 78, calendar: 65, camps: 63, campsack: 55, captainguard: 67, caravan: 59, cargo: 86,
 carraignight: 194, cavedoor: 57, cellrace: 77, chairstash: 66, challenge: 46, chamerchant: 64, chapel: 90, chasesight: 65,
 chestpicks: 114, churchname: 66, churchnames: 61, civicfurn: 85, cloakbody: 62, cloakcorpse: 52, cloakden: 272, cloakguild: 48,
 cloaks: 62, coach: 62, coachboard: 57, coachinn: 89, coachseat: 72, coachstop: 68, coachvoice: 57, coldhearth: 84,
 combatmusic: 14, compactclaim: 64, compactrefit: 138, constable: 83, containerids: 61, coopsaves: 168, corpsebody: 54,
 corpseglow: 58, counters: 49, cowards: 76, crawler: 55, creator: 14, creatureao: 44, crime1: 77, crime2: 62, crime3: 57,
 crime4: 55, crime5: 57, crownclaim: 62, dangertier: 59, datedguild: 46, datedwork: 45, dateline: 57, dayseed: 136, dazed: 64,
 deadkeys: 105, deadtree: 14, deathplace: 58, deckprops: 49, demonickit: 27, diedload: 161, dlgkeys: 91, dmgnums: 112,
 doorbed: 210, doorids: 58, doublenames: 10, dragonsize: 57, drownedbell: 47, drydoors: 99, due: 47, duel: 86, duelrhythm: 86,
 dunconts: 81, dunfurn: 218, dungeon: 92, dungeonchase: 60, dungeonexit: 156, dungeonfoes: 67, dungeonpace: 60, dunseed: 85,
 dunwarm: 176, enchantmotes: 47, export: 80, factorpanel: 54, falls: 384, faolchu: 49, feasts: 55, feastsquare: 84,
 featurenames: 10, ferry: 61, fiercewolf: 67, fishseed: 63, fistfight: 132, fists: 57, fistswing: 88, flashshare: 58,
 foearmour: 44, foelogname: 52, foereach: 49, foes: 91, foeseed: 86, foewarm: 91, foeweapons: 22, fortbarracks: 67, fortcot: 96,
 fortdoor: 82, fortfurn: 122, forthall: 78, fortify: 45, fortring: 79, fortunecaor: 51, fortunecard: 47, fortwalk: 324,
 fphands: 62, fpshield: 58, fpweapons: 64, furniture: 68, gait: 81, gargoyle: 59, gateblade: 49, gateguards: 195,
 gateschool: 55, ghoulface: 18, ghoulwalk: 9, gladeherbs: 46, goblinbody: 11, goblins: 45, goldtier: 47, golem: 70,
 guardarmour: 57, guardintro: 62, guardlevel1: 52, guardplay: 148, guardseed: 56, guardsindoor: 149, guildfurn: 73,
 handback: 59, harbour: 64, hearthcast: 63, helmhair: 36, herbhidden: 50, herbids: 48, herbparity: 52, herbstub: 67,
 hitseed: 56, hoardmetal: 47, hoardspot: 71, homefurn: 84, homenames: 93, homesleep: 97, honesttown: 58, horselegs: 14,
 hourhitch: 430, houseao: 71, housebuy: 75, houses: 77, hptail: 70, hubregen: 45, hubreturn: 88, hullbakes: 58, hullshape: 58,
 huntvariant: 45, innrooms: 178, innvoice: 55, inspdungeons: 12, inspector: 32, inspplaces: 20, intaim: 110, intdooraim: 199,
 intdoors: 69, interiors: 61, intnpcs: 62, intreach: 242, investlacks: 68, investwords: 59, ironwork: 62, jnecho: 45,
 jnlinks: 45, jobcount: 60, jobfoereload: 78, jobids: 51, jobseed: 120, journal: 220, keep: 70, keepercone: 56, keeperwalk: 623,
 kit: 67, kitlots: 109, kittown: 346, lairdoor: 89, lairgrade: 47, lairhoard: 72, lairload: 101, lairmaster: 58, lairname: 76,
 lairrumour: 47, lairtheme: 109, lampheld: 87, latesave: 108, ledgerplural: 47, legacyfoes: 50, legacyhalls: 51,
 legacyshells: 50, legacyshops: 52, levelmarks: 48, levelpanel: 52, livepick: 106, lockfair: 61, lockon: 98, lockpicks: 59,
 locks: 91, locksight: 64, lockswitch: 50, lod: 285, looknew: 112, lookpair: 428, lootpicks: 112, lootseed: 59, lvact: 51,
 mainmarks: 74, mainquest: 70, mainrun: 590, makershermit: 98, makertools: 107, makerwords: 51, mapnotes: 144, mapquests: 65,
 mapseals: 100, mapsharp: 82, masterslam: 56, metkey: 68, mimic: 52, mimicspots: 102, moundsolid: 52, mushrooms: 82, names: 62,
 netclimb: 58, netlook: 73, newelstair: 72, nightpick: 73, noonring: 56, oddfurn: 57, ogre: 51, packshape: 68, padspawn: 68,
 panelfocus: 483, parryclock: 62, parrydeath: 45, pauseleaf: 328, penance: 83, people: 151, peopleao: 52, perf: 107,
 perkarmour: 47, perkarms: 45, perkbody: 60, perkbow: 60, perkcatch: 53, perkfall: 47, perkguard: 47, perkhand: 56,
 perkring: 44, perkthrow: 53, pickupids: 49, piratehold: 51, pirateram: 51, placenames: 54, placesave: 502, plants: 74,
 player: 80, poinames: 48, poipreview: 52, pois: 55, portlane: 134, posture: 46, posturefloor: 47, postureregen: 48, prices: 66,
 q7world: 207, qsfresh: 51, qtybutton: 66, quaynet: 117, quaywall: 72, questfoes: 134, questgold: 67, questtargets: 133,
 ragdoll: 84, ragdollsearch: 45, raisevarek: 49, reachtable: 46, reader: 330, register: 55, renewal: 322, resolver: 68,
 restslip: 60, ringtrial: 61, riverquay: 108, rivers: 69, riversail: 59, roadseed: 82, rocks: 56, roll: 54, rowebeats: 276,
 rowelines: 354, sackseed: 51, sailtrim: 74, saltwater: 224, savelabel: 83, savepic: 97, saveretry: 79, saves: 135, saveui: 229,
 scaleratio: 551, scalerooms: 96, schoolroster: 125, scorpion: 53, seahint: 47, seaseed: 49, seasonwx: 49, seawear: 63,
 secondary: 51, selltopic: 58, settingsheet: 194, seventhniche: 69, shark: 57, sheath: 43, shelfbook: 93, shells: 58,
 shipaim: 50, shiparchers: 59, shipdead: 59, shiphull: 67, shiphulls: 46, shiplog: 97, shipmoor: 72, shipnets: 74, ships: 54,
 shipwreck: 51, shipwright: 106, shipwrightvoice: 46, shoperrands: 136, shopfurn: 106, shophours: 90, shoprows: 54,
 shopsight: 249, shoreplaces: 71, shoresave: 63, shrinenames: 66, shuttle: 50, shuttleclaim: 58, shuttletrial: 66,
 siegeturn: 76, sightline: 59, signposts: 58, signs: 68, sitechest: 53, sitefoes: 70, skillcurve: 65, skillsave: 55,
 skirtlegs: 15, slamdamage: 163, sleeperpose: 95, sleeperreach: 104, slimes: 61, slimeseed: 63, slimesplit: 58, slipdate: 46,
 smoke: 223, snowpine: 14, snowrepaint: 69, speechprice: 44, spentblow: 65, spentguard: 100, spiders: 60, spirewatch: 140,
 stairrail: 199, standingcount: 51, stepup: 67, stolenstack: 59, stonecress: 48, stowdeck: 73, streetcone: 62, swimdepth: 65,
 swingblade: 56, talkaim: 84, targetof: 49, taskhomes: 105, tells: 47, theft: 84, theftlevel1: 70, thresholdname: 90,
 tiergrade: 62, tierkinds: 47, tierlevelfree: 59, tiermainpath: 54, tiermap: 93, tiertrap: 45, tithe: 45, told: 148,
 toldpages: 48, touchrange: 60, townbarrels: 124, townbio: 64, towngate: 111, townlocks: 60, townroads: 83, tpfists: 57,
 tpguard: 59, tpshots: 80, tpswing: 56, tpweapons: 54, tradebits: 50, trapseed: 49, trees: 57, trolls: 66, turnin: 59,
 twins: 67, twinsrebuild: 54, underclothes: 48, unequip: 48, walls: 75, wanderface: 65, wardall: 49, wardswift: 60,
 warwords: 62, watch: 96, waybands: 54, wayfinding: 57, waylamp: 114, wealth: 66, weapons: 64, weather: 86, wholepoints: 50,
 wildseed: 51, windows: 50, witness: 100, witnessrange: 57, wokennight: 88, wolfcloak: 93, wolves: 73, woodenkit: 35,
 worldjournal: 64, worldloot: 47, worldtarget: 79, wraithfloat: 55, wraithhood: 72, wreck: 49, wxplace: 96, wyrm: 60,
 yardpanel: 64, yardplay: 218 };
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
