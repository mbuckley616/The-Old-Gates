// The owed half of Session 417 (backlog C, corpses searched over the whole body): "if the ragdoll (#102) is built, its
// settled body is what is searched, unchanged." The ragdoll is built (Sessions 419, 427). This kills Bandits and a wolf
// with the real kill path, a power blow to throw them far, lets them settle at 1/60, and then aims at every bone of the
// settled body from 2.2 units off on the side away from where it stood (and from the other sides): each must be
// searchable, the air where it stood must not be, and six units off is out of reach.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const KINDS = ['Bandit', 'Bandit', 'Wolf'];
const r = await page.evaluate((KINDS) => { forceTime(11); const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; const V = THREE.Vector3; const out = [];
  const x0 = px, z0 = pz;
  const aim = (from, at) => { px = from.x; pz = from.z; CAM.position.copy(from); CAM.lookAt(at); CAM.updateMatrixWorld(true); };
  KINDS.forEach((n, i) => { px = x0 + i * 14; pz = z0; const x = px + fwdX * 2.5, z = pz + fwdZ * 2.5;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, n, null); e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.mesh.position.set(x, activeTerrainH(x, z), z); e.mesh.updateMatrixWorld(true);
    e.hp = 0; killZoneEnemy(e, WORLD.scene, ' (POWER)'); const c = ZONE_CORPSES[ZONE_CORPSES.length - 1];
    if (!c.items.length) c.items.push({ name: 'Gold Coins', ico: '●', type: 'gold', value: 5, qty: 1 });
    const pl = { x: px, z: pz };
    // aim at it once while it is still standing (as a player watching it fall would), then let it fall
    aim(new V(px, activeTerrainH(px, pz) + 1.6, pz), new V(x, activeTerrainH(x, z) + 1, z)); const upright = lookingAt(c);
    const now = performance.now(); let steps = 0; for (; steps < 300 && [...RAGDOLLS].length; steps++) tickPeople(1 / 60, now + steps * 16.7);
    e.mesh.updateMatrixWorld(true); const bones = []; e.mesh.traverse(o => { if (o.isBone) bones.push(o); });
    const pts = bones.map(b => b.getWorldPosition(new V())); const mid = pts.reduce((a, p) => a.add(p), new V()).multiplyScalar(1 / pts.length);
    const thrown = Math.hypot(mid.x - x, mid.z - z); const reachOut = Math.max(...pts.map(p => Math.hypot(p.x - x, p.z - z)));
    let all = 0, hit = 0, farAll = 0, farHit = 0; const missed = [];
    for (const side of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { const from = new V(mid.x + Math.sin(side) * 2.2, 0, mid.z + Math.cos(side) * 2.2); from.y = activeTerrainH(from.x, from.z) + 1.6;
      for (const p of pts) { if (p.distanceTo(from) > 3.0) continue; all++; aim(from, p); if (lookingAt(c)) hit++; else missed.push(+side.toFixed(2)); } }
    // from beyond the body, away from where it stood: 2.2 units past each bone along the throw
    const ax = mid.x - x, az = mid.z - z, al = Math.hypot(ax, az) || 1;
    for (const p of pts) { const from = new V(p.x + ax / al * 2.2, 0, p.z + az / al * 2.2); from.y = activeTerrainH(from.x, from.z) + 1.6; farAll++; aim(from, p); if (lookingAt(c)) farHit++; }
    // where it stood: the empty ground, aimed from the player's side
    // where it stood, at an upright body's chest (1.2), aimed across the throw: the ray passes over the body lying on the ground
    const stoodFrom = new V(x - az / al * 2.2, 0, z + ax / al * 2.2); stoodFrom.y = activeTerrainH(stoodFrom.x, stoodFrom.z) + 1.6;
    const stoodAt = new V(x, activeTerrainH(x, z) + 1.2, z); aim(stoodFrom, stoodAt); const ghost = lookingAt(c);
    aim(new V(mid.x + 6, activeTerrainH(mid.x + 6, mid.z) + 1.6, mid.z), mid); const far = lookingAt(c);
    aim(new V(mid.x + 2.2, activeTerrainH(mid.x + 2.2, mid.z) + 1.6, mid.z), mid); const prompt = lootTargetNow() === c;
    out.push({ n, upright, steps, thrown: +thrown.toFixed(2), reachOut: +reachOut.toFixed(2), all, hit, farAll, farHit, missed: [...new Set(missed)], ghost, far, prompt });
    ZONE_CORPSES.splice(ZONE_CORPSES.indexOf(c), 1); if (e.mesh.parent) e.mesh.parent.remove(e.mesh); });
  px = x0; pz = z0; window.requestAnimationFrame = raf; return out; }, KINDS);
for (const x of r) console.log(JSON.stringify(x));
r.forEach((x, i) => {
  check(`${x.n} #${i + 1}: thrown ${x.thrown} (a bone ${x.reachOut} from where it stood), settled in ${x.steps} steps; every bone searchable from 2.2 off, four sides (${x.hit}/${x.all})`, x.steps < 300 && x.all > 0 && x.hit === x.all, x);
  check(`${x.n} #${i + 1}: and from 2.2 past it, away from where it stood (${x.farHit}/${x.farAll})`, x.farAll > 0 && x.farHit === x.farAll, x);
  check(`${x.n} #${i + 1}: where it stood, at an upright chest's height, is not searchable; six units off is out of reach; the prompt finds it`, !x.ghost && !x.far && x.prompt, x);
});
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
