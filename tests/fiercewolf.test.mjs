// The wolves and the cave bear (Session 632, Michael's A on DECISION #187): the wolves' fiercer face (a brow over small slanted
// eyes with no round pupil, a deep muzzle with the canines showing, ears laid back, the head carried low), a heavier build and
// raised hackles; the sizes in play Wolf 1.05, Snow Wolf 1.15, Dire Wolf 1.35, Ash Hound 1.0, Cave Bear 1.55; and the inspector
// showing each at its size in play (it built them at 1). Heights are read as Session 620 read them: the highest vertex bound to
// the spine or the hips, over a bandit's height as the world builds him. SHOOT=1 writes docs/prototypes/wolfbear-built-*.png.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const g = await boot(); const { page } = g;
await g.intoWorld();
const SIZES = { 'Wolf': 1.05, 'Snow Wolf': 1.15, 'Dire Wolf': 1.35, 'Ash Hound': 1.0, 'Cave Bear': 1.55 };
const r = await page.evaluate(SIZES => {
  const grp = new THREE.Group(); WORLD.scene.add(grp);
  const box = o => { o.updateMatrixWorld(true); return new THREE.Box3().setFromObject(o); };
  const man = box(buildZoneEnemy(grp, [], px + 44, pz + 40, 'Bandit').limbs.person.root); const manH = man.max.y - man.min.y;
  const out = { manH: +manH.toFixed(2), kinds: {} };
  for (const n in SIZES) {
    const e = buildZoneEnemy(grp, [], px + 40, pz + 40, n); const w = e.limbs.wolf;
    const ga = w.mesh.geometry, pa = ga.attributes.position, si = ga.attributes.skinIndex; const bi = new Set([w.B.spine.userData.i, w.B.hips.userData.i]);
    let top = 0; for (let i = 0; i < pa.count; i++) if (bi.has(si.getX(i))) top = Math.max(top, pa.getY(i));
    openInspector(); const ie = INSPECTOR.entries.find(x => x.sub === 'On the wolf kit' && x.name === n); INSPECTOR.select(ie.id); const insS = INSPECTOR.built.get(ie.id).obj.scale.x; closeInspector();
    out.kinds[n] = { play: WOLF_KINDS[n].play, scale: +w.root.scale.x.toFixed(2), ins: +insS.toFixed(2), back: +(top * w.root.scale.x / manH).toFixed(2), tris: w.tris, trisLo: w.trisLo,
      barAbove: e.hpFg.position.y > top * w.root.scale.x };
  }
  WORLD.scene.remove(grp); return out;
}, SIZES);
console.log(JSON.stringify(r));
const K = r.kinds;
check('each kind is built in play at Michael\'s size (A on #187), and WOLF_KINDS.play says the same', Object.keys(SIZES).every(n => K[n].scale === SIZES[n] && K[n].play === SIZES[n]), K);
check('the inspector shows each at its size in play', Object.keys(SIZES).every(n => K[n].ins === SIZES[n]), Object.fromEntries(Object.entries(K).map(([n, v]) => [n, v.ins])));
check('a Wolf\'s back stands at 50–62% of a man (was 38%), a Dire Wolf\'s at 66–80% (was 49%)', K.Wolf.back >= .5 && K.Wolf.back <= .62 && K['Dire Wolf'].back >= .66 && K['Dire Wolf'].back <= .8, { wolf: K.Wolf.back, dire: K['Dire Wolf'].back });
check('the Cave Bear\'s hump stands clearly over the largest wolf (82–95% of a man, was 77%)', K['Cave Bear'].back >= .82 && K['Cave Bear'].back <= .95 && K['Cave Bear'].back > K['Dire Wolf'].back + .08, { bear: K['Cave Bear'].back });
check('a wolf with the new head and hackles is 5.8–6.6k triangles (was 5.75k), its distant copy under 60% of that', ['Wolf', 'Snow Wolf', 'Dire Wolf', 'Ash Hound'].every(n => K[n].tris > 5800 && K[n].tris < 6600 && K[n].trisLo < K[n].tris * .6), Object.fromEntries(Object.entries(K).map(([n, v]) => [n, [v.tris, v.trisLo]])));
check('every health bar still sits above its beast\'s back', Object.values(K).every(v => v.barAbove), K);

