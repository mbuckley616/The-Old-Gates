// Pirates and the hold (Session 398; Michael's B on #91, with C's chest). A pirate's chest carries one or two crates of
// one good taken off another ship. Flee a deck while her crew holds it (leave hers with any of them standing and your
// ship within 140 units, or leave your own while her boarders stand on it) and they take half the crates in your hold,
// rounded up, the dearest first; the crates go into her chest (a horse stays in her hold) and she sails off.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const sea = await page.evaluate(() => {
  let sx = null, sz = null; for (let r = 30; r < 2000 && sx === null; r += 30) for (let a = 0; a < 6.28; a += .3) { const x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r; if ([[0, 0], [60, 0], [-60, 0], [0, 60], [0, -60]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -4)) { sx = x; sz = z; break; } }
  window._sea = [sx, sz]; return sx !== null; });
check('found open water', sea);

// the chest: one or two crates of one good, never a horse, over 40 black sails
const chests = await page.evaluate(() => { const [sx, sz] = _sea; const out = { goods: {}, qty: {}, n: 0, horse: 0, noCrate: 0, cargoRows: [] };
  for (let i = 0; i < 40; i++) { const o = WORLD.spawnOtherShip('pirate', sx, sz); WORLD.boardOther(o);
    const c = o.chest.items.filter(it => it.type === 'cargo'); if (c.length !== 1) out.noCrate++; else { out.goods[c[0].cargo] = (out.goods[c[0].cargo] || 0) + 1; out.qty[c[0].qty] = (out.qty[c[0].qty] || 0) + 1; if (c[0].cargo === 'horse') out.horse++; if (i === 0) out.cargoRows.push(c[0]); }
    out.n++; WORLD.despawnOtherShip(o); }
  const m = WORLD.spawnOtherShip('merchant', sx, sz); WORLD.boardOther(m); out.merchantCrates = m.chest.items.filter(it => it.type === 'cargo').length; WORLD.despawnOtherShip(m);
  return out; });
console.log(JSON.stringify(chests));
check('every black sail\'s chest holds one row of crates, one or two of one good', chests.noCrate === 0 && Object.keys(chests.qty).every(q => q === '1' || q === '2') && chests.qty['1'] > 0 && chests.qty['2'] > 0, chests);
check('the goods vary and are never a horse; the crate is a trade good a factor buys', Object.keys(chests.goods).length >= 5 && chests.horse === 0 && chests.cargoRows[0].type === 'cargo' && chests.cargoRows[0].weight > 0, chests);
check('a merchantman\'s chest is unchanged (no crates)', chests.merchantCrates === 0, chests);

// set up: your sloop beside her, a hold of five crates (two silver 95, one iron 40, two grain 20)
const setup = `(() => { const [sx, sz] = _sea; for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', cargo: 0, hold: { grain: 2, silver: 2, iron: 1 } };
  WORLD.ship.mesh = WORLD.ship.mesh || new THREE.Group(); WORLD.ship.x = sx + 20; WORLD.ship.z = sz; WORLD.ship.sailing = false;
  WORLD.ship.plat = WORLD.ship.plat || {}; Object.assign(WORLD.ship.plat, { x0: sx + 18, x1: sx + 22, z0: sz - 6, z1: sz + 6, y: 1 });
  const o = WORLD.spawnOtherShip('pirate', sx, sz); o.yaw = 0; PHP = maxHP; return o; })()`;

const flee = await page.evaluate((setup) => { const o = eval(setup); const out = {};
  WORLD.boardOther(o); out.boarded = o.boarded; out.chest0 = o.chest.items.filter(it => it.type === 'cargo').map(it => it.cargo + '×' + it.qty);
  for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now());
  out.holdOnDeck = JSON.stringify(worldState.ship.hold); out.stillBoarded = o.boarded;
  // over the side: 6 units off her deck, into the water
  px = o.plat.x1 + 6; pz = (o.plat.z0 + o.plat.z1) / 2; jumpY = 0;
  WORLD.tick(1 / 60, performance.now());
  out.hold = { ...worldState.ship.hold }; out.msg = document.getElementById('msg').textContent;
  out.chest = o.chest.items.filter(it => it.type === 'cargo').map(it => it.cargo + '×' + it.qty);
  out.sated = !!o.sated; out.boardedAfter = o.boarded;
  const d0 = Math.hypot(o.x - px, o.z - pz); for (let i = 0; i < 600; i++) WORLD.tick(1 / 60, performance.now()); out.d0 = +d0.toFixed(1); out.d1 = +Math.hypot(o.x - px, o.z - pz).toFixed(1);
  out.holdLater = { ...worldState.ship.hold };
  return out; }, setup);
console.log(JSON.stringify(flee));
check('on her deck with her crew standing, the hold is untouched', flee.boarded && flee.stillBoarded && flee.holdOnDeck === JSON.stringify({ grain: 2, silver: 2, iron: 1 }), flee);
check('flee her deck: of five crates they take three, the dearest (both silver, the iron); the grain is left', JSON.stringify(flee.hold) === JSON.stringify({ grain: 2 }), flee);
check('the message names what went', /take 2 × chest of silver and a crate of iron from the hold/.test(flee.msg), flee.msg);
check('the crates go into her chest, beside what was there', flee.chest.includes('silver×' + (2 + (flee.chest0.find(c => c.startsWith('silver')) ? +flee.chest0[0].split('×')[1] : 0))) && flee.chest.some(c => c.startsWith('iron')), flee);
check('and she sails off: no longer boarded, farther after ten seconds, the rest of the hold left alone', flee.sated && !flee.boardedAfter && flee.d1 > flee.d0 + 5 && JSON.stringify(flee.holdLater) === JSON.stringify({ grain: 2 }), flee);

