// The mantle (Session 1385; platforming B, the numbers F2b's: scale-numbers-build.md's Movement table, and the double jump
// sheet's ledge table). In the air, pressed forward into a ledge your jump's own top cannot step onto, you pull up onto it in
// 0.5 s: anyone to 1.6 m over the feet on the way up and at the top (a ledge to 2.44 m), Catch at Acrobatics 25 to 2.2 m and on
// the way down too, where the catch ends the fall's count. A ledge needs room to stand on it. Ledges are laid as footholds on a
// gate's open floor (6 m to its vault), and a broken gate's chasm rim is caught from below. Driven through the loop at fixed steps.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const seed = await page.evaluate(() => { for (let s = 1; s < 5000; s++) if (gateCondRoll(s) === 'catastrophic' && makeGate('small', s).spaces.some(q => q.type === 'chasm')) return s; });
await enterDungeon(page, { theme: 'ruins', size: 'small', seed });
const R = await page.evaluate(() => {
  window._drive = (step, max, ms = 1000 / 60) => { const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
    let t = performance.now(), n = 0; prevT = t; try { for (; n < max; n++) { if (step(n)) break; t += ms; loop(t); } } finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; } return n; };
  for (const e of ENEMIES) { e.hp = 0; e.dead = true; }
  currentFloor = 1;
  // an open spot: 4 m of open floor east of it and a cell round, no foothold near, 5.5 m or more to the vault
  const open = (x, z) => !dSolid(x, z) && !dAirAt(x, z) && footholdY(x, z, 9, -99) <= 0 && dCeil(x, z) >= 5.5;
  let spot = null;
  for (let r = 2; r < dR - 2 && !spot; r++) for (let c = 2; c < dC - 4 && !spot; c++) { const x = dAt(c), z = dAt(r); let ok = true;
    for (let dx = -1; dx <= 4.5 && ok; dx += .5) for (let dz = -1.5; dz <= 1.5 && ok; dz += .5) ok = open(x + dx, z + dz);
    if (ok && FOOTHOLDS.every(f => f.kind === 'spiral' || x + 5 < f.x0 || x - 2 > f.x1 || z + 2 < f.z0 || z - 2 > f.z1)) spot = { x, z }; }
  if (!spot) return { spot: null };
  const yawE = -Math.PI / 2; // facing +x: the camera looks along (-sin yaw, -cos yaw)
  const acro = () => (SKILLS.acrobatics && SKILLS.acrobatics.p) || 0;
  // one try: a ledge of height h a body's half-width plus 0.2 m ahead; opt.over lays a slab that high over it; opt.fall starts you
  // in the air at that height falling at opt.v; opt.top sets the fall's top. Returns where you ended and whether the pull ran.
  window._try = (lv, h, opt = {}) => {
    const ms = opt.ms || 1000 / 60;
    const L = { x0: spot.x + .5, x1: spot.x + 3, z0: spot.z - 1, z1: spot.z + 1, y: h, id: 'mantle-test' };
    const S = opt.over != null ? { ...L, y: opt.over, id: 'mantle-test-over' } : null;
    FOOTHOLDS.push(L); if (S) FOOTHOLDS.push(S);
    SKILLS.acrobatics = { lv, p: 0 }; for (const k in K) K[k] = false;
    PHP = maxHP; stamina = maxStamina; staminaCD = 0; ROLL = null; FALL.pend = null; FALL.last = null; FALL.top = null; dead = false; PPOST.stagUntil = 0;
    MANTLE.t0 = null; px = spot.x; pz = spot.z; yaw = yawE; pitch = 0;
    if (opt.fall != null) { jumpY = opt.fall; velY = opt.v; onGround = false; if (opt.top != null) { FALL.top = opt.top; FALL.key = fallKey(); FALL.x = px; FALL.z = pz; } }
    else { jumpY = 0; velY = 0; onGround = true; }
    const p0 = acro(); let pulled = false, pullFrames = 0, startY = null;
    const n = _drive(i => {
      K['KeyW'] = true; K['Space'] = opt.fall == null && i === 0;
      if (mantling()) { pulled = true; pullFrames++; if (startY == null) startY = MANTLE.y0; if (opt.onPull) opt.onPull(); }
      return i > 2 && onGround && !mantling() && (pulled || i > 4) && !FALL.pend;
    }, 400, ms);
    for (const k in K) K[k] = false;
    const res = { lv, h, pulled, pullS: +(pullFrames * ms / 1000).toFixed(3), from: startY != null ? +startY.toFixed(2) : null, y: +jumpY.toFixed(3), on: px > L.x0 + .25, dx: +(px - spot.x).toFixed(2), acro: +(acro() - p0).toFixed(3), hp: Math.round(PHP / maxHP * 100), fall: FALL.last, frames: n };
    FOOTHOLDS.splice(FOOTHOLDS.indexOf(L), 1); if (S) FOOTHOLDS.splice(FOOTHOLDS.indexOf(S), 1);
    return res;
  };
  window._spotX = () => spot.x;
  const out = { spot, ceil: +dCeil(spot.x + 1, spot.z).toFixed(2) };
  out.chest = _try(5, 1.5); out.table = _try(5, 1.1); out.top = _try(5, 2.3); out.tooHigh = _try(24, 2.7); out.caught = _try(25, 2.7);
  out.slow = _try(5, 1.5, { ms: 50 });
  out.fall24 = _try(24, 1.5, { fall: .3, v: -2 }); out.fall25 = _try(25, 1.5, { fall: .3, v: -2 });
  out.arrest = _try(25, 3, { fall: 2.2, v: -8, top: 8 });
  out.low = _try(5, 1.5, { over: 2.6 });
  return out;
});
console.log(JSON.stringify(R));
const { chest, table, top, tooHigh, caught, slow, fall24, fall25, arrest, low } = R;
check(`a gate's open floor (${R.ceil} m to the vault) to lay ledges on`, !!R.spot && R.ceil >= 5.5, R.spot);
check(`a 1.5 m ledge, untrained: pulled up onto it in ${chest.pullS} s (0.5), standing on it at ${chest.y} m, ${chest.dx} m on`, chest.pulled && Math.abs(chest.pullS - .5) <= .02 && Math.abs(chest.y - 1.5) < .01 && chest.on && chest.hp === 100, chest);
check(`it counts as Acrobatics' use, a jump that lands higher than it left (+${chest.acro})`, chest.acro > 0, chest);
check(`a 1.1 m ledge, within the jump's own top: no pull, the jump lands you on it (${table.y} m)`, !table.pulled && Math.abs(table.y - 1.1) < .01 && table.on, table);
check(`a 2.3 m ledge: pulled up at the jump's top (from ${top.from} m), anyone's reach of 2.44`, top.pulled && Math.abs(top.y - 2.3) < .01 && top.on, top);
check(`a 2.7 m ledge at Acrobatics 24: out of reach, you come down (${tooHigh.y} m)`, !tooHigh.pulled && tooHigh.y < .01, tooHigh);
check(`at 25, Catch: the same 2.7 m ledge is reached (${caught.y} m)`, caught.pulled && Math.abs(caught.y - 2.7) < .01 && caught.on, caught);
check(`at 20 fps the pull is as long and ends at the same spot (${slow.pullS} s, a frame of 50 ms either side of 0.5; ${slow.dx} against ${chest.dx} m)`, slow.pulled && Math.abs(slow.pullS - .5) <= .051 && Math.abs(slow.dx - chest.dx) < .03 && Math.abs(slow.y - 1.5) < .01, { slow, chest });
check(`falling past a 1.5 m ledge: untrained you fall on (${fall24.y} m); with Catch you catch it (${fall25.y} m)`, !fall24.pulled && fall24.y < .01 && fall25.pulled && Math.abs(fall25.y - 1.5) < .01, { fall24, fall25 });
check(`the catch ends the fall: from 8 m up, caught at a 3 m ledge, no blow (health ${arrest.hp}%, the drop ${arrest.fall && arrest.fall.drop})`, arrest.pulled && Math.abs(arrest.y - 3) < .01 && arrest.hp === 100, arrest);
check(`no room to stand (a slab 1.1 m over the ledge): no pull`, !low.pulled && low.y < .01, low);

