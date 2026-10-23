// checkPortals removed — dungeon entry now via E-key interact()

// ── DUNGEON ──────────────────────────────────────────────────
// ── PROCEDURAL DUNGEON GENERATOR ────────────────────────────
// Cell: 0=wall 1=floor 2=entrance 3=stair(connects floor1↔floor2) 4=unlocked-door 5=locked-door 6=treasure
// Two-floor architecture: floor 1 at worldY=0, floor 2 at worldY=FLOOR2_Y.
// Both floors share the same XZ grid. The stair cell (3) appears in both maps at the same column/row.
// Only medium/large/massive dungeons have a floor 2.
let FLOOR2_Y=-5.0; // v80 — floor two lies BELOW floor one: you go down into a gate, not up; S1283 — by the dungeon's ceiling (buildDungeon)
// v80 S7 — FOOTHOLDS: walkable levels above the base floor for interiors and
// dungeons. {x0,x1,z0,z1,y} is a platform; add axis:'x'|'z',y0,y1 for a ramp
// whose height interpolates from the axis' 0-edge to its 1-edge. The ground
// resolver picks the highest foothold no more than STEP_UP above the player,
// so you climb ramps, walk under decks, and fall off edges. Reset per room.
let FOOTHOLDS=[],INT_SOL=[],DUNGEON_STAIRWELL=false;
// S1070 (card F2b, the body in the world) — a step at true scale is 0.40 m: over a stair's rise (0.18) and a kerb, not onto a
// chair (0.45), a bed (0.5) or a table (0.75), which a jump (apex 0.84) puts you on. It was 0.62, for the old 1.1 m body.
const STEP_UP=.40;
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
    if(f.holes&&f.holes.some(h=>x>h.x0&&x<h.x1&&z>h.z0&&z<h.z1))continue; // S601 — a floor with several openings
    let y=f.y;
    if(f.axis){const t=f.axis==='x'?(x-f.x0)/(f.x1-f.x0):(z-f.z0)/(f.z1-f.z0);y=f.y0+(f.y1-f.y0)*Math.max(0,Math.min(1,t));}
    if(y<=py+STEP_UP&&y>best)best=y;
  }
  return best;
}
let INT_BEDS=[];let INT_DOORS=[];let INT_CHAIR=null; /* S561 — the barber's chair in a generated room: {x, z, house} */
// S561 — within reach of the barber's chair and nearer it than the barber who stands beside it; within 1.2 of him, E talks to him
/* S656 — the chair answers to the crosshair (Michael's 6 Oct playtest): in reach, on the floor, its frame under the crosshair; the barber
   takes E instead only when he is nearer and the crosshair is on him */
function nearBarberChair(){if(!INT_CHAIR)return false;const d=Math.hypot(px-INT_CHAIR.x,pz-INT_CHAIR.z);if(d>=TOUCH||Math.abs(jumpY)>=.9)return false;if(!aimBox(INT_CHAIR.x,INT_CHAIR.z,0,.32,.34,1.2))return false;const k=typeof intNPCPos!=='undefined'&&intNPCPos&&intNPCMesh?Math.hypot(px-intNPCPos.x,pz-intNPCPos.z):1e9;return !(k<d&&aimAt({g:intNPCMesh},3.6));} // v80 S143 — doors inside buildings
// v80 S11 — solids carry a height band {y0,y1}. An object whose top is
// within a step of your feet doesn't block (you step onto it — it's also a
// foothold); an object entirely above your head doesn't block (you walk
// under it); a jump that clears the top passes over it.
const PLAYER_H=1.0;
function intSolidAt(x,z,R,Y){const y=Y!=null?Y:jumpY;for(let i=0;i<INT_SOL.length;i++){const s=INT_SOL[i]; // Y: whose feet (S232 — townsfolk indoors test at their own height, not the player's)
  if(s.y1!=null&&s.y1<=y+STEP_UP)continue;      // low enough to step onto / already above it
  if(s.y0!=null&&s.y0>=y+PLAYER_H)continue;      // entirely overhead
  if(x>s.x0-R&&x<s.x1+R&&z>s.z0-R&&z<s.z1+R)return true;}return false;}
