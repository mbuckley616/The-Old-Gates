import { boot } from '../lib/game.mjs';
import fs from 'fs';
const tag = process.argv[2] || 'main', inject = process.argv[3];
const g = await boot(); const { page } = g;
await g.intoWorld(); const stop = g.keepAlive();
if (inject) await page.evaluate(src => { (0, eval)(src); }, fs.readFileSync(inject, 'utf8'));
await page.evaluate(() => { const f = hbRideSkirt; window.hbRideSkirt = function (rig) { const H = rig.hb; if (H && !H.rideSkirt) { let sk = null; H.P.root.traverse(o => { if (o.isSkinnedMesh && /^(skirt|coatSkirt|mailSkirt)$/.test(o.name) && !sk) sk = o; });
  if (sk) { H.root.updateMatrixWorld(true); const s = new THREE.Vector3().setFromMatrixScale(H.P.byName.root.matrixWorld).x; const a = sk.geometry.attributes.position.array; window._skirtRest = Float32Array.from(a, x => x * s); window._origPos = Float32Array.from(a); window._origSI = sk.geometry.attributes.skinIndex; window._origSW = sk.geometry.attributes.skinWeight; } }
  const t0 = performance.now(); const r = f(rig); if (H && H.rideSkirt && !H.rideSkirtMs) H.rideSkirtMs = Math.round(performance.now() - t0); return r; }; });
const rf = await page.evaluate(() => { const now = worldState.gameTimeAbsMinutes || 0, day = Math.floor(now / 1440);
  for (let dd = day + 1; dd < day + 40; dd++) for (const rd of ROADS.filter(roadfolkRoad)) for (const T of roadTravellers(rd, dd)) { if (T.kind !== 'rider') continue;
    const L = roadLenOf(rd); if (L < 400) continue; const t = T.at + (L * .5) / T.pace; const p = travellerAt(T, rd, t); if (!p) continue;
    worldState.gameTimeAbsMinutes = t; worldState.gameTimeMinutes = t % 1440; px = p.x + Math.cos(p.ang) * 3; pz = p.z - Math.sin(p.ang) * 3;
    return { id: T.id }; } return null; });
