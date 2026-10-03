// The beasts' deaths (Session 427, Michael's C on #107): the beasts on the wolf's bones (the wolves, the Snow Wolf, the Dire
// Wolf, the Ash Hound, the boar and the Cave Bear) fall as ragdolls on their own joints, on the people's loop, instead of the
// dead pose and the 90° turn in one frame. The spiders keep their curl where they stand, without the turn. This kills each
// kind in the open world through the real killZoneEnemy, steps tickPeople and tickCreatures at 1/60, and reads where the
// body lies: on the ground, away from you, the bones their own lengths, settled and frozen, most on the flank.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.frames(30);

const r = await page.evaluate(() => {
  forceTime(11); const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  const V = () => new THREE.Vector3(), out = { kinds: {}, wolves: [] };
  let n = 0;
  const kill = (type, tag) => {
    const a = n++ * 1.1, dist = 4 + (n % 3) * 1.5, x = px + Math.sin(a) * dist, z = pz + Math.cos(a) * dist;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, type, null); e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.mesh.position.set(x, activeTerrainH(x, z), z); e.mesh.updateMatrixWorld(true);
    const rig = e.limbs && e.limbs.wolf; if (!rig) return { type, rig: false };
    const B = rig.B, at = b => b.getWorldPosition(V()), len = (p, q) => at(p).distanceTo(at(q));
    const pairs = rig.spider ? [] : [[B.thL, B.knL], [B.elR, B.wrR], [B.hips, B.spine], [B.neck, B.head]], L0 = pairs.map(([p, q]) => len(p, q));
    const n0 = RAGDOLLS.size; e.hp = 0; killZoneEnemy(e, WORLD.scene, tag || '');
    const R = [...RAGDOLLS].find(q => q.rig === rig); let t = 0, settled = -1; const now = performance.now();
    for (let i = 0; i < 300 && settled < 0; i++) { tickPeople(1 / 60, now + i * 16.7); tickCreatures(1 / 60, now + i * 16.7); t += 1 / 60; if (!R || !RAGDOLLS.has(R)) settled = +t.toFixed(2); }
    e.mesh.updateMatrixWorld(true);
    const gy = b => { const p = at(b); return +(p.y - activeTerrainH(p.x, p.z)).toFixed(3); };
    const bones = rig.mesh.skeleton.bones, hips = at(B.hips || B.body), push = [x - px, z - pz], pl = Math.hypot(...push);
    // the back's up: the hips' local y in the world (1 standing, 0 on the flank, -1 on its back)
    const up = rig.spider ? null : +new THREE.Vector3(0, 1, 0).applyQuaternion(B.spine.getWorldQuaternion(new THREE.Quaternion())).y.toFixed(2);
    return { type, rig: true, ragdoll: !!R, added: RAGDOLLS.size - n0 + (R && !RAGDOLLS.has(R) ? 1 : 0), settled, timedOut: !!R && R.t > 4, rotZ: +e.mesh.rotation.z.toFixed(3), lift: +(e.mesh.position.y - activeTerrainH(x, z)).toFixed(3),
      hipsUp: rig.spider ? null : gy(B.hips), headUp: rig.spider ? null : gy(B.head), low: +Math.min(...bones.map(gy)).toFixed(3), up,
      away: +(((hips.x - x) * push[0] + (hips.z - z) * push[1]) / pl).toFixed(3), spread: +Math.max(...bones.map(b => Math.hypot(at(b).x - x, at(b).z - z))).toFixed(2),
      lens: pairs.map(([p, q], i) => +(len(p, q) / L0[i]).toFixed(3)), nan: bones.some(b => !isFinite(at(b).y)), dark: rig.mesh.material.color.r, cull: rig.mesh.frustumCulled,
      scale: +rig.root.getWorldScale(V()).y.toFixed(2) };
  };
  for (const k of ['Wolf', 'Snow Wolf', 'Dire Wolf', 'Ash Hound', 'Boar', 'Cave Bear', 'Spider']) out.kinds[k] = kill(k, k === 'Dire Wolf' ? ' (POWER)' : '');
  for (let i = 0; i < 8; i++) out.wolves.push(kill('Wolf', i % 3 === 1 ? ' (POWER)' : i % 3 === 2 ? ' (ARROW)' : ''));
  // the cost: one wolf's fall stepped by itself
  { const x = px + fwdX * 3 + fwdZ * 5, z = pz + fwdZ * 3 - fwdX * 5, e = buildZoneEnemy(WORLD.scene, [], x, z, 'Wolf', null); e.locked = false; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.mesh.position.set(x, activeTerrainH(x, z), z); e.hp = 0; killZoneEnemy(e, WORLD.scene, ''); const R = [...RAGDOLLS].find(q => q.rig === e.limbs.wolf);
    const c0 = performance.now(); let k = 0; while (R && RAGDOLLS.has(R) && k < 60) { tickRagdolls(1 / 60); k++; } out.msPerStep = k ? +((performance.now() - c0) / k).toFixed(3) : -1; }
  window.requestAnimationFrame = raf; return out;
});
for (const k in r.kinds) console.log(k, JSON.stringify(r.kinds[k]));
console.log('wolves: settled', JSON.stringify(r.wolves.map(w => w.settled)), 'back up', JSON.stringify(r.wolves.map(w => w.up)), 'ms a step', r.msPerStep);
for (const k of ['Wolf', 'Snow Wolf', 'Dire Wolf', 'Ash Hound', 'Boar', 'Cave Bear']) {
  const w = r.kinds[k];
  check(`${k}: falls as a ragdoll, not the old 90° turn or lift`, w.rig && w.ragdoll && w.rotZ === 0 && Math.abs(w.lift) < .01, w);
  check(`${k}: settles by itself before the four-second cap`, w.settled > 0 && w.settled < 4 && !w.timedOut, w.settled);
  check(`${k}: lies on the ground: hips and head within .45×scale of it, no bone under it`, w.hipsUp < .45 * w.scale && w.headUp < .45 * w.scale && w.low > -.06, [w.hipsUp, w.headUp, w.low]);
  check(`${k}: the bones keep their lengths (within 6%), none further than 2.5×scale from where it stood`, w.lens.every(q => Math.abs(q - 1) < .06) && w.spread < 2.5 * w.scale && !w.nan, [w.lens, w.spread]);
  check(`${k}: darkened as before; drawn wherever its limbs land`, w.dark < .5 && w.cull === false, w);
}
const ws = [r.kinds.Wolf, ...r.wolves];
// a wolf that drops where it stood lands a few cm either side of it (CI: -.008 and -.037 in one run): that is not falling towards you
check('the wolves fall away from you (none but one more than 5 cm towards you; on average away)', ws.filter(w => w.away > -.05).length >= ws.length - 1 && ws.reduce((a, w) => a + w.away, 0) / ws.length > .1, ws.map(w => w.away));
check('the wolves are no longer standing: the back tipped past 45° in every death', ws.every(w => w.up < .71), ws.map(w => w.up));
check('most wolves end on the flank rather than the back (back up between -.5 and .71)', ws.filter(w => w.up > -.5).length >= Math.ceil(ws.length * .6), ws.map(w => w.up));
check('every wolf settles, and the deaths differ (the hips land in different places)', ws.every(w => w.settled > 0 && w.settled < 4) && new Set(ws.map(w => w.spread)).size > 3, ws.map(w => w.settled));
const sp = r.kinds.Spider;
check('a spider keeps its curl where it stands: no ragdoll, no 90° turn, on the ground', sp.rig && !sp.ragdoll && sp.rotZ === 0 && Math.abs(sp.lift) < .01, sp);
check('a beast\'s fall costs under 15 ms a step (about 1 ms alone; a loaded runner is slower)', r.msPerStep > 0 && r.msPerStep < 15, r.msPerStep);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
