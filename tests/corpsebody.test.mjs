// Corpses searched over the whole body (Session 417; Michael, 1 Oct: "the entire mesh should be searchable/interactable,
// not just one small piece. This goes for all creatures, humanoid or otherwise."). A corpse used to count only when the
// crosshair was within ~16° of one point 0.45 over the kill spot. Now the crosshair ray is tested against the dead
// body's bones (and any plain meshes it has), so aiming at the head, a foot or the tail of the body opens it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const KINDS = ['Bandit', 'Wolf', 'Cave Bear', 'Cave Troll', 'Golem'];
const r = await page.evaluate((KINDS) => {
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw); window._C = {};
  KINDS.forEach((n, i) => { const x = px + fx * 30 + (i - 2) * 9, z = pz + fz * 30;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, n, null); e.mesh.position.y = WORLD.worldH(x, z); e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.hp = 0; killZoneEnemy(e, WORLD.scene, ''); const c = ZONE_CORPSES[ZONE_CORPSES.length - 1];
    if (!c.items.length) c.items.push({ name: 'Gold Coins', ico: '●', type: 'gold', value: 5, qty: 1 }); _C[n] = { e, c }; });
  return Object.keys(_C).map(n => ({ n, body: _C[n].c.body === _C[n].e.mesh })); }, KINDS);
check('every kill leaves a corpse carrying its body', r.length === KINDS.length && r.every(x => x.body), r);
for (let i = 0; i < 40; i++) await page.evaluate(() => { for (let k = 0; k < 6; k++) { tickPeople(1 / 60, performance.now()); if (typeof tickCreatures === 'function') tickCreatures(1 / 60, performance.now()); } });

// Stand 2.2 units off the body's middle, eye at 1.6, and aim at a point. `old` is the same test with the body taken away.
const probe = await page.evaluate(() => {
  const out = {}; const V = THREE.Vector3;
  const aim = (from, at) => { px = from.x; pz = from.z; CAM.position.copy(from); CAM.lookAt(at); CAM.updateMatrixWorld(true); };
  for (const [n, { e, c }] of Object.entries(_C)) {
    e.mesh.updateMatrixWorld(true); const bones = []; e.mesh.traverse(o => { if (o.isBone) bones.push(o); });
    const parts = []; if (!bones.length) e.mesh.traverse(o => { if (o.isMesh && o.visible && o.geometry.type !== 'PlaneGeometry') { o.geometry.computeBoundingBox(); parts.push(o.geometry.boundingBox.getCenter(new V()).applyMatrix4(o.matrixWorld)); } });
    const pts = bones.length ? bones.map(b => b.getWorldPosition(new V())) : parts;
    const mid = pts.reduce((a, p) => a.add(p), new V()).multiplyScalar(1 / pts.length);
    const gy = WORLD.worldH(mid.x, mid.z); const rows = [];
    for (const side of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const from = new V(mid.x + Math.sin(side) * 2.2, gy + 1.6, mid.z + Math.cos(side) * 2.2);
      let nNew = 0, nOld = 0, nAll = 0;
      for (const p of pts) { if (p.distanceTo(from) > 3.4) continue; nAll++; aim(from, p);
        if (lookingAt(c)) nNew++; const b = c.body; c.body = null; if (lookingAt(c)) nOld++; c.body = b; }
      // and a miss: aim 1.4 units past the body's far side, along the ground
      const away = mid.clone().sub(from).setY(0).normalize(); const miss = mid.clone().addScaledVector(away, Math.max(1.4, c._ext * .5 + 1)); miss.y = gy + .05;
      aim(from, miss); const offBody = !lookingAt(c);
      // and straight up over it
      aim(from, new V(mid.x, gy + 4, mid.z)); const sky = !lookingAt(c);
      rows.push({ side: +side.toFixed(2), nAll, nNew, nOld, offBody, sky }); }
    // out of reach: 6 units off, aimed at the middle
    const far = new V(mid.x + 6, gy + 1.6, mid.z); aim(far, mid); const outOfReach = !lookingAt(c);
    out[n] = { bones: bones.length, ext: +(c._ext || 0).toFixed(2), r: +(c._r || 0).toFixed(2), rows, outOfReach }; }
  return out; });
