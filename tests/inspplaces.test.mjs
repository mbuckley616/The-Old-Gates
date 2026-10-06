// The lair, the glade and the bandit camp in the mesh inspector (Session 557; Michael's inspector note, Session 541: "maybe a few
// others that should probably be in this list"). Their look comes from the systems builder's geometry-only previews
// (WORLD.poiPreview, Session 545, on auto/systems); the inspector lists them under Buildings › Places whenever the world can
// build them. Checked: each entry has its stable key, builds the place's own meshes at the origin, and the stage shows it; the
// glade's trees are built from the title screen too (the world's tree prototypes are made at world entry).
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  openInspector(); const I = INSPECTOR, can = !!(WORLD.poiPreview), out = { can };
  for (const k of ['poi-glade', 'poi-lair', 'poi-bandit-camp']) {
    const key = 'buildings/places/' + k, e = I.entries.find(x => x.key === key);
    if (!e) { out[k] = null; continue; }
    I.select(key); const b = I.built.get(e.id);
    let trees = 0; if (b && b.obj) b.obj.traverse(o => { if (o.isInstancedMesh && o.geometry.attributes.position && o.geometry.attributes.position.count) trees += o.count; });
    out[k] = { trees, ok: !!(b && b.obj), err: b && b.err || null, tris: b && b.stats ? b.stats.tris : 0, calls: b && b.stats ? b.stats.calls : 0, name: I.ui.querySelector('#insp-name').textContent };
  }
  return out;
});
console.log(JSON.stringify(r));
const keys = ['poi-glade', 'poi-lair', 'poi-bandit-camp'];
if (r.can) {
  for (const k of keys) check(`${k}: listed under Buildings › Places and built (${r[k] && r[k].tris} triangles, ${r[k] && r[k].calls} draw calls)`, r[k] && r[k].ok && r[k].tris > 1000 && /Places/.test(r[k].name), r[k]);
  check('the glade\'s ring of ten trees is built from the inspector, before the world is entered', r['poi-glade'] && r['poi-glade'].trees === 10, r['poi-glade']);
  await inspShots(g, [['buildings/places/poi-glade', 'inspector-poi-glade.png'], ['buildings/places/poi-lair', 'inspector-poi-lair.png'], ['buildings/places/poi-bandit-camp', 'inspector-poi-bandit-camp.png']]);
} else {
  // the previews are the systems builder's (Session 545); until they are merged the entries are not listed rather than broken
  check('without WORLD.poiPreview the three places are not listed (nothing broken)', keys.every(k => r[k] === null), r);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
