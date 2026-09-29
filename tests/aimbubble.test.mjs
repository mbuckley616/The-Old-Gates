// Looking at a townsperson who is talking (Session 234). When two townsfolk meet they say a line in a bubble, a Sprite
// on the person's group; `aimAt` raycast the group with no camera on the raycaster, and a Sprite's raycast reads the
// camera, so it threw. It threw in the main loop's prompt check every frame for the bubble's 3.2 s while you stood
// within reach facing them, and everything after that check was skipped: arrows and spells in flight, enemies, the
// music, the HUD, minimap and compass. The world's tick and the draw run before it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const setup = () => page.evaluate(() => { forceTime(12); for (let i = 0; i < 300; i++) WORLD.tick(1 / 60, performance.now());
  const S = WORLD.settle.get('dunmore'); const n = S.npcs.find(n => n.g.visible && !n._retreated && n.sched && n.sched.type === 'villager') || S.npcs.find(n => n.g.visible && !n._retreated);
  window._n = n; n._scared = 0;
  if (!n._bubble) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffffff, transparent: true, depthTest: false })); sp.scale.set(1.6, .4, 1); sp.position.set(0, 1.95, 0); n.g.add(sp); n._bubble = sp; }
  n._bubbleT = 30; closeDialog();
  return { name: n.def.name }; });
const who = await setup();
const stand = () => page.evaluate(() => { const n = _n; px = n.g.position.x; pz = n.g.position.z + 1.3; jumpY = n.g.position.y; yaw = 0; pitch = -.05; CAM.position.set(px, jumpY + 1.6, pz); CAM.rotation.set(pitch, yaw, 0); CAM.updateMatrixWorld(true); });
await stand();
const direct = await page.evaluate(() => { try { return { hit: aimAt(_n, 3.6), threw: null }; } catch (e) { return { hit: null, threw: e.message }; } });
check('aiming at a townsperson with a bubble over their head does not throw', direct.threw === null, { who: who.name, ...direct });
const before = g.errs.length;
await stand(); await g.frames(4); await stand(); await g.frames(2);
const prompt = await page.evaluate(() => (document.getElementById('ipr') || {}).textContent || '');
check('four frames of the game’s loop facing them raise no error', g.errs.length === before, g.errs.slice(before));
await stand(); await g.frames(1); await page.keyboard.press('e'); await g.frames(2);
const talk = await page.evaluate(() => ({ open: dlgOpen, name: (document.getElementById('dlg-name') || document.getElementById('dname') || {}).textContent }));
console.log(JSON.stringify({ prompt, talk }));
check('E opens their dialogue', talk.open, { prompt, talk });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
