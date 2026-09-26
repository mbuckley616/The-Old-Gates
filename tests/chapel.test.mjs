// The Guest's chapel (Cill an Aoi): the prayer's black screen, checked in the real DOM.
// Design (Session U): four seconds of black with the HUD lit and the world's sound running, then *It saw you.*
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// the capital of Aurenne: the city whose cathedral has the bricked stair
const cap = await page.evaluate(() => { const c = WORLD.guestChapelHouse(); return c && c.id; }); const caps = cap ? [cap] : [];
let chapel = null;
for (const id of caps) {
  await g.settle(id);
  chapel = await page.evaluate((id) => { const S = WORLD.settle.get(id); if (!S) return null;
    const ch = S.houses.find(h => h.type === 'church'); if (!ch) return null; const c = WORLD.cellarFor(ch); return c && c.type === 'chapel' ? { id, church: ch.id } : null; }, id);
  if (chapel) break;
}
check('Aurenne\'s capital has the chapel under its cathedral', !!chapel, { caps, chapel });
if (!chapel) { await g.close(); process.exit(1); }

await page.evaluate(({ id, church }) => { const ch = WORLD.settle.get(id).houses.find(h => h.id === church); goToInterior(WORLD.cellarFor(ch)); }, chapel);
await page.waitForTimeout(6000); await g.hide();
const at = await page.evaluate(() => { px = currentHouse.intW / 2; pz = 2.2; jumpY = 0; return { type: currentHouse.type, name: currentHouse.name, prompt: WORLD.guestPrompt() }; });
check('standing at the dais offers the prayer', at.type === 'chapel' && /pray/.test(at.prompt || ''), at);

await page.keyboard.press('e'); await page.waitForTimeout(1200);
// paint order, not hit-testing: the overlay and the HUD both ignore the mouse, so let them take it for the probe
const probe = () => page.evaluate(() => {
  const cv = (typeof REN !== 'undefined' && REN.domElement) || document.querySelector('canvas'); const r = cv.getBoundingClientRect();
  const blacks = [...document.querySelectorAll('div')].filter(e => { const cs = getComputedStyle(e); const b = e.getBoundingClientRect();
    return !e.contains(cv) && cs.backgroundColor === 'rgb(0, 0, 0)' && b.width >= r.width * .95 && b.height >= r.height * .95 && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > .5; });
  const hudIds = ['hud', 'compass'].filter(id => { const e = document.getElementById(id); return e && getComputedStyle(e).display !== 'none'; });
  const saved = [...blacks, ...hudIds.map(id => document.getElementById(id))].map(e => [e, e.style.pointerEvents]);
  saved.forEach(([e]) => e.style.pointerEvents = 'auto');
  const at = (a, b) => document.elementFromPoint(r.left + r.width * a, r.top + r.height * b);
  const covered = [[.5, .5], [.1, .1], [.9, .1], [.1, .9], [.9, .9]].map(([a, b]) => at(a, b)).map(t => !!t && t !== cv && !t.contains(cv));
  const hud = hudIds.map(id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); const t = document.elementFromPoint(b.left + b.width / 2, b.top + Math.min(b.height / 2, 6)); return { id, onTop: !!t && (t === e || e.contains(t)) }; });
  saved.forEach(([e, pe]) => e.style.pointerEvents = pe);
  return { overlays: blacks.length, covered, hud, log: GAME_LOG.slice(-3).map(l => l.text) };
});
const dark = await probe();
await page.screenshot({ path: 'tests/out/chapel-dark.png' });
check('the screen goes black over the scene', dark.overlays >= 1 && dark.covered.every(Boolean), dark);
check('the HUD stays lit above it', dark.hud.length > 0 && dark.hud.every(h => h.onTop), dark.hud);
await page.waitForTimeout(3600);
const after = await probe();
check('after four seconds the black lifts and the log says: It saw you.', after.overlays === 0 && after.log.some(t => /It saw you/.test(t)), after);
const flag = await page.evaluate(() => worldState.chapelAt);
check('the chapel is remembered for Varek', flag === 'Fortargent', flag);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
