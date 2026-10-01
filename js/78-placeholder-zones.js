
// Footstep timer
let _stepT=0;
function tickFootsteps(dt,moving,sprinting){
  if(!moving||!onGround){_stepT=0;return;}
  _stepT+=dt;
  const interval=sprinting?.32:.48;
  if(_stepT>=interval){_stepT=0;
    const onSnow=(typeof WORLD!=='undefined'&&WORLD.footprint)?WORLD.footprint():false; // v80 S147
    if(onSnow)sndSnowStep(sprinting);else sndFootstep(sprinting);}
}

// ════════════════════════════════════════════════════════════════
// AUDIO ENGINE
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// v61e — PLACEHOLDER ZONES (Act I map expansion)
// ════════════════════════════════════════════════════════════════
// These zones are scaffolded via registerPlaceholderZone. They exist
// so the player can walk the full Act I map — every node and road the
// SVG shows. Content (NPCs, shops, enemies, dungeons, quests) comes
// later. For now each zone has: correct-size footprint, biome
// atmosphere, multi-gate connections to its neighbors, and a central
// notice board carrying the SVG description text.
//
// Gate yaw convention recap:
//   yaw=0           → facing -Z (compass North) — used when arriving at a
//                     zone's HIGH-Z edge (player walks further into zone)
//   yaw=Math.PI     → facing +Z (compass South) — used when arriving at a
//                     zone's LOW-Z edge
//   yaw=-Math.PI/2  → facing +X (compass East)  — arriving at LOW-X edge
//   yaw=Math.PI/2   → facing -X (compass West)  — arriving at HIGH-X edge

// ─── South of Ashenmoor ───────────────────────────────────────────
registerPlaceholderZone({
  id:'south_road', kind:'wilderness', displayName:'🌾 South Road',
  region:'ashen',
  musicTrack:'road', size:80, seed:7001, biome:'plains',
  fogColor:0x8e9c7a, fogDensity:0.009,
  pathWaypoints:[{x:40,z:5},{x:40,z:75}],
  centerMarker:{title:'South Road', text:'Short road south from Ashenmoor to Redwater Ford. The Dearg runs rust-red here.'},
  gates:[
    // v61f: extended from 60→80 for more walking room between settlements.
    // v61g: Ashenmoor-return yaw 0→Math.PI. Playtest confirmed yaw=0 was
    //       leaving player facing the gate rather than into the zone on
    //       this particular edge; trusting the playtest over the convention.
    //       Redwater Ford spawn Z 7→12 so player clears the border tree row.
    // v61d7: south gate now lands in The Ashfeld (was redwater_ford). South
    //        Road → The Ashfeld → Redwater Ford is now the canonical route.
    {x:40, z:3,  targetZone:'overworld', spawnX:60, spawnZ:115, spawnYaw:Math.PI, label:'Ashenmoor'},
    {x:40, z:77, targetZone:'ashfeld',   spawnX:40, spawnZ:5,   spawnYaw:Math.PI, label:'The Ashfeld'},
  ],
});
registerPlaceholderZone({
  id:'redwater_ford', kind:'village', displayName:'🌿 Redwater Ford',
  region:'ashen',
  musicTrack:'village', size:50, seed:7002,
  skyCol:0x98bcd4, fogColor:0xa09870, fogDensity:0.011,
  centerX:25, centerZ:25, villageR:16, buildings:[],
  centerMarker:{title:'Redwater Ford', text:'South of Ashenmoor where An Dearg runs rust-red over pale stone. Mostly farmers. No dungeon nearby — unusual. The red water makes visitors uneasy; locals stopped noticing.'},
  gates:[
    // v61ef: gate moved from north wall (z=3) to west wall (x=3) per
    // locked map — Ashfeld sits west of Redwater Ford on the map, not
    // north. Player exiting Redwater toward Ashfeld now walks out the
    // west wall in 3D, matching the map direction.
    {x:3, z:25, targetZone:'ashfeld', spawnX:73, spawnZ:40, spawnYaw:Math.PI/2, label:'The Ashfeld'},
  ],
});

