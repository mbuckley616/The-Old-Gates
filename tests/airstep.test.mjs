// Second step, the double jump at Acrobatics 75 (Session 1009; docs/design/double-jump-and-dash-build.md, its session 1, less
// the air-speed cap DECISION #370 holds). A fresh press of Space in the air sets the rise to 4.5 m/s, once a flight, for 12
// stamina; a held Space never fires it. The flight is integrated exactly, so a jump is as high at 20 fps as at 60. The head
// stops at a room's ceiling and a dungeon's, and a press near the ground does not reset a fall's count. The sheet's suites
// `airstep`, `headroom` and `airfall` in one. Driven through the game's own loop at fixed steps, the draw held off.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => {
  window._drive = (step, max, ms = 1000 / 60) => {
    const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
    let t = performance.now(), n = 0; prevT = t;
    try { for (; n < max; n++) { if (step(n)) break; t += ms; loop(t); } }
    finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
    return n; };
  window._ground = () => isInterior() || (lid && lid.startsWith('dyn_')) ? footholdY(px, pz, jumpY, 0) : activeTerrainH(px, pz);
  // one jump from where you stand. opt.second: 'top' presses Space again at the top, a number presses it that far above
  // the ground on the way down; opt.hold keeps Space held the whole flight; opt.stam sets the bar just before the press;
  // opt.third presses once more after the step; opt.ms the frame's length. Returns the flight's top over the ground.
  window._jump = (lv, opt = {}) => {
    SKILLS.acrobatics = { lv, p: 0 }; for (const k in K) K[k] = false;
    PHP = maxHP; stamina = maxStamina; staminaCD = 0; ROLL = null; FALL.pend = null; FALL.last = null; PPOST.stagUntil = 0;
    onGround = true; velY = 0; const g0 = _ground(); jumpY = g0;
    let top = g0, phase = 0, before = null, after = null, rise = null, third = null, vThird = null, landed = false, prevV = 0, used = false; AIRSTEP.used = false;
    const n = _drive(i => {
      if (i === 0) { K['Space'] = true; return false; }
      if (i === 1 && !opt.hold) K['Space'] = false;
      if (i > 1 && onGround) { landed = true; return true; }
      top = Math.max(top, jumpY); used = used || AIRSTEP.used;
      if (phase === 0 && opt.second != null && i > 1) {
        const at = opt.second === 'top' ? (prevV > 0 && velY <= 0) : (velY < 0 && jumpY - _ground() < opt.second);
        if (at) { if (opt.stam != null) stamina = opt.stam; before = stamina; K['Space'] = true; phase = 1; prevV = velY; return false; }
      }
      if (phase === 1) { after = stamina; rise = velY + 18 / 60 * ((opt.ms || 1000 / 60) / (1000 / 60)); K['Space'] = false; phase = 2; }
      else if (phase === 2 && opt.third) { K['Space'] = true; vThird = velY; phase = 3; }
      else if (phase === 3) { third = +(velY - vThird).toFixed(3); K['Space'] = false; phase = 4; }
      prevV = velY; return false;
    }, 2000, opt.ms);
    for (const k in K) K[k] = false;
    return { lv, top: +(top - g0).toFixed(3), used, cost: before != null ? +(before - after).toFixed(2) : null, rise: rise != null ? +rise.toFixed(2) : null, third: third != null ? +third.toFixed(2) : null, landed, frames: n, fall: FALL.last };
  };
});

