// The swamp's giant mushrooms in kinds (Session 526, Michael's inspector note: "we need more variants — red, brown, purple,
// blue, varying shapes and sizes; maybe its own subcategory"). Five kinds of their own colour and shape, each no costlier
// than a broadleaf; a real swamp chunk grows several, lit by a tint that keeps their colour; the inspector lists them apart.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.spin(null, 10);
const r = await page.evaluate(() => {
  const P = WORLD.treeProtos(), K = ['mushroom', 'mushroomBrown', 'mushroomPurple', 'mushroomTan', 'mushroomBlue'], out = {};
  // the cap's colour: the vertices above two thirds of the height that are not the pale warts or gills; its hue and the height
  for (const k of K) { const gg = P[k], p = gg.attributes.position, c = gg.attributes.color; let top = 0, R = 0, G = 0, B = 0, n = 0;
    for (let i = 0; i < p.count; i++) top = Math.max(top, p.getY(i));
    for (let i = 0; i < p.count; i++) { if (p.getY(i) < top * .6) continue; const r = c.getX(i), g2 = c.getY(i), b = c.getZ(i); if (Math.min(r, g2, b) > .7) continue; R += r; G += g2; B += b; n++; }
    const col = new THREE.Color(R / n, G / n, B / n), h = {}; col.getHSL(h); out[k] = { hue: +h.h.toFixed(2), sat: +h.s.toFixed(2), top: +top.toFixed(1), tris: p.count / 3 }; }
  out.broadleaf = { tris: P.broadleaf.attributes.position.count / 3 };
  let cand = []; for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) { let c; try { c = WORLD.getCell(i, j); } catch (e) { continue; } if (c && c.regions) for (const rg of c.regions) if (rg.biome === 'swamp') cand.push([rg.x, rg.z, Math.hypot(rg.x - px, rg.z - pz)]); }
  cand.sort((a, b) => a[2] - b[2]);
  return { out, cand: cand.slice(0, 4), mix: WORLD.treeMix().mushroom };
});
// a real swamp chunk: travel to the nearest swamp region (its cell loads), then scatter the chunk there as the world does
let at = null, world = {};
for (const [x, z] of r.cand) {
  await page.evaluate(([x, z]) => { px = x; pz = z; py = WORLD.worldH(x, z) + 1.7; }, [x, z]); await g.spin(null, 200);
  const w = await page.evaluate(([x, z]) => { px = x; pz = z; if (dominantRegion(x, z).r.biome !== 'swamp') return null; const K = ['mushroom', 'mushroomBrown', 'mushroomPurple', 'mushroomTan', 'mushroomBlue'];
    const grp = new THREE.Group(), out = {}, ic = new THREE.Color(); scatterChunk(Math.floor(x / CHUNK), Math.floor(z / CHUNK), grp, []);
    grp.children.forEach(o => { if (!o.isInstancedMesh || !K.includes(o.userData.scatter)) return; let grey = 0; for (let i = 0; i < o.count; i++) { o.getColorAt(i, ic); if (Math.max(ic.r, ic.g, ic.b) - Math.min(ic.r, ic.g, ic.b) < .1) grey++; } out[o.userData.scatter] = { n: o.count, grey }; });
    return out; }, [x, z]);
  if (w) { at = [Math.round(x), Math.round(z)]; world = w; break; }
}
r.at = at; r.world = world;
console.log(JSON.stringify(r));
const o = r.out, K = ['mushroom', 'mushroomBrown', 'mushroomPurple', 'mushroomTan', 'mushroomBlue'];
check('five kinds, each no costlier than a broadleaf plus a tenth', K.every(k => o[k] && o[k].tris <= o.broadleaf.tris * 1.1), o);
check('red, brown, purple, tan and blue caps by hue (red under .05, brown and tan .05–.14, purple .7–.85, blue .55–.68)', o.mushroom.hue < .05 || o.mushroom.hue > .97, o) ;
check('… the brown and tan warm, the purple purple, the blue blue', o.mushroomBrown.hue > .04 && o.mushroomBrown.hue < .14 && o.mushroomTan.hue > .05 && o.mushroomTan.hue < .14 && o.mushroomPurple.hue > .7 && o.mushroomPurple.hue < .85 && o.mushroomBlue.hue > .55 && o.mushroomBlue.hue < .68, o);
const tops = K.map(k => o[k].top);
check('they differ in size: the tallest at least half again the shortest', Math.max(...tops) / Math.min(...tops) > 1.5, tops);
const ws = Object.entries(r.world);
check('a real swamp chunk grows at least three kinds, every one under a grey tint that keeps its colour', !!r.at && ws.length >= 3 && ws.every(([, v]) => v.grey === v.n), { at: r.at, world: r.world });
// a line-up by day, each kind once, a person for scale, lit by the world's own sun (spun on so the sun has moved to noon)
await page.evaluate(() => forceTime(12)); await g.spin('clear', 40);
const shot = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene, P = WORLD.treeProtos(); const bx = px + 400, bz = pz, y = WORLD.worldH(bx, bz) + 80;
  const cam = new THREE.PerspectiveCamera(34, cv.width / cv.height, .5, 400); cam.layers.enableAll(); const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 80), new THREE.MeshLambertMaterial({ color: 0x4e5a38 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
  const list = ['mushroom', 'mushroomBrown', 'mushroomPurple', 'mushroomTan', 'mushroomBlue'], ms = [];
  list.forEach((k, i) => { const m = new THREE.Mesh(P[k], SCATTER_MAT); m.position.set(bx + (i - 2) * 9, y, bz); m.rotation.y = i; sc.add(m); ms.push(m); });
  const man = buildFoe('Bandit', 0, 0); PEOPLE_RIGS.delete(man); man.root.position.set(bx - 23, y, bz + 3); sc.add(man.root);
  cam.position.set(bx, y + 5, bz + 44); cam.lookAt(bx, y + 4, bz); sc.updateMatrixWorld(true); REN.render(sc, cam); const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
  ms.forEach(m => sc.remove(m)); sc.remove(man.root); sc.remove(floor); return o.toDataURL(); });
fs.writeFileSync('docs/prototypes/mushrooms-lineup.png', Buffer.from(shot.split(',')[1], 'base64'));
await inspShots(g, [['plants-trees-rocks/mushrooms/red', 'mushrooms-red.png'], ['plants-trees-rocks/mushrooms/blue-clump', 'mushrooms-blue.png']]);
const listed = await page.evaluate(() => INSPECTOR.entries.filter(e => e.sub === 'Mushrooms').map(e => e.name));
check('the inspector lists them in a section of their own', listed.length === 5, listed);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
