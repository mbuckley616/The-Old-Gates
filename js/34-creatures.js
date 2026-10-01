
// ── Creatures on the shape kit (backlog H.4, Session 166): the wolf family ──
// Built the way buildPerson builds a townsperson: bones, SK parts hung on them, one skinned mesh with vertex
// colours. Every wolf of a kind shares one baked geometry (and one distant copy); each has its own skeleton.
// The fur is counter-shaded at the bake from each vertex's normal (the saddle darkens what faces the sky, the
// belly lightens what faces the ground). The legs are placed by two-bone IK: a planted paw stays on the ground
// and slides back under the body at the pace it moved, as the townsfolk's feet do. Prototype: docs/prototypes/creatures.
// At scale 1 the wolf has the old box wolf's size (shoulder about .47, nose at z about .6), so reach and hits are unchanged.
const WOLF_KINDS={
  'Wolf':      {coat:0x7a6a5c,saddle:0x3e342c,belly:0xd8ccb4,eye:0xddaa44,ruff:1.0,ears:1.0,muzzle:1.0},
  'Snow Wolf': {coat:0xdcdce0,saddle:0x9a9ca4,belly:0xf4f2ee,eye:0x80c0ff,ruff:1.25,ears:.85,muzzle:.95},
  'Dire Wolf': {coat:0x3a3230,saddle:0x1a1614,belly:0x6a5e54,eye:0xffb030,ruff:1.35,ears:.9,muzzle:1.12,bulk:1.15},
  'Ash Hound': {coat:0x5a5048,saddle:0x2a2420,belly:0x8a7a6a,eye:0xff5020,ruff:.55,ears:1.25,muzzle:1.2,lean:.86,embers:true},
  // the boar shares the wolf's bones and gait; its parts are its own (wolfBakeQ's k.boar), its head carried low (neck)
  'Boar':      {coat:0x5a4030,saddle:0x2e2016,belly:0x8a6a50,eye:0x3a2010,boar:true,neck:.35,bulk:1.05},
  // S223 — the Cave Bear (Michael's answer B on Session 214, as shown): the wolf's bones and gait under its own heavy body (k.bear)
  'Cave Bear': {coat:0x4a3a2a,saddle:0x2e2218,belly:0x6a5440,eye:0x1a1008,bear:true,neck:.3,bulk:1.3,eyePos:[.04,.035,.062]},
  // S262 — the coach's horses (Michael's A on Session 230): the wolf's bones on a horse's legs (a high hock, long cannons), a body of
  // their own (k.horse), a bay and a grey; legK scales the gait's stride to the longer legs
  'Horse':     {coat:0x6a4428,saddle:0x24160c,belly:0x8a6444,eye:0x140c08,horse:true,legK:1.8,legs:{fore:{root:[-.03,.03],a:[-.22,-.04],b:[-.22,.02],c:[-.23,.01]},hind:{root:[-.02,-.02],a:[-.2,.08],b:[-.2,-.1],c:[-.26,.01]}},hipY:.70,bulk:1.05,eyePos:[.052,.02,.03]},
  'Grey Horse':{coat:0xb4aea4,saddle:0x5a5650,belly:0xd4cec4,eye:0x140c08,horse:true,legK:1.8,legs:{fore:{root:[-.03,.03],a:[-.22,-.04],b:[-.22,.02],c:[-.23,.01]},hind:{root:[-.02,-.02],a:[-.2,.08],b:[-.2,-.1],c:[-.26,.01]}},hipY:.70,bulk:1.05,eyePos:[.052,.02,.03]},
  // the world's dragon (S177): the wolf's legs and gait under a long neck, a long tail, horns and two wings of its own
  'Dragon':    {coat:0x5a2a1a,saddle:0x3a160c,belly:0xa87a48,eye:0xff8020,dragon:true,bulk:1.28,neck:-.15,eyePos:[.05,.04,.104]}
};
const WOLF_RIGS=new Set();
const WOLF_GEO=new Map();
const WOLF_LOD={q:.5,far:17,near:15,shadowLo:true};
const WOLF_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,metalness:0,skinning:true});
// the legs: [shoulder or hip bone, elbow or stifle, wrist or hock, paw], each joint's offset from the one above
const WOLF_LEGS={
  fore:{root:[-.03,.03],a:[-.15,-.03],b:[-.15,.01],c:[-.07,.02]},
  hind:{root:[-.02,-.02],a:[-.15,.07],b:[-.13,-.09],c:[-.09,.02]}
};
// S262 — a kind may stand on longer legs (k.legK, the horse): its leg segments scaled (or its own table, k.legs, with
// k.hipY), the hips raised to match, and the gait's strides, lifts and bounce scaled by legK (WG_L/WG_LK, set per rig in
// tickCreatures); the wolf's own at 1
function wolfLegs(k){if(k._legs)return k._legs;if(k.legs)return k._legs=k.legs;const K=k.legK||1;if(K===1)return k._legs=WOLF_LEGS;const sc=L=>({root:L.root,a:L.a.map(v=>v*K),b:L.b.map(v=>v*K),c:L.c.map(v=>v*K)});return k._legs={fore:sc(WOLF_LEGS.fore),hind:sc(WOLF_LEGS.hind)};}
const wolfHipY=k=>k.hipY||.40+.37*((k.legK||1)-1);
let WG_L=WOLF_LEGS,WG_LK=1;
// the skeleton alone, the same bones in the same order every time, so one baked geometry skins to any wolf's
function wolfSkeleton(k){
  const bones=[],B={};const bw=k.bulk||1;
  const bone=(name,parent,x,y,z)=>{const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);if(parent)parent.add(b);b.userData.i=bones.length;bones.push(b);B[name]=b;return b;};
  const dr=!!k.dragon; // a dragon's neck and tail are longer, and it has wings (after the legs, so the legs' bones keep their order)
  const hips=bone('hips',null,0,wolfHipY(k),-.2);const hr=!!k.horse; // S262 — a horse's neck is long and carried high
  const spine=bone('spine',hips,0,.03,.34);
  const neck=bone('neck',spine,0,dr?.07:hr?.09:.05,dr?.14:hr?.15:.1);
  const head=bone('head',neck,0,dr?.2:hr?.26:.11,dr?.17:hr?.13:.1);
  bone('jaw',head,0,-.035,dr?.05:.035);
  const t1=bone('tail1',hips,0,.04,dr?-.16:-.11),t2=bone('tail2',t1,0,dr?-.05:-.05,dr?-.26:-.1);bone('tail3',t2,0,dr?-.05:-.06,dr?-.28:-.08);
  const F=wolfLegs(k).fore,H=wolfLegs(k).hind;
  ['L','R'].forEach((K,i)=>{const s=i===0?1:-1;
    const sh=bone('sh'+K,spine,s*.074*bw,F.root[0],F.root[1]);const el=bone('el'+K,sh,0,F.a[0],F.a[1]);const wr=bone('wr'+K,el,0,F.b[0],F.b[1]);bone('pf'+K,wr,0,F.c[0],F.c[1]);
    const th=bone('th'+K,hips,s*.078*bw,H.root[0],H.root[1]);const kn=bone('kn'+K,th,0,H.a[0],H.a[1]);const hk=bone('hk'+K,kn,0,H.b[0],H.b[1]);bone('ph'+K,hk,0,H.c[0],H.c[1]);
  });
  if(dr){bone('wingL',spine,.09,.1,-.02);bone('wingR',spine,-.09,.1,-.02);}
  return {bones,B,hips};
}
function wolfBake(k,q){SK.q=q;try{return wolfBakeQ(k,q);}finally{SK.q=1;}}
function wolfBakeQ(k,q){
  const {bones,B,hips}=wolfSkeleton(k);
  const parts=[];
  // fur:true parts are counter-shaded at the bake
  const part=(geo,col,b,x,y,z,fur)=>{const o=new THREE.Object3D();o.position.set(x||0,y||0,z||0);o.userData.geo=geo;o.userData.col=col;o.userData.fur=fur;b.add(o);parts.push(o);return o;};
  const C=x=>new THREE.Color(x);const coat=C(k.coat),dark=C(0x16100c),bw=k.bulk||1,ln=k.lean||1;
  // a limb from a bone towards its child joint at (dy, dz): radius r0 at the joint, r1 at the far end, a muscle's belly
  // swelling it by `belly` a third of the way down, so a thigh or a forearm is not a tube
  const limbGeo=(L,r0,r1,belly)=>{const p=[];const n=belly?5:2;for(let i=0;i<=3;i++){const a=i/3*Math.PI/2;p.push(SK.v2(Math.max(1e-4,r1*Math.sin(a)),-L-r1*Math.cos(a)));}
    for(let i=n-1;i>=1;i--){const t=i/n;const r=r0+(r1-r0)*t+belly*Math.sin(Math.PI*Math.min(1,t*1.5));p.push(SK.v2(r,-L*t));}
    for(let i=0;i<=3;i++){const a=i/3*Math.PI/2;p.push(SK.v2(Math.max(1e-4,r0*Math.cos(a)),r0*Math.sin(a)));}return new THREE.LatheGeometry(p,SK.seg(8,5));};
  const seg=(b,d,r0,r1,belly,col)=>{const L=Math.hypot(d[0],d[1]);const o=part(limbGeo(L,r0,r1,belly||0),col||coat,b,0,0,0,true);o.rotation.x=Math.atan2(-d[1],-d[0]);return o;};
  // a lathe along +z (the body's axis)
  const zlathe=(pts,n)=>{const g=SK.lathe(pts,n||14);g.rotateX(Math.PI/2);return g;};
  if(k.dragon){ // v80 S177 — the dragon's parts on the wolf's bones and its own wings
    const F=wolfLegs(k).fore,H=wolfLegs(k).hind,bw=k.bulk||1,horn=C(0xe0d0b0),claw=C(0x2a1a14),mem=C(0x7a3a24);
    part(zlathe([[0,-.24],[.08,-.23],[.13,-.16],[.155,-.06],[.16,.04],[.14,.13],[.09,.19],[0,.21]],16),coat,B.spine,0,-.04,0,true).scale.set(.8*bw,1.05*bw,1);
    part(zlathe([[0,-.2],[.08,-.19],[.12,-.11],[.13,0],[.125,.12],[.11,.2],[0,.26]],14),coat,hips,0,0,0,true).scale.set(.84*bw,1.02*bw,1);
    // the neck in two tapering pieces to the head; a spine of horn along neck, back and tail
    seg(B.spine,[.07,.14],.1*bw,.085,.006).position.set(0,.0,.1);seg(B.neck,[.2,.17],.085,.06,.004);
    const spk=(b,x,y,z,h)=>{const o=part(SK.cone(.022,h,5),horn,b,x,y,z);o.rotation.x=-.45;o.scale.set(.5,1,1.3);};
    for(let i=0;i<4;i++)spk(B.neck,0,.05+i*.05,.04+i*.045,.05);for(let i=0;i<5;i++)spk(B.spine,0,.2-(i>3?.02:0),.18-i*.09,.07);for(let i=0;i<3;i++)spk(hips,0,.17-i*.02,.1-i*.11,.065);
    // the head: a long skull and snout, a jaw lined with teeth, brow ridges, swept-back horns, nostrils
    const head=B.head;part(SK.ball(.07,12,9),coat,head,0,.01,-.01,true).scale.set(.95,.85,1.2);
    part(zlathe([[0,0],[.06,0],[.055,.08],[.04,.16],[.028,.21],[0,.215]],12),coat,head,0,-.005,.03,true).scale.set(1,.7,1);
    part(zlathe([[0,0],[.045,0],[.04,.1],[.024,.18],[0,.185]],10),C(k.belly),B.jaw,0,-.01,0,true).scale.set(1,.4,1);
    for(const s2 of [1,-1]){for(let t=0;t<5;t++){const tt=part(SK.cone(.006,.02,4),horn,head,s2*(.036-t*.004),-.028,.07+t*.035);tt.rotation.x=Math.PI;}
      const hr=part(SK.cone(.024,.17,6),horn,head,s2*.045,.06,-.04);hr.rotation.set(-1.1,0,-s2*.35);
      const br=part(SK.ball(.022,7,5),coat,head,s2*.045,.045,.05,true);br.scale.set(1.1,.6,1.6);
      part(SK.ball(.007,5,4),claw,head,s2*.018,.02,.235);
      if(q>=1){part(SK.ball(.013,7,5),C(k.eye),head,s2*.05,.04,.1);part(SK.ball(.006,5,4),dark,head,s2*.054,.04,.11);}}
    // legs: heavy, scaled, three claws a foot
    ['L','R'].forEach(K=>{
      part(SK.ball(.08*bw,10,8),coat,B['sh'+K],0,.02,0,true).scale.set(.6,1.3,1);seg(B['sh'+K],F.a,.07*bw,.05*bw,.014);seg(B['el'+K],F.b,.05,.038,.008);seg(B['wr'+K],F.c,.036,.032,0);
      part(SK.ball(.1*bw,10,8),coat,B['th'+K],0,-.02,.01,true).scale.set(.6,1.2,1.05);seg(B['th'+K],H.a,.085*bw,.055*bw,.018);seg(B['kn'+K],H.b,.05,.036,.008);seg(B['hk'+K],H.c,.036,.032,0);
      for(const pw of [B['pf'+K],B['ph'+K]]){part(SK.ball(.04,8,6),coat,pw,0,-.004,.02,true).scale.set(1.1,.55,1.4);for(let c=-1;c<=1;c++){const cl=part(SK.cone(.01,.04,4),claw,pw,c*.022,-.012,.07);cl.rotation.x=Math.PI/2+.4;}}});
    // the tail: long tapering segments with a spade at the tip
    const tseg=(b,dy,dz,r0,r1,col,fur,k2)=>{const L=Math.hypot(dy,dz)*1.15;const o=part(SK.bumpy(SK.limb(L,r0,r1),.006,21,k2),col,b,0,0,0,fur);o.rotation.x=Math.atan2(-dz,-dy);return o;};
    tseg(B.tail1,-.05,-.16,.075,.065,coat,true,1);tseg(B.tail2,-.05,-.26,.065,.045,coat,true,2);tseg(B.tail3,-.05,-.28,.045,.02,coat,true,3);
    const sp2=part(SK.cone(.05,.12,4),horn,B.tail3,0,-.06,-.3);sp2.rotation.x=-Math.PI/2-.2;sp2.scale.set(1,1,.35);
    // the wings: an arm out from the shoulder, three fingers sweeping back, the membrane between them (both faces)
    for(const [n,s2] of [['wingL',1],['wingR',-1]]){const w=B[n];const arm=[s2*.5,.1,.02],fing=[[s2*.62,-.04,-.22],[s2*.5,-.12,-.4],[s2*.3,-.14,-.46]];
      const rod=(a,b,r0,r1)=>{const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),L=d.length();const g2=SK.cyl(r1,r0,L,5);g2.translate(0,L/2,0);const o=part(g2,coat,w,a[0],a[1],a[2]);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;};
      rod([0,0,0],arm,.035,.025);fing.forEach(f=>rod(arm,f,.018,.008));
      const pts=[[0,0,0],arm,...fing,[s2*.12,-.05,-.3],[0,-.02,-.2]];const pos=[];const tri=(a,b,c)=>{pos.push(...a,...b,...c,...a,...c,...b);};
      tri(pts[0],pts[1],pts[2]);tri(pts[0],pts[2],pts[3]);tri(pts[0],pts[3],pts[4]);tri(pts[0],pts[4],pts[5]);tri(pts[0],pts[5],pts[6]);
      const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));mg.computeVertexNormals();part(mg,mem,w,0,0,0);}
  }else if(k.bear){ // S223 — the Cave Bear: a deep shaggy barrel with a hump over the shoulders, thick pillar legs on broad
    // clawed paws, a round head with a short muzzle and small round ears, the tail a stub
    const F=wolfLegs(k).fore,H=wolfLegs(k).hind,cl=C(0x1e1814);
    part(SK.bumpy(zlathe([[0,-.24],[.09,-.23],[.15,-.16],[.18,-.06],[.182,.04],[.16,.13],[.1,.2],[0,.22]],16),.008,23,1),coat,B.spine,0,-.02,0,true).scale.set(.95*bw,1.1*bw,1);
    part(SK.bumpy(zlathe([[0,-.2],[.09,-.19],[.15,-.11],[.16,0],[.155,.12],[.13,.2],[0,.25]],14),.008,23,2),coat,hips,0,-.01,0,true).scale.set(.95*bw,1.02*bw,1);
    part(SK.bumpy(SK.ball(.12,14,10),.012,19,3),coat,B.spine,0,.1*bw,.05,true).scale.set(.95*bw,.75,1.2);
    seg(B.spine,[.1,.13],.11*bw,.095*bw,.01).position.set(0,-.03,.08);
    part(SK.bumpy(SK.ball(.1*bw,14,10),.014,19,4),coat,B.neck,0,-.01,0,true).scale.set(.9,1,.85);
    const head=B.head;
    part(SK.ball(.085,14,10),coat,head,0,.01,-.01,true).scale.set(1.05,.95,1);
    [-1,1].forEach(s=>part(SK.ball(.045,10,7),coat,head,s*.045,-.012,.015,true).scale.set(.95,.85,1));
    part(zlathe([[0,0],[.05,0],[.046,.05],[.036,.1],[.02,.12],[0,.125]],12),C(k.belly),head,0,-.012,.045,true).scale.set(1,.78,1);
    part(zlathe([[0,0],[.038,0],[.032,.06],[.018,.095],[0,.1]],10),C(k.belly),B.jaw,0,-.01,0,true).scale.set(1,.45,1);
    part(SK.ball(.021,8,6),dark,head,0,-.002,.168).scale.set(1.3,.9,1);
    [-1,1].forEach(s=>{const e=part(SK.ball(.03,8,6),coat,head,s*.06,.075,-.02,true);e.scale.set(1,1,.45);part(SK.ball(.018,6,5),C(0x2a1e16),head,s*.06,.075,-.008).scale.set(1,1,.3);});
    ['L','R'].forEach(K=>{
      part(SK.ball(.08*bw,10,8),coat,B['sh'+K],0,.02,0,true).scale.set(.6,1.3,1);
      seg(B['sh'+K],F.a,.07*bw,.058*bw,.014);seg(B['el'+K],F.b,.056*bw,.05*bw,.006);seg(B['wr'+K],F.c,.05*bw,.046*bw,0);
      part(SK.ball(.1*bw,10,8),coat,B['th'+K],0,-.02,.01,true).scale.set(.6,1.2,1.05);
      seg(B['th'+K],H.a,.08*bw,.06*bw,.016);seg(B['kn'+K],H.b,.058*bw,.05*bw,.006);seg(B['hk'+K],H.c,.05*bw,.046*bw,0);
      for(const pw of [B['pf'+K],B['ph'+K]]){part(SK.ball(.05*bw,9,6),coat,pw,0,-.006,.02,true).scale.set(1.05,.5,1.35);
        for(let c=0;c<4;c++){const t=part(SK.cone(.008,.035,4),cl,pw,(c-1.5)*.02*bw,-.014,.075*bw);t.rotation.x=Math.PI/2+.5;}}});
    part(SK.ball(.035,8,6),coat,B.tail1,0,-.01,-.02,true);
  }else if(k.horse){ // S262 — the coach's horse (Michael's A on Session 230, as shown) on the wolf's bones, its legs 1.8 as long:
    // a deep barrel and haunches, a long neck carried high with a mane, a long head with its muzzle down, slim legs with
    // knobbed knees and hocks to dark hooves, a long hanging tail, a collar and a pad (the harness) in the coach's leather
    const F=wolfLegs(k).fore,H=wolfLegs(k).hind,bw=k.bulk||1,sad=C(k.saddle),hoof=C(0x1e1814),tack=C(0x3a2616),brass=C(0xb08a30);
    part(zlathe([[0,-.27],[.1,-.26],[.16,-.18],[.19,-.07],[.195,.04],[.18,.13],[.12,.2],[0,.23]],16),coat,B.spine,0,-.03,0,true).scale.set(.78*bw,1.02*bw,1);
    part(zlathe([[0,-.22],[.1,-.21],[.16,-.12],[.18,-.01],[.17,.12],[.13,.2],[0,.25]],14),coat,hips,0,0,-.01,true).scale.set(.84*bw,1*bw,1);
    // the neck from the withers up to the poll, deep where it meets the chest; the mane along its crest
    seg(B.spine,[.14,.13],.12*bw,.1*bw,.01).position.set(0,-.01,.1);
    seg(B.neck,[.26,.13],.1*bw,.062,.012);
    for(let i=0;i<8;i++){const t=i/7,o=part(SK.bumpy(SK.ball(.04,8,6),.01,17,i),sad,B.neck,0,.26*t+.05,.13*t-.06);o.scale.set(.5,1.1,1.3);}
    part(SK.bumpy(SK.ball(.035,8,6),.008,17,9),sad,B.head,0,.03,.03).scale.set(.6,1,1.4);
    // the head: a skull, the long face tapering down to the muzzle, nostrils, pricked ears, a bridle
    const head=B.head;part(SK.ball(.068,12,9),coat,head,0,0,0,true).scale.set(.9,.95,1.1);
    const face=part(zlathe([[0,0],[.058,0],[.062,.06],[.052,.15],[.046,.22],[.042,.26],[0,.275]],12),coat,head,0,-.01,.02,true);face.rotation.x=.75;face.scale.set(.85,1,1);
    for(const s of [1,-1]){part(SK.ball(.012,6,4),dark,head,s*.022,-.2,.19);const e=part(SK.cone(.022,.075,6),coat,head,s*.035,.075,-.02,true);e.rotation.set(-.2,0,-s*.2);e.scale.set(1,1,.55);}
    part(SK.torus(.056,.008,4,12),tack,head,0,-.1,.1).rotation.x=.75;part(SK.torus(.07,.008,4,12),tack,head,0,-.01,.03).rotation.x=Math.PI/2+.4;
    part(zlathe([[0,0],[.035,0],[.03,.1],[0,.12]],8),coat,B.jaw,0,-.06,.03,true).rotation.x=.8;
    // the harness: a collar round the neck's base, a pad over the back with its girth
    const col_=part(SK.torus(.12,.035,6,14),tack,B.spine,0,.1,.19);col_.rotation.x=-.9;col_.scale.set(.85,1.15,1);
    part(SK.rbox(.2,.04,.16,.015,1),tack,B.spine,0,.19,-.05);{const gt=part(SK.torus(.17,.012,4,14),tack,B.spine,0,-.02,-.05);gt.rotation.y=Math.PI/2;gt.scale.set(.8,1.1,1);}
    part(SK.ball(.018,6,4),brass,B.spine,0,.14,.29);
    // legs: slim, a forearm and a gaskin with some muscle, knobbed knees and hocks, cannons to a fetlock and a dark hoof
    ['L','R'].forEach((K,i)=>{const s=i===0?1:-1;
      part(SK.ball(.08*bw,10,8),coat,B['sh'+K],-s*.012,.03,0,true).scale.set(.55,1.5,1);
      seg(B['sh'+K],F.a,.058*bw,.034,.012);part(SK.ball(.03,7,5),coat,B['el'+K],0,0,0,true);
      seg(B['el'+K],F.b,.028,.022,.004);part(SK.ball(.026,7,5),coat,B['wr'+K],0,0,0,true);
      seg(B['wr'+K],F.c,.022,.02,0,sad);part(SK.cyl(.028,.034,.045,10),hoof,B['pf'+K],0,-.002,.008);
      part(SK.ball(.1*bw,11,8),coat,B['th'+K],-s*.014,-.01,.01,true).scale.set(.55,1.25,1.1);
      seg(B['th'+K],H.a,.07*bw,.036,.014);part(SK.ball(.032,7,5),coat,B['kn'+K],0,0,0,true);
      seg(B['kn'+K],H.b,.03,.022,.005);part(SK.ball(.026,7,5),coat,B['hk'+K],0,0,-.01,true).scale.set(.9,1.1,1.3);
      seg(B['hk'+K],H.c,.022,.02,0,sad);part(SK.cyl(.028,.034,.045,10),hoof,B['ph'+K],0,-.002,.008);});
    // the tail: a dock, then long hair hanging to the hocks
    const tl=(b,dy,dz,r0,r1,kk)=>{const L=Math.hypot(dy,dz);const o=part(SK.bumpy(SK.limb(L,r0,r1),.01,21,kk),sad,b,0,0,0);o.rotation.x=Math.atan2(-dz,-dy);o.scale.set(.8,1,.9);return o;};
    tl(B.tail1,-.06,-.08,.03,.04,1);tl(B.tail2,-.14,-.04,.045,.05,2);tl(B.tail3,-.2,-.02,.05,.03,3);
  }else if(k.boar){ // v80 S170 — the boar on the wolf's bones: a deep barrel that hides the upper legs, the head carried low, tusks, a bristled ridge, hooves
    const F=wolfLegs(k).fore,H=wolfLegs(k).hind,bw=k.bulk||1;
    part(zlathe([[0,-.24],[.08,-.23],[.14,-.16],[.17,-.06],[.172,.04],[.15,.13],[.09,.19],[0,.21]],16),coat,B.spine,0,-.025,0,true).scale.set(.84*bw,1.08*bw,1);
    part(zlathe([[0,-.2],[.09,-.19],[.14,-.11],[.152,0],[.15,.12],[.13,.2],[0,.26]],14),coat,hips,0,-.01,0,true).scale.set(.92*bw,1.05*bw,1);
    seg(B.spine,[.1,.13],.12*bw,.1*bw,.01).position.set(0,-.04,.08);
    // the bristled ridge down the neck and back
    for(let i=0;i<9;i++){const b=i<5?B.spine:hips,z=i<5?.2-i*.07:.14-(i-5)*.09;const o=part(SK.bumpy(SK.cone(.024,.055-Math.abs(i-3)*.004,6),.004,17,i),C(k.saddle),b,0,.18-(i>6?.02:0),z);o.rotation.x=-.6;o.scale.set(.6,1,1.4);}
    // the head: a heavy wedge to a flat disc snout, tusks curving up from the jaw, small eyes set high, small pricked ears
    const head=B.head;
    part(SK.ball(.085,14,10),coat,head,0,-.01,-.01,true).scale.set(.95,1,1.15);
    part(zlathe([[0,0],[.075,0],[.065,.08],[.05,.15],[.044,.19],[0,.195]],12),coat,head,0,-.03,.04,true).scale.set(1,.85,1);
    part(SK.cyl(.046,.046,.02,12),C(0x7a5a52),head,0,-.03,.235).rotation.x=Math.PI/2;
    for(const s of [1,-1]){part(SK.ball(.009,6,4),C(0x2a1a18),head,s*.017,-.028,.246);
      const t=part(SK.cone(.013,.075,6),C(0xe8e0c8),head,s*.045,-.06,.16);t.rotation.set(-.5,0,-s*.35);
      if(q>=1){part(SK.ball(.011,7,5),C(k.eye),head,s*.052,.035,.06);part(SK.ball(.005,5,4),dark,head,s*.055,.035,.066);}
      const e=part(SK.cone(.028,.07,5),coat,head,s*.05,.08,-.03,true);e.rotation.set(-.4,0,-s*.5);e.scale.set(1,1,.45);}
    part(zlathe([[0,0],[.05,0],[.045,.1],[.03,.15],[0,.155]],10),coat,B.jaw,0,-.02,0,true).scale.set(1,.4,1);
    // legs: short and sturdy below the barrel, dark hooves
    ['L','R'].forEach(K=>{
      seg(B['sh'+K],F.a,.055*bw,.04*bw,.012);seg(B['el'+K],F.b,.036,.028,.006);part(SK.ball(.028,7,5),coat,B['wr'+K],0,0,0,true);
      seg(B['wr'+K],F.c,.026,.024,0,C(0x2a2018));part(SK.cyl(.026,.03,.035,8),C(0x1e1612),B['pf'+K],0,.0,.01);
      seg(B['th'+K],H.a,.07*bw,.045*bw,.016);seg(B['kn'+K],H.b,.038,.028,.006);part(SK.ball(.028,7,5),coat,B['hk'+K],0,0,0,true);
      seg(B['hk'+K],H.c,.026,.024,0,C(0x2a2018));part(SK.cyl(.026,.03,.035,8),C(0x1e1612),B['ph'+K],0,.0,.01);});
    // a thin tail with a dark tuft
    const tl=part(SK.limb(.13,.014,.01),coat,B.tail1,0,0,0,true);tl.rotation.x=Math.atan2(.1,.05);part(SK.bumpy(SK.ball(.025,7,5),.008,19,2),C(k.saddle),B.tail2,0,-.02,-.02);
  }else{
  // the body: a deep chest on the spine (narrower than the prototype's, which was heavy from the front), a tucked waist and haunches on the hips
  part(zlathe([[0,-.22],[.07,-.21],[.12,-.15],[.145,-.05],[.15,.03],[.13,.11],[.08,.16],[0,.18]],16),coat,B.spine,0,-.04,0,true).scale.set(.63*bw*ln,1.08*bw,1);
  part(zlathe([[0,-.15],[.08,-.14],[.11,-.07],[.108,.02],[.092,.12],[.085,.2],[0,.24]],14),coat,hips,0,.005,0,true).scale.set(.8*bw*ln,1*bw,1);
  // the neck and its ruff
  seg(B.spine,[.14,.13],.075*bw,.062*bw,.006).position.set(0,-.02,.06);
  if(k.ruff>0)part(SK.bumpy(SK.ball(.1*k.ruff*bw,16,11),.018,19,3),coat,B.neck,0,-.01,0,true).scale.set(.84*ln,1.05,.85);
  // the head: a skull, cheeks, a tapering muzzle over a hinged jaw, a nose, eyes, ears with dark insides
  const head=B.head,M=k.muzzle;
  part(SK.ball(.072,14,10),coat,head,0,.01,-.005,true).scale.set(.95,.85,1.05);
  [-1,1].forEach(s=>part(SK.ball(.04,10,7),coat,head,s*.04,-.01,.01,true).scale.set(.9,.9,1.1));
  part(zlathe([[0,0],[.045,0],[.04,.07],[.03,.13],[.018,.155],[0,.16]].map(p=>[p[0],p[1]*M]),12),coat,head,0,-.005,.03,true).scale.set(1,.72,1);
  part(zlathe([[0,0],[.034,0],[.028,.08],[.016,.13],[0,.135]].map(p=>[p[0],p[1]*M]),10),coat,B.jaw,0,-.008,0,true).scale.set(1,.45,1);
  part(SK.ball(.019,8,6),dark,head,0,.012,.03+.155*M).scale.set(1.25,.9,1);
  [-1,1].forEach(s=>{
    if(q>=1){part(SK.ball(.013,8,6),C(k.eye),head,s*.037,.03,.052);part(SK.ball(.006,6,4),dark,head,s*.039,.03,.061);}
    const e=part(SK.cone(.032,.085*k.ears,6),coat,head,s*.042,.078,-.02,true);e.rotation.set(-.25,0,-s*.28);e.scale.set(1,1,.5);
    const ei=part(SK.cone(.02,.06*k.ears,5),C(0x3a2a24),head,s*.042,.072,-.012);ei.rotation.set(-.25,0,-s*.28);ei.scale.set(1,1,.3);
  });
  // legs: a shoulder blade and a haunch worked into the body, muscled upper segments, slim cannons, knobbed joints
  const F=wolfLegs(k).fore,H=wolfLegs(k).hind;
  ['L','R'].forEach((K,i)=>{const s=i===0?1:-1;
    const sh=B['sh'+K],el=B['el'+K],wr=B['wr'+K],pf=B['pf'+K],th=B['th'+K],kn=B['kn'+K],hk=B['hk'+K],ph=B['ph'+K];
    part(SK.ball(.066*bw,10,8),coat,sh,-s*.01,.02,0,true).scale.set(.5,1.4,.95);
    seg(sh,F.a,.05*bw,.032*bw,.012*bw);part(SK.ball(.03,7,5),coat,el,0,0,-.006,true).scale.set(.9,1,1.15);
    seg(el,F.b,.03,.021,.006);part(SK.ball(.024,7,5),coat,wr,0,0,.004,true).scale.set(.95,1.1,1.05);
    seg(wr,F.c,.021,.019,0);part(SK.ball(.03,9,6),coat,pf,0,-.005,.018,true).scale.set(1,.6,1.45);
    part(SK.ball(.084*bw,11,8),coat,th,-s*.014,-.02,.01,true).scale.set(.55,1.15,1.05);
    seg(th,H.a,.064*bw,.034*bw,.016*bw);part(SK.ball(.033,7,5),coat,kn,0,0,.004,true).scale.set(.9,1,1.1);
    seg(kn,H.b,.032,.021,.007);part(SK.ball(.024,7,5),coat,hk,0,.004,-.012,true).scale.set(.9,1.1,1.25);
    seg(hk,H.c,.02,.018,0);part(SK.ball(.029,9,6),coat,ph,0,-.004,.016,true).scale.set(1,.6,1.4);
  });
  // the tail: a brush of bumped lobes, darker at the tip, each running down and back along its bone to the next joint
  const tseg=(b,dy,dz,r0,r1,col,fur,k2)=>{const L=Math.hypot(dy,dz)*1.25;const o=part(SK.bumpy(SK.limb(L,r0,r1),.009,21,k2),col,b,0,0,0,fur);o.rotation.x=Math.atan2(-dz,-dy);o.scale.set(.85,1,.95);return o;};
  tseg(B.tail1,-.05,-.1,.035,.058,coat,true,1);tseg(B.tail2,-.06,-.08,.06,.066,coat,true,2);tseg(B.tail3,-.06,-.07,.066,.026,C(k.saddle),false,4);
  // the Ash Hound's embers: glowing seams along the back
  if(k.embers)for(let i=0;i<5;i++)part(SK.ball(.012,6,4),C(0xff6a20),i<3?B.spine:hips,0,.1-(i<3?i*.005:0),i<3?.08-i*.08:.12-(i-3)*.12).scale.set(1,.5,2.2);
  }
  // bake: every part into one geometry, each vertex bound to its bone, the fur shaded by its normal
  const pos=[],nor=[],col=[],idx=[],si=[],sw=[],PR=[];const m=new THREE.Matrix4(),nm=new THREE.Matrix3(),v=new THREE.Vector3(),n=new THREE.Vector3();let base=0;
  const sad=C(k.saddle),bel=C(k.belly),tmp=new THREE.Color();
  hips.updateMatrixWorld(true);
  for(const o of parts){o.updateMatrix();m.multiplyMatrices(o.parent.matrixWorld,o.matrix);nm.getNormalMatrix(m);const geo=o.userData.geo,c=o.userData.col,bi=o.parent.userData.i;const pa=geo.attributes.position,na=geo.attributes.normal;
    for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(m);pos.push(v.x,v.y,v.z);n.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();nor.push(n.x,n.y,n.z);
      tmp.copy(c);if(o.userData.fur){const up=n.y;if(up>0)tmp.lerp(sad,Math.min(1,up*1.25)*(v.y>.3?.85:.35));else tmp.lerp(bel,Math.min(1,-up*1.4)*.8);if(v.y<.1)tmp.lerp(bel,.12*(1-v.y/.1));}
      col.push(tmp.r,tmp.g,tmp.b);si.push(bi,0,0,0);sw.push(1,0,0,0);}
    if(geo.index){const ia=geo.index;for(let i=0;i<ia.count;i++)idx.push(ia.getX(i)+base);}else for(let i=0;i<pa.count;i++)idx.push(i+base);
    PR.push([base,pa.count]);base+=pa.count;geo.dispose();}
  personAO(pos,nor,col,PR); // S270 — the creatures' creases shaded as the people's (Michael's A on Session 243: the people, then the creatures)
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));geo.setIndex(idx);
  geo.computeBoundingSphere();geo.boundingSphere.radius+=.15; // room for a stride or a lunge
  return {geo,tris:idx.length/3};
}
function wolfGeo(name,q){const key=name+'|'+q;let r=WOLF_GEO.get(key);if(!r){r=wolfBake(WOLF_KINDS[name],q);WOLF_GEO.set(key,r);}return r;}
// one wolf: its own skeleton on its kind's shared geometry; the eyes also shine at night (one small unlit mesh on the head)
function buildWolf(name,scale){
  const k=WOLF_KINDS[name];const hi=wolfGeo(name,1),lo=wolfGeo(name,WOLF_LOD.q);
  const {bones,B,hips}=wolfSkeleton(k);
  const mat=WOLF_MAT.clone(); // its own, so a wind-up's red flash and the corpse's darkening touch this wolf alone
  const mesh=new THREE.SkinnedMesh(hi.geo,mat);mesh.add(hips);mesh.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));
  mesh.castShadow=true;mesh.receiveShadow=false;
  // bone matrices local to the mesh, as buildPerson's (world coordinates here are too large for the float32 cancel)
  mesh.bindMode='detached';mesh.bindMatrix.identity();mesh.bindMatrixInverse.identity();
  {const sk=mesh.skeleton,mats=bones.map(()=>new THREE.Matrix4()),off=new THREE.Matrix4();
    sk.update=function(){for(let i=0;i<bones.length;i++){const b=bones[i];b.updateMatrix();const p=b.parent&&b.parent.isBone?mats[b.parent.userData.i]:null;
      if(p)mats[i].multiplyMatrices(p,b.matrix);else mats[i].copy(b.matrix);off.multiplyMatrices(mats[i],this.boneInverses[i]);off.toArray(this.boneMatrices,i*16);}
      if(this.boneTexture)this.boneTexture.needsUpdate=true;};}
  if(!k.boar){const g1=new THREE.SphereGeometry(.011,6,4),a=g1.attributes.position.array,ix=g1.index.array,n=a.length/3;const P=new Float32Array(a.length*2),I=[];const ep=k.eyePos||[.038,.03,.056];
    for(let s=0;s<2;s++){for(let i=0;i<n;i++){P[(s*n+i)*3]=a[i*3]+(s?ep[0]:-ep[0]);P[(s*n+i)*3+1]=a[i*3+1]+ep[1];P[(s*n+i)*3+2]=a[i*3+2]+ep[2]+.004;}for(let i=0;i<ix.length;i++)I.push(ix[i]+s*n);}
    g1.dispose();const eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.BufferAttribute(P,3));eg.setIndex(I);
    const eyes=new THREE.Mesh(eg,new THREE.MeshBasicMaterial({color:k.eye}));B.head.add(eyes);}
  const root=new THREE.Group();root.add(mesh);root.scale.setScalar(scale||1);
  const rig={root,mesh,B,k,name,geoHi:hi.geo,geoLo:lo.geo,tris:hi.tris,trisLo:lo.tris,lod:0,w:{stand:1,trot:0,gallop:0},phase:Math.random(),v:0,gallop:false,lx:null,lz:null,t0:Math.random()*20,e:null,deadPosed:false};
  root.userData.rig=rig;WOLF_RIGS.add(rig);
  return rig;
}
// ── the wolf's motion: every joint an [x,y,z] rotation; `drop` lowers the hips ──
const WG={
  JOINTS:['hips','spine','neck','head','jaw','tail1','tail2','tail3','shL','elL','wrL','pfL','shR','elR','wrR','pfR','thL','knL','hkL','phL','thR','knR','hkR','phR'],
  // a trot moves the diagonal pairs together; the gallop is a transverse one: hinds, then fores, each pair a beat apart
  TROT:{S:.14,D:.46,LIFT:[.06,.05],DROP:.03,off:{L:[0,.5],R:[.5,0]}},
  GALLOP:{S:.22,D:.3,LIFT:[.09,.07],DROP:.055,off:{L:[.5,0],R:[.6,.1]},on:1.3,back:1.0}
};
WG.TROT.cycle=WG.TROT.S/WG.TROT.D;WG.GALLOP.cycle=WG.GALLOP.S/WG.GALLOP.D;
const wgAng=v=>Math.atan2(v[1],v[0]); // a leg vector [y,z]: a turn of θ about x adds θ to this angle
const wgWrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};
const wgRot=(v,t)=>[v[0]*Math.cos(t)-v[1]*Math.sin(t),v[0]*Math.sin(t)+v[1]*Math.cos(t)];
// Place a leg's paw at (dz, dy) from where it stands at rest, with the lowest segment turned by `fold` from its rest
// angle (a paw curled up in the swing). Two-bone IK in the leg's plane for the upper two segments; returns their three angles.
function wgLeg(L,dz,dy,fold){
  const a=L.a,b=L.b,c=L.c;const rest=[a[0]+b[0]+c[0],a[1]+b[1]+c[1]];
  const cw=wgRot(c,fold);const T=[rest[0]+dy-cw[0],rest[1]+dz-cw[1]];
  const L1=Math.hypot(a[0],a[1]),L2=Math.hypot(b[0],b[1]);const d=Math.max(Math.abs(L1-L2)+1e-4,Math.min(Math.hypot(T[0],T[1]),L1+L2-1e-4));
  const ab=[a[0]+b[0],a[1]+b[1]],sg=(ab[0]*a[1]-ab[1]*a[0])>0?1:-1; // bend the joint the way it bends at rest
  const al=Math.acos(Math.max(-1,Math.min(1,(L1*L1+d*d-L2*L2)/(2*L1*d))));
  const s1=wgAng(T)+sg*al,t1=wgWrap(s1-wgAng(a));const kn=[L1*Math.cos(s1),L1*Math.sin(s1)];
  const t2=wgWrap(wgAng([T[0]-kn[0],T[1]-kn[1]])-wgAng(b)-t1);
  return [t1,t2,wgWrap(fold-t1-t2)];
}
function wgZero(){const p={};WG.JOINTS.forEach(j=>p[j]=[0,0,0]);p.drop=0;return p;}
function wgSetLeg(p,side,fore,r){const n=fore?['sh','el','wr']:['th','kn','hk'];for(let i=0;i<3;i++)p[n[i]+side][0]=r[i];}
function wgStand(t){const p=wgZero();const b=Math.sin(t*1.9);p.drop=.008+.003*b;
  p.neck=[-.1+.02*b,.28*Math.sin(t*.21)*Math.sin(t*.13+1),0];p.head=[.15,0,.05*Math.sin(t*.17)];p.tail1=[-.25,.12*Math.sin(t*.7),0];p.tail2=[-.2,.08*Math.sin(t*.7-.6),0];p.tail3=[-.05,0,0];
  ['L','R'].forEach(s=>{wgSetLeg(p,s,true,wgLeg(WG_L.fore,0,p.drop,0));wgSetLeg(p,s,false,wgLeg(WG_L.hind,0,p.drop,0));});return p;}
