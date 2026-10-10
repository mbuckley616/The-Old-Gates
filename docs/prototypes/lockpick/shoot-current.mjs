// Today's build for the lock page: a shop door in Dunmore at 11 pm (a town lock: the world runs while you pick) and a
// locked treasure chest in a dungeon (the game pauses). For each it photographs today's #lockpick mid-work (two pins set,
// the third rising) and a plate of the same view without it (plate-town.jpg, plate-dungeon.jpg; the HUD left on, for
// scale). current.json holds what the page prints: the titles, the pin counts and timings from lpDifficulty, the picks,
// the status lines, and the spread of the hold window over the world's dungeon doors and Dunmore's doors.
// node docs/prototypes/lockpick/shoot-current.mjs
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const data = {};
// a shop door at night, nobody about
await page.evaluate(() => { document.getElementById('g').style.height = '720px'; window.dispatchEvent(new Event('resize')); });
data.town = await page.evaluate(() => { forceTime(23); worldState.crime = {}; try { closeDialog(); } catch (e) {} const S = WORLD.settle.get('dunmore');
  const h = S.houses.find(x => /misc/.test(x.type) && x.keeper) || S.houses.find(x => /weapon|armor|potion/.test(x.type) && x.keeper); window._h = h;
  BAG.push({ name: 'Lockpick', ico: '🗝', type: 'misc', qty: 7 }); playerName = 'Aoife'; level = 5; gold = 417;
  window._park = () => S.npcs.forEach(n => { n.g.visible = false; n.g.position.set(S.site.x + 400, 0, S.site.z + 400); if (n.sched) n.sched = { type: 'guard', a: { x: S.site.x + 400, z: S.site.z + 400 }, b: { x: S.site.x + 400, z: S.site.z + 400 } }; });
  window._park(); const f = () => { if (activeZoneId !== 'world' || typeof isInterior === 'function' && isInterior()) return; window._park(); requestAnimationFrame(f); }; requestAnimationFrame(f); /* residents spawn in as the world runs: park them every frame, as livepick does */
  const dx = h.exitX - h.doorX, dz = h.exitZ - h.doorZ, L = Math.hypot(dx, dz) || 1; const sx = -dz / L, sz = dx / L; px = h.doorX + dx / L * 5.2 + sx * 2.2; pz = h.doorZ + dz / L * 5.2 + sz * 2.2; jumpY = 0;
  yaw = Math.atan2(px - h.doorX, pz - h.doorZ) + .28; pitch = -.02; if (typeof VM_SCENE !== 'undefined') VM_SCENE.visible = false; updateHUD();
  const lock = WORLD.doorLockFor(h); const d = lpDifficulty(lock);
  return { house: h.name, keeper: h.keeper, type: h.type, site: S.site.name, lockTitle: lock.lockTitle, pins: d.pins, dwell: d.dwell, fall: d.fall, rise: LP.rise, finesse: attrEff('finesse') }; });
await g.spin(null, 30); await g.hide(); await page.evaluate(() => { try { closeDialog(); } catch (e) {} }); await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(here, 'plate-town.jpg'), type: 'jpeg', quality: 84 });
const work = async () => page.evaluate(() => { LP.pins[0].set = true; LP.pins[0].y = 1; LP.pins[1].set = true; LP.pins[1].y = 1; LP.cur = 2; LP.pushed = performance.now() - LP.rise * .55; LP.phase = 'rise'; lpStatus('Now — let it go at the top.'); });
await page.evaluate(() => tryLockpick(WORLD.doorLockFor(window._h))); await work(); await page.waitForTimeout(40);
await page.evaluate(() => { LP.pushed = 0; LP.pins[2].y = .55; cancelAnimationFrame(LP.raf); LP.raf = 0; lpRender(); });
data.town.title = await page.evaluate(() => document.getElementById('lp-title').textContent);
data.town.picks = await page.evaluate(() => document.getElementById('lp-picks').textContent);
data.town.keys = await page.evaluate(() => document.getElementById('lp-keys').textContent);
data.town.live = await page.evaluate(() => LP.live);
await page.screenshot({ path: path.join(here, 'current-town.png') });
await page.evaluate(() => closeLockpick());
// the hold window over Dunmore's doors (finesse as it stands, 0 and 5)
data.window = await page.evaluate(() => { const out = {}; const S = WORLD.settle.get('dunmore'); const f0 = ATTRS.finesse;
  for (const fin of [0, f0, 5]) { ATTRS.finesse = fin; const ws = S.houses.filter(h => h.doorX != null).map(h => lpDifficulty(WORLD.doorLockFor(h)));
    const dd = []; for (let k = 0; k < 400; k++) for (const fl of [1, 2, 3, 4]) dd.push(lpDifficulty({ seed: 'dd' + k, floor: fl }));
    const dc = []; for (let k = 0; k < 400; k++) dc.push(lpDifficulty({ x: k * 3, z: k * 7, floor: 1 + k % 4, lockBonus: 1 }));
    const st = a => ({ n: a.length, min: Math.min(...a.map(x => x.dwell)), max: Math.max(...a.map(x => x.dwell)), under150: a.filter(x => x.dwell < 150).length, pins: [2, 3, 4, 5].map(p => a.filter(x => x.pins === p).length) });
    out['fin' + fin] = { dunmore: st(ws), dungeonDoors: st(dd), treasure: st(dc) }; }
  ATTRS.finesse = f0; return out; });
