// Backlog G, chest locks (Session 150): "a dungeon run's worth of chests — whether the picks it costs feel fair (one
// test run had 6 of 9 locked)". The feel is for a person; the count is not. Session 363 enters a spread of the world's
// dungeons and, for each, counts the locks a full clear meets (every locked chest; dungeon doors are picked too), the
// pins on each (lpDifficulty, the lock's own rule), and the lockpicks lying in that dungeon's own chests. A snap costs
// a pick and drops the last pin set (lpBreak), so the picks a lock costs are worked out for a hand that mistimes one
// press in ten, one in five and one in three.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// every dungeon door in the world, by seed, in a steady order; eight spread across the list
const seeds = await page.evaluate(() => { const out = []; for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) { const c = WORLD.getCell(i, j); for (const e of (c && c.doors) || []) if (e && e.seed != null && !e.lair) out.push(e.seed); } return out; });
const picksFor = (pins, e, runs = 4000) => { let spent = 0; let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < runs; k++) { let set = 0; while (set < pins) { if (rnd() < e) { spent++; set = Math.max(0, set - 1); } else set++; } }
  return spent / runs; };
const idx = [...new Set([...Array(8)].map((_, k) => seeds[Math.floor((k + .5) * seeds.length / 8)]).filter(x => x != null))];
console.log(`${seeds.length} dungeon doors in the world; surveying seeds ${idx.join(', ')}`);
const out = [];
for (const i of idx) {
  const r = await page.evaluate(async i => { const wait = ms => new Promise(r => setTimeout(r, ms));
    const e = WORLD.doorAnywhere(i); if (!e) return null; const p = makePortalDef(e); const wp = (WORLD.dungeonPos || {})[i]; if (wp) { p.x = wp.x; p.z = wp.z; px = wp.x; pz = wp.z + 3; } p.zone = 'world';
    goToDungeon(p); for (let k = 0; k < 40 && activeZoneId !== 'dungeon'; k++) await wait(500); await wait(3000);
    const qty = c => (c.items || []).filter(it => it && it.name === 'Lockpick').reduce((a, it) => a + (it.qty || 1), 0);
    const chests = CHESTS.map(c => ({ floor: c.floor, treasure: !!c.treasure, locked: !!c.locked, pins: c.locked ? lpDifficulty(c).pins : 0, picks: qty(c) }));
    const doors = (typeof DOORS !== 'undefined' ? DOORS : []).filter(d => d.locked).map(d => ({ floor: d.floor, pins: lpDifficulty(d).pins }));
    return { i, name: p.name, theme: p.theme, interior: p.interior, zone: activeZoneId, chests, doors, wrong: CHESTS.filter(c => !!c.locked !== (c.treasure || chestLockedAt(c.x, c.z, c.floor))).length };
  }, i);
  if (r) { out.push(r); const L = r.chests.filter(c => c.locked); console.log(`${r.name} (${r.theme}/${r.interior}): ${r.chests.length} chests, ${r.chests.filter(c => c.treasure).length} treasure, ${L.length} locked (pins ${L.map(c => c.pins).join(',') || '–'}); ${r.doors.length} locked doors (pins ${r.doors.map(d => d.pins).join(',') || '–'}); picks in its chests ${r.chests.reduce((a, c) => a + c.picks, 0)} (in open ones ${r.chests.filter(c => !c.locked).reduce((a, c) => a + c.picks, 0)})`); }
  await page.evaluate(() => goToOW()); await page.waitForTimeout(4000); await g.hide();
}
const all = out.filter(r => r.zone === 'dungeon');
const ES = [.1, .2, .33];
const rows = all.map(r => { const locks = [...r.chests.filter(c => c.locked).map(c => c.pins), ...r.doors.map(d => d.pins)];
  return { name: r.name, chests: r.chests.length, lockedChests: r.chests.filter(c => c.locked).length, doors: r.doors.length, locks: locks.length, pins: locks.reduce((a, b) => a + b, 0),
    cost: ES.map(e => +locks.reduce((a, n) => a + picksFor(n, e), 0).toFixed(1)), found: r.chests.reduce((a, c) => a + c.picks, 0), foundOpen: r.chests.filter(c => !c.locked).reduce((a, c) => a + c.picks, 0) }; });
const sum = k => rows.reduce((a, r) => a + r[k], 0);
console.log('\npicks a lock costs, by pins 2/3/4/5, at a miss of 1 in 10 / 1 in 5 / 1 in 3:', [2, 3, 4, 5].map(n => ES.map(e => picksFor(n, e).toFixed(2)).join('/')).join('  '));
for (const r of rows) console.log(`  ${r.name}: ${r.locks} locks (${r.lockedChests} of ${r.chests} chests, ${r.doors} doors), ${r.pins} pins; picks spent ${r.cost.join(' / ')}; picks found ${r.found} (${r.foundOpen} in unlocked chests)`);
console.log(`  all ${rows.length}: ${sum('lockedChests')} of ${sum('chests')} chests locked (${(sum('lockedChests') / Math.max(1, sum('chests')) * 100).toFixed(0)}%), ${sum('doors')} locked doors; mean ${(sum('locks') / Math.max(1, rows.length)).toFixed(1)} locks a dungeon; picks spent a dungeon ${ES.map((_, j) => (rows.reduce((a, r) => a + r.cost[j], 0) / Math.max(1, rows.length)).toFixed(1)).join(' / ')}; picks found a dungeon ${(sum('found') / Math.max(1, rows.length)).toFixed(1)}`);

check('at least five dungeons were entered and surveyed', all.length >= 5, out.map(r => [r.name, r.zone]));
check('every chest in them follows Session 150’s rule (treasure always locked, the rest by floor)', all.every(r => r.wrong === 0), all.map(r => [r.name, r.wrong]));
check('every lock has 2–5 pins, and a treasure chest never fewer than 3', all.every(r => r.chests.every(c => !c.locked || (c.pins >= 2 && c.pins <= 5 && (!c.treasure || c.pins >= 3))) && r.doors.every(d => d.pins >= 2 && d.pins <= 5)), all.map(r => r.chests.filter(c => c.locked).map(c => c.pins)));
check('a lock costs more picks for more pins and for a less steady hand (the model the numbers rest on)', [2, 3, 4].every(n => picksFor(n + 1, .2) > picksFor(n, .2)) && ES.every((e, j) => j === 0 || picksFor(4, e) > picksFor(4, ES[j - 1])), null);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
