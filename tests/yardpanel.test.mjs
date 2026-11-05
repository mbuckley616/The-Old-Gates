// The yard panel (Session 642; Michael's B on #192, the ship in hand, item 3): the shipwright's Browse ships opens a slip,
// the hulls this yard sells down the left, the chosen one turning on its own small stage, her numbers on the helm's dial,
// and the yard's offers (the buy, the refits, the sails, the hold) as buttons. Mend, raise and fetch stay in his chat.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const pid = await page.evaluate(() => { const s = WORLD.siteAnywhere('dunmore'); return WORLD.allPorts().filter(p => WORLD.cargoNation(p) === 'mark').sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z))[0].id; });
await g.settle(pid);
const R = () => page.evaluate(() => { const d = document.getElementById('yard-dial');
  return { open: yardOpen, shown: document.getElementById('yardui').style.display, title: document.getElementById('yard-title').textContent,
    list: [...document.querySelectorAll('#yard-list button')].map(b => b.textContent.trim()), sel: YARD.cls,
    acts: [...document.querySelectorAll('#yard-acts button')].map(b => b.textContent.trim()), note: (document.querySelector('#yard-acts div') || {}).textContent || '',
    info: document.getElementById('yard-info').textContent, kn: document.getElementById('yard-kn').textContent, bare: d && +d.dataset.bare, full: d && +d.dataset.full,
    said: document.getElementById('yard-said').textContent, gold, cls: worldState.ship && worldState.ship.cls, sails: worldState.ship && worldState.ship.sails, cargo: worldState.ship && worldState.ship.cargo,
    stage: !!(YARD.m[YARD.cls] && YARD.m[YARD.cls].visible), kind: YARD.m[YARD.cls] && YARD.m[YARD.cls].userData.kind, tris: YARD.r ? YARD.r.info.render.triangles : -1 }; });
const pick = (k) => page.evaluate(k => document.querySelector(`#yard-list button[data-cls="${k}"]`).click(), k);
const act = (re) => page.evaluate(src => { const b = [...document.querySelectorAll('#yard-acts button')].find(x => new RegExp(src).test(x.textContent)); if (b) b.click(); return !!b; }, re);

// no ship yet
await page.evaluate((pid) => { worldState.ship = null; gold = 6000; WORLD.tut.sea = null; openYardPanel(WORLD.siteAnywhere(pid)); }, pid);
await g.frames(3);
const a = await R(); console.log(JSON.stringify(a));
check('Browse ships opens the yard, titled by the town', a.open && a.shown === 'flex' && /^The yard at /.test(a.title), a.title);
check('the Mark’s yard lists the sloop, cog, galleon and cutter, not the caravel', a.list.join() === 'sloop,cog,galleon,cutter', a.list);
check('with no ship the sloop is chosen and offered at 400', a.sel === 'sloop' && a.acts.length === 1 && a.acts[0] === 'Buy a ship (400 gold)', a.acts);
check('her numbers: 7.5 bare, 11.1 under full sails on the dial; hull 100, hold 40, worth 400', a.bare === 7.5 && Math.abs(a.full - 11.1) < .01 && a.kn === '7.5 kn bare, 11.1 under full sails' && /Hull100/.test(a.info) && /Hold40/.test(a.info) && /Worth400 gold/.test(a.info), a);
check('the stage draws her', a.stage && a.tris > 1000, { stage: a.stage, tris: a.tris });
await pick('cutter'); await g.frames(2); const b = await R();
check('choosing the cutter: 12 bare, 17.8 full, hull 80, hold 25; with no ship, sold as a sloop and refitted for 1600 more', b.sel === 'cutter' && b.bare === 12 && Math.abs(b.full - 17.76) < .01 && /Hull80/.test(b.info) && /Hold25/.test(b.info) && b.acts.length === 0 && /refitted as a cutter for 1600 gold more/.test(b.note) && b.stage, b);
// S683 — the stage draws each class on her own hull (the look builder's S665): the cutter is not the sloop of her length
check('the stage draws the sloop on the sloop’s hull and the cutter on the cutter’s', a.kind === 'sloop' && b.kind === 'cutter', { sloop: a.kind, cutter: b.kind });
await pick('sloop'); await act('^Buy a ship'); await g.frames(2); const c = await R();
check('buying the sloop: 400 taken, the ship yours, the shipwright’s line', c.cls === undefined && c.list.includes('sloop (yours)') && c.gold === 5600 && /she’s yours/.test(c.said) && c.list.includes('sloop (yours)'), c);
check('the sloop, hers: sails tier 1 (250) and hold tier 1 (200) offered, and her tiers shown', c.acts.includes('Better sails, tier 1 (250 gold)') && c.acts.includes('Bigger hold, tier 1 (200 gold)') && /Sailstier 0 of 4/.test(c.info), c);
await act('^Better sails'); const d = await R();
check('sails: 250 taken, tier 1, the shipwright says 8.4 knots', d.sails === 1 && d.gold === 5350 && /8\.4/.test(d.said) && d.acts.includes('Better sails, tier 2 (450 gold)'), d);
await pick('cutter'); const e = await R();
check('the cutter, now: a refit for 1600, and what hers is worth', e.acts.join() === 'Refit her as a cutter (1600 gold)' && /Yours, a sloop400 gold/.test(e.info), e);
await act('^Refit her as a cutter'); await g.frames(2); const f = await R();
check('refitted: 1600 taken, a cutter, still chosen and marked yours', f.cls === 'cutter' && f.gold === 3750 && f.sel === 'cutter' && f.list.includes('cutter (yours)') && f.said.length > 0, f);
await act('^Bigger hold'); const h = await R();
check('the hold: 200 taken, tier 1', h.cargo === 1 && h.gold === 3550, h);
// S1726 — Michael's B on #979: a place a fitting by hull, and each fitting but stowage takes hold weight
check('the cutter with stowage: a galley offered by its price and weight; 1 of 2 places', h.acts.includes('Fit a galley (300 gold, 10 of the hold)') && /Places1 of 2/.test(h.info) && /Her hold now50/.test(h.info), h);
await act('^Fit a galley'); const h2 = await R();
check('the galley fitted: 300 taken, her hold 25 + 25 − 10 = 40, both places taken, nothing more to fit', h2.gold === 3250 && /Her hold now40/.test(h2.info) && /Places2 of 2/.test(h2.info) && /Fittedstowage, galley/.test(h2.info) && !h2.acts.some(x => /^Fit |^Bigger hold/.test(x)) && h2.acts.includes('Take out her galley') && /takes 40 now/.test(h2.said), h2);
await act('^Take out her galley'); const h3 = await R();
check('taken out, the galley waits at the yard and goes back in free', /Her hold now50/.test(h3.info) && h3.acts.includes('Fit her galley again (kept at the yard)') && !h3.acts.some(x => /^Fit a galley/.test(x)), h3.acts);
await act('^Fit her galley again'); const h4 = await R();
check('fitted again for nothing', h4.gold === 3250 && /Places2 of 2/.test(h4.info), h4);
const fit = await page.evaluate((pid) => { const site = WORLD.siteAnywhere(pid), keep = worldState.ship, kg = gold, out = {};
  worldState.ship = { cls: 'galleon', cargo: 1, hold: {}, fit: ['still', 'galley', 'chart', 'bunks'] }; out.capG = WORLD.holdCap();
  out.full = fitShip('arms'); worldState.ship.hold = { iron: 18 }; out.used = WORLD.holdUsed();
  worldState.ship.fit.pop(); out.heavy = fitShip('bunks'); worldState.ship.hold = {};
  gold = 0; out.poor = fitShip('bunks'); gold = 5000; out.ok = fitShip('bunks'); out.cost = 5000 - gold;
  worldState.ship.cls = 'sloop'; out.left = shipFitToHull(); out.after = { cargo: worldState.ship.cargo, fit: worldState.ship.fit.slice(), stored: worldState.ship.stored.slice(), cap: WORLD.holdCap() };
  const d = JSON.parse(ssStringify(_buildSavePayload())); worldState.ship = { cls: 'sloop' }; _applyLoadData(d);
  out.loaded = { fit: worldState.ship.fit, stored: worldState.ship.stored, cargo: worldState.ship.cargo };
  worldState.ship = { cls: 'sloop', cargo: 2, hold: {} }; out.oldSave = { cap: WORLD.holdCap(), used: shipPlacesUsed(), rows: yardOffers(site).map(o => o.label).filter(l => /^Fit|^Bigger/.test(l)) };
  worldState.ship = keep; gold = kg; return out; }, pid);
