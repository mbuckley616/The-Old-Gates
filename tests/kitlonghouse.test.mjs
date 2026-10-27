// The Mark's longhouse inside a Markish home on the new look (Session 1453; card F9, Michael's A on DECISION #311, as drawn, and on #303:
// the rooms inside the street's own shell; laid out by size in Session 1452). On ?look=new a Markish home stands as the kit's hall
// fitted to its lot (S1286); inside it is PKIT.mk.longhouse in that hall's own shell and options, at its true size, not scaled: the drawn
// plan (the long hearth, the partition and the family quarters) where it fits, else one room with a bench bed, and a hall with a chimney
// round a peis at the stack. In the first Markish town, one home of each plan (the drawn one on a home given the drawn hall's size if
// the town has none): the kit's room builds as the prototype's, the same twice; the room is the hall's inside, walled all round; you
// arrive clear, outside the door's reach; the walk from the door past the fire to the quarters or the bed's side is clear with the
// game's own solids, on the floor; nothing stands in the stack; the bed is the resident's and at night the resident lies in it; the
// home's chest has a side clear to open it from; a bought house's hatch is clear; a Mages' cold hearth is dark until its task is done.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
// the prototype's counts (rooms.check.mjs, Session 1452: 2,364 to 5,744 triangles in 18 meshes or fewer over 76 sizes)
const PROTO = { min: 2300, max: 5800, draws: 18 };
const pickTown = () => { anchoredPlaces(); const S = [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'mark').flatMap(c => c.sites); return (S.find(s => s.kind === 'town') || {}).id; };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const tid = await page.evaluate(pickTown);
check(`a Markish town (${tid}) stands on the new look`, !!tid && await g.settle(tid));
const K = await page.evaluate(() => { const hash = b => { let h = 0; b.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const out = {}; for (const o of [{}, { w: 6.2, d: 7.5 }, { w: 7, d: 10.5, chimney: true }, { w: 5.6, d: 9, chimney: true, roof: 'turf' }]) { const A = PKIT.mk.longhouse(o, PKIT.stream('a')), B = PKIT.mk.longhouse(o, PKIT.stream('a')); out[`${o.w || 7.6}x${o.d || 14}${o.chimney ? ' chimney' : ''}`] = { tris: A.tris, draws: A.draws, plan: A.plan, same: hash(A.group) === hash(B.group) }; }
  return out; });
check(`the kit's room builds as the prototype's (${Object.entries(K).map(([k, v]) => `${k}: ${v.plan}, ${v.tris.toLocaleString()} in ${v.draws}`).join('; ')}), the same twice`, Object.values(K).every(v => v.tris >= PROTO.min && v.tris <= PROTO.max && v.draws <= PROTO.draws && v.same), K);
const homes = await page.evaluate(tid => WORLD.settle.get(tid).houses.filter(h => h.siteId === tid && h.type === 'home' && !h.shuttered && h.kit && h.kit.kind === 'markhall').map(h => { const k = kitLonghouse(h), T = k && PKIT.mk.longhouse(h.kit.o, PKIT.stream('plan'));
  if (T) T.group.traverse(m => { if (m.isMesh) m.geometry.dispose(); }); return { id: h.id, kit: k, plan: T && (T.chimney ? 'peis' : T.plan), w: k && h.kit.o.w, d: k && h.kit.o.d, roof: k && h.kit.o.roof }; }), tid);
const kits = homes.filter(h => h.kit), by = p => kits.filter(h => h.plan === p);
check(`${tid}'s homes standing as the kit's hall are longhouses inside (${kits.length} of ${homes.length}: ${by('parted').length} parted, ${by('one').length} one room, ${by('peis').length} round a peis)`, kits.length === homes.length && kits.length >= 3 && by('one').length && by('peis').length, homes.filter(h => !h.kit));
const picks = [by('parted')[0] || { ...by('one')[1], plan: 'parted', drawn: true }, by('one')[0], by('peis')[0]].filter(h => h && h.id);
check(`one home of each plan to walk (${picks.map(h => `${h.plan}${h.drawn ? ' (given the drawn size)' : ''}, ${h.drawn ? '7.6 by 14' : `${h.w} by ${h.d}`} m${h.roof === 'turf' ? ', turf' : ''}`).join('; ')})`, picks.length === 3, picks);

for (const H of picks) { const tag = H.plan; console.log(`  -- ${H.id}: ${tag}`);
  await page.evaluate(([tid, id, drawn]) => { forceTime(12); const h = WORLD.settle.get(tid).houses.find(x => x.id === id); if (drawn) { h._kitWas = h.kit; h.kit = { ...h.kit, o: { ...h.kit.o, w: 7.6, d: 14, chimney: false } }; } px = h.exitX; pz = h.exitZ; goToInterior(h); }, [tid, H.id, !!H.drawn]);
  for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  await g.frames(2);
  const r = await page.evaluate(() => {
    const h = currentHouse, T = h._longhouse, W = h._roomW, D = h._roomD, X = T.inner.x1, Z = T.inner.z1, rx = x => x + X, rz = z => z + Z; interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0; const inNpc = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
    let day = 0; interiorScene.traverse(o => { if (o.isLight && o.userData.daylight) { day++; return; } if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible && !inNpc(o)) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; if (!o.isSkinnedMesh && !o.userData.daylight) meshes.push(o); } });
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dz, far) => { O.set(x, y, z); Dv.set(dx, 0, dz).normalize(); rc.set(O, Dv); rc.far = far; return !!rc.intersectObjects(meshes, false)[0]; };
    // walled all round: every half metre along each wall at 0.6 and 2 m, a ray from the middle meets something, but at the open front door
    const open = []; for (const y of [.6, 2.0]) { for (let x = .4; x < W - .3; x += .5) { if (!(Math.abs(x - rx(T.door.x)) < T.door.w / 2 + .1 && y < T.door.h) && !hit(x, y, D / 2, 0, 1, D)) open.push(['S', x, y]); if (!hit(x, y, D / 2, 0, -1, D)) open.push(['N', x, y]); }
      for (let z = .4; z < D - .3; z += .5) { if (!hit(W / 2, y, z, 1, 0, W)) open.push(['E', z, y]); if (!hit(W / 2, y, z, -1, 0, W)) open.push(['W', z, y]); } }
    const ax = intArriveX(h), az = intArrivalZ(h), exitZ = D - h._exitD, arrive = { x: +ax.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(ax, az, .3, 0), exits: az > exitZ && Math.abs(ax - intDoorX(h)) < h._exitW };
    // the walk with the doors open (a shut leaf is a solid), every 0.1 m: nothing within 0.25 m, the floor underfoot
    const doorSol = new Set(INT_DOORS.map(d => d.sol)), keep = INT_SOL; INT_SOL = keep.filter(b => !doorSol.has(b));
    const blocked = [], off = []; for (let i = 0; i + 1 < T.path.length; i++) { const [a, b] = [T.path[i], T.path[i + 1]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .1);
      for (let k = 0; k <= n; k++) { const x = rx(a[0] + (b[0] - a[0]) * k / n), z = rz(a[1] + (b[1] - a[1]) * k / n); if (z > D - .35) continue; if (intSolidAt(x, z, .25, 0)) blocked.push([+x.toFixed(2), +z.toFixed(2)]); if (Math.abs(footholdY(x, z, 0, 0)) > .02) off.push([+x.toFixed(2), +z.toFixed(2)]); } }
    INT_SOL = keep;
    // the stack stands: its middle is solid to the roof
    const stack = T.stack ? intSolidAt(rx((T.stack.x0 + T.stack.x1) / 2), rz((T.stack.z0 + T.stack.z1) / 2), .05, 0) && intSolidAt(rx((T.stack.x0 + T.stack.x1) / 2), rz((T.stack.z0 + T.stack.z1) / 2), .05, 2.5) : null;
    const bed = residentBed(), B = T.bed, inBed = !!bed && bed.x > rx(B.x0) && bed.x < rx(B.x1) && bed.cz > rz(B.z0) && bed.cz < rz(B.z1);
    const box = INT_BOX, boxSide = box ? [[0, .62], [0, -.62], [.7, 0], [-.7, 0]].filter(([dx, dz]) => { const x = box.x + dx, z = box.z + dz; return x > .3 && x < W - .3 && z > .3 && z < D - .3 && !intSolidAt(x, z, .25, 0); }).length : 0;
    const resident = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), clear: !intSolidAt(intNPCPos.x, intNPCPos.z, .2, 0) } : null;
    const fire = interiorScene.children.find(c => c.userData && c.userData.hearthFire);
    return { W, D, want: [+(h.kit.o.w - .5).toFixed(3), +(h.kit.o.d - .5).toFixed(3)], plan: T.chimney ? 'peis' : T.plan, scale: T.group.scale.x, open, arrive, exitZ: +exitZ.toFixed(2), blocked, off, stack, bed: bed && { x: +bed.x.toFixed(2), cz: +bed.cz.toFixed(2), owner: bed.owner }, inBed, box: !!box, boxSide, resident, day, wins: T.windows.length, lights, draws, tris: Math.round(tris), doors: INT_DOORS.length,
      fireOn: !!fire && fire.userData.hearthFire.visible && fire.userData.hearthLight.intensity > 0 };
  });
  check(`[${tag}] the room is the hall's inside, ${r.W} by ${r.D} m (${r.want.join(' by ')}), at its true size (scale ${r.scale}), the ${r.plan} plan`, Math.abs(r.W - r.want[0]) < .01 && Math.abs(r.D - r.want[1]) < .01 && r.scale === 1 && r.plan === H.plan, r);
  check(`[${tag}] walled all round (${r.open.length} openings at 0.6 or 2 m)`, r.open.length === 0, r.open.slice(0, 8));
  check(`[${tag}] you arrive clear at ${r.arrive.x}, ${r.arrive.z} m, outside the door's reach (from ${r.exitZ} m)`, r.arrive.clear && !r.arrive.exits, r.arrive);
  check(`[${tag}] the walk from the door past the fire to ${tag === 'parted' ? 'the quarters' : 'the bed\'s side'} is clear by 0.25 m (${r.blocked.length} points in something) and on the floor (${r.off.length} off it)${r.stack == null ? '' : '; the stack stands solid to the roof'}${tag === 'parted' ? `; the partition's door hung (${r.doors})` : ''}`,
    !r.blocked.length && !r.off.length && r.stack !== false && (tag !== 'parted' || r.doors === 1), { blocked: r.blocked.slice(0, 5), off: r.off.slice(0, 5), stack: r.stack, doors: r.doors });
  check(`[${tag}] the bed is the resident's (${r.bed && r.bed.owner}, at ${r.bed && [r.bed.x, r.bed.cz].join(', ')}); the home's chest has ${r.boxSide} sides clear to open it from`, r.inBed && r.bed.owner === 'home' && r.box && r.boxSide >= 1, r);
  check(`[${tag}] lit by the fire and the lamps (${r.lights} lights), ${r.draws} draws (40 or fewer), ${r.tris.toLocaleString()} triangles`, r.fireOn && r.lights >= 4 && r.lights <= 8 && r.draws <= 40, r);
  check(`[${tag}] at noon the day comes in through its ${r.wins * 2} windows and the door (${r.day} sky spots, S1490)`, r.day === r.wins * 2 + 1, r);

  // at night the resident lies in the bed; a bought house has its cellar hatch, clear; a Mages' cold hearth is dark until done
  const more = await page.evaluate(() => { const h = currentHouse, rebuild = () => { WORLD.buildInteriorFor(h); scene = interiorScene; };
    forceTime(22); rebuild(); const res22 = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), clear: !intSolidAt(intNPCPos.x, intNPCPos.z, .2, 0) } : null;
    forceTime(1); rebuild(); const am = intNPCMesh && intNPCMesh.userData.asleep, b = residentBed(), asleep = !intNPCMesh || (!!am && !!b && Math.abs(am.x - b.x) < .01 && Math.abs(am.z - b.z) < .01);
    forceTime(12); h.ownedByPlayer = true; rebuild(); const hatch = HATCH.active ? { x: +HATCH.x.toFixed(2), z: +HATCH.z.toFixed(2), clear: !intSolidAt(HATCH.x, HATCH.z, .2, 0) && [[0, .6], [0, -.6], [.6, 0], [-.6, 0]].some(([dx, dz]) => !intSolidAt(HATCH.x + dx, HATCH.z + dz, .3, 0)) } : null; h.ownedByPlayer = false;
    const G = worldState.guild || (worldState.guild = {}); G.guild_m = G.guild_m || {}; const was = G.guild_m.active; G.guild_m.active = { kind: 'hearth', done: false, house: h.id, siteId: h.siteId };
    rebuild(); const holder = interiorScene.children.find(c => c.userData && c.userData.hearthFire), cold = !!holder && !holder.userData.hearthFire.visible && holder.userData.hearthLight.intensity === 0;
    G.guild_m.active.done = true; WORLD.tickInterior(1 / 60, performance.now()); const lit = !!holder && holder.userData.hearthFire.visible && holder.userData.hearthLight.intensity > 0;
    G.guild_m.active = was; rebuild(); return { res22, asleep, hatch, cold, lit }; });
  check(`[${tag}] at 22h the resident is in, standing clear by the fire at ${more.res22 && [more.res22.x, more.res22.z].join(', ')}`, !!more.res22 && more.res22.clear, more.res22);
  check(`[${tag}] at night the resident lies in the bed`, more.asleep, more);
  check(`[${tag}] a bought house's cellar hatch lies at ${more.hatch && [more.hatch.x, more.hatch.z].join(', ')}, clear to stand by`, !!more.hatch && more.hatch.clear, more.hatch);
  check(`[${tag}] a Mages' cold hearth shows no fire and no light, and it catches when its task is done`, more.cold && more.lit, more);
  await page.evaluate(() => { const h = currentHouse; px = intArriveX(h); pz = intArrivalZ(h); jumpY = 0; interact(); });
  await g.frames(30);
  check(`[${tag}] at the arrival spot E does not take you out`, await page.evaluate(() => isInterior()));
  if (H === picks[2]) { await page.evaluate(() => { const h = currentHouse; try { closeDialog(); } catch (e) {} VM_SCENE.visible = false; px = intArriveX(h); pz = intArrivalZ(h) - .2; jumpY = 0; yaw = .25; pitch = -.08; });
    await g.frames(6); await page.screenshot({ path: path.join(here, '../docs/prototypes/kit-longhouse-peis.png') }); console.log('  (picture: docs/prototypes/kit-longhouse-peis.png)'); }
  await page.evaluate(() => { const h = currentHouse; exitInterior(); if (h._kitWas) { h.kit = h._kitWas; delete h._kitWas; } });
  for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  await page.waitForTimeout(1500);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
