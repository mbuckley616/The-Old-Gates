// The guards end to end (Session 157, backlog G: get stopped with a fine, refuse, fight, yield; the cells; strike a
// villager and a guard). `crime3` checks each rule from set-up state; this plays it through in Dunmore: real swings
// through the game's own strike (resolved on the loop's impact frame), the guard's halt and the yield clicked in their
// own dialogue, the guard's blows by his own tick, the cells, a guard killed, the gates, and the lord's fine.
// Session 433 found a guard still drawn when the lord's fine was paid fighting on over nothing (no fine left, so no
// yield either); a drawn guard now stands down once the town has nothing against you.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const choices = () => page.evaluate(() => dlgOpen ? [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim().replace(/^\d+\.\s*/, '')) : []);
const click = (re) => page.evaluate((src) => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src).test(x.textContent.trim().replace(/^\d+\.\s*/, ''))); if (b) b.click(); return !!b; }, re);
const said = () => page.evaluate(() => document.getElementById('dlg-text').textContent);
const state = () => page.evaluate(() => { const c = (worldState.crime || {}).dunmore || {}; return { gold, hp: PHP, maxHP, favor: WORLD.favor('dunmore'), debt: c.debt || 0, bounty: c.bounty || 0, shut: !!c.shut, hour: +(worldState.gameTimeMinutes / 60).toFixed(2) }; });
// a real swing: the game's attack, resolved when the loop's swing crosses its impact point
const swing = async () => { await page.evaluate(() => { atkCd = 0; stamina = maxStamina; attack(false); });
  for (let k = 0; k < 40 && await page.evaluate(() => !!_pendingStrike); k++) await g.frames(1);
  return page.evaluate(() => !_pendingStrike); };
// stand 1.4 units in front of an npc, facing it
const face = (sel) => page.evaluate((sel) => { const S = WORLD.settle.get('dunmore'); const n = eval(sel); window._n = n;
  const ry = n.g.rotation.y, dx = Math.sin(ry), dz = Math.cos(ry); px = n.g.position.x + dx * 1.4; pz = n.g.position.z + dz * 1.4; jumpY = 0;
  yaw = Math.atan2(dx, dz); pitch = 0; n.sched = { ...n.sched, a: { x: n.g.position.x, z: n.g.position.z }, b: { x: n.g.position.x, z: n.g.position.z } };
  return { name: n.def && n.def.name, type: n.sched.type }; }, sel);
// the fight by fixed ticks: the world's tick (the crime rules) and the zone enemies' (the guard's blows), on one clock
const fight = (n, stopAt) => page.evaluate(([n, stopAt]) => { const T0 = performance.now(); let i = 0;
  for (; i < n; i++) { const t = T0 + i * 1000 / 60; WORLD.tick(1 / 60, t); if (!dlgOpen) tickZoneEnemies(1 / 60, t, ZONES.world.scene); if (stopAt === 'dlg' && dlgOpen) break; if (PHP <= 0) break; }
  PPOST.stagUntil = 0; /* the ticks' clock ran ahead of performance.now(): a stagger stamped on it would outlast the fight */
  return { ticks: i, hp: PHP, dlg: dlgOpen }; }, [n, stopAt]);
const drawn = () => page.evaluate(() => ZONES.world.enemies.filter(e => e._guard && !e.dead).map(e => ({ name: e.name, by: e._guard.npc.def && e._guard.npc.def.name, hp: e.hp, maxHp: e.maxHp, alert: e.alert })));

await page.evaluate(() => { forceTime(12); worldState.crime = {}; worldState.church = { notes: [] }; worldState.crimes = []; gold = 500; PHP = maxHP; updateHUD(); for (let i = 0; i < 240; i++) WORLD.tick(1 / 60, performance.now());
  const S = WORLD.settle.get('dunmore'); return S.npcs.map(n => (n.sched && n.sched.type) + ':' + (n.g.visible && !n._retreated)).join(' '); }).then(x => console.log('street', x));

