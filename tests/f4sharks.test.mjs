// Card F4 (Session 1529): on the new look the Shark wears the creature kit's reef shark (Session 1528's plan), posed by the kit's own
// swim gait (HC.pose) at the old tail's beat, since the game's shark has no skeleton to copy. One shark held in the air ahead of you
// in the open world: its genome keyed by its foe id (`shark:<id>`); the old body's length, nose to nose, on its axis; three levels by
// distance (the hide, fins and eyes near; without the eyes at 25 m; the old body far); a swim that moves the kit's bones, faster
// hunting; the tell's glow on its hide; and killed, a corpse darkened with its shaders kept and its wave stilled.
// Pictures: docs/prototypes/f4/f4-shark.jpg (from 13 m) and f4-shark-near.jpg.
// Session 1536: the whales too (the kit's Storm Whale), below the shark's checks; f4-whale.jpg. Session 1537: the bow-wave dolphins (the Stormswift); f4-dolphin.jpg.
// Session 1599: the shallows' fish schools, the kit's herring baked and instanced; f4-herring.jpg.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const made = await page.evaluate(() => { forceTime(12);
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  const sc = WORLD.scene, mk = (x, z, key) => { const e = keyFoe(buildZoneEnemy(sc, [], x, z, 'Shark', null), key), y = WORLD.worldH(x, z) + 40; e.mesh.position.set(x, y, z); e.mesh.rotation.y = 0; e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) sc.add(e.mesh); ZONES.world.enemies.push(e); return e; };
  window._S = mk(px + 20, pz, 'f4shark:0'); window._O = mk(px + 20, pz + 6, 'f4shark:1'); window._O.dead = true; /* a dead one is never dressed */
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const rig = () => [...HC_RIGS].find(r => r.e === _S); let k = 0; HBODY.last = -1e9; const n0 = HC_BODY.n;
  while (!(rig() && rig().hc) && k++ < 200) tickCreatures(1 / 60, 2e5 + k * (HBODY.gap + 1));
  const R = rig(); window._R = R; if (!R || !R.hc) return { k, rig: !!R, fail: R && R.hcFail };
  return { k, bodies: HC_BODY.n - n0, plan: R.hc.C.g.plan, seed: R.hc.C.g.seed, want: HC.hashKey('shark:' + _S.id), bones: R.hc.C.bones.length, tris: R.hc.C.stats.tris, f: +R.hc.f.toFixed(3),
    other: [...HC_RIGS].some(r => r.e === _O && r.hc) }; });
console.log('  built:', JSON.stringify(made));
check(`the Shark wears the kit's reef shark (${made.bones} bones, ${made.tris} tris), keyed by its foe id`, made.plan === 'reefshark' && made.seed === made.want && made.bones === 19, made);
check('a shark already dead gets no kit body', made.plan && !made.other, made);

// its size: the kit body's extent along the axis at rest is the old body's (mid-stroke the tail's bend takes up to a tenth), nose to nose, on the old body's axis
const size = await page.evaluate(() => { const m = _S.mesh, R = _R; m.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(m.matrixWorld).invert(), box = (root, skin) => { const b = new THREE.Box3(), v = new THREE.Vector3();
  root.traverse(o => { if (!o.isMesh) return; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 7) { v.fromBufferAttribute(p, i); if (skin && o.isSkinnedMesh) o.applyBoneTransform(i, v); else v.applyMatrix4(o.matrixWorld); v.applyMatrix4(inv); /* the bone transform (bind the identity) gives the world point */ b.expandByPoint(v); } }); return b; };
  R.hc.C.skel.update(); const k = box(R.hc.W, true), o = box(R.mesh, false), r = b => [b.min.z, b.max.z, b.max.x - b.min.x].map(v => +v.toFixed(2));
  const sp = m.worldToLocal(R.hc.C.byName.spine0.getWorldPosition(new THREE.Vector3())); return { kit: r(k), old: r(o), axis: +sp.y.toFixed(2) }; });
