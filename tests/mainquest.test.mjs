// The main quest in the open world (Session 240). Q3's giver, Corwin, was placed only by the legacy Ashenmoor village,
// so in the open world Q3 could not be taken and the story stopped after Q2; and Q6's "kill 20 in Ironhaven's dungeons"
// never counted, because a world door's portal says zone 'world'. Now Corwin stands in the world's Ashenmoor while Q3 is
// his to give, and a world door counts as its canonical dungeon's zone.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();
// Q1 and Q2 done, Q3 waiting on Corwin
await page.evaluate(() => { for (const id of ['q0_arrival', 'q1_first_blood', 'q2_strange_markings']) QS[id].state = 'complete'; QS['q3_the_merchant_knows'].state = 'available'; });
await g.settle('ashenmoor');
const at = await page.evaluate(() => { for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now()); const A = WORLD.siteAnywhere('ashenmoor');
  const c = ZONES.world.npcs.find(n => n.def && n.def.name === 'Corwin' && n.g.visible); return c ? { d: +Math.hypot(c.g.position.x - A.x, c.g.position.z - A.z).toFixed(1), role: c.def.role, x: c.g.position.x, z: c.g.position.z } : null; });
console.log('corwin', JSON.stringify(at));
check('with The Merchant Knows to give, Corwin stands in the world’s Ashenmoor', at && at.d < 20 && at.role === 'Traveling Merchant', at);
// talk to him by E and take the quest through his own dialogue
await page.evaluate(() => { const c = ZONES.world.npcs.find(n => n.def && n.def.name === 'Corwin'); window._c = c; px = c.g.position.x; pz = c.g.position.z + 1.2; jumpY = c.g.position.y; yaw = 0; pitch = 0; });
await g.frames(2); await page.evaluate(() => { px = _c.g.position.x; pz = _c.g.position.z + 1.2; jumpY = _c.g.position.y; }); await page.keyboard.press('e'); await g.frames(2);
const pickC = (re) => page.evaluate((src) => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src).test(x.textContent)); if (b) b.click(); return { clicked: !!b, choices: [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim()) }; }, re);
const c1 = await pickC('The Merchant Knows'); await g.frames(2);
const c2 = await pickC('head out at first light'); await g.frames(2);
const q3 = await page.evaluate(() => qState('q3_the_merchant_knows'));
console.log(JSON.stringify({ c1, c2, q3 }));
check('E finds him, and his dialogue hands over The Merchant Knows', c1.clicked && c2.clicked && q3 === 'active', { c1, c2, q3 });
await page.evaluate(() => { try { closeDialog(); } catch (e) {} });
// done: he leaves Ashenmoor (the harbours have him from here)
const gone = await page.evaluate(() => { QS['q3_the_merchant_knows'].state = 'complete'; for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now()); const A = WORLD.siteAnywhere('ashenmoor');
  const cs = ZONES.world.npcs.filter(n => n.def && n.def.name === 'Corwin'); const P = WORLD.SITES.filter(t => t.kind === 'port').map(t => ({ id: t.id, d: Math.round(Math.hypot(t.x - A.x, t.z - A.z)) })).sort((a, b) => a.d - b.d)[0];
  return { inAshenmoor: cs.some(n => n.def.role === 'Traveling Merchant'), corwins: cs.map(n => ({ role: n.def.role, d: Math.round(Math.hypot(n.g.position.x - A.x, n.g.position.z - A.z)) })), port: P, ashKind: A.kind }; });
check('with Q3 done he is no longer in Ashenmoor', !gone.inAshenmoor, gone);
// Q6: kills in a canonical Ironhaven dungeon entered by its world door count
await page.evaluate(() => { QS['q6_binding_stone'].state = 'active'; QS['q6_binding_stone'].objectives.forEach(o => o.current = 0); const e = WORLD.doorAnywhere(801); window._door = !!e; if (!e) return;
  const p = makePortalDef(e); const wp = WORLD.dungeonPos[801]; if (wp) { p.x = wp.x; p.z = wp.z; } p.zone = 'world'; goToDungeon(p); });
await page.waitForTimeout(6000); await g.hide();
const q6 = await page.evaluate(() => { const before = QS['q6_binding_stone'].objectives[0].current; const live = ENEMIES.filter(e => !e.dead).slice(0, 3); live.forEach(e => { e.hp = 0; killE(e); });
  return { door: window._door, portal: currentPortal && { zone: currentPortal.zone, seed: currentPortal.seed }, killed: live.length, before, after: QS['q6_binding_stone'].objectives[0].current, label: getQuest('q6_binding_stone').objectives[0].label }; });
console.log(JSON.stringify(q6));
check('Q6: three kills in Ironhaven’s dungeon (seed 801) through its world door count three', q6.door && q6.portal && q6.portal.zone === 'world' && q6.portal.seed === 801 && q6.killed === 3 && q6.after - q6.before === 3, q6);
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
