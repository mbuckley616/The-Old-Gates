// The forts in real play (backlog G, *Saves first*: "the forts in real play — one fort per door now: ring, gate, keep,
// barracks, and the keep door's prompt"). Session 131 found every fort at NaN and put the eight back; Session 132 took the
// second, kit-built fort off each. Neither walked one: "the E-to-enter prompt on the keep's door" was left to a screenshot.
// Here the six fort doors nearest home are visited as fast travel sets you down, outside the gate, and walked on foot (W held,
// the loop's own movement and collision at fixed 1/60 ticks) through the gate and up the yard to the keep's door. There
// the game's own prompt is read off the HUD, and E takes you down. One more walk, straight at the ring away from the
// gate, checks that the wall holds.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { WORLD.devUnlockAll(); window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step()) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });

const forts = await page.evaluate(() => { const out = [];
  for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) WORLD.getCell(i, j).doors.forEach(e => { if (e.kind === 'fort_door') out.push({ seed: e.seed, x: e.x, z: e.z, name: e.canonicalName || null }); });
  return out; });
console.log('fort doors in the world:', forts.length);
// the six nearest home (every fort is the same compound, and a far cell takes a minute to build on software GL)
const walkList = forts.map(f => ({ ...f, d: Math.hypot(f.x - 13100, f.z - 25450) })).sort((a, b) => a.d - b.d).slice(0, 6);

const rows = [];
for (const f of walkList) {
  // set down near the door and let its cell build (the compound is a static of a near cell)
  let ready = false;
  for (let k = 0; k < 30 && !ready; k++) {
    await page.evaluate((f) => { const a = WORLD.arrivalFor('door_' + f.seed); const t = a || { x: f.x, z: f.z + 30 }; if (Math.hypot(px - t.x, pz - t.z) > 6) { px = t.x; pz = t.z; } }, f);
    await page.waitForTimeout(2500);
    /* S447 — since the rivers (S432) a cell's load is heavier: a fort beside home took 60 s of the queue's two jobs a frame
       on software GL, against the 75 s this loop allowed. Run the game's own queued load jobs here instead of waiting on the clock */
    await page.evaluate(() => { for (let n = 0; n < 400 && WORLD.jobs.length; n++) { const jb = WORLD.jobs.shift(); let more = false; try { more = jb.fn(); } catch (e) { console.warn('job failed', e); } if (more) WORLD.jobs.push(jb); } });
    ready = await page.evaluate((s) => !!WORLD.settle.get('fort_' + s) && PORTALS.some(p => p.seed === s), f.seed);
  }
  if (!ready) { rows.push({ seed: f.seed, notBuilt: true }); continue; }
  await g.hide();
  const r = await page.evaluate((s) => {
    forceTime(12); PHP = maxHP; dead = false;
    for (const e of ZONES.world.enemies) if (!e.dead && Math.hypot(e.x - px, e.z - pz) < 80) { e.locked = true; if (e.mesh) e.mesh.visible = false; }
    const S = WORLD.settle.get('fort_' + s), door = PORTALS.find(p => p.seed === s), a = WORLD.arrivalFor('door_' + s);
    const cx = S.site.x, cz = S.site.z;
    // the walk: from where fast travel sets you, W held, steering for the keep's door
    px = a.x; pz = a.z; jumpY = 0; const K = window._K; let n = 0, best = 1e9, stuck = 0, lx = px, lz = pz, path = [];
    try { K['KeyW'] = true;
      _drive(() => { PHP = maxHP; dead = false; const dx = door.x - px, dz = door.z + 1.2 - pz; yaw = Math.atan2(-dx, -dz);
        const d = Math.hypot(door.x - px, door.z - pz); best = Math.min(best, d); n++;
        if (n % 30 === 0) { if (Math.hypot(px - lx, pz - lz) < .2) stuck++; else stuck = 0; lx = px; lz = pz; path.push([+(px - cx).toFixed(1), +(pz - cz).toFixed(1)]); }
        return d < 1.6 || stuck >= 3 || n > 60 * 30; }, 60 * 31);
    } finally { K['KeyW'] = false; }
    const walk = { frames: n, secs: +(n / 60).toFixed(1), best: +best.toFixed(2), stuckAt: stuck >= 3 ? [+(px - cx).toFixed(1), +(pz - cz).toFixed(1)] : null, path: path.filter((_, i) => i % 4 === 0) };
    // the ring away from the gate: from 8 outside at the west, W held towards the middle for 6 s
    const ring = []; for (const ang of [0, Math.PI, Math.PI * 1.5]) { px = cx + Math.cos(ang) * 35; pz = cz + Math.sin(ang) * 35; let m = 0;
      try { K['KeyW'] = true; _drive(() => { PHP = maxHP; yaw = Math.atan2(-(cx - px), -(cz - pz)); return ++m > 360; }, 361); } finally { K['KeyW'] = false; }
      ring.push(+Math.hypot(px - cx, pz - cz).toFixed(1)); }
    // back to the door for the prompt and E
    px = door.x; pz = door.z + 1.2;
    return { seed: s, name: door.name, kind: door.kind, walk, ring, R: S.site.pad - 2, keepDoorGap: +(door.z - cz).toFixed(1) };
  }, f.seed);
  await g.frames(3);
  r.prompt = await page.evaluate(() => { const e = document.getElementById('ipr'); return e && e.style.display !== 'none' && e.style.opacity !== '0' ? e.textContent : null; });
  await page.keyboard.press('KeyE'); await page.waitForTimeout(3500);
  r.entered = await page.evaluate(() => activeZoneId);
  if (r.entered === 'dungeon') { await page.evaluate(() => goToOW()); await page.waitForTimeout(4000); await g.hide(); r.back = await page.evaluate(() => activeZoneId); }
  rows.push(r);
  console.log(JSON.stringify(r));
}
const built = rows.filter(r => !r.notBuilt);
check('the world has its forts, and each one builds when you come to it', forts.length >= 6 && built.length === walkList.length, { forts: forts.length, walked: walkList.length, notBuilt: rows.filter(r => r.notBuilt).map(r => r.seed) });
check('from where fast travel sets you, every fort is walked on foot through the gate and up the yard to the keep door', built.every(r => r.walk.best < 1.6 && !r.walk.stuckAt), built.map(r => ({ name: r.name, best: r.walk.best, secs: r.walk.secs, stuckAt: r.walk.stuckAt })));
check('the ring holds away from the gate: walked at from the east, west and north, nobody gets inside it', built.every(r => r.ring.every(d => d > r.R)), built.map(r => ({ name: r.name, ring: r.ring, R: r.R })));
check('at the keep door the HUD says Press \'E\' to enter, with the fort\'s name', built.every(r => r.prompt && /Press 'E' to enter/.test(r.prompt) && r.prompt.includes(r.name)), built.map(r => r.prompt));
check('E at the keep door takes you down into the fort, and back out again', built.every(r => r.entered === 'dungeon' && r.back === 'world'), built.map(r => [r.name, r.entered, r.back]));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
