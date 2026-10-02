
// ══════════════════════════════════════════════════════════════
// FOREST ZONE
// ══════════════════════════════════════════════════════════════
// (v61: forestScene/FOREST_SOL/FOREST_NPCS/FOREST_SIZE and all Hearthwick/
// Bealach-South globals are declared in the zone-globals block above
// ASHENMOOR_CONFIG. This section keeps only the build function.)

// Wolf/spider/troll enemy builders for overworld combat
// Monster Overhaul Session 1: each enemy gains `def` (flat damage reduction) and `resist` (per-school multiplier map).
// Resist keys match SPELLS[i].school (tine/uisce/gaoth/cloch/scath/solas). Missing keys default to 1.0 (neutral).
// ── BOSSES (module-top) ────────────────────────────────────────────
// v61c2 (Faolchú): boss enemies are scripted spawns, not procedural pool
// roster entries. They mount onto ZE alongside regular zone enemies, share
// the same tick path (with isBoss-gated branches in tickZoneEnemies for
// longer telegraph + bigger bite range + phase machine), and die through
// killZoneEnemy with a defeat_boss event hook for quest progression.
//
// This block is at module-top scope (not inside the dungeon-build IIFE) so
// the burn trigger in goToZone and the overworld-entry resync code can
// reference it. The dungeon-scope EM registry is unchanged.
//
// TUNING LEVERS — adjust on playtest, no other code changes needed:
//   - hp: total fight length. v61c5 = 2000. Was 1000 in v61c3 (still ended
//     too fast against a tooled-up player); 500 in v61c2. Each phase is
//     hp/3 of work — Phase 1 from 100% to 66% (~660 HP), Phase 2 to 33%
//     (~660 HP plus the lesser-add HP since they aggro alongside),
//     Phase 3 final third (~660 HP plus the second lesser-add).
//   - spd: 4.0 = slightly faster than player walk (3.83), slower than
//     sprint (4.69). Player can disengage with sprint+stamina, can't kite
//     while walking.
//   - dmg: 32 lands above Cave Troll (~22 at level 5) and above Golem
//     (~26). Faolchú hits hard. Block timing matters.
//   - resist.solas 0.4: explicit weakness. Light spells (Leigheas / Solas-
//     Gheal at Mastery) do 60% bonus damage. Encourages spell-tier combat.
//   - resist.tine 0.7: secondary weakness. Caor Mastery (Living Ember)
//     applies on the homing fireball — meaningful for Caor-touched players.
//   - resist.blunt 1.5: signature mechanic. Hammer/mace builds chip rather
//     than carve — but they still WIN, just slower. Slash/pierce builds
//     have an easier melee path. Reads as "wolf flesh deflects impact".
//   - biteRange 2.8: the mesh's snout extends ~1.8u forward of body center,
//     so 2.8u covers the visual reach AND a small overshoot. Below this and
//     the boss "passes through" the player on chase — telegraph never fires.
const BOSSES={
  Faolchu: {
    col:0x6a4838, hp:2000, spd:4.0, scale:1.85,
    dmg:32, atk:1.4, xpVal:1500,
    eyeCol:0xff2200, light:0xff3a14,
    def:3,
    resist:{ solas:0.4, tine:0.7, scath:1.2, cloch:0.9,
             slash:0.95, pierce:0.95, blunt:1.5 },
    isBoss:true,
    bossId:'faolchu',
    displayName:'Faolchú',
    // Phase HP fractions (descending). Phase 1 is implicit (1.0 = full hp).
    // Phase 2/3 wired in Session B; Session A logs the transition only.
    phases:[
      { id:1, threshold:1.00, telegraphMult:1.0, embers:false },
      { id:2, threshold:0.66, telegraphMult:0.85, embers:false },
      { id:3, threshold:0.33, telegraphMult:0.55, embers:true  },
    ],
    biteRange:2.8, telegraphBase:0.55,
  },
};

// v61c2 — Faolchú mesh build. Module-top so spawnFaolchu can call it from
// the burn trigger / overworld resync (which run outside any dungeon scope).
// v61c3 — Major mesh rework. Adds face detail (separate eyes, ears, lower
// jaw, teeth) and two back-emerging arm-like appendages matching the
// concept art. Body color brightened slightly so the boss reads against
// grey-ash backdrop. Sigil pulse covers more of the silhouette so the
// "this thing is alive and wrong" reads even at distance.
//
// Returns {g, hpFg, hpBg, limbs} — same shape as buildEnemy / buildZoneEnemy.
// hpFg is updated each tick for the HUD healthbar's data source even though
// the world-space bar itself is hidden (HUD takes over for bosses).
function buildFaolchuMesh(d){
  // S211 — the Faolchú on the shape kit (Michael's answer on Session 201: "great as is"): the Dire Wolf's skinned body
  // hunched, two pairs of clawed arms from a red seam down its spine, orange sigil-script along its flanks. About the old
  // box's height (its ears topped out at .92 of its scale), a little shorter from nose to tail; bite range and hits are unchanged.
  // The glowing parts share one unlit material (limbs.sigilTrace, which the phases recolour) and are listed in
  // limbs.sigilMeshes (the death burst reads their positions); the arms and claws are ordinary meshes on the wolf's bones.
  const sc = d.scale;
  const g = new THREE.Group();
  const limbs = {};
  const sigilMat = new THREE.MeshBasicMaterial({color:0xff1a0a});
  const runeMat = new THREE.MeshBasicMaterial({color:0xff7a30});
  const armMat = new THREE.MeshStandardMaterial({color:0x3a322c,roughness:.9});
  const clawMat = new THREE.MeshStandardMaterial({color:0xd8d0c0,roughness:.6});
  const w = buildWolf('Dire Wolf', sc*1.45);
  g.add(w.root);
  w.hunch=[-.18,.35,.15]; // the spine arched, the neck and head carried low (wgApply adds it to every pose)
  limbs.torso = w.mesh; limbs.wolf = w;
  const B = w.B, sigilMeshes = [];
  const add = (bone, geo, mat, p, r) => { const m = new THREE.Mesh(geo, mat); m.position.set(p[0], p[1], p[2]); if (r) m.rotation.set(r[0], r[1], r[2]); bone.add(m); if (mat === sigilMat || mat === runeMat) sigilMeshes.push(m); return m; };
  add(B.spine, new THREE.BoxGeometry(.018, .015, .42), sigilMat, [0, .085, .02], [.05, 0, 0]);
  add(B.hips, new THREE.BoxGeometry(.018, .015, .26), sigilMat, [0, .095, -.05]);
  add(B.head, new THREE.BoxGeometry(.05, .008, .008), sigilMat, [0, .07, .02]);
  [-1, 1].forEach(sd => [[.16, .3], [-.02, -.1]].forEach(([z, a], k) => { const sh = new THREE.Group(); sh.position.set(sd * .04, .11, z); sh.rotation.set(a, 0, sd * 1.1); B.spine.add(sh);
    add(sh, SK.limb(.2, .026, .02), armMat, [0, 0, 0]); const el = new THREE.Group(); el.position.set(0, -.2, 0); el.rotation.set(.9, 0, -sd * .6); sh.add(el); add(el, SK.limb(.18, .02, .014), armMat, [0, 0, 0]);
    for (let f = -1; f <= 1; f++) add(el, SK.cone(.008, .05, 4), clawMat, [f * .012, -.2, .01], [Math.PI, 0, 0]);
    add(sh, SK.ball(.03, 6, 5), sigilMat, [0, 0, 0]); if (k === 0) limbs['backArm' + (sd < 0 ? 'L' : 'R')] = sh; }));
  for (const sd of [1, -1]) for (let k = 0; k < 7; k++) { const gl = k % 3 === 0 ? SK.torus(.018, .004, 4, 8, Math.PI * (1 + (k % 2) * .5)) : new THREE.BoxGeometry(.006, .03 + (k % 2) * .02, .006);
    add(B.spine, gl, runeMat, [sd * .115, .02 + (k % 3) * .025, -.12 + k * .06], [0, sd * Math.PI / 2, k * .7]); }
  const eyeGl=new THREE.PointLight(d.eyeCol,1.6,3.5);
  eyeGl.position.set(0, .70*sc, 1.05*sc);
  g.add(eyeGl);
  limbs.sigilTrace = sigilMat;
  limbs.sigilMeshes = sigilMeshes;
  const auraGl=new THREE.PointLight(d.light, 2.2, 9);
  auraGl.position.set(0, .6*sc, 0);
  g.add(auraGl);
  // HP bar — hidden in-world for bosses (HUD takes over) but kept on the
  // mesh for tick-update parity with regular zone enemies. Bar Y is higher
  // for the wolf scale — body tops out around 1.0*sc, ears reach 0.92*sc.
  const barY = 1.35*sc;
  const hpBg=new THREE.Mesh(new THREE.PlaneGeometry(.6,.07),new THREE.MeshBasicMaterial({color:0x440000,side:THREE.DoubleSide}));
  hpBg.position.set(0,barY,.01); hpBg.visible=false; g.add(hpBg);
  const hpFg=new THREE.Mesh(new THREE.PlaneGeometry(.6,.07),new THREE.MeshBasicMaterial({color:0x22dd22,side:THREE.DoubleSide}));
  hpFg.position.set(0,barY,.02); hpFg.visible=false; g.add(hpFg);
  limbs.hpBg = hpBg;
  return {g, hpFg, hpBg, limbs};
}

// v61c2 — spawnFaolchu: place the boss in burned Ashenmoor's village square.
// Idempotent: if the boss is already alive in ZE, returns it; if defeated,
// returns null. Called from:
//   - the burn trigger (immediate spawn after ashenmoorBurned flips true)
//   - overworld zone-entry resync (handles the case where the player saved
//     mid-fight, reloaded, and ZE was rebuilt; the boss should respawn
//     from full HP since ZE state isn't serialized)
//
// Position: village square area, ~(32, 32) — north of Bram's body at the
// forge (25.5, 21.5), roughly at the notice board (30.7, 30). The player
// enters the burned village from the south at (28, 78) facing north and
// walks past Bram's body before encountering the boss in the square.
// S270 — Bram's body, lifted out of buildAshenmoorBurned so the world's Ashenmoor lays the same one at its forge.
// `zone` is the corpse's zone for the interact check ('overworld' in the legacy zone, 'world' in the open world).
function buildBramBody(sc,bramX,bramY,bramZ,zone){
    // Body — prone: flattened torso + head + one visible arm + boots
    const bodyMat = new THREE.MeshLambertMaterial({color:0x3a2820}); // dark tunic
    const skinMat = new THREE.MeshLambertMaterial({color:0x7a5a42});
    const bootMat = new THREE.MeshLambertMaterial({color:0x221812});
    const bram = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45,0.22,0.95),bodyMat);
    torso.position.set(0, 0.11, 0);
    bram.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16,10,8),skinMat);
    head.position.set(0, 0.14, -0.55); // head facing north (Bram fell looking toward the village)
    bram.add(head);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,0.55),bodyMat);
    armR.position.set(0.26, 0.08, 0.12);
    armR.rotation.y = -0.3; // splayed slightly
    bram.add(armR);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,0.55),bodyMat);
    armL.position.set(-0.24, 0.08, -0.05);
    armL.rotation.y = 0.15;
    bram.add(armL);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.14,0.7),bodyMat);
    legR.position.set(0.11, 0.08, 0.6);
    bram.add(legR);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.14,0.7),bodyMat);
    legL.position.set(-0.11, 0.08, 0.65);
    bram.add(legL);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.16,0.12,0.2),bootMat);
    boot.position.set(0.11, 0.06, 0.95);
    bram.add(boot);

    // Goblin axe stuck in the ground at his right hand — iconography for "weapon
    // in hand" even though he's fallen. Slight tilt as if dropped.
    const axeHandleMat=new THREE.MeshLambertMaterial({color:0x3a2818});
    const axeHeadMat=new THREE.MeshLambertMaterial({color:0x504840});
    const axeGroup=new THREE.Group();
    const axeHandle=new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,0.7,6),axeHandleMat);
    axeHandle.rotation.z = 0.35;
    axeGroup.add(axeHandle);
    const axeHead=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.18,0.06),axeHeadMat);
    axeHead.position.set(0.15,0.28,0);
    axeHead.rotation.z = 0.35;
    axeGroup.add(axeHead);
    axeGroup.position.set(0.45, 0.0, 0.15);
    bram.add(axeGroup);

    bram.position.set(bramX, bramY, bramZ);
    bram.rotation.y = 0.2; // slightly skewed
    sc.add(bram);

    // Subtle glow so the body is visible from a few meters out — dim, warm,
    // not a shiny-loot-drop vibe. Just enough that the player notices from the
    // gate path.
    const bramGl = new THREE.PointLight(0xaa7733, 0.6, 4);
    bramGl.position.set(bramX, bramY+0.4, bramZ);
    sc.add(bramGl);

    // Register in ZONE_CORPSES so the standard E-to-interact pipeline kicks in.
    // items = [hammer]; looted = false; custom flag bramBody = true so the
    // interaction layer can show flavor text on first read (one-shot via
    // worldState.bramBodyRead) before opening the loot panel.
    //
    // v61ad: hammer-respawn guard. ZONE_CORPSES isn't serialized across saves,
    // so on a reload into the already-burned state the builder would otherwise
    // drop a fresh hammer at Bram's body on every load. Before seeding the
    // items array, check if the player already carries (equipped or bagged)
    // The Forge-Man's Hammer — if so, the body is just a body, no loot.
    const _hasHammer = (EQ.weapon && EQ.weapon.name==="The Forge-Man's Hammer")
                    || BAG.some(b=>b && b.name==="The Forge-Man's Hammer");
    const _bramItems = _hasHammer ? [] : [{
        name:"The Forge-Man's Hammer",
        ico:'🔨',
        type:'equip',
        slot:'weapon',
        unique:true,
        weaponShape:'mace',
        weaponType:'Mace',
        wType:'blunt',
        tier:3,
        material:'Iron',
        matCol:0x6a6862,
        atk:[11,17],
        weight:5,
        buyPrice:0, sellMult:0,
        reqAttr:'might', reqVal:8,
        mightBonus:2,
        desc:"The last hammer Bram forged. Heavier than a warhammer should be and better-balanced than it has any right to be. The grip still smells of his forge.",
      }];
    ZONE_CORPSES.push({
      x:bramX, z:bramZ, y:bramY,
      name:'Bram', displayName:'Bram',
      items:_bramItems,
      gl:bramGl, spark:null, age:0, scene:sc, zone, looted:_hasHammer,
      bramBody:true, // marker — interaction layer shows flavor text on first read
      corpseId:'bram', // v61al: marker-iterator lookup key (Q7 obj 1 read_corpse)
      // v61ae: axe mesh reference so takeLootItem can remove it when the hammer
      // is taken. parent is `bram`, not the top-level scene.
      bramAxe:axeGroup, bramGroup:bram,
    });
    // v61ae: if the player already has the hammer on reload, the axe should
    // ALSO be absent — otherwise the scene re-renders an axe that was already
    // "taken" on a previous session. Matches the items:[] guard above.
    if(_hasHammer){
      bram.remove(axeGroup);
    }
}

// S270 — the Faolchú built at a point in a scene, for the legacy zone and for the world's Ashenmoor alike.
function faolchuAt(sc, sx, sz, ey){
  const d = BOSSES.Faolchu;
  const {g, hpFg, hpBg, limbs} = buildFaolchuMesh(d);
  g.position.set(sx, ey, sz);
  sc.add(g);
  // Aura point light — separate light for ground-glow (mesh has its own
  // body-aura light internally; this one sits at ground level for the
  // village-floor red wash).
  const el = new THREE.PointLight(d.light, 0.9, 6);
  el.position.set(sx, ey+0.6, sz);
  sc.add(el);
  // Construct the ZE entry. Mirrors buildZoneEnemy's enemy shape so
  // tickZoneEnemies / killZoneEnemy / attackZoneEnemies all work without
  // a separate boss tick path. Boss-specific fields (isBoss, phase, etc)
  // are read on top of the standard fields in the few branches that care.
  const e = {
    x:sx, z:sz, hp:d.hp, maxHp:d.hp,
    homeX:sx, homeZ:sz,
    name:d.displayName, displayName:d.displayName,
    mesh:g, hpFg, hpBg, limbs, el,
    spd:d.spd, dmg:d.dmg, atk:d.atk, atkSpd:d.atk, atkCd:0,
    xpVal:d.xpVal,
    dead:false, alert:false, locked:false,
    walkT:Math.random()*Math.PI*2,
    ph:Math.random()*Math.PI*2, path:[], pathT:0,
    ranged:false, telegraphT:0, telegraphMax:0,
    def:d.def||0, resist:d.resist||{},
    variant:'boss', xpMult:1,
    baseType:'Faolchu',
    _origCol:d.col,
    // Boss-specific
    isBoss:true,
    bossId:d.bossId,
    bossDef:d,
    phaseId:1, // current phase, advances on threshold cross
    sigilPulseT:Math.random()*Math.PI*2, // independent pulse phase for sigil glow
    // v61c4 — Caor fireball cooldown. Boss spits a tine projectile every
    // ~10s when alert + line-of-sight. Initial cooldown is 5s so the boss
    // doesn't fire immediately on engage (gives the player a chance to
    // close to melee first). Telegraph builds through caorChargeT.
    caorCd: 5.0,
    caorChargeT: 0, // counts up during wind-up; fires when reaches caorChargeMax
    caorChargeMax: 0,
  };
  // v61gj — Posture init for the boss. bossId 'faolchu' resolves to 2.5× family
  // mult against the boss's 2000 maxHp → 2500 posture. So 100 posture damage from
  // a power swing = 25 power hits to break, or proportionally more normal swings.
  // Posture-break gives a 1.5s stagger window — meaningful, but not trivial to repeat.
  if(limbs.wolf)limbs.wolf.e=e; // S211 — the wolf body strides by the boss's own position
  initPosture(e);
  return e;
}