let FLOOR_HEIGHT=3.2; // wall/ceiling height per floor; S564: the dungeon's own, set by buildDungeon (dunFloorHeight)
// S1283 (card F5, Michael's A on #421; docs/design/gate-interiors-build.md) — the dungeon's cell by kind. An old gate's cell is 3 m
// under a 6 m ceiling; a fort's insides (fort_*), a lair's cavern and the tutorial's crypt are 2.5 m under 3.6, a dragon's lair 5.5
// (the wyrm stands 4.5). Read from the portal's kind, never saved. The generators lay a dungeon out in cells and buildDungeon builds
// it there, then scales it whole by its cell (dunScaleWhole): from then on every position in it is in metres, and the map is read
// at dCellOf(x). DCELL is the cell of the dungeon you are in (1 while one is being built, and outside one). The ceiling is metres
// from the start: walls are built at FLOOR_HEIGHT and only stretched across.
const GATE_CELL=3,GATE_CEIL=6,KEEP_CELL=2.5,KEEP_CEIL=3.6,WYRM_CEIL=5.5;
let DCELL=1;
function dunKeepKind(portal){return !!(portal&&((typeof portal.interior==='string'&&portal.interior.startsWith('fort_'))||portal.lair||portal.lairDoor||portal.tutorial));}
function dunCellFor(portal){return dunKeepKind(portal)?KEEP_CELL:GATE_CELL;}
function dunFloorHeight(portal){return portal&&portal.lair&&portal.lair.dragon?WYRM_CEIL:dunKeepKind(portal)?KEEP_CEIL:GATE_CEIL;}
// floor two hangs under floor one by its ceiling and 1.8 of rock, as the old 3.2 room hung at −5
function dunFloor2Y(h){return -(h+1.8);}
// a position in metres to its cell, and a cell to the metres of its centre
function dCellOf(v){return Math.floor(v/DCELL+.5);}
// S1293 — the roof over a point of the dungeon, metres over its floor: a gate's spaces stand to 50 m (makeGate's ceilAt), the rest
// is FLOOR_HEIGHT. D_CEIL[floor] reads a point in cells; set by buildDungeon.
let D_CEIL=[null,null,null];
function dCeil(x,z){const f=D_CEIL[currentFloor];return f?f(x/DCELL,z/DCELL):FLOOR_HEIGHT;}
function dAt(c){return c*DCELL;}

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
  const r=dunLcg(seed);const rand=(a,b)=>Math.floor(r()*(b-a+1))+a;
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

  return dunAfterLayout(map,rooms,rooms.slice(1),cfg,r,rand,seed,entC,entR,null);
}
// S1293 — makeDungeon's tail, from the treasure rooms on (the doors, the well, the keys, floor two), its own function so a gate's
// space pass (makeGate) shares it: `rest` are the rooms a treasure room or the well may hang off (makeDungeon's all but the first),
// `noDoor` the cells no door is hung in (a gate's thresholds). The stream r is the caller's, so makeDungeon rolls as it always did.
function dunLcg(s){let v=s;return()=>{v=(v*1664525+1013904223)>>>0;return v/4294967296;};}
function dunAfterLayout(map,rooms,rest,cfg,r,rand,seed,entC,entR,noDoor){
  const{W,H}=cfg;
  // Treasure rooms attached to non-entrance rooms
  const treasureDoors=[];
  const anchors=[...rest].sort(()=>r()-.5);
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
    if((isHCorridor||isVCorridor)&&!(noDoor&&noDoor(x,y)))corridorCells.push({x,y,isEW:isHCorridor});
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
    let candidates=rest.filter(rm=>rm.w>=5&&rm.h>=5&&map[rm.cy][rm.cx]===1&&Math.hypot(rm.cx-entC,rm.cy-entR)>5);
    if(!candidates.length)candidates=rest.filter(rm=>map[rm.cy][rm.cx]===1&&Math.hypot(rm.cx-entC,rm.cy-entR)>5);
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
    const r2=dunLcg(seed+1);const rand2=(a,b)=>Math.floor(r2()*(b-a+1))+a;
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

// ═══ S1293 (card F5, the build sheet's session 2; Michael's B on #448) — A GATE AS SPACES ═══
// An old gate is a chain of great spaces on its 3 m grid, laid before the rooms: a nave, a crossing, a chasm, a flooded hall,
// and the ring chamber always last (gate-interiors-build.md, "The six spaces"). Spaces join through thresholds (a slit 1 cell
// wide and 8 m high in the one cell of wall between them), never a corridor; side rooms hang off a space by today's L corridors,
// each joined to one space only, so chests, keys and locked doors keep their code (dunAfterLayout). The stream is the gate's
// seed's (the co-op rule): the same seed lays the same gate on any machine. Map values, besides makeDungeon's: 8 a chasm's
// floorless cell, 9 a pier's footing (both solid to walk into). Heights in metres, places in cells.
// S1298 — a massive gate is two floors of spaces (the sheet's table: four spaces and the ring, two floors): two spaces on floor
// one, the stair hall (2 or 3 flights of 4.2 m, 3 cells a flight, a landing of 4 cells at each end and between) down to floor
// two, one space there and the ring last. A floor-two space's vault rises through the rock under floor one, so it is laid only
// where floor one is rock: no space overlaps another on either floor, and floor one's chapels, side rooms and treasure rooms
// keep off floor two's spaces and chapels. Floor two's side rooms (6 m, under floor one's floor) may lie anywhere.
const GATE_GRID={tiny:48,small:48,medium:64,large:64,massive:90};
const GATE_SPACE_N={tiny:[1,1],small:[1,1],medium:[2,3],large:[2,3],massive:[4,4]};
const GATE_SIDE_N={tiny:[3,6],small:[3,6],medium:[6,12],large:[6,12],massive:[12,18]};
const GATE_NAVE_L={tiny:[34,43],small:[34,43],medium:[43,60],large:[43,60],massive:[60,84]};
const GATE_LAYOUTS={tiny:['linear'],small:['linear'],medium:['linear','hub','loops'],large:['linear','hub','loops'],massive:['linear','labyrinth','hub','vertical','loops','cave']};
const GATE_THRESH_H=8,GATE_CHAPEL_H=12,GATE_PIT=25;
// the stair hall: 10 cells wide, a flight 3 cells long and 4.2 m down (23 risers of .18), a landing 4 cells deep; its roof a
// barrel springing at 12 m over floor one and 20 at the crown
const GATE_FLIGHT=4.2,GATE_FLIGHT_L=3,GATE_LANDING_L=4,GATE_RISERS=23;
// a space by type: its width across the way (A) and length along it (L) in cells, and its roof
function gateSpaceDims(type,size,rand,nFl){
  if(type==='nave'){const L=GATE_NAVE_L[size]||GATE_NAVE_L.small;return {A:9,L:rand(L[0],L[1]),top:rand(40,50),roof:'barrel'};}
  if(type==='crossing')return {A:13,L:13,top:45,roof:'dome'};
  if(type==='chasm')return {A:14,L:rand(20,size==='tiny'||size==='small'?30:40),top:30,roof:'barrel'};
  if(type==='flooded')return {A:10,L:27,top:30,roof:'barrel'};
  if(type==='stair')return {A:10,L:GATE_LANDING_L+nFl*(GATE_FLIGHT_L+GATE_LANDING_L),top:20,roof:'barrel'};
  return {A:20,L:20,top:rand(30,40),roof:'dome'}; // the ring chamber
}
// what a space's cell is, by its place along the way (u, 0 at the entry) and across it (v): 1 floor, 8 the chasm, 9 a pier
function gateSpaceCell(sp,u,v){
  if(sp.type==='nave'){if(v!==2&&v!==6)return 1;for(const pu of sp.pierU)if(pu===u)return 9;return 1;}
  if(sp.type==='chasm'){const L=sp.L;if(u<3||u>=L-3)return 1;const mid=sp.A/2;if(v>=mid-1&&v<mid+1)return 1;
    const seg=(u-3)%7;if(seg>=5&&u<L-5&&v>=mid-3&&v<mid+3)return 1;return 8;}
  return 1;
}
function gateRect(sp){const ax=sp.axis==='x';return {x:sp.x,y:sp.y,w:ax?sp.L:sp.A,h:ax?sp.A:sp.L};}
// a cell of the map to the space's own (u along the way from its entry end, v across), and back
function gateUV(sp,c,r){const ax=sp.axis==='x',lc=c-sp.x,lr=r-sp.y;let u=ax?lc:lr,v=ax?lr:lc;if(sp.flip)u=sp.L-1-u;return [u,v];}
function gateCellAt(sp,u,v){const ax=sp.axis==='x',l=sp.flip?sp.L-1-u:u;return ax?[sp.x+l,sp.y+v]:[sp.x+v,sp.y+l];}
// the stair hall's pieces along it: landings and flights, each [u0, u1) with its height at either end (metres, floor one 0)
function gateHallSegs(nFl){const segs=[];let u=0,y=0;segs.push({kind:'landing',u0:0,u1:GATE_LANDING_L,y0:0,y1:0});u=GATE_LANDING_L;
  for(let k=0;k<nFl;k++){segs.push({kind:'flight',u0:u,u1:u+GATE_FLIGHT_L,y0:y,y1:y-GATE_FLIGHT});u+=GATE_FLIGHT_L;y-=GATE_FLIGHT;
    segs.push({kind:'landing',u0:u,u1:u+GATE_LANDING_L,y0:y,y1:y});u+=GATE_LANDING_L;}
  return segs;}
// S1314 (Michael's A on #613) — floors 2 from the gate's own entry (WORLD_DUNGEONS: the main quest's Dungeon of Shadows and Crypt
// of Embers, and Q5's Vault of the Tide) lays a lesser gate as a massive gate's two floors, on the massive grid; its foes, traps and side rooms stay its size's
function makeGate(size,seed,floors,cond){
  cond=GATE_CONDS.includes(cond)?cond:gateCondRoll(seed); /* S1327 — the gate's own seed's, before any retry moves the seed */
  const r=dunLcg((hashSeed((seed|0)+0x6a7e)>>>0)||1),rand=(a,b)=>Math.floor(r()*(b-a+1))+a,pick=a=>a[Math.floor(r()*a.length)];
  const base={tiny:{tr:0,ur:1,en:5},small:{tr:1,ur:2,en:9},medium:{tr:1,ur:3,en:14},large:{tr:2,ur:4,en:20},massive:{tr:2,ur:6,en:30}}[size]?size:'small';
  const fl2=base==='massive'||floors===2&&base!=='tiny'&&base!=='small';
  const N=GATE_GRID[fl2?'massive':base],W=N,H=N;
  const cfg=Object.assign({W,H,minR:24,maxR:36,rwMin:3,rwMax:12,rhMin:3,rhMax:12,floors:fl2?2:1},
    {tiny:{tr:0,ur:1,en:5},small:{tr:1,ur:2,en:9},medium:{tr:1,ur:3,en:14},large:{tr:2,ur:4,en:20},massive:{tr:2,ur:6,en:30}}[base]);
  const layout=pick(GATE_LAYOUTS[base]);
  const nSp=rand(GATE_SPACE_N[base][0],GATE_SPACE_N[base][1]);
  const two=cfg.floors>1,nFl=two?(layout==='vertical'?3:rand(2,3)):0,D2=Math.round(nFl*GATE_FLIGHT*100)/100;
  // the types along the way: a nave first (the long approach); a hub's second space its crossing; the ring last
  const types=[],floorOf=[];
  if(two){ // S1298 — floor one's two spaces, the stair hall, floor two's space (a chasm only there: nothing lies under it), the ring
    types.push(r()<.75?'nave':'flooded',layout==='hub'?'crossing':pick(['nave','nave','flooded','crossing']),'stair',pick(['nave','flooded','crossing','chasm']));
    floorOf.push(1,1,1,2);}
  else for(let i=0;i<nSp;i++){floorOf.push(1);
    if(i===0){types.push(r()<(nSp===1?.6:.75)?'nave':pick(base==='massive'?['flooded']:['chasm','flooded']));continue;}
    if(layout==='hub'&&i===1){types.push('crossing');continue;}
    const bag=['nave','nave','flooded','crossing'];if(base!=='massive')bag.push('chasm');types.push(pick(bag));}
  types.push('ring');floorOf.push(two?2:1);
  const SIDES=[[1,0],[-1,0],[0,1],[0,-1]];
  const fits=(R)=>R.x>=1&&R.y>=1&&R.x+R.w<=W-1&&R.y+R.h<=H-1;
  const hit=(R,Q)=>R.x-1<Q.x+Q.w&&R.x+R.w+1>Q.x&&R.y-1<Q.y+Q.h&&R.y+R.h+1>Q.y;
  let wayIn=null; // the way in's corridor, kept clear of every other space
  const clash=(R,spaces)=>spaces.some(o=>hit(R,gateRect(o)))||(wayIn&&hit(R,wayIn));
  const cellOf=(sp,c,r2)=>{const R=gateRect(sp);if(c<R.x||r2<R.y||c>=R.x+R.w||r2>=R.y+R.h)return 0;const [u,v]=gateUV(sp,c,r2);return gateSpaceCell(sp,u,v);};
  const mkSpace=(type,id)=>{const d=gateSpaceDims(type,base,rand,nFl);const sp={id,type,A:d.A,L:d.L,top:d.top,roof:d.roof,pierU:[],links:[],depth:0,floor:floorOf[id]};
    if(type==='nave'){for(let u=3;u<=d.L-4;u+=14/3)sp.pierU.push(Math.round(u));}return sp;};
  let spaces=null,thresholds=null,entry=null;
  for(let tries=0;tries<40&&!spaces;tries++){
    const S=[],T=[];
    // the first space, its entry end facing a side of the grid a few cells off, the way in a straight corridor from that side
    const sp0=mkSpace(types[0],0);const side=pick(SIDES),gap=rand(3,6);
    sp0.axis=side[0]?'x':'z';sp0.flip=(side[0]>0||side[1]>0);
    const R0w=sp0.axis==='x'?sp0.L:sp0.A,R0h=sp0.axis==='x'?sp0.A:sp0.L;
    if(sp0.axis==='x'){sp0.x=side[0]<0?1+gap:W-1-gap-R0w;sp0.y=rand(1,H-1-R0h);}else{sp0.y=side[1]<0?1+gap:H-1-gap-R0h;sp0.x=rand(1,W-1-R0w);}
    if(!fits(gateRect(sp0)))continue;S.push(sp0);
    const mid=Math.floor(sp0.A/2);const e={side,c:0,r:0};
    if(sp0.axis==='x'){e.r=sp0.y+mid;e.c=side[0]<0?0:W-1;}else{e.c=sp0.x+mid;e.r=side[1]<0?0:H-1;}
    {const R=gateRect(sp0);wayIn=sp0.axis==='x'?(side[0]<0?{x:0,y:e.r,w:R.x,h:1}:{x:R.x+R.w,y:e.r,w:W-R.x-R.w,h:1}):(side[1]<0?{x:e.c,y:0,w:1,h:R.y}:{x:e.c,y:R.y+R.h,w:1,h:H-R.y-R.h});}
    // the rest, each joined to its parent through a threshold
    let ok=true;
    for(let i=1;i<types.length&&ok;i++){
      const ring=i===types.length-1;let parent;
      if(ring){parent=layout==='hub'&&S.length>2?S[S.length-1]:S.reduce((a,b)=>b.depth>=a.depth?b:a,S[0]);}
      else if(two&&types[i-1]==='stair')parent=S[i-1]; // floor two's first space hangs off the stair hall's foot
      else if(layout==='hub'&&i>=2)parent=S[1];
      else if(layout==='labyrinth'||layout==='cave')parent=pick(S);
      else parent=S[i-1];
      let placed=false;
      for(let att=0;att<160&&!placed;att++){
        const sp=mkSpace(types[i],i);const sd=pick(SIDES);const P=gateRect(parent);
        sp.axis=sd[0]?'x':'z';sp.flip=(sd[0]<0||sd[1]<0);
        const w=sp.axis==='x'?sp.L:sp.A,h=sp.axis==='x'?sp.A:sp.L;
        // the threshold's cell on the shared wall, and the child's rect round it
        let tc,tr;
        if(sd[0]){tc=sd[0]>0?P.x+P.w:P.x-1;tr=rand(P.y,P.y+P.h-1);sp.x=sd[0]>0?tc+1:tc-w;sp.y=tr-Math.floor(h/2)+rand(-2,2);sp.y=Math.max(tr-h+1,Math.min(tr,sp.y));}
        else{tr=sd[1]>0?P.y+P.h:P.y-1;tc=rand(P.x,P.x+P.w-1);sp.y=sd[1]>0?tr+1:tr-h;sp.x=tc-Math.floor(w/2)+rand(-2,2);sp.x=Math.max(tc-w+1,Math.min(tc,sp.x));}
        const R=gateRect(sp);if(!fits(R)||clash(R,S))continue;
        // both sides of the threshold stand on floor; the threshold is not where the way in arrives
        if(cellOf(parent,tc-sd[0],tr-sd[1])!==1||cellOf(sp,tc+sd[0],tr+sd[1])!==1)continue;
        // S1298 — the stair hall is left from its foot only (its bottom landing); it is entered at its head (u 0, by placement)
        if(parent.type==='stair'&&gateUV(parent,tc-sd[0],tr-sd[1])[0]<parent.L-GATE_LANDING_L)continue;
        if(T.some(t=>Math.abs(t.c-tc)+Math.abs(t.r-tr)<3))continue;
        sp.depth=parent.depth+1;sp.parent=parent.id;S.push(sp);T.push({c:tc,r:tr,a:parent.id,b:sp.id,dc:sd[0],dr:sd[1],floor:Math.max(sp.floor,parent.type==='stair'?2:parent.floor)});
        parent.links.push(sp.id);sp.links.push(parent.id);placed=true;}
      if(!placed)ok=false;
    }
    if(!ok)continue;
    spaces=S;thresholds=T;entry=e;
  }
  if(!spaces)return makeGate(size,seed+1000003,floors,cond); // no layout in forty tries: the next seed's
  const ringSp=spaces[spaces.length-1],hallSp=two?spaces.find(s=>s.type==='stair'):null;
  // shortcuts (a ring of loops, a cave network): two spaces of one floor that happen to share a wall a cell thick get a second threshold
  if(layout==='loops'||layout==='cave'){let n=0;
    for(const A of spaces)for(const B of spaces){if(n>=2||A.id>=B.id||A===ringSp||B===ringSp||A.links.includes(B.id))continue;
      if(A.floor!==B.floor||A===hallSp||B===hallSp)continue;
      const P=gateRect(A),Q=gateRect(B);let tc=null,tr=null,dc=0,dr=0;
      if(Q.x===P.x+P.w+1||P.x===Q.x+Q.w+1){const lo=Math.max(P.y,Q.y),hi=Math.min(P.y+P.h,Q.y+Q.h)-1;if(hi>=lo){tr=Math.floor((lo+hi)/2);tc=Q.x===P.x+P.w+1?P.x+P.w:P.x-1;dc=Q.x>P.x?1:-1;}}
      else if(Q.y===P.y+P.h+1||P.y===Q.y+Q.h+1){const lo=Math.max(P.x,Q.x),hi=Math.min(P.x+P.w,Q.x+Q.w)-1;if(hi>=lo){tc=Math.floor((lo+hi)/2);tr=Q.y===P.y+P.h+1?P.y+P.h:P.y-1;dr=Q.y>P.y?1:-1;}}
      if(tc==null||cellOf(A,tc-dc,tr-dr)!==1||cellOf(B,tc+dc,tr+dr)!==1)continue;
      thresholds.push({c:tc,r:tr,a:A.id,b:B.id,dc,dr,shortcut:true,floor:A.floor});A.links.push(B.id);B.links.push(A.id);n++;}}
  // paint the spaces, the thresholds and the way in; the stair hall is open (3) on both floors
  const grid=()=>Array.from({length:H},()=>new Array(W).fill(0)),sgrid=()=>Array.from({length:H},()=>new Int16Array(W).fill(-1));
  const map=grid(),cellSpace=sgrid(),map2=two?grid():null,cellSpace2=two?sgrid():null;
  for(const sp of spaces){const R=gateRect(sp);for(let y=R.y;y<R.y+R.h;y++)for(let x=R.x;x<R.x+R.w;x++){
    if(sp===hallSp){map[y][x]=3;map2[y][x]=3;cellSpace[y][x]=sp.id;cellSpace2[y][x]=sp.id;continue;}
    const M=sp.floor===2?map2:map,CS=sp.floor===2?cellSpace2:cellSpace;M[y][x]=cellOf(sp,x,y);CS[y][x]=sp.id;}}
  const thrSet=new Set(),thrSet2=new Set();for(const t of thresholds){if(t.floor===2){map2[t.r][t.c]=1;thrSet2.add(t.r*W+t.c);}else{map[t.r][t.c]=1;thrSet.add(t.r*W+t.c);}}
  {const s0=spaces[0],R=gateRect(s0);const [dc,dr]=entry.side;let c=entry.c,y=entry.r;
    while(!(c>=R.x&&c<R.x+R.w&&y>=R.y&&y<R.y+R.h)){map[y][c]=1;c-=dc;y-=dr;}map[entry.r][entry.c]=2;}
  // a nave's side chapels: 3 along its wall and 4 deep, open to the aisle, 2 to 4 of them where the wall is free. Floor two's
  // first (S1298): a chapel's 12 m roof there rises above floor one's floor, so it keeps under floor one's rock too.
  const RES=99; // S1298 — floor one's rock held over floor two's spaces and chapels while floor one's rooms are laid
  const layChapels=(M,CS,fl,list,under)=>{for(const sp of spaces){if(sp.type!=='nave'||sp.floor!==fl)continue;const want=rand(2,4);let got=0;const R=gateRect(sp);
    for(let att=0;att<40&&got<want;att++){const u0=rand(4,sp.L-8),sideV=r()<.5?-1:1;
      let x0,y0,w,h;
      if(sp.axis==='x'){const cx=sp.flip?R.x+sp.L-1-(u0+2):R.x+u0;x0=cx;w=3;h=4;y0=sideV<0?R.y-4:R.y+R.h;}
      else{const cy=sp.flip?R.y+sp.L-1-(u0+2):R.y+u0;y0=cy;h=3;w=4;x0=sideV<0?R.x-4:R.x+R.w;}
      if(x0<1||y0<1||x0+w>W-1||y0+h>H-1)continue;
      let free=true;for(let y=y0-1;y<=y0+h&&free;y++)for(let x=x0-1;x<=x0+w&&free;x++){if(y<0||x<0||y>=H||x>=W)continue;const inR=x>=R.x&&x<R.x+R.w&&y>=R.y&&y<R.y+R.h;if(!inR&&(M[y][x]!==0||under&&under[y][x]!==0))free=false;}
      if(!free)continue;
      // the chapel's mouth must open on floor (never a pier) and keep 2 cells off a threshold
      let mouthOk=true;for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){for(const [dc,dr] of SIDES){const nx=x+dc,ny=y+dr;if(nx>=R.x&&nx<R.x+R.w&&ny>=R.y&&ny<R.y+R.h&&M[ny][nx]!==1)mouthOk=false;}
        for(const t of thresholds)if(Math.abs(t.c-x)+Math.abs(t.r-y)<3)mouthOk=false;}
      if(!mouthOk)continue;
      for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){M[y][x]=1;CS[y][x]=sp.id;}
      list.push({x:x0,y:y0,w,h,space:sp.id,floor:fl});got++;}}};
  const chapels=[],chapels2=[];
  if(two){layChapels(map2,cellSpace2,2,chapels2,map);
    const hold=(x0,y0,w,h)=>{for(let y=Math.max(0,y0-1);y<Math.min(H,y0+h+1);y++)for(let x=Math.max(0,x0-1);x<Math.min(W,x0+w+1);x++)if(map[y][x]===0)map[y][x]=RES;};
    for(const sp of spaces)if(sp.floor===2){const R=gateRect(sp);hold(R.x,R.y,R.w,R.h);}
    for(const q of chapels2)hold(q.x,q.y,q.w,q.h);}
  layChapels(map,cellSpace,1,chapels,null);
  const chapelAt=(c,y)=>chapels.some(q=>c>=q.x&&c<q.x+q.w&&y>=q.y&&y<q.y+q.h),chapelAt2=(c,y)=>chapels2.some(q=>c>=q.x&&c<q.x+q.w&&y>=q.y&&y<q.y+q.h);
  // side rooms, each joined to the nearest space of its floor by an L corridor that touches nothing else on its way
  const laySide=(M,CS,fl,isChapel,n,list)=>{for(let att=0;att<600&&list.length<n;att++){
    const rw=rand(3,base==='tiny'||base==='small'?8:12),rh=rand(3,base==='tiny'||base==='small'?8:12);
    const rx=rand(2,W-rw-3),ry=rand(2,H-rh-3);
    let free=true;for(let y=ry-2;y<ry+rh+2&&free;y++)for(let x=rx-2;x<rx+rw+2&&free;x++)if(M[y][x]!==0)free=false;
    if(!free)continue;
    const rm={x:rx,y:ry,w:rw,h:rh,cx:Math.floor(rx+rw/2),cy:Math.floor(ry+rh/2),side:true};
    const inRoom=(x,y)=>x>=rx&&x<rx+rw&&y>=ry&&y<ry+rh;
    // the target: a floor cell on a space's edge, nearest first (never a pier, a chasm, a chapel or the stair hall)
    const targets=[];for(const sp of spaces){if(sp.floor!==fl||sp===hallSp)continue;const R=gateRect(sp);
      for(let y=R.y;y<R.y+R.h;y++)for(let x=R.x;x<R.x+R.w;x++){if(x!==R.x&&x!==R.x+R.w-1&&y!==R.y&&y!==R.y+R.h-1)continue;if(M[y][x]!==1)continue;
        targets.push({x,y,sp:sp.id,d:Math.abs(x-rm.cx)+Math.abs(y-rm.cy)});}}
    targets.sort((a,b)=>a.d-b.d);
    let carved=null;
    for(const tg of targets.slice(0,6)){if(carved)break;
      for(const hFirst of [true,false]){
        const path=[];let x=rm.cx,y=rm.cy;const step=(tx,ty)=>{while(x!==tx||y!==ty){if(x!==tx)x+=Math.sign(tx-x);else y+=Math.sign(ty-y);path.push([x,y]);}};
        if(hFirst){step(tg.x,rm.cy);step(tg.x,tg.y);}else{step(rm.cx,tg.y);step(tg.x,tg.y);}
        // walk it: out of the room, through rock only, and into the target space at the end, touching nothing else
        const cells=[];let good=true,arrived=false;
        for(let k=0;k<path.length&&good&&!arrived;k++){const [px2,py2]=path[k];if(inRoom(px2,py2))continue;
          const v=M[py2][px2];
          if(CS[py2][px2]===tg.sp){if(v!==1||isChapel(px2,py2))good=false;arrived=true;break;}
          if(v!==0){good=false;break;}
          const nxt=path[k+1];
          for(const [dc,dr] of SIDES){const nx=px2+dc,ny=py2+dr;if(nx<0||ny<0||nx>=W||ny>=H)continue;if(inRoom(nx,ny)||M[ny][nx]===0)continue;
            if(cells.some(q=>q[0]===nx&&q[1]===ny))continue;
            if(nxt&&nxt[0]===nx&&nxt[1]===ny&&CS[ny][nx]===tg.sp)continue;
            good=false;}
          cells.push([px2,py2]);}
        if(good&&arrived&&cells.length){carved=cells;break;}}}
    if(!carved)continue;
    for(let y=ry;y<ry+rh;y++)for(let x=rx;x<rx+rw;x++)M[y][x]=1;
    for(const [x,y] of carved)M[y][x]=1;
    rm.space=-1;rm.floor=fl;list.push(rm);}};
  const nSide=rand(GATE_SIDE_N[base][0],GATE_SIDE_N[base][1]),n1=two?Math.ceil(nSide/2):nSide;
  const side=[],side2=[];laySide(map,cellSpace,1,chapelAt,n1,side);
  // the rooms every system reads: the spaces' rects (kind 'space') first, then the side rooms (the stair hall is neither)
  const asRoom=sp=>{const R=gateRect(sp);return {x:R.x,y:R.y,w:R.w,h:R.h,cx:Math.floor(R.x+R.w/2),cy:Math.floor(R.y+R.h/2),kind:'space',space:sp.id,type:sp.type};};
  const rooms=spaces.filter(sp=>sp.floor===1&&sp!==hallSp).map(asRoom).concat(side);
  const gen=dunAfterLayout(map,rooms,side.slice(),two?Object.assign({},cfg,{floors:1}):cfg,r,rand,seed,entry.c,entry.r,(x,y)=>thrSet.has(y*W+x));
  if(two){for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(map[y][x]===RES)map[y][x]=0;
    laySide(map2,cellSpace2,2,chapelAt2,nSide-n1,side2);
    gen.cfg=cfg;gen.map2=map2;gen.rooms2=spaces.filter(sp=>sp.floor===2).map(asRoom).concat(side2);}
  // the roof by cell, in metres over the floor: a space's barrel or dome, a chapel's 12, a threshold's 8, the rest the dungeon's 6
  const roof=sp=>{const R=gateRect(sp),cx=R.x-.5+R.w/2,cz=R.y-.5+R.h/2,hw=R.w/2,hh=R.h/2,acrossM=sp.A*GATE_CELL;
    if(sp.roof==='dome'){const rise=Math.min(sp.top-12,Math.min(hw,hh)*GATE_CELL),spring=sp.top-rise;
      return (X,Z)=>{const q=Math.min(1,((X-cx)/hw)**2+((Z-cz)/hh)**2);return spring+rise*Math.sqrt(1-q);};}
    const rise=Math.min(acrossM/2,sp.top-12),spring=sp.top-rise;
    return sp.axis==='x'?(X,Z)=>{const t=Math.min(1,((Z-cz)/hh)**2);return spring+rise*Math.sqrt(1-t);}:(X,Z)=>{const t=Math.min(1,((X-cx)/hw)**2);return spring+rise*Math.sqrt(1-t);};};
  const roofs=spaces.map(roof);
  gen.ceilAt=(c,y,X,Z,def)=>{if(y<0||c<0||y>=H||c>=W)return def;if(thrSet.has(y*W+c))return GATE_THRESH_H;const s=cellSpace[y][c];
    if(s<0)return def;if(chapelAt(c,y))return GATE_CHAPEL_H;return roofs[s](X,Z);};
  // floor two's, over its own floor: the stair hall's roof is floor one's height and the hall's depth (S1298)
  if(two)gen.ceilAt2=(c,y,X,Z,def)=>{if(y<0||c<0||y>=H||c>=W)return def;if(thrSet2.has(y*W+c))return GATE_THRESH_H;const s=cellSpace2[y][c];
    if(s<0)return def;if(chapelAt2(c,y))return GATE_CHAPEL_H;return roofs[s](X,Z)+(spaces[s]===hallSp?D2:0);};
  gen.spaces=spaces.map(sp=>Object.assign({},sp,gateRect(sp)));gen.thresholds=thresholds;gen.chapels=chapels.concat(chapels2);gen.cellSpace=cellSpace;
  gen.layout=layout;gen.ring=ringSp.id;gen.side=side.concat(side2);gen.gate=true;
  if(two){gen.cellSpace2=cellSpace2;
    // the stair hall: its pieces, its head (the markers' 'Descend', gen.stairC/R) and the hole it leaves in floor one's floor
    const hs=gen.spaces[hallSp.id];hs.flights=nFl;hs.D=D2;hs.segs=gateHallSegs(nFl);gen.hall=hs;
    [gen.stairC,gen.stairR]=gateCellAt(hs,1,Math.floor(hs.A/2));
    const a=gateCellAt(hs,GATE_LANDING_L,0),b=gateCellAt(hs,hs.L-1,hs.A-1);
    gen.stairHoles=[{x0:Math.min(a[0],b[0])-.5,x1:Math.max(a[0],b[0])+.5,z0:Math.min(a[1],b[1])-.5,z1:Math.max(a[1],b[1])+.5}];
    gen.hallAt=(c,y)=>y>=0&&c>=0&&y<H&&c<W&&cellSpace[y][c]===hallSp.id;}
  gateCondition(gen,gen.spaces,seed,cond); /* S1327 — the gone spans, the floating stones and the nave's gaps, before the bridge's deck is read */
  // a chasm's bridge and its piers' landings: floor over the pit (a deck, not rock to the bottom), on its own floor
  const slabSet=new Set(),slabSet2=new Set();for(const sp of spaces){if(sp.type!=='chasm')continue;const R=gateRect(sp),M=sp.floor===2?map2:map,SS=sp.floor===2?slabSet2:slabSet;
    for(let y=R.y;y<R.y+R.h;y++)for(let x=R.x;x<R.x+R.w;x++){const [u]=gateUV(sp,x,y);if(u>=3&&u<sp.L-3&&M[y][x]===1)SS.add(y*W+x);}}
  gen.slab=(c,y)=>slabSet.has(y*W+c);gen.slab2=(c,y)=>slabSet2.has(y*W+c);
  // the flooded halls' islands: 2 or 3 slabs 0.4 high (a step up), 3 to 5 cells, along the way
  for(const sp of gen.spaces){if(sp.type!=='flooded')continue;sp.islands=[];const n=rand(2,3);
    for(let k=0;k<n;k++){const u0=Math.floor((k+1)*sp.L/(n+1))-2,v0=rand(1,sp.A-5),lu=rand(3,5),lv=rand(3,4);
      const ax=sp.axis==='x',x0=ax?(sp.flip?sp.x+sp.L-u0-lu:sp.x+u0):sp.x+v0,y0=ax?sp.y+v0:(sp.flip?sp.y+sp.L-u0-lu:sp.y+u0);
      sp.islands.push({x:x0,y:y0,w:ax?lu:lv,h:ax?lv:lu});}}
  // the ring chamber's dais, 10 m square in its middle, 0.4 high
  {const sp=gen.spaces[gen.ring];const d=10/GATE_CELL;sp.dais={x0:sp.x-.5+sp.w/2-d/2,x1:sp.x-.5+sp.w/2+d/2,z0:sp.y-.5+sp.h/2-d/2,z1:sp.y-.5+sp.h/2+d/2};}
  return gen;
}

