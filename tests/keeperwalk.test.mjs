// A keeper doesn't walk through the counter (Session 387; the critic's s342 finding, 1 Oct). The keeper's amble
// (`intAmbleStep`) turned back only off its bounds, z from 0.6 to min(D×.55, 4.5), and the counter's solid (z 2.6–3.4,
// the room's middle half) lies across them: every keeper of Portclare and Dunmore stood inside a room solid 14–40% of an
// open day. The step now turns back off the room's solids too (the ones a person can't step onto or walk under), and the counter
// shops' keeper starts at z 2.2 behind the counter, not on its edge at 2.6. A keeper ever set down inside a solid
// steps to the nearest free spot within their bounds on the first step.
// Every house with a walking keeper in both towns is entered at 13h and its keeper walked for ten minutes of 1/60 steps.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const rows = [];
for (const town of ['portclare', 'dunmore']) {
  await g.settle(town);
  const ids = await page.evaluate((town) => { forceTime(13); const S = WORLD.settle.get(town); return S ? S.houses.filter(x => x.keeper).map(x => x.id) : []; }, town);
  for (const id of ids) {
    await page.evaluate(([town, id]) => { const h = WORLD.settle.get(town).houses.find(x => x.id === id); window._h = h; forceTime(13); px = h.exitX; pz = h.exitZ; goToInterior(h); }, [town, id]);
    await page.waitForTimeout(4000); await g.hide();
    rows.push(await page.evaluate((town) => {
      const h = window._h; const K = intNPCMesh; const am = K && K.userData.amble;
      if (!K || !am || am.paused) { exitInterior(); return { town, name: h.name, type: h.type, none: true }; }
      jumpY = 0;
      // the game's own test at the floor: a solid a person can't step onto and doesn't pass under (a door's lintel is 1.6 up)
      const inside = (x, z) => intSolidAt(x, z, 0, 0);
      // the counter: the solid a counter shop sets down at z 3.0, .4 deep
      const ctr = INT_SOL.find(s => Math.abs((s.z0 + s.z1) / 2 - 3.0) < 1e-6 && Math.abs(s.z1 - s.z0 - .8) < 1e-6);
      const k0 = { x: K.position.x, z: K.position.z }; const start = inside(k0.x, k0.z);
      intAmbleStep(K, 1 / 60); const first = inside(K.position.x, K.position.z);
      let n = 0, inS = 0, inC = 0, front = 0, far = 0;
      for (let f = 0; f < 60 * 600; f++) { intAmbleStep(K, 1 / 60); if (f % 6) continue; n++;
        const x = K.position.x, z = K.position.z; if (inside(x, z)) inS++;
        if (ctr && x > ctr.x0 && x < ctr.x1 && z > ctr.z0 && z < ctr.z1) inC++;
        if (ctr && z > ctr.z1) front++;
        far = Math.max(far, Math.hypot(x - k0.x, z - k0.z)); }
      exitInterior();
      return { town, name: h.name, type: h.type, counter: !!ctr, start, first, k0: { x: +k0.x.toFixed(2), z: +k0.z.toFixed(2) }, inSolid: +(inS / n).toFixed(3), inCounter: +(inC / n).toFixed(3), front: +(front / n).toFixed(3), far: +far.toFixed(2) };
    }, town));
    await page.waitForTimeout(2000); await g.hide();
  }
}
const ok = rows.filter(r => !r.none);
console.log(`\n${ok.length} walking keepers (${rows.length - ok.length} standing or none)`);
for (const r of ok) console.log(`  ${r.town.padEnd(10)} ${String(r.type).padEnd(10)} in a solid ${(r.inSolid * 100).toFixed(0).padStart(3)}%  in the counter ${(r.inCounter * 100).toFixed(0).padStart(3)}%  before it ${(r.front * 100).toFixed(0).padStart(3)}%  farthest ${r.far}  ${r.name}`);
console.log(JSON.stringify(rows));
const shops = ok.filter(r => r.counter);
check('the keepers of both towns were walked, counter shops among them (at least 10)', ok.length >= 10 && shops.length >= 6, ok.map(r => [r.name, r.counter]));
console.log('set down inside a solid:', ok.filter(r => r.start).map(r => `${r.name} (${r.k0.x}, ${r.k0.z})`).join('; ') || 'none');
check('a keeper set down inside a solid is out of it after one step', ok.every(r => !r.first), ok.filter(r => r.first));
check('no keeper stands inside the counter at any moment of ten minutes', shops.every(r => r.inCounter === 0), shops.map(r => [r.name, r.inCounter]));
check('no keeper stands inside any solid they can\'t step onto', ok.every(r => r.inSolid === 0), ok.filter(r => r.inSolid > 0).map(r => [r.name, r.inSolid]));
check('every keeper still walks: at least a unit from where they began', ok.every(r => r.far >= 1), ok.map(r => [r.name, r.far]));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
