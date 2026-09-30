// The legacy builder's rooms on the kit shell (Session 356, #62 A): Hearthwick's shops, inn, church, keep, homes and the
// safehouse, built by buildInterior, take the generated rooms' boarded ceiling, shaded walls and frame (S342), plastered in
// the Gatelands, the church and the keep ashlar; the box beams and the box door are gone. The legacy rooms keep no furniture
// solids, so a post is left out wherever the furniture reaches its column.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const TYPES = ['weapon', 'armor', 'potion', 'misc', 'inn', 'church', 'castle', 'safehouse', 'home'];
const r = await page.evaluate(TYPES => { const out = {}, pics = [];
  for (const type of TYPES) { const house = { id: 'legacy_' + type, type, name: 'Test', keeper: '' }; buildInterior(house); const sc = interiorScene; sc.updateMatrixWorld(true);
    let W = 0, D = 0, H = 0, ceilTex = false; sc.traverse(o => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && Math.abs(o.rotation.x - Math.PI / 2) < 1e-6 && o.position.y > H) { H = o.position.y; ceilTex = !!o.material.map; W = o.geometry.parameters.width; D = o.geometry.parameters.height; } });
    const shell = sc.children.find(o => o.userData.shell), door = sc.children.find(o => o.userData.entrance);
    const oldDoor = sc.children.some(o => o.isMesh && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.width === .8 && o.geometry.parameters.height === 1.5);
    const oldBeams = sc.children.filter(o => o.isMesh && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.width === W && o.geometry.parameters.height === .12).length;
    const shaded = sc.children.filter(o => o.userData.shaded && o.material.vertexColors).length;
    // an independent look at each post: sample points up its column and ask whether any furniture triangle's box holds one
    const furn = []; sc.traverse(o => { if (!o.isMesh) return; for (let q = o; q && q !== sc; q = q.parent) if (q.userData.shaded || q.userData.rug || q.userData.windows || q.userData.shell || q.userData.entrance) return; if (['PlaneGeometry', 'CircleGeometry', 'ShapeGeometry', 'SphereGeometry'].includes(o.geometry.type)) return; furn.push(o); });
    const at = shell ? shell.userData.shell.at : []; let clash = 0; const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    for (const [x, z] of at) { let hit = false; for (const o of furn) { const pos = o.geometry.attributes.position, idx = o.geometry.index, n = idx ? idx.count : pos.count;
        for (let i = 0; i < n && !hit; i += 3) { for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(pos, idx ? idx.getX(i + k) : i + k).applyMatrix4(o.matrixWorld);
          const bx0 = Math.min(v[0].x, v[1].x, v[2].x), bx1 = Math.max(v[0].x, v[1].x, v[2].x), bz0 = Math.min(v[0].z, v[1].z, v[2].z), bz1 = Math.max(v[0].z, v[1].z, v[2].z), by0 = Math.min(v[0].y, v[1].y, v[2].y), by1 = Math.max(v[0].y, v[1].y, v[2].y);
          for (let y = .2; y < H - .4 && !hit; y += .2) if (x > bx0 - .05 && x < bx1 + .05 && z > bz0 - .05 && z < bz1 + .05 && y >= by0 && y <= by1) hit = true; } if (hit) break; } if (hit) clash++; }
    let inside = null; if (shell) { const bb = new THREE.Box3().setFromObject(shell); inside = bb.min.x > -.02 && bb.max.x < W + .02 && bb.min.z > -.02 && bb.max.z < D + .02 && bb.min.y > -.02 && bb.max.y < H + .02; }
    let doorAt = null; if (door) { const bb = new THREE.Box3().setFromObject(door); doorAt = [+((bb.min.x + bb.max.x) / 2 - W / 2).toFixed(2), +(bb.min.z - D).toFixed(2), +bb.max.y.toFixed(2)]; }
    out[type] = { W, D, H, ceilTex, tris: shell && shell.userData.tris, doorTris: door && door.userData.tris, posts: at.length, stone: shell && shell.userData.shell.stone, clash, inside, doorAt, oldDoor, oldBeams, shaded };
    if (['weapon', 'inn', 'church', 'castle', 'safehouse', 'home'].includes(type)) { const cv = REN.domElement, cam = new THREE.PerspectiveCamera(62, cv.width / cv.height, .05, 60);
      if (type === 'castle') { cam.position.set(W / 2 - 2.5, 1.8, D - 1); cam.lookAt(W / 2, 2.2, 2); } else if (type === 'church') { cam.position.set(W / 2 - 1.2, 1.6, D - .6); cam.lookAt(W / 2, 1.6, 1.5); } else { cam.position.set(W * .8, 1.3, D - .6); cam.lookAt(W * .25, 1.2, D * .3); }
      REN.render(sc, cam); const o = document.createElement('canvas'); o.width = 480; o.height = 270; const x = o.getContext('2d'); x.drawImage(cv, 0, 0, 480, 270); x.fillStyle = '#000a'; x.fillRect(0, 0, 130, 24); x.fillStyle = '#fff'; x.font = 'bold 16px serif'; x.fillText('legacy ' + type, 6, 17); pics.push(o); } }
  const c = document.createElement('canvas'); c.width = 960; c.height = 270 * Math.ceil(pics.length / 2); const x = c.getContext('2d'); pics.forEach((o, i) => x.drawImage(o, (i % 2) * 480, Math.floor(i / 2) * 270)); out._png = c.toDataURL(); return out; }, TYPES);
