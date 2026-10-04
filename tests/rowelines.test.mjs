// Rowe along the League's and the Compact's lines, played through (backlog G, *Saves first*: "the faction lines in real
// play"; Session 458 walked the Crown's at Coeur de Vie and left the other two owed: "The League's line (Caer Slige)
// shares this code. Its sixth service, *Where Is Rowe?*, was not walked"). For each seat: before the fourth service
// Rowe stands there a rank ahead of you; the fourth is given and she stays while it is open; before the sixth she is
// gone and the lord sends you to find her; walked out to the spot, E opens her dialogue and finds her; *It's done.* does
// not take the service; *Serve* turns it in once and names the second rank; and with the lord's own job in hand, *Serve*
// still gives the sixth service; and once it is turned in no Rowe is left sitting on the land (Session 463). Each step is taken as a player takes it: the lord's own dialogue, E in front of Rowe.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const LINES = {
  league: { serve: /^Serve the Captains' League\.$/, fourth: /The Reeve's Seal/, sixth: /^Where Is Rowe\?$/, brief: /^Rowe took the hill road (north|south|east|west|north-east|north-west|south-east|south-west), alone\. Reeves don't go alone\. There's a camp out that way\. Bring her back\.$/, rank: 'Reeve',
    greet: /^Sworn, is it\? I'm Reeve\. They gave me the coast road\./, rank2: /names you Reeve\./ },
  compact: { serve: /^Serve the Compact\.$/, fourth: /What the Sea Gave Back/, sixth: /^Where Is Factor Rowe\?$/, brief: /^Factor Rowe went (north|south|east|west|north-east|north-west|south-east|south-west) to look at a gate the Church had sealed, .*Kindly bring her back to her ledgers\.$/, rank: 'Factor',
    greet: /^Clerk, is it\? I'm Factor\. The Church counts in fortnights\./, rank2: /names you Factor\./ },
};
const at = async (x, z) => { await page.evaluate(([x, z]) => { const x0 = px, z0 = pz, L = Math.hypot(x - x0, z - z0), n = Math.max(1, Math.ceil(L / 20));
  for (let k = 1; k <= n; k++) { px = x0 + (x - x0) * k / n; pz = z0 + (z - z0) * k / n; jumpY = 0; for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); } }, [x, z]); };
const tick = (n) => page.evaluate((n) => { for (let i = 0; i < n; i++) WORLD.tick(1 / 60, performance.now()); }, n);
const setLine = (fk, done, rank) => page.evaluate(([fk, done, rank]) => { const F = WORLD.fstate(); for (const k in F) { if (F[k].active) { F[k].active.done = true; F[k].active.turnedIn = true; } Object.assign(F[k], { done: 0, rank: 0, active: null, closed: false }); } Object.assign(F[fk], { done, rank }); }, [fk, done, rank]);
const say = async (open, re) => { await page.evaluate((open) => { try { if (dlgOpen) closeDialog(); } catch (e) {} if (open) openDialog(window._lord); }, open); await g.frames(2);
  const labels = await page.evaluate(() => [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim().replace(/^\d+\.\s*/, '')));
  const clicked = re ? await page.evaluate((src) => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src).test(x.textContent.trim().replace(/^\d+\.\s*/, ''))); if (b) b.click(); return !!b; }, re.source) : false;
  await g.frames(2); const said = await page.evaluate(() => (document.getElementById('dlg-text') || {}).textContent || '');
  await page.evaluate(() => { try { if (dlgOpen) closeDialog(); } catch (e) {} }); return { labels, clicked, said }; };
