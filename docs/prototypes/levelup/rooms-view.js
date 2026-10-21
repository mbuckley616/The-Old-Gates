// Rooms in the new kit (Session 852): rooms.js's gatelandsCottage in its lane, under the sky at four hours (OG-141's natural light).
// ?view=kitchen (default): from the door lobby past the jamb wall to the hearth; ?view=table: from the hearth to the table under the
// window and the box bed; ?view=dresser: the dresser and the back door; ?view=outside: the cottage from the lane, its windows by the hour.
// &hour=morning | noon (default) | golden | night. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
// ?room=longhouse (Session 870): the Markish longhouse. view=hall (default): from inside the door down the hall past the fire;
// view=hearth: across the fire to the benches; view=larder: the larder and the workshop by the door; view=back: through the partition's
// doorway into the family quarters; view=outside: the hall from its yard.
// ?room=home (Session 891): Aurenne's flat over a dyer's shop. view=shop (default): from the door into the shop; view=stair: from the shop
// to the stair's foot; view=flat: upstairs from the landing to the divan; view=kitchen: the cooking bench and its pots; view=roof: the
// terrace from the hatch; view=outside: the house from the street. &shell=<key> turns the door to the other side.
// ?room=inn (Session 893): the Gatelander inn. view=tap (default): from by the bar across the taproom to the hearth; view=bar: the bar
// and its kegs; view=hearth: from the settle's end into the fire; view=upstairs: the passage from the landing; view=chamber: a guest
// room; view=outside: the inn from the lane.
// ?room=alehall (Session 894): the Mark's inn. view=hall (default): from inside the door down the hall past the fire; view=tables:
// along a long table from its end; view=counter: the counter and the kegs; view=outside: the hall from its yard.
// ?room=tavern (Session 895): Aurenne's tavern over the harbour. view=terrace (default): from the door out through the arcade over
// the terrace to the sea; view=tap: inside from the door to the counter; view=pergola: from the parapet back under the vine to the
// arcade; view=outside: the tavern from the water. The ground stops at the quay; the sea lies 3.2 m below.
// ?room=court (Session 899): Aurenne's courtyard house. view=court (default): from inside the street door through the vestibule and the
// arcade to the fountain and the hall's arch; view=gallery: from a corner of the upper gallery down over the court; view=hall: the
// reception hall; view=kitchen; view=bedroom; view=study; view=children; view=outside: the house from the street; view=above: the roof
// and the court from a height.
// ?room=forge (Session 929): the Gatelands smithy. view=forge (default): from inside the open door across the shoeing bay to the
// hearth and the anvil; view=anvil: from the anvil's side into the fire under its hood; view=bench: the bench, the rack and the
// bellows; view=outside: the forge from the lane, its doors open.
// ?room=smithy (Session 930): the Mark's smithy. view=smithy (default): from inside the door past the anvil to the forge under the
// louver; view=bellows: from beside the forge over the shield to the bellows; view=bench: the bench and the tool wall; view=outside.
// ?room=aursmithy (Session 931): Aurenne's smithy. view=shop (default): from the doorway to the forge in its corner; view=anvil: from
// the anvil's side to the hearth, the hood and the bag bellows; view=stall: the wares under the arcade from the street; view=outside.
// ?room=apothecary (Session 936): the Gatelands apothecary. view=shop (default): from inside the door across the counter to the still;
// view=still: from the worktable to the furnace, the pot and the worm tub; view=bench: the bottling bench and its shelves; view=store:
// through the hearth wall into the store; view=outside: the cottage from the lane, its sign.
// ?room=markapo (Session 937): the Mark's healer's hall. view=hall (default): from inside the door past the trade board down the hall to
// the hearth; view=still: from beside the hearth to the still and its log of snow; view=table: the table, the mortar and the herbs;
// view=bench: the bottling shelves; view=outside.
// ?room=aurapo (Session 938): Aurenne's apothecary. view=shop (default): from inside the door over the counter to the wall of jars;
// view=still: from the counter's end to the alembic on its furnace; view=bench: the phials; view=stall: the arcade's stall from the
// street; view=outside.
// ?room=guild (Session 939; in the kit's guild hall since Session 965): the Gatelands Fighters' Guild. view=hall (default): from inside
// the great door to the steward's desk, the notice board and the gallery over them; view=table: the long table and the hearth with its
// shield; view=east: the practice floor, the stair and the partition; view=roof: up into the trusses; view=gallery: along the gallery
// over the hall; view=dorm: the dormitory from its door; view=steward: the steward's room from its door; view=outside.
// ?room=mages (Session 966): the Mages' Guild in the same house, the same views; view=still: the still and the potion shelves.
// ?room=temple (Session 946): a Gatelands temple of one of the six gods (&god=hearth (default) | sea | sky | beasts | stone | weaver).
// view=nave (default): from inside the door down the nave to the altar and the statue; view=statue: the god and its icon from before
// the altar; view=door: from the dais back to the door, the bullaun and the rags; view=ledge: the benches and the ledge of offerings;
// view=outside: the temple from its west door.
// ?room=church (Session 947): Aurenne's church, the Church of the Weaver. view=nave (default): from inside the great door down the aisle
// past the bier to the altar under the shuttle; view=dome: from beside the bier up into the drum and the dome; view=sanctuary: the
// altar, the shuttle and the lectern from the sanctuary's step; view=back: from the sanctuary back over the bier to the door;
// view=outside: the church from the square.
// ?room=market (Session 1188): the room over the Gatelands market house. view=hall (default): from inside the stair door down the
// town's room to the hearth; view=table: the long table under its rings of candles; view=clerk: the clerk's room from its door, the
// desk and the measures; view=door: from the hearth back to the stair door; view=arcade: the arcade below and the chimney's pier;
// view=outside: the house from the square by its stair.
// ?room=townhouse (Session 1189): the Gatelands townhouse, three storeys. view=hall (default): from inside the front door down the hall
// to the stair; view=parlour, kitchen (the ground floor); view=stair: up the well from the hall; view=drawing, dining (the first floor);
// view=bedroom, children (the second floor); view=outside: the house from the street.
// ?room=farmhouse (Session 1192): the Gatelands farmhouse, two storeys. view=kitchen (default): from the kitchen's door to the open
// hearth; view=dresser; view=hall: from the front door up the hall past the stair; view=parlour; view=stair: down the well from the
// landing; view=landing: the landing to the middle window; view=bedroom (the west room, the parents'), children (the east room);
// view=outside: the house from the lane.
// ?room=byre (Session 1198): the farmstead's byre. view=byre (default): from inside the east half-door west along the passage and the
// standings; view=manger: along the manger and its rack from the west end; view=pen: the calf pen from the passage; view=loft: the hay
// loft from the ladder's head; view=outside: the byre from the yard.
// ?room=cabin (Session 1199): the Mark's hunting cabin as a room. view=cabin (default): from inside the door to the fire and the bed;
// view=hearth: the peis close; view=door: from the bed back to the door, the pegs and the shelves; view=outside: the cabin in its clearing.
// ?room=barn (Session 1198): the farmstead's barn. view=bay (default): the cart bay from inside the arch; view=stable: the stalls from
// the stable door; view=stair: the stair up the west gable; view=loft: the loft from the stair's head to the pitching door;
// view=outside: the barn from the yard.
// ?room=library (Session 948): Aurenne's library in the academy's hall. view=hall (default): from the middle doorway of the screen down
// the hall past the armillary to the presses between the towers; view=presses: along the west presses and the ladder; view=table: a
// reading table and its lamp; view=loggia: the arcade's walk behind the screen; view=outside: the academy from the street.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, run } from './common.js';
import { gatelandsCottage, markLonghouse, aurenneHome, gatelandsInn, markAlehall, aurenneTavern, aurenneCourtyardHouse, gatelandsForge, markSmithy, aurenneSmithy, gatelandsApothecary, markApothecary, aurenneApothecary, gatelandsGuildHall, gatelandsTemple, aurenneChurchHall, aurenneLibrary, gatelandsMarketRoom, gatelandsTownhouse, gatelandsFarmhouse, gatelandsByre, gatelandsBarn, markCabin } from './rooms.js';
import { stream } from './pieces.js';

