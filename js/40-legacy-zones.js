
// ══════════════════════════════════════════════════════════════
// ZONE GLOBALS (v61 — hoisted ahead of config object literals)
// ══════════════════════════════════════════════════════════════
// These module-level arrays/sizes MUST be declared before any *_CONFIG object
// literal that references them, because object-literal property evaluation
// happens at assignment time and triggers TDZ on forward const references.
// (v60 had a latent bug here — ASHENMOOR_CONFIG referenced ASHENMOOR_GATES
// declared ~600 lines later. Chrome apparently tolerated it in some versions,
// but v61's heavier refactor tripped it. Consolidated block below fixes both.)

// ── Zone gate arrays (populated at buildVillage/buildTown/buildWildernessZone time)
// Gates: {x,z,targetZone,spawnX,spawnZ,spawnYaw,label,mesh}
const ASHENMOOR_GATES=[];
const FOREST_GATES=[];
const IRONHAVEN_GATES=[];
const HEARTHWICK_GATES=[];
const BEALACH_SOUTH_GATES=[];

// ── Forest (Deepwood) zone globals
let forestScene=null;
const FOREST_SOL=[];
const FOREST_NPCS=[];
const FOREST_SIZE=300;

// ── Hearthwick (settlement, v61) globals
let hearthwickScene=null;
const HEARTHWICK_SOL=[];
const HEARTHWICK_NPCS=[];
const HEARTHWICK_HERBS=[];
const HEARTHWICK_SIZE=60;

// ── Bealach-South (wilderness, plains, v61) globals
let bealachSouthScene=null;
const BEALACH_SOUTH_SOL=[];
const BEALACH_SOUTH_HERBS=[];
const BEALACH_SOUTH_ZE=[]; // zone enemies for bealach_south
let _bealachSouthTerrainH=null;
const BEALACH_SOUTH_SIZE=200;

// VILLAGE CONFIG SYSTEM  —  buildVillage(config)
// ══════════════════════════════════════════════════════════════════════════
//
// Config schema:
// {
//   id           : string  — zone id key (matches activeZoneId)
//   name         : string  — display name
//   size         : number  — zone width/depth (square)
//   seed         : number  — heightmap seed
//   terrainAmp   : number  — outer hill amplitude
//   flatR        : number  — flat center radius
//   hillR        : number  — transition radius
//   centerX/Z    : number  — village center (for clear zone check)
//   villageR     : number  — exclusion radius around center
//   skyCol       : hex     — sky/fog colour
//   fogDensity   : number
//   gateX        : number  — north gate X position
//   gateTarget   : string  — zone ID gate leads to
//   gateSpawnX/Z : number  — spawn coords in target zone
//   musicTrack   : string  — startMusic zone key
//   buildings    : [{x,z,w,d,face,houseId}]  — building footprints
//   noticeBoardX/Z: number — notice board world coords
//   noticeBoardTitle/Text: string
//   herbSpawns   : [{x,z,type}]
//   dungeonZone  : string  — WORLD_DUNGEONS zone filter key
//   getY         : function — terrain height sampler (set after build)
//   sol          : array   — solid AABB list (populated during build)
//   npcs         : array   — NPC runtime list (populated during build)
//   herbs        : array   — herb runtime list (populated during build)
//   scene        : THREE.Scene  — populated during build
// }

const ASHENMOOR_CONFIG = {
  id:'overworld', name:'Village of Ashenmoor', musicTrack:'village',
  size:OW, seed:7331, terrainAmp:3.2, flatR:48, hillR:70,
  skyCol:0x87ceeb, fogColor:0x9ad9b0, fogDensity:.016,
  centerX:44, centerZ:42, villageR:48,
  gateArr:ASHENMOOR_GATES,
  // v61e: Ashenmoor ported to multi-gate. North → Bealach-South (existing
  // Act I chain). South → South Road → Redwater Ford (farming-country
  // branch). West → The West Track → Salthaven → Carraig Mór (coastal arc).
  // OW=120, so southern border is z≈118, western border is x≈1.5.
  gates:[
    {x:60,  z:1.5,      targetZone:'bealach_south', spawnX:100, spawnZ:192, spawnYaw:0,            label:'An Bealach Mór — South'},
    {x:60,  z:OW-1.5,   targetZone:'south_road',    spawnX:40,  spawnZ:7,   spawnYaw:Math.PI,      label:'South Road'},
    // v61ec: West Track gate moved off Ashenmoor's perimeter to Hearthwick's
    // west wall. Per the locked grid map, the West Track connects Hearthwick
    // ↔ Salthaven (lore: "fishermen bring the catch inland" — Hearthwick is
    // the inland end). Ashenmoor now has only N (Hearthwick via Bealach
    // South) and S (Ashfeld via South Road), matching the map.
  ],
  buildings:[
    {x:23,z:23,w:5,d:4,face:'E', houseId:'h0'},
    {x:34,z:22,w:4,d:4,face:'W', houseId:'h1'},
    {x:22,z:37,w:5,d:3,face:'S', houseId:'h2'},
    {x:36,z:44,w:6,d:5,face:'S', houseId:'h3'},
    {x:61,z:45,w:4,d:4,face:'S', houseId:'h4'},
    {x:54,z:58,w:4,d:3,face:'S', houseId:'h5'},
    {x:55,z:22,w:6,d:8,face:'S', houseId:'h6', type:'church'},
  ],
  noticeBoardX:30.7, noticeBoardZ:30,
  noticeBoardTitle:'Ashenmoor — Village Record',
  noticeBoardText:`Founded in the third generation after the great clearing, Ashenmoor takes its name from the grey soil that lines the moor's eastern edge — soil that does not burn, locals say, because it has already been burned.\n\nThe village grew around Bram's grandfather's forge, which was the first permanent structure. The moor itself was considered unusable land. Three families proved otherwise.\n\nCurrent population: forty-one souls, plus seasonal traders.\n\nThe dungeons to the south and east have been a fact of life here for as long as anyone can remember. The village council maintains that they are a manageable nuisance. The village blacksmith maintains that the council has not been paying attention.`,
  dungeonZone:'overworld',
  herbSpawns:[
    {x:25,  z:29, type:'firemoss'},{x:65, z:39, type:'firemoss'},
    {x:72, z:72, type:'firemoss'},{x:89, z:47, type:'firemoss'},
    {x:102, z:29, type:'firemoss'},{x:57, z:117,type:'firemoss'},
    {x:107, z:127,type:'firemoss'},
    {x:30, z:23,  type:'silverleaf'},{x:59, z:57, type:'silverleaf'},
    {x:79, z:65, type:'silverleaf'},{x:97, z:39, type:'silverleaf'},
    {x:125,z:57, type:'silverleaf'},{x:25,  z:77, type:'silverleaf'},
    {x:35, z:52, type:'ashwort'},{x:22,  z:65, type:'ashwort'},
    {x:52, z:82, type:'ashwort'},{x:77, z:107, type:'ashwort'},
    {x:117,z:87, type:'ashwort'},
    {x:42, z:62, type:'muirfhear'},{x:27, z:97, type:'muirfhear'},
    {x:67, z:117,type:'muirfhear'},{x:97, z:117,type:'muirfhear'},
    {x:31, z:35, type:'goldenrod'},{x:49, z:27, type:'goldenrod'},
    {x:72, z:37, type:'goldenrod'},{x:95, z:72, type:'goldenrod'},
    {x:37, z:77, type:'goldenrod'},
    {x:39, z:42, type:'thornberry'},{x:55, z:35, type:'thornberry'},
    {x:82, z:57, type:'thornberry'},{x:112, z:47, type:'thornberry'},
    {x:32, z:107, type:'thornberry'},
    {x:29, z:25,  type:'coldmoss'},{x:45, z:45, type:'coldmoss'},
    {x:67, z:67, type:'coldmoss'},{x:105, z:97, type:'coldmoss'},
    {x:127,z:117,type:'coldmoss'},
  ],
};

// ── Village terrain profiles (v61et) ──────────────────────────────────────
// Drives cfg.terrainProfile. Each preset bundles the three terrain-shape
// fields (terrainAmp, flatR, hillR) the village heightmap modulator reads.
// flatRRatio / hillRRatio are fractions of cfg.size — flatR=Math.floor(SIZE
// * flatRRatio) — so the same profile reads correctly at any village size.
//
// Resolution: cfg.terrainProfile fills in unset terrainAmp/flatR/hillR;
// any field the spec sets explicitly wins over the profile (the profile is
// the floor, not the cap). 'rolling' matches the prior hardcoded defaults
// exactly — villages without a profile render bit-identical.
//
// Adding a new profile: add a key with {amp:<number>, flatRRatio:<0..1>,
// hillRRatio:<0..1>}. Keep flatRRatio < hillRRatio.
const TERRAIN_PROFILES = {
  // Almost no relief — Bealach plains, low-amp pasture villages.
  flat:    {amp:0.6, flatRRatio:.50, hillRRatio:.65},
  // Default — current Ashenmoor look. Matches prior hardcoded values.
  rolling: {amp:1.5, flatRRatio:.35, hillRRatio:.55},
  // Foothills register — La Grise, hill villages with visible elevation.
  hilly:   {amp:2.6, flatRRatio:.25, hillRRatio:.45},
  // Sharp drop from a flat top to dramatic falls — Carraig Mór's outcrop,
  // any cliff-perched settlement.
  rocky:   {amp:3.4, flatRRatio:.20, hillRRatio:.42},
  // Moderate relief, tuned to pair with cfg.terrainSlope for harbor descent.
  // Salthaven-shape; the slope itself is still set per-spec.
  coastal: {amp:1.8, flatRRatio:.35, hillRRatio:.55},
};

// ── Village ground textures (v61et) ────────────────────────────────────────
// Drives cfg.groundTexture. Each entry is a function returning a
// MeshLambertMaterial. mkTex builds a procedural canvas texture so every
// surface has visual grain rather than reading as a flat tinted sheet;
// the canvas is repeated 40x40 across the village to keep grain dense.
//
// Resolution order in buildVillage:
//   cfg.groundTexture (explicit knob — highest priority)
//   ↓ if not set
//   cfg.biome via BIOME_PROFILES (back-compat with Salthaven's 'coast')
//   ↓ if not set
//   MAT.grass (default — current Ashenmoor / Hearthwick look)
//
// Adding a new texture: add a key returning a MeshLambertMaterial. The
// texture should be 128x128 (mkTex default), repeat 40,40, and produced
// from a base fill plus 600-1000 scattered HSL specks for visible grain.
const GROUND_TEXTURES = {
  // Default fallback — uses MAT.grass directly (no procedural rebuild).
  // Listed for completeness; grass is also the implicit default when neither
  // groundTexture nor biome is set.
  grass: () => MAT.grass,
  // Lighter, airier green than the dungeon-style grass tile. Plains-coded
  // villages — Cill Beag, Droichead, Bealach hamlets.
  meadow: () => {
    const t = mkTex((x,w,h)=>{
      x.fillStyle='#4a7a28'; x.fillRect(0,0,w,h);
      for(let i=0;i<800;i++){
        x.fillStyle=`hsl(${80+Math.random()*40},${40+Math.random()*30}%,${22+Math.random()*22}%)`;
        x.fillRect(Math.random()*w,Math.random()*h,Math.random()*4+1,Math.random()*3+1);
      }
    });
    t.repeat.set(40,40);
    return new THREE.MeshLambertMaterial({map:t});
  },
  // Pale tan with subtle grain — beach-strip villages, dune-coded posts.
  sand: () => {
    const t = mkTex((x,w,h)=>{
      x.fillStyle='#c8b48a'; x.fillRect(0,0,w,h);
      for(let i=0;i<1000;i++){
        x.fillStyle=`hsl(${36+Math.random()*16},${18+Math.random()*22}%,${56+Math.random()*22}%)`;
        x.fillRect(Math.random()*w,Math.random()*h,Math.random()*3+1,Math.random()*2+1);
      }
    });
    t.repeat.set(40,40);
    return new THREE.MeshLambertMaterial({map:t});
  },
  // Warm-toned weathered coastal rock — Carraig Mór's outcrop, rocky-
  // village register. Pairs naturally with cfg.buildingMaterial:'stone'.
  // v61ev rebalance: prior stone palette read as Arctic packed-ice when
  // paired with stone bodies + cool sky (the speckle hue range 200-240
  // pushed everything blue). Now uses warm-grey-brown lichen tones with
  // a 25% admixture of cool-shadow speckles, plus a small sparse moss
  // pass — five small clusters per tile vs mossy_stone's twenty-five —
  // so the rock reads as "old, weathered, lived-on" rather than freshly
  // quarried or icy. Base lightness dropped slightly for solidity.
  stone: () => {
    const t = mkTex((x,w,h)=>{
      x.fillStyle='#6e6c66'; x.fillRect(0,0,w,h);
      for(let i=0;i<900;i++){
        // 75% warm-grey lichen speckle (hue 30-60), 25% cool-shadow
        // speckle (hue 200-240). The mix keeps the surface from reading
        // monochromatic; the cool minority reads as "shadow in cracks."
        const cool = Math.random()<.25;
        x.fillStyle = cool
          ? `hsl(${200+Math.random()*40},${6+Math.random()*10}%,${24+Math.random()*22}%)`
          : `hsl(${30+Math.random()*30},${10+Math.random()*18}%,${28+Math.random()*26}%)`;
        x.fillRect(Math.random()*w,Math.random()*h,Math.random()*4+1,Math.random()*3+1);
      }
      // Sparse moss patches — five clusters per tile, irregular sizes.
      // Distinct from mossy_stone (which has 25 clusters). Reads as
      // "this rock has been here long enough for things to grow on it
      // in a few damp spots."
      for(let i=0;i<5;i++){
        const cx=Math.random()*w, cz=Math.random()*h;
        const r=3+Math.random()*5;
        for(let j=0;j<10;j++){
          x.fillStyle=`hsl(${85+Math.random()*30},${24+Math.random()*22}%,${18+Math.random()*14}%)`;
          x.fillRect(cx+(Math.random()-.5)*r,cz+(Math.random()-.5)*r,Math.random()*3+1,Math.random()*2+1);
        }
      }
    });
    t.repeat.set(40,40);
    return new THREE.MeshLambertMaterial({map:t});
  },
  // Pale blue-white packed snow with sparse darker flecks for footprint
  // and tussock reads. Knob-only for now — no canon village uses snow as
  // its ground register. Earmarked for future highland/tundra/northern
  // settlements when those land. Discovered when v61eu's stone palette
  // accidentally read as Arctic in playtest; the recipe was good, just
  // wrong for the coast. Pair with cooler skyCol/fogColor.
  snow: () => {
    const t = mkTex((x,w,h)=>{
      x.fillStyle='#d8dce4'; x.fillRect(0,0,w,h);
      for(let i=0;i<700;i++){
        // Mix of icy-blue speckle and dark-grey footprint flecks.
        const dark = Math.random()<.15;
        x.fillStyle = dark
          ? `hsl(${210+Math.random()*30},${8+Math.random()*12}%,${30+Math.random()*22}%)`
          : `hsl(${200+Math.random()*40},${6+Math.random()*14}%,${72+Math.random()*22}%)`;
        x.fillRect(Math.random()*w,Math.random()*h,Math.random()*3+1,Math.random()*2+1);
      }
    });
    t.repeat.set(40,40);
    return new THREE.MeshLambertMaterial({map:t});
  },
  // Sandy-brown trodden earth — frontier outposts, dry villages,
  // Wastes-edge settlements where vegetation has given up.
  dirt: () => {
    const t = mkTex((x,w,h)=>{
      x.fillStyle='#7a5a30'; x.fillRect(0,0,w,h);
      for(let i=0;i<800;i++){
        x.fillStyle=`hsl(${22+Math.random()*18},${22+Math.random()*22}%,${22+Math.random()*22}%)`;
        x.fillRect(Math.random()*w,Math.random()*h,Math.random()*4+1,Math.random()*3+1);
      }
    });
    t.repeat.set(40,40);
    return new THREE.MeshLambertMaterial({map:t});
  },
  // Dark grey-charcoal with sparse warmer flecks — knob-only for now.
  // Burned Ashenmoor still uses its bespoke implementation; this is for
  // future scorched/abandoned settlements.
  ash: () => {
    const t = mkTex((x,w,h)=>{
      x.fillStyle='#2a2622'; x.fillRect(0,0,w,h);
      for(let i=0;i<700;i++){
        const warm = Math.random()<.15;
        x.fillStyle = warm
          ? `hsl(${20+Math.random()*20},${30+Math.random()*30}%,${22+Math.random()*16}%)`
          : `hsl(${20+Math.random()*30},${4+Math.random()*10}%,${10+Math.random()*18}%)`;
        x.fillRect(Math.random()*w,Math.random()*h,Math.random()*3+1,Math.random()*2+1);
      }
    });
    t.repeat.set(40,40);
    return new THREE.MeshLambertMaterial({map:t});
  },
  // Bone-pale, very low-sat, slightly bluer than sand — salt-bleached
  // coastal terraces. Canonical fit for Salthaven; can move it off the
  // biome path onto this knob in a later spec pass.
  salt_flat: () => {
    const t = mkTex((x,w,h)=>{
      x.fillStyle='#c8c4b8'; x.fillRect(0,0,w,h);
      for(let i=0;i<900;i++){
        x.fillStyle=`hsl(${50+Math.random()*30},${4+Math.random()*14}%,${60+Math.random()*22}%)`;
        x.fillRect(Math.random()*w,Math.random()*h,Math.random()*3+1,Math.random()*2+1);
      }
    });
    t.repeat.set(40,40);
    return new THREE.MeshLambertMaterial({map:t});
  },
  // Cool grey with green moss patches — damp-coast / shaded-village register.
  // Inis Rua candidate; chapels in woodland clearings.
  mossy_stone: () => {
    const t = mkTex((x,w,h)=>{
      x.fillStyle='#6e7470'; x.fillRect(0,0,w,h);
      // Stone speckle base layer
      for(let i=0;i<600;i++){
        x.fillStyle=`hsl(${180+Math.random()*60},${4+Math.random()*14}%,${28+Math.random()*28}%)`;
        x.fillRect(Math.random()*w,Math.random()*h,Math.random()*4+1,Math.random()*3+1);
      }
      // Moss patches — irregular green clusters
      for(let i=0;i<25;i++){
        const cx=Math.random()*w, cz=Math.random()*h;
        const r=4+Math.random()*8;
        for(let j=0;j<20;j++){
          x.fillStyle=`hsl(${85+Math.random()*30},${30+Math.random()*22}%,${16+Math.random()*16}%)`;
          x.fillRect(cx+(Math.random()-.5)*r,cz+(Math.random()-.5)*r,Math.random()*3+1,Math.random()*2+1);
        }
      }
    });
    t.repeat.set(40,40);
    return new THREE.MeshLambertMaterial({map:t});
  },
  // Iron-stained warm-grey rock — Inis Rua's signature ground. Reads as
  // weathered coastal stone with rust-orange patches and runs where iron
  // in the rock has bled out under repeated rain. Lore-coded: "Red Island"
  // is named for this iron-runoff staining (per Niamh's dialog beat —
  // "the rock has iron. The rain comes."). Distinct from `stone` (warm-
  // neutral lichen tones, no rust) and from `dirt` (uniform brown earth,
  // no stone underlayer). Pairs with cfg.buildingMaterial:'stone'.
  //
  // Recipe: warm-grey base (slightly redder than `stone`), 65% warm-grey
  // lichen speckle, 20% cool-shadow speckle, 15% rust-orange flecks for
  // the iron read. Plus 4 rust-runoff streaks per tile — irregular elongated
  // smears in deeper red-orange, simulating how rust-laden water tracks
  // across stone in characteristic streaky patterns rather than even staining.
  rust_stone: () => {
    const t = mkTex((x,w,h)=>{
      x.fillStyle='#706660'; x.fillRect(0,0,w,h);
      for(let i=0;i<900;i++){
        const r = Math.random();
        let style;
        if(r < .15){
          // Rust flecks — warm orange, low-mid lightness
          style = `hsl(${14+Math.random()*16},${40+Math.random()*30}%,${28+Math.random()*18}%)`;
        } else if(r < .35){
          // Cool-shadow speckle — minority, reads as cracks
          style = `hsl(${200+Math.random()*40},${6+Math.random()*10}%,${22+Math.random()*22}%)`;
        } else {
          // Warm-grey lichen base — majority
          style = `hsl(${30+Math.random()*30},${10+Math.random()*16}%,${28+Math.random()*26}%)`;
        }
        x.fillStyle = style;
        x.fillRect(Math.random()*w,Math.random()*h,Math.random()*4+1,Math.random()*3+1);
      }
      // Rust-runoff streaks — 4 per tile, elongated smears in deeper rust.
      // Horizontal-leaning to simulate gravity-driven runoff direction.
      for(let i=0;i<4;i++){
        const cx=Math.random()*w, cz=Math.random()*h;
        const len=8+Math.random()*10;
        const angle=(Math.random()-.5)*0.6; // mostly-horizontal
        for(let j=0;j<24;j++){
          const t=j/24;
          const sx = cx + Math.cos(angle)*len*t + (Math.random()-.5)*2;
          const sz = cz + Math.sin(angle)*len*t + (Math.random()-.5)*2;
          x.fillStyle=`hsl(${10+Math.random()*14},${44+Math.random()*26}%,${22+Math.random()*16}%)`;
          x.fillRect(sx,sz,Math.random()*2.5+1,Math.random()*2+1);
        }
      }
    });
    t.repeat.set(40,40);
    return new THREE.MeshLambertMaterial({map:t});
  },
};

// ── Village building materials + roof styles (v61er) ───────────────────────
// Tables driving cfg.buildingMaterial and cfg.roofStyle (and per-building
// h.material / h.roofStyle overrides).
//
// Materials drive the body mesh's surface only — same box geometry for all.
// Roofs drive both geometry shape and surface material; pitched-style roofs
// share the existing 4-sided cone shape, flat-style swap to a slab box.
//
// Adding a new material: add a key with {bodyMat: <MeshLambertMaterial>}.
// Adding a new roof style: add a key with {style:'pitched'|'flat',
//   mat:<MeshLambertMaterial>, height:<number>}.
const BUILDING_MATERIALS = {
  // Default — current Ashenmoor / Hearthwick / Salthaven look.
  timber: {bodyMat: MAT.wood},
  // Warm weathered grey-tan stone — for Carraig Mór coastal-rock register,
  // foothill mining camps (La Grise, Colmán's Rest), highland garrisons
  // (Mur Pierre). v61ew rebalance: prior 0x6e7078 was cool-grey hue ~210
  // and read as glacier-cut/snow-shadow under coastal sky tinting; now hue
  // ~30 (warm grey-tan) at same lightness reads as hand-cut sea-stone.
  stone:  {bodyMat: new THREE.MeshLambertMaterial({color: 0x787068})},
  // Reddish-brown brick — for Coeur de Vie / Ironhaven inner districts /
  // any walled-town brownstone register.
  brick:  {bodyMat: new THREE.MeshLambertMaterial({color: 0x7a3a28})},
};
const BUILDING_ROOFS = {
  // Default — current cone-thatch look.
  thatch_pitched: {style:'pitched', mat: MAT.thatch, height: 1.5},
  // Warm dark grey-brown slate — pairs with stone bodies in highland
  // villages. v61ew rebalance: prior 0x4a4a52 was cool-grey hue ~210 and
  // read as snow-shadow stacked over the warmed stone walls; now hue ~25
  // (warm dark brown-grey) reads as old wet sea-slate.
  slate_pitched:  {style:'pitched', mat: new THREE.MeshLambertMaterial({color: 0x453e38}), height: 1.4},
  // Terracotta-orange tile roof — pairs with brick or stone in coastal
  // and capital districts; warmer than slate, more refined than thatch.
  tile_pitched:   {style:'pitched', mat: new THREE.MeshLambertMaterial({color: 0xa84e2a}), height: 1.4},
  // Flat slab roof — reads as urban brownstone / walled-town tenement.
  // Pairs naturally with brick or stone bodies. Sits flush atop the body.
  flat:           {style:'flat',    mat: new THREE.MeshLambertMaterial({color: 0x3a3838})},
};

// ── Village path styles (v61er) ────────────────────────────────────────────
// Drive cfg.pathStyle. Each entry defines a material for the path mesh
// and a width (XZ extent of each segment box).
const PATH_STYLES = {
  // Default — sandy-brown trodden dirt; cottage-village register.
  dirt:   {mat: new THREE.MeshLambertMaterial({color: 0x8a6a3a}), width: 1.4},
  // Light grey paving stones; established/walled-town register.
  cobble: {mat: new THREE.MeshLambertMaterial({color: 0x88847c}), width: 1.6},
  // Weathered timber planks; coastal harbor register (could pair with
  // dock-side villages where boards are the natural ground surface near
  // the water).
  plank:  {mat: new THREE.MeshLambertMaterial({color: 0x6a4a28}), width: 1.4},
};

