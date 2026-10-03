// The Black Sail, played through (Session 128's Compact finale; owed to play in backlog G, *Saves first*: "the faction
// lines in real play — Rowe at the seat, the duel on the yard, the black sail"). The Compact's ninth service sends you to
// board a black-sailed hull in the strait and clear her deck. Here it is taken the way a player takes it: the Compact at
// eight services, the service asked for in the Fortargent lord's own dialogue, your own ship put out to sea, the black
// sail that the open service calls up, E beside her hull to board, her crew cut down by your own swings (the game's own
// loop at fixed 1/60 ticks, the draw held off, as `saltwater` does), the service turned in at the seat for the rank of
// Prior, Rowe at the seat with the Prior's lines, and *Claim a house and a ship.*
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const seat = await page.evaluate(() => { WORLD.anchoredPlaces(); const F = WORLD.fstate(); const C = F.compact;
  Object.assign(C, { done: 8, rank: 2, active: null, closed: false }); worldState.ship = null; gold = 500; updateHUD(); forceTime(11);
  const s = WORLD.siteAnywhere(WORLD.FACTIONS.compact.seat); px = s.x; pz = s.z; return { id: s.id, name: s.name, kind: s.kind, lvl: level }; });
await g.settle(seat.id);

// the seat's voice: the lord on the plaza, or the steward in the keep
const lordDef = () => page.evaluate((id) => { const S = WORLD.settle.get(id); const d = S.lordNpc ? S.lordNpc.def : (S.houses.find(h => h.type === 'castle') || {}).dlg;
  window._lord = d; return d ? d.name : null; }, seat.id);
const choices = () => page.evaluate(() => [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim().replace(/^\d+\.\s*/, '')));
const ask = async (re) => { await page.evaluate(() => { try { if (dlgOpen) closeDialog(); } catch (e) {} openDialog(window._lord); }); await g.frames(2);
  const labels = await choices();
  const clicked = await page.evaluate((src) => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src).test(x.textContent.trim().replace(/^\d+\.\s*/, ''))); if (b) b.click(); return !!b; }, re.source);
  await g.frames(2); const said = await page.evaluate(() => (document.getElementById('dlg-text') || {}).textContent || '');
  await page.evaluate(() => { try { if (dlgOpen) closeDialog(); } catch (e) {} }); return { labels, clicked, said }; };
const svc = () => page.evaluate(() => { const C = WORLD.fstate().compact, q = C.active; return { done: C.done, rank: C.rank, house: !!C.house, kind: q && q.kind, objective: q && q.objective, reward: q && q.reward, qdone: q ? !!q.done : null, title: q && q.title }; });

const lord = await lordDef();
const t1 = await ask(/^Serve the Compact\.$/);
const s1 = await svc();
console.log('seat', JSON.stringify(seat), lord, JSON.stringify(t1), JSON.stringify(s1));
check(`at ${seat.name} (${seat.kind}), ${lord} offers *Serve the Compact.*`, !!lord && t1.clicked, { lord, t1 });
check('the ninth service is The Black Sail, in the lord\'s voice, for 220 + 20 a level', s1.kind === 'sail' && /The Black Sail/.test(s1.title) && /black-sailed hull has been taking tithe-ships/.test(t1.said) && s1.reward === 220 + 20 * seat.lvl, { t1, s1 });
const j1 = await page.evaluate(() => { const q = WORLD.fstate().compact.active; return { inJournal: WORLD.quests.some(x => x.id === q.id), objective: q.objective }; });
check('it is in the journal: board a black-sailed ship in the strait and clear her deck', j1.inJournal && /Board a black-sailed ship/.test(j1.objective), j1);
const t1b = await ask(/^Serve the Compact\.$/);
check('asked again before it is done, the lord says what is still owed', /You still owe us: Board a black-sailed ship/.test(t1b.said), t1b);

// out to sea in your own ship, at her wheel: the open service calls a black sail up
const out = await page.evaluate(() => { const s = WORLD.siteAnywhere(WORLD.FACTIONS.compact.seat);
  let best = null; for (let r = 300; r <= 2400 && !best; r += 100) for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2, x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
    if (WORLD.worldH(x, z) < -6 && !WORLD.SITES.some(t => Math.hypot(t.x - x, t.z - z) < t.pad + 120)) { best = { x, z }; break; } }
  if (!best) return null; px = best.x; pz = best.z; WORLD.spawnShip(best.x, best.z, 0); const S = WORLD.ship; S.sailing = true; px = S.x; pz = S.z;
  const fromSeat = Math.round(Math.hypot(best.x - s.x, best.z - s.z)); const others0 = WORLD.others.filter(o => o.kind === 'pirate').length;
  return { fromSeat, others0, ship: S.name }; });
const sail = await page.evaluate(() => { let n = 0; for (; n < 60 * 10; n++) { WORLD.tick(1 / 60, performance.now()); if (WORLD.others.some(o => o.kind === 'pirate')) break; }
  const o = WORLD.others.find(o => o.kind === 'pirate'); return { ticks: n, pirate: !!o, d: o ? Math.round(Math.hypot(o.x - px, o.z - pz)) : null }; });
