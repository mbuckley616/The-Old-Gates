// The room's E answers to the crosshair (Session 646; Michael's 6 Oct 2026 playtest: "E should need range AND the reticle on
// the object"). Session 645 did the beds; this is the strongbox, a home's chest, the cellar hatch both ways and a tower's chest
// and roof hatch. At each, from a spot in reach: looking at it, its prompt shows and E reaches it; from the same spot looking
// away, no prompt and E leaves it alone. What E would start (the lock, the loot, the climb) is caught, not run.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
await page.evaluate(() => { forceTime(23); });
const into = async (fn, arg) => { await page.evaluate(fn, arg); await page.waitForFunction(() => !!currentHouse && window._want && currentHouse === window._want, null, { timeout: 60000 }); await g.frames(3); await g.hide();
  await page.evaluate(() => { for (const n of (INT_NPCS || [])) if (n.g) n.g.position.set(-50, n.g.position.y, -50); }); };
const leave = async () => { await page.evaluate(() => exitInterior()); await page.waitForFunction(() => currentHouse == null, null, { timeout: 60000 }); await g.frames(2); };
// stand at s (x, z, y), look at t (x, y, z) or away from it; the prompt the thing gives, what E does
const probe = (what, s, t) => page.evaluate(([what, s, t]) => {
  const P = { box: () => WORLD.boxPrompt(), loot: () => WORLD.lootPrompt(), hatch: () => WORLD.hatchPrompt() }[what];
  const res = {};
  for (const away of [false, true]) { px = s.x; pz = s.z; jumpY = s.y; onGround = true;
    if (away) lookAtPt(px - (t.x - px) * 3, jumpY + 1.4, pz - (t.z - pz) * 3); else lookAtPt(t.x, t.y, t.z);
    const prompt = P(); let did = null;
    const keep = { tryLockpick: window.tryLockpick, openLoot: window.openLoot, goToInterior: window.goToInterior, exitInterior: window.exitInterior, showMsg: window.showMsg, openDialog: window.openDialog, openShop: window.openShop };
    tryLockpick = () => { did = 'lock'; }; openLoot = () => { did = 'loot'; }; goToInterior = (h) => { did = 'down:' + (h && h.type); }; exitInterior = () => { did = 'out'; }; openDialog = () => { did = did || 'talk'; }; openShop = () => { did = did || 'shop'; };
    showMsg = (m) => { if (!did) did = 'msg:' + String(m).slice(0, 40); };
    try { interact(); } finally { Object.assign(window, keep); tryLockpick = keep.tryLockpick; openLoot = keep.openLoot; goToInterior = keep.goToInterior; exitInterior = keep.exitInterior; showMsg = keep.showMsg; openDialog = keep.openDialog; openShop = keep.openShop; }
    res[away ? 'away' : 'on'] = { prompt, did }; }
  return { what, d: +Math.hypot(s.x - t.x, s.z - t.z).toFixed(2), ...res }; }, [what, s, t]);
// a free spot about r from (x, z) on floor y, clear of furniture and walls, with nothing in the way
const spot = (x, z, y, r) => page.evaluate(([x, z, y, r]) => { for (let rr = r; rr <= r + .3; rr += .1) for (let a = 0; a < 6.28; a += .2) { const sx = x + Math.sin(a) * rr, sz = z + Math.cos(a) * rr;
  if (sx < .35 || sz < .35 || sx > currentHouse._roomW - .35 || sz > currentHouse._roomD - .35) continue; if (intSolidAt(sx, sz, .3, y)) continue; if (!intSightLine(sx, sz, x, z)) continue;
  if ((INT_DOORS || []).some(d => Math.hypot(d.x - sx, d.z - sz) < 1.6)) continue; return { x: sx, z: sz, y }; } return null; }, [x, z, y, r]);
const out = [];
// a shop's strongbox and a home's chest, at night, locked
for (const kind of ['shop', 'home']) {
  await into((kind) => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => kind === 'shop' ? (x.type === 'misc' || x.type === 'weapon' || x.type === 'potion') : (x.type === 'home' && !x.ownedByPlayer)); window._want = h; px = h.exitX; pz = h.exitZ; goToInterior(h); }, kind);
  const X = await page.evaluate(() => WORLD.intBox && { x: WORLD.intBox.x, z: WORLD.intBox.z, kind: WORLD.intBox.kind });
  if (X) { const s = await spot(X.x, X.z, 0, .8); if (s) out.push({ where: kind, ...(await probe('box', s, { x: X.x, y: .35, z: X.z })) }); }
  await leave(); }
