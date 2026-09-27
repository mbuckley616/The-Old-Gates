// Boat prototype (backlog H.5b): the ships and harbour boats as lofted hulls with a keel, a stem and stern post,
// planking, a sheer, and rigging, baked to one vertex-coloured geometry each, the way buildPerson bakes a townsperson.
// The game's frame is kept: the mesh sits at SEA_Y, +z is the prow, the deck is flat at y 1.0 (DECK_Y) over the
// whole L x W walkable rectangle, the wheel at z -L/2+2.8, the hatch at z L/2-3.2, the mast near z .6.

function rng(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return((h>>>0)%100000)/100000;};}
const DECK=1.0;

// ── the bake: parts as [geometry, matrix, colour|null]; a null colour keeps the part's own vertex colours ──
function Bake(){this.parts=[];}
const _e=new THREE.Euler(0,0,0,'YXZ'),_q=new THREE.Quaternion();
Bake.prototype.add=function(geo,p,r,s,col){_e.set(r?r[0]:0,r?r[1]:0,r?r[2]:0,'YXZ');_q.setFromEuler(_e);
  const m=new THREE.Matrix4().compose(new THREE.Vector3(p?p[0]:0,p?p[1]:0,p?p[2]:0),_q,new THREE.Vector3(s?s[0]:1,s?s[1]:1,s?s[2]:1));
  this.parts.push([geo,m,col==null?null:new THREE.Color(col)]);return this;};
// a part between two points (spars, stays, shrouds): a cylinder from a to b
Bake.prototype.rod=function(a,b,r0,r1,col,seg){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),L=d.length();
  const g=new THREE.CylinderGeometry(r1==null?r0:r1,r0,L,seg||5,1,true);g.translate(0,L/2,0);
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  this.parts.push([g,new THREE.Matrix4().compose(A,q,new THREE.Vector3(1,1,1)),new THREE.Color(col)]);return this;};
Bake.prototype.bake=function(){
  let n=0;const flat=this.parts.map(([g,m,c])=>{let gg=g.index?g.toNonIndexed():g.clone();gg.applyMatrix4(m);if(!gg.attributes.normal)gg.computeVertexNormals();n+=gg.attributes.position.count;return [gg,c];});
  const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);let o=0;
  flat.forEach(([g,c])=>{const p=g.attributes.position,nn=g.attributes.normal,vc=g.attributes.color;
    for(let i=0;i<p.count;i++,o++){pos.set([p.getX(i),p.getY(i),p.getZ(i)],o*3);nor.set([nn.getX(i),nn.getY(i),nn.getZ(i)],o*3);
      if(c)col.set([c.r,c.g,c.b],o*3);else col.set([vc.getX(i),vc.getY(i),vc.getZ(i)],o*3);}});
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setAttribute('color',new THREE.BufferAttribute(col,3));
  out.computeBoundingBox();out.computeBoundingSphere();return out;};
const C=x=>new THREE.Color(x);
const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};