// a stride: each paw planted for D of the cycle, sliding back under the body at a steady speed, then swung forward on an eased arc
function wgStride(G,ph,t,gallop){const p=wgZero();const a=Math.PI*2*ph;
  p.drop=(G.DROP+(gallop?.018*Math.sin(a*2+.6):.008*Math.abs(Math.cos(a*2))))*WG_LK;const S=G.S*WG_LK;
  const one=(u,fore)=>{u=((u%1)+1)%1;const h=S/2;if(u<G.D)return {dz:h-S*u/G.D,dy:0,fold:0};const s=(u-G.D)/(1-G.D),e=s*s*(3-2*s);
    return {dz:-h+S*e,dy:G.LIFT[fore?0:1]*WG_LK*Math.sin(Math.PI*s),fold:(fore?1.1:-.4)*Math.sin(Math.PI*Math.min(1,s*1.2))};};
  ['L','R'].forEach(s=>{const o=G.off[s];const f=one(ph+o[0],true),h=one(ph+o[1],false);
    wgSetLeg(p,s,true,wgLeg(WG_L.fore,f.dz,f.dy+p.drop,f.fold));wgSetLeg(p,s,false,wgLeg(WG_L.hind,h.dz,h.dy+p.drop,h.fold));});
  if(gallop){p.neck=[.1+.1*Math.sin(a*2+1.2),0,0];p.head=[-.06-.06*Math.sin(a*2+1.2),0,0];p.tail1=[.25,.05*Math.sin(a),0];p.tail2=[-.05,0,0];p.jaw=[.12,0,0];}
  else{p.neck=[.12,0,0];p.head=[-.04,0,0];p.tail1=[.05+.05*Math.sin(a*2),.14*Math.sin(a),0];p.tail2=[-.08,.06*Math.sin(a-.6),0];}
  return p;}
