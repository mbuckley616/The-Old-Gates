// A back-room strongbox with its door shut and then open (Session 666, G's owed check from Session 167: "steal from a
// back room with the door shut and then open"). Session 365 found back-room boxes never seen with the door shut; nobody
// had asked what opening the door changes. Every shop with a back room and a strongbox in four towns is entered at 13h
// and measured twice over the keeper's own ten-minute amble (fixed 1/60 steps), once with the back room's door shut and
// once with it open (through `intDoorInteract`, as E opens it). Every tenth of a second a thief standing at the box asks
// `witnessOf`, and the test also records the three things a keeper needs to see you indoors (within 6, facing you
// within 60°, a clear line through the rooms) to say which of them keeps the box out of sight.
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
      if (!h._backRoom) { exitInterior(); return { town, name: h.name, skip: true }; }
      if (!X || !K || !K.userData.amble || !INT_DOORS.length) { exitInterior(); return { town, name: h.name, none: true, box: !!X, keeper: !!K, doors: INT_DOORS.length }; }
      jumpY = 0;
      // the back room's door: the one nearest the box (the partition's only door)
      const door = INT_DOORS.slice().sort((a, b) => Math.hypot(a.x - X.x, a.z - X.z) - Math.hypot(b.x - X.x, b.z - X.z))[0];
      const sx = X.x, sz = X.z + .8;
      const k0 = { x: K.position.x, z: K.position.z, ry: K.rotation.y };
      const run = (open) => {
        if (door.open !== open) { px = door.x; pz = door.z + (open ? -.6 : -.6); intDoorInteract(door); }
        K.position.x = k0.x; K.position.z = k0.z; K.rotation.y = k0.ry;
        const rec = []; let inR = 0, faces = 0, line = 0, all3 = 0, lineInR = 0, minD = 1e9;
        for (let f = 0; f < 60 * 600; f++) { intAmbleStep(K, 1 / 60); if (f % 6) continue;
          px = sx; pz = sz; const kx = K.position.x, kz = K.position.z, d = Math.hypot(px - kx, pz - kz); minD = Math.min(minD, d);
          const a = d < 6, b = (Math.sin(K.rotation.y) * (px - kx) + Math.cos(K.rotation.y) * (pz - kz)) / Math.max(d, 1e-3) >= Math.cos(Math.PI / 3), c = WORLD.intSightLine(kx, kz, px, pz);
          inR += a; faces += b; line += c; lineInR += a && c; all3 += a && b && c;
          rec.push(!!WORLD.witnessOf(h)); }
        const n = rec.length, seen = rec.filter(Boolean).length / n;
        const chance = (P) => { const w = Math.round(P * 10); let s2 = 0, m = 0; for (let s = 0; s + w < n; s++) { m++; for (let t = s; t <= s + w; t++) if (rec[t]) { s2++; break; } } return +(s2 / m).toFixed(3); };
        return { open: door.open, solOut: door.sol.x0 < -1e5, seen: +seen.toFixed(3), picks: PICKS.map(chance), inR: +(inR / n).toFixed(3), faces: +(faces / n).toFixed(3), line: +(line / n).toFixed(3), lineInR: +(lineInR / n).toFixed(3), all3: +(all3 / n).toFixed(3), minD: +minD.toFixed(2) };
      };
      const shut = run(false), open = run(true);
      // with the door open: every spot of the shop floor (a 0.25 grid in front of the partition) asked for a clear line to the
      // thief at the box, and a control, a keeper 2.5 in front of the doorway facing it and a thief 0.8 inside it
      const W = X.x + .9; let pts = 0, clear = 0, clear6 = 0;
      for (let x = .3; x <= W - .3; x += .25) for (let z = .3; z <= door.z - .4; z += .25) { pts++;
        if (WORLD.intSightLine(x, z, sx, sz)) { clear++; if (Math.hypot(x - sx, z - sz) < 6) clear6++; } }
      const ctl = () => { K.position.x = door.x; K.position.z = door.z - 2.5; K.rotation.y = 0; px = door.x; pz = door.z + .8;
        return { line: WORLD.intSightLine(K.position.x, K.position.z, px, pz), seen: !!WORLD.witnessOf(h) }; };
      const ctlOpen = ctl();
      px = door.x; pz = door.z - .6; intDoorInteract(door);
      const ctlShut = Object.assign(ctl(), { open: door.open });
      exitInterior();
      return { town, name: h.name, type: h.type, box: { x: +X.x.toFixed(2), z: +X.z.toFixed(2) }, door: { x: +door.x.toFixed(2), z: +door.z.toFixed(2) },
        keeper0: { x: +k0.x.toFixed(2), z: +k0.z.toFixed(2) }, shut, open, floor: { pts, clear, clear6 }, ctlOpen, ctlShut }; }, [town, PICKS]));
    await page.waitForTimeout(2500); await g.hide();
  }
}
const ok = rows.filter(r => !r.none && !r.skip);
console.log(`\n${ok.length} back-room shops with a strongbox and a keeper at 13h (${rows.filter(r => r.none).length} without; ${rows.filter(r => r.skip).length} one-room shops skipped)`);
console.log('  town       box (x,z)      door (x,z)     nearest  | shut: seen   | open: seen  picks ' + PICKS.join('/') + ' s   in 6 / facing / clear line / line in 6 / all three');
for (const r of ok) console.log(`  ${r.town.padEnd(10)} ${(r.box.x + ',' + r.box.z).padEnd(14)} ${(r.door.x + ',' + r.door.z).padEnd(14)} ${String(r.open.minD).padStart(6)}  | ${(r.shut.seen * 100).toFixed(0).padStart(4)}%       | ${(r.open.seen * 100).toFixed(0).padStart(4)}%  ${r.open.picks.join(' ')}   ${r.open.inR} / ${r.open.faces} / ${r.open.line} / ${r.open.lineInR} / ${r.open.all3}   ${r.name}`);
for (const r of rows.filter(r => r.none)) console.log(`  (no measure) ${r.town} ${r.name}: box ${r.box}, keeper ${r.keeper}, doors ${r.doors}`);
const mean = (k, j) => ok.length ? +(ok.reduce((a, r) => a + r[k].picks[j], 0) / ok.length).toFixed(3) : null;
console.log(`  mean chance seen, door shut: ${PICKS.map((_, j) => mean('shut', j)).join(' ')}`);
console.log(`  mean chance seen, door open: ${PICKS.map((_, j) => mean('open', j)).join(' ')}`);
console.log(JSON.stringify(ok));
check('back-room shops of four towns were entered with a keeper, a strongbox and a door (at least 4)', ok.length >= 4, rows.map(r => [r.town, r.name, !r.none && !r.skip]));
check('the strongbox stands behind the partition, past its door', ok.every(r => r.box.z > r.door.z), ok.map(r => [r.box, r.door]));
check('the door is shut for the first measure and its leaf blocks', ok.every(r => !r.shut.open && !r.shut.solOut), ok.map(r => r.shut));
check('E opened the door for the second, and its leaf left the collision set', ok.every(r => r.open.open && r.open.solOut), ok.map(r => r.open));
check('a back-room strongbox is never seen while its door is shut', ok.every(r => r.shut.seen === 0), ok.map(r => [r.name, r.shut.seen]));
check('opening the door never hides you better than shutting it', ok.every(r => r.open.seen >= r.shut.seen), ok.map(r => [r.name, r.shut.seen, r.open.seen]));
check('the open measure is the witness rule: seen only when within 6, facing and a clear line all hold', ok.every(r => r.open.seen <= r.open.all3 + 1e-9), ok.map(r => [r.name, r.open.seen, r.open.all3]));
for (const r of ok) console.log(`  ${r.name}: shop floor spots with a clear line to the box, door open ${r.floor.clear} of ${r.floor.pts} (${r.floor.clear6} within 6); control at the doorway open ${JSON.stringify(r.ctlOpen)} shut ${JSON.stringify(r.ctlShut)}`);
check('the measure can see: a keeper facing the open doorway sees a thief just inside it, and not once it is shut', ok.every(r => r.ctlOpen.line && r.ctlOpen.seen && !r.ctlShut.open && !r.ctlShut.line && !r.ctlShut.seen), ok.map(r => [r.name, r.ctlOpen, r.ctlShut]));
check('with the door open, no spot of the shop floor within 6 of a thief at the box has a clear line to it (a few far corners do, at most 1 in 200)', ok.every(r => r.floor.pts > 50 && r.floor.clear6 === 0 && r.floor.clear / r.floor.pts < .005), ok.map(r => [r.name, r.floor]));
check('a longer pick is never less likely to be seen', ok.every(r => r.open.picks.every((v, j) => j === 0 || v >= r.open.picks[j - 1])), ok.map(r => r.open.picks));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