// ─── West coastal arc (Ashenmoor → Salthaven → Carraig Mór) ───────
// v61e3: regional identity pass. The two wilderness segments use the new
// `coast` biome (BIOME_PROFILES.coast) for sparse, exposed, salt-bleached
// terrain. The three settlements keep village-build but shift palette into
// a seaward gradient — Salthaven warm-harbor, Carraig Mór cold-stone, Inis
// Rua thin-and-strange. The arc darkens and saturates the further from
// inland the player walks.
registerPlaceholderZone({
  id:'west_track', kind:'wilderness', displayName:'🌊 The West Track',
  region:'coastal',
  musicTrack:'coast', size:80, seed:7003, biome:'coast',
  skyCol:0xc8d0d0, fogColor:0xa8b0a8, fogDensity:0.010,
  pathWaypoints:[{x:5,z:40},{x:75,z:40}],
  centerMarker:{title:'The West Track', text:'Coastal path connecting Salthaven to Hearthwick. Fishermen bring catch inland this way to the inn at the crossroads.'},
  gates:[
    // East-west road. v61ec: East endpoint now Hearthwick (was Ashenmoor) per
    // locked map geography. The track terminates at Hearthwick's west wall;
    // travelers continue south on Bealach Mór to reach Ashenmoor proper.
    // v61el: Both gates flagged guard:'commission' for full zone isolation.
    // The settlement-side gate (Hearthwick.W → west_track) is the gate that
    // ACTUALLY blocks the player pre-Q7; tagging the corridor's own gates
    // is belt-and-suspenders — if a save somehow loads with the player
    // inside west_track pre-Q7, they're correctly trapped (and can't
    // accidentally escape into Salthaven via the corridor's W gate). Same
    // pattern applied to northern_road and capital_road this ship.
    // v61en: east-gate spawnYaw fixed (was -π/2 / W, now π/2 / E). Player
    // arrives in Hearthwick at x:3 (near W edge) and must face east into
    // the village, not west back at the corridor. Same yaw-convention slip
    // pattern as v61ej/v61ek (convention: 0=N, π=S, π/2=E, -π/2=W).
    {x:77, z:40, targetZone:'hearthwick', spawnX:3,  spawnZ:30, spawnYaw:Math.PI/2,  label:'Hearthwick', guard:'commission'},
    // v61em: spawnYaw is -Math.PI/2 (W) so the player lands inside
    // Salthaven facing west into the village, not east back at the wall
    // they just came through. spawn coords updated for size-80 Salthaven —
    // entering near the east gate (which is now at x:77, z:40), step
    // a few units inside for clearance.
    {x:3,  z:40, targetZone:'salthaven',  spawnX:73, spawnZ:40, spawnYaw:-Math.PI/2, label:'Salthaven',  guard:'commission'},
  ],
});
// v61em: Salthaven fully built out — five buildings, four voiced shopkeepers,
// one shrine. Hilda is the signature character (Anglo-Saxon civic/working-
// institutional register, a la Áine carries Carraig Mór's). Bespoke detailFn
// builds the harbor: dock, fish-drying racks, beached rowboat, water mesh.
// Notice board carries a Hilda-voiced harbour notice. Five-building cluster
// laid out east-to-west so the player walks past every shop on their way
// from the West Track gate (east edge → Hearthwick) to the harbor on the
// WESTERN edge (Windward Sea).
//
// v61em coastal identity pass: size bumped 60→80, biome:'coast' for salt-
// bleached pale ground, terrainSlope:W for downhill-toward-the-sea, and
// openSide:'W' to suppress the western tree ring so the harbor is visible
// from anywhere in the village. Buildings, gates, dock, shrine, NPCs, water
// mesh ALL repositioned for the new size.
//
// v61em geography fix: harbor moved from EAST to WEST edge. The first ship
// put the ocean east — but Salthaven canon is on the west coast (Windward
// Sea), and the Hearthwick gate (east of Salthaven on the world map) lives
// on the east edge of the zone. With harbor-east, the East Track gate sat
// IN the water. Inverted everything: terrain slope dir 'E'→'W', openSide
// 'E'→'W', water mesh moved x:80→x:0, dock + pilings + rowboat + drying
// racks + shrine all mirrored across centerX. Buildings flipped face W→E
// (now face the western harbor) and x-coords mirrored, with the Inn moving
// from NW to NE (still the first building you see entering from East gate).
registerPlaceholderZone({
  id:'salthaven', kind:'village', displayName:'🎣 Salthaven',
  region:'coastal',
  musicTrack:'village', size:80, seed:7004,
  // Coastal palette — sky reads as sea-air, fog cooler and slightly thicker.
  skyCol:0xc8d8e0, fogColor:0xa8b8b8, fogDensity:0.013,
  // Settlement biome support (v61em). Drives the ground texture only —
  // sky / fog above stay under cfg.skyCol / cfg.fogColor control.
  biome:'coast',
  // Westward slope — village descends from inland (high, east, grass-and-
  // cottage) toward the harbor (low, west, salt-bleached, dock at the
  // bottom). 4.0u total fall across 80u of zone width.
  terrainSlope:{dir:'W', amount:4.0},
  // Suppress trees on the western half — line of sight from village
  // center to the open western horizon (Windward Sea).
  openSide:'W',
  // Village center pushed slightly east of zone center so the harbor side
  // (west) gets more visual real estate. flatR/hillR scaled for size 80.
  centerX:45, centerZ:40, villageR:32,
  centerMarker:{
    title:'Salthaven — Harbour Notice',
    text:'Salthaven harbour, with twelve registered boats, two unlicensed and one sunk last spring (subject of dispute). Catch sales handled at the Harbormaster\'s Office between dawn and the second bell. Weather warnings posted by Hilda, the day she finds them.\n\nNotices:\n  • The dock\'s seaward end is condemned. A new plank is on order from Hearthwick. It has been on order since last summer.\n  • Aelflin will mend nets for two coppers and a story.\n  • If your boat is in the harbour and you are not, please remove it. (Harbormaster\'s office.)',
  },
  buildings:[
    // sh3 Anchor Inn — NE, faces S. First building on the way in from East
    // gate (Hearthwick / West Track). Mirrored from NW after harbor flip.
    {x:60, z:18, w:6, d:5, face:'S', houseId:'sh3'},
    // sh0 Harbormaster's Office — west-central, faces E toward the village
    // square. Closest to the dock (Hilda watches the boats — and the boats
    // are now west).
    {x:25, z:14, w:5, d:4, face:'E', houseId:'sh0'},
    // sh1 Salt House — center-west, faces E. Wystan in the working belly
    // of the village. Sits between the harbormaster and Aelflin.
    {x:23, z:36, w:5, d:4, face:'E', houseId:'sh1'},
    // sh2 Net-Mender's Cottage — SW, faces E. Smaller building, set back
    // toward the south end of the harbor.
    {x:26, z:56, w:4, d:4, face:'E', houseId:'sh2'},
  ],
  // v61em: shrine (sh4) is built in detailFn instead of buildings — it's
  // open-walled, has no door, and is unique enough not to fit the generic
  // building template. Player examines it via E-press at its location.
  houses:[
    {id:'sh0', doorX:30, doorZ:16, doorFace:'E', name:"The Harbormaster's Office",
      keeper:'Hilda', type:'harbor_office',
      tagline:'"Records of the harbour. And anything else worth knowing."',
      bCol:0x4a5868, sCol:0x9ab0c0},
    {id:'sh1', doorX:28, doorZ:38, doorFace:'E', name:"The Salt House",
      keeper:'Wystan', type:'harbor_supplies',
      tagline:'"Salt, fish, rope. The whole of Salthaven, more or less."',
      bCol:0x6a5848, sCol:0xb0a080},
    {id:'sh2', doorX:30, doorZ:58, doorFace:'E', name:"The Net-Mender's Cottage",
      keeper:'Old Aelflin', type:'potion',
      tagline:'"Nets mended. Salves brewed. Stories — for the right listener."',
      bCol:0x5a4a3a, sCol:0xa89878},
    {id:'sh3', doorX:63, doorZ:18, doorFace:'S', name:"The Anchor Inn",
      keeper:'Brand', type:'inn',
      tagline:'"Bed and stew. Don\'t ask about the hook."',
      bCol:0x4a3828, sCol:0xa07040},
  ],
  npcDefs:[
    // Hilda — outside her office (west-central village)
    {x:32, z:20, name:'Hilda', role:'Harbormaster', ico:'⚓', bCol:0x4a5868, sCol:0x9ab0c0,
      greeting:[
        "Wind's southerly. Means three things, none of them good. What's your business?",
        "In off the West Track, then. We don't get many of you. Mostly traders going the other way.",
        "You'll want to mind the dock — boards are old. Office is on your right, if it's me you've come to see.",
      ],
      topics:[
        {label:'Tell me about Salthaven.', response:"A working harbor. Twelve boats out most days, fewer if the weather's wrong. Catch goes east — Coeur de Vie pays well enough for what they call quality. The rest stays here, gets salted, gets sold. We are not Carraig Mór and we do not pretend to be. They built their houses out of the rock; we built ours out of the wages.",
          follow:[
            {label:"What's the difference?", response:"Carraig Mór is older than the kingdom. Salthaven is older than my grandmother. That's the difference. They have stories we don't have, and they don't tell them to us, and we have stopped asking. We get on. We trade rope. We do not visit each other's dead."}
          ]},
        {label:'Browse your wares.', trade:true},
        {label:'Goodbye.', bye:true},
      ]},
    // Wystan — outside the Salt House (center-west)
    {x:32, z:40, name:'Wystan', role:'Salter', ico:'🧂', bCol:0x6a5848, sCol:0xb0a080,
      greeting:[
        "Salt's salt, mate. What're you after?",
        "Mind the barrels — that one's leaking and I haven't got round to it.",
        "Came in from inland, did you? You'll want oilcloth before you go anywhere on these roads.",
      ],
      topics:[
        {label:'What goes east from here?', response:"Catch, mostly. Salted, smoked, packed. Nobles in Coeur de Vie pay through the nose for what they call 'fresh from the western coast' — by which they mean six days dead and salted to leather, but who am I to argue. Also rope. We send a lot of rope."},
        {label:'Browse your wares.', trade:true},
        {label:'Goodbye.', bye:true},
      ]},
    // Aelflin — outside the Net-Mender's (south-west)
    {x:32, z:60, name:'Old Aelflin', role:'Net-Mender', ico:'🪡', bCol:0x5a4a3a, sCol:0xa89878,
      greeting:[
        "Come in, come in. Mind the cat. He's old and he's mean about it.",
        "You're tall. Stoop a bit at the door — the lintel won't forgive you.",
        "I was just sitting. Don't worry, I'm always just sitting. What can I do?",
      ],
      topics:[
        {label:'You came up the coast?', response:"Long time ago, dear. Had a sister down south then. Haven't spoken in — oh, fifteen winters? Sixteen? Time goes funny when you stop counting. She had her stones, I had my road. We chose."},
        {label:'Browse your wares.', trade:true},
        {label:'Goodbye.', bye:true},
      ]},
    // Brand — outside the Anchor Inn (northeast — first thing players see)
    {x:62, z:25, name:'Brand', role:'Innkeeper', ico:'🍺', bCol:0x4a3828, sCol:0xa07040,
      greeting:[
        "Bed's two coppers. Stew's three. Both for four if you've a sword to leave at the door.",
        "Come in. Fire's lit. The other bed's free if you don't mind the snorer.",
        "You're dripping. Hang the cloak by the fire — it'll be ready before you are.",
      ],
      topics:[
        {label:'Off the boats?', response:"Twelve years on the eastern run, four on the southern, two in places I won't name. Came back here because my mother was dying and I'd been gone too long to argue with her about it. Stayed because someone had to run the inn after my brother stopped being able to. That's the whole story. Don't ask about the hook."},
        {label:'Browse your wares.', trade:true},
        {label:'Goodbye.', bye:true},
      ]},
  ],
  gates:[
    // East = West Track toward Hearthwick (commission-locked at corridor's
    // own gate per v61el). South = Coastal Road South toward Carraig Mór.
    // v61em yaw fixes: spawnYaw values point the player INTO the destination
    // zone on arrival (not back at the wall they came through).
    {x:77, z:40, targetZone:'west_track',         spawnX:7,  spawnZ:40, spawnYaw:Math.PI/2,  label:'The West Track'},
    {x:40, z:77, targetZone:'coastal_road_south', spawnX:40, spawnZ:7,  spawnYaw:Math.PI,    label:'Coastal Road South'},
  ],
  // v61em: per-building exterior dressing — windows, signs, type-keyed props.
  // genericVillageDecorate is the placeholder-village reusable version of
  // Ashenmoor's decorateFn. Keyed on h.type rather than h.houseId.
  decorateFn:genericVillageDecorate,
  // v61em: Salthaven's bespoke village-wide detail — harbor, dock, fish-
  // drying racks, beached rowboat, water mesh, Sea-Folk Shrine. Runs once
  // after all buildings are placed. Receives (sc, sol, getY).
  detailFn:function(sc, sol, getY){
    // ── Water mesh — flat blue-grey plane WEST of the village (Windward
    //    Sea), at the bottom of the westward slope. Covers the western
    //    third of the visible terrain, extending past the zone boundary
    //    for sight-line continuity. Slightly transparent so the slope
    //    geometry shows through near the shore. ──────────────────────
    const waterMat=new THREE.MeshLambertMaterial({color:0x4a6a78, transparent:true, opacity:0.85});
    // Width 36 (zone size 80, plane centered at x:0 — extends from -18 to 18,
    // covering the western shoreward half plus 18u beyond the zone).
    const waterGeom=new THREE.PlaneGeometry(36, 80);
    const water=new THREE.Mesh(waterGeom, waterMat);
    water.rotation.x=-Math.PI/2;
    // Y position: tied to the shoreline ground height. Sinking water 0.4u
    // below gives clear shoreline read while keeping dock connected.
    const _shorewardY = getY(18, 40);  // village ground at the shoreline (west side)
    water.position.set(0, _shorewardY - 0.4, 40);
    sc.add(water);

    // ── Wooden dock projecting WEST from the harbor at z≈28 ────────────
    // Shoreward end at x:20 (still on dry village ground). Seaward end
    // at x:8 (well into the water). Dock walkable; only seaward end
    // blocked so the player can walk to the edge but not into the sea.
    const plankMat=new THREE.MeshLambertMaterial({color:0x5a4028});
    const dockBaseY=getY(18, 28);  // shoreward base height (west side)
    const dock=new THREE.Mesh(new THREE.BoxGeometry(12, 0.18, 1.6), plankMat);
    dock.position.set(14, dockBaseY+0.05, 28);
    sc.add(dock);
    sol.push({cx:8.4, cz:28, rx:0.45, rz:0.85}); // seaward end-stop
    // Three pilings beneath the dock at intervals (mirrored from east-side ship).
    [[17, 28.6],[14, 28.6],[10, 28.6]].forEach(([px,pz])=>{
      const piling=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,1.8,8), plankMat);
      piling.position.set(px, dockBaseY-0.8, pz);
      sc.add(piling);
    });
    // A small mooring post at the seaward end
    const mooring=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.20,0.85,8), plankMat);
    mooring.position.set(8.5, dockBaseY+0.42, 28);
    sc.add(mooring);
    // Coiled rope on the dock
    const ropeC=new THREE.Mesh(new THREE.TorusGeometry(0.28,0.05,4,10), new THREE.MeshLambertMaterial({color:0xb09870}));
    ropeC.rotation.x=Math.PI/2;
    ropeC.position.set(16, dockBaseY+0.18, 28.4);
    sc.add(ropeC);

    // ── Beached rowboat — pulled up beyond high tide on the harbor edge ─
    // v61en: DoubleSide so the partial-sphere hull is visible from inside
    // (the player can walk close enough to see the hollow underside;
    // pre-v61en, that view rendered the hull invisible from the back face).
    // S218 — the harbours' clinker boat (S168), upside down on the sand along x, scaled to the old hull's 3.6 length
    const boatHull=new THREE.Mesh(WORLD.boatBake(0).geo, WORLD.SHIP_MAT);
    boatHull.scale.setScalar(.6);boatHull.rotation.set(0,Math.PI/2,Math.PI);boatHull.castShadow=true;
    boatHull.position.set(22, getY(22,46)+0.36, 46);
    sc.add(boatHull);
    sol.push({cx:22, cz:46, rx:1.8, rz:0.9});

    // ── Fish-drying racks — two near the dock (mirrored to west side) ──
    function _dryingRack(rx,rz){
      const rackMat=new THREE.MeshLambertMaterial({color:0x6a4818});
      const fishMat=new THREE.MeshLambertMaterial({color:0xa89858});
      const baseY=getY(rx,rz);
      // Two posts
      [-0.9, 0.9].forEach(off=>{
        const p=new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.08), rackMat);
        p.position.set(rx+off, baseY+0.75, rz);
        sc.add(p);
      });
      // Horizontal beam
      const beam=new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.07, 0.07), rackMat);
      beam.position.set(rx, baseY+1.4, rz);
      sc.add(beam);
      // Hanging "fish" — small flat boxes along the beam
      for(let f=0;f<5;f++){
        const fx=rx-0.7+f*0.35;
        const str=new THREE.Mesh(new THREE.CylinderGeometry(0.005,0.005,0.18,4), new THREE.MeshLambertMaterial({color:0xb09870}));
        str.position.set(fx, baseY+1.30, rz);
        sc.add(str);
        const fish=new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.22, 0.04), fishMat);
        fish.position.set(fx, baseY+1.10, rz);
        sc.add(fish);
      }
      sol.push({cx:rx, cz:rz, rx:1.1, rz:0.15});
    }
    _dryingRack(20, 22);
    _dryingRack(20, 50);

    // ── Sea-Folk Shrine (sh4) — open-walled platform with offering bowl ─
    // Repositioned for west harbor: SW corner of the village, near where
    // the dock projects out into the Windward Sea. Lore-canonical "set
    // back from the dock."
    const shrineX=24, shrineZ=62;
    const shrineY=getY(shrineX,shrineZ);
    const shrineWoodMat=new THREE.MeshLambertMaterial({color:0x6a5848}); // weather-grey
    const shrinePlankMat=new THREE.MeshLambertMaterial({color:0x584030});
    // Platform — slightly raised, worn-smooth
    const platform=new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 2.4), shrinePlankMat);
    platform.position.set(shrineX, shrineY+0.09, shrineZ);
    sc.add(platform);
    // Four corner posts
    [[-1.0,-1.0],[1.0,-1.0],[-1.0,1.0],[1.0,1.0]].forEach(([dx,dz])=>{
      const post=new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.8, 0.10), shrineWoodMat);
      post.position.set(shrineX+dx, shrineY+1.08, shrineZ+dz);
      sc.add(post);
    });
    // Peaked roof — small pyramid
    const roof=new THREE.Mesh(new THREE.ConeGeometry(1.65, 0.7, 4), shrineWoodMat);
    roof.position.set(shrineX, shrineY+2.30, shrineZ);
    roof.rotation.y=Math.PI/4;
    sc.add(roof);
    // Offering bowl — small wooden bowl at platform center
    const bowlMat=new THREE.MeshLambertMaterial({color:0x4a3018});
    const bowl=new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.22, 0.12, 12), bowlMat);
    bowl.position.set(shrineX, shrineY+0.24, shrineZ);
    sc.add(bowl);
    // Coins in the bowl — flat discs
    [[0,0,0xc09040],[0.06,0.04,0xc09040],[-0.05,0.07,0xb0a060],[0.03,-0.06,0x808080]].forEach(([dx,dz,col])=>{
      const coin=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.01,8), new THREE.MeshLambertMaterial({color:col}));
      coin.position.set(shrineX+dx, shrineY+0.30, shrineZ+dz);
      sc.add(coin);
    });
    // Small carved fish offering — a thin elongated box
    const fishOff=new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.04, 0.06), new THREE.MeshLambertMaterial({color:0x9a7848}));
    fishOff.position.set(shrineX-0.20, shrineY+0.22, shrineZ+0.10);
    fishOff.rotation.y=0.3;
    sc.add(fishOff);
    // Red ribbon offering — tiny bright accent
    const ribbon=new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.005, 0.04), new THREE.MeshLambertMaterial({color:0xa83030}));
    ribbon.position.set(shrineX+0.18, shrineY+0.205, shrineZ-0.08);
    ribbon.rotation.y=-0.4;
    sc.add(ribbon);
    // Block walking through the shrine platform
    sol.push({cx:shrineX, cz:shrineZ, rx:1.25, rz:1.25});
  },
});
registerPlaceholderZone({
  id:'coastal_road_south', kind:'wilderness', displayName:'🌊 Coastal Road South',
  region:'coastal',
  musicTrack:'coast', size:100, seed:7005, biome:'coast',
  skyCol:0xa8c0d8, fogColor:0x98a8a8, fogDensity:0.011,
  centerMarker:{title:'Coastal Road South', text:'Clifftop path between Carraig Mór and Salthaven. Exposed to the Windward sea in all weather.'},
  gates:[
    // v61em: spawn updated for size-80 Salthaven. South gate is now at
    // (40, 77); land at (40, 73) facing north (yaw=0) into the village.
    {x:40, z:3,  targetZone:'salthaven',   spawnX:40, spawnZ:73, spawnYaw:0,       label:'Salthaven'},
    {x:40, z:97, targetZone:'carraig_mor', spawnX:30, spawnZ:7,  spawnYaw:Math.PI, label:'Carraig Mór'},
  ],
});
registerPlaceholderZone({
  id:'carraig_mor', kind:'village', displayName:'🗿 Carraig Mór',
  region:'coastal',
  musicTrack:'village', size:60, seed:7006,
  // v61ev: palette warmed from v61eu's 0x7a90a8/0x788494 which in
  // playtest read as Arctic when stacked with stone bodies + stone
  // ground. Now lands as overcast-Atlantic morning — still cooler and
  // lonelier than Salthaven but no longer northern-tundra. The warmer
  // sky also lets the new lichen-toned stone ground read at full warmth.
  skyCol:0x96a4b0, fogColor:0x8a8a90, fogDensity:0.014,
  // v61em coastal identity: drives the sky-ring (sea horizon, no peaks)
  // and the BIOME_PROFILES.coast palette path. groundTexture below wins
  // over biome for the actual ground surface — biome here gives sky/horizon.
  biome:'coast',
  // ── New v61et knobs ────────────────────────────────────────────────────
  // The rock — flat top, dramatic falls. Pairs with the southward slope so
  // the village center sits high on the rock with the tide causeway at the
  // bottom of the visible drop.
  terrainProfile:'rocky',
  // Slope southward toward the tide causeway (the south gate is the Inis
  // Rua connection per v61d7). Amount 3.0u total fall across 60u — gentle
  // enough to walk but visible enough to read as "the rock descends here."
  terrainSlope:{dir:'S', amount:3.0},
  // Suppress border walls on the southern edge so the player has clear
  // sight to the causeway / Inis Rua on the far side. The bone lintel
  // monument (built in detailFn) is the only south-edge feature.
  openSide:'S',
  // Stone bodies + slate roofs — locked in lore canon (§ Carraig Mór).
  buildingMaterial:'stone',
  roofStyle:'slate_pitched',
  // Cool grey speckled stone ground — pairs naturally with the stone
  // bodies. The biome:'coast' fallback would give salt-bleached duskier
  // tones; we override with explicit stone for the rock-as-ground read.
  groundTexture:'stone',
  // Dry-stone wall border — matches the building register and the
  // canonical "we build with our dead" beat (the walls share a material
  // language with the houses, and arguably with the lower courses where
  // the bones are). openSide:'S' clears the southern walls.
  borderType:'stone_walls',
  // Cobble paths — established stone-village register.
  pathStyle:'cobble',
  // Stone well at the plaza center — both functional (the rock has been
  // hollowed for water) and atmospheric. plazaProp 'well' is built by the
  // village builder at (cfg.plazaX, cfg.plazaZ); both default to centerX/Z.
  plazaProp:'well',
  // ── v61ex knobs ────────────────────────────────────────────────────────
  // Carraig Mór is exposed coastal rock — no interior trees grow here.
  // The pine cones the default places everywhere read as "deep forest"
  // and clash with the rocky-outcrop register.
  interiorTreeStyle:'none',
  // Tussock-grass and dried-kelp scatter — salt-tolerant pale yellow-
  // green grass clumps + brown kelp ribbons + small barnacle-encrusted
  // stones. Half the density of the forest-village default.
  groundScatter:'tussock_and_kelp',
  // ── Layout ─────────────────────────────────────────────────────────────
  centerX:30, centerZ:30, villageR:18,
  centerMarker:{title:'Carraig Mór', text:'Irish: Great Rock. One of the oldest inhabited places on the map, predating all Anglo-Saxon settlements. Built into dramatic coastal rock formations. The people here answer to no lord.'},
  // Three buildings. cm0 is Áine's home (she lives here, but is met outside
  // near the south edge — see npcDefs). cm1 and cm2 are the two trade
  // points: stone-cutter and folk healer. The Rock-Hall (cm3) and Bone
  // Lintel (cm4) are NOT buildings — they're examinable detailFn structures.
  buildings:[
    // cm1 Stone-Cutter's Workshop — NW, faces south. First building on
    // the way in from the north gate (Coastal Road South arrives at z:3).
    {x:14, z:15, w:6, d:4, face:'S', houseId:'cm1'},
    // cm0 Áine's Hearth — NE, faces west toward the plaza. Smaller than
    // the workshop; she lives here but her dialog happens outside.
    {x:38, z:22, w:5, d:6, face:'W', houseId:'cm0'},
    // cm2 Tide-Singer's Cottage — SW, faces east toward the plaza.
    {x:14, z:36, w:5, d:4, face:'E', houseId:'cm2'},
  ],
  houses:[
    {id:'cm0', doorX:38, doorZ:25, doorFace:'W', name:"Áine's Hearth",
      keeper:'Áine',
      // No type — Áine's hearth is a private residence, not a shop. The
      // sign post still renders (so the building reads as "named"), but
      // the board is left blank by genericVillageDecorate's "no icon for
      // unknown shop types" branch. Áine is met outside in the npcDef
      // below, not as a shop interior. If the player tries to enter the
      // door, behavior is interior-shop-resolution-fallback (TBD if any
      // future polish wants to add a "this is a private home" beat).
      tagline:'"Stone walls. Stone floor. The sea below us."',
      bCol:0x6e7078, sCol:0x9aa0a8},
    {id:'cm1', doorX:17, doorZ:15, doorFace:'S', name:"The Stone-Cutter's Workshop",
      keeper:'Cuán', type:'armor',
      tagline:'"What the rock gives, we shape. What it keeps, we leave."',
      bCol:0x6a6c70, sCol:0x88847c},
    {id:'cm2', doorX:19, doorZ:38, doorFace:'E', name:"The Tide-Singer's Cottage",
      keeper:'Maire', type:'potion',
      tagline:'"Salt. Bone. Patience. The three healers."',
      bCol:0x5e6470, sCol:0x9090a0},
  ],
  npcDefs:[
    // ── Áine ──────────────────────────────────────────────────────────────
    // The seam character. Lore canon § Carraig Mór locks five beats into
    // her dialog — they're all on topic responses (she does not volunteer
    // them). Voice: Zira, slow, low, warm-without-wasting-warmth. She uses
    // Anglo-Saxon when speaking TO outsiders, never OF her own things —
    // hence the deep-Irish names appear only when describing what's hers
    // (Béal an Domhain).
    //
    // Position: south end of the village near the Bone Lintel, looking out
    // toward the tide causeway. (28,48) — south of the plaza, west of the
    // central path leading to the south gate at (30,57). Player arriving
    // from the north walks past the workshop, the well, the healer's
    // cottage, the lintel, and finds her last.
    {x:28, z:48, name:'Áine', role:'Elder', ico:'🪨', bCol:0x4a4a52, sCol:0xb0a8a0,
      greeting:[
        "Off the road from the south. You've come some distance to see a rock.",
        "Sit if you want. The stone is warm where the sun has been on it.",
        "We see one or two of you in a season. Not unwelcome. Not expected.",
      ],
      topics:[
        // Beat 1 (rent line) + Beat 3 (Caldric letters) as follow-up.
        // The Caldric beat establishes Carraig Mór's independence with
        // the regional power without drama — the rock simply does not
        // engage, and Caldric has accepted that. Useful contrast against
        // every other settlement where the king's reach is felt directly.
        {label:'Tell me about Carraig Mór.',
          response:"We are tenants. We pay rent to the wind by staying outside in it, and we pay rent to the sea by losing one of ours every winter, on average. The arithmetic is steady enough. The rock does not move; we do not move; the sea takes what the sea takes. That is the whole of it.",
          follow:[
            {label:'Does the Crown not reach you here?',
              response:"Lord Caldric writes us letters once in a while. We read them. They are good letters. He has a clear hand. We do not reply. He has stopped expecting us to."},
          ]},
        // Beat 2 — the bones-in-the-walls beat. Lore-canonical literal,
        // not metaphor. The lower courses of the rock contain bones.
        // She delivers it flat — this is not a horror reveal, it's the
        // domestic fact of the place.
        {label:'This place is old.',
          response:"Old, yes. Older than the kingdom. Older than the words for kingdom. The rest of you build cemeteries; we build with our dead. The lower courses, the foundations — that is them. They are still part of the rock. We are tenants of them too, in a way. They do not seem to mind."},
        // Beat 4 — Béal an Domhain. The deep-Irish name for the sea-cave
        // dungeon below the rock. She uses the Irish naturally (it's hers)
        // but doesn't translate. Outsiders hearing the name for the first
        // time will register that it sounds different from anything else
        // in the world they've moved through. The Mouth as a dungeon
        // doesn't exist yet — when it does, this beat is its lore anchor.
        {label:'What is below?',
          response:"Béal an Domhain. The world's mouth. My grandmother taught me not to whistle near it. I do not know what it is. I know it is there, the way you know there is weight behind your house when you lean on the wall. It does not need me to know more than that."},
        // Beat 5 — her brother. The most narratively-loaded beat; she
        // does not volunteer it. The player has to ask whether anyone
        // has gone in. The line establishes the canon mechanic that
        // people who go deep into a still-functional anchor and come
        // back are changed (distinct from the antibody mechanic — this
        // is what happens to a SURVIVOR). Held lightly; can seed an Act
        // II/III beat if it earns it.
        {label:'Anyone come back?',
          response:"Two came back, once. They did not say much. One of them was my brother. He spoke a different way after. He died young. Not from anything you could name."},
        {label:'Goodbye.', bye:true},
      ]},
    // ── Cuán ──────────────────────────────────────────────────────────────
    // Stone-cutter. Anglo-Saxon vernacular but Irish-coded by name. He's
    // a working tradesman — the village's armor stock comes through him
    // because nobody else has a forge. Sparse personality, narrative-light;
    // the weight is on Áine. One topic gives the village's working register.
    {x:18, z:22, name:'Cuán', role:'Stone-Cutter', ico:'🔨', bCol:0x6a6c70, sCol:0x88847c,
      greeting:[
        "Mind the chips. They go places you don't expect.",
        "Came down from the north road. Long walk for what's here.",
        "Tools are in the workshop. Talk fast or come back when I've stopped.",
      ],
      topics:[
        {label:'Browse your wares.', trade:true},
        {label:"You're the smith here?",
          response:"Stone-cutter, mostly. We do not have a smith. What armor is in the village comes through me — bits brought up from down south, mended, fitted to whoever needs them next. The rock is not iron, but a piece of it set into a shoulder-plate will turn a blade well enough. Áine's grandfather started the practice. We have not stopped."},
        {label:'Goodbye.', bye:true},
      ]},
    // ── Maire ────────────────────────────────────────────────────────────
    // Folk healer in the Aelflin/Edna register, but Irish-coded. Tinctures
    // and field herbs only — no academy-coded elixirs. Soft-voiced, and
    // touches the seam character of the village without competing with
    // Áine's weight: she's the one who actually treats the wounds when
    // the sea takes its winter due.
    {x:22, z:38, name:'Maire', role:'Tide-Singer', ico:'🌿', bCol:0x5e6470, sCol:0x9090a0,
      greeting:[
        "Set the door behind you, dear. The wind takes the warmth out fast.",
        "You are not from the rock. I can tell by how you stand.",
        "Sit, sit. Whatever you came for, it will keep a moment.",
      ],
      topics:[
        {label:'Browse your wares.', trade:true},
        {label:'Tide-Singer?',
          response:"That is what they call us. We sing the tide out and the tide in — meaning we keep the count. Six minutes out, six minutes in, all the day and all the night. The young ones learn it before they learn their letters. It is older than reading."},
        {label:'Goodbye.', bye:true},
      ]},
  ],
  gates:[
    // v61d7: south gate to Inis Rua — historically a tidal causeway,
    // reframed to ferry in v61ew. The 'tide' guard is unchanged: the
    // ferry crosses only when the tide is out (the strait is too rough
    // at high tide). noFence:true suppresses the default fence-gate
    // mesh so the moored ferry boat built in detailFn is the only
    // visible affordance at the south end of the dock.
    {x:30, z:3,  targetZone:'coastal_road_south', spawnX:40, spawnZ:94, spawnYaw:0,       label:'Coastal Road South'},
    {x:30, z:57, targetZone:'inis_rua',           spawnX:25, spawnZ:5,  spawnYaw:Math.PI, label:'Inis Rua', guard:'tide', noFence:true},
  ],
  // Per-building exterior dressing — windows, signs, type-keyed props.
  decorateFn:genericVillageDecorate,
  // ── Carraig Mór's bespoke detail — Rock-Hall + Bone Lintel ─────────────
  // Two examinable structures that don't fit the building template:
  //   • The Rock-Hall (cm3) — communal hall at the village's NE quadrant,
  //     a low-walled stone enclosure with a slate-roofed pavilion. Larger
  //     than the cottages. Examinable: a stone tablet inside carries the
  //     village's foundation register (lore-canonical institutional voice).
  //   • The Bone Lintel (cm4) — open-walled threshold at the south-edge
  //     of the village near where the path descends to the tide causeway.
  //     Two upright stones with a horizontal stone lintel between them;
  //     the lintel is canonically inset with bone fragments.
  //
  // Both are sol-blocked (player can walk around but not through). Visible
  // through the openSide:'S' clearing — the bone lintel is the first thing
  // a southbound player sees against the open horizon.
  detailFn:function(sc, sol, getY){
    // ── The Rock-Hall (cm3) — NE plaza-edge, communal pavilion ───────────
    // Position: just NE of plaza center, between Áine's Hearth and the
    // main path. A square low-walled enclosure with a slate-roofed canopy
    // resting on four corner posts. Reads as "the place the village holds
    // council in" — open enough to walk into but unmistakably ceremonial.
    const hallX=42, hallZ=32;
    const hallY=getY(hallX,hallZ);
    const stoneMat=new THREE.MeshLambertMaterial({color:0x76787a});
    const stoneDarkMat=new THREE.MeshLambertMaterial({color:0x5a5c5e});
    const slateMat=new THREE.MeshLambertMaterial({color:0x4a4a52});
    // Low perimeter walls — three sides only (open on the W side facing
    // the plaza). Each wall is two stone segments at chest height with
    // a small gap, reading as a council ground rather than a closed room.
    const wallH=0.95;
    // North wall (two segments)
    [[-1.4, 0],[ 1.4, 0]].forEach(([dx,dz])=>{
      const wall=new THREE.Mesh(new THREE.BoxGeometry(1.5,wallH,0.32),stoneMat);
      wall.position.set(hallX+dx, hallY+wallH/2, hallZ-2.0+dz);
      sc.add(wall);
      sol.push({cx:hallX+dx, cz:hallZ-2.0+dz, rx:0.75, rz:0.16});
    });
    // South wall (two segments)
    [[-1.4, 0],[ 1.4, 0]].forEach(([dx,dz])=>{
      const wall=new THREE.Mesh(new THREE.BoxGeometry(1.5,wallH,0.32),stoneMat);
      wall.position.set(hallX+dx, hallY+wallH/2, hallZ+2.0+dz);
      sc.add(wall);
      sol.push({cx:hallX+dx, cz:hallZ+2.0+dz, rx:0.75, rz:0.16});
    });
    // East wall (full)
    const eWall=new THREE.Mesh(new THREE.BoxGeometry(0.32,wallH,4.0),stoneMat);
    eWall.position.set(hallX+2.0, hallY+wallH/2, hallZ);
    sc.add(eWall);
    sol.push({cx:hallX+2.0, cz:hallZ, rx:0.16, rz:2.0});
    // Four corner posts — taller than walls, support the roof
    const postH=2.6;
    [[-2.0,-2.0],[2.0,-2.0],[-2.0,2.0],[2.0,2.0]].forEach(([dx,dz])=>{
      const post=new THREE.Mesh(new THREE.BoxGeometry(0.30,postH,0.30),stoneDarkMat);
      post.position.set(hallX+dx, hallY+postH/2, hallZ+dz);
      sc.add(post);
      sol.push({cx:hallX+dx, cz:hallZ+dz, rx:0.18, rz:0.18});
    });
    // Slate roof — pyramidal, sits on the four posts
    const roof=new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.2, 4), slateMat);
    roof.position.set(hallX, hallY+postH+0.55, hallZ);
    roof.rotation.y=Math.PI/4; // align edges to walls
    sc.add(roof);
    // Stone tablet at the eastern wall — examinable foundation register.
    // The carving is a flat dark stone set into the wall face, slightly
    // raised. Lore beat: the village's institutional voice — though
    // Carraig Mór has no lord, it has a founding statement carved in
    // stone. Mostly Irish, partially weathered. The player can read the
    // English translation (provided in the centerMarker text and tablet
    // examination is left for a future write — the tablet exists as a
    // physical anchor for that future beat).
    const tabletMat=new THREE.MeshLambertMaterial({color:0x3a3c40});
    const tablet=new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.9), tabletMat);
    tablet.position.set(hallX+1.85, hallY+1.0, hallZ);
    sc.add(tablet);
    // A small fire-pit at the hall's center — cold, but present.
    const pitStoneMat=new THREE.MeshLambertMaterial({color:0x2a2826});
    const pit=new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.18, 12), pitStoneMat);
    pit.position.set(hallX, hallY+0.09, hallZ);
    sc.add(pit);
    // Charred wood inside the pit
    const charMat=new THREE.MeshLambertMaterial({color:0x1a1410});
    [[0,0],[0.18,0.05],[-0.12,0.13]].forEach(([dx,dz])=>{
      const log=new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.10, 0.10), charMat);
      log.position.set(hallX+dx, hallY+0.20, hallZ+dz);
      log.rotation.y=Math.random()*Math.PI;
      sc.add(log);
    });

    // ── The Bone Lintel (cm4) — south-edge threshold, near the causeway ──
    // Two upright stones flanking the path with a horizontal stone lintel
    // between them at head-height. Per lore canon: the lintel is inset
    // with bone fragments. The player walks UNDER it on the way to the
    // tide causeway — the structure frames the south gate visually.
    //
    // Position: (30, 53), straddling the path between the village and
    // the south gate (z:57). 4u opening so the player can pass through.
    const lintelX=30, lintelZ=53;
    const lintelY=getY(lintelX,lintelZ);
    const liStoneMat=new THREE.MeshLambertMaterial({color:0x6a6c70});
    const liDarkMat=new THREE.MeshLambertMaterial({color:0x4a4c50});
    // Two upright stones — squat and slightly tapered. 2.4u tall, 0.9u
    // wide, set 4.0u apart so the path passes between them.
    [-2.0, 2.0].forEach(dx=>{
      const upright=new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.4, 0.7), liStoneMat);
      upright.position.set(lintelX+dx, lintelY+1.2, lintelZ);
      // Slight irregular lean — these are old, not new
      upright.rotation.z=(dx<0?1:-1) * 0.04;
      sc.add(upright);
      sol.push({cx:lintelX+dx, cz:lintelZ, rx:0.45, rz:0.35});
    });
    // Horizontal lintel — a heavy stone bar resting on the two uprights.
    // 5.0u long (overlaps both uprights), 0.5u tall, 0.7u deep.
    const lintel=new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.5, 0.7), liStoneMat);
    lintel.position.set(lintelX, lintelY+2.55, lintelZ);
    sc.add(lintel);
    // Bone fragments inset along the underside of the lintel — five small
    // off-white wedges spaced along the length. Lore-canonical "we build
    // with our dead." The fragments are visible to anyone walking under
    // the lintel toward the causeway.
    const boneMat=new THREE.MeshLambertMaterial({color:0xc8c0a8});
    [-1.8,-0.9,0,0.9,1.8].forEach(bx=>{
      const bone=new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.10, 0.30), boneMat);
      bone.position.set(lintelX+bx, lintelY+2.30, lintelZ);
      bone.rotation.z=(Math.random()-0.5)*0.3;
      sc.add(bone);
    });
    // Two small flat offering stones at the base of each upright — the
    // village's understated equivalent of a roadside shrine. No coins,
    // no ribbons (the Sea-Folk Shrine in Salthaven owns that register);
    // just stones placed by hands, deliberately.
    [-2.0, 2.0].forEach(dx=>{
      const offering=new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.45), liDarkMat);
      offering.position.set(lintelX+dx, lintelY+0.06, lintelZ+0.7);
      offering.rotation.y=Math.random()*0.5;
      sc.add(offering);
    });

    // ── A few scattered loose stones across the rock ────────────────────
    // Reads as "this is a rock the village is on, not just stone-themed
    // ground." Avoid the plaza, paths, and the gate corridors. Small
    // weathered boulders at irregular positions.
    const looseMat=new THREE.MeshLambertMaterial({color:0x6e7074});
    [[8,8],[52,12],[8,28],[52,32],[12,52],[50,48],[6,42],[54,18]].forEach(([sx,sz])=>{
      const sty=getY(sx,sz);
      const r=0.7+Math.random()*0.6;
      const stone=new THREE.Mesh(new THREE.SphereGeometry(r, 6, 4), looseMat);
      stone.scale.set(1, 0.55+Math.random()*0.2, 1);
      stone.position.set(sx, sty+r*0.45, sz);
      stone.rotation.y=Math.random()*Math.PI*2;
      sc.add(stone);
      sol.push({cx:sx, cz:sz, rx:r*0.7, rz:r*0.7});
    });

    // ── Ocean + dock + ferry boat (v61ew) ────────────────────────────────
    // The strait between Carraig Mór and Inis Rua. Visually a coastal
    // ocean strip filling the southward view; the gate at (30,57) is
    // mid-dock so the player walking south reads "rock → lintel → dock
    // → boat" and the E-prompt fires while they're walking the dock.
    //
    // Lore framing (v61ew reframe): the connection is now a tide-
    // governed FERRY rather than a tidal causeway. The strait runs too
    // rough for the ferry at high tide; the boat crosses only when the
    // tide is out. The 'tide' guard predicate is unchanged — the rhythm
    // ("twice a day," "we sing the tide out and the tide in") stays
    // canon, the visible affordance is now a moored boat instead of a
    // submerged stone path.
    //
    // Positions (zone is 60×60, gate at (30,57), bone lintel at (30,53)):
    //   Dock spine: x:30, z:55 → z:66  (extends past zone edge)
    //   Ferry boat: x:30, z:66 (moored at the seaward end)
    //   Water mesh: centered at (30, 70), 80u wide × 30u deep
    //
    // The water Y is anchored to the terrain Y at the southernmost in-
    // zone point (z:58, just past the gate). Pulled 0.4u below ground
    // for clear shoreline read, matching Salthaven's water Y convention.

    // Water — wide blue-grey transparent plane filling the southward
    // view. Extends well past the zone boundary so the player can't
    // see the plane's edge from anywhere inside Carraig Mór.
    const waterMat=new THREE.MeshLambertMaterial({color:0x4a6a78, transparent:true, opacity:0.85});
    const waterGeom=new THREE.PlaneGeometry(80, 30);
    const water=new THREE.Mesh(waterGeom, waterMat);
    water.rotation.x=-Math.PI/2;
    const _seawardY = getY(30, 58);  // ground height at south edge of zone
    water.position.set(30, _seawardY - 0.4, 70);
    sc.add(water);

    // Dock — wooden plank pier extending south from the village past
    // the bone lintel and out over the water. Walkable; the gate
    // trigger at (30,57) is mid-dock, so the E-prompt fires as the
    // player walks down it.
    const dockPlankMat=new THREE.MeshLambertMaterial({color:0x5a4028});
    const dockBaseY=getY(30, 56);  // shoreward end height
    // Spine: 1.6u wide × 11u long, runs from z:55 to z:66.
    const dock=new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 11), dockPlankMat);
    dock.position.set(30, dockBaseY+0.05, 60.5);
    sc.add(dock);
    // Pilings beneath the dock at intervals — 5 pairs along the length.
    [56, 59, 62, 65].forEach(pz=>{
      [-0.7, 0.7].forEach(px=>{
        const piling=new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.20, 1.8, 8), dockPlankMat);
        piling.position.set(30+px, dockBaseY-0.8, pz);
        sc.add(piling);
      });
    });
    // Two small mooring posts at the seaward end, flanking the boat.
    [-0.55, 0.55].forEach(px=>{
      const mooring=new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.85, 8), dockPlankMat);
      mooring.position.set(30+px, dockBaseY+0.42, 65.6);
      sc.add(mooring);
    });
    // Coiled rope on the dock — a single loose coil halfway along.
    const ropeC=new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.045, 4, 10), new THREE.MeshLambertMaterial({color:0xb09870}));
    ropeC.rotation.x=Math.PI/2;
    ropeC.position.set(30+0.5, dockBaseY+0.18, 60);
    sc.add(ropeC);

    // Ferry boat — moored at the seaward end of the dock. Visible
    // affordance: the player walks toward this, presses E, gets
    // ferried to Inis Rua. Bigger than Salthaven's beached rowboat
    // (this one runs); rightside-up; nominally floating (Y at water
    // level + a small bob offset). No oars rendered — the framing is
    // "moored, waiting for the right tide."
    const boatY = _seawardY - 0.15;  // floating at water surface
    // Hull — half-sphere scaled into a boat shape, slightly larger
    // than Salthaven's.
    // S218 — the ferry is the harbours' clinker boat (S168's bake, one of its four paints), lying along x where the old
    // half-sphere hull lay, scaled to its 4.8 length (the boat is 6)
    const boatHull=new THREE.Mesh(WORLD.boatBake(2).geo, WORLD.SHIP_MAT);
    boatHull.scale.setScalar(.8);boatHull.rotation.y=Math.PI/2;boatHull.castShadow=true;
    boatHull.position.set(30, boatY+0.12, 67.1); // past the mooring posts at the dock's end
    sc.add(boatHull);
    // A small rope tying the boat to the nearer mooring post.
    const tieMat=new THREE.MeshLambertMaterial({color:0xb09870});
    const tie=new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 5), tieMat);
    tie.rotation.z=Math.PI/2.4;
    tie.position.set(30+0.4, boatY+0.5, 65.8);
    sc.add(tie);
    // Block walking through the boat itself (the dock collision is
    // implicit via terrain; the boat sits over water and needs its own
    // sol entry so the player can't walk past the dock end into it).
    sol.push({cx:30, cz:66, rx:2.4, rz:1.0});
  },
});

