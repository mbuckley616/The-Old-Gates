// The barber sees his own strongbox (Session 590; the critic, 6 Oct, s455). The barber stands still at his chair facing
// into the room (Session 512), and indoors a witness sees you within six units and 60° of the way they face (Session 368).
// The box stood at W−1, D×.55 (Session 551), 6.8–8.5 from him, and was picked unseen at noon. It now stands against the
// west wall in front of him. Measured in the barbers of the towns nearest the start: every spot from which the box can be
// opened, in his sight, at noon.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const shops = await page.evaluate(() => { const out = [];
  const c = WORLD.SITES.filter(t => t.pad && ['city', 'town'].includes(t.kind)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  for (const t of c.slice(0, 10)) { const S = WORLD.settlements.get(t.id) || WORLD.genSettlement(t); const h = S && S.houses.find(x => x.type === 'barber'); if (h) { out.push({ site: t.id, id: h.id }); (window._bh || (window._bh = {}))[h.id] = h; } }
  return out; });
console.log(JSON.stringify(shops));

const rows = [];
for (const s of shops.slice(0, 6)) {
  await page.evaluate(({ site, id }) => { forceTime(12); worldState.crime = {};
    const h = window._bh[id]; window._h = h;
    if (typeof isInterior === 'function' && isInterior()) exitInterior();
    px = h.doorX; pz = h.doorZ + .3; jumpY = 0; goToInterior(h); }, s);
  await page.waitForFunction(id => !!WORLD.intBox && WORLD.intBox.id === id && typeof intNPCMesh !== 'undefined' && !!intNPCMesh, s.id, { timeout: 60000, polling: 250 });
  await g.hide();
  const r = await page.evaluate(() => { const X = WORLD.intBox, K = intNPCMesh, h = window._h; jumpY = 0;
    K.rotation.y = 0; // his sway is ±.08 about facing into the room; measured at its centre and at both ends below
    let n = 0, seen = 0, seenSway = 0, far = 0;
    for (let r = .5; r <= 1.55; r += .15) for (let a = 0; a < 24; a++) { const x = X.x + Math.sin(a / 24 * Math.PI * 2) * r, z = X.z + Math.cos(a / 24 * Math.PI * 2) * r;
      if (intSolidAt(x, z, .3, 0) || x < .3 || z < .3 || x > (h._roomW || 99) - .3) continue; px = x; pz = z; lookAtPt(X.x, .3, X.z);
      if (!WORLD.boxPrompt()) continue; n++; far = Math.max(far, Math.hypot(x - K.position.x, z - K.position.z));
      if (WORLD.witnessOf(h)) seen++;
      K.rotation.y = .08; const a1 = !!WORLD.witnessOf(h); K.rotation.y = -.08; const a2 = !!WORLD.witnessOf(h); K.rotation.y = 0; if (a1 && a2) seenSway++; }
    // the box stands clear of the room's furniture and walls
    const clear = !intSolidAt(X.x + 1.0, X.z, .25, 0) && X.x > .4;
    return { name: h.name, W: h._roomW, D: h._roomD, box: [+X.x.toFixed(2), +X.z.toFixed(2)], keeper: [+K.position.x.toFixed(2), +K.position.z.toFixed(2)], n, seen, seenSway, far: +far.toFixed(2), clear }; });
  rows.push(r); console.log(JSON.stringify(r));
  // the theft itself, at the box, in his sight: fined
  if (rows.length === 1) {
    const t = await page.evaluate(() => { const X = WORLD.intBox, h = window._h, S = WORLD.settle.get(h.siteId) || WORLD.settlements.get(h.siteId); const site = S.site;
      px = X.x + 1.0; pz = X.z; jumpY = 0; lookAtPt(X.x, .3, X.z); const b0 = WORLD.bountyAt(site), g0 = gold; X.open = true; WORLD.boxInteract(); return { took: gold - g0, fined: WORLD.bountyAt(site) - b0 }; });
    console.log('theft', JSON.stringify(t)); rows[0].theft = t;
  }
}
check('barbers found in the towns near the start', rows.length >= 3, shops);
check('every spot the box opens from is in the barber\'s sight at noon, at the centre and both ends of his sway', rows.every(r => r.n > 0 && r.seen === r.n && r.seenSway === r.n), rows);
check('the box stands clear of the furniture, off the wall', rows.every(r => r.clear), rows);
check('taken at noon in front of him, the box is fined', rows[0].theft && rows[0].theft.took > 0 && rows[0].theft.fined > 0, rows[0].theft);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
