// The Church and the factions end to end (Session 158, backlog G: confess at a church with a record; try to serve a
// faction with a fine standing; the tithe against the fine). `crime4` checks each rule from set-up state; this plays it
// through: a lock picked in Dunmore under a witness's eye, the priest found where he stands and asked through his own
// dialogue, quiet days, the Crown's seat asked with the fine standing, the fine paid to the lord through his.
// Session 425 found the priest still offering *Confess.* once the quiet days had given the favour back with the fine
// unpaid, and taking the 25-gold tithe for nothing; he now hears you only while favour is owed (or a guard's death).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const choices = () => page.evaluate(() => [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim().replace(/^\d+\.\s*/, '')));
const click = (re) => page.evaluate((src) => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src).test(x.textContent.trim().replace(/^\d+\.\s*/, ''))); if (b) b.click(); return !!b; }, re);
const said = () => page.evaluate(() => document.getElementById('dlg-text').textContent);
const shut = () => page.evaluate(() => { try { if (dlgOpen) closeDialog(); } catch (e) {} });
const state = () => page.evaluate(() => { const c = (worldState.crime || {}).dunmore || {}; return { gold, favor: WORLD.favor('dunmore'), debt: c.debt || 0, bounty: c.bounty || 0 }; });

// the crime: a shop door picked at 23h with someone three units off in the street (as `crime2` stages it)
const crime = await page.evaluate(() => { forceTime(23); worldState.crime = {}; worldState.church = { notes: [] }; const S = WORLD.settle.get('dunmore');
  const F = WORLD.fstate(); F.crown.done = 6; F.crown.rank = 2; F.crown.active = null;
  const h = S.houses.filter(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper)[0]; const w = S.npcs.find(n => n.sched && n.sched.type !== 'guard') || S.npcs[0];
  S.npcs.forEach(n => { n.g.visible = false; });
  const dx = h.exitX - h.doorX, dz = h.exitZ - h.doorZ, L = Math.hypot(dx, dz) || 1; px = h.doorX + dx / L * .8; pz = h.doorZ + dz / L * .8; jumpY = 0;
  const wx = h.doorX + dx / L * 3, wz = h.doorZ + dz / L * 3; const sched0 = w.sched; w.g.visible = true; w._retreated = false; w.sched = { type: 'guard', a: { x: wx, z: wz }, b: { x: wx, z: wz } }; w.g.position.set(wx, WORLD.worldH(wx, wz), wz);
  worldState.picked = {}; WORLD.doorLockFor(h).onPick(); w.sched = sched0; S.npcs.forEach(n => { n.g.visible = true; }); gold = 500; updateHUD();
  return { shop: h.name, witness: w.def && w.def.name, day: Math.floor(worldState.gameTimeAbsMinutes / 1440) }; });
const s0 = await state(); console.log('crime', JSON.stringify(crime), JSON.stringify(s0));
check('a lock picked under a witness\'s eye: favour −1, a point owed, a 25-gold fine', s0.favor === -1 && s0.debt === 1 && s0.bounty === 25, { crime, s0 });

// morning: the priest, where he is, through his own dialogue
await page.evaluate(() => { forceTime(10); for (let i = 0; i < 240; i++) WORLD.tick(1 / 60, performance.now()); });
const where = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const ch = S.houses.find(x => x.type === 'church');
  const pn = S.npcs.find(n => n.def === ch.dlg); window._ch = ch; window._pn = pn;
  return { church: ch && ch.name, priest: ch && ch.dlg && ch.dlg.name, inStreet: !!(pn && pn.g.visible && !pn._retreated) }; });
