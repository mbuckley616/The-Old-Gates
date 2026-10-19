// The page of shipbase.js (Session 1099): the cog at her mooring in a calm, her base below deck.
// ?view=cut (default: the starboard half of the hull cut away, from abeam) | cabin (inside the cabin from its door) | hold (in the hold
// from forward, the ladder and the hatch's daylight) | galley (under the forecastle); &dress=gatelands (default) | mark | aurenne.
// &ship=sloop (Session 1129): the sloop's base instead, ?view=cut | hold.
// &ship=cutter (Session 1148): the cutter's base (the Mark's dress by default), ?view=cut | hold (forward, to the bench and the stores) | aft
// (aft, to the berth and the chart table).
// &ship=caravel (Session 1149): the caravel's base (Aurenne's dress by default), ?view=cut | cabin (under the sterncastle, from its door) |
// hold (aft in the hold, to the bench and the alchemist's table) | galley (the firebox on the main deck).
// &ship=galleon (Session 1150): the galleon's base, ?view=cut | cabin (the great cabin from its door) | hold (aft, to the bench and the still)
// | crew (forward, to the hammocks and the arms rack) | galley (under the forecastle).
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, skyDome, run } from './common.js';
import { shipBase, sloopBase, cutterBase, caravelBase, galleonBase } from './shipbase.js';

const VIEW = Q.get('view') || 'cut', SHIP = Q.get('ship') || 'cog', DRESS = Q.get('dress') || (SHIP === 'cutter' ? 'mark' : SHIP === 'caravel' ? 'aurenne' : 'gatelands'), SLOOP = SHIP === 'sloop', CUTTER = SHIP === 'cutter', CARAVEL = SHIP === 'caravel', GALLEON = SHIP === 'galleon'; // &ship=sloop (Session 1129): the sloop's base, views cut | hold
const R = makeRenderer(.9), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(VIEW === 'cut' ? 40 : 74, W / H, .05, 30000);
buildTextures(); const SUN = new THREE.Vector3(-.5, .55, .4).normalize(); skyDome(scene, SUN); scene.fog = new THREE.FogExp2(new THREE.Color(.70, .78, .86), .0025);
const sun = new THREE.DirectionalLight(new THREE.Color(1, .92, .8), 3.0); sun.position.copy(SUN).multiplyScalar(60); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 140 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03; scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.62, .72, .9), new THREE.Color(.30, .26, .2), VIEW === 'cut' ? 1.1 : .5));
const B = (SLOOP ? sloopBase : CUTTER ? cutterBase : CARAVEL ? caravelBase : GALLEON ? galleonBase : shipBase)({ dress: DRESS }); scene.add(B.group);
// the sea, with a hole the shape of her waterline so it does not run through the hold (the hull closes it from outside)
{ const sh = new THREE.Shape(); sh.moveTo(-2000, -2000); sh.lineTo(2000, -2000); sh.lineTo(2000, 2000); sh.lineTo(-2000, 2000); sh.lineTo(-2000, -2000); const h = new THREE.Path(), zs = [];
  const ZE = Math.max(8.4, (B.ship.L || 17) / 2 - .35); for (let z = -ZE; z <= ZE + .01; z += .2) zs.push(z); const wl = z => Math.max(.02, B.hb(z, 0) + .04 + .03); h.moveTo(wl(zs[0]), -zs[0]); for (const z of zs) h.lineTo(wl(z), -z); for (const z of [...zs].reverse()) h.lineTo(-wl(z), -z); h.lineTo(wl(zs[0]), -zs[0]); sh.holes.push(h);
  const g = new THREE.ShapeGeometry(sh, 4); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: new THREE.Color(.05, .16, .2), roughness: .15, metalness: .1 })); m.position.y = -.01; m.receiveShadow = true; scene.add(m); }
