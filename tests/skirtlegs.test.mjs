// Legs through skirts (Session 525, Michael's inspector note: "the legs punch right through the fabric while walking"). Over a
// walk cycle, CPU-skin the figure and count the leg vertices (thigh and knee bones) that stand outside the skirt's own posed
// surface at the same height and bearing round the hips. Before, a skirt bound to the hips alone stood still while the thigh
// swung through it.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
const KEYS = ['people/gatelanders/villager-f', 'people/gatelanders/villager', 'people/markmen/villager-f', 'people/aurennais/villager-f'];
const r = await page.evaluate(KEYS => {
  openInspector(); const out = {};
  for (const key of KEYS) {
    const e = INSPECTOR.entries.find(x => x.key === key); if (!e) { out[key] = { missing: true }; continue; }
    INSPECTOR.select(e.id); const R = INSPECTOR.built.get(e.id); let mesh = null; R.obj.traverse(o => { if (o.isSkinnedMesh && !mesh) mesh = o; });
    const bones = mesh.skeleton.bones, bi = n => bones.findIndex(b => b.name === n), H = bi('hips');
    const legI = new Set(['thL', 'knL', 'thR', 'knR'].map(bi));
    const pa = mesh.geometry.attributes.position, sI = mesh.geometry.attributes.skinIndex, sW = mesh.geometry.attributes.skinWeight;
    // the hip joints' height in the bind pose, from the skeleton's own inverse
    const jy = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().copy(mesh.skeleton.boneInverses[bi('thL')]).invert()).y;
    // the skirt: the wall of the parts on the hips (first index the hips) below the hip joints; the legs: on a thigh or knee alone
    const skirt = [], leg = [];
    for (let i = 0; i < pa.count; i++) { const k = sI.getX(i); if (k === H && pa.getY(i) < jy - .03 && Math.hypot(pa.getX(i), pa.getZ(i)) > .1) skirt.push(i); /* its wall, not the cap's middle */ else if (legI.has(k) && sW.getX(i) > .999) leg.push(i); }
    let worst = 0, pokes = 0, frames = 0; const v = new THREE.Vector3(), hp = new THREE.Vector3(), inv = new THREE.Matrix4();
    for (let f = 0; f < 24; f++) {
      R.anim(f * .055, .055, 'walk'); R.obj.updateMatrixWorld(true); mesh.skeleton.update(); inv.copy(mesh.matrixWorld).invert();
      hp.setFromMatrixPosition(bones[H].matrixWorld).applyMatrix4(inv);
      // the skirt's envelope: max radius round the hips' axis in bins of height (2 cm) and bearing (24)
      const env = new Map(); let ylo = 1e9, yhi = -1e9;
      for (const i of skirt) { mesh.boneTransform(i, v); const a = Math.atan2(v.x - hp.x, v.z - hp.z), rr = Math.hypot(v.x - hp.x, v.z - hp.z), key = Math.floor(v.y / .02) * 100 + Math.floor((a + Math.PI) / (Math.PI / 12)); env.set(key, Math.max(env.get(key) || 0, rr)); ylo = Math.min(ylo, v.y); yhi = Math.max(yhi, v.y); }
      for (const i of leg) { mesh.boneTransform(i, v); if (v.y < ylo + .01 || v.y > yhi - .03) continue; const a = Math.atan2(v.x - hp.x, v.z - hp.z), rr = Math.hypot(v.x - hp.x, v.z - hp.z), key = Math.floor(v.y / .02) * 100 + Math.floor((a + Math.PI) / (Math.PI / 12));
        const e = env.get(key); if (e == null) continue; const over = rr - e; if (over > .008) { pokes++; worst = Math.max(worst, over); } }
      frames++;
    }
    out[key] = { skirt: skirt.length, leg: leg.length, pokes, perFrame: +(pokes / frames).toFixed(1), worst: +worst.toFixed(3) };
  }
  return out;
}, KEYS);
console.log(JSON.stringify(r));
const vals = Object.values(r).filter(x => !x.missing);
check('four townsfolk with skirts and tunics are measured, each with drape vertices', vals.length === 4 && vals.every(x => x.skirt > 50 && x.leg > 50), r);
check('over a walk cycle the legs poke out of the skirts at fewer than 9 vertices a frame (rigid, 17–21) and never more than 5 cm (rigid, 6.7–7.8)', vals.every(x => x.worst < .05 && x.perFrame < 9), r);
const walk = 'INSPECTOR.unpinAll();const e=INSPECTOR.entries.find(x=>x.key==="people/gatelanders/villager-f");const R=INSPECTOR.built.get(e.id);INSPECTOR.opts.anim=false;R.anim(.33,.055,"walk");INSPECTOR.orbit.theta=1.5708;INSPECTOR.orbit.phi=1.5;';
await inspShots(g, [['people/gatelanders/villager-f', 'skirtlegs-after.png', walk]]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
