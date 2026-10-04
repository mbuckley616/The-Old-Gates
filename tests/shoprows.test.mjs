// Two things on the counter's rows (Session 451, the concept artist's 1 Oct note, backlog E): the Torch showed a
// shield's icon (every off-hand piece did), and a piece you can't wear was only dimmed, its reason never on the row.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

await page.evaluate(() => { forceTime(13); const S = WORLD.settle.get('dunmore'); worldState.crime = {};
  const h = S.houses.find(x => /weapon|armor/.test(x.type) && x.keeper) || S.houses.find(x => x.keeper && x.type !== 'inn');
  px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForTimeout(4500); await g.hide();

const r = await page.evaluate(() => { forceTime(13); openShop(); gold = 5000;
  for (const k in ATTRS) ATTRS[k] = 0;
  const torch = { ...TORCH_ITEM }, shield = makeItem(2, ARMOR_TYPES.find(t => t.slot === 'offhand' && t.shieldType === 'shield'), null, true);
  BAG.push(torch, shield); renderShop();
  const glyph = row => (row.querySelector('.ico-badge') || {}).textContent;
  const bagRows = [...document.querySelectorAll('#sh-bag .sh-row')];
  const tRow = bagRows.find(x => x.querySelector('.sh-name-text').textContent === 'Torch');
  const sRow = bagRows.find(x => x.querySelector('.sh-name-text').textContent === shield.name);
  const locked = [...document.querySelectorAll('#sh-stock .sh-row.sh-row-locked')];
  const open = [...document.querySelectorAll('#sh-stock .sh-row:not(.sh-row-locked)')];
  const out = { open: shopOpen, kind: currentHouse.type, torch: tRow && glyph(tRow).trim(), shield: sRow && glyph(sRow).trim(),
    locked: locked.length, lockedNotes: locked.map(x => [...x.querySelectorAll('.sh-note.warn')].map(n => n.textContent).join(' | ')).slice(0, 4),
    openWithReq: open.filter(x => /Requires/.test(x.textContent)).length, rows: locked.length + open.length };
  BAG.splice(BAG.indexOf(torch), 1); BAG.splice(BAG.indexOf(shield), 1);
  return out; });
console.log(JSON.stringify(r));
check('a weapon or armour shop is open', r.open && /weapon|armor/.test(r.kind), r.kind);
check('the Torch shows its own glyph, not a shield', r.torch === '🔦', r.torch);
check('a shield still shows a shield', r.shield === '🛡', r.shield);
check('with every attribute at 0 some pieces are locked', r.locked > 0, { locked: r.locked, rows: r.rows });
check('every locked row says what it needs and what you have', r.locked > 0 && r.lockedNotes.every(n => /^Requires \S+ \d+ \(you have 0\)/.test(n)), r.lockedNotes);
check('no wearable row says Requires', r.openWithReq === 0, r.openWithReq);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
