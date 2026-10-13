// The Drowned Bell's claimant, the Compact (Session 788; the page's Sea row, the approved draft's words): any Factor in Aurenne
// asks for the bell while it is on you. Given: the rank of Factor (or a service counted, or no rank if sworn elsewhere), and the
// cog by what you sail: a cog at the quay, your smaller ship refitted or raised as a cog, or the cog's worth if yours is larger.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const port = await page.evaluate(() => { WORLD.anchoredPlaces(); const seat = siteAnywhere(FACTIONS.compact.seat);
  const P = allPorts().filter(p => nationKeyOf(...cellOf(p.x, p.z)) === 'aurenne' && shoreDir(p)).sort((a, b) => Math.hypot(a.x - seat.x, a.z - seat.z) - Math.hypot(b.x - seat.x, b.z - seat.z))[0];
  worldState.ship = null; px = P.x; pz = P.z; return { id: P.id, name: P.name, seat: seat.id }; });
await g.settle(port.id);

const r = await page.evaluate(({ id, seatId }) => {
  const site = siteAnywhere(id), S = WORLD.settle.get(id); const lord = S.lordNpc && S.lordNpc.def; const out = { lordTitle: lord && lordFor(site).title, lordName: lord && lord.name };
  const keepG = gold;
  const fresh = (ship) => { delete worldState.artifacts; for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1); worldState.factions = {}; takeArtifact('drowned_bell');
    if (SHIP.mesh) { sc.remove(SHIP.mesh); SHIP.mesh = null; } worldState.ship = ship || null; if (ship && !ship.sunk) { spawnShip(site.x + 300, site.z, 0); applyShipClass(); } gold = 0; };
  const topic = () => compactBellTopics(site)[0];
  delete worldState.artifacts; out.none = compactBellTopics(site).length;
  fresh(); out.labels = lord.topics.map(t => t.label);
  const gl = allPorts().find(p => nationKeyOf(...cellOf(p.x, p.z)) === 'gatelands'); out.elsewhere = compactBellTopics(gl).length; out.atSeat = compactBellTopics(siteAnywhere(seatId)).length;
  const T = topic(); out.ask = T.label; out.askSay = T.response; out.follow = T.follow.map(f => f.label);
  // no ship, rank 0: Factor, and a cog at this quay
  out.gaveNew = T.follow[0].fn(); const C = fstate().compact; out.rankNew = C.rank; out.titleNew = FACTIONS.compact.ranks[C.rank - 1]; out.yielded = worldState.artifacts.drowned_bell.yielded;
  out.shipNew = worldState.ship && { cls: worldState.ship.cls, hull: worldState.ship.hull, L: SHIP.L, W: SHIP.W, mesh: !!SHIP.mesh, d: Math.round(Math.hypot(SHIP.x - site.x, SHIP.z - site.z)) }; out.after = compactBellTopics(site).length; out.bagBell = BAG.some(i => i.artifact === 'drowned_bell');
  // a sloop afloat, already Factor: a service counted, and she is refitted as a cog
  fresh({ cls: 'sloop', hull: 60, rig: 50, name: 'Gull' }); Object.assign(fstate().compact, { done: 6, rank: 2 }); out.gaveRanked = topic().follow[0].fn(); out.doneRanked = fstate().compact.done;
  out.shipRefit = { cls: worldState.ship.cls, hull: worldState.ship.hull, rig: worldState.ship.rig, L: SHIP.L }; out.goldRefit = gold;
  // a sloop on the bottom: raised as a cog in three days
  fresh({ cls: 'sloop', sunk: { x: site.x + 200, z: site.z }, name: 'Gull' }); const t0 = worldState.gameTimeAbsMinutes || 0; out.gaveSunk = topic().follow[0].fn();
  out.shipSunk = { cls: worldState.ship.cls, raise: worldState.ship.raise && { site: !!siteAnywhere(worldState.ship.raise.site), days: (worldState.ship.raise.due - t0) / 1440 } };
  // a galleon, sworn to the League: no rank, and the cog's worth in gold
  fresh({ cls: 'galleon', hull: 200, rig: 100, name: 'Heron' }); fstate().league.rank = 2; out.gaveSworn = topic().follow[0].fn(); out.rankSworn = fstate().compact.rank; out.goldSworn = gold; out.clsSworn = worldState.ship.cls;
  // kept; not now; in the stash
  fresh(); out.keep = topic().follow[1].response; out.not = topic().follow[2].response; out.keptStill = compactBellTopics(site).length; out.keptState = !!worldState.artifacts.drowned_bell.yielded;
  const b = BAG.findIndex(i => i.artifact === 'drowned_bell'); const bell = BAG.splice(b, 1)[0]; stashBag.push(bell); out.stash = compactBellTopics(site).length; stashBag.splice(stashBag.indexOf(bell), 1);
  delete worldState.artifacts; worldState.factions = {}; if (SHIP.mesh) { sc.remove(SHIP.mesh); SHIP.mesh = null; } worldState.ship = null; gold = keepG;
  return out; }, { id: port.id, seatId: port.seat });
