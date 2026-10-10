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
    out.push({ kind, size: +(e.size || (e.mesh && e.mesh.scale && e.mesh.scale.x) || 1).toFixed(3), R: +(bodyR(e, .7) + BODY_YOU).toFixed(3), ...r }); e.dead = true; WORLD.scene.remove(e.mesh); L.splice(L.indexOf(e), 1); }
  return out; });
console.log(JSON.stringify(world));
check('in the open, W into a Bandit, a Wolf and an Ogre stops you at the foe\'s edge (never more than 0.03 inside it)', world.length === 3 && world.every(w => w.min >= w.R - .03 && w.min < 1.2), world);
/* S662 — the Wolf was 0.75 when this was written (S623); Session 632 (#187) made it 1.05, so its disc is now a shade wider than the
   Bandit's. The rule is the size: each disc is 0.3 × its size (0.2–0.7) plus yours, and they rank as the sizes do */
check('the disc follows the foe\'s size: each is 0.3 × its size (0.2–0.7) plus yours, ranked as the sizes are (the Ogre\'s widest)',
  world.every(w => Math.abs(w.R - (Math.max(.2, Math.min(.7, .3 * w.size)) + .25)) < .002)
  && world.every(a => world.every(b => a.size <= b.size ? a.R <= b.R : a.R >= b.R)) && world[2].R > world[0].R, world.map(w => ({ kind: w.kind, size: w.size, R: w.R })));
check('and each still closes and winds up its blow on you', world.every(w => w.tells >= 1), world.map(w => w.tells));

const folk = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const n = S.npcs.find(n => n.g.visible && n.sched && n.sched.type === 'villager') || S.npcs.find(n => n.g.visible);
  const p = n.g.position; const hx = p.x, hz = p.z; px = hx; pz = hz + 2;
  /* S629 — held where she stands each frame: her own step into you (she moves you aside, by design) read 0.501 once in four runs */
  const r = _walkInto(() => { n.g.position.x = hx; n.g.position.z = hz; return { x: hx, z: hz }; }); return { name: n.def.name, ...r }; });
console.log(JSON.stringify(folk));
check('W into a townsperson in Dunmore stops you at 0.55 (0.3 + 0.25)', folk.min >= .52 && folk.min < 1.5, folk);

/* S631 — the door is built from its own seed (`makePortalDef`), not copied from PORTALS[0] (another door on CI). Each foe is set on
   open ground found by a scan of floor 1, not on its own cell: the foes wander through the real-time waits, and on CI one had
   walked off open ground, so only two were measured */
await page.evaluate(() => { level = 4; const p = makePortalDef({ theme: 'deep', seed: 4021, size: 'medium', interior: 'cave', zone: 'world' }); goToDungeon(p); });
for (let k = 0; k < 40 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene)); k++) await page.waitForTimeout(500);
await page.waitForTimeout(1500);
const dun = await page.evaluate(() => { const out = [];
  const live = ENEMIES.filter(e => !e.dead && !e.disguised && !e.dormant && e.floor === 1 && !e.ranged && !e.master);
  const spots = []; currentFloor = 1;
  for (let r = 3; r < dR - 1; r++) for (let c = 1; c < dC - 1; c++) { let open = true;
    for (let i = -1; i <= 1 && open; i++) for (let j = -3; j <= 1; j++) if (dSolid(c + i, r + j)) { open = false; break; }
    if (open && spots.every(s => Math.hypot(s.c - c, s.r - r) > 6)) spots.push({ c, r }); }
  for (const e of live) { if (out.length >= 3 || !spots.length) break; const { c, r } = spots.shift();
    ENEMIES.forEach(x => { if (x !== e && !x.dead) { x.dead = true; x._tmp = true; } });
    e.x = c; e.z = r - 1; px = c; pz = r + 1; jumpY = 0; currentFloor = 1; staggered.length = 0; e.fleeT = 0; e._fleeTriggered = true;
    const w = _walkInto(() => ({ x: e.x, z: e.z }), () => { e.alert = true; e.atkCd = 0; e.telegraphT = 0; return e; });
    out.push({ name: e.name, R: +(bodyR(e, .5) + BODY_YOU).toFixed(3), ...w });
    ENEMIES.forEach(x => { if (x._tmp) { x.dead = false; x._tmp = false; } }); e.dead = true; }
  return out; });
console.log(JSON.stringify(dun));
check('underground, W into three foes stops you at each one\'s edge', dun.length >= 3 && dun.every(w => w.min >= w.R - .03 && w.min < 1.2), dun);
check('and each still winds up its blow', dun.every(w => w.tells >= 1), dun.map(w => w.tells));
const discs = await page.evaluate(() => { const o = {}; for (const e of ENEMIES) { const k = e.baseType || e.name; (o[k] = o[k] || new Set()).add(+bodyR(e, .5).toFixed(3) + '@' + e.size); }
  const r = {}; for (const k in o) r[k] = [...o[k]]; return { r, unsized: ENEMIES.filter(e => !e.size).length }; });
console.log(JSON.stringify(discs));
const d1 = k => discs.r[k] && parseFloat(discs.r[k][0]);
check('S629: every dungeon foe carries its size, so its disc follows its build (a Golem or Cave Troll wider than a Skeleton, a Goblin narrower)',
  discs.unsized === 0 && Object.keys(discs.r).length >= 3 && (d1('Golem') || d1('Cave Troll') || 0) > d1('Skeleton') && (!d1('Goblin') || d1('Goblin') < d1('Skeleton')), discs);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
