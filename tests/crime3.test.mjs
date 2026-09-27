// The crime system, part 3 (Session 157): a guard stops you over a fine, draws if you refuse, takes a yield; killing one; striking townsfolk.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const stop = g.keepAlive();

// stand in the open with a guard beside you and a fine on your head
const setup = `const S = WORLD.settle.get('dunmore'); const site = S.site; forceTime(12); px = site.x; pz = site.z + 18; jumpY = 0;
  const gd = WORLD.guardsOf(S)[0]; gd.g.visible = true; gd._retreated = false; gd._drawn = false; gd.sched = { type: 'guard', a: { x: px + 2.5, z: pz }, b: { x: px + 2.5, z: pz } }; gd.g.position.set(px + 2.5, WORLD.worldH(px + 2.5, pz), pz);
  worldState.crime = { dunmore: { bounty: 25, debt: 1, last: 0 } }; window._gd = gd; window._S = S;`;
const halt = await page.evaluate((setup) => { eval(setup); WORLD.tickCrime(1 / 60, performance.now());
  return { open: dlgOpen, name: dlgNPC && dlgNPC.name, guard: window._gd.def.name, greet: dlgNPC && dlgNPC.greeting[0], labels: dlgNPC ? dlgNPC.topics.map(t => t.label) : [] }; }, setup);
check('a guard within sight stops you: pay, or he draws', halt.open && halt.name === halt.guard && /fine of 25 gold/.test(halt.greet) && halt.labels[0] === 'Pay the fine (25 gold)' && /not pay/.test(halt.labels[1]), halt);

const refuse = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); const line = dlgNPC.topics[1].fn(); await wait(300);
  const e = ZONES.world.enemies.find(x => x._guard && !x.dead); return { line, drawn: !!e, name: e && e.name, hp: e && e.hp, alert: e && e.alert, hidden: !window._gd.g.visible, dlg: dlgOpen }; });
check('refuse, and the guard draws: an enemy stands in for him and he leaves the street', /sword/.test(refuse.line) && refuse.drawn && refuse.name === 'Town Guard' && refuse.hp >= 48 && refuse.alert && refuse.hidden && !refuse.dlg, refuse);

// low on health, the offer to yield; the cells take the stolen goods and the night
const cells = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); BAG.push({ name: 'A tin locket', ico: '🎁', type: 'misc', weight: .1, qty: 1, stolen: true }); BAG.push({ name: 'Honest bread', ico: '🍞', type: 'misc', weight: .1, qty: 1 });
  PHP = Math.round(maxHP * .2); const abs0 = worldState.gameTimeAbsMinutes || 0; WORLD.tickCrime(1 / 60, performance.now());
  const offered = dlgOpen && /Yield/.test(dlgNPC.greeting[0]); const held = ZONES.world.enemies.filter(x => x._guard && !x.dead).every(x => !x.alert);
  const t = dlgNPC.topics.find(x => /cells/i.test(x.label)); const line = t.fn();
  // the cells run inside a screen fade, which on a slow machine can take longer than any fixed pause: wait for the clock to move
  for (let k = 0; k < 240 && (worldState.gameTimeAbsMinutes || 0) === abs0; k++) await wait(250); await wait(300);
  const absAdv = (worldState.gameTimeAbsMinutes || 0) - abs0; const keep = window._S.houses.find(h => h.type === 'castle');
  const there = keep ? [keep.exitX != null ? keep.exitX : keep.doorX, keep.exitZ != null ? keep.exitZ : keep.doorZ + 2] : [window._S.site.x, window._S.site.z];
  return { offered, held, line, hour: Math.floor(worldState.gameTimeMinutes / 60), absAdv: Math.round(absAdv), stolenGone: !BAG.some(i => i.stolen), breadKept: BAG.some(i => i.name === 'Honest bread'), bounty: WORLD.bountyAt('dunmore'), enemies: ZONES.world.enemies.filter(x => x._guard && !x.dead).length, guardBack: window._gd.g.visible, where: keep ? 'keep' : 'town centre (no keep)', atPlace: Math.hypot(px - there[0], pz - there[1]) < 1.5, hp: PHP / maxHP }; });
