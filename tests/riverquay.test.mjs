// The quay on a river bank (Session 433; Michael's C on #112, the towns on the banks): a settlement within a short
// walk of navigable water keeps the nearest point of the channel (`site.bank`, set by the routing), and its builder
// puts a stone quay along the bank on the harbour's kit, narrower, its outer face over the water, with bollards, a
// boat or two moored to it, crates and a net, a lantern; walkable as four short platforms. This walks to the nearest
// bank town, checks the quay stands with its outer face over water and its inner on the bank, and takes a picture.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const pick = await page.evaluate(() => {
  WORLD.rawH(1, 1); const st = WORLD.routed.stats; const banks = [];
  for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) for (const t of WORLD.getCell(i, j).sites) if (t.bank) banks.push({ id: t.id, kind: t.kind, name: t.name, d: Math.round(t.bank.d), w: Math.round(t.bank.w * 2), dist: Math.round(Math.hypot(t.x - px, t.z - pz)) });
  banks.sort((a, b) => a.dist - b.dist); const towns = banks.filter(b => b.kind === 'town' || b.kind === 'city');
  return { n: banks.length, kinds: banks.reduce((o, b) => { o[b.kind] = (o[b.kind] || 0) + 1; return o; }, {}), first: (towns[0] || banks[0]), banksStat: st.banks };
});
console.log(JSON.stringify(pick));
check('the routing marks the bank towns: 15 or more settlements within a short walk of navigable water, towns and villages among them', pick.n >= 15 && pick.n === pick.banksStat && pick.kinds.village > 0 && (pick.kinds.town || 0) + (pick.kinds.city || 0) > 0, JSON.stringify(pick));
await g.settle(pick.first.id);
const r = await page.evaluate((id) => {
  const S = WORLD.settle.get(id); const site = S.site; const out = { id, name: site.name, kind: site.kind, built: !!S };
  // the quay is baked into the town's clusters with the houses (S194's bake keeps a hi and a lo copy per 60u cluster)
  const Q = site.quayAt; out.quayAt = !!Q; if (!Q) return out;
  const near = []; S.group.traverse(o => { if (!o.isMesh || !o.userData.baked) return; o.geometry.computeBoundingSphere(); const b = o.geometry.boundingSphere; const c = b.center.clone().applyMatrix4(o.matrixWorld); if (Math.hypot(c.x - Q.x, c.z - Q.z) < b.radius + 12) near.push(o.userData.lod); });
  out.quays = near; const hi = near.length ? S.group : null; if (!hi) return out;
  const B = site.bank; out.at = { x: Math.round(Q.x), z: Math.round(Q.z), len: Q.len, ang: +Q.ang.toFixed(2), fromTown: Math.round(Math.hypot(Q.x - site.x, Q.z - site.z)), pad: site.pad };
  out.outerH = +WORLD.worldH(Q.x + B.dx * 2.5, Q.z + B.dz * 2.5).toFixed(2); out.innerH = +WORLD.worldH(Q.x - B.dx * 2.5, Q.z - B.dz * 2.5).toFixed(2); out.beyondH = +WORLD.worldH(Q.x + B.dx * 8, Q.z + B.dz * 8).toFixed(2);
  out.channelH = +WORLD.worldH(Q.x + B.dx * (B.d - Math.hypot(Q.x - site.x, Q.z - site.z)), Q.z + B.dz * (B.d - Math.hypot(Q.x - site.x, Q.z - site.z))).toFixed(2);
  out.platforms = ZONES.world.platforms.filter(p => p.site === id && p.river).length; out.boats = (S.boats || []).length; out.lamps = S.lamps.length;
  // the deck under foot: stand mid-quay and read the ground
  { const qx = Q.x + Math.sin(Q.ang) * 1.5, qz = Q.z + Math.cos(Q.ang) * 1.5; const p = ZONES.world.platforms.find(p => p.site === id && p.river && qx > p.x0 && qx < p.x1 && qz > p.z0 && qz < p.z1); out.standY = p ? p.y : null; out.quayY = site.quayY; }
  px = Q.x - B.dx * 20; pz = Q.z - B.dz * 20; // stand on the bank, so the chunks round the quay stream in for the picture
  return out;
}, pick.first.id);
console.log(JSON.stringify(r));
if (r.quayAt) {
  for (let k = 0; k < 5; k++) { await page.waitForTimeout(2000); await g.frames(2); }
  const png = await page.evaluate((id) => {
    const S = WORLD.settle.get(id); const site = S.site; const B = site.bank, Q = site.quayAt;
    for (let q = 0; q < 300 && (WORLD.jobs.length || [...WORLD.LOADED.values()].some(L => L.pending)); q++) { WORLD.tick(1 / 60, performance.now()); while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } }
    forceTime(11); WORLD.tick(1 / 60, performance.now());
    const cam = new THREE.PerspectiveCamera(55, REN.domElement.width / REN.domElement.height, .3, 600); const cx = Q.x - B.dx * 26 + B.tx * 10, cz = Q.z - B.dz * 26 + B.tz * 10;
    cam.position.set(cx, WORLD.worldH(cx, cz) + 5, cz); cam.lookAt(Q.x + B.dx * 4, .8, Q.z + B.dz * 4); WORLD.scene.updateMatrixWorld(true); REN.render(WORLD.scene, cam);
    const cv = REN.domElement, o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL();
  }, pick.first.id);
  fs.writeFileSync('tests/out/riverquay.png', Buffer.from(png.split(',')[1], 'base64'));
}
check('the bank town builds its quay, the kit’s and its distant copy', r.quays && r.quays.includes('hi') && r.quays.includes('lo'), JSON.stringify(r.quays));
check('the quay stands on the bank between the town and the channel, 20u long', r.at && r.at.fromTown > r.at.pad * .8 && r.at.fromTown < r.at.pad + 240 && r.at.len === 20, JSON.stringify(r.at));
check('its outer face is over the water and its inner on dry ground; the channel beyond is a ship’s depth', r.outerH < .5 && r.innerH > .5 && r.beyondH < 0 && r.channelH < -1.4, `outer ${r.outerH} inner ${r.innerH} beyond ${r.beyondH} channel ${r.channelH}`);
check('walkable: four platforms at deck height (the bank\u2019s own, 1.1 to 3.0), and the ground under foot mid-quay is the deck', r.platforms === 4 && r.quayY >= 1.1 && r.quayY <= 3.0 && Math.abs(r.standY - r.quayY) < .05, `${r.platforms} platforms, stands at ${r.standY}, deck ${r.quayY}`);
check('a boat or two moored to it, a lantern lit at its end', r.boats >= 1 && r.boats <= 2 && r.lamps >= 1, `${r.boats} boats, ${r.lamps} lamps`);
check('no page errors', g.errs.length === 0, g.errs.join(' | '));
await g.close();
