// What a gate keeps (what-a-gate-keeps-build.md, Michael's C on #1092), the sheet's first session (Session 2370): a lesser gate's ring
// chamber is its keep, and its coffer stands on the dais. Rolled on <seed>:<floor>:coffer with no day, so two rolls agree; 2 pieces of arms,
// armour or implements, never gold, at the floor's tier plus one and at most 4; the gate's orb, one gate in three, in it and in no chest.
// Then one such gate entered: the coffer shut until its carving is touched, open after, one piece taken, and what is left kept by the world
// row of the save and by the gate rebuilt.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const P = await page.evaluate(() => {
  const T = carvingTable().bySeed, port = (e) => { const p = makePortalDef(e); p.zone = 'world'; p.sigil = true; p.theme = p.theme || e.theme; return p; };
  const doors = []; for (const s of Object.keys(T)) { const e = WORLD.doorAnywhere(+s); if (!e || e.lairDoor || e.kind === 'fort_door') continue; const p = port(e); if (gateCofferDue(p)) doors.push({ p, d: Math.hypot(e.x - px, e.z - pz) }); }
  doors.sort((a, b) => a.d - b.d);
  const rows = [], twenty = doors.slice(0, 20);
  for (const { p } of twenty) { const a = gateCofferItems(p, 1), b = gateCofferItems(p, 1), name = (L) => L.map(i => i.name + '|' + (i.tier || 0)).join(';');
    rows.push({ seed: p.seed, same: name(a) === name(b), n: a.length, gold: a.filter(i => i.type === 'gold').length, kit: a.every(i => i.slot || i.implement), orb: gateOrbDue(p), orbFirst: !!(a[0] && a[0].gateOrb != null), orbs: a.filter(i => i.gateOrb != null).length,
      cap: Math.min(4, dungeonTier(p, 1) + 1), mat: Math.max(...a.filter(i => i.gateOrb == null).map(i => i.tier || 0)) }); }
  // the roll's kind over many pieces: arms, armour and found implements of the gate's school only
  let found = 0, weap = 0, other = 0, wrong = 0; const p0 = twenty[0].p, school = gateOrbSchool(p0);
  for (let k = 0; k < 400; k++) withLootRng(seededRng('cofferkind', k), () => { const was = LOOT_SCHOOL; LOOT_SCHOOL = school; try { const it = rollLoot(p0.diffScale, p0.theme, 'coffer');
    if (!it || !(it.slot || it.implement)) other++; else if (it.found) { found++; if (it.school !== school) wrong++; } else if (it.slot === 'weapon') weap++; } finally { LOOT_SCHOOL = was; } });
  return { rows, n: doors.length, found, weap, other, wrong, school, pick: (twenty.find(x => gateOrbDue(x.p)) || twenty[0]).p };
});
console.log('rolls', JSON.stringify({ n: P.n, rows: P.rows.map(r => [r.seed, r.n, r.orb ? 'orb' : '', r.cap, r.mat].join(' ')), found: P.found, weap: P.weap, other: P.other }));
check(`20 lesser gates with a carving of their own (of ${P.n} in the world)`, P.rows.length === 20, P.n);
check('each coffer rolls the same twice, on its own stream', P.rows.every(r => r.same), P.rows.filter(r => !r.same));
check('2 pieces each, plus the orb where the gate keeps one, and no gold', P.rows.every(r => r.n === 2 + (r.orb ? 1 : 0) && r.gold === 0 && r.kit), P.rows.filter(r => !(r.n === 2 + (r.orb ? 1 : 0) && r.gold === 0)));
check(`the orb lies first in the coffer of every orb gate (${P.rows.filter(r => r.orb).length} of 20)`, P.rows.every(r => r.orb ? r.orbFirst && r.orbs === 1 : r.orbs === 0), P.rows);
check('nothing in a coffer is a potion, a pick or gold: only arms, armour and implements, over 400 rolls', P.other === 0, P.other);
const share = P.found / (P.found + P.weap);
check(`a weapon roll in five is a found implement of the gate's school (${(share * 100).toFixed(0)}% of ${P.found + P.weap}, ${P.wrong} of another school)`, share > .13 && share < .28 && P.wrong === 0, { found: P.found, weap: P.weap, wrong: P.wrong });

// one gate entered, as its door makes its portal
const seed = P.pick.seed;
await page.evaluate((s) => { if (worldState.sigilsRead) delete worldState.sigilsRead[s]; if (worldState.gateKeeps) delete worldState.gateKeeps[s]; window._prevDScene = typeof dScene !== 'undefined' ? dScene : null;
  const e = WORLD.doorAnywhere(s), p = makePortalDef(e); p.zone = 'world'; p.sigil = true; p.theme = p.theme || e.theme; goToDungeon(p); }, seed);
