// Magic B's forms (magic-build.md, "The five forms"; the sheet's `wordforms`). Session 1601: the Held form. F held on a held entry
// pours the word into a cone 4 m from your body (hull to hull) and 60° about your facing, ×0.25 of its power every 0.25 s of the play
// clock, for ×0.5 of its cost a second (Caor at Tine 50: 15), at half your walk; it ends when F comes up or the mana for a tick is not
// there. Driven by the play clock alone, in one synchronous evaluate, so the page's own loop never runs between the ticks.
// Session 1602: the riders on what a bolt or a tick strikes (magic-build.md, "Joining and riders"): Caor burns 3 a second for 4 s,
// Sioc slows 30% for 3 s, Séideán pushes 1.5 m and 10 posture (a held tick ×0.25 of both), Fréamh roots 0.8 s, Solas lights 10 s,
// Leigheas mends 25% of the blow; two schools add 10% wild until both reach 25.
// Session 1603: the Touched form on a foe: a 0.25 s wind-up, then the nearest foe within 1.6 m of your edge (hull to hull) and 30° of
// your facing takes ×1.5 the word (Caor 30, Tintreach 36) for ×0.6 its mana; Tintreach staggers, Reo holds 2 s.
// Session 1604: the riders on a laid thing: a hot pillar (3 a second to a foe touching it), Fréamh's root (the first foe across, 1 s,
// once), Leigheas's mend (2 a second while you stand at it), Séideán's throw (a pillar under you sends you up at Éan's 8.4 m/s), Solas's light.
// Session 1609: the cone dressed (the look builder's heldDress): three draws, under 1,500 triangles, and it answers no ray.
// Session 1606: Tintreach sent, a bolt of 24 that leaps to the nearest other foe within 5 m of the one struck, for half.
// Session 1612: Fréamh laid, a ring 3 m round on the ground that roots the first foe within it 2 s, once, and stands 10 s.
// Session 1611: Tonn sent, a wave 8 m down your aim (to the first wall), 1.6 m wide: 14 and 20 posture to each foe in it.
// Session 1616: Reo laid, a burst 4 m round that holds every foe within it 2 s (1.2 at Impression), once; its frost stands the hold's time.
// Session 1617: Loscadh laid, a ground fire 4 m across that burns each foe in it 6 a second (4 at Impression), past the armour, 10 s.
// Session 1618: Dul Thart sent, the step: you arrive 12 m down your aim, level, or short of the first wall by your body's 0.3.
// Session 1619: the schools' Steady voice (25: an Impression word goes wild 15%, was 30%) and Thrift (50: its words cost 15% less).
// Session 1621: each school's 75: Tine's burn 8 s, Uisce's rider slow 45%, Cloch's pillar 40 s, Scáth's step 18 m, Solas's mend +25%,
// Gaoth's updraft 3.7 m.
// Session 1610: Fréamh sent, a bolt that deals nothing and roots the foe it strikes 2 s (1.2 at Impression, 2.6 at Mastery).
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await enterDungeon(page, { theme: 'ruins', size: 'small', seed: 7 });
// the sheet's worked costs are before the schools' perks: Thrift (school 50) is held out until its own check below (Session 1619)
await page.evaluate(() => { for (const sc of ['tine', 'uisce', 'cloch', 'scath', 'solas', 'gaoth']) PERK_LIVE.delete(sc + ':50'); });

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
    { const m = HELD && HELD.mesh; let draws = 0, tris = 0; if (m) m.traverse(o => { if (o.isMesh || o.isPoints) draws++; if (o.isMesh) tris += o.geometry.index.count / 3; });
      out.dress = m && { name: m.name, inScene: m.parent === scene, draws, tris, rayless: m.children.every(o => { const hits = []; o.raycast(new THREE.Raycaster(), hits); return !hits.length; }) }; }
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
check(`the cone is dressed: ${r.dress && r.dress.draws} draws, ${r.dress && r.dress.tris} triangles, and it answers no ray`, r.dress && r.dress.name === 'held-caor' && r.dress.inScene && r.dress.draws === 3 && r.dress.tris < 1500 && r.dress.rayless, r.dress);
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
  // the bolt is stilled the moment it is pushed into BALLS, so a slow frame cannot fly it into a wall before the test sees it
  const _push = BALLS.push; BALLS.push = function (...a) { for (const f of a) if (f.userData && f.userData.rider === 'sideen') {
    f.userData.vx = f.userData.vy = f.userData.vz = 0; f.userData.life = 30; f.position.set(px - Math.sin(yaw) * 2, 1, pz - Math.cos(yaw) * 2);
    for (const o of ENEMIES) if (!o.dead && o.floor === 1 && o.mesh) { o.x = f.position.x + 3; o.z = f.position.z + 3; } BALLS.push = _push; }
    return _push.apply(this, a); };
  for (const k2 in K) K[k2] = false; castT = 0; _castFreeAt = 0; _castReleaseAt = 0; spCd = 0; mana = 1000; castSpell();
  return out;
});
// the bolt is released at the Cast row's 0.35 s: find it, still it on the foe, and let the loop's own hit land it
const b = await page.waitForFunction(() => BALLS.some(x => x.userData && x.userData.rider === 'sideen'), null, { timeout: 15000, polling: 100 }).then(() => true).catch(() => false);
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