console.log(JSON.stringify(fit));
check('a galleon with stowage, still, galley, chart table and bunks carries 90 + 25 − 35 = 80, the page’s figure', fit.capG === 80, fit.capG);
check('her five places full: no sixth fitting', /rooms are full/.test(fit.full), fit.full);
check('a fitting needs its weight free in the hold, and its gold', /clear the hold first/.test(fit.heavy) && fit.poor === null && fit.ok === true && fit.cost === 250, fit);
check('refitted down to a sloop, the last fitted go to the yard first: stowage and the still kept, hold 40 + 25 − 10', fit.after.cargo === 1 && fit.after.fit.join() === 'still' && fit.after.stored.join() === 'bunks,chart,galley' && fit.after.cap === 55, fit.after);
check('her fittings and the yard’s store come back from a save', fit.loaded.fit.join() === 'still' && fit.loaded.stored.join() === 'bunks,chart,galley' && fit.loaded.cargo === 1, fit.loaded);
check('an old save’s two hold tiers are two stowage: a sloop full, hold 90, nothing more offered', fit.oldSave.cap === 90 && fit.oldSave.used === 2 && fit.oldSave.rows.length === 0, fit.oldSave);
// S1734 — her figureheads (the build sheet, session 3): the yard's own carved for 150, the found ones fitted free, one at her bow at a time
const fh = await page.evaluate((pid) => { const site = WORLD.siteAnywhere(pid), keep = worldState.ship, kg = gold, kb = BAG.slice(), km = SHIP.mesh, kwx = WX.type, kbell = bellAboard, kp = currentPortal, out = {};
  const rows = () => yardOffers(site).filter(o => /figurehead|at her bow/.test(o.label)); const row = re => rows().find(o => re.test(o.label));
  worldState.ship = { cls: 'sloop', hold: {}, hull: 100, rig: 100 }; gold = 1000; BAG.length = 0;
  out.rows0 = rows().map(o => o.label); out.carve = row(/^Carve/).fn(); out.afterCarve = { gold, head: worldState.ship.head, yard: worldState.ship.yardHead, rows: rows().map(o => o.label) };
  out.grant = grantHead('stone'); out.again = grantHead('stone'); out.token = BAG.filter(b => b.figurehead === 'stone').map(b => ({ n: b.name, w: b.weight }));
  out.rowsT = rows().map(o => o.label); out.fit = row(/^Fit the Gate Stone/).fn(); out.afterFit = { gold, head: worldState.ship.head, heads: worldState.ship.heads.slice(), bag: BAG.length, rows: rows().map(o => o.label) };
  // the stone's storm wear, and the Bell's, never both
  const wear = (head, bell) => { const st = worldState.ship; st.head = head; st.hull = 100; st.rig = 100; SHIP._wh = 0; SHIP._wr = 0; SHIP.sea = 3; SHIP.speed = 5; bellAboard = () => bell; tickSeaWear(60, 1); bellAboard = kbell; return [100 - st.hull, 100 - st.rig]; };
  out.wear = { none: wear(null, false), stone: wear('stone', false), bell: wear(null, true), both: wear('stone', true) };
  worldState.ship.head = 'stone'; SHIP.sea = 2; worldState.ship.hull = 100; SHIP._wh = 0; SHIP._wr = 0; tickSeaWear(60, 1); out.rough = 100 - worldState.ship.hull;
  // the Sea's hull: +5% in rain or storm
  worldState.ship.head = null; WX.type = 'rain'; const v0 = shipTopSpeed(); worldState.ship.head = 'sea'; out.seaRain = +(shipTopSpeed() / v0).toFixed(3); WX.type = 'clear'; out.seaClear = +(shipTopSpeed() / v0).toFixed(3); WX.type = kwx;
  // the maiden: within 300 m a black sail holds 10 s, once
  worldState.ship.head = 'maiden'; const o = {}; out.maidenFar = headHold(o, 400, 1); let n = 0; while (headHold(o, 250, 1) && n < 30) n++; out.maidenS = n; out.maidenAgain = headHold(o, 250, 1);
  // the skull: a merchantman within 60 m turns away from her
  worldState.ship.head = 'skull'; if (!SHIP.mesh) SHIP.mesh = {}; const sx = SHIP.x, sz = SHIP.z; const gw = headGiveWay({ x: sx + 25, z: sz }); out.skull = { near: !!gw && gw.x > sx + 25 && Math.abs(gw.z - sz) < 1e-6, far: headGiveWay({ x: sx + 70, z: sz }) };
  worldState.ship.head = 'stone'; out.skullOff = headGiveWay({ x: sx + 25, z: sz }); SHIP.mesh = km;
  // where two are found: the first lair master slain, and a failing or catastrophic lesser gate's sigil read
  out.slay = (slayMaster({ lair: {}, seed: 987654321 }), BAG.some(b => b.figurehead === 'skull'));
  worldState.ship.heads = []; worldState.ship.head = null; BAG.length = 0; let fs = 1, ss = 1; while (gateCondRoll(fs) === 'steady') fs++; while (gateCondRoll(ss) !== 'steady') ss++;
  currentPortal = { seed: ss }; out.steadyGate = gateStoneDue(ss); currentPortal = { seed: fs }; out.failGate = gateStoneDue(fs) && BAG.some(b => b.figurehead === 'stone'); currentPortal = kp;
  delete worldState.masters[987654321];
  // a save keeps her figureheads and a token in the bag
  worldState.ship.head = 'yard'; worldState.ship.heads = ['stone', 'maiden']; BAG.length = 0; grantHead('sea');
  const d = JSON.parse(ssStringify(_buildSavePayload())); worldState.ship = { cls: 'sloop' }; BAG.length = 0; _applyLoadData(d);
  out.saved = { head: worldState.ship.head, heads: worldState.ship.heads, yard: worldState.ship.yardHead, token: BAG.filter(b => b.figurehead).map(b => b.figurehead) };
  worldState.ship = keep; gold = kg; BAG.splice(0, BAG.length, ...kb); return out; }, pid);