fs.writeFileSync('tests/out/legacyshells-ingame.png', Buffer.from(r._png.split(',')[1], 'base64')); delete r._png;
console.log(JSON.stringify(r));
check('every legacy room has the kit shell and the plank door, and no box door or box beams', TYPES.every(t => r[t].tris > 0 && r[t].doorTris > 0 && !r[t].oldDoor && r[t].oldBeams === 0), Object.fromEntries(TYPES.map(t => [t, [r[t].tris, r[t].doorTris, r[t].oldDoor, r[t].oldBeams]])));
check('the four walls are shaded in their vertex colours and the ceiling is boarded', TYPES.every(t => r[t].shaded === 4 && r[t].ceilTex), Object.fromEntries(TYPES.map(t => [t, [r[t].shaded, r[t].ceilTex]])));
check('the church and the keep are ashlar with no posts; the Gatelands rooms are plastered and stand on posts', ['church', 'castle'].every(t => r[t].stone && r[t].posts === 0) && TYPES.filter(t => t !== 'church' && t !== 'castle').every(t => !r[t].stone && r[t].posts >= 4), Object.fromEntries(TYPES.map(t => [t, [r[t].stone, r[t].posts]])));
check('no post stands in the furniture', TYPES.every(t => r[t].clash === 0), Object.fromEntries(TYPES.map(t => [t, r[t].clash])));
check('the shell lies inside the walls and under the ceiling; the door is centred on the south wall (2.3 tall in the church and the keep, 1.5 elsewhere, with its head)', TYPES.every(t => r[t].inside && Math.abs(r[t].doorAt[0]) < .05 && r[t].doorAt[1] > -.3 && r[t].doorAt[1] < 0 && (/church|castle/.test(t) ? r[t].doorAt[2] > 2.4 && r[t].doorAt[2] < 2.7 : r[t].doorAt[2] > 1.55 && r[t].doorAt[2] < 1.75)), Object.fromEntries(TYPES.map(t => [t, [r[t].inside, r[t].doorAt]])));
check('the shell costs 1.5–25k triangles a room (the smallest rooms under 2k)', TYPES.every(t => r[t].tris > 1500 && r[t].tris < 25000), Object.fromEntries(TYPES.map(t => [t, r[t].tris])));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