// ─── v61e1: Outposts on the main road ───────────────────────────────
// The Thorngate (south outpost between Hearthwick and the Deepwood) and
// La Porte Grise (east outpost between the Deepwood and Ironhaven) were
// promoted from map-only POI labels to walkable village-kind zones in
// v61e1. Each has a single keeper-house with one shop NPC and a notice
// board carrying outpost-flavored text. Walls + gates inherit from
// buildVillage; shop interiors resolve through SHOP_DIALOG['<keeper>']
// + the SHOP_STOCK['<type>'] dispatch table (see SHOP_STOCK additions).
//
// Layout convention: 40×40 zone, single 6×5 keeper-house centered north
// of the spawn point with the door facing south. Notice board sits SW
// of the building. Two gates on the N/S edges connect the road chain.

registerPlaceholderZone({
  id:'thorngate', kind:'village', displayName:'🛡️ The Thorngate',
  musicTrack:'village', size:40, seed:7020,
  skyCol:0x8a9aa8, fogColor:0x6a7a58, fogDensity:0.013,
  centerX:20, centerZ:20, villageR:14,
  centerMarker:{title:'The Thorngate', text:'A small walled outpost where the road from Hearthwick enters the Deepwood. Garrisoned thinly. The thornbush growing over the gate has not been trimmed in decades. Warden Edwin keeps the roster, the rations, and a polite distance from anyone who did not come up the south road.'},
  buildings:[
    {x:14, z:9, w:6, d:5, face:'S', houseId:'tg0'},
  ],
  // v61e1: outpost keeper-house. doorX/Z computed from face='S' on the 6×5
  // building at (14,9) → door world coord is at the center of the south wall:
  // x = 14 + 6/2 = 17, z = 9 (south face = lower z edge). Matches HEARTHWICK_HOUSES
  // pattern (door at the building's outward face). bCol/sCol picked to read as
  // weathered military-issue (slate stone, warm wood trim).
  houses:[
    {id:'tg0', doorX:17, doorZ:9, doorFace:'S', name:"Edwin's Watch",
      keeper:'Warden Edwin', type:'outpost_warden',
      tagline:'"Logbook on the table. Don\'t move it."',
      bCol:0x4a4a3a, sCol:0x9a8a78},
  ],
  npcDefs:[
    {x:18, z:18, name:'Warden Edwin', role:'Road-Warden', ico:'🪓', bCol:0x4a4a3a, sCol:0x9a8a78,
      greeting:[
        "You came up the south road. Anyone behind you, or just you?",
        "The thornbush is winning. Watch your sleeves on the way through.",
        "Posted here eleven years. They forget to rotate me out. I've stopped reminding them.",
      ],
      topics:[
        {label:'Browse your wares.', trade:true},
        {label:'What is this place?', response:"A watchpost. Six of us when I came up. Three now. We log what comes south out of the forest and what goes north into it. Mostly we count our own boots.",
          follow:[{label:'Anything come south lately?', response:"More than used to. Wolves further from their territory. A pair of trolls a fortnight ago — turned at the gate, didn't press it. That's the part I don't like. Trolls don't usually decide."}]},
        {label:'Goodbye.', bye:true},
      ]},
  ],
  gates:[
    // Z=3 → north into the Deepwood. Z=37 → south through North Approach back to Hearthwick.
    // v61eb: BUG-1 FIX. South gate now opens to bealach_north_approach (the
    // wilderness corridor between Hearthwick and the Thorngate per lore
    // canon and the world-map SVG). Was previously a direct teleport
    // to Hearthwick, skipping the ambush-country zone that the area's
    // descriptive prose explicitly establishes as part of the route.
    {x:20, z:3,  targetZone:'forest',                  spawnX:150, spawnZ:290, spawnYaw:0,       label:'The Deepwood'},
    {x:20, z:37, targetZone:'bealach_north_approach',  spawnX:100, spawnZ:8,   spawnYaw:Math.PI, label:'An Bealach Mór — North Approach'},
  ],
});

registerPlaceholderZone({
  id:'la_porte_grise', kind:'village', displayName:'🛡️ La Porte Grise',
  musicTrack:'village', size:40, seed:7021,
  skyCol:0x9aa8b8, fogColor:0x88908c, fogDensity:0.011,
  centerX:20, centerZ:20, villageR:14,
  centerMarker:{title:'La Porte Grise', text:'A walled checkpoint where the forest road enters Ironhaven\'s territory. Properly staffed — a royal quartermaster\'s post, the kind of place where "papers, please" is muttered. Quartermaster Roland keeps the records that do not go to the capital.'},
  buildings:[
    {x:14, z:9, w:6, d:5, face:'S', houseId:'lpg0'},
  ],
  // v61e1: outpost keeper-house — La Porte Grise has properly cut stone
  // (cooler bCol) and royal-issue trim (lighter sCol) signaling its
  // institutional register vs Thorngate's weathered improvisation.
  houses:[
    {id:'lpg0', doorX:17, doorZ:9, doorFace:'S', name:"The Quartermaster's Office",
      keeper:'Quartermaster Roland', type:'outpost_quartermaster',
      tagline:'"Papers on the bench. Goods on the shelf. Order in everything."',
      bCol:0x3a4a5a, sCol:0xa8a898},
  ],
  npcDefs:[
    {x:18, z:18, name:'Quartermaster Roland', role:'Royal Quartermaster', ico:'📜', bCol:0x3a4a5a, sCol:0xa8a898,
      greeting:[
        "Papers? No, no — I see you're not carrying anything sealed. State your business briefly, then.",
        "Welcome to La Porte Grise. The road behind you ends here; the one ahead is Ironhaven's. Mind the difference.",
        "Through the forest, I take it. Sit if you need to. The bench is the only courtesy I extend without paperwork.",
      ],
      topics:[
        {label:'Browse your wares.', trade:true},
        {label:'What is this place?', response:"A border post. Quartermaster's office, a half-section of guard, a cellar that's a cellar in name only. The road is officially the king's; in practice it's Lord Caldric's, and he's reasonable.",
          follow:[{label:'Records of what?', response:"Who comes through. What they carried. Whether they came back. Patterns, mostly. The patterns have not been encouraging this season."}]},
        {label:'Goodbye.', bye:true},
      ]},
  ],
  gates:[
    // v61eh: gate set restructured for the spec-matching grid. La Porte
    // Grise is at (4,1); its only adjacent map nodes are Vieux Marché
    // (E, 5,1) and Thorngate (S, 4,3 via the Deepwood). The northern
    // connection to Ironhaven is gone — Ironhaven is now far to the east
    // (6,1) and reached via Vieux Marché on La Route Royale, not directly.
    // S = back into the Deepwood corridor toward Thorngate (kept).
    // E = direct gate to Vieux Marché (no corridor — short hop on the spec).
    {x:20, z:37, targetZone:'forest',       spawnX:150, spawnZ:10,  spawnYaw:Math.PI,    label:'The Deepwood'},
    {x:37, z:20, targetZone:'vieux_marche', spawnX:7,   spawnZ:35,  spawnYaw:Math.PI/2,  label:'Vieux Marché'},
  ],
});