// S1603 — the Touched form: each touch cast by castSpell and landed by the loop's own tickSpellFx after its wind-up
const touch = async (word, rider, d, a, def) => {
  await page.evaluate(([word, rider, d, a, def]) => {
    const e = ENEMIES.find(x => x.floor === 1 && x.mesh && !x.dead) || ENEMIES.find(x => x.floor === 1 && x.mesh);
    for (const o of ENEMIES) if (o !== e) o.dead = true;
    e.dead = false; e.hp = e.maxHp = 1e5; e.def = def || 0; e.resist = null; e.alert = true; e.posture = e.maxPosture = 1000; unstagger(e);
    e._riderSlowUntil = 0; e.spd = 0; const t = a * Math.PI / 180; e.x = px - Math.sin(yaw + t) * d; e.z = pz - Math.cos(yaw + t) * d; if (e.mesh) { e.mesh.position.x = e.x; e.mesh.position.z = e.z; }
    window._tq = { e, h0: e.hp, said: '' };
    for (const k2 in K) K[k2] = false; castT = 0; _castFreeAt = 0; _castReleaseAt = 0; spCd = 0; PPOST.stagUntil = 0; ROLL = null; mana = 1000; TOUCH_PEND = null;
    if (!formsGranted.includes('touched')) formsGranted.push('touched');
    const mk = bookMake('touched', word, rider); window._tq.made = mk.say || mk.i; if (mk.i != null) bookSelect(mk.i);
    window._fr = foeRand; foeRand = () => 0; window._sm = showMsg; showMsg = (t2) => { window._tq.said += ' ' + t2; };
    castSpell();
    window._tq.paid = 1000 - mana; window._tq.pend = !!TOUCH_PEND; window._tq.t0 = performance.now();
  }, [word, rider, d, a, def]);
  await page.waitForFunction(() => !TOUCH_PEND, null, { timeout: 15000, polling: 100 }).catch(() => {});
  return page.evaluate(() => { const q = window._tq, e = q.e; foeRand = window._fr; showMsg = window._sm;
    return { made: q.made, paid: q.paid, pend: q.pend, ms: Math.round(performance.now() - q.t0), dealt: q.h0 - e.hp, stag: (staggered.find(s => s.e === e) || {}).t || 0,
      slow: foeSlowMult(e), said: q.said.trim(), left: !!TOUCH_PEND }; });
};
await page.evaluate(() => { knownWords = { caor: 2, tintreach: 2, reo: 2, sioc: 2, cloch_ghear: 2 }; SKILLS.tine = { lv: 50, p: 0 }; SKILLS.uisce = { lv: 50, p: 0 };
  formsGranted.length = 0; window._tu = bookMake('touched', 'caor').say; window._tc = bookMake('touched', 'cloch_ghear').say; });
