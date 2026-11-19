// Spells as keys, session 5 (Session 2423; Michael's B on #1678, docs/design/spells-as-keys-build.md): the plates in sequence and the
// script, and the turning chamber. A real gate of the world is entered and one of its secret rooms is rebuilt as each kind in turn.
// The plates: four, one sunk; the script read for a reading (−1), by an Old Blood reader (+1 Cold) or for nothing with all four words
// of the gate's school; a wrong order costs 12% of your health and lets the three rise; the right one opens the cache, a rich chest a
// tier above, once. The turning chamber: three painted plates (a wrong order costs nothing) or Solas-Gheal laid at its pillar; the drum
// turns 90° in 4 s, and only then is its chest there to open. (gatesecrets lays them; gatesave keeps an opened secret.)
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const pick = await page.evaluate(() => { for (const p of PORTALS) { if (!p || p.seed == null || p.zone !== 'world' || p.lair || p.tutorial) continue;
    let gen; try { const w = WORLD_DUNGEONS.find(e => e.seed === p.seed) || {}; gen = makeGate(p.size, p.seed, w.floors, w.cond); if (clochBlockDue(p)) gateBlock(gen, p.seed); gateThings(gen, p.seed); gateSecrets(gen, p.seed, p.size, gateOrbSchool(p)); } catch (e) { continue; }
    const s = gen.secrets.find(q => q.floor === 1 && q.room.w >= 2 && q.room.h >= 2); if (s) { window._sp = p; return { seed: p.seed, size: p.size, id: s.id, kind: s.kind }; } }
  return null; });
