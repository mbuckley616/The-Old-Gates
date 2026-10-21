// Corwin follows you along the coast (Session 439), split from `saltwater` in Session 1254: together they ran past the 900 s
// a suite is given on the new look. The line is opened the way `saltwater` opens it, through Corwin's own topic at the home
// province's port, and the walk is taken at its first step, the ferry; what Session 439 promises is only that the step is
// unchanged while you walk, which any step before the commission keeps.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// the merchant's quest done, no commission yet: the line is open. Start at the home province's port.
const start = await page.evaluate(() => {
  QS['q3_the_merchant_knows'] = Object.assign(QS['q3_the_merchant_knows'] || {}, { state: 'complete' });
  worldState.ship = null; worldState.tut = { town: null, sea: null, ferries: 0 }; gold = 2000; updateHUD(); forceTime(11);
  const s = WORLD.siteAnywhere('dunmore');
  const port = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z))[0];
  px = port.x; pz = port.z; return { port: port.id, name: port.name, act: WORLD.story().act }; });
await g.settle(start.port);
const corwin = () => page.evaluate(() => { for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now());
  const c = ZONES.world.npcs.find(n => n.def && n.def.name === 'Corwin' && n.g.parent); if (!c) return null;
  const P = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  return { greet: c.def.greeting[0], topics: c.def.topics.map(t => t.label), port: P.name, fromPort: +Math.hypot(c.g.position.x - P.x, c.g.position.z - P.z).toFixed(1) }; });
// walk up to Corwin and press E; click the topic matching `re` and read back what he says
const talk = async (re) => {
  await page.evaluate(() => { const c = ZONES.world.npcs.find(n => n.def && n.def.name === 'Corwin' && n.g.parent); window._c = c; c._scared = performance.now() + 1;
    px = c.g.position.x; pz = c.g.position.z + 1.2; jumpY = c.g.position.y; yaw = 0; pitch = 0; try { if (dlgOpen) closeDialog(); } catch (e) {} });
  await g.frames(2); await page.evaluate(() => { const c = window._c; px = c.g.position.x; pz = c.g.position.z + 1.2; yaw = 0; });
  await page.keyboard.press('e'); await g.frames(2);
  const r = await page.evaluate((src) => { const re = new RegExp(src); const ch = [...document.querySelectorAll('#dlg-choices > *')]; const labels = ch.map(x => x.textContent.trim());
    const b = ch.find(x => re.test(x.textContent)); if (b) b.click(); return { open: !!dlgOpen, labels, clicked: !!b }; }, re.source);
  await g.frames(2);
  r.said = await page.evaluate(() => (document.getElementById('dlg-text') || {}).textContent || '');
  await page.evaluate(() => { try { if (dlgOpen) closeDialog(); } catch (e) {} }); return r; };
const sea = () => page.evaluate(() => { for (let i = 0; i < 61; i++) WORLD.tick(1 / 60, performance.now()); const E = WORLD.tut.sea; const q = WORLD.quests.find(q => q.id === 'tut_sea');
  return { step: E && E.step, note: E && E.note, target: E && E.target, ferries: WORLD.tut.ferries, gold, obj: q ? q.objective : null, qdone: q ? !!q.done : null }; });

// 1. Corwin at the quay
const c1 = await corwin();
console.log('at', start.name, JSON.stringify(c1));
check(`before the commission (act ${start.act}), Corwin stands at ${start.name}, by the harbour, and offers to teach the sea`, start.act < 2 && c1 && c1.fromPort < 15 && c1.topics.includes('Teach me the sea.') && /Told you we'd cross paths/.test(c1.greet), c1);
const t1 = await talk(/Teach me the sea\./);
const s1 = await sea();
console.log('taught', JSON.stringify(t1), JSON.stringify(s1));
check('"Teach me the sea." opens Salt Water at the ferry step, in the journal', t1.clicked && /Ferry first/.test(t1.said) && s1.step === 'ferry' && /ferry/i.test(s1.obj || ''), { t1, s1 });

// Session 439: Corwin kept his place while his step was the same, and was taken down only once no harbour was within 140
// units and he was 220 off. A passage re-enters the world, which places everyone again, but walking, riding or sailing
// from one quay to a near one never did: he stayed at the first. Here, with the step unchanged, you come to the nearest
// harbour on foot, 150–360 units along the coast (25 of the world's 110 harbours have one that near), and back.
const pair = await page.evaluate(() => { const P = WORLD.allPorts(); const near = P.map(p => Math.min(...P.filter(q => q !== p).map(q => Math.hypot(q.x - p.x, q.z - p.z))));
  const home = WORLD.siteAnywhere('dunmore'); let best = null, bd = 1e9;
  for (const a of P) for (const b of P) { if (a === b) continue; const d = Math.hypot(a.x - b.x, a.z - b.z); if (d < 150 || d > 360) continue; const h = Math.hypot(a.x - home.x, a.z - home.z); if (h < bd) { bd = h; best = [a.id, b.id, a.name, b.name, Math.round(d)]; } }
  return { ports: P.length, under360: near.filter(d => d < 360).length, pair: best }; });
const [pa, pb, na, nb, dab] = pair.pair;
const walkTo = async (id) => { await page.evaluate((id) => { const t = WORLD.siteAnywhere(id); const x0 = px, z0 = pz, L = Math.hypot(t.x - x0, t.z - z0), n = Math.ceil(L / 10);
  for (let k = 1; k <= n; k++) { px = x0 + (t.x - x0) * k / n; pz = z0 + (t.z - z0) * k / n; for (let i = 0; i < 5; i++) WORLD.tick(1 / 60, performance.now()); } }, id); await g.settle(id); return corwin(); };
await page.evaluate((id) => { const p = WORLD.siteAnywhere(id); px = p.x; pz = p.z; }, pa); await g.settle(pa);
const c2a = await corwin();
const c2b = await walkTo(pb);
const c2c = await walkTo(pa);
console.log('ports', JSON.stringify(pair), JSON.stringify(c2a), 'walked to', nb, JSON.stringify(c2b), 'and back', JSON.stringify(c2c));
check(`at ${na}, Corwin is there`, c2a && c2a.port === na && c2a.fromPort < 15, c2a);
check(`walked on to ${nb}, ${dab} units along the coast, the step unchanged: Corwin is there, not left at ${na}`, c2b && c2b.port === nb && c2b.fromPort < 15, c2b);
check(`and walked back to ${na}, he is there again`, c2c && c2c.port === na && c2c.fromPort < 15, c2c);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