const ROOM = Q.get('room') || 'cottage', ALE = ROOM === 'alehall', LONG = ROOM === 'longhouse' || ALE, HOME = ROOM === 'home', INN = ROOM === 'inn', TAV = ROOM === 'tavern', CRT = ROOM === 'court', FRG = ROOM === 'forge', SMI = ROOM === 'smithy', ASM = ROOM === 'aursmithy', APO = ROOM === 'apothecary', MAPO = ROOM === 'markapo', AAPO = ROOM === 'aurapo', GLD = ROOM === 'guild' || ROOM === 'mages', TMP = ROOM === 'temple', CHU = ROOM === 'church', LIB = ROOM === 'library', MKT = ROOM === 'market', TWN = ROOM === 'townhouse', FRM = ROOM === 'farmhouse', BYR = ROOM === 'byre', BRN = ROOM === 'barn', CAB = ROOM === 'cabin', VIEW = Q.get('view') || (CAB ? 'cabin' : BYR ? 'byre' : BRN ? 'bay' : MAPO || GLD || MKT || TWN ? 'hall' : ASM || APO || AAPO ? 'shop' : FRG ? 'forge' : SMI ? 'smithy' : HOME ? 'shop' : INN ? 'tap' : ALE ? 'hall' : TAV ? 'terrace' : CRT ? 'court' : 'kitchen'), HOUR = Q.get('hour') || 'noon';
const R = makeRenderer(CAB && VIEW !== 'outside' ? 1.6 : (BYR || BRN) && VIEW !== 'outside' ? 1.5 : (TWN || FRM) && VIEW !== 'outside' ? 1.35 : MKT && !['outside', 'arcade'].includes(VIEW) ? 1.35 : LIB && !['outside', 'loggia'].includes(VIEW) ? 1.3 : CHU && VIEW !== 'outside' ? 1.3 : TMP && VIEW !== 'outside' ? 1.4 : GLD && VIEW !== 'outside' ? 1.35 : AAPO && !['outside', 'stall'].includes(VIEW) ? 1.3 : MAPO && VIEW !== 'outside' ? 1.4 : APO && VIEW !== 'outside' ? 1.3 : ASM && !['outside', 'stall'].includes(VIEW) ? 1.35 : (FRG || SMI) && VIEW !== 'outside' ? 1.3 : CRT && !['outside', 'above'].includes(VIEW) ? 1.25 : LONG && VIEW !== 'outside' ? 1.5 : (HOME || INN) && !['outside', 'roof'].includes(VIEW) ? 1.4 : TAV && VIEW === 'tap' ? 1.3 : .9), scene = new THREE.Scene(); buildTextures();
const cam = new THREE.PerspectiveCamera(62, W / H, .02, 30000);
// the hours: the sun's direction (the cottage's front faces +z, south), its colour and strength, the sky's light, the fog
const HOURS = { morning: { dir: [.5, .3, .82], c: [1, .82, .62], i: 3.2, sky: .5, fog: [.78, .8, .84] }, noon: { dir: [.15, .78, .6], c: [1, .96, .9], i: 3.6, sky: .7, fog: [.74, .8, .88] },
  golden: { dir: [-.8, .2, .55], c: [1, .62, .34], i: 2.8, sky: .4, fog: [.85, .7, .55] }, night: { dir: [.3, .45, .84], c: [.55, .66, 1], i: .35, sky: .06, fog: [.06, .08, .14] } };
const Hh = HOURS[HOUR] || HOURS.noon, SUN = new THREE.Vector3(...Hh.dir).normalize();
scene.fog = new THREE.FogExp2(new THREE.Color(...Hh.fog), .004);
const sun = new THREE.DirectionalLight(new THREE.Color(...Hh.c), Hh.i); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .03;
sun.position.copy(SUN).multiplyScalar(40); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 90 }); scene.add(sun, sun.target);
const sky = new THREE.HemisphereLight(new THREE.Color(.62, .72, .9), new THREE.Color(.34, .32, .24), Hh.sky * (VIEW === 'outside' ? 1.6 : .8)); scene.add(sky);
skyDome(scene, SUN); if (HOUR !== 'night') clouds(scene, SUN, { n: 8, d0: 1800, dw: 5000, y0: 300 });
{ const g = TAV ? new THREE.PlaneGeometry(300, 160).translate(0, 70, 0) /* the ground stops at the quay, z = 10 */ : new THREE.PlaneGeometry(300, 300); g.rotateX(-Math.PI / 2); worldUV(g, .3); const m = new THREE.Mesh(g, mat('rock', { ns: .7, color: 0x7a8a5a, rough: 1 })); m.position.y = -.01; m.receiveShadow = true; scene.add(m); }
const C = CAB ? markCabin({}, stream('markcabin:skarvhaug')) : BYR ? gatelandsByre({}, stream('byre:kilbride')) : BRN ? gatelandsBarn({}, stream('barn:kilbride')) : FRM ? gatelandsFarmhouse({}, stream('farmhouse:kilbride')) : TWN ? gatelandsTownhouse({}, stream('townhouse:kilbride')) : MKT ? gatelandsMarketRoom({}, stream('market:kilbride')) : LIB ? aurenneLibrary({}, stream('library:qasr')) : CHU ? aurenneChurchHall({}, stream('church:qasr')) : TMP ? gatelandsTemple({ god: Q.get('god') || 'hearth' }, stream('temple:kilbride')) : GLD ? gatelandsGuildHall({ guild: ROOM === 'mages' ? 'mages' : 'fighters' }, stream('guild:kilbride')) : AAPO ? aurenneApothecary({}, stream('aurapo:qasr')) : MAPO ? markApothecary({}, stream('markapo:skarvik')) : APO ? gatelandsApothecary({}, stream('apothecary:kilbride')) : ASM ? aurenneSmithy({}, stream('aursmithy:qasr')) : SMI ? markSmithy({}, stream('smithy:skarvik')) : FRG ? gatelandsForge({}, stream('forge:kilbride')) : CRT ? aurenneCourtyardHouse({}, stream('courtyard:qasr')) : TAV ? aurenneTavern({}, stream('tavern:qasr')) : ALE ? markAlehall({}, stream('alehall:skarvik')) : INN ? gatelandsInn({ bays: +Q.get('bays') || 3 }, stream('inn:kilbride')) : HOME ? aurenneHome({ shell: Q.get('shell') || 'aurhome-shell' }, stream('aurhome:qasr')) : LONG ? markLonghouse({}, stream('longhouse:skarvik')) : gatelandsCottage({}, stream('cottage:kilbride')); scene.add(C.group);
if (LONG) Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11 });
if (ALE) Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13 });
if (LIB) Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18 });
// the townhouse: the fires, lamps and candles of the floor in view
const TFL = { hall: 0, parlour: 0, kitchen: 0, stair: 0, outside: 0, drawing: 1, dining: 1, bedroom: 2, children: 2 }[VIEW] ?? 0;
if (TWN) { for (const F of C.fires.filter(F => F[3] === TFL)) { const f = new THREE.PointLight(new THREE.Color(1, .55, .24), 4, 6, 1.6); f.position.set(F[0] + .3, F[1], F[2]); scene.add(f); }
  for (const L of C.lamps.filter(L => L[3] === TFL || VIEW === 'stair')) { const q = new THREE.PointLight(new THREE.Color(1, .72, .42), HOUR === 'night' ? 3 : 1.4, 7, 1.6); q.position.set(L[0], L[1] - .1, L[2]); scene.add(q); }
  sky.groundColor = new THREE.Color(.55, .5, .42); }
