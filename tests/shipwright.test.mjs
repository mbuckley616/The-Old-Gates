// The sea tutorial's "buy a ship" (Session 273; owed by Session 235): the shipwright keeps a shop's hours, so from 21 to 7
// he could not be found while the tutorial's marker pointed at him. Until you have a ship he waits at his door out of hours.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const ports = await page.evaluate(() => { const s = WORLD.siteAnywhere('dunmore'); return WORLD.allPorts().sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z)).map(p => p.id); });
let port = null;
for (const id of ports.slice(0, 4)) { await g.settle(id); if (await page.evaluate(id => WORLD.settle.get(id).npcs.some(n => n.sched && n.sched.shop === 'shipwright'), id)) { port = id; break; } }
const at = (hour, step) => page.evaluate(([hour, step, port]) => { worldState.ship = null; WORLD.tut.sea = step ? { step, note: true } : null;
  forceTime(hour); for (let i = 0; i < 900; i++) WORLD.tick(1 / 60, performance.now());
  const n = WORLD.settle.get(port).npcs.find(n => n.sched && n.sched.shop === 'shipwright');
  return { hour, step, name: n.def.name, out: !!(n.g.visible && !n._retreated), atDoor: +Math.hypot(n.g.position.x - n.sched.door.x, n.g.position.z - n.sched.door.z).toFixed(2) }; }, [hour, step, port]);
const rows = [];
for (const [h, s] of [[23, null], [3, null], [19.5, null], [23, 'ship'], [3, 'ship'], [19.5, 'ship'], [12, 'ship'], [23, 'crossing']]) rows.push(await at(h, s));
console.log(port, JSON.stringify(rows));
const R = (h, s) => rows.find(r => r.hour === h && r.step === s);
check('a port with a shipwright', !!port, ports);
check('without the tutorial he keeps his shop\u2019s hours: gone at 23h and 3h, off to the inn at 19.5h', !R(23, null).out && !R(3, null).out && R(19.5, null).atDoor > 5, rows);
check('at the step "buy a ship" he is out at his door at 23h, 3h and 19.5h', ['23', '3', '19.5'].every(h => { const r = R(+h, 'ship'); return r.out && r.atDoor < 3; }), rows);
check('by day he is inside, as any keeper (12h)', !R(12, 'ship').out, R(12, 'ship'));
check('past the step he keeps his hours again (23h, crossing)', !R(23, 'crossing').out, R(23, 'crossing'));
// buy one at 23h by his own dialogue
const buy = await page.evaluate(([port]) => { worldState.ship = null; WORLD.tut.sea = { step: 'ship', note: true }; gold = 1000; updateHUD();
  forceTime(23); for (let i = 0; i < 900; i++) WORLD.tick(1 / 60, performance.now());
  const n = WORLD.settle.get(port).npcs.find(n => n.sched && n.sched.shop === 'shipwright'); window._n = n; n._scared = performance.now() + 1;
  window._place = () => { const d = n.sched.door, dx = n.g.position.x - d.x, dz = n.g.position.z - d.z, L = Math.hypot(dx, dz) || 1; px = n.g.position.x + dx / L * 1.3; pz = n.g.position.z + dz / L * 1.3; jumpY = n.g.position.y; yaw = Math.atan2(dx / L, dz / L); pitch = 0; }; _place(); return n.def.name; }, [port]);
await g.frames(2); await page.evaluate(() => _place());
await page.keyboard.press('e'); await g.frames(2);
const ch = await page.evaluate(() => [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim()));
await page.evaluate(() => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => /Buy a ship/.test(x.textContent)); if (b) b.click(); });
await g.frames(2);
const after = await page.evaluate(() => ({ ship: !!worldState.ship, gold, step: WORLD.tut.sea && WORLD.tut.sea.step, text: (document.getElementById('dlg-text') || document.body).textContent.slice(0, 160) }));
console.log(buy, JSON.stringify(ch), JSON.stringify(after));
check('at 23h E on him offers "Buy a ship" at the note’s price (300)', ch.some(c => /Buy a ship \(300 gold, with Corwin/.test(c)), ch);
check('and buying it gives you the ship for 300', after.ship && after.gold === 700, after);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
