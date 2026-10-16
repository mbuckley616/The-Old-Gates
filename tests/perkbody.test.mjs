// The perks, first wave: Stealth and Athletics (Session 974; skills and perks A, the build sheet's third session). Built:
// Stealth's Soft step (25, sneak at walking speed), In the dark (50, sight on you ×0.75 more out of light) and Light foot
// (75, a spike plate does not trigger while you sneak or sprint); Athletics' Swimmer (25, swim at run speed), Long breath
// (50, three times the air), Road legs (75, no sprint cost on a road) and Tireless (100, no pause after a sprint).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const r = await page.evaluate(() => {
  const out = {}; const sk0 = JSON.parse(JSON.stringify(SKILLS)); const set = (id, lv) => { SKILLS[id] = { lv, p: 0 }; };
  // Soft step
  _sneaking = true; set('stealth', 24); out.sneak24 = sneakMoveMult(); set('stealth', 25); out.sneak25 = sneakMoveMult(); _sneaking = false; out.walk = sneakMoveMult();
  // Swimmer and Long breath
  set('athletics', 24); out.swim24 = +swimSpeed().toFixed(3); out.breath24 = breathSecs();
  set('athletics', 25); out.swim25 = +swimSpeed().toFixed(3); out.run25 = +(3.83 + .37 * skillT('athletics')).toFixed(3);
  set('athletics', 50); out.breath50 = breathSecs();
  // Road legs: a point on a road near Dunmore, and one off it
  const S = WORLD.settle.get('dunmore'); let onR = null, offR = null;
  for (let k = 0; k < 4000 && !(onR && offR); k++) { const a = k * 2.399, rr = 20 + (k % 60) * 2; const x = S.site.x + Math.cos(a) * rr, z = S.site.z + Math.sin(a) * rr; const q = roadInfo(x, z);
    if (q && q.d < 1 && !onR) onR = { x, z }; if ((!q || q.d > 8) && !offR) offR = { x, z }; }
  out.found = { onR: !!onR, offR: !!offR };
  const at = p => { px = p.x; pz = p.z; return roadLegsNow(); };
  set('athletics', 74); out.road74 = onR && at(onR); set('athletics', 75); out.road75 = onR && at(onR); out.off75 = offR && at(offR);
  // In the dark: a foe's sight and a witness's reach, sneaking at night in the open, Stealth 49 then 50; by day no change
  _sneaking = true; const ratio = () => { set('stealth', 49); const a = _sneakDetectMult(); set('stealth', 50); const b = _sneakDetectMult(); return +(b / a / ((1 - .4 * .5) / (1 - .4 * .49))).toFixed(3); };
  forceTime(23); out.darkNight = ratio(); out.outOfLight = outOfLight(); forceTime(13); out.darkDay = ratio(); _sneaking = false;
  out.state = { onR, offR };
  for (const k in sk0) SKILLS[k] = sk0[k]; return out; });
console.log(JSON.stringify(r));
check(`Soft step: sneaking moves ×${r.sneak24} at Stealth 24, ×${r.sneak25} at 25 (the walk is ×${r.walk})`, r.sneak24 < 1 && r.sneak25 === 1 && r.walk === 1, r);
check(`Swimmer: the swim ${r.swim24} at Athletics 24, ${r.swim25} at 25, the run's ${r.run25}`, r.swim24 < r.swim25 && r.swim25 === r.run25, r);
check(`Long breath: ${r.breath24} s of air at Athletics 24, ${r.breath50} at 50`, r.breath24 === 40 && r.breath50 === 120, r);
check('found a road near Dunmore, and ground off it', r.found.onR && r.found.offR, r.found);
check(`Road legs: on the road at Athletics 75 (${r.road75}), not at 74 (${r.road74}), not off the road (${r.off75})`, r.road75 === true && r.road74 === false && r.off75 === false, r);
check(`In the dark: sneaking at night in the open, Stealth 50 takes ×${r.darkNight} more off sight; by day ×${r.darkDay}`, r.outOfLight && r.darkNight === .75 && r.darkDay === 1, r);

