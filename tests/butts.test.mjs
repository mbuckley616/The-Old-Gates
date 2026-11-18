// Riverfair's butts, the town's practice ground all year, on the new look (Session 2331; Michael's A on #1672; contests.js of Session 2317).
// Every Gatelands town, village, city and port lays a lane 76 m long off its pad and away from its roads (buttsLane, 82), the same whatever
// has loaded; the scatter is cleared off it (buttsLaneStamps); the town stands the mark, three pegs and the butt with its bales at 30 m
// (kitButts, 83; PKIT.props.butts and .butt, 38-kit.js). At Dunmore: the pieces within their draws, nothing solid on the lane but the
// butt, an arrow's line from the mark clear of the ground to every end, and a contest begun with no mark given shot down the town's own
// lane with the kit's butt, the standing butt lifted while it runs and back after. One picture from the mark.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
// 1. the census: every Gatelands place of the four kinds, each lane chosen twice (the second time from nothing cached) the same
const cen = await page.evaluate(() => { anchoredPlaces(); const cells = [...CELLS.values()].filter(c => c.type !== 'sea' && nationOf(c.i, c.j).people === 'gatelander');
  let n = 0, got = 0, same = 0, rise = 0; const diff = [];
  for (const c of cells) for (const s of c.sites) { if (!['city', 'town', 'village', 'port'].includes(s.kind) || s.islet) continue; n++;
    const a = buttsLane(s, c), A = JSON.stringify(a); delete s._butts; delete c._buttsNear; const b = buttsLane(s, c);
    if (A === JSON.stringify(b)) same++; else diff.push(s.id); if (a) { got++; rise = Math.max(rise, a.rise); } }
  return { n, got, same, diff: diff.slice(0, 5), rise }; });
console.log(JSON.stringify(cen));
check(`the census: ${cen.got} of ${cen.n} Gatelands places lay a lane (at least four in five), the steepest rising ${cen.rise} m over 76 m`, cen.n > 50 && cen.got >= cen.n * .8 && cen.rise <= 6, cen);
check('each lane is chosen the same from nothing cached', cen.same === cen.n, cen.diff);

// 2. Dunmore's lane where it stands
check('Dunmore is built', await g.settle('dunmore'));
const r = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), B = S && S.butts; if (!B) return { none: true };
  const site = siteAnywhere('dunmore'), L = buttsLane(site), c = Math.cos(B.ry), s_ = Math.sin(B.ry), W = (lx, lz) => [B.x + lx * c + lz * s_, B.z - lx * s_ + lz * c];
  const blocked = [], unstamped = []; for (let v = -3; v <= 72; v += 1.5) for (const u of [-1.2, 0, 1.2]) { const [x, z] = W(u, -v); if (!stampAt(x, z)) unstamped.push([u, v]);
    if (v > 28 && v < 33) continue; /* the butt's own */ if (solidAt(x, z)) blocked.push([u, v]); }
  const gy = v => { const [x, z] = W(0, -v); return worldH(x, z); }, eye = gy(0) + 1.5; let clear = 9;
  for (const D of [30, 50, 70]) { const fy = gy(D) + 1.2; for (let v = 1; v < D - 1; v += .5) clear = Math.min(clear, eye + (fy - eye) * v / D - gy(v)); }
  const f = B.face, [fx, fz] = W(0, -30), pad = Math.hypot(B.x - site.x, B.z - site.z) - site.pad;
  return { same: !!L && L.x === B.x && L.z === B.z, pad: +pad.toFixed(1), blocked: blocked.length, at: blocked.slice(0, 4), unstamped: unstamped.length, clear: +clear.toFixed(2),
    faceAt: +Math.hypot(f.x - fx, f.z - fz).toFixed(3), faceUp: +(f.y - gy(30)).toFixed(2), draws: B.draws, tris: B.tris, road: (() => { let m = 99; for (let v = -4; v <= 72; v += 2) { const [x, z] = W(0, -v), ri = roadInfo(x, z); if (ri) m = Math.min(m, ri.d); } return +m.toFixed(1); })() }; });
console.log(JSON.stringify(r));
check(`Dunmore's lane stands where the cells chose it, its mark ${r.pad} m off the pad, ${r.road} m from the nearest road's line`, !r.none && r.same && r.pad > 4 && r.road > 9, r);
check(`the lane is cleared (${r.unstamped} points outside its clearing) and nothing solid stands on it but the butt (${r.blocked})`, r.unstamped === 0 && r.blocked === 0, r.at);
check(`an arrow's line from the mark, 1.5 m up, to each face clears the ground by ${r.clear} m`, r.clear >= .25, r.clear);
check(`the butt's face at the 30 m peg, ${r.faceUp} m up; ${r.draws} draws (10 or fewer) and ${r.tris} triangles (6,000 or fewer)`, r.faceAt < .01 && Math.abs(r.faceUp - 1.2) < .35 && r.draws <= 10 && r.tris <= 6000, r);

