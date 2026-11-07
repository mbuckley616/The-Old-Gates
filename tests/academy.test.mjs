// academy (Session 1959, card F6; Michael's A on #296, "round, galleries, pointed white caps, as drawn"): on the new look Aurenne's
// capital (the first Aurennais city in grid order, guestChapelHouse's) keeps a plot beside a street through the heart for the Mages'
// academy, pieces.js's of Session 836 (PKIT.au.academy), its arcade to the street. The suite builds the kit alone at its three sizes,
// then stands at the capital and reads its plot, its solids, its plinth, its neighbours and its far copy. --shots writes the pictures.
import fs from 'node:fs';
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const SHOTS = process.argv.includes('--shots');
await page.evaluate(s => REN.setSize(s ? 1280 : 320, s ? 720 : 180, false), SHOTS);
const kit = await page.evaluate(() => [[30, 3], [26, 3], [24, 2]].map(([w, t]) => { const A = PKIT.au.academy({ w, towers: t }, PKIT.stream('test')), B = PKIT.au.academyBox({ w, towers: t }), b = new THREE.Box3().setFromObject(A.group);
  return { w, t, tris: A.tris, draws: A.draws, tops: A.towerTops, inBox: b.min.x >= B.x0 - .01 && b.max.x <= B.x1 + .01 && b.min.z >= B.z0 - .01 && b.max.z <= B.z1 + .01, foot: +b.min.y.toFixed(3) }; }));
console.log(JSON.stringify(kit));
check(`the kit's academy at 30, 26 and 24 m (${kit.map(k => `${k.tris} triangles in ${k.draws} draws`).join(', ')}), every tower over the hall, the observatory's the tallest`,
  kit.every(k => k.tris < 20000 && k.draws <= 8 && k.tops.length === k.t && Math.min(...k.tops) > 25 && Math.max(...k.tops) > 38 && k.inBox && k.foot === 0), kit);
const cap = await page.evaluate(() => { const c = guestChapelHouse(); return c && { id: c.id, name: c.name }; });
check(`Aurenne's capital is ${cap && cap.name} (${cap && cap.id})`, !!cap, cap);
check('it stands on the new look', await g.settle(cap.id));
const a = await page.evaluate(id => { const S = WORLD.settle.get(id), A = S.academy; if (!A) return { none: true };
  const c = Math.cos(A.ry), s = Math.sin(A.ry), at = (u, v) => [A.x + u * c + v * s, A.z - u * s + v * c];
  const hall = [[0, 0], [-A.W / 2 + .5, -A.D / 2 + .5], [A.W / 2 - .5, A.D / 2 - .5]].map(p => solidAt(...at(...p)));
  const towers = A.sols.filter(q => q.rx < 3).length;
  const apron = [-A.W / 3, 0, A.W / 3].map(u => { const p = at(u, A.D / 2 + 1.8); return { solid: solidAt(...p), y: +activeTerrainH(...p).toFixed(2) }; });
  const off = at(0, A.D / 2 + 6), ground = +activeTerrainH(...off).toFixed(2);
  const hs = ZONES.world.houses.filter(h => h.siteId === id), near = hs.filter(h => { const dx = h.doorX - A.x, dz = h.doorZ - A.z, lu = dx * c - dz * s, lv = dx * s + dz * c; return Math.abs(lu) < A.W / 2 + 1 && lv > -A.D / 2 - 4 && lv < A.D / 2 + 3.4; }).map(h => h.name);
  const others = S.sol.filter(q => q.bt !== 'academy' && q.rx && Math.hypot(q.cx - A.cx, q.cz - A.cz) < A.r + Math.hypot(q.rx, q.rz) && (() => { const dx = q.cx - A.x, dz = q.cz - A.z, lu = dx * c - dz * s, lv = dx * s + dz * c; return Math.abs(lu) < A.W / 2 + .2 + q.rx && lv > -A.D / 2 - 3.5 - q.rz && lv < A.D / 2 + 3.4 + q.rz; })()).length;
  const K = S.kitLod, P = CAM.position.clone(), fx = Math.sin(A.ry), fz = Math.cos(A.ry);
  CAM.position.set(A.x + fx * 400, 30, A.z + fz * 400); houseLod(); const far = [K.hi.visible, K.lo.visible];
  CAM.position.set(A.x + fx * 20, 3, A.z + fz * 20); houseLod(); const near2 = [K.hi.visible, K.lo.visible]; CAM.position.copy(P);
  return { W: A.W, towers: A.towers, tops: A.tops, tris: A.tris, y: +A.y.toFixed(2), plat: +A.plat.y.toFixed(2), hall, towerSols: towers, apron, ground, near, others, far, near2, reach: +K.r.toFixed(1), dist: +(Math.hypot(A.cx - S.site.x, A.cz - S.site.z) + A.r).toFixed(1) }; }, cap.id);
console.log(JSON.stringify(a));
check(`${cap.name}'s academy (${a.W} m, ${a.towers} towers to ${a.tops && Math.max(...a.tops)} m, ${a.tris} triangles) is built, solid through its hall`, !a.none && a.hall.every(Boolean), a);
check(`each of its ${a.towers} towers is a solid`, !a.none && a.towerSols === a.towers + 2, a);
check(`its plinth's apron is open to walk on at the plinth's top (${(a.apron || []).map(p => p.y).join(', ')} m; the ground before it ${a.ground})`, !a.none && a.apron.every(p => !p.solid && Math.abs(p.y - a.plat) < .02), a);
check(`no house's door and no other solid stands on its plot (${(a.near || []).join(', ') || 'none'})`, !a.none && a.near.length === 0 && a.others === 0, a);
check(`the town's far copy carries it from 400 m (the kit's reach ${a.reach} m covers its ${a.dist}), the town itself from 20`, !a.none && a.far[0] === false && a.far[1] === true && a.near2[0] === true && a.near2[1] === false && a.reach >= a.dist - .01, a);
if (SHOTS) {
  const shot = async (name, set) => { await page.evaluate(set); await g.frames(4); await page.screenshot({ path: 'docs/prototypes/' + name }); console.log('  (picture: docs/prototypes/' + name + ')'); };
  await page.evaluate(() => { forceTime(10); VM_SCENE.visible = false; });
  await shot('academy-ingame-street.jpg', `{const A=WORLD.settle.get('${cap.id}').academy,fx=Math.sin(A.ry),fz=Math.cos(A.ry),rx=Math.cos(A.ry),rz=-Math.sin(A.ry);px=A.x+fx*20+rx*9;pz=A.z+fz*20+rz*9;yaw=A.ry+.38;pitch=.32;}`);
  await shot('academy-ingame-arcade.jpg', `{const A=WORLD.settle.get('${cap.id}').academy,fx=Math.sin(A.ry),fz=Math.cos(A.ry),rx=Math.cos(A.ry),rz=-Math.sin(A.ry);px=A.x+fx*(A.D/2+2.4)+rx*(A.W/2-3);pz=A.z+fz*(A.D/2+2.4)+rz*(A.W/2-3);yaw=A.ry+Math.PI/2+.25;pitch=.08;}`);
}
await g.close();