// ── Village border types (v61et) ───────────────────────────────────────────
// Drives cfg.borderType. Each entry is a function that paints the village
// perimeter in a particular register. Called by buildVillage after the
// terrain + buildings are placed but before the interior-tree pass.
//
// Signature: (scene, sol, cfg, helpers) → void
//   helpers.SIZE     — village zone size in world units
//   helpers.getY     — terrain Y sampler at (x,z)
//   helpers.inGap    — predicate: is (x,z) inside a gate gap?
//   helpers.skipN/S/E/W — booleans from cfg.openSide (true = suppress on this side)
//
// Each builder honors helpers.inGap (so gate corridors aren't blocked) and
// helpers.skip* (so cfg.openSide can clear a side for line-of-sight).
//
// Resolution: cfg.borderType selects; defaults to 'hedge_and_trees' which
// preserves the prior unconditional perimeter loop bit-for-bit.
//
// Adding a new type: add a key with a function matching the signature.
// Push collision entries onto sol if the prop should block movement.
const BORDER_TYPES = {

  // Default — current Ashenmoor / Hearthwick perimeter. Hedges along the
  // edge plus a row of border trees one step inward. Gaps for gates and
  // cfg.openSide honored.
  hedge_and_trees: function(sc, sol, cfg, h){
    const {SIZE, getY, inGap, skipN, skipS, skipE, skipW} = h;
    const hedgeMat=new THREE.MeshLambertMaterial({color:0x1a4a12});
    const hedgeDarkMat=new THREE.MeshLambertMaterial({color:0x112e0a});
    const trunkMat=new THREE.MeshLambertMaterial({color:0x3a2010});
    const _hedge=(x,z)=>{
      if(inGap(x,z))return;
      const ty=getY(x,z);
      const w=1.6+Math.random()*.8,hh=1.1+Math.random()*.5,d=1.2+Math.random()*.5;
      const body=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),hedgeMat);
      body.position.set(x,ty+hh/2,z);sc.add(body);
      for(let l=0;l<2+Math.floor(Math.random()*2);l++){
        const lump=new THREE.Mesh(new THREE.SphereGeometry(.45+Math.random()*.2,5,4),hedgeDarkMat);
        lump.scale.set(1,.65,1);
        lump.position.set(x+(Math.random()-.5)*.6,ty+hh*.8+Math.random()*.2,z+(Math.random()-.5)*.4);
        sc.add(lump);
      }
    };
    const _borderTree=(x,z)=>{
      if(inGap(x,z))return;
      const ty=getY(x,z);
      const hh=4+Math.random()*3.5,r=1.6+Math.random()*.9;
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(r*.15,r*.22,hh*.5,6),trunkMat);
      trunk.position.set(x,ty+hh*.25,z);sc.add(trunk);
      const canCol=new THREE.Color().setHSL(.28+Math.random()*.07,.52,.14+Math.random()*.09);
      const can=new THREE.Mesh(new THREE.ConeGeometry(r,hh*.75,7),new THREE.MeshLambertMaterial({color:canCol}));
      can.position.set(x,ty+hh*.5+hh*.3,z);sc.add(can);
      sol.push({cx:x,cz:z,rx:r*.4,rz:r*.4});
    };
    const bStep=2.2,bM=2.0,tM=4.5;
    for(let x=bM;x<SIZE-bM;x+=bStep){
      if(!skipN) _hedge(x+(Math.random()-.5)*.5,bM+(Math.random()-.5)*.4);
      if(!skipS) _hedge(x+(Math.random()-.5)*.5,SIZE-bM+(Math.random()-.5)*.4);
    }
    for(let z=bM+bStep;z<SIZE-bM-bStep;z+=bStep){
      if(!skipW) _hedge(bM+(Math.random()-.5)*.4,z+(Math.random()-.5)*.5);
      if(!skipE) _hedge(SIZE-bM+(Math.random()-.5)*.4,z+(Math.random()-.5)*.5);
    }
    for(let x=tM;x<SIZE-tM;x+=bStep*1.1){
      if(!skipN) _borderTree(x+(Math.random()-.5)*1.2,tM+(Math.random()-.5)*.8);
      if(!skipS) _borderTree(x+(Math.random()-.5)*1.2,SIZE-tM+(Math.random()-.5)*.8);
    }
    for(let z=tM+bStep;z<SIZE-tM-bStep;z+=bStep*1.1){
      if(!skipW) _borderTree(tM+(Math.random()-.5)*.8,z+(Math.random()-.5)*1.2);
      if(!skipE) _borderTree(SIZE-tM+(Math.random()-.5)*.8,z+(Math.random()-.5)*1.2);
    }
  },

  // Sparse fence-rail segments + occasional standing post. Reads as: rural,
  // decayed, not actively maintained. Random gaps where rails have rotted
  // out. Hermit's Camp, Caer Uaigneach, decayed wastes settlements.
  broken_fence: function(sc, sol, cfg, h){
    const {SIZE, getY, inGap, skipN, skipS, skipE, skipW} = h;
    const woodMat=new THREE.MeshLambertMaterial({color:0x4a3018});
    const darkWoodMat=new THREE.MeshLambertMaterial({color:0x2a1808});
    const _post=(x,z,leaning)=>{
      if(inGap(x,z))return;
      const ty=getY(x,z);
      const ph=1.0+Math.random()*.4;
      const post=new THREE.Mesh(new THREE.BoxGeometry(.10,ph,.10),darkWoodMat);
      post.position.set(x,ty+ph/2,z);
      if(leaning) post.rotation.z=(Math.random()-.5)*.35;
      sc.add(post);
      sol.push({cx:x,cz:z,rx:.15,rz:.15});
    };
    const _rail=(x1,z1,x2,z2)=>{
      const mx=(x1+x2)/2, mz=(z1+z2)/2;
      if(inGap(mx,mz))return;
      const ty=getY(mx,mz);
      const len=Math.hypot(x2-x1,z2-z1);
      const rail=new THREE.Mesh(new THREE.BoxGeometry(len,.06,.05),woodMat);
      rail.position.set(mx,ty+.55+(Math.random()-.5)*.1,mz);
      rail.rotation.y=Math.atan2(z2-z1,x2-x1);
      rail.rotation.z=(Math.random()-.5)*.12;
      sc.add(rail);
    };
    const step=4.0, edgeM=2.5;
    // Posts at irregular spacing along each edge
    for(let x=edgeM;x<SIZE-edgeM;x+=step+Math.random()*1.5){
      if(!skipN) _post(x,edgeM+(Math.random()-.5)*.5,Math.random()<.4);
      if(!skipS) _post(x,SIZE-edgeM+(Math.random()-.5)*.5,Math.random()<.4);
    }
    for(let z=edgeM+step;z<SIZE-edgeM-step;z+=step+Math.random()*1.5){
      if(!skipW) _post(edgeM+(Math.random()-.5)*.5,z,Math.random()<.4);
      if(!skipE) _post(SIZE-edgeM+(Math.random()-.5)*.5,z,Math.random()<.4);
    }
    // Rail segments connecting some adjacent posts — ~60% present, rest rotted out
    const lay=(side)=>{
      let prevX=null, prevZ=null;
      const fixed=(side==='N'||side==='S') ? edgeM : (side==='W' ? edgeM : SIZE-edgeM);
      const z0=(side==='N') ? edgeM : (side==='S' ? SIZE-edgeM : null);
      for(let t=edgeM;t<SIZE-edgeM;t+=step){
        const cx = (side==='N'||side==='S') ? t : fixed;
        const cz = (side==='N'||side==='S') ? z0 : t;
        if(prevX!=null && Math.random()<.6) _rail(prevX,prevZ,cx,cz);
        prevX=cx; prevZ=cz;
      }
    };
    if(!skipN) lay('N');
    if(!skipS) lay('S');
    if(!skipW) lay('W');
    if(!skipE) lay('E');
  },

  // Low rolling sand mounds + beach-grass tufts. No trees, no hedges.
  // Salthaven dune-strip register, beach-coded villages.
  sand_dunes: function(sc, sol, cfg, h){
    const {SIZE, getY, inGap, skipN, skipS, skipE, skipW} = h;
    const sandMat=new THREE.MeshLambertMaterial({color:0xc8b48a});
    const grassMat=new THREE.MeshLambertMaterial({color:0x8a9848,side:THREE.DoubleSide});
    const _dune=(x,z)=>{
      if(inGap(x,z))return;
      const ty=getY(x,z);
      const r=1.0+Math.random()*1.4, dh=.25+Math.random()*.45;
      const mound=new THREE.Mesh(new THREE.SphereGeometry(r,8,5),sandMat);
      mound.scale.set(1, dh/r, 1);
      mound.position.set(x,ty+dh*.4,z);
      sc.add(mound);
      sol.push({cx:x,cz:z,rx:r*.5,rz:r*.5});
      // Beach grass tufts on top of larger dunes
      if(r>1.6){
        for(let g=0;g<3+Math.floor(Math.random()*3);g++){
          const gx=x+(Math.random()-.5)*r*.7, gz=z+(Math.random()-.5)*r*.7;
          const blade=new THREE.Mesh(new THREE.PlaneGeometry(.06+Math.random()*.04,.4+Math.random()*.2),grassMat);
          blade.position.set(gx,getY(gx,gz)+dh+.2,gz);blade.rotation.y=Math.random()*Math.PI;sc.add(blade);
        }
      }
    };
    const step=2.8, edgeM=2.5;
    for(let x=edgeM;x<SIZE-edgeM;x+=step+Math.random()*.8){
      if(!skipN) _dune(x+(Math.random()-.5)*1.0,edgeM+(Math.random()-.5)*1.5);
      if(!skipS) _dune(x+(Math.random()-.5)*1.0,SIZE-edgeM+(Math.random()-.5)*1.5);
    }
    for(let z=edgeM+step;z<SIZE-edgeM-step;z+=step+Math.random()*.8){
      if(!skipW) _dune(edgeM+(Math.random()-.5)*1.5,z+(Math.random()-.5)*1.0);
      if(!skipE) _dune(SIZE-edgeM+(Math.random()-.5)*1.5,z+(Math.random()-.5)*1.0);
    }
  },

  // Dry-stone wall segments at chest height with occasional gaps for path
  // routing. Carraig Mór paired with stone+slate bodies, Mur Pierre,
  // hill-village register.
  stone_walls: function(sc, sol, cfg, h){
    const {SIZE, getY, inGap, skipN, skipS, skipE, skipW} = h;
    const stoneMat=new THREE.MeshLambertMaterial({color:0x76787a});
    const stoneDarkMat=new THREE.MeshLambertMaterial({color:0x5a5c5e});
    const _wall=(x,z,len,horizontal)=>{
      const cx=horizontal? x+len/2 : x;
      const cz=horizontal? z : z+len/2;
      if(inGap(cx,cz))return;
      const ty=getY(cx,cz);
      const wH=.85+Math.random()*.2;
      const w = horizontal ? len : .35;
      const d = horizontal ? .35 : len;
      const wall=new THREE.Mesh(new THREE.BoxGeometry(w,wH,d),stoneMat);
      wall.position.set(cx,ty+wH/2,cz);
      sc.add(wall);
      sol.push({cx, cz, rx:w/2, rz:d/2});
      // Capstones — slightly darker stones along the top, irregular spacing
      const nCaps = Math.floor(len/0.5);
      for(let i=0;i<nCaps;i++){
        if(Math.random()<.3) continue; // some caps missing
        const fx=horizontal? x + (i+.5)*(len/nCaps) : cx;
        const fz=horizontal? cz : z + (i+.5)*(len/nCaps);
        const cap=new THREE.Mesh(new THREE.BoxGeometry(.32,.10,.32),stoneDarkMat);
        cap.position.set(fx,ty+wH+.05,fz);
        cap.rotation.y=Math.random()*.4-.2;
        sc.add(cap);
      }
    };
    // Walls in segments with occasional gaps. 5-8u long each, 1-2u gap between.
    const lay=(side)=>{
      let t=2.5;
      while(t<SIZE-2.5){
        const segLen = 5 + Math.random()*3;
        if(t+segLen > SIZE-2.5) break;
        if(Math.random()<.85){ // 15% of segments are missing entirely
          if(side==='N') _wall(t, 2.5, segLen, true);
          else if(side==='S') _wall(t, SIZE-2.5, segLen, true);
          else if(side==='W') _wall(2.5, t, segLen, false);
          else if(side==='E') _wall(SIZE-2.5, t, segLen, false);
        }
        t += segLen + 1 + Math.random()*1.5;
      }
    };
    if(!skipN) lay('N');
    if(!skipS) lay('S');
    if(!skipW) lay('W');
    if(!skipE) lay('E');
  },

  // Tall pointed-log fence with tar-darkened tips. Frontier outposts:
  // future garrison sites. Note: Thorngate currently has its own bespoke
  // fence build elsewhere — this knob is for new placeholder villages
  // adopting the register.
  palisade: function(sc, sol, cfg, h){
    const {SIZE, getY, inGap, skipN, skipS, skipE, skipW} = h;
    const logMat=new THREE.MeshLambertMaterial({color:0x4a3010});
    const tipMat=new THREE.MeshLambertMaterial({color:0x1a1008});
    const _log=(x,z)=>{
      if(inGap(x,z))return;
      const ty=getY(x,z);
      const lh=2.4+Math.random()*.3;
      const log=new THREE.Mesh(new THREE.CylinderGeometry(.16,.18,lh,7),logMat);
      log.position.set(x,ty+lh/2,z);
      log.rotation.y=Math.random()*Math.PI;
      sc.add(log);
      // Tar-darkened pointed tip
      const tip=new THREE.Mesh(new THREE.ConeGeometry(.18,.32,7),tipMat);
      tip.position.set(x,ty+lh+.16,z);
      sc.add(tip);
      sol.push({cx:x,cz:z,rx:.20,rz:.20});
    };
    const step=0.55, edgeM=2.0;
    for(let x=edgeM;x<SIZE-edgeM;x+=step){
      if(!skipN) _log(x+(Math.random()-.5)*.05,edgeM+(Math.random()-.5)*.05);
      if(!skipS) _log(x+(Math.random()-.5)*.05,SIZE-edgeM+(Math.random()-.5)*.05);
    }
    for(let z=edgeM+step;z<SIZE-edgeM-step;z+=step){
      if(!skipW) _log(edgeM+(Math.random()-.5)*.05,z+(Math.random()-.5)*.05);
      if(!skipE) _log(SIZE-edgeM+(Math.random()-.5)*.05,z+(Math.random()-.5)*.05);
    }
  },

  // Hedges that have outgrown their pruning + trees encroaching from
  // outside, plus the occasional fallen log. The "village is older than
  // its caretakers" register. Cill Beag candidate; older inland villages.
  mixed_overgrown: function(sc, sol, cfg, h){
    const {SIZE, getY, inGap, skipN, skipS, skipE, skipW} = h;
    const hedgeMat=new THREE.MeshLambertMaterial({color:0x1e3a14});
    const hedgeDarkMat=new THREE.MeshLambertMaterial({color:0x122a0c});
    const trunkMat=new THREE.MeshLambertMaterial({color:0x3a2010});
    const fallenMat=new THREE.MeshLambertMaterial({color:0x2a1a0c});
    const _hedge=(x,z)=>{
      if(inGap(x,z))return;
      const ty=getY(x,z);
      // Bigger, more chaotic than hedge_and_trees
      const w=1.8+Math.random()*1.0,hh=1.4+Math.random()*.7,d=1.4+Math.random()*.7;
      const body=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),hedgeMat);
      body.position.set(x,ty+hh/2,z);sc.add(body);
      for(let l=0;l<3+Math.floor(Math.random()*3);l++){
        const lump=new THREE.Mesh(new THREE.SphereGeometry(.5+Math.random()*.3,5,4),hedgeDarkMat);
        lump.scale.set(1,.7,1);
        lump.position.set(x+(Math.random()-.5)*.9,ty+hh*.8+Math.random()*.3,z+(Math.random()-.5)*.6);
        sc.add(lump);
      }
      sol.push({cx:x,cz:z,rx:w*.4,rz:d*.4});
    };
    const _tree=(x,z)=>{
      if(inGap(x,z))return;
      const ty=getY(x,z);
      const hh=5+Math.random()*4,r=1.8+Math.random()*1.0;
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(r*.15,r*.22,hh*.5,6),trunkMat);
      trunk.position.set(x,ty+hh*.25,z);sc.add(trunk);
      const canCol=new THREE.Color().setHSL(.28+Math.random()*.07,.48,.13+Math.random()*.08);
      const can=new THREE.Mesh(new THREE.ConeGeometry(r,hh*.75,7),new THREE.MeshLambertMaterial({color:canCol}));
      can.position.set(x,ty+hh*.5+hh*.3,z);sc.add(can);
      sol.push({cx:x,cz:z,rx:r*.4,rz:r*.4});
    };
    const _fallenLog=(x,z,rotY)=>{
      if(inGap(x,z))return;
      const ty=getY(x,z);
      const ll=2.5+Math.random()*1.5;
      const log=new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,ll,7),fallenMat);
      log.position.set(x,ty+.24,z);
      log.rotation.z=Math.PI/2;
      log.rotation.y=rotY;
      sc.add(log);
      sol.push({cx:x,cz:z,rx:ll*.35,rz:.35});
    };
    const bStep=2.4,bM=2.0,tM=4.5;
    for(let x=bM;x<SIZE-bM;x+=bStep){
      if(!skipN) _hedge(x+(Math.random()-.5)*.7,bM+(Math.random()-.5)*.6);
      if(!skipS) _hedge(x+(Math.random()-.5)*.7,SIZE-bM+(Math.random()-.5)*.6);
    }
    for(let z=bM+bStep;z<SIZE-bM-bStep;z+=bStep){
      if(!skipW) _hedge(bM+(Math.random()-.5)*.6,z+(Math.random()-.5)*.7);
      if(!skipE) _hedge(SIZE-bM+(Math.random()-.5)*.6,z+(Math.random()-.5)*.7);
    }
    // Trees encroaching — denser and irregular
    for(let x=tM;x<SIZE-tM;x+=bStep*0.95){
      if(!skipN && Math.random()<.85) _tree(x+(Math.random()-.5)*1.5,tM+(Math.random()-.5)*1.2);
      if(!skipS && Math.random()<.85) _tree(x+(Math.random()-.5)*1.5,SIZE-tM+(Math.random()-.5)*1.2);
    }
    for(let z=tM+bStep;z<SIZE-tM-bStep;z+=bStep*0.95){
      if(!skipW && Math.random()<.85) _tree(tM+(Math.random()-.5)*1.2,z+(Math.random()-.5)*1.5);
      if(!skipE && Math.random()<.85) _tree(SIZE-tM+(Math.random()-.5)*1.2,z+(Math.random()-.5)*1.5);
    }
    // 3-5 fallen logs randomly along the perimeter
    const nLogs = 3+Math.floor(Math.random()*3);
    for(let i=0;i<nLogs;i++){
      const side=Math.floor(Math.random()*4);
      const t=4+Math.random()*(SIZE-8);
      if(side===0 && !skipN) _fallenLog(t,2.5+Math.random()*2,Math.random()*Math.PI*2);
      else if(side===1 && !skipS) _fallenLog(t,SIZE-2.5-Math.random()*2,Math.random()*Math.PI*2);
      else if(side===2 && !skipW) _fallenLog(2.5+Math.random()*2,t,Math.random()*Math.PI*2);
      else if(side===3 && !skipE) _fallenLog(SIZE-2.5-Math.random()*2,t,Math.random()*Math.PI*2);
    }
  },
};

// ── Village interior trees (v61ex) ─────────────────────────────────────────
// Drives cfg.interiorTreeStyle. Each entry is a function called per
// candidate position by the interior-tree pass in buildVillage. The pass
// scatters trees in 7×7 grid cells outside the village circle (for line-
// of-sight reasons — buildings + plaza inside, vegetation outside);
// cfg.openSide suppresses one half of the placements.
//
// Signature: (x, z, sc, sol, getY) → void
//   The function builds whatever tree-shaped mesh fits the regional
//   register at (x,z). Same call shape as the prior _borderTree helper
//   so every existing villager-tree placement keeps working.
//
// Resolution: cfg.interiorTreeStyle picks; defaults to 'cone_pine' which
// preserves the prior _borderTree call bit-for-bit. 'none' suppresses
// the pass entirely (sentinel handled in buildVillage, not here).
//
// Adding a new style: add a key with a function matching the signature.
// Push a sol entry if the tree should block movement.
const INTERIOR_TREES = {

  // Default — current pine cone. 4-7.5u tall, dark green canopy, hue
  // varies in a tight forest range. Matches Ashenmoor / Hearthwick /
  // every existing inland village.
  cone_pine: function(x, z, sc, sol, getY){
    const ty = getY(x,z);
    const trunkMat=new THREE.MeshLambertMaterial({color:0x3a2010});
    const h=4+Math.random()*3.5, r=1.6+Math.random()*.9;
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(r*.15,r*.22,h*.5,6),trunkMat);
    trunk.position.set(x,ty+h*.25,z);
    sc.add(trunk);
    const canCol=new THREE.Color().setHSL(.28+Math.random()*.07,.52,.14+Math.random()*.09);
    const can=new THREE.Mesh(new THREE.ConeGeometry(r,h*.75,7),new THREE.MeshLambertMaterial({color:canCol}));
    can.position.set(x,ty+h*.5+h*.3,z);
    sc.add(can);
    sol.push({cx:x,cz:z,rx:r*.4,rz:r*.4});
  },

  // Short bent trunk + sparse asymmetric canopy — windswept register for
  // exposed coastal cliffs / highland coastal villages. Trunk bends ~20°
  // off vertical with the canopy hanging on the leeward side. Canopy is
  // smaller and looser than cone_pine to suggest constant pruning by
  // wind. Inis Rua candidate, future cliff-perched villages.
  windswept: function(x, z, sc, sol, getY){
    const ty = getY(x,z);
    const trunkMat=new THREE.MeshLambertMaterial({color:0x3a2814});
    const h=2.2+Math.random()*1.5, r=1.0+Math.random()*.5;
    // Bent trunk — group rotated ~20° on a random axis
    const trunkGroup=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(r*.18,r*.24,h*.6,6),trunkMat);
    trunk.position.set(0, h*.30, 0);
    trunkGroup.add(trunk);
    // Canopy clusters — 2-3 smaller spheres clustered toward one side
    const canCol=new THREE.Color().setHSL(.20+Math.random()*.06,.32,.18+Math.random()*.08);
    const canMat=new THREE.MeshLambertMaterial({color:canCol});
    const leanX = .6 + Math.random()*.3;
    for(let i=0;i<2+Math.floor(Math.random()*2);i++){
      const cluster=new THREE.Mesh(new THREE.SphereGeometry(r*.55+Math.random()*r*.2,5,4), canMat);
      cluster.position.set(leanX + (Math.random()-.5)*.4, h*.55 + i*.2 + Math.random()*.15, (Math.random()-.5)*.4);
      cluster.scale.set(1, .7, 1);
      trunkGroup.add(cluster);
    }
    trunkGroup.position.set(x, ty, z);
    trunkGroup.rotation.y = Math.random()*Math.PI*2;
    trunkGroup.rotation.z = -0.30 - Math.random()*0.10; // bend ~20° off vertical
    sc.add(trunkGroup);
    sol.push({cx:x,cz:z,rx:r*.3,rz:r*.3});
  },

  // Bare trunk + leafless branches, dim grey-brown. Wastes-edge villages,
  // Caer Uaigneach. No canopy — just naked branches at the top suggesting
  // a tree that died standing.
  dead: function(x, z, sc, sol, getY){
    const ty = getY(x,z);
    const trunkMat=new THREE.MeshLambertMaterial({color:0x2a2018});
    const h=3.5+Math.random()*2.5, r=1.0+Math.random()*.5;
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(r*.10,r*.18,h*.85,6),trunkMat);
    trunk.position.set(x, ty+h*.42, z);
    sc.add(trunk);
    // 3-5 bare branches at the top, irregular angles
    const branchMat=new THREE.MeshLambertMaterial({color:0x382818});
    const nBranch = 3 + Math.floor(Math.random()*3);
    for(let i=0;i<nBranch;i++){
      const bLen=h*.20+Math.random()*h*.15;
      const branch=new THREE.Mesh(new THREE.CylinderGeometry(r*.04,r*.07,bLen,5),branchMat);
      const ang = (i/nBranch)*Math.PI*2 + Math.random()*.5;
      branch.position.set(x + Math.cos(ang)*bLen*.4, ty+h*.85 + Math.random()*h*.05, z + Math.sin(ang)*bLen*.4);
      branch.rotation.z = (Math.random()<.5?1:-1) * (.6 + Math.random()*.3);
      branch.rotation.y = ang;
      sc.add(branch);
    }
    sol.push({cx:x,cz:z,rx:r*.2,rz:r*.2});
  },

  // White-bark thin trunks + lighter sparse canopy. Northern villages,
  // tundra-edge content. Slimmer and taller than pine; canopy is a
  // looser cluster of small spheres, lighter green-grey.
  birch_grove: function(x, z, sc, sol, getY){
    const ty = getY(x,z);
    const trunkMat=new THREE.MeshLambertMaterial({color:0xd8d4c8});
    const trunkDarkMat=new THREE.MeshLambertMaterial({color:0x4a4438});
    const h=4.5+Math.random()*3, r=.6+Math.random()*.4;
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(r*.12,r*.16,h*.7,6),trunkMat);
    trunk.position.set(x, ty+h*.35, z);
    sc.add(trunk);
    // 2-3 dark bark stripes on the trunk for the birch read
    for(let i=0;i<2+Math.floor(Math.random()*2);i++){
      const stripe=new THREE.Mesh(new THREE.BoxGeometry(r*.25,.06,.04),trunkDarkMat);
      stripe.position.set(x + (Math.random()-.5)*r*.1, ty + h*.15 + i*h*.18, z + r*.13);
      stripe.rotation.y = Math.random()*Math.PI;
      sc.add(stripe);
    }
    // Loose canopy — 3-4 small spheres clustered at the top
    const canCol=new THREE.Color().setHSL(.18+Math.random()*.05,.30,.32+Math.random()*.10);
    const canMat=new THREE.MeshLambertMaterial({color:canCol});
    for(let i=0;i<3+Math.floor(Math.random()*2);i++){
      const cluster=new THREE.Mesh(new THREE.SphereGeometry(r*.55,5,4), canMat);
      cluster.position.set(x + (Math.random()-.5)*r*.7, ty + h*.75 + (Math.random()-.5)*r*.4, z + (Math.random()-.5)*r*.7);
      cluster.scale.set(1, .7, 1);
      sc.add(cluster);
    }
    sol.push({cx:x,cz:z,rx:r*.25,rz:r*.25});
  },

  // Wide-fronded short trunk, beach-coded. Catalog completeness for
  // future tropical / endgame procedural-town content. No canon village
  // uses palm yet.
  palm: function(x, z, sc, sol, getY){
    const ty = getY(x,z);
    const trunkMat=new THREE.MeshLambertMaterial({color:0x5a4028});
    const h=3.5+Math.random()*1.5, r=.8;
    // Slight curve via a tilted trunk
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(r*.16,r*.22,h*.85,6),trunkMat);
    const tilt = (Math.random()-.5)*.25;
    trunk.position.set(x, ty+h*.42, z);
    trunk.rotation.z = tilt;
    sc.add(trunk);
    // 5-7 fronds radiating from the top — flat plane segments tilted down
    const frondMat=new THREE.MeshLambertMaterial({color:0x4a7028, side:THREE.DoubleSide});
    const nFrond = 5 + Math.floor(Math.random()*3);
    for(let i=0;i<nFrond;i++){
      const ang = (i/nFrond)*Math.PI*2;
      const frond=new THREE.Mesh(new THREE.PlaneGeometry(.3, 1.6), frondMat);
      frond.position.set(x + Math.cos(ang)*.5, ty+h*.85, z + Math.sin(ang)*.5);
      frond.rotation.y = ang + Math.PI/2;
      frond.rotation.z = -.4 - Math.random()*.2; // droop down
      sc.add(frond);
    }
    sol.push({cx:x,cz:z,rx:r*.25,rz:r*.25});
  },

  // 'none' is handled at the dispatch level in buildVillage — the pass
  // is skipped entirely when interiorTreeStyle === 'none'. Listed here
  // for documentation; the value is sentinel-checked, not a function.
};

