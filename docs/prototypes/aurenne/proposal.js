// Aurenne's houses — the proposal (the concept artist, 12 Oct 2026). Michael, 12 Oct: Aurenne is "a fusion of Roman / Egyptian /
// Arabic / Greek"; concept art OG-061 and OG-043: domes and arches, blue glazed tile, carved stone, lattice screens, courtyards,
// columns and arcades, limestone, cypress and cedar. Plain script on SK and mergeParts only, so the builder can lift
// aurenneHouseGeo into 82-world-structures.js beside buildingGeoHi and call it for STYLE.aurenne (mergeParts(P,HAO) there).
//
// aurenneHouseGeo(w,d,o,r): o.kind 'flat' (a lime-washed block, a roof terrace behind a parapet) or 'tile' (Roman: a low hipped
// roof of half-round tile, a ground-floor arcade); o.two an upper floor; o.dome, o.stair, o.pergola, o.lattice, o.wall, o.door.
// Walls are extruded outlines with real arched openings (ExtrudeGeometry, a small bevel), so a door or a window sits in a
// reveal as deep as the wall, not on a painted panel. A dark inner box makes every opening read as a room.
var AUR={
  walls:[0xf3eee2,0xf0e3c6,0xe9cfa4,0xeccab6,0xf7f4ec],                // lime white, warm lime, ochre, rose, chalk
  doors:[0x2f5f9a,0x2a7a78,0x9a3a2a,0x3a4a7a,0x6a4428],                // indigo, verdigris, madder, night blue, bare cedar
  tileA:0x2a5aa0,tileB:0xe6ecef,tileC:0xd8a030,                         // the glazed band: blue, white, saffron
  stone:0xcbbd9e,stoneD:0xa89a7c,terr:0xb8643a,terr2:0x9a5030,cedar:0x6a4428,dark:0x231d19,
  leaf:0x4f6e34,leaf2:0x3d5a2a,bloom:0xb0306a,awnA:0xa83a2a,awnB:0xefe4cc};