function spawnFaolchu(){
  if(worldState.faolchuDefeated) return null;
  if(activeZoneId !== 'overworld') return null;
  if(!worldState.ashenmoorBurned) return null;
  // Idempotency: if a Faolchú is already in ZE (alive or dead), don't
  // double-spawn. The 'dead' branch shouldn't happen since faolchuDefeated
  // would be true in that case, but defensive.
  if(ZE && ZE.find(e=>e && e.isBoss && e.bossId==='faolchu')) return null;
  // Spawn position — village square, north of Bram's forge. Slight
  // randomization within ~0.5u so the boss isn't on the exact same patrol
  // tile every reload (visual variety only; doesn't affect fight).
  const sx = 32 + (Math.random()-0.5)*0.6;
  const sz = 32 + (Math.random()-0.5)*0.6;
  const ey = (typeof activeTerrainH==='function') ? activeTerrainH(sx,sz) : 0;
  // Add to the active overworld scene. After the burn fires,
  // ZONE_BUILDERS.overworld.sceneGet returns owBurnedScene; before, owScene.
  const sc = (typeof owBurnedScene!=='undefined' && owBurnedScene)
             ? owBurnedScene
             : owScene;
  const e = faolchuAt(sc, sx, sz, ey);
  ZE.push(e);
  // Also push into ZONES.overworld.enemies so a zone re-entry that re-reads
  // the array doesn't lose the reference. ZE is a reference to that array
  // (set in goToZone), so this is the same array — but defensive in case
  // anything else clobbers ZE.
  if(typeof ZONES!=='undefined' && ZONES.overworld && ZONES.overworld.enemies && ZONES.overworld.enemies !== ZE){
    ZONES.overworld.enemies.push(e);
  }
  if(typeof addLog==='function') addLog('🐺','Something is moving in the ruins.');
  return e;
}

// v61c2 — despawnFaolchu: removes the boss from ZE + scene. Currently used
// only by the debug helper for resetting a fight. Normal flow is
// killZoneEnemy → corpse stays in ZE for loot, faolchuDefeated flag flips.
function despawnFaolchu(){
  if(typeof ZE==='undefined') return;
  for(let i=ZE.length-1; i>=0; i--){
    const e = ZE[i];
    if(!e || !e.isBoss || e.bossId!=='faolchu') continue;
    if(e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh);
    if(e.el && e.el.parent) e.el.parent.remove(e.el);
    ZE.splice(i,1);
  }
  if(typeof ZONES!=='undefined' && ZONES.overworld && ZONES.overworld.enemies){
    const arr = ZONES.overworld.enemies;
    for(let i=arr.length-1; i>=0; i--){
      const e = arr[i];
      if(e && e.isBoss && e.bossId==='faolchu') arr.splice(i,1);
    }
  }
}

// v61c4 — spawnLesserFaolchu: spawns a smaller Faolchú add at the boss's
// current position (offset randomly so they don't stack). Called from the
// phase 2 / phase 3 entry hooks. Adds use the same wolf mesh at scale 0.7
// (so they read as "kin of the boss" — same silhouette, smaller, dimmer
// sigils). They follow normal zone-enemy AI, no phase machine, no special
// attacks, no boss healthbar HUD. Tagged with isLesserFaolchu so they can
// be swept on boss defeat.
//
// Stat budget: ~1/8 the boss's HP, ~1/2 the boss's damage. At HP 125 they
// die in 2-3 hits from a level 6 player; their threat is positional —
// they break the line-of-sight tunneling on the boss and force the player
// to choose targets.
function spawnLesserFaolchu(parentBoss){
  if(activeZoneId !== 'overworld' && activeZoneId !== 'world') return null; // S271 — and in the world's burnt Ashenmoor
  if(typeof ZE === 'undefined') return null;
  if(parentBoss && parentBoss.dead) return null;
  // Pick a spawn offset around the boss — random angle, ~3u out so the
  // add doesn't materialize on top of the player or the boss.
  const baseX = parentBoss ? parentBoss.x : 32;
  const baseZ = parentBoss ? parentBoss.z : 32;
  const ang = Math.random() * Math.PI * 2;
  const dist = 2.5 + Math.random() * 1.0;
  const sx = baseX + Math.cos(ang) * dist;
  const sz = baseZ + Math.sin(ang) * dist;
  // Lesser stat block — quarter HP, half damage, slightly slower than boss.
  // v61c5 — HP 125 → 250 after playtest showed lessers dying in a single
  // weapon swing for a tooled-up player, which made the phase-add mechanic
  // feel cosmetic. 250 lands ~3-5 melee hits for a level 6+ player, so the
  // adds actually exert positional pressure during the fight.
  // v61c9 — Speed 3.4 → 5.0. Lessers now outrun BOTH the boss (4.0) and
  // the player sprint (4.69). Repositioned as the "harasser" role —
  // they catch up first, force the player to engage them while the boss
  // closes more slowly. Player can no longer kite them with sprint;
  // they have to be killed or actively dodged. Pairs with the 250 HP
  // (3-5 hits) so the fight stays winnable — they're glass-cannon
  // pressure pieces, not bullet sponges.
  const lesserDef = {
    col:0x5a3828, hp:250, spd:5.0, scale:1.10,
    dmg:14, atk:1.2, xpVal:120,
    eyeCol:0xff2200, light:0xff3a14,
    def:1,
    resist:{ solas:0.5, tine:0.8, blunt:1.25 },
  };
  const {g, hpFg, hpBg, limbs} = buildFaolchuMesh(lesserDef);
  // Dim the sigil glow on adds so they're visually subordinate to the boss
  if(limbs.sigilTrace && limbs.sigilTrace.color){
    limbs.sigilTrace.color.setRGB(0.65, 0.10, 0.05);
  }
  const ey = (typeof activeTerrainH==='function') ? activeTerrainH(sx,sz) : 0;
  g.position.set(sx, ey, sz);
  const sc = (parentBoss && parentBoss.mesh && parentBoss.mesh.parent) // S271 — the boss's own scene (the world's, in the world)
             || ((typeof owBurnedScene!=='undefined' && owBurnedScene)
             ? owBurnedScene
             : owScene);
  sc.add(g);
  const el = new THREE.PointLight(lesserDef.light, 0.6, 4);
  el.position.set(sx, ey+0.5, sz);
  sc.add(el);
  // ZE entry — mirrors regular zone enemy shape. NOT marked isBoss; gets
  // standard tick path + standard HP bar (which the buildFaolchuMesh
  // hides via the isBoss check, but we override that for adds since
  // we DO want to see their HP). World-space HP bar shows.
  hpBg.visible = true;
  hpFg.visible = true;
  const e = {
    x:sx, z:sz, hp:lesserDef.hp, maxHp:lesserDef.hp,
    homeX:sx, homeZ:sz,
    name:'Lesser Faolchú', displayName:'Lesser Faolchú',
    mesh:g, hpFg, hpBg, limbs, el,
    spd:lesserDef.spd, dmg:lesserDef.dmg, atk:lesserDef.atk, atkSpd:lesserDef.atk, atkCd:0.5,
    xpVal:lesserDef.xpVal,
    dead:false, alert:true, locked:false,
    walkT:Math.random()*Math.PI*2,
    ph:Math.random()*Math.PI*2, path:[], pathT:0,
    ranged:false, telegraphT:0, telegraphMax:0,
    def:lesserDef.def||0, resist:lesserDef.resist||{},
    variant:'lesser', xpMult:1,
    baseType:'LesserFaolchu',
    _origCol:lesserDef.col,
    isLesserFaolchu:true, // marker for despawn-on-boss-death sweep
  };
  // v61gj — Lesser Faolchú posture. baseType 'LesserFaolchu' doesn't match the
  // family map directly, but enemyPostureFamily falls back to name-matching;
  // "Lesser Faolchú" contains no family keywords so it lands on humanoid default.
  // Stamp shape:'wolf' so it resolves to the wolf entry (0.8×) — appropriate for
  // a small fast canine add. Boss stays at faolchu (2.5×) for its bossId path.
  if(limbs.wolf)limbs.wolf.e=e;
  e.shape = 'wolf';
  initPosture(e);
  ZE.push(e);
  if(activeZoneId==='overworld' && typeof ZONES!=='undefined' && ZONES.overworld && ZONES.overworld.enemies && ZONES.overworld.enemies !== ZE){
    ZONES.overworld.enemies.push(e);
  }
  return e;
}

// v61c4 — despawnLesserFaolchus: sweep ZE removing all lesser-Faolchú
// adds. Called from killZoneEnemy when the boss dies, so the fight
// resolves cleanly even if 1-2 lessers are still alive. Adds disappear
// in a small puff of red light to sell "the binding that held you here
// just dissolved with its source."
function despawnLesserFaolchus(){
  if(typeof ZE === 'undefined') return;
  for(let i=ZE.length-1; i>=0; i--){
    const e = ZE[i];
    if(!e || !e.isLesserFaolchu) continue;
    // Despawn flash — brief red flicker via the eye-aura light, then remove
    if(e.el){ e.el.intensity = 4; e.el.distance = 6; }
    setTimeout(()=>{
      if(e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh);
      if(e.el && e.el.parent) e.el.parent.remove(e.el);
    }, 180);
    e.dead = true;
    ZE.splice(i,1);
  }
  if(typeof ZONES!=='undefined' && ZONES.overworld && ZONES.overworld.enemies){
    const arr = ZONES.overworld.enemies;
    for(let i=arr.length-1; i>=0; i--){
      const e = arr[i];
      if(e && e.isLesserFaolchu) arr.splice(i,1);
    }
  }
}

// ── FAOLCHÚ DEATH BURST (v61d1) ──────────────────────────────────────────
// "Bursts apart at the sigil-seams" — the lore-canonical death visual. The
// six sigil-trace strips on the boss discharge as a particle burst when
// the binding releases its hold on the failed-antibody form. Particles fly
// outward from each seam location with randomized velocity, rotate as they
// travel, and fade to nothing over ~0.85s. Coordinated with the existing
// audio sequence: sndFaolchuDeath kicks off at boss death (initial crack +
// stuttering unmaking + descending wail at 700ms-1900ms), the burst fires
// in parallel and resolves before the loot reveal chime at 1800ms.
//
// Active bursts are held in `_faolchuDeathBursts` and ticked from the main
// overworld branch alongside tickBurnedSmoke. One-shot per boss death; the
// boss is the only entity that uses this system, so the array is typically
// empty or has at most one active burst.
const _faolchuDeathBursts = [];

// Spawn a particle burst from a Faolchú-shape boss/lesser. Reads the six
// sigil meshes from boss.limbs.sigilMeshes, captures their world positions
// at call time (so rotation from the corpse-pose set in killZoneEnemy is
// already applied — the bursts emerge from where the seams are visually),
// emits ~6 shards per seam, and queues a tick entry that fades opacity +
// rotates particles + ramps each sigil's color toward black over 0.5s.
function spawnFaolchuDeathBurst(boss, sc){
  if(!boss || !boss.limbs || !boss.limbs.sigilMeshes || !sc) return;
  const sigilMeshes = boss.limbs.sigilMeshes;
  if(!sigilMeshes.length) return;
  // v61d2 — Refresh the boss group's world matrix before reading sigil
  // world positions. killZoneEnemy mutates boss.mesh.rotation.z (corpse
  // pose) and boss.mesh.position (terrainY+0.15) just before this spawn
  // fires, but the matrixWorld doesn't recompute until the next render
  // frame. Without this update, sigilMesh.getWorldPosition() walks
  // through the parent's STALE matrixWorld and returns positions from
  // the upright pre-rotation pose — which puts shards roughly 1.4m
  // above the corpse, off-camera if the player is looking down. The
  // recursive `true` flag refreshes children too, so each sigil's
  // matrixWorld is fresh by the time getWorldPosition() reads it.
  // v61d1 had this bug — particles spawned but at wrong positions, so
  // playtest reported "no visible burst" since the cloud was off-screen.
  if(boss.mesh && typeof boss.mesh.updateMatrixWorld === 'function'){
    boss.mesh.updateMatrixWorld(true);
  }
  // Shared shard material — single MeshBasicMaterial across all particles
  // in this burst so the per-frame opacity fade is a single property write.
  const shardMat = new THREE.MeshBasicMaterial({
    color:0xff2010, transparent:true, opacity:1.0,
  });
  const particles = [];
  const velocities = [];
  const rotSpeeds = [];
  const SHARDS_PER_SIGIL = 6;
  // Reusable Vector3 for getWorldPosition — three.js writes into the target.
  const _wp = new THREE.Vector3();
  for(const sm of sigilMeshes){
    if(!sm) continue;
    sm.getWorldPosition(_wp);
    const ox = _wp.x, oy = _wp.y, oz = _wp.z;
    for(let i=0; i<SHARDS_PER_SIGIL; i++){
      // Small flat shard. Slightly randomized size so the cloud reads as
      // organic rather than a uniform spray of identical pixels.
      const w = 0.04 + Math.random()*0.03;
      const h = 0.06 + Math.random()*0.04;
      const d = 0.018 + Math.random()*0.012;
      const shard = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), shardMat);
      shard.position.set(ox, oy, oz);
      shard.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
      sc.add(shard);
      particles.push(shard);
      // Velocity: random direction biased outward from the boss center, with
      // a slight upward component so the burst arcs UP before drag stalls
      // it. Magnitude 1.5-2.6 u/s — enough to clear the body's silhouette
      // but not so fast the particles fly off-camera before fading.
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.3) * Math.PI; // bias toward +y
      const speed = 1.5 + Math.random() * 1.1;
      velocities.push({
        x: Math.cos(theta) * Math.cos(phi) * speed,
        y: Math.abs(Math.sin(phi) * speed) + 0.4, // floor ensures upward bias
        z: Math.sin(theta) * Math.cos(phi) * speed,
      });
      rotSpeeds.push({
        x: (Math.random()-0.5) * 6,
        y: (Math.random()-0.5) * 6,
        z: (Math.random()-0.5) * 6,
      });
    }
  }
  // Capture each sigil mesh's current material + color so the fade-to-black
  // can be undone if needed (it isn't — but leaving the structure clean for
  // future reuse). The sigil material was already cloned in killZoneEnemy's
  // dim-traverse, so each mesh has its own material reference here.
  const sigilMats = [];
  const sigilOrigCols = [];
  for(const sm of sigilMeshes){
    if(sm && sm.material && sm.material.color){
      sigilMats.push(sm.material);
      sigilOrigCols.push({
        r: sm.material.color.r,
        g: sm.material.color.g,
        b: sm.material.color.b,
      });
    }
  }
  _faolchuDeathBursts.push({
    particles, velocities, rotSpeeds, mat: shardMat,
    sigilMats, sigilOrigCols,
    t: 0, dur: 0.85, scene: sc,
  });
}

