// The Reader's discoveries across real sessions (Session 242). Session 97 verified *the held breath* by setting the
// gap directly and *the map* through the harness. This drives both the way play does: a save, a page reload and
// Continue with the real clock moved on (Date.now shifted through localStorage, which survives the reload), a long
// stretch underground before saving, and a real fast travel from the map to a town whose roads you never walked.
import { boot, check } from './lib/game.mjs';
const H = 3.6e6;
const g = await boot(); const { page } = g;
// every later page load reads its clock offset from localStorage
await page.addInitScript(() => { const o = Date.now.bind(Date); Date.now = () => o() + (+localStorage.getItem('__off') || 0); });
await g.intoWorld();
await page.evaluate(() => { localStorage.setItem('__off', '0'); worldState.masteries = 1; delete worldState.varek;
  worldState.gameTimeAbsMinutes = 9 * 1440 + 600; (worldState.church || (worldState.church = { notes: [] })).notes.push({ kind: 'guard', site: 'dunmore', day: 9 }); });
await g.spin(null, 60);
const cont = async (off) => {
  await page.evaluate(() => saveToSlot(0)); await page.waitForTimeout(1200);
  await page.evaluate((o) => localStorage.setItem('__off', String(o)), off);
  await page.reload(); await page.waitForTimeout(5000);
  await page.evaluate(() => document.getElementById('cb').click()); await page.waitForTimeout(12000); await g.hide();
  return page.evaluate(() => { const v = WORLD.varek; return { started, zone: activeZoneId, gapH: +(v.gapH || 0).toFixed(2), due: WORLD.varekDue(), m: worldState.masteries }; });
};
// a quick return is no gap
const quick = await cont(0);
console.log('quick', JSON.stringify(quick));
const kept = await page.evaluate(() => ({ day: Math.floor((worldState.gameTimeAbsMinutes || 0) / 1440), notes: ((worldState.church && worldState.church.notes) || []).length }));
check('the day count and the Church’s notes come back from the save', kept.day === 9 && kept.notes === 1, kept);
check('saved and continued at once: no gap, nothing due', quick.started && quick.gapH === 0 && quick.due === null && quick.m === 1, quick);
// seven hours away
const away = await cont(7 * H);
console.log('away', JSON.stringify(away));
check('continued seven real hours later: the held breath is due', away.gapH >= 6.9 && away.gapH < 7.2 && away.due === 'breath', away);
// Varek at the Ashfeld with the breath's line
const vk = await page.evaluate(() => { const f = WORLD.fieldFor('gatelands'); px = f.x; pz = f.z + 30;
  for (let i = 0; i < 180; i++) WORLD.tick(1 / 60, performance.now());
  const n = ZONES.world.npcs.find(n => n.def && n.def.name === 'Varek') || (typeof npcs !== 'undefined' && npcs.find(n => n.def && n.def.name === 'Varek'));
  return n ? { d: +Math.hypot(n.g.position.x - f.x, n.g.position.z - f.z).toFixed(1), line: n.def.greeting[0].slice(0, 60), field: f.name } : null; });
console.log('varek', JSON.stringify(vk));
check('Varek stands at the Ashfeld with the held breath', vk && vk.d < 10 && /^Nine days passed/.test(vk.line), vk);
// seven hours of play underground, then save and continue at once: that is not a gap between sessions
await page.evaluate(() => { const v = WORLD.varek; v.done.breath = true; v.gapH = 0; });
await page.evaluate(() => { const e = WORLD.doorAnywhere(801); const p = makePortalDef(e); const wp = WORLD.dungeonPos[801]; if (wp) { p.x = wp.x; p.z = wp.z; } p.zone = 'world'; goToDungeon(p); });
await page.waitForTimeout(6000); await g.hide();
const below = await page.evaluate(() => ({ zone: activeZoneId, dungeon: !!currentPortal }));
await page.evaluate(() => localStorage.setItem('__off', String(14 * 3.6e6)));
await g.frames(3); await page.waitForTimeout(1500); await g.frames(3);
const deep = await cont(14 * H);
console.log('below', JSON.stringify(below), 'deep', JSON.stringify(deep));
check('seven hours underground, saved and continued at once: no gap', below.zone !== 'world' && deep.started && deep.gapH === 0 && deep.due === null, { below, deep });
// back out into the world
await page.evaluate(() => goToZone('world', 13100, 25450, 0, 'x')); await page.waitForTimeout(9000); await g.hide();
// the map: fast travel to a town none of whose roads you walked
const mp = await page.evaluate(() => { WORLD.devUnlockAll(); worldState.masteries = 2; worldState.roadsWalked = {}; const v = WORLD.varek; v.shortRoad = null;
  const pick = (id) => { const t = WORLD.siteAnywhere(id); return t && WORLD.ROAD_DEFS.some(r => r.a === id || r.b === id) ? t : null; };
  const t = pick('ironhaven'); window._t = t; const ok = WORLD.fastTravel(t.id);
  return { ok, town: t.name, short: v.shortRoad, due: WORLD.varekDue() }; });
await page.waitForTimeout(4000); await g.hide();
mp.at = await page.evaluate(() => Math.round(Math.hypot(px - _t.x, pz - _t.z)));
console.log('map', JSON.stringify(mp));
check('fast travel to a town by roads never walked: the map is due, naming it', mp.ok && mp.short === mp.town && mp.due === 'map' && mp.at < 60, mp);
// a road walked: standing on one of Dunmore's roads logs it, and travelling there is not a short road
const wk = await page.evaluate(() => { const v = WORLD.varek; v.shortRoad = null; v.done.map = false;
  const id = 'dunmore', t = WORLD.siteAnywhere(id); let hit = null;
  for (let r = t.pad + 6; r < t.pad + 80 && !hit; r += 2) for (let a = 0; a < 64 && !hit; a++) { const x = t.x + Math.sin(a / 64 * 6.283) * r, z = t.z + Math.cos(a / 64 * 6.283) * r; const ri = WORLD.roadInfo(x, z);
    if (ri && ri.d < 1 && ri.seg && ri.seg.road && (ri.seg.road.def.a === id || ri.seg.road.def.b === id)) hit = { x, z }; }
  if (!hit) return { hit: null };
  px = hit.x; pz = hit.z; for (let i = 0; i < 90; i++) WORLD.tick(1 / 60, performance.now());
  const walked = Object.keys(worldState.roadsWalked || {}).filter(k => k.split('|').includes(id));
  const f = WORLD.fieldFor('gatelands'); px = f.x + 600; pz = f.z; for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now());
  const ok = WORLD.fastTravel(id); return { hit: true, walked, ok, short: v.shortRoad, zone: activeZoneId }; });
console.log('walked', JSON.stringify(wk));
check('a road of Dunmore walked, then travelled there: no short road', wk.hit && wk.walked.length >= 1 && wk.ok && wk.short === null, wk);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
