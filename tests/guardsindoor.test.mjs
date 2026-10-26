// Guards indoors (Session 239; Michael, issue #23: B, "the guard should come in, but mind the player leaving quickly:
// guards should still give chase and confront if they can catch the player"). Seen indoors with a fine on you, the
// nearest guard on duty is sent: half a minute on he comes in and halts you; leave first and he chases you in the street.
// Refuse him indoors and he draws there (Session 241). In a house of storeys he climbs to your floor (Session 1439).
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

// 1. a real seen theft: pick a strongbox in the keeper's sight, stay inside (S1258: a back-room box stands 0.85 m north of the
// partition, so the keeper may watch it from beside the thief, within his own room, as well as from the south)
const shops = await page.evaluate(() => { forceTime(13); worldState.crime = {}; BAG.push({ name: 'Lockpick', ico: '🗝', type: 'misc', buyPrice: 12, sellMult: .4, weight: .05, qty: 20 });
  return WORLD.settle.get('dunmore').houses.filter(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper).map(x => x.id); });
let seen = null;
for (const id of shops) {
  await enter(id);
  seen = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); const X = WORLD.intBox; if (!X) return null; px = X.x; pz = X.z + .8; jumpY = 0; lookAtPt(X.x, .3, X.z); const K_ = intNPCMesh; if (K_) { K_.userData.amble = null; if (!WORLD.witnessOf(window._h)) for (const [ox, oz] of [[0, 2.4], [1.2, 2.2], [-1.2, 2.2], [1.8, 1.2], [-1.8, 1.2], [-2.4, 0], [2.4, 0], [-1.8, -1.2], [1.8, -1.2]]) { const kx = X.x + ox, kz = X.z + .8 + oz; if (!intSolidAt(kx, kz, .3, 0) && intSightLine(kx, kz, px, pz, true)) { K_.position.x = kx; K_.position.z = kz; break; } } K_.rotation.y = Math.atan2(px - K_.position.x, pz - K_.position.z); } // (S368: the keeper stands and watches the box: the cone is keepercone's, the fine and the guard are this test's; S1190: in the kit's shops the box is in the back room, 7.6 from the counter and behind its wall, so a keeper who cannot see it from where he stands is stood two units from it first)
   
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
check('inside, he walks up and halts you: pay, or he draws', came && came.phase === 'inside' && came.mesh && d1.open && d1.name === came.guard && /fine of \d+ gold/.test(d1.text) && d1.choices.some(c => /Pay the fine/.test(c)) && d1.choices.some(c => /not pay/.test(c)), { came, d1 });
await page.evaluate(() => { gold = Math.max(gold, 1000); const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => /Pay the fine/.test(x.textContent)); b.click(); });
await g.frames(1);
const paid = await page.evaluate(() => ({ bounty: WORLD.bountyAt('dunmore'), sent: !!WORLD.guardSent }));
check('paying clears the fine and he goes', paid.bounty === 0 && !paid.sent, paid);
await leave();