// the farmhouse: the fires and lanterns of the floor in view, the kitchen's hearth the strongest and casting
const FFL = { stair: 1, landing: 1, bedroom: 1, children: 1 }[VIEW] ?? 0;
if (FRM) { for (const F of C.fires.filter(F => F[3] === FFL)) { const open = F[3] === 0 && F[0] > 0, f = new THREE.PointLight(new THREE.Color(1, .55, .24), open ? 7 : 4, open ? 8 : 6, 1.6); f.position.set(F[0] - Math.sign(F[0]) * .35, F[1] + (open ? .2 : 0), F[2]); if (open) { f.castShadow = true; f.shadow.mapSize.set(1024, 1024); } scene.add(f); }
  for (const L of C.lamps.filter(L => L[3] === FFL || VIEW === 'stair' || VIEW === 'hall')) { const q = new THREE.PointLight(new THREE.Color(1, .72, .42), HOUR === 'night' ? 3 : 1.3, 7, 1.6); q.position.set(L[0], L[1] - .15, L[2]); scene.add(q); }
  for (const c of C.candles.filter(c => (c[1] > C.floors[1]) === (FFL === 1))) { const q = new THREE.PointLight(new THREE.Color(1, .7, .4), HOUR === 'night' ? 1.2 : .5, 3.5, 1.6); q.position.set(c[0], c[1] + .05, c[2]); scene.add(q); }
  sky.groundColor = new THREE.Color(.55, .5, .42); }
// the cabin: the fire low and strong and casting, the lantern, the candle
if (CAB) { const f = new THREE.PointLight(new THREE.Color(1, .55, .24), HOUR === 'night' ? 6 : 4, 6, 1.6); f.position.set(C.fire[0] + .25, C.fire[1] + .15, C.fire[2]); f.castShadow = true; f.shadow.mapSize.set(1024, 1024); scene.add(f);
  for (const L of C.lamps) { const q = new THREE.PointLight(new THREE.Color(1, .72, .42), HOUR === 'night' ? 2.5 : 1.2, 6, 1.6); q.position.set(L[0], L[1] - .15, L[2]); scene.add(q); }
  for (const c of C.candles) { const q = new THREE.PointLight(new THREE.Color(1, .7, .4), HOUR === 'night' ? 1.2 : .5, 3, 1.6); q.position.set(c[0], c[1] + .05, c[2]); scene.add(q); }
  if (HOUR !== 'night') { const q = new THREE.PointLight(new THREE.Color(.82, .86, .94), 2.0 * Hh.sky / .7, 5, 1.4); q.position.set(C.door.x, C.floor + 1.3, C.door.z - .8); scene.add(q); }
  scene.fog.density = .012; sky.groundColor = new THREE.Color(.5, .44, .36); }
// the byre and the barn: their lanterns (the loft's in the barn only from the loft), dim by day, the day's light through the doors
if (BYR || BRN) { const up = VIEW === 'loft'; Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 });
  for (const L of C.lamps.filter(L => BYR || (L[3] === 1) === up)) { const q = new THREE.PointLight(new THREE.Color(1, .72, .42), HOUR === 'night' ? 3 : 1.2, 7, 1.6); q.position.set(L[0], L[1] - .15, L[2]); scene.add(q); }
  if (HOUR !== 'night') for (const d of C.doors) { const q = new THREE.PointLight(new THREE.Color(.82, .86, .94), 2.2 * Hh.sky / .7, 7, 1.4); q.position.set(d.x, (C.floors[0]) + 1.5, d.z - 1.1); scene.add(q); }
  sky.groundColor = new THREE.Color(.5, .46, .38); }
if (CHU || MKT) Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13 });
// the market room: the hall's fire, the two rings of candles over the table, the clerk's grate and his candle
if (MKT) { const f = new THREE.PointLight(new THREE.Color(1, .55, .24), 6, 8, 1.6); f.position.set(C.fire[0] + .35, C.fire[1] + .2, C.fire[2]); f.castShadow = true; f.shadow.mapSize.set(1024, 1024); scene.add(f);
  for (const L of C.rings) { const q = new THREE.PointLight(new THREE.Color(1, .72, .42), HOUR === 'night' ? 4 : 1.6, 8, 1.5); q.position.set(L[0], L[1] + .1, L[2]); scene.add(q); }
  const g = new THREE.PointLight(new THREE.Color(1, .55, .24), 2, 4, 1.6); g.position.set(C.grate[0] - .3, C.grate[1] + .15, 0); scene.add(g);
  const c = new THREE.PointLight(new THREE.Color(1, .7, .4), HOUR === 'night' ? 1.6 : .6, 4, 1.6); c.position.set(C.candle[0], C.candle[1] + .05, C.candle[2]); scene.add(c); sky.groundColor = new THREE.Color(.55, .5, .42); }
if (CRT) Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11 });
// the library: the four lamps over the tables
if (LIB) { for (const L of C.lamps) { const l = new THREE.PointLight(new THREE.Color(1, .72, .42), HOUR === 'night' ? 4 : 1.6, 8, 1.5); l.position.set(L[0], L[1] - .1, L[2]); scene.add(l); } sky.groundColor = new THREE.Color(.62, .5, .38); }
// the church: the ring of lamps under the dome, the altar's candles, the bier's four
if (CHU) { const l = new THREE.PointLight(new THREE.Color(1, .72, .42), HOUR === 'night' ? 9 : 4, 14, 1.4); l.position.set(0, C.ring.y - .2, 0); scene.add(l);
  const a = new THREE.PointLight(new THREE.Color(1, .68, .38), HOUR === 'night' ? 3 : 2, 6, 1.6); a.position.set(0, C.altar.y + .9, C.altar.z1 + .3); scene.add(a);
  const b = new THREE.PointLight(new THREE.Color(1, .68, .38), HOUR === 'night' ? 3 : 1.8, 6, 1.6); b.position.set(0, C.floor + 1.7, 0); b.castShadow = true; b.shadow.mapSize.set(1024, 1024); scene.add(b); sky.groundColor = new THREE.Color(.6, .55, .45); }