console.log('where', JSON.stringify(where));
check('Dunmore has a church and its priest', !!where.church && !!where.priest, where);
// go to him: in the street if he is out, else inside the church
const talkTo = async () => { if (await page.evaluate(() => isInterior())) { await page.evaluate(() => exitInterior()); await page.waitForTimeout(2500); await g.hide(); }
  const out = await page.evaluate(() => { const pn = window._pn;
    if (pn && pn.g.visible && !pn._retreated) { pn._scared = performance.now() + 1; const dx = Math.sin(pn.g.rotation.y), dz = Math.cos(pn.g.rotation.y);
      px = pn.g.position.x + dx * 1.3; pz = pn.g.position.z + dz * 1.3; jumpY = pn.g.position.y; yaw = Math.atan2(dx, dz); pitch = 0; return 'street'; }
    px = _ch.exitX; pz = _ch.exitZ; goToInterior(_ch); return 'inside'; });
  if (out === 'inside') { await page.waitForTimeout(4000); await g.hide(); await page.evaluate(() => { const m = intNPCMesh; /* by day the priest keeps the church, as a keeper keeps a shop */
    const dx = Math.sin(m.rotation.y), dz = Math.cos(m.rotation.y); px = m.position.x + dx * 1.2; pz = m.position.z + dz * 1.2; jumpY = 0; yaw = Math.atan2(dx, dz); pitch = 0; }); }
  await g.frames(2); await page.keyboard.press('e'); await g.frames(2);
  const r = { at: out, name: await page.evaluate(() => document.getElementById('dlg').style.display === 'block' ? document.getElementById('dlg-name').textContent : null), choices: await choices() };
  return r; };
const t1 = await talkTo(); console.log('talk', JSON.stringify(t1));
check('E by the priest opens his dialogue, and with a record *Confess.* is among his topics', t1.name === where.priest && t1.choices.includes('Confess.'), t1);
await click('^Confess\\.$'); const heard = await said(); const s1 = await state();
check('confessing takes the 25-gold tithe and buys back the point: favour 0, nothing owed, the fine still standing', /It is heard/.test(heard) && s1.gold === 475 && s1.favor === 0 && s1.debt === 0 && s1.bounty === 25, { heard, s1 });
await shut();
// the Crown's seat, with the fine standing: Dunmore is the Crown's
const seat = () => page.evaluate(() => { const S = WORLD.settle.get('dunmore'); WORLD.anchoredPlaces(); return WORLD.factionTopics({ id: WORLD.FACTIONS.crown.seat, x: S.site.x, z: S.site.z, name: 'the seat' }).map(t => t.label + ' / ' + (t.response || '')); });
const seat1 = await seat();
check('the Crown will not take you on while Dunmore\'s fine stands, though the favour is bought back', seat1.length === 1 && /Not while Dunmore/.test(seat1[0]), seat1);
// the priest again, with only the fine left: nothing for him to hear
const t2 = await talkTo(); const s2 = await state(); await shut();
check('with no favour owed and only a fine left, the priest offers no confession (the fine is the lord\'s)', t2.name === where.priest && !t2.choices.includes('Confess.') && s2.gold === 475, { t2, s2 });

// a second record, and quiet days giving the favour back on their own: the priest has nothing to sell for it
const quiet = await page.evaluate(() => { const c = worldState.crime.dunmore; WORLD.addFavor('dunmore', -2); c.debt = 2; c.bounty += 50; c.last = Math.floor(worldState.gameTimeAbsMinutes / 1440);
  const d = []; for (let k = 0; k < 6; k++) { worldState.gameTimeAbsMinutes += 1440; WORLD.tickCrimeDay(); d.push([c.debt, WORLD.favor('dunmore')]); } return { days: d, bounty: c.bounty }; });
const t3 = await talkTo(); const s3 = await state(); await shut();
console.log('quiet', JSON.stringify(quiet), JSON.stringify(t3.choices), JSON.stringify(s3));
check('six quiet days give back two points of favour on their own; the fine stands; no confession is offered for nothing', quiet.days[5][0] === 0 && s3.favor === 0 && s3.bounty === 75 && !t3.choices.includes('Confess.'), { quiet, s3, t3 });

// the fine paid to the lord through his dialogue: the record is clean and the Crown will take you on
const lord = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const ln = S.npcs.find(n => n.def && n.def._lord); if (!ln) return null; openDialog(ln.def); return ln.def.name; });
const lc = await choices(); const paidOk = await click('^Pay my fine'); const paid = await said(); const s4 = await state(); await shut(); const seat2 = await seat();
console.log('lord', lord, JSON.stringify(lc), paid, JSON.stringify(s4), JSON.stringify(seat2.slice(0, 2)));
check('the lord takes the fine (75): the record is clean, and the Crown\'s seat offers service again', !!lord && paidOk && s4.gold === 400 && s4.bounty === 0 && s4.favor === 0 && /^Serve the Crown\./.test(seat2[0] || ''), { lord, lc, paid, s4, seat2 });
const t5 = await talkTo(); await shut();
check('and the priest has nothing to hear', !t5.choices.includes('Confess.'), t5);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
