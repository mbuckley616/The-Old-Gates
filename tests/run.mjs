// Run every *.test.mjs in this folder, one browser each, and report. `node tests/run.mjs saves` runs one.
// `node tests/run.mjs --shard=2/8` runs the second of eight shares (CI ran eight side by side from Session 254, twelve since Session 652).
// `node tests/run.mjs --src=PATH` boots PATH instead of the repo's index.html (a split copy in a scratch folder, Session 368).
import fs from 'fs'; import path from 'path'; import { spawnSync } from 'child_process'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const shardArg = args.find(a => a.startsWith('--shard='));
const only = args.find(a => !a.startsWith('--'));
const srcArg = args.find(a => a.startsWith('--src='));
if (srcArg) process.env.OG_SRC = path.resolve(srcArg.slice(6));
let files = fs.readdirSync(here).filter(f => f.endsWith('.test.mjs') && (!only || f.startsWith(only))).sort();
// seconds each took on CI. Every suite refreshed from one run, the twelve shards of faa652b (auto/systems, 11 Oct), in
// Session 745, when shard 3 was cancelled at 60:19: panelfocus took 530 s and stairrail 219 and were counted as 60, and
// carraignight took 250 where 960 was guessed. (Earlier tables: Session 254's local run, CI's runs of 2 and 3 Oct in
// Sessions 434 and 454.) yardpanel was cut off by the cancel and is counted 90; dunwarm (Session 746) is a guess from this machine. A suite
// not listed counts as 60.
const SECS = { aimbubble: 68, armourfit: 60, armourkit: 52, armourlines: 70, 'armourlines-numbers': 59, articles: 57, ashenburn: 77,
  ashwort: 50, attrdmg: 44, attrpromise: 48, autosave: 129, autumn: 104, backroomdoor: 247, backslot: 50, barber: 67,
  barberbox: 78, barberchair: 66, barberfee: 72, barberway: 58, barter: 59, bear: 47, beastfall: 78, beat: 126, bedaim: 79,
  bedrollprompt: 121, blacksail: 171, bladehit: 54, boardlines: 79, bodies: 60, bornhere: 73, bossbarunder: 75, boxseed: 63,
  boxspots: 127, bridges: 55, bronzehelm: 17, buffstack: 49, buildsite: 53, burglary: 154, buyprice: 79, calendar: 73, camps: 57,
  campsack: 56, captainguard: 71, caravan: 56, cargo: 80, carraignight: 250, cavedoor: 51, cellrace: 90, chairstash: 57,
  challenge: 47, chamerchant: 62, chapel: 95, chasesight: 58, chestpicks: 110, churchname: 57, churchnames: 58, civicfurn: 85,
  cloakbody: 66, cloaks: 73, coach: 69, coachboard: 58, coachinn: 89, coachseat: 69, coachstop: 67, coachvoice: 56,
  coldhearth: 65, combatmusic: 14, compactrefit: 113, constable: 75, containerids: 57, coopsaves: 156, corpsebody: 52,
  corpseglow: 57, counters: 49, cowards: 64, crawler: 54, creator: 16, creatureao: 46, crime1: 70, crime2: 52, crime3: 55,
  crime4: 53, crime5: 51, datedguild: 45, datedwork: 48, dateline: 59, dayseed: 76, dazed: 57, deadkeys: 107, deadtree: 12,
  deathplace: 61, deckprops: 55, demonickit: 23, diedload: 262, dlgkeys: 67, doorbed: 151, doorids: 56, doublenames: 9,
  dragonsize: 59, drydoors: 101, due: 46, duel: 64, duelrhythm: 79, dunconts: 65, dunfurn: 151, dungeon: 64, dungeonchase: 54,
  dungeonexit: 149, dungeonfoes: 64, dungeonpace: 59, dunseed: 82, dunwarm: 360, enchantmotes: 45, export: 70, factorpanel: 53,
  falls: 435, faolchu: 48, feasts: 53, feastsquare: 68, featurenames: 11, ferry: 62, fiercewolf: 72, fishseed: 68, fistfight: 87,
  fists: 58, fistswing: 89, flashshare: 59, foearmour: 48, foelogname: 45, foes: 84, foeseed: 76, foewarm: 89, foeweapons: 19,
  fortbarracks: 68, fortcot: 79, fortdoor: 85, fortfurn: 117, forthall: 68, fortify: 48, fortring: 77, fortunecaor: 47,
  fortunecard: 47, fortwalk: 322, fphands: 53, fpshield: 49, fpweapons: 55, furniture: 54, gait: 94, gargoyle: 63,
  gateguards: 188, ghoulface: 16, ghoulwalk: 9, gladeherbs: 49, goblinbody: 9, goblins: 50, golem: 61, guardarmour: 59,
  guardintro: 55, guardlevel1: 48, guardplay: 158, guardseed: 54, guardsindoor: 159, guildfurn: 78, handback: 62, harbour: 85,
  hearthcast: 61, helmhair: 25, herbhidden: 47, herbids: 53, herbparity: 48, herbstub: 70, hitseed: 59, hoardmetal: 52,
  hoardspot: 64, homefurn: 91, homenames: 97, homesleep: 94, honesttown: 52, horselegs: 17, hourhitch: 286, houseao: 62,
  housebuy: 59, houses: 62, hubregen: 49, hubreturn: 99, hullbakes: 58, hullshape: 53, huntvariant: 48, innrooms: 216,
  innvoice: 52, inspdungeons: 10, inspector: 31, inspplaces: 20, intaim: 82, intdooraim: 167, intdoors: 60, interiors: 55,
  intnpcs: 55, intreach: 237, investlacks: 62, investwords: 66, ironwork: 56, jnecho: 46, jnlinks: 47, jobfoereload: 69,
  jobids: 44, jobseed: 48, journal: 206, keep: 62, keepercone: 57, keeperwalk: 623, lairdoor: 78, lairgrade: 55, lairhoard: 72,
  lairload: 93, lairmaster: 58, lairname: 68, lairrumour: 47, lairtheme: 83, ledgerplural: 49, legacyfoes: 48, legacyhalls: 52,
  legacyshells: 47, legacyshops: 55, levelpanel: 48, livepick: 80, lockfair: 61, lockon: 91, lockpicks: 59, locks: 94,
  locksight: 59, lockswitch: 45, lod: 235, lootpicks: 106, lootseed: 58, lvact: 51, mainmarks: 70, mainquest: 101, mainrun: 459,
  mapnotes: 133, mapquests: 52, mapseals: 118, mapsharp: 74, masterslam: 59, metkey: 62, mimic: 46, mimicspots: 114,
  moundsolid: 52, mushrooms: 76, names: 54, netlook: 66, newelstair: 72, nightpick: 65, oddfurn: 51, ogre: 53, packshape: 61,
  panelfocus: 530, parryclock: 62, parrydeath: 53, pauseleaf: 157, penance: 88, people: 147, peopleao: 57, perf: 108,
  pickupids: 48, piratehold: 56, pirateram: 55, placenames: 59, placesave: 625, plants: 68, player: 73, poipreview: 46, pois: 50,
  portlane: 160, posture: 48, posturefloor: 45, postureregen: 45, prices: 62, q7world: 135, qsfresh: 48, qtybutton: 59,
  questfoes: 108, questgold: 55, questtargets: 117, ragdoll: 75, ragdollsearch: 45, raisevarek: 48, reader: 272, register: 52,
  renewal: 219, restslip: 50, riverquay: 103, rivers: 70, riversail: 58, roadseed: 90, rocks: 57, roll: 50, rowebeats: 250,
  rowelines: 326, sackseed: 44, sailtrim: 67, saltwater: 182, savelabel: 66, savepic: 104, saveretry: 75, saves: 129,
  saveui: 243, scorpion: 49, seahint: 49, seaseed: 47, seasonwx: 44, seawear: 76, secondary: 49, selltopic: 59,
  settingsheet: 136, shark: 56, shells: 56, shipaim: 46, shiparchers: 60, shipdead: 59, shiphull: 59, shiphulls: 45, shiplog: 96,
  shipmoor: 67, shipnets: 77, ships: 52, shipwreck: 54, shipwright: 116, shipwrightvoice: 48, shoperrands: 113, shopfurn: 85,
  shophours: 82, shoprows: 56, shopsight: 240, shoreplaces: 81, shoresave: 83, siegeturn: 60, signposts: 63, signs: 64,
  sitechest: 51, sitefoes: 57, skirtlegs: 16, slamdamage: 168, sleeperpose: 120, slimes: 58, slimeseed: 57, slimesplit: 56, slipdate: 46,
  smoke: 171, snowpine: 13, snowrepaint: 70, spentguard: 88, spiders: 52, stairrail: 219, standingcount: 47, stolenstack: 53,
  stonecress: 45, stowdeck: 73, streetcone: 58, swingblade: 61, talkaim: 64, targetof: 53, taskhomes: 119, tells: 48, theft: 107,
  theftlevel1: 69, thresholdname: 83, tithe: 47, told: 135, toldpages: 48, townbarrels: 150, townbio: 58, towngate: 106, townlocks: 71,
  townroads: 74, tpfists: 49, tpguard: 58, tpshots: 61, tpswing: 52, tpweapons: 55, tradebits: 48, trapseed: 52, trees: 57,
  trolls: 65, turnin: 50, twins: 77, twinsrebuild: 58, underclothes: 49, unequip: 46, walls: 86, wanderface: 66, wardall: 53,
  wardswift: 54, warwords: 90, watch: 85, waybands: 62, wayfinding: 52, wealth: 55, weapons: 56, weather: 83, wholepoints: 52, wildseed: 52,
  windows: 52, witness: 94, witnessrange: 50, wokennight: 110, wolves: 74, woodenkit: 21, worldjournal: 57, worldloot: 48, worldtarget: 74,
  wraithfloat: 55, wraithhood: 59, wreck: 54, wxplace: 105, wyrm: 52, yardpanel: 90, yardplay: 304 };
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
