// Falls hurt (Session 429; platforming, Michael's B on the designer's page): free up to 4 units, then 6% of your
// health a unit beyond, so about 21 units from full is death. A roll begun within 0.2 s of landing (or pressed in
// the air that long before) halves it. Driven through the game's own loop: the player is lifted and let go.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// lift the player `h` above the ground under them and let go; resolve once landed and the roll window has passed.
// pressAt: press Q when this far above the ground (in the air), or 'after' to press it on the first frame on the ground.
const drop = (h, opt = {}) => page.evaluate(([h, opt]) => new Promise(res => {
  PHP = maxHP; stamina = maxStamina; staminaCD = 0; ROLL = null; FALL.last = null; FALL.pend = null; FALL.qAt = -9;
  const ground = () => isInterior() || (lid && lid.startsWith('dyn_')) ? footholdY(px, pz, jumpY, 0) : activeTerrainH(px, pz);
  const g0 = ground(); jumpY = g0 + h; velY = 0; onGround = false; const hp0 = PHP;
  let pressed = false, rolled = false, landedAt = null, frames = 0, tele = false, teleAt = null;
  const f = () => { frames++;
    if (opt.tele && !tele && jumpY < g0 + h - 1) { tele = true; px += 60; teleAt = { from: +(g0 + h - g0).toFixed(2), y: jumpY, ground: ground(), left: +(jumpY - ground()).toFixed(2) }; }
    if (!onGround && !pressed && opt.pressAt != null && opt.pressAt !== 'after' && jumpY - ground() < opt.pressAt) { pressed = true; startRoll(performance.now() / 1000, window._K); }
    if (onGround && landedAt == null) { landedAt = FALL.clock;
      if (opt.pressAt === 'after' && !pressed) { pressed = true; rolled = startRoll(performance.now() / 1000, window._K); } }
    if (ROLL) rolled = true;
    if ((landedAt != null && FALL.clock - landedAt > .3 && !FALL.pend) || dead) return res({ h, g0: +g0.toFixed(2), last: FALL.last, lost: hp0 - PHP, maxHP, rolled, dead, frames, teleAt });
    if (frames > 600) return res({ timeout: true, h, last: FALL.last, onGround, jumpY, g0 });
    requestAnimationFrame(f); };
  requestAnimationFrame(f);
}), [h, opt]);
const full = r => Math.max(1, Math.round(r.maxHP * .06 * (r.last.drop - 4)));

// outdoors
const o1 = await drop(3.9);
check('outdoors: a drop of 3.9 units costs nothing', !o1.timeout && o1.last === null && o1.lost === 0, o1);
const jump = await page.evaluate(() => new Promise(res => { PHP = maxHP; FALL.last = null; const hp0 = PHP; window._K['Space'] = true;
  let n = 0; const f = () => { if (++n === 2) window._K['Space'] = false; if (n > 3 && onGround) return res({ last: FALL.last, lost: hp0 - PHP }); if (n > 300) return res({ timeout: true }); requestAnimationFrame(f); }; requestAnimationFrame(f); }));
check('outdoors: your own jump costs nothing', !jump.timeout && jump.last === null && jump.lost === 0, jump);
const o2 = await drop(10);
check('outdoors: 10 units costs 6% of health a unit past 4 (36% of it)', !o2.timeout && o2.last && Math.abs(o2.last.drop - 10) < .05 && o2.last.dmg === full(o2) && o2.lost === o2.last.dmg && !o2.last.rolled && o2.rolled === false, o2);
const o3 = await drop(10, { pressAt: 'after' });
check('outdoors: a roll on the first frame on the ground halves it', !o3.timeout && o3.last && o3.last.rolled && o3.last.dmg === Math.round(full(o3) / 2) && o3.lost === o3.last.dmg, o3);
const o4 = await drop(10, { pressAt: 1.5 });
check('outdoors: Q pressed in the air just before landing rolls you on landing, and halves it', !o4.timeout && o4.last && o4.last.rolled && o4.rolled && o4.last.dmg === Math.round(full(o4) / 2), o4);
const o5 = await drop(10, { pressAt: 9.5 });
check('outdoors: Q pressed at the top of the fall (a second early) does not', !o5.timeout && o5.last && !o5.last.rolled && o5.last.dmg === full(o5), o5);
const o6 = await drop(10, { tele: true });
check('outdoors: moved 60 units in the air (travel), the fall counts from where you were put, not from the old height', !o6.timeout && o6.teleAt && (o6.last ? Math.abs(o6.last.drop - o6.teleAt.left) < .6 : o6.teleAt.left <= 4.6), o6);

// in a dungeon: the gallery's drop, the stairwell's five units
const dun = await page.evaluate(() => { const p = PORTALS.find(p => p && p.seed != null && p.zone === 'world'); px = p.x; pz = p.z + 3; goToDungeon(p); return p.name; });
await page.waitForTimeout(6000); await g.hide();
const d1 = await page.evaluate(() => ({ lid, inDun: lid.startsWith('dyn_') }));
const d2 = await drop(5);
check(`in a dungeon (${dun}): five units costs 6% of health`, d1.inDun && !d2.timeout && d2.last && Math.abs(d2.last.drop - 5) < .05 && d2.last.dmg === full(d2), { d1, d2 });
const d3 = await drop(12, { pressAt: 'after' });
check('in a dungeon: 12 units with a roll costs half', !d3.timeout && d3.last && d3.last.rolled && d3.last.dmg === Math.round(full(d3) / 2), d3);
const d4 = await drop(22);
check('in a dungeon: 22 units from full health is death', !d4.timeout && d4.last && d4.last.dmg >= d4.maxHP && d4.dead, d4);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