// the temple: the lamp over the nave, the altar's candles, the prickets', and the icon's own flame for the Hearth
if (TMP) { const l = new THREE.PointLight(new THREE.Color(1, .7, .4), HOUR === 'night' ? 4 : 2.2, 8, 1.6); l.position.set(C.lamp[0], C.lamp[1] - .1, C.lamp[2]); scene.add(l);
  const a = new THREE.PointLight(new THREE.Color(1, .66, .36), HOUR === 'night' ? 2.5 : 1.6, 5, 1.6); a.position.set((C.altar.x0 + C.altar.x1) / 2, C.altar.y + .45, 0); a.castShadow = true; a.shadow.mapSize.set(1024, 1024); scene.add(a);
  for (const P of C.prickets) { const q = new THREE.PointLight(new THREE.Color(1, .66, .36), HOUR === 'night' ? 1.6 : 1, 4, 1.6); q.position.set(...P); scene.add(q); }
  if (C.god === 'hearth') { const q = new THREE.PointLight(new THREE.Color(1, .62, .3), .8, 2.5, 1.6); q.position.set(C.statue.icon[0] - .25, C.statue.icon[1] + .15, 0); scene.add(q); }
  sky.groundColor = new THREE.Color(.5, .46, .4); }
// the fire's light, low and warm in the hearth; the lantern's at the golden hour and night; the candle's at night
if (HOME) { for (const b of C.braziers.slice(0, 1)) { const f = new THREE.PointLight(new THREE.Color(1, .5, .2), 2.5, 4, 1.6); f.position.set(b[0] - .2, b[1] + .25, b[2] + .45); scene.add(f); }
  const l0 = new THREE.PointLight(new THREE.Color(1, .72, .42), HOUR === 'night' ? 2.5 : 1.2, 6, 1.6); l0.position.set(C.lamp0[0], C.lamp0[1] + .15, C.lamp0[2]); scene.add(l0);
  const l1 = new THREE.PointLight(new THREE.Color(1, .74, .44), HOUR === 'night' ? 5 : 2.2, 8, 1.6); l1.position.set(C.lamp[0], C.lamp[1] - .1, C.lamp[2]); scene.add(l1);
  sky.groundColor = new THREE.Color(.55, .45, .32); }
else if (TAV || AAPO) {}
else if (CRT) { const up = ['gallery', 'bedroom', 'study', 'children'].includes(VIEW), fl = up ? 1 : 0, near = C.lamps.filter(L => L[3] === fl);
  for (const L of near) { const q = new THREE.PointLight(new THREE.Color(1, .72, .42), HOUR === 'night' ? 4 : up ? 2.4 : 1.6, 7, 1.6); q.position.set(L[0], L[1] - .1, L[2]); scene.add(q); }
  if (!up) for (const b of C.braziers) { const f = new THREE.PointLight(new THREE.Color(1, .5, .2), 2.2, 4, 1.6); f.position.set(b[0], b[1] + .25, b[2] - .45); scene.add(f); }
  sky.groundColor = new THREE.Color(.6, .5, .38); }
else if (TMP || CHU || LIB || MKT || TWN || FRM || BYR || BRN || CAB) {}
else if (GLD) { const f = new THREE.PointLight(new THREE.Color(1, .55, .24), 12, 12, 1.6); f.position.set(C.fire[0] + .35, C.fire[1] + .2, C.fire[2]); f.castShadow = true; f.shadow.mapSize.set(1024, 1024); scene.add(f);
  const l = new THREE.PointLight(new THREE.Color(1, .72, .42), HOUR === 'night' ? 7 : 3, 13, 1.4); l.position.set(C.lamp[0], C.lamp[1] + .1, C.lamp[2]); scene.add(l);
  const u = new THREE.PointLight(new THREE.Color(1, .7, .4), HOUR === 'night' ? 3 : 1.4, 7, 1.6); u.position.set(...C.dormLamp); u.position.x += .3; scene.add(u);
  const s = new THREE.PointLight(new THREE.Color(1, .7, .4), HOUR === 'night' ? 2 : .9, 6, 1.6); s.position.set(C.stTable.x0 + .6, C.floors[0] + 2.2, 0); scene.add(s);
  if (C.still) { const g = new THREE.PointLight(new THREE.Color(.35, 1, .5), HOUR === 'night' ? 2.5 : 1.4, 5, 1.6); g.position.set(C.still.glow[0], C.still.glow[1], C.still.glow[2] - .4); scene.add(g); } }
else if (INN) { const f = new THREE.PointLight(new THREE.Color(1, .55, .24), 9, 10, 1.6); f.position.set(C.fire[0] + .35, C.fire[1] + .2, C.fire[2]); f.castShadow = true; f.shadow.mapSize.set(1024, 1024); scene.add(f);
  const l = new THREE.PointLight(new THREE.Color(1, .7, .4), HOUR === 'night' ? 4 : 2, 7, 1.6); l.position.set(C.lamp[0], C.lamp[1] - .1, C.lamp[2]); scene.add(l);
  const u = new THREE.PointLight(new THREE.Color(1, .7, .4), HOUR === 'night' ? 2.5 : 1, 6, 1.6); u.position.set(-.5, C.floors[1] + 1.9, (C.passage + C.inner.z0) / 2); scene.add(u); }
else { const f = new THREE.PointLight(new THREE.Color(1, .55, .24), LONG ? 14 : 7, LONG ? 13 : 9, 1.6); f.position.set(C.fire[0] + (LONG ? 0 : .35), C.fire[1] + (LONG ? .45 : .2), C.fire[2]); if (LONG) { f.intensity = HOUR === 'night' ? 36 : 30; f.distance = 16; } f.castShadow = true; f.shadow.mapSize.set(1024, 1024); scene.add(f); }
if (ASM) { const f = new THREE.PointLight(new THREE.Color(1, .5, .2), 6, 8, 1.6); f.position.set(C.fire[0] + .3, C.fire[1] + .3, C.fire[2] + .3); f.castShadow = true; f.shadow.mapSize.set(1024, 1024); scene.add(f);
  const l = new THREE.PointLight(new THREE.Color(1, .72, .42), HOUR === 'night' ? 3 : 1.4, 7, 1.6); l.position.set(C.lamp[0], C.lamp[1] - .1, C.lamp[2]); scene.add(l); sky.groundColor = new THREE.Color(.6, .5, .38); }
if (SMI) { const f = new THREE.PointLight(new THREE.Color(1, .5, .2), 12, 10, 1.6); f.position.set(C.fire[0], C.fire[1] + .35, C.fire[2]); f.castShadow = true; f.shadow.mapSize.set(1024, 1024); scene.add(f);
  const l = new THREE.PointLight(new THREE.Color(1, .66, .34), HOUR === 'night' ? 3 : 1.5, 7, 1.6); l.position.set(C.lamp[0], C.lamp[1] + .1, C.lamp[2]); scene.add(l);
  if (HOUR !== 'night') { const s = new THREE.SpotLight(new THREE.Color(.8, .85, .95), 60 * Hh.sky, 12, .5, .9, 1.2); s.position.set(0, C.under(0) - .2, C.louver); s.target.position.set(0, C.floor, C.louver); scene.add(s, s.target); } }
