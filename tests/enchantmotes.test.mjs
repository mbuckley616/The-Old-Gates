// Enchanted pieces carry "some very very light particle effect" (Session 539, Michael's inspector note with the Demonic kit).
// Your body in third person: an enchanted weapon, shield and cuirass each carry a few faint additive motes in the enchantment's
// colour (an armour enchantment, which has none, the material's glow or a pale blue), inside the piece's bounds, which rise as
// tpPose ticks and come round again; plain pieces carry none, and rebuilding disposes them.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const keep = Object.assign({}, EQ), W = t => WEAPON_TYPES.find(w => w.type === t), A = t => ARMOR_TYPES.find(a => a.type === t);
  const fire = WEAPON_ENCHANTS.find(e => e.id === 'fire'), vit = ARMOR_ENCHANTS.find(e => e.id === 'health_boost');
  const read = R => (R.motes || []).map(m => ({ n: m.geometry.attributes.position.count, col: m.material.color.getHex(), add: m.material.blending === THREE.AdditiveBlending, op: m.material.opacity, on: m.parent && (m.parent.name || m.parent.type),
    inside: (() => { const a = m.geometry.attributes.position, b = m.userData.box.clone().expandByScalar(.02), v = new THREE.Vector3(); for (let i = 0; i < a.count; i++) if (!b.containsPoint(v.fromBufferAttribute(a, i))) return false; return true; })() }));
  // plain: a steel sword, cuirass and buckler without enchantment
  for (const k of ['head', 'chest', 'hands', 'legs', 'feet', 'weapon', 'offhand']) EQ[k] = null;
  EQ.weapon = makeItem(4, W('Sword'), null, false); EQ.chest = makeItem(4, A('Cuirass'), null, true); EQ.offhand = makeItem(4, A('Buckler'), null, true);
  let R = tpBuild(null, 'gatelander'); if (R.rig) PEOPLE_RIGS.delete(R.rig); const plain = read(R); tpDispose(R);
  // enchanted: the sword of Flames, a cuirass and a shield of Vitality
  EQ.weapon = makeItem(4, W('Sword'), fire, false); EQ.chest = makeItem(4, A('Cuirass'), vit, true); EQ.offhand = makeItem(4, A('Buckler'), vit, true);
  R = tpBuild(null, 'gatelander'); if (R.rig) PEOPLE_RIGS.delete(R.rig); const ench = read(R);
  // they rise: tick a second on and compare heights
  const ys = () => R.motes.map(m => { const a = m.geometry.attributes.position; let s = 0; for (let i = 0; i < a.count; i++) s += a.getY(i); return s; });
  tpMotesTick(R, 10); const y0 = ys(); tpMotesTick(R, 10.5); const y1 = ys(); let moved = 0; y0.forEach((y, i) => { if (Math.abs(y1[i] - y) > 1e-4) moved++; });
  // the picture: the body alone on a dusk stage, close, from the front and three-quarters
  const shot = (() => { const sc = new THREE.Scene(); sc.background = new THREE.Color(0x1c2230); sc.add(new THREE.HemisphereLight(0x8890a8, 0x202018, .9)); const dl = new THREE.DirectionalLight(0xffe0c0, .6); dl.position.set(2, 3, 2); sc.add(dl);
    sc.add(R.root); R.root.position.set(0, 0, 0); R.root.rotation.set(0, 0, 0); R.root.updateMatrixWorld(true); const cv = REN.domElement, out = document.createElement('canvas'); out.width = cv.width; out.height = cv.height; const x = out.getContext('2d');
    [[.35, 0], [-1.0, .5]].forEach(([yaw], i) => { const cam = new THREE.PerspectiveCamera(30, cv.width / 2 / cv.height, .05, 50); cam.position.set(Math.sin(yaw) * 1.7, 1.0, Math.cos(yaw) * 1.7); cam.lookAt(0, .7, 0);
      tpMotesTick(R, 12 + i); REN.setClearColor(0x1c2230, 1); REN.render(sc, cam); x.drawImage(cv, cv.width / 4, 0, cv.width / 2, cv.height, i * cv.width / 2, 0, cv.width / 2, cv.height); });
    sc.remove(R.root); return out.toDataURL(); })();
  // disposal: the motes' geometry is let go with the body
  let disposed = 0; R.motes.forEach(m => m.geometry.addEventListener('dispose', () => disposed++)); tpDispose(R);
  Object.assign(EQ, keep); return { plain, ench, moved, disposed, fire: fire.col, shot };
});
if (process.env.SHOTS) fs.writeFileSync('docs/prototypes/' + process.env.SHOTS + '.png', Buffer.from(r.shot.split(',')[1], 'base64'));
delete r.shot; console.log(JSON.stringify(r));
check('plain pieces carry no motes', r.plain.length === 0, r.plain);
check('the enchanted sword, cuirass and shield each carry motes: three sets', r.ench.length === 3, r.ench);
check('a few motes each, faint and additive (7, opacity .5)', r.ench.every(m => m.n >= 4 && m.n <= 12 && m.add && m.op <= .6), r.ench);
check('the sword\'s are the enchantment\'s own colour (Flames)', r.ench.some(m => m.col === r.fire), r.ench.map(m => m.col.toString(16)));
check('every mote lies within its piece\'s bounds', r.ench.every(m => m.inside), r.ench.map(m => m.inside));
check('they move as the body is posed', r.moved === 3, r.moved);
check('rebuilding the body disposes them', r.disposed === 3, r.disposed);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
