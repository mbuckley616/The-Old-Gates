// The Wolf-Mother's Cloak (Session 777; Michael's B on DECISION #175, the Beasts' row of docs/design/unique-artifacts.md):
// worn, wolves, bears and spiders leave you alone unless you strike first; a struck beast stays struck and its pack takes its
// part; a Bandit is not a beast. Its cost: its master lives, so the town nearest the lair loses 0.6 a day while the cloak is
// yours and the master alive. Time is the loop's own tick at fixed 1/60, the draw held off (as `targetof` does).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._drive = (max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { PHP = maxHP; dead = false; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });

// one trial: foes of `type` 7 units north of you, set on you (their sight hangs on which way they happen to face); `cloak` worn or not; `strike` the first after a second
const trial = (type, cloak, strike, n = 1, pre = true) => page.evaluate(({ type, cloak, strike, n, pre }) => {
  forceTime(12); PHP = maxHP; dead = false; delete worldState.artifacts;
  const keepBack = EQ.back; if (cloak) { takeArtifact('wolf_cloak'); const i = BAG.findIndex(it => it.artifact === 'wolf_cloak'); EQ.back = BAG.splice(i, 1)[0]; } else EQ.back = null;
  const x0 = px, z0 = pz; const F = [];
  for (let k = 0; k < n; k++) { const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], px + k * 1.5, pz - 7, type, null)); if (pre) e.alert = true; ZONES.world.enemies.push(e); F.push(e); }
  const d0 = Math.hypot(F[0].x - x0, F[0].z - z0);
  window._drive(60); const alert1 = F.map(e => !!e.alert);
  if (strike) { F[0].hp -= 1; F[0].alert = true; alertPack(F[0], 16); }
  window._drive(120); const alert2 = F.map(e => !!e.alert); const d1 = Math.hypot(F[0].x - x0, F[0].z - z0);
  const peace = F.map(e => beastAtPeace(e));
  for (const e of F) { e.dead = true; if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); ZONES.world.enemies.splice(ZONES.world.enemies.indexOf(e), 1); }
  EQ.back = keepBack; delete worldState.artifacts; px = x0; pz = z0;
  return { alert1, alert2, peace, d0: +d0.toFixed(2), d1: +d1.toFixed(2) };
}, { type, cloak, strike, n, pre });

const bare = await trial('Wolf', false, false);
const calm = await trial('Wolf', true, false);
const struck = await trial('Wolf', true, true, 2);
const bear = await trial('Cave Bear', true, false);
const spider = await trial('Spider', true, false);
const bandit = await trial('Bandit', true, false, 1, true);
console.log(JSON.stringify({ bare, calm, struck, bear, spider, bandit }));
check(`without the cloak a Wolf set on you at 7 units comes (${bare.d0} → ${bare.d1})`, bare.alert1[0] && bare.d1 < bare.d0 - 2, bare);
check(`wearing the Wolf-Mother's Cloak the same Wolf, set on you, lets you be for three seconds (alert ${calm.alert1[0]}, ${calm.alert2[0]}; ${calm.d0} → ${calm.d1})`, !calm.alert1[0] && !calm.alert2[0] && calm.d1 > 3, calm);
check('strike it and it comes, and its packmate with it; the struck one stays struck', !struck.alert1[0] && !struck.alert1[1] && struck.alert2[0] && struck.alert2[1] && struck.peace[0] === false, struck);
check('a Cave Bear and a Spider keep the same peace', !bear.alert1[0] && !bear.alert2[0] && !spider.alert1[0] && !spider.alert2[0], { bear, spider });
check(`a Bandit is no beast: on you, the cloak does not calm him (${bandit.d0} → ${bandit.d1})`, bandit.alert1[0] && bandit.alert2[0] && bandit.peace[0] === false && bandit.d1 < bandit.d0 - 2, bandit);