if (FRG) { const f = new THREE.PointLight(new THREE.Color(1, .5, .2), 10, 9, 1.6); f.position.set(C.fire[0] + .25, C.fire[1] + .25, C.fire[2]); f.castShadow = true; f.shadow.mapSize.set(1024, 1024); scene.add(f);
  const l = new THREE.PointLight(new THREE.Color(1, .7, .4), HOUR === 'night' ? 3 : 1.2, 7, 1.6); l.position.set(C.lantern[0], C.lantern[1] - .1, C.lantern[2]); scene.add(l); }
// the Mark's healer's hall: its two fires, the lamp, a grey shaft from the louver by day
if (MAPO) { C.fires.forEach((F, k) => { const f = new THREE.PointLight(new THREE.Color(1, .52, .22), 5, 7, 1.6); f.position.set(F[0], F[1] + .35, F[2]); f.castShadow = k === 0; f.shadow.mapSize.set(1024, 1024); scene.add(f); });
  const l = new THREE.PointLight(new THREE.Color(1, .66, .34), HOUR === 'night' ? 3 : 1.5, 7, 1.6); l.position.set(C.lamp[0], C.lamp[1] + .1, C.lamp[2]); scene.add(l);
  if (HOUR !== 'night') { const s = new THREE.SpotLight(new THREE.Color(.8, .85, .95), 60 * Hh.sky, 12, .5, .9, 1.2); s.position.set(0, C.under(0) - .2, C.louver); s.target.position.set(0, C.floor, C.louver); scene.add(s, s.target); } }
// Aurenne's apothecary: the furnace's glow, the brass lamp, the floor's bounce
if (AAPO) { const f = new THREE.PointLight(new THREE.Color(1, .5, .2), 2.5, 4, 1.6); f.position.set(...C.glow); scene.add(f);
  const l = new THREE.PointLight(new THREE.Color(1, .72, .42), HOUR === 'night' ? 3 : 1.4, 7, 1.6); l.position.set(C.lamp[0], C.lamp[1] - .1, C.lamp[2]); scene.add(l); sky.groundColor = new THREE.Color(.6, .5, .38); }
// the apothecary's furnace glows at its door
if (APO) { const f = new THREE.PointLight(new THREE.Color(1, .5, .2), 2.5, 4, 1.6); f.position.set(...C.glow); scene.add(f); }
// the family quarters' stone lamp on the chest
if (TAV) { const sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 400).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: new THREE.Color(.06, .26, .34), roughness: .12, metalness: .1 })); sea.position.set(0, -3.2, 210); scene.add(sea);
  const quay = new THREE.Mesh(new THREE.BoxGeometry(300, 3.4, .3), mat('limestone', { ns: .8, color: 0xe8e0d0, rough: .85 })); quay.position.set(0, -1.7, 10.0); quay.receiveShadow = true; scene.add(quay);
  for (const L of C.lamps) { const q = new THREE.PointLight(new THREE.Color(1, .72, .42), HOUR === 'night' ? 4 : 1.8, 7, 1.6); q.position.set(L[0], L[1] - .1, L[2]); scene.add(q); }
  { const b = C.braziers[0], f = new THREE.PointLight(new THREE.Color(1, .5, .2), 2.5, 4, 1.6); f.position.set(b[0] - .2, b[1] + .25, b[2]); scene.add(f); } }
if (ALE) for (const L of C.lamps) { const q = new THREE.PointLight(new THREE.Color(1, .66, .34), HOUR === 'night' ? 6 : 3, 9, 1.6); q.position.set(L[0], L[1] + .1, L[2]); scene.add(q); }
if (LONG && !ALE) { const q = new THREE.PointLight(new THREE.Color(1, .66, .34), 3, 6, 1.6); q.position.set(C.lamp2[0], C.lamp2[1] + .08, C.lamp2[2] + .05); scene.add(q); }
// the longhouse's louver lets a grey shaft of day down onto the hearth's smoke (none at night)
if (LONG && HOUR !== 'night') { const l = new THREE.SpotLight(new THREE.Color(.8, .85, .95), 80 * Hh.sky, 14, .5, .9, 1.2); l.position.set(0, C.under(0) - .2, C.louver); l.target.position.set(0, C.floor, C.louver); scene.add(l, l.target); }
if (!HOME && !INN && !ALE && !TAV && !CRT && !FRG && !SMI && !ASM && !MAPO && !AAPO && !GLD && !TMP && !CHU && !LIB && !MKT && !TWN && !FRM && !BYR && !BRN && !CAB && (HOUR === 'night' || HOUR === 'golden')) { const L = LONG ? C.lamp : C.lantern, l = new THREE.PointLight(new THREE.Color(1, .7, .4), HOUR === 'night' ? 4 : 2, 7, 1.6); l.position.set(L[0], L[1] + (LONG ? .1 : -.1), L[2]); scene.add(l); }
const inside = VIEW !== 'outside'; let eye, at;
if (CAB) { const Z = C.inner.z1, X = C.inner.x1, F = C.floor;
  if (VIEW === 'hearth') { eye = [.55, F + 1.45, -.2]; at = [C.stack.x1, F + .55, (C.stack.z0 + C.stack.z1) / 2]; cam.fov = 70; }
  else if (VIEW === 'door') { eye = [.7, F + 1.55, -1.6]; at = [-1.0, F + 1.1, Z]; cam.fov = 82; }
  else if (VIEW === 'outside') { eye = [4.2, 1.8, 8.5]; at = [0, 1.6, 0]; cam.fov = 50; }
  else { eye = [.15, F + 1.62, Z - .25]; at = [-.2, F + .7, -Z]; cam.fov = 84; } }
else if (BYR) { const Z = C.inner.z1, X = C.inner.x1, FL = C.floors[1];
  if (VIEW === 'manger') { eye = [-X + .5, 1.55, .85]; at = [2.0, .8, -1.9]; cam.fov = 76; }
  else if (VIEW === 'pen') { eye = [-.4, 1.62, 1.5]; at = [X, .5, -1.3]; cam.fov = 76; }
  else if (VIEW === 'loft') { eye = [C.loft.x1 - .7, FL + 1.3, .25]; at = [-X, FL + .5, -.2]; cam.fov = 80; }
  else if (VIEW === 'outside') { eye = [5.5, 1.7, C.d / 2 + 10]; at = [0, 1.8, 0]; cam.fov = 48; }
  else { eye = [1.05, 1.62, 1.6]; at = [-X, .8, -.9]; cam.fov = 80; } }
else if (BRN) { const Z = C.inner.z1, X = C.inner.x1, F1 = C.floors[1];
  if (VIEW === 'stable') { eye = [1.1, 1.62, 1.95]; at = [X, .9, -1.9]; cam.fov = 80; }
  else if (VIEW === 'stair') { eye = [-2.6, 1.62, 1.9]; at = [-X + .4, 1.6, -1.4]; cam.fov = 78; }
  else if (VIEW === 'loft') { eye = [-3.85, F1 + 1.62, -1.6]; at = [X, F1 + 1.1, .2]; cam.fov = 80; }
  else if (VIEW === 'outside') { eye = [6.5, 1.8, C.d / 2 + 13]; at = [0, 2.6, 0]; cam.fov = 48; }
  else { eye = [-1.4, 1.62, 2.05]; at = [-X, 1.0, -1.5]; cam.fov = 80; } }
