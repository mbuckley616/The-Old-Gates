// Session 508: the co-op rules (CLAUDE.md, Michael's A on #119; backlog K steps 1 and 3) for the sea's encounters. A black
// sail or a merchantman is met at a random bearing round you, so she had no place to key by: her id is now where and when
// she came up, `sea:<chunk>:<minute>:<kind>`, and her heading, her crew (each a keyed foe), her volleys and her chest roll on
// streams of that id. The roll that raises her is keyed by your chunk and the minute. Two machines are stood in for by the
// same state twice: it must give the same ship, the same crew, the same arrows and the same chest; another id must not.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// open water: the first point well out from the shore, walking out from home
const sea = await page.evaluate(() => { for (let r = 200; r < 4000; r += 40) for (let a = 0; a < 16; a++) {
  const x = px + Math.cos(a / 16 * Math.PI * 2) * r, z = pz + Math.sin(a / 16 * Math.PI * 2) * r;
  if (WORLD.worldH(x, z) < -6 && WORLD.worldH(x + 300, z) < -4 && WORLD.worldH(x - 300, z) < -4 && WORLD.worldH(x, z + 300) < -4 && WORLD.worldH(x, z - 300) < -4) return { x, z }; }
  return null; });
check('open water found', !!sea, sea);

const clear = () => page.evaluate(() => { OTHER.slice().forEach(o => despawnOtherShip(o)); ARROWS.splice(0).forEach(a => (a.scene || sc).remove(a.m)); });
const meet = (kind, id) => page.evaluate(({ kind, id, sea }) => {
  px = sea.x; pz = sea.z; jumpY = 0; const o = spawnOtherShip(kind, sea.x + 120, sea.z + 40, id || undefined);
  return { id: o.id, rng: typeof o.rng === 'function', yaw: +o.yaw.toFixed(6), crew: o.crew.map(e => ({ id: e.id, rng: typeof e.rng === 'function', name: e.name, v: e.variant || e.variantKey || e.displayName })) }; }, { kind, id, sea });
const shoot = () => page.evaluate(() => { const o = OTHER[0]; const n0 = ARROWS.length; const out = [];
  for (let k = 0; k < 4; k++) { volley(o); out.push(ARROWS.slice(n0).map(a => [+(a.tx - px).toFixed(4), +(a.tz - pz).toFixed(4)])); ARROWS.splice(n0).forEach(a => (a.scene || sc).remove(a.m)); }
  return out; });
const chest = () => page.evaluate(() => { const o = OTHER[0]; const keep = { px, pz }; boardOther(o); const items = (o.chest && o.chest.items || []).map(it => `${it.name}×${it.qty}`); px = keep.px; pz = keep.pz; jumpY = 0;
  o.crew.forEach(e => { if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); }); return items; });

// 1. a ship met with no id of her own is given one of place and minute; her crew are keyed under it
await clear();
await page.evaluate(() => { worldState.gameTimeAbsMinutes = 5000; });
const a = await meet('pirate');
console.log('met', JSON.stringify(a));
check(`a black sail is keyed sea:<chunk>:<minute>:pirate (${a.id}) with a stream`, /^sea:-?\d+,-?\d+:5000:pirate$/.test(a.id) && a.rng, a);
check(`her three crew are keyed foes, ${a.crew.map(e => e.id).join(', ')}`, a.crew.length === 3 && a.crew.every((e, k) => e.id === `${a.id}:crew:${k}` && e.rng), a.crew);
const va = await shoot(); const ca = await chest();
console.log('volleys', JSON.stringify(va), 'chest', JSON.stringify(ca));

// 2. the same id, from the same state: the same heading, crew, arrows and chest
await clear();
const b = await meet('pirate', a.id); const vb = await shoot(); const cb = await chest();
check(`the same id gives the same heading (${a.yaw}) and the same crew`, b.yaw === a.yaw && JSON.stringify(b.crew) === JSON.stringify(a.crew), { a, b });
check(`and the same four volleys (${va.map(v => v.length).join('+')} arrows, each to the same spot)`, JSON.stringify(vb) === JSON.stringify(va) && va.every(v => v.length >= 2 && v.length <= 3), { va, vb });
check(`and the same chest: ${ca.join(', ')}`, ca.length >= 2 && JSON.stringify(cb) === JSON.stringify(ca), { ca, cb });

// 3. another id rolls another encounter
await clear();
const c = await meet('pirate', 'sea:0,0:1:pirate'); const vc = await shoot(); const cc = await chest();
check('another id gives another heading or other arrows', c.yaw !== a.yaw || JSON.stringify(vc) !== JSON.stringify(va), { a: a.yaw, c: c.yaw });
check('the merchantman is keyed too', (await (async () => { await clear(); const m = await meet('merchant'); return /^sea:-?\d+,-?\d+:5000:merchant$/.test(m.id) && m.crew.length === 0; })()));

// 4. the roll that raises her: at the wheel of your own ship, at sea, the same chunk and minute raise the same ships
const raise = () => page.evaluate((sea) => { OTHER.slice().forEach(o => despawnOtherShip(o));
  px = sea.x; pz = sea.z; if (!SHIP.mesh) spawnShip(sea.x, sea.z, 0); SHIP.x = sea.x; SHIP.z = sea.z; SHIP.sailing = true; jumpY = DECK_Y;
  _seaT = 0; tickOtherShips(1 / 60, performance.now()); const out = OTHER.map(o => ({ id: o.id, x: Math.round(o.x), z: Math.round(o.z) })); SHIP.sailing = false; return out; }, sea);
const rolls = []; let same = 0, met = 0;
for (let m = 0; m < 12; m++) {
  await page.evaluate((m) => { worldState.gameTimeAbsMinutes = 7000 + m * 3; }, m);
  const r1 = await raise(), r2 = await raise(); if (JSON.stringify(r1) === JSON.stringify(r2)) same++; met += r1.length; rolls.push(r1.map(o => o.id.split(':').pop()).join('+') || '-');
}
console.log('raised', rolls.join(' '));
check(`at the wheel, one chunk and minute raise the same ships twice (${same}/12 minutes; ${met} ships met, not every minute)`, same === 12 && met > 0 && rolls.some(r => r !== 'pirate+merchant'), rolls);

await clear();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
