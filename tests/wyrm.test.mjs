// A lair's wyrm on the dragon's own body (Session 219): the master of a dragon lair — in the world, the lair's beast;
// in a lair cavern, the deepest foe — used to be whatever it was (a troll, an ogre, a hag, a skeleton) with box wings, a
// box neck and a box tail stuck on. It keeps its numbers and takes the dragon's skinned body (Session 177) instead.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const world = await page.evaluate(() => { const t = WORLD.SITES.find(s => s.anchor === 'salt_mouth') || WORLD.SITES.find(s => s.kind === 'lair' && s.pad > 0 && !WORLD.settlements.get(s.id)); if (!t) return { none: true }; t.dragon = true; // the Salt Mouth has one; any lair would with the dice
  let S = WORLD.settlements.get(t.id); if (!S) S = WORLD.genSettlement(t); const e = S.creatures && S.creatures[0]; if (!e) return { noBeast: true };
  const w = e.limbs && e.limbs.wolf; const boxes = e.mesh.children.filter(c => c.isMesh && c.geometry && c.geometry.type === 'BoxGeometry').length; const persons = e.mesh.children.filter(c => c.userData && c.userData.rig && c.userData.rig.g).length;
  e.mesh.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(w ? w.mesh : e.mesh);
  return { name: e.name, dragon: e.dragon, wolf: !!w, isDragon: !!(w && w.k && w.k.dragon), linked: w && w.e === e, inRigs: WOLF_RIGS.has(w), boxes, persons, long: +(bb.max.z - bb.min.z).toFixed(1), wide: +(bb.max.x - bb.min.x).toFixed(1), hp: e.maxHp }; });
check('a dragon lair\'s beast in the world is the skinned dragon, linked to its enemy, with no box parts or person left on it', !world.none && !world.noBeast && world.dragon && world.wolf && world.isDragon && world.linked && world.inRigs && world.boxes === 0 && world.persons === 0, world);

// a lair cavern with a dragon: its deepest foe becomes the wyrm
await page.evaluate(() => { level = 8; const p = Object.assign({}, PORTALS[0], { theme: 'deep', seed: 21, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, lair: { dragon: true, place: 'Test', boss: 'Wyrm' } }); goToDungeon(p); });
for (let k = 0; k < 40 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene)); k++) await page.waitForTimeout(500);
await page.waitForTimeout(1500);
const cave = await page.evaluate(() => { const e = window._lairBoss; if (!e) return { none: true }; const w = e.limbs && e.limbs.wolf; let t = 9e5; for (let k = 0; k < 10; k++) { tickPeople(1 / 60, t += 16.7); tickCreatures(1 / 60, t); }
  const boxes = e.mesh.children.filter(c => c.isMesh && c.geometry && c.geometry.type === 'BoxGeometry').length; const persons = [...PEOPLE_RIGS].filter(r => r.e === e).length;
  e.mesh.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(w ? w.mesh : e.mesh);
  return { name: e.name, dragon: e.dragon, wolf: !!w, isDragon: !!(w && w.k && w.k.dragon), linked: w && w.e === e, inRigs: WOLF_RIGS.has(w), boxes, persons, long: +(bb.max.z - bb.min.z).toFixed(1), hpBar: !!(e.limbs.hpBg && e.limbs.hpBg.parent === e.mesh) }; });
check('in a lair cavern the master is the skinned dragon (no box wings, no person underneath), its health bar kept', !cave.none && cave.dragon && cave.wolf && cave.isDragon && cave.linked && cave.inRigs && cave.boxes === 0 && cave.persons === 0 && cave.hpBar, cave);
check('the wyrm is dragon-sized in both places (several units nose to tail)', world.long > 4 && cave.long > 4, { world: world.long, cave: cave.long });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
