// Signposts and name boards on the kit (Session 253, H.5, Michael's A on buildings): one vertex-coloured mesh each, a
// round post on a cairn with plank arms cut to a point, a framed board on round posts; the lettering on the faces.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
await page.evaluate(() => { for (let k = 0; k < 600 && (WORLD.jobs.length || [...WORLD.LOADED.values()].some(L => L.pending || !L.staticsBuilt)); k++) { WORLD.tick(1 / 60, performance.now());
  while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } } });
const r = await page.evaluate(() => {
  const sp = WORLD.signpostGeo([0, 1.9, 3.8], 11), nb = WORLD.nameBoardGeo(5); const p = sp.attributes.position, q = nb.attributes.position;
  let armX = 0, tipZ = 0, top = 0; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); top = Math.max(top, y); if (Math.abs(y - 2.7) < .2 && z > .3 && z < 1.6) armX = Math.max(armX, Math.abs(x)); if (Math.abs(y - 2.7) < .2 && Math.abs(x) < .1) tipZ = Math.max(tipZ, z); }
  let face = 0; for (let i = 0; i < q.count; i++) { const x = q.getX(i), y = q.getY(i), z = q.getZ(i); if (Math.abs(x) < 1.2 && Math.abs(y - 2) < .25) face = Math.max(face, Math.abs(z)); }
  // a real town's signpost and name board: the nearest town to the start with a road in, by the builder's own placing
  let t = null, best = 1e9; for (const s of WORLD.SITES) { if (!(s.pad > 0)) continue; const outs = WORLD.ROAD_DEFS.filter(d => d.a === s.id || d.b === s.id).map(d => WORLD.SITE[d.a === s.id ? d.b : d.a]).filter(Boolean); if (!outs.length) continue; const d = Math.hypot(s.x - px, s.z - pz); if (d < best) { best = d; t = { s, o: outs[0] }; } }
  const shots = {}; if (t) { const { s, o } = t; const dx = o.x - s.x, dz = o.z - s.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L; const sx = s.x + ux * (s.pad + 4) - uz * 4, sz = s.z + uz * (s.pad + 4) + ux * 4, bx = s.x + ux * (s.pad + 3) - uz * 3.4, bz = s.z + uz * (s.pad + 3) + ux * 3.4;
    forceTime(12); const cam = new THREE.PerspectiveCamera(50, REN.domElement.width / REN.domElement.height, .1, 400); const snap = (cx, cz, lx, ly, lz) => { cam.position.set(cx, WORLD.worldH(cx, cz) + 2.4, cz); cam.lookAt(lx, ly, lz); CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f; const c = document.createElement('canvas'); c.width = REN.domElement.width; c.height = REN.domElement.height; c.getContext('2d').drawImage(REN.domElement, 0, 0); return c.toDataURL(); };
    const ys = WORLD.worldH(sx, sz); shots.signpost = snap(sx + ux * 4.5 + uz * 1.5, sz + uz * 4.5 - ux * 1.5, sx, ys + 2.2, sz);
    const yb = WORLD.worldH(bx, bz); shots.board = snap(bx + ux * 5 - uz * 1, bz + uz * 5 + ux * 1, bx, yb + 1.7, bz);
    t = { id: s.id, sol: WORLD.STATIC_SOL.some(q => Math.abs(q.cx - sx) < .01 && Math.abs(q.cz - sz) < .01 && q.rx === .25), board: WORLD.STATIC_SOL.some(q => Math.abs(q.cx - bx) < .01 && Math.abs(q.cz - bz) < .01 && q.rx === 1.4) }; }
  return { sp: { tris: p.count / 3, top: +top.toFixed(2), armX: +armX.toFixed(3), tipZ: +tipZ.toFixed(2) }, nb: { tris: q.count / 3, face: +face.toFixed(3) }, t, shots }; });
for (const [k, u] of Object.entries(r.shots)) fs.writeFileSync(`tests/out/signpost-${k}.png`, Buffer.from(u.split(',')[1], 'base64'));
delete r.shots; console.log(JSON.stringify(r));
check('a signpost is one mesh of under 2.5k triangles, no taller than the old post with a cap (3.5)', r.sp.tris < 2500 && r.sp.top <= 3.5, r.sp);
check('its arms reach to their points (1.72) and their faces lie inside the lettering (.068 out)', Math.abs(r.sp.tipZ - 1.72) < .02 && r.sp.armX > .05 && r.sp.armX < .068, r.sp);
check('the name board is one mesh of under 2k triangles, its face inside its lettering (.05 out)', r.nb.tris < 2000 && r.nb.face < .05, r.nb);
check('a real town\'s signpost and name board keep their colliders', r.t && r.t.sol && r.t.board, r.t);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
