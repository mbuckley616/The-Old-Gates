// A death is logged where it happened (Session 673, the critic's s480 note: `currentPortal` is set by `goToDungeon` and
// never cleared, and `playerDead` logged `Fell in ${currentPortal.name}`, so every open-world death after the tutorial read
// *Fell in The Crypt of First Light.*, and after another dungeon, that one). The dungeon's name is used only while you are
// in the dungeon. Die in a dungeon, walk out by its door (`goToOW`), die again outside.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const die = () => page.evaluate(() => { dead = false; PHP = 0; playerDead(); const e = GAME_LOG[GAME_LOG.length - 1];
  const ov = document.getElementById('died'); if (ov) ov.style.display = 'none'; dead = false; PHP = maxHP;
  return { text: e && e.text, zone: activeZoneId, portal: currentPortal && currentPortal.name }; });
const out = {};
await page.evaluate(() => { currentPortal = { id: 'tutorial_crypt', name: 'The Crypt of First Light', tutorial: true }; });
out.afterTutorial = await die();
// S683 — the dungeon is named by the test: `enterDungeon` copies `PORTALS[0]`, which in the open world is the first sigil door
// a cell has loaded, and on a slow runner none has yet, so the portal had no name (CI read *Fell in undefined.*)
await enterDungeon(page, { theme: 'ruins', seed: 11, interior: 'fort_linear', size: 'medium', name: 'The Old Garrison' });
out.inDungeon = await die();
await page.evaluate(() => goToOW());
// S2549 — the way out is `doFade`'s 440 ms timer and then `WORLD.enter`'s restore in its callback, and on software GL under load a
// frame holds the thread 8–11 s, so the 20 s bound ran out (FLAKY on the weekly run of 22 Nov). Wait for the callback's end, the fade
// lifted (`fd`'s opacity set to 0 straight after it), not a fixed pause.
const t0 = Date.now();
await page.waitForFunction(() => activeZoneId === 'world' && document.getElementById('fd').style.opacity === '0', null, { timeout: 180000, polling: 250 });
console.log('out', JSON.stringify({ ms: Date.now() - t0 }));
out.outside = await die();
console.log(JSON.stringify(out));
check('in the open world after the tutorial: *Fell in the open country.*', out.afterTutorial.text === 'Fell in the open country.' && out.afterTutorial.zone === 'world', out.afterTutorial);
check('in a dungeon: the dungeon is named', out.inDungeon.zone === 'dungeon' && out.inDungeon.portal && out.inDungeon.text === 'Fell in ' + out.inDungeon.portal + '.', out.inDungeon);
check('out of it again (the portal still remembered): *the open country*', out.outside.zone === 'world' && out.outside.portal === out.inDungeon.portal && out.outside.text === 'Fell in the open country.', out.outside);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