console.log(JSON.stringify(fh));
check('a Mark yard carves its dragon prow for 150 gold, and offers nothing more for it once carved', fh.rows0.includes('Carve her a figurehead: the dragon prow (150 gold)') && fh.afterCarve.gold === 850 && fh.afterCarve.head === 'yard' && fh.afterCarve.yard === 'mark' && fh.afterCarve.rows.length === 0, fh.afterCarve);
check('a figurehead found is a token in the bag, weight 0, given once', fh.grant === true && fh.again === false && fh.token.length === 1 && fh.token[0].w === 0, fh.token);
check('the gate stone fitted at her bow for nothing; the carving waits at the yard, set back free', fh.rowsT.includes('Fit the Gate Stone at her bow (free)') && fh.afterFit.gold === 850 && fh.afterFit.head === 'stone' && fh.afterFit.heads.join() === 'stone' && fh.afterFit.bag === 0 && fh.afterFit.rows.includes('Set her carved dragon prow at her bow again (kept at the yard)'), fh.afterFit);
check('storm wear: 10 hull and 15 rig a minute; the stone ×0.8 (8, 12); the Bell ×0.5 (5, 7 or 8); both, the Bell alone', fh.wear.none.join() === '10,15' && fh.wear.stone.join() === '8,12' && fh.wear.bell[0] === 5 && fh.wear.both.join() === fh.wear.bell.join() && fh.rough === 1, fh.wear);
check('the Sea’s hull: +5% top speed in rain, nothing in clear weather', fh.seaRain === 1.05 && fh.seaClear === 1, [fh.seaRain, fh.seaClear]);
check('the maiden: a black sail within 300 m holds off 10 s, once; from 400 m, nothing', fh.maidenFar === false && fh.maidenS === 10 && fh.maidenAgain === false, fh);
check('the skull: a merchantman at 25 m steers straight away from her; at 70 m, or under another figurehead, nothing', fh.skull.near && fh.skull.far === null && fh.skullOff === null, fh.skull);
check('found: the beast’s skull off the first lair master slain; the gate stone at a failing or catastrophic gate’s sigil, not a steady one', fh.slay && fh.steadyGate === false && fh.failGate, fh);
check('a save keeps her figurehead, the yard’s store, her carving and a token in the bag', fh.saved.head === 'yard' && fh.saved.heads.join() === 'stone,maiden' && fh.saved.yard === 'mark' && fh.saved.token.join() === 'sea', fh.saved);
// S1736 — the wreck's maiden: in each island's deepest wreck, worked out once by the chunks' hashes and the bed, the same on a second count
const mw = await page.evaluate(() => { const kb = BAG.slice(), ks = worldState.ship, out = {}; worldState.ship = { cls: 'sloop' }; BAG.length = 0;
  const S0 = SEA_WRECKS; out.drift = S0 ? Math.max(0, ...S0.map(w => Math.abs(placeH(w.x, w.z) - w.bed))) : null; out.cachedN = S0 ? S0.length : null;
  MAIDEN_WRECKS = null; SEA_WRECKS = null; const t0 = performance.now(); const W = maidenWrecks(); out.ms = Math.round(performance.now() - t0); out.n = SEA_WRECKS.length; out.W = JSON.parse(JSON.stringify(W)); MAIDEN_WRECKS = null; SEA_WRECKS = null; out.same = JSON.stringify(maidenWrecks()) === JSON.stringify(W);
  const spawn = key => { const [cx, cz] = key.split(',').map(Number); const ch = { cx, cz, group: new THREE.Group(), sol: [], loot: [] }; spawnWreck(ch); const c = ch.loot[0]; return c ? { at: [Math.round(c.x), Math.round(c.z)], heads: c.items.filter(i => i.figurehead).map(i => i.figurehead) } : null; };
  const n0 = Object.keys(W)[0]; out.nations = Object.keys(W).sort(); out.deep = spawn(W[n0].key); out.bedOk = Object.values(W).every(w => w.bed < -2.5 && w.bed > -8);
  out.bed = placeH(W[n0].x, W[n0].z) === W[n0].bed; /* S1766 — the bed is the land keyed by place (placeH), not worldH */
  let other = null; for (let cz = 0; cz < 450 && !other; cz++) for (let cx = 0; cx < 450 && !other; cx++) { const k = cx + ',' + cz; if (hash01(cx, cz, 150) > .06 || Object.values(W).some(w => w.key === k)) continue; const r = spawn(k); if (r) other = r; }
  out.other = other; grantHead('maiden'); out.after = spawn(W[n0].key);
  BAG.splice(0, BAG.length, ...kb); worldState.ship = ks; return out; });
