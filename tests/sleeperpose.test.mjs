// Session 752 — a sleeper in bed (the look half of Michael's A on #240; Session 739 laid the standing body flat on the bed). From 23h
// a home's resident lies on their left side in the bed, facing the room, the knees drawn up and the head on the pillow, the eyes
// closed, and the bed's quilt drawn up over them to the neck, draped on the body's own shape. Woken, they stand and the quilt goes.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
// S896 (card F2a): the rooms are built at true size, their beds 1.444 times the kit's (SCALE.ROOM_K); the head's and the quilt's places
// along the bed are re-measured by that factor
const K = await page.evaluate(() => SCALE.ROOM_K);
const [homes, gal] = await page.evaluate(() => { const hs = WORLD.settle.get('dunmore').houses.filter(x => x.type === 'home' && !x.ownedByPlayer && !x.shuttered); return [hs.length, 1]; });
const enter = async (hr, k) => { await page.evaluate(([hr, k, gal]) => { forceTime(hr); const S = WORLD.settle.get('dunmore');
  const h = S.houses.filter(x => x.type === 'home' && !x.ownedByPlayer && !x.shuttered)[k]; window._h = h; if (k === gal) { h._two0 = h.two; h.two = true; } px = h.exitX; pz = h.exitZ; goToInterior(h); }, [hr, k, gal]);
  await page.waitForTimeout(3000); await g.hide();
  // S1224 (card F4): on the new look the resident's builder body comes a moment after the room and lays the sleeper again by its own
  // shape (hbAttach); it is built here first, so what is measured is the body that shows and the loop below does not move it
  await page.evaluate(() => { const m = intNPCMesh, rig = m && m.userData.rig; if (!rig || !HB_RIGS.has(rig)) return; CAM.position.set(px, 1.65, pz); CAM.updateMatrixWorld(true);
    let k = 0; while (!rig.hb && !rig.hbFail && k++ < 60) { HBODY.last = -1e9; hbTick(performance.now()); } }); };
const leave = async () => { await page.evaluate(() => { exitInterior(); if ('_two0' in _h) { _h.two = _h._two0; delete _h._two0; } }); await page.waitForTimeout(1500); };
// the body against its bed: every skinned point, the head, the quilt over it
const read = () => page.evaluate(() => { const m = intNPCMesh; if (!m) return null; const rig = m.userData.rig, b = INT_BEDS.find(b => b.owner === 'home');
  const B = SLEEP_BED, cz = b.cz != null ? b.cz : b.z, y0 = b.y || 0, pts = personSkinPts(rig); let out = 0, ym = 1e9, n = pts.length / 3;
  for (let i = 0; i < pts.length; i += 3) { const lx = pts[i] - b.x, lz = pts[i + 2] - cz; ym = Math.min(ym, pts[i + 1] - y0);
    if (Math.abs(lx) > B.W / 2 + .03 || lz < -B.L / 2 || lz > B.L / 2 + .06) out++; }
  const v = new THREE.Vector3(), head = rig.B.head.localToWorld(new THREE.Vector3(0, .1, 0)), hips = rig.B.hips.getWorldPosition(v.clone()), cv = m.userData.cover;
  let over = 0, under = 0, za = null;
  if (cv) { cv.updateMatrixWorld(true); const P = cv.geometry.attributes.position.array; za = P[2] + cz;
    const rc = new THREE.Raycaster(); rc.far = 5;
    for (let i = 0; i < pts.length; i += 12) { if (pts[i + 2] < za + .05) continue; rc.set(new THREE.Vector3(pts[i], y0 + 3, pts[i + 2]), new THREE.Vector3(0, -1, 0));
      const hit = rc.intersectObject(cv)[0]; under++; if (!hit || hit.point.y < pts[i + 1] - .01) over++; } }
  return { sleep: !!rig.sleep, w: +(rig.w.sleep || 0).toFixed(2), rx: +m.rotation.x.toFixed(2), n, out, ym: +ym.toFixed(3), top: B.TOP,
    head: [+(head.x - b.x).toFixed(2), +(head.y - y0).toFixed(2), +(head.z - cz).toFixed(2)], hips: [+hips.x.toFixed(3), +hips.y.toFixed(3), +hips.z.toFixed(3)],
    cover: !!cv, inScene: !!(cv && cv.parent === scene), tris: cv ? cv.geometry.index.count / 3 : 0, za: za == null ? null : +(za - cz).toFixed(2), under, over,
    lids: rig.lids ? rig.lids.children.length : 0, lidsOn: !!(rig.lids && rig.lids.parent === rig.B.head), eyes: rig.eyes.length, gy: y0 }; });

