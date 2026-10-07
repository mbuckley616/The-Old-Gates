// At a fort's door, E leaves (Session 624; the critic, 7 Oct 2026). Every fort puts its cot one cell from the entrance, and
// `interact` tried a cot within 1.3 before the way out within 1.4: on the door's cell, under *Press 'E' to leave dungeon*,
// E opened the rest panel. Now the nearer of the two takes E, and the prompt names the same one. Every fort layout, the
// critic's seed (7104, Pellam's Hold) among them: on the door's cell the prompt says leave and E takes you out; on the
// cot's cell the prompt says rest and E opens the rest panel.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const out = [];
const prompt = () => page.evaluate(() => { const e = document.getElementById('ipr'); return e && e.style.display !== 'none' && e.style.opacity !== '0' ? e.textContent : ''; });
for (const [interior, seed] of [['fort_courtyard', 7104], ['fort_linear', 11], ['fort_tee', 23], ['fort_courtyard', 42]]) {
  await enterDungeon(page, { theme: 'ruins', seed, interior, size: 'medium' });
  const o = await page.evaluate(([interior, seed]) => { const b = D_BEDS[0]; if (!b) return { interior, seed, beds: 0 };
    px = dEntranceX; pz = dEntranceZ; jumpY = 0;
    return { interior, seed, beds: D_BEDS.length, door: [dEntranceX, dEntranceZ], cot: [b.x, b.z], apart: +Math.hypot(b.x - dEntranceX, b.z - dEntranceZ).toFixed(2) }; }, [interior, seed]);
  if (o.beds) {
    // the cot's cell first: the prompt, then E
    await page.evaluate(() => { px = D_BEDS[0].x; pz = D_BEDS[0].z; });
    await g.frames(3); o.cotPrompt = await prompt();
    await page.keyboard.press('e'); await g.frames(2);
    o.rest = await page.evaluate(() => { const r = sleepOpen; try { closeSleepUI(); } catch (e) {} return r; });
    o.stayed = await page.evaluate(() => activeZoneId === 'dungeon');
    // the door's cell, where the critic stood: the prompt, then E
    await page.evaluate(() => { px = dEntranceX; pz = dEntranceZ; });
    await g.frames(3); o.doorPrompt = await prompt();
    await page.keyboard.press('e'); await g.frames(2);
    o.restAtDoor = await page.evaluate(() => { const r = sleepOpen; try { closeSleepUI(); } catch (e) {} return r; });
    for (let k = 0; k < 30 && await page.evaluate(() => activeZoneId === 'dungeon'); k++) await page.waitForTimeout(300);
    o.left = await page.evaluate(() => activeZoneId !== 'dungeon');
  }
  out.push(o); console.log(' ', JSON.stringify(o));
}
check('every fort has its cot one cell from the door', out.every(o => o.beds === 1 && o.apart <= 1.5), out);
check("on the cot's cell the prompt says rest and E opens the rest panel, and you stay", out.every(o => o.cotPrompt === "Press 'E' to rest" && o.rest && o.stayed), out);
check("on the door's cell the prompt says leave and E takes you out, not to the cot", out.every(o => o.doorPrompt === "Press 'E' to leave dungeon" && !o.restAtDoor && o.left), out);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
