// Session 2250 (card F11; Michael's A on #1580, the prototype Session 2243's docs/prototypes/levelup/ships-arms.js): a ship's ballista in
// the game on the new look. PKIT.ships.fitBallista stands it on each kit hull where the prototype did (0.8 m to starboard, the caravel's
// 0.65; on the cog's and the galleon's forecastle); its four feet on her deck; the bolt's line clear of her hull and rig to 40 m at 0 and
// ±30°; your own ship carries it while it is fitted and loses it when it is taken out; its pedestal is solid; a black-sail cutter carries
// one, its head laid on you when you are in her arc; one engine is 1,924 triangles in 9 draws.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const out = { fit: {}, feet: {}, line: {} };
  const V = (x, y, z) => new THREE.Vector3(x, y, z), rc = new THREE.Raycaster();
  for (const [kind, dress] of [['sloop', 'gatelands'], ['sloop', 'mark'], ['cutter', 'mark'], ['caravel', 'aurenne'], ['cog', 'gatelands'], ['cog', 'aurenne'], ['galleon', 'gatelands'], ['galleon', 'mark']]) {
    const m = WORLD.buildShipMesh(13, 4, 'pirate', kind, dress), k = kind + ':' + dress; m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.updateMatrixWorld(true);
    const B = shipBallistaOn(m, true); if (!B) { out.fit[k] = null; continue; } out.fit[k] = { x: B.fit.x, y: B.fit.y, z: B.fit.z, lv: B.fit.lv || null };
    out.tris = B.tris; out.draws = B.draws;
    // its feet: from 0.5 m over each sole's end straight down to her hull (the engine itself not counted)
    let worst = 0; for (const [fx, fz] of [[.55, 0], [-.55, 0], [0, .55], [0, -.55]]) { rc.set(V(B.fit.x + fx, B.fit.y + .5, B.fit.z + fz), V(0, -1, 0)); const h = rc.intersectObject(m, false)[0];
      worst = Math.max(worst, h ? Math.abs(h.point.y - B.fit.y) : 9); } out.feet[k] = +worst.toFixed(3);
    // the bolt's line: from its head forward 40 m, at 0 and either end of the arc, against her hull and her rigs (not the engine, not her nets)
    const hit = []; const targets = [m, ...m.userData.rigs.map(q => q.m)];
    for (const a of [-Math.PI / 6, 0, Math.PI / 6]) { B.turn.rotation.y = a; m.updateMatrixWorld(true);
      const o = V(B.fit.x + Math.sin(a) * .7, B.fit.y + 1.36, B.fit.z + Math.cos(a) * .7), d = V(Math.sin(a), 0, Math.cos(a)); rc.set(o, d); rc.far = 40;
      const h = rc.intersectObjects(targets, false)[0]; if (h) hit.push([+a.toFixed(2), h.object === m ? 'hull' : 'rig', +h.distance.toFixed(2)]); }
    B.turn.rotation.y = 0; rc.far = Infinity; out.line[k] = hit; }
  // your own ship: fitted, then taken out
  const was = worldState.ship; worldState.ship = { cls: 'sloop', fit: ['ballista'], hold: {}, name: 'Test Gull' };
  if (SHIP.mesh) sc.remove(SHIP.mesh); SHIP.mesh = null; spawnShip(px + 60, pz, 0);
  out.ownOn = !!SHIP.mesh.userData.ballista; const f = SHIP.mesh.userData.ballista && SHIP.mesh.userData.ballista.fit;
  if (f) { const m = SHIP.mesh, ry = m.rotation.y, c = Math.cos(ry), s = Math.sin(ry), wx = m.position.x + f.x * c + f.z * s, wz = m.position.z - f.x * s + f.z * c;
    out.solid = shipPropSolid(wx + .7, wz, .3); out.clear = shipPropSolid(wx + 1.6, wz, .3); }
  out.shared = shipBake('sloop', 'player', 'gatelands').props.some(p => p.bal);
  worldState.ship.fit = []; shipBallistaTick(); out.ownOff = !SHIP.mesh.userData.ballista && !SHIP.mesh.userData.props.some(p => p.bal);
  worldState.ship.fit = ['ballista']; shipBallistaTick(); out.ownBack = !!SHIP.mesh.userData.ballista;
  // a black-sail cutter: hers, and laid on you within its arc (20° to port of her bow, 60 m off); a black sloop has none
  const o = spawnOtherShip('pirate', SHIP.x + 0, SHIP.z + 60, 'test:balcutter', 'cutter'); const bs = spawnOtherShip('pirate', SHIP.x + 200, SHIP.z, 'test:balsloop', 'sloop');
  out.cutter = !!o.mesh.userData.ballista; out.sloop = !!bs.mesh.userData.ballista;
  o.yaw = Math.atan2(-(SHIP.x - o.x), -(SHIP.z - o.z)) + .35; SHIP.sailing = true;
  out.bears = typeof herBallistaBears === 'function' ? herBallistaBears(o) : null;
  for (let i = 0; i < 30; i++) { o.mesh.userData.ballista.t -= 100; placeOther(o); } out.herYaw = +o.mesh.userData.ballista.yaw.toFixed(3);
  SHIP.sailing = false; despawnOtherShip(o); despawnOtherShip(bs); const k = OTHER.indexOf(o); if (k >= 0) OTHER.splice(k, 1); const k2 = OTHER.indexOf(bs); if (k2 >= 0) OTHER.splice(k2, 1);
  worldState.ship = was; return out; });
console.log(JSON.stringify(r));
const F = r.fit, near = (a, b) => a && Math.abs(a.z - b) <= .1;
check(`it stands where the prototype stood it: sloop z ${F['sloop:gatelands']?.z}, cutter ${F['cutter:mark']?.z}, caravel ${F['caravel:aurenne']?.z} (x ${F['caravel:aurenne']?.x}), cog ${F['cog:gatelands']?.z} and galleon ${F['galleon:gatelands']?.z} on the forecastle`,
  near(F['sloop:gatelands'], 3.0) && near(F['cutter:mark'], 2.95) && near(F['caravel:aurenne'], 6.3) && F['caravel:aurenne'].x === -.65 && near(F['cog:gatelands'], 6.8) && near(F['galleon:gatelands'], 9.05)
  && F['sloop:gatelands'].x === -.8 && F['cog:gatelands'].lv === 'hi' && F['galleon:mark'].lv === 'hi' && !F['sloop:mark'].lv, F);
check('every hull has a place for it in every dress', Object.values(F).every(Boolean), F);
check(`its four feet meet her deck within 2 cm (worst ${Math.max(...Object.values(r.feet))} m)`, Object.values(r.feet).every(v => v <= .02), r.feet);
check('the bolt\'s line is clear of her hull and her rig to 40 m at 0 and ±30°', Object.values(r.line).every(h => !h.length), r.line);
check(`one engine is ${r.tris} triangles in ${r.draws} draws (the prototype's 1,924; 7 draws and 2 for the turntable's split)`, r.tris === 1924 && r.draws <= 9, [r.tris, r.draws]);
check('your own ship carries it while it is fitted, loses it when it is taken out, and carries it again', r.ownOn && r.ownOff && r.ownBack, r);
check('its pedestal is solid, a pace off it is not, and the shared bake\'s props are untouched', r.solid === true && r.clear === false && r.shared === false, r);
check('a black-sail cutter carries one and a black sloop does not', r.cutter && !r.sloop, r);
check(`her engine is laid on you in its arc (${r.herYaw} rad, you 0.35 to port of her bow)`, r.bears === true && Math.abs(r.herYaw + .35) < .05, r);
await g.close();
