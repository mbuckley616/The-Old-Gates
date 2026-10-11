// The barber's chair and the stash chest answer to the crosshair (Session 656; Michael's 6 Oct 2026 playtest: "E should need
// range AND the reticle on the object"). Sessions 645 and 646 did the beds, the strongbox, the chests and the hatches; these were
// the last two things in a room still found by nearness. At each, from a spot in reach: looking at it, its prompt shows and E
// reaches it; from the same spot looking away, no prompt and E leaves it alone. Beside the barber with the crosshair on him, E is his.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
// stand at s, look at t or the opposite way; what the prompt says and what E starts (caught, not run)
const probe = (s, t) => page.evaluate(([s, t]) => { const res = {};
  for (const away of [false, true]) { px = s.x; pz = s.z; jumpY = 0; onGround = true;
    if (away) lookAtPt(px - (t.x - px) * 3, 1.4, pz - (t.z - pz) * 3); else lookAtPt(t.x, t.y, t.z);
    const keep = { openBarberChair: window.openBarberChair, openStash: window.openStash, openDialog: window.openDialog, openSleepUI: window.openSleepUI, exitInterior: window.exitInterior, showMsg: window.showMsg };
    let did = null; openBarberChair = () => { did = did || 'chair'; }; openStash = () => { did = did || 'stash'; }; openDialog = () => { did = did || 'talk'; }; openSleepUI = () => { did = did || 'sleep'; }; exitInterior = () => { did = did || 'out'; }; showMsg = (m) => { did = did || 'msg:' + String(m).slice(0, 30); };
    try { interact(); } finally { openBarberChair = keep.openBarberChair; openStash = keep.openStash; openDialog = keep.openDialog; openSleepUI = keep.openSleepUI; exitInterior = keep.exitInterior; showMsg = keep.showMsg; }
    updateHUD(); const ob = document.getElementById('ob').textContent;
    res[away ? 'away' : 'on'] = { chair: nearBarberChair(), stash: stashAimed(), ob: /barber’s chair/.test(ob), did }; }
  return { d: +Math.hypot(s.x - t.x, s.z - t.z).toFixed(2), ...res }; }, [s, t]);
// a free spot about r from (x, z), clear of furniture and walls, with nothing in the way
const spot = (x, z, r, avoid) => page.evaluate(([x, z, r, avoid]) => { for (let rr = r; rr <= r + .3; rr += .1) for (let a = 0; a < 6.28; a += .2) { const sx = x + Math.sin(a) * rr, sz = z + Math.cos(a) * rr;
  const W = (currentHouse && currentHouse._roomW) || 10, D = (currentHouse && currentHouse._roomD) || 8; if (sx < .35 || sz < .35 || sx > W - .35 || sz > D - 1.8) continue;
  if (typeof intSolidAt === 'function' && intSolidAt(sx, sz, .3, 0)) continue; if (typeof intSightLine === 'function' && !intSightLine(sx, sz, x, z)) continue;
  if (avoid && Math.hypot(sx - avoid.x, sz - avoid.z) < 1.3) continue; return { x: sx, z: sz }; } return null; }, [x, z, r, avoid]);
// the barber's shop, by day
const found = await page.evaluate(() => { let h = null;
  const c = WORLD.SITES.filter(t => t.pad && ['city', 'town'].includes(t.kind)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  for (const t of c) { const S = WORLD.settlements.get(t.id) || WORLD.genSettlement(t); h = S && S.houses.find(x => x.type === 'barber'); if (h) break; }
  if (!h) return null; window._S = h; forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); return h.name; });
check('a barber\'s shop is found and entered', !!found, found);
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior() && !!INT_CHAIR)); k++) await page.waitForTimeout(250);
await g.spin(6); await g.hide();
const C = await page.evaluate(() => ({ x: INT_CHAIR.x, z: INT_CHAIR.z, k: intNPCPos && { x: intNPCPos.x, z: intNPCPos.z } }));
const cs = await spot(C.x, C.z, .9, C.k);
const chair = cs && await probe(cs, { x: C.x, y: .6, z: C.z });
console.log('chair', JSON.stringify({ C, cs, chair }));
check('looking at the chair from reach: the prompt asks you to sit and E sits you', chair && chair.on.chair && chair.on.ob && chair.on.did === 'chair', chair);
check('from the same spot looking away: no prompt, and E leaves the chair alone', chair && !chair.away.chair && !chair.away.ob && chair.away.did !== 'chair', chair);
// beside the barber, the crosshair on him: E is his
const keeper = await page.evaluate(() => { const m = intNPCMesh; m.updateMatrixWorld(true); const k = { x: m.position.x, z: m.position.z }; px = k.x - .3; pz = k.z + .9; jumpY = 0; lookAtPt(k.x, m.position.y + 1.1, k.z); CAM.updateMatrixWorld(true); return { onHim: aimAt({ g: intNPCMesh }, 3.6), chair: nearBarberChair(), dChair: +Math.hypot(px - INT_CHAIR.x, pz - INT_CHAIR.z).toFixed(2), dKeeper: +Math.hypot(px - k.x, pz - k.z).toFixed(2), mesh: [m.position.x, m.position.y, m.position.z, m.visible, m.parent && m.parent.type], pos: intNPCPos, cam: CAM.position.toArray() }; });
console.log('keeper', JSON.stringify(keeper));
check('beside the barber with the crosshair on him, the chair does not take E', keeper.onHim && keeper.chair === false && keeper.dKeeper < keeper.dChair, keeper);
// the safehouse's stash chest (the legacy room)
await page.evaluate(() => { window._SF = { id: 'ih7', type: 'safehouse', name: 'Safehouse', keeper: null, doorX: 23, doorZ: 42 }; goToInterior(window._SF); });
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior() && currentHouse === window._SF && !!intStashPos)); k++) await page.waitForTimeout(250);
await g.spin(6); await g.hide();
const S = await page.evaluate(() => intStashPos && { x: intStashPos.x, z: intStashPos.z });
const ss = S && { x: S.x + .2, z: S.z + 1.0 };
const stash = ss && await probe(ss, { x: S.x, y: .4, z: S.z });
const ipr = ss && await page.evaluate(async ([s, t]) => { const out = {}; for (const away of [false, true]) { px = s.x; pz = s.z; jumpY = 0;
  if (away) lookAtPt(px - (t.x - px) * 3, 1.4, pz - (t.z - pz) * 3); else lookAtPt(t.x, .4, t.z);
  for (let i = 0; i < 4; i++) await new Promise(r => requestAnimationFrame(r)); const el = document.getElementById('ipr'); out[away ? 'away' : 'on'] = el.style.opacity === '1' ? el.textContent : ''; } return out; }, [ss, S]);
console.log('stash', JSON.stringify({ S, ss, stash, ipr }));
check('in the safehouse, looking at the stash chest: E opens the stash, and the prompt says so', stash && stash.on.stash && stash.on.did === 'stash' && /access stash/.test(ipr.on), { stash, ipr });
check('from the same spot looking away: E leaves the stash shut, and no stash prompt', stash && !stash.away.stash && stash.away.did !== 'stash' && !/access stash/.test(ipr.away), { stash, ipr });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