console.log(JSON.stringify(rf));
await g.cells(); await g.spin(null, 4); await g.frames(3);
await page.evaluate((id) => { const H = ROADWALK.get(id).npc.g.userData.rig.ride.beast; if (!H.hc && !H.hcFail) hcAttach(H); }, rf.id);
for (let i = 0; i < 80; i++) { const ok = await page.evaluate((id) => { const r = ROADWALK.get(id).npc.g.userData.rig; return !!(r.hb && r.hb.rideSkirt) || !!r.hbFail; }, rf.id); if (ok) break; await g.frames(2); }
const variants = JSON.parse(process.env.VARIANTS || '[{}]');
for (const [vi, VAR] of variants.entries()) {
if (vi > 0 || VAR.k) await page.evaluate(([id, VAR]) => { const rig = ROADWALK.get(id).npc.g.userData.rig, H = rig.hb; let sk = null; H.P.root.traverse(o => { if (o.isSkinnedMesh && /^(skirt|coatSkirt|mailSkirt)$/.test(o.name) && !sk) sk = o; });
  const o = window._orig || (window._orig = null); const g = sk.geometry; g.attributes.position.array.set(window._origPos); g.attributes.position.needsUpdate = true; g.setAttribute('skinIndex', window._origSI); g.setAttribute('skinWeight', window._origSW);
  Object.assign(window.HB_RIDE_SKIRT_X || HB_RIDE_SKIRT, VAR.k || {}); H.rideSkirt = false; H.rideSkirtMs = 0; hbRideSkirt(rig); }, [rf.id, VAR]);
const S = await page.evaluate((id) => { const D = ROADWALK.get(id), rig = D.npc.g.userData.rig; const P = rig.hb.P, by = P.byName; let sk = null;
  P.root.traverse(o => { if (o.isSkinnedMesh && /^(skirt|coatSkirt|mailSkirt)$/.test(o.name) && !sk) sk = o; }); if (!sk) return { skirt: false };
  if (rig.hb.L !== 0) hbLevel(rig, 0); hbPose(rig); rig.hb.root.updateMatrixWorld(true);
  const g = sk.geometry, pa = g.attributes.position, ix = g.index.array, rest = rig.hb.rest0 || null;
  const hip = by['upperleg01.L'].getWorldPosition(new THREE.Vector3()).add(by['upperleg01.R'].getWorldPosition(new THREE.Vector3())).multiplyScalar(.5);
  const fw = new THREE.Vector3(0, 0, 1).applyQuaternion(D.beast.getWorldQuaternion(new THREE.Quaternion()));
  const W = []; const v = new THREE.Vector3(); for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); sk.applyBoneTransform(i, v); W.push(v.clone()); }
  const R0 = window._skirtRest; const E = new Map(); const out = []; let n2 = 0;
  for (let t = 0; t < ix.length; t += 3) for (let e = 0; e < 3; e++) { const a = ix[t + e], b = ix[t + (e + 1) % 3]; const k = Math.min(a, b) + ',' + Math.max(a, b); if (E.has(k)) continue;
    const d = W[a].distanceTo(W[b]), r = R0 ? Math.hypot(R0[a*3]-R0[b*3], R0[a*3+1]-R0[b*3+1], R0[a*3+2]-R0[b*3+2]) : 0; E.set(k, 1); out.push([d, r ? d / r : 0, a, b]); }
  out.sort((x, y) => y[0] - x[0]); const ds = out.map(o => o[0]).sort((a, b) => a - b), med = ds[ds.length >> 1];
  const dbg = i => window._dbg ? [window._dbg.pin[window._dbg.rep[i]], ...(window._dbg.th[window._dbg.rep[i]]||[])] : null; const where = i => { const q = W[i].clone().sub(hip); const f = q.dot(fw), s = Math.sqrt(q.lengthSq() - f * f - q.y * q.y); return [+(Math.atan2(Math.abs(q.x * fw.z - q.z * fw.x), f) * 180 / Math.PI).toFixed(0), +q.y.toFixed(2)]; };
  return { n: pa.count, edges: out.length, med: +med.toFixed(3), top: out.slice(0, 8).map(o => [+o[0].toFixed(3), +o[1].toFixed(1), where(o[2]), where(o[3]), dbg(o[2]), dbg(o[3])]), over10: out.filter(o => o[0] > .1).length, over15: out.filter(o => o[0] > .15).length,
    ratioMax: R0 ? +Math.max(...out.map(o => o[1])).toFixed(2) : null, r3: R0 ? out.filter(o => o[1] > 3).length : null, r2: R0 ? out.filter(o => o[1] > 2).length : null, N: rig.hb.rideSkirtN, ms: rig.hb.rideSkirtMs }; }, rf.id);
console.log(vi, JSON.stringify(VAR), JSON.stringify(S)); if (process.env.DUMP) fs.writeFileSync(process.env.DUMP, JSON.stringify(await page.evaluate(() => window._dump)));
// pictures: front three-quarter, side, back
const views = { front: [1.6, 1.7, 1.9], side: [2.2, 1.5, 0.1], back: [-.4, 1.8, -2.0], frontlow: [.3, 1.2, 1.4] };
for (const [nm, c] of Object.entries(views)) {
  const url = await page.evaluate(([id, c]) => { const D = ROADWALK.get(id), sc = WORLD.scene, cv = REN.domElement; D.beast.updateMatrixWorld(true);
    const rig = D.npc.g.userData.rig, by = rig.hb.P.byName, hip = by.root.getWorldPosition(new THREE.Vector3());
    const q = D.beast.getWorldQuaternion(new THREE.Quaternion()), off = new THREE.Vector3(c[0], c[1] - 1.3, c[2]).applyQuaternion(q);
    const cam = new THREE.PerspectiveCamera(32, cv.width / cv.height, .05, 200); cam.position.copy(hip).add(off); cam.lookAt(hip.x, hip.y - .15, hip.z); REN.render(sc, cam);
    return cv.toDataURL('image/jpeg', .85); }, [rf.id, c]);
  fs.writeFileSync(`tests/tmp/skirt-${tag}${vi}-${nm}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
}
}
stop(); await g.close();
