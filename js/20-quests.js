function mkTex(fn,w=128,h=128){const cv=document.createElement('canvas');cv.width=w;cv.height=h;fn(cv.getContext('2d'),w,h);const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
const TX={
  wall:mkTex(x=>{x.fillStyle='hsl(28,9%,22%)';x.fillRect(0,0,128,128);for(let i=0;i<150;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.2})`;x.fillRect(Math.random()*128,Math.random()*128,Math.random()*8+1,Math.random()*3+1);}for(let r=0;r<128;r+=22)for(let c=0;c<128;c+=34){x.strokeStyle='rgba(0,0,0,.45)';x.lineWidth=1.5;x.strokeRect(c+(r%44<22?16:0),r,30,19);}}),
  floor:mkTex(x=>{x.fillStyle='hsl(28,7%,17%)';x.fillRect(0,0,128,128);for(let i=0;i<180;i++){x.fillStyle='rgba(0,0,0,.1)';x.fillRect(Math.random()*128,Math.random()*128,Math.random()*5,Math.random()*5);}for(let r=0;r<128;r+=32)for(let c=0;c<128;c+=32){x.strokeStyle='rgba(0,0,0,.3)';x.lineWidth=.8;x.strokeRect(c,r,30,30);}}),
  grass:mkTex((x,w,h)=>{x.fillStyle='#2d5a1b';x.fillRect(0,0,w,h);for(let i=0;i<500;i++){x.fillStyle=`hsl(${95+Math.random()*30},${38+Math.random()*25}%,${15+Math.random()*14}%)`;x.fillRect(Math.random()*w,Math.random()*h,Math.random()*4+1,Math.random()*3+1);}})
};
TX.grass.repeat.set(14,14);
const MAT={wall:new THREE.MeshLambertMaterial({map:TX.wall}),floor:new THREE.MeshLambertMaterial({map:TX.floor}),ceil:new THREE.MeshLambertMaterial({color:0x111016}),grass:new THREE.MeshLambertMaterial({map:TX.grass}),wood:new THREE.MeshLambertMaterial({color:0x7a5020}),thatch:new THREE.MeshLambertMaterial({color:0xaa8830}),stone:new THREE.MeshLambertMaterial({color:0x666870}),door:new THREE.MeshLambertMaterial({color:0x6a4018})};

const MSGEL=document.getElementById('msg');
function showMsg(t,c='#d4b896'){MSGEL.textContent=t;MSGEL.style.color=c;MSGEL.style.opacity='1';clearTimeout(MSGEL._t);MSGEL._t=setTimeout(()=>MSGEL.style.opacity='0',2800);}
function showMsgLong(t,c='#d4b896'){MSGEL.textContent=t;MSGEL.style.color=c;MSGEL.style.opacity='1';clearTimeout(MSGEL._t);MSGEL._t=setTimeout(()=>MSGEL.style.opacity='0',5500);}
function doFade(cb){const el=document.getElementById('fd');el.style.transition='opacity .4s';el.style.opacity='1';setTimeout(()=>{cb();el.style.opacity='0';},440);}

// v61ae: defensive UI cleanup called on every zone/interior/dungeon transition.
// The per-frame prompt tick (see ob + ipr updaters ~line 14170) only clears
// the prompt when the CURRENT state indicates nothing nearby — but the
// transition itself doesn't proactively clear leftover text. If any state
// race leaves lid mismatched with scene for a few frames, the prompt from
// the old state lingers visibly. Clearing it at every entry/exit guarantees
// a blank UI state until the next tick computes what the new state needs.
function _clearInteractPrompt(){
  const ipr=document.getElementById('ipr');
  if(ipr){ ipr.textContent=''; ipr.style.opacity='0'; ipr.style.display='none'; }
}

// ── OVERWORLD ────────────────────────────────────────────────
const OW=120,OW_SOL=[];

// ── TERRAIN SYSTEM ───────────────────────────────────────────
// Simplex-style noise via seeded LCG + smooth interpolation
// Heights stored in a flat Float32Array grid, sampled via bilinear interp
const TERRAIN_SEGS=128; // subdivisions on the heightmap grid
let _terrainHeights=null; // Float32Array[(TERRAIN_SEGS+1)^2], set in buildOW
let _terrainSize=OW;      // world units the heightmap covers
// Zone-specific terrain samplers — set during buildForest/buildIronhaven/buildBealachSouth
let _forestTerrainH=null;   // (wx,wz)=>height — set in buildForest
const FOREST_PATH_W=3.5;    // path half-width — used by minimap and buildForest
let _ironhavenTerrainH=null; // (wx,wz)=>height — set in buildIronhaven
function activeTerrainH(wx,wz){
  if(typeof isInterior==='function'&&isInterior())return 0; // v80 S241 — indoors the floor is at 0 (a guard fights you in a room)
  // v61d: prefer ZONES[id].getY (populated by every builder). Legacy per-zone
  // terrain globals (_forestTerrainH etc.) remain as a safety fallback because
  // they're set late inside the builder closures and the ZONES entry might not
  // yet be populated during rapid zone swaps.
  // v61f3: platforms override — rectangular regions where the player walks at
  // a fixed Y instead of the carved terrain Y. Required for bridges over the
  // v61f2 carved river channel: the player's feet are force-snapped to terrain
  // Y, so without an override the player descends into the riverbed when
  // crossing what should be a bridge. Each platform is {x0,x1,z0,z1,y};
  // exposed via ZONES[id].platforms (push from detailFn after computing the
  // bridge geometry Y). Forward-compatible for any future raised walkway —
  // docks, ramparts, balconies. NPC + enemy Y reads through this same function,
  // so a goblin chasing the player onto the bridge will follow them up.
  const zr=ZONES[activeZoneId];
  if(zr&&zr.platforms){ // v80 — the highest platform under you wins (a dais's inner ring over its outer)
    let best=null;for(let i=0;i<zr.platforms.length;i++){const p=zr.platforms[i];if(wx>=p.x0 && wx<=p.x1 && wz>=p.z0 && wz<=p.z1 && (!p.inside||p.inside(wx,wz))){if(best===null||p.y>best)best=p.y;}}
    if(best!==null)return best;
  }
  if(zr&&zr.getY)return zr.getY(wx,wz);
  if(activeZoneId==='forest'&&_forestTerrainH)return _forestTerrainH(wx,wz);
  if(activeZoneId==='ironhaven'&&_ironhavenTerrainH)return _ironhavenTerrainH(wx,wz);
  if(activeZoneId==='bealach_south'&&_bealachSouthTerrainH)return _bealachSouthTerrainH(wx,wz);
  return getTerrainHeight(wx,wz);
}

// Smooth noise: seeded pseudo-random gradient field, two octaves
function _nrand(ix,iz,seed){
  let h=(ix*374761393+iz*668265263+seed)|0;
  h=(h^(h>>>13))*1274126177;h=h^(h>>>16);
  return(h&0xffff)/0xffff; // 0..1
}
function _smoothNoise(x,z,seed,scale){
  const sx=x/scale,sz=z/scale;
  const ix=Math.floor(sx),iz=Math.floor(sz);
  const fx=sx-ix,fz=sz-iz;
  // Smoothstep fade
  const ux=fx*fx*(3-2*fx),uz=fz*fz*(3-2*fz);
  const v00=_nrand(ix,  iz,  seed);
  const v10=_nrand(ix+1,iz,  seed);
  const v01=_nrand(ix,  iz+1,seed);
  const v11=_nrand(ix+1,iz+1,seed);
  return v00+(v10-v00)*ux+(v01-v00)*uz+(v00-v10-v01+v11)*ux*uz;
}
function _buildHeightmap(size,segs,seed){
  const arr=new Float32Array((segs+1)*(segs+1));
  const amp1=3.2, scale1=32;
  const amp2=1.1, scale2=12;
  const amp3=0.3, scale3=5;
  // Radial flat zone centered on village — avoids box-edge wall artifacts
  const vCX=31, vCZ=31; // center (mid of village content)
  const flatR=48;  // fully flat within this radius (tightened from 55)
  const hillR=70;  // full hill height beyond this radius (tightened from 90)
  for(let iz=0;iz<=segs;iz++){
    for(let ix=0;ix<=segs;ix++){
      const wx=(ix/segs)*size, wz=(iz/segs)*size;
      let h=0;
      h+=_smoothNoise(wx,wz,seed,   scale1)*amp1;
      h+=_smoothNoise(wx,wz,seed+1, scale2)*amp2;
      h+=_smoothNoise(wx,wz,seed+2, scale3)*amp3;
      const dist=Math.hypot(wx-vCX,wz-vCZ);
      let flatFactor;
      if(dist<=flatR)      flatFactor=0;
      else if(dist>=hillR) flatFactor=1;
      else                 flatFactor=0.5*(1-Math.cos(Math.PI*(dist-flatR)/(hillR-flatR)));
      arr[iz*(segs+1)+ix]=h*flatFactor;
    }
  }
  return arr;
}
function getTerrainHeight(wx,wz){
  if(!_terrainHeights)return 0;
  const s=_terrainSize,segs=TERRAIN_SEGS;
  const nx=Math.max(0,Math.min(s,wx)),nz=Math.max(0,Math.min(s,wz));
  const gx=(nx/s)*segs, gz=(nz/s)*segs;
  const ix=Math.floor(gx),iz=Math.floor(gz);
  const fx=gx-ix,fz=gz-iz;
  const i00=iz*(segs+1)+ix, i10=iz*(segs+1)+(ix+1);
  const i01=(iz+1)*(segs+1)+ix, i11=(iz+1)*(segs+1)+(ix+1);
  const safe=(i)=>(_terrainHeights[i]||0);
  // Bilinear interpolation
  return safe(i00)*(1-fx)*(1-fz)+safe(i10)*fx*(1-fz)
        +safe(i01)*(1-fx)*fz   +safe(i11)*fx*fz;
}

// ── DUNGEON WORLD TABLE ───────────────────────────────────────
// Each entry: {zone, x, z, seed, size, theme}
// name and keyBase are generated procedurally from seed — no manual naming needed.
// Themes: undead | goblin | elemental | deep | haunted | ruins
// Sizes:  tiny | small | medium | large | massive

const WORLD_DUNGEONS=[
  // zone, x, z, seed, size, theme, diff
  // diff: 'veryeasy' | 'easy' | 'normal' | 'hard' | 'veryhard'
  // canonicalName: overrides procedural name — use for lore-named dungeons

  // ── ASHENMOOR ─────────────────── 7 dungeons, easy→normal range
  // None closer than ~55 units from village center (31,31)
  {zone:'overworld',x:72,z:8,  seed:42,  size:'medium', theme:'undead',    diff:'easy',   canonicalName:'The Dungeon of Shadows'},
  {zone:'overworld',x:100,z:25,seed:137, size:'large',  theme:'elemental', diff:'normal', canonicalName:'The Crypt of Embers'},
  {zone:'overworld',x:28,z:95, seed:891, size:'large',  theme:'deep',      diff:'normal'},
  {zone:'overworld',x:95,z:55, seed:204, size:'tiny',   theme:'goblin',    diff:'veryeasy'},
  {zone:'overworld',x:8, z:90, seed:315, size:'small',  theme:'haunted',   diff:'easy'},
  {zone:'overworld',x:88,z:100,seed:428, size:'medium', theme:'ruins',     diff:'normal'},
  {zone:'overworld',x:55,z:108,seed:539, size:'tiny',   theme:'undead',    diff:'veryeasy'},

  // ── DEEPWOOD FOREST ──────────── 6 dungeons, easy→hard range
  {zone:'forest',x:50, z:60, seed:601,size:'tiny',  theme:'goblin',    diff:'easy'},
  {zone:'forest',x:240,z:80, seed:623,size:'small', theme:'undead',    diff:'easy'},
  {zone:'forest',x:30, z:160,seed:645,size:'small', theme:'goblin',    diff:'normal'},
  {zone:'forest',x:255,z:190,seed:667,size:'medium',theme:'haunted',   diff:'normal'},
  {zone:'forest',x:55, z:240,seed:689,size:'small', theme:'elemental', diff:'hard'},
  {zone:'forest',x:240,z:260,seed:700,size:'medium',theme:'deep',      diff:'hard'},

  // ── IRONHAVEN ─────────────────── 7 dungeons, normal→veryhard range
  {zone:'ironhaven',x:25, z:50, seed:801,size:'medium', theme:'undead',    diff:'normal'},
  {zone:'ironhaven',x:170,z:30, seed:823,size:'medium', theme:'elemental', diff:'hard'},
  {zone:'ironhaven',x:185,z:160,seed:845,size:'large',  theme:'deep',      diff:'hard',   canonicalName:'The Vault of the Tide'},
  {zone:'ironhaven',x:20, z:155,seed:867,size:'small',  theme:'goblin',    diff:'normal'},
  {zone:'ironhaven',x:100,z:178,seed:889,size:'small',  theme:'haunted',   diff:'hard'},
  {zone:'ironhaven',x:22, z:100,seed:911,size:'large',  theme:'ruins',     diff:'veryhard'},
  {zone:'ironhaven',x:178,z:100,seed:922,size:'massive',theme:'elemental', diff:'veryhard'},

  // Add more entries here to expand — the generator handles everything else.
  // Next seed block: 1001+ for future zones.
  // v61aw: the `kind` field is a forward-compat hook — every overworld entry
  // is currently a 'cave_door' (carved stone with door, the "old gates" /
  // "anchor places" of the lore). Future entry types could be 'sewer',
  // 'crypt_mouth', 'well_shaft', 'ruin_arch', etc., each with its own mesh.
  // Untagged entries default to 'cave_door' in makePortalDef.
  // v61f8: 'fort_door' added as the second kind. Wilderness zones outside
  // the three-anchor mythology — abandoned forts, garrisons, towers —
  // built by historical kingdoms rather than carved by the deep-Irish
  // anchor culture. Reads as built stonework (towers + crenellations +
  // heavy double door), not carved cave. Behaviorally identical to a
  // cave_door portal otherwise: same procedural dungeon interior, same
  // interact, same theme/diff system.
  //
  // v61f9: 'exterior' field added to fort_door entries — selects which
  // FORT_EXTERIORS builder draws the surrounding silhouette. Current
  // exteriors: 'gatehouse' (default — twin towers + crenellations) and
  // 'watchtower' (three-tier stone tower + perimeter wall + courtyard).
  // Reserved (unbuilt): 'palisade', 'monastery', 'earthwork', 'keep'.
  //
  // ── BEALACH CENTRAL — gatehouse exterior ──── 1 dungeon
  // First procedural fort placed in the world. Sits north of the road
  // spine on a small clearing. Seed 7100 starts the fort_door seed block.
  // v61f9: position (60,80)→(100,60) for the 200×200 zone resize. Road
  // spine is now z=100; fort is 40u north, centered in X.
  // v61g5: door coord shifted z 60→36 to accommodate the 2× scaled
  // gatehouse + 24u-radius perimeter. The gate showpiece sits at the
  // OLD z=60 (now z = p.z + perimR = 36 + 24 = 60); player path lands
  // south of gate as before.
  {zone:'bealach_central', x:100, z:36, seed:7100, size:'medium', theme:'ruins', diff:'normal', kind:'fort_door', exterior:'gatehouse', interior:'fort_tee', canonicalName:'The Old Garrison'},
  // ── BEALACH NORTH APPROACH — watchtower exterior (Greywatch) ─── 1 dungeon
  // The Greywatch fort. Refactored v61f9 from a bespoke walkable
  // structure into a procedural fort with the watchtower exterior.
  // The visible silhouette (three-tier tower + perimeter wall +
  // courtyard rubble + gate-arch + banner + well) is built by
  // FORT_EXTERIORS.watchtower. The procedural interior is themed
  // ruins, diff easy (Act I appropriate).
  // v61g5: door coord shifted z 100→76 for the 2× scaled + 24u perim.
  // Side path still lands at (60, 113.5), now 13.5u south of new gate
  // at z=100 (was: just south of old gate-arch).
  {zone:'bealach_north_approach', x:60, z:76, seed:7099, size:'medium', theme:'ruins', diff:'easy', kind:'fort_door', exterior:'watchtower', interior:'fort_tee', canonicalName:'Greywatch'},

  // ─── Session 41 fort placements (v61f16) ──────────────────────────
  // Six additional forts scattered across wilderness zones to fill out
  // the procedural-fort architecture. Each uses one of the four newly
  // added reserved exteriors (palisade, monastery, earthwork, keep) or
  // a variant of an existing one (ruined_gatehouse, watchtower_canopy).
  // Lore-light by design — names are folk-usage, no canonical specificity.
  // Seeds 7101-7106 continue the fort_door seed block from 7100 (The
  // Old Garrison) and 7099 (Greywatch).
  //
  // v61g5: all 6 had their door z shifted by -24 to accommodate 2× scale
  // + 24u perimeter. Each fort's gate showpiece sits at the OLD z coord.
  //
  // ── WASTES EAST — palisade exterior ───────────────────────────────
  // The Last Post. A failed king's-frontier outpost on the edge of the
  // dead zone. Wood register against the Wastes' bleached palette. Sits
  // south of the road, accessed via a short side path.
  {zone:'wastes_east', x:80, z:30, seed:7101, size:'medium', theme:'goblin', diff:'normal', kind:'fort_door', exterior:'palisade', interior:'fort_linear', canonicalName:'The Last Post'},
  // ── MOUNTAIN PASS — monastery exterior ─────────────────────────────
  // The Wind Cloister. Abandoned high-country order, Norman by lineage.
  // Tall remnant wall + cross + low cloister stubs + fallen pews. Sits
  // north of the road via a short side path.
  {zone:'mountain_pass', x:60, z:36, seed:7102, size:'medium', theme:'haunted', diff:'hard', kind:'fort_door', exterior:'monastery', interior:'fort_courtyard', canonicalName:'The Wind Cloister'},
  // ── COASTAL ROAD NORTH — earthwork exterior ───────────────────────
  // The Old Mound. Predecessor-culture hillfort, Irish-register. Two
  // concentric earth berms + palisade fragments. Oldest-feeling fort
  // in the world. Sits south of the road.
  {zone:'coastal_road_north', x:80, z:30, seed:7103, size:'medium', theme:'undead', diff:'normal', kind:'fort_door', exterior:'earthwork', interior:'fort_linear', canonicalName:'The Old Mound'},
  // ── LA ROUTE ROYALE WEST — keep exterior ──────────────────────────
  // Pellam's Hold. Single squat stone block, a minor lord's holdfast on
  // the king's road. Anglo-Saxon name surviving on a Norman-French road
  // — quietly says "predates the road." Sits north of the road.
  {zone:'la_route_royale_west', x:100, z:36, seed:7104, size:'medium', theme:'ruins', diff:'normal', kind:'fort_door', exterior:'keep', interior:'fort_courtyard', canonicalName:"Pellam's Hold"},
  // ── NORTHERN ROAD — ruined_gatehouse exterior ─────────────────────
  // Hollow Gate. Gatehouse with one tower collapsed, lintel sagging.
  // Variant of The Old Garrison silhouette — same fort form, dramatically
  // different state. Sits west of the road via a short side path.
  {zone:'northern_road', x:60, z:76, seed:7105, size:'medium', theme:'goblin', diff:'normal', kind:'fort_door', exterior:'ruined_gatehouse', interior:'fort_tee', canonicalName:'Hollow Gate'},
  // ── FOREST (DEEPWOOD) — watchtower_canopy exterior ────────────────
  // The Lonely Tower. Variant of Greywatch's silhouette — no perimeter
  // wall, no courtyard. Just the tower in the deep woods. Trees ARE the
  // perimeter; no side path needed. Placed in the east-mid Deepwood,
  // away from existing portals and the winding path corridor.
  {zone:'forest', x:210, z:86, seed:7106, size:'medium', theme:'haunted', diff:'easy', kind:'fort_door', exterior:'watchtower_canopy', interior:'fort_linear', canonicalName:'The Lonely Tower'},
];

// v61aw / v61ax / v61b2: tutorial crypt portal — special standalone
// entry, NOT in WORLD_DUNGEONS so it can never be reached from the
// overworld. Used only by the character creator's Begin → flow.
// theme:'undead' picks the skeleton-heavy enemy roster; size:'medium'
// gives a 30×30 grid with 10-16 rooms — roughly 2× the area of the
// previous 'small' setup, enough for the player to actually explore
// and have a sense of progression. The `tutorial:true` flag is read
// in several places: the dungeon enemy spawn loop applies a 0.5×
// HP/damage multiplier on top of difficulty, caps the enemy count
// at 3 (vs medium's default 14), forces single-floor (no staircase),
// places the key opposite the player's spawn cell (vs opposite the
// entrance), and goToOW() routes the exit fade to the south road
// into Ashenmoor instead of returning to a dungeon entrance.
const TUTORIAL_PORTAL = {
  id:'tutorial_crypt',
  name:'The Crypt of First Light',
  zone:'overworld', x:-999, z:-999, // off-map — no overworld mesh placement
  seed:7, size:'medium', theme:'undead', diff:'veryeasy',
  canonicalName:'The Crypt of First Light',
  // v61b3: explicit keyBase. Regular world dungeons get this set by
  // makePortalDef during WORLD_DUNGEONS hydration; TUTORIAL_PORTAL
  // skips that path (it's a standalone def), leaving keyBase undefined
  // and the rendered key name reading 'undefined Key'. 'Crypt' fits
  // the lore and matches the location's flavor.
  keyBase:'Crypt',
  tutorial:true,
};

// ── DIFFICULTY SCALING ────────────────────────────────────────
// Each tier multiplies enemy HP, damage, and speed relative to baseline.
const DIFF_SCALE={
  veryeasy: {hp:.45, dmg:.45, spd:.75, label:'Very Easy', col:'#44cc88'},
  easy:     {hp:.70, dmg:.65, spd:.88, label:'Easy',      col:'#88cc44'},
  normal:   {hp:1.0, dmg:1.0, spd:1.0, label:'Normal',    col:'#c8b880'},
  hard:     {hp:1.5, dmg:1.45,spd:1.15,label:'Hard',      col:'#e08840'},
  veryhard: {hp:2.2, dmg:2.0, spd:1.3, label:'Very Hard', col:'#cc4444'},
};

// ── PROCEDURAL DUNGEON NAMING ─────────────────────────────────
function dungeonName(seed,theme){
  const h=s=>{let v=s^0xdeadbeef;v=(v^(v>>>16))*0x45d9f3b;v=(v^(v>>>16))*0x45d9f3b;return(v^(v>>>16))>>>0;};
  const pick=(arr,n)=>arr[h(seed*37+n)%arr.length];
  const PREFIXES={
    undead:   ['Ancient','Forgotten','Cursed','Hollow','Sunken','Dead','Pale','Ashen'],
    goblin:   ['Stinking','Rotten','Filthy','Dark','Hidden','Gnawed','Cramped','Reeking'],
    elemental:['Burning','Frozen','Scorched','Shattered','Blazing','Frost','Iron','Molten'],
    deep:     ['Deep','Black','Broken','Collapsed','Flooded','Lost','Sunken','Buried'],
    haunted:  ['Haunted','Whispering','Wailing','Silent','Shrouded','Cursed','Pale','Dim'],
    ruins:    ['Ruined','Crumbling','Fallen','Shattered','Old','Forsaken','Desolate','Worn'],
  };
  const NOUNS={
    undead:   ['Crypt','Tomb','Barrow','Ossuary','Mausoleum','Charnel House','Catacomb','Sepulchre'],
    goblin:   ['Warren','Den','Burrow','Pit','Hole','Cavern','Lair','Nest'],
    elemental:['Forge','Vault','Spire','Chamber','Crucible','Furnace','Sanctum','Core'],
    deep:     ['Depths','Abyss','Chasm','Delve','Fissure','Grotto','Hollow','Rift'],
    haunted:  ['Manor','Hall','Tower','Keep','Ruin','Estate','Manse','Sanctum'],
    ruins:    ['Ruin','Remnant','Hold','Fort','Citadel','Bastion','Redoubt','Outpost'],
  };
  const SUFFIXES=[
    'of Shadows','of the Fallen','of No Return','of Despair','of the Ancients',
    'of Sorrow','of the Damned','of the Lost','of Silence','of the Deep',
    'of Ash','of Bone','of the Void','of Whispers','of the Forsaken',
  ];
  const pre=pick(PREFIXES[theme]||PREFIXES.ruins,1);
  const NL=NOUNS[theme]||NOUNS.ruins,lc=w=>{w=w.toLowerCase();return w==='depths'?'deep':w;},same=(a,b)=>{a=lc(a);b=lc(b);const n=Math.min(4,a.length,b.length);return a.slice(0,n)===b.slice(0,n);};
  let ni=h(seed*37+2)%NL.length;if(same(NL[ni],pre))ni=(ni+1)%NL.length;const noun=NL[ni];
  const said=[pre,...noun.split(' ')];let si=h(seed*37+3)%SUFFIXES.length;
  while(SUFFIXES[si].split(' ').filter(w=>w!=='of'&&w!=='the').some(w=>said.some(x=>same(x,w))))si=(si+1)%SUFFIXES.length;
  return `The ${pre} ${noun} ${SUFFIXES[si]}`;
}

function dungeonKeyBase(seed){
  const words=['Shadow','Ember','Tide','Bone','Ash','Frost','Iron','Stone','Dark','Void',
               'Rune','Blood','Mist','Flame','Steel','Crypt','Doom','Grim','Pale','Dusk'];
  return words[seed%words.length];
}

// Theme → visual + enemy roster
const THEME_DEF={
  undead:   {fog:0x120f1a,amb:0x9060cc,portalCol:0x8844ff,wallCol:0x2a2232,floorCol:0x1a1624,clutter:'bones',
             enemies:['Skeleton','Skeleton','Phantom','Wraith','Skeleton','Mimic']},
  goblin:   {fog:0x0a1208,amb:0x60a040,portalCol:0x44bb22,wallCol:0x1e2818,floorCol:0x141c10,clutter:'junk',
             enemies:['Goblin','Goblin','Kobold Thief','Slime','Cave Troll','Shieldbearer']},
  elemental:{fog:0x1a0a08,amb:0xff6030,portalCol:0xff4422,wallCol:0x2a1808,floorCol:0x1e1208,clutter:'rubble',
             enemies:['Fire Elemental','Golem','Slime','Fire Elemental','Cave Troll','Phantom']},
  deep:     {fog:0x080a10,amb:0x3060a0,portalCol:0x2244aa,wallCol:0x181a20,floorCol:0x10121a,clutter:'rubble',
             enemies:['Cave Troll','Golem','Slime','Mimic','Skeleton','Cave Troll']},
  haunted:  {fog:0x0a0814,amb:0x8040a0,portalCol:0xaa44ff,wallCol:0x1e1828,floorCol:0x14101c,clutter:'chains',
             enemies:['Phantom','Wraith','Gargoyle','Mimic','Skeleton','Phantom']},
  ruins:    {fog:0x0e0c0a,amb:0xa07848,portalCol:0x886622,wallCol:0x22201a,floorCol:0x181610,clutter:'rubble',
             enemies:['Skeleton','Goblin','Gargoyle','Shieldbearer','Mimic','Golem']},
};

// Build a full portal definition from a WORLD_DUNGEONS entry
// v80 S9 — dungeon difficulty is the player's level, not an authored grade.
// Portals resolve diff/diffScale at use time so a door you found at L2 is
// still a fair fight at L12.
function levelDiffKey(){const L=(typeof level==='number')?level:1;return L<=2?'veryeasy':L<=5?'easy':L<=9?'normal':L<=14?'hard':'veryhard';}
function makePortalDef(entry){
  const td=THEME_DEF[entry.theme]||THEME_DEF.ruins;
  const ds=DIFF_SCALE[entry.diff]||DIFF_SCALE.normal;
  return{
    x:entry.x, z:entry.z,
    name:entry.canonicalName||dungeonName(entry.seed,entry.theme),
    id:'dyn_'+entry.seed,
    col:td.portalCol,
    size:entry.size,
    seed:entry.seed,
    zone:entry.zone,
    keyBase:dungeonKeyBase(entry.seed),
    theme:entry.theme,
    get diff(){return levelDiffKey();},
    get diffScale(){return DIFF_SCALE[levelDiffKey()];},
    kind:entry.kind || 'cave_door',  // v61f8: forward-compat field. 'cave_door' (default, carved-rock-and-door "old gate") or 'fort_door' (built-stonework fort entrance).
    exterior:entry.exterior || 'gatehouse',  // v61f9: which FORT_EXTERIORS entry to use for fort_door portals. Default 'gatehouse'. Ignored for cave_door.
    interior:entry.interior || 'cave',  // v61g0: which FORT_INTERIORS entry to use for procedural interior generation. Default 'cave' (makeDungeon, random rooms + L-corridors). 'fort_tee' selects the trunk+cross fort interior. Independent of kind/exterior — a cave_door can technically host any interior, though canonically only fort_door entries set this.
  };
}

// Active portal list for current zone — set in buildOW/buildForest/buildIronhaven
let PORTALS=[];

function findPortalById(id){return PORTALS.find(p=>p.id===id)||PORTALS[0];}

// ══════════════════════════════════════════════════════════════
// QUEST SYSTEM
// ══════════════════════════════════════════════════════════════
// Quest states: 'locked' | 'available' | 'active' | 'reward' | 'complete'
// Objective types: kill_in_dungeon, reach_dungeon, talk_to, collect_item
const QUEST_DEFS=[
  // v61aw / v61ax: Q0 — silent opening quest. Auto-active from game start.
  // The title and description frame the experience from the player's POV
  // ("I find myself inside of a crypt"), not the gameplay objective. The
  // objective itself ticks the moment the player emerges from the tutorial
  // crypt into the overworld. autoComplete (no NPC turn-in) means the
  // existing checkQuestProgress flow resolves it inline; its completeText
  // names Bram explicitly so the player has a soft narrative push toward
  // Q1, and the existing waypoint system handles the visual pointer (red
  // cone over the forge) once Q1 unlocks.
  // The "I wake in the dark" journal popup is fired manually from
  // ccBegin after the intro fade completes — showAcceptPopup doesn't
  // trigger for quests that start in 'active' state (it's wired for the
  // locked → available → active transition).
  {id:'q0_arrival',
   title:'Out of the Dark',
   giver:null, giverZone:null,
   description:"I woke inside a stone coffin in a forgotten crypt. I have no memory of how I came to be here, or for how long I have lain. The air is dank and stinks of death. I need to find a way out.",
   // v61ay: explicit acceptText so the post-intro quest popup shows the
   // journal entry instead of a generic "X has been added to my journal"
   // fallback. Same text as description so the quest log card and the
   // popup tell the same story.
   acceptText:"I woke inside a stone coffin in a forgotten crypt. I have no memory of how I came to be here, or for how long I have lain. The air is dank and stinks of death. I need to find a way out.",
   objectives:[
     {type:'enter_zone', zone:'overworld', count:1, label:'Find a way out of the crypt'},
   ],
   rewards:{gold:0, xp:50, items:[]},
   autoComplete:true,
   completeText:"I emerged onto a road. Chimney smoke ahead — a village. There was a sign with a hammer painted on it: Bram, the smith. If anyone here will speak with a stranger, it will be him. I should find his forge.",
   unlocks:['q1_first_blood'],
  },
  {id:'q1_first_blood',
   title:'First Blood',
   giver:'Bram', giverZone:'overworld',
   description:'Before I say more — prove you can hold a blade. Head into the Shadows, kill five of whatever\'s crawling down there. Come back with the blood still drying on it and we\'ll talk.',
   acceptResponses:[
     {label:"I'll be back by nightfall.",
      response:'Good. No speeches.'},
     {label:"What aren't you telling me?",
      response:'Plenty. Finish the five and I\'ll decide which part you\'ve earned.'},
     {label:"Five? Might make it ten for the practice.",
      response:'Don\'t die trying to impress me. I\'ve pulled better fighters than you off a troll\'s spike.'},
   ],
   objectives:[
     {type:'kill_in_dungeon', dungeonSeed:42, count:5, label:'Kill enemies in the Dungeon of Shadows'},
   ],
   rewards:{gold:50, xp:120, items:[{name:'Iron Sword',ico:'⚔️',type:'equip',slot:'weapon',atk:[10,12],weaponShape:'sword',wType:'slash',weight:2,tier:3,material:'Iron',matCol:0xA8B0B8,matGuard:0x787880,reqAttr:'might',reqVal:5,buyPrice:36,sellMult:.45}]},
   rewardSpeech:'You came back. Good. Iron sword — clean-forged, my own hammer on it. Keep it sharp.',
   readyText:"Five down in the Shadows. Skeletons mostly — the sound they make when they go is dry like splitting kindling. Back to the forge.",
   completeText:"Iron Sword from Bram. Clean-forged, his own hammer on it. Heavier than what I came in with — sits right. He pointed me at Edna in the south cottage. Said she's been sitting on something about the Shadows for thirty years.",
   rewardResponses:[
     {label:'Thank you.',
      response:'Go see Edna. Old woman in the south cottage. She saw something in those dungeons thirty years ago she\'s never told anyone. See if you can get it out of her.'},
     {label:"What's next, then?",
      response:'Edna. South cottage. She\'s held something back for thirty years about the Shadows. Time someone got it out of her.'},
   ],
   unlocks:['q2_strange_markings'],
  },
  {id:'q2_strange_markings',
   title:'Strange Markings',
   giver:'Edna', giverZone:'overworld',
   description:'So Bram sent you. Good. Listen — thirty years ago I went into the Dungeon of Shadows. I was younger then, and stupider, and I had a proper pair of knees. Down on the second floor, I found sigil-carvings set into the stone. Someone put them there on purpose. I came home and told no one. Go back, find the sigils on that floor, and tell me what they look like now.',
   acceptResponses:[
     {label:"I'll bring back what I see.",
      response:'Good lad. Keep your wits — the second floor was never meant for company.'},
     {label:"Why didn't you tell anyone?",
      response:'Because I didn\'t know what I\'d seen, and the one person I might have told was dead of a winter cough by spring. Then it was twenty years, then thirty, and here we are.'},
     {label:"Thirty years is a long time to sit on something.",
      response:'Oh, I know. I\'ve had all the time in the world to sit on things lately. My knees see to that. You don\'t have that luxury — go.'},
   ],
   objectives:[
     {type:'touch_sigil', dungeonSeed:42, floor:2, firstTouch:true, label:'Find the sigils on floor 2 of the Dungeon of Shadows'},
   ],
   rewards:{gold:80, xp:200, items:[{name:'Greater Potion',ico:'🫙',type:'potion',heal:60,buyPrice:40,sellMult:.5},{name:'Greater Potion',ico:'🫙',type:'potion',heal:60,buyPrice:40,sellMult:.5}]},
   rewardSpeech:'You saw them. I knew it. Thirty years and they haven\'t faded — that means someone\'s been keeping them there. Here — two strong potions. Use them when the fighting gets bad.',
   readyText:"The mark on the second floor is real. I put my hand on it and came up holding a spell I didn't have when I went down. Edna said come back when I'd seen it. Walking now.",
   completeText:"Edna was an adventurer once. Three dungeons in her youth. She saw markings on the deep walls in a script that felt deliberate. She kept it for thirty years because she didn't know who to tell. She thinks things are getting worse faster than they should. Find Corwin — the trader, east side. He keeps company with mages in bigger towns.",
   rewardResponses:[
     {label:'Who could I tell about this?',
      response:'Corwin. The traveling merchant — you\'ll find him out near the east fields. He knows people I don\'t. If anyone\'s heard tell of these marks, it\'s him. Go.'},
     {label:'Thank you, Edna.',
      response:'Don\'t thank me, child — go find Corwin. Merchant, east side. He keeps company with mages in the bigger towns. He\'ll know what those marks mean, or he\'ll know who does.'},
   ],
   unlocks:['q3_the_merchant_knows'],
  },
  {id:'q3_the_merchant_knows',
   title:'The Merchant Knows',
   giver:'Corwin', giverZone:'overworld',
   description:'Sigils on the deep walls. Edna saw them thirty years ago. Right — you need to tell someone who matters. Go to Ironhaven. Find a man called Aldwyn — officially he\'s the Royal Herald, unofficially he\'s a mage with friends in places I don\'t go. He\'s been quietly looking for corroboration on exactly this for two years. Tell him what Edna told you. Word for word if you can manage it.',
   acceptResponses:[
     {label:"I'll head out at first light.",
      response:'Good. Don\'t lose the detail between here and there — Aldwyn will want every part of it.'},
     {label:"Why Aldwyn specifically?",
      response:'Because he\'s the only person in three hundred leagues who\'ll take it seriously and do something with it. I\'ve been feeding him scraps for two years. This is more than a scrap.'},
     {label:"Sigils and secret mages. Interesting company you keep.",
      response:'You keep the company you need to, in my line of work. Be glad I keep it — the alternative is that nobody who should know, knows.'},
   ],
   objectives:[
     {type:'talk_to', npc:'Aldwyn', zone:'ironhaven', label:'Speak with Aldwyn in Ironhaven'},
   ],
   rewards:{gold:100, xp:180, items:[{name:"Of Binding Stones",ico:'📔',type:'book',bookId:'of_binding_stones',weight:0.5,buyPrice:0,sellMult:.1}]},
   // v61d3 — readyText is written for canon completeness but won't surface
   // in-game. Q3 uses customActiveDialog → questDialogComplete which marks
   // all objectives done in bulk, bypassing checkQuestProgress's allDone
   // branch (the only site that queues the 'ready' popup). The 'complete'
   // popup IS shown — that's the path Q3 actually takes.
   readyText:"Edna's account in my head, word for word. Ironhaven by the next bell. Aldwyn at the Royal Herald's, Corwin said. The man who'll take it seriously.",
   completeText:"The marks aren't decorative — they're binding inscriptions. They hold whatever's inside the dungeons in place, and they're failing. Aldwyn calculates one season before the containment breaks. He sent me to the Crypt of Embers next to confirm the state of those sigils. Touch nothing, he said.",
   unlocks:['q4_crypt_of_embers'],
   // Custom active dialog — scripted exchange rendered on Aldwyn (the talk_to target).
   // Completion fires via questDialogComplete — the engine shows the response before closing.
   customActiveDialog:{
     label:"Tell him about Edna's sigils.",
     response:'Sigil markings on the deep walls. Yes. I know them. I\'ve been trying to get someone to corroborate what I found for two years — and Edna saw them too? That changes things. Those marks aren\'t decorative, traveler. They\'re binding inscriptions — holding whatever is inside those dungeons in place. And they\'re failing.',
     follow:[
       {label:"What do you mean, 'failing'?",
        response:'Degrading. Weakening. The oldest examples are in the Crypt of Embers. If what\'s down there matches what I\'ve been calculating, Ironhaven has one season before the containment breaks entirely. Go to the Crypt. Reach the lower floor. Tell me what state the sigils are in — intact, damaged, or gone. I need to know before I take this to Lord Caldric.',
        questDialogComplete:'q3_the_merchant_knows'},
       {label:"You've been sitting on this for two years?",
        response:'Sitting on unverifiable speculation, yes. Now it\'s not speculation. Go to the Crypt of Embers — reach the second floor. Come back and tell me the state of the sigils. That\'s the work.',
        questDialogComplete:'q3_the_merchant_knows'},
       {label:"I'll come back when I'm ready.", back:true},
     ],
   },
  },
  {id:'q4_crypt_of_embers',
   title:'The Crypt of Embers',
   giver:'Aldwyn', giverZone:'ironhaven',
   description:'You\'ll want the details I wasn\'t ready to give you a moment ago. The sigils at the Crypt of Embers are the oldest binding stones in the region. If that site is degrading at the rate I calculate, it fails first — and whatever the original builders locked inside gets out. Go to the second floor. Find the sigils. Memorise what you see. Touch nothing.',
   acceptResponses:[
     {label:"I'll report back with what I see.",
      response:'Good. Travel well — and if something down there moves that shouldn\'t, don\'t fight it. Retreat and come back.'},
     {label:"What exactly am I looking for?",
      response:'Patterns. Unbroken inscriptions form a closed ring — each sigil flows into the next. If any are cracked, chipped, overwritten, or simply absent, that\'s what I need to know. Missing ones worst of all.'},
     {label:"And if the builders are still around?",
      response:'Then we have a much larger problem than broken stone. Don\'t confirm what isn\'t yours to confirm. Look at the marks. Come back.'},
   ],
   objectives:[
     {type:'touch_sigil', dungeonSeed:137, floor:2, firstTouch:true, label:'Find the sigils on floor 2 of the Crypt of Embers'},
   ],
   rewards:{gold:150, xp:350, items:[]},
   rewardSpeech:'You saw them. Broken — I expected that. But the overwrites you describe are recent. Months, not centuries. Someone is down there working.',
   readyText:"The sigils at the Crypt are damaged. Not weathered — chipped, cracked, OVERWRITTEN. New strokes cut on top of the original work, fresh enough the dust hasn't filled them. Aldwyn needs to see what I saw. Walking back to Ironhaven.",
   completeText:"Months, not centuries. Aldwyn says someone is down there working — making the bindings fail faster. He's bringing it to Lord Caldric tonight. Captain Brynn at the gatehouse will have orders for me by morning.",
   rewardResponses:[
     {label:'Working on what?',
      response:'On making the bindings fail faster. Which is — to be direct — a catastrophic piece of information. I need to bring this to Lord Caldric tonight. Speak with Captain Brynn at the gatehouse. She\'ll have orders for you by morning.'},
     {label:"Who would be down there working?",
      response:'That is the question. I do not have a good answer yet — and I will not guess at one aloud. What I need from you now is the next step. Go to Captain Brynn at the gatehouse, west of the keep. Lord Caldric will be briefed before morning.'},
   ],
   unlocks:['q5_caldric_commission'],
  },
  {id:'q5_caldric_commission',
   title:"Lord Caldric's Commission",
   giver:'Captain Brynn', giverZone:'ironhaven',
   description:'Aldwyn\'s report reached Lord Caldric an hour after you did. Here\'s the order, and it\'s direct from him: the Vault of the Tide is the least mapped and the most active of the three active sites. Reach the lower floor. Clear eight targets — we need the deeper population thinned enough that Caldric can send a survey team in behind you. Standard rules: clear, don\'t chase. Come back.',
   acceptResponses:[
     {label:"Understood. Eight on the lower floor.",
      response:'Good. Speed matters — Lord Caldric wants the survey team in before the week is out.'},
     {label:"Is a survey team going to be enough?",
      response:'No. But it\'s what we have. You\'re also what we have. Go.'},
     {label:"Why eight?",
      response:'Because that\'s the number at which the floor stays cleared long enough for the surveyors to work. Aldwyn\'s count, not mine. I trust it.'},
   ],
   objectives:[
     {type:'kill_on_dungeon_floor', dungeonSeed:845, floor:2, count:8, label:'Clear floor 2 of the Vault of the Tide (0/8)'},
   ],
   rewards:{gold:300, xp:600, items:[
     makeItem(4,ARMOR_TYPES.find(t=>t.type==='Cuirass'),null,true),
   ]},
   rewardSpeech:'Clean work. The survey team deploys tomorrow. Here — this belonged to one of Caldric\'s sworn men, who no longer needs it. It\'ll serve you better than it served him.',
   readyText:"Eight clear on the lower floor of the Tide. Brynn said clear, don't chase. The water down there isn't moving the way water does. Walking up.",
   completeText:"Heavy cuirass from the gatehouse stores. Brynn said it belonged to one of Caldric's sworn men, who no longer needs it. Survey team deploys tomorrow. Aldwyn wants to see me — Royal Herald's office, same as always. He has something bigger than this. Don't keep him waiting, she said.",
   rewardResponses:[
     {label:'What comes next?',
      response:'Aldwyn wants to see you. He\'s been pulling together everything we\'ve learned — something about how the three sites connect. He\'ll brief you himself. Don\'t keep him waiting.'},
     {label:'My thanks, Captain.',
      response:'Thank Aldwyn. He\'s been asking for you — he\'s at the Royal Herald\'s, same as always. He has something bigger than this for you. Go.'},
   ],
   unlocks:['q6_binding_stone'],
  },
  {id:'q6_binding_stone',
   title:'The Binding Stone',
   giver:'Aldwyn', giverZone:'ironhaven',
   description:'I\'ve pieced it together. The sigils in the three sites — Shadows, Embers, Tide — aren\'t separate systems. They\'re fragments of one binding inscription, split between three anchor points and reinforcing each other. Weaken one, you weaken them all. Someone has been doing exactly that, deliberately, for a long time. I need you to clear twenty more targets from any Ironhaven dungeon — we need the pressure dropped while I put the next move together. Come back when it\'s done. What I show you afterwards will change the shape of this.',
   acceptResponses:[
     {label:"Twenty targets. I'll handle it.",
      response:'Good. And — be careful. You\'re not just clearing dungeons now. You\'re being watched by whoever is doing this, whether we\'ve seen them or not.'},
     {label:"Who is the 'someone' doing this?",
      response:'I have a working theory. I\'ll tell you when you return. Not here, not before. Twenty targets first.'},
     {label:"What do you mean, 'change the shape of this'?",
      response:'I mean what I said. Everything you\'ve done so far has been Act One. When you come back, I hand you Act Two. Twenty targets first.'},
   ],
   objectives:[
     {type:'kill_in_zone', zone:'ironhaven', count:20, label:'Kill enemies in Ironhaven dungeons (0/20)'},
   ],
   rewards:{gold:500, xp:1000, items:[
     {name:'Aldwyn\'s Seal',ico:'📜',type:'misc',buyPrice:0,sellMult:.1,
      desc:'A wax seal bearing the Royal Mage corps insignia. Aldwyn pressed it into your hand without explanation.'},
   ]},
   rewardSpeech:'It\'s done. Good — sit a moment. Here. Wax seal, Royal Mage corps. Don\'t ask how I have it. Carry it on you from now on. One other thing, and I want you to hear it plainly. A rider came in from the South Road an hour ago. He says there\'s smoke on the horizon — Ashenmoor direction, more than a hearth fire. Probably nothing. Probably a stubble burn run late. But go home first. Before anything else. Check on your people. Then come find me.',
   readyText:"Twenty across the Ironhaven dungeons. Aldwyn said the pressure had to drop while he put the next move together. Done. Back to the Royal Herald's.",
   completeText:"The three sites are one binding. Shadows, Embers, Tide — fragments of a single inscription, split between three anchor points. Someone has been working at it for a long time. Aldwyn pressed a wax seal into my hand without explanation. Royal Mage corps. Carry it always, he said.\n\nAnd — a rider came in from the South Road an hour ago. Smoke on the horizon. Ashenmoor direction. More than a hearth fire. Aldwyn says probably a stubble burn run late. He told me to go home first. Before anything else.",
   rewardResponses:[
     {label:"Smoke. From Ashenmoor.",
      response:"Could be a dozen things. Rider wasn\'t sure. I wouldn\'t send you if I thought you could do more good here tonight. Go see. If it\'s nothing, you\'ve lost an evening. If it\'s something — I\'d rather it be you than me who walks into it first."},
     {label:'What\'s the seal for?',
      response:'For later. A name goes with it — I\'ll give you the name when you come back and the smoke is explained. Until then, keep the seal pocketed and keep your mouth shut about it. That\'s the whole instruction.'},
     {label:"And the person behind all this?",
      response:"I have a working theory and a name I\'ve been sitting on. I\'ll share it with you next time we speak. Not tonight — there\'s only so much weight a night holds. Go see to your village."},
     {label:"I\'ll head home.",
      response:"Good. Don\'t ride hard — you\'re tired and the road isn\'t kind to tired riders. Go carefully. I\'ll be here."},
   ],
   // v61ak: Q6 now directly unlocks Q7. Combined with Q7.autoAccept and
   // Q7.showAcceptPopup, this means Q7 activates as the player walks out of
   // Aldwyn's office — he is the true giver of the quest (the rider came to
   // him with the smoke report). The burn trigger in goToZone no longer
   // accepts or advances Q7 state; it only fires the enter_zone event,
   // which ticks Q7's obj 0 if Q7 is already active.
   unlocks:['q7_the_rubbing'],
  },
  // ── Q7 — Act II opener, gated by the burn ────────────────────────────────
  // v61ae: four-objective restructure. Edna starts the quest by asking the
  // player to check on Bram and Brother Oswin before she gives them anything.
  // Stage sequence:
  //   0. Read Bram's body (read_corpse event fires from the interact)
  //   1. Speak with Brother Oswin at the oratory (talk_to, overworld)
  //   2. Return to Edna — prereq [0,1]. Edna's stage-3 topic (see
  //      buildQuestTopicsForNPC) hands the rubbing here and fires talk_to
  //      via questMidQuestGive to advance this objective.
  //   3. Bring the rubbing to Aldwyn in Ironhaven — prereq [2]. Aldwyn's
  //      customActiveDialog completes the quest and gives the commission.
  // State machine: locked → available (on burn) → active → reward → complete.
  {id:'q7_the_rubbing',
   title:'The Rubbing',
   giver:'Edna', giverZone:'overworld',
   description:"Before I can give you anything, I need you to do two things for me. My legs won't carry me that far and I need to know. Go to the forge — Bram went out there, I watched him fall. Then walk to the oratory. Brother Oswin was inside when it started. The door is stone and heavy and I think he's alive in there, but I can't walk that far to check. See to both of them and come back to me. Then I'll tell you what I've been holding.",
   acceptResponses:[
     {label:"Bram first, then the oratory. I'll come back to you.",
      response:'Good. Take your time with Bram. He deserves it. And if Oswin is in there — he will not be himself. Be gentle. Come back when you can.'},
     {label:"What are you holding?",
      response:"Something I made thirty years ago that matches something that has been carved onto my west wall. That is the whole answer. You'll see the rest when you've checked on the others. Go. Please."},
     {label:"You weren't hurt worse?",
      response:"I have a hip that will not carry weight today. I'll mend. I'm not the one you're worried about this evening. Go."},
   ],
   objectives:[
     // v61ak: OBJ 0 — arrival at burned Ashenmoor. Auto-ticks when the burn
     // trigger fires in goToZone. The completionText delivers the "burned to
     // the ground, I should see if anyone survived" beat as a Quest Updated
     // popup (purple palette, fires via the popup queue so waits for player-
     // free state — meaning the popup lands AFTER the fade clears).
     {type:'enter_zone', zone:'overworld', label:'Return to Ashenmoor',
      completionText:"Ashenmoor has been burned to the ground.\n\nBram. Edna. Corwin and the children. Brother Oswin. I don't know who's alive and I don't know who isn't. Someone came through here while I was in Ironhaven.\n\nAnd something is moving in the ruins. I can hear it from here."},
     // v61c2: OBJ 1 — defeat the Faolchú in the village square. Prereq [0]
     // so it doesn't appear in the quest log until the player has arrived
     // at burned Ashenmoor. The boss spawns from the burn trigger / spawn
     // hooks in goToZone; this objective ticks when killZoneEnemy fires
     // the defeat_boss event on the boss's death. Triage objectives 3/4/5
     // gate on this one — survivors are hiding because the wolf-shape is
     // out there, and emerge only after it's down.
     // v61d0: completionText rewritten to land the chimera silhouette
     // (wolf-shaped head, horse-arched back, almost-human extra arms from
     // the spine seam) and to redirect the player into TWO parallel next
     // steps — investigate the body (new obj 2) and check for survivors
     // (existing triage obj 3/4/5). Removed the "Edna will know / Aldwyn
     // will know" line — forward-projection that doesn't fit the moment
     // the player just finished a fight.
     {type:'defeat_boss', bossId:'faolchu', zone:'overworld', prereqIndices:[0],
      label:'Drive off the wolf-shape stalking the ruins',
      completionText:"The thing in the square is dead. Wolf-shaped, near enough, but the proportions were wrong from the shoulders down — too much chest, the back arched like a horse rather than slung low like a wolf, and from the spine seam two arms grew where no arms should be. Almost human, knuckled and clawed. The seams along its back glowed red until I closed them.\n\nSomething is still on the body — bone, half-buried in the seam where the binding tried to close. I should look at that before I do anything else. Some of the buildings in the village are still standing. I should check for any survivors."},
     // v61d0: OBJ 2 — receive_item for The Faolchú's Mark. NEW. The Mark
     // is the unique amulet drop from the boss; this objective makes the
     // pickup an explicit quest beat rather than relying on the player to
     // notice the loot indicator. The loot indicator was bumped to 2.2u
     // and a sndFaolchuLootReveal cue was added in this same session, but
     // belt-and-braces — the journal entry guarantees the player can't
     // walk past the corpse without knowing they should investigate.
     // Prereq [1]: the boss must be defeated before the Mark exists to
     // loot. NOT a prereq for triage (3/4/5) — the player can talk to
     // survivors before looting if they want; only the Aldwyn dialog
     // beat (in buildQuestTopicsForNPC) keys on whether the Mark is in
     // BAG or EQ at conversation time, falling through to the existing
     // rubbing-only flow if the Mark was never picked up.
     // The receive_item event fires from takeLootItem (v61d0 hook) when
     // the Mark enters the player's bag.
     {type:'receive_item', itemName:"The Faolchú's Mark", prereqIndices:[1],
      label:"Investigate what the wolf-shape left behind",
      completionText:"I took it off the seam. A disc of blackened bone, strung on a sinew cord. There's a carving on the face — the strokes look like writing, but the order is wrong, as if the hand that made it didn't know what shape it was making.\n\nAldwyn will likely want to see this."},
     // v61ak: OBJ 3-5 — parallel triage. No prereqIndices between the three
     // (any order within the triage is fine).
     // v61c2: triage prereqs shifted from [0] to [1] — the boss must be
     // defeated first. Survivors are hiding from the Faolchú; their dialog
     // topics for Q7 only surface once it's down. They CAN still be talked
     // to before then, but the talk_to objective won't tick (and Edna's
     // burned-state dialog branches handle the "still hiding" state).
     // v61al: each has a completionText for the "quest updated" popup when
     // that particular subtask completes. First-person journal voice, short
     // — should read as a note in the margin after the scene plays, not a
     // replay of the scene itself.
     // v61d0: indices shifted by +1 (was 2/3/4, now 3/4/5) due to the
     // Mark-loot insertion at obj 2. Prereq still [1] — boss-defeated.
     {type:'read_corpse', corpseId:'bram', zone:'overworld', prereqIndices:[1], label:'See to Bram at the forge',
      completionText:"Bram went out the way he always said he would. Hammer in one hand, goblin's axe still stuck in the other. Edna watched him fall. I saw what she saw.\n\nHe was a good man. He made the first weapon I ever owned. The forge behind him is ash now and I can hear him in it."},
     {type:'talk_to', npc:'Brother Oswin', zone:'overworld', prereqIndices:[1], label:'Check on Brother Oswin at the oratory',
      completionText:"Brother Oswin is alive.\n\nHe stayed inside when it started. The oratory door is stone and heavy. He heard the Glenn child through it and did not open. He knows it was the right tactical choice. He is not treating it that way.\n\nHe said something I need to carry to Aldwyn: \"It wasn't a binding being strained. It was a binding being edited.\" I don't know what it means. He said Aldwyn will."},
     {type:'talk_to', npc:'Edna', zone:'overworld', prereqIndices:[1], label:'Check on Edna at her cottage',
      completionText:"Edna is alive. Her hip is broken and she would not leave. She watched most of it through her window.\n\nShe is holding something she made thirty years ago. She won't tell me what yet. She wants me to check on the others first, and then she says she will tell me the whole of it."},
     // v61ak: OBJ 6 — rubbing handoff, prereq [3,4,5]. Only surfaces once the
     // player has visited all three parallel triage targets.
     // v61c2: prereq indices shifted by +1 due to defeat_boss insertion at 1.
     // v61d0: prereq indices shifted by +1 again (was [2,3,4], now [3,4,5])
     // due to Mark-loot insertion at obj 2. Mark obj NOT included — the
     // rubbing handoff doesn't gate on whether the player looted the Mark,
     // so missing-Mark players can still complete Q7 via rubbing-only flow.
     // Edna's burned dialog branches on which of Bram/Oswin the player has
     // already seen (see SHOP_DIALOG_BURNED.Edna) — the handoff topic itself
     // requires prereqs [3,4,5] so it only appears when the player has
     // completed their full triage loop.
     // v61an: completionText added so the player gets a popup punctuation
     // moment the instant Edna hands over the rubbing.
     {type:'receive_item', itemName:"Edna's Rubbing", prereqIndices:[3,4,5], label:'Return to Edna for the rubbing',
      completionText:"Edna's rubbing is in my bag. Thirty years old; the crease of long storage still in the paper. She made it when she was younger and she never knew what it said. Someone who CAN read it has been writing back to her cottage in the dark.\n\nShe wants this in Aldwyn's hands. Says he's been sitting on a name and will share it when he sees this. Says not to press him on the road — that's a scholar's conversation, not a market one.\n\nIronhaven, then. Aldwyn's office. The door shut."},
     // v61ak: OBJ 7 — carry the rubbing to Aldwyn, prereq [6].
     // v61c2: prereq index shifted by +1.
     // v61d0: prereq index shifted by +1 again — was [5], now [6].
     {type:'talk_to', npc:'Aldwyn', zone:'ironhaven', prereqIndices:[6], label:"Bring the rubbing to Aldwyn in Ironhaven"},
   ],
   // Custom scripted exchange on Aldwyn when Q7 is active. Uses the multi-NPC
   // form (keyed by NPC name) so only Aldwyn triggers this dialog — Oswin and
   // Edna, who are also talk_to targets on Q7, still fire normal talk_to
   // events for objective progression. The prereqIndices inside the Aldwyn
   // entry means the custom dialog only shows once the player has already
   // returned to Edna for the rubbing.
   // v61c2: prereq index shifted from 4 to 5 due to defeat_boss insertion at
   // obj 1 — receive_item is now obj 5 (was obj 4).
   // v61d0: prereq index shifted from 5 to 6 due to Mark-loot insertion at
   // obj 2 — Edna's Rubbing receive_item is now obj 6.
   // The Mark beat (Aldwyn noticing the amulet around the player's neck or
   // in their bag) is built dynamically in buildQuestTopicsForNPC, NOT
   // here — the response/follow tree below is the no-Mark fallback shape.
   customActiveDialog:{
     Aldwyn:{
       prereqIndices:[6],
       label:"Give him Edna's rubbing.",
       response:"She kept this. Thirty years. And a match on her own wall — the same mark, inverted. Look at the strokes here, and here. That\'s not weathering, traveler. That\'s the inversion operator I\'ve only ever seen in one hand. He was in Ashenmoor. In her house. While she slept. He is faster than I estimated.",
       follow:[
         {label:"Is this enough to move on him?",
          response:"On him? No. He has been careful for two hundred years and we have a drawing. But it\'s enough to change how we look. And it\'s enough to change what I can give you. Come to the desk.",
          follow:[
            {label:"The desk.",
             response:"Royal Mage corps commission. Full ink, full seal. It says you act under Lord Caldric\'s authority in matters of anomalous magic across the Gatelands. Dagna will show you her back-room stock when she sees it. The carriage-masters will take you on routes that don\'t exist on any public schedule. And — this matters — the academies must let you in. Whether they like it or not.",
             questDialogComplete:'q7_the_rubbing'}
          ]},
         {label:"Aldred, then. That's the name.",
          response:"That\'s the name he buried. The man who carries it now is called Varek — on the few occasions anyone sees him carry anything. Do not say either name to a stranger. I mean that plainly. Now — the desk.",
          follow:[
            {label:"The desk.",
             response:"Royal Mage corps commission. Full ink, full seal. It says you act under Lord Caldric\'s authority in matters of anomalous magic across the Gatelands. Dagna will show you her back-room stock when she sees it. The carriage-masters will take you on routes that don\'t exist on any public schedule. And — this matters — the academies must let you in. Whether they like it or not.",
             questDialogComplete:'q7_the_rubbing'}
          ]},
       ],
     },
   },
   rewards:{gold:0, xp:1200, items:[
     {name:'Royal Mage Commission',ico:'📜',type:'misc',unique:true,buyPrice:0,sellMult:0,
      desc:'A sealed letter of commission from the Royal Mage Corps, signed by Aldwyn and countersealed with Lord Caldric\'s wax. Grants authority in matters of anomalous magic and access to royal infrastructure: quartermaster back-rooms, uncatalogued carriage routes, and the academies of the Norman line.'},
   ]},
   // v61ad / v61ea note: rewardSpeech + rewardResponses below are NOT reached
   // at runtime — Q7 uses Aldwyn's customActiveDialog → questDialogComplete
   // path (the climactic "The desk." moment), which bypasses the standard
   // active→reward UI entirely. Kept in place deliberately as canonical
   // writing for the *fallback path*: if Q7 ever reverts to the standard
   // talk_to flow (drop customActiveDialog on Aldwyn for Q7), this writing
   // activates immediately. Deleting it would lose Aldwyn's "rest, eat,
   // there's a kitchen" warmth and the Edna-rooting response. Both are
   // canon-quality lines that survive the dead-code label by virtue of
   // being the documented escape hatch.
   rewardSpeech:"Keep the commission on you. Always. It doesn\'t guarantee safety — the opposite, sometimes — but it guarantees doors open. I\'ve told Captain Brynn you\'ll be returning. When you\'re ready, Act Two begins at the gatehouse. Not today. Rest.",
   rewardResponses:[
     {label:"I\'ll rest, then.",
      response:'Do. And eat. You look like you haven\'t. There\'s a kitchen two doors down that feeds the Herald\'s office — tell them you\'re on my ledger.'},
     {label:"Where\'s Edna now?",
      response:'Still at her cottage. She wouldn\'t leave. I\'ve sent a cart; if she wants to come to Ironhaven she can. I don\'t expect her to. Some people root.'},
   ],
   // v61af/ag/ah: quest-update popup text. Written in first-person reflection
   //   — the player looking at the page of their journal, not an NPC speaking.
   // v61ak: acceptText moved from "arrival at burned Ashenmoor" to "leaving
   //   Aldwyn's office after the Q6 reward speech." Q7 now auto-accepts when
   //   Q6 completes (Aldwyn is the quest giver — the rider he heard from is
   //   the inciting event). The "burned to the ground" beat has moved to
   //   obj 0's completionText, which fires as a 'update' popup when the
   //   player physically arrives at Ashenmoor.
   // v61ak: autoAccept + showAcceptPopup flags — Q6's unlocks chain now
   //   includes Q7 (see below), so when Q6 completes, Q7 auto-activates.
   //   Without showAcceptPopup, auto-accepted quests fire only a toast;
   //   with it, the quest-accept popup system (queue + chime + pause) fires
   //   just like a manually-accepted quest. Opt-in so sigil-lore auto-accept
   //   quests stay silent.
   autoAccept:true,
   showAcceptPopup:true,
   acceptText:"Aldwyn heard smoke on the south road — Ashenmoor direction, more than a hearth fire. Probably nothing, he said. But he wouldn't have sent me if he believed that.\n\nI need to get home. Fast.",
   readyText:"Edna's rubbing is in my bag. She's kept it for thirty years and she trusts me with it. The mark on her west wall was made while she slept, and it matches what's on the rubbing — mirrored. Aldwyn needs to see this. Ironhaven, then.",
   completeText:"Royal Mage Corps commission. Full ink, full seal. I have the name now — Aldred, the man he used to be, and Varek the man he is now. Aldwyn was sitting on both of them. The academies must let me in. The carriage-masters have routes I can take. And Aldwyn has told Captain Brynn to expect me back when I'm ready.\n\nNot tonight. Rest tonight. Act Two begins at the gatehouse.",
   unlocks:[],
  },
];QUEST_DEFS.forEach(q=>{if((q.questline||'main')==='main'&&q.id!=='q0_arrival'&&q.id!=='q7_the_rubbing'){q.autoAccept=false;q.announce=true;}}); // v80 — the next main quest is announced with the popup and a marker; the giver still hands it over


// Runtime quest state — tracks per-quest progress
const QS={}; // {questId: {state, objectives:[{current}]}}

// v61o: quest tracking — stores UNTRACKED quest ids only (exceptions). Default is
// "everything is tracked" so the set stays small (or empty) for most players and
// new quests automatically show markers without any activation step. Persists in
// saves under the key `uQ`.
const untrackedQuests = new Set();
function isQuestTracked(id){ return !untrackedQuests.has(id); }
function toggleTrackedQuest(id){
  if(untrackedQuests.has(id)) untrackedQuests.delete(id);
  else untrackedQuests.add(id);
  if(hubOpen) renderQuestLog();
}
// Expose to inline onclick handlers used by renderQuestLog
window.toggleTrackedQuest = toggleTrackedQuest;

function qsInit(){
  QUEST_DEFS.forEach(q=>{
    QS[q.id]={
      // v61aw: Q0 (q0_arrival) is the tutorial opener — auto-active from
      // game start so the enter_zone objective ticks the moment the player
      // emerges from the crypt into the overworld. Q1 used to start
      // 'available' (red cone over Bram's forge from minute one); now it
      // starts 'locked' and Q0's completion unlocks it via the unlocks chain
      // — meaning Bram's marker appears exactly when the player needs it,
      // not during the tutorial when they can't act on it.
      state: q.id==='q0_arrival' ? 'active'
           : 'locked',
      objectives: q.objectives.map(o=>({current:0})),
    };
  });
}
qsInit();

function getQuest(id){return QUEST_DEFS.find(q=>q.id===id);}
function qState(id){return QS[id]?.state||'locked';}

function acceptQuest(id){
  const qs=QS[id];if(!qs||qs.state!=='available')return;
  qs.state='active';
  const q=getQuest(id);
  // v61ad: some quests hand the player a physical quest item at the moment of
  // acceptance rather than as a reward — e.g. Q7 gives the charcoal rubbing
  // that the player then carries to Aldwyn. Works like rewards.items but fires
  // on accept instead of completion. The item object is the same shape as a
  // rewards.items entry; keep it unique:true so it can't be accidentally
  // destroyed, and optionally mark it for autoDelete on questComplete.
  if(q && Array.isArray(q.giveItemsOnAccept)){
    q.giveItemsOnAccept.forEach(it=>bagAdd({...it, qty:1}));
  }
  showMsgLong(`📜 Quest accepted: ${q.title}`,'#ffd700');
  addLog('📜','Quest: '+q.title);
  updateQuestDots();
  // v61aj: fire the "quest accepted" popup. Like ready/complete, this routes
  // through the queue-and-drain system — waits for player to be free (no
  // dialog, shop, etc.) before appearing. For NPC-given quests, this means
  // the popup fires AFTER the dialog closes, not during. For auto-accepted
  // quests like Q7 (accepted on burn-trigger zone entry), there's no dialog
  // to wait for and the popup fires on the next player-free tick.
  showQuestUpdatePopup('accept', q);
}

function checkQuestProgress(event,data){
  QUEST_DEFS.forEach(qDef=>{
    const qs=QS[qDef.id];
    if(!qs||qs.state!=='active')return;
    let changed=false;
    qDef.objectives.forEach((obj,i)=>{
      // v61af: defensive — the migration in _applyLoadData should already
      // guarantee every slot exists, but if anything slips through we'd rather
      // silently skip than throw. One bad objective would otherwise kill the
      // entire iteration and break quest markers/compass until next reload.
      const cur=qs.objectives[i];
      if(!cur || typeof cur.current!=='number') return;
      const needed=obj.count||1;
      if(cur.current>=needed)return;
      // v61ae: prereqIndices — an objective only begins counting once every
      // listed prior-index objective is complete. Used for multi-stage quests
      // like Q7 ("return to Edna" must wait for Bram + Oswin visits, then
      // "bring to Aldwyn" must wait for the Edna return). Prevents the
      // player from accidentally ticking "return to Edna" the first frame
      // after accepting the quest by happening to still be near Edna.
      if(obj.prereqIndices && obj.prereqIndices.length){
        const prereqsDone = obj.prereqIndices.every(idx=>{
          const p = qs.objectives[idx];
          const pNeeded = (qDef.objectives[idx].count||1);
          return p && p.current >= pNeeded;
        });
        if(!prereqsDone) return;
      }
      let matched=false;
      if(event==='kill_in_dungeon'&&obj.type==='kill_in_dungeon'&&data.seed===obj.dungeonSeed){
        cur.current=Math.min(needed,cur.current+1);matched=true;
      } else if(event==='kill_on_dungeon_floor'&&obj.type==='kill_on_dungeon_floor'&&data.seed===obj.dungeonSeed&&data.floor===obj.floor){
        cur.current=Math.min(needed,cur.current+1);matched=true;
      } else if(event==='kill_in_zone'&&obj.type==='kill_in_zone'&&data.zone===obj.zone){
        cur.current=Math.min(needed,cur.current+1);matched=true;
      } else if(event==='talk_to'&&obj.type==='talk_to'&&data.npc===obj.npc&&data.zone===obj.zone){
        cur.current=needed;matched=true;
      } else if(event==='read_corpse'&&obj.type==='read_corpse'&&data.corpseId===obj.corpseId&&data.zone===obj.zone){
        // v61ae: new event type — fires when the player reads a body's flavor
        // text (first-interact on a ZONE_CORPSES entry with a matching id).
        // Currently used by Q7 for Bram. Distinct from talk_to so we don't
        // conflate living NPCs with dead ones.
        cur.current=needed;matched=true;
      } else if(event==='receive_item'&&obj.type==='receive_item'&&data.itemName===obj.itemName){
        // v61ae: fires when the player accepts a mid-quest item handoff via
        // questMidQuestGive. Distinct from talk_to so opening dialog with the
        // giver doesn't advance the objective automatically — the player must
        // explicitly click the handoff topic to receive the item. Used by Q7
        // stage 3 (Edna → rubbing).
        cur.current=needed;matched=true;
      } else if(event==='enter_zone'&&obj.type==='enter_zone'&&data.zone===obj.zone){
        // v61ak: fires when the player enters a specific zone under specific
        // world-state conditions. Used by Q7 obj 0 (arrive at Ashenmoor after
        // the burn). The BURN TRIGGER in goToZone is the only site that fires
        // this event — it only fires on the one moment the burn flips from
        // pending to burned, so there's no risk of it ticking on every zone
        // re-entry. Distinct from talk_to because there's no NPC involved —
        // the act of arriving is what advances the quest.
        cur.current=needed;matched=true;
      } else if(event==='defeat_boss'&&obj.type==='defeat_boss'&&data.bossId===obj.bossId){
        // v61c2: fires when killZoneEnemy resolves a boss enemy. Carries
        // {bossId, zone}. Used by Q7 obj 1 (defeat the Faolchú in burned
        // Ashenmoor). The bossId match is exact-string — Q7's obj 1 reads
        // bossId:'faolchu' to match BOSSES.Faolchu.bossId.
        // Optional zone filter: if the objective specifies a zone, only
        // ticks when the kill happened in that zone. The Faolchú is the
        // only boss in the world right now, but the zone gate keeps the
        // event composable for future bosses in other locations.
        const okZone = !obj.zone || obj.zone===data.zone;
        if(okZone){ cur.current=needed; matched=true; }
      } else if(event==='touch_sigil'&&obj.type==='touch_sigil'){
        // Scope filters — only progress if the touched sigil matches the objective's constraints.
        const okSpell = !obj.spellId || obj.spellId===data.spellId;
        const okFloor = obj.floor===undefined || obj.floor===data.floor;
        const okSeed  = !obj.dungeonSeed || (currentPortal && obj.dungeonSeed===currentPortal.seed);
        if(okSpell && okFloor && okSeed){
          // Two completion modes: firstTouch fires on any touch (rejected or granted);
          // minTier requires the granted/eligible tier to reach that value.
          if(obj.firstTouch){
            cur.current=needed;matched=true;
          } else if(obj.minTier && (data.eligibleTier||0)>=obj.minTier){
            cur.current=needed;matched=true;
          }
        }
      }
      if(matched){
        changed=true;
        // v61ak: per-objective completionText — fires a 'update' popup when
        // this specific objective ticks to its needed count. Lets individual
        // objectives carry reflective beats (arrival at a zone, finding a
        // body, completing a stage) rather than only the whole quest having
        // punctuation moments. Only fires if we just reached needed (not on
        // partial tick-ups like multi-kill objectives). Uses the quest popup
        // queue — waits for player-free state before appearing.
        if(obj.completionText && cur.current>=needed){
          // Synthesize a "mini-qDef" for the popup renderer — it reads title
          // from qDef but readyText/bodyText from this per-objective field.
          showQuestUpdatePopup('update', qDef, {bodyText:obj.completionText});
        }
      }
    });
    if(!changed)return;
    const allDone=qDef.objectives.every((obj,i)=>qs.objectives[i].current>=(obj.count||1));
    if(allDone){
      if(qDef.autoComplete){
        // No NPC turn-in — skip the 'reward' state and resolve inline. completeQuest
        // requires state==='reward' as its gate, so set it transiently here.
        qs.state='reward';
        completeQuest(qDef.id);
      } else {
        qs.state='reward';
        showMsgLong(`✅ Quest ready to turn in: ${qDef.title}`,'#88ff88');
        updateQuestDots();
        // v61af: fire the "ready to turn in" popup.
        // v61ag: no more setTimeout delay here — showQuestUpdatePopup now
        // queues and drains only when the player is free. If this fires mid-
        // dialog (common for receive_item objectives like Q7 stage 3), the
        // popup waits for the dialog to close. Pattern is fire-and-forget.
        showQuestUpdatePopup('ready', qDef);
      }
    }
    if(hubOpen)renderQuestLog();
  });
}

// S340 — Charisma's +2% quest reward gold a point, on every quest's pay: the world's quests and faction services
// (`qTurnIn`), the guild tasks and the two tutorial lines, as well as the legacy chain here. Only this one read it.
function questGold(n){return Math.round((n||0)*(1+(ATTRS.charisma||0)*0.02));}
function completeQuest(id){
  const qs=QS[id];const q=getQuest(id);
  if(!qs||qs.state!=='reward')return;
  qs.state='complete';
  // Give rewards. v61au: Charisma scales quest reward gold by +2% per
  // point. At Charisma 5 a 50g reward becomes 55g; at maxed Charisma 20+
  // it can roughly double. Forward-compat math: Math.round so partial-gold
  // truncates cleanly and saves never see fractional values.
  const _baseGold = q.rewards.gold||0;
  const _finalGold = questGold(_baseGold);
  gold += _finalGold;
  xp+=(q.rewards.xp||0);chkLvl();
  (q.rewards.items||[]).forEach(it=>bagAdd({...it,qty:1}));
  // v61ad: consume quest items given at acceptance time. The item gets taken
  // in-fiction during the turn-in dialog (e.g. Aldwyn takes Edna's rubbing to
  // examine it), so we remove it from the bag here. Matches by exact name.
  if(q && Array.isArray(q.giveItemsOnAccept)){
    q.giveItemsOnAccept.forEach(giveIt=>{
      const idx=BAG.findIndex(bi=>bi && bi.name===giveIt.name);
      if(idx>=0){
        if((BAG[idx].qty||1)>1) BAG[idx].qty -= 1;
        else BAG.splice(idx,1);
      }
    });
  }
  // v61ad: per-quest narrative hooks. Q6 completion flips the Ashenmoor-pending
  // flag — the actual burn fires on next overworld re-entry, not at the moment
  // of turn-in, to preserve the quiet tone of Aldwyn's "I'll send for you" beat
  // and make the loss land when the player physically returns. Q7 completion
  // flips the commissioned flag, which gates Dagna's back-room stock and
  // future carriage-masters and academy access.
  if(id==='q6_binding_stone'){
    worldState.ashenmoorPending = true;
  } else if(id==='q7_the_rubbing'){
    worldState.commissioned = true;
    // v61e6 Session A: cinematic time-lock. Aldwyn's existing turn-in
    // dialog says "you should rest tonight" — force the clock to evening
    // (19:00) so the line is literal, not dependent on what time the
    // player happened to walk into the office. The lighting/sky shift
    // at dusk-onward (Session B) will make this read on screen; for
    // Session A alone the only effect is that downstream scenes (e.g.
    // the Caldric grant scene that fires next) start at evening.
    forceTime('evening');
    // v61e0 — Royal Mage Commission unlock beat. Topology Phase 2: the
    // single-bit commission flag has just flipped, which means 27 zones
    // worth of locked roads (West Track, Bealach Central, Northern Road,
    // La Route Royale West) just opened in one moment. Surface this as
    // a felt event: persistent journal entry + a 5.5s status-line toast
    // in the same warm gold register as quest completions. If the world
    // map happens to be open when Q7 turns in, refresh the locked-edge
    // styling so the lock glyphs disappear in real time.
    addLog('🔓','The royal roads open to you');
    setTimeout(()=>showMsgLong('🛡️ Royal Mage Commission accepted — new roads now open to you','#ffd700'),2400);
    if(typeof wmRefreshLockedEdges==='function') wmRefreshLockedEdges();
    // Live-remove any 3D barrier-crossbeam meshes in the current zone.
    // Q7 turn-in fires inside Ironhaven (at Aldwyn's), so its two royal-
    // network barriers are visible RIGHT NOW. Without this the player
    // would walk from Aldwyn's office to the north or east gate and find
    // a barred crossbeam still standing despite their commission. Other
    // zones' barriers (Ashenmoor west, Hearthwick east) clear naturally
    // on next entry because buildVillage skips _buildCommissionBarrier
    // when worldState.commissioned is already true.
    const curZone=ZONES[activeZoneId];
    if(curZone && curZone.gates){
      curZone.gates.forEach(g=>{
        if(g.barrierMesh && g.barrierMesh.parent){
          g.barrierMesh.parent.remove(g.barrierMesh);
          g.barrierMesh=null;
        }
      });
    }
  }
  // Unlock follow-up quests and notify player. autoAccept quests (sigil-lore) skip
  // the 'available' state and activate immediately — they have no giver NPC, so
  // there's no "go talk to X" step.
  (q.unlocks||[]).forEach(nextId=>{
    if(QS[nextId]&&QS[nextId].state==='locked'){
      const nextQ=getQuest(nextId);
      QS[nextId].state = (nextQ && nextQ.autoAccept) ? 'active' : 'available';
      if(nextQ){
        if(nextQ.autoAccept){
          setTimeout(()=>showMsgLong(`📜 New quest: ${nextQ.title}`,'#c8e88a'),1200);
          // v61ak: showAcceptPopup opt-in for autoAccept quests. Sigil-lore
          // quests keep the silent activation (they already have the sigil
          // overlay as their accept-moment UI); Q7 and future "story" auto-
          // accept quests opt in to the popup so the player gets a proper
          // first-person journal beat when the quest is added.
          if(nextQ.showAcceptPopup){
            showQuestUpdatePopup('accept', nextQ);
          }
        } else {
          const giverZone=nextQ.giverZone||'overworld';
          const zoneName=giverZone==='ironhaven'?'Ironhaven':giverZone==='forest'?'the Forest':'Ashenmoor';
          const location=giverZone!==activeZoneId?` (in ${zoneName})`:'';
          setTimeout(()=>showMsgLong(`📜 New quest available: speak with ${nextQ.giver}${location}`,'#c8e88a'),1200);
        }
      }
    }
  });
  // Tail the completion toast with the most salient reward. Gold-rich quests show gold;
  // sigil quests award XP only, so those show XP instead of "+0g".
  const tail = (q.rewards.gold>0) ? ` +${q.rewards.gold}g`
              : (q.rewards.xp>0)  ? ` +${q.rewards.xp} XP`
              : '';
  showMsgLong(`✅ ${q.title} complete!${tail}`,'#ffd700');
  addLog('✅','Completed quest: '+q.title);
  updateQuestDots();
  if(hubOpen)renderQuestLog();
  // v61af: fire the completion popup.
  // v61ag: no setTimeout — the queue-and-drain system waits for the player
  // to exit the turn-in dialog naturally before the popup appears.
  showQuestUpdatePopup('complete', q);
}

// v80 S133 — one journal: the world's quests (towns, guilds, factions, the tutorial lines) in the same cards as the main story
function renderWorldJournal(body){
  try{if(typeof WORLD==='undefined')return;const J=(worldState.quests||[]);const act=J.filter(q=>!q.turnedIn);
    const card=(q)=>{const state=q.done?'reward':'active';const badge=q.done?'<span class="qlog-badge qbadge-active">! Turn In</span>':'<span class="qlog-badge qbadge-active">Active</span>';
      const giverLine=q.giver?`<div class="qlog-giver">Given by ${q.giver}</div>`:'';const desc=q.desc?`<div class="qlog-desc">${q.desc}</div>`:'';
      const obj=`<div class="qlog-obj${q.done?' done':''}"><span class="qobj-check">${q.done?'✓':'○'}</span>${q.done?`Report to ${q.giver}`:(q.objective||'')}</div>`;
      const rw=q.reward?`<div class="qlog-reward">Reward: ${q.reward}🪙${q.tut&&!q.turnedIn?' on completion':''}</div>`:'';
      return `<div class="qlog-card qactive"><span class="qlog-pin">·</span><div class="qlog-title"><span class="qlog-title-text">${q.title}</span>${badge}</div>${giverLine}${desc}${obj}${rw}</div>`;};
    const header=(t,sub)=>{const h=document.createElement('div');h.className='qlog-section';h.style.cssText='color:#8a7a5a;font-size:10px;letter-spacing:.22em;text-transform:uppercase;margin:14px 0 6px;padding-bottom:3px;border-bottom:1px solid #3a2f1f';h.innerHTML=t+(sub?` <span style="letter-spacing:0;text-transform:none;color:#6a5a40">— ${sub}</span>`:'');body.appendChild(h);};
    if(act.length){header('In the world','towns, guilds, the factions');const wrap=document.createElement('div');wrap.innerHTML=act.map(card).join('');while(wrap.firstChild)body.appendChild(wrap.firstChild);}
    const leads=WORLD.tutLeads();if(leads.length){header('Leads','optional');const wrap=document.createElement('div');wrap.innerHTML=leads.map(l=>`<div class="qlog-card"><span class="qlog-pin">·</span><div class="qlog-title"><span class="qlog-title-text">${l.title}</span><span class="qlog-badge qbadge-locked">Lead</span></div><div class="qlog-desc">${l.text}</div></div>`).join('');while(wrap.firstChild)body.appendChild(wrap.firstChild);}
  }catch(e){console.warn('journal',e);}
}
function renderQuestLog(){
  const body=document.getElementById('qlog-body');if(!body)return;
  body.innerHTML='';
  // v80 — the story never dead-ends: if the crypt is done and First Blood is still locked, open it; and say where to go
  try{if(qState('q0_arrival')==='complete'&&qState('q1_first_blood')==='locked'&&QS['q1_first_blood'])QS['q1_first_blood'].state='available';}catch(e){}
  const visible=QUEST_DEFS.filter(q=>qState(q.id)!=='locked');
  if(!visible.length){renderWorldJournal(body);if(!body.children.length)body.innerHTML='<div class="qlog-empty">No quests yet.<br>Ask a town\'s lord for work, or the guilds.</div>';return;}
  // v61n: group by questline. Quests without a questline field are "main" (the
  // original 6-quest chain); sigil quests live under 'sigil_lore'. Order: main
  // first, then sigil_lore, then anything else that gets added later.
  const QUESTLINE_LABELS={main:'Main Story', sigil_lore:'Sigil Lore'};
  const QUESTLINE_ORDER=['main','sigil_lore'];
  const grouped={};
  visible.forEach(q=>{
    const line=q.questline||'main';
    (grouped[line]=grouped[line]||[]).push(q);
  });
  const orderedLines=[...QUESTLINE_ORDER.filter(l=>grouped[l]),
                       ...Object.keys(grouped).filter(l=>!QUESTLINE_ORDER.includes(l))];
  orderedLines.forEach(line=>{
    const header=document.createElement('div');
    header.className='qlog-section';
    header.style.cssText='color:#8a7a5a;font-size:10px;letter-spacing:.22em;text-transform:uppercase;margin:14px 0 6px;padding-bottom:3px;border-bottom:1px solid #3a2f1f';
    header.textContent=QUESTLINE_LABELS[line]||line;
    body.appendChild(header);
    grouped[line].forEach(qDef=>{
      const qs=QS[qDef.id];const state=qs.state;
      const tracked=isQuestTracked(qDef.id);
      const hasMarkerPotential = state==='active'||state==='available'||state==='reward';
      const div=document.createElement('div');
      // v61p: classes drive all visual state (tracked/untracked pin strip, clickable
      // cursor, hover highlight) via CSS instead of inline styles. The whole card is
      // the click target — a much bigger hit area than the old 11px pin emoji.
      const classes=['qlog-quest'];
      if(state==='active'||state==='reward') classes.push('qactive');
      else if(state==='complete') classes.push('qcomplete');
      if(hasMarkerPotential) classes.push('qtrackable');
      if(hasMarkerPotential && !tracked) classes.push('quntracked');
      div.className=classes.join(' ');
      if(hasMarkerPotential){
        div.onclick = (e)=>{ e.stopPropagation(); toggleTrackedQuest(qDef.id); };
        div.title = tracked ? 'Tracking — click to hide from compass' : 'Not tracked — click to show on compass';
      }
      const badge=state==='complete'?'<span class="qlog-badge qbadge-done">✓ Complete</span>':
                   state==='reward'?'<span class="qlog-badge qbadge-active">! Turn In</span>':
                   state==='active'?'<span class="qlog-badge qbadge-active">Active</span>':
                   '<span class="qlog-badge qbadge-locked">Available</span>';
      // Pin strip — present on every card but visually distinct only for trackable ones.
      // Complete/locked cards get a subtle checkmark/lock rather than the pin.
      const pinGlyph = !hasMarkerPotential
        ? (state==='complete' ? '✓' : '·')
        : (tracked ? '📍' : '○');
      const pin = `<div class="qlog-pin">${pinGlyph}</div>`;
      let objHtml='';
      qDef.objectives.forEach((obj,i)=>{
        const cur=qs.objectives[i].current;const max=obj.count||1;
        const done=cur>=max;
        // v61al: hide objectives whose prereqs aren't complete yet. Prevents
        // the quest log from spoiling upcoming stages (e.g. "Bring the rubbing
        // to Aldwyn" appearing before the player has talked to Edna). Completed
        // objectives stay visible (crossed out) as a "what I've done so far"
        // record. Objectives with no prereqIndices are always visible (the
        // default for parallel / entry-stage objectives).
        if(!done && obj.prereqIndices && obj.prereqIndices.length){
          const prereqsDone = obj.prereqIndices.every(idx=>{
            const p = qs.objectives[idx];
            const pNeeded = (qDef.objectives[idx].count||1);
            return p && p.current >= pNeeded;
          });
          if(!prereqsDone) return; // skip rendering this objective
        }
        const label=obj.label.replace(/\(0\/\d+\)/,`(${cur}/${max})`).replace(/\(\d+\/(\d+)\)/,`(${cur}/$1)`);
        objHtml+=`<div class="qlog-obj${done?' done':''}"><span class="qobj-check">${done?'✓':'○'}</span>${label}</div>`;
      });
      if(state==='available'&&qDef.giver&&qDef.giver!=='—'){const ZN={overworld:'Ashenmoor',ironhaven:'Ironhaven',ashenmoor:'Ashenmoor'};objHtml=`<div class="qlog-obj"><span class="qobj-check">○</span>Speak with ${qDef.giver} in ${ZN[qDef.giverZone]||qDef.giverZone||'the village'} to begin</div>`;} // v80 S133 — the old NEXT box, folded in
      const rewardStr=[(qDef.rewards.gold?`${qDef.rewards.gold}🪙`:''),
        (qDef.rewards.xp?`${qDef.rewards.xp} XP`:''),
        ...(qDef.rewards.items||[]).map(it=>it.name)].filter(Boolean).join(' · ');
      // Sigil-lore quests have no giver NPC — suppress the "Given by —" line for them.
      const giverLine = qDef.giver && qDef.giver!=='—' ? `<div class="qlog-giver">Given by ${qDef.giver}</div>` : '';
      // v61ay: description block — italic flavor text, only shown for
      // active/reward state. Hidden on locked (no spoilers), available
      // (description already painted by NPC dialog when offered), and
      // complete (avoids visual clutter in a long quest log). For Q0
      // and other autoComplete / no-giver quests this is the player's
      // own journal entry to themselves.
      const descBlock = (state==='active'||state==='reward') && qDef.description
        ? `<div class="qlog-desc">${qDef.description}</div>`
        : '';
      // S487 — what the journal holds of this quest, in order, each line under its date
      const _esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const _jl=(typeof journalOf==='function')?journalOf(qDef.id):[];
      const jBlock=_jl.length?`<div class="qlog-journal" style="margin:6px 0 4px;padding-left:8px;border-left:2px solid rgba(138,122,90,.35)">${_jl.map(e=>`<div style="margin:3px 0;font-size:11px;line-height:1.4"><span style="color:#8a7a5a;font-size:10px">${_esc(gameDateLine(e.t,e.tod))}</span><br><i>${_esc(e.text)}</i></div>`).join('')}</div>`:'';
      div.innerHTML=`${pin}<div class="qlog-title"><span class="qlog-title-text">${qDef.title}</span>${badge}</div>
        ${giverLine}
        ${descBlock}
        ${objHtml}
        ${jBlock}
        ${rewardStr?`<div class="qlog-reward">Reward: ${rewardStr}</div>`:''}`;
      body.appendChild(div);
    });
  });  renderWorldJournal(body);
}

// ── NPC QUEST DOT STATES ─────────────────────────────────────
// Dot colors: hidden=no quest interaction, gold=has quest/reward, green=quest accepted (active)
function questDotColor(npcName, zone){
  // Check if any quest is 'reward' state and this NPC is the giver
  const rewardQ=QUEST_DEFS.find(q=>q.giver===npcName&&q.giverZone===zone&&qState(q.id)==='reward');
  if(rewardQ)return 0xffdd00; // gold — turn-in available
  const availQ=QUEST_DEFS.find(q=>q.giver===npcName&&q.giverZone===zone&&qState(q.id)==='available');
  if(availQ)return 0xffdd00; // gold — quest available
  const activeQ=QUEST_DEFS.find(q=>q.giver===npcName&&q.giverZone===zone&&qState(q.id)==='active');
  if(activeQ)return 0x44aaff; // blue — quest active (reminder dot)
  return null; // no dot
}
function updateQuestDots(){
  OW_NPCS.forEach(n=>{
    const col=questDotColor(n.def.name,'overworld');
    n.dot.visible=col!==null;
    if(col)n.dot.material.color.setHex(col);
  });
  if(typeof IRONHAVEN_NPCS!=='undefined'){
    IRONHAVEN_NPCS.forEach(n=>{
      const col=questDotColor(n.def.name,'ironhaven');
      n.dot.visible=col!==null;
      if(col)n.dot.material.color.setHex(col);
    });
  }
  // Indoor shopkeepers — they have no dot meshes, handled via dialog only
}

// ── COMPASS ─────────────────────────────────────────────────
//
// v61ap: Oblivion-style red/green quest-marker palette.
//
//   QM_COL_CROSS   (red)   = the target is reached by transitioning into
//                            another level/scene. Gates between zones,
//                            dungeon portals on the surface, and dungeon
//                            staircases between floors all qualify — anything
//                            where you have to pass through a load boundary
//                            before you can stand next to the thing.
//   QM_COL_INZONE  (green) = the target is in your current scene. Walk to it.
//                            NPCs, sigils, corpses, items, in-zone givers.
//
// Single source of truth for both the compass chevron fill and the in-world
// waypoint cone material. Each marker push in getActiveQuestMarkers picks one
// of these two colors. Label text uses a softer rgba variant so it reads
// against the dark compass pill without competing with the bright chevron.
const QM_COL_CROSS   = '#ff5544';
const QM_COL_INZONE  = '#66dd66';
const QM_LABEL_CROSS  = 'rgba(255,140,120,0.85)';
const QM_LABEL_INZONE = 'rgba(150,230,150,0.85)';
function _qmLabelCol(col){
  if(col===QM_COL_CROSS)  return QM_LABEL_CROSS;
  if(col===QM_COL_INZONE) return QM_LABEL_INZONE;
  return 'rgba(255,220,100,0.75)'; // legacy fallback for any stray yellow marker
}

const compassEl=document.getElementById('compass');
const compassCtx=compassEl?compassEl.getContext('2d'):null;
function drawCompass(){
  if(!compassCtx||!started)return;
  const W=200,H=38;
  compassCtx.clearRect(0,0,W,H);
  // Background pill
  compassCtx.fillStyle='rgba(0,0,0,.62)';
  compassCtx.beginPath();
  if(compassCtx.roundRect){compassCtx.roundRect(0,0,W,H,8);}
  else{compassCtx.rect(0,0,W,H);}
  compassCtx.fill();

  // Cardinal directions — map yaw to a scroll position
  // yaw=0 → facing -Z (North), yaw=π → facing +Z (South)
  // We show a 120° window of the compass
  const dirs=[
    {label:'N',angle:0},{label:'NE',angle:Math.PI/4},{label:'E',angle:Math.PI/2},
    {label:'SE',angle:3*Math.PI/4},{label:'S',angle:Math.PI},{label:'SW',angle:5*Math.PI/4},
    {label:'W',angle:3*Math.PI/2},{label:'NW',angle:7*Math.PI/4},
  ];
  const playerYaw=((-yaw)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);// normalize 0–2π, 0=N
  const FOV=Math.PI*0.75;// visible arc = 135°
  compassCtx.font='bold 10px sans-serif';compassCtx.textAlign='center';
  dirs.forEach(d=>{
    let delta=d.angle-playerYaw;
    while(delta>Math.PI)delta-=Math.PI*2;
    while(delta<-Math.PI)delta+=Math.PI*2;
    if(Math.abs(delta)>FOV/2)return;
    const x=W/2+delta/FOV*W;
    const isCardinal=d.label.length===1;
    compassCtx.fillStyle=isCardinal?'#ffd700':'#888';
    compassCtx.font=`bold ${isCardinal?11:9}px sans-serif`;
    compassCtx.fillText(d.label,x,isCardinal?14:16);
  });
  // Center tick
  compassCtx.fillStyle='#c8a84a';
  compassCtx.fillRect(W/2-1,2,2,6);

  // Quest markers — only meaningful in overworld/zone contexts, not interiors
  // (interior px/pz are room-local coords, not world coords)
  if(!isInterior()){
  // v80 — places within 200 steps: a glyph on the compass, blurred until discovered, with the steps left
  try{if(typeof WORLD!=='undefined'&&WORLD.compassPlaces){const W=compassEl.width,H=compassEl.height;for(const p of WORLD.compassPlaces()){const ang=Math.atan2(p.x-px,-(p.z-pz));let delta=ang-(-yaw);while(delta>Math.PI)delta-=Math.PI*2;while(delta<-Math.PI)delta+=Math.PI*2;if(Math.abs(delta)>Math.PI*.5)continue;const x=W/2+delta/(Math.PI*.5)*(W/2-8);
    compassCtx.save();compassCtx.textAlign='center';if(!p.found){compassCtx.filter='blur(1.2px)';compassCtx.globalAlpha=.55;}compassCtx.font='11px sans-serif';compassCtx.fillStyle=p.found?'#e8dcc0':'#a89878';compassCtx.fillText(p.glyph,x,22);compassCtx.filter='none';compassCtx.globalAlpha=p.found?.9:.5;compassCtx.font='bold 6px sans-serif';compassCtx.fillStyle='#e8dcc0';compassCtx.fillText(Math.round(p.d)+'',x,29);compassCtx.restore();}}}catch(e){}
  const activeMarkers=getActiveQuestMarkers();
  activeMarkers.forEach(m=>{
    const dx=m.x-px,dz=m.z-pz;
    // Bearing from North (-Z axis), clockwise positive — matches cardinal convention
    // atan2(dx, -dz): target north of player → dz<0 → -dz>0 → angle≈0 ✓
    //                 target east of player  → dx>0 → angle≈π/2 ✓
    const markerAngle=(Math.atan2(dx,-dz)+Math.PI*2)%(Math.PI*2);
    let delta=markerAngle-playerYaw;
    while(delta>Math.PI)delta-=Math.PI*2;
    while(delta<-Math.PI)delta+=Math.PI*2;
    const onscreen=Math.abs(delta)<=FOV/2;
    compassCtx.fillStyle=m.col||'#ffdd44';
    compassCtx.textAlign='center';
    if(onscreen){
      const x=W/2+delta/FOV*W;
      if(m.glyph){compassCtx.font='bold 12px sans-serif';compassCtx.fillText(m.glyph,x,33);compassCtx.fillRect(x-4,35,8,2);} // v80 S138 — the place's glyph, underlined in the marker's colour
      else{compassCtx.font='bold 13px sans-serif';
      compassCtx.fillText('▾',x,32);}
      // Label — truncate long names
      if(m.label){
        const lbl=m.label.length>14?m.label.slice(0,13)+'…':m.label;
        compassCtx.font='7px sans-serif';
        compassCtx.fillStyle=_qmLabelCol(m.col);
        compassCtx.fillText(lbl,x,H-2);
        const _dm=Math.round(Math.hypot(m.x-px,m.z-pz));if(_dm>2){compassCtx.font='bold 7px sans-serif';compassCtx.fillStyle='#e8dcc0';compassCtx.fillText(_dm>=1000?(_dm/1000).toFixed(1)+'km':_dm+' steps',x,H-10);} // v80 — steps
      }
    } else {
      compassCtx.font='bold 13px sans-serif';
      compassCtx.fillText(delta>0?'▸':'◂',delta>0?W-8:8,32);
    }
  });
  } else {
  // v61ao/aq: interior compass branch.
  //
  // Two modes:
  //
  //   (a) An active marker resolves to the current interior's keeper
  //       (marker.indoor === true). The keeper is in the same room as the
  //       player — paint a green chevron pointing at intNPCPos using the
  //       same room-local coords the player is moving through. This is the
  //       indoor counterpart to the outdoor green NPC chevron, and it
  //       pairs with the dedicated indoor cone in tickQuestWaypoints.
  //
  //   (b) No indoor marker, but there ARE active outdoor markers. Paint a
  //       single red "Exit" arrow pointing at the room's +Z door so the
  //       player knows there's still something to chase outside. Red is
  //       used because the door is a level-transition (interior →
  //       overworld) and red is the palette's "you must transition to
  //       reach your goal" signal everywhere else.
  //
  // We don't try to mix modes — if (a) fires, the player has reached their
  // turn-in target; the exit-arrow would be redundant noise. They can leave
  // when they're ready and the outdoor compass will reorient.
  //
  // The bearing in both modes is computed from current player room-local
  // (px, pz) to the target's room-local position. For the door, that's
  // (_roomW/2, _roomD); for an indoor NPC, that's intNPCPos. Everything
  // here uses the same coordinate space — the world-coord vs room-coord
  // mismatch that broke outdoor markers indoors doesn't apply.
  const activeMarkers=getActiveQuestMarkers();
  const indoorMarker=activeMarkers.find(m=>m.indoor);
  if(indoorMarker){
    const dx=indoorMarker.x-px, dz=indoorMarker.z-pz;
    const markerAngle=(Math.atan2(dx,-dz)+Math.PI*2)%(Math.PI*2);
    let delta=markerAngle-playerYaw;
    while(delta>Math.PI)delta-=Math.PI*2;
    while(delta<-Math.PI)delta+=Math.PI*2;
    const onscreen=Math.abs(delta)<=FOV/2;
    compassCtx.fillStyle=indoorMarker.col||QM_COL_INZONE;
    compassCtx.textAlign='center';
    if(onscreen){
      const x=W/2+delta/FOV*W;
      compassCtx.font='bold 13px sans-serif';
      compassCtx.fillText('▾',x,32);
      if(indoorMarker.label){
        const lbl=indoorMarker.label.length>14?indoorMarker.label.slice(0,13)+'…':indoorMarker.label;
        compassCtx.font='7px sans-serif';
        compassCtx.fillStyle=_qmLabelCol(indoorMarker.col);
        compassCtx.fillText(lbl,x,H-2);
      }
    } else {
      compassCtx.font='bold 13px sans-serif';
      compassCtx.fillText(delta>0?'▸':'◂',delta>0?W-8:8,32);
    }
  } else if(activeMarkers.length>0 && currentHouse){
    // v61ar: Exit arrow uses the cross-zone red palette, not its prior
    // light-blue. The door is a level-transition affordance — passing
    // through it loads the outdoor scene — and that's exactly what red
    // signals everywhere else (zone gates, dungeon portals, dungeon
    // staircases). Keeping it blue split the palette without earning the
    // distinction; making it red makes the rule "red = you must transition
    // to reach your goal" hold uniformly.
    const doorX=(currentHouse._roomW||10)/2;
    const doorZ=(currentHouse._roomD||9);
    const dx=doorX-px, dz=doorZ-pz;
    const markerAngle=(Math.atan2(dx,-dz)+Math.PI*2)%(Math.PI*2);
    let delta=markerAngle-playerYaw;
    while(delta>Math.PI)delta-=Math.PI*2;
    while(delta<-Math.PI)delta+=Math.PI*2;
    const onscreen=Math.abs(delta)<=FOV/2;
    compassCtx.fillStyle=QM_COL_CROSS;
    compassCtx.textAlign='center';
    if(onscreen){
      const x=W/2+delta/FOV*W;
      compassCtx.font='bold 13px sans-serif';
      compassCtx.fillText('▾',x,32);
      compassCtx.font='7px sans-serif';
      compassCtx.fillStyle=QM_LABEL_CROSS;
      compassCtx.fillText('Exit',x,H-2);
    } else {
      compassCtx.font='bold 13px sans-serif';
      compassCtx.fillText(delta>0?'▸':'◂',delta>0?W-8:8,32);
    }
  }
  } // end if/else isInterior
}

// v61e7 — Day/Night Session B: sundial HUD glyph.
// Design call A — disc with a moving sun (and moon below the horizon at
// night). Reads the in-game clock continuously rather than snapping to
// 8 discrete states; the eight states from gameTimeOfDay() are the
// "lookup names" but the visual is a continuous angular position so the
// sun appears to drift naturally across the sky.
//
// The disc is a circle with a horizon line. Sun arcs from the eastern
// horizon (left) at dawn (hour 5) up to apex at midday (hour 12) and
// down to the western horizon (right) at dusk (hour 19). Below the
// horizon, a moon traces the same arc inverted (hours 19 → 5, with
// midnight at the bottom).
//
// Sky tint: subtle background-of-disc shift between day and night
// matches the lighting interpolation. So at full day the disc has a
// warm sky behind the sun; at full night it has a deep blue-black
// behind the moon. Reads at a glance.
const sundialEl = document.getElementById('sundial');
const sundialCtx = sundialEl ? sundialEl.getContext('2d') : null;
function drawSundial(){
  if(!sundialCtx || !started) return;
  const W = sundialEl.width, H = sundialEl.height;
  sundialCtx.clearRect(0, 0, W, H);
  const cx = W/2, cy = H/2 + 1, r = Math.min(W, H)/2 - 3;
  const h = (typeof gameHour === 'function') ? gameHour() : 12;
  // Continuous "phase" 0..1 across day-arc (5..19) and night-arc (19..5).
  // Day phase: 0 at dawn (h=5), 1 at dusk (h=19).
  // Night phase: 0 at h=19, 1 at h=5 next day (with wrap).
  const isDay = (h >= 5 && h < 19);
  let phase;
  if(isDay){
    phase = (h - 5) / 14; // dawn → dusk
  } else {
    phase = (h >= 19) ? (h - 19) / 10 : (h + 5) / 10; // dusk → dawn
  }
  // Sky tint behind the disc — interpolates day↔night using the same
  // night factor the lighting interpolator uses, so the glyph reads
  // in step with the actual rendered scene.
  const t = (typeof _nightFactor === 'function') ? _nightFactor() : (isDay ? 0 : 1);
  // Day disc color: warm parchment. Night disc: deep cool blue.
  const dayR=212, dayG=196, dayB=158;     // #d4c49e
  const nightR=22, nightG=28, nightB=48;  // #161c30
  const discR = Math.round(dayR*(1-t) + nightR*t);
  const discG = Math.round(dayG*(1-t) + nightG*t);
  const discB = Math.round(dayB*(1-t) + nightB*t);
  // Outer ring (subtle border).
  sundialCtx.fillStyle = 'rgba(0,0,0,.6)';
  sundialCtx.beginPath();
  sundialCtx.arc(cx, cy, r+2, 0, Math.PI*2);
  sundialCtx.fill();
  // Disc fill (sky tint).
  sundialCtx.fillStyle = `rgb(${discR},${discG},${discB})`;
  sundialCtx.beginPath();
  sundialCtx.arc(cx, cy, r, 0, Math.PI*2);
  sundialCtx.fill();
  // Horizon line — splits day-half (top) from night-half (bottom).
  sundialCtx.strokeStyle = 'rgba(255,255,255,.18)';
  sundialCtx.lineWidth = 0.8;
  sundialCtx.beginPath();
  sundialCtx.moveTo(cx-r+1, cy);
  sundialCtx.lineTo(cx+r-1, cy);
  sundialCtx.stroke();
  // Sun/moon position. Phase 0=east (left), 0.5=apex, 1=west (right).
  // Above the horizon for day, below for night. We use a half-circle arc.
  const angle = Math.PI - phase * Math.PI; // π=west, 0=east via (π - phase·π)... wait, fix:
  // phase=0 → angle=π (left/east at horizon)
  // phase=0.5 → angle=π/2 (top apex)
  // phase=1 → angle=0 (right/west at horizon)
  const a = Math.PI - phase * Math.PI;
  const orbX = cx + Math.cos(a) * (r * 0.78);
  const orbYRaw = Math.sin(a) * (r * 0.78);
  const orbY = isDay ? (cy - orbYRaw) : (cy + orbYRaw); // mirror below horizon at night
  // Sun glyph: bright warm disc with subtle rays at apex.
  // Moon glyph: pale crescent.
  if(isDay){
    // Sun
    sundialCtx.fillStyle = '#ffe080';
    sundialCtx.beginPath();
    sundialCtx.arc(orbX, orbY, 3.2, 0, Math.PI*2);
    sundialCtx.fill();
    // Faint glow ring
    sundialCtx.fillStyle = 'rgba(255,224,128,.25)';
    sundialCtx.beginPath();
    sundialCtx.arc(orbX, orbY, 5, 0, Math.PI*2);
    sundialCtx.fill();
  } else {
    // Moon — full disc with one shaded edge for crescent feel
    sundialCtx.fillStyle = '#dde4f0';
    sundialCtx.beginPath();
    sundialCtx.arc(orbX, orbY, 3.0, 0, Math.PI*2);
    sundialCtx.fill();
    // Shadow nibble
    sundialCtx.fillStyle = `rgb(${discR},${discG},${discB})`;
    sundialCtx.beginPath();
    sundialCtx.arc(orbX+1.2, orbY-0.2, 2.4, 0, Math.PI*2);
    sundialCtx.fill();
  }
}

function getActiveQuestMarkers(){
  const markers=[];
  if(typeof WORLD!=='undefined'&&typeof fxOn==='function'&&fxOn('seamsight')){const d=WORLD.nearestSigilDoor&&WORLD.nearestSigilDoor();if(d)markers.push({x:d.x,z:d.z,col:'#a0c8ff',label:'a warm stone'});} // v80 — the Weaver's Eye
  if(typeof WORLD!=='undefined'&&WORLD.compassMarkers){try{WORLD.compassMarkers().forEach(m=>markers.push(m));}catch(e){}} // v80 — the world's live objectives: red doors, green targets

  // Helper: get the gate position pointing toward a target zone from current zone.
  // v61m: rewritten to use the MAP_EDGES graph + ZONES[id].gates (uniform since v61d)
  // so quest markers work in every live zone, not just overworld/forest/ironhaven.
  // BFS picks the correct first-hop gate along multi-zone routes.
  function gateTowardZone(targetZone){
    const nextZone = nextHopZone(activeZoneId, targetZone);
    if(!nextZone)return null;
    const activeGates = (ZONES[activeZoneId]&&ZONES[activeZoneId].gates)||ASHENMOOR_GATES;
    const gate = activeGates.find(g=>g.targetZone===nextZone);
    return gate?{x:gate.x,z:gate.z}:null;
  }

  // Helper: find NPC position by name in a given zone.
  // v61m: primary lookup is ZONES[zone].npcs, which every builder populates since
  // v61d — covers Ashenmoor, Hearthwick, Deepwood, Ironhaven, and any zone added
  // via registerPlaceholderZone/buildVillage/buildWildernessZone/buildTown.
  // HOUSES/IRONHAVEN_HOUSES remain as interior-keeper fallbacks (shopkeepers who
  // live inside houses are anchored to their door position).
  // v61aq: returns {x, z, indoors} so the marker push can pick red (indoors,
  // door is a transition affordance) vs green (outdoors, walk-to-target).
  // The zoneNpcs branch returns a live mesh position → indoors:false. The
  // HOUSES branch returns a door position because the NPC lives inside →
  // indoors:true. Edna in normal mode hits zoneNpcs and is treated as
  // outdoors; Edna in burned mode (when zoneNpcs no longer contains her)
  // falls to the HOUSES branch and is treated as indoors. That's the right
  // behaviour either way.
  function findNPCPos(name,zone){
    const zoneNpcs = (ZONES[zone]&&ZONES[zone].npcs)||null;
    if(zoneNpcs){
      const n = zoneNpcs.find(n=>n.def&&n.def.name===name);
      if(n&&n.g&&n.g.position){
        // v61e9 — if the NPC is currently retreated (post-Q7 night),
        // route the marker to their keeper-house door if they have one.
        // Falls through to the normal "no house, return their position
        // as outdoor" path for non-keepers; the marker still reads the
        // same coordinate but the player gets a "no NPC visible there"
        // moment which the wait-button affordance addresses.
        if(n._retreated){
          if(zone==='overworld'){
            const hh=HOUSES.find(h=>h.keeper===name);
            if(hh) return {x:hh.doorX,z:hh.doorZ,indoors:true};
          }
          if(zone==='ironhaven'){
            const hh=IRONHAVEN_HOUSES.find(h=>h.keeper===name);
            if(hh) return {x:hh.doorX,z:hh.doorZ,indoors:true};
          }
          // Non-keepers (Edna, Tom, Finn etc.) — return their day pos
          // with indoors:true so the marker color picks up the cross-
          // color (not the in-zone color) and the player understands
          // the NPC isn't currently reachable.
          return {x:n.g.position.x,z:n.g.position.z,indoors:true};
        }
        return{x:n.g.position.x,z:n.g.position.z,indoors:false};
      }
    }
    if(zone==='overworld'){
      const house=HOUSES.find(h=>h.keeper===name);
      if(house)return{x:house.doorX,z:house.doorZ,indoors:true};
    }
    if(zone==='ironhaven'){
      const house=IRONHAVEN_HOUSES.find(h=>h.keeper===name);
      if(house)return{x:house.doorX,z:house.doorZ,indoors:true};
    }
    return null;
  }

  // v61aq: helper for any same-zone NPC marker (giver/talk_to/receive_item).
  // Three cases:
  //   1. NPC is outdoors (zoneNpcs hit) → green marker at their world pos.
  //   2. NPC lives indoors AND player is in that NPC's interior → green
  //      marker at intNPCPos (indoor mesh pos), tagged `indoor:true` so the
  //      cone code routes it to the dedicated indoor cone in interiorScene
  //      and the compass picks up the green chevron via its indoor branch.
  //   3. NPC lives indoors AND player is NOT in that interior → red marker
  //      at the door. The door is a level-transition affordance, so red
  //      matches the "you have to go through something to reach it" rule.
  function pushNPCMarker(name, zone, label){
    const pos = findNPCPos(name, zone);
    if(!pos) return;
    const inThisInterior = isInterior() && currentHouse && currentHouse.keeper===name;
    if(inThisInterior){
      markers.push({x:intNPCPos.x, z:intNPCPos.z, col:QM_COL_INZONE, label, indoor:true});
    } else if(pos.indoors){
      markers.push({x:pos.x, z:pos.z, col:QM_COL_CROSS, label});
    } else {
      markers.push({x:pos.x, z:pos.z, col:QM_COL_INZONE, label});
    }
  }

  QUEST_DEFS.forEach(qDef=>{
    const qs=QS[qDef.id];
    if(!qs||qs.state==='locked'||qs.state==='complete')return;
    // v61o: honour the per-quest tracking toggle — untracked quests still exist
    // in the log but stop contributing to the compass so the player can declutter.
    if(!isQuestTracked(qDef.id))return;

    const giverZone=qDef.giverZone||'overworld';

    // Dungeon context — when inside a dungeon, quest markers point at in-dungeon landmarks
    // (sigils for reach-floor/touch-sigil objectives) rather than world-map locations.
    // v61n: when the target is on a floor other than currentFloor, point at the staircase
    // instead (the landmark that will get you there). Also handles the new touch_sigil
    // objective type used by Q2 and sigil-lore quests.
    // v61p: also handle reward-state quests (objectives done, awaiting NPC turn-in) —
    // point at the ascending staircase from floor 2 or the dungeon entrance from floor 1
    // so the compass keeps guiding the player out to find their giver.
    if(activeZoneId==='dungeon'){
      if(qs.state==='reward'){
        if(currentFloor===2 && typeof dStairC!=='undefined' && dStairC!==null){
          markers.push({x:dStairC,z:dStairR,col:QM_COL_CROSS,label:'Ascend'});
        } else if(currentFloor===1 && typeof dEntranceX!=='undefined'){
          markers.push({x:dEntranceX,z:dEntranceZ,col:QM_COL_CROSS,label:'Exit'});
        }
        return;
      }
      if(qs.state!=='active')return;
      const curSeed=currentPortal?currentPortal.seed:null;
      qDef.objectives.forEach((obj,i)=>{
        if(qs.objectives[i].current>=(obj.count||1))return;
        if(obj.dungeonSeed!==undefined && obj.dungeonSeed!==curSeed)return;
        const stairDir = floor => floor>currentFloor ? 'Descend' : 'Ascend';
        if(obj.type==='touch_sigil'){
          // Find matching sigil(s) in this dungeon — spellId scopes to a specific one,
          // else we treat every sigil on the target floor as a valid marker.
          const sigilsHere = (typeof SIGILS!=='undefined'?SIGILS:[]).filter(s=>{
            if(obj.spellId && s.spellId!==obj.spellId)return false;
            if(obj.floor!==undefined && s.floor!==obj.floor)return false;
            return true;
          });
          if(sigilsHere.length===0)return;
          // If any matching sigil is on our current floor, mark it directly; otherwise
          // point at the staircase to the floor that has them.
          const onThisFloor = sigilsHere.filter(s=>s.floor===currentFloor);
          if(onThisFloor.length>0){
            onThisFloor.forEach(s=>markers.push({x:s.x,z:s.z,col:QM_COL_INZONE,label:'Sigil'}));
          } else if(typeof dStairC!=='undefined' && dStairC!==null){
            markers.push({x:dStairC,z:dStairR,col:QM_COL_CROSS,label:stairDir(sigilsHere[0].floor)});
          }
        }
        // v61b5: enter_zone objective while inside a dungeon. Q0 fits this
        // shape — its objective is `enter_zone:overworld`, the player is
        // currently in the tutorial crypt, and the way to "enter the
        // overworld" is to leave the dungeon via the entrance. Point at
        // the dungeon entrance (red CROSS color since this is a level-
        // transition affordance, matching the convention used elsewhere
        // for "go through this to reach a target zone"). The marker
        // disappears automatically when the player leaves the dungeon
        // — Q0 then auto-completes via checkQuestProgress, so no marker
        // is needed post-emergence.
        if(obj.type==='enter_zone' && typeof dEntranceX!=='undefined' && dEntranceX!==null){
          markers.push({x:dEntranceX, z:dEntranceZ, col:QM_COL_CROSS, label:'Exit'});
        }
      });
      return; // skip the overworld branches below while in-dungeon
    }

    // reward / available → point to quest giver
    if(qs.state==='reward'||qs.state==='available'){
      if(giverZone===activeZoneId){
        pushNPCMarker(qDef.giver, giverZone, qDef.giver);
      } else {
        // Giver is in another zone — point to the gate
        const gate=gateTowardZone(giverZone);
        if(gate)markers.push({x:gate.x,z:gate.z,col:QM_COL_CROSS,label:'→ '+qDef.giver});
      }
      return;
    }

    // active → point toward objective targets
    qDef.objectives.forEach((obj,i)=>{
      if(qs.objectives[i].current>=(obj.count||1))return;

      // v61al: PREREQ GATE — skip this objective's marker if any prereqIndex
      // is not yet complete. Fixes two playtest complaints:
      //   - Aldwyn (Q7 obj 5) marker always showed, even before triage. The
      //     quest log "Bring the rubbing to Aldwyn" line was acting as a
      //     spoiler. Now the marker only appears after the rubbing is taken.
      //   - Same for Q7 obj 4 (rubbing handoff) until triage is complete.
      // Keeps current-stage markers visible while hiding future stages.
      if(obj.prereqIndices && obj.prereqIndices.length){
        const prereqsDone = obj.prereqIndices.every(idx=>{
          const p = qs.objectives[idx];
          const pNeeded = (qDef.objectives[idx].count||1);
          return p && p.current >= pNeeded;
        });
        if(!prereqsDone) return;
      }

      if(obj.dungeonSeed!==undefined){
        const portal=PORTALS.find(p=>p.seed===obj.dungeonSeed);
        if(portal){
          // Portals load a separate dungeon scene — they're a level-transition,
          // so red. Same when the dungeon is in another zone (gate marker).
          markers.push({x:portal.x,z:portal.z,col:QM_COL_CROSS,label:portal.name});
        } else {
          // Dungeon is in a different zone — point to gate
          const wd=WORLD_DUNGEONS.find(d=>d.seed===obj.dungeonSeed);
          if(wd&&wd.zone!==activeZoneId){
            const gate=gateTowardZone(wd.zone);
            if(gate)markers.push({x:gate.x,z:gate.z,col:QM_COL_CROSS,label:'→ '+(wd.canonicalName||wd.zone)});
          }
        }
      }

      if(obj.type==='talk_to'){
        if(obj.zone===activeZoneId){
          pushNPCMarker(obj.npc, obj.zone, obj.npc);
        } else {
          const gate=gateTowardZone(obj.zone);
          if(gate)markers.push({x:gate.x,z:gate.z,col:QM_COL_CROSS,label:'→ '+obj.npc});
        }
      }

      // v61al: read_corpse marker. Looks up the matching entry in ZONE_CORPSES
      // by corpseId and shows a marker at its position. Used by Q7 obj 1
      // (Bram's body at the forge). If the zone isn't the current one, point
      // to the gate.
      if(obj.type==='read_corpse'){
        if(obj.zone===activeZoneId){
          const c = (typeof ZONE_CORPSES !== 'undefined')
            ? ZONE_CORPSES.find(cc=>cc.zone===obj.zone && cc.corpseId===obj.corpseId) : null;
          if(c) markers.push({x:c.x, z:c.z, col:QM_COL_INZONE, label:c.name||obj.corpseId});
        } else {
          const gate=gateTowardZone(obj.zone);
          if(gate) markers.push({x:gate.x, z:gate.z, col:QM_COL_CROSS, label:'→ '+(obj.corpseId||'body')});
        }
      }

      // v61al: receive_item marker. Routes to the quest giver — that's who
      // hands the item over. Q7 obj 4 (Edna → rubbing) uses this; the marker
      // only appears once the prereq triage (1,2,3) is complete due to the
      // prereq gate above.
      if(obj.type==='receive_item'){
        const giverName = qDef.giver;
        const giverZone = qDef.giverZone||'overworld';
        if(giverName){
          if(giverZone===activeZoneId){
            pushNPCMarker(giverName, giverZone, giverName);
          } else {
            const gate = gateTowardZone(giverZone);
            if(gate) markers.push({x:gate.x, z:gate.z, col:QM_COL_CROSS, label:'→ '+giverName});
          }
        }
      }

      // v61al: enter_zone marker — only relevant if the player isn't in the
      // target zone yet. Once in-zone, the burn trigger fires and obj ticks,
      // so this branch naturally never shows an in-zone marker.
      // v61an: map the internal zone ID to a display label. 'overworld' is
      // the internal zone ID but the player thinks of it as Ashenmoor.
      if(obj.type==='enter_zone' && obj.zone!==activeZoneId){
        const gate=gateTowardZone(obj.zone);
        if(gate){
          const zoneLabels = {
            overworld:'Ashenmoor',
            ironhaven:'Ironhaven',
            hearthwick:'Hearthwick',
          };
          const label = zoneLabels[obj.zone] || obj.zone;
          // v61ao: noWaypoint — enter_zone targets use the gate as the marker,
          // and the gate already has its own visible affordance (the gate mesh
          // itself) plus the "→ Ashenmoor" label on the compass. A floating
          // waypoint cone hovering over a gate you're standing next to would
          // be redundant and ugly. The in-world waypoint iterator in
          // tickQuestWaypoints filters on this flag; the compass doesn't read
          // it (so compass behaviour is unchanged).
          markers.push({x:gate.x, z:gate.z, col:QM_COL_CROSS, label:'→ '+label, noWaypoint:true});
        }
      }
    });
  });
  return markers;
}

// ── Quest waypoint cones (v61ao) ─────────────────────────────────────────
//
// In-world companion to the compass. For each active quest marker (with a
// few exclusions), floats a yellow downward-pointing cone ~2.8u above the
// target position. The cone bobs vertically and rotates slowly around its
// Y axis so it reads as "alive" from a distance and from the corner of
// the eye. Fades linearly from fully opaque at ≤50u to invisible at ≥120u
// — close enough you can still see it when you've actually arrived, far
// enough you can eyeball where to head from across a zone.
//
// Architecture notes:
//   - One-to-one with getActiveQuestMarkers(), minus entries flagged
//     noWaypoint (enter_zone gate markers — see that branch). This means
//     per-quest tracking (uQ), prereq gating, and reward-state giver
//     redirection all come for free: if the compass shows it, the cone
//     shows it too. Changes to marker policy need updating in exactly
//     one place.
//   - Mesh pool grows on demand and is capped by hiding overflow. We
//     never destroy meshes mid-session — rebuilding the cone geometry
//     every frame for a set that typically has 0-3 members would be
//     wasteful, and leaving pooled-but-hidden meshes parked at opacity 0
//     costs essentially nothing.
//   - Outdoor cones live in whichever Scene is currently active (owScene,
//     forestScene, dScene, etc). tickQuestWaypoints detects scene changes
//     and reparents. They never go in interiorScene — when the player is
//     inside a building they all hide, and a separate dedicated mesh
//     (_indoorWaypointCone) takes over for the one possible indoor target.
//   - v61aq added the indoor branch. Markers tagged `indoor:true` (set by
//     pushNPCMarker when the player is in the keeper's interior) route to
//     the dedicated indoor cone, which lives in interiorScene and gets
//     reattached after each buildInterior recreates that scene.
//   - Animation uses performance.now() (wall clock), not dt, so bob +
//     rotation freeze correctly when the main loop pauses for menus.
const _questWaypointMeshes=[];
let _waypointCurrentScene=null;
function _buildQuestWaypointCone(){
  // Slim downward pyramid — 4 radial segments (square-based pyramid) rather
  // than a smooth cone. With MeshBasicMaterial the shape is unlit flat,
  // so an 8+-segment cone looks radially symmetric and the Y rotation reads
  // as nothing. 4 segments give a clearly square cross-section whose
  // silhouette width visibly oscillates as it rotates (edge-on → face-on →
  // edge-on), so the rotation actually registers. Still reads as "pointer
  // down" at any distance.
  //
  // v61aq: shrunk again by 50% (0.3×0.9 → 0.15×0.45). Earlier sizes still
  // read as ornaments rather than markers; the existing NPC quest-state dot
  // is the right scale reference and these now sit comfortably above it.
  const geo=new THREE.ConeGeometry(0.15,0.45,4);
  const mat=new THREE.MeshBasicMaterial({
    color:0xffd54a, // overwritten per-frame, this is just an init placeholder
    transparent:true,
    opacity:1,
    // depthWrite:false prevents the cone from occluding itself weirdly
    // when it overlaps terrain it's bobbing near. Depth TEST stays on
    // (default) so terrain still properly hides cones behind hills.
    depthWrite:false,
  });
  const mesh=new THREE.Mesh(geo,mat);
  // Flip upside down: default cone points up (+Y apex), we want apex down.
  // After this, mesh.rotation.y still rotates around the world-vertical axis
  // (Euler XYZ order → Y rotation applied in the post-X-flip local frame
  // whose Y axis is world -Y; negative-Y rotation is visually equivalent to
  // positive-Y rotation mirrored, which is fine for a symmetric pyramid).
  mesh.rotation.x=Math.PI;
  mesh.visible=false;
  return mesh;
}
// v61aq: a single dedicated mesh for the in-interior cone (over the
// keeper's head, when an active quest targets them). Lazy-built and
// reattached to interiorScene whenever buildInterior creates a new one.
let _indoorWaypointCone=null;
let _indoorWaypointConeScene=null;
function tickQuestWaypoints(){
  const allMarkers=getActiveQuestMarkers().filter(m=>!m.noWaypoint);
  if(isInterior()){
    // Hide every outdoor cone (they stay parented to their last outdoor
    // scene; the scene-change branch on exit will reparent them as needed).
    for(let i=0;i<_questWaypointMeshes.length;i++){
      _questWaypointMeshes[i].visible=false;
    }
    // Indoor cone: there's at most one indoor marker (the keeper of the
    // current interior, if any quest targets them). Show it if present,
    // else hide the dedicated mesh.
    const indoorMarker=allMarkers.find(m=>m.indoor);
    if(indoorMarker && interiorScene){
      if(!_indoorWaypointCone) _indoorWaypointCone=_buildQuestWaypointCone();
      // interiorScene is reassigned every entry (see buildInterior). When
      // that happens our cone is parented to a stale Scene that's no longer
      // rendered — reattach to the live one.
      if(_indoorWaypointConeScene!==interiorScene){
        if(_indoorWaypointCone.parent) _indoorWaypointCone.parent.remove(_indoorWaypointCone);
        interiorScene.add(_indoorWaypointCone);
        _indoorWaypointConeScene=interiorScene;
      }
      const t=performance.now()*0.001;
      // Indoor float: 1.7u over a ~1.5u-tall NPC mesh sits the apex ~0.2u
      // above the keeper's head. Top of cone reaches 1.7+0.45=2.15u, well
      // under the typical 2.4u shop ceiling. Bob amplitude trimmed to 0.10u
      // for the smaller cone — same visual rhythm as the outdoor cones at
      // this scale.
      const bob=Math.sin(t*2.4)*0.10;
      _indoorWaypointCone.position.set(indoorMarker.x, 1.7+bob, indoorMarker.z);
      _indoorWaypointCone.rotation.y=t*0.55;
      if(indoorMarker.col) _indoorWaypointCone.material.color.set(indoorMarker.col);
      _indoorWaypointCone.material.opacity=1; // close range, no fade indoors
      _indoorWaypointCone.visible=true;
    } else if(_indoorWaypointCone){
      _indoorWaypointCone.visible=false;
    }
    return;
  }
  // Just exited an interior — hide the indoor cone if it was up.
  if(_indoorWaypointCone) _indoorWaypointCone.visible=false;
  // Scene transition (zone change / dungeon entry / fast travel): detach
  // every outdoor cone from its previous parent and attach to the new scene.
  if(scene && scene!==_waypointCurrentScene){
    for(let i=0;i<_questWaypointMeshes.length;i++){
      const m=_questWaypointMeshes[i];
      if(m.parent)m.parent.remove(m);
      scene.add(m);
    }
    _waypointCurrentScene=scene;
  }
  // Outdoor markers only — indoor markers route to the dedicated mesh above
  // and have no business in the outdoor pool.
  const markers=allMarkers.filter(m=>!m.indoor);
  // Grow pool to cover the current count.
  while(_questWaypointMeshes.length<markers.length){
    const m=_buildQuestWaypointCone();
    _questWaypointMeshes.push(m);
    if(scene)scene.add(m);
  }
  // Hide any overflow cones left over from a shrinking marker set.
  for(let i=markers.length;i<_questWaypointMeshes.length;i++){
    _questWaypointMeshes[i].visible=false;
  }
  // Position + animate + fade the active cones.
  const t=performance.now()*0.001;
  for(let i=0;i<markers.length;i++){
    const m=markers[i];
    const mesh=_questWaypointMeshes[i];
    // Ground height: overworld zones use terrain follow; dungeon is flat
    // (current floor's base Y). Sigil markers in dungeons sit at y≈0
    // relative to their floor. activeTerrainH returns 0 for non-terrain
    // zones, which is correct for dungeon floor 1. For floor 2 we'd want
    // FLOOR2_Y added — check the current dungeon floor to pick.
    let gy;
    if(activeZoneId==='dungeon'){
      gy=(currentFloor===2)?FLOOR2_Y:0;
    } else {
      gy=activeTerrainH(m.x,m.z);
    }
    // Float height: 2.0u outdoor, 1.6u dungeon. With the v61aq 0.45u-tall
    // cone, apex at 2.0u puts the cone ~0.3u above an NPC's head (NPCs are
    // ~1.7u tall). In dungeons, 1.6u float + 0.45u cone height + 0.10u bob
    // = top edge at ~2.15u, leaving 1.0u clearance under the 3.2u ceiling.
    const floatH=(activeZoneId==='dungeon')?1.6:2.0;
    // Bob: ±0.10u vertical offset, ~0.4Hz. Smaller amplitude for the
    // smaller cone — same visual rhythm at this scale.
    const bob=Math.sin(t*2.4+i*0.7)*0.10;
    mesh.position.set(m.x, gy+floatH+bob, m.z);
    // Slow Y-rotation. ~11 seconds per full turn. Per-cone phase offset
    // (i*1.3) staggers so they're not all facing the same way.
    mesh.rotation.y=t*0.55+i*1.3;
    // Color: read from the marker each frame. Marker palette is red (cross-
    // zone / portal / level transition) or green (in-zone target). Pooled
    // meshes can be reassigned to any marker on any frame, so we have to
    // sync color per tick rather than once at build time.
    if(m.col)mesh.material.color.set(m.col);
    // Distance fade: full opacity within 50u, linear fade to 0 at 120u.
    const dist=Math.hypot(m.x-px, m.z-pz);
    let opacity;
    if(dist<=50)opacity=1;
    else if(dist>=120)opacity=0;
    else opacity=1-(dist-50)/70;
    mesh.material.opacity=opacity;
    mesh.visible=opacity>0.01;
  }
}
