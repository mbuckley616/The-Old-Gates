// The cowards and the second phase (Session W's behaviours, owed by feel in backlog G, *Saves first*: "kobold cowards and the
// boss half-health phase"). Played headless in the running game: the loop's own tick at fixed 1/60, with the scene's draw and
// the browser's frames held off (as `duelrhythm` does), on foes set down as a quest sets them (`unlockFoe`) at noon.
// - A Goblin or a Kobold under 40% health, alert, runs for the nearest friend that has not seen you (within 70 units), says so once
//   (*The goblin runs for help.*), and within four units of it raises everyone within 12; then both come for you.
// - A big foe (a boss, a Captain, Troll, Ogre, Wight, Hag or Bear) under half health roars and speeds up by a third; from
//   then, every 6 s within 7 units it winds up a full second and lands a heavy blow (2.2× its damage) within 3.2 units, and
//   a player who steps out of that reach takes nothing (*You step clear.*).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step()) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; };
  window._clear = (list) => { for (const e of list) { e.dead = true; if (e.mesh) WORLD.scene.remove(e.mesh); const L = ZONES.world.enemies, i = L.indexOf(e); if (i >= 0) L.splice(i, 1); } }; });

// 1. the coward: three units off at 30% health, a friend 25 units the other side, out of sight of you
for (const kind of ['Goblin', 'Kobold']) {
const cw = await page.evaluate((kind) => {
  forceTime(12); PHP = maxHP; dead = false; PPOST.stagUntil = 0; const L = ZONES.world.enemies;
  const c = unlockFoe(buildZoneEnemy(WORLD.scene, [], px, pz - 3, kind, null)); c.alert = true; c.hp = Math.floor(c.maxHp * .3); L.push(c);
  const f = unlockFoe(buildZoneEnemy(WORLD.scene, [], px + 25, pz - 3, kind, null)); L.push(f);
  const msgs = []; const _m = showMsg; showMsg = function (t) { if (/runs for help/.test(t)) msgs.push(t); return _m.apply(this, arguments); };
  let n = 0, fetchedAt = null, back = null; const d0 = Math.hypot(c.x - f.x, c.z - f.z);
  const step = () => { n++; PHP = maxHP; if (c._fetched && fetchedAt == null) fetchedAt = { s: +(n / 60).toFixed(2), gap: +Math.hypot(c.x - f.x, c.z - f.z).toFixed(1), fromYou: +Math.hypot(c.x - px, c.z - pz).toFixed(1) };
    if (fetchedAt && n / 60 >= fetchedAt.s + 6) { back = { c: +Math.hypot(c.x - px, c.z - pz).toFixed(1), f: +Math.hypot(f.x - px, f.z - pz).toFixed(1) }; return true; } };
  let frames; try { frames = _drive(step, 60 * 25); } finally { showMsg = _m; }
  const out = { d0: +d0.toFixed(1), maxHp: c.maxHp, hp: c.hp, msgs, fetchedAt, back, alert: [c.alert, f.alert], frames };
  _clear([c, f]); return out; }, kind);
console.log(kind, JSON.stringify(cw));
check(`the ${kind} under 40% runs for its friend, saying so once`, cw.msgs.length === 1 && cw.msgs[0] === `The ${kind.toLowerCase()} runs for help.`, cw.msgs);
check('it reaches the friend (within four units) in under 10 s, twenty units from you', cw.fetchedAt && cw.fetchedAt.gap < 4 && cw.fetchedAt.s < 10 && cw.fetchedAt.fromYou > 15, cw.fetchedAt);
check('the friend is raised, and both come for you: each nearer you six seconds on', cw.alert[0] && cw.alert[1] && cw.back && cw.back.c < cw.fetchedAt.fromYou - 4 && cw.back.f < cw.fetchedAt.fromYou - 4, cw);
}

// 2. the second phase: an Ogre two units off at 45%; you step out of its first heavy's reach, then stand for the second
const ph = await page.evaluate(() => {
  forceTime(12); PHP = maxHP; dead = false; PPOST.stagUntil = 0; const L = ZONES.world.enemies;
  const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], px, pz - 2, 'Ogre', null)); e.alert = true; e.hp = Math.floor(e.maxHp * .45); L.push(e);
  const spd0 = e.spd, msgs = []; const _m = showMsg; showMsg = function (t) { if (/roars|winds up|heavy blow|step clear/.test(t)) msgs.push([+(n / 60).toFixed(2), t]); return _m.apply(this, arguments); };
  let n = 0, winds = 0, stepped = null;
  const step = () => { n++; if (PHP < 60) PHP = maxHP; e.hp = Math.max(e.hp, Math.floor(e.maxHp * .4));
    if (e._windup != null && e._windup > .5 && winds === 1 && !stepped) { stepped = n; const ux = (px - e.x), uz = (pz - e.z), d = Math.hypot(ux, uz) || 1; px = e.x + ux / d * 4.5; pz = e.z + uz / d * 4.5; }
    if (e._windup != null && e._windup > .95) winds = msgs.filter(m => /winds up/.test(m[1])).length;
    return msgs.filter(m => /heavy blow|step clear/.test(m[1])).length >= 2; };
  try { _drive(step, 60 * 25); } finally { showMsg = _m; }
  const out = { dmg: e.dmg, spd0, spd: e.spd, msgs }; _clear([e]); return out; });
console.log('second phase', JSON.stringify(ph));
const T = (re) => ph.msgs.filter(m => re.test(m[1])).map(m => m[0]);
check('under half health the Ogre roars once and quickens by a third', T(/roars/).length === 1 && Math.abs(ph.spd / ph.spd0 - 1.3) < .01, ph);
check('it winds up a second before each heavy, the heavies six seconds apart', T(/winds up/).length >= 2 && Math.abs(T(/winds up/)[1] - T(/winds up/)[0] - 6) < .1 && Math.abs(T(/heavy blow|step clear/)[0] - T(/winds up/)[0] - 1) < .1, ph.msgs);
check('stood in reach, the heavy lands for 2.2× its blow', ph.msgs.some(m => m[1] === `Ogre's heavy blow: ${Math.round(ph.dmg * 2.2)}.`), ph.msgs);
check('stepped out of reach during the wind-up, it lands nothing', ph.msgs.some(m => m[1] === 'You step clear.'), ph.msgs);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
