// The coaching inn halfway along a coach road, enterable (Session 237; the driver and travellers, Session 238; Michael, issue #24, A): a keeper of the country
// it stands in, a meal and a drink, one room to let, the coach's board by the door and a tack corner. Before, the inn
// was a shell you couldn't go into, with its drawn door facing away from the road.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const r = await page.evaluate(() => {
  worldState.lairs = new Proxy({}, { get: () => true }); worldState.routes = {};
  const C0 = WORLD.coaches(); let key = null, line = null;
  const town = s => s && /town|city|port/.test(s.kind);
  for (const d of WORLD.ROAD_DEFS) { const a = WORLD.siteAnywhere(d.a), b = WORLD.siteAnywhere(d.b); if (!town(a) || !town(b)) continue;
    const k = d.a < d.b ? d.a + '|' + d.b : d.b + '|' + d.a; C0[k] = { a: d.a, b: d.b }; px = (a.x + b.x) / 2; pz = (a.z + b.z) / 2;
    WORLD.tick(1 / 60, performance.now()); const C = WORLD.coachLines.get(k); if (C) { key = k; line = C; break; } delete C0[k]; }
  if (!line) return { key: null };
  const h = ZONES.world.houses.find(x => x.coachInn === key); window._ci = h; window._key = key;
  if (!h) return { key, house: null };
  // which way the door faces: from the inn toward the road, and toward where the coach draws up
  const ix = h.innX, iz = h.innZ; const toRoad = Math.hypot(h.exitX - ix, h.exitZ - iz) > Math.hypot(h.doorX - ix, h.doorZ - iz);
  line.u = .5; WORLD.tick(1 / 60, performance.now());
  const doorToStop = Math.hypot(h.doorX - line.cart.position.x, h.doorZ - line.cart.position.z), innToStop = Math.hypot(ix - line.cart.position.x, iz - line.cart.position.z);
  // the building itself: in the line's group, and solid (Session 239: a comment had swallowed both since 237)
  const innMesh = line.group.children.find(o => o.isMesh && Math.hypot(o.position.x - ix, o.position.z - iz) < .5);
  const fz = innMesh ? new THREE.Vector3(0, 0, 1).applyQuaternion(innMesh.quaternion) : null; const drawnGap = fz ? +Math.hypot(ix + fz.x * 3.4 - h.doorX, iz + fz.z * 3.4 - h.doorZ).toFixed(2) : null;
  const solid = WORLD.solidAt(ix, iz);
  return { key, built: !!innMesh, solid, drawnGap, name: h.name, keeper: h.keeper, len: Math.round(line.len), toRoad, doorCloserToStop: doorToStop < innToStop, doorToStop: +doorToStop.toFixed(1), innToStop: +innToStop.toFixed(1), board: h._board };
});
console.log(JSON.stringify(r));
check('a coaching road was raised and its inn registered as a house', !!r.key && !!r.name, r);
check('its door is on the road side, facing where the coach draws up', r.toRoad && r.doorCloserToStop, r);
check('the building stands and is solid, and its drawn door is where the house\u2019s door is', r.built && r.solid && r.drawnGap != null && r.drawnGap < .1, { built: r.built, solid: r.solid, drawnGap: r.drawnGap });
// walk to the door at noon and press E
await page.evaluate(() => { forceTime(12); const h = _ci; px = h.exitX + (h.doorX - h.exitX) * .7; pz = h.exitZ + (h.doorZ - h.exitZ) * .7; jumpY = WORLD.worldH(px, pz); yaw = h.exitYaw + Math.PI; });
await g.frames(3);
const prompt = await page.evaluate(() => document.getElementById('ipr').textContent);
await page.keyboard.press('e'); await page.waitForTimeout(3000); await g.frames(2);
const inside = await page.evaluate(() => ({ inside: currentHouse === _ci, zone: activeZoneId, coaching: !!(currentHouse && currentHouse._coaching), keeper: !!intNPCMesh, W: currentHouse && currentHouse.intW, D: currentHouse && currentHouse.intD }));
console.log(JSON.stringify({ prompt, inside }));
check('E at the door takes you in', /Press 'E'|enter/i.test(prompt) && inside.inside, { prompt, inside });
check('inside: the coach board and tack corner, and the keeper at noon', inside.coaching && inside.keeper, inside);
// the common room (S238): the coach's driver and a traveller or two, standing clear of the furniture
const folk = await page.evaluate(() => WORLD.intNpcs.map(n => ({ name: n.def.name, role: n.def.role, x: +n.g.position.x.toFixed(2), z: +n.g.position.z.toFixed(2), inSolid: intSolidAt(n.g.position.x, n.g.position.z, .3, 0) })));
console.log(JSON.stringify(folk));
check('the driver and one or two travellers wait in the common room, none of them in the furniture', folk.filter(f => f.role === 'Coach Driver').length === 1 && folk.filter(f => f.role === 'Traveller').length >= 1 && folk.length <= 3 && folk.every(f => !f.inSolid), folk);
await page.evaluate(() => { const d = WORLD.intNpcs.find(n => n.def.role === 'Coach Driver'); window._drv = d; d.walk = false; d.wt = 99; px = d.g.position.x; pz = d.g.position.z + 1.0; jumpY = 0; if (intNPCMesh) { intNPCPos = { x: -99, z: -99 }; } });
await g.frames(2); await page.evaluate(() => { px = _drv.g.position.x; pz = _drv.g.position.z + 1.0; jumpY = 0; }); await page.keyboard.press('e'); await g.frames(2);
const drv = await page.evaluate(() => ({ open: dlgOpen, name: document.getElementById('dlg-name').textContent, choices: [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim()) }));
console.log(JSON.stringify(drv));
check('E by the driver talks to them: when the coach leaves, and the road', drv.open && drv.name === folk.find(f => f.role === 'Coach Driver').name && drv.choices.some(c => /coach leave/.test(c)) && drv.choices.some(c => /road/.test(c)), drv);
await page.evaluate(() => { try { closeDialog(); } catch (e) {} });
// back to the keeper's own spot for the rest of the test
await page.evaluate(() => exitInterior()); await page.waitForTimeout(2500); await g.hide();
await page.evaluate(() => { const h = _ci; px = h.exitX + (h.doorX - h.exitX) * .7; pz = h.exitZ + (h.doorZ - h.exitZ) * .7; jumpY = WORLD.worldH(px, pz); yaw = h.exitYaw + Math.PI; });
await g.frames(3); await page.keyboard.press('e'); await page.waitForTimeout(3000); await g.frames(2);
const folk2 = await page.evaluate(() => WORLD.intNpcs.map(n => n.def.name));
check('the same people on a second visit the same day', folk2.join() === folk.map(f => f.name).join(), { first: folk.map(f => f.name), second: folk2 });
// talk to the keeper
await page.evaluate(() => { px = intNPCPos.x; pz = intNPCPos.z + 1.2; jumpY = 0; });
await g.frames(2); await page.keyboard.press('e'); await g.frames(2);
const talk = await page.evaluate(() => ({ open: dlgOpen, name: document.getElementById('dlg-name').textContent, role: document.getElementById('dlg-role').textContent, choices: [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim()) }));
console.log(JSON.stringify(talk));
check('the keeper is the inn’s own, with a meal, a bed and the coach', talk.open && talk.name === r.keeper && talk.role === 'Innkeeper' && ['eat and drink', 'bed for the night', 'coach come through'].every(k => talk.choices.some(c => c.includes(k))), talk);
const pick = (re) => page.evaluate((src) => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src).test(x.textContent)); if (b) b.click(); return !!b; }, re);
await pick('coach come through'); await g.frames(2);
const board = await page.evaluate(() => document.getElementById('dlg-text').textContent);
await page.evaluate(() => { try { closeDialog(); } catch (e) {} }); await page.keyboard.press('Escape');
await page.evaluate(() => { px = intNPCPos.x; pz = intNPCPos.z + 1.2; jumpY = 0; }); await g.frames(2); await page.keyboard.press('e'); await g.frames(2);
await pick('bed for the night'); await g.frames(2);
const offer = await page.evaluate(() => document.getElementById('dlg-text').textContent);
const g0 = await page.evaluate(() => { gold = Math.max(gold, 100); return gold; });
await pick('^\\d+\\. Yes\\.'); await g.frames(2);
const rent = await page.evaluate((g0) => ({ rented: worldState.rented, paid: g0 - gold, reply: document.getElementById('dlg-text').textContent }), g0);
console.log(JSON.stringify({ board, offer, rent }));
check('the board: when each coach calls here', /calls here about 6:\d\d/.test(board) && /calls here about 18:\d\d/.test(board), board);
check('one room to let, the rest held by travellers', /guests in tonight|other guest in tonight/.test(offer) && rent.rented && rent.rented.id === 'g_coach_' + r.key && rent.paid > 0, { offer, rent });
await page.evaluate(() => { try { closeDialog(); } catch (e) {} });
// out again, then the line torn down and rebuilt: the same inn
await page.evaluate(() => exitInterior()); await page.waitForTimeout(3000); await g.hide();
const out = await page.evaluate(() => ({ zone: activeZoneId, nearDoor: +Math.hypot(px - _ci.exitX, pz - _ci.exitZ).toFixed(2) }));
const again = await page.evaluate(() => { const key = _key; const L = WORLD.coachLines; const C = L.get(key); WORLD.tick(1 / 60, performance.now());
  const before = ZONES.world.houses.filter(x => x.coachInn === key).length;
  px += 5000; WORLD.tick(1 / 60, performance.now()); const gone = !L.get(key) && !ZONES.world.houses.some(x => x.coachInn === key);
  px -= 5000; WORLD.tick(1 / 60, performance.now()); const h = ZONES.world.houses.find(x => x.coachInn === key);
  return { before, gone, back: !!h, same: !!h && h.name === _ci.name && h.keeper === _ci.keeper, count: ZONES.world.houses.filter(x => x.coachInn === key).length }; });
console.log(JSON.stringify({ out, again }));
await page.evaluate(() => { forceTime(3); const h = _ci; px = h.exitX + (h.doorX - h.exitX) * .7; pz = h.exitZ + (h.doorZ - h.exitZ) * .7; jumpY = WORLD.worldH(px, pz); yaw = h.exitYaw + Math.PI; });
await g.frames(3); await page.keyboard.press('e'); await page.waitForTimeout(3000); await g.frames(2);
const night = await page.evaluate(() => ({ inside: currentHouse === _ci, folk: WORLD.intNpcs.length, keeper: !!intNPCMesh }));
await page.evaluate(() => exitInterior()); await page.waitForTimeout(2500); await g.hide();
check('at 3h, with the inn\u2019s fire out, nobody waits (the door still opens)', night.inside && night.folk === 0 && !night.keeper, night);
check('leaving puts you outside the door', out.zone === 'world' && out.nearDoor < 1.5, out);
check('the inn leaves with its coach line and comes back the same inn, once', again.before === 1 && again.gone && again.back && again.same && again.count === 1, again);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
