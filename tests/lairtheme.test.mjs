// A lair cavern's theme and stored beast follow the lair's own biome, whatever has loaded (Session 712). `lairDoorFor` read the live
// `dominantRegion` as the cell was made, and every cell is made at the first `getCell` (the names pass), when REGIONS holds only the
// loaded cells' regions: 11 of 41 lair doors stored a beast other than `lairBeast`, and 5 fen lairs' caverns were built 'deep', not
// 'haunted'. Both are now read when asked, by `lairBiome` and `lairBeast`. And `lairBiome` itself fell back to the live read for a lair
// on an islet in open sea, whose nine cells have no region (Rathmore's, beyond the grid, was `lairname`'s red on CI): Ardbeg's and Stinouma's Lairs read forest (an Ogre) with little loaded and
// fen (a Marsh Hag) once the cells round the fen lairs had loaded. The ring now widens over the cells' own regions.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const read = () => page.evaluate(() => { const out = []; for (let i = -3; i < WORLD.GRID + 3; i++) for (let j = -3; j < WORLD.GRID + 3; j++) { const c = WORLD.getCell(i, j);
  for (const d of (c.doors || [])) { if (!d.lairDoor) continue; const s = WORLD.siteAnywhere(d.lair.siteId); if (!s) continue; const b = lairBiome(s);
    const [ci, cj] = WORLD.cellOf(s.x, s.z); let ring = 0; for (let a = ci - 1; a <= ci + 1; a++) for (let e = cj - 1; e <= cj + 1; e++) { const q = WORLD.getCell(a, e); ring += (q && q.regions || []).length; }
    out.push({ id: s.id, name: s.name, biome: b, beast: lairBeast(s), boss: d.lair.boss, theme: d.theme, want: b === 'swamp' || b === 'fen' ? 'haunted' : 'deep', cell: [i, j], ring }); } }
  return out; });
const a = await read();
const fen = a.filter(x => x.want === 'haunted'), bare = a.filter(x => x.ring === 0);
console.log(JSON.stringify({ n: a.length, fen: fen.map(x => [x.name, x.biome]), bare: bare.map(x => [x.name, x.biome, x.beast]) }));
check('every lair door stores the beast lairBeast names', a.length >= 30 && a.every(x => x.boss === x.beast), a.filter(x => x.boss !== x.beast));
check('every lair cavern is haunted in fen or swamp and deep elsewhere', a.every(x => x.theme === x.want) && fen.length > 0, { fen: fen.length, wrong: a.filter(x => x.theme !== x.want) });
// load the cells round six lairs, fen ones first, then every islet lair's: the answers do not move
const picks = [...fen, ...a.filter(x => x.want !== 'haunted')].slice(0, 6).concat(bare);
await page.evaluate((picks) => { for (const x of picks) for (let i = x.cell[0] - 1; i <= x.cell[0] + 1; i++) for (let j = x.cell[1] - 1; j <= x.cell[1] + 1; j++) WORLD.loadCell(i, j); }, picks);
for (let k = 0; k < 40; k++) { await g.spin(30); if (await page.evaluate(() => !WORLD.jobs || !WORLD.jobs.length)) break; }
const b = await read();
const moved = b.filter(x => { const y = a.find(z => z.id === x.id); return !y || y.boss !== x.boss || y.theme !== x.theme || y.biome !== x.biome; }).map(x => [x.name, a.find(z => z.id === x.id), x]);
check(`after the cells round ${picks.length} lairs are loaded (${bare.length} on islets with no region in their nine cells), no lair's biome, beast or theme has changed`, moved.length === 0 && b.length === a.length && bare.length > 0, moved);
// the portal the world builds for a fen lair's door carries the haunted theme
const p = await page.evaluate((id) => { for (let i = 0; i < WORLD.GRID; i++) for (let j = 0; j < WORLD.GRID; j++) { const d = (WORLD.getCell(i, j).doors || []).find(d => d.lairDoor && d.lair.siteId === id); if (d) { const q = makePortalDef(d); return { theme: q.theme, boss: d.lair.boss }; } } return null; }, fen[0] && fen[0].id);
check('a fen lair\'s cavern portal is built haunted', !!p && p.theme === 'haunted', { lair: fen[0] && fen[0].name, p });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