// 1. asleep at 23h30 in six homes (home 1 made two-storey for its visit, so its bed is the gallery's): in the bed, on the mattress, under the quilt to the neck, the head out on the pillow, eyes closed
const seen = [];
for (const k of [...new Set([0, 2, 4, 6, 8, gal])].filter(k => k >= 0 && k < homes)) {
  await enter(23.5, k); const s = await read(); seen.push(s);
  check(`home ${k}: asleep in the sleep pose (laid flat as before, the sleep blend whole)`, s && s.sleep && s.w === 1 && s.rx === -1.57, s);
  check(`home ${k}: every point of the body inside the bed's frame (${s && s.n} points)`, s && s.out === 0, s && { out: s.out, n: s.n });
  check(`home ${k}: the body lies on the mattress, not over it and not through it`, s && s.ym > s.top - .04 && s.ym < s.top + .01, s && { ym: s.ym, top: s.top });
  check(`home ${k}: the head on the pillow, at the bed's head, above the mattress and out of the quilt`, s && s.head[2] < -.45 * K && s.head[2] > -.72 * K && s.head[1] > s.top && s.head[2] < s.za, s && { head: s.head, za: s.za });
  check(`home ${k}: the quilt in the room, drawn to the neck, over the whole body below it (no point through it)`, s && s.cover && s.inScene && s.za > -.6 * K && s.za < -.1 * K && s.under > 150 && s.over / s.under < .02, s && { za: s.za, under: s.under, over: s.over, tris: s.tris });
  check(`home ${k}: the eyes closed (a lid and a crease over each eye, on the head bone)`, s && s.lidsOn && s.lids === 2 * s.eyes && s.eyes === 2, s && { lids: s.lids, eyes: s.eyes });
  if (k === 0) { // the loop runs: the breath moves the body by a hair, the pose and the quilt stay
    const h0 = s.hips; await g.frames(10); await page.evaluate(() => { for (let i = 0; i < 180; i++) { tickPeople(1 / 60, performance.now() + i * 16.7); WORLD.tickInterior(1 / 60, performance.now()); } });
    const s2 = await read(); const dh = Math.hypot(s2.hips[0] - h0[0], s2.hips[1] - h0[1], s2.hips[2] - h0[2]);
    check('three seconds of the loop: still asleep under the quilt, the hips within 2 cm, no point out of the bed', s2.sleep && s2.cover && s2.w === 1 && dh < .02 && s2.out === 0, { dh: +dh.toFixed(4), out: s2.out });
    // 2. woken: up on their feet, the quilt and the lids gone
    const up = await page.evaluate(() => { const b = INT_BEDS.find(b => b.owner === 'home'); px = b.x + 1.2; pz = b.z + 1.2; WORLD.tickInterior(1 / 60, performance.now());
      const m = intNPCMesh, rig = m.userData.rig; return { asleep: !!m.userData.asleep, sleep: !!rig.sleep, idle: rig.w.idle, rx: m.rotation.x, cover: !!m.userData.cover,
        inScene: scene.children.some(c => c.userData.sleepCover), lids: !!rig.lids }; });
    check('woken, they stand: the sleep pose off, the quilt out of the room, the lids gone', !up.asleep && !up.sleep && up.idle === 1 && up.rx === 0 && !up.cover && !up.inScene && !up.lids, up);
    await g.frames(5); }
  await leave(); }
// S896 (card F2a): a cottage at true size (4.6 to 6 m) has no room for a gallery and its stair, so a two-storey home is its ground
// floor, and its resident sleeps in the bed there (before, the gallery's bed, up on its floor); the upper floor is owed to card F9
check(`a two-storey home's resident (home ${gal}, made so for the visit) sleeps in the ground floor's bed (no gallery in a cottage of true size)`, seen.some(s => s && s.gy === 0 && s.sleep && s.out === 0) && seen.every(s => !s || s.gy === 0), seen.map(s => s && s.gy));
// 3. awake at 22h: no quilt, no lids, standing
await enter(22, 0);
const aw = await read();
check('at 22h the resident is up: no sleep pose, no quilt, no lids', aw && !aw.sleep && !aw.cover && aw.lids === 0 && aw.rx === 0, aw);
await leave();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