const tUn = await page.evaluate(() => [window._tu, window._tc]);
const tCaor = await touch('caor', null, 1.0, 0), tBolt = await page.evaluate(() => { const f = foeRand; foeRand = () => 0; try { return applySpellDamage(window._tq.e, SPELLS.find(s => s.id === 'caor'), 2).dmg; } finally { foeRand = f; } });
const tR = await page.evaluate(() => +(HULL_YOU + FORMS.touched.reach + hullOf(window._tq.e)).toFixed(3));
const tIn = await touch('caor', null, tR - .05, 0), tOut = await touch('caor', null, tR + .1, 0), tWide = await touch('caor', null, 1.2, 35);
const tTin = await touch('tintreach', null, 1.0, 0), tReo = await touch('reo', null, 1.0, 0), tRide = await touch('caor', 'sioc', 1.0, 0);
const tArm = await touch('caor', null, 1.0, 0, 8), tBoltArm = await page.evaluate(() => { const f = foeRand; foeRand = () => 0; try { return applySpellDamage(window._tq.e, SPELLS.find(s => s.id === 'caor'), 2).dmg; } finally { foeRand = f; } });
console.log(JSON.stringify({ tUn, tCaor, tBolt, tR, tIn, tOut, tWide, tTin, tReo, tRide, tArm, tBoltArm }));
check(`the Touched form is an Adept's ("${tUn[0]}"); Cloch Ghéar has no touch ("${tUn[1]}")`, /not yet yours/.test(tUn[0]) && /cannot shape/.test(tUn[1]), tUn);
check(`a touched Caor waits its wind-up (${tCaor.ms} ms), then lands ${tCaor.dealt}, ×1.5 a bolt's ${tBolt}, for ${tCaor.paid} mana (×0.6 of 30)`, tCaor.pend && tCaor.ms >= 240 && tCaor.dealt === Math.round(tBolt * 1.5) && tCaor.paid === 18 && !tCaor.left, tCaor);
check(`armour 8 is met ×1.5 too: ${tArm.dealt} against a bolt's ${tBoltArm}`, Math.abs(tArm.dealt - Math.round(tBolt * 1.5 - 12)) <= 1 && tBoltArm === tBolt - 8, { tArm, tBoltArm });
check(`it reaches ${tR} m centre to centre (1.6 m from your edge) and not 0.1 m past, nor 35° off your facing ("${tOut.said}")`, tIn.dealt > 0 && tOut.dealt === 0 && tWide.dealt === 0 && /Nothing within reach/.test(tOut.said), { tIn, tOut, tWide });
check(`Tintreach touched lands ${tTin.dealt} and staggers (${tTin.stag} s); Reo holds it ${tReo.stag} s with no blow`, tTin.dealt > 0 && tTin.stag >= 1.5 && tReo.stag === 2 && tReo.dealt === 0, { tTin, tReo });
check(`a rider rides the touch: Caor with Sioc slows it (×${tRide.slow})`, tRide.dealt > 0 && tRide.slow === .7, tRide);
// S1604 — the riders on a laid Cloch pillar, by the play clock
const lr = await page.evaluate(() => {
  const out = {}; knownWords = { cloch_ghear: 2, caor: 2, freamh: 2, leigheas: 2, sideen: 2, solas_gheal: 2 };
  const e = ENEMIES.find(x => x.floor === 1 && x.mesh); for (const o of ENEMIES) if (o !== e) o.dead = true;
  e.dead = false; e.hp = e.maxHp = 1e5; e.def = 50; e.resist = null; e.alert = true; e._rootUntil = 0; e.spd = 0; jumpY = 0; velY = 0; onGround = true;
  // a way with open floor from where you stand
  let ux = 0, uz = -1, ok = false;
  for (let a = 0; a < 16 && !ok; a++) { const t = a * Math.PI / 8; ux = -Math.sin(t); uz = -Math.cos(t); ok = true;
    for (let s2 = .2; s2 <= 4.2; s2 += .1) if (riderFoeSolid(px + ux * s2, pz + uz * s2, true)) { ok = false; break; } if (ok) yaw = t; }
  const cx = px + ux * 2.5, cz = pz + uz * 2.5, far = () => { e.x = px - ux * 6; e.z = pz - uz * 6; };
  const run = (sec) => { for (let n = 0; n < Math.round(sec * 60); n++) { playClockS += 1 / 60; laidRiderTick(); } };
  const lay = (rider, x, z) => { far(); laidEnd(); const r = layWord('cloch_ghear', rider, x == null ? cx : x, z == null ? cz : z, { cap: 1 }); return r; };
  const touchIt = () => { const d = LAID.r + hullOf(e) - .05; e.x = cx + ux * d; e.z = cz + uz * d; };
  out.open = ok;
  // hot: three seconds touching it, in armour 50
  let r = lay('caor'); out.hotLaid = r.ok || r.say; touchIt(); let h0 = e.hp; run(3.05); out.hot = h0 - e.hp; far(); h0 = e.hp; run(2); out.hotFar = h0 - e.hp;
  // the root: the first foe across, 1 s, and not again
  r = lay('freamh'); touchIt(); run(.05); out.root = [foeSlowMult(e)]; run(1.05); out.root.push(foeSlowMult(e)); run(.5); out.root.push(foeSlowMult(e));
  // the mend: 2 a second while you stand against it
  r = lay('leigheas'); PHP = 50; const ox = px, oz = pz; px = cx - ux * (LAID.r + .2); pz = cz - uz * (LAID.r + .2); run(3.05); out.mend = PHP; px = ox; pz = oz; PHP = 50; run(2); out.mendAway = PHP;
  // the light
  r = lay('solas_gheal'); const L8 = laidLight(); out.light = L8 && L8.r;
  // the throw: laid where you stand, it rises under you and sends you up at Éan's rise; without the rider it is refused there
  laidEnd(); const bare = layWord('cloch_ghear', null, px, pz, { cap: 1 }); out.bare = bare.why || 'laid';
  laidEnd(); far(); const th = layWord('cloch_ghear', 'sideen', px, pz, { cap: 1 }); out.thrown = { ok: th.ok, thrown: th.thrown, velY, jumpY: +jumpY.toFixed(2), top: LAID && +(LAID.top).toFixed(2), onGround };
  laidEnd(); jumpY = 0; velY = 0; onGround = true;
  return out;
});
console.log(JSON.stringify(lr));
check(`a hot pillar (${lr.hotLaid}): ${lr.hot} to a foe touching it in 3 s through armour 50, ${lr.hotFar} once it stands off`, lr.open && lr.hot === 9 && lr.hotFar === 0, lr);
check(`Fréamh's pillar roots the first foe across it 1 s (×${lr.root}) and not again`, lr.root && lr.root.join() === '0,1,1', lr.root);
check(`Leigheas's pillar mends you 2 a second at its side (50 → ${lr.mend}), nothing away (${lr.mendAway})`, lr.mend === 56 && lr.mendAway === 50, lr);
check(`Solas's pillar holds a light ${lr.light} m round`, lr.light === 8, lr);
check(`a bare pillar is refused on you (${lr.bare}); Séideán's rises under you and throws you at ${lr.thrown.velY} m/s from its top (${lr.thrown.jumpY} of ${lr.thrown.top})`, lr.bare === 'body' && lr.thrown.ok && lr.thrown.thrown && lr.thrown.velY === 8.4 && lr.thrown.jumpY === lr.thrown.top && !lr.thrown.onGround, lr.thrown);

