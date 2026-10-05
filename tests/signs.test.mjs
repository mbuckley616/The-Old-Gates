// Trade signs (Session 246): genSettlement painted the board over a shop's door with the keeper's first-drawn name, then
// makeDef settled the keeper's real name and the house was renamed after them, so the board kept the old one. Portclare:
// every keeper-named sign was wrong (Leofgifu's Stores over Fionnuala's Stores). Now the sign is painted after the rename.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
for (const id of ['portclare', 'dunmore']) {
  await g.settle(id);
  const r = await page.evaluate((id) => { const S = WORLD.settle.get(id);
    const faces = []; S.group.traverse(o => { if (o.userData && o.userData.sign) { const p = new THREE.Vector3(); o.getWorldPosition(p); faces.push({ sign: o.userData.sign, x: p.x, z: p.z }); } });
    const out = S.houses.filter(h => h.type !== 'home' && h.type !== 'castle' && h.type !== 'barber').map(h => { // S512 — the barber's sign is the basins, no board (tests/barber)
      const near = faces.filter(f => Math.hypot(f.x - h.doorX, f.z - h.doorZ) < 2);
      return { name: h.name, keeper: h.keeper, type: h.type, signs: [...new Set(near.map(f => f.sign))] }; });
    return { faces: faces.length, out }; }, id);
  const wrong = r.out.filter(h => h.signs.length !== 1 || h.signs[0] !== h.name);
  const keeperNamed = r.out.filter(h => /'s /.test(h.name));
  console.log(' ', id, 'sign faces', r.faces, 'signed houses', r.out.length, 'keeper-named', keeperNamed.length);
  keeperNamed.forEach(h => console.log('   ', h.name, '— board:', h.signs.join(' / ')));
  check(`${id}: every shop, inn, church and guild hall has one board, reading its own name`, r.out.length > 0 && wrong.length === 0, wrong);
  check(`${id}: every keeper-named board names its keeper`, keeperNamed.every(h => h.signs[0].startsWith(h.keeper + "'s ")), keeperNamed);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