// Per-frame advance for active death bursts. Called from the overworld
// branch of the main render loop (alongside tickBurnedSmoke). Cheap when
// idle — early-out if the bursts array is empty (typical case). Each
// burst lives for `dur` seconds; once expired, particles are removed
// from the scene, geometries disposed, and the entry is spliced.
function tickFaolchuDeathBursts(dt){
  if(!_faolchuDeathBursts.length) return;
  for(let bi = _faolchuDeathBursts.length - 1; bi >= 0; bi--){
    const b = _faolchuDeathBursts[bi];
    b.t += dt;
    const u = Math.min(1, b.t / b.dur);
    // Particle motion + rotation + drag. Drag (×0.94 per tick at ~60fps,
    // applied as Math.pow(0.94, dt*60) for frame-rate independence) keeps
    // particles from flying off-camera; they slow visibly as they fade.
    const drag = Math.pow(0.94, dt * 60);
    for(let i=0; i<b.particles.length; i++){
      const p = b.particles[i];
      const v = b.velocities[i];
      const r = b.rotSpeeds[i];
      p.position.x += v.x * dt;
      p.position.y += v.y * dt;
      p.position.z += v.z * dt;
      v.x *= drag; v.y *= drag; v.z *= drag;
      // Subtle gravity drift — not free-fall, just a hint of weight so the
      // upward-arc pieces fall back as they slow. -0.6 u/s² — visible but
      // gentle, doesn't yank particles down before they fade.
      v.y -= 0.6 * dt;
      p.rotation.x += r.x * dt;
      p.rotation.y += r.y * dt;
      p.rotation.z += r.z * dt;
    }
    // Shared opacity fade — one material write per frame for the whole
    // burst, regardless of particle count.
    b.mat.opacity = 1 - u;
    // Sigil fade — 0.5s window (dur*0.59), faster than the particle fade.
    // Lerps each sigil's color from its original toward black.
    const sigilU = Math.min(1, b.t / 0.5);
    const sigilK = 1 - sigilU;
    for(let i=0; i<b.sigilMats.length; i++){
      const sm = b.sigilMats[i];
      const oc = b.sigilOrigCols[i];
      if(sm && sm.color && oc){
        sm.color.setRGB(oc.r * sigilK, oc.g * sigilK, oc.b * sigilK);
      }
    }
    if(u >= 1){
      // Cleanup — remove particles from scene, dispose geometries, drop the
      // shared material once. Splice burst entry from the active list.
      for(const p of b.particles){
        if(p && p.parent) p.parent.remove(p);
        if(p && p.geometry) p.geometry.dispose();
      }
      if(b.mat) b.mat.dispose();
      _faolchuDeathBursts.splice(bi, 1);
    }
  }
}


