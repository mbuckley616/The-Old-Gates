// node docs/prototypes/paintover/shoot.mjs [--probe] -> docs/prototypes/paintover/*.png (Session 751): the game as it
// stands, at fixed places and hours, with no HUD, for paintovers against the concept art brief. Each picture is the
// world scene rendered from its own camera at 1920x1080 (the renderer is resized for it: the game's frame is 600 px tall). --only=05,10 limits it to keys starting so. --probe writes a 2x2 contact sheet of four views per place
// to tests/tmp/paintover-probe-<key>.png instead, for choosing the view.
import { boot } from '../../../tests/lib/game.mjs';
import { enterDungeon } from '../../../tests/lib/dungeonshot.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..', '..');
const PROBE = process.argv.includes('--probe'), ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const wanted = k => !ONLY.length || ONLY.some(o => k.startsWith(o));
// where: a site by name, 'door:<gate name>', 'quay:<port name>', or a fixed {x, z, name} (vista: true looks down from 3 up).
// view: 'in' stands at the place and looks out; 'out' stands d away and looks at it. pick: which of the four views
// (0..3, a quarter turn each from north) the final picture uses; turn: a further turn in radians.
const SPOTS = [
  { key: '02-gatelands-road', where: 'Hearthwick', view: 'out', d: 75, hour: 8, pick: 1 },
  { key: '03-town-square', where: 'Dunmore', settle: true, view: 'in', hour: 18, pick: 1 },
  { key: '04-village-street', where: "Colmán's Rest", settle: true, view: 'in', hour: 12, pick: 3 },
  { key: '05-old-gate', where: 'door:The Dungeon of Shadows', view: 'out', d: 14, turn: Math.PI / 4, hour: 11, pick: 1 },
  { key: '09-ashfeld', where: 'The Ashfeld', view: 'in', hour: 15, pick: 2 },
  { key: '10-harbour', where: 'quay:Portclare', settle: true, view: 'out', d: 40, hour: 16, pick: 1 },
  { key: '11-carraig-mor', where: 'Carraig Mór', settle: true, view: 'in', hour: 13, pick: 2 },
  { key: '02b-vista', where: { x: 12296, z: 25943, name: 'a hill above the coast, south-west of the start', vista: true }, view: 'in', hour: 9, pick: 1 },
];
const g = await boot(); const { page } = g; await g.intoWorld();
await page.evaluate(() => WORLD.devUnlockAll());
const drain = () => page.evaluate(() => { for (let k = 0; k < 900 && (WORLD.jobs.length || [...WORLD.LOADED.values()].some(L => L.pending)); k++) { WORLD.tick(1 / 60, performance.now());
  while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } } });
const out = PROBE ? path.join(ROOT, 'tests', 'tmp') : here; fs.mkdirSync(out, { recursive: true });
const made = [];
for (const s of SPOTS) {
  if (!wanted(s.key)) continue;
  const at = await page.evaluate((s) => {
    if (typeof s.where === 'object') return s.where;
    if (s.where.startsWith('door:')) { const d = WORLD.DOORS.map(e => ({ e, p: dungeonWorldPos[e.seed] })).find(o => o.p && o.e.canonicalName === s.where.slice(5));
      return d ? { x: d.p.x, z: d.p.z, name: d.e.canonicalName || 'an old gate' } : null; }
    if (s.where.startsWith('quay:')) { const t = WORLD.SITES.find(q => q.name === s.where.slice(5)); return t && t.quayStart ? { x: t.quayStart.x, z: t.quayStart.z, id: t.id, name: t.name + "'s quay" } : null; }
    const t = WORLD.SITES.find(q => q.name === s.where); return t ? { x: t.x, z: t.z, id: t.id, name: t.name } : null; }, s);
  if (!at) { console.log('no place for', s.key); continue; }
  await page.evaluate(([x, z]) => { px = x; pz = z + 6; }, [at.x, at.z]);
  if (s.settle && at.id) await g.settle(at.id);
  await drain();
  await page.evaluate((h) => { forceTime(h); }, s.hour); await g.spin('clear', 30); await drain();
  await page.waitForTimeout(3000); await g.hide();
  const tiles = await page.evaluate(([s, at, probe]) => {
    if (!probe) { REN.setPixelRatio(1); REN.setSize(1920, 1080, false); }
    const cv = REN.domElement, W = cv.width, H = cv.height, cam = new THREE.PerspectiveCamera(58, W / H, .3, 4000);
    const gy = (x, z) => Math.max(WORLD.worldH(x, z), WORLD.SEA_Y);
    const views = []; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + (s.turn || 0), dx = Math.sin(a), dz = Math.cos(a);
      if (s.view === 'out') { const cx = at.x + dx * s.d, cz = at.z + dz * s.d; views.push({ cx, cz, ch: gy(cx, cz) + 1.7, lx: at.x, lz: at.z, lh: gy(at.x, at.z) + 4 }); }
      else { const cx = at.x, cz = at.z, lx = at.x + dx * 40, lz = at.z + dz * 40; views.push({ cx, cz, ch: gy(cx, cz) + (at.vista ? 3 : 1.7), lx, lz, lh: gy(cx, cz) + (at.vista ? -6 : 1.2) }); } }
    const want = probe ? views : [views[s.pick]]; const res = [];
    for (const v of want) { px = v.cx; pz = v.cz; cam.position.set(v.cx, v.ch, v.cz); cam.lookAt(v.lx, v.lh, v.lz); CAM.position.copy(cam.position); CAM.quaternion.copy(cam.quaternion); CAM.updateMatrixWorld(true);
      for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); REN.render(WORLD.scene, cam);
      const tw = probe ? 640 : W, th = probe ? 360 : H, o = document.createElement('canvas'); o.width = tw; o.height = th; o.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, tw, th); res.push(o); }
    if (!probe) return res[0].toDataURL();
    const c = document.createElement('canvas'); c.width = 1280; c.height = 720; const x = c.getContext('2d'); res.forEach((o, i) => x.drawImage(o, (i % 2) * 640, Math.floor(i / 2) * 360)); x.fillStyle = '#fff'; x.font = '20px sans-serif'; res.forEach((o, i) => x.fillText(String(i), (i % 2) * 640 + 8, Math.floor(i / 2) * 360 + 26)); return c.toDataURL(); }, [s, at, PROBE]);
  const f = path.join(out, (PROBE ? 'paintover-probe-' : '') + s.key + '.png'); fs.writeFileSync(f, Buffer.from(tiles.split(',')[1], 'base64')); made.push(f); console.log(s.key, at.name, Math.round(at.x), Math.round(at.z), '->', path.relative(ROOT, f));
}
// a corridor inside an old gate, the dungeon's own camera and a carried lantern (tests/lib/dungeonshot.mjs)
if (wanted('06')) {
  await enterDungeon(page, { theme: 'ruins', seed: 11, size: 'medium' });
  const url = await page.evaluate((probe) => { if (!probe) { REN.setPixelRatio(1); REN.setSize(1920, 1080, false); CAM.aspect = 16 / 9; CAM.updateProjectionMatrix(); } const open = (c, r) => r >= 0 && r < dR && c >= 0 && c < dC && dMap[r][c] > 0 && dMap[r][c] !== 2; let best = null;
    for (let r = 1; r < dR - 1; r++) for (let c = 1; c < dC - 1; c++) { if (!open(c, r)) continue; for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let n = 0; while (open(c + dc * (n + 1), r + dr * (n + 1)) && n < 14) n++; let w = 0; for (let k = 1; k <= Math.min(n, 5); k++) w += (open(c + dc * k + dr, r + dr * k + dc) ? 1 : 0) + (open(c + dc * k - dr, r + dr * k - dc) ? 1 : 0); const sc = n + w * .7; if (!best || sc > best.sc) best = { c, r, dc, dr, sc }; } }
    const p = best; px = p.c; pz = p.r; yaw = Math.atan2(-p.dc, -p.dr); CAM.position.set(px, 1.55, pz); CAM.rotation.order = 'YXZ'; CAM.rotation.set(-.06, yaw, 0);
    const L = new THREE.PointLight(0xffa860, 1.6, 12); L.position.set(px + Math.sin(yaw) * .3, 1.5, pz + Math.cos(yaw) * .3); dScene.add(L); CAM.updateMatrixWorld(true); REN.render(dScene, CAM);
    const cv = REN.domElement, o = document.createElement('canvas'); o.width = probe ? 640 : cv.width; o.height = probe ? 360 : cv.height; o.getContext('2d').drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, o.width, o.height); dScene.remove(L); return o.toDataURL(); }, PROBE);
  const f = path.join(out, (PROBE ? 'paintover-probe-' : '') + '06-inside-a-gate.png'); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log('06-inside-a-gate ->', path.relative(ROOT, f));
}
console.log('errs', g.errs.slice(0, 5)); await g.close();