// S1606 — Tintreach's bolt, landed by the loop on foe A, with foe B `gap` metres beyond it
const chain = async (gap) => {
  await page.evaluate((gap) => {
    const fs = ENEMIES.filter(x => x.floor === 1 && x.mesh).slice(0, 2); for (const o of ENEMIES) if (!fs.includes(o)) o.dead = true;
    knownWords = { tintreach: 2 }; SKILLS.tine = { lv: 50, p: 0 }; LAID && laidEnd();
    const mk = bookMake('sent', 'tintreach'); bookSelect(mk.i);
    for (const e of fs) { e.dead = false; e.hp = e.maxHp = 1e5; e.def = 0; e.resist = null; e.alert = false; e.spd = 0; unstagger(e); }
    window._ch = { fs, h: fs.map(e => e.hp) };
    window._fr = foeRand; foeRand = () => 0;
    const _push = BALLS.push; BALLS.push = function (...a) { for (const f of a) if (f.userData && f.userData.spell && f.userData.spell.id === 'tintreach') {
      f.userData.vx = f.userData.vy = f.userData.vz = 0; f.userData.life = 30; f.position.set(px - Math.sin(yaw) * 2, 1, pz - Math.cos(yaw) * 2);
      const [A, B] = fs; A.x = f.position.x; A.z = f.position.z; B.x = A.x - Math.cos(yaw) * gap; B.z = A.z + Math.sin(yaw) * gap; BALLS.push = _push; }
      return _push.apply(this, a); };
    for (const k2 in K) K[k2] = false; castT = 0; _castFreeAt = 0; _castReleaseAt = 0; spCd = 0; mana = 1000;
    const sm = showMsg; window._ch.said = ''; showMsg = t => { window._ch.said += ' ' + t; }; try { castSpell(); } finally { showMsg = sm; }
    window._ch.mk = mk; window._ch.act = activeSpellId;
  }, gap);
  await page.waitForFunction(() => window._ch.fs[0].hp < window._ch.h[0], null, { timeout: 15000, polling: 100 }).catch(() => {});
  return page.evaluate(() => { foeRand = window._fr; const { fs, h } = window._ch;
    return { said: window._ch.said, mk: window._ch.mk, act: window._ch.act, a: h[0] - fs[0].hp, b: h[1] - fs[1].hp, d: +Math.hypot(fs[0].x - fs[1].x, fs[0].z - fs[1].z).toFixed(2), two: fs.length === 2 }; });
};
const ch3 = await chain(3), ch55 = await chain(5.5);
console.log(JSON.stringify({ ch3, ch55 }));
check(`Tintreach's bolt lands ${ch3.a} on the first foe and leaps ${ch3.d} m for ${ch3.b}, half`, ch3.two && ch3.a >= 24 && Math.abs(ch3.b - ch3.a / 2) <= 1, ch3);
check(`at ${ch55.d} m (past 5) it does not leap (${ch55.b})`, ch55.a > 0 && ch55.b === 0, ch55);

// S1610 — Fréamh's bolt, landed by the loop on a foe 2 m ahead, at tier t
const rootBolt = async (t) => {
  await page.evaluate((t) => {
    const fs = ENEMIES.filter(x => x.floor === 1 && x.mesh).slice(0, 1); for (const o of ENEMIES) if (!fs.includes(o)) o.dead = true;
    knownWords = { freamh: t }; SKILLS.cloch = { lv: 50, p: 0 }; LAID && laidEnd(); spellBook.length = 0;
    const mk = bookMake('sent', 'freamh'); bookSelect(mk.i);
    const A = fs[0]; A.dead = false; A.hp = A.maxHp = 1e5; A.def = 0; A.resist = null; A.alert = false; A._rootUntil = 0; unstagger(A);
    window._rb = { A, h: A.hp, mk, cast: null };
    const _push = BALLS.push; BALLS.push = function (...a) { for (const f of a) if (f.userData && f.userData.spell && f.userData.spell.id === 'freamh') {
      f.userData.vx = f.userData.vy = f.userData.vz = 0; f.userData.life = 30; f.position.set(px - Math.sin(yaw) * 2, 1, pz - Math.cos(yaw) * 2);
      A.x = f.position.x; A.z = f.position.z; window._rb.cast = playClockS; BALLS.push = _push; }
      return _push.apply(this, a); };
    for (const k2 in K) K[k2] = false; castT = 0; _castFreeAt = 0; _castReleaseAt = 0; spCd = 0; mana = 1000;
    const sm = showMsg, cr = casterRand; showMsg = () => {}; casterRand = () => () => 1; /* no wild roll at Impression */
    try { castSpell(); } finally { showMsg = sm; casterRand = cr; }
  }, t);
  await page.waitForFunction(() => window._rb.A._rootUntil > 0, null, { timeout: 15000, polling: 100 }).catch(() => {});
  return page.evaluate(() => { const { A, h, mk } = window._rb;
    return { mk: mk.i != null, dealt: h - A.hp, rooted: foeRooted(A), slow: foeSlowMult(A), left: +(A._rootUntil - playClockS).toFixed(2), alert: A.alert }; });
};
const rb2 = await rootBolt(2), rb1 = await rootBolt(1), rb3 = await rootBolt(3);
console.log(JSON.stringify({ rb2, rb1, rb3 }));
check(`Fréamh's bolt deals ${rb2.dealt} and roots the foe (speed ×${rb2.slow}, ${rb2.left} s left of 2)`, rb2.mk && rb2.dealt === 0 && rb2.rooted && rb2.slow === 0 && rb2.left > 1.5 && rb2.left <= 2, rb2);
check(`Fréamh's root by tier: Impression ${rb1.left} s (of 1.2), Mastery ${rb3.left} s (of 2.6)`, rb1.rooted && rb1.left > .7 && rb1.left <= 1.2 && rb3.rooted && rb3.left > 2.1 && rb3.left <= 2.6, { rb1, rb3 });

