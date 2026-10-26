// Session 741 — Carraig Mór's night by the numbers, after Sessions 739 (a householder sleeps 23h–5h) and 740 (a second gate
// guard in a one-gate town). The critic's s572 run walked it hour by hour: one man awake from 21h to 5h, no street pick after
// 21h seen, and every home's chest opened in front of its owner. This measures the same night: at every shop door and every
// home door, hour by hour from 21h to 4h, how often a pick would be seen (at an instant, and over a five-second pick), with the
// town's own ticks walking the watch; then, indoors, whether a home's chest is opened unseen, hour by hour, in eight homes.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('carraig_mor');
const stop = g.keepAlive();
const HOURS = [21, 22, 23, 0, 1, 2, 3, 4];
const res = await page.evaluate((HOURS) => {
  const S = WORLD.settle.get('carraig_mor'); const site = S.site;
  const shops = S.houses.filter(h => h.keeper && /weapon|armor|potion|misc|goods|forge|apothecary|armoury/.test(h.type)).map(h => ({ h, x: h.exitX, z: h.exitZ, kind: 'shop' }));
  const homes = S.houses.filter(h => h.type === 'home' && !h.ownedByPlayer && !h.shuttered).map(h => ({ h, x: h.exitX, z: h.exitZ, kind: 'home' }));
  const doors = [...shops, ...homes];
  const cx = site.x, cz = site.z + 4; const out = {}; const _sn = _sneaking;
  for (const hr of HOURS) { forceTime(hr + .25); px = cx; pz = cz; for (let i = 0; i < 300; i++) WORLD.tick(1 / 60, performance.now());
    const series = doors.map(() => ({ walk: [], sneak: [] }));
    for (let f = 0; f < 1200; f++) { px = cx; pz = cz; WORLD.tick(1 / 60, performance.now()); if (f % 15) continue;
      doors.forEach((d, k) => { px = d.x; pz = d.z; for (const sn of [false, true]) { _sneaking = sn; series[k][sn ? 'sneak' : 'walk'].push(!!WORLD.witnessOf(d.h)); } }); }
    const pick = (kind, sn) => { let n = 0, seen = 0; series.forEach((s, k) => { if (doors[k].kind !== kind) return; const L = s[sn]; for (let i = 0; i + 20 <= L.length; i += 4) { n++; if (L.slice(i, i + 20).some(Boolean)) seen++; } }); return n ? +(seen / n).toFixed(3) : 0; };
    const ever = kind => series.filter((s, k) => doors[k].kind === kind && s.walk.some(Boolean)).length;
    out[hr] = { awake: WORLD.guardsOf(S).filter(n => n.g.visible && !n._retreated).map(n => n.def.name), shop: pick('shop', 'walk'), shopSneak: pick('shop', 'sneak'), home: pick('home', 'walk'), homeSneak: pick('home', 'sneak'), shopsEver: ever('shop'), homesEver: ever('home') }; }
  _sneaking = _sn; px = cx; pz = cz; forceTime(12);
  return { shops: shops.length, homes: homes.length, rows: out };
}, HOURS);
console.log(`Carraig Mór, ${res.shops} shop doors and ${res.homes} home doors; a five-second pick seen (walking / sneaking)`);
for (const h of HOURS) { const r = res.rows[h]; console.log(`  ${String(h).padStart(2)}h: awake ${r.awake.length} (${r.awake.join(', ')}); shops ${(r.shop * 100).toFixed(1)}% / ${(r.shopSneak * 100).toFixed(1)}%, ${r.shopsEver} doors ever seen; homes ${(r.home * 100).toFixed(1)}% / ${(r.homeSneak * 100).toFixed(1)}%, ${r.homesEver} ever seen`); }
const rows = HOURS.map(h => res.rows[h]);
const mean = k => +(rows.reduce((a, r) => a + r[k], 0) / rows.length).toFixed(3);
console.log(JSON.stringify({ shop: mean('shop'), shopSneak: mean('shopSneak'), home: mean('home'), homeSneak: mean('homeSneak') }));
check('Carraig Mór\'s doors measured through a night', res.shops >= 3 && res.homes >= 20, [res.shops, res.homes]);
check('sneaking is never seen more than walking', rows.every(r => r.shopSneak <= r.shop + 1e-9 && r.homeSneak <= r.home + 1e-9));
// indoors: a home's chest, opened by the player standing at it, hour by hour, in eight homes
const IN_HOURS = [21.5, 22.5, 23.5, 1, 3, 4.5, 5.5, 6.5];
const homesIn = []; const asleep = [];
for (let k = 0; k < 8; k++) {
  const row = [];
  for (const hr of IN_HOURS) {
    await page.evaluate(([k, hr]) => { forceTime(hr); const S = WORLD.settle.get('carraig_mor'); const hs = S.houses.filter(h => h.type === 'home' && !h.ownedByPlayer && !h.shuttered); const h = hs[k * 4]; window._h = h; px = h.exitX; pz = h.exitZ; goToInterior(h); }, [k, hr]);
    // wait for the fade's callback to have put us in this home, not for a fixed time: a late fade left INT_BOX the last room's
    // while lid was still the overworld, and the room's coordinates outdoors made the world drop Carraig Mór (Session 947)
    await page.waitForFunction(() => isInterior() && currentHouse === window._h, null, { timeout: 30000 });
    row.push(await page.evaluate(() => { if (!isInterior() || currentHouse !== _h) throw new Error('not in the home'); if (!INT_BOX || !intNPCMesh) { exitInterior(); return null; } px = INT_BOX.x + .6; pz = INT_BOX.z - .6; jumpY = INT_BOX.y || 0; /* S1437: on the chest's floor */ let seen = false;
      for (let f = 0; f < 300; f++) { WORLD.tickInterior(1 / 60, performance.now()); if (f % 15 === 0 && WORLD.witnessOf(_h)) seen = true; } const a = intNPCMesh.userData.asleep; window._asl = a ? (Math.abs(a.y - (INT_BOX.y || 0)) < 1.2 ? 2 : 1) : 0; /* S1450: 2 = asleep on the chest's floor */ jumpY = 0; exitInterior(); return seen; }));
    asleep.push(await page.evaluate(() => window._asl)); /* back on the ground floor first: a townhouse's chest is upstairs */
    await page.waitForFunction(() => !isInterior() && lid === 'overworld', null, { timeout: 30000 });
  }
  homesIn.push(row);
}
await g.hide();
console.log('indoors, a home\'s chest opened over five seconds (seen = 1, unseen = 0, nobody in = -) at ' + IN_HOURS.join(' / ') + 'h');
homesIn.forEach((r, k) => console.log(`  home ${k * 4}: ${r.map(v => v === null ? '-' : v ? 1 : 0).join(' ')}`));
const col = j => homesIn.map(r => r[j]).filter(v => v !== null);
const share = j => { const c = col(j); return c.length ? c.filter(Boolean).length + '/' + c.length : '-'; };
console.log('  seen by hour: ' + IN_HOURS.map((h, j) => h + 'h ' + share(j)).join(', '));
check('asleep from 23h to 5h, no resident sees their chest opened (23h30, 1h, 3h, 4h30)', [2, 3, 4, 5].every(j => col(j).every(v => !v)), [2, 3, 4, 5].map(share));
// S1450: the check above holds only while the resident lies asleep by the chest: on the townhouse's three floors the awake resident is
// two floors below it, so the asleep hours are the only ones where anyone could see it, and a sleeper not laid down would pass it unseen
const aslH = asleep.filter((v, i) => [2, 3, 4, 5].includes(i % IN_HOURS.length));
console.log(`  asleep hours: ${aslH.filter(v => v === 2).length} of ${aslH.length} visits found the resident asleep on the chest's floor, ${aslH.filter(v => v === 1).length} asleep on another`);
check('from 23h to 5h the resident is asleep in every home visited, at least half on the chest\'s floor', aslH.length >= 24 && aslH.every(v => v > 0) && aslH.filter(v => v === 2).length * 2 >= aslH.length, aslH);
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
