// The F2a picture pair (Session 879): Dunmore's square at noon and an inn's room, from the eye, the same spot and heading every
// time, so a before and an after can be laid side by side. `node tests/f2ashots.mjs <tag>` writes docs/prototypes/f2a/<tag>-*.jpg.
// Not a suite: run.mjs takes *.test.mjs only.
import { boot } from './lib/game.mjs';
import path from 'path';
import fs from 'fs';
const tag = process.argv[2] || 'shot';
const out = path.resolve('docs/prototypes/f2a'); fs.mkdirSync(out, { recursive: true });
const g = await boot({ look: process.env.OG_LOOK || '' }); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
await page.evaluate(() => { forceTime(12); thirdPerson = false; });
await g.spin(null, 60);
const where = await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); const S = WORLD.settle.get('dunmore');
  // the square: stand 9 m south of the town's middle, look north, a little down
  px = t.x; pz = t.z + 9; yaw = 0; pitch = -.04; return { x: t.x, z: t.z, houses: S.houses.length }; });
await g.spin(null, 30); await g.frames(4);
await page.screenshot({ path: path.join(out, tag + '-dunmore-noon.jpg'), quality: 82 });
const room = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'inn') || S.houses[0];
  px = h.exitX; pz = h.exitZ; goToInterior(h); return h.type; });
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
await g.spin(null, 10); await g.frames(4);
// inside: from the door, look into the room
await page.evaluate(() => { pitch = -.05; });
await g.frames(4);
await page.screenshot({ path: path.join(out, tag + '-inn-room.jpg'), quality: 82 });
console.log(JSON.stringify({ where, room }));
await g.close();