for (const l of B.lights) { const p = new THREE.PointLight(new THREE.Color(1, .66, .34), l.warm > 1 ? 5 : 3.2, 7, 1.6); p.position.set(l.x, l.y - .05, l.z); scene.add(p); }
// the hatch's daylight falling into the hold
{ const sp = new THREE.SpotLight(new THREE.Color(.9, .94, 1), 30, 6, .5, .6, 1.4); const hz = (B.hatch.z0 + B.hatch.z1) / 2; sp.position.set(0, B.ship.deck + 2.4, hz); sp.target.position.set(0, B.floor, hz - .3); scene.add(sp, sp.target); }
if (VIEW === 'cut') { // the starboard half of the ship cut away at x 0.15 so the cabin, the hold and the galley show from abeam
  R.localClippingEnabled = true; const plane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), .15); B.ship.group.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.clippingPlanes = [plane]; m.material.clipShadows = true; m.material.side = THREE.DoubleSide; } });
  if (SLOOP) { cam.position.set(11.5, 2.6, -.8); cam.lookAt(0, .3, -1.0); } else if (CUTTER) { cam.position.set(6.6, 7.2, -.6); cam.lookAt(0, -.6, -.6); } else if (CARAVEL) { cam.position.set(9.5, 8.5, -2.0); cam.lookAt(0, -.2, -2.0); } else if (GALLEON) { cam.position.set(12.5, 11, -1.0); cam.lookAt(0, -.3, -1.0); } else { cam.position.set(15.5, 3.4, .2); cam.lookAt(0, .6, -.2); }
} else if (GALLEON && VIEW === 'cabin') { cam.position.set(.4, B.ship.deck + 1.55, -5.3); cam.lookAt(-.2, B.ship.deck + .8, -10.6); }
else if (GALLEON && VIEW === 'crew') { cam.position.set(.2, B.floor + 1.35, .7); cam.lookAt(0, B.floor + .5, 6.8); }
else if (GALLEON && VIEW === 'galley') { cam.position.set(.3, B.ship.deck + 1.6, 6.0); cam.lookAt(-.4, B.ship.deck + .6, 9.2); }
else if (GALLEON) { cam.position.set(.1, B.floor + 1.35, -1.5); cam.lookAt(0, B.floor + .6, -4.9); }
else if (CARAVEL && VIEW === 'cabin') { cam.position.set(.3, B.ship.deck + 1.55, -4.3); cam.lookAt(-.3, B.ship.deck + .75, -8.2); }
else if (CARAVEL && VIEW === 'galley') { cam.position.set(1.7, B.ship.deck + 1.8, 1.6); cam.lookAt(-.7, B.ship.deck + .5, 4.3); }
else if (CARAVEL) { cam.position.set(.1, B.floor + 1.3, -.3); cam.lookAt(0, B.floor + .55, -3.9); }
else if (CUTTER && VIEW === 'aft') { cam.position.set(.5, B.floor + 1.5, -.2); cam.lookAt(-.25, B.floor + .6, -4.3); }
else if (CUTTER) { cam.position.set(-.15, B.floor + 1.5, -1.15); cam.lookAt(.25, B.floor + .55, 2.9); }
else if (SLOOP) { cam.position.set(.3, B.floor + 1.1, .8); cam.lookAt(-.2, B.floor + .4, -3.3); }
else if (VIEW === 'cabin') { cam.position.set(-.25, B.ship.deck + 1.55, -4.85); cam.lookAt(-.3, B.ship.deck + .65, -7.6); }
else if (VIEW === 'hold') { cam.position.set(.35, B.floor + 1.5, 4.3); cam.lookAt(-.1, B.floor + .7, -3.4); }
else { cam.position.set(1.0, B.ship.deck + 1.6, 4.0); cam.lookAt(-.9, B.ship.deck + .5, 6.8); }
STATS.view = VIEW; STATS.dress = DRESS; STATS.tris = B.tris; STATS.shipTris = B.shipTris; STATS.items = B.items.length; STATS.plans = { base: { tris: B.tris, draws: B.draws } };
const comp = makeComposer(R, scene, cam, { bloom: .22, sat: 1.04 }); run(comp, cam);