// an inn's cellar hatch, down; then up out of the cellar
{ await into(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'inn' && x.dlg); window._want = h; px = h.exitX; pz = h.exitZ; goToInterior(h); });
  const H = await page.evaluate(() => HATCH.active ? { x: HATCH.x, z: HATCH.z, y: HATCH.y } : null);
  if (H) { const s = await spot(H.x, H.z, H.y, 1.0); if (s) out.push({ where: 'inn hatch', ...(await probe('hatch', s, { x: H.x, y: H.y + .05, z: H.z })) });
    await page.evaluate((s) => { px = s.x; pz = s.z; jumpY = s.y; }, s); await page.evaluate((H) => { lookAtPt(H.x, H.y + .05, H.z); window._want = { cellar: true }; WORLD.hatchInteract(); }, H);
    await page.waitForFunction(() => !!currentHouse && currentHouse.type === 'cellar', null, { timeout: 60000 }); await g.frames(3); await g.hide();
    const C = await page.evaluate(() => ({ x: HATCH.x, z: HATCH.z, y: HATCH.y }));
    const c = await spot(C.x, C.z, C.y, 1.0); if (c) out.push({ where: 'cellar ladder', ...(await probe('hatch', c, { x: C.x, y: C.y + 1.6, z: C.z })) }); }
  await leave(); }
// a tower: its chest and its roof hatch, on the top floor
{ await page.evaluate(() => { goToZone('world', 13100, 25450, 0, 'x'); }); await page.waitForTimeout(6000); await g.hide();
  await page.waitForFunction(() => activeZoneId === 'world' && [...WORLD.SITES].some(t => t.kind === 'tower'), null, { timeout: 90000, polling: 250 }).catch(() => {});
  const ok = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms));
    const s = [...WORLD.SITES].filter(t => t.kind === 'tower').sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0]; if (!s) return false; px = s.x; pz = s.z + 12;
    for (let k = 0; k < 40 && !WORLD.settle.get(s.id); k++) { WORLD.tick(1 / 60, performance.now()); await wait(250); }
    const h = ZONES.world.houses.find(x => x.id === 'g_' + s.id + '_tower'); if (!h) return false; window._want = h; goToInterior(h); return true; });
  if (ok) { await page.waitForFunction(() => currentHouse === window._want, null, { timeout: 60000 }); await g.frames(3); await g.hide();
    const T = await page.evaluate(() => ({ L: WORLD.intLoot && { x: WORLD.intLoot.x, z: WORLD.intLoot.z, y: WORLD.intLoot.y }, H: { x: HATCH.x, z: HATCH.z, y: HATCH.y, roof: HATCH.roof } }));
    if (T.L) { const s = await spot(T.L.x, T.L.z, T.L.y, .9); if (s) out.push({ where: 'tower chest', ...(await probe('loot', s, { x: T.L.x, y: T.L.y + .35, z: T.L.z })) }); }
    if (T.H.roof) { const s = await spot(T.H.x, T.H.z, T.H.y, 1.0); if (s) out.push({ where: 'roof hatch', ...(await probe('hatch', s, { x: T.H.x, y: T.H.y + 1.8, z: T.H.z })) }); } } }
for (const o of out) console.log(' ', JSON.stringify(o));
const W = (w) => out.find(o => o.where === w);
check('tried the strongbox, a home\'s chest, the inn\'s hatch, the cellar\'s ladder, a tower\'s chest and its roof hatch', ['shop', 'home', 'inn hatch', 'cellar ladder', 'tower chest', 'roof hatch'].every(W), out.map(o => o.where));
check('looking at each: its prompt shows and E reaches it', out.every(o => o.on.prompt && o.on.did && !/^msg:|talk|shop/.test(o.on.did)), out.map(o => [o.where, o.on]));
check('the lock, the climb and the way out are what E starts', W('shop') && W('shop').on.did === 'lock' && W('home').on.did === 'lock' && W('inn hatch').on.did === 'down:cellar' && W('tower chest').on.did === 'lock' && W('roof hatch').on.did === 'out', out.map(o => [o.where, o.on.did]));
check('from the same spot looking away: no prompt, and E leaves it alone', out.every(o => !o.away.prompt && !/^(lock|loot|out|down:cellar)$/.test(o.away.did || '') && !(o.where === 'cellar ladder' && o.away.did)), out.map(o => [o.where, o.away]));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
