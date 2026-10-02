// The shipwright in the voice of his harbour's people (Session 416; the quest review's Finding 5, run 5). His replies
// (raise, fetch, mend, refit, sails, hold) were Markish in every port; now they follow `peopleOfSite`, with Markish
// (the old text) the fallback. Also Finding 6: no Ald- name left in the Mark's bank.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const EXPECT = {
  gatelander: { raisePoor: 'Raising her is 255 gold. The sea gives nothing back for less, and it gives grudgingly then.', raised: 'Three days, and she\'ll be lying at the quay here, Weaver willing.', fetched: 'The lads\'ll have her alongside before your cup\'s cold. She\'s at the quay.', mended: ' in the yard, and she\'s sound again, hull and rig. Treat her kindly and she\'ll return it.', refitPoor: 'A cog hull is 900 gold. A bigger boat\'s a bigger bill, the same as a bigger house.', sailed: ' knots with a wind, and the wind is the Weaver\'s business, not mine.', held: 'More room below. You\'ll carry 50 more aboard her, and you\'ll find a way to fill it.' },
  markman: { raisePoor: 'Raising her is 255 gold.', raised: 'Three days, and she\'ll be lying at the quay here.', fetched: 'Lads\'ll have her alongside by the time you\'ve finished your drink. She\'s at the quay.', mended: ' in the yard. She\'s sound again, hull and rig.', refitPoor: 'A cog hull is 900 gold.', sailed: ' knots with a wind.', held: 'More room below. You\'ll carry 50 more aboard her.' },
  aurennais: { raisePoor: 'The raising is 255 gold, Master, payable before the work.', raised: 'Three days, Master, and she will be lying at the quay here. The yard\'s receipt is entered.', fetched: 'The yard\'s crew has her alongside, Master. She is at the quay, as agreed.', mended: ' in the yard, Master. She is sound again, hull and rig, and the work is warranted to the next storm, if not through it.', refitPoor: 'A cog hull is 900 gold, Master. The yard does not extend credit on hulls.', sailed: ' knots. The yard warrants the cloth, not the wind.', held: 'More room below, Master. She is rated for 50 more aboard.' },
  oldblood: { raisePoor: '255 gold, to raise her.', raised: 'Three days. She will be at the quay.', fetched: 'She is at the quay.', mended: ' in the yard. Sound again, hull and rig.', refitPoor: 'A cog hull is 900 gold.', sailed: ' knots, with a wind.', held: 'More room below. 50 more.' } };

const r = await page.evaluate(() => {
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  const ports = WORLD.allPorts(); const byPeople = {};
  for (const s of ports) { const p = WORLD.peopleOfSite(s); if (!byPeople[p]) byPeople[p] = s; }
  const pick = (T, re) => T.find(t => re.test(t.label));
  const out = [];
  for (const [people, s] of Object.entries(byPeople)) {
    const row = { people, port: s.id };
    // raise: sunk sloop, sails 1 and hold 1 (30% of 850 = 255)
    worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 1, cargo: 1, hold: {}, sunk: { x: s.x + 900, z: s.z } };
    gold = 10; row.raisePoor = pick(WORLD.upgradeTopics(s), /^Raise/).fn();
    gold = 10000; row.raised = pick(WORLD.upgradeTopics(s), /^Raise/).fn();
    // fetch: afloat 2,000 units off, then mend her at the quay
    worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} };
    WORLD.spawnShip(s.x + 2000, s.z, 0);
    gold = 1; row.fetchPoor = pick(WORLD.upgradeTopics(s), /^Fetch/).fn();
    gold = 10000; row.fetched = pick(WORLD.upgradeTopics(s), /^Fetch/).fn();
    worldState.ship.hull = 60;
    gold = 1; row.mendPoor = pick(WORLD.upgradeTopics(s), /^Mend/).fn();
    gold = 10000; row.mended = pick(WORLD.upgradeTopics(s), /^Mend/).fn();
    gold = 1; row.refitPoor = pick(WORLD.upgradeTopics(s), /^Refit/).fn(); row.sailsPoor = pick(WORLD.upgradeTopics(s), /^Better sails/).fn(); row.holdPoor = pick(WORLD.upgradeTopics(s), /^Bigger hold/).fn();
    gold = 100000; row.refitted = pick(WORLD.upgradeTopics(s), /^Refit/).fn(); row.sailed = pick(WORLD.upgradeTopics(s), /^Better sails/).fn();
    worldState.ship.cargo = 1; row.held = pick(WORLD.upgradeTopics(s), /^Bigger hold/).fn();
    row.gold = gold; out.push(row); }
  return { rows: out, names: WORLD.NAMES.anglo.m };
});
for (const x of r.rows) console.log(JSON.stringify(x));
const peoples = r.rows.map(x => x.people);
check('ports of at least three peoples were found', peoples.length >= 3, peoples);
for (const x of r.rows) { const E = EXPECT[x.people] || EXPECT.markman;
  check(`${x.people} (${x.port}): the raise, short and paid`, x.raisePoor === E.raisePoor && x.raised.startsWith(E.raised), [x.raisePoor, x.raised]);
  check(`${x.people}: the fetch and the mend`, x.fetched === E.fetched && x.mended.endsWith(E.mended) && /^\d+ hours|^An hour/.test(x.mended) && typeof x.fetchPoor === 'string' && typeof x.mendPoor === 'string', [x.fetchPoor, x.fetched, x.mendPoor, x.mended]);
  check(`${x.people}: the refit, the canvas and the hold`, x.refitPoor === E.refitPoor && x.sailed.endsWith(E.sailed) && x.held === E.held && typeof x.sailsPoor === 'string' && typeof x.holdPoor === 'string' && typeof x.refitted === 'string', [x.refitPoor, x.refitted, x.sailsPoor, x.sailed, x.holdPoor, x.held]);
  check(`${x.people}: every reply is a line of text, none undefined`, Object.values(x).every(v => typeof v !== 'string' || !/undefined|\[object|=>/.test(v)), x); }
check('the Mark’s bank has no Ald- name (Aldhelm, Ealdred gone; Eadwulf, Wigmund in)', !r.names.some(n => /^E?ald/i.test(n)) && r.names.includes('Eadwulf') && r.names.includes('Wigmund'), r.names);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
