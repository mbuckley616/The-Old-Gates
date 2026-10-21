// The keeper's room at the back of the shop (Session 1258, backlog I, the critic's s782): in every kit shop with a keeper's room
// the street door opened into it, so you stood 2.2 m inside the door beside the bed and the strongbox, with the counter and the
// keeper 7.8 m off beyond a shut door. The room is now the north end, behind the counter. Measured in every shop with one in
// Portclare and Dunmore, at true size: where the game stands you, the partition, the box and the bed; a 0.1 m flood of the floor
// from the arrival spot with the inner door shut and open; the door's swing on both sides; the keeper's amble.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const rows = [];
for (const id of ['portclare', 'dunmore']) { await g.settle(id);
  rows.push(...await page.evaluate((id) => { forceTime(13); const S = WORLD.settle.get(id), out = [], KR = SCALE.ROOM_K;
    for (const h of S.houses) { if (!/weapon|armor|potion|misc|shipwright/.test(h.type)) continue; WORLD.buildInteriorFor(h); if (!h._backRoom) continue;
      const W = h.intW, D = h.intD, part = h._shopZ * KR, X = WORLD.intBox, ax = W / 2, az = intArrivalZ(h);
      const door = INT_DOORS.slice().sort((a, b) => Math.abs(a.z - part) - Math.abs(b.z - part))[0];
      const doorSol = new Set(INT_DOORS.map(d => d.sol)), R = .3, st = .1, nx = Math.ceil(W / st), nz = Math.ceil(D / st);
      const flood = (open) => { const B = INT_SOL.filter(o => (open ? !doorSol.has(o) : true) && (o.y1 == null || o.y1 > .05) && (o.y0 == null || o.y0 < 1.0));
        const free = (i, k) => { if (i < 0 || k < 0 || i >= nx || k >= nz) return false; const x = i * st, z = k * st; for (const o of B) if (x > o.x0 - R && x < o.x1 + R && z > o.z0 - R && z < o.z1 + R) return false; return true; };
        const seen = new Uint8Array(nx * nz), q = []; let si = Math.round(ax / st), sk = Math.round(az / st); const start = free(si, sk);
        if (start) { seen[sk * nx + si] = 1; q.push(si, sk); }
        let box = 1e9, doorShop = 1e9, north = 0;
        while (q.length) { const k = q.pop(), i = q.pop(), x = i * st, z = k * st; box = Math.min(box, Math.hypot(x - X.x, z - X.z)); if (z > part) doorShop = Math.min(doorShop, Math.hypot(x - door.x, z - door.z)); if (z < part - .2) north++;
          for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const i2 = i + a, k2 = k + b; if (seen[k2 * nx + i2] || !free(i2, k2)) continue; seen[k2 * nx + i2] = 1; q.push(i2, k2); } }
        return { start, box: +box.toFixed(2), doorShop: +doorShop.toFixed(2), north }; };
      const shut = flood(false), open = flood(true);
      // the door's swing: a leaf of 1.34 in the kit's unit, either way; nothing but the partition and the door within it
      const lw = 1.34 * KR, swing = INT_SOL.filter(o => !doorSol.has(o) && !(o.z0 > part - .25 && o.z1 < part + .25) && (o.y1 == null || o.y1 > .05) && o.x1 > door.x - lw / 2 && o.x0 < door.x + lw / 2 && o.z1 > part - lw && o.z0 < part + lw)
        .map(o => [o.x0, o.x1, o.z0, o.z1].map(v => +v.toFixed(2)));
      const am = intNPCMesh && intNPCMesh.userData.amble;
      out.push({ town: id, name: h.name, type: h.type, W: +W.toFixed(2), D: +D.toFixed(2), part: +part.toFixed(2), arrive: +az.toFixed(2), box: [+X.x.toFixed(2), +X.z.toFixed(2)],
        beds: INT_BEDS.map(b => +b.z.toFixed(2)), door: [+door.x.toFixed(2), +door.z.toFixed(2)], counterFront: h._counterFront && +h._counterFront.toFixed(2), shut, open, swing,
        amble: am ? [+am.minZ.toFixed(2), +am.maxZ.toFixed(2)] : null, fromDoor: +Math.hypot(ax - X.x, az - X.z).toFixed(2), hatch: h._hatch ? [+h._hatch.x.toFixed(2), +h._hatch.z.toFixed(2)] : null }); }
    return out; }, id)); }
