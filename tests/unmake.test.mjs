// The unmaking (Session 1364; docs/design/great-gates-build.md, session 5 and "The suites"; Michael's B on #413, every save ends, and
// his A on #650, a file made before it is refused). Three slots, an autosave, an old DOS_save_ key and og_carry; five great gates
// torn; the sixth knot asks once (#413's line, the grey warning), and cut, it unmakes: after it nothing of a save is left in the
// store or the index, og_unmade is stamped, the settings are kept. Reloaded, the title has no save; an older file is refused with
// *That world is gone.* and a newer one loads; and an unmaking cut short after the stamp is finished at the next index read.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const pre = await page.evaluate(async () => {
  for (const n of [0, 1, 2]) await saveToSlot(n);
  SS.lastAuto = 0; await ssAutosave();
  localStorage.setItem('og_carry', JSON.stringify({ name: 'X', seed: 7 })); localStorage.setItem('DOS_save_3', '{}');
  localStorage.setItem('og.settings', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('og.settings') || '{}'), { fov: 77 })));
  for (const s of ['tine', 'uisce', 'cloch', 'scath', 'solas']) setGreatGate(s, 'torn');
  return { slots: SS.idx.length, level: corruptionLevel() }; });
console.log(JSON.stringify(pre));
check(`before: ${pre.slots} saves (three slots and an autosave at least), five great gates torn`, pre.slots >= 4 && pre.level === 5, pre);
await page.evaluate(() => devGreatGate('gaoth', 2055));
await enterDungeon(page, { theme: 'ruins', size: 'medium', seed: 2055 });
const ask = await page.evaluate(() => {
  const L = KNOT_LIE; px = L.x + 1.5; pz = L.z; currentFloor = L.floor; knotTick();
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i] && BAG[i].artifact) BAG.splice(i, 1);
  BAG.push(greatToolItem('looseKnife'));
  const u = knotUse(), el = document.getElementById('dlg-text');
  return { u, open: dlgOpen, text: el && el.textContent, grey: !!(el && el.querySelector('span')), state: greatGateState('gaoth'), labels: dlgNPC && dlgNPC.topics.map(t => t.label) }; });
console.log(JSON.stringify(ask));
check('the sixth cut asks once: #413\'s line, the grey warning under it, and nothing is cut yet',
  ask.u === 'ask' && ask.open && ask.text === 'This is the last of them. Cut it, and there is no coming back to this world.Every saved game in this browser will be deleted.' && ask.grey && !ask.state && ask.labels.join('|') === 'Cut the knot.|Leave it.', ask);
const done = await page.evaluate(async () => {
  window._unmade = false; KNOT_UNMAKE_THEN = () => { window._unmade = true; };
  const t0 = performance.now(), msgs = [], keep = showMsg; showMsg = (m, c) => { msgs.push([Math.round(performance.now() - t0), m]); return keep(m, c); };
  dlgNPC.topics[0].fn(); await new Promise(r => setTimeout(r, 200));
  const during = await saveToSlot(5);
  for (let i = 0; i < 200 && !window._unmade; i++) await new Promise(r => setTimeout(r, 100));
  showMsg = keep;
  const count = await new Promise(res => { const q = indexedDB.open('the_old_gates'); q.onsuccess = () => { const db = q.result, c = db.transaction('saves', 'readonly').objectStore('saves').count(); c.onsuccess = () => { res(c.result); db.close(); }; c.onerror = () => res(-1); }; q.onerror = () => res(-2); });
  const ls = k => localStorage.getItem(k);
  return { unmade: window._unmade, ms: Math.round(performance.now() - t0), msgs: msgs.map(m => [m[0], m[1].slice(0, 30)]), during, fate: greatFate(), idx: SS.idx.length, index: ls('OG_save_index'), rows: count,
    stamp: !!ssUnmadeAt(), carry: ls('og_carry'), dos: ls('DOS_save_3'), active: ls('OG_save_active'), fov: JSON.parse(ls('og.settings') || '{}').fov }; });
console.log(JSON.stringify(done));
check(`cut: the lines on the clock, then the unmaking at 5 s (${done.ms} ms), the fate torn, nothing written meanwhile`, done.unmade && done.ms >= 5000 && done.msgs.length >= 2 && done.msgs[1][0] >= 2400 && done.fate === 'torn' && done.during === null, done);
check(`every save gone: the index empty, ${done.rows} rows in the store, no active key, no DOS_save_ key, no og_carry`, done.idx === 0 && done.index === '[]' && done.rows === 0 && done.active === null && done.dos === null && done.carry === null, done);
check('the stamp written and the settings kept', done.stamp && done.fov === 77, done);
g.errs.length = 0; await page.reload(); await page.waitForFunction(() => typeof SS !== 'undefined' && SS.ready, null, { timeout: 120000 });
const title = await page.evaluate(() => ({ idx: SS.idx.length, any: hasAnySave(), started, stamp: !!ssUnmadeAt() }));
check('reloaded: the title, with no save to continue', title.idx === 0 && !title.any && !title.started && title.stamp, title);
// a character file dated a minute before the stamp, one with no date (a v1 file), and one dated now
const im = await page.evaluate(async () => {
  const shown = [], keep = showMsg; showMsg = (m, c) => { shown.push(m); return keep(m, c); };
  const u = ssUnmadeAt(), row = JSON.stringify({ v: SAVE_VERSION, charId: 'cOld', pName: 'Old Hand', level: 3, gold: 5, wS: {} }), split = ssSplitPayload(JSON.parse(row));
  const doc = t => JSON.stringify({ format: SS_FILE, v: 2, exported: t, char: { id: 'cOld', name: 'Old Hand', level: 3 }, saves: [{ kind: 'manual', slot: 0, data: JSON.stringify(split.c) }] });
  const a = await ssImportFiles([new File([doc(u - 60000)], 'old.json')]), n0 = SS.idx.length;
  const noDate = await ssImportFiles([new File([JSON.stringify({ format: SS_FILE, v: 1, char: { id: 'cX' }, saves: [{ kind: 'manual', slot: 0, data: JSON.stringify(split.c) }] })], 'v1.json')]);
  const b = await ssImportFiles([new File([doc(Date.now())], 'new.json')]);
  showMsg = keep; return { refused: a === null && n0 === 0, noDate: noDate === null, gone: shown.filter(m => m === 'That world is gone.').length, took: SS.idx.length }; });
console.log(JSON.stringify(im));
check('a file made before the unmaking is refused with *That world is gone.* (one with no date too); one made after loads', im.refused && im.noDate && im.gone === 2 && im.took === 1, im);
const cut = await page.evaluate(() => {
  const u = ssUnmadeAt(); SS.idx.push({ key: 'cGhost_manual_1', charId: 'cGhost', kind: 'manual', slot: 1, ts: u - 1000 }); ssSaveIndex();
  const n = ssLoadIndex().length; return { n, ghost: SS.idx.some(e => e.charId === 'cGhost'), kept: SS.idx.some(e => e.charId === 'cOld') }; });
check('an unmaking cut short after the stamp is finished at the next index read: the older row goes, the newer stays', !cut.ghost && cut.kept, cut);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
