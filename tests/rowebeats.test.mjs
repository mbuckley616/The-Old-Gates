// Rowe at the seat, played through (Session 128's rival; owed to play in backlog G, *Saves first*: "the faction lines in
// real play — Rowe at the seat"). Hesket Rowe runs one rank ahead of you along the Crown's line at Coeur de Vie: before
// the fourth service she stands at the seat and gives her rank as the one above yours; the sixth sends you to find her
// sitting out on the land; after the ninth (the Silent Survey) she is at the seat with the Knight's line. Each beat is met
// the way a player meets it: walking up to the seat, the services asked and turned in through the lord's own dialogue,
// Rowe spoken to with E in front of her, the land walked to where the journal says she is.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const seat = await page.evaluate(() => { WORLD.anchoredPlaces(); const s = WORLD.siteAnywhere(WORLD.FACTIONS.crown.seat); return { id: s.id, name: s.name, kind: s.kind, x: s.x, z: s.z }; });
const at = async (x, z) => { await page.evaluate(([x, z]) => { const x0 = px, z0 = pz, L = Math.hypot(x - x0, z - z0), n = Math.max(1, Math.ceil(L / 20));
  for (let k = 1; k <= n; k++) { px = x0 + (x - x0) * k / n; pz = z0 + (z - z0) * k / n; jumpY = 0; for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); } }, [x, z]); };
const tick = (n) => page.evaluate((n) => { for (let i = 0; i < n; i++) WORLD.tick(1 / 60, performance.now()); }, n);
const setLine = (done, rank) => page.evaluate(([done, rank]) => { const F = WORLD.fstate(); for (const k in F) { if (F[k].active) { F[k].active.done = true; F[k].active.turnedIn = true; } Object.assign(F[k], { done: 0, rank: 0, active: null, closed: false }); } Object.assign(F.crown, { done, rank }); }, [done, rank]);
const lordDef = () => page.evaluate((id) => { const S = WORLD.settle.get(id); const d = S.lordNpc ? S.lordNpc.def : (S.houses.find(h => h.type === 'castle') || {}).dlg; window._lord = d; return d ? d.name : null; }, seat.id);
const say = async (open, re) => { await page.evaluate((open) => { try { if (dlgOpen) closeDialog(); } catch (e) {} if (open) openDialog(window._lord); }, open); await g.frames(2);
  const labels = await page.evaluate(() => [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim().replace(/^\d+\.\s*/, '')));
  const clicked = re ? await page.evaluate((src) => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src).test(x.textContent.trim().replace(/^\d+\.\s*/, ''))); if (b) b.click(); return !!b; }, re.source) : false;
  await g.frames(2); const said = await page.evaluate(() => (document.getElementById('dlg-text') || {}).textContent || '');
  await page.evaluate(() => { try { if (dlgOpen) closeDialog(); } catch (e) {} }); return { labels, clicked, said }; };
const serve = () => say(true, /^Serve the Crown\.$/);
// walk up to a person and press E, then read the dialogue (and click `re` if given)
const meet = async (getter, re) => { const ok = await page.evaluate((src) => { const n = (new Function('return ' + src))(); if (!n) return false; window._n = n; n._scared = performance.now() + 1;
    const dx = Math.sin(n.g.rotation.y), dz = Math.cos(n.g.rotation.y); px = n.g.position.x + dx * 1.3; pz = n.g.position.z + dz * 1.3; jumpY = n.g.position.y; yaw = Math.atan2(dx, dz); pitch = 0;
    try { if (dlgOpen) closeDialog(); } catch (e) {} return true; }, getter);
  if (!ok) return null; await g.frames(2);
  await page.evaluate(() => { const n = window._n; const dx = Math.sin(n.g.rotation.y), dz = Math.cos(n.g.rotation.y); px = n.g.position.x + dx * 1.3; pz = n.g.position.z + dz * 1.3; yaw = Math.atan2(dx, dz); });
  await page.keyboard.press('e'); await g.frames(2);
  const r = await page.evaluate(() => ({ open: !!dlgOpen, name: (document.getElementById('dlg-name') || {}).textContent, greet: (document.getElementById('dlg-text') || {}).textContent, labels: [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim().replace(/^\d+\.\s*/, '')), msg: (document.getElementById('msg') || {}).textContent || '' }));
  if (re) { await page.evaluate((src) => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src).test(x.textContent.trim())); if (b) b.click(); }, re.source); await g.frames(2);
    r.said = await page.evaluate(() => (document.getElementById('dlg-text') || {}).textContent || ''); }
  await page.evaluate(() => { try { if (dlgOpen) closeDialog(); } catch (e) {} }); return r; };