// ── Village ground scatter (v61ex) ─────────────────────────────────────────
// Drives cfg.groundScatter. Each entry is a function called once per
// village build to scatter small ground-level vegetation/objects across
// the zone outside the village circle. Replaces the prior unconditional
// 320-iteration grass+bush loop in buildVillage.
//
// Signature: (scene, sol, cfg, helpers) → void
//   helpers.SIZE     — village zone size in world units
//   helpers.getY     — terrain Y sampler
//   helpers.inGap    — gate-corridor predicate
//   helpers.inVillage — village-circle predicate
//
// Each builder honors helpers.inVillage (so scatter doesn't render
// inside the village proper) and helpers.inGap (so gate corridors stay
// clear).
//
// Resolution: cfg.groundScatter picks; defaults to 'grass_and_bushes'
// which preserves the prior loop bit-for-bit.
const GROUND_SCATTER = {

  // Default — current grass blades (65%) + dark bushes (35%), 320 iters.
  // Matches Ashenmoor / Hearthwick / every existing inland village.
  grass_and_bushes: function(sc, sol, cfg, h){
    const {SIZE, getY, inGap, inVillage} = h;
    const grassMat=new THREE.MeshLambertMaterial({color:0x3a7a1a,side:THREE.DoubleSide});
    const bushMat=new THREE.MeshLambertMaterial({color:0x2a5a12});
    const bush2Mat=new THREE.MeshLambertMaterial({color:0x1e4010});
    for(let i=0;i<320;i++){
      const gx=6+Math.random()*(SIZE-12),gz=6+Math.random()*(SIZE-12);
      if(inVillage(gx,gz)||inGap(gx,gz))continue;
      if(Math.random()<.65){
        for(let b=0;b<3;b++){
          const bx=gx+(Math.random()-.5)*.4,bz=gz+(Math.random()-.5)*.4;
          const hh=.18+Math.random()*.14;
          const blade=new THREE.Mesh(new THREE.PlaneGeometry(.07+Math.random()*.04,hh),grassMat);
          blade.position.set(bx,getY(bx,bz)+hh/2,bz);blade.rotation.y=Math.random()*Math.PI;sc.add(blade);
        }
      } else {
        const ty=getY(gx,gz),r=.28+Math.random()*.18;
        const body=new THREE.Mesh(new THREE.SphereGeometry(r,5,4),bushMat);
        body.scale.set(1,.65,1);body.position.set(gx,ty+r*.55,gz);sc.add(body);
        for(let l=0;l<2;l++){
          const lump=new THREE.Mesh(new THREE.SphereGeometry(r*.6,4,3),bush2Mat);
          lump.scale.set(1,.6,1);
          lump.position.set(gx+(Math.random()-.5)*.3,ty+r*.7+Math.random()*.1,gz+(Math.random()-.5)*.3);
          sc.add(lump);
        }
      }
    }
  },

  // Coastal-rock scatter — 70% pale yellow-green tussock grass clumps
  // (salt-tolerant, stiffer than meadow grass), 30% brown dried kelp +
  // small barnacle-encrusted stones. 160 iterations — half of the
  // forest-village density. Carraig Mór; future exposed-rock coastal
  // villages.
  tussock_and_kelp: function(sc, sol, cfg, h){
    const {SIZE, getY, inGap, inVillage} = h;
    const tussockMat=new THREE.MeshLambertMaterial({color:0x9a9c58,side:THREE.DoubleSide});
    const kelpMat=new THREE.MeshLambertMaterial({color:0x4a3818});
    const barnacleMat=new THREE.MeshLambertMaterial({color:0x68665e});
    const barnacleAccMat=new THREE.MeshLambertMaterial({color:0xc8c0b0});
    for(let i=0;i<160;i++){
      const gx=6+Math.random()*(SIZE-12),gz=6+Math.random()*(SIZE-12);
      if(inVillage(gx,gz)||inGap(gx,gz))continue;
      const ty=getY(gx,gz);
      if(Math.random()<.70){
        // Tussock-grass clump — 4-6 stiffer blades, taller and paler
        // than meadow grass, with a faint yellow cast.
        const nBlade = 4 + Math.floor(Math.random()*3);
        for(let b=0;b<nBlade;b++){
          const bx=gx+(Math.random()-.5)*.5,bz=gz+(Math.random()-.5)*.5;
          const hh=.22+Math.random()*.16;
          const blade=new THREE.Mesh(new THREE.PlaneGeometry(.05+Math.random()*.03,hh),tussockMat);
          blade.position.set(bx,getY(bx,bz)+hh/2,bz);
          blade.rotation.y=Math.random()*Math.PI;
          // Slight lean so they don't all stand perfectly vertical
          blade.rotation.z=(Math.random()-.5)*.25;
          sc.add(blade);
        }
      } else {
        // Mix kelp clump with a small barnacle-encrusted stone.
        if(Math.random()<.55){
          // Kelp — 2-4 short twisted ribbons of dried brown
          const nRib = 2 + Math.floor(Math.random()*3);
          for(let k=0;k<nRib;k++){
            const rx=gx+(Math.random()-.5)*.4,rz=gz+(Math.random()-.5)*.4;
            const ribbon=new THREE.Mesh(new THREE.BoxGeometry(.06+Math.random()*.04,.04,.32+Math.random()*.18),kelpMat);
            ribbon.position.set(rx,ty+.04,rz);
            ribbon.rotation.y=Math.random()*Math.PI;
            ribbon.rotation.x=(Math.random()-.5)*.35;
            sc.add(ribbon);
          }
        } else {
          // Small barnacle-encrusted stone — flat-bottomed boulder with
          // a few off-white speckles for the barnacle read.
          const r=.28+Math.random()*.20;
          const stone=new THREE.Mesh(new THREE.SphereGeometry(r,5,4),barnacleMat);
          stone.scale.set(1,.55,1);
          stone.position.set(gx,ty+r*.45,gz);
          sc.add(stone);
          // 3-5 tiny barnacle specks on top
          for(let s=0;s<3+Math.floor(Math.random()*3);s++){
            const sp=new THREE.Mesh(new THREE.SphereGeometry(.04+Math.random()*.025,4,3),barnacleAccMat);
            sp.position.set(gx+(Math.random()-.5)*r*.7,ty+r*.55+Math.random()*.04,gz+(Math.random()-.5)*r*.7);
            sc.add(sp);
          }
        }
      }
    }
  },

  // No scatter — clean ground. Plaza-only villages, frontier outposts,
  // anywhere we want the ground texture to read uncluttered.
  none: function(sc, sol, cfg, h){
    // Intentionally empty.
  },

  // Foothills register — low purple-pink heather mounds + sparse thistle
  // stalks. 200 iterations. La Grise candidate, hill villages.
  heather_and_thistle: function(sc, sol, cfg, h){
    const {SIZE, getY, inGap, inVillage} = h;
    const heatherMat=new THREE.MeshLambertMaterial({color:0x6a4a78});
    const heatherDarkMat=new THREE.MeshLambertMaterial({color:0x4a2e58});
    const thistleStemMat=new THREE.MeshLambertMaterial({color:0x4a5a30,side:THREE.DoubleSide});
    const thistleHeadMat=new THREE.MeshLambertMaterial({color:0x8a4a78});
    for(let i=0;i<200;i++){
      const gx=6+Math.random()*(SIZE-12),gz=6+Math.random()*(SIZE-12);
      if(inVillage(gx,gz)||inGap(gx,gz))continue;
      const ty=getY(gx,gz);
      if(Math.random()<.75){
        // Heather mound — low spread of tinted spheres
        const r=.32+Math.random()*.20;
        const body=new THREE.Mesh(new THREE.SphereGeometry(r,5,4),heatherMat);
        body.scale.set(1,.45,1);body.position.set(gx,ty+r*.40,gz);sc.add(body);
        for(let l=0;l<2;l++){
          const lump=new THREE.Mesh(new THREE.SphereGeometry(r*.55,4,3),heatherDarkMat);
          lump.scale.set(1,.4,1);
          lump.position.set(gx+(Math.random()-.5)*.4,ty+r*.45+Math.random()*.05,gz+(Math.random()-.5)*.4);
          sc.add(lump);
        }
      } else {
        // Thistle — a thin vertical stem with a small flowerhead
        const stemH=.50+Math.random()*.25;
        const stem=new THREE.Mesh(new THREE.PlaneGeometry(.04,stemH),thistleStemMat);
        stem.position.set(gx,ty+stemH/2,gz);stem.rotation.y=Math.random()*Math.PI;sc.add(stem);
        const head=new THREE.Mesh(new THREE.SphereGeometry(.06,5,4),thistleHeadMat);
        head.position.set(gx,ty+stemH+.04,gz);sc.add(head);
      }
    }
  },

  // Wastes-edge — grey-brown skeletal scrub + small ash piles.
  // 150 iterations (sparser; vegetation has given up). Caer Uaigneach,
  // wastes settlements.
  ash_scrub: function(sc, sol, cfg, h){
    const {SIZE, getY, inGap, inVillage} = h;
    const scrubMat=new THREE.MeshLambertMaterial({color:0x4a3a28});
    const scrubDarkMat=new THREE.MeshLambertMaterial({color:0x382818});
    const ashMat=new THREE.MeshLambertMaterial({color:0x3a3430});
    for(let i=0;i<150;i++){
      const gx=6+Math.random()*(SIZE-12),gz=6+Math.random()*(SIZE-12);
      if(inVillage(gx,gz)||inGap(gx,gz))continue;
      const ty=getY(gx,gz);
      if(Math.random()<.55){
        // Skeletal scrub — small bare twiggy clump
        const r=.20+Math.random()*.15;
        const body=new THREE.Mesh(new THREE.SphereGeometry(r,4,3),scrubDarkMat);
        body.scale.set(1,.55,1);body.position.set(gx,ty+r*.45,gz);sc.add(body);
        // A few twigs sticking out
        for(let t=0;t<2+Math.floor(Math.random()*2);t++){
          const twig=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.20+Math.random()*.10,4),scrubMat);
          const ang=Math.random()*Math.PI*2;
          twig.position.set(gx+Math.cos(ang)*r*.5,ty+r*.6+Math.random()*.08,gz+Math.sin(ang)*r*.5);
          twig.rotation.z=(Math.random()-.5)*.6;
          twig.rotation.y=ang;
          sc.add(twig);
        }
      } else {
        // Small ash pile — flat irregular dark mound
        const r=.30+Math.random()*.20;
        const mound=new THREE.Mesh(new THREE.CylinderGeometry(r*.7,r,0.10,8),ashMat);
        mound.position.set(gx,ty+0.05,gz);
        sc.add(mound);
      }
    }
  },

  // Beach scatter — pale beach grass tufts + small driftwood pieces.
  // 220 iterations. Salthaven beach, sand-dune coastal villages.
  sand_grass_and_driftwood: function(sc, sol, cfg, h){
    const {SIZE, getY, inGap, inVillage} = h;
    const beachGrassMat=new THREE.MeshLambertMaterial({color:0xb8b878,side:THREE.DoubleSide});
    const driftMat=new THREE.MeshLambertMaterial({color:0x988868});
    const driftDarkMat=new THREE.MeshLambertMaterial({color:0x6a5e48});
    for(let i=0;i<220;i++){
      const gx=6+Math.random()*(SIZE-12),gz=6+Math.random()*(SIZE-12);
      if(inVillage(gx,gz)||inGap(gx,gz))continue;
      const ty=getY(gx,gz);
      if(Math.random()<.78){
        // Beach grass tuft — pale yellow-green stiff blades
        const nBlade = 3 + Math.floor(Math.random()*3);
        for(let b=0;b<nBlade;b++){
          const bx=gx+(Math.random()-.5)*.4,bz=gz+(Math.random()-.5)*.4;
          const hh=.16+Math.random()*.12;
          const blade=new THREE.Mesh(new THREE.PlaneGeometry(.05+Math.random()*.03,hh),beachGrassMat);
          blade.position.set(bx,getY(bx,bz)+hh/2,bz);
          blade.rotation.y=Math.random()*Math.PI;
          blade.rotation.z=(Math.random()-.5)*.20;
          sc.add(blade);
        }
      } else {
        // Driftwood — small weathered timber piece, lying flat
        const len=.45+Math.random()*.35;
        const piece=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,len,5),Math.random()<.5?driftMat:driftDarkMat);
        piece.position.set(gx,ty+.07,gz);
        piece.rotation.z=Math.PI/2;
        piece.rotation.y=Math.random()*Math.PI*2;
        sc.add(piece);
      }
    }
  },
};

