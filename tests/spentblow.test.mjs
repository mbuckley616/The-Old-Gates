// An exhausted blow reads *weak* in gold (the critic's s597, Session 799): a swing on too little stamina lands at 45% and rose
// as *1* with the foe's weakness word under it, which read as the blow's strength. A spent blow now carries no weakness word;
// a rested one still does. A real swing through the loop's own tick (as `dmgnums`), at a foe weak to blunt, in Dunmore's street.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
const kinds = await page.evaluate(() => { const k = i => { const r = dmgNumKind(i, { name: 'X' }, {}); return r.kind + '/' + r.word; };
  return { weak: k({ resistMult: 1.25 }), very: k({ resistMult: 1.5 }), spentWeak: k({ resistMult: 1.25, spent: true }), spentVery: k({ resistMult: 1.5, spent: true }),
    spentCrit: k({ resistMult: 1.25, spent: true, crit: true }), spentRes: k({ resistMult: .5, spent: true }) }; });
check('the kinds: weakness words only on a rested blow; a spent blow on a staggered foe is still critical, a resisted one still resisted',
  kinds.weak === 'weak/weak' && kinds.very === 'weak/very weak' && kinds.spentWeak === '/' && kinds.spentVery === '/' && kinds.spentCrit === 'crit/staggered' && kinds.spentRes === 'res/resisted', kinds);
const r = await page.evaluate(() => {
  const raf = window.requestAnimationFrame, rr = REN.render;
  const drive = (step, max) => { window.requestAnimationFrame = () => 0; REN.render = () => {}; let t = performance.now();
    try { for (let n = 0; n < max; n++) { if (step()) break; t += 1000 / 60; loop(t); } } finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; } };
  forceTime(12); PHP = maxHP; dead = false; PPOST.stagUntil = 0; thirdPerson = false;
  EQ.weapon = { name: 'Wooden GreatClub', slot: 'weapon', weaponShape: 'club', wType: 'blunt', weight: 4, atk: [6, 8] }; buildViewmodel();
  const t = WORLD.siteAnywhere('dunmore'); let S = null;
  const clear = (x, z) => !WORLD.solidAt(x, z) && WORLD.worldH(x, z) > 0;
  for (let rad = 4; rad < 60 && !S; rad += 1) for (let a = 0; a < 32 && !S; a++) { const x = t.x + Math.cos(a / 32 * Math.PI * 2) * rad, z = t.z + Math.sin(a / 32 * Math.PI * 2) * rad; let ok = true;
    for (let k = 0; k < 16 && ok; k++) for (const d of [1, 2, 3]) if (!clear(x + Math.cos(k / 16 * Math.PI * 2) * d, z + Math.sin(k / 16 * Math.PI * 2) * d)) { ok = false; break; } if (ok) S = { x, z }; }
  if (!S) return { noSpot: true };
  px = S.x; pz = S.z + 1.3;
  const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], S.x, S.z, 'Bandit', null)); e.alert = true; ZONES.world.enemies.push(e); e.hp = e.maxHp = 1000; e.def = 0;
  e.resist = Object.assign({}, e.resist || {}, { blunt: 1.25 });
  const out = { type: weaponDamageType(EQ.weapon) };
  const swing = st => { const keep = () => { PHP = maxHP; dead = false; PPOST.stagUntil = 0; stamina = st; e.telegraphT = 0; };
    const face = () => { yaw = Math.atan2(-(e.x - px), -(e.z - pz)); pitch = -.05; };
    DMG_NUMS.length = 0; document.getElementById('dmgnums').textContent = ''; const hp0 = e.hp;
    keep(); face(); atkCd = 0; attack(false); let n = 0; drive(() => { keep(); face(); return ++n > 3 && (!_pendingStrike || _pendingStrike.fired); }, 120);
    const els = [...document.querySelectorAll('#dmgnums .dn')];
    return { took: hp0 - e.hp, spent: _exhaustedStrike, nums: els.map(el => ({ cls: el.className, n: el.firstChild ? el.firstChild.textContent : '', word: (el.querySelector('.sm') || {}).textContent || '' })) }; };
  out.rested = swing(maxStamina); out.tired = swing(0);
  return out;
});
check('a rested blow at a foe weak to blunt rises gold with *weak* under it', r.type === 'blunt' && r.rested && !r.rested.spent && r.rested.took > 0
  && r.rested.nums.length >= 1 && /weak/.test(r.rested.nums[0].cls) && r.rested.nums[0].word === 'weak', r.rested);
check('a spent blow lands smaller and rises plain, with no weakness word', r.tired && r.tired.spent && r.tired.took > 0 && r.tired.took < r.rested.took
  && r.tired.nums.length >= 1 && !/weak/.test(r.tired.nums[0].cls) && r.tired.nums[0].word === '' && r.tired.nums[0].n === String(r.tired.took), r.tired);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