// the loop: Road legs and Tireless measured on the sprint itself, and Light foot on a spike plate
// the game's own loop at a fixed 1/60 (as attrpromise drives it), with the real Shift and W held
await page.evaluate(() => { window._raf = window.requestAnimationFrame; window._rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  window._t = performance.now(); window._step = (n) => { for (let i = 0; i < n; i++) { _t += 1000 / 60; loop(_t); } }; });
const sprint = async (lv, where, st, frames) => {
  await page.evaluate(([lv, p, st]) => { SKILLS.athletics = { lv, p: 0 }; px = p.x; pz = p.z; jumpY = 0; ACTIVE_BUFFS.length = 0; stamina = st; staminaCD = 0; }, [lv, where, st]);
  await page.keyboard.down('Shift'); await page.keyboard.down('w');
  const o = await page.evaluate(n => { _step(n); return { stamina: +stamina.toFixed(2), cd: +staminaCD.toFixed(2), sprintNow: _sprintNow }; }, frames);
  await page.keyboard.up('w'); await page.keyboard.up('Shift'); await page.evaluate(() => _step(2));
  return o; };
const sk0 = await page.evaluate(() => JSON.stringify(SKILLS.athletics));
const onRoad = await sprint(75, r.state.onR, 8, 10);
const offRoad74 = await sprint(74, r.state.offR, 8, 10);
const tired = await sprint(99, r.state.offR, 1, 12);
const tireless = await sprint(100, r.state.offR, 1, 12);
await page.evaluate(s => { SKILLS.athletics = JSON.parse(s); }, sk0);
console.log(JSON.stringify({ onRoad, offRoad74, tired, tireless }));
check(`Road legs on the sprint: stamina 8 → ${onRoad.stamina} over ten frames on the road (sprinting: ${onRoad.sprintNow})`, onRoad.sprintNow && onRoad.stamina >= 8, onRoad);
check(`off the road at 74 the sprint drains it (${offRoad74.stamina})`, offRoad74.stamina < 8, offRoad74);
check(`Tireless: emptied by a sprint, the pause is ${tired.cd.toFixed(2)} s at Athletics 99 and ${tireless.cd} at 100`, tired.cd > 1 && tireless.cd === 0, { tired, tireless });

const foot = await page.evaluate(() => {
  const keepScene = scene, keepD = dScene, hp = PHP; const fake = new THREE.Scene(); dScene = fake; scene = fake; jumpY = currentFloor === 2 ? FLOOR2_Y : 0;
  const trap = () => ({ kind: 'spike', armed: true, x: px, z: pz, floor: currentFloor, t: 0, spikes: new THREE.Group() });
  const run = (lv, sneak, spr) => { SKILLS.stealth = { lv, p: 0 }; _sneaking = sneak; _sprintNow = spr; const t = trap(); D_TRAPS.length = 0; D_TRAPS.push(t); PHP = hp; tickDungeonTraps(1 / 60); return t.armed; };
  const st0 = JSON.stringify(SKILLS.stealth); const o = { walk75: run(75, false, false), sneak75: run(75, true, false), sprint75: run(75, false, true), sneak74: run(74, true, false) };
  D_TRAPS.length = 0; _sneaking = false; _sprintNow = false; PHP = hp; SKILLS.stealth = JSON.parse(st0); scene = keepScene; dScene = keepD; return o; });
console.log(JSON.stringify(foot));
check(`Light foot: at Stealth 75 the plate stays armed sneaking (${foot.sneak75}) and sprinting (${foot.sprint75}), and springs at a walk (${!foot.walk75})`, foot.sneak75 && foot.sprint75 && !foot.walk75, foot);
check(`at Stealth 74 sneaking springs it (${!foot.sneak74})`, !foot.sneak74, foot);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
