// Saves: a slot, an overwrite, the autosave ring, and a bloated legacy save migrating and loading.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
// S566 — the writes are async (IndexedDB): wait on the slot's own promise and for the autosave to reach the index, up to a
// minute, where a fixed 0.9 s missed the manual slot on a loaded CI runner (the overwrite below found it a moment later)
await page.evaluate(() => { playerName = 'Traveller'; gold = 359; level = 5; return saveToSlot(0).then(() => 1); });
await page.evaluate(() => { SS.lastAuto = 0; saveGame(true); });
await page.waitForFunction(() => SS.idx.some(e => e.key.endsWith('_manual_0')) && SS.idx.some(e => e.key.includes('_auto_')), null, { timeout: 60000 }).catch(() => {});
const idx = await page.evaluate(() => SS.idx.map(e => e.key));
check('manual slot written', idx.some(k => k.endsWith('_manual_0')), idx);
check('autosave written', idx.some(k => k.includes('_auto_')), idx);
const before = await page.evaluate(() => SS.idx.find(e => e.key.endsWith('_manual_0')).size);
await page.evaluate(() => { gold = 999; return saveToSlot(0).then(() => 1); });
const loaded = await page.evaluate(async () => { const m = SS.idx.find(e => e.key.endsWith('_manual_0')); const d = await ssLoad(m.key); return d && d.gold; });
check('overwrite loads the newer gold', loaded === 999, { before, loaded });
// S2508 — every item the game defines keeps its fields through the save's list (`_serItem`, 70-saves.js): S2494's probe found fifteen
// lost, this one three more (a bedroll's `roll`, a tent's `tent`, a sword's `swordMake`). Fields the load rebuilds or nothing reads are allowed.
const sweep = await page.evaluate((names) => {
  const ok = new Set(['enchant', 'reqAttr', 'reqVal', 'potionId', 'buildVia', 'grantsAmmo']), found = [], seen = new Set();
  const isItem = o => o && typeof o === 'object' && !Array.isArray(o) && typeof o.name === 'string' && typeof o.ico === 'string' && typeof o.type === 'string';
  const walk = (o, path, d) => { if (!o || typeof o !== 'object' || seen.has(o) || d > 3 || o.isObject3D || o.isMaterial || o.isTexture) return; seen.add(o);
    if (isItem(o)) { found.push([path, o]); return; } for (const k of Object.keys(o).slice(0, 400)) { try { walk(o[k], path + '.' + k, d + 1); } catch (e) {} } };
  for (const n of names) { let v; try { v = eval(n); } catch (e) { continue; } if (typeof v !== 'function') walk(v, n, 0); }
  for (const k in ROLL_DEF) found.push(['rollItem:' + k, rollItem(k)]);
  found.push(['swordStamp:mark', swordStamp(makeItem(3, WEAPON_TYPES.find(t => t.type === 'Sword')), 'mark')]);
  const lost = {};
  for (const [p, o] of found) { const s = _serItem(o); for (const k of Object.keys(o)) if (!k.startsWith('_') && typeof o[k] !== 'function' && !ok.has(k) && !(k in s)) (lost[k] = lost[k] || []).push(p); }
  return { n: found.length, lost };
}, (() => { const s = new Set(); for (const f of fs.readdirSync('js').filter(f => f.endsWith('.js'))) for (const m of fs.readFileSync('js/' + f, 'utf8').matchAll(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm)) s.add(m[1]); return [...s]; })());
check(`every item the game defines keeps its fields through the save (${sweep.n} items)`, sweep.n > 100 && Object.keys(sweep.lost).length === 0, sweep.lost);
// …and a bedroll, a tent and a Markish sword come back from a real load (the legacy row below) as what they were
await page.evaluate(() => { BAG.push(rollItem('wool'), { ...TENT_ITEM }, swordStamp(makeItem(3, WEAPON_TYPES.find(t => t.type === 'Sword')), 'mark')); });
// legacy migration: the s135 way of storing a save
const legacy = await page.evaluate(() => { const d = _buildSavePayload(); delete d.charId; if (d.wS) delete d.wS.charId; return JSON.stringify(d); });
await page.evaluate((raw) => { localStorage.clear(); localStorage.setItem('DOS_save_0', raw); localStorage.setItem('DOS_save_active', '0');
  return new Promise(r => { const q = indexedDB.deleteDatabase('the_old_gates'); q.onsuccess = q.onerror = q.onblocked = () => r(); }); }, legacy);
g.errs.length = 0; await page.reload(); await page.waitForTimeout(5000);
check('legacy save migrated', await page.evaluate(() => SS.idx.some(e => e.key === 'legacy_manual_0')));
await page.evaluate(() => document.getElementById('cb').click()); await page.waitForTimeout(12000); await g.hide();
const st = await page.evaluate(() => ({ started, gold, cid: worldState.charId }));
check('Continue loads the legacy character', st.started && st.cid === 'legacy' && st.gold === 999, st);
const kit = await page.evaluate(() => ({ roll: BAG.filter(b => b && b.roll).map(b => b.roll), tent: hasTent(), make: BAG.filter(b => b && b.swordMake).map(b => b.swordMake) }));
check('a bedroll, a tent and a Markish sword come back from the load as themselves', kit.roll.includes('wool') && kit.tent && kit.make.includes('norse'), kit);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
