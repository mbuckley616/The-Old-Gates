// Session 637 — the log (Michael's B on #192, docs/design/the-ship-in-hand.md, the shared ground's first piece): a half-dial
// of 0 to 30 knots on the helm panel, one knot one unit a second. The needle stands at her speed, a brass tick at the most she
// can make now (top speed × hull and rig), the number under it, and a notch on the rim at each hull's top under full sails.
// Sailed at sea with W held through the world's tick at 1/60.
import { boot, check } from './lib/game.mjs';
import path from 'path';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const sea = await page.evaluate(() => { const s = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  let sx = null, sz = null; for (let r = 300; r < 3000 && sx === null; r += 30) for (let a = 0; a < 6.28; a += .3) { const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
    if ([[0, 0], [60, 0], [-60, 0], [0, 60], [0, -60], [0, -120], [0, -180]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -5)) { sx = x; sz = z; break; } }
  window._sea = { x: sx, z: sz }; return { ok: sx !== null }; });
check('open sea off the nearest port', sea.ok, sea);

// the dial's angle back to knots: 0 at the left (180°), 30 at the right (0°), about the centre (67, 62)
const read = () => page.evaluate(() => { WORLD.shipBarsUI(); const q = id => document.getElementById(id); const el = q('shipbars');
  const kn = (x, y) => +((1 - Math.atan2(62 - y, x - 67) / Math.PI) * 30).toFixed(2);
  const n = q('shipbars-needle'), m = q('shipbars-max');
  return { shown: !!el && el.style.display === 'block', text: q('shipbars-kn') && q('shipbars-kn').textContent, speed: +Math.abs(WORLD.ship.speed).toFixed(2), most: +shipSpeedNow().toFixed(2),
    needle: n ? kn(+n.getAttribute('x2'), +n.getAttribute('y2')) : null, max: m ? kn(+m.getAttribute('x2'), +m.getAttribute('y2')) : null,
    notches: [...document.querySelectorAll('#shipbars-log .log-notch')].map(l => kn(+l.getAttribute('x2'), +l.getAttribute('y2'))).sort((a, b) => a - b) }; });

await page.evaluate(() => { for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); WORLD.ship.sailing = true; });
const still = await read();
await page.evaluate(() => { HELD_KEYS.KeyW = true; for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now()); });
const two = await read();
await page.evaluate(() => { for (let i = 0; i < 600; i++) WORLD.tick(1 / 60, performance.now()); });
const run = await read();
console.log('still', JSON.stringify(still)); console.log('2 s', JSON.stringify(two)); console.log('12 s', JSON.stringify(run));
check(`at the wheel the panel shows the log at 0: "${still.text}"`, still.shown && still.text === '0.0 kn' && Math.abs(still.needle) < .05, still);
check(`two seconds under W the needle reads her speed (${two.speed} → "${two.text}", needle at ${two.needle})`, two.shown && two.text === `${two.speed.toFixed(1)} kn` && Math.abs(two.needle - two.speed) < .08 && two.speed > 3 && two.speed < 7, two);
check(`at full way a bare sloop's 7.5 sits at a quarter of the dial (needle ${run.needle}, "${run.text}")`, run.text === '7.5 kn' && Math.abs(run.needle - 7.5) < .08 && Math.abs(run.needle / 30 - .25) < .005, run);
check(`the brass tick is the most she can make now: ${run.max} (shipSpeedNow ${run.most})`, Math.abs(run.max - run.most) < .06 && Math.abs(run.max - 7.5) < .06, run);
check(`a notch at each hull's top under full sails: ${run.notches.join(', ')}`, run.notches.length === 5 && [11.1, 12.58, 14.06, 16.28, 17.76].every((v, i) => Math.abs(run.notches[i] - v) < .06), run.notches);

// under half her hull she makes ×0.8: the brass tick drops to 6.0, and the needle follows her down
await page.evaluate(() => { worldState.ship.hull = 45; for (let i = 0; i < 600; i++) WORLD.tick(1 / 60, performance.now()); });
const hurt = await read();
console.log('hurt', JSON.stringify(hurt));
check(`at hull 45 of 100 the tick stands at ${hurt.max} and she makes "${hurt.text}"`, Math.abs(hurt.max - 6) < .06 && hurt.text === '6.0 kn' && Math.abs(hurt.needle - 6) < .08, hurt);

// a cutter at four tiers fills the dial to her notch, 17.8 (back where the sea was checked clear, with way on: 8 s, 140 units)
await page.evaluate(() => { worldState.ship.cls = 'cutter'; worldState.ship.sails = 4; worldState.ship.hull = 80; worldState.ship.rig = 100; applyShipClass(); const S = WORLD.ship; S.x = _sea.x; S.z = _sea.z; S.yaw = 0; S.sailing = true; S.speed = 17;
  for (let i = 0; i < 480; i++) WORLD.tick(1 / 60, performance.now()); });
const cut = await read();
console.log('cutter', JSON.stringify(cut));
check(`a cutter under four tiers of sail reaches ${cut.text}, the top notch (${(cut.needle / 30 * 100).toFixed(0)}% of the dial)`, cut.text === '17.8 kn' && Math.abs(cut.needle - 17.76) < .1 && Math.abs(cut.max - 17.76) < .06, cut);
const dir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'docs', 'prototypes', 'ship-in-hand');
await page.evaluate(() => { const el = document.getElementById('shipbars'); el.style.transform = 'scale(2)'; el.style.transformOrigin = 'bottom right'; });
await g.frames(2);
await page.locator('#shipbars').screenshot({ path: path.join(dir, 'log-ingame.png') }).catch(e => console.log('shot', e.message));
await page.evaluate(() => { const el = document.getElementById('shipbars'); el.style.transform = ''; });

// off the deck and away from the wheel the panel goes
await page.evaluate(() => { HELD_KEYS.KeyW = false; WORLD.ship.sailing = false; px = WORLD.ship.x + 200; pz = WORLD.ship.z; jumpY = 0; });
const off = await read();
check('ashore, 200 units off, the panel is hidden', !off.shown, off);

stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