// ─── Bealach side-branch (Hearthwick east → Droichead → Cill Beag / Thorngate) ───
registerPlaceholderZone({
  id:'bealach_central', kind:'wilderness', displayName:'🌾 An Bealach Mór — Central',
  region:'bealach',
  // v61f9: size 120 → 200 to give the prototype fort room to sit
  // naturally. Road realigned to span the new zone (z=100 spine instead
  // of z=40). Fort coordinates in WORLD_DUNGEONS updated accordingly.
  musicTrack:'road', size:200, seed:7007, biome:'plains',
  fogColor:0x9ebd80, fogDensity:0.008,
  pathWaypoints:[{x:5,z:100},{x:195,z:100}],
  centerMarker:{title:'An Bealach Mór — Central', text:'Central stretch of An Bealach Mór. The Dearg crossing at Droichead ahead. The bridge is too well-made for a village this size.'},
  // v61f8: portalZone enables WORLD_DUNGEONS entries with zone matching
  // this id to spawn portal meshes in the zone. The bealach_central
  // prototype fort (seed 7100) lives here as the first fort_door test.
  portalZone:'bealach_central',
  gates:[
    // West = back toward Hearthwick, East = toward Droichead.
    // v61f9: gate Z updated to match new 200u road spine at z=100.
    {x:3,   z:100,  targetZone:'hearthwick',     spawnX:57, spawnZ:30, spawnYaw:Math.PI/2,   label:'Hearthwick'},
    {x:197, z:100,  targetZone:'droichead',      spawnX:7,  spawnZ:30, spawnYaw:-Math.PI/2,  label:'Droichead'},
  ],
});
registerPlaceholderZone({
  id:'droichead', kind:'village', displayName:'🌉 Droichead',
  region:'bealach',
  musicTrack:'village', size:60, seed:7008,
  // Bealach plains palette — softer than the road-zone defaults, sky a
  // bit warmer, fog a bit denser to suggest river-valley humidity. The
  // surrounding bealach corridor zones use 0xa8b8d0/0x98ac8c; we hold
  // close to that but pull the sky one notch warmer for the village's
  // settledness.
  skyCol:0xa8b4c4, fogColor:0x98ac8c, fogDensity:0.010,
  // ── Builder knobs ──────────────────────────────────────────────────────
  // Default Bealach plains-village register: rolling terrain, hedge-and-
  // tree border, dirt paths. NOT cobble (that's Carraig Mór's stone
  // register); not plank (that's coastal). Dirt is the road-stop look.
  terrainProfile:'rolling',
  borderType:'hedge_and_trees',
  pathStyle:'dirt',
  plazaProp:'market_post',
  // v61f2: terrainSlope removed. v61f0/v61f1 added an eastward slope to
  // create "river valley feel," but playtest revealed it confused the
  // terrain Y / water Y / cliff Y relationships and made the river area
  // visually hard to parse. With the v61f2 river-carve system actually
  // depressing the terrain mesh into a channel, we no longer need slope
  // for the valley effect — the channel itself IS the valley.
  // ── River carve (v61f2) ──────────────────────────────────────────────
  // The canonical Dearg crossing made literal. Carves a 4u-wide flat
  // riverbed at x:42..46 with 1u sloped banks on either side (total
  // carve region x:41..47, channel depth 2u). The terrain mesh itself
  // dips into the channel, so the river is visible from any angle and
  // the water surface sits naturally inside the depression.
  //
  // Width chosen narrower than the v61ez 8u channel (which was meant to
  // be flanked by cliff blocks that turned out invisible — see v61f2
  // ship notes). 4u channel + 1u banks each side = 6u total carve. Tadgh's
  // auto-path runs N-S at x≈35 (after the v61f2 hut relocation), 6u clear
  // of the river bank.
  river:{axis:'N-S', centerX:44, channelWidth:4, bankSlope:1, depth:2.0},
  // ── Platforms (v61f3) ────────────────────────────────────────────────
  // The bridge deck — a rectangular footprint where the player walks at
  // bank-top grade Y instead of the carved riverbed Y. Without this, the
  // engine's terrain-Y force-snap drops the player into the riverbed when
  // they walk through the bridge area. ySource:[40,30] samples terrain Y
  // just west of the channel (well outside the carve) — gives the natural
  // bank-top elevation.
  //
  // Footprint INTENTIONALLY larger than the visible bridge deck: deck is
  // x:39..49, z:28..32 but the platform is x:36..52, z:27..33. The wider
  // footprint clears border trees from the bridge approaches on BOTH banks
  // (with the +0.5u tree-exclusion margin in _inGap), preventing the v61f2
  // playtest issue where trees dropped in the east-bank approach corridor
  // and blocked the path from the bridge to the E gate. The Y override at
  // x=36..38 and x=50..52 is a no-op (terrain there is already at gradeY
  // because it's outside the carve at x:41..47), so widening hurts nothing.
  platforms:[
    {x0:36, x1:52, z0:27, z1:33, ySource:[40,30], name:'Droichead Bridge'},
  ],
  // (meadow ground texture held in reserve — review v61f0 first; the
  // GROUND_TEXTURES catalog explicitly names Cill Beag / Droichead /
  // Bealach hamlets as candidates if Droichead still reads generic.)
  // Default ground (grass) and tree style (cone_pine, sparse) — no
  // override. Bealach is the canonical reference for the defaults; the
  // builder's defaults were set with this register in mind.
  // ── Layout ─────────────────────────────────────────────────────────────
  centerX:25, centerZ:30, villageR:18,
  centerMarker:{title:'Droichead', text:'Irish: Bridge. Where An Bealach Mór crosses An Dearg, between Hearthwick and Ironhaven. The bridge is too well-made for a village this size — the keystones bear markings nobody here can read. The road is its reason; the ferryman is its other reason. Travelers stop. Some come back through, some do not.'},
  // Three buildings on the WEST bank of the river. East bank is intentionally
  // sparse — small annex, no buildings, just the road to Cill Beag.
  // dr1 Bree's Wagon-Stop — W gate-side, faces east toward the village center.
  // dr2 An empty cottage — west cluster, faces east. Atmospheric: establishes
  //     the village has more inhabitants than just Tadgh and Bree.
  // dr0 Tadgh's River-Hut — west bank near the riverside dock, faces east.
  //     v61f2: relocated from (32, 36) to (28, 36) so the auto-path from his
  //     door to the plaza runs comfortably west of the river edge instead of
  //     hugging the bank. With door at x=33.6 and porch at x=35.2, the N-S
  //     leg of the auto-path sits 5.8u west of the river's west bank (x=41).
  buildings:[
    {x:11, z:24, w:6, d:5, face:'E', houseId:'dr1'},
    {x:11, z:36, w:5, d:5, face:'E', houseId:'dr2'},
    {x:28, z:36, w:5, d:5, face:'E', houseId:'dr0'},
  ],
  houses:[
    {id:'dr0', doorX:33, doorZ:38, doorFace:'E', name:"Tadgh's River-Hut",
      keeper:'Tadgh',
      // No type — Tadgh's hut is private. He is met outside on the dock,
      // not as a shop interior. Sign post renders, board left blank.
      tagline:'"The dock is older than I am, and I am not new."',
      bCol:0x4a3e2a, sCol:0x8a7858},
    {id:'dr1', doorX:17, doorZ:26, doorFace:'E', name:"The Wagon-Stop",
      keeper:'Bree', type:'misc',
      tagline:'"What did you forget?"',
      bCol:0x6a4830, sCol:0x9a7050},
    {id:'dr2', doorX:16, doorZ:38, doorFace:'E', name:"The Old Cottage",
      // No keeper — empty residence, like Inis Rua's Watch-House. Door does
      // not resolve. Quiet atmosphere note: the village has more souls than
      // its two voiced NPCs would suggest. (Lore-coded as "the family that
      // ran the toll-house when the bridge had a toll, generations back" —
      // not surfaced in dialog; held as undocumented detail.)
      keeper:null,
      tagline:'"Shutters drawn. Smoke once a week."',
      bCol:0x5e4838, sCol:0x886848},
  ],
  npcDefs:[
    // ── Tadgh — Ferryman / information broker ──────────────────────────
    // Outside on his dock at the river's west bank, just south of the
    // bridge. Faces the river, not the road — player approaches him from
    // behind. Voice: David, rate 0.92, pitch 0.88. Late fifties, thirty-
    // two years at the river. Terse-but-knowing. Never asks the player a
    // question. Information moves through him in one direction.
    //
    // Five topics. Topic 5 (the southbound-thinning observation) carries
    // the canonical lore beat: traffic patterns are visibly degrading,
    // and Aldwyn used to buy reports from Tadgh on this kind of
    // observation but the requests have stopped. Tadgh is canonically a
    // quiet long-time Bealach-corridor source for Aldwyn — invisible to
    // the player until they have spoken with both characters.
    {x:38, z:41, name:'Tadgh', role:'Ferryman', ico:'\u26F5', bCol:0x3a2e22, sCol:0x6a584a,
      greeting:[
        "Bridge is up the slope. I do not run the bridge.",
        "Mind the rope. The dock is older than I am, and I am not new.",
        "If you are looking for the road north, the bridge takes you there. I take you elsewhere, and you have to know to ask.",
      ],
      topics:[
        {label:'What do you do here?',
          response:"I sit by the river. People who cannot use the bridge come down to the water; some of them come down to me. The bridge does not take wagons wider than the keystones. The bridge does not take traffic that does not want to be seen. There is some demand for the second kind. I meet it."},
        {label:'What do you sell?',
          response:"What I have heard, mostly. The boat is not the trade \u2014 the boat is what gets people to talk to me. People in motion say things they would not say in a room. By the time they have crossed they have given me what I need. I sell the rest of it on, when there is a buyer.",
          follow:[
            {label:'What sort of information?',
              response:"Movements. Names. Cargo. Who stopped here last week and who they were waiting for. The price scales with the question. I do not have a list of fixed rates; I read the asker. I am reading you."},
          ]},
        {label:'The bridge here \u2014 who built it?',
          response:"Older than the village. Older than the road, some say, but the road is also old. I have been at this dock thirty-two years next winter and the bridge has not lost a stone in that time. I do not know who built it. The people who would have known are dead. The keystones have markings on them; if you have a question about those, ask someone who reads. I do not."},
        {label:'Have you crossed the bridge?',
          response:"Twice. Once when I came here, going east. Once two years later, going back, when my father died, and then again coming back. So three times, if you count the return. I have not crossed it since. The dock is here. The work is here. I do not need the road."},
        // The southbound-thinning beat — Tadgh as third independent witness
        // to "the corruption is recent" alongside Roland (institutional)
        // and Brother Oswin (recordkeeper). The "man at Ironhaven who used
        // to buy this kind of thing" is Aldwyn, unnamed; player who has
        // met Aldwyn will recognize the connection on a re-read. Beautiful
        // unforced cross-village payoff if it lands.
        {label:"How's business been?",
          response:"Steady, mostly. There has been one thing \u2014 and I am only telling you because you are the kind of person who walks alone, and people who walk alone notice these things eventually anyway. Six months ago, the count started running short. People going north past my dock, fewer of them coming back south. Not all routes \u2014 I track the eastbound and the south-returning. Eastbound is normal. Southbound is thin.",
          follow:[
            {label:'What does that mean?',
              response:"It means something is keeping people on the north side. Or stopping them on the way. I do not know which. I am not paid to know which. I am telling you because I have stopped having anyone to sell the observation to who cares. The man at Ironhaven who used to buy this kind of thing has gone quiet. Maybe he stopped paying. Maybe he stopped having reason to ask. Either way."},
          ]},
        {label:'Goodbye.', bye:true},
      ]},
    // ── Bree — Wagon-Stop trader ──────────────────────────────────────
    // Outside her wagon-stop in the western cluster, position (19, 26).
    // Anglo-Saxon vernacular, plain register. Drove a cart up and down
    // An Bealach Mór for thirty years before settling. Functionally a
    // directions-and-stock NPC; lore-light by design.
    //
    // Voice: Zira, rate 1.05, pitch 1.05. Talkative in the practical way.
    {x:19, z:26, name:'Bree', role:'Wagon-Stop Trader', ico:'\ud83c\udf3e', bCol:0x6a4830, sCol:0x9a7050,
      greeting:[
        "Hearthwick way? Long walk if you carry too much. What did you forget?",
        "Wagon-stop's open. I close when it stops being worth opening, which is most evenings.",
        "Welcome to Droichead. The bridge is up the road. The river is over there. The two interesting people in town are me and the man at the dock, and he charges.",
      ],
      topics:[
        {label:'Browse your wares.', trade:true},
        {label:'You drove carts here?',
          response:"Up and down An Bealach Mór, Hearthwick to Ironhaven and back, thirty winters of it. Loads of grain, mostly, and once a wagon of glass that I have nightmares about. I stopped because my knees stopped, not because the road did. The road is still there. I can show you on a map which milestones lean which way."},
        {label:'Why did you settle here?',
          response:"Because everyone else was always passing through. I was passing through. After enough years of passing through the same place you start noticing the rooms inside it. There is a small one upstairs over the stop that suits me. The river is loud at night. I have made peace with the river."},
        {label:"What's the road like, ahead?",
          response:"West takes you back to Hearthwick \u2014 you came from there, I think, by the dust on your boots. North takes you to the Thorngate, then the Deepwood, then Ironhaven. That is the road most people want. East goes to Cill Beag, which is mostly an old church and a priest who has opinions. South nobody goes from here directly; if you want south you go back through Hearthwick. The bridge is the bridge. You will see it."},
        {label:'Goodbye.', bye:true},
      ]},
  ],
  gates:[
    // v61ec gate topology preserved exactly. v61ez NOTE: the route
    // topology now passes through the bridge — players from W or N
    // gates traveling to the E gate must walk east across the bridge
    // (or vice versa). The bridge's invisible side-blockers prevent
    // walk-off-into-river; cliff-edge sol entries prevent direct
    // descent into the riverbed.
    {x:3,  z:30, targetZone:'bealach_central',         spawnX:192, spawnZ:100, spawnYaw:Math.PI/2,  label:'An Bealach Mór — Central'},
    {x:30, z:3,  targetZone:'bealach_north_approach',  spawnX:100, spawnZ:192, spawnYaw:0,          label:'An Bealach Mór — North Approach'},
    {x:57, z:30, targetZone:'cill_beag_path',          spawnX:5,   spawnZ:30, spawnYaw:-Math.PI/2, label:'Road to Cill Beag'},
  ],
  decorateFn:genericVillageDecorate,
  // ── Droichead's bespoke detail — river surface, bridge, dock ───────────
  // v61f2: the canonical "An Bealach Mór crosses An Dearg" geometry, fully
  // rebuilt to use the new cfg.river carve system (see buildVillage's
  // height-array construction loop).
  //
  // The TERRAIN MESH ITSELF now dips into the river channel — the heights
  // array has a 4u-wide flat depression at x:42..46 (2u below grade) with
  // 1u-wide sloped banks at x:41..42 and x:46..47 tapering down. Total
  // visible river-area width is 6u (banks-included).
  //
  // What this detailFn now adds on top of the carved terrain:
  //   1. A water mesh inside the channel at riverbed level
  //   2. The stone bridge spanning the channel
  //   3. The keystones (examinable, sibling to the Mouth + Sea-Folk Shrine)
  //   4. Tadgh's dock and skiff
  //   5. Invisible sol-blockers at the bank edges so the player can't walk
  //      into the channel except at the bridge / dock
  //   6. A few atmospheric details (grain sacks, hitching post, reeds)
  //
  // What it NO LONGER includes (relative to v61ez/v61f0/v61f1):
  //   - Cliff face blocks. The carved terrain mesh IS the bank-and-channel
  //     geometry. Stone-block "cliffs" became invisible buried walls when
  //     the surrounding terrain was uncut; deleting them.
  //   - The underside arch. With a 4u channel and the deck now 0.4u above
  //     the channel-edge terrain (since channel is 2u below banks), there's
  //     not enough room beneath the deck for an arch to read meaningfully.
  //     Architecturally the bridge is now a simple stone slab with railings,
  //     keystones, and abutments — still the canonical "too well-made"
  //     stonework, just without the arch flourish that kept misrendering.
  //
  // Engine constraints preserved: player Y is force-snapped to terrain Y.
  // With the carved channel the terrain Y inside the channel is 2u below
  // bank level, so a player walking INTO the channel (if not sol-blocked)
  // would actually descend into the water. The sol-blockers are what
  // keep the bridge and dock the only authorized crossings.
  detailFn:function(sc, sol, getY){
    // ── River geometry constants ─────────────────────────────────────
    // These mirror the cfg.river spec exactly. Kept here as locals so the
    // bridge / dock / sol-block math stays self-contained.
    const RIVER_CENTER_X = 44;
    const RIVER_HALF_CHANNEL = 2;   // half-width of flat riverbed (4u total)
    const RIVER_BANK_SLOPE = 1;      // sloped bank width on each side
    const RIVER_DEPTH = 2.0;         // depth below grade
    const CHANNEL_X_MIN = RIVER_CENTER_X - RIVER_HALF_CHANNEL;  // 42
    const CHANNEL_X_MAX = RIVER_CENTER_X + RIVER_HALF_CHANNEL;  // 46
    const BANK_X_MIN = CHANNEL_X_MIN - RIVER_BANK_SLOPE;        // 41 (top of west bank)
    const BANK_X_MAX = CHANNEL_X_MAX + RIVER_BANK_SLOPE;        // 47 (top of east bank)

    // Reference Y values. Grade is "the bank top level"; we sample just
    // outside the carve at (40, 30) to get the natural bank Y unaffected
    // by the river depression. The riverbed Y is grade - RIVER_DEPTH.
    const _gradeY = getY(40, 30);
    const _bedY = _gradeY - RIVER_DEPTH;
    // v61f3: water surface raised to gradeY - 0.5 (was bed + 0.1 = gradeY -
    // 1.9). Previous water level read as "sand at the bottom of a dry pit"
    // because only 0.1u of water sat on top of 2.0u of bed. Now 1.5u of
    // water fills most of the channel, with 0.5u of dry bank lip still
    // visible above the waterline — reads as a proper river.
    const _waterY = _gradeY - 0.5;

    // ── River surface (water mesh) ──────────────────────────────────
    const waterMat = new THREE.MeshLambertMaterial({
      color:0x7a6a4a, // rust-brown — canonical Dearg ("the water runs
                      // red-brown from the bogland it flows through")
      transparent:true, opacity:0.85,
    });
    // v61f3: water plane widened to cover the FULL channel including the
    // sloped banks (x:41..47, width 6u). At the v61f3 water level (gradeY -
    // 0.5), the bank slope cells from x=41 (gradeY) down to x=42 (gradeY -
    // 2) cross the waterline at roughly x=41.25 — submerging the lower
    // 75% of the bank slope. The water plane covers all of this so the
    // bank slopes don't read as dry mud rising out of nothing.
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(BANK_X_MAX - BANK_X_MIN, 70),
      waterMat,
    );
    water.rotation.x = -Math.PI/2;
    water.position.set((BANK_X_MIN + BANK_X_MAX)/2, _waterY, 30);
    sc.add(water);

    // ── Bank-edge sol blockers (invisible walls along channel) ──────
    // Without these the player could walk down the bank slope into the
    // river and stand in the channel at -2u terrain Y. The river is
    // "deep enough that you cross at the bridge or by Tadgh's skiff,
    // not by wading." Each bank gets a long thin sol running parallel
    // to the channel axis, with gaps for (a) the bridge corridor and
    // (b) Tadgh's dock.
    //
    // Sol positioned at BANK TOP (x = 41 west, x = 47 east), where the
    // ground is still at grade Y. The bank slope itself (x:41..42 and
    // x:46..47) is allowed to remain accessible — the player can step
    // onto the slope but is stopped by the sol at the channel edge.
    // Actually simpler: block at bank top so the player can't even
    // start descending the slope unless they're on the bridge / dock.
    const _bridgeZMin = 28, _bridgeZMax = 32;
    const _dockZMin = 41, _dockZMax = 45;
    // West-bank sol segments (gaps for bridge corridor and dock)
    const _bankSegsWest = [
      [0, _bridgeZMin], [_bridgeZMax, _dockZMin], [_dockZMax, 60],
    ];
    const _bankSegsEast = [
      [0, _bridgeZMin], [_bridgeZMax, 60],
    ];
    _bankSegsWest.forEach(([z0, z1]) => {
      const segLen = z1 - z0;
      if(segLen < 0.2) return;
      sol.push({cx:BANK_X_MIN, cz:(z0+z1)/2, rx:0.15, rz:segLen/2});
    });
    _bankSegsEast.forEach(([z0, z1]) => {
      const segLen = z1 - z0;
      if(segLen < 0.2) return;
      sol.push({cx:BANK_X_MAX, cz:(z0+z1)/2, rx:0.15, rz:segLen/2});
    });

    // ── The Bridge ───────────────────────────────────────────────────
    // East-west span across the river at z:28..32. With the channel now
    // 6u wide bank-top to bank-top (x:41..47), the bridge is 10u long
    // (x:39..49) — overlaps each bank by ~1u for visual abutment.
    const BRIDGE_X_MIN = 39, BRIDGE_X_MAX = 49;
    const BRIDGE_Z_MIN = _bridgeZMin, BRIDGE_Z_MAX = _bridgeZMax;
    const BRIDGE_LEN = BRIDGE_X_MAX - BRIDGE_X_MIN;
    const BRIDGE_W = BRIDGE_Z_MAX - BRIDGE_Z_MIN;
    // Deck Y anchored to the bank-top grade (sampled at x=40, well outside
    // the carve). The whole bridge sits at this Y; the player walks across
    // at bank level.
    const _bridgeDeckY = _gradeY;
    // v61f4: deck TOP raised 0.05u above grade to eliminate z-fighting with
    // the terrain mesh. Pre-v61f4 the deck top was flush with grade, and
    // since the terrain mesh continues across the bridge area at gradeY,
    // the two coplanar surfaces flickered — grass blades poking through the
    // stone, stone strips poking through the grass. Now the deck (and every
    // mesh anchored to "deck top") sits at `_deckTop = gradeY + 0.05`. The
    // player still walks at gradeY via the platforms-system override; the
    // visible 0.05u gap between foot-level and deck top is below the
    // perceptible threshold. Same fix applied to keystones (their bottoms
    // were flush with deck top, same z-fight class). Lessons re-learned:
    // never have two coplanar surfaces at exactly the same Y; pad by ≥0.05u.
    const _deckTop = _bridgeDeckY + 0.05;
    const stoneMat = new THREE.MeshLambertMaterial({color:0x6a5e4a});
    const stoneDarkMat = new THREE.MeshLambertMaterial({color:0x4a3e30});
    const woodMat = new THREE.MeshLambertMaterial({color:0x4a3220});
    // Deck: a stone slab. 0.4u thick; top at `_deckTop` (gradeY + 0.05).
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(BRIDGE_LEN, 0.4, BRIDGE_W),
      stoneMat,
    );
    deck.position.set(
      (BRIDGE_X_MIN + BRIDGE_X_MAX)/2,
      _deckTop - 0.2, // box center sits half-thickness below top
      (BRIDGE_Z_MIN + BRIDGE_Z_MAX)/2,
    );
    sc.add(deck);
    // Bridge railings — two parallel low stone walls along the N and S
    // edges of the deck. Visible cue + invisible side-blocker enforcement.
    // Bottom flush with deck top (_deckTop); height 0.7u so top at _deckTop+0.7.
    [BRIDGE_Z_MIN, BRIDGE_Z_MAX].forEach((rz, i) => {
      const railing = new THREE.Mesh(
        new THREE.BoxGeometry(BRIDGE_LEN, 0.7, 0.25),
        stoneMat,
      );
      railing.position.set(
        (BRIDGE_X_MIN + BRIDGE_X_MAX)/2,
        _deckTop + 0.35,
        rz + (i === 0 ? -0.05 : 0.05),
      );
      sc.add(railing);
      sol.push({cx:(BRIDGE_X_MIN + BRIDGE_X_MAX)/2, cz:rz, rx:BRIDGE_LEN/2, rz:0.15});
    });
    // Bridge abutments — short stone columns at each end of the span.
    [BRIDGE_X_MIN, BRIDGE_X_MAX].forEach(ax => {
      [BRIDGE_Z_MIN - 0.3, BRIDGE_Z_MAX + 0.3].forEach(az => {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 1.1, 0.6),
          stoneDarkMat,
        );
        post.position.set(ax, _deckTop + 0.55, az);
        sc.add(post);
        sol.push({cx:ax, cz:az, rx:0.3, rz:0.3});
      });
    });
    // v61f2: bridge underside arch removed. With a 4u channel and the deck
    // sitting at bank-grade (only 2u above the riverbed), there isn't enough
    // vertical space beneath the deck for an arch to read meaningfully.
    // The bridge is now a simple stone slab — still canonically "too
    // well-made" via the stonework material, abutment columns, and the
    // examinable carved keystones (kept).

    // ── The Keystones (two examinable carved stones at midspan) ──────
    // v61f5: redesigned from flat slab to a proper carved monolith silhouette.
    // v61f4 keystones were 1.0×1.4×0.5 boxes with a flat lighter rectangle
    // inset INSIDE the box (z-fighting with the box's back face — visible as
    // flicker in playtest). Now: a slightly taller pillar with a stepped
    // capstone, weathered base, and a proud carved face bearing three small
    // sigil bumps. Reads as "old, deliberately made, marked with something
    // the locals can no longer read" — matches the canon "bridge too well-
    // made for a village this size" beat. Examine prompt fires from bridge
    // midpoint (44, 30); see examine handler in interact() — sibling to the
    // Mouth and Sea-Folk Shrine.
    //
    // Geometry per keystone (5 meshes, both sides → 10 meshes total):
    //   - main pillar:  0.8 × 1.6 × 0.5  (stoneDarkMat)
    //   - capstone:     1.0 × 0.18 × 0.65 (stoneMat, lighter, slightly wider)
    //   - base block:   1.0 × 0.20 × 0.65 (stoneMat, lighter, wider too)
    //   - carved face:  0.55 × 1.0 × 0.04 (lighter, sits PROUD of pillar)
    //   - 3 sigil bumps: 0.10 × 0.10 × 0.06 (small protrusions on the face)
    //
    // The face is positioned z=±(0.25 + 0.03) so its NEAR face sits 0.05u
    // proud of the pillar's near face. No z-fight, and the geometry reads
    // as "carved into the stone" rather than "painted on the stone."
    [BRIDGE_Z_MIN, BRIDGE_Z_MAX].forEach((rz, i) => {
      // Pillar — the body of the keystone. Inner side faces deck axis.
      const pillarZ = rz + (i === 0 ? -0.05 : 0.05);
      const _pillarBottom = _deckTop + 0.05;
      const _pillarH = 1.6;
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, _pillarH, 0.5),
        stoneDarkMat,
      );
      pillar.position.set(44, _pillarBottom + _pillarH/2, pillarZ);
      sc.add(pillar);
      // Capstone — slightly wider, sits on TOP of the pillar.
      const capH = 0.18;
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, capH, 0.65),
        stoneMat,
      );
      cap.position.set(44, _pillarBottom + _pillarH + capH/2, pillarZ);
      sc.add(cap);
      // Base block — wider plinth at the bottom, partially sunk into deck.
      const baseH = 0.20;
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, baseH, 0.65),
        stoneMat,
      );
      base.position.set(44, _pillarBottom + baseH/2, pillarZ);
      sc.add(base);
      // Carved face — lighter inset panel on the deck-facing side of the
      // pillar. Sits PROUD of the pillar by 0.03u (so its near face is at
      // pillar near-face + 0.03, no z-fight). Direction: face points toward
      // the deck axis (z=30 from both railings).
      const faceZ = pillarZ + (i === 0 ? 0.25 + 0.03 : -0.25 - 0.03);
      const carvingFace = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 1.0, 0.04),
        new THREE.MeshLambertMaterial({color:0x9a8a70}),
      );
      carvingFace.position.set(
        44,
        _pillarBottom + 0.10 + 0.5, // 0.10u above base; centered vertically in pillar middle
        faceZ,
      );
      sc.add(carvingFace);
      // Three sigil bumps on the carved face — small protruding cubes,
      // arranged vertically. Suggests "markings nobody can read" without
      // committing to specific glyphs. Color slightly darker than the
      // face so they read as carved-relief rather than painted-on.
      const sigilMat = new THREE.MeshLambertMaterial({color:0x6a5848});
      // Sigil bump near-face Z: face near-face + sigil half-depth.
      const sigilZ = pillarZ + (i === 0 ? 0.25 + 0.03 + 0.02 + 0.03 : -0.25 - 0.03 - 0.02 - 0.03);
      const sigilCenterY = _pillarBottom + 0.10 + 0.5;
      [-0.25, 0, 0.25].forEach(dy => {
        const sigil = new THREE.Mesh(
          new THREE.BoxGeometry(0.10, 0.10, 0.06),
          sigilMat,
        );
        sigil.position.set(44, sigilCenterY + dy, sigilZ);
        sc.add(sigil);
      });
      sol.push({cx:44, cz:rz, rx:0.5, rz:0.32});
    });

    // ── Tadgh's dock and skiff ──────────────────────────────────────
    // Small wooden platform on the west bank at z:42..44.
    // v61f3: dock pulled west so its east edge sits AT the bank top (x=41)
    // rather than hanging out over the bank slope. Previous v61f2 position
    // (center x=40.5, east edge x=41.75) was fine when the water level was
    // at the riverbed (0.1u of water on top of mud), but the v61f3 water
    // level raise (gradeY - 0.5, ~1.5u deep) would have submerged the
    // dock's east edge. Now: center x=39.75, east edge x=41 (bank top),
    // west edge x=38.5 (on flat grass). Skiff stays in the channel,
    // moored by rope reaching out from the dock.
    const _dockY = _gradeY;
    const tadghDock = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.18, 2.4),
      woodMat,
    );
    tadghDock.position.set(39.75, _dockY + 0.05, 43);
    sc.add(tadghDock);
    // Pilings beneath — anchored at bank-grade, length spanning to the
    // riverbed level. With the dock now fully on bank top, all pilings
    // visually sink into the bank grass (harmless — they read as posts
    // sunk into the ground for stability).
    [42.0, 44.0].forEach(pz => {
      [38.75, 40.75].forEach(px => {
        const piling = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.16, RIVER_DEPTH + 0.5, 6),
          woodMat,
        );
        piling.position.set(px, _dockY - RIVER_DEPTH/2, pz);
        sc.add(piling);
      });
    });
    // Tadgh's skiff — moored just east of the dock, sitting on the
    // water surface inside the channel.
    // v61f5: visual fixes after playtest revealed (a) the trim torus
    // floating ~0.25u above the hull's open face (it was anchored to
    // skiffY + 0.30 while the hull rim sat at skiffY + 0.05 after the
    // rotation.x = π flip), and (b) the hollow boat interior showing
    // straight through to water level, reading as "taking on water."
    // Now: torus moved to skiffY + 0.05 (flush with the hull rim), and
    // a planking floor mesh added inside the boat at skiffY + 0.02 so
    // the player sees a wooden boat-floor, not the water below.
    const skiffMat = new THREE.MeshLambertMaterial({
      color:0x4a3220, side:THREE.DoubleSide,
    });
    const skiffTrimMat = new THREE.MeshLambertMaterial({color:0x6a4830});
    const skiffY = _waterY + 0.25;
    // v61f2: skiff moved east into the channel (was at x=43.5 when channel
    // was x:40..48; now at x=44 with channel x:42..46). Centered in the
    // narrower channel.
    const skiffX = 44;
    const skiffHull = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 8, 5, 0, Math.PI*2, 0, Math.PI/2.2),
      skiffMat,
    );
    skiffHull.scale.set(1.4, 1.0, 0.9); // v61f2: narrower scale to fit 4u channel
    skiffHull.position.set(skiffX, skiffY + 0.15, 43);
    skiffHull.rotation.x = Math.PI;
    sc.add(skiffHull);
    // v61f6: removed the v61f5 plank floor mesh — it was positioned at
    // skiffY + 0.04 (essentially at the rim level), reading as a "lid"
    // covering the boat opening rather than as a wooden floor visible
    // inside the hull. The hull itself is a closed hemisphere with its
    // pole at skiffY - 0.55, so the boat has its own closed bottom; the
    // floor was redundant clutter. With the v61f5 rim alignment fix
    // (torus flush with hull rim, no floating-ring gap), the hull alone
    // is sufficient — you look into the boat and see the dark interior
    // of the hemisphere, which reads as a punt's interior.
    // v61f5: trim rim aligned with hull's open-face Y (skiffY + 0.05 after
    // the hull rotation flip). Previously the torus floated 0.25u above
    // the hull rim, reading as a separate disconnected ring.
    const skiffRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.7, 0.05, 4, 14),
      skiffTrimMat,
    );
    skiffRim.scale.set(1.4, 0.85, 1.0);
    skiffRim.rotation.x = Math.PI/2;
    skiffRim.position.set(skiffX, skiffY + 0.05, 43);
    sc.add(skiffRim);
    const oar = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.06, 0.08),
      skiffTrimMat,
    );
    oar.position.set(skiffX, skiffY + 0.12, 43);
    oar.rotation.y = 0.15;
    sc.add(oar);
    sol.push({cx:skiffX, cz:43, rx:1.0, rz:0.7});
    const mTie = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.7, 5),
      new THREE.MeshLambertMaterial({color:0xa89070}),
    );
    mTie.rotation.z = Math.PI/2.6;
    mTie.position.set(skiffX - 1.0, skiffY + 0.10, 43.0);
    sc.add(mTie);

    // ── A few low scattered details on the banks ──────────────────────
    // Atmospheric: grain sacks near Bree's stop, a hitching post by the
    // road, reed clumps at the water's edge along the bank slopes.
    const sackMat = new THREE.MeshLambertMaterial({color:0xa89060});
    [[20, 24], [22, 24]].forEach(([sx,sz]) => {
      const sty = getY(sx, sz);
      const sack = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.5, 0.7),
        sackMat,
      );
      sack.position.set(sx, sty + 0.25, sz);
      sack.rotation.y = Math.random() * 0.4;
      sc.add(sack);
      sol.push({cx:sx, cz:sz, rx:0.35, rz:0.35});
    });
    const hitchPost = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 1.0, 0.18),
      woodMat,
    );
    const _hitchY = getY(8, 28);
    hitchPost.position.set(8, _hitchY + 0.5, 28);
    sc.add(hitchPost);
    const hitchBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.10, 0.10),
      woodMat,
    );
    hitchBar.position.set(8, _hitchY + 0.85, 28);
    sc.add(hitchBar);
    sol.push({cx:8, cz:28, rx:0.7, rz:0.1});
    // Reeds along the bank-top edges (where the bank slopes meet grass).
    // v61f2: positioned at the bank tops (x=41 west, x=47 east) rather
    // than at the v61ez river-edge x=40/48 positions.
    const reedMat = new THREE.MeshLambertMaterial({color:0x6a7838});
    [[41, 12], [41, 50], [47, 18], [47, 48], [41, 6], [47, 56]].forEach(([rx, rz]) => {
      for(let i = 0; i < 5; i++){
        const reed = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.6 + Math.random()*0.4, 0.04),
          reedMat,
        );
        // Sample local terrain (which on the bank slope will be partway
        // between grade and bed — reeds visibly grow on the slope edge).
        const _reedX = rx + (Math.random() - 0.5) * 0.6;
        const _reedZ = rz + (Math.random() - 0.5) * 0.6;
        reed.position.set(
          _reedX,
          getY(_reedX, _reedZ) + 0.3 + Math.random()*0.2,
          _reedZ,
        );
        reed.rotation.z = (Math.random() - 0.5) * 0.2;
        sc.add(reed);
      }
    });
  },
});
registerPlaceholderZone({
  id:'cill_beag_path', kind:'wilderness', displayName:'🛤️ Road to Cill Beag',
  region:'bealach',
  musicTrack:'road', size:60, seed:7009, biome:'forest',
  fogColor:0x5a6838, fogDensity:0.013,
  pathWaypoints:[{x:5,z:30},{x:55,z:30}],
  centerMarker:{title:'Road to Cill Beag', text:'Unmarked side path east of Droichead — a cart-track through the treeline toward the little oratory village.'},
  gates:[
    {x:3,  z:30, targetZone:'droichead', spawnX:55, spawnZ:30, spawnYaw:Math.PI/2,  label:'Droichead'},
    {x:57, z:30, targetZone:'cill_beag', spawnX:5,  spawnZ:25, spawnYaw:-Math.PI/2, label:'Cill Beag'},
  ],
});
registerPlaceholderZone({
  id:'cill_beag', kind:'village', displayName:'⛪ Cill Beag',
  region:'bealach',
  musicTrack:'village', size:50, seed:7010,
  skyCol:0xa8b8c8, fogColor:0x98a878, fogDensity:0.011,
  centerX:25, centerZ:25, villageR:16, buildings:[],
  centerMarker:{title:'Cill Beag', text:'Irish: Small Church. Grew up around a half-ruined stone oratory. The priest is de facto mayor. Has an uneasy relationship with an old gate two miles east that everyone pretends isn\'t there.'},
  gates:[
    // v61d7: label was 'Road to Droichead' (where the road eventually leads),
    // but the gate enters a zone named 'Road to Cill Beag'. Aligned to the
    // target zone's displayName so the prompt and the arrival sign agree.
    // v61ec: south gate added — direct route to Hermit's Camp per locked
    // map. Cill Beag's "old gate two miles east" lore beat aligns with the
    // Wastes border being just south of the village.
    {x:3,  z:25, targetZone:'cill_beag_path', spawnX:55, spawnZ:30, spawnYaw:Math.PI/2, label:'Road to Cill Beag'},
    {x:25, z:48, targetZone:'hermit_camp',    spawnX:15, spawnZ:3,  spawnYaw:0,         label:"Hermit's Camp"},
  ],
});
// ─── Bealach Mór — North Approach: Greywatch (v61f7, refactored v61f9) ──
// The Bealach corridor between Droichead and the Thorngate. A 200×200
// forest-region zone with the ruin of an old fort — Greywatch — set off
// the road. The fort is procedurally generated: the player walks up to
// the watchtower exterior, sees the slumped gate-arch in the perimeter
// wall, passes through the courtyard, and reaches the heavy door at the
// base of the tower. Pressing E enters a procedural dungeon interior.
//
// v61f9 refactor: the original v61f7 ship hand-built a walkable tower
// interior with chest + broken stair examine. That was replaced by the
// procedural-fort model — the exterior shell is now built by
// FORT_EXTERIORS.watchtower (registered in the portals module), and the
// interior is a normal procedural dungeon. The zone spec only declares
// the portal hookup, the bandit spawns around the fort exterior, and a
// small side-path mesh connecting road to fort.
//
// Bandits: 4 total, distributed for the courtyard fiction —
//   • 2 sentinels outside the perimeter, on the side-path approach
//   • 2 in the courtyard between the gate-arch and the tower door
// All four engage the player BEFORE the door is reached. The procedural
// dungeon interior is the rest of the fight.
//
// Zone size: 200 (was 80 in v61f7-v61f8). The original 80×80 was too
// cramped — the fort took ~20×20 of footprint and the steep hill on a
// short radius read as a cliff. The 200×200 size gives the road room to
// breathe and the fort space to sit naturally in the landscape.
registerPlaceholderZone({
  id:'bealach_north_approach', kind:'wilderness', displayName:'🌲 Bealach Mór — North Approach',
  region:'bealach',
  musicTrack:'forest', size:200, seed:7011, biome:'forest',
  fogColor:0x384a22, fogDensity:0.018,
  // v61f9: road spine centered in 200u zone — runs N-S at x=100.
  pathWaypoints:[{x:100, z:5}, {x:100, z:195}],
  centerMarker:{title:'An Bealach Mór — North Approach', text:"Between Droichead and the Thorngate the canopy lowers and the road runs near a clearing on its western side. In the clearing, the ruin of an old fort: a broken tower, a courtyard wall, weather and moss. The locals call it Greywatch."},
  // v61f9: portalZone enables the Greywatch fort_door portal (declared
  // in WORLD_DUNGEONS with zone:'bealach_north_approach') to spawn.
  portalZone:'bealach_north_approach',
  gates:[
    // North Approach corridor between Droichead (south) and the
    // Thorngate (north). Spawn coords on adjacent zones updated to match
    // the new 200-unit road span (gates at z=3 and z=197).
    {x:100, z:197, targetZone:'droichead', spawnX:30, spawnZ:6,  spawnYaw:Math.PI, label:'Droichead'},
    {x:100, z:3,   targetZone:'thorngate', spawnX:20, spawnZ:35, spawnYaw:0,       label:'The Thorngate'},
  ],
  // v61f9 post-playtest: bandits guarding Greywatch. Fort door at
  // (60, 100). Tower at (60, 97.4) — NORTH of door (was at +baseR
  // pre-playtest, swapped to -baseR to put door on tower's south face).
  // Perimeter wall ring at radius 14 from tower center (~doubled from
  // playtest feedback). Gate-arch at deg=90 → (60, 111.4).
  // Courtyard interior spans roughly z=98 to z=110.
  //   • Sentinel 1: outside perimeter, south of gate (58, 119)
  //   • Sentinel 2: outside perimeter, south of gate (63, 117)
  //   • Courtyard 1: inside, just north of gate (59, 107)
  //   • Courtyard 2: inside, west side of courtyard (54, 104)
  // All four positions verified clear of tower cylinder (radius 2.6
  // around (60, 97.4)) and inside perimeter (radius 14 around same).
  // v61g5: positions recalibrated for the 2× scale + 24u perimeter.
  // Fort door at (60, 76); gate showpiece at z=100; courtyard z=76..100.
  //   • Sentinel 1: outside south of gate at (58, 115)
  //   • Sentinel 2: outside south of gate at (63, 117)
  //   • Courtyard 1: inside, mid-courtyard (60, 90)
  //   • Courtyard 2: inside, west side of courtyard (54, 85)
  enemies:[
    {name:'Bandit', pos:[[58, 115], [63, 117], [60, 90], [54, 85]]},
  ],
  // v61f9: detailFn now only draws the side path from road to fort —
  // the fort exterior itself is built by FORT_EXTERIORS.watchtower via
  // the portal system.
  detailFn:function(sc, sol, getY){
    // ── Side path: road (x=100) → fort gate-arch (60, 111.4) ─────────
    // Road runs N-S at x=100. Player approaching from south sees fort
    // to the west around z=98-115. Branch off at (100, 122), sweep
    // west, arrive just south of the gate-arch.
    const pathMat = new THREE.MeshLambertMaterial({color:0x6a5232});
    function mkPathSeg(x1, z1, x2, z2, w){
      const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
      if(len < 0.1) return;
      const segments = Math.max(1, Math.ceil(len / 2.5));
      for(let i=0; i<segments; i++){
        const t0 = i / segments, t1 = (i + 1) / segments;
        const tm = (t0 + t1) / 2;
        const cx = x1 + dx * tm, cz = z1 + dz * tm;
        const segLen = len / segments;
        const ang = Math.atan2(dx, dz);
        const p = new THREE.Mesh(new THREE.PlaneGeometry(w, segLen + 0.05), pathMat);
        p.rotation.x = -Math.PI/2;
        p.rotation.z = ang;
        p.position.set(cx, getY(cx, cz) + 0.02, cz);
        sc.add(p);
      }
    }
    // Three-segment side path: branch off road → westward sweep →
    // arrive 2u south of the gate-arch position (60, 111.4).
    mkPathSeg(100, 122, 85, 118, 1.6);
    mkPathSeg(85, 118, 72, 114, 1.6);
    mkPathSeg(72, 114, 60, 113.5, 1.4);
  },
});

