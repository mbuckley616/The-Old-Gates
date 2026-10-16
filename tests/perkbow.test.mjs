// The perks, first wave: the Bow (Session 982; skills and perks A, the build sheet's third session). Built: Quick nock (50,
// the draw fills 30% faster), Long eye (75, an arrow falls at half the gravity once it has flown 50 m) and Through (100, a
// full-draw arrow passes the first foe it strikes and can strike one more). Steady (25, a held full draw without sway) waits:
// the game's bow has no sway to take away.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step && step()) break; PHP = maxHP; dead = false; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });

// 1. Quick nock: frames of the game's own loop from an empty draw to a full one, at Bow 49 and 50
const nock = await page.evaluate(() => { const sk0 = JSON.stringify(SKILLS.bow); const out = {};
  for (const lv of [49, 50]) { SKILLS.bow = { lv, p: 0 }; _bowDrawing = true; _bowDrawT = 0;
    out['f' + lv] = _drive(() => { stamina = maxStamina; return _bowDrawT >= BOW_DRAW_MAX; }, 200); _bowDrawing = false; _bowDrawT = 0; }
  SKILLS.bow = JSON.parse(sk0); out.live = [25, 50, 75, 100].map(r => PERK_LIVE.has('bow:' + r)); return out; });
console.log('nock', JSON.stringify(nock));
check(`Quick nock: a full draw takes ${nock.f49} frames at Bow 49 and ${nock.f50} at 50 (0.7 of the time)`,
  Math.abs(nock.f49 - 66) <= 1 && Math.abs(nock.f50 - Math.round(66 * .7)) <= 1, nock);
check(`the Bow's perks built: Quick nock, Long eye and Through; Steady not yet (${nock.live.join(' ')})`,
  JSON.stringify(nock.live) === '[false,true,true,true]', nock.live);

// 2. Long eye: an arrow fired level from high over open ground, through tickArrowMotion alone, at Bow 74 and 75
const eye = await page.evaluate(() => { const out = {};
  // a bearing with nothing solid for 70 m, and the highest ground under it
  let dir = null, top = 0;
  for (let k = 0; k < 24 && !dir; k++) { const a = k * Math.PI / 12, dx = Math.sin(a), dz = Math.cos(a); let ok = true, h = -1e9;
    for (let d = 0; d <= 70; d += .5) { const x = px + dx * d, z = pz + dz * d; if (currentZoneSolid(x, z)) { ok = false; break; } h = Math.max(h, activeTerrainH(x, z)); }
    if (ok) { dir = { dx, dz }; top = h; } }
  out.found = !!dir; if (!dir) return out;
  const fly = (lv) => { const sk0 = JSON.stringify(SKILLS.bow); SKILLS.bow = { lv, p: 0 };
    const a = new THREE.Object3D(); a.position.set(px, top + 40, pz);
    a.userData = { vx: dir.dx * ARROW_SPEED, vy: 0, vz: dir.dz * ARROW_SPEED, life: ARROW_LIFE, isArrow: true, longEye: perk('bow', 75), x0: px, z0: pz };
    const y0 = a.position.y; let at45 = null, s = 'flying';
    for (let i = 0; i < 400 && s === 'flying'; i++) { s = tickArrowMotion(a, 1 / 60, true);
      if (at45 === null && Math.hypot(a.position.x - px, a.position.z - pz) >= 45) at45 = +(y0 - a.position.y).toFixed(3); }
    SKILLS.bow = JSON.parse(sk0);
    return { at45, drop: +(y0 - a.position.y).toFixed(3), far: +Math.hypot(a.position.x - px, a.position.z - pz).toFixed(1), vy: +a.userData.vy.toFixed(3), end: s }; };
  out.f74 = fly(74); out.f75 = fly(75); return out; });
