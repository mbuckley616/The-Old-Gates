
// ══════════════════════════════════════════════════════════════
// WILDERNESS ZONE SYSTEM — buildWildernessZone(cfg)
// ══════════════════════════════════════════════════════════════
//
// Generalization of v60's buildForest(). Produces a square, path-threaded
// wilderness zone with biome-driven visuals (ground color, sky, props),
// arbitrary gates, and a biome-appropriate enemy roster.
//
// cfg schema:
//   id         : string  — zone id (matches activeZoneId & ZONES key)
//   name       : string  — display name (e.g. "The Deepwood Forest")
//   musicTrack : string  — passed to startMusic (currently all 'overworld')
//   biome      : string  — key into BIOME_PROFILES ('forest', 'plains', ...)
//   size       : number  — zone is size×size
//   seed       : number  — heightmap noise seed (deterministic)
//   pathWaypoints : [{x,z}, ...] — polyline for the stone road.
//                  Terrain flattens along the path; props clear away from it.
//                  First point is the "entry" end; last point is the "exit" end.
//   gates      : [{x,z,targetZone,spawnX,spawnZ,spawnYaw,label,rotY?}]
//                  Gate meshes are built at (x,z); interact() uses spawn*.
//   enemies    : [{name,pos:[[x,z],...]}] — spawn table
//   herbSpawns : [{x,z,type}]
//   portalZone : string|null — WORLD_DUNGEONS.zone filter key ('forest' etc.)
//
// Populated at build time (on cfg):
//   scene, sol, gates (runtime), enemies (runtime), npcs, herbs, getY
//
// Deepwood gets special-cased (FOREST_GATES / FOREST_HERBS / _forestTerrainH
// legacy globals) via cfg.legacyAliases hook so activeZoneId==='forest' code
// paths elsewhere keep working without a sweep.

// v61e4: PROP_BUILDERS — regional decorative mesh primitives. Each entry
// is a function (x, z, terrainH, sc, sol) that adds a small static mesh
// or mesh group to the scene at the given position. Walkable props skip
// `sol`; solid props (cairns, walls, milestones, dead trees) push a
// {cx,cz,rx,rz} entry so the player and AI bump into them.
//
// Style notes:
//   - Materials are inlined, not cached. Regional props are scattered
//     sparsely (3-8 per zone), so no perf hotspot to optimize.
//   - Each builder picks small randomization (rotation, slight scale)
//     internally so the scatter doesn't read as a stamped pattern.
//   - Y placement always uses `terrainH(x,z)` so props sit on the
//     terrain rather than floating or sinking.
//
// Prop-type → spoke/region mapping (which builders the spokes use):
//   coastal:   driftwood, rope_coil, seaweed
//   bealach:   cart_wheel, milestone, wheat_stack
//   foothills: stone_cairn, dry_stone_wall, ore_pile
//   royale:    milestone (shared), royal_marker, wayside_shrine
//   wastes:    dead_tree, ash_pile, bone_pile
//   ashen:     broken_blade, cairn_low
const PROP_BUILDERS={

  // ─── COASTAL ───────────────────────────────────────────────────────
  driftwood:(x,z,terrainH,sc,sol)=>{
    // Bleached log lying on its side, irregular angle. No collision —
    // walkable. Visual: pale weathered grey-brown cylinder, slight tilt.
    const ty=terrainH(x,z);
    const len=1.2+Math.random()*1.2;
    const m=new THREE.MeshLambertMaterial({color:0xa89880});
    const log=new THREE.Mesh(new THREE.CylinderGeometry(.10,.13,len,7),m);
    log.rotation.z=Math.PI/2;
    log.rotation.y=Math.random()*Math.PI*2;
    log.position.set(x,ty+.10,z);
    sc.add(log);
    // Optional knot/branch stub for irregularity
    if(Math.random()<.5){
      const stub=new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,.30,5),m);
      stub.rotation.z=Math.PI/3;
      stub.rotation.y=Math.random()*Math.PI*2;
      stub.position.set(x+Math.cos(log.rotation.y)*.4,ty+.18,z+Math.sin(log.rotation.y)*.4);
      sc.add(stub);
    }
  },

  rope_coil:(x,z,terrainH,sc,sol)=>{
    // Coiled fishing rope, dark hemp color. Two stacked toruses.
    const ty=terrainH(x,z);
    const m=new THREE.MeshLambertMaterial({color:0x6a5238});
    const c1=new THREE.Mesh(new THREE.TorusGeometry(.22,.04,4,12),m);
    c1.rotation.x=Math.PI/2;c1.position.set(x,ty+.04,z);sc.add(c1);
    const c2=new THREE.Mesh(new THREE.TorusGeometry(.18,.04,4,12),m);
    c2.rotation.x=Math.PI/2;c2.rotation.z=Math.random()*1.5;
    c2.position.set(x,ty+.10,z);sc.add(c2);
  },

  seaweed:(x,z,terrainH,sc,sol)=>{
    // Dark green-brown clump of dried kelp on the rocks. Low, flat,
    // walkable. Three or four overlapping flat strips at random angles.
    const ty=terrainH(x,z);
    const m=new THREE.MeshLambertMaterial({color:0x3a4828,side:THREE.DoubleSide});
    const n=3+Math.floor(Math.random()*2);
    for(let i=0;i<n;i++){
      const w=.15+Math.random()*.20, l=.40+Math.random()*.40;
      const strip=new THREE.Mesh(new THREE.PlaneGeometry(w,l),m);
      strip.rotation.x=-Math.PI/2;
      strip.rotation.z=Math.random()*Math.PI*2;
      strip.position.set(x+(Math.random()-.5)*.3,ty+.02,z+(Math.random()-.5)*.3);
      sc.add(strip);
    }
  },

  // ─── BEALACH ──────────────────────────────────────────────────────
  cart_wheel:(x,z,terrainH,sc,sol)=>{
    // Broken cart wheel leaning against itself or in the dirt. Wood torus
    // with a few spokes. Walkable. Suggests wear, well-traveled road.
    const ty=terrainH(x,z);
    const wood=new THREE.MeshLambertMaterial({color:0x5a3e1a});
    const tilt=(Math.random()-.5)*0.4;
    const wheel=new THREE.Mesh(new THREE.TorusGeometry(.45,.06,5,16),wood);
    wheel.rotation.x=Math.PI/2-.3+tilt;
    wheel.rotation.z=Math.random()*Math.PI*2;
    wheel.position.set(x,ty+.40,z);sc.add(wheel);
    // Hub
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.12,7),wood);
    hub.rotation.copy(wheel.rotation);hub.position.copy(wheel.position);sc.add(hub);
    // 3 spokes (some broken)
    for(let i=0;i<3;i++){
      const a=i*(Math.PI*2/3)+Math.random()*.4;
      const sp=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.40),wood);
      sp.rotation.x=Math.PI/2-.3+tilt;
      sp.rotation.z=a+wheel.rotation.z;
      const sx=Math.cos(a)*.20*Math.cos(tilt), sz=Math.sin(a)*.20;
      sp.position.set(x+sx,ty+.40,z+sz);
      sc.add(sp);
    }
  },

  milestone:(x,z,terrainH,sc,sol)=>{
    // Carved stone road-marker, leaning slightly. Standard for both
    // Bealach (Anglo-Saxon-coded, weathered) and Royale (Norman-French,
    // newer). Solid block + small dome cap. Solid collision.
    const ty=terrainH(x,z);
    const stone=new THREE.MeshLambertMaterial({color:0x88806a});
    const block=new THREE.Mesh(new THREE.BoxGeometry(.32,.85,.20),stone);
    const tilt=(Math.random()-.5)*0.15;
    block.rotation.z=tilt;block.rotation.y=Math.random()*Math.PI*2;
    block.position.set(x,ty+.42,z);sc.add(block);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.18,8,5,0,Math.PI*2,0,Math.PI/2),stone);
    cap.position.set(x,ty+.85,z);
    cap.rotation.z=tilt;sc.add(cap);
    sol.push({cx:x,cz:z,rx:.25,rz:.25});
  },

  wheat_stack:(x,z,terrainH,sc,sol)=>{
    // Conical bundle of dried wheat/hay tied at the top. Walkable. Says
    // "this road runs through farmland."
    const ty=terrainH(x,z);
    const hay=new THREE.MeshLambertMaterial({color:0xc8a050});
    const stack=new THREE.Mesh(new THREE.ConeGeometry(.35,.95,8),hay);
    stack.position.set(x,ty+.45,z);
    stack.rotation.y=Math.random()*Math.PI*2;
    sc.add(stack);
    // String tie a third up
    const tie=new THREE.Mesh(new THREE.TorusGeometry(.20,.015,4,10),new THREE.MeshLambertMaterial({color:0x6a4a20}));
    tie.rotation.x=Math.PI/2;tie.position.set(x,ty+.55,z);sc.add(tie);
  },

  // ─── FOOTHILLS ────────────────────────────────────────────────────
  stone_cairn:(x,z,terrainH,sc,sol)=>{
    // Stacked stones, smaller toward the top. Three to five stones.
    // Solid — players bump it. Suggests old paths, marker tradition.
    const ty=terrainH(x,z);
    const stone=new THREE.MeshLambertMaterial({color:0x787068});
    const n=3+Math.floor(Math.random()*3);
    let stackY=ty;
    for(let i=0;i<n;i++){
      const s=.35-i*.06+Math.random()*.05;
      const h=.18+Math.random()*.06;
      const stoneM=new THREE.Mesh(new THREE.BoxGeometry(s,h,s*.85),stone);
      stoneM.rotation.y=Math.random()*Math.PI*2;
      stoneM.position.set(x+(Math.random()-.5)*.04,stackY+h/2,z+(Math.random()-.5)*.04);
      sc.add(stoneM);
      stackY+=h*.95;
    }
    sol.push({cx:x,cz:z,rx:.22,rz:.22});
  },

  dry_stone_wall:(x,z,terrainH,sc,sol)=>{
    // Short collapsed segment of a dry-stone wall. Two-three meters long,
    // half a meter high. Solid. Suggests "someone bordered this once."
    // Random orientation; this is a *fragment*, not a continuous wall.
    const ty=terrainH(x,z);
    const stone=new THREE.MeshLambertMaterial({color:0x808078});
    const len=1.5+Math.random()*1.5;
    const orient=Math.random()*Math.PI;
    // Build via 4-6 stacked rough stones along the line
    const n=Math.floor(len*2.5);
    for(let i=0;i<n;i++){
      const t=(i/n-.5)*len;
      const dx=Math.cos(orient)*t, dz=Math.sin(orient)*t;
      const s=.28+Math.random()*.10;
      const h=.20+Math.random()*.18;
      const stoneM=new THREE.Mesh(new THREE.BoxGeometry(s,h,s*.85),stone);
      stoneM.rotation.y=orient+(Math.random()-.5)*.4;
      stoneM.position.set(x+dx,terrainH(x+dx,z+dz)+h/2,z+dz);
      sc.add(stoneM);
    }
    sol.push({cx:x,cz:z,rx:Math.cos(orient)*len*.5+.2,rz:Math.sin(orient)*len*.5+.2});
  },

  ore_pile:(x,z,terrainH,sc,sol)=>{
    // Heap of rough ore chunks — dark grey-brown, slight reddish
    // (iron-tinged). Walkable. Mining-touched.
    const ty=terrainH(x,z);
    const oreA=new THREE.MeshLambertMaterial({color:0x4a3828});
    const oreB=new THREE.MeshLambertMaterial({color:0x5a4030});
    for(let i=0;i<6;i++){
      const s=.10+Math.random()*.12;
      const piece=new THREE.Mesh(new THREE.BoxGeometry(s,s*.7,s),i%2?oreA:oreB);
      piece.rotation.set(Math.random(),Math.random()*Math.PI*2,Math.random());
      piece.position.set(x+(Math.random()-.5)*.5,ty+s*.3+Math.random()*.10,z+(Math.random()-.5)*.5);
      sc.add(piece);
    }
  },

  // ─── ROYALE ───────────────────────────────────────────────────────
  royal_marker:(x,z,terrainH,sc,sol)=>{
    // Carved post with wax-sealed plaque. Norman-French institutional
    // register. Slimmer than a milestone, with a square plaque mid-height.
    // Solid.
    const ty=terrainH(x,z);
    const wood=new THREE.MeshLambertMaterial({color:0x4a3818});
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,1.10,7),wood);
    post.position.set(x,ty+.55,z);sc.add(post);
    // Plaque
    const plaqueM=new THREE.MeshLambertMaterial({color:0xc8b078});
    const plaque=new THREE.Mesh(new THREE.BoxGeometry(.28,.20,.04),plaqueM);
    plaque.position.set(x,ty+.75,z+.06);
    plaque.rotation.y=Math.random()*Math.PI*2;sc.add(plaque);
    // Wax seal (small red disc)
    const sealM=new THREE.MeshLambertMaterial({color:0x8a2018});
    const seal=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.015,8),sealM);
    seal.rotation.x=Math.PI/2;
    seal.position.set(x,ty+.68,z+.10);sc.add(seal);
    sol.push({cx:x,cz:z,rx:.10,rz:.10});
  },

  wayside_shrine:(x,z,terrainH,sc,sol)=>{
    // Small open-fronted stone shrine. Three stone walls + a sloped roof,
    // candle-niche inside. Norman-Catholic register. Solid.
    const ty=terrainH(x,z);
    const stone=new THREE.MeshLambertMaterial({color:0x988878});
    const dark=new THREE.MeshLambertMaterial({color:0x2a2018});
    // Base block
    const base=new THREE.Mesh(new THREE.BoxGeometry(.7,.18,.55),stone);
    base.position.set(x,ty+.09,z);sc.add(base);
    // Three walls
    const wallH=.55;
    [[0,-.22,.7,.10],[ -.30,0,.10,.34],[.30,0,.10,.34]].forEach(([dx,dz,w,d])=>{
      const wall=new THREE.Mesh(new THREE.BoxGeometry(w,wallH,d),stone);
      wall.position.set(x+dx,ty+.18+wallH/2,z+dz);sc.add(wall);
    });
    // Niche shadow (front opening — represented by dark backing)
    const niche=new THREE.Mesh(new THREE.PlaneGeometry(.45,.40),dark);
    niche.position.set(x,ty+.42,z-.16);sc.add(niche);
    // Sloped roof
    const roof=new THREE.Mesh(new THREE.BoxGeometry(.78,.08,.62),stone);
    roof.position.set(x,ty+.78,z);
    roof.rotation.x=-.15;sc.add(roof);
    sol.push({cx:x,cz:z,rx:.40,rz:.32});
  },

  // ─── WASTES ───────────────────────────────────────────────────────
  dead_tree:(x,z,terrainH,sc,sol)=>{
    // Skeletal trunk with broken branches. No canopy. Bone-pale grey.
    // Solid. Heart of the wastes look.
    const ty=terrainH(x,z);
    const bone=new THREE.MeshLambertMaterial({color:0x6a605a});
    const dark=new THREE.MeshLambertMaterial({color:0x3a322a});
    const h=2.4+Math.random()*1.4;
    // Trunk — slight curvature via stacking two cylinders at angles
    const t1=new THREE.Mesh(new THREE.CylinderGeometry(.10,.18,h*.55,6),bone);
    t1.position.set(x,ty+h*.275,z);sc.add(t1);
    const t2=new THREE.Mesh(new THREE.CylinderGeometry(.06,.10,h*.50,6),bone);
    const lean=(Math.random()-.5)*.35;
    t2.rotation.z=lean;
    t2.position.set(x+Math.sin(lean)*h*.3,ty+h*.55+h*.25,z);sc.add(t2);
    // 3-5 broken branches at upper portion
    const brN=3+Math.floor(Math.random()*3);
    for(let i=0;i<brN;i++){
      const a=Math.random()*Math.PI*2;
      const yh=ty+h*(.55+Math.random()*.30);
      const bl=.40+Math.random()*.40;
      const branch=new THREE.Mesh(new THREE.CylinderGeometry(.025,.05,bl,5),i%2?bone:dark);
      branch.rotation.z=Math.PI/2-Math.random()*1.0;
      branch.rotation.y=a;
      branch.position.set(x+Math.cos(a)*bl*.3,yh,z+Math.sin(a)*bl*.3);
      sc.add(branch);
    }
    sol.push({cx:x,cz:z,rx:.22,rz:.22});
  },

  ash_pile:(x,z,terrainH,sc,sol)=>{
    // Low conical pile of grey ash. Walkable. The wastes smell like old
    // smoke even in scenes where you can't see why. Player walks across.
    const ty=terrainH(x,z);
    const ash=new THREE.MeshLambertMaterial({color:0x584e44});
    const dark=new THREE.MeshLambertMaterial({color:0x3a322a});
    const r=.45+Math.random()*.30;
    const cone=new THREE.Mesh(new THREE.ConeGeometry(r,.28,8),ash);
    cone.position.set(x,ty+.14,z);sc.add(cone);
    // Dark center suggesting recent embers
    const center=new THREE.Mesh(new THREE.CircleGeometry(r*.4,8),dark);
    center.rotation.x=-Math.PI/2;
    center.position.set(x,ty+.005,z);sc.add(center);
  },

  bone_pile:(x,z,terrainH,sc,sol)=>{
    // Scatter of bones — femurs, ribs, a partial skull. Walkable. Says
    // "people died here and nobody came back to bury them."
    const ty=terrainH(x,z);
    const bone=new THREE.MeshLambertMaterial({color:0xb0a890});
    // 3-5 long bones lying in random orientations
    const n=3+Math.floor(Math.random()*3);
    for(let i=0;i<n;i++){
      const len=.30+Math.random()*.25;
      const b=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,len,5),bone);
      b.rotation.z=Math.PI/2;
      b.rotation.y=Math.random()*Math.PI*2;
      b.position.set(x+(Math.random()-.5)*.6,ty+.04+Math.random()*.04,z+(Math.random()-.5)*.6);
      sc.add(b);
    }
    // One dome — partial skull suggested
    if(Math.random()<.6){
      const skull=new THREE.Mesh(new THREE.SphereGeometry(.10,6,4,0,Math.PI*2,0,Math.PI/2),bone);
      skull.position.set(x+(Math.random()-.5)*.3,ty+.08,z+(Math.random()-.5)*.3);
      skull.rotation.y=Math.random()*Math.PI*2;sc.add(skull);
    }
  },

  // ─── ASHEN (Act-I-tail) ───────────────────────────────────────────
  broken_blade:(x,z,terrainH,sc,sol)=>{
    // Half-buried rusted sword fragment. Says "battlefield." The Ashfeld
    // is canonically possibly the origin of Ashenmoor's name.
    const ty=terrainH(x,z);
    const rust=new THREE.MeshLambertMaterial({color:0x6a3818});
    const wood=new THREE.MeshLambertMaterial({color:0x3a2a1a});
    // Blade fragment, leaning into the ground
    const blade=new THREE.Mesh(new THREE.BoxGeometry(.04,.55,.10),rust);
    blade.rotation.z=Math.PI/2-.3;
    blade.rotation.y=Math.random()*Math.PI*2;
    blade.position.set(x,ty+.18,z);sc.add(blade);
    // Crossguard suggestion
    const guard=new THREE.Mesh(new THREE.BoxGeometry(.18,.04,.04),wood);
    guard.rotation.copy(blade.rotation);
    const ya=blade.rotation.y;
    guard.position.set(x+Math.cos(ya)*.20,ty+.36,z+Math.sin(ya)*.20);sc.add(guard);
  },

  cairn_low:(x,z,terrainH,sc,sol)=>{
    // Anonymous battlefield-marker cairn. Smaller, lower, less crafted
    // than the foothill stone_cairn. Two stones stacked. Solid.
    const ty=terrainH(x,z);
    const stone=new THREE.MeshLambertMaterial({color:0x685a4a});
    const s1=new THREE.Mesh(new THREE.BoxGeometry(.35,.18,.32),stone);
    s1.rotation.y=Math.random()*Math.PI*2;
    s1.position.set(x,ty+.09,z);sc.add(s1);
    const s2=new THREE.Mesh(new THREE.BoxGeometry(.26,.14,.22),stone);
    s2.rotation.y=Math.random()*Math.PI*2;
    s2.position.set(x+(Math.random()-.5)*.05,ty+.18+.07,z+(Math.random()-.5)*.05);sc.add(s2);
    sol.push({cx:x,cz:z,rx:.18,rz:.18});
  },

};

// v61e4: REGION_PROFILES — regional identity system. Each spoke of the
// world map gets a region profile that defines its palette, biome, music,
// and decorative prop scatter. Zones declare `region:'coastal'` (or similar)
// in their spec; registerPlaceholderZone applies the region's defaults for
// any field the spec doesn't override. Explicit per-zone fields always win,
// so a zone in a region can still tune its palette individually if needed.
//
// Five canonical spokes (per lore canon § Open narrative questions):
//   coastal   — west_track, salthaven, coastal_road_south, carraig_mor, inis_rua
//   bealach   — bealach_central, droichead, cill_beag, bealach_north_approach
//   foothills — northern_road, la_grise, foothill_track, colmans_rest, mountain_pass, mur_pierre
//   royale    — la_route_royale_west, vieux_marche, la_route_royale_south, dunmore,
//               coastal_road_north, portclare, capital_road, coeur_de_vie
//   wastes    — wastes_west, wastes_east, hermit_camp, caer_uaigneach
//
// Plus Act-I-tail orphans (south_road, the_ashfeld, redwater_ford) that
// belong to no spoke but still get a tonal tag (`region:'ashen'` —
// burned-earth Anglo-Saxon-coded).
//
// `propScatter` declares decorative meshes to scatter in wilderness zones.
// Each entry: {type:'driftwood', count:8} or similar. The scatter loop
// in buildWildernessZone reads this and places meshes at off-path on-terrain
// candidate positions using the same noise-based approach as tree placement.
// Ignored for village/town builds — props go on roads, not in towns.
const REGION_PROFILES={
  coastal:{
    skyCol:0xb8c8d0, fogColor:0xa8b4b0, fogDensity:0.011,
    biome:'coast', musicTrack:'coast',
    propScatter:[
      {type:'driftwood',  count:6},
      {type:'rope_coil',  count:3},
      {type:'seaweed',    count:8},
    ],
  },
  bealach:{
    // The Bealach branch — interior plains, the Dearg river spine, well-traveled.
    // Old, settled-in, slightly worn. Warmer than coastal, more saturated than
    // royale. The bridge at Droichead is too well-made for a village this size.
    skyCol:0xc0d4b8, fogColor:0xb8c098, fogDensity:0.009,
    biome:'plains', musicTrack:'road',
    propScatter:[
      {type:'cart_wheel',  count:3},
      {type:'milestone',   count:2},
      {type:'wheat_stack', count:5},
    ],
  },
  foothills:{
    // Northern foothills approaching the Ferrous Mountains. Cold, rocky,
    // mining-touched. La Grise's indentured-labor undertone reads in the
    // props — abandoned ore-pile, broken pickaxe handles, dry-stone walls
    // that nobody quite remembers building. Colmán's Rest has shrines.
    skyCol:0xa8b0b8, fogColor:0xa0a4a0, fogDensity:0.012,
    biome:'plains', musicTrack:'mountain',
    propScatter:[
      {type:'stone_cairn',     count:4},
      {type:'dry_stone_wall',  count:6},
      {type:'ore_pile',        count:2},
    ],
  },
  royale:{
    // Eastern royale network — the kingdom's official road system. Maintained
    // (sort of), milestones in Norman-French, the sense of a road that someone
    // signs for. La Route Royale is the spine; Coeur de Vie is at its end.
    // Slightly grander palette than Bealach; the road is wider, the air clearer.
    skyCol:0xc8d0e0, fogColor:0xb8b8a8, fogDensity:0.008,
    biome:'plains', musicTrack:'road',
    propScatter:[
      {type:'milestone',       count:4},  // royal milestones, more frequent
      {type:'royal_marker',    count:3},  // wax-sealed posts
      {type:'wayside_shrine',  count:2},
    ],
  },
  wastes:{
    // The Hollowed Wastes — the dead center of the map, the monument to
    // atrocity. Caer Uaigneach's localized anchor failure. The hermit's camp
    // built of salvaged dungeon timber. Lore-canonically the most extreme
    // place; the build catches up. _musicWastes already exists, finally wired.
    skyCol:0x6a605a, fogColor:0x4a4038, fogDensity:0.022,
    biome:'wastes', musicTrack:'wastes',
    propScatter:[
      {type:'dead_tree',   count:8},
      {type:'ash_pile',    count:6},
      {type:'bone_pile',   count:3},
      {type:'dead_tree',   count:4},  // double-up — extreme density
    ],
  },
  ashen:{
    // Tonal tag for Act-I-tail orphans (south_road, the_ashfeld, redwater_ford).
    // Not a true spoke, but the area south of Ashenmoor reads as its own thing —
    // burned-earth Anglo-Saxon-coded, the battlefield underfoot. The Ashfeld is
    // canonically possibly the origin of Ashenmoor's name.
    skyCol:0xb8b0a0, fogColor:0xa89880, fogDensity:0.012,
    biome:'plains', musicTrack:'road',
    propScatter:[
      {type:'broken_blade', count:4},  // half-buried, rusted
      {type:'cairn_low',    count:3},  // anonymous battlefield markers
    ],
  },
};