// the chasm's rim, caught from below: a broken gate's gone span, stepped off its end facing the far rim at Acrobatics 25
const C = await page.evaluate(() => {
  const gen = window._lastGen, ch = gen.spaces.find(s => s.type === 'chasm'); if (!ch) return { ch: false };
  // a rim cell beside the chasm's air: in the air just off it, facing it, 1.3 m under the floor (past the metre over which the floor
  // snaps you up, so the chasm walls you in), falling
  let at = null;
  for (let r = 1; r < dR - 1 && !at; r++) for (let c = 1; c < dC - 1 && !at; c++) if (dMap[r][c] === 8) for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const m = dMap[r + dr] && dMap[r + dr][c + dc]; if (m === 1 && dCeil(dAt(c + dc), dAt(r + dr)) >= 3 && !dSolid(dAt(c + 2 * dc), dAt(r + 2 * dr))) { at = { c, r, dc, dr }; break; } }
  if (!at) return { ch: true, rim: false };
  const edgeX = dAt(at.c) + at.dc * DCELL / 2, edgeZ = dAt(at.r) + at.dr * DCELL / 2;
  const go = lv => { SKILLS.acrobatics = { lv, p: 0 }; for (const k in K) K[k] = false; PHP = maxHP; FALL.pend = null; FALL.last = null; FALL.top = null; dead = false; MANTLE.t0 = null;
    px = edgeX - at.dc * .32; pz = edgeZ - at.dr * .32; jumpY = -1.3; velY = -1; onGround = false; yaw = Math.atan2(-at.dc, -at.dr); pitch = 0;
    let pulled = false, low = 0;
    _drive(() => { K['KeyW'] = true; pulled = pulled || mantling(); low = Math.min(low, jumpY); return dead || (onGround && !mantling() && pulled) || jumpY < -24; }, 600);
    for (const k in K) K[k] = false;
    return { lv, pulled, y: +jumpY.toFixed(2), low: +low.toFixed(1), dead, air: dAirAt(px, pz) }; };
  return { ch: true, rim: true, untrained: go(5), caught: go(25) };
});
console.log(JSON.stringify(C));
check(`a broken gate's chasm: falling just under its rim, untrained you go down the pit (${C.untrained && C.untrained.low} m); with Catch you catch the rim and stand on the floor (${C.caught && C.caught.y} m)`,
  C.rim && !C.untrained.pulled && C.untrained.low < -20 && C.caught.pulled && Math.abs(C.caught.y) < .01 && !C.caught.air && !C.caught.dead, C);

