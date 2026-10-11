// A foe killed while parried (Michael, 5 Oct 2026, control room: "skeletons ... when parried, leave their parried skeletons
// standing even after they are killed. The yellow 'parry' state does not end if they are killed while it happens.").
// The parry's flash gave the body a new plain material; on a skinned body that draws the bind pose, and the flash's undo
// skipped a dead foe, so the corpse stood yellow over its ragdoll. Now the flash tints the body's own material and is undone
// on death too. Times are passed in, so nothing reads the runner's clock.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();
const r = await page.evaluate(() => {
  const mk = (name) => { const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * 1.2, pz + fwdZ * 1.2, name, null);
    if (!e.mesh.parent) WORLD.scene.add(e.mesh); e.locked = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0;
    e.combatYaw = Math.atan2(px - e.x, pz - e.z); if (typeof e.posture !== 'number') initPosture(e); ZE.push(e); return e; };
  const look = (e) => { const b = enemyBodyMesh(e), m = b && b.material; const out = { skinned: !!(b && b.isSkinnedMesh), skinning: !!(m && m.skinning), col: m && m.color && m.color.getHexString(), em: m && m.emissive && m.emissive.getHexString() }; return out; };
  const parry = (e) => { const now = performance.now() / 1000; blocking = true; lastBlockAttemptT = now - .05; lastBlockAttemptG = playClockS - .05; executeStrike(e, 8, now * 1000); blocking = false; };
  const out = {};
  for (const name of ['Skeleton', 'Bandit']) {
    const e = mk(name); const before = look(e); parry(e); const during = look(e);
    killZoneEnemy(e, WORLD.scene, ''); const dead = look(e);
    // the ragdoll (or the slump) has the body down: its bones or its group, not standing at full height
    out[name] = { before, during, dead, person: !!(e.limbs && e.limbs.person), stag: isStaggered(e) };
    const a = mk(name); parry(a);
  }
  return out;
});
await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));
const after = await page.evaluate(() => { const out = {}; for (const e of ZE) if (e && !e.dead && e.name && /Skeleton|Bandit/.test(e.name) && e._parryTest !== false) { const b = enemyBodyMesh(e), m = b && b.material; out[e.name] = { skinning: !!(m && m.skinning), em: m && m.emissive && m.emissive.getHexString() }; } return out; });
console.log(JSON.stringify(r).slice(0, 2500)); console.log(JSON.stringify(after));
for (const n of ['Skeleton', 'Bandit']) {
  const x = r[n];
  check(`${n}: the parried body keeps its own (skinned) material while it flashes`, x.during.skinning === x.before.skinning && x.during.em !== x.before.em, { before: x.before, during: x.during });
  check(`${n}: killed while parried, the corpse is not yellow and keeps its skinning`, x.dead.skinning === x.before.skinning && x.dead.em === '000000' && x.dead.col !== 'ffdd44', x.dead);
  check(`${n}: parried and left alive, the flash ends after 1.2 s`, after[n] && after[n].em === '000000' && after[n].skinning === x.before.skinning, after[n]);
}
check('the skeleton is a people-bodied foe on a skinned mesh (the case Michael saw)', r.Skeleton.person && r.Skeleton.before.skinned, r.Skeleton.before);
stop(); check('no page errors', g.errs.length === 0, g.errs);
await g.close();