console.log('pick', JSON.stringify(pick));
check('a gate of the world has a secret room on floor one', !!pick, pick);
if (pick) {
  await page.evaluate(() => { const p = window._sp; px = p.x; pz = p.z + 3; goToDungeon(p); });
  await page.waitForFunction((s) => String(lid).startsWith('dyn_') && currentPortal && currentPortal.seed === s && document.getElementById('fd').style.opacity === '0', pick.seed, { timeout: 120000, polling: 200 });
  await g.hide();
  const R = await page.evaluate((id) => {
    const drive = (step, max, ms = 1000 / 60) => { const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
      let t = performance.now(), n = 0; prevT = t; try { for (; n < max; n++) { if (step(n)) break; t += ms; loop(t); } } finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; } return n; };
    const reset = (x, z) => { for (const k in K) K[k] = false; PHP = maxHP; dead = false; px = x; pz = z; jumpY = 0; velY = 0; onGround = true; pitch = 0; };
    const gen = GATE_SECRETS_GEN, base = gen.secrets.find(s => s.id === id), out = {};
    const clear = () => { for (const r of GATE_SECRETS) { if (r.group.parent) r.group.parent.remove(r.group); for (const b of r.braziers || []) { b.group.parent && b.group.parent.remove(b.group); gtBrazierCold(b); GATE_THINGS.splice(GATE_THINGS.indexOf(b), 1); }
        if (r.thing) GATE_THINGS.splice(GATE_THINGS.indexOf(r.thing), 1);
        if (r.chest) { r.chest.mesh.parent && r.chest.mesh.parent.remove(r.chest.mesh); const i = CHESTS.indexOf(r.chest); if (i >= 0) CHESTS.splice(i, 1); } }
      for (const L of [FOOTHOLDS, DUNGEON_PROPS, DUNGEON_COLUMNS]) for (let i = L.length - 1; i >= 0; i--) if (L[i].secret || L[i].brazier) L.splice(i, 1);
      if (worldState.gateSecrets) delete worldState.gateSecrets[currentPortal.seed]; laidEnd(); };
    const build = kind => { clear(); gen.secrets = [Object.assign({}, base, { kind, school: null })]; gateSecretsBuild(gen, currentPortal); currentFloor = 1; return GATE_SECRETS[0]; };
    const school = gateOrbSchool(currentPortal), words = WORDS.filter(w => w.school === school).map(w => w.id), known0 = Object.assign({}, knownWords);
    const forget = () => { for (const w of words) if (!known0[w]) delete knownWords[w]; else knownWords[w] = known0[w]; };
    for (const w of words) delete knownWords[w];
    const reg = registerOf(); reg.readings = 0; worldState.people = 'gatelander'; worldState.cold = 0;
    // the plates: laid, and the script closed to one with nothing
    { let r = build('plates'); const o = {}; o.school = school; o.words = words.length;
      o.four = r.plates.length === 4; o.sunk = r.plates.map(p => p.sunk); o.firstSunk = r.plates[r.order[0]].sunk && r.plates.filter(p => p.sunk).length === 1;
      o.hidden = !CHESTS.includes(r.chest) && !r.chest.mesh.visible; o.cache = DUNGEON_PROPS.includes(r.cacheSolid);
      o.same = JSON.stringify(plateOrder(r.id, 4)) === JSON.stringify(r.order);
      o.none = readScript(r.id, 'reading') === 'none' && readScript(r.id, 'cold') === 'none' && readScript(r.id, 'know') === 'none';
      o.closed = scriptPrompt(r);
      // aimed at the lintel from in front of the plates: the prompt
      const ux = base.dc, uz = base.dr, L = r.lintel; reset(L.x - ux * 3.2, L.z - uz * 3.2); yaw = Math.atan2(-(L.x - px), -(L.z - pz)); drive(i => i >= 1, 3);
      pitch = Math.atan2(L.y - CAM.position.y, 3.2); drive(i => i >= 1, 3); o.aimed = scriptLintelNear() === r; reg.readings = 1; drive(i => i >= 1, 2); o.prompt = document.getElementById('ipr').textContent;
      // a reading: spent, the marks shown for good (kept in the world's record)
      o.read = scriptE(r); o.after = readingsHeld(); o.marks = r.marks.visible && r.marks.children.length === 10; o.rec = (worldState.gateSecrets[currentPortal.seed].r || []).includes(r.n);
      o.again = readScript(r.id, 'reading'); pitch = 0;
      // the Old Blood, with a reading too: Shift+E chooses the Cold
      r = build('plates'); worldState.people = 'oldblood'; reg.readings = 1; o.obPrompt = scriptPrompt(r); K.ShiftLeft = true; o.ob = scriptE(r); K.ShiftLeft = false;
      o.cold = worldState.cold; o.obKept = readingsHeld(); worldState.people = 'gatelander';
      // all four words of the gate's school: for nothing
      r = build('plates'); for (const w of words) knownWords[w] = 1; reg.readings = 1; const c0 = worldState.cold; o.knowPrompt = scriptPrompt(r); o.know = scriptE(r);
      o.knowFree = readingsHeld() === 1 && worldState.cold === c0; forget(); for (const w of words) delete knownWords[w];
      // a wrong order: 12% of health, the three rise, the first stays down
      r = build('plates'); const free = r.order.slice(1), wrong = [free[1], free[0], free[2]]; PHP = maxHP;
      o.w = wrong.map(n => pressPlate(r.id, n)); o.lost = +((maxHP - PHP) / maxHP * 100).toFixed(2); o.risen = free.every(n => !r.plates[n].sunk) && r.plates[r.order[0]].sunk && !r.opened;
      o.spikes = r.plates.every(p => p.spikes.visible); playClockS += 1; gateSecretsTick(); o.spikesDown = r.plates.every(p => !p.spikes.visible);
      PHP = maxHP; o.w2 = [free[2], free[1], free[0]].map(n => pressPlate(r.id, n)); o.lost2 = +((maxHP - PHP) / maxHP * 100).toFixed(2);
      // the right order, the first plate stepped onto through the tick: the cache opens once
      PHP = maxHP; const p0 = r.plates[free[0]]; reset(p0.x, p0.z); gateSecretsTick(); o.stepped = p0.sunk; gateSecretsTick(); o.stood = r.pressed.length === 1;
      o.r = [pressPlate(r.id, free[1]), pressPlate(r.id, free[2])]; o.open = r.opened && !DUNGEON_PROPS.includes(r.cacheSolid) && !r.cache.visible && CHESTS.includes(r.chest) && r.chest.mesh.visible;
      o.kept = worldState.gateSecrets[currentPortal.seed].o.includes(r.n); o.noop = pressPlate(r.id, free[0]); o.full = PHP === maxHP;
      const tier = Math.min(4, dungeonTier(currentPortal, 1) + 1);
      o.tier = JSON.stringify(rollContainerLoot('treasure', currentPortal.diffScale, currentPortal.theme, undefined, r.chest.id, tier).map(i => i.name)) === JSON.stringify(r.chest.items.map(i => i.name));
      o.items = r.chest.items.length;
      // rebuilt opened (a reload): the cache gone, the chest there, the plates down
      gateSecretsBuild(gen, currentPortal); r = GATE_SECRETS[0]; o.reload = r.opened && !r.cache.visible && CHESTS.includes(r.chest) && r.plates.every(p => p.sunk);
      out.plates = o; }
    // the turning chamber
    { let r = build('turn'); const o = {}, open = r.turnOpen; o.shut = Math.abs(r.drum.rotation.y - (open - Math.PI / 2)) < 1e-6 && !CHESTS.includes(r.chest) && !r.chest.mesh.visible && DUNGEON_COLUMNS.includes(r.col);
      o.three = r.tplates.length; o.r = +r.drumR.toFixed(2);
      const want = r.torder, wrong = [want[1], want[0], want[2]]; PHP = maxHP; o.w = wrong.map(n => pressPlate(r.id, n)); o.free = PHP === maxHP && r.tplates.every(p => !p.sunk) && !r.opened;
      o.ok = want.map(n => pressPlate(r.id, n)); o.open = r.opened; o.kept = worldState.gateSecrets[currentPortal.seed].o.includes(r.n);
      playClockS += 2; gateSecretsTick(); o.mid = +(r.drum.rotation.y - open).toFixed(3); o.midChest = CHESTS.includes(r.chest);
      playClockS += 2.1; gateSecretsTick(); o.end = +(r.drum.rotation.y - open).toFixed(3); o.chest = CHESTS.includes(r.chest) && r.chest.mesh.visible;
      o.tier = JSON.stringify(rollContainerLoot('chest', currentPortal.diffScale, currentPortal.theme, undefined, r.chest.id, Math.min(4, dungeonTier(currentPortal, 1))).map(i => i.name)) === JSON.stringify(r.chest.items.map(i => i.name));
      // the chest, from the room's floor in front of the drum, in reach
      o.reach = +Math.hypot(r.chest.x - (r.col.x - base.dc * (r.drumR + .35)), r.chest.z - (r.col.z - base.dr * (r.drumR + .35))).toFixed(2);
      // Solas-Gheal laid at the pillar
      r = build('turn'); reset(r.kx - base.dc * 1.5, r.kz - base.dr * 1.5); o.lay = layWord('solas_gheal', null, r.kx + base.dc * .8, r.kz + base.dr * .8).ok;
      gateSecretsTick(); playClockS += 1.5; gateSecretsTick(); o.early = r.opened; playClockS += 1.6; gateSecretsTick(); o.solas = r.opened && r.turnAt != null;
      laidEnd(); clear(); out.turn = o; }
    worldState.people = 'gatelander'; worldState.cold = 0; forget();
    return out; }, pick.id);
  console.log('script', JSON.stringify(R));
  const P = R.plates, T = R.turn;
  check(`the plates: four in a row, the order's first already sunk, the cache shut round a hidden chest; the order the secret's own`, P.four && P.firstSunk && P.hidden && P.cache && P.same, P);
  check(`the script closed to one with no reading, no Old Blood and not all ${P.words} words of ${P.school} (${P.closed}); aimed at with a reading (${P.prompt})`, P.none && /closed/.test(P.closed) && P.aimed && /read the script \(a reading\)/.test(P.prompt), P);
  check(`read for a reading: one spent (${P.after} left), the marks cut over the plates for good, a second read nothing`, P.read === 'reading' && P.after === 0 && P.marks && P.rec && P.again === 'noop', P);
  check(`an Old Blood reader with a reading chooses the Cold with Shift+E (${P.obPrompt}): Cold ${P.cold}, the reading kept`, P.ob === 'cold' && P.cold === 1 && P.obKept === 1 && /grow colder/.test(P.obPrompt), P);
  check(`all four words of the gate's school read it for nothing (${P.knowPrompt})`, P.know === 'know' && P.knowFree && !/reading/.test(P.knowPrompt), P);
  check(`a wrong order fires the spikes for 12% ±0.5 (${P.lost}%, then ${P.lost2}%) and the three rise; the first stays down`, P.w.join() === 'down,down,wrong' && Math.abs(P.lost - 12) <= .5 && Math.abs(P.lost2 - 12) <= .5 && P.risen && P.spikes && P.spikesDown, P);
  check(`the right order (the first stepped onto) opens the cache once: a rich chest a tier above (${P.items} things), kept, and rebuilt open`, P.stepped && P.stood && P.r.join() === 'down,open' && P.open && P.kept && P.noop === 'noop' && P.full && P.tier && P.reload, P);
  check(`the turning chamber: three plates, a drum ${T.r} m round turned to the side, its chest hidden; a wrong order lets them rise and costs nothing`, T.shut && T.three === 3 && T.free && T.w.join() === 'down,down,wrong', T);
  check(`the painted order opens it, kept; the drum turns 90° in 4 s (${T.mid} rad off at 2 s, ${T.end} at 4) and only then is its chest there, at the floor's tier, ${T.reach} m from the drum's foot`, T.ok.join() === 'down,down,open' && T.open && T.kept && Math.abs(T.mid + Math.PI / 4) < .01 && T.end === 0 && !T.midChest && T.chest && T.tier && T.reach < 1.5, T);
  check('Solas-Gheal laid at the crystal pillar turns it after 3 s', T.lay && !T.early && T.solas, T);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
