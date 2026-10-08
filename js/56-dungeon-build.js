let _exhaustedStrike=false; // v80 S9 — set per swing when stamina was below the minimum
function flashStamina(){const el=document.getElementById('stb');if(!el)return;el.style.transition='none';el.style.background='#ffd040';el.style.boxShadow='0 0 10px #ffd040';setTimeout(()=>{el.style.transition='background .35s, box-shadow .35s';el.style.boxShadow='';},60);}
let D_BEDS=[]; // v80 S9 — {x,z,floor} cots you can rest on (forts)
function dPropHit(x, z){
  if(!DUNGEON_PROPS || DUNGEON_PROPS.length === 0) return false;
  for(const p of DUNGEON_PROPS){
    if(p.floor && p.floor !== currentFloor) continue; // S599 — a prop belongs to its floor
    if(x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1) return true;
  }
  return false;
}
function dBlk(x,z){const R=0.2;return dSolid(x-R,z-R)||dSolid(x+R,z-R)||dSolid(x-R,z+R)||dSolid(x+R,z+R);}
function dSlide(x,z,dx,dz){if(!dBlk(x+dx,z+dz))return[x+dx,z+dz];if(!dBlk(x+dx,z))return[x+dx,z];if(!dBlk(x,z+dz))return[x,z+dz];return[x,z];}
function bfs(sx,sz,tx,tz){const sc=Math.round(sx),sr=Math.round(sz),tc=Math.round(tx),tr=Math.round(tz);if(sc===tc&&sr===tr)return[];const vis=new Set(),q=[[sc,sr,[]]];vis.add(sr*dC+sc);while(q.length){const[cc,cr,path]=q.shift();for(const[dc,dr]of[[0,1],[0,-1],[1,0],[-1,0]]){const nc=cc+dc,nr=cr+dr,key=nr*dC+nc;if(nr<0||nr>=dR||nc<0||nc>=dC||vis.has(key))continue;if(dSolid(nc,nr))continue;vis.add(key);const np=[...path,[nc,nr]];if(nc===tc&&nr===tr)return np;q.push([nc,nr,np]);}}return[];}

// ── FLOOR TRANSITIONS ─────────────────────────────────────────
function goToFloor2(){
  if(!dMap2||dStairC===null)return;
  doFade(()=>{
    currentFloor=2;
    // v61ea: removed dead reach_dungeon_floor checkQuestProgress fire — no
    // quest in the active set uses this objective type post-v61n's swap to
    // touch_sigil. If a future quest needs "reach floor N" semantics,
    // re-add the event-fire and re-add the matching handler branches.
    // Find nearest open cell adjacent to stair on map2 (corridor may go any direction)
    let spawnC=dStairC,spawnR=dStairR+1;
    for(const[dc,dr] of [[0,1],[0,-1],[-1,0],[1,0]]){
      const nc=dStairC+dc,nr=dStairR+dr;
      if(nr>=0&&nr<dR&&nc>=0&&nc<dC&&dMap2[nr][nc]!==0){spawnC=nc;spawnR=nr;break;}
    }
    px=spawnC;pz=spawnR;yaw=0;pitch=0;velY=0;jumpY=FLOOR2_Y;onGround=true;
    const _ds=currentPortal.diffScale||DIFF_SCALE.normal;
    showZoneName('\u2b07 '+currentPortal.name+' \u2014 Floor 2 ['+_ds.label+' \u2605]');
    addLog('\u2b07','Descended to floor 2 of '+currentPortal.name);
    showMsg('Floor 2 \u2014 darker and more dangerous.','#cc88ff');
    sndEnterDungeon();startMusic('dungeon',currentPortal.theme);
  });
}
function goToFloor1(){
  if(!dMap2||dStairC===null)return;
  doFade(()=>{
    currentFloor=1;
    // Find nearest open cell adjacent to stair on floor 1 map
    let spawnC=dStairC,spawnR=dStairR+1;
    for(const[dc,dr] of [[0,1],[0,-1],[-1,0],[1,0]]){
      const nc=dStairC+dc,nr=dStairR+dr;
      if(nr>=0&&nr<dR&&nc>=0&&nc<dC&&dMap[nr][nc]!==0){spawnC=nc;spawnR=nr;break;}
    }
    px=spawnC;pz=spawnR;yaw=0;pitch=0;velY=0;jumpY=0;onGround=true;
    const _ds=currentPortal.diffScale||DIFF_SCALE.normal;
    showZoneName('\u2694 '+currentPortal.name+' ['+_ds.label+']');
    addLog('\u2b06','Returned to floor 1 of '+currentPortal.name);
    showMsg('Back on floor 1.','#88ffaa');
    sndReturnOW();startMusic('dungeon',currentPortal.theme);
  });
}

let _dungeonBuildEnemy=null; // S253 — set by buildDungeon: the Slime's split needs the dungeon's enemy builder
// ── S189: the dungeon's shell (backlog H, playtest s162 item 7: the '90s screensaver) ──
// One merged mesh each for a floor's walls, its floor and its ceiling, in place of a box per wall cell and a plane per
// floor and ceiling cell (3,400–3,600 meshes a dungeon). Walls are faced only where they meet open ground, cut into
// courses of dressed stone by a texture laid in world units (so courses run on across cells), warped by a noise field
// of the world position (so neighbouring faces meet with no crack), bevelled at every outside corner and filled at
// every inside one, and shaded smooth across the corners. Vertex colours carry the shade: darker where the wall meets
// the floor and the ceiling, in inside corners, and a damp band at the foot; the floor darkens towards the walls.
const DUN_SHELL={U:4,V:8,AMP:.07,BEVEL:.16,FILL:.1,TEXU:1.6,COVE:.34,COVE0:.7};
// S190 — damp and moss by theme: the colour the foot of a wall (and the floor along it) goes where it is wet, in patches
const DUN_DAMP={goblin:[.6,.95,.42],ruins:[.72,.9,.52],deep:[.58,.74,.98],undead:[.76,.72,.88],haunted:[.84,.86,.94],elemental:[.5,.42,.38]};
function dunNoise(seed){const h=(i,j,k)=>{let n=(i*374761393+j*668265263+k*2147483647+seed*1274126177)|0;n=(n^(n>>>13))*1274126177|0;return ((n^(n>>>16))>>>0)/4294967296;};
  const sm=t=>t*t*(3-2*t);
  return (x,y,z)=>{const i=Math.floor(x),j=Math.floor(y),k=Math.floor(z),fx=sm(x-i),fy=sm(y-j),fz=sm(z-k);let v=0;
    for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++)v+=h(i+a,j+b,k+c)*(a?fx:1-fx)*(b?fy:1-fy)*(c?fz:1-fz);return v*2-1;};}
function dunStoneTex(col,seed,kind){const rnd=pRng(seed);const C=new THREE.Color(col);
  const hex=(c,k)=>'#'+c.clone().multiplyScalar(k).getHexString();
  return mkTex((x,w,h)=>{x.fillStyle=hex(C,.45);x.fillRect(0,0,w,h);
    if(kind==='floor'){ // flagstones: rows of irregular slabs
      let y=0;while(y<h){const rh=Math.min(h-y,22+Math.floor(rnd()*20));let xx=-Math.floor(rnd()*30);while(xx<w){const bw=24+Math.floor(rnd()*30);const t=.8+rnd()*.45;
        x.fillStyle=hex(C,t);x.fillRect(xx+1.5,y+1.5,bw-3,rh-3);x.fillStyle='rgba(255,255,255,.05)';x.fillRect(xx+2,y+2,bw-5,2);
        for(let i=0;i<5;i++){x.fillStyle=`rgba(0,0,0,${.1+rnd()*.15})`;x.fillRect(xx+rnd()*bw,y+rnd()*rh,1+rnd()*3,1+rnd()*2);}xx+=bw;}y+=rh;}
      return;}
    // walls: courses of dressed stone of uneven height, running bond, chipped arrises, a lit top edge and a shadowed foot
    const courses=[];let y=0;while(y<h){const ch=Math.min(h-y,14+Math.floor(rnd()*9));courses.push([y,ch]);y+=ch;}
    if(courses.length>1&&courses[courses.length-1][1]<10){const l=courses.pop();courses[courses.length-1][1]+=l[1];}
    for(const [cy,ch] of courses){let xx=-Math.floor(rnd()*28);while(xx<w){const bw=18+Math.floor(rnd()*22);const t=.78+rnd()*.5;
      const draw=(ox)=>{x.fillStyle=hex(C,t);x.fillRect(xx+ox+1.5,cy+1.5,bw-3,ch-3);x.fillStyle='rgba(255,240,220,.09)';x.fillRect(xx+ox+2,cy+1.5,bw-4,1.5);
        x.fillStyle='rgba(0,0,0,.28)';x.fillRect(xx+ox+2,cy+ch-3,bw-4,1.5);
        for(let i=0;i<6;i++){x.fillStyle=`rgba(0,0,0,${.08+rnd()*.18})`;x.fillRect(xx+ox+rnd()*bw,cy+rnd()*ch,1+rnd()*4,1+rnd()*2);}
        if(rnd()<.3){x.fillStyle=hex(C,.45);x.fillRect(xx+ox+(rnd()<.5?1:bw-5),cy+(rnd()<.5?1:ch-5),4,4);}};
      draw(0);if(xx+bw>w)draw(-w);xx+=bw;}}
  },128,128);}
function buildDunShell(map,baseY,wallCol,floorCol,opts){
  const H=FLOOR_HEIGHT,R=map.length,Cn=map[0].length,S=Object.assign({},DUN_SHELL,opts&&opts.amp!=null?{AMP:opts.amp}:{},opts&&opts.cove===false?{COVE:0}:{}),seed=(opts&&opts.seed)||1;const N1=dunNoise(seed),N2=dunNoise(seed+7),N3=dunNoise(seed+13);
  const wall=(c,r)=>r<0||r>=R||c<0||c>=Cn||map[r][c]===0;
  const skip=opts&&opts.skip||(()=>false); // cells whose floor and ceiling someone else draws (stairs, treasure)
  const noCeil=opts&&opts.noCeil||(()=>false); // S601 — cells open to the floor above (the ring's sunken yard)
  // where a point of the wall moves: the noise, then a bevel at an outside corner or a fill at an inside one
  const corner=(X,Z)=>{const c0=Math.floor(X),r0=Math.floor(Z);let w=0;for(const [c,r] of [[c0,r0],[c0+1,r0],[c0,r0+1],[c0+1,r0+1]])if(wall(c,r))w++;return w;};
  const warp=(X,Y,Z)=>{let x=X+S.AMP*N1(X*1.3,Y*.9,Z*1.3)+.02*N2(X*5,Y*5,Z*5),z=Z+S.AMP*N3(X*1.3,Y*.9,Z*1.3)+.02*N1(Z*5,Y*5,X*5);
    const fx=X-Math.floor(X),fz=Z-Math.floor(Z);
    if(Math.abs(fx-.5)<1e-4&&Math.abs(fz-.5)<1e-4){const c0=Math.floor(X),r0=Math.floor(Z);const q=[[c0,r0],[c0+1,r0],[c0,r0+1],[c0+1,r0+1]].filter(([c,r])=>wall(c,r));
      if(q.length===1){x+=(q[0][0]-X)*2*S.BEVEL;z+=(q[0][1]-Z)*2*S.BEVEL;}
      else if(q.length===3){const o=[[c0,r0],[c0+1,r0],[c0,r0+1],[c0+1,r0+1]].find(([c,r])=>!wall(c,r));x+=(o[0]-X)*2*S.FILL;z+=(o[1]-Z)*2*S.FILL;}}
    // the cove (S190): above COVE0 of the height the wall leans out over the room on a curve, a vault's springing.
    // Its direction comes from the open cells that touch the point, so faces meeting at a corner lean together.
    const u=(Y-baseY)/H;if(u>S.COVE0){const e=(u-S.COVE0)/(1-S.COVE0),k=S.COVE*e*e;let dx=0,dz=0;
      for(const c of [Math.floor(X+.5-1e-4),Math.ceil(X-.5+1e-4)])for(const r of [Math.floor(Z+.5-1e-4),Math.ceil(Z-.5+1e-4)])if(Math.abs(c-X)<=.5+1e-4&&Math.abs(r-Z)<=.5+1e-4&&!wall(c,r)){dx+=c-X;dz+=r-Z;}
      const l=Math.hypot(dx,dz);if(l>1e-6){x+=dx/l*k;z+=dz/l*k;}}
    return [x,z];};
  const damp=(opts&&opts.damp)||null,Nd=dunNoise(seed+29);
  const wet=(X,Z,h)=>{if(!damp||h>=1)return [1,1,1];const p=Math.max(0,Math.min(1,.5+1.4*Nd(X*.8,0,Z*.8)))*(1-h);return [1+(damp[0]-1)*p,1+(damp[1]-1)*p,1+(damp[2]-1)*p];};
  const shade=(Y)=>{const u=Y-baseY;return (1-.42*Math.exp(-u/.45))*(1-.3*Math.exp(-(H-u)/.5))*(u<.7?.86+.2*u:1);};
  const P=[],UV=[],CO=[],IX=[];
  const quadGrid=(nu,nv,at)=>{const b=P.length/3;for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const v=at(i/nu,j/nv);P.push(v.p[0],v.p[1],v.p[2]);UV.push(v.uv[0],v.uv[1]);const w=wet(v.p[0],v.p[2],(v.p[1]-baseY)/1.2);CO.push(v.k*w[0],v.k*w[1],v.k*w[2]);}
    for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=b+j*(nu+1)+i,bb=a+1,c=a+nu+1,d=c+1;IX.push(a,c,bb,bb,c,d);}};
  // the walls: a face on each side of an open cell that meets a wall
  for(let r=0;r<R;r++)for(let c=0;c<Cn;c++){if(wall(c,r))continue;
    for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){if(!wall(c+dc,r+dr))continue;
      // the face's along-axis runs so the quad faces into the open cell
      const ax=dr,az=-dc; // along the face, turned so the winding faces into the open cell
      const ox=c+dc*.5,oz=r+dr*.5;
      quadGrid(S.U,S.V,(u,v)=>{const t=u-.5,X=ox+ax*t,Z=oz+az*t,Y=baseY+v*H;const [x,z]=warp(X,Y,Z);
        return {p:[x,Y,z],uv:[(ax?X:Z)/S.TEXU+(dr?.37:0),Y/S.TEXU],k:shade(Y)*(Math.abs(t)>.49&&corner(X,Z)===3?.72:1)};});}}
  const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));wg.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));
  wg.setAttribute('color',new THREE.Float32BufferAttribute(CO,3));wg.setIndex(IX);dunSmoothNormals(wg);
  const wm=new THREE.MeshLambertMaterial({map:dunStoneTex(wallCol,seed,'wall'),vertexColors:true});
  const walls=new THREE.Mesh(wg,wm);walls.userData.dunShell='walls';
  // floor and ceiling: a grid over every cell but the ones drawn elsewhere, darker towards the walls, the floor a
  // little uneven between its edges (never at a cell's rim, so it meets the stair and treasure planes)
  const plane=(y,down,col,kind)=>{const P2=[],U2=[],C2=[],I2=[];const n=2;
    const ao=(X,Z)=>{let w=0;for(const [c,r] of [[Math.floor(X-.25+.5),Math.floor(Z-.25+.5)],[Math.floor(X+.25+.5),Math.floor(Z-.25+.5)],[Math.floor(X-.25+.5),Math.floor(Z+.25+.5)],[Math.floor(X+.25+.5),Math.floor(Z+.25+.5)]])if(wall(c,r))w++;return 1-.13*w;};
    for(let r=0;r<R;r++)for(let c=0;c<Cn;c++){if(skip(c,r)||(down&&noCeil(c,r)))continue;const b=P2.length/3;
      for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const X=c-.5+i/n,Z=r-.5+j/n;const rim=i===0||j===0||i===n||j===n;const dy=rim?0:(down?.08:.03)*N2(X*1.7,y,Z*1.7);
        P2.push(X,y+dy,Z);U2.push(X/S.TEXU,Z/S.TEXU);const k=ao(X,Z);const w=down?[1,1,1]:wet(X,Z,1-(1-k)*4);C2.push(k*w[0],k*w[1],k*w[2]);}
      for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=b+j*(n+1)+i,bb=a+1,cc=a+n+1,d=cc+1;if(down)I2.push(a,bb,cc,bb,d,cc);else I2.push(a,cc,bb,bb,cc,d);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P2,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U2,2));g.setAttribute('color',new THREE.Float32BufferAttribute(C2,3));g.setIndex(I2);g.computeVertexNormals();
    const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({map:dunStoneTex(col,seed+(down?3:1),kind),vertexColors:true}));m.userData.dunShell=down?'ceiling':'floor';return m;};
  const floor=plane(baseY,false,floorCol,'floor');
  const ceil=plane(baseY+H,true,new THREE.Color(wallCol).multiplyScalar(.6),'floor');
  // beams (S190): in every room at least three cells across, timbers across its shorter span every two cells, just
  // under the ceiling; one merged mesh a floor, the grain in the vertex colour
  let beams=null;const rooms=(opts&&opts.rooms)||[];const BP=[],BN=[],BC=[],BI=[];const rb=pRng(seed+41);
  const box=(cx,cy,cz,sx,sy,sz,col)=>{const g=new THREE.BoxGeometry(sx,sy,sz);const p=g.attributes.position,n=g.attributes.normal,b=BP.length/3;
    for(let i=0;i<p.count;i++){BP.push(p.getX(i)+cx,p.getY(i)+cy,p.getZ(i)+cz);BN.push(n.getX(i),n.getY(i),n.getZ(i));const t=.85+.3*rb();BC.push(col.r*t,col.g*t,col.b*t);}
    const ix=g.index.array;for(let i=0;i<ix.length;i++)BI.push(ix[i]+b);g.dispose();};
  const wood=new THREE.Color(0x3a2818);
  // S598 — a beam stops short of the stair's shaft (opts.hole, floor 2): it ran through the treads (Michael, on #173)
  // S601 — any number of holes (opts.holes: the ring's two flights and its yard), each cut from the runs in turn
  const holes=(opts&&opts.holes)||(opts&&opts.hole?[opts.hole]:[]);const runs1=(segs,across,h0,h1,c0,c1)=>across+.09<c0||across-.09>c1?segs:segs.flatMap(([a,b])=>[[a,Math.min(b,h0-.04)],[Math.max(a,h1+.04),b]]).filter(([p,q])=>q-p>.2);
  const runs=(a,b,across,axis)=>holes.reduce((segs,h)=>axis==='x'?runs1(segs,across,h.x0,h.x1,h.z0,h.z1):runs1(segs,across,h.z0,h.z1,h.x0,h.x1),[[a,b]]);
  for(const rm of rooms){if(Math.min(rm.w,rm.h)<3)continue;const alongX=rm.w<=rm.h;const n=alongX?rm.h:rm.w;
    for(let k=1;k<n-.5;k+=2){const y=baseY+H-.16;
      if(alongX){const z=rm.y+k-.5+.5,x0=rm.x-.5,x1=rm.x+rm.w-.5;for(const [a,b] of runs(x0-.25,x1+.25,z,'x'))box((a+b)/2,y,z,b-a,.2,.18,wood);}
      else{const x=rm.x+k-.5+.5,z0=rm.y-.5,z1=rm.y+rm.h-.5;for(const [a,b] of runs(z0-.25,z1+.25,x,'z'))box(x,y,(a+b)/2,.18,.2,b-a,wood);}}}
  if(BP.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(BP,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(BN,3));g.setAttribute('color',new THREE.Float32BufferAttribute(BC,3));g.setIndex(BI);
    beams=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true}));beams.userData.dunShell='beams';}
  return {walls,floor,ceil,beams};}
