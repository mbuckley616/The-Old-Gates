// The swinging blade cuts where it is (Michael's A on DECISION #170), Session 580. A blade cut you whenever you stood within
// 0.7 of its cell while its swing was near the bottom, wherever the blade actually was. Now the body (a column 0.3 round from
// the feet to 1.72) is tested against the blade's own box in the blade's own frame (`bladeTouches`), so the hit follows the
// arc and the shape the look builder gives it, today's along the corridor or the prototype's across it.
// Session 585: the suite reads the swing's direction and the blade's reach from the blade itself, so it holds for the old box
// blade and for Session 582's crescent (.98 wide, swung across the passage by a pivot already turned), which it had assumed away.
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
  ENEMIES.forEach(e => { e.dead = true; }); blocking = false; jumpY = gy; const ph0 = t.ph, ry0 = t.pivot.rotation.y;
  const blade = t.blade || t.pivot.children.reduce((b, c) => (c.isMesh && (!b || c.position.y < b.position.y) ? c : b), null);
  const V = new THREE.Vector3();
  // the swing's direction, read from the blade itself: where it is at each end of its arc
  const swingAxis = () => { const end = s => { t.pivot.rotation.z = s * .42; t.pivot.updateMatrixWorld(true); blade.getWorldPosition(V); return { x: V.x, z: V.z }; };
    const a = end(-1), b = end(1), l = Math.hypot(b.x - a.x, b.z - a.z); return { x: (b.x - a.x) / l, z: (b.z - a.z) / l }; };
  // how far from the blade's centre a body can be and still touch it: the blade's half-diagonal in its swing plane, grown by the
  // body's 0.3 (today's box blade and the look builder's crescent differ, so the test reads it rather than assuming one)
  if (!blade.geometry.boundingBox) blade.geometry.computeBoundingBox(); const bb = blade.geometry.boundingBox;
  const hx = Math.max(-bb.min.x, bb.max.x), hy = Math.max(-bb.min.y, bb.max.y), thr = Math.hypot(hx + .3, hy + .3) + .02;
  // stand at an offset along the swing, set the swing's phase, tick once: was I cut, and where was the blade?
  const sweep = (offs, ax) => { const rows = []; for (const off of offs) for (let i = 0; i < N; i++) { const ph = i / N * Math.PI * 2;
    PHP = maxHP; t.hitT = 0; t.ph = ph - 1 / 60 * 2.2; px = t.x + ax.x * off; pz = t.z + ax.z * off;
    tickDungeonTraps(1 / 60); t.pivot.updateMatrixWorld(true); blade.getWorldPosition(V);
    rows.push({ off, cut: PHP < maxHP, dmg: maxHP - PHP, bOff: (V.x - t.x) * ax.x + (V.z - t.z) * ax.z,
      old: Math.abs(t.pivot.rotation.z) < .35 && Math.hypot(px - t.x, pz - t.z) < .7 }); } return rows; };
  const N = 120, ax = swingAxis();
  const rows = sweep([-.9, -.6, -.3, 0, .3, .6, .9], ax);
  const far = rows.filter(x => x.cut && Math.abs(x.bOff - x.off) > thr);
  const farMax = Math.max(0, ...rows.filter(x => x.cut).map(x => Math.abs(x.bOff - x.off)));
  const oldFar = rows.filter(x => x.old && Math.abs(x.bOff - x.off) > thr);
  const near = rows.filter(x => Math.abs(x.bOff - x.off) < .2);
  const reach = Math.max(...rows.map(x => Math.abs(x.bOff)));
  const centreCut = rows.filter(x => x.off === 0 && x.cut).length / N;
  const endCut = rows.filter(x => x.off === .6 && x.cut).length / N, endCutOld = rows.filter(x => x.off === .6 && x.old).length / N;
  const outer = rows.filter(x => Math.abs(x.off) === .9 && x.cut).length, outerWrong = rows.filter(x => Math.abs(x.off) === .9 && x.cut && x.bOff * x.off <= 0).length;
  const dmg = (rows.find(x => x.cut) || {}).dmg;
  // the cooldown: two ticks under the blade cut once
  PHP = maxHP; px = t.x; pz = t.z; t.hitT = 0; t.ph = Math.PI - 1 / 60 * 2.2; tickDungeonTraps(1 / 60); const one = maxHP - PHP; t.ph = Math.PI - 1 / 60 * 2.2; tickDungeonTraps(1 / 60); const two = maxHP - PHP;
  // the pivot turned a quarter (along the corridor for the crescent, across it for the old box): the hit turns with the blade
  t.pivot.rotation.y = ry0 + Math.PI / 2; const ax2 = swingAxis(); const turnDot = +Math.abs(ax2.x * ax.x + ax2.z * ax.z).toFixed(3);
  const cross = sweep([-.45, 0, .45], ax2);
  t.pivot.rotation.y = ry0;
  const crossFar = cross.filter(x => x.cut && Math.abs(x.bOff - x.off) > thr).length;
  const crossSides = { neg: cross.filter(x => x.off < 0 && x.cut).map(x => x.bOff), pos: cross.filter(x => x.off > 0 && x.cut).map(x => x.bOff) };
  // to each side: never cut while the blade is out at the far end of its swing, and on average it is on your side when it cuts
  const reach2 = Math.max(...cross.map(x => Math.abs(x.bOff))), mean = a => a.reduce((p, q) => p + q, 0) / a.length;
  const crossNegOk = crossSides.neg.every(b => b < .8 * reach2) && mean(crossSides.neg) < 0, crossPosOk = crossSides.pos.every(b => b > -.8 * reach2) && mean(crossSides.pos) > 0;
  D_TRAPS.push(...others); t.ph = ph0; PHP = maxHP;
  return { hx: +hx.toFixed(3), hy: +hy.toFixed(3), negMax: +Math.max(...crossSides.neg).toFixed(3), posMin: +Math.min(...crossSides.pos).toFixed(3), reach2: +reach2.toFixed(3), negMean: +mean(crossSides.neg).toFixed(3), thr: +thr.toFixed(3), farMax: +farMax.toFixed(3), reach: +reach.toFixed(2), far: far.length, oldFar: oldFar.length, near: near.length, nearCut: near.filter(x => x.cut).length,
    centreCut: +centreCut.toFixed(2), endCut: +endCut.toFixed(2), endCutOld: +endCutOld.toFixed(2), outer, outerWrong, dmg, one, two,
    turnDot, crossFar, crossCut: cross.filter(x => x.cut).length, crossNegOk, crossPosOk };
});
console.log(' ', JSON.stringify(r));
check('a cut only where the blade is: none with the body beyond the blade\'s own reach (the old rule had some)', r.far === 0 && r.oldFar > 0, r);
check('under the blade, always cut', r.near > 0 && r.nearCut === r.near, r);
// neither blade's edge leaves a body standing at the cell's centre (centreCut 1): the gap to run through is in time, between swings
check('0.9 to the side along the swing you are cut only while the blade is on your side', r.outer > 0 && r.outerWrong === 0, r);
check('at the end of the swing (0.6 along) you are cut when the blade comes to you', r.endCut > 0, r);
check('the damage is the old number and the cooldown holds', r.dmg > 0 && r.one === r.dmg && r.two === r.one, r);
check('the pivot turned a quarter, the hit follows the blade to each side', r.turnDot < .05 && r.crossCut > 0 && r.crossFar === 0 && r.crossNegOk && r.crossPosOk, r);
stop(); check('no page errors', g.errs.length === 0, g.errs);
await g.close();
