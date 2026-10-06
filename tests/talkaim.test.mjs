// E talks to the person you face (Session 596). `talkNPC` took the nearest townsperson within 3 units, whatever the
// crosshair was on, while the talk cue (`talkTargetNow`) took the first one in the list the crosshair ray met. On CI
// (`yardplay`, main 3152db7) the player stood 1.3 in front of Captain Rowe facing her, pressed E, and Osric, a villager
// walking past at the shoulder, answered. Now both take the nearest of the people the ray meets, and E falls back to the
// nearest only when the crosshair is on nobody.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const pick = await page.evaluate(() => { forceTime(12); for (let i = 0; i < 300; i++) WORLD.tick(1 / 60, performance.now());
  const S = WORLD.settle.get('dunmore'); const L = S.npcs.filter(n => n.g.visible && !n._retreated && n.def && n.def.name);
  window._A = L[0]; window._B = L.find(n => n.def.name !== L[0].def.name);
  return { A: _A && _A.def.name, B: _B && _B.def.name, n: L.length }; });
console.log(JSON.stringify(pick));
check('two townsfolk of different names to stand among', pick.A && pick.B, pick);
// place A in front (1.3 along the view), B by the case, the camera at the eye; then ask who E and the cue choose,
// in one evaluate so no frame moves anyone between
const ask = (bx, bz, look) => page.evaluate(([bx, bz, look]) => {
  const A = _A, B = _B, ax = A.g.position.x, az = A.g.position.z, y = A.g.position.y;
  for (const n of [A, B]) { n._scared = performance.now() + 1e6; }
  px = ax; pz = az + 1.3; jumpY = y; yaw = look; pitch = -.05;
  B.g.position.set(px + bx, y, pz + bz);
  CAM.position.set(px, y + EYE_STAND, pz); CAM.rotation.set(pitch, yaw, 0); CAM.updateMatrixWorld(true); A.g.updateMatrixWorld(true); B.g.updateMatrixWorld(true);
  try { closeDialog(); } catch (e) {}
  const cue = talkTargetNow(); let opened = null; const _o = openDialog; openDialog = function (d) { opened = d; };
  try { talkNPC(); } finally { openDialog = _o; }
  return { cue: cue && cue.def.name, e: opened && opened.name, dA: 1.3, dB: +Math.hypot(bx, bz).toFixed(2) };
}, [bx, bz, look]);
// the camera looks along (-sin yaw, -cos yaw): yaw 0 looks to -z, at A
const side = await ask(0.85, 0.2, 0);
console.log('side', JSON.stringify(side));
check('a passer-by at your shoulder, nearer than the one you face: E and the cue both take the one you face', side.e === pick.A && side.cue === pick.A, side);
const behind = await ask(0, -2.4, 0);
console.log('behind', JSON.stringify(behind));
check('a second person behind the one you face, on the same line: E and the cue take the nearer', behind.e === pick.A && behind.cue === pick.A, behind);
const away = await ask(0.9, 0.1, Math.PI);
console.log('away', JSON.stringify(away));
check('looking at nobody: no cue, and E still answers with the nearest, as before', away.cue === null && away.e === pick.B, away);
// and through the key, as a player presses it
const place = () => page.evaluate(() => { const A = _A, B = _B, y = A.g.position.y; px = A.g.position.x; pz = A.g.position.z + 1.3; jumpY = y; yaw = 0; pitch = -.05;
  B.g.position.set(px + .85, y, pz + .2); CAM.position.set(px, y + EYE_STAND, pz); CAM.rotation.set(pitch, yaw, 0); CAM.updateMatrixWorld(true); });
await place(); await g.frames(2); await place();
await page.keyboard.press('e'); await g.frames(2);
const k = await page.evaluate(() => ({ open: !!dlgOpen, name: (document.getElementById('dlg-name') || {}).textContent }));
console.log('key', JSON.stringify(k));
check('pressed E in the game\'s loop: the dialogue is the one you face', k.open && k.name === pick.A, k);
await page.evaluate(() => { try { closeDialog(); } catch (e) {} });
await place(); await g.frames(2); await place(); await g.frames(1);
const prompt = await page.evaluate(() => { const e = document.getElementById('ipr'); return { shown: e && e.style.display !== 'none', text: e && e.textContent, cue: (document.getElementById('xh') || {})._k }; });
console.log('prompt', JSON.stringify(prompt));
check('facing them, the prompt names them (*… — Press \'E\' to talk*) and the crosshair shows the talk cue', prompt.shown && prompt.text.startsWith(pick.A) && /Press 'E' to talk/.test(prompt.text) && prompt.cue === 'talk', prompt);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