check(`it is the old body's length at rest, ${(size.kit[1] - size.kit[0]).toFixed(2)} m mid-stroke against ${(size.old[1] - size.old[0]).toFixed(2)}; its nose within 12 cm of the old nose, its spine on the old axis (y ${size.axis})`,
  (size.kit[1] - size.kit[0]) / (size.old[1] - size.old[0]) > .88 && (size.kit[1] - size.kit[0]) < (size.old[1] - size.old[0]) + .1 && Math.abs(size.kit[1] - size.old[1]) < .12 && Math.abs(size.axis - .24) < .1, size);

// the levels
const lv = await page.evaluate(() => { const m = _S.mesh, R = _R, at = (dd, k) => { CAM.position.set(m.position.x - dd, m.position.y, m.position.z); CAM.updateMatrixWorld(true); for (let i = 0; i < 3; i++) tickCreatures(1 / 60, 3e5 + k * 100 + i * 17);
  let n = 0; if (R.hc.W.visible) R.hc.W.traverse(o => { if (o.isMesh && o.visible) n++; }); return { L: R.hc.L, kit: n, old: R.mesh.visible }; };
  return { near: at(6, 1), mid: at(25, 2), far: at(60, 3), back: at(6, 4) }; });
check(`three levels: near the kit's ${lv.near.kit} meshes, at 25 m ${lv.mid.kit}, at 60 m the old body`, lv.near.L === 0 && !lv.near.old && lv.near.kit >= 3 && lv.mid.L === 1 && !lv.mid.old && lv.mid.kit < lv.near.kit && lv.far.L === 2 && lv.far.old && lv.back.L === 0, lv);

// a swim: the bones turn, and the wave beats at the old tail's 3.4 rad a second cruising, 7 hunting
const swim = await page.evaluate(async () => { const R = _R, mats = () => Array.from(R.hc.C.skel.boneMatrices), run = async (alert) => { _S.alert = alert; const p0 = R.ph, a = mats(); for (let i = 0; i < 8; i++) { R.t = performance.now() / 1000 - 1 / 30; tickCreatures(1 / 60, 4e5 + i * 17); R.hc.C.skel.update(); }
  const b = mats(); let mv = 0; for (let i = 0; i < a.length; i++) mv = Math.max(mv, Math.abs(a[i] - b[i])); return { mv: +mv.toFixed(3), dph: R.ph - p0, ms: 0 }; };
  const c = await run(false), h = await run(true); _S.alert = false; /* each tick a 30th of a second, so the beat is the phase over 8/30 s */
  return { cruise: c.mv, hunt: h.mv, rc: +(c.dph * 30 / 8).toFixed(2), rh: +(h.dph * 30 / 8).toFixed(2) }; });
check(`a swim turns the kit's bones (${swim.cruise} cruising), its wave ${swim.rc} beats a second cruising and ${swim.rh} hunting`, swim.cruise > .01 && swim.hunt > .01 && Math.abs(swim.rc - 3.4 / 6.283) < .06 && Math.abs(swim.rh - 7 / 6.283) < .1, swim);

// the tell's glow
const glow = await page.evaluate(() => { const lit = () => _R.hc.hide.filter(o => o.material.emissive && o.material.emissive.getHex() !== 0).length;
  telegraphPulse(_S, 1); tickCreatures(1 / 60, 6e5); const on = lit(); telegraphReset(_S); tickCreatures(1 / 60, 6e5 + 17); return { on, all: _R.hc.hide.length, off: lit() }; });
check('the tell\'s glow lights the kit\'s hide and goes out with it', glow.on === glow.all && glow.on > 0 && glow.off === 0, glow);