// the falls at the new sizes: a bigger body falls slower against the same gravity, and at 1.05 a Wolf came to rest standing in 3 seeded
// falls of 400 (7 for the Dire Wolf) until the ragdoll's tip was widened (creatureRagdollStep, S632). 120 seeded falls of each.
const F = await page.evaluate(() => { const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; const rr = Math.random, out = {};
  for (const kind of ['Wolf', 'Dire Wolf']) { let up = 0, capped = 0;
    for (let s = 1; s <= 120; s++) { let a = s * 7919 + 104729; Math.random = () => { a = (a * 1103515245 + 12345) % 2147483648; return a / 2147483648; };
      const ang = (s % 4) * 1.1, dist = 4 + (s % 3) * 1.5, x = px + Math.sin(ang) * dist, z = pz + Math.cos(ang) * dist;
      const e = buildZoneEnemy(WORLD.scene, [], x, z, kind, null); e.locked = false; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
      e.mesh.position.set(x, activeTerrainH(x, z), z); e.mesh.updateMatrixWorld(true); e.hp = 0; killZoneEnemy(e, WORLD.scene, s % 3 === 1 ? ' (POWER)' : s % 3 === 2 ? ' (ARROW)' : '');
      const R = [...RAGDOLLS].find(q => q.rig === e.limbs.wolf); let i = 0; while (R && RAGDOLLS.has(R) && i < 300) { tickRagdolls(1 / 60); i++; }
      if (R && R.t > 4) capped++; e.mesh.updateMatrixWorld(true);
      if (new THREE.Vector3(0, 1, 0).applyQuaternion(e.limbs.wolf.B.spine.getWorldQuaternion(new THREE.Quaternion())).y > .707) up++; WORLD.scene.remove(e.mesh); }
    out[kind] = { up, capped }; }
  Math.random = rr; window.requestAnimationFrame = raf; return out; });
console.log('falls', JSON.stringify(F));
check('at the new sizes a dead wolf does not come to rest standing: at most one of 120 seeded falls a kind, none at the cap', F.Wolf.up + F['Dire Wolf'].up <= 1 && F.Wolf.capped + F['Dire Wolf'].capped === 0, F);

if (process.env.SHOOT) {
  const shots = await page.evaluate(SIZES => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
    const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100); const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), new THREE.MeshLambertMaterial({ color: 0x5a6040 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
    const snap = () => { sc.updateMatrixWorld(true); REN.render(sc, cam); const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL(); };
    let objs = []; const clear = () => { objs.forEach(o => sc.remove(o)); objs = []; }; const shots = {};
    const bandit = x => { const bd = buildFoe('Bandit', 3, 3); PEOPLE_RIGS.delete(bd); pwApply(bd, pwIdle(1, { holds: bd.holds, gear: bd.g.gear })); bd.root.position.set(bx + x, y, bz); bd.root.rotation.y = .25; sc.add(bd.root); objs.push(bd.root); };
    const beast = (n, s, x, z, ry, pose) => { const w = buildWolf(n, s); WOLF_RIGS.delete(w); w.root.position.set(bx + x, y, bz + (z || 0)); w.root.rotation.y = ry; sc.add(w.root); objs.push(w.root);
      wgApply(w, pose === 'trot' ? wgStride(WG.TROT, .3, 1, false) : pose === 'atk' ? wgAttack(.3, .7, wgStand(1)) : wgStand(1)); };
    bandit(-4.2); let x = -3.3; ['Wolf', 'Snow Wolf', 'Dire Wolf', 'Ash Hound'].forEach(n => { beast(n, SIZES[n], x + .35 * SIZES[n], 0, Math.PI / 2 - .35); x += 1.25 * SIZES[n] + .1; });
    beast('Cave Bear', SIZES['Cave Bear'], x + .6 * SIZES['Cave Bear'], 0, Math.PI / 2 - .35);
    cam.position.set(bx + .5, y + 1.6, bz + 9.8); cam.lookAt(bx + .5, y + .6, bz); shots.lineup = snap(); clear();
    ['Wolf', 'Snow Wolf', 'Dire Wolf', 'Ash Hound'].forEach((n, i) => beast(n, 1, -1.25 + i * .8, 0, .6)); cam.position.set(bx, y + .7, bz + 3.4); cam.lookAt(bx, y + .4, bz); shots.heads = snap(); clear();
    bandit(1.5); objs[0].position.z = bz - .9; beast('Wolf', SIZES.Wolf, -.6, .2, .15, 'trot'); beast('Dire Wolf', SIZES['Dire Wolf'], .5, -1.4, -.1); beast('Wolf', SIZES.Wolf, -1.9, -1.2, .45, 'atk');
    cam.position.set(bx + .2, y + 1.15, bz + 4.4); cam.lookAt(bx - .3, y + .45, bz - .6); shots.pack = snap(); clear(); sc.remove(floor); return shots; }, SIZES);
  for (const [k, v] of Object.entries(shots)) fs.writeFileSync(path.join(ROOT, 'docs', 'prototypes', `wolfbear-built-${k}.png`), Buffer.from(v.split(',')[1], 'base64'));
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