// the attack: a crouch as it winds up (hindquarters loaded, head low), then a spring: forepaws reach, hind legs drive back straight
function wgAttack(w,s,p){const q=wgZero();
  q.drop=.07*w*(1-s)-.015*s;
  const fz=.13*s,fy=.07*s,hz=-.1*s;
  ['L','R'].forEach(K=>{wgSetLeg(q,K,true,wgLeg(WG_L.fore,fz-.02*w,fy+q.drop,.5*s));wgSetLeg(q,K,false,wgLeg(WG_L.hind,hz+.03*w*(1-s),q.drop,-.25*s));});
  q.neck=[.3*w*(1-s)-.15*s,0,0];q.head=[-.15*w-.1*s,0,0];q.jaw=[.2*w+.6*s,0,0];q.tail1=[-.3*w+.1*s,0,0];q.tail2=[-.1,0,0];
  const k=Math.min(1,Math.max(w,s));WG.JOINTS.forEach(j=>{for(let i=0;i<3;i++)p[j][i]+=(q[j][i]-p[j][i])*k;});p.drop+=(q.drop-p.drop)*k;return p;}
// a body on its side: the legs slack, the head and tail down, the jaw a little open
function wgDead(){const p=wgZero();p.drop=0;p.neck=[.35,0,0];p.head=[.2,0,0];p.jaw=[.25,0,0];p.tail1=[-.6,0,0];p.tail2=[-.2,0,0];
  ['L','R'].forEach((K,i)=>{p['sh'+K]=[-.35-.15*i,0,0];p['el'+K]=[.3,0,0];p['wr'+K]=[.4,0,0];p['th'+K]=[.4+.2*i,0,0];p['kn'+K]=[-.3,0,0];p['hk'+K]=[.35,0,0];});return p;}
