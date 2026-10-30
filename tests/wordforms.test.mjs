// Magic B's forms (magic-build.md, "The five forms"; the sheet's `wordforms`). Session 1598: the Held form. F held on a held entry
// pours the word into a cone 4 m from your body (hull to hull) and 60° about your facing, ×0.25 of its power every 0.25 s of the play
// clock, for ×0.5 of its cost a second (Caor at Tine 50: 15), at half your walk; it ends when F comes up or the mana for a tick is not
// there. Driven by the play clock alone, in one synchronous evaluate, so the page's own loop never runs between the ticks.
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
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
