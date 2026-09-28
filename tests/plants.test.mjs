// Plants sized by what they are (Session 167): every herb bakes as the plant it is, the world instances that bake,
// a picked bush or sapling stays (bare of what was taken) and grows it back, and the tall kinds cast shadows.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

// every herb with a kind bakes; its height is what it is
const kinds = await page.evaluate(() => { const out = {};
  for (const k in PLANT_KIND) { const geo = plantGeo(k, false); const bb = geo.boundingBox; const pg = plantGeo(k, true);
    out[k] = { kind: PLANT_KIND[k], h: +bb.max.y.toFixed(2), w: +Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z).toFixed(2), tris: geo.attributes.position.count / 3, picked: pg ? pg.attributes.position.count / 3 : null, stub: !!(pg && pg.userData.stub), stubTop: pg && pg.userData.stub ? +pg.boundingSphere.radius.toFixed(2) : null }; }
  out._missing = Object.keys(HERB_DEF).filter(k => !PLANT_KIND[k]); return out; });
const K = Object.fromEntries(Object.entries(kinds).filter(([k]) => k !== '_missing'));
check('all 23 land herbs bake as plants (only the sea\'s keep the old tuft)', Object.keys(K).length === 23 && kinds._missing.every(k => /kelp|lily|pearl/.test(k)), { n: Object.keys(K).length, missing: kinds._missing });
check('sizes follow what they are: mosses and the rosette hug the ground, goldenrod and the rowan are waist-high, the bush wider than tall',
  K.graywort.h < .07 && K.firemoss.h < .1 && K.goldenrod.h > .7 && K.caorthann.h > .7 && K.thornberry.w > K.thornberry.h && K.thornberry.h > .4 && K.muirfhear.h > .45,
  Object.fromEntries(Object.entries(K).map(([k, v]) => [k, [v.h, v.w]])));
check('a plant is 100–2,500 triangles', Object.values(K).every(v => v.tris >= 100 && v.tris <= 2500), Object.fromEntries(Object.entries(K).map(([k, v]) => [k, v.tris])));
const stays = Object.entries(K).filter(([, v]) => v.picked != null && !v.stub);
check('the bushes, the sapling, the shrub, the bramble and the stump keep a picked copy, smaller than the whole; nothing else keeps a bare plant',
  stays.map(([k]) => k).sort().join() === ['ashwort', 'briarweed', 'caordubh', 'caorthann', 'fearnog', 'thornberry'].join() && stays.every(([, v]) => v.picked < v.tris && v.picked > v.tris * .2),
  Object.fromEntries(stays.map(([k, v]) => [k, [v.tris, v.picked]])));
const same = await page.evaluate(() => { const a = plantGeo('thornberry', false), b = plantGeo('thornberry', true); const pa = a.attributes.position.array, pb = b.attributes.position.array;
  // the picked bush's first vertices (the stems and leaf blobs, which come before the berries) are the whole bush's
  let d = 0; for (let i = 0; i < pb.length; i++) d = Math.max(d, Math.abs(pa[i] - pb[i])); return { maxDiff: d, same: plantGeo('thornberry', false) === a }; });
// Session 263 (Michael's A on Session 237): every other kind leaves a stub on turned earth, well under the whole plant
const stubs = Object.entries(K).filter(([, v]) => v.stub);
check('the other 17 kinds each leave a stub on turned earth, smaller than the whole plant', stubs.length === 17 && stubs.every(([, v]) => v.picked < v.tris + 200 && v.picked > 20),
  Object.fromEntries(stubs.map(([k, v]) => [k, [v.tris, v.picked]])));
check('the picked bush is the same bush without its berries (and each bake is made once)', same.maxDiff < 1e-6 && same.same, same);

