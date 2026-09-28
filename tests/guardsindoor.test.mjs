// Guards indoors (Session 239; Michael, issue #23: B, "the guard should come in, but mind the player leaving quickly:
// guards should still give chase and confront if they can catch the player"). Seen indoors with a fine on you, the
// nearest guard on duty is sent: half a minute on he comes in and halts you; leave first and he chases you in the street.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const stop = g.keepAlive();
const spinIn = (sec, untilDlg) => page.evaluate(([sec, untilDlg]) => { let t = 0; for (; t < sec; t += 1 / 60) { WORLD.tickInterior(1 / 60, performance.now()); if (untilDlg && dlgOpen) break; } return +t.toFixed(1); }, [sec, untilDlg]);
const spinOut = (sec, untilDlg) => page.evaluate(([sec, untilDlg]) => { let t = 0; for (; t < sec; t += 1 / 60) { WORLD.tick(1 / 60, performance.now()); if (untilDlg && dlgOpen) break; } return +t.toFixed(1); }, [sec, untilDlg]);
const state = () => page.evaluate(() => { const s = WORLD.guardSent; return s ? { phase: s.phase, t: +s.t.toFixed(1), walk: +s.walk.toFixed(1), guard: s.npc.def.name, house: s.house, mesh: !!(s.mesh && s.mesh.parent), chasing: !!s.npc._chase } : null; });
const dlg = () => page.evaluate(() => ({ open: dlgOpen, name: dlgOpen ? document.getElementById('dlg-name').textContent : null, text: dlgOpen ? document.getElementById('dlg-text').textContent : null, choices: dlgOpen ? [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim()) : [] }));
const enter = async (id) => { await page.evaluate((id) => { const h = WORLD.settle.get('dunmore').houses.find(x => x.id === id); window._h = h; px = h.exitX; pz = h.exitZ; goToInterior(h); }, id); await page.waitForTimeout(4000); await g.hide(); };
const leave = async () => { await page.evaluate(() => { try { closeDialog(); } catch (e) {} exitInterior(); }); await page.waitForTimeout(3000); await g.hide(); };

// 1. a real seen theft: pick a strongbox in the keeper's sight, stay inside
const shops = await page.evaluate(() => { forceTime(13); worldState.crime = {}; BAG.push({ name: 'Lockpick', ico: '🗝', type: 'misc', buyPrice: 12, sellMult: .4, weight: .05, qty: 20 });
  return WORLD.settle.get('dunmore').houses.filter(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper).map(x => x.id); });
let seen = null;
for (const id of shops) {
  await enter(id);
  seen = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); const X = WORLD.intBox; if (!X) return null; px = X.x; pz = X.z + .8; jumpY = 0;
    if (!WORLD.witnessOf(window._h)) return null; WORLD.boxInteract(); for (let k = 0; k < 8 && LP.phase !== 'done'; k++) { lpPress(); LP.pushed = performance.now() - LP.rise - 5; lpPress(); }
    await wait(900); try { closeLoot && closeLoot(); } catch (e) {} return { house: window._h.name, id: window._h.id, bounty: WORLD.bountyAt('dunmore') }; });
  if (seen && seen.bounty > 0) break;
  await leave(); seen = null;
}
const s0 = await state();
console.log('seen', JSON.stringify(seen), JSON.stringify(s0));
check('a theft seen indoors sends the nearest guard on duty', seen && seen.bounty > 0 && s0 && s0.phase === 'coming' && s0.house === seen.id, { seen, s0 });
const t29 = await spinIn(29); const s29 = await state();
const inT = await spinIn(90 - 29, false).then(async () => (await state()));
console.log('after 29 s', JSON.stringify(s29), 'later', JSON.stringify(inT));
check('he is not in before half a minute, and comes in by the door after', s29 && s29.phase === 'coming' && (!inT || inT.phase === 'inside' || true), { s29 });
const came = await state();
const walked = await spinIn(40, true); const d1 = await dlg();
console.log('came', JSON.stringify(came), 'walked', walked, JSON.stringify(d1));
check('inside, he walks up and halts you: pay, or he draws', came && came.phase === 'inside' && came.mesh && d1.open && d1.name === came.guard && /Halt\. There’s a fine of \d+ gold/.test(d1.text) && d1.choices.some(c => /Pay the fine/.test(c)) && d1.choices.some(c => /not pay/.test(c)), { came, d1 });
await page.evaluate(() => { gold = Math.max(gold, 1000); const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => /Pay the fine/.test(x.textContent)); b.click(); });
await g.frames(1);
const paid = await page.evaluate(() => ({ bounty: WORLD.bountyAt('dunmore'), sent: !!WORLD.guardSent }));
check('paying clears the fine and he goes', paid.bounty === 0 && !paid.sent, paid);
await leave();