// beat her crew first, then leave: nothing taken
const won = await page.evaluate((setup) => { const o = eval(setup); WORLD.boardOther(o); o.crew.forEach(e => { e.dead = true; });
  px = o.plat.x1 + 6; jumpY = 0; for (let i = 0; i < 10; i++) WORLD.tick(1 / 60, performance.now());
  return { hold: { ...worldState.ship.hold }, sated: !!o.sated }; }, setup);
check('with her crew dead, leaving her deck costs nothing', JSON.stringify(won.hold) === JSON.stringify({ grain: 2, silver: 2, iron: 1 }) && !won.sated, won);

// your ship far off (you swam to her): they can't reach your hold
const far = await page.evaluate((setup) => { const o = eval(setup); WORLD.ship.x = o.x + 400; WORLD.boardOther(o);
  px = o.plat.x1 + 6; jumpY = 0; for (let i = 0; i < 10; i++) WORLD.tick(1 / 60, performance.now());
  return { hold: { ...worldState.ship.hold }, sated: !!o.sated }; }, setup);
check('with your ship 400 units off, they cannot reach the hold', JSON.stringify(far.hold) === JSON.stringify({ grain: 2, silver: 2, iron: 1 }) && !far.sated, far);

// a horse: taken first (110), kept in her hold, not her chest; one crate of an odd count is rounded up
const horse = await page.evaluate((setup) => { const o = eval(setup); worldState.ship.hold = { horse: 1, grain: 1, wool: 1 }; WORLD.boardOther(o);
  const before = o.chest.items.filter(it => it.type === 'cargo').length; px = o.plat.x1 + 6; jumpY = 0; WORLD.tick(1 / 60, performance.now());
  return { hold: { ...worldState.ship.hold }, horseInChest: o.chest.items.some(it => it.cargo === 'horse'), msg: document.getElementById('msg').textContent, wool: o.chest.items.some(it => it.cargo === 'wool' && it.qty >= 1) }; }, setup);
check('of three crates two go (rounded up): the horse and the wool; the grain stays; the horse is not in her chest', JSON.stringify(horse.hold) === JSON.stringify({ grain: 1 }) && !horse.horseInChest && horse.wool && /a horse and a bale of wool/.test(horse.msg), horse);

// an empty hold: fleeing costs nothing and she stays where she is
const empty = await page.evaluate((setup) => { const o = eval(setup); worldState.ship.hold = {}; WORLD.boardOther(o); px = o.plat.x1 + 6; jumpY = 0; WORLD.tick(1 / 60, performance.now());
  return { sated: !!o.sated, boarded: o.boarded }; }, setup);
check('with nothing in the hold, nothing happens (she stays boarded, as before)', !empty.sated && empty.boarded, empty);

// boarders on your deck: leave it while they stand and they take half, go home, and the goods go into her chest
const boarders = await page.evaluate((setup) => { const o = eval(setup); const out = {}; const sp = WORLD.ship.plat;
  px = (sp.x0 + sp.x1) / 2; pz = (sp.z0 + sp.z1) / 2; jumpY = 1;
  // two of her crew come across, as tickBoarding sends them
  for (const e of o.crew.splice(0, 2)) { e._ship = { plat: sp }; e._from = o; e.x = px; e.z = pz; WORLD.boarders.push(e); }
  for (let i = 0; i < 5; i++) WORLD.tick(1 / 60, performance.now());
  out.holdHeld = JSON.stringify(worldState.ship.hold);
  px = sp.x1 + 6; jumpY = 0; WORLD.tick(1 / 60, performance.now());
  out.hold = { ...worldState.ship.hold }; out.msg = document.getElementById('msg').textContent; out.boarders = WORLD.boarders.length; out.crew = o.crew.length;
  out.loot = (o.loot || []).map(it => it.cargo + '×' + it.qty); out.sated = !!o.sated;
  WORLD.boardOther(o); out.chest = o.chest.items.filter(it => it.type === 'cargo').map(it => it.cargo + '×' + it.qty);
  return out; }, setup);
console.log(JSON.stringify(boarders));
check('while you stand on your deck with boarders on it, the hold is untouched', boarders.holdHeld === JSON.stringify({ grain: 2, silver: 2, iron: 1 }), boarders);
check('leave your deck to them: they take the silver and the iron, and go back to her (crew 3 again, no boarders)', JSON.stringify(boarders.hold) === JSON.stringify({ grain: 2 }) && boarders.boarders === 0 && boarders.crew === 3 && /They hold your deck, take 2 × chest of silver and a crate of iron/.test(boarders.msg) && boarders.sated, boarders);
check('board her after and the goods are in her chest', boarders.chest.some(c => c.startsWith('silver×')) && boarders.chest.some(c => c.startsWith('iron×')), boarders);

stop(); await g.close();