const BIOME_PROFILES={
  forest:{
    bgCol:0x1a3a0e, fogCol:0x1a3a12, fogDen:.008,
    sunCol:0xb0d080, sunInt:.9,
    ambientCol:0x3a6a2a, ambientInt:.9,
    hemiTop:0x88cc66, hemiBot:0x2a5018, hemiInt:.7,
    groundBase:'#1e4010', groundHue:[95,125], groundSat:[38,58], groundLight:[10,22],
    skyTop:'#1a3a0e', skyBot:'#0d2008', skyJagged:true, // tree-silhouette horizon
    trunkCol:0x2a1808,
    canopyHue:[.28,.38], canopySat:.55, canopyLight:[.10,.18],
    hedgeCol:0x0e2e08, hedgeDkCol:0x0a1e05, hedgeSize:[2.2,1.4,1.4],
    pathCol:0x6a6050, pathStoneCol:0x808070,
    interiorTreeStep:12, interiorTreeCountMax:1.8, // cells of 12u, 1–2 trees each
    mushroomClusters:25,
    grassBushIter:250, grassCol:0x1e5010, bushCol:0x0e2e0a, bushDkCol:0x091a06,
    borderStep:4.0, borderTreeDensity:1.1, // multiplier on borderStep
    skyRingTop:60, skyRingH:200,
  },
  plains:{
    bgCol:0xa8c8e0, fogCol:0xc8d4b8, fogDen:.004,
    sunCol:0xfff4d8, sunInt:1.25,
    ambientCol:0xa0b8d8, ambientInt:.75,
    hemiTop:0xbaddff, hemiBot:0x88a860, hemiInt:.65,
    groundBase:'#6a8a38', groundHue:[60,110], groundSat:[32,58], groundLight:[28,42],
    skyTop:'#7ab0d8', skyBot:'#c8e0c0', skyJagged:false, // clear horizon — no trees
    trunkCol:0x3a2812,
    canopyHue:[.16,.24], canopySat:.5, canopyLight:[.28,.38], // lighter, warmer greens
    hedgeCol:0x4a6a22, hedgeDkCol:0x2e4a12, hedgeSize:[1.4,.9,1.0], // lower, scrubbier
    pathCol:0xa89868, pathStoneCol:0xc0b090, // sandier/chalky road
    interiorTreeStep:28, interiorTreeCountMax:1.1, // much sparser — occasional lone tree
    mushroomClusters:0,
    grassBushIter:420, grassCol:0x6a9828, bushCol:0x4a7a1c, bushDkCol:0x3a6018,
    borderStep:5.0, borderTreeDensity:.55, // border trees sparse too — rolling plains
    skyRingTop:40, skyRingH:120,
  },
  // v61e3: coast biome. Exposed, treeless, salt-bleached. Cool blue-grey
  // horizon, bone-pale path stone, sparse low scrub instead of trees.
  // Border tree density dropped near to zero so the cliff/sea horizon reads
  // as open. Interior trees pushed even sparser than plains. Hedges
  // shorter and thornier (wind-stunted). Greens leaned cooler and duskier.
  // Used by the West Track and Coastal Road South — Salthaven and Carraig
  // Mór keep village-kind builds, but the wilderness segments connecting
  // them now read distinctly seaward.
  coast:{
    bgCol:0xb8c8d0, fogCol:0xc0c8c0, fogDen:.006,
    sunCol:0xffe8c8, sunInt:1.10,
    ambientCol:0xa8b8c0, ambientInt:.80,
    hemiTop:0xa8c0d4, hemiBot:0x88a098, hemiInt:.60,
    groundBase:'#7a8868', groundHue:[55,95], groundSat:[18,38], groundLight:[26,40], // duskier, less saturated
    skyTop:'#88a8c0', skyBot:'#c8d0c8', skyJagged:false, // open horizon — sea visible
    trunkCol:0x3a2818,
    canopyHue:[.14,.22], canopySat:.32, canopyLight:[.22,.32], // wind-stressed, cooler
    hedgeCol:0x4a5e3a, hedgeDkCol:0x2e3e22, hedgeSize:[1.0,.7,.8], // short, wind-stunted
    pathCol:0xc0b8a0, pathStoneCol:0xd8d0b8, // bone-pale, salt-bleached
    interiorTreeStep:42, interiorTreeCountMax:.6, // very sparse — exposure kills most
    mushroomClusters:0,
    grassBushIter:380, grassCol:0x7a9038, bushCol:0x4a5a30, bushDkCol:0x3a4828, // tussock grass
    borderStep:6.5, borderTreeDensity:.18, // very sparse border — open to the sea
    skyRingTop:30, skyRingH:100,
  },
  // v61e4: wastes biome. The dead center of the map. No living vegetation
  // to speak of — what was once forest is dead-tree skeletons; what was once
  // grass is ash-grey scrub. Ground tones leaned toward burned earth and
  // bone-grey stone. Sky goes flat and oppressive. Borders use sparse
  // dead-tree silhouettes via the existing tree placement (the wilderness
  // builder's tree mesh inherits trunkCol; canopy colors here are pushed
  // dim-grey-brown so trees that DO render look dead rather than alive).
  // Used by the entirety of the wastes spoke per region tagging.
  wastes:{
    bgCol:0x6a605a, fogCol:0x4a4038, fogDen:.022,
    sunCol:0xc8b8a0, sunInt:.65, // dim, dust-filtered
    ambientCol:0x80706a, ambientInt:.55,
    hemiTop:0x6a605a, hemiBot:0x382e28, hemiInt:.45,
    groundBase:'#403828', groundHue:[20,42], groundSat:[12,28], groundLight:[14,24], // burned earth
    skyTop:'#5a504a', skyBot:'#3a3028', skyJagged:false, // flat, oppressive
    trunkCol:0x2a2018, // dead-grey-brown
    canopyHue:[.05,.10], canopySat:.10, canopyLight:[.08,.16], // grey-brown skeletons
    hedgeCol:0x382818, hedgeDkCol:0x281808, hedgeSize:[.8,.5,.6], // mostly broken
    pathCol:0x504838, pathStoneCol:0x685c50, // grey path, no warmth
    interiorTreeStep:32, interiorTreeCountMax:.8, // sparser than plains, dead
    mushroomClusters:0,
    grassBushIter:180, grassCol:0x4a4030, bushCol:0x382818, bushDkCol:0x281808, // ash-grey scrub
    borderStep:5.5, borderTreeDensity:.40, // some border, all dead
    skyRingTop:35, skyRingH:110,
  },
};

function buildWildernessZone(cfg){
  const biome=BIOME_PROFILES[cfg.biome]||BIOME_PROFILES.forest;
  const SZ=cfg.size;
  const sc=new THREE.Scene();
  sc.background=new THREE.Color(biome.bgCol);
  sc.fog=new THREE.FogExp2(biome.fogCol,biome.fogDen);
  const sun=new THREE.DirectionalLight(biome.sunCol,biome.sunInt);
  sun.position.set(60,120,60);sc.add(sun);
  const _wAmb=new THREE.AmbientLight(biome.ambientCol,biome.ambientInt);sc.add(_wAmb);
  const _wHemi=new THREE.HemisphereLight(biome.hemiTop,biome.hemiBot,biome.hemiInt);sc.add(_wHemi);
  // v61e7 — Day/Night Session B: instrument scene. Wilderness uses region-
  // based night palette (Wastes hand-designed near-black, Coastal moonlit
  // silver-blue, others auto-derived).
  if(typeof instrumentSceneForDayNight === 'function'){
    instrumentSceneForDayNight(sc, {sun, ambient:_wAmb, hemi:_wHemi, fog:sc.fog}, {
      skyCol: biome.bgCol,
      fogColor: biome.fogCol,
      fogDensity: biome.fogDen,
      sunCol: biome.sunCol, sunInt: biome.sunInt,
      ambientCol: biome.ambientCol, ambientInt: biome.ambientInt,
      hemiInt: biome.hemiInt,
    }, cfg.region||null, false);
  }

  // ── Terrain heightmap ────────────────────────────────────────
  const SEGS=64;
  const heights=new Float32Array((SEGS+1)*(SEGS+1));
  const _noise=(wx,wz,scale,sd)=>_smoothNoise(wx,wz,sd,scale);
  const seed=cfg.seed||9901;

  // Path → polyline for flattening + path-drawing
  const pathWP=cfg.pathWaypoints||[{x:SZ/2,z:5},{x:SZ/2,z:SZ-5}];
  const pathSegsT=[];
  for(let i=0;i<pathWP.length-1;i++)pathSegsT.push([pathWP[i],pathWP[i+1]]);
  function _distToPath(wx,wz){
    let minD=Infinity;
    pathSegsT.forEach(([a,b])=>{
      const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
      if(len<.1)return;
      const t=Math.max(0,Math.min(1,((wx-a.x)*dx+(wz-a.z)*dz)/(len*len)));
      minD=Math.min(minD,Math.hypot(wx-(a.x+t*dx),wz-(a.z+t*dz)));
    });
    return minD;
  }
  const PATH_FLAT_W=6, PATH_HILL_W=14;
  // v61f: cfg.terrainAmpMul scales the noise amplitude per-zone. Defaults to
  // 1.0 (existing behaviour — fairly flat). Bealach-South sets 2.5 for
  // visible rolling plains. Path corridor stays flat regardless via
  // flatFactor below, so the road is always walkable.
  const ampMul = cfg.terrainAmpMul != null ? cfg.terrainAmpMul : 1.0;
  // v61g: cfg.hills is an optional array of {x, z, r, h} describing localized
  // hills. Each hill adds a cosine-falloff bump at its center, attenuated by
  // the same flatFactor so the road stays walkable where it passes near hills.
  const hills = cfg.hills || [];
  for(let iz=0;iz<=SEGS;iz++){for(let ix=0;ix<=SEGS;ix++){
    const wx=(ix/SEGS)*SZ,wz=(iz/SEGS)*SZ;
    let h=(_noise(wx,wz,120,seed)*.7+_noise(wx,wz,45,seed+1)*.25)*ampMul;
    for(let k=0;k<hills.length;k++){
      const H=hills[k], dH=Math.hypot(wx-H.x,wz-H.z);
      if(dH<H.r){
        const t=dH/H.r;
        h += H.h * 0.5 * (1 + Math.cos(Math.PI * t)); // smooth cosine bump
      }
    }
    const dp=_distToPath(wx,wz);
    const flatFactor=dp<=PATH_FLAT_W?0:dp>=PATH_HILL_W?1:
      0.5*(1-Math.cos(Math.PI*(dp-PATH_FLAT_W)/(PATH_HILL_W-PATH_FLAT_W)));
    heights[iz*(SEGS+1)+ix]=h*flatFactor;
  }}
  function terrainH(wx,wz){
    const nx=Math.max(0,Math.min(SZ,wx)),nz=Math.max(0,Math.min(SZ,wz));
    const gx=(nx/SZ)*SEGS,gz=(nz/SZ)*SEGS;
    const ix=Math.floor(gx),iz=Math.floor(gz);
    const fx=gx-ix,fz=gz-iz;
    const i00=iz*(SEGS+1)+ix,i10=iz*(SEGS+1)+(ix+1);
    const i01=(iz+1)*(SEGS+1)+ix,i11=(iz+1)*(SEGS+1)+(ix+1);
    const safe=i=>(heights[i]||0);
    return safe(i00)*(1-fx)*(1-fz)+safe(i10)*fx*(1-fz)+safe(i01)*(1-fx)*fz+safe(i11)*fx*fz;
  }
  cfg.getY=terrainH;

  // ── Ground ───────────────────────────────────────────────────
  const [ghLo,ghHi]=biome.groundHue, [gsLo,gsHi]=biome.groundSat, [glLo,glHi]=biome.groundLight;
  const groundTex=mkTex((x,w,h)=>{
    x.fillStyle=biome.groundBase;x.fillRect(0,0,w,h);
    for(let i=0;i<800;i++){
      x.fillStyle=`hsl(${ghLo+Math.random()*(ghHi-ghLo)},${gsLo+Math.random()*(gsHi-gsLo)}%,${glLo+Math.random()*(glHi-glLo)}%)`;
      x.fillRect(Math.random()*w,Math.random()*h,Math.random()*4+1,Math.random()*3+1);
    }
  });
  groundTex.repeat.set(40,40);
  const gGeo=new THREE.PlaneGeometry(SZ,SZ,SEGS,SEGS);
  gGeo.rotateX(-Math.PI/2);
  const gPos=gGeo.attributes.position;
  for(let i=0;i<gPos.count;i++){
    const wx=gPos.getX(i)+SZ/2,wz=gPos.getZ(i)+SZ/2;
    gPos.setY(i,terrainH(wx,wz));
  }
  gGeo.computeVertexNormals();
  const gnd=new THREE.Mesh(gGeo,new THREE.MeshLambertMaterial({map:groundTex}));
  gnd.position.set(SZ/2,0,SZ/2);sc.add(gnd);

  // ── Skyring ──────────────────────────────────────────────────
  const skyCV=document.createElement('canvas');skyCV.width=512;skyCV.height=256;
  const skyX=skyCV.getContext('2d');
  const skyGrad=skyX.createLinearGradient(0,0,0,256);
  skyGrad.addColorStop(0,biome.skyTop);skyGrad.addColorStop(1,biome.skyBot);
  skyX.fillStyle=skyGrad;skyX.fillRect(0,0,512,256);
  if(biome.skyJagged){
    // Forest-style tree silhouette horizon
    skyX.fillStyle=biome.skyBot;
    for(let tx=0;tx<512;tx+=8){const th=60+Math.random()*120;skyX.fillRect(tx,256-th,8,th);}
  } else {
    // Plains-style — soft cloud band
    skyX.fillStyle='rgba(230,230,220,.35)';
    for(let c=0;c<9;c++){
      const cx=c*60+Math.random()*20,cy=70+Math.random()*40,cr=30+Math.random()*22;
      skyX.beginPath();skyX.arc(cx,cy,cr,0,Math.PI*2);skyX.fill();
    }
  }
  const ringR=SZ*1.07;
  const skyRingMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(skyCV),side:THREE.BackSide,fog:false});
  const skyRing=new THREE.Mesh(
    new THREE.CylinderGeometry(ringR,ringR,biome.skyRingH,32,1,true),
    skyRingMat);
  skyRing.position.set(SZ/2,biome.skyRingTop,SZ/2);sc.add(skyRing);
  // v61e8 — see buildVillage for rationale. Same fix at wilderness scenes:
  // the skyRing's hardcoded day canvas shows through as a wedge at night
  // until we tint it via material.color.
  sc.userData.skyRingMat = skyRingMat;

  // ── Tree builder (biome-colored) ─────────────────────────────
  const sol=cfg.sol||[];
  const trunkMat=new THREE.MeshLambertMaterial({color:biome.trunkCol});
  const [chLo,chHi]=biome.canopyHue, [clLo,clHi]=biome.canopyLight;
  function mkTree(x,z,h,r,solid=true){
    const ty=terrainH(x,z);
    const trunkH=h*.55,trunkR=r*.18;
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(trunkR*.7,trunkR,trunkH,7),trunkMat);
    trunk.position.set(x,ty+trunkH/2,z);sc.add(trunk);
    const canCol=new THREE.Color().setHSL(chLo+Math.random()*(chHi-chLo),biome.canopySat,clLo+Math.random()*(clHi-clLo));
    const can=new THREE.Mesh(new THREE.ConeGeometry(r,h*.72,7),new THREE.MeshLambertMaterial({color:canCol}));
    can.position.set(x,ty+trunkH+h*.28,z);sc.add(can);
    if(solid)sol.push({cx:x,cz:z,rx:trunkR+.4,rz:trunkR+.4});
  }

  // ── Path ─────────────────────────────────────────────────────
  const PATH_W=FOREST_PATH_W;
  const pathSegs=pathSegsT; // reuse the terrain-flattening polyline
  function _nearPath(x,z,margin=PATH_W){
    return pathSegs.some(([a,b])=>{
      const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
      if(len<.1)return false;
      const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(len*len)));
      return Math.hypot(x-(a.x+t*dx),z-(a.z+t*dz))<margin;
    });
  }
  const pathMat=new THREE.MeshLambertMaterial({color:biome.pathCol});
  pathSegs.forEach(([a,b])=>{
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
    const cx=(a.x+b.x)/2,cz=(a.z+b.z)/2,ang=Math.atan2(dx,dz);
    const avgTy=(terrainH(a.x,a.z)+terrainH(b.x,b.z))/2;
    const p=new THREE.Mesh(new THREE.PlaneGeometry(PATH_W*2,len),pathMat);
    p.rotation.x=-Math.PI/2;p.rotation.z=ang;p.position.set(cx,avgTy+.04,cz);sc.add(p);
    // Stone detail patches
    for(let d=2;d<len-2;d+=2.5){
      const sx=a.x+(dx/len)*d+(Math.random()-.5)*PATH_W,sz=a.z+(dz/len)*d+(Math.random()-.5)*PATH_W;
      const sty=terrainH(sx,sz);
      const stone=new THREE.Mesh(new THREE.BoxGeometry(.4+Math.random()*.3,.04,.3+Math.random()*.2),new THREE.MeshLambertMaterial({color:biome.pathStoneCol}));
      stone.position.set(sx,sty+.04,sz);stone.rotation.y=Math.random()*Math.PI;sc.add(stone);
    }
  });

  // ── Gate-gap tester (all gates carve a hole in the border) ──
  const gates=cfg.gates||[];
  function _inGateGap(x,z){
    return gates.some(g=>{
      // gate at map edge: carve a window of ~14 wide × 6 deep on the appropriate side
      if(g.z<=6)      return Math.abs(x-g.x)<7 && z<6;
      if(g.z>=SZ-6)   return Math.abs(x-g.x)<7 && z>SZ-6;
      if(g.x<=6)      return Math.abs(z-g.z)<7 && x<6;
      if(g.x>=SZ-6)   return Math.abs(z-g.z)<7 && x>SZ-6;
      return false;
    });
  }

  // ── Border hedge + tree wall ─────────────────────────────────
  const hedgeMat=new THREE.MeshLambertMaterial({color:biome.hedgeCol});
  const hedgeDkMat=new THREE.MeshLambertMaterial({color:biome.hedgeDkCol});
  const [hW,hH,hD]=biome.hedgeSize;
  function _hedge(x,z){
    if(_inGateGap(x,z))return;
    const ty=terrainH(x,z);
    const w=hW+Math.random()*.8,h=hH+Math.random()*.5,d=hD+Math.random()*.4;
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),hedgeMat);
    body.position.set(x,ty+h/2,z);sc.add(body);
    for(let l=0;l<3;l++){
      const lump=new THREE.Mesh(new THREE.SphereGeometry(.5+Math.random()*.2,5,4),hedgeDkMat);
      lump.scale.set(1,.6,1);
      lump.position.set(x+(Math.random()-.5)*.7,ty+h*.85+Math.random()*.2,z+(Math.random()-.5)*.5);
      sc.add(lump);
    }
  }
  const bStep=biome.borderStep, bM=1.5, tM=4.0;
  for(let x=bM;x<SZ-bM;x+=bStep){
    _hedge(x+(Math.random()-.5)*.6,bM);
    _hedge(x+(Math.random()-.5)*.6,SZ-bM);
  }
  for(let z=bM+bStep;z<SZ-bM-bStep;z+=bStep){
    _hedge(bM,z+(Math.random()-.5)*.6);
    _hedge(SZ-bM,z+(Math.random()-.5)*.6);
  }
  // Tree-wall outside the hedges — density per biome
  const treeBorderStep=bStep*biome.borderTreeDensity>=1 ? bStep*biome.borderTreeDensity : bStep*2;
  for(let x=tM;x<SZ-tM;x+=treeBorderStep){
    if(!_inGateGap(x,tM))mkTree(x+(Math.random()-.5)*1.5,tM+(Math.random()-.5)*.8,5+Math.random()*4,2.2+Math.random()*1.2);
    if(!_inGateGap(x,SZ-tM))mkTree(x+(Math.random()-.5)*1.5,SZ-tM+(Math.random()-.5)*.8,5+Math.random()*4,2.2+Math.random()*1.2);
  }
  // v61f: W/E rows now also respect gate gaps. Previously Bealach Central's
  // east gate was occluded by a tree because these loops skipped _inGateGap.
  for(let z=tM+treeBorderStep;z<SZ-tM-treeBorderStep;z+=treeBorderStep){
    if(!_inGateGap(tM,z))mkTree(tM+(Math.random()-.5)*.8,z+(Math.random()-.5)*1.5,5+Math.random()*4,2.2+Math.random()*1.2);
    if(!_inGateGap(SZ-tM,z))mkTree(SZ-tM+(Math.random()-.5)*.8,z+(Math.random()-.5)*1.5,5+Math.random()*4,2.2+Math.random()*1.2);
  }

  // ── Interior trees (off-path) ────────────────────────────────
  const iStep=biome.interiorTreeStep, iMax=biome.interiorTreeCountMax;
  for(let gx=10;gx<SZ-10;gx+=iStep){
    for(let gz=10;gz<SZ-10;gz+=iStep){
      if(_nearPath(gx,gz,PATH_W+2.5))continue;
      const count=1+Math.floor(Math.random()*iMax);
      for(let c=0;c<count;c++){
        const tx=gx+(Math.random()-.5)*6,tz=gz+(Math.random()-.5)*6;
        if(_nearPath(tx,tz,PATH_W+1.5))continue;
        if(tx<8||tx>SZ-8||tz<8||tz>SZ-8)continue;
        mkTree(tx,tz,4+Math.random()*5,1.8+Math.random()*1.4);
      }
    }
  }

  // ── Mushroom clusters (forest only, normally) ───────────────
  if(biome.mushroomClusters>0){
    const mCap=new THREE.MeshLambertMaterial({color:0xcc3322});
    const mStem=new THREE.MeshLambertMaterial({color:0xddccaa});
    for(let i=0;i<biome.mushroomClusters;i++){
      const mx=10+Math.random()*(SZ-20),mz=10+Math.random()*(SZ-20);
      if(_nearPath(mx,mz,PATH_W+1))continue;
      const mty=terrainH(mx,mz);
      for(let m=0;m<3;m++){
        const ox=(Math.random()-.5)*2,oz=(Math.random()-.5)*2;
        const stem=new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,.2,6),mStem);stem.position.set(mx+ox,mty+.1,mz+oz);sc.add(stem);
        const cap=new THREE.Mesh(new THREE.ConeGeometry(.2,.15,8),mCap);cap.position.set(mx+ox,mty+.28,mz+oz);sc.add(cap);
      }
    }
  }

  // ── Grass & bushes ───────────────────────────────────────────
  const grassMat=new THREE.MeshLambertMaterial({color:biome.grassCol,side:THREE.DoubleSide});
  const bushMat=new THREE.MeshLambertMaterial({color:biome.bushCol});
  const bushDkMat=new THREE.MeshLambertMaterial({color:biome.bushDkCol});
  for(let i=0;i<biome.grassBushIter;i++){
    const gx=8+Math.random()*(SZ-16),gz=8+Math.random()*(SZ-16);
    if(_nearPath(gx,gz,PATH_W+1))continue;
    const ty=terrainH(gx,gz);
    if(Math.random()<.65){
      for(let b=0;b<3;b++){
        const bx=gx+(Math.random()-.5)*.8,bz=gz+(Math.random()-.5)*.8;
        const h=.22+Math.random()*.2;
        const blade=new THREE.Mesh(new THREE.PlaneGeometry(.1,h),grassMat);
        blade.position.set(bx,terrainH(bx,bz)+h/2,bz);
        blade.rotation.y=Math.random()*Math.PI;
        sc.add(blade);
      }
    } else {
      const r=.25+Math.random()*.2;
      const body=new THREE.Mesh(new THREE.SphereGeometry(r,5,4),bushMat);
      body.scale.set(1,.65,1);body.position.set(gx,ty+r*.5,gz);sc.add(body);
      for(let l=0;l<2;l++){
        const lump=new THREE.Mesh(new THREE.SphereGeometry(r*.65,4,3),bushDkMat);
        lump.scale.set(1,.6,1);
        lump.position.set(gx+(Math.random()-.5)*.3,ty+r*.75+Math.random()*.08,gz+(Math.random()-.5)*.3);
        sc.add(lump);
      }
    }
  }

  // ── Gates ────────────────────────────────────────────────────
  const gateArr=cfg.gateArr||[];
  gates.forEach(gd=>{
    // v61f: side-aware rotation + terrain-sit Y (see buildFenceGate comment).
    const side = gd.z<=6 ? 'S' : gd.z>=SZ-6 ? 'N' : gd.x<=6 ? 'W' : 'E';
    const rotY = gd.rotY != null ? gd.rotY : ((side==='E'||side==='W') ? Math.PI/2 : 0);
    const ty = terrainH(gd.x, gd.z);
    const mesh=buildFenceGate(sc,gd.x,gd.z,rotY,undefined,ty);
    // v61e1: propagate guard field (third push-site fix; v61e0 caught the
    // other two in buildVillage and buildTown). Wilderness zones don't
    // currently have any commission-guarded gates, but the field needs to
    // be preserved so future tide/commission gating on a wilderness gate
    // (e.g. a future bridge zone with a tide guard) just works.
    let barrierMesh=null;
    if(gd.guard==='commission' && !worldState.commissioned){
      barrierMesh=_buildCommissionBarrier(sc,gd.x,gd.z,rotY,ty);
    }
    gateArr.push({x:gd.x,z:gd.z,targetZone:gd.targetZone,
      spawnX:gd.spawnX,spawnZ:gd.spawnZ,spawnYaw:gd.spawnYaw||Math.PI,
      label:gd.label||gd.targetZone,mesh,guard:gd.guard,barrierMesh});
  });

  // ── Enemies ──────────────────────────────────────────────────
  // v61e9 — Day/Night Session C: spawn entries can carry nightOnly /
  // duskOnly / dayOnly filter flags + respawn:false flags. Filter
  // groups by current time-of-day BEFORE iterating positions, then
  // scale the position list by the spawn density multiplier (round up).
  // Multiplier rolls once at build time; persists for zone session
  // lifetime. Respawn re-build (controlled by goToZone) flows through
  // the same path with _zoneIsRespawn:true so respawn:false entries
  // are excluded.
  const zoneEnemies=cfg.enemiesArr||[];
  const _isRespawn = !!cfg._zoneIsRespawn;
  const _filterBase = (typeof filterSpawnEntriesByTime === 'function')
    ? filterSpawnEntriesByTime(cfg.enemies||[])
    : (cfg.enemies||[]);
  const _filteredGroups = _isRespawn
    ? _filterBase.filter(g => g.respawn !== false)
    : _filterBase;
  _filteredGroups.forEach(group=>{
    // Scale the position list. Round up means 1.5× of 2 = 3; we tile
    // the original positions and synthesize extras within a small jitter
    // radius around the originals to avoid stacked spawns.
    const basePos = group.pos || [];
    const targetCount = (typeof _scaleSpawnCount === 'function') ? _scaleSpawnCount(basePos.length) : basePos.length;
    for(let i=0; i<targetCount; i++){
      // S543 — co-op rules: a legacy zone's foe is <zone>:foe:<group>:<i> (the group's place in the config, so a
      // time-of-day filter or a respawn moves no other foe's id); its extra spot and its variant come from that id
      const fid=legacyFoeId(cfg.id,cfg.enemies,group,i);
      let ex, ez;
      if(i < basePos.length){
        [ex, ez] = basePos[i];
      } else {
        // Synthesize an extra spawn near a base position.
        // Jitter radius 4 units; clamps via ground sampling that
        // buildZoneEnemy already does.
        const [bx, bz] = basePos[i % basePos.length];
        const jr = 4, pr = seededRng('place', fid);
        ex = bx + (pr()*2-1)*jr;
        ez = bz + (pr()*2-1)*jr;
      }
      zoneEnemies.push(keyFoe(buildZoneEnemy(sc,sol,ex,ez,group.name,pickVariant(group.name,level,'normal',seededRng('variant',fid))),fid));
    }
  });
  if(typeof _markZoneSpawned === 'function' && cfg.id) _markZoneSpawned(cfg.id);

  // ── Portals ──────────────────────────────────────────────────
  const zonePortals=cfg.portalZone
    ? WORLD_DUNGEONS.filter(e=>e.zone===cfg.portalZone&&e.kind!=='fort_door').map(makePortalDef) // v80 S132 — forts belong to the world's compound and keep; the legacy kit built a second fort on top
    : [];
  if(zonePortals.length)spawnPortalMeshes(sc,zonePortals,sol,terrainH);

  // ── Herbs ────────────────────────────────────────────────────
  const herbArr=cfg.herbsArr||[];
  (cfg.herbSpawns||[]).forEach(sp=>{
    const def=HERB_DEF[sp.type];if(!def)return;
    const ty=terrainH(sp.x,sp.z);
    const {g,gl}=mkHerbMesh(sp.x,sp.z,def,sc);
    g.position.set(sp.x,ty,sp.z);
    herbArr.push({x:sp.x,z:sp.z,type:sp.type,def,g,gl,harvested:false,respawnT:0,ph:Math.random()*Math.PI*2});
  });

  // ── Notice board (v61d: wilderness zones can host a central signpost) ─
  // Ported from buildVillage — same visual, same interaction. Lets a
  // wilderness-stub zone show its name + description when the player walks
  // up and presses E.
  if(cfg.noticeBoardX!=null){
    const nbx=cfg.noticeBoardX,nbz=cfg.noticeBoardZ;
    const _nbWoodMat=new THREE.MeshLambertMaterial({color:0x4a3010});
    [[-.3,0],[.3,0]].forEach(([ox])=>{
      const post=new THREE.Mesh(new THREE.BoxGeometry(.08,1.3,.08),_nbWoodMat);
      post.position.set(nbx+ox,terrainH(nbx,nbz)+.65,nbz);sc.add(post);
    });
    const beam=new THREE.Mesh(new THREE.BoxGeometry(.72,.08,.06),_nbWoodMat);
    beam.position.set(nbx,terrainH(nbx,nbz)+1.2,nbz);sc.add(beam);
    const board=new THREE.Mesh(new THREE.BoxGeometry(.6,.5,.04),new THREE.MeshLambertMaterial({color:0x7a5820,side:THREE.DoubleSide}));
    board.position.set(nbx,terrainH(nbx,nbz)+.85,nbz);sc.add(board);
    const parch=new THREE.Mesh(new THREE.BoxGeometry(.52,.42,.01),new THREE.MeshLambertMaterial({color:0xd4b878}));
    parch.position.set(nbx,terrainH(nbx,nbz)+.85,nbz-.025);sc.add(parch);
    sol.push({cx:nbx,cz:nbz,rx:.5,rz:.3});
    OW_NOTICE_BOARDS.push({x:nbx,z:nbz,title:cfg.noticeBoardTitle||'',text:cfg.noticeBoardText||'',zone:cfg.id});
  }

  // ── v61e4: Regional decorative props ────────────────────────────
  // Reads cfg.propScatter (set by registerPlaceholderZone from the zone's
  // region profile). Each entry {type, count} dispatches to PROP_BUILDERS
  // for `count` placement attempts. Placement uses the same off-path
  // off-edge candidate logic as foliage scatter — props that can't find a
  // valid spot in 8 attempts skip silently, since regional density is a
  // suggestion not a guarantee.
  if(cfg.propScatter && Array.isArray(cfg.propScatter) && typeof PROP_BUILDERS !== 'undefined'){
    cfg.propScatter.forEach(entry=>{
      const builder=PROP_BUILDERS[entry.type];
      if(!builder){console.warn('REGION_PROFILES: unknown propScatter type',entry.type);return;}
      const count=entry.count||1;
      for(let i=0;i<count;i++){
        // Try up to 8 random positions; skip if no valid spot found
        let placed=false;
        for(let tries=0;tries<8 && !placed;tries++){
          const px=10+Math.random()*(SZ-20), pz=10+Math.random()*(SZ-20);
          if(_nearPath(px,pz,PATH_W+2.0))continue;
          if(px<8||px>SZ-8||pz<8||pz>SZ-8)continue;
          builder(px,pz,terrainH,sc,sol);
          placed=true;
        }
      }
    });
  }

  // ── v61f7: bespoke detail hook ───────────────────────────────
  // Mirrors buildVillage (line ~8236) and buildTown (line ~12969). Lets a
  // wilderness zone declare a cfg.detailFn that runs after base geometry,
  // path, props, gates, and notice board are in place. Receives (scene,
  // sol, getY) — same shape as the village hook. Used by Greywatch for
  // the ruined-watchtower geometry; forward-compatible for any future
  // wilderness landmark.
  if(cfg.detailFn) cfg.detailFn(sc, sol, terrainH);

  // ── v61f8: platforms resolution (parallel to v61f3 in buildVillage) ──
  // Spec format: `cfg.platforms = [{x0,x1,z0,z1,y|ySource}, ...]`. `y` is
  // a fixed number; `ySource:[wx,wz]` samples terrain at that point.
  // Exposed via ZONES[id].platforms — activeTerrainH consults this so the
  // player walks AT platform Y when inside the footprint, NOT the carved
  // terrain Y beneath. Required for Greywatch's tower interior: the tower
  // sits on a 2.5u hill, and without this the player's feet snap to the
  // hill's radial slope inside the tower base, making the interior floor
  // visibly tilt. Forward-compatible for any future wilderness raised
  // walkway (rampart catwalks, hilltop platforms, watchtower decks).
  const _wPlatforms = [];
  if(cfg.platforms){
    cfg.platforms.forEach(p => {
      let resolvedY = p.y;
      if(resolvedY == null && p.ySource){
        resolvedY = terrainH(p.ySource[0], p.ySource[1]);
      }
      _wPlatforms.push({x0:p.x0, x1:p.x1, z0:p.z0, z1:p.z1, y:resolvedY, name:p.name});
    });
  }

  // ── Register ─────────────────────────────────────────────────
  cfg.scene=sc;
  ZONES[cfg.id]={scene:sc,sol,npcs:[],enemies:zoneEnemies,gates:gateArr,size:SZ,portals:zonePortals,herbs:herbArr,getY:terrainH,platforms:_wPlatforms,_cfg:cfg}; // v61e9 — _cfg ref enables respawnZoneEnemies to re-roll the enemy spec; v61f8 — platforms for wilderness interior-flat overrides

  return sc;
}

