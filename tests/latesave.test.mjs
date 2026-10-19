// A late autosave must not re-point Continue (QA, 14 Oct 2026; Session 951). `ssWrite` set the active key whenever its
// write landed, so a slow autosave that landed after you had loaded another save from the menu pointed Continue back at
// the save you had left. A write now points Continue at itself only if nothing was loaded while it was in flight; the
// save itself is kept either way. The store's put is held open here, as a slow disk holds it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(async () => {
  const out = {};
  gold = 111; await saveToSlot(0); gold = 222; await saveToSlot(1);
  const key = (s) => (SS.idx.find(e => e.kind === 'manual' && e.slot === s && e.charId === ssCharId()) || {}).key;
  const A = key(0), B = key(1); out.keys = [A, B]; out.activeAfterSaves = ssActiveKey() === B;
  // hold the store's puts open, start an autosave, and load slot 1 (A) from the menu while it is in flight
  const put = ssPut; let release; const gate = new Promise(res => { release = res; });
  ssPut = function () { const a = arguments; return gate.then(() => put.apply(this, a)); };
  gold = 333; let landed = false; const w = ssWrite('auto', 4, false).then(() => { landed = true; });
  for (let i = 0; i < 5; i++) await new Promise(res => setTimeout(res, 0));
  out.heldOpen = !landed;
  const meta = SS.idx.find(e => e.key === A); const done = new Promise(res => { const _ad = _applyLoadData; _applyLoadData = function () { const v = _ad.apply(this, arguments); _applyLoadData = _ad; res(); return v; }; });
  _slotLoadClick({ dataset: { primed: '1' } }, meta); await done; await new Promise(res => setTimeout(res, 50));
  out.loaded = { gold, active: ssActiveKey() === A };
  ssPut = put; release(); await w;
  const late = SS.idx.find(e => e.kind === 'auto' && e.slot === 4 && e.charId === ssCharId());
  out.after = { landed, active: ssActiveKey(), wantA: A, lateKept: !!late && late.gold === 333, lateKey: late && late.key };
  // with nothing loaded in between, a write still points Continue at itself
  gold = 444; await saveToSlot(2); out.plain = ssActiveKey() === key(2);
  return out; });
console.log(JSON.stringify(r));
check('two slots saved; Continue points at the last', r.keys.every(Boolean) && r.activeAfterSaves, r);
check('the autosave is held open while slot 1 is loaded from the menu', r.heldOpen && r.loaded.gold === 111 && r.loaded.active, r.loaded);
check(`when the late autosave lands, Continue still points at the save just loaded (${r.after.active === r.after.wantA ? 'slot 1' : r.after.active})`, r.after.landed && r.after.active === r.after.wantA, r.after);
check('and the late autosave is kept in the list, with what it saved', r.after.lateKept, r.after);
check('a save with nothing loaded while it is written still points Continue at itself', r.plain, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
