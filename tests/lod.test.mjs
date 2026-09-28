// Level of detail for townsfolk (Session 159, numbered 156 when written; the shadow proxy Session 160): a distant copy of every person on the same skeleton,
// swapped in by distance from the eye, and what it saves in a whole town's view.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
fs.mkdirSync('tests/out', { recursive: true });

const rigs = await page.evaluate(() => { const rs = [...PEOPLE_RIGS].filter(r => r.root.parent === WORLD.scene);
  const ok = rs.filter(r => r.geoLo && r.trisLo < r.tris).length;
  // the distant copy binds to the same seventeen bones
  const bonesOk = rs.every(r => { const a = r.geoLo.attributes.skinIndex.array; let mx = 0; for (let i = 0; i < a.length; i += 4) mx = Math.max(mx, a[i]); return mx < 17 && r.geoLo.attributes.position.count === a.length / 4; });
  const ratio = rs.map(r => r.trisLo / r.tris);
  return { n: rs.length, ok, bonesOk, hi: [Math.min(...rs.map(r => r.tris)), Math.max(...rs.map(r => r.tris))], lo: [Math.min(...rs.map(r => r.trisLo)), Math.max(...rs.map(r => r.trisLo))],
    ratio: [+Math.min(...ratio).toFixed(2), +Math.max(...ratio).toFixed(2)], sumHi: rs.reduce((a, r) => a + r.tris, 0), sumLo: rs.reduce((a, r) => a + r.trisLo, 0) }; });
check('every townsperson has a distant copy on the same skeleton, a third to a half the triangles', rigs.n >= 8 && rigs.ok === rigs.n && rigs.bonesOk && rigs.ratio[1] < .55, rigs);

// the shadow pass (Session 160): every person is drawn into the sun's shadow map from the distant copy, and the eye's
// geometry is back in place afterwards
const sp = await page.evaluate(() => { const rs = [...PEOPLE_RIGS].filter(r => r.root.parent === WORLD.scene && r.geoLo); let lo = 0, hi = 0;
  // the shadow pass draws through the renderer with a depth material, not PEOPLE_MAT: count which geometry it is handed
  const rbd = REN.renderBufferDirect;
  REN.renderBufferDirect = function (cam, scn, geo, mat, obj) { if (obj.isSkinnedMesh && obj.parent && obj.parent.userData.rig && mat !== PEOPLE_MAT) { const r = obj.parent.userData.rig; if (geo === r.geoLo) lo++; else if (geo === r.geoHi) hi++; } return rbd.apply(this, arguments); };
  rs.forEach(r => { r.lod = 0; r.mesh.geometry = r.geoHi; });
  try { REN.render(scene, CAM); } finally { REN.renderBufferDirect = rbd; }
  return { people: rs.length, shadowDrawsLo: lo, shadowDrawsHi: hi, restored: rs.every(r => r.mesh.geometry === r.geoHi) }; });
check('the shadow pass draws the townsfolk from their distant copies, and the eye keeps the full ones', sp.shadowDrawsLo > 0 && sp.shadowDrawsHi === 0 && sp.restored, sp);

// the swap follows the camera, with a gap between the thresholds
const sw = await page.evaluate(() => { const rig = [...PEOPLE_RIGS].find(r => r.root.parent === WORLD.scene && r.root.visible); const p = rig.root.position; const out = [];
  const at = d => { CAM.position.set(p.x + d, p.y + 1.6, p.z); tickPeople(1 / 60, 5e5); out.push([d, rig.lod, rig.mesh.geometry === rig.geoLo]); };
  [5, 16, 18, 16, 14.5, 30].forEach(at); return out; });
check('near: full detail; past 17 the distant copy; back under 15 full again; 16 keeps whichever it had',
  JSON.stringify(sw.map(x => x[1])) === '[0,0,1,1,0,1]' && sw.every(x => (x[1] === 1) === x[2]), sw);

// the photograph: the same genome at the switch distance, full detail against the distant copy
const shot = await page.evaluate(() => { forceTime(12); const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + t.pad + 6; yaw = Math.PI; pitch = -.02;
  const src = [...PEOPLE_RIGS].filter(r => r.root.parent === WORLD.scene && /villager|farmer|elder/.test(r.g.role))[2] || [...PEOPLE_RIGS][0];
  const rig = buildPerson(src.g); PEOPLE_RIGS.delete(rig); window._lr = rig; return rig.g.name + ' (' + rig.g.role + ', ' + rig.g.style + ', ' + rig.g.beard + ')'; });