// ── Deepwood Forest config (wilderness zone, biome=forest) ────
const DEEPWOOD_CONFIG={
  id:'forest', name:'The Deepwood Forest', musicTrack:'overworld',
  biome:'forest', size:FOREST_SIZE, seed:9901,
  pathWaypoints:[
    {x:150,z:10},   // south gate
    {x:150,z:70},   // go north
    {x:90, z:70},   // turn west
    {x:90, z:140},  // go north
    {x:180,z:140},  // turn east
    {x:180,z:210},  // go north
    {x:120,z:210},  // turn west
    {x:120,z:270},  // go north
    {x:150,z:290},  // north gate
  ],
  // v61: Deepwood's south gate now routes to Hearthwick (was 'overworld').
  // The MAP_EDGES graph models this as forest→hearthwick. Ashenmoor's east
  // gate exits to bealach_south, bealach_south→hearthwick, hearthwick→forest.
  // v61c: low-Z (north-compass) → Ironhaven (north-map neighbor).
  //       high-Z (south-compass) → Hearthwick (south-map neighbor).
  // v61e1: south gate now routes to The Thorngate outpost (between forest
  //        and Hearthwick), north gate routes to La Porte Grise outpost
  //        (between forest and Ironhaven). The forest is bookended by two
  //        outposts. Net effect: Hearthwick→Thorngate→Forest→La Porte Grise→Ironhaven
  //        is the canonical road north now.
  gates:[
    {x:150,z:3,             targetZone:'la_porte_grise',spawnX:20,spawnZ:34,spawnYaw:0,label:'La Porte Grise'},
    {x:150,z:FOREST_SIZE-3, targetZone:'thorngate',     spawnX:20,spawnZ:6, spawnYaw:Math.PI,label:'The Thorngate'},
  ],
  enemies:[
    {name:'Wolf',        pos:[[130,40],[160,55],[100,80],[170,90],[140,30]]},
    {name:'Spider',      pos:[[80,60],[200,70]]},
    {name:'Forest Troll',pos:[[100,180],[190,160],[160,200],[130,220],[80,200]]},
    {name:'Bandit',      pos:[[170,170],[100,250]]},
  ],
  herbSpawns:[
    // Fearnóg
    {x:80, z:40, type:'fearnog'},{x:200,z:60, type:'fearnog'},
    {x:120,z:180,type:'fearnog'},{x:250,z:130,type:'fearnog'},
    {x:45, z:100,type:'fearnog'},{x:210,z:240,type:'fearnog'},
    // Shadowcap
    {x:60, z:120,type:'shadowcap'},{x:220,z:200,type:'shadowcap'},
    {x:100,z:260,type:'shadowcap'},{x:270,z:90, type:'shadowcap'},
    {x:35, z:200,type:'shadowcap'},
    // Wolf's Bane
    {x:170,z:50, type:'wolfsbane'},{x:80, z:150,type:'wolfsbane'},
    {x:230,z:180,type:'wolfsbane'},{x:140,z:240,type:'wolfsbane'},
    {x:55, z:270,type:'wolfsbane'},{x:265,z:155,type:'wolfsbane'},
    // Caorthann
    {x:140,z:100,type:'caorthann'},{x:70, z:200,type:'caorthann'},
    {x:260,z:90, type:'caorthann'},{x:185,z:265,type:'caorthann'},
    {x:40, z:145,type:'caorthann'},{x:240,z:50, type:'caorthann'},
    // Deepmoss
    {x:50, z:80, type:'deepmoss'},{x:190,z:140,type:'deepmoss'},
    {x:160,z:250,type:'deepmoss'},{x:270,z:210,type:'deepmoss'},
    {x:95, z:175,type:'deepmoss'},{x:220,z:130,type:'deepmoss'},
    // Briarweed
    {x:110,z:130,type:'briarweed'},{x:240,z:160,type:'briarweed'},
    {x:80, z:230,type:'briarweed'},{x:175,z:90, type:'briarweed'},
    {x:55, z:160,type:'briarweed'},{x:275,z:240,type:'briarweed'},
    // Luibh Uisce
    {x:55, z:180,type:'luibhuisce'},{x:240,z:240,type:'luibhuisce'},
    {x:120,z:270,type:'luibhuisce'},{x:260,z:110,type:'luibhuisce'},
  ],
  portalZone:'forest',
  // Legacy aliases — point the v60 globals at this cfg's arrays so all the
  // activeZoneId==='forest' code paths outside this function still work.
  sol:FOREST_SOL, gateArr:FOREST_GATES, enemiesArr:ZE, herbsArr:FOREST_HERBS,
};

function buildForest(){
  buildWildernessZone(DEEPWOOD_CONFIG);
  forestScene=DEEPWOOD_CONFIG.scene;
  _forestTerrainH=DEEPWOOD_CONFIG.getY;
}

