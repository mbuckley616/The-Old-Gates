// Places that are not gates (Session 857): places.js's markMine by its own lamps, no daylight past the adit's mouth.
// ?view=mine (default): from the adit's last set out over the landing, the gallery along the west wall to the lit face;
// ?view=gallery: on the gallery halfway, the rail and the drop beside you; ?view=shaft: from the gallery's head across and down past the kibble to
// the sump; ?view=face: at the working face, the vein at arm's length; ?view=adit: from the mouth up the level, its sets and lamps.
// &old: the mine long worked out (o.worked false): no lamp lit, only your torch. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run } from './common.js';
import { markMine } from './places.js';
import { stream } from './pieces.js';

// ?place=cairn (Session 869): the Gatelands' round cairn, places-cairn-view.js
// ?place=cave (Session 872): the limestone cave with a lake under falls, places-cave-view.js
// ?place=icecave (Session 903): the same hall in the Mark's ice, places-cave-view.js
if ((Q.get('place') || 'mine') === 'cairn') await import('./places-cairn-view.js');
else if (Q.get('place') === 'cave' || Q.get('place') === 'icecave') await import('./places-cave-view.js');
else if (Q.get('place') === 'lair') await import('./places-lair-view.js') /* Session 873: the smugglers' lair */;
else if (Q.get('place') === 'aqueduct') await import('./places-aqueduct-view.js') /* Session 907: Aurenne's ruined aqueduct */;
else if (Q.get('place') === 'tunnel') await import('./places-tunnel-view.js') /* Session 908: Aurenne's trade tunnel */;
else if (Q.get('place') === 'grotto') await import('./places-grotto-view.js') /* Session 914: Aurenne's sea grotto */;
else if (Q.get('place') === 'abbey') await import('./places-abbey-view.js') /* Session 921: the Gatelands' monastic ruin */;
else if (Q.get('place') === 'mill') await import('./places-mill-view.js') /* Session 949: the Gatelands' tower mill */;
else if (Q.get('place') === 'lighthouse') await import('./places-lighthouse-view.js') /* Session 967: the Gatelands' lighthouse */;
else if (Q.get('place') === 'watchtower') await import('./places-watchtower-view.js') /* Session 971: Aurenne's coastal watchtower */;
else if (Q.get('place') === 'tollbridge') await import('./places-tollbridge-view.js') /* Session 972: the Gatelands' toll bridge */;
else if (Q.get('place') === 'ferry') await import('./places-ferry-view.js') /* Session 980: the Mark's rope ferry */;
else if (Q.get('place') === 'shipyard') await import('./places-shipyard-view.js') /* Session 981: the Gatelands' shipyard */;
else if (Q.get('place') === 'peat') await import('./places-peat-view.js') /* Session 991: the Gatelands' peat-cutting camp */;
else if (Q.get('place') === 'shepherd') await import('./places-shepherd-view.js') /* Session 997: the Gatelands' abandoned shepherd's hut */;
else if (Q.get('place') === 'cabin') await import('./places-cabin-view.js') /* Session 998: the Mark's hunting cabin */;
else if (Q.get('place') === 'logging') await import('./places-logging-view.js') /* Session 999: the Mark's abandoned logging camp */;
else if (Q.get('place') === 'cove') await import('./places-cove-view.js') /* Session 1007: Aurenne's smuggler's cove */;
else if (Q.get('place') === 'falls') await import('./places-falls-view.js') /* Session 1008: the Gatelands' falls, the arches and the cave behind */;
else if (Q.get('place') === 'charcoal') await import('./places-charcoal-view.js') /* Session 1016: the Gatelands' charcoal burners' camp */;
else if (Q.get('place') === 'merchants') await import('./places-merchants-view.js') /* Session 1021: the Gatelands' merchants' halt */;
else if (Q.get('place') === 'hunters') await import('./places-hunters-view.js') /* Session 1022: the Mark's hunters' camp */;
else if (Q.get('place') === 'expedition') await import('./places-expedition-view.js') /* Session 1023: Aurenne's abandoned expedition */;
else if (Q.get('place') === 'carriage') await import('./places-carriage-view.js') /* Session 1025: the Gatelands' overturned carriage */;
else if (Q.get('place') === 'cellar') await import('./places-cellar-view.js') /* Session 1026: the Gatelands' locked cellar */;
else if (Q.get('place') === 'erratic') await import('./places-erratic-view.js') /* Session 1031: the Gatelands' perched stone */;
else if (Q.get('place') === 'unfinished') await import('./places-unfinished-view.js') /* Session 1032: the Mark's unfinished camp */;
else if (Q.get('place') === 'minehead') await import('./places-minehead-view.js') /* Session 1204: the Mark's silver mine's head */;
else if (Q.get('place') === 'canal') await import('./places-canal-view.js') /* Session 1229: the Gatelands' canal lock */;
else if (Q.get('place') === 'quarry') await import('./places-quarry-view.js') /* Session 1155: the Gatelands' limestone quarry and its kiln */;
else if (Q.get('place') === 'towerhouse') await import('./places-towerhouse-view.js') /* Session 1052: the Gatelands' ruined tower house */;
else if (Q.get('place') === 'clifffort') await import('./places-clifffort-view.js') /* Session 1053: the Mark's cliff fort */;
else if (Q.get('place') === 'ring') await import('./places-ring-view.js') /* Session 1119: the Weavers' ring of broken arches on a coast (OG-104) */;
else if (Q.get('place') === 'icemouth') await import('./places-icemouth-view.js') /* Session 1006: the Mark's ice cave mouth */;
else {
const R = makeRenderer(1.25), scene = new THREE.Scene(), VIEW = Q.get('view') || 'mine'; buildTextures();
scene.background = new THREE.Color(0x020203); scene.fog = new THREE.FogExp2(new THREE.Color(.02, .02, .025), .035);
const cam = new THREE.PerspectiveCamera(62, W / H, .02, 400);
const M = markMine({ worked: !Q.has('old'), key: 'mine:ardnashee' }, stream('mine:ardnashee')); scene.add(M.group); if (Q.has('debug')) M.group.getObjectByName('rock').visible = false;
scene.add(new THREE.HemisphereLight(new THREE.Color(.35, .38, .45), new THREE.Color(.12, .1, .08), Q.has('debug') ? 2 : .35));
// the lamps: a small warm light in each, two of them casting shadows (the landing's and the face's); a grey day at the mouth
M.lamps.forEach((p, i) => { const near = i === 0 || Math.abs(p[2] + 18.3) < .1; const l = new THREE.PointLight(new THREE.Color(1, .66, .34), near ? 40 : 22, near ? 18 : 12, 1.5);
  l.position.set(p[0], p[1] - .02, p[2]); if (near) { l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -.002; } scene.add(l); });
// worked out (&old), no lamp is lit: the only light is your own torch, carried at the right hand a little below the eye (Session 868)
if (!M.worked) { const t = new THREE.PointLight(new THREE.Color(1, .6, .28), 34, 14, 1.6); t.castShadow = true; t.shadow.mapSize.set(1024, 1024); t.shadow.bias = -.002; t.userData.torch = true; scene.add(t); }
{ const d = new THREE.SpotLight(new THREE.Color(.75, .82, .95), 30, 26, .5, .8, 1.2); d.position.set(0, 1.6, 2); d.target.position.set(0, .4, -8); scene.add(d, d.target); }
let eye, at, g = M.gallery;
if (VIEW === 'gallery') { eye = [(g.x0 + g.x1) / 2, 1.62, -24.2]; at = [-1, -2.2, -29.5]; }
else if (VIEW === 'shaft') { eye = [-4.75, 1.62, -21.4]; at = [1.4, -7.5, -22.2]; cam.fov = 70; }
else if (VIEW === 'face') { eye = [-1.0, 1.62, M.face + 1.6]; at = [.2, M.vein[1], M.face]; }
else if (VIEW === 'adit') { eye = [-.5, 1.62, -.4]; at = [.1, 1.2, -18]; }
else { eye = [0, 1.62, -17.5]; at = [-3.0, -.6, -31]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
scene.traverse(o => { if (o.userData && o.userData.torch) { const rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion); o.position.copy(cam.position).addScaledVector(rgt, .35).addScaledVector(fwd, .3).add(new THREE.Vector3(0, -.25, 0)); } });
STATS.place = { view: VIEW, tris: M.tris, draws: M.draws, lamps: M.lamps.length, torch: !M.worked };
run(makeComposer(R, scene, cam, { bloom: .2, sat: 1.0, vig: .4 }), cam);
}