// the pictures, the fog off
const shots = await page.evaluate(() => { const sc = WORLD.scene, m = _S.mesh, x = m.position.x, y = m.position.y, z = m.position.z; _R.ph = .2; HC.pose(_R.hc.C, .2);
  CAM.position.set(x - 6, y, z); CAM.updateMatrixWorld(true); tickCreatures(1 / 60, 8e5); _R.ph = .2; HC.pose(_R.hc.C, .2);
  const cv = REN.domElement, cam = new THREE.PerspectiveCamera(40, cv.width / cv.height, .1, 300), out = [];
  for (const [cx, cy, cz, lz] of [[13, 1.5, 3, 3], [4.2, 1.2, 2.6, 0]]) { cam.position.set(x + cx, y + cy, z + cz); cam.lookAt(x, y + .2, z + lz); sc.updateMatrixWorld(true); const f = sc.fog; sc.fog = null; REN.render(sc, cam); sc.fog = f;
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); out.push(o.toDataURL('image/jpeg', .85)); } return out; });
for (const [i, n] of [[0, 'f4-shark.jpg'], [1, 'f4-shark-near.jpg']]) fs.writeFileSync(path.join(OUT, n), Buffer.from(shots[i].split(',')[1], 'base64'));

const dead = await page.evaluate(() => { const R = _R, before = []; R.hc.W.traverse(o => { if (o.isMesh) before.push([o, o.material]); });
  _S.hp = 0; killZoneEnemy(_S, WORLD.scene, ''); const a = Array.from(R.hc.C.skel.boneMatrices); for (let i = 0; i < 20; i++) tickCreatures(1 / 60, 7e5 + i * 16.7); R.hc.C.skel.update();
  const b = Array.from(R.hc.C.skel.boneMatrices); let mv = 0; for (let i = 0; i < a.length; i++) mv = Math.max(mv, Math.abs(a[i] - b[i]));
  const shaded = before.filter(([o, m]) => m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile);
  return { n: before.length, cloned: before.filter(([o, m]) => o.material !== m).length, shaded: shaded.length, kept: shaded.filter(([o, m]) => o.material.onBeforeCompile === m.onBeforeCompile).length,
    darker: before.filter(([o, m]) => o.material !== m && o.material.color && o.material.color.r <= m.color.r * .36 + 1e-6).length, still: +mv.toFixed(4), hc: !!R.hc }; });
check('killed, the kit\'s body is darkened with its shaders kept, and its wave stops', dead.hc && dead.cloned === dead.n && dead.darker === dead.n && dead.kept === dead.shaded && dead.still < 1e-3, dead);
// Session 1536: the whales at sea (spawnWhale, peaceful) wear the kit's Storm Whale by the same path: the old mesh put in a group in its
// place, which tickWhales moves and removes; the fluke's slow beat; levels and build reach five times the shark's
const wh = await page.evaluate(() => { const y0 = worldH(px, pz) + 30, w = spawnWhale(px + 60, pz + 30), old = w.m; window._W = w; w.m.position.set(w.x, y0, w.z); w.m.rotation.set(0, 0, 0);
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const rig = () => [...HC_RIGS].find(r => r.w === w); let k = 0; HBODY.last = -1e9;
  while (!(rig() && rig().hc) && k++ < 300) tickCreatures(1 / 60, 1e6 + k * (HBODY.gap + 1));
  const R = rig(); window._RW = R; if (!R || !R.hc) return { k, rig: !!R, fail: R && R.hcFail };
  return { k, wrapped: w.m !== old && w.m.parent === WORLD.scene && old.parent === w.m && R.mesh === old, plan: R.hc.C.g.plan, bones: R.hc.C.bones.length, tris: R.hc.C.stats.tris, key: R.hcKey }; });
console.log('  whale:', JSON.stringify(wh));
check(`a whale wears the kit's Storm Whale (${wh.bones} bones, ${wh.tris} tris), its old mesh kept in a group in its place`, wh.plan === 'stormwhale' && wh.bones === 19 && wh.wrapped && /^whale:\d+$/.test(wh.key), wh);
const wsz = await page.evaluate(() => { const m = _W.m, R = _RW; m.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(m.matrixWorld).invert(), box = (root, skin) => { const b = new THREE.Box3(), v = new THREE.Vector3();
  root.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 7) { v.fromBufferAttribute(p, i); if (skin && o.isSkinnedMesh) o.applyBoneTransform(i, v); else v.applyMatrix4(o.matrixWorld); v.applyMatrix4(inv); b.expandByPoint(v); } }); return b; };
  HC.pose(R.hc.C, 0); R.hc.C.root.updateMatrixWorld(true); R.hc.C.skel.update(); const k = box(R.hc.W, true), o = box(R.mesh, false), r = b => [b.min.z, b.max.z].map(v => +v.toFixed(2));
  const sp = m.worldToLocal(R.hc.C.byName.spine0.getWorldPosition(new THREE.Vector3())); return { kit: r(k), old: r(o), axis: +sp.y.toFixed(2) }; });