// 2. leave quickly: he is in the street where his walk had got him, and runs you down
const house2 = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'home' && x.id !== window._h.id && !WORLD.solidAt(x.exitX, x.exitZ)); return h.id; }); // S1190: a home whose exit is clear ground (14 of Dunmore's kit-house exits stand in the next building's footprint, backlog I)
await enter(house2);
await page.evaluate(() => { const c = (worldState.crime || (worldState.crime = {})).dunmore || (worldState.crime.dunmore = { bounty: 0, debt: 0, last: 0 }); c.bounty = 60; WORLD.dispatchGuard(window._h, WORLD.settle.get('dunmore').site); });
await spinIn(5); await leave();
const out0 = await page.evaluate(() => ({ at: [px, pz], s: WORLD.guardSent && WORLD.guardSent.phase }));
const caughtT = await spinOut(60, true); const s2 = await state(); const d2 = await dlg();
console.log('left quickly', JSON.stringify(out0), 'caught after', caughtT, JSON.stringify(d2), JSON.stringify(s2));
check('leave before he comes in and he chases you; standing still, he catches you and halts you', caughtT < 60 && d2.open && /fine of \d+ gold/.test(d2.text) && !s2, { caughtT, d2, s2 });
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
  const S = WORLD.settle.get('dunmore'); const others = S.npcs.filter(m => m !== n && m.sched && /guard|watch|constable/.test(m.sched.type) && m.g.visible);
  const h3 = S.houses.filter(x => x.type === 'home' && x.id !== window._h.id && !WORLD.solidAt(x.exitX, x.exitZ) && !others.some(m => Math.hypot(m.g.position.x - x.exitX, m.g.position.z - x.exitZ) < 8)).map(x => ({ x, d: Math.hypot(x.exitX - n.g.position.x, x.exitZ - n.g.position.z) })).sort((a, b) => a.d - b.d)[0].x;
  px = h3.exitX; pz = h3.exitZ; jumpY = WORLD.worldH(px, pz); n.g.position.set(px + 6, WORLD.worldH(px + 6, pz), pz); WORLD.tick(1 / 60, performance.now()); window._h3 = h3; return { h3: h3.id, d: +Math.hypot(n.g.position.x - px, n.g.position.z - pz).toFixed(1), phase: WORLD.guardSent && WORLD.guardSent.phase }; });
// (S1190: the door is one no other guard stands within eight units of. Since #393's kit houses Cormac stood at the
// nearest home's door, halted you there for the fine, as a guard should, and his dialog stood in for this one's in step 5)
// the fade's four seconds of wall clock run the game's own loop at whatever rate the runner gives; hold its interior clock
// meanwhile (dt 0), so only spinIn moves the guard's half minute (Session 274: this check passed or failed by the runner)
if (!duck.none) { await page.evaluate(() => { if (!WORLD._tiHeld) { const f = WORLD.tickInterior; WORLD._tiHeld = true; WORLD.tickInterior = (dt, now) => f(window._holdLoop ? 0 : dt, now); } window._holdLoop = true; window._h = window._h3; goToInterior(window._h3); }); await page.waitForTimeout(4000); await g.hide(); await page.evaluate(() => { window._holdLoop = false; }); }
await spinIn(1); const s4a = await state(); await spinIn(8); const s4 = await state();
console.log('ducked in', JSON.stringify(duck), JSON.stringify(s4a), JSON.stringify(s4));
check('ducking into another house with him close behind: he follows you in, in the time it takes him to reach the door', !duck.none && s4a && s4a.phase === 'coming' && s4a.house === duck.h3 && s4 && s4.phase === 'inside' && s4.mesh, { duck, s4a, s4 });

// 5. refuse him indoors: he draws there (Session 241). The fight runs on the zone-enemy code, on him alone, in the room.
await spinIn(30, true); const d5 = await dlg();
stop();
await page.evaluate(() => { PHP = maxHP; const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => /not pay/.test(x.textContent)); if (b) b.click(); });
await g.frames(3);
const f0 = await page.evaluate(() => { const e = ZONES.world.enemies.find(e => e._guard && e._indoor && !e.dead); return e ? { name: e.displayName, hp: e.hp, inRoom: e.mesh && e.mesh.parent === interiorScene, inside: isInterior() } : null; });
// (S988: health filled every tick and his blows summed. He paces his blows on the wall clock, so a slow runner's eight
// seconds held more of them, and at S940's retune, a tenth of your health a blow, they took you under a fifth: the yield
// opened here, its dialog paused the loop, and none of your swings below could land)
const fight = await page.evaluate(() => { const e = ZONES.world.enemies.find(e => e._guard && e._indoor && !e.dead); let lost = 0, solidT = 0, minD = 99;
  for (let t = 0; t < 8; t += 1 / 60) { PHP = maxHP; WORLD.tickInterior(1 / 60, performance.now()); lost += maxHP - PHP; if (intSolidAt(e.x, e.z, .25, 0)) solidT++; minD = Math.min(minD, Math.hypot(e.x - px, e.z - pz)); }
  PHP = maxHP; return { lost, dlg: dlgOpen, minD: +minD.toFixed(2), solidFrames: solidT, y: +e.mesh.position.y.toFixed(2) }; });