const rowe = 'WORLD.rival.npc';

// 1. three services done (a Commissioner), the fourth next: she is at the seat, a rank above you
await setLine(3, 1);
await page.evaluate(([x, z]) => { px = x; pz = z; }, [seat.x, seat.z]); await g.settle(seat.id); await lordDef(); await tick(120);
const m1 = await meet(rowe);
console.log('present', JSON.stringify(m1));
check(`at ${seat.name}, before the fourth service, Rowe stands at the seat and greets a Commissioner as the Warden of Roads`, m1 && m1.open && m1.name === 'Hesket Rowe' && /^Commissioner, is it\? I'm Warden of Roads\./.test(m1.greet) && m1.labels.includes('How are you ahead of me?'), m1);
const t1 = await serve(); await tick(60);
const r1 = await page.evaluate(() => { const n = WORLD.rival.npc; const q = WORLD.fstate().crown.active; return { npc: !!n, title: q && q.title }; });
console.log('fourth', JSON.stringify(t1.said.slice(0, 120)), JSON.stringify(r1));
check('the fourth service (The Old Survey) is given and she stays while it is open', /The Old Survey/.test(r1.title || '') && r1.npc, r1);

// 2. five done, the sixth: she is gone from the seat, and the lord sends you to find her
await setLine(5, 1); await tick(120);
const r2a = await page.evaluate(() => !!WORLD.rival.npc);
const t2 = await serve();
const q2 = await page.evaluate(() => { const q = WORLD.fstate().crown.active; return q && { title: q.title, objective: q.objective, who: q.data.who, x: Math.round(q.data.x), z: Math.round(q.data.z), kind: q.kind }; });
console.log('sixth', JSON.stringify(t2.said), JSON.stringify(q2), 'at seat', r2a);
check('before the sixth she is not at the seat; the lord\'s brief: *Rowe rode out three days ago…*, a find for Hesket Rowe', !r2a && q2 && q2.kind === 'find' && q2.who === 'Hesket Rowe' && /Rowe rode out three days ago/.test(t2.said) && /Hesket Rowe/.test(q2.objective), { r2a, t2, q2 });
await at(q2.x + 30, q2.z); await tick(30);
const m2 = await meet(`ZONES.world.npcs.find(n => n.def && n.def.name === 'Hesket Rowe' && n.def._lost && n.g.parent)`, /The seat sent me for you\./);
const s2 = await page.evaluate(() => { const q = WORLD.fstate().crown.active; return { done: !!(q && q.done), found: !!(q && q.data.found) }; });
console.log('found', JSON.stringify(m2), JSON.stringify(s2));
check(`walked out to where the journal says (${q2.objective}), Rowe is there, and E finds her`, m2 && m2.open && m2.name === 'Hesket Rowe' && s2.done && s2.found, { m2, s2 });
check('she has her own line: *Tell them Rowe\'s coming — and tell them who found her.*', m2 && /Tell them Rowe's coming/.test(m2.said || ''), m2);
await page.evaluate(([x, z]) => { px = x; pz = z; }, [seat.x, seat.z]); await g.settle(seat.id); await lordDef();
const g2 = await page.evaluate(() => gold);
const d2 = await say(true, /^It.s done\.$/);
const s2d = await page.evaluate((g2) => { const C = WORLD.fstate().crown; return { paid: gold - g2, active: !!C.active, turnedIn: !!(C.active && C.active.turnedIn) }; }, g2);
console.log('it is done', JSON.stringify(d2.said), JSON.stringify(s2d));
check('*It\'s done.* (the lord\'s own jobs) does not take the finished service: nothing paid, the service still to turn in', d2.clicked && s2d.paid === 0 && s2d.active && !s2d.turnedIn, { d2, s2d });
const t2b = await serve(); const s2b = await page.evaluate(() => { const C = WORLD.fstate().crown; return { done: C.done, rank: C.rank }; });
console.log('turned in', JSON.stringify(t2b.said), JSON.stringify(s2b));
const g2b = await page.evaluate(() => gold);
check('turned in at the seat: six services, Warden of Roads, paid once', s2b.done === 6 && s2b.rank === 2 && /names you Warden of Roads/.test(t2b.said) && g2b - g2 > 0, { t2b, s2b, g2, g2b });

// 3. eight done, the ninth (The Silent Survey): taken, the marker picked up, turned in; Knight, and Rowe at the seat after
await setLine(8, 2); await tick(60);
const t3 = await serve();
const q3 = await page.evaluate(() => { const q = WORLD.fstate().crown.active; return q && { title: q.title, kind: q.kind, item: q.data.item, x: q.data.x, z: q.data.z }; });
console.log('ninth', JSON.stringify(t3.said.slice(0, 160)), JSON.stringify(q3));
check('the ninth is The Silent Survey: bring back the survey team\'s marker', q3 && /The Silent Survey/.test(q3.title) && q3.kind === 'retrieve' && q3.item === "the survey team's marker", { t3, q3 });
await at(q3.x, q3.z); await tick(30);
const got = await page.evaluate(() => { const q = WORLD.fstate().crown.active; return { got: !!q.data.got, done: !!q.done }; });
check('walked onto the marker, it is taken and the service is done', got.got && got.done, got);
await page.evaluate(([x, z]) => { px = x; pz = z; }, [seat.x, seat.z]); await g.settle(seat.id); await lordDef();
const t3b = await serve(); await tick(120);
const s3 = await page.evaluate(() => { const C = WORLD.fstate().crown; return { done: C.done, rank: C.rank }; });
const m3 = await meet(rowe, /What now, Rowe\?/);
console.log('knight', JSON.stringify(t3b.said), JSON.stringify(s3), JSON.stringify(m3));
check('turned in: Knight of the Gates, with the after-line (*They were etching, Knight.*)', s3.rank === 3 && s3.done === 9 && /names you Knight of the Gates\. They were etching, Knight\./.test(t3b.said), { t3b, s3 });
check('and Rowe is at the seat with the Knight\'s line and *What now, Rowe?*', m3 && m3.name === 'Hesket Rowe' && /^Knight\. I heard about the survey team\./.test(m3.greet) && /etching in the gates/.test(m3.said || ''), m3);
// 4. the lord's own job open at the seat (*I'm looking for work.*), then *Serve the Crown.* with the sixth service next
await setLine(5, 1);
const w4 = await say(true, /^I.m looking for work\.$/);
const j4 = await page.evaluate((id) => WORLD.quests.filter(q => !q.turnedIn && q.giverSite === id).map(q => ({ title: q.title, faction: q.faction || null })), seat.id);
const t4 = await serve();
const q4 = await page.evaluate((id) => { const C = WORLD.fstate().crown; const q = C.active; return { active: q && { title: q.title, kind: q.kind, faction: q.faction || null, service: q.service }, open: WORLD.quests.filter(q => !q.turnedIn && q.giverSite === id).map(q => q.title) }; }, seat.id);
console.log('town job then serve', JSON.stringify(w4.said.slice(0, 100)), JSON.stringify(j4), JSON.stringify(t4.said.slice(0, 160)), JSON.stringify(q4));
check('with the lord\'s own job open, *Serve the Crown.* still gives the sixth service (Where Is Warden Rowe?), not the lord\'s job', q4.active && /Where Is Warden Rowe\?/.test(q4.active.title) && q4.active.faction === 'crown' && q4.active.service === 5, { j4, t4, q4 });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
