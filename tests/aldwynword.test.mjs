// Aldwyn's thanks (Session 791; the approved draft *The Makers' Things*, the Shuttle's claimant): once the Shuttle is given to
// the Church and the Prior's letter has gone to the Herald, Corwin at a harbour has one topic, *Word from Aldwyn?*, once.
// Played through Corwin's own dialogue at the home island's harbour (as `saltwater` finds him).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const start = await page.evaluate(() => {
  QS['q3_the_merchant_knows'] = Object.assign(QS['q3_the_merchant_knows'] || {}, { state: 'complete' });
  worldState.tut = { town: null, sea: null, ferries: 0 }; delete worldState.artifacts; if (worldState.stats) delete worldState.stats.aldwynWord; forceTime(11);
  const s = WORLD.siteAnywhere('dunmore'); const port = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z))[0];
  px = port.x; pz = port.z; return { port: port.id, name: port.name }; });
await g.settle(start.port);
const labels = () => page.evaluate(() => { for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now());
  const c = ZONES.world.npcs.find(n => n.def && n.def.name === 'Corwin' && n.g.parent); return c ? c.def.topics.map(t => t.label) : null; });
const talk = async (re) => {
  await page.evaluate(() => { const c = ZONES.world.npcs.find(n => n.def && n.def.name === 'Corwin' && n.g.parent); window._c = c; c._scared = performance.now() + 1;
    px = c.g.position.x; pz = c.g.position.z + 1.2; jumpY = c.g.position.y; yaw = 0; pitch = 0; try { if (dlgOpen) closeDialog(); } catch (e) {} });
  await g.frames(2); await page.evaluate(() => { const c = window._c; px = c.g.position.x; pz = c.g.position.z + 1.2; yaw = 0; });
  await page.keyboard.press('e'); await g.frames(2);
  const r = await page.evaluate((src) => { const re = new RegExp(src); const ch = [...document.querySelectorAll('#dlg-choices > *')]; const labels = ch.map(x => x.textContent.trim());
    const b = ch.find(x => re.test(x.textContent)); if (b) b.click(); return { open: !!dlgOpen, labels, clicked: !!b }; }, re.source);
  await g.frames(2); r.said = await page.evaluate(() => (document.getElementById('dlg-text') || {}).textContent || '');
  await page.evaluate(() => { try { if (dlgOpen) closeDialog(); } catch (e) {} }); return r; };
const l0 = await labels();
await page.evaluate(() => { worldState.artifacts = { shuttle: { taken: true, day: 1, how: 'taken', yielded: 'claimant' } }; });
const lOther = await labels();
await page.evaluate(() => { worldState.artifacts.shuttle = { taken: true, day: 1, how: 'taken', yielded: 'church', yieldDay: 2, herald: 2 }; });
const l1 = await labels();
const t = await talk(/^\d*\.?\s*Word from Aldwyn\?/);
const l2 = await labels();
const saved = await page.evaluate(() => worldState.stats && worldState.stats.aldwynWord);
console.log(JSON.stringify({ l0, lOther, l1, t, l2, saved }));
check(`Corwin is at ${start.name}; no word from Aldwyn before the Shuttle is given, or when it went elsewhere`, Array.isArray(l0) && !l0.includes('Word from Aldwyn?') && !lOther.includes('Word from Aldwyn?'), { l0, lOther });
check('with the Shuttle under the Church\'s seal and the letter sent, Corwin offers *Word from Aldwyn?*', l1.includes('Word from Aldwyn?'), l1);
check(`asked, through his dialogue: *${t.said}*`, t.clicked && t.said === "Aldwyn had a letter from the Prior. He's not a man for thanks; he'd sooner owe you than say so, and he owes half the island on those terms. But he asked me to say it, so here it is, said. A thing put out of reach is a thing he can stop lying awake over. He lies awake anyway. It's one thing fewer.", t);
check('once: the topic is gone after, and the world remembers it', !l2.includes('Word from Aldwyn?') && saved === 1, { l2, saved });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
