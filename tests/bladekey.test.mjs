// The Gate-Blade's key (Session 780; Michael's 3A on DECISION #263): with the blade in hand, a locked door inside a sigil
// gate you have been down before opens at a touch, no pick; the first time it says the draft's line (The Makers' Things),
// after that *The lock gives.* A gate's first visit is never one it opens, and with the blade not in hand the door is
// picked as before. Where you have been is the character's (worldState.gatesWalked, keyed by the gate's seed).
// The fixed gate 42 is found whether or not its cell has streamed in (as corpsebody does).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const enter = async () => {
  await page.evaluate(() => { const p = makePortalDef(WORLD.doorAnywhere(42)); const wp = WORLD.dungeonPos[42]; if (wp) { p.x = wp.x; p.z = wp.z; } p.zone = 'world'; px = p.x; pz = p.z + 3; window._gate = p; goToDungeon(p); });
  for (let k = 0; k < 60 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene)); k++) await page.waitForTimeout(500);
};
const leave = async () => {
  await page.evaluate(() => goToOW());
  for (let k = 0; k < 60 && !(await page.evaluate(() => activeZoneId === 'world')); k++) await page.waitForTimeout(500);
};
// E at the first shut locked door on this floor (or the one named); reads what came of it
await page.evaluate(() => { window._tryDoor = (i) => {
  const L = DOORS.filter(d => d.locked && d.floor === currentFloor); const d = L[i || 0]; if (!d) return { none: true, n: DOORS.length };
  d.open = false; activeMap()[d.z][d.x] = 5; px = d.x; pz = d.z; let said = null; const sm = showMsg; showMsg = (t) => { said = t; };
  for (let k = BAG.length - 1; k >= 0; k--) if (BAG[k].name === 'Lockpick') BAG.splice(k, 1);
  try { interact(); } finally { showMsg = sm; }
  if (lockOpen) closeLockpick();
  return { open: !!d.open, said, cell: activeMap()[d.z][d.x], locked: L.length };
}; });

const setup = await page.evaluate(() => {
  delete worldState.artifacts; delete worldState.gatesWalked; if (worldState.stats) delete worldState.stats.bladeKeyed;
  window._keepW = EQ.weapon; window._keepA = { ...ATTRS };
  ATTRS.might = 30; artifactTry('gate_blade'); const i = BAG.findIndex(it => it.artifact === 'gate_blade'); EQ.weapon = BAG.splice(i, 1)[0];
  return { drawn: gateBladeDrawn() };
});
check('the Gate-Blade taken and in hand', setup.drawn, setup);

await enter();
const first = await page.evaluate(() => ({ ...window._tryDoor(0), walked: { ...(worldState.gatesWalked || {}) }, seed: window._gate.seed }));
console.log('first', JSON.stringify(first));
check(`the gate's first visit: a locked door (of ${first.locked}) stays shut with the blade in hand and asks for a pick`, !first.none && !first.open && /lockpick/i.test(first.said || ''), first);
check('going down writes the gate into the character\'s gates walked, by its seed', first.walked[first.seed] === 1, first);
await leave();

await enter();
const second = await page.evaluate(() => { const a = window._tryDoor(0); const b = window._tryDoor(0); return { a, b }; });
console.log('second', JSON.stringify(second));
check(`the second visit: the blade opens it at a touch (the cell is floor, ${second.a.cell}) and says *${second.a.said}*`, second.a.open && second.a.cell !== 5 && second.a.said === 'The Gate-Blade goes into the lock as if it were cut for it.', second.a);
check(`locked again and touched again, it opens with *${second.b.said}*: the line is said once`, second.b.open && second.b.said === 'The lock gives.', second.b);
const sheathed = await page.evaluate(() => { const w = EQ.weapon; EQ.weapon = makeItem(6, WEAPON_TYPES.find(w => w.type === 'Longsword')); const r = window._tryDoor(0); EQ.weapon = w; return r; });
check('with another blade in hand, the same door, locked again, is picked as before', !sheathed.open && sheathed.cell === 5 && /lockpick/i.test(sheathed.said || ''), sheathed);

const saved = await page.evaluate(() => { const rows = ssSplitPayload(JSON.parse(ssStringify(_buildSavePayload()))); return { char: !!(rows.c.wS && rows.c.wS.gatesWalked && rows.c.wS.gatesWalked[42]), world: !!(rows.w.wS && rows.w.wS.gatesWalked) }; });
check('the gates walked ride the character row, not the world row', saved.char && !saved.world, saved);
await leave();

const lair = await page.evaluate(() => { const was = { ...(worldState.gatesWalked || {}) }; noteGateWalked({ seed: 777001, lair: { name: 'x' } }); noteGateWalked({ seed: 777002, tutorial: true });
  const now = worldState.gatesWalked; EQ.weapon = window._keepW; Object.assign(ATTRS, window._keepA); delete worldState.artifacts;
  return { lairKept: !(777001 in now), tutKept: !(777002 in now), n: Object.keys(was).length }; });
check('a lair cavern and the tutorial crypt are not sigil gates: neither is written', lair.lairKept && lair.tutKept, lair);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