// ─── Inis Rua (tide-governed ferry connection from Carraig Mór; v61d7,
//     reframed v61ew, fleshed out v61ey) ─────────────────────────────────
// The receiving side of the Carraig Mór ferry. Smaller, more isolated, and
// older-feeling than Carraig Mór — canon: "fiercely independent," "the sea
// owns them twice a day," "exactly one dungeon entrance." The signature
// character is Niamh, the Keeper of the Mouth — third-generation watcher
// of the sea-cave entrance at the south cliff. Lore-ties to Áine via her
// brother (the canonical last person to come back out alive, fifty years
// ago — Niamh's mother spoke to him).
//
// Layout: 60×60 zone matching Carraig Mór's footprint (was 50; bumped for
// symmetry and to give the south cliff + Mouth room to breathe). North-side
// dock + ferry boat mirror Carraig Mór's south side. Three buildings + the
// Mouth as a fourth non-building examinable structure. South-side terrain
// slopes UP toward the cliff where the Mouth sits — opposite Carraig Mór's
// southward slope; reads as "rock rising out of the sea, dungeon below."
registerPlaceholderZone({
  id:'inis_rua', kind:'village', displayName:'🏝️ Inis Rua',
  region:'coastal',
  musicTrack:'village', size:60, seed:7012,
  // Cooler than Carraig Mór's overcast-Atlantic palette — "lonelier." Same
  // family of greys but pulled slightly bluer and dimmer. Not Arctic
  // (we're not redoing v61eu's Snowbjörn mistake) — just more wintry-
  // Atlantic. Fog density up a hair: this island is more cut-off.
  skyCol:0x8a98a4, fogColor:0x808488, fogDensity:0.016,
  // Coastal sky-ring (sea horizon, no peaks).
  biome:'coast',
  // ── Builder knobs ──────────────────────────────────────────────────────
  // Same rocky outcrop register as Carraig Mór, but slope inverted — the
  // rock rises southward toward the cliff at the Mouth. North side is the
  // low landing where the ferry dock sits; south side is the cliff edge.
  terrainProfile:'rocky',
  terrainSlope:{dir:'N', amount:2.5},
  // North side opens for line-of-sight back to Carraig Mór across the
  // strait (matches Carraig Mór's openSide:'S' for the same ferry view
  // mirrored from the other side).
  openSide:'N',
  // Stone register, matching Carraig Mór but shifted by ground texture.
  buildingMaterial:'stone',
  roofStyle:'slate_pitched',
  // The "red" of Red Island — iron-rust runoff on the rock. New v61ey
  // ground texture, recipe in GROUND_TEXTURES above.
  groundTexture:'rust_stone',
  borderType:'stone_walls',
  pathStyle:'cobble',
  plazaProp:'well',
  // Windswept interior trees — bent trunks reading as cliff-shaped. The
  // v61ex catalog entry was authored with Inis Rua specifically in mind.
  // (Sparse — this island has wind, not woods.)
  interiorTreeStyle:'windswept',
  // Tussock + kelp scatter, same as Carraig Mór — the rock-coast register
  // is consistent across the arc.
  groundScatter:'tussock_and_kelp',
  // ── Layout ─────────────────────────────────────────────────────────────
  centerX:28, centerZ:28, villageR:18,
  centerMarker:{title:'Inis Rua', text:'Irish: Red Island. A small tidal island west of Carraig Mór, reachable only when the tide is out. Fiercely independent — too small for a lord\u2019s reach, too isolated for the kingdom\u2019s records. Has exactly one dungeon entrance: a sea-cave at the southern cliff that locals call the Mouth, and that the Keeper has watched every day of her life.'},
  // Three buildings. ir0 Niamh's Dwelling (private residence — she is met
  // outside, on the path to the Mouth). ir1 Fionn's Net-Shed (the harbor
  // supplies trade — fish, rope, oilcloth). ir2 The Watch-House — formally
  // the Keeper's old quarters where Niamh's mother lived; a second small
  // stone residence that quietly establishes the village had more people
  // once. No shop type, sign blank.
  buildings:[
    // ir1 Fionn's Net-Shed — NE quadrant, faces south toward the plaza.
    {x:35, z:14, w:6, d:4, face:'S', houseId:'ir1'},
    // ir2 The Watch-House — NW quadrant, faces south. Smaller than the
    // shed; reads as a residence not a workshop.
    {x:12, z:16, w:5, d:5, face:'S', houseId:'ir2'},
    // ir0 Niamh's Dwelling — SE quadrant, faces west toward the plaza.
    // She does not actually receive the player here; her dialog happens
    // outside on the cliff path. The dwelling exists so she has a place.
    {x:38, z:34, w:5, d:5, face:'W', houseId:'ir0'},
  ],
  houses:[
    {id:'ir0', doorX:38, doorZ:36, doorFace:'W', name:"Niamh's Dwelling",
      keeper:'Niamh',
      // No type — this is a residence. Sign post renders, board left blank
      // by genericVillageDecorate's "no icon for unknown shop types" branch.
      // Niamh is met outside in the npcDef below, near the cliff path.
      tagline:'"The door faces the village. The window faces the Mouth."',
      bCol:0x6a6660, sCol:0xa8a098},
    {id:'ir1', doorX:38, doorZ:14, doorFace:'S', name:"The Net-Shed",
      keeper:'Fionn', type:'harbor_supplies',
      tagline:'"Tide brought you in. Tide will take you back."',
      bCol:0x6e6864, sCol:0x988a76},
    {id:'ir2', doorX:14, doorZ:16, doorFace:'S', name:"The Watch-House",
      // No keeper — this building is empty. Door does not resolve to an
      // interior shop. The blank sign + closed door read as "lived in once,
      // not now." Niamh's third dialog topic references that her mother
      // lived here; for the player, it's atmosphere unless they ask.
      keeper:null,
      tagline:'"Closed shutters. Sea-bleached wood."',
      bCol:0x686460, sCol:0x9a9088},
  ],
  npcDefs:[
    // ── Niamh — Keeper of the Mouth ──────────────────────────────────────
    // Signature lore-load-bearing NPC. Stands on the path to the Mouth,
    // facing the cliff (yaw=π — south). Player walking from the dock
    // through the village center to the Mouth passes her. She does not
    // approach; the player approaches her.
    //
    // Voice: Zira, rate 0.95, pitch 1.00 — younger than Áine but not
    // young, plain delivery, watches the player's face when she answers.
    // Five topics carry the canon load: the Keeper tradition (multi-
    // generational), the iron-rust origin of "Red Island," the village's
    // independence and the two lost visitors this year, and the brother
    // beat tying her family to Áine's. The brother beat is gated as a
    // follow-up to the cave-survivors topic — player has to ask the
    // setup question first.
    {x:32, z:46, name:'Niamh', role:'Keeper of the Mouth', ico:'\ud83d\udc41\ufe0f', bCol:0x4a4a52, sCol:0xa8a0a0,
      greeting:[
        "You came across with the tide. Most do not bother.",
        "Stand where you are a moment. The wind off the mouth pulls strangers toward it.",
        "I watched the boat come in. You walk like someone with a question.",
      ],
      topics:[
        // Topic 1 — what she does. Establishes the Keeper-of-the-Mouth
        // institution. Follow-up "what comes out" lands the lore beat
        // about the tide carrying the changed man away.
        {label:'What do you do here?',
          response:"I keep the Mouth. My mother kept it before me, and her father before her, and back further than the names hold. We do not go in. We watch what comes out, and we count what does not. That is the work. It does not pay; the village feeds us.",
          follow:[
            {label:'What comes out?',
              response:"Mostly nothing. Wind. Salt. Sometimes a sound that is not a sound \u2014 you feel it in your teeth before you hear it. Twice in my life, a creature. Once a man, who was not a man when he came back out. The tide carried him away. We did not stop it."},
          ]},
        // Topic 2 — the name of the island. Iron-rust origin, lore-codes
        // the rust_stone ground texture in-fiction. Closes with the
        // distinction between Carraig Mór's mythic register and Inis
        // Rua's plain one — "the rock has iron. The rain comes."
        {label:'Why is the island called red?',
          response:"The rock has iron in it. When the rain comes hard the runoff stains the shore. In the autumn it looks like the island is bleeding out into the strait. The old people on the rock \u2014 Carraig Mór, where you came from \u2014 say it is the island remembering something. We do not say that. The rock has iron. The rain comes."},
        // Topic 3 — the village's relationship to authority and the small
        // horror beat of the two lost visitors this year. Flat delivery;
        // the loss is a fact, not a confession. Follow-up "lost how"
        // names the two specific incidents.
        {label:'The people here \u2014 they answer to no one?',
          response:"We answer to the tide. That is enough authority for a place this small. The ferry crosses when the sea allows. Letters from Carraig Mór do not reach us \u2014 there is no post. Visitors come twice in a year, on average. Three this year, counting you. The other two were lost.",
          follow:[
            {label:'Lost how?',
              response:"One went into the Mouth. We told her not to. The other walked out into the strait at low tide and kept walking past where the water comes back. We do not stop people from doing those things. We have learned what stopping costs."},
          ]},
        // Topic 4 — the brother beat. Niamh's anchor to Áine. The
        // follow-up "what did her brother say" is the heaviest single
        // line — Niamh's mother died with the words. Held close.
        {label:'Has anyone made it back from the Mouth?',
          response:"Some. Not many. A man came out fifty years ago, before I was born \u2014 he was Áine\u2019s brother, on the rock. You may have heard her speak of him. He was the last one who came out alive. He was not the last one to go in. We have been watching the entrance since, in case another one comes. None has.",
          follow:[
            {label:'What did her brother say?',
              response:"I do not know. He spoke to my mother once and she would not repeat it. She said the words were not wrong, but they should not be carried. She died with them. I have made my peace with not knowing."},
          ]},
        {label:'Goodbye.', bye:true},
      ]},
    // ── Fionn — fisherman, harbor_supplies trade ──────────────────────────
    // Outside his shed in the NE area, sorting nets. Old, weather-cracked,
    // dry. Brand-adjacent register (former sailor, says less than he could)
    // but Irish-coded and without the closed-door beat.
    //
    // Voice: David, rate 0.95, pitch 0.95 — old-man delivery, monosyllabic
    // tendencies, doesn't push back when the player asks for less.
    //
    // Lore beats locked in: the Salthaven → Coeur de Vie eastern trade
    // route confirmed by omission ("the big catch goes east from
    // Salthaven. We feed ourselves."), and his own forty-years-from-
    // Salthaven backstory as a soft echo of the Aelflin/Áine sister-beat
    // structure (no payoff; just sits as register).
    {x:35, z:22, name:'Fionn', role:'Fisherman', ico:'\ud83c\udfa3', bCol:0x6e6864, sCol:0x988a76,
      greeting:[
        "Tide brought you in. Tide will take you back.",
        "Good crossing? It was a fair one. We have had worse this season.",
        "Mind the rope on the path. I have been meaning to coil it for a week.",
      ],
      topics:[
        {label:'Browse your wares.', trade:true},
        {label:'You fish from here?',
          response:"From the rocks on the west side, mostly. Strait is too rough most days for the small boats \u2014 the ferry goes out only when the tide is fully out, and that is not many hours. The big catch goes east from Salthaven. We feed ourselves. Sometimes a little extra to trade with Carraig Mór for stone-work."},
        {label:"What's it like to live here?",
          response:"Quiet. Wet. The kind of quiet you have to grow into. The rock is not a place you arrive at and stay \u2014 most who come stop coming back. The ones who stay were born here. I was not. I came up from Salthaven forty years ago. I have stopped explaining why."},
        {label:'Goodbye.', bye:true},
      ]},
  ],
  gates:[
    // v61d7: north gate back to Carraig Mór. Reframed v61ew: ferry, not
    // causeway. Tide guard unchanged. v61ey: noFence:true added so the
    // ferry boat is the only visible affordance at the dock end (matching
    // Carraig Mór's south-side convention).
    {x:25, z:3, targetZone:'carraig_mor', spawnX:30, spawnZ:55, spawnYaw:0, label:'Carraig Mór', guard:'tide', noFence:true},
  ],
  // Per-building exterior dressing — windows, signs, type-keyed props.
  decorateFn:genericVillageDecorate,
  // ── Inis Rua's bespoke detail — north dock, the Mouth, scattered loose stones ──
  // Three structures the village builder doesn't supply:
  //   • North-side ocean + dock + moored ferry boat (mirror of Carraig
  //     Mór's south-side dock; receiving end of the same ferry).
  //   • The Mouth — sea-cave dungeon entrance carved into the south cliff.
  //     Examinable, NOT walkable as a dungeon yet (per session 38 design
  //     call). The cliff itself is a built stone wall; the cave is a
  //     dark archway in it; foam at the base reads as "tide working at it."
  //   • Scattered loose stones across the rock for "this is rock, not
  //     stone-themed dirt" texture (Carraig Mór precedent).
  detailFn:function(sc, sol, getY){
    // ── North-side ocean + dock + moored ferry (mirror of Carraig Mór) ───
    // Symmetric with Carraig Mór's south-side ferry. The water stretches
    // NORTH (toward Carraig Mór across the strait). Player arriving from
    // the ferry spawns at (25, 5) facing yaw=0 (south, into the village).
    //
    // Positions (zone is 60×60, gate at (25, 3), spawn at (25, 5)):
    //   Dock spine: x:25, z:7 → z:-4  (extends north past zone edge)
    //   Ferry boat: x:25, z:-4 (moored at the seaward / strait end)
    //   Water mesh: centered at (25, -10), 80u wide × 30u deep
    //
    // Note the inverted Z direction relative to Carraig Mór: there the
    // dock extended south (positive Z); here it extends north (negative
    // Z, toward the strait between the islands).

    // Water — wide blue-grey transparent plane filling the northward view.
    const waterMat=new THREE.MeshLambertMaterial({color:0x4a6a78, transparent:true, opacity:0.85});
    const waterGeom=new THREE.PlaneGeometry(80, 30);
    const water=new THREE.Mesh(waterGeom, waterMat);
    water.rotation.x=-Math.PI/2;
    const _seawardY = getY(25, 4);  // ground height at north edge of zone
    water.position.set(25, _seawardY - 0.4, -10);
    sc.add(water);

    // Dock — wooden plank pier extending north from the village out over
    // the water. The gate trigger at (25, 3) sits mid-dock. Player walks
    // from the dock's southern (shoreward) end toward the boat moored at
    // the northern (seaward) end.
    const dockPlankMat=new THREE.MeshLambertMaterial({color:0x5a4028});
    const dockBaseY=getY(25, 5);  // shoreward end height
    // Spine: 1.6u wide × 11u long, runs from z:7 (just inside the zone)
    // to z:-4 (past the zone edge into the strait).
    const dock=new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 11), dockPlankMat);
    dock.position.set(25, dockBaseY+0.05, 1.5);
    sc.add(dock);
    // Pilings beneath the dock at intervals — 4 pairs along the length.
    [6, 3, 0, -3].forEach(pz=>{
      [-0.7, 0.7].forEach(px=>{
        const piling=new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.20, 1.8, 8), dockPlankMat);
        piling.position.set(25+px, dockBaseY-0.8, pz);
        sc.add(piling);
      });
    });
    // Two small mooring posts at the seaward (northern) end, flanking the
    // boat. Different position from Carraig Mór's south-end mooring posts;
    // here they sit at the negative-Z end.
    [-0.55, 0.55].forEach(px=>{
      const mooring=new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.85, 8), dockPlankMat);
      mooring.position.set(25+px, dockBaseY+0.42, -3.6);
      sc.add(mooring);
    });
    // Fionn's "rope on the path" he hasn't coiled — slight character beat
    // matching his greeting line. A loose tangle near the dock's village end.
    const ropeC=new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 4, 10), new THREE.MeshLambertMaterial({color:0xa89070}));
    ropeC.rotation.x=Math.PI/2;
    ropeC.rotation.z=0.3; // tilted; not coiled neatly
    ropeC.position.set(25-0.6, dockBaseY+0.18, 5.5);
    sc.add(ropeC);

    // Ferry boat — moored at the seaward end. Same shape and scale as
    // Carraig Mór's, since canonically it IS the same boat (one ferry,
    // not two). The boat is sometimes here, sometimes there; either way
    // the player sees it at whichever end they're standing on.
    const boatY = _seawardY - 0.15;
    // S218 — the ferry is the harbours' clinker boat (S168's bake, one of its four paints), lying along x where the old
    // half-sphere hull lay, scaled to its 4.8 length (the boat is 6)
    const boatHull=new THREE.Mesh(WORLD.boatBake(2).geo, WORLD.SHIP_MAT);
    boatHull.scale.setScalar(.8);boatHull.rotation.y=Math.PI/2;boatHull.castShadow=true;
    boatHull.position.set(25, boatY+0.12, -5.1);
    sc.add(boatHull);
    const tieMat=new THREE.MeshLambertMaterial({color:0xb09870});
    const tie=new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 5), tieMat);
    tie.rotation.z=Math.PI/2.4;
    tie.position.set(25+0.4, boatY+0.5, -3.8);
    sc.add(tie);
    sol.push({cx:25, cz:-4, rx:2.4, rz:1.0});

    // ── The Mouth — sea-cave dungeon entrance at the south cliff ─────────
    // Lore-canonical name: Béal an Domhain ("the world's mouth"). Carved
    // into a tall stone cliff face at the south edge of the island. The
    // ground slopes UP toward the cliff (terrainSlope:'N',amount:2.5),
    // so the cliff base sits ~2.5u above the dock height. The cliff itself
    // is a ~5u-tall stone wall above that, blocking line-of-sight to
    // anything past the south zone edge.
    //
    // The cave is a low wide arch in the cliff face. Black interior. Foam
    // at the base reads as "tide working at it." Sol-blocked: player can
    // approach but not pass through. Examination prompt fires from in
    // front of the arch — see THE_MOUTH_EXAMINE handler below the spec.
    const mouthX=28, mouthZ=54;
    const mouthY=getY(mouthX, mouthZ);
    const cliffMat=new THREE.MeshLambertMaterial({color:0x554c46});
    const cliffDarkMat=new THREE.MeshLambertMaterial({color:0x3a342e});

    // Cliff face — a tall stone wall stretching across the southern edge
    // of the village, broken only by the Mouth itself. Three segments:
    // west-of-mouth, east-of-mouth, and a top piece spanning the arch.
    // West segment: covers x:8 to x:24 (16u wide).
    const cliffW=new THREE.Mesh(new THREE.BoxGeometry(16, 5.5, 2.0), cliffMat);
    cliffW.position.set(16, mouthY+2.75, 56);
    sc.add(cliffW);
    sol.push({cx:16, cz:56, rx:8, rz:1.0});
    // East segment: covers x:32 to x:54 (22u wide).
    const cliffE=new THREE.Mesh(new THREE.BoxGeometry(22, 5.5, 2.0), cliffMat);
    cliffE.position.set(43, mouthY+2.75, 56);
    sc.add(cliffE);
    sol.push({cx:43, cz:56, rx:11, rz:1.0});
    // Top span — the rock above the Mouth's arch. Bridges the 8u arch
    // opening at x:24 to x:32, sitting atop the arch.
    const cliffTop=new THREE.Mesh(new THREE.BoxGeometry(8, 2.0, 2.0), cliffMat);
    cliffTop.position.set(28, mouthY+4.5, 56);
    sc.add(cliffTop);
    // (No sol entry on the top span — player can never reach Y high
    // enough to interact with it; saves a collision check.)

    // The Mouth itself — the dark archway. Built as a recessed box of
    // near-black material set behind the gap in the cliff segments, so
    // the player sees a dark cavity rather than a hole through the cliff
    // to the skybox. The recess is ~3u deep, giving the impression of
    // a cave entrance that goes back into the rock.
    const mouthInside=new THREE.Mesh(new THREE.BoxGeometry(7.5, 3.5, 0.5), cliffDarkMat);
    mouthInside.position.set(mouthX, mouthY+1.75, 57.4);
    sc.add(mouthInside);
    // Side walls of the recess — angled stone, reading as the cave walls.
    [-3.5, 3.5].forEach(dx=>{
      const sideWall=new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.5, 1.4), cliffMat);
      sideWall.position.set(mouthX+dx, mouthY+1.75, 56.7);
      sc.add(sideWall);
      sol.push({cx:mouthX+dx, cz:56.7, rx:0.25, rz:0.7});
    });
    // Roof of the recess — slight overhang of darker stone.
    const mouthRoof=new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 1.4), cliffDarkMat);
    mouthRoof.position.set(mouthX, mouthY+3.6, 56.7);
    sc.add(mouthRoof);

    // Foam at the cave base — small irregular pale-blue-white clusters,
    // simulating the surf working at the rock. Reads as "tide-active"
    // even when the tide is out (the Mouth is at the high-water line).
    const foamMat=new THREE.MeshLambertMaterial({color:0xc8d8e0, transparent:true, opacity:0.85});
    [[mouthX-2.5, 56], [mouthX-0.8, 55.6], [mouthX+0.6, 56], [mouthX+2.4, 55.7],
     [mouthX-1.6, 55.4], [mouthX+1.8, 55.4]].forEach(([fx,fz])=>{
      const r=0.22+Math.random()*0.18;
      const foam=new THREE.Mesh(new THREE.SphereGeometry(r, 5, 4), foamMat);
      foam.scale.set(1, 0.4, 1);
      foam.position.set(fx, mouthY+0.1, fz);
      sc.add(foam);
    });

    // The Mouth examine trigger. Sol-blocked already by the side-wall
    // entries above; the examine prompt is registered as a generic
    // examine point keyed by zoneId + tag. The handler in the overworld
    // tick reads the canonical text — placed below in EXAMINE_POINTS for
    // engine-wide registration. (See EXAMINE_POINTS.inis_rua_mouth.)
    // Intentionally no sol entry here — the side walls block passage;
    // we want the player to be able to stand directly in front of the
    // arch when reading.

    // ── Scattered loose stones across the rock ──────────────────────────
    // Same recipe as Carraig Mór — small weathered boulders at irregular
    // positions, away from buildings, paths, and the dock corridor.
    const looseMat=new THREE.MeshLambertMaterial({color:0x6e6864});
    [[6,30],[52,28],[8,46],[50,42],[18,52],[44,52],[6,12],[54,8]].forEach(([sx,sz])=>{
      const sty=getY(sx,sz);
      const r=0.7+Math.random()*0.6;
      const stone=new THREE.Mesh(new THREE.SphereGeometry(r, 6, 4), looseMat);
      stone.scale.set(1, 0.55+Math.random()*0.2, 1);
      stone.position.set(sx, sty+r*0.45, sz);
      stone.rotation.y=Math.random()*Math.PI*2;
      sc.add(stone);
      sol.push({cx:sx, cz:sz, rx:r*0.7, rz:r*0.7});
    });
  },
});

