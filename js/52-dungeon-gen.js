// checkPortals removed — dungeon entry now via E-key interact()

// ── DUNGEON ──────────────────────────────────────────────────
// ── PROCEDURAL DUNGEON GENERATOR ────────────────────────────
// Cell: 0=wall 1=floor 2=entrance 3=stair(connects floor1↔floor2) 4=unlocked-door 5=locked-door 6=treasure
// Two-floor architecture: floor 1 at worldY=0, floor 2 at worldY=FLOOR2_Y.
// Both floors share the same XZ grid. The stair cell (3) appears in both maps at the same column/row.
// Only medium/large/massive dungeons have a floor 2.
const FLOOR2_Y=-5.0; // v80 — floor two lies BELOW floor one: you go down into a gate, not up
// v80 S7 — FOOTHOLDS: walkable levels above the base floor for interiors and
// dungeons. {x0,x1,z0,z1,y} is a platform; add axis:'x'|'z',y0,y1 for a ramp
// whose height interpolates from the axis' 0-edge to its 1-edge. The ground
// resolver picks the highest foothold no more than STEP_UP above the player,
// so you climb ramps, walk under decks, and fall off edges. Reset per room.
let FOOTHOLDS=[],INT_SOL=[],DUNGEON_STAIRWELL=false;
const STEP_UP=.62;
function footholdY(x,z,py,base){
  let best=base;
  for(let i=0;i<FOOTHOLDS.length;i++){const f=FOOTHOLDS[i];
    if(f.kind==='spiral'){ // helix: every turn is a candidate; the resolver keeps the highest reachable
      const dx=x-f.cx,dz=z-f.cz,rd=Math.hypot(dx,dz);if(rd<f.r0||rd>f.r1)continue;
      let th=Math.atan2(dz,dx)-(f.a0||0);th=((th%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
      for(let k=0;k<=f.turns;k++){const y=f.y0+(f.y1-f.y0)*((th+k*Math.PI*2)/(f.turns*Math.PI*2));if(f.y1>f.y0?y>f.y1+.01:y<f.y1-.01)break;if(y<=py+STEP_UP&&y>best)best=y;}
      continue;
    }
    if(x<f.x0||x>f.x1||z<f.z0||z>f.z1)continue;
    if(f.hole&&x>f.hole.x0&&x<f.hole.x1&&z>f.hole.z0&&z<f.hole.z1)continue;
    let y=f.y;
    if(f.axis){const t=f.axis==='x'?(x-f.x0)/(f.x1-f.x0):(z-f.z0)/(f.z1-f.z0);y=f.y0+(f.y1-f.y0)*Math.max(0,Math.min(1,t));}
    if(y<=py+STEP_UP&&y>best)best=y;
  }
  return best;
}
let INT_BEDS=[];let INT_DOORS=[]; // v80 S143 — doors inside buildings
// v80 S11 — solids carry a height band {y0,y1}. An object whose top is
// within a step of your feet doesn't block (you step onto it — it's also a
// foothold); an object entirely above your head doesn't block (you walk
// under it); a jump that clears the top passes over it.
const PLAYER_H=1.0;
function intSolidAt(x,z,R,Y){const y=Y!=null?Y:jumpY;for(let i=0;i<INT_SOL.length;i++){const s=INT_SOL[i]; // Y: whose feet (S232 — townsfolk indoors test at their own height, not the player's)
  if(s.y1!=null&&s.y1<=y+STEP_UP)continue;      // low enough to step onto / already above it
  if(s.y0!=null&&s.y0>=y+PLAYER_H)continue;      // entirely overhead
  if(x>s.x0-R&&x<s.x1+R&&z>s.z0-R&&z<s.z1+R)return true;}return false;}
const FLOOR_HEIGHT=3.2; // wall/ceiling height per floor

// v61g0: FORT_INTERIORS registry — interior-layout generators selected by the
// `interior` field on WORLD_DUNGEONS entries. Symmetric with the v61f9
// FORT_EXTERIORS registry. Default 'cave' routes to makeDungeon (the existing
// random-rooms+L-corridors algorithm). 'fort_tee' routes to makeFortInterior
// (trunk + perpendicular cross-hall, Battlehorn-castle-but-abandoned register).
// v61g6: 'fort_linear' (trunk + alternating side rooms, outpost register) and
// 'fort_courtyard' (entry corridor → central hall room → 4 doored rooms, keep
// register) added.
// Each generator takes (size, seed) and returns the same shape as makeDungeon:
//   {map, map2, W, H, rooms, rooms2, entC, entR, treasureDoors, stairC, stairR,
//    keyLocations, cfg}
// This means downstream consumers (buildDungeon, dSolid, enemy spawn) need no
// generator-specific branching — the algorithm choice is encapsulated in the
// registry. Adding a new variant later is one registry entry + one function.
const FORT_INTERIORS = {
  cave: (size, seed) => makeDungeon(size, seed),
  // fort_tee populated after this declaration once makeFortInterior is defined.
};

function makeDungeon(size,seed){
  function rng(s){let v=s;return()=>{v=(v*1664525+1013904223)>>>0;return v/4294967296;};}
  const r=rng(seed);const rand=(a,b)=>Math.floor(r()*(b-a+1))+a;
  const cfg={
    tiny:   {W:14,H:14,minR:3, maxR:5, rwMin:3,rwMax:5,rhMin:3,rhMax:5, tr:0,ur:1,en:5, floors:1},
    small:  {W:20,H:20,minR:6, maxR:10,rwMin:3,rwMax:6,rhMin:3,rhMax:6, tr:1,ur:2,en:9, floors:1},
    medium: {W:30,H:30,minR:10,maxR:16,rwMin:3,rwMax:8,rhMin:3,rhMax:8, tr:1,ur:3,en:14,floors:2},
    large:  {W:40,H:40,minR:16,maxR:24,rwMin:3,rwMax:10,rhMin:3,rhMax:10,tr:2,ur:4,en:20,floors:2},
    massive:{W:54,H:54,minR:24,maxR:36,rwMin:3,rwMax:12,rhMin:3,rhMax:12,tr:2,ur:6,en:30,floors:2},
  }[size]||{W:20,H:20,minR:6,maxR:10,rwMin:3,rwMax:6,rhMin:3,rhMax:6,tr:1,ur:2,en:9,floors:1};
  // v61b2: tutorial portals are always single-floor regardless of size.
  // We bumped tutorial to size:'medium' for ~2× area, but medium normally
  // ships with floors:2 (a staircase to a second level). For a tutorial
  // that's too much — the player would hit the stair, descend, get lost
  // on a second floor that has no narrative purpose. Force floors:1 so
  // the layout is one continuous space.
  if(seed===7){ cfg.floors = 1; }
  const{W,H}=cfg;
  const map=Array.from({length:H},()=>new Array(W).fill(0));
  const rooms=[];
  const numR=rand(cfg.minR,cfg.maxR);
  for(let att=0;rooms.length<numR&&att<400;att++){
    const rw=rand(cfg.rwMin,cfg.rwMax),rh=rand(cfg.rhMin,cfg.rhMax);
    const rx=rand(1,W-rw-2),ry=rand(1,H-rh-2);
    let ok=true;
    for(const rm of rooms)if(rx<rm.x+rm.w+2&&rx+rw+1>rm.x&&ry<rm.y+rm.h+2&&ry+rh+1>rm.y){ok=false;break;}
    if(!ok)continue;
    for(let y=ry;y<ry+rh;y++)for(let x=rx;x<rx+rw;x++)map[y][x]=1;
    rooms.push({x:rx,y:ry,w:rw,h:rh,cx:Math.floor(rx+rw/2),cy:Math.floor(ry+rh/2)});
  }
  if(rooms.length<2)return makeDungeon(size,seed+1);// retry different seed
  rooms.sort((a,b)=>a.cx-b.cx);
  for(let i=0;i<rooms.length-1;i++){
    const a=rooms[i],b=rooms[i+1];
    const x1=Math.min(a.cx,b.cx),x2=Math.max(a.cx,b.cx);
    const y1=Math.min(a.cy,b.cy),y2=Math.max(a.cy,b.cy);
    for(let x=x1;x<=x2;x++)if(map[a.cy][x]===0)map[a.cy][x]=1;
    for(let y=y1;y<=y2;y++)if(map[y][b.cx]===0)map[y][b.cx]=1;
  }
  // Entrance corridor from first room to map edge
  const s=rooms[0];
  const edges=[
    {dir:'S',dist:H-1-(s.y+s.h),ex:s.cx,ey:H-1},
    {dir:'N',dist:s.y,              ex:s.cx,ey:0},
    {dir:'W',dist:s.x,              ex:0,   ey:s.cy},
    {dir:'E',dist:W-1-(s.x+s.w),   ex:W-1, ey:s.cy},
  ];
  edges.sort((a,b)=>a.dist-b.dist);
  const en=edges[0];
  if(en.dir==='S'){for(let y=s.y+s.h;y<=H-1;y++)map[y][en.ex]=1;map[H-1][en.ex]=2;}
  else if(en.dir==='N'){for(let y=0;y<s.y;y++)map[y][en.ex]=1;map[0][en.ex]=2;}
  else if(en.dir==='W'){for(let x=0;x<s.x;x++)map[s.cy][x]=1;map[s.cy][0]=2;}
  else{for(let x=s.x+s.w;x<=W-1;x++)map[s.cy][x]=1;map[s.cy][W-1]=2;}
  // Find entrance coords
  let entC=0,entR=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(map[y][x]===2){entC=x;entR=y;}

  // Treasure rooms attached to non-entrance rooms
  const treasureDoors=[];
  const anchors=[...rooms.slice(1)].sort(()=>r()-.5);
  let trCount=0;
  for(const anchor of anchors){
    if(trCount>=cfg.tr)break;
    // Try all 4 sides
    const sides=[
      {dx:0,dy:-1,corridor_y:anchor.y-1,corridor_x:anchor.cx,isEW:false},
      {dx:0,dy:1, corridor_y:anchor.y+anchor.h,corridor_x:anchor.cx,isEW:false},
      {dx:-1,dy:0,corridor_x:anchor.x-1,corridor_y:anchor.cy,isEW:true},
      {dx:1,dy:0, corridor_x:anchor.x+anchor.w,corridor_y:anchor.cy,isEW:true},
    ].sort(()=>r()-.5);
    for(const side of sides){
      const tx=side.isEW?side.corridor_x+(side.dx>0?1:-(3)):side.corridor_x-1;
      const ty=side.isEW?side.corridor_y-1:side.corridor_y+(side.dy>0?1:-(3));
      const tw=3,th=3;
      if(tx<1||tx+tw>W-1||ty<1||ty+th>H-1)continue;
      let ovlap=false;
      for(let y=ty-1;y<ty+th+1;y++)for(let x=tx-1;x<tx+tw+1;x++){
        if(y<0||y>=H||x<0||x>=W)continue;
        if(map[y][x]>=1){ovlap=true;break;}
      }
      if(ovlap)continue;
      // Carve treasure room
      for(let y=ty;y<ty+th;y++)for(let x=tx;x<tx+tw;x++)map[y][x]=6;
      // Carve 1-cell corridor + door
      let doorX,doorZ;
      if(side.isEW){
        // single corridor cell between anchor room and treasure room
        const cx=side.corridor_x,cy=side.corridor_y;
        if(cx>=0&&cx<W&&cy>=0&&cy<H&&map[cy][cx]===0){map[cy][cx]=5;doorX=cx;doorZ=cy;}
        else{// place door inside the corridor
          const cx2=side.dx>0?anchor.x+anchor.w:anchor.x-1;
          if(cx2>=0&&cx2<W)map[cy][cx2]=5;doorX=cx2;doorZ=cy;
        }
      } else {
        const cx=side.corridor_x,cy=side.corridor_y;
        if(cx>=0&&cx<W&&cy>=0&&cy<H&&map[cy][cx]===0){map[cy][cx]=5;doorX=cx;doorZ=cy;}
        else{
          const cy2=side.dy>0?anchor.y+anchor.h:anchor.y-1;
          if(cy2>=0&&cy2<H)map[cy2][cx]=5;doorX=cx;doorZ=cy2;
        }
      }
      if(doorX!==undefined){
        treasureDoors.push({x:doorX,z:doorZ,isEW:side.isEW,locked:true});
        trCount++;
        break;
      }
    }
  }

  // Unlocked doors — placed in corridors that connect rooms (1-cell-wide bottlenecks)
  // Find corridor cells: floor cells with exactly 2 floor neighbours in opposite directions
  let urCount=0;
  const corridorCells=[];
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
    if(map[y][x]!==1)continue;
    const N=map[y-1]?.[x]>=1,S=map[y+1]?.[x]>=1,E=map[y]?.[x+1]>=1,W2=map[y]?.[x-1]>=1;
    // Horizontal corridor: floor on E+W but not N or S (or vice versa)
    const isHCorridor=(E&&W2&&!N&&!S);
    const isVCorridor=(N&&S&&!E&&!W2);
    if(isHCorridor||isVCorridor)corridorCells.push({x,y,isEW:isHCorridor});
  }
  // Shuffle corridorCells with the seeded RNG and pick up to cfg.ur
  corridorCells.sort(()=>r()-.5);
  for(const cc of corridorCells){
    if(urCount>=cfg.ur)break;
    if(map[cc.y][cc.x]===1){// still a plain floor cell
      map[cc.y][cc.x]=4;
      treasureDoors.push({x:cc.x,z:cc.y,isEW:cc.isEW,locked:false});
      urCount++;
    }
  }

  // Staircases — placed in a room in the middle third of the dungeon, away from entrance
  let stairC=null,stairR=null;
  if(cfg.floors>1&&rooms.length>=4){
    // Pick a room roughly 60% of the way through (sorted by X), away from entrance room
    // v80 — the well stands in the open: the biggest room of at least 5×5 away from the entrance,
    // the 2×2 shaft in its middle, and a ring of floor carved around it so it is reachable from every side.
    let candidates=rooms.slice(1).filter(rm=>rm.w>=5&&rm.h>=5&&map[rm.cy][rm.cx]===1&&Math.hypot(rm.cx-entC,rm.cy-entR)>5);
    if(!candidates.length)candidates=rooms.slice(1).filter(rm=>map[rm.cy][rm.cx]===1&&Math.hypot(rm.cx-entC,rm.cy-entR)>5);
    if(candidates.length>0){
      candidates.sort((a,b)=>(b.w*b.h)-(a.w*a.h));const sr=candidates[0];
      stairC=Math.max(2,Math.min(W-4,Math.floor(sr.x+sr.w/2)-1)); stairR=Math.max(2,Math.min(H-4,Math.floor(sr.y+sr.h/2)-1));
      for(let dr=-1;dr<=2;dr++)for(let dc=-1;dc<=2;dc++){if(map[stairR+dr][stairC+dc]===0)map[stairR+dr][stairC+dc]=1;}
      for(let dr=0;dr<2;dr++)for(let dc=0;dc<2;dc++)map[stairR+dr][stairC+dc]=3;
    }
  }

  // Key locations — one per treasure door, placed far from entrance
  const floorCells=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(map[y][x]===1)floorCells.push({x,y});
  floorCells.sort((a,b)=>Math.hypot(b.x-entC,b.y-entR)-Math.hypot(a.x-entC,a.y-entR));
  const lockedCount=treasureDoors.filter(d=>d.locked!==false).length;
  const keyLocations=floorCells.slice(0,Math.max(1,lockedCount));

  // ── FLOOR 2 MAP (same XZ grid, different rooms + enemies) ───
  // Generated only when cfg.floors>1 and a staircase was placed.
  // Floor 2 reuses the same seed+1 so it's deterministic but different.
  // It must contain the stair cell at (stairC, stairR) so the staircase connects.
  let map2=null;
  let rooms2=null;
  if(cfg.floors>1 && stairC!==null){
    const r2=rng(seed+1);const rand2=(a,b)=>Math.floor(r2()*(b-a+1))+a;
    map2=Array.from({length:H},()=>new Array(W).fill(0));
    rooms2=[];const numR2=rand2(cfg.minR,cfg.maxR);
    for(let att=0;rooms2.length<numR2&&att<400;att++){
      const rw=rand2(cfg.rwMin,cfg.rwMax),rh=rand2(cfg.rhMin,cfg.rhMax);
      const rx=rand2(1,W-rw-2),ry=rand2(1,H-rh-2);
      let ok=true;
      for(const rm of rooms2)if(rx<rm.x+rm.w+2&&rx+rw+1>rm.x&&ry<rm.y+rm.h+2&&ry+rh+1>rm.y){ok=false;break;}
      if(!ok)continue;
      for(let y2=ry;y2<ry+rh;y2++)for(let x2=rx;x2<rx+rw;x2++)map2[y2][x2]=1;
      rooms2.push({x:rx,y:ry,w:rw,h:rh,cx:Math.floor(rx+rw/2),cy:Math.floor(ry+rh/2)});
    }
    if(rooms2.length>=2){
      rooms2.sort((a,b)=>a.cx-b.cx);
      for(let i=0;i<rooms2.length-1;i++){
        const a=rooms2[i],b=rooms2[i+1];
        const x1=Math.min(a.cx,b.cx),x2=Math.max(a.cx,b.cx);
        const y1=Math.min(a.cy,b.cy),y2=Math.max(a.cy,b.cy);
        for(let x2c=x1;x2c<=x2;x2c++)if(map2[a.cy][x2c]===0)map2[a.cy][x2c]=1;
        for(let y2c=y1;y2c<=y2;y2c++)if(map2[y2c][b.cx]===0)map2[y2c][b.cx]=1;
      }
      // Ensure stair cell is reachable on floor 2 — carve a corridor from nearest room2 center
      const nearest2=rooms2.reduce((best,rm)=>Math.hypot(rm.cx-stairC,rm.cy-stairR)<Math.hypot(best.cx-stairC,best.cy-stairR)?rm:best,rooms2[0]);
      const sx2=Math.min(nearest2.cx,stairC),ex2=Math.max(nearest2.cx,stairC);
      const sz2=Math.min(nearest2.cy,stairR),ez2=Math.max(nearest2.cy,stairR);
      for(let x2c=sx2;x2c<=ex2;x2c++)if(map2[nearest2.cy][x2c]===0)map2[nearest2.cy][x2c]=1;
      for(let y2c=sz2;y2c<=ez2;y2c++)if(map2[y2c][stairC]===0)map2[y2c][stairC]=1;
      // Mark stair on floor 2
      for(let dr=0;dr<2;dr++)for(let dc=0;dc<2;dc++)map2[stairR+dr][stairC+dc]=3; // v80 S8 — open shaft on floor 2
      { // v80 — a chamber around the foot of the stairs on floor two, joined to the nearest room
        const H2=map2.length,W2=map2[0].length;for(let dr=-2;dr<=3;dr++)for(let dc=-2;dc<=3;dc++){const rr=stairR+dr,cc=stairC+dc;if(rr<1||cc<1||rr>=H2-1||cc>=W2-1)continue;if(map2[rr][cc]===0)map2[rr][cc]=1;}
        const R2=(typeof rooms2!=='undefined'&&rooms2)||[];let near=null,nd=1e9;for(const rm of R2){const d=Math.hypot(rm.cx-(stairC+.5),rm.cy-(stairR+.5));if(d<nd){nd=d;near=rm;}}
        if(near){const x1=Math.min(stairC,near.cx),x2=Math.max(stairC,near.cx),y1=Math.min(stairR,near.cy),y2=Math.max(stairR,near.cy);for(let x=x1;x<=x2;x++)if(map2[stairR][x]===0)map2[stairR][x]=1;for(let y=y1;y<=y2;y++)if(map2[y][near.cx]===0)map2[y][near.cx]=1;}
      }
      // Add 1 treasure room on floor 2
      const anchor2=rooms2[rooms2.length-1];
      const t2x=anchor2.cx,t2y=anchor2.cy;
      if(t2x>2&&t2x<W-3&&t2y>2&&t2y<H-3){
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(map2[t2y+dy][t2x+dx]===0)map2[t2y+dy][t2x+dx]=6;
        map2[t2y][t2x]=6;
      }
    }
  }

  return{map,map2,W,H,rooms,rooms2,entC,entR,treasureDoors,stairC,stairR,keyLocations,cfg};
}

// v61gg: integer hash for decoupling sub-RNGs from layout RNG. Used by the
// fort utility-room kind shuffle. The bare seeded LCG produces near-identical
// first outputs for sequential seeds (e.g. 7099-7106 all yield r()[0] > 0.83),
// which biases the first Fisher-Yates swap and can lock specific array
// positions in place across an entire seed block. Hashing the seed before
// reseeding a sub-RNG breaks that pattern. xmxmx-style 32-bit integer hash.
function hashSeed(x){
  x = ((x >>> 16) ^ x) * 0x45d9f3b;
  x = ((x >>> 16) ^ x) * 0x45d9f3b;
  x = (x >>> 16) ^ x;
  return x >>> 0;
}

// v61g0: makeFortInterior — trunk + perpendicular cross-hall fort layout.
// Returns the same shape as makeDungeon so downstream consumers need no
// special branching. Single-floor only this ship (no stair, no map2); the
// floors:1 override is hardcoded internally regardless of size cfg.
//
// Layout (canonical orientation, entry at south = high z, Great Hall at north = low z):
//   - 3-cell-wide trunk hallway running N-S along x = floor(W/2)±1
//   - 3-cell-wide cross-hall E-W at ~1/3 of the way down from north
//   - Great Hall at far north end of trunk (treasure-floor)
//   - Lord's Chamber at east end of cross (treasure-floor, closeable unlocked door)
//   - Chapel at west end of cross (closeable unlocked door)
//   - 4 trunk side rooms between cross and entry, varied types (Barracks/
//     Kitchen/Guardroom/Storeroom/Armory/Cellar shuffled by seed)
//
// Tile vocabulary:
//   0 = void/wall
//   1 = room floor
//   2 = entrance (single cell at south edge of trunk)
//   4 = unlocked door
//   5 = locked door
//   6 = treasure-floor room (Great Hall, Lord's Chamber)
//   7 = hallway floor (trunk + cross-hall)
//
// Enemy density: medium-size fort uses en:9 (vs medium-cave en:14). Fort
// interiors are layout-denser than caves; lower enemy count keeps combat-
// per-room similar and supports the "abandoned but recognizable" register.
// ═══════════════════════════════════════════════════════════════════════
// v80 — FORT UPPER FLOORS. Fort interiors (fort_tee / fort_linear /
// fort_courtyard) are single-floor. addUpperFloor gives them a second
// floor: a stairwell in a room away from the entrance, an upper layout of
// 3–6 rooms joined by corridors and linked to the stairwell, so the
// Session-8 spiral stair connects them. rooms2 feeds floor-2 enemy spawns.
// ═══════════════════════════════════════════════════════════════════════
function addUpperFloor(gen,seed){
  if(!gen||gen.map2||!gen.rooms||gen.rooms.length<2)return gen;
  const W=gen.W,H=gen.H;let s=(seed*9301+49297)%233280;const rnd=()=>(s=(s*9301+49297)%233280)/233280;
  // stairwell: a room far from the entrance with a 2×2 floor block available
  const ent={x:gen.entC,y:gen.entR};
  let cands=gen.rooms.filter(r=>r.w>=5&&r.h>=5&&Math.hypot(r.cx-ent.x,r.cy-ent.y)>4).sort((a,b)=>(b.w*b.h)-(a.w*a.h));
  if(!cands.length)cands=gen.rooms.filter(r=>r.w>=3&&r.h>=3).sort((a,b)=>Math.hypot(b.cx-ent.x,b.cy-ent.y)-Math.hypot(a.cx-ent.x,a.cy-ent.y));
  if(!cands.length)return gen;
  const sr=cands[0];
  const stairC=Math.max(2,Math.min(W-4,Math.floor(sr.x+sr.w/2)-1)),stairR=Math.max(2,Math.min(H-4,Math.floor(sr.y+sr.h/2)-1));
  for(let dr=-1;dr<=2;dr++)for(let dc=-1;dc<=2;dc++){if(gen.map[stairR+dr][stairC+dc]===0)gen.map[stairR+dr][stairC+dc]=1;} // v80 — a ring of floor around the well
  for(let dr=0;dr<2;dr++)for(let dc=0;dc<2;dc++)gen.map[stairR+dr][stairC+dc]=3;
  // upper floor
  const map2=Array.from({length:H},()=>new Array(W).fill(0));const rooms2=[];
  const numR=3+Math.floor(rnd()*4);
  for(let att=0;rooms2.length<numR&&att<300;att++){
    const rw=3+Math.floor(rnd()*4),rh=3+Math.floor(rnd()*4);const rx=1+Math.floor(rnd()*(W-rw-2)),ry=1+Math.floor(rnd()*(H-rh-2));
    if(rx<1||ry<1||rx+rw>=W-1||ry+rh>=H-1)continue;
    let ok=true;for(const rm of rooms2)if(rx<rm.x+rm.w+2&&rx+rw+1>rm.x&&ry<rm.y+rm.h+2&&ry+rh+1>rm.y){ok=false;break;}
    if(!ok)continue;
    for(let y=ry;y<ry+rh;y++)for(let x=rx;x<rx+rw;x++)map2[y][x]=1;
    rooms2.push({x:rx,y:ry,w:rw,h:rh,cx:Math.floor(rx+rw/2),cy:Math.floor(ry+rh/2)});
  }
  if(rooms2.length<2)return gen;
  rooms2.sort((a,b)=>a.cx-b.cx);
  for(let i=0;i<rooms2.length-1;i++){const a=rooms2[i],b=rooms2[i+1];const x1=Math.min(a.cx,b.cx),x2=Math.max(a.cx,b.cx),y1=Math.min(a.cy,b.cy),y2=Math.max(a.cy,b.cy);for(let x=x1;x<=x2;x++)if(map2[a.cy][x]===0)map2[a.cy][x]=1;for(let y=y1;y<=y2;y++)if(map2[y][b.cx]===0)map2[y][b.cx]=1;}
  const near=rooms2.reduce((best,rm)=>Math.hypot(rm.cx-stairC,rm.cy-stairR)<Math.hypot(best.cx-stairC,best.cy-stairR)?rm:best,rooms2[0]);
  const sx=Math.min(near.cx,stairC),ex=Math.max(near.cx,stairC),sz=Math.min(near.cy,stairR),ez=Math.max(near.cy,stairR);
  for(let x=sx;x<=ex;x++)if(map2[near.cy][x]===0)map2[near.cy][x]=1;for(let y=sz;y<=ez;y++)if(map2[y][stairC]===0)map2[y][stairC]=1;
  for(let dr=0;dr<2;dr++)for(let dc=0;dc<2;dc++)map2[stairR+dr][stairC+dc]=3;
  { // v80 — a 6×6 chamber around the foot of the stairs, joined to the nearest room
    for(let dr=-2;dr<=3;dr++)for(let dc=-2;dc<=3;dc++){const rr=stairR+dr,cc=stairC+dc;if(rr<1||cc<1||rr>=H-1||cc>=W-1)continue;if(map2[rr][cc]===0)map2[rr][cc]=1;}
    let near=null,nd=1e9;for(const rm of rooms2){const d=Math.hypot(rm.cx-(stairC+.5),rm.cy-(stairR+.5));if(d<nd){nd=d;near=rm;}}
    if(near){const x1=Math.min(stairC,near.cx),x2=Math.max(stairC,near.cx),y1=Math.min(stairR,near.cy),y2=Math.max(stairR,near.cy);for(let x=x1;x<=x2;x++)if(map2[stairR][x]===0)map2[stairR][x]=1;for(let y=y1;y<=y2;y++)if(map2[y][near.cx]===0)map2[y][near.cx]=1;}
    rooms2.push({x:stairC-2,y:stairR-2,w:6,h:6,cx:stairC+1,cy:stairR+1,kind:'stairhall'});
  }
  gen.map2=map2;gen.rooms2=rooms2;gen.stairC=stairC;gen.stairR=stairR;
  if(gen.cfg)gen.cfg.floors=2;
  return gen;
}

function makeFortInterior(size, seed){
  function rng(s){let v=s;return()=>{v=(v*1664525+1013904223)>>>0;return v/4294967296;};}
  const r=rng(seed);const rand=(a,b)=>Math.floor(r()*(b-a+1))+a;

  // Fort interior sizing — independent of cave makeDungeon sizing.
  // All fort sizes are single-floor. `en` is intentionally lower than the
  // cave equivalent (fort interiors are layout-denser).
  // v61g3: scaled 2x from initial g0 sizing — earlier playtest showed
  // forts feeling too small relative to the exterior register. en counts
  // scale sub-linearly with area (~1.5x not 4x) to keep the
  // "abandoned but recognizable" feel.
  const cfg = {
    tiny:    {W:40, H:40, en:8,  tr:1, ur:1, floors:1},
    small:   {W:48, H:48, en:11, tr:1, ur:2, floors:1},
    medium:  {W:60, H:60, en:14, tr:2, ur:3, floors:1},
    large:   {W:72, H:72, en:20, tr:2, ur:4, floors:1},
    massive: {W:88, H:88, en:27, tr:3, ur:5, floors:1},
  }[size] || {W:60, H:60, en:14, tr:2, ur:3, floors:1};

  const {W, H} = cfg;
  const map = Array.from({length:H}, () => new Array(W).fill(0));
  const rooms = [];
  const treasureDoors = [];

  // Room dimensions (declared up front so trunk + cross sizing can leave
  // room for the rooms that attach to their endpoints).
  // v61g3: scaled 2x from g0 — rooms feel grander, fit a long center rug
  // and a chandelier without crowding.
  const GREAT_HALL_W = 16, GREAT_HALL_H = 10;
  const CROSS_END_W = 10,  CROSS_END_H = 10;  // Chapel + Lord's Chamber both 10x10
  const SIDE_W = 8,        SIDE_H = 8;

  // ── TRUNK ──────────────────────────────────────────────────────
  // v61g3: 5-cell-wide hallway (was 3) so hallway columns mounted on
  // both walls don't crowd the passage. The wider trunk matches the
  // cathedral-nave register of Battlehorn-style fort interiors.
  // Trunk x: cx-2, cx-1, cx, cx+1, cx+2.
  // Trunk z: starts at GREAT_HALL_H + 2 (leaves room for the Great Hall
  // and its door at the north end), runs to z = H-2 (one cell inside the
  // south edge; the entry cell sits at z=H-1).
  const cx = Math.floor(W/2);
  const trunkX0 = cx - 2, trunkX1 = cx + 2;
  const trunkZ0 = GREAT_HALL_H + 2;  // e.g. 12 for medium (H=60, GH=10)
  const trunkZ1 = H - 2;
  for(let z = trunkZ0; z <= trunkZ1; z++){
    for(let x = trunkX0; x <= trunkX1; x++){
      map[z][x] = 7;
    }
  }

  // ── CROSS-HALL ─────────────────────────────────────────────────
  // v61g3: 5-cell-wide hallway running E-W at ~1/3 of the way down
  // from north (matching trunk width). Cross-hall is symmetric about
  // its center row cz, occupying rows cz-2..cz+2.
  // Cross x: from CROSS_END_W + 2 (leaves room for the Chapel at the
  // west end and its door cell) to W - CROSS_END_W - 3 (mirror, east end).
  const cz = trunkZ0 + Math.floor((trunkZ1 - trunkZ0) / 3);
  const crossZ0 = cz - 2, crossZ1 = cz + 2;
  const crossX0 = CROSS_END_W + 2;       // e.g. 12 for medium (W=60, end=10)
  const crossX1 = W - CROSS_END_W - 3;   // e.g. 47 for medium
  for(let z = crossZ0; z <= crossZ1; z++){
    for(let x = crossX0; x <= crossX1; x++){
      map[z][x] = 7;
    }
  }

  // Helper — carve a rectangular room and register it. `treasureFlag` true
  // marks the room's floor as 6 (treasure-floor); false marks as 1.
  // Pushes onto rooms[] using the same {x,y,w,h,cx,cy} shape makeDungeon
  // uses (y = row = z, cx/cy = center cell). v61g8: optional `kind` field
  // tags the room's semantic role for decorateFortRoom downstream.
  function carveRoom(x0, z0, w, h, treasureFlag, kind){
    const tile = treasureFlag ? 6 : 1;
    for(let z = z0; z < z0 + h; z++){
      for(let x = x0; x < x0 + w; x++){
        map[z][x] = tile;
      }
    }
    rooms.push({
      x: x0, y: z0, w: w, h: h,
      cx: Math.floor(x0 + w/2),
      cy: Math.floor(z0 + h/2),
      kind: kind || null,
    });
  }

  // Helper — place a door cell at (x,z). Uses tile 4 (unlocked) or 5 (locked).
  // isEW tracks the door's orientation (true if the door spans an east-west
  // wall — i.e. the door is in a vertical-hallway cell). Pushes onto
  // treasureDoors[] so the downstream door-mesh spawner picks it up.
  function placeDoor(x, z, locked, isEW){
    map[z][x] = locked ? 5 : 4;
    treasureDoors.push({x:x, z:z, isEW:isEW, locked:locked});
  }

  // ── GREAT HALL ─────────────────────────────────────────────────
  // 8 wide × 5 deep room at the far north end of the trunk.
  // Sits at z = 1 .. GREAT_HALL_H, centered on cx.
  // Door at z = trunkZ0 - 1, x = cx (one cell south of the room, north
  // of the trunk start).
  const ghX0 = cx - Math.floor(GREAT_HALL_W / 2);
  const ghZ0 = trunkZ0 - GREAT_HALL_H - 1;
  if(ghZ0 >= 0 && ghX0 >= 0 && ghX0 + GREAT_HALL_W <= W){
    carveRoom(ghX0, ghZ0, GREAT_HALL_W, GREAT_HALL_H, true, 'great_hall');
    // Door connecting trunk to Great Hall, at the south edge of the room.
    placeDoor(cx, trunkZ0 - 1, false, false);  // unlocked, N-S oriented door
  }

  // ── CHAPEL (cross-west end) ───────────────────────────────────
  // 5×5 room at the west end of the cross-hall. Unlocked.
  const chX0 = crossX0 - CROSS_END_W - 1;  // 1 cell for door between room and cross
  const chZ0 = cz - Math.floor(CROSS_END_H / 2);
  if(chX0 >= 0 && chZ0 >= 0 && chZ0 + CROSS_END_H <= H){
    carveRoom(chX0, chZ0, CROSS_END_W, CROSS_END_H, false, 'chapel');
    // Door at x = crossX0 - 1, z = cz (connecting Chapel to cross)
    placeDoor(crossX0 - 1, cz, false, true);  // unlocked, E-W oriented door
  }

  // ── LORD'S CHAMBER (cross-east end) ───────────────────────────
  // 5×5 treasure-floor room at the east end of the cross. Closed but unlocked.
  // v61g6: was locked door + key spawn; now closeable openable door consistent
  // with the rest of the fort. Lord's Chamber stays treasure-floor so it still
  // gets columns + chandelier from the existing fort-architecture pass.
  const lcX0 = crossX1 + 2;  // 1 cell for door
  const lcZ0 = cz - Math.floor(CROSS_END_H / 2);
  if(lcX0 + CROSS_END_W <= W && lcZ0 >= 0 && lcZ0 + CROSS_END_H <= H){
    carveRoom(lcX0, lcZ0, CROSS_END_W, CROSS_END_H, true, 'lords_chamber');
    // Door at x = crossX1 + 1, z = cz
    placeDoor(crossX1 + 1, cz, false, true);  // v61g6: unlocked
  }

  // ── TRUNK SIDE ROOMS ──────────────────────────────────────────
  // 4 rooms: 2 west of trunk, 2 east of trunk. Each 8 wide × 8 deep.
  // Positioned between the cross-hall and the entry.
  // v61g3: z-offsets scaled for 2x grid + 8x8 rooms. Layout target:
  //   crossZ1 at 29 (medium) → 5-cell gap → upper rooms (z=34..41) →
  //   4-cell gap → lower rooms (z=46..53) → 4-cell gap → entry at z=59.
  // Side rooms are NEVER treasure-floor (reserved for Great Hall and
  // Lord's Chamber). All unlocked doors.
  const sidePositions = [
    // [roomX0, roomZ0, doorX, doorZ, isEW]
    // Upper west: room body 8 cells west of trunk, door connects via gap at trunkX0 - 1
    [trunkX0 - SIDE_W - 1, crossZ1 + 5, trunkX0 - 1, crossZ1 + 5 + Math.floor(SIDE_H/2), true],
    // Upper east: room body 8 cells east of trunk
    [trunkX1 + 2,           crossZ1 + 5, trunkX1 + 1, crossZ1 + 5 + Math.floor(SIDE_H/2), true],
    // Lower west
    [trunkX0 - SIDE_W - 1, crossZ1 + 17, trunkX0 - 1, crossZ1 + 17 + Math.floor(SIDE_H/2), true],
    // Lower east
    [trunkX1 + 2,           crossZ1 + 17, trunkX1 + 1, crossZ1 + 17 + Math.floor(SIDE_H/2), true],
  ];

  // v61g8: utility kinds for the 4 side rooms — shuffled per seed so two
  // playthroughs of the same fort feel different. Six kinds available;
  // pick 4 (one of them may be storeroom — see decorateFortRoom). The
  // shuffle is Fisher-Yates with the seeded RNG already in scope.
  // v61ga: library added as a 7th candidate.
  // v61gb: dropped the duplicate storeroom — now single-entry like
  // everything else. Library odds rise to ~67% per fort; storeroom stays
  // very common (4 of 6 entries are picked, so usually 1+ rolls).
  // v61gg: shuffle uses a hash-derived sub-RNG instead of the bare layout
  // RNG. With the bare RNG, every canonical fort seed (7099-7106) produced
  // r() values > 0.83 on its first call, which made Math.floor(r * 6) = 5
  // — the first Fisher-Yates swap was always arr[5] <-> arr[5] (no-op), so
  // whatever sat at index 5 (library) never moved into the first 4 picks.
  // Result: 0/8 canonical forts ever spawned a library. Decoupling fixes
  // this and matches expected ~67% per fort.
  const UTILITY_KINDS = ['barracks', 'kitchen', 'armory', 'storeroom', 'guardroom', 'library'];
  const sideKinds = UTILITY_KINDS.slice();
  const shuffleR = rng(hashSeed(seed));
  for(let i = sideKinds.length - 1; i > 0; i--){
    const j = Math.floor(shuffleR() * (i + 1));
    [sideKinds[i], sideKinds[j]] = [sideKinds[j], sideKinds[i]];
  }

  let sideIdx = 0;
  for(const [rx0, rz0, doorX, doorZ, isEW] of sidePositions){
    // Bounds check — skip the room if it would clip the map edge.
    if(rx0 < 1 || rx0 + SIDE_W > W - 1) continue;
    if(rz0 < 1 || rz0 + SIDE_H > H - 1) continue;
    if(doorX < 0 || doorX >= W || doorZ < 0 || doorZ >= H) continue;
    carveRoom(rx0, rz0, SIDE_W, SIDE_H, false, sideKinds[sideIdx++]);
    placeDoor(doorX, doorZ, false, isEW);
  }

  // ── ENTRY ──────────────────────────────────────────────────────
  // Mark the south end of the trunk as the entrance cell (tile 2).
  // The trunk's southernmost cell at x=cx becomes the entry.
  const entC = cx;
  const entR = H - 1;
  map[entR][entC] = 2;
  // Ensure the cells just north of the entry are hallway (they already are
  // from the trunk carve, but be defensive in case trunkZ1 < H-2). All
  // five trunk-width cells flush at the south edge.
  if(trunkZ1 < H - 1){
    for(let dx = -2; dx <= 2; dx++){
      if(dx === 0) continue; // skip the entry cell itself
      map[H - 1][cx + dx] = 7;
    }
  }

  // ── KEY LOCATIONS ─────────────────────────────────────────────
  // Locked doors need keys. Use the same algorithm as makeDungeon: rank
  // floor cells by distance from entry, descending, and pick the top
  // lockedCount cells. Lord's Chamber is the only locked-door treasure
  // this ship, so we need 1 key. Cells eligible for keys are tile 1
  // (room floor) — NOT 6 (treasure) or 7 (hallway), so keys never spawn
  // in the room they unlock or out in the open.
  const floorCells = [];
  for(let z = 0; z < H; z++){
    for(let x = 0; x < W; x++){
      if(map[z][x] === 1) floorCells.push({x:x, y:z});
    }
  }
  floorCells.sort((a, b) =>
    Math.hypot(b.x - entC, b.y - entR) - Math.hypot(a.x - entC, a.y - entR));
  const lockedCount = treasureDoors.filter(d => d.locked).length;
  const keyLocations = floorCells.slice(0, Math.max(1, lockedCount));

  // Return the same shape as makeDungeon. map2/rooms2 null (single-floor).
  // stairC/stairR null (no stair this ship).
  return {
    map: map,
    map2: null,
    W: W,
    H: H,
    rooms: rooms,
    rooms2: null,
    entC: entC,
    entR: entR,
    treasureDoors: treasureDoors,
    stairC: null,
    stairR: null,
    keyLocations: keyLocations,
    cfg: cfg,
  };
}

// v61g0: register fort_tee now that makeFortInterior is defined.
FORT_INTERIORS.fort_tee = (size, seed) => makeFortInterior(size, seed);

// v61g6: makeFortInterior_linear — long trunk + alternating side rooms, no
// cross-hall. Reads "outpost" — smaller, simpler, one ceremonial space at
// the back. Used for the smaller / older fort exteriors (palisade,
// watchtower_canopy, earthwork).
//
// Layout (entry at south, Great Hall at north):
//   - 5-cell-wide trunk hallway running full height (entry → Great Hall door)
//   - Great Hall at far north end (16×10, treasure-floor, closeable door)
//   - 4 side rooms branching off the trunk on alternating sides at z-offsets
//     ~30%, ~50%, ~70%, ~85% down the trunk. All 8×8, all closeable doors.
//   - No locked doors. No keys.
//
// Tile vocabulary same as tee: 0/1/2/4/6/7.
function makeFortInterior_linear(size, seed){
  function rng(s){let v=s;return()=>{v=(v*1664525+1013904223)>>>0;return v/4294967296;};}
  const r=rng(seed);

  // Linear fort sizing — slightly lower en than tee (smaller layout, "outpost"
  // register). Same W/H to keep all fort interiors at consistent scale.
  const cfg = {
    tiny:    {W:40, H:40, en:6,  tr:1, ur:0, floors:1},
    small:   {W:48, H:48, en:8,  tr:1, ur:0, floors:1},
    medium:  {W:60, H:60, en:10, tr:1, ur:0, floors:1},
    large:   {W:72, H:72, en:14, tr:1, ur:0, floors:1},
    massive: {W:88, H:88, en:19, tr:1, ur:0, floors:1},
  }[size] || {W:60, H:60, en:10, tr:1, ur:0, floors:1};

  const {W, H} = cfg;
  const map = Array.from({length:H}, () => new Array(W).fill(0));
  const rooms = [];
  const treasureDoors = [];

  const GREAT_HALL_W = 16, GREAT_HALL_H = 10;
  const SIDE_W = 8, SIDE_H = 8;

  function carveRoom(x0, z0, w, h, treasureFlag, kind){
    const tile = treasureFlag ? 6 : 1;
    for(let z = z0; z < z0 + h; z++){
      for(let x = x0; x < x0 + w; x++){
        map[z][x] = tile;
      }
    }
    rooms.push({x:x0, y:z0, w:w, h:h, cx:Math.floor(x0+w/2), cy:Math.floor(z0+h/2), kind:kind||null});
  }
  function placeDoor(x, z, isEW){
    map[z][x] = 4;
    treasureDoors.push({x:x, z:z, isEW:isEW, locked:false});
  }

  // ── TRUNK ──────────────────────────────────────────────────────
  // 5-cell-wide N-S spine from just south of the Great Hall door down to the
  // entry. trunkZ0 starts where the Great Hall door sits (one cell south of
  // the Great Hall room itself).
  const cx = Math.floor(W/2);
  const trunkX0 = cx - 2, trunkX1 = cx + 2;
  const trunkZ0 = GREAT_HALL_H + 2;
  const trunkZ1 = H - 2;
  for(let z = trunkZ0; z <= trunkZ1; z++){
    for(let x = trunkX0; x <= trunkX1; x++){
      map[z][x] = 7;
    }
  }

  // ── GREAT HALL ─────────────────────────────────────────────────
  const ghX0 = cx - Math.floor(GREAT_HALL_W / 2);
  const ghZ0 = trunkZ0 - GREAT_HALL_H - 1;
  if(ghZ0 >= 0 && ghX0 >= 0 && ghX0 + GREAT_HALL_W <= W){
    carveRoom(ghX0, ghZ0, GREAT_HALL_W, GREAT_HALL_H, true, 'great_hall');
    placeDoor(cx, trunkZ0 - 1, false);
  }

  // ── SIDE ROOMS — alternating sides ────────────────────────────
  // 4 rooms, alternating W/E/W/E down the trunk. Offsets chosen to leave
  // hallway clearance between rooms and to fit the room footprints.
  // For medium (H=60): trunkZ0=12, trunkZ1=58 → 46-cell trunk. Slot z-centers:
  //   slot 0 at z ≈ 22 (10 cells south of trunkZ0)
  //   slot 1 at z ≈ 32
  //   slot 2 at z ≈ 42
  //   slot 3 at z ≈ 52
  // Each room is SIDE_W × SIDE_H at the slot's z-center.
  const trunkLen = trunkZ1 - trunkZ0;
  // Place 4 rooms evenly spaced along the trunk between trunkZ0+6 and trunkZ1-6.
  const usableLen = trunkLen - 12;  // leave 6 cells at each end
  const slotSpacing = Math.floor(usableLen / 3); // 4 slots → 3 gaps
  const slotZs = [
    trunkZ0 + 6,
    trunkZ0 + 6 + slotSpacing,
    trunkZ0 + 6 + slotSpacing * 2,
    trunkZ0 + 6 + slotSpacing * 3,
  ];
  // Alternate W (false) / E (true). Randomize starting side via seed.
  // v61g8: utility kinds for the 4 side rooms.
  const UTILITY_KINDS_LIN = ['barracks', 'kitchen', 'armory', 'storeroom', 'guardroom', 'library'];
  const sideKinds = UTILITY_KINDS_LIN.slice();
  // v61gg: hash-decoupled shuffle RNG — see makeFortInterior for the bug
  // (canonical seeds clustered the first r() output > 0.83, freezing index
  // 5 in place and zeroing library spawn rate).
  const shuffleR = rng(hashSeed(seed));
  for(let i = sideKinds.length - 1; i > 0; i--){
    const j = Math.floor(shuffleR() * (i + 1));
    [sideKinds[i], sideKinds[j]] = [sideKinds[j], sideKinds[i]];
  }
  let sideIdx = 0;

  const startEast = r() > 0.5;
  for(let i = 0; i < 4; i++){
    const isEast = (i % 2 === 0) ? startEast : !startEast;
    const zCenter = slotZs[i];
    const rz0 = zCenter - Math.floor(SIDE_H / 2);
    const rx0 = isEast ? (trunkX1 + 2) : (trunkX0 - SIDE_W - 1);
    const doorX = isEast ? (trunkX1 + 1) : (trunkX0 - 1);
    const doorZ = zCenter;
    if(rx0 < 1 || rx0 + SIDE_W > W - 1) continue;
    if(rz0 < 1 || rz0 + SIDE_H > H - 1) continue;
    if(doorX < 0 || doorX >= W) continue;
    carveRoom(rx0, rz0, SIDE_W, SIDE_H, false, sideKinds[sideIdx++]);
    placeDoor(doorX, doorZ, true);
  }

  // ── ENTRY ──────────────────────────────────────────────────────
  const entC = cx;
  const entR = H - 1;
  map[entR][entC] = 2;
  if(trunkZ1 < H - 1){
    for(let dx = -2; dx <= 2; dx++){
      if(dx === 0) continue;
      map[H - 1][cx + dx] = 7;
    }
  }

  // ── KEY LOCATIONS ─────────────────────────────────────────────
  // No locked doors in linear forts, so no keys needed. Return empty array
  // (downstream skips key spawn when allDoors has no locked entries).
  const keyLocations = [];

  return {
    map:map, map2:null, W:W, H:H, rooms:rooms, rooms2:null,
    entC:entC, entR:entR, treasureDoors:treasureDoors,
    stairC:null, stairR:null, keyLocations:keyLocations, cfg:cfg,
  };
}

// v61g6: makeFortInterior_courtyard — short entry corridor → central
// courtyard-room → 4 rooms doored off the courtyard's cardinal walls + 2
// utility rooms flanking the entry corridor. Reads "keep" — the courtyard
// IS the hub. Used for the "this is a building, not a perimeter" exteriors
// (keep, monastery).
//
// Layout (entry at south, Great Hall at north behind the courtyard):
//   - 5-cell-wide entry corridor running south→north from entry to courtyard
//   - 12×12 central courtyard-room (treasure-floor), gets columns from the
//     existing fort-architecture pass — reads as "the keep's hall"
//   - N door (closeable) → Great Hall (16×10, treasure-floor)
//   - E door (closeable) → Lord's Chamber (10×10, treasure-floor)
//   - W door (closeable) → Chapel (10×10, plain floor)
//   - 2 utility rooms (8×8, plain floor) flank the entry corridor on E and W
//
// All doors closeable, none locked. tr:2 (great hall + lord's chamber).
function makeFortInterior_courtyard(size, seed){
  function rng(s){let v=s;return()=>{v=(v*1664525+1013904223)>>>0;return v/4294967296;};}
  const r=rng(seed);

  // Courtyard fort sizing — en slightly higher than tee (more enemies, packed
  // central room creates concentrated combat).
  const cfg = {
    tiny:    {W:40, H:40, en:10, tr:2, ur:0, floors:1},
    small:   {W:48, H:48, en:13, tr:2, ur:0, floors:1},
    medium:  {W:60, H:60, en:17, tr:2, ur:0, floors:1},
    large:   {W:72, H:72, en:24, tr:2, ur:0, floors:1},
    massive: {W:88, H:88, en:32, tr:2, ur:0, floors:1},
  }[size] || {W:60, H:60, en:17, tr:2, ur:0, floors:1};

  const {W, H} = cfg;
  const map = Array.from({length:H}, () => new Array(W).fill(0));
  const rooms = [];
  const treasureDoors = [];

  const COURTYARD_W = 12, COURTYARD_H = 12;
  const GREAT_HALL_W = 16, GREAT_HALL_H = 10;
  const SIDE_END_W = 10, SIDE_END_H = 10;  // Chapel, Lord's Chamber
  const UTIL_W = 8, UTIL_H = 8;

  function carveRoom(x0, z0, w, h, treasureFlag, kind){
    const tile = treasureFlag ? 6 : 1;
    for(let z = z0; z < z0 + h; z++){
      for(let x = x0; x < x0 + w; x++){
        map[z][x] = tile;
      }
    }
    rooms.push({x:x0, y:z0, w:w, h:h, cx:Math.floor(x0+w/2), cy:Math.floor(z0+h/2), kind:kind||null});
  }
  function placeDoor(x, z, isEW){
    map[z][x] = 4;
    treasureDoors.push({x:x, z:z, isEW:isEW, locked:false});
  }

  // ── COURTYARD ─────────────────────────────────────────────────
  // 12×12 treasure-floor central room. Positioned so its center sits at
  // (cx, cz) where cz is ~1/3 of the way down from the north edge — leaves
  // room for the Great Hall to the north and the entry corridor to the south.
  const cx = Math.floor(W/2);
  // Courtyard top: leave GREAT_HALL_H + 2 cells of room for Great Hall + door.
  const courtyardZ0 = GREAT_HALL_H + 2;
  const courtyardZ1 = courtyardZ0 + COURTYARD_H - 1;
  const courtyardX0 = cx - Math.floor(COURTYARD_W / 2);
  const courtyardX1 = courtyardX0 + COURTYARD_W - 1;
  carveRoom(courtyardX0, courtyardZ0, COURTYARD_W, COURTYARD_H, true, 'courtyard_hall');
  const courtyardCz = Math.floor((courtyardZ0 + courtyardZ1) / 2);

  // ── GREAT HALL (north of courtyard) ───────────────────────────
  const ghX0 = cx - Math.floor(GREAT_HALL_W / 2);
  const ghZ0 = courtyardZ0 - GREAT_HALL_H - 1;
  if(ghZ0 >= 0 && ghX0 >= 0 && ghX0 + GREAT_HALL_W <= W){
    carveRoom(ghX0, ghZ0, GREAT_HALL_W, GREAT_HALL_H, true, 'great_hall');
    // Door connecting courtyard's north wall to Great Hall's south wall.
    placeDoor(cx, courtyardZ0 - 1, false);
  }

  // ── CHAPEL (west of courtyard) ────────────────────────────────
  const chX0 = courtyardX0 - SIDE_END_W - 1;
  const chZ0 = courtyardCz - Math.floor(SIDE_END_H / 2);
  if(chX0 >= 0 && chZ0 >= 0 && chZ0 + SIDE_END_H <= H){
    carveRoom(chX0, chZ0, SIDE_END_W, SIDE_END_H, false, 'chapel');
    placeDoor(courtyardX0 - 1, courtyardCz, true);
  }

  // ── LORD'S CHAMBER (east of courtyard) ────────────────────────
  const lcX0 = courtyardX1 + 2;
  const lcZ0 = courtyardCz - Math.floor(SIDE_END_H / 2);
  if(lcX0 + SIDE_END_W <= W && lcZ0 >= 0 && lcZ0 + SIDE_END_H <= H){
    carveRoom(lcX0, lcZ0, SIDE_END_W, SIDE_END_H, true, 'lords_chamber');
    placeDoor(courtyardX1 + 1, courtyardCz, true);
  }

  // ── ENTRY CORRIDOR (south of courtyard, leading to entry) ─────
  // 5-cell-wide N-S spine from courtyard's south edge down to the entry.
  // Short — just a few cells, since the courtyard IS the hub.
  const corridorX0 = cx - 2, corridorX1 = cx + 2;
  const corridorZ0 = courtyardZ1 + 1;
  const corridorZ1 = H - 2;
  for(let z = corridorZ0; z <= corridorZ1; z++){
    for(let x = corridorX0; x <= corridorX1; x++){
      map[z][x] = 7;
    }
  }
  // Open the courtyard's south wall to the corridor (the cells immediately
  // north of corridorZ0 are courtyard treasure-floor; the corridor opens
  // directly into them via tile 7 → 6 transition). No door between courtyard
  // and entry corridor — the courtyard is the open hall of the keep.

  // ── UTILITY ROOMS (flank entry corridor) ──────────────────────
  // 2 rooms, 8×8 each, on E and W of the entry corridor, doored.
  // Centered z-wise on the corridor's midpoint.
  // v61g8: kinds shuffled per seed across guardroom/barracks/storeroom/armory.
  const UTILITY_KINDS_CY = ['guardroom', 'barracks', 'storeroom', 'armory', 'library'];
  const cyKinds = UTILITY_KINDS_CY.slice();
  // v61gg: hash-decoupled shuffle RNG — see makeFortInterior for the bug.
  const shuffleR = rng(hashSeed(seed));
  for(let i = cyKinds.length - 1; i > 0; i--){
    const j = Math.floor(shuffleR() * (i + 1));
    [cyKinds[i], cyKinds[j]] = [cyKinds[j], cyKinds[i]];
  }
  const utilCz = Math.floor((corridorZ0 + corridorZ1) / 2);
  const utilZ0 = utilCz - Math.floor(UTIL_H / 2);
  // West utility
  {
    const rx0 = corridorX0 - UTIL_W - 1;
    if(rx0 >= 1 && utilZ0 >= 1 && utilZ0 + UTIL_H <= H - 1){
      carveRoom(rx0, utilZ0, UTIL_W, UTIL_H, false, cyKinds[0]);
      placeDoor(corridorX0 - 1, utilCz, true);
    }
  }
  // East utility
  {
    const rx0 = corridorX1 + 2;
    if(rx0 + UTIL_W <= W - 1 && utilZ0 >= 1 && utilZ0 + UTIL_H <= H - 1){
      carveRoom(rx0, utilZ0, UTIL_W, UTIL_H, false, cyKinds[1]);
      placeDoor(corridorX1 + 1, utilCz, true);
    }
  }

  // ── ENTRY ──────────────────────────────────────────────────────
  const entC = cx;
  const entR = H - 1;
  map[entR][entC] = 2;
  if(corridorZ1 < H - 1){
    for(let dx = -2; dx <= 2; dx++){
      if(dx === 0) continue;
      map[H - 1][cx + dx] = 7;
    }
  }
  // Mute unused-var lint (r not used after slot side randomization removed
  // for courtyard layout — keep rng around for future use).
  void r;

  const keyLocations = [];

  return {
    map:map, map2:null, W:W, H:H, rooms:rooms, rooms2:null,
    entC:entC, entR:entR, treasureDoors:treasureDoors,
    stairC:null, stairR:null, keyLocations:keyLocations, cfg:cfg,
  };
}

// v61g6: register the two new variants.
FORT_INTERIORS.fort_linear = (size, seed) => makeFortInterior_linear(size, seed);
FORT_INTERIORS.fort_courtyard = (size, seed) => makeFortInterior_courtyard(size, seed);

const DTHEME={d1:{fog:0x120f1a,amb:0xffa060},d2:{fog:0x1a0a08,amb:0xff6030},d3:{fog:0x08101a,amb:0x3060ff}};
let dScene=null,dMap=[],dR=0,dC=0;
let dMap2=null; // floor-2 map (null = single-floor dungeon)
let currentFloor=1; // 1 or 2
let mmRevealed=[];
let mmRevealed2=[];
let dEntranceX=1,dEntranceZ=1;
let DOORS=[],KEYS=[];
let ENEMIES=[],CORPSES=[],CHESTS=[],BARRELS=[],TORCHES=[],BALLS=[];
let dStairC=null,dStairR=null;
let currentPortal=null;

// Build a Mimic-style chest shell — wooden body, lid, iron bands, lock. Returns {body, lid} for callers that need refs.
// Used by both the Mimic buildFn (as its disguise) AND by regular lootable chest spawns — identical visual so Mimics
// are indistinguishable until they reveal. Wood color defaults to the Mimic's 0x8b5a2b so chest/mimic swap is seamless.
// S198 — the chest on the shape kit (H.4, the mimic; every chest shares it, so a mimic's disguise stays exact): a
// rounded body with iron corner caps, bands and a lock plate, feet, and a barrel lid hung on a hinge at the back (the
// lid is a pivot group, so opening turns it about the hinge). Body and lid are one merged mesh each, on their own
// material (the telegraph's flash is this chest's alone). {body, lid} as before; lid.rotation.x < 0 opens it.
function buildChestShell(g, sc, woodCol=0x8b5a2b){
  const W=.5*sc,H=.35*sc,D=.4*sc,iron=new THREE.Color(0x2e2a26),wood=new THREE.Color(woodCol),r0=pRng(((woodCol>>>0)+Math.round(sc*1000))>>>0);
  const P=[];const add=(geo,col,x,y,z,rx,ry,rz)=>{const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),new THREE.Vector3(1,1,1));P.push([geo,col,m]);};
  add(SK.rbox(W,H,D,.025*sc,2),wood,0,H/2+.02*sc,0);
  // planks: three shallow grooves along the front and back
  for(const fz of [1,-1])for(const y of [.33,.66])add(new THREE.BoxGeometry(W*.96,.008*sc,.01*sc),wood.clone().multiplyScalar(.55),0,.02*sc+H*y,fz*(D/2+.002));
  for(const bx of [-.34,.34])add(SK.rbox(.05*sc,H+.01*sc,D+.02*sc,.01*sc,1),iron,bx*W,H/2+.02*sc,0);
  for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){add(SK.rbox(.07*sc,.07*sc,.07*sc,.015*sc,1),iron,sx*(W/2-.02*sc),H+.0*sc,sz*(D/2-.02*sc));add(SK.rbox(.07*sc,.05*sc,.07*sc,.015*sc,1),iron,sx*(W/2-.03*sc),.025*sc,sz*(D/2-.03*sc));}
  add(SK.rbox(.11*sc,.13*sc,.03*sc,.01*sc,1),iron,0,H-.03*sc,D/2+.01*sc);add(new THREE.BoxGeometry(.018*sc,.04*sc,.01*sc),new THREE.Color(0x0a0806),0,H-.045*sc,D/2+.027*sc);
  const body=dunMerge(P,'chest');g.add(body);
  // the lid: a half barrel on the hinge at the back top edge
  const lid=new THREE.Group();lid.position.set(0,H+.02*sc,-D/2);g.add(lid);const L=[];const addL=(geo,col,x,y,z,rx,ry,rz)=>{const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),new THREE.Vector3(1,1,1));L.push([geo,col,m]);};
  const lr=D/2+.01*sc;addL(new THREE.CylinderGeometry(lr,lr,W+.02*sc,14,1,false,0,Math.PI),wood,0,0,D/2,0,0,Math.PI/2);
  addL(new THREE.CircleGeometry(lr,14,0,Math.PI),wood.clone().multiplyScalar(.9),W/2+.011*sc,0,D/2,0,Math.PI/2,0);addL(new THREE.CircleGeometry(lr,14,0,Math.PI),wood.clone().multiplyScalar(.9),-W/2-.011*sc,0,D/2,0,-Math.PI/2,0);
  for(const bx of [-.34,.34])addL(new THREE.CylinderGeometry(lr+.008*sc,lr+.008*sc,.05*sc,14,1,true,0,Math.PI),iron,bx*W,0,D/2,0,0,Math.PI/2);
  addL(SK.rbox(.12*sc,.06*sc,.03*sc,.01*sc,1),iron,0,-.01*sc,D+.01*sc);
  const lidMesh=dunMerge(L,'chest');lid.add(lidMesh);lid.userData.mesh=lidMesh;
  return {body, lid};
}
// S200 — a barrel on the kit: bellied staves (a lathe), four iron hoops, a sunk head; the lid a
// separate disc so it can pop off when looted. s scales the dungeon's barrel (.22 across, .55 high).
function kitBarrel(s,woodCol){const R_=.22*s,Hh=.55*s,wood=new THREE.Color(woodCol),iron=new THREE.Color(0x2a241e),P=[];
  const add=(geo,col,x,y,z,rx,ry,rz)=>P.push([geo,col,new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),new THREE.Vector3(1,1,1))]);
  const prof=[];for(let i=0;i<=8;i++){const u=i/8;prof.push([R_*(.86+.14*Math.sin(Math.PI*u)),Hh*u]);}
  add(new THREE.LatheGeometry(prof.map(q=>new THREE.Vector2(q[0],q[1])),16),wood,0,0,0);
  for(const u of [.1,.3,.7,.9])add(new THREE.TorusGeometry(R_*(.86+.14*Math.sin(Math.PI*u))+.004*s,.012*s,4,20),iron,0,Hh*u,0,Math.PI/2,0,0);
  add(new THREE.CircleGeometry(R_*.84,16),wood.clone().multiplyScalar(.75),0,.02*s,0,Math.PI/2,0,0);
  const body=dunMerge(P,'barrel');
  const top=new THREE.Mesh(new THREE.CylinderGeometry(R_*.86,R_*.86,.03*s,16),new THREE.MeshLambertMaterial({color:wood.clone().multiplyScalar(.7)}));top.position.y=Hh-.03*s;
  return {body,top};}
