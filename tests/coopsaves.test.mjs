// Two saves (Session 453, backlog K, Michael's A on #119, docs/design/online-play.md rule 1): a slot writes a character row
// and a world row; a load reads both and solo play comes back whole; an old one-row save splits on boot and loads to the
// same gold, bag, position, quest stages and looted flags; the character export holds no world, the world export holds it;
// a character row loads into another world (the shape a guest's load takes).
import { boot, check } from './lib/game.mjs'; import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const W = ms => page.waitForTimeout(ms);
const sk = `(function sk(v) { return Array.isArray(v) ? v.map(sk) : (v && typeof v === 'object') ? Object.keys(v).sort().reduce((o, k) => (o[k] = sk(v[k]), o), {}) : v; })`;

// 1. change the character and the world, save a slot
const set = await page.evaluate(() => {
  playerName = 'Traveller'; gold = 777; level = 7; ATTRS.might = (ATTRS.might || 10) + 3;
  BAG.push({ name: 'Blue Stone', ico: '💎', type: 'misc', weight: .1, sellMult: 1, buyPrice: 9, qty: 2 });
  worldState.gameTimeMinutes = 1000; worldState.gameTimeAbsMinutes = 5000;
  worldState.boxes = { g_test_3: { taken: 2 } }; worldState.picked = { g_test_3: 4400 };
  const qid = Object.keys(QS)[1]; QS[qid].state = 'active'; QS[qid].objectives[0].current = 1;
  worldState.stats = Object.assign(worldState.stats || {}, { sold: 11 }); worldState.favor = { dunmore: 3 };
  saveToSlot(0);
  return { qid, might: ATTRS.might, px, pz };
});
await W(1500);
const rows = await page.evaluate(async () => { const m = SS.idx.find(e => e.kind === 'manual' && e.slot === 0); const cs = await ssGet(m.key), ws = await ssGet(ssWorldKey(m.key)); return { meta: m, c: JSON.parse(cs), w: JSON.parse(ws), sizes: [cs.length, ws.length] }; });
check('one index entry per slot, v3, sized for both rows', rows.meta.v === 3 && rows.meta.size === rows.sizes[0] + rows.sizes[1] && rows.meta.gold === 777, { v: rows.meta.v, size: rows.meta.size, sizes: rows.sizes });
check('the character row carries the character', rows.c.v === 3 && rows.c.gold === 777 && rows.c.level === 7 && rows.c.ATTRS.might === set.might && rows.c.BAG.some(it => it && it.name === 'Blue Stone')
  && Math.abs(rows.c.px - set.px) < .01 && rows.c.wS.stats.sold === 11 && rows.c.wS.favor.dunmore === 3 && rows.c.wS.look !== undefined, { gold: rows.c.gold, level: rows.c.level });
check('and no world', rows.c.QS === undefined && rows.c.merchantStock === undefined && !('gameTimeMinutes' in rows.c.wS) && !('boxes' in rows.c.wS) && !('towns' in rows.c.wS) && !('ashenmoorBurned' in rows.c.wS), Object.keys(rows.c.wS));
check('the world row carries the world', rows.w.v === 3 && rows.w.QS[set.qid].state === 'active' && rows.w.wS.gameTimeMinutes === 1000 && rows.w.wS.gameTimeAbsMinutes === 5000 && rows.w.wS.boxes.g_test_3.taken === 2
  && rows.w.wS.picked.g_test_3 === 4400 && rows.w.charId === rows.c.charId, { qs: rows.w.QS[set.qid].state, clock: rows.w.wS.gameTimeMinutes });
check('and no character', rows.w.gold === undefined && rows.w.BAG === undefined && rows.w.EQ === undefined && rows.w.px === undefined && !('stats' in rows.w.wS) && !('favor' in rows.w.wS) && !('look' in rows.w.wS), Object.keys(rows.w));
const lossless = await page.evaluate((skSrc) => { const sk = (0, eval)(skSrc); const d = JSON.parse(ssStringify(_buildSavePayload())); const r = ssSplitPayload(d); const j = ssJoinPayload(r.c, r.w);
  const a = JSON.stringify(sk(d)), b = JSON.stringify(sk(j)); return { same: a === b, keys: Object.keys(d).length, cKeys: Object.keys(r.c).length, wKeys: Object.keys(r.w).length, wsC: Object.keys(r.c.wS).length, wsW: Object.keys(r.w.wS).length }; }, sk);
check('join(split(d)) is d', lossless.same, lossless);

