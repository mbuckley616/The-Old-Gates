// The inspector shows the dragon at the size the game builds it (Session 524; Michael's inspector note: "the scale seems far
// too small compared to the bandit"). The inspector built every wolf-kit kind at scale 1, and every dragon in play is built at
// 2.88 (the zone's 1.8 × 1.6, and the lair's dragonBody). The inspector's dragon and a zone dragon now stand the same height.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const h = o => { o.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(o); return +(b.max.y - b.min.y).toFixed(2); };
  openInspector(); const e = INSPECTOR.entries.find(x => x.key === 'creatures/on-the-wolf-kit/dragon' || (x.sub === 'On the wolf kit' && x.name === 'Dragon')); INSPECTOR.select(e.id);
  const ins = INSPECTOR.built.get(e.id).obj; const insH = h(ins), insS = +ins.scale.x.toFixed(2); closeInspector();
  const grp = new THREE.Group(); WORLD.scene.add(grp); const z = buildZoneEnemy(grp, [], px + 40, pz + 40, 'Dragon');
  const w = z && z.limbs && z.limbs.wolf; const zH = w ? h(w.root) : 0; WORLD.scene.remove(grp); // its body alone, not the health bar above it
  return { insH, insS, zH, world: WOLF_KINDS.Dragon.world };
});
console.log(JSON.stringify(r));
check('the inspector builds the dragon at its world scale (2.88)', r.insS === 2.88 && r.world === 2.88, r);
check('the inspector\'s dragon stands as tall as a dragon built for the open world (within 5%)', Math.abs(r.insH - r.zH) / r.zH < .05, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
