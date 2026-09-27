// Creature prototype 1 (H.4): the wolf family on a skeleton, baked like buildPerson into one skinned mesh.
// Loaded by wolf.html after three.js and SK (copied from index.html). The creature faces +z, stands on y=0,
// and at scale 1 has the old box wolf's size (shoulder ~.47, nose at z ~.6), so hit sizes would not change.
const WOLF_KINDS={
  'Wolf':      {scale:.75,coat:0x7a6a5c,saddle:0x3e342c,belly:0xd8ccb4,eye:0xddaa44,ruff:1.0,ears:1.0,muzzle:1.0},
  'Snow Wolf': {scale:.9, coat:0xdcdce0,saddle:0x9a9ca4,belly:0xf4f2ee,eye:0x80c0ff,ruff:1.25,ears:.85,muzzle:.95},
  'Dire Wolf': {scale:.95,coat:0x3a3230,saddle:0x1a1614,belly:0x6a5e54,eye:0xffb030,ruff:1.35,ears:.9,muzzle:1.12,bulk:1.15},
  'Ash Hound': {scale:.8, coat:0x5a5048,saddle:0x2a2420,belly:0x8a7a6a,eye:0xff5020,ruff:.55,ears:1.25,muzzle:1.2,lean:.86,embers:true}
};
function wolfBake(k,q){SK.q=q||1;try{return wolfBakeQ(k,q||1);}finally{SK.q=1;}}
function wolfBakeQ(k){
  const bones=[],B={};
  const bone=(name,parent,x,y,z)=>{const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);if(parent)parent.add(b);b.userData.i=bones.length;bones.push(b);B[name]=b;return b;};
  const parts=[];
  // fur:true parts are counter-shaded at the bake: the saddle darkens what faces the sky, the belly lightens what faces the ground
  const part=(geo,col,b,x,y,z,fur)=>{const o=new THREE.Object3D();o.position.set(x||0,y||0,z||0);o.userData.geo=geo;o.userData.col=col;o.userData.fur=fur;b.add(o);parts.push(o);return o;};
  const C=x=>new THREE.Color(x);const coat=C(k.coat),dark=C(0x16100c),bw=k.bulk||1,ln=k.lean||1;
  // a tapered limb from a bone towards its child joint at (dy, dz)
  const seg=(b,dy,dz,r0,r1,col)=>{const L=Math.hypot(dy,dz);const o=part(SK.limb(L,r0,r1),col||coat,b,0,0,0,true);o.rotation.x=Math.atan2(-dz,-dy);return o;};
  // a lathe along +z (the body's axis)
  const zlathe=(pts,seg_)=>{const g=SK.lathe(pts,seg_||14);g.rotateX(Math.PI/2);return g;};
  const hips=bone('hips',null,0,.40,-.2);
  const spine=bone('spine',hips,0,.03,.34);
  const neck=bone('neck',spine,0,.05,.1);
  const head=bone('head',neck,0,.11,.1);
  const jaw=bone('jaw',head,0,-.035,.035);
  const t1=bone('tail1',hips,0,.04,-.11),t2=bone('tail2',t1,0,-.05,-.1),t3=bone('tail3',t2,0,-.06,-.08);
  // the body: a deep chest on the spine, a tucked waist and haunches on the hips
  part(zlathe([[0,-.22],[.07,-.21],[.12,-.15],[.145,-.05],[.15,.03],[.13,.11],[.08,.16],[0,.18]],16),coat,spine,0,-.045,0,true).scale.set(.74*bw*ln,1.12*bw,1);
  part(zlathe([[0,-.15],[.08,-.14],[.11,-.07],[.108,.02],[.092,.12],[.085,.2],[0,.24]],14),coat,hips,0,.005,0,true).scale.set(.82*bw*ln,1*bw,1);
  // the neck and its ruff
  seg(spine,.14,.13,.085*bw,.065*bw).position.set(0,-.02,.06);
  if(k.ruff>0)part(SK.bumpy(SK.ball(.105*k.ruff*bw,16,11),.018,19,3),coat,neck,0,-.01,.0,true).scale.set(.9*ln,1.05,.85);
  // the head: a skull, a tapering muzzle over a jaw, a nose, eyes, ears
  part(SK.ball(.072,14,10),coat,head,0,.01,-.005,true).scale.set(.95,.85,1.05);
  [-1,1].forEach(s=>part(SK.ball(.04,10,7),coat,head,s*.04,-.01,.01,true).scale.set(.9,.9,1.1));
  const M=k.muzzle;
  part(zlathe([[0,0],[.045,.0],[.04,.07],[.03,.13],[.018,.155],[0,.16]].map(p=>[p[0],p[1]*M]),12),coat,head,0,-.005,.03,true).scale.set(1,.72,1);
  part(zlathe([[0,0],[.034,0],[.028,.08],[.016,.13],[0,.135]].map(p=>[p[0],p[1]*M]),10),coat,jaw,0,-.008,0,true).scale.set(1,.45,1);
  part(SK.ball(.019,8,6),dark,head,0,.012,.03+.155*M).scale.set(1.25,.9,1);
  [-1,1].forEach(s=>{
    part(SK.ball(.013,8,6),C(k.eye),head,s*.037,.03,.052);
    part(SK.ball(.006,6,4),dark,head,s*.039,.03,.061);
    const e=part(SK.cone(.032,.085*k.ears,6),coat,head,s*.042,.078,-.02,true);e.rotation.set(-.25,0,-s*.28);e.scale.set(1,1,.5);
    const ei=part(SK.cone(.02,.06*k.ears,5),C(0x3a2a24),head,s*.042,.072,-.012);ei.rotation.set(-.25,0,-s*.28);ei.scale.set(1,1,.3);
  });
  // legs: side 1 is the creature's left (+x). Front legs straight and slim, hind legs bent at the stifle and hock.
  ['L','R'].forEach((K,i)=>{const s=i===0?1:-1;
    const sh=bone('sh'+K,spine,s*.085*bw,-.03,.03);part(SK.ball(.07*bw,10,8),coat,sh,-s*.012,.01,.0,true).scale.set(.55,1.35,.95);
    seg(sh,-.15,-.03,.056*bw,.036*bw);
    const el=bone('el'+K,sh,0,-.15,-.03);seg(el,-.15,.01,.034,.026);
    const wr=bone('wr'+K,el,0,-.15,.01);seg(wr,-.07,.02,.025,.022);
    const pw=bone('pf'+K,wr,0,-.07,.02);part(SK.ball(.03,9,6),coat,pw,0,-.005,.018,true).scale.set(1,.6,1.45);
    const th=bone('th'+K,hips,s*.08*bw,-.02,-.02);part(SK.ball(.085*bw,11,8),coat,th,-s*.015,-.02,.01,true).scale.set(.55,1.15,1.05);
    seg(th,-.15,.07,.07*bw,.04*bw);
    const kn=bone('kn'+K,th,0,-.15,.07);seg(kn,-.13,-.09,.036,.024);
    const hk=bone('hk'+K,kn,0,-.13,-.09);seg(hk,-.09,.02,.024,.021);
    const ph=bone('ph'+K,hk,0,-.09,.02);part(SK.ball(.029,9,6),coat,ph,0,-.004,.016,true).scale.set(1,.6,1.4);
  });
  // the tail: a brush of bumped lobes, darker at the tip
  // each segment runs down and back along its bone to the next joint
  const tseg=(b,dy,dz,r0,r1,col,fur,k2)=>{const L=Math.hypot(dy,dz)*1.25;const o=part(SK.bumpy(SK.limb(L,r0,r1),.009,21,k2),col,b,0,0,0,fur);o.rotation.x=Math.atan2(-dz,-dy);o.scale.set(.85,1,.95);return o;};
  tseg(t1,-.05,-.1,.035,.058,coat,true,1);tseg(t2,-.06,-.08,.06,.066,coat,true,2);tseg(t3,-.06,-.07,.066,.026,C(k.saddle),false,4);
  // the Ash Hound's embers: glowing seams along the back, as the old model's red eyes suggest
  if(k.embers)for(let i=0;i<5;i++)part(SK.ball(.012,6,4),C(0xff6a20),i<3?spine:hips,0,i<3?.1-i*.005:.1,i<3?.08-i*.08:.12-(i-3)*.12).scale.set(1,.5,2.2);
  // bake: every part into one geometry, each vertex bound to its bone, fur counter-shaded by its normal
  const pos=[],nor=[],col=[],idx=[],si=[],sw=[];const m=new THREE.Matrix4(),nm=new THREE.Matrix3(),v=new THREE.Vector3(),n=new THREE.Vector3();let base=0;
  const sad=C(k.saddle),bel=C(k.belly),tmp=new THREE.Color();
  hips.updateMatrixWorld(true);
  for(const o of parts){o.updateMatrix();m.multiplyMatrices(o.parent.matrixWorld,o.matrix);nm.getNormalMatrix(m);const geo=o.userData.geo,c=o.userData.col,bi=o.parent.userData.i;const pa=geo.attributes.position,na=geo.attributes.normal;
    for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(m);pos.push(v.x,v.y,v.z);n.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();nor.push(n.x,n.y,n.z);
      tmp.copy(c);if(o.userData.fur){const up=n.y;if(up>0)tmp.lerp(sad,Math.min(1,up*1.25)*(v.y>.3?.85:.35));else tmp.lerp(bel,Math.min(1,-up*1.4)*.8);if(v.y<.1)tmp.lerp(bel,.12*(1-v.y/.1));}
      col.push(tmp.r,tmp.g,tmp.b);si.push(bi,0,0,0);sw.push(1,0,0,0);}
    if(geo.index){const ia=geo.index;for(let i=0;i<ia.count;i++)idx.push(ia.getX(i)+base);}else for(let i=0;i<pa.count;i++)idx.push(i+base);
    base+=pa.count;o.parent.remove(o);geo.dispose();}
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));geo.setIndex(idx);
  return {geo,bones,B,hips,tris:idx.length/3};
}
const WOLF_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,metalness:0,skinning:true});
function buildWolf(name,q){const k=WOLF_KINDS[name];const {geo,bones,B,hips,tris}=wolfBake(k,q);
  const mesh=new THREE.SkinnedMesh(geo,WOLF_MAT);mesh.add(hips);mesh.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));mesh.castShadow=true;
  const root=new THREE.Group();root.add(mesh);root.scale.setScalar(k.scale);return {root,B,tris,k};}