// ═══ CREATURES, SECOND PASS (Session 130) ═══════════════════════════
// Shapes of their own for the spider family and the dragon, arm pivots on
// the world's humanoids, and one attack pose shared by the world and the
// dungeon: the body pulls back and the arm (or tail) rises through the
// wind-up, then lunges and swings through the strike.
function zShapeExtra(type,d,g,mat,sc2,limbs){
  const M=c=>new THREE.MeshLambertMaterial({color:c});const dark=new THREE.Color(d.col).multiplyScalar(.7).getHex();const light=new THREE.Color(d.col).multiplyScalar(1.25).getHex();
  const box=(w,h,dp,m,x,y,z,parent)=>{const mm=new THREE.Mesh(new THREE.BoxGeometry(w*sc2,h*sc2,dp*sc2),m||mat);mm.position.set(x*sc2,y*sc2,z*sc2);(parent||g).add(mm);return mm;};
  const piv=(x,y,z,parent)=>{const p=new THREE.Group();p.position.set(x*sc2,y*sc2,z*sc2);(parent||g).add(p);return p;};
  // a jointed leg: a pivot at the hip, an upper segment out and up, a knee, a lower segment down to the ground
  const jointedLeg=(s,x,y,z,up,down,spread,lift)=>{const hip=piv(x,y,z);hip.rotation.y=spread;hip.rotation.z=s*lift;const u=new THREE.Mesh(new THREE.CylinderGeometry(.022*sc2,.028*sc2,up*sc2,4),mat);u.rotation.z=s*Math.PI/2;u.position.x=s*up/2*sc2;hip.add(u);const knee=piv(s*up,0,0,hip);knee.rotation.z=-s*(lift+1.2);const l=new THREE.Mesh(new THREE.CylinderGeometry(.014*sc2,.024*sc2,down*sc2,4),new THREE.MeshLambertMaterial({color:dark}));l.rotation.z=s*Math.PI/2;l.position.x=s*down/2*sc2;knee.add(l);return hip;};
  if(type==='Sand Scorpion'&&!SPIDER_KINDS[type]){
    box(.5,.16,.62,mat,0,.16,0);box(.4,.06,.56,M(light),0,.25,0);for(let i=0;i<4;i++)box(.44,.02,.06,M(dark),0,.26,-.2+i*.13);
    box(.24,.12,.2,mat,0,.15,.38);box(.12,.03,.02,new THREE.MeshBasicMaterial({color:d.eyeCol}),0,.2,.48);
    for(const s of [-1,1])for(let i=0;i<4;i++)jointedLeg(s,s*.24,.14,.2-i*.14,.22,.2,0,.45);
    // claws: a pivot at the shoulder, an arm forward, a pincer
    for(const s of [-1,1]){const sh=piv(s*.2,.16,.36);sh.rotation.y=-s*.35;box(.09,.08,.3,mat,0,0,.15,sh);const p=piv(0,0,.3,sh);box(.14,.07,.18,M(light),0,0,.09,p);const jaw=box(.05,.05,.16,M(light),s*.06,0,.24,p);jaw.rotation.y=s*.5;box(.05,.05,.16,M(light),-s*.05,0,.22,p);limbs['claw'+(s<0?'L':'R')]=sh;}
    // the tail: segments curling up and over, a sting at the end; the root pivot swings it
    let parent=piv(0,.2,-.3);limbs.tail=parent;parent.rotation.x=-.9;
    for(let i=0;i<4;i++){box(.1-i*.012,.1-i*.012,.18,i%2?M(dark):mat,0,0,.09,parent);const nx=piv(0,0,.17,parent);nx.rotation.x=-.55;parent=nx;}
    const st=new THREE.Mesh(new THREE.ConeGeometry(.04*sc2,.16*sc2,5),M(0x2a2018));st.rotation.x=Math.PI/2;st.position.z=.06*sc2;parent.add(st);
    return true;}
  if(type==='Bog Crawler'&&!SPIDER_KINDS[type]){
    const body=new THREE.Mesh(new THREE.SphereGeometry(.28*sc2,8,6),mat);body.scale.set(1.2,.5,1);body.position.y=.16*sc2;g.add(body);
    box(.5,.05,.4,M(dark),0,.27,-.02);box(.12,.04,.02,new THREE.MeshBasicMaterial({color:d.eyeCol}),0,.2,.3);
    for(const s of [-1,1]){const m=box(.04,.04,.14,M(light),s*.07,.12,.34);m.rotation.y=-s*.4;}
    for(const s of [-1,1])for(let i=0;i<3;i++)jointedLeg(s,s*.28,.12,.16-i*.16,.2,.16,(i-1)*.45,.3);
    return true;}
  if(type==='Shore Wisp'){ // S224 — a cold light over the tide line (Michael's B on Session 214, as shown): a white core in layered
    // blue haloes, three motes circling (attackPose's hover moves them), a tail of fading light behind it. Unlit and additive.
    const u=sc2/.6,glow=(r,c,o,x,y,z,seg)=>{const m=new THREE.Mesh(SK.ball(r*u,seg||12,seg?Math.max(4,seg-3):9),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false}));m.position.set(x*u,y*u,z*u);g.add(m);return m;};
    limbs.body=glow(.07,0xffffff,1,0,.8,0);glow(.13,0xa8e0ff,.5,0,.8,0);glow(.26,0x60b0ff,.16,0,.8,0);glow(.42,0x4090e0,.06,0,.8,0);
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2;glow(.035,0xffffff,.8,Math.cos(a)*.32,.8+Math.sin(a)*.12,Math.sin(a)*.32,8)._mote=a;}
    for(let i=1;i<=8;i++)glow(.1*(1-i/10),0x80c8ff,.35*(1-i/9),Math.sin(i*.6)*.06*i,.8-i*.06,-i*.07,8);
    g._hover=true;return true;}
  if(type==='Dragon'){
    const S=M(d.col),B=M(0x9a6a3a),H=M(0xe0d0b0),W=new THREE.MeshLambertMaterial({color:new THREE.Color(d.col).multiplyScalar(.8).getHex(),side:THREE.DoubleSide});
    box(.7,.5,1.4,S,0,.75,0);box(.5,.16,1.2,B,0,.5,0);for(let i=0;i<5;i++){const sp=new THREE.Mesh(new THREE.ConeGeometry(.06*sc2,.16*sc2,4),H);sp.position.set(0,1.05*sc2,(.5-i*.25)*sc2);g.add(sp);}
    let n=piv(0,.9,.65);limbs.neck=n;n.rotation.x=-.5;for(let i=0;i<3;i++){box(.3-i*.04,.3-i*.04,.36,S,0,0,.18,n);const nx=piv(0,0,.34,n);nx.rotation.x=.25;n=nx;}
    const hd=box(.32,.26,.5,S,0,.02,.22,n);box(.24,.1,.36,B,0,-.1,.3,n);limbs.head=n;box(.16,.03,.02,new THREE.MeshBasicMaterial({color:d.eyeCol}),0,.1,.46,n);
    for(const s of [-1,1]){const h=new THREE.Mesh(new THREE.ConeGeometry(.04*sc2,.24*sc2,4),H);h.position.set(s*.1*sc2,.2*sc2,.08*sc2);h.rotation.x=-.9;n.add(h);}
    for(const s of [-1,1]){const w=piv(s*.3,.95,0);const wing=new THREE.Mesh(new THREE.PlaneGeometry(1.6*sc2,.9*sc2),W);wing.position.set(s*.8*sc2,0,-.1*sc2);wing.rotation.x=-.2;w.add(wing);const bone=box(1.6,.06,.06,S,s*.8,.42,0,w);w._wing=s;limbs['wing'+(s<0?'L':'R')]=w;}
    for(const [s,f] of [[-1,1],[1,1],[-1,-1],[1,-1]]){box(.18,.5,.2,S,s*.3,.3,f*.45);box(.22,.08,.28,M(0x3a2018),s*.3,.04,f*.45+.03);}
    let t=piv(0,.7,-.7);limbs.tail=t;for(let i=0;i<5;i++){box(.24-i*.035,.2-i*.03,.36,S,0,0,-.18,t);const nx=piv(0,0,-.34,t);nx.rotation.x=.08;t=nx;}
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.08*sc2,.3*sc2,4),H);tip.rotation.x=-Math.PI/2;tip.position.z=-.12*sc2;t.add(tip);
    limbs.armR=limbs.head;return true;}
  return false;
}
// the shared pose. wind 0→1 through the telegraph, strike 0→1 through the lunge
function enemyArm(e){const L=e&&e.limbs;if(!L)return null;if(!Array.isArray(L))return L.armR||L.tail||L.armL||null;const a=L[0];return a?(a.rotation?a:a[0]):null;}
function attackPose(e,inDungeon){
  const w=e._wind||0;const st=inDungeon?(e.atkAnim>0?e.atkAnim/.35:0):(e._lunge!=null?Math.max(0,e._lunge)/.3:0);const s=Math.sin(st*Math.PI);
  const arm=enemyArm(e);const isTail=e.limbs&&!Array.isArray(e.limbs)&&arm===e.limbs.tail;
  if(arm&&arm.rotation){if(isTail){arm.rotation.x=(e._tailBase!=null?e._tailBase:(e._tailBase=arm.rotation.x))-w*.45+s*1.1;}else{arm.rotation.x=w*1.4-s*1.3;}}
  if(e.mesh&&(!arm||isTail)&&!(e.limbs&&e.limbs.wolf)){const lean=-w*.22+s*.18;if(inDungeon)e.mesh.rotateX(lean);else e.mesh.rotation.x=lean;}
  if(e.mesh&&e.mesh._hover){const t=performance.now()*.003;e.mesh.position.y=(e.baseY||e.mesh.position.y-Math.sin(t-.05)*.08)+Math.sin(t)*.08;e.mesh.children.forEach(c=>{if(c._mote!=null){c.position.x=Math.cos(t+c._mote)*.3*(e.mesh.scale.x||1);c.position.z=Math.sin(t+c._mote)*.3;}});}
}
function buildZoneEnemy(sc,sol,x,z,type,variantKey,zOpts){
  const ZDEF={
    // v59: minLevel gates zone enemies the same way dungeon enemies are gated. Below-gate enemies
    // still spawn their full data structure, but are flagged `locked` — mesh hidden, AI + collision
    // skipped — until the player reaches minLevel. On first tick past the gate, they unlock and appear.
    // This lets a zone built at level 1 still produce Forest Trolls and Bandits once the player grows.
    Wolf:           {minLevel:1, col:0x706058,eyeCol:0xddaa44,hp:18, maxHp:18, spd:1.6,dmg:5, atk:1.4, xpVal:12, scale:.75,shape:'wolf',     def:1, resist:{tine:1.35}},
    Spider:         {minLevel:1, col:0x282030,eyeCol:0xff2200,hp:12, maxHp:12, spd:1.4,dmg:4, atk:1.2, xpVal:8,  scale:.60,shape:'spider',   def:0, resist:{tine:1.5, scath:0.7, pierce:1.2, blunt:1.1}},
    'Forest Troll': {minLevel:2, col:0x3a5030,eyeCol:0xff4400,hp:35, maxHp:35, spd:.7, dmg:9, atk:1.6, xpVal:30, scale:1.2,shape:'brute',    def:3, resist:{tine:1.5, cloch:0.7, blunt:1.2}},
    Bandit:         {minLevel:2, col:0x604828,eyeCol:0xcc8822,hp:25, maxHp:25, spd:1.2,dmg:7, atk:1.3, xpVal:20, scale:1.0,shape:'humanoid', def:2, resist:{}},
    // v80 — regional encounter types for the streamed world.
    'Cave Bear':    {minLevel:4, col:0x4a3a2a,eyeCol:0xffc860,hp:60, maxHp:60, spd:.9, dmg:12,atk:1.8, xpVal:55, scale:1.35,shape:'brute',   def:4, resist:{blunt:0.8, pierce:1.15}},
    'Ash Hound':    {minLevel:4, col:0x5a5048,eyeCol:0xff5020,hp:28, maxHp:28, spd:1.9,dmg:8, atk:1.2, xpVal:26, scale:.8, shape:'wolf',    def:2, resist:{tine:0.6, scath:1.3}},
    'Hollowed':     {minLevel:5, col:0x8a8478,eyeCol:0xa0ffe0,hp:40, maxHp:40, spd:.8, dmg:10,atk:1.5, xpVal:40, scale:1.0,shape:'humanoid',def:3, resist:{tine:0.7, blunt:0.85, pierce:1.2}},
    // v80 S5 — dungeon-familiar faces in the open country, away from settlements.
    'Goblin':       {minLevel:1, col:0x5a7a2a,eyeCol:0xffe040,hp:14, maxHp:14, spd:1.5,dmg:5, atk:1.0, xpVal:12, scale:.72,shape:'humanoid',def:1, resist:{}},
    'Skeleton':     {minLevel:3, col:0xd8d0c0,eyeCol:0x80c0ff,hp:26, maxHp:26, spd:1.0,dmg:8, atk:1.4, xpVal:24, scale:.95,shape:'humanoid',def:2, resist:{pierce:0.5, blunt:1.4}},
    'Ogre':         {minLevel:6, col:0x7a6a4a,eyeCol:0xff9040,hp:90, maxHp:90, spd:.8, dmg:16,atk:2.0, xpVal:80, scale:1.6,shape:'brute',   def:5, resist:{blunt:0.8}},
    'Rogue Mage':   {minLevel:1, col:0x3a2a5a,eyeCol:0xc080ff,hp:45, maxHp:45, spd:1.1,dmg:12,atk:1.6, xpVal:60, scale:1.0,shape:'humanoid',def:2, resist:{scath:0.5}},
    'Shore Wisp':   {minLevel:1, col:0x80d0ff,eyeCol:0xffffff,hp:38, maxHp:38, spd:1.7,dmg:9, atk:1.1, xpVal:50, scale:.6, shape:'spider',  def:1, resist:{pierce:0.4, blunt:0.4, tine:1.5}},
    'Shark':        {minLevel:1, col:0x5a6a74,eyeCol:0x202020,hp:55, maxHp:55, spd:2.4,dmg:14,atk:1.6, xpVal:70, scale:1.2,shape:'shark',   def:3, resist:{blunt:0.8}},
    // v80 combat pass — the wider overworld bestiary
    'Boar':         {minLevel:1, col:0x5a4030,eyeCol:0xe0c080,hp:16, maxHp:16, spd:1.7,dmg:5, atk:1.3, xpVal:10, scale:.7, shape:'wolf',    def:1, resist:{}},
    'Dragon':       {minLevel:8, col:0x5a2a1a,eyeCol:0xff8020,hp:160,maxHp:160,spd:1.3,dmg:22,atk:1.8,xpVal:400,scale:1.8,shape:'wolf',def:6, resist:{fire:0,slash:.7,pierce:.6}},
    'Bandit Archer':{minLevel:2, col:0x4a3a2a,eyeCol:0xd0a050,hp:20, maxHp:20, spd:1.4,dmg:6, atk:1.6, xpVal:24, scale:1.0,shape:'humanoid',def:1, resist:{}},
    'Goblin Slinger':{minLevel:1,col:0x5a6a30,eyeCol:0xffe080,hp:14, maxHp:14, spd:1.5,dmg:4, atk:1.6, xpVal:12, scale:.8, shape:'humanoid',def:0, resist:{}},
    'Highwayman':   {minLevel:2, col:0x3a3028,eyeCol:0xd0a050,hp:22, maxHp:22, spd:1.5,dmg:8, atk:1.2, xpVal:22, scale:1.0,shape:'humanoid',def:1, resist:{}},
    'Deserter':     {minLevel:3, col:0x505058,eyeCol:0xc0c0a0,hp:34, maxHp:34, spd:1.1,dmg:9, atk:1.4, xpVal:28, scale:1.0,shape:'humanoid',def:3, resist:{}},
    'Bandit Captain':{minLevel:5,col:0x6a2a20,eyeCol:0xffc060,hp:62, maxHp:62, spd:1.3,dmg:13,atk:1.3, xpVal:70, scale:1.08,shape:'humanoid',def:4, resist:{}},
    'Kobold':       {minLevel:1, col:0x7a5a30,eyeCol:0xffe080,hp:14, maxHp:14, spd:1.6,dmg:4, atk:1.1, xpVal:9,  scale:.75,shape:'humanoid',def:1, resist:{}},
    'Cultist':      {minLevel:4, col:0x3a2a4a,eyeCol:0xc080ff,hp:30, maxHp:30, spd:1.2,dmg:10,atk:1.4, xpVal:38, scale:1.0,shape:'humanoid',def:2, resist:{scath:0.6}},
    'Ghoul':        {minLevel:3, col:0x6a7a5a,eyeCol:0xe0ff80,hp:30, maxHp:30, spd:1.8,dmg:8, atk:1.1, xpVal:30, scale:.95,shape:'humanoid',def:1, resist:{tine:1.3, pierce:0.8}},
    'Wraith':       {minLevel:6, col:0x8090b0,eyeCol:0xa0e0ff,hp:48, maxHp:48, spd:1.4,dmg:12,atk:1.5, xpVal:75, scale:1.05,shape:'humanoid',def:2, resist:{pierce:0.4, blunt:0.5, scath:1.4}},
    'Dire Wolf':    {minLevel:4, col:0x3a3230,eyeCol:0xffb030,hp:40, maxHp:40, spd:1.9,dmg:10,atk:1.3, xpVal:40, scale:.95,shape:'wolf',    def:2, resist:{tine:1.2}},
    'Snow Wolf':    {minLevel:3, col:0xdcdce0,eyeCol:0x80c0ff,hp:34, maxHp:34, spd:1.9,dmg:9, atk:1.3, xpVal:34, scale:.9, shape:'wolf',    def:2, resist:{cloch:0.6}},
    'Bog Crawler':  {minLevel:3, col:0x2a3a28,eyeCol:0xa0ff60,hp:26, maxHp:26, spd:1.5,dmg:7, atk:1.2, xpVal:24, scale:.8, shape:'spider',  def:1, resist:{tine:1.4}},
    'Sand Scorpion':{minLevel:3, col:0xb89a50,eyeCol:0x202020,hp:30, maxHp:30, spd:1.3,dmg:9, atk:1.4, xpVal:30, scale:.85,shape:'spider',  def:3, resist:{pierce:0.7}},
    'Frost Troll':  {minLevel:6, col:0xd8e0e8,eyeCol:0x60a0ff,hp:95, maxHp:95, spd:.75,dmg:16,atk:1.9, xpVal:95, scale:1.55,shape:'brute',   def:5, resist:{cloch:0.5, tine:1.5}},
    'Marsh Hag':    {minLevel:5, col:0x4a6a3a,eyeCol:0xffff80,hp:44, maxHp:44, spd:1.3,dmg:11,atk:1.5, xpVal:60, scale:1.0,shape:'humanoid',def:2, resist:{scath:0.7, tine:1.2}},
    'Ash Wight':    {minLevel:7, col:0x3a3634,eyeCol:0xff6020,hp:70, maxHp:70, spd:1.2,dmg:15,atk:1.5, xpVal:110,scale:1.1,shape:'humanoid',def:4, resist:{tine:0.4, cloch:1.4}},
    'Pirate':       {minLevel:1, col:0x3a2a2a,eyeCol:0xffd080,hp:32, maxHp:32, spd:1.3,dmg:9, atk:1.3, xpVal:34, scale:1.0,shape:'humanoid',def:2, resist:{}},
  };
  const baseDef=ZDEF[type]||ZDEF.Wolf;
  // Apply variant overlay if one was selected upstream. Zones pass diff='normal' to pickVariant so only Greater can apply.
  const vr=applyVariantToDef(baseDef, type, variantKey);
  const d={...vr.def};
  // v56 rebalance: scale zone enemy HP/dmg with player level, mirroring dungeon spawn path.
  const _hpLvl=enemyHpScale();
  const _dmgLvl=enemyDmgScale();
  if(d.hp){d.hp=Math.max(1,Math.round(d.hp*_hpLvl));}
  if(d.maxHp){d.maxHp=Math.max(1,Math.round(d.maxHp*_hpLvl));}
  if(d.dmg){d.dmg=Math.max(1,Math.round(d.dmg*_dmgLvl));}
  const displayName=vr.displayName;
  const g=new THREE.Group();
  const mat=new THREE.MeshLambertMaterial({color:d.col});
  const sc2=d.scale;
  const limbs={}; // v80 S130 — the world's creatures register their pivots
  let wolfRig=null,personRig=null;
  if(type==='Dragon'&&WOLF_KINDS.Dragon){ // v80 S177 — the dragon on the shape kit: the wolf's bones and gait, its own neck, tail and wings
    wolfRig=buildWolf(type,sc2*1.6);g.add(wolfRig.root);limbs.torso=wolfRig.mesh;limbs.wolf=wolfRig;
  }
  else if(zShapeExtra(type,d,g,mat,sc2,limbs)){}
  else if((d.shape==='wolf'||type==='Cave Bear')&&WOLF_KINDS[type]){ // v80 S166 (S223: and the Cave Bear, still a brute) — the wolf family on the shape kit: one skinned mesh, planted paws
    wolfRig=buildWolf(type,sc2);g.add(wolfRig.root);
    limbs.torso=wolfRig.mesh; // the wind-up's red and the parry's flash light this wolf's own material
    limbs.wolf=wolfRig;
  }
  else if((d.shape==='humanoid'&&(FOE_DRESS[type]||(zOpts&&zOpts.genome)))||(d.shape==='brute'&&FOE_DRESS[type])){ // v80 S171 — a human foe is a person (S208: and a troll)
    const pr=buildFoe(type,x,z,zOpts&&zOpts.genome,d.eyeCol);pr.root.scale.multiplyScalar(sc2);g.add(pr.root);limbs.torso=pr.mesh;limbs.armR=pr.B.shR;limbs.person=pr;personRig=pr;if(/Captain/.test(type))limbs.armL=pr.B.shL;
  }
  else if(d.shape==='spider'&&SPIDER_KINDS[type]){ // v80 S169 — the spider on the shape kit: eight IK legs on alternating tetrapods
    wolfRig=buildSpider(type,sc2);g.add(wolfRig.root);limbs.torso=wolfRig.mesh;limbs.wolf=wolfRig;
  }
  else if(d.shape==='wolf'){
    const body=new THREE.Mesh(new THREE.BoxGeometry(.45*sc2,.3*sc2,.7*sc2),mat);body.position.y=.32*sc2;g.add(body);
    const head=new THREE.Mesh(new THREE.BoxGeometry(.28*sc2,.25*sc2,.32*sc2),mat);head.position.set(0,.5*sc2,.3*sc2);g.add(head);
    const snout=new THREE.Mesh(new THREE.BoxGeometry(.16*sc2,.14*sc2,.2*sc2),mat);snout.position.set(0,.44*sc2,.46*sc2);g.add(snout);
    const ey=new THREE.Mesh(new THREE.BoxGeometry(.1*sc2,.04*sc2,.02),new THREE.MeshBasicMaterial({color:d.eyeCol}));ey.position.set(0,.52*sc2,.47*sc2);g.add(ey);
    [-1,1].forEach(s=>{const leg=new THREE.Mesh(new THREE.BoxGeometry(.09*sc2,.28*sc2,.09*sc2),mat);leg.position.set(s*.17*sc2,.14*sc2,s*.1*sc2);g.add(leg);});
    [-1,1].forEach(s=>{const leg=new THREE.Mesh(new THREE.BoxGeometry(.09*sc2,.28*sc2,.09*sc2),mat);leg.position.set(s*.17*sc2,.14*sc2,-s*.1*sc2);g.add(leg);});
    const tail=new THREE.Mesh(new THREE.CylinderGeometry(.04*sc2,.07*sc2,.3*sc2,5),mat);tail.rotation.x=-.7;tail.position.set(0,.45*sc2,-.36*sc2);g.add(tail);
    // v80 S9 — ears, darker back, paws, nose
    [-1,1].forEach(s=>{const ear=new THREE.Mesh(new THREE.ConeGeometry(.05*sc2,.12*sc2,4),mat);ear.position.set(s*.09*sc2,.66*sc2,.28*sc2);g.add(ear);});
    const back=new THREE.Mesh(new THREE.BoxGeometry(.36*sc2,.08*sc2,.6*sc2),new THREE.MeshLambertMaterial({color:new THREE.Color(d.col).multiplyScalar(.7)}));back.position.set(0,.48*sc2,-.02*sc2);g.add(back);
    const nose=new THREE.Mesh(new THREE.BoxGeometry(.06*sc2,.05*sc2,.05*sc2),new THREE.MeshLambertMaterial({color:0x1a1210}));nose.position.set(0,.47*sc2,.57*sc2);g.add(nose);
    [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([s,f])=>{const paw=new THREE.Mesh(new THREE.BoxGeometry(.11*sc2,.06*sc2,.13*sc2),new THREE.MeshLambertMaterial({color:new THREE.Color(d.col).multiplyScalar(.6)}));paw.position.set(s*.17*sc2,.03*sc2,f*.1*sc2+.02*sc2);g.add(paw);});
  } else if(d.shape==='shark'){
    // S260 — the shark on the kit (Michael's A on Session 230, as shown): a lathed body counter-shaded, grey above and pale
    // beneath, a pointed snout, extruded fins (a tall dorsal, pectorals, a crescent tail, a small second dorsal), gill slits
    // and eyes; the body from behind the dorsal is a second mesh on a pivot, so the tail sweeps as it swims (tickSharks).
    // Built in the prototype's units about the old body's middle (y .2), times sc2 as the old one was.
    const u=sc2,back=new THREE.Color(0x5a6a74),belly=new THREE.Color(0xd8dcd8),gill=new THREE.Color(0x3a4a54),eyeC=new THREE.Color(0x0a0a0a),Y0=.2,ZP=-.35;
    const MX=(x,y,z,rx,ry,rz,k)=>new THREE.Matrix4().compose(new THREE.Vector3(x*u,y*u,z*u),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),new THREE.Vector3(u*(k||1),u*(k||1),u*(k||1)));
    const prof=[[0,-1.5],[.07,-1.3],[.14,-.9],[.24,-.4],[.31,.1],[.32,.45],[.27,.85],[.17,1.2],[.07,1.45],[0,1.56]];
    const bodyPart=(z0,z1)=>{const pts=[];for(const q of prof){if(q[1]<z0-1e-6||q[1]>z1+1e-6)continue;pts.push(q);}
      const lo=prof.filter(q=>q[1]<z0),hi=prof.filter(q=>q[1]>z1);const lerpAt=z=>{for(let k=0;k<prof.length-1;k++){const a=prof[k],b=prof[k+1];if(z>=a[1]&&z<=b[1]){const t=(z-a[1])/(b[1]-a[1]);return [a[0]+(b[0]-a[0])*t,z];}}return [0,z];};
      if(lo.length)pts.unshift(lerpAt(z0));if(hi.length)pts.push(lerpAt(z1));if(lo.length)pts.unshift([0,z0]);if(hi.length)pts.push([0,z1]);
      const g=new THREE.LatheGeometry(pts.map(q=>new THREE.Vector2(Math.max(1e-4,q[0]),q[1])),20);g.rotateX(Math.PI/2);g.scale(.78,.88,1);return g;};
    const fin=(pts2)=>{const sh=new THREE.Shape();sh.moveTo(pts2[0][0],pts2[0][1]);for(let k=1;k<pts2.length;k++)sh.lineTo(pts2[k][0],pts2[k][1]);const g=new THREE.ExtrudeGeometry(sh,{depth:.03,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:2});g.translate(0,0,-.015);return g;};
    const F=[],T=[];
    F.push([bodyPart(ZP,1.56),back,MX(0,Y0,0)]);F.push([fin([[0,0],[.18,.55],[.3,.56],[.42,0]]),back,MX(0,Y0+.28,.05,0,Math.PI/2,0)]);
    for(const sd of [1,-1]){F.push([fin([[0,0],[.5*sd,-.38],[.43*sd,-.47],[0,-.17]]),back,MX(sd*.22,Y0-.1,.5,Math.PI/2,0,-sd*.3)]);F.push([SK.ball(.03,8,6),eyeC,MX(sd*.15,Y0+.09,1.12)]);
      for(let k=0;k<4;k++)F.push([SK.cyl(.006,.006,.14,4),gill,MX(sd*.25,Y0+.02,.78-k*.06)]);}
    {const tg=bodyPart(-1.5,ZP+.1);tg.scale(1.02,1.02,1);T.push([tg,back,MX(0,Y0,-ZP)]);}T.push([fin([[0,0],[-.2,.75],[-.08,.75],[.22,.06],[-.18,-.5],[-.28,-.48],[0,0]]),back,MX(0,Y0+.02,-1.45-ZP,0,Math.PI/2,0)]);
    T.push([fin([[0,0],[.1,.22],[.2,0]]),back,MX(0,Y0+.12,-.95-ZP,0,Math.PI/2,0,.8)]);T.push([fin([[0,0],[.14,-.16],[.22,-.14],[.2,0]]),back,MX(0,Y0-.2,-.95-ZP,0,Math.PI/2,0,.8)]);
    const shade=m=>{const n=m.geometry.attributes.normal,c=m.geometry.attributes.color;for(let k=0;k<c.count;k++){if(Math.abs(c.getX(k)-back.r)>1e-3||Math.abs(c.getZ(k)-back.b)>1e-3)continue;const t=Math.max(0,Math.min(1,(-n.getY(k)+.05)/.45));c.setXYZ(k,back.r+(belly.r-back.r)*t,back.g+(belly.g-back.g)*t,back.b+(belly.b-back.b)*t);}c.needsUpdate=true;};
    const front=dunMerge(F,'shark');shade(front);g.add(front);const tail=dunMerge(T,'shark');shade(tail);tail.material.dispose();tail.material=front.material;
    const piv=new THREE.Group();piv.position.set(0,0,ZP*u);piv.add(tail);g.add(piv);g._sharkTail=piv;limbs.torso=front;
  } else if(d.shape==='spider'){ // v80 S130 — an abdomen behind, a head with fangs, eight jointed legs
    const body=new THREE.Mesh(new THREE.SphereGeometry(.16*sc2,7,6),mat);body.position.set(0,.26*sc2,.02*sc2);g.add(body);
    const abd=new THREE.Mesh(new THREE.SphereGeometry(.22*sc2,8,6),new THREE.MeshLambertMaterial({color:new THREE.Color(d.col).multiplyScalar(.8).getHex()}));abd.scale.set(1,.85,1.25);abd.position.set(0,.3*sc2,-.3*sc2);g.add(abd);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.11*sc2,6,5),mat);head.position.set(0,.26*sc2,.22*sc2);g.add(head);
    const ey=new THREE.Mesh(new THREE.BoxGeometry(.12*sc2,.04*sc2,.02),new THREE.MeshBasicMaterial({color:d.eyeCol}));ey.position.set(0,.29*sc2,.32*sc2);g.add(ey);
    [-1,1].forEach(s=>{const f=new THREE.Mesh(new THREE.ConeGeometry(.02*sc2,.1*sc2,4),new THREE.MeshLambertMaterial({color:0x1a1210}));f.position.set(s*.04*sc2,.2*sc2,.3*sc2);f.rotation.x=Math.PI;g.add(f);});
    [-1,1].forEach(s=>{for(let i=0;i<4;i++){const hip=new THREE.Group();hip.position.set(s*.12*sc2,.26*sc2,(.14-i*.1)*sc2);hip.rotation.y=(i-1.5)*.35;hip.rotation.z=s*.55;const up=.22,dn=.24;const u=new THREE.Mesh(new THREE.CylinderGeometry(.018*sc2,.024*sc2,up*sc2,4),mat);u.rotation.z=s*Math.PI/2;u.position.x=s*up/2*sc2;hip.add(u);const knee=new THREE.Group();knee.position.x=s*up*sc2;knee.rotation.z=-s*1.75;hip.add(knee);const l=new THREE.Mesh(new THREE.CylinderGeometry(.012*sc2,.02*sc2,dn*sc2,4),new THREE.MeshLambertMaterial({color:new THREE.Color(d.col).multiplyScalar(.7).getHex()}));l.rotation.z=s*Math.PI/2;l.position.x=s*dn/2*sc2;knee.add(l);g.add(hip);}});
  } else if(d.shape==='brute'){
    const legH=.24*sc2;
    [-1,1].forEach(s=>{const leg=new THREE.Mesh(new THREE.BoxGeometry(.16*sc2,legH,.16*sc2),mat);leg.position.set(s*.12*sc2,legH/2,0);g.add(leg);});
    const torso=new THREE.Mesh(new THREE.BoxGeometry(.5*sc2,.44*sc2,.32*sc2),mat);torso.position.set(0,legH+.22*sc2,0);g.add(torso);
    const hd=new THREE.Mesh(new THREE.BoxGeometry(.32*sc2,.26*sc2,.26*sc2),mat);hd.position.set(0,legH+.58*sc2,0);g.add(hd);
    const ey=new THREE.Mesh(new THREE.BoxGeometry(.18*sc2,.05*sc2,.02),new THREE.MeshBasicMaterial({color:d.eyeCol}));ey.position.set(0,legH+.59*sc2,.14*sc2);g.add(ey);
    // v80 S9 — brute: heavy arms with fists, jaw, tusks, hide belt
    [-1,1].forEach(s=>{const arm=new THREE.Mesh(new THREE.BoxGeometry(.16*sc2,.5*sc2,.16*sc2),mat);arm.position.set(s*.34*sc2,legH+.2*sc2,0);g.add(arm);const fist=new THREE.Mesh(new THREE.BoxGeometry(.19*sc2,.16*sc2,.19*sc2),new THREE.MeshLambertMaterial({color:new THREE.Color(d.col).multiplyScalar(.8)}));fist.position.set(s*.34*sc2,legH-.05*sc2,0);g.add(fist);});
    const jaw=new THREE.Mesh(new THREE.BoxGeometry(.28*sc2,.1*sc2,.2*sc2),new THREE.MeshLambertMaterial({color:new THREE.Color(d.col).multiplyScalar(.85)}));jaw.position.set(0,legH+.47*sc2,.06*sc2);g.add(jaw);
    [-1,1].forEach(s=>{const tusk=new THREE.Mesh(new THREE.ConeGeometry(.025*sc2,.09*sc2,4),new THREE.MeshLambertMaterial({color:0xe8e0c8}));tusk.position.set(s*.08*sc2,legH+.54*sc2,.17*sc2);g.add(tusk);});
    const belt=new THREE.Mesh(new THREE.BoxGeometry(.52*sc2,.07*sc2,.34*sc2),new THREE.MeshLambertMaterial({color:0x3a2a1a}));belt.position.set(0,legH+.02*sc2,0);g.add(belt);
  } else { // humanoid
    const legH=.32*sc2;
    [-1,1].forEach(s=>{const leg=new THREE.Mesh(new THREE.BoxGeometry(.11*sc2,legH,.11*sc2),mat);leg.position.set(s*.08*sc2,legH/2,0);g.add(leg);});
    const torso=new THREE.Mesh(new THREE.BoxGeometry(.28*sc2,.38*sc2,.18*sc2),mat);torso.position.set(0,legH+.19*sc2,0);g.add(torso);limbs.torso=torso;
    [-1,1].forEach(s=>{const piv=new THREE.Group();piv.position.set(s*.2*sc2,legH+.36*sc2,0);const arm=new THREE.Mesh(new THREE.BoxGeometry(.09*sc2,.32*sc2,.09*sc2),mat);arm.position.y=-.14*sc2;piv.add(arm);g.add(piv);limbs[s<0?'armL':'armR']=piv;}); // v80 S130 — pivots at the shoulder
    const hd=new THREE.Mesh(new THREE.BoxGeometry(.22*sc2,.22*sc2,.2*sc2),mat);hd.position.set(0,legH+.57*sc2,0);g.add(hd);
    const ey=new THREE.Mesh(new THREE.BoxGeometry(.14*sc2,.04*sc2,.02),new THREE.MeshBasicMaterial({color:d.eyeCol}));ey.position.set(0,legH+.58*sc2,.11*sc2);g.add(ey);
  }
  // HP bar
  const hpBg=new THREE.Mesh(new THREE.PlaneGeometry(.6,.07),new THREE.MeshBasicMaterial({color:0x440000,side:THREE.DoubleSide}));hpBg.position.set(0,d.scale*1.1,.01);g.add(hpBg);
  const hpFg=new THREE.Mesh(new THREE.PlaneGeometry(.6,.07),new THREE.MeshBasicMaterial({color:0x22dd22,side:THREE.DoubleSide}));hpFg.position.set(0,d.scale*1.1,.02);g.add(hpFg);
  hpBg.visible=false;hpFg.visible=false;hpBg.userData.hpBar=true;hpFg.userData.hpBar=true; // v80 — bars show once the creature has been hurt
  const el=new THREE.PointLight(0xffaa44,.5,4);el.position.set(x,.8,z);
  if(typeof WORLD!=='undefined'&&WORLD.scene===sc){WORLD.mirrorLight(el);}else sc.add(el); // v80 — the world pools its lights
  // Place at terrain height for this zone
  const ey0=typeof _forestTerrainH==='function'&&activeZoneId==='forest'?_forestTerrainH(x,z):
             typeof _ironhavenTerrainH==='function'&&activeZoneId==='ironhaven'?_ironhavenTerrainH(x,z):0;
  g.position.set(x,ey0,z);sc.add(g);
  // v59: locked state — enemy is latent until player reaches minLevel. Mesh hidden, AI/collision
  // skipped in tick. Unlocked on the first tick where level >= minLevel (see tickZoneEnemies).
  const minLevel=baseDef.minLevel||1;
  const isLocked=(typeof level!=='undefined'?level:1)<minLevel;
  g.visible=!isLocked;
  // v61gj — Build the zone enemy state, init posture, then return. Stamp `shape`
  // so the posture-family lookup resolves directly (zone shapes are wolf/spider/
  // brute/humanoid — distinct from dungeon buildFn vocabulary).
  const zoneE = {limbs,hpBg,x,z,hp:d.hp,maxHp:d.maxHp,mesh:g,hpFg,el,name:displayName,spd:d.spd,dmg:d.dmg,atkSpd:d.atk,dead:false,alert:false,atkCd:0,ph:Math.random()*Math.PI*2,homeX:x,homeZ:z,xpVal:d.xpVal,walkT:Math.random()*Math.PI*2,def:d.def||0,resist:d.resist||{},variant:vr.variant,xpMult:vr.xpMult,telegraphT:0,telegraphMax:0,minLevel,locked:isLocked,_origCol:d.col,shape:d.shape,beast:BEAST_TYPES.has(type),combatYaw:Math.random()*Math.PI*2};
  initPosture(zoneE);
  if(wolfRig)wolfRig.e=zoneE;
  if(personRig){personRig.e=zoneE;hpBg.position.y=hpFg.position.y=1.3*sc2;} // the bar over a person's head
  if(wolfRig&&wolfRig.k.dragon){hpBg.position.y=hpFg.position.y=1.55*sc2;}
  // v80 S130 — captains hold a frontal guard (the Shieldbearer's mechanic: a power attack or a bash breaks it); the world's dragon breathes
  if(/Captain/.test(type)&&limbs.armL){try{attachShieldProp(g,limbs,limbs.person?1:sc2,'round');zoneE.shieldUp=true;limbs.shieldArmUpX=-1.15;limbs.shieldArmUpZ=limbs.person?-.5:.5;reraiseGuard(zoneE);}catch(err){}} // a person's left arm is on its +x side: across the body is -z
  if(type==='Dragon'){zoneE.dragon=true;zoneE._dragonBuilt=true;}
  if(g._hover)zoneE.baseY=g.position.y;
  return zoneE;
}

