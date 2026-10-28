// A lair cavern's master is the lair's own beast (Session 706, Michael's A on DECISION #225). It was whichever foe stood
// deepest, renamed (the critic's s482: a 49-HP Slime called *Carrigowen — Cave Bear*). The deepest foe now gives up its place
// and is built again on the open world's body for the lair's kind, with that kind's numbers at the cavern's scale.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const KINDS = ['Marsh Hag', 'Frost Troll', 'Ash Wight', 'Cave Bear', 'Ogre'];
const rows = [];
for (const [k, kind] of KINDS.entries()) {
  await page.evaluate(([kind, k]) => { window._lairBoss = null; delete (worldState.masters || {})[5100 + k];
    const p = Object.assign({}, PORTALS[0], { theme: 'deep', seed: 5100 + k, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, diff: 'hard', diffScale: DIFF_SCALE.hard, lair: { place: 'Testmoor', boss: kind } });
    goToDungeon(p); }, [kind, k]);
  for (let i = 0; i < 60; i++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId === 'dungeon' && !!window._lairBoss)) break; }
  await g.spin(null, 30);
  rows.push(await page.evaluate((kind) => { const e = window._lairBoss; if (!e) return { kind, none: true };
    const D = ZONE_FOE_DEF[kind], ds = DIFF_SCALE.hard, fm = 1; /* S1058 — floor 2's ×1.5 went: the floor steps by its tier's +1 alone (the enemies-by-place sheet) */
    const T = dungeonTier(currentPortal, e.floor || 1), LT = tierLevel(T); /* S1034 — the cavern's tier, not your level (#373 A) */
    const hp = Math.round(Math.max(1, Math.round(D.hp * ds.hp * fm * enemyHpScale(T))) * 3 * (1 + LT * .08));
    const dm = D.dmg / 15 * ds.dmg * fm * enemyDmgScale(T) * 1.6 * (1 + LT * .04);
    const rig = e.limbs && (e.limbs.person || e.limbs.wolf); const root = rig && rig.root;
    e.mesh.updateMatrixWorld(true);
    /* S1546 — the body alone: since the weapon kit the rig's tree holds what the fist carries (`gear` under the right wrist), and
       a whole-tree box measured the Ogre's raised greatclub (3.63–3.67 by the idle's sway) instead of the Ogre (3.45). The club's
       top is reported as `held`, not checked here. */
    const gearOf = o => { for (let q = o; q && q !== root; q = q.parent) if (/^(gear|weapon:)/.test(q.name || '')) return true; return false; };
    const boxOf = o => { if (o.isSkinnedMesh && o.computeBoundingBox) { o.computeBoundingBox(); return o.boundingBox.clone().applyMatrix4(o.matrixWorld); }
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); return o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); };
    let b = null, held = null; if (root) { b = new THREE.Box3(); const h = new THREE.Box3();
      root.traverse(o => { if (!o.isMesh || !o.geometry) return; (gearOf(o) ? h : b).union(boxOf(o)); }); if (!h.isEmpty()) held = +(h.max.y - b.min.y).toFixed(2); }
    const boxes = e.mesh.children.filter(c => c.isMesh && c.geometry && c.geometry.type === 'BoxGeometry').length;
    return { kind, name: e.name, baseType: e.baseType, person: !!e.limbs.person, wolf: !!e.limbs.wolf, rigOnMesh: !!root && root.parent === e.mesh, rigE: !!rig && rig.e === e,
      hp: e.maxHp, hpWant: hp, dmgMult: +e.dmgMult.toFixed(3), dmgWant: +dm.toFixed(3), resist: JSON.stringify(e.resist) === JSON.stringify(D.resist || {}), def: e.def === (D.def || 0),
      height: b ? +(b.max.y - b.min.y).toFixed(2) : null, held, ceiling: FLOOR_HEIGHT, oldBoxes: boxes, master: !!e.master, boss: !!e.boss, posture: e.maxPosture, floor: e.floor || 1,
      hoard: (() => { const it = worldState.masters[currentPortal.seed].hoard.items[1]; const want = it.slot === 'weapon' ? MATERIALS.find(q => q.tier === it.tier) : armorReq(it.tier, armorTypeOf(it)); return { name: it.name, tier: it.tier, reqAttr: it.reqAttr, reqVal: it.reqVal, ok: !!it.reqAttr && it.reqAttr === want.reqAttr && it.reqVal === want.reqVal && it.reqVal > 0 }; })(),
      slimeless: !e.disguised && !e.dormant && !e.isWraith && !e.ranged, inScene: !!e.mesh.parent }; }, kind));
}
console.log(JSON.stringify(rows));
check('a cavern was entered and its master found for each of the five kinds', rows.every(r => !r.none), rows);
check('the master is named for the lair\'s beast and is that beast', rows.every(r => r.name === `Testmoor — ${r.kind}` && r.baseType === r.kind && r.master && r.boss), rows.map(r => [r.name, r.baseType]));
check('on the open world\'s body: a person\'s rig for the Hag, the Troll, the Wight and the Ogre, the bear\'s for the Cave Bear', rows.every(r => r.rigOnMesh && r.rigE && (r.kind === 'Cave Bear' ? r.wolf && !r.person : r.person && !r.wolf)), rows.map(r => [r.kind, r.person, r.wolf, r.rigOnMesh]));
check('the deepest foe\'s old body is gone (no box parts left on the group)', rows.every(r => r.oldBoxes === 0 && r.inScene), rows.map(r => [r.kind, r.oldBoxes]));
check('its health is the kind\'s at the gate\'s difficulty and floor, then ×3 the master', rows.every(r => r.hp === r.hpWant), rows.map(r => [r.kind, r.hp, r.hpWant, r.floor]));
check('its blow is the kind\'s (dmgMult so the cavern\'s 15 lands the kind\'s blow), then ×1.6 the master', rows.every(r => Math.abs(r.dmgMult - r.dmgWant) < .002), rows.map(r => [r.kind, r.dmgMult, r.dmgWant]));
check('its armour and resistances are the kind\'s, and nothing of the slot\'s ambush or range is left', rows.every(r => r.resist && r.def && r.slimeless), rows);
check('it stands under the cavern\'s ceiling', rows.every(r => r.height > .8 && r.height <= r.ceiling - .14), rows.map(r => [r.kind, r.height, r.ceiling, r.held]));
check('its posture is from its own health', rows.every(r => r.posture >= Math.round(r.hp * .5 * .9) || r.posture >= 18), rows.map(r => [r.kind, r.hp, r.posture]));
check('the hoard\'s sword or cuirass asks what its tier asks (Session 708: it was built with no requirement)', rows.every(r => r.hoard && r.hoard.ok), rows.map(r => r.hoard));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