console.log(JSON.stringify(r));
check(`nothing is asked without the bell, by a Gatelands harbour or at the Compact's seat (a Prior); ${port.name}'s ${r.lordTitle} asks with it`, r.none === 0 && r.elsewhere === 0 && r.atSeat === 0 && r.lordTitle === 'Factor', r);
check(`with the bell, ${r.lordName} offers *${r.ask}* with *${r.follow.join('*, *')}*`, r.labels.includes('The bell.') && r.follow.join('|') === 'Give it to the Compact.|I’ll keep it.|Not now.' && /le Reliquaire de la Marée/.test(r.askSay), r);
check(`given at rank 0 with no ship: *${r.gaveNew}*; ${r.titleNew}, the bell the Compact's, a cog ${r.shipNew && r.shipNew.d} from the town`, /entered as Factor of the Compact, Master, from today\. The cog is at the quay here\.$/.test(r.gaveNew) && r.rankNew === 2 && r.titleNew === 'Factor' && r.yielded === 'compact' && !r.bagBell && r.after === 0 && r.shipNew && r.shipNew.cls === 'cog' && r.shipNew.hull === 140 && r.shipNew.L === 17 && r.shipNew.W === 5.6 && r.shipNew.mesh && r.shipNew.d < 200, r);
check(`given as Factor with a sloop: *${r.gaveRanked}*; services ${r.doneRanked}, she is a cog at hull ${r.shipRefit.hull}`, /entered as a service to the house/.test(r.gaveRanked) && /refitted as a cog where she lies/.test(r.gaveRanked) && r.doneRanked === 7 && r.shipRefit.cls === 'cog' && r.shipRefit.hull === 140 && r.shipRefit.rig === 100 && r.shipRefit.L === 17 && r.goldRefit === 0, r);
check(`given with the sloop on the bottom: *${r.gaveSunk.split('. ').slice(-1)[0]}*; raised a cog in ${r.shipSunk.raise && r.shipSunk.raise.days} days`, /ordered her raised, a cog, in three days\.$/.test(r.gaveSunk) && r.shipSunk.cls === 'cog' && r.shipSunk.raise && r.shipSunk.raise.site && r.shipSunk.raise.days === 3, r);
check(`given while sworn to the League with a galleon: no rank, the cog's worth (${r.goldSworn})`, /^The reliquary is received/.test(r.gaveSworn) && /The house will pay the cog's worth instead: 1300 gold\.$/.test(r.gaveSworn) && r.rankSworn === 0 && r.goldSworn === 1300 && r.clsSworn === 'galleon', r);
check(`kept: *${r.keep}*; the topic stands and nothing is yielded`, /^As you wish\. The rolls will show it held by you/.test(r.keep) && /^Of course\. The offer is entered/.test(r.not) && r.keptStill === 1 && !r.keptState, r);
check('with the bell in the stash nothing is asked', r.stash === 0, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