console.log('eye', JSON.stringify(eye));
check('found 70 m of open ground from the start', eye.found, eye);
check(`Long eye: to 45 m the arrow falls alike (${eye.f74.at45} at Bow 74, ${eye.f75.at45} at 75)`, eye.f74.at45 === eye.f75.at45 && eye.f74.at45 > 0, eye);
{ const t = eye.f74.far / 28, t50 = 50 / 28; // the flight's time in seconds (ARROW_SPEED 28), and its time to 50 m
  check(`past 50 m it falls at half the gravity: ${eye.f75.drop} m against ${eye.f74.drop} m by the end of its flight (${eye.f74.far} m)`,
    eye.f74.end === 'expired' && eye.f75.end === 'expired' && eye.f75.drop < eye.f74.drop && eye.f75.vy > eye.f74.vy
    && Math.abs(-eye.f75.vy - 4 * (t50 + (t - t50) / 2)) < .2 && Math.abs(-eye.f74.vy - 4 * t) < .2, { eye, t, t50 }); }

// 3. Through: three Bandits in a line 4, 7 and 10 units ahead; one full-draw arrow at Bow 99 and at 100, and a weaker one at 100
const shot = (lv, strength) => page.evaluate(([lv, strength]) => { forceTime(12);
  const keep = ZE.splice(0, ZE.length), w0 = EQ.weapon, a0 = EQ.ammo, tp0 = thirdPerson, pi0 = pitch, x0 = px, z0 = pz, sk0 = JSON.stringify(SKILLS.bow);
  EQ.weapon = { name: 'Test Bow', ico: '🏹', type: 'equip', slot: 'weapon', atk: [5, 30], weaponShape: 'bow', wType: 'pierce', twoHand: true, weight: 3 };
  EQ.ammo = { name: 'Iron Arrow', ico: '➶', type: 'ammo', qty: 50, arrowDmg: [2, 12] }; thirdPerson = false; pitch = 0; SKILLS.bow = { lv, p: 0 };
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), at = [4, 7, 10];
  const foes = at.map(d => { const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], px + fx * d, pz + fz * d, 'Bandit', null)); e.spd = 0; e.atkCd = 99; e.hp = e.maxHp = 9999; ZE.push(e); return e; });
  let out;
  try { fireArrow(strength); const a = ZB[ZB.length - 1], ud = { through: a.userData.through, longEye: a.userData.longEye };
    _drive(() => { px = x0; pz = z0; foes.forEach((e, i) => { e.x = px + fx * at[i]; e.z = pz + fz * at[i]; e.atkCd = 99; }); return a.userData.stuck || !a.parent; }, 90);
    out = { hit: foes.map(e => e.hp < 9999), ud, stuck: a.userData.stuckType || null, passed: a.userData.passed ? foes.indexOf(a.userData.passed) : -1 }; }
  finally { EQ.weapon = w0; EQ.ammo = a0; thirdPerson = tp0; pitch = pi0; SKILLS.bow = JSON.parse(sk0); ZE.splice(0, ZE.length, ...keep);
    foes.forEach(e => { e.dead = true; if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); }); px = x0; pz = z0; }
  return out; }, [lv, strength]);
const t99 = await shot(99, 1), t100 = await shot(100, 1), t100w = await shot(100, .8);
console.log('through', JSON.stringify({ t99, t100, t100w }));
check(`at Bow 99 a full draw stops in the first foe (${t99.hit.join(' ')}, ${t99.stuck})`, JSON.stringify(t99.hit) === '[true,false,false]' && t99.stuck === 'stuck-enemy' && !t99.ud.through, t99);
check(`Through: at Bow 100 a full draw strikes the first, flies on, and stops in the second (${t100.hit.join(' ')}, ${t100.stuck})`,
  JSON.stringify(t100.hit) === '[true,true,false]' && t100.passed === 0 && t100.stuck === 'stuck-enemy' && t100.ud.through && t100.ud.longEye, t100);
check(`a draw short of full at Bow 100 stops in the first (${t100w.hit.join(' ')})`, JSON.stringify(t100w.hit) === '[true,false,false]' && !t100w.ud.through, t100w);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
