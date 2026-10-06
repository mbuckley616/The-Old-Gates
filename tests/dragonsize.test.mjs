// The inspector shows the dragon at the size the game builds it (Session 524; Michael's inspector note: "the scale seems far
// too small compared to the bandit"). The inspector built every wolf-kit kind at scale 1, and every dragon in play is built at
// 2.88 (the zone's 1.8 × 1.6, and the lair's dragonBody). The inspector's dragon and a zone dragon now stand the same height.
// Session 546 (Michael's B on #153): 4.5, about twice a man's height. The open world's dragon is built at it; a lair's wyrm is
// built at it too unless it would stand through the cavern's ceiling (FLOOR_HEIGHT, 3.2), when it is built at the largest that clears.
// Session 564 (Michael's B on #162): a dragon's lair is cut to 4.4, so its wyrm stands at the full 4.5; other dungeons stay 3.2.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const h = o => { o.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(o); return +(b.max.y - b.min.y).toFixed(2); };
  openInspector(); const e = INSPECTOR.entries.find(x => x.key === 'creatures/on-the-wolf-kit/dragon' || (x.sub === 'On the wolf kit' && x.name === 'Dragon')); INSPECTOR.select(e.id);
  const ins = INSPECTOR.built.get(e.id).obj; const insH = h(ins), insS = +ins.scale.x.toFixed(2); closeInspector();
  const grp = new THREE.Group(); WORLD.scene.add(grp); const z = buildZoneEnemy(grp, [], px + 40, pz + 40, 'Dragon');
  const w = z && z.limbs && z.limbs.wolf; const zH = w ? h(w.root) : 0; /* its body alone, not the health bar above it */
  const mb = buildZoneEnemy(grp, [], px + 44, pz + 40, 'Bandit'); const manH = h(mb.limbs.person.root); /* a bandit as the world builds him */
  WORLD.scene.remove(grp); return { insH, insS, zH, manH, ratio: +(zH / manH).toFixed(2), barY: +z.hpFg.position.y.toFixed(2), world: WOLF_KINDS.Dragon.world };
});
console.log(JSON.stringify(r));
check('the inspector builds the dragon at its world scale (4.5, Michael\'s B on #153)', r.insS === 4.5 && r.world === 4.5, r);
check('the open world\'s dragon stands 3.6–3.8 tall, about three bandits as the world builds them (1.24)', r.zH >= 3.6 && r.zH <= 3.8 && r.ratio > 2.7, r);
check('its health bar sits above its body', r.barY > r.zH, r);
check('the inspector\'s dragon stands as tall as a dragon built for the open world (within 5%)', Math.abs(r.insH - r.zH) / r.zH < .05, r);

// a lair's wyrm: the cavern's master on the dragon's body, under the ceiling
await page.evaluate(() => { level = 9; const p = Object.assign({}, PORTALS[0], { theme: 'deep', seed: 4021, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, lair: { place: 'Test', boss: 'Wyrm', dragon: true } }); goToDungeon(p); });
for (let k = 0; k < 40 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && !!window._lairBoss)); k++) await page.waitForTimeout(500);
const L = await page.evaluate(() => { const e = window._lairBoss; if (!e || !e.limbs || !e.limbs.wolf) return { none: true, name: e && e.name };
  const root = e.limbs.wolf.root; e.mesh.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(root);
  const shell = k => { let y0 = 1e9, y1 = -1e9; dScene.traverse(o => { if (o.isMesh && o.userData && o.userData.dunShell === k) { o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o); y0 = Math.min(y0, bb.min.y); y1 = Math.max(y1, bb.max.y); } }); return [+y0.toFixed(2), +y1.toFixed(2)]; };
  return { name: e.name, dragon: !!e.dragon, h: +(b.max.y - b.min.y).toFixed(2), ceil: FLOOR_HEIGHT, s: +(e._wyrmScale || 0).toFixed(2), parts: e.mesh.children.filter(c => c.userData && c.userData.rig).length,
    ceilY: shell('ceiling'), floor: e.floor || 1, tp: (() => { const f = currentFloor; currentFloor = e.floor || 1; const c = +tpCeil().toFixed(2); currentFloor = f; return c; })() };
});
console.log(JSON.stringify(L)); const FLOOR2_Y_V = await page.evaluate(() => FLOOR2_Y);
check('a lair\'s wyrm is built on the dragon\'s body', !L.none && L.dragon && L.parts === 1, L);
check('a dragon\'s lair is cut to 4.4 (Michael\'s B on #162), and the shell\'s roof reaches it (its stone stands up to .1 proud)', L.ceil === 4.4 && L.ceilY[1] >= 4.35 && L.ceilY[1] <= 4.52, L);
check('its wyrm is built at the full 4.5, standing 3.6–3.8 under the roof', L.s === 4.5 && L.h >= 3.6 && L.h <= 3.8 && L.h < L.ceil, L);
check('the third-person camera\'s ceiling on the wyrm\'s floor reads the lair\'s height', Math.abs(L.tp - ((L.floor === 2 ? FLOOR2_Y_V : 0) + 4.4 - .25)) < .01, L);

// a lair without a dragon, and a plain cave, keep the old 3.2
const O = await page.evaluate(() => { const out = {}; for (const [k, lair] of [['beast', { place: 'Test', boss: 'Brute', dragon: false }], ['cave', null]]) {
  const p = Object.assign({}, PORTALS[0], { theme: 'deep', seed: 4022, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, lair }); buildDungeon(p);
  let y1 = -1e9; dScene.traverse(o => { if (o.isMesh && o.userData && o.userData.dunShell === 'ceiling') { o.updateMatrixWorld(true); y1 = Math.max(y1, new THREE.Box3().setFromObject(o).max.y); } });
  out[k] = { h: FLOOR_HEIGHT, roof: +y1.toFixed(2) }; } return out; });
console.log(JSON.stringify(O));
check('a lair without a dragon, and a plain cave, stay at 3.2', O.beast.h === 3.2 && O.cave.h === 3.2 && O.cave.roof >= 3.15 && O.cave.roof <= 3.32 && O.beast.roof >= 3.15 && O.beast.roof <= 3.32, O);
// S570 — a swinging blade hangs from the roof: under a lair's 4.4 roof its arm is longer, so the blade swings at the height it does under 3.2
const T = await page.evaluate(() => { const out = {};
  for (const [k, lair] of [['lair', { place: 'Test', boss: 'Wyrm', dragon: true }], ['cave', null]]) { const ys = [];
    for (let seed = 5000; seed < 5040 && ys.length < 2; seed++) { const p = Object.assign({}, PORTALS[0], { theme: 'ruins', seed, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, lair }); buildDungeon(p);
      for (const t of D_TRAPS) if (t.kind === 'blade') { t.pivot.rotation.z = 0; t.pivot.updateMatrixWorld(true); const b = t.pivot.children.find(c => c.userData && c.userData.trapBlade); const v = new THREE.Vector3(); b.getWorldPosition(v); ys.push(+v.y.toFixed(2)); } }
    out[k] = { h: FLOOR_HEIGHT, ys }; } return out; });
console.log(JSON.stringify(T));
check('a swinging blade hangs at the same height, 1.55 above the floor, under a lair\'s 4.4 roof and a cave\'s 3.2', T.lair.ys.length > 0 && T.cave.ys.length > 0 && T.lair.h === 4.4 && T.cave.h === 3.2 && [...T.lair.ys, ...T.cave.ys].every(y => Math.abs(y - 1.55) < .01), T);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
