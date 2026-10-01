// A strongbox by day (Session 365, G's owed check from Session 167: "whether one-room shops, where the strongbox sits in
// the keeper's sight all day, are fair"). Session 167 measured the box against a keeper standing at the counter. But a
// keeper does not stand still: `intAmbleStep` walks them about the shop floor at .25 units a second. This asks how much
// of an open day a player at the strongbox is actually in sight. Every shop with a strongbox in four towns is entered at
// 13h, and the keeper's own amble is run for ten minutes of fixed 1/60 steps; every tenth of a second a player standing
// at the box asks `witnessOf`. From that record, the chance that a pick of 3, 6 or 10 seconds begun at a random moment is
// seen at some moment of it (a town pick is asked every frame since Session 327, and the taking once more at the end).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const PICKS = [0, 3, 6, 10];
const TOWNS = ['dunmore', 'portclare', 'ironhaven', 'ashenmoor'];
const rows = [];
for (const town of TOWNS) {
  await g.settle(town);
  const shops = await page.evaluate((town) => { forceTime(13); const S = WORLD.settle.get(town); if (!S) return [];
    return S.houses.filter(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper).map(x => x.id); }, town);
  for (const id of shops) {
    await page.evaluate(([town, id]) => { const h = WORLD.settle.get(town).houses.find(x => x.id === id); window._h = h; forceTime(13); px = h.exitX; pz = h.exitZ; goToInterior(h); }, [town, id]);
    await page.waitForTimeout(4000); await g.hide();
    rows.push(await page.evaluate(([town, PICKS]) => { const h = window._h; const X = WORLD.intBox; const K = intNPCMesh;
      if (!X || !K || !K.userData.amble) { exitInterior(); return { town, name: h.name, none: true, box: !!X, keeper: !!K }; }
      const am = K.userData.amble; jumpY = 0;
      const back = !!h._backRoom, doors = WORLD.intDoors.length;
      const k0 = { x: K.position.x, z: K.position.z };
      // where a thief stands: in front of the box, as Session 167's test and the critic stood
      const sx = X.x, sz = X.z + .8;
      const rec = []; let minD = 1e9, maxD = 0, farthest = 0;
      for (let f = 0; f < 60 * 600; f++) { intAmbleStep(K, 1 / 60); if (f % 6) continue;
        px = sx; pz = sz; const d = Math.hypot(px - K.position.x, pz - K.position.z); minD = Math.min(minD, d); maxD = Math.max(maxD, d);
        farthest = Math.max(farthest, Math.hypot(K.position.x - k0.x, K.position.z - k0.z));
        rec.push(!!WORLD.witnessOf(h)); }
      const seenFrac = rec.filter(Boolean).length / rec.length;
      let run = 0, longest = 0; for (const s of rec) { run = s ? 0 : run + 1; longest = Math.max(longest, run); }
      const chance = (P) => { const w = Math.round(P * 10); let seen = 0, n = 0; for (let s = 0; s + w < rec.length; s++) { n++; for (let t = s; t <= s + w; t++) if (rec[t]) { seen++; break; } } return +(seen / n).toFixed(3); };
      const bounds = { minX: am.minX, maxX: am.maxX, minZ: am.minZ, maxZ: am.maxZ };
      const inBounds = K.position.x >= am.minX - 1e-6 && K.position.x <= am.maxX + 1e-6 && K.position.z >= am.minZ - 1e-6 && K.position.z <= am.maxZ + 1e-6;
      const pins = null; exitInterior();
      return { town, name: h.name, type: h.type, back, doors, box: { x: +X.x.toFixed(2), z: +X.z.toFixed(2) }, keeper0: { x: +k0.x.toFixed(2), z: +k0.z.toFixed(2) }, bounds,
        dBox0: +Math.hypot(sx - k0.x, sz - k0.z).toFixed(2), minD: +minD.toFixed(2), maxD: +maxD.toFixed(2), farthest: +farthest.toFixed(2), inBounds,
        seen: +seenFrac.toFixed(3), longest: +(longest / 10).toFixed(1), picks: PICKS.map(chance) }; }, [town, PICKS]));
    await page.waitForTimeout(2500); await g.hide();
  }
}
const ok = rows.filter(r => !r.none);
console.log(`\n${ok.length} shops with a strongbox and a keeper at 13h (${rows.length - ok.length} without)`);
console.log('  town       room      box←keeper at start / nearest / farthest   in sight   longest unseen   seen on a pick of ' + PICKS.join('/') + ' s');
for (const r of ok) console.log(`  ${r.town.padEnd(10)} ${(r.back ? 'back room' : 'one room').padEnd(9)} ${String(r.dBox0).padStart(5)} / ${String(r.minD).padStart(5)} / ${String(r.maxD).padStart(5)}        ${(r.seen * 100).toFixed(0).padStart(3)}%       ${String(r.longest).padStart(6)} s        ${r.picks.join(' ')}   ${r.name}`);
for (const r of rows.filter(r => r.none)) console.log(`  (no measure) ${r.town} ${r.name}: box ${r.box}, keeper ${r.keeper}`);
const one = ok.filter(r => !r.back), two = ok.filter(r => r.back);
const mean = (L, j) => L.length ? +(L.reduce((a, r) => a + r.picks[j], 0) / L.length).toFixed(3) : null;
console.log(`  mean chance seen, one-room shops (${one.length}): ${PICKS.map((_, j) => mean(one, j)).join(' ')}`);
console.log(`  mean chance seen, back-room shops (${two.length}): ${PICKS.map((_, j) => mean(two, j)).join(' ')}`);
console.log(JSON.stringify(rows));
check('the shops of four towns were entered with a keeper and a strongbox (at least 12)', ok.length >= 12, rows.map(r => [r.town, r.name, !r.none]));
check('both kinds of shop are in the sample', one.length >= 2 && two.length >= 2, [one.length, two.length]);
check('the keeper stays inside their own bounds all ten minutes', ok.every(r => r.inBounds), ok.filter(r => !r.inBounds));
check('the keeper walks: every one moved at least a unit from the counter in ten minutes', ok.every(r => r.farthest >= 1), ok.map(r => [r.name, r.farthest]));
check('a longer pick is never less likely to be seen', ok.every(r => r.picks.every((v, j) => j === 0 || v >= r.picks[j - 1])), ok.map(r => r.picks));
check('a back-room strongbox is never seen while its door is shut', two.filter(r => r.doors > 0).every(r => r.seen === 0), two.map(r => [r.name, r.seen]));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