// ════════════════════════════════════════════════════════════════
// v61e — PLACEHOLDER ZONES (Act II map expansion)
// ════════════════════════════════════════════════════════════════
// Three corridors radiating out of Ironhaven:
//   1. Northern foothills: Ironhaven → Northern Road → La Grise →
//      Foothill Track → Colmán's Rest → Mountain Pass → Mur Pierre
//   2. Eastern royale network: Ironhaven → La Route Royale West →
//      Vieux Marché → {La Route Royale South | Dunmore West Road} →
//      Dunmore → Coastal Road North → Portclare → Capital Road →
//      Coeur de Vie
//   3. The Hollowed Wastes (branching south off Bealach Central):
//      hermit_camp, caer_uaigneach, and The Ashfeld as sub-zones.
// All zones are live and walkable at placeholder fidelity.

// ─── Northern foothills ───────────────────────────────────────────
registerPlaceholderZone({
  id:'northern_road', kind:'wilderness', displayName:'⛰️ The Northern Road',
  region:'foothills',
  // v61f16: size 90 → 200 to host Hollow Gate ruined_gatehouse fort. Road
  // realigned to span the new zone (x=100 spine instead of x=45; runs full
  // N-S length). Adjacent zone spawn coords updated to match.
  musicTrack:'road', size:200, seed:7013, biome:'plains',
  skyCol:0xa0b8d0, fogColor:0x9eb098, fogDensity:0.010,
  pathWaypoints:[{x:100,z:5},{x:100,z:195}],
  centerMarker:{title:'The Northern Road', text:'North from Ironhaven into the foothills. Traffic thins quickly. La Grise is the last settlement before the Grise becomes impassable. A road-stone halfway up marks Mountain Approach — a waypoint, not a village. West of the road the ruin of an old gatehouse stands at half-strength — one tower fallen, one still keeping watch. They call it Hollow Gate.'},
  // v61f16: portalZone enables Hollow Gate fort_door portal to spawn.
  portalZone:'northern_road',
  gates:[
    // v61el: Both gates flagged guard:'commission' for full zone isolation.
    // Belt-and-suspenders to the Ironhaven.N → northern_road guard.
    // v61f16: gates moved to road spine at x=100; z values updated for 200u zone.
    {x:100, z:3,   targetZone:'la_grise',  spawnX:30, spawnZ:55, spawnYaw:0,       label:'La Grise',  guard:'commission'},
    {x:100, z:197, targetZone:'ironhaven', spawnX:100, spawnZ:50, spawnYaw:Math.PI, label:'Ironhaven', guard:'commission'},
  ],
  // v61g5: positions recalibrated for the 2× scale + 24u perimeter.
  // Fort door at (60, 76); gate showpiece at z=100. Two sentinels outside
  // south of gate on the path approach, two inside the courtyard.
  enemies:[
    {name:'Bandit', pos:[[95, 115], [82, 112], [60, 92], [56, 88]]},
  ],
  detailFn:function(sc, sol, getY){
    // ── Side path: road (x=100) → gatehouse door (60, 100) ───────────
    // Branch off the N-S road at (100, 110), sweep west to just south of
    // the door (door is at p.z - 0.7 ≈ 99.3, towers at z ≈ 99.68; safe
    // landing zone is z > 103).
    const pathMat = new THREE.MeshLambertMaterial({color:0x6a5232});
    function mkPathSeg(x1, z1, x2, z2, w){
      const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
      if(len < 0.1) return;
      const segments = Math.max(1, Math.ceil(len / 2.5));
      for(let i=0; i<segments; i++){
        const t0 = i / segments, t1 = (i + 1) / segments;
        const tm = (t0 + t1) / 2;
        const cx = x1 + dx * tm, cz = z1 + dz * tm;
        const segLen = len / segments;
        const ang = Math.atan2(dx, dz);
        const p = new THREE.Mesh(new THREE.PlaneGeometry(w, segLen + 0.05), pathMat);
        p.rotation.x = -Math.PI/2;
        p.rotation.z = ang;
        p.position.set(cx, getY(cx, cz) + 0.02, cz);
        sc.add(p);
      }
    }
    mkPathSeg(100, 112, 85, 110, 1.4);
    mkPathSeg(85, 110, 65, 105, 1.4);
  },
});
registerPlaceholderZone({
  id:'la_grise', kind:'village', displayName:'⛏️ La Grise',
  region:'foothills',
  musicTrack:'village', size:60, seed:7014,
  skyCol:0x90a4b8, fogColor:0x888478, fogDensity:0.012,
  centerX:30, centerZ:30, villageR:18, buildings:[],
  centerMarker:{title:'La Grise', text:'French: The Grey One. Mining camp that became permanent. Ore near dungeon shafts has strange magnetic properties.'},
  gates:[
    // South = back to Northern Road, West = Foothill Track to Colmán's Rest.
    // v61f16: northern_road bumped 90 → 200; road now at x=100 spine; spawn updated.
    {x:30, z:57, targetZone:'northern_road',  spawnX:100, spawnZ:8,  spawnYaw:Math.PI,     label:'The Northern Road'},
    {x:3,  z:30, targetZone:'foothill_track', spawnX:77, spawnZ:30, spawnYaw:Math.PI/2,   label:'The Foothill Track'},
  ],
});
registerPlaceholderZone({
  id:'foothill_track', kind:'wilderness', displayName:'🌾 The Foothill Track',
  region:'foothills',
  musicTrack:'road', size:80, seed:7015, biome:'plains',
  skyCol:0x9eb2c0, fogColor:0xa0a888, fogDensity:0.010,
  pathWaypoints:[{x:5,z:30},{x:75,z:30}],
  centerMarker:{title:'The Foothill Track', text:'Rough track between La Grise and Colmán\'s Rest. The farming land around Colmán\'s Rest is incongruously lush.'},
  gates:[
    // East = La Grise, West = Colmán's Rest.
    {x:77, z:30, targetZone:'la_grise',      spawnX:7,  spawnZ:30, spawnYaw:-Math.PI/2, label:'La Grise'},
    {x:3,  z:30, targetZone:'colmans_rest',  spawnX:57, spawnZ:30, spawnYaw:Math.PI/2,  label:'Colmán\'s Rest'},
  ],
});
registerPlaceholderZone({
  id:'colmans_rest', kind:'village', displayName:'🌾 Colmán\'s Rest',
  region:'foothills',
  musicTrack:'village', size:60, seed:7016,
  skyCol:0xa8bcc8, fogColor:0xa8b098, fogDensity:0.010,
  centerX:30, centerZ:30, villageR:18, buildings:[],
  centerMarker:{title:'Colmán\'s Rest', text:'Named after a traveler who died here in the first winter. His descendants never left. A farming village that ended up in the Grise almost by accident. The soil grows crops unusually well.'},
  gates:[
    // East = Foothill Track back to La Grise, West = Mountain Pass to Mur Pierre.
    {x:57, z:30, targetZone:'foothill_track', spawnX:7,  spawnZ:30, spawnYaw:-Math.PI/2, label:'The Foothill Track'},
    {x:3,  z:30, targetZone:'mountain_pass',  spawnX:192, spawnZ:100, spawnYaw:Math.PI/2,  label:'The Mountain Pass'},
  ],
});
registerPlaceholderZone({
  id:'mountain_pass', kind:'wilderness', displayName:'⛰️ The Mountain Pass',
  region:'foothills',
  // v61f16: size 80 → 200 to host the Wind Cloister monastery fort. Road
  // realigned to span the new zone (z=100 spine instead of z=30). Adjacent
  // zone spawn coords updated to match (colmans_rest W, mur_pierre E).
  musicTrack:'road', size:200, seed:7017, biome:'forest',
  skyCol:0xa0b0c8, fogColor:0xc0c6cc, fogDensity:0.014,
  pathWaypoints:[{x:5,z:100},{x:195,z:100}],
  centerMarker:{title:'The Mountain Pass', text:'Pass between Colmán\'s Rest and Mur Pierre. Impassable in winter. Even in summer the wind comes with intent. North of the road a low stone wall and a single standing cross — what the high country calls the Wind Cloister.'},
  // v61f16: portalZone enables The Wind Cloister fort_door portal to spawn.
  portalZone:'mountain_pass',
  gates:[
    {x:197, z:100, targetZone:'colmans_rest', spawnX:7,   spawnZ:30, spawnYaw:-Math.PI/2, label:'Colmán\'s Rest'},
    {x:3,   z:100, targetZone:'mur_pierre',   spawnX:192, spawnZ:100, spawnYaw:Math.PI/2, label:'Mur Pierre'},
  ],
  // v61f16: monastery exterior places extensive geometry around (60, 60).
  // The remnant wall sits at z=59, cross at z=63, pews at z=62.5..65. The
  // player approaches from the south (+Z direction from the door). Two
  // sentinel enemies on the path approach, two inside the courtyard area
  // (between cross and door).
  // v61g5: positions recalibrated for the 2× scale + 24u perimeter.
  // Fort door at (60, 36); gate showpiece at z=60. Two phantoms outside
  // south of gate, two inside the courtyard.
  enemies:[
    {name:'Phantom', pos:[[60, 78], [64, 75], [60, 52], [56, 48]]},
  ],
  detailFn:function(sc, sol, getY){
    // ── Side path: road (z=100) → monastery (60, 60) ─────────────────
    // Branch off the E-W road at x=60, sweep north to z≈68 (a few units
    // south of the courtyard pews). The path is short to the road
    // because this monastery sits much closer than e.g. Greywatch's
    // long western sweep — fits the "abandoned but visible from the
    // road" register.
    const pathMat = new THREE.MeshLambertMaterial({color:0x6a6258});
    function mkPathSeg(x1, z1, x2, z2, w){
      const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
      if(len < 0.1) return;
      const segments = Math.max(1, Math.ceil(len / 2.5));
      for(let i=0; i<segments; i++){
        const t0 = i / segments, t1 = (i + 1) / segments;
        const tm = (t0 + t1) / 2;
        const cx = x1 + dx * tm, cz = z1 + dz * tm;
        const segLen = len / segments;
        const ang = Math.atan2(dx, dz);
        const p = new THREE.Mesh(new THREE.PlaneGeometry(w, segLen + 0.05), pathMat);
        p.rotation.x = -Math.PI/2;
        p.rotation.z = ang;
        p.position.set(cx, getY(cx, cz) + 0.02, cz);
        sc.add(p);
      }
    }
    mkPathSeg(60, 96, 60, 80, 1.4);
    mkPathSeg(60, 80, 60, 68, 1.4);
  },
});
registerPlaceholderZone({
  id:'mur_pierre', kind:'town', displayName:'🏰 Mur Pierre',
  region:'foothills',
  musicTrack:'town', size:200, seed:7018,
  skyCol:0x8098a8, fogColor:0xa0a8b0, fogDensity:0.010,
  fortressX:100, fortressZ:100, wallExtent:28,
  centerMarker:{title:'Mur Pierre', text:'Pierre\'s Wall — or Wall of Stone. French garrison built by Coeur de Vie and then abandoned to fend for itself. Tough, self-reliant, deeply resentful of the capital.'},
  gates:[
    // High-X (east) edge → Mountain Pass back to Colmán's Rest.
    // v61f16: mountain_pass bumped 80 → 200; road now at z=100; spawn updated.
    {x:197, z:100, targetZone:'mountain_pass', spawnX:7, spawnZ:100, spawnYaw:-Math.PI/2, label:'The Mountain Pass'},
  ],
});