for (const r of rows) console.log(' ', JSON.stringify(r));
check('there are kit shops with a keeper\'s room to judge (Portclare\'s five and Dunmore\'s)', rows.length >= 8, rows.length);
check('the street door opens on the shop: the arrival spot is south of the partition, on free floor, past the counter\'s front', rows.every(r => r.arrive > r.part + .5 && r.shut.start && r.arrive > r.counterFront), rows.filter(r => !(r.arrive > r.part + .5 && r.shut.start && r.arrive > r.counterFront)));
check('the strongbox and the keeper\'s bed are behind the partition, at the north end', rows.every(r => r.box[1] < r.part - .3 && r.beds.length && r.beds.every(z => z < r.part)), rows.map(r => ({ n: r.name, part: r.part, box: r.box, beds: r.beds })));
check('the box is over 7 m from where you come in (it was 2.2)', rows.every(r => r.fromDoor > 7), rows.map(r => r.fromDoor));
check('with the room\'s door shut nothing north of the partition is walked to, and its door is reached from the shop (within 1 m)', rows.every(r => r.shut.north === 0 && r.shut.box > 1.6 && r.shut.doorShop < 1.0), rows.map(r => ({ n: r.name, shut: r.shut })));
check('with it open the box is walked up to and opened (within 1.6 m)', rows.every(r => r.open.box <= 1.6 && r.open.north > 50), rows.map(r => ({ n: r.name, open: r.open })));
check('the door swings clear on both sides (no solid but the partition within its 1.94 m leaf)', rows.every(r => !r.swing.length), rows.filter(r => r.swing.length).map(r => ({ n: r.name, type: r.type, door: r.door, swing: r.swing })));
check('a keeper indoors ambles on the shop side of the partition', rows.every(r => !r.amble || r.amble[0] > r.part), rows.map(r => r.amble));
// two pictures of Portclare's first: from the arrival spot looking to the counter, and the keeper's room from its door
await g.settle('portclare');
const shot = await page.evaluate(() => { const S = WORLD.settle.get('portclare'), h = S.houses.find(x => /weapon|armor|potion|misc/.test(x.type) && (WORLD.buildInteriorFor(x), x._backRoom)); if (!h) return null;
  const sc = WORLD.buildInteriorFor(h), KR = SCALE.ROOM_K, W = h.intW, D = h.intD, part = h._shopZ * KR, door = INT_DOORS.slice().sort((a, b) => Math.abs(a.z - part) - Math.abs(b.z - part))[0];
  door.g.rotation.y += Math.PI / 2; const cv = REN.domElement, CW = cv.width, CH = cv.height, cam = new THREE.PerspectiveCamera(66, CW / CH, .05, 80), c = document.createElement('canvas'); c.width = CW; c.height = CH / 2; const x = c.getContext('2d');
  [[W / 2, 1.65, intArrivalZ(h), W / 2, 1.1, 0], [door.x, 1.65, part + .9, W / 2, .6, .2]].forEach((v, i) => { cam.position.set(v[0], v[1], v[2]); cam.lookAt(v[3], v[4], v[5]); sc.updateMatrixWorld(true); REN.render(sc, cam); x.drawImage(cv, 0, 0, CW, CH, i * CW / 2, 0, CW / 2, CH / 2); });
  return { name: h.name, type: h.type, url: c.toDataURL() }; });
if (shot) { fs.mkdirSync('tests/out', { recursive: true }); fs.writeFileSync('tests/out/shopback.png', Buffer.from(shot.url.split(',')[1], 'base64')); console.log('  picture:', shot.name, shot.type, 'tests/out/shopback.png'); }
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