const meet = async (getter, re) => { const ok = await page.evaluate((src) => { const n = (new Function('return ' + src))(); if (!n) return false; window._n = n; n._scared = performance.now() + 1;
    const dx = Math.sin(n.g.rotation.y), dz = Math.cos(n.g.rotation.y); px = n.g.position.x + dx * 1.3; pz = n.g.position.z + dz * 1.3; jumpY = n.g.position.y; yaw = Math.atan2(dx, dz); pitch = 0;
    try { if (dlgOpen) closeDialog(); } catch (e) {} return true; }, getter);
  if (!ok) return null; await g.frames(2);
  await page.evaluate(() => { const n = window._n; const dx = Math.sin(n.g.rotation.y), dz = Math.cos(n.g.rotation.y); px = n.g.position.x + dx * 1.3; pz = n.g.position.z + dz * 1.3; yaw = Math.atan2(dx, dz); });
  await page.keyboard.press('e'); await g.frames(2);
  const r = await page.evaluate(() => ({ open: !!dlgOpen, name: (document.getElementById('dlg-name') || {}).textContent, role: (document.getElementById('dlg-role') || {}).textContent, greet: (document.getElementById('dlg-text') || {}).textContent, labels: [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim().replace(/^\d+\.\s*/, '')), msg: (document.getElementById('msg') || {}).textContent || '' }));
  if (re) { await page.evaluate((src) => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src).test(x.textContent.trim())); if (b) b.click(); }, re.source); await g.frames(2);
    r.said = await page.evaluate(() => (document.getElementById('dlg-text') || {}).textContent || ''); }
  await page.evaluate(() => { try { if (dlgOpen) closeDialog(); } catch (e) {} }); return r; };