// ─── Eastern royale network ───────────────────────────────────────
registerPlaceholderZone({
  id:'la_route_royale_west', kind:'wilderness', displayName:'🛣️ La Route Royale — West',
  region:'royale',
  // v61f16: size 80 → 200 to host Pellam's Hold keep fort. Road realigned
  // to span the new zone (z=100 spine instead of z=40). Adjacent zone
  // spawn coords updated to match (ironhaven E, vieux_marche W).
  musicTrack:'road', size:200, seed:7019, biome:'plains',
  skyCol:0xa8c0d4, fogColor:0xa0b88c, fogDensity:0.008,
  pathWaypoints:[{x:5,z:100},{x:195,z:100}],
  centerMarker:{title:'La Route Royale — West', text:'Western La Route Royale between Ironhaven and Vieux Marché. Heavy merchant traffic. Only road with occasional guard patrols. North of the road a single squat block of stone — Pellam\'s Hold, locals say, after a name nobody remembers.'},
  // v61f16: portalZone enables Pellam's Hold fort_door portal to spawn.
  portalZone:'la_route_royale_west',
  gates:[
    // East = Vieux Marché, West = back to Ironhaven.
    // v61f16: gates moved to road spine at z=100. Adjacent zone spawn
    // coords updated to match.
    {x:197, z:100, targetZone:'vieux_marche', spawnX:64,  spawnZ:35, spawnYaw:-Math.PI/2, label:'Vieux Marché'},
    {x:3,   z:100, targetZone:'ironhaven',    spawnX:50,  spawnZ:100, spawnYaw:Math.PI/2, label:'Ironhaven'},
  ],
  // v61g5: positions recalibrated for the 2× scale + 24u perimeter.
  // Fort door at (100, 36); gate showpiece at z=60. Two outside south of
  // gate on the side-path approach, two inside the courtyard.
  enemies:[
    {name:'Bandit', pos:[[100, 80], [104, 78], [100, 52], [96, 48]]},
  ],
  detailFn:function(sc, sol, getY){
    // ── Side path: road (z=100) → keep door (100, 60) ─────────────────
    // Branch off the E-W road at x=100, sweep north to just south of the
    // door (door is at p.z - 0.7 ≈ z=59).
    const pathMat = new THREE.MeshLambertMaterial({color:0x7a6648});
    function mkPathSeg(x1, z1, x2, z2, w){
      const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
      if(len < 0.1) return;
      const segments = Math.max(1, Math.ceil(len / 2.5));
      for(let i=0; i<segments; i++){
        const t0 = i / segments, t1 = (i + 1) / segments;
        const tm = (t0 + t1) / 2;
        const cx = x1 + dx * tm, cz = z1 + dz * tm;
        const segLen = len / segments;
        const ang = Math.atan2(dx, dz);
        const p = new THREE.Mesh(new THREE.PlaneGeometry(w, segLen + 0.05), pathMat);
        p.rotation.x = -Math.PI/2;
        p.rotation.z = ang;
        p.position.set(cx, getY(cx, cz) + 0.02, cz);
        sc.add(p);
      }
    }
    mkPathSeg(100, 96, 100, 82, 1.5);
    mkPathSeg(100, 82, 100, 63, 1.5);
  },
});
registerPlaceholderZone({
  id:'vieux_marche', kind:'village', displayName:'🛒 Vieux Marché',
  region:'royale',
  musicTrack:'village', size:70, seed:7020,
  skyCol:0xa0bccc, fogColor:0xa0b494, fogDensity:0.009,
  centerX:35, centerZ:35, villageR:22, buildings:[],
  centerMarker:{title:'Vieux Marché', text:'French: Old Market. Predates La Route Royale — the road was built to reach it. The market square has a gallows that hasn\'t been used in twenty years but hasn\'t been taken down.'},
  gates:[
    // v61eh: gate set restructured for the spec-matching grid. Vieux
    // Marché is at (5,1). Its three neighbors are La Porte Grise (W, 4,1),
    // Ironhaven (E, 6,1), and Dunmore (S, 5,2). The la_route_royale_west
    // corridor moved from W → E (Ironhaven is now east of Vieux Marché on
    // the new map, not west). New W = direct gate to La Porte Grise.
    {x:3,  z:35, targetZone:'la_porte_grise',       spawnX:35, spawnZ:18, spawnYaw:Math.PI/2,  label:'La Porte Grise'},
    {x:67, z:35, targetZone:'la_route_royale_west', spawnX:7,  spawnZ:100, spawnYaw:-Math.PI/2, label:'La Route Royale — West'},
    {x:35, z:67, targetZone:'la_route_royale_south', spawnX:40, spawnZ:7,  spawnYaw:Math.PI,    label:'La Route Royale — South'},
  ],
});
registerPlaceholderZone({
  id:'la_route_royale_south', kind:'wilderness', displayName:'🛣️ La Route Royale — South',
  region:'royale',
  musicTrack:'road', size:150, seed:7021, biome:'plains',
  skyCol:0xa0b8c8, fogColor:0xa4b088, fogDensity:0.009,
  pathWaypoints:[{x:40,z:5},{x:40,z:145}],
  centerMarker:{title:'La Route Royale — South', text:'South from Vieux Marché to Dunmore. Hillier, more exposed. Dunmore\'s walls visible from the last ridge.'},
  gates:[
    {x:40, z:3,   targetZone:'vieux_marche', spawnX:35, spawnZ:64, spawnYaw:0,       label:'Vieux Marché'},
    {x:40, z:147, targetZone:'dunmore',      spawnX:100, spawnZ:10, spawnYaw:Math.PI, label:'Dunmore'},
  ],
});
// v61d7: dunmore_west_road placeholder zone removed (was a duplicate of la_route_royale_south).
registerPlaceholderZone({
  id:'dunmore', kind:'town', displayName:'🏰 Dunmore',
  region:'royale',
  musicTrack:'town', size:200, seed:7023,
  skyCol:0x7090a0, fogColor:0x80a0b0, fogDensity:0.008,
  fortressX:100, fortressZ:100, wallExtent:32,
  centerMarker:{title:'Dunmore', text:'Irish: Great Fort. Fortified town commanding the crossroads between La Route Royale, the coastal road, and the Wastes path. Older than Ironhaven and less polished.'},
  gates:[
    // v61eh: dropped S gate (wastes_east → caer_uaigneach). Per spec layout,
    // the Wastes path now exits east into Portclare via wastes_east, not into
    // Dunmore. Dunmore is now a two-way junction (was three-way): N to
    // Vieux Marché on La Route Royale, E to Portclare on the coastal road.
    // N = La Route Royale South (to Vieux Marché),
    // E = Coastal Road North (to Portclare).
    {x:100, z:3,   targetZone:'la_route_royale_south', spawnX:40,  spawnZ:145, spawnYaw:0,         label:'La Route Royale — South'},
    {x:197, z:100, targetZone:'coastal_road_north',    spawnX:7,   spawnZ:40,  spawnYaw:-Math.PI/2, label:'The Coastal Road North'},
  ],
});

