// The gates by school, the first slice (Session 759; Michael's A, lore_canon Part II §9a): goblins are a state a gate can be
// in, not a kind of gate. A gate that drew 'goblin' is now an occupied gate of one of the built schools, chosen by its seed:
// built and lit in its school's shape, its floor strewn with the warren's junk, holding the warren's roster.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const doors = []; for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) for (const d of (WORLD.getCell(i, j).doors || [])) if (d.theme && d.seed != null) doors.push(d);
  const gob = doors.filter(d => d.theme === 'goblin'), rest = doors.filter(d => d.theme !== 'goblin');
  const pd = gob.map(d => makePortalDef(d)); const by = {}; pd.forEach(p => by[p.theme] = (by[p.theme] || 0) + 1);
  const again = gob.every(d => makePortalDef(d).theme === makePortalDef(d).theme && gateOf(d).theme === makePortalDef(d).theme);
  const restOk = rest.every(d => { const p = makePortalDef(d); return p.theme === d.theme && p.occupied === false; });
  const names = gob.map((d, k) => [pd[k].name, d.canonicalName || dungeonName(d.seed, 'goblin')]);
  const authored = WORLD_DUNGEONS.filter(e => e.theme === 'goblin').map(e => { const p = makePortalDef(e); return { n: e.canonicalName || e.seed, theme: p.theme, occ: p.occupied }; });
  return { doors: doors.length, gob: gob.length, by, again, restOk, names, authored, anyGoblin: pd.some(p => p.theme === 'goblin') || authored.some(a => a.theme === 'goblin') };
});
console.log(JSON.stringify(r));
check(`the world's ${r.gob} gates that drew 'goblin' (of ${r.doors}) are occupied gates of a school, none a goblin gate`, r.gob > 20 && !r.anyGoblin && Object.keys(r.by).every(k => ['undead', 'elemental', 'deep', 'haunted', 'ruins'].includes(k)), r.by);
check('spread over the schools (four or five of them), each by its own seed, the same every time', Object.keys(r.by).length >= 4 && r.again, r.by);
check('every other gate keeps its school and is not occupied', r.restOk);
check('an occupied gate keeps the warren\'s name (it reads the stored word)', r.names.every(([a, b]) => a === b), r.names.slice(0, 4));
check('the authored goblin entries (The Last Post, Hollow Gate, the old woods\' warrens) are occupied too', r.authored.length >= 4 && r.authored.every(a => a.occ && a.theme !== 'goblin'), r.authored);

// inside: an occupied gate and its school's own, side by side
const inside = async (entry) => { await page.evaluate(() => { window._prevDScene = typeof dScene !== 'undefined' ? dScene : null; }); await page.evaluate((e) => { level = 6; const p = makePortalDef(e); p.zone = 'world'; p.tutorial = false; goToDungeon(p); }, entry);
  for (let k = 0; k < 40 && !(await page.evaluate(() => activeZoneId === 'dungeon' && typeof dScene !== 'undefined' && scene === dScene && dScene !== window._prevDScene)); k++) await page.waitForTimeout(500);
  await page.waitForTimeout(1200);
  return page.evaluate(() => ({ theme: currentPortal.theme, occ: currentPortal.occupied, fog: dScene.fog.color.getHex(), foes: [...new Set(ENEMIES.map(e => e.baseType || e.name))] })); };
const pick = await page.evaluate(() => { for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) for (const d of (WORLD.getCell(i, j).doors || [])) if (d.theme === 'goblin' && d.seed != null && !d.lairDoor) return { seed: d.seed, theme: d.theme, size: 'medium', diff: 'normal', x: 0, z: 0 }; return null; });
const occ = await inside(pick);
const school = await inside({ ...pick, theme: occ.theme });
const want = await page.evaluate((t) => (THEME_DEF[t] || THEME_DEF.ruins).fog, occ.theme);
console.log(JSON.stringify({ occ, school, want }));
check(`inside, the occupied gate is lit as its school (${occ.theme}: fog ${want.toString(16)}), as that school's own gate is`, occ.fog === want && school.fog === want && occ.occ === true && school.occ === false, { occ, school });
check('its foes are the warren\'s: goblins, kobold thieves, shieldbearers, slimes, a troll', occ.foes.length > 0 && occ.foes.every(n => ['Goblin', 'Kobold Thief', 'Slime', 'Small Slime', 'Cave Troll', 'Shieldbearer'].includes(n)) && occ.foes.includes('Goblin'), occ.foes);
check('and the same school\'s gate unoccupied holds no goblin or kobold', !school.foes.some(n => /Goblin|Kobold/.test(n)) || occ.theme === 'ruins', school.foes);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