console.log(JSON.stringify(mw));
check(`the wreck's maiden lies in each island's deepest wreck (${mw.nations.join(', ')}; beds ${Object.values(mw.W).map(w => w.bed.toFixed(3)).join(', ')} m; worked out in ${mw.ms} ms), the same on a second count`, mw.nations.join() === 'aurenne,gatelands,mark' && mw.bedOk && mw.bed && mw.same && mw.deep && mw.deep.heads.join() === 'maiden', mw);
check('another wreck holds no figurehead, and hers none once the maiden is found', mw.other && mw.other.heads.length === 0 && mw.after && mw.after.heads.length === 0, { other: mw.other, after: mw.after });
// S1737 — her crew (the build sheet, session 4): two in her bunks, the carpenter's patches and the cook's meal from the sea chest, the navigator's reach
const cr = await page.evaluate((pid) => { const site = WORLD.siteAnywhere(pid), ks = worldState.ship, kst = stashBag.slice(), ksail = SHIP.sailing, ksp = SHIP.speed, kmin = worldState.gameTimeAbsMinutes, kclk = worldState.gameTimeMinutes, out = {};
  worldState.ship = { cls: 'sloop', hold: {}, hull: 50, rig: 100, fit: ['galley'] }; stashBag.length = 0;
  out.notMet = crewAboard('cook'); for (const r of ['carpenter', 'cook', 'navigator']) crewMeet(r, site.id); out.noBunks = crewAboard('cook');
  worldState.ship.fit.push('bunks'); const row = re => yardOffers(site).find(o => re.test(o.label)); out.rows = yardOffers(site).filter(o => /aboard|ashore/.test(o.label)).map(o => o.label);
  out.a1 = row(/^Take the carpenter aboard/).fn(); out.a2 = crewAboard('cook'); out.third = crewAboard('navigator'); out.unfit = unfitShip('bunks');
  _stashAdd(benchItem('plank', 2)); _stashAdd(survItem('pitch', 2)); _stashAdd(survItem('fish', 1));
  // 200 s under way at 50% hull, in 1/60 s steps of the ship's own tick
  const day = Math.floor((worldState.gameTimeAbsMinutes || 0) / 1440) + 1; const T = m => { worldState.gameTimeAbsMinutes = m; worldState.gameTimeMinutes = m % 1440; }; T(day * 1440 + 5 * 60); /* before the cook's hour */
  SHIP.sailing = true; SHIP.speed = 5; SHIP._carpT = 0; const hs = []; for (let t = 0; t < 200 * 60; t++) { const h0 = worldState.ship.hull; tickShipCrew(1 / 60); if (worldState.ship.hull !== h0) hs.push(worldState.ship.hull - h0); }
  out.patches = hs; out.hull = worldState.ship.hull; out.chest = { planks: stashBag.filter(b => b.plank).length, pitch: stashBag.filter(b => b.name === SURV_ITEMS.pitch.name).length };
  // the cook at 6h
  T(day * 1440 + 5 * 60); tickShipCrew(1 / 60); out.before6 = stashBag.filter(b => b.meal).length;
  T(day * 1440 + 6 * 60 + 5); tickShipCrew(1 / 60); tickShipCrew(1 / 60); out.meals = stashBag.filter(b => b.meal).map(b => ({ n: b.name, q: b.qty || 1, s: b.meal.s })); out.fishLeft = stashBag.filter(b => b.food === 'fish').length;
  // swap the cook for the navigator at the yard: her chart table wanted for his station
  out.swap = row(/^Send the cook ashore/).fn(); out.nav = crewAboard('navigator'); out.navNoTable = navMapR(); worldState.ship.fit.push('chart'); out.navR = navMapR(); SHIP.sailing = false; SHIP.sailing = true;
  WX.type = 'rain'; out.hintOn = navAboard();
  // S1780 — his shoals: a bed under 2 m drawn on the minimap in the shallows' colour, at sea with him at his station, and not ashore
  const shoalPx = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 160; const c = cv.getContext('2d'); drawLocalMap(c, 160, navMapR(), false);
    const d = c.getImageData(0, 0, 160, 160).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === 0x76 && d[i + 1] === 0x88 && d[i + 2] === 0x8e) n++; return n; };
  { const R = navMapR(), cl = Math.max(4, R / 14); let n = 0; for (let z = pz - R; z < pz + R; z += cl) for (let x = px - R; x < px + R; x += cl) { const h = worldH(x + cl / 2, z + cl / 2); if (h < 0 && h > -2) n++; } out.shoalBeds = n; }
  out.shoalsAtSea = shoalPx(); SHIP.sailing = false; out.shoalsAshore = navAboard() ? -1 : shoalPx(); SHIP.sailing = true;
  // a save keeps them
  const d = JSON.parse(ssStringify(_buildSavePayload())); worldState.ship = { cls: 'sloop' }; _applyLoadData(d); out.saved = { crew: worldState.ship.crew.slice(), ashore: Object.keys(worldState.ship.ashore).sort() };
  // sunk: they swim for the nearest port
  out.metSaved = Object.assign({}, worldState.ship.met); out.people = ['carpenter', 'cook', 'navigator'].map(r => crewPeople(r)); out.peopleAgain = ['carpenter', 'cook', 'navigator'].map(r => crewPeople(r)); out.siteNation = WORLD.nationKeyOf(...cellOf(site.x, site.z));
  worldState.ship.hull = 0; const keepMesh = SHIP.mesh; out.sink = crewSink(); out.metAfterSink = Object.assign({}, worldState.ship.met); out.oldSave = (() => { const k = worldState.ship.met; delete worldState.ship.met; const v = crewPeople('cook'); worldState.ship.met = k; return v; })(); out.afterSink = { crew: worldState.ship.crew.length, ashore: Object.entries(worldState.ship.ashore).filter(([, v]) => v).length };
  SHIP.sailing = ksail; SHIP.speed = ksp; worldState.gameTimeAbsMinutes = kmin; worldState.gameTimeMinutes = kclk; worldState.ship = ks; stashBag.splice(0, stashBag.length, ...kst); return out; }, pid);