for (const fk of ['league', 'compact']) {
  const L = LINES[fk];
  const seat = await page.evaluate((fk) => { WORLD.anchoredPlaces(); const s = WORLD.siteAnywhere(WORLD.FACTIONS[fk].seat); return { id: s.id, name: s.name, kind: s.kind, x: s.x, z: s.z }; }, fk);
  const home = async () => { await page.evaluate(([x, z]) => { px = x; pz = z; }, [seat.x, seat.z]); await g.settle(seat.id);
    await page.waitForFunction((id) => !!WORLD.settle.get(id), seat.id, { timeout: 180000 }); /* a city far from the start can take longer than g.settle's minute to build on a slow CI runner (CI on 8a61fea) */
    return page.evaluate((id) => { const S = WORLD.settle.get(id); const d = S.lordNpc ? S.lordNpc.def : (S.houses.find(h => h.type === 'castle') || {}).dlg; window._lord = d; return d ? d.name : null; }, seat.id); };
  const serve = () => say(true, L.serve);
  console.log(`\n-- ${fk} at ${seat.name} (${seat.kind})`);

  // 1. three done, a Sworn/Clerk: Rowe at the seat a rank above; the fourth service given, and she stays while it's open
  await setLine(fk, 3, 1); const lord = await home(); await tick(120);
  const m1 = await meet('WORLD.rival.npc');
  console.log('lord', lord, 'present', JSON.stringify(m1));
  check(`${fk}: at ${seat.name}, before the fourth service, Rowe greets you a rank above (${L.greet.source.slice(1, 40)}…)`, m1 && m1.open && m1.name === 'Hesket Rowe' && L.greet.test(m1.greet) && m1.labels.includes('How are you ahead of me?'), m1);
  const t1 = await serve(); await tick(60);
  const r1 = await page.evaluate((fk) => { const q = WORLD.fstate()[fk].active; return { npc: !!WORLD.rival.npc, title: q && q.title }; }, fk);
  console.log('fourth', JSON.stringify(t1.said.slice(0, 140)), JSON.stringify(r1));
  check(`${fk}: the fourth service (${L.fourth.source}) is given through the lord, and Rowe stays while it is open`, t1.clicked && L.fourth.test(r1.title || '') && r1.npc, { t1, r1 });

  // 2. five done: she is gone; the sixth is a find for her, walked out to and met with E
  await setLine(fk, 5, 1); await tick(120);
  const r2a = await page.evaluate(() => !!WORLD.rival.npc);
  const t2 = await serve();
  const q2 = await page.evaluate((fk) => { const q = WORLD.fstate()[fk].active; return q && { title: q.title, objective: q.objective, who: q.data.who, x: Math.round(q.data.x), z: Math.round(q.data.z), kind: q.kind, service: q.service }; }, fk);
  console.log('sixth', JSON.stringify(t2.said), JSON.stringify(q2), 'at seat', r2a);
  check(`${fk}: before the sixth she is gone from the seat; the lord's brief is the authored one, a find for Hesket Rowe`, !r2a && q2 && q2.kind === 'find' && q2.who === 'Hesket Rowe' && q2.service === 5 && L.brief.test(t2.said.replace(/^[^:]+: "/, '').replace(/" \(\d+ gold.*$/, '')) && L.sixth.test(q2.title.replace(/^[^:]+: /, '')), { r2a, t2, q2 });
  await at(q2.x + 30, q2.z); await tick(30);
  const m2 = await meet(`ZONES.world.npcs.find(n => n.def && n.def.name === 'Hesket Rowe' && n.def._lost && n.g.parent)`, /The seat sent me for you\./);
  const s2 = await page.evaluate((fk) => { const q = WORLD.fstate()[fk].active; return { done: !!(q && q.done), found: !!(q && q.data.found) }; }, fk);
  console.log('found', JSON.stringify(m2), JSON.stringify(s2));
  check(`${fk}: walked out (${q2 && q2.objective}), Rowe is there, E opens her dialogue and finds her, with her own line`, m2 && m2.open && m2.name === 'Hesket Rowe' && s2.done && s2.found && /Tell them Rowe's coming/.test(m2.said || ''), { m2, s2 });
  check(`${fk}: found on the land she is the ${L.rank}, greets in her own words, and offers only her own topic (quest review Finding 10)`, m2 && m2.role === L.rank && /^Aye\. Thought it'd be you\. Sit, if you're stopping/.test(m2.greet || '') && JSON.stringify(m2.labels.filter(l => !/^My name is /.test(l))) === JSON.stringify(['The seat sent me for you.', 'Farewell.']), m2);
  await home();
  const g2 = await page.evaluate(() => gold);
  const d2 = await say(true, /^It.s done\.$/);
  const s2d = await page.evaluate(([fk, g2]) => { const C = WORLD.fstate()[fk]; return { paid: gold - g2, active: !!C.active, turnedIn: !!(C.active && C.active.turnedIn) }; }, [fk, g2]);
  console.log('it is done', JSON.stringify(d2), JSON.stringify(s2d));
  check(`${fk}: *It's done.* does not take the finished service (nothing paid, still to turn in)`, s2d.paid === 0 && s2d.active && !s2d.turnedIn, { d2, s2d });
  const t2b = await serve(); const s2b = await page.evaluate((fk) => { const C = WORLD.fstate()[fk]; return { done: C.done, rank: C.rank, gold }; }, fk);
  console.log('turned in', JSON.stringify(t2b.said), JSON.stringify(s2b));
  check(`${fk}: turned in at the seat: six services, the second rank, paid once`, s2b.done === 6 && s2b.rank === 2 && L.rank2.test(t2b.said) && s2b.gold - g2 > 0, { t2b, s2b, g2 });
  const left = await page.evaluate(() => ZONES.world.npcs.filter(n => n.def && n.def.name === 'Hesket Rowe' && n.def._lost).map(n => ({ x: Math.round(n.g.position.x), z: Math.round(n.g.position.z), parent: !!n.g.parent })));
  check(`${fk}: turned in, she has ridden back: no Rowe is left sitting where she was found (Session 463)`, left.length === 0, left);

  // 3. the lord's own job in hand, then *Serve* with the sixth next: the service, not the job
  await setLine(fk, 5, 1);
  const w3 = await say(true, /^I.m looking for work\.$/);
  const t3 = await serve();
  const q3 = await page.evaluate(([fk, id]) => { const q = WORLD.fstate()[fk].active; return { active: q && { title: q.title, faction: q.faction || null, service: q.service }, open: WORLD.quests.filter(q => !q.turnedIn && q.giverSite === id).map(q => q.title) }; }, [fk, seat.id]);
  console.log('job then serve', JSON.stringify(w3.said.slice(0, 100)), JSON.stringify(t3.said.slice(0, 120)), JSON.stringify(q3));
  check(`${fk}: with the lord's own job open, *Serve* still gives the sixth service`, w3.clicked && q3.active && L.sixth.test(q3.active.title.replace(/^[^:]+: /, '')) && q3.active.faction === fk && q3.active.service === 5, { w3, t3, q3 });
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