function aurenneHouseGeo(w,d,o,r){
  o=o||{};r=r||Math.random;const P=[],c=x=>new THREE.Color(x);
  const add=(geo,col,x,y,z,rx,ry,rz,j)=>{P.push({geo,color:c(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j});};
  const T=.32,pl=.24,fh=3.0,H=fh+(o.two?2.6:0);                       // wall thickness, plinth, a storey, the whole wall
  const wallC=o.wall!=null?o.wall:AUR.walls[Math.floor(r()*AUR.walls.length)];
  const doorC=o.door!=null?o.door:AUR.doors[Math.floor(r()*AUR.doors.length)];
  // an outline with holes; a hole {x,y,w,h,arch} is a rectangle with a half-round (arch:1) or a pointed (arch:2) head
  const holePath=(h)=>{const p=new THREE.Path(),x0=h.x-h.w/2,x1=h.x+h.w/2,y0=h.y,y1=h.y+h.h-(h.arch?h.w/2:0);
    p.moveTo(x0,y0);p.lineTo(x1,y0);p.lineTo(x1,y1);
    if(h.arch===1)p.absarc(h.x,y1,h.w/2,0,Math.PI,false);
    else if(h.arch===2){p.quadraticCurveTo(x1,y1+h.w*.42,h.x,y1+h.w*.62);p.quadraticCurveTo(x0,y1+h.w*.42,x0,y1);}
    else p.lineTo(x0,y1);
    p.lineTo(x0,y0);return p;};
  const wallGeo=(len,ht,holes)=>{const s=new THREE.Shape();s.moveTo(-len/2,0);s.lineTo(len/2,0);s.lineTo(len/2,ht);s.lineTo(-len/2,ht);s.lineTo(-len/2,0);
    holes.forEach(h=>s.holes.push(holePath(h)));
    const g=new THREE.ExtrudeGeometry(s,{depth:T-.06,bevelEnabled:true,bevelThickness:.03,bevelSize:.03,bevelSegments:1,curveSegments:7});g.translate(0,0,-(T-.06)/2);return g;};
  // the openings, by storey: a door (arched) on the front, windows small and deep as in a hot country
  const front=[],back=[],side=[];
  const doorW=1.05,doorH=2.0,dx=o.kind==='tile'?0:(r()<.5?-1:1)*Math.min(w*.18,1.1);
  front.push({x:dx,y:0,w:doorW,h:doorH,arch:o.pointed?2:1,door:1});
  const nWin=Math.max(1,Math.floor((w-2)/2.4));
  for(let i=0;i<nWin;i++){const x=-w/2+1.0+(i+.5)*(w-2)/nWin;if(Math.abs(x-dx)<1.3)continue;front.push({x,y:1.1,w:.62,h:.95,arch:1});}
  back.push({x:0,y:1.1,w:.62,h:.95,arch:1});
  side.push({x:0,y:1.1,w:.55,h:.8,arch:0});
  if(o.two){for(let i=0;i<nWin+1;i++){const x=-w/2+.9+(i+.5)*(w-1.8)/(nWin+1);front.push({x,y:fh+.7,w:.66,h:1.15,arch:1,up:1});}
    back.push({x:-w*.2,y:fh+.7,w:.62,h:1.0,arch:1,up:1});side.push({x:0,y:fh+.8,w:.55,h:.85,arch:1,up:1});}
  // the plinth (a low stone footing, its top course a darker band), the walls, the inner gloom
  add(SK.rbox(w+.16,pl,d+.16,.05,1),AUR.stoneD,0,pl/2,0,0,0,0,.08);
  const yW=pl;
  add(wallGeo(w,H,front),wallC,0,yW,d/2-T/2,0,0,0,.04);
  add(wallGeo(w,H,back),wallC,0,yW,-d/2+T/2,0,Math.PI,0,.04);
  add(wallGeo(d-2*T+.02,H,side),wallC,w/2-T/2,yW,0,0,Math.PI/2,0,.04);
  add(wallGeo(d-2*T+.02,H,side),wallC,-w/2+T/2,yW,0,0,-Math.PI/2,0,.04);
  add(new THREE.BoxGeometry(w-2*T,H-.5,d-2*T),AUR.dark,0,yW+(H-.5)/2,0,0,0,0,0);
  // a door: cedar planks in its colour set back in the reveal, iron studs, a stone threshold, the glazed band round it
  for(const h of front.filter(h=>h.door)){const dz=d/2-T*.7;
    const nb=5;for(let i=0;i<nb;i++)add(new THREE.BoxGeometry(h.w/nb-.012,h.h-h.w/2+.02,.06),c(doorC).multiplyScalar(.9+r()*.18).getHex(),h.x-h.w/2+(i+.5)*h.w/nb,yW+(h.h-h.w/2)/2,dz,0,0,0,.04);
    add(new THREE.CylinderGeometry(h.w/2,h.w/2,.06,10,1,false,-Math.PI/2,Math.PI),c(doorC).multiplyScalar(.85).getHex(),h.x,yW+h.h-h.w/2,dz,Math.PI/2,0,0,.04);
    for(let i=0;i<3;i++)for(let k=0;k<3;k++)add(SK.ball(.025,4,3),0x2a2622,h.x-.3+k*.3,yW+.45+i*.55,dz+.04,0,0,0,0);
    add(SK.rbox(h.w+.3,.1,.42,.03,1),AUR.stone,h.x,yW-.02,d/2+.1,0,0,0,.06);
    // the band: a square tile frame, blue and white by turns, saffron at the corners (OG-061's "blue glazed tilework")
    const tz=d/2+.012,ts=.17,top=yW+h.h+.12;let k=0;
    for(let y=yW+.05;y<top;y+=ts){for(const sx of [-1,1]){add(new THREE.BoxGeometry(ts-.02,ts-.02,.03),k%2?AUR.tileB:AUR.tileA,h.x+sx*(h.w/2+.17),y+ts/2,tz,0,0,0,.03);}k++;}
    for(let x=h.x-h.w/2-.17;x<=h.x+h.w/2+.18;x+=ts){add(new THREE.BoxGeometry(ts-.02,ts-.02,.03),(Math.round((x-h.x)/ts)%2)?AUR.tileB:AUR.tileA,x,top+ts/2,tz,0,0,0,.03);}
    for(const sx of [-1,1])add(new THREE.BoxGeometry(ts,ts,.04),AUR.tileC,h.x+sx*(h.w/2+.17),top+ts/2,tz+.005,0,0,0,.03);}
  // windows: a stone sill; a turned-cedar grille below, a lattice screen (mashrabiya) on brackets above if o.lattice
  for(const [list,face] of [[front,0],[back,1]])for(const h of list){if(h.door)continue;const z=face?-(d/2):d/2,s=face?-1:1;
    add(SK.rbox(h.w+.22,.08,.2,.02,1),AUR.stone,h.x*s,yW+h.y-.04,z+s*.05,0,0,0,.05);
    if(h.up&&o.lattice&&!face){const bw=h.w+.34,bh=h.h+.25,bz=z+s*.28,by=yW+h.y+bh/2-.12;
      add(new THREE.BoxGeometry(bw,bh,.46),0x2e2219,h.x,by,z+s*.2,0,0,0,.02);
      for(let i=0;i<=7;i++)add(new THREE.BoxGeometry(i%7?.035:.07,bh,.04),i%7?0x9a6a40:AUR.cedar,h.x-bw/2+i*bw/7,by,z+s*.44,0,0,0,.05);
      for(let i=1;i<10;i++)add(new THREE.BoxGeometry(bw,.035,.035),0x9a6a40,h.x,by-bh/2+i*bh/10,z+s*.45,0,0,0,.05);
      add(SK.rbox(bw+.12,.08,.58,.02,1),AUR.cedar,h.x,by+bh/2+.04,z+s*.22,0,0,0,.04);
      add(SK.rbox(bw+.08,.08,.54,.02,1),AUR.cedar,h.x,by-bh/2-.04,z+s*.22,0,0,0,.04);
      for(const sx of [-1,1])add(SK.rbox(.08,.32,.3,.02,1),AUR.cedar,h.x+sx*(bw/2-.08),by-bh/2-.22,z+s*.12,0,0,0,.04);
      continue;}
    for(let i=0;i<3;i++)add(SK.cyl(.018,.018,h.h-h.w/2,5),0x2a2622,h.x*s-h.w/3+i*h.w/3+.0001,yW+h.y+(h.h-h.w/2)/2,z-s*.1,0,0,0,0);}
  for(const sx of [-1,1])for(const h of side){add(SK.rbox(h.w+.2,.08,.2,.02,1),AUR.stone,sx*(w/2+.05),yW+h.y-.04,0,0,sx*Math.PI/2,0,.05);}
  const top=yW+H;let roofTop=top;
  if(o.kind==='tile'){
    // Roman: a cornice, a low hipped roof (a four-sided cone, 22° of pitch) under rows of half-round tile, ridge tiles on the hips
    add(SK.rbox(w+.36,.16,d+.36,.04,1),AUR.stone,0,top+.08,0,0,0,0,.05);
    const over=.45,rw=(w+2*over)/2,rd=(d+2*over)/2,rise=Math.tan(22*Math.PI/180)*Math.min(rw,rd);
    const g=new THREE.ConeGeometry(Math.SQRT2,1,4,1,true);g.rotateY(Math.PI/4);g.scale(rw,rise,rd);
    add(g,AUR.terr,0,top+.16+rise/2,0,0,0,0,.08);
    add(new THREE.BoxGeometry(w+2*over,.06,d+2*over),AUR.terr2,0,top+.16,0,0,0,0,.05);
    // the tile courses on the long slopes: half-round tiles running down from the ridge line to the eave, trimmed to the hips
    for(const s of [1,-1]){const n=Math.floor((2*rw)/.26);for(let i=0;i<n;i++){const x=-rw+(i+.5)*(2*rw)/n,f=1-Math.abs(x)/rw;if(f<.04)continue;
        const run=rd*f,sl=Math.atan2(rise*f,run),len=Math.hypot(run,rise*f);
        const tg=SK.cyl(.075,.075,len,4,1,true,-Math.PI/2,Math.PI);
        add(tg,c(AUR.terr).multiplyScalar(.82+r()*.3).getHex(),x,top+.16+rise*f/2+.05,s*(rd-run/2),-s*(Math.PI/2-sl),0,0,.05);}}
    for(const [sx,sz] of [[1,1],[1,-1],[-1,1],[-1,-1]]){const len=Math.hypot(rw,rd,rise);const tg=SK.cyl(.09,.09,len,6,1,false);
      const m=new THREE.Vector3(sx*rw/2,top+.16+rise/2+.06,sz*rd/2),dir=new THREE.Vector3(sx*rw,-rise,sz*rd).normalize();
      const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir),e=new THREE.Euler().setFromQuaternion(q);
      add(tg,AUR.terr2,m.x,m.y,m.z,e.x,e.y,e.z,.05);}
    roofTop=top+.16+rise;
    // the arcade (a loggia in front of the ground floor): round arches on columns with capitals, a tiled lean-to over it
    if(o.arcade!==false){const n=Math.max(3,Math.round(w/2.2)),ad=1.7,az=d/2+ad,span=w/n,colH=2.05;
      add(SK.rbox(w+.2,.18,ad+.1,.04,1),AUR.stone,0,pl-.09+.09,d/2+ad/2,0,0,0,.06);
      const hs=[];for(let i=0;i<n;i++)hs.push({x:-w/2+(i+.5)*span,y:0,w:span-.36,h:colH+(span-.36)/2,arch:1});
      add(wallGeo(w,colH+span/2+.35,hs),wallC,0,yW,az,0,0,0,.04);
      for(let i=0;i<=n;i++){const x=-w/2+i*span,cx=Math.max(-w/2+.16,Math.min(w/2-.16,x));
        add(SK.lathe([[.0,0],[.16,0],[.16,.1],[.11,.16],[.1,colH-.25],[.13,colH-.15],[.18,colH-.06],[.18,colH],[0,colH]],10),AUR.stone,cx,yW,az+.26,0,0,0,.04);}
      const lw=w+.3,lt=yW+colH+span/2+.35,ll=ad+.6,lp=.2;add(SK.rbox(lw,.12,.3,.03,1),AUR.stone,0,lt+.06,az,0,0,0,.05);
      add(new THREE.BoxGeometry(lw,.06,ll),AUR.terr2,0,lt+.2,d/2+ll/2,lp,0,0,.05);
      const nl=Math.floor(lw/.26);for(let i=0;i<nl;i++)add(SK.cyl(.075,.075,ll,4,1,true,-Math.PI/2,Math.PI),c(AUR.terr).multiplyScalar(.82+r()*.3).getHex(),-lw/2+(i+.5)*lw/nl,lt+.25,d/2+ll/2,-(Math.PI/2-lp),0,0,.05);}
  }else{
    // a flat roof: a slab, a rounded parapet, rainwater spouts through it, a terrace you can stand on
    add(new THREE.BoxGeometry(w-.2,.14,d-.2),0xc9a27a,0,top-.07,0,0,0,0,.1);
    const ph=.62,pt=.26;
    add(SK.rbox(w+.04,ph,pt,.1,2),wallC,0,top+ph/2-.05,d/2-pt/2+.02,0,0,0,.04);
    add(SK.rbox(w+.04,ph,pt,.1,2),wallC,0,top+ph/2-.05,-d/2+pt/2-.02,0,0,0,.04);
    for(const sx of [-1,1])add(SK.rbox(pt,ph,d-.2,.1,2),wallC,sx*(w/2-pt/2+.02),top+ph/2-.05,0,0,0,0,.04);
    for(const sx of [-1,1])add(SK.cyl(.06,.07,.55,6,1,false),AUR.terr,sx*w*.3,top-.05,d/2+.22,Math.PI/2+.25,0,0,.05);
    roofTop=top+ph;
    // the dome (a temple's or a rich house's): a drum, a lathed dome, a finial; blue tile or limewash
    if(o.dome){const R=Math.min(w,d)*.27,dx2=-w*.18,dz2=-d*.1,dc=o.dome==='white'?wallC:AUR.tileA;
      add(SK.cyl(R*1.02,R*1.02,1.0,16,1,false),wallC,dx2,top+.5,dz2,0,0,0,.04);
      const pts=[];for(let i=0;i<=9;i++){const a=i/9*Math.PI/2;pts.push([R*Math.cos(a)*(1+.06*Math.sin(a*2)),R*1.08*Math.sin(a)]);}
      add(SK.lathe(pts,18),dc,dx2,top+1.0,dz2,0,0,0,.06);
      add(SK.torus(R*1.03,.05,18,4),AUR.stone,dx2,top+1.01,dz2,Math.PI/2,0,0,.04);
      add(SK.lathe([[.0,0],[.07,0],[.05,.12],[.09,.2],[.0,.42]],8),AUR.tileC,dx2,top+1.0+R*1.08-.02,dz2,0,0,0,.03);
      roofTop=Math.max(roofTop,top+1.0+R*1.08+.4);}
    // the pergola on the terrace: four cedar posts, beams, a striped awning in madder and cream
    if(o.pergola){const pw=Math.min(2.6,w*.42),pd=Math.min(2.2,d*.45),px0=w/2-pw/2-.35,pz0=d/2-pd/2-.35,ph2=1.95;
      for(const [sx,sz] of [[1,1],[1,-1],[-1,1],[-1,-1]])add(SK.cyl(.05,.06,ph2,6),AUR.cedar,px0+sx*pw/2,top+ph2/2,pz0+sz*pd/2,0,0,0,.04);
      for(const sz of [1,-1])add(SK.rbox(pw+.3,.09,.09,.02,1),AUR.cedar,px0,top+ph2,pz0+sz*pd/2,0,0,0,.04);
      const ns=7;for(let i=0;i<ns;i++)add(new THREE.BoxGeometry(pw/ns+.002,.03,pd+.2),i%2?AUR.awnB:AUR.awnA,px0-pw/2+(i+.5)*pw/ns,top+ph2+.07,pz0,.06,0,0,.04);
      roofTop=Math.max(roofTop,top+ph2+.1);}
    // pots on the parapet, a cypress or a bougainvillea by the door
    for(let i=0;i<2;i++){const x=(i?1:-1)*(w/2-.5)*(.4+r()*.5);
      add(SK.lathe([[.0,0],[.12,0],[.17,.12],[.15,.26],[.18,.3],[.0,.3]],10),AUR.terr,x,top+ph-.05,d/2-.13,0,0,0,.06);
      add(SK.bumpy(SK.ball(.2,8,6),.05,8,r()*9),AUR.leaf,x,top+ph+.37,d/2-.13,0,0,0,.08);}
  }
  // the outside stair to the roof (Greek-island): a solid flight up the side wall, its own little parapet
  if(o.stair&&o.kind!=='tile'){const sx=-(w/2+.5),n=Math.round(H/.24),run=Math.min(d-.6,n*.27),step=run/n,rise=H/n;
    for(let i=0;i<n;i++){const z=d/2-.4-i*step,hy=(i+1)*rise;add(new THREE.BoxGeometry(.9,hy,step+.01),wallC,sx,yW+hy/2,z-step/2,0,0,0,.04);
      add(new THREE.BoxGeometry(.9,.04,step+.02),AUR.stone,sx,yW+hy+.02,z-step/2,0,0,0,.05);}
    roofTop=Math.max(roofTop,top);}
  // greenery at the door: a cypress (tall, narrow, dark) or a bougainvillea climbing the wall, by the dice
  if(o.green!==false){const gx=(dx>0?-1:1)*(w/2-.55),gz=d/2+(o.kind==='tile'?2.2:.45);
    if(o.kind==='tile'||r()<.5){const ht=3.4+r()*1.6;add(SK.bumpy(SK.lathe([[.0,0],[.34,.25],[.42,ht*.35],[.3,ht*.75],[.0,ht]],10),.04,9,r()*9),AUR.leaf2,gx,yW,gz,0,0,0,.1);
      add(SK.lathe([[.0,0],[.2,0],[.26,.2],[.24,.42],[.0,.42]],10),AUR.terr,gx,0,gz,0,0,0,.06);}
    else for(let i=0;i<9;i++){const y=yW+.4+i*.32,x=gx+(r()-.5)*.6;add(SK.bumpy(SK.ball(.24+r()*.1,7,5),.05,8,r()*9),i%3?AUR.bloom:AUR.leaf,x,Math.min(y,top-.2),d/2+.12,0,0,0,.1);}}
  const g=mergeParts(P,o.ao||null);g.userData.roofTop=roofTop;g.userData.parts=P.length;return g;
}
