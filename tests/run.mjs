// Run every *.test.mjs in this folder, one browser each, and report. `node tests/run.mjs saves` runs one.
// `node tests/run.mjs --shard=2/8` runs the second of eight shares (CI ran eight side by side from Session 254, twelve since Session 652, fourteen since Session 915, sixteen since Session 1138).
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
// Session 1138: refreshed from CI's run 39146959449 (auto/systems af62671, 18 Oct, 502 suites), whose shard 14 was cut at the
// hour on its last suite with nothing failed: kittown took 346 s where 60 was counted, rowelines 354 for 254, mapnotes 144
// for 137, and 49 suites were not listed. 491 suites timed (fistfight's FLAKY 264 s halved); the ten that run did not time
// keep their old numbers. CI runs sixteen shards from this session (check.yml).
// Session 1145 (19 Oct 2026, the new look the default): every suite CI timed on the new look (afb6b37, 442 suites) takes that time.
const SECS = { aimbubble: 90, aircap: 65, airdash: 86, airstep: 98, aldwynword: 79, armourfit: 74, armourkit: 47,
 armourlines: 63, 'armourlines-numbers': 74, articles: 75, ashenburn: 86, ashwort: 5, attrdmg: 47, attrpromise: 62,
 autosave: 201, autumn: 125, backroomdoor: 233, backslot: 41, backtobread: 55, barber: 107, barberbox: 110, barberchair: 82,
 barberfee: 82, barberway: 62, barter: 53, bear: 55, beastfall: 66, beat: 305, bedaim: 147, bedrollprompt: 65, bellwords: 46,
 bellwreck: 93, blacksail: 180, bladehit: 50, bladekey: 51, bladestone: 56, boardlines: 53, bodies: 85, bornhere: 58,
 bossbarunder: 128, bowsway: 52, boxseed: 54, boxspots: 124, bridgenames: 107, bridges: 59, bronzehelm: 25, buffstack: 50,
 buildsite: 56, burglary: 180, buyprice: 82, calendar: 71, camps: 54, campsack: 67, captainguard: 73, caravan: 62, cargo: 64,
 carraignight: 175, cavedoor: 41, cellrace: 79, chairstash: 64, challenge: 52, chamerchant: 63, chapel: 108, chasesight: 62,
 chestpicks: 105, churchname: 64, churchnames: 55, civicfurn: 135, cloakbody: 66, cloakcorpse: 49, cloakden: 272, cloakguild: 43,
 cloaks: 68, coach: 73, coachboard: 60, coachinn: 110, coachseat: 86, coachstop: 76, coachvoice: 57, coldhearth: 122,
 combatmusic: 14, compactclaim: 63, compactrefit: 144, constable: 130, containerids: 60, coopsaves: 161, corpsebody: 57,
 corpseglow: 17, counters: 42, cowards: 73, crawler: 55, creator: 17, creatureao: 44, crime1: 73, crime2: 61, crime3: 61,
 crime4: 70, crime5: 67, crownclaim: 87, dangertier: 59, datedguild: 87, datedwork: 6, dateline: 66, dayseed: 132, dazed: 79,
 deadkeys: 142, deadtree: 12, deathplace: 63, deckprops: 56, demonickit: 28, diedload: 263, dlgkeys: 51, dmgnums: 92,
 doorbed: 326, doorids: 63, doublenames: 11, dragonsize: 55, drownedbell: 54, drydoors: 111, due: 48, duel: 87, duelrhythm: 77,
 dunconts: 78, dunfurn: 316, dungeon: 69, dungeonchase: 62, dungeonexit: 249, dungeonfoes: 61, dungeonpace: 66, dunseed: 89,
 dunwarm: 350, enchantmotes: 52, export: 30, factorpanel: 53, falls: 454, faolchu: 52, feasts: 50, feastsquare: 97,
 featurenames: 8, ferry: 71, fiercewolf: 77, fishseed: 58, fistfight: 95, fists: 81, fistswing: 134, flashshare: 51,
 foearmour: 42, foelogname: 46, foereach: 49, foes: 90, foeseed: 74, foewarm: 97, foeweapons: 23, fortbarracks: 121, fortcot: 138,
 fortdoor: 72, fortfurn: 181, forthall: 119, fortify: 52, fortring: 71, fortunecaor: 41, fortunecard: 47, fortwalk: 399,
 fphands: 63, fpshield: 46, fpweapons: 65, furniture: 63, gait: 111, gargoyle: 55, gateblade: 57, gateguards: 258,
 gateschool: 54, ghoulface: 15, ghoulwalk: 7, gladeherbs: 47, goblinbody: 10, goblins: 44, goldtier: 47, golem: 78,
 guardarmour: 61, guardintro: 71, guardlevel1: 43, guardplay: 123, guardseed: 63, guardsindoor: 163, guildfurn: 132,
 handback: 71, harbour: 77, hearthcast: 82, helmhair: 30, herbhidden: 47, herbids: 56, herbparity: 46, herbstub: 69,
 hitseed: 70, hoardmetal: 54, hoardspot: 74, homefurn: 81, homenames: 104, homesleep: 93, honesttown: 69, horselegs: 14,
 hourhitch: 402, houseao: 127, housebuy: 45, houses: 61, hptail: 99, hubregen: 40, hubreturn: 119, hullbakes: 54, hullshape: 50,
 huntvariant: 52, innrooms: 160, innvoice: 60, inspdungeons: 12, inspector: 26, inspplaces: 13, intaim: 146, intdooraim: 190,
 intdoors: 74, interiors: 65, intnpcs: 63, intreach: 197, investlacks: 75, investwords: 71, ironwork: 56, jnecho: 50,
 jnlinks: 40, jobcount: 60, jobfoereload: 67, jobids: 49, jobseed: 49, journal: 156, keep: 58, keepercone: 61, keeperwalk: 655,
 kit: 104, kitlots: 112, kittown: 324, lairdoor: 95, lairgrade: 52, lairhoard: 79, lairload: 101, lairmaster: 63, lairname: 82,
 lairrumour: 43, lairtheme: 147, lampheld: 82, latesave: 108, ledgerplural: 54, legacyfoes: 97, legacyhalls: 62,
 legacyshells: 58, legacyshops: 60, levelmarks: 48, levelpanel: 47, livepick: 152, lockfair: 79, lockon: 99, lockpicks: 85,
 locks: 124, locksight: 86, lockswitch: 51, lod: 405, looknew: 130, lookpair: 465, lootpicks: 110, lootseed: 75, lvact: 55,
 mainmarks: 83, mainquest: 66, mainrun: 900, makershermit: 76, makertools: 101, makerwords: 49, mapnotes: 136, mapquests: 79,
 mapseals: 121, mapsharp: 105, masterslam: 53, metkey: 75, mimic: 11, mimicspots: 102, moundsolid: 49, mushrooms: 86, names: 74,
 netclimb: 69, netlook: 65, newelstair: 113, nightpick: 74, noonring: 45, oddfurn: 65, ogre: 56, packshape: 80, padspawn: 68,
 panelfocus: 858, parryclock: 61, parrydeath: 42, pauseleaf: 273, penance: 77, people: 207, peopleao: 52, perf: 101,
 perkarmour: 47, perkarms: 45, perkbody: 60, perkbow: 60, perkcatch: 53, perkfall: 47, perkguard: 47, perkhand: 56,
 perkring: 44, perkthrow: 53, pickupids: 42, piratehold: 49, pirateram: 64, placenames: 56, placesave: 900, plants: 94,
 player: 68, poinames: 51, poipreview: 51, pois: 55, portlane: 147, posture: 49, posturefloor: 47, postureregen: 46, prices: 62,
 q7world: 278, qsfresh: 53, qtybutton: 64, quaynet: 158, quaywall: 99, questfoes: 156, questgold: 65, questtargets: 119,
 ragdoll: 131, ragdollsearch: 49, raisevarek: 62, reachtable: 46, reader: 405, register: 70, renewal: 219, resolver: 94,
 restslip: 51, ringtrial: 50, riverquay: 99, rivers: 79, riversail: 59, roadseed: 68, rocks: 70, roll: 61, rowebeats: 215,
 rowelines: 293, sackseed: 50, sailtrim: 77, saltwater: 238, savelabel: 112, savepic: 136, saveretry: 116, saves: 152, saveui: 497,
 scaleratio: 823, scalerooms: 91, schoolroster: 140, scorpion: 64, seahint: 42, seaseed: 50, seasonwx: 50, seawear: 76,
 secondary: 63, selltopic: 55, settingsheet: 264, seventhniche: 78, shark: 69, sheath: 43, shelfbook: 93, shells: 55,
 shipaim: 51, shiparchers: 47, shipdead: 49, shiphull: 71, shiphulls: 43, shiplog: 108, shipmoor: 66, shipnets: 86, ships: 55,
 shipwreck: 49, shipwright: 127, shipwrightvoice: 40, shoperrands: 130, shopfurn: 105, shophours: 107, shoprows: 71,
 shopsight: 318, shoreplaces: 66, shoresave: 67, shrinenames: 66, shuttle: 47, shuttleclaim: 86, shuttletrial: 85,
 siegeturn: 88, sightline: 59, signposts: 48, signs: 83, sitechest: 77, sitefoes: 64, skillcurve: 65, skillsave: 55,
 skirtlegs: 17, slamdamage: 169, sleeperpose: 96, sleeperreach: 154, slimes: 62, slimeseed: 65, slimesplit: 59, slipdate: 50,
 smoke: 284, snowpine: 10, snowrepaint: 76, speechprice: 44, spentblow: 67, spentguard: 92, spiders: 45, spirewatch: 140,
 stairrail: 214, standingcount: 46, stepup: 67, stolenstack: 51, stonecress: 49, stowdeck: 76, streetcone: 56, swimdepth: 65,
 swingblade: 59, talkaim: 93, targetof: 47, taskhomes: 95, tells: 48, theft: 88, theftlevel1: 70, thresholdname: 147,
 tiergrade: 62, tierkinds: 47, tierlevelfree: 59, tiermainpath: 54, tiermap: 93, tiertrap: 45, tithe: 49, told: 191,
 toldpages: 48, touchrange: 60, townbarrels: 183, townbio: 67, towngate: 110, townlocks: 74, townroads: 105, tpfists: 57,
 tpguard: 63, tpshots: 80, tpswing: 68, tpweapons: 55, tradebits: 49, trapseed: 49, trees: 57, trolls: 66, turnin: 71,
 twins: 71, twinsrebuild: 68, underclothes: 50, unequip: 42, walls: 92, wanderface: 55, wardall: 63, wardswift: 60,
 warwords: 63, watch: 110, waybands: 53, wayfinding: 64, waylamp: 196, wealth: 66, weapons: 57, weather: 86, wholepoints: 50,
 wildseed: 51, windows: 60, witness: 100, witnessrange: 61, wokennight: 88, wolfcloak: 93, wolves: 73, woodenkit: 28,
 worldjournal: 64, worldloot: 51, worldtarget: 82, wraithfloat: 55, wraithhood: 72, wreck: 57, wxplace: 108, wyrm: 60,
 yardpanel: 64, yardplay: 218,
  beastwall: 64
};
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