// ══════════════════════════════════════════════════════════════
// ── Church exterior builder — shared by buildVillage + buildTown ──────────
function _buildChurchExterior(sc, sol, h, ty){
  const cx=h.x+h.w/2, cz=h.z+h.d/2;
  // v61ae: charred-variant palette. When h.charred is set (currently only
  // 'damaged' — full destroyed would collapse the nave, which we deliberately
  // don't do for the oratory — stone body, older than everything else, still
  // standing), the stone darkens, the roof looks sooted, the wood scorches,
  // and the glass darkens. Cross stays bright — the one visual beat that says
  // "what had been held still holds, here." All geometry stays identical.
  const charred = !!h.charred;
  const stoneMat=new THREE.MeshLambertMaterial({color:charred?0x6a5e52:0x8a8478});
  const darkStoneMat=new THREE.MeshLambertMaterial({color:charred?0x3a332e:0x5a5450});
  const roofMat=new THREE.MeshLambertMaterial({color:charred?0x1e1a16:0x3a3830});
  const woodMat=new THREE.MeshLambertMaterial({color:charred?0x2a1a08:0x5a3a10});
  const glassMat=new THREE.MeshLambertMaterial({color:charred?0x30404a:0x6080a0,transparent:true,opacity:.55,side:THREE.DoubleSide});
  const w=h.w, d=h.d;

  // ── Nave body (stone, taller than normal buildings) ──────────
  const naveH=3.2;
  const nave=new THREE.Mesh(new THREE.BoxGeometry(w,naveH,d),stoneMat);
  nave.position.set(cx,ty+naveH/2,cz);sc.add(nave);

  // ── Steeply pitched gabled roof ──────────────────────────────
  // Two sloped panels meeting at a ridge — more convincing than a scaled cone
  const ridgeH=2.2;
  const roofGeo=new THREE.ConeGeometry(1,ridgeH,4);
  roofGeo.rotateY(Math.PI/4);
  const ridge=new THREE.Mesh(roofGeo,roofMat);
  // Scale X to building width, Z to building depth (cone radius=1 so scale directly)
  ridge.scale.set(w*0.52,1,d*0.52);
  ridge.position.set(cx,ty+naveH+ridgeH/2,cz);
  sc.add(ridge);

  // ── Bell tower — at west end of facade ───────────────────────
  const towerW=h.w*.35, towerD=h.d*.32;
  const towerH=naveH+1.8;
  const towerX=h.x+towerW/2+0.1, towerZ=cz;
  const tower=new THREE.Mesh(new THREE.BoxGeometry(towerW,towerH,towerD),darkStoneMat);
  tower.position.set(towerX,ty+towerH/2,towerZ);sc.add(tower);
  // Tower cap — pyramidal
  const capGeo=new THREE.ConeGeometry(towerW*.75,1.2,4);
  capGeo.rotateY(Math.PI/4);
  const cap=new THREE.Mesh(capGeo,roofMat);
  cap.position.set(towerX,ty+towerH+0.5,towerZ);sc.add(cap);
  // v61y: cross on top of the bell-tower cap — makes the silhouette read
  // unambiguously as "church" from any approach angle, without relying on the
  // gable-face cross that can get lost against the nave roof.
  const towerCrossMat=new THREE.MeshLambertMaterial({color:0xe0d8b0});
  const towerCrossV=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.6,0.09),towerCrossMat);
  towerCrossV.position.set(towerX,ty+towerH+1.4,towerZ); sc.add(towerCrossV);
  const towerCrossH=new THREE.Mesh(new THREE.BoxGeometry(0.36,0.09,0.09),towerCrossMat);
  towerCrossH.position.set(towerX,ty+towerH+1.52,towerZ); sc.add(towerCrossH);
  // Belfry opening (dark recess) — all four sides
  [[0,0,1],[0,0,-1],[1,0,0],[-1,0,0]].forEach(([nx,,nz])=>{
    const slit=new THREE.Mesh(new THREE.BoxGeometry(
      nz!==0?towerW*.45:0.06, 0.5, nz!==0?0.06:towerD*.45),
      new THREE.MeshBasicMaterial({color:0x111111}));
    slit.position.set(towerX+nx*towerD*.51,ty+towerH-.5,towerZ+nz*towerD*.51);
    sc.add(slit);
  });
  // Bell (small sphere inside tower opening)
  const bell=new THREE.Mesh(new THREE.SphereGeometry(0.12,6,5),new THREE.MeshLambertMaterial({color:0x887744}));
  bell.position.set(towerX,ty+towerH-.55,towerZ);sc.add(bell);

  // ── Front door (arched — arch over rectangular door) ─────────
  const dz = h.face==='S'?h.z-.04:h.face==='N'?h.z+d+.04:cz;
  const dx = h.face==='E'?h.x+w+.04:h.face==='W'?h.x-.04:cx;
  const doorW=0.85, doorH=1.7;
  // v61ac: enriched church door to match shop/castle door detail pass. Uses an
  // ecclesiastical motif — iron-banded planks + ring handle + a small cross
  // accent at the top — rather than the shop's plain knob+hinge pattern. Same
  // rotation-by-face approach as the other doorGroups: detail meshes live at
  // local +Z, group rotates so +Z maps to the direction the player approaches.
  const chIronMat=new THREE.MeshLambertMaterial({color:0x2a2428});
  const chDoorGroup=new THREE.Group();
  const chSlab=new THREE.Mesh(new THREE.BoxGeometry(doorW,doorH,0.08),woodMat);
  chDoorGroup.add(chSlab);
  // Vertical planks — three grooves across the wider door
  for(let pg=-1;pg<=1;pg++){
    const plank=new THREE.Mesh(new THREE.BoxGeometry(.02,doorH-.1,.02),chIronMat);
    plank.position.set(pg*(doorW*0.30), 0, 0.05);
    chDoorGroup.add(plank);
  }
  // Horizontal iron bands (top and bottom — sacred doors often have these)
  [doorH*0.35, -doorH*0.35].forEach(by=>{
    const band=new THREE.Mesh(new THREE.BoxGeometry(doorW-.04,.05,.025),chIronMat);
    band.position.set(0, by, 0.05);
    chDoorGroup.add(band);
  });
  // Cross accent — small vertical + horizontal bar near the top, off-white stone color
  const chCrossMat=new THREE.MeshLambertMaterial({color:0xccc0a0});
  const chCrossV=new THREE.Mesh(new THREE.BoxGeometry(.04,.22,.02),chCrossMat);
  chCrossV.position.set(0, doorH*0.18, 0.06); chDoorGroup.add(chCrossV);
  const chCrossH=new THREE.Mesh(new THREE.BoxGeometry(.16,.04,.02),chCrossMat);
  chCrossH.position.set(0, doorH*0.22, 0.06); chDoorGroup.add(chCrossH);
  // Ring handle — matches castle in feel, smaller in scale
  const chRing=new THREE.Mesh(new THREE.TorusGeometry(.06,.015,6,12),chIronMat);
  chRing.rotation.x=Math.PI/2;
  chRing.position.set(doorW*0.28, -doorH*0.08, 0.08); chDoorGroup.add(chRing);
  const chRingPlate=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.02,8),chIronMat);
  chRingPlate.rotation.x=Math.PI/2;
  chRingPlate.position.set(doorW*0.28, -doorH*0.08, 0.06); chDoorGroup.add(chRingPlate);
  // Position + orient per face (same rotation math as the shop/village doors)
  chDoorGroup.position.set(dx,ty+doorH/2,dz);
  if(h.face==='S') chDoorGroup.rotation.y=Math.PI;
  else if(h.face==='E') chDoorGroup.rotation.y=Math.PI/2;
  else if(h.face==='W') chDoorGroup.rotation.y=-Math.PI/2;
  // N-face keeps rotation=0
  sc.add(chDoorGroup);
  // Stone arch above door
  const archGeo=new THREE.TorusGeometry(doorW*.52,0.12,6,10,Math.PI);
  const arch=new THREE.Mesh(archGeo,darkStoneMat);
  arch.position.set(dx,ty+doorH,dz);
  if(h.face==='E'||h.face==='W')arch.rotation.y=Math.PI/2;
  sc.add(arch);

  // ── Lancet windows — tall narrow, on side walls ───────────────
  // v61ab: glass was rendering as grey because (a) the glassMat color is a dim
  // 0x6080a0 blue-grey and (b) frame and glass sat at identical world coords,
  // so the dark-stone frame z-fought the glass into opacity. Fix: give lancet
  // glass its own vibrant color (stained-glass blue) and offset the glass pane
  // 0.03u outward from the frame so they don't overlap.
  const lancetGlassMat=new THREE.MeshLambertMaterial({color:0x5a8ec8,transparent:true,opacity:.7,side:THREE.DoubleSide});
  const winH=0.75, winW=0.22;
  function _lancet(wx,wy,wz,ry,outDir){
    const offX=ry===0?0:(outDir||0)*0.03;
    const offZ=ry===0?(outDir||0)*0.03:0;
    const frame=new THREE.Mesh(new THREE.BoxGeometry(
      ry===0?winW+0.1:0.1, winH+0.12, ry===0?0.1:winW+0.1),darkStoneMat);
    frame.position.set(wx,wy,wz);sc.add(frame);
    const glass=new THREE.Mesh(new THREE.BoxGeometry(
      ry===0?winW:0.07, winH, ry===0?0.07:winW),lancetGlassMat);
    glass.position.set(wx+offX,wy,wz+offZ);sc.add(glass);
    // Pointed top (small triangle cap)
    const ptGeo=new THREE.ConeGeometry(winW*.55,winW*.6,3);
    const pt=new THREE.Mesh(ptGeo,darkStoneMat);
    pt.position.set(wx,wy+winH/2+winW*.25,wz);
    if(ry!==0)pt.rotation.y=ry;
    sc.add(pt);
  }
  const wyBase=ty+naveH*.55;
  // South wall windows (if door isn't there)
  if(h.face!=='S'){_lancet(cx-w*.22,wyBase,h.z-.04,0,-1);_lancet(cx+w*.22,wyBase,h.z-.04,0,-1);}
  // North wall
  if(h.face!=='N'){_lancet(cx-w*.22,wyBase,h.z+d+.04,0,+1);_lancet(cx+w*.22,wyBase,h.z+d+.04,0,+1);}
  // East wall
  if(h.face!=='E'){_lancet(h.x+w+.04,wyBase,cz,Math.PI/2,+1);}
  // West wall (skip tower zone)
  if(h.face!=='W'){_lancet(h.x-.04,wyBase,cz+d*.2,Math.PI/2,-1);}

  // ── v61z: previously a "gable cross" sat on the door face. Removed because
  // the church uses a 4-sided pyramidal cone roof (not a true gabled roof), so
  // there's no triangular gable wall for the cross to embed into — it floated
  // in empty space in front of the nave. The v61y tower cross on the bell-tower
  // cap already covers silhouette readability from any approach angle.

  // ── Stone step up to door ─────────────────────────────────────
  const stepMat=new THREE.MeshLambertMaterial({color:0x9a9080});
  const step=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.12,0.45),stepMat);
  step.position.set(dx+(h.face==='E'?.22:h.face==='W'?-.22:0),
                    ty+.06,
                    dz+(h.face==='S'?-.22:h.face==='N'?.22:0));
  if(h.face==='E'||h.face==='W')step.rotation.y=Math.PI/2;
  sc.add(step);

  // ── Ambient candle glow through windows ───────────────────────
  // v61ae: charred variant dims the candle (one candle still burning, not
  // the full lamp array; Oswin lit only what he could reach). Slightly warm-
  // er tone than normal — nearly ember.
  const candleGlow=new THREE.PointLight(charred?0xcc8844:0xffd080, charred?.28:.5, charred?3.2:4.5);
  candleGlow.position.set(cx,ty+1.8,cz);sc.add(candleGlow);

  // v61ae: charred scorch-mark decals and a thin smoke plume on the roof.
  // Applied only to the damaged variant. The geometry stays identical so
  // the silhouette still reads as "church" from distance — we're just
  // tinting the surfaces and adding scorch rectangles on the visible walls.
  if(charred){
    const scorchMat=new THREE.MeshLambertMaterial({color:0x0e0a08});
    // Scorch streaks rising from the ground on each exposed wall face.
    // Two streaks per face, asymmetric, for a weathered read.
    const _streak=(x,y,z,ax,ay,az,sw,sh,rotY)=>{
      const s=new THREE.Mesh(new THREE.BoxGeometry(sw,sh,.02),scorchMat);
      s.position.set(x,y,z);
      if(rotY!=null)s.rotation.y=rotY;
      sc.add(s);
    };
    // South face (the facade with the door) — two flanking streaks
    _streak(cx-w*0.30, ty+1.2, h.z-0.06, 0,0,0, w*0.18, 2.2, 0);
    _streak(cx+w*0.32, ty+1.0, h.z-0.06, 0,0,0, w*0.14, 1.8, 0);
    // East face
    _streak(h.x+w+0.06, ty+1.1, cz-d*0.18, 0,0,0, d*0.22, 2.0, Math.PI/2);
    // West face (nave side only — tower takes the other half)
    _streak(h.x-0.06, ty+1.3, cz+d*0.22, 0,0,0, d*0.20, 2.0, -Math.PI/2);
    // North face — one wide streak
    _streak(cx+w*0.10, ty+1.0, h.z+d+0.06, 0,0,0, w*0.30, 2.0, 0);

    // Cracked lancet window — render a dark "crack line" running through one
    // of the glass panes on the south face. Just a thin dark bar, sufficient
    // at silhouette scale.
    const crackMat=new THREE.MeshLambertMaterial({color:0x1a1614});
    const crack=new THREE.Mesh(new THREE.BoxGeometry(.035,.9,.04),crackMat);
    crack.position.set(cx-w*0.30, ty+1.9, h.z-0.03);
    crack.rotation.z = 0.15;
    sc.add(crack);

    // Smoke wisp on the roof ridge — lighter than the destroyed-building
    // plumes (the nave is still holding, the smoke is escaping slowly).
    // Not animated — the oratory's fire is out, this is residual. Single
    // small slab.
    const wispMat=new THREE.MeshLambertMaterial({color:0x5a5450, transparent:true, opacity:0.35});
    const wisp=new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 1.4, 8, 1, true), wispMat);
    wisp.position.set(cx+0.2, ty+5.3, cz+0.1);
    sc.add(wisp);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// TOWN CONFIG SYSTEM  —  buildTown(config)
// ══════════════════════════════════════════════════════════════════════════
//
// Config schema (extends village schema):
// {
//   id, name, size, musicTrack         — same as buildVillage
//   fortressX, fortressZ               — fortress center in zone coords
//   fortressR                          — clearing radius (inner stone plaza)
//   forestR                            — outer forested ring inner radius
//   wallExtent                         — half-width of stone wall square
//   gateX, gateZ, gateTarget etc       — same as buildVillage
//   buildings    : [{x,z,w,d,face,id,type}]  — local coords (0,0 = fortressX-wallExtent)
//   npcs         : [{x,z,name,role,ico,...}]  — local coords
//   marketStalls : [{x,z,face}]              — local coords
//   herbSpawns   : [{x,z,type}]              — world coords
//   dungeonZone  : string
//   skyCol, fogColor, fogDensity
//   detailFn(sc,sol,getY,FX,FZ,FO)    — handcrafted extras, FO=fortress offset
//   decorateFn(sc,sol,h,ty,getY)       — per-building extras
//   sol, npcs, herbs, gates            — runtime arrays (populated during build)
// }

