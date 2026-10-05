// The inspector shows the dragon at the size the game builds it (Session 524; Michael's inspector note: "the scale seems far
// too small compared to the bandit"). The inspector built every wolf-kit kind at scale 1, and every dragon in play is built at
// 2.88 (the zone's 1.8 × 1.6, and the lair's dragonBody). The inspector's dragon and a zone dragon now stand the same height.
// Session 546 (Michael's B on #153): 4.5, about twice a man's height. The open world's dragon is built at it; a lair's wyrm is
// built at it too unless it would stand through the cavern's ceiling (FLOOR_HEIGHT, 3.2), when it is built at the largest that clears.
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
  return { name: e.name, dragon: !!e.dragon, h: +(b.max.y - b.min.y).toFixed(2), ceil: FLOOR_HEIGHT, s: +(e._wyrmScale || 0).toFixed(2), parts: e.mesh.children.filter(c => c.userData && c.userData.rig).length };
});
console.log(JSON.stringify(L));
check('a lair\'s wyrm is built on the dragon\'s body', !L.none && L.dragon && L.parts === 1, L);
check('it stands under the cavern\'s ceiling, as large as clears it (within 0.3 of it)', L.h < L.ceil && L.h > L.ceil - .3 && L.s > 3.5 && L.s <= 4.5, L);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
