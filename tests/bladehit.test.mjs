// The swinging blade cuts where it is (Michael's A on DECISION #170), Session 580. A blade cut you whenever you stood within
// 0.7 of its cell while its swing was near the bottom, wherever the blade actually was. Now the body (a column 0.3 round from
// the feet to 1.72) is tested against the blade's own box in the blade's own frame (`bladeTouches`), so the hit follows the
// arc and the shape the look builder gives it, today's along the corridor or the prototype's across it.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

let found = null;
for (const seed of [11, 3, 7, 21, 42, 5, 13, 29]) {
  await enterDungeon(page, { theme: 'ruins', seed, interior: 'cave', size: 'medium' });
  found = await page.evaluate(() => { const t = D_TRAPS.find(t => t.kind === 'blade' && t.floor === currentFloor); return t ? { x: t.x, z: t.z, ry: t.pivot.rotation.y } : null; });
  if (found) { found.seed = seed; break; }
}
console.log(' ', JSON.stringify(found));
check('a dungeon with a swinging blade', !!found, found);

const r = await page.evaluate(() => {
  const t = D_TRAPS.find(t => t.kind === 'blade' && t.floor === currentFloor); const gy = currentFloor === 2 ? FLOOR2_Y : 0;
  const others = D_TRAPS.filter(x => x !== t); D_TRAPS.length = 0; D_TRAPS.push(t);
  ENEMIES.forEach(e => { e.dead = true; }); blocking = false; jumpY = gy; const ph0 = t.ph;
  const along = t.pivot.rotation.y === 0 ? { x: 1, z: 0 } : { x: Math.cos(t.pivot.rotation.y), z: -Math.sin(t.pivot.rotation.y) };
  const blade = t.pivot.children.reduce((b, c) => (c.isMesh && (!b || c.position.y < b.position.y) ? c : b), null);
  const V = new THREE.Vector3();
  // stand at an offset, set the swing's phase, tick once: was I cut, and where was the blade?
  const at = (off, side, ph) => { PHP = maxHP; t.hitT = 0; t.ph = ph - 1 / 60 * 2.2;
    px = t.x + along.x * off - along.z * side; pz = t.z + along.z * off + along.x * side;
    tickDungeonTraps(1 / 60); t.pivot.updateMatrixWorld(true); blade.getWorldPosition(V);
    const bOff = (V.x - t.x) * along.x + (V.z - t.z) * along.z;
    return { cut: PHP < maxHP, dmg: maxHP - PHP, bOff, a: t.pivot.rotation.z, old: Math.abs(t.pivot.rotation.z) < .35 && Math.hypot(px - t.x, pz - t.z) < .7 }; };
  const N = 120, rows = [];
  for (const off of [-.9, -.6, -.3, 0, .3, .6, .9]) for (let i = 0; i < N; i++) { const ph = i / N * Math.PI * 2; rows.push(Object.assign({ off }, at(off, 0, ph))); }
  const far = rows.filter(x => x.cut && Math.abs(x.bOff - x.off) > .75);
  const oldFar = rows.filter(x => x.old && Math.abs(x.bOff - x.off) > .75);
  const near = rows.filter(x => Math.abs(x.bOff - x.off) < .2);
  const reach = Math.max(...rows.map(x => Math.abs(x.bOff)));
  const centreCut = rows.filter(x => x.off === 0 && x.cut).length / N;
  const endCut = rows.filter(x => x.off === .6 && x.cut).length / N, endCutOld = rows.filter(x => x.off === .6 && x.old).length / N;
  const outer = rows.filter(x => Math.abs(x.off) === .9 && x.cut).length, outerWrong = rows.filter(x => Math.abs(x.off) === .9 && x.cut && x.bOff * x.off <= 0).length;
  const dmg = (rows.find(x => x.cut) || {}).dmg;
  // the cooldown: two ticks under the blade cut once
  PHP = maxHP; px = t.x; pz = t.z; t.hitT = 0; t.ph = Math.PI - 1 / 60 * 2.2; tickDungeonTraps(1 / 60); const one = maxHP - PHP; t.ph = Math.PI - 1 / 60 * 2.2; tickDungeonTraps(1 / 60); const two = maxHP - PHP;
  // the blade turned across the passage (the prototype's swing): standing aside in the corridor's width
  t.pivot.rotation.y += Math.PI / 2; const across = { x: along.z, z: -along.x };
  const cross = []; for (const side of [-.45, 0, .45]) for (let i = 0; i < N; i++) { const ph = i / N * Math.PI * 2; PHP = maxHP; t.hitT = 0; t.ph = ph - 1 / 60 * 2.2;
    px = t.x + across.x * side; pz = t.z + across.z * side; tickDungeonTraps(1 / 60); t.pivot.updateMatrixWorld(true); blade.getWorldPosition(V);
    cross.push({ side, cut: PHP < maxHP, bOff: (V.x - t.x) * across.x + (V.z - t.z) * across.z }); }
  t.pivot.rotation.y -= Math.PI / 2;
  const crossFar = cross.filter(x => x.cut && Math.abs(x.bOff - x.side) > .75).length;
  const crossSides = { neg: cross.filter(x => x.side < 0 && x.cut).map(x => +x.bOff.toFixed(2)), pos: cross.filter(x => x.side > 0 && x.cut).map(x => +x.bOff.toFixed(2)) };
  const crossNegOk = crossSides.neg.every(b => b < .3), crossPosOk = crossSides.pos.every(b => b > -.3);
  // tall: jumping over the low swing? the blade hangs at 1.3, so a jump clears nothing; crouched is not modelled
  D_TRAPS.push(...others); t.ph = ph0; PHP = maxHP;
  return { reach: +reach.toFixed(2), far: far.length, oldFar: oldFar.length, near: near.length, nearCut: near.filter(x => x.cut).length,
    centreCut: +centreCut.toFixed(2), endCut: +endCut.toFixed(2), endCutOld: +endCutOld.toFixed(2), outer, outerWrong, dmg, one, two,
    crossFar, crossCut: cross.filter(x => x.cut).length, crossNegOk, crossPosOk };
});
console.log(' ', JSON.stringify(r));
check('a cut only where the blade is: none with the blade more than 0.75 away (the old rule had some)', r.far === 0 && r.oldFar > 0, r);
check('under the blade, always cut', r.near > 0 && r.nearCut === r.near, r);
// today's blade is 0.7 wide and swings 0.63 each way, so its edge never leaves a body at the centre (centreCut 1): only the
// look builder's blade across the passage leaves a gap to run through
check('0.9 along the corridor you are cut only while the blade is on your side', r.outer > 0 && r.outerWrong === 0, r);
check('at the end of the swing (0.6 along) you are cut when the blade comes to you', r.endCut > 0, r);
check('the damage is the old number and the cooldown holds', r.dmg > 0 && r.one === r.dmg && r.two === r.one, r);
check('turned across the passage, the hit follows the blade to each side', r.crossCut > 0 && r.crossFar === 0 && r.crossNegOk && r.crossPosOk, r);
stop(); check('no page errors', g.errs.length === 0, g.errs);
await g.close();