// v80 S386 — a foe a quest or the war sets down on purpose (a duel, a commission, a raid, a road job, a caravan's attackers, a siege) is there at any level:
// the minLevel gate is for the wild's own spawns, and a latent one is hidden, never ticked and can't be hit
function unlockFoe(e){if(!e)return e;e.locked=false;e.minLevel=1;if(e.mesh)e.mesh.visible=true;return e;}

// v80 S135 — one of them sees you, the rest of the camp hears: everyone within reach wakes
function alertPack(e,r){try{const E=(activeZoneId==='world'&&ZONES.world)?ZONES.world.enemies:(typeof ZE!=='undefined'?ZE:[]);for(const o of E){if(o===e||o.dead||o.alert)continue;if(Math.hypot(o.x-e.x,o.z-e.z)<r)o.alert=true;}}catch(err){}}
// v80 S135 — an archer's arrow: a shaft that flies flat at the player and can be blocked
const ZARROWS=[];
function fireZoneArrow(e,sc){const ax=px-e.x,az=pz-e.z,ad=Math.hypot(ax,az)||1;
  const m=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,.7),new THREE.MeshLambertMaterial({color:0x9a7a4a}));const y=activeTerrainH(e.x,e.z)+1.0;m.position.set(e.x,y,e.z);m.rotation.y=Math.atan2(ax,az);sc.add(m);
  ZARROWS.push({m,x:e.x,z:e.z,y,vx:ax/ad*17,vz:az/ad*17,life:1.6,dmg:e.dmg,from:e,sc});}
function tickZoneArrows(dt,now){for(let i=ZARROWS.length-1;i>=0;i--){const a=ZARROWS[i];a.life-=dt;a.x+=a.vx*dt;a.z+=a.vz*dt;a.m.position.set(a.x,a.y,a.z);
    const dh=Math.hypot(px-a.x,pz-a.z);const hit=dh<.75&&!rollUntouchable(performance.now()/1000);const ground=activeTerrainH(a.x,a.z)>a.y;
    if(hit&&!dead){const def2=_armour();const raw=Math.max(1,a.dmg-Math.floor(def2*.5)+Math.floor(Math.random()*4));
      const fx=-Math.sin(yaw),fz=-Math.cos(yaw);const toA=(a.from.x-px),toZ=(a.from.z-pz),tl=Math.hypot(toA,toZ)||1;const facing=(fx*toA+fz*toZ)/tl>.4;
      if(blocking&&facing){const red=_warded(Math.max(1,Math.round(raw*(1-_blockBoost(.65)))));PHP=Math.max(0,PHP-red);lvAct.damageTaken+=red;hurtT=.25;stamina=Math.max(0,stamina-6);try{sndBlock();}catch(err){}blockFlashT=.3;blockFlashCol='#4488ff';showMsg(`🛡 Arrow blocked — ${red}`,'#88aaff');}
      else{const hitD=_warded(raw);PHP=Math.max(0,PHP-hitD);lvAct.damageTaken+=hitD;hurtT=.4;showMsg(`${a.from.name}'s arrow hits for ${hitD}!`,'#ff6060');}
      if(PHP<=0&&!dead)playerDead();}
    if(hit||ground||a.life<=0){a.sc.remove(a.m);ZARROWS.splice(i,1);}}}