// 2b. no herb grows on the lane (Session 2354): neither the scatter's after the lane is stamped, nor one a chunk grew before its cell stamped it;
// and the scatter's own rule refuses the lane at every point down it
const hb = await page.evaluate(() => { const B = WORLD.settle.get('dunmore').butts, lane = STAMPS.filter(s => s.butts && s.id.startsWith('butts_dunmore_'));
  const on = h => !h.offPad && !h.harvested && lane.some(s => Math.hypot(h.x - s.x, h.z - s.z) < s.r);
  const left = ZONES.world.herbs.filter(on).map(h => h.id); let near = 0; for (const h of ZONES.world.herbs) if (!h.offPad && lane.some(s => Math.hypot(h.x - s.x, h.z - s.z) < s.r + 12)) near++;
  let refused = 0, asked = 0; for (const s of lane) for (let a = 0; a < 6.28; a += .8) { asked++; if (onButtsLane(s.x + Math.cos(a) * 3, s.z + Math.sin(a) * 3)) refused++; }
  return { stamps: lane.length, left, near, refused, asked }; });
console.log(JSON.stringify(hb));
check(`no herb on the lane's ${hb.stamps} clearings (${hb.left.length} left; ${hb.near} grow within 12 m of it), and the scatter refuses ${hb.refused} of ${hb.asked} points on it`, hb.stamps >= 15 && hb.left.length === 0 && hb.refused === hb.asked, hb);

