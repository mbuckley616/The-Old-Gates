// The Wolf-Mother's Cloak in its den (Session 992; the approved draft, *The Makers' Things* §6; Michael's A on DECISION #270):
// the master of the cloak's lair sleeps on the cloak and wakes only when struck, never by sight or sound. The first time you see it
// sleeping, the draft's line, once. *Press 'E' to take the grey cloak from under it* within reach of the hem and not attacking.
// At Resolve 29 the hand comes back (costs nothing, wakes nothing, the try kept); at 30 the cloak is taken with the draft's words
// and log, and the master sleeps on. Struck, it is awake for good. The cavern is entered for real and driven by the game's loop.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

await page.evaluate(() => { window._said = []; const sm = showMsg; showMsg = function (t) { window._said.push(t); return sm.apply(this, arguments); };
  delete worldState.artifacts; delete worldState.artifactTries; if (worldState.stats) delete worldState.stats.cloakSeen;
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1); if (EQ.back && EQ.back.artifact) EQ.back = null;
  if (worldState.masters) delete worldState.masters[cloakSeed()]; });

const enter = async () => {
  await page.evaluate(() => { const sd = cloakSeed(), d = WORLD.doorAnywhere(sd); const p = makePortalDef(d); const wp = WORLD.dungeonPos[sd]; if (wp) { p.x = wp.x; p.z = wp.z; }
    p.zone = 'world'; p.lair = d.lair; px = p.x; pz = p.z + 3; window._cave = p; window._lairBoss = null; goToDungeon(p); });
  for (let k = 0; k < 60 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && window._lairBoss && !window._lairBoss.dead)); k++) await page.waitForTimeout(500);
  await page.evaluate(() => { ENEMIES.forEach(e => { if (e !== window._lairBoss) e.dead = true; }); PHP = effMaxHP();
    const L = CLOAK_DEN; window._put = (k) => { const e = window._lairBoss; currentFloor = e.floor || 1; jumpY = currentFloor === 2 ? FLOOR2_Y : 0; velY = 0; onGround = true;
      if (!L) { px = e.x + 2; pz = e.z; return; } const dx = L.hx - e.x, dz = L.hz - e.z, dl = Math.hypot(dx, dz) || 1; px = e.x + dx / dl * k; pz = e.z + dz / dl * k; }; });
};
const leave = async () => {
  await page.evaluate(() => goToOW());
  for (let k = 0; k < 60 && !(await page.evaluate(() => activeZoneId === 'world')); k++) await page.waitForTimeout(500);
};

await enter();
const den = await page.evaluate(() => { const L = CLOAK_DEN, e = window._lairBoss; return L ? { name: L.name, master: e.name, asleep: !!e.cloakSleep, alert: e.alert, mesh: !!(L.mesh && L.mesh.parent === dScene),
  hem: +Math.hypot(L.hx - e.x, L.hz - e.z).toFixed(2), hemOpen: !dSolid(L.hx, L.hz), lair: artifactPlaces().wolf_cloak.name } : { none: true }; });
console.log('den', JSON.stringify(den));
check(`in ${den.lair}, ${den.master} sleeps on the grey cloak, its hem ${den.hem} m out on open floor`, !den.none && den.asleep && !den.alert && den.mesh && den.hemOpen && den.hem > 0.5, den);

// the first sight: from a point 3 to 6.5 units off with open floor and a clear line to the master (the foes' own line test), driven by the loop
const far = await page.evaluate(() => { const e = window._lairBoss; window._put(0);
  for (let k = 6.5; k >= 3; k -= .5) for (let a = 0; a < 16; a++) { const x = e.x + Math.sin(a * Math.PI / 8) * k, z = e.z + Math.cos(a * Math.PI / 8) * k; if (dSolid(x, z)) continue;
    let clear = true; for (let t = .15; t < .9 && clear; t += .15) if (dSolid(x + (e.x - x) * t, z + (e.z - z) * t)) clear = false; if (clear) { px = x; pz = z; window._said.length = 0; return k; } }
  return 0; });
await g.frames(6);
const s1 = await page.evaluate(() => ({ said: window._said.slice(), seen: worldState.stats && worldState.stats.cloakSeen }));
await page.evaluate(() => { window._put(4); window._said.length = 0; });
await g.frames(6);
const s2 = await page.evaluate(() => window._said.slice());
console.log('seen', JSON.stringify(s1), JSON.stringify(s2));
check(`${far} units off, the draft's line once: *${s1.said[0]}*`, far > 0 && s1.said.filter(t => t === 'The master of the cave is lying on something grey that is not its own hide.').length === 1 && s1.seen === 1 && !s2.length, { s1, s2 });

// it sleeps on with you beside it: no sight, no sound, no blow
const still = await page.evaluate(() => { const e = window._lairBoss; window._put(1.6); window._st = { x: e.x, z: e.z, hp: PHP }; return true; });
await g.frames(90);
const st = await page.evaluate(() => { const e = window._lairBoss; return { alert: e.alert, asleep: !!e.cloakSleep, moved: +Math.hypot(e.x - window._st.x, e.z - window._st.z).toFixed(3), lost: window._st.hp - PHP, d: +Math.hypot(px - e.x, pz - e.z).toFixed(2) }; });
console.log('still', JSON.stringify(st));
check(`90 frames ${st.d} m from it, it sleeps: not alert, moved ${st.moved}, your health lost ${st.lost}`, still && !st.alert && st.asleep && st.moved === 0 && st.lost === 0, st);