check(`it is the old whale's length, ${(wsz.kit[1] - wsz.kit[0]).toFixed(1)} m against ${(wsz.old[1] - wsz.old[0]).toFixed(1)}, nose to nose, on its axis (y ${wsz.axis})`,
  (wsz.kit[1] - wsz.kit[0]) / (wsz.old[1] - wsz.old[0]) > .85 && (wsz.kit[1] - wsz.kit[0]) < (wsz.old[1] - wsz.old[0]) + .3 && Math.abs(wsz.kit[1] - wsz.old[1]) < .3 && Math.abs(wsz.axis) < .3, wsz);
const wlv = await page.evaluate(() => { const m = _W.m, R = _RW, at = (dd, k) => { CAM.position.set(m.position.x - dd, m.position.y, m.position.z); CAM.updateMatrixWorld(true); for (let i = 0; i < 3; i++) tickCreatures(1 / 60, 2e6 + k * 100 + i * 17);
  let n = 0; if (R.hc.W.visible) R.hc.W.traverse(o => { if (o.isMesh && o.visible) n++; }); return { L: R.hc.L, kit: n, old: R.mesh.visible }; };
  return { near: at(30, 1), mid: at(120, 2), far: at(300, 3), back: at(30, 4) }; });
check(`a whale's levels: near the kit's ${wlv.near.kit} meshes at 30 m, ${wlv.mid.kit} at 120 m, the old mesh at 300 m`, wlv.near.L === 0 && !wlv.near.old && wlv.mid.L === 1 && !wlv.mid.old && wlv.mid.kit <= wlv.near.kit && wlv.far.L === 2 && wlv.far.old && wlv.back.L === 0, wlv);
const wsw = await page.evaluate(() => { const R = _RW, a = Array.from(R.hc.C.skel.boneMatrices), p0 = R.ph; for (let i = 0; i < 8; i++) { R.t = performance.now() / 1000 - 1 / 30; tickCreatures(1 / 60, 3e6 + i * 17); R.hc.C.skel.update(); }
  const b = Array.from(R.hc.C.skel.boneMatrices); let mv = 0; for (let i = 0; i < a.length; i++) mv = Math.max(mv, Math.abs(a[i] - b[i]));
  /* tickWhales moves the group, and the kit's body with it */
  const w = _W, k0 = R.hc.W.getWorldPosition(new THREE.Vector3()); w.x += 5; tickWhales(1 / 60, 1e5); w.m.updateMatrixWorld(true); const k1 = R.hc.W.getWorldPosition(new THREE.Vector3());
  return { mv: +mv.toFixed(3), rate: +((R.ph - p0) * 30 / 8).toFixed(3), moved: +Math.hypot(k1.x - k0.x, k1.z - k0.z).toFixed(2), grp: Math.hypot(w.m.position.x - w.x, w.m.position.z - w.z) < 1e-6 }; });
check(`a whale's fluke beats ${wsw.rate} strokes a second and turns the bones (${wsw.mv}); tickWhales carries the kit's body (${wsw.moved} m)`, wsw.mv > .005 && Math.abs(wsw.rate - 1.6 / 6.283) < .03 && wsw.moved > 4 && wsw.grp, wsw);
{ const shot = await page.evaluate(() => { const sc = WORLD.scene, w = _W, m = w.m; w.m.position.set(w.x, worldH(px, pz) + 30, w.z); w.m.rotation.set(0, 0, 0); _RW.ph = .15; HC.pose(_RW.hc.C, .15);
    CAM.position.set(m.position.x - 30, m.position.y, m.position.z); CAM.updateMatrixWorld(true); tickCreatures(1 / 60, 4e6); _RW.ph = .15; HC.pose(_RW.hc.C, .15);
    const cv = REN.domElement, cam = new THREE.PerspectiveCamera(40, cv.width / cv.height, .1, 400); cam.position.set(m.position.x + 26, m.position.y + 5, m.position.z + 6); cam.lookAt(m.position.x, m.position.y, m.position.z + 1);
    sc.updateMatrixWorld(true); const f = sc.fog; sc.fog = null; REN.render(sc, cam); sc.fog = f; const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL('image/jpeg', .85); });
  fs.writeFileSync(path.join(OUT, 'f4-whale.jpg'), Buffer.from(shot.split(',')[1], 'base64')); }
