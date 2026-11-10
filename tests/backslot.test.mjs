// The cloak's cell on the paper doll (Session 590; the critic, 6 Oct, s455): `EQ_SLOTS` has had `back` since Session 552,
// but the inventory's markup had no `ds-back`, so `renderHubInv` skipped it and a worn cloak could be neither seen nor taken off.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => {
  const missing = EQ_SLOTS.filter(s => !document.getElementById('ds-' + s.key)).map(s => s.key);
  const cells = [...document.querySelectorAll('#eq-grid .eq-slot')].map(e => e.dataset.slot);
  // wear a Dark Hood the way the player does: from the bag
  EQ.back = null; BAG.push(makeCloak('hood')); const i = BAG.length - 1; const bag0 = BAG.length;
  useItem(i);
  const worn = EQ.back && EQ.back.name, bagAfterWear = BAG.length;
  openHub('inv');
  const el = document.getElementById('ds-back');
  const shown = { hasItem: el.classList.contains('has-item'), ico: el.querySelector('.eq-slot-ico').innerHTML.length > 0, visible: el.getBoundingClientRect().width > 0 };
  el.onmouseenter(); const tip = document.getElementById('eq-tooltip-name').textContent, hint = document.getElementById('eq-tooltip-hint').textContent;
  el.click();
  const off = { back: EQ.back, inBag: BAG.some(b => b.virtue === 'hood'), hasItem: el.classList.contains('has-item'), bag: BAG.length };
  closeHub();
  return { missing, cells, worn, bag0, bagAfterWear, shown, tip, hint, off };
});
console.log(JSON.stringify(r));
check('every slot in EQ_SLOTS has its cell on the doll (eleven)', r.missing.length === 0 && r.cells.length === 11 && r.cells.includes('back'), r);
check('a Dark Hood from the bag is worn', r.worn === 'Dark Hood' && r.bagAfterWear === r.bag0 - 1, r);
check('the Back cell shows it, and its tooltip names it', r.shown.hasItem && r.shown.ico && r.shown.visible && /Dark Hood/.test(r.tip) && /unequip/i.test(r.hint), r);
check('clicking the Back cell takes it off, into the bag', r.off.back === null && r.off.inBag && !r.off.hasItem && r.off.bag === r.bag0, r.off);
// S2065 — the sheet's portrait (Michael's C on #1363): on the new look the slots stand in two columns round your body's window; the
// body is lent to the portrait's scene for a draw and given back where it was. The draw itself is not waited for (its programs take
// about 17 s on software GL); the hub is closed in the same call, so none is made
const f = await page.evaluate(() => {
  openHub('inv');
  const wrap = document.getElementById('eq-grid-wrap'), cv = document.getElementById('eq-fig'), cb = cv.getBoundingClientRect();
  const col = k => { const b = document.getElementById('ds-' + k).getBoundingClientRect(); return b.x < cb.x ? 'L' : b.x > cb.x + cb.width - 1 ? 'R' : '?'; };
  const cols = EQ_SLOTS.map(s => s.key + ':' + col(s.key)).join(' ');
  closeHub();
  const R = tpEnsure(); sheetFigSetup(200, 332); const p0 = R.root.parent, x0 = R.root.position.toArray(), v0 = R.root.visible, L0 = R.rig.hb && R.rig.hb.L;
  const k = sheetFigLend(R), lent = R.root.parent === SHEET_FIG.scene; sheetFigGiveBack(R, k);
  return { fig: wrap.classList.contains('fig'), canvas: [Math.round(cb.width), Math.round(cb.height)], cols, lent, back: R.root.parent === p0 && R.root.visible === v0 && R.root.position.toArray().every((v, i) => Math.abs(v - x0[i]) < 1e-6) && (R.rig.hb ? R.rig.hb.L === L0 : true) };
});
console.log(JSON.stringify(f));
check('on the new look the slots stand in two columns round the portrait\'s window, 200 by 332', f.fig && f.canvas[0] === 200 && f.canvas[1] === 332 && !/\?/.test(f.cols) && /head:L/.test(f.cols) && /weapon:R/.test(f.cols), f);
check('the body lent to the portrait is given back where it was', f.lent && f.back, f);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
