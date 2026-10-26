// Session 798 — the critic's s597: over a sleeper the prompt showed within 3.2 of her with the crosshair on her, but E answered
// only within 2.2, so from 2.5 the prompt said *Press 'E' to wake* and E did nothing. E now answers wherever the prompt shows
// (keeperInReach: within 2.2 as before, or within 3.2 aimed, the prompt's own rule), and nowhere the prompt does not.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
// Session 1423 — enter and leave wait for the room's fade to have run (doFade's callback builds the room), not 3 s and 1.5 s: on a
// slow runner the weekly run of 25 Oct read the last visit's woken resident at 2.9 (asleep0 false, no prompt; FLAKY, docs/qa/flaky.md)
const until = async (what, fn) => { const t0 = Date.now(); try { await page.waitForFunction(fn, null, { polling: 100, timeout: 60000 }); }
  catch (e) { console.log(`  ${what} not seen after ${Math.round((Date.now() - t0) / 1000)} s`); } };
const enter = async (hr, k) => { await page.evaluate(([hr, k]) => { forceTime(hr); const S = WORLD.settle.get('dunmore');
  const hs = S.houses.filter(x => x.type === 'home' && !x.ownedByPlayer && !x.shuttered); const h = hs[k]; window._h = h; /* S1430: this suite's rules are the one-room home's; a Dunmore home's kit townhouse room (three floors, the bed upstairs) is kittownhouse's, so the visit sets its kit aside */ if (h.kit) { h._kitWas = h.kit; h.kit = null; } px = h.exitX; pz = h.exitZ; goToInterior(h); }, [hr, k]);
  await until('in the room', () => currentHouse === window._h && document.getElementById('fd').style.opacity === '0'); await g.hide(); await g.frames(4); };
const leave = async () => { await page.evaluate(() => { try { closeDialog(); } catch (e) {} exitInterior(); });
  await until('back in the street', () => currentHouse === null && document.getElementById('fd').style.opacity === '0');
  await page.evaluate(() => { const h = window._h; if (h && h._kitWas) { h.kit = h._kitWas; delete h._kitWas; } }); };
// stand d from her body on open floor, look at her for a few of the loop's frames, read the prompt, then press E
const tryAt = (d, look) => page.evaluate(async ([d, look]) => { const m = intNPCMesh; const b = INT_BEDS.find(b => b.owner === 'home');
  for (let i = 0; i < 4; i++) await new Promise(r => requestAnimationFrame(() => r()));
  let spot = null; for (let a = 0; a < 64 && !spot; a++) { const th = a / 64 * Math.PI * 2; const x = intNPCPos.x + Math.cos(th) * d, z = intNPCPos.z + Math.sin(th) * d;
    if (!intSolidAt(x, z, .3, 0) && (!b || Math.hypot(x - b.x, z - b.z) > 2.05)) spot = { x, z }; }
  if (!spot) return { none: true };
  px = spot.x; pz = spot.z; jumpY = 0; onGround = true;
  const mid = () => { m.updateMatrixWorld(true); const v = new THREE.Vector3(), c = new THREE.Vector3(); let n = 0; m.traverse(o => { if (o.isBone) { o.getWorldPosition(v); c.add(v); n++; } }); return n ? c.divideScalar(n) : m.position.clone(); };
  for (let i = 0; i < 12; i++) { px = spot.x; pz = spot.z; if (look) { const c = mid(); lookAtPt(c.x, c.y, c.z); } else { yaw = Math.atan2(px - intNPCPos.x, pz - intNPCPos.z) + Math.PI; } await new Promise(r => requestAnimationFrame(() => r())); }
  const ipr = document.getElementById('ipr'); const prompt = ipr && ipr.style.display !== 'none' && +ipr.style.opacity > 0 ? ipr.textContent : '';
  const asleep0 = !!m.userData.asleep; const dd = +Math.hypot(px - intNPCPos.x, pz - intNPCPos.z).toFixed(2); interact();
  return { d: dd, prompt, asleep0, asleep: !!m.userData.asleep, open: getComputedStyle(document.getElementById('dlg')).display === 'block', keeper: _h.keeper }; }, [d, look]);
await page.evaluate(() => { metNPCs.clear(); });

const R = {};
for (const d of [2.5, 2.9]) {
  await enter(2.0, 6);
  R[d] = await tryAt(d, true); console.log(d, JSON.stringify(R[d]));
  check(`at ${R[d].d} from the sleeper, looking at her: the prompt *${R[d].prompt}*, and E wakes her and opens the talk`, R[d].asleep0 && R[d].prompt === `${R[d].keeper} (asleep) — Press 'E' to wake` && !R[d].asleep && R[d].open, R[d]);
  await leave();
}
await enter(2.0, 6);
const far = await tryAt(3.5, true); console.log('far', JSON.stringify(far));
check(`at ${far.d}, looking at her: no prompt, and E leaves her asleep`, far.asleep0 && !/wake/.test(far.prompt) && far.asleep && !far.open, far);
await leave();
await enter(2.0, 6);
const away = await tryAt(2.7, false); console.log('away', JSON.stringify(away));
check(`at ${away.d}, looking away from her: no prompt, and E leaves her asleep`, away.asleep0 && !/wake/.test(away.prompt) && away.asleep && !away.open, away);
await leave();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