// ── buildVillage(config) ────────────────────────────────────────────────────
// Parameterised village builder. Ashenmoor-archetype.
// All handcrafted detail (signs, paths, decorations) lives in an optional
// cfg.detailFn(scene,sol,getY) hook — called after base geometry is placed.
function buildVillage(cfg){
  const SIZE=cfg.size;
  const vScene=new THREE.Scene();
  vScene.background=new THREE.Color(cfg.skyCol||0x87ceeb);
  vScene.fog=new THREE.FogExp2(cfg.fogColor||0x9ad9b0, cfg.fogDensity||.016);
  const sun=new THREE.DirectionalLight(0xfff8e0,1.3);sun.position.set(60,80,40);vScene.add(sun);
  const _vAmb=new THREE.AmbientLight(0x8eb8ff,.7);vScene.add(_vAmb);
  const _vHemi=new THREE.HemisphereLight(0xaaddff,0x44aa22,.55);vScene.add(_vHemi);
  // v61e7 — Day/Night Session B: instrument the scene with day/night refs.
  // Settlements use the universal-village-warm night palette (design call C).
  if(typeof instrumentSceneForDayNight === 'function'){
    instrumentSceneForDayNight(vScene, {sun, ambient:_vAmb, hemi:_vHemi, fog:vScene.fog}, {
      skyCol: cfg.skyCol||0x87ceeb,
      fogColor: cfg.fogColor||0x9ad9b0,
      fogDensity: cfg.fogDensity||.016,
      sunCol: 0xfff8e0, sunInt: 1.3,
      ambientCol: 0x8eb8ff, ambientInt: .7,
      hemiInt: .55,
    }, cfg.region||null, true);
  }

  // ── Terrain ───────────────────────────────────────────────────────────────
  const heights=_buildHeightmap(SIZE,TERRAIN_SEGS,cfg.seed||1234);
  // Village-archetype heightmap: flat within flatR, transition to full amp at hillR
  // Override the raw heights with village-profile modulation
  const vCX=cfg.centerX||SIZE/2, vCZ=cfg.centerZ||SIZE/2;
  // v61et: terrain profile preset (TERRAIN_PROFILES). cfg.terrainProfile
  // bundles amp/flatR/hillR; explicit cfg fields still win. Profile is the
  // floor — set defaults from it, then let cfg override field-by-field.
  const _tProf = (cfg.terrainProfile && typeof TERRAIN_PROFILES!=='undefined' && TERRAIN_PROFILES[cfg.terrainProfile]) || null;
  const _profAmp   = _tProf ? _tProf.amp                       : 2.0;
  const _profFlatR = _tProf ? SIZE*_tProf.flatRRatio           : SIZE*.35;
  const _profHillR = _tProf ? SIZE*_tProf.hillRRatio           : SIZE*.55;
  const flatR=cfg.flatR||_profFlatR, hillR=cfg.hillR||_profHillR;
  const amp=cfg.terrainAmp||_profAmp;
  const segsPlus=TERRAIN_SEGS+1;
  // v61em: optional directional slope. cfg.terrainSlope = {dir:'E', amount:2.0}
  // makes the village ramp downward toward the named direction. Used by
  // Salthaven so the village descends from inland (west) toward the harbor
  // (east). Slope is added on TOP of the existing radial flat-to-amp
  // modulation, so the village center is still flatter than the perimeter,
  // just biased toward the slope direction. Linear ramp; the sea-side
  // ends below ground level so the dock and water mesh sit naturally low.
  const _slopeDir = cfg.terrainSlope ? cfg.terrainSlope.dir : null;
  const _slopeAmt = cfg.terrainSlope ? cfg.terrainSlope.amount : 0;
  // v61f2: optional river carve. cfg.river = {axis, centerX|centerZ, channelWidth,
  // bankSlope, depth} carves a linear channel into the heights array AFTER the
  // radial profile + slope have been applied. Forward-compatible water-feature
  // hook — Droichead is the first user; future water-feature villages (Redwater
  // Ford a candidate) declare the spec and inherit the geometry.
  //
  // Channel cross-section (perpendicular to axis):
  //   ┌─bank top                                bank top─┐
  //   │                                                  │   ← grade level
  //   └─bank slope─┐                       ┌─bank slope─┘
  //                └──── flat riverbed ────┘              ← grade - depth
  //
  //   |<-bankSlope->|<-- channelWidth -->|<-bankSlope->|
  //
  // For axis:'N-S', centerX is the channel midline; the channel extends full
  // N-S length of the zone. For axis:'E-W' the same logic applies rotated 90°
  // (centerZ instead of centerX, channel runs full E-W).
  //
  // The carve is a MAX-DEPRESSION operation: at any (wx, wz), the channel
  // depth is computed and SUBTRACTED from the height if the cell falls inside
  // the channel region. This means terrain noise inside the channel can make
  // it shallower in spots (good — natural variation) but never shallower than
  // the carve allows. The riverbed itself is approximately flat.
  const _river = cfg.river || null;
  const _riverDepth = _river ? _river.depth : 0;
  const _riverHalfChannel = _river ? _river.channelWidth/2 : 0;
  const _riverBankSlope = _river ? _river.bankSlope : 0;
  const _riverAxis = _river ? (_river.axis || 'N-S') : null;
  const _riverCenter = _river ? (_riverAxis === 'N-S' ? _river.centerX : _river.centerZ) : 0;
  for(let i=0;i<segsPlus*segsPlus;i++){
    const wx=(i%segsPlus)/TERRAIN_SEGS*SIZE;
    const wz=Math.floor(i/segsPlus)/TERRAIN_SEGS*SIZE;
    const dist=Math.hypot(wx-vCX,wz-vCZ);
    const t=dist<flatR?0:dist>hillR?1:(dist-flatR)/(hillR-flatR);
    heights[i]*=t*amp;
    if(_slopeDir){
      // Linear ramp across the zone in the named direction. dir:'E' means
      // x:0 is high, x:SIZE is low; dir:'S' means z:0 high, z:SIZE low; etc.
      let ramp = 0;
      if(_slopeDir==='E')      ramp = 0.5 - wx/SIZE;
      else if(_slopeDir==='W') ramp = wx/SIZE - 0.5;
      else if(_slopeDir==='S') ramp = 0.5 - wz/SIZE;
      else if(_slopeDir==='N') ramp = wz/SIZE - 0.5;
      heights[i] += ramp * _slopeAmt;
    }
    if(_river){
      // Distance from this cell to the channel midline (perpendicular to axis).
      const perpDist = Math.abs((_riverAxis === 'N-S' ? wx : wz) - _riverCenter);
      if(perpDist <= _riverHalfChannel){
        // Inside the flat riverbed — full depth carve.
        heights[i] -= _riverDepth;
      } else if(perpDist <= _riverHalfChannel + _riverBankSlope){
        // On the sloped bank — linear taper from grade to riverbed.
        const tBank = (perpDist - _riverHalfChannel) / _riverBankSlope;
        heights[i] -= _riverDepth * (1 - tBank);
      }
      // else: outside the channel; no carve.
    }
  }

  // Store terrain sampler for this zone
  const _vGetY=(wx,wz)=>{
    if(!heights)return 0;
    const u=Math.max(0,Math.min(1,wx/SIZE)),v=Math.max(0,Math.min(1,wz/SIZE));
    const ix=Math.floor(u*TERRAIN_SEGS),iz=Math.floor(v*TERRAIN_SEGS);
    const fx=u*TERRAIN_SEGS-ix,fz=v*TERRAIN_SEGS-iz;
    const i00=iz*segsPlus+ix,i10=iz*segsPlus+Math.min(ix+1,TERRAIN_SEGS);
    const i01=Math.min(iz+1,TERRAIN_SEGS)*segsPlus+ix,i11=Math.min(iz+1,TERRAIN_SEGS)*segsPlus+Math.min(ix+1,TERRAIN_SEGS);
    return (heights[i00]*(1-fx)*(1-fz)+heights[i10]*fx*(1-fz)+heights[i01]*(1-fx)*fz+heights[i11]*fx*fz);
  };
  cfg.getY=_vGetY;
  cfg._heights=heights;
  cfg._size=SIZE;

  const tGeo=new THREE.PlaneGeometry(SIZE,SIZE,TERRAIN_SEGS,TERRAIN_SEGS);
  tGeo.rotateX(-Math.PI/2);
  const pos=tGeo.attributes.position;
  for(let i=0;i<pos.count;i++){
    pos.setY(i,_vGetY(pos.getX(i)+SIZE/2,pos.getZ(i)+SIZE/2));
  }
  pos.needsUpdate=true;tGeo.computeVertexNormals();
  // v61et: ground texture knob (GROUND_TEXTURES). cfg.groundTexture is the
  // explicit per-village knob and wins over the biome path. Resolution:
  //   cfg.groundTexture (highest priority)
  //   ↓ if not set
  //   cfg.biome via BIOME_PROFILES (back-compat with Salthaven)
  //   ↓ if not set
  //   MAT.grass (default)
  // Each GROUND_TEXTURES entry is a function returning a fresh material —
  // call it per-village so each village owns its own texture (avoids
  // shared-state mutation if any future code wanted to tint or vary).
  // v61em: settlement biome support. If cfg.biome matches a BIOME_PROFILES
  // entry (e.g. 'coast' for Salthaven, eventually for Carraig Mór, Inis Rua,
  // Portclare, Coeur de Vie), build a procedural ground texture from that
  // biome's palette instead of using MAT.grass. This is the same mkTex
  // pattern wilderness zones already use (line ~9913). Settlements without
  // cfg.biome (Hearthwick, Ashenmoor, all the inland villages) keep MAT.grass
  // unchanged. The biome's groundBase + HSL ranges produce a noticeably
  // distinct palette — Salthaven's coast biome gives duskier, salt-bleached
  // tones rather than bright forest-green.
  let _vGroundMat = MAT.grass;
  if(cfg.groundTexture && typeof GROUND_TEXTURES!=='undefined' && GROUND_TEXTURES[cfg.groundTexture]){
    _vGroundMat = GROUND_TEXTURES[cfg.groundTexture]();
  } else if(cfg.biome && typeof BIOME_PROFILES !== 'undefined' && BIOME_PROFILES[cfg.biome]){
    const _vBiome = BIOME_PROFILES[cfg.biome];
    const [ghLo,ghHi]=_vBiome.groundHue, [gsLo,gsHi]=_vBiome.groundSat, [glLo,glHi]=_vBiome.groundLight;
    const _vGroundTex = mkTex((x,w,h)=>{
      x.fillStyle=_vBiome.groundBase; x.fillRect(0,0,w,h);
      for(let i=0;i<800;i++){
        x.fillStyle=`hsl(${ghLo+Math.random()*(ghHi-ghLo)},${gsLo+Math.random()*(gsHi-gsLo)}%,${glLo+Math.random()*(glHi-glLo)}%)`;
        x.fillRect(Math.random()*w,Math.random()*h,Math.random()*4+1,Math.random()*3+1);
      }
    });
    _vGroundTex.repeat.set(40,40);
    _vGroundMat = new THREE.MeshLambertMaterial({map:_vGroundTex});
  }
  const gnd=new THREE.Mesh(tGeo,_vGroundMat);gnd.position.set(SIZE/2,0,SIZE/2);vScene.add(gnd);

  // Sky ring (shared)
  // v61em coastal pass: paint differently if cfg.biome==='coast'. Default
  // skyRing has gray mountain triangles + snowy caps — that's the stock
  // forest-village backdrop. For coastal villages we paint a sea horizon
  // instead: deeper blue lower band (water), distant low cliffs, no peaks.
  const sCV=document.createElement('canvas');sCV.width=1024;sCV.height=256;const sx=sCV.getContext('2d');
  if(cfg.biome === 'coast'){
    // Coastal sky: blue gradient sky on top, deep sea-blue band on bottom.
    // The seam between them is the sea horizon. A few low cliff silhouettes
    // in the distance stand in for the painted backdrop's "depth."
    const sg2=sx.createLinearGradient(0,0,0,256);
    sg2.addColorStop(0,'#7ab0d8');     // upper sky
    sg2.addColorStop(.55,'#c8d8e0');   // hazy horizon line
    sg2.addColorStop(.62,'#8fa8b8');   // shoreline haze
    sg2.addColorStop(.7,'#5a7a8e');    // distant water
    sg2.addColorStop(1,'#3e5870');     // deep water
    sx.fillStyle=sg2;sx.fillRect(0,0,1024,256);
    // Distant low cliff silhouettes — just a few subtle bumps along the
    // horizon line, not pointed mountain peaks. Deliberately sparse and low.
    sx.fillStyle='#6a7e8a';
    for(let i=0;i<5;i++){
      const bx=i*220+Math.random()*100,bh=18+Math.random()*22,bw=120+Math.random()*60;
      sx.beginPath();sx.moveTo(bx,160);sx.bezierCurveTo(bx+bw*.3,160-bh,bx+bw*.7,160-bh*.7,bx+bw,160);sx.lineTo(bx+bw,256);sx.lineTo(bx,256);sx.closePath();sx.fill();
    }
    // A few seabird specks on the upper sky for life
    sx.fillStyle='#5a6878';
    for(let i=0;i<8;i++){
      const bx=Math.random()*1024,by=20+Math.random()*60;
      sx.fillRect(bx,by,3,1);sx.fillRect(bx-2,by+1,2,1);sx.fillRect(bx+3,by+1,2,1);
    }
  } else {
    // Default skyRing — sky gradient + mountain triangles + snow caps.
    // Used by all inland villages (Hearthwick, Cill Beag, Droichead,
    // Redwater Ford, Ashenmoor's normal pre-burn variant inherits this).
    const sg=sx.createLinearGradient(0,0,0,256);sg.addColorStop(0,'#5ba3d4');sg.addColorStop(.5,'#a8d8ea');sg.addColorStop(1,'#c8e8c0');sx.fillStyle=sg;sx.fillRect(0,0,1024,256);
    sx.fillStyle='#7a8fa0';for(let i=0;i<14;i++){const bx=i*75+Math.random()*30,bh=50+Math.random()*90,bw=70+Math.random()*60;sx.beginPath();sx.moveTo(bx,256);sx.lineTo(bx+bw/2,256-bh);sx.lineTo(bx+bw,256);sx.closePath();sx.fill();}
    sx.fillStyle='#ddeeff';for(let i=0;i<12;i++){const bx=i*85+30,top=155-Math.random()*50,bw=16+Math.random()*14;sx.beginPath();sx.moveTo(bx,top+18);sx.lineTo(bx+bw/2,top);sx.lineTo(bx+bw,top+18);sx.closePath();sx.fill();}
  }
  const skyRingMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sCV),side:THREE.BackSide,fog:false});
  const skyRing=new THREE.Mesh(new THREE.CylinderGeometry(SIZE*1.3,SIZE*1.3,80,32,1,true),skyRingMat);
  skyRing.position.set(SIZE/2,18,SIZE/2);vScene.add(skyRing);
  // v61e8 — stash skyRing material on scene userData so the day/night
  // interpolator can multiply its .color toward the region night sky tint.
  // The material is MeshBasicMaterial with fog:false (the canvas is the
  // backdrop, so neither the lighting nor the fog reach it). Tinting via
  // .color is the only way to make it darken at night — without this, the
  // canvas's hardcoded day-sky paint shows through as a wedge of bright
  // sky against the night-blue scene.background.
  vScene.userData.skyRingMat = skyRingMat;

  const sol=cfg.sol||[];
  const npcs=cfg.npcs||[];
  const herbArr=cfg.herbs||[];

  // ── Buildings ─────────────────────────────────────────────────────────────
  (cfg.buildings||[]).forEach(h=>{
    const cx=h.x+h.w/2,cz=h.z+h.d/2;
    const ty=_vGetY(cx,cz);
    // v61eo: patch h.type from cfg.houses lookup if not already on the
    // building. Placeholder villages (Salthaven, etc.) keep shop type in
    // cfg.houses keyed by id — the decorator's icon system needs it on h.
    // No-op for Ashenmoor where shop type isn't on cfg.houses (Ashenmoor
    // uses the global HOUSES table and houseId-keyed bespoke decoration).
    if(!h.type && h.houseId && cfg.houses){
      const hMatch=cfg.houses.find(hh=>hh.id===h.houseId);
      if(hMatch && hMatch.type) h.type=hMatch.type;
    }
    if(h.type==='church'){
      _buildChurchExterior(vScene,sol,h,ty);
    } else if(h.charred==='destroyed'){
      // v61ad: burned-Ashenmoor render — four scorched wall stubs + collapsed
      // roof debris, no door. Stub height ~0.9 so the player can see over the
      // walls from a distance and read the village as ruined at a glance. Pile
      // inside the footprint is blackened timber + ash mound.
      const charredWoodMat=new THREE.MeshLambertMaterial({color:0x1e1410});
      const ashMat=new THREE.MeshLambertMaterial({color:0x2a2424});
      const stubH=0.9;
      // Leave gaps so the shape reads as "collapsed walls" rather than "short box"
      const wallT=0.18;
      // South and north wall stubs (shortened — collapsed in the middle)
      for(const zSide of [h.z, h.z+h.d]){
        for(const xOff of [h.w*0.2, h.w*0.8]){
          const stub=new THREE.Mesh(new THREE.BoxGeometry(h.w*0.35,stubH,wallT),charredWoodMat);
          stub.position.set(h.x+xOff - h.w*0.175, ty+stubH/2, zSide);
          vScene.add(stub);
        }
      }
      // East and west wall stubs — one short piece each, leaning
      for(const xSide of [h.x, h.x+h.w]){
        const stub=new THREE.Mesh(new THREE.BoxGeometry(wallT, stubH, h.d*0.4),charredWoodMat);
        stub.position.set(xSide, ty+stubH/2, h.z+h.d*0.3);
        stub.rotation.z = (Math.random()-0.5)*0.12; // slight lean
        vScene.add(stub);
      }
      // Collapsed roof debris — low pile in the center
      const debris=new THREE.Mesh(new THREE.BoxGeometry(h.w*0.6, 0.4, h.d*0.6),charredWoodMat);
      debris.position.set(cx, ty+0.2, cz);
      debris.rotation.y = Math.random()*0.6;
      vScene.add(debris);
      // Ash mound under debris
      const mound=new THREE.Mesh(new THREE.CylinderGeometry(Math.min(h.w,h.d)*0.45, Math.min(h.w,h.d)*0.55, 0.12, 8),ashMat);
      mound.position.set(cx, ty+0.06, cz);
      vScene.add(mound);
      // A few diagonal fallen beams protruding from the debris
      for(let bi=0;bi<3;bi++){
        const beam=new THREE.Mesh(new THREE.BoxGeometry(Math.max(h.w,h.d)*0.7, 0.14, 0.14),charredWoodMat);
        const ang=(bi/3)*Math.PI + Math.random()*0.5;
        beam.position.set(cx + Math.cos(ang)*0.3, ty+0.35 + Math.random()*0.1, cz + Math.sin(ang)*0.3);
        beam.rotation.y = ang;
        beam.rotation.z = 0.22 + Math.random()*0.15;
        vScene.add(beam);
      }
      // Ambient smolder — faint red point light, low intensity
      const ember=new THREE.PointLight(0xcc3311, 0.6, 3.5);
      ember.position.set(cx, ty+0.4, cz);
      vScene.add(ember);
    } else if(h.charred==='damaged'){
      // v61ad: partially-damaged variant — Edna's cottage. Full walls still
      // standing but scorched, roof partially collapsed, door intact so the
      // player can still interact with the keeper inside (or outside-adjacent).
      const scorchedWoodMat=new THREE.MeshLambertMaterial({color:0x3a2a20});
      const darkRoofMat=new THREE.MeshLambertMaterial({color:0x2a1e18});
      const body=new THREE.Mesh(new THREE.BoxGeometry(h.w,2.2,h.d),scorchedWoodMat);
      body.position.set(cx,ty+1.1,cz);vScene.add(body);
      // Partial roof — only half the cone, rotated so it reads as "one side fell in"
      const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(h.w,h.d)*.8,1.5,4),darkRoofMat);
      roof.position.set(cx,ty+2.95,cz);roof.rotation.y=Math.PI/4; roof.rotation.z=0.22; // tilt
      vScene.add(roof);
      // Door — charred variant, still functional. Reuse same group geometry as
      // normal village door but with charred material and no iron polish.
      const dCharMat=new THREE.MeshLambertMaterial({color:0x181210});
      const dSlabMat=new THREE.MeshLambertMaterial({color:0x2a1a12});
      const vDoorGroup=new THREE.Group();
      const vDoorSlab=new THREE.Mesh(new THREE.BoxGeometry(.7,1.4,.06),dSlabMat);
      vDoorGroup.add(vDoorSlab);
      for(let pg=-1;pg<=1;pg++){
        const plank=new THREE.Mesh(new THREE.BoxGeometry(.014,1.32,.02),dCharMat);
        plank.position.set(pg*0.21, 0, 0.04);
        vDoorGroup.add(plank);
      }
      const vKnob=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),dCharMat);
      vKnob.position.set(.24, -0.05, 0.08); vDoorGroup.add(vKnob);
      // Door hanging on one hinge — slight angle
      if(h.face==='S'){vDoorGroup.position.set(cx,ty+.7,h.z-.05); vDoorGroup.rotation.y=Math.PI + 0.15;}
      else if(h.face==='N'){vDoorGroup.position.set(cx,ty+.7,h.z+h.d+.05); vDoorGroup.rotation.y=0.15;}
      else if(h.face==='E'){vDoorGroup.rotation.y=Math.PI/2 + 0.15; vDoorGroup.position.set(h.x+h.w+.05,ty+.7,cz);}
      else if(h.face==='W'){vDoorGroup.rotation.y=-Math.PI/2 + 0.15; vDoorGroup.position.set(h.x-.05,ty+.7,cz);}
      vScene.add(vDoorGroup);
      // Scorch marks on the walls — two small dark rectangles
      const scorchMat=new THREE.MeshLambertMaterial({color:0x0e0a08});
      const scorch1=new THREE.Mesh(new THREE.BoxGeometry(h.w*0.4, 0.8, 0.02),scorchMat);
      scorch1.position.set(cx, ty+1.5, h.face==='S'?h.z-0.08:h.z+h.d+0.08);
      vScene.add(scorch1);
    } else {
      // v61er: building material + roof style.
      // Resolution: per-building override (h.material, h.roofStyle) > cfg
      // default (cfg.buildingMaterial, cfg.roofStyle) > timber+thatch_pitched.
      // Materials live in BUILDING_MATERIALS; roof styles drive geometry +
      // material via BUILDING_ROOFS. Both tables defined just above
      // buildVillage and reused by future builders.
      const matName = h.material || cfg.buildingMaterial || 'timber';
      const matSpec = (typeof BUILDING_MATERIALS!=='undefined' && BUILDING_MATERIALS[matName]) || {bodyMat:MAT.wood};
      const roofName = h.roofStyle || cfg.roofStyle || 'thatch_pitched';
      const roofSpec = (typeof BUILDING_ROOFS!=='undefined' && BUILDING_ROOFS[roofName]) || {style:'pitched', mat:MAT.thatch, height:1.5};
      // Body — same height (2.2u) and footprint regardless of material; only
      // the surface material varies. Stone/brick keep the same wall thickness
      // since it's a single boxgeometry.
      const body=new THREE.Mesh(new THREE.BoxGeometry(h.w,2.2,h.d),matSpec.bodyMat);
      body.position.set(cx,ty+1.1,cz);vScene.add(body);
      // Roof — pitched (cone, current default) or flat (boxgeometry sitting
      // on top). Flat roofs read as town/brownstone; pitched as cottage.
      if(roofSpec.style==='flat'){
        // Flat roof: thin slab covering the full footprint, slight overhang.
        const overhang = 0.15;
        const roofH = 0.18;
        const roof=new THREE.Mesh(new THREE.BoxGeometry(h.w+overhang*2, roofH, h.d+overhang*2), roofSpec.mat);
        roof.position.set(cx, ty+2.2+roofH/2, cz);
        vScene.add(roof);
      } else {
        // Pitched roof — cone, same shape as pre-v61er. Roof material from
        // roofSpec; height from roofSpec.height (defaults to 1.5).
        const rH = roofSpec.height!=null ? roofSpec.height : 1.5;
        const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(h.w,h.d)*.8, rH, 4), roofSpec.mat);
        roof.position.set(cx, ty+2.2+rH/2, cz);
        roof.rotation.y=Math.PI/4;
        vScene.add(roof);
      }
      // v61aa: same enriched door treatment as Ironhaven shops (planks + knob
      // + hinges). Ashenmoor uses MAT.door for the slab color and a slightly
      // smaller frame (0.7w × 1.4h) matching the smaller village buildings.
      const vIronMat=new THREE.MeshLambertMaterial({color:0x222228});
      const vDoorGroup=new THREE.Group();
      const vDoorSlab=new THREE.Mesh(new THREE.BoxGeometry(.7,1.4,.06),MAT.door);
      vDoorGroup.add(vDoorSlab);
      for(let pg=-1;pg<=1;pg++){
        const plank=new THREE.Mesh(new THREE.BoxGeometry(.014,1.32,.02),vIronMat);
        plank.position.set(pg*0.21, 0, 0.04);
        vDoorGroup.add(plank);
      }
      const vKnobStem=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.035,6),vIronMat);
      vKnobStem.rotation.x=Math.PI/2;
      vKnobStem.position.set(.24, -0.05, 0.045); vDoorGroup.add(vKnobStem);
      const vKnob=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),vIronMat);
      vKnob.position.set(.24, -0.05, 0.08); vDoorGroup.add(vKnob);
      [0.5, -0.5].forEach(ry=>{
        const hinge=new THREE.Mesh(new THREE.BoxGeometry(.11,.05,.02),vIronMat);
        hinge.position.set(-.28, ry, 0.04); vDoorGroup.add(hinge);
      });
      // v61ab: S/N rotation fix — see Ironhaven doorGroup for full reasoning.
      // S-face: local +Z needs to face world −Z (player is south) → rotate 180°
      // N-face: local +Z already faces world +Z (player is north) → rotate 0°
      if(h.face==='S'){vDoorGroup.position.set(cx,ty+.7,h.z-.05); vDoorGroup.rotation.y=Math.PI;}
      else if(h.face==='N'){vDoorGroup.position.set(cx,ty+.7,h.z+h.d+.05);}
      else if(h.face==='E'){vDoorGroup.rotation.y=Math.PI/2; vDoorGroup.position.set(h.x+h.w+.05,ty+.7,cz);}
      else if(h.face==='W'){vDoorGroup.rotation.y=-Math.PI/2; vDoorGroup.position.set(h.x-.05,ty+.7,cz);}
      vScene.add(vDoorGroup);
    }
    sol.push({cx,cz,rx:h.w/2+.2,rz:h.d/2+.2});
    // v61ae: skip the full-volume collider for destroyed buildings — they're
    // reduced to wall stubs and debris piles visually, and the narrative beat
    // is that the player can WALK THROUGH the ruins. Damaged buildings
    // (Edna's, the oratory) keep their collider because the walls are still
    // standing. We add a smaller debris-pile collider instead so you can't
    // clip straight through the pile in the center.
    // (Note: sol.push above runs unconditionally for all branches. We undo it
    // here for destroyed to keep this edit localized — one pop + one push.)
    if(h.charred==='destroyed'){
      sol.pop(); // remove the full-volume collider just pushed
      // v61aj: destroyed buildings now block on the wall STUBS (visible wall
      // fragments along the perimeter) in addition to the central debris.
      // Previously only a small center collider existed, so the player could
      // walk through the stubs visually while being stopped only by rubble at
      // the middle — read as "no collision" in playtest. Now the four wall
      // fragments along N/S/E/W edges each get their own thin collider, and
      // the center debris pile keeps its own. Total per destroyed building: 5
      // small colliders instead of 1 big one. Sized to match the stub meshes
      // in buildVillage's destroyed branch (wallT=0.18, stub length ~h.w*0.35).
      const stubT = 0.18; // wall-stub thickness from buildVillage
      // South & north wall stubs (short segments at each end of the wall)
      [h.z, h.z+h.d].forEach(zSide=>{
        [0.275, 0.725].forEach(xFrac=>{
          // stub centered at (h.x + h.w*xFrac, zSide), length ~h.w*0.35
          sol.push({cx: h.x + h.w*xFrac, cz: zSide,
                    rx: h.w*0.175 + 0.1, rz: stubT*0.5 + 0.1});
        });
      });
      // East & west wall stubs (one short lean-piece per side)
      [h.x, h.x+h.w].forEach(xSide=>{
        sol.push({cx: xSide, cz: h.z + h.d*0.3,
                  rx: stubT*0.5 + 0.1, rz: h.d*0.2 + 0.1});
      });
      // Center debris pile — smaller than the old collider but still present
      sol.push({cx, cz, rx: h.w*0.3 + 0.1, rz: h.d*0.3 + 0.1});
    }
    // Church handles its own exterior decoration — skip generic decorateFn
    if(cfg.decorateFn && h.type!=='church')cfg.decorateFn(vScene,sol,h,ty,_vGetY);
  });

  // ── Paths + plaza (v61er, refined v61es) ────────────────────────────────
  // Auto-route a right-angled path from each building's door to the village
  // plaza. Plaza defaults to (centerX, centerZ); override via cfg.plazaX/Z.
  // Each path is a chain of small box-segments that follow terrain Y, so
  // sloped villages (Salthaven, etc.) get paths that descend with the land.
  // Set cfg.autoPaths = false to suppress, or cfg.paths = [...] to provide
  // explicit path waypoints instead.
  //
  // v61es: routing changed from straight-line door→plaza to L-shape (or
  // Z-shape when needed). Pattern:
  //   1. Walk PORCH_LEN out from the door perpendicular to the wall (so
  //      the path is clear of the building's edge before turning).
  //   2. Turn 90° onto the axis the porch wasn't moving in. Walk to the
  //      plaza's coordinate on that axis.
  //   3. If the plaza isn't reached yet (Z-shape case), turn 90° again
  //      and finish.
  // This makes paths read as actual streets following building footprints,
  // not spokes radiating diagonally from a hub.
  const pathStyleName = cfg.pathStyle || 'dirt';
  const pathSpec = PATH_STYLES[pathStyleName] || PATH_STYLES.dirt;
  const plazaX = cfg.plazaX != null ? cfg.plazaX : vCX;
  const plazaZ = cfg.plazaZ != null ? cfg.plazaZ : vCZ;
  const PORCH_LEN = 1.6; // distance walked perpendicular to wall before turning
  function _doorWorldPos(h){
    const cx2=h.x+h.w/2, cz2=h.z+h.d/2;
    if(h.face==='S') return {x:cx2,         z:h.z-0.6};
    if(h.face==='N') return {x:cx2,         z:h.z+h.d+0.6};
    if(h.face==='E') return {x:h.x+h.w+0.6, z:cz2};
    if(h.face==='W') return {x:h.x-0.6,     z:cz2};
    return {x:cx2, z:cz2}; // fallback
  }
  function _drawPathSegment(ax, az, bx, bz){
    const dx=bx-ax, dz=bz-az;
    const total=Math.hypot(dx,dz);
    if(total < 0.4) return;
    // Subdivide into 1.5u sub-segments so each one Y-samples at its own
    // midpoint (paths follow terrain on slopes).
    const nSeg = Math.max(1, Math.ceil(total/1.5));
    const angle = Math.atan2(dx, dz); // rotation around Y so segment +Z aligns with direction
    for(let i=0; i<nSeg; i++){
      const t0=i/nSeg, t1=(i+1)/nSeg;
      const sx0=ax+dx*t0, sz0=az+dz*t0;
      const sx1=ax+dx*t1, sz1=az+dz*t1;
      const mx=(sx0+sx1)/2, mz=(sz0+sz1)/2;
      const segLen=Math.hypot(sx1-sx0, sz1-sz0);
      const segMesh=new THREE.Mesh(
        new THREE.BoxGeometry(pathSpec.width, 0.04, segLen),
        pathSpec.mat
      );
      segMesh.position.set(mx, _vGetY(mx,mz)+0.02, mz);
      segMesh.rotation.y = angle;
      vScene.add(segMesh);
    }
  }
  // Build a polyline through right-angle waypoints, then draw each segment.
  function _drawPathPolyline(points){
    for(let i=0; i<points.length-1; i++){
      const a=points[i], b=points[i+1];
      _drawPathSegment(a[0], a[1], b[0], b[1]);
    }
  }
  // Compute the right-angle path waypoints from a door to the plaza.
  // Returns array of [x,z] points: door → porch end → corner(s) → plaza.
  function _doorToPlazaWaypoints(door, face, px, pz){
    // Step 1: walk out from door perpendicular to wall.
    let porchX = door.x, porchZ = door.z;
    if(face==='S')      porchZ = door.z - PORCH_LEN; // -Z further out
    else if(face==='N') porchZ = door.z + PORCH_LEN;
    else if(face==='E') porchX = door.x + PORCH_LEN;
    else if(face==='W') porchX = door.x - PORCH_LEN;
    // Step 2: turn 90° onto the axis the porch wasn't moving in.
    // For S/N faces, porch moved in Z → next leg moves in X to align with plazaX.
    // For E/W faces, porch moved in X → next leg moves in Z to align with plazaZ.
    let cornerX, cornerZ;
    if(face==='S' || face==='N'){
      cornerX = px;
      cornerZ = porchZ;
    } else {
      cornerX = porchX;
      cornerZ = pz;
    }
    // Step 3: final leg from corner to plaza.
    // (For S/N: corner is at (plazaX, porchZ), final leg moves in Z.
    //  For E/W: corner is at (porchX, plazaZ), final leg moves in X.)
    const points = [[door.x, door.z], [porchX, porchZ]];
    // Only add corner if it's distinct from the porch (avoids zero-length segment).
    if(Math.hypot(cornerX-porchX, cornerZ-porchZ) > 0.4){
      points.push([cornerX, cornerZ]);
    }
    // Only add plaza if distinct from corner (avoids zero-length segment when
    // door is already aligned with plaza on the perpendicular axis).
    if(Math.hypot(px-cornerX, pz-cornerZ) > 0.4){
      points.push([px, pz]);
    }
    return points;
  }
  if(cfg.paths){
    // Explicit paths: array of [{from:[x,z], to:[x,z]}] (straight segments)
    // OR [{waypoints:[[x,z],[x,z],...]}] (multi-point polylines)
    cfg.paths.forEach(p=>{
      if(p.waypoints){
        _drawPathPolyline(p.waypoints);
      } else {
        const a = p.from || [p.ax, p.az];
        const b = p.to   || [p.bx, p.bz];
        _drawPathSegment(a[0], a[1], b[0], b[1]);
      }
    });
  } else if(cfg.autoPaths !== false){
    // Auto: door → plaza for each building, via right-angle waypoints.
    // Skip churches (separate approach treatment) and destroyed buildings.
    (cfg.buildings||[]).forEach(h=>{
      if(h.type==='church') return;
      if(h.charred==='destroyed') return;
      const door = _doorWorldPos(h);
      const waypoints = _doorToPlazaWaypoints(door, h.face, plazaX, plazaZ);
      _drawPathPolyline(waypoints);
    });
  }
  // Plaza centerpiece. Default 'none'; common options: 'well', 'market_post',
  // 'tree'. Sits at (plazaX, plazaZ).
  const plazaProp = cfg.plazaProp || 'none';
  if(plazaProp !== 'none'){
    const pty = _vGetY(plazaX, plazaZ);
    if(plazaProp === 'well'){
      // Stone well — circular wall, pitched timber roof on two posts, bucket
      const wellStoneMat=new THREE.MeshLambertMaterial({color:0x707074});
      const wellTimberMat=new THREE.MeshLambertMaterial({color:0x6a4818});
      const wellRoofMat=new THREE.MeshLambertMaterial({color:0x4a3010});
      const wallRing=new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.7, 12), wellStoneMat);
      wallRing.position.set(plazaX, pty+0.35, plazaZ); vScene.add(wallRing);
      // Two posts holding a small pitched roof
      [-0.6, 0.6].forEach(off=>{
        const post=new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.1), wellTimberMat);
        post.position.set(plazaX+off, pty+1.1, plazaZ); vScene.add(post);
      });
      const wellRoof=new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.5, 4), wellRoofMat);
      wellRoof.position.set(plazaX, pty+2.05, plazaZ);
      wellRoof.rotation.y=Math.PI/4;
      vScene.add(wellRoof);
      // Bucket hanging from a rope
      const bucket=new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.10, 0.18, 8), wellTimberMat);
      bucket.position.set(plazaX, pty+1.3, plazaZ); vScene.add(bucket);
      sol.push({cx:plazaX, cz:plazaZ, rx:0.85, rz:0.85});
    } else if(plazaProp === 'market_post'){
      // Tall timber post with a horizontal arm and notice papers
      const postMat=new THREE.MeshLambertMaterial({color:0x4a3010});
      const paperMat=new THREE.MeshLambertMaterial({color:0xd0c098});
      const post=new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.6, 0.18), postMat);
      post.position.set(plazaX, pty+1.3, plazaZ); vScene.add(post);
      const arm=new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.08), postMat);
      arm.position.set(plazaX, pty+2.4, plazaZ); vScene.add(arm);
      // Three notice papers nailed to the post at varied heights
      [[0, 1.6, 0.10],[-0.4, 2.0, 0.10],[0.3, 1.2, 0.10]].forEach(([px, py, pz])=>{
        const paper=new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 0.02), paperMat);
        paper.position.set(plazaX+px, pty+py, plazaZ+pz); vScene.add(paper);
      });
      sol.push({cx:plazaX, cz:plazaZ, rx:0.4, rz:0.4});
    } else if(plazaProp === 'tree'){
      // Larger ornamental tree at the village center — same shape as
      // border trees but bigger and a touch fuller.
      const trunkMat2=new THREE.MeshLambertMaterial({color:0x3a2010});
      const treeH=6.5;
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, treeH*0.5, 8), trunkMat2);
      trunk.position.set(plazaX, pty+treeH*0.25, plazaZ); vScene.add(trunk);
      const canMat=new THREE.MeshLambertMaterial({color:0x2c6a1a});
      const canopy=new THREE.Mesh(new THREE.ConeGeometry(2.4, treeH*0.85, 8), canMat);
      canopy.position.set(plazaX, pty+treeH*0.6, plazaZ); vScene.add(canopy);
      sol.push({cx:plazaX, cz:plazaZ, rx:0.7, rz:0.7});
    }
  }

  // ── NPC instances (v61: per-village cfg.npcDefs, fallback to global NPC_DEF) ─
  // Ashenmoor passes cfg.npcDefs=NPC_DEF explicitly. Hearthwick supplies its
  // own HEARTHWICK_NPC_DEFS. Pattern mirrors buildTown's cfg.townNpcs.
  (cfg.npcDefs||NPC_DEF).forEach(def=>{
    const g=buildNPCMesh(def);
    const ty=_vGetY(def.x,def.z);
    g.position.set(def.x,ty,def.z);vScene.add(g);
    const dot=new THREE.Mesh(new THREE.SphereGeometry(.06,6,6),new THREE.MeshBasicMaterial({color:0xffdd00}));
    dot.position.set(def.x,ty+1.5,def.z);dot.visible=false;vScene.add(dot);
    npcs.push({g,dot,def,wa:Math.random()*Math.PI*2,wt:0,ph:Math.random()*Math.PI*2});
  });

  // ── Portals ───────────────────────────────────────────────────────────────
  // v61: only assign global PORTALS if this village has dungeons. Hearthwick
  // has no dungeonZone — skipping the assignment preserves Ashenmoor's PORTALS
  // during init, so `buildDungeon(PORTALS[0])` still finds a valid portal.
  // Villages with no dungeons still register an empty portal array into ZONES.
  let villagePortals=[];
  if(cfg.dungeonZone){
    villagePortals=WORLD_DUNGEONS.filter(e=>e.zone===cfg.dungeonZone&&e.kind!=='fort_door').map(makePortalDef); // v80 S132 — forts belong to the world's compound and keep
    PORTALS=villagePortals;
    spawnPortalMeshes(vScene,villagePortals,sol,_vGetY);
  }

  // ── Border: portals define gaps, plus every gate in cfg.gates ────────────
  // v61c: multi-gate gap carving. Previous _inGap only checked cfg.gateX on
  // the south edge (z<5). Hearthwick uses cfg.gates[] with a north gate too,
  // so cfg.gateX was undefined, NaN math silently passed, and trees got placed
  // ACROSS the north gate — Deepwood south spawned player straight into a tree.
  // Now we compute gate defs up-front and check all four edges per-gate.
  const _portalGaps=villagePortals.map(p=>({cx:p.x,cz:p.z,r:3.5}));
  const _gateGapDefs = cfg.gates || (cfg.gateX!=null ? [{
    x:cfg.gateX, z:cfg.gateZ||1.5,
  }] : []);
  // v61f3: platform resolution. Spec format: `cfg.platforms = [{x0,x1,z0,z1,
  // y|ySource}, ...]`. `y` is a fixed number; `ySource:[wx,wz]` samples the
  // terrain at that point (used when bridge Y derives from bank-top grade).
  // Resolved here BEFORE border placement so `_inGap` can exclude platform
  // footprints (otherwise border trees drop into bridge approach corridors).
  // The resolved array also becomes ZONES[id].platforms for the runtime
  // override in activeTerrainH — player walks AT platform Y when inside one.
  // Also auto-extends each platform's footprint by 0.5u for the inGap
  // predicate, so trees don't crowd right up to the bridge deck edge.
  const _platforms = [];
  if(cfg.platforms){
    cfg.platforms.forEach(p => {
      let resolvedY = p.y;
      if(resolvedY == null && p.ySource){
        resolvedY = _vGetY(p.ySource[0], p.ySource[1]);
      }
      _platforms.push({x0:p.x0, x1:p.x1, z0:p.z0, z1:p.z1, y:resolvedY, name:p.name});
    });
  }
  function _inGap(x,z){
    if(_portalGaps.some(g=>Math.hypot(x-g.cx,z-g.cz)<g.r)) return true;
    // Platform footprints (+0.5u margin) — bridge approach trees etc.
    if(_platforms.some(p => (
      x >= p.x0 - 0.5 && x <= p.x1 + 0.5 &&
      z >= p.z0 - 0.5 && z <= p.z1 + 0.5
    ))) return true;
    // v61f5: river carve footprint — channel + banks. Every border type and
    // any predicate-driven scatter inherits this, so hedges and border trees
    // can't drop into the river. Same +0.5u margin as platforms.
    if(cfg.river){
      const r = cfg.river;
      const perpDist = Math.abs((r.axis === 'N-S' ? x : z) - (r.axis === 'N-S' ? r.centerX : r.centerZ));
      if(perpDist <= r.channelWidth/2 + r.bankSlope + 0.5) return true;
    }
    // Carve a corridor (±3.5 wide, 6 deep from the edge) at each gate, routed
    // by which edge the gate sits on.
    return _gateGapDefs.some(g=>{
      if(g.z<=6)          return Math.abs(x-g.x)<3.5 && z<6;
      if(g.z>=SIZE-6)     return Math.abs(x-g.x)<3.5 && z>SIZE-6;
      if(g.x<=6)          return Math.abs(z-g.z)<3.5 && x<6;
      if(g.x>=SIZE-6)     return Math.abs(z-g.z)<3.5 && x>SIZE-6;
      return false;
    });
  }
  function _inVillage(x,z){return Math.hypot(x-vCX,z-vCZ)<(cfg.villageR||30);}

  // ── Hedges ────────────────────────────────────────────────────────────────
  const hedgeMat=new THREE.MeshLambertMaterial({color:0x1a4a12});
  const hedgeDarkMat=new THREE.MeshLambertMaterial({color:0x112e0a});
  function _hedge(x,z){
    if(_inGap(x,z))return;
    const ty=_vGetY(x,z);
    const w=1.6+Math.random()*.8,h=1.1+Math.random()*.5,d=1.2+Math.random()*.5;
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),hedgeMat);
    body.position.set(x,ty+h/2,z);vScene.add(body);
    for(let l=0;l<2+Math.floor(Math.random()*2);l++){
      const lump=new THREE.Mesh(new THREE.SphereGeometry(.45+Math.random()*.2,5,4),hedgeDarkMat);
      lump.scale.set(1,.65,1);
      lump.position.set(x+(Math.random()-.5)*.6,ty+h*.8+Math.random()*.2,z+(Math.random()-.5)*.4);
      vScene.add(lump);
    }
  }
  const trunkMat=new THREE.MeshLambertMaterial({color:0x3a2010});
  function _borderTree(x,z){
    if(_inGap(x,z))return;
    const ty=_vGetY(x,z);
    const h=4+Math.random()*3.5,r=1.6+Math.random()*.9;
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(r*.15,r*.22,h*.5,6),trunkMat);
    trunk.position.set(x,ty+h*.25,z);vScene.add(trunk);
    const canCol=new THREE.Color().setHSL(.28+Math.random()*.07,.52,.14+Math.random()*.09);
    const can=new THREE.Mesh(new THREE.ConeGeometry(r,h*.75,7),new THREE.MeshLambertMaterial({color:canCol}));
    can.position.set(x,ty+h*.5+h*.3,z);vScene.add(can);
    sol.push({cx:x,cz:z,rx:r*.4,rz:r*.4});
  }
  const bStep=2.2,bM=2.0,tM=4.5;
  // v61em: optional open side — skip the perimeter hedges + trees on one
  // edge of the village so the player has a clear line of sight to the
  // landscape beyond. Used by Salthaven (cfg.openSide:'E') so the harbor
  // and water are visible from inside the village instead of being
  // blocked by a dense tree ring. Inland villages (Hearthwick, Cill Beag,
  // Ashenmoor) leave openSide unset and get the full ring.
  const _openSide = cfg.openSide || null;
  const _skipNorth = _openSide === 'N';
  const _skipSouth = _openSide === 'S';
  const _skipEast  = _openSide === 'E';
  const _skipWest  = _openSide === 'W';
  // v61et: border-type dispatch (BORDER_TYPES). cfg.borderType picks the
  // perimeter style; defaults to 'hedge_and_trees' which preserves the
  // prior unconditional perimeter loop bit-for-bit. Each builder honors
  // _inGap (gate corridors) and _skipN/S/E/W (cfg.openSide). Local _hedge
  // and _borderTree above are unused by non-default border types but kept
  // because the interior-tree pass below still calls _borderTree.
  const _borderName = cfg.borderType || 'hedge_and_trees';
  const _borderFn = (typeof BORDER_TYPES!=='undefined' && BORDER_TYPES[_borderName]) || (typeof BORDER_TYPES!=='undefined' && BORDER_TYPES.hedge_and_trees);
  if(_borderFn){
    _borderFn(vScene, sol, cfg, {
      SIZE, getY:_vGetY, inGap:_inGap,
      skipN:_skipNorth, skipS:_skipSouth, skipE:_skipEast, skipW:_skipWest,
    });
  }

  // ── Interior trees ────────────────────────────────────────────────────────
  // v61ex: dispatch through INTERIOR_TREES table. cfg.interiorTreeStyle
  // picks the per-tree builder (defaults to 'cone_pine' which preserves
  // the prior _borderTree call bit-for-bit). 'none' suppresses the pass
  // entirely — used by Carraig Mór (rocky outcrop, no trees).
  // v61em: honors cfg.openSide. On the open-side half of the village,
  // interior trees would still poke up between buildings and the open
  // landscape; suppressing them on that half keeps the line of sight clean.
  const _treeStyle = cfg.interiorTreeStyle || 'cone_pine';
  if(_treeStyle !== 'none'){
    const _treeFn = (typeof INTERIOR_TREES!=='undefined' && INTERIOR_TREES[_treeStyle]) || (typeof INTERIOR_TREES!=='undefined' && INTERIOR_TREES.cone_pine);
    if(_treeFn){
      for(let gx=8;gx<SIZE-8;gx+=7){
        for(let gz=8;gz<SIZE-8;gz+=7){
          if(_inVillage(gx,gz)||_inGap(gx,gz))continue;
          // Skip the open-side half of the zone
          if(_skipEast  && gx > SIZE*0.55)continue;
          if(_skipWest  && gx < SIZE*0.45)continue;
          if(_skipSouth && gz > SIZE*0.55)continue;
          if(_skipNorth && gz < SIZE*0.45)continue;
          const count=Math.random()<.55?2:1;
          for(let c=0;c<count;c++){
            const tx=gx+(Math.random()-.5)*5,tz=gz+(Math.random()-.5)*5;
            if(_inVillage(tx,tz)||_inGap(tx,tz))continue;
            if(tx<6||tx>SIZE-6||tz<6||tz>SIZE-6)continue;
            _treeFn(tx, tz, vScene, sol, _vGetY);
          }
        }
      }
    }
  }

  // ── Ground scatter ────────────────────────────────────────────────────────
  // v61ex: dispatch through GROUND_SCATTER table. cfg.groundScatter picks
  // the per-village scatter style (defaults to 'grass_and_bushes' which
  // preserves the prior 320-iteration loop bit-for-bit). Each builder
  // honors _inVillage / _inGap.
  const _scatterName = cfg.groundScatter || 'grass_and_bushes';
  const _scatterFn = (typeof GROUND_SCATTER!=='undefined' && GROUND_SCATTER[_scatterName]) || (typeof GROUND_SCATTER!=='undefined' && GROUND_SCATTER.grass_and_bushes);
  if(_scatterFn){
    _scatterFn(vScene, sol, cfg, {
      SIZE, getY:_vGetY, inGap:_inGap, inVillage:_inVillage,
    });
  }

  // ── Notice board ──────────────────────────────────────────────────────────
  // v61f0: when the notice board's intended position overlaps a plaza prop
  // (well/market_post/tree), search a small ring of cardinal offsets for an
  // empty spot. Affects every village with a plaza prop — Carraig Mór, Inis
  // Rua, Droichead all had latent stacking bugs at centerX/Z. Search hits
  // 3u offsets first (close, reads as "village square corner"); if all four
  // collide with the plaza prop or a building footprint, falls back to the
  // requested position (no village in practice will reach this).
  //
  // Whole assembly built as a THREE.Group with Y rotation so the parchment
  // face points toward the plaza center regardless of which offset wins.
  if(cfg.noticeBoardX!=null){
    let bx=cfg.noticeBoardX, bz=cfg.noticeBoardZ, _faceYaw=0;
    if((cfg.plazaProp||'none') !== 'none'){
      const _plX = cfg.plazaX != null ? cfg.plazaX : vCX;
      const _plZ = cfg.plazaZ != null ? cfg.plazaZ : vCZ;
      // Only relocate if requested position is on top of the plaza center.
      // Tolerance 1.5u accounts for floating-point and any near-overlap.
      if(Math.hypot(bx-_plX, bz-_plZ) < 1.5){
        // [dx, dz, yaw-so-parchment-faces-plaza]. yaw convention: 0 = parchment
        // faces -Z (north), so for board placed south of plaza we want yaw 0.
        const _candidates = [
          [0, 3,  0],            // south of plaza, faces N toward plaza
          [3, 0,  Math.PI/2],    // east  of plaza, faces W toward plaza
          [0, -3, Math.PI],      // north of plaza, faces S toward plaza
          [-3, 0, -Math.PI/2],   // west  of plaza, faces E toward plaza
        ];
        const _buildings = cfg.buildings || [];
        for(const [dx,dz,yaw] of _candidates){
          const cx = _plX + dx, cz = _plZ + dz;
          // Reject if inside a building footprint (with 0.5u margin).
          const _hit = _buildings.some(b => (
            cx >= b.x - 0.5 && cx <= b.x + b.w + 0.5 &&
            cz >= b.z - 0.5 && cz <= b.z + b.d + 0.5
          ));
          if(!_hit){ bx = cx; bz = cz; _faceYaw = yaw; break; }
        }
      }
    }
    const darkWoodMat=new THREE.MeshLambertMaterial({color:0x4a3010});
    const nbGrp=new THREE.Group();
    nbGrp.position.set(bx,0,bz);
    nbGrp.rotation.y=_faceYaw;
    [[-.3,0],[.3,0]].forEach(([ox])=>{
      const post=new THREE.Mesh(new THREE.BoxGeometry(.08,1.3,.08),darkWoodMat);
      post.position.set(ox,.65,0);nbGrp.add(post);
    });
    const beam=new THREE.Mesh(new THREE.BoxGeometry(.72,.08,.06),darkWoodMat);
    beam.position.set(0,1.2,0);nbGrp.add(beam);
    const board=new THREE.Mesh(new THREE.BoxGeometry(.6,.5,.04),new THREE.MeshLambertMaterial({color:0x7a5820,side:THREE.DoubleSide}));
    board.position.set(0,.85,0);nbGrp.add(board);
    const parch=new THREE.Mesh(new THREE.BoxGeometry(.52,.42,.01),new THREE.MeshLambertMaterial({color:0xd4b878}));
    parch.position.set(0,.85,-.025);nbGrp.add(parch);
    vScene.add(nbGrp);
    // Sol entry footprint accounts for rotation — for 0 or π, the board's
    // long axis runs along world X (rx=.5, rz=.3); for ±π/2 it runs along
    // world Z (rx=.3, rz=.5).
    const _rotated = Math.abs(Math.abs(_faceYaw) - Math.PI/2) < 0.01;
    sol.push({cx:bx, cz:bz, rx:_rotated?.3:.5, rz:_rotated?.5:.3});
    OW_NOTICE_BOARDS.push({x:bx,z:bz,title:cfg.noticeBoardTitle||'',text:cfg.noticeBoardText||'',zone:cfg.id});
  }

  // ── Herbs ─────────────────────────────────────────────────────────────────
  const heartroots=(cfg.herbSpawns||[]).filter(s=>s.type==='heartroot');
  const others=(cfg.herbSpawns||[]).filter(s=>s.type!=='heartroot');
  // Heartroot near portals (dynamic positions)
  PORTALS.slice(0,heartroots.length).forEach((p,i)=>{
    const sp=heartroots[i];
    const hx=p.x+(Math.random()-.5)*3,hz=p.z+(Math.random()-.5)*3;
    const def=HERB_DEF[sp.type];if(!def)return;
    const {g,gl}=mkHerbMesh(hx,hz,def,vScene);
    herbArr.push({x:hx,z:hz,type:sp.type,def,g,gl,harvested:false,respawnT:0,ph:Math.random()*Math.PI*2});
  });
  others.forEach(sp=>{
    const def=HERB_DEF[sp.type];if(!def)return;
    const {g,gl}=mkHerbMesh(sp.x,sp.z,def,vScene);
    herbArr.push({x:sp.x,z:sp.z,type:sp.type,def,g,gl,harvested:false,respawnT:0,ph:Math.random()*Math.PI*2});
  });

  // ── Gates (v60 — multi-gate support) ──────────────────────────────────────
  // cfg.gates is an array of {x,z,targetZone,spawnX,spawnZ,spawnYaw,label}.
  // For legacy single-gate config (Ashenmoor), cfg.gateX/gateZ/gateTarget etc.
  // are synthesized into a one-element gates array.
  // Each built village has its own gate array; if cfg.gateArr is supplied, we
  // push into it (backwards compat for ASHENMOOR_GATES), else we build fresh.
  const villageGates = cfg.gateArr || [];
  const gateDefs = cfg.gates || (cfg.gateX!=null ? [{
    x:cfg.gateX, z:cfg.gateZ||1.5, targetZone:cfg.gateTarget,
    spawnX:cfg.gateSpawnX, spawnZ:cfg.gateSpawnZ, spawnYaw:cfg.gateSpawnYaw||Math.PI,
    label:cfg.gateLabel||cfg.gateTarget,
  }] : []);
  gateDefs.forEach(gd=>{
    // v61f: Compute gate side from its zone-edge position, and derive rotation
    // from that. E/W gates need Math.PI/2 so the fence spans the Z-axis.
    // Terrain Y passed in so the gate sits on the ground; previously buried
    // on Ashenmoor's south edge where terrain is elevated beyond hillR=70.
    const side = gd.z<=6 ? 'S' : gd.z>=SIZE-6 ? 'N' : gd.x<=6 ? 'W' : 'E';
    const rotY = gd.rotY != null ? gd.rotY : ((side==='E'||side==='W') ? Math.PI/2 : 0);
    const ty = _vGetY(gd.x, gd.z);
    // v61ew: optional `noFence` flag suppresses the default fence-gate
    // mesh. For gates where the visible affordance is custom (e.g.
    // Carraig Mór's south gate, where a moored ferry boat at the end
    // of a dock IS the gate visual). The gate's interaction logic
    // is unchanged — only the mesh is skipped. detailFn supplies the
    // bespoke geometry.
    const gPost = gd.noFence ? null : buildFenceGate(vScene,gd.x,gd.z,rotY,undefined,ty);
    // v61e0: commission-barrier crossbeam — visible until Q7 turn-in.
    let barrierMesh=null;
    if(gd.guard==='commission' && !worldState.commissioned){
      barrierMesh=_buildCommissionBarrier(vScene,gd.x,gd.z,rotY,ty);
    }
    villageGates.push({
      x:gd.x, z:gd.z, targetZone:gd.targetZone,
      spawnX:gd.spawnX, spawnZ:gd.spawnZ, spawnYaw:gd.spawnYaw||Math.PI,
      label:gd.label||gd.targetZone, mesh:gPost, guard:gd.guard, barrierMesh,
    });
  });

  // ── Optional detail hook (Ashenmoor-specific paths, signs, decorations) ───
  // v61f3: platforms resolved upfront (above) from cfg.platforms spec, so
  // border placement can exclude them and the runtime ZONES[id] entry has
  // them ready to feed activeTerrainH. detailFn no longer takes a platforms
  // argument — declare them in the spec instead.
  if(cfg.detailFn)cfg.detailFn(vScene,sol,_vGetY);

  // ── Register zone ─────────────────────────────────────────────────────────
  // v61d: store getY + herbs on ZONES[id] so activeTerrainH / activeHerbs can
  // treat every builder-produced zone uniformly, without hardcoded if-chains.
  cfg.scene=vScene;
  ZONES[cfg.id]={scene:vScene,sol,npcs,enemies:[],gates:villageGates,size:SIZE,portals:villagePortals,getY:_vGetY,herbs:cfg.herbs||[],platforms:_platforms,_cfg:cfg}; // v61e9 — _cfg ref enables respawnZoneEnemies to re-roll the enemy spec; v61f3 — platforms for bridge-walking

  return vScene;
}