await page.waitForTimeout(1500);
// Both copies are drawn back to back in one task and read straight off the canvas, so nothing else in the
// world (clouds, leaves, the light) can move between them: every changed pixel is the swap.
const photo = d => page.evaluate(d => { const dir = new THREE.Vector3(); CAM.getWorldDirection(dir); dir.y = 0; dir.normalize(); const rig = window._lr;
  const fx = CAM.position.x + dir.x * d, fz = CAM.position.z + dir.z * d; rig.root.position.set(fx, WORLD.worldH(fx, fz), fz); rig.root.rotation.y = Math.atan2(-dir.x, -dir.z);
  if (!rig.root.parent) scene.add(rig.root); pwApply(rig, pwIdle(3, { holds: rig.holds, gear: rig.g.gear })); rig.root.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(rig.root); const c = [new THREE.Vector3(b.min.x, b.min.y, b.min.z), new THREE.Vector3(b.max.x, b.max.y, b.max.z)].map(v => v.project(CAM));
  const cv = REN.domElement, xs = c.map(v => (v.x + 1) / 2 * cv.width), ys = c.map(v => (1 - v.y) / 2 * cv.height), pad = 6;
  const x0 = Math.max(0, Math.floor(Math.min(...xs) - pad)), y0 = Math.max(0, Math.floor(Math.min(...ys) - pad)), w = Math.ceil(Math.abs(xs[1] - xs[0]) + 2 * pad), h = Math.ceil(Math.abs(ys[1] - ys[0]) + 2 * pad);
  const grab = lo => { rig.mesh.geometry = lo ? rig.geoLo : rig.geoHi; REN.render(scene, CAM); const o = document.createElement('canvas'); o.width = w; o.height = h;
    const x = o.getContext('2d'); x.drawImage(cv, x0, y0, w, h, 0, 0, w, h); return { url: o.toDataURL(), px: x.getImageData(0, 0, w, h).data }; };
  const hi = grab(false), hi2 = grab(false), lo = grab(true); rig.mesh.geometry = rig.geoHi;
  const cmp = (A, B) => { let n = 0, sum = 0; for (let i = 0; i < A.length; i += 4) { const e = (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2])) / 3; sum += e; if (e > 24) n++; }
    return { changed: n, share: +(n / (A.length / 4)).toFixed(3), meanDiff: +(sum / (A.length / 4)).toFixed(2) }; };
  return { crop: [w, h], px: w * h, repeat: cmp(hi.px, hi2.px), swap: cmp(hi.px, lo.px), hi: hi.url, lo: lo.url }; }, d);
const res = {};
for (const d of [17, 6]) { await page.waitForTimeout(800); const r = await photo(d);
  for (const k of ['hi', 'lo']) { fs.writeFileSync(`tests/out/lod-${d}-${k}.png`, Buffer.from(r[k].split(',')[1], 'base64')); delete r[k]; } res[d] = r; }
check('the same frame drawn twice is identical (the comparison is clean)', res[17].repeat.changed === 0 && res[6].repeat.changed === 0, [res[17].repeat, res[6].repeat]);
check('at the switch distance the distant copy changes under a tenth of the figure\'s pixels, and less than it would up close', res[17].swap.share < .1 && res[17].swap.meanDiff < res[6].swap.meanDiff * 1.5, res);
console.log('  subject: ' + shot);
await page.evaluate(() => { scene.remove(window._lr.root); });

// the whole town, from the square and from the road outside, with and without the distant copies.
// (Render times on software GL swing tenfold from one batch to the next, so only draw calls and triangles are compared.)
const view = async (where) => { await page.evaluate(w => { forceTime(12); const S = WORLD.settle.get('dunmore'); const t = WORLD.siteAnywhere('dunmore');
    px = S.site.x; pz = w === 'square' ? S.site.z + 6 : t.z + t.pad + 8; yaw = 0; pitch = -.05; }, where);
  await page.waitForTimeout(3000);
  return page.evaluate(() => { const rs = [...PEOPLE_RIGS].filter(r => r.root.parent === WORLD.scene);
    const run = force => { rs.forEach(r => { if (force) { r.lod = 0; r.mesh.geometry = r.geoHi; } }); if (!force) tickPeople(1 / 60, 6e5);
      REN.render(scene, CAM); REN.render(scene, CAM); return { calls: REN.info.render.calls, triangles: REN.info.render.triangles }; };
    const saved = { far: PEOPLE_LOD.far, near: PEOPLE_LOD.near }; PEOPLE_LOD.far = PEOPLE_LOD.near = 1e9; const all = run(true);
    PEOPLE_LOD.far = saved.far; PEOPLE_LOD.near = saved.near; const lod = run(false);
    return { people: rs.length, distant: rs.filter(r => r.lod).length, fullDetail: all, withLod: lod, saved: all.triangles - lod.triangles }; }); };
const sq = await view('square'), road = await view('road');
check('the town view draws fewer triangles with the distant copies, the same draw calls', [sq, road].every(m => m.distant > 0 && m.saved > 0 && m.withLod.calls === m.fullDetail.calls) && road.distant > sq.distant, { square: sq, road });

