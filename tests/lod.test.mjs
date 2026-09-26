// Level of detail for townsfolk (Session 156): a distant copy of every person on the same skeleton,
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
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