// the sheet's numbers: the first jump's rise 5.5 + 1.1 × skillT (G 18), the step's 4.5
const apex = lv => { const v = 5.5 + 1.1 * Math.max(0, Math.min(1, (lv - 5) / 95)); return v * v / 36; };
const out = {};
for (const lv of [74, 75, 100]) out['top' + lv] = await page.evaluate(lv => _jump(lv, { second: 'top' }), lv);
out.plain75 = await page.evaluate(() => _jump(75));
out.held = await page.evaluate(() => _jump(100, { hold: true }));
out.third = await page.evaluate(() => _jump(100, { second: 'top', third: true }));
out.winded = await page.evaluate(() => _jump(100, { second: 'top', stam: 11 }));
out.slow = await page.evaluate(() => _jump(5, { ms: 50 }));
out.fast = await page.evaluate(() => _jump(5));
console.log(JSON.stringify(out));
const { top74, top75, top100 } = out;
check(`nothing at Acrobatics 74: the press at the top adds nothing (${top74.top} m, one jump ${apex(74).toFixed(3)})`, !top74.used && Math.abs(top74.top - apex(74)) < .03, top74);
check(`at 75 a fresh press at the top rises to ${top75.top} m (the sheet's 1.66 ±0.03), at 100 to ${top100.top} m (1.77)`, top75.used && Math.abs(top75.top - 1.66) <= .03 && top100.used && Math.abs(top100.top - 1.77) <= .03 && Math.abs(top75.rise - 4.5) < .01, { top75, top100 });
check(`the step costs 12 stamina (${top75.cost}, ${top100.cost}); the first jump stays free`, top75.cost === 12 && top100.cost === 12, { top75, top100 });
check(`without the press, a jump at 75 is the one jump (${out.plain75.top} m)`, !out.plain75.used && Math.abs(out.plain75.top - apex(75)) < .03, out.plain75);
check(`Space held through the flight never fires it (${out.held.top} m at 100)`, !out.held.used && Math.abs(out.held.top - apex(100)) < .03, out.held);
check(`once a flight: a third press after the step adds no rise (the frame's change ${out.third.third} m/s, gravity's −0.3)`, out.third.used && Math.abs(out.third.third + .3) < .001 && Math.abs(out.third.top - 1.77) <= .03, out.third);
check(`too winded at 11 stamina: nothing (${out.winded.top} m)`, !out.winded.used && Math.abs(out.winded.top - apex(100)) < .03, out.winded);
check(`a jump is as high at 20 fps as at 60 (${out.slow.top} and ${out.fast.top} m; ${apex(5).toFixed(3)} by the sheet)`, Math.abs(out.slow.top - apex(5)) < .02 && Math.abs(out.fast.top - apex(5)) < .01, { slow: out.slow, fast: out.fast });

// the fall: a 12 m drop with the step pressed 1 m above the ground is counted from the top
const fall = await page.evaluate(() => {
  SKILLS.acrobatics = { lv: 75, p: 0 }; for (const k in K) K[k] = false; PHP = maxHP; stamina = maxStamina; staminaCD = 0; FALL.last = null; FALL.pend = null;
  const g0 = _ground(); jumpY = g0 + 12; velY = 0; onGround = false; let pressed = false, stepped = false;
  _drive(i => { if (!pressed && jumpY - _ground() < 1) { K['Space'] = true; pressed = true; return false; } if (pressed && !stepped) { stepped = AIRSTEP.used; K['Space'] = false; }
    return onGround && !FALL.pend && i > 2; }, 1200);
  for (const k in K) K[k] = false;
  return { stepped, last: FALL.last };
});
check(`a 12 m drop, the step pressed 1 m up: the fall is counted from the top (${fall.last && fall.last.drop} m)`, fall.stepped && fall.last && Math.abs(fall.last.drop - 12) < .05, fall);

// the head at the ceiling: a cottage in Dunmore, then a dungeon
await g.settle('dunmore');
// Session 1424 — the room, the street and the dungeon are each waited for (each is built in doFade's callback), not 4, 3 and 6 s: in
// the weekly run of 25 Oct the dungeon's jump ran with `dun: false` under the open sky, FLAKY (docs/qa/flaky.md)
const until = async (what, fn, arg) => { const t0 = Date.now(); try { await page.waitForFunction(fn, arg, { polling: 100, timeout: 60000 }); }
  catch (e) { console.log(`  ${what} not seen after ${Math.round((Date.now() - t0) / 1000)} s`); } };