function wgApply(rig,P){const B=rig.B;WG.JOINTS.forEach(j=>{const r=P[j];B[j].rotation.set(r[0],r[1],r[2]);});B.hips.position.y=wolfHipY(rig.k)-P.drop;if(rig.k.horse){B.tail1.rotation.x=-.3;B.tail2.rotation.x=-.05;} /* S262 — a horse's tail hangs, swinging only side to side */if(rig.k.neck){B.neck.rotation.x+=rig.k.neck;B.head.rotation.x-=rig.k.neck*.6;}
  if(rig.hunch){B.spine.rotation.x+=rig.hunch[0];B.neck.rotation.x+=rig.hunch[1];B.head.rotation.x+=rig.hunch[2];} // S211 — the Faolchú's hunch
  // a dragon's wings (S177): folded back along its flanks at rest, beating while it is roused (rig.wing 0..1 blends them)
  if(B.wingL){const w=rig.wing||0,f=rig.flap||0;const z=-.3*(1-w)+(.15+.5*Math.sin(f))*w,y=1.35*(1-w);B.wingL.rotation.set(0,y,z);B.wingR.rotation.set(0,-y,-z);}}
function wgCycle(w){const a=w.trot||0,b=w.gallop||0;return a+b>.001?(a*WG.TROT.cycle+b*WG.GALLOP.cycle)/(a+b):WG.TROT.cycle;}
// every wolf (and spider, tickSpider) in the active scene, each frame: the stride is driven by how far the creature moved (its logical
// position, so the lunge's forward lurch does not step the feet), trot below WG.GALLOP.on body-lengths a second
function tickCreatures(dt,now){
  for(const rig of WOLF_RIGS){
    const g=rig.root.parent;
    if(!g||!g.parent){WOLF_RIGS.delete(rig);try{rig.mesh.material.dispose();}catch(e){}continue;} // the geometry is the kind's, shared
    if(g.parent!==scene||!g.visible)continue;
    const e=rig.e;
    if(e&&e.dead){if(!rig.deadPosed){rig.deadPosed=true;rig.wing=.3;rig.flap=-1.2;if(rig.spider)sgApply(rig,sgDead(rig.k));else wgApply(rig,wgDead());}continue;}
    if(rig.geoLo){const cd=Math.hypot(CAM.position.x-g.position.x,CAM.position.z-g.position.z);
      const lod=rig.lod?(cd>WOLF_LOD.near?1:0):(cd>WOLF_LOD.far?1:0);
      if(lod!==rig.lod){rig.lod=lod;rig.mesh.geometry=lod?rig.geoLo:rig.geoHi;}}
    if(rig.spider){tickSpider(rig,g,e,dt,now);continue;}
    const x=e?e.x:g.position.x,z=e?e.z:g.position.z;
    let d=rig.lx==null?0:Math.hypot(x-rig.lx,z-rig.lz);rig.lx=x;rig.lz=z;if(d>1.5)d=0;
    const s=rig.root.scale.x*(g.scale.x||1);
    // S213 — turning on the spot steps round: the heading's change counts as ground covered by the paws, a quarter of a
    // body-length out from the middle, so a wolf that swings to face you treads round instead of pivoting on planted feet
    {const q=g.quaternion,yw=Math.atan2(2*(q.x*q.z+q.w*q.y),1-2*(q.x*q.x+q.y*q.y));if(rig.lyaw!=null){let dy=yw-rig.lyaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));if(Math.abs(dy)<1.2)d+=Math.abs(dy)*.25*s;}rig.lyaw=yw;}
    const spd=dt>0?d/dt:0;
    rig.v+=(spd-rig.v)*(1-Math.exp(-dt/.15));
    WG_LK=rig.k.legK||1;WG_L=wolfLegs(rig.k); // S262 — this kind's legs for the poses below (reset after the loop)
    if(!rig.gallop&&rig.v/(s*WG_LK)>WG.GALLOP.on)rig.gallop=true;else if(rig.gallop&&rig.v/(s*WG_LK)<WG.GALLOP.back)rig.gallop=false;
    rig.phase=(rig.phase+d/(wgCycle(rig.w)*s*WG_LK))%1;
    const mode=rig.v>.06?(rig.gallop?'gallop':'trot'):'stand';const k=1-Math.exp(-dt/.12);
    for(const m in rig.w)rig.w[m]+=((m===mode?1:0)-rig.w[m])*k;
    const t=now/1000+rig.t0;const out=wgZero();let tot=0;
    for(const m in rig.w){const wm=rig.w[m];if(wm<.001)continue;tot+=wm;const p=m==='stand'?wgStand(t):wgStride(m==='gallop'?WG.GALLOP:WG.TROT,rig.phase,t,m==='gallop');
      WG.JOINTS.forEach(j=>{const a=out[j],b=p[j];a[0]+=b[0]*wm;a[1]+=b[1]*wm;a[2]+=b[2]*wm;});out.drop+=p.drop*wm;}
    if(tot>0){WG.JOINTS.forEach(j=>{const a=out[j];a[0]/=tot;a[1]/=tot;a[2]/=tot;});out.drop/=tot;}
    const w=e?(e._wind||0):0,st=e&&e._lunge!=null?Math.sin(Math.max(0,e._lunge)/.3*Math.PI):0;
    if(w>0||st>0)wgAttack(w,st,out);
    if(rig.B.wingL){const roused=e&&(e.alert||e._agg)?1:0;rig.wing=(rig.wing||0)+(roused-(rig.wing||0))*(1-Math.exp(-dt/.5));rig.flap=((rig.flap||0)+dt*6.5)%(Math.PI*2);}
    wgApply(rig,out);
  }
  WG_L=WOLF_LEGS;WG_LK=1;
}