// 2. reload the page, Continue: both come back
g.errs.length = 0; await page.reload(); await W(5000);
await page.evaluate(() => document.getElementById('cb').click()); await W(12000); await g.hide();
const back = await page.evaluate((qid) => ({ started, gold, level, might: ATTRS.might, stone: BAG.filter(it => it && it.name === 'Blue Stone').length, px, pz, clock: worldState.gameTimeMinutes, abs: worldState.gameTimeAbsMinutes,
  qs: QS[qid].state, obj: QS[qid].objectives[0].current, box: worldState.boxes && worldState.boxes.g_test_3 && worldState.boxes.g_test_3.taken, picked: worldState.picked && worldState.picked.g_test_3, sold: worldState.stats && worldState.stats.sold, fav: worldState.favor && worldState.favor.dunmore }), set.qid);
check('the character comes back', back.started && back.gold === 777 && back.level === 7 && back.might === set.might && back.stone === 1 && Math.abs(back.px - set.px) < .5 && Math.abs(back.pz - set.pz) < .5 && back.sold === 11 && back.fav === 3, back);
check('and the world', back.qs === 'active' && back.obj === 1 && back.clock >= 1000 && back.clock < 1010 && back.abs >= 5000 && back.abs < 5010 && back.box === 2 && back.picked === 4400, back);

// 3. a save in the old one-row shape (v2), written by hand into the store and the index: the boot splits it, Continue loads the same state
const old = await page.evaluate(async (qid) => { const d = _buildSavePayload(); d.v = 2; d.charId = 'oldone'; d.wS.charId = 'oldone'; d.pName = 'Old One'; d.gold = 4242; d.level = 9; d.ts = Date.now() + 5;
  d.BAG = d.BAG.filter(it => !(it && it.name === 'Blue Stone')); d.BAG.push({ name: 'Red Stone', ico: '💎', type: 'misc', weight: .1, sellMult: 1, buyPrice: 9, qty: 1 });
  d.wS.gameTimeMinutes = 800; d.wS.boxes = { g_x_1: { taken: 1 } }; d.wS.picked = {}; d.QS[qid].state = 'complete'; d.wS.stats = { sold: 5 };
  const raw = JSON.stringify(d); await ssPut('oldone_manual_2', raw); const meta = ssMetaFrom(d, 'manual', 2); meta.size = raw.length; SS.idx.push(meta); ssSaveIndex(); ssSetActive('oldone_manual_2'); return { len: raw.length, px: d.px, pz: d.pz }; }, set.qid);
g.errs.length = 0; await page.reload(); await W(5000);
const split = await page.evaluate(async (skSrc) => { const m = SS.idx.find(e => e.key === 'oldone_manual_2'); const cs = await ssGet('oldone_manual_2'), ws = await ssGet(ssWorldKey('oldone_manual_2'));
  const c = cs && JSON.parse(cs), w = ws && JSON.parse(ws); return { v: m && m.v, size: m && m.size, two: !!(cs && ws), cv: c && c.v, cGold: c && c.gold, cQS: c && c.QS, wClock: w && w.wS && w.wS.gameTimeMinutes, wBox: w && w.wS && w.wS.boxes, cStats: c && c.wS && c.wS.stats }; }, sk);
check('the boot split the one-row save into two rows', split.two && split.v === 3 && split.cv === 3 && split.cGold === 4242 && split.cQS === undefined && split.wClock === 800 && split.wBox && split.wBox.g_x_1.taken === 1 && split.cStats && split.cStats.sold === 5 && split.size > old.len, split);
await page.evaluate(() => document.getElementById('cb').click()); await W(12000); await g.hide();
const same = await page.evaluate((qid) => ({ started, gold, level, cid: worldState.charId, name: playerName, red: BAG.filter(it => it && it.name === 'Red Stone').length, blue: BAG.filter(it => it && it.name === 'Blue Stone').length, px, pz,
  clock: worldState.gameTimeMinutes, qs: QS[qid].state, box: worldState.boxes && worldState.boxes.g_x_1 && worldState.boxes.g_x_1.taken, sold: worldState.stats && worldState.stats.sold }), set.qid);
check('the old save loads to the same state', same.started && same.gold === 4242 && same.level === 9 && same.cid === 'oldone' && same.name === 'Old One' && same.red === 1 && same.blue === 0 && Math.abs(same.px - old.px) < .5 && Math.abs(same.pz - old.pz) < .5
  && same.clock >= 800 && same.clock < 810 && same.qs === 'complete' && same.box === 1 && same.sold === 5, same);