await page.evaluate(() => { WORLD.scene.remove(_W.m); WHALES.splice(WHALES.indexOf(_W), 1); tickCreatures(1 / 60, 5e6); });
check('a whale removed from the sea drops its kit body', await page.evaluate(() => !_RW.hc && ![...HC_RIGS].includes(_RW)));

// Session 1537: a bow-wave dolphin (LIFE.dolphins, made here as tickDolphins makes one, since the suite does not sail) wears the kit's Stormswift
const dol = await page.evaluate(() => { const sc = WORLD.scene, m = new THREE.Mesh(mergeParts([{ geo: new THREE.CylinderGeometry(.16, .06, 1.5, 6), color: new THREE.Color(0x6a7a8a), rx: Math.PI / 2, jitter: .05 }, { geo: new THREE.ConeGeometry(.12, .35, 3), color: new THREE.Color(0x5a6a7a), y: .18, z: .1, rx: -.6 }]), VC_MAT);
  sc.add(m); const d = { m, ph: 0, side: 1 }; LIFE.dolphins.push(d); window._D = d; m.position.set(px + 8, worldH(px, pz) + 20, pz - 8); const old = m;
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const rig = () => [...HC_RIGS].find(r => r.w === d); let k = 0; HBODY.last = -1e9;
  while (!(rig() && rig().hc) && k++ < 300) tickCreatures(1 / 60, 6e6 + k * (HBODY.gap + 1));
  const R = rig(); window._RD = R; if (!R || !R.hc) return { k, rig: !!R, fail: R && R.hcFail };
  const g = d.m; g.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), box = (root, skin) => { const b = new THREE.Box3(), v = new THREE.Vector3();
    root.traverse(o => { if (!o.isMesh) return; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 5) { v.fromBufferAttribute(p, i); if (skin && o.isSkinnedMesh) o.applyBoneTransform(i, v); else v.applyMatrix4(o.matrixWorld); v.applyMatrix4(inv); b.expandByPoint(v); } }); return b; };
  HC.pose(R.hc.C, 0); R.hc.C.root.updateMatrixWorld(true); R.hc.C.skel.update(); const kb = box(R.hc.W, true), ob = box(R.mesh, false);
  const a = Array.from(R.hc.C.skel.boneMatrices), p0 = R.ph; for (let i = 0; i < 8; i++) { R.t = performance.now() / 1000 - 1 / 30; tickCreatures(1 / 60, 7e6 + i * 17); R.hc.C.skel.update(); }
  const b = Array.from(R.hc.C.skel.boneMatrices); let mv = 0; for (let i = 0; i < a.length; i++) mv = Math.max(mv, Math.abs(a[i] - b[i]));
  return { wrapped: g !== old && old.parent === g && g.parent === sc, plan: R.hc.C.g.plan, bones: R.hc.C.bones.length, tris: R.hc.C.stats.tris, key: R.hcKey, kit: [kb.min.z, kb.max.z].map(v => +v.toFixed(2)), old: [ob.min.z, ob.max.z].map(v => +v.toFixed(2)), mv: +mv.toFixed(3), rate: +((R.ph - p0) * 30 / 8).toFixed(2), L: R.hc.L }; });