console.log(JSON.stringify(cr));
check('the crew: none met, refused; met, none aboard without bunks; with bunks two aboard and the third refused; bunks not taken out under them', /not met/.test(cr.notMet) && /no bunks/.test(cr.noBunks) && cr.rows.includes('Take the carpenter aboard (free)') && /comes aboard/.test(cr.a1) && cr.a2 === true && /both are taken/.test(cr.third) && /send them ashore/.test(cr.unfit), cr);
check('the carpenter: 200 s under way at hull 50, two patches (+18, then to the cap), the hull stops at 80, the chest\'s 2 planks and 2 pitch spent', cr.patches.join() === '18,12' && cr.hull === 80 && cr.chest.planks === 0 && cr.chest.pitch === 0, cr);
check('the cook: nothing before 6h; at 6h one baked fish at ×1.0 into the sea chest, once a day', cr.before6 === 0 && cr.meals.length === 1 && cr.meals[0].q === 1 && cr.meals[0].s === 1 && /Fish/.test(cr.meals[0].n) && cr.fishLeft === 0, cr.meals);
check('swapped free at the yard; the navigator with her chart table draws the minimap to 116 m at sea, 58 without the table; his ahead line without the oilskin', /goes ashore/.test(cr.swap) && cr.nav === true && cr.navNoTable === 58 && cr.navR === 116 && cr.hintOn, cr);
check('his shoals: at sea with the navigator at his chart table the minimap draws the beds under 2 m in their own colour; with him ashore, none', cr.shoalBeds > 0 && cr.shoalsAtSea > 0 && cr.shoalsAshore === 0, { beds: cr.shoalBeds, sea: cr.shoalsAtSea, ashore: cr.shoalsAshore });
// S1791 — where each was met, kept through aboard, ashore, a save and the sinking; their people from that port's stream, the same each time
check('each hand keeps the port they were met at (aboard, ashore, saved, sunk), and takes its people and nation, the same each time; a hand met before it has none', ['carpenter', 'cook', 'navigator'].every(r => cr.metSaved[r] === cr.metAfterSink[r] && cr.metSaved[r]) && cr.people.every(p => Array.isArray(p) && typeof p[0] === 'string' && p[1] === cr.siteNation) && JSON.stringify(cr.people) === JSON.stringify(cr.peopleAgain) && cr.oldSave === null, { met: cr.metSaved, sunk: cr.metAfterSink, people: cr.people, nation: cr.siteNation, old: cr.oldSave });
check('a save keeps who is aboard and who waits; sunk, they swim for the nearest port', cr.saved.crew.join() === 'carpenter,navigator' && cr.saved.ashore.join() === 'cook' && /swim for/.test(cr.sink) && cr.afterSink.crew === 0 && cr.afterSink.ashore === 3, cr);
// S1743 — the Weaver's shuttle: with the navigator at his station, the sea line also points to the nearest wreck not yet opened
const sh = await page.evaluate(() => { const ks = worldState.ship, kst = worldState.stats, ksail = SHIP.sailing, kx = SHIP.x, kz = SHIP.z, kwx = WX.type, out = {};
  worldState.ship = { cls: 'sloop', hold: {}, fit: ['bunks', 'chart'], crew: ['navigator'], ashore: {}, head: 'shuttle', heads: ['shuttle'] }; worldState.stats = {};
  const L = seaWrecks(); out.n = L.length; const w0 = L[Math.floor(L.length / 2)]; SHIP.x = w0.x + 300; SHIP.z = w0.z; SHIP.sailing = true; WX.type = 'clear';
  const near = () => { const V = worldState.stats.wrecks || {}; let b = null, bd = Infinity; for (const w of L) { if (V[w.key]) continue; const d = Math.hypot(w.x - SHIP.x, w.z - SHIP.z); if (d < bd) { bd = d; b = w; } } return { w: b, d: bd }; };
  SHUTTLE_W.t = 0; out.hint = seaHint(); const n0 = near(); out.want = n0.w.key; out.got = shuttleWreck() && shuttleWreck().key; out.d = Math.round(n0.d);
  out.dir = compassWord(n0.w.x - SHIP.x, n0.w.z - SHIP.z);
  // its sea chest opened: the line moves on to the next
  const [cx, cz] = n0.w.key.split(',').map(Number); const ch = { cx, cz, group: new THREE.Group(), sol: [], loot: [] }; spawnWreck(ch); out.chest = !!ch.loot[0];
  if (ch.loot[0]) { openLoot(ch.loot[0]); closeLoot(); } out.seen = !!(worldState.stats.wrecks && worldState.stats.wrecks[n0.w.key]);
  out.next = shuttleWreck() && shuttleWreck().key; out.nextWant = near().w.key; out.hint2 = seaHint();
  // the navigator ashore, or another figurehead: nothing
  worldState.ship.crew = []; SHUTTLE_W.t = 0; out.noNav = seaHint(); worldState.ship.crew = ['navigator']; worldState.ship.head = 'stone'; SHUTTLE_W.t = 0; out.noHead = seaHint(); worldState.ship.head = 'shuttle';
  // rain: the weather's ahead line and the wreck's together
  const kah = WX.ahead; WX.type = 'rain'; WX.ahead = 'storm'; SHUTTLE_W.t = 0; out.rain = seaHint(); WX.ahead = kah;
  // a save keeps the opened wreck
  const d = JSON.parse(ssStringify(_buildSavePayload())); worldState.stats = {}; _applyLoadData(d); out.kept = !!(worldState.stats && worldState.stats.wrecks && worldState.stats.wrecks[n0.w.key]);
  WX.type = kwx; SHIP.sailing = ksail; SHIP.x = kx; SHIP.z = kz; worldState.ship = ks; worldState.stats = kst; SHUTTLE_W.t = 0; return out; });
