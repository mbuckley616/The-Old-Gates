// Foes and townsfolk are solid to you (Session 623; backlog C, Michael's playtest of 6 Oct: "you should not be able to walk
// through them"). After your step each frame a live foe or a townsperson out in the world is a disc that pushes you to its edge
// (`pushFromBodies`, `90-main.js`): yours 0.25, a townsperson's 0.3, a foe's 0.3 × its size, capped at 0.7 in the open (0.9 a
// boss) and 0.5 underground so it can still come inside its own blow. W held straight into each for 3 s through the game's loop.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step(n)) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; K['KeyW'] = false; }
  return n; };
  // W held toward a body 2 units ahead; the nearest the two come, and whether you were held at its edge
  window._walkInto = (pos, setup) => { forceTime(12); PHP = maxHP; dead = false; ROLL = null; let min = 99, tells = 0, wasT = false, e = setup && setup();
    _drive((n) => { PHP = maxHP; const p = pos(); const sy = Math.atan2(-(p.x - px), -(p.z - pz)); yaw = sy; K['KeyW'] = true;
      if (n > 5) min = Math.min(min, Math.hypot(p.x - px, p.z - pz)); if (e) { if (e.telegraphT > 0 && !wasT) tells++; wasT = e.telegraphT > 0; } return false; }, 180);
    return { min: +min.toFixed(3), tells }; }; });

const world = await page.evaluate(() => { const out = []; const L = ZONES.world.enemies; const t = WORLD.siteAnywhere('dunmore');
  for (const kind of ['Bandit', 'Wolf', 'Ogre']) { px = t.x + 40; pz = t.z + 40; yaw = 0;
    const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], px, pz - 2, kind, null)); L.push(e);
    const r = _walkInto(() => ({ x: e.x, z: e.z }), () => { e.alert = true; return e; });
    out.push({ kind, R: +(bodyR(e, .7) + BODY_YOU).toFixed(3), ...r }); e.dead = true; WORLD.scene.remove(e.mesh); L.splice(L.indexOf(e), 1); }
  return out; });
console.log(JSON.stringify(world));
check('in the open, W into a Bandit, a Wolf and an Ogre stops you at the foe\'s edge (never more than 0.03 inside it)', world.length === 3 && world.every(w => w.min >= w.R - .03 && w.min < 1.2), world);
check('the disc follows the foe\'s size: the Wolf\'s (0.75) narrower than the Bandit\'s, the Ogre\'s (1.6) wider', world[1].R < world[0].R && world[2].R > world[0].R, world.map(w => w.R));
check('and each still closes and winds up its blow on you', world.every(w => w.tells >= 1), world.map(w => w.tells));

const folk = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const n = S.npcs.find(n => n.g.visible && n.sched && n.sched.type === 'villager') || S.npcs.find(n => n.g.visible);
  const p = n.g.position; const hx = p.x, hz = p.z; px = hx; pz = hz + 2;
  const r = _walkInto(() => ({ x: n.g.position.x, z: n.g.position.z })); return { name: n.def.name, ...r }; });
console.log(JSON.stringify(folk));
check('W into a townsperson in Dunmore stops you at 0.55 (0.3 + 0.25)', folk.min >= .52 && folk.min < 1.5, folk);

await page.evaluate(() => { level = 4; const p = Object.assign({}, PORTALS[0], { theme: 'deep', seed: 4021, size: 'medium', interior: 'cave', zone: 'world', tutorial: false }); goToDungeon(p); });
for (let k = 0; k < 40 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene)); k++) await page.waitForTimeout(500);
await page.waitForTimeout(1500);
const dun = await page.evaluate(() => { const out = [];
  const live = ENEMIES.filter(e => !e.dead && !e.disguised && !e.dormant && e.floor === 1 && !e.ranged && !e.master);
  for (const e of live) { if (out.length >= 3) break; const c = Math.round(e.x), r = Math.round(e.z); let open = true;
    for (let i = -1; i <= 1; i++) for (let j = -3; j <= 1; j++) if (dSolid(c + i, r + j)) open = false; if (!open) continue;
    ENEMIES.forEach(x => { if (x !== e && !x.dead) { x.dead = true; x._tmp = true; } });
    e.x = c; e.z = r - 1; px = c; pz = r + 1; jumpY = 0; currentFloor = 1; staggered.length = 0; e.fleeT = 0; e._fleeTriggered = true;
    const w = _walkInto(() => ({ x: e.x, z: e.z }), () => { e.alert = true; e.atkCd = 0; e.telegraphT = 0; return e; });
    out.push({ name: e.name, R: +(bodyR(e, .5) + BODY_YOU).toFixed(3), ...w });
    ENEMIES.forEach(x => { if (x._tmp) { x.dead = false; x._tmp = false; } }); e.dead = true; }
  return out; });
console.log(JSON.stringify(dun));
check('underground, W into three foes stops you at each one\'s edge', dun.length >= 3 && dun.every(w => w.min >= w.R - .03), dun);
check('and each still winds up its blow', dun.every(w => w.tells >= 1), dun.map(w => w.tells));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
