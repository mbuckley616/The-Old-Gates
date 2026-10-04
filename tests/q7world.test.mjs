// Q7 "The Rubbing" in the open world, part 2 (Session 270, Michael's A on issue #32). In the burnt Ashenmoor the
// Faolchú waits on the plaza; Bram lies at his forge; Oswin and Edna are indoors. Kill it, take the Mark, see to Bram
// and Oswin, take Edna's rubbing to Aldwyn in Ironhaven: Q7 complete, all in the world.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g; const W = ms => page.waitForTimeout(ms);
await g.intoWorld(); await g.settle('ashenmoor');
const stop = g.keepAlive();
const obj = () => page.evaluate(() => QS.q7_the_rubbing.objectives.map(o => o.current || 0).join(''));
const choices = () => page.evaluate(() => [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim()));
const click = (re) => page.evaluate((src) => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src, 'i').test(x.textContent)); if (b) b.click(); return !!b; }, re);

// Q6 in, then onto the pad
await page.evaluate(() => { const t = WORLD.siteAnywhere('ashenmoor'); px = t.x + 400; pz = t.z; QS.q6_binding_stone = QS.q6_binding_stone || {}; QS.q6_binding_stone.state = 'reward'; completeQuest('q6_binding_stone'); WORLD.tick(1 / 60, performance.now()); });
await g.settle('ashenmoor');
const arrive = await page.evaluate(() => { forceTime(13); const t = WORLD.siteAnywhere('ashenmoor'); px = t.x - 10; pz = t.z - 10; for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now());
  const f = ZONES.world.enemies.find(e => e.isBoss && e.bossId === 'faolchu'); const bram = ZONE_CORPSES.find(c => c.bramBody && c.zone === 'world');
  return { burned: !!worldState.ashenmoorBurned, faolchu: f && { hp: f.hp, d: Math.round(Math.hypot(f.x - t.x, f.z - t.z)), inScene: !!(f.mesh && f.mesh.parent) }, bram: bram && { d: Math.round(Math.hypot(bram.x - t.x, bram.z - t.z)), hammer: bram.items.length, inScene: !!(bram.bramGroup && bram.bramGroup.parent) } }; });
console.log(JSON.stringify(arrive), await obj());
check('the Faolchú waits on the plaza, and Bram lies at his forge with his hammer', arrive.burned && arrive.faolchu && arrive.faolchu.hp === 2000 && arrive.faolchu.d < 8 && arrive.faolchu.inScene && arrive.bram && arrive.bram.hammer === 1 && arrive.bram.inScene, arrive);

// reading Bram before the Faolchú is down doesn't count yet, and doesn't use him up
const early = await page.evaluate(() => { const b = ZONE_CORPSES.find(c => c.bramBody && c.zone === 'world'); px = b.x + .5; pz = b.z; interact(); return QS.q7_the_rubbing.objectives[3].current || 0; });

// the fight: brought low, the last blows by your hand
// its second phase calls a lesser wolf out of it, in the world's scene
await page.evaluate(() => { const e = ZONES.world.enemies.find(e => e.isBoss && e.bossId === 'faolchu'); px = e.x; pz = e.z + 5; jumpY = WORLD.worldH(px, pz); e.alert = true; e.hp = Math.round(e.maxHp * .6); });
await g.frames(4);
const adds = await page.evaluate(() => { const e = ZONES.world.enemies.find(e => e.isBoss && e.bossId === 'faolchu'); const L = ZONES.world.enemies.filter(x => x.isLesserFaolchu && !x.dead);
  return { phase: e.phaseId, n: L.length, d: L.map(x => +Math.hypot(x.x - e.x, x.z - e.z).toFixed(1)), sameScene: L.every(x => x.mesh && x.mesh.parent === e.mesh.parent) }; });
console.log(JSON.stringify({ adds }));
check('at its second phase a lesser wolf splits from its flank, in the world', adds.phase === 2 && adds.n === 1 && adds.d[0] < 4 && adds.sameScene, adds);
await page.evaluate(() => { const e = ZONES.world.enemies.find(e => e.isBoss && e.bossId === 'faolchu'); px = e.x; pz = e.z + 1.6; jumpY = WORLD.worldH(px, pz); e.hp = 5; e.alert = true; window._hud = null; });
await g.frames(4); await page.evaluate(() => { const h = document.getElementById('bossHpHud'); window._hud = h && h.style.display; });
// the swings are driven by the game's own loop at fixed 1/60 ticks with the draw and the browser's frames held off (as
// `duelrhythm` does, S423): on real frames a frame of this fight took seconds on a loaded runner and the Faolchú moved
// far enough between the swing and its blow that twelve swings all missed (S401, S428, and again on 0fbebd9; S465)
await page.evaluate(() => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  const e = ZONES.world.enemies.find(e => e.isBoss && e.bossId === 'faolchu'); let t = performance.now();
  try { for (let n = 0; n < 60 * 30 && !e.dead; n++) {
    PHP = maxHP; px = e.x; pz = e.z + 1.6; jumpY = WORLD.worldH(px, pz); const dx = e.x - px, dz = e.z - pz; yaw = Math.atan2(-dx, -dz); pitch = -.1; stamina = 100;
    if (atkCd <= 0 && !_pendingStrike && swingT === 0) attack(false);
    t += 1000 / 60; loop(t);
    if (window._hud == null) { const h = document.getElementById('bossHpHud'); window._hud = h && h.style.display; } } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; } });