// 1. a villager struck in the street, with a real swing
// a villager with nobody else within 4 units: the strike lands on the nearest townsperson in front of you, and two who
// have stopped for a word stand 0.7 apart (Session 483: the swing struck Clodagh, who stood beside the Sorcha it was aimed at)
const v = await face(`S.npcs.find(n => n.g.visible && !n._retreated && n.sched && !['guard','watch','constable'].includes(n.sched.type) && !(n.def && n.def._lord) && !S.npcs.some(m => m !== n && m.g.visible && !m._retreated && Math.hypot(m.g.position.x - n.g.position.x, m.g.position.z - n.g.position.z) < 4))`);
const sw1 = await swing(); const s1 = await state(); const v1 = await page.evaluate(() => ({ scared: (window._n._scared || 0) > performance.now(), crimes: worldState.crimes.map(c => c.kind) }));
console.log('villager', JSON.stringify(v), sw1, JSON.stringify(s1), JSON.stringify(v1));
check('a swing at a townsperson in the street is assault: favour −3, a 75-gold fine, three points owed, and they run', sw1 && s1.favor === -3 && s1.bounty === 75 && s1.debt === 3 && v1.scared && v1.crimes.includes('assault'), { v, s1, v1 });

// 2. a guard in the street halts you: walk up to him and let the world's tick see you
const gd = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const n = WORLD.guardsOf(S).find(n => n.g.visible && !n._retreated); window._gd = n;
  const ry = n.g.rotation.y; px = n.g.position.x + Math.sin(ry) * 3; pz = n.g.position.z + Math.cos(ry) * 3; jumpY = 0; return n.def && n.def.name; });
const h1 = await fight(30, 'dlg'); const halt = { name: await page.evaluate(() => dlgOpen ? document.getElementById('dlg-name').textContent : null), greet: await said(), choices: await choices() };
console.log('halt', gd, JSON.stringify(h1), JSON.stringify(halt));
check('three units from a guard with a fine on you, he halts you by name: the fine, pay, or he draws', halt.name === gd && /75 gold/.test(halt.greet) && halt.choices.includes('Pay the fine (75 gold)') && halt.choices.includes('I’ll not pay.'), halt);

// 3. refuse: he draws
await click('^I’ll not pay'); const refused = await said(); await page.waitForTimeout(300); await g.frames(1);
const d1 = await drawn(); const gHid = await page.evaluate(() => !window._gd.g.visible && window._gd._drawn);
console.log('refuse', refused, JSON.stringify(d1), gHid);
check('refused, he draws: a Town Guard of his name stands in for him, alert, and he leaves the street', d1.length === 1 && d1[0].by === gd && d1[0].name === 'Town Guard' && d1[0].alert && gHid && !(await page.evaluate(() => dlgOpen)), { refused, d1 });

// 4. the fight: a real swing lands on him, then his blows by his own tick until the offer to yield
await page.evaluate(() => { const e = ZONES.world.enemies.find(e => e._guard && !e.dead); const dx = px - e.x, dz = pz - e.z, d = Math.hypot(dx, dz) || 1; px = e.x + dx / d * 1.4; pz = e.z + dz / d * 1.4; yaw = Math.atan2(dx, dz); });
const before = (await drawn())[0].hp; const sw2 = await swing(); const after = (await drawn())[0];
console.log('hit', before, '→', after && after.hp);
check('a real swing at the drawn guard hurts him', sw2 && after && after.hp < before, { before, after });
const f1 = await fight(60 * 120, 'dlg'); const yld = { name: await page.evaluate(() => dlgOpen ? document.getElementById('dlg-name').textContent : null), greet: await said(), choices: await choices() };
const sY = await state(); const held = await drawn();
console.log('yield', JSON.stringify(f1), JSON.stringify(yld), JSON.stringify(sY), JSON.stringify(held));
check('his blows bring you under 30% and he offers the yield, by name: double the fine, or the cells; he holds while you talk', yld.name === gd && sY.hp > 0 && sY.hp < sY.maxHP * .3 && yld.choices.includes('Pay double (150 gold)') && yld.choices.includes('The cells.') && held.every(e => !e.alert), { f1, yld, sY });

// 5. the cells: a night, the stolen goods and the gold taken in the town go back, the fine clears, the record stays
await page.evaluate(() => { BAG.push({ name: 'Stolen ring', ico: '💍', type: 'misc', value: 30, stolen: true }); worldState.crime.dunmore.loot = 40; });
await click('^The cells'); const cellsLine = await said(); await page.waitForTimeout(2500); await g.frames(2); await g.hide();
const sC = await state(); const afterCells = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const keep = S.houses.find(h => h.type === 'castle');
  return { stolenLeft: BAG.filter(i => i.stolen).length, keep: !!keep, nearKeep: keep ? Math.hypot(px - keep.exitX, pz - keep.exitZ) : Math.hypot(px - S.site.x, pz - S.site.z), drawn: ZONES.world.enemies.filter(e => e._guard && !e.dead).length, guardBack: window._gd.g.visible && !window._gd._drawn }; });
