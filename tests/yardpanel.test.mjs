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
    stage: !!(YARD.m[YARD.cls] && YARD.m[YARD.cls].visible), tris: YARD.r ? YARD.r.info.render.triangles : -1 }; });
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
