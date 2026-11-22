// The Reader's held breath across real sessions (Session 2532, cut from `reader`, Session 242): a save, a page reload and
// Continue with the real clock moved on seven hours (Date.now shifted through localStorage, which survives the reload), and
// Varek at the Ashfeld with the breath's line. Its own suite so each of the two holds one reload: three of them in `reader`
// passed run.mjs's 900 s on CI (the weekly runs of 15 and 22 Nov).
import { boot, check } from './lib/game.mjs';
const H = 3.6e6;
const g = await boot(); const { page } = g;
await page.addInitScript(() => { const o = Date.now.bind(Date); Date.now = () => o() + (+localStorage.getItem('__off') || 0); });
await g.intoWorld();
await page.evaluate(() => { localStorage.setItem('__off', '0'); worldState.masteries = 1; delete worldState.varek;
  worldState.gameTimeAbsMinutes = 9 * 1440 + 600; });
await g.spin(null, 60);
await page.evaluate(() => saveToSlot(0));
await page.evaluate((o) => localStorage.setItem('__off', String(o)), 7 * H);
await page.reload();
await page.waitForFunction(() => { const b = document.getElementById('cb'); return b && b.style.display === 'block'; }, null, { polling: 250, timeout: 120000 });
await page.evaluate(() => document.getElementById('cb').click());
await page.waitForFunction(() => typeof started !== 'undefined' && started && activeZoneId === 'world', null, { polling: 500, timeout: 400000 });
await g.hide();
const away = await page.evaluate(() => { const v = WORLD.varek; return { started, zone: activeZoneId, gapH: +(v.gapH || 0).toFixed(2), due: WORLD.varekDue(), m: worldState.masteries }; });
console.log('away', JSON.stringify(away));
check('continued seven real hours later: the held breath is due', away.gapH >= 6.9 && away.gapH < 7.2 && away.due === 'breath', away);
// Varek at the Ashfeld with the breath's line
const vk = await page.evaluate(() => { const f = WORLD.fieldFor('gatelands'); px = f.x; pz = f.z + 30;
  for (let i = 0; i < 180; i++) WORLD.tick(1 / 60, performance.now());
  const n = ZONES.world.npcs.find(n => n.def && n.def.name === 'Varek') || (typeof npcs !== 'undefined' && npcs.find(n => n.def && n.def.name === 'Varek'));
  return n ? { d: +Math.hypot(n.g.position.x - f.x, n.g.position.z - f.z).toFixed(1), line: n.def.greeting[0].slice(0, 60), field: f.name } : null; });
console.log('varek', JSON.stringify(vk));
check('Varek stands at the Ashfeld with the held breath', vk && vk.d < 10 && /^Nine days passed/.test(vk.line), vk);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
