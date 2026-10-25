// The Gatelands cottage inside a village home on the new look (Session 1381; card F9, Michael's A on DECISION #303: the rooms inside
// the street's own shell, the hearth-lobby plan; laid out by bays in Session 1380). On ?look=new a Gatelands village home stands as
// the kit's cottage of 2, 3 or 4 bays (S1063), and inside it is PKIT.gl.cottage on the same bays, at its true size, not scaled. In
// the village nearest Dunmore, one home is built as each of the three: the room is the cottage's inside (2.4 m a bay less the walls,
// by 4.2 m), walled all round; you arrive clear (in the lobby on 3 and 4 bays) and outside the door's reach; the way from there to the
// hearth is clear; the box bed is the resident's, and at night the resident lies in it; the home's chest stands clear to open; a
// bought house's cellar hatch is clear; the fire lights the room, and a Mages' cold hearth stays dark until its task is done; E at
// the arrival spot keeps you in and at the door takes you out; and a picture from the door.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const pick = () => { const nat = t => nationKeyOf(...cellOf(t.x, t.z)), d = siteAnywhere('dunmore');
  return allSites().filter(t => nat(t) === 'gatelands' && t.kind === 'village' && t.pad > 0).sort((a, b) => Math.hypot(a.x - d.x, a.z - d.z) - Math.hypot(b.x - d.x, b.z - d.z)).map(t => t.id).slice(0, 10); };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const vid = (await page.evaluate(pick))[0];
check(`${vid} stands on the new look`, await g.settle(vid));
const homes = await page.evaluate(id => { const S = WORLD.settle.get(id); return S.houses.filter(h => h.siteId === id && h.type === 'home' && !h.shuttered && h.kit && h.kit.kind === 'cottage').map(h => ({ id: h.id, bays: h.kit.bays })); }, vid);
check(`its homes are kit cottages (${homes.map(h => h.bays).join(', ')} bays)`, homes.length >= 1, homes);