check('at low health he offers a yield; the guards hold while you talk; the cells take the night, the stolen goods and the fine', cells.offered && cells.held && /Come along/.test(cells.line) && cells.hour === 7 && cells.absAdv >= 1100 && cells.absAdv <= 1200 && cells.stolenGone && cells.breadKept && cells.bounty === 0 && cells.enemies === 0 && cells.guardBack && cells.atPlace && cells.hp >= .5, cells);

// striking a guard draws him; killing him shuts the gates and the Church hears; then guards draw on sight; the lord's fine opens the gates
const kill = await page.evaluate(async (setup) => { const wait = ms => new Promise(r => setTimeout(r, ms)); eval(setup); worldState.crime = {}; const f0 = WORLD.favor(window._S.site);
  const gd = window._gd; gd.g.position.set(px + 1.8, WORLD.worldH(px + 1.8, pz), pz); const fx = (gd.g.position.x - px), fz = (gd.g.position.z - pz), L = Math.hypot(fx, fz); const struck = WORLD.strikeNpc(fx / L, fz / L);
  const e = ZONES.world.enemies.find(x => x._guard && !x.dead); const afterStrike = { favor: WORLD.favor(window._S.site), bounty: WORLD.bountyAt('dunmore') };
  killZoneEnemy(e, scene); await wait(200); const c = worldState.crime.dunmore;
  const afterKill = { favor: WORLD.favor(window._S.site), bounty: c.bounty, shut: c.shut, church: (worldState.church && worldState.church.notes || []).length };
  // another guard, and the gates shut: he draws without a word
  const g2 = WORLD.guardsOf(window._S)[1]; g2.g.visible = true; g2._retreated = false; g2._drawn = false; g2.sched = { type: 'guard', a: { x: px + 2, z: pz }, b: { x: px + 2, z: pz } }; g2.g.position.set(px + 2, WORLD.worldH(px + 2, pz), pz);
  WORLD.tickCrime(1 / 60, performance.now() + 5000); const drew = ZONES.world.enemies.filter(x => x._guard && !x.dead).length === 1 && !dlgOpen;
  const ln = window._S.npcs.find(n => n.def && n.def._lord); const t = ln.def._extraFn().find(x => /Pay my fine/.test(x.label)); gold = 1000; const paid = t.fn();
  return { struck, drewOnStrike: !!e, f0, afterStrike, afterKill, drew, paid, shutAfter: worldState.crime.dunmore.shut, bountyAfter: WORLD.bountyAt('dunmore') }; }, setup);
check('a struck guard draws; killing him costs five favour, shuts the gates and the Church hears; shut, guards draw on sight; the lord\'s fine opens the gates', kill.struck && kill.drewOnStrike && kill.afterStrike.favor === kill.f0 - 3 && kill.afterStrike.bounty === 75 && kill.afterKill.favor === kill.f0 - 8 && kill.afterKill.bounty === 200 && kill.afterKill.shut && kill.afterKill.church === 1 && kill.drew && /Paid/.test(kill.paid) && kill.shutAfter === false && kill.bountyAfter === 0, kill);

// striking a townsperson: seen by its victim, who runs
const villager = await page.evaluate(() => { const S = window._S; worldState.crime = {}; const v = S.npcs.find(n => !(n.sched && /guard|watch/.test(n.sched.type)) && n.def && !n.def._lord); v.g.visible = true; v._retreated = false; v.g.position.set(px, WORLD.worldH(px, pz - 1.5), pz - 1.5);
  const f0 = WORLD.favor(S.site); const struck = WORLD.strikeNpc(0, -1); return { name: v.def.name, struck, favor: WORLD.favor(S.site) - f0, bounty: WORLD.bountyAt('dunmore'), scared: !!v._scared, assault: worldState.crimes.some(c => c.kind === 'assault') }; });
check('striking a townsperson is assault its victim sees: three favour, a 75-gold fine, and they run', villager.struck && villager.favor === -3 && villager.bounty === 75 && villager.scared && villager.assault, villager);
check('no page errors', g.errs.length === 0, g.errs);
stop(); await g.close();
