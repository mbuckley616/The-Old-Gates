// The Mark's town house inside on the new look (Session 2212; card F9, Michael's A on DECISION #1518: as drawn, for all 68 town houses).
// On ?look=new a Markish home on a tight lot stands as the kit's town house (lot.kit.kind 'marktown', S2003); inside it is
// PKIT.mk.townroom (rooms.js's markTownRoom, Session 2188) in that house's own shell and options, at its true size, not scaled: the stue
// round the fire, the 13-riser stair up a side wall to the landing, and the loft with the bed. In the first Markish places that have
// them, three homes (the shallowest, one with a stack, one without): the kit's room builds as the prototype's, the same twice; every
// town house there is the room inside; the room is the ground floor's inside, walled all round; you arrive clear, outside the door's
// reach; the walks to the stair's foot and the fire are clear and on the floor; you climb the stair to the loft on its treads, nothing
// in the way, and walk off the landing to the bed's side; the bed is the resident's and at night the resident lies in it; the home's
// chest has a side clear; a bought house's hatch is clear; a Mages' cold hearth is dark until its task is done.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
// the prototype's counts (rooms.check.mjs, Session 2188: 2,600 to 3,288 triangles in 14 meshes over 36 sizes)
const PROTO = { min: 2500, max: 3400, draws: 14 };
const marks = () => { anchoredPlaces(); return [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'mark').flatMap(c => c.sites).filter(s => ['port', 'city', 'town'].includes(s.kind)).map(s => s.id); };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const K = await page.evaluate(() => { const hash = b => { let h = 0; b.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const out = {}; for (const o of [{ w: 4.2, d: 3.4 }, { w: 5.4, d: 5 }, { w: 6.6, d: 7, chimney: true }, { w: 4.2, d: 7, chimney: true, side: -1 }]) { const A = PKIT.mk.townroom(o, PKIT.stream('a')), B = PKIT.mk.townroom(o, PKIT.stream('a'));
    out[`${o.w}x${o.d}${o.chimney ? ' stack' : ''}`] = { tris: A.tris, draws: A.draws, same: hash(A.group) === hash(B.group) }; [A, B].forEach(T => T.group.traverse(m => { if (m.isMesh) m.geometry.dispose(); })); }
  return out; });
check(`the kit's room builds as the prototype's (${Object.entries(K).map(([k, v]) => `${k}: ${v.tris.toLocaleString()} in ${v.draws}`).join('; ')}), the same twice`, Object.values(K).every(v => v.tris >= PROTO.min && v.tris <= PROTO.max && v.draws <= PROTO.draws && v.same), K);

// the first Markish places with town houses, until there are three or more
const ids = await page.evaluate(marks); let homes = [], tid = null;
for (const id of ids.slice(0, 4)) { if (!(await g.settle(id))) continue;
  const hs = await page.evaluate(id => WORLD.settle.get(id).houses.filter(h => h.siteId === id && h.type === 'home' && !h.shuttered && h.kit && h.kit.kind === 'marktown').map(h => ({ id: h.id, site: id, kit: kitMarkTownRoom(h), w: h.kit.o.w, d: h.kit.o.d, chimney: !!h.kit.o.chimney })), id);
  homes.push(...hs); if (hs.length >= 3) { tid = id; break; } }
check(`the Mark's town houses are their room inside (${homes.filter(h => h.kit).length} of ${homes.length}, ${[...new Set(homes.map(h => h.site))].join(', ')})`, homes.length >= 3 && homes.every(h => h.kit), homes.filter(h => !h.kit));
const shallow = [...homes].sort((a, b) => a.d - b.d)[0], picks = [shallow, homes.find(h => h !== shallow && h.chimney), homes.find(h => h !== shallow && !h.chimney)].filter(Boolean);
check(`three homes to walk (${picks.map(h => `${h.w} by ${h.d} m${h.chimney ? ', a stack' : ''}`).join('; ')})`, picks.length >= 2, picks);

for (const H of picks) { const tag = `${H.w}x${H.d}${H.chimney ? ' stack' : ''}`; console.log(`  -- ${H.id}: ${tag}`);
  await page.evaluate(([sid, id]) => { forceTime(12); const h = WORLD.settle.get(sid).houses.find(x => x.id === id); px = h.exitX; pz = h.exitZ; goToInterior(h); }, [H.site, H.id]);
  for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  await g.frames(2);
  const r = await page.evaluate(() => {
    const h = currentHouse, T = h._markTown, W = h._roomW, D = h._roomD, X = T.inner.x1, Z = T.inner.z1, FY = T.floors[0], rx = x => x + X, rz = z => z + Z, F1 = T.floors[1] - FY; interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0; const inNpc = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
    let day = 0; interiorScene.traverse(o => { if (o.isLight && o.userData.daylight) { day++; return; } if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible && !inNpc(o)) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; if (!o.isSkinnedMesh && !o.userData.daylight) meshes.push(o); } });
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dz, far) => { O.set(x, y, z); Dv.set(dx, 0, dz).normalize(); rc.set(O, Dv); rc.far = far; return !!rc.intersectObjects(meshes, false)[0]; };
    // walled all round on the ground floor: every half metre along each wall at 0.6 and 2 m, a ray from the middle meets something, but at the open door
    const open = []; for (const y of [.6, 2.0]) { for (let x = .3; x < W - .2; x += .5) { if (!(Math.abs(x - rx(T.door.x)) < T.door.w / 2 + .1 && y < T.door.h) && !hit(x, y, D / 2, 0, 1, D)) open.push(['S', x, y]); if (!hit(x, y, D / 2, 0, -1, D)) open.push(['N', x, y]); }
      for (let z = .3; z < D - .2; z += .5) { if (!hit(W / 2, y, z, 1, 0, W)) open.push(['E', z, y]); if (!hit(W / 2, y, z, -1, 0, W)) open.push(['W', z, y]); } }
    const ax = intArriveX(h), az = intArrivalZ(h), exitZ = D - h._exitD, arrive = { x: +ax.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(ax, az, .3, 0), exits: az > exitZ && Math.abs(ax - intDoorX(h)) < h._exitW };
    // the walks downstairs, every 0.1 m: nothing within 0.25 m, the floor underfoot (the last 0.35 m before the door is the room's edge)
    const blocked = [], off = []; for (const p of T.paths.filter(p => !p.fl)) for (let i = 0; i + 1 < p.pts.length; i++) { const [a, b] = [p.pts[i], p.pts[i + 1]], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .1));
      for (let k = 0; k <= n; k++) { const x = rx(a[0] + (b[0] - a[0]) * k / n), z = rz(a[1] + (b[1] - a[1]) * k / n); if (z > D - .35) continue; if (intSolidAt(x, z, .25, 0)) blocked.push([+x.toFixed(2), +z.toFixed(2)]); if (Math.abs(footholdY(x, z, 0, 0)) > .02) off.push([+x.toFixed(2), +z.toFixed(2)]); } }
    // the climb: from the stair's foot up its middle to the landing, 0.04 m a step, each rise no more than STEP_UP, nothing in the way
    // (the body 0.25 m), the head under the ceiling; then off the landing to the bed's side on the loft's floor
    const st = T.stair, sx = rx((st.x0 + st.x1) / 2); let y = 0, maxRise = 0; const climbHit = [];
    for (let z = rz(st.z1 + .45); z >= rz(T.inner.z0 + .3); z -= .04) { const y2 = footholdY(sx, z, y, 0); maxRise = Math.max(maxRise, y2 - y); y = y2; if (intSolidAt(sx, z, .3, y)) climbHit.push([+z.toFixed(2), +y.toFixed(2)]); if (headCeil(sx, z, y) < y + 1.6) climbHit.push(['head', +z.toFixed(2), +y.toFixed(2)]); }
    const under = intSolidAt(sx, rz(st.landing + .3), .3, 0);
    const top = +y.toFixed(3), up = [], upOff = []; for (const p of T.paths.filter(p => p.fl)) for (let i = 0; i + 1 < p.pts.length; i++) { const [a, b] = [p.pts[i], p.pts[i + 1]], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .1));
      for (let k = 0; k <= n; k++) { const x = rx(a[0] + (b[0] - a[0]) * k / n), z = rz(a[1] + (b[1] - a[1]) * k / n); if (z > D - .3) continue; if (intSolidAt(x, z, .2, F1)) up.push([+x.toFixed(2), +z.toFixed(2)]); if (Math.abs(footholdY(x, z, F1, 0) - F1) > .02) upOff.push([+x.toFixed(2), +z.toFixed(2)]); } }
    // the well: over it the loft's floor is open, and its rail stops you walking in from the loft
    const wl = T.well, wx = rx((wl.x0 + wl.x1) / 2), wz = rz((wl.z0 + wl.z1) / 2), well = { open: footholdY(wx, wz, F1, 0) < F1 - .3, railed: intSolidAt(wx, wz, .05, F1) || intSolidAt(rx(st.x0 > -X + .01 ? st.x0 - .03 : st.x1 + .03), wz, .05, F1) };
    const stack = T.chimney ? intSolidAt(rx((T.stack.x0 + T.stack.x1) / 2), rz((T.stack.z0 + T.stack.z1) / 2), .05, 0) && intSolidAt(rx((T.stack.x0 + T.stack.x1) / 2), rz((T.stack.z0 + T.stack.z1) / 2), .05, F1) : null;
    const bed = residentBed(), B = T.bed, inBed = !!bed && bed.x > rx(B.x0) && bed.x < rx(B.x1) && bed.cz > rz(B.z0) && bed.cz < rz(B.z1) && Math.abs(bed.y - F1) < .01;
    const box = INT_BOX, boxSide = box ? [[0, .62], [0, -.62], [.7, 0], [-.7, 0]].filter(([dx, dz]) => { const x = box.x + dx, z = box.z + dz; return x > .3 && x < W - .3 && z > .3 && z < D - .3 && !intSolidAt(x, z, .25, F1) && Math.abs(footholdY(x, z, F1, 0) - F1) < .02; }).length : 0;
    const resident = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), clear: !intSolidAt(intNPCPos.x, intNPCPos.z, .2, 0) } : null;
    const fire = interiorScene.children.find(c => c.userData && c.userData.hearthFire);
    return { W, D, want: [+(h.kit.o.w - .5).toFixed(3), +(h.kit.o.d - .5).toFixed(3)], scale: T.group.scale.x, open, arrive, exitZ: +exitZ.toFixed(2), blocked, off, top, F1: +F1.toFixed(3), maxRise: +maxRise.toFixed(3), climbHit, under, up, upOff, well, stack,
      bed: bed && { x: +bed.x.toFixed(2), cz: +bed.cz.toFixed(2), owner: bed.owner }, inBed, box: !!box, boxSide, resident, day, lights, draws, tris: Math.round(tris), fireOn: !!fire && fire.userData.hearthFire.visible && fire.userData.hearthLight.intensity > 0 };
  });
  check(`[${tag}] the room is the ground floor's inside, ${r.W} by ${r.D} m (${r.want.join(' by ')}), at its true size (scale ${r.scale})`, Math.abs(r.W - r.want[0]) < .01 && Math.abs(r.D - r.want[1]) < .01 && r.scale === 1, r);
  check(`[${tag}] walled all round (${r.open.length} openings at 0.6 or 2 m)`, r.open.length === 0, r.open.slice(0, 8));
  check(`[${tag}] you arrive clear at ${r.arrive.x}, ${r.arrive.z} m, outside the door's reach (from ${r.exitZ} m)`, r.arrive.clear && !r.arrive.exits, r.arrive);
  check(`[${tag}] the walks in to the stair's foot and the fire are clear by 0.25 m (${r.blocked.length} points in something) and on the floor (${r.off.length} off it)${r.stack == null ? '' : '; the stack stands solid through both floors'}`,
    !r.blocked.length && !r.off.length && r.stack !== false, { blocked: r.blocked.slice(0, 5), off: r.off.slice(0, 5), stack: r.stack });
  check(`[${tag}] up the stair to the landing at ${r.top} m (the loft's floor ${r.F1}), no rise over ${r.maxRise} m, nothing in the way (${r.climbHit.length}), and none walks in under its high end; off the landing to the bed's side clear (${r.up.length}) and on the loft's floor (${r.upOff.length} off)`,
    Math.abs(r.top - r.F1) < .02 && r.maxRise <= .4 && !r.climbHit.length && r.under && !r.up.length && !r.upOff.length, { climb: r.climbHit.slice(0, 5), up: r.up.slice(0, 5), upOff: r.upOff.slice(0, 5) });
  check(`[${tag}] the well is open below the loft's floor and railed`, r.well.open && r.well.railed, r.well);
  check(`[${tag}] the bed in the loft is the resident's (${r.bed && r.bed.owner}, at ${r.bed && [r.bed.x, r.bed.cz].join(', ')}); the home's chest has ${r.boxSide} sides clear to open it from`, r.inBed && r.bed.owner === 'home' && r.box && r.boxSide >= 1, r);
  check(`[${tag}] lit by the fire and the lamps (${r.lights} lights), ${r.draws} draws (40 or fewer), ${r.tris.toLocaleString()} triangles; the day in by ${r.day} sky spots`, r.fireOn && r.lights >= 3 && r.lights <= 10 && r.draws <= 40 && r.day >= 3, r);

  const more = await page.evaluate(() => { const h = currentHouse, rebuild = () => { WORLD.buildInteriorFor(h); scene = interiorScene; };
    forceTime(22); rebuild(); const res22 = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), clear: !intSolidAt(intNPCPos.x, intNPCPos.z, .2, 0) } : null;
    forceTime(1); rebuild(); const am = intNPCMesh && intNPCMesh.userData.asleep, b = residentBed(), asleep = !intNPCMesh || (!!am && !!b && Math.abs(am.x - b.x) < .01 && Math.abs(am.z - b.z) < .01);
    forceTime(12); h.ownedByPlayer = true; rebuild(); const hatch = HATCH.active ? { x: +HATCH.x.toFixed(2), z: +HATCH.z.toFixed(2), clear: !intSolidAt(HATCH.x, HATCH.z, .2, 0) && [[0, .6], [0, -.6], [.6, 0], [-.6, 0]].some(([dx, dz]) => !intSolidAt(HATCH.x + dx, HATCH.z + dz, .3, 0)) } : null; h.ownedByPlayer = false;
    const G = worldState.guild || (worldState.guild = {}); G.guild_m = G.guild_m || {}; const was = G.guild_m.active; G.guild_m.active = { kind: 'hearth', done: false, house: h.id, siteId: h.siteId };
    rebuild(); const holder = interiorScene.children.find(c => c.userData && c.userData.hearthFire), cold = !!holder && !holder.userData.hearthFire.visible && holder.userData.hearthLight.intensity === 0;
    G.guild_m.active.done = true; WORLD.tickInterior(1 / 60, performance.now()); const lit = !!holder && holder.userData.hearthFire.visible && holder.userData.hearthLight.intensity > 0;
    G.guild_m.active = was; rebuild(); return { res22, asleep, hatch, cold, lit }; });
  check(`[${tag}] at 22h the resident is in, standing clear by the fire at ${more.res22 && [more.res22.x, more.res22.z].join(', ')}`, !!more.res22 && more.res22.clear, more.res22);
  check(`[${tag}] at night the resident lies in the bed in the loft`, more.asleep, more);
  check(`[${tag}] a bought house's cellar hatch lies at ${more.hatch && [more.hatch.x, more.hatch.z].join(', ')}, clear to stand by`, !!more.hatch && more.hatch.clear, more.hatch);
  check(`[${tag}] a Mages' cold hearth shows no fire and no light, and it catches when its task is done`, more.cold && more.lit, more);
  await page.evaluate(() => { const h = currentHouse; px = intArriveX(h); pz = intArrivalZ(h); jumpY = 0; interact(); });
  await g.frames(30);
  check(`[${tag}] at the arrival spot E does not take you out`, await page.evaluate(() => isInterior()));
  if (process.argv.includes('--shots')) { await page.evaluate(() => { const h = currentHouse; try { closeDialog(); } catch (e) {} VM_SCENE.visible = false; px = intDoorX(h); pz = h._roomD - .45; jumpY = 0; yaw = 0; pitch = -.05; });
    await g.frames(6); const f = path.join(here, `../docs/prototypes/kit-marktown-${H.chimney ? 'stack' : 'flue'}-${H.d}.jpg`); await page.screenshot({ path: f, type: 'jpeg', quality: 82 }); console.log(`  (picture: ${f})`); }
  await page.evaluate(() => exitInterior());
  for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  await page.waitForTimeout(1500);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