console.log('  dolphin:', JSON.stringify(dol));
check(`a bow-wave dolphin wears the kit's Stormswift (${dol.bones} bones, ${dol.tris} tris), ${dol.kit && (dol.kit[1] - dol.kit[0]).toFixed(2)} m against the old ${dol.old && (dol.old[1] - dol.old[0]).toFixed(2)}, nose to nose`,
  dol.plan === 'stormswift' && dol.wrapped && /^dolphin:\d+$/.test(dol.key) && (dol.kit[1] - dol.kit[0]) / (dol.old[1] - dol.old[0]) > .85 && Math.abs(dol.kit[1] - dol.old[1]) < .05, dol);
check(`its fluke beats ${dol.rate} strokes a second and turns the bones (${dol.mv})`, dol.mv > .01 && Math.abs(dol.rate - 9 / 6.283) < .06, dol);
{ const shot = await page.evaluate(() => { const sc = WORLD.scene, m = _D.m; m.visible = true; /* the page's own loop runs tickDolphins between evaluates, which hides them while the ship is not sailing */ _RD.ph = .2; HC.pose(_RD.hc.C, .2); m.rotation.set(-.3, 0, 0); m.updateMatrixWorld(true);
    const cv = REN.domElement, cam = new THREE.PerspectiveCamera(40, cv.width / cv.height, .05, 200); cam.position.set(m.position.x + 2.6, m.position.y + .5, m.position.z + .4); cam.lookAt(m.position.x, m.position.y, m.position.z);
    sc.updateMatrixWorld(true); const f = sc.fog; sc.fog = null; REN.render(sc, cam); sc.fog = f; const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL('image/jpeg', .85); });
  fs.writeFileSync(path.join(OUT, 'f4-dolphin.jpg'), Buffer.from(shot.split(',')[1], 'base64')); }
const dh = await page.evaluate(() => { _D.m.visible = false; const p0 = _RD.ph; _RD.t = performance.now() / 1000 - .1; tickCreatures(1 / 60, 8e6); const still = _RD.ph === p0; _D.m.visible = true; _RD.t = performance.now() / 1000 - .1; tickCreatures(1 / 60, 8e6 + 17);
  const on = _RD.ph !== p0; WORLD.scene.remove(_D.m); LIFE.dolphins.splice(LIFE.dolphins.indexOf(_D), 1); tickCreatures(1 / 60, 8e6 + 34); return { still, on, dropped: !_RD.hc && ![...HC_RIGS].includes(_RD) }; });
check('hidden (the ship slowed) a dolphin is not posed, shown it swims again, and removed its body is dropped', dh.still && dh.on && dh.dropped, dh);

// Session 1595: a port's four gulls (spawnGulls, made here over a group of our own as a port's is) wear the kit's `gull`, each in its own
// place among the group's children (tickGulls moves them by it), its head where the old cone's broad end was (the old mesh's −z)
const gul = await page.evaluate(() => { const sc = WORLD.scene, holder = new THREE.Group(); sc.add(holder); const S = { group: holder };
  spawnGulls(S, { x: px + 6, z: pz - 6 }); holder.position.y = worldH(px + 6, pz - 6); window._GS = S; const gl = S.gulls, olds = [...gl.g.children];
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true); HBODY.last = -1e9;
  const rigs = () => [...HC_RIGS].filter(r => r.name === 'Gull' && r.w && olds.includes(r.mesh)); let k = 0;
  while (!(rigs().length === 4 && rigs().every(r => r.hc)) && k++ < 1200) tickCreatures(1 / 60, 1e7 + k * (HBODY.gap + 1));
  const R = rigs(); window._RG = R; if (R.length < 4 || !R.every(r => r.hc)) return { k, n: R.length, built: R.filter(r => r.hc).length, fail: R.some(r => r.hcFail) };
  const order = gl.g.children.every((c, i) => c.children[0] === olds[i]);
  const r0 = R.find(r => r.mesh === olds[0]), g = r0.mesh.parent; g.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), v = new THREE.Vector3();
  const box = (root, skin) => { const b = new THREE.Box3(); root.traverse(o => { if (!o.isMesh) return; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 5) { v.fromBufferAttribute(p, i); if (skin && o.isSkinnedMesh) o.applyBoneTransform(i, v); else v.applyMatrix4(o.matrixWorld); v.applyMatrix4(inv); b.expandByPoint(v); } }); return b; };
  HC.pose(r0.hc.C, 0); r0.hc.C.root.updateMatrixWorld(true); r0.hc.C.skel.update(); const kb = box(r0.hc.W, true), ob = box(r0.mesh, false);
  const head = r0.hc.C.byName.head.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
  const a = Array.from(r0.hc.C.skel.boneMatrices); for (let i = 0; i < 8; i++) { r0.t = performance.now() / 1000 - 1 / 30; tickCreatures(1 / 60, 2e7 + i * 17); r0.hc.C.skel.update(); }
  const b = Array.from(r0.hc.C.skel.boneMatrices); let mv = 0; for (let i = 0; i < a.length; i++) mv = Math.max(mv, Math.abs(a[i] - b[i]));
  return { k, order, plan: r0.hc.C.g.plan, bones: r0.hc.C.bones.length, tris: r0.hc.C.stats.tris, keys: R.map(r => r.hcKey), kit: [kb.min.z, kb.max.z].map(x => +x.toFixed(2)), old: [ob.min.z, ob.max.z].map(x => +x.toFixed(2)), head: +head.z.toFixed(2), mv: +mv.toFixed(3), L: r0.hc.L }; });