// normals averaged over every vertex at the same place, so the bevels and the faces' shared edges shade smooth
// S191 — the props of a floor as one mesh: parts are [geometry, colour, matrix]; each part's colour goes in its vertices
// ═══ FURNITURE ON THE SHAPE KIT (Session 286, H.5 props; Michael's A on the concept artist's prototype, #46) ═══
// Lifted whole from docs/prototypes/interiors/furniture.js (auto/concept): builders for a home's and an inn's furniture in
// the kit's idioms (lathes, SK.rbox, SK.ball), each a list of parts baked into ONE vertex-coloured mesh a room plus one unlit
// mesh for the flames. Sizes are final room units (buildInteriorFor's F is already applied). WOOD by nation. furnKit() makes
// the builders once; the materials are shared by every room.
function furnBuild(THREE, SK) {
  const C = x => (x && x.isColor) ? x.clone() : new THREE.Color(x);
  const rng = s => { let a = (s >>> 0) % 2147483647 || 1; return () => (a = (a * 16807) % 2147483647) / 2147483647; };
  const M = (x, y, z, rx, ry, rz, sx, sy, sz) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx || 1, sy || 1, sz || 1));
  // a part list: P(geo, col, x, y, z, rx, ry, rz, sx, sy, sz)
  function Parts() { const L = [], F = []; const p = (geo, col, x, y, z, rx, ry, rz, sx, sy, sz) => { L.push([geo, C(col), M(x, y, z, rx, ry, rz, sx, sy, sz)]); return p; };
    p.list = L; p.fire = F; p.flame = (geo, col, x, y, z, rx, ry, rz, sx, sy, sz) => { F.push([geo, C(col), M(x, y, z, rx, ry, rz, sx, sy, sz)]); return p; };
    p.put = (q, x, z, ry, y) => { const m = M(x, y || 0, z, 0, ry || 0, 0); for (const e of q.list) L.push([e[0], e[1], m.clone().multiply(e[2])]); for (const e of q.fire) F.push([e[0], e[1], m.clone().multiply(e[2])]); return p; };
    return p; }
  const jit = (col, r, a) => C(col).offsetHSL(0, 0, (r() - .5) * (a || .06));
  const lathe = (pts, seg) => SK.lathe(pts, seg || 8);
  // WOOD by nation: the Gatelands' oak, the Mark's dark pine, Aurenne's walnut with painted pieces
  const WOOD = { gatelands: { wood: 0x6e4a2c, dark: 0x4a301a, pale: 0x8e6a44, paint: null, cloth: [0x7a2a1e, 0xb08a3a, 0x3a4a5a] },
    mark: { wood: 0x5a4632, dark: 0x3a2c1e, pale: 0x7a6448, paint: null, cloth: [0x3a4a5a, 0x8a7a60, 0x4a4a4c] },
    aurenne: { wood: 0x5c3a22, dark: 0x3c2414, pale: 0x86603a, paint: 0x2a4a7a, cloth: [0x1e3a7a, 0xb08a3a, 0x6a2a3a] } };
  const IRON = 0x2c2826, STONE = 0x86807a, SOOT = 0x14100c;

  // a turned leg: h tall, r thick, with a bead and a foot
  const legProf = (h, r) => [[r * .9, 0], [r, h * .05], [r * .8, h * .12], [r * .75, h * .45], [r * 1.15, h * .52], [r * .8, h * .6], [r * .75, h * .82], [r * 1.05, h * .88], [r * 1.05, h]];
  const turned = (h, r, seg) => lathe(legProf(h, r), seg || 8);

  // a table: planked top with breadboard ends, turned legs, aprons, an H stretcher
  function table(w, d, n, seed) { const r = rng(seed || 3), p = Parts(), W = WOOD[n] || WOOD.gatelands, top = .46, th = .045;
    const k = Math.max(3, Math.round(d / .2)), pw = (d - .06) / k;
    for (let i = 0; i < k; i++) p(SK.rbox(w - .1, th, pw - .004, .01, 1), jit(W.wood, r, .035), 0, top - th / 2, -d / 2 + .08 / 2 + pw * (i + .5) - .01);
    for (const s of [-1, 1]) p(SK.rbox(.07, th + .004, d, .012, 1), jit(W.dark, r, .03), s * (w / 2 - .035), top - th / 2, 0);
    const lx = w / 2 - .12, lz = d / 2 - .1, lh = top - th;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p(turned(lh, .026), jit(W.dark, r, .04), sx * lx, 0, sz * lz);
    for (const s of [-1, 1]) { p(SK.rbox(2 * lx - .04, .06, .02, .006, 1), W.dark, 0, lh - .035, s * lz); p(SK.rbox(.02, .06, 2 * lz - .04, .006, 1), W.dark, s * lx, lh - .035, 0);
      p(SK.rbox(.03, .03, 2 * lz, .008, 1), W.dark, s * lx, .07, 0); }
    p(SK.rbox(2 * lx, .03, .03, .008, 1), W.dark, 0, .07, 0);
    return p; }
  // a bench: a thick plank on splayed legs, a stretcher under it
  function bench(w, n, seed) { const r = rng(seed || 5), p = Parts(), W = WOOD[n] || WOOD.gatelands, h = .26;
    p(SK.rbox(w, .04, .24, .012, 1), jit(W.wood, r), 0, h - .02, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p(SK.cyl(.018, .022, h - .03, 6), jit(W.dark, r, .04), sx * (w / 2 - .14), (h - .03) / 2, sz * .075, sz * -.18, 0, sx * .12);
    p(SK.rbox(w - .3, .025, .025, .006, 1), W.dark, 0, .08, 0);
    return p; }
  // a chair: turned legs and back posts with finials, three slats, a seat of boards (or rush, painted in Aurenne)
  function chair(n, seed) { const r = rng(seed || 7), p = Parts(), W = WOOD[n] || WOOD.gatelands, wood = W.paint || W.wood, sh = .26, sw = .32, sd = .28;
    p(SK.rbox(sw, .03, sd, .01, 1), n === 'mark' ? jit(W.pale, r) : 0xb8964e, 0, sh - .015, 0);
    for (const sx of [-1, 1]) { p(turned(sh - .03, .017), jit(wood, r, .03), sx * (sw / 2 - .025), 0, sd / 2 - .025);
      p(lathe([[.018, 0], [.02, .1], [.016, .22], [.02, .3], [.017, .5], [.022, .54], [.028, .56], [.018, .59], [.001, .6]], 8), jit(wood, r, .03), sx * (sw / 2 - .025), 0, -sd / 2 + .025, -.08, 0, 0);
      p(SK.rbox(.016, .016, sd - .05, .005, 1), wood, sx * (sw / 2 - .025), .08, 0); }
    for (const y of [.36, .44, .52]) p(SK.rbox(sw - .07, .045, .016, .006, 1), jit(wood, r, .04), 0, y, -sd / 2 + .02 - (y - sh) * .08);
    p(SK.rbox(sw - .05, .016, .016, .005, 1), wood, 0, .1, sd / 2 - .025);
    return p; }
  // a stool: a round seat on three splayed legs with a ring
  function stool(n, seed) { const r = rng(seed || 9), p = Parts(), W = WOOD[n] || WOOD.gatelands, h = .38;
    p(SK.cyl(.13, .12, .04, 12), jit(W.wood, r), 0, h - .02, 0);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; p(SK.cyl(.016, .02, h - .02, 6), W.dark, Math.sin(a) * .08, (h - .02) / 2, Math.cos(a) * .08, Math.cos(a) * -.16, 0, Math.sin(a) * .16); }
    p(SK.torus(.095, .01, 4, 14), W.dark, 0, .12, 0, Math.PI / 2);
    return p; }
  // a box bed: posts with finials, a planked headboard, a stuffed tick, a quilt of three bands over the foot, a turned-down
  // sheet and a pillow. Head at local −z.
  function bed(n, seed, bl, bw) { const r = rng(seed || 11), p = Parts(), W = WOOD[n] || WOOD.gatelands, rail = .2; bl = bl || 1.5; bw = bw || .86;
    for (const s of [-1, 1]) p(SK.rbox(.05, .13, bl - .08, .012, 1), jit(W.wood, r), s * (bw / 2 - .025), rail, 0);
    for (const s of [-1, 1]) p(SK.rbox(bw - .08, .13, .05, .012, 1), jit(W.wood, r), 0, rail, s * (bl / 2 - .025));
    const post = h => lathe([[.03, 0], [.034, .04], [.028, .1], [.028, h - .12], [.036, h - .08], [.026, h - .05], [.036, h - .02], [.02, h], [.001, h + .005]], 8);
    for (const sx of [-1, 1]) { p(post(.66), jit(W.dark, r, .03), sx * (bw / 2 - .03), 0, -bl / 2 + .03); p(SK.ball(.035, 8, 6), W.dark, sx * (bw / 2 - .03), .685, -bl / 2 + .03);
      p(post(.46), jit(W.dark, r, .03), sx * (bw / 2 - .03), 0, bl / 2 - .03); p(SK.ball(.03, 8, 6), W.dark, sx * (bw / 2 - .03), .48, bl / 2 - .03); }
    for (let i = 0; i < 5; i++) p(SK.rbox((bw - .1) / 5 - .01, .3, .03, .008, 1), jit(W.paint || W.pale, r), -bw / 2 + .05 + (bw - .1) / 5 * (i + .5), .44, -bl / 2 + .03);
    p(SK.rbox(bw - .06, .05, .05, .012, 1), W.dark, 0, .6, -bl / 2 + .03);
    p(SK.rbox(bw - .08, .16, .05, .01, 1), jit(W.pale, r), 0, .34, bl / 2 - .03);
    p(SK.rbox(bw - .1, .13, bl - .12, .05, 2), 0xc8b48a, 0, .32, 0);
    const q = W.cloth, qz0 = -.05, ql = bl / 2 + .02 - qz0;
    for (let i = 0; i < 3; i++) { const z = qz0 + ql / 3 * (i + .5); p(SK.rbox(bw - .06, .04, ql / 3 + .004, .018, 1), jit(q[i % 3], r, .04), 0, .4, z);
      for (const s of [-1, 1]) p(SK.rbox(.025, .16, ql / 3 + .004, .01, 1), jit(q[i % 3], r, .04).multiplyScalar(.85), s * (bw / 2 - .035), .325, z); }
    p(SK.rbox(bw - .05, .035, .12, .015, 1), 0xe0d4b8, 0, .405, qz0 - .05);
    p(SK.ball(.12, 12, 8), 0xece2cc, 0, .41, -bl / 2 + .2, 0, 0, 0, 2.5, .55, 1.2);
    return p; }
  // an iron-bound chest: planked body, a barrel-vaulted lid, bands, a lock plate, handles
  function chest(n, seed) { const r = rng(seed || 13), p = Parts(), W = WOOD[n] || WOOD.gatelands, wood = W.paint || W.wood, w = .72, d = .42, h = .32;
    for (let i = 0; i < 3; i++) p(SK.rbox(w, h / 3 - .004, d, .01, 1), jit(wood, r), 0, h / 6 + h / 3 * i, 0);
    p(SK.cyl(d / 2, d / 2, w, 12, 1, false, 0, Math.PI), jit(wood, r), 0, h, 0, 0, 0, Math.PI / 2, .55, 1, 1);
    for (const s of [-1, 1]) p(new THREE.CircleGeometry(d / 2, 12, 0, Math.PI), wood, s * w / 2, h, 0, 0, s * Math.PI / 2, 0, 1, .55, 1);
    for (const x of [-.26, 0, .26]) { p(SK.rbox(.035, h + .004, d + .012, .006, 1), IRON, x, h / 2, 0);
      p(SK.torus(d / 2 + .005, .007, 4, 12, Math.PI), IRON, x, h, 0, 0, Math.PI / 2, 0, 1, .55, 1); }
    p(SK.rbox(.09, .1, .015, .01, 1), 0x6a5a3a, 0, h - .04, d / 2 + .008);
    for (const s of [-1, 1]) p(SK.torus(.04, .008, 4, 10, Math.PI), IRON, s * (w / 2 + .012), h * .7, 0, 0, Math.PI / 2, Math.PI);
    return p; }
  // pots, bottles and cups on the lathe
  const jar = (r, h) => lathe([[.001, 0], [r * .8, 0], [r, h * .15], [r, h * .6], [r * .6, h * .85], [r * .55, h], [r * .65, h * 1.04], [r * .5, h * 1.04]], 10);
  const bottle = (r, h) => lathe([[.001, 0], [r, 0], [r, h * .6], [r * .35, h * .78], [r * .3, h], [.001, h]], 6);
  const bowl = r => lathe([[.001, 0], [r * .5, 0], [r * .9, r * .35], [r, r * .5], [r * .92, r * .5], [r * .42, r * .1], [.001, r * .1]], 10);
  const tankard = (p, x, y, z, col) => { p(lathe([[.001, 0], [.032, 0], [.03, .09], [.033, .1], [.02, .1], [.02, .01], [.001, .01]], 8), col, x, y, z);
    p(SK.torus(.025, .006, 4, 8, Math.PI), col, x + .032, y + .05, z, 0, 0, -Math.PI / 2); };
  // a candle in a dish
  const candle = (p, x, y, z) => { p(lathe([[.001, 0], [.045, 0], [.045, .012], [.012, .015], [.012, .03], [.02, .035], [.001, .035]], 8), 0x7a6a4a, x, y, z);
    p(SK.cyl(.011, .012, .09, 6), 0xe8e0c8, x, y + .08, z); p.flame(SK.cone(.008, .03, 5), 0xffd070, x, y + .14, z); };
  // a wall shelf: a plank on two shaped brackets, dressed with jars, bowls, a stack of plates and a cloth
  function shelf(w, n, seed, stock) { const r = rng(seed || 17), p = Parts(), W = WOOD[n] || WOOD.gatelands;
    p(SK.rbox(w, .03, .22, .01, 1), jit(W.wood, r), 0, 0, .11);
    for (const s of [-1, 1]) { p(SK.rbox(.03, .16, .03, .008, 1), W.dark, s * (w / 2 - .12), -.08, .015); p(SK.rbox(.03, .03, .19, .008, 1), W.dark, s * (w / 2 - .12), -.025, .11);
      p(SK.rbox(.024, .2, .024, .006, 1), W.dark, s * (w / 2 - .12), -.075, .085, -Math.PI / 4.2); }
    const pots = [0x8a5a3a, 0xa8784a, 0x6a6a5a, 0xc8b89a, 0x4a5a3a, 0x7a3a2a];
    for (let x = -w / 2 + .12; x < w / 2 - .08;) { if (r() < .22) { x += .12 + r() * .25; continue; } const kind = stock === 'bottles' ? (r() < .75 ? 1 : 0) : stock === 'potions' ? (r() < .7 ? 1 : 0) : Math.floor(r() * 4);
      if (kind === 0) { const rr = .04 + r() * .025; p(jar(rr, .1 + r() * .08), pots[Math.floor(r() * pots.length)], x + rr, .015, .1 + r() * .03); x += rr * 2 + .03; }
      else if (kind === 1) { const rr = .028 + r() * .01; p(bottle(rr, .16 + r() * .06), (stock === 'potions' ? [0x50a0d0, 0x40c060, 0xc04040, 0xd0a030, 0x8040c0, 0x40c0b0] : [0x2a4a2a, 0x3a2a1a, 0x5a6a3a, 0x2a3a4a])[Math.floor(r() * (stock === 'potions' ? 6 : 4))], x + rr, .015, .11); x += rr * 2 + .025; }
      else if (kind === 2) { const rr = .06 + r() * .02; p(bowl(rr), jit(0x9a7050, r), x + rr, .015, .11); x += rr * 2 + .02; }
      else { for (let k = 0; k < 4; k++) p(SK.cyl(.075, .06, .012, 12), jit(0xd8ccb0, r, .03), x + .075, .02 + k * .013, .11); x += .17; } }
    return p; }
  // a braided rag rug: rings of alternating colour, an oval
  function rug(rx, rz, n, seed) { const r = rng(seed || 19), p = Parts(), cols = (WOOD[n] || WOOD.gatelands).cloth.concat([0x8a7a5a]);
    const k = 8; for (let i = 0; i < k; i++) p(new THREE.RingGeometry(i / k, (i + 1) / k, 28), jit(cols[i % cols.length], r, .05), 0, .006 + i * .0004, 0, -Math.PI / 2, 0, 0, rx, rz, 1);
    p(SK.torus(1, .012, 4, 28), cols[0], 0, .008, 0, Math.PI / 2, 0, 0, rx, rz, 1);
    return p; }
  // a stone hearth against a wall: a chimney breast of coursed stones to the ceiling, a timber lintel over an arched-back fire
  // opening, a mantel with odds on it, a hearthstone, firedogs and logs, flames (unlit, in the fire list) and a pot on a crane.
  // Local: the wall at z=0, the room towards +z, centred on x=0.
  function hearth(bw, ceil, n, seed) { const r = rng(seed || 23), p = Parts(), W = WOOD[n] || WOOD.gatelands, dep = .62, ow = bw * .55, oh = .62, ld = .45;
    const stone = () => jit(STONE, r, .12).offsetHSL((r() - .5) * .02, 0, 0);
    const course = (y0, h, x0, x1, zf, dz) => { let x = x0; const off = r() * .1; x += off - .1; while (x < x1 - .02) { const L = Math.min(x1 - x, .22 + r() * .22), lx = Math.max(x, x0);
        const w = Math.min(x + L, x1) - lx; if (w > .03) p(SK.rbox(w - .012, h - .014, dz - .01, .02, 1), stone(), lx + w / 2, y0 + h / 2, zf - dz / 2 + (r() - .5) * .012); x += L; } };
    let y = 0; while (y < oh + .01) { const h = .15 + r() * .05; course(y, h, -bw / 2, -ow / 2, dep, dep); course(y, h, ow / 2, bw / 2, dep, dep); y += h; }
    p(SK.rbox(ow + .5, .17, .22, .02, 1), jit(W.dark, r, .03), 0, oh + .085, dep - .11);
    p(SK.rbox(bw + .16, .05, .26, .012, 1), jit(W.wood, r), 0, oh + .19, dep + .02 - .13 + .02);
    y = oh; const top = Math.min(ceil, oh + .62); while (y < top - .02) { const h = Math.min(top - y, .16 + r() * .05); { const zf = dep - (y < oh + .2 ? .22 : 0); course(y, h, -bw / 2, bw / 2, zf, zf); } y += h; }
    if (ceil > top + .05) { p(SK.rbox(bw * .84, ceil - top + .02, dep - .1, .03, 1), jit(n === 'mark' ? 0x7a746c : 0xd6ccb6, r, .03), 0, (top + ceil) / 2, (dep - .1) / 2);
      p(SK.rbox(bw * .9, .06, dep - .04, .015, 1), jit(STONE, r, .06), 0, top + .01, (dep - .04) / 2); }
    p(SK.rbox(ow, oh, .04, .01, 1), SOOT, 0, oh / 2, .03); for (const s of [-1, 1]) p(SK.rbox(.04, oh, ld, .01, 1), SOOT, s * (ow / 2 - .02), oh / 2, .03 + ld / 2);
    p(SK.rbox(ow, .04, ld + .05, .01, 1), 0x1c1510, 0, oh - .02, .05 + ld / 2);
    p(SK.rbox(bw + .1, .035, .34, .015, 1), jit(0x6e6860, r, .06), 0, .0175, dep + .17);
    for (const s of [-1, 1]) { p(SK.rbox(.02, .12, .02, .004, 1), IRON, s * .15, .06, dep - .15); p(SK.rbox(.02, .02, .3, .004, 1), IRON, s * .15, .1, dep - .3); }
    p(SK.limb(.5, .05, .045), 0x5a3a20, -.25, .16, dep - .3, 0, 0, Math.PI / 2 + .12);
    p(SK.limb(.46, .045, .04), 0x4a3018, .2, .19, dep - .28, 0, .3, -Math.PI / 2 + .1);
    p(SK.ball(.14, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0x3a1a0c, 0, .02, dep - .3, 0, 0, 0, 1.6, .35, 1);
    p.flame(SK.ball(.12, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0xff5a18, 0, .06, dep - .3, 0, 0, 0, 1.4, .3, .9);
    for (const [fx, fh, fr, c] of [[0, .32, .07, 0xffb040], [-.1, .22, .05, 0xff8a28], [.11, .25, .055, 0xff9a30], [.02, .16, .09, 0xff6a20]]) p.flame(SK.cone(fr, fh, 6), c, fx, .2 + fh / 2, dep - .3 + (r() - .5) * .06);
    p(SK.cyl(.012, .012, oh - .06, 6), IRON, ow / 2 - .08, (oh - .06) / 2, dep - .12); p(SK.rbox(.34, .018, .018, .004, 1), IRON, ow / 2 - .25, oh - .12, dep - .12);
    p(SK.cyl(.004, .004, .05, 4), IRON, ow / 2 - .4, oh - .1, dep - .12);
    p(lathe([[.001, 0], [.06, .005], [.1, .05], [.105, .09], [.085, .14], [.09, .15], [.08, .15]], 12), 0x1e1c1a, ow / 2 - .4, oh - .3, dep - .12);
    p(SK.torus(.08, .005, 4, 12, Math.PI), IRON, ow / 2 - .4, oh - .16, dep - .12);
    const onM = oh + .215;
    p(lathe([[.001, 0], [.04, 0], [.05, .06], [.045, .12], [.03, .15], [.034, .17], [.001, .17]], 10), 0x9a6a3a, -bw / 2 + .2, onM, dep - .02);
    candle(p, -bw / 2 + .45, onM, dep - .02); candle(p, bw / 2 - .35, onM, dep - .02);
    p(SK.cyl(.1, .09, .012, 14), 0x8a8478, .05, onM + .1, dep - .08, -1.3);
    return p; }
  // a bar counter: a panelled front on a plinth, a thick top with a rounded nosing, a brass foot rail. Front towards +z.
  function counter(len, n, seed, bare) { const r = rng(seed || 29), p = Parts(), W = WOOD[n] || WOOD.gatelands, h = .69, d = .7;
    p(SK.rbox(len, .06, d + .1, .025, 2), jit(W.wood, r), 0, h - .03, .03);
    p(SK.rbox(len - .06, .07, d - .06, .01, 1), W.dark, 0, .035, 0);
    p(SK.rbox(len - .08, h - .13, d - .12, .01, 1), jit(W.dark, r, .03).multiplyScalar(.85), 0, .07 + (h - .13) / 2, -.02);
    const np = Math.max(2, Math.round(len / .55)), pw = (len - .08) / np;
    for (let i = 0; i <= np; i++) p(SK.rbox(.06, h - .13, .03, .008, 1), jit(W.wood, r, .04), -len / 2 + .04 + pw * i, .07 + (h - .13) / 2, d / 2 - .03);
    for (const yy of [.1, h - .09]) p(SK.rbox(len - .08, .05, .03, .008, 1), jit(W.wood, r, .04), 0, yy, d / 2 - .03);
    for (let i = 0; i < np; i++) { const cx = -len / 2 + .04 + pw * (i + .5); p(SK.rbox(pw - .1, h - .32, .02, .02, 1), jit(W.wood, r, .05).multiplyScalar(.92), cx, .07 + (h - .13) / 2, d / 2 - .045); }
    for (const s of [-1, 1]) p(SK.rbox(.03, h - .06, d - .04, .008, 1), jit(W.wood, r), s * (len / 2 - .015), (h - .06) / 2, 0);
    p(SK.cyl(.012, .012, len - .2, 8), 0xa8843a, 0, .1, d / 2 + .12, 0, 0, Math.PI / 2);
    for (let i = 0; i < 4; i++) p(SK.rbox(.02, .1, .1, .004, 1), 0x8a6a2a, -len / 2 + .1 + (len - .2) * i / 3, .07, d / 2 + .07);
    if (!bare) { tankard(p, -len * .3, h, .1, 0x8a8478); tankard(p, -len * .3 + .1, h, .15, 0x7a6a4a); tankard(p, len * .25, h, .05, 0x8a8478);
    p(lathe([[.001, 0], [.05, 0], [.065, .06], [.06, .13], [.035, .18], [.04, .21], [.001, .21]], 10), 0x7a5a38, len * .1, h, .12); }
    return p; }
  // a cask on a cradle, lying, with a tap
  function cask(n, seed) { const r = rng(seed || 31), p = Parts(), W = WOOD[n] || WOOD.gatelands, R = .2, L = .5;
    const prof = []; for (let i = 0; i <= 8; i++) { const u = i / 8; prof.push([R * (.86 + .14 * Math.sin(Math.PI * u)), L * u - L / 2]); }
    p(lathe(prof, 14), jit(W.wood, r), 0, R + .08, 0, 0, 0, Math.PI / 2);
    for (const u of [.12, .35, .65, .88]) p(SK.torus(R * (.86 + .14 * Math.sin(Math.PI * u)) + .004, .01, 4, 16), IRON, L * u - L / 2, R + .08, 0, 0, Math.PI / 2, 0);
    for (const s of [-1, 1]) p(new THREE.CircleGeometry(R * .85, 14), jit(W.dark, r), s * L / 2, R + .08, 0, 0, s * Math.PI / 2, 0);
    p(SK.cyl(.012, .012, .08, 6), 0x8a6a2a, L / 2 + .04, R + .02, 0, 0, 0, Math.PI / 2); p(SK.cyl(.01, .01, .05, 6), 0x8a6a2a, L / 2 + .07, R - .01, 0);
    for (const s of [-1, 1]) p(SK.rbox(.06, .12, R * 2 + .05, .01, 1), W.dark, s * L * .3, .06, 0);
    return p; }
  // a tall dresser against the back wall: uprights, three shelves of bottles, jugs and standing plates
  function dresser(w, n, seed) { const r = rng(seed || 37), p = Parts(), W = WOOD[n] || WOOD.gatelands, H = 1.62;
    for (const x of [-w / 2 + .03, 0, w / 2 - .03]) p(SK.rbox(.05, H, .3, .01, 1), jit(W.wood, r), x, H / 2, .15);
    p(SK.rbox(w + .08, .06, .34, .015, 1), W.dark, 0, H + .03, .17);
    [.2, .74, 1.12, 1.49].forEach((y, i) => { p(SK.rbox(w, .03, .28, .008, 1), jit(W.wood, r), 0, y, .15);
      if (i > 0) for (const sx of [-1, 1]) { const q = shelf(w / 2 - .06, n, seed * 7 + i * 2 + sx, i === 1 ? 'mixed' : 'bottles'), m = M(sx * w / 4, y, .02);
        for (const e of q.list) if (e[2].elements[13] > .005) p.list.push([e[0], e[1], m.clone().multiply(e[2])]); } });
    for (let i = 0; i < 3; i++) p(SK.cyl(.1, .09, .012, 14), jit(0xc8b89a, r, .04), -w / 2 + .2 + i * .22, .33, .04, -1.35);
    return p; }
  // ── S289: the smithy (the shops' kit, Michael's A on #46) ──
  // a coursed-stone forge with a coal bed, a hood and a chimney to the ceiling, and a bellows on a trestle. Local: centred,
  // the back (the chimney) towards −z.
  function forge(ceil, n, seed) { const r = rng(seed || 51), p = Parts(), W = WOOD[n] || WOOD.gatelands, bw = 1.8, bd = 1.6, bh = .74;
    const stone = () => jit(STONE, r, .12).multiplyScalar(.85);
    p(SK.rbox(bw - .1, bh - .02, bd - .1, .03, 1), 0x4a4440, 0, bh / 2, 0);
    let y = 0; while (y < bh - .02) { const h = Math.min(bh - y, .13 + r() * .05);
      for (const [ax, len, off] of [['x', bw, bd / 2], ['x', bw, -bd / 2], ['z', bd - .1, bw / 2], ['z', bd - .1, -bw / 2]]) { let t = -len / 2 - r() * .1;
        while (t < len / 2 - .03) { const a = Math.max(t, -len / 2), L = Math.min(len / 2 - a, .2 + r() * .2); if (L > .04) { const c = a + L / 2, o = off - Math.sign(off) * .05;
            if (ax === 'x') p(SK.rbox(L - .012, h - .012, .11, .02, 1), stone(), c, y + h / 2, o); else p(SK.rbox(.11, h - .012, L - .012, .02, 1), stone(), o, y + h / 2, c); } t = a + L; } }
      y += h; }
    p(SK.rbox(bw + .06, .06, bd + .06, .02, 1), jit(0x6e6860, r, .05), 0, bh + .03, 0);
    p(SK.rbox(.95, .07, .75, .02, 1), IRON, 0, bh + .09, .15);
    p(SK.ball(.34, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0x1a1210, 0, bh + .11, .15, 0, 0, 0, 1.25, .32, 1);
    p.flame(SK.ball(.3, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0xff5a18, 0, bh + .12, .15, 0, 0, 0, 1.15, .3, .95);
    for (const [fx, fz, fh, c] of [[0, .15, .16, 0xffa030], [-.18, .05, .1, 0xff7a20], [.16, .25, .12, 0xff8a28]]) p.flame(SK.cone(.05, fh, 6), c, fx, bh + .15 + fh / 2, fz);
    const hy = bh + .62, top = Math.max(hy + .6, ceil);
    p(lathe([[.001, .5], [.34, .5], [.8, 0], [.76, 0], [.3, .46], [.001, .46]], 4), jit(0x3a3432, r, .05), 0, hy, -.2, 0, Math.PI / 4, 0);
    for (const s of [-1, 1]) p(SK.rbox(.08, .64, .08, .02, 1), jit(W.dark, r, .04), s * .5, bh + .32, -.62);
    p(SK.rbox(.5, top - hy - .45, .5, .03, 1), jit(0x5a4a42, r, .06), 0, (hy + .45 + top) / 2, -.2);
    const bx = bw / 2 + .45, by = .52;
    for (const s of [-1, 1]) p(SK.cyl(.02, .024, by, 6), jit(W.dark, r, .04), bx + s * .22, by / 2, .05);
    p(SK.rbox(.55, .04, .12, .01, 1), W.dark, bx, by, .05);
    p(SK.ball(.24, 12, 6), 0x4a3020, bx, by + .1, .05, 0, 0, 0, 1.5, .3, .8);
    for (const dy of [.03, .17]) p(SK.rbox(.72, .025, .36, .03, 1), jit(W.wood, r), bx - .02, by + dy, .05);
    p(SK.cyl(.028, .018, .34, 8), IRON, bx - .5, by + .1, .05, 0, 0, Math.PI / 2);
    p(SK.cyl(.012, .012, .3, 6), W.dark, bx + .45, by + .2, .05, 0, 0, Math.PI / 2 - .4);
    return p; }
  // an anvil on a stump, a hammer on its face; the horn towards +x
  function anvil(n, seed) { const r = rng(seed || 53), p = Parts(), W = WOOD[n] || WOOD.gatelands, A = 0x34343a, st = .42;
    p(SK.bumpy(SK.cyl(.24, .28, st, 12, 4), .012, 17, (seed || 3) % 7), jit(0x5a3e26, r, .04), 0, st / 2, 0);
    p(SK.cyl(.236, .236, .012, 12), 0x9a7a52, 0, st + .002, 0);
    p(SK.rbox(.34, .05, .2, .012, 1), A, 0, st + .025, 0);
    p(SK.rbox(.18, .1, .12, .015, 1), A, 0, st + .1, 0);
    p(SK.rbox(.44, .08, .17, .015, 1), 0x4c4c54, 0, st + .19, 0);
    p(SK.cone(.075, .28, 10), A, .36, st + .19, 0, 0, 0, -Math.PI / 2, 1, 1, .8);
    p(SK.rbox(.1, .06, .12, .015, 1), A, -.25, st + .2, 0);
    p(SK.cyl(.013, .016, .32, 6), jit(W.wood, r), -.02, st + .25, .02, 0, .5, Math.PI / 2);
    p(SK.rbox(.05, .045, .11, .01, 1), IRON, -.13, st + .255, -.04, 0, .5, 0);
    return p; }
  // a quench tub of staves and hoops, water to near the rim
  function tub(n, seed) { const r = rng(seed || 55), p = Parts(), W = WOOD[n] || WOOD.gatelands, R = .3, h = .42;
    p(lathe([[.001, 0], [R * .88, 0], [R, h], [R - .03, h], [R * .88 - .03, .03], [.001, .03]], 16), jit(W.wood, r), 0, 0, 0);
    for (const u of [.15, .85]) p(SK.torus(R * (.88 + .12 * u) + .006, .01, 4, 18), IRON, 0, h * u, 0, Math.PI / 2);
    p(new THREE.CircleGeometry(R - .035, 16), 0x2a3a40, 0, h - .05, 0, -Math.PI / 2);
    p(SK.cyl(.008, .008, .5, 5), IRON, .1, h + .02, 0, 0, 0, .9);
    return p; }
  // a weapon rack against the wall (the wall at −z, the rack facing +z): uprights, a slotted foot rail and a top rail, and
  // the weapon kit's own pieces standing in it, blades down, hafted heads up
  function rack(n, seed, kinds) { const r = rng(seed || 57), p = Parts(), W = WOOD[n] || WOOD.gatelands, w = .86;
    for (const s of [-1, 1]) p(SK.rbox(.06, .9, .06, .015, 1), jit(W.dark, r, .04), s * (w / 2 - .03), .45, .06);
    p(SK.rbox(w, .06, .16, .015, 1), jit(W.wood, r), 0, .12, .1); p(SK.rbox(w, .05, .06, .012, 1), jit(W.wood, r), 0, .7, .06);
    p(SK.rbox(w, .04, .04, .01, 1), W.dark, 0, .88, .06);
    (kinds || []).forEach((k, i) => { if (typeof wpnBuild !== 'function') return; const parts = wpnBuild(k, false, null), bb = new THREE.Box3();
      for (const q of parts) { q.geo.computeBoundingBox(); bb.union(q.geo.boundingBox); }
      const down = /sword|cutlass|claymore|dagger/.test(k), x = -w / 2 + .16 + (w - .32) * (kinds.length > 1 ? i / (kinds.length - 1) : .5);
      const y = down ? .15 + bb.max.y : .15 - bb.min.y;
      for (const q of parts) p(q.geo, 0xffffff, x, y, .12, down ? Math.PI : 0, (r() - .5) * .5, (r() - .5) * .06); });
    return p; }
  // a grindstone on a trestle, a trough under it and a crank; the axle along x
  function grindstone(n, seed) { const r = rng(seed || 59), p = Parts(), W = WOOD[n] || WOOD.gatelands, R = .3, cy = .5;
    for (const s of [-1, 1]) { p(SK.rbox(.05, .12, .8, .015, 1), jit(W.wood, r), s * .14, cy - .1, 0);
      for (const t of [-1, 1]) p(SK.cyl(.022, .026, cy - .06, 6), jit(W.dark, r, .04), s * .17, (cy - .06) / 2, t * .32, t * .12, 0, s * -.12); }
    p(SK.rbox(.2, .1, .5, .02, 1), jit(W.dark, r, .03), 0, cy - .26, 0);
    p(SK.cyl(R, R, .09, 22), jit(0xa09a8a, r, .06), 0, cy + .1, 0, 0, 0, Math.PI / 2);
    p(SK.cyl(.018, .018, .44, 6), IRON, 0, cy + .1, 0, 0, 0, Math.PI / 2);
    p(SK.rbox(.02, .16, .02, .005, 1), IRON, .23, cy + .03, 0); p(SK.cyl(.016, .016, .1, 6), W.dark, .27, cy - .04, 0, 0, 0, Math.PI / 2);
    return p; }
  function smithy(W, D, H, n, seed) { const p = Parts(), s = seed || 1;
    p.put(forge(H, n, s + 1), 1.2, 1.4, 0);
    p.put(anvil(n, s + 2), W - 2.0, 1.6, .3);
    p.put(tub(n, s + 3), W - 1.0, 3.2, 0);
    const R = [['sword', 'longsword', 'claymore'], ['axe', 'greataxe', 'warhammer'], ['mace', 'flail', 'greatclub'], ['cutlass', 'dagger', 'sword']];
    for (let k = 0; k < 4; k++) p.put(rack(n, s + 10 + k, R[k]), W - .1, Math.min(4.1 + k * .95, D - 3.8 - (3 - k) * .95), -Math.PI / 2);
    p.put(grindstone(n, s + 4), 2.6, D - 2.4, 0);
    if (typeof wpnBuild === 'function') for (const q of wpnBuild('dagger', false, null)) p(q.geo, 0xffffff, W / 2 - 1.2, .72, 3.0, 0, .3, Math.PI / 2);
    return p; }
  // ── S290: the armourer, the apothecary and the general goods (the shops' kit, Michael's A on #46) ──
  // a crate of planks between corner battens, s across (the interiors' _intCrate)
  function crate(s, n, seed) { const r = rng(seed || 61), p = Parts(), W = WOOD[n] || WOOD.gatelands, k = 3, pw = (s - .06) / k;
    p(SK.rbox(s - .03, s - .03, s - .03, .01, 1), 0x2a1c10, 0, s / 2, 0);
    for (const [ax, sg] of [['x', 1], ['x', -1], ['z', 1], ['z', -1]]) for (let i = 0; i < k; i++) { const y = .03 + pw * (i + .5);
      if (ax === 'x') p(SK.rbox(.02, pw - .008, s - .08, .006, 1), jit(W.pale, r, .08), sg * (s / 2 - .01), y, 0); else p(SK.rbox(s - .08, pw - .008, .02, .006, 1), jit(W.pale, r, .08), 0, y, sg * (s / 2 - .01)); }
    for (let i = 0; i < k; i++) p(SK.rbox(s - .08, .02, pw - .008, .006, 1), jit(W.pale, r, .08), 0, s - .01, -s / 2 + .03 + pw * (i + .5));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p(SK.rbox(.05, s, .05, .008, 1), jit(W.wood, r, .05), sx * (s / 2 - .02), s / 2, sz * (s / 2 - .02));
    return p; }
  // an armour stand: a cross-footed post, a shoulder bar, and on it a cuirass (plate, leather or mail) with pauldrons and a helm
  function armourStand(kind, n, seed) { const r = rng(seed || 63), p = Parts(), W = WOOD[n] || WOOD.gatelands, y0 = .5;
    p(SK.cyl(.025, .03, 1.12, 8), jit(W.dark, r, .04), 0, .56, 0);
    for (const a of [0, Math.PI / 2]) p(SK.rbox(.5, .05, .07, .015, 1), jit(W.wood, r), 0, .025, 0, 0, a, 0);
    const col = { plate: 0x8a8a94, leather: 0x6a4a2a, mail: 0x7a7a84 }[kind] || 0x8a8a94, band = kind === 'leather' ? 0x3a2414 : 0x5a5a62;
    const torso = lathe([[.001, 0], [.16, 0], [.18, .07], [.19, .18], [.205, .3], [.19, .38], [.12, .44], [.07, .46], [.001, .46]], 14);
    p(kind === 'mail' ? SK.bumpy(torso, .004, 60, 3) : torso, col, 0, y0, 0, 0, 0, 0, 1, 1, .7);
    if (kind === 'mail') p(SK.cyl(.17, .21, .22, 14, 1, true), col, 0, y0 - .1, 0, 0, 0, 0, 1, 1, .72);
    else for (const t of [.06, .18]) p(SK.cyl(.185 + t * .08, .18 + t * .08, .025, 14), band, 0, y0 + t, 0, 0, 0, 0, 1, 1, .72);
    p(SK.rbox(.46, .04, .05, .012, 1), jit(W.dark, r, .04), 0, y0 + .43, 0);
    for (const sx of [-1, 1]) p(SK.ball(.1, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), col, sx * .19, y0 + .41, 0, 0, 0, sx * -.5, 1, .8, 1);
    if (kind === 'leather') { p(SK.ball(.1, 12, 8, 0, Math.PI * 2, 0, Math.PI * .55), col, 0, y0 + .56, 0); p(SK.torus(.098, .01, 4, 16), band, 0, y0 + .57, 0, Math.PI / 2); }
    else { p(SK.ball(.105, 12, 8, 0, Math.PI * 2, 0, Math.PI * .6), 0x9a9aa4, 0, y0 + .55, 0); p(SK.rbox(.02, .1, .02, .005, 1), 0x9a9aa4, 0, y0 + .52, .1);
      p(SK.torus(.1, .008, 4, 16), 0x6a6a72, 0, y0 + .52, 0, Math.PI / 2); }
    return p; }
  // a shield hung on the wall (the wall at −z): the weapon kit's round, kite or tower shield, faced out, on a peg
  function wallShield(kind, face, seed) { const p = Parts();
    if (typeof wpnBuild === 'function') for (const q of wpnBuild(kind, false, { face })) p(q.geo, 0xffffff, 0, 0, .05, 0, -Math.PI / 2, 0, 1.35, 1.35, 1.35);
    p(SK.cyl(.012, .012, .08, 6), IRON, 0, .2, .03, Math.PI / 2);
    return p; }
  // a bench with a roll of leather, rivets in a dish and a mallet
  function armourBench(n, seed) { const r = rng(seed || 65), p = Parts(), W = WOOD[n] || WOOD.gatelands;
    p.put(table(1.4, .6, n, seed), 0, 0, 0);
    for (let k = 0; k < 3; k++) p(SK.cyl(.06, .06, .5, 12), jit([0x6a4a2a, 0x5a3a1c, 0x8a6a3a][k], r, .05), -.35 + k * .2, .52, 0, Math.PI / 2, .2 * (k - 1), 0);
    p(lathe([[.001, 0], [.07, 0], [.08, .02], [.075, .025], [.001, .01]], 10), 0x7a6a4a, .35, .46, .1);
    for (let k = 0; k < 6; k++) p(SK.ball(.012, 6, 4), 0x9a9aa4, .33 + (r() - .5) * .08, .475, .1 + (r() - .5) * .08);
    p(SK.cyl(.012, .012, .26, 6), W.wood, .45, .475, -.12, 0, .4, Math.PI / 2); p(SK.cyl(.035, .035, .1, 8), W.dark, .36, .48, -.17, 0, .4, 0);
    return p; }
  // a bundle of herbs hung from the ceiling on a string, drying head down
  function herbBundle(len, seed) { const r = rng(seed || 67), p = Parts(), g = [0x4a6a2a, 0x5a7a3a, 0x6a6a3a, 0x7a5a3a][Math.floor(r() * 4)];
    p(SK.cyl(.003, .003, len, 4), 0xc8b89a, 0, -len / 2, 0);
    p(SK.bumpy(SK.cone(.09, .32, 7, 3), .02, 21, seed % 9), jit(g, r, .08), 0, -len - .16, 0, Math.PI);
    p(SK.torus(.03, .008, 4, 8), 0xc8b89a, 0, -len, 0, Math.PI / 2);
    for (let k = 0; k < 5; k++) p(SK.cyl(.004, .004, .12, 4), 0x5a4a2a, (r() - .5) * .04, -len + .05, (r() - .5) * .04);
    return p; }
  // the apothecary's still: an iron cauldron on three legs over a small fire, its brew glowing, and a copper alembic beside it
  function still(n, seed) { const r = rng(seed || 69), p = Parts();
    p(lathe([[.001, 0], [.2, .02], [.32, .14], [.34, .28], [.3, .38], [.31, .4], [.28, .4], [.27, .37], [.001, .37]], 16), 0x2a2a2e, 0, .22, 0);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; p(SK.cyl(.02, .015, .28, 6), 0x2a2a2e, Math.sin(a) * .22, .12, Math.cos(a) * .22, Math.cos(a) * .25, 0, -Math.sin(a) * .25); }
    p(SK.torus(.3, .012, 4, 16, Math.PI), IRON, 0, .62, 0, 0, 0, 0);
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; p(SK.rbox(.12, .06, .08, .02, 1), jit(STONE, r, .1), Math.sin(a) * .26, .03, Math.cos(a) * .26, 0, a, 0); }
    p.flame(new THREE.CircleGeometry(.27, 16), 0x60ff90, 0, .585, 0, -Math.PI / 2);
    p.flame(SK.cone(.08, .14, 6), 0xff8a28, 0, .09, 0); p.flame(SK.cone(.05, .1, 6), 0xffb040, .06, .07, .03);
    const cx = .62, CU = 0xb8743a;
    p(lathe([[.001, 0], [.12, .01], [.16, .1], [.15, .2], [.06, .28], [.04, .34], [.001, .34]], 12), CU, cx, 0, 0);
    p(SK.torus(.2, .018, 6, 14, Math.PI * .6), CU, cx + .02, .32, 0, 0, 0, Math.PI * .1);
    p(lathe([[.001, 0], [.07, 0], [.08, .2], [.05, .24], [.001, .24]], 10), CU, cx + .38, 0, 0);
    return p; }
  // a balance on the counter: a post on a foot, a beam, two pans hung on cords
  function scales(seed) { const p = Parts(), B = 0xa8843a;
    p(lathe([[.001, 0], [.07, 0], [.07, .015], [.015, .03], [.012, .3], [.02, .31], [.001, .32]], 10), B, 0, 0, 0);
    p(SK.cyl(.008, .008, .4, 6), B, 0, .3, 0, 0, 0, Math.PI / 2);
    for (const s of [-1, 1]) { for (const a of [0, 2.1, 4.2]) p(SK.cyl(.002, .002, .2, 3), 0x3a3020, s * .2 + Math.sin(a) * .03, .2, Math.cos(a) * .03, Math.cos(a) * .15, 0, -Math.sin(a) * .15);
      p(lathe([[.001, 0], [.06, .005], [.075, .02], [.07, .022], [.001, .008]], 12), B, s * .2, .1, 0); }
    return p; }
  // a sack of grain or wool, tied at the neck
  function sack(seed, col) { const r = rng(seed || 71), p = Parts(), c = jit(col || 0xb8a070, r, .06);
    p(SK.bumpy(SK.ball(.24, 12, 9), .02, 11, seed % 7), c, 0, .22, 0, 0, r() * 6, 0, 1, 1.05, .9);
    p(SK.cyl(.06, .09, .1, 8), c, 0, .48, 0); p(SK.torus(.06, .012, 4, 10), 0x6a5a3a, 0, .47, 0, Math.PI / 2);
    p(SK.bumpy(SK.cone(.1, .1, 8), .01, 13, 2), c, 0, .56, 0);
    return p; }
  function armoury(W, D, H, n, seed) { const p = Parts(), s = seed || 1;
    ['plate', 'leather', 'mail'].forEach((k, i) => p.put(armourStand(k, n, s + i), 1.6 + i * 1.6, 1.6, 0));
    const zEnd = D >= 9 ? D - 3.2 : D - 1.2;
    [0x7a2020, 0x203a6a, 0x6a5a20, 0x2a4a2a].forEach((c, k) => { const z = 3.8 + k * .75; if (z < zEnd - .35) p.put(wallShield(['round', 'kite', 'round', 'kite'][k], c, s + 5 + k), W - .02, z, -Math.PI / 2, 1.0); });
    p.put(armourBench(n, s + 9), W - 1.6, 1.6, 0);
    return p; }
  function apothecary(W, D, H, n, seed) { const p = Parts(), s = seed || 1;
    [.62, .99, 1.36].forEach((y, i) => p.put(shelf(W - 1.6, n, s + i, 'potions'), W / 2, 0, 0, y));
    for (let x = 1.5, k = 0; x < W - 1; x += 1.2, k++) p.put(herbBundle(.3 + (k % 3) * .08, s + 10 + k), x, D * .55, 0, H);
    p.put(still(n, s + 4), W - 1.6, 1.8, 0);
    p(lathe([[.001, 0], [.07, 0], [.08, .06], [.07, .1], [.05, .1], [.04, .03], [.001, .03]], 12), 0x8a8478, W / 2 + 1.2, .69, 3.0);
    p(SK.cyl(.012, .016, .16, 6), 0x9a8a70, W / 2 + 1.22, .79, 3.0, 0, 0, .5);
    return p; }
  function goods(W, D, H, n, seed) { const p = Parts(), s = seed || 1;
    for (let k = 0; k < 3; k++) p.put(crate(.5, n, s + k), 1.0 + k * .9, 1.0, (k - 1) * .15);
    p.put(crate(.45, n, s + 3), 1.45, 1.0, .3, .5);
    for (let k = 0; k < 3; k++) p.put(sack(s + 4 + k, [0xb8a070, 0x9a8a60, 0xc0b080][k]), W - 1.0 - k * .8, D - 3.9, k * .7);
    [.62, 1.05].forEach((y, i) => p.put(shelf(W - 2, n, s + 8 + i, 'mixed'), W / 2, 0, 0, y));
    p.put(scales(s + 11), W / 2 + 1.4, 3.0, 0, .69);
    return p; }
  // ── S512: the barber and dyer (Michael's B on #144), from the Session 505 prototype ──
  const BRASS = 0xc8a048, LINEN = 0xe4dccb, STEEL = 0xb8c0c4, PLUSH = 0x6a2a1e;
  const basin = (R, d) => lathe([[.001, -d], [R * .55, -d], [R * .8, -d * .55], [R * .95, -.004], [R * 1.12, 0], [R * 1.12, .006], [R * .93, .002], [R * .78, -d * .5], [R * .5, -d + .006], [.001, -d + .006]], 16);
  // the barber's chair: a high-backed armchair padded in red, a headrest on an iron stem, a footrest bar (the back at −z)
  function barberChair(n, seed) { const r = rng(seed || 75), p = Parts(), W = WOOD[n] || WOOD.gatelands, sh = .3, sw = .4, sd = .36;
    const rb = (w, h, d, q) => SK.rbox(w, h, d, q == null ? Math.min(.012, w / 3, h / 3, d / 3) : q, 1);
    p(rb(sw, .05, sd, .015), PLUSH, 0, sh, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p(SK.cyl(.022, .026, sh, 8), jit(W.wood, r), sx * (sw / 2 - .03), sh / 2, sz * (sd / 2 - .03));
    for (const sx of [-1, 1]) { p(rb(.05, .03, sd + .04), jit(W.dark, r), sx * (sw / 2 - .01), sh + .2, .01); p(SK.cyl(.016, .016, .2, 6), jit(W.wood, r), sx * (sw / 2 - .02), sh + .1, sd / 2 - .04); }
    p(rb(sw, .5, .04, .015), jit(W.wood, r), 0, sh + .25, -sd / 2 + .02, -.18, 0, 0);
    p(rb(sw - .08, .36, .03, .012), PLUSH, 0, sh + .26, -sd / 2 + .055, -.18, 0, 0);
    p(SK.cyl(.012, .012, .2, 6), IRON, 0, sh + .58, -sd / 2 - .03, -.18, 0, 0);
    p(rb(.2, .08, .05, .02), PLUSH, 0, sh + .68, -sd / 2 - .045, -.18, 0, 0);
    p(rb(sw - .04, .025, .07), jit(W.dark, r), 0, .08, sd / 2 + .1); for (const sx of [-1, 1]) p(rb(.025, .025, .14), jit(W.dark, r), sx * (sw / 2 - .04), .08, sd / 2 + .04);
    return p; }
  // the washstand: three turned legs, two rings, a brass basin, a ewer and a towel
  function washstand(n, seed) { const r = rng(seed || 77), p = Parts(), W = WOOD[n] || WOOD.gatelands, h = .42;
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; p(SK.cyl(.012, .015, h, 6), jit(W.wood, r), Math.cos(a) * .12, h / 2, Math.sin(a) * .12, Math.sin(a) * .08, 0, -Math.cos(a) * .08); }
    p(SK.torus(.13, .012, 6, 20), jit(W.dark, r), 0, h, 0, Math.PI / 2, 0, 0); p(SK.torus(.1, .008, 6, 16), jit(W.dark, r), 0, .12, 0, Math.PI / 2, 0, 0);
    p(basin(.13, .06), BRASS, 0, h + .01, 0);
    p(lathe([[.001, 0], [.04, 0], [.05, .05], [.035, .1], [.025, .14], [.032, .17], [.001, .17]], 12), 0xb0a080, 0, .13, 0);
    p(SK.rbox(.02, .12, .1, .006, 1), LINEN, .145, h - .05, 0);
    return p; }
  // the mirror: polished steel in a carved oval frame (the wall at z 0, the glass facing +z, its middle at y 0)
  function barberMirror(n, seed) { const r = rng(seed || 79), p = Parts(), W = WOOD[n] || WOOD.gatelands;
    p(SK.cyl(.16, .16, .01, 24), STEEL, 0, 0, .02, Math.PI / 2, 0, 0, 1, 1, 1.35);
    p(SK.torus(.17, .02, 8, 28), jit(W.dark, r), 0, 0, .025, 0, 0, 0, 1, 1.35, 1);
    p(SK.ball(.025, 8, 6), BRASS, 0, .26, .03); return p; }
  // the barber-surgeon's bench (the wall at −z): razors, shears, folded towels, a jar of leeches, a strop on a peg
  function barberBench(n, seed) { const r = rng(seed || 81), p = Parts(), W = WOOD[n] || WOOD.gatelands; p.put(table(.9, .4, n, seed), 0, 0, 0);
    p(SK.rbox(.07, .015, .02, .005, 1), STEEL, -.25, .475, .05); p(SK.rbox(.08, .012, .025, .005, 1), 0x3a2a1a, -.17, .475, .04, 0, .4, 0);
    for (const sx of [-1, 1]) p(SK.rbox(.1, .008, .012, .003, 1), STEEL, sx * .01, .472, -.05, 0, sx * .25, 0);
    for (let k = 0; k < 3; k++) p(SK.rbox(.14, .025, .1, .01, 1), k % 2 ? LINEN : 0xd8d0b8, .25, .47 + k * .026, .02);
    p(lathe([[.001, 0], [.04, 0], [.045, .08], [.035, .1], [.04, .11], [.001, .11]], 12), 0x8aa0a0, .38, .465, -.08);
    p(SK.rbox(.05, .4, .006, .002, 1), 0x5a3a20, -.4, .8, -.2); p(SK.cyl(.01, .01, .05, 6), W.dark, -.4, 1.0, -.2, Math.PI / 2, 0, 0);
    return p; }
  // the sign: three brass basins hung from an iron arm (the trade's sign before the striped pole); the wall at x 0, the arm out along +x
  function basinSign(seed) { const p = Parts(), L = .8;
    p(SK.rbox(L, .03, .03, .008, 1), IRON, L / 2, 0, 0); p(SK.rbox(.03, .3, .03, .008, 1), IRON, 0, -.1, 0);
    { const a = Math.atan2(.25, L * .7), len = Math.hypot(.25, L * .7); p(SK.rbox(len, .02, .02, .006, 1), IRON, L * .35, -.125, 0, 0, 0, a); }
    p(SK.torus(.05, .008, 6, 14, Math.PI * 1.5), IRON, L + .03, .03, 0);
    [.22, .44, .66].forEach((x, i) => { const y = -.12 - (i % 2) * .05; p(SK.rbox(.006, -y - .02, .006, .002, 1), 0x4a4440, x, y / 2, 0); p(basin(.11, .04), BRASS, x, y - .01, 0, Math.PI / 2 - .12, 0, 0); });
    return p; }
  // the dyer's corner: a vat on a ring of bricks with its paddle, hanks of dyed wool on a pole, folded bolts on a table
  function dyerCorner(n, seed) { const r = rng(seed || 83), p = Parts(), W = WOOD[n] || WOOD.gatelands, D = [0x7a2a1e, 0x3a4a6a, 0xb08a3a, 0x3a5a3a, 0x5a2a4a];
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; p(SK.rbox(.12, .12, .06, .01, 1), jit(0x8a4a30, r, .1), Math.cos(a) * .26, .06, Math.sin(a) * .26, 0, -a, 0); }
    p(lathe([[.001, .12], [.2, .12], [.26, .2], [.27, .42], [.29, .44], [.26, .44], [.25, .22], [.001, .22]], 18), 0x4a4440, 0, 0, 0);
    p(SK.cyl(.25, .25, .01, 18), 0x3a4a7a, 0, .41, 0); p(SK.rbox(.025, .6, .04, .008, 1), jit(W.pale, r), .12, .55, .02, 0, 0, -.5);
    p(SK.cyl(.012, .012, 1.3, 6), jit(W.dark, r), .75, .78, 0, 0, 0, Math.PI / 2); for (const x of [.15, 1.35]) p(SK.cyl(.015, .02, .78, 6), jit(W.wood, r), x, .39, 0);
    D.forEach((c, i) => { const x = .3 + i * .22; p(SK.cyl(.035, .03, .3, 8, 3), c, x, .62, 0); p(SK.torus(.03, .01, 5, 10), c, x, .78, 0); });
    p.put(table(1.1, .45, n, (seed || 83) + 1), 1.95, -.2, 0);
    D.forEach((c, i) => p(SK.rbox(.18, .07, .26, .02, 1), c, 1.6 + (i % 3) * .24, .5 + (i > 2 ? .07 : 0), -.2 + (i > 2 ? .02 : 0)));
    return p; }
  // the room (the back wall at z 0, the door at z D): the chair facing the mirror on the back wall, the washstand at its
  // right hand, a stool and a bench by the west wall for those waiting, the barber-surgeon's bench, a shelf of jars beside the
  // mirror, the dyer's corner along the back wall to the east
  function barber(W, D, H, n, seed) { const p = Parts(), s = seed || 1, cx = W * .36;
    p.put(rug(.95, .75, n, s + 1), cx, 1.45, 0);
    p.put(barberChair(n, s + 2), cx, 1.35, Math.PI);
    p.put(barberMirror(n, s + 3), cx, 0, 0, .95);
    p.put(washstand(n, s + 4), cx + .75, .7, 0);
    p.put(stool(n, s + 5), cx - .9, 2.4, 0);
    p.put(barberBench(n, s + 6), .3, 2.6, Math.PI / 2);
    p.put(dyerCorner(n, s + 7), W - 3.0, 1.0, 0);
    p.put(shelf(1.4, n, s + 8, 'potions'), cx - 1.45, 0, 0, 1.05);
    p.put(bench(1.6, n, s + 9), .35, D * .6, Math.PI / 2);
    return p; }
  // ── S291: the church and the keep's hall (Michael's A on #46: "the church, keep and guild halls in the same kit") ──
  // S303: the church's columns at W/2 ± 4.1 from z 5.5, between the pews' ends (W/2 ± 3.5) and the walls, clear of the dais
  // a pew facing −z: a seat plank, a panelled back with a top rail on the +z side, shaped bench ends and a kneeler
  function pew(len, n, seed) { const r = rng(seed || 73), p = Parts(), W = WOOD[n] || WOOD.gatelands, sh = .28;
    p(SK.rbox(len - .1, .04, .3, .012, 1), jit(W.wood, r), 0, sh, 0);
    p(SK.rbox(len - .1, .26, .03, .008, 1), jit(W.dark, r, .03), 0, sh + .16, .15);
    p(SK.rbox(len - .06, .04, .06, .012, 1), jit(W.wood, r), 0, sh + .3, .15);
    const e = new THREE.Shape(); e.moveTo(-.18, 0); e.lineTo(.2, 0); e.lineTo(.2, sh + .34); e.quadraticCurveTo(.2, sh + .42, .12, sh + .42); e.quadraticCurveTo(.02, sh + .36, -.02, sh + .08); e.lineTo(-.18, sh + .05); e.lineTo(-.18, 0);
    const eg = new THREE.ExtrudeGeometry(e, { depth: .04, bevelEnabled: true, bevelThickness: .008, bevelSize: .008, bevelSegments: 1, curveSegments: 6 });
    for (const sx of [-1, 1]) p(eg, jit(W.dark, r, .04), sx * (len / 2 - .02) - .02, 0, 0, 0, -Math.PI / 2, 0);
    p(SK.rbox(len - .14, .06, .12, .015, 1), jit(W.dark, r, .03), 0, .06, -.32);
    return p; }
  // a stone altar with a moulded top and foot, a white cloth and a runner, two candlesticks and a book on a stand
  function altar(n, seed) { const r = rng(seed || 75), p = Parts(), w = 2.2, d = .9, h = .8, ST = 0xb0aa9c;
    p(SK.rbox(w + .12, .06, d + .12, .02, 1), jit(ST, r, .04), 0, .03, 0);
    p(SK.rbox(w - .06, h - .14, d - .06, .02, 1), jit(ST, r, .04), 0, (h - .08) / 2 + .02, 0);
    for (const x of [-w / 3, 0, w / 3]) p(SK.rbox(w / 3 - .14, h - .3, .02, .03, 1), jit(ST, r, .06).multiplyScalar(.9), x, h / 2, d / 2 - .02);
    p(SK.rbox(w + .1, .07, d + .1, .025, 2), jit(ST, r, .03), 0, h - .035, 0);
    p(SK.rbox(w + .02, .012, d + .02, .005, 1), 0xece4d2, 0, h + .006, 0);
    p(SK.rbox(w * .95, .2, .012, .004, 1), 0xece4d2, 0, h - .09, d / 2 + .055);
    p(SK.rbox(.4, .012, d + .14, .005, 1), 0x8a2020, 0, h + .013, .0); p(SK.rbox(.4, .3, .012, .004, 1), 0x8a2020, 0, h - .14, d / 2 + .065);
    for (const sx of [-1, 1]) { p(lathe([[.001, 0], [.08, 0], [.08, .02], [.03, .05], [.02, .22], [.035, .25], [.04, .27], [.001, .27]], 10), 0xa8843a, sx * .8, h + .013, 0);
      p(SK.cyl(.018, .02, .16, 8), 0xe8e0c8, sx * .8, h + .36, 0); p.flame(SK.cone(.012, .045, 5), 0xffd070, sx * .8, h + .46, 0); }
    p(SK.rbox(.3, .03, .22, .005, 1), 0x5a2a1a, 0, h + .09, -.1, -.5); p(SK.rbox(.28, .015, .2, .005, 1), 0xe8dcc0, 0, h + .11, -.09, -.5);
    p(SK.rbox(.04, .08, .04, .01, 1), 0x4a3018, 0, h + .05, -.18);
    return p; }
  // a dais of stone: a riser of courses and a floor of flags, w × d, top at h
  function dais(w, d, h, seed) { const r = rng(seed || 77), p = Parts(), ST = 0x8a8680;
    p(SK.rbox(w - .04, h - .02, d - .04, .02, 1), jit(ST, r, .03).multiplyScalar(.85), 0, h / 2 - .01, 0);
    const nx = Math.max(2, Math.round(w / .7)), nz = Math.max(2, Math.round(d / .7));
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) p(SK.rbox(w / nx - .02, .03, d / nz - .02, .01, 1), jit(ST, r, .1), -w / 2 + w / nx * (i + .5), h - .012, -d / 2 + d / nz * (k + .5));
    p(SK.rbox(w + .04, .05, .1, .02, 1), jit(ST, r, .05), 0, h - .025, d / 2 - .03);
    return p; }
  // a pulpit: an eight-sided panelled drum on a turned stem, a book rest, and three steps up the back (towards −x)
  function pulpit(n, seed) { const r = rng(seed || 79), p = Parts(), W = WOOD[n] || WOOD.gatelands;
    p(lathe([[.001, 0], [.28, 0], [.28, .04], [.1, .08], [.08, .4], [.12, .45], [.34, .5], [.001, .5]], 8), jit(W.dark, r, .03), 0, 0, 0, 0, Math.PI / 8, 0);
    p(lathe([[.34, 0], [.36, .52], [.4, .56], [.36, .57], [.32, .56], [.3, .02]], 8), jit(W.wood, r), 0, .5, 0, 0, Math.PI / 8, 0);
    p(SK.rbox(.34, .02, .24, .005, 1), W.dark, .2, 1.05, 0, 0, 0, -.35);
    for (let k = 0; k < 3; k++) p(SK.rbox(.26, .04, .5, .01, 1), jit(W.wood, r), -.45 - k * .22, .45 - k * .15, 0);
    for (const sz of [-1, 1]) p(SK.rbox(.72, .04, .03, .008, 1), W.dark, -.62, .44, sz * .25, 0, 0, -.6);
    return p; }
  // a stone column, base and capital: floor to ceiling
  function column(h, R, seed) { const r = rng(seed || 81), p = Parts(), ST = 0x8a857a;
    p(lathe([[.001, 0], [R * 1.45, 0], [R * 1.45, .08], [R * 1.25, .12], [R * 1.2, .16], [R * 1.05, .2], [R, .24], [R * .92, h - .3], [R, h - .26], [R * 1.15, h - .2], [R * 1.4, h - .1], [R * 1.4, h], [.001, h]], 14), jit(ST, r, .04), 0, 0, 0);
    return p; }
  // a banner hung from a pole under a column's capital: cloth with a fringe and a device
  function banner(col, seed) { const r = rng(seed || 83), p = Parts();
    p(SK.cyl(.02, .02, 1.3, 6), 0x3a2a18, 0, 0, 0, 0, 0, Math.PI / 2);
    p(SK.rbox(1.1, 2.4, .02, .01, 1), jit(col, r, .03), 0, -1.22, 0);
    const pt = new THREE.Shape(); pt.moveTo(-.55, 0); pt.lineTo(.55, 0); pt.lineTo(0, -.35); pt.lineTo(-.55, 0);
    p(new THREE.ShapeGeometry(pt), jit(col, r, .03), 0, -2.42, 0); p(new THREE.ShapeGeometry(pt), jit(col, r, .03), 0, -2.42, 0, 0, Math.PI, 0);
    p(SK.rbox(.5, .5, .025, .01, 1), 0xd8b848, 0, -1.0, 0, 0, 0, Math.PI / 4);
    for (const sx of [-1, 1]) p(SK.ball(.03, 6, 5), 0xa8843a, sx * .66, 0, 0);
    return p; }
  // a throne: carved seat and arms, a tall back with a pointed crest and finials, a red cushion; facing +z
  function throne(n, seed) { const r = rng(seed || 85), p = Parts(), W = WOOD[n] || WOOD.gatelands, sh = .42, sw = .8;
    p(SK.rbox(sw, .3, .6, .02, 1), jit(W.dark, r, .03), 0, .15, 0);
    p(SK.rbox(sw - .04, .06, .56, .02, 2), 0x7a1a1a, 0, sh - .06, .02);
    p(SK.rbox(sw, 1.1, .08, .02, 1), jit(W.dark, r, .03), 0, .3 + .55, -.26);
    for (let i = 0; i < 4; i++) p(SK.rbox(.12, .75, .02, .02, 1), jit(W.wood, r, .05), -.27 + i * .18, .72, -.215);
    const c = new THREE.Shape(); c.moveTo(-sw / 2, 0); c.lineTo(sw / 2, 0); c.quadraticCurveTo(sw / 4, .06, 0, .32); c.quadraticCurveTo(-sw / 4, .06, -sw / 2, 0);
    p(new THREE.ExtrudeGeometry(c, { depth: .08, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 1, curveSegments: 8 }), jit(W.dark, r, .03), 0, 1.4, -.3);
    p(SK.ball(.04, 8, 6), 0xd8b848, 0, 1.74, -.26);
    for (const sx of [-1, 1]) { p(SK.rbox(.08, .3, .56, .02, 1), jit(W.dark, r, .03), sx * (sw / 2 + .02), sh + .12, 0);
      p(SK.torus(.05, .02, 5, 10, Math.PI), W.dark, sx * (sw / 2 + .02), sh + .27, .26, 0, Math.PI / 2, 0);
      p(lathe([[.03, 0], [.045, .03], [.03, .08], [.04, .12], [.001, .16]], 8), 0xd8b848, sx * (sw / 2 - .02), 1.4, -.26); }
    return p; }
  // an iron brazier on a tripod, coals and flames in it
  function brazier(seed) { const r = rng(seed || 87), p = Parts(), h = .5;
    p(lathe([[.001, 0], [.12, .01], [.24, .1], [.28, .16], [.26, .17], [.22, .12], [.001, .06]], 12), 0x3a3a40, 0, h, 0);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; p(SK.cyl(.016, .02, h + .04, 6), 0x3a3a40, Math.sin(a) * .15, h / 2, Math.cos(a) * .15, Math.cos(a) * .25, 0, -Math.sin(a) * .25);
      p(SK.ball(.03, 6, 5), 0x3a3a40, Math.sin(a) * .21, .02, Math.cos(a) * .21); }
    p(SK.ball(.22, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0x1a1210, 0, h + .08, 0, 0, 0, 0, 1, .4, 1);
    for (const [fx, fz, fh, c] of [[0, 0, .3, 0xffa030], [-.08, .05, .2, 0xff7a20], [.09, -.04, .22, 0xff8a28], [.02, .09, .16, 0xffb040]]) p.flame(SK.cone(.07, fh, 6), c, fx, h + .12 + fh / 2, fz);
    return p; }
  // a runner rug: a border and a field, flat on the floor, w × d
  function runner(w, d, col, seed) { const p = Parts();
    p(SK.rbox(w, .012, d, .004, 1), 0xb89838, 0, .008, 0); p(SK.rbox(w - .2, .014, d - .2, .004, 1), col, 0, .01, 0);
    p(SK.rbox(w - .34, .016, d - .34, .004, 1), new THREE.Color(col).multiplyScalar(.8), 0, .011, 0);
    return p; }
  function church(W, D, H, n, seed) { const p = Parts(), s = seed || 1;
    p.put(dais(W - 2, 3.0, .25, s), W / 2, 2.6, 0);
    p.put(altar(n, s + 1), W / 2, 1.6, 0, .25);
    for (let z = 5, k = 0; z < D - 2.5; z += 1.5, k++) for (const x of [W / 2 - 2.2, W / 2 + 2.2]) p.put(pew(2.6, n, s + 10 + k * 2 + (x > W / 2 ? 1 : 0)), x, z, 0);
    p.put(pulpit(n, s + 3), W - 2.2, 3.6, 0);
    for (const x of [W / 2 - 4.1, W / 2 + 4.1]) for (let z = 5.5, k = 0; z < D - 3; z += 4, k++) p.put(column(H, .3, s + 20 + k * 4), x, z, 0);
    return p; }
  function hall(W, D, H, n, seed) { const p = Parts(), s = seed || 1;
    p.put(dais(W * .55, 3.6, .37, s), W / 2, 3.2, 0);
    p.put(runner(3.2, 1.6, 0x7a2020, s), W / 2, 2.4, 0, .37);
    p.put(throne(n, s + 1), W / 2, 1.6, 0, .37);
    p.put(runner(2.6, D - 6, 0x6a1010, s + 2), W / 2, D / 2 + 1.5, 0);
    for (let z = 6; z < D - 3; z += 4) for (const x of [W / 2 - 5, W / 2 + 5]) { p.put(column(H, .42, s + 30 + z), x, z, 0);
      p.put(banner([0x7a2020, 0x203a6a, 0x6a5a20][(z / 4 | 0) % 3], s + z), x + (x < W / 2 ? .6 : -.6), z, Math.PI / 2, H * .6 + 1.2); }
    for (const x of [W / 2 - 3, W / 2 + 3]) p.put(brazier(s + 40 + x), x, 5.2, 0);
    const tz = D * .3; p.put(table(8, 1.6, n, s + 50), W / 2, tz, 0); for (const sd of [-1, 1]) p.put(bench(7.8, n, s + 51 + sd), W / 2, tz + sd * 1.2, 0);
    for (let i = 0; i < 6; i++) { const x = W / 2 - 3.3 + i * 1.32, q = Parts(); q(SK.cyl(.1, .09, .012, 14), 0xd8ccb0, 0, .465, .45); q(SK.cyl(.1, .09, .012, 14), 0xd8ccb0, .2, .465, -.45); tankard(q, .3, .46, .5, 0x8a8478); if (i % 2) candle(q, 0, .46, 0); p.put(q, x, tz, 0); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p(turned(.43, .03), WOOD[n] ? WOOD[n].dark : WOOD.gatelands.dark, W / 2 + sx * 1.3, 0, tz + sz * .7);
    return p; }
  // ── S292: the guild halls (Michael's A on #46) ──
  // a notice board: a framed board of planks with pinned notes, the wall at −z; w × h, centred
  function noticeBoard(w, h, n, seed) { const r = rng(seed || 89), p = Parts(), W = WOOD[n] || WOOD.gatelands;
    p(SK.rbox(w - .1, h - .1, .03, .005, 1), 0x8a6a44, 0, 0, .015);
    for (const s of [-1, 1]) { p(SK.rbox(w, .07, .06, .015, 1), jit(W.dark, r, .03), 0, s * (h / 2 - .035), .03); p(SK.rbox(.07, h, .06, .015, 1), jit(W.dark, r, .03), s * (w / 2 - .035), 0, .03); }
    for (let k = 0; k < 9; k++) { const x = -w / 2 + .3 + r() * (w - .6), y = -h / 2 + .3 + r() * (h - .6), nw = .18 + r() * .12, nh = .22 + r() * .14;
      p(SK.rbox(nw, nh, .004, .002, 1), jit(0xe8dcc0, r, .08), x, y, .035, 0, 0, (r() - .5) * .2); p(SK.ball(.012, 6, 4), [0xa02020, 0x2a4a8a, 0xa8843a][k % 3], x, y + nh / 2 - .03, .04); }
    return p; }
  // a writing desk: the counter's panelled front, bare, with a ledger, an inkwell and a quill, papers and a candle
  function desk(len, n, seed) { const r = rng(seed || 91), p = Parts();
    p.put(counter(len, n, seed, true), 0, 0, 0);
    p(SK.rbox(.36, .04, .26, .006, 1), 0x5a2a1a, -.4, .71, .05, 0, .15, 0); p(SK.rbox(.34, .012, .24, .004, 1), 0xe8dcc0, -.4, .735, .05, 0, .15, 0);
    p(lathe([[.001, 0], [.035, 0], [.035, .04], [.012, .05], [.012, .06], [.001, .06]], 8), 0x1e1c24, .3, .69, -.05);
    p(SK.cyl(.002, .004, .22, 4), 0xe8e4dc, .32, .78, -.05, 0, 0, -.4);
    for (let k = 0; k < 4; k++) p(SK.rbox(.2, .003, .26, .002, 1), jit(0xe8dcc0, r, .06), len * .25 + (r() - .5) * .1, .692 + k * .004, (r() - .5) * .1, 0, (r() - .5) * .6, 0);
    candle(p, -len * .35, .69, -.1);
    return p; }
  // a bookcase against the wall (the wall at −z): uprights, four shelves of books standing, leaning and lying (plain boxes:
  // a book's bevel never shows, and there are hundreds)
  function bookcase(len, n, seed) { const r = rng(seed || 93), p = Parts(), W = WOOD[n] || WOOD.gatelands, Hc = 1.5, d = .3;
    const nu = Math.max(2, Math.round(len / .9) + 1); for (let i = 0; i < nu; i++) p(SK.rbox(.04, Hc, d, .008, 1), jit(W.wood, r, .04), -len / 2 + len * i / (nu - 1), Hc / 2, d / 2);
    p(SK.rbox(len + .06, .05, d + .04, .012, 1), W.dark, 0, Hc + .025, d / 2);
    const BC = [0x7a2a1e, 0x2a3a5a, 0x3a5a2a, 0x6a4a1a, 0x4a2a4a, 0x8a6a3a, 0x2a2a2a];
    [.04, .42, .8, 1.18].forEach(y => { p(SK.rbox(len, .025, d, .006, 1), jit(W.wood, r, .04), 0, y, d / 2);
      for (let x = -len / 2 + .05; x < len / 2 - .08;) { if (r() < .08) { x += .1 + r() * .15; continue; } const bh = .2 + r() * .12, bw = .025 + r() * .035, bd = .16 + r() * .08, c = jit(BC[Math.floor(r() * BC.length)], r, .06);
        if (r() < .1) { p(new THREE.BoxGeometry(bh, bw, bd), c, x + bh / 2, y + .012 + bw / 2, d / 2 + .02); x += bh + .02; }
        else { const lean = r() < .08 ? .25 : 0; p(new THREE.BoxGeometry(bw, bh, bd), c, x + bw / 2 + lean * .1, y + .012 + bh / 2, d / 2 + .02, 0, 0, -lean); if (r() < .5) p(new THREE.BoxGeometry(bw + .002, .01, bd * .6), 0xa8843a, x + bw / 2 + lean * .1, y + .012 + bh * .75, d / 2 + .02 + bd * .21, 0, 0, -lean); x += bw + .004 + lean * .15; } } });
    return p; }
  // an open book on a table, and a rolled scroll
  function openBook(p, x, y, z, ry, r) { for (const s of [-1, 1]) p(SK.rbox(.16, .02, .22, .004, 1), 0xe8dcc0, x + Math.cos(ry) * s * .08, y + .012, z - Math.sin(ry) * s * .08, 0, ry, s * -.08);
    p(SK.rbox(.34, .012, .24, .004, 1), 0x5a2a1a, x, y + .006, z, 0, ry, 0); }
  function guildF(W, D, H, n, seed) { const p = Parts(), s = seed || 1;
    p.put(desk(5, n, s), W / 2, 3.4, 0);
    const R = [['sword', 'longsword', 'claymore'], ['axe', 'greataxe', 'warhammer'], ['mace', 'flail', 'greatclub'], ['cutlass', 'dagger', 'sword'], ['longsword', 'axe', 'mace'], ['claymore', 'warhammer', 'greataxe']];
    for (let k = 0; k < 6; k++) p.put(rack(n, s + 10 + k, R[k]), W - .1, 4 + k * 1.1, -Math.PI / 2);
    ['plate', 'leather', 'mail'].forEach((k, i) => p.put(armourStand(k, n, s + 20 + i), 2 + i * 1.6, 5.2, 0));
    const tz = D * .3; p.put(table(6, 1.3, n, s + 30), W / 2, tz, 0); for (const sd of [-1, 1]) p.put(bench(5.8, n, s + 31 + sd), W / 2, tz + sd * 1.05, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p(turned(.43, .028), (WOOD[n] || WOOD.gatelands).dark, W / 2 + sx * .9, 0, tz + sz * .52);
    { const q = Parts(); tankard(q, -1.6, .46, .2, 0x8a8478); tankard(q, .8, .46, -.25, 0x7a6a4a); candle(q, 0, .46, 0); q(bowl(.09), 0x9a7050, 1.8, .46, .1); p.put(q, W / 2, tz, 0); }
    p.put(grindstone(n, s + 40), 2.6, D * .45, 0);
    return p; }
  function guildM(W, D, H, n, seed) { const p = Parts(), s = seed || 1;
    p.put(desk(5, n, s), W / 2, 3.4, 0);
    const off = Math.min(0, D * .52 - .25 - (D * .35 + 3.85));
    for (let k = 0; k < 2; k++) p.put(bookcase(3.8, n, s + 10 + k), W - .02, D * .35 + off + (k ? 1.95 : -1.95), -Math.PI / 2);
    const a = 1.0, b = W / 2 - 1.5, c = W / 2 + 1.5, e = W - 1.0;
    [.62, .99, 1.36].forEach((y, i) => { p.put(shelf(b - a, n, s + 20 + i, 'potions'), (a + b) / 2, 0, 0, y); p.put(shelf(e - c, n, s + 23 + i, 'potions'), (c + e) / 2, 0, 0, y); });
    p.put(still(n, s + 30), W - 2.4, 2.4, 0);
    const tz = D * .3; p.put(table(5, 1.2, n, s + 31), W / 2, tz, 0);
    for (const sx of [-1, 1]) p(turned(.43, .028), (WOOD[n] || WOOD.gatelands).dark, W / 2, 0, tz + sx * .5);
    { const q = Parts(), r = rng(s + 32); for (let k = 0; k < 4; k++) openBook(q, -2 + k * 1.3, .46, (r() - .5) * .3, (r() - .5) * .5, r); candle(q, -1.35, .46, .35); candle(q, 1.25, .46, -.35);
      q(SK.cyl(.03, .03, .3, 10), 0xe0d4b0, .6, .49, .3, 0, .4, Math.PI / 2); p.put(q, W / 2, tz, 0); }
    for (let x = W / 2 - 4; x <= W / 2 + 4; x += 8) for (let z = 6; z < D - 3; z += 5) p.put(column(H, .3, s + 40 + z), x, z, 0);
    return p; }
  // ── S293: the odd rooms — the cellar, the ship's cabin, the chapel ──
  // a ladder against the wall (the wall at −z): two rails and round rungs, h tall
  function ladder(h, n, seed) { const r = rng(seed || 95), p = Parts(), W = WOOD[n] || WOOD.gatelands;
    for (const s of [-1, 1]) p(SK.rbox(.06, h, .06, .015, 1), jit(W.wood, r, .05), s * .4, h / 2, .1, -.06, 0, 0);
    for (let y = .3; y < h - .1; y += .4) p(SK.cyl(.018, .018, .8, 6), jit(W.dark, r, .04), 0, y, .1 + y * .06, 0, 0, Math.PI / 2);
    return p; }
  // a wine rack along the wall (the wall at −z): three shelves of bottles lying neck out, len long
  function wineRack(len, n, seed) { const r = rng(seed || 97), p = Parts(), W = WOOD[n] || WOOD.gatelands;
    const nu = Math.max(2, Math.round(len / .8) + 1); for (let i = 0; i < nu; i++) p(SK.rbox(.05, 1.3, .36, .008, 1), jit(W.dark, r, .04), -len / 2 + len * i / (nu - 1), .65, .18);
    [.6, .92, 1.24].forEach(y => { p(SK.rbox(len, .03, .36, .008, 1), jit(W.wood, r, .04), 0, y, .18);
      for (let x = -len / 2 + .08; x < len / 2 - .06; x += .09) if (r() > .12) { const c = [0x2a4a2a, 0x3a1a1a, 0x5a6a3a, 0x2a3a4a, 0x50a0d0, 0xc04040][Math.floor(r() * 6)];
        p(lathe([[.001, 0], [.035, 0], [.035, .17], [.012, .23], [.012, .29], [.001, .29]], 6), c, x, y + .05, .04, Math.PI / 2, 0, 0); } });
    return p; }
  // rubble: a heap of fallen dressed stones, as the old stacked blocks stood
  function fallen(list, seed) { const r = rng(seed || 99), p = Parts(), ST = 0x6a5a4a;
    for (const [x, y, z] of list) p(SK.rbox(.45 + (r() - .5) * .1, .22, .3 + (r() - .5) * .08, .04, 1), jit(ST, r, .1), x, y, z, (r() - .5) * .15, (r() - .5) * .5, (r() - .5) * .15);
    return p; }
  function cellar(W, D, H, n, seed) { const p = Parts(), s = seed || 1;
    p.put(wineRack(3.2, n, s), W - .02, D * .6, -Math.PI / 2);
    p.put(chest(n, s + 1), W / 2, D - 1.4, Math.PI);
    p.put(ladder(2.0, n, s + 2), W / 2, .52, 0);
    return p; }
  function cabin(W, D, H, n, seed) { const p = Parts(), s = seed || 1, r = rng(s + 7);
    const tx = W / 2 + .6, tz = D * .45; p.put(table(1.8, 1.1, n, s), tx, tz, 0);
    { const q = Parts(); q(SK.rbox(.9, .004, .6, .002, 1), 0xe8d8b0, 0, .463, 0); for (let k = 0; k < 6; k++) q(SK.rbox(.3 + r() * .4, .001, .006, .001, 1), 0x6a5a3a, (r() - .5) * .4, .466, (r() - .5) * .45, 0, r() * 3, 0);
      q(SK.rbox(.3, .025, .22, .005, 1), 0x5a2a1a, -.2, .475, -.12, 0, .3, 0); candle(q, .6, .46, .2); q(SK.cyl(.004, .004, .14, 4), 0xa8843a, .2, .47, .15, 0, .6, Math.PI / 2); p.put(q, tx, tz, 0); }
    for (let k = 0; k < 3; k++) p.put(sack(s + 3 + k, [0xb8a070, 0x9a8a60, 0xc0b080][k]), W - 1.0 - k * .7, D - 1.6, k);
    [.62, .99].forEach((y, i) => p.put(shelf(2.2, n, s + 10 + i, 'bottles'), 1.3, 0, 0, y));
    return p; }
  function chapel(W, D, H, n, seed) { const p = Parts(), s = seed || 1;
    const L = []; for (let k = 0; k < 7; k++) L.push([W * .38 + .3 + (k % 2) * .4, .124 + Math.floor(k / 2) * .186, D * .55 + (k % 3 - 1) * .25]); p.put(fallen(L, s), 0, 0, 0);
    p.put(dais(3.2, 2.0, .31, s + 1), W / 2, 2.2, 0);
    p(lathe([[.001, 0], [.33, 0], [.33, .06], [.28, .1], [.26, .9], [.3, .95], [.34, 1.0], [.001, 1.0]], 12), 0xa8a098, W / 2, .31, 2.2);
    p(lathe([[.001, 0], [.26, 0], [.28, .05], [.22, .1], [.22, .26], [.001, .31]], 12), 0x98908a, W / 2, 1.31, 2.2);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, q = Parts(); candle(q, 0, 0, 0); p.put(q, W / 2 + Math.cos(a) * 1.9, 2.2 + Math.sin(a) * 1.2, 0, .31 * (Math.abs(Math.sin(a) * 1.2) < 1 && Math.abs(Math.cos(a) * 1.9) < 1.6 ? 1 : 0)); }
    for (let z = D * .62, k = 0; z < D - 1; z += 1.4, k++) for (const x of [W * .2, W * .8]) p.put(pew(1.6, n, s + 10 + k * 2 + (x > W / 2 ? 1 : 0)), x, z, 0);
    p.put(ladder(2.0, n, s + 3), W / 2, D - .78, Math.PI);
    return p; }
  // the flames flicker: call per frame with the fire mesh and the time
  function flicker(fire, t) { if (!fire) return; const s = 1 + Math.sin(t * 11.3) * .06 + Math.sin(t * 17.1) * .04; fire.scale.set(1, s, 1); }

  // ── bake: one vertex-coloured mesh for the wood and stone, one unlit mesh for the flames. Every vertex near the floor is
  // darkened (the contact shade the bake gives the dungeon's props), from ×.62 at the floor to ×1 at .35 up. ──
  function merge(list, contact) { const P = [], N = [], Cc = [], I = []; const v = new THREE.Vector3(), nm = new THREE.Matrix3();
    for (const [geo, col, m] of list) { const pa = geo.attributes.position, na = geo.attributes.normal, b = P.length / 3; nm.getNormalMatrix(m);
      const ca = geo.attributes.color;
      for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(m); P.push(v.x, v.y, v.z); const k = contact ? .62 + .38 * Math.min(1, Math.max(0, v.y / .35)) : 1;
        if (ca) Cc.push(col.r * k * ca.getX(i), col.g * k * ca.getY(i), col.b * k * ca.getZ(i)); else Cc.push(col.r * k, col.g * k, col.b * k); v.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); N.push(v.x, v.y, v.z); }
      if (geo.index) { const ix = geo.index.array; for (let i = 0; i < ix.length; i++) I.push(ix[i] + b); } else for (let i = 0; i < pa.count; i++) I.push(b + i); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setIndex(I); return g; }
  const MAT = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), FIRE = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .92 });
  function bake(p) { const G = new THREE.Group();
    const body = new THREE.Mesh(merge(p.list, true), MAT); G.add(body);
    let fire = null; if (p.fire.length) { fire = new THREE.Mesh(merge(p.fire, false), FIRE); G.add(fire); }
    G.userData.tris = body.geometry.index.count / 3 + (fire ? fire.geometry.index.count / 3 : 0); G.userData.fire = fire; return G; }

  // ── the two rooms, at the places buildInteriorFor puts today's boxes (W×D room, ceiling H, x east, z south, door at z=D) ──
  function home(W, D, H, n, seed) { const p = Parts(), s = seed || 1;
    p.put(bed(n, s + 1), 1.2, 1.2, 0);
    p.put(hearth(1.8, H, n, s + 2), W, D * .4, -Math.PI / 2);
    p.put(table(1.5, .9, n, s + 3), W / 2, D * .5, 0);
    p.put(chair(n, s + 4), W / 2 - 1.0, D * .5, Math.PI / 2 + .12); p.put(chair(n, s + 5), W / 2 + 1.0, D * .5, -Math.PI / 2 - .2);
    { const q = Parts(); candle(q, 0, .46, 0); q(bowl(.08), 0x9a7050, .3, .46, .12); tankard(q, -.25, .46, -.15, 0x7a6a4a); p.put(q, W / 2, D * .5, 0); }
    p.put(chest(n, s + 6), W / 2 + 2.2, 1.0, 0);
    p.put(shelf(2.2, n, s + 7), 2.6, 0, 0, .68); p.put(shelf(2.2, n, s + 8), 2.6, 0, 0, 1.05);
    p.put(rug(.85, .55, n, s + 9), W / 2, D * .5 + .05, 0);
    return p; }
  function inn(W, D, H, n, seed, gallery) { const p = Parts(), s = seed || 1, L = W * .55;
    p.put(counter(L, n, s + 1), W / 2, 2.2, 0);
    p.put(dresser(L, n, s + 2), W / 2, .02, 0);
    p.put(cask(n, s + 3), W / 2 - L / 2 + .45, 1.1, Math.PI / 2 + Math.PI / 2 * 0); p.put(cask(n, s + 4), W / 2 + L / 2 - .45, 1.1, 0);
    p.put(hearth(2.2, H, n, s + 5), W, D * .5, -Math.PI / 2);
    const T = [[3.4, D * .42], [3.4, D * .66], [W - 3.4, D * .7], [W / 2, D * .6]];
    T.forEach(([x, z], i) => { p.put(table(1.8, 1.0, n, s + 10 + i), x, z, 0); for (const sd of [-1, 1]) p.put(bench(1.6, n, s + 20 + i * 2 + sd), x, z + sd * .9, 0);
      const q = Parts(); tankard(q, -.4, .46, .1, 0x8a8478); tankard(q, .3, .46, -.15, 0x7a6a4a); if (i % 2 === 0) candle(q, 0, .46, 0); else q(bowl(.09), 0x9a7050, .05, .46, .05); p.put(q, x, z, 0); });
    for (let k = 0; k < 3; k++) p.put(stool(n, s + 30 + k), W / 2 - L * .3 + k * L * .3, 2.2 + .72, 0);
    if (!gallery) { p.put(bed(n, s + 40), 1.2, D - 2.0, 0); p.put(bed(n, s + 41), W - 1.2, D - 2.0, 0); }
    return p; }
  // ── S331 — the windows (Michael's 2 on #53, by the room): local, the wall at z=0 and the room towards +z, the opening
  // w by h centred on the origin; the painted view stays on the wall behind the frame ──
  const wrb = (w, h, d, r) => SK.rbox(w, h, d, r == null ? Math.min(.012, w / 3, h / 3, d / 3) : r, 1);
  // diamond leading over one light: the lines x±y=c clipped to the light's rectangle
  function diamonds(p, x0, x1, y0, y1, step, col, z) {
    for (const s of [1, -1]) for (let c = -3; c <= 3; c += step) { const pts = [];
      for (const x of [x0, x1]) { const y = s * x + c; if (y >= y0 - 1e-6 && y <= y1 + 1e-6) pts.push([x, y]); }
      for (const y of [y0, y1]) { const x = s * (y - c); if (x >= x0 - 1e-6 && x <= x1 + 1e-6) pts.push([x, y]); }
      if (pts.length < 2) continue; const [a, b] = pts; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < .02) continue;
      p(wrb(.008, L, .008, .003), col, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z, 0, 0, -Math.atan2(b[0] - a[0], b[1] - a[1])); } }
  // A — a leaded casement in a plastered reveal: splayed jambs and head, a stone sill, a frame with a mullion and a transom
  function winLead(w, h, n, seed) { const r = rng(seed || 3), p = Parts(), W = WOOD[n] || WOOD.gatelands, P = 0xd8ccb4, O = W.dark, L = 0x3a3a3c, S = 0xa89c88;
    for (const sx of [-1, 1]) p(wrb(.14, h + .2, .16), jit(P, r, .03), sx * (w / 2 + .07), 0, .08, 0, sx * .18, 0);
    p(wrb(w + .36, .14, .16), jit(P, r, .03), 0, h / 2 + .07, .08, -.12, 0, 0);
    p(wrb(w + .44, .07, .26), jit(S, r, .05), 0, -h / 2 - .035, .12);
    p(wrb(w + .06, .05, .06), O, 0, h / 2, .03); p(wrb(w + .06, .05, .06), O, 0, -h / 2 + .01, .03);
    for (const x of [-w / 2, 0, w / 2]) p(wrb(.05, h, .06), O, x, 0, .03);
    const ty = h * .22; p(wrb(w, .04, .05), O, 0, ty, .03);
    for (const [x0, x1] of [[-w / 2 + .025, -.025], [.025, w / 2 - .025]]) { diamonds(p, x0, x1, -h / 2 + .035, ty - .02, .16, L, .02); diamonds(p, x0, x1, ty + .02, h / 2 - .025, .16, L, .02); }
    return p; }
  // B — a timber window with plank shutters folded back on strap hinges: a lintel beam, glazing bars, a plank sill
  function winShutter(w, h, n, seed) { const r = rng(seed || 5), p = Parts(), W = WOOD[n] || WOOD.gatelands, O = W.wood, D = W.dark, SH = W.paint || W.wood, I = IRON;
    p(wrb(w + .5, .16, .18), jit(D, r), 0, h / 2 + .08, .09);
    p(wrb(w + .3, .06, .22), jit(O, r), 0, -h / 2 - .03, .11);
    for (const sx of [-1, 1]) p(wrb(.1, h, .12), jit(O, r), sx * (w / 2 + .05), 0, .06);
    p(wrb(.035, h, .04), D, 0, 0, .03); p(wrb(w, .035, .04), D, 0, 0, .03);
    for (const sx of [-1, 1]) { const cx = sx * (w / 2 + .1 + w / 4);
      for (let k = 0; k < 3; k++) p(wrb(w / 6 - .008, h - .02, .03), jit(SH, r, .08), cx + (k - 1) * w / 6, 0, .03);
      for (const y of [-h * .3, h * .3]) { p(wrb(w / 2, .06, .025), jit(D, r), cx, y, .055); p(wrb(w / 2 * .7, .025, .012), I, cx - sx * w * .08, y, .07); p(SK.ball(.012, 5, 4), I, cx - sx * (w / 4 + .02), y, .07); } }
    return p; }
  // C — a round-headed stone window for a church or a keep's hall: coursed jambs of long and short blocks, nine voussoirs,
  // a moulded sill, square lead quarries
  function winArch(w, h, seed) { const r = rng(seed || 7), p = Parts(), S = 0xb0a894, L = 0x3a3a3c, R = w / 2, hs = h - R;
    for (const sx of [-1, 1]) for (let k = 0, y = -h / 2; k < 5; k++) { const bh = hs / 5, bw = k % 2 ? .16 : .24; p(wrb(bw, bh - .015, .2), jit(S, r, .07), sx * (R + bw / 2), y + bh / 2, .1); y += bh; }
    const cy = -h / 2 + hs; for (let i = 0; i < 9; i++) { const a = Math.PI * (i + .5) / 9, rr = R + .1; p(wrb(.2, R * Math.PI / 9 - .015, .2), jit(S, r, .07), -Math.cos(a) * rr, cy + Math.sin(a) * rr, .1, 0, 0, a - Math.PI / 2); }
    p(wrb(w + .4, .08, .28), jit(S, r, .04), 0, -h / 2 - .04, .13);
    for (let x = -R + w / 4; x < R - .01; x += w / 4) { const top = cy + Math.sqrt(Math.max(0, R * R - x * x)); p(wrb(.01, top + h / 2, .01, .003), L, x, (top - h / 2) / 2, .02); }
    for (let y = -h / 2 + h / 7; y < cy + R - .02; y += h / 7) { const half = y <= cy ? R : Math.sqrt(Math.max(0, R * R - (y - cy) ** 2)); if (half > .03) p(wrb(half * 2, .01, .01, .003), L, 0, y, .02); }
    return p; }
  // the frame a room takes: C for the tall windows of churches and keep halls, A for the trades, inns, guilds and chapels,
  // B for homes, cabins and the poorer rooms
  const WIN_LEAD = { inn: 1, barber: 1, weapon: 1, armor: 1, potion: 1, misc: 1, shipwright: 1, guild_f: 1, guild_m: 1, chapel: 1, church: 1, castle: 1 };
  function winKind(type, tall) { return tall && (type === 'church' || type === 'castle') ? 'C' : WIN_LEAD[type] ? 'A' : 'B'; }
  function windowFrame(kind, w, h, n, seed) { return kind === 'C' ? winArch(w, h, seed) : kind === 'A' ? winLead(w, h, n, seed) : winShutter(w, h, n, seed); }
  return { winLead, winShutter, winArch, winKind, windowFrame, Parts, table, bench, chair, stool, bed, chest, shelf, rug, hearth, counter, cask, dresser, candle, tankard, bake, merge, flicker, home, inn, WOOD, MAT, forge, anvil, tub, rack, grindstone, smithy, crate, armourStand, wallShield, armourBench, herbBundle, still, scales, sack, armoury, apothecary, goods, barberChair, washstand, barberMirror, barberBench, basinSign, dyerCorner, barber, pew, altar, dais, pulpit, column, banner, throne, brazier, runner, church, hall, noticeBoard, desk, bookcase, guildF, guildM, ladder, wineRack, fallen, cellar, cabin, chapel };
}

