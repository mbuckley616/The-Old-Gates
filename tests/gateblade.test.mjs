// The Gate-Blade (Session 779; Michael's B on DECISION #175, the Stone's row of docs/design/unique-artifacts.md): taken, it
// is a tier-6 blade of 14 weight, unique; while it is in your hand sprinting costs a quarter more stamina. The sprint is
// driven through the loop at fixed 1/60 with Shift and W held, read over its steady second half-second (the first frames
// before the sprint takes hold add a constant), once with an Adamant Longsword of the same tier and once
// with the Gate-Blade.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._drive = (max, keys) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0; for (const k of keys) K[k] = true;
  try { for (; n < max; n++) { PHP = maxHP; dead = false; t += 1000 / 60; loop(t); } }
  finally { for (const k of keys) K[k] = false; window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });

const r = await page.evaluate(() => {
  delete worldState.artifacts; const keepW = EQ.weapon; const keepA = { ...ATTRS };
  ATTRS.might = 30; artifactTry('gate_blade'); const i = BAG.findIndex(it => it.artifact === 'gate_blade'); const blade = BAG[i];
  const plain = makeItem(6, WEAPON_TYPES.find(w => w.type === 'Longsword'));
  const info = { name: blade.name, tier: blade.tier, atk: blade.atk, plainAtk: plain.atk, weight: blade.weight, plainWeight: plain.weight, unique: blade.unique, shape: blade.weaponShape };
  const run = (w) => { EQ.weapon = w; stamina = effMaxStamina(); staminaCD = 0; const x0 = px, z0 = pz; window._drive(30, ['ShiftLeft', 'KeyW']); const s0 = stamina; window._drive(30, ['ShiftLeft', 'KeyW']); const used = (s0 - stamina) * 2; px = x0; pz = z0; return +used.toFixed(2); };
  const heavy = { ...plain, weight: 14 }; const plainUse = run(plain), heavyUse = run(heavy), bladeUse = run(blade), drawn = (EQ.weapon = blade, gateBladeDrawn()), sheathed = (EQ.weapon = plain, gateBladeDrawn());
  EQ.weapon = keepW; BAG.splice(BAG.indexOf(blade), 1); delete worldState.artifacts; Object.assign(ATTRS, keepA);
  const D = +(14 * _buffMult('staminaCost', 1) * _finesseSprint()).toFixed(2);
  return { info, plainUse, heavyUse, bladeUse, drawn, sheathed, D };
});
console.log(JSON.stringify(r));
check(`taken, the Gate-Blade is a tier-6 longsword (${r.info.atk} as an Adamant Longsword's ${r.info.plainAtk}), 14 weight, unique`, r.info.name === 'The Gate-Blade' && r.info.tier === 6 && r.info.atk[0] === r.info.plainAtk[0] && r.info.atk[1] === r.info.plainAtk[1] && r.info.weight === 14 && r.info.unique && r.info.shape === 'longsword', r.info);
check(`a second's steady sprint costs ${r.heavyUse} stamina net of regen with an Adamant Longsword of the same 14 weight and ${r.bladeUse} with the Gate-Blade: ${(r.bladeUse - r.heavyUse).toFixed(2)} more, a quarter of the sprint's drain of ${r.D}`, r.heavyUse > 5 && Math.abs((r.bladeUse - r.heavyUse) / (.25 * r.D) - 1) < .1, r); /* the loop's own step runs a few per cent over the nominal 1/60, the same on both runs */
check('it counts only while it is in your hand', r.drawn === true && r.sheathed === false, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
