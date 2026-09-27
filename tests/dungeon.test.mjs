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
  out.zone = activeZoneId; out.meshes = meshes; out.floors = dMap2 ? 2 : 1; out.shell = shell.map(o => o.userData.dunShell).filter(k => k === 'walls' || k === 'floor' || k === 'ceiling').sort().join(','); out.beams = shell.filter(o => o.userData.dunShell === 'beams').map(o => o.geometry.index.count / 36);
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
  // S191: the props are one mesh a floor; rubble lies at the foot of the walls; crates are the kit's rounded box
  const props = []; dScene.traverse(o => { if (o.userData && o.userData.dunShell === 'props') props.push(o); }); out.props = props.length;
  let nearWall = 0, pv = 0; if (props[0]) { const PP = props[0].geometry.attributes.position; for (let i = 0; i < PP.count; i += 11) { const x = PP.getX(i), z = PP.getZ(i); if (PP.getY(i) > .6) continue; pv++;
    const c = Math.round(x), rr = Math.round(z); if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => wall(c + dc, rr + dr) && Math.abs((dc ? x - c : z - rr) * (dc || dr)) > .15)) nearWall++; } }
  out.rubbleByWalls = pv ? +(nearWall / pv).toFixed(2) : 0;
  const rb = SK.rbox(1, 1, 1, .1, 3); let far2 = 0; const RP = rb.attributes.position; for (let i = 0; i < RP.count; i++) far2 = Math.max(far2, Math.hypot(RP.getX(i), RP.getY(i), RP.getZ(i))); out.rboxCorner = +far2.toFixed(3); rb.dispose();
  REN.render(dScene, CAM); out.calls = REN.info.render.calls; out.tris = REN.info.render.triangles;
  return out; });
check('the dungeon is built from a merged shell: walls, floor and ceiling, no box per wall cell', r.zone === 'dungeon' && r.shell === ['ceiling', 'floor', 'walls'].flatMap(k => Array(r.floors).fill(k)).join(',') && r.wallBoxes === 0 && r.meshes < 1600, r);
check('a wall face for every side of open ground that meets a wall, each facing into the open', r.faces === r.sides && r.facingOpen > .97, { faces: r.faces, sides: r.sides, facingOpen: r.facingOpen });
check('the warp and the bevels keep the wall within a quarter cell of its line (no gaps)', r.farFromGrid < .25, { far: r.farFromGrid });
check('the floor is under every ordinary open cell', r.floorMiss === 0 && r.floorTried > 50, { miss: r.floorMiss, tried: r.floorTried });
check('the wall darkens towards its foot', r.foot < r.mid * .75, { foot: r.foot, mid: r.mid });
check('the tops of the walls lean out over the room in a cove (Session 190)', r.coveTop > .2, { coveTop: r.coveTop, belowCoveMax: r.farFromGrid });
check('damp greens the foot of the walls in patches; the rooms have beams (Session 190)', r.dampGR > 1.05 && r.beams.length === r.floors && r.beams.every(n => n >= 2), { dampGR: r.dampGR, beams: r.beams });
// the doors (Session 206): planks, straps and a ring on the hinge, a stone frame that stays; a picture of one
const door = await page.evaluate(() => { const D = DOORS.filter(d => d.hinge); if (!D.length) return { n: 0 }; const d = D[0];
  const ok = D.filter(x => x.hinge.children.some(o => o.userData && o.userData.dunShell === 'door') && x.mesh.children.some(o => o.userData && o.userData.dunShell === 'doorframe')).length;
  const cam = new THREE.PerspectiveCamera(55, REN.domElement.width / REN.domElement.height, .05, 40); const ex = d.isEW ? 2.2 : 0, ez = d.isEW ? 0 : 2.2; const side = dMap[Math.round(d.z + ez)] && dMap[Math.round(d.z + ez)][Math.round(d.x + ex)] > 0 ? 1 : -1;
  cam.position.set(d.x + ex * side + .4, 1.5, d.z + ez * side + .3); cam.lookAt(d.x, 1.3, d.z); const L = new THREE.PointLight(0xffc080, 2, 8); L.position.copy(cam.position); dScene.add(L); dScene.updateMatrixWorld(true); REN.render(dScene, cam); dScene.remove(L);
  const o = document.createElement('canvas'); o.width = REN.domElement.width; o.height = REN.domElement.height; o.getContext('2d').drawImage(REN.domElement, 0, 0); return { n: D.length, ok, url: o.toDataURL() }; });
if (door.url) fs.writeFileSync('tests/out/dungeon-door.png', Buffer.from(door.url.split(',')[1], 'base64')); delete door.url;
check('the doors are planked, strapped and framed in stone (Session 206)', door.n > 0 && door.ok === door.n, door);
const shots = await dungeonShots(page); shots.forEach((s, i) => fs.writeFileSync(`tests/out/dungeon-ruins-${i}.png`, Buffer.from(s.url.split(',')[1], 'base64')));
// a second theme and a fort's upper floor build too
await enterDungeon(page, { theme: 'goblin', seed: 5 });
const gob = await page.evaluate(() => { const s = []; dScene.traverse(o => { if (o.userData && o.userData.dunShell && /^(walls|floor|ceiling)$/.test(o.userData.dunShell)) s.push(o.userData.dunShell); }); return { zone: activeZoneId, shell: s.length }; });
await enterDungeon(page, { theme: 'ruins', seed: 23, interior: 'fort_tee', size: 'medium' });
const fort = await page.evaluate(() => { const s = []; dScene.traverse(o => { if (o.userData && o.userData.dunShell && /^(walls|floor|ceiling)$/.test(o.userData.dunShell)) s.push(o.userData.dunShell); }); return { zone: activeZoneId, interior: currentPortal.interior, upper: !!dMap2, shell: s.length }; });
check('another theme and a fort build, the fort\'s first floor on the shell too (Session 197)', gob.zone === 'dungeon' && gob.shell >= 3 && fort.zone === 'dungeon' && fort.shell === (fort.upper ? 6 : 3), { gob, fort });
check('the props are one merged mesh a floor, much of the rubble lying along the walls (Session 191)', r.props === r.floors && r.rubbleByWalls > .3, { props: r.props, rubbleByWalls: r.rubbleByWalls });
check('the kit\'s rounded box has rounded corners (a unit cube with radius .1 reaches .793, not .866)', Math.abs(r.rboxCorner - (Math.sqrt(3) * .4 + .1)) < .005, { corner: r.rboxCorner });
const bar = await page.evaluate(() => { const B = BARRELS.filter(b => b.displayName === 'Barrel'); return { n: B.length, kit: B.filter(b => b.mesh.children.some(o => o.userData && o.userData.dunShell === 'barrel') && b.top && b.top.parent === b.mesh).length }; });
check('the dungeon\'s barrels are the kit\'s barrel, the lid still its own to pop off (Session 200)', bar.n === 0 || bar.kit === bar.n, bar);
console.log('  cost', JSON.stringify({ meshes: r.meshes, calls: r.calls, tris: r.tris }));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
