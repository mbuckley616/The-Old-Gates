// Magic B's forms (magic-build.md, "The five forms"; the sheet's `wordforms`). Session 1601: the Held form. F held on a held entry
// pours the word into a cone 4 m from your body (hull to hull) and 60° about your facing, ×0.25 of its power every 0.25 s of the play
// clock, for ×0.5 of its cost a second (Caor at Tine 50: 15), at half your walk; it ends when F comes up or the mana for a tick is not
// there. Driven by the play clock alone, in one synchronous evaluate, so the page's own loop never runs between the ticks.
// Session 1602: the riders on what a bolt or a tick strikes (magic-build.md, "Joining and riders"): Caor burns 3 a second for 4 s,
// Sioc slows 30% for 3 s, Séideán pushes 1.5 m and 10 posture (a held tick ×0.25 of both), Fréamh roots 0.8 s, Solas lights 10 s,
// Leigheas mends 25% of the blow; two schools add 10% wild until both reach 25.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await enterDungeon(page, { theme: 'ruins', size: 'small', seed: 7 });

const r = await page.evaluate(() => {
  const out = {}, fr = foeRand;
  knownWords = { caor: 2, cloch_ghear: 2 }; SKILLS.tine = { lv: 50, p: 0 }; currentFloor = 1;
  const foes = ENEMIES.filter(e => !e.dead && e.floor === 1);
  for (const e of ENEMIES) if (!foes.includes(e)) { e.dead = true; }
  const e = foes[0]; if (!e) return { none: true };
  for (const o of foes) if (o !== e) o.dead = true;
  e.hp = e.maxHp = 1e5; e.def = 0; e.resist = null; e.dormant = false; e.alert = true;
  const R = HULL_YOU + 4 + hullOf(e);
  // stand you and set the foe d metres out, a degrees off your facing (-sin yaw, -cos yaw)
  const put = (d, a) => { yaw = 0; const t = a * Math.PI / 180; e.x = px - Math.sin(t) * d; e.z = pz - Math.cos(t) * d; };
  const run = (s) => { let n = 0; for (; n < Math.round(s * 60) - 1; n++) { playClockS += 1 / 60; heldTick(1 / 60); } };
  const start = () => { for (const k in K) K[k] = false; K['KeyF'] = true; castT = 0; _castFreeAt = 0; _castReleaseAt = 0; spCd = 0; PPOST.stagUntil = 0; ROLL = null;
    let said = ''; const sm = showMsg; showMsg = t => { said += ' ' + t; }; try { castSpell(); } finally { showMsg = sm; } return said.trim(); };
  // the form is the Warlock's: refused without it
  formsGranted.length = 0; out.rank = mageRank();
  out.unheld = bookMake('held', 'caor').say || 'made';
  formsGranted.push('held'); const mk = bookMake('held', 'caor'); bookSelect(mk.i);
  out.notLive = bookMake('held', 'cloch_ghear').say || 'made';
  foeRand = () => 0;
  try {
    // one Sent bolt's blow on this foe, against which a second held is measured, bare and in armour
    out.bolt = applySpellDamage(e, SPELLS.find(s => s.id === 'caor'), 2).dmg;
    out.tick = applySpellDamage(e, SPELLS.find(s => s.id === 'caor'), 2, { power: FORMS.held.power }).dmg;
    e.def = 8; out.boltArm = applySpellDamage(e, SPELLS.find(s => s.id === 'caor'), 2).dmg; out.tickArm = applySpellDamage(e, SPELLS.find(s => s.id === 'caor'), 2, { power: FORMS.held.power }).dmg; e.def = 0;
    // a second held at 4 m hull to hull, dead ahead: four ticks, 15 mana, the walk halved
    put(R - .05, 0); mana = 1000; const hp0 = e.hp; out.said = start(); out.on = heldOn(); out.walk = commitMoveMult();
    run(1); out.sec = { ticks: HELD && HELD.ticks, mana: +(1000 - mana).toFixed(2), dealt: hp0 - e.hp };
    K['KeyF'] = false; heldTick(0); out.up = { on: heldOn(), cd: +spCd.toFixed(2), rec: castRecovering() }; _castFreeAt = 0; out.walkAfter = commitMoveMult();
    // the cone's edges: 0.1 m past the reach, and 29° and 31° off the facing
    const hit = (d, a) => { put(d, a); const h0 = e.hp; mana = 1000; start(); const ok = heldOn(); K['KeyF'] = false; heldTick(0); return ok && e.hp < h0; };
    out.edge = { in: hit(R - .05, 0), out: hit(R + .1, 0), a29: hit(3, 29), a31: hit(3, 31), behind: hit(2, 180) };
    // short of mana: the first tick (3.75) is paid, the second is not there and the hold ends
    put(2, 0); mana = 5; out.dry = { said: start(), on1: heldOn() }; run(.5); out.dry.on2 = heldOn(); out.dry.mana = +mana.toFixed(2);
    mana = 3; out.dry.refused = start(); out.dry.on3 = heldOn();
  } finally { foeRand = fr; if (heldOn()) { K['KeyF'] = false; heldTick(0); } }
  out.R = +R.toFixed(2);
  return out;
});
console.log(JSON.stringify(r));
check('a foe on floor one to pour it on', !r.none, r);
check(`the Held form is not a Novice's ("${r.unheld}"); granted, Cloch Ghéar has no held shape ("${r.notLive}")`, /not yet yours/.test(r.unheld) && /cannot shape/.test(r.notLive), r);
check(`a tick is ×0.25 of a bolt (${r.tick} of ${r.bolt}), the armour taken ×0.25 too (${r.tickArm} of ${r.boltArm})`, Math.abs(r.tick * 4 - r.bolt) <= 2 && Math.abs(r.tickArm * 4 - r.boltArm) <= 2, r);
check(`F held pours it (${r.said}): four ticks in a second (${r.sec && r.sec.ticks}), ${r.sec && r.sec.dealt} dealt`, r.on && r.sec.ticks === 4 && r.sec.dealt === r.tick * 4, r);
check(`a second of Caor held at Tine 50 takes 15 mana (${r.sec && r.sec.mana}), the sheet's ×0.5 a second`, r.sec && r.sec.mana === 15, r);
check(`you walk at ×${r.walk} while it is held, ×${r.walkAfter} after`, r.walk === .5 && r.walkAfter === 1, r);
check(`F up ends it, with the word's cooldown (${r.up && r.up.cd} s) and the Cast row's recovery`, r.up && !r.up.on && r.up.cd > 1 && r.up.rec, r);
check(`the cone reaches ${r.R} m centre to centre (4 m from your edge) and not 0.1 m past; 29° off your facing and not 31°, nor behind`, r.edge.in && !r.edge.out && r.edge.a29 && !r.edge.a31 && !r.edge.behind, r.edge);
check(`with mana 5 the first tick goes and the hold ends at the second (${r.dry.mana} left); with 3 it is refused ("${r.dry.refused}")`, r.dry.on1 && !r.dry.on2 && r.dry.mana === 1.25 && !r.dry.on3 && /Not enough mana/.test(r.dry.refused), r.dry);

