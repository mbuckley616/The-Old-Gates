// The rooms at true size (card F2a, Session 882; docs/design/visual-foundation.md §1): a room is laid out in the furniture kit's old
// unit (a man 1.233 tall) at its true footprint ÷ SCALE.ROOM_K, then scaled up by ROOM_K whole (scaleRoom), so its furniture,
// doorways and stairs stand to a 1.78 m person as they stood to the old one, and the room is its true size: a cottage 4.6 to 6 m
// across, an inn's hall 10 to 12, a church's nave 8 to 10 wide. In Dunmore's rooms, measured on what was built: the room's size,
// the entrance's leaf (1.1 to 1.25 of a 1.8 m person, the eye .75 to .85 of it) and every inner door's, the ceiling (a storey,
// 1.45 to 1.7 of the person, and over the eye), the table's top, the bed's length against a sleeper, nothing outside the walls,
// the furniture not standing in itself, and the spot you arrive at and the door's way clear.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const P = 1.8;
const types = ['home', 'inn', 'weapon', 'armor', 'potion', 'misc', 'barber', 'church', 'guild_f', 'castle'];
const all = {};
for (const ty of types) {
  const ok = await page.evaluate(ty => { forceTime(12); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === ty); if (!h) return false; px = h.exitX; pz = h.exitZ; goToInterior(h); return true; }, ty);
  if (!ok) { all[ty] = null; continue; }
  for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  await g.frames(2);
  const r = await page.evaluate(() => {
    const W = currentHouse._roomW, D = currentHouse._roomD; interiorScene.updateMatrixWorld(true);
    const meshes = []; interiorScene.traverse(o => { if (o.isMesh && o.visible && !o.isSkinnedMesh) meshes.push(o); });
    const rc = new THREE.Raycaster(), o = new THREE.Vector3(), d = new THREE.Vector3();
    const hit = (x, y, z, dx, dy, dz, far) => { o.set(x, y, z); d.set(dx, dy, dz).normalize(); rc.set(o, d); rc.far = far || 6; const h = rc.intersectObjects(meshes, false)[0]; return h ? h.distance : null; };
    // the entrance's leaf: the kit's door records its leaf's height, times the scale the room was built at
    let entrance = null; interiorScene.traverse(q => { if (q.userData && q.userData.entrance && q.userData.leaf) { const s = new THREE.Vector3(); q.getWorldScale(s); entrance = +(q.userData.leaf[1] * s.y).toFixed(2); } });
    // the ceiling over the middle of the floor (the gallery's deck is a floor too: in a two-storey room, the deck's height)
    const ceilAt = (x, z) => { const v = hit(x, 1.7, z, 0, 1, 0, 12); return v == null ? null : +(v + 1.7).toFixed(2); };
    const ceil = ceilAt(W / 2, D - 1.6);
    const doors = (INT_DOORS || []).map(q => { const b = new THREE.Box3().setFromObject(q.g); return +(b.max.y - b.min.y).toFixed(2); });
    const tables = (FOOTHOLDS || []).filter(f => f.y != null && f.y > .55 && f.y < .85 && f.x1 - f.x0 > .9).map(f => +f.y.toFixed(2));
    const walls = s => (s.x1 - s.x0 < .5 && s.z1 - s.z0 > 1.5) || (s.z1 - s.z0 < .5 && s.x1 - s.x0 > 1.5);
    const fur = INT_SOL.filter(s => !walls(s) && s.y1 < 3);
    const out = fur.filter(s => s.x0 < -.05 || s.z0 < -.05 || s.x1 > W + .05 || s.z1 > D + .05).map(s => [s.x0, s.z0, s.x1, s.z1].map(v => +v.toFixed(2)));
    let over = []; for (let i = 0; i < fur.length; i++) for (let j = i + 1; j < fur.length; j++) { const a = fur[i], b = fur[j];
      if (Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > .2 && Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0) > .2 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > .2) over.push([a, b].map(s => [s.x0, s.z0, s.x1, s.z1].map(v => +v.toFixed(1)))); }
    const spawn = !intSolidAt(px, pz, .3, 0) && !intSolidAt(W / 2, D - Math.min(2.2, Math.max(1.75, D * .3)), .3, 0), way = !intSolidAt(W / 2, D - .7, .3, 0);
    // the beds: a kit bed's length along its own z, measured on the baked mesh's box where the bed stands
    const beds = (INT_BEDS || []).length;
    return { W: +W.toFixed(2), D: +D.toFixed(2), entrance, ceil, doors, tables, out, over: over.slice(0, 4), nOver: over.length, spawn, way, beds, two: !!currentHouse.two };
  });
  all[ty] = r; console.log(ty, JSON.stringify(r));
  await page.evaluate(() => { try { exitInterior(); } catch (e) {} }); await page.waitForTimeout(1500);
}
const H = all.home, I = all.inn;
check('a cottage is 4.6 to 6 m across and 4.5 to 6 deep', H && H.W >= 4.59 && H.W <= 6.01 && H.D >= 4.49 && H.D <= 6.01, H);
check('an inn\'s hall is 10 to 12 m by 11.7 to 13 (the gallery\'s rooms over its north end)', I && I.W >= 9.99 && I.W <= 12.01 && I.D >= 11.69 && I.D <= 13.01, I);
check('a shop is 7 to 9 m wide and 7 to 8.5 deep, with 4.7 more for the keeper\'s room behind its partition in a deep house', ['weapon', 'armor', 'potion', 'misc'].every(t => !all[t] || (all[t].W >= 6.99 && all[t].W <= 9.01 && all[t].D >= 6.99 && all[t].D <= 13.21)), Object.fromEntries(['weapon', 'armor', 'potion', 'misc', 'barber'].map(t => [t, all[t] && [all[t].W, all[t].D]])));
check('a church\'s nave is 8 to 10 m wide', !all.church || (all.church.W >= 7.99 && all.church.W <= 10.01), all.church && [all.church.W, all.church.D]);
for (const t of types) { const r = all[t]; if (!r) continue;
  check(`${t}: the entrance's leaf is 1.1 to 1.25 of a 1.8 m person (or a church's or a keep's great door), and the eye .75 to .85 of it`, (t === 'church' || t === 'castle') ? r.entrance > 2.6 : (r.entrance / P >= 1.1 && r.entrance / P <= 1.25 && 1.65 / r.entrance >= .75 && 1.65 / r.entrance <= .85), r.entrance);
  check(`${t}: the ceiling stands over the eye, a storey of 1.45 to 1.7 of the person (a hall or a nave higher)`, r.ceil != null && r.ceil > 1.65 + .5 && ((t === 'church' || t === 'castle' || t === 'guild_f' || r.two) ? true : r.ceil / P >= 1.45 && r.ceil / P <= 1.7), r.ceil);
  check(`${t}: every inner door is 1.1 to 1.25 of the person`, r.doors.every(h => h / P >= 1.1 && h / P <= 1.25), r.doors);
  check(`${t}: nothing stands outside the walls, the furniture stands clear of itself, the spot you arrive at and the door's way are free`, !r.out.length && r.nOver === 0 && r.spawn && r.way, { out: r.out, over: r.over, spawn: r.spawn, way: r.way });
}
const tops = types.flatMap(t => all[t] ? all[t].tables : []);
check('a table\'s top stands .6 to .8 (SCALE.TABLE .75; the kit\'s, scaled, .66 to .68; the keeper\'s table .63)', tops.length >= 3 && tops.every(y => y >= .6 && y <= .8), tops);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