function tickZoneEnemies(dt,now,sc){
  try{tickZoneArrows(dt,now);}catch(err){}
  // v59: unlock any latent enemies the player has grown into. Cheap — runs once per tick.
  ZE.forEach(e=>{
    if(e.locked && (e.minLevel||1)<=level){
      e.locked=false;
      if(e.mesh)e.mesh.visible=true;
    }
  });
  ZE.forEach(e=>{
    if(e.dead||e.locked)return;
    if(e._duelHold)return; /* S373 — Rowe holds: talking, or on one knee */
    // v61gj — Defensive lazy init for pre-ship saves (enemies in ZONES[id].enemies
    // that predate v61gj). Idempotent — no-op if already stamped. Then regen tick.
    if(typeof e.posture!=='number') initPosture(e);
    tickPostureRegen(e, dt, now);
    const dist=Math.hypot(px-e.x,pz-e.z);
    // v61c2 — Boss-specific tick block. Runs alongside the standard enemy
    // tick path so the boss inherits chase/AI/HP-bar updates. Adds:
    //   (1) sigil-trace pulse — emissive red on the seams, breathing in/out
    //       at ~1.5 Hz. Independent of telegraph; signals "this is alive."
    //   (2) phase machine — checks current HP fraction against bossDef
    //       phase thresholds, advances e.phaseId on cross. Phase 1→2→3 are
    //       descending thresholds (1.0/0.66/0.33). Session A logs the
    //       transition + adjusts telegraphMult; Session B will wire adds,
    //       AOE roar, and ember trails to the entry hooks.
    if(e.isBoss && e.bossDef){
      // Sigil pulse — animate emissive intensity by scaling color brightness.
      // sigilTrace is a MeshBasicMaterial whose color is shared by 5 strip
      // meshes; mutating .color on the material updates all of them at once.
      e.sigilPulseT = (e.sigilPulseT||0) + dt;
      const baseR = 0.92 + Math.sin(e.sigilPulseT*1.5)*0.30; // 0.62 to 1.22
      // Phase 3 throbs harder — frenzied, almost angry.
      const phaseBoost = (e.phaseId>=3) ? 0.15 : 0;
      if(e.limbs && e.limbs.sigilTrace && e.limbs.sigilTrace.color){
        e.limbs.sigilTrace.color.setRGB(
          Math.min(1.0, (baseR + phaseBoost)),
          Math.max(0.05, 0.10 - phaseBoost*0.5),
          Math.max(0.0, 0.04 - phaseBoost*0.3)
        );
      }
      // Phase machine — check thresholds top-down (descending). The first
      // phase whose threshold the current HP fraction is BELOW becomes the
      // active phase. Crossing into a new phase fires the entry hook ONCE.
      const hpFrac = e.hp / e.maxHp;
      const phases = e.bossDef.phases || [];
      let newPhaseId = 1;
      for(const ph of phases){
        if(hpFrac <= ph.threshold) newPhaseId = ph.id;
      }
      if(newPhaseId !== e.phaseId){
        const oldPhaseId = e.phaseId;
        e.phaseId = newPhaseId;
        // Phase entry hook. Session A: log the transition + brief HUD
        // signal (a stronger sigil pulse for ~0.5s). Session B will fire
        // the actual mechanic — add-spawn for Phase 2, ember-trail for
        // Phase 3, and a knockback roar AOE on each transition.
        if(typeof console!=='undefined' && console.log){
          console.log('[Faolchú] Phase transition:', oldPhaseId, '→', newPhaseId, 'at HP', e.hp+'/'+e.maxHp);
        }
        if(typeof addLog==='function'){
          if(newPhaseId===2) addLog('🐺','The Faolchú\u2019s seams tear wider.');
          else if(newPhaseId===3) addLog('🔥','The Faolchú\u2019s sigils burn white-hot.');
        }
        // v61c3 — Phase transition roar. Plays the full multi-voice scream-
        // roar so the transition lands audibly. Fires for any phase advance
        // (1→2, 2→3, theoretically 1→3 if a single hit blew past 66%); the
        // single sound is appropriate for either since it's "the boss
        // escalating," not phase-specific text.
        if(e.isBoss && e.bossId==='faolchu' && typeof sndFaolchuRoar==='function'){
          sndFaolchuRoar();
        }
        // v61c4 — Phase entry mechanic: spawn a Lesser Faolchú add on
        // entry to phase 2 and again on entry to phase 3. The boss has
        // company. Lessers are tagged isLesserFaolchu and despawn when
        // the boss dies, so the fight always resolves with the boss kill.
        // If the boss skips phase 2 entirely (single huge hit lands at
        // <33% HP), spawn TWO lessers since we missed the phase 2 spawn.
        if(e.isBoss && e.bossId==='faolchu' && typeof spawnLesserFaolchu==='function'){
          if(newPhaseId===2){
            spawnLesserFaolchu(e);
            if(typeof addLog==='function') addLog('🐺','A second wolf-shape splits from its flank.');
          } else if(newPhaseId===3){
            spawnLesserFaolchu(e);
            // Catch-up spawn — if we jumped 1→3 without firing the phase 2
            // hook, spawn the missed lesser too.
            if(oldPhaseId<2) spawnLesserFaolchu(e);
            if(typeof addLog==='function') addLog('🐺','Another tears free of the seams.');
          }
        }
        // Visible feedback: brief flash on the sigil-trace material so the
        // player sees the transition land. Session B will replace this with
        // the proper roar VFX + add-spawn.
        if(e.limbs && e.limbs.sigilTrace && e.limbs.sigilTrace.color){
          e.limbs.sigilTrace.color.setRGB(1.0, 0.85, 0.6);
        }
      }
      // v61c4 — Caor fireball special attack on cooldown. Conditions:
      //   - boss is alert (player is engaged)
      //   - player is in 4-15u range (close enough to aim, far enough
      //     that the attack adds value over melee)
      //   - cooldown elapsed (caorCd <= 0)
      //   - not currently charging or melee-telegraphing
      // Wind-up: 1.0s during which sigils flare bright. Player can see
      // it coming and dodge by sprinting laterally. Fires from the snout
      // at the player's position (locked at telegraph end, so a moving
      // player can sidestep).
      const _bossDist = Math.hypot(px-e.x, pz-e.z);
      if(e.alert && e.caorChargeT>0){
        // Currently winding up — advance charge timer, pulse sigils
        e.caorChargeT -= dt;
        // Brighter pulse during charge so the player reads "ranged attack"
        if(e.limbs && e.limbs.sigilTrace && e.limbs.sigilTrace.color){
          const flare = 1.0 + Math.sin(performance.now()*0.025)*0.4;
          e.limbs.sigilTrace.color.setRGB(Math.min(1, flare), 0.4, 0.1);
        }
        if(e.caorChargeT<=0){
          // Fire — spawn a tine projectile from the snout toward the
          // player's CURRENT position (locked at fire time, not telegraph
          // start, so the player must keep moving to dodge consistently).
          e.caorChargeT = 0;
          const dxF = px - e.x, dzF = pz - e.z;
          const ddF = Math.hypot(dxF, dzF) || 1;
          // Snout origin — boss's body center plus forward offset based
          // on current facing (boss mesh.lookAt's the player each tick,
          // so forward is the player direction).
          const snoutY = (typeof activeTerrainH==='function' ? activeTerrainH(e.x,e.z) : 0) + 1.2;
          const orbStart = {
            x: e.x + (dxF/ddF) * 1.2, // 1.2u out from body center toward player
            y: snoutY,
            z: e.z + (dzF/ddF) * 1.2,
          };
          // Build orb mesh — bright tine red/orange, slightly bigger than
          // player Caor for visual weight. Reuses player Caor template
          // with tinted material if available; otherwise builds inline.
          const orb = new THREE.Group();
          orb.add(new THREE.Mesh(
            new THREE.SphereGeometry(.18, 10, 10),
            new THREE.MeshBasicMaterial({color:0xff5520})
          ));
          orb.add(new THREE.Mesh(
            new THREE.SphereGeometry(.36, 10, 10),
            new THREE.MeshBasicMaterial({color:0xff8844, transparent:true, opacity:0.35})
          ));
          orb.add(new THREE.PointLight(0xff5520, 2.4, 6));
          orb.position.set(orbStart.x, orbStart.y, orbStart.z);
          // Velocity — v61c5 raised from 8u/s to 12u/s. Player sprint is
          // 4.69u/s, so the orb travels ~2.5× sprint speed — running away
          // doesn't dodge it; you have to STRAFE laterally during the
          // 1.0s wind-up. dy=0 keeps it horizontal.
          const projSpd = 12.0;
          orb.userData = {
            vx: (dxF/ddF) * projSpd,
            vy: 0,
            vz: (dzF/ddF) * projSpd,
            life: 2.0, // 2.0s × 12u/s = 24u max range — covers any reasonable engagement distance
            fromBoss: true,
            // v61c5 — 26 → 38. Now slightly above melee bite (32). The
            // ranged attack should be a meaningful threat that punishes
            // a player trying to camp at safe distance, not a softer
            // chip-damage option. Block reduces it normally; raw ranged
            // hit on an unblocking player is ~19% of a level-8 max HP.
            dmg: 38,
          };
          sc.add(orb);
          ZB.push(orb);
          // Reset cooldown — 8-12s spread for next shot
          e.caorCd = 8 + Math.random() * 4;
          if(typeof sndFaolchuRoar==='function'){
            // Brief wet-fire crackle as the orb leaves
            sfxNoise(0.20, 1, 1, 0.30, 1400);
            sfxTone(380, 180, 0.18, 0.18, 'sawtooth');
          }
          if(typeof addLog==='function') addLog('🔥','The Faolchú spits fire from the seams.');
        }
      } else if(e.alert && e.caorCd>0){
        // Cool down idle
        e.caorCd -= dt;
      } else if(e.alert && e.caorCd<=0 && _bossDist>4 && _bossDist<15 && e.telegraphT<=0){
        // Cooldown elapsed and player is in ranged sweet spot → start
        // wind-up. Don't start if boss is also winding up a melee bite.
        e.caorChargeMax = 1.0;
        e.caorChargeT = 1.0;
        if(typeof sndFaolchuGrowl==='function'){
          // A second growl variant would be nice but the existing growl
          // works as the wind-up cue. Pitched a bit different via tone.
          sfxTone(280, 140, 0.6, 0.14, 'sawtooth');
          sfxNoise(0.6, 1, 1, 0.16, 600);
        }
      }
    }
    // Stagger check — frozen in place for stagger duration. Mirrors dungeon tick behavior.
    // Without this the zone hit handler's staggered.push() would be silent (no tick consumes `t`).
    const stag=staggered.find(s=>s.e===e);
    if(stag){
      stag.t-=dt;
      if(stag.t<=0){
        staggered=staggered.filter(s=>s.e!==e);
        reraiseGuard(e);
      } else {
        const ety=activeTerrainH(e.x,e.z);
        e.mesh.position.set(e.x,ety,e.z);
        e.mesh.lookAt(px,ety,pz);
        e.el.position.set(e.x,ety+.8,e.z);
        return;
      }
    }
    // v63 — Directional detection. Vision cone (forward 150° arc) + hearing
    // radius (1.5u omnidirectional). Sight is modulated by detectReduce buffs
    // and sneak; hearing is not. LOS check (step-cast for walls) added — the
    // zone previously had no LOS check, so enemies detected through walls.
    const _inWorld=activeZoneId==='world';
    if(_hasBuff('vanish')){e.alert=false;e._agg=false;} // S322 — Shadowcap's veil in the open world as underground
    if(!e.alert && !_hasBuff('vanish') && canSeePlayer(e, dist, _inWorld?15:9)){ // v80 S135 — the open country sees further
      let los = true;const _losSolid=(_inWorld&&typeof WORLD!=='undefined'&&WORLD.camSolid)?WORLD.camSolid:currentZoneSolid; // trunks and posts don't hide you
      for(let t = 0.15; t < 0.9; t += 0.15){
        const tx = e.x + (px - e.x) * t, tz = e.z + (pz - e.z) * t;
        if(_losSolid(tx, tz)){ los = false; break; }
      }
      if(los){ e.alert = true; alertPack(e, _inWorld?16:10); }
    }
    if(e.alert && dist > (_inWorld?30:18)) e.alert = false;
    // v61c2 — Bosses are ALWAYS alert. The fight starts on entry and doesn't
    // soft-disengage if the player kites past 18u. Ashenmoor's village square
    // is small enough this rarely matters in practice, but explicit here so
    // the boss doesn't go back to "wandering near home" if the player runs.
    if(e.isBoss) e.alert = true;
    if(!e.alert){
      // Wander near home
      e.walkT+=dt*.5;
      const wx=e.homeX+Math.sin(e.walkT*.4)*3,wz=e.homeZ+Math.cos(e.walkT*.4)*3;
      const dx2=wx-e.x,dz2=wz-e.z,wd=Math.hypot(dx2,dz2)||1;
      const step=e.spd*.3*dt;
      const nx=e.x+dx2/wd*step,nz=e.z+dz2/wd*step;
      if(!currentZoneSolid(nx,nz)){e.x=nx;e.z=nz;}
      const ety=activeTerrainH(e.x,e.z);
      e.mesh.position.set(e.x,ety,e.z);e.el.position.set(e.x,ety+.8,e.z);
      return;
    }
    // Chase player
    let dx2=px-e.x,dz2=pz-e.z,d=Math.hypot(dx2,dz2)||1;
    const _stopDist = e.isBoss ? Math.max(1.5, (e.bossDef.biteRange||2.0)-1.0) : 1.0;
    const _archer=/Archer|Slinger/.test(e.name||'');
    if(_archer){ // v80 S135 — archers keep 6–13u, back off when you close, and shoot
      e.arrowCd=(e.arrowCd||0)-dt;
      let want=0;if(d<6)want=-1;else if(d>13)want=1;
      if(want!==0){const step=e.spd*dt*(want<0?1.2:1);const nx=e.x+dx2/d*step*want,nz=e.z+dz2/d*step*want;if(!currentZoneSolid(nx,nz)){e.x=nx;e.z=nz;}}
      if(e.alert&&d>=3&&d<=17&&e.arrowCd<=0&&e.telegraphT<=0){let los=true;const _ls=(activeZoneId==='world'&&typeof WORLD!=='undefined'&&WORLD.camSolid)?WORLD.camSolid:currentZoneSolid;for(let t=.1;t<.95;t+=.15){if(_ls(e.x+dx2*t,e.z+dz2*t)){los=false;break;}}
        if(los){e.arrowCd=2.2+Math.random()*.8;fireZoneArrow(e,sc);}}
    } else if(e.alert&&!e.isBoss){ // v80 S135 — a pack spreads: each takes an angle around you instead of queueing on one line
      const packN=ZE.filter(o=>!o.dead&&o.alert&&o!==e&&Math.hypot(o.x-e.x,o.z-e.z)<14).length;
      if(packN>0){if(e._flank==null)e._flank=(Math.random()<.5?-1:1)*(.5+Math.random()*.8);const base=Math.atan2(dz2,dx2);const r=Math.max(_stopDist+.3,Math.min(d-.2,2.6));const tx=px-Math.cos(base+e._flank)*r,tz=pz-Math.sin(base+e._flank)*r;const fdx=tx-e.x,fdz=tz-e.z,fd=Math.hypot(fdx,fdz);if(fd>.4&&d>_stopDist+.6){dx2=fdx;dz2=fdz;d=fd;}}
    }
    if(!_archer&&d>_stopDist){
      const step=e.spd*dt*(e.alert&&!e.isBoss?1.25:1); // alert, they come at a run
      const nx=e.x+dx2/d*step,nz=e.z+dz2/d*step;
      if(!currentZoneSolid(nx,nz)){e.x=nx;e.z=nz;}
    }
    e.mesh.position.set(e.x,activeTerrainH(e.x,e.z),e.z);
    e.mesh.lookAt(px,activeTerrainH(e.x,e.z),pz);
    // v63 — Live-update combatYaw only when NOT mid-attack. The visual mesh
    // turret tracks the player every frame, but combat facing freezes during
    // windup (telegraphT > 0) and recovery (atkCd > 0) — the player can
    // sidestep their swing and circle into the back arc during those windows.
    // Idle alert state keeps facing live: no back available to attack head-on.
    if(e.telegraphT <= 0 && e.atkCd <= 0){
      e.combatYaw = Math.atan2(px - e.x, pz - e.z);
    }
    e.el.position.set(e.x,activeTerrainH(e.x,e.z)+.8,e.z);
    e.hpFg.scale.x=e.hp/e.maxHp;
    e.hpFg.position.x=(e.hp/e.maxHp-1)*.275;
    if(e.hp<e.maxHp&&e.hpBg&&!e.hpBg.visible){e.hpBg.visible=true;e.hpFg.visible=true;} // v80 — show once hurt
    // Attack — now gated by telegraph. Winds up, pulses emissive red, then strikes.
    e.atkCd-=dt;
    if(e.telegraphT>0){
      e.telegraphT -= dt;
      const p = 1 - Math.max(0, e.telegraphT) / (e.telegraphMax||0.35);
      telegraphPulse(e, p);
      if(e.telegraphT<=0){
        e.telegraphT = 0;
        telegraphReset(e);
        // Strike — re-check range (whiff if player stepped out of the wind-up bubble).
        // v61l: delegates to executeStrike (shared with dungeon) so parry/late-block/
        // unblocked branches all work in zone combat. Previously the zone path applied
        // straight damage with no `blocking` check — right-click drained stamina but
        // didn't reduce damage.
        // v61c2 — bosses use a per-boss biteRange (Faolchú: 2.0u, vs the
        // 1.4u default). Bigger creature, longer reach. Damage roll
        // unchanged — boss damage tuning lives in BOSSES.dmg.
        e.atkCd=e.atkSpd;
        // v61c3 — Boss-specific strike sound. Fires regardless of hit/whiff
        // because the bite motion happens either way; the player sees jaws
        // close and should hear the snap. Layered with the player-hurt
        // sound (from executeStrike) on a successful land — they reinforce
        // each other without muddying.
        if(e.isBoss && e.bossId==='faolchu' && typeof sndFaolchuBite==='function'){
          sndFaolchuBite();
        }
        if(strikeReaches(e)){
          const def2=_armour();
          const rawDmg=Math.max(1,e.dmg-Math.floor(def2*.5)+Math.floor(Math.random()*4));
          executeStrike(e, rawDmg, now);
        } else {
          sndSwing();
        }
      }
    } else if(dist<(e.isBoss?(e.bossDef.biteRange||1.1):1.1) && e.atkCd<=0){
      // v61c2 — bosses use bossDef.telegraphBase (0.6s for Faolchú) scaled
      // by the current phase's telegraphMult (1.0 / 0.85 / 0.55) so the
      // wind-up shortens as HP drops — Phase 3 reads as frenzy.
      if(e.isBoss && e.bossDef){
        const phases = e.bossDef.phases || [];
        const ph = phases.find(p=>p.id===e.phaseId) || phases[0] || {telegraphMult:1.0};
        e.telegraphMax = Math.max(TELL_MIN, (e.bossDef.telegraphBase||0.6) * (ph.telegraphMult||1.0)); // S282 — no tell under 0.45 s, the frenzy included
      } else {
        e.telegraphMax = telegraphDuration(e);
      }
      e.telegraphT = e.telegraphMax;
      // v63 — Stamp combatYaw at windup start. The enemy's mesh.lookAt
      // continues to track the player for the visual turret feel, but
      // combatYaw freezes here — captures the direction toward the player
      // at the moment of commitment. Backstab tests against this stored
      // value, giving the player a window to sidestep the swing and
      // strike from the flank/rear during windup + recovery.
      e.combatYaw = Math.atan2(px - e.x, pz - e.z);
      // v61c3 — Boss-specific telegraph sound. The Faolchú gets a
      // descending growl-scream replacing the generic chirp; signals to
      // the player that this is not a regular enemy wind-up.
      if(e.isBoss && e.bossId==='faolchu' && typeof sndFaolchuGrowl==='function'){
        sndFaolchuGrowl();
      } else {
        sndTelegraph();
      }
    }
  });
}