await g.frames(2);
const fight = await page.evaluate(() => { const e = ZONES.world.enemies.find(e => e.isBoss && e.bossId === 'faolchu');
  const corpse = ZONE_CORPSES.find(c => c.zone === 'world' && c.items && c.items.some(i => i.name === "The Faolchú's Mark"));
  return { hp: e.hp, dead: e.dead, defeated: !!worldState.faolchuDefeated, hud: window._hud, mark: !!corpse, lessers: ZONES.world.enemies.filter(x => x.isLesserFaolchu && !x.dead).length }; });
console.log(JSON.stringify({ early, fight }), await obj());
check('reading Bram first does nothing yet (his objective waits on the Faolchú)', early === 0, early);
check('the Faolchú falls to your blows: defeated, its bar shown while it fought, the Mark on its body, its wolves gone', fight.dead && fight.defeated && fight.hud === 'block' && fight.mark && fight.lessers === 0, fight);
const mark = await page.evaluate(() => { const c = ZONE_CORPSES.find(c => c.zone === 'world' && c.items && c.items.some(i => i.name === "The Faolchú's Mark")); if (!c) return false; openLoot(c); takeLootItem(c.items.findIndex(i => i.name === "The Faolchú's Mark")); try { closeLoot(); } catch (e) {} return BAG.some(b => b.name === "The Faolchú's Mark") || (EQ.amulet && EQ.amulet.name === "The Faolchú's Mark"); });
const bram = await page.evaluate(() => { const b = ZONE_CORPSES.find(c => c.bramBody && c.zone === 'world'); px = b.x + .5; pz = b.z; interact(); try { closeLoot(); } catch (e) {} return QS.q7_the_rubbing.objectives[3].current || 0; });
const o1 = await obj(); console.log(JSON.stringify({ mark, bram }), o1);
check('the Mark taken, and Bram seen to (his objective, now the Faolchú is down)', mark && bram === 1 && o1.startsWith('1111'), { mark, bram, o1 });

// Oswin in the oratory, Edna in her cottage
const inside = async (keeper) => { await page.evaluate((k) => { const S = WORLD.settle.get('ashenmoor'); const h = S.houses.find(x => x.keeper === k); px = h.exitX; pz = h.exitZ; goToInterior(h); }, keeper);
  await W(4500); await g.hide();
  return page.evaluate(() => { if (!intNPCMesh) return false; px = intNPCPos.x; pz = intNPCPos.z + 1; jumpY = 0; interact(); return dlgOpen; }); };
const leave = async () => { await page.evaluate(() => { try { closeDialog(); } catch (e) {} exitInterior(); }); await W(3500); await g.hide(); };
const osw = await inside('Brother Oswin'); await leave();
const edna = await inside('Edna'); const c0 = await choices();
await click('I saw to them both'); await g.frames(2); const c1 = await choices(); await click('take it to him'); await g.frames(2);
const rub = await page.evaluate(() => BAG.some(b => b.name === "Edna's Rubbing")); await leave();
const o2 = await obj(); console.log(JSON.stringify({ osw, edna, c0, c1, rub }), o2);
check('Oswin and Edna are seen to; Edna gives the rubbing', osw && edna && rub && o2.startsWith('1111111'), { osw, edna, c0, c1, rub, o2 });

// Aldwyn in Ironhaven: the desk
await g.settle('ironhaven');
const al = await page.evaluate(() => { const t = WORLD.siteAnywhere('ironhaven'); px = t.x; pz = t.z + 4; for (let i = 0; i < 180; i++) WORLD.tick(1 / 60, performance.now());
  const n = ZONES.world.npcs.find(n => n.def && n.def.name === 'Aldwyn' && n.g.visible); if (!n) return null; window._n = n; px = n.g.position.x; pz = n.g.position.z + 1.2; jumpY = n.g.position.y; yaw = 0; pitch = 0; return true; });
let al2 = null;
if (al) { await g.frames(2); await page.keyboard.press('e'); await g.frames(2);
  const seen = []; for (let k = 0; k < 6 && (await page.evaluate(() => qState('q7_the_rubbing'))) !== 'complete'; k++) { const c = await choices(); seen.push(c.join(' | ')); const p = c.find(x => !/back to topics|my name is|what do you sell|where can i|about you|about this|other folk|news|safe roads/i.test(x)); if (!p) break; await click(p.replace(/^\d+\.\s*/, '').slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); await g.frames(2); }
  al2 = { seen, q7: await page.evaluate(() => qState('q7_the_rubbing')), commission: await page.evaluate(() => BAG.some(b => b.name === 'Royal Mage Commission')) }; }
console.log(JSON.stringify({ al, al2 }));
check('the rubbing to Aldwyn in Ironhaven: Q7 complete, the commission in hand', al && al2 && al2.q7 === 'complete' && al2.commission, { al, al2 });
stop(); check('no page errors', g.errs.length === 0, g.errs);
await g.close();
