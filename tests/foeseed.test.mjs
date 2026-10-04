// Session 477: the co-op rule "a roll that decides an outcome comes from a seeded stream keyed by place and id" (CLAUDE.md,
// Michael's A on #119; backlog K step 1, the zone foes). A world chunk's foe is keyed by its chunk, its spawn epoch and its
// index and carries its own stream; its variant, its blows, its arrows, its flank and your swing's spread on it draw from that
// stream. Two machines are stood in for by two foes built with one id, one after the other, from the same state: they must
// roll the same fight, and a foe with another id must not. On the old code each draw was Math.random.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step && step()) break; PHP = maxHP; dead = false; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });

// 1. the world's chunk foes have ids of place and index, and a stream. Night, so the chunks round you are well peopled.
await page.evaluate(() => forceTime(1));
let ids = null;
for (let k = 0; k < 12; k++) {
  await g.spin(null, 30);
  ids = await page.evaluate(() => ZONES.world.enemies.filter(e => e._chunk).map(e => ({ id: e.id, chunk: e._chunk, rng: typeof e.rng === 'function', name: e.name })));
  if (ids.length >= 3) break;
  await page.evaluate((k) => { px += 120 * Math.cos(k); pz += 120 * Math.sin(k); }, k);
}
console.log('chunk foes', ids.length, JSON.stringify(ids.slice(0, 6)));
const re = /^-?\d+,-?\d+:\d+:(\d+|shark)$/;
const uniq = new Set(ids.map(e => e.id)).size;
check(`every chunk foe has an id <chunk>:<epoch>:<index> naming its own chunk, and a stream (${ids.length} foes, ${uniq} ids)`,
  ids.length >= 1 && ids.every(e => re.test(e.id || '') && e.id.startsWith(e.chunk + ':') && e.rng) && uniq === ids.length, ids);

// 2. the variant: one id picks one variant, every time
const vr = await page.evaluate(() => { let same = 0, picked = 0; const N = 300;
  for (let i = 0; i < N; i++) { const id = `${i},${-i}:3:${i % 4}`; const a = pickVariant('Bandit', 14, 'normal', seededRng('variant', id)), b = pickVariant('Bandit', 14, 'normal', seededRng('variant', id)); if (a === b) same++; if (a) picked++; }
  return { N, same, picked }; });
console.log('variant', JSON.stringify(vr));
check(`a chunk foe's variant is its id's: ${vr.same}/${vr.N} ids pick the same twice (${vr.picked} picked one at level 14)`, vr.same === vr.N && vr.picked > 0 && vr.picked < vr.N, vr);

// 3. your swing's spread on a keyed foe: five strikes through _resolveZoneStrike, the raw damage recorded
const swings = (id) => page.evaluate((id) => {
  const keep = ZE.splice(0, ZE.length); const w0 = EQ.weapon; EQ.weapon = Object.assign({}, w0 || { name: 'Test blade' }, { atk: [5, 40] });
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], px + fx * 1.2, pz + fz * 1.2, 'Bandit', null)); if (id) keyFoe(e, id); ZE.push(e);
  const log = [], amd = applyMeleeDamage; applyMeleeDamage = (f, raw) => { if (f === e) log.push(raw); return amd(f, raw); };
  try { for (let k = 0; k < 5; k++) { e.hp = e.maxHp = 9999; e.alert = false; e.shieldUp = false; e.x = px + fx * 1.2; e.z = pz + fz * 1.2; _resolveZoneStrike(false); } }
  finally { applyMeleeDamage = amd; EQ.weapon = w0; ZE.splice(0, ZE.length, ...keep); if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); }
  return log; }, id);
const sA = await swings('9,9:1:0'), sB = await swings('9,9:1:0'), sC = await swings('9,9:1:1');
console.log('swings', JSON.stringify(sA), JSON.stringify(sB), JSON.stringify(sC));
check(`your swings on one id roll the same damage on two machines (${sA.join(' ')} | ${sB.join(' ')}), another id rolls its own (${sC.join(' ')})`,
  sA.length === 5 && JSON.stringify(sA) === JSON.stringify(sB) && JSON.stringify(sA) !== JSON.stringify(sC), { sA, sB, sC });

// 4. the foe's blows: a keyed Bandit at your elbow, alert, by the loop's own tick; executeStrike records the raw damage
const blows = (id) => page.evaluate((id) => { forceTime(12);
  const keep = ZE.splice(0, ZE.length); const x0 = px, z0 = pz;
  const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], px, pz - 1.3, 'Bandit', null)); if (id) keyFoe(e, id); e.alert = true; ZE.push(e);
  const log = [], ex = executeStrike; executeStrike = (f, raw) => { if (f === e) log.push(raw); };
  try { window._drive(() => { px = x0; pz = z0; e.hp = e.maxHp; return log.length >= 6; }, 2400); }
  finally { executeStrike = ex; ZE.splice(0, ZE.length, ...keep); e.dead = true; if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); px = x0; pz = z0; }
  return log; }, id);
const bA = await blows('9,9:1:0'), bB = await blows('9,9:1:0'), bC = await blows('9,9:1:2');
console.log('blows', JSON.stringify(bA), JSON.stringify(bB), JSON.stringify(bC));
check(`a keyed foe's blows roll the same on two machines (${bA.join(' ')} | ${bB.join(' ')}), another id its own (${bC.join(' ')})`,
  bA.length >= 4 && JSON.stringify(bA) === JSON.stringify(bB) && JSON.stringify(bA) !== JSON.stringify(bC), { bA, bB, bC });

// 5. a foe with no id still fights (Math.random), and an archer's arrow carries its shooter for the sting
const plain = await swings(null);
const arrow = await page.evaluate(() => { const e = keyFoe({ x: px, z: pz - 10, name: 'Bandit Archer', dmg: 5 }, '1,1:0:0'); const n0 = ZARROWS.length; fireZoneArrow(e, WORLD.scene);
  const a = ZARROWS[ZARROWS.length - 1]; const out = { added: ZARROWS.length - n0, from: a && a.from === e }; if (a) { if (a.m && a.m.parent) a.m.parent.remove(a.m); ZARROWS.pop(); } return out; });
check(`an unkeyed foe still takes your swings (${plain.join(' ')}); an arrow carries its archer, whose stream rolls its sting`, plain.length === 5 && plain.every(d => d > 0) && arrow.added === 1 && arrow.from, { plain, arrow });

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
