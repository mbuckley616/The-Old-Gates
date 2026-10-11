// The challenge (Session 684; Michael's B on DECISION #208): five steps, Novice to Master, that change damage only. Your blows
// ×2, 1.5, 1, .75, .5 and the foes' ×.5, .75, 1, 1.5, 2; Adept is the game as it was. The step is the world's
// (`worldState.challenge`, in the world row), set through one named action, `setChallenge`. A trap is not a foe.
// Measured through the game's own damage functions: a sword's 22 on a foe, a Fire Bolt, a Bandit's blow through
// `executeStrike`, a spike trap's `_warded`, and the save's two rows.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const r = await page.evaluate(() => {
  const out = { steps: [] }; FINISHER_SAFE_UNTIL = 0; blocking = false; ACTIVE_BUFFS.length = 0;
  const foe = (type) => { const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * 1.2, pz + fwdZ * 1.2, type, null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.locked = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0; e.def = 0; e.resist = {}; return e; };
  const taken = (e, raw) => { PHP = maxHP; stamina = 100; PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0; blocking = false; lastBlockAttemptT = -1e9; lastBlockAttemptG = -1e9;
    executeStrike(e, raw, (performance.now() / 1000 + 100) * 1000); return maxHP - PHP; };
  out.default = { step: challengeStep(), name: CHALLENGE_STEPS[challengeStep()], key: 'challenge' in worldState };
  const fire = SPELLS.find(s => s.school === 'fire') || SPELLS[0];
  // the dice held still (a lucky crit, a backstab, a spell's spread), so each step measures the same blow
  const pin = { fc: _fortuneCrit, bs: applyBackstab, fr: foeRand }; _fortuneCrit = () => 1; applyBackstab = () => 1; foeRand = () => .5;
  for (let n = 0; n <= 4; n++) {
    const name = setChallenge(n);
    // the same foe, made fresh for each step so its own stream gives the same rolls
    const melee = applyMeleeDamage(foe('Skeleton'), 22).dmg;
    const spell = applySpellDamage(foe('Skeleton'), fire, 1).dmg;
    const blow = taken(foe('Bandit'), 20);
    const trap = _warded(20, TRAP_SRC), plain = _warded(20);
    out.steps.push({ n, name, step: challengeStep(), melee, spell, blow, trap, plain, key: worldState.challenge });
  }
  _fortuneCrit = pin.fc; applyBackstab = pin.bs; foeRand = pin.fr;
  // the save: the world row carries the step, the character row does not; a save without it is Adept
  setChallenge(3);
  const d = JSON.parse(ssStringify(_buildSavePayload())); const rows = ssSplitPayload(d);
  out.rows = { world: rows.w.wS && rows.w.wS.challenge, char: rows.c.wS ? rows.c.wS.challenge : undefined };
  setChallenge(2); _applyLoadData(JSON.parse(JSON.stringify(ssJoinPayload(rows.c, rows.w)))); out.loaded = challengeStep();
  const d2 = JSON.parse(JSON.stringify(d)); delete d2.wS.challenge; _applyLoadData(d2); out.loadedOld = { step: challengeStep(), key: 'challenge' in worldState };
  out.bad = [setChallenge(7), setChallenge(-1), setChallenge('x'), challengeStep()];
  setChallenge(2); PHP = maxHP;
  return out;
});
stop();
console.log(JSON.stringify(r));
const S = r.steps, A = S[2];
check('a new world is Adept, and keeps no key for it', r.default.step === 2 && r.default.name === 'Adept' && !r.default.key, r.default);
check('the five steps are named Novice, Apprentice, Adept, Expert, Master', S.map(s => s.name).join() === 'Novice,Apprentice,Adept,Expert,Master' && S.every(s => s.step === s.n), S.map(s => s.name));
check('Adept is the game as it was: the sword’s 22 on a Skeleton, a Bandit’s 20 blow, a trap’s 20', A.melee === 22 && A.plain === 20 && A.trap === 20 && A.key === undefined, A);
check('your sword: ×2, 1.5, 1, .75, .5 (at Expert 22 becomes 17)', S.map(s => s.melee).join() === '44,33,22,17,11', S.map(s => s.melee));
check('your spell: the same five factors on a Fire Bolt', S.every(s => s.spell === Math.max(1, Math.round(A.spell * [2, 1.5, 1, .75, .5][s.n]))), S.map(s => s.spell));
check('a foe’s blow through executeStrike: ×.5, .75, 1, 1.5, 2', S.every(s => s.blow === Math.max(1, Math.round(A.blow * [.5, .75, 1, 1.5, 2][s.n]))) && S[0].blow < A.blow && S[4].blow > A.blow, S.map(s => s.blow));
check('a foe’s blow through _warded: 10, 15, 20, 30, 40', S.map(s => s.plain).join() === '10,15,20,30,40', S.map(s => s.plain));
check('a trap is not a foe: 20 at every step', S.every(s => s.trap === 20), S.map(s => s.trap));
check('the step lives in the world row, not the character’s, and loads back', r.rows.world === 3 && r.rows.char === undefined && r.loaded === 3, { rows: r.rows, loaded: r.loaded });
check('a save from before the challenge loads at Adept', r.loadedOld.step === 2 && !r.loadedOld.key, r.loadedOld);
check('setChallenge refuses a step that is not 0–4', r.bad[0] === false && r.bad[1] === false && r.bad[2] === false && r.bad[3] === 2, r.bad);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
