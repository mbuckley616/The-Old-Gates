// The old gate's mound is solid wherever its turf stands (Session 630; the critic, 7 Oct 2026, build s476). At the Crypt of
// Embers the solid behind the door was one box, .6 of the mound's depth, so walking in from behind you stopped at 8.8 with
// your head inside the turf, which runs past 11. Now the mound is solid in slices that follow its dome: wherever the turf
// stands more than .3 high you cannot stand, and a step past its foot is open ground.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
// built gates at five seeds, beside you: every turf vertex of the mound standing .45+ above its ground is out of reach of the
// player's .3 radius, and a ring a metre past the mound's foot behind it is open (the marker stones aside)
const built = await page.evaluate(() => { const out = [];
  for (const seed of [137, 4242, 7100, 9001, 31337]) { const x = px + 400, z = pz + 30, grp = new THREE.Group(); WORLD.scene.add(grp); const sol = [];
    spawnPortalMeshes(grp, [{ x, z, seed, theme: 'elemental', kind: 'cave_door', name: 'Test', id: 'dyn_m' + seed }], sol, () => 0);
    const G = grp.children.find(o => o.name === 'oldGate'), ty = G.position.y, mound = sol.filter(s => !(s.rx === .3 && s.rz === .3));
    const inSol = (qx, qz) => mound.some(s => Math.abs(qx - s.cx) < s.rx + .3 && Math.abs(qz - s.cz) < s.rz + .3);
    const ms = G.children.find(o => o.isMesh && !o.material.isMeshBasicMaterial), pa = ms.geometry.attributes.position, ca = ms.geometry.attributes.color;
    let turf = 0, open = 0, far = 0, maxZ = 0, maxX = 0;
    for (let i = 0; i < pa.count; i++) { const cr = ca.getX(i), cg = ca.getY(i), cb = ca.getZ(i); if (!(cg > cr && cg > cb && cg > .3)) continue;
      const lx = pa.getX(i), ly = pa.getY(i), lz = pa.getZ(i); if (ly < -.2) { maxZ = Math.max(maxZ, lz); maxX = Math.max(maxX, Math.abs(lx)); } if (ly < .45 || lz < .3) continue; turf++; if (!inSol(x + lx, z + lz)) open++; }
    // the foot: the turf's extent at ground level; a ring 1.0 outside it, behind the headwall, must be open
    const MC = 4.5, MD = maxZ - MC, MW = maxX; let ringN = 0;
    for (let k = 0; k <= 24; k++) { const a = Math.PI * k / 24, rx = Math.cos(a) * (MW + 1), rz = MC + Math.sin(a) * (MD + 1); if (rz < 1) continue; ringN++; if (inSol(x + rx, z + rz)) far++; }
    out.push({ seed, turf, open, ringN, far, foot: +maxZ.toFixed(2), slices: mound.length }); WORLD.scene.remove(grp); }
  return out; });
for (const b of built) console.log('  built', JSON.stringify(b));
// the Crypt of Embers in the world: walk in from 16 behind its door along the door's line until the world's solid stops you,
// then read the turf's height under you by a ray down onto the gate
const crypt = await page.evaluate(async () => { const w = WORLD.dungeonPos[137]; px = w.x; pz = w.z + 20;
  for (let i = 0; i < 400; i++) { WORLD.tick(1 / 60, performance.now()); if (i % 40 === 39) await new Promise(r => setTimeout(r, 50)); }
  let G = null, d = 1e9; WORLD.scene.traverse(o => { if (o.name === 'oldGate') { const k = Math.hypot(o.position.x - w.x, o.position.z - w.z); if (k < d) { d = k; G = o; } } });
  if (!G) return { found: false }; G.updateMatrixWorld(true); const gx = G.position.x, gz = G.position.z, rc = new THREE.Raycaster();
  const turfUnder = (x, z) => { rc.set(new THREE.Vector3(x, G.position.y + 20, z), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObjects(G.children, true)[0]; return h ? h.point.y - WORLD.worldH(x, z) : 0; };
  let stop = null; for (let b = 16; b >= 0; b -= .05) if (solidAt(gx, gz + b)) { stop = +(b + .05).toFixed(2); break; }
  let back = 0; for (let b = 16; b >= 0; b -= .1) if (turfUnder(gx, gz + b) > .05) { back = +b.toFixed(1); break; }
  // and from either side at the mound's middle
  const side = []; for (const s of [-1, 1]) { let st = null; for (let a = 14; a >= 0; a -= .05) if (solidAt(gx + s * a, gz + 4.5)) { st = a + .05; break; } side.push({ stop: +st.toFixed(2), turf: +turfUnder(gx + s * st, gz + 4.5).toFixed(2) }); }
  return { found: true, d: +d.toFixed(1), stop, turfAtStop: +turfUnder(gx, gz + stop).toFixed(2), back, side, threshold: !solidAt(gx, gz - .7), apron: !solidAt(gx, gz - 2) }; });
console.log('  crypt', JSON.stringify(crypt));
check('every turf vertex of the mound standing .45 or more is out of the player\'s reach, at five seeds', built.every(b => b.turf > 100 && b.open === 0), built);
check('a metre past the mound\'s foot, behind and round it, is open ground (no wall in the air)', built.every(b => b.ringN > 10 && b.far === 0), built.map(b => b.far));
check('at the Crypt of Embers, walking in from behind, you stop where the turf under you stands .35 or less', crypt.found && crypt.stop > 0 && crypt.turfAtStop <= .35, crypt);
check('and from either side the same', crypt.found && crypt.side.every(s => s.turf <= .35), crypt.side);
check('the threshold and the apron in front of the door are still open', crypt.threshold && crypt.apron, crypt);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