// v61c2 — Boss healthbar HUD tick. Reads the active boss out of ZE (only
// one alive boss at a time in current design) and updates the top-of-screen
// bar's width + phase color class. Hides the HUD when no boss is present
// or the boss is dead.
//
// Called from the main render loop alongside tickZoneEnemies. Cheap — one
// ZE.find per frame plus a single style mutation when the bar value changed.
// The find returns null in 99%+ of frames over the course of a playthrough
// (one fight per character, ~3 minutes), so the perf impact is negligible.
function tickBossHud(){
  const hud = document.getElementById('bossHpHud');
  if(!hud) return;
  // Find the first alive boss in ZE. Multi-boss support is forward-compat
  // — for Session A there's only the Faolchú in burned Ashenmoor.
  let boss = (typeof ZE!=='undefined' && ZE)
               ? ZE.find(e=>e && e.isBoss && !e.dead && !e.locked && (activeZoneId!=='world' || (e.alert && Math.hypot(e.x-px,e.z-pz)<40))) // S270 — in the world, only a boss that is on you
               : null;
  if(!boss){ // v80 — lair beasts, captains, wyrms, and the masters below: the nearest alert boss within 40u
    const L=(activeZoneId==='world')?((ZONES.world&&ZONES.world.enemies)||[]):(typeof ENEMIES!=='undefined'?ENEMIES:[]);let bd=40;for(const e of L){if(!e||e.dead||!(e.boss||e.isBoss)||!(e.alert||e._agg))continue;const d=Math.hypot(e.x-px,e.z-pz);if(d<bd){bd=d;boss=e;}}if(boss&&!boss.displayName)boss.displayName=boss.name;}
  if(!boss){
    if(hud.style.display !== 'none') hud.style.display = 'none';
    return;
  }
  if(hud.style.display !== 'block') hud.style.display = 'block';
  const nameEl = document.getElementById('bossHpName');
  if(nameEl && nameEl.textContent !== boss.displayName) nameEl.textContent = boss.displayName;
  const fill = document.getElementById('bossHpFill');
  if(!fill) return;
  const frac = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
  fill.style.width = (frac * 100) + '%';
  // Phase color class — set based on the boss's current phaseId so the
  // class transition matches the in-engine phase machine in tickZoneEnemies.
  // Fallback to HP fraction if phaseId isn't set (defensive).
  const ph = boss.phaseId || (frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3);
  fill.classList.remove('ph2','ph3');
  if(ph===2) fill.classList.add('ph2');
  else if(ph===3) fill.classList.add('ph3');
}

function tickZoneBalls(dt,sc){
  for(let i=ZB.length-1;i>=0;i--){
    const fb=ZB[i];
    // v64.2 — Arrows have their own motion + collision pipeline (gravity,
    // sub-stepped geometry-stick, orientation tracking). Handled before the
    // generic spell motion. Returns 'expired' (despawn), 'stuck-geom' or
    // 'stuck-enemy' (skip enemy collision this frame), or 'flying' (proceed
    // to enemy-hit check below).
    if(fb.userData.isArrow){
      const arrowState = tickArrowMotion(fb, dt, /*isOW=*/true);
      if(arrowState === 'expired'){
        // Stuck-enemy arrows have body as parent (not sc directly), so
        // sc.remove(fb) is a no-op for them — they'll be cleaned up by
        // the body's despawn or via the parent pointer. Stuck-geom arrows
        // sit in sc; this remove handles them. In-flight expiration also
        // sits in sc.
        if(fb.parent) fb.parent.remove(fb);
        ZB.splice(i,1);
        continue;
      }
      if(arrowState === 'stuck-geom' || arrowState === 'stuck-enemy'){
        // Planted — skip both spell motion and enemy collision. The arrow
        // remains in ZB so its lifetime ticks down on subsequent frames.
        continue;
      }
      // Else 'flying' — fall through to the arrow-vs-enemy branch below
      // (which is the existing v64 ZE collision block). The generic spell
      // motion block immediately below is skipped via the early branch
      // structure: arrows never reach the spell-motion line because we
      // jump straight to the enemy-check below.
    } else {
      fb.userData.life-=dt;
      fb.position.x+=fb.userData.vx*dt;
      fb.position.y+=(fb.userData.vy||0)*dt;
      fb.position.z+=fb.userData.vz*dt;
      // Mastery halo: orbit spin + subtle tilt wobble
      if(fb.userData._halo){
        fb.userData._halo.rotation.z+=dt*6;
        fb.userData._halo.rotation.y=Math.sin(performance.now()*0.004)*0.25;
      }
      // End-of-flight: life expired OR hit geometry (wall, ground).
      // Caor Mastery (Living Ember) detonates on solid contact of either kind — stone, earth, floor, hillside all count.
      // Life expiry does NOT detonate — an ember that runs out of energy mid-air fizzles; only physical impact blasts.
      {
        const hitWall=currentZoneSolid(fb.position.x,fb.position.z);
        const groundY=activeTerrainH(fb.position.x,fb.position.z);
        const hitGround=fb.position.y<=groundY;
        if(fb.userData.life<=0||hitWall||hitGround){
          if((hitWall||hitGround) && fb.userData.spell && fb.userData.spell.id==='caor' && fb.userData.tier===3){
            // Snap blast Y to ground + small offset so the ring sits on the surface rather than clipping below it
            const blastY = hitGround ? groundY+0.1 : fb.position.y;
            triggerCaorBlast(sc, fb.position.x, blastY, fb.position.z, fb.userData.spell, fb.userData.tier, true);
          }
          sc.remove(fb);ZB.splice(i,1);continue;
        }
      }
    }
    // v61c4 — Boss-fired projectiles: check player collision instead of
    // ZE collision, and apply damage to the player. Mirrors the dungeon-
    // side enemy-orb path. Runs BEFORE the player-spell-vs-enemy block
    // so a boss orb can't accidentally damage the boss itself if its
    // path crossed the boss's body center.
    if(fb.userData.fromBoss){
      // Player collision sphere — ~0.7u radius, similar to the enemy
      // collision used by player projectiles. Y is checked loosely since
      // the orb travels horizontally and the player's "body" is roughly
      // 0.6 to 1.7 above ground.
      const ddP = Math.hypot(fb.position.x-px, fb.position.z-pz);
      const playerHitR = 0.75;
      if(ddP < playerHitR && !rollUntouchable(performance.now()/1000)){ // S283 — a roll takes you through the fire
        const baseDmg = fb.userData.dmg || 20;
        const def2 = _armour();
        const dmgReduceMult = _wardMult()*_magicResist();
        // v61c7 — Magic block path. Distinct from physical block rates:
        //   shield: 40% reduction (down from 65% for physical) — shields
        //          don't fully stop fire/magic, lore-fits the seam-fire
        //   bare:   15% reduction (down from 35%) — bare hands against
        //          fire is mostly a token gesture
        // Future: shields can override via sh.magicBlock property; default
        // 0.40 if not specified.
        const sh = EQ.offhand;
        const hasShield = sh && sh.shieldType==='shield';
        const _resolveMult = Math.max(0.5, 1 - (ATTRS.resolve||0)*0.05);
        let finalDmg;
        if(blocking){
          const magicReduction = _blockBoost(hasShield ? (sh.magicBlock||0.40) : 0.15);
          finalDmg = Math.max(1, Math.round(baseDmg * (1-magicReduction) * dmgReduceMult) - Math.floor(def2*0.3));
          // v61c7 — Stamina cost = absorbed * Resolve mult, mirroring the
          // late-block formula in executeStrike. Less than physical block
          // because absorbed is smaller (less damage was reduced).
          const absorbed = baseDmg - finalDmg;
          const magicBlockStamCost = Math.max(1, Math.round(absorbed * _resolveMult));
          stamina = Math.max(0, stamina - magicBlockStamCost);
          if(stamina===0){ staminaCD = 2; lvAct.staminaDepleted++; }
          sndBlock();
          showMsg(`🛡 Resisted! Faolchú's fire hits for ${finalDmg} (reduced)`,'#ff8844');
        } else {
          finalDmg = Math.max(1, Math.round(baseDmg * dmgReduceMult) - Math.floor(def2*0.3));
          showMsg(`🔥 Faolchú's fire hits you for ${finalDmg}!`,'#ff5522');
          sndPlayerHurt();
        }
        PHP = Math.max(0, PHP-finalDmg);
        hurtT = .4;
        lvAct.damageTaken += finalDmg;
        lastHitT = performance.now()/1000;
        if(PHP<=0 && !dead) playerDead();
        sc.remove(fb); ZB.splice(i,1);
        continue;
      }
      // No player hit and orb still has life — let the next iteration tick.
      continue;
    }
    // v64 — Arrow vs enemy. Arrows use applyMeleeDamage (the canonical
    // physical-damage pipeline; pierce-type lands here just like a melee
    // hit). Arrow is single-target, despawns on first contact. Backstab is
    // NOT applied to arrow hits — bow play doesn't have the positional
    // commitment loop melee does (Session 4 will revisit if archery
    // backstab feels missing). Posture drain applied at the normal melee
    // amount so a bow build can still posture-break enemies.
    if(fb.userData.isArrow){
      let arrowHit = false;
      ZE.forEach(e=>{
        if(arrowHit || e.dead || e.locked) return;
        if(Math.hypot(fb.position.x-e.x, fb.position.z-e.z) < ARROW_HIT_RADIUS){
          arrowHit = true;
          // Reach into the arrow's pre-rolled rawDmg and route through the
          // resist pipeline. wType is stamped on the arrow at fire time
          // (typically 'pierce'; silver/broadhead arrows override).
          const _savedWType = e._tmpWType;
          // applyMeleeDamage reads wType from EQ.weapon; we want it to use
          // the arrow's resolved wType instead. The cleanest path is to
          // pass via a per-call override. Inline the resist logic here to
          // avoid widening applyMeleeDamage's signature for one caller.
          const wt = fb.userData.wType || 'pierce';
          const resistMult = (e.resist && typeof e.resist[wt]==='number') ? e.resist[wt] : 1.0;
          let dmg = Math.max(1, Math.floor(fb.userData.arrowDmg * resistMult * _fortuneCrit()));
          // Flat def subtraction (same shape as applyMeleeDamage)
          if(typeof e.def === 'number') dmg = Math.max(1, dmg - Math.floor(e.def * 0.5));
          e.hp = Math.max(0, e.hp - dmg);
          e.alert = true;
          if(e.hpFg){ e.hpFg.scale.x = e.hp/e.maxHp; e.hpFg.position.x = (e.hp/e.maxHp-1)*.275; }
          sndHitEnemy((typeof wType!=='undefined'?wType:(typeof wt!=='undefined'?wt:undefined)),((typeof physResistMult!=='undefined'&&physResistMult<.8)||(typeof resistMult!=='undefined'&&resistMult<.8)));
          // Posture drain — arrows deal normal-melee posture drain (not
          // power-attack; that's the melee commitment loop's reward).
          if(e.hp>0 && typeof e.posture==='number' && !isStaggered(e)){
            const broke = applyPostureDamage(e, POSTURE_DRAIN_NORMAL, performance.now()/1000);
            if(broke){
              staggered.push({e, t: POSTURE_BREAK_STUN});
              const body = enemyBodyMesh(e);
              const m = body && body.material;
              if(m && m.emissive){ m.emissive.setHex(0xffaa00); setTimeout(()=>{ if(m && m.emissive) m.emissive.setHex(0); }, 220); }
              showMsg(`💥 ${e.name} staggered!`, '#ffcc66');
            }
          }
          // Resist tag (Weak!/Resisted/etc.) — synthetic info object for dmgTag.
          const tagInfo = {dmg, resistMult, wType:wt, crit:false, backstab:false, defPierced:false};
          if(e.hp<=0){
            // Kill — route through the same kill path as melee. zone kill
            // path uses killZoneEnemy. The arrow is removed cleanly because
            // the enemy body it would stick into is about to be despawned
            // by the kill path anyway (despawn-with-corpse canon).
            const _killTag = ` (ARROW)${dmgTag(tagInfo, e)}`;
            if(typeof killZoneEnemy === 'function') killZoneEnemy(e, sc, _killTag);
            else { e.dead = true; }
            sc.remove(fb); ZB.splice(i,1);
          } else {
            showMsg(`🏹 Arrow hits ${e.name} for ${dmg}!${dmgTag(tagInfo, e)}`, '#c8a878');
            // v64.2 — Stick the arrow into the enemy body. The body mesh
            // becomes the arrow's parent so it follows movement/rotation.
            // The arrow stays in ZB (not removed from the array) so its
            // stuckLife counts down on subsequent frames via tickArrowMotion.
            const body = enemyBodyMesh(e);
            _stickArrowToEnemy(fb, body, sc);
          }
        }
      });
      if(arrowHit) continue;
      // Arrow missed all enemies this frame — let it keep flying.
      continue;
    }
    // Caor — Living Ember (Mastery): blast on first enemy contact. Detects any enemy in hit radius
    // and detonates at the projectile's current position, damaging all enemies within BLAST_R of impact.
    if(fb.userData.spell && fb.userData.spell.id==='caor' && fb.userData.tier===3){
      let contact=false;
      for(const e of ZE){
        if(e.dead||e.locked)continue;
        if(Math.hypot(fb.position.x-e.x,fb.position.z-e.z)<.7){contact=true;break;}
      }
      if(contact){
        triggerCaorBlast(sc, fb.position.x, fb.position.y, fb.position.z, fb.userData.spell, fb.userData.tier, true);
        sc.remove(fb);ZB.splice(i,1);continue;
      }
    }
    ZE.forEach(e=>{
      if(e.dead||e.locked)return;
      if(Math.hypot(fb.position.x-e.x,fb.position.z-e.z)<.7){
        const sp=fb.userData.spell||SPELLS[0];
        const tier=fb.userData.tier||1;
        const info=applySpellDamage(e, sp, tier);
        const dmg=info.dmg;
        e.hp=Math.max(0,e.hp-dmg);e.alert=true;
        // Sioc — freeze on hit. Mastery stacks up to 4.5s, lower tiers refresh to 1.5s.
        // Brings zone parity with dungeon hit handler (pre-v35 Sioc stagger worked in dungeons only).
        if(sp.id==='sioc'){
          const existing=staggered.find(s=>s.e===e);
          if(existing){
            if(tier===3){ existing.t=Math.min(4.5, existing.t+1.5); showMsg(`❄️ Still-Winter's Touch deepens (${existing.t.toFixed(1)}s)`,'#aaddff'); }
            else existing.t=Math.max(existing.t, 1.5);
          } else {
            staggered.push({e,t:1.5});
          }
        }
        // Solas-Gheal — Morning's-First-Word (Mastery): heals caster on kill.
        if(e.hp<=0 && sp.id==='solas_gheal' && tier===3){
          const healAmt=Math.round(effMaxHP()*0.15);
          PHP=Math.min(effMaxHP(), PHP+healAmt);
          showMsg(`✨ Morning's-First-Word — +${healAmt} HP`,'#aaffaa');
        }
        if(e.hp<=0)killZoneEnemy(e,sc,dmgTag(info,e));
        else showMsg(`${sp.ico} ${spellDisplayName(sp,tier)} hits ${e.name} for ${dmg}!${dmgTag(info,e)}`,'#88ccff');
        sc.remove(fb);ZB.splice(i,1);
      }
    });
  }
}

// Loot drop chance — based on fortune attribute and enemy difficulty (hp as proxy for rarity)
// Base 35% chance, fortune adds up to +25%, harder enemies add up to +20%
function lootDropChance(e){
  const fortuneBonus=(ATTRS.fortune||0)*0.025; // +2.5% per fortune point, cap ~25% at 10
  const hpRatio=Math.min(1,(e.maxHp||e.hp||20)/90); // scales 0→1 from weakest to golem
  const diffBonus=hpRatio*0.20;
  return Math.min(0.85,0.35+fortuneBonus+diffBonus);
}

