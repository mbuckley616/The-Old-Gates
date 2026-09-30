// Backlog G, chest locks (Session 150): "whether the mimic's borrowed lock reads fairly". The mimic's disguise is
// meant to be exact (v61d5: the bait is the prompt; S150: it wears the lock a chest there would; S198: every chest
// shares its mesh). Session 364 enters the dungeons whose roster carries a Mimic, with a hand of level 6 so the
// roster isn't gated, and compares where each disguised mimic stands with where the dungeon's real chests stand:
// how many of its four sides are open, and whether it is in a room. It found two tells: mimics stood on any floor cell
// (a third in the open or in a corridor, where chests never stand), and the minimap drew a disguised mimic as a foe.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// the tower's hoard (S150: "a good lock"): the lock the game builds for it, over 300 towers' ids, at Finesse 0
const tower = await page.evaluate(() => { const r = []; for (let k = 0; k < 300; k++) r.push(lpDifficulty({ seed: 'tower_' + k * 7919, minPins: 4, lockTitle: 'A locked chest' })); return { pins: [...new Set(r.map(d => d.pins))], dwell: [Math.min(...r.map(d => d.dwell)), Math.max(...r.map(d => d.dwell))] }; });
console.log(`the tower's hoard: pins ${tower.pins.join(',')}; the top holds ${tower.dwell[0]}–${tower.dwell[1]} ms at Finesse 0`);
check('the tower hoard is always a four-pin lock (a good lock, as the treasure chest’s best)', tower.pins.length === 1 && tower.pins[0] === 4, tower);
const seeds = await page.evaluate(() => { const out = []; for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) { const c = WORLD.getCell(i, j); for (const e of (c && c.doors) || []) if (e && e.seed != null && !e.lair) { const p = makePortalDef(e); if ((THEME_DEF[p.theme] || THEME_DEF.ruins).enemies.includes('Mimic')) out.push(e.seed); } } return out; });
const N = 8;
const idx = [...new Set([...Array(N)].map((_, k) => seeds[Math.floor((k + .5) * seeds.length / N)]).filter(x => x != null))];
console.log(`${seeds.length} dungeon doors whose roster has a Mimic; surveying ${idx.join(', ')}`);
const out = [];
for (const i of idx) {
  const r = await page.evaluate(async i => { const wait = ms => new Promise(r => setTimeout(r, ms));
    level = 6;
    const e = WORLD.doorAnywhere(i); if (!e) return null; const p = makePortalDef(e); const wp = (WORLD.dungeonPos || {})[i]; if (wp) { p.x = wp.x; p.z = wp.z; px = wp.x; pz = wp.z + 3; } p.zone = 'world';
    goToDungeon(p); for (let k = 0; k < 40 && activeZoneId !== 'dungeon'; k++) await wait(500); await wait(3000);
    const mapOf = f => f === 2 ? dMap2 : dMap;
    const open = (x, z, f) => { const m = mapOf(f); return [[0, 1], [0, -1], [1, 0], [-1, 0]].filter(([dc, dr]) => (m[z + dr]?.[x + dc] | 0) >= 1).length; };
    const kind = (x, z, f) => { const m = mapOf(f); const o = d => (m[z + d[1]]?.[x + d[0]] | 0) >= 1; const n = o([0, -1]), s = o([0, 1]), e = o([1, 0]), w = o([-1, 0]); const k = n + s + e + w;
      if (k === 2 && ((n && s) || (e && w))) return 'corridor'; if (k === 2) return 'corner'; if (k === 3) return 'wall'; if (k === 4) { let d = 0; for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) d += (m[z + b]?.[x + a] | 0) >= 1; return d === 4 ? 'open floor' : 'junction'; } return 'dead end'; };
    const spot = (x, z, f) => { x = Math.round(x); z = Math.round(z); return { x, z, f, open: open(x, z, f), kind: kind(x, z, f), cell: mapOf(f)[z][x] }; };
    const chests = CHESTS.map(c => Object.assign(spot(c.x, c.z, c.floor), { treasure: !!c.treasure, locked: !!c.locked }));
    const mimics = ENEMIES.filter(m => m.disguised).map(m => Object.assign(spot(m.x, m.z, m.floor), { locked: chestLockedAt(m.x, m.z, m.floor), onChest: CHESTS.some(c => c.floor === m.floor && Math.abs(c.x - m.x) + Math.abs(c.z - m.z) <= 1) }));
    // the minimap with every cell revealed: count the foe dots it draws (5×5 in #cc3322) against the foes it should show
    for (const R of [mmRevealed, mmRevealed2]) if (R) for (const row of R) row.fill(1);
    const orig = mmC.fillRect; let dots = 0; mmC.fillRect = function (x, y, w, h) { if (w === 5 && h === 5 && this.fillStyle === '#cc3322') dots++; return orig.call(this, x, y, w, h); };
    try { drawMM(); } finally { mmC.fillRect = orig; }
    const shown = ENEMIES.filter(m => !m.dead && m.floor === currentFloor && !m.disguised).length, hidden = ENEMIES.filter(m => !m.dead && m.floor === currentFloor && m.disguised).length;
    return { i, name: p.name, theme: p.theme, interior: p.interior, zone: activeZoneId, chests, mimics, mm: { dots, shown, hidden } };
  }, i);
  if (r) { out.push(r); console.log(`${r.name} (${r.theme}/${r.interior}): chests ${r.chests.length}, open sides ${r.chests.map(c => c.open).join('')}; mimics ${r.mimics.length}, open sides ${r.mimics.map(m => m.open).join('') || '–'}, where ${r.mimics.map(m => m.kind).join(', ') || '–'}, beside a chest ${r.mimics.filter(m => m.onChest).length}; minimap dots ${r.mm.dots} for ${r.mm.shown} foes and ${r.mm.hidden} mimics on floor 1`); }
  await page.evaluate(() => goToOW()); await page.waitForTimeout(4000); await g.hide();
}
const all = out.filter(r => r.zone === 'dungeon');
const C = all.flatMap(r => r.chests), M = all.flatMap(r => r.mimics);
const hist = a => [0, 1, 2, 3, 4].map(n => a.filter(x => x.open === n).length);
const kinds = ['dead end', 'corner', 'wall', 'open floor', 'corridor', 'junction'];
const byKind = a => kinds.map(k => `${k} ${a.filter(x => x.kind === k).length}`).join(', ');
console.log(`\nwhere they stand — chests: ${byKind(C)}; mimics: ${byKind(M)}`);
console.log(`\nopen sides 0/1/2/3/4 — chests ${hist(C).join('/')}; mimics ${hist(M).join('/')}`);
check('the survey entered dungeons and met mimics', all.length >= 5 && M.length >= 3, [all.length, M.length]);
const corner = M.filter(m => m.kind === 'corner').length, chestCorner = C.filter(c => c.kind === 'corner').length;
console.log(`in an L-corner: chests ${chestCorner} of ${C.length} (${(chestCorner / Math.max(1, C.length) * 100).toFixed(0)}%), mimics ${corner} of ${M.length} (${(corner / Math.max(1, M.length) * 100).toFixed(0)}%)`);
check('no mimic stands in a corridor, where no chest ever does', M.every(m => m.kind !== 'corridor') && C.every(c => c.kind !== 'corridor'), byKind(M));
check('nine in ten mimics stand in a room’s L-corner, as most chests do (the rest where a dungeon had no corner left)', corner >= .9 * M.length, [corner, M.length]);
check('no mimic stands beside a chest (a pair of chests would be a tell of its own)', M.every(m => !m.onChest), M.filter(m => m.onChest));
check('the minimap draws the foes you have seen, and never a disguised mimic', all.every(r => r.mm.dots === r.mm.shown) && all.some(r => r.mm.hidden > 0), all.map(r => [r.name, r.mm]));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
