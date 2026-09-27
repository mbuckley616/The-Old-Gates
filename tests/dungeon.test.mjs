// The dungeon's shell (Session 189, playtest s162 item 7): walls, floor and ceiling are three merged meshes a floor, the
// walls faced only where they meet open ground, cut in stone courses, warped and bevelled, shaded darker at the foot.
import { boot, check } from './lib/game.mjs';
import { enterDungeon, dungeonShots } from './lib/dungeonshot.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
await enterDungeon(page, { theme: 'ruins', seed: 11 });
const r = await page.evaluate(() => { const out = {}; let meshes = 0; const shell = []; dScene.traverse(o => { if (o.isMesh) meshes++; if (o.userData && o.userData.dunShell) shell.push(o); });
  out.zone = activeZoneId; out.meshes = meshes; out.floors = dMap2 ? 2 : 1; out.shell = shell.map(o => o.userData.dunShell).filter(k => k !== 'beams').sort().join(','); out.beams = shell.filter(o => o.userData.dunShell === 'beams').map(o => o.geometry.index.count / 36);
  // no box left standing in for a wall cell
  let boxes = 0; dScene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry' && Math.abs(o.geometry.parameters.height - FLOOR_HEIGHT) < 1e-6 && o.geometry.parameters.width === 1) boxes++; }); out.wallBoxes = boxes;
  const W = shell.find(o => o.userData.dunShell === 'walls'), P = W.geometry.attributes.position, N = W.geometry.attributes.normal, C = W.geometry.attributes.color;
  // every wall vertex stays near a cell boundary (no gaps into the dark), and the faces look into open ground
  const wall = (c, r) => r < 0 || r >= dR || c < 0 || c >= dC || dMap[r][c] === 0; let far = 0, into = 0, n = 0;
  let cove = 0, cn = 0; for (let i = 0; i < P.count; i += 7) { const x = P.getX(i), z = P.getZ(i); if (P.getY(i) > FLOOR_HEIGHT - .01) { const ox = Math.round(x + N.getX(i) * .45), oz = Math.round(z + N.getZ(i) * .45); cove += Math.min(Math.abs(x - Math.round(x - .5) - .5), Math.abs(z - Math.round(z - .5) - .5)); cn++; } if (P.getY(i) > DUN_SHELL.COVE0 * FLOOR_HEIGHT) continue; const bx = Math.abs(x - Math.round(x - .5) - .5), bz = Math.abs(z - Math.round(z - .5) - .5); far = Math.max(far, Math.min(bx, bz));
    const ox = Math.round(x + N.getX(i) * .45), oz = Math.round(z + N.getZ(i) * .45); if (!wall(ox, oz)) into++; n++; }
  out.farFromGrid = +far.toFixed(3); out.coveTop = +(cove / cn).toFixed(3); out.facingOpen = +(into / n).toFixed(3);
  // darker at the foot of the wall than at head height
  let foot = 0, fn = 0, mid = 0, mn = 0; for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (y < .05) { foot += C.getX(i); fn++; } else if (Math.abs(y - 1.6) < .05) { mid += C.getX(i); mn++; } }
  out.foot = +(foot / fn).toFixed(2); out.mid = +(mid / mn).toFixed(2);
  // damp: the foot of a ruins wall goes green in patches (the green channel over the red)
  let gr = 0, rr0 = 0; for (let i = 0; i < P.count; i++) if (P.getY(i) < .05) { gr += C.getY(i); rr0 += C.getX(i); } out.dampGR = +(gr / rr0).toFixed(3);
  // the faces: one for every side of an open cell that meets a wall
  let sides = 0; for (let rr = 0; rr < dR; rr++) for (let c = 0; c < dC; c++) { if (wall(c, rr)) continue; for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (wall(c + dc, rr + dr)) sides++; }
  out.sides = sides; out.faces = P.count / ((DUN_SHELL.U + 1) * (DUN_SHELL.V + 1));
  // the floor covers every open cell but the stair and treasure cells (a ray straight down finds it)
  const F = shell.find(o => o.userData.dunShell === 'floor'); const ray = new THREE.Raycaster(); let miss = 0, tried = 0;
  for (let rr = 0; rr < dR; rr++) for (let c = 0; c < dC; c++) { const v = dMap[rr][c]; if (v === 0 || v === 3 || v === 6) continue; tried++; ray.set(new THREE.Vector3(c + .13, 1, rr - .21), new THREE.Vector3(0, -1, 0)); if (!ray.intersectObject(F).length) miss++; }
  out.floorMiss = miss; out.floorTried = tried;
  REN.render(dScene, CAM); out.calls = REN.info.render.calls; out.tris = REN.info.render.triangles;
  return out; });
check('the dungeon is built from a merged shell: walls, floor and ceiling, no box per wall cell', r.zone === 'dungeon' && r.shell === ['ceiling', 'floor', 'walls'].flatMap(k => Array(r.floors).fill(k)).join(',') && r.wallBoxes === 0 && r.meshes < 1600, r);
check('a wall face for every side of open ground that meets a wall, each facing into the open', r.faces === r.sides && r.facingOpen > .97, { faces: r.faces, sides: r.sides, facingOpen: r.facingOpen });
check('the warp and the bevels keep the wall within a quarter cell of its line (no gaps)', r.farFromGrid < .25, { far: r.farFromGrid });
check('the floor is under every ordinary open cell', r.floorMiss === 0 && r.floorTried > 50, { miss: r.floorMiss, tried: r.floorTried });
check('the wall darkens towards its foot', r.foot < r.mid * .75, { foot: r.foot, mid: r.mid });
check('the tops of the walls lean out over the room in a cove (Session 190)', r.coveTop > .2, { coveTop: r.coveTop, belowCoveMax: r.farFromGrid });
check('damp greens the foot of the walls in patches; the rooms have beams (Session 190)', r.dampGR > 1.05 && r.beams.length === r.floors && r.beams.every(n => n >= 2), { dampGR: r.dampGR, beams: r.beams });
const shots = await dungeonShots(page); shots.forEach((s, i) => fs.writeFileSync(`tests/out/dungeon-ruins-${i}.png`, Buffer.from(s.url.split(',')[1], 'base64')));
// a second theme and a fort's upper floor build too
await enterDungeon(page, { theme: 'goblin', seed: 5 });
const gob = await page.evaluate(() => { const s = []; dScene.traverse(o => { if (o.userData && o.userData.dunShell && o.userData.dunShell !== 'beams') s.push(o.userData.dunShell); }); return { zone: activeZoneId, shell: s.length }; });
await enterDungeon(page, { theme: 'ruins', seed: 23, interior: 'fort_tee', size: 'medium' });
const fort = await page.evaluate(() => { const s = []; dScene.traverse(o => { if (o.userData && o.userData.dunShell && o.userData.dunShell !== 'beams') s.push(o.userData.dunShell); }); return { zone: activeZoneId, interior: currentPortal.interior, upper: !!dMap2, shell: s.length }; });
check('another theme and a fort build (the fort\'s first floor keeps its own walls; its upper floor gets the shell)', gob.zone === 'dungeon' && gob.shell >= 3 && fort.zone === 'dungeon' && fort.shell === (fort.upper ? 3 : 0), { gob, fort });
console.log('  cost', JSON.stringify({ meshes: r.meshes, calls: r.calls, tris: r.tris }));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
