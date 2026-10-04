// Section G, shop hours (Session 151): does any errand or turn-in need a shop open at dusk? (Session 235)
// The one errand that reaches a townsperson by their house is the Mages' draught: "ask the first resident you meet",
// taken by anyone who keeps a house in the town (a home or a shop). This counts, by the hour, who in Dunmore would
// take it, and hands it over at noon and at dusk.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const at = (hour) => page.evaluate((hour) => { forceTime(hour); for (let i = 0; i < 600; i++) WORLD.tick(1 / 60, performance.now());
  const S = WORLD.settle.get('dunmore'); const shopT = h => !/home|inn|church|castle|guild|cabin|cellar|tower|chapel/.test(h.type);
  const keepers = new Map(S.houses.filter(h => h.keeper).map(h => [h.keeper, h]));
  const out = { hour, homes: 0, shops: 0, names: [] };
  for (const n of S.npcs) { if (!n.g.visible || n._retreated) continue; const h = keepers.get(n.def.name); if (!h) continue; if (shopT(h)) out.shops++; else out.homes++; out.names.push(n.def.name + (shopT(h) ? ' (' + h.type + ')' : '')); }
  out.shopsOpen = S.houses.filter(h => shopT(h) && h.keeper).filter(h => !WORLD.shopClosedNow(h)).length;
  return out; }, hour);
const rows = [];
for (const h of [6, 7.5, 12, 17.5, 18.3, 20, 23]) { const r = await at(h); rows.push(r); console.log(JSON.stringify(r)); }
const hand = async (hour) => {
  const who = await page.evaluate((hour) => { forceTime(hour); for (let i = 0; i < 600; i++) WORLD.tick(1 / 60, performance.now());
    const S = WORLD.settle.get('dunmore'); const keepers = new Set(S.houses.filter(h => h.keeper).map(h => h.keeper));
    const n = S.npcs.find(n => n.g.visible && !n._retreated && keepers.has(n.def.name) && n.sched && n.sched.type !== 'guard' && n.sched.type !== 'watch'); if (!n) return null;
    const G = WORLD.guild.state(); G.guild_m.active = { id: 'mtest', g: 'guild_m', kind: 'deliver', siteId: 'dunmore', who: null, gold: 10, desc: 'test', short: 'Draught to Dunmore' };
    n._scared = performance.now() + 1; window._n = n; px = n.g.position.x; pz = n.g.position.z + 1.2; jumpY = n.g.position.y; yaw = 0; pitch = 0;
    return { name: n.def.name, type: n.sched.type }; }, hour);
  if (!who) return { hour, who: null };
  // the stand beside them is taken again as the key goes down (a capture listener runs before the game's own): on a slow
  // runner a frame passes between a separate evaluate and the key, and a walker who steps nearer took the draught (S483)
  await g.frames(2); await page.evaluate(() => { const pin = () => { px = _n.g.position.x; pz = _n.g.position.z + 1.2; jumpY = _n.g.position.y; };
    pin(); window.addEventListener('keydown', pin, { capture: true, once: true }); });
  await page.keyboard.press('e'); await g.frames(2);
  return page.evaluate(([hour, who]) => { const G = WORLD.guild.state(); const t = G.guild_m.active; const r = { hour, who: who.name, sched: who.type, done: !!t.done, took: t.who, msg: (document.getElementById('msg') || {}).textContent };
    G.guild_m.active = null; try { closeDialog(); } catch (e) {} return r; }, [hour, who]); };
const noon = await hand(12), dusk = await hand(18.3);
console.log(JSON.stringify({ noon, dusk }));
check('the draught is handed over at noon to a townsperson in the street', noon.done && noon.took === noon.who, noon);
check('and at dusk, with every shop shut', dusk.done && rows.find(r => r.hour === 18.3).shopsOpen === 0, dusk);
check('from 7 to 20 someone who keeps a house is out in the street', rows.filter(r => r.hour >= 7 && r.hour <= 20).every(r => r.homes + r.shops > 0), rows.map(r => [r.hour, r.homes, r.shops]));
// the harbourmaster: the other townsperson on the keeper's schedule, with no shop to be inside
const port = await page.evaluate(() => { const P = WORLD.allPorts(); const s = WORLD.siteAnywhere('dunmore'); P.sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z)); return P[0].id; });
await g.settle(port);
const hm = [];
for (const hour of [6, 7.5, 12, 15, 20, 23]) hm.push(await page.evaluate(([hour, port]) => { forceTime(hour); for (let i = 0; i < 600; i++) WORLD.tick(1 / 60, performance.now());
  const S = WORLD.settle.get(port); const n = S.npcs.find(n => n.def.role === 'Harbourmaster');
  return { hour, name: n && n.def.name, out: !!(n && n.g.visible && !n._retreated), passage: n ? (function walk(L) { let k = 0; for (const t of L || []) { if (/^Passage to/.test(t.label)) k++; if (t.follow) k += walk(t.follow); } return k; })(n.def.topics) : 0 }; }, [hour, port]));
console.log(port, JSON.stringify(hm));
const hmAt = h => hm.find(r => r.hour === h);
check('the harbourmaster is on his quay through the working day (7.5, 12, 15, 20h), passage in hand', [7.5, 12, 15, 20].every(h => hmAt(h).out && hmAt(h).passage > 0), hm.map(r => [r.hour, r.out, r.passage]));
check('and gone at night, as before (6h, 23h)', !hmAt(6).out && !hmAt(23).out, hm.map(r => [r.hour, r.out]));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
