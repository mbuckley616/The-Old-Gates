// Session 363: leaving a dungeon whose gate is not in PORTALS. goToOW found the gate you came down by in PORTALS (the
// portals of the world's loaded cells) and read `src.name` for the log line. A gate entered while its cell was not
// loaded is not there, and going up threw at `'Left '+src.name` halfway through the fade: no leave hook (the acts, a
// cleared gate), no message, no save, and you stood at (15, 20), the old Ashenmoor map's coordinates. Found by the chest
// survey (chestpicks), which enters gates by seed. Ordinary play was not seen to reach it: a save made inside a dungeon
// loads the gate's cell first (case 2). The gate is now the portal you went down (currentPortal) when PORTALS lacks it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// a gate in a loaded cell, entered as the door does (nearPortal is a PORTALS entry)
for (let k = 0; k < 24 && !(await page.evaluate(() => PORTALS.some(p => p && p.seed != null && p.zone === 'world'))); k++) { await page.evaluate(() => { for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now()); }); await page.waitForTimeout(2500); }
const gate = await page.evaluate(() => { const p = PORTALS.find(p => p && p.seed != null && p.zone === 'world'); if (!p) return null; px = p.x; pz = p.z + 3; goToDungeon(p); return { seed: p.seed, id: p.id, name: p.name, x: p.x, z: p.z }; });
await page.waitForFunction(() => activeZoneId === 'dungeon', null, { timeout: 60000 }).catch(() => {}); await page.waitForTimeout(3000); await g.hide();
const up = async () => { const e0 = g.errs.length; await page.evaluate(() => { window._saved = 0; const s = saveGame; window.saveGame = saveGame = function () { window._saved++; return s.apply(this, arguments); }; }).catch(() => {});
  await page.evaluate(() => goToOW()); await page.waitForFunction(() => activeZoneId === 'world', null, { timeout: 30000 }).catch(() => {}); await page.waitForTimeout(3000); await g.hide();
  return page.evaluate(e0 => ({ zone: activeZoneId, x: +px.toFixed(1), z: +pz.toFixed(1), log: (GAME_LOG.slice(-4).map(l => l.text)).join(' | '), saved: window._saved }), e0).then(r => ({ ...r, errs: g.errs.slice(e0) })); };

// 1. the ordinary way: down by the door, up again
const plain = await up();
check('down by the door and up again: back at the gate, the log names it, no page error', !!gate && plain.zone === 'world' && Math.hypot(plain.x - gate.x, plain.z - gate.z) < 6 && plain.log.includes('Left ' + gate.name) && plain.errs.length === 0, { gate, plain });

// 2. saved inside, reloaded, Continue: the world loads the gate's cell first, so the gate is in PORTALS again
await page.evaluate(p => { px = p.x; pz = p.z + 3; goToDungeon(PORTALS.find(q => q.id === p.id)); }, gate);
await page.waitForFunction(() => activeZoneId === 'dungeon', null, { timeout: 60000 }).catch(() => {}); await page.waitForTimeout(3000);
await page.evaluate(() => saveToSlot(0)); await page.waitForTimeout(1200);
await page.reload(); await page.waitForFunction(() => document.getElementById('cb') && typeof saveToSlot === 'function', null, { timeout: 120000 }); await page.waitForTimeout(1500);
await page.evaluate(() => document.getElementById('cb').click());
await page.waitForFunction(() => started && activeZoneId === 'dungeon', null, { timeout: 120000, polling: 500 }).catch(() => {}); await page.waitForTimeout(3000); await g.hide();
const back = await page.evaluate(() => ({ zone: activeZoneId, inPortals: PORTALS.some(p => p && p.id === lid), cur: currentPortal && currentPortal.id }));
const reloaded = await up();
check('saved in the dungeon and continued: going up puts you at the gate, logs it and saves, no page error', back.zone === 'dungeon' && back.cur === gate.id && reloaded.errs.length === 0 && reloaded.log.includes('Left ' + gate.name) && reloaded.saved >= 1 && Math.hypot(reloaded.x - gate.x, reloaded.z - gate.z) < 6, { back, reloaded });

// 3. a far gate, entered while its cell is not loaded (as a test that surveys dungeons by seed does): not in PORTALS
const far = await page.evaluate(() => { const seeds = []; for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) { const c = WORLD.getCell(i, j); for (const e of (c && c.doors) || []) if (e && e.seed != null) seeds.push(e.seed); }
  const seed = seeds.find(s => !PORTALS.some(p => p && p.seed === s) && WORLD.dungeonPos[s]); const e = WORLD.doorAnywhere(seed); const d = makePortalDef(e); const wp = WORLD.dungeonPos[seed]; d.x = wp.x; d.z = wp.z; d.zone = 'world';
  goToDungeon(d); return { seed, id: d.id, name: d.name, x: d.x, z: d.z }; });
await page.waitForFunction(() => activeZoneId === 'dungeon', null, { timeout: 60000 }).catch(() => {}); await page.waitForTimeout(3000); await g.hide();
const farIn = await page.evaluate(() => ({ inPortals: PORTALS.some(p => p && p.id === lid) }));
const farUp = await up();
check('a gate not in PORTALS: going up no longer throws; you stand at that gate, it is logged and the game saves', !farIn.inPortals && farUp.errs.length === 0 && farUp.zone === 'world' && Math.hypot(farUp.x - far.x, farUp.z - far.z) < 6 && farUp.log.includes('Left ' + far.name) && farUp.saved >= 1, { far, farIn, farUp });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