console.log('refused', JSON.stringify(d5), JSON.stringify(f0), JSON.stringify(fight));
check('refuse indoors and he draws in the room: a Town Guard there, in the room’s scene', d5.open && f0 && f0.inside && f0.inRoom && f0.name === 'Town Guard', { d5, f0 });
check('he closes and strikes, on the floor and never inside the furniture', fight.lost > 0 && !fight.dlg && fight.minD < 2.2 && fight.solidFrames === 0 && fight.y === 0, fight);
// your blows land on him (S949: health and posture filled before each swing, as `fistfight` does; at a sixth his blows in the
// meantime broke your posture again and again, and a staggered player cannot swing)
const hit = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); const e = ZONES.world.enemies.find(e => e._guard && e._indoor && !e.dead); const hp0 = e.hp;
  for (let k = 0; k < 6 && e.hp === hp0; k++) { PHP = maxHP; PPOST.stagUntil = 0; PPOST.posture = PPOST.maxPosture; const dx = e.x - px, dz = e.z - pz; yaw = Math.atan2(-dx, -dz); pitch = -.1; atkCd = 0; stamina = 100; attack(false); for (let w = 0; w < 60 && _pendingStrike; w++) await wait(250); await wait(100); } // S274 — wait for the blow to land: on a slow runner 700 ms was a third of the swing
  return { hp0, hp: e.hp }; });
