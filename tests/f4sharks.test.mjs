// Card F4 (Session 1529): on the new look the Shark wears the creature kit's reef shark (Session 1528's plan), posed by the kit's own
// swim gait (HC.pose) at the old tail's beat, since the game's shark has no skeleton to copy. One shark held in the air ahead of you
// in the open world: its genome keyed by its foe id (`shark:<id>`); the old body's length, nose to nose, on its axis; three levels by
// distance (the hide, fins and eyes near; without the eyes at 25 m; the old body far); a swim that moves the kit's bones, faster
// hunting; the tell's glow on its hide; and killed, a corpse darkened with its shaders kept and its wave stilled.
// Pictures: docs/prototypes/f4/f4-shark.jpg (from 13 m) and f4-shark-near.jpg.
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
await page.evaluate(() => { for (const e of [_S, _O]) { ZONES.world.enemies.splice(ZONES.world.enemies.indexOf(e), 1); WORLD.scene.remove(e.mesh); } tickCreatures(1 / 60, 9e5); REN.render(scene, CAM); });
check('removed, the kit body is dropped', await page.evaluate(() => !_R.hc && ![...HC_RIGS].includes(_R)));
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
