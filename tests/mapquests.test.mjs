// Session 587: quest marks on the world map (Michael, 5 Oct 2026: "We need quest markers to work on the overworld map").
// The map marked the lessons, the second act's story, a guild's task, a rubbing and a job under way; a finished job's report,
// the faction, war and guild marks, the story's next giver and the place you were told were on the compass alone, and
// zoomed out past a cell of 60 px the map drew no mark at all. Now the map takes every mark the compass has (`liveMarkers`),
// indoors and underground too, at every zoom.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const lord = (src) => page.evaluate((src) => { try { if (dlgOpen) closeDialog(); } catch (e) {}
  const S = WORLD.settle.get('dunmore'); openDialog(S.lordNpc ? S.lordNpc.def : (S.houses.find(h => h.type === 'castle') || {}).dlg);
  const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src).test(x.textContent.trim().replace(/^\d+\.\s*/, ''))); if (b) b.click();
  try { if (dlgOpen) closeDialog(); } catch (e) {} return !!b; }, src);
// every quest mark on the map, from the cells that hold the compass's marks (or every cell)
const mapMarks = () => page.evaluate(() => { const out = []; const seen = new Set(); _liveMk = null;
  const keys = new Set([cellOf(SITE.dunmore.x, SITE.dunmore.z).join(',')]); for (const m of liveMarkers()) keys.add(cellOf(m.x, m.z).join(','));
  for (const k of keys) { const c = getCell(...k.split(',').map(Number)); if (!c) continue;
    for (const e of questMarkers(c)) if (!seen.has(e.id)) { seen.add(e.id); out.push({ id: e.id, name: e.name, x: Math.round(e.x), z: Math.round(e.z), sub: e.sub }); } }
  return out; });
const compass = () => page.evaluate(() => WORLD.compassMarkers().map(m => ({ label: m.label, x: Math.round(m.x), z: Math.round(m.z) })));
const covered = (C, M) => C.filter(c => !M.some(m => Math.hypot(m.x - c.x, m.z - c.z) < 7));

await page.evaluate(() => { worldState.gameTimeAbsMinutes = 30000; forceTime(10); });
const took = await lord('^I.m looking for work\\.$');
const q = await page.evaluate(() => { const q = (worldState.quests || []).filter(q => !q.turnedIn && !q.faction).slice(-1)[0]; return q && { id: q.id, title: q.title, kind: q.kind, d: q.data }; });
const C1 = await compass(), M1 = await mapMarks();
console.log(' job:', JSON.stringify(q)); console.log(' compass:', JSON.stringify(C1)); console.log(' map:', JSON.stringify(M1));
check(`the lord's job (${q && q.title}) is marked on the compass and on the map`, took && C1.length > 0 && M1.length > 0 && covered(C1, M1).length === 0, { C1, M1 });

await page.evaluate((id) => qComplete(WORLD.quests.find(x => x.id === id)), q.id);
const C2 = await compass(), M2 = await mapMarks(); const rep = M2.find(m => /^Report to /.test(m.name));
console.log(' done:', JSON.stringify(M2));
check(`done, the map marks the lord to report to (${rep && rep.name}, at Dunmore)`, rep && covered(C2, M2).length === 0 && await page.evaluate(([x, z]) => Math.hypot(x - SITE.dunmore.x, z - SITE.dunmore.z) < 7, [rep.x, rep.z]), { rep, M2 });

// out of the open world the compass is empty, but the map still knows
const under = await page.evaluate(() => { const z0 = activeZoneId; activeZoneId = 'dungeon'; const c = WORLD.compassMarkers().length; const cell = getCell(...cellOf(SITE.dunmore.x, SITE.dunmore.z)); _liveMk = null;
  const m = questMarkers(cell).filter(e => /^Report to /.test(e.name)).length; activeZoneId = z0; _liveMk = null; return { c, m }; });
check('underground (no compass), the map still marks the report', under.c === 0 && under.m === 1, under);

// zoomed right out (a cell under 60 px), the quest marks are drawn and nothing else
const zoomed = await page.evaluate(() => { const cv = document.createElement('canvas'); cv.width = 700; cv.height = 700;
  const keep = { cv: MAP.cv, ctx: MAP.ctx, zoom: MAP.zoom, mode: MAP.mode }; MAP.cv = cv; MAP.ctx = cv.getContext('2d'); MAP.mode = 'map'; MAP.zoom = 1; MAP.ox = 0; MAP.oy = 0;
  const cellPx = WORLD.SIZE * baseScale() * MAP.zoom; mapDraw(); const ents = MAP._entries.map(e => ({ kind: e.kind, name: e.name }));
  MAP.zoom = 4; { const [sx, sy] = mapToScreen(SITE.dunmore.x, SITE.dunmore.z); MAP.ox += 350 - sx; MAP.oy += 350 - sy; } mapDraw(); const cellPx4 = WORLD.SIZE * baseScale() * MAP.zoom; const ents4 = MAP._entries.filter(e => e.kind === 'quest').length;
  Object.assign(MAP, keep); MAP.jobs.length = 0; return { cellPx: +cellPx.toFixed(1), ents, cellPx4: +cellPx4.toFixed(1), ents4 }; });
console.log(' zoomed:', JSON.stringify(zoomed));
check(`zoomed out (a cell ${zoomed.cellPx} px), the report is drawn and only quest marks are`, zoomed.cellPx < 60 && zoomed.ents.some(e => e.kind === 'quest' && /^Report to /.test(e.name)) && zoomed.ents.every(e => e.kind === 'quest'), zoomed);
check(`zoomed in (a cell ${zoomed.cellPx4} px), still drawn`, zoomed.ents4 > 0, zoomed);

// paid: gone from the map
await lord('^It.s done\\.$');
const M3 = await mapMarks();
check('paid, the mark is gone', !M3.some(m => /^Report to /.test(m.name)), M3);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
