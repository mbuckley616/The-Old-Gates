// The tells (Session 282; combat, Michael's B, A's second piece). Wind-ups run 0.45–0.9 s (they were 0.24–0.55),
// in the same order; the body's wind-up pose runs the whole tell and the red glow comes only in its last 0.15 s.
// The Faolchú's frenzy tell is floored at 0.45. Driven with fixed 1/60 ticks through the world's enemy tick.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => {
  const out = {};
  const v = Object.entries(TELEGRAPH_BY_NAME);
  out.min = Math.min(...v.map(x => x[1])); out.max = Math.max(...v.map(x => x[1]));
  out.quickest = v.find(x => x[1] === out.min)[0]; out.slowest = v.find(x => x[1] === out.max)[0];
  out.def = telegraphDuration({ name: 'Nobody Listed' });
  // the glow against the pose, on a real bandit
  const e = buildZoneEnemy(WORLD.scene, [], px + 1, pz, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
  e.telegraphMax = telegraphDuration(e); out.bandit = e.telegraphMax;
  const body = enemyBodyMesh(e), em = () => +(body && body.material && body.material.emissive ? body.material.emissive.r : -1).toFixed(3);
  const at = left => { const p = 1 - left / e.telegraphMax; telegraphPulse(e, p); return { wind: +e._wind.toFixed(3), glow: em() }; };
  out.left40 = at(.40); out.left20 = at(.20); out.left075 = at(.075); out.left0 = at(0);
  telegraphReset(e); WORLD.scene.remove(e.mesh);
  return out;
});
console.log(JSON.stringify(r));
check('every tell is 0.45–0.9 s', r.min >= .45 && r.max <= .9, r);
check('the order is kept: the kobold quickest, the golem slowest', r.quickest === 'Kobold Thief' && r.slowest === 'Golem', r);
check('a bandit winds up 0.57 s; an unlisted enemy 0.61', r.bandit === .57 && r.def === .61, r);
check('the pose runs the whole tell: wound .3 in at 0.4 s left', r.left40.wind > .25 && r.left40.wind < .35, r);
check('no glow until the last 0.15 s', r.left40.glow === 0 && r.left20.glow === 0, r);
check('half the glow at 0.075 s left, all of it at the strike', Math.abs(r.left075.glow - .375) < .01 && Math.abs(r.left0.glow - .75) < .01, r);

// end to end: a bandit a step away starts its wind-up and lands 0.57 s later, at 1/60 ticks
const e2e = await page.evaluate(() => {
  const e = buildZoneEnemy(WORLD.scene, [], px + 1, pz, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
  e.locked = false; e.alert = true; e.x = px + 1; e.z = pz; e.telegraphT = 0; e.atkCd = 0; e.spd = 0;
  PHP = maxHP; blocking = false; ROLL = null; lastHitT = -99; lastBlockAttemptT = -99; lastBlockAttemptG = -99; PPOST.posture = PPOST.maxPosture = playerMaxPosture(); PPOST.stagUntil = 0;
  const keep = ZE; ZE = [e]; let frames = 0, started = -1, glowFrom = -1;
  try {
    for (let i = 0; i < 90 && PHP === maxHP; i++) {
      e.x = px + 1; e.z = pz;
      tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); frames++;
      if (started < 0 && e.telegraphT > 0) started = frames;
      const b = enemyBodyMesh(e); if (glowFrom < 0 && b && b.material && b.material.emissive && b.material.emissive.r > 0) glowFrom = frames;
    }
  } finally { ZE = keep; }
  const hit = maxHP - PHP; PHP = maxHP; WORLD.scene.remove(e.mesh);
  return { started, glowFrom, landed: frames, hit, tell: +((frames - started) / 60).toFixed(3), glowLead: +((frames - glowFrom) / 60).toFixed(3) };
});
console.log(JSON.stringify(e2e));
check('a bandit\'s blow lands 0.57 s after its wind-up starts', e2e.hit > 0 && Math.abs(e2e.tell - .57) < .03, e2e);
check('its glow shows only for the last 0.15 s', e2e.glowLead > .1 && e2e.glowLead <= .17, e2e);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
