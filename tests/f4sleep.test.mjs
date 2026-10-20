// Card F4 (Session 1205): a householder asleep in their bed (Sessions 739 and 752) on the new look, in the builder's body. The body
// is built after the room, so the sleeper is first laid by the driver's shape; when the builder's body comes they are laid again by
// its own: every point of it in the bed, its side on the mattress, its head on the pillow and not through the headboard (laid by the
// driver's, the builder's head bone sat 6 cm past the mattress's end), the quilt draped over its shape, its eyes shut. Woken, the quilt goes and
// the eyes open. Picture: docs/prototypes/f4/f4-sleeper.jpg.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });

const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const K = await page.evaluate(() => SCALE.ROOM_K);
const enter = async (hr, k) => { await page.evaluate(([hr, k]) => { forceTime(hr); const S = WORLD.settle.get('dunmore');
  const h = S.houses.filter(x => x.type === 'home' && !x.ownedByPlayer && !x.shuttered)[k]; window._h = h; px = h.exitX; pz = h.exitZ; goToInterior(h); }, [hr, k]);
  await page.waitForTimeout(3000); await g.hide(); };
const leave = async () => { await page.evaluate(() => exitInterior()); await page.waitForTimeout(1500); };
// the builder's body built for the sleeper, as hbTick builds it (one at a time, once the room is loaded), the eye at the door
const build = () => page.evaluate(() => { const rig = intNPCMesh.userData.rig; CAM.position.set(px, 1.65, pz); CAM.updateMatrixWorld(true); let k = 0; while (!rig.hb && !rig.hbFail && k++ < 60) { HBODY.last = -1e9; hbTick(performance.now()); }
  return { hb: !!rig.hb, fail: !!rig.hbFail, k }; });
// the body against its bed: every point of the builder's body (personSkinPts gives them while it is on), its head, the quilt over it
const read = () => page.evaluate(() => { const m = intNPCMesh; if (!m) return null; const rig = m.userData.rig, H = rig.hb, b = INT_BEDS.find(b => b.owner === 'home');
  const B = SLEEP_BED, cz = b.cz != null ? b.cz : b.z, y0 = b.y || 0, pts = personSkinPts(rig); let out = 0, ym = 1e9, zm = 1e9, n = pts.length / 3;
  for (let i = 0; i < pts.length; i += 3) { const lx = pts[i] - b.x, lz = pts[i + 2] - cz; ym = Math.min(ym, pts[i + 1] - y0); zm = Math.min(zm, lz);
    if (Math.abs(lx) > B.W / 2 + .03 || lz < -B.L / 2 || lz > B.L / 2 + .06) out++; }
  const hd = H ? H.P.byName.head : rig.B.head; m.updateMatrixWorld(true); const head = hd.getWorldPosition(new THREE.Vector3()), cv = m.userData.cover;
  let over = 0, under = 0, za = null;
  if (cv) { cv.updateMatrixWorld(true); const P = cv.geometry.attributes.position.array; za = P[2] + cz; const rc = new THREE.Raycaster(); rc.far = 5;
    for (let i = 0; i < pts.length; i += 12) { if (pts[i + 2] < za + .05) continue; rc.set(new THREE.Vector3(pts[i], y0 + 3, pts[i + 2]), new THREE.Vector3(0, -1, 0));
      const hit = rc.intersectObject(cv)[0]; under++; if (!hit || hit.point.y < pts[i + 1] - .01) over++; } }
  const eyes = H && H.eyes ? H.eyes : [];
  return { sleep: !!rig.sleep, hb: !!H, L: H ? H.L : null, n, out, ym: +ym.toFixed(3), zm: +zm.toFixed(3), top: B.TOP, half: +(B.L / 2).toFixed(3),
    head: [+(head.x - b.x).toFixed(2), +(head.y - y0).toFixed(2), +(head.z - cz).toFixed(2)], cover: !!cv, za: za == null ? null : +(za - cz).toFixed(2), under, over,
    eyes: eyes.length, shut: eyes.filter(e => e.o.material === H.lid).length }; });

