// The old gate's mound is solid wherever its turf stands (Session 630; the critic, 7 Oct 2026, build s476). At the Crypt of
// Embers the solid behind the door was one box, .6 of the mound's depth, so walking in from behind you stopped at 8.8 with
// your head inside the turf, which runs past 11. Now the mound is solid in slices that follow its dome: wherever the turf
// stands more than .3 high you cannot stand, and a step past its foot is open ground. Session 2641: the crypt is a ring gate on the new
// look; the mound is read where it is still built (spawnPortalMeshes), and the crypt as its rings.
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
// the Crypt of Embers in the world. Session 2641: on the new look it is a ring gate (OG-037, #1991 A), no longer a mound; its hill is the
// world's own ground and its solids the kit's walls (the ringgate suite reads them at the nearest gate): here, that no mound stands at it,
// that its back plate and the headwall either side are walls, and that the walk from the court to the slit is open
// the crypt's door is placed when its cell loads; a slow runner may not have loaded it yet (CI, 8 Oct)
await page.waitForFunction(() => WORLD.dungeonPos[137], null, { timeout: 120000, polling: 500 }).catch(() => {});
const crypt = await page.evaluate(async () => { const w = WORLD.dungeonPos[137]; px = w.x; pz = w.z + 20;
  for (let i = 0; i < 400; i++) { WORLD.tick(1 / 60, performance.now()); if (i % 40 === 39) await new Promise(r => setTimeout(r, 50)); }
  let mound = 0; WORLD.scene.traverse(o => { if (o.name === 'oldGate' && Math.hypot(o.position.x - w.x, o.position.z - w.z) < 4) mound++; });
  const G = RING_GATES.get(137); if (!G || !G.group || !G.group.parent) return { found: false, mound }; const S = rgShape(), sol = (lx, lz) => { jumpY = G.y; return solidAt(...G.toW(lx, lz), .3); };
  const hfront = Math.sqrt(S.holeR ** 2 - S.CY ** 2), open = []; for (let z = 20; z >= G.plate + .7; z -= .5) if (sol(0, z)) open.push(z);
  return { found: true, mound, cond: G.cond, plate: sol(0, G.plate - .6), headL: sol(-(hfront + 2), S.FZ - 2), headR: sol(hfront + 2, S.FZ - 2), blocked: open }; });
console.log('  crypt', JSON.stringify(crypt));
check('every turf vertex of the mound standing .45 or more is out of the player\'s reach, at five seeds', built.every(b => b.turf > 100 && b.open === 0), built);
check('a metre past the mound\'s foot, behind and round it, is open ground (no wall in the air)', built.every(b => b.ringN > 10 && b.far === 0), built.map(b => b.far));
check('the Crypt of Embers is a ring gate in the world, with no mound at its door', crypt.found && crypt.mound === 0, crypt);
check('its back plate and the headwall either side are walls, and the walk from its court to the slit is open', crypt.found && crypt.plate && crypt.headL && crypt.headR && crypt.blocked.length === 0, crypt);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