else if (FRM) { const Z = C.inner.z1, X = C.inner.x1, [F0, F1] = C.floors;
  if (VIEW === 'dresser') { eye = [2.3, F0 + 1.6, .9]; at = [3.9, F0 + 1.3, -Z]; cam.fov = 74; }
  else if (VIEW === 'hall') { eye = [.3, F0 + 1.62, Z - .2]; at = [-.2, F0 + 1.5, -Z]; cam.fov = 76; }
  else if (VIEW === 'parlour') { eye = [-1.15, F0 + 1.62, 2.3]; at = [-X, F0 + .9, -.6]; cam.fov = 78; }
  else if (VIEW === 'stair') { eye = [.45, F1 + 1.62, -2.3]; at = [-.4, F0 + .3, 1.9]; cam.fov = 78; }
  else if (VIEW === 'landing') { eye = [.45, F1 + 1.62, -2.35]; at = [0, F1 + 1.0, Z]; cam.fov = 76; }
  else if (VIEW === 'bedroom') { eye = [-1.25, F1 + 1.62, 2.3]; at = [-X + .4, F1 + .6, -2.0]; cam.fov = 80; }
  else if (VIEW === 'children') { eye = [1.25, F1 + 1.62, -2.2]; at = [X, F1 + .7, 1.6]; cam.fov = 80; }
  else if (VIEW === 'outside') { eye = [6.5, 1.7, C.d / 2 + 13]; at = [0, 3.0, 0]; cam.fov = 48; }
  else { eye = [1.25, F0 + 1.62, 2.35]; at = [X, F0 + .8, -1.0]; cam.fov = 78; } }
else if (TWN) { const Z = C.inner.z1, X = C.inner.x1, [F0, F1, F2] = C.floors, P = C.part;
  if (VIEW === 'parlour') { eye = [P.x - .3, F0 + 1.62, 2.35]; at = [-X, F0 + 1.0, 2.0]; cam.fov = 78; }
  else if (VIEW === 'kitchen') { eye = [P.x - .3, F0 + 1.62, -.4]; at = [-X, F0 + .9, -2.6]; cam.fov = 78; }
  else if (VIEW === 'stair') { eye = [1.3, F1 + 1.62, -.2]; at = [2.2, F0 + .8, -3.6]; cam.fov = 80; }
  else if (VIEW === 'drawing') { eye = [1.85, F1 + 1.62, .7]; at = [-X, F1 + 1.2, 2.6]; cam.fov = 80; }
  else if (VIEW === 'dining') { eye = [P.x - .3, F1 + 1.62, -.3]; at = [-X, F1 + .9, -2.8]; cam.fov = 78; }
  else if (VIEW === 'bedroom') { eye = [1.85, F2 + 1.62, .7]; at = [-X, F2 + .9, 2.8]; cam.fov = 80; }
  else if (VIEW === 'children') { eye = [P.x - .3, F2 + 1.55, -.3]; at = [-X, F2 + .7, -3.0]; cam.fov = 80; }
  else if (VIEW === 'outside') { eye = [5, 1.7, C.d / 2 + 13]; at = [0, 4.3, 0]; cam.fov = 48; }
  else { eye = [C.door.x - .1, F0 + 1.62, Z - .2]; at = [1.6, F0 + 1.2, -Z]; cam.fov = 76; } }
else if (MKT) { const Z = C.inner.z1, X = C.inner.x1, F = C.floor + 1.62;
  if (VIEW === 'table') { eye = [4.6, F, 1.9]; at = [-.6, C.floor + .7, -.3]; cam.fov = 70; }
  else if (VIEW === 'clerk') { eye = [C.part.x - .3, F, Z - .3]; at = [-X, C.floor + .9, -1.4]; cam.fov = 78; }
  else if (VIEW === 'door') { eye = [C.breast.x1 + .7, F, -.2]; at = [X, C.floor + 1.3, C.door.z]; cam.fov = 70; }
  else if (VIEW === 'arcade') { eye = [3.6, 1.62, 2.4]; at = [C.pier.x0, 1.4, 0]; cam.fov = 72; }
  else if (VIEW === 'outside') { eye = [C.w / 2 + 9, 2.0, 9]; at = [0, 4.0, 0]; cam.fov = 50; }
  else { eye = [X - .35, F, C.door.z]; at = [C.breast.x1, C.floor + 1.2, .4]; cam.fov = 74; } }
else if (LIB) { const Z = C.inner.z1, X = C.inner.x1, F = C.floor + 1.62;
  if (VIEW === 'presses') { eye = [-11.6, F, 2.8]; at = [-X, C.floor + 1.2, -3.5]; cam.fov = 70; }
  else if (VIEW === 'table') { eye = [2.4, F + .1, 1.2]; at = [5.6, C.floor + .8, -.6]; cam.fov = 66; }
  else if (VIEW === 'loggia') { eye = [12.6, F, 4.7]; at = [-6, C.floor + 1.4, 4.2]; cam.fov = 66; }
  else if (VIEW === 'outside') { eye = [16, 3, C.front + 20]; at = [0, 6, 0]; cam.fov = 50; }
  else { eye = [0, F, C.screen.z + .3]; at = [0, C.floor + 2.0, -Z]; cam.fov = 76; } }
else if (CHU) { const Z = C.inner.z1, X = C.inner.x1, F = C.floor + 1.62;
  if (VIEW === 'dome') { eye = [1.6, F, 1.8]; at = [-.3, C.oculus.y + 2.5, -.6]; cam.fov = 80; }
  else if (VIEW === 'sanctuary') { eye = [1.6, F, -1.6]; at = [-.6, C.altar.y + 1.3, -Z]; cam.fov = 70; }
  else if (VIEW === 'back') { eye = [-1.6, C.sanctuary.y + 1.62, C.sanctuary.z1 - .3]; at = [.3, C.floor + 1.2, Z]; cam.fov = 72; }
  else if (VIEW === 'outside') { eye = [11, 2.2, C.front + 16]; at = [0, 7, 0]; cam.fov = 50; }
  else { eye = [0, F, Z - .3]; at = [0, C.altar.y + 1.4, -Z]; cam.fov = 72; } }
else if (TMP) { const Z = C.inner.z1, X = C.inner.x1, F = C.floor + 1.62, S = C.statue;
  if (VIEW === 'statue') { eye = [C.pray[0], F, .9]; at = [S.x, S.y0 + 1.1, 0]; cam.fov = 60; }
  else if (VIEW === 'door') { eye = [C.dais.x0 + .4, C.dais.y + 1.62, -1.2]; at = [-X, C.floor + .9, .3]; cam.fov = 72; }
  else if (VIEW === 'ledge') { eye = [-2.6, F, .9]; at = [.4, C.floor + 1.0, -Z]; cam.fov = 72; }
  else if (VIEW === 'outside') { eye = [-C.w / 2 - 9, 1.7, 5.5]; at = [0, 2.8, 0]; cam.fov = 45; }
  else { eye = [-X + .25, F, .25]; at = [S.x, S.y0 + .8, 0]; cam.fov = 66; } }