// a width the village has is walked in its own home; one it lacks is walked in the first home, its kit set to that many bays (the room
// is made from house.kit alone, as the taproom's two bays are)
for (const n of [4, 3, 2]) { const own = homes.find(h => h.bays === n), hid = (own || homes[0]).id; console.log(`  -- a cottage on ${n} bays (${hid}${own ? '' : ', its kit set to ' + n})`);
  await page.evaluate(([v, id, n]) => { forceTime(12); const H = WORLD.settle.get(v).houses.find(x => x.id === id); H._kitWas = H.kit; H.kit = { ...H.kit, bays: n }; px = H.exitX; pz = H.exitZ; goToInterior(H); }, [vid, hid, n]);
  for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  await g.frames(2);
  const r = await page.evaluate(n => {
    const h = currentHouse, T = h._cottage, W = h._roomW, D = h._roomD, X = T.inner.x1, Z = T.inner.z1, rx = x => x + X, rz = z => z + Z; interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0; const inNpc = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible && !inNpc(o)) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; if (!o.isSkinnedMesh && !o.userData.daylight) meshes.push(o); } });
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dy, dz, far = 12) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; const q = rc.intersectObjects(meshes, false)[0]; return q ? +q.distance.toFixed(3) : null; };
    // walled all round: every half metre along each wall, at 0.6 m and 2.2 m, a ray from the room's long axis meets something
    let open = []; for (const y of [.6, 2.2]) { for (let x = .4; x < W - .3; x += .5) { if (hit(x, y, D / 2, 0, 0, 1, D) == null) open.push(['S', +x.toFixed(1), y]); if (hit(x, y, D / 2, 0, 0, -1, D) == null) open.push(['N', +x.toFixed(1), y]); }
      for (let z = .4; z < D - .3; z += .5) { if (hit(W / 2, y, z, 1, 0, 0, W) == null) open.push(['E', +z.toFixed(1), y]); if (hit(W / 2, y, z, -1, 0, 0, W) == null) open.push(['W', +z.toFixed(1), y]); } }
    const floor = hit(rx(T.path.at(-1)[0]), 1, rz(T.path.at(-1)[1]), 0, -1, 0, 3);
    // you arrive clear, outside the door's reach, and walk from there to the hearthstone (the way round the jamb wall) with nothing in it
    const ax = intArriveX(h), az = intArrivalZ(h), exitZ = D - h._exitD, arrive = { x: +ax.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(ax, az, .3, 0), exits: az > exitZ && Math.abs(ax - intDoorX(h)) < h._exitW };
    const way = [[ax, az], ...T.path.slice(1).map(([x, z]) => [rx(x), rz(z)])], blocked = [];
    for (let s = 0; s + 1 < way.length; s++) for (let k = 0; k <= 20; k++) { const x = way[s][0] + (way[s + 1][0] - way[s][0]) * k / 20, z = way[s][1] + (way[s + 1][1] - way[s][1]) * k / 20; if (intSolidAt(x, z, .25, 0)) blocked.push([+x.toFixed(2), +z.toFixed(2)]); }
    // the doors hung in the inner walls; the bed the resident's, in the box bed; the chest with a side clear to open it from
    const doors = INT_DOORS.length, bed = residentBed(), B = T.bed, inBed = !!bed && bed.x > rx(B.x0) && bed.x < rx(B.x1) && bed.cz > rz(B.z0) && bed.cz < rz(B.z1);
    const box = INT_BOX, boxSide = box ? [[0, .62], [0, -.62], [.7, 0], [-.7, 0]].filter(([dx, dz]) => { const x = box.x + dx, z = box.z + dz; return x > .3 && x < W - .3 && z > .3 && z < D - .3 && !intSolidAt(x, z, .25, 0); }).length : 0;
    const resident = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), clear: !intSolidAt(intNPCPos.x, intNPCPos.z, .2, 0) } : null;
    const fire = interiorScene.children.find(c => c.userData && c.userData.hearthFire);
    return { W, D, n: T.bays, open, floor, arrive, exitZ: +exitZ.toFixed(2), blocked, doors, bed: bed && { x: +bed.x.toFixed(2), cz: +bed.cz.toFixed(2), owner: bed.owner }, inBed, box: !!box, boxSide, resident, lights, draws, tris: Math.round(tris), fireOn: !!fire && fire.userData.hearthFire.visible && fire.userData.hearthLight.intensity > 0, scale: T.group.scale.x, kit: kitCottage(h) };
  }, n);
  const w = +(2.4 * n - 1.2).toFixed(2);
  check(`the room is the ${n}-bay cottage's inside, ${r.W} by ${r.D} m (${w} by 4.2), at its true size (scale ${r.scale})`, r.kit && r.n === n && Math.abs(r.W - w) < .01 && Math.abs(r.D - 4.2) < .01 && r.scale === 1, r);
  check(`walled all round: no opening along the walls at 0.6 or 2.2 m (${r.open.length}), the flags under the hearth`, r.open.length === 0 && r.floor != null && Math.abs(r.floor - 1) < .1, { open: r.open.slice(0, 6), floor: r.floor });
  check(`you arrive clear at ${r.arrive.x}, ${r.arrive.z} m, outside the door's reach (from ${r.exitZ} m), and the way to the hearth is clear (${r.blocked.length} points in something)`, r.arrive.clear && !r.arrive.exits && r.blocked.length === 0, { arrive: r.arrive, blocked: r.blocked.slice(0, 6) });
  check(`${r.doors} doors hung in the inner walls (${{ 4: 2, 3: 1, 2: 0 }[n]} on ${n} bays)`, r.doors === { 4: 2, 3: 1, 2: 0 }[n]);
  check(`the box bed is the resident's (${r.bed && r.bed.owner}, at ${r.bed && [r.bed.x, r.bed.cz].join(', ')}), the chest has ${r.boxSide} sides clear to open it from`, r.inBed && r.bed.owner === 'home' && r.box && r.boxSide >= 1, r);
  check(`the room is lit (${r.lights} lights, the fire burning) and draws ${r.draws} meshes (50 or fewer), ${r.tris.toLocaleString()} triangles`, r.lights >= 2 && r.fireOn && r.draws <= 50, r);
  check(`the resident stands clear in the kitchen at ${r.resident && [r.resident.x, r.resident.z].join(', ')}`, !r.resident || r.resident.clear, r.resident);

  // at night the resident lies in the box bed; a bought house has its cellar hatch, clear; a Mages' cold hearth is dark until done
  const more = await page.evaluate(id => { const h = currentHouse, rebuild = () => { WORLD.buildInteriorFor(h); scene = interiorScene; };
    forceTime(1); rebuild(); const am = intNPCMesh && intNPCMesh.userData.asleep, b = residentBed(), asleep = !!am && !!b && Math.abs(am.x - b.x) < .01 && Math.abs(am.z - b.z) < .01;
    forceTime(12); h.ownedByPlayer = true; rebuild(); const hatch = HATCH.active ? { x: +HATCH.x.toFixed(2), z: +HATCH.z.toFixed(2), clear: !intSolidAt(HATCH.x, HATCH.z, .2, 0) && [[0, .6], [0, -.6], [.6, 0], [-.6, 0]].some(([dx, dz]) => !intSolidAt(HATCH.x + dx, HATCH.z + dz, .3, 0)) } : null; h.ownedByPlayer = false;
    const G = worldState.guild || (worldState.guild = {}); G.guild_m = G.guild_m || {}; const was = G.guild_m.active; G.guild_m.active = { kind: 'hearth', done: false, house: h.id, siteId: h.siteId };
    rebuild(); const holder = interiorScene.children.find(c => c.userData && c.userData.hearthFire), cold = !!holder && !holder.userData.hearthFire.visible && holder.userData.hearthLight.intensity === 0;
    G.guild_m.active.done = true; WORLD.tickInterior(1 / 60, performance.now()); const lit = !!holder && holder.userData.hearthFire.visible && holder.userData.hearthLight.intensity > 0;
    G.guild_m.active = was; rebuild(); return { asleep, hatch, cold, lit }; }, hid);
  check(`at night the resident lies in the box bed`, more.asleep, more);
  check(`a bought house's cellar hatch lies in the flags at ${more.hatch && [more.hatch.x, more.hatch.z].join(', ')}, clear to stand by`, !!more.hatch && more.hatch.clear, more.hatch);
  check(`a Mages' cold hearth shows no fire and no light, and catches when its task is done`, more.cold && more.lit, more);

  // leaving: at the arrival spot E does not take you out; at the door it does; a picture from the arrival spot toward the hearth
  await page.evaluate(() => { const h = currentHouse; px = intArriveX(h); pz = intArrivalZ(h); jumpY = 0; interact(); });
  await g.frames(30);
  check('at the arrival spot E does not take you out', await page.evaluate(() => isInterior()));
  await page.evaluate(() => { const h = currentHouse, T = h._cottage; closeDialog(); VM_SCENE.visible = false; px = intArriveX(h); pz = intArrivalZ(h); jumpY = 0;
    const [tx, tz] = T.path.at(-1), x = tx + T.inner.x1, z = tz + T.inner.z1; yaw = Math.atan2(-(x - px), -(z - pz)); pitch = -.08; });
  await g.frames(6);
  await page.screenshot({ path: path.join(here, `../docs/prototypes/kit-cottage${n}-ingame.png`) });
  console.log(`  (picture: docs/prototypes/kit-cottage${n}-ingame.png)`);
  await page.evaluate(() => { const h = currentHouse; px = intDoorX(h); pz = h._roomD - .32; jumpY = 0; yaw = Math.PI; interact(); });
  for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  check('at the door E takes you out', !(await page.evaluate(() => isInterior())));
  await page.evaluate(([v, id]) => { const H = WORLD.settle.get(v).houses.find(x => x.id === id); H.kit = H._kitWas; delete H._kitWas; }, [vid, hid]);
}
check('no errors on the new look', g.errs.length === 0, g.errs);
await g.close();