let _FURN = null;
function furnKit() { return _FURN || (_FURN = furnBuild(THREE, SK)); }
function dunMerge(parts,tag){const P=[],N=[],C=[],I=[];const v=new THREE.Vector3(),nm=new THREE.Matrix3();
  for(const [geo,col,m] of parts){const p=geo.attributes.position,n=geo.attributes.normal,b=P.length/3;nm.getNormalMatrix(m);
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);P.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();N.push(v.x,v.y,v.z);C.push(col.r,col.g,col.b);}
    if(geo.index){const ix=geo.index.array;for(let i=0;i<ix.length;i++)I.push(ix[i]+b);}else for(let i=0;i<p.count;i++)I.push(b+i);geo.dispose();}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);
  const mesh=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true}));mesh.userData.dunShell=tag||'props';return mesh;}
function dunSmoothNormals(g){g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,acc=new Map();
  const key=i=>Math.round(p.getX(i)*500)+','+Math.round(p.getY(i)*500)+','+Math.round(p.getZ(i)*500);
  for(let i=0;i<p.count;i++){const k=key(i);const a=acc.get(k)||[0,0,0];a[0]+=n.getX(i);a[1]+=n.getY(i);a[2]+=n.getZ(i);acc.set(k,a);}
  for(let i=0;i<p.count;i++){const a=acc.get(key(i));const l=Math.hypot(a[0],a[1],a[2])||1;n.setXYZ(i,a[0]/l,a[1]/l,a[2]/l);}n.needsUpdate=true;}