// (how many townsfolk stand in the sun's reach from the road varies with loading and the hour: it can be none)
// the shadow pass: what the townsfolk cost it at full detail (eye and shadow), with the distant copies (the eye's by range,
// the shadow's always), and casting no shadows at all
// (REN.info resets after the shadow pass, so it is read with the reset held off)
const shadowCost = async (where) => { await page.evaluate(w => { forceTime(12); const S = WORLD.settle.get('dunmore'); const t = WORLD.siteAnywhere('dunmore');
    px = S.site.x; pz = w === 'square' ? S.site.z + 6 : t.z + t.pad + 8; yaw = 0; pitch = -.05; }, where);
  await page.waitForTimeout(3000);
  return page.evaluate(() => { const rs = [...PEOPLE_RIGS].filter(r => r.root.parent === WORLD.scene && r.geoLo); tickPeople(1 / 60, 6e5);
    const run = (cast, lo) => { rs.forEach(r => { r.mesh.castShadow = cast; if (!lo) { r.lod = 0; r.mesh.geometry = r.geoHi; } }); if (lo) tickPeople(1 / 60, 6e5); PEOPLE_LOD.shadowLo = lo; REN.render(scene, CAM);
      REN.info.autoReset = false; REN.info.reset(); REN.render(scene, CAM); const t = REN.info.render.triangles; REN.info.autoReset = true; return t; };
    const full = run(true, false), fullNone = run(false, false), now = run(true, true), nowNone = run(false, true);
    rs.forEach(r => { r.mesh.visible = false; }); const nobody = run(true, true); rs.forEach(r => { r.mesh.visible = true; }); run(true, true);
    return { people: rs.length, distant: rs.filter(r => r.lod).length, viewFull: full, viewNow: now, nobody, peopleFull: full - nobody, peopleNow: now - nobody, shadowFull: full - fullNone, shadowNow: now - nowNone, cut: +(1 - (now - nowNone) / (full - fullNone)).toFixed(2), peopleCut: +(1 - (now - nobody) / (full - nobody)).toFixed(3), viewCut: +(1 - now / full).toFixed(3) }; }); };
const sSq = await shadowCost('square'), sRoad = await shadowCost('road');
// (the whole view's cut is reported, not checked: its denominator is whatever terrain and trees have loaded, which on CI
// ran from 640k to 843k triangles for the same view; the check is on what the townsfolk themselves cost, eye and shadow)
check('the townsfolk cost the shadow pass under 65% of what their full meshes did, and the view at least 30% less (the people in the sun\'s reach)', [sSq, sRoad].some(m => m.shadowFull > 0) && [sSq, sRoad].every(m => (m.shadowFull === 0 || (m.shadowNow > 0 && m.cut > .35)) && m.peopleFull > 0 && m.peopleCut > .3), { square: sSq, road: sRoad });

// the shadow's photograph: one person in the afternoon sun, drawn full, the shadow cast by the full mesh, by the distant
// copy, and not at all. The player (and so the shadow map) stays put; the subject tries spots on a ring around them and
// keeps the one where its shadow shows most, since the town's buildings and trees shade much of the ground.
const sh = await page.evaluate(() => { forceTime(16); const S = WORLD.settle.get('dunmore'); px = S.site.x; pz = S.site.z + 6;
  const src = [...PEOPLE_RIGS].filter(r => r.root.parent === WORLD.scene && r.geoLo)[3]; const rig = buildPerson(src.g); window._sr = rig;
  // in the scene, hidden: a rig with no parent is dropped and disposed by the next tickPeople
  rig.root.visible = false; scene.add(rig.root); return rig.g.name; });