console.log('  gulls:', JSON.stringify(gul));
check(`a port's four gulls wear the kit's gull (${gul.bones} bones, ${gul.tris} tris), ${gul.kit && (gul.kit[1] - gul.kit[0]).toFixed(2)} m against the old ${gul.old && (gul.old[1] - gul.old[0]).toFixed(2)}, each in its own place among the group's children, the head forward of the old cone's point, the wings beating`,
  /gull$/i.test(gul.plan) && gul.order && gul.keys.every(k => /^gull:\d+$/.test(k)) && new Set(gul.keys).size === 4 && (gul.kit[1] - gul.kit[0]) / (gul.old[1] - gul.old[0]) > .8 && gul.head < -.1 && gul.mv > .01, gul);
{ const shot = await page.evaluate(() => { const sc = WORLD.scene, r = _RG[0], g = r.mesh.parent, w = g.getWorldPosition(new THREE.Vector3()); r.ph = .3; HC.pose(r.hc.C, .3); sc.updateMatrixWorld(true);
    const cv = REN.domElement, cam = new THREE.PerspectiveCamera(40, cv.width / cv.height, .05, 200); cam.position.set(w.x + 1.3, w.y + 1.1, w.z + 1.5); cam.lookAt(w);
    const f = sc.fog; sc.fog = null; REN.render(sc, cam); sc.fog = f; const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL('image/jpeg', .85); });
  fs.writeFileSync(path.join(OUT, 'f4-gull.jpg'), Buffer.from(shot.split(',')[1], 'base64')); }
const gh = await page.evaluate(() => { const r = _RG[0], S = _GS; S.group.visible = false; const p0 = r.ph; r.t = performance.now() / 1000 - .1; tickCreatures(1 / 60, 3e7); const still = r.ph === p0; S.group.visible = true; r.t = performance.now() / 1000 - .1; tickCreatures(1 / 60, 3e7 + 17);
  const on = r.ph !== p0; WORLD.scene.remove(S.group); tickCreatures(1 / 60, 3e7 + 34); return { still, on, dropped: _RG.every(x => !x.hc && ![...HC_RIGS].includes(x)) }; });
check('the port hidden its gulls are not posed, shown they fly again, and the port unloaded their bodies are dropped', gh.still && gh.on && gh.dropped, gh);