// ── The spider on the shape kit (backlog H.4, Session 169): the second family, built the way the wolf is ──
// A cephalothorax and a hairy abdomen, eight legs of three bones each (a hip that swings the leg round, a femur that
// rises from it, a tibia that comes down to the ground: the knee stands up above the body, as a spider's does), fangs,
// palps and a cluster of eyes. The legs are placed by IK: the hip turns the leg towards its foot, then two-bone IK in
// that plane with the knee up. It walks on the spider's alternating tetrapods (L1 R2 L3 R4, then the other four), each
// foot planted while it carries the body. One bake per kind, shared; each spider its own skeleton and material.
const SPIDER_KINDS={
  'Spider':{coat:0x2a2230,band:0x6a4a3a,belly:0x3a3040,mark:0xb09060,eye:0xff2200},
  // S224 — the Sand Scorpion (Michael's answer B on Session 214, as shown): the spider's legs and gait in sand, a long flat
  // plated abdomen, two pincers on the fang bones, and a jointed tail on a bone of its own curling over the back to a sting
  'Sand Scorpion':{coat:0xb89a58,band:0x8a6e38,belly:0xd8c890,mark:0x6a5028,eye:0x202020,scorpion:true},
  // S236 — the Bog Crawler, a giant water bug (Michael's answer B on Session 225): flat and oval, mud-brown with pale
  // flecks, wing covers crossing at the tail, a short beak; the raptorial forelegs held up on the fang bones (a femur and
  // a hooked tibia that closes on it), and it walks on the other four legs in diagonal pairs, the hind pair paddles
  'Bog Crawler':{coat:0x4a4230,band:0x2a2418,belly:0x3a3424,mark:0x7a6a48,eye:0x7a8a38,bug:true,H:.12,
    legs:[[.2,.04,.06,.24,.25,.36],[.2,-.22,-.76,.28,.36,.5]]}
};
// the legs: hip position on the cephalothorax (x, z), the rest angle the leg points out at (0 = straight out to the side,
// + forwards), and the femur and tibia lengths
const SPIDER_LEGS=[[.075,.085,.75,.22,.3],[.085,.03,.28,.24,.3],[.085,-.025,-.2,.23,.29],[.075,-.08,-.62,.25,.32]];
const SPIDER_H=.2,SPIDER_REACH=.36;
// S236 — each kind may carry its own legs ([x, z, rest angle, femur, tibia, reach]) and body height; the spider's by default
const spLegs=k=>(k&&k.legs)||SPIDER_LEGS,spH=k=>(k&&k.H)||SPIDER_H;
const SPIDER_GEO=new Map();
// S236 — the water bug's foreleg, from the fang bone (+x side; mirrored): the knee raised forward, the tibia folding back
// and down to a hook; axis() is the fold's hinge, across the femur and the tibia
const BUG_ARM={knee:[.14,.2,.12],tip:[-.08,-.12,.16],claw:[-.12,-.16,.12],
  axis:s=>new THREE.Vector3(s*.14,.2,.12).cross(new THREE.Vector3(-s*.08,-.12,.16)).normalize()};