// S478 — a dungeon floor's key for its seeded streams: the gate's seed (a hand-made dungeon has none: its id or name) and the floor
function dKeyOf(portal,floorIdx){const p=portal||{};return String(p.seed!=null?p.seed:(p.id||p.name||'dungeon'))+':'+floorIdx;}
// S599–S601 — #177 A: a fort's seed picks one of the three new shapes (the hall and undercroft, barracks and the gaol, the
// ring and its towers); a small fort keeps its own layout, which has no floor below
const FORT_SHAPES=['fort_hall','fort_barracks','fort_ring'];
function fortShapeFor(portal){const k=portal.interior||'cave';if(!k.startsWith('fort_')||portal.size==='small')return k;
  if(FORT_SHAPES.includes(k))return k;return FORT_SHAPES[hashSeed((portal.seed|0)+177)%3];}
function buildDungeon(portal){
  if(dScene)while(dScene.children.length)dScene.remove(dScene.children[0]);
  dScene=new THREE.Scene();ENEMIES=[];CORPSES=[];CHESTS=[];BARRELS=[];TORCHES=[];BALLS=[];DOORS=[];KEYS=[];DUNGEON_COLUMNS=[];DUNGEON_PROPS=[];
  currentPortal=portal;currentFloor=1;FLOOR_HEIGHT=dunFloorHeight(portal); /* S564 — the dungeon's height is its own */
  if(typeof WORLD!=='undefined'&&WORLD.onEnterPortal)try{WORLD.onEnterPortal(portal);}catch(e){} // v80 — the acts
  // v61g0: dispatch via FORT_INTERIORS registry. portal.interior selects the
  // generator; absent or unknown value falls back to 'cave' (makeDungeon).
  // The fallback is intentionally defensive — a bad interior value should
  // produce a playable cave dungeon, not a hard crash on entry.
  const interiorKey = fortShapeFor(portal);
  const interiorFn = FORT_INTERIORS[interiorKey] || FORT_INTERIORS.cave;
  let gen=interiorFn(portal.size,portal.seed);
  if(interiorKey!=='cave'&&!gen.map2&&portal.size!=='small')gen=addUpperFloor(gen,portal.seed); // v80 — forts get an upper floor
  dMap=gen.map;dMap2=gen.map2||null;dR=gen.H;dC=gen.W;
  mmRevealed=Array.from({length:dR},()=>new Uint8Array(dC));
  mmRevealed2=Array.from({length:dR},()=>new Uint8Array(dC));
  dEntranceX=gen.entC;dEntranceZ=gen.entR;
  dStairC=gen.stairC;dStairR=gen.stairR;
  // v61b8: hoist tutorial-spawn computation to early in buildDungeon so the
  // enemy spawn filter (further down) can reference `portal._tutorialSpawn`
  // when picking candidate cells. Previously the spawn cell was only
  // computed in the tutorial decoration block at the END of buildDungeon
  // (where the sarcophagus mesh is placed), which was AFTER enemy spawn.
  // Net effect of the old order: enemy spawn filter saw `portal._tutorialSpawn`
  // as undefined, didn't apply the spawn-distance exclusion, and could drop
  // a skeleton right next to the wake-up cell. Computing here first means
  // the enemy filter has a real coord to exclude from. Same algorithm as
  // the v61b3 logic — first walkable cell with a 2+ cell cardinal opening,
  // ranked by distance from entrance descending. Yaw stays hardcoded SW
  // for tutorial seed:7 per v61b4. The decoration block at the bottom of
  // buildDungeon now reads back from `portal._tutorialSpawn` instead of
  // recomputing.
  if(portal.tutorial){
    const _floorRanked=[];
    for(let _r=0; _r<gen.H; _r++){
      for(let _c=0; _c<gen.W; _c++){
        const _v = gen.map[_r][_c];
        if(_v < 1 || _v === 2) continue;
        _floorRanked.push({c:_c, r:_r, d: Math.hypot(_c-dEntranceX, _r-dEntranceZ)});
      }
    }
    _floorRanked.sort((a,b)=>b.d-a.d);
    let _spBest = null;
    for(const _cand of _floorRanked){
      let _bestLen = 0;
      for(const [_dc,_dr] of [[0,-1],[0,1],[-1,0],[1,0]]){
        let _len = 0;
        for(let _step=1; _step<10; _step++){
          const _c = _cand.c + _dc*_step;
          const _r = _cand.r + _dr*_step;
          if(_r<0||_r>=gen.H||_c<0||_c>=gen.W) break;
          if(gen.map[_r][_c] < 1 || gen.map[_r][_c] === 2) break;
          _len = _step;
        }
        if(_len > _bestLen) _bestLen = _len;
      }
      if(_bestLen >= 2){ _spBest = {c: _cand.c, r: _cand.r}; break; }
    }
    if(!_spBest){
      const _f = _floorRanked[0] || {c:dEntranceX, r:dEntranceZ};
      _spBest = {c: _f.c, r: _f.r};
    }
    portal._tutorialSpawn = {x: _spBest.c, z: _spBest.r, yaw: 3 * Math.PI / 4};
  }
  const th=THEME_DEF[portal.theme]||THEME_DEF.ruins;
  dScene.background=new THREE.Color(th.fog);
  const fogFar={tiny:16,small:22,medium:32,large:44,massive:56}[portal.size]||28;
  dScene.fog=new THREE.Fog(th.fog,6,fogFar);
  dScene.add(new THREE.AmbientLight(th.amb,.20));
  dScene.add(new THREE.HemisphereLight(th.amb,0x101020,.08));
  const thWallMat=new THREE.MeshLambertMaterial({map:mkTex(x=>{x.fillStyle='#'+th.wallCol.toString(16).padStart(6,'0');x.fillRect(0,0,128,128);for(let i=0;i<100;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.25})`;x.fillRect(Math.random()*128,Math.random()*128,Math.random()*8+1,Math.random()*3+1);}for(let r2=0;r2<128;r2+=22)for(let c2=0;c2<128;c2+=34){x.strokeStyle='rgba(0,0,0,.5)';x.lineWidth=1.5;x.strokeRect(c2+(r2%44<22?16:0),r2,30,19);}})});
  const thFloorMat=new THREE.MeshLambertMaterial({map:mkTex(x=>{x.fillStyle='#'+th.floorCol.toString(16).padStart(6,'0');x.fillRect(0,0,128,128);for(let i=0;i<140;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.15})`;x.fillRect(Math.random()*128,Math.random()*128,Math.random()*5,Math.random()*5);}for(let r2=0;r2<128;r2+=32)for(let c2=0;c2<128;c2+=32){x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=.8;x.strokeRect(c2,r2,30,30);}})});
  thWallMat.map.repeat.set(1,1);thFloorMat.map.repeat.set(1,1);
  const f2WallCol=new THREE.Color(th.wallCol).lerp(new THREE.Color(0x000000),.3);
  const f2FloorCol=new THREE.Color(th.floorCol).lerp(new THREE.Color(0x000000),.3);
  const f2WallMat=new THREE.MeshLambertMaterial({color:f2WallCol});
  const f2FloorMat=new THREE.MeshLambertMaterial({color:f2FloorCol});
  const treasureMat=new THREE.MeshLambertMaterial({color:0x1e1a12});
  const stairMat=new THREE.MeshLambertMaterial({color:0x6a604a});

  // v61g2: fort interior detection + fort-specific materials.
  // Any fort_* interior variant triggers the fort renderer (so future
  // fort_linear / fort_courtyard inherit this automatically).
  // Cave dungeons (interior='cave' or absent) keep their existing materials.
  const isFort = typeof portal.interior === 'string' && portal.interior.startsWith('fort_');

  // Fort wall material — cool-grey procedural stone with block-course
  // pattern (rectangular blocks in a brick-coursing layout, mortar lines
  // between, varied tint per block). The wall MUST be a side-facing plane
  // not a top-down floor plane, so the texture's vertical axis is meaningful.
  // Texture is 128x128, 4 blocks wide x 6 courses tall.
  const fortWallMat = !isFort ? null : new THREE.MeshLambertMaterial({map:mkTex(ctx=>{
    // Mortar base — dark grey
    ctx.fillStyle = '#2a2a2e';
    ctx.fillRect(0,0,128,128);
    // Block layout: 6 courses, alternating offset (running bond)
    const courseH = 128/6;
    const blockW = 32;
    for(let row=0; row<6; row++){
      const offset = (row%2===0) ? 0 : blockW/2;
      const y = row*courseH;
      for(let bx = -blockW; bx <= 128; bx += blockW){
        const x = bx + offset;
        // Per-block tint variation (cool grey 0x6a..0x8a)
        const tint = 0x6a + Math.floor(Math.random()*0x22);
        const tintHex = tint.toString(16).padStart(2,'0');
        ctx.fillStyle = `#${tintHex}${tintHex}${(tint-4).toString(16).padStart(2,'0')}`;
        ctx.fillRect(x+1, y+1, blockW-2, courseH-2);
        // Subtle weathering — darker speckle near block edges
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        for(let i=0; i<4; i++){
          ctx.fillRect(x + Math.random()*blockW, y + Math.random()*courseH,
                       Math.random()*3, Math.random()*2);
        }
      }
    }
    // Vertical mortar lines (between blocks within each course)
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 1.2;
    for(let row=0; row<6; row++){
      const offset = (row%2===0) ? 0 : blockW/2;
      const y = row*courseH;
      for(let bx = 0; bx <= 128; bx += blockW){
        const x = bx + offset;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + courseH);
        ctx.stroke();
      }
    }
    // Horizontal mortar lines (between courses)
    for(let row=1; row<6; row++){
      const y = row*courseH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(128, y);
      ctx.stroke();
    }
  })});
  if(fortWallMat){ fortWallMat.map.repeat.set(1, 1); }

  // Fort floor — grey flagstones, irregular polygon outlines.
  const fortFloorMat = !isFort ? null : new THREE.MeshLambertMaterial({map:mkTex(ctx=>{
    // Stone base — cool mid-grey
    ctx.fillStyle = '#5a5a60';
    ctx.fillRect(0,0,128,128);
    // Darker grout grid
    ctx.fillStyle = '#2e2e34';
    // Random flagstone shapes — outline only, irregular grid
    ctx.strokeStyle = '#2a2a30';
    ctx.lineWidth = 2;
    // 3x3 nominal grid with jittered cell boundaries
    const cellSize = 128/3;
    for(let row=0; row<3; row++){
      for(let col=0; col<3; col++){
        const x0 = col*cellSize + (Math.random()-0.5)*4;
        const y0 = row*cellSize + (Math.random()-0.5)*4;
        const w = cellSize + (Math.random()-0.5)*4;
        const h = cellSize + (Math.random()-0.5)*4;
        // Per-stone tint
        const tint = 0x50 + Math.floor(Math.random()*0x18);
        const tintHex = tint.toString(16).padStart(2,'0');
        ctx.fillStyle = `#${tintHex}${tintHex}${(tint+4).toString(16).padStart(2,'0')}`;
        ctx.fillRect(x0+1, y0+1, w-2, h-2);
        ctx.strokeRect(x0, y0, w, h);
        // Weathering speckle per stone
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for(let i=0; i<5; i++){
          ctx.fillRect(x0 + Math.random()*w, y0 + Math.random()*h,
                       Math.random()*4, Math.random()*4);
        }
      }
    }
  })});
  if(fortFloorMat){ fortFloorMat.map.repeat.set(1, 1); }

  // Fort treasure-floor — same flagstone as regular fort floor but with
  // a slightly warmer/darker tint to mark Great Hall / Lord's Chamber.
  // Visual distinction from the rug/banner work in v61g3.
  const fortTreasureMat = !isFort ? null : new THREE.MeshLambertMaterial({color:0x3a352e});

  // Fort ceiling material — darker than walls, slight warmth (lit-from-
  // below feel). Stays Lambert so torch lighting registers.
  const fortCeilMat = !isFort ? null : new THREE.MeshLambertMaterial({color:0x281f18});

  // v80 S8 — spiral stair in a 2×2 shaft from floor 1 to floor 2, and the FOOTHOLD that makes it climbable. Two turns over
  // FLOOR2_Y (~33°). S598 (Michael's A on DECISION #173): a stone newel stair in the dungeon's own stone, one merged mesh for
  // the stair and one for the shaft. Each tread a wedge from the newel to the wall, thick enough that the underside steps down
  // the helix; the newel a drum a step; the shaft's walls coursed blocks; a rope handrail carried on an iron stanchion from
  // every other tread, with a post at each end (his fix: the prototype's rail hung from the wall on brackets, and below the
  // shaft, where there is no wall, it floated); a chamfered stone landing. The helix, its start and its landing are as before.
  function buildStairwell(c,r,mat){
    const cx=c+.5,cz=r+.5,turns=2,N=30;
    // the open side: which neighbour of the 2×2 shaft is floor — the helix starts there, with a landing
    const mp=gen.map;const isF=(cc,rr)=>!!(mp[rr]&&mp[rr][cc]!==undefined&&mp[rr][cc]!==0&&mp[rr][cc]!==3);const sides=[{dx:1,dz:0,ok:isF(c+2,r)||isF(c+2,r+1)},{dx:-1,dz:0,ok:isF(c-1,r)||isF(c-1,r+1)},{dx:0,dz:1,ok:isF(c,r+2)||isF(c+1,r+2)},{dx:0,dz:-1,ok:isF(c,r-1)||isF(c+1,r-1)}];const open=sides.find(s=>s.ok)||sides[0];
    const a0=(gen.entC!=null&&gen.entR!=null)?Math.atan2(gen.entR-cz,gen.entC-cx):Math.atan2(open.dz,open.dx);const _od={dx:Math.cos(a0),dz:Math.sin(a0)};open.dx=Math.abs(_od.dx)>=Math.abs(_od.dz)?Math.sign(_od.dx):0;open.dz=open.dx?0:Math.sign(_od.dz);
    const Y=FLOOR2_Y,rise=Y/N,span=turns*Math.PI*2/N,rnd=pRng((portal.seed|0)*7+598),stone=new THREE.Color(th.wallCol).multiplyScalar(2.6),wallC=new THREE.Color(th.wallCol).multiplyScalar(2.1);
    const shade=(col,k)=>col.clone().multiplyScalar(1+(rnd()-.5)*k);
    const parts=[],at=(x,y,z,ry)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry||0,0)),new THREE.Vector3(1,1,1));
    { // the landing: a quarter platform at floor level on the open side, one chamfered slab of stone
      const lx0=cx+Math.min(0,open.dx)*1.1-(open.dx===0?1.1:0),lx1=cx+Math.max(0,open.dx)*1.1+(open.dx===0?1.1:0),lz0=cz+Math.min(0,open.dz)*1.1-(open.dz===0?1.1:0),lz1=cz+Math.max(0,open.dz)*1.1+(open.dz===0?1.1:0);
      FOOTHOLDS.push({x0:Math.min(lx0,lx1),x1:Math.max(lx0,lx1),z0:Math.min(lz0,lz1),z1:Math.max(lz0,lz1),y:Math.max(0,Y)});
      parts.push([SK.rbox(open.dx===0?2.2:1.1,.14,open.dz===0?2.2:1.1,.025,2),shade(stone,.1),at(cx+open.dx*.55,Math.max(0,Y)-.07,cz+open.dz*.55)]);}
    const RR=.95,RH=.85,rail=[];
    for(let i=0;i<=N;i++){const t=i/N,ang=a0+t*turns*Math.PI*2,y=t*Y;
      // the tread: an annular wedge from the newel (.2) to the wall (1.0), .2 thick, a small bevel at the nosing
      const sh=new THREE.Shape(),r0=.2,r1=1.0,h=span*.56;sh.moveTo(r0*Math.cos(-h),r0*Math.sin(-h));sh.absarc(0,0,r1,-h,h,false);sh.lineTo(r0*Math.cos(h),r0*Math.sin(h));sh.absarc(0,0,r0,h,-h,true);
      const tg=new THREE.ExtrudeGeometry(sh,{depth:.2,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:1,curveSegments:6});tg.rotateX(-Math.PI/2);
      parts.push([tg,shade(stone,.16),at(cx,y-.218,cz,-ang)]);
      // the newel: a drum of stone a tread, alternate drums a little proud, so it reads as courses
      const dr=.205+(i%2)*.008;parts.push([new THREE.CylinderGeometry(dr,dr,Math.abs(rise)+.002,12),shade(stone.clone().multiplyScalar(.9),.14),at(cx,y-rise/2,cz)]);
      // an iron stanchion on every other tread, from the tread to the rope, and a stouter post at each end
      if(i%2===0){const end=i===0||i===N,w=end?.05:.026,hh=RH+(end?.12:.03);parts.push([new THREE.BoxGeometry(w,hh,w),new THREE.Color(0x2a2826),at(cx+Math.cos(ang)*RR,y+hh/2,cz+Math.sin(ang)*RR,-ang)]);
        if(end)parts.push([new THREE.SphereGeometry(.045,8,6),new THREE.Color(0x2a2826),at(cx+Math.cos(ang)*RR,y+hh,cz+Math.sin(ang)*RR)]);
        rail.push([+(Math.cos(ang)*RR).toFixed(3),+(y+hh).toFixed(3),+(Math.sin(ang)*RR).toFixed(3),end?1:0]);}}
    parts.push([new THREE.CylinderGeometry(.24,.21,.1,12),shade(stone,.06),at(cx,Math.max(0,Y)+.05,cz)]);
    // the rope: along the stanchions' tops
    const pts=[];for(let i=0;i<=N*2;i++){const t=i/(N*2),ang=a0+t*turns*Math.PI*2;pts.push(new THREE.Vector3(cx+Math.cos(ang)*RR,t*Y+RH,cz+Math.sin(ang)*RR));}
    parts.push([new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),N*4,.022,6,false),new THREE.Color(0x7a6040),new THREE.Matrix4()]);
    const stair=dunMerge(parts,'stair');stair.userData.rail={cx,cz,r:RR,h:RH,stanchions:rail,pts:pts.map(p=>[+(p.x-cx).toFixed(3),+p.y.toFixed(3),+(p.z-cz).toFixed(3)])};dScene.add(stair);
    // the shaft: its four walls between floor 1 and floor 2's ceiling, laid in courses of the shell's stone, alternate courses offset
    const top=Y>0?Y:0,bot=Y>0?FLOOR_HEIGHT-.1:Y+FLOOR_HEIGHT-.1,H=top-bot;
    if(H>.05){const wp=[],rows=Math.max(1,Math.round(H/.32)),rh=H/rows;
      for(const [x,z,ry] of [[cx,cz-1,0],[cx,cz+1,Math.PI],[cx-1,cz,Math.PI/2],[cx+1,cz,-Math.PI/2]])for(let k=0;k<rows;k++){const off=(k%2)*.2;
        for(let u=-1-off;u<1;u+=.4){const u0=Math.max(-1,u),u1=Math.min(1,u+.4);if(u1-u0<.01)continue;const m=at(x,bot+rh*(k+.5),z,ry).multiply(new THREE.Matrix4().makeTranslation((u0+u1)/2,0,0));
          wp.push([new THREE.PlaneGeometry(u1-u0,rh),wallC.clone().multiplyScalar(.82+rnd()*.36),m]);}}
      const shaft=dunMerge(wp,'stairShaft');dScene.add(shaft);}
    const gl=new THREE.PointLight(0xffb060,1.6,6);gl.position.set(cx,Y*.5,cz);dScene.add(gl);TORCHES.push({l:gl,fl:null,ph:Math.random()*Math.PI*2});
    const gl2=new THREE.PointLight(0xffb060,1.2,5);gl2.position.set(cx,Y+1.2,cz);dScene.add(gl2);
    // S657 — the walk rail stops inboard of the stanchions (it stopped at r1−.08=.97, the posts stand at .95, so you walked
    // through one). The treads still carry you to r1; you simply cannot stand on their outer lip, where the rail is.
    FOOTHOLDS.push({kind:'spiral',cx,cz,r0:.22,r1:1.05,rwalk:+(RR-.09).toFixed(3),y0:0,y1:Y,turns,a0});
    DUNGEON_STAIRWELL=true;
  }
  // S599 — the straight flight of the hall and undercroft (#177 A; makeFortHall): three cells wide, from the hall's floor
  // down to floor 2 northward, in the same stone as the newel stair (#173). One merged mesh: 24 steps, each a block thick
  // enough that the soffit steps down beneath it; a stone balustrade round the hole on the hall's floor (its sides and its
  // far end, the top left open); a rope handrail on iron brackets down each side wall. A second mesh: the hole's walls,
  // coursed, from the hall's floor down to the undercroft's ceiling. The ramp is a foothold, the hall's floor the platform
  // with the hole (gen.stairHoles), and the balustrade's collision belongs to floor 1 alone, so the slot below stays open.
  function buildFlight(F){
    const sg=F.dir==='s'?-1:1,Y=FLOOR2_Y,x0=F.c0-.5,x1=F.c1+.5,zT=F.top+sg*.5,zB=F.bot-sg*.5,L=Math.abs(zT-zB),Wd=x1-x0,NS=24,run=L/NS,rise=Y/NS,mx=(x0+x1)/2;
    const rnd=pRng((portal.seed|0)*7+599),stone=new THREE.Color(th.wallCol).multiplyScalar(2.6),wallC=new THREE.Color(th.wallCol).multiplyScalar(2.1),iron=new THREE.Color(0x2a2826);
    const shade=(col,k)=>col.clone().multiplyScalar(1+(rnd()-.5)*k);
    const parts=[],at=(x,y,z,ry,rx)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,0,'YXZ')),new THREE.Vector3(1,1,1));
    // the steps: step k's tread at the ramp's height over its middle, .5 deep below its riser
    for(let k=0;k<NS;k++){const yt=rise*(k+.5),h=Math.abs(rise)+.5,zc=zT-sg*run*(k+.5);parts.push([SK.rbox(Wd,h,run+.02,.02,1),shade(stone,.14),at(mx,yt-h/2,zc)]);}
    // the balustrade on the hall's floor: a plinth, a baluster every half unit, a coping; west, east and the far (north) end
    const rail=(ax,az,bx,bz)=>{const len=Math.hypot(bx-ax,bz-az),ry=Math.atan2(bx-ax,bz-az),n=Math.max(2,Math.round(len/.5));
      parts.push([SK.rbox(.26,.16,len+.26,.02,1),shade(stone,.08),at((ax+bx)/2,.08,(az+bz)/2,ry)]);
      parts.push([SK.rbox(.28,.12,len+.28,.025,1),shade(stone,.08),at((ax+bx)/2,.86,(az+bz)/2,ry)]);
      for(let i=0;i<=n;i++){const t=i/n,px_=ax+(bx-ax)*t,pz_=az+(bz-az)*t,post=i===0||i===n;parts.push([post?SK.rbox(.24,.66,.24,.02,1):new THREE.CylinderGeometry(.05,.07,.64,8),shade(stone,.1),at(px_,.16+(post?.33:.32),pz_)]);}};
    const o=.11,zE=zB-sg*o;rail(x0-o,zE,x0-o,zT);rail(x1+o,zE,x1+o,zT);rail(x0-o,zE,x1+o,zE);
    const zlo=Math.min(zB-sg*.24,zT),zhi=Math.max(zB-sg*.24,zT);
    for(const [ax0,ax1,az0,az1] of [[x0-.24,x0,zlo,zhi],[x1,x1+.24,zlo,zhi],[x0-.24,x1+.24,Math.min(zB,zB-sg*.24),Math.max(zB,zB-sg*.24)]])DUNGEON_PROPS.push({x0:ax0,x1:ax1,z0:az0,z1:az1,floor:1,flightRail:true});
    // the rope handrails, .85 over the pitch, an iron bracket from the wall every fourth step
    const slope=Math.atan2(-Y,L);
    for(const [wx,sx] of [[x0,1],[x1,-1]]){const rx_=wx+sx*.09,len=Math.hypot(L,Y);
      parts.push([new THREE.CylinderGeometry(.022,.022,len,6),new THREE.Color(0x7a6040),at(rx_,Y/2+.85,(zT+zB)/2,0,sg*(Math.PI/2-slope))]);
      for(let k=2;k<NS;k+=4){const z=zT-sg*run*k,y=rise*k+.85;parts.push([new THREE.BoxGeometry(.12,.03,.03),iron,at(wx+sx*.05,y-.03,z)]);}}
    const stair=dunMerge(parts,'flight');stair.userData.flight={x0,x1,zT,zB,steps:NS};dScene.add(stair);
    // the hole's walls between the hall's floor and the undercroft's ceiling: west, east and the far end, in courses
    const bot=Y+FLOOR_HEIGHT-.1,Hb=-bot;
    if(Hb>.05){const wp=[],rows=Math.max(1,Math.round(Hb/.32)),rh=Hb/rows;
      for(const [x,z,ry,len] of [[x0,(zT+zB)/2,Math.PI/2,L],[x1,(zT+zB)/2,-Math.PI/2,L],[mx,zB,sg>0?0:Math.PI,Wd]])for(let k=0;k<rows;k++){const off=(k%2)*.2;
        for(let u=-len/2-off;u<len/2;u+=.4){const u0=Math.max(-len/2,u),u1=Math.min(len/2,u+.4);if(u1-u0<.01)continue;
          wp.push([new THREE.PlaneGeometry(u1-u0,rh),wallC.clone().multiplyScalar(.82+rnd()*.36),at(x,bot+rh*(k+.5),z,ry).multiply(new THREE.Matrix4().makeTranslation((u0+u1)/2,0,0))]);}}
      dScene.add(dunMerge(wp,'flightWalls'));}
    const gl=new THREE.PointLight(0xffb060,1.4,7);gl.position.set(mx,Y*.5+1,(zT+zB)/2);dScene.add(gl);TORCHES.push({l:gl,fl:null,ph:Math.random()*Math.PI*2});
    FOOTHOLDS.push({x0,x1,z0:Math.min(zB,zT),z1:Math.max(zB,zT),axis:'z',y0:sg>0?Y:0,y1:sg>0?0:Y,kind:'flight',dir:sg>0?'n':'s'});
    DUNGEON_STAIRWELL=true;
  }
  // S600 — the gaol's cells (makeFortBarracks): in each cell's doorway an iron frame, jambs and a transom with fixed bars
  // above it, and the grille door hung open flat against the passage wall; one merged mesh, no collision (the door is open)
  function buildGaolGrilles(){
    const P=[],iron=new THREE.Color(0x2a2826),y0=FLOOR2_Y,Hh=FLOOR_HEIGHT,at=(x,y,z)=>new THREE.Matrix4().makeTranslation(x,y,z);
    for(const gc of gen.gaolCells||[]){const fx=gc.x-gc.sd*.5,zc=gc.z;
      for(const dz of [-.47,.47])P.push([new THREE.BoxGeometry(.08,Hh,.08),iron,at(fx,y0+Hh/2,zc+dz)]);
      P.push([new THREE.BoxGeometry(.08,.08,1.0),iron,at(fx,y0+2.2,zc)]);
      for(let k=-2;k<=2;k++)P.push([new THREE.CylinderGeometry(.018,.018,Hh-2.2,5),iron,at(fx,y0+2.2+(Hh-2.2)/2,zc+k*.18)]);
      // the door, open: its hinge at the frame's north jamb, laid along the passage wall
      const dx=fx-gc.sd*.06,z0=zc-.47;
      for(const y of [.1,1.05,2.05])P.push([new THREE.BoxGeometry(.05,.07,.9),iron,at(dx,y0+y,z0-.45)]);
      for(let k=0;k<6;k++)P.push([new THREE.CylinderGeometry(.018,.018,2.0,5),iron,at(dx,y0+1.08,z0-.08-k*.16)]);}
    if(P.length)dScene.add(dunMerge(P,'gaolGrilles'));
  }
  // S601 — the ring's sunken yard (makeFortRing): a stone balustrade round the opening on the ring's floor, all four sides,
  // its collision floor 1's; the opening's walls coursed from the yard's head height up to the ring's floor; a brazier's
  // light in the yard. The yard's floor is floor 2's shell, its ceiling left off (noCeil), so from the ring you look down
  // into it and from the yard up to the ring's roof.
  function buildYard(){
    const Yd=gen.yard,Y=FLOOR2_Y,x0=Yd.c0-.5,x1=Yd.c1+.5,z0=Yd.r0-.5,z1=Yd.r1+.5,rnd=pRng((portal.seed|0)*7+601);
    const stone=new THREE.Color(th.wallCol).multiplyScalar(2.6),wallC=new THREE.Color(th.wallCol).multiplyScalar(2.1),shade=(col,k)=>col.clone().multiplyScalar(1+(rnd()-.5)*k);
    const parts=[],at=(x,y,z,ry)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry||0,0)),new THREE.Vector3(1,1,1));
    const rail=(ax,az,bx,bz)=>{const len=Math.hypot(bx-ax,bz-az),ry=Math.atan2(bx-ax,bz-az),n=Math.max(2,Math.round(len/.5));
      parts.push([SK.rbox(.26,.16,len+.26,.02,1),shade(stone,.08),at((ax+bx)/2,.08,(az+bz)/2,ry)]);
      parts.push([SK.rbox(.28,.12,len+.28,.025,1),shade(stone,.08),at((ax+bx)/2,.86,(az+bz)/2,ry)]);
      for(let i=0;i<=n;i++){const t=i/n,post=i===0||i===n||i%6===0;parts.push([post?SK.rbox(.24,.66,.24,.02,1):new THREE.CylinderGeometry(.05,.07,.64,8),shade(stone,.1),at(ax+(bx-ax)*t,.16+(post?.33:.32),az+(bz-az)*t)]);}};
    const o=.11;rail(x0-o,z0-o,x1+o,z0-o);rail(x0-o,z1+o,x1+o,z1+o);rail(x0-o,z0-o,x0-o,z1+o);rail(x1+o,z0-o,x1+o,z1+o);
    for(const [a0,a1,b0,b1] of [[x0-.24,x1+.24,z0-.24,z0],[x0-.24,x1+.24,z1,z1+.24],[x0-.24,x0,z0-.24,z1+.24],[x1,x1+.24,z0-.24,z1+.24]])DUNGEON_PROPS.push({x0:a0,x1:a1,z0:b0,z1:b1,floor:1,flightRail:true});
    dScene.add(dunMerge(parts,'yardRail'));
    const bot=Y+FLOOR_HEIGHT-.1,Hb=-bot;
    if(Hb>.05){const wp=[],rows=Math.max(1,Math.round(Hb/.32)),rh=Hb/rows,W_=x1-x0,D_=z1-z0;
      for(const [x,z,ry,len] of [[x0,(z0+z1)/2,Math.PI/2,D_],[x1,(z0+z1)/2,-Math.PI/2,D_],[(x0+x1)/2,z0,0,W_],[(x0+x1)/2,z1,Math.PI,W_]])for(let k=0;k<rows;k++){const off=(k%2)*.2;
        for(let u=-len/2-off;u<len/2;u+=.4){const u0=Math.max(-len/2,u),u1=Math.min(len/2,u+.4);if(u1-u0<.01)continue;
          wp.push([new THREE.PlaneGeometry(u1-u0,rh),wallC.clone().multiplyScalar(.82+rnd()*.36),at(x,bot+rh*(k+.5),z,ry).multiply(new THREE.Matrix4().makeTranslation((u0+u1)/2,0,0))]);}}
      dScene.add(dunMerge(wp,'yardWalls'));}
    const gl=new THREE.PointLight(0xff9a50,1.6,14);gl.position.set((x0+x1)/2,Y+1.6,(z0+z1)/2);dScene.add(gl);TORCHES.push({l:gl,fl:null,ph:Math.random()*Math.PI*2});
  }
  function renderFloor(map,floorIdx,wallMat,floorMat,baseY){
    // v80 S478 — co-op rules: where the barrels, crates and chests stand is drawn from the dungeon's own stream, keyed by
    // its seed and floor, so one seed's floor is the same on two machines; each container's loot is keyed by its place and
    // index on the floor and the day (dKeyOf, dPlace). Cosmetic rolls (a barrel's turn, the rubble, the torches) stay Math.random.
    const dKey=dKeyOf(portal,floorIdx),dPlace=seededRng('dplace',dKey);let _nBarrel=0,_nChest=0;
    // Room containment check — chests and barrels should only spawn INSIDE rooms, never in corridors.
    // Each room is a bounding rectangle {x,y,w,h}. A cell is "in a room" if it falls inside any of these.
    // Floor 1 uses gen.rooms; floor 2 uses gen.rooms2 (may be null for single-floor dungeons).
    const floorRooms = floorIdx===2 ? (gen.rooms2||[]) : gen.rooms;
    const inRoom = (c, r) => {
      for(const rm of floorRooms){
        if(c >= rm.x && c < rm.x+rm.w && r >= rm.y && r < rm.y+rm.h) return true;
      }
      return false;
    };
    // S189 — the shell: walls, floor and ceiling as three merged meshes (not the fort's first floor, which has its own)
    // S197 — a fort's first floor too: its walls dressed flatter (no cove: its halls carry banners and sconces high on
    // the walls), in the fort's cool grey; its own floors and ceilings stay, so the shell lays ground only under walls
    const shellOn=true,fortF1=isFort&&floorIdx===1;
    if(shellOn){const sh=buildDunShell(map,baseY,fortF1?0x6c6c72:floorIdx===1?th.wallCol:f2WallCol,floorIdx===1?th.floorCol:f2FloorCol,{seed:(portal.seed|0)*3+floorIdx,skip:fortF1?((c,r)=>map[r][c]!==0):((c,r)=>map[r][c]===3||map[r][c]===6),amp:fortF1?.025:null,cove:!fortF1,
        damp:DUN_DAMP[portal.theme]||DUN_DAMP.ruins,rooms:floorIdx===2?(gen.rooms2||[]):(gen.rooms||[]),holes:floorIdx===2&&gen.stairC!=null?(gen.stairHoles||[{x0:gen.stairC-.5,x1:gen.stairC+1.5,z0:gen.stairR-.5,z1:gen.stairR+1.5}]):null,
        noCeil:floorIdx===2&&gen.yard?((c,r)=>c>=gen.yard.c0&&c<=gen.yard.c1&&r>=gen.yard.r0&&r<=gen.yard.r1):null});
      dScene.add(sh.walls);dScene.add(sh.floor);dScene.add(sh.ceil);if(sh.beams)dScene.add(sh.beams);}
    // S191 — the floor's props, one merged mesh: rubble heaps where walls meet the floor, the theme's clutter
    const props=[],stoneCol=new THREE.Color(floorIdx===1?th.wallCol:f2WallCol).multiplyScalar(2.6);
    const addP=(geo,col,x,y,z,ry,rx,rz,sx,sy,sz)=>{const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0,'YXZ')),new THREE.Vector3(sx||1,sy||1,sz||1));props.push([geo,col&&col.isColor?col:new THREE.Color(col),m]);};
    const heap=(x,z,n,spread)=>{for(let k=0;k<n;k++){const sz=.07+Math.random()*.14,t=.8+Math.random()*.5;addP(SK.rbox(sz*1.5,sz,sz*1.2,sz*.3,1),stoneCol.clone().multiplyScalar(t),x+(Math.random()-.5)*spread,baseY+sz*.4,z+(Math.random()-.5)*spread,Math.random()*Math.PI,(Math.random()-.5)*.5,(Math.random()-.5)*.5);}};
    // at the foot of the walls: a heap here and there, and now and then a fallen block from the courses
    if(shellOn){const rateH=th.clutter==='rubble'?.14:.06;for(let r=0;r<dR;r++)for(let c=0;c<dC;c++){if(map[r][c]!==1)continue;
      for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){const nr=r+dr,nc=c+dc;if(!(nr<0||nr>=dR||nc<0||nc>=dC||map[nr][nc]===0))continue;if(Math.random()>=rateH)continue;
        const along=(Math.random()-.5)*.7,wx=c+dc*.36+(dr?along:0),wz=r+dr*.36+(dc?along:0);heap(wx,wz,4+Math.floor(Math.random()*6),.34);
        if(Math.random()<.25)addP(SK.rbox(.36,.18,.24,.035,2),stoneCol.clone().multiplyScalar(.95),wx-dc*.12,baseY+.09,wz-dr*.12,Math.random()*Math.PI,0,(Math.random()-.5)*.3);}}}
    for(let r=0;r<dR;r++)for(let c=0;c<dC;c++){
      const v=map[r][c];
      if(v===0){
        if(shellOn)continue;
        // v61g2: skip per-cell wall boxes for fort interiors. Walls will
        // be emitted as continuous planar segments in the wall-segment pass
        // below renderFloor's main loop. Cave dungeons still use per-cell
        // boxes (their irregular L-corridor shapes don't benefit from
        // continuous segmentation the way fort grid layouts do).
        if(isFort && floorIdx===1) continue;
        const m=new THREE.Mesh(new THREE.BoxGeometry(1,FLOOR_HEIGHT,1),wallMat);
        m.position.set(c,baseY+FLOOR_HEIGHT/2,r);dScene.add(m);
      } else {
        // v61g2: select fort-specific materials when isFort && floor 1.
        // Treasure-floor (v===6) uses fortTreasureMat instead of treasureMat.
        // Regular floor uses fortFloorMat instead of floorMat.
        // Stair (v===3) keeps stairMat regardless (forts have no stairs
        // this ship anyway, but be defensive).
        const useFort = isFort && floorIdx===1;
        const fmat = v===6 ? (useFort ? fortTreasureMat : treasureMat)
                   : v===3 ? stairMat
                   : (useFort ? fortFloorMat : floorMat);
        if(!(v===3&&floorIdx===(FLOOR2_Y>0?2:1))&&!(shellOn&&fmat===floorMat)){ // v80 — the shaft is open in the upper floor's floor
        const f=new THREE.Mesh(new THREE.PlaneGeometry(1,1),fmat);
        f.rotation.x=-Math.PI/2;f.position.set(c,baseY,r);dScene.add(f);}
        const cmat = v===6 ? new THREE.MeshLambertMaterial({color: useFort?0x1f1a14:0x1a1208})
                   : (useFort ? fortCeilMat : MAT.ceil);
        if(!(v===3&&floorIdx===(FLOOR2_Y>0?1:2))&&!(shellOn&&cmat===MAT.ceil&&v!==3)){ // v80 — no ceiling over the stairwell in the lower floor
        const ce=new THREE.Mesh(new THREE.PlaneGeometry(1,1),cmat);
        ce.rotation.x=Math.PI/2;ce.position.set(c,baseY+FLOOR_HEIGHT,r);dScene.add(ce);}
        if(v===2&&floorIdx===1){
          let doorFaceX=0,doorFaceZ=0,doorYaw=0;
          for(const[dc,dr,ry] of [[0,-1,0],[0,1,Math.PI],[-1,0,Math.PI/2],[1,0,-Math.PI/2]]){
            const nr=r+dr,nc=c+dc;
            if(nr<0||nr>=dR||nc<0||nc>=dC||map[nr][nc]===0){doorFaceX=dc;doorFaceZ=dr;doorYaw=ry;break;}
          }
          const eDoor=new THREE.Group();
          const eDb=new THREE.Mesh(new THREE.BoxGeometry(.85,2.8,.1),MAT.door);eDoor.add(eDb);
          for(let i=0;i<3;i++){const bar=new THREE.Mesh(new THREE.BoxGeometry(.04,2.6,.05),new THREE.MeshLambertMaterial({color:0x888888}));bar.position.set(-.28+i*.28,0,.07);eDoor.add(bar);}
          eDoor.position.set(c+doorFaceX*.45,baseY+1.4,r+doorFaceZ*.45);eDoor.rotation.y=doorYaw;dScene.add(eDoor);
          const eD=new THREE.Mesh(new THREE.CircleGeometry(.45,10),new THREE.MeshBasicMaterial({color:0xc8e88a,transparent:true,opacity:.3,side:THREE.DoubleSide}));
          eD.rotation.x=-Math.PI/2;eD.position.set(c,baseY+.02,r);dScene.add(eD);
          const eGl=new THREE.PointLight(0x88ff44,1.2,5);eGl.position.set(c,baseY+.8,r);dScene.add(eGl);
        }
        if(v===3&&floorIdx===1&&c===gen.stairC&&r===gen.stairR){if(gen.flights){gen.flights.forEach(buildFlight);if(gen.yard)buildYard();}else buildStairwell(c,r,stairMat);} // v80 S8 — climbable spiral; S599 — or the hall's straight flight
        if(false){ // v61 pit-and-teleport stair, superseded
          // ── SPIRAL STAIRCASE ─────────────────────────────────
          // Contained within a single cell. A central stone pole with treads
          // radiating outward in a helix. Floor 1 = pit in floor, spiral goes down.
          // Floor 2 = spiral rises from floor to ceiling hole.
          const poleR=0.08,stepW=0.38,stepThick=0.07,stepCount=12;
          const totalH=FLOOR2_Y;
          const stepHGap=totalH/stepCount;

          if(floorIdx===1){
            // Stone frame around hole
            const frmMat=new THREE.MeshLambertMaterial({color:new THREE.Color(th.wallCol).lerp(new THREE.Color(0xbbbbbb),.12)});
            [[0,-0.44,0.88,0.12],[0,0.44,0.88,0.12],[-0.44,0,0.12,0.88],[0.44,0,0.12,0.88]].forEach(([ox,oz,fw,fd])=>{
              const plank=new THREE.Mesh(new THREE.BoxGeometry(fw,0.12,fd),frmMat);
              plank.position.set(c+ox,baseY+0.06,r+oz);dScene.add(plank);
            });
            // Dark pit floor
            const darkFloor=new THREE.Mesh(new THREE.PlaneGeometry(0.74,0.74),new THREE.MeshBasicMaterial({color:0x06040a}));
            darkFloor.rotation.x=-Math.PI/2;darkFloor.position.set(c,baseY-0.02,r);dScene.add(darkFloor);
            // Pit walls
            const pitWallMat=new THREE.MeshLambertMaterial({color:new THREE.Color(th.wallCol).lerp(new THREE.Color(0x000000),.5),side:THREE.DoubleSide});
            [[0,-0.37,0.74,1.4,0],[0,0.37,0.74,1.4,Math.PI],[-0.37,0,1.4,0.74,Math.PI/2],[0.37,0,1.4,0.74,-Math.PI/2]].forEach(([ox,oz,w,h,ry])=>{
              const pw=new THREE.Mesh(new THREE.PlaneGeometry(w,h),pitWallMat);
              pw.position.set(c+ox,baseY-h/2,r+oz);pw.rotation.y=ry;dScene.add(pw);
            });
            // Central pole descending into pit
            const pole=new THREE.Mesh(new THREE.CylinderGeometry(poleR,poleR,totalH+0.3,8),stairMat);
            pole.position.set(c,baseY-totalH/2+0.15,r);dScene.add(pole);
            // Spiral treads descending
            for(let s=0;s<stepCount;s++){
              const angle=(s/stepCount)*Math.PI*3;
              const sy=baseY-s*stepHGap-stepThick/2;
              const tread=new THREE.Mesh(new THREE.BoxGeometry(stepW,stepThick,stepW*0.42),stairMat);
              tread.position.set(c+Math.cos(angle)*stepW*0.52,sy,r+Math.sin(angle)*stepW*0.52);
              tread.rotation.y=-angle;dScene.add(tread);
            }
            // Purple glow from below
            const downGl=new THREE.PointLight(0xcc66ff,2.2,5);downGl.position.set(c,baseY-1.2,r);dScene.add(downGl);
            TORCHES.push({l:downGl,fl:null,ph:Math.random()*Math.PI*2});
            // Indicator disc + downward chevrons
            const disc1=new THREE.Mesh(new THREE.CircleGeometry(0.40,12),new THREE.MeshBasicMaterial({color:0xcc66ff,transparent:true,opacity:0.3,side:THREE.DoubleSide}));
            disc1.rotation.x=-Math.PI/2;disc1.position.set(c,baseY+0.03,r);dScene.add(disc1);
            const arrMat=new THREE.MeshBasicMaterial({color:0xcc66ff,transparent:true,opacity:0.9});
            for(let a=0;a<3;a++){
              const ay=baseY+0.5+a*0.22;
              [[-0.14,0.14]].forEach(ox=>{
                const arm=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.04,0.04),arrMat);
                arm.rotation.z=ox<0?Math.PI/5:-Math.PI/5;
                arm.position.set(c+ox,ay,r-0.25);dScene.add(arm);
              });
            }
          } else {
            // Floor 2: spiral rises from floor to ceiling, ceiling has a hole above
            // Central pole full floor height
            const pole=new THREE.Mesh(new THREE.CylinderGeometry(poleR,poleR,FLOOR_HEIGHT,8),stairMat);
            pole.position.set(c,baseY+FLOOR_HEIGHT/2,r);dScene.add(pole);
            // Spiral treads ascending
            for(let s=0;s<stepCount;s++){
              const angle=(s/stepCount)*Math.PI*3;
              const sy=baseY+(s/stepCount)*FLOOR_HEIGHT+stepThick/2;
              const tread=new THREE.Mesh(new THREE.BoxGeometry(stepW,stepThick,stepW*0.42),stairMat);
              tread.position.set(c+Math.cos(angle)*stepW*0.52,sy,r+Math.sin(angle)*stepW*0.52);
              tread.rotation.y=-angle;dScene.add(tread);
            }
            // Ceiling hole — 4 border strips
            const ceilMat=MAT.ceil;
            const hR=0.37;
            [[-(0.5+hR/2),0,1-hR*2,1],[(0.5+hR/2),0,1-hR*2,1],
             [0,-(0.5+hR/2),hR*2,1-hR*2],[0,(0.5+hR/2),hR*2,1-hR*2]].forEach(([ox,oz,fw,fd])=>{
              const cp=new THREE.Mesh(new THREE.PlaneGeometry(fw,fd),ceilMat);
              cp.rotation.x=Math.PI/2;cp.position.set(c+ox,baseY+FLOOR_HEIGHT,r+oz);dScene.add(cp);
            });
            // Gold light from above
            const upGl=new THREE.PointLight(0xffcc66,2.0,6);upGl.position.set(c,baseY+FLOOR_HEIGHT-0.3,r);dScene.add(upGl);
            TORCHES.push({l:upGl,fl:null,ph:Math.random()*Math.PI*2});
            // Indicator disc + upward chevrons
            const disc2=new THREE.Mesh(new THREE.CircleGeometry(0.40,12),new THREE.MeshBasicMaterial({color:0xffcc66,transparent:true,opacity:0.3,side:THREE.DoubleSide}));
            disc2.rotation.x=-Math.PI/2;disc2.position.set(c,baseY+0.03,r);dScene.add(disc2);
            const arrMat2=new THREE.MeshBasicMaterial({color:0xffcc66,transparent:true,opacity:0.9});
            for(let a=0;a<3;a++){
              const ay=baseY+0.25+a*0.22;
              [[-0.14,0.14]].forEach(ox=>{
                const arm=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.04,0.04),arrMat2);
                arm.rotation.z=ox<0?-Math.PI/5:Math.PI/5;
                arm.position.set(c+ox,ay,r-0.25);dScene.add(arm);
              });
            }
          }
        }
      }
    }
    for(let r=0;r<dR;r++)for(let c=0;c<dC;c++){
      const v=map[r][c];
      if(v===1&&Math.random()<.038){
        // Find nearest wall direction to mount sconce on
        let wallDx=0,wallDz=0;
        for(const[dc2,dr2] of [[0,-1],[0,1],[-1,0],[1,0]]){
          if(map[r+dr2]?.[c+dc2]===0){wallDx=dc2;wallDz=dr2;break;}
        }
        if(wallDx!==0||wallDz!==0){
          // Wall face is at c+wallDx*0.5, r+wallDz*0.5
          const faceX=c+wallDx*0.5;
          const faceZ=r+wallDz*0.5;
          const mountY=baseY+1.65;
          const stickMat=new THREE.MeshLambertMaterial({color:0x5c3a14});
          const emberMat=new THREE.MeshBasicMaterial({color:0xff9922});
          const ironMat=new THREE.MeshLambertMaterial({color:0x383028});

          // ── Bracket arm: horizontal rod from wall face into room ─
          const armLen=0.22;
          const armCX=faceX-wallDx*(armLen/2);
          const armCZ=faceZ-wallDz*(armLen/2);
          const arm=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,armLen,5),ironMat);
          // Arm points along the wall-normal (X or Z), so rotate it horizontal
          if(wallDx!==0) arm.rotation.z=Math.PI/2;
          else           arm.rotation.x=Math.PI/2;
          arm.position.set(armCX,mountY,armCZ);
          dScene.add(arm);

          // ── Wall mount plate ──────────────────────────────────
          const plateW=wallDx!==0?0.06:0.22;
          const plateD=wallDz!==0?0.06:0.22;
          const plate=new THREE.Mesh(new THREE.BoxGeometry(plateW,0.20,plateD),ironMat);
          plate.position.set(faceX-wallDx*0.04,mountY,faceZ-wallDz*0.04);
          dScene.add(plate);

          // ── Torch body: vertical cylinder at tip of arm ───────
          const tipX=faceX-wallDx*(armLen+0.02);
          const tipZ=faceZ-wallDz*(armLen+0.02);
          const torchBodyH=0.28;
          const torchBody=new THREE.Mesh(new THREE.CylinderGeometry(.03,.04,torchBodyH,6),stickMat);
          torchBody.position.set(tipX,mountY+torchBodyH*0.5,tipZ);
          dScene.add(torchBody);

          // ── Flame/ember at top of torch body ─────────────────
          const flameY=mountY+torchBodyH+0.06;
          const ember=new THREE.Mesh(new THREE.SphereGeometry(.052,5,4),emberMat);
          ember.position.set(tipX,flameY,tipZ);
          dScene.add(ember);

          // ── Cup/ring holding torch to arm ─────────────────────
          const cup=new THREE.Mesh(new THREE.CylinderGeometry(.045,.035,0.07,6,1,true),ironMat);
          cup.position.set(tipX,mountY+0.04,tipZ);
          dScene.add(cup);

          // ── Point light at flame ──────────────────────────────
          const l=new THREE.PointLight(0xff8833,1.7,8);
          l.position.set(tipX,flameY+0.06,tipZ);
          dScene.add(l);
          TORCHES.push({l,fl:ember,ph:Math.random()*Math.PI*2});
        }
      }
      // v61g4: random treasure-cell mood lights — cave dungeons only.
      // Forts get chandeliers (single architectural light per room) instead,
      // so the random per-cell lights would be visually noisy.
      if(!isFort&&v===6&&Math.random()<.3){const l=new THREE.PointLight(0xffaa44,0.9,5);l.position.set(c,baseY+2.0,r);dScene.add(l);const fl=new THREE.Mesh(new THREE.SphereGeometry(.05,5,5),new THREE.MeshBasicMaterial({color:0xffcc88}));fl.position.copy(l.position);dScene.add(fl);TORCHES.push({l,fl,ph:Math.random()*Math.PI*2});}
      if(v===1&&Math.random()<.12){
        // S191 — the theme's clutter on the shape kit, into the floor's one props mesh (it was a mesh a piece, boxes)
        const cx2=c+(Math.random()-.5)*.5,cz2=r+(Math.random()-.5)*.5;const R_=Math.random;
        if(th.clutter==='bones'){const bone=0xc8c0a0;
          for(let b=0;b<3;b++){const L=.2+R_()*.12;addP(SK.limb(L,.02,.016),bone,cx2+(R_()-.5)*.3,baseY+.022,cz2+(R_()-.5)*.3,R_()*Math.PI,Math.PI/2,0);}
          if(R_()<.4){const sx=cx2+.1,sz=cz2-.05,ry=R_()*Math.PI*2;addP(SK.ball(.085,10,8),bone,sx,baseY+.08,sz,ry,0,0,1,.85,1.12);
            for(const e of [-1,1])addP(SK.ball(.024,6,5),0x1a1612,sx+Math.cos(ry)*e*.035+Math.sin(ry)*.075,baseY+.095,sz-Math.sin(ry)*e*.035+Math.cos(ry)*.075,0);
            addP(SK.rbox(.09,.035,.06,.012,2),bone,sx+Math.sin(ry)*.06,baseY+.02,sz+Math.cos(ry)*.06,ry);}
        } else if(th.clutter==='junk'){const wood=0x5a4020;
          for(let k=0;k<2+Math.floor(R_()*3);k++)addP(SK.rbox(.26+R_()*.14,.025,.07,.01,1),wood*1,cx2+(R_()-.5)*.35,baseY+.015+k*.02,cz2+(R_()-.5)*.35,R_()*Math.PI,0,(R_()-.5)*.2);
          if(R_()<.5){const pot=SK.lathe([[0,0],[.07,0],[.1,.06],[.09,.13],[.05,.17],[.055,.2],[0,.2]],10);addP(pot,0x7a5a3a,cx2+.15,baseY,cz2+.1,0,(R_()<.5?Math.PI/2:0),0);}
        } else if(th.clutter==='chains'){
          // chains hang from the ceiling (v61g7); now links of one mesh with the rest of the props
          const col=R_()<.5?0x383838:0x5a5048,ceilingY=baseY+FLOOR_HEIGHT,chainLen=1.5+R_()*1.4,n=Math.max(4,Math.floor(chainLen/.09));
          for(let seg=0;seg<n;seg++)addP(SK.torus(.035,.012,7,5),col,cx2,ceilingY-.05-seg*.09,cz2,seg%2?Math.PI/2:0,0,0);
        } else heap(cx2,cz2,2+Math.floor(R_()*3),.35);
      }
      // v61g7: per-cell barrel spawn replaced with per-room cluster spawn
      // after the per-cell loop completes. See "container clusters" pass below.
    }
    if(props.length)dScene.add(dunMerge(props));
    // ── CONTAINER CLUSTERS (v61g7) ─────────────────────────────────
    // Per-room cluster spawn. ~50% of rooms get a cluster of 2-4 containers
    // pushed into one of the room's corners. Each container in a cluster
    // rolls 50/50 barrel vs crate — clusters mix. Replaces the pre-v61g7
    // per-cell 4.5%-chance scatter. Containers are bigger now (0.22u radius
    // / 0.5u box) to read at proper "lootable furniture" scale rather than
    // "decorative trinket."
    //
    // Both mesh paths push into BARRELS[] with the same fields — downstream
    // open / loot / despawn code treats them identically. Only displayName
    // ("Barrel" / "Crate") differs in the loot-panel title.
    const buildBarrel = (group) => { // S200 — the kit's barrel (it was three cylinders)
      const B=kitBarrel(1,th.clutter==='junk' ? 0x5a3a10 : 0x3a2810);group.add(B.body);group.add(B.top);B.top.position.y=.575;return {top:B.top};
    };
    const buildCrate = (group) => {
      const crateMat = new THREE.MeshLambertMaterial({color: th.clutter==='junk' ? 0x6b4820 : 0x4a3418});
      const trimMat = new THREE.MeshLambertMaterial({color: 0x2a1808});
      // Crate body: 0.5u cube. Sits flush to floor.
      const crate = new THREE.Mesh(SK.rbox(.5, .5, .5, .035, 2), crateMat); // S191 — the kit's rounded box
      crate.position.set(0, .25, 0);
      group.add(crate);
      // Four thin plank trim strips around the top edge — reads as "the lid frame."
      const trimY = 0.49;
      const trimT = 0.04;  // trim thickness
      const trimW = 0.5;
      const trimD = 0.06;  // trim depth (how far from edge)
      // N/S trim (along X axis)
      for(const tz of [-trimW/2 + trimD/2, trimW/2 - trimD/2]){
        const t = new THREE.Mesh(new THREE.BoxGeometry(trimW, trimT, trimD), trimMat);
        t.position.set(0, trimY, tz);
        group.add(t);
      }
      // E/W trim (along Z axis) — slightly shorter so corners don't overlap
      for(const tx of [-trimW/2 + trimD/2, trimW/2 - trimD/2]){
        const t = new THREE.Mesh(new THREE.BoxGeometry(trimD, trimT, trimW - trimD*2), trimMat);
        t.position.set(tx, trimY, 0);
        group.add(t);
      }
      // top pop-off mesh placeholder — barrel "opens" by raising .top; crates
      // mimic the same affordance for consistency. Place a thin lid slab.
      const lid = new THREE.Mesh(new THREE.BoxGeometry(.5, .05, .5), trimMat);
      lid.position.set(0, .53, 0);
      group.add(lid);
      return {top: lid};
    };
    const spawnContainer = (wx, wz, isCrate) => {
      const group = new THREE.Group();
      const {top} = isCrate ? buildCrate(group) : buildBarrel(group);
      group.position.set(wx, baseY, wz);
      // Subtle random rotation around Y so clusters don't all face the same way.
      group.rotation.y = Math.random() * Math.PI * 2;
      dScene.add(group);
      const ds = currentPortal ? currentPortal.diffScale : null;
      const th2 = currentPortal ? currentPortal.theme : null;
      // Loot table identical — both use 'barrel' rolls. Crates aren't a
      // separate loot tier; they're a sibling prop with the same payout.
      const id = `${dKey}:barrel:${_nBarrel++}`; // S514 — its id, <seed>:<floor>:barrel:<n> (co-op rules); the loot adds the day
      const items = rollContainerLoot('barrel', ds, th2, undefined, `${id}:${lootDay()}`);
      BARRELS.push({
        id, x: wx, z: wz, floor: floorIdx, opened: false, items,
        displayName: isCrate ? 'Crate' : 'Barrel',
        mesh: group, top,
      });
    };
    // v61g8: kind-aware cluster spawn. Reads room.kind (set at generation
    // time by the fort interior generators). Ceremonial rooms get NO
    // clusters — they're curated by decorateFortRoom. Utility rooms get a
    // preferred corner that doesn't collide with their fixed props.
    // Storerooms get clusters in ALL corners — that's the room's whole
    // identity. Caves and untagged rooms still get the original 50% chance.
    //
    // Kind → cluster behavior:
    //   great_hall     → no cluster (banquet table fills the middle)
    //   lords_chamber  → no cluster (bed + side table fill the room)
    //   chapel         → no cluster (altar + pews fill the room)
    //   courtyard_hall → no cluster (combat space, brazier center only)
    //   barracks       → 1 cluster, SW or SE corner (cots line E/W walls)
    //   kitchen        → 1 cluster, SE corner (hearth N + table center)
    //   armory         → 1 cluster, SE corner (racks N/S walls)
    //   storeroom      → 4 clusters, one per corner (pantry register)
    //   guardroom      → 1 cluster, SW corner (table+chair against N)
    //   null/untagged  → original 50% any-corner behavior (cave rooms)
    const KIND_CLUSTER_RULES = {
      great_hall: {corners: [], forceAll: false},
      pillared_hall: {corners: [], forceAll: false},
      tower: {corners: [], forceAll: false},
      lords_chamber: {corners: [], forceAll: false},
      chapel: {corners: [], forceAll: false},
      courtyard_hall: {corners: [], forceAll: false},
      barracks: {corners: ['SW', 'SE'], forceAll: false},
      kitchen: {corners: ['SE'], forceAll: false},
      armory: {corners: ['SE'], forceAll: false},
      storeroom: {corners: ['NW', 'NE', 'SW', 'SE'], forceAll: true},
      guardroom: {corners: ['SW'], forceAll: false},
      // v61ga: library — no clusters. Bookshelves fill the walls and a
      // dedicated chest spawn handles loot.
      library: {corners: [], forceAll: false},
    };
    // v61gb: barracks override — the v61gb wide-bed-row layout fills BOTH
    // W and E walls with cot rows running N-S. SW and SE corners (the
    // v61g8 default) now collide with bed footprints. Move the cluster
    // to a foot-end center position between the two rows of cots.
    KIND_CLUSTER_RULES.barracks = {corners: ['S_MID'], forceAll: false};
    for(const room of floorRooms){
      // Skip very small rooms regardless of kind.
      if(room.w < 4 || room.h < 4) continue;
      // Corner positions — derived once per room.
      const inset = 0.9;
      const cornerMap = {
        NW: {x: room.x + inset,             z: room.y + inset},
        NE: {x: room.x + room.w - 1 - inset, z: room.y + inset},
        SW: {x: room.x + inset,             z: room.y + room.h - 1 - inset},
        SE: {x: room.x + room.w - 1 - inset, z: room.y + room.h - 1 - inset},
        // v61gb: foot-end center positions used by barracks (clusters between
        // the W and E bed rows).
        N_MID: {x: room.x + room.w/2 - 0.5,  z: room.y + inset},
        S_MID: {x: room.x + room.w/2 - 0.5,  z: room.y + room.h - 1 - inset},
      };
      // Determine which corners get clusters this room.
      let cornersToFill;
      const rule = KIND_CLUSTER_RULES[room.kind];
      if(rule){
        if(rule.corners.length === 0) continue;  // ceremonial — no clusters
        if(rule.forceAll){
          cornersToFill = rule.corners;          // storeroom — all listed corners
        } else {
          // Pick one corner from the allowed list at random.
          cornersToFill = [rule.corners[Math.floor(dPlace() * rule.corners.length)]];
        }
      } else {
        // Untagged room (cave) — original 50% chance, any corner.
        if(dPlace() > 0.5) continue;
        const allCorners = ['NW','NE','SW','SE'];
        cornersToFill = [allCorners[Math.floor(dPlace() * 4)]];
      }
      // Spawn cluster at each designated corner.
      for(const cornerName of cornersToFill){
        const anchor = cornerMap[cornerName];
        // Storerooms get smaller clusters per corner (2-3) so 4×3 = ~10
        // total stays consistent with single-cluster rooms. Other kinds
        // get the standard 2-4.
        const count = rule && rule.forceAll
          ? (2 + Math.floor(dPlace() * 2))
          : (2 + Math.floor(dPlace() * 3));
        let placed = 0, attempts = 0;
        const maxAttempts = count * 4;
        while(placed < count && attempts < maxAttempts){
          attempts++;
          const jx = (dPlace() - 0.5) * 1.2;
          const jz = (dPlace() - 0.5) * 1.2;
          const wx = anchor.x + jx;
          const wz = anchor.z + jz;
          const cellCol = Math.floor(wx + 0.5), cellRow = Math.floor(wz + 0.5);
          if(cellCol < 0 || cellCol >= dC || cellRow < 0 || cellRow >= dR) continue;
          const cellV = map[cellRow][cellCol];
          if(cellV !== 1 && cellV !== 6) continue;
          let tooClose = false;
          for(const b of BARRELS){
            if(b.floor !== floorIdx) continue;
            // v61gf: bumped 0.55 → 0.70. At 0.55 with 0.5u crates and random
            // Y-rotation, diagonally-oriented crates read as touching.
            if(Math.hypot(b.x - wx, b.z - wz) < 0.70){ tooClose = true; break; }
          }
          if(tooClose) continue;
          const isCrate = dPlace() < 0.5;
          spawnContainer(wx, wz, isCrate);
          placed++;
        }
      }
    }
    // Chest spawn — two passes:
    //  1. Dead-end cells (1 open neighbor): classic tucked-away chest
    //  2. Corner cells (2 open neighbors in an L-shape): more scattered placement for dungeon-wide looting
    // Visual is the shared buildChestShell so chests are indistinguishable from Mimics until the player approaches.
    // Mimic spawns happen separately via ENEMIES — we don't block on those here, but mimics also use this visual so a
    // "chest" in any corner could be a disguised Mimic (bait gameplay). Chests already spawned are skipped by coord.
    const chestAtCell = (c,r) => CHESTS.some(ch=>ch.x===c&&ch.z===r&&ch.floor===floorIdx);
    const spawnChest = (c, r, treasure=false, lootKind=null) => {
      const group = new THREE.Group();
      const sc = treasure ? 0.85 : 0.75;
      const {lid} = buildChestShell(group, sc, treasure?0xaa8030:0x8b5a2b);
      group.position.set(c, baseY, r);
      dScene.add(group);
      const ds = currentPortal?currentPortal.diffScale:null;
      const th2 = currentPortal?currentPortal.theme:null;
      // v61ga: lootKind override lets callers force a specific loot pool
      // (e.g. 'library_chest') without changing the visible chest mesh.
      // Default behavior unchanged — treasure → 'treasure' pool, else 'chest'.
      const poolKind = lootKind || (treasure?'treasure':'chest');
      const id=`${dKey}:chest:${_nChest++}`; // S514 — its id, <seed>:<floor>:chest:<n>
      const items = rollContainerLoot(poolKind, ds, th2, undefined, `${id}:${lootDay()}`);
      const chObj={id,x:c,z:r,opened:false,lid,treasure,floor:floorIdx,mesh:group,items,displayName:treasure?'Treasure Chest':'Chest'};
      if(treasure||chestLockedAt(c,r,floorIdx))lockChest(chObj); // S150
      CHESTS.push(chObj);
    };
    // Pass 1: dead-ends INSIDE rooms (tucked into room corners, not corridor stubs)
    for(let r=0;r<dR;r++)for(let c=0;c<dC;c++){
      if(map[r][c]!==1)continue;
      if(!inRoom(c,r))continue;
      const open=[[0,1],[0,-1],[1,0],[-1,0]].filter(([dc,dr])=>{const vv=map[r+dr]?.[c+dc];return vv>=1;}).length;
      if(open===1 && !chestAtCell(c,r)) spawnChest(c, r, false);
    }
    // Pass 2: L-corners INSIDE rooms. 8% chance per eligible cell, skipping entrance + stair areas.
    for(let r=0;r<dR;r++)for(let c=0;c<dC;c++){
      if(map[r][c]!==1)continue;
      if(!inRoom(c,r))continue;
      if(Math.hypot(c-dEntranceX, r-dEntranceZ) < 3) continue; // entrance clearance
      if(c===dStairC && r===dStairR) continue;
      const open=[[0,1],[0,-1],[1,0],[-1,0]].filter(([dc,dr])=>{const vv=map[r+dr]?.[c+dc];return vv>=1;}).length;
      if(open!==2) continue;
      // L-corner: the two open neighbors are adjacent, not opposite
      const openDirs=[[0,1],[0,-1],[1,0],[-1,0]].filter(([dc,dr])=>{const vv=map[r+dr]?.[c+dc];return vv>=1;});
      const isOpposite = openDirs.length===2 && (openDirs[0][0]+openDirs[1][0]===0 && openDirs[0][1]+openDirs[1][1]===0);
      if(isOpposite) continue; // straight corridor — not a corner
      if(dPlace() < 0.08 && !chestAtCell(c,r)) spawnChest(c, r, false);
    }
    if(isFort){
      // v61ga: storeroom + library chests. Each storeroom gets 1-2 chests
      // placed at central, walkable positions (1 chest 60% of the time,
      // 2 chests 40%).
      // v61gh: libraries no longer get a chest — bookshelves themselves
      // are now lootable containers (see decorateFortRoom library branch).
      // The library_chest loot pool is still used; each shelf rolls
      // against it via the new library_shelf container kind.
      for(const room of gen.rooms){
        if(room.kind !== 'storeroom') continue;
        const chestCount = dPlace() < 0.6 ? 1 : 2;
        // Candidate cells: interior of room, excluding the 1-cell ring at
        // the perimeter (where corner clusters live), excluding any cell
        // adjacent to another chest, and excluding cells too close to the
        // entrance.
        const candidates = [];
        for(let rr = room.y + 2; rr < room.y + room.h - 2; rr++){
          for(let cc = room.x + 2; cc < room.x + room.w - 2; cc++){
            if(map[rr]?.[cc] !== 1 && map[rr]?.[cc] !== 6) continue;
            if(chestAtCell(cc, rr)) continue;
            candidates.push([cc, rr]);
          }
        }
        // Shuffle candidates, pick up to chestCount
        for(let i = candidates.length - 1; i > 0; i--){
          const j = Math.floor(dPlace() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        let placed = 0;
        for(const [cc, rr] of candidates){
          if(placed >= chestCount) break;
          // Skip cells adjacent to a chest we already placed (visual spacing).
          let adjToChest = false;
          for(const ch of CHESTS){
            if(ch.floor !== floorIdx) continue;
            if(Math.abs(ch.x - cc) + Math.abs(ch.z - rr) <= 1){ adjToChest = true; break; }
          }
          if(adjToChest) continue;
          spawnChest(cc, rr, false);
          placed++;
        }
      }
      // v61g4: fort interiors get ONE treasure chest per treasure room,
      // placed at the back of the room (far from the door). Cave-style
      // 4x4 clustering would produce ~10 chests in the Great Hall —
      // overkill. With one chest, the chest is a clear destination.
      for(const room of gen.rooms){
        // Check if room contains treasure floor (v===6).
        let hasTreasure = false;
        checkT: for(let rr = room.y; rr < room.y + room.h; rr++){
          for(let cc = room.x; cc < room.x + room.w; cc++){
            if(map[rr]?.[cc] === 6){ hasTreasure = true; break checkT; }
          }
        }
        if(!hasTreasure) continue;
        // Place treasure chest at the room cell farthest from the entry,
        // among the treasure-floor cells of this room. This naturally
        // puts the chest at the back of the room.
        let bestCell = null, bestDist = -1;
        for(let rr = room.y; rr < room.y + room.h; rr++){
          for(let cc = room.x; cc < room.x + room.w; cc++){
            if(map[rr]?.[cc] !== 6) continue;
            const d = Math.hypot(cc - dEntranceX, rr - dEntranceZ);
            if(d > bestDist){ bestDist = d; bestCell = [cc, rr]; }
          }
        }
        if(bestCell && !chestAtCell(bestCell[0], bestCell[1])){
          spawnChest(bestCell[0], bestCell[1], true);
        }
      }
    } else {
      // Cave dungeons: existing 4x4 cluster algorithm.
      const trGroups={};
      for(let r=0;r<dR;r++)for(let c=0;c<dC;c++){if(map[r][c]===6){const key=`${Math.floor(r/4)}_${Math.floor(c/4)}`;if(!trGroups[key])trGroups[key]={xs:[],zs:[]};trGroups[key].xs.push(c);trGroups[key].zs.push(r);}}
      Object.values(trGroups).forEach(g=>{
        const cx=Math.round(g.xs.reduce((a,b)=>a+b,0)/g.xs.length);const cz=Math.round(g.zs.reduce((a,b)=>a+b,0)/g.zs.length);
        if(map[cz]?.[cx]!==6)return;
        // Treasure chest — shared shell with a larger scale and richer tint. Guaranteed non-empty + tripled gold.
        if(!chestAtCell(cx,cz)) spawnChest(cx, cz, true);
      });
    }
  }

  // v61g2: fort-only continuous wall-segment pass. Scans the map for runs
  // of adjacent walkable cells that share a wall face on the same side,
  // and emits ONE PlaneGeometry per run instead of one box per void cell.
  // This eliminates the cubic facets that make the cave dungeon walls
  // read as "stamped grid" — fort interior walls become continuous
  // planar architecture in the church/castle interior style.
  //
  // Two passes:
  //   - Horizontal edges (boundaries between row r-1 and row r): emit
  //     walls facing N or S, depending on which side is walkable.
  //   - Vertical edges (boundaries between col c-1 and col c): emit
  //     walls facing E or W.
  //
  // Each pass walks runs and emits a single plane spanning the full run
  // length. Texture repeat is set per-segment so block-courses tile at
  // 1 unit per grid cell.
  //
  // This function is local to buildDungeon (closure-captures fortWallMat,
  // dScene, etc.) and only runs when isFort is true.
  function renderFortWalls(map, baseY){
    const ceilH = FLOOR_HEIGHT;
    const wallY = baseY + ceilH/2;
    const isWalkable = (c, r) => {
      if(r<0||r>=dR||c<0||c>=dC) return false;
      const v = map[r][c];
      return v >= 1;  // 1=floor, 2=entrance, 4/5=door, 6=treasure, 7=hallway
    };
    const isVoid = (c, r) => {
      if(r<0||r>=dR||c<0||c>=dC) return true; // off-map counts as void (edge walls)
      return map[r][c] === 0;
    };

    // Helper — emit a single wall plane spanning a run.
    // (cx, cz) is the plane's CENTER in world coords; len is the run length;
    // axis is 'horizontal' (the wall runs along the X axis, plane normal is
    // along ±Z) or 'vertical' (wall runs along Z, normal along ±X).
    // facing is +1 or -1: which side the wall normal points.
    function emitWall(cx, cz, len, axis, facing){
      const planeGeom = new THREE.PlaneGeometry(len, ceilH);
      // Clone the wall material with per-segment texture repeat so the
      // block-courses pattern tiles at 1 unit per grid cell. PlaneGeometry
      // UVs are 0..1 by default; we want them to range 0..len in the long
      // direction so the texture repeats `len` times across the plane.
      // v61g3: side: THREE.DoubleSide. Single-sided planes were invisible
      // from their back side, which let the player see through walls
      // diagonally into adjacent rooms (the v61g2 transparent-walls bug).
      // DoubleSide costs nothing visually here — back side gets the same
      // texture which is rarely seen and reads correctly when it is.
      const mat = fortWallMat.clone();
      mat.map = fortWallMat.map.clone();
      mat.map.needsUpdate = true;
      mat.map.wrapS = THREE.RepeatWrapping;
      mat.map.wrapT = THREE.RepeatWrapping;
      mat.map.repeat.set(len, 1);
      mat.side = THREE.DoubleSide;
      const m = new THREE.Mesh(planeGeom, mat);
      m.position.set(cx, wallY, cz);
      if(axis === 'horizontal'){
        // Plane normal along ±Z. facing=+1 means normal pointing +Z (south).
        // Default PlaneGeometry has normal along +Z; rotate by π to face -Z.
        m.rotation.y = facing > 0 ? 0 : Math.PI;
      } else {
        // Plane normal along ±X. facing=+1 means normal pointing +X (east).
        // Rotate by ±π/2 from the +Z default.
        m.rotation.y = facing > 0 ? -Math.PI/2 : Math.PI/2;
      }
      dScene.add(m);
    }

    // ── Horizontal edges (walls running E-W, normal pointing N or S) ──
    // For each interior horizontal grid line (between row r-1 and row r),
    // walk west-to-east, identifying runs of consecutive columns where
    // the edge is wall-facing-south (void above, walkable below) or
    // wall-facing-north (walkable above, void below).
    for(let r = 0; r <= dR; r++){
      // 'state' = null | 'south' | 'north' tracks the current run type.
      let runState = null;
      let runStart = -1;
      const flushRun = (cEnd) => {
        if(runState === null) return;
        const len = cEnd - runStart;
        const cxWorld = runStart + len/2 - 0.5;
        const czWorld = r - 0.5;
        // 'south' = wall face visible from the south side (player below
        // looking up at z=r-0.5 wall). Normal points +Z.
        const facing = (runState === 'south') ? 1 : -1;
        emitWall(cxWorld, czWorld, len, 'horizontal', facing);
        runState = null;
        runStart = -1;
      };
      for(let c = 0; c < dC; c++){
        const above = isVoid(c, r-1);   // is the cell above this edge void?
        const below = isVoid(c, r);     // is the cell below this edge void?
        const aboveWalkable = isWalkable(c, r-1);
        const belowWalkable = isWalkable(c, r);
        // Edge needs a wall plane only if exactly one side is walkable
        // and the other is void.
        let edgeType = null;
        if(above && belowWalkable) edgeType = 'south'; // void above, walkable below — wall faces south
        else if(aboveWalkable && below) edgeType = 'north'; // walkable above, void below — wall faces north
        if(edgeType !== runState){
          flushRun(c);
          if(edgeType !== null){
            runState = edgeType;
            runStart = c;
          }
        }
      }
      flushRun(dC);
    }

    // ── Vertical edges (walls running N-S, normal pointing E or W) ──
    // For each interior vertical grid line (between col c-1 and col c),
    // walk north-to-south, identifying runs of consecutive rows where
    // the edge is wall-facing-east (void west, walkable east) or
    // wall-facing-west (walkable west, void east).
    for(let c = 0; c <= dC; c++){
      let runState = null;
      let runStart = -1;
      const flushRun = (rEnd) => {
        if(runState === null) return;
        const len = rEnd - runStart;
        const cxWorld = c - 0.5;
        const czWorld = runStart + len/2 - 0.5;
        const facing = (runState === 'east') ? 1 : -1;
        emitWall(cxWorld, czWorld, len, 'vertical', facing);
        runState = null;
        runStart = -1;
      };
      for(let r = 0; r < dR; r++){
        const west = isVoid(c-1, r);
        const east = isVoid(c, r);
        const westWalkable = isWalkable(c-1, r);
        const eastWalkable = isWalkable(c, r);
        let edgeType = null;
        if(west && eastWalkable) edgeType = 'east';   // void west, walkable east — wall faces east
        else if(westWalkable && east) edgeType = 'west'; // walkable west, void east — wall faces west
        if(edgeType !== runState){
          flushRun(r);
          if(edgeType !== null){
            runState = edgeType;
            runStart = r;
          }
        }
      }
      flushRun(dR);
    }
  }

  // v61g2: fort architectural decoration pass — runs after renderFortWalls.
  // Adds three architectural signatures of "this is interior architecture,
  // not a cave":
  //   1. Stone columns flanking each room doorway (door tiles 4 + 5)
  //   2. Wooden ceiling beams crossing hallways at regular intervals
  //   3. Wall-mounted torches along hallway walls at regular intervals
  // Reuses the module-level _intColumn and _intTorch helpers used by
  // village/Ironhaven interior builders, so the visual register matches.
  function renderFortArchitecture(map, baseY){
    const ceilH = FLOOR_HEIGHT;

    // v61g4: placeColumn wraps _intColumn AND registers the column's
    // collision footprint with DUNGEON_COLUMNS so dSolid blocks player
    // movement through it. The collision radius (0.27) is slightly
    // larger than the column base half-width (0.225) so the player
    // (radius 0.2) bumps the column cleanly rather than clipping it.
    // S601 — within m of a flight's cells or the ring's yard
    function nearOpening(x, z, m){ return (gen.flights || []).concat(gen.yard ? [{c0: gen.yard.c0, c1: gen.yard.c1, top: gen.yard.r0, bot: gen.yard.r1}] : []).some(F => x > F.c0 - m && x < F.c1 + m && z > Math.min(F.bot, F.top) - m && z < Math.max(F.bot, F.top) + m); }
    function placeColumn(x, z, h){
      // S600 — none on a flight's hole or its rim (the walkways beside the barracks' hole read as narrow halls to the passes below)
      if(nearOpening(x, z, 1.6)) return;
      _intColumn(dScene, x, z, h);
      DUNGEON_COLUMNS.push({x: x, z: z, r: 0.27});
    }

    // ── COLUMNS MOUNTED AGAINST HALLWAY WALLS ─────────────────────
    // For each hallway cell (v===7), classify the cell as trunk-style
    // (long N-S run, short E-W run), cross-hall-style (long E-W run,
    // short N-S run), or intersection (long runs in both directions).
    // Place columns half-buried in the perpendicular walls at fixed
    // intervals along the long axis.
    //
    // Why run-length-based: previously this code used "walkable neighbor
    // on each axis" but that breaks for wide hallways. A 5-cell-wide
    // trunk has walkable neighbors on all 4 sides at its center cells,
    // which the previous code mis-classified as intersection and skipped.
    // Run-length comparison correctly identifies trunk vs cross.
    const colInterval = 4;
    // Precompute run lengths for each hallway cell.
    function runLen(c, r, dx, dz){
      // Length of consecutive v===7 run starting at (c,r) in direction (dx,dz).
      let n = 0;
      let cc = c, rr = r;
      while(rr >= 0 && rr < dR && cc >= 0 && cc < dC && map[rr][cc] === 7){
        n++;
        cc += dx; rr += dz;
      }
      return n;
    }
    for(let r = 0; r < dR; r++){
      for(let c = 0; c < dC; c++){
        if(map[r][c] !== 7) continue;
        const nN = runLen(c, r-1, 0, -1);
        const nS = runLen(c, r+1, 0,  1);
        const nE = runLen(c+1, r,  1, 0);
        const nW = runLen(c-1, r, -1, 0);
        const vTotal = nN + nS + 1; // total length of N-S run through this cell
        const hTotal = nE + nW + 1; // total length of E-W run through this cell
        // Intersection threshold — if both runs are reasonably long (>3),
        // skip column placement so the trunk-cross junction stays open.
        if(vTotal > 3 && hTotal > 3) continue;
        if(vTotal > hTotal){
          // Trunk cell — long N-S run. Columns on E and W walls.
          if(r % colInterval !== 0) continue;
          // Find the E and W bounds at this row.
          let west = c, east = c;
          while(west - 1 >= 0 && map[r][west-1] === 7) west--;
          while(east + 1 < dC && map[r][east+1] === 7) east++;
          // Only emit once per row — when we hit the trunk's center cell.
          const trunkCenter = Math.floor((west + east) / 2);
          if(c !== trunkCenter) continue;
          // West wall column: half-buried in the wall at x = west - 0.5
          placeColumn(west - 0.5, r, ceilH * 0.9);
          // East wall column
          placeColumn(east + 0.5, r, ceilH * 0.9);
        } else {
          // Cross-hall cell — long E-W run. Columns on N and S walls.
          if(c % colInterval !== 0) continue;
          let north = r, south = r;
          while(north - 1 >= 0 && map[north-1][c] === 7) north--;
          while(south + 1 < dR && map[south+1][c] === 7) south++;
          const crossCenter = Math.floor((north + south) / 2);
          if(r !== crossCenter) continue;
          // N wall column
          placeColumn(c, north - 0.5, ceilH * 0.9);
          // S wall column
          placeColumn(c, south + 0.5, ceilH * 0.9);
        }
      }
    }

    // v61ga: hallway CENTER columns for wide hallways (width >= 5).
    // The wall-mounted columns above sit half-buried in the perpendicular
    // walls; this pass adds a single column on the CENTERLINE of wide
    // hallways at the same colInterval spacing. Reads as a real "nave" /
    // colonnade running down the spine of the keep's primary hall.
    // Width threshold of 5 ensures a 1-cell-wide column has 2 cells of
    // walkable space on each side — 3-wide hallways stay clear (column
    // would block them); 5-wide is the canonical fort trunk width.
    const WIDE_HALLWAY_THRESHOLD = 5;
    // Track which (axis, runId, centerLong) triples we've already emitted
    // a column for, so we only place one per colInterval step.
    const centerColEmitted = new Set();
    for(let r = 0; r < dR; r++){
      for(let c = 0; c < dC; c++){
        if(map[r][c] !== 7) continue;
        const nN = runLen(c, r-1, 0, -1);
        const nS = runLen(c, r+1, 0,  1);
        const nE = runLen(c+1, r,  1, 0);
        const nW = runLen(c-1, r, -1, 0);
        const vTotal = nN + nS + 1;
        const hTotal = nE + nW + 1;
        // Skip trunk-cross intersections — center columns at the junction
        // would clutter the focal point. Match the wall-column pass.
        if(vTotal > 3 && hTotal > 3) continue;
        if(vTotal > hTotal){
          // Trunk cell — long N-S run. Column width = E-W extent (hTotal).
          if(hTotal < WIDE_HALLWAY_THRESHOLD) continue;
          // Find E/W bounds and center X for this trunk slice.
          let west = c, east = c;
          while(west - 1 >= 0 && map[r][west-1] === 7) west--;
          while(east + 1 < dC && map[r][east+1] === 7) east++;
          const trunkCenter = Math.floor((west + east) / 2);
          if(c !== trunkCenter) continue;
          if(r % colInterval !== 0) continue;
          // S600 — not in front of, beside or beyond a flight's hole (the barracks' hall has one on its centre line)
          if(nearOpening(trunkCenter, r, 3)) continue;
          // v61gb: skip if the staircase (or any prior prop) already occupies
          // this centerline position. Prevents column/staircase z-fighting.
          if(dPropHit(trunkCenter, r)) continue;
          // Deduplicate: one column per (trunkCenter, r)
          const key = `T:${trunkCenter}:${r}`;
          if(centerColEmitted.has(key)) continue;
          centerColEmitted.add(key);
          placeColumn(trunkCenter, r, ceilH * 0.9);
        } else {
          // Cross-hall cell — long E-W run. Column width = N-S extent (vTotal).
          if(vTotal < WIDE_HALLWAY_THRESHOLD) continue;
          let north = r, south = r;
          while(north - 1 >= 0 && map[north-1][c] === 7) north--;
          while(south + 1 < dR && map[south+1][c] === 7) south++;
          const crossCenter = Math.floor((north + south) / 2);
          if(r !== crossCenter) continue;
          if(c % colInterval !== 0) continue;
          // v61gb: skip if the staircase or another prop already occupies it.
          if(dPropHit(c, crossCenter)) continue;
          const key = `C:${c}:${crossCenter}`;
          if(centerColEmitted.has(key)) continue;
          centerColEmitted.add(key);
          placeColumn(c, crossCenter, ceilH * 0.9);
        }
      }
    }

    // ── COLUMNS INSIDE LARGE ROOMS ────────────────────────────────
    // For Great Hall, Lord's Chamber, and Chapel (any room with treasure
    // floor v===6 OR any room whose footprint is >= 8 cells in either
    // dimension), place rows of columns along the long axis of the room.
    // Two parallel rows, set in from each side wall, creating a "nave"
    // effect down the center of the room.
    //
    // gen.rooms[] has each room's bounding rect. We use room.w/h to decide
    // column spacing.
    for(const room of gen.rooms){
      // Check whether room contains treasure-floor cells (v===6).
      // The Great Hall and Lord's Chamber both have v===6 floors.
      let isTreasure = false;
      checkTreasure: for(let rr = room.y; rr < room.y + room.h; rr++){
        for(let cc = room.x; cc < room.x + room.w; cc++){
          if(map[rr]?.[cc] === 6){ isTreasure = true; break checkTreasure; }
        }
      }
      // Column eligibility: treasure rooms always get columns.
      // Non-treasure rooms get columns only if larger than the standard
      // side-room footprint (>= 10 in either dimension). At 2x scale
      // this means Chapel (10x10) gets columns; Barracks etc. (8x8) don't.
      // Side rooms are utility spaces, not ceremonial — columns would
      // make them feel out of register.
      const isLargeCeremonial = (room.w >= 10 || room.h >= 10);
      if(!isTreasure && !isLargeCeremonial) continue;
      // Determine long axis. If w >= h, long axis is X (columns in rows
      // of constant X at varying Z). Otherwise long axis is Z.
      const longAxisIsX = room.w >= room.h;
      // Position the two column rows at 25% and 75% of the SHORT axis.
      // Place columns at evenly-spaced positions along the LONG axis,
      // every ~3 cells.
      const shortMin = longAxisIsX ? room.y : room.x;
      const shortMax = longAxisIsX ? room.y + room.h : room.x + room.w;
      const longMin  = longAxisIsX ? room.x : room.y;
      const longMax  = longAxisIsX ? room.x + room.w : room.y + room.h;
      const shortLen = shortMax - shortMin;
      const longLen  = longMax  - longMin;
      // Column row positions along short axis (25% and 75%)
      const colRow1 = shortMin + Math.round(shortLen * 0.25);
      const colRow2 = shortMin + Math.round(shortLen * 0.75);
      // Column count along long axis. For an 8-cell-long room: 2 cols.
      // For 10: 2-3 cols. For 16: 4 cols.
      const colCount = Math.max(2, Math.floor(longLen / 4));
      const colSpacing = longLen / (colCount + 1);
      for(let i = 1; i <= colCount; i++){
        const longPos = longMin + i * colSpacing;
        if(longAxisIsX){
          placeColumn(longPos, colRow1, ceilH * 0.9);
          placeColumn(longPos, colRow2, ceilH * 0.9);
        } else {
          placeColumn(colRow1, longPos, ceilH * 0.9);
          placeColumn(colRow2, longPos, ceilH * 0.9);
        }
      }
    }

    // ── CHANDELIERS IN TREASURE ROOMS ─────────────────────────────
    // Hang chandeliers from the ceiling in Great Hall and Lord's Chamber
    // (any room with v===6 treasure-floor cells). Chapel intentionally
    // skipped — sacred-not-noble register; chapel gets its altar candles
    // in v61g4 prop pass.
    //
    // Chandelier count scales with room area:
    //   long rooms (>= 12 cells in long axis): 2 chandeliers evenly spaced
    //   square / smaller rooms: 1 chandelier centered
    for(const room of gen.rooms){
      // Check whether room contains treasure-floor cells.
      let hasTreasure = false;
      checkTreasure2: for(let rr = room.y; rr < room.y + room.h; rr++){
        for(let cc = room.x; cc < room.x + room.w; cc++){
          if(map[rr]?.[cc] === 6){ hasTreasure = true; break checkTreasure2; }
        }
      }
      if(!hasTreasure) continue;
      const longLen = Math.max(room.w, room.h);
      const longAxisIsX = room.w >= room.h;
      if(longLen >= 12){
        // 2 chandeliers spaced along the long axis
        const shortCenter = longAxisIsX ? (room.y + room.h/2) : (room.x + room.w/2);
        const longMin = longAxisIsX ? room.x : room.y;
        for(let i = 1; i <= 2; i++){
          const longPos = longMin + (i / 3) * (longAxisIsX ? room.w : room.h);
          if(longAxisIsX){
            _intChandelier(dScene, longPos, shortCenter, baseY + ceilH);
          } else {
            _intChandelier(dScene, shortCenter, longPos, baseY + ceilH);
          }
        }
      } else {
        // 1 chandelier centered
        _intChandelier(
          dScene,
          room.x + room.w/2,
          room.y + room.h/2,
          baseY + ceilH
        );
      }
    }

    // ── RUGS IN LARGE ROOMS ───────────────────────────────────────
    // Long red runner rugs in the Great Hall and Chapel. The rug runs
    // down the long axis of each room. Reuses the church/castle rug
    // approach (red Lambert plane on the floor, positioned slightly
    // above the floor to avoid z-fighting).
    //
    // Great Hall — long center runner from door-end to back wall.
    // Chapel — center runner from door-end to back wall.
    // Lord's Chamber — skipped this ship; rug placement waits for v61g4
    // bed positioning so it aligns under the bed.
    // Side rooms — skipped this ship; they're not the "ceremonial" rooms
    // and don't read as needing rugs.
    const rugMat = new THREE.MeshLambertMaterial({color: 0x8a1818}); // crimson
    for(const room of gen.rooms){
      if(room.kind === 'pillared_hall') continue; // S599 — its middle is the flight's hole; its own decor lays the runners
      // Check whether room contains treasure floor (Great Hall or
      // Lord's Chamber). Skip Lord's Chamber by detecting if it's the
      // smaller treasure room.
      let hasTreasure = false;
      checkTreasure3: for(let rr = room.y; rr < room.y + room.h; rr++){
        for(let cc = room.x; cc < room.x + room.w; cc++){
          if(map[rr]?.[cc] === 6){ hasTreasure = true; break checkTreasure3; }
        }
      }
      // Identify rug-eligible rooms:
      //   - Great Hall: has treasure floor AND is the largest room
      //     (≥16 cells in long axis) → full-length center runner
      //   - Chapel: NO treasure floor, long axis ≥10 cells, is one of the
      //     cross-hall-end rooms (room.cy ≈ cz, narrow chapel-shape)
      //     → center runner
      const longLen = Math.max(room.w, room.h);
      const isGreatHall = hasTreasure && longLen >= 16;
      // Chapel detection: non-treasure cross-end room of size >= 10.
      // The cross-hall y center is around H/3, so the room's cy should be
      // close to that.
      const isChapelLike = !hasTreasure && longLen >= 10 && room.w === room.h;
      if(!isGreatHall && !isChapelLike) continue;
      // Determine long axis and rug dimensions.
      const longAxisIsX = room.w >= room.h;
      // Rug width = ~25% of the short axis (centered on it).
      // Rug length = ~80% of the long axis (leaves a margin at each end
      // so the rug doesn't bleed into the doorway region).
      const shortLen = Math.min(room.w, room.h);
      const rugWidth = Math.max(2, Math.floor(shortLen * 0.3));
      const rugLength = Math.floor(longLen * 0.8);
      const rugW = longAxisIsX ? rugLength : rugWidth;
      const rugH = longAxisIsX ? rugWidth  : rugLength;
      const rug = new THREE.Mesh(
        new THREE.PlaneGeometry(rugW, rugH),
        rugMat
      );
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(
        room.x + room.w/2 - 0.5,
        baseY + 0.01, // small offset to avoid z-fighting with floor
        room.y + room.h/2 - 0.5
      );
      dScene.add(rug);
    }

    // ── CEILING BEAMS ALONG HALLWAYS ──────────────────────────────
    // For each cell that is v===7 (hallway), if its row OR column index
    // is a multiple of the beam interval, place a beam crossing
    // perpendicular to the hallway direction.
    //
    // Hallway direction is detected per-cell:
    //   - If the cell has walkable neighbors at +Z and -Z (vertical
    //     corridor = trunk), the beam crosses E-W across the cell width.
    //   - If walkable neighbors at +X and -X (horizontal corridor =
    //     cross-hall), beam crosses N-S.
    //   - At the intersection of trunk + cross, both apply — we'd get
    //     overlapping beams. Skip the intersection.
    const beamMat = new THREE.MeshLambertMaterial({color: 0x3a2410});
    const beamInterval = 4;
    for(let r = 0; r < dR; r++){
      for(let c = 0; c < dC; c++){
        if(map[r][c] !== 7) continue;
        const nN = runLen(c, r-1, 0, -1);
        const nS = runLen(c, r+1, 0,  1);
        const nE = runLen(c+1, r,  1, 0);
        const nW = runLen(c-1, r, -1, 0);
        const vTotal = nN + nS + 1;
        const hTotal = nE + nW + 1;
        // Skip intersection cells — both runs long means we're at
        // the trunk+cross junction.
        if(vTotal > 3 && hTotal > 3) continue;
        if(vTotal > hTotal && r % beamInterval === 0){
          // Trunk-style cell. Beam crosses E-W.
          let west = c, east = c;
          while(west - 1 >= 0 && map[r][west-1] === 7) west--;
          while(east + 1 < dC && map[r][east+1] === 7) east++;
          // Emit beam only ONCE per row — when we hit the leftmost cell.
          if(c !== west) continue;
          const beamLen = east - west + 1;
          const beam = new THREE.Mesh(
            new THREE.BoxGeometry(beamLen, 0.14, 0.20),
            beamMat
          );
          beam.position.set(west + beamLen/2 - 0.5, baseY + ceilH - 0.10, r);
          dScene.add(beam);
        } else if(hTotal > vTotal && c % beamInterval === 0){
          // Cross-hall-style cell. Beam crosses N-S.
          let north = r, south = r;
          while(north - 1 >= 0 && map[north-1][c] === 7) north--;
          while(south + 1 < dR && map[south+1][c] === 7) south++;
          if(r !== north) continue;
          const beamLen = south - north + 1;
          const beam = new THREE.Mesh(
            new THREE.BoxGeometry(0.20, 0.14, beamLen),
            beamMat
          );
          beam.position.set(c, baseY + ceilH - 0.10, north + beamLen/2 - 0.5);
          dScene.add(beam);
        }
      }
    }

    // ── WALL TORCHES ALONG HALLWAYS ───────────────────────────────
    // For each cell at the EDGE of a hallway run (a v===7 cell with at
    // least one v===0 neighbor), at fixed intervals along the hallway,
    // place a torch on that wall.
    //
    // Algorithm: walk the trunk + cross-hall in their primary direction
    // and place torches at intervals on alternating sides. Detect each
    // hallway segment by its run direction.
    //
    // Simpler heuristic: for each v===7 cell, if (r+c) % torchInterval == 0
    // AND the cell has a void neighbor, place a torch on that void side.
    // v61g4: torchInterval increased from 5 to 10 (half-frequency).
    // Combined with chandelier lighting in treasure rooms and ambient
    // light, every-5-cell torches felt overlit. Every 10 cells reads as
    // proper punctuation rather than spotlights.
    const torchInterval = 10;
    for(let r = 0; r < dR; r++){
      for(let c = 0; c < dC; c++){
        if(map[r][c] !== 7) continue;
        if((r + c) % torchInterval !== 0) continue;
        // Find void neighbors (walls to mount torch on).
        const voidDirs = [];
        if(r-1 >= 0 && map[r-1][c] === 0) voidDirs.push([0, -1]); // wall to north
        if(r+1 < dR && map[r+1][c] === 0) voidDirs.push([0, 1]);  // wall to south
        if(c-1 >= 0 && map[r][c-1] === 0) voidDirs.push([-1, 0]); // wall to west
        if(c+1 < dC && map[r][c+1] === 0) voidDirs.push([1, 0]);  // wall to east
        if(voidDirs.length === 0) continue;
        // Place torch on the first available void wall. Position the torch
        // very close to the wall (offset 0.42 toward the wall from cell
        // center, so it reads as mounted ON the wall, not floating).
        const [dx, dz] = voidDirs[0];
        const torchX = c + dx * 0.42;
        const torchZ = r + dz * 0.42;
        _intTorch(dScene, torchX, torchZ);
      }
    }
  }

  // v61gc: decorative staircase at the trunk/cross-hall intersection.
  // Visual only — not walkable in this ship; hooks into a future upper-floor
  // system. Algorithm:
  //   1. Find the longest E-W tile-7 run (the cross-hall).
  //   2. Find the longest N-S tile-7 run (the trunk).
  //   3. Verify they share a cell (intersection exists). If not, skip.
  //   4. Place staircase centered on the intersection cell.
  //   5. Climbs NORTH so player walking N from the entrance sees the
  //      stairs facing them (bottom step on the south-facing side).
  //   6. Free-standing — does not touch walls. Trunk and cross-hall both
  //      provide ≥1.5u clearance on each side at the intersection.
  // v61gd updates:
  //   - True-center placement: pick the CENTER column of the trunk's full
  //     width (and center row of the cross-hall's full height), not the
  //     first column/row that produced the max-length scan. v61gc picked
  //     bestNSCol = the westmost trunk column because the first match wins.
  //   - Ceiling-reaching height: 8 steps × 0.4u rise = 3.2u, matching
  //     FLOOR_HEIGHT. Was 6 × 0.3 = 1.8u, too short — "stairs to nowhere".
  // Each step is registered as a collision footprint. Iron railings: one
  // vertical baluster per step on E and W sides + single tilted top rail
  // per side, computed via proper trigonometry.
  function renderFortStaircase(map, baseY){
    // Find the longest E-W run of tile-7. Track ALL rows that hit the max
    // length so we can pick the center.
    let bestEWLen = 0;
    const ewMaxRows = [];  // rows where the max-length run lives
    let ewBestStart = -1;
    for(let r = 0; r < dR; r++){
      let runStart = -1;
      for(let c = 0; c <= dC; c++){
        const isHall = c < dC && map[r][c] === 7;
        if(isHall && runStart === -1){
          runStart = c;
        } else if(!isHall && runStart !== -1){
          const len = c - runStart;
          if(len > bestEWLen){
            bestEWLen = len;
            ewMaxRows.length = 0;
            ewMaxRows.push(r);
            ewBestStart = runStart;
          } else if(len === bestEWLen){
            // Same-length run on a different row → cross-hall is multi-row
            ewMaxRows.push(r);
          }
          runStart = -1;
        }
      }
    }
    // Find longest N-S run of tile-7. Track ALL cols that hit the max.
    let bestNSLen = 0;
    const nsMaxCols = [];
    let nsBestStart = -1;
    for(let c = 0; c < dC; c++){
      let runStart = -1;
      for(let r = 0; r <= dR; r++){
        const isHall = r < dR && map[r][c] === 7;
        if(isHall && runStart === -1){
          runStart = r;
        } else if(!isHall && runStart !== -1){
          const len = r - runStart;
          if(len > bestNSLen){
            bestNSLen = len;
            nsMaxCols.length = 0;
            nsMaxCols.push(c);
            nsBestStart = runStart;
          } else if(len === bestNSLen){
            nsMaxCols.push(c);
          }
          runStart = -1;
        }
      }
    }
    // Need both runs to be meaningful (≥8 cells each).
    if(bestEWLen < 8 || bestNSLen < 8) return;
    // True center of each axis. For trunk (multi-column thick): center col
    // of the column range. For cross-hall (multi-row thick): center row.
    const trunkCenterC = Math.floor((nsMaxCols[0] + nsMaxCols[nsMaxCols.length - 1]) / 2);
    const crossCenterR = Math.floor((ewMaxRows[0] + ewMaxRows[ewMaxRows.length - 1]) / 2);
    // Verify intersection: the cross-hall row must lie within the trunk's
    // z range, AND the trunk col must lie within the cross-hall's x range.
    if(crossCenterR < nsBestStart || crossCenterR >= nsBestStart + bestNSLen) return;
    if(trunkCenterC < ewBestStart || trunkCenterC >= ewBestStart + bestEWLen) return;
    // Staircase footprint: 8 steps, 0.38u rise (total 3.04u, leaves ~0.16u
    // headroom under FLOOR_HEIGHT=3.2u ceiling — reads as "stairs to an
    // opening" rather than stairs mashed into a wall).
    // 0.55u step depth (total 4.4u along Z). 2.0u wide (E-W).
    const stepCount = 8;
    const stepDepth = 0.55;
    const stepRise = 0.38;
    const totalStairLen = stepCount * stepDepth;  // 4.4u
    // Center stair run on the intersection cell.
    const stairCenterZ = crossCenterR;
    const stairBottomZ = stairCenterZ + (totalStairLen - stepDepth) / 2;
    const stairTopZ = stairCenterZ - (totalStairLen - stepDepth) / 2;
    const stairX = trunkCenterC;
    // Materials
    const stoneStair = new THREE.MeshLambertMaterial({color: 0x4a4540});
    const ironStair = new THREE.MeshLambertMaterial({color: 0x2a2218});
    // Steps. i=0 is bottom (south, smallest Y); i=stepCount-1 is top.
    for(let i = 0; i < stepCount; i++){
      const sz = stairBottomZ - i * stepDepth;
      const stepH = (i + 1) * stepRise;
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, stepH, stepDepth), stoneStair);
      stepMesh.position.set(stairX, baseY + stepH / 2, sz);
      dScene.add(stepMesh);
      DUNGEON_PROPS.push({
        x0: stairX - 1.0 - 0.22,
        x1: stairX + 1.0 + 0.22,
        z0: sz - stepDepth/2 - 0.22,
        z1: sz + stepDepth/2 + 0.22,
      });
    }
    // Railings: one vertical baluster per step on E and W sides.
    const railX_east = stairX + 1.0 - 0.05;
    const railX_west = stairX - 1.0 + 0.05;
    for(let i = 0; i < stepCount; i++){
      const sz = stairBottomZ - i * stepDepth;
      const stepTopY = (i + 1) * stepRise;
      const postH = 0.9;  // waist-height post
      const postCenterY = stepTopY + postH/2;
      const postE = new THREE.Mesh(new THREE.BoxGeometry(0.07, postH, 0.07), ironStair);
      postE.position.set(railX_east, baseY + postCenterY, sz);
      dScene.add(postE);
      const postW = new THREE.Mesh(new THREE.BoxGeometry(0.07, postH, 0.07), ironStair);
      postW.position.set(railX_west, baseY + postCenterY, sz);
      dScene.add(postW);
    }
    // Single tilted top rail per side, from bottom-post-top to top-post-top.
    // Box's local +Z = long axis. Rotation around X by θ:
    //   local +Z → world (−sin θ ŷ + cos θ ẑ)
    // Want local +Z to map to BOTTOM (high Z, low Y) relative to center:
    //   → cos θ > 0 (pointing +Z), -sin θ < 0 (pointing -Y)
    //   → sin θ > 0, cos θ > 0, θ in quadrant I.
    // Specifically θ = atan2(dy, -dz) where dz = topZ - bottomZ (negative)
    // and dy = topY - bottomY (positive). -dz is positive → atan2 in QI.
    const z0 = stairBottomZ, z1 = stairTopZ;
    const y0 = 1 * stepRise + 0.9;
    const y1 = stepCount * stepRise + 0.9;
    const dz = z1 - z0;
    const dy = y1 - y0;
    const railLen = Math.hypot(dz, dy);
    const railMidZ = (z0 + z1) / 2;
    const railMidY = (y0 + y1) / 2;
    const railTilt = Math.atan2(dy, -dz);
    const railGeom = new THREE.BoxGeometry(0.06, 0.06, railLen);
    const railE = new THREE.Mesh(railGeom, ironStair);
    railE.position.set(railX_east, baseY + railMidY, railMidZ);
    railE.rotation.x = railTilt;
    dScene.add(railE);
    const railW = new THREE.Mesh(railGeom, ironStair);
    railW.position.set(railX_west, baseY + railMidY, railMidZ);
    railW.rotation.x = railTilt;
    dScene.add(railW);
  }

  // v61g8: decorateFortRoom — kind-specific fixed props in fort interior
  // rooms. Reads room.kind (set at generation time in makeFortInterior_* )
  // and spawns the appropriate prop signature. Runs AFTER renderFloor (so
  // chests have placed), AFTER renderFortArchitecture (so columns are
  // registered with DUNGEON_COLUMNS for collision). Cluster spawning is
  // kind-aware in renderFloor and avoids the corner reserved for fixed
  // props in each kind. See § kind-corner mapping below.
  //
  // All props use _propBox + _propCyl wrappers that handle scene-add,
  // random Y-jitter-prevention (no terrain sampling — fort interiors are
  // flat), and a small Y-rotation jitter for the few props that benefit.
  //
  // None of these props collide with the player — they're decorative.
  // Walking through a banquet table is the price of not building a full
  // collision system for arbitrary furniture this ship.
  function decorateFortRoom(room, baseY){
    if(!room.kind) return;

    // Materials — reused across props. Dark wood for furniture, lighter
    // wood for surfaces that catch light, stone for altars and braziers,
    // pale linen for bedding, dim emissive for candle flames.
    const woodDark = new THREE.MeshLambertMaterial({color: 0x3a2a18});
    const woodLight = new THREE.MeshLambertMaterial({color: 0x5a4028});
    const stone = new THREE.MeshLambertMaterial({color: 0x4a4540});
    const linen = new THREE.MeshLambertMaterial({color: 0x9a8a70});
    const iron = new THREE.MeshLambertMaterial({color: 0x2a2218});
    const candleWax = new THREE.MeshLambertMaterial({color: 0xc8b890});
    const flameMat = new THREE.MeshBasicMaterial({color: 0xffcc66});

    // Helpers to spawn a box / cylinder prop centered at (wx, wz) with
    // body-bottom flush to baseY. width/depth/height in world units.
    function box(wx, wz, w, h, d, mat, rotY){
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(wx, baseY + h/2, wz);
      if(rotY) m.rotation.y = rotY;
      dScene.add(m);
      return m;
    }
    function boxAt(wx, wy, wz, w, h, d, mat, rotY){
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(wx, baseY + wy, wz);
      if(rotY) m.rotation.y = rotY;
      dScene.add(m);
      return m;
    }
    function cyl(wx, wz, r, h, mat){
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), mat);
      m.position.set(wx, baseY + h/2, wz);
      dScene.add(m);
      return m;
    }
    function cylAt(wx, wy, wz, r, h, mat){
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), mat);
      m.position.set(wx, baseY + wy, wz);
      dScene.add(m);
      return m;
    }
    // Single candle: short cylindrical wax + tiny emissive sphere on top.
    function candle(wx, wy, wz){
      cylAt(wx, wy + 0.06, wz, 0.04, 0.12, candleWax);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), flameMat);
      flame.position.set(wx, baseY + wy + 0.16, wz);
      dScene.add(flame);
      const fl = new THREE.PointLight(0xffaa66, 0.6, 2.5);
      fl.position.copy(flame.position);
      dScene.add(fl);
    }
    // v61g9: solid variants — same signature as box/boxAt/cyl, but ALSO
    // register an axis-aligned collision footprint in DUNGEON_PROPS so the
    // player walks AROUND the prop instead of through it. Footprint is
    // inflated by PLAYER_R (0.22u) at registration so dPropHit can be a
    // tight point-in-rect check. rotY is ignored for collision — slightly
    // rotated props (chair) get a slightly-too-wide AABB, which is fine.
    const PLAYER_R = 0.22;
    function registerProp(wx, wz, w, d){
      DUNGEON_PROPS.push({
        x0: wx - w/2 - PLAYER_R,
        x1: wx + w/2 + PLAYER_R,
        z0: wz - d/2 - PLAYER_R,
        z1: wz + d/2 + PLAYER_R,
      });
    }
    function boxSolid(wx, wz, w, h, d, mat, rotY){
      const m = box(wx, wz, w, h, d, mat, rotY);
      registerProp(wx, wz, w, d);
      return m;
    }
    function boxAtSolid(wx, wy, wz, w, h, d, mat, rotY){
      const m = boxAt(wx, wy, wz, w, h, d, mat, rotY);
      registerProp(wx, wz, w, d);
      return m;
    }
    function cylSolid(wx, wz, r, h, mat){
      const m = cyl(wx, wz, r, h, mat);
      registerProp(wx, wz, r*2, r*2);
      return m;
    }

    const cx = room.x + room.w/2 - 0.5;
    const cz = room.y + room.h/2 - 0.5;
    // S306 — the fort's rooms on the kit (#46 A, and H.7's "rubble and props"): the pieces at the kit's own sizes, which are
    // the town interiors' (the old boxes stood a table at .7 and a hutch at 1.8 against a .92 eye); one bake a room, the
    // collision footprints registered as before. The wall's inside face is half a cell out from the room's first cell.
    const FK = furnKit(), FP = FK.Parts(), FN = 'gatelands', FS = (room.x * 31 + room.y * 17) | 0;
    const wallN = room.y - 0.5, wallS = room.y + room.h - 0.5;
    const kitCandle = (wx, wy, wz) => { const q = FK.Parts(); FK.candle(q, 0, 0, 0); FP.put(q, wx, wz, 0, wy);
      const fl = new THREE.PointLight(0xffaa66, 0.6, 2.5); fl.position.set(wx, baseY + wy + 0.16, wz); dScene.add(fl); };
    const kitBake = () => { if(!FP.list.length) return; const G = FK.bake(FP); G.position.y = baseY; G.userData.fortFurn = { kind: room.kind, cx, cz, x0: room.x - 0.5, z0: room.y - 0.5, w: room.w, h: room.h }; dScene.add(G); return G; };

    if(room.kind === 'great_hall'){
      // the long table with benches and three candles; the banner on the north wall; the hutches are the kit's dresser,
      // two on the north wall flanking the banner, one on the south wall to the west (the east is the staircase's)
      const tableLen = Math.min(room.w - 6, 9);
      FP.put(FK.table(tableLen, 1.0, FN, FS), cx, cz, 0); registerProp(cx, cz, tableLen, 1.0);
      for(const sd of [-1, 1]){ FP.put(FK.bench(tableLen - .2, FN, FS + 2 + sd), cx, cz + sd * 0.9, 0); registerProp(cx, cz + sd * 0.9, tableLen - .2, 0.32); }
      FP.put(FK.banner(0x8a3320, FS + 5), cx, wallN + 0.08, 0, 2.95);
      const candleDx = tableLen / 4;
      for(let i = 1; i <= 3; i++) kitCandle(cx - tableLen/2 + i * candleDx, 0.46, cz);
      const hutches = [{wx: cx - tableLen/2 - 0.5, n: true}, {wx: cx + tableLen/2 + 0.5, n: true}, {wx: cx - tableLen/2 - 0.5, n: false}];
      hutches.forEach((hp, k) => { const wz = hp.n ? wallN + 0.02 : wallS - 0.02;
        FP.put(FK.dresser(1.4, FN, FS + 10 + k), hp.wx, wz, hp.n ? 0 : Math.PI); registerProp(hp.wx, hp.n ? wz + 0.25 : wz - 0.25, 1.4, 0.5);
        kitCandle(hp.wx, 1.64, hp.n ? wz + 0.2 : wz - 0.2); });
    }
    else if(room.kind === 'pillared_hall'){
      // S599 — the hall and undercroft (#177 A): the flight takes the middle, so the high table stands across the north end
      // beyond the balustrade, under the banner, and a long table with its benches runs down each side between the
      // colonnade and the wall; a runner from the door to the flight's head; dressers flank the banner
      const F = gen.flight, hiZ = room.y + 1.6, hiLen = Math.min(room.w - 8, 7);
      FP.put(FK.table(hiLen, 1.0, FN, FS), cx, hiZ, 0); registerProp(cx, hiZ, hiLen, 1.0);
      FP.put(FK.bench(hiLen - .2, FN, FS + 1), cx, hiZ + 0.9, 0); registerProp(cx, hiZ + 0.9, hiLen - .2, 0.32);
      FP.put(FK.banner(0x8a3320, FS + 5), cx, wallN + 0.08, 0, 2.95);
      for(let i = 1; i <= 3; i++) kitCandle(cx - hiLen/2 + i * hiLen/4, 0.46, hiZ);
      for(const sd of [-1, 1]){ FP.put(FK.dresser(1.4, FN, FS + 10 + sd), cx + sd * (hiLen/2 + 1.2), wallN + 0.02, 0); registerProp(cx + sd * (hiLen/2 + 1.2), wallN + 0.27, 1.4, 0.5); }
      const sideLen = Math.min(room.h - 10, 8), sz = room.y + room.h/2;
      for(const sd of [-1, 1]){ const tx = sd < 0 ? room.x + 1.8 : room.x + room.w - 2.8;
        FP.put(FK.table(sideLen, 1.0, FN, FS + 20 + sd), tx, sz, Math.PI/2); registerProp(tx, sz, 1.0, sideLen);
        const bx = tx - sd * 0.9; FP.put(FK.bench(sideLen - .2, FN, FS + 22 + sd), bx, sz, Math.PI/2); registerProp(bx, sz, 0.32, sideLen - .2);
        kitCandle(tx, 0.46, sz - sideLen/4); kitCandle(tx, 0.46, sz + sideLen/4); }
      if(F){ const rugMat = new THREE.MeshLambertMaterial({color: 0x8a1818}), z0 = F.top + 0.9, z1 = room.y + room.h - 0.8;
        if(z1 > z0){ const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.2, z1 - z0), rugMat); rug.rotation.x = -Math.PI/2; rug.position.set(cx, baseY + 0.01, (z0 + z1)/2); dScene.add(rug); } }
    }
    else if(room.kind === 'lords_chamber'){
      // the kit's box bed, its head to the north wall; a small table with a candle beside it; the chest at its foot
      const bedZ = wallN + 0.77;
      FP.put(FK.bed(FN, FS + 1), cx, bedZ, 0); registerProp(cx, bedZ, 0.9, 1.5);
      const sideX = cx + 0.85;
      FP.put(FK.table(0.5, 0.5, FN, FS + 2), sideX, wallN + 0.35, 0); registerProp(sideX, wallN + 0.35, 0.5, 0.5);
      kitCandle(sideX, 0.46, wallN + 0.35);
      FP.put(FK.chest(FN, FS + 3), cx, bedZ + 1.05, 0); registerProp(cx, bedZ + 1.05, 0.72, 0.42);
    }
    else if(room.kind === 'chapel'){
      // the kit's altar (cloth, runner, candlesticks and book) against the north wall; three pews facing it
      const altarZ = room.y + 1.3;
      FP.put(FK.altar(FN, FS + 1), cx, altarZ, 0); registerProp(cx, altarZ, 2.2, 0.9);
      for(const sx of [-0.8, 0.8]){ const fl = new THREE.PointLight(0xffaa66, 0.6, 2.5); fl.position.set(cx + sx, baseY + 1.28, altarZ); dScene.add(fl); }
      const pewLen = Math.min(room.w - 4, 5);
      const firstPewZ = altarZ + 1.6;
      for(let i = 0; i < 3; i++){
        const pz = firstPewZ + i * 1.0;
        if(pz >= room.y + room.h - 1) break;
        FP.put(FK.pew(pewLen, FN, FS + 10 + i), cx, pz, 0); registerProp(cx, pz, pewLen, 0.35);
      }
    }
    else if(room.kind === 'courtyard_hall'){
      // the kit's iron brazier on its three legs, its coals and flames in the bake's fire mesh; the light as before,
      // at 1.8 times the kit's size (a unit across, as the old one was), so its own bake, scaled
      { const B = FK.bake(FK.brazier(FS + 1)); B.scale.setScalar(1.8); B.position.set(cx, baseY, cz); B.userData.fortFurn = { kind: room.kind, cx, cz, x0: room.x - 0.5, z0: room.y - 0.5, w: room.w, h: room.h }; dScene.add(B); }
      registerProp(cx, cz, 1.0, 1.0);
      const emberLight = new THREE.PointLight(0xff8040, 1.8, 6);
      emberLight.position.set(cx, baseY + 1.3, cz);
      dScene.add(emberLight);
    }
    else if(room.kind === 'barracks'){
      // v61gd: cots oriented in proper military-bunk style. Head against
      // the wall, foot pointing into the room. So on the WEST wall, each
      // cot runs E-W (long axis perpendicular to wall), with cots lined
      // up shoulder-to-shoulder along the wall (each cot occupies 0.55u
      // of N-S wall length).
      //
      // Cot dims swapped from v61gc (which had cots running parallel to
      // the wall — bench-like, not bunk-like):
      //   width  = 1.2 (X, perpendicular to wall — head-to-foot)
      //   height = 0.30
      //   depth  = 0.55 (Z, along wall — shoulder-to-shoulder)
      //
      // Wall-flush head: cot head touches the wall inside face with 0.02u
      // margin. Wall inside face at room.x - 0.5 → cot center X for
      // west-wall beds = (room.x - 0.5) + (1.2/2) + 0.02 = room.x + 0.12.
      // Foot at cot center + 0.6 = room.x + 0.72 (well clear of room interior).
      //
      // Bed spacing along Z: 0.85u center-to-center (cot is 0.55 wide so
      // 0.3u gap between cots — "bunks lined up" but not crammed).
      //
      // Footlocker: at the FOOT end of each cot. For west-wall cot, locker
      // is east of cot center, sharing the same Z. Dimensions: 0.35w × 0.3h
      // × 0.55d (small chest at the foot). Aligned with cot Z so it reads
      // as paired-with-cot.
      //
      // Door clearance: cot Z extent is 0.55u, so cot Z half ≈ 0.275u. A
      // door at room-Z X uses a clearance band of ±0.6u (cot half + 0.3
      // buffer) — much smaller than the old 1.6u for the parallel layout.
      const allDoors = (gen.treasureDoors || []);
      let westDoorZ = null, eastDoorZ = null;
      for(const d of allDoors){
        if(d.x === room.x - 1 && d.z >= room.y && d.z < room.y + room.h) westDoorZ = d.z;
        if(d.x === room.x + room.w && d.z >= room.y && d.z < room.y + room.h) eastDoorZ = d.z;
      }
      // Wall-flush cot centers:
      // W wall inside face at room.x - 0.5; cot half-width 0.6; margin 0.02
      // → westX = room.x - 0.5 + 0.6 + 0.02 = room.x + 0.12
      // E wall inside face at room.x + room.w - 0.5
      // → eastX = (room.x + room.w - 0.5) - 0.6 - 0.02 = room.x + room.w - 1.12
      const westX = room.x + 0.12;
      const eastX = room.x + room.w - 1.12;
      const bedSpacing = 0.85;
      function placeBunksAlongWall(headX, faceEast, doorZ){
        // Build segments: north of door (if any), south of door (if any),
        // or full wall (no door on this side).
        const endMargin = 0.7;  // clear of N/S walls
        const segments = [];
        if(doorZ === null){
          segments.push([room.y + endMargin, room.y + room.h - endMargin]);
        } else {
          const clearance = 0.7;  // door clearance band half-width
          const northSegMax = doorZ - clearance;
          const southSegMin = doorZ + clearance;
          if(northSegMax - (room.y + endMargin) > bedSpacing){
            segments.push([room.y + endMargin, northSegMax]);
          }
          if((room.y + room.h - endMargin) - southSegMin > bedSpacing){
            segments.push([southSegMin, room.y + room.h - endMargin]);
          }
        }
        // For each segment, place beds packed at bedSpacing, centered.
        for(const [segMin, segMax] of segments){
          const segLen = segMax - segMin;
          // How many beds fit at bedSpacing? n beds use (n-1)*spacing + 0.55.
          // Solve: (n-1)*spacing + 0.55 <= segLen → n <= (segLen - 0.55)/spacing + 1
          const maxBeds = Math.max(1, Math.floor((segLen - 0.55) / bedSpacing) + 1);
          if(maxBeds < 1) continue;
          // Center the row of bunks in the segment.
          const totalSpan = (maxBeds - 1) * bedSpacing;
          const startZ = segMin + (segLen - totalSpan) / 2;
          for(let i = 0; i < maxBeds; i++){
            const z = startZ + i * bedSpacing;
            // S307 — a narrow kit bed (1.2 by .55) head to the wall, the kit's chest at its foot, turned along the wall
            FP.put(FK.bed(FN, FS + 20 + i + (faceEast ? 0 : 50), 1.2, 0.55), headX, z, faceEast ? Math.PI/2 : -Math.PI/2); registerProp(headX, z, 1.2, 0.55);
            const lockerX = faceEast ? headX + 0.83 : headX - 0.83;
            FP.put(FK.chest(FN, FS + 80 + i + (faceEast ? 0 : 50)), lockerX, z, Math.PI/2); registerProp(lockerX, z, 0.42, 0.72);
          }
        }
      }
      placeBunksAlongWall(westX, true,  westDoorZ);   // west wall — foot points east
      placeBunksAlongWall(eastX, false, eastDoorZ);   // east wall — foot points west
    }
    else if(room.kind === 'kitchen'){
      // S307 — the kit's stone hearth against the north wall, its chimney breast to the ceiling, the fire in its flame mesh;
      // the work table in the middle with a candle and a tankard, and two casks by the hearth
      FP.put(FK.hearth(1.8, 3.2, FN, FS + 1), cx, wallN, 0); registerProp(cx, wallN + 0.35, 1.8, 0.7);
      const hearthLight = new THREE.PointLight(0xff7030, 1.5, 5);
      hearthLight.position.set(cx, baseY + 0.45, wallN + 0.75);
      dScene.add(hearthLight);
      FP.put(FK.table(1.4, 0.7, FN, FS + 2), cx, cz, 0); registerProp(cx, cz, 1.4, 0.7);
      { const q = FK.Parts(); FK.candle(q, -0.35, 0.46, 0.05); FK.tankard(q, 0.3, 0.46, -0.1, 0x7a6a4a); FP.put(q, cx, cz, 0); }
      for(const k of [0, 1]){ const x = cx + 1.5 + k * 0.5; FP.put(FK.cask(FN, FS + 3 + k), x, wallN + 0.45, 0); registerProp(x, wallN + 0.45, 0.45, 0.55); }
    }
    else if(room.kind === 'armory'){
      // S307 — the armoury on the kit: two of the kit's weapon racks side by side on the north wall and two free-standing to
      // the south facing north (where the old frames stood), the smithy's forge by the west wall with its fire to the east,
      // the anvil on its stump, a smelter of coursed stone by the east wall, and a work table with a blade and a whetstone
      const R = [['sword', 'longsword', 'claymore'], ['axe', 'greataxe', 'warhammer'], ['mace', 'flail', 'greatclub'], ['cutlass', 'dagger', 'sword']];
      for(const sx of [-1, 1]) FP.put(FK.rack(FN, FS + 10 + (sx > 0 ? 1 : 0), R[sx > 0 ? 1 : 0]), cx + sx * 0.45, wallN + 0.02, 0);
      registerProp(cx, wallN + 0.15, 1.8, 0.3);
      const southZ = room.y + room.h - 1.7;
      for(const sx of [-1, 1]) FP.put(FK.rack(FN, FS + 12 + (sx > 0 ? 1 : 0), R[sx > 0 ? 3 : 2]), cx + sx * 0.45, southZ + 0.1, Math.PI);
      registerProp(cx, southZ, 1.8, 0.5);
      const forgeX = room.x + 0.35, forgeZ = room.y + 1.8;
      FP.put(FK.forge(3.2, FN, FS + 1), forgeX, forgeZ, Math.PI/2); registerProp(forgeX, forgeZ, 1.6, 1.8);
      const forgeLight = new THREE.PointLight(0xff7030, 1.4, 4.5);
      forgeLight.position.set(forgeX + 1.0, baseY + 0.55, forgeZ);
      dScene.add(forgeLight);
      const anvilX = forgeX + 1.8, anvilZ = forgeZ;
      FP.put(FK.anvil(FN, FS + 2), anvilX, anvilZ, Math.PI/2); registerProp(anvilX, anvilZ, 0.55, 0.55);
      const smelterX = room.x + room.w - 1.2, smelterZ = room.y + 1.8;
      { const q = FK.Parts();
        for(let k = 0; k < 6; k++){ const r0 = 0.58 - k * 0.013, g = 0.36 + ((FS * 7 + k * 13) % 9) * 0.02; q(SK.bumpy(SK.cyl(r0 - 0.012, r0, 0.25, 14, 2), 0.015, 9, (FS + k) % 7), new THREE.Color(g * 0.95, g * 0.9, g * 0.85), 0, 0.13 + k * 0.265, 0, 0, k * 0.4, 0); }
        q(SK.cyl(0.52, 0.52, 0.08, 14), 0x4a4440, 0, 1.62, 0);
        q(SK.cyl(0.36, 0.36, 0.02, 14), 0x1a1210, 0, 1.665, 0);
        q(SK.rbox(0.34, 0.26, 0.1, 0.03, 1), 0x1a1210, 0, 0.18, -0.52);
        q.flame(SK.cone(0.08, 0.18, 6), 0xff7a20, -0.06, 0.16, -0.5); q.flame(SK.cone(0.06, 0.14, 6), 0xffa030, 0.07, 0.14, -0.5);
        FP.put(q, smelterX, smelterZ, 0); }
      registerProp(smelterX, smelterZ, 1.1, 1.1);
      const smelterLight = new THREE.PointLight(0xff6020, 0.9, 3.5);
      smelterLight.position.set(smelterX - 0.1, baseY + 0.2, smelterZ - 0.7);
      dScene.add(smelterLight);
      FP.put(FK.table(1.4, 0.7, FN, FS + 3), cx, cz, 0); registerProp(cx, cz, 1.4, 0.7);
      { const q = FK.Parts(); if(typeof wpnBuild === 'function') for(const w of wpnBuild('dagger', false, null)) q(w.geo, 0xffffff, -0.3, 0.47, -0.05, 0, 0.3, Math.PI/2);
        q(SK.rbox(0.2, 0.04, 0.06, 0.012, 1), 0x7a7470, 0.35, 0.48, 0.1, 0, -0.4, 0); FP.put(q, cx, cz, 0); }
    }
    else if(room.kind === 'guardroom'){
      // S307 — the watch's table with a candle, a tankard and a pair of dice, and a ladder-back chair turned to it
      FP.put(FK.table(1.0, 0.6, FN, FS + 1), cx, room.y + 1.2, 0); registerProp(cx, room.y + 1.2, 1.0, 0.6);
      { const q = FK.Parts(); FK.candle(q, -0.3, 0.46, 0); FK.tankard(q, 0.25, 0.46, 0.1, 0x8a8478);
        for(const d of [[0.05, -0.1, 0.3], [0.12, -0.05, -0.4]]) q(SK.rbox(0.03, 0.03, 0.03, 0.006, 1), 0xe8dcc0, d[0], 0.475, d[1], 0, d[2], 0);
        FP.put(q, cx, room.y + 1.2, 0); }
      FP.put(FK.chair(FN, FS + 2), cx + 0.7, room.y + 1.85, Math.PI - 0.3); registerProp(cx + 0.7, room.y + 1.85, 0.4, 0.4);
    }
    else if(room.kind === 'library'){
      // S308 — the library on the kit: the kit's bookcases (1.4 long, five shelves of spines, leaning and lying books) with
      // their backs to the long walls, each still a lootable shelf where it stands; a reading table with a candle, a closed
      // book and an open one, and a ladder-back chair drawn up to it
      function placeBookshelf(wall, along, k){
        let wx, wz, ry;
        if(wall === 'N'){ wx = along; wz = wallN + 0.16; ry = 0; }
        else if(wall === 'S'){ wx = along; wz = wallS - 0.16; ry = Math.PI; }
        else if(wall === 'W'){ wx = room.x - 0.5 + 0.16; wz = along; ry = Math.PI/2; }
        else { wx = room.x + room.w - 0.5 - 0.16; wz = along; ry = -Math.PI/2; }
        const back = wall === 'N' ? [wx, wallN + 0.01] : wall === 'S' ? [wx, wallS - 0.01] : wall === 'W' ? [room.x - 0.49, wz] : [room.x + room.w - 0.51, wz];
        FP.put(FK.bookcase(1.4, FN, FS + 30 + k), back[0], back[1], ry);
        if(wall === 'N' || wall === 'S') registerProp(wx, wz, 1.4, 0.32); else registerProp(wx, wz, 0.32, 1.4);
        const id = `${dKeyOf(portal,1)}:shelf:${BARRELS.filter(b=>b.displayName==='Bookshelf').length}`; // S514 — its id
        const items = rollContainerLoot('library_shelf', null, null, undefined, `${id}:${lootDay()}`);
        BARRELS.push({ id, x: wx, z: wz, floor: 1, opened: false, items, displayName: 'Bookshelf', mesh: null });
      }
      const longAxisIsX = room.w >= room.h;
      const shelfCount = 3;
      for(let i = 0; i < shelfCount; i++){
        const t = shelfCount === 1 ? 0.5 : i / (shelfCount - 1);
        if(longAxisIsX){ const wx = room.x + 2.0 + t * (room.w - 4.0); placeBookshelf('N', wx, i); placeBookshelf('S', wx, i + 3); }
        else { const wz = room.y + 2.0 + t * (room.h - 4.0); placeBookshelf('W', wz, i); placeBookshelf('E', wz, i + 3); }
      }
      FP.put(FK.table(1.2, 0.7, FN, FS + 1), cx, cz, 0); registerProp(cx, cz, 1.2, 0.7);
      { const q = FK.Parts(); FK.candle(q, -0.35, 0.46, -0.1);
        q(SK.rbox(0.18, 0.05, 0.24, 0.008, 1), 0x5a2a1a, -0.05, 0.485, 0.12, 0, 0.3, 0);
        for(const sd of [-1, 1]){ q(SK.rbox(0.16, 0.02, 0.22, 0.004, 1), 0xe8dcc0, 0.25 + sd * 0.08, 0.472, 0.02, 0, 0, sd * -0.08); }
        FP.put(q, cx, cz, 0); }
      const cl = new THREE.PointLight(0xffaa66, 0.6, 2.5); cl.position.set(cx - 0.35, baseY + 0.62, cz - 0.1); dScene.add(cl);
      FP.put(FK.chair(FN, FS + 2), cx, cz + 0.7, Math.PI); registerProp(cx, cz + 0.7, 0.4, 0.4);
    }
    else if(room.kind === 'storeroom'){
      // S308 — the storeroom's shelves on the kit: two of the kit's wall shelves of pots and crockery at each old shelf, one
      // over the other, and a tied sack under each; the crates and chests the room's rules add are placed elsewhere
      const longAxisIsX = room.w >= room.h;
      const shelfCount = 3;
      for(let i = 0; i < shelfCount; i++){
        const t = shelfCount === 1 ? 0.5 : i / (shelfCount - 1);
        if(longAxisIsX){ const wx = room.x + 2.5 + t * (room.w - 5.0);
          for(const [y, k] of [[0.62, 0], [1.05, 1]]) FP.put(FK.shelf(1.2, FN, FS + 40 + i * 2 + k, 'mixed'), wx, wallN + 0.01, 0, y);
          FP.put(FK.sack(FS + 50 + i, [0xb8a070, 0x9a8a60, 0xc0b080][i]), wx, wallN + 0.3, i * 0.7); registerProp(wx, wallN + 0.2, 1.2, 0.4); }
        else { const wz = room.y + 2.5 + t * (room.h - 5.0), ex = room.x + room.w - 0.51;
          for(const [y, k] of [[0.62, 0], [1.05, 1]]) FP.put(FK.shelf(1.2, FN, FS + 40 + i * 2 + k, 'mixed'), ex, wz, -Math.PI/2, y);
          FP.put(FK.sack(FS + 50 + i, [0xb8a070, 0x9a8a60, 0xc0b080][i]), ex - 0.29, wz, i * 0.7); registerProp(ex - 0.19, wz, 0.4, 1.2); }
      }
    }
    // S307 — every room drawn on the kit above is one bake (nothing to bake for the rooms still on boxes)
    kitBake();
  }

  FOOTHOLDS=[];DUNGEON_STAIRWELL=false; // v80 S8
  D_BEDS=[]; // v80 S9 — a cot near a fort's entrance: rest, and take a banked level
  if(isFort&&gen.entC!=null){
    let spot=null;for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1]]){const c=gen.entC+dc,r=gen.entR+dr;if(c>=0&&r>=0&&c<dC&&r<dR&&(dMap[r][c]===1||dMap[r][c]===7)){spot=[c,r];break;}} // S317 — a fort’s entry is hallway (7), not room floor (1), so the cot never found a cell (the look builder, 29 Sep)
    if(spot){const [c,r]=spot;const K=furnKit(),cot=K.bake(K.bed('gatelands',(portal.seed|0)%97+7,1.0,.6));cot.position.set(c,0,r);cot.userData.fortCot=true;dScene.add(cot); // S308 — a narrow kit bed, head north as the old pillow lay
      D_BEDS.push({x:c,z:r,floor:1});}
  }
  renderFloor(dMap,1,thWallMat,thFloorMat,0);
  // v61g2: after the per-cell render pass, emit continuous fort walls
  // for fort interiors. Only runs on floor 1 (forts are single-floor).
  // S197 — the fort's planar walls are the shell's now (renderFloor); the old pass is kept, unused
  if(isFort&&false) renderFortWalls(dMap, 0);
  // v61gb: staircase BEFORE architecture so its DUNGEON_PROPS footprints
  // are registered before the center-column pass runs. The center column
  // pass checks dPropHit and skips column placement on staircase cells.
  if(isFort&&!gen.flights) renderFortStaircase(dMap, 0); // S601 — not in the new shapes: their stairs are real
  if(isFort) renderFortArchitecture(dMap, 0);
  // v61g8: per-room fixed prop signatures based on room.kind. Runs after
  // architecture so column collisions are already registered (no overlap
  // checks needed — fixed prop positions are designed not to overlap
  // doorway columns).
  if(isFort){
    for(const room of gen.rooms){
      decorateFortRoom(room, 0);
    }
  }
  // S599 — what floor 1 has registered to collide is floor 1's: a table in the hall above no longer stops you in the vault below
  if(dMap2){for(const p of DUNGEON_PROPS)if(p.floor==null)p.floor=1;for(const p of DUNGEON_COLUMNS)if(p.floor==null)p.floor=1;}
  if(dMap2)renderFloor(dMap2,2,f2WallMat,f2FloorMat,FLOOR2_Y);
  if(dMap2&&gen.gaolCells)buildGaolGrilles();
  // v80 S8 — floor 2 as a walkable platform with the shaft cut out; floor 1 is the base (0)
  try{decorateDungeonRooms(gen,portal);}catch(e){console.warn('decorate',e);} // v80 — room types, traps, containers
  if(DUNGEON_STAIRWELL)FOOTHOLDS.push({x0:-.5,x1:dC-.5,z0:-.5,z1:dR-.5,y:Math.max(0,FLOOR2_Y),holes:gen.stairHoles||[{x0:gen.stairC-.5,x1:gen.stairC+1.5,z0:gen.stairR-.5,z1:gen.stairR+1.5}]}); // the upper floor (floor one, now) with the shaft open (S599: or the flights' holes, S601: and the ring's yard)

  // v61g6: spawn meshes for ALL doors, not just locked ones. Tile-4 (unlocked)
  // doors now have meshes too — fort interiors use only unlocked doors, and
  // cave corridor doors also become visible/closeable for tactical consistency
  // (closing a door breaks line-of-sight against ranged enemies, blocks BFS
  // pursuit). Two visual variants:
  //   - Locked: 3 vertical bars + brass lock plate (vault register). Caves only.
  //   - Unlocked: 2 horizontal iron bands (mundane door register). Forts + cave corridors.
  // Keys only spawn for locked doors.
  const allDoors = gen.treasureDoors;
  const lockedDoors = allDoors.filter(td => td.locked !== false);
  let lockedSeen = 0;
  allDoors.forEach((td) => {
    const isLocked = td.locked !== false;
    const dg=new THREE.Group();
    // v61gf: door now has a hinge sub-group. All visible parts (slab, bars,
    // bands, lock plate) live under `hinge`, offset by +0.5 in x so the slab's
    // center sits at the wall slot center (where it visually used to). Rotating
    // `hinge` around Y around its origin (which is at the slab's left edge in
    // the outer frame) swings the door open like a real hinged door.
    // Pre-v61gf the open-handler set mesh.visible=false — door just disappeared.
    const hinge = new THREE.Group();
    hinge.position.x = -0.5;  // hinge sits at door's left edge
    // S206 — the door on the kit: five planks of slightly different tone, two iron straps with nail heads across both
    // faces, a ring pull; a locked door also carries an iron grille and a brass lock plate. One merged mesh on the hinge,
    // and a dressed stone frame (jambs and a lintel) round the doorway, which stays put when the door swings.
    {const P=[],add=(geo,col,x,y,z,rx,ry,rz)=>P.push([geo,new THREE.Color(col),new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),new THREE.Vector3(1,1,1))]);
      const tones=[0x5a3e22,0x4e361e,0x624426,0x563a20,0x4a321c];for(let k=0;k<5;k++)add(SK.rbox(.19,2.74,.1,.015,1),tones[k],.1+k*.2,0,0);
      for(const y of [-.8,.8]){add(SK.rbox(.96,.1,.03,.01,1),0x2e2a26,.5,y,.065);add(SK.rbox(.96,.1,.03,.01,1),0x2e2a26,.5,y,-.065);for(let k=0;k<5;k++)for(const z of [.085,-.085])add(SK.ball(.018,5,4),0x1e1a18,.1+k*.2,y,z);}
      add(SK.torus(.07,.012,5,10),0x3a3530,.82,0,.1,0,0,0);add(SK.ball(.03,6,4),0x2a2622,.82,.07,.08);
      if(isLocked){for(let j=0;j<3;j++)add(SK.cyl(.025,.025,1.1,6),0x6a6a6a,.2+j*.3,.55,.09);for(const y of [.05,1.05])add(SK.rbox(.8,.05,.05,.01,1),0x6a6a6a,.5,y,.09);add(SK.rbox(.16,.18,.04,.015,1),0xc8a030,.5,-.25,.09);add(new THREE.BoxGeometry(.03,.06,.01),0x1a1410,.5,-.27,.115);}
      const dm=dunMerge(P,'door');hinge.add(dm);
      const F=[],addF=(geo,col,x,y,z)=>F.push([geo,new THREE.Color(col),new THREE.Matrix4().makeTranslation(x,y,z)]);const fs=0x6a655c;
      for(const x of [-.56,.56])for(let k=0;k<5;k++)addF(SK.rbox(.22,.54,.3,.04,1),new THREE.Color(fs).multiplyScalar(.9+((k+(x>0?1:0))%2)*.12),x,-1.1+k*.56,0);
      addF(SK.rbox(1.36,.3,.32,.05,1),fs,0,1.52,0);const fm=dunMerge(F,'doorframe');dg.add(fm);}
    dg.add(hinge);
    dg.position.set(td.x,1.4,td.z);if(td.isEW)dg.rotation.y=Math.PI/2;dScene.add(dg);
    const keyName = isLocked
      ? (portal.keyBase+' Key'+(lockedDoors.length>1?' '+(lockedSeen+1):''))
      : null;
    DOORS.push({id:`${dKeyOf(portal,1)}:door:${DOORS.length}`,x:td.x,z:td.z,isEW:td.isEW,open:false,keyName, // S517 — its id, <seed>:1:door:<n>
      mesh:dg,hinge,floor:1,locked:isLocked});
    if(isLocked){
      const kl=gen.keyLocations[lockedSeen]||gen.keyLocations[0];
      if(kl){
        const kObj=new THREE.Mesh(new THREE.TorusGeometry(.08,.025,8,16),new THREE.MeshLambertMaterial({color:0xffd700,emissive:0x775500}));
        kObj.position.set(kl.x,.55,kl.y);
        const kGl=new THREE.PointLight(0xffd700,2,4.5);kGl.position.copy(kObj.position);
        dScene.add(kObj);dScene.add(kGl);
        dScene.remove(kObj);if(kGl)dScene.remove(kGl); // v80 — no floating key; locked doors are picked
      }
      lockedSeen++;
    }
  });

  const EM={
    // v59: minLevel gates which player levels an enemy can spawn at. Prevents early-game rug-pulls
    // (Mimic, Gargoyle) and "stat-check" enemies the player can't kill without the right tools
    // (Wraith, Golem). Skeleton/Goblin/Slime/Kobold stay level 1 — baseline content for any dungeon.
    Skeleton:    {minLevel:1, col:0xc8c0a8,hp:35,spd:1.35,scale:1.0, buildFn:'humanoid',dmgMult:2.0,ranged:false,eyeCol:0x4488ff,light:0x4466cc, def:2, resist:{solas:1.5, scath:0.7, cloch:1.35, slash:0.7, pierce:0.5, blunt:1.35}},
    Goblin:      {minLevel:1, col:0x6a8a40,hp:28,spd:2.02,scale:0.72,buildFn:'humanoid',dmgMult:2.0,ranged:false,eyeCol:0xff4400,light:0xff4400, def:1, resist:{tine:1.35}},
    'Cave Troll':{minLevel:2, col:0x4a5a38,hp:70,spd:0.68,scale:1.5, buildFn:'brute',   dmgMult:4.4,ranged:false,eyeCol:0xff2200,light:0xff3300, def:4, resist:{tine:1.5, cloch:0.7, blunt:1.2}},
    Golem:       {minLevel:3, col:0x707878,hp:90,spd:0.42,scale:1.7, buildFn:'brute',   dmgMult:5.2,ranged:false,eyeCol:0x22aaff,light:0x2266ff, def:6, resist:{cloch:0.5, uisce:1.4, tine:1.2, slash:0.4, pierce:0.4, blunt:1.35}},
    Phantom:     {minLevel:3, col:0x3030a0,hp:40,spd:1.28,scale:1.0, buildFn:'wraith',  dmgMult:2.4,ranged:true, eyeCol:0xaaaaff,light:0x6666ff, def:0, resist:{solas:1.4, cloch:0.5, scath:0.7, slash:0.3, pierce:0.3, blunt:0.3}},
    // Wraith is the most punishing for pure-melee: 0.25 slash/pierce/blunt resist means a level-1
    // warrior with no magic *cannot* kill it in practice. Gated to 5 so players have time to
    // touch a sigil or acquire a scroll before the wall appears.
    Wraith:      {minLevel:5, col:0x1a1a3a,hp:45,spd:1.20,scale:1.1, buildFn:'wraith',  dmgMult:2.6,ranged:true, eyeCol:0xff22aa,light:0xff22aa, def:0, resist:{solas:1.5, scath:0.5, slash:0.25, pierce:0.25, blunt:0.25}},
    // ── New in Session 2 ──
    // Slime — low-tier elemental trash mob. Splits into 2 Small Slimes on death (once).
    Slime:       {minLevel:1, col:0x32cd32,hp:22,spd:0.65,scale:0.7, buildFn:'slime',   dmgMult:1.6,ranged:false,eyeCol:0xffdd44,light:0x44ff44, def:1, resist:{cloch:1.35, tine:1.5, uisce:0.7, slash:0.3, pierce:0.3, blunt:0.6}, splitsOnDeath:true},
    // Small Slime spawns from Slime split — gate doesn't matter (it's a derived spawn), but keep at 1 for consistency.
    'Small Slime':{minLevel:1, col:0x5fd85f,hp:10,spd:0.75,scale:0.42,buildFn:'slime',   dmgMult:1.2,ranged:false,eyeCol:0xffdd44,light:0x44ff44, def:0, resist:{cloch:1.35, tine:1.5, uisce:0.7, slash:0.3, pierce:0.3, blunt:0.6}},
    // Kobold Thief — fast humanoid that flees at low HP. Reuses humanoid build at small scale with reptilian coloring.
    'Kobold Thief':{minLevel:1, col:0x8a6a3a,hp:20,spd:1.9,scale:0.75,buildFn:'humanoid',dmgMult:1.8,ranged:false,eyeCol:0xcc2200,light:0xaa5522, def:1, resist:{}, canFlee:true},
    // Fire Elemental — ranged enemy that fires fire orbs. Resistant to tine, weak to uisce. Reuses ranged AI.
    'Fire Elemental':{minLevel:3, col:0xff5522,hp:55,spd:1.1,scale:0.9,buildFn:'elemental',dmgMult:3.2,ranged:true,eyeCol:0xffff66,light:0xff7733, def:1, resist:{tine:0.3, uisce:1.75, cloch:1.2, slash:0.2, pierce:0.2, blunt:0.6}},
    // Gargoyle — dormant until player within 4u. Deals no damage and takes 2× damage while dormant. Reuses brute mesh with stone tint.
    // Gated at 4 alongside Mimic — both are "ambush" enemies that betray trust (statues/chests look safe).
    Gargoyle:    {minLevel:4, col:0x6a6a70,hp:85,spd:1.0, scale:1.35,buildFn:'brute',   dmgMult:3.8,ranged:false,eyeCol:0x880000,light:0x444444, def:5, resist:{cloch:0.5, uisce:1.2, slash:0.4, pierce:0.4, blunt:1.3}, dormant:true},
    // Mimic — disguised as a chest until player within 1.5u. First-reveal hit has burst damage. Wooden chest mesh.
    // Gated at 4 so players have opened several real chests and are comfortable with the loot loop
    // before the first fake one appears.
    Mimic:       {minLevel:4, col:0x8b5a2b,hp:60,spd:1.5, scale:0.75,buildFn:'mimic',   dmgMult:3.0,ranged:false,eyeCol:0xff2222,light:0xaa6622, def:3, resist:{tine:0.85, scath:1.3}, disguise:true},
    // ── New in v71 (Session 53) ──
    // Shieldbearer — humanoid that holds a frontal shield (shieldUp:true). The
    // shield is its defense, not innate toughness: neutral physical resists, but
    // FRONTAL melee hits are reduced to SHIELDBEARER_FRONT_BLOCK (0.35×) until the
    // guard is broken. Two clean answers for the player: (1) power-attack the front
    // → the v65 power-vs-shield rule force-breaks the guard (1.5s stagger, then the
    // shield is DOWN — shieldUp flips false on break, so follow-ups land full); or
    // (2) flank/backstab the rear cone, which bypasses the block entirely (v63
    // positional system pays off). A plain frontal bash CANNOT crack it (v71 design
    // call G) — bashing a raised guard is exactly the thing the shield is for.
    // minLevel:2 alongside Cave Troll — a "you now need a tool/position for this"
    // gate, the melee-side analogue to Wraith's magic gate.
    Shieldbearer:{minLevel:2, col:0x5a5550,hp:48,spd:1.15,scale:1.0, buildFn:'humanoid',dmgMult:2.6,ranged:false,eyeCol:0xffcc55,light:0xbb9933, def:3, resist:{}, shieldUp:true},
  };
  _dungeonBuildEnemy=(d,name)=>buildEnemy(d,name); // S253 — killE's slime split builds its Small Slimes outside this function
  function buildEnemy(d,name){
    const g=new THREE.Group();const mat=new THREE.MeshLambertMaterial({color:d.col});const sc=d.scale;const limbs={};
    // S196 — the dungeon's skeletons, goblins and kobold thieves on the people's body, as in the open world (H.4);
    // the rest of the humanoid roster (the Shieldbearer and its shield) keeps the box for now
    // S208 — the Cave Troll (a brute) is a person too
    // S212 — and the dungeon's Wraith and Phantom on the open world's wraith (S176): robed, hooded, see-through, gliding
    if((d.buildFn==='humanoid'||d.buildFn==='brute'||d.buildFn==='wraith')&&name&&FOE_DRESS[name]){const pr=buildFoe(name,Math.random()*999,Math.random()*999,null,d.eyeCol);pr.root.scale.multiplyScalar(sc);g.add(pr.root);
      if(d.buildFn==='wraith'){const au=new THREE.PointLight(d.light,.5,2.8);au.position.set(0,.6*sc,0);g.add(au);}
      limbs.torso=pr.mesh;limbs.armR=pr.B.shR;limbs.person=pr;if(d.shieldUp)limbs.armL=pr.B.shL; // S199 — the shield goes on the left shoulder bone
      const eyeGl=new THREE.PointLight(d.eyeCol,.35,1.4);eyeGl.position.set(0,1.1*sc,.25*sc);g.add(eyeGl);}
    else if(d.buildFn==='humanoid'){
      const legH=0.32*sc;
      [-1,1].forEach((s,i)=>{const pivot=new THREE.Group();pivot.position.set(s*.08*sc,legH,0);const leg=new THREE.Mesh(new THREE.BoxGeometry(.11*sc,legH,.11*sc),mat);leg.position.y=-legH/2;pivot.add(leg);g.add(pivot);limbs[i===0?'legL':'legR']=pivot;});
      const torso=new THREE.Mesh(new THREE.BoxGeometry(.28*sc,.38*sc,.18*sc),mat);torso.position.set(0,legH+.19*sc,0);g.add(torso);
      // v61d1 — Register torso in limbs so enemyBodyMesh() resolves to the
      // actual torso Mesh for telegraph + stagger flash. Pre-v61d1 these
      // effects walked children[0] which is the legL pivot Group (no
      // material property), silently failing across the entire humanoid
      // roster (goblin, kobold, bandit, skeleton). Slime/elemental had this
      // wired correctly via limbs.body; humanoid + brute did not.
      limbs.torso = torso;
      const armH=0.32*sc;
      [-1,1].forEach((s,i)=>{const pivot=new THREE.Group();pivot.position.set(s*.2*sc,legH+.32*sc,0);const arm=new THREE.Mesh(new THREE.BoxGeometry(.09*sc,armH,.09*sc),mat);arm.position.y=-armH/2;pivot.add(arm);g.add(pivot);limbs[i===0?'armL':'armR']=pivot;});
      const hd=new THREE.Mesh(new THREE.BoxGeometry(.22*sc,.22*sc,.2*sc),mat);hd.position.set(0,legH+.57*sc,0);g.add(hd);
      // Glowing eyes — larger + point light
      const ey=new THREE.Mesh(new THREE.BoxGeometry(.16*sc,.05*sc,.025),new THREE.MeshBasicMaterial({color:d.eyeCol}));ey.position.set(0,legH+.58*sc,.11*sc);g.add(ey);
      const eyeGl=new THREE.PointLight(d.eyeCol,0.6,1.8);eyeGl.position.set(0,legH+.58*sc,.18*sc);g.add(eyeGl);
    } else if(d.buildFn==='brute'){
      const legH=0.24*sc;
      [-1,1].forEach((s,i)=>{const pivot=new THREE.Group();pivot.position.set(s*.12*sc,legH,0);const leg=new THREE.Mesh(new THREE.BoxGeometry(.16*sc,legH,.16*sc),mat);leg.position.y=-legH/2;pivot.add(leg);g.add(pivot);limbs[i===0?'legL':'legR']=pivot;});
      const torso=new THREE.Mesh(new THREE.BoxGeometry(.5*sc,.44*sc,.32*sc),mat);torso.position.set(0,legH+.22*sc,0);g.add(torso);
      // v61d1 — Register torso for telegraph + stagger flash resolution.
      // Same fix as humanoid; brutes (cave troll, golem, gargoyle, fire
      // elemental's brute variant) had children[0]=legL Group bug.
      limbs.torso = torso;
      const armH=0.38*sc;
      [-1,1].forEach((s,i)=>{const pivot=new THREE.Group();pivot.position.set(s*.34*sc,legH+.38*sc,0);const arm=new THREE.Mesh(new THREE.BoxGeometry(.14*sc,armH,.14*sc),mat);arm.position.y=-armH/2;pivot.add(arm);g.add(pivot);limbs[i===0?'armL':'armR']=pivot;});
      const hd=new THREE.Mesh(new THREE.BoxGeometry(.32*sc,.26*sc,.26*sc),mat);hd.position.set(0,legH+.58*sc,0);g.add(hd);
      // Glowing eyes
      const ey=new THREE.Mesh(new THREE.BoxGeometry(.2*sc,.06*sc,.025),new THREE.MeshBasicMaterial({color:d.eyeCol}));ey.position.set(0,legH+.59*sc,.14*sc);g.add(ey);
      const eyeGl=new THREE.PointLight(d.eyeCol,0.8,2.2);eyeGl.position.set(0,legH+.59*sc,.22*sc);g.add(eyeGl);
    } else if(d.buildFn==='slime'){
      // S222 — the slime on the kit (Michael's answer B on Session 214, as shown): a soft glassy blob, the floor showing
      // through, squat and spread at the foot, a darker heart and what it has swallowed inside (a skull, a coin), two eyes.
      // Built at the prototype's size in a group scaled by the enemy's own; the tick wobbles limbs.body.
      const G=new THREE.Group();G.scale.setScalar(sc);g.add(G);const s0=Math.random()*6.28,big=sc>.55;
      const geo=SK.ball(.45,28,20),p=geo.attributes.position;
      for(let i=0;i<p.count;i++){const x=p.getX(i),yy=p.getY(i),z=p.getZ(i);const k=1+.06*Math.sin(x*9+s0)*Math.sin(z*8)+(yy<0?-.35*(-yy/.45)**2:0);const w=yy<0?1.12:1;p.setXYZ(i,x*w*k,yy*.72*k,z*w*k);}
      geo.computeVertexNormals();
      const body=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:d.col,transparent:true,opacity:.62,roughness:.15,metalness:.05}));body.position.y=.3;G.add(body);
      limbs.body=body;limbs.slime=true;
      const heart=new THREE.Mesh(SK.ball(.16,12,9),new THREE.MeshBasicMaterial({color:new THREE.Color(d.col).multiplyScalar(.45),transparent:true,opacity:.7}));heart.position.set(.05,.28,-.05);G.add(heart);
      if(big||Math.random()<.5){const sk=new THREE.Mesh(SK.ball(.06,8,6),new THREE.MeshStandardMaterial({color:0xd8d0b8,roughness:.85}));sk.position.set(-.12,.2,.02);G.add(sk);}
      if(big||Math.random()<.5){const coin=new THREE.Mesh(SK.cyl(.04,.04,.01,10),new THREE.MeshStandardMaterial({color:0xd4a020,metalness:.6,roughness:.35}));coin.position.set(.1,.15,.12);coin.rotation.set(1.2,.3,0);G.add(coin);}
      [-1,1].forEach(sd=>{const w=new THREE.Mesh(SK.ball(.055,8,6),new THREE.MeshBasicMaterial({color:0xffffff}));w.position.set(sd*.13,.52,.22);G.add(w);
        const pu=new THREE.Mesh(SK.ball(.027,6,5),new THREE.MeshBasicMaterial({color:0x101010}));pu.position.set(sd*.13,.53,.27);G.add(pu);});
      const eyeGl=new THREE.PointLight(d.eyeCol,0.4,1.5);eyeGl.position.set(0,0.4*sc,0.38*sc);g.add(eyeGl);
    } else if(d.buildFn==='elemental'){
      // S222 — the Fire Elemental on the kit (Michael's B on Session 214, as shown): a figure of flame over a molten core,
      // tongues of fire licking up the body, arms of fire with clawed hands of flame, a crown of fire. The flames are
      // additive and unlit; the tick flickers them (limbs.flames). The core's glow is its emissive, which the telegraph
      // and the parry flashes overwrite, so the tick eases it back (limbs.coreEm).
      const G=new THREE.Group();G.scale.setScalar(sc);g.add(G);const s0=Math.random()*6.28,flames=[];
      const fl=(geo,col,op,pos,rot,scl)=>{const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false}));m.position.set(...pos);if(rot)m.rotation.set(...rot);if(scl)m.scale.set(...scl);G.add(m);m.userData.s0=m.scale.clone();m.userData.op=op;flames.push(m);return m;};
      const core=new THREE.Mesh(SK.ball(.16,14,10),new THREE.MeshStandardMaterial({color:0x2a1008,emissive:0xff4400,emissiveIntensity:.9,roughness:.6}));core.position.y=.62;core.scale.set(1,1.2,.9);G.add(core);
      limbs.body=core;limbs.coreEm=new THREE.Color(0xff4400);
      for(let i=0;i<22;i++){const a=i*2.4+s0,h=.12+(i%5)*.05,rr=.07+(i%3)*.05,yy=.2+(i/22)*.8,k=1.2-i/30;
        fl(SK.cone(.05+(1-i/22)*.06,h*1.6,7),i%3?0xff6a10:0xffc040,.55,[Math.cos(a)*rr*k,yy,Math.sin(a)*rr*k],[Math.sin(a)*.25,0,Math.cos(a)*.25]);}
      for(const sd of [1,-1]){for(let i=0;i<6;i++)fl(SK.ball(.06-i*.006,8,6),i%2?0xff5010:0xffb030,.6,[sd*(.17+i*.045),.8-i*.075,.04+i*.015],null,[1,1.5,1]);
        for(let f=0;f<3;f++)fl(SK.cone(.02,.12,5),0xffd060,.7,[sd*(.42+f*.02),.36,.1+(f-1)*.03],[0,0,-sd*2.7]);}
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2;fl(SK.cone(.035,.2,6),0xffd060,.6,[Math.cos(a)*.07,1.02,Math.sin(a)*.07],[Math.sin(a)*.3,0,-Math.cos(a)*.3]);}
      fl(SK.ball(.3,12,9),0xff5010,.12,[0,.6,0],null,[1,1.6,1]);
      limbs.flames=flames;
      [-1,1].forEach(sd=>{const ey=new THREE.Mesh(SK.ball(.028,6,5),new THREE.MeshBasicMaterial({color:d.eyeCol}));ey.position.set(sd*.05,.9,.11);G.add(ey);});
      const bodyLight = new THREE.PointLight(d.light, 1.6, 6);
      bodyLight.position.set(0, 0.5*sc, 0);
      g.add(bodyLight);
      limbs.bodyLight = bodyLight;
    } else if(d.buildFn==='mimic'){
      // Mimic — chest mesh (shared with real lootable chests via buildChestShell). Teeth/eyes hidden until reveal.
      const shell=buildChestShell(g, sc, d.col);
      const mouth=buildMimicMouth(g, sc, shell.lid, d.eyeCol);limbs.jaw=shell.lid; // S198 — a mouth under the lid
      const eye = mouth.eyes;
      const eyeGl = new THREE.PointLight(d.eyeCol, 1.4, 2.8);
      eyeGl.position.set(0, 0.42*sc, 0.26*sc);
      eyeGl.intensity = 0;
      g.add(eyeGl);
      const teeth = mouth.teeth;
      limbs.revealEye = eye;
      limbs.revealTeeth = teeth;
      limbs.revealEyeGl = eyeGl;
    } else {
      // Wraith/Phantom — translucent-looking dark body
      const body=new THREE.Mesh(new THREE.BoxGeometry(.28*sc,.5*sc,.18*sc),mat);body.position.set(0,.5*sc,0);g.add(body);
      const hd=new THREE.Mesh(new THREE.BoxGeometry(.26*sc,.26*sc,.2*sc),mat);hd.position.set(0,.84*sc,0);g.add(hd);
      // Glowing eyes (bigger for ghostly effect)
      const ey=new THREE.Mesh(new THREE.BoxGeometry(.18*sc,.06*sc,.025),new THREE.MeshBasicMaterial({color:d.eyeCol}));ey.position.set(0,.85*sc,.11*sc);g.add(ey);
      const eyeGl=new THREE.PointLight(d.eyeCol,1.0,2.5);eyeGl.position.set(0,.85*sc,.18*sc);g.add(eyeGl);
      // Body aura — ghostly colour emanating from torso
      const auraGl=new THREE.PointLight(d.light,0.5,2.8);auraGl.position.set(0,.6*sc,0);g.add(auraGl);
      [-1,0,1].forEach(s=>{const t=new THREE.Mesh(new THREE.BoxGeometry(.06*sc,.2*sc,.06*sc),mat);t.position.set(s*.09*sc,.1*sc,0);g.add(t);});
    }
    // HP bar Y — matched to body height per buildFn
    // HP bar Y — matched to body height per buildFn
    const barY=(limbs.person?1.3:d.buildFn==='brute'?1.05:d.buildFn==='wraith'?1.1:d.buildFn==='slime'?.85:d.buildFn==='elemental'?1.15:d.buildFn==='mimic'?.60:d.buildFn==='wolf'?1.25:limbs.person?1.3:.95)*sc; // S196 — over a person's head
    const hpBg=new THREE.Mesh(new THREE.PlaneGeometry(.6,.07),new THREE.MeshBasicMaterial({color:0x440000,side:THREE.DoubleSide}));hpBg.position.set(0,barY,.01);g.add(hpBg);
    const hpFg=new THREE.Mesh(new THREE.PlaneGeometry(.6,.07),new THREE.MeshBasicMaterial({color:0x22dd22,side:THREE.DoubleSide}));hpFg.position.set(0,barY,.02);g.add(hpFg);
    // Disguised enemies (Mimic) shouldn't show an HP bar — would give away the disguise. Restored on reveal via limbs.hpBg reference.
    if(d.disguise){ hpBg.visible = false; hpFg.visible = false; }
    // v61c2 — Bosses use a top-of-screen HUD healthbar (#bossHpHud), not the
    // floating world-space bar. Hide both planes so the boss reads cleanly
    // against the village backdrop. The hpFg reference is still updated each
    // tick for the HUD's data-source, just not visible in-world.
    if(d.isBoss){ hpBg.visible = false; hpFg.visible = false; }
    limbs.hpBg = hpBg;
    return{g,hpFg,limbs};
  }
  function spawnFloorEnemies(map,floorIdx,baseY,dmgMult){
    // v80 S478 — the foes' spots, kinds and variants come from the floor's stream; each foe is keyed <dungeon>:<floor>:<index>
    // and rolls its fight from its own (keyFoe, 42-zone-enemies.js). The shuffle was a sort on Math.random.
    const dKey=dKeyOf(portal,floorIdx),dFoes=seededRng('dfoes',dKey);
    const themeEnemies=(THEME_DEF[portal.theme]||THEME_DEF.ruins).enemies;
    // v59: filter the theme roster to enemies the player has unlocked. Preserves order + repeats
    // so theme weighting (e.g. Skeleton appearing 3× in undead) still applies. If every entry is
    // gated (shouldn't happen — Skeleton is level 1), fall back to plain Skeleton.
    const availableEnemies=themeEnemies.filter(n=>{
      const ed=EM[n]||EM.Skeleton;
      return (ed.minLevel||1)<=level;
    });
    const pool=availableEnemies.length?availableEnemies:['Skeleton'];
    const ds=portal.diffScale||DIFF_SCALE.normal;
    const fc=[];for(let r=0;r<dR;r++)for(let c=0;c<dC;c++)if(map[r][c]===1)fc.push([c,r]);
    // v61b8: candidate filter for enemy spawn placement.
    //   - Standard rule: stay >5 cells from the dungeon entrance (so the
    //     player isn't ambushed the moment they step inside on a normal
    //     dungeon delve).
    //   - Tutorial-only addition: also stay >6 cells from the player's
    //     wake-up cell. The tutorial spawns the player far from the
    //     entrance (at portal._tutorialSpawn), and without a spawn-
    //     distance rule the generator is free to drop skeletons right
    //     next to the open sarcophagus — exactly what happened in
    //     playtest. The 6-cell radius gives the player enough breathing
    //     room to orient and read the intro fade without being engaged.
    //     First combat should be a chosen approach down the corridor,
    //     not a forced encounter at the wake-up beat.
    const _tutSp = (portal.tutorial && portal._tutorialSpawn) ? portal._tutorialSpawn : null;
    const candidates=fc.filter(([c,r])=>{
      if(floorIdx===1 && Math.hypot(c-dEntranceX,r-dEntranceZ)<=5) return false;
      if(_tutSp && Math.hypot(c-_tutSp.x, r-_tutSp.z)<=6) return false;
      // v61gi: reject cells blocked by a decoration prop or wall-column.
      // The v61g9 fixed-prop collision system means an enemy spawned on
      // top of a banquet table, bookshelf, forge, etc. is trapped inside
      // it — same dSolid check that blocks the player. Filter at spawn
      // candidate time so we don't have to relocate enemies after the
      // fact. Forts only — caves have no props or columns to hit.
      if(dPropHit(c, r) || dColumnHit(c, r)) return false;
      return true;
    });
    for(let i=candidates.length-1;i>0;i--){const j=Math.floor(dFoes()*(i+1));const t=candidates[i];candidates[i]=candidates[j];candidates[j]=t;}
    const spawns=[];const MIN_DIST=4;
    // v61b1: tutorial enemy cap. The procedural generator picks `gen.cfg.en`
    // enemies based on dungeon size — for 'small' that's 6+, which feels
    // crowded for a first-character tutorial. Cap at 3 for tutorial portals
    // so combat encounters are spaced out and each fight is a learning
    // moment rather than a press of bone.
    const _enemyCap = portal.tutorial ? 3 : gen.cfg.en;
    for(const pos of candidates){if(spawns.length>=_enemyCap)break;if(spawns.every(s=>Math.hypot(s[0]-pos[0],s[1]-pos[1])>=MIN_DIST))spawns.push(pos);}
    // S364 — a mimic stands where a chest would: an L-corner inside a room, clear of the chests (it stood on any floor
    // cell like the rest, a third of them in the open or a corridor, where no chest ever stands; a tell that beat the bait)
    const _mRooms=floorIdx===2?(gen.rooms2||[]):gen.rooms,_mOpen=(c,r)=>(map[r]?.[c]|0)>=1;
    const mimicSpots=candidates.filter(([c,r])=>{if(!_mRooms.some(rm=>c>=rm.x&&c<rm.x+rm.w&&r>=rm.y&&r<rm.y+rm.h))return false;
      if(CHESTS.some(ch=>ch.floor===floorIdx&&Math.abs(ch.x-c)+Math.abs(ch.z-r)<=1))return false;
      const n=_mOpen(c,r-1),so=_mOpen(c,r+1),e=_mOpen(c+1,r),w=_mOpen(c-1,r);return n+so+e+w===2&&!(n&&so)&&!(e&&w);});
    spawns.forEach(([ec,er],i)=>{
      const name=pool[i%pool.length];
      const baseDef=EM[name]||EM.Skeleton;
      // Variant roll — gated by player level + dungeon difficulty. `portal.diff` is 'veryeasy'..'veryhard'.
      const fid=`${dKey}:${i}`,fr=seededRng('dspawn',fid);
      const variantKey=pickVariant(name, level, portal.diff, seededRng('variant',fid));
      const vr=applyVariantToDef(baseDef, name, variantKey);
      const d=vr.def, displayName=vr.displayName;
      if(d.disguise&&mimicSpots.length){const k=mimicSpots.findIndex(([c,r])=>spawns.every((q,j)=>j===i||Math.hypot(q[0]-c,q[1]-r)>=2));if(k>=0){[ec,er]=mimicSpots.splice(k,1)[0];spawns[i]=[ec,er];}}
      // v56 rebalance: multiply HP and dmg by level-scaled factors so late-game weapons don't
      // trivialise the early dungeons. Baseline (level 1) remains unscaled.
      const hpLvl=enemyHpScale();
      const dmgLvl=enemyDmgScale();
      // v61aw: tutorial dampener. The first dungeon a fresh character ever
      // sees gets enemies tuned for "you've never fought before" — half HP
      // and half damage on top of whatever 'veryeasy' difficulty already
      // provides. The first hit shouldn't punish, the first kill should
      // feel earned but reachable. portal.tutorial is set only on the
      // hidden TUTORIAL_PORTAL; every regular dungeon (including future
      // ones marked 'veryeasy' difficulty) is unaffected.
      const tutMult = portal.tutorial ? 0.5 : 1.0;
      const scaledHp=Math.max(1,Math.round(d.hp*ds.hp*dmgMult*hpLvl*tutMult));
      const scaledSpd=d.spd*ds.spd*(dmgMult>1?1.1:1);
      const{g,hpFg,limbs}=buildEnemy(d,name);
      // v71 — Shieldbearer: build + raise the shield prop on the left arm.
      if(d.shieldUp){ attachShieldProp(g, limbs, limbs.person?1:d.scale, 'tower'); if(limbs.person){limbs.shieldArmUpZ=-.5;limbs.shieldArm.rotation.z=-.5;} } // S199 — a person's guard, as the captain's (S175)
      const baseYe=(d.buildFn==='wraith'&&!limbs.person?.3:0)+baseY; // S212 — a wraith person glides at its own height (tickPeople)
      g.position.set(ec,baseYe,er);dScene.add(g);
      const el=new THREE.PointLight(d.light,.7,4);el.position.set(ec,baseY+.8,er);dScene.add(el);
      // Disguised/dormant enemies should not glow at full strength — would give them away.
      // Mimic chest: no aura at all. Gargoyle statue: very dim. Both restored to .7 on reveal/activation.
      if(d.disguise) el.intensity = 0;
      else if(d.dormant) el.intensity = 0.15;
      ENEMIES.push({x:ec,z:er,hp:scaledHp,maxHp:scaledHp,mesh:g,hpFg,limbs,el,name:displayName,spd:scaledSpd,
        dead:false,alert:false,atkCd:0,ph:Math.random()*Math.PI*2,path:[],pathT:0,
        _origCol:d.col,baseY:baseYe,isWraith:d.buildFn==='wraith',atkAnim:0,atkDir:{x:0,z:0},
        walkT:Math.random()*Math.PI*2,ranged:!!d.ranged,rangedCd:1.5+fr()*1.5,
        dmgMult:(d.dmgMult||1.0)*ds.dmg*dmgMult*dmgLvl*tutMult,hasCried:false,floor:floorIdx,
        def:d.def||0,resist:d.resist||{},variant:vr.variant,xpMult:vr.xpMult,baseType:name,
        drainCd:0,disguised:!!d.disguise,dormant:!!d.dormant,fleeT:0,telegraphT:0,telegraphMax:0,
        // v71 — Shieldbearer frontal guard. shieldUp gates BOTH the power-vs-shield
        // force-break (existing v65 rule) and the new frontal damage reduction in
        // applyMeleeDamage. Flipped false when the guard breaks so follow-ups land full.
        shieldUp:!!d.shieldUp,
        // v63 — Patrol fields. Dungeon enemies now wander/scan when unaware.
        // patrolType is randomized 50/50 at spawn: 'wander' patrols a small
        // circle near homeX/homeZ; 'scan' stands still and slowly rotates.
        // patrolPhase + scanT give per-enemy timing offsets so they don't all
        // move in lockstep. homeX/homeZ anchor the wander radius.
        buildFn:d.buildFn,combatYaw:Math.random()*Math.PI*2,
        homeX:ec, homeZ:er,
        patrolType: fr() < 0.5 ? 'wander' : 'scan',
        patrolPhase: Math.random() * Math.PI * 2,
        scanT: 0});
      keyFoe(ENEMIES[ENEMIES.length-1],fid);
      if(limbs.person)limbs.person.e=ENEMIES[ENEMIES.length-1]; // S196 — tickPeople walks the body by the enemy's own position
      // v61gj — Posture init. Family resolves from buildFn (stamped above) so the
      // family lookup doesn't have to fall back to name-matching for dungeon enemies.
      initPosture(ENEMIES[ENEMIES.length-1]);
    });
  }
  spawnFloorEnemies(dMap,1,0,1.0);
  if(dMap2)spawnFloorEnemies(dMap2,2,FLOOR2_Y,1.5);

  // ── SIGIL PLACEMENT ─────────────────────────────────────────
  // Every entry in SIGIL_PLACEMENTS gets one sigil on floor 2 of its matching dungeon.
  // Sigils live on wall faces adjacent to open floor cells. UUID is deterministic (seed+spellId)
  // so re-entering the dungeon and touching the sigil again correctly hits the same touched-set entry.
  SIGILS.length=0;
  _nearSigil=null;
  const sigilSpellId=SIGIL_PLACEMENTS[portal.seed];
  if(sigilSpellId && dMap2){
    // Collect floor-2 floor cells that have at least one wall neighbor, excluding the stair cell.
    const candidates=[];
    for(let r=2;r<dR-2;r++){
      for(let c=2;c<dC-2;c++){
        if(dMap2[r][c]!==1)continue;
        if(c===dStairC && r===dStairR)continue;
        // Find a wall neighbor (face direction points from floor → wall)
        for(const [dc,dr] of [[0,-1],[0,1],[-1,0],[1,0]]){
          const nr=r+dr,nc=c+dc;
          if(nr<0||nr>=dR||nc<0||nc>=dC)continue;
          if(dMap2[nr][nc]===0){
            candidates.push({fc:c,fr:r,wc:nc,wr:nr,dc,dr});
            break;
          }
        }
      }
    }
    if(candidates.length){
      // Deterministic placement from seed so a sigil lives in the same spot every time you re-enter
      const idx=Math.abs(portal.seed*17+3)%candidates.length;
      const pick=candidates[idx];
      const mesh=buildSigilMesh(sigilSpellId);
      if(mesh){
        // Place mesh 0.48 units into the wall from the floor cell center (wall is 1 unit, so 0.48 puts it just below the surface)
        const wallX=pick.fc+pick.dc*0.48;
        const wallZ=pick.fr+pick.dr*0.48;
        mesh.position.set(wallX, FLOOR2_Y+1.2, wallZ);
        // Rotate disc so its face points back toward the floor (away from the wall interior)
        if(pick.dc===1){ mesh.rotation.y=-Math.PI/2; }
        else if(pick.dc===-1){ mesh.rotation.y=Math.PI/2; }
        else if(pick.dr===1){ mesh.rotation.y=Math.PI; }
        // dr===-1: default orientation (facing +Z... wait, default faces -Z). The disc is aligned along Z after rotation.x=PI/2 in buildSigilMesh, so the glyph faces +Z initially.
        // We want glyph to face the floor cell, which is at (fc,fr) opposite of the wall at (wc,wr). Interact distance uses the stand-point.
        dScene.add(mesh);
        const uuid=portal.seed+'_'+sigilSpellId;
        SIGILS.push({
          uuid,
          spellId:sigilSpellId,
          mesh,
          x:pick.fc, z:pick.fr,          // player stand-point (floor cell)
          wx:wallX, wz:wallZ,             // mesh XZ, used only for rendering
          floor:2,
        });
      }
    }
  }

  // v61ax / v61ay / v61az: tutorial decoration. When buildDungeon is
  // called for the tutorial portal, find the walkable floor cell with
  // the maximum euclidean distance from the entrance and place the
  // sarcophagus there. v61ax/v61ay used `dStairC/dStairR` which were
  // undefined or pointed to invalid (non-floor) cells for the small
  // tutorial seed — the player kept spawning out of bounds. The far-cell
  // flood-distance approach is bulletproof regardless of generator
  // quirks: any walkable floor cell with the max distance is, by
  // definition, walkable, and it's reliably "the far end" of whatever
  // layout the generator produced. The chosen cell is stored on the
  // portal as `_tutorialSpawn` so goToDungeon can read it for the
  // player's spawn coords without re-walking the map.
  if(portal.tutorial){
    // v61b8: spawn cell + yaw was precomputed at the top of buildDungeon
    // so the enemy spawn loop could reference it. This block now just
    // reads from `portal._tutorialSpawn` and places the sarcophagus mesh
    // + relocates keys. Sarcophagus visual position pulled from the same
    // {x, z} the player will actually wake up on.
    const _sp = portal._tutorialSpawn || {x: dEntranceX, z: dEntranceZ};
    // v61b2: relocate any existing keys to be far from PLAYER SPAWN
    // rather than far from the entrance. The default placement in
    // makeDungeon picks cells far from `entC,entR` — but for a tutorial,
    // the player ALSO spawns far from the entrance, so the key ends up
    // dropped right on top of them and they never have to find it. By
    // re-walking the floor and ranking cells by distance from the
    // spawn, the key ends up at the opposite end of the dungeon: the
    // player walks the full layout to find the key, then walks back
    // to use it on the locked door near the entrance.
    if(typeof KEYS !== 'undefined' && KEYS.length > 0){
      const _floorByDistFromSpawn=[];
      for(let _r=0; _r<dR; _r++){
        for(let _c=0; _c<dC; _c++){
          if(dMap[_r][_c]===1){ // floor only — exclude stair/special cells
            _floorByDistFromSpawn.push({c:_c, r:_r, d: Math.hypot(_c-_sp.x, _r-_sp.z)});
          }
        }
      }
      _floorByDistFromSpawn.sort((a,b)=>b.d-a.d);
      const _placed=[];
      KEYS.forEach((k,i)=>{
        const _slot = _floorByDistFromSpawn.find(s=>!_placed.some(p=>Math.hypot(p.c-s.c, p.r-s.r)<3));
        if(_slot){
          k.x = _slot.c;
          k.z = _slot.r;
          if(k.obj && k.obj.position) k.obj.position.set(_slot.c, k.obj.position.y, _slot.r);
          if(k.gl && k.gl.position) k.gl.position.set(_slot.c, k.gl.position.y, _slot.r);
          _placed.push({c:_slot.c, r:_slot.r});
        }
      });
    }
    const sarcoMat = new THREE.MeshLambertMaterial({color:0x4a4438});
    const sarcoLidMat = new THREE.MeshLambertMaterial({color:0x3a342c});
    const sarcoBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.85), sarcoMat);
    sarcoBody.position.set(_sp.x, 0.25, _sp.z);
    dScene.add(sarcoBody);
    const sarcoLid = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.10, 0.85), sarcoLidMat);
    sarcoLid.position.set(_sp.x + 0.30, 0.55, _sp.z + 0.15);
    sarcoLid.rotation.y = 0.18;
    sarcoLid.rotation.z = -0.06;
    dScene.add(sarcoLid);
  }
}

