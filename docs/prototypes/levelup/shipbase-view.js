// The page of shipbase.js (Session 1099): the cog at her mooring in a calm, her base below deck.
// ?view=cut (default: the starboard half of the hull cut away, from abeam) | cabin (inside the cabin from its door) | hold (in the hold
// from forward, the ladder and the hatch's daylight) | galley (under the forecastle); &dress=gatelands (default) | mark | aurenne.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, skyDome, run } from './common.js';
import { shipBase } from './shipbase.js';

const VIEW = Q.get('view') || 'cut', DRESS = Q.get('dress') || 'gatelands';
const R = makeRenderer(.9), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(VIEW === 'cut' ? 40 : 74, W / H, .05, 30000);
buildTextures(); const SUN = new THREE.Vector3(-.5, .55, .4).normalize(); skyDome(scene, SUN); scene.fog = new THREE.FogExp2(new THREE.Color(.70, .78, .86), .0025);
const sun = new THREE.DirectionalLight(new THREE.Color(1, .92, .8), 3.0); sun.position.copy(SUN).multiplyScalar(60); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 140 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03; scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.62, .72, .9), new THREE.Color(.30, .26, .2), VIEW === 'cut' ? 1.1 : .5));
const B = shipBase({ dress: DRESS }); scene.add(B.group);
// the sea, with a hole the shape of her waterline so it does not run through the hold (the hull closes it from outside)
{ const sh = new THREE.Shape(); sh.moveTo(-2000, -2000); sh.lineTo(2000, -2000); sh.lineTo(2000, 2000); sh.lineTo(-2000, 2000); sh.lineTo(-2000, -2000); const h = new THREE.Path(), zs = [];
  for (let z = -8.4; z <= 8.41; z += .2) zs.push(z); const wl = z => Math.max(.02, B.hb(z, 0) + .04 + .03); h.moveTo(wl(zs[0]), -zs[0]); for (const z of zs) h.lineTo(wl(z), -z); for (const z of [...zs].reverse()) h.lineTo(-wl(z), -z); h.lineTo(wl(zs[0]), -zs[0]); sh.holes.push(h);
  const g = new THREE.ShapeGeometry(sh, 4); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: new THREE.Color(.05, .16, .2), roughness: .15, metalness: .1 })); m.position.y = -.01; m.receiveShadow = true; scene.add(m); }
for (const l of B.lights) { const p = new THREE.PointLight(new THREE.Color(1, .66, .34), l.warm > 1 ? 5 : 3.2, 7, 1.6); p.position.set(l.x, l.y - .05, l.z); scene.add(p); }
// the hatch's daylight falling into the hold
{ const sp = new THREE.SpotLight(new THREE.Color(.9, .94, 1), 30, 6, .5, .6, 1.4); sp.position.set(0, B.ship.deck + 2.4, -2.1); sp.target.position.set(0, B.floor, -2.4); scene.add(sp, sp.target); }
if (VIEW === 'cut') { // the starboard half of the ship cut away at x 0.15 so the cabin, the hold and the galley show from abeam
  R.localClippingEnabled = true; const plane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), .15); B.ship.group.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.clippingPlanes = [plane]; m.material.clipShadows = true; m.material.side = THREE.DoubleSide; } });
  cam.position.set(15.5, 3.4, .2); cam.lookAt(0, .6, -.2);
} else if (VIEW === 'cabin') { cam.position.set(-.25, B.ship.deck + 1.55, -4.85); cam.lookAt(-.3, B.ship.deck + .65, -7.6); }
else if (VIEW === 'hold') { cam.position.set(.35, B.floor + 1.5, 4.3); cam.lookAt(-.1, B.floor + .7, -3.4); }
else { cam.position.set(1.0, B.ship.deck + 1.6, 4.0); cam.lookAt(-.9, B.ship.deck + .5, 6.8); }
STATS.view = VIEW; STATS.dress = DRESS; STATS.tris = B.tris; STATS.shipTris = B.shipTris; STATS.items = B.items.length; STATS.plans = { base: { tris: B.tris, draws: B.draws } };
const comp = makeComposer(R, scene, cam, { bloom: .22, sat: 1.04 }); run(comp, cam);