// S1602 — the riders, each on the same foe by the play clock, then a held Caor with Sioc's rider, then a Sent bolt carrying one
const q = await page.evaluate(() => {
  const out = {}; const e = ENEMIES.find(x => x.floor === 1 && x.mesh); if (!e) return { none: true };
  e.dead = false; e.hp = e.maxHp = 1e5; e.def = 0; e.resist = null; e.alert = true; e._burn = null; e._litUntil = 0;
  const run = (sec) => { for (let n = 0; n < Math.round(sec * 60); n++) { playClockS += 1 / 60; riderTick(); } };
  // the join: both words at Comprehension
  knownWords = { caor: 2, sioc: 1, sideen: 2, cloch_ghear: 2 }; formsGranted.push('held');
  out.lowTier = bookMake('held', 'caor', 'sioc').say || 'made'; knownWords.sioc = 2;
  out.noRider = bookMake('held', 'caor', 'cloch_ghear').say || 'made';
  // burns: four blows of 3, one a second, past the armour; a second hit inside the burn refreshes it, never doubles it
  e.def = 50; let h0 = e.hp; riderHit(e, 'caor', 10); run(1.5); riderHit(e, 'caor', 10); run(5); out.burn = { dealt: h0 - e.hp, left: !!e._burn, ridden: RIDDEN.has(e) }; e.def = 0;
  // slows and holds: the chase's multiplier
  riderHit(e, 'sioc', 10); out.slow = [foeSlowMult(e)]; run(3.05); out.slow.push(foeSlowMult(e));
  riderHit(e, 'freamh', 10); out.root = [foeSlowMult(e), chaseSpeed(e)]; run(.85); out.root.push(foeSlowMult(e));
  // pushes: 1.5 m straight back, 10 posture; a held tick's ×0.25 of each
  // the way with 4 m of open floor from where you stand, and your facing along it
  initPosture(e); e.maxPosture = e.posture = 1000; unstagger(e);
  let ux = 0, uz = -1, clear = false;
  for (let a = 0; a < 16 && !clear; a++) { const t = a * Math.PI / 8; ux = -Math.sin(t); uz = -Math.cos(t); clear = true;
    for (let s2 = .2; s2 <= 4.2; s2 += .1) if (riderFoeSolid(px + ux * s2, pz + uz * s2, true)) { clear = false; break; } if (clear) yaw = t; }
  const dist = () => +Math.hypot(e.x - px, e.z - pz).toFixed(3);
  e.x = px + ux * 2; e.z = pz + uz * 2;
  let k = riderHit(e, 'sideen', 10); out.push = { d: dist(), post: 1000 - e.posture, clear, moved: k.knock };
  e.posture = 1000; e.x = px + ux * 2; e.z = pz + uz * 2; riderHit(e, 'sideen', 3, { power: .25 }); out.pushTick = { d: dist(), post: 1000 - e.posture };
  // and into a wall it stops: walk the foe back until the next 0.1 m is rock, then push
  e.x = px + ux; e.z = pz + uz; for (let i = 0; i < 4000 && !riderFoeSolid(e.x + ux * .1, e.z + uz * .1, true); i++) { e.x += ux * .1; e.z += uz * .1; }
  const dw = dist(); riderHit(e, 'sideen', 10); out.wall = { moved: +(dist() - dw).toFixed(3) };
  // lights: the glow on its mesh for 10 s
  riderHit(e, 'solas_gheal', 10); out.lit = [foeLit(e), !!e.mesh.getObjectByName('rider-lit')]; run(10.05); out.lit.push(foeLit(e), !!e.mesh.getObjectByName('rider-lit'));
  // mends: 25% of the blow, fractions carried
  PHP = 50; _mendCarry = 0; riderHit(e, 'leigheas', 20); out.mend = [PHP]; riderHit(e, 'leigheas', 2); riderHit(e, 'leigheas', 2); out.mend.push(PHP);
  // a held Caor with Sioc's rider: a second of it slows the foe, and costs (30 + 20) × 1.25 × 0.5 at the schools' 50
  SKILLS.tine = { lv: 50, p: 0 }; SKILLS.uisce = { lv: 50, p: 0 }; e.x = px + ux * 2; e.z = pz + uz * 2; e._riderSlowUntil = 0;
  const mk = bookMake('held', 'caor', 'sioc'); bookSelect(mk.i); out.cost = wordCost('caor', 'held', 'sioc');
  for (const k2 in K) K[k2] = false; K['KeyF'] = true; castT = 0; _castFreeAt = 0; _castReleaseAt = 0; spCd = 0; PPOST.stagUntil = 0; ROLL = null; mana = 1000;
  const fr = foeRand; foeRand = () => 0;
  try { castSpell(); for (let n = 0; n < 59; n++) { playClockS += 1 / 60; heldTick(1 / 60); } out.heldSlow = foeSlowMult(e); out.heldTicks = HELD && HELD.ticks; }
  finally { foeRand = fr; K['KeyF'] = false; heldTick(0); }
  // two schools under 25: the 10% wild; both at 25 none; one school never
  SKILLS.tine.lv = 20; out.mixed = [riderMixedWild('caor', 'sioc')]; SKILLS.tine.lv = 25; SKILLS.uisce.lv = 25; out.mixed.push(riderMixedWild('caor', 'sioc'), riderMixedWild('caor', null));
  // a Sent Caor with Séideán's rider: its bolt carries the rider
  knownWords.sideen = 2; const ms = bookMake('sent', 'caor', 'sideen'); bookSelect(ms.i); out.sentMade = ms.i;
  for (const k2 in K) K[k2] = false; castT = 0; _castFreeAt = 0; _castReleaseAt = 0; spCd = 0; mana = 1000; castSpell();
  return out;
});
// the bolt is released at the Cast row's 0.35 s: find it, still it on the foe, and let the loop's own hit land it
const b = await page.waitForFunction(() => { const f = BALLS.find(x => x.userData && x.userData.rider === 'sideen'); if (!f) return false;
  f.userData.vx = f.userData.vy = f.userData.vz = 0; f.userData.life = 30; f.position.set(px - Math.sin(yaw) * 2, 1, pz - Math.cos(yaw) * 2);
  for (const e of ENEMIES) if (!e.dead && e.floor === 1 && e.mesh) { e.x = f.position.x + 3; e.z = f.position.z + 3; } return true; }, null, { timeout: 15000, polling: 'raf' }).then(() => true).catch(() => false);