// a dungeon
data.dungeon = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms));
  const seeds = []; for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) { const c = WORLD.getCell(i, j); for (const e of (c && c.doors) || []) if (e && e.seed != null && !e.lair) seeds.push(e.seed); }
  const e = WORLD.doorAnywhere(seeds[Math.floor(seeds.length / 3)]); const p = makePortalDef(e); const wp = (WORLD.dungeonPos || {})[e.seed]; if (wp) { p.x = wp.x; p.z = wp.z; px = wp.x; pz = wp.z + 3; } p.zone = 'world';
  goToDungeon(p); for (let k = 0; k < 40 && activeZoneId !== 'dungeon'; k++) await wait(500); await wait(3000);
  const here = CHESTS.filter(c => c.floor === currentFloor); const c = here.find(c => c.treasure) || here[0]; if (!c.locked) lockChest(c); window._c = c;
  return { name: p.name, theme: p.theme, chest: { x: c.x, z: c.z, floor: c.floor, treasure: !!c.treasure } }; });
await g.hide();
await page.evaluate(() => { const c = window._c; const C = 1; try { closeDialog(); } catch (e) {} if (typeof VM_SCENE !== 'undefined') VM_SCENE.visible = false; ENEMIES.forEach(e => { if (e.mesh) e.mesh.visible = false; });
  // stand two cells from the chest, facing it, on open floor
  const map = activeMap(); let best = null; for (const [dx, dz] of [[0, 2], [0, -2], [2, 0], [-2, 0], [2, 1], [-2, 1], [1, 2], [1, -2], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 1], [0, -1], [1, 0], [-1, 0]]) { const gx = Math.round(c.x / C) + dx, gz = Math.round(c.z / C) + dz; if (map[gz] && map[gz][gx] && !dSolid(gx, gz) && !best) best = [gx * C, gz * C]; }
  if (best) { px = best[0]; pz = best[1]; yaw = Math.atan2(px - c.x, pz - c.z); } pitch = -.3; updateHUD(); return { best, c: [c.x, c.z] }; });
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(here, 'plate-dungeon.jpg'), type: 'jpeg', quality: 84 });
await page.evaluate(() => tryLockpick(window._c)); await work(); await page.waitForTimeout(40);
await page.evaluate(() => { LP.pushed = 0; LP.pins[2].y = .55; cancelAnimationFrame(LP.raf); LP.raf = 0; lpRender(); });
Object.assign(data.dungeon, await page.evaluate(() => { const d = lpDifficulty(window._c); return { title: document.getElementById('lp-title').textContent, pins: d.pins, dwell: d.dwell, fall: d.fall, live: LP.live, picks: document.getElementById('lp-picks').textContent }; }));
await page.screenshot({ path: path.join(here, 'current-dungeon.png') });
data.tag = await page.evaluate(() => { const m = document.body.innerHTML.match(/\bs\d{3}\b/); return m && m[0]; });
data.errs = g.errs;
fs.writeFileSync(path.join(here, 'current.json'), JSON.stringify(data, null, 1));
console.log(JSON.stringify(data, null, 1));
await g.close();