// Session 1599: the shallows' fish schools (spawnFishSchool's InstancedMesh of cones, made here as it makes one, in the air ahead of you)
// draw the kit's herring baked into one geometry, instanced, within HC_SCHOOL.near of the eye, its head to −x so tickFish's turn points it
// along its circle; past it, and once its chunk drops it, the old cone again
const fish = await page.evaluate(() => { const sc = WORLD.scene, x = px + 8, z = pz + 3, n = 12, geo = new THREE.ConeGeometry(.08, .42, 4); geo.rotateX(Math.PI / 2);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0x9ab8c0 }), n); sc.add(im);
  const S = { im, cx: x, cz: z, y: worldH(x, z) + 2.4, r: 1.4, ph: 0, n, chunk: 'test' }; LIFE.fish.push(S); window._FS = S;
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true); HBODY.last = -1e9; let k = 0;
  while (im.geometry === geo && k++ < 400) tickCreatures(1 / 60, 4e7 + k * (HBODY.gap + 1));
  const G = im.geometry; if (G === geo) return { k, kit: false };
  G.computeBoundingBox(); const b = G.boundingBox, c = G.attributes.color, p = G.attributes.position; let ex = 0, en = 0;
  for (let i = 0; i < c.count; i++) if (c.getX(i) + c.getY(i) + c.getZ(i) < .3) { ex += p.getX(i); en++; } /* the eye's dark */
  WORLD.tick(1 / 60); REN.compile(sc, CAM); const prog = (REN.info.programs || []).some(q => /hcschool/.test(q.cacheKey));
  const shared = G === HC_SCHOOL.geo && im.material === HC_SCHOOL.mat;
  CAM.position.set(x + 60, CAM.position.y, z); tickCreatures(1 / 60, 4.1e7); const far = im.geometry === geo;
  CAM.position.set(px, CAM.position.y, pz); tickCreatures(1 / 60, 4.2e7); const back = im.geometry === G;
  return { k, kit: true, shared, tris: HC_SCHOOL.tris, ms: +HC_SCHOOL.ms.toFixed(0), len: +(b.max.x - b.min.x).toFixed(3), deep: +(b.max.y - b.min.y).toFixed(3), wide: +(b.max.z - b.min.z).toFixed(3), eye: en ? +(ex / en).toFixed(3) : null, prog, far, back }; });
console.log('  fish:', JSON.stringify(fish));
check(`a fish school near the eye draws the kit's herring (${fish.tris} tris a fish, baked in ${fish.ms} ms) instanced, ${fish.len} m long as the old cone, deeper than wide, its eye to −x, its swim compiled`,
  fish.kit && fish.shared && fish.tris > 300 && fish.tris < 2500 && Math.abs(fish.len - .42) < .005 && fish.deep > fish.wide && fish.eye < -.1 && fish.prog, fish);
check(`past 35 m the school draws the old cones again, and near the herring`, fish.far && fish.back, fish);
{ const shot = await page.evaluate(() => { const sc = WORLD.scene, S = _FS, w = new THREE.Vector3(S.cx, S.y, S.cz); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60); sc.updateMatrixWorld(true);
    const cv = REN.domElement, cam = new THREE.PerspectiveCamera(40, cv.width / cv.height, .05, 200); cam.position.set(w.x + 2.2, w.y + 2.0, w.z + 2.6); cam.lookAt(w);
    const f = sc.fog; sc.fog = null; REN.render(sc, cam); sc.fog = f; const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL('image/jpeg', .85); });
  fs.writeFileSync(path.join(OUT, 'f4-herring.jpg'), Buffer.from(shot.split(',')[1], 'base64')); }
check('its chunk dropped, the school has its own cone back (the shared herring is never disposed with it)', await page.evaluate(() => { const S = _FS, G = S.im.geometry; hcSchoolDrop(S); LIFE.fish.splice(LIFE.fish.indexOf(S), 1); WORLD.scene.remove(S.im);
  return G === HC_SCHOOL.geo && S.im.geometry !== HC_SCHOOL.geo && S.im.geometry.type === 'ConeGeometry'; }));

await page.evaluate(() => { for (const e of [_S, _O]) { ZONES.world.enemies.splice(ZONES.world.enemies.indexOf(e), 1); WORLD.scene.remove(e.mesh); } tickCreatures(1 / 60, 9e5); REN.render(scene, CAM); });
check('removed, the kit body is dropped', await page.evaluate(() => !_R.hc && ![...HC_RIGS].includes(_R)));
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