// ── the hull: stations along the length, each a round-bilged section from the keel up to the gunwale ──
// o: {L,W,draft,sheer,bowRise,sternRise,stem,transom,full,strakes:[colours],bottom,wale,band,rows,stations}
// Returns {geo (vertex coloured, one strake colour per row of faces, so the planks run with the sections),
//          at(z) -> {b: half-breadth at the deck, g: gunwale height}, keel:[points], gun:[points]}
function hull(o){
  const L=o.L,W=o.W,NS=o.stations||28,NR=o.rows||12,zs=-L/2-(o.transom?.15:.6),zb=L/2+(o.stem||2.2);
  const P=[],rows=[];const kpts=[],gpts=[];
  const U=u=>zs+(zb-zs)*u;
  const breadth=u=>{const z=U(u);let k=1;
    if(z>L/2-2.4){const t=(z-(L/2-2.4))/(zb-(L/2-2.4));k=Math.max(.015,1-Math.pow(t,o.full||1.7));}
    if(z<-L/2+2.2){const t=(-L/2+2.2-z)/(-L/2+2.2-zs);k=Math.min(k,1-Math.pow(t,2.2)*(1-(o.transom||.12)));}
    return W/2*k;};
  const gun=u=>{const z=U(u),t=z/(L/2);return DECK+(o.sheer||.45)+(t>0?(o.bowRise||.5)*Math.pow(Math.max(0,t),2.2):(o.sternRise||.35)*Math.pow(-t,2.4));};
  const keel=u=>{const z=U(u);let y=-(o.draft||1.1);
    if(z>L/2-3.5){const t=(z-(L/2-3.5))/(zb-(L/2-3.5));y+=(gun(u)-.05-y)*Math.pow(t,2.1);}
    if(z<-L/2+1.5){const t=(-L/2+1.5-z)/(-L/2+1.5-zs);y+=(o.transom?(.55+.3*t):1.2)*t*t;}
    return y;};
  for(let s=0;s<=NS;s++){const u=s/NS,z=U(u),b=breadth(u),g=gun(u),k=keel(u);kpts.push(new THREE.Vector3(0,k,z));gpts.push(new THREE.Vector3(b,g,z));
    const ring=[];for(let j=0;j<=NR;j++){const th=j/NR*Math.PI/2;const sx=Math.pow(Math.sin(th),.45),cy=Math.pow(Math.cos(th),.55);
      const flare=1+.05*Math.max(0,(1-cy)-.6);ring.push([b*sx*flare,g-(g-k)*cy,z]);}
    rows.push(ring);}
  // faces: port and starboard, row j gets strake j's colour; the rows under the waterline take the bottom colour
  const pos=[],colr=[];const push=(a,c)=>{pos.push(a[0],a[1],a[2]);colr.push(c.r,c.g,c.b);};
  const strake=(j,y,s)=>{if(y<.08)return C(o.bottom||0x2e2620);if(o.wale&&y>DECK-.28&&y<DECK-.02)return C(o.wale);
    if(o.band&&y>DECK+.02)return C(o.band);const base=C(o.strakes[j%o.strakes.length]);return base.multiplyScalar(.94+.06*((s*7)%3)/2);};
  for(let s=0;s<NS;s++)for(let j=0;j<NR;j++)for(const side of [1,-1]){
    const a=rows[s][j],b=rows[s+1][j],c=rows[s+1][j+1],d=rows[s][j+1];const f=q=>[q[0]*side,q[1],q[2]];
    const col=strake(NR-1-j,(a[1]+c[1])/2,Math.floor(s/4));
    const tri=side>0?[a,b,c,a,c,d]:[a,c,b,a,d,c];for(const q of tri)push(f(q),col);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colr,3));
  // smooth normals across faces that share a point (the strakes are coloured flat, the hull shades round)
  geo.computeVertexNormals();smoothNormals(geo);
  let tgeo=null;if(o.transom){const r=rows[0],cz=r[0][2],tp=[],tc=[];const col=C(o.transomCol||o.strakes[0]).multiplyScalar(.85);
    for(let j=0;j<NR;j++)for(const side of [1,-1]){const a=r[j],d=r[j+1];const f=q=>[q[0]*side,q[1],cz];
      const quad=[a,d,[0,d[1],cz],[0,a[1],cz]];const ix=side>0?[0,2,1,0,3,2]:[0,1,2,0,2,3];for(const i of ix){tp.push(...f(quad[i]));tc.push(col.r,col.g,col.b);}}
    tgeo=new THREE.BufferGeometry();tgeo.setAttribute('position',new THREE.Float32BufferAttribute(tp,3));tgeo.setAttribute('color',new THREE.Float32BufferAttribute(tc,3));tgeo.computeVertexNormals();}
  const at=z=>{const u=Math.min(1,Math.max(0,(z-zs)/(zb-zs)));return {b:breadth(u),g:gun(u),k:keel(u)};};
  return {geo,tgeo,at,kpts,gpts,zs,zb};
}
function smoothNormals(g){const p=g.attributes.position,n=g.attributes.normal,m=new Map();const key=i=>`${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
  for(let i=0;i<p.count;i++){const k=key(i);let v=m.get(k);if(!v)m.set(k,v=new THREE.Vector3());v.x+=n.getX(i);v.y+=n.getY(i);v.z+=n.getZ(i);}
  for(let i=0;i<p.count;i++){const v=m.get(key(i)).clone().normalize();n.setXYZ(i,v.x,v.y,v.z);}}

// a deck of planks running fore and aft, clipped to the hull's breadth at each station
function deck(B,H,L,y,cols){const NZ=24,NP=9;const pos=[],col=[];const z0=-L/2-.05,z1=H.zb-.5;
  for(let s=0;s<NZ;s++){const za=z0+(z1-z0)*s/NZ,zb=z0+(z1-z0)*(s+1)/NZ;const ba=H.at(za).b*.97,bb=H.at(zb).b*.97;
    for(let p=0;p<NP;p++){const fa=-1+2*p/NP,fb=-1+2*(p+1)/NP;const c=C(cols[(p+(s>>3))%cols.length]);
      const q=[[ba*fa,y,za],[ba*fb,y,za],[bb*fb,y,zb],[bb*fa,y,zb]];for(const i of [0,2,1,0,3,2]){pos.push(...q[i]);col.push(c.r,c.g,c.b);}}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();B.add(g,null,null,null,null);}

// a rail along the gunwale (both sides), a tube on the curve
function rail(B,H,r,col,dy,inset){for(const side of [1,-1]){const pts=H.gpts.filter((q,i)=>i%2===0||i===H.gpts.length-1).map(q=>new THREE.Vector3(q.x*side*(inset||1),q.y+(dy||0),q.z));
  B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),28,r,5,false),null,null,null,col);}}
function wale(B,H,y,r,col){for(const side of [1,-1]){const pts=[];for(let z=H.zs+.2;z<H.zb-.6;z+=.6){const b=H.at(z).b;pts.push(new THREE.Vector3(b*side*1.01,y,z));}
  B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,r,4,false),null,null,null,col);}}
// the keel and the stem: one tube along the keel line, turning up into the stem post
function keelStem(B,H,r,col,top){const pts=H.kpts.filter((q,i)=>i%2===0).map(q=>q.clone());const last=H.kpts[H.kpts.length-1];pts.push(new THREE.Vector3(0,last.y+(top||.35),last.z+.12));
  B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,r,5,false),null,null,null,col);}
// a sail: a grid bellied forward along +z (or +x for a fore-and-aft sail), with seams as darker columns
function sail(B,w0,w1,h,belly,col,seam,at,rot,cut){const nx=6,ny=6,pos=[],cl=[];const c0=C(col),c1=C(seam||col);
  const P=(i,j)=>{const t=j/ny,w=w1+(w0-w1)*t,x=(i/nx-.5)*w+(cut?cut*(1-t)*w*.5:0);const bz=belly*Math.sin(Math.PI*i/nx)*Math.sin(Math.PI*(.15+.85*t));return [x,-h*t,bz];};
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const q=[P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1)];const c=(i%2?c1:c0);for(const k of [0,1,2,0,2,3])pos.push(...q[k]),cl.push(c.r,c.g,c.b);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));g.computeVertexNormals();
  B.add(g,at,rot,null,null);}
function wheel(B,z,y){const W=0x5a3a1c;B.add(SK.torus(.4,.045,6,14),[0,y,z],[0,0,0],null,W);
  for(let k=0;k<8;k++){const a=k/8*Math.PI*2;B.rod([Math.cos(a)*.1,y+Math.sin(a)*.1,z],[Math.cos(a)*.56,y+Math.sin(a)*.56,z],.022,.018,W,4);}
  B.add(SK.cyl(.08,.1,.1,8),[0,y,z],[Math.PI/2,0,0],null,0x3a2410);B.add(SK.cyl(.1,.13,y-DECK,6),[0,DECK+(y-DECK)/2,z+.12],0,null,0x4a3018);}
function hatch(B,z){B.add(new THREE.BoxGeometry(1.3,.14,1.3),[0,DECK+.07,z],0,null,0x4a3018);
  for(let k=-2;k<=2;k++)B.add(new THREE.BoxGeometry(1.1,.04,.12),[0,DECK+.15,z+k*.22],0,null,0x2e1e10);
  B.add(SK.torus(.1,.022,5,10),[.34,DECK+.16,z],[Math.PI/2,0,0],null,0x2a2622);}
function barrel(B,x,z,y,col){B.add(SK.lathe([[.001,0],[.2,0],[.24,.12],[.26,.25],[.24,.38],[.2,.5],[.001,.5]],10),[x,y||DECK,z],0,null,col||0x7a5228);
  for(const h of [.06,.44])B.add(SK.torus(.235,.018,5,10),[x,(y||DECK)+h,z],[Math.PI/2,0,0],null,0x3a3530);}
function crate(B,x,z,s,ry){B.add(new THREE.BoxGeometry(s,s*.8,s),[x,DECK+s*.4,z],[0,ry||0,0],null,0x8a6a38);B.add(new THREE.BoxGeometry(s*1.02,s*.12,s*1.02),[x,DECK+s*.4,z],[0,ry||0,0],null,0x5a4020);}
function lantern(B,x,y,z){B.rod([x,y-.5,z],[x,y,z],.03,.03,0x2a2622,4);B.add(SK.cyl(.08,.1,.22,6),[x,y+.11,z],0,null,0xffc860);B.add(SK.cone(.12,.1,6),[x,y+.27,z],0,null,0x2a2622);}
// a gaff sail aft of a mast: boom at bY, gaff peaking up from gY, the sail between them bellied to leeward
function gaff(B,mz,bY,gY,boomL,gaffL,lk){B.rod([0,bY,mz-.1],[0,bY+.25,mz-boomL],.07,.05,0x5a3c1e,6);B.rod([0,gY,mz-.1],[0,gY+gaffL*.3,mz-gaffL],.06,.045,0x5a3c1e,6);
  const nx=7,ny=7,pos=[],cl=[];const c0=C(lk.sail),c1=C(lk.seam);
  const Pm=(i,j)=>{const t=i/nx,v=j/ny;const zf=mz-.15-t*(v*(gaffL-.2)+(1-v)*(boomL-.3));const yb=bY+.1+.25*t,yt=gY-.05+gaffL*.3*t;const y=yb+(yt-yb)*v;
    return [.55*Math.sin(Math.PI*t)*Math.sin(Math.PI*(.2+.8*v))*(1-.3*v),y,zf];};
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const q=[Pm(i,j),Pm(i+1,j),Pm(i+1,j+1),Pm(i,j+1)];const c=j%2?c1:c0;for(const k of [0,1,2,0,2,3])pos.push(...q[k]),cl.push(c.r,c.g,c.b);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));g.computeVertexNormals();B.add(g,null,null,null,null);}
// a mast with a top, its shrouds to the chains at the gunwale, the yard and a square sail
function squareMast(B,H,z,h,yardW,sailH,o){const mc=o.mast||0x5a3c1e,rc=o.rope||0x2e2820;const foot=DECK-.8;
  B.add(SK.cyl(.1*o.k,.17*o.k,h+.8,8),[0,foot+(h+.8)/2,z],0,null,mc);
  if(o.top)B.add(SK.cyl(.42*o.k,.3*o.k,.14,10),[0,DECK+h*.72,z],0,null,mc);
  const at=H.at(z),g=at.g;for(const s of [1,-1])for(let k=0;k<3;k++){const zz=z-.6+k*.55;const b=H.at(zz).b;B.rod([b*s*1.02,g-.1,zz],[.14*s,DECK+h*.72,z],.02,.02,rc,3);}
  const yy=DECK+h*.66;B.rod([-yardW/2,yy,z+.18],[yardW/2,yy,z+.18],.06*o.k,.06*o.k,mc,6);
  if(o.furled){B.add(SK.cyl(.12,.12,yardW*.9,8,1),[0,yy-.12,z+.2],[0,0,Math.PI/2],null,o.sail);}
  else sail(B,yardW*.94,yardW*1.02,sailH,o.belly||.45,o.sail,o.seam,[0,yy-.05,z+.22],[0,0,0]);
  if(o.topsail){const y2=DECK+h*.95;B.rod([-yardW*.35,y2,z+.14],[yardW*.35,y2,z+.14],.045,.045,mc,6);sail(B,yardW*.66,yardW*.84,h*.2,.3,o.sail,o.seam,[0,y2-.04,z+.18],[0,0,0]);}
  return yy;}

// ── the ships ──
// kind: 'sloop' | 'cog' | 'galleon'; look: 'player' | 'pirate' | 'merchant'
const LOOKS={
  player:{strakes:[0x6a4424,0x5c3a1e,0x714a28],wale:0x3a2410,band:null,bottom:0x2e2620,sail:0xe6dcc2,seam:0xd6caa8,trim:0x3a2410,deck:[0xa8865a,0x9c7c52,0xb08e62]},
  pirate:{strakes:[0x2e2824,0x26201c,0x322a24],wale:0x6a1a14,band:0x1a1614,bottom:0x1e1a16,sail:0x2a2624,seam:0x1e1a18,trim:0x6a1a14,deck:[0x6a5a44,0x5e503c,0x72604a]},
  merchant:{strakes:[0x7a5a34,0x6e5030,0x84623a],wale:0x2a4a3a,band:0x3a6a52,bottom:0x3a2e24,sail:0xe8dcc0,seam:0xa84a30,trim:0x2a4a3a,deck:[0xb09264,0xa48658,0xb89a6c]}
};
function buildShip(kind,look){const lk=LOOKS[look||'player'];const B=new Bake();
  const cls={sloop:{L:13,W:4.4},cog:{L:17,W:5.6},galleon:{L:22,W:7.0}}[kind];const L=cls.L,W=cls.W;
  const hopt={sloop:{draft:1.05,sheer:.42,bowRise:.45,sternRise:.3,stem:2.4,transom:.34,full:1.8},
    cog:{draft:1.25,sheer:.55,bowRise:.85,sternRise:.9,stem:1.4,transom:0,full:1.3},
    galleon:{draft:1.5,sheer:.5,bowRise:.7,sternRise:1.25,stem:3.0,transom:.62,full:2.0}}[kind];
  const H=hull(Object.assign({L,W,strakes:lk.strakes,wale:lk.wale,band:lk.band,bottom:lk.bottom,transomCol:lk.strakes[1],stations:kind==='galleon'?34:28},hopt));
  B.add(H.geo,null,null,null,null);if(H.tgeo)B.add(H.tgeo,null,null,null,null);deck(B,H,L,DECK,lk.deck);
  rail(B,H,.06,lk.trim,.02);wale(B,H,DECK-.15,.07,lk.wale);keelStem(B,H,.09,lk.trim,kind==='cog'?.2:.45);
  // stern post and rudder
  const st=H.at(H.zs+.01);B.rod([0,st.k-.1,H.zs-.05],[0,st.g+.1,H.zs-.12],.08,.08,lk.trim,5);
  const rud=new THREE.BoxGeometry(.12,1,1);rud.translate(0,-.5,-.5);B.add(rud,[0,DECK-.15,H.zs-.1],null,[1,1.1+hopt.draft*.7,.8],lk.trim);
  // bowsprit
  const bow=H.at(H.zb-.3);const sp=kind==='cog'?1.8:kind==='galleon'?6:4.4;const bz=H.zb-.6,by=bow.g-.05;
  B.rod([0,by-.15,bz-1.2],[0,by+sp*.35,bz+sp],.13,.06,lk.trim,6);
  wheel(B,-L/2+2.8,DECK+.95);hatch(B,L/2-3.2);
  // stern lanterns, deck clutter
  lantern(B,0,H.at(-L/2).g+.55,H.zs+.15);
  barrel(B,W/2-.7,-1.6);barrel(B,W/2-.75,-2.25,null,0x6a4a22);crate(B,-W/2+.8,-1.9,.7,.3);crate(B,-W/2+.75,-2.6,.55,-.2);
  // coiled lines at the foot of the masts, and cleats on the rail
  const mopt={k:kind==='galleon'?1.25:kind==='cog'?1.1:1,sail:lk.sail,seam:lk.seam,rope:0x2e2820,mast:0x5a3c1e};
  if(kind==='sloop'){
    // one mast, a gaff mainsail aft of it and a jib to the bowsprit: a sloop's rig
    const mz=.6,mh=8.6;B.add(SK.cyl(.11,.17,mh+.8,8),[0,DECK-.8+(mh+.8)/2,mz],0,null,0x5a3c1e);
    for(const s of [1,-1])for(let k=0;k<2;k++){const zz=mz-.5+k*.5;const b=H.at(zz).b;B.rod([b*s*1.02,H.at(zz).g-.1,zz],[.12*s,DECK+mh*.85,mz],.02,.02,0x2e2820,3);}
    B.rod([0,DECK+mh*.85,mz],[0,by+sp*.33,bz+sp-.2],.022,.022,0x2e2820,3);B.rod([0,DECK+mh,mz],[0,H.at(-L/2).g,-L/2+.3],.02,.02,0x2e2820,3);
    gaff(B,mz,DECK+1.6,DECK+mh*.82,7.2,5.2,lk);
    // the jib: a triangle from the masthead down to the bowsprit and the deck at the bow
    const jh=[0,DECK+mh*.82,mz+.25],jt=[0,by+sp*.3,bz+sp-.5],jc=[.3,DECK+.6,L/2-.8];const jp=[],jcl=[];const N=6;
    for(let i=0;i<N;i++)for(let j=0;j<N-i;j++){const pt=(a,b)=>{const w=1-a-b;const x=jh[0]*w+jt[0]*a+jc[0]*b+.35*a*b*4,y=jh[1]*w+jt[1]*a+jc[1]*b,z=jh[2]*w+jt[2]*a+jc[2]*b;return [x,y,z];};
      const A=pt(i/N,j/N),Bq=pt((i+1)/N,j/N),Cq=pt(i/N,(j+1)/N);const c=C(lk.sail);jp.push(...A,...Bq,...Cq);jcl.push(c.r,c.g,c.b,c.r,c.g,c.b,c.r,c.g,c.b);
      if(j<N-i-1){const Dq=pt((i+1)/N,(j+1)/N);jp.push(...Bq,...Dq,...Cq);jcl.push(c.r,c.g,c.b,c.r,c.g,c.b,c.r,c.g,c.b);}}
    const jg=new THREE.BufferGeometry();jg.setAttribute('position',new THREE.Float32BufferAttribute(jp,3));jg.setAttribute('color',new THREE.Float32BufferAttribute(jcl,3));jg.computeVertexNormals();B.add(jg,null,null,null,null);
  }
  if(kind==='cog'){
    // a cog: one tall mast, one great square sail, high fore and aft (the rails rise; the deck stays flat to walk on)
    const yy=squareMast(B,H,.4,10.5,8.2,6.6,Object.assign({top:true,belly:.7},mopt));
    B.rod([0,DECK+10.5*.72,.4],[0,by+sp*.3,bz+sp-.1],.025,.025,0x2e2820,3);
    // castle rails: a second rail on posts over the raised ends
    for(const [z0,z1] of [[-L/2+.2,-L/2+3.2],[L/2-1.8,L/2+.8]])for(const s of [1,-1]){for(let z=z0;z<=z1+.01;z+=.75){const a=H.at(z);B.rod([a.b*s*.96,a.g,z],[a.b*s*.96,a.g+.55,z],.045,.045,lk.trim,4);}
      const pts=[];for(let z=z0;z<=z1+.01;z+=.5){const a=H.at(z);pts.push(new THREE.Vector3(a.b*s*.96,a.g+.55,z));}B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.05,4,false),null,null,null,lk.trim);}
    if(look!=='pirate'){const sh=H.at(0);for(const s of [1,-1])for(let k=0;k<4;k++){const z=-2.4+k*1.5;B.add(SK.cyl(.36,.36,.06,10),[sh.b*s*1.03,sh.g-.28,z],[0,0,Math.PI/2],null,[0xa83a2a,0xd8c49a,0x2a4a7a,0xd8c49a][k]);}}
  }
  if(kind==='galleon'){
    // three masts: fore and main square-rigged with topsails, a mizzen with a lateen; a spritsail under the bowsprit
    squareMast(B,H,5.2,10.5,7.4,5.8,Object.assign({top:true,topsail:true,belly:.55},mopt));
    squareMast(B,H,-.4,13,9.4,7.2,Object.assign({top:true,topsail:true,belly:.65},mopt));
    const mz=-6.6,mh=9;B.add(SK.cyl(.12,.19,mh+.8,8),[0,DECK-.8+(mh+.8)/2,mz],0,null,0x5a3c1e);
    for(const s of [1,-1])for(let k=0;k<2;k++){const zz=mz-.4+k*.5;const b=H.at(zz).b;B.rod([b*s*1.02,H.at(zz).g-.1,zz],[.12*s,DECK+mh*.8,mz],.02,.02,0x2e2820,3);}
    gaff(B,mz,DECK+1.9,DECK+mh*.78,4.6,3.6,lk);
    sail(B,4.4,4.6,1.8,.3,lk.sail,lk.seam,[0,by+2.4,bz+3.8],[0,0,0]);B.rod([-2.2,by+2.45,bz+3.7],[2.2,by+2.45,bz+3.7],.045,.045,0x5a3c1e,5);
    for(const [a,b] of [[[0,DECK+13*.72,-.4],[0,DECK+10.5*.72,5.2]],[[0,DECK+10.5*.72,5.2],[0,by+sp*.3,bz+sp-.2]],[[0,DECK+9*.8,mz],[0,DECK+13*.72,-.4]]])B.rod(a,b,.025,.025,0x2e2820,3);
    // stern windows and a gilded rail on the transom; gun ports along the side
    const tz=H.zs-.02;for(let k=-2;k<=2;k++){B.add(new THREE.BoxGeometry(.5,.55,.06),[k*.72,DECK+.55,tz],0,null,0x1a1a22);B.add(new THREE.BoxGeometry(.62,.08,.1),[k*.72,DECK+.87,tz],0,null,0xc8a040);}
    B.add(new THREE.BoxGeometry(4.2,.12,.14),[0,DECK+.2,tz],0,null,0xc8a040);
    const gp=look==='merchant'?0:6;for(const s of [1,-1])for(let k=0;k<gp;k++){const z=-5+k*2.1;const a=H.at(z);B.add(new THREE.BoxGeometry(.06,.42,.5),[a.b*s*1.005,DECK-.45,z],0,null,0x1a1614);}
    lantern(B,-1.6,H.at(-L/2).g+.5,H.zs+.2);lantern(B,1.6,H.at(-L/2).g+.5,H.zs+.2);
  }
  if(look==='pirate'){const top=kind==='galleon'?DECK+13:kind==='cog'?DECK+10.5:DECK+8.6;const mz=kind==='galleon'?-.4:kind==='cog'?.4:.6;
    const fl=new THREE.PlaneGeometry(1.4,.9,3,1);const p=fl.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*3)*.08);fl.computeVertexNormals();
    B.add(fl,[0,top+.9,mz-.8],[0,Math.PI/2,0],null,0x111111);B.add(SK.ball(.14,8,6),[.03,top+.95,mz-.8],0,[1,1,.6],0xd8d0c0);B.rod([0,top,mz],[0,top+1.4,mz],.03,.03,0x2a2622,4);}
  const geo=B.bake();
  const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;
  return {mesh,tris:geo.attributes.position.count/3};}

// a harbour boat: an open clinker boat with thwarts, oars shipped along the thwarts, a stubby mast with the sail furled on its yard
function buildBoat(seed){const R=rng('boat'+seed);const B=new Bake();const paint=[0x5a6a4a,0x6a3a2a,0x3a4a6a,0x7a6a4a][Math.floor(R()*4)];
  const L=6,W=2.2,G=.55;const H=hull({L,W,draft:.55,sheer:G-DECK,bowRise:.35,sternRise:.25,stem:1.0,transom:.4,full:1.5,rows:9,stations:20,strakes:[0x7a5634,0x6a4a2c,0x84603a],band:null,wale:null,bottom:0x3a3028});
  // the gunwale sits .55 over the sea and the keel .55 under it; open, so the inside is the hull's own back face
  B.add(H.geo,[0,0,0],null,null,null);if(H.tgeo)B.add(H.tgeo,[0,0,0],null,null,null);
  const at=z=>{const a=H.at(z);return {b:a.b,g:a.g,k:a.k};};
  for(const side of [1,-1]){const pts=H.gpts.filter((q,i)=>i%2===0).map(q=>new THREE.Vector3(q.x*side,q.y+.02,q.z));B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,.05,4,false),null,null,null,paint);}
  const pts=H.kpts.filter((q,i)=>i%2===0).map(q=>new THREE.Vector3(0,q.y,q.z));B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,.06,4,false),null,null,null,paint);
  // floorboards and thwarts
  B.add(new THREE.BoxGeometry(W*.5,.04,L*.72),[0,at(0).k+.22,-.1],0,null,0x9a7a4a);
  for(const z of [-1.7,-.2,1.2]){const a=at(z);B.add(new THREE.BoxGeometry(a.b*1.9,.07,.3),[0,a.g-.2,z],0,null,0xa0804e);}
  const st=at(-L/2);B.add(new THREE.BoxGeometry(st.b*1.8,.07,.9),[0,st.g-.22,-L/2+.3],0,null,0xa0804e);
  // oars shipped along the thwarts
  for(const s of [.3,-.3]){B.rod([s,at(0).g-.1,-2.2],[s*.8,at(0).g-.08,2.1],.03,.03,0xb09060,4);B.add(new THREE.BoxGeometry(.14,.02,.55),[s*.8,at(0).g-.08,2.3],0,null,0xb09060);}
  // mast, yard and the furled sail
  const mz=1.2,mh=3.6;B.add(SK.cyl(.05,.08,mh,6),[0,at(mz).k+mh/2+.1,mz],0,null,0x5a3c1e);
  const yy=at(mz).k+mh-.2;B.rod([0,yy,mz+.1],[0,yy-.9,mz-2.2],.035,.03,0x5a3c1e,5);
  B.rod([0,yy-.12,mz-.05],[0,yy-.95,mz-2.1],.1,.07,0xd8ccae,8);
  // a coil of rope, a net and a basket
  B.add(SK.torus(.16,.04,5,12),[.35,at(-1).k+.3,-1],[Math.PI/2,0,0],null,0x8a7a58);
  B.add(SK.bumpy(SK.ball(.28,10,6,0,Math.PI*2,0,1.8),.05,11,R()*9),[-.2,at(.5).k+.28,.5],0,[1,.5,1.3],0x8a8060);
  B.add(SK.lathe([[.001,0],[.16,0],[.2,.22],[.19,.24],[.001,.24]],9),[.3,at(-2.4).k+.24,-2.4],0,null,0x9a7a40);
  const geo=B.bake();const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;return {mesh,tris:geo.attributes.position.count/3};}

// ── today's meshes, copied from buildShipMesh and the harbour's moored boats (for the before pictures) ──
function oldShip(L,W,kind){const g=new THREE.Group();const add=(geo,col,x,y,z,rx,ry)=>{const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:col}));m.position.set(x||0,y||0,z||0);m.rotation.set(rx||0,ry||0,0,'YXZ');m.castShadow=true;g.add(m);return m;};
  const k=kind==='pirate'?[.6,.55,.5]:kind==='merchant'?[1.1,1,1]:[1,1,1];const t=c=>{const x=new THREE.Color(c);x.r=Math.min(1,x.r*k[0]);x.g*=k[1];x.b*=k[2];return x;};
  add(new THREE.BoxGeometry(W,1.8,L),t(0x5a3a1c),0,.1,0);add(new THREE.BoxGeometry(W-.3,.14,L-.6),t(0x9a7a4a),0,DECK+.05,0);
  add(new THREE.ConeGeometry(W/2,3.2,4),t(0x5a3a1c),0,.2,L/2+1.4,Math.PI/2,Math.PI/4);
  add(new THREE.BoxGeometry(W,.45,.24),t(0x4a2e14),0,1.3,-L/2+.15);add(new THREE.BoxGeometry(.14,.5,.14),t(0x4a2e14),W/2-.2,1.32,-L/2+.15);add(new THREE.BoxGeometry(.14,.5,.14),t(0x4a2e14),-W/2+.2,1.32,-L/2+.15);
  add(new THREE.BoxGeometry(.18,.9,.18),t(0x2a2622),W/2-.1,1.45,0);add(new THREE.BoxGeometry(.18,.9,.18),t(0x2a2622),-W/2+.1,1.45,0);add(new THREE.BoxGeometry(W,.12,.12),t(0x2a2622),0,1.9,0);
  add(new THREE.CylinderGeometry(.14,.18,9,7),t(0x4a3018),0,5.4,.6);add(new THREE.BoxGeometry(4.6,5.6,.08),t(0xe8e0c8),0,5.6,.9);add(new THREE.BoxGeometry(5.2,.1,.1),t(0x4a3018),0,8.5,.9);
  add(new THREE.TorusGeometry(.42,.05,6,12),0x6a4a2a,0,1.9,-L/2+2.8);add(new THREE.BoxGeometry(.14,.9,.14),0x4a3018,0,1.4,-L/2+2.9);add(new THREE.BoxGeometry(1.1,.08,1.1),0x3a2612,0,DECK+.14,L/2-3.2);
  if(kind==='pirate'){const f=add(new THREE.PlaneGeometry(1.2,.8),0x111111,0,9.2,.6);f.material.side=THREE.DoubleSide;}
  let tris=0;g.traverse(o=>{if(o.isMesh)tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;});return {mesh:g,tris};}
function oldBoat(){const g=new THREE.Group();const add=(geo,col,y,z,rx,ry)=>{const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:col}));m.position.set(0,y||0,z||0);m.rotation.set(rx||0,ry||0,0,'YXZ');m.castShadow=true;g.add(m);};
  add(new THREE.BoxGeometry(2.4,1.1,6.5),0x5a3a1c,.3);add(new THREE.BoxGeometry(2.0,.2,5.8),0x8a6a3a,.85);add(new THREE.ConeGeometry(1.25,1.6,4),0x5a3a1c,.4,3.7,Math.PI/2,Math.PI/4);
  add(new THREE.CylinderGeometry(.08,.1,5,6),0x4a3018,3.2);add(new THREE.BoxGeometry(.06,3.2,2.2),0xd8d0b8,3.4,.3);
  let tris=0;g.traverse(o=>{if(o.isMesh)tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;});return {mesh:g,tris};}
function personStandIn(){const g=SK.lathe([[.001,0],[.07,0],[.09,.05],[.11,.45],[.14,.6],[.13,.78],[.06,.84],[.05,.88],[.075,.95],[.07,1.05],[.001,1.1]],14);
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x8a8078,roughness:.9}));m.castShadow=true;return m;}
