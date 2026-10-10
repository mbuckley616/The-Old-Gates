// The barber's chair (Session 561, barber slice 2; Michael's B on #144, the fee his A on #151). Sitting in the chair (E near it)
// opens the creator's look panel on a parchment slip: hair, style, beard, the dyes of your own tunic, breeches and boots, and your
// cloak's if you wear one; never the skin. Rise keeps what you chose and pays through the systems builder's barberPay(house,
// changed) (S551, on auto/systems; stood in for here): nothing changed is free, a short purse keeps you in the chair with nothing
// taken. "Leave as you came" changes nothing. The creator's own panel is as it was afterwards.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const found = await page.evaluate(() => { let h = null;
  const c = WORLD.SITES.filter(t => t.pad && ['city', 'town'].includes(t.kind)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  for (const t of c) { const S = WORLD.settlements.get(t.id) || WORLD.genSettlement(t); h = S && S.houses.find(x => x.type === 'barber'); if (h) break; }
  if (!h) return null; window._S = h; forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); return h.name; });
check('a barber\'s shop is found and entered', !!found, found);
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior() && !!INT_CHAIR)); k++) await page.waitForTimeout(250);
await g.spin(10);
// the stand-in fee: 10 gold, put over the systems builder's barberPay (the inn room's price, which varies by town; `barberfee` tests that)
await page.evaluate(() => { window._pays = []; { window.barberPay = (h, c) => { _pays.push(c); if (!c) return 'free'; if (gold < 10) return 'poor'; gold -= 10; return 'paid'; }; window.barberFee = () => 10; window._stood = true; }
  EQ.back = { slot: 'back', cloak: 'wool', name: 'Traveller’s Cloak' }; });
const near = await page.evaluate(() => { const C = INT_CHAIR; px = C.x; pz = C.z + 1.0; jumpY = 0; lookAtPt(C.x, .6, C.z); /* S656: the chair answers to the crosshair */ return { chair: !!C, house: C && C.house === _S }; });
await g.spin(4); await g.frames(3);
const prompt = await page.evaluate(() => document.getElementById('ob').textContent);
const byKeeper = await page.evaluate(() => { const x = px, z = pz; px = intNPCPos.x - .3; pz = intNPCPos.z + .9; lookAtPt(intNPCPos.x, 1.1, intNPCPos.z); const n = nearBarberChair(); px = x; pz = z; lookAtPt(INT_CHAIR.x, .6, INT_CHAIR.z); return n; });
check('beside the barber with the crosshair on him, E is his (the chair does not take it)', byKeeper === false, byKeeper);
check('the chair is in the room, its house the shop, and next to it the prompt asks you to sit', near.chair && near.house && /barber’s chair/.test(prompt), { near, prompt });
const open = await page.evaluate(() => { const before = JSON.stringify(worldState.look || null); interact(); const ov = document.getElementById('barberui'), rows = [...document.querySelectorAll('#barber-rows > div > span')].map(s => s.textContent);
  return { open: barberOpen && ov && ov.style.display === 'flex', rows, rig: !!(CCL.rig && CCL.rig.rig), fee: document.getElementById('barber-fee').textContent, before }; });
console.log(JSON.stringify(open));
check('E at the chair opens the slip with a live preview of you', open.open && open.rig, open);
check('its rows are the barber\'s and the dyer\'s, the cloak too; never the skin', JSON.stringify(open.rows) === JSON.stringify(['Hair', 'Style', 'Beard', 'Tunic', 'Breeches', 'Boots', 'Cloak']), open.rows);
check('it says the fee, and that nothing changed costs nothing', /10 gold for the visit/.test(open.fee), open.fee);
// choose another style and a dyed cloak; a short purse first
const pick = await page.evaluate(() => { const L0 = JSON.parse(JSON.stringify(window._ccLook)); const rows = [...document.querySelectorAll('#barber-rows > div')];
  const by = n => rows.find(r => r.querySelector('span').textContent === n); const st = [...by('Style').querySelectorAll('button')].find(b => b.textContent !== LOOK_STYLES.find(s => s[0] === L0.style)[1]);
  st.click(); const rows2 = [...document.querySelectorAll('#barber-rows > div')], cl = [...rows2.find(r => r.querySelector('span').textContent === 'Cloak').querySelectorAll('button')][1]; cl.click();
  const sig0 = tpSig(); gold = 3; document.getElementById('barber-rise').click();
  const poor = { open: barberOpen, gold, look: JSON.stringify(worldState.look) === JSON.stringify(L0) || worldState.look == null, col: EQ.back.col, msg: document.getElementById('barber-fee').textContent };
  gold = 50; document.getElementById('barber-rise').click();
  return { poor, paid: { open: barberOpen, gold, style: worldState.look.style, was: L0.style, col: EQ.back.col, want: LOOK_TUNICS[1], sigMoved: tpSig() !== sig0 }, ui: CCL.ui.cv, pays: _pays.slice() }; });
console.log(JSON.stringify(pick));
check('a short purse: you stay in the chair, nothing taken, nothing changed', pick.poor.open && pick.poor.gold === 3 && pick.poor.look && pick.poor.col == null && /Not enough gold: the visit is 10\./.test(pick.poor.msg), pick.poor);
check('Rise with the fee: the new style and the dyed cloak are yours, 10 gold paid, the slip closed', !pick.paid.open && pick.paid.gold === 40 && pick.paid.style !== pick.paid.was && pick.paid.col === pick.paid.want, pick.paid);
check('your body is rebuilt in the new look (its signature moved)', pick.paid.sigMoved, pick.paid);
check('barberPay was told it changed', pick.pays.join() === 'true,true', pick.pays);
const again = await page.evaluate(() => { const was = JSON.stringify(worldState.look), g0 = gold; interact(); document.getElementById('barber-rise').click(); const free = { gold, same: JSON.stringify(worldState.look) === was, last: _pays[_pays.length - 1] };
  interact(); const rows = [...document.querySelectorAll('#barber-rows > div')]; [...rows.find(r => r.querySelector('span').textContent === 'Hair').querySelectorAll('button')].find(b => !/e8c860/.test(b.style.border)).click();
  document.getElementById('barber-leave').click(); const left = { open: barberOpen, same: JSON.stringify(worldState.look) === was, gold, g0 };
  return { free, left, ui: CCL.ui.cv }; });
console.log(JSON.stringify(again));
check('rising with nothing changed is free', again.free.same && again.free.gold === 40 && again.free.last === false, again.free);
check('"Leave as you came" keeps your look and your gold', !again.left.open && again.left.same && again.left.gold === again.left.g0, again.left);
check('the look panel is the creator\'s again afterwards', again.ui === 'cc-look-cv', again.ui);
await page.evaluate(() => interact()); await g.frames(3);
await page.screenshot({ path: 'docs/prototypes/barber-chair-slip.png', timeout: 120000 });
await page.evaluate(() => document.getElementById('barber-leave').click());
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
