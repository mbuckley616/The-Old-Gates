// Session 473 (the critic, 4 Oct, s374): a bought ship was moored with her bow at the quay, so the first W ran her onto the
// shallows (Hull −22). A ship's forward is (−sin yaw, −cos yaw); buyShip and the Compact's grant turned her to
// atan2(sd.dx, sd.dz), the shore direction's opposite, and fetching and raising faced the land on a north or south shore.
// All four now take seawardYaw(sd). Checked at Portclare as the critic played it: bought, her bow points at deeper water,
// and the wheel held at W for fifteen seconds takes her out with her hull whole.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('portclare');
const key = (code, down) => page.evaluate(([code, down]) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code })), [code, down]);

const b = await page.evaluate(() => { for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship = null; gold = 2000; const site = WORLD.siteAnywhere('portclare'); const said = WORLD.buyShip(site); const S = WORLD.ship;
  const fx = -Math.sin(S.yaw), fz = -Math.cos(S.yaw), H = d => +WORLD.worldH(S.x + fx * d, S.z + fz * d).toFixed(2);
  return { said: said.slice(0, 60), x: +S.x.toFixed(1), z: +S.z.toFixed(1), yaw: +S.yaw.toFixed(3), ahead: [H(15), H(30)], astern: [H(-15), H(-30)], hull: WORLD.shipBars().hull }; });
console.log(JSON.stringify(b));
check(`bought at Portclare, her bow points to deeper water (ahead ${b.ahead}, astern ${b.astern})`, b.ahead[1] < b.astern[1] && b.ahead[0] <= b.astern[0], b);

await page.evaluate(() => { const S = WORLD.ship; px = S.helm ? S.helm.x : S.x; pz = S.helm ? S.helm.z : S.z; jumpY = 1; S.sailing = true; S.speed = 0; WORLD.tick(1 / 60, performance.now()); });
await key('KeyW', true);
const s = await page.evaluate(() => { const S = WORLD.ship, x0 = S.x, z0 = S.z, h0 = WORLD.shipBars().hull; let stopped = 0;
  for (let i = 0; i < 900; i++) { const v = S.speed; WORLD.tick(1 / 60, performance.now()); if (v > 1 && S.speed === 0) stopped++; }
  return { moved: +Math.hypot(S.x - x0, S.z - z0).toFixed(1), speed: +S.speed.toFixed(2), hull: WORLD.shipBars().hull, h0, stopped, msg: document.getElementById('msg').textContent }; });
await key('KeyW', false);
console.log(JSON.stringify(s));
check(`at the wheel, W held fifteen seconds takes her out ${s.moved} units at ${s.speed}, her hull whole (${s.h0} → ${s.hull})`, s.moved > 60 && s.speed > 2 && s.hull === s.h0 && s.stopped === 0, s);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