// the open world: find a herb that stays when picked among the loaded chunks, walking out until one turns up
const found = await page.evaluate(async () => { const want = h => h.inst && h.instP && !h.harvested && PLANT_STAYS.has(PLANT_KIND[h.type]);
  const x0 = px, z0 = pz; let h = ZONES.world.herbs.find(want), tries = 0;
  for (let r = 1; !h && r < 14; r++) { const a = r * 2.4; px = x0 + Math.cos(a) * r * 60; pz = z0 + Math.sin(a) * r * 60; for (let i = 0; i < 40; i++) WORLD.tick(1 / 60, performance.now()); await new Promise(res => setTimeout(res, 300)); h = ZONES.world.herbs.find(want); tries = r; }
  if (!h) return { none: true, types: [...new Set(ZONES.world.herbs.map(h => h.type))] };
  window._H = h; px = h.x + 1.2; pz = h.z; for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now());
  const inst = ZONES.world.herbs.filter(x => x.inst); const kinds = new Set(inst.map(x => x.type));
  return { type: h.type, tries, loaded: inst.length, kinds: kinds.size, geoIsPlant: h.inst.geometry === plantGeo(h.type, false), pickedGeo: h.instP.geometry === plantGeo(h.type, true), shadowTall: h.inst.castShadow, meshes: WORLD.herbLod.list.length };
});
check('the world instances the plants\' own bakes; a picked copy sits beside each bush or sapling', !found.none && found.geoIsPlant && found.pickedGeo, found);

const scaleAt = () => page.evaluate(() => { const h = _H, m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  h.inst.getMatrixAt(h.idx, m); m.decompose(p, q, s); const a = s.x; h.instP.getMatrixAt(h.idx, m); m.decompose(p, q, s); return { whole: +a.toFixed(3), picked: +s.x.toFixed(3) }; });
const before = await scaleAt();
await page.evaluate(() => { harvestHerb(_H); }); await g.spin(null, 45);
const after = await scaleAt(); const bag = await page.evaluate(() => BAG.some(it => it._typeKey === _H.type));
await page.evaluate(() => { _H.harvested = false; _H.g.visible = true; }); await g.spin(null, 45);
const regrown = await scaleAt();
check('picking it leaves the bare plant standing (and the herb in the bag); when it grows back the whole plant returns',
  before.whole === 1 && before.picked < .01 && after.whole < .01 && after.picked === 1 && bag && regrown.whole === 1 && regrown.picked < .01, { before, after, bag, regrown });

// what the herbs cost: every loaded chunk's herb meshes, against those drawn near the player; the tall kinds'
// shadows only close by, the low kinds' never. The frame's triangles with the herbs on and off.
await g.spin(null, 40);
const cost = await page.evaluate(() => { const { list, lod } = WORLD.herbLod; let all = 0, drawn = 0, shadow = 0, n = 0, vis = 0, ok = true, tallNear = 0;
  for (const r of list) { const d = Math.hypot(px - r.x, pz - r.z); for (const im of r.ims) { const t = im.geometry.attributes.position.count / 3 * im.count; all += t; n++;
      if (im.visible) { drawn += t; vis++; } if (im.castShadow) shadow += t;
      if (im.visible !== (d < lod.far && (im === r.ims[0] || r.picked)) || im.castShadow !== (r.shadow && d < lod.shadow)) ok = false; if (r.shadow && d < lod.shadow) tallNear++; } }
  const low = list.filter(r => !r.shadow).some(r => r.ims.some(im => im.castShadow));
  const frame = () => { REN.render(scene, CAM); return REN.info.render.triangles; }; const on = frame(); list.forEach(r => r.ims.forEach(im => im.visible = false)); const off = frame(); list.forEach(r => { const d = Math.hypot(px - r.x, pz - r.z); r.ims.forEach((im, k) => im.visible = d < lod.far && (k === 0 || r.picked)); });
  return { meshes: n, drawnMeshes: vis, allTris: all, drawnTris: drawn, shadowTris: shadow, tallNear, rulesHold: ok, lowCasts: low, frameOn: on, frameOff: off, herbsInFrame: on - off }; });
check('herbs are drawn only near the player (a fraction of what is loaded), the tall kinds cast shadows only close by, the low never', cost.rulesHold && !cost.lowCasts && cost.drawnMeshes < cost.meshes * .5 && cost.drawnTris < cost.allTris * .5, cost);

