// The approved words still owed to tools already built (Session 795; the draft *The Makers' Things*): the Gate-Blade's, the
// Drowned Bell's and the Wolf-Mother's Cloak's descriptions; the first wolf that turns away from the cloak (once); the cloak's two
// rumours while it is yours and its master lives; and the first time the compass needle turns for the Shuttle (once).
// The wolf is driven by the loop's own tick at fixed 1/60, the draw held off (as `wolfcloak` does).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._said = []; const sm = showMsg; showMsg = (t, c) => { window._said.push(t); return sm(t, c); };
  window._drive = (max) => { const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
    let t = performance.now(), n = 0; try { for (; n < max; n++) { PHP = maxHP; dead = false; t += 1000 / 60; loop(t); } } finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; } return n; }; });
const r = await page.evaluate(() => {
  const out = {}; const clear = () => { delete worldState.artifacts; for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1); };
  clear(); for (const id of ['gate_blade', 'drowned_bell', 'wolf_cloak']) { const it = artifactItem(id); out[id] = { name: it.name, desc: it.desc, unique: it.unique }; }
  // the Shuttle's compass: the spell's marker says nothing; the Shuttle's, once
  clear(); window._said.length = 0; getActiveQuestMarkers(); out.noShuttle = window._said.slice();
  takeArtifact('shuttle'); window._said.length = 0; const m = getActiveQuestMarkers().filter(x => x.label === 'a warm stone').length; getActiveQuestMarkers(); out.shuttle = { marks: m, said: window._said.slice(), seen: worldState.artifacts.shuttle.compassSeen != null };
  clear();
  // the rumours: in the cloak's town, its neighbours, and a town far off
  const ct = cloakTown(); const [ti, tj] = cellOf(ct.x, ct.z); const far = allSites().find(t => (t.kind === 'town' || t.kind === 'village') && Math.abs(cellOf(t.x, t.z)[0] - ti) > 2);
  const near = allSites().find(t => t.id !== ct.id && (t.kind === 'town' || t.kind === 'village') && Math.abs(cellOf(t.x, t.z)[0] - ti) <= 1 && Math.abs(cellOf(t.x, t.z)[1] - tj) <= 1);
  const sd = cloakSeed(); const keepM = worldState.masters && worldState.masters[sd];
  const has = (t) => liveRumours(t).filter(x => /no road at all now|walked into that cave/.test(x));
  out.town = ct.name; out.before = has(ct).length; takeArtifact('wolf_cloak'); (worldState.masters || (worldState.masters = {}))[sd] = { dead: false };
  out.inTown = has(ct); out.near = near ? { name: near.name, said: has(near) } : null; out.far = far ? has(far).length : null;
  worldState.artifacts.wolf_cloak.half = true; out.half = has(ct).length; delete worldState.artifacts.wolf_cloak.half;
  worldState.masters[sd] = { dead: true }; out.dead = has(ct).length; if (keepM) worldState.masters[sd] = keepM; else delete worldState.masters[sd];
  out.lair = artifactPlaces().wolf_cloak.name;
  return out; });
console.log(JSON.stringify(r).slice(0, 2500));
check('the Gate-Blade\'s description is the draft\'s', r.gate_blade.desc === 'A Maker’s blade, heavy for its length. The wards of a key are cut along the fuller, too fine to see without a candle. The Crown’s rolls call it la Lame du Seuil. The Old Blood call it Eochair na Cloiche, the Stone’s key.', r.gate_blade);
check('the Drowned Bell is *The Drowned Bell*, unique, with the draft\'s description', r.drowned_bell.name === 'The Drowned Bell' && r.drowned_bell.unique && r.drowned_bell.desc === 'A ship’s bell, small, and heavier than its bronze. Weed grows back on it overnight. The Compact’s rolls enter it as le Reliquaire de la Marée. The Old Blood call it Clog na Mara, the Sea’s bell.', r.drowned_bell);
check('the cloak\'s description is the draft\'s', r.wolf_cloak.desc === 'Grey, and not wool, and dry in any rain. Beasts take whoever wears it for one of hers. The Old Blood call it Brat na Máthar, the Mother’s mantle.', r.wolf_cloak);
check(`the Shuttle carried, the compass marks the stone and says *${r.shuttle.said[0]}* once; without it, nothing`, r.noShuttle.length === 0 && r.shuttle.marks === 1 && r.shuttle.said.length === 1 && r.shuttle.said[0] === 'The compass needle leans, and keeps leaning, toward a stone you have not read.' && r.shuttle.seen, r);
check(`the cloak taken alive, its master living: ${r.town} hears both rumours, the road's naming ${r.lair}`, r.before === 0 && r.inTown.length === 2 && r.inTown[0] === `The road past ${r.lair} is no road at all now. The carter goes round, and charges for the going round.` && /^Somebody walked into that cave/.test(r.inTown[1]), r);
check(`a neighbour (${r.near && r.near.name}) hears only the road's; a town far off neither`, (!r.near || (r.near.said.length === 1 && /no road at all now/.test(r.near.said[0]))) && r.far === 0, r);
check('with the thin cloak, or the master dead, no rumour', r.half === 0 && r.dead === 0, r);
// the first wolf that turns away: two wolves set seven units north of you, the cloak on
const w = await page.evaluate(() => {
  forceTime(12); delete worldState.artifacts; const keepBack = EQ.back; takeArtifact('wolf_cloak'); const i = BAG.findIndex(it => it.artifact === 'wolf_cloak'); EQ.back = BAG.splice(i, 1)[0];
  const run = (type) => { window._said.length = 0; const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], px, pz - 7, type, null)); e.ry = 0; e.yaw = 0; ZONES.world.enemies.push(e);
    window._drive(90); const said = window._said.filter(t => /goes about its business/.test(t)); e.dead = true; e.hp = 0; try { WORLD.scene.remove(e.mesh); } catch (x) {} return { said, alert: !!e.alert }; };
  const out = { bear: run('Cave Bear'), wolves: [] }; out.bearSeen = worldState.artifacts.wolf_cloak.turnSeen != null;
  /* a wolf sees only in the cone it faces: set wolves on you until one sees and turns away, then three more */
  let k = 0; for (; k < 6; k++) { const o = run('Wolf'); out.wolves.push(o.said.length); if (o.said.length) { out.first = o; break; } }
  out.after = []; for (let j = 0; j < 3; j++) out.after.push(run('Wolf').said.length); out.seen = worldState.artifacts.wolf_cloak.turnSeen != null;
  EQ.back = keepBack; delete worldState.artifacts; return out; });
console.log(JSON.stringify(w));
check(`the first wolf that would have seen you turns away (wolf ${w.wolves.length}): *${w.first && w.first.said[0]}*; a bear before it says nothing, and three wolves after nothing`, w.bear.said.length === 0 && !w.bearSeen && w.first && w.first.said.length === 1 && w.first.said[0] === 'The wolf stops, looks at you, and goes about its business.' && !w.first.alert && w.after.join() === '0,0,0' && w.seen, w);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