// S1611 — Tonn's wave: three foes, one in the line at 2.5 m, one 2.5 m to its side, one past the wave's end
const tw = await page.evaluate(() => {
  const fs = ENEMIES.filter(x => x.floor === 1 && x.mesh).slice(0, 3); for (const o of ENEMIES) if (!fs.includes(o)) o.dead = true;
  if (fs.length < 3) return { few: fs.length };
  knownWords = { tonn: 2, sioc: 2 }; SKILLS.uisce = { lv: 50, p: 0 }; LAID && laidEnd(); spellBook.length = 0;
  for (const e of fs) { e.dead = false; e.hp = e.maxHp = 1e5; e.def = 0; e.resist = null; e.spd = 0; unstagger(e); initPosture(e); }
  const fr = foeRand; foeRand = () => 0; const sp = SPELLS.find(s => s.id === 'tonn');
  // the longest clear line from you, of 16 headings
  let best = null; for (let i = 0; i < 16; i++) { const t = i * Math.PI / 8, w = tonnWave(sp, 2, null, px, pz, Math.sin(t), Math.cos(t), currentFloor); if (!best || w.len > best.len) best = { len: w.len, t }; }
  const ux = Math.sin(best.t), uz = Math.cos(best.t), [A, B, C] = fs, h0 = fs.map(e => e.hp);
  A.x = px + ux * 2.5; A.z = pz + uz * 2.5; B.x = A.x - uz * 2.5; B.z = A.z + ux * 2.5; C.x = px + ux * (best.len + 2); C.z = pz + uz * (best.len + 2);
  const p0 = A.posture, w = tonnWave(sp, 2, null, px, pz, ux, uz, currentFloor);
  const out = { len: w.len, n: w.hit.length, a: h0[0] - A.hp, b: h0[1] - B.hp, c: h0[2] - C.hp, post: +(p0 - A.posture).toFixed(1) };
  // by F: the book's Sent Tonn, aimed down the same line
  A.hp = 1e5; const mk = bookMake('sent', 'tonn'); bookSelect(mk.i); yaw = Math.atan2(-ux, -uz);
  for (const k2 in K) K[k2] = false; castT = 0; _castFreeAt = 0; _castReleaseAt = 0; spCd = 0; mana = 1000;
  const sm = showMsg; showMsg = () => {}; try { castSpell(); } finally { showMsg = sm; }
  window._tw = { A, fr }; return out;
});
await page.waitForFunction(() => window._tw && window._tw.A.hp < 1e5, null, { timeout: 15000, polling: 100 }).catch(() => {});
tw.f = await page.evaluate(() => { foeRand = window._tw.fr; return 1e5 - window._tw.A.hp; });
console.log(JSON.stringify(tw));
check(`Tonn's wave runs ${tw.len} m (8 or to the wall) and strikes the foe in its line for ${tw.a} and ${tw.post} posture, not the one 2.5 m aside (${tw.b}) or past its end (${tw.c})`,
  tw.len > 3 && tw.len <= 8 && tw.n === 1 && tw.a === 14 && tw.post === 20 && tw.b === 0 && tw.c === 0, tw);
check(`cast by F, the wave lands ${tw.f} on the foe down your aim`, tw.f === 14, tw);

// S1612 — Fréamh's ring: a foe outside it, then inside it, then a second foe after the first
const sn = await page.evaluate(() => {
  const fs = ENEMIES.filter(x => x.floor === 1 && x.mesh).slice(0, 2); for (const o of ENEMIES) if (!fs.includes(o)) o.dead = true;
  if (fs.length < 2) return { few: fs.length };
  knownWords = { freamh: 2 }; LAID && laidEnd();
  const [A, B] = fs; for (const e of fs) { e.dead = false; e.hp = e.maxHp = 1e5; e._rootUntil = 0; e.x = px + 20; e.z = pz + 20; }
  const cx = px, cz = pz - 1, r = layWord('freamh', null, cx, cz), out = { ok: !!r.ok, kind: r.kind, solid: LAID && LAID.solid, R: LAID && LAID.r };
  A.x = cx + 3.2 + hullOf(A); A.z = cz; laidSnareTick(); out.out = foeRooted(A);
  A.x = cx + 2.5; laidSnareTick(); out.in = foeRooted(A); out.left = +(A._rootUntil - playClockS).toFixed(2);
  B.x = cx - 1; B.z = cz; laidSnareTick(); out.second = foeRooted(B);
  playClockS += 9.9; out.at99 = !!laidLive(); playClockS += .2; out.at101 = !!laidLive();
  return out;
});
console.log(JSON.stringify(sn));
check(`Fréamh's ring (${sn.kind}, ${sn.R} m, solid ${sn.solid}): no root outside it (${sn.out}), the foe inside rooted ${sn.left} s, and a second foe after it not (${sn.second})`,
  sn.ok && sn.kind === 'snare' && sn.solid === false && sn.R === 3 && sn.out === false && sn.in === true && sn.left === 2 && sn.second === false, sn);