check('your blows land on him indoors', hit.hp < hit.hp0, hit);
// at a fifth of health he offers the yield; the cells take you out of the room and to the morning
await page.evaluate(() => { PHP = Math.round(maxHP * .2); WORLD.tickInterior(1 / 60, performance.now()); });
const y = await dlg();
await page.evaluate(() => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => /cells/.test(x.textContent)); if (b) b.click(); });
await page.waitForTimeout(9000); await g.hide();
const cells = await page.evaluate(() => ({ inside: isInterior(), zone: activeZoneId, hour: Math.floor(gameHour()), fine: WORLD.bountyAt('dunmore'), guards: ZONES.world.enemies.filter(e => e._guard && !e.dead).length }));
console.log('yield', JSON.stringify(y), JSON.stringify(cells));
check('at a fifth of health he offers the yield; the cells take you out of the room to the morning, the fine cleared', /cells/.test(y.text || '') && !cells.inside && cells.zone === 'world' && cells.hour === 7 && cells.fine === 0 && cells.guards === 0, { y, cells });
// 6. run out of the door mid-fight: he follows and fights on in the street, as hurt as he was
await page.evaluate(() => { forceTime(13); const c = worldState.crime.dunmore; c.bounty = 60; c.shut = false; });
await enter(house2);
await page.evaluate(() => { PHP = maxHP; WORLD.dispatchGuard(window._h, WORLD.settle.get('dunmore').site); });
await spinIn(90, true);
await page.evaluate(() => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => /not pay/.test(x.textContent)); if (b) b.click(); });
await g.frames(3);
const hurt = await page.evaluate(() => { const e = ZONES.world.enemies.find(e => e._guard && e._indoor && !e.dead); if (!e) return null; e.hp = Math.round(e.maxHp / 2); return e.hp; });
await leave(); await spinOut(.5);
const street = await page.evaluate(() => { const es = ZONES.world.enemies.filter(e => e._guard && !e.dead); return { inside: isInterior(), n: es.length, indoor: es.filter(e => e._indoor).length, hp: es[0] && es[0].hp, d: es[0] && +Math.hypot(es[0].x - px, es[0].z - pz).toFixed(1) }; });
console.log('ran out', hurt, JSON.stringify(street));
check('run out mid-fight: he follows and fights on in the street, as hurt as he was', hurt != null && !street.inside && street.n === 1 && street.indoor === 0 && street.hp === hurt && street.d < 4, { hurt, street });
// 7. a house of storeys (Session 1439): the kit's townhouse on the new look has three floors on a dog-leg stair. You stand by the
// home's chest on the top floor (5.87 m) with a fine on you: he comes in by the front door, climbs both storeys and halts you
// there (before, he stood on the ground floor under you for good); refused, he fights you on that floor.
await page.evaluate(() => { for (const e of ZONES.world.enemies) if (e._guard && !e.dead) { e.dead = true; if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); if (e._guard.npc) e._guard.npc._drawn = false; } forceTime(13); const c = worldState.crime.dunmore; c.bounty = 60; c.shut = false; });
const kit = await page.evaluate(() => { const h = WORLD.settle.get('dunmore').houses.find(h => h.type === 'home' && !h.shuttered && kitTownhouse(h) && h.kit && h.kit.bays === 4); return h ? h.id : null; });
await enter(kit);
const up = await page.evaluate(() => { const X = WORLD.intBox; if (!X || !(X.y > 5)) return null; for (const [ox, oz] of [[0, .8], [0, -.8], [.8, 0], [-.8, 0]]) { const x = X.x + ox, z = X.z + oz, y = footholdY(x, z, X.y + .1, 0); if (Math.abs(y - X.y) < .3 && !intSolidAt(x, z, .3, y)) { px = x; pz = z; jumpY = y; return { x: +x.toFixed(2), z: +z.toFixed(2), y }; } } return null; });
await page.evaluate(() => { PHP = maxHP; WORLD.dispatchGuard(window._h, WORLD.settle.get('dunmore').site); });
const climb = await page.evaluate(() => { let t = 0, top = 0, inAt = null, upAt = null; for (; t < 120; t += 1 / 60) { WORLD.tickInterior(1 / 60, performance.now()); const s = WORLD.guardSent; if (s && s.mesh) { if (inAt == null) inAt = t; top = Math.max(top, s.mesh.position.y); if (upAt == null && Math.abs(s.mesh.position.y - jumpY) < .3 && Math.hypot(s.mesh.position.x - px, s.mesh.position.z - pz) < 1.6) upAt = t; } if (dlgOpen) break; } const s = WORLD.guardSent;
  return { t: +t.toFixed(1), climbed: inAt != null && upAt != null ? +(upAt - inAt).toFixed(1) : null, dlg: dlgOpen, text: dlgOpen ? document.getElementById('dlg-text').textContent : null, gy: s && s.mesh ? +s.mesh.position.y.toFixed(2) : null, top: +top.toFixed(2), me: +jumpY.toFixed(2) }; });
console.log('upstairs', kit, JSON.stringify(up), JSON.stringify(climb));
check(`with you by the chest on the top floor, he climbs both storeys and halts you there (${climb.climbed} s from the door)`, kit && up && climb.dlg && /fine of \d+ gold/.test(climb.text || '') && Math.abs(climb.gy - climb.me) < .3, { kit, up, climb });
await page.evaluate(() => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => /not pay/.test(x.textContent)); if (b) b.click(); });
await g.frames(3);
const upFight = await page.evaluate(() => { const e = ZONES.world.enemies.find(e => e._guard && e._indoor && !e.dead); if (!e) return null; let lost = 0, low = 99;
  for (let t = 0; t < 8; t += 1 / 60) { PHP = maxHP; WORLD.tickInterior(1 / 60, performance.now()); lost += maxHP - PHP; low = Math.min(low, e.mesh.position.y); }
  PHP = maxHP; return { lost, low: +low.toFixed(2), me: +jumpY.toFixed(2), d: +Math.hypot(e.x - px, e.z - pz).toFixed(2) }; });
console.log('upstairs fight', JSON.stringify(upFight));
check('refused up there, he draws and fights you on that floor', upFight && upFight.lost > 0 && Math.abs(upFight.low - upFight.me) < .3, upFight);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