// poses: a trot (diagonal pairs), a stand, a lunge. Angles in radians, about x (pitch) unless named.
function wolfPose(w,kind,t){const B=w.B;for(const b of Object.values(B))b.rotation.set(0,0,0);B.hips.position.y=.40;
  if(kind==='stand'){B.neck.rotation.x=-.1;B.head.rotation.x=.15;B.tail1.rotation.x=-.25;B.tail2.rotation.x=-.2;return;}
  if(kind==='trot'){const a=t*Math.PI*2;
    // diagonal pairs: left fore with right hind. fwd is how far forward the foot is; lift is the swing, when it folds up
    const leg=(ph)=>({fwd:Math.sin(ph),lift:Math.max(0,Math.cos(ph))});
    const fore=(K,ph)=>{const l=leg(ph);B['sh'+K].rotation.x=-.42*l.fwd-.1*l.lift;B['el'+K].rotation.x=-.25*l.lift;B['wr'+K].rotation.x=1.3*l.lift;};
    const hind=(K,ph)=>{const l=leg(ph);B['th'+K].rotation.x=-.38*l.fwd-.15*l.lift;B['kn'+K].rotation.x=.45*l.lift;B['hk'+K].rotation.x=-.55*l.lift;};
    fore('L',a);hind('R',a);fore('R',a+Math.PI);hind('L',a+Math.PI);
    B.hips.position.y=.40+.012*Math.abs(Math.cos(a));B.neck.rotation.x=.15;B.head.rotation.x=-.05;B.tail1.rotation.x=.15+.05*Math.sin(a*2);B.tail2.rotation.x=-.05;B.tail1.rotation.y=.15*Math.sin(a);return;}
  if(kind==='lunge'){B.hips.rotation.x=.12;B.hips.position.y=.36;B.spine.rotation.x=-.15;B.neck.rotation.x=.35;B.head.rotation.x=-.2;B.jaw.rotation.x=.55;
    ['L','R'].forEach(K=>{B['sh'+K].rotation.x=-.9;B['el'+K].rotation.x=.5;B['wr'+K].rotation.x=.4;B['th'+K].rotation.x=.45;B['kn'+K].rotation.x=-.4;B['hk'+K].rotation.x=.5;});
    B.tail1.rotation.x=-.2;return;}
}
// today's box wolf, exactly as buildZoneEnemy draws it (shape 'wolf')
function oldWolf(col,eyeCol,sc2){const g=new THREE.Group();const mat=new THREE.MeshLambertMaterial({color:col});let tris=0;const add=m=>{g.add(m);m.castShadow=true;tris+=(m.geometry.index?m.geometry.index.count:m.geometry.attributes.position.count)/3;return m;};
  const body=add(new THREE.Mesh(new THREE.BoxGeometry(.45*sc2,.3*sc2,.7*sc2),mat));body.position.y=.32*sc2;
  const head=add(new THREE.Mesh(new THREE.BoxGeometry(.28*sc2,.25*sc2,.32*sc2),mat));head.position.set(0,.5*sc2,.3*sc2);
  const snout=add(new THREE.Mesh(new THREE.BoxGeometry(.16*sc2,.14*sc2,.2*sc2),mat));snout.position.set(0,.44*sc2,.46*sc2);
  const ey=add(new THREE.Mesh(new THREE.BoxGeometry(.1*sc2,.04*sc2,.02),new THREE.MeshBasicMaterial({color:eyeCol})));ey.position.set(0,.52*sc2,.47*sc2);
  [-1,1].forEach(s=>{const leg=add(new THREE.Mesh(new THREE.BoxGeometry(.09*sc2,.28*sc2,.09*sc2),mat));leg.position.set(s*.17*sc2,.14*sc2,s*.1*sc2);});
  [-1,1].forEach(s=>{const leg=add(new THREE.Mesh(new THREE.BoxGeometry(.09*sc2,.28*sc2,.09*sc2),mat));leg.position.set(s*.17*sc2,.14*sc2,-s*.1*sc2);});
  const tail=add(new THREE.Mesh(new THREE.CylinderGeometry(.04*sc2,.07*sc2,.3*sc2,5),mat));tail.rotation.x=-.7;tail.position.set(0,.45*sc2,-.36*sc2);
  [-1,1].forEach(s=>{const ear=add(new THREE.Mesh(new THREE.ConeGeometry(.05*sc2,.12*sc2,4),mat));ear.position.set(s*.09*sc2,.66*sc2,.28*sc2);});
  const back=add(new THREE.Mesh(new THREE.BoxGeometry(.36*sc2,.08*sc2,.6*sc2),new THREE.MeshLambertMaterial({color:new THREE.Color(col).multiplyScalar(.7)})));back.position.set(0,.48*sc2,-.02*sc2);
  const nose=add(new THREE.Mesh(new THREE.BoxGeometry(.06*sc2,.05*sc2,.05*sc2),new THREE.MeshLambertMaterial({color:0x1a1210})));nose.position.set(0,.47*sc2,.57*sc2);
  [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([s,f])=>{const paw=add(new THREE.Mesh(new THREE.BoxGeometry(.11*sc2,.06*sc2,.13*sc2),new THREE.MeshLambertMaterial({color:new THREE.Color(col).multiplyScalar(.6)})));paw.position.set(s*.17*sc2,.03*sc2,f*.1*sc2+.02*sc2);});
  return {root:g,tris};}