check(`the ring stands 10 s (at 9.9 ${sn.at99}, at 10.1 ${sn.at101})`, sn.at99 === true && sn.at101 === false, sn);

// S1616 — Reo's burst: two foes inside 4 m (one at its edge, hull counted), one just outside; then one walked in after; then Impression
const nv = await page.evaluate(() => {
  const fs = ENEMIES.filter(x => x.floor === 1 && x.mesh).slice(0, 3); for (const o of ENEMIES) if (!fs.includes(o)) o.dead = true;
  if (fs.length < 3) return { few: fs.length };
  knownWords = { reo: 2, freamh: 2 }; SKILLS.uisce = { lv: 50, p: 0 }; SKILL_LAST.delete('uisce'); LAID && laidEnd(); staggered.length = 0;
  const [A, B, C] = fs; for (const e of fs) { e.dead = false; e.hp = e.maxHp = 1e5; e.x = px + 20; e.z = pz + 20; }
  const cx = px, cz = pz - 1, held = e => +((staggered.find(s => s.e === e) || {}).t || 0).toFixed(2);
  A.x = cx + 1; A.z = cz; B.x = cx - 3.9 - hullOf(B); B.z = cz; C.x = cx; C.z = cz + 4.1 + hullOf(C);
  const p0 = skillsReady().uisce.p, r = layWord('reo', null, cx, cz), out = { ok: !!r.ok, kind: r.kind, n: r.held, solid: LAID && LAID.solid, R: LAID && LAID.r,
    a: held(A), b: held(B), c: held(C), use: skillsReady().uisce.p > p0, hp: A.hp };
  C.z = cz; laidSnareTick(); laidRiderTick(); out.after = held(C);
  out.at19 = (playClockS += 1.9, !!laidLive()); out.at21 = (playClockS += .2, !!laidLive());
  knownWords.reo = 1; staggered.length = 0; layWord('reo', null, cx, cz); out.imp = held(A);
  // a second laid thing ends the first: Fréamh's ring, then Reo
  laidEnd(); staggered.length = 0; for (const e of fs) e.x = px + 20; layWord('freamh', null, cx, cz); out.pillar = LAID && LAID.kind; layWord('reo', null, cx, cz); out.then = LAID && LAID.kind;
  laidEnd(); staggered.length = 0;
  return out;
});
console.log(JSON.stringify(nv));
check(`Reo's burst (${nv.kind}, ${nv.R} m, solid ${nv.solid}) holds the ${nv.n} foes within it ${nv.a} and ${nv.b} s with no blow, not the one past its edge (${nv.c}), nor one walked in after (${nv.after}); a use of Uisce (${nv.use})`,
  nv.ok && nv.kind === 'nova' && nv.R === 4 && nv.solid === false && nv.n === 2 && nv.a === 2 && nv.b === 2 && nv.c === 0 && nv.after === 0 && nv.use && nv.hp === 1e5, nv);
check(`its frost stands the hold (at 1.9 ${nv.at19}, at 2.1 ${nv.at21}); at Impression it holds ${nv.imp} s; laid after a ${nv.pillar} it ends it (${nv.then})`,
  nv.at19 === true && nv.at21 === false && nv.imp === 1.2 && nv.pillar === 'snare' && nv.then === 'nova', nv);

// S1617 — Loscadh's fire: a foe inside (armour 50), one just outside; three seconds, then out of it; the fire's 10 s; Impression
const fi = await page.evaluate(() => {
  const fs = ENEMIES.filter(x => x.floor === 1 && x.mesh).slice(0, 2); for (const o of ENEMIES) if (!fs.includes(o)) o.dead = true;
  if (fs.length < 2) return { few: fs.length };
  knownWords = { loscadh: 2 }; SKILLS.tine = { lv: 50, p: 0 }; SKILL_LAST.delete('tine'); LAID && laidEnd();
  const [A, B] = fs; for (const e of fs) { e.dead = false; e.hp = e.maxHp = 1e5; e.def = 50; e.resist = null; e.x = px + 20; e.z = pz + 20; }
  const cx = px, cz = pz - 1; A.x = cx + 1.9 + hullOf(A) - .05; A.z = cz; B.x = cx - 2.1 - hullOf(B); B.z = cz;
  const run = (sec) => { for (let n = 0; n < Math.round(sec * 60); n++) { playClockS += 1 / 60; laidFireTick(); } };
  const p0 = skillsReady().tine.p, r = layWord('loscadh', null, cx, cz), out = { ok: !!r.ok, kind: r.kind, solid: LAID && LAID.solid, R: LAID && LAID.r, php: PHP };
  run(3.05); out.a = 1e5 - A.hp; out.b = 1e5 - B.hp; out.use = skillsReady().tine.p > p0; out.php2 = PHP;
  A.x = px + 20; let h = A.hp; run(2); out.left = h - A.hp;
  out.at99 = (run(4.8), !!laidLive()); out.at101 = (run(.2), !!laidLive());
  knownWords.loscadh = 1; A.x = cx; A.z = cz; h = A.hp; layWord('loscadh', null, cx, cz); run(1.02); out.imp = h - A.hp; laidEnd();
  return out;
});
console.log(JSON.stringify(fi));
check(`Loscadh's fire (${fi.kind}, ${fi.R} m round, solid ${fi.solid}) burns the foe in it ${fi.a} in 3 s through armour 50, not the one past its edge (${fi.b}) nor the foe stepped out (${fi.left}); you unburned (${fi.php} → ${fi.php2}); a use of Tine (${fi.use})`,
  fi.ok && fi.kind === 'fire' && fi.R === 2 && fi.solid === false && fi.a === 18 && fi.b === 0 && fi.left === 0 && fi.php === fi.php2 && fi.use, fi);
