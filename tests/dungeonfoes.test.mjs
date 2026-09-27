// The dungeon's foes on the people's body (Session 196, H.4 and playtest s162 item 7): skeletons, goblins and kobold
// thieves in a dungeon are people like their open-world kin, walked by their own positions; the Shieldbearer keeps the box.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const seen = {};
for (const [theme, seed] of [['goblin', 5], ['undead', 7], ['goblin', 12], ['ruins', 11]]) { await enterDungeon(page, { theme, seed });
  const r = await page.evaluate(() => ENEMIES.map(e => ({ n: e.baseType || e.name, person: !!(e.limbs && e.limbs.person), linked: !!(e.limbs && e.limbs.person && e.limbs.person.e === e), inRigs: !!(e.limbs && e.limbs.person && PEOPLE_RIGS.has(e.limbs.person)) })));
  for (const e of r) { const s = seen[e.n] || (seen[e.n] = { n: 0, person: 0, linked: 0 }); s.n++; if (e.person) s.person++; if (e.linked && e.inRigs) s.linked++; } }
const kinds = ['Skeleton', 'Goblin', 'Kobold Thief', 'Shieldbearer'].filter(k => seen[k]);
check('skeletons, goblins and kobold thieves in dungeons are people, each walked by its own enemy', kinds.length >= 2 && kinds.every(k => seen[k].person === seen[k].n && seen[k].linked === seen[k].n), seen);
// the Shieldbearer (Session 199): a person with the shield on the left shoulder bone, the guard held by tickPeople
let sb = { none: true };
for (const seed of [5, 12, 17, 23]) { await page.evaluate(() => { level = 5; }); await enterDungeon(page, { theme: 'goblin', seed });
sb = await page.evaluate(() => { let e = ENEMIES.find(x => x.name === 'Shieldbearer' || x.baseType === 'Shieldbearer'); if (!e) return { none: true }; const L = e.limbs, r = L.person; if (!r) return { person: false };
  e.mesh.visible = true; tickPeople(1 / 60, 7e5); return { person: true, onBone: L.shieldProp && L.shieldProp.parent === r.B.shL, up: +r.B.shL.rotation.x.toFixed(2), guard: e.shieldUp }; });
if (!sb.none) break; }
check('the Shieldbearer is a person with the shield on its left shoulder, held up across the body (Session 199)', !sb.none && (sb.person && sb.onBone && sb.up === -1.15 && sb.guard), sb);
// one of them walks: move it and tick; the stride follows the ground covered
const walk = await page.evaluate(() => { const e = ENEMIES.find(x => x.limbs && x.limbs.person && !x.dead); if (!e) return { none: true }; const r = e.limbs.person; e.mesh.visible = true; let t = 5e5;
  for (let i = 0; i < 120; i++) { e.x += 1.2 / 60; e.mesh.position.x = e.x; tickPeople(1 / 60, t += 16.7); } return { name: e.name, walk: +r.w.walk.toFixed(2), run: +r.w.run.toFixed(2) }; });
check('a dungeon foe walks by the ground it covers', walk.none || walk.walk + walk.run > .9, walk);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
