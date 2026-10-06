// PROTOTYPE pictures for a DECISION on the old gates' look in the overworld (Michael, 5 Oct: "very very jumbled"). Not a test.
import { boot } from './lib/game.mjs';
const OUT = process.env.SHOT_DIR || 'docs/prototypes';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => WORLD.devUnlockAll());
let pos = null;
for (let k = 0; k < 30 && !pos; k++) { pos = await page.evaluate(() => dungeonWorldPos[137] || null); if (!pos) await page.waitForTimeout(1000); }
await page.evaluate(() => {
  // one shared form: a dressed-stone threshold cut into a turf mound, the binding marks cut into its jambs and lintel in the theme's colour,
  // worn steps going down into the dark, wing walls holding the mound back, and a ring of marker stones each with one mark
  window.protoGate = (x, z, col, ry) => {
    const G = new THREE.Group(); const y0 = worldH(x, z); G.position.set(x, y0, z); G.rotation.y = ry || 0;
    const stone = new THREE.MeshLambertMaterial({ color: 0x8a8478, flatShading: true }), dark = new THREE.MeshLambertMaterial({ color: 0x5e5a52, flatShading: true });
    const turf = new THREE.MeshLambertMaterial({ color: 0x4e6a34, flatShading: true }), earth = new THREE.MeshLambertMaterial({ color: 0x5a4a34 });
    const glow = new THREE.MeshBasicMaterial({ color: col }), voidM = new THREE.MeshBasicMaterial({ color: 0x050403 });
    const B = (w, h, d, m, px, py, pz, rx, ryy, rz) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(px, py, pz); o.rotation.set(rx || 0, ryy || 0, rz || 0); G.add(o); return o; };
    // the mound behind the door
    const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), turf); mound.scale.set(6.4, 4.3, 6.6); mound.position.set(0, -.3, 4.4); G.add(mound);
    // the frame: two jambs, a lintel, a capstone stepped over it
    for (const s of [-1, 1]) { B(.62, 2.7, .8, stone, s * 1.06, 1.35, -1.6);
      for (let i = 0; i < 6; i++) B(i % 2 ? .22 : .12, .05, .02, glow, s * 1.06, .5 + i * .34, -2.01); /* the binding marks, cut down each jamb */
      B(.05, 1.9, .02, glow, s * 1.06, 1.35, -2.01);
      // wing walls holding the mound back, stepping down
      for (let k = 0; k < 3; k++) B(1.0, 2.2 - k * .6, .55, k % 2 ? dark : stone, s * (1.95 + k * .9), (2.2 - k * .6) / 2, -1.45 + k * .35, 0, s * -.38, 0);
    }
    B(3.0, .55, .95, stone, 0, 2.97, -1.6); B(2.3, .32, .8, dark, 0, 3.4, -1.55);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.2, .035, 6, 20), glow); ring.position.set(0, 2.97, -2.08); G.add(ring);
    B(.05, .3, .02, glow, 0, 2.97, -2.08); B(.3, .05, .02, glow, 0, 2.97, -2.08);
    // the dark beyond the door, the steps going down into it, a threshold slab before it
    const v = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.7), voidM); v.position.set(0, 1.35, -1.25); v.rotation.y = Math.PI; G.add(v);
    for (let k = 0; k < 4; k++) B(1.5, .14, .32, k % 2 ? dark : stone, 0, .02 - k * .13, -1.85 + k * .26);
    B(2.6, .14, 1.0, stone, 0, .02, -2.55); B(2.0, .1, .7, dark, 0, -.02, -3.35, 0, .05, 0);
    B(1.5, .08, .1, glow, 0, .11, -2.1);
    // the marker stones: a ring at twelve units, each with one mark facing the door
    for (let k = 0; k < 7; k++) { const a = Math.PI * (.25 + k * (1.5 / 6)), r = 9; const mx = Math.sin(a) * r, mz = -Math.cos(a) * r * .9 + 1.5;
      const st = B(.45, 1.1, .32, stone, mx, .5, mz, 0, a, (k % 3 - 1) * .08); const m = B(.04, .4, .02, glow, 0, .1, -.17); st.remove(m); st.add(m); m.position.set(0, .15, -.17); }
    const L = new THREE.PointLight(col, 1.2, 9); L.position.set(0, 1.6, -2.6); G.add(L);
    WORLD.scene.add(G); return G; };
});
const shot = async (file, cx, cz, dx, dz, pitch) => {
  for (let k = 0; k < 4; k++) { await page.evaluate(([cx, cz, dx, dz, pt]) => { px = cx + dx; pz = cz + dz; yaw = Math.atan2(dx, dz); pitch = pt; }, [cx, cz, dx, dz, pitch]); await g.spin(null, 20); await page.waitForTimeout(600); }
  await g.hide(); await g.frames(3); await page.screenshot({ path: `${OUT}/${file}` }); console.log(file);
};
await page.evaluate(() => forceTime(11));
await shot('oldgate-today.png', pos.x, pos.z, 1.5, -10, -.1);
// the prototype, twenty units off in open ground, in the Crypt of Embers' colour and in the haunted gates' green
const P = await page.evaluate((p) => { const a = { x: p.x + 26, z: p.z - 6 }, b = { x: p.x + 52, z: p.z - 6 }; protoGate(a.x, a.z, 0xff7a30, 0); protoGate(b.x, b.z, 0x6affc0, 0); return [a, b]; }, pos);
await shot('oldgate-proto-ember.png', P[0].x, P[0].z, 2, -11, -.08);
await shot('oldgate-proto-haunted.png', P[1].x, P[1].z, -4, -10, -.08);
await page.evaluate(() => forceTime(22));
await shot('oldgate-proto-night.png', P[0].x, P[0].z, 1, -8, -.06);
console.log('errs', JSON.stringify(g.errs));
await g.close();