check(`the fire stands 10 s (at 9.9 ${fi.at99}, at 10.1 ${fi.at101}); at Impression it burns ${fi.imp} a second`, fi.at99 === true && fi.at101 === false && fi.imp === 4, fi);
// S1618 — Dul Thart's step: of 16 headings the longest and the shortest; the wall kept clear; the overshoot; then by F
const st = await page.evaluate(() => {
  for (const o of ENEMIES) o.dead = true; LAID && laidEnd(); spellBook.length = 0; knownWords = { dul_thart: 2 }; SKILLS.scath = { lv: 50, p: 0 }; SKILL_LAST.delete('scath');
  const x0 = px, z0 = pz, y0 = jumpY, back = () => { px = x0; pz = z0; jumpY = y0; velY = 0; onGround = true; };
  const L = []; for (let i = 0; i < 16; i++) { const t = i * Math.PI / 8; back(); const r = stepWord(x0, z0, Math.sin(t), Math.cos(t), 12);
    L.push({ t, len: r.len, wall: r.wall, moved: +Math.hypot(px - x0, pz - z0).toFixed(2) }); }
  back(); const lo = L.filter(l => l.wall).sort((a, b) => a.len - b.len)[0], hi = L.slice().sort((a, b) => b.len - a.len)[0];
  const out = { hi: hi.len, hiMoved: hi.moved, lo: lo && lo.len, walls: L.filter(l => l.wall).length };
  // at the shortest wall: clear by the body's 0.3 at the arrival, a solid within 0.5 past it
  if (lo) { const ux = Math.sin(lo.t), uz = Math.cos(lo.t), ax = x0 + ux * lo.len, az = z0 + uz * lo.len;
    out.clear = !laidSolidPt(ax + ux * .3, az + uz * .3, y0 + .5) && !laidSolidPt(ax, az, y0 + .5);
    let hit = false; for (let s2 = .3; s2 <= .55; s2 += .05) hit = hit || laidSolidPt(ax + ux * s2, az + uz * s2, y0 + .5) || laidSurf(ax + ux * s2, az + uz * s2, y0 + STEP_UP + .05) > y0 + STEP_UP; out.wallNear = hit; }
  // the overshoot down the longest heading
  out.over = stepWord(x0, z0, Math.sin(hi.t), Math.cos(hi.t), 12 * STEP_OVERSHOOT).len; back();
  // by F, the book's Sent Dul Thart down the longest heading
  const mk = bookMake('sent', 'dul_thart'); bookSelect(mk.i); yaw = Math.atan2(-Math.sin(hi.t), -Math.cos(hi.t));
  for (const k2 in K) K[k2] = false; castT = 0; _castFreeAt = 0; _castReleaseAt = 0; spCd = 0; mana = 1000;
  const fr = casterRand; casterRand = () => () => .99; /* no wild roll */
  window._st = { x0, z0, p0: skillsReady().scath.p, fr }; out.made = mk.i != null; out.active = activeSpellId;
  const sm = showMsg; showMsg = () => {}; try { castSpell(); } finally { showMsg = sm; }
  out.mana = 1000 - mana; return out;
});
await page.waitForFunction(() => window._st && Math.hypot(px - window._st.x0, pz - window._st.z0) > .5, null, { timeout: 15000, polling: 100 }).catch(() => {});
Object.assign(st, await page.evaluate(() => { casterRand = window._st.fr; return { f: +Math.hypot(px - window._st.x0, pz - window._st.z0).toFixed(2), use: skillsReady().scath.p > window._st.p0 }; }));
console.log(JSON.stringify(st));
check(`Dul Thart steps ${st.hi} m down the open heading (moved ${st.hiMoved}; 12 or to a wall), ${st.over} m overshot (×1.5, or to a wall)`,
  st.hi > 3 && st.hi <= 12 && Math.abs(st.hiMoved - st.hi) < .02 && st.over >= st.hi && st.over <= 18, st);