// the photograph, three strips: the plants by height (the low half, then the tall half, a 1.1-unit post for a person at
// the left of each), then the six that stay when picked, each whole and then picked
const shot = await page.evaluate(() => { forceTime(12); const cv = REN.domElement; const sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const out = document.createElement('canvas'); out.width = 1280; out.height = 720; const x2 = out.getContext('2d'); const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); floor.receiveShadow = true; sc.add(floor);
  const strip = (items, row) => { const added = []; const W = items.reduce((w, [k, p]) => w + (k ? Math.max(.3, plantGeo(k, p).boundingBox.max.x - plantGeo(k, p).boundingBox.min.x) : .3) + .2, 0); let x = bx - W / 2;
    for (const [k, p] of items) { const geo = k ? plantGeo(k, p) : new THREE.CylinderGeometry(.1, .09, 1.1, 10); const bb = (geo.computeBoundingBox(), geo.boundingBox); const w = Math.max(.3, bb.max.x - bb.min.x);
      const m = new THREE.Mesh(geo, k ? PLANT_MAT : new THREE.MeshLambertMaterial({ color: 0x8a8078 })); m.position.set(x - bb.min.x + (w - (bb.max.x - bb.min.x)) / 2, y + (k ? 0 : .55), bz); m.castShadow = true; sc.add(m); added.push(m); x += w + .2; }
    const d = (W / 2 + .3) / Math.tan(25 * Math.PI / 180); cam.position.set(bx, y + .35 + d * .12, bz + d); cam.lookAt(bx, y + .3, bz); sc.updateMatrixWorld(true); REN.render(sc, cam);
    x2.drawImage(cv, 0, cv.height / 3, cv.width, cv.height / 3, 0, row * 240, 1280, 240); added.forEach(m => sc.remove(m)); };
  const keys = Object.keys(PLANT_KIND).sort((a, b) => plantGeo(a, false).boundingBox.max.y - plantGeo(b, false).boundingBox.max.y).map(k => [k, false]);
  strip([[null], ...keys.slice(0, 12)], 0); strip([[null], ...keys.slice(12)], 1);
  strip(['thornberry', 'caordubh', 'caorthann', 'ashwort', 'briarweed', 'fearnog'].flatMap(k => [[k, false], [k, true]]), 2);
  sc.remove(floor); return out.toDataURL(); });
fs.writeFileSync('tests/out/plants.png', Buffer.from(shot.split(',')[1], 'base64'));
// the old zones (Session 217): a herb there is its own mesh (mkHerbMesh), not an instance; picking a bush leaves it too
const old = await page.evaluate(() => { const key = Object.keys(PLANT_KIND).find(k => PLANT_STAYS.has(PLANT_KIND[k]) && HERB_DEF[k] && HERB_DEF[k].respawn != null); if (!key) return { none: true };
  const def = HERB_DEF[key]; const x = px + 3, z = pz + 3; const { g: G, gl } = mkHerbMesh(x, z, def, WORLD.scene); const h = { x, z, type: key, def, g: G, gl, harvested: false, respawnT: 0, ph: 0 };
  const u = G.userData; const before = { hasPicked: !!u.picked, whole: u.whole && u.whole.visible, picked: u.picked && u.picked.visible };
  const n0 = BAG.reduce((a, b) => a + (b && b._typeKey === key ? (b.qty || 1) : 0), 0); harvestHerb(h); const n1 = BAG.reduce((a, b) => a + (b && b._typeKey === key ? (b.qty || 1) : 0), 0);
  const after = { harvested: h.harvested, g: G.visible, whole: u.whole.visible, picked: u.picked.visible, took: n1 - n0 };
  ZONES.world.herbs.push(h); h.respawnT = .001; tickHerbs(1 / 60, performance.now()); ZONES.world.herbs.splice(ZONES.world.herbs.indexOf(h), 1);
  const back = { harvested: h.harvested, whole: u.whole.visible, picked: u.picked.visible }; WORLD.scene.remove(G); return { key, before, after, back }; });
check('in the old zones a picked bush stays standing bare, the herb goes in the bag, and the whole bush grows back (Session 217)', !old.none && old.before.hasPicked && old.before.whole && !old.before.picked && old.after.harvested && old.after.g && !old.after.whole && old.after.picked && old.after.took >= 1 && !old.back.harvested && old.back.whole && !old.back.picked, old);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