// 1. at 23h30, three homes: the sleeper in the builder's body, laid by its own shape
let first = null;
for (const k of [0, 2, 4]) {
  await enter(23.5, k);
  const pre = await page.evaluate(() => { const rig = intNPCMesh.userData.rig; return { asleep: !!intNPCMesh.userData.asleep, hb: !!rig.hb, inRigs: HB_RIGS.has(rig) }; });
  const bt = await build(); const s = await read(); if (!first) first = s;
  check(`home ${k}: asleep, and the builder's body comes to them in bed (${bt.k} ticks)`, pre.asleep && pre.inRigs && bt.hb && s.sleep && s.hb, { pre, bt, s });
  check(`home ${k}: every point of the builder's body inside the bed's frame (${s.n} points), the crown short of the headboard`, s.out === 0 && s.zm > -s.half, { out: s.out, zm: s.zm, half: s.half });
  check(`home ${k}: its side on the mattress, not over it and not through it`, s.ym > s.top - .04 && s.ym < s.top + .01, { ym: s.ym, top: s.top });
  check(`home ${k}: its head on the pillow, at the bed's head, above the mattress and out of the quilt`, s.head[2] < -.45 * K && s.head[2] > -.72 * K && s.head[1] > s.top && s.head[2] < s.za, { head: s.head, za: s.za });
  check(`home ${k}: the quilt drawn to the neck over its whole body below it (no point through it)`, s.cover && s.za > -.6 * K && s.za < -.1 * K && s.under > 150 && s.over / s.under < .02, { za: s.za, under: s.under, over: s.over });
  check(`home ${k}: both eyes shut (each eyeball in a lid of the skin's tone)`, s.eyes === 2 && s.shut === 2, { eyes: s.eyes, shut: s.shut });
  if (k === 0) {
    // the loop runs: three seconds and they stay in the bed, laid as they were
    await g.frames(10); await page.evaluate(() => { for (let i = 0; i < 180; i++) { tickPeople(1 / 60, performance.now() + i * 16.7); hbTick(performance.now()); WORLD.tickInterior(1 / 60, performance.now()); } });
    const s2 = await read();
    check('three seconds of the loop: still asleep under the quilt, the builder\'s body still all in the bed, its head where it was (2 cm)', s2.sleep && s2.cover && s2.out === 0 && Math.hypot(s2.head[0] - s.head[0], s2.head[1] - s.head[1], s2.head[2] - s.head[2]) < .02, { s2: { out: s2.out, head: s2.head }, head: s.head });
    // the picture: from the room's side of the bed, beyond the two units that would wake them
    await page.evaluate(() => { const b = INT_BEDS.find(b => b.owner === 'home'), cz = b.cz != null ? b.cz : b.z; px = b.x + 2.4; pz = cz - .2; lookAtPt(b.x, .7, cz - .55); });
    await g.frames(4);
    const still = await page.evaluate(() => !!intNPCMesh.userData.asleep);
    await page.screenshot({ path: path.join(OUT, 'f4-sleeper.jpg') });
    check('seen from 2.4 m they sleep on', still, still);
    // 2. woken: up, the quilt gone, the eyes open again
    const up = await page.evaluate(() => { const b = INT_BEDS.find(b => b.owner === 'home'); px = b.x + 1.2; pz = b.z + 1.2; WORLD.tickInterior(1 / 60, performance.now());
      const m = intNPCMesh, rig = m.userData.rig, H = rig.hb; return { asleep: !!m.userData.asleep, sleep: !!rig.sleep, cover: !!m.userData.cover, open: H.eyes.filter(e => e.o.material === e.m).length, rx: m.rotation.x }; });
    check('woken, they stand: the quilt gone, both eyes open', !up.asleep && !up.sleep && !up.cover && up.open === 2 && up.rx === 0, up);
  }
  await leave(); }
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
