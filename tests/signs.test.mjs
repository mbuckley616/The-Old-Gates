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
      const near = faces.filter(f => Math.hypot(f.x - h.doorX, f.z - h.doorZ) < (h.kit && h.kit.kind === 'forge' ? 2.6 : 2)); /* S1855 — a forge's board hangs 1.75 m along its wall, off the open cart door */
      /* S1316 — the new look's guild hall (the kit's, Session 964) hangs no board: its name is cut in a stone panel over the great
         door, baked into the hall. Read from the hall's own plan: the panel's words, and that it stands over the door it is built with */
      if (h.kit && h.kit.kind === 'guildhall' && !near.length && typeof PKIT !== 'undefined' && PKIT.panelsMade() > 0) { const P = PKIT.gl.PLANS.guildhall({ guild: h.kit.guild }), d = P.open.front[0];
        if (P.plaque && Math.abs(P.plaque.x - d.x) < d.w / 2 && P.plaque.y >= d.h) near.push({ sign: P.plaque.text.replace(/’/g, "'").toLowerCase().replace(/(^| )\S/g, c => c.toUpperCase()) }); }
      /* S1990 — the market house (Sessions 1901–1904, Michael's A on #475) hangs no board either: MARKET HOUSE is cut in a panel on its
         front over the middle arch. Its record's door is the room's, up the east end's stair, so the panel is read from the house's own
         plan (the house built again from the town's stream, as kitMarket does), as the guild hall's is: the words, and that it stands over the arch it is built with */
      if (h.kit && h.kit.kind === 'market' && !near.length && typeof PKIT !== 'undefined' && PKIT.panelsMade() > 0) { const M = PKIT.gl.market({ r: PKIT.stream(`${id}:market`) }), P = M.userData.arcade && M.userData.arcade.plan; /* built as kitMarket builds it */
        const a = P && P.plaque && P.open.front.find(q => q.kind === 'arcade' && Math.abs(q.x - P.plaque.x) < q.w / 2);
        if (a && P.plaque.y >= a.h) near.push({ sign: P.plaque.text.replace(/’/g, "'").toLowerCase().replace(/(^| )\S/g, c => c.toUpperCase()) }); }
      return { name: h.name, keeper: h.keeper, type: h.type, kit: h.kit && h.kit.kind, signs: [...new Set(near.map(f => f.sign))] }; });
    return { faces: faces.length, panels: typeof PKIT !== 'undefined' ? PKIT.panelsMade() : 0, out }; }, id);
  const wrong = r.out.filter(h => h.signs.length !== 1 || h.signs[0] !== h.name);
  const keeperNamed = r.out.filter(h => /'s /.test(h.name));
  console.log(' ', id, 'sign faces', r.faces, 'name panels and banners', r.panels, 'signed houses', r.out.length, 'keeper-named', keeperNamed.length);
  keeperNamed.forEach(h => console.log('   ', h.name, '— board:', h.signs.join(' / ')));
  check(`${id}: every shop, inn, church and guild hall has one board, reading its own name`, r.out.length > 0 && wrong.length === 0, wrong);
  check(`${id}: every keeper-named board names its keeper`, keeperNamed.every(h => h.signs[0].startsWith(h.keeper + "'s ")), keeperNamed);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
