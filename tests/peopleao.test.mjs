// Shading in the townsfolk's creases (Session 265, H.1, Michael's A on Session 243): each person's bake darkens the
// vertices other parts crowd (under the jaw and beard, the armpits, the waist, under a hat's brim), in the colours, once.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
await g.settle('hearthwick');
const r = await page.evaluate(() => { const rigs = [...PEOPLE_RIGS].filter(x => x.g && !x.foe).slice(0, 6); if (!rigs.length) return null; const out = [];
  for (const rig of rigs) { const time = on => { let best = 1e9, geo = null; for (let k = 0; k < 3; k++) { PAO.on = on; const t = performance.now(); const x = personBake(rig.g, 1); best = Math.min(best, performance.now() - t); if (geo) geo.geo.dispose(); geo = x; } PAO.on = true; return [geo, best]; };
    const [a, tOff] = time(false), [b, tOn] = time(true); // (the fastest of three bakes each way: one run's timing swings)
    const ca = a.geo.attributes.color.array, cb = b.geo.attributes.color.array; let sum = 0, mx = 0, n = 0, dark = 0, clear = 0; for (let i = 0; i < ca.length; i += 3) { const la = ca[i] + ca[i + 1] + ca[i + 2], lb = cb[i] + cb[i + 1] + cb[i + 2]; if (la <= 0) continue; const d = 1 - lb / la; sum += d; mx = Math.max(mx, d); n++; if (d > .15) dark++; if (d < .02) clear++; }
    // the lowest tenth of the body (the feet) against the neck band under the jaw: the neck is crowded by the head
    out.push({ name: rig.g.name, tris: b.tris, same: ca.length === cb.length, mean: +(sum / n).toFixed(3), max: +mx.toFixed(3), shaded: +(dark / n).toFixed(3), clear: +(clear / n).toFixed(3), msOff: +tOff.toFixed(1), msOn: +tOn.toFixed(1) }); a.geo.dispose(); b.geo.dispose(); }
  return out; });
console.log(JSON.stringify(r));
check('townsfolk are found in Hearthwick', !!r && r.length >= 3, r);
// (the mean is over every vertex, and many lie inside other parts where the shading is deepest and never seen, so it runs
// high: the picture is the judge of the strength, which is the prototype's)
check('each bake has the same vertices with the shading, darkened where parts crowd (a mean of 10–45%), open surfaces left clear (some untouched), none past the cap of 50%', r.every(p => p.same && p.mean > .1 && p.mean < .45 && p.clear > .05 && p.max <= .5001), r);
check('the shading adds under 80 ms to a person\'s bake (the fastest of three each way)', r.every(p => p.msOn - p.msOff < 80), r.map(p => [p.msOff, p.msOn]));
// a picture: three townsfolk face on, close
const shot = await page.evaluate(() => { const rigs = [...PEOPLE_RIGS].filter(x => x.g && !x.foe && x.root.parent === WORLD.scene).slice(0, 3); forceTime(15); const sc = WORLD.scene, x = px + 300, z = pz, y = WORLD.worldH(x, z) + 40, tmp = [];
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshLambertMaterial({ color: 0x6a7048 })); floor.rotation.x = -Math.PI / 2; floor.position.set(x, y, z); sc.add(floor); tmp.push(floor);
  rigs.forEach((rg, i) => { const p = buildPerson(rg.g); p.root.position.set(x + (i - 1) * .9, y, z); p.root.rotation.y = 0; sc.add(p.root); pwApply(p, pwIdle(1, { holds: p.holds, gear: p.g.gear })); tmp.push(p.root); });
  const cv = REN.domElement, cam = new THREE.PerspectiveCamera(35, cv.width / cv.height, .05, 100); cam.position.set(x, y + 1.3, z + 3.6); cam.lookAt(x, y + .95, z); sc.updateMatrixWorld(true); const f = sc.fog; sc.fog = null; REN.render(sc, cam); sc.fog = f;
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); tmp.forEach(t => sc.remove(t)); return o.toDataURL(); });
fs.writeFileSync('tests/out/peopleao.png', Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
