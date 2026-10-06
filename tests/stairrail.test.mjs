// The spiral stair's railing follows the stair (Session 572; Michael's control-room note of 5 Oct: "the railings being totally
// jumbled"). Each rail segment ran from its tread's angle to the next angle counted without the helix's start (a0), so unless the
// stair began at angle 0 every rail was a chord across the shaft. Each segment's middle now lies on the rail's circle (1.02).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const rows = [];
for (const seed of [4021, 4022, 4023, 4024, 4025, 4026]) {
  await page.evaluate((seed) => { const p = Object.assign({}, PORTALS[0], { theme: 'deep', seed, size: 'large', interior: 'cave', zone: 'world', tutorial: false }); goToDungeon(p); }, seed);
  for (let k = 0; k < 20 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene)); k++) await page.waitForTimeout(300);
  const r = await page.evaluate((seed) => { const f = FOOTHOLDS.find(f => f.kind === 'spiral'); if (!f) return { seed, none: true };
    const rails = []; dScene.traverse(o => { const p = o.geometry && o.geometry.parameters; if (!o.isMesh || !p || o.geometry.type !== 'BoxGeometry' || p.width !== .05 || p.height !== .05) return;
      if (!o.material || o.material.color.getHex() !== 0x3a2e22) return; const d = Math.hypot(o.position.x - f.cx, o.position.z - f.cz); if (d < 1.6) rails.push(+d.toFixed(3)); });
    return { seed, a0: +f.a0.toFixed(2), n: rails.length, min: Math.min(...rails), max: Math.max(...rails) }; }, seed);
  console.log(JSON.stringify(r)); rows.push(r);
}
const S = rows.filter(r => !r.none);
check('six seeds give at least two dungeons with a spiral stair, and one starting away from angle 0', S.length >= 2 && S.some(r => Math.abs(r.a0) > .3), rows);
check('every stair has its thirty rail segments', S.every(r => r.n === 30), S.map(r => r.n));
check('every rail segment\'s middle lies on the rail\'s circle (0.95–1.03 from the post), none across the shaft', S.every(r => r.min >= .95 && r.max <= 1.03), S.map(r => [r.min, r.max]));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
