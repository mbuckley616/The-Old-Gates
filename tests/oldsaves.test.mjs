// Card F13, old saves into 2.0 (Session 1300): three saves made on main as it stood before F2a (66d10254, 15 Oct 2026: the old
// look, rooms in the old unit, no builder genome, no body, height or build in the look) are loaded on today's build by the
// in-game load (_applyLoadData, _applyZoneFromSave), as the save menu does. Each comes back where it was saved or, if the room
// was rebuilt round that spot, at the door; the character's skills and marks are migrated; and the look's body is pinned into
// the look as the genome tpBuild was already rolling from it, so the next save carries it and nothing re-rolls it.
// The fixtures are tests/fixtures/f13/*.json, each _buildSavePayload() as that build wrote it (its README says how they were made).
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const fx = n => fs.readFileSync('tests/fixtures/f13/' + n + '.json', 'utf8');
const load = async (raw) => {
  await page.evaluate((raw) => { const d = JSON.parse(raw); _applyLoadData(d); _applyZoneFromSave(d); updateHUD(); renderInv(); buildViewmodel(); }, raw);
  const W = JSON.parse(raw).where;
  if (W.kind === 'house') await page.waitForFunction((id) => currentHouse && currentHouse.id === id, W.id, { timeout: 120000, polling: 250 }).catch(() => {});
  else await page.waitForFunction(() => !currentHouse && activeZoneId === 'world', null, { timeout: 60000, polling: 250 }).catch(() => {});
  await g.spin(20).catch(() => {});
  return page.evaluate(() => ({ zone: activeZoneId, house: currentHouse && currentHouse.id, x: +px.toFixed(2), z: +pz.toFixed(2), y: +jumpY.toFixed(2),
    W: currentHouse && +currentHouse._roomW.toFixed(2), D: currentHouse && +currentHouse._roomD.toFixed(2),
    solid: currentHouse ? intSolidAt(px, pz, .3, jumpY) : null, door: currentHouse ? [+intDoorX(currentHouse).toFixed(2), +intArrivalZ(currentHouse).toFixed(2)] : null }));
};
const inRoom = r => r.house && r.x > .3 && r.z > .3 && r.x < r.W - .3 && r.z < r.D - .3 && !r.solid;

// 1. the street: the world's coordinates did not change, so the spot is the spot
const st = await load(fx('street'));
const stW = JSON.parse(fx('street')).where;
check('a save in Dunmore’s street loads at its own spot', st.zone === 'world' && !st.house && Math.hypot(st.x - stW.x, st.z - stW.z) < .5, { st, want: stW });
const ch = await page.evaluate(() => ({ name: playerName, level, skills: Object.keys(SKILLS).length, marks: levelMarks, majors: skillMajors.length }));
check('the character comes back: name, level, the 23 skills and the level’s marks migrated from its banked xp', ch.name === 'Orlaith' && ch.level === 1 && ch.skills === 23 && ch.marks >= 0 && ch.majors > 0, ch);

// 2. the look: pinned into a genome on load, the body tpBuild was rolling for it
const look = await page.evaluate((raw) => { const L0 = JSON.parse(raw).wS.look, L = worldState.look; if (!L) return null;
  const pp = WORLD.playerPeople() || 'gatelander', LK = Object.assign(lookDefault(pp, playerArchetype, playerName), L0);
  const fem = personGenome({ name: playerName, role: '', people: pp, sCol: LK.skin, hairCol: LK.hair }, { key: 'player' }).female;
  const rolled = lookHBGenome(LK, pp, playerName, fem), pinned = lookHBGenome(Object.assign(lookDefault(pp, playerArchetype, playerName), L), pp, playerName, fem);
  const key = G => JSON.stringify(HB.toSaved(Object.assign({}, G, { dress: {} })));
  return { had: !!L0.hb, has: !!L.hb, body: L.body, fem, same: !!(rolled && pinned) && key(rolled.G) === key(pinned.G), bytes: L.hb ? JSON.stringify(L.hb).length : 0,
    kept: ['skin', 'hair', 'style', 'beard'].every(k => L[k] === L0[k]),
    row: (() => { const r = ssSplitPayload(_buildSavePayload()); return !!(r.c.wS && r.c.wS.look && r.c.wS.look.hb) && !(r.w.wS && r.w.wS.look); })() };
}, fx('street'));
check('a look saved before F10 gains its genome on load, with its body (man or woman) as the old driver had it', look && !look.had && look.has && look.body === (look.fem ? 'woman' : 'man') && look.kept, look);
check('and it is the body the build was already rolling: the pinned genome and the rolled one are the same', look && look.same, look);
check('the next save carries it in the character row, not the world row', look && look.row, look);
const again = await page.evaluate(() => { const before = JSON.stringify(worldState.look.hb); const d = _buildSavePayload(); _applyLoadData(JSON.parse(JSON.stringify(d))); return before === JSON.stringify(worldState.look.hb); });
check('a save made after the pin loads the same genome', again);

// 3. inside rooms: the shop's spot stands free in today's room, and the home's corner, inside something now, goes to the door
const sh = await load(fx('shop')), shW = JSON.parse(fx('shop')).where;
check('a save made mid-room in Lorcan’s Forge (an 11 × 12 room in the old unit) comes back inside that shop, on its floor and in nothing', sh.house === shW.id && inRoom(sh) && sh.y === 0, { sh, want: shW });
const ho = await load(fx('home')), hoW = JSON.parse(fx('home')).where;
check('a save in Tadhg’s House comes back in that house, in nothing: where it stood, or at the door', ho.house === hoW.id && inRoom(ho) && ((ho.x === hoW.x && ho.z === hoW.z) || (ho.x === ho.door[0] && ho.z === ho.door[1])), { ho, want: hoW });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