// 3a. the mark on E (Session 2337): on Riverfair the mark offers the butts and E steps you up; the day before, or 4 m off, it asks nothing;
// before ten E gives the hours and starts nothing
const pr = await page.evaluate(() => { const site = siteAnywhere('dunmore'), B = WORLD.settle.get('dunmore').butts, st = TS(site), keep = { p: st.p, flags: st.flags };
  const rf = FESTIVALS.find(f => f.key === 'riverfair'), n = ((rf.month - CAL.startMonth + 12) % 12) * 28 + rf.dom - 1;
  const at = (day, h) => { worldState.gameTimeAbsMinutes = day * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  st.p = 70; st.flags = {}; worldState.festivals = {}; const w0 = EQ.weapon, a0 = EQ.ammo, msgs = [], sm = window.showMsg; const out = {};
  EQ.weapon = { name: 'Test Bow', ico: '🏹', type: 'equip', slot: 'weapon', atk: [5, 7], weaponShape: 'bow', wType: 'pierce', twoHand: true, weight: 3 };
  EQ.ammo = { name: 'Iron Arrow', ico: '➶', type: 'ammo', qty: 30, arrowDmg: [2, 12] };
  try { window.showMsg = (m, c) => { msgs.push(m); };
    px = B.x; pz = B.z; at(n - 1, 11); out.before = buttsPrompt();
    at(n, 11); out.on = buttsPrompt(); out.world = shipPrompt(); px = B.x + B.dz * 4; pz = B.z - B.dx * 4; out.off = buttsPrompt(); px = B.x; pz = B.z;
    at(n, 9); out.early = shrineInteract(); out.earlyBut = !!BUTTS; out.earlySay = msgs[msgs.length - 1];
    at(n, 11); out.e = shrineInteract(); out.started = !!BUTTS; out.mark = BUTTS ? +Math.hypot(BUTTS.x - B.x, BUTTS.z - B.z).toFixed(3) : null; out.during = buttsPrompt();
  } finally { window.showMsg = sm; if (BUTTS) buttsEnd('left'); EQ.weapon = w0; EQ.ammo = a0; Object.assign(st, keep); worldState.festivals = {}; }
  return out; });
console.log(JSON.stringify(pr));
check(`on Riverfair at the mark the world's prompt is the butts' (${pr.world}); the day before ${pr.before}, 4 m off ${pr.off}`, pr.on === "Press 'E' to step up to the mark" && pr.world === pr.on && !pr.before && !pr.off, pr);
check(`E at 9:00 gives the hours (${pr.earlySay}) and starts nothing; at 11:00 it steps you up on the lane's mark, and the prompt is gone while you shoot`, pr.early && !pr.earlyBut && /10:00/.test(pr.earlySay || '') && pr.e && pr.started && pr.mark < .01 && !pr.during, pr);

// 3. the contest down the lane: begun with no mark given, it takes the lane's; the kit's butt moves from end to end, the standing one lifted
const ct = await page.evaluate(() => { const site = siteAnywhere('dunmore'), S = WORLD.settle.get('dunmore'), B = S.butts, st = TS(site), keep = { p: st.p, flags: st.flags };
  const rf = FESTIVALS.find(f => f.key === 'riverfair'), n = ((rf.month - CAL.startMonth + 12) % 12) * 28 + rf.dom - 1; worldState.gameTimeAbsMinutes = n * 1440 + 660; worldState.gameTimeMinutes = 660;
  st.p = 70; st.flags = {}; worldState.festivals = {}; const w0 = EQ.weapon, a0 = EQ.ammo; px = B.x; pz = B.z;
  EQ.weapon = { name: 'Test Bow', ico: '🏹', type: 'equip', slot: 'weapon', atk: [5, 7], weaponShape: 'bow', wType: 'pierce', twoHand: true, weight: 3 };
  EQ.ammo = { name: 'Iron Arrow', ico: '➶', type: 'ammo', qty: 30, arrowDmg: [2, 12] }; const out = {};
  try { const R = buttsStart({ site }); out.ok = R.ok; out.say = R.say; if (!BUTTS) return out;
    out.mark = +Math.hypot(BUTTS.x - B.x, BUTTS.z - B.z).toFixed(3); out.line = +(BUTTS.dx * B.dx + BUTTS.dz * B.dz).toFixed(4); out.kit = BUTTS.mesh && BUTTS.mesh.name; out.lifted = !B.butt.visible;
    const lane = () => { let n = 0; for (let v = 29; v <= 33.01; v += .25) if (currentZoneSolid(B.x + B.dx * v, B.z + B.dz * v)) n++; return n; }; out.solidUp = lane();
    const shoot = () => { fireArrow(1); const a = ZB[ZB.length - 1], Q = BUTTS; a.position.set(Q.cx - Q.dx * .4, Q.cy, Q.cz - Q.dz * .4); a.userData.vx = Q.dx * 30; a.userData.vz = Q.dz * 30; a.userData.vy = 0;
      for (let k = 0; k < 10; k++) { tickArrowMotion(a, 1 / 60, true); tickButts(); } };
    const ends = []; for (let k = 0; k < 9 && BUTTS; k++) { ends.push(+Math.hypot(BUTTS.cx - B.x, BUTTS.cz - B.z).toFixed(1)); shoot(); }
    out.shots = (worldState.festivals, ZB.filter(a => a.userData.butt).map(a => [a.userData.butt.end, a.userData.butt.score, a.userData.butt.r && +a.userData.butt.r.toFixed(3)])); out.ends = [...new Set(ends)]; out.done = !BUTTS; out.score = (worldState.festivals['riverfair:' + site.id] || {}).score; out.back = B.butt.visible; out.solidBack = lane(); out.solids = S.sol.filter(q => q.butts).length;
  } finally { if (BUTTS) buttsEnd('left'); EQ.weapon = w0; EQ.ammo = a0; Object.assign(st, keep); worldState.festivals = {}; }
  return out; });
console.log(JSON.stringify(ct));
check(`buttsStart with no mark takes the lane's: on its mark (${ct.mark} m), down its line, with the kit's butt, the standing one lifted`, ct.ok && ct.mark < .01 && ct.line > .9999 && ct.kit === 'butt' && ct.lifted, ct);
check(`with the standing butt lifted nothing solid stands 29–33 m down the lane (${ct.solidUp} points; ${ct.solidBack} once it is back, ${ct.solids} solid)`, ct.solidUp === 0 && ct.solidBack > 0 && ct.solids === 1, ct);
check(`nine arrows to the middle score ${ct.score} at ${ct.ends && ct.ends.join(', ')} m down the lane, and the standing butt is back after`, ct.done && ct.score === 45 && ct.back && JSON.stringify(ct.ends) === '[30,50,70]', ct);

// 3b. real flights (Session 2392): from the mark, a hunting bow's full draw aimed by elevation alone, each arrow flown by tickArrowMotion
// from the bow (no wind). An arrow lived 2.2 s, and the shortest flight to 70 m is 2.55 s, so the third end could not be hit.
const fl = await page.evaluate(() => { const site = siteAnywhere('dunmore'), S = WORLD.settle.get('dunmore'), B = S.butts, st = TS(site), keep = { p: st.p, flags: st.flags };
  const rf = FESTIVALS.find(f => f.key === 'riverfair'), n = ((rf.month - CAL.startMonth + 12) % 12) * 28 + rf.dom - 1; worldState.gameTimeAbsMinutes = n * 1440 + 660; worldState.gameTimeMinutes = 660;
  st.p = 70; st.flags = {}; worldState.festivals = {}; const w0 = EQ.weapon, a0 = EQ.ammo, wind = window.arrowWindAcc, tp = thirdPerson; px = B.x; pz = B.z; thirdPerson = false;
  EQ.weapon = { name: 'Test Bow', ico: '🏹', type: 'equip', slot: 'weapon', atk: [5, 7], weaponShape: 'bow', wType: 'pierce', twoHand: true, weight: 3 };
  EQ.ammo = { name: 'Iron Arrow', ico: '➶', type: 'ammo', qty: 30, arrowDmg: [2, 12] }; const out = { shots: [] };
  const fly = (x, y, z, vx, vy, vz, Q) => { const dt = 1 / 60; let t = 0; for (let f = 0; f < 600; f++) { t += dt; vy -= ARROW_GRAVITY * dt;
      for (let k = 0; k < 3; k++) { const d0 = (x - Q.cx) * Q.dx + (z - Q.cz) * Q.dz; x += vx * dt / 3; y += vy * dt / 3; z += vz * dt / 3;
        if (d0 < 0 && (x - Q.cx) * Q.dx + (z - Q.cz) * Q.dz >= 0) return { y, t }; } } return { y: -1e9, t }; };
  try { window.arrowWindAcc = null; buttsStart({ site }); if (!BUTTS) return out;
    for (let k = 0; k < 9 && BUTTS; k++) { const Q = BUTTS, end = Q.end;
      const sp = () => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw); return { x: px + fx * .5 + rx * .15, z: pz + fz * .5 + rz * .15, y: activeTerrainH(px, pz) + (_eyeHeightCur || .92) }; };
      yaw = Math.atan2(-Q.dx, -Q.dz); for (let i = 0; i < 3; i++) { const o = sp(); yaw = Math.atan2(-(Q.cx - o.x), -(Q.cz - o.z)); }
      const o = sp(); let lo = -.2, hi = .5, T = 0; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, v = ARROW_SPEED;
        const r = fly(o.x, o.y, o.z, -Math.sin(yaw) * Math.cos(m) * v, Math.sin(m) * v, -Math.cos(yaw) * Math.cos(m) * v, Q); T = r.t; if (r.y < Q.cy) lo = m; else hi = m; }
      pitch = (lo + hi) / 2; fireArrow(1); const a = ZB[ZB.length - 1], ud = a.userData; let f = 0;
      for (; f < 600 && ud.butt && ud.butt.score == null; f++) { tickArrowMotion(a, 1 / 60, true); tickButts(); }
      out.shots.push([end, ud.butt.score, +(f / 60).toFixed(2), +(pitch * 180 / Math.PI).toFixed(1)]); }
    out.done = !BUTTS; out.score = (worldState.festivals['riverfair:' + site.id] || {}).score;
  } finally { window.arrowWindAcc = wind; thirdPerson = tp; if (BUTTS) buttsEnd('left'); EQ.weapon = w0; EQ.ammo = a0; Object.assign(st, keep); worldState.festivals = {}; pitch = 0; }
  return out; });
console.log(JSON.stringify(fl));
check(`nine real flights from the mark, aimed by elevation: each scores (${fl.shots.map(q => q[1]).join(', ')}; ${fl.score} of 45), the 70 m end's in ${fl.shots.slice(6).map(q => q[2]).join(', ')} s`, fl.done && fl.shots.length === 9 && fl.shots.every(q => q[1] > 0), fl);

// 4. a picture from just behind the mark, down the lane at eleven
const pic = path.join(here, '../docs/prototypes/kit-butts-lane.png');
await page.evaluate(() => { const B = WORLD.settle.get('dunmore').butts; forceTime(11); VM_SCENE.visible = false; thirdPerson = false; px = B.x - B.dx * 1.5 + B.dz * .6; pz = B.z - B.dz * 1.5 - B.dx * .6; yaw = B.ry; pitch = -.06; });
await g.spin(null, 8); await g.frames(6); await page.screenshot({ path: pic }); console.log(`  (picture: ${path.relative(path.join(here, '..'), pic)})`);
await page.evaluate(() => { VM_SCENE.visible = true; });
await g.close();
