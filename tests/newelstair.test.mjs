// The dungeon's stone newel stair (Session 598; Michael's A on DECISION #173, with two fixes): the stair is two merged meshes
// (the stair and its shaft) in place of 117 boxes, and no beam of floor 2's ceiling runs through the shaft ("the wooden crossbeams
// on the ceiling of the basement overlap with part of the staircase"). Pictures from the prototype's two places.
import { boot, check } from './lib/game.mjs';
const OUT = process.env.SHOT_DIR || 'docs/prototypes';
const g = await boot(); const { page } = g;
await g.intoWorld();
const rows = [];
for (const [theme, seed] of [['ruins', 4021], ['deep', 4012], ['crypt', 4020], ['ruins', 4002], ['haunted', 4030]]) {
  await page.evaluate(([theme, seed]) => { window._oldStair = typeof dScene !== 'undefined' && dScene.children.find(o => o.userData && o.userData.dunShell === 'stair'); const p = Object.assign({}, PORTALS[0], { id: 'dyn_' + seed, theme, seed, size: 'large', interior: 'cave', zone: 'world', tutorial: false }); goToDungeon(p); }, [theme, seed]);
  for (let k = 0; k < 20 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && !dScene.children.includes(window._oldStair))); k++) await page.waitForTimeout(300);
  rows.push(await page.evaluate(([theme, seed]) => { const f = FOOTHOLDS.find(f => f.kind === 'spiral'); if (!f) return { seed, none: true };
    const near = []; let tris = 0, beamIn = 0, beamsF2 = 0;
    dScene.children.forEach(o => { if (!o.isMesh) return; const b = new THREE.Box3().setFromObject(o);
      if (o.userData.dunShell === 'stair' || o.userData.dunShell === 'stairShaft') { near.push(o.userData.dunShell); tris += o.geometry.index.count / 3; return; }
      if (o.geometry.type !== 'PlaneGeometry' && b.max.x - b.min.x < 3 && b.max.z - b.min.z < 3 && Math.hypot((b.min.x + b.max.x) / 2 - f.cx, (b.min.z + b.max.z) / 2 - f.cz) < 1.2) near.push(o.geometry.type);
      if (o.userData.dunShell === 'beams') { const p = o.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (y > FLOOR2_Y + .5 && y < 0) { beamsF2++; if (Math.abs(x - f.cx) < .98 && Math.abs(z - f.cz) < .98) beamIn++; } } } });
    // the beams that would cross the shaft without the cut, from the generator itself (these seeds were picked for them)
    const gen = makeDungeon('large', seed); let would = 0; const x0 = gen.stairC - .5, x1 = gen.stairC + 1.5, z0 = gen.stairR - .5, z1 = gen.stairR + 1.5;
    for (const rm of gen.rooms2 || []) { if (Math.min(rm.w, rm.h) < 3) continue; const alongX = rm.w <= rm.h, nn = alongX ? rm.h : rm.w;
      for (let k = 1; k < nn - .5; k += 2) { if (alongX) { const z = rm.y + k; if (z + .09 > z0 && z - .09 < z1 && rm.x + rm.w - .25 > x0 && rm.x - .75 < x1) would++; } else { const x = rm.x + k; if (x + .09 > x0 && x - .09 < x1 && rm.y + rm.h - .25 > z0 && rm.y - .75 < z1) would++; } } }
    return { theme, seed, same: gen.stairC + .5 === f.cx && gen.stairR + .5 === f.cz, near, tris: Math.round(tris), would, beamsF2, beamIn }; }, [theme, seed]));
  console.log(JSON.stringify(rows[rows.length - 1]));
}
const S = rows.filter(r => !r.none);
check('all five dungeons have a stair, where the generator puts it', S.length === 5 && S.every(r => r.same), rows.map(r => [r.seed, r.same]));
check('each stair is two meshes and nothing else stands in its shaft', S.every(r => r.near.length === 2 && r.near.includes('stair') && r.near.includes('stairShaft')), S.map(r => r.near));
check('the stair is 9–13k triangles', S.every(r => r.tris > 9000 && r.tris < 13000), S.map(r => r.tris));
check('each has a floor-2 beam that would cross the shaft uncut, and no beam vertex lies inside it', S.every(r => r.would > 0 && r.beamsF2 > 0 && r.beamIn === 0), S.map(r => [r.would, r.beamsF2, r.beamIn]));
// the pictures: the prototype's two places on seed 4021
await page.evaluate(() => { window._oldStair = dScene.children.find(o => o.userData && o.userData.dunShell === 'stair'); const p = Object.assign({}, PORTALS[0], { id: 'dyn_4021', theme: 'ruins', seed: 4021, size: 'large', interior: 'cave', zone: 'world', tutorial: false }); goToDungeon(p); });
for (let k = 0; k < 20 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene)); k++) await page.waitForTimeout(300);
await page.waitForTimeout(1500); await g.spin(30);
await page.evaluate(() => { ENEMIES.forEach(e => { e.dead = true; if (e.mesh) e.mesh.visible = false; }); PHP = 1e6; if (typeof vmSword !== 'undefined' && vmSword) vmSword.visible = false; if (typeof vmArmR !== 'undefined' && vmArmR) vmArmR.visible = false; });
for (const view of ['above', 'up']) {
  await page.evaluate((view) => { ENEMIES.forEach(e => { if (e.mesh) e.mesh.visible = false; }); const f = FOOTHOLDS.find(f => f.kind === 'spiral'), a = f.a0, c = Math.cos(a), s = Math.sin(a);
    if (view === 'above') { px = f.cx + c * 3.2; pz = f.cz + s * 3.2; yaw = Math.atan2(c, s); pitch = -.5; }
    if (view === 'up') { px = f.cx + c * 2.6 + s * .6; pz = f.cz + s * 2.6 - c * .6; yaw = Math.atan2(c * 2.6 + s * .6, s * 2.6 - c * .6); pitch = .32; jumpY = FLOOR2_Y; } }, view);
  await g.spin(view === 'up' ? 1 : 20); await page.evaluate((view) => { if (view === 'up') jumpY = FLOOR2_Y; }, view); await g.frames(3);
  await page.screenshot({ path: `${OUT}/dungeon-stair-built-${view}.png` });
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
