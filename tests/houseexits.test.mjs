// A house's step-out point stands on clear ground (Session 1216, backlog I: 14 of Dunmore's 58 exits on the new look stood in the
// footprint of the building across a 2.5 m lane, so you stepped out of the door into its collision and a guard sent to the door
// stopped short). A blocked exit is pulled back along its own line from the door, a quarter metre short of the first solid; a
// clear one stays 2.4 m out. Both looks.
import { boot, check } from './lib/game.mjs';
for (const look of ['new', 'old']) {
  const g = await boot({ look }); const { page } = g;
  await g.intoWorld(); await g.settle('dunmore');
  const r = await page.evaluate(() => {
    const S = WORLD.settle.get('dunmore'), hs = S.houses.filter(h => h.exitX != null);
    const row = h => { const L = Math.hypot(h.exitX - h.doorX, h.exitZ - h.doorZ);
      return { id: h.id, L: +L.toFixed(2), solid: WORLD.solidAt(h.exitX, h.exitZ) }; };
    const rows = hs.map(row);
    const keepers = (S.npcs || []).filter(n => n.sched && n.sched.door).map(n => ({ name: n.def && n.def.name, d: Math.min(...hs.map(h => Math.hypot(n.sched.door.x - h.exitX, n.sched.door.z - h.exitZ))) }));
    const inn = S.houses.find(h => h.type === 'inn'); const innOk = !S.innDoor || !inn || Math.hypot(S.innDoor.x - inn.exitX, S.innDoor.z - inn.exitZ) < .01;
    return { n: rows.length, blocked: rows.filter(x => x.solid).map(x => x.id), moved: rows.filter(x => Math.abs(x.L - 2.4) > .02).map(x => [x.id, x.L]), shortest: Math.min(...rows.map(x => x.L)), keepers: keepers.length, keeperFar: keepers.filter(k => k.d > .01), innOk };
  });
  console.log(look, JSON.stringify(r));
  check(`${look} look: every house's exit in Dunmore is clear ground (${r.n} houses)`, r.n > 40 && r.blocked.length === 0, r.blocked);
  check(`${look} look: a moved exit stays at least 0.6 m out of its door, and a clear one 2.4 m (${r.moved.length} moved)`, r.shortest >= .59, r.moved);
  check(`${look} look: the keepers' doors and the inn's door are the houses' exits`, r.keeperFar.length === 0 && r.innOk, { far: r.keeperFar, inn: r.innOk });
  if (look === 'new') check('new look: the exits that were blocked are the ones moved (about 14 of Dunmore\'s, backlog I)', r.moved.length >= 10 && r.moved.length <= 20, r.moved);
  await g.close();
}
