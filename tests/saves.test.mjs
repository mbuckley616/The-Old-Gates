// Saves: a slot, an overwrite, the autosave ring, and a bloated legacy save migrating and loading.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { playerName = 'Traveller'; gold = 359; level = 5; saveToSlot(0); }); await page.waitForTimeout(900);
await page.evaluate(() => { SS.lastAuto = 0; saveGame(true); }); await page.waitForTimeout(900);
const idx = await page.evaluate(() => SS.idx.map(e => e.key));
check('manual slot written', idx.some(k => k.endsWith('_manual_0')), idx);
check('autosave written', idx.some(k => k.includes('_auto_')), idx);
const before = await page.evaluate(() => SS.idx.find(e => e.key.endsWith('_manual_0')).size);
await page.evaluate(() => { gold = 999; saveToSlot(0); }); await page.waitForTimeout(900);
const loaded = await page.evaluate(async () => { const m = SS.idx.find(e => e.key.endsWith('_manual_0')); const d = await ssLoad(m.key); return d && d.gold; });
check('overwrite loads the newer gold', loaded === 999, { before, loaded });
// legacy migration: the s135 way of storing a save
const legacy = await page.evaluate(() => { const d = _buildSavePayload(); delete d.charId; if (d.wS) delete d.wS.charId; return JSON.stringify(d); });
await page.evaluate((raw) => { localStorage.clear(); localStorage.setItem('DOS_save_0', raw); localStorage.setItem('DOS_save_active', '0');
  return new Promise(r => { const q = indexedDB.deleteDatabase('the_old_gates'); q.onsuccess = q.onerror = q.onblocked = () => r(); }); }, legacy);
g.errs.length = 0; await page.reload(); await page.waitForTimeout(5000);
check('legacy save migrated', await page.evaluate(() => SS.idx.some(e => e.key === 'legacy_manual_0')));
await page.evaluate(() => document.getElementById('cb').click()); await page.waitForTimeout(12000); await g.hide();
const st = await page.evaluate(() => ({ started, gold, cid: worldState.charId }));
check('Continue loads the legacy character', st.started && st.cid === 'legacy' && st.gold === 999, st);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