// 4. export: the character file holds no world; the world file holds it; both buttons are in the menu
await page.evaluate(() => openSLMenu('load', false)); await W(600);
const btns = await page.evaluate(() => [...document.querySelectorAll('#sl-slots button')].map(b => b.textContent).filter(t => /Export|World/.test(t)));
check('the menu offers Export and World per character', btns.filter(t => /Export/.test(t)).length >= 2 && btns.filter(t => /World/.test(t)).length >= 2, btns);
const dl = async (fn) => { const [d] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.evaluate(fn)]); return fs.readFileSync(await d.path(), 'utf8'); };
const charTxt = await dl(() => ssExportChar('oldone')); const worldTxt = await dl(() => ssExportWorld('oldone'));
const cdoc = JSON.parse(charTxt), wdoc = JSON.parse(worldTxt);
const crows = cdoc.saves.map(r => JSON.parse(r.data)), wrows = wdoc.saves.map(r => JSON.parse(r.data));
const worldKeys = ['gameTimeMinutes', 'gameTimeAbsMinutes', 'boxes', 'picked', 'towns', 'ashenmoorBurned', 'wcleared', 'lairs', 'ship', 'story'];
check('the character file is the character alone', cdoc.format === 'the-old-gates/character' && cdoc.v === 2 && crows.length === 1 && crows.every(c => c.gold === 4242 && c.QS === undefined && c.merchantStock === undefined && !worldKeys.some(k => k in (c.wS || {})))
  && !/gameTimeMinutes|ashenmoorBurned|"QS"/.test(charTxt), { rows: crows.length, ws: crows[0] && Object.keys(crows[0].wS) });
check('the world file is the world', wdoc.format === 'the-old-gates/world' && wrows.length === 1 && wrows[0].wS.gameTimeMinutes === 800 && wrows[0].QS && wrows[0].QS[set.qid].state === 'complete' && wrows[0].gold === undefined && wrows[0].BAG === undefined && wrows[0].charId === 'oldone', { rows: wrows.length });
// delete the character, import the character file alone: it loads into a fresh world; then the world file: the world is back
await page.evaluate(() => ssDeleteChar('oldone')); await W(800);
const imp = (txts) => page.evaluate(async (ts) => { const r = await ssImportFiles(ts.map((t, i) => new File([t], 'f' + i + '.json'))); return r ? r.length : null; }, txts);
check('the character file imports', (await imp([charTxt])) === 1);
const alone = await page.evaluate(async (qid) => { const r = await ssLoadRows('oldone_manual_2'); return { w: r && r.w, cGold: r && r.c.gold }; }, set.qid);
check('a character with no world row loads alone', alone.w === null && alone.cGold === 4242, alone);
check('the world file imports beside it, no new slot', (await imp([worldTxt])) === 0);
const paired = await page.evaluate(async (qid) => { const r = await ssLoadRows('oldone_manual_2'); const d = await ssLoad('oldone_manual_2'); return { hasW: !!(r && r.w), clock: d && d.wS.gameTimeMinutes, qs: d && d.QS[qid].state, gold: d && d.gold, meta: ssEntry('oldone_manual_2') && ssEntry('oldone_manual_2').v }; }, set.qid);
check('the pair loads as one save', paired.hasW && paired.clock === 800 && paired.qs === 'complete' && paired.gold === 4242 && paired.meta === 3, paired);
// both files at once, as a second character (the id is taken): the rename carries the world with it
check('both files at once import as a second character', (await imp([charTxt, worldTxt])) === 1 && (await page.evaluate(() => ssChars().filter(c => /Old One/.test(c.name)).length)) === 2);
const second = await page.evaluate(async () => { const c = ssChars().find(c => /imported/.test(c.name)); const r = c && await ssLoadRows(c.saves[0].key); return { id: c && c.id, hasW: !!(r && r.w), clock: r && r.w && r.w.wS.gameTimeMinutes }; });
check('the renamed character keeps its world', second.id !== 'oldone' && second.hasW && second.clock === 800, second);

// 5. the guest shape: this character's row into another world
const guest = await page.evaluate(async (qid) => { const r = await ssLoadRows('oldone_manual_2'); const w2 = JSON.parse(JSON.stringify(r.w)); w2.wS.gameTimeMinutes = 600; w2.wS.boxes = {}; w2.QS[qid].state = 'available';
  _applyLoadData(r.c, w2); return { gold, level, clock: worldState.gameTimeMinutes, box: worldState.boxes && Object.keys(worldState.boxes).length, qs: QS[qid].state, sold: worldState.stats && worldState.stats.sold }; }, set.qid);
check('a character row loads into another world', guest.gold === 4242 && guest.level === 9 && guest.clock === 600 && guest.box === 0 && guest.qs === 'available' && guest.sold === 5, guest);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