// ── Per-building decorations (building-relative) ──────────────────────────
ASHENMOOR_CONFIG.decorateFn = function(sc, sol, h, ty, getY){
  const bx=h.x, bz=h.z, bw=h.w, bd=h.d, face=h.face;
  const cx=bx+bw/2, cz=bz+bd/2; // building center
  // Door world position
  const dX = face==='E'?bx+bw : face==='W'?bx : cx;
  const dZ = face==='S'?bz     : face==='N'?bz+bd : cz;

  const darkWoodMat=new THREE.MeshLambertMaterial({color:0x4a3010});
  const stoneMat=new THREE.MeshLambertMaterial({color:0x888070});
  const ropeMat=new THREE.MeshLambertMaterial({color:0xa08050});

  // ── Sign post — outside door face ──────────────────────────────────────
  // Post offset: beside door, 0.5u out from wall face
  // Sign-mounting: tavern-bracket convention — board hangs perpendicular
  // to the wall, read by a player walking past parallel to the building.
  // S/N door faces use rotation π/2; E/W faces use 0.
  // v61en: Y anchored to terrain at the SIGN'S OWN location (not building
  //   center) — matters once any village adds terrainSlope; harmless on
  //   Ashenmoor's flat-ish terrain but consistency-fixed regardless.
  // v61eo: Rotation table reverted (was incorrectly flipped in v61en).
  const signOffsets={E:[bx+bw+0.5, bz-0.5], W:[bx-0.5, bz-0.5], S:[bx+bw*0.2, bz-0.5], N:[cx, bz+bd+0.5]};
  const armDirs={E:[0.55,0], W:[-0.55,0], S:[0,-0.55], N:[0,0.55]};
  const boardRots={E:0, W:0, S:Math.PI/2, N:Math.PI/2};
  const [spx,spz]=signOffsets[face]||[cx,bz-0.5];
  const [adx,adz]=armDirs[face]||[0,-0.55];
  const brotY=boardRots[face]!==undefined?boardRots[face]:Math.PI/2;
  const sty=getY?getY(spx,spz):ty;
  const post=new THREE.Mesh(new THREE.BoxGeometry(.06,1.9,.06),darkWoodMat);
  post.position.set(spx,sty+0.95,spz);sc.add(post);
  const aLen=Math.hypot(adx,adz);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(aLen,.05,.05),darkWoodMat);
  arm.position.set(spx+adx/2,sty+1.72,spz+adz/2);arm.rotation.y=-Math.atan2(adz,adx);sc.add(arm);
  const boardMesh=new THREE.Mesh(new THREE.BoxGeometry(.42,.34,.07),new THREE.MeshLambertMaterial({color:0x6a4818,side:THREE.DoubleSide}));
  boardMesh.position.set(spx+adx,sty+1.48,spz+adz);boardMesh.rotation.y=brotY;sc.add(boardMesh);

  // ── Windows — all four walls ────────────────────────────────────────────
  function _win(wx,wy,wz,ry,outDir){
    const offX=ry===0?0:outDir*0.08, offZ=ry===0?outDir*0.08:0;
    const winFrameMat=new THREE.MeshLambertMaterial({color:0x5a3a10});
    const winGlassMat=new THREE.MeshLambertMaterial({color:0x5ec8e8,transparent:true,opacity:.55,side:THREE.DoubleSide});
    const fr=new THREE.Mesh(new THREE.BoxGeometry(.56,.50,.06),winFrameMat);
    fr.position.set(wx+offX,wy,wz+offZ);fr.rotation.y=ry;sc.add(fr);
    const gl=new THREE.Mesh(new THREE.BoxGeometry(.40,.34,.04),winGlassMat);
    gl.position.set(wx+offX*1.5,wy,wz+offZ*1.5);gl.rotation.y=ry;sc.add(gl);
    const mh=new THREE.Mesh(new THREE.BoxGeometry(.40,.05,.07),winFrameMat);
    mh.position.set(wx+offX*1.5,wy,wz+offZ*1.5);mh.rotation.y=ry;sc.add(mh);
    const mv=new THREE.Mesh(new THREE.BoxGeometry(.05,.34,.07),winFrameMat);
    mv.position.set(wx+offX*1.5,wy,wz+offZ*1.5);mv.rotation.y=ry;sc.add(mv);
  }
  const wy=ty+1.4;
  // South wall (outDir=-1, rotY=0): windows flanking south door or evenly spaced
  if(face==='S'){
    _win(bx+bw*.25,wy,bz,0,-1); _win(bx+bw*.75,wy,bz,0,-1);
  } else {
    _win(cx,wy,bz,0,-1); // south wall center
  }
  _win(cx,wy,bz+bd,0,+1);                  // north wall center
  _win(bx,wy,cz,Math.PI/2,-1);             // west wall center
  _win(bx+bw,wy,cz,Math.PI/2,+1);          // east wall center

  // ── Type-specific exterior props ────────────────────────────────────────
  if(h.houseId==='h0'){ // Bram's Forge — forge hearth on south wall
    const hs=bz-0.5; // south of building
    const hcx=bx+bw*.55;
    const hearthBase=new THREE.Mesh(new THREE.BoxGeometry(.7,.22,.55),stoneMat);
    hearthBase.position.set(hcx,ty+.11,hs);sc.add(hearthBase);
    const firebox=new THREE.Mesh(new THREE.BoxGeometry(.38,.18,.1),new THREE.MeshLambertMaterial({color:0x111111}));
    firebox.position.set(hcx,ty+.15,hs-.25);sc.add(firebox);
    const coals=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.03,8),new THREE.MeshBasicMaterial({color:0xff5500}));
    coals.position.set(hcx,ty+.09,hs-.15);sc.add(coals);
    const chimney=new THREE.Mesh(new THREE.BoxGeometry(.32,1.6,.28),stoneMat);
    chimney.position.set(hcx,ty+1.0,hs-.05);sc.add(chimney);
    const chimneyTop=new THREE.Mesh(new THREE.BoxGeometry(.36,.12,.32),stoneMat);
    chimneyTop.position.set(hcx,ty+1.86,hs-.05);sc.add(chimneyTop);
    (sc.userData.chimneys||(sc.userData.chimneys=[])).push({x:hcx,y:ty+1.92,z:hs-.05,t:'weapon',k:0}); /* S354 — the forge's smoke, driven by WORLD.smokeLegacy from the main loop */
    const forgeGlow=new THREE.PointLight(0xff4400,1.2,3.5);forgeGlow.position.set(hcx,ty+.5,hs-.1);sc.add(forgeGlow);
    const anvil=new THREE.Mesh(new THREE.BoxGeometry(.32,.2,.2),new THREE.MeshLambertMaterial({color:0x444444}));
    anvil.position.set(hcx-.9,ty+.1,hs-.1);sc.add(anvil);
    const anvilTop=new THREE.Mesh(new THREE.BoxGeometry(.36,.07,.16),new THREE.MeshLambertMaterial({color:0x555555}));
    anvilTop.position.set(hcx-.9,ty+.23,hs-.1);sc.add(anvilTop);
    const barrelMat=new THREE.MeshLambertMaterial({color:0x6a4418});
    [[bx+bw+.2,cz-.3],[bx+bw+.3,cz+.3],[bx+bw+.8,cz-.1]].forEach(([bx2,bz2])=>{
      const body=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.45,8),barrelMat);
      body.position.set(bx2,ty+.22,bz2);sc.add(body);
      const hoop=new THREE.Mesh(new THREE.TorusGeometry(.23,.025,4,8),barrelMat);
      hoop.rotation.x=Math.PI/2;hoop.position.set(bx2,ty+.3,bz2);sc.add(hoop);
    });
  }
  else if(h.houseId==='h1'){ // Mira's — herb rack on south wall
    const hs=bz-.05;
    const hcx=bx+bw*.6;
    [[hcx-.4],[hcx+.4]].forEach(([rx])=>{
      const p=new THREE.Mesh(new THREE.BoxGeometry(.06,.7,.06),darkWoodMat);
      p.position.set(rx,ty+.35,hs);sc.add(p);
    });
    const beam=new THREE.Mesh(new THREE.BoxGeometry(.9,.05,.05),darkWoodMat);
    beam.position.set(hcx,ty+.72,hs);sc.add(beam);
    [[hcx-.35,0x3a8a28],[hcx,0x5aaa38],[hcx+.35,0x2a7a18]].forEach(([rx,col])=>{
      const str=new THREE.Mesh(new THREE.CylinderGeometry(.005,.005,.2,4),ropeMat);
      str.position.set(rx,ty+.6,hs);sc.add(str);
      const bunch=new THREE.Mesh(new THREE.CylinderGeometry(.04,.025,.14,6),new THREE.MeshLambertMaterial({color:col}));
      bunch.position.set(rx,ty+.48,hs);sc.add(bunch);
    });
  }
  else if(h.houseId==='h2'){ // Barnaby's — crates on east side
    const ex=bx+bw+.1;
    const crateMat=new THREE.MeshLambertMaterial({color:0x7a5a28});
    [[ex,bz+bd*.4,.3],[ex+.5,bz+bd*.6,.25],[ex+.1,bz+bd*.8,.28]].forEach(([cx2,cz2,sz])=>{
      const crate=new THREE.Mesh(new THREE.BoxGeometry(sz*1.8,sz*1.4,sz*1.8),crateMat);
      crate.position.set(cx2,ty+sz*.7,cz2);sc.add(crate);
      const sl=new THREE.Mesh(new THREE.BoxGeometry(sz*1.9,.03,sz*1.9),new THREE.MeshLambertMaterial({color:0x5a3a10}));
      sl.position.set(cx2,ty+sz*.4,cz2);sc.add(sl);
    });
    // Merchant scale on east wall
    const scalePost=new THREE.Mesh(new THREE.BoxGeometry(.04,.8,.04),darkWoodMat);
    scalePost.position.set(ex+.2,ty+.4,bz+bd*.5);sc.add(scalePost);
    const scaleArm=new THREE.Mesh(new THREE.BoxGeometry(.4,.03,.03),darkWoodMat);
    scaleArm.position.set(ex+.2,ty+.82,bz+bd*.5);sc.add(scaleArm);
    [-1,1].forEach(side=>{
      const str=new THREE.Mesh(new THREE.CylinderGeometry(.005,.005,.2,4),ropeMat);
      str.position.set(ex+.2+side*.18,ty+.7,bz+bd*.5);sc.add(str);
      const pan=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.02,8),new THREE.MeshLambertMaterial({color:0xccaa44}));
      pan.position.set(ex+.2+side*.18,ty+.59,bz+bd*.5);sc.add(pan);
    });
  }
  else if(h.houseId==='h3'){ // Guardhouse — weapon rack south of door
    const rz2=bz-.3;
    const rcx=cx+.5;
    const rackPost=new THREE.Mesh(new THREE.BoxGeometry(.06,1.1,.06),darkWoodMat);
    rackPost.position.set(rcx-.3,ty+.55,rz2);sc.add(rackPost);
    const rackPost2=new THREE.Mesh(new THREE.BoxGeometry(.06,1.1,.06),darkWoodMat);
    rackPost2.position.set(rcx+.4,ty+.55,rz2);sc.add(rackPost2);
    const rackBar=new THREE.Mesh(new THREE.BoxGeometry(.76,.06,.06),darkWoodMat);
    rackBar.position.set(rcx+.05,ty+.9,rz2);sc.add(rackBar);
    [{x:rcx-.2,lean:-0.22},{x:rcx+.05,lean:0},{x:rcx+.3,lean:0.18}].forEach(({x:rx,lean})=>{
      const spear=new THREE.Group();
      const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.9,6),new THREE.MeshLambertMaterial({color:0x7a5020}));
      shaft.position.y=.45;spear.add(shaft);
      const tip=new THREE.Mesh(new THREE.ConeGeometry(.04,.14,6),stoneMat);
      tip.position.y=.97;spear.add(tip);
      spear.rotation.z=lean*0.28;spear.position.set(rx,ty,rz2-.05);sc.add(spear);
    });
  }
  else if(h.houseId==='h4'){ // Pip's — display cabinet on east wall
    const ex2=bx+bw+.3;
    const cab=new THREE.Mesh(new THREE.BoxGeometry(.14,.38,.5),new THREE.MeshLambertMaterial({color:0x6a4818}));
    cab.position.set(ex2,ty+.22,cz);sc.add(cab);
    const glass=new THREE.Mesh(new THREE.BoxGeometry(.03,.3,.42),new THREE.MeshLambertMaterial({color:0x88aacc,transparent:true,opacity:.4}));
    glass.position.set(ex2-.06,ty+.22,cz);sc.add(glass);
    [0xffcc44,0xff4488,0x44ccff].forEach((col,i)=>{
      const oz=(i-1)*.12;
      const t=new THREE.Mesh(new THREE.SphereGeometry(.032,5,4),new THREE.MeshLambertMaterial({color:col}));
      t.position.set(ex2-.08,ty+.22,cz+oz);sc.add(t);
    });
  }
  else if(h.houseId==='h5'){ // Edna's — vegetable garden on east side
    const ex3=bx+bw+.3;
    const soilMat=new THREE.MeshLambertMaterial({color:0x5a3a18});
    const hayMat=new THREE.MeshLambertMaterial({color:0xd4a830});
    for(let row=0;row<3;row++){
      const rowZ=bz+.5+row*.55;
      const bed=new THREE.Mesh(new THREE.BoxGeometry(.8,.07,.36),soilMat);
      bed.position.set(ex3+.4,ty+.035,rowZ);sc.add(bed);
      for(let p=0;p<3;p++){
        const plant=new THREE.Mesh(new THREE.SphereGeometry(.055,5,4),new THREE.MeshLambertMaterial({color:0x2a8a18}));
        plant.scale.set(1,1.4,1);plant.position.set(ex3+.1+p*.3,ty+.1,rowZ);sc.add(plant);
      }
    }
    // Hay bales
    [[ex3-.2,bz+bd*.8],[ex3+.4,bz+bd*.6]].forEach(([hx,hz])=>{
      const bale=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.5,8),hayMat);
      bale.rotation.z=Math.PI/2;bale.position.set(hx,ty+.35,hz);sc.add(bale);
      for(let b=0;b<2;b++){
        const band=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.04,8),new THREE.MeshLambertMaterial({color:0xa08050}));
        band.rotation.z=Math.PI/2;band.position.set(hx-.2+b*.4,ty+.35,hz);sc.add(band);
      }
    });
  }
};

