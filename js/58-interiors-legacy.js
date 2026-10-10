

// ── INTERIORS ────────────────────────────────────────────────
const intTX={
  plank:mkTex(x=>{x.fillStyle='hsl(28,35%,28%)';x.fillRect(0,0,128,128);for(let i=0;i<8;i++){x.fillStyle=`hsl(28,${30+Math.random()*15}%,${22+Math.random()*12}%)`;x.fillRect(0,i*16,128,15);}for(let i=0;i<6;i++){x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,i*16+15,128,1);}}),
  wwall:mkTex(x=>{x.fillStyle='hsl(26,20%,30%)';x.fillRect(0,0,128,128);for(let i=0;i<200;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.12})`;x.fillRect(Math.random()*128,Math.random()*128,Math.random()*6+1,Math.random()*2+1);}for(let r=0;r<128;r+=20)for(let c=0;c<128;c+=32){x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=1.2;x.strokeRect(c+(r%40<20?14:0),r,28,18);}}),
};
function mkIntMat(){return{floor:new THREE.MeshLambertMaterial({map:intTX.plank}),wall:new THREE.MeshLambertMaterial({map:intTX.wwall}),ceil:new THREE.MeshLambertMaterial({color:0x2a2018}),counter:new THREE.MeshLambertMaterial({color:0x6a3a10}),rug:new THREE.MeshLambertMaterial({color:0x7a2020})};}

// ── Interior prop helpers ─────────────────────────────────────────────
function _intBox(sc,x,y,z,w,h,d,col){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:col}));
  m.position.set(x,y,z);sc.add(m);return m;
}
function _intTorch(sc,x,z,W,D){
  // Wall sconce: bracket + flame glow
  const bracket=_intBox(sc,x,1.55,z,.08,.08,.18,0x4a3010);
  const flame=new THREE.PointLight(0xff8833,1.2,4);flame.position.set(x,1.7,z);sc.add(flame);
  const fcore=new THREE.Mesh(new THREE.SphereGeometry(.05,5,5),new THREE.MeshBasicMaterial({color:0xffcc44}));
  fcore.position.set(x,1.72,z);sc.add(fcore);
}
function _intShelf(sc,x,y,z,len,items,itemCols){
  _intBox(sc,x,y,z,len,.07,.2,0x7a4818);
  for(let i=0;i<items;i++){
    const col=itemCols?itemCols[i%itemCols.length]:new THREE.Color().setHSL(.08+Math.random()*.1,.5,.25+Math.random()*.2);
    const h=.12+Math.random()*.14,w=.1+Math.random()*.08;
    _intBox(sc,x-len/2+.15+i*(len/items),y+h/2+.04,z,w,h,.13,col);
  }
}
// S295 — the legacy rooms' (the safehouse's and Hearthwick's homes') furniture on the kit: the places the boxes stood
function _legacyRoomKit(W,ceilH){const K=furnKit(),P=K.Parts(),n='gatelands';
  P.put(K.table(.6,.6,n,5),1.6,1.4,0);{const q=K.Parts();K.candle(q,0,.46,0);P.put(q,1.6,1.4,0);}
  P.put(K.bookcase(2.4,n,6),W,3.0,-Math.PI/2);
  P.put(K.chair(n,7),W-1.4,5.0,-Math.PI/2);
  P.put(K.hearth(1.4,ceilH||2.2,n,8),W,1.0,-Math.PI/2);
  const room=K.bake(P);room.userData.furn=true;room.userData.legacyFurn=true;interiorScene.add(room);return room;}
// S300 — the legacy shops (Hearthwick's weaponsmith, armourer, apothecary and general goods) on the kit's shop rooms (S289–290),
// which share this builder's frame (x east, z south, the door at z=D); the counter at z 3.0 as in the generated shops; one bake
function _legacyShopKit(type,W,D,ceilH){const K=furnKit(),n='gatelands',s={weapon:211,armor:223,potion:237,misc:241}[type]||251;
  const P=type==='weapon'?K.smithy(W,D,ceilH,n,s):type==='armor'?K.armoury(W,D,ceilH,n,s):type==='potion'?K.apothecary(W,D,ceilH,n,s):K.goods(W,D,ceilH,n,s);
  P.put(K.counter(W*.5,n,s+5,true),W/2,3.0,0);
  if(type==='potion')P.put(K.table(1.4,.7,n,s+6),2,D*.65,0);
  const room=K.bake(P);room.userData.furn=true;room.userData.legacyFurn=true;interiorScene.add(room);return room;}
// S301 — the legacy inn and church on the kit (#46 A): the taproom is the generated inn's (S287) without its two beds, the hearth
// on the east wall; the church is the kit's pieces laid out for this narrower nave (the kit's own church puts its columns in
// the pews at W 10): the dais and altar, pulpit, pews either side of a 1.6 aisle, columns by the walls, standing candlesticks
function _legacyHallKit(type,W,D,ceilH){const K=furnKit(),n='gatelands',s=type==='inn'?263:271;let P;
  if(type==='inn')P=K.inn(W,D,ceilH,n,s,true);
  else{P=K.Parts();P.put(K.dais(W-2,3.0,.25,s),W/2,2.6,0);P.put(K.altar(n,s+1),W/2,1.6,0,.25);
    for(let z=5,k=0;z<D-2.5;z+=1.5,k++)for(const x of [W/2-2,W/2+2])P.put(K.pew(2.4,n,s+10+k*2+(x>W/2?1:0)),x,z,0);
    P.put(K.pulpit(n,s+3),W-2.4,3.6,0);
    for(const z of [5.5,9.5,13.5])if(z<D-2)for(const x of [W/2-4,W/2+4])P.put(K.column(ceilH,.24,s+20+z),x,z,0);
    for(const z of [7.5,11.5])for(const x of [W*.1,W*.9]){const q=K.Parts();q(SK.cyl(.13,.15,.04,12),0x2a2420,0,.02,0);q(SK.cyl(.022,.035,.96,8),0x2a2420,0,.5,0);q(SK.cyl(.08,.05,.03,10),0x2a2420,0,.99,0);K.candle(q,0,1.005,0);P.put(q,x,z,0);}}
  const room=K.bake(P);room.userData.furn=true;room.userData.legacyFurn=true;interiorScene.add(room);return room;}
// S302 — the legacy keep's hall on the kit (#46 A): a flagged dais with a runner and the carved throne, braziers before it, a
// long runner to the door, columns with banners hung towards the aisle, petitioners' benches clear of the columns
function _legacyKeepKit(W,D,ceilH){const K=furnKit(),n='gatelands',s=281,P=K.Parts(),dw=W*.55;
  P.put(K.dais(dw,3.2,.37,s),W/2,1.7,0);P.put(K.runner(2.6,1.6,0x7a2020,s),W/2,2.4,0,.37);P.put(K.throne(n,s+1),W/2,1.0,0,.37);
  P.put(K.runner(2.6,D-5,0x6a1010,s+2),W/2,3.3+(D-5)/2,0);
  [D*.18,D*.36,D*.54,D*.72].forEach((z,i)=>{for(const x of [W*.15,W*.85]){P.put(K.column(ceilH,.42,s+30+i),x,z,0);
    P.put(K.banner([0x7a2020,0x203a6a][i%2],s+i*2+(x<W/2?0:1)),x+(x<W/2?.6:-.6),z,Math.PI/2,ceilH*.6+1.2);}});
  for(const x of [W/2-3.5,W/2+3.5])P.put(K.brazier(s+40+x),x,4.0,0);
  [D*.35,D*.5,D*.65].forEach((z,i)=>{for(const x of [W*.3,W*.7])P.put(K.bench(W*.22,n,s+50+i*2+(x<W/2?0:1)),x,z,0);});
  const room=K.bake(P);room.userData.furn=true;room.userData.legacyFurn=true;interiorScene.add(room);return room;}
// S290 — the interiors' barrel and crate on the kit: the dungeon's barrel (kitBarrel, S200) at .44 high, and the shops' crate
// of planks between battens in the room's wood; each size baked once and shared. S293: _intCrate's y is the crate's centre,
// as every caller passes it (the old box sat its base there, so every crate floated by half its size)
const INT_KIT_GEO=new Map();
function _intBarrel(sc,x,z){
  let b=INT_KIT_GEO.get('barrel');if(!b){const B=kitBarrel(.8,0x5a3810);b={body:B.body.geometry,bm:B.body.material,top:B.top.geometry,tm:B.top.material};INT_KIT_GEO.set('barrel',b);}
  const g=new THREE.Group();g.position.set(x,0,z);g.add(new THREE.Mesh(b.body,b.bm));const t=new THREE.Mesh(b.top,b.tm);t.position.y=.44-.024;g.add(t);sc.add(g);return g;
}
function _intCrate(sc,x,y,z,s=.38){
  const K=furnKit(),n=INT_BED_NATION||'gatelands',key='crate|'+n+'|'+s.toFixed(2);let geo=INT_KIT_GEO.get(key);
  if(!geo){geo=K.bake(K.crate(s,n,Math.round(s*100))).children[0].geometry;INT_KIT_GEO.set(key,geo);}
  const m=new THREE.Mesh(geo,K.MAT);m.position.set(x,Math.max(0,y-s/2),z);sc.add(m);return m;
}
function _intPew(sc,x,z,len=2.2){
  // Seat
  _intBox(sc,x,.48,z,len,.07,.45,0x5a3010);
  // Back — on the far side (+Z) so occupants face toward altar (low Z)
  _intBox(sc,x,.8,z+.19,len,.65,.06,0x5a3010);
  // Legs
  [-len/2+.15,len/2-.15].forEach(lx=>{_intBox(sc,x+lx,.24,z,.1,.42,.4,0x4a2808);});
}
function _intColumn(sc,x,z,h=2.1){
  // Base
  _intBox(sc,x,.15,z,.45,.3,.45,0x888070);
  // Shaft
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.14,.16,h-.4,10),new THREE.MeshLambertMaterial({color:0x9a9080}));
  shaft.position.set(x,(h-.4)/2+.3,z);sc.add(shaft);
  // Capital
  _intBox(sc,x,h-.08,z,.42,.22,.42,0x888070);
}

// v61g3 — Chandelier mesh for large interior rooms (fort Great Hall,
// Lord's Chamber). Hangs from a vertical chain attached to the ceiling
// at (x, ceilY, z). The chandelier sits at ringY = ceilY - 1.5, with
// candles around an iron torus ring. Includes a warm PointLight at
// the chandelier center. Reusable from any interior scene.
function _intChandelier(sc, x, z, ceilY){
  const ringY = ceilY - 1.5;
  const ringR = 0.55;
  const ironMat = new THREE.MeshLambertMaterial({color: 0x2a2018});
  const candleMat = new THREE.MeshLambertMaterial({color: 0xe8d8b0});
  const flameMat = new THREE.MeshBasicMaterial({color: 0xffcc55});

  // Chain — vertical cylinder from ceiling to ring
  const chainLen = ceilY - ringY;
  const chain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, chainLen, 5),
    ironMat
  );
  chain.position.set(x, ringY + chainLen/2, z);
  sc.add(chain);

  // Main ring — TorusGeometry at ring height
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(ringR, 0.04, 5, 14),
    ironMat
  );
  ring.position.set(x, ringY, z);
  ring.rotation.x = Math.PI / 2;
  sc.add(ring);

  // Cross-bars — 4 horizontal supports connecting ring to chain
  for(let i = 0; i < 4; i++){
    const angle = (i / 4) * Math.PI * 2;
    const bx = x + Math.cos(angle) * (ringR * 0.5);
    const bz = z + Math.sin(angle) * (ringR * 0.5);
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, ringR, 4),
      ironMat
    );
    bar.position.set((x + bx) / 2, ringY + 0.02, (z + bz) / 2);
    bar.rotation.z = Math.PI / 2;
    bar.rotation.y = -angle;
    sc.add(bar);
  }

  // Candles — 6 around the ring perimeter
  const candleCount = 6;
  for(let i = 0; i < candleCount; i++){
    const angle = (i / candleCount) * Math.PI * 2;
    const cx = x + Math.cos(angle) * ringR;
    const cz = z + Math.sin(angle) * ringR;
    // Candle body
    const candle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.22, 6),
      candleMat
    );
    candle.position.set(cx, ringY + 0.13, cz);
    sc.add(candle);
    // Flame
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 4, 4),
      flameMat
    );
    flame.position.set(cx, ringY + 0.27, cz);
    sc.add(flame);
  }

  // Center light — warm point light hanging at the ring height
  const light = new THREE.PointLight(0xffaa55, 2.0, 8);
  light.position.set(x, ringY + 0.05, z);
  sc.add(light);
  // Add to TORCHES so the existing flicker animation picks it up.
  // (Module-level TORCHES is accessible from this function's call sites
  // in dungeon scope where TORCHES is defined.)
  if(typeof TORCHES !== 'undefined'){
    TORCHES.push({l: light, fl: null, ph: Math.random() * Math.PI * 2});
  }
}

// v61d4 — Single bed mesh for the safehouse. Frame, mattress, single
// pillow at the +Z (head) end. Footprint 0.95w × 1.95d. The y-position
// is the FLOOR position (0); the bed's top surface sits at .55. Returns
// the bed group so callers can stash a reference for proximity checks
// (e.g. interactBed). Optional headFace flag — 'N' (head at low Z) or
// 'S' (head at high Z); defaults to 'N' for the safehouse layout where
// the bed runs along the west wall with head pointing north (low Z).
// S288 — the kit's box bed (the concept artist's, #46 A): turned posts, a planked headboard, a stuffed tick, a three-band
// quilt and a pillow, 1.5 long, in the nation's wood (INT_BED_NATION, set by buildInteriorFor), three quilts a nation,
// each baked once and shared by every bed that draws it. Head at low z for 'N', high z for 'S'; the floor at y 0.
let INT_BED_NATION='gatelands';const INT_BED_GEO=new Map();
function _intBed(sc,x,z,headFace){
  const K=furnKit(),n=INT_BED_NATION||'gatelands',v=Math.abs(Math.round(x*7+z*13))%3,key=n+'|'+v;
  let geo=INT_BED_GEO.get(key);if(!geo){const G=K.bake(K.bed(n,41+v*17));geo=G.children[0].geometry;INT_BED_GEO.set(key,geo);}
  const bed=new THREE.Group();bed.position.set(x,0,z);if(headFace==='S')bed.rotation.y=Math.PI;
  bed.add(new THREE.Mesh(geo,K.MAT));sc.add(bed);
  return bed;
}

// v61d4 — Stash chest mesh for the safehouse. Visually distinct from
// dungeon treasure chests (which spawn via the CHESTS system) — slightly
// larger, ironbound, lid sits flat. Returns the group so callers can
// stash a reference for proximity-based interaction.
function _intStashChest(sc,x,z){
  const ch=new THREE.Group();
  ch.position.set(x,0,z);
  const woodMat=new THREE.MeshLambertMaterial({color:0x6a4218});
  const ironMat=new THREE.MeshLambertMaterial({color:0x383028});
  // Body
  const body=new THREE.Mesh(new THREE.BoxGeometry(.85,.55,.55),woodMat);
  body.position.set(0,.275,0);ch.add(body);
  // Lid (flat top — visually closed)
  const lid=new THREE.Mesh(new THREE.BoxGeometry(.88,.10,.58),woodMat);
  lid.position.set(0,.60,0);ch.add(lid);
  // Iron bands — three across the body, two on the lid
  [-.30,0,.30].forEach(bx=>{
    const band=new THREE.Mesh(new THREE.BoxGeometry(.04,.58,.58),ironMat);
    band.position.set(bx,.27,0);ch.add(band);
  });
  // Front lock plate — small iron rectangle
  const lock=new THREE.Mesh(new THREE.BoxGeometry(.18,.14,.04),ironMat);
  lock.position.set(0,.40,.295);ch.add(lock);
  sc.add(ch);
  return ch;
}

function buildInterior(house){
  if(interiorScene)interiorScene.traverse(o=>{if(o.userData&&o.userData.legacyFurn)o.traverse(m=>{if(m.isMesh)m.geometry.dispose();});}); // S300 — the last legacy bake freed
  INT_BED_NATION='gatelands';
  if(interiorScene)while(interiorScene.children.length)interiorScene.remove(interiorScene.children[0]);
  interiorScene=new THREE.Scene();
  interiorScene.background=new THREE.Color(0x120a06);
  // v61d4 — Reset safehouse interaction state at the start of every interior
  // build. The safehouse branch below will re-set these if applicable; for
  // any other building type they stay null, so the proximity check skips.
  intStashPos=null;
  intBedPos=null;

  const type=house.type||'misc';

  // Room dimensions by type
  const DIMS={
    weapon: {W:11,D:10,ceilH:2.4,fogN:7,fogF:20},
    armor:  {W:11,D:10,ceilH:2.4,fogN:7,fogF:20},
    potion: {W:9, D:9, ceilH:2.2,fogN:6,fogF:18},
    misc:   {W:10,D:9, ceilH:2.3,fogN:6,fogF:18},
    inn:    {W:13,D:11,ceilH:2.5,fogN:8,fogF:22},
    church: {W:10,D:16,ceilH:3.8,fogN:10,fogF:28},
    castle: {W:18,D:22,ceilH:5.2,fogN:12,fogF:36},
    // v61d4 — Safehouse interior. Compact (8×8) — feels intimate without
    // being cramped. Lower ceiling (2.2) reads as residential rather than
    // commercial; warmer fog falloff (5/16) for a closer, hearth-lit feel.
    safehouse:{W:8,D:8,ceilH:2.2,fogN:5,fogF:16},
  };
  const {W,D,ceilH,fogN,fogF}=DIMS[type]||DIMS.misc;
  try{house._ceilH=ceilH;}catch(e){} // v80 S126 — the third-person camera reads the real ceiling
  interiorScene.fog=new THREE.Fog(0x120a06,fogN,fogF);

  const M={
    floor:new THREE.MeshLambertMaterial({map:intTX.plank}),
    sfloor:new THREE.MeshLambertMaterial({map:intTX.wwall}), // stone floor for church
    wall:new THREE.MeshLambertMaterial({map:intTX.wwall}),
    ceil:new THREE.MeshLambertMaterial({color:0x2a2018}),
    counter:new THREE.MeshLambertMaterial({color:0x6a3a10}),
    rug:new THREE.MeshLambertMaterial({color:type==='church'?0x6a2020:type==='armor'||type==='weapon'?0x203050:0x7a2020}),
    stone:new THREE.MeshLambertMaterial({color:0x888070}),
  };

  const floorMat=type==='church'||type==='castle'?M.sfloor:M.floor;
  interiorScene.add(new THREE.AmbientLight(0xffa060,type==='church'?.35:type==='castle'?.28:.5));

  // Floor
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(W,D),floorMat);fl.rotation.x=-Math.PI/2;fl.position.set(W/2,0,D/2);interiorScene.add(fl);
  // S356 (#62 A) — the ceiling, the walls and (built after the furniture, below) the frame on the kit, as in the generated rooms
  // (S342): Hearthwick is a Gatelands village, so its rooms are plastered and its church and keep ashlar; the beams keep the
  // old count and places
  const shellKind=type==='church'||type==='castle'?'ashlar':'plaster';
  WORLD.shellWalls(interiorScene,W,D,ceilH,shellKind,'irish');
  const beamCount=type==='church'?4:type==='castle'?6:2,shellBeams=[];
  for(let i=1;i<=beamCount;i++)shellBeams.push(D*i/(beamCount+1));

  // Rug
  const rugW=type==='church'?2:type==='castle'?2.5:Math.min(W-2,4);
  const rugD=type==='church'?D-3:type==='castle'?D-4:3;
  const rugColor=type==='church'?0x6a2020:type==='castle'?0x6a1010:type==='armor'||type==='weapon'?0x203050:0x7a2020;
  // S304 — the rug on the kit (#46 A): the church's a bordered runner from the dais's front (z 4.1) to the door, the other rooms'
  // an oval rag rug where the flat plane lay; its own small bake, freed with the room's (legacyFurn, not furn); the keep's runner is its bake's
  if(type!=='castle'){const K=furnKit(),rd=D-5.1,R=type==='church'?K.bake(K.runner(2,rd,rugColor,307)):K.bake(K.rug(rugW/2,rugD/2,'gatelands',type.length*7+300));
    if(type==='church')R.position.set(W/2,0,4.1+rd/2);else R.position.set(W/2,0,D/2+.5);R.userData.legacyFurn=true;R.userData.rug=true;interiorScene.add(R);}

  // Main overhead light
  const lantern=new THREE.PointLight(0xffaa44,2.8,Math.max(W,D)*1.4);lantern.position.set(W/2,ceilH-.3,D/2);interiorScene.add(lantern);
  const lcore=new THREE.Mesh(new THREE.SphereGeometry(.07,6,6),new THREE.MeshBasicMaterial({color:0xffdd88}));lcore.position.copy(lantern.position);interiorScene.add(lcore);

  // Exit door (south wall)
  const eDisc=new THREE.Mesh(new THREE.CircleGeometry(.5,10),new THREE.MeshBasicMaterial({color:0xc8a84a,transparent:true,opacity:.18,side:THREE.DoubleSide}));
  eDisc.rotation.x=-Math.PI/2;eDisc.position.set(W/2,.02,D-.7);interiorScene.add(eDisc);

  // Windows — side walls
  // S331 (Michael's 2 on #53) — kit frames by the room, one bake: the trades and the inn leaded (A); a church or a keep's hall
  // leaded below and round-headed stone (C) above, the rows eased apart so the frames clear each other. The pane behind is
  // the painted view of Hearthwick (a village), or a church's lit glass
  const winHeights=type==='church'?[ceilH*.45,ceilH*.78]:type==='castle'?[ceilH*.55,ceilH*.82]:[ceilH*.55];
  const winPositions=type==='church'?[D*.25,D*.5,D*.75]:type==='castle'?[D*.2,D*.38,D*.56,D*.74]:[D*.35,D*.65];
  {const K=furnKit(),WP=K.Parts();let wi=0;
    winPositions.forEach(wz=>winHeights.forEach((wy,row)=>{const kind=K.winKind(type,row===1),w=type==='church'?.8:.9,h=kind!=='C'?(type==='church'?.8:.95):type==='church'?1.1:1.4;
      for(const x of [0,W]){const west=x<1,R=w/2;let geo;if(kind==='C'){const sh=new THREE.Shape();sh.moveTo(-R,-h/2);sh.lineTo(R,-h/2);sh.lineTo(R,h/2-R);sh.absarc(0,h/2-R,R,0,Math.PI,false);sh.lineTo(-R,-h/2);geo=new THREE.ShapeGeometry(sh,12);}else geo=new THREE.PlaneGeometry(w,h);
        const mat=type==='church'||kind==='C'?new THREE.MeshBasicMaterial({color:type==='church'?0xc8b070:0xa8b8c8}):new THREE.MeshBasicMaterial({map:WORLD.windowView(1,'gatelands')});
        const pane=new THREE.Mesh(geo,mat);pane.position.set(west?.006:W-.006,wy,wz);pane.rotation.y=west?Math.PI/2:-Math.PI/2;interiorScene.add(pane);
        {const wl=new THREE.PointLight(0xc8e8ff,.6,3);wl.position.set(west?.5:W-.5,wy,wz);interiorScene.add(wl);}
        WP.put(K.windowFrame(kind,w,h,'gatelands',300+wi++),x,wz,west?Math.PI/2:-Math.PI/2,wy);}}));
    const G=K.bake(WP);G.userData.legacyFurn=true;G.userData.windows=true;interiorScene.add(G);}

  // ── TYPE-SPECIFIC PROPS ──────────────────────────────────────────────

  // S300 — the four shops on the kit (#46 A): the smithy, the armourer, the apothecary and the general goods with the panelled
  // counter, one bake (_legacyShopKit); the crates, barrels, torches and lights as they were
  if(type==='weapon'){
    _legacyShopKit(type,W,D,ceilH);
    const fgl=new THREE.PointLight(0xff6a20,1.6,6);fgl.position.set(1.2,.62,2.0);interiorScene.add(fgl);
    const cgl=new THREE.PointLight(0xff8833,1.2,5);cgl.position.set(W/2,1.5,3.0);interiorScene.add(cgl);
    _intCrate(interiorScene,1.2,.19,D-2);_intCrate(interiorScene,W-1.2,.16,D-2,.32);
    _intTorch(interiorScene,.15,D*.35);_intTorch(interiorScene,.15,D*.7);
    _intTorch(interiorScene,W-.15,D*.7);
    intNPCPos={x:W/2,z:1.8};
  }

  else if(type==='armor'){
    _legacyShopKit(type,W,D,ceilH);
    const cgl2=new THREE.PointLight(0xff8833,1.2,5);cgl2.position.set(W/2,1.5,3.0);interiorScene.add(cgl2);
    _intCrate(interiorScene,1,.19,D-1.8);_intCrate(interiorScene,W-1,.19,D-1.8);
    _intTorch(interiorScene,.15,D*.4);_intTorch(interiorScene,W-.15,D*.4);
    intNPCPos={x:W/2,z:2.3};
  }

  else if(type==='potion'){
    _legacyShopKit(type,W,D,ceilH);
    const cgl3=new THREE.PointLight(0x88aaff,1.0,5);cgl3.position.set(W/2,1.5,3.0);interiorScene.add(cgl3);
    const sgl=new THREE.PointLight(0x60ff80,1.0,5);sgl.position.set(W-1.6,.8,1.8);interiorScene.add(sgl);
    intNPCPos={x:W/2,z:2.3};
  }

  else if(type==='misc'){
    _legacyShopKit(type,W,D,ceilH);
    const cgl4=new THREE.PointLight(0xff8833,1.2,5);cgl4.position.set(W/2,1.5,3.0);interiorScene.add(cgl4);
    _intBarrel(interiorScene,1.0,D-1.8);_intBarrel(interiorScene,1.5,D-1.5);
    _intBarrel(interiorScene,W-1.0,D-1.8);
    _intCrate(interiorScene,W-1.4,.19,D-1.6);_intCrate(interiorScene,W-1.0,.15,D-2.2,.3);
    intNPCPos={x:W/2,z:2.3};
  }

  // S301 — the inn and the church on the kit, one bake each (_legacyHallKit); the barrels, torches and lights as they were,
  // the fire's light moved to the kit hearth on the east wall, the altar's lights up to its candlesticks
  else if(type==='inn'){
    _legacyHallKit(type,W,D,ceilH);
    _intBarrel(interiorScene,.6,.5);_intBarrel(interiorScene,1.1,.5);
    _intBarrel(interiorScene,W-.6,.5);_intBarrel(interiorScene,W-1.1,.5);
    const fire=new THREE.PointLight(0xff6600,2.0,6);fire.position.set(W-.8,.6,D*.5);interiorScene.add(fire);
    _intTorch(interiorScene,.15,D*.25);_intTorch(interiorScene,W-.15,D*.25);
    _intTorch(interiorScene,.15,D*.75);_intTorch(interiorScene,W-.15,D*.75);
    intNPCPos={x:W/2,z:1.2};
  }

  else if(type==='church'){
    _legacyHallKit(type,W,D,ceilH);
    [-0.8,0.8].forEach(cx=>{
      const flame=new THREE.PointLight(0xff9933,.8,2.5);flame.position.set(W/2+cx,1.35,1.6);interiorScene.add(flame);
    });
    // Sigil on back wall — simple geometric placeholder
    _intBox(interiorScene,W/2,ceilH*.55,.05,.8,.8,.04,0x2a1808); // backing
    _intBox(interiorScene,W/2,ceilH*.55,.03,.08,.6,.05,0xc8a84a); // vertical bar
    _intBox(interiorScene,W/2,ceilH*.55,.03,.6,.08,.05,0xc8a84a); // horizontal bar
    [7.5,11.5].forEach(cz=>{
      const cf=new THREE.PointLight(0xff9933,.7,3);cf.position.set(W*.1,1.15,cz);interiorScene.add(cf);
      const cf2=new THREE.PointLight(0xff9933,.7,3);cf2.position.set(W*.9,1.15,cz);interiorScene.add(cf2);
    });
    intNPCPos={x:W/2,z:.7}; // priest behind the altar (it stood in it at D*.08)
  }

  // S302 — the keep's hall on the kit, one bake (_legacyKeepKit); the column torches moved from the columns' centres (inside
  // the shafts) to their faces towards the door; the throne's light and the guards where the new dais leaves room
  else if(type==='castle'){
    const daisW=W*.55, daisD=3.3;
    _legacyKeepKit(W,D,ceilH);
    const throneLight=new THREE.PointLight(0xffcc66,1.8,5);throneLight.position.set(W/2,ceilH*.7,1.0);interiorScene.add(throneLight);
    [W/2-3.5,W/2+3.5].forEach(x=>{const bl=new THREE.PointLight(0xff6a20,1.3,8);bl.position.set(x,1.0,4.0);interiorScene.add(bl);});
    [[W*.15,D*.18],[W*.85,D*.18],[W*.15,D*.54],[W*.85,D*.54],[W*.15,D*.72],[W*.85,D*.72]].forEach(([tx,tz])=>_intTorch(interiorScene,tx,tz+.5));
    [[W/2-2,0.12],[W/2+2,0.12]].forEach(([tx,tz])=>_intTorch(interiorScene,tx,tz));

    // ── Royal seal on floor at entrance ───────────────────────
    const sealMat=new THREE.MeshLambertMaterial({color:0xc8a020,transparent:true,opacity:.35});
    const seal=new THREE.Mesh(new THREE.CircleGeometry(1.4,8),sealMat);
    seal.rotation.x=-Math.PI/2;seal.position.set(W/2,.015,D*.85);interiorScene.add(seal);
    const sealInner=new THREE.Mesh(new THREE.CircleGeometry(.7,8),sealMat);
    sealInner.rotation.x=-Math.PI/2;sealInner.position.set(W/2,.016,D*.85);interiorScene.add(sealInner);

    // ── Guard positions — flanking the dais ───────────────────
    // (stored for buildNPCMesh — guards built below via castle guard NPCs)
    interiorScene.userData.guardPositions=[
      {x:W/2-daisW/2+0.5,z:daisD+0.5,facing:0},
      {x:W/2+daisW/2-0.5,z:daisD+0.5,facing:0},
    ];

    // Build the two flank guards inline (separate from the main NPC)
    interiorScene.userData.guardPositions.forEach(gp=>{
      const gDef={role:'Guard Captain',bCol:0x384858,sCol:0x6888aa};
      const guardMesh=buildNPCMesh(gDef);
      guardMesh.position.set(gp.x,0,gp.z);
      guardMesh.rotation.y=gp.facing;
      interiorScene.add(guardMesh);
    });

    intNPCPos={x:W/2,z:4.2}; // regent stands in front of dais (S302: at 2.8 he stood on it, sunk to the shins)
  }

  // v61d4 — Safehouse: the player's private space granted by Caldric. No
  // keeper, no shop counter. Bed for full-restore rest, stash chest for
  // persistent storage, plus warm domestic detail (rug, side table with
  // lantern, bookshelf, simple chair, hearth corner). Layout reads as a
  // small one-room residence — modest, functional, lit by the side
  // lantern + main overhead. Bed runs along the west wall (head north),
  // stash chest centered on the back wall, hearth in the NE corner.
  // intStashPos / intBedPos are recorded for the proximity-interact path.
  else if(type==='safehouse'){
    const woodMat=new THREE.MeshLambertMaterial({color:0x5a3818});
    // Bed — west wall, head pointing north (low Z)
    _intBed(interiorScene,1.0,2.6,'N');
    intBedPos={x:1.0,z:2.6};
    // Stash chest — centered on back wall (low Z), pulled forward slightly
    // so the player can stand IN FRONT to interact rather than against
    // the wall.
    _intStashChest(interiorScene,W/2,1.0);
    intStashPos={x:W/2,z:1.0};
    // S295 — the safehouse's furniture on the kit (#46 A): a side table with a candle, a bookcase on the east wall, a
    // ladder-back chair facing into the room, the stone hearth in the north-east corner; one bake (_legacyRoomKit)
    _legacyRoomKit(W,ceilH);
    const tablePL=new THREE.PointLight(0xffaa44,1.4,4);
    tablePL.position.set(1.6,.55,1.4);interiorScene.add(tablePL);
    const embPL=new THREE.PointLight(0xff5020,.8,2.5);
    embPL.position.set(W-.42,.30,1.0);interiorScene.add(embPL);
    // Small rug centered on the room (overrides default rug placement)
    // [the default is already drawn above; safehouse keeps it]
  }  else if(type==='home'){ // v80 — generated residences: the safehouse room without the stash
    const woodMat=new THREE.MeshLambertMaterial({color:0x5a3818});
    // Bed — west wall, head pointing north (low Z)
    _intBed(interiorScene,1.0,2.6,'N');
    intBedPos={x:1.0,z:2.6};
    // Stash chest — centered on back wall (low Z), pulled forward slightly
    // so the player can stand IN FRONT to interact rather than against
    // the wall.
    // S295 — the safehouse's furniture on the kit (#46 A): a side table with a candle, a bookcase on the east wall, a
    // ladder-back chair facing into the room, the stone hearth in the north-east corner; one bake (_legacyRoomKit)
    _legacyRoomKit(W,ceilH);
    const tablePL=new THREE.PointLight(0xffaa44,1.4,4);
    tablePL.position.set(1.6,.55,1.4);interiorScene.add(tablePL);
    const embPL=new THREE.PointLight(0xff5020,.8,2.5);
    embPL.position.set(W-.42,.30,1.0);interiorScene.add(embPL);
    // Small rug centered on the room (overrides default rug placement)
    // [the default is already drawn above; safehouse keeps it]
  }

  // Castle regent faces the entrance (throne is at z≈0.77 of daisD=2.2 → z≈0.62)
  if(type==='castle') intNPCPos={x:W/2,z:4.2};

  // S356 — the frame. The legacy rooms keep no furniture solids (the walls bound the player), so a post is left out wherever
  // a triangle of the furniture comes within its column; posts stand only at the walls, where the bounds keep the player off them
  {interiorScene.updateMatrixWorld(true);const furn=[];interiorScene.traverse(o=>{if(!o.isMesh)return;for(let q=o;q&&q!==interiorScene;q=q.parent)if(q.userData.shaded||q.userData.rug||q.userData.windows)return;
      const t=o.geometry.type;if(t==='PlaneGeometry'||t==='CircleGeometry'||t==='ShapeGeometry'||t==='SphereGeometry')return;o.geometry.computeBoundingBox();furn.push({o,bb:o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)});});
    const v=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
    const block=(x0,x1,z0,z1)=>{for(const {o,bb} of furn){if(bb.min.x>x1||bb.max.x<x0||bb.min.z>z1||bb.max.z<z0||bb.min.y>ceilH-.3||bb.max.y<.05)continue;
      const pos=o.geometry.attributes.position,idx=o.geometry.index,n=idx?idx.count:pos.count;
      for(let i=0;i<n;i+=3){for(let k=0;k<3;k++)v[k].fromBufferAttribute(pos,idx?idx.getX(i+k):i+k).applyMatrix4(o.matrixWorld);
        if(Math.min(v[0].x,v[1].x,v[2].x)<x1&&Math.max(v[0].x,v[1].x,v[2].x)>x0&&Math.min(v[0].z,v[1].z,v[2].z)<z1&&Math.max(v[0].z,v[1].z,v[2].z)>z0&&Math.max(v[0].y,v[1].y,v[2].y)>.05&&Math.min(v[0].y,v[1].y,v[2].y)<ceilH-.3)return true;}}return false;};
    WORLD.shellFrame(interiorScene,{W,D,H:ceilH,type,st:'irish',wallKind:shellKind,FN:'gatelands',FSEED:300+type.length*17,beams:shellBeams,wins:winPositions,TALLZ:[],SOL:[],FOOTHOLDS:[],block});}

  // ── Interior NPC — look up keeper's actual role/colours for visual consistency ──
  // Priority: outdoor NPC_DEF (has role) → SHOP_DIALOG/IRONHAVEN_DIALOG (has role)
  // → fall back to type-based generic role
  // v61d4 — Skip keeper-NPC build entirely when house.keeper is null (the
  // safehouse case). Without this gate, buildNPCMesh would spawn a phantom
  // merchant in the player's private space, with default colours and the
  // generic "Merchant" role since no NPC_DEF/SHOP_DIALOG entry exists.
  if(!house.keeper){
    intNPCMesh=null;
    return;
  }
  const keeperName=house.keeper||'';
  const owNpcDef=NPC_DEF.find(n=>n.name===keeperName);
  const dlgDef=SHOP_DIALOG[keeperName]||IRONHAVEN_DIALOG[keeperName];
  const keeperRole = owNpcDef ? owNpcDef.role :
                     dlgDef   ? dlgDef.role   :
                     type==='church' ? 'Priest' :
                     type==='home'   ? 'Resident' :
                     type==='inn'    ? 'Innkeeper' :
                     type==='castle' ? 'Lord Regent' : 'Merchant';
  const intDef={
    role: keeperRole,
    bCol: house.bCol||0x5a4030,
    sCol: house.sCol||0xd4a878,
  };
  const g=buildNPCMesh(intDef);
  // Castle regent and church priest face the entrance; others face entrance too
  g.rotation.y = type==='church' ? 0 : Math.PI;
  g.position.set(intNPCPos.x,0,intNPCPos.z);
  interiorScene.add(g);
  intNPCMesh=g;

  // Amble state — NPC wanders gently within the safe part of the room
  intNPCMesh.userData.amble={
    wa: type==='church' ? 0 : Math.random()*Math.PI*2, // walk angle
    wt: 1+Math.random()*3,   // time until next direction change
    // Bounds: stay in front half of room (near counter/altar), away from entrance
    minZ: type==='castle' ? 3.7 : 0.6,
    maxZ: type==='church' ? D*.3 : type==='castle' ? 6.0 : Math.min(D*.55, 4.5),
    minX: 0.8,
    maxX: W-0.8,
    speed: 0.25,
    paused: type==='church', // priest stays at altar; regent paces
  };

  // Player spawn — in front of exit door, facing in
  // (px/pz set in goToInterior: px=W/2-1, pz=D-1.5)
  return interiorScene;
}


function isInterior(){ return lid&&lid.startsWith('int_'); }

function goToInterior(house){
  doFade(()=>{
    _clearInteractPrompt();
    let _fHere=false;
    currentHouse=house;
    house._fromZone=activeZoneId;
    if(house.id&&String(house.id).startsWith('g_')&&typeof WORLD!=='undefined'){WORLD.buildInteriorFor(house);_fHere=WORLD.guild.onEnterInterior(house)===true;}else buildInterior(house); // v80 — generated buildings use the world interior generator
    lid='int_'+house.id;
    showZoneName('🏠 '+house.name);
    document.getElementById('fbtn').style.display=_fHere?'block':'none'; /* S672 — the hearth task's house keeps the cast button, for a touch screen */
    scene=interiorScene;
    const _intD={weapon:10,armor:10,potion:9,misc:9,inn:11,church:16,castle:22,safehouse:8};
    const _D=_intD[house.type||'misc']||9;
    const _W={weapon:11,armor:11,potion:9,misc:10,inn:13,church:10,castle:18,safehouse:8};
    const _RW=house.intW||_W[house.type||'misc']||10; // v80 — generated rooms carry their own size
    // v61ao: stash room dimensions on the live house reference. The exit-arrow
    // branch in drawCompass (and anyone else who needs interior geometry while
    // inside) can read currentHouse._roomW / ._roomD directly instead of
    // duplicating this type → dims table. The door is on the +Z wall at
    // (_RW/2, _D), which is what the compass uses for its bearing.
    house._roomW=_RW;
    house._roomD=house.intD||_D;
    px=_RW/2; pz=house._roomD-2.2; yaw=0; pitch=0; velY=0; jumpY=0; onGround=true;
    if(window._pendingPos){const P=window._pendingPos;window._pendingPos=null;if(P.x!=null){px=P.x;pz=P.z;}if(P.yaw!=null)yaw=P.yaw;if(P.jumpY!=null)jumpY=P.jumpY;} // v80 — a load puts you where you stood
    startMusic('shop');
    showMsg(`You enter ${house.name}.`,'#c8b880');
  });
}

function exitInterior(){
  const _pw=window._pendingWorldPos;window._pendingWorldPos=null;
  doFade(()=>{
    _clearInteractPrompt();
    const h=currentHouse;
    currentHouse=null;
    const fromZone=h&&h._fromZone?h._fromZone:'overworld';
    activeZoneId=fromZone;
    lid='overworld';
    // v61: data-driven scene + banner lookup via ZONE_BUILDERS. Covers
    // hearthwick and bealach_south natively; was a three-way if-chain that
    // silently fell through to owScene for hearthwick — caused the
    // "visually-Ashenmoor-but-gameplay-says-Hearthwick" desync on inn exit.
    const zb=(typeof ZONE_BUILDERS!=='undefined')?ZONE_BUILDERS[fromZone]:null;
    if(zb){
      scene=zb.sceneGet()||owScene;
      ZE=(ZONES[fromZone]&&ZONES[fromZone].enemies)||[];
      ZB=[];
      showZoneName(zb.displayName||'—');
      // v61c2 — Faolchú spawn check on interior-exit overworld return.
      // Same idempotent pattern as goToZone / dungeon-exit hooks.
      if(fromZone==='overworld' && worldState.ashenmoorBurned && !worldState.faolchuDefeated){
        if(typeof spawnFaolchu==='function') spawnFaolchu();
      }
    } else {
      // Fallback — unknown zone id, stay safe
      scene=owScene;ZE=[];ZB=[];
      showZoneName('🌿 Village of Ashenmoor');
    }
    document.getElementById('fbtn').style.display='block';
    // Spawn OUTSIDE door — offset in the direction the door faces (away from building)
    // doorZ/doorX is the position of the door on the wall, NOT inside the building
    // South door: building extends in +Z from doorZ, so outside = doorZ - offset
    // North door: building extends in -Z from doorZ, so outside = doorZ + offset
    // East door:  building extends in -X from doorX, so outside = doorX + offset
    // West door:  building extends in +X from doorX, so outside = doorX - offset
    const face=h&&h.doorFace?h.doorFace:'S';
    const dx=h?h.doorX:15, dz=h?h.doorZ:20;
    // v61y: exit offset bumped from 2.0 → 3.0. Ironhaven shops are pressed hard
    // against the castle wall — a 2.0 offset put players within brushing distance
    // of inner-courtyard walls on exit. 3.0 gives clear breathing room in all
    // four facing directions without landing anyone in an adjacent structure.
    if(h&&h.exitX!=null){px=h.exitX;pz=h.exitZ;yaw=h.exitYaw||0;} // v80 — generated (rotated) buildings carry an explicit step-out point
    else if(face==='E'){px=dx+3.0;pz=dz;yaw=-Math.PI/2;}      // east door → spawn east, face east
    else if(face==='W'){px=dx-3.0;pz=dz;yaw=Math.PI/2;}  // west door → spawn west, face west
    else if(face==='N'){px=dx;pz=dz+3.0;yaw=Math.PI;}    // north door → spawn north (+Z), face south
    else{px=dx;pz=dz-3.0;yaw=0;}                         // south door → spawn south (-Z), face north
    pitch=0;velY=0;jumpY=activeTerrainH(px,pz);onGround=true;
    // v61b: per-zone music on interior exit (match goToZone behaviour)
    startMusic((zb&&zb.musicTrack)||'overworld');
    showMsg('You step outside.','#c8e88a');
  });
  if(_pw){setTimeout(()=>{px=_pw.x;pz=_pw.z;if(_pw.yaw!=null)yaw=_pw.yaw;if(_pw.jumpY!=null){jumpY=_pw.jumpY;velY=0;onGround=true;}},700);}
}