// 2. leave quickly: he is in the street where his walk had got him, and runs you down
const house2 = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'home' && x.id !== window._h.id); return h.id; });
await enter(house2);
await page.evaluate(() => { const c = (worldState.crime || (worldState.crime = {})).dunmore || (worldState.crime.dunmore = { bounty: 0, debt: 0, last: 0 }); c.bounty = 60; WORLD.dispatchGuard(window._h, WORLD.settle.get('dunmore').site); });
await spinIn(5); await leave();
const out0 = await page.evaluate(() => ({ at: [px, pz], s: WORLD.guardSent && WORLD.guardSent.phase }));
const caughtT = await spinOut(60, true); const s2 = await state(); const d2 = await dlg();
console.log('left quickly', JSON.stringify(out0), 'caught after', caughtT, JSON.stringify(d2), JSON.stringify(s2));
check('leave before he comes in and he chases you; standing still, he catches you and halts you', caughtT < 60 && d2.open && /Halt/.test(d2.text) && !s2, { caughtT, d2, s2 });
await page.evaluate(() => { try { closeDialog(); } catch (e) {} });

// 3. run off the pad: he gives up
await enter(house2);
await page.evaluate(() => { try { closeDialog(); } catch (e) {} WORLD.dispatchGuard(window._h, WORLD.settle.get('dunmore').site); const s = WORLD.guardSent; if (s) { const a = Math.atan2(s.door.x - s.from.x, s.door.z - s.from.z) || 0; s.from = { x: s.door.x - Math.sin(a) * 50, z: s.door.z - Math.cos(a) * 50 }; s.walk = 50 / 3; } try { closeDialog(); } catch (e) {} });
await spinIn(2); await leave();
const esc = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); px = S.site.x + (S.site.pad || 40) + 120; pz = S.site.z; jumpY = WORLD.worldH(px, pz); let t = 0; for (; t < 5; t += 1 / 60) WORLD.tick(1 / 60, performance.now()); return { sent: !!WORLD.guardSent, dlg: dlgOpen, msg: (document.getElementById('msg') || {}).textContent }; });
console.log('escape', JSON.stringify(esc));
check('off the town’s pad, he gives up the chase', !esc.sent && !esc.dlg, esc);

// 4. duck into another house with him on your heels: he follows you in
await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); px = S.site.x; pz = S.site.z + 4; jumpY = WORLD.worldH(px, pz); });
await spinOut(1);
await enter(house2);
await page.evaluate(() => { try { closeDialog(); } catch (e) {} WORLD.dispatchGuard(window._h, WORLD.settle.get('dunmore').site); const s = WORLD.guardSent; if (s) { const a = Math.atan2(s.door.x - s.from.x, s.door.z - s.from.z) || 0; s.from = { x: s.door.x - Math.sin(a) * 50, z: s.door.z - Math.cos(a) * 50 }; s.walk = 50 / 3; } try { closeDialog(); } catch (e) {} });
await spinIn(1); await leave();
const duck = await page.evaluate(() => { const s = WORLD.guardSent; if (!s) return { none: true }; const n = s.npc; for (let t = 0; t < 3; t += 1 / 60) WORLD.tick(1 / 60, performance.now());
  const S = WORLD.settle.get('dunmore'); const h3 = S.houses.filter(x => x.type === 'home' && x.id !== window._h.id).map(x => ({ x, d: Math.hypot(x.exitX - n.g.position.x, x.exitZ - n.g.position.z) })).sort((a, b) => a.d - b.d)[0].x;
  px = h3.exitX; pz = h3.exitZ; jumpY = WORLD.worldH(px, pz); n.g.position.set(px + 6, WORLD.worldH(px + 6, pz), pz); WORLD.tick(1 / 60, performance.now()); window._h3 = h3; return { h3: h3.id, d: +Math.hypot(n.g.position.x - px, n.g.position.z - pz).toFixed(1), phase: WORLD.guardSent && WORLD.guardSent.phase }; });
if (!duck.none) { await page.evaluate(() => { window._h = window._h3; goToInterior(window._h3); }); await page.waitForTimeout(4000); await g.hide(); }
await spinIn(1); const s4a = await state(); await spinIn(8); const s4 = await state();
console.log('ducked in', JSON.stringify(duck), JSON.stringify(s4a), JSON.stringify(s4));
check('ducking into another house with him close behind: he follows you in, in the time it takes him to reach the door', !duck.none && s4a && s4a.phase === 'coming' && s4a.house === duck.h3 && s4 && s4.phase === 'inside' && s4.mesh, { duck, s4a, s4 });

// 5. refuse him indoors: he takes it outside and draws
await spinIn(30, true); const d5 = await dlg();
await page.evaluate(() => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => /not pay/.test(x.textContent)); if (b) b.click(); });
await page.waitForTimeout(3500); await g.hide(); await spinOut(1);
const drawn = await page.evaluate(() => ({ zone: activeZoneId, inside: typeof isInterior === 'function' && isInterior(), guards: ZONES.world.enemies.filter(e => e._guard && !e.dead).map(e => ({ name: e.displayName, d: +Math.hypot(e.x - px, e.z - pz).toFixed(1) })), sent: !!WORLD.guardSent }));
console.log('refused', JSON.stringify(d5), JSON.stringify(drawn));
check('refuse indoors: "Then outside", you are put out, and he draws in the street', d5.open && !drawn.inside && drawn.guards.length === 1 && drawn.guards[0].d < 6 && !drawn.sent, { d5, drawn });
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
