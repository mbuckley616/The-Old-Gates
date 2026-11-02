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
// S1735 — the wreck's maiden: in each island's deepest wreck, worked out once by the chunks' hashes and the bed, the same on a second count
const mw = await page.evaluate(() => { const kb = BAG.slice(), ks = worldState.ship, out = {}; worldState.ship = { cls: 'sloop' }; BAG.length = 0;
  MAIDEN_WRECKS = null; const t0 = performance.now(); const W = maidenWrecks(); out.ms = Math.round(performance.now() - t0); out.W = JSON.parse(JSON.stringify(W)); MAIDEN_WRECKS = null; out.same = JSON.stringify(maidenWrecks()) === JSON.stringify(W);
  const spawn = key => { const [cx, cz] = key.split(',').map(Number); const ch = { cx, cz, group: new THREE.Group(), sol: [], loot: [] }; spawnWreck(ch); const c = ch.loot[0]; return c ? { at: [Math.round(c.x), Math.round(c.z)], heads: c.items.filter(i => i.figurehead).map(i => i.figurehead) } : null; };
  const n0 = Object.keys(W)[0]; out.nations = Object.keys(W).sort(); out.deep = spawn(W[n0].key); out.bedOk = Object.values(W).every(w => w.bed < -2.5 && w.bed > -8);
  out.bed = worldH(W[n0].x, W[n0].z) === W[n0].bed;
  let other = null; for (let cz = 0; cz < 450 && !other; cz++) for (let cx = 0; cx < 450 && !other; cx++) { const k = cx + ',' + cz; if (hash01(cx, cz, 150) > .06 || Object.values(W).some(w => w.key === k)) continue; const r = spawn(k); if (r) other = r; }
  out.other = other; grantHead('maiden'); out.after = spawn(W[n0].key);
  BAG.splice(0, BAG.length, ...kb); worldState.ship = ks; return out; });
console.log(JSON.stringify(mw));
check(`the wreck's maiden lies in each island's deepest wreck (${mw.nations.join(', ')}; beds ${Object.values(mw.W).map(w => w.bed.toFixed(3)).join(', ')} m; worked out in ${mw.ms} ms), the same on a second count`, mw.nations.join() === 'aurenne,gatelands,mark' && mw.bedOk && mw.bed && mw.same && mw.deep && mw.deep.heads.join() === 'maiden', mw);
check('another wreck holds no figurehead, and hers none once the maiden is found', mw.other && mw.other.heads.length === 0 && mw.after && mw.after.heads.length === 0, { other: mw.other, after: mw.after });
await pick('sloop'); const i = await R();
check('back to a sloop pays: the yard pays 1067', i.acts.join() === 'Refit her as a sloop (the yard pays 1067 gold)', i.acts);
// the chat keeps no refit, sails or hold rows
const chat = await page.evaluate((pid) => WORLD.upgradeTopics(WORLD.siteAnywhere(pid)).map(t => t.label), pid);
check('the shipwright’s chat no longer carries refit, sails or hold rows', !chat.some(l => /^Refit|^Better sails|^Bigger hold/.test(l)), chat);
// sunk: nothing offered, the note says so
await page.evaluate(() => { worldState.ship.sunk = { x: 0, z: 0 }; yardPanelDraw(); }); const j = await R();
check('sunk: no offers, a note to ask about raising her', j.acts.length === 0 && /lies on the bottom/.test(j.note), j);
await page.evaluate(() => { delete worldState.ship.sunk; });
// E closes it and the stage stops
await page.keyboard.press('e'); await g.frames(3);
const k = await page.evaluate(() => ({ open: yardOpen, shown: document.getElementById('yardui').style.display, raf: YARD.raf, dlg: dlgOpen }));
check('E closes the yard, the stage stops, nothing else opens', !k.open && k.shown === 'none' && !k.raf && !k.dlg, k);
await page.evaluate(() => { worldState.ship = null; });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
