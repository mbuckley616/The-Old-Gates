// A lair's beast and its cavern's master are named for one beast (Session 699, the critic's s482). At Carrigowen's Lair (fen)
// the beast at the crag was *Carrigowen the Marsh Hag* and the cavern's master *Carrigowen — Cave Bear*: the door's
// `lair.boss` was read before the routing moved the lair (S452's shoreSites), and off the special biomes the beast rolled
// Cave Bear or Ogre on its build stream while the master rolled on the lair's hash. `lairBeast(site)` is now the one answer.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const [hi, hj] = WORLD.cellOf(px, pz); const lairs = [];
  for (let i = hi - 4; i <= hi + 4; i++) for (let j = hj - 4; j <= hj + 4; j++) { const c = WORLD.getCell(i, j); if (!c || !c.sites) continue;
    for (const t of c.sites) if (t.kind === 'lair' && t.pad > 0 && !t.dragon) { const door = (c.doors || []).find(d => d.lairDoor && d.lairSite === t.id); lairs.push({ t, door, cell: [i, j] }); } }
  const rows = [];
  for (const { t, door, cell } of lairs.slice(0, 14)) { WORLD.loadCell(...cell); const site = WORLD.SITE[t.id] || t; let S = WORLD.settlements.get(site.id); if (!S) S = WORLD.genSettlement(site);
    const e = S && S.creatures && S.creatures[0]; const crag = e ? (e.baseName || e.type || '').replace(/^.* the /, '') : null;
    rows.push({ id: site.id, name: site.name, moved: !!site.drawnAt, biome: dominantRegion(site.x, site.z).r.biome, crag, crag2: e ? e.name : null, beast: lairBeast(site), at: [+site.x.toFixed(1), +site.z.toFixed(1)], door: door && door.lair ? door.lair.boss : null }); }
  return rows; });
console.log(JSON.stringify(r));
check('lairs found round the start, each with its beast built', r.length >= 6 && r.every(x => x.crag), r.length);
check('the beast at the crag is lairBeast(site) at every lair', r.every(x => x.crag === x.beast || (x.crag2 || '').endsWith(' the ' + x.beast)), r.map(x => [x.name, x.crag2, x.beast]));
// load order (Session 701): the live REGIONS hold only the loaded cells' regions, so the biome read at a lair moved with what was
// loaded. Read every lair's beast, make and load the cells round each, and read again: lairBeast is unchanged; the live read is not always
const lo = await page.evaluate((rows) => { const out = { same: 0, diff: [], liveDiff: [] };
  const live0 = rows.map(x => dominantRegion(WORLD.siteAnywhere(x.id).x, WORLD.siteAnywhere(x.id).z).r.biome);
  for (const x of rows) { const s = WORLD.siteAnywhere(x.id); const [ci, cj] = WORLD.cellOf(s.x, s.z); for (let i = ci - 2; i <= ci + 2; i++) for (let j = cj - 2; j <= cj + 2; j++) { WORLD.getCell(i, j); if (Math.abs(i - ci) <= 1 && Math.abs(j - cj) <= 1) WORLD.loadCell(i, j); } }
  rows.forEach((x, k) => { const s = WORLD.siteAnywhere(x.id); if (!s) return; const b = lairBeast(s); if (b === x.beast) out.same++; else out.diff.push([x.name, x.beast, b, { at0: x.at, at1: [+s.x.toFixed(1), +s.z.toFixed(1)], moved: !!s.drawnAt }]);
    const l = dominantRegion(s.x, s.z).r.biome; if (l !== live0[k]) out.liveDiff.push([x.name, live0[k], l]); });
  return out; }, r);
console.log(JSON.stringify(lo));
check('every lair\'s beast is the same after the cells round it are made and loaded', lo.diff.length === 0 && lo.same === r.length, lo);
// the cavern: its master takes the same name, even when the door's stored boss says otherwise
const cave = await page.evaluate((rows) => { const x = rows[0]; const site = WORLD.siteAnywhere(x.id); const other = x.beast === 'Ogre' ? 'Cave Bear' : 'Ogre';
  window._lairBoss = null; const p = Object.assign({}, PORTALS[0], { id: 'dyn_lairname', theme: 'deep', seed: 4021, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, lair: { place: site.name.replace(/'s Lair$/, ''), boss: other, siteId: site.id } });
  // S714 — the lair's cell need not be loaded when its cavern is (CI: SITE had dropped it, and the master took the stored boss):
  // the test takes it out of the live SITE, as the runner had, and puts it back once the master is named
  window._siteHeld = WORLD.SITE[site.id] || null; delete WORLD.SITE[site.id];
  goToDungeon(p); return { other, beast: x.beast, place: site.name.replace(/'s Lair$/, ''), id: site.id }; }, r);
for (let k = 0; k < 60; k++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId === 'dungeon' && !!window._lairBoss)) break; }
const m = await page.evaluate((id) => { if (window._siteHeld) WORLD.SITE[id] = window._siteHeld; return window._lairBoss && window._lairBoss.name; }, cave.id);
check('in the cavern, a door that stored another beast: the master is named for the lair\'s beast', m === `${cave.place} — ${cave.beast}`, { m, ...cave });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
