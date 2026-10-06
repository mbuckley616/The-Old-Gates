// PROTOTYPE pictures for a DECISION on the dungeon's swinging blades (Michael, 5 Oct: "rarely oriented properly … doesn't look like it would touch the player"). Not a test.
import { boot } from './lib/game.mjs';
const OUT = process.env.SHOT_DIR || 'docs/prototypes';
const g = await boot(); const { page } = g;
await g.intoWorld();
let info = null;
for (let seed = 777; seed < 800 && !info; seed++) {
  await page.evaluate((seed) => { const p = Object.assign({}, PORTALS[0], { theme: 'ruins', seed, size: 'medium', interior: 'cave', zone: 'world', tutorial: false }); goToDungeon(p); }, seed);
  for (let k = 0; k < 20 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene)); k++) await page.waitForTimeout(300);
  info = await page.evaluate((seed) => { const b = D_TRAPS.find(t => t.kind === 'blade'); if (!b) return null; const h = dMap[Math.floor(b.z)][Math.floor(b.x) - 1] === 1; return { seed, x: b.x, z: b.z, h }; }, seed);
}
console.log(JSON.stringify(info));
await page.evaluate(() => { ENEMIES.forEach(e => { e.dead = true; if (e.mesh) e.mesh.visible = false; }); PHP = 1e6; D_TRAPS.forEach(t => { if (t.kind === 'blade') t.ph = 0; }); window.tickDungeonTraps = () => {}; if (typeof vmSword !== 'undefined' && vmSword) vmSword.visible = false; if (typeof vmArmR !== 'undefined' && vmArmR) vmArmR.visible = false; });
// the prototype: a crescent blade on a longer arm that swings ACROSS the passage, its edge leading, the bottom of its arc at the waist (0.95),
// into slots cut in the walls at each side; a dark slot plane on each wall marks where it goes
await page.evaluate(() => { const b = D_TRAPS.find(t => t.kind === 'blade'); const h = dMap[Math.floor(b.z)][Math.floor(b.x) - 1] === 1;
  const P = new THREE.Group(); const top = FLOOR_HEIGHT - .1, low = .95, L = top - low; P.position.set(b.x, top, b.z); P.rotation.y = h ? Math.PI / 2 : 0;
  const iron = new THREE.MeshLambertMaterial({ color: 0x3a3a3c }), steel = new THREE.MeshLambertMaterial({ color: 0xc8ccd4, side: THREE.DoubleSide });
  const arm = new THREE.Mesh(new THREE.BoxGeometry(.07, L - .25, .07), iron); arm.position.y = -(L - .25) / 2; P.add(arm);
  const sh = new THREE.Shape(); sh.absarc(0, 0, .55, Math.PI * 1.15, Math.PI * 1.85, false); sh.absarc(0, .32, .45, Math.PI * 1.8, Math.PI * 1.2, true);
  const bl = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .03, bevelEnabled: true, bevelSize: .012, bevelThickness: .01, bevelSegments: 1 }), steel); bl.position.set(0, -L + .55, -.015); P.add(bl);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .22, 10), iron); hub.rotation.x = Math.PI / 2; P.add(hub);
  const slotM = new THREE.MeshBasicMaterial({ color: 0x050403, side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const sl = new THREE.Mesh(new THREE.PlaneGeometry(.12, 1.3), slotM); const ox = h ? 0 : s * .49, oz = h ? s * .49 : 0; sl.position.set(b.x + ox, 1.35, b.z + oz); sl.rotation.y = h ? 0 : Math.PI / 2; dScene.add(sl); }
  const lt = new THREE.PointLight(0xffc080, 1.6, 7); lt.position.set(b.x, 2.4, b.z); dScene.add(lt);
  P.visible = false; dScene.add(P); window._proto = { P, old: b.pivot, b, h }; });
const shot = async (file, which, a, dist, side) => {
  await page.evaluate(([which, a, dist, side]) => { const { P, old, b, h } = window._proto; P.visible = which === 'new'; old.visible = which === 'old'; P.rotation.z = a; old.rotation.z = a;
    const dx = h ? 1 : 0, dz = h ? 0 : 1; px = b.x + dx * dist + (side ? (h ? 0 : .25) : 0); pz = b.z + dz * dist + (side ? (h ? .25 : 0) : 0); yaw = Math.atan2(dx, dz); pitch = .02; }, [which, a, dist, side]);
  await g.frames(3); await page.screenshot({ path: `${OUT}/${file}` });
  const hit = await page.evaluate(() => { const rc = new THREE.Raycaster(); rc.setFromCamera({ x: 0, y: -.3 }, CAM); const h = rc.intersectObjects(dScene.children, true)[0]; return h ? [h.object.type, h.object.geometry && h.object.geometry.type, +h.distance.toFixed(2), h.object.material && h.object.material.color && h.object.material.color.getHexString(), JSON.stringify(h.object.geometry && h.object.geometry.parameters || {}).slice(0, 80)] : null; });
  console.log(file, JSON.stringify(hit));
};
await shot('trap-today-mid.png', 'old', 0, 4.2);
await shot('trap-today-swing.png', 'old', .4, 4.2);
await shot('trap-proto-mid.png', 'new', 0, 4.2);
await shot('trap-proto-swing.png', 'new', .45, 4.2);
console.log('errs', JSON.stringify(g.errs));
await g.close();