// S1401 — the pull's pose in third person: the builder's body plants both wrists on the ledge, a hand's breadth past its edge, while the
// pull lifts it, and lets go as it stands
const P = await page.evaluate(() => { thirdPerson = true; const at = []; let hb = false;
  const r = _try(5, 1.5, { onPull: () => { const p = (FALL.clock - MANTLE.t0) / MANTLE_DUR, H = TP.rig && TP.rig.rig.hb; hb = hb || !!H; if (!H || p < .1 || p > .3) return;
    TP.rig.root.updateMatrixWorld(true); const M = TP.rig.mantle; if (!M) return;
    at.push(['wrist.L', 'wrist.R'].map((k, i) => +H.P.byName[k].getWorldPosition(new THREE.Vector3()).distanceTo(M.T[i]).toFixed(3)).concat(+(M.T[0].y - 1.5).toFixed(3), +(M.T[0].x - _spotX()).toFixed(2))); } });
  thirdPerson = false; return { r, hb, at }; });
console.log(JSON.stringify(P));
const off = P.at.length ? Math.max(...P.at.map(a => Math.max(a[0], a[1]))) : null;
check(`in third person the pull plants the builder's wrists on the ledge (within ${off} m of the hold over ${P.at.length} frames) and ends on it`, P.r.pulled && P.r.on && P.hb && P.at.length > 3 && off < .06 && P.at.every(a => a[2] > 0 && a[2] < .1 && a[3] > .5), P);
// and in first person, empty-handed: both fists come down onto the ledge (FIST_POSE.press) and sink as the pull lifts you past them
const V = await page.evaluate(() => { thirdPerson = false; const ys = [];
  const r = _try(5, 1.5, { onPull: () => { const p = (FALL.clock - MANTLE.t0) / MANTLE_DUR, u = vmSword && vmSword.userData; if (u && u.fists && u.fistL) ys.push([+p.toFixed(2), +vmSword.position.y.toFixed(3), +u.fistL.position.y.toFixed(3)]); } });
  return { r, ys, rest: FIST_POSE.rest[1], press: FIST_POSE.press[1] }; });
console.log(JSON.stringify(V));
const at = q => V.ys.find(y => y[0] >= q);
check(`in first person both fists come down to the ledge (${at(.2) && at(.2).slice(1)} at 0.2 of the pull, the rest ${V.rest}) and sink below it (${at(.6) && at(.6).slice(1)} at 0.6)`,
  V.r.pulled && at(.2) && at(.6) && Math.abs(at(.2)[1] - V.press) < .03 && Math.abs(at(.2)[2] - V.press) < .03 && at(.6)[1] < V.press - .15 && at(.6)[2] < V.press - .15, V);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