// ─── Coastal reach (Dunmore → Portclare → Coeur de Vie) ───────────
registerPlaceholderZone({
  id:'coastal_road_north', kind:'wilderness', displayName:'🌊 The Coastal Road North',
  region:'royale',
  musicTrack:'road', size:160, seed:7024, biome:'plains',
  skyCol:0xb8c8d4, fogColor:0xb0b4a0, fogDensity:0.011,
  pathWaypoints:[{x:5,z:40},{x:155,z:40}],
  centerMarker:{title:'The Coastal Road North', text:'North from Dunmore to Portclare along the eastern coast. The sea is always visible. Inland of the road two low rings of grassed earth — older than any village hereabouts. Locals call it the Old Mound.'},
  // v61f16: portalZone enables The Old Mound fort_door portal to spawn.
  portalZone:'coastal_road_north',
  gates:[
    {x:3,   z:40, targetZone:'dunmore',   spawnX:190, spawnZ:100, spawnYaw:Math.PI/2,  label:'Dunmore'},
    {x:157, z:40, targetZone:'portclare', spawnX:7,   spawnZ:100, spawnYaw:-Math.PI/2, label:'Portclare'},
  ],
  // v61g5d: Old Mound fort.z bumped 20→30 (gate at z=54, 14u south of
  // road at z=40 — was 4u in v61g5c, too close, berm overlapped road).
  enemies:[
    {name:'Skeleton', pos:[[80, 70], [83, 68], [80, 46], [76, 42]]},
  ],
  detailFn:function(sc, sol, getY){
    // ── Side path: road (z=40) → mound gate (80, 54) ─────────────────
    // Branch off the E-W road just south of road shoulder (z=44), run
    // south ~8u to land 2u south of the gate.
    const pathMat = new THREE.MeshLambertMaterial({color:0x6a5840});
    function mkPathSeg(x1, z1, x2, z2, w){
      const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
      if(len < 0.1) return;
      const segments = Math.max(1, Math.ceil(len / 2.5));
      for(let i=0; i<segments; i++){
        const t0 = i / segments, t1 = (i + 1) / segments;
        const tm = (t0 + t1) / 2;
        const cx = x1 + dx * tm, cz = z1 + dz * tm;
        const segLen = len / segments;
        const ang = Math.atan2(dx, dz);
        const p = new THREE.Mesh(new THREE.PlaneGeometry(w, segLen + 0.05), pathMat);
        p.rotation.x = -Math.PI/2;
        p.rotation.z = ang;
        p.position.set(cx, getY(cx, cz) + 0.02, cz);
        sc.add(p);
      }
    }
    mkPathSeg(80, 44, 80, 50, 1.4);
    mkPathSeg(80, 50, 80, 56, 1.4);
  },
});
registerPlaceholderZone({
  id:'portclare', kind:'town', displayName:'⚓ Portclare',
  region:'royale',
  musicTrack:'town', size:180, seed:7025,
  skyCol:0xa8c0d4, fogColor:0xa8b4a8, fogDensity:0.012,
  fortressX:90, fortressZ:90, wallExtent:26,
  centerMarker:{title:'Portclare', text:'Anglo-Saxon/Irish: Port of the Plain. Mid-sized fortified harbor between Dunmore and Coeur de Vie. Has the air of a place that used to matter more.'},
  gates:[
    // v61eh: gate set restructured for the spec-matching grid. Portclare
    // is at (6,2). Its four neighbors are Ironhaven (N, 6,1), Coeur de
    // Vie (E, 7,2), Caer Uaigneach (S via wastes_east, 6,5 — the long
    // Wastes corridor), and Dunmore (W via coastal road, 5,2). Capital
    // Road moved N → E (Coeur de Vie is now east, not north). New N gate
    // is direct to Ironhaven (one step north on the new map). New S gate
    // routes through the repurposed wastes_east corridor to Caer Uaigneach.
    // W (x=3)   → coastal_road_north → Dunmore [kept]
    // N (z=3)   → ironhaven DIRECT [new edge per spec; commission, royal network]
    // E (x=177) → capital_road → Coeur de Vie [moved from N (z=3)]
    // S (z=177) → wastes_east → Caer Uaigneach [moved from Dunmore; same corridor zone, repurposed]
    {x:3,   z:100, targetZone:'coastal_road_north', spawnX:155, spawnZ:40,  spawnYaw:Math.PI/2, label:'The Coastal Road North'},
    // v61ej: Ironhaven spawn was {spawnX:100, spawnZ:190, spawnYaw:Math.PI}, which
    // landed the player at z=190 (Ironhaven's far-south perimeter, in the outer-ring
    // forest beyond the fortress's south wall at z=133) facing south — i.e., away
    // from the town center at z=100. Yaw convention per line 3335: yaw=0 → -Z (N),
    // yaw=π → +Z (S). Player south of fortress center needs yaw=0 to face N
    // toward the fortress wall and town interior. Bumped spawnZ:190 → spawnZ:150
    // so the player isn't pressed against the perimeter hedge (matches the v61ei
    // pattern: ~17 units from the wall, inside the gate approach corridor where
    // _nearApproach excludes trees).
    // v61el: N → ironhaven was guard:'commission' (mirror of Ironhaven.S
    // pre-v61el). Both ends unlocked together — Portclare is on the
    // canonical Act I path, ironhaven is the Q3-Q6 hub. See IRONHAVEN_CONFIG
    // line 11188 for the topology call.
    {x:90,  z:3,   targetZone:'ironhaven',          spawnX:100, spawnZ:150, spawnYaw:0,         label:'Ironhaven'},
    // v61el: E → capital_road newly guard:'commission'. Per design, Coeur de
    // Vie is the ACT III reveal (not Q7) — locking the capital_road corridor
    // at both ends keeps Coeur de Vie unreachable until that act-progression
    // beat lands. Currently bound to the same `worldState.commissioned`
    // single-bit guard as the other commission locks; if Act III needs a
    // different unlock condition (a separate progression flag, a key item,
    // a Caldric-grants-an-audience beat), this guard becomes the natural
    // hookup point — swap 'commission' for a new guard value and add the
    // case to the gate-interact handler at line ~12722.
    {x:177, z:100, targetZone:'capital_road',       spawnX:45,  spawnZ:145, spawnYaw:0,         label:'The Capital Road',       guard:'commission'},
    // v61ek: Portclare S → wastes_east spawnYaw fix. Was spawnYaw:Math.PI/2
    // (faces +X / east), which pointed the player TOWARD Portclare's z=170
    // exit and AWAY from the path direction. Per yaw convention (line 3335):
    // 0=N (-Z), π=S (+Z), π/2=E (+X), -π/2=W (-X). Player arrives at
    // wastes_east at the EAST end (x=155, z=40); the path runs east-west at
    // z=40 with the Caer Uaigneach exit at x=3 (the west end). Facing -π/2
    // (west) puts the player looking down the path toward the destination
    // — which is the convention this codebase uses everywhere else (the
    // arriving player is oriented along the path of travel, not back at the
    // gate they just came through). Same pattern as the v61ej Portclare.N
    // and Ironhaven.S yaw fixes.
    {x:90,  z:177, targetZone:'wastes_east',        spawnX:155, spawnZ:40,  spawnYaw:-Math.PI/2, label:'The Wastes — East'},
  ],
});
registerPlaceholderZone({
  id:'capital_road', kind:'wilderness', displayName:'🛣️ The Capital Road',
  region:'royale',
  musicTrack:'road', size:150, seed:7026, biome:'plains',
  skyCol:0xb0c8dc, fogColor:0xb0b094, fogDensity:0.008,
  pathWaypoints:[{x:45,z:5},{x:45,z:145}],
  centerMarker:{title:'The Capital Road', text:'Final approach to Coeur de Vie. Road quality improves dramatically — maintained by the capital.'},
  gates:[
    // v61el: Both gates flagged guard:'commission' for full zone isolation.
    // capital_road is the ACT III reveal — Coeur de Vie unlocks at that
    // beat, not Q7. Currently bound to the same `worldState.commissioned`
    // flag as the Q7 unlocks (which means in-engine the capital opens at
    // Q7 too); when the Act III gating beat lands, this guard becomes the
    // hookup point for a separate progression flag. See PORTCLARE_CONFIG
    // E-gate for the matching topology comment.
    // v61eh: Portclare spawn moved spawnX:90,spawnZ:7 → spawnX:174,spawnZ:100
    // (and spawnYaw Math.PI → -Math.PI/2). Portclare's gate to The Capital
    // Road is now its E wall (x=177), not its N wall (z=3) — player
    // returning from the road lands inside the east gate facing west into
    // the town.
    // v61eh: Coeur de Vie spawn moved spawnX:60,spawnZ:115 → spawnX:6,spawnZ:60
    // (and spawnYaw Math.PI → Math.PI/2). Coeur's gate to the road is now
    // its W wall (x=3) — player landing from the road appears just inside
    // the west gate facing east into the city.
    {x:45, z:147, targetZone:'portclare',    spawnX:174, spawnZ:100, spawnYaw:-Math.PI/2, label:'Portclare',    guard:'commission'},
    {x:45, z:3,   targetZone:'coeur_de_vie', spawnX:6,   spawnZ:60,  spawnYaw:Math.PI/2,  label:'Coeur de Vie', guard:'commission'},
  ],
});
registerPlaceholderZone({
  id:'coeur_de_vie', kind:'village', displayName:'👑 Coeur de Vie',
  region:'royale',
  musicTrack:'village', size:120, seed:7027,
  skyCol:0x88a8c8, fogColor:0xa8bcc0, fogDensity:0.008,
  centerX:60, centerZ:60, villageR:40, buildings:[],
  centerMarker:{title:'Coeur de Vie', text:'Heart of Life — the capital\'s name for itself. Coastal, wealthy, self-important, deeply invested in not asking hard questions. The irony of its name — given what is dying at the center of the map — is not lost on Varek. [Placeholder: a proper city primitive is deferred to a later session.]'},
  gates:[
    // v61eh: gate moved from S (z=117) to W (x=3). On the new spec layout
    // Coeur de Vie is at (7,2) and Portclare is at (6,2) — same row, due
    // west. The Capital Road runs east-west between them now (was north-south).
    {x:3, z:60, targetZone:'capital_road', spawnX:45, spawnZ:7, spawnYaw:Math.PI, label:'The Capital Road'},
  ],
});

// ─── The Hollowed Wastes (region) + its zones ──────────────────────
// v61eb: ARCHITECTURAL REFACTOR (revised v61ec). Lore canon (§ The Hollowed
// Wastes) is explicit: "Settlements: None. No roads run through it —
// only the dangerous Wastes Path." Previously `hollowed_wastes` was a
// single hub zone violating this. v61eb split it into wastes_west
// (Bealach approach) and wastes_east (Dunmore approach). v61ec further
// untangles them so each corridor connects exactly two endpoints, and
// the inter-Wastes connections (Cill Beag↔Hermit, Hermit↔Caer) are
// direct settlement-to-settlement gates rather than corridors. This
// matches the locked grid map and resolves cleanly through the gate
// graph without falling through wilderness IDs.
//
// Save migration: characters whose saved zone is 'hollowed_wastes' get
// remapped to 'wastes_west' on load.
//
// v61ek: WASTES_WEST DEPRECATED — UNREACHABLE BUT REGISTERED.
// The post-v61eh canonical Wastes back-door route is:
//   Cill Beag → Hermit's Camp → Caer Uaigneach → wastes_east → Portclare.
// wastes_west's two former endpoints (bealach_central.S, hermit_camp.W)
// were both deleted this ship, so no gate now points at this zone.
// Left registered as harmless dead code: (a) the save migration shim
// at line ~17957 (`hollowed_wastes` → `wastes_west`) keeps a path
// home for any old save still referencing the deleted zone string;
// (b) the zone is in WM_NODES and has discovery state baked into
// existing saves; deleting it would force another migration. Cost is
// one entry in ZONE_BUILDERS that nothing reads. If a future session
// wants a Bealach-side Wastes spur back, this scaffold can be revived
// — but at that point the canonical route will need a redesign too.
registerPlaceholderZone({
  id:'wastes_west', kind:'wilderness', displayName:'🏜️ The Wastes — West',
  region:'wastes',
  musicTrack:'wastes', size:160, seed:7028, biome:'plains',
  skyCol:0x8a8678, fogColor:0x867c6c, fogDensity:0.016,
  pathWaypoints:[{x:5,z:40},{x:155,z:40}],
  centerMarker:{title:'The Wastes — West', text:'The western approach to the Hollowed Wastes. Open ground, no cover. Hermit\'s Camp waits at the edge.'},
  gates:[
    // v61ec: simple two-endpoint corridor. Bealach Central (west) ↔ Hermit's Camp (east).
    // v61ek: kept for return-trip routing in the event a save in this zone
    // loads (gates resolve to nothing on the bealach_central / hermit_camp
    // side now that those gates are gone, but having functional escape gates
    // means the player can at least walk OUT). Both targets exist; both
    // arrival spawns put the player AT the relevant settlement. The trip is
    // one-way: once you leave, you can't come back through here.
    {x:3,   z:40,  targetZone:'bealach_central', spawnX:60,  spawnZ:115, spawnYaw:0,          label:'An Bealach Mór — Central'},
    {x:157, z:40,  targetZone:'hermit_camp',     spawnX:15,  spawnZ:25,  spawnYaw:Math.PI,    label:'Hermit\'s Camp'},
  ],
});
registerPlaceholderZone({
  id:'wastes_east', kind:'wilderness', displayName:'🏜️ The Wastes — East',
  region:'wastes',
  musicTrack:'wastes', size:160, seed:7032, biome:'plains',
  skyCol:0x8a8678, fogColor:0x867c6c, fogDensity:0.016,
  pathWaypoints:[{x:5,z:40},{x:155,z:40}],
  centerMarker:{title:'The Wastes — East', text:'The eastern approach. The ground firms up slowly toward the coast. Portclare\'s harbor lights wait beyond, hours away. South of the road a row of pointed logs juts above the dust — what the locals call The Last Post.'},
  // v61f16: portalZone enables The Last Post fort_door portal to spawn.
  portalZone:'wastes_east',
  gates:[
    // v61eh: corridor repurposed for the spec-matching grid. Per spec, the
    // Wastes path now connects Caer Uaigneach (west end) to PORTCLARE (east
    // end), not Dunmore. The Wastes' canon framing — "no roads run through
    // it, only the dangerous Wastes Path" — is preserved; only the eastern
    // exit-point changed. Pre-Q7 back-door route now reads as: Cill Beag →
    // Hermit's Camp → Caer Uaigneach → wastes_east → Portclare → ... →
    // Coeur de Vie. Same narrative load, slightly different terminus.
    {x:3,   z:40,  targetZone:'caer_uaigneach', spawnX:30,  spawnZ:7,   spawnYaw:Math.PI,    label:'Caer Uaigneach'},
    {x:157, z:40,  targetZone:'portclare',      spawnX:90,  spawnZ:170, spawnYaw:0,          label:'Portclare'},
  ],
  // v61g5d: Last Post fort.z bumped 20→30 (gate at z=54, comfortable
  // road buffer — was 4u in v61g5c, too close).
  enemies:[
    {name:'Bandit', pos:[[78, 70], [83, 68], [80, 46], [76, 42]]},
  ],
  detailFn:function(sc, sol, getY){
    // ── Side path: road (z=40) → palisade gate (80, 54) ──────────────
    const pathMat = new THREE.MeshLambertMaterial({color:0x7a6852});
    function mkPathSeg(x1, z1, x2, z2, w){
      const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
      if(len < 0.1) return;
      const segments = Math.max(1, Math.ceil(len / 2.5));
      for(let i=0; i<segments; i++){
        const t0 = i / segments, t1 = (i + 1) / segments;
        const tm = (t0 + t1) / 2;
        const cx = x1 + dx * tm, cz = z1 + dz * tm;
        const segLen = len / segments;
        const ang = Math.atan2(dx, dz);
        const p = new THREE.Mesh(new THREE.PlaneGeometry(w, segLen + 0.05), pathMat);
        p.rotation.x = -Math.PI/2;
        p.rotation.z = ang;
        p.position.set(cx, getY(cx, cz) + 0.02, cz);
        sc.add(p);
      }
    }
    mkPathSeg(80, 44, 80, 50, 1.4);
    mkPathSeg(80, 50, 80, 56, 1.4);
  },
});
registerPlaceholderZone({
  id:'hermit_camp', kind:'village', displayName:'🔥 Hermit\'s Camp',
  region:'wastes',
  musicTrack:'wastes', size:30, seed:7029,
  skyCol:0x908872, fogColor:0x806c5c, fogDensity:0.014,
  centerX:15, centerZ:15, villageR:10, buildings:[],
  centerMarker:{title:'Hermit\'s Camp', text:'A single figure lives at the edge of the Hollowed Wastes in a camp of salvaged dungeon timber. Has been here longer than anyone alive. Does not give a name. Will trade information for silence.'},
  gates:[
    // v61ec: three gates per locked map. N → Cill Beag (direct, no corridor),
    // E → Caer Uaigneach (direct), W → wastes_west → Bealach Central.
    // v61ek: W gate to wastes_west deleted. The Wastes back-door route now
    // runs Cill Beag → Hermit's Camp → Caer Uaigneach → wastes_east →
    // Portclare. wastes_west's other end was orphaned in bealach_central
    // (also deleted this ship), making the corridor unreachable. Hermit's
    // Camp is now N + E only — pass-through node between Cill Beag and
    // Caer Uaigneach.
    {x:15, z:1.5,  targetZone:'cill_beag',      spawnX:25, spawnZ:45, spawnYaw:Math.PI,    label:'Cill Beag'},
    {x:28.5, z:15, targetZone:'caer_uaigneach', spawnX:3,  spawnZ:30, spawnYaw:-Math.PI/2, label:'Caer Uaigneach'},
  ],
});
registerPlaceholderZone({
  id:'caer_uaigneach', kind:'village', displayName:'💀 Caer Uaigneach',
  region:'wastes',
  musicTrack:'wastes', size:60, seed:7030,
  skyCol:0x786860, fogColor:0x604838, fogDensity:0.018,
  centerX:30, centerZ:30, villageR:18, buildings:[],
  centerMarker:{title:'Caer Uaigneach', text:'Irish: Lonely Fort. A village of 300 fourteen years ago. Something came up from the gate beneath it. Half fled overnight. The other half stayed. Nobody has heard from them in eleven years.'},
  gates:[
    // v61ec: two gates per locked map. W → Hermit's Camp (direct), N → wastes_east → Dunmore.
    {x:1.5, z:30, targetZone:'hermit_camp', spawnX:25,  spawnZ:15, spawnYaw:Math.PI/2,  label:'Hermit\'s Camp'},
    {x:30,  z:3,  targetZone:'wastes_east', spawnX:30,  spawnZ:73, spawnYaw:0,          label:'The Wastes — East'},
  ],
});
registerPlaceholderZone({
  id:'ashfeld', kind:'wilderness', displayName:'⚔️ The Ashfeld',
  region:'ashen',
  musicTrack:'road', size:80, seed:7031, biome:'plains',
  skyCol:0x7a7060, fogColor:0x684f3a, fogDensity:0.015,
  pathWaypoints:[{x:40,z:5},{x:40,z:75}],
  centerMarker:{title:'The Ashfeld', text:'An ancient battlefield where two lords spent their subjects\' lives for causes nobody remembers. The site of the first meeting with Varek. He comes here regularly — there is a worn path through the grass to where he stands.'},
  gates:[
    // v61d7: Ashfeld is now a third zone on the road south from Ashenmoor.
    // North gate → South Road (back toward Ashenmoor).
    // v61ef: east gate → Redwater Ford (was south gate). Per locked map,
    // Redwater Ford sits east of Ashfeld, not south. The gate-as-data
    // system reads the gate's wall and renders the edge from there;
    // moving the gate from z=77 (south wall) to x=77 (east wall) fixes
    // both the in-game player-direction and the map's edge orientation.
    {x:40, z:3,  targetZone:'south_road',    spawnX:40, spawnZ:73, spawnYaw:0,         label:'South Road'},
    {x:77, z:40, targetZone:'redwater_ford', spawnX:5,  spawnZ:25, spawnYaw:-Math.PI/2, label:'Redwater Ford'},
  ],
});