await page.waitForTimeout(2500);
const shR = await page.evaluate(() => { const rig = window._sr; rig.root.visible = true; rig.root.rotation.y = 0;
  const others = [...PEOPLE_RIGS].filter(r => r !== rig && r.root.parent === scene); others.forEach(r => { r._v = r.root.visible; r.root.visible = false; });
  const cam = new THREE.PerspectiveCamera(40, REN.domElement.width / REN.domElement.height, .1, 200); const cv = REN.domElement;
  const place = (fx, fz) => { const fy = WORLD.worldH(fx, fz); rig.root.position.set(fx, fy, fz); pwApply(rig, pwIdle(3, { holds: rig.holds, gear: rig.g.gear })); rig.root.updateMatrixWorld(true);
    cam.position.set(fx - 1, fy + 4, fz - 5); cam.lookAt(fx + .8, fy + .3, fz); cam.updateMatrixWorld(); };
  const grab = (cast, lo) => { rig.mesh.castShadow = cast; PEOPLE_LOD.shadowLo = lo; REN.render(scene, cam); const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height;
    const x = o.getContext('2d'); x.drawImage(cv, 0, 0); return { url: o.toDataURL(), px: x.getImageData(0, 0, cv.width, cv.height).data }; };
  const cmp = (A, B) => { let n = 0, sum = 0; for (let i = 0; i < A.length; i += 4) { const e = (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2])) / 3; sum += e; if (e > 24) n++; }
    return { changed: n, share: +(n / (A.length / 4)).toFixed(4), meanDiff: +(sum / (A.length / 4)).toFixed(3) }; };
  let best = null;
  for (const r of [12, 20, 28]) for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, fx = px + Math.cos(a) * r, fz = pz + Math.sin(a) * r; place(fx, fz);
    const n = cmp(grab(true, false).px, grab(false, true).px).changed; if (!best || n > best.n) best = { n, fx, fz }; }
  place(best.fx, best.fz);
  const hi = grab(true, false), hi2 = grab(true, false), lo = grab(true, true), none = grab(false, true);
  // the control: the shadow cast from someone else's distant copy, to show the comparison can see a wrong shadow
  // (Session 172: whoever is fourth in the town changed with its names, and one other person's shadow can match the
  // subject's closely enough to change no pixel past the threshold; so try the four most unlike and keep the most visible)
  const cands = [...PEOPLE_RIGS].filter(r => r !== rig && r.geoLo).sort((a, b) => (Math.abs(b.g.height - rig.g.height) + (b.g.style !== rig.g.style ? .1 : 0)) - (Math.abs(a.g.height - rig.g.height) + (a.g.style !== rig.g.style ? .1 : 0))).slice(0, 4);
  const own = rig.geoLo; let wrong = null; for (const other of cands) { rig.geoLo = other.geoLo; const w = grab(true, true); if (!wrong || cmp(hi.px, w.px).changed > cmp(hi.px, wrong.px).changed) wrong = w; }
  rig.geoLo = own; rig.mesh.castShadow = true; PEOPLE_LOD.shadowLo = true;
  scene.remove(rig.root); others.forEach(r => { r.root.visible = r._v; });
  return { spot: [+(best.fx - px).toFixed(1), +(best.fz - pz).toFixed(1)], repeat: cmp(hi.px, hi2.px), distantShadow: cmp(hi.px, lo.px), otherPerson: cmp(hi.px, wrong.px), noShadow: cmp(hi.px, none.px), hi: hi.url, lo: lo.url, none: none.url }; });
for (const k of ['hi', 'lo', 'none']) { fs.writeFileSync(`tests/out/lod-shadow-${k}.png`, Buffer.from(shR[k].split(',')[1], 'base64')); delete shR[k]; }
check('the shadow from the distant copy: the shadow is there, another person\'s would show, and the copy changes under a tenth of the pixels the shadow itself does', shR.repeat.changed === 0 && shR.noShadow.changed > 40 && shR.otherPerson.changed > shR.distantShadow.changed && shR.distantShadow.changed < shR.noShadow.changed * .1, { subject: sh, ...shR });

// S229 — the owed third tier (H.6: "past ~40 units if the frame time needs it"): from the town's centre, looking four ways,
// what share of the frame's triangles are townsfolk past 40 units. Under a tenth, a third tier would save too little to be
// worth a third bake; this check says when that changes.
const far = await page.evaluate(() => { const out = []; const t = WORLD.siteAnywhere('dunmore'); forceTime(12);
  for (const yw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { px = t.x + 3; pz = t.z + 3; yaw = yw; pitch = -.05; CAM.position.set(px, WORLD.worldH(px, pz) + 1.6, pz); CAM.rotation.order = 'YXZ'; CAM.rotation.set(pitch, yaw, 0); CAM.updateMatrixWorld(true);
    tickPeople(1 / 60, 9e5); const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(CAM.projectionMatrix, CAM.matrixWorldInverse)); let n = 0, tris = 0, near = 0;
    for (const x of PEOPLE_RIGS) { if (x.root.parent !== WORLD.scene || !x.root.visible) continue; const p = new THREE.Vector3(); x.root.getWorldPosition(p); if (!fr.containsPoint(p)) continue; const d = p.distanceTo(CAM.position); if (d < 40) { near++; continue; } n++; tris += x.mesh.geometry === x.geoLo ? x.trisLo : x.tris; }
    REN.info.autoReset = false; REN.info.reset(); REN.render(scene, CAM); const all = REN.info.render.triangles; REN.info.autoReset = true; out.push({ near, far: n, farTris: tris, all, share: +(tris / all).toFixed(3) }); }
  return out; });
check('townsfolk past 40 units are under a tenth of the frame\'s triangles in every direction from the town\'s centre (no third tier needed)', far.every(v => v.share < .1) && far.some(v => v.far > 0), far);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