let _preDungeonZone='overworld'; // zone to return to after exiting dungeon
function goToDungeon(portal){if(!portal.tutorial&&activeZoneId==='world'&&typeof saveGame==='function')saveGame(); /* S353 — #66 A: the door going down saves you at the threshold (going up already saves in goToOW) */
  doFade(()=>{
  _preDungeonZone=activeZoneId;
  blocking=false;staggered=[];
  activeZoneId='dungeon';
  if(!portal.tutorial){
    // v61ax: skip the "Entered X" log + zone banner for tutorial. The
    // intro fade is doing the dungeon-entry beat in its own voice; a
    // generic "Entered The Crypt of First Light [Very Easy]" overlay
    // on top of the atmospheric text would break the spell.
    addLog('🏰','Entered '+portal.name);
  }
  sndEnterDungeon();
  lid=portal.id;
  if(!portal.tutorial){
    const _ds=portal.diffScale||DIFF_SCALE.normal;
    showZoneName('\u2694 '+portal.name+' ['+_ds.label+']');
  }
  document.getElementById('fbtn').style.display='block';
  buildDungeon(portal);scene=dScene;try{lairFinish(portal);}catch(e){} // v80 — the lair's master and its hoard
  if(window._playerTorchLight){try{[owScene,forestScene,ironhavenScene].forEach(s=>{if(s)s.remove(window._playerTorchLight);});if(typeof WORLD!=='undefined'&&WORLD.scene)WORLD.scene.remove(window._playerTorchLight);dScene.add(window._playerTorchLight);}catch(e){}} // v80 — the torch comes with you
  startMusic('dungeon',portal.theme);
  if(portal.tutorial){
    // v61az: spawn at the cell buildDungeon stored on portal._tutorialSpawn —
    // the walkable floor cell furthest from the entrance, where the
    // sarcophagus mesh also sits. Both v61ax (`*0.6` offset from dStairC)
    // and v61ay (`*1` offset from dStairC) failed in playtest because
    // dStairC/dStairR were undefined or non-floor for the tutorial seed.
    // The flood-distance approach in buildDungeon guarantees a walkable
    // cell. Yaw is computed to face the entrance — the player's goal —
    // so they wake up looking down the corridor they need to walk.
    const _sp = portal._tutorialSpawn;
    if(_sp){
      px = _sp.x; pz = _sp.z;
      // v61b1: yaw was computed in buildDungeon (longest-corridor walk
      // from spawn cell) and stored on _sp. Fall back to entrance-facing
      // for legacy compatibility if yaw isn't present.
      yaw = (_sp.yaw !== undefined) ? _sp.yaw : Math.atan2(dEntranceX - px, dEntranceZ - pz);
    } else {
      // Defensive fallback — buildDungeon should always have set this,
      // but if for some reason it didn't, fall back to entrance + 2-cell
      // offset (the standard non-tutorial spawn pattern).
      let _stepC=0, _stepR=0;
      for(const[dc,dr]of[[0,-1],[0,1],[-1,0],[1,0]]){
        const nc=dEntranceX+dc, nr=dEntranceZ+dr;
        if(nr>=0&&nr<dR&&nc>=0&&nc<dC&&dMap[nr][nc]>=1&&dMap[nr][nc]!==2){_stepC=dc;_stepR=dr;break;}
      }
      px=dEntranceX+_stepC*2; pz=dEntranceZ+_stepR*2;
      yaw=Math.atan2(-_stepC,-_stepR);
    }
    pitch=0; velY=0; jumpY=0; onGround=true;
    // No "Press E at entrance to leave" message — the tutorial intro and
    // Q0 popup are doing the orientation work.
    return;
  }
  let stepC=0,stepR=0;
  for(const[dc,dr]of[[0,-1],[0,1],[-1,0],[1,0]]){
    const nc=dEntranceX+dc,nr=dEntranceZ+dr;
    if(nr>=0&&nr<dR&&nc>=0&&nc<dC&&dMap[nr][nc]>=1&&dMap[nr][nc]!==2){stepC=dc;stepR=dr;break;}
  }
  px=dEntranceX+stepC*2;pz=dEntranceZ+stepR*2;
  yaw=Math.atan2(-stepC,-stepR);pitch=0;velY=0;jumpY=0;onGround=true;
  showMsg('Entered '+portal.name+'. Press E at entrance to leave.','#aaaaff');
});}
function goToOW(){
  // v61aw: tutorial exit branch. When the player ascends the stair from
  // the tutorial crypt (currentPortal.tutorial set by ccBegin → goToDungeon),
  // route to the south road into Ashenmoor instead of the normal "exit at
  // portal entrance" flow. The tutorial portal isn't in WORLD_DUNGEONS so
  // PORTALS.find(...) returns undefined — taking the normal path would
  // crash on `src.name`. We:
  //   1. spawn the player south of Ashenmoor on the road, facing north
  //      toward the village (the "oh wow" moment — sky and chimneys all
  //      at once after the dim crypt)
  //   2. flip worldState.tutorialDone so save migration / world-map
  //      gating treats them as past the tutorial
  //   3. fire enter_zone for Q0 — Q0 has autoComplete:true so it resolves
  //      inline, fires its completeText popup naming Bram, and unlocks Q1
  //      (which transitions to 'available', causing Bram's red waypoint
  //      cone to appear over the forge once they walk into the village).
  const _isTutorialExit = (currentPortal && currentPortal.tutorial) || lid==='tutorial_crypt';
  if(_isTutorialExit){
    silenceSigilHum();
    doFade(()=>{
      _clearInteractPrompt();
      blocking=false;staggered=[];
      lid='overworld';currentHouse=null;
      // v80 — the tutorial crypt now emerges into the streamed world, on the
      // shelf south of the Ashenmoor site. Q0 is closed quietly (its
      // completeText names Bram and the village, which don't exist here yet)
      // and Q1 is NOT unlocked — the quest layer is retired in a later session.
      worldState.tutorialDone = true;
      if(QS.q0_arrival){QS.q0_arrival.state='complete';(QS.q0_arrival.objectives||[]).forEach(o=>o.current=1);}
      sndReturnOW();
      addLog('🌅', `${playerName} stepped into the open air.`);
      WORLD.enter(null,null,null,'🌍 The open country');
    });
    return;
  }
  // S363: a gate entered while its cell was not loaded is not in PORTALS; the portal you went down is (was: src.name threw, at (15, 20))
  const src=PORTALS.find(p=>p.id===lid)||(currentPortal&&currentPortal.id===lid?currentPortal:null);
  const returnZone=_preDungeonZone||'overworld';
  silenceSigilHum();
  doFade(()=>{
    _clearInteractPrompt();
    blocking=false;staggered=[];
    lid='overworld';currentHouse=null;
    activeZoneId=returnZone;
    // Spawn near the portal entrance — use src coords for all zones
    const spawnX=src?src.x:15;
    const spawnZ=src?src.z+2:20;
    // v61: data-driven zone restore (same pattern as exitInterior). Hearthwick
    // and Bealach-South have no dungeons today so this branch is defensive,
    // but if a future settlement/wilderness zone gains a portal, the dungeon
    // exit will route home correctly without an if-chain edit.
    const zb=(typeof ZONE_BUILDERS!=='undefined')?ZONE_BUILDERS[returnZone]:null;
    if(zb){
      scene=zb.sceneGet()||owScene;
      ZE=(ZONES[returnZone]&&ZONES[returnZone].enemies)||[];
      ZB=[];
      px=spawnX;pz=spawnZ;
      yaw=(returnZone==='overworld')?Math.PI:Math.atan2(0,1);
      showZoneName(zb.displayName||'—');
      // v61c2 — Faolchú spawn check on dungeon-exit overworld return.
      // Same idempotent pattern as the goToZone hook: no-op unless
      // ashenmoorBurned && !faolchuDefeated && no boss already in ZE.
      if(returnZone==='overworld' && worldState.ashenmoorBurned && !worldState.faolchuDefeated){
        if(typeof spawnFaolchu==='function') spawnFaolchu();
      }
    } else {
      // Fallback — unknown zone id
      scene=owScene;ZE=[];ZB=[];
      px=spawnX;pz=spawnZ;yaw=Math.PI;
      showZoneName('🌿 Village of Ashenmoor');
    }
    document.getElementById('fbtn').style.display='block';
    pitch=0;velY=0;
    // Set jumpY to terrain height so player doesn't clip through ground
    jumpY=isOverworldZone()?activeTerrainH(px,pz):0;
    onGround=true;
    sndReturnOW();
    // v61b: per-zone music on dungeon exit (route through ZONE_BUILDERS)
    startMusic((zb&&zb.musicTrack)||'overworld');
    addLog('🌿','Left '+src.name);
    showMsg('You come up out of the gate.','#c8e88a');
    if(typeof WORLD!=='undefined'&&WORLD.onLeavePortal)try{WORLD.onLeavePortal(currentPortal,ENEMIES.every(e=>e.dead));}catch(e){} // v80 — the acts
    saveGame();
  });
}