const bolt = b ? await page.evaluate(async () => {
  const fb = BALLS.find(f => f.userData.rider === 'sideen'), e = ENEMIES.find(x => x.floor === 1 && x.mesh && !x.dead);
  fb.userData.vx = fb.userData.vy = fb.userData.vz = 0; fb.userData.life = 30; fb.position.y = 1;
  fb.position.x = px - Math.sin(yaw) * 2; fb.position.z = pz - Math.cos(yaw) * 2; e.x = fb.position.x; e.z = fb.position.z; e.posture = e.maxPosture = 1000; unstagger(e); const z0 = Math.hypot(e.x - px, e.z - pz), h0 = e.hp;
  for (let i = 0; i < 100 && BALLS.includes(fb); i++) await new Promise(r => setTimeout(r, 100));
  return { gone: !BALLS.includes(fb), hit: h0 - e.hp, pushed: +(Math.hypot(e.x - px, e.z - pz) - z0).toFixed(2), post: 1000 - e.posture };
}) : null;
console.log(JSON.stringify({ q, bolt }));
check(`a rider needs both words at Comprehension ("${q.lowTier}"), and Cloch Ghéar is no rider ("${q.noRider}")`, /won’t join/.test(q.lowTier) && /won’t join/.test(q.noRider), q);
check(`Caor burns: ${q.burn && q.burn.dealt} in armour 50 (a second hit at 1.5 s runs it to 5.5: five blows of 3, never doubled), then out`, q.burn && q.burn.dealt === 12 + 3 && !q.burn.left && !q.burn.ridden, q.burn);
check(`Sioc slows the chase to ×${q.slow && q.slow[0]} for 3 s, then ×${q.slow && q.slow[1]}`, q.slow && q.slow[0] === .7 && q.slow[1] === 1, q.slow);
check(`Fréamh roots: ×${q.root && q.root[0]} (a chase of ${q.root && q.root[1]}) for 0.8 s, then ×${q.root && q.root[2]}`, q.root && q.root[0] === 0 && q.root[1] === 0 && q.root[2] === 1, q.root);
check(`Séideán pushes ${q.push && q.push.d - 2} m back and takes ${q.push && q.push.post} posture; a held tick ${q.pushTick && +(q.pushTick.d - 2).toFixed(3)} m and ${q.pushTick && q.pushTick.post}`, q.push && q.push.clear && Math.abs(q.push.d - 3.5) < .01 && q.push.post === 10 && Math.abs(q.pushTick.d - 2.375) < .01 && q.pushTick.post === 2.5, q);
check(`a push stops at the wall (${q.wall && q.wall.moved} m)`, q.wall && q.wall.moved < .05, q.wall);
check(`Solas lights it for 10 s, its glow on the mesh, then out (${q.lit})`, q.lit && q.lit.join() === 'true,true,false,false', q.lit);
check(`Leigheas mends 25% of the blow: 50 → ${q.mend && q.mend[0]}, two blows of 2 → ${q.mend && q.mend[1]}`, q.mend && q.mend[0] === 55 && q.mend[1] === 56, q.mend);
check(`a held Caor with Sioc's rider costs ${q.cost} a second and slows what it pours on (×${q.heldSlow}, ${q.heldTicks} ticks)`, q.cost === 31 && q.heldSlow === .7 && q.heldTicks === 4, q);
check(`two schools under 25 roll the 10% wild (${q.mixed}); at 25 not; a lone word never`, q.mixed && q.mixed.join() === 'true,false,false', q.mixed);
check(`a Sent bolt carries Séideán's rider and its hit pushes (${bolt && bolt.pushed} m, ${bolt && bolt.post} posture)`, bolt && bolt.gone && bolt.hit > 0 && bolt.pushed > 1.4 && bolt.post === 10, bolt);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
