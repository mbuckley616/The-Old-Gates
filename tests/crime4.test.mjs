// The crime system, part 4 (Session 158): the priest hears a confession; the nation's faction reads your record.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const confess = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const site = S.site; const pn = S.npcs.find(n => n.def && /priest/i.test(n.def.role || '')); if (!pn) return { noPriest: S.npcs.map(n => n.def && n.def.role).slice(0, 10) };
  const topics = () => pn.def._extraFn ? pn.def._extraFn() : []; const none = topics().length;
  worldState.crime = { dunmore: { bounty: 0, debt: 2, last: 0 } }; WORLD.addFavor(site, -2); gold = 500; const f0 = WORLD.favor(site);
  const t = topics().find(x => x.label === 'Confess.'); if (!t) return { noTopic: topics().map(x => x.label) };
  const first = t.fn(); const after1 = { gold, debt: worldState.crime.dunmore.debt, favor: WORLD.favor(site) };
  const again = t.fn(); worldState.crime.dunmore.confessed -= 3; const third = t.fn(); const after3 = { debt: worldState.crime.dunmore.debt, favor: WORLD.favor(site) };
  return { none, f0, first, after1, again, third, after3, gone: topics().length }; });
check('the priest hears a confession: a tithe of 25 gold buys back a point of favour, once in three days', confess.none === 0 && confess.f0 === -2 && /heard/.test(confess.first) && confess.after1.gold === 475 && confess.after1.debt === 1 && confess.after1.favor === -1 && /have confessed/.test(confess.again) && /heard/.test(confess.third) && confess.after3.debt === 0 && confess.after3.favor === 0 && confess.gone === 0, confess);

const guard = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const site = S.site; const pn = S.npcs.find(n => n.def && /priest/i.test(n.def.role || '')); const topics = () => pn.def._extraFn();
  worldState.crime = { dunmore: { bounty: 125, debt: 5, last: 0, shut: true } }; worldState.church = { notes: [{ kind: 'guard', site: 'dunmore', day: 0 }] };
  const refused = topics().find(x => x.label === 'Confess.').fn(); worldState.crime.dunmore.bounty = 0; worldState.crime.dunmore.shut = false; const heard = topics().find(x => x.label === 'Confess.').fn();
  return { refused, heard, absolved: worldState.church.notes[0].absolved != null }; });
check('not for a guard\'s death while the town is unpaid; paid, it is heard and the note absolved', /not paid/.test(guard.refused) && /dead man had a name/.test(guard.heard) && guard.absolved, guard);

const faction = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const site = S.site; const F = WORLD.fstate(); F.crown.done = 6; F.crown.rank = 2; worldState.crime = {}; px = site.x; pz = site.z;
  const clean = WORLD.priceMulHere(); worldState.crime = { dunmore: { bounty: 25, debt: 1, last: 0 } }; const owing = WORLD.priceMulHere(); const rec = WORLD.nationRecord('gatelands');
  const seat = WORLD.factionTopics({ id: 'coeur_de_vie', x: site.x, z: site.z, name: 'Coeur de Vie' }); worldState.crime = {}; const seatClean = WORLD.factionTopics({ id: 'coeur_de_vie', x: site.x, z: site.z, name: 'Coeur de Vie' });
  WORLD.guardKilled({ _guard: { site: 'dunmore' } }); return { clean: +clean.toFixed(3), owing: +owing.toFixed(3), rec: rec && rec.name, seat: seat.map(t => t.label + ' / ' + (t.response || '')), seatClean: seatClean.map(t => t.label).slice(0, 2), done: F.crown.done, rank: F.crown.rank }; });
check('the Crown reads the record: no discount and no service while a fine stands; a guard\'s death costs a service and the rank', faction.owing > faction.clean && Math.abs(faction.owing / faction.clean - 1 / .9) < .01 && faction.rec === 'Dunmore' && faction.seat.length === 1 && /Not while Dunmore/.test(faction.seat[0]) && /Serve the Crown\./.test(faction.seatClean[0]) && faction.done === 3 && faction.rank === 1, faction);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