function spiderSkeleton(k){
  const bones=[],B={};
  const bone=(name,parent,x,y,z)=>{const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);if(parent)parent.add(b);b.userData.i=bones.length;bones.push(b);B[name]=b;return b;};
  const body=bone('body',null,0,spH(k),0);
  if(k.bug){bone('abd',body,0,.04,-.05);bone('fangL',body,.1,0,.34);bone('fangR',body,-.1,0,.34);}
  else{bone('abd',body,0,.03,-.1);bone('fangL',body,.03,-.02,.15);bone('fangR',body,-.03,-.02,.15);}
  // legs 0–3 on the spider's left (+x), 4–7 on its right; each hip's rest yaw points the leg out (and forward or back)
  spLegs(k).forEach(([x,z,ang,lf,lt],i)=>{for(const s of [1,-1]){const n=(s>0?'L':'R')+i;
    const hip=bone('hip'+n,body,s*x,0,z);hip.rotation.y=s>0?-ang:Math.PI+ang;
    const fem=bone('fem'+n,hip,0,0,0);bone('tib'+n,fem,lf,0,0);}});
  if(k.scorpion)bone('tail',B.abd,0,.06,-.33); // S224 — appended last, so the spider's own bones keep their order
  // S236 — a water bug's foreleg tibia: a bone at the knee that jack-knifes shut on the femur (the fang bone)
  if(k.bug)for(const [n,s] of [['L',1],['R',-1]])bone('hook'+n,B['fang'+n],s*BUG_ARM.knee[0],BUG_ARM.knee[1],BUG_ARM.knee[2]);
  return {bones,B,body};
}
function spiderBake(k,q){SK.q=q;try{return spiderBakeQ(k,q);}finally{SK.q=1;}}
function spiderBakeQ(k,q){
  const {bones,B,body}=spiderSkeleton(k);const parts=[];
  const part=(geo,col,b,x,y,z,fur)=>{const o=new THREE.Object3D();o.position.set(x||0,y||0,z||0);o.userData.geo=geo;o.userData.col=col;o.userData.fur=fur;b.add(o);parts.push(o);return o;};
  const C=x=>new THREE.Color(x);const coat=C(k.coat),band=C(k.band),dark=C(0x0c080c);
  // a leg segment along +x from its bone: a hairy tapered limb (SK.limb runs down -y; turned to run out along +x)
  const seg=(b,len,r0,r1,col,hair)=>{let g=SK.limb(len,r0,r1);if(hair)g=SK.bumpy(g,hair,23,len*40);const o=part(g,col,b,0,0,0,true);o.rotation.z=Math.PI/2;return o;};
  // the cephalothorax: a low shield, the head end raised a little; the abdomen a hairy egg behind it
  const bug=!!k.bug;
  if(!bug){part(SK.lathe([[0,-.13],[.07,-.12],[.11,-.07],[.12,0],[.1,.07],[.07,.12],[0,.14]],14).rotateX(Math.PI/2),coat,body,0,0,0,true).scale.set(1,.55,1);
  part(SK.ball(.07,12,8),coat,body,0,.035,.06,true).scale.set(1,.7,1.1);}
  const AB=[.152,.12,.192],AC=[0,.035,-.15]; // the abdomen's semi-axes and centre on its bone
  const scor=!!k.scorpion,sting=C(0x3a2410);
  // a rod between two points on a bone: radius r0 at a, r1 at c
  const rod=(b,a,c,r0,r1,col,fur)=>{const d=new THREE.Vector3(c[0]-a[0],c[1]-a[1],c[2]-a[2]),L=d.length();const g2=SK.cyl(r1,r0,L,7);g2.translate(0,L/2,0);const o=part(g2,col,b,a[0],a[1],a[2],fur);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;};
  if(scor){part(SK.ball(.16,14,10),coat,B.abd,AC[0],AC[1]-.02,AC[2]-.02,true).scale.set(AB[0]/.16,AB[1]*.65/.16,AB[2]*1.12/.16);
    for(let i=0;i<5;i++)part(SK.ball(.1,12,6),band,B.abd,0,AC[1]+.052-Math.abs(i-2)*.006,-.03-i*.065,true).scale.set(1.35-Math.abs(i-2)*.12,.2,.34);}
  else if(!bug)part(SK.bumpy(SK.ball(.16,14,10),.011,17,2),coat,B.abd,AC[0],AC[1],AC[2],true).scale.set(AB[0]/.16,AB[1]/.16,AB[2]/.16);
  // S236 — the water bug (the prototype's shapes, Session 225; its y less the body's height): a flat oval body narrowing
  // to the head, the two wing covers crossing at the tail on the abdomen bone, the pronotum, the head and beak, pale
  // flecks and moss on the back (the eyes are the glow mesh, buildSpider); the forelegs on the fang bones and hook bones
  if(bug){const H=spH(k),mem=C(k.belly),pale=C(k.mark),moss=C(0x4a6a2a);
    const bd=SK.ball(.3,24,14),bp=bd.attributes.position;for(let i=0;i<bp.count;i++){const zz=bp.getZ(i);bp.setX(i,bp.getX(i)*(1-.18*Math.max(0,zz/.3)));}bd.computeVertexNormals();
    part(bd,coat,body,0,.16-H,-.08,true).scale.set(.95,.32,1.45);
    for(const sd of [1,-1]){const o=part(SK.ball(.2,14,8),mem,B.abd,sd*.09,.23-H-.04,-.2+.05,true);o.rotation.y=sd*.12;o.scale.set(.85,.12,1.6);}
    part(SK.ball(.18,14,8),coat,body,0,.2-H,.2,true).scale.set(1.15,.3,.6);
    part(SK.ball(.09,12,8),coat,body,0,.17-H,.34,true).scale.set(1,.6,.9);
    rod(body,[0,.14-H,.4],[0,.08-H,.5],.03,.006,dark);
    for(let i=0;i<14;i++){const r=i<7;part(SK.ball(.03+(i%3)*.01,6,4),pale,r?B.abd:body,Math.sin(i*2.1)*.2,.245-H-(r?.04:0),-.35+i*.05+(r?.05:0)).scale.set(1.4,.15,1);}
    for(let i=0;i<6;i++)part(SK.bumpy(SK.ball(.035+(i%3)*.01,7,5),.01,9,i),moss,B.abd,Math.sin(i*2.7)*.12,.26-H-.04,-.3+Math.cos(i*1.3)*.2+.05,true);
    for(const [n,s] of [['L',1],['R',-1]]){const f=B['fang'+n],h=B['hook'+n],A=BUG_ARM,kn=[s*A.knee[0],A.knee[1],A.knee[2]];
      part(SK.ball(.042,8,6),coat,f,0,0,0,true);rod(f,[0,0,0],kn,.04,.034,coat,true);part(SK.ball(.03,8,6),dark,h,0,0,0);
      rod(h,[0,0,0],[s*A.tip[0],A.tip[1],A.tip[2]],.022,.012,coat,true);rod(h,[s*A.tip[0],A.tip[1],A.tip[2]],[s*A.claw[0],A.claw[1],A.claw[2]],.01,.003,dark);}}
  // the abdomen's markings, each set on its surface: a pale chevron of paired spots down the back
  const onAbd=(x,z)=>AC[1]+AB[1]*Math.sqrt(Math.max(0,1-(x/AB[0])**2-((z-AC[2])/AB[2])**2));
  if(!scor&&!bug)for(let i=0;i<4;i++)for(const s of [1,-1]){const x=s*(.022+i*.011),z=-.08-i*.045;const o=part(SK.ball(.016,6,4),C(k.mark),B.abd,x,onAbd(x,z)-.003,z);o.scale.set(1.8,.45,1);o.rotation.y=s*.6;}
  if(!scor&&!bug)part(SK.ball(.02,6,4),C(k.mark),B.abd,0,onAbd(0,-.03)-.004,-.03).scale.set(1,.45,1.4);
  // a scorpion's pincers on the fang bones (the fangs' spread opens them): an arm out and forward, a swollen claw, two fingers
  if(scor)for(const [n,s] of [['fangL',1],['fangR',-1]]){const f=B[n],K=1.7,P=v=>v.map(x=>x*K);const a0=[s*.01,0,0],el=[s*.11,.03,.09],wr=[s*.085,.04,.2];
    part(SK.ball(.026*K,8,6),coat,f,...P(a0),true);rod(f,P(a0),P(el),.024*K,.02*K,coat,true);part(SK.ball(.022*K,8,6),band,f,...P(el),true);rod(f,P(el),P(wr),.022*K,.026*K,coat,true);
    part(SK.ball(.045*K,12,8),coat,f,...P([s*.08,.04,.25]),true).scale.set(.85,.62,1.3);
    rod(f,P([s*.095,.04,.28]),P([s*.07,.04,.36]),.016*K,.004,sting);rod(f,P([s*.06,.035,.28]),P([s*.058,.035,.35]),.013*K,.004,sting);}
  // the tail: six segments on their own bone, arching up from the abdomen's end and over the back, a bulb and a sting
  if(scor){const T=[[0,0,0],[0,.08,-.05],[0,.18,-.06],[0,.27,-.01],[0,.33,.07],[0,.35,.16],[0,.33,.24]];
    for(let i=0;i<T.length;i++){const r=.046-i*.0025;part(SK.ball(r,10,8),i%2?band:coat,B.tail,T[i][0],T[i][1],T[i][2],true).scale.set(1,.95,1.1);if(i)rod(B.tail,T[i-1],T[i],r+.002,r,coat,true);}
    part(SK.ball(.04,10,8),C(k.mark),B.tail,0,.3,.29,true).scale.set(1,.9,1.25);rod(B.tail,[0,.29,.31],[0,.22,.35],.014,.002,sting);}
  // fangs: a stout chelicera each with a curved dark fang; palps in front
  for(const [n,s] of [['fangL',1],['fangR',-1]]){if(scor||bug)break;const f=B[n];part(SK.limb(.07,.024,.017),coat,f,0,0,0,true).rotation.x=-.25;
    const t=part(SK.cone(.01,.045,5),dark,f,0,-.075,.02);t.rotation.x=Math.PI+.6;
    const p=part(SK.limb(.09,.012,.009),band,body,s*.05,-.01,.15,true);p.rotation.set(-.9,0,-s*.5);}
  // eyes: two large at the front, six small around them (the glow is its own unlit mesh on the body)
  if(q>=1&&!bug)for(const [x,y,z,r] of [[.018,.07,.12,.014],[-.018,.07,.12,.014],[.04,.068,.105,.009],[-.04,.068,.105,.009],[.03,.08,.09,.008],[-.03,.08,.09,.008],[.012,.082,.1,.007],[-.012,.082,.1,.007]])part(SK.ball(r,6,4),dark,body,x,y,z);
  // the legs: femur and tibia, hairy, a pale band at each joint, dark at the tip
  if(!bug)SPIDER_LEGS.forEach(([x,z,ang,lf,lt],i)=>{for(const s of [1,-1]){const n=(s>0?'L':'R')+i;
    part(SK.ball(.028,7,5),band,B['hip'+n],0,0,0,true);
    seg(B['fem'+n],lf,.024,.018,coat,.004);
    part(SK.ball(.021,7,5),band,B['tib'+n],0,0,0,true);
    seg(B['tib'+n],lt*.62,.018,.013,coat,.003).position.x=0;
    const ta=seg(B['tib'+n],lt*.4,.012,.007,band,0);ta.position.x=lt*.6;
    part(SK.ball(.009,5,4),dark,B['tib'+n],lt,0,0);}});
  // S236 — the water bug's walking legs: smooth, a dark knee, the hind pair's tibia a flattened paddle fringed pale
  if(bug)spLegs(k).forEach(([x,z,ang,lf,lt],i)=>{for(const s of [1,-1]){const n=(s>0?'L':'R')+i,r=i?.026:.024;
    part(SK.ball(r*1.1,7,5),coat,B['hip'+n],0,0,0,true);seg(B['fem'+n],lf,r,r*.8,coat,0);
    part(SK.ball(r*.95,7,5),band,B['tib'+n],0,0,0);seg(B['tib'+n],lt,r*.8,r*.35,coat,0).position.x=0;
    if(i)part(SK.ball(.06,8,6),C(k.mark),B['tib'+n],lt*.62,0,0).scale.set(1.7,.9,.22);}});
  // bake, the fur counter-shaded: the back a shade darker, the underside lighter, the leg joints banded
  const pos=[],nor=[],col=[],idx=[],si=[],sw=[],PR=[];const m=new THREE.Matrix4(),nm=new THREE.Matrix3(),v=new THREE.Vector3(),nn=new THREE.Vector3();let base=0;
  const bel=C(k.belly),tmp=new THREE.Color(),sad=C(k.coat).multiplyScalar(.7);
  body.updateMatrixWorld(true);
  for(const o of parts){o.updateMatrix();m.multiplyMatrices(o.parent.matrixWorld,o.matrix);nm.getNormalMatrix(m);const geo=o.userData.geo,c=o.userData.col,bi=o.parent.userData.i;const pa=geo.attributes.position,na=geo.attributes.normal;
    for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(m);pos.push(v.x,v.y,v.z);nn.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();nor.push(nn.x,nn.y,nn.z);
      tmp.copy(c);if(o.userData.fur){if(nn.y>0)tmp.lerp(sad,Math.min(1,nn.y)*.5);else tmp.lerp(bel,Math.min(1,-nn.y*1.3)*.6);}
      col.push(tmp.r,tmp.g,tmp.b);si.push(bi,0,0,0);sw.push(1,0,0,0);}
    if(geo.index){const ia=geo.index;for(let i=0;i<ia.count;i++)idx.push(ia.getX(i)+base);}else for(let i=0;i<pa.count;i++)idx.push(i+base);
    PR.push([base,pa.count]);base+=pa.count;geo.dispose();}
  personAO(pos,nor,col,PR); // S270 — as the wolf family's
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));geo.setIndex(idx);
  geo.computeBoundingSphere();geo.boundingSphere.radius+=.2;
  return {geo,tris:idx.length/3};
}
function spiderGeo(name,q){const key=name+'|'+q;let r=SPIDER_GEO.get(key);if(!r){r=spiderBake(SPIDER_KINDS[name],q);SPIDER_GEO.set(key,r);}return r;}
function buildSpider(name,scale){
  const k=SPIDER_KINDS[name];const hi=spiderGeo(name,1),lo=spiderGeo(name,WOLF_LOD.q);
  const {bones,B,body}=spiderSkeleton(k);
  const mat=WOLF_MAT.clone();
  const mesh=new THREE.SkinnedMesh(hi.geo,mat);mesh.add(body);mesh.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));
  mesh.castShadow=true;mesh.receiveShadow=false;
  // bone matrices local to the mesh, as buildPerson's and buildWolf's
  mesh.bindMode='detached';mesh.bindMatrix.identity();mesh.bindMatrixInverse.identity();
  {const sk=mesh.skeleton,mats=bones.map(()=>new THREE.Matrix4()),off=new THREE.Matrix4();
    sk.update=function(){for(let i=0;i<bones.length;i++){const b=bones[i];b.updateMatrix();const p=b.parent&&b.parent.isBone?mats[b.parent.userData.i]:null;
      if(p)mats[i].multiplyMatrices(p,b.matrix);else mats[i].copy(b.matrix);off.multiplyMatrices(mats[i],this.boneInverses[i]);off.toArray(this.boneMatrices,i*16);}
      if(this.boneTexture)this.boneTexture.needsUpdate=true;};}
  // the eyes shine: the two big ones and the six small, one unlit mesh on the body
  {const P=[],I=[];const pts=[[.018,.07,.123,.013],[-.018,.07,.123,.013],[.04,.068,.108,.008],[-.04,.068,.108,.008],[.03,.08,.093,.007],[-.03,.08,.093,.007],[.012,.082,.103,.006],[-.012,.082,.103,.006]];
    if(k.bug)pts.splice(0,8,[.085,.08,.375,.036],[-.085,.08,.375,.036]);
    for(const [x,y,z,r] of pts){const g1=new THREE.SphereGeometry(r,5,4),a=g1.attributes.position.array,ix=g1.index.array,n0=P.length/3;for(let i=0;i<a.length;i+=3)P.push(a[i]+x,a[i+1]+y,a[i+2]+z);for(let i=0;i<ix.length;i++)I.push(ix[i]+n0);g1.dispose();}
    const eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));eg.setIndex(I);body.add(new THREE.Mesh(eg,new THREE.MeshBasicMaterial({color:k.eye})));}
  const root=new THREE.Group();root.add(mesh);root.scale.setScalar(scale||1);
  const rig={spider:true,hookAx:{},root,mesh,B,k,name,geoHi:hi.geo,geoLo:lo.geo,tris:hi.tris,trisLo:lo.tris,lod:0,w:{stand:1,walk:0,run:0},run:false,phase:Math.random(),v:0,lx:null,lz:null,t0:Math.random()*20,e:null,deadPosed:false};
  root.userData.rig=rig;WOLF_RIGS.add(rig);
  return rig;
}
// ── the spider's motion ──
// SG.D: each foot on the ground for this share of the stride; the two tetrapods half a stride apart
// SG.RUN: the chase, a longer stride with the feet down for less of it, blended in past RUN.on body-lengths a second
const SG={S:.16,D:.55,LIFT:.07,RUN:{S:.3,D:.4,LIFT:.1,on:1.6,off:1.2},
  group:i=>((i>>1)+(i&1))%2 // leg i (0–7: L0 R0 L1 R1 …): L0 R1 L2 R3 in one tetrapod, the rest in the other
};
SG.cycle=SG.S/SG.D;SG.RUN.cycle=SG.RUN.S/SG.RUN.D;
const sgCycle=w=>{const a=w.walk||0,b=w.run||0;return a+b>.001?(a*SG.cycle+b*SG.RUN.cycle)/(a+b):SG.cycle;};
// the rest foot of each leg in the body's frame, on the ground: out along its rest yaw by SPIDER_REACH
// (S236: per kind, from its legs; a leg's own reach if it gives one. A water bug's four walking feet L0 R0 L1 R1 fall into
// SG.group's diagonal pairs, L0 R1 and R0 L1)
const SP_FEET=new Map();
function spiderFeet(k){const legs=spLegs(k);let out=SP_FEET.get(legs);if(out)return out;out=[];
  legs.forEach(([x,z,ang,lf,lt,rc],i)=>{const R=rc||SPIDER_REACH;for(const s of [1,-1]){const yaw=s>0?-ang:Math.PI+ang;out.push({s,i,n:(s>0?'L':'R')+i,hx:s*x,hz:z,fx:s*x+Math.cos(yaw)*R,fz:z-Math.sin(yaw)*R});}});
  SP_FEET.set(legs,out);return out;}