console.log(JSON.stringify(sh));
check(`the Weaver's shuttle and the navigator: the sea line points to the nearest unopened wreck of ${sh.n} (${sh.hint.trim()})`, sh.got === sh.want && new RegExp(`a wreck ${sh.d < 200 ? Math.round(sh.d / 10) * 10 : Math.round(sh.d / 50) * 50} m ${sh.dir}$`).test(sh.hint), sh);
check('its sea chest opened, the line moves on to the next nearest; a save keeps the opened wreck', sh.chest && sh.seen && sh.next !== sh.want && sh.next === sh.nextWant && sh.hint2 !== sh.hint && sh.kept, sh);
check('without the navigator, or under another figurehead, no wreck; in rain the weather\'s line and the wreck\'s together', sh.noNav === '' && sh.noHead === '' && / ahead · a wreck \d+ m /.test(sh.rain), sh);
await pick('sloop'); const i = await R();
check('back to a sloop pays: the yard pays 1067', i.acts.join() === 'Refit her as a sloop (the yard pays 1067 gold)', i.acts);
// the chat keeps no refit, sails or hold rows
const chat = await page.evaluate((pid) => WORLD.upgradeTopics(WORLD.siteAnywhere(pid)).map(t => t.label), pid);
check('the shipwright’s chat no longer carries refit, sails or hold rows', !chat.some(l => /^Refit|^Better sails|^Bigger hold/.test(l)), chat);
// S1834 — renaming her is free, at the yard (#979 B, session 5): typed into the field, E typed there does not close the panel
const rn = await page.evaluate(() => { YARD.cls = worldState.ship.cls || 'sloop'; yardPanelDraw(); const inp = document.getElementById('yard-name'); return { shown: !!inp, val: inp && inp.value, name: worldState.ship.name, gold }; });
await page.click('#yard-name', { clickCount: 3 }); await page.keyboard.type('the  Heron of Eastlake<>!');
const rn1 = await page.evaluate(() => ({ open: yardOpen, val: document.getElementById('yard-name').value }));
await page.keyboard.press('Enter'); await g.frames(1);
const rn2 = await page.evaluate(() => ({ name: worldState.ship.name, ship: SHIP.name, gold, said: document.getElementById('yard-said').textContent, val: document.getElementById('yard-name').value,
  log: GAME_LOG.slice(-3).map(l => l.text).join(' | '), blank: renameShip('  <> '), tooLong: shipNameClean('a'.repeat(40)).length,
  sunk: (() => { worldState.ship.sunk = { x: 0, z: 0 }; const r = renameShip('Mercy'); delete worldState.ship.sunk; return r; })(), after: worldState.ship.name }));
