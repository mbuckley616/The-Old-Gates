// The coast's old boats (Session 218, H.5b): the Carraig Mór – Inis Rua ferry and Salthaven's beached rowboat were
// half-spheres; they are now the harbours' clinker boat (Session 168's bake), moored along the dock or upturned on the sand.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const out = {};
for (const [zone, x, z, bx, bz] of [["carraig_mor", 30, 50, 30, 67.1], ["inis_rua", 25, 10, 25, -5.1], ['salthaven', 22, 40, 22, 46]]) {
  await page.evaluate(([zone, x, z]) => goToZone(zone, x, z, 0, 'test'), [zone, x, z]);
  for (let k = 0; k < 30 && !(await page.evaluate(zone => activeZoneId === zone, zone)); k++) await page.waitForTimeout(500);
  await page.waitForTimeout(2500); await g.hide();
  out[zone] = await page.evaluate(([bx, bz]) => { const Z = ZONES[activeZoneId]; const sc = Z && Z.scene; if (!sc) return { noScene: true }; const boats = [];
    sc.traverse(o => { if (o.isMesh && o.material === WORLD.SHIP_MAT) boats.push(o); }); const near = boats.find(b => Math.hypot(b.position.x - bx, b.position.z - bz) < 1);
    const halfSpheres = []; sc.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'SphereGeometry' && o.scale.x >= 2 && Math.hypot(o.position.x - bx, o.position.z - bz) < 2) halfSpheres.push(o); });
    return { zone: activeZoneId, boats: boats.length, near: !!near, upturned: near ? Math.abs(Math.abs(near.rotation.z) - Math.PI) < .01 : null, len: near ? +(new THREE.Box3().setFromObject(near).getSize(new THREE.Vector3()).x).toFixed(2) : null, oldHull: halfSpheres.length }; }, [bx, bz]);
  if (zone === 'carraig_mor') { const shot = await page.evaluate(([bx, bz]) => { const sc = ZONES[activeZoneId].scene; const cam = new THREE.PerspectiveCamera(45, REN.domElement.width / REN.domElement.height, .1, 200);
      const y = activeTerrainH(bx, bz - 8); cam.position.set(bx + 5, y + 3.5, bz - 9); cam.lookAt(bx, y, bz); REN.render(sc, cam); const o = document.createElement('canvas'); o.width = REN.domElement.width; o.height = REN.domElement.height; o.getContext('2d').drawImage(REN.domElement, 0, 0); return o.toDataURL(); }, [bx, bz]);
    fs.writeFileSync('tests/out/ferry.png', Buffer.from(shot.split(',')[1], 'base64')); }
}
check('the Carraig Mór ferry is the clinker boat, moored along the dock (a 4.8 hull; stem, rudder and oars take its box to under 6.2), the half-sphere gone', out.carraig_mor.near && out.carraig_mor.oldHull === 0 && out.carraig_mor.len > 4.5 && out.carraig_mor.len < 6.2, out.carraig_mor);
check('the same boat at Inis Rua\'s dock', out.inis_rua.near && out.inis_rua.oldHull === 0, out.inis_rua);
check('Salthaven\'s rowboat is the clinker boat upturned on the sand', out.salthaven.near && out.salthaven.upturned && out.salthaven.oldHull === 0, out.salthaven);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