function buildTown(cfg){
  const SZ=cfg.size||200;
  const FX=cfg.fortressX||SZ/2, FZ=cfg.fortressZ||SZ/2;
  const FEXT=cfg.wallExtent||35;        // half-side of walled area
  const FOFF_X=FX-FEXT, FOFF_Z=FZ-FEXT; // world offset of local (0,0)
  const forestR=cfg.forestR||58;
  const fortressR=cfg.fortressR||30;
  // v61e: multi-gate towns. `cfg.gates` is the canonical input (array of
  // {x,z,targetZone,spawnX,spawnZ,spawnYaw,label}); legacy `cfg.gateX`/
  // `cfg.gateZ`/`cfg.gateTarget` are still accepted and synthesized into
  // a single south-edge gate for backward compatibility with Ironhaven.
  // Each gate is tagged with its side (S/N/E/W) from its zone-edge
  // position, so walls, archways, and approach roads can be built per-gate.
  const _townGateDefs = cfg.gates ? cfg.gates.slice() : [];
  if (cfg.gateX != null && !cfg.gates) {
    _townGateDefs.push({
      x:cfg.gateX, z:cfg.gateZ!=null?cfg.gateZ:3,
      targetZone:cfg.gateTarget,
      spawnX:cfg.gateSpawnX, spawnZ:cfg.gateSpawnZ, spawnYaw:cfg.gateSpawnYaw,
      label:cfg.gateLabel||cfg.gateTarget,
    });
  }
  _townGateDefs.forEach(g => {
    if      (g.z <= 6)    g._side = 'S';
    else if (g.z >= SZ-6) g._side = 'N';
    else if (g.x <= 6)    g._side = 'W';
    else if (g.x >= SZ-6) g._side = 'E';
    else                  g._side = 'S'; // fallback — gate not at edge
  });
  // townGates collects the runtime entries (with mesh refs); populated
  // below by the per-gate entry loop. Don't reuse cfg.gates — it's the
  // input spec, not the runtime state.
  const townGates = [];
  const sol=cfg.sol||[];
  const npcs=cfg.npcs||[];
  const herbArr=cfg.herbs||[];

  const tScene=new THREE.Scene();
  tScene.background=new THREE.Color(cfg.skyCol||0x6a8aa0);
  tScene.fog=new THREE.FogExp2(cfg.fogColor||0x7a9ab8,cfg.fogDensity||.006);
  const sun=new THREE.DirectionalLight(0xfff0d0,1.4);sun.position.set(80,160,60);tScene.add(sun);
  const _tAmb=new THREE.AmbientLight(0x9ab8d0,.7);tScene.add(_tAmb);
  const _tHemi=new THREE.HemisphereLight(0xaaccee,0x556644,.5);tScene.add(_tHemi);
  // v61e7 — Day/Night Session B: town is a settlement → universal night palette.
  if(typeof instrumentSceneForDayNight === 'function'){
    instrumentSceneForDayNight(tScene, {sun, ambient:_tAmb, hemi:_tHemi, fog:tScene.fog}, {
      skyCol: cfg.skyCol||0x6a8aa0,
      fogColor: cfg.fogColor||0x7a9ab8,
      fogDensity: cfg.fogDensity||.006,
      sunCol: 0xfff0d0, sunInt: 1.4,
      ambientCol: 0x9ab8d0, ambientInt: .7,
      hemiInt: .5,
    }, cfg.region||null, true);
  }

  // ── Town terrain — hillock under fortress, outer forest ───────
  const T_SEGS=48;
  const _tH=new Float32Array((T_SEGS+1)*(T_SEGS+1));
  const flatInner=cfg.hillH||0.8; // constant height inside walls
  for(let iz=0;iz<=T_SEGS;iz++){for(let ix=0;ix<=T_SEGS;ix++){
    const wx=(ix/T_SEGS)*SZ,wz=(iz/T_SEGS)*SZ;
    const dist=Math.hypot(wx-FX,wz-FZ);
    // Inside walled area (FEXT radius) — perfectly flat at hillH
    // Transition zone from wall edge to forestR — cosine blend to 0
    // Beyond forestR — outer noise terrain
    const wallR=FEXT*Math.SQRT2; // diagonal of square = conservative flat radius
    const hillH=dist<wallR?flatInner:
                dist>80?0:flatInner*(1-0.5*(1-Math.cos(Math.PI*(dist-wallR)/(80-wallR))));
    const outerF=Math.max(0,Math.min(1,(dist-(forestR-5))/15));
    const noise=(_smoothNoise(wx,wz,cfg.seed||4421,60)*.9+_smoothNoise(wx,wz,(cfg.seed||4421)+1,22)*.35)*outerF;
    _tH[iz*(T_SEGS+1)+ix]=hillH+noise;
  }}
  function tGetY(wx,wz){
    const nx=Math.max(0,Math.min(SZ,wx)),nz=Math.max(0,Math.min(SZ,wz));
    const gx=(nx/SZ)*T_SEGS,gz=(nz/SZ)*T_SEGS;
    const ix=Math.floor(gx),iz=Math.floor(gz);
    const fx=gx-ix,fz=gz-iz;
    const i00=iz*(T_SEGS+1)+ix,i10=iz*(T_SEGS+1)+(ix+1);
    const i01=(iz+1)*(T_SEGS+1)+ix,i11=(iz+1)*(T_SEGS+1)+(ix+1);
    const s=i=>(_tH[i]||0);
    return s(i00)*(1-fx)*(1-fz)+s(i10)*fx*(1-fz)+s(i01)*(1-fx)*fz+s(i11)*fx*fz;
  }
  cfg.getY=tGetY; cfg._size=SZ;
  if(cfg.registerTerrainH)cfg.registerTerrainH(tGetY);

  // ── Ground meshes ─────────────────────────────────────────────
  const outerTex=mkTex((x,w,h)=>{x.fillStyle='#4a6a3a';x.fillRect(0,0,w,h);for(let i=0;i<600;i++){x.fillStyle=`hsl(${100+Math.random()*25},${35+Math.random()*20}%,${18+Math.random()*12}%)`;x.fillRect(Math.random()*w,Math.random()*h,Math.random()*4+1,Math.random()*3+1);}});
  outerTex.repeat.set(30,30);
  const tGeo=new THREE.PlaneGeometry(SZ,SZ,T_SEGS,T_SEGS);
  tGeo.rotateX(-Math.PI/2);
  const tPos=tGeo.attributes.position;
  for(let i=0;i<tPos.count;i++){const wx=tPos.getX(i)+SZ/2,wz=tPos.getZ(i)+SZ/2;tPos.setY(i,tGetY(wx,wz));}
  tGeo.computeVertexNormals();
  const outerGnd=new THREE.Mesh(tGeo,new THREE.MeshLambertMaterial({map:outerTex}));
  outerGnd.position.set(SZ/2,0,SZ/2);tScene.add(outerGnd);

  // Inner stone plaza
  const stoneTex=mkTex((x,w,h)=>{x.fillStyle='#7a7870';x.fillRect(0,0,w,h);for(let r=0;r<h;r+=16)for(let c=0;c<w;c+=20){x.strokeStyle='rgba(0,0,0,.3)';x.lineWidth=1;x.strokeRect(c+(r%32<16?8:0),r,18,14);}for(let i=0;i<80;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.1})`;x.fillRect(Math.random()*w,Math.random()*h,Math.random()*4,Math.random()*4);}});
  stoneTex.repeat.set(10,10);
  const bY=tGetY(FX,FZ);
  const innerGnd=new THREE.Mesh(new THREE.PlaneGeometry(FEXT*2,FEXT*2),new THREE.MeshLambertMaterial({map:stoneTex}));
  innerGnd.rotation.x=-Math.PI/2;innerGnd.position.set(FX,bY+.02,FZ);tScene.add(innerGnd);

  // ── Skyring ───────────────────────────────────────────────────
  const skCV=document.createElement('canvas');skCV.width=1024;skCV.height=256;const skx=skCV.getContext('2d');
  const skg=skx.createLinearGradient(0,0,0,256);skg.addColorStop(0,'#5a80a8');skg.addColorStop(.5,'#7aaac8');skg.addColorStop(1,'#9abcc8');skx.fillStyle=skg;skx.fillRect(0,0,1024,256);
  skx.fillStyle='#6a8aaa';for(let i=0;i<10;i++){const bx2=i*100+Math.random()*40,bh=60+Math.random()*100;skx.fillRect(bx2,256-bh,60+Math.random()*40,bh);}
  const skRing=new THREE.Mesh(new THREE.CylinderGeometry(SZ*1.1,SZ*1.1,150,32,1,true),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(skCV),side:THREE.BackSide,fog:false}));
  skRing.position.set(SZ/2,40,SZ/2);tScene.add(skRing);

  // ── Material palette ──────────────────────────────────────────
  const stoneMat=new THREE.MeshLambertMaterial({color:0x787870});
  const darkStoneMat=new THREE.MeshLambertMaterial({color:0x505048});
  const woodMat2=new THREE.MeshLambertMaterial({color:0x6a4020});
  const roofMat2=new THREE.MeshLambertMaterial({color:cfg.roofColor||0x404858});

  // ── Outer forested ring ───────────────────────────────────────
  const fTreeMat=new THREE.MeshLambertMaterial({color:0x2a1808});
  function mkTree(x,z){
    const ty=tGetY(x,z);
    const h=5+Math.random()*5,r=2+Math.random()*1.4;
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(r*.14,r*.2,h*.5,7),fTreeMat);
    trunk.position.set(x,ty+h*.25,z);tScene.add(trunk);
    const canCol=new THREE.Color().setHSL(.28+Math.random()*.1,.5,.12+Math.random()*.08);
    const can=new THREE.Mesh(new THREE.ConeGeometry(r,h*.7,7),new THREE.MeshLambertMaterial({color:canCol}));
    can.position.set(x,ty+h*.5+h*.28,z);tScene.add(can);
    sol.push({cx:x,cz:z,rx:r*.35+.3,rz:r*.35+.3});
  }
  function _nearApproach(x,z){
    // v61e: true if (x,z) is inside any gate's approach corridor.
    for (const g of _townGateDefs) {
      if (g._side === 'S' && Math.abs(x-g.x)<10 && z>0      && z<FOFF_Z+4)              return true;
      if (g._side === 'N' && Math.abs(x-g.x)<10 && z<SZ     && z>FOFF_Z+FEXT*2-4)       return true;
      if (g._side === 'W' && Math.abs(z-g.z)<10 && x>0      && x<FOFF_X+4)              return true;
      if (g._side === 'E' && Math.abs(z-g.z)<10 && x<SZ     && x>FOFF_X+FEXT*2-4)       return true;
    }
    return false;
  }
  for(let gx=8;gx<SZ-8;gx+=9){for(let gz=8;gz<SZ-8;gz+=9){
    const dist=Math.hypot(gx-FX,gz-FZ);
    if(dist<forestR||_nearApproach(gx,gz))continue;
    const count=1+Math.floor(Math.random()*2);
    for(let c=0;c<count;c++){
      const tx=gx+(Math.random()-.5)*6,tz=gz+(Math.random()-.5)*6;
      if(tx<6||tx>SZ-6||tz<6||tz>SZ-6)continue;
      if(Math.hypot(tx-FX,tz-FZ)<forestR-2||_nearApproach(tx,tz))continue;
      mkTree(tx,tz);
    }
  }}

  // ── Border hedge wall ─────────────────────────────────────────
  const ihHedgeMat=new THREE.MeshLambertMaterial({color:0x1a3a10});
  function ihHedge(x,z){
    // v61e: skip hedge if this point is inside any gate's perimeter gap,
    // on whichever edge the gate sits.
    for (const g of _townGateDefs) {
      if (g._side === 'S' && Math.abs(x-g.x)<5 && z<6)    return;
      if (g._side === 'N' && Math.abs(x-g.x)<5 && z>SZ-6) return;
      if (g._side === 'W' && Math.abs(z-g.z)<5 && x<6)    return;
      if (g._side === 'E' && Math.abs(z-g.z)<5 && x>SZ-6) return;
    }
    const ty=tGetY(x,z);
    const w=1.8+Math.random()*.7,h=1.2+Math.random()*.5,d=1.3+Math.random()*.4;
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),ihHedgeMat);
    body.position.set(x,ty+h/2,z);tScene.add(body);
    for(let l=0;l<2;l++){const lump=new THREE.Mesh(new THREE.SphereGeometry(.45+Math.random()*.15,5,4),new THREE.MeshLambertMaterial({color:0x112808}));lump.scale.set(1,.6,1);lump.position.set(x+(Math.random()-.5)*.6,ty+h*.85,z+(Math.random()-.5)*.4);tScene.add(lump);}
  }
  const ihBS=3.0,ihBM=1.5;
  for(let x=ihBM;x<SZ-ihBM;x+=ihBS){ihHedge(x,ihBM);ihHedge(x,SZ-ihBM);}
  for(let z=ihBM+ihBS;z<SZ-ihBM-ihBS;z+=ihBS){ihHedge(ihBM,z);ihHedge(SZ-ihBM,z);}

  // ── Outer grass & bushes ──────────────────────────────────────
  const ihGrassMat=new THREE.MeshLambertMaterial({color:0x3a6a1a,side:THREE.DoubleSide});
  const ihBushMat=new THREE.MeshLambertMaterial({color:0x1a3a10});
  for(let i=0;i<280;i++){
    const gx=8+Math.random()*(SZ-16),gz=8+Math.random()*(SZ-16);
    if(Math.hypot(gx-FX,gz-FZ)<forestR-5)continue;
    if(_nearApproach(gx,gz))continue;
    const ty=tGetY(gx,gz);
    if(Math.random()<.6){
      for(let b=0;b<3;b++){const bx=gx+(Math.random()-.5)*.5,bz=gz+(Math.random()-.5)*.5,h=.2+Math.random()*.15;const blade=new THREE.Mesh(new THREE.PlaneGeometry(.08,h),ihGrassMat);blade.position.set(bx,tGetY(bx,bz)+h/2,bz);blade.rotation.y=Math.random()*Math.PI;tScene.add(blade);}
    } else {
      const r=.22+Math.random()*.18;const body=new THREE.Mesh(new THREE.SphereGeometry(r,5,4),ihBushMat);body.scale.set(1,.65,1);body.position.set(gx,ty+r*.5,gz);tScene.add(body);
    }
  }

  // ── Stone perimeter walls ──────────────────────────────────────
  // v61e: multi-gate-aware. Each fortress wall is split into segments
  // around every gate on that side. Walls with no gates render as a
  // single solid box (preserves single-gate Ironhaven's footprint).
  const wallH=cfg.wallH||3.2;
  const _gatesBySide = {S:[], N:[], E:[], W:[]};
  _townGateDefs.forEach(g => _gatesBySide[g._side].push(g));

  function _drawWall(sideKey, axisStart, axisEnd, perpPos, xVariesAlongWall) {
    const gapCoords = _gatesBySide[sideKey]
      .map(g => xVariesAlongWall ? g.x : g.z)
      .sort((a,b) => a - b);
    let segStart = axisStart;
    const _emit = (s, e) => {
      if (e <= s) return;
      const len = e - s, mid = (s + e) / 2;
      const geom = xVariesAlongWall
        ? new THREE.BoxGeometry(len, wallH, 1)
        : new THREE.BoxGeometry(1, wallH, len);
      const wall = new THREE.Mesh(geom, stoneMat);
      const wx = xVariesAlongWall ? mid : perpPos;
      const wz = xVariesAlongWall ? perpPos : mid;
      wall.position.set(wx, bY + wallH/2, wz);
      tScene.add(wall);
      sol.push({cx:wx, cz:wz, rx:xVariesAlongWall?len/2:.5, rz:xVariesAlongWall?.5:len/2});
    };
    gapCoords.forEach(gc => { _emit(segStart, gc - 3.1); segStart = gc + 3.1; });
    _emit(segStart, axisEnd);
  }

  _drawWall('S', FOFF_X, FOFF_X+FEXT*2, FOFF_Z+2,           true);
  _drawWall('N', FOFF_X, FOFF_X+FEXT*2, FOFF_Z+FEXT*2-2,    true);
  _drawWall('W', FOFF_Z, FOFF_Z+FEXT*2, FOFF_X+2,           false);
  _drawWall('E', FOFF_Z, FOFF_Z+FEXT*2, FOFF_X+FEXT*2-2,    false);

  // ── Corner towers ─────────────────────────────────────────────
  [[FOFF_X+2,FOFF_Z+2],[FOFF_X+FEXT*2-2,FOFF_Z+2],[FOFF_X+2,FOFF_Z+FEXT*2-2],[FOFF_X+FEXT*2-2,FOFF_Z+FEXT*2-2]].forEach(([tx,tz])=>{
    const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.7,1.9,4.2,8),stoneMat);
    tower.position.set(tx,bY+2.1,tz);tScene.add(tower);
    const batt=new THREE.Mesh(new THREE.CylinderGeometry(1.8,1.8,0.55,8),darkStoneMat);
    batt.position.set(tx,bY+4.48,tz);tScene.add(batt);
    for(let ci=0;ci<6;ci++){const ang=ci*(Math.PI*2/6);const cren=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.6,0.5),darkStoneMat);cren.position.set(tx+Math.sin(ang)*1.65,bY+5.0,tz+Math.cos(ang)*1.65);tScene.add(cren);}
    const tLight=new THREE.PointLight(0xffaa44,.6,7);tLight.position.set(tx,bY+4.2,tz);tScene.add(tLight);
    sol.push({cx:tx,cz:tz,rx:2.1,rz:2.1});
  });

  // ── Gate archways (one per gate) ──────────────────────────────
  // v61e: each fortress-wall opening gets pillars, lintel, merlons, and
  // doors oriented on the appropriate wall. Fortress-wall coords are
  // projected from the outer gate's side.
  _townGateDefs.forEach(g => {
    const horiz = (g._side === 'S' || g._side === 'N'); // wall spans X
    const wallX = horiz ? g.x : (g._side === 'W' ? FOFF_X+2 : FOFF_X+FEXT*2-2);
    const wallZ = horiz ? (g._side === 'S' ? FOFF_Z+2 : FOFF_Z+FEXT*2-2) : g.z;

    // Pillars — offset along the wall's axis.
    const offA = horiz ? -2.5 : 0;
    const offB = horiz ? 2.5  : 0;
    const offC = horiz ? 0    : -2.5;
    const offD = horiz ? 0    : 2.5;
    const pilL=new THREE.Mesh(new THREE.BoxGeometry(1.2,3.6,1.0),stoneMat);
    pilL.position.set(wallX+offA, bY+1.8, wallZ+offC); tScene.add(pilL);
    sol.push({cx:wallX+offA, cz:wallZ+offC, rx:.7, rz:.6});
    const pilR=new THREE.Mesh(new THREE.BoxGeometry(1.2,3.6,1.0),stoneMat);
    pilR.position.set(wallX+offB, bY+1.8, wallZ+offD); tScene.add(pilR);
    sol.push({cx:wallX+offB, cz:wallZ+offD, rx:.7, rz:.6});

    // Lintel — oriented along the wall axis.
    const lintel = new THREE.Mesh(
      horiz ? new THREE.BoxGeometry(6.0,0.9,1.0) : new THREE.BoxGeometry(1.0,0.9,6.0),
      stoneMat
    );
    lintel.position.set(wallX, bY+3.85, wallZ);
    tScene.add(lintel);

    // Merlons across the top.
    for (let ci=-2; ci<=2; ci++) {
      const cren = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.55,0.6), darkStoneMat);
      if (horiz) cren.position.set(wallX+ci*1.1, bY+4.58, wallZ);
      else       cren.position.set(wallX,         bY+4.58, wallZ+ci*1.1);
      tScene.add(cren);
    }

    // Doors — two leaves swinging inward toward the fortress interior.
    [-1,1].forEach(dside => {
      const doorGeom = horiz
        ? new THREE.BoxGeometry(0.08,2.4,1.8)
        : new THREE.BoxGeometry(1.8,2.4,0.08);
      const door2 = new THREE.Mesh(doorGeom, woodMat2);
      const pivot = new THREE.Group();
      if (horiz) pivot.position.set(wallX+dside*1.9, bY+1.2, wallZ);
      else       pivot.position.set(wallX,           bY+1.2, wallZ+dside*1.9);
      door2.rotation.y = -dside*1.1;
      pivot.add(door2);
      const barGeom = horiz
        ? new THREE.BoxGeometry(0.1,0.1,1.6)
        : new THREE.BoxGeometry(1.6,0.1,0.1);
      const bar = new THREE.Mesh(barGeom, new THREE.MeshLambertMaterial({color:0x444444}));
      bar.position.set(0, .5, 0);
      bar.rotation.y = -dside*1.1;
      pivot.add(bar);
      tScene.add(pivot);
    });
  });

  // ── Buildings (local coords → world via FOFF) ─────────────────
  function mkStoneBuilding(h){
    const ox=h.x+FOFF_X,oz=h.z+FOFF_Z;
    const cx=ox+h.w/2,cz2=oz+h.d/2;
    const ty=tGetY(cx,cz2);
    if(h.type==='church'){
      _buildChurchExterior(tScene,sol,{...h,x:ox,z:oz},ty);
    } else if(h.type==='castle'){
      // v61z: castle is rendered entirely by detailFn (keep mesh + courtyard walls
      // + inner towers + arch + keep door). mkStoneBuilding previously drew a
      // generic stone box + cone roof + door on top of that, producing the
      // overlapping-mesh artifact Michael flagged (two doors at the same spot,
      // castle box containing keep box). Skip all generic rendering for castles —
      // detailFn has full ownership. Still register a collider roughly sized to
      // the building footprint so the player can't walk through the castle wall.
      sol.push({cx,cz:cz2,rx:h.w/2+.2,rz:h.d/2+.2});
      return; // also skip decorateFn for castle — no sign, no sconces
    } else {
      // v61y: pull per-building body color from IRONHAVEN_HOUSES if available
      // (other zones don't define bCol yet, so this is Ironhaven-specific for now).
      // Previously every shop rendered in the same grey stoneMat — castle-adjacent
      // shops were visually indistinguishable from their own wall backdrop.
      let bodyMat = stoneMat;
      if(typeof IRONHAVEN_HOUSES!=='undefined'){
        const ihDef = IRONHAVEN_HOUSES.find(x=>x.id===h.id);
        if(ihDef && ihDef.bCol!==undefined){
          bodyMat = new THREE.MeshLambertMaterial({color:ihDef.bCol});
        }
      }
      const body=new THREE.Mesh(new THREE.BoxGeometry(h.w,2.6,h.d),bodyMat);
      body.position.set(cx,ty+1.3,cz2);tScene.add(body);
      const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(h.w,h.d)*.78,1.4,4),roofMat2);
      roof.position.set(cx,ty+3.2,cz2);roof.rotation.y=Math.PI/4;tScene.add(roof);
      // v61aa: enriched door — planks + iron knob + corner plates. The bare
      // box read as "a rectangle painted brown on the wall"; adding surface
      // detail grounds it as a physical door that opens inward. Pattern reused
      // by the castle keep door below.
      const ironMat=new THREE.MeshLambertMaterial({color:0x222228});
      const doorGroup=new THREE.Group();
      // Main slab (slightly proud of wall at 0.08 thickness)
      const doorSlab=new THREE.Mesh(new THREE.BoxGeometry(.75,1.5,.08),woodMat2);
      doorGroup.add(doorSlab);
      // Three vertical plank grooves (thin dark strips along the front face)
      for(let pg=-1;pg<=1;pg++){
        const plank=new THREE.Mesh(new THREE.BoxGeometry(.015,1.42,.02),ironMat);
        plank.position.set(pg*0.23, 0, 0.05);
        doorGroup.add(plank);
      }
      // Iron knob — sphere on small stem
      const knobStem=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.04,6),ironMat);
      knobStem.rotation.x=Math.PI/2;
      knobStem.position.set(.26, -0.05, 0.06); doorGroup.add(knobStem);
      const knob=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),ironMat);
      knob.position.set(.26, -0.05, 0.10); doorGroup.add(knob);
      // Two iron hinge plates on the opposite side
      [0.55, -0.55].forEach(ry=>{
        const hinge=new THREE.Mesh(new THREE.BoxGeometry(.12,.06,.02),ironMat);
        hinge.position.set(-.30, ry, 0.05); doorGroup.add(hinge);
      });
      // Position & orient the whole group per door face. The detail meshes
      // (planks, knob, hinges) are all placed at local +Z — so we rotate the
      // group so that local +Z points AWAY from the building (toward the player).
      // v61ab: S-face was rotation=0, which made local +Z face INTO the wall —
      // all the detail was hidden behind the slab, making S/N doors read as
      // bare brown rectangles. N-face was also backward for the same reason.
      //   S-face: player is south of building (−Z), details need to face −Z → rotate 180°
      //   N-face: player is north of building (+Z), details already face +Z → rotate 0°
      //   E-face: player is east  (+X), local +Z → +X requires +90°
      //   W-face: player is west  (−X), local +Z → −X requires −90°
      if(h.face==='S'){doorGroup.position.set(cx,ty+.75,oz-.05); doorGroup.rotation.y=Math.PI;}
      else if(h.face==='N'){doorGroup.position.set(cx,ty+.75,oz+h.d+.05);}
      else if(h.face==='E'){doorGroup.rotation.y=Math.PI/2; doorGroup.position.set(ox+h.w+.05,ty+.75,cz2);}
      else{doorGroup.rotation.y=-Math.PI/2; doorGroup.position.set(ox-.05,ty+.75,cz2);}
      tScene.add(doorGroup);
      // v61aa: windows now mirror Ashenmoor's _win helper — sky-blue glass that
      // reads clearly against dark stone bodies, plus a proper cross-mullion
      // (horizontal bar + vertical bar) instead of the single vertical mullion
      // that made v61z windows read as "grey boxes." Glass sits recessed 1.5× the
      // frame offset so it catches light from a distance.
      const winFrameMat=new THREE.MeshLambertMaterial({color:0x4a4238});
      const winGlassMat=new THREE.MeshLambertMaterial({color:0x5ec8e8,transparent:true,opacity:.55,side:THREE.DoubleSide});
      function _winStone(wx,wy,wz,ry,outDir){
        const offX=ry===0?0:outDir*0.08, offZ=ry===0?outDir*0.08:0;
        const fr=new THREE.Mesh(new THREE.BoxGeometry(.56,.50,.06),winFrameMat);
        fr.position.set(wx+offX,wy,wz+offZ); fr.rotation.y=ry; tScene.add(fr);
        const gl=new THREE.Mesh(new THREE.BoxGeometry(.40,.34,.04),winGlassMat);
        gl.position.set(wx+offX*1.5,wy,wz+offZ*1.5); gl.rotation.y=ry; tScene.add(gl);
        const mh=new THREE.Mesh(new THREE.BoxGeometry(.40,.05,.07),winFrameMat);
        mh.position.set(wx+offX*1.5,wy,wz+offZ*1.5); mh.rotation.y=ry; tScene.add(mh);
        const mv=new THREE.Mesh(new THREE.BoxGeometry(.05,.34,.07),winFrameMat);
        mv.position.set(wx+offX*1.5,wy,wz+offZ*1.5); mv.rotation.y=ry; tScene.add(mv);
      }
      const wy=ty+1.45;
      if(h.face!=='S') _winStone(cx, wy, oz,      0,        -1);
      if(h.face!=='N') _winStone(cx, wy, oz+h.d,  0,        +1);
      if(h.face!=='E') _winStone(ox+h.w, wy, cz2, Math.PI/2, +1);
      if(h.face!=='W') _winStone(ox,     wy, cz2, Math.PI/2, -1);
    }
    sol.push({cx,cz:cz2,rx:h.w/2+.2,rz:h.d/2+.2});
    if(cfg.decorateFn)cfg.decorateFn(tScene,sol,{...h,x:ox,z:oz,doorX:cx,doorZ:cz2},ty,tGetY);
  }
  (cfg.buildings||[]).forEach(mkStoneBuilding);

  // ── Market stalls ─────────────────────────────────────────────
  const canvasMats=[
    new THREE.MeshLambertMaterial({color:0xd04828}), // red
    new THREE.MeshLambertMaterial({color:0x4878c0}), // blue
    new THREE.MeshLambertMaterial({color:0x48a848}), // green
    new THREE.MeshLambertMaterial({color:0xd0a828}), // gold
    new THREE.MeshLambertMaterial({color:0xa848a8}), // purple
  ];
  const stallWoodMat=new THREE.MeshLambertMaterial({color:0x7a5028});
  const stallCounterMat=new THREE.MeshLambertMaterial({color:0x5a3818});
  function mkMarketStall(lx,lz,face,colIdx){
    const wx=lx+FOFF_X, wz=lz+FOFF_Z;
    const ty=tGetY(wx,wz);
    const canvasMat=canvasMats[colIdx%canvasMats.length];
    // Four posts
    const postH=2.2;
    [[-0.9,-.7],[0.9,-.7],[-0.9,.7],[0.9,.7]].forEach(([px,pz])=>{
      const post=new THREE.Mesh(new THREE.BoxGeometry(.08,postH,.08),stallWoodMat);
      post.position.set(wx+(face==='E'||face==='W'?pz:px),ty+postH/2,wz+(face==='E'||face==='W'?px:pz));
      tScene.add(post);
    });
    // Canopy (slanted slightly toward front)
    const canopy=new THREE.Mesh(new THREE.BoxGeometry(face==='E'||face==='W'?1.5:1.9,0.08,face==='E'||face==='W'?1.9:1.5),canvasMat);
    canopy.position.set(wx,ty+postH+.06,wz);
    canopy.rotation.z=(face==='S'||face==='N')?0.08:0;
    canopy.rotation.x=(face==='E'||face==='W')?0.08:0;
    tScene.add(canopy);
    // Hanging fringe
    for(let f=-4;f<=4;f++){
      const fringe=new THREE.Mesh(new THREE.BoxGeometry(.04,.2,.04),canvasMat);
      const foff=f*.2;
      const fz2=face==='S'?wz-.75:face==='N'?wz+.75:wz+foff;
      const fx2=face==='E'?wx+.75:face==='W'?wx-.75:wx+foff;
      fringe.position.set(fx2,ty+postH-.08,fz2);
      tScene.add(fringe);
    }
    // Counter surface
    const counter=new THREE.Mesh(new THREE.BoxGeometry(face==='E'||face==='W'?.12:1.7,0.08,face==='E'||face==='W'?1.7:.12),stallCounterMat);
    const cOff=face==='S'?-.72:face==='N'?.72:0;
    const cOff2=face==='E'?.72:face==='W'?-.72:0;
    counter.position.set(wx+cOff2,ty+1.05,wz+cOff);
    tScene.add(counter);
    // Goods on counter — small coloured boxes
    for(let g=0;g<3;g++){
      const gs=.08+Math.random()*.08;
      const good=new THREE.Mesh(new THREE.BoxGeometry(gs,gs,gs),new THREE.MeshLambertMaterial({color:new THREE.Color().setHSL(Math.random(),0.6,0.4)}));
      good.position.set(wx+cOff2+(Math.random()-.5)*.5,ty+1.1+gs/2,wz+cOff+(Math.random()-.5)*.5);
      tScene.add(good);
    }
    sol.push({cx:wx,cz:wz,rx:1.1,rz:1.1});
  }
  (cfg.marketStalls||[]).forEach((s,i)=>mkMarketStall(s.x,s.z,s.face||'S',s.col!=null?s.col:i));

  // ── Town well ─────────────────────────────────────────────────
  if(cfg.wellX!=null){
    const wx=cfg.wellX+FOFF_X, wz=cfg.wellZ+FOFF_Z;
    const ty=tGetY(wx,wz);
    // Stone wall ring — DoubleSide so the inner face is visible when looking down
    const wellWallMat=new THREE.MeshLambertMaterial({color:0x787870,side:THREE.DoubleSide});
    const wallRing=new THREE.Mesh(new THREE.CylinderGeometry(.55,.6,.55,10,1,true),wellWallMat);
    wallRing.position.set(wx,ty+.28,wz);tScene.add(wallRing);
    // Stone floor disc at base of well (visible bottom inside shaft)
    const wellFloor=new THREE.Mesh(new THREE.CircleGeometry(.54,10),stoneMat);
    wellFloor.rotation.x=-Math.PI/2;wellFloor.position.set(wx,ty+.01,wz);tScene.add(wellFloor);
    // Water surface — dark reflective disc sitting inside the shaft, just above base
    const waterMat=new THREE.MeshLambertMaterial({color:0x2255aa,transparent:true,opacity:.82});
    const waterDisc=new THREE.Mesh(new THREE.CircleGeometry(.50,10),waterMat);
    waterDisc.rotation.x=-Math.PI/2;waterDisc.position.set(wx,ty+.14,wz);tScene.add(waterDisc);
    // Rim — flat torus on top of wall
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.58,.08,5,10),stoneMat);
    rim.rotation.x=Math.PI/2;rim.position.set(wx,ty+.56,wz);tScene.add(rim);
    // Cross-beam posts + beam
    [[wx-.52,wz],[wx+.52,wz]].forEach(([bpx,bpz])=>{
      const p=new THREE.Mesh(new THREE.BoxGeometry(.08,.8,.08),woodMat2);
      p.position.set(bpx,ty+.95,bpz);tScene.add(p);
    });
    const beam=new THREE.Mesh(new THREE.BoxGeometry(1.1,.08,.08),woodMat2);
    beam.position.set(wx,ty+1.36,wz);tScene.add(beam);
    // Rope — hangs from beam down to bucket (beam at ty+1.36, bucket top at ty+1.05)
    const ropeLen=0.30;
    const rope=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,ropeLen,4),new THREE.MeshLambertMaterial({color:0x9a7840}));
    rope.position.set(wx+.18,ty+1.36-ropeLen/2,wz);tScene.add(rope);
    // Bucket — hanging from end of rope
    const bucket=new THREE.Mesh(new THREE.CylinderGeometry(.1,.08,.2,8),new THREE.MeshLambertMaterial({color:0x6a4020}));
    bucket.position.set(wx+.18,ty+1.36-ropeLen-.10,wz);tScene.add(bucket);
    // Subtle water glow
    const wellGlow=new THREE.PointLight(0x3366aa,.25,1.8);wellGlow.position.set(wx,ty+.2,wz);tScene.add(wellGlow);
    sol.push({cx:wx,cz:wz,rx:.7,rz:.7});
  }

  // ── Stone fountain / cistern ──────────────────────────────────
  if(cfg.fountainX!=null){
    const fx2=cfg.fountainX+FOFF_X, fz2=cfg.fountainZ+FOFF_Z;
    const ty=tGetY(fx2,fz2);
    // Stone base disc — seals the bottom of the basin visually
    const basinBase=new THREE.Mesh(new THREE.CylinderGeometry(1.42,1.5,.12,12),stoneMat);
    basinBase.position.set(fx2,ty+.06,fz2);tScene.add(basinBase);
    // Basin wall ring — open cylinder rising from base
    const basin=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.42,.40,12,1,true),stoneMat);
    basin.position.set(fx2,ty+.26,fz2);tScene.add(basin);
    // Water surface — raised to inside the basin (basin top = ty+0.06+0.40 = ty+0.46, water at ty+0.18 = well inside)
    const waterMat2=new THREE.MeshLambertMaterial({color:0x2255aa,transparent:true,opacity:.80});
    const waterSurf=new THREE.Mesh(new THREE.CircleGeometry(1.36,12),waterMat2);
    waterSurf.rotation.x=-Math.PI/2;waterSurf.position.set(fx2,ty+.30,fz2);tScene.add(waterSurf);
    // Rim — flat torus sitting on top of basin wall
    const rim2=new THREE.Mesh(new THREE.TorusGeometry(1.45,.12,5,12),stoneMat);
    rim2.rotation.x=Math.PI/2;rim2.position.set(fx2,ty+.47,fz2);tScene.add(rim2);
    // Center pillar — rises from basin floor up through water surface
    const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.85,8),stoneMat);
    pillar.position.set(fx2,ty+.5,fz2);tScene.add(pillar);
    // Pillar cap — decorative disc at top
    const cap2=new THREE.Mesh(new THREE.CylinderGeometry(.30,.18,.10,8),stoneMat);
    cap2.position.set(fx2,ty+.92,fz2);tScene.add(cap2);
    // Small water spillage discs — thin rings suggesting water spreading from base of pillar
    const spillMat=new THREE.MeshLambertMaterial({color:0x2860b0,transparent:true,opacity:.55});
    const spill=new THREE.Mesh(new THREE.TorusGeometry(.28,.05,4,10),spillMat);
    spill.rotation.x=Math.PI/2;spill.position.set(fx2,ty+.31,fz2);tScene.add(spill);
    // Water shimmer light — positioned at water surface level
    const waterGlow=new THREE.PointLight(0x4488cc,.5,5);waterGlow.position.set(fx2,ty+.35,fz2);tScene.add(waterGlow);
    sol.push({cx:fx2,cz:fz2,rx:1.6,rz:1.6});
  }

  // ── Plaza lanterns on posts ────────────────────────────────────
  (cfg.lanternPositions||[]).forEach(([lx,lz])=>{
    const wx=lx+FOFF_X, wz=lz+FOFF_Z;
    const ty=tGetY(wx,wz);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,2.2,6),new THREE.MeshLambertMaterial({color:0x333344}));
    pole.position.set(wx,ty+1.1,wz);tScene.add(pole);
    const cage2=new THREE.Mesh(new THREE.BoxGeometry(.22,.22,.22),new THREE.MeshLambertMaterial({color:0x222233,transparent:true,opacity:.5,wireframe:true}));
    cage2.position.set(wx,ty+2.3,wz);tScene.add(cage2);
    const glow2=new THREE.Mesh(new THREE.SphereGeometry(.07,6,6),new THREE.MeshBasicMaterial({color:0xccddff}));
    glow2.position.set(wx,ty+2.3,wz);tScene.add(glow2);
    const lgt=new THREE.PointLight(cfg.lanternColor||0xaabbff,.9,8);lgt.position.set(wx,ty+2.3,wz);tScene.add(lgt);
  });

  // ── Wall torches on inner face of perimeter wall ──────────────
  // ── Wall torches — mounted on inner face of perimeter wall ───
  // Use bY (flat inner level) so they sit correctly regardless of terrain
  // Each torch is offset slightly inward from the wall so bracket appears wall-mounted
  const wallInset=0.35; // how far inside the wall face the bracket centre sits
  const torchData=[
    // [worldX, worldZ, rotationY] — rotY faces torch outward from wall
    [FOFF_X+FEXT*.4,  FOFF_Z+wallInset+2,   0          ], // south wall, left
    [FOFF_X+FEXT*1.6, FOFF_Z+wallInset+2,   0          ], // south wall, right
    [FOFF_X+wallInset+2, FOFF_Z+FEXT*.4,    Math.PI/2  ], // west wall, top
    [FOFF_X+wallInset+2, FOFF_Z+FEXT*1.6,   Math.PI/2  ], // west wall, bottom
    [FOFF_X+FEXT*2-wallInset-2, FOFF_Z+FEXT*.4,  -Math.PI/2], // east wall, top
    [FOFF_X+FEXT*2-wallInset-2, FOFF_Z+FEXT*1.6, -Math.PI/2], // east wall, bottom
    [FOFF_X+FEXT*.4,  FOFF_Z+FEXT*2-wallInset-2, Math.PI], // north wall, left
    [FOFF_X+FEXT*1.6, FOFF_Z+FEXT*2-wallInset-2, Math.PI], // north wall, right
  ];
  torchData.forEach(([tx,tz,ry])=>{
    // Wall-mount bracket — a small arm sticking out from the wall
    const bracketMat2=new THREE.MeshLambertMaterial({color:0x333344});
    const armLen=0.28;
    const arm=new THREE.Mesh(new THREE.BoxGeometry(
      Math.abs(Math.cos(ry))<0.1?armLen:0.07,
      0.07,
      Math.abs(Math.cos(ry))<0.1?0.07:armLen
    ),bracketMat2);
    // Arm points inward from wall face
    const armOffX=ry===Math.PI/2?armLen/2:ry===-Math.PI/2?-armLen/2:0;
    const armOffZ=ry===0?-armLen/2:ry===Math.PI?armLen/2:0;
    arm.position.set(tx+armOffX, bY+1.9, tz+armOffZ);
    tScene.add(arm);
    // Vertical ring/holder at tip of arm
    const ring=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.12,6,1,true),bracketMat2);
    ring.position.set(tx+armOffX*2, bY+1.92, tz+armOffZ*2);
    tScene.add(ring);
    // Torch shaft in ring
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,.32,6),new THREE.MeshLambertMaterial({color:0x7a5020}));
    shaft.position.set(tx+armOffX*2, bY+2.08, tz+armOffZ*2);
    tScene.add(shaft);
    const flame=new THREE.Mesh(new THREE.ConeGeometry(.07,.2,6),new THREE.MeshBasicMaterial({color:0xff8822}));
    flame.position.set(tx+armOffX*2, bY+2.28, tz+armOffZ*2);
    tScene.add(flame);
    const flamePt=new THREE.PointLight(0xff9940,.75,5);
    flamePt.position.set(tx+armOffX*2, bY+2.3, tz+armOffZ*2);
    tScene.add(flamePt);
  });

  // ── Notice board (stone-pillar mounted, more imposing than village) ──
  if(cfg.noticeBoardX!=null){
    const nbx=cfg.noticeBoardX+FOFF_X, nbz=cfg.noticeBoardZ+FOFF_Z;
    const ty=tGetY(nbx,nbz);
    const pillar2=new THREE.Mesh(new THREE.BoxGeometry(.28,1.6,.28),stoneMat);
    pillar2.position.set(nbx,ty+.8,nbz);tScene.add(pillar2);
    const top2=new THREE.Mesh(new THREE.BoxGeometry(.34,.1,.34),stoneMat);
    top2.position.set(nbx,ty+1.65,nbz);tScene.add(top2);
    const board2=new THREE.Mesh(new THREE.BoxGeometry(.7,.55,.06),new THREE.MeshLambertMaterial({color:0x7a5820}));
    board2.position.set(nbx,ty+1.95,nbz);tScene.add(board2);
    const parch2=new THREE.Mesh(new THREE.BoxGeometry(.60,.44,.02),new THREE.MeshLambertMaterial({color:0xd4b878}));
    parch2.position.set(nbx,ty+1.95,nbz-.04);tScene.add(parch2);
    sol.push({cx:nbx,cz:nbz,rx:.5,rz:.4});
    OW_NOTICE_BOARDS.push({x:nbx,z:nbz,title:cfg.noticeBoardTitle||'',text:cfg.noticeBoardText||'',zone:cfg.id});
  }

  // ── Barrel/crate clusters ─────────────────────────────────────
  (cfg.clusterPositions||[]).forEach(([lx,lz])=>{
    const wx=lx+FOFF_X, wz=lz+FOFF_Z;
    const ty=tGetY(wx,wz);
    const barrelMat=new THREE.MeshLambertMaterial({color:0x6a4418});
    const crateMat2=new THREE.MeshLambertMaterial({color:0x7a5a28});
    [[0,0,.5,'barrel'],[.45,.1,.4,'barrel'],[-.1,.4,.35,'crate'],[.5,-.3,.32,'crate']].forEach(([ox,oz,sz,type])=>{
      if(type==='barrel'){
        const b=new THREE.Mesh(new THREE.CylinderGeometry(sz*.45,sz*.45,sz*.9,8),barrelMat);
        b.position.set(wx+ox,ty+sz*.45,wz+oz);tScene.add(b);
        const h2=new THREE.Mesh(new THREE.TorusGeometry(sz*.46,.03,4,8),barrelMat);
        h2.rotation.x=Math.PI/2;h2.position.set(wx+ox,ty+sz*.55,wz+oz);tScene.add(h2);
      } else {
        const cr=new THREE.Mesh(new THREE.BoxGeometry(sz*1.6,sz*1.3,sz*1.6),crateMat2);
        cr.position.set(wx+ox,ty+sz*.65,wz+oz);tScene.add(cr);
      }
    });
  });

  // ── NPCs ──────────────────────────────────────────────────────
  (cfg.townNpcs||[]).forEach(def=>{
    const wx=def.x+FOFF_X, wz=def.z+FOFF_Z;
    const ty=tGetY(wx,wz);
    const g=buildNPCMesh(def);
    g.position.set(wx,ty,wz);tScene.add(g);
    const dot=new THREE.Mesh(new THREE.SphereGeometry(.06,6,6),new THREE.MeshBasicMaterial({color:0xffdd00}));
    dot.position.set(wx,ty+1.5,wz);dot.visible=false;tScene.add(dot);
    npcs.push({g,dot,def:{...def,x:wx,z:wz},wa:Math.random()*Math.PI*2,wt:0,ph:Math.random()*Math.PI*2});
  });

  // ── Approach paths ────────────────────────────────────────────
  const pathMat=new THREE.MeshLambertMaterial({color:0x909088});
  function mkPath(x1,z1,x2,z2,w,segs=8){
    const dx=(x2-x1)/segs,dz=(z2-z1)/segs;
    for(let i=0;i<segs;i++){
      const sx=x1+dx*i,sz=z1+dz*i,ex=x1+dx*(i+1),ez=z1+dz*(i+1);
      const len=Math.hypot(ex-sx,ez-sz);if(len<.01)continue;
      const mcx=(sx+ex)/2,mcz=(sz+ez)/2,ang=Math.atan2(ex-sx,ez-sz);
      const isInner=Math.hypot(mcx-FX,mcz-FZ)<FEXT;
      const pathY=isInner?bY+.04:(tGetY(sx,sz)+tGetY(ex,ez))/2+.01;
      const p=new THREE.Mesh(new THREE.PlaneGeometry(w,len),pathMat);
      p.rotation.x=-Math.PI/2;p.rotation.z=ang;p.position.set(mcx,pathY,mcz);tScene.add(p);
    }
  }
  // Cross paths inside fortress + approach from gate
  mkPath(FX,FOFF_Z+3,FX,FOFF_Z+FEXT*2-3,2.8,6);
  mkPath(FOFF_X+3,FZ,FOFF_X+FEXT*2-3,FZ,2.8,6);
  // v61e: per-gate approach from each outer gate to its fortress wall.
  _townGateDefs.forEach(g => {
    let wx, wz;
    if      (g._side === 'S') { wx = g.x; wz = FOFF_Z+4; }
    else if (g._side === 'N') { wx = g.x; wz = FOFF_Z+FEXT*2-4; }
    else if (g._side === 'W') { wx = FOFF_X+4;           wz = g.z; }
    else                      { wx = FOFF_X+FEXT*2-4;    wz = g.z; }
    mkPath(g.x, g.z, wx, wz, 2.8, 14);
  });

  // Plaza circle
  const plaza2=new THREE.Mesh(new THREE.CylinderGeometry(cfg.plazaR||5,cfg.plazaR||5,.01,16),pathMat);
  plaza2.position.set(FX,bY+.03,FZ);tScene.add(plaza2);

  // ── Zone entry gates (one fence per gate, correctly oriented) ──
  // v61e: each outer gate gets its own buildFenceGate mesh with rotation
  // matching the zone edge it sits on (N/S walls → rotY=0, E/W → π/2).
  // Proximity trigger works on any entry; towns can now accept multiple
  // inbound roads from different sides of the world map.
  // v61f: pass terrain Y so gates sit on the ground.
  _townGateDefs.forEach(g => {
    const rotY = (g._side === 'S' || g._side === 'N') ? 0 : Math.PI/2;
    const ty = tGetY(g.x, g.z);
    const mesh = buildFenceGate(tScene, g.x, g.z, rotY, 0x446622, ty);
    // v61e0: commission-barrier crossbeam — visible until Q7 turn-in.
    // Also fixes a latent v61d9 bug: `g.guard` was not being propagated
    // into the runtime gate entry below, so the proximity checks at line
    // 11038/18911 (which read `nearGate.guard`) saw undefined and fell
    // through. Ironhaven's two commission-gated spokes were never actually
    // blocking. Same pattern fix shipped in buildVillage gate loop.
    let barrierMesh=null;
    if(g.guard==='commission' && !worldState.commissioned){
      barrierMesh=_buildCommissionBarrier(tScene,g.x,g.z,rotY,ty);
    }
    townGates.push({
      x:g.x, z:g.z,
      targetZone:g.targetZone,
      spawnX:g.spawnX, spawnZ:g.spawnZ, spawnYaw:g.spawnYaw||Math.PI,
      label:g.label||g.targetZone, mesh, guard:g.guard, barrierMesh,
    });
  });

  // ── Portals — outer ring only ─────────────────────────────────
  const townPortals=WORLD_DUNGEONS.filter(e=>{
    if(e.zone!==cfg.dungeonZone||e.kind==='fort_door')return false; // v80 S132
    return Math.hypot((e.x||FX)-FX,(e.z||FZ)-FZ)>forestR;
  }).map(makePortalDef);
  spawnPortalMeshes(tScene,townPortals,sol,tGetY);

  // ── Herbs ─────────────────────────────────────────────────────
  (cfg.herbSpawns||[]).forEach(sp=>{
    const sx=Math.max(8,Math.min(SZ-8,sp.x)),sz=Math.max(8,Math.min(SZ-8,sp.z));
    if(Math.hypot(sx-FX,sz-FZ)<forestR)return;
    const def=HERB_DEF[sp.type];if(!def)return;
    const ty=tGetY(sx,sz);
    const {g,gl}=mkHerbMesh(sx,sz,def,tScene);
    g.position.y=ty;
    herbArr.push({x:sx,z:sz,type:sp.type,def,g,gl,harvested:false,respawnT:0,ph:Math.random()*Math.PI*2});
  });

  // ── Optional detail hook ──────────────────────────────────────
  if(cfg.detailFn)cfg.detailFn(tScene,sol,tGetY,FX,FZ,FOFF_X,FOFF_Z);

  // ── Register zone ─────────────────────────────────────────────
  // v61d: uniform ZONES[id] shape — see buildVillage comment.
  cfg.scene=tScene;
  ZONES[cfg.id]={scene:tScene,sol,npcs,enemies:[],gates:townGates,size:SZ,portals:townPortals,getY:tGetY,herbs:cfg.herbs||[],_cfg:cfg}; // v61e9 — _cfg ref enables respawnZoneEnemies to re-roll the enemy spec
  return tScene;
}

// IRONHAVEN ZONE
// ══════════════════════════════════════════════════════════════
let ironhavenScene=null;
const IRONHAVEN_SOL=[];
const IRONHAVEN_NPCS=[];
const IH_SIZE=200;

// Ironhaven shops
const IRONHAVEN_HOUSES=[
  {id:'ih0',doorX:23,doorZ:19,doorFace:'S',name:"The Barracks",      keeper:'Sergeant Mord', type:'armor',  tagline:'"Equip yourself like a soldier."',         bCol:0x384858,sCol:0x6888aa},
  {id:'ih1',doorX:47,doorZ:19,doorFace:'S',name:"The Armory",        keeper:'Wulfric',       type:'weapon', tagline:'"Ironhaven steel — battle-tested."',        bCol:0x3a2808,sCol:0x706040},
  {id:'ih2',doorX:23,doorZ:51,doorFace:'S',name:"War Supplies",      keeper:'Dagna',         type:'potion', tagline:'"Keep yourself alive out there."',          bCol:0x5a4028,sCol:0xa08050},
  {id:'ih3',doorX:47,doorZ:51,doorFace:'S',name:"The Royal Herald",  keeper:'Aldwyn',        type:'misc',   tagline:'"News, maps, and royal dispensations."',   bCol:0x2a2a48,sCol:0x7878b0},
  {id:'ih4',doorX:35,doorZ:17,doorFace:'S',name:"Castle Gatehouse",  keeper:'Captain Brynn', type:'armor',  tagline:'"Lord Caldric\'s finest. Entrance by merit."',bCol:0x303030,sCol:0x5a5a6a},
  {id:'ih5',doorX:23,doorZ:30,doorFace:'S',name:"The Ironhaven Chapel",keeper:'Sister Aveline',type:'church',tagline:'"Light in the dark times."',              bCol:0x5a5048,sCol:0xc0b890},
  {id:'ih6',doorX:100,doorZ:119,doorFace:'S',name:"Caldric Keep — Great Hall",keeper:'Lord Caldric',type:'castle',tagline:'"The seat of power in the Ferrous Reach."',bCol:0x2a2838,sCol:0xb0a880},
  // v61d4 — Caldric Safehouse. Private townhouse in the SW quadrant of
  // Ironhaven, granted to the player by Lord Caldric post-Q7. Houses the
  // stash chest (persistent shared inventory) and a bed (full-restore rest).
  // No keeper NPC — this is the player's own space. Burgundy body color
  // (deep red-brown 0x4a2828) marks it visually distinct from the shop ring
  // without going so loud it competes with the keep.
  // v61d6 — Door gated on worldState.safehouseGranted (set by the Caldric
  // grant scene's grantSafehouse resolver). Pre-grant the door responds
  // with "Locked. Lord Caldric has the key." in both the entry handler
  // and the proximity prompt. Brynn's "you called for me?" relay topic
  // surfaces post-Q7 to direct the player toward Caldric for the grant.
  {id:'ih7',doorX:23,doorZ:42,doorFace:'S',name:"Safehouse",          keeper:null,            type:'safehouse',tagline:'"Yours, by Caldric\'s hand."',                bCol:0x4a2828,sCol:0x806060},
];

const IH_SHOP_STOCK={
  armor:[ // Barracks — Iron to Steel (tiers 3-4)
    makeItem(3,ARMOR_TYPES.find(t=>t.type==='Helmet'),   null, true),
    makeItem(4,ARMOR_TYPES.find(t=>t.type==='Cuirass'),  null, true),
    makeItem(3,ARMOR_TYPES.find(t=>t.type==='Gauntlets'),null, true),
    makeItem(4,ARMOR_TYPES.find(t=>t.type==='Greaves'),  null, true),
    makeItem(3,ARMOR_TYPES.find(t=>t.type==='Boots'),    null, true),
    makeItem(4,ARMOR_TYPES.find(t=>t.type==='Buckler'),  null, true),
  ],
  weapon:[ // Armory — Iron to Steel (tiers 3-4)
    makeItem(3,WEAPON_TYPES.find(t=>t.type==='Sword'),     null, false),
    makeItem(4,WEAPON_TYPES.find(t=>t.type==='Longsword'), null, false),
    makeItem(3,WEAPON_TYPES.find(t=>t.type==='Mace'),      null, false),
    makeItem(4,WEAPON_TYPES.find(t=>t.type==='Scimitar'),  null, false),
    // v64 — Wulfric's bow stock. T3 Iron Bow — meaningfully better than
    // Barnaby's T1 Wooden one. Wulfric carries arrows too: the armory is
    // where serious adventurers resupply, and gating bow ammo behind Q3
    // (Ironhaven travel) is exactly the lore_canon-friendly arc — Barnaby
    // gets the player started, Ironhaven scales them up.
    makeItem(3,WEAPON_TYPES.find(t=>t.type==='Bow'),       null, false),
    {...ARROW_IRON},
    // v65 — Wulfric's two-handed stock. Iron Claymore and Iron War Hammer
    // at T3 — the meaningful tier upgrade over Barnaby's wooden starter.
    // Great Axe deliberately omitted (reserved for the dwarven smithy NPC
    // when that ships) — Wulfric is a stone-town armorer, not a mountain
    // forge. The two together cover the build identities: claymore for
    // pack-clearing, war hammer for single-target / brute-busting.
    makeItem(3,WEAPON_TYPES.find(t=>t.type==='Claymore'),  null, false),
    makeItem(3,WEAPON_TYPES.find(t=>t.type==='WarHammer'), null, false),
    makeItem(4,ARMOR_TYPES.find(t=>t.type==='Buckler'),    null, true),
    {name:'Health Potion',ico:'🧪',type:'potion',heal:25,buyPrice:18,sellMult:.4},
  ],
  potion:[ // War Supplies
    {...TORCH_ITEM},
    {name:'Health Potion',   ico:'🧪',type:'potion',heal:25, buyPrice:15,sellMult:.5},
    {name:'Greater Potion',  ico:'🫙',type:'potion',heal:60, buyPrice:38,sellMult:.5},
    {name:'Mana Draught',    ico:'💧',type:'potion',heal:0,mana:40,buyPrice:28,sellMult:.5},
    {name:'Stamina Draught', ico:'🥤',type:'potion',stam:40, buyPrice:20,sellMult:.5},
  ],
  misc:[ // Royal Herald
    {...TORCH_ITEM},
    {name:'Dungeon Map',     ico:'🗺', type:'misc',           buyPrice:12,sellMult:.3},
    {name:'Stamina Draught', ico:'🥤',type:'potion',stam:40, buyPrice:22,sellMult:.5},
    {name:'Health Potion',   ico:'🧪',type:'potion',heal:25, buyPrice:18,sellMult:.4},
  ],
};

const IRONHAVEN_DIALOG={
  'Sergeant Mord':{ico:'🪖',role:'Barracks Sergeant',
    greeting:["New recruit? No — adventurer. Close enough. What do you need?","Gear up properly or don't go out there at all. That's my philosophy.","I've buried three soldiers who skimped on armor. Don't be my fourth."],
    topics:[
      {label:'Browse your wares.',trade:true},
      {label:'What\'s the threat level out there?',response:"Forest is manageable if you don't wander off the path. The dungeons are another matter. We lost a full patrol to the Dungeon of Shadows last month. Didn't send another.",follow:[{label:'What happened to them?',response:"No survivors, no bodies. Just — gone. I filed the report. Lord Caldric filed it somewhere I can't see. Point is: respect the old gates. They don't care how brave you are."}]},
      {label:'What armor should I prioritize?',response:"Chest first — that's where you die if you don't have it. Head second. Hands and legs are nice but won't save you like those two will. And carry a shield. Blocks save lives.",follow:[{label:'Any tips for fighting?',response:"Block early. Don't get surrounded. Kill the fast ones first — slow enemies you can dance around, fast ones will eat your stamina. And never chase a retreating enemy into a corner."}]},
      {label:'Goodbye.',bye:true},
    ]},
  Wulfric:{ico:'⚔',role:'Master Armorer',
    greeting:["Wulfric. The steel speaks for itself.","Every blade here I forged personally. No apprentice work, no shortcuts.","You want the best Ironhaven has — you've found it."],
    topics:[
      {label:'Browse your wares.',trade:true},
      {label:'Tell me about your weapons.',response:"The Steel Sword is your workhorse — balanced, reliable, stays sharp. War Hammer for brutes; nothing else cracks golem plate like that head. The Military Spear has reach — keeps enemies at distance, good for solo work.",follow:[{label:'What about shields?',response:"Tower Shield is the best protection money can buy short of magical enchantment. Heavier than the Steel but that block percentage in a tough fight is worth every bit of stamina. Pair it with a one-hander."}]},
      {label:'Goodbye.',bye:true},
    ]},
  Dagna:{ico:'⚗',role:'War Quartermaster',
    greeting:["War Supplies — potions, scrolls, the things that keep you breathing.","Dagna's prices are fair. Dagna's quality is guaranteed. Dagna is talking about herself in third person because it works.","Stock up before you go into anything dangerous. That's an order. Well — a strong suggestion."],
    topics:[
      {label:'Browse your wares.',trade:true},
      {label:'What should I always carry?',response:"At minimum: two health potions, one mana draught if you cast spells. That's your survival kit. Below that and you're gambling with your life. Above that and you're prepared. Simple.",follow:[{label:'What about Mystic Scrolls?',response:"Buy them if you want spells. Read them when your Intelligence is high enough to absorb them. I've seen adventurers read five scrolls and learn nothing — wrong attribute investment. Get your INT up first."}]},
      {label:'Goodbye.',bye:true},
    ]},
  Aldwyn:{ico:'📜',role:'Royal Herald',
    greeting:["Royal Herald Aldwyn, at your service. News, proclamations, and a modest selection of useful items.","Lord Caldric has issued three new proclamations this week alone. Busy times.","The dungeon situation is officially classified as 'monitored'. Unofficially — concerning."],
    topics:[
      {label:'Browse your wares.',trade:true},
      {label:'What\'s Lord Caldric\'s current focus?',response:"Officially: maintaining order and monitoring activity at the old gates. The Royal Mage corps was requested six months ago. They haven't arrived. Lord Caldric has stopped asking politely.",follow:[{label:'What happens if the Mages don\'t come?',response:"We handle it ourselves. Which means adventurers like you, frankly. The Caldric household is quietly doubling the bounty on creatures from the gates. Not officially — that would cause panic. But the coin is real."}]},
      {label:'Tell me about the three dungeons.',response:"Dungeon of Shadows — oldest, most documented. Crypt of Embers — fire affinity, high danger. Vault of the Tide — partially flooded, least explored. All three predate Ironhaven by centuries. We built around them, not the other way.",follow:[{label:'Any pattern to the creature activity?',response:"They emerge more frequently during the new moon. Nobody officially knows why. I've cross-referenced three hundred years of patrol logs. The correlation is undeniable. That information is also classified. I'm telling you anyway."}]},
      {label:'Goodbye.',bye:true},
    ]},
  'Captain Brynn':{ico:'🏰',role:'Castle Captain',
    greeting:["Captain Brynn. You're standing outside Caldric Keep. State your business.","Not many civilians make it this far into Ironhaven. You must be capable.","Lord Caldric doesn't grant audiences lightly. But he respects proven adventurers."],
    topics:[
      {label:'Browse your wares.',trade:true},
      {label:'Tell me about Lord Caldric.',response:"Sharp, fair, and increasingly impatient with the capital's inaction. He governs by merit — promotes soldiers who perform, dismisses those who don't. He's the reason Ironhaven is the most defensible town in the region.",follow:[{label:'Can I meet him?',response:"He's aware adventurers are passing through. If you clear enough of the forest and the old gates, he may request an audience himself. Until then — show results, not ambition."}]},
      {label:'What\'s your assessment of the trouble at the gates?',response:"Honest answer? It's accelerating. Two years ago we saw one or two creatures a week. Now it's daily. The gates aren't just staying open — what comes through them is multiplying. We don't have a solution. We're buying time.",follow:[{label:'What can I do?',response:"Keep the populations in check. Every creature you kill in the old gates is one that doesn't emerge. That's not nothing. That's actually quite a lot. The soldiers here are grateful, even if the bureaucracy doesn't say so."}]},
      {label:'Goodbye.',bye:true},
    ]},
  'Lord Caldric':{ico:'👑',role:'Lord of Ironhaven',
    greeting:["I've been watching the adventurers come through. Most leave again quickly. You've stayed. That interests me.","The situation with the old gates is worse than my public statements suggest. We need to talk frankly.","Ironhaven has stood for three generations. I intend it to stand for three more. Sit. Tell me what you've seen."],
    topics:[
      {label:'What is the true state of the trouble at the gates?',response:"Worse than I've admitted publicly. The binding failures are accelerating — what took years now takes weeks. The Scholar in the plaza has been tracking it. His estimates suggest we have perhaps one season before the containment breaks entirely.",follow:[{label:"What are you doing about it?",response:"Everything in my power. I've sent three ravens to the capital. No response. I've doubled the garrison. And I'm talking to every adventurer who comes through that door, because frankly — you may be the only resource I have left."}]},
      {label:'What do you need from me?',response:"Keep clearing the old gates. But more than that: if you find anything in the deep levels that isn't a creature — markings, objects, anything unusual — bring it to Aldwyn immediately. Don't try to interpret it yourself. Some of what's down there has been there a very long time.",follow:[{label:"What are you afraid of finding?",response:"That whoever built those dungeons is still involved. The sigils aren't degrading randomly. They're being changed. Someone — or something — with knowledge of the original system is rewriting it from the inside. That is not a natural process. That is intent."}]},
      {label:'Tell me about yourself.',response:"Three generations of Caldrics have governed Ironhaven. My grandfather built the outer walls. My father extended the garrison. I've spent my reign trying to understand why the old gates are becoming more active. I'm not a man who fails at things he considers important. This has been humbling.",follow:[{label:"Do you have family?",response:"A daughter. She's at the capital for her education — which is to say, I sent her somewhere safer eighteen months ago and told myself it was for her schooling. She writes regularly. I write less often than I should."}]},
      {label:'Goodbye.',bye:true},
    ]},
};


const IRONHAVEN_CONFIG={
  id:'ironhaven', name:'Ironhaven', musicTrack:'town',
  size:200, seed:4421,
  skyCol:0x6a8aa0, fogColor:0x7a9ab8, fogDensity:.006,
  fortressX:100, fortressZ:100, wallExtent:35,
  forestR:58, fortressR:30, hillH:0.8, roofColor:0x404858,
  // v61e: ported to multi-gate via buildTown's new cfg.gates[] support.
  // v61eh: gate set restructured for the spec-matching grid. Ironhaven
  // is now at MAP (6,1) with neighbors La Grise (N, 6,0), Portclare
  // (S, 6,2), Vieux Marché (W, 5,1). The la_porte_grise connection
  // moved off Ironhaven entirely (la_porte_grise is no longer adjacent
  // on the new map). Ironhaven's fortress still faces compass-north in
  // 3D — its low-Z (N) gate is its front door — and the map orientation
  // now agrees: low-Z gate → north on the map → La Grise via the
  // northern road (commission-locked, royal network).
  gates:[
    // v61el: Lock topology revised per design call. Per Michael:
    //   "A road with a lock on it should mean that a player cannot enter
    //    that wilderness zone from ANY area. The zone is entirely locked.
    //    Anything attached to it & anything further downstream is therefore
    //    locked as well."
    // Three Q7/Act-progression unlocks remain:
    //   (a) west_track       — unlocks coastal arc (Salthaven, Carraig Mór, Inis Rua)
    //   (b) northern_road    — unlocks mountain region (La Grise, Colmán's Rest, Mur Pierre)
    //   (c) capital_road     — unlocks Coeur de Vie (Act III, NOT Q7)
    // Pre-v61el, Ironhaven's S (→portclare DIRECT) and W (→la_route_royale_west)
    // were guard:'commission'. Post-v61eh geography puts the Royale spine
    // (Vieux Marché, Portclare, Dunmore) BETWEEN Ashenmoor and Ironhaven on
    // the canonical Act I path (Ashenmoor → Hearthwick → Thorngate → Forest
    // → La Porte Grise → Vieux Marché → la_route_royale_west → Ironhaven),
    // so locking these gates trapped the player IN Ironhaven once they
    // arrived for Q3 turn-in. Removed both guards. Only northern_road stays
    // commission-locked here — La Grise and the foothill arc are the
    // mountain-region reveal at Q7.
    //
    // N (z=3)   → northern_road → La Grise [commission, mountain reveal]
    // v61f16: northern_road bumped 90 → 200; road now at x=100 spine; spawn updated.
    {x:100, z:3,   targetZone:'northern_road',        spawnX:100, spawnZ:192, spawnYaw:0,          label:'The Northern Road',     guard:'commission'},
    // S (z=197) → portclare DIRECT [unguarded — Portclare is on the Act I path]
    // v61ei: Portclare spawn moved spawnZ:12 → spawnZ:50. This spawn lands the
    // player INSIDE PORTCLARE (not Ironhaven) when they walk out Ironhaven's
    // south gate or fast-travel to Portclare via this gate.
    // v61ej: spawnYaw 0 → Math.PI. Per line 3335, yaw=0 faces -Z (north),
    // yaw=π faces +Z (south). Player at Portclare z=50 needs to face +Z
    // (south) to look toward Portclare's fortress center at z=90.
    {x:100, z:197, targetZone:'portclare',            spawnX:90,  spawnZ:50,  spawnYaw:Math.PI,    label:'Portclare'},
    // W (x=3)   → la_route_royale_west → Vieux Marché [unguarded — Royale spine is Act I]
    // v61f16: la_route_royale_west bumped 80 → 200; road now at z=100; spawn updated 40 → 100; spawnX updated 75 → 192 to land at the east edge of the new larger zone.
    {x:3,   z:100, targetZone:'la_route_royale_west', spawnX:192, spawnZ:100, spawnYaw:Math.PI/2,  label:'La Route Royale — West'},
  ],
  dungeonZone:'ironhaven',
  // Buildings in LOCAL coords (0,0 = fortressX-wallExtent = 65,65)
  buildings:[
    {x:16,z:16,w:7,d:6,face:'E',  id:'ih0'},
    {x:47,z:16,w:7,d:6,face:'W',  id:'ih1'},
    {x:16,z:48,w:7,d:6,face:'E',  id:'ih2'},
    {x:47,z:48,w:7,d:6,face:'W',  id:'ih3'},
    {x:31,z:12,w:8,d:5,face:'S',  id:'ih4'},
    {x:20,z:30,w:6,d:8,face:'S',  id:'ih5', type:'church'},
    {x:27,z:54,w:16,d:12,face:'S', id:'ih6', type:'castle'},
    // v61d4 — Caldric Safehouse footprint. Placed in the SW interior of
    // Ironhaven, between the chapel (x:20,z:30) and War Supplies (x:16,z:48).
    // Footprint 7w × 6d at local (24,39). South-facing door so it opens
    // onto the cluster ring rather than the keep courtyard. Sized between
    // a corner shop (7×6) and a center building so it reads as a private
    // residence rather than a commercial space. The barrel cluster at
    // (18,42) is 6u clear of the footprint's west wall — no overlap.
    {x:24,z:39,w:7,d:6,face:'S',  id:'ih7', type:'safehouse'},
  ],
  // Market stalls — local coords, positioned around plaza
  marketStalls:[
    {x:27,z:37,face:'E',col:0}, // red — west of plaza
    {x:27,z:32,face:'E',col:3}, // gold
    {x:43,z:37,face:'W',col:1}, // blue — east of plaza
    {x:43,z:32,face:'W',col:2}, // green
    {x:35,z:44,face:'N',col:4}, // purple — south of plaza (facing north)
  ],
  // Well — local coords
  wellX:42, wellZ:24,
  // Fountain — local coords, plaza center
  fountainX:35, fountainZ:35,
  // Barrel/crate clusters
  clusterPositions:[
    [18,42],[52,22],[18,26],[52,42],
  ],
  // Lanterns — local coords (beyond the hardcoded grid, add extras here)
  lanternPositions:[
    [24,24],[46,24],
    [35,29],[35,42],[28,35],[42,35],
    [28,28],[42,28],[28,42],[42,42],
  ],
  lanternColor:0xaabbff,
  plazaR:6,
  // Notice board — local coords
  noticeBoardX:30, noticeBoardZ:29,
  noticeBoardTitle:'Ironhaven — Town Record',
  noticeBoardText:`Ironhaven was established as a military garrison post by Lord Caldric the First, three generations before the current Lord Caldric. The garrison became a settlement when the soldiers' families followed.

Current population: approximately eight hundred souls, including the garrison.

Lord Caldric maintains the fortress under emergency protocols. All adventurers are advised to register at the Royal Herald's office before conducting operations beyond the old gates.

The three old gates in the outer ring are classified as ACTIVE. Do not approach without adequate equipment. The garrison has posted a standing 50-gold bounty per creature confirmed eliminated.

All weapons are to remain sheathed within the fortress walls.`,
  // Town-specific NPC defs (guards, scholars, civilians)
  townNpcs:[
    {x:28,z:35,name:'Guard',      role:'Ironhaven Guard',    ico:'⚔', bCol:0x384858,sCol:0x6888aa,
     greeting:["Move along, citizen.","Ironhaven is secure. For now.","Keep your weapons sheathed in town."],
     topics:[{label:'What can you tell me about the castle?',response:"Lord Caldric's been in emergency council all week. Something about the activity at the gates. I'm not cleared for the details.",follow:[{label:'Is the town safe?',response:"Safe enough. We've doubled the night patrols. The forest road has an escort during daylight hours now. After dark — I'd recommend staying in town."}]},{label:'Farewell.',bye:true}]},
    {x:42,z:35,name:'Scholar',    role:'Traveling Scholar',  ico:'📚', bCol:0x2a2a4a,sCol:0x8888cc,
     greeting:["Fascinating place, Ironhaven. The ley convergence is measurable even from the plaza.","I've been mapping the anchor places across the region. The pattern is... troubling.","Ah, an adventurer. You've been past the old gates? What did you observe?"],
     topics:[{label:"What's troubling about the anchor places?",response:"They're not random. The three near Ashenmoor form a triangle — equidistant, precisely aligned to cardinal directions. That's not natural formation. Someone placed them.",follow:[{label:'Who would do that?',response:"That's what I'm here to find out. The oldest records I've found mention a civilization predating the current kingdoms. They placed the anchors deliberately. To what end — the records don't say. Or they were destroyed."}]},{label:'Farewell.',bye:true}]},
    {x:35,z:26,name:'Town Crier', role:'Town Crier',          ico:'📣', bCol:0x8a6030,sCol:0xd4a060,
     greeting:["Hear ye, hear ye! Lord Caldric has issued new proclamations!","The bounty on creatures from the gates has been doubled! Speak to the Royal Herald for details!","All adventurers: register at the Herald's office. It is not optional."],
     topics:[{label:'What are the current proclamations?',response:"Three this week alone. First: increased patrol hours at all the old gates. Second: the creature bounty doubled to fifty gold per confirmed kill. Third — and this one's unusual — no one is to enter the Vault of the Tide without written dispensation from Lord Caldric himself.",follow:[{label:'Why restrict the Vault?',response:"That, traveler, is what everyone wants to know. The official reason is 'ongoing geological instability.' The unofficial reason — well, I'm a town crier, not a gossip. Ask the Scholar by the fountain."}]},{label:'Farewell.',bye:true}]},
  ],
  herbSpawns:[
    {x:30,z:160,type:'ferrousweed'},{x:170,z:40,type:'ferrousweed'},{x:50,z:145,type:'ferrousweed'},
    {x:38,z:138,type:'graywort'},{x:172,z:138,type:'graywort'},{x:28,z:152,type:'graywort'},
    {x:142,z:172,type:'caordubh'},{x:178,z:158,type:'caordubh'},
    {x:32,z:168,type:'mistfern'},{x:162,z:78,type:'mistfern'},{x:58,z:180,type:'mistfern'},
    {x:158,z:32,type:'stonecress'},{x:22,z:72,type:'stonecress'},
    {x:42,z:152,type:'veilwort'},{x:168,z:152,type:'veilwort'},{x:128,z:28,type:'veilwort'},
    {x:32,z:132,type:'credearg'},{x:172,z:32,type:'credearg'},
    {x:162,z:178,type:'duilleogghorm'},{x:28,z:28,type:'duilleogghorm'},
  ],
  registerTerrainH:(fn)=>{ _ironhavenTerrainH=fn; },
};

function buildIronhaven(){
  // Wire runtime arrays into config
  IRONHAVEN_CONFIG.sol   = IRONHAVEN_SOL;
  IRONHAVEN_CONFIG.npcs  = IRONHAVEN_NPCS;
  IRONHAVEN_CONFIG.herbs = IH_HERBS;
  // v61g: do NOT overwrite IRONHAVEN_CONFIG.gates with the empty
  // IRONHAVEN_GATES array. That line was legacy (from when cfg.gates was the
  // runtime output). As of v61e cfg.gates is the INPUT spec (3 multi-gates
  // for south/north/east walls). Overwriting it with [] silently wiped all
  // three gates — the south wall gap + archway vanished with no way to
  // enter Ironhaven from the Deepwood.

  // House door positions — buildTown sets buildings in world coords
  // We update IRONHAVEN_HOUSES after build using the config's FOFF
  IRONHAVEN_CONFIG.decorateFn=function(sc,sol2,h,ty,getY){
    // v61y: compute ACTUAL door-wall position from the building's face+dimensions.
    // Pre-v61y we stored the building CENTER in doorX/doorZ — for the 4 corner shops
    // (face=E/W) that put the reference point 3+ units away from the real door,
    // which is why Aldwyn's exit was spawning through his building into the castle
    // wall. Entry worked by accident because the <1.5 check is fuzzy enough to catch
    // you standing near center. Also: doorFace was never synced, so all corner
    // shops defaulted to 'S' which compounded the exit-direction error.
    const ox=h.x, oz=h.z;
    let doorWallX = h.doorX, doorWallZ = h.doorZ;
    if(h.face==='S') { doorWallX = ox + h.w/2; doorWallZ = oz - 0.05; }
    else if(h.face==='N') { doorWallX = ox + h.w/2; doorWallZ = oz + h.d + 0.05; }
    else if(h.face==='E') { doorWallX = ox + h.w + 0.05; doorWallZ = oz + h.d/2; }
    else if(h.face==='W') { doorWallX = ox - 0.05; doorWallZ = oz + h.d/2; }
    const ih=IRONHAVEN_HOUSES.find(x=>x.id===h.id);
    if(ih){
      ih.doorX=doorWallX; ih.doorZ=doorWallZ;
      if(h.face) ih.doorFace=h.face;
    }
    // Use the real door position for all decorative placement from here on.
    const dX = doorWallX, dZ = doorWallZ;
    // Stone-mounted wall sconces on either side of each door
    const darkMat=new THREE.MeshLambertMaterial({color:0x333344});
    const flameMat=new THREE.MeshBasicMaterial({color:0xff9940});
    [-0.8,0.8].forEach(off=>{
      const sx=h.face==='S'||h.face==='N'?dX+off:dX+(h.face==='E'?.3:-.3);
      const sz=h.face==='E'||h.face==='W'?dZ+off:dZ+(h.face==='S'?-.3:.3);
      const br=new THREE.Mesh(new THREE.BoxGeometry(.18,.06,.14),darkMat);
      br.position.set(sx,ty+1.9,sz);sc.add(br);
      const sf=new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,.22,6),new THREE.MeshLambertMaterial({color:0x7a5020}));
      sf.position.set(sx,ty+2.02,sz);sc.add(sf);
      const fl=new THREE.Mesh(new THREE.ConeGeometry(.05,.14,6),flameMat);
      fl.position.set(sx,ty+2.18,sz);sc.add(fl);
      const pt=new THREE.PointLight(0xff8844,.55,3.5);pt.position.set(sx,ty+2.2,sz);sc.add(pt);
    });

    // ── v61z: Shop sign with type icon (tavern-hanging style) ──────────
    // v61y had boards parallel to the wall — visible only from head-on, invisible
    // from the sides you actually walk along. Fixed: boards hang PERPENDICULAR to
    // the wall (like a real tavern sign), so walking down the plaza along the
    // wall reveals the icon face-on. Icons are Z-symmetric (extend through both
    // faces of the board) so each shop's glyph is readable from either approach
    // direction. Skip chapel (silhouette is distinct) and castle (too big to miss).
    if(ih && ih.type && ih.type!=='church' && ih.type!=='castle'){
      const sideOff = 0.95, outOff = 0.55;
      let postX, postZ, armDX, armDZ, boardRotY;
      if(h.face==='S'){
        // Post slightly west of door, a bit south of wall; arm extends south; board perpendicular to south wall
        postX=dX-sideOff; postZ=dZ-outOff; armDX=0; armDZ=-0.5; boardRotY=Math.PI/2;
      } else if(h.face==='N'){
        postX=dX+sideOff; postZ=dZ+outOff; armDX=0; armDZ=0.5; boardRotY=Math.PI/2;
      } else if(h.face==='E'){
        postX=dX+outOff; postZ=dZ-sideOff; armDX=0.5; armDZ=0; boardRotY=0;
      } else { // W
        postX=dX-outOff; postZ=dZ+sideOff; armDX=-0.5; armDZ=0; boardRotY=0;
      }
      const signWoodMat=new THREE.MeshLambertMaterial({color:0x4a3018});
      const boardMat=new THREE.MeshLambertMaterial({color:ih.sCol||0x8a6848,side:THREE.DoubleSide});
      const iconMat=new THREE.MeshLambertMaterial({color:0xe8d8a0});
      const hiltMat=new THREE.MeshLambertMaterial({color:0x5a3818});
      const tieMat=new THREE.MeshLambertMaterial({color:0x9a2020});
      // Post
      const post=new THREE.Mesh(new THREE.BoxGeometry(.09,2.2,.09),signWoodMat);
      post.position.set(postX,ty+1.1,postZ); sc.add(post);
      // Arm
      const armLen=Math.hypot(armDX,armDZ);
      const arm=new THREE.Mesh(new THREE.BoxGeometry(armLen,.07,.07),signWoodMat);
      arm.position.set(postX+armDX/2,ty+2.05,postZ+armDZ/2);
      arm.rotation.y=-Math.atan2(armDZ,armDX);
      sc.add(arm);
      // Board — perpendicular to the wall. Material is DoubleSide so the back
      // of the board renders as the same color, not as a dark Lambert back-face.
      const board=new THREE.Mesh(new THREE.BoxGeometry(.55,.42,.07),boardMat);
      board.position.set(postX+armDX,ty+1.72,postZ+armDZ);
      board.rotation.y=boardRotY;
      sc.add(board);
      // Icon group — rotates with the board. Icons centered at local z=0 with
      // thickness ≥0.10 in Z so they protrude through both faces of the 0.07-thick
      // board — a single mesh handles both "front" and "back" views, no duplication.
      const iconGroup=new THREE.Group();
      iconGroup.position.set(postX+armDX,ty+1.72,postZ+armDZ);
      iconGroup.rotation.y=boardRotY;
      if(ih.type==='weapon'){
        // Sword — blade + crossguard + hilt + pommel, all symmetric in Z
        const blade=new THREE.Mesh(new THREE.BoxGeometry(.05,.26,.10),iconMat);
        blade.position.set(0,0.03,0); iconGroup.add(blade);
        const cross=new THREE.Mesh(new THREE.BoxGeometry(.20,.04,.10),iconMat);
        cross.position.set(0,-0.11,0); iconGroup.add(cross);
        const hilt=new THREE.Mesh(new THREE.BoxGeometry(.04,.08,.10),hiltMat);
        hilt.position.set(0,-0.16,0); iconGroup.add(hilt);
        const pommel=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),iconMat);
        pommel.position.set(0,-0.22,0); iconGroup.add(pommel);
      } else if(ih.type==='armor'){
        // Helmet — squashed full sphere (dome silhouette from any angle) + rim band
        const dome=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),iconMat);
        dome.scale.set(1,0.62,1);
        dome.position.set(0,0.04,0); iconGroup.add(dome);
        const rim=new THREE.Mesh(new THREE.BoxGeometry(.28,.04,.14),iconMat);
        rim.position.set(0,-0.04,0); iconGroup.add(rim);
      } else if(ih.type==='potion'){
        // Flask — cylindrical body, tapered neck, stopper. All cylinders on Y axis.
        const body=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.19,8),iconMat);
        body.position.set(0,-0.01,0); iconGroup.add(body);
        const neck=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,.08,8),iconMat);
        neck.position.set(0,0.12,0); iconGroup.add(neck);
        const stopper=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.05,8),hiltMat);
        stopper.position.set(0,0.18,0); iconGroup.add(stopper);
      } else {
        // Misc / Royal Herald — scroll (horizontal cylinder) with red end-ties
        const scroll=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.32,8),iconMat);
        scroll.rotation.z=Math.PI/2;
        scroll.position.set(0,0,0); iconGroup.add(scroll);
        const tieL=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.14,8),tieMat);
        tieL.rotation.z=Math.PI/2;
        tieL.position.set(-.14,0,0); iconGroup.add(tieL);
        const tieR=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.14,8),tieMat);
        tieR.rotation.z=Math.PI/2;
        tieR.position.set(.14,0,0); iconGroup.add(tieR);
      }
      sc.add(iconGroup);
    }
  };

  // Also patch IRONHAVEN_HOUSES door coords after scene is built
  IRONHAVEN_CONFIG.detailFn=function(sc,sol2,getY,FX,FZ,FOFF_X,FOFF_Z){
    // Add the keep + inner walls + archway (unique to Ironhaven, not generic town features)
    const bY=getY(FX,FZ);
    const darkStoneMat=new THREE.MeshLambertMaterial({color:0x505048});
    const stoneMat=new THREE.MeshLambertMaterial({color:0x787870});
    const woodMat2=new THREE.MeshLambertMaterial({color:0x6a4020});
    const roofMat2=new THREE.MeshLambertMaterial({color:0x404858});
    const wallH=3.2;

    // Inner courtyard walls (around keep area)
    [[35,59,24,.6],[26,54,.6,10],[44,54,.6,10]].forEach(([cx2,cz2,ww,wd])=>{
      const wall=new THREE.Mesh(new THREE.BoxGeometry(ww,wallH,wd),darkStoneMat);
      wall.position.set(cx2+FOFF_X,bY+wallH/2,cz2+FOFF_Z);sc.add(wall);
      sol2.push({cx:cx2+FOFF_X,cz:cz2+FOFF_Z,rx:ww/2,rz:wd/2});
    });
    // Inner courtyard towers
    [[26,49],[44,49],[26,59],[44,59]].forEach(([tx,tz])=>{
      const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.6,4.5,8),darkStoneMat);tower.position.set(tx+FOFF_X,bY+2.25,tz+FOFF_Z);sc.add(tower);
      const batt=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,.5,8),darkStoneMat);batt.position.set(tx+FOFF_X,bY+4.75,tz+FOFF_Z);sc.add(batt);
      sol2.push({cx:tx+FOFF_X,cz:tz+FOFF_Z,rx:1.7,rz:1.7});
    });
    // Keep
    const keep=new THREE.Mesh(new THREE.BoxGeometry(8,5.5,6),darkStoneMat);keep.position.set(35+FOFF_X,bY+2.75,57+FOFF_Z);sc.add(keep);
    const keepRoof=new THREE.Mesh(new THREE.ConeGeometry(5.5,2.5,4),roofMat2);keepRoof.position.set(35+FOFF_X,bY+6.5,57+FOFF_Z);keepRoof.rotation.y=Math.PI/4;sc.add(keepRoof);
    // v61aa: keep door — z-fighting fix + detail pass. Pre-v61aa this was at
    // z=54.05 which is coplanar with the keep's front face (keep spans z=54..60),
    // producing the flickering/phasing artifact Michael flagged. Pushed to
    // z=53.80 — 0.20 units clear — and given the same iron-knob + plank + hinge
    // treatment as the shop doors so it reads as a proper door, not a painted
    // rectangle. Larger scale (1.2w × 2.2h) to match the monumental keep.
    const keepIronMat=new THREE.MeshLambertMaterial({color:0x222228});
    const keepDoorGroup=new THREE.Group();
    const keepDoor=new THREE.Mesh(new THREE.BoxGeometry(1.2,2.2,.1),woodMat2);
    keepDoorGroup.add(keepDoor);
    // Vertical planks — five grooves for the wider door
    for(let pg=-2;pg<=2;pg++){
      const plank=new THREE.Mesh(new THREE.BoxGeometry(.02,2.05,.02),keepIronMat);
      plank.position.set(pg*0.22, 0, 0.06);
      keepDoorGroup.add(plank);
    }
    // Iron ring knob (more imposing than a sphere for a castle)
    const kRing=new THREE.Mesh(new THREE.TorusGeometry(.07,.02,6,14),keepIronMat);
    kRing.rotation.x=Math.PI/2;
    kRing.position.set(.42, -0.1, 0.10); keepDoorGroup.add(kRing);
    const kRingPlate=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.02,8),keepIronMat);
    kRingPlate.rotation.x=Math.PI/2;
    kRingPlate.position.set(.42, -0.1, 0.07); keepDoorGroup.add(kRingPlate);
    // Three iron bands across the door (horizontal reinforcement, castle-style)
    [0.75, 0, -0.75].forEach(by=>{
      const band=new THREE.Mesh(new THREE.BoxGeometry(1.18,.05,.03),keepIronMat);
      band.position.set(0, by, 0.06); keepDoorGroup.add(band);
    });
    // v61ab: same S-face rotation fix as shop/village doors. Keep door is on
    // the south face of the keep; player approaches from −Z. Local +Z of the
    // detail meshes must face −Z in world space → rotate group 180°.
    keepDoorGroup.position.set(35+FOFF_X,bY+1.1,53.80+FOFF_Z);
    keepDoorGroup.rotation.y=Math.PI;
    sc.add(keepDoorGroup);
    // Inner arch (portcullis to keep yard)
    const archL=new THREE.Mesh(new THREE.BoxGeometry(.7,2.8,.6),darkStoneMat);archL.position.set(33.3+FOFF_X,bY+1.4,49+FOFF_Z);sc.add(archL);
    const archR=new THREE.Mesh(new THREE.BoxGeometry(.7,2.8,.6),darkStoneMat);archR.position.set(36.7+FOFF_X,bY+1.4,49+FOFF_Z);sc.add(archR);
    const archTop=new THREE.Mesh(new THREE.BoxGeometry(4.2,.8,.6),darkStoneMat);archTop.position.set(35+FOFF_X,bY+2.9,49+FOFF_Z);sc.add(archTop);
    sol2.push({cx:35+FOFF_X,cz:57+FOFF_Z,rx:4.2,rz:3.2});

    // Update IRONHAVEN_HOUSES door positions now that FOFF is known
    IRONHAVEN_CONFIG.buildings.forEach(bh=>{
      const ih=IRONHAVEN_HOUSES.find(x=>x.id===bh.id);
      if(!ih)return;
      const cx=bh.x+FOFF_X+bh.w/2, cz=bh.z+FOFF_Z+bh.d/2;
      if(bh.face==='S'){ih.doorX=cx;ih.doorZ=bh.z+FOFF_Z-.05;ih.doorFace='S';}
      else if(bh.face==='N'){ih.doorX=cx;ih.doorZ=bh.z+FOFF_Z+bh.d+.05;ih.doorFace='N';}
      else if(bh.face==='E'){ih.doorX=bh.x+FOFF_X+bh.w+.05;ih.doorZ=cz;ih.doorFace='E';}
      else{ih.doorX=bh.x+FOFF_X-.05;ih.doorZ=cz;ih.doorFace='W';}
    });
  };

  ironhavenScene=buildTown(IRONHAVEN_CONFIG);
}

// ── ZONE TRANSITION ───────────────────────────────────────────
// v61: data-driven via ZONE_BUILDERS. Each entry describes how to reach a zone:
//   builder   — lazy scene builder (runs once, no-op on re-entry)
//   sceneGet  — returns the THREE.Scene reference at call time
//   displayName — UI string for the zone-entered banner
//   musicTrack  — string passed to startMusic() on entry
// The runtime Z/ZE swap reads ZONES[id].enemies and ZONES[id].portals, which
// are populated by the builder (buildVillage, buildTown, buildWildernessZone).
const ZONE_BUILDERS = {
  overworld:    {builder:null,             sceneGet:()=>owScene,           displayName:'🌿 Village of Ashenmoor',         musicTrack:'village'},
  bealach_south:{builder:buildBealachSouth, sceneGet:()=>bealachSouthScene, displayName:'🌾 An Bealach Mór — South',       musicTrack:'road'},
  hearthwick:   {builder:buildHearthwick,   sceneGet:()=>hearthwickScene,   displayName:'🏠 Hearthwick',                    musicTrack:'village'},
  forest:       {builder:buildForest,       sceneGet:()=>forestScene,       displayName:'🌲 The Deepwood Forest',           musicTrack:'forest'},
  ironhaven:    {builder:buildIronhaven,    sceneGet:()=>ironhavenScene,    displayName:'🏰 Ironhaven',                     musicTrack:'town'},
  // v80 — streamed world. Lazy-built by WORLD.build(); no gates (it has no edges).
  world:        {builder:()=>WORLD.build(),  sceneGet:()=>WORLD.scene,        displayName:'🌍 The open country',            musicTrack:'road', kind:'wilderness', size:2400},
};

// ── Placeholder zone registration ──────────────────────────────────────
// v61d: registerPlaceholderZone is the intended entry point for scaffolding
// new map locations. It hides the globals/wrapper/ZONE_BUILDERS boilerplate
// behind a single spec and lets the zone stay entirely inside ZONES[id].
//
// Spec fields:
//   id           (required) — zone identifier, matches ZONES[id] and MAP_NODES/EDGES
//   kind         (required) — 'wilderness' | 'village' | 'town'
//   displayName            — banner on entry, include emoji (e.g. '🌿 Redwater Ford')
//   musicTrack             — 'village' | 'town' | 'road' | 'forest'
//   size         (required) — zone edge length (wilderness 100–350, village 40–80, town 150–250)
//   seed         (required) — noise seed for deterministic terrain
//   gates        (required) — array of {x,z,targetZone,spawnX,spawnZ,spawnYaw,label}
//   skyCol/fogColor/fogDensity — optional atmospheric overrides
//   centerMarker — {title, text} renders a notice board at zone center with
//                  the zone name + description. Primary identity cue for stubs.
//   biome                  — wilderness-only: 'forest' | 'plains' (more coming)
//   pathWaypoints          — wilderness-only: [{x,z},...] for path routing
//   centerX/Z, villageR    — village-only: layout shape (auto-derived if omitted)
//   fortressX/Z, wallExtent — town-only: fortress placement
//   buildings, marketStalls — optional, empty [] by default for stubs
//   terrainAmp/flatR/hillR — village-only: terrain shaping
//
// Example:
//   registerPlaceholderZone({
//     id:'redwater_ford', kind:'village', displayName:'🌿 Redwater Ford',
//     musicTrack:'village', size:50, seed:5511,
//     centerX:25, centerZ:25, villageR:15,
//     centerMarker:{title:'Redwater Ford', text:'A ford across the Dearg…'},
//     gates:[
//       {x:25, z:47, targetZone:'overworld', spawnX:40, spawnZ:90, spawnYaw:Math.PI, label:'Ashenmoor'},
//     ],
//   });
//
// After registration the zone is lazy-built on first entry (same pattern as
// buildForest / buildHearthwick / buildIronhaven).
function registerPlaceholderZone(spec){
  if(!spec||!spec.id||!spec.kind||!spec.size||spec.seed==null){
    console.warn('registerPlaceholderZone: spec missing required fields',spec);return;
  }
  let zoneScene=null;

  // v61e4: regional identity. If spec declares a region, look up the profile
  // and use its values as fallbacks for any field the spec didn't override.
  // Explicit per-zone fields always win — region is the floor, not the cap.
  const region = spec.region && REGION_PROFILES[spec.region] ? REGION_PROFILES[spec.region] : null;
  const _pick = (specVal, regionVal, defaultVal) =>
    specVal!=null ? specVal : (regionVal!=null ? regionVal : defaultVal);

  const cfg={
    id:spec.id,
    name:spec.name||spec.displayName||spec.id,
    musicTrack:_pick(spec.musicTrack, region&&region.musicTrack, 'road'),
    size:spec.size,
    seed:spec.seed,
    gates:spec.gates||[],
    gateArr:[],
  };
  // v61e4: skyCol/fogColor/fogDensity inherit from region. Wilderness builds
  // currently consume biome.bgCol/fogCol instead of cfg.skyCol/fogColor (the
  // wilderness builder branch in BIOME_PROFILES dispatch), so for wilderness
  // zones the spec.skyCol/fogColor are documentation-only — the biome
  // override (also region-controlled) is what actually paints the sky.
  // Settlements and towns honor cfg.skyCol/fogColor at build time.
  const _sky = _pick(spec.skyCol, region&&region.skyCol, null);
  const _fog = _pick(spec.fogColor, region&&region.fogColor, null);
  const _fogD = _pick(spec.fogDensity, region&&region.fogDensity, null);
  if(_sky!=null)  cfg.skyCol=_sky;
  if(_fog!=null)  cfg.fogColor=_fog;
  if(_fogD!=null) cfg.fogDensity=_fogD;
  // v61e7 — propagate region tag to cfg so the day/night instrumentation
  // in buildVillage/buildWildernessZone/buildTown can resolve the night
  // palette. Wilderness uses region's bespoke night palette; settlements
  // use the universal village-warm palette regardless of region.
  if(spec.region) cfg.region=spec.region;
  // v61e4: propScatter passes through to wilderness builder for decorative
  // mesh placement. Settlements/towns ignore it (props belong on roads).
  if(spec.propScatter || (region && region.propScatter)){
    cfg.propScatter = spec.propScatter || region.propScatter;
  }
  if(spec.centerMarker && spec.kind !== 'wilderness'){
    // v61f: centerMarker creates a notice board ONLY for settlement-kind zones
    // (villages + towns). Wilderness placeholders previously planted a
    // non-interactive signpost in the middle of empty roads that read as
    // incomplete content rather than useful signage. The lore text in the
    // spec is preserved for reference but no in-world mesh is built.
    const cx = spec.centerX!=null ? spec.centerX : spec.size/2;
    const cz = spec.centerZ!=null ? spec.centerZ : spec.size/2;
    cfg.noticeBoardX=cx; cfg.noticeBoardZ=cz;
    cfg.noticeBoardTitle=spec.centerMarker.title||spec.displayName||spec.id;
    cfg.noticeBoardText=spec.centerMarker.text||'';
  }

  if(spec.kind==='wilderness'){
    cfg.biome=_pick(spec.biome, region&&region.biome, 'forest');
    if(spec.pathWaypoints)cfg.pathWaypoints=spec.pathWaypoints;
    // v61f7: propagate wilderness-zone payload fields that were previously
    // dropped at the registration boundary. Pattern mirrors the v61em
    // village-branch fix (decorateFn/detailFn). enemies + herbSpawns were
    // not consumed by any prior placeholder wilderness; detailFn is new
    // this ship. fogColor/fogDensity allow per-zone palette tweaks beyond
    // what the region default provides (e.g. Greywatch's denser canopy).
    // musicTrack lets a wilderness pick a non-default track when needed.
    if(spec.detailFn)   cfg.detailFn   = spec.detailFn;
    if(spec.enemies)    cfg.enemies    = spec.enemies;
    if(spec.herbSpawns) cfg.herbSpawns = spec.herbSpawns;
    if(spec.hills)      cfg.hills      = spec.hills;
    if(spec.fogColor!=null)   cfg.fogColor   = spec.fogColor;
    if(spec.fogDensity!=null) cfg.fogDensity = spec.fogDensity;
    if(spec.musicTrack) cfg.musicTrack = spec.musicTrack;
    // v61f8: propagate platforms spec (parallel to the v61f3 village
    // plumbing at line ~13638). Wilderness landmarks like Greywatch use
    // platforms to flatten interior floors atop hills — without this the
    // player's feet snap to terrain Y inside tower interiors and the
    // hill slope leaks into spaces that should read as flat floors.
    if(spec.platforms) cfg.platforms = spec.platforms;
    // v61f8: propagate portalZone for wilderness zones. Was previously
    // only set on hand-built wilderness configs (DEEPWOOD_CONFIG); needed
    // now so placeholder wilderness zones can host fort_door portals to
    // procedural fort dungeons. Same filter key as the buildWildernessZone
    // implementation: WORLD_DUNGEONS entries whose `zone` field matches.
    if(spec.portalZone) cfg.portalZone = spec.portalZone;
  } else if(spec.kind==='village'){
    cfg.terrainAmp=(spec.terrain&&spec.terrain.amp)!=null?spec.terrain.amp:1.5;
    cfg.flatR    =(spec.terrain&&spec.terrain.flatR)!=null?spec.terrain.flatR:Math.floor(spec.size*0.35);
    cfg.hillR    =(spec.terrain&&spec.terrain.hillR)!=null?spec.terrain.hillR:Math.floor(spec.size*0.55);
    cfg.centerX  =spec.centerX!=null?spec.centerX:spec.size/2;
    cfg.centerZ  =spec.centerZ!=null?spec.centerZ:spec.size/2;
    cfg.villageR =spec.villageR!=null?spec.villageR:Math.floor(spec.size*0.35);
    cfg.buildings=spec.buildings||[];
    // v61f: explicit empty NPC set. Without this, buildVillage falls through
    // to its global NPC_DEF (Ashenmoor's NPCs), which made every placeholder
    // village populate with copies of Oda/Bram/Sera/Edna.
    cfg.npcDefs  =spec.npcDefs||[];
    // v61em: propagate the decorator + detailFn hooks. buildVillage checks
    // cfg.decorateFn (per-building signs/windows/type-keyed props) and
    // cfg.detailFn (village-wide bespoke detail like Salthaven's harbor).
    // Pre-v61em these were silently dropped — placeholder villages couldn't
    // declare them, which is why Salthaven's first ship rendered as plain
    // boxes with no shrine, no dock, no harbor visible.
    if(spec.decorateFn) cfg.decorateFn=spec.decorateFn;
    if(spec.detailFn)   cfg.detailFn=spec.detailFn;
    // v61em coastal identity pass: propagate biome/terrainSlope/openSide.
    // - biome: ground texture switches from MAT.grass to a procedural
    //   biome-palette texture (BIOME_PROFILES[biome]). Salthaven uses 'coast'
    //   for salt-bleached pale ground.
    // - terrainSlope: {dir:'E', amount:2.0} ramps the village downward
    //   toward a direction. Salthaven slopes toward the harbor (east).
    // - openSide: 'E' suppresses the perimeter tree ring AND interior trees
    //   on that half of the village, opening the line of sight to the sea.
    if(spec.biome)        cfg.biome=spec.biome;
    if(spec.terrainSlope) cfg.terrainSlope=spec.terrainSlope;
    if(spec.openSide)     cfg.openSide=spec.openSide;
    // v61eo: propagate cfg.houses so buildVillage can resolve shop type
    // (h.type) for the sign-icon system in genericVillageDecorate. The
    // Ashenmoor pattern keeps shop type in a parallel HOUSES table indexed
    // by id; placeholder villages do the same via spec.houses but it
    // wasn't propagated to cfg, so the decorator never saw a type. Now
    // buildVillage can patch h.type onto each building from cfg.houses
    // before the decorator runs.
    if(spec.houses)       cfg.houses=spec.houses;
    // v61er: propagate building/roof/path/plaza fields. Each is optional
    // and the village builder has sensible defaults — placeholder villages
    // can opt into stone bodies, slate roofs, cobble paths, market posts.
    if(spec.buildingMaterial) cfg.buildingMaterial = spec.buildingMaterial;
    if(spec.roofStyle)        cfg.roofStyle        = spec.roofStyle;
    if(spec.pathStyle)        cfg.pathStyle        = spec.pathStyle;
    if(spec.plazaX != null)   cfg.plazaX           = spec.plazaX;
    if(spec.plazaZ != null)   cfg.plazaZ           = spec.plazaZ;
    if(spec.plazaProp)        cfg.plazaProp        = spec.plazaProp;
    if(spec.autoPaths === false) cfg.autoPaths = false;
    if(spec.paths)            cfg.paths            = spec.paths;
    // v61et: propagate terrainProfile / borderType / groundTexture. Each
    // optional with sensible defaults in buildVillage.
    if(spec.terrainProfile)   cfg.terrainProfile   = spec.terrainProfile;
    if(spec.borderType)       cfg.borderType       = spec.borderType;
    if(spec.groundTexture)    cfg.groundTexture    = spec.groundTexture;
    // v61ex: propagate interiorTreeStyle / groundScatter. Each optional;
    // default to forest-village register when unset.
    if(spec.interiorTreeStyle) cfg.interiorTreeStyle = spec.interiorTreeStyle;
    if(spec.groundScatter)     cfg.groundScatter     = spec.groundScatter;
    // v61f2: propagate river spec. Carves a linear channel into the heights
    // array before the terrain mesh is built — see buildVillage's heightmap
    // construction loop. Forward-compatible water-feature hook.
    if(spec.river)            cfg.river            = spec.river;
    // v61f3: propagate platforms spec. Each platform is {x0,x1,z0,z1,y|ySource,
    // name?} — a rectangular footprint where the player walks at a fixed Y
    // instead of the carved terrain Y. Required for bridges over a v61f2
    // carved river. See buildVillage for resolution + ZONES[id].platforms +
    // activeTerrainH override.
    if(spec.platforms)        cfg.platforms        = spec.platforms;
  } else if(spec.kind==='town'){
    cfg.fortressX =spec.fortressX!=null?spec.fortressX:spec.size/2;
    cfg.fortressZ =spec.fortressZ!=null?spec.fortressZ:spec.size/2;
    cfg.wallExtent=spec.wallExtent!=null?spec.wallExtent:Math.floor(spec.size*0.2);
    cfg.buildings =spec.buildings||[];
    cfg.marketStalls=spec.marketStalls||[];
    // Town needs an external gate; reuse the first entry of cfg.gates as legacy gateX/Z.
    if(cfg.gates[0]){
      const g0=cfg.gates[0];
      cfg.gateX=g0.x; cfg.gateZ=g0.z;
      cfg.gateTarget=g0.targetZone;
      cfg.gateSpawnX=g0.spawnX; cfg.gateSpawnZ=g0.spawnZ; cfg.gateSpawnYaw=g0.spawnYaw;
      cfg.gateLabel=g0.label||g0.targetZone;
    }
  } else {
    console.warn('registerPlaceholderZone: unknown kind',spec.kind);return;
  }

  const builder=function(){
    if(zoneScene)return zoneScene;
    if(spec.kind==='wilderness')     zoneScene=buildWildernessZone(cfg);
    else if(spec.kind==='town')      zoneScene=buildTown(cfg);
    else                             zoneScene=buildVillage(cfg);
    // v61e1: attach declared houses array to the live ZONES entry so the
    // generic interact / prompt handlers can resolve a near-house lookup
    // without per-zone hardcoded branches. Each entry should carry
    // {id, name, doorX, doorZ, doorFace, keeper, type, bCol, sCol, tagline?}.
    if(spec.houses && ZONES[spec.id]) ZONES[spec.id].houses=spec.houses;
    return zoneScene;
  };

  ZONE_BUILDERS[spec.id]={
    builder,
    sceneGet:()=>zoneScene,
    displayName:spec.displayName||spec.name||spec.id,
    musicTrack:spec.musicTrack||'road',
    // v61ee: keep the gate spec + size accessible pre-build so the
    // map's gate-graph builder can read every zone's connectivity at
    // load time without triggering a lazy build (which previously
    // returned an empty graph for all unbuilt zones — i.e. all of them
    // on a fresh game, since only `overworld` is built at start).
    gates:cfg.gates||[],
    size:cfg.size,
    kind:spec.kind,
  };
}

// ── v61h: AUTO-SPAWN ──────────────────────────────────────────────────
// Deriving spawn position + yaw from the target zone's own gate geometry,
// instead of hand-specifying 3 values (spawnX, spawnZ, spawnYaw) per gate.
// v61f-g playtest surfaced repeated off-path, off-edge, and wrong-facing
// spawns across 34 gates; the manual approach doesn't scale. Here we:
//   1. Find the target zone's gate that points BACK to the origin zone.
//   2. Measure its position against the zone's bounds to figure out which
//      edge it sits on (low-Z / high-Z / low-X / high-X).
//   3. Step STEPBACK units into the zone from that gate.
//   4. Set yaw to face away from that edge, into the zone.
// Fallback: if no return gate exists, returns null and caller uses the gate
// spec's explicit spawn values. (v61d7: Inis Rua now has a real return gate
// to Carraig Mór, gated by tide — so it no longer hits the fallback path.)
function _autoGateSpawn(targetZone, originZone){
  const z = ZONES[targetZone];
  if (!z || !z.gates || !z.size) return null;
  const rg = z.gates.find(g => g && g.targetZone === originZone);
  if (!rg) return null;
  const SZ = z.size;
  const STEPBACK = 12; // units inside the zone from the gate. Generous enough
                       // to clear border hedges/trees and give a view of the
                       // zone's content rather than the gate right in face.
  const gx = rg.x, gz = rg.z;
  // Low-Z edge gate → step +Z, face +Z (into higher-Z zone interior)
  if (gz <= 6)      return {x:gx,            z:gz + STEPBACK, yaw:Math.PI};
  // High-Z edge gate → step -Z, face -Z (into lower-Z zone interior)
  if (gz >= SZ - 6) return {x:gx,            z:gz - STEPBACK, yaw:0};
  // Low-X edge gate → step +X, face +X
  if (gx <= 6)      return {x:gx + STEPBACK, z:gz,            yaw:-Math.PI/2};
  // High-X edge gate → step -X, face -X
  if (gx >= SZ - 6) return {x:gx - STEPBACK, z:gz,            yaw:Math.PI/2};
  return null; // gate not near any edge — shouldn't happen for real return gates
}