for (const [n, p] of Object.entries(probe)) console.log(n, JSON.stringify(p));
for (const [n, p] of Object.entries(probe)) {
  const all = p.rows.reduce((a, x) => a + x.nAll, 0), nw = p.rows.reduce((a, x) => a + x.nNew, 0), od = p.rows.reduce((a, x) => a + x.nOld, 0);
  check(`${n}: aimed at any part of the body from four sides, it is searchable (${nw}/${all}; the old spot ${od}/${all})`, all > 0 && nw === all, p.rows);
  check(`${n}: aimed past the body or into the sky, it is not`, p.rows.every(x => x.offBody && x.sky), p.rows);
  check(`${n}: six units off it is out of reach`, p.outOfReach, p); }
const totals = Object.values(probe).reduce((a, p) => { p.rows.forEach(x => { a.all += x.nAll; a.old += x.nOld; }); return a; }, { all: 0, old: 0 });
check('the old single spot missed some of the body even from 2.2 units', totals.old < totals.all, totals);

// the prompt and E: aimed at a bandit's boots, E opens the loot panel
const ui = await page.evaluate(() => { const { e, c } = _C.Bandit; const bones = []; e.mesh.traverse(o => { if (o.isBone) bones.push(o); });
  const foot = bones.map(b => b.getWorldPosition(new THREE.Vector3())).sort((a, b) => a.y - b.y)[0];
  const far = bones.map(b => b.getWorldPosition(new THREE.Vector3())).sort((a, b) => b.distanceTo(foot) - a.distanceTo(foot))[0];
  const away = foot.clone().sub(far).setY(0).normalize(); const from = foot.clone().addScaledVector(away, 1.6); from.y = WORLD.worldH(from.x, from.z) + 1.6;
  window._aimFoot = () => { px = from.x; pz = from.z; CAM.position.copy(from); CAM.lookAt(foot); CAM.updateMatrixWorld(true); };
  _aimFoot(); return { target: lootTargetNow() === c, oldSpot: (() => { const b = c.body; c.body = null; const v = lookingAt(c); c.body = b; return v; })() }; });
console.log(JSON.stringify(ui));
check('aimed at a dead bandit’s foot, the crosshair takes it as the loot target (the old spot did not)', ui.target && !ui.oldSpot, ui);
// in a dungeon (killE's corpses): a foe with a skeleton, killed where it stands, searched at its foot
// a fixed gate (seed 42), found whether or not its cell has streamed in: `PORTALS` holds only the loaded cells' doors,
// and on a slow runner it was still empty here (CI, b989003)
await page.evaluate(() => { const p = makePortalDef(WORLD.doorAnywhere(42)); const wp = WORLD.dungeonPos[42]; if (wp) { p.x = wp.x; p.z = wp.z; } p.zone = 'world'; px = p.x; pz = p.z + 3; goToDungeon(p); });
for (let k = 0; k < 60 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && ENEMIES.length > 0)); k++) await page.waitForTimeout(500);
const dun = await page.evaluate(() => { const bonesOf = e => { const b = []; e.mesh.traverse(o => { if (o.isBone) b.push(o); }); return b; };
  const e = ENEMIES.find(e => !e.dead && (e.floor == null || e.floor === currentFloor) && bonesOf(e).length); if (!e) return { none: true, n: ENEMIES.length };
  e.hp = 0; killE(e); const c = CORPSES[CORPSES.length - 1]; if (!c.items.length) c.items.push({ name: 'Gold Coins', ico: '●', type: 'gold', value: 5, qty: 1 });
  e.mesh.updateMatrixWorld(true); const P = bonesOf(e).map(b => b.getWorldPosition(new THREE.Vector3())); const foot = P.slice().sort((a, b) => a.y - b.y)[0];
  const far = P.slice().sort((a, b) => b.distanceTo(foot) - a.distanceTo(foot))[0]; const away = foot.clone().sub(far).setY(0).normalize();
  const from = foot.clone().addScaledVector(away, 1.6); from.y = (c.floorY || 0) + 1.6; px = from.x; pz = from.z; CAM.position.copy(from); CAM.lookAt(foot); CAM.updateMatrixWorld(true);
  const target = lootTargetNow() === c; const b = c.body; c.body = null; const oldSpot = lookingAt(c); c.body = b;
  CAM.lookAt(foot.x, foot.y + 4, foot.z); CAM.updateMatrixWorld(true); const sky = lootTargetNow() !== c;
  return { name: e.name, body: c.body === e.mesh, target, oldSpot, sky }; });
console.log(JSON.stringify(dun));
check('in a dungeon a dead foe\u2019s corpse carries its body, and aimed at its foot it is the loot target; aimed above, not', !dun.none && dun.body && dun.target && dun.sky, dun);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