else if (GLD) { const Z = C.inner.z1, X = C.inner.x1, [F0, F1] = C.floors, P = C.part;
  if (VIEW === 'table') { eye = [-1.0, F0 + 1.62, 2.4]; at = [-X, F0 + 1.3, .3]; cam.fov = 72; }
  else if (VIEW === 'east') { eye = [-3.4, F0 + 1.62, 1.9]; at = [P.x0, F0 + 2.3, -.8]; cam.fov = 74; }
  else if (VIEW === 'roof') { eye = [-5.2, F0 + 1.62, 2.6]; at = [0, 7.6, -.3]; cam.fov = 74; }
  else if (VIEW === 'gallery') { eye = [-X + .5, F1 + 1.62, C.gallery.z0 + .7]; at = [P.x0, F1 - .4, 1.4]; cam.fov = 74; }
  else if (VIEW === 'dorm') { eye = [P.x1 + .4, F1 + 1.62, (C.doors.dorm.z0 + C.doors.dorm.z1) / 2]; at = [X, F1 + .3, 2.2]; cam.fov = 72; }
  else if (VIEW === 'steward') { eye = [P.x1 + .45, F0 + 1.62, (C.doors.steward.z0 + C.doors.steward.z1) / 2]; at = [X, F0 + .8, -1.2]; cam.fov = 72; }
  else if (VIEW === 'outside') { eye = [6.0, 1.7, C.d / 2 + 13]; at = [0, 3.4, 0]; cam.fov = 48; }
  else if (VIEW === 'still') { eye = [-2.9, F0 + 1.62, .6]; at = [.6, F0 + .9, Z - .4]; cam.fov = 70; }
  else { eye = [C.door.x + .3, F0 + 1.62, Z - .3]; at = [-1.1, F0 + 2.0, -Z]; cam.fov = 74; } }
else if (AAPO) { const Z = C.inner.z1, X = C.inner.x1, F = C.floor + 1.62, Fu = C.furnace;
  if (VIEW === 'still') { eye = [1.9, F, .9]; at = [Fu.x0 + .3, C.floor + 1.0, Fu.z0 + .4]; cam.fov = 66; }
  else if (VIEW === 'bench') { eye = [.9, F, -1.0]; at = [X, C.floor + 1.0, .5]; cam.fov = 70; }
  else if (VIEW === 'stall') { eye = [-3.6, 1.65, C.d / 2 + 4.6]; at = [-1.6, 1.0, C.d / 2 + .5]; cam.fov = 50; }
  else if (VIEW === 'outside') { eye = [6.5, 2.0, C.d / 2 + 11]; at = [0, 2.2, 0]; cam.fov = 45; }
  else { eye = [C.door.x + .3, F, Z - .2]; at = [-1.2, C.floor + 1.2, -Z]; cam.fov = 70; } }
else if (MAPO) { const Z = C.inner.z1, X = C.inner.x1, F = C.floor + 1.62, T = C.still.trough;
  if (VIEW === 'still') { eye = [-.9, F, .3]; at = [1.4, C.floor + .5, T.z]; cam.fov = 70; }
  else if (VIEW === 'table') { eye = [.2, F, 2.2]; at = [-X, C.floor + .8, -.2]; cam.fov = 70; }
  else if (VIEW === 'bench') { eye = [.3, F, -.6]; at = [X, C.floor + 1.3, .3]; cam.fov = 70; }
  else if (VIEW === 'outside') { eye = [6.5, 2.2, C.d / 2 + 9]; at = [0, 2.6, 0]; cam.fov = 45; }
  else { eye = [-.3, F, Z - .2]; at = [.2, C.floor + .8, C.louver - .6]; cam.fov = 70; } }
else if (APO) { const Z = C.inner.z1, X = C.inner.x1, F = 1.62, S = C.still;
  if (VIEW === 'still') { eye = [2.3, F, 1.2]; at = [S.furnace.x0 + .3, .9, .3]; cam.fov = 66; }
  else if (VIEW === 'bench') { eye = [1.6, F, .6]; at = [2.6, 1.2, -Z]; cam.fov = 70; }
  else if (VIEW === 'store') { eye = [-2.25, F, -1.6]; at = [-4.0, .9, .2]; cam.fov = 76; }
  else if (VIEW === 'outside') { eye = [5.0, 1.65, C.d / 2 + 8.5]; at = [.3, 1.9, 0]; cam.fov = 45; }
  else { eye = [C.door.x, F, Z - .15]; at = [X, 1.0, -.9]; cam.fov = 70; } }
else if (ASM) { const Z = C.inner.z1, F = C.floor + 1.62, A = C.anvil, Hh2 = C.hearth;
  if (VIEW === 'anvil') { eye = [A.x + .9, F, A.z + .7]; at = [Hh2.x0 + .4, Hh2.y + .1, Hh2.z0 + .3]; cam.fov = 66; }
  else if (VIEW === 'stall') { eye = [-3.6, 1.65, C.d / 2 + 4.6]; at = [-1.6, 1.0, C.d / 2 + .5]; cam.fov = 50; }
  else if (VIEW === 'outside') { eye = [6.5, 2.0, C.d / 2 + 11]; at = [0, 2.2, 0]; cam.fov = 45; }
  else { eye = [C.door.x + .2, F, Z + .2]; at = [Hh2.x0 + .6, C.floor + 1.1, Hh2.z0 + .4]; cam.fov = 70; } }
else if (SMI) { const Z = C.inner.z1, X = C.inner.x1, F = C.floor + 1.62, A = C.anvil, Hh2 = C.hearth;
  if (VIEW === 'bellows') { eye = [1.35, F, Hh2.z0 - 1.9]; at = [-.25, C.floor + .45, Hh2.z0 - .2]; cam.fov = 66; }
  else if (VIEW === 'bench') { eye = [-.7, F, -.3]; at = [X, C.floor + .8, (C.bench.z0 + C.bench.z1) / 2]; cam.fov = 70; }
  else if (VIEW === 'outside') { eye = [6.5, 2.2, C.d / 2 + 9]; at = [0, 2.6, 0]; cam.fov = 45; }
  else { eye = [.35, F, Z - .2]; at = [-.1, C.floor + .9, Hh2.z0 - .6]; cam.fov = 68; } }
else if (FRG) { const Z = C.inner.z1, X = C.inner.x1, F = C.floor + 1.62, A = C.anvil;
  if (VIEW === 'anvil') { eye = [A.x + .85, F, A.z + .9]; at = [C.fire[0], C.hearth.y + .2, C.fire[2] - .1]; cam.fov = 66; }
  else if (VIEW === 'bench') { eye = [1.6, F, .9]; at = [-1.2, 1.1, -Z]; cam.fov = 70; }
  else if (VIEW === 'outside') { eye = [5.5, 1.7, C.d / 2 + 9]; at = [0, 2.0, 0]; cam.fov = 45; }
  else { eye = [C.door.x + .4, F, Z + .1]; at = [C.hearth.x1 - .3, 1.0, -.6]; cam.fov = 70; } }
