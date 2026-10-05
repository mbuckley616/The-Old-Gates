// Autumn's trees in autumn's colours (Session 521, Michael's inspector note: "Leaves of this tree are still green ...
// variants of the current trees with red, yellow, orange and mixed leaves"). The autumn wood's broadleaf, oaks and birches
// stood in green leaves under a near-white tint. Now: five autumn kinds (mixed, red, gold broadleafs; a russet oak; a
// yellow birch), the leaves warm in the prototype and still warm once the chunk's own tint is applied, in a real autumn chunk.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.spin(null, 10);
const r = await page.evaluate(() => {
  const P = WORLD.treeProtos(), KINDS = ['autumn', 'autumnRed', 'autumnGold', 'oakAutumn', 'birchAutumn'];
  // the leaves: every vertex above the trunk's fork (y > 5.5), its mean colour; hue in turns (0 red, .17 yellow, .33 green)
  const leaf = gg => { const p = gg.attributes.position, c = gg.attributes.color; let R = 0, G = 0, B = 0, n = 0; for (let i = 0; i < p.count; i++) if (p.getY(i) > 5.5) { R += c.getX(i); G += c.getY(i); B += c.getZ(i); n++; } return [R / n, G / n, B / n]; };
  const hue = ([R, G, B]) => { const col = new THREE.Color(R, G, B), h = {}; col.getHSL(h); return +h.h.toFixed(3); };
  const protos = {}; for (const k of KINDS) protos[k] = P[k] ? { hue: hue(leaf(P[k])), tris: P[k].attributes.position.count / 3 } : null;
  protos.broadleaf = { hue: hue(leaf(P.broadleaf)), tris: P.broadleaf.attributes.position.count / 3 };
  // a real autumn chunk: the first autumn region in the cells, scattered as the world scatters it
  let f = null; for (let j = 0; j < GRID && !f; j++) for (let i = 0; i < GRID && !f; i++) { let c; try { c = WORLD.getCell(i, j); } catch (e) { continue; } if (c && c.regions) for (const rg of c.regions) if (rg.biome === 'autumn' && !f) f = rg; }
  const grp = new THREE.Group(); scatterChunk(Math.floor(f.x / CHUNK), Math.floor(f.z / CHUNK), grp, []);
  const world = {}; const ic = new THREE.Color();
  grp.children.forEach(o => { if (!o.isInstancedMesh || !o.userData.scatter) return; const k = o.userData.scatter; const L = leaf(o.geometry); let warm = 0;
    for (let i = 0; i < o.count; i++) { o.getColorAt(i, ic); if (hue([L[0] * ic.r, L[1] * ic.g, L[2] * ic.b]) < .2) warm++; }
    world[k] = { n: o.count, warm }; });
  return { protos, world, mix: WORLD.treeMix().autumn, at: [Math.round(f.x), Math.round(f.z)] };
});
console.log(JSON.stringify(r));
const K = ['autumn', 'autumnRed', 'autumnGold', 'oakAutumn', 'birchAutumn'];
check('five autumn kinds are built, each at no more triangles than its green tree', K.every(k => r.protos[k] && r.protos[k].tris <= r.protos.broadleaf.tris * 1.1), r.protos);
check('their leaves are red, orange or yellow (hue under .17), where the broadleaf\'s are green (about .27)', K.every(k => r.protos[k].hue < .17) && r.protos.broadleaf.hue > .22, r.protos);
check('the red leans red, the gold yellow, and the mixed tree between them', r.protos.autumnRed.hue < .05 && r.protos.autumnGold.hue > .1 && r.protos.autumn.hue > r.protos.autumnRed.hue && r.protos.autumn.hue < r.protos.autumnGold.hue, r.protos);
const auW = K.filter(k => r.world[k]), auN = auW.reduce((a, k) => a + r.world[k].n, 0), auWarm = auW.reduce((a, k) => a + r.world[k].warm, 0);
check('in a real autumn chunk at least four of the kinds stand, and every one of their trees is still warm under the chunk\'s tint', auW.length >= 4 && auN > 20 && auWarm === auN, { world: r.world });
check('the autumn wood keeps its mixed tree for a share and some conifers', r.mix.some(x => x[0] === 'conifer') && r.mix.reduce((a, x) => a + x[1], 0) < .8, r.mix);
// in game: stand in that autumn wood at noon and look along the ground
await page.evaluate(([x, z]) => { forceTime(13); px = x; pz = z; py = WORLD.worldH(x, z) + 1.7; yaw = 0.6; pitch = .05; }, r.at);
await g.spin(null, 240); await page.evaluate(([x, z]) => { px = x; pz = z; py = WORLD.worldH(x, z) + 1.7; }, r.at); await g.spin(null, 30); await g.frames(3);
await page.screenshot({ path: 'docs/prototypes/autumn-ingame.png', timeout: 120000 });
await inspShots(g, [['plants-trees-rocks/trees-and-scrub/autumn', 'autumn-after.png']]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