// the mimic's mouth (S198): teeth along the lid's rim and the body's, a tongue, eyes under the lid; hidden till it wakes
function buildMimicMouth(g, sc, lid, eyeCol){const W=.5*sc,H=.35*sc,D=.4*sc;const T=[];const E=[];const tooth=new THREE.Color(0xe8e0c8);
  const addT=(list,geo,col,x,y,z,rx,ry,rz)=>{list.push([geo,col,new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),new THREE.Vector3(1,1,1))]);};
  for(let k=0;k<9;k++){const x=-W/2+.04*sc+k*(W-.08*sc)/8;addT(T,SK.cone(.022*sc,.07*sc,5),tooth,x,H+.02*sc-.03*sc+.06*sc,D/2-.03*sc,0,0,0);}
  for(let k=0;k<3;k++)for(const sx of [-1,1])addT(T,SK.cone(.02*sc,.06*sc,5),tooth,sx*(W/2-.03*sc),H+.05*sc,D/2-.08*sc-k*.09*sc,0,0,0);
  addT(T,SK.rbox(W*.55,.03*sc,D*.6,.012*sc,1),new THREE.Color(0x8a2a3a),0,H-.02*sc,.02*sc,-.15,0,0);
  const low=dunMerge(T,'mimic');low.visible=false;g.add(low);
  const U=[];for(let k=0;k<9;k++){const x=-W/2+.04*sc+k*(W-.08*sc)/8;addT(U,SK.cone(.022*sc,.07*sc,5),tooth,x,-.04*sc,D-.02*sc,Math.PI,0,0);}
  const up=dunMerge(U,'mimic');up.visible=false;lid.add(up);
  for(const s of [-1,1])addT(E,SK.ball(.028*sc,8,6),new THREE.Color(eyeCol),s*.09*sc,-.03*sc,D*.7,0,0,0);
  const eyes=dunMerge(E,'mimic');eyes.material=new THREE.MeshBasicMaterial({color:eyeCol});eyes.visible=false;lid.add(eyes);
  const teeth=new THREE.Group();teeth.visible=false;g.add(teeth); // one switch for reveal: it shows the two rows below
  teeth.userData.rows=[low,up];return {teeth,eyes};}