// the cost: the town nearest the lair loses 0.6 a day while the cloak is yours and its master alive
const cost = await page.evaluate(() => {
  const P = artifactPlaces().wolf_cloak, t = cloakTown(); const other = allSites().find(s => s.kind in BASE_P && s.id !== t.id);
  delete worldState.artifacts; const d0 = [cloakDrain(t), cloakDrain(other)];
  takeArtifact('wolf_cloak'); const d1 = [cloakDrain(t), cloakDrain(other)];
  /* S781: the master is the cavern's (worldState.masters by the lair's seed), not the beasts at the mouth */ worldState.lairs = worldState.lairs || {}; worldState.lairs[P.site] = 1; const dMouth = cloakDrain(t); delete worldState.lairs[P.site]; const M = worldState.masters || (worldState.masters = {}), sd = cloakSeed(); M[sd] = { dead: true }; const d2 = cloakDrain(t); delete M[sd];
  yieldArtifact('wolf_cloak', 'guild'); const d3 = cloakDrain(t);
  delete worldState.artifacts;
  return { lair: P.name, town: t.name, dist: Math.round(Math.hypot(t.x - P.x, t.z - P.z)), d0, d1, dMouth, d2, d3 };
});
console.log(JSON.stringify(cost));
check(`taken with ${cost.lair}'s master alive, ${cost.town} (${cost.dist} away) loses 0.6 a day, and no other town anything`, cost.d0[0] === 0 && cost.d1[0] === 0.6 && cost.d1[1] === 0, cost);
check('the drain stops when the cavern\'s master dies (not when only the beasts at the mouth do), and when the cloak is given up', cost.dMouth === 0.6 && cost.d2 === 0 && cost.d3 === 0, cost);

// a day of the towns' tick, the drain carried in the fraction (as occupation's half point is)
const day = await page.evaluate(() => {
  const t = cloakTown(); const st = TS(t); const had = SITES.includes(t); if (!had) SITES.push(t); const T0 = worldState.gameTimeAbsMinutes || 0;
  const run = (take) => { delete worldState.artifacts; if (take) takeArtifact('wolf_cloak'); st.p = 50; st.pf = 0; st.flags = {}; worldState.gameTimeAbsMinutes = T0;
    for (let k = 0; k < 10; k++) { worldState.gameTimeAbsMinutes += 1440; tickProsperity(); }
    const p = st.p + (st.pf || 0); delete worldState.artifacts; return +p.toFixed(2); };
  const out = { without: run(false), withCloak: run(true) }; if (!had) SITES.splice(SITES.indexOf(t), 1); worldState.gameTimeAbsMinutes = T0; return out;
});
console.log(JSON.stringify(day));
check('over ten days the cloak costs its town about six points more', Math.abs((day.without - day.withCloak) - 6) < 1.01, day);
// underground: the loop's dungeon pass keeps the same peace. A gate's foe is made a Wolf (its baseType), set on you, and
// the loop driven two seconds, once bare and once in the cloak
const under = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms));
  const seeds = []; for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) { const c = WORLD.getCell(i, j); for (const e of (c && c.doors) || []) if (e && e.seed != null && !e.lair) seeds.push(e.seed); }
  const e = WORLD.doorAnywhere(seeds[Math.floor(seeds.length / 3)]); const p = makePortalDef(e); const wp = (WORLD.dungeonPos || {})[e.seed]; if (wp) { p.x = wp.x; p.z = wp.z; px = wp.x; pz = wp.z + 3; } p.zone = 'world';
  goToDungeon(p); for (let k = 0; k < 40 && !(activeZoneId === 'dungeon' && ENEMIES.length); k++) await wait(500); await wait(1500);
  if (activeZoneId !== 'dungeon' || !ENEMIES.length) return { none: true, zone: activeZoneId };
  const f = ENEMIES.find(x => !x.dead && !x.isBoss); f.baseType = 'Wolf'; f.hp = f.maxHp;
  const go = (cloak) => { delete worldState.artifacts; const keep = EQ.back; if (cloak) { takeArtifact('wolf_cloak'); const i = BAG.findIndex(it => it.artifact === 'wolf_cloak'); EQ.back = BAG.splice(i, 1)[0]; } else EQ.back = null;
    px = f.x; pz = f.z + .6; f._struck = false; f.alert = true; window._drive(120); const a = !!f.alert; EQ.back = keep; delete worldState.artifacts; return a; };
  return { name: f.name, bare: go(false), cloak: go(true) }; });
console.log(JSON.stringify(under));
check(`underground, a gate's Wolf (${under.name}) set on you stays on you bare, and lets you be in the cloak`, !under.none && under.bare === true && under.cloak === false, under);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