console.log('cells', cellsLine, JSON.stringify(sC), JSON.stringify(afterCells));
check('the cells: morning at seven by the keep (Dunmore has none: the town\'s centre), the ring and the 40 gold gone, the fine cleared, half health, the guard back on his beat', /Come along|cells/.test(cellsLine) && sC.hour === 7 && afterCells.nearKeep != null && afterCells.nearKeep < 3 && afterCells.stolenLeft === 0 && sC.gold === 460 && sC.bounty === 0 && sC.hp >= sC.maxHP * .5 && afterCells.drawn === 0 && afterCells.guardBack, { sC, afterCells });
check('the cells clear the fine, not the record: favour still −3, three points still owed', sC.favor === -3 && sC.debt === 3, sC);

// 6. a guard struck: he draws at once; killed, the gates shut and the Church hears
await page.evaluate(() => { PHP = maxHP; });
const g2 = await face(`WORLD.guardsOf(S).find(n => n.g.visible && !n._retreated)`);
const sw3 = await swing(); const d2 = await drawn(); const s6 = await state();
console.log('struck guard', JSON.stringify(g2), sw3, JSON.stringify(d2), JSON.stringify(s6));
check('a swing at a guard is assault and he draws at once, no talk', sw3 && d2.length === 1 && d2[0].by === g2.name && s6.favor === -6 && s6.bounty === 75 && !(await page.evaluate(() => dlgOpen)), { d2, s6 });
await page.evaluate(() => { const e = ZONES.world.enemies.find(e => e._guard && !e.dead); e.hp = 1; const dx = px - e.x, dz = pz - e.z, d = Math.hypot(dx, dz) || 1; px = e.x + dx / d * 1.4; pz = e.z + dz / d * 1.4; yaw = Math.atan2(dx, dz); });
const sw4 = await swing(); await g.frames(2); const s7 = await state(); const church = await page.evaluate(() => (worldState.church.notes || []).filter(n => n.kind === 'guard' && n.site === 'dunmore').length);
console.log('killed', sw4, JSON.stringify(s7), church);
check('killed: five more favour, 125 more on the fine, the gates shut, and the Church notes it', sw4 && s7.favor === -11 && s7.bounty === 200 && s7.shut && church === 1 && (await drawn()).length === 0, { s7, church });

// 7. gates shut: the next guard you come within five units of draws on sight
const g3 = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const n = WORLD.guardsOf(S).find(n => n.g.visible && !n._retreated && !n._drawn); if (!n) return null;
  const ry = n.g.rotation.y; px = n.g.position.x + Math.sin(ry) * 3; pz = n.g.position.z + Math.cos(ry) * 3; jumpY = 0; return n.def && n.def.name; });
await fight(30, 'dlg'); const d3 = await drawn(); const dlg3 = await page.evaluate(() => dlgOpen);
console.log('shut', g3, JSON.stringify(d3), dlg3);
check('with the gates shut a guard draws on sight, with no halt', !!g3 && d3.length === 1 && d3[0].by === g3 && !dlg3, { g3, d3 });

// 8. the lord's fine opens the gates, and the guard still drawn stands down (Session 433: he fought on over nothing)
const lord = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const ln = S.npcs.find(n => n.def && n.def._lord); if (!ln) return null; gold = 500; openDialog(ln.def); return ln.def.name; });
const paidOk = await click('^Pay my fine \\(200 gold\\)'); const paid = await said(); await page.evaluate(() => { try { closeDialog(); } catch (e) {} });
const s8 = await state(); await fight(30); const d4 = await drawn(); const back3 = await page.evaluate((nm) => { const S = WORLD.settle.get('dunmore'); const n = WORLD.guardsOf(S).find(n => n.def && n.def.name === nm); return n ? { drawn: !!n._drawn, visible: n.g.visible } : null; }, g3);
console.log('lord', lord, paidOk, paid, JSON.stringify(s8), JSON.stringify(d4), back3);
check('the lord takes the 200: the gates open', !!lord && paidOk && s8.gold === 300 && s8.bounty === 0 && !s8.shut, { lord, paid, s8 });
check('and the guard who drew on sight stands down: nothing is owed, so nothing to fight over', d4.length === 0 && back3 && !back3.drawn && back3.visible, { d4, back3 });
const s9 = await state(); await fight(60 * 5); const s10 = await state();
check('he does not strike again once stood down', s10.hp >= s9.hp, { s9, s10 });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