// the mimic's jaw, each frame while awake: a slow gape, wide while it winds up to bite
function tickMimicJaws(now){if(typeof ENEMIES==='undefined')return;for(const e of ENEMIES){const L=e.limbs;if(!L||!L.jaw||e.disguised)continue;
  if(e.dead){L.jaw.rotation.x+=(-.15-L.jaw.rotation.x)*.1;continue;}const wind=e.telegraphMax>0&&e.telegraphT>0?1-e.telegraphT/e.telegraphMax:0;
  L.jaw.rotation.x=-(.35+.18*Math.abs(Math.sin(now*.005+e.ph))+wind*.7);}}

function activeMap(){return currentFloor===2&&dMap2?dMap2:dMap;}

function dSolid(x,z){
  const col=Math.floor(x+.5),row=Math.floor(z+.5);
  const map=activeMap();
  if(row<0||row>=dR||col<0||col>=dC)return true;
  const v=map[row][col];
  if(v===0)return true;
  // v61g6: tile 4 (unlocked door) now consults DOORS like tile 5 does. Pre-v61g6,
  // tile 4 returned !solid unconditionally because unlocked doors had no mesh and
  // were treated as permanently-open passages. v61g6 spawns door meshes for ALL
  // tile-4 doors (fort interiors + cave corridor doors) and they're closeable, so
  // collision must reflect open/closed state. If no DOORS entry exists at this
  // cell (e.g. legacy save, pre-v61g6 dungeon, or an open passage that was never
  // a door), we fall back to "passable" — preserving the old behavior.
  if(v===4){const d=DOORS.find(d=>d.x===col&&d.z===row&&d.floor===currentFloor);return d?!d.open:false;}
  if(v===5){const d=DOORS.find(d=>d.x===col&&d.z===row&&d.floor===currentFloor);return d?!d.open:true;}
  // v61g1: v===6 (treasure floor) is plain-walkable. Previous radius-3
  // cardinal-search logic was load-bearing for no actual gameplay value —
  // the room is geometrically sealed by its v===0 perimeter walls, so
  // entry still requires passing through the door cell. The radius-3
  // search introduced three bugs: diagonal back-corner cells couldn't
  // find the door, doors more than 3 cells away couldn't be found at all
  // (breaking any treasure room larger than ~3x3), and locked rooms read
  // as sealed even when the door was open. Affects every treasure room
  // in every dungeon — anchor sites and fort interiors alike.
  if(v===6){
    // v61g4: check column collision before allowing pass-through.
    if(dColumnHit(x, z)) return true;
    // v61g9: check prop collision (banquet tables, beds, racks, etc).
    if(dPropHit(x, z)) return true;
    return false;
  }
  if(v===3)return false;
  if(v===7){
    // v61g4: hallway floor — check column collision (fort hallway columns).
    if(dColumnHit(x, z)) return true;
    // v61g9: also check fixed-prop collision for hallway-bordering props.
    if(dPropHit(x, z)) return true;
    return false;
  }
  // v61g4: tile 1 also needs to honor columns inside non-treasure rooms
  // (the Chapel has internal columns at the chapel-nave positions).
  if(v===1){
    if(dColumnHit(x, z)) return true;
    // v61g9: fixed-prop collision — the most common case (most fort rooms).
    if(dPropHit(x, z)) return true;
    return false;
  }
  return false;
}
// v61g4: per-column collision list, populated by renderFortArchitecture
// and consulted from dSolid. Each entry is {x, z, r} — center + radius.
// Cleared each buildDungeon call.
let DUNGEON_COLUMNS = [];
function dColumnHit(x, z){
  if(!DUNGEON_COLUMNS || DUNGEON_COLUMNS.length === 0) return false;
  for(const col of DUNGEON_COLUMNS){
    const dx = x - col.x;
    const dz = z - col.z;
    if(dx*dx + dz*dz < col.r * col.r) return true;
  }
  return false;
}
// v61g9: per-prop collision list, axis-aligned rectangles. Populated by
// decorateFortRoom via the `solid` variants of its box/cyl helpers and
// consulted from dSolid alongside dColumnHit. Each entry is {x0, x1, z0, z1}
// where the rect has ALREADY been inflated by the player collision radius
// (0.22u) at registration time, so dPropHit is a tight point-in-rect check.
// Cleared each buildDungeon call alongside DUNGEON_COLUMNS.
let DUNGEON_PROPS = [];