console.log('at sea', JSON.stringify(out), JSON.stringify(sail));
check(`at sea in your own ship ${out && out.fromSeat} units off ${seat.name}, a black sail comes up while the service is open`, !!out && sail.pirate && sail.ticks <= 60 * 3, { out, sail });

// alongside her: off your own deck, E beside her hull
const along = await page.evaluate(() => { const o = WORLD.others.find(o => o.kind === 'pirate'); const S = WORLD.ship; S.sailing = false; window._o = o;
  o.speed = 0; const side = [Math.cos(o.yaw), -Math.sin(o.yaw)]; const half = (o.plat.x1 - o.plat.x0 + o.plat.z1 - o.plat.z0) / 4;
  let x = o.x, z = o.z, k = 0; for (; k < 200; k++) { x += side[0] * .1; z += side[1] * .1; const p = o.plat; const d = Math.hypot(Math.max(p.x0 - x, 0, x - p.x1), Math.max(p.z0 - z, 0, z - p.z1)); if (d > 1) break; }
  px = x; pz = z; jumpY = 0; yaw = Math.atan2(-(o.x - px), -(o.z - pz)); return { name: o.name, prompt: (typeof promptText === 'function') ? promptText() : null }; });
await g.frames(2);
await page.keyboard.press('e'); await g.frames(2);
const boarded = await page.evaluate(() => { const o = window._o; return { boarded: !!o.boarded, crew: o.crew.length, onHer: Math.hypot(px - o.x, pz - o.z) < 3 }; });
console.log('alongside', JSON.stringify(along), JSON.stringify(boarded));
check(`alongside ${along.name}, E boards her and her crew (${boarded.crew}) turns`, boarded.boarded && boarded.crew >= 3 && boarded.onHer, { along, boarded });