else if (CRT) { const S = C.sh, [F0, F1] = C.floors, A = S.A;
  if (VIEW === 'gallery') { eye = [2.95, F1 + 1.62, 2.95]; at = [-2.4, F1 - .9, -2.4]; cam.fov = 72; }
  else if (VIEW === 'hall') { eye = [.6, F0 + 1.62, -3.95]; at = [-4.5, F0 + .6, -6.6]; cam.fov = 72; }
  else if (VIEW === 'kitchen') { eye = [2.3, F0 + 1.62, 3.95]; at = [5.4, F0 + 1.0, A]; cam.fov = 72; }
  else if (VIEW === 'bedroom') { eye = [-.4, F1 + 1.62, -3.95]; at = [2.5, F1 + .5, -A]; cam.fov = 72; }
  else if (VIEW === 'study') { eye = [2.35, F1 + 1.62, 3.95]; at = [4.5, F1 + .6, A]; cam.fov = 72; }
  else if (VIEW === 'children') { eye = [-2.3, F1 + 1.62, 3.95]; at = [-5.5, F1 + .4, A]; cam.fov = 72; }
  else if (VIEW === 'outside') { eye = [7, 1.7, C.d / 2 + 13]; at = [0, 3.4, 0]; cam.fov = 45; }
  else if (VIEW === 'above') { eye = [13, 20, 17]; at = [0, 2.5, 0]; cam.fov = 45; }
  else { eye = [0, F0 + 1.62, A - .25]; at = [0, F0 + 1.1, -6]; cam.fov = 66; } }
else if (TAV) { const Z = C.inner.z1, T = C.terrace;
  if (VIEW === 'tap') { eye = [C.door.x + .3, C.floor + 1.62, Z - .2]; at = [-.6, C.floor + 1.0, -Z]; cam.fov = 66; }
  else if (VIEW === 'pergola') { eye = [-2.0, T.y + 1.62, T.z1 - .5]; at = [.6, T.y + 1.4, C.d / 2]; cam.fov = 66; }
  else if (VIEW === 'outside') { eye = [10, 5.5, 25]; at = [0, 1.4, 3]; cam.fov = 45; }
  else { eye = [C.door.x - .2, C.floor + 1.62, C.d / 2 - .1]; at = [.8, T.y + .4, T.z1 + 4]; cam.fov = 66; } }
else if (INN) { const Z = C.inner.z1, X = C.inner.x1, [F0, F1] = C.floors;
  if (VIEW === 'bar') { eye = [1.6, F0 + 1.62, 1.6]; at = [-.3, F0 + 1.1, -Z]; }
  else if (VIEW === 'hearth') { eye = [C.settle.x1 + .5, F0 + 1.5, 1.6]; at = [C.hearth[0] - .2, F0 + .6, -.1]; }
  else if (VIEW === 'upstairs') { eye = [X - .45, F1 + 1.62, (C.stair.z0 - C.inner.z1) / 2 + .1]; at = [-X, F1 + 1.1, (C.passage + C.inner.z0) / 2]; cam.fov = 66; }
  else if (VIEW === 'chamber') { const R0 = C.rooms[1]; eye = [R0.door.x - .1, F1 + 1.62, C.passage + .2]; at = [R0.door.x - .2, F1 + .6, Z]; cam.fov = 70; }
  else if (VIEW === 'outside') { eye = [5.5, 1.7, C.d / 2 + 10]; at = [0, 2.6, 0]; cam.fov = 45; }
  else { eye = [1.2, F0 + 1.62, -1.75]; at = [C.hearth[0] - .3, F0 + .9, .9]; cam.fov = 66; } }
else if (HOME) { const Z = C.inner.z1, X = C.inner.x1, [F0, F1, F2] = C.floors, ds = C.door.x < 0 ? -1 : 1;
  if (VIEW === 'stair') { eye = [C.door.x, F0 + 1.62, 1.6]; at = [C.stair.x0 + 1.2, F0 + 1.2, -Z]; cam.fov = 70; }
  else if (VIEW === 'flat') { eye = [X - .45, F1 + 1.62, -2.0]; at = [-2.2, F1 + .6, Z - .6]; cam.fov = 70; }
  else if (VIEW === 'kitchen') { eye = [.3, F1 + 1.6, -.6]; at = [X, F1 + 1.0, 1.8]; cam.fov = 66; }
  else if (VIEW === 'roof') { eye = [-1.9, F2 + 1.62, -2.9]; at = [2.0, F2 + .8, 2.6]; cam.fov = 70; }
  else if (VIEW === 'outside') { eye = [5.5, 1.7, C.d / 2 + 10]; at = [0, 3.0, 0]; cam.fov = 45; }
  else { eye = [C.door.x, F0 + 1.62, Z - .2]; at = [-ds * (X - 1.0), F0 + 1.0, -1.2]; cam.fov = 70; } }
else if (ALE) { const Z = C.inner.z1, F = C.floor + 1.62, T = C.tables[1];
  if (VIEW === 'tables') { eye = [T.x1 + .35, F, T.z1 + .4]; at = [T.x0 - .2, C.floor + .7, T.z0 + 2]; cam.fov = 66; }
  else if (VIEW === 'counter') { eye = [1.0, F, C.counter.z1 + 3.2]; at = [-.3, C.floor + 1.0, -Z]; cam.fov = 66; }
  else if (VIEW === 'outside') { eye = [15, 3.2, C.d / 2 + 17]; at = [0, 3.0, 0]; cam.fov = 45; }
  else { eye = [.4, F, Z - .4]; at = [-.4, C.floor + 1.0, C.hearth.z0 - 2]; cam.fov = 66; } }
else if (LONG) { const Z = C.inner.z1, F = C.floor + 1.62;
  if (VIEW === 'hearth') { eye = [-2.0, F, C.fire[2] + 2.2]; at = [1.8, C.floor + .5, C.fire[2] - 1.2]; }
  else if (VIEW === 'larder') { eye = [-.6, F, Z - 3.6]; at = [1.6, C.floor + 1.3, Z - .4]; }
  else if (VIEW === 'back') { eye = [C.doors[0].x + .1, F, C.partition - .4]; at = [-1.8, C.floor + .4, -Z + .9]; cam.fov = 70; }
  else if (VIEW === 'outside') { eye = [7.5, 1.9, C.d / 2 + 9]; at = [0, 2.6, 0]; cam.fov = 45; }
  else { eye = [.3, F, Z - .4]; at = [-.2, C.floor + 1.0, C.partition]; } }
else if (VIEW === 'table') { eye = [C.fire[0] + 1.1, 1.62, C.fire[2] - .4]; at = [1.9, .9, .6]; }
else if (VIEW === 'dresser') { eye = [.6, 1.6, 1.0]; at = [-.6, 1.3, -2.1]; }
else if (VIEW === 'outside') { eye = [6.5, 1.65, 11]; at = [0, 2.2, 0]; cam.fov = 45; }
else { eye = [2.2, 1.62, 1.75]; at = [C.hearth[0], .9, C.hearth[2]]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.room = { room: ROOM, view: VIEW, hour: HOUR, tris: C.tris, draws: C.draws, shellTris: C.shellTris, shellCalls: C.shellCalls };
run(makeComposer(R, scene, cam, { bloom: .14, sat: 1.0, vig: .3 }), cam);