const SPIDER_FEET=spiderFeet(null);
// hip yaw, femur and tibia angles that put leg L's foot at (fx, fy, fz) in the body's frame, with the knee up
function sgLeg(L,fx,fy,fz,lf,lt){const dx=fx-L.hx,dz=fz-L.hz,dy=fy;const yaw=Math.atan2(-dz,dx);const r=Math.hypot(dx,dz);
  const d=Math.max(Math.abs(lf-lt)+1e-4,Math.min(Math.hypot(r,dy),lf+lt-1e-4));const ph=Math.atan2(dy,r);
  const al=Math.acos(Math.max(-1,Math.min(1,(lf*lf+d*d-lt*lt)/(2*lf*d))));const t1=ph+al;const kx=lf*Math.cos(t1),ky=lf*Math.sin(t1);
  const t2=Math.atan2(dy-ky,r-kx)-t1;return [yaw,t1,t2];}
// a pose: per leg [yaw,t1,t2], the body's drop, the fangs' spread, the abdomen's tilt; feet given as offsets from rest
function sgPose(feet,drop,fang,abd,K){const LG=spLegs(K),H=spH(K);const legs=spiderFeet(K).map((L,k)=>{const f=feet[k];const lg=LG[L.i];return sgLeg(L,L.fx+f[0],-H+drop+f[1],L.fz+f[2],lg[3],lg[4]);});return {legs,drop,fang,abd};}
function sgStand(t,K){const b=Math.sin(t*1.3);return sgPose(spiderFeet(K).map(()=>[0,0,0]),.004*b,.05+.05*Math.max(0,Math.sin(t*.7)),.04*b,K);}
function sgStride(ph,t,G,K){G=G||SG;const h=G.S/2;const a=Math.PI*2*ph;
  const feet=spiderFeet(K).map((L,k)=>{const u=((ph+.5*SG.group(k))%1+1)%1;if(u<G.D)return [0,0,h-G.S*u/G.D];const s=(u-G.D)/(1-G.D),e=s*s*(3-2*s);return [0,G.LIFT*Math.sin(Math.PI*s),-h+G.S*e];});
  return sgPose(feet,(G===SG?.012:.03)+.006*Math.cos(a*2),.05,.03*Math.sin(a*2),K);}
