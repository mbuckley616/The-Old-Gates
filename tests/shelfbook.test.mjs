// A book taken from a shelf (Session 1121; the quest writer's ask for *What the Stones Say*, backlog A). A generated room's
// bookcase offers the book of the first SHELF_BOOKS rule naming the room's kind and its town's people, once per room by its
// house id (`worldState.shelfTaken`, the world row). The rule on the branch is the glossary, *The Words on the Stones*, in every
// Gatelands Mages' Guild; until the quest writer's book is in BOOKS the test stands it in. Taking it is no crime.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const found = await page.evaluate(() => {
  if (!BOOKS.find(b => b.id === 'words_on_stones')) { BOOKS.push({ id: 'words_on_stones', name: 'The Words on the Stones', ico: '📗', attr: null, pages: ['A stand-in.'] }); window._stood = true; }
  const c = WORLD.SITES.filter(t => t.pad && ['city', 'town'].includes(t.kind)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  let gl = null, other = null;
  for (const t of c) { const S = WORLD.settlements.get(t.id) || WORLD.genSettlement(t); const h = S && S.houses.find(x => x.type === 'guild_m'); if (!h) continue;
    const pp = peopleOfSite(t); if (pp === 'gatelander' && !gl) gl = { h, pp, site: t.name }; else if (pp !== 'gatelander' && !other) other = { h, pp, site: t.name }; if (gl && other) break; }
  if (!gl) return null; window._G = gl.h; window._O = other && other.h;
  return { gl: gl.h.name + ' (' + gl.site + ')', other: other ? other.h.name + ' (' + other.site + ', ' + other.pp + ')' : null, stood: !!window._stood }; });
console.log(JSON.stringify(found));
check('a Gatelands Mages\' Guild is found', !!found, found);
// with no guild of another people near, the same room under a rule for another people (the rule's people swapped a moment)
const otherNone = await page.evaluate(() => { if (window._O) return WORLD.shelfBookFor(_O) === null;
  const r = SHELF_BOOKS[0], was = r.people; r.people = 'markman'; const n = WORLD.shelfBookFor(_G); r.people = was; return n === null && !!WORLD.shelfBookFor(_G); });
check('a Mages\' Guild of another people offers no book (the rule names the Gatelands)', otherNone, found && found.other);
// indoors the game's loop never runs WORLD.tick (it is behind lid==='overworld'), and g.spin does: its tickCells reads the
// room's coordinates as the world's and unloads the town around you (S1553). So in a room the loop's own frames settle it.
const enter = async () => { await page.evaluate(() => { forceTime(12); px = _G.exitX; pz = _G.exitZ; goToInterior(_G); });
  for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior() && !!INT_SHELF && INT_SHELF.id === _G.id)); k++) await page.waitForTimeout(250);
  await g.frames(4); };
await enter();
const room = await page.evaluate(() => ({ shelf: { x: +INT_SHELF.x.toFixed(2), z: +INT_SHELF.z.toFixed(2), y: INT_SHELF.y || 0, nx: INT_SHELF.nx ?? -1, nz: INT_SHELF.nz ?? 0 }, w: +_G.intW.toFixed(2), d: +_G.intD.toFixed(2), kit: !!_G._guildHall }));
console.log(JSON.stringify(room));
// S1703: in the kit's guild hall (the new look) the shelf is the gallery's middle press, on the back wall 3.15 m up; in the old room the east wall's bookcase
check(room.kit ? 'the shelf is the gallery\'s press on the back wall, up on the gallery' : 'the shelf stands on the east wall inside the room', room.kit ? (room.shelf.z < .5 && room.shelf.y > 3 && room.shelf.x > 0 && room.shelf.x < room.w) : (room.shelf.x > room.w - .5 && room.shelf.x < room.w && room.shelf.z > 0 && room.shelf.z < room.d), room);
const prompt = async (dx, look) => { await page.evaluate(([dx, look]) => { const S = INT_SHELF, nx = S.nx ?? -1, nz = S.nz ?? 0, y = S.y || 0; px = S.x + nx * dx; pz = S.z + nz * dx; jumpY = y; if (look) lookAtPt(S.x, y + 1.1, S.z); else lookAtPt(S.x + nx * (dx + 3), y + 1.1, S.z + nz * (dx + 3)); }, [dx, look]);
  await g.frames(3); return page.evaluate(() => ({ ob: document.getElementById('ob').textContent, p: WORLD.shelfPrompt() })); };
const near = await prompt(1.0, true);
check('1 m from the shelf with the crosshair on it, E offers the book by name', /take The Words on the Stones from the shelf/.test(near.ob), near);
const far = await prompt(2.0, true);
check('2 m off (past the 1.6 m touch), no offer', far.p === null, far);
const away = await prompt(1.0, false);
check('facing away, no offer', away.p === null, away);
await prompt(1.0, true);
const took = await page.evaluate(() => { const crimes = JSON.stringify(worldState.crimes || null), crime = JSON.stringify(worldState.crime || null); const n0 = BAG.length; interact();
  const b = BAG.find(i => i.bookId === 'words_on_stones');
  return { book: !!b, type: b && b.type, stolen: b && !!b.stolen, bag: BAG.length - n0, taken: worldState.shelfTaken && worldState.shelfTaken[_G.id], crimes: JSON.stringify(worldState.crimes || null) === crimes && JSON.stringify(worldState.crime || null) === crime, p: WORLD.shelfPrompt() }; });
console.log(JSON.stringify(took));
check('E takes it: the book in the bag, the room\'s copy marked taken by the house id', took.book && took.type === 'book' && took.taken === 'words_on_stones', took);
check('taking it is no crime (not marked stolen, no record)', !took.stolen && took.crimes, took);
check('the shelf offers nothing more', took.p === null, took);
const twice = await page.evaluate(() => WORLD.takeShelfBook(_G));
check('the named action refuses a second copy', twice === false, twice);
// leaving sets your spot outside on a 700 ms timer (58-interiors-legacy.js); going back in sooner, it fires in the room
await page.evaluate(() => exitInterior());
for (let k = 0; k < 40 && !(await page.evaluate(() => lid === 'overworld' && !isInterior())); k++) await page.waitForTimeout(250);
await g.spin(null, 20); await enter();
const back = await prompt(1.0, true);
check('back in the room, still nothing on the shelf', back.p === null, back);
await prompt(1.0, true);
const save = await page.evaluate(() => { const d = JSON.parse(ssStringify(_buildSavePayload())); const rows = ssSplitPayload(d);
  const inW = !!(rows.w.wS && rows.w.wS.shelfTaken && rows.w.wS.shelfTaken[_G.id]), inC = !!(rows.c.wS && rows.c.wS.shelfTaken);
  const d0 = +Math.hypot(px - INT_SHELF.x, pz - INT_SHELF.z).toFixed(2); px = INT_SHELF.x + (INT_SHELF.nx ?? -1); pz = INT_SHELF.z + (INT_SHELF.nz ?? 0); jumpY = INT_SHELF.y || 0; delete worldState.shelfTaken; const lost = WORLD.shelfPrompt() !== null;
  _applyLoadData(JSON.parse(JSON.stringify(ssJoinPayload(rows.c, rows.w))));
  return { d0, inW, inC, lost, after: worldState.shelfTaken && worldState.shelfTaken[_G.id], p: WORLD.shelfPrompt() }; });
console.log(JSON.stringify(save));
check('the taken mark is the world row\'s (a place), not the character\'s', save.inW && !save.inC, save);
check('it comes back from a save: the shelf stays empty', save.lost && save.after === 'words_on_stones', save);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