// ══════════════════════════════════════════════════════════════
// GENERIC VILLAGE DECORATOR (v61em)
// ══════════════════════════════════════════════════════════════
// A reusable decorateFn for placeholder villages (Salthaven, Droichead,
// Cill Beag, Redwater Ford, etc). Differs from ASHENMOOR_CONFIG.decorateFn
// in that the type-specific exterior props are keyed on h.type rather than
// h.houseId, so any village's house with type:'weapon' gets the forge-hearth
// dressing, type:'inn' gets the bench-and-barrel dressing, and so on.
//
// Signs + windows are identical-spirit to Ashenmoor's pattern but live
// independently here so we don't risk touching the Ashenmoor build path.
// Ashenmoor keeps its hand-tuned version unchanged.
//
// Usage: pass `decorateFn:genericVillageDecorate` in the placeholder spec,
// or assign cfg.decorateFn = genericVillageDecorate after registration.
function genericVillageDecorate(sc, sol, h, ty, getY){
  const bx=h.x, bz=h.z, bw=h.w, bd=h.d, face=h.face;
  const cx=bx+bw/2, cz=bz+bd/2;
  const t=h.type;

  const darkWoodMat=new THREE.MeshLambertMaterial({color:0x4a3010});
  const stoneMat=new THREE.MeshLambertMaterial({color:0x888070});
  const ropeMat=new THREE.MeshLambertMaterial({color:0xa08050});

  // ── Sign post — outside the door face ────────────────────────────────
  // Identical-spirit to Ashenmoor's approach: a vertical post offset from
  // the door, a horizontal arm sticking out from it, and a board hanging
  // from the arm. Different door faces want different offsets.
  //
  // Sign-mounting convention: the board hangs PERPENDICULAR to the wall
  // (like a real tavern bracket sign), so a player walking along/past the
  // wall sees the icon face-on. This is the same convention Ironhaven uses.
  // For S/N door faces, the wide board face points ±X (rotation π/2);
  // for E/W faces, the wide face points ±Z (rotation 0).
  //
  // v61en fixes vs v61em (rotation table reverted in v61eo — see below):
  //   (1) Y-positioning: post/arm/board now anchored to the terrain Y at
  //       the SIGN'S OWN location (sty = getY(spx,spz)), not the building
  //       center. Salthaven's directional terrain slope made signs float
  //       on the seaward side and bury on the landward side; sampling at
  //       the sign location resolves it. Ashenmoor was unaffected because
  //       its terrain is essentially flat at all building corners.
  //   (2) Painted icon meshes mounted on the board (sword/helmet/flask/
  //       scroll/anchor/fish/tankard), shop-type-keyed. Ports Ironhaven's
  //       icon system, plus three new icons for Salthaven's harbor types.
  // v61eo: Rotation table reverted to original (E:0, W:0, S:π/2, N:π/2).
  //   The v61en flip was based on a misread of the mounting convention —
  //   I assumed face-on-approach (player walks toward door, reads sign
  //   straight on) but the actual convention is tavern-bracket (player
  //   walks parallel to wall, sign sticks out perpendicular). Confirmed
  //   by playtest screenshot showing edge-on sign in Salthaven and by
  //   Ironhaven's identical convention with a comment block explaining it.
  const signOffsets={E:[bx+bw+0.5, bz-0.5], W:[bx-0.5, bz-0.5], S:[bx+bw*0.2, bz-0.5], N:[cx, bz+bd+0.5]};
  const armDirs={E:[0.55,0], W:[-0.55,0], S:[0,-0.55], N:[0,0.55]};
  const boardRots={E:0, W:0, S:Math.PI/2, N:Math.PI/2};
  const [spx,spz]=signOffsets[face]||[cx,bz-0.5];
  const [adx,adz]=armDirs[face]||[0,-0.55];
  const brotY=boardRots[face]!==undefined?boardRots[face]:Math.PI/2;
  // Sample terrain at the sign's actual world position, not the building anchor.
  const sty=getY?getY(spx,spz):ty;
  const post=new THREE.Mesh(new THREE.BoxGeometry(.06,1.9,.06),darkWoodMat);
  post.position.set(spx,sty+0.95,spz);sc.add(post);
  const aLen=Math.hypot(adx,adz);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(aLen,.05,.05),darkWoodMat);
  arm.position.set(spx+adx/2,sty+1.72,spz+adz/2);arm.rotation.y=-Math.atan2(adz,adx);sc.add(arm);
  const boardMesh=new THREE.Mesh(new THREE.BoxGeometry(.42,.34,.07),new THREE.MeshLambertMaterial({color:0x6a4818,side:THREE.DoubleSide}));
  boardMesh.position.set(spx+adx,sty+1.48,spz+adz);boardMesh.rotation.y=brotY;sc.add(boardMesh);

  // ── Sign icon — shop-type glyph mounted on the board ────────────────
  // Ports Ironhaven's icon system (sword/helmet/flask/scroll) plus three
  // new village-coverage icons (anchor/fish/tankard). Icons are Z-symmetric
  // (thickness ≥0.10 in their local Z) so they protrude through both faces
  // of the 0.07-thick board — readable from front and back without
  // duplicating geometry. Group is parented at the board's center and
  // shares the board's rotation.
  const iconMat=new THREE.MeshLambertMaterial({color:0xe8d8a0});
  const iconAcc=new THREE.MeshLambertMaterial({color:0x5a3818});
  const iconRed=new THREE.MeshLambertMaterial({color:0x9a2020});
  const iconGroup=new THREE.Group();
  iconGroup.position.set(spx+adx,sty+1.48,spz+adz);
  iconGroup.rotation.y=brotY;
  if(t==='weapon'){
    // Sword — blade + crossguard + hilt + pommel
    const blade=new THREE.Mesh(new THREE.BoxGeometry(.04,.22,.10),iconMat);
    blade.position.set(0,0.04,0);iconGroup.add(blade);
    const cross=new THREE.Mesh(new THREE.BoxGeometry(.18,.035,.10),iconMat);
    cross.position.set(0,-0.08,0);iconGroup.add(cross);
    const hilt=new THREE.Mesh(new THREE.BoxGeometry(.035,.07,.10),iconAcc);
    hilt.position.set(0,-0.13,0);iconGroup.add(hilt);
    const pommel=new THREE.Mesh(new THREE.SphereGeometry(.038,8,6),iconMat);
    pommel.position.set(0,-0.18,0);iconGroup.add(pommel);
  } else if(t==='armor'){
    // Helmet — squashed sphere dome + rim band
    const dome=new THREE.Mesh(new THREE.SphereGeometry(.11,8,6),iconMat);
    dome.scale.set(1,0.62,1);
    dome.position.set(0,0.03,0);iconGroup.add(dome);
    const rim=new THREE.Mesh(new THREE.BoxGeometry(.24,.035,.13),iconMat);
    rim.position.set(0,-0.04,0);iconGroup.add(rim);
  } else if(t==='potion'){
    // Flask — body + tapered neck + stopper
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.16,8),iconMat);
    body.position.set(0,-0.02,0);iconGroup.add(body);
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(.03,.045,.07,8),iconMat);
    neck.position.set(0,0.10,0);iconGroup.add(neck);
    const stopper=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.045,8),iconAcc);
    stopper.position.set(0,0.16,0);iconGroup.add(stopper);
  } else if(t==='misc'){
    // Scroll — horizontal cylinder with red end-ties (Ironhaven's
    // misc/Royal Herald glyph). Used for general-goods village shops.
    const scroll=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.28,8),iconMat);
    scroll.rotation.z=Math.PI/2;
    scroll.position.set(0,0,0);iconGroup.add(scroll);
    const tieL=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.12,8),iconRed);
    tieL.rotation.z=Math.PI/2;
    tieL.position.set(-.12,0,0);iconGroup.add(tieL);
    const tieR=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.12,8),iconRed);
    tieR.rotation.z=Math.PI/2;
    tieR.position.set(.12,0,0);iconGroup.add(tieR);
  } else if(t==='harbor_office'){
    // Anchor — shank + crown ring + stock + curved fluke arms.
    // All meshes Z-symmetric; the curved flukes use TorusGeometry arc
    // segments for the curved hooks at the bottom.
    const shank=new THREE.Mesh(new THREE.BoxGeometry(.04,.24,.10),iconMat);
    shank.position.set(0,0,0);iconGroup.add(shank);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.05,.015,6,12),iconMat);
    ring.rotation.x=Math.PI/2;
    ring.position.set(0,0.14,0);iconGroup.add(ring);
    const stock=new THREE.Mesh(new THREE.BoxGeometry(.18,.03,.10),iconMat);
    stock.position.set(0,0.06,0);iconGroup.add(stock);
    // Curved flukes — quarter-torus on each side, opening upward
    const flukeL=new THREE.Mesh(new THREE.TorusGeometry(.07,.018,6,8,Math.PI/2),iconMat);
    flukeL.rotation.set(Math.PI/2,0,Math.PI);
    flukeL.position.set(-.07,-.10,0);iconGroup.add(flukeL);
    const flukeR=new THREE.Mesh(new THREE.TorusGeometry(.07,.018,6,8,Math.PI/2),iconMat);
    flukeR.rotation.set(Math.PI/2,0,Math.PI/2);
    flukeR.position.set(.07,-.10,0);iconGroup.add(flukeR);
  } else if(t==='harbor_supplies'){
    // Fish — horizontal silhouette with body + tail fin + small dorsal.
    // Body is a horizontally-stretched sphere (ellipsoid via scale).
    const body=new THREE.Mesh(new THREE.SphereGeometry(.10,10,8),iconMat);
    body.scale.set(1.6,1.0,1.0);
    body.position.set(-0.02,0,0);iconGroup.add(body);
    // Tail — flat triangle on each side via thin cones rotated
    const tailTop=new THREE.Mesh(new THREE.ConeGeometry(.06,.10,4),iconMat);
    tailTop.rotation.set(0,0,Math.PI/2);
    tailTop.scale.set(1,1,1.3);
    tailTop.position.set(.18,0.03,0);iconGroup.add(tailTop);
    const tailBot=new THREE.Mesh(new THREE.ConeGeometry(.06,.10,4),iconMat);
    tailBot.rotation.set(0,0,Math.PI/2);
    tailBot.scale.set(1,1,1.3);
    tailBot.position.set(.18,-0.04,0);iconGroup.add(tailBot);
    // Small dorsal fin — triangle on top
    const dorsal=new THREE.Mesh(new THREE.ConeGeometry(.035,.06,3),iconMat);
    dorsal.scale.set(1,1,2.4);
    dorsal.position.set(-.04,0.10,0);iconGroup.add(dorsal);
    // Eye — dark dot
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.012,6,5),iconAcc);
    eye.scale.set(1,1,8);
    eye.position.set(-.10,0.02,0);iconGroup.add(eye);
  } else if(t==='inn'){
    // Tankard — squat cylinder body + rectangular handle on the side.
    // Reads as "tavern" from any angle. Body Z-symmetric; handle extends
    // through both faces.
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.085,.075,.20,10),iconMat);
    body.position.set(-.02,0,0);iconGroup.add(body);
    const lid=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.025,10),iconAcc);
    lid.position.set(-.02,0.11,0);iconGroup.add(lid);
    // Handle — vertical bar on the right with two short connectors
    const handleBar=new THREE.Mesh(new THREE.BoxGeometry(.025,.16,.10),iconMat);
    handleBar.position.set(.08,0,0);iconGroup.add(handleBar);
    const hTop=new THREE.Mesh(new THREE.BoxGeometry(.05,.025,.10),iconMat);
    hTop.position.set(.058,0.08,0);iconGroup.add(hTop);
    const hBot=new THREE.Mesh(new THREE.BoxGeometry(.05,.025,.10),iconMat);
    hBot.position.set(.058,-0.08,0);iconGroup.add(hBot);
  }
  // No icon for unknown shop types or non-shop buildings — the blank
  // board is correct in those cases (e.g. residences).
  if(iconGroup.children.length>0)sc.add(iconGroup);

  // ── Windows — flank the door on the door's wall, one centered on the others ─
  // v61ep: Pre-v61ep only flanked S-face doors; E/W/N faces got a single
  // centered window which clipped the door on whichever wall it lived on.
  // Now flanks the door wall consistently regardless of face direction,
  // with the other three walls each getting one centered window.
  function _win(wx,wy,wz,ry,outDir){
    const offX=ry===0?0:outDir*0.08, offZ=ry===0?outDir*0.08:0;
    const winFrameMat=new THREE.MeshLambertMaterial({color:0x5a3a10});
    const winGlassMat=new THREE.MeshLambertMaterial({color:0x5ec8e8,transparent:true,opacity:.55,side:THREE.DoubleSide});
    const fr=new THREE.Mesh(new THREE.BoxGeometry(.56,.50,.06),winFrameMat);
    fr.position.set(wx+offX,wy,wz+offZ);fr.rotation.y=ry;sc.add(fr);
    const gl=new THREE.Mesh(new THREE.BoxGeometry(.40,.34,.04),winGlassMat);
    gl.position.set(wx+offX*1.5,wy,wz+offZ*1.5);gl.rotation.y=ry;sc.add(gl);
    const mh=new THREE.Mesh(new THREE.BoxGeometry(.40,.05,.07),winFrameMat);
    mh.position.set(wx+offX*1.5,wy,wz+offZ*1.5);mh.rotation.y=ry;sc.add(mh);
    const mv=new THREE.Mesh(new THREE.BoxGeometry(.05,.34,.07),winFrameMat);
    mv.position.set(wx+offX*1.5,wy,wz+offZ*1.5);mv.rotation.y=ry;sc.add(mv);
  }
  const wy=ty+1.4;
  // South wall (rotY=0, outDir=-1)
  if(face==='S'){
    _win(bx+bw*.25,wy,bz,0,-1); _win(bx+bw*.75,wy,bz,0,-1);
  } else {
    _win(cx,wy,bz,0,-1);
  }
  // North wall (rotY=0, outDir=+1)
  if(face==='N'){
    _win(bx+bw*.25,wy,bz+bd,0,+1); _win(bx+bw*.75,wy,bz+bd,0,+1);
  } else {
    _win(cx,wy,bz+bd,0,+1);
  }
  // West wall (rotY=π/2, outDir=-1)
  if(face==='W'){
    _win(bx,wy,bz+bd*.25,Math.PI/2,-1); _win(bx,wy,bz+bd*.75,Math.PI/2,-1);
  } else {
    _win(bx,wy,cz,Math.PI/2,-1);
  }
  // East wall (rotY=π/2, outDir=+1)
  if(face==='E'){
    _win(bx+bw,wy,bz+bd*.25,Math.PI/2,+1); _win(bx+bw,wy,bz+bd*.75,Math.PI/2,+1);
  } else {
    _win(bx+bw,wy,cz,Math.PI/2,+1);
  }

  // ── Type-keyed exterior props ────────────────────────────────────────
  // Lighter than Ashenmoor's hand-tuned per-houseId props. Each block
  // places 1-3 small meshes that read the building's purpose at a glance.
  // (`t` declared at top of function — used by both sign-icon and exterior-prop blocks.)
  //
  // v61eq: Architecture — group + rotate. Each prop is built as if the
  // building has a SOUTH-facing door, in local coordinates relative to
  // that door. The group's rotation.y orients the prop for the actual
  // door face; the group's position translates it to the right world
  // location. Three benefits:
  //   - Mesh rotations are handled once (by the group) instead of per
  //     mesh; oblong meshes (herb beam, bench, vane) automatically run
  //     parallel to the wall regardless of face direction. Pre-v61eq,
  //     E/W-face props had long-axis meshes pointing AWAY from the wall.
  //   - Ground Y is sampled at the prop's actual world location via
  //     getY(wx, wz), not at the building center via ty. Pre-v61eq,
  //     props phased into the ground on sloped lots (Salthaven's
  //     terrainSlope makes this visible).
  //   - Per-prop offsets from the door are stated once in world space
  //     and apply consistently across faces.
  //
  // Local-coordinate convention (S-face-relative):
  //   +X local = along the wall to one side of the door
  //   +Y local = up (height above ground)
  //   -Z local = outward, away from the building (toward approaching player)
  //   Local origin = at the door's centerline on the wall, on the ground
  //
  // _propAt(alongWall, outward) computes the group's world position:
  //   alongWall: signed offset from door along the wall. Convention is
  //     consistent across faces — positive = "south of door" on E/W
  //     faces, "east of door" on S/N faces (i.e. "+ direction" in world Z
  //     for E/W and world X for S/N). For door-bracket layouts, prop A
  //     gets a positive offset and prop B gets a negative one.
  //   outward: distance from wall outward (always positive). Typical
  //     values: 0.3–0.6 for props that sit close to the wall (anvil,
  //     bench), 0.4–0.5 for props that hang/lean (herb beam, spear rack).
  const doorX = face==='E'?bx+bw : face==='W'?bx : bx+bw/2;
  const doorZ = face==='S'?bz   : face==='N'?bz+bd : bz+bd/2;
  // Group rotation Y: rotates prop's S-face-relative local axes into
  // world axes for the actual face. Derived from "rotate so -Z local
  // points toward where the player approaches."
  const faceRot = face==='S'?0 : face==='N'?Math.PI : face==='E'? -Math.PI/2 : Math.PI/2;
  function _propAt(alongWall, outward){
    let wx, wz;
    if(face==='S'){ wx = doorX + alongWall; wz = doorZ - outward; }
    else if(face==='N'){ wx = doorX + alongWall; wz = doorZ + outward; }
    else if(face==='E'){ wx = doorX + outward; wz = doorZ + alongWall; }
    else { /* W */     wx = doorX - outward; wz = doorZ + alongWall; }
    const grp = new THREE.Group();
    grp.rotation.y = faceRot;
    const py = getY?getY(wx,wz):ty;
    grp.position.set(wx, py, wz);
    return grp;
  }

  if(t==='weapon'){
    // Anvil + barrel beside the door. Local origin at door centerline.
    // Anvil at -alongWall (one side of door), barrel +0.5 farther along.
    // Both sit close to the wall (outward 0.5).
    const grp = _propAt(-bw*0.32, 0.5);  // v61eq: was bz+bd*.3 / bx+bw*.2 — pushed further from door
    sc.add(grp);
    const anvilMat=new THREE.MeshLambertMaterial({color:0x444444});
    const anvilTopMat=new THREE.MeshLambertMaterial({color:0x555555});
    const barrelMat=new THREE.MeshLambertMaterial({color:0x6a4418});
    const anvil=new THREE.Mesh(new THREE.BoxGeometry(.32,.2,.2),anvilMat);
    anvil.position.set(0,.10,0); grp.add(anvil);
    const anvilTop=new THREE.Mesh(new THREE.BoxGeometry(.36,.07,.16),anvilTopMat);
    anvilTop.position.set(0,.23,0); grp.add(anvilTop);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.45,8),barrelMat);
    barrel.position.set(.5,.22,.10); grp.add(barrel);
  } else if(t==='armor'){
    // Spear rack — two posts + horizontal bar + three leaning spears.
    // Local origin at door, rack offset to one side along the wall.
    // Rack is ~0.7 wide along its X axis (parallel to wall).
    const grp = _propAt(-bw*0.32, 0.4);  // v61eq: was bz+bd*.3 — pushed further from door
    sc.add(grp);
    const rackPost=new THREE.Mesh(new THREE.BoxGeometry(.06,1.1,.06),darkWoodMat);
    rackPost.position.set(-.3,.55,0); grp.add(rackPost);
    const rackPost2=new THREE.Mesh(new THREE.BoxGeometry(.06,1.1,.06),darkWoodMat);
    rackPost2.position.set(.4,.55,0); grp.add(rackPost2);
    const rackBar=new THREE.Mesh(new THREE.BoxGeometry(.76,.06,.06),darkWoodMat);
    rackBar.position.set(.05,.9,0); grp.add(rackBar);
    [{x:-.2,lean:-0.22},{x:.05,lean:0},{x:.3,lean:0.18}].forEach(({x:rx,lean})=>{
      const spear=new THREE.Group();
      const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.9,6),new THREE.MeshLambertMaterial({color:0x7a5020}));
      shaft.position.y=.45; spear.add(shaft);
      const tip=new THREE.Mesh(new THREE.ConeGeometry(.04,.14,6),stoneMat);
      tip.position.y=.97; spear.add(tip);
      spear.rotation.z=lean*0.28;
      spear.position.set(rx,0,-.05);
      grp.add(spear);
    });
  } else if(t==='potion'){
    // Hanging herb bunches under a wooden beam. Beam runs ~0.9 wide
    // along its local X axis (parallel to the wall after group rotation).
    // Two posts hold it up at ±0.4 along X.
    const grp = _propAt(-bw*0.32, 0.30);  // v61eq: was bz+bd*.3 / bx+bw*.6 — pushed further from door
    sc.add(grp);
    [-.4, .4].forEach(rx=>{
      const p=new THREE.Mesh(new THREE.BoxGeometry(.06,.7,.06),darkWoodMat);
      p.position.set(rx,.35,0); grp.add(p);
    });
    const beam=new THREE.Mesh(new THREE.BoxGeometry(.9,.05,.05),darkWoodMat);
    beam.position.set(0,.72,0); grp.add(beam);
    [[-.35,0x3a8a28],[0,0x5aaa38],[.35,0x2a7a18]].forEach(([rx,col])=>{
      const str=new THREE.Mesh(new THREE.CylinderGeometry(.005,.005,.2,4),ropeMat);
      str.position.set(rx,.6,0); grp.add(str);
      const bunch=new THREE.Mesh(new THREE.CylinderGeometry(.04,.025,.14,6),new THREE.MeshLambertMaterial({color:col}));
      bunch.position.set(rx,.48,0); grp.add(bunch);
    });
  } else if(t==='misc' || t==='harbor_supplies'){
    // Three crates stacked beside the building. Cluster anchored well
    // clear of the door (alongWall = -bw*.4 — further than the other
    // props because the cluster is wider, ~0.7 along the wall).
    // Crates drift slightly outward (-Z local) as they stack for visual
    // variety; sizes vary (.3 / .25 / .28).
    const grp = _propAt(-bw*0.4, 0.40);  // v61eq: was anchored at building corner; now door-anchored like other props
    sc.add(grp);
    const crateMat=new THREE.MeshLambertMaterial({color:0x7a5a28});
    const slatMat=new THREE.MeshLambertMaterial({color:0x5a3a10});
    [[0,0,.3], [.4,-.3,.25], [.7,-.1,.28]].forEach(([lx,lz,sz])=>{
      const crate=new THREE.Mesh(new THREE.BoxGeometry(sz*1.8,sz*1.4,sz*1.8),crateMat);
      crate.position.set(lx, sz*.7, lz); grp.add(crate);
      const sl=new THREE.Mesh(new THREE.BoxGeometry(sz*1.9,.03,sz*1.9),slatMat);
      sl.position.set(lx, sz*.4, lz); grp.add(sl);
    });
  } else if(t==='harbor_office'){
    // Weather pole with vane + rope coil. Pole stands tall, vane at top
    // runs along X (parallel to wall after rotation). Rope coil at base.
    const grp = _propAt(-bw*0.32, 0.45);  // v61eq: was cz / bx+bw*.4 — consistent placement
    sc.add(grp);
    const pole=new THREE.Mesh(new THREE.BoxGeometry(.06,2.2,.06),darkWoodMat);
    pole.position.set(0, 1.1, 0); grp.add(pole);
    const xarm=new THREE.Mesh(new THREE.BoxGeometry(.45,.05,.05),darkWoodMat);
    xarm.position.set(0, 2.18, 0); grp.add(xarm);
    const vaneMat=new THREE.MeshLambertMaterial({color:0x484848});
    const vane=new THREE.Mesh(new THREE.BoxGeometry(.40,.18,.04),vaneMat);
    vane.position.set(0, 2.30, 0); grp.add(vane);
    const tail=new THREE.Mesh(new THREE.BoxGeometry(.18,.08,.04),vaneMat);
    tail.position.set(-.20, 2.30, 0); grp.add(tail);
    const ropeC=new THREE.Mesh(new THREE.TorusGeometry(.20,.045,4,10),ropeMat);
    ropeC.rotation.x=Math.PI/2;
    ropeC.position.set(0, .18, -.30);  // -Z local = outward (in front of pole)
    grp.add(ropeC);
  } else if(t==='inn'){
    // Bench on one side of door + barrel on the other. Bracket pattern:
    // bench at +alongWall, barrel at -alongWall — props on either side.
    // Bench's long axis is along its local X (= along the wall).
    const benchMat=new THREE.MeshLambertMaterial({color:0x6a4818});
    const benchLegMat=new THREE.MeshLambertMaterial({color:0x5a3a10});
    const benchGrp = _propAt(bw*0.20, 0.40);  // v61eq: was bx+bw*.7 — bench right of door
    sc.add(benchGrp);
    const benchSeat=new THREE.Mesh(new THREE.BoxGeometry(.9,.06,.22),benchMat);
    benchSeat.position.set(0,.32,0); benchGrp.add(benchSeat);
    [-0.35, 0.35].forEach(off=>{
      const leg=new THREE.Mesh(new THREE.BoxGeometry(.06,.32,.18),benchLegMat);
      leg.position.set(off,.16,0); benchGrp.add(leg);
    });
    const barrelGrp = _propAt(-bw*0.25, 0.5);  // v61eq: was bx+bw*.25 — barrel left of door
    sc.add(barrelGrp);
    const barrelMat=new THREE.MeshLambertMaterial({color:0x6a4418});
    const hoopMat=new THREE.MeshLambertMaterial({color:0x3a2010});
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.50,10),barrelMat);
    barrel.position.set(0,.25,0); barrelGrp.add(barrel);
    [.10, .40].forEach(hy=>{
      const hoop=new THREE.Mesh(new THREE.TorusGeometry(.25,.025,4,8),hoopMat);
      hoop.rotation.x=Math.PI/2;
      hoop.position.set(0, hy, 0);
      barrelGrp.add(hoop);
    });
  }
  // type:'church' is handled by buildVillage's church branch — skip here
  // (the buildVillage caller doesn't invoke decorateFn for churches anyway).
}