// S1327 (card F5, the build sheet's session 4, "Condition"; Michael's A on its open number, 20 Oct 2026: 50 / 35 / 15) — a gate is
// steady, failing or catastrophic, rolled from its seed and never saved (an authored gate may name its own: WORLD_DUNGEONS' cond).
// Steady: every span and floor in place. Failing: one span in three of each chasm's bridge is gone, and a nave's floor has gaps of
// 1 to 2 cells that the way goes round. Catastrophic: every span gone, and twice the nave's gaps. A gone span is crossed by the
// floating stones (#417 A): they hang still at the deck's height, 2 m across, never more than 1.6 m apart, so nothing on the way
// needs a skill (the sheet's 2.5 m). Its own stream from the seed, after the layout's, so no draw of the layout moves.
const GATE_CONDS=['steady','failing','catastrophic'],GATE_COND_P=[.5,.35,.15],GATE_STONE=2,GATE_STONE_GAP=1.6;
function gateCondRoll(seed){const u=hashSeed(((seed|0)^0x5c0d17)>>>0)/4294967296;return u<GATE_COND_P[0]?'steady':u<GATE_COND_P[0]+GATE_COND_P[1]?'failing':'catastrophic';}
function gateCondition(gen,spaces,seed,cond){
  gen.cond=cond;gen.stones=[];gen.gaps=[];if(cond==='steady')return;
  const r=dunLcg((hashSeed(((seed|0)+0x60e)>>>0)>>>0)||1),rand=(a,b)=>Math.floor(r()*(b-a+1))+a;
  const W=gen.W,H=gen.H,thr=gen.thresholds||[];
  // the nave's gaps: a pit of 1 or 2 cells by 1 or 2, off the piers and 3 cells from a threshold, 4 from another gap, and
  // only where everything you could reach before stays reachable (the way round)
  const parts=M=>{const seen=new Uint8Array(W*H);let n=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=M[y][x];if(v===0||v===8||v===9||seen[y*W+x])continue;n++;
    const q=[y*W+x];seen[q[0]]=1;while(q.length){const i=q.pop(),cx=i%W,cy=(i/W)|0;for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dc,ny=cy+dr;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx,w=M[ny][nx];if(seen[j]||w===0||w===8||w===9)continue;seen[j]=1;q.push(j);}}}return n;};
  // (not on floor one of a gate of two floors: a pit there would fall into floor two's rock, and the stair hall reads you by height)
  for(const sp of spaces){if(sp.type!=='nave')continue;const fl=sp.floor||1,M=fl===2?gen.map2:gen.map;if(!M||fl===1&&gen.map2)continue;
    const want=Math.max(1,Math.round(sp.L*GATE_CELL/60))*(cond==='catastrophic'?2:1);let got=0;
    for(let att=0;att<60&&got<want;att++){const lu=rand(1,2),lv=rand(1,2),u0=rand(4,sp.L-5-lu),v0=rand(0,sp.A-lv);
      const cells=[];let ok=true;
      for(let du=0;du<lu&&ok;du++)for(let dv=0;dv<lv&&ok;dv++){const [c,y]=gateCellAt(sp,u0+du,v0+dv);
        if(M[y][c]!==1||thr.some(t=>Math.abs(t.c-c)+Math.abs(t.r-y)<3))ok=false;
        if(ok&&gen.gaps.some(g=>g.cells.some(([gc,gy])=>Math.abs(gc-c)+Math.abs(gy-y)<4)))ok=false;
        cells.push([c,y]);}
      if(!ok)continue;
      const before=parts(M);for(const [c,y] of cells)M[y][c]=8;
      if(parts(M)!==before){for(const [c,y] of cells)M[y][c]=1;continue;}
      gen.gaps.push({space:sp.id,floor:fl,cells});got++;}}
  // the chasms' spans: the runs of bridge between the piers' landings
  for(const sp of spaces){if(sp.type!=='chasm')continue;const fl=sp.floor||1,M=fl===2?gen.map2:gen.map;if(!M)continue;
    const mid=sp.A/2,spans=[];let u0=null;
    for(let u=3;u<=sp.L-3;u++){const deck=u<sp.L-3&&gateSpaceCell(sp,u,mid-3)!==1;
      if(deck&&u0==null)u0=u;if(!deck&&u0!=null){spans.push([u0,u-1]);u0=null;}}
    let gone;if(cond==='catastrophic')gone=spans.map((_,i)=>i);
    else{const n=Math.max(1,Math.round(spans.length/3)),idx=spans.map((_,i)=>i);for(let i=idx.length-1;i>0;i--){const j=rand(0,i);[idx[i],idx[j]]=[idx[j],idx[i]];}gone=idx.slice(0,n);}
    for(const i of gone.sort((a,b)=>a-b)){const [ua,ub]=spans[i];
      for(let u=ua;u<=ub;u++)for(let v=mid-1;v<mid+1;v++){const [c,y]=gateCellAt(sp,u,v);M[y][c]=8;}
      // the stones over it, along the bridge's line: n of GATE_STONE, the gaps between them (and at either end) equal
      const Lm=(ub-ua+1)*GATE_CELL,n=Math.ceil((Lm-GATE_STONE_GAP)/(GATE_STONE+GATE_STONE_GAP)),gap=(Lm-n*GATE_STONE)/(n+1),s=GATE_STONE/GATE_CELL;
      for(let k=0;k<n;k++){const uc=ua-.5+(gap*(k+1)+GATE_STONE*(k+.5))/GATE_CELL,vc=mid-.5+(k%2?1:-1)*rand(1,3)*.08;
        const ax=sp.axis==='x',l=sp.flip?sp.L-1-uc:uc,cx=ax?sp.x+l:sp.x+vc,cz=ax?sp.y+vc:sp.y+l,hw=ax?s/2:s*.55,hh=ax?s*.55:s/2;
        gen.stones.push({id:`${seed|0}:${fl}:stone${gen.stones.length}`,floor:fl,space:sp.id,span:i,x0:cx-hw,x1:cx+hw,z0:cz-hh,z1:cz+hh,y:(rand(0,8)-3)*.05,gap:+gap.toFixed(2)});}}
    sp.gone=gone;}
}
// S1323 (card F5, the build sheet's session 3, "Pockets and the leash") — where a gate's fights stand. Each space of a floor
// (the stair hall aside) holds pockets along its way, evenly: 25 to 42 m apart (one alone in a short space), so two
// pockets never wake as one, and each end is within 25 m of one, so no stretch of the way runs 50 m without a fight. A pocket's radius is 0.4 of its spacing,
// 7.5 to 15 m and no wider than the space. Places in cells (the dungeon's own, scaled whole later), radius in cells too; the way's
// order is the spaces' (their ids). Nothing here is rolled: the layout decides it.
const GATE_POCKET_GAP=[25,42],GATE_POCKET_R=[7.5,15],GATE_LEASH=10,GATE_ARCHER_SIGHT=20;
function gatePocketSites(gen,fl){
  const M=fl===2?gen.map2:gen.map,CS=fl===2?gen.cellSpace2:gen.cellSpace,out=[];if(!M||!CS)return out;
  const H=M.length,W=M[0].length,thr=new Set((gen.thresholds||[]).map(t=>t.r*W+t.c));
  for(const sp of gen.spaces){if(sp.type==='stair'||(sp.floor||1)!==fl)continue;
    const Lm=sp.L*GATE_CELL,nMin=Math.ceil(Lm/GATE_POCKET_GAP[1]),nMax=Math.floor(Lm/GATE_POCKET_GAP[0]);
    const n=Math.max(1,nMin<=nMax?Math.min(nMax,Math.max(nMin,Math.round(Lm/33))):nMax);
    const rad=Math.max(GATE_POCKET_R[0],Math.min(GATE_POCKET_R[1],.4*Lm/n,sp.A*GATE_CELL/2))/GATE_CELL;
    for(let k=0;k<n;k++){const u=(k+.5)*sp.L/n,[c0,r0]=gateCellAt(sp,Math.min(sp.L-1,Math.floor(u)),Math.floor(sp.A/2));
      let best=null,bd=1e9;
      for(let y=r0-4;y<=r0+4;y++)for(let x=c0-4;x<=c0+4;x++){if(y<0||x<0||y>=H||x>=W||M[y][x]!==1||CS[y][x]!==sp.id||thr.has(y*W+x))continue;
        const d=Math.hypot(x-c0,y-r0);if(d<bd){bd=d;best=[x,y];}}
      if(best)out.push({id:out.length,c:best[0],r:best[1],rad,sp:sp.id,u});}}
  return out;
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

// S599 — DECISION #177 A (Michael, 6 Oct: three new shapes, stairs down only), the first: THE HALL AND THE UNDERCROFT.
// A pillared great hall (treasure floor, so the fort pass gives it its colonnades and chandeliers) at the end of a short
// entry passage, with a straight flight three cells wide down its middle to the undercroft; a kitchen and stores off its
// west wall, the armoury and a chapel off its east. Below: the flight lands in a walled slot that opens north into the
// undercroft, a long low room under the hall's north end, with a vault either side and a crypt beyond, joined by arches.
// The flight is tile 3 on both floors (the hole in the hall's floor and the slot below); gen.flight carries its cells,
// gen.stairHoles the rectangles the upper floor's foothold leaves open (S601: gen.flights, several), gen.stairC/R its top cell (the markers' 'Ascend').
function makeFortHall(size, seed){
  function rng(s){let v=s;return()=>{v=(v*1664525+1013904223)>>>0;return v/4294967296;};}
  const r=rng(hashSeed(seed*7+177));
  const cfg = {
    tiny:    {W:40, H:40, en:8,  tr:1, ur:1, floors:2},
    small:   {W:48, H:48, en:11, tr:1, ur:2, floors:2},
    medium:  {W:60, H:60, en:14, tr:2, ur:3, floors:2},
    large:   {W:72, H:72, en:20, tr:2, ur:4, floors:2},
    massive: {W:88, H:88, en:27, tr:3, ur:5, floors:2},
  }[size] || {W:60, H:60, en:14, tr:2, ur:3, floors:2};
  const {W, H} = cfg;
  const map = Array.from({length:H}, () => new Array(W).fill(0)), map2 = Array.from({length:H}, () => new Array(W).fill(0));
  const rooms = [], rooms2 = [], treasureDoors = [];
  const cx = Math.floor(W/2), big = W >= 56;
  const HW = big ? 19 : 15, HD = big ? 24 : 20, FL = 8, SIDE = big ? 8 : 6;
  const hx0 = cx - (HW - 1)/2, hz0 = H - HD - (big ? 12 : 9), hz1 = hz0 + HD - 1;
  const fill = (m, x0, z0, w, h, t) => { for(let z = z0; z < z0 + h; z++) for(let x = x0; x < x0 + w; x++) if(z > 0 && z < H - 1 && x > 0 && x < W - 1) m[z][x] = t; };
  const room = (list, x0, z0, w, h, kind) => list.push({x:x0, y:z0, w, h, cx:Math.floor(x0 + w/2), cy:Math.floor(z0 + h/2), kind});
  // the hall
  fill(map, hx0, hz0, HW, HD, 6); room(rooms, hx0, hz0, HW, HD, 'pillared_hall');
  // the entry passage, five cells wide, from the hall's door to the entrance at the south edge
  for(let z = hz1 + 2; z <= H - 1; z++) for(let x = cx - 2; x <= cx + 2; x++) map[z][x] = 7;
  map[hz1 + 1][cx] = 4; treasureDoors.push({x:cx, z:hz1 + 1, isEW:false, locked:false});
  const entC = cx, entR = H - 1; map[entR][entC] = 2;
  // the side rooms, two a side, each on a door in the hall's wall; the seed says which of each pair is nearer the door
  const west = r() < .5 ? ['kitchen', 'storeroom'] : ['storeroom', 'kitchen'], east = r() < .5 ? ['armory', 'chapel'] : ['chapel', 'armory'];
  const rowZ = [hz0 + 2, hz0 + HD - SIDE - 2];
  for(let i = 0; i < 2; i++){
    const z0 = rowZ[i], dz = z0 + Math.floor(SIDE/2);
    const wx0 = hx0 - 1 - SIDE; if(wx0 >= 1){ fill(map, wx0, z0, SIDE, SIDE, 1); room(rooms, wx0, z0, SIDE, SIDE, west[1 - i]); map[dz][hx0 - 1] = 4; treasureDoors.push({x:hx0 - 1, z:dz, isEW:true, locked:false}); }
    const ex0 = hx0 + HW + 1; if(ex0 + SIDE <= W - 1){ fill(map, ex0, z0, SIDE, SIDE, 1); room(rooms, ex0, z0, SIDE, SIDE, east[1 - i]); map[dz][hx0 + HW] = 4; treasureDoors.push({x:hx0 + HW, z:dz, isEW:true, locked:false}); }
  }
  // the flight: three cells wide, FL long, its top at the south (the hall's door end), going down northward
  const ft = hz1 - 6, fb = ft - FL + 1;
  for(let z = fb; z <= ft; z++) for(let x = cx - 1; x <= cx + 1; x++){ map[z][x] = 3; map2[z][x] = 3; }
  // below: the undercroft north of the slot, a vault either side, the crypt beyond; arches one cell wide between them
  const UW = big ? 15 : 11, UD = big ? 9 : 7, ux0 = cx - (UW - 1)/2, uz1 = fb - 1, uz0 = uz1 - UD + 1;
  fill(map2, ux0, uz0, UW, UD, 1); room(rooms2, ux0, uz0, UW, UD, 'undercroft');
  const VW = big ? 7 : 5, vz0 = uz0 + 1, VD = UD - 2;
  if(ux0 - 1 - VW >= 1){ fill(map2, ux0 - 1 - VW, vz0, VW, VD, 1); room(rooms2, ux0 - 1 - VW, vz0, VW, VD, 'vault'); map2[vz0 + (VD >> 1)][ux0 - 1] = 1; }
  if(ux0 + UW + 1 + VW <= W - 1){ fill(map2, ux0 + UW + 1, vz0, VW, VD, 1); room(rooms2, ux0 + UW + 1, vz0, VW, VD, 'vault'); map2[vz0 + (VD >> 1)][ux0 + UW] = 1; }
  const CW = big ? 9 : 7, CD = big ? 7 : 5, cz1 = uz0 - 2, cz0 = cz1 - CD + 1;
  if(cz0 >= 1){ fill(map2, cx - (CW - 1)/2, cz0, CW, CD, 1); room(rooms2, cx - (CW - 1)/2, cz0, CW, CD, 'crypt'); map2[uz0 - 1][cx] = 1; }
  // keys: the farthest room floor from the way in, as the other forts do (no locked doors here, so one is enough)
  const floorCells = [];
  for(let z = 0; z < H; z++) for(let x = 0; x < W; x++) if(map[z][x] === 1) floorCells.push({x, y:z});
  floorCells.sort((a, b) => Math.hypot(b.x - entC, b.y - entR) - Math.hypot(a.x - entC, a.y - entR));
  return {
    map, map2, W, H, rooms, rooms2, entC, entR, treasureDoors,
    stairC: cx, stairR: ft, keyLocations: floorCells.slice(0, 1), cfg,
    flight: {c0: cx - 1, c1: cx + 1, top: ft, bot: fb}, flights: [{c0: cx - 1, c1: cx + 1, top: ft, bot: fb, dir: 'n'}],
    stairHoles: [{x0: cx - 1.5, x1: cx + 1.5, z0: fb - .5, z1: ft + .5}],
  };
}
FORT_INTERIORS.fort_hall = (size, seed) => makeFortHall(size, seed);

// S600 — DECISION #177 A, the second shape: BARRACKS AND THE GAOL. One long hall seven cells wide runs north from the
// entrance (hallway floor, so the fort pass gives it its wall columns and its centre colonnade), with three rooms off
// each side, mostly bunk rooms, and the captain's room beyond its north end. At that end a straight flight three cells
// wide goes down northward inside the hall, walkways either side of it to the captain's door. Below, the flight lands
// in the gaol: a passage north between two pairs of cells, each on a narrow doorway (gen.gaolCells: where the grilles
// hang), and the gaoler's room at its end. Built for the medium sizes and up; a smaller fort is a hall and undercroft.
function makeFortBarracks(size, seed){
  if(!/^(medium|large|massive)$/.test(size)) return makeFortHall(size, seed);
  const G = makeFortHall(size, seed), {W, H, cfg} = G, r = (s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)(hashSeed(seed * 7 + 600));
  const map = Array.from({length:H}, () => new Array(W).fill(0)), map2 = Array.from({length:H}, () => new Array(W).fill(0));
  const rooms = [], rooms2 = [], treasureDoors = [], gaolCells = [];
  const cx = Math.floor(W/2), hx0 = cx - 3, hx1 = cx + 3, hz0 = H - 42, SIDE = 8, FL = 8;
  const fill = (m, x0, z0, w, h, t) => { for(let z = z0; z < z0 + h; z++) for(let x = x0; x < x0 + w; x++) if(z > 0 && z < H - 1 && x > 0 && x < W - 1) m[z][x] = t; };
  const room = (list, x0, z0, w, h, kind) => list.push({x:x0, y:z0, w, h, cx:Math.floor(x0 + w/2), cy:Math.floor(z0 + h/2), kind});
  // the long hall, to the south edge, the entrance in its middle
  for(let z = hz0; z <= H - 1; z++) for(let x = hx0; x <= hx1; x++) map[z][x] = 7;
  const entC = cx, entR = H - 1; map[entR][entC] = 2;
  // the flight at the north end, three cells past it to the captain's door
  const fb = hz0 + 3, ft = fb + FL - 1;
  for(let z = fb; z <= ft; z++) for(let x = cx - 1; x <= cx + 1; x++){ map[z][x] = 3; map2[z][x] = 3; }
  fill(map, cx - 4, hz0 - 9, 9, 8, 6); room(rooms, cx - 4, hz0 - 9, 9, 8, 'lords_chamber');
  map[hz0 - 1][cx] = 4; treasureDoors.push({x:cx, z:hz0 - 1, isEW:false, locked:false});
  // three rooms a side: bunk rooms, with a kitchen, an armoury and a guardroom among them by the seed
  const west = ['barracks', 'barracks', r() < .5 ? 'kitchen' : 'storeroom'], east = ['barracks', r() < .5 ? 'armory' : 'guardroom', 'barracks'];
  if(r() < .5) west.reverse(); if(r() < .5) east.reverse();
  for(let i = 0; i < 3; i++){ const z0 = ft + 3 + i * (SIDE + 1), dz = z0 + (SIDE >> 1); if(z0 + SIDE > H - 2) break;
    fill(map, hx0 - 1 - SIDE, z0, SIDE, SIDE, 1); room(rooms, hx0 - 1 - SIDE, z0, SIDE, SIDE, west[i]); map[dz][hx0 - 1] = 4; treasureDoors.push({x:hx0 - 1, z:dz, isEW:true, locked:false});
    fill(map, hx1 + 2, z0, SIDE, SIDE, 1); room(rooms, hx1 + 2, z0, SIDE, SIDE, east[i]); map[dz][hx1 + 1] = 4; treasureDoors.push({x:hx1 + 1, z:dz, isEW:true, locked:false}); }
  // the gaol: the passage, two pairs of cells, the gaoler's room
  const pz0 = fb - 10; fill(map2, cx - 1, pz0, 3, 10, 1); room(rooms2, cx - 1, pz0, 3, 10, 'gaol');
  for(let i = 0; i < 2; i++){ const c0 = fb - 4 - 4 * i;
    for(const sd of [-1, 1]){ const x0 = sd < 0 ? cx - 5 : cx + 3; fill(map2, x0, c0, 3, 3, 1); room(rooms2, x0, c0, 3, 3, 'gaol_cell'); map2[c0 + 1][cx + sd * 2] = 1; gaolCells.push({x:cx + sd * 2, z:c0 + 1, sd}); } }
  fill(map2, cx - 3, fb - 16, 7, 5, 1); room(rooms2, cx - 3, fb - 16, 7, 5, null); map2[fb - 11][cx] = 1;
  const floorCells = [];
  for(let z = 0; z < H; z++) for(let x = 0; x < W; x++) if(map[z][x] === 1) floorCells.push({x, y:z});
  floorCells.sort((a, b) => Math.hypot(b.x - entC, b.y - entR) - Math.hypot(a.x - entC, a.y - entR));
  return {
    map, map2, W, H, rooms, rooms2, entC, entR, treasureDoors,
    stairC: cx, stairR: ft, keyLocations: floorCells.slice(0, 1), cfg, gaolCells,
    flight: {c0: cx - 1, c1: cx + 1, top: ft, bot: fb}, flights: [{c0: cx - 1, c1: cx + 1, top: ft, bot: fb, dir: 'n'}],
    stairHoles: [{x0: cx - 1.5, x1: cx + 1.5, z0: fb - .5, z1: ft + .5}],
  };
}
FORT_INTERIORS.fort_barracks = (size, seed) => makeFortBarracks(size, seed);

// S601 — DECISION #177 A, the third shape: THE RING AND ITS TOWERS. A passage three cells wide runs round a sunken yard,
// which you see over a balustrade from the ring before you can reach it. Four towers stand off the ring's corners: two
// hold a straight flight down (north-east going north, south-west going south), two are guardrooms; Michael chose stairs
// down only, so no tower goes up. Below, each flight lands at its tower's base, and a passage leads from it to the yard,
// which is floor 2's (its ceiling left open: gen.yard). Built for the medium sizes and up; a smaller fort is a hall.
function makeFortRing(size, seed){
  if(!/^(medium|large|massive)$/.test(size)) return makeFortHall(size, seed);
  const {W, H, cfg} = makeFortHall(size, seed), r = (s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)(hashSeed(seed * 7 + 601));
  const map = Array.from({length:H}, () => new Array(W).fill(0)), map2 = Array.from({length:H}, () => new Array(W).fill(0));
  const rooms = [], rooms2 = [], treasureDoors = [], cx = Math.floor(W/2), cz = Math.floor(H/2);
  const fill = (m, x0, z0, w, h, t) => { for(let z = z0; z < z0 + h; z++) for(let x = x0; x < x0 + w; x++) if(z > 0 && z < H - 1 && x > 0 && x < W - 1) m[z][x] = t; };
  const room = (list, x0, z0, w, h, kind) => list.push({x:x0, y:z0, w, h, cx:Math.floor(x0 + w/2), cy:Math.floor(z0 + h/2), kind});
  const door = (x, z, isEW) => { map[z][x] = 4; treasureDoors.push({x, z, isEW, locked:false}); };
  // the ring and the yard (open on floor 1, tile 3; floor on floor 2)
  for(let z = cz - 9; z <= cz + 8; z++) for(let x = cx - 9; x <= cx + 8; x++) map[z][x] = 7;
  for(let z = cz - 6; z <= cz + 5; z++) for(let x = cx - 6; x <= cx + 5; x++){ map[z][x] = 3; map2[z][x] = 1; }
  room(rooms2, cx - 6, cz - 6, 12, 12, 'yard');
  // the way in, from the south edge to the ring
  for(let z = cz + 9; z <= H - 1; z++) for(let x = cx - 2; x <= cx + 2; x++) map[z][x] = 7;
  const entC = cx, entR = H - 1; map[entR][entC] = 2;
  // the towers with flights: north-east (down northward) and south-west (down southward)
  const flights = [];
  fill(map, cx + 10, cz - 14, 5, 12, 1); room(rooms, cx + 10, cz - 14, 5, 12, 'tower'); door(cx + 9, cz - 3, true);
  flights.push({c0: cx + 11, c1: cx + 13, top: cz - 4, bot: cz - 11, dir: 'n'});
  fill(map, cx - 15, cz + 2, 5, 12, 1); room(rooms, cx - 15, cz + 2, 5, 12, 'tower'); door(cx - 10, cz + 3, true);
  flights.push({c0: cx - 14, c1: cx - 12, top: cz + 3, bot: cz + 10, dir: 's'});
  for(const F of flights) for(let z = Math.min(F.top, F.bot); z <= Math.max(F.top, F.bot); z++) for(let x = F.c0; x <= F.c1; x++){ map[z][x] = 3; map2[z][x] = 3; }
  // the two guardrooms at the other corners; the seed says which is the armoury
  const kinds = r() < .5 ? ['guardroom', 'armory'] : ['armory', 'guardroom'];
  fill(map, cx - 16, cz - 12, 6, 6, 1); room(rooms, cx - 16, cz - 12, 6, 6, kinds[0]); door(cx - 10, cz - 9, true);
  fill(map, cx + 10, cz + 7, 6, 6, 1); room(rooms, cx + 10, cz + 7, 6, 6, kinds[1]); door(cx + 9, cz + 8, true);
  // below: each tower's base, and a passage from it to the yard
  fill(map2, cx + 10, cz - 14, 5, 3, 1); room(rooms2, cx + 10, cz - 14, 5, 3, null);
  for(let x = cx; x <= cx + 9; x++) map2[cz - 13][x] = 1; for(let z = cz - 13; z <= cz - 7; z++) map2[z][cx] = 1;
  fill(map2, cx - 15, cz + 11, 5, 3, 1); room(rooms2, cx - 15, cz + 11, 5, 3, null);
  for(let x = cx - 10; x <= cx - 1; x++) map2[cz + 12][x] = 1; for(let z = cz + 6; z <= cz + 12; z++) map2[z][cx - 1] = 1;
  const floorCells = [];
  for(let z = 0; z < H; z++) for(let x = 0; x < W; x++) if(map[z][x] === 1) floorCells.push({x, y:z});
  floorCells.sort((a, b) => Math.hypot(b.x - entC, b.y - entR) - Math.hypot(a.x - entC, a.y - entR));
  const hole = F => ({x0: F.c0 - .5, x1: F.c1 + .5, z0: Math.min(F.top, F.bot) - .5, z1: Math.max(F.top, F.bot) + .5});
  return {
    map, map2, W, H, rooms, rooms2, entC, entR, treasureDoors,
    stairC: flights[0].c0 + 1, stairR: flights[0].top, keyLocations: floorCells.slice(0, 1), cfg,
    flight: flights[0], flights, yard: {c0: cx - 6, c1: cx + 5, r0: cz - 6, r1: cz + 5},
    stairHoles: flights.map(hole).concat([{x0: cx - 6.5, x1: cx + 5.5, z0: cz - 6.5, z1: cz + 5.5}]),
  };
}
FORT_INTERIORS.fort_ring = (size, seed) => makeFortRing(size, seed);

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
  const col=dCellOf(x),row=dCellOf(z);
  const map=activeMap();
  if(row<0||row>=dR||col<0||col>=dC)return true;
  const v=map[row][col];
  if(v===0||v===8||v===9)return true; // S1293 — a chasm's open air and a pier's footing (a gate's spaces)
  // v61g6: tile 4 (unlocked door) now consults DOORS like tile 5 does. Pre-v61g6,
  // tile 4 returned !solid unconditionally because unlocked doors had no mesh and
  // were treated as permanently-open passages. v61g6 spawns door meshes for ALL
  // tile-4 doors (fort interiors + cave corridor doors) and they're closeable, so
  // collision must reflect open/closed state. If no DOORS entry exists at this
  // cell (e.g. legacy save, pre-v61g6 dungeon, or an open passage that was never
  // a door), we fall back to "passable" — preserving the old behavior.
  // S1283 — at the true cell a door is 1.2 wide in its cell's middle (dunScaleWhole hangs the wall either side of it, as props):
  // shut, it is solid within 0.2 of its plane (your body's corners 0.3 round you stop 0.5 off it), so you come up to it and touch
  // it, not a cell's half short of it
  if(v===4||v===5){const d=DOORS.find(d=>d.c===col&&d.r===row&&d.floor===currentFloor);if(dPropHit(x,z))return true;if(!d)return v===5;if(d.open)return false;
    return DCELL===1||Math.abs(d.isEW?x-d.x:z-d.z)<.2;}
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
    if(col.floor && col.floor !== currentFloor) continue; // S599 — a column belongs to its floor
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