const fought = await page.evaluate(() => { const o = window._o; let swings = 0;
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0; try { for (; n < 60 * 120; n++) { const live = o.crew.filter(e => !e.dead); if (!live.length) break; PHP = maxHP; dead = false; stamina = maxStamina; PPOST.stagUntil = 0;
      let e = live[0], d = 1e9; for (const x of live) { const dd = Math.hypot(x.x - px, x.z - pz); if (dd < d) { d = dd; e = x; } }
      yaw = Math.atan2(-(e.x - px), -(e.z - pz)); if (d < 1.8 && atkCd <= 0 && !_pendingStrike) { attack(false); swings++; } t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now());
  return { swings, frames: n, left: o.crew.filter(e => !e.dead).length, msg: (document.getElementById('msg') || {}).textContent || '' }; });
const s2 = await svc();
console.log('boarding', JSON.stringify(fought), JSON.stringify(s2));
check(`her crew cut down by your own swings (${fought.swings}): *Her deck is yours.* and the service is done`, fought.left === 0 && s2.qdone === true, { fought, s2 });

// home to the seat: Prior, the after-line, Rowe, the claim
await page.evaluate((id) => { const s = WORLD.siteAnywhere(id); WORLD.ship.sailing = false; px = s.x; pz = s.z; jumpY = 0; }, seat.id);
await g.settle(seat.id); await lordDef();
const g0 = await page.evaluate(() => gold);
const t3 = await ask(/^Serve the Compact\.$/);
const s3 = await svc(); const g3 = await page.evaluate(() => gold);
console.log('turn-in', JSON.stringify(t3), JSON.stringify(s3), g0, g3);
check('turned in: *The Compact names you Prior.*, the after-line, rank 3, nine services', /^The Compact names you Prior\. The strait's quieter\. Prior — and the house and the ship are yours\./.test(t3.said) && s3.rank === 3 && s3.done === 9, { t3, s3 });
check(`paid at least the service's 220 + 20 a level`, g3 - g0 >= 220 + 20 * seat.lvl, { g0, g3 });
const rowe = await page.evaluate(() => { for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now()); const n = WORLD.rival.npc;
  return n ? { name: n.def.name, greet: n.def.greeting[0], topics: n.def.topics.map(t => t.label), d: Math.round(Math.hypot(n.g.position.x - px, n.g.position.z - pz)) } : null; });
console.log('rowe', JSON.stringify(rowe));
check('Rowe stands at the seat with the Prior\'s line (*They tell me you took the black sail*)', rowe && rowe.name === 'Hesket Rowe' && /took the black sail/.test(rowe.greet) && rowe.topics.includes('What now, Rowe?') && rowe.d < 30, rowe);
// Session 457: the claim said "The ship is at the quay under your name." and deeded the house alone. A Prior who came to the
// strait with no ship of their own (here the voyage's hull is taken off the books first) now gets a sloop, moored where a
// shipwright would launch one: Fortargent is inland, so at the nearest of the Compact's harbours, not yet loaded.
await page.evaluate(() => { WORLD.others.slice().forEach(o => WORLD.despawnOtherShip(o)); const S = WORLD.ship; if (S.mesh) { S.mesh.parent && S.mesh.parent.remove(S.mesh); S.mesh = null; } worldState.ship = null; });
const t4 = await ask(/^Claim a house and a ship\.$/);
const s4 = await page.evaluate((id) => { const own = worldState.owned || {}; const hs = Object.keys(own).filter(k => own[k].site === id); const sh = worldState.ship;
  const seat = WORLD.siteAnywhere(id); const P = sh ? WORLD.allPorts().sort((a, b) => Math.hypot(a.x - sh.x, a.z - sh.z) - Math.hypot(b.x - sh.x, b.z - sh.z))[0] : null;
  return { house: !!WORLD.fstate().compact.house, owned: hs.length, ship: sh ? { name: sh.name, x: Math.round(sh.x), z: Math.round(sh.z), h: +WORLD.worldH(sh.x, sh.z).toFixed(1) } : null, mesh: !!WORLD.ship.mesh,
    port: P && { id: P.id, name: P.name, nk: WORLD.nationKeyOf(...WORLD.cellOf(P.x, P.z)), fromSeat: Math.round(Math.hypot(P.x - seat.x, P.z - seat.z)), fromPort: Math.round(Math.hypot(P.x - sh.x, P.z - sh.z)), loaded: !!WORLD.settle.get(P.id) },
    log: (worldState.log || []).slice(-3).map(e => e.text || e.t || JSON.stringify(e)).join(' | ') }; }, seat.id);
console.log('claim', JSON.stringify(t4), JSON.stringify(s4));
check('*Claim a house and a ship.* deeds a house at the seat', t4.clicked && /The ship is at the quay under your name/.test(t4.said) && s4.house && s4.owned >= 1, { t4, s4 });
check(`and a ship: the ${s4.ship && s4.ship.name}, afloat off ${s4.port && s4.port.name} (the Compact's, ${s4.port && s4.port.fromSeat} from the seat, not loaded)`, !!s4.ship && s4.mesh && s4.ship.h < 0 && s4.port && s4.port.nk === 'aurenne' && !s4.port.loaded && s4.port.fromPort < 150, s4);
// go to that harbour: the ship lies beside the quay as built, and E from the quay's end boards her
const atq = await page.evaluate((pid) => { const P = WORLD.siteAnywhere(pid); px = P.x; pz = P.z; jumpY = 0; return P.name; }, s4.port.id);
await g.settle(s4.port.id);
const q5 = await page.evaluate((pid) => { const plat = ZONES.world.platforms.find(p => p.site === pid && !p.river && !p.shallow); const S = WORLD.ship;
  if (!plat) return { plat: false }; const cx = (plat.x0 + plat.x1) / 2, cz = (plat.z0 + plat.z1) / 2;
  let best = null, bd = 1e9; for (let i = 0; i <= 40; i++) for (let k = 0; k <= 40; k++) { const x = plat.x0 + (plat.x1 - plat.x0) * i / 40, z = plat.z0 + (plat.z1 - plat.z0) * k / 40;
    const dx = Math.max(S.plat.x0 - x, 0, x - S.plat.x1), dz = Math.max(S.plat.z0 - z, 0, z - S.plat.z1); const d = Math.hypot(dx, dz); if (d > 0 && d < bd) { bd = d; best = { x, z }; } }
  px = best.x; pz = best.z; jumpY = plat.y; yaw = Math.atan2(-(S.x - px), -(S.z - pz)); return { plat: true, gap: +bd.toFixed(2), y: plat.y }; }, s4.port.id);
await g.frames(2); await page.keyboard.press('e'); await g.frames(3);
const on5 = await page.evaluate(() => { const S = WORLD.ship; const p = S.plat; return { onDeck: px > p.x0 && px < p.x1 && pz > p.z0 && pz < p.z1 && Math.abs(jumpY - p.y) < 1 }; });
console.log('at', atq, JSON.stringify(q5), JSON.stringify(on5));
check(`at ${atq}, built, she lies alongside the quay (${q5.gap} from its edge), and E from the quay boards her`, q5.plat && q5.gap < 3.5 && on5.onDeck, { q5, on5 });
// with a ship already yours, the claim leaves her where she is (whether the Compact should give anything else is #DECISION)
const keep = await page.evaluate(() => { const C = WORLD.fstate().compact; C.house = false; const S = WORLD.ship; const before = { x: Math.round(S.x), z: Math.round(S.z), name: S.name };
  const s = WORLD.siteAnywhere(WORLD.FACTIONS.compact.seat); const px0 = px, pz0 = pz; px = s.x; pz = s.z; const t = WORLD.factionTopics(s).find(x => /^Claim /.test(x.label)); const said = t.fn(); px = px0; pz = pz0;
  return { said, before, after: { x: Math.round(S.x), z: Math.round(S.z), name: S.name } }; });
console.log('claim with a ship', JSON.stringify(keep));
check('claimed with a ship already yours, your ship stays where she is', JSON.stringify(keep.before) === JSON.stringify(keep.after), keep);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
