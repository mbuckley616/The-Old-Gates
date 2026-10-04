// Salt Water, played through (Session 125's sea line; owed to play in backlog G, *Saves first*: "the tutorial lines in real
// play — Corwin at a pre-commission quay, the discounted hull, a live boarding"). Before the commission, once the merchant's
// own quest is done, Corwin stands at the nearest harbour and teaches the sea in four steps: a ferry (his note then takes a
// quarter off a hull), a ship of your own, a crossing to another nation's harbour at your own wheel, a pirate's deck
// cleared; then Corwin, at any harbour, pays 200 + 20 a level. Here every step is taken the way a player takes it: Corwin's
// and the shipwright's topics clicked in their own dialogue, the passage from the harbourmaster's own list, the ship's own
// crossing (set down off the far harbour under sail), and a black sail boarded and her crew cut down by the player's swings
// (the game's own loop at fixed 1/60 ticks, the draw held off, as `duelrhythm` does).
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

// 2. a ferry, from the harbourmaster's list of passages
const fer = await page.evaluate((id) => { const site = WORLD.siteAnywhere(id); const T = WORLD.ferryTopics(site); const t = T[0]; const g0 = gold; window._to = t.label; t.fn();
  return { label: t.label, paid: g0 - gold }; }, start.port);
for (let k = 0; k < 40; k++) { await g.frames(3); if (await page.evaluate(() => !WORLD.loading && typeof _loading === 'undefined' || !_loading)) break; }
const s2 = await sea();
const there = await page.evaluate(() => { const P = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0]; return { id: P.id, name: P.name, d: Math.round(Math.hypot(P.x - px, P.z - pz)) }; });
console.log('ferry', JSON.stringify(fer), JSON.stringify(s2), JSON.stringify(there));
check('a passage paid takes you over and the note is in your pocket: the step is "ship"', fer.paid > 0 && s2.ferries === 1 && s2.step === 'ship' && s2.note === true && there.d < 140, { fer, s2, there });
await g.settle(there.id);
const c2 = await corwin();
check(`Corwin is at the harbour you landed at (${there.name}) too`, c2 && c2.port === there.name && c2.fromPort < 15, c2);
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
await page.evaluate((id) => { const p = WORLD.siteAnywhere(id); px = p.x; pz = p.z; }, there.id); await g.settle(there.id);

// 3. the hull, at the note's price, by the shipwright's own topic
const buy = await page.evaluate((id) => { const S = WORLD.settle.get(id); const n = S && S.npcs.find(n => n.sched && n.sched.shop === 'shipwright'); if (!n) return { none: true };
  const T = n.def.topics; const t = T.find(x => /^Buy a ship/.test(x.label)); const g0 = gold; const label = t && t.label; const said = t && t.fn(); return { label, said, paid: g0 - gold, ship: !!worldState.ship, name: worldState.ship && worldState.ship.name }; }, there.id);
const s3 = await sea();
console.log('hull', JSON.stringify(buy), JSON.stringify(s3));
check('the shipwright offers the hull at the note’s price, a quarter off (300), and takes 300', /Buy a ship \(300 gold, with Corwin/.test(buy.label || '') && buy.paid === 300 && buy.ship, buy);
check('the step is "crossing", with the nearest harbour of another nation for a target', s3.step === 'crossing' && !!s3.target, s3);

// 4. the crossing: the ship set down under sail 150 units off the target harbour, at sea, with you at her wheel
const cross = await page.evaluate(() => { const E = WORLD.tut.sea; const t = WORLD.siteAnywhere(E.target); const sd = t.shore || [1, 0];
  let x = t.x + sd[0] * 150, z = t.z + sd[1] * 150; const S = WORLD.ship; S.x = x; S.z = z; if (S.mesh) S.mesh.position.set(x, S.mesh.position.y, z); worldState.ship.x = x; worldState.ship.z = z;
  S.sailing = true; px = x; pz = z; return { target: t.name, nation: WORLD.nationKeyOf ? WORLD.nationKeyOf(...WORLD.cellOf(t.x, t.z)) : null, from: E.from, d: Math.round(Math.hypot(x - t.x, z - t.z)) }; });
const s4 = await sea();
await page.evaluate(() => { WORLD.ship.sailing = false; });
console.log('crossing', JSON.stringify(cross), JSON.stringify(s4));
check(`under sail off ${cross.target}, the crossing is done: the step is "board"`, s4.step === 'board', { cross, s4 });

// 5. a black sail, boarded, her crew cut down by your own swings
const fight = await page.evaluate(() => { const o = WORLD.spawnOtherShip('pirate', px + 30, pz); WORLD.boardOther(o); PHP = maxHP; dead = false; window._o = o;
  return { boarded: o.boarded, crew: o.crew.length }; });
const fought = await page.evaluate(() => { const o = window._o; let swings = 0;
  window._drive = (step, max) => { const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
    let t = performance.now(), n = 0; try { for (; n < max; n++) { if (step()) break; t += 1000 / 60; loop(t); } } finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; } return n; };
  const frames = _drive(() => { const live = o.crew.filter(e => !e.dead); if (!live.length) return true; PHP = maxHP; dead = false; stamina = maxStamina; PPOST.stagUntil = 0;
    let e = live[0], d = 1e9; for (const x of live) { const dd = Math.hypot(x.x - px, x.z - pz); if (dd < d) { d = dd; e = x; } }
    yaw = Math.atan2(-(e.x - px), -(e.z - pz)); if (d < 1.8 && atkCd <= 0 && !_pendingStrike) { attack(false); swings++; } }, 60 * 120);
  return { swings, frames, left: o.crew.filter(e => !e.dead).length, deck: +Math.hypot(px - o.x, pz - o.z).toFixed(1) }; });
const swings = fought.swings, left = fought.left;
const s5 = await sea();
console.log('boarding', JSON.stringify(fight), JSON.stringify(fought), JSON.stringify(s5));
check(`aboard her, the crew (${fight.crew}) cut down by your own swings (${swings}), her deck is yours: the step is "report"`, fight.boarded && left === 0 && s5.step === 'report' && s5.qdone, { fight, swings, s5 });

// 6. back at a harbour, Corwin pays
await page.evaluate((id) => { const p = WORLD.siteAnywhere(id); px = p.x; pz = p.z; }, there.id);
const c6 = await corwin();
const lvl = await page.evaluate(() => level);
const g6 = await page.evaluate(() => gold);
const t6 = await talk(/I've taken a pirate's deck\./);
const s6 = await sea();
console.log('report', JSON.stringify(c6), JSON.stringify(t6), JSON.stringify(s6), g6);
check('at the harbour Corwin greets the sailor-to-be and hears it', c6 && /shot at from a deck/.test(c6.greet) && t6.clicked, { c6, t6 });
check(`he pays 200 + 20 a level (level ${lvl}: ${200 + 20 * lvl}, with Charisma's share) and the line is done`, s6.step === 'done' && s6.gold - g6 >= 200 + 20 * lvl && /gold/.test(t6.said), { s6, g6 });
const c7 = await corwin();
check('after it, Corwin leaves the quays until the commission', c7 === null, c7);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