const inGate = () => page.waitForFunction((s) => activeZoneId === 'dungeon' && typeof dScene !== 'undefined' && dScene !== window._prevDScene && scene === dScene && currentPortal && currentPortal.seed === s && ENEMIES.length > 0, seed, { timeout: 180000, polling: 200 });
await inGate(); await g.hide();
const A = await page.evaluate((s) => { const C = CHESTS.filter(c => c.coffer != null), c = C[0], sp = _lastGen.spaces[_lastGen.ring], d = sp.dais, out = { n: C.length };
  if (!c) return out; out.id = c.id; out.off = +Math.hypot(c.x - dAt((d.x0 + d.x1) / 2), c.z - dAt((d.z0 + d.z1) / 2)).toFixed(2); out.floor = c.floor === (sp.floor || 1);
  out.y = +(c.mesh.position.y - (c.floor === 2 ? FLOOR2_Y : 0)).toFixed(2); out.items = c.items.map(i => i.name); out.want = gateCofferItems(currentPortal, c.floor).map(i => i.name);
  out.orbChests = CHESTS.filter(x => x.coffer == null && x.items.some(i => i.gateOrb != null)).length;
  const sm = showMsg; let said = ''; showMsg = (t) => { said = t; }; out.shut = gateCofferShut(c) && openCoffer(c) === false && !lootOpen; out.said = said;
  const sig = SIGILS.find(q => q.floor === c.floor) || SIGILS[0]; out.sig = !!sig; if (sig) touchSigil(sig); showMsg = sm;
  out.read = !gateCofferShut(c); out.opened = openCoffer(c) === true && lootOpen && currentLootContainer === c;
  out.took = c.items[c.items.length - 1].name; takeLootItem(c.items.length - 1); closeLoot();
  out.left = (worldState.gateKeeps[s].coffer || []).map(i => i.name); out.inBag = BAG.some(b => b.name === out.took);
  const rows = ssSplitPayload(JSON.parse(ssStringify(_buildSavePayload()))); out.worldRow = !!(rows.w.wS.gateKeeps && rows.w.wS.gateKeeps[s]) && !(rows.c.wS && rows.c.wS.gateKeeps);
  const d2 = JSON.parse(ssStringify(_buildSavePayload())); worldState.gateKeeps = {}; _applyLoadData(d2); out.loaded = ((worldState.gateKeeps[s] || {}).coffer || []).map(i => i.name);
  return out; }, seed);
console.log('gate', seed, JSON.stringify(A));
check(`the gate has one coffer, on the middle of its ring chamber's dais (${A.off} m off), on its top (${A.y} m up)`, A.n === 1 && A.off < .05 && A.floor && Math.abs(A.y - .4) < .02, A);
check('it holds what its stream rolls', JSON.stringify(A.items) === JSON.stringify(A.want), { items: A.items, want: A.want });
check(`no other chest holds the orb (${A.orbChests})`, A.orbChests === 0, A.orbChests);
check(`shut before the carving is read: "${A.said}"`, A.shut && /closed to you/.test(A.said), A);
check('the carving touched, it opens', A.sig && A.read && A.opened, A);
check(`one piece taken (${A.took}): the coffer keeps the rest, ${A.left.length}`, A.inBag && A.left.length === A.items.length - 1, A);
check("the coffer's list is the world row's, and a load gives it back", A.worldRow && JSON.stringify(A.loaded) === JSON.stringify(A.left), { worldRow: A.worldRow, loaded: A.loaded, left: A.left });
// the gate built again: the coffer open, as you left it
await page.evaluate((s) => { window._prevDScene = dScene; const e = WORLD.doorAnywhere(s), p = makePortalDef(e); p.zone = 'world'; p.sigil = true; p.theme = p.theme || e.theme; goToDungeon(p); }, seed);
await inGate();
const B = await page.evaluate(() => { const c = CHESTS.find(x => x.coffer != null); return c ? { opened: c.opened, items: c.items.map(i => i.name), lid: c.lid ? +c.lid.rotation.x.toFixed(2) : null } : null; });
console.log('again', JSON.stringify(B));
check('entered again, the coffer stands open with what you left in it', B && B.opened && JSON.stringify(B.items) === JSON.stringify(A.left) && B.lid < 0, B);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