// Session 1212: on the new look every Dunmore home is a kit townhouse, two storeys outside (`two`) and one floor within (2.887 m to
// the ceiling, nothing over you), so it is taken next; the fallback had been the church, 7.2 m up, out of the double jump's reach.
const room = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'home' && !x.two) || S.houses.find(x => x.type === 'home' && x.kit && x.kit.kind === 'townhouse') || S.houses.find(x => !x.two && x.type !== 'inn');
  forceTime(13); px = h.exitX; pz = h.exitZ; goToInterior(h); return { id: h.id, type: h.type }; });
await until('in the room', id => currentHouse && currentHouse.id === id && document.getElementById('fd').style.opacity === '0', room.id); await g.hide(); await g.frames(4);
// Session 1437: the kit townhouse's own room (three floors): the ceiling over you is the first floor's underside, read where you stand
const inRoom = await page.evaluate(() => { let H = currentHouse._roomH; const W = currentHouse.intW, D = currentHouse.intD;
  // a clear spot: no foothold or solid within 0.6 m below a floor overhead (2.2 m up), 0.8 m in from the walls
  const clear = (x, z) => FOOTHOLDS.every(f => f.kind === 'spiral' || f.y > 2.2 || x < f.x0 - .6 || x > f.x1 + .6 || z < f.z0 - .6 || z > f.z1 + .6) && (INT_SOL || []).every(s => s.y0 > 2.2 || x < s.x0 - .6 || x > s.x1 + .6 || z < s.z0 - .6 || z > s.z1 + .6);
  let best = null; for (let x = .8; x < W - .8; x += .2) for (let z = .8; z < D - .8; z += .2) if (clear(x, z)) { const d = Math.hypot(x - W / 2, z - D / 2); if (!best || d < best.d) best = { x, z, d }; }
  const free = !!best; if (best) { px = best.x; pz = best.z; H = Math.min(H, headCeil(px, pz, 0)); }
  const r = _jump(100, { second: 'top' }); return { inside: isInterior(), H: +H.toFixed(3), free, ...r, headAt: +(r.top + HEAD_H).toFixed(3) }; });
check(`indoors (${room.type}, ${inRoom.H} m to the ceiling): the double jump's head stops at the ceiling (${inRoom.headAt} m)`, inRoom.inside && inRoom.free && inRoom.H > 2.5 && inRoom.H < 3.4 && Math.abs(inRoom.headAt - inRoom.H) < .01 && inRoom.landed, { room, inRoom });
const inRoomLow = await page.evaluate(() => { const r = _jump(5); return { ...r, headAt: +(r.top + HEAD_H).toFixed(3), H: Math.min(currentHouse._roomH, headCeil(px, pz, 0)) }; });
check(`indoors, an untrained jump stays under it (head at ${inRoomLow.headAt} m)`, inRoomLow.headAt < inRoomLow.H - .05 && Math.abs(inRoomLow.top - apex(5)) < .01, inRoomLow);

const dun = await page.evaluate(() => { exitInterior && exitInterior(); return true; });
await until('back in the street', () => currentHouse === null && document.getElementById('fd').style.opacity === '0');
await page.evaluate(() => { const p = PORTALS.find(p => p && p.seed != null && p.zone === 'world'); px = p.x; pz = p.z + 3; goToDungeon(p); });
await until('in the dungeon', () => String(lid).startsWith('dyn_') && document.getElementById('fd').style.opacity === '0'); await g.hide(); await g.frames(4);
const inDun = await page.evaluate(() => { const r = _jump(100, { second: 'top' }); return { dun: lid.startsWith('dyn_'), floorH: FLOOR_HEIGHT, floor: currentFloor, ...r, headAt: +(r.top + HEAD_H).toFixed(3), ceil: +(headCeil(px, pz, _ground()) - _ground()).toFixed(3) }; });
const dunWant = Math.min(1.77, inDun.ceil - 1.8);
check(`in a dungeon (${inDun.floorH} m to the ceiling over you: ${inDun.ceil}): the double jump's top is ${inDun.top} m (${dunWant.toFixed(2)} wanted)`, inDun.dun && inDun.used && Math.abs(inDun.top - dunWant) < .03 && inDun.landed, inDun);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