// the attack: winding up, it rears, the front legs rising off the ground and the fangs spreading; the strike drops it forward
function sgAttack(w,s,P,K){
  // S236 — a water bug keeps its feet and rises a little on them, the forelegs opening wide, then lunges and snaps them shut
  if(K&&K.bug){const q=sgPose(spiderFeet(K).map(()=>[0,0,-.03*w]),-.03*w*(1-s)+.03*s,.1+1.1*w*(1-s)-.5*s,-.12*w,K);const k=Math.min(1,Math.max(w,s));
    P.legs=P.legs.map((l,i)=>l.map((x,j)=>x+(q.legs[i][j]-x)*k));P.drop+=(q.drop-P.drop)*k;P.fang+=(q.fang-P.fang)*k;P.abd+=(q.abd-P.abd)*k;return P;}
  const feet=SPIDER_FEET.map(L=>L.i===0?[0,.2*w*(1-s)+.02*s,.06*w+.12*s]:L.i===1?[0,.05*w*(1-s),.03*s]:[0,0,-.03*w]);
  const q=sgPose(feet,-.035*w*(1-s)+.03*s,.1+.5*w*(1-s)+.2*s,-.15*w);const k=Math.min(1,Math.max(w,s));
  P.legs=P.legs.map((l,i)=>l.map((x,j)=>x+(q.legs[i][j]-x)*k));P.drop+=(q.drop-P.drop)*k;P.fang+=(q.fang-P.fang)*k;P.abd+=(q.abd-P.abd)*k;return P;}
// dead: the legs curl in under the body
function sgDead(K){const LG=spLegs(K);return {legs:spiderFeet(K).map(L=>[L.s>0?-LG[L.i][2]:Math.PI+LG[L.i][2],-.5,-2.2]),drop:K&&K.bug?.06:.1,fang:K&&K.bug?-.5:.2,abd:-.1};}
function sgApply(rig,P){const B=rig.B,K=rig.k;spiderFeet(K).forEach((L,k)=>{const [y,t1,t2]=P.legs[k];B['hip'+L.n].rotation.y=y;B['fem'+L.n].rotation.z=t1;B['tib'+L.n].rotation.z=t2;});
  B.body.position.y=spH(K)-P.drop;B.abd.rotation.x=P.abd;
  // S236 — a water bug's fang is its foreleg: open raises the femur and swings the hooked tibia out; shut folds it in
  if(B.hookL){const o=P.fang;for(const [n,s] of [['L',1],['R',-1]]){B['fang'+n].rotation.set(-.5*o,0,0);B['hook'+n].quaternion.setFromAxisAngle(rig.hookAx[n]||(rig.hookAx[n]=BUG_ARM.axis(s)),-1.2*o);}}
  else{B.fangL.rotation.set(-P.fang*.4,0,P.fang);B.fangR.rotation.set(-P.fang*.4,0,-P.fang);}
  if(B.tail)B.tail.rotation.x=P.tail||0;}
function tickSpider(rig,g,e,dt,now){
  const x=e?e.x:g.position.x,z=e?e.z:g.position.z;
  let d=rig.lx==null?0:Math.hypot(x-rig.lx,z-rig.lz);rig.lx=x;rig.lz=z;if(d>1.5)d=0;
  const s=rig.root.scale.x*(g.scale.x||1),spd=dt>0?d/dt:0;rig.v+=(spd-rig.v)*(1-Math.exp(-dt/.12));
  if(!rig.run&&rig.v/s>SG.RUN.on)rig.run=true;else if(rig.run&&rig.v/s<SG.RUN.off)rig.run=false;
  rig.phase=(rig.phase+d/(sgCycle(rig.w)*s))%1;
  const mode=rig.v>.05?(rig.run?'run':'walk'):'stand';const k=1-Math.exp(-dt/.1);for(const m in rig.w)rig.w[m]+=((m===mode?1:0)-rig.w[m])*k;
  const t=now/1000+rig.t0;let P=null,tot=0;
  // blend the motions by weight; a hip's yaw is taken the short way round
  for(const m in rig.w){const wm=rig.w[m];if(wm<.001)continue;const q=m==='stand'?sgStand(t,rig.k):sgStride(rig.phase,t,m==='run'?SG.RUN:SG,rig.k);tot+=wm;
    if(!P){P={legs:q.legs.map(l=>l.map(x=>x*wm)),drop:q.drop*wm,fang:q.fang*wm,abd:q.abd*wm,ref:q.legs};continue;}
    q.legs.forEach((l,i)=>l.forEach((x,j)=>{let y=x;if(j===0){const r=P.ref[i][0];while(y-r>Math.PI)y-=Math.PI*2;while(r-y>Math.PI)y+=Math.PI*2;}P.legs[i][j]+=y*wm;}));P.drop+=q.drop*wm;P.fang+=q.fang*wm;P.abd+=q.abd*wm;}
  P.legs=P.legs.map(l=>l.map(x=>x/tot));P.drop/=tot;P.fang/=tot;P.abd/=tot;
  const w=e?(e._wind||0):0,st=e&&e._lunge!=null?Math.sin(Math.max(0,e._lunge)/.3*Math.PI):0;
  if(w>0||st>0)sgAttack(w,st,P,rig.k);
  if(rig.B.tail)P.tail=.06*Math.sin(t*1.7)-.35*w*(1-st)+.9*st; // S224 — a scorpion's tail sways, cocks back through the wind-up and strikes over its head
  sgApply(rig,P);
}