console.log(JSON.stringify({ rn, rn1, rn2 }));
check('her page shows her name in a field with Rename her', rn.shown && rn.val === rn.name && rn.val.length > 0, rn);
check('typing her name (an E among it) keeps the yard open', rn1.open && /Eastlake/.test(rn1.val), rn1);
check('renamed: "the" and the marks dropped, the Heron of Eastlake, free, kept on the ship and SHIP, said and logged', rn2.name === 'Heron of Eastlake' && rn2.ship === 'Heron of Eastlake' && rn2.gold === rn.gold && rn2.said === 'Renamed: the Heron of Eastlake.' && rn2.val === 'Heron of Eastlake' && /is the Heron of Eastlake now/.test(rn2.log), rn2);
check('a blank name is refused, a long one held to 24, a sunk ship not renamed', rn2.blank === null && rn2.tooLong === 24 && rn2.sunk === null && rn2.after === 'Heron of Eastlake', rn2);
// S1845 — her paint and her sails (#979 B, session 5; the look builder's swatches, #1133): 50 gold and an hour each, from the yard's own
// island's four paints and three cloths, only on a ship of that island's build; kept in the world's row
const pt = await page.evaluate(() => { YARD.cls = worldState.ship.cls || 'sloop'; yardPanelDraw(); const st = worldState.ship, out = { cls: st.cls, dress: herDress() };
  const rows = k => [...document.querySelectorAll(`#yard-acts button[data-paint="${k}"]`)];
  out.paints = rows('paint').map(b => b.textContent.trim()); out.cloths = rows('cloth').map(b => b.textContent.trim()); out.W = shipSwatches();
  gold = 500; const g0 = gold, m0 = worldState.gameTimeAbsMinutes; rows('paint')[2].click();
  out.p = { gold: g0 - gold, mins: Math.round(worldState.gameTimeAbsMinutes - m0), paint: st.paint, said: document.getElementById('yard-said').textContent, log: GAME_LOG.slice(-1)[0].text,
    mesh: SHIP.mesh ? (SHIP.mesh.userData.swatch || null) : 'none', hers: rows('paint')[2].textContent };
  const g1 = gold; out.again = paintShip('paint', 2, YARD.site); out.againGold = g1 - gold;
  rows('cloth')[1].click(); out.c = { gold: g1 - gold, cloth: st.cloth, said: document.getElementById('yard-said').textContent, mesh: SHIP.mesh ? (SHIP.mesh.userData.swatch || null) : 'none' };
  out.stage = YARD.m[YARD.cls] && YARD.m[YARD.cls].userData.swatch || null;
  const gp = WORLD.allPorts().find(p => WORLD.cargoNation(p) !== out.dress); out.away = gp ? paintShip('paint', 1, gp) : 'no port';
  const kg = gold; gold = 10; out.poor = paintShip('paint', 3, YARD.site); gold = kg; out.bad = paintShip('paint', 9, YARD.site);
  out.dressOf = [herDress('cutter', 'gatelands'), herDress('caravel', 'mark'), herDress('cog', 'aurenne'), herDress('sloop', 'gatelands')];
  const d = JSON.parse(ssStringify(_buildSavePayload())); st.paint = 0; st.cloth = 0; _applyLoadData(d); out.kept = [worldState.ship.paint, worldState.ship.cloth];
  return out; });