check(`at the nearest of ${st.walls} walls it stops at ${st.lo} m, the body's 0.3 clear (${st.clear}) and the wall within 0.55 (${st.wallNear})`, st.walls > 0 && st.clear && st.wallNear, st);
check(`cast by F (${st.active}, ${st.mana} mana) it carries you ${st.f} m down your aim; a use of Scáth (${st.use})`, st.made && Math.abs(st.f - st.hi) < .5 && st.mana > 0 && st.use, st);
// S1619 — Steady voice and Thrift: the wild chance and the cost at school 24, 25, 49 and 50; then 1,000 seeded Impression rolls
const pk = await page.evaluate(() => {
  for (const sc of ['tine', 'uisce', 'cloch', 'scath', 'solas', 'gaoth']) PERK_LIVE.add(sc + ':50');
  const at = lv => { SKILLS.tine = { lv, p: 0 }; return { wild: wordWildChance('caor'), cost: wordCost('caor', 'sent', null, { tier: 2, buff: 1 }), held: wordCost('caor', 'held', null, { tier: 2, buff: 1 }),
    other: (SKILLS.uisce = { lv: 10, p: 0 }, wordWildChance('sioc')) }; };
  const out = { a24: at(24), a25: at(25), a49: at(49), a50: at(50) };
  // the roll itself, as castSpell rolls it: 1,000 casters' first Impression casts of Caor at school 24, then 25
  const rate = lv => { SKILLS.tine = { lv, p: 0 }; let n = 0; for (let i = 0; i < 1000; i++) { let h = (i * 2654435761 + 97) >>> 0; h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; if (((h ^ (h >>> 16)) >>> 0) / 4294967296 < wordWildChance('caor')) n++; } return n / 1000; };
  out.r24 = rate(24); out.r25 = rate(25);
  return out;
});
console.log(JSON.stringify(pk));
check(`Steady voice: Caor goes wild ${pk.a24.wild} at Tine 24 and ${pk.a25.wild} at 25 (rolled ${pk.r24} and ${pk.r25} of 1,000); Sioc at Uisce 10 stays ${pk.a25.other}`,
  pk.a24.wild === .3 && pk.a25.wild === .15 && pk.a25.other === .3 && Math.abs(pk.r24 - .3) < .04 && Math.abs(pk.r25 - .15) < .04, pk);
check(`Thrift: a sent Caor costs ${pk.a49.cost} at Tine 49 and ${pk.a50.cost} at 50 (30 ×0.85, rounded), a held second ${pk.a50.held}`,
  pk.a49.cost === 30 && pk.a50.cost === 26 && pk.a50.held === 13, pk);
// S1621 — the six 75s, each at its school 74 and then 75
const p75 = await page.evaluate(() => {
  const e = ENEMIES.find(x => x.floor === 1 && x.mesh); e.dead = false; e.hp = e.maxHp = 1e5; LAID && laidEnd();
  const S = ['tine', 'uisce', 'cloch', 'scath', 'solas', 'gaoth'], lv = n => { for (const k of S) SKILLS[k] = { lv: n, p: 0 }; };
  const read = () => { e._burn = null; e._riderSlowUntil = 0; e._riderSlow = null; e._rootUntil = 0;
    const burn = riderHit(e, 'caor', 10).burn, slow = (riderHit(e, 'sioc', 10), +foeSlowMult(e).toFixed(2));
    _mendCarry = 0; PHP = 10; riderHit(e, 'leigheas', 40); const mend = PHP - 10;
    knownWords = { cloch_ghear: 2 }; let pillar = null;
    for (let a = 0; a < 16 && !pillar; a++) { const x = px + Math.sin(a * Math.PI / 8) * 3, z = pz + Math.cos(a * Math.PI / 8) * 3; const r = layWord('cloch_ghear', null, x, z, { cap: jumpY + 1 }); if (r.ok) pillar = +(LAID.until - playClockS).toFixed(1); }
    LAID && laidEnd();
    return { burn, slow, mend, pillar, up: +(laidUpdraftV() ** 2 / 36).toFixed(2), step: perk('scath', 75) ? SCHOOL75.step : WORD_BY.dul_thart.forms.sent.step }; };
  lv(74); const lo = read(); lv(75); const hi = read(); lv(50); PHP = maxHP;
  return { lo, hi };
});
console.log(JSON.stringify(p75));
check(`at 74 → 75: burn ${p75.lo.burn} → ${p75.hi.burn} s, the rider's slow ×${p75.lo.slow} → ×${p75.hi.slow}, a pillar ${p75.lo.pillar} → ${p75.hi.pillar} s, the step ${p75.lo.step} → ${p75.hi.step} m, a mend of 40's blow ${p75.lo.mend} → ${p75.hi.mend}, the updraft ${p75.lo.up} → ${p75.hi.up} m`,
  p75.lo.burn === 4 && p75.hi.burn === 8 && p75.lo.slow === .7 && p75.hi.slow === .55 && p75.lo.pillar === 20 && p75.hi.pillar === 40 &&
  p75.lo.step === 12 && p75.hi.step === 18 && p75.lo.mend === 10 && p75.hi.mend === 12 && p75.lo.up === 2.2 && p75.hi.up === 3.7, p75);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
