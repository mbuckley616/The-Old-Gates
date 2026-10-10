// Finding 20 (quest review run 11): since Session 638 a ship is boarded by her net, with the eye on it. The shipwright's
// sale and Corwin's two sea lines said "E beside her to board"; they now say to put your eye on the net.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const pid = await page.evaluate(() => { const s = WORLD.siteAnywhere('dunmore'); return WORLD.allPorts().sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z))[0].id; });
await g.settle(pid);
const r = await page.evaluate(pid => {
  const port = WORLD.siteAnywhere(pid); worldState.ship = null; gold = 5000;
  const sale = buyShip(port);
  const st = {}; for (const step of ['ship', 'board']) { WORLD.tut.sea = { step, note: true }; st[step] = tutSeaStage().desc; }
  return { sale, st, ship: !!worldState.ship };
}, pid);
console.log(JSON.stringify(r));
check('a ship is bought', r.ship, r);
check('the sale says to look at the net and press E', /Walk to the end of the quay, look at the net down her side and press E to climb aboard; E again for the wheel\.$/.test(r.sale), r.sale);
check('Corwin’s "ship" stage names the net', r.st.ship.includes("There's a net down each side of her: put your eye on it and press E, and up you go. E again at the wheel. W and S for the sails, A and D to steer.\""), r.st.ship);
check('Corwin’s "board" stage names her net', r.st.board.includes("come alongside, put your eye on her net and press E, and clear her deck once you're over the rail. The captain's chest is yours after.\""), r.st.board);
check('no line says "beside her" or "E to board"', ![r.sale, r.st.ship, r.st.board].some(s => /beside her|E to board/.test(s)));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