// ══════════════════════════════════════════════════════════════
// HEARTHWICK (v61) — inn-village waypoint on An Bealach Mór
// ══════════════════════════════════════════════════════════════
// Small settlement. One inn (Oda's), two gates (south to Bealach-South,
// north to the Deepwood). No dungeon portals, no church. Designed as a
// breathing-point between Ashenmoor and Ironhaven now that the direct
// Ashenmoor↔Deepwood edge has been split up the road chain.

const HEARTHWICK_NPC_DEFS = [
  {x:32, z:28, name:'Oda', role:'Innkeeper', ico:'🍲', bCol:0x6a3a18, sCol:0xc09868,
    greeting:[
      "Welcome to Hearthwick, stranger. Get out of the road and have a sit.",
      "Through the door — fire's already going. You look road-worn.",
      "Bealach's quiet today. Come in before whatever changes that catches up.",
    ],
    topics:[
      {label:'Tell me about Hearthwick.', response:"A waypoint. That's all we ever meant to be. Twelve people now, counting me. The road comes up from Ashenmoor and carries on to the Thorngate — we're the halfway point where mules stop pretending they're still walking.",
        follow:[
          {label:'Why stay, then?', response:"Someone has to feed the travelers. And the road's easier than the forest on either side. Ironhaven pays in coin, Ashenmoor pays in gossip. Both spend well enough at my bar."}
        ]},
      {label:'Heard any news from the road?', response:"Bealach's been easy lately — a few wolves down near the south bend, nothing a careful walker can't skirt. The Deepwood's a different animal. Trolls pushing further south than they used to. Be warned when you head that way.",
        follow:[
          {label:'Anything from Ashenmoor?', response:"Word is the gates there are getting hotter. Two adventurers came through last week heading south, none came back. That's not proof of anything — maybe they took the coastal road. But it's the kind of non-proof I don't love."}
        ]},
      {label:'Step inside — browse your wares.', trade:true},
      {label:'Goodbye.', bye:true},
    ]},
];

// Oda shop stock — inn-type (hot stew, potions, torch)
const _ODA_STOCK = [
  {name:'Hot Stew',       ico:'🥣',type:'potion',heal:35,                buyPrice:14,sellMult:.3,weight:.4},
  {name:'Mulled Cider',   ico:'🍺',type:'potion',heal:0,stam:30,mana:10, buyPrice:18,sellMult:.3,weight:.5},
  {name:'Health Potion',  ico:'🧪',type:'potion',heal:25,                buyPrice:18,sellMult:.4},
  {name:'Stamina Draught',ico:'🥤',type:'potion',stam:40,                buyPrice:22,sellMult:.5},
  {name:'Road Rations',   ico:'🥖',type:'potion',heal:12,stam:15,        buyPrice:10,sellMult:.3,weight:.3},
  {name:'Torch',          ico:'🔦',type:'equip',slot:'offhand',torchType:'torch',def:0,buyPrice:8,sellMult:.3,tier:1,material:'Wooden',matCol:0x6a3e12},
];

const HEARTHWICK_HOUSES = [
  {id:'hw0', doorX:32, doorZ:21.95, doorFace:'S', name:"Oda's Inn",
    keeper:'Oda', type:'inn',
    tagline:'"Warm fire, warm stew, warm stories."',
    bCol:0x7a4818, sCol:0xc0a868},
];

const HEARTHWICK_CONFIG = {
  id:'hearthwick', name:'Hearthwick', musicTrack:'village',
  size:HEARTHWICK_SIZE, seed:4411,
  terrainAmp:1.6, flatR:22, hillR:34,
  skyCol:0x9ed4f0, fogColor:0xc0d8b0, fogDensity:.009,
  centerX:30, centerZ:30, villageR:22,
  gateArr:HEARTHWICK_GATES,
  npcDefs:HEARTHWICK_NPC_DEFS,
  // v61c: gate targets now align with compass convention (-Z=north).
  // Low-Z gate (north side of Hearthwick) leads to the north-map neighbor
  // (Deepwood). High-Z gate (south side) leads to the south-map neighbor
  // (Bealach → Ashenmoor).
  // v61ec: gate alignment with locked grid map. Hearthwick now has three
  // gates aligned to compass walls: W → West Track (was on Ashenmoor's
  // perimeter pre-v61ec), E → Bealach Central → Droichead, S → Bealach
  // South → Ashenmoor. NO north gate — the previous Hearthwick→Thorngate
  // route is removed per design call (Path is Hearthwick→Droichead→Thorngate now).
  //
  // v61ee: COMMISSION LOCK MOVED. Per design call (Session 31): the
  // Act II coastal arc (Salthaven, Carraig Mór, Inis Rua) is the gated
  // network — locking the West Track gates that arc behind Q7. The
  // Bealach Central gate (east, to Droichead → Thorngate → Ironhaven)
  // is the ACT I MAIN PATH and must be unlocked from the start, since
  // Q7 turn-in happens at Aldwyn IN Ironhaven (circular dependency
  // otherwise).
  gates:[
    // v61en: W-gate spawnYaw fixed (was π/2 / E, now -π/2 / W). Player
    // arrives in west_track at x:75 (near E edge of size-80 corridor) and
    // must face west to walk the track toward Salthaven, not east back at
    // Hearthwick's W wall. Same yaw-convention slip pattern as v61ej/v61ek/
    // v61em (convention: 0=N, π=S, π/2=E, -π/2=W).
    {x:1.5, z:30,                   targetZone:'west_track',
     spawnX:75, spawnZ:30, spawnYaw:-Math.PI/2,   label:'The West Track',
     guard:'commission'}, // v61ee: gates the coastal arc (Salthaven, Carraig Mór, Inis Rua)
    {x:30, z:HEARTHWICK_SIZE-3,    targetZone:'bealach_south',
     spawnX:100, spawnZ:8, spawnYaw:Math.PI,      label:'An Bealach Mór — South'},
    {x:HEARTHWICK_SIZE-3, z:30,    targetZone:'bealach_central',
     spawnX:8, spawnZ:100, spawnYaw:-Math.PI/2,    label:'An Bealach Mór — Central'},
  ],
  buildings:[
    {x:29, z:22, w:6, d:5, face:'S', houseId:'hw0'}, // Oda's Inn
  ],
  noticeBoardX:30, noticeBoardZ:36,
  noticeBoardTitle:'Hearthwick — Wayfarer\'s Notice',
  noticeBoardText:`Hearthwick: a waypoint on An Bealach Mór, halfway between Ashenmoor to the south and the Thorngate to the north. Twelve permanent residents. One inn. No forge, no healer — carry your own.\n\nNotices for travellers:\n  • The Deepwood has been busier than usual. Hire company if you can, daylight if you can't.\n  • The south bend of the Bealach has a wolf pair. They keep their distance from the road in daylight.\n  • Oda's beds are two coppers. Her stew is worth three. She charges five for both. That is the arithmetic of Hearthwick.`,
  // Sparse plains-adjacent herbs
  herbSpawns:[
    {x:12, z:18, type:'goldenrod'}, {x:48, z:15, type:'goldenrod'},
    {x:20, z:45, type:'silverleaf'},{x:45, z:50, type:'silverleaf'},
    {x:14, z:38, type:'ashwort'},   {x:50, z:28, type:'ashwort'},
    {x:42, z:42, type:'thornberry'},{x:10, z:28, type:'thornberry'},
  ],
  herbs:HEARTHWICK_HERBS,
  // No dungeonZone — no portals. buildVillage's WORLD_DUNGEONS filter returns []
};

function buildHearthwick(){
  // Wire cfg to module globals before build (same pattern as buildOW does for Ashenmoor)
  HEARTHWICK_CONFIG.sol   = HEARTHWICK_SOL;
  HEARTHWICK_CONFIG.npcs  = HEARTHWICK_NPCS;
  HEARTHWICK_CONFIG.herbs = HEARTHWICK_HERBS;
  // Bounds-check: Hearthwick has no dungeon portals (dungeonZone omitted).
  // v61: buildVillage now guards its PORTALS-clobber on cfg.dungeonZone, so
  // the init sequence doesn't overwrite Ashenmoor's portals while building here.
  hearthwickScene = buildVillage(HEARTHWICK_CONFIG);
  // Expose terrain sampler for activeTerrainH's hearthwick branch
  if(ZONES.hearthwick){
    ZONES.hearthwick.herbs = HEARTHWICK_HERBS;
    ZONES.hearthwick.getY  = HEARTHWICK_CONFIG.getY;
    // v61e2: attach houses array so the c.trade resolver's keeper-lookup
    // fall-through (line ~4827) can resolve Oda when an outdoor trade:true
    // topic fires with currentHouse===null. The hardcoded HEARTHWICK_HOUSES
    // branches at the interact + prompt sites stay unchanged — this is
    // additive, not a refactor.
    ZONES.hearthwick.houses = HEARTHWICK_HOUSES;
  }
}

// ══════════════════════════════════════════════════════════════
// BEALACH-SOUTH (v61) — plains-biome wilderness
// ══════════════════════════════════════════════════════════════
// 200×200 plains zone linking Ashenmoor (south end) and Hearthwick (north end).
// Lightly patrolled — wolves and the occasional bandit. Open terrain with
// a clear cardinal path; the first time the player sees the horizon.

const BEALACH_SOUTH_CONFIG = {
  id:'bealach_south', name:'An Bealach Mór — South', musicTrack:'overworld',
  biome:'plains', size:BEALACH_SOUTH_SIZE, seed:6612,
  region:'bealach', // v61e7 — align with placeholder Bealach zones for day/night night palette derivation
  terrainAmpMul:2.5, // v61f: rolling plains, visible height variance
  // v61g: discrete hills flanking the road — gives the player something to
  // walk PAST rather than just through. Hills attenuate near the path via
  // flatFactor so the road stays walkable. Radii ~20-30u, heights 3-5u.
  hills:[
    {x:55,  z:55,  r:26, h:4.5}, // west flank, lower road
    {x:145, z:75,  r:28, h:5.0}, // east flank, mid road
    {x:50,  z:110, r:22, h:3.5}, // west flank, mid road
    {x:150, z:145, r:30, h:5.5}, // east flank, upper road (biggest)
    {x:60,  z:180, r:24, h:4.0}, // west flank, near Ashenmoor approach
  ],
  // Path runs north-south through the middle with a gentle western bow
  pathWaypoints:[
    {x:100, z:5},
    {x:100, z:40},
    {x:88,  z:80},
    {x:88,  z:130},
    {x:100, z:170},
    {x:100, z:BEALACH_SOUTH_SIZE-5},
  ],
  // Two gates: south→Ashenmoor, north→Hearthwick
  // v61c: low-Z (north-compass) → Hearthwick (north-map neighbor).
  //       high-Z (south-compass) → Ashenmoor (south-map neighbor).
  gates:[
    {x:100, z:3,                          targetZone:'hearthwick',
     spawnX:30, spawnZ:50,  spawnYaw:0,       label:'Hearthwick'},
    {x:100, z:BEALACH_SOUTH_SIZE-3,      targetZone:'overworld',
     spawnX:60, spawnZ:8,   spawnYaw:Math.PI, label:'Ashenmoor'},
  ],
  // Lighter enemy roster than Deepwood — wolves + bandits only
  enemies:[
    {name:'Wolf',   pos:[[70,60],[130,90],[80,120],[125,150]]},
    {name:'Bandit', pos:[[110,110],[70,160]]},
  ],
  herbSpawns:[
    // Plains herbs — goldenrod, thornberry, briarweed, wolfsbane
    {x:60,  z:30,  type:'goldenrod'}, {x:140, z:50,  type:'goldenrod'},
    {x:75,  z:100, type:'goldenrod'}, {x:130, z:140, type:'goldenrod'},
    {x:60,  z:170, type:'goldenrod'},
    {x:130, z:25,  type:'thornberry'},{x:55,  z:75,  type:'thornberry'},
    {x:140, z:115, type:'thornberry'},{x:75,  z:175, type:'thornberry'},
    {x:70,  z:50,  type:'briarweed'}, {x:135, z:80,  type:'briarweed'},
    {x:65,  z:140, type:'briarweed'}, {x:140, z:180, type:'briarweed'},
    {x:120, z:60,  type:'wolfsbane'}, {x:70,  z:130, type:'wolfsbane'},
    {x:145, z:165, type:'wolfsbane'},
    {x:50,  z:90,  type:'ashwort'},   {x:150, z:100, type:'ashwort'},
    // v61f: path-side clusters so the player harvests as they walk the road,
    // not only by detouring into the hills. Positions just outside the flat
    // path corridor (~6u wide) so they're visible from the road.
    {x:108, z:20,  type:'goldenrod'}, {x:93,  z:55,  type:'thornberry'},
    {x:107, z:70,  type:'briarweed'}, {x:81,  z:95,  type:'goldenrod'},
    {x:95,  z:120, type:'thornberry'},{x:82,  z:145, type:'wolfsbane'},
    {x:107, z:160, type:'briarweed'}, {x:93,  z:185, type:'goldenrod'},
  ],
  portalZone:null,
  sol:BEALACH_SOUTH_SOL, gateArr:BEALACH_SOUTH_GATES,
  enemiesArr:BEALACH_SOUTH_ZE, herbsArr:BEALACH_SOUTH_HERBS,
};

function buildBealachSouth(){
  buildWildernessZone(BEALACH_SOUTH_CONFIG);
  bealachSouthScene = BEALACH_SOUTH_CONFIG.scene;
  _bealachSouthTerrainH = BEALACH_SOUTH_CONFIG.getY;
}