console.log(JSON.stringify(pt));
check(`her yard shows her dress's (${pt.dress}) four paints and three cloths, hers marked`, pt.paints.length === 4 && pt.cloths.length === 3 && pt.paints.every((t, i) => t.toLowerCase().startsWith(pt.W.paints[i].name.toLowerCase())) && /\(hers\)/.test(pt.paints[0]), pt);
check('painted: 50 gold, an hour, kept on her, said and logged, laid on her mesh', pt.p.gold === 50 && pt.p.mins === 60 && pt.p.paint === 2 && pt.p.said === `Painted ${pt.W.paints[2].name}.` && new RegExp(`is painted ${pt.W.paints[2].name}`).test(pt.p.log) && /\(hers\)/.test(pt.p.hers) && (pt.p.mesh === 'none' || pt.p.mesh.paint === 2), pt.p);
check('the same paint again costs nothing and is refused', /already/.test(pt.again) && pt.againGold === 0, pt);
check('new sails: 50 gold, kept, said; her mesh and her hull on the stage wear both', pt.c.gold === 50 && pt.c.cloth === 1 && /sails\.$/.test(pt.c.said) && (pt.c.mesh === 'none' || (pt.c.mesh.paint === 2 && pt.c.mesh.cloth === 1)) && (!pt.stage || (pt.stage.paint === 2 && pt.stage.cloth === 1)), pt.c);
check('another island’s yard will not paint her; short of 50, refused; no such colour, refused', /own island/.test(pt.away) && pt.poor === 'It is 50 gold.' && pt.bad === 'No such colour.', pt);
check('her dress is her hull’s: the cutter the Mark’s, the caravel Aurenne’s, the rest the yard’s', pt.dressOf.join() === 'mark,aurenne,aurenne,gatelands', pt.dressOf);
check('a save keeps her paint and her sails', pt.kept.join() === '2,1', pt.kept);
// sunk: nothing offered, the note says so
await page.evaluate(() => { worldState.ship.sunk = { x: 0, z: 0 }; yardPanelDraw(); }); const j = await R();
check('sunk: no offers, a note to ask about raising her', j.acts.length === 0 && /lies on the bottom/.test(j.note), j);
await page.evaluate(() => { delete worldState.ship.sunk; });
// E closes it and the stage stops
await page.keyboard.press('e'); await g.frames(3);
const k = await page.evaluate(() => ({ open: yardOpen, shown: document.getElementById('yardui').style.display, raf: YARD.raf, dlg: dlgOpen }));
check('E closes the yard, the stage stops, nothing else opens', !k.open && k.shown === 'none' && !k.raf && !k.dlg, k);
// S1880 — the chart table read: E at it in the caravel's cabin opens the world map with every bed under 2 m drawn as a shoal, its tiles kept
// apart; closing the hub puts the plain map back. Not without the fitting, not under sail.
const ch = await page.evaluate(() => { const out = {};
  let c = null; for (let a = 0; a < 6.28 && !c; a += .2) { const cx = Math.cos(a), cz = Math.sin(a);
    for (let d = 20; d < 1500; d += 4) { const x = px + cx * d, z = pz + cz * d; if (WORLD.worldH(x, z) > WORLD.SEA_Y - 1.4) continue;
      let deep = true; for (let k = 4; k <= 60; k += 4) if (WORLD.worldH(px + cx * (d + k), pz + cz * (d + k)) > -4) { deep = false; break; }
      if (deep) c = { cx, cz, x0: x, z0: z }; break; } }
  if (!c) return null; if (SHIP.mesh) { sc.remove(SHIP.mesh); SHIP.mesh = null; }
  worldState.ship = { cls: 'caravel', name: 'Test Gull', hull: 100, rig: 100, fit: [] }; WORLD.spawnShip(c.x0 + c.cx * 40, c.z0 + c.cz * 40, Math.atan2(c.cx, c.cz)); SHIP.sailing = false; SHIP.speed = 0;
  const m = SHIP.mesh, t = m.userData.chart; out.table = !!t; if (!t) return out; m.updateMatrixWorld(true);
  const v = new THREE.Vector3(t.x - t.hx - .3, 0, t.z).applyMatrix4(m.matrixWorld); px = v.x; pz = v.z; jumpY = DECK_Y;
  out.unfitted = [chartDeckNear(), shipPrompt()]; worldState.ship.fit.push('chart'); out.fitted = [chartDeckNear(), shipPrompt()];
  SHIP.sailing = true; out.sailing = chartDeckNear(); SHIP.sailing = false;
  shipInteract(); out.read = { hub: hubOpen, sh: MAP.shoals, mid: screenToMap(MAP.cssW / 2, MAP.cssH / 2).map(q => Math.round(q)), ship: [Math.round(SHIP.x), Math.round(SHIP.z)] };
  // a map tile on the nearest shore, plain and read at the table
  let s = null; for (let a = 0; a < 6.28 && !s; a += .2) for (let d = 4; d < 1500; d += 4) { const x = SHIP.x + Math.cos(a) * d, z = SHIP.z + Math.sin(a) * d, h = WORLD.worldH(x, z); if (h < 0 && h > -2) { s = { x, z }; break; } }
  const [i, j] = cellOf(s.x, s.z), cl = getCell(i, j), L = 5, span = WORLD.SIZE / (1 << L), qi = Math.floor((s.x - cl.ox) / span), qj = Math.floor((s.z - cl.oz) / span);
  const tile = () => { const q = mapStartQ(cl, L, qi, qj, 128); for (let n = 0; !q.done && n < 400; n++) mapStepQ(q, 1e9, performance.now());
    const d = q.ctx.getImageData(0, 0, 128, 128).data; let k = 0; for (let o = 0; o < d.length; o += 4) if (d[o] === 0x76 && d[o + 1] === 0x88 && d[o + 2] === 0x8e) k++; return k; };
  out.shoalsRead = tile(); closeHub(); out.after = MAP.shoals; out.shoalsPlain = tile();
  sc.remove(SHIP.mesh); SHIP.mesh = null; return out; });
console.log(JSON.stringify(ch));
check('her chart table: no prompt unfitted or under sail; fitted, E reads it', ch && ch.table && ch.unfitted[0] === false && ch.unfitted[1] !== "Press 'E' to read the chart" && ch.fitted[0] === true && ch.fitted[1] === "Press 'E' to read the chart" && ch.sailing === false, ch);
check('read at the table, the world map opens on her with the beds under 2 m drawn as shoals; closed, the plain map has none', ch && ch.read.hub && ch.read.sh && Math.hypot(ch.read.mid[0] - ch.read.ship[0], ch.read.mid[1] - ch.read.ship[1]) < 2 && ch.shoalsRead > 0 && ch.after === false && ch.shoalsPlain === 0, ch);
await page.evaluate(() => { worldState.ship = null; });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