function killZoneEnemy(e,sc,tag=''){
  if(e._duel&&typeof WORLD!=='undefined'&&WORLD.duelKill&&WORLD.duelKill(e))return; /* S373 — Rowe yields before she falls */
  if(typeof WORLD!=='undefined'&&!e._guildCounted){e._guildCounted=true;WORLD.guild.onKill(e,'zone');} // v80 S12
  e.dead=true;
  if(e._guard&&typeof WORLD!=='undefined'&&WORLD.guardKilled)try{WORLD.guardKilled(e);}catch(err){} // S157
  sndEnemyDeath();kills++;lvAct.kills++;xp+=Math.round(e.xpVal*_buffMult('xpBoost',1));chkLvl();
  const firstKill=!seenEnemyTypes.has(e.name);
  if(firstKill){seenEnemyTypes.add(e.name);addLog('⚔','First blood — slew a '+e.name);}
  // Corpse system — unified with dungeon via the same loot panel. Mesh slumps + tints; glow+spark mark the body.
  e.mesh.rotation.z=Math.PI/2;
  const terrainY = typeof activeTerrainH==='function' ? activeTerrainH(e.x,e.z) : 0;
  e.mesh.position.set(e.x, terrainY+0.15, e.z);
  e.mesh.traverse(c=>{if(c.isMesh&&c.material){c.material=c.material.clone();c.material.color.multiplyScalar(.35);}});
  // Hide HP bar
  if(e.hpFg){e.hpFg.visible=false;if(e.hpFg.parent)e.hpFg.parent.children.forEach(c=>{if(c.geometry&&c.geometry.type==='PlaneGeometry')c.visible=false;});}
  // Loot glow + spark (scene-aware — uses the scene the enemy was added to)
  // v61c8 — Loot indicator height. Was a flat 0.55u above terrain, which
  // tucked the spark INSIDE the boss's slumped corpse mesh. The Faolchú is
  // scale 1.85; rotated 90° on Z (corpse pose), the body's vertical extent
  // reaches ~0.82u — the yellow loot glow at 0.55u sat buried under it.
  // Bosses get 2.2u so the spark floats clearly above the silhouette;
  // regular zone enemies stay at 0.55u.
  // v61d0 — Bumped from 1.6u to 2.2u after playtest reported the indicator
  // still wasn't reliably visible. Boss aura light at intensity 2.2 / range
  // 9 was visually competing with the loot spark; raising it clears the
  // glow envelope and reads as "above the body" rather than "in the body."
  const lootY = terrainY + (e.isBoss ? 2.2 : 0.55);
  const lootGl = new THREE.PointLight(0xffcc44, 1.2, 3);
  lootGl.position.set(e.x, lootY, e.z);
  sc.add(lootGl);
  const lootSparkTmpl = (typeof SPELL_ORB_TEMPLATES!=='undefined') ? SPELL_ORB_TEMPLATES['lootSpark'] : null;
  const lootSpark = lootSparkTmpl ? lootSparkTmpl.clone() : new THREE.Mesh(new THREE.SphereGeometry(.06,5,5), new THREE.MeshBasicMaterial({color:0xffdd66}));
  lootSpark.position.set(e.x, lootY, e.z);
  sc.add(lootSpark);
  // Roll loot via shared pipeline — corpse drop chance + bonus roll, zone-appropriate theme
  const items = rollContainerLoot('corpse', null, null, lootDropChance(e));
  // v61c2 — Boss death hooks. The Faolchú gets:
  //   - guaranteed unique drop (The Faolchú's Mark amulet) prepended to
  //     the loot items array, so the corpse always carries it
  //   - worldState.faolchuDefeated flag flip (gates re-spawn on re-entry,
  //     gates Q7 obj 1 prereq for triage objectives)
  //   - defeat_boss event fired through checkQuestProgress for Q7 obj 1
  //   - addLog beat so the player has a journal entry
  // The flag flip happens BEFORE the event fires so any quest objective
  // that conditions on the flag (rather than the event) sees the new state.
  if(e.isBoss && e.bossId==='faolchu'){
    worldState.faolchuDefeated = true;
    // Prepend the Mark to the loot. v61c8 rebuild — was an inert curio
    // (intBonus/resistTine were stored as top-level fields the stat
    // aggregator never read; buyPrice/sellMult of 0 meant zero merchant
    // value). Now: a tier-5 amulet carrying a unique boss-only enchant
    // ("of the Sigil-Reader") that gives +3 INT, +30 max mana, +0.30
    // mana/s regen — properly routed through enchantStats so the
    // armor-bonus aggregator picks it up. Worth ~800g to merchants
    // (sellMult 0.5 → 400g sell). Reads as a serious endgame piece for
    // Act I's signature kill.
    // v61d0 — Mark is now also an essential quest item (Q7 obj 2).
    // sellItem gates on `unique:true` (this session) so the 800/400 prices
    // remain as fictional value but can no longer be acted on at the
    // merchant counter. The takeLootItem hook fires `receive_item` to
    // tick obj 2 when the Mark enters BAG. Aldwyn's customActiveDialog
    // also branches on whether the Mark is on the player at conversation
    // time — see buildQuestTopicsForNPC.
    const _markEnchant = ARMOR_ENCHANTS.find(e=>e.id==='faolchu_mark');
    const mark = {
      name:"The Faolchú's Mark",
      ico:'📿',
      type:'equip',
      slot:'amulet',
      unique:true,
      tier:5,
      material:'Sigil-Bone',
      matCol:0x4a3026,
      armorType:'Amulet',
      armorW:0.2,
      def:3,
      weight:0.2,
      buyPrice:800,
      sellMult:0.5,
      reqAttr:'intelligence', reqVal:8,
      // Apply the unique enchant directly. enchant ref + id for save/load,
      // enchantStats stamped here so getArmorEnchantBonuses() picks up the
      // +3 INT / +30 max mana / +0.30 mana regen immediately on equip.
      enchant: _markEnchant,
      enchantId: 'faolchu_mark',
      enchantName: _markEnchant ? _markEnchant.name : 'of the Sigil-Reader',
      enchantStats: _markEnchant ? _markEnchant.apply({tier:5}) : {intBonus:3, maxManaBonus:30, mpRegen:0.30},
      desc:"A blackened-bone disc on a sinew cord, taken from the seam where the wolf-shape's binding tried to close. The carving on the face almost spells something — the strokes are right, the order isn't. Worth nothing to anyone who cannot read it. Worth something to the one who can.",
    };
    items.unshift(mark);
    // Quest event — Q7 obj 1 (defeat_boss faolchu) ticks here. Fired AFTER
    // worldState.faolchuDefeated is set so any objective gated on that flag
    // sees consistent state.
    if(typeof checkQuestProgress==='function'){
      checkQuestProgress('defeat_boss', {bossId:'faolchu', zone:'overworld'});
    }
    if(typeof addLog==='function'){
      addLog('🐺','The Faolchú collapses. The seams unmake themselves.');
    }
    // v61c3 — Death sound. Procedural cracking/dissolve. Fires once.
    if(typeof sndFaolchuDeath==='function'){
      sndFaolchuDeath();
    }
    // v61d1 — Bespoke death VFX. Bursts particles outward from the six
    // sigil-trace seams while ramping the sigils' own color to black over
    // 0.5s. Runs in parallel with the death audio (initial crack at 0ms,
    // stuttering unmaking 200-700ms, descending wail 700-1900ms) and
    // resolves before the loot reveal chime at 1800ms. Uses the boss's
    // limbs.sigilMeshes references — captured at corpse-pose-rotation time
    // so the bursts emerge from where the seams visually are after the
    // body slumps.
    if(typeof spawnFaolchuDeathBurst==='function'){
      spawnFaolchuDeathBurst(e, sc);
    }
    // v61d0 — Loot reveal cue. Fired 1.8s after death, as the descending
    // wail dissolves to silence. Two-sine perfect-fifth chime + subtle
    // high-band breath — clean, brief, tonally opposite the boss's noise
    // palette. Pairs with the bumped loot-indicator height (2.2u) to make
    // the "loot is here" beat unmissable across audio + visual channels.
    if(typeof sndFaolchuLootReveal==='function'){
      setTimeout(()=>sndFaolchuLootReveal(), 1800);
    }
    // v61c4 — Despawn any lesser Faolchú adds still alive at the moment
    // the boss dies. Their binding source is gone; they unmake themselves
    // along with the boss. Without this sweep, lessers remain alive in
    // ZE after the boss kill and the fight doesn't feel "resolved."
    if(typeof despawnLesserFaolchus==='function'){
      despawnLesserFaolchus();
    }
  }
  const drops = items.length > 0;
  ZONE_CORPSES.push({
    x:e.x, z:e.z, y:(activeZoneId==='world')?0.45:terrainY, name:e.name, displayName:e.name, // v80 S135 — relative in the world (lookingAt adds the ground)
    items, gl:lootGl, spark:lootSpark, age:0, scene:sc, zone:activeZoneId, looted:false,
  });
  // Dim enemy aura light now that it's a corpse (enemy.el keeps existing but dim)
  if(e.el) e.el.intensity = 0;
  if(drops){showMsg(`${e.name} slain!${tag} Search the body.`,'#c8a84a');}
  else{showMsg(`${e.name} slain!${tag}`,'#888');lootGl.intensity=0;lootSpark.visible=false;}
}

function attackZoneEnemies(isPower, _isDeferred){
  if(playerStaggered(performance.now()/1000))return; // S281
  // v62 — see attack() for the design rationale. Same isPower semantics.
  // v62.8 — _isDeferred mirrors attack(): when true, the deferred fire of a
  // power attack that committed stamina+cooldown in mouseup. Skip cost gates;
  // jump to swing-tween + sound + hit detection.
  const _w=EQ.weapon;
  const _isPow = !!(isPower && _w);
  const _swFactor = _weaponSwingFactor();
  if(!_isDeferred){
    const _wt=(_w&&_w.weight)||FISTS.weight;
    const _stMul = _isPow ? POWER_STAM_MULT : 1.0;
    const _stCost=_wt*7*_stMul;const _stMin=_wt*5*_stMul;
    if(atkCd>0)return;
    _exhaustedStrike=stamina<_stMin; if(_exhaustedStrike)flashStamina(); // v80 S9 — swing anyway, weakly
    atkCd=.5*(1-attrEff('swiftness')*0.01)*(_isPow?POWER_ATK_CD_MULT:1)*_swFactor*(_exhaustedStrike?1.3:1);
    stamina=Math.max(0,stamina-_stamCost(_stCost));
  }
  swingT=(_isPow?(ANIM_PARAMS.swing.powerDur):(ANIM_PARAMS.swing.normalDur))*_swFactor;
  // v69.1 — whoosh at swing start; contact + hit resolution at impact.
  sndWhoosh();
  // v66.1 — defer audio + hit resolution to the swing impact frame.
  _pendingStrike = { resolveFn: _resolveZoneStrike, isPow: _isPow, fired: false }; _swingStartS=performance.now()/1000;_offenceS=playClockS;
}
// v66.1 — Zone melee resolution, extracted from attackZoneEnemies() and fired
// at the swing impact frame. Impact-gather candidates, audio, cleave/damage.
function _resolveZoneStrike(_isPow){
  sndSwing();
  let hit=false;
  const _cleaveCap = (EQ.weapon && EQ.weapon.cleaveTargets) || CLEAVE_DEFAULT;
  const _wPostMult = (EQ.weapon && EQ.weapon.postureMult) || 1.0;
  const _candidates = [];
  ZE.forEach(e=>{
    if(e.dead||e.locked)return;
    const ex=e.x-px,ez=e.z-pz,dist=Math.sqrt(ex*ex+ez*ez);
    const _atkRange = e.isBoss ? 3.0 : 2.2;
    // v65.2 — Cone tightened to .45 (~117° total). See attack() for rationale.
    if(dist<_atkRange&&(ex*fwdX+ez*fwdZ)/(dist||1)>.45){
      _candidates.push({e,dist});
    }
  });
  _candidates.sort((a,b)=>a.dist-b.dist);
  if(!_candidates.length&&activeZoneId==='world'&&typeof WORLD!=='undefined'&&WORLD.strikeNpc&&WORLD.strikeNpc(fwdX,fwdZ))hit=true; // S157 — assault
  let _hitsLanded = 0;
  for(const _c of _candidates){
    if(_hitsLanded >= _cleaveCap) break;
    const e = _c.e;
    _hitsLanded++;
    // v65 — Power-vs-shielded enemy: pure stagger, no damage. Mirrors the
    // dungeon path. See attack() for the design rationale.
    if(_isPow && e.shieldUp && !riposteOpen(e)){
      if(typeof e.posture==='number' && !isStaggered(e)){
        applyPostureDamage(e, (e.maxPosture||999), performance.now()/1000);
        staggered.push({e, t: POSTURE_BREAK_STUN});
        const body = enemyBodyMesh(e);
        const m = body && body.material;
        if(m && m.emissive){
          m.emissive.setHex(0xffaa00);
          setTimeout(()=>{ if(m && m.emissive) m.emissive.setHex(0); }, 220);
        }
      }
      e.shieldUp = false;
      dropShieldGuard(e);
      e.alert = true; hit = true;
      if(_isPow) sndPowerHit(); else sndHitEnemy((typeof wType!=='undefined'?wType:(typeof wt!=='undefined'?wt:undefined)),((typeof physResistMult!=='undefined'&&physResistMult<.8)||(typeof resistMult!=='undefined'&&resistMult<.8)));
      showMsg(`💥 ${e.name}'s guard breaks!`, '#ffcc66');
      continue;
    }
    {
      const w=EQ.weapon,lo=w?w.atk[0]:FISTS.atk[0],hi=w?w.atk[1]:FISTS.atk[1];
      const mightMult=1+(attrEff('might')*ATTR_DMG_PER_POINT);
      const meleeBuff=_buffMult('meleeDmg',1)*_buffMult('dmgBurst',1);
      const powerMult=_isPow?POWER_DMG_MULT:1.0;
      // v71 — Frontal shield block (see _resolveDungeonStrike for rationale).
      const shMult=riposteOpen(e)?1:shieldFrontMult(e);
      const rawDmg=Math.floor((lo+Math.floor(Math.random()*(hi-lo))+Math.floor(level*1.5))*mightMult*meleeBuff*powerMult*shMult);
      const info=applyMeleeDamage(e, rawDmg);
      const dmg=info.dmg;
      e.hp=Math.max(0,e.hp-(e._stun>0?dmg*2:dmg));e.alert=true;hit=true;alertPack(e,16);
      if(_isPow)sndPowerHit();else sndHitEnemy((typeof wType!=='undefined'?wType:(typeof wt!=='undefined'?wt:undefined)),((typeof physResistMult!=='undefined'&&physResistMult<.8)||(typeof resistMult!=='undefined'&&resistMult<.8)));
      // v61gj — Posture drain (same shape as the dungeon path). Skipped if the
      // hit killed the target or if already staggered. v62: power attacks drain
      // POSTURE_DRAIN_POWER (25) vs normal POSTURE_DRAIN_NORMAL (8).
      // v65: postureMult from WEAPON_TYPES scales the drain on top.
      if(e.hp>0 && typeof e.posture==='number' && !isStaggered(e)){
        const drain = (_isPow ? POSTURE_DRAIN_POWER : POSTURE_DRAIN_NORMAL) * _wPostMult;
        const broke = applyPostureDamage(e, drain, performance.now()/1000);
        if(broke){
          staggered.push({e, t: POSTURE_BREAK_STUN});
          const body = enemyBodyMesh(e);
          const m = body && body.material;
          if(m && m.emissive){
            m.emissive.setHex(0xffaa00);
            setTimeout(()=>{ if(m && m.emissive) m.emissive.setHex(0); }, 220);
          }
          showMsg(`💥 ${e.name} staggered!`, '#ffcc66');
        }
      }
      const sc=activeZoneId==='forest'?forestScene:ironhavenScene;
      // Mirror attack()'s post-hit shape: if already dead, kill; else fire enchant
      // (which can push hp <= 0 via extraDmg) then re-check. Previously zone combat
      // skipped applyWeaponEnchant entirely — all 6 weapon enchants were inert
      // anywhere outside a dungeon. (v61i fix; v61k folds the enchant toast into the
      // hit message so it doesn't get overwritten on the same tick.)
      // v63 — Compose combat-decoration tag once so the kill and non-kill paths
      // both surface (BACKSTAB) / (CRIT) / (POWER) feedback. Previously kills
      // dropped the tag entirely, so a kill-on-backstab read identically to a
      // kill-on-frontal — the player got no reward signal for stealth play.
      const _guardTag = (shMult<1.0) ? ' (GUARDED)' : '';
      const _killTag = `${_isPow?' (POWER)':''}${info.backstab?' (BACKSTAB)':''}${info.finisher?' (FINISHER)':info.riposte?' (RIPOSTE)':info.crit?' (CRIT)':''}${_guardTag}${dmgTag(info,e)}`;
      if(e.hp<=0)killZoneEnemy(e,sc,_killTag);
      else{
        const enc=applyWeaponEnchant(dmg,e);
        if(e.hp<=0){
          killZoneEnemy(e,sc,_killTag);
          if(enc)showMsg(enc.tag,enc.col);
        } else showMsg(`Hit ${e.name} for ${dmg}!${_isPow?' (POWER)':''}${info.backstab?' (BACKSTAB)':''}${info.finisher?' (FINISHER)':info.riposte?' (RIPOSTE)':info.crit?' (CRIT)':''}${_guardTag}${dmgTag(info,e)}${enc?' · '+enc.tag:''}`,'#ff9944');
      }
    }
  }
  if(!hit)showMsg('Swing!','#888');
  document.getElementById('df').style.boxShadow='inset 0 0 28px rgba(220,160,60,.4)';
  setTimeout(()=>document.getElementById('df').style.boxShadow='',150);
}