function buildOW(){
  // Wire Ashenmoor-specific arrays into config before building
  ASHENMOOR_CONFIG.sol   = OW_SOL;
  ASHENMOOR_CONFIG.npcs  = OW_NPCS;
  ASHENMOOR_CONFIG.herbs = OW_HERBS;

  // Handcrafted detail hook — paths, signs, windows, decorations
  ASHENMOOR_CONFIG.detailFn = function(sc, sol, getY){
  // ── DIRT PATHS ────────────────────────────────────────────────────────────
  const pathTex=mkTex((x,w,h)=>{
    x.fillStyle='#8a6a40';x.fillRect(0,0,w,h);
    for(let i=0;i<300;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.18})`;x.fillRect(Math.random()*w,Math.random()*h,Math.random()*5+1,Math.random()*3+1);}
    for(let i=0;i<80;i++){x.fillStyle=`rgba(255,220,140,${Math.random()*.12})`;x.fillRect(Math.random()*w,Math.random()*h,Math.random()*4+1,Math.random()*2+1);}
  });
  pathTex.repeat.set(3,3);
  const pathMat=new THREE.MeshLambertMaterial({map:pathTex});

  function mkPath(x1,z1,x2,z2,w){
    const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz);if(len<0.1)return;
    const cx=(x1+x2)/2,cz=(z1+z2)/2,ang=Math.atan2(dx,dz);
    const p=new THREE.Mesh(new THREE.PlaneGeometry(w,len),pathMat);
    p.rotation.x=-Math.PI/2;p.rotation.z=ang;p.position.set(cx,.005,cz);sc.add(p);
  }
  function mkPatch(x,z,r){
    const p=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.01,16),pathMat);
    p.position.set(x,.004,z);sc.add(p);
  }

  // Central plaza (clear of all buildings)
  mkPatch(32,32,3.5);

  // ── Path to Bram's Forge (h0: x=6–11, door now on EAST face at x=11,z=8) ──
  // Route: plaza west → turn north → arrive at east face door
  mkPath(32,32, 29,32, 1.3);   // plaza west
  mkPath(29,32, 29,25, 1.3);   // north along x=12 (just east of building)
  mkPath(29,25, 28.1,25, 1.2);   // short west to east-face door
  mkPatch(29,32,1.0);
  mkPatch(29,25, 1.0);

  // ── Path to Mira's Apothecary (h1: x=17–21, door now on WEST face at x=17,z=7) ──
  // Route: plaza northwest directly to west-face door
  mkPath(32,32, 32,27, 1.3);   // plaza north
  mkPath(32,27, 32,24, 1.2);   // continue north
  mkPath(32,24, 33.9,24, 1.2);   // short east to west-face door
  mkPatch(32,27,1.0);
  mkPatch(32,24, 1.0);

  // ── Path to Barnaby's Goods (h2: x=5–10, z=20–23, door south face z=20) ──
  // Route: plaza → southwest → run south along x=12 → west along z=19.5 → door
  mkPath(32,32, 29,34, 1.3);   // southwest from plaza
  mkPath(29,34, 29,37, 1.2);   // south along x=12
  mkPath(29,37, 24.5,37, 1.2);   // west along z=20 to door (south face of building)
  mkPatch(29,37,1.1);

  // ── Path to Guardhouse (h3: x=19–25, z=27–32, door south face z=27) ──
  // Route: plaza → south along x=20 → south to z=26 → east to door front
  mkPath(32,32, 37,34, 1.3);   // southeast from plaza
  mkPath(37,34, 37,43, 1.3);   // south along x=20 (west of building x=19)
  mkPath(37,43, 39,43, 1.3);   // east along z=26 (just in front of south face z=27)
  mkPath(39,43, 39,44, 1.1);   // short approach to door
  mkPatch(37,43,1.2);

  // ── Eastern spur junction ────────────────────────────────────────────────
  mkPath(37,43, 52,43, 1.3);   // east road along z=26 toward eastern buildings
  mkPatch(52,43,1.4);

  // ── Path to Pip's Curiosities (h4: x=44–48, z=28–32, door south face z=28) ──
  mkPath(52,43, 61,43, 1.2);   // east along z=26
  mkPath(61,43, 63,43, 1.2);   // approach east
  mkPath(63,43, 63,45, 1.2);   // south to door
  mkPatch(63,43,1.0);

  // ── Path to Old Cottage (h5: x=37–41, z=41–44, door south face z=41) ──
  mkPath(52,43, 52,55, 1.2);   // south along x=35 (west of building x=37)
  mkPath(52,55, 56,55, 1.2);   // east along z=38
  mkPath(56,55, 56,58, 1.2);   // south to door
  mkPatch(52,55,1.0);
  mkPatch(56,55,1.0);

  // ── Stone boundary markers along main road ───────────────────────────────
  [[29,29],[35,29],[29,35],[35,35]].forEach(([mx,mz])=>{
    const stone=new THREE.Mesh(new THREE.BoxGeometry(.2+Math.random()*.1,.18+Math.random()*.1,.2+Math.random()*.1),new THREE.MeshLambertMaterial({color:0x888070}));
    stone.position.set(mx,.09,mz);stone.rotation.y=Math.random()*Math.PI;sc.add(stone);
  });

  // ── Flower patches along paths ────────────────────────────────────────────
  // Small colourful dots at y=0.04 near path edges
  const flowerColors=[0xff4466,0xffaa22,0xffffff,0xaa44ff,0x44ffaa];
  [[28,27],[30,34],[33,28],[34,33],[26,32],[39,37],[50,43],[53,54]].forEach(([fx,fz])=>{
    for(let f=0;f<4;f++){
      const col=flowerColors[Math.floor(Math.random()*flowerColors.length)];
      const stem=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,.12,4),new THREE.MeshLambertMaterial({color:0x2a6a18}));
      const ox=(Math.random()-.5)*.6,oz=(Math.random()-.5)*.6;
      stem.position.set(fx+ox,.06,fz+oz);sc.add(stem);
      const bloom=new THREE.Mesh(new THREE.SphereGeometry(.06,5,4),new THREE.MeshLambertMaterial({color:col}));
      bloom.position.set(fx+ox,.16,fz+oz);sc.add(bloom);
    }
  });


  }; // end detailFn

  // Build via village system
  owScene = buildVillage(ASHENMOOR_CONFIG);

  // Wire terrain globals so getTerrainHeight() keeps working
  _terrainHeights = ASHENMOOR_CONFIG._heights;
  _terrainSize    = OW;
}

// ── v61ad: BURNED ASHENMOOR ─────────────────────────────────────────────────
// Post-Act-I variant. Same zone id, same gates, same terrain — but every
// building is charred, the notice board reads as a grieving record rather than
// a village record, the outdoor NPCs are gone (fled to Ironhaven), and the only
// remaining inhabitant is Edna, who is inside her damaged cottage and will
// hand the player Q7 when spoken to.
//
// Architecture note: this builder is invoked lazily the first time the player
// re-enters overworld AFTER the burn fires. _syncAshenmoorZoneEntry() rewires
// ZONE_BUILDERS.overworld to call this and return owBurnedScene instead of
// owScene. The reused zone id ('overworld') keeps save-load, fast travel, and
// quest routing intact — only the visible scene and npcs/sol/portals differ.

// Burned-variant building arrays — same coords/sizes as ASHENMOOR_CONFIG.buildings
// with `charred: 'destroyed'|'damaged'` flags driving the buildVillage branch.
// Keep Edna's cottage (h5) as 'damaged' so the interior entry path still works.
// Church (h6) kept as 'church' + charred='damaged' so the oratory reads as
// partially-damaged-but-standing (it's stone, it's older than everything else).
const ASHENMOOR_BURNED_BUILDINGS = [
  {x:23,z:23,w:5,d:4,face:'E', houseId:'h0', charred:'destroyed'},
  {x:34,z:22,w:4,d:4,face:'W', houseId:'h1', charred:'destroyed'},
  {x:22,z:37,w:5,d:3,face:'S', houseId:'h2', charred:'destroyed'},
  {x:36,z:44,w:6,d:5,face:'S', houseId:'h3', charred:'destroyed'},
  {x:61,z:45,w:4,d:4,face:'S', houseId:'h4', charred:'destroyed'},
  {x:54,z:58,w:4,d:3,face:'S', houseId:'h5', charred:'damaged'},
  // v61ae: church (h6) is now damaged-variant — stone body still standing,
  // surfaces darkened, scorch streaks on the walls, cracked lancet window,
  // thin residual smoke wisp on the roof, dim single-candle interior glow.
  // The cross stays bright. Brother Oswin is inside, alive but shaken.
  // _buildChurchExterior is aware of h.charred and handles this internally.
  {x:55,z:22,w:6,d:8,face:'S', houseId:'h6', type:'church', charred:'damaged'},
];

const ASHENMOOR_BURNED_CONFIG = {
  id:'overworld', name:'Ashenmoor — Ruins', musicTrack:'burned',
  size:OW, seed:7331, terrainAmp:3.2, flatR:48, hillR:70,
  // Duskier sky, ash-grey fog, denser so the far edges of the map fade out.
  skyCol:0x4a4238, fogColor:0x3a342e, fogDensity:.028,
  centerX:44, centerZ:42, villageR:48,
  gateArr:ASHENMOOR_GATES, // Reuses the original gate array — gates themselves are unchanged
  gates:[
    {x:60,  z:1.5,      targetZone:'bealach_south', spawnX:100, spawnZ:192, spawnYaw:0,            label:'An Bealach Mór — South'},
    {x:60,  z:OW-1.5,   targetZone:'south_road',    spawnX:40,  spawnZ:7,   spawnYaw:Math.PI,      label:'South Road'},
    // v61ec: West Track moved to Hearthwick — kept in sync with regular Ashenmoor.
  ],
  buildings:ASHENMOOR_BURNED_BUILDINGS,
  noticeBoardX:30.7, noticeBoardZ:30,
  noticeBoardTitle:'Ashenmoor — Record of the Burning',
  noticeBoardText:`Written in a hand not of this village. The paper is still warm.\n\nFORTY-ONE souls at dawn. Counted at dusk: fourteen, most east-bound to Ironhaven. Lost at the burning: Bram of the Forge, three Atherton children, four of the Glenn family, old Humphrey's widow, and two travelers whose names we did not record.\n\nThe forge is gone. Bram died defending it. He was the last of his family and the first of this village.\n\nEdna is wounded and will not be moved. She says the work is not yet done.\n\n— E.`,
  dungeonZone:'overworld',
  herbSpawns:[], // No herbs; the ground is scorched
  // No outdoor NPCs — Corwin, Mira, Barnaby, Sera, Tom, Finn, Pip, Brother Oswin
  // all fled east or fell in the attack. Only Edna remains, and she is inside.
  npcDefs:[],
};

// Burned variant of buildOW. Reuses the base buildVillage pipeline; the scene
// we set here (owBurnedScene) is what ZONE_BUILDERS.overworld returns once the
// worldState.ashenmoorBurned flag is set.
function buildAshenmoorBurned(){
  // Handcrafted detail hook — much lighter than the original buildOW detailFn.
  // No paths (grass is scorched), no herb-spawn decorations, no shop signs
  // (the shops are gone). We do add a few environmental storytelling beats:
  // rising smoke columns at the destroyed buildings, scorch marks on the
  // central plaza, Bram's body south of the forge.
  ASHENMOOR_BURNED_CONFIG.detailFn = function(sc, sol, getY){
    // ── Smoke columns at each destroyed building ──────────────────────────
    // v61ae: animated. Each slab gets a per-instance phase offset, a base
    // position captured at build time, and a `userData.smokeBase` marker so
    // the per-frame tick can sway it. The tick (see tickBurnedSmoke) drifts
    // each slab on X/Z via sine with the phase, rotates around Y slowly, and
    // cycles opacity gently. Registered via _burnedSmokeMeshes so we don't
    // have to scan the full scene graph.
    const smokeMat = new THREE.MeshLambertMaterial({color:0x4a4440, transparent:true, opacity:0.45});
    // Each destroyed building plume uses its own material clone so opacity
    // cycling on one plume doesn't flicker all of them in lockstep.
    ASHENMOOR_BURNED_BUILDINGS.filter(b=>b.charred==='destroyed').forEach((b,bi)=>{
      const cx=b.x+b.w/2, cz=b.z+b.d/2;
      const ty=getY(cx,cz);
      const plumeMat = smokeMat.clone();
      // Tapered smoke: stack of 4 progressively wider, thinner slabs rising up.
      // Each slab gets a phase offset so they sway out-of-phase — the column
      // as a whole looks alive, not rigid.
      for(let s=0;s<4;s++){
        const ry = 1.5 + s*2.2;
        const rad = 0.6 + s*0.45;
        const slab = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad*0.8, 1.5, 8, 1, true), plumeMat);
        const bx = cx + s*0.15, bz = cz + s*0.12;
        slab.position.set(bx, ty+ry, bz);
        // userData carries the tick's reference frame — base position + phase
        // + per-height sway amplitude (higher slabs sway further).
        slab.userData.smokeBase = {
          bx, bz, by:ty+ry,
          phase: bi*0.9 + s*1.3,      // bi+s unique phase
          swayAmp: 0.08 + s*0.06,      // top slab swings widest
          rotSpeed: 0.10 + s*0.04,     // top slab rotates fastest
        };
        sc.add(slab);
        _burnedSmokeMeshes.push(slab);
      }
      // Register the shared material so opacity cycling can target it.
      _burnedSmokeMaterials.push(plumeMat);
    });

    // ── Village-wide charred ground (v61af redo) ──────────────────────────
    // Previous approach used layered transparent concentric discs + ember
    // accents. Transparent discs at slightly different heights z-fought each
    // other and produced a wavy distortion effect that changed with view
    // angle. The ember accents read as UI glitches in practice.
    //
    // Replaced with opaque single-layer geometry:
    //   - ONE large brown-dead-ground disc covering the whole village
    //     footprint at a single height. Opaque; no z-fighting possible.
    //     Color is a muted brown-grey (between dead grass and dirt) — reads
    //     as "nothing grows here anymore" without shouting fire.
    //   - Opaque BLACK patches directly around each destroyed building,
    //     at a slightly higher height. Pure black; hard-edged; explicitly
    //     says "the fire was worst here."
    // Both layers are opaque MeshLambertMaterial, not transparent. Outer
    // grass shows through at the edges of the main brown disc because the
    // disc is radially bounded, not full-map.
    const deadGroundMat = new THREE.MeshLambertMaterial({color:0x5a4a38}); // brown-grey dead earth
    const blackCharMat  = new THREE.MeshLambertMaterial({color:0x1a1410}); // near-pure black

    // Main dead-ground disc — covers the village footprint. Centered roughly
    // on the plaza (32,32) but large enough to reach Edna's cottage SE and
    // the forge NW. Single disc = zero z-fighting.
    const deadCenterX = 38, deadCenterZ = 38, deadR = 28;
    const mainGround = new THREE.Mesh(new THREE.CylinderGeometry(deadR, deadR, 0.02, 32), deadGroundMat);
    mainGround.position.set(deadCenterX, getY(deadCenterX,deadCenterZ)+0.008, deadCenterZ);
    sc.add(mainGround);

    // Pip's curiosities (h4) is at (63,45) — too far east to reach from the
    // main disc. Its own smaller dead-ground disc, positioned so the edges
    // of the two discs don't overlap (distance between centers > r1+r2).
    const pipDisc = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.02, 20), deadGroundMat);
    pipDisc.position.set(63, getY(63,45)+0.008, 45);
    sc.add(pipDisc);

    // Black char patches — one directly under each DESTROYED building's
    // footprint.
    //
    // v61aj: grown from 0.85x to 1.4x footprint. The wall stubs, debris pile,
    // and ash mound on destroyed buildings visually extend PAST the original
    // building footprint (stubs sit at perimeter; debris fans outward). The
    // 0.85x patch from v61af was smaller than the visible ruin, so the black
    // scorch was mostly hidden UNDER the rubble instead of framing it. 1.4x
    // ensures the char reads as a burn zone that extends beyond where the
    // building walls used to be — the fire damaged the ground around, not
    // just under.
    //
    // Slightly above the dead-ground disc so they paint cleanly on top.
    ASHENMOOR_BURNED_BUILDINGS.filter(b=>b.charred==='destroyed').forEach(b=>{
      const cx=b.x+b.w/2, cz=b.z+b.d/2;
      const ty=getY(cx,cz);
      // Rectangular patch that extends past the visible ruin (1.4x footprint).
      const patch=new THREE.Mesh(new THREE.BoxGeometry(b.w*1.4, 0.018, b.d*1.4), blackCharMat);
      patch.position.set(cx, ty+0.018, cz);
      sc.add(patch);
    });

    // Two additional black patches at high-fire-intensity plaza points that
    // aren't directly under buildings. Keeps the village center reading as
    // "this was the worst of it" without implying there were buildings there.
    [[32,32,4.0,3.0], [39,40,2.5,2.5]].forEach(([px,pz,pw,pd])=>{
      const ty=getY(px,pz);
      const patch=new THREE.Mesh(new THREE.BoxGeometry(pw, 0.018, pd), blackCharMat);
      patch.position.set(px, ty+0.018, pz);
      sc.add(patch);
    });

    // ── Bram's body — a few steps south of the forge (h0) ──────────────────
    // The forge is at x:23,z:23,w:5,d:4, face:'E'. "A few steps south" means
    // a meter or two past the south wall, where Bram would have made his last
    // stand defending the shop's south approach. He's lying prone, weapon
    // still in hand. Interactable via ZONE_CORPSES with flavor text on first E
    // and then loot panel to take The Forge-Man's Hammer.
    const bramX = 25.5, bramZ = 21.5; // south of forge (h0 is at 23-28 on x, 23-27 on z)
    const bramY = getY(bramX, bramZ);

    buildBramBody(sc,bramX,bramY,bramZ,'overworld'); // S270 — the same body in the world's Ashenmoor

    // ── Scatter a few small props around the body so it reads as a fight ──
    // Broken helmet, spent torch, an arrow stuck in the ground. Pure dress.
    const brokenHelm = new THREE.Mesh(new THREE.SphereGeometry(0.14,8,6,0,Math.PI*2,0,Math.PI/2),
      new THREE.MeshLambertMaterial({color:0x3a3638}));
    brokenHelm.position.set(bramX-1.2, bramY+0.07, bramZ+0.8);
    brokenHelm.rotation.z = 0.4;
    sc.add(brokenHelm);

    const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,0.5,5),
      new THREE.MeshLambertMaterial({color:0x6a4828}));
    arrow.position.set(bramX+0.9, bramY+0.2, bramZ-0.6);
    arrow.rotation.x = 0.4;
    arrow.rotation.z = 0.6;
    sc.add(arrow);
  }; // end burned detailFn

  // v61ae: **critical fix** — sol MUST point at the same OW_SOL array that
  // owSolid() reads from. Previously wired a fresh [] which meant the burned
  // build populated a detached array, and owSolid kept reading PRISTINE
  // village colliders — so the player was bumping into invisible walls where
  // the original buildings stood (including Edna's cottage, which became
  // unreachable because the original h5 collider extended past its door
  // position). Clearing OW_SOL in-place (not reassigning) preserves references
  // held by ASHENMOOR_CONFIG.sol in case we ever unburn.
  OW_SOL.length = 0;
  ASHENMOOR_BURNED_CONFIG.sol   = OW_SOL;
  ASHENMOOR_BURNED_CONFIG.npcs  = [];
  ASHENMOOR_BURNED_CONFIG.herbs = [];

  const burnedScene = buildVillage(ASHENMOOR_BURNED_CONFIG);
  // v61e7 — lock the burn's lighting. Lore demands the burned Ashenmoor
  // reads as an unchanging tomb ("scorched ground, ambient silence").
  // Day/night cycles would undermine the morning-after frame. The clock
  // still ticks globally — only the visuals stay frozen at the dawn
  // palette forceTime('dawn') sets at the burn trigger.
  if(burnedScene.userData && burnedScene.userData.dayNight){
    burnedScene.userData.dayNight.isLocked = true;
  }
  return burnedScene;
}

// v61ad: called whenever worldState.ashenmoorBurned changes. Rewires
// ZONE_BUILDERS.overworld so sceneGet(), displayName, musicTrack, and builder
// all reflect the current burn state. Safe to call multiple times (idempotent).
// Also called once at startup after worldState defaults, and again from
// _applyLoadData after a save is loaded.
function _syncAshenmoorZoneEntry(){
  if(!ZONE_BUILDERS.overworld) return;
  const b = !!worldState.ashenmoorBurned;
  ZONE_BUILDERS.overworld.sceneGet   = b ? (()=>owBurnedScene) : (()=>owScene);
  ZONE_BUILDERS.overworld.displayName = b ? '🔥 Ashenmoor — Ruins' : '🌿 Village of Ashenmoor';
  // v61c8 — Music: burned Ashenmoor now plays a procedural ambient track
  // (`_musicBurned`) — three low drones, sparse keening tones, occasional
  // wind-through-ash noise gusts. Replaces the prior 'silent' fallback,
  // which felt right for the shock of arrival but became a dead audio
  // hole during the boss fight and exploration. The atmosphere is still
  // mournful — just no longer mute.
  ZONE_BUILDERS.overworld.musicTrack = b ? 'burned' : 'village';
  // Builder: when burned, lazy-build owBurnedScene on first call. When not
  // burned, no-op (owScene is eagerly built at startup).
  ZONE_BUILDERS.overworld.builder = b
    ? (()=>{ if(!owBurnedScene) owBurnedScene = buildAshenmoorBurned(); return owBurnedScene; })
    : null;
}

function owSolid(x,z){const R=0.3;if(x<R||x>OW-R||z<R||z>OW-R)return true;for(const s of OW_SOL)if(Math.abs(x-s.cx)<s.rx+R&&Math.abs(z-s.cz)<s.rz+R)return true;return false;}

// ── ZONE GATE HELPERS ─────────────────────────────────────────
// (v61: gate arrays — ASHENMOOR_GATES, FOREST_GATES, IRONHAVEN_GATES,
// HEARTHWICK_GATES, BEALACH_SOUTH_GATES — are declared in the zone-globals
// block above ASHENMOOR_CONFIG. This section keeps only the shared helper.)

function buildFenceGate(sc,x,z,rotY,col,y){
  // v61f: added optional `y` parameter so the gate sits on the ground instead
  // of being buried wherever terrain is above Y=0 (prior default). Callers
  // now pass the zone's terrain height at (x,z). When omitted, falls back to
  // Y=0 for any legacy caller that still builds on flat ground.
  col=col||0x5a3a18;
  const mat=new THREE.MeshLambertMaterial({color:col});
  const postMat=new THREE.MeshLambertMaterial({color:0x3a2010});
  const g=new THREE.Group();
  // Two posts
  [-1,1].forEach(s=>{const p=new THREE.Mesh(new THREE.BoxGeometry(.12,1.6,.12),postMat);p.position.set(s*.7,.8,0);g.add(p);});
  // Horizontal rails
  [.35,.85,1.35].forEach(ry=>{const r=new THREE.Mesh(new THREE.BoxGeometry(1.4,.08,.07),mat);r.position.set(0,ry,0);g.add(r);});
  // Vertical pickets
  [-3,-1,1,3].forEach(xi=>{const pk=new THREE.Mesh(new THREE.BoxGeometry(.09,1.0,.07),mat);pk.position.set(xi*.175,.68,0);g.add(pk);});
  g.position.set(x,y||0,z);g.rotation.y=rotY||0;
  sc.add(g);
  return g;
}

// v61e0: commission-barrier mesh — the 3D "you can see this road but you
// can't walk it yet" affordance. Sits in front of (or across) a fence gate
// that has guard:'commission' on its gate def. Stylistically: two short
// posts driven into the ground, plus a heavy horizontal crossbeam lashed
// across them at chest height. Visually distinct from buildFenceGate's open
// fence — the bar reads as "barred" from across a field.
//
// Spawned by buildVillage / buildTown gate loops only when the gate is
// commission-gated AND worldState.commissioned is false. After Q7 turn-in,
// re-entering a zone with such a gate skips the build call (so the barrier
// disappears as a function of save state, no live-removal needed). The
// returned Group is stored on the gate runtime entry as `barrierMesh` for
// future debug-removal if we ever want to support a dynamic teardown
// animation; currently unused.
function _buildCommissionBarrier(sc, x, z, rotY, y){
  const beamMat=new THREE.MeshLambertMaterial({color:0x3a2410});
  const postMat=new THREE.MeshLambertMaterial({color:0x2a1808});
  const ropeMat=new THREE.MeshLambertMaterial({color:0x6a4818});
  const g=new THREE.Group();
  // Two short stout posts, slightly outboard of the fence pickets so the
  // beam reads as a separate prop bolted across the gate face.
  [-1,1].forEach(s=>{
    const p=new THREE.Mesh(new THREE.BoxGeometry(.18,1.5,.18),postMat);
    p.position.set(s*.85,.75,0);
    g.add(p);
  });
  // Heavy crossbeam at chest height — wider than the fence opening so the
  // ends visibly overlap the posts, reads as bolted-across rather than
  // floating.
  const beam=new THREE.Mesh(new THREE.BoxGeometry(2.0,.18,.20),beamMat);
  beam.position.set(0,1.05,0);
  g.add(beam);
  // Two rope wraps where the beam meets each post — small but reads at
  // walk-up distance as "this was tied here, deliberately."
  [-.85,.85].forEach(px=>{
    const wrap=new THREE.Mesh(new THREE.TorusGeometry(.13,.02,5,10),ropeMat);
    wrap.position.set(px,1.05,0);
    wrap.rotation.y=Math.PI/2;
    g.add(wrap);
  });
  g.position.set(x,y||0,z);
  g.rotation.y=rotY||0;
  sc.add(g);
  return g;
}