// the prompt at the hem, and none while attacking
await page.evaluate(() => { window._put(Math.hypot(CLOAK_DEN.hx - window._lairBoss.x, CLOAK_DEN.hz - window._lairBoss.z) + .4); });
await g.frames(4);
const pr = await page.evaluate(() => { const r = { text: document.getElementById('ipr').textContent, near: cloakDenNear() }; _bowDrawing = true; r.drawing = cloakDenNear(); _bowDrawing = false; swingT = .3; r.swinging = cloakDenNear(); swingT = 0; return r; });
console.log('prompt', JSON.stringify(pr));
check(`at the hem the prompt reads *${pr.text}*; not while a bow is drawn or a swing is in the air`, pr.text === "Press 'E' to take the grey cloak from under it" && pr.near && !pr.drawing && !pr.swinging, pr);

const fail = await page.evaluate(() => { window._keepA = { ...ATTRS }; ATTRS.resolve = 29; window._said.length = 0; const n0 = GAME_LOG.length; interact();
  const e = window._lairBoss; return { said: window._said.slice(), taken: !!artifactState('wolf_cloak'), inBag: BAG.some(it => it.artifact === 'wolf_cloak'), still: !!(CLOAK_DEN.mesh && CLOAK_DEN.mesh.parent),
    tries: worldState.artifactTries && worldState.artifactTries.wolf_cloak, asleep: !!e.cloakSleep, alert: e.alert, log: GAME_LOG.slice(n0).length, journal: artifactsNotYet().map(x => x.text) }; });
await g.frames(10);
const failAfter = await page.evaluate(() => ({ asleep: !!window._lairBoss.cloakSleep, alert: window._lairBoss.alert }));
console.log('fail', JSON.stringify(fail), JSON.stringify(failAfter));
check(`Resolve 29: *${fail.said[0]}*, nothing taken, nothing woken, the try kept`, fail.said[0] === 'You put out your hand, and take it back. Not yet.' && !fail.taken && !fail.inBag && fail.still && fail.tries && fail.tries.n === 1 && fail.asleep && !fail.alert && failAfter.asleep && !failAfter.alert && fail.log === 0, { fail, failAfter });
check(`the Journal's *Things not yet yours* reads *${fail.journal[0]}*`, fail.journal.includes(`The Wolf-Mother's Cloak — in the den at ${den.lair}. Resolve 30.`), fail.journal);

const take = await page.evaluate(() => { ATTRS.resolve = 30; window._said.length = 0; const n0 = GAME_LOG.length; interact(); const it = BAG.find(it => it.artifact === 'wolf_cloak');
  const r = { said: window._said.slice(), state: artifactState('wolf_cloak'), item: it && it.name, half: it && it.half, unique: it && it.unique, mesh: CLOAK_DEN.mesh, log: GAME_LOG.slice(n0).map(e => e.text),
    drain: cloakDrain(cloakTown()), notYet: artifactsNotYet().length };
  Object.assign(ATTRS, window._keepA); return r; });
await g.frames(30);
const takeAfter = await page.evaluate(() => { const el = document.getElementById('ipr'); return { asleep: !!window._lairBoss.cloakSleep, alert: window._lairBoss.alert, prompt: el.style.opacity === '0' || el.style.display === 'none' ? '' : el.textContent }; });
console.log('take', JSON.stringify(take), JSON.stringify(takeAfter));
check(`Resolve 30: *${take.said[0]}*`, take.said[0] === 'It lifts its head and looks at you for a long time. Then it lays its head down on the bare stone, and lets you go.', take);
check(`the log: *${take.log[0]}*; the cloak whole in the bag, unique; the town pays ${take.drain} a day`, take.log[0] === `Took the Wolf-Mother's Cloak from under the master of ${den.lair}. It lives.` && take.state && take.state.taken && !take.state.half && take.item === "The Wolf-Mother's Cloak" && !take.half && take.unique && take.mesh === null && take.drain === 0.6 && take.notYet === 0, take);
check('it sleeps on and lets you go; no prompt where the cloak lay', takeAfter.asleep && !takeAfter.alert && !/grey cloak/.test(takeAfter.prompt), takeAfter);
await leave();

// a second visit: it sleeps still, with nothing under it to take
await enter();
const again = await page.evaluate(() => ({ asleep: !!window._lairBoss.cloakSleep, mesh: CLOAK_DEN && CLOAK_DEN.mesh, near: (window._put(1.5), cloakDenNear()) }));
check('a second visit: the master sleeps still, and nothing lies under it', again.asleep && again.mesh === null && !again.near, again);

// struck, it wakes, and for good
await page.evaluate(() => { const e = window._lairBoss; window._put(2.5); e.hp -= 5; });
await g.frames(6);
const woke = await page.evaluate(() => { const e = window._lairBoss; return { asleep: !!e.cloakSleep, alert: e.alert, woke: worldState.masters[cloakSeed()].woke }; });
console.log('woke', JSON.stringify(woke));
check('a blow wakes it: alert, and the world remembers', !woke.asleep && woke.alert && woke.woke === true, woke);
await leave();
await enter();
const third = await page.evaluate(() => ({ asleep: !!window._lairBoss.cloakSleep, den: CLOAK_DEN }));
check('a third visit: it is awake as any master', !third.asleep && third.den === null, third);
await leave();

// another lair's master is never laid down
const other = await page.evaluate(() => { const fake = { ...window._cave, seed: cloakSeed() + 1 }; const e = { master: true, dead: false, x: 0, z: 0 }; ENEMIES.push(e); const r = cloakDenLay(fake, e); ENEMIES.pop(); return { r, asleep: !!e.cloakSleep }; });
check('another cavern\'s master is not laid down to sleep', other.r === null && !other.asleep, other);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
