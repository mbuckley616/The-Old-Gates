// The health bar's tail (Session 762, Michael's A on DECISION #198, the concept artist's docs/prototypes/hud/): a blow you take
// shows as the pale stretch the bar has just lost, held 0.8 s from the last loss and drained at half the bar a second; the lines
// *Bandit hits you for 7!* and *🛡 Blocked! Bandit hits for 3 (reduced)* are gone.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// 1. the rule, on a set clock
const rule = await page.evaluate(() => { const T = HP_TAIL, out = {}; T.v = null;
  hpTailStep(1, 0); out.drop = hpTailStep(.8, 0); out.held = hpTailStep(.8, 790); out.at1000 = +hpTailStep(.8, 1000).toFixed(4);
  out.floor = hpTailStep(.8, 2000);
  out.second = hpTailStep(.6, 2100); out.secondHeld = hpTailStep(.5, 2700); out.early = hpTailStep(.5, 3400); out.after = +hpTailStep(.5, 3600).toFixed(4); out.end = hpTailStep(.5, 4200);
  out.heal = hpTailStep(.9, 4300); out.healHeld = hpTailStep(.9, 4400);
  T.v = null; return out; });
check('a loss holds the tail where the bar was, for 0.8 s', rule.drop === 1 && rule.held === 1, rule);
check('then it drains at half the bar a second, down to the bar and no further', rule.at1000 === .9 && rule.floor === .8, rule);
check('a second loss inside the hold starts the hold again from the last loss', rule.second === .8 && rule.secondHeld === .8 && rule.early === .8 && rule.after === .75 && rule.end === .5, rule);
check('a heal past the tail takes it along', rule.heal === .9 && rule.healHeld === .9, rule);

// 2. a real blow from a Bandit: the bar drops, the tail stays, and the bottom says nothing
const blow = await page.evaluate(() => {
  const msgs = []; const _m = showMsg; showMsg = function (tx) { msgs.push(String(tx)); return _m.apply(this, arguments); };
  const e = { name: 'Bandit', x: px, z: pz - 1, combatYaw: 0, posture: 25, maxPosture: 25 };
  const w = (id) => parseFloat(document.getElementById(id).style.width);
  const out = {};
  try {
    PHP = maxHP; dead = false; blocking = false; HP_TAIL.v = null; updateHUD(); out.full = [w('hb'), w('hbt')];
    executeStrike(e, 20, performance.now()); updateHUD(); out.hit = [w('hb'), w('hbt')]; out.hp = PHP;
    // a held block (raised long enough ago to be no parry)
    blocking = true; lastBlockAttemptG = playClockS - 5; lastBlockAttemptT = 0; const hp1 = PHP;
    executeStrike(e, 20, performance.now() + 2000); updateHUD(); out.blocked = hp1 - PHP; out.afterBlock = [w('hb'), w('hbt')]; blocking = false;
    out.msgs = msgs.slice();
  } finally { showMsg = _m; PHP = maxHP; dead = false; blocking = false; }
  return out; });
check('a Bandit\'s blow drops the bar and leaves the tail at full', blow.hit[0] < 100 && blow.hit[0] > 0 && blow.hit[1] === 100 && blow.full[0] === 100, blow);
check('a blocked blow lowers the bar further under the same tail', blow.blocked > 0 && blow.afterBlock[0] < blow.hit[0] && blow.afterBlock[1] === 100, blow);
check('the bottom centre says nothing of either blow', blow.msgs.every(m => !/hits you|hits for|Blocked!/.test(m)), blow.msgs);

// a picture of the bar with its tail (docs/prototypes/hptail-bar.png), the clock held so the tail stays
await page.evaluate(() => { PHP = maxHP; HP_TAIL.v = null; updateHUD(); PHP = Math.round(maxHP * .55); updateHUD(); HP_TAIL.t = performance.now() + 1e5; });
await g.frames(2);
await page.screenshot({ path: 'docs/prototypes/hptail-bar.png', clip: { x: 0, y: 0, width: 300, height: 48 } });

// 3. in play: the loop's own HUD drains it, from the page's clock
await page.evaluate(() => { PHP = maxHP; HP_TAIL.v = null; updateHUD(); PHP = maxHP * .5; updateHUD(); });
const held = await page.evaluate(() => parseFloat(document.getElementById('hbt').style.width));
await page.waitForFunction(() => parseFloat(document.getElementById('hbt').style.width) <= 50.5, null, { timeout: 15000 }).catch(() => {});
const drained = await page.evaluate(() => ({ tail: parseFloat(document.getElementById('hbt').style.width), bar: parseFloat(document.getElementById('hb').style.width) }));
check('in the running game the tail holds at once, then drains to the bar', held === 100 && Math.abs(drained.tail - drained.bar) < .6 && Math.abs(drained.bar - 50) < .6, { held, drained });
await page.evaluate(() => { PHP = maxHP; });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
