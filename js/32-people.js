
// ══════════════════════════════════════════════════════════════════════════
// ── NPC Mesh Builder — role-differentiated visuals ────────────────────────
// Builds a THREE.Group for an NPC with visual traits based on their role.
// Supports: guard, elder, farmer, kid, merchant, scholar, priest, town crier,
//           and a generic fallback for anything else.
// ═══ PEOPLE (v80 S153) — the shape kit and the townsperson ═══════════════════════════════
// Every person is one skinned mesh (one draw call, vertex colours) on seventeen bones, shaped by a
// genome seeded from the NPC's name and place, so the same person looks the same on every visit and
// behind the counter as in the street. The parts are lathed and rounded rather than boxed. The walk
// is a gait cycle with planted feet, driven by how far the figure actually moved (tickPeople, in the
// main loop so it runs indoors too). Roles dress over the top: a guard's helm and spear, a smith's
// apron and hammer. Prototyped at claude.ai/artifact/WmgDqFPQ1dyBBKX3u8P6Ma (backlog H).
const PEOPLE_RIGS=new Set();
const PEOPLE_GENOMES=new Map();
const PEOPLE_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.86,metalness:0,side:THREE.DoubleSide,skinning:true});
// ── the shape kit: geometries any builder can draw from ──
// SK.q scales the segment counts: 1 for a person up close, lower for the distant copy (buildPerson's lod)
const SK={
  q:1,seg:(n,lo)=>SK.q>=1?n:Math.max(lo,Math.round(n*SK.q)),
  v2:(x,y)=>new THREE.Vector2(x,y),
  lathe(pts,seg){return new THREE.LatheGeometry(pts.map(q=>SK.v2(Math.max(1e-4,q[0]),q[1])),SK.seg(seg||12,8));},
  // a tapered limb: radius r0 at the joint, r1 at the far end, rounded at both
  limb(len,r0,r1){const p=[];for(let i=0;i<=5;i++){const a=i/5*Math.PI/2;p.push(SK.v2(Math.max(1e-4,r1*Math.sin(a)),-len-r1*Math.cos(a)));}
    for(let i=1;i<=5;i++){const a=i/5*Math.PI/2;p.push(SK.v2(Math.max(1e-4,r0*Math.cos(a)),r0*Math.sin(a)));}return new THREE.LatheGeometry(p,SK.seg(8,5));},
  torus(r,t,rs,ts,arc){return new THREE.TorusGeometry(r,t,SK.seg(rs||8,4),SK.seg(ts||6,6),arc);},
  cyl(r0,r1,h,rs,hs,open,a0,a1){return new THREE.CylinderGeometry(r0,r1,h,SK.seg(rs||8,4),hs||1,open,a0,a1);},
  cone(r,h,rs,hs,open){return new THREE.ConeGeometry(r,h,SK.seg(rs||8,4),hs||1,open);},
  ball(r,w,h,a0,a1,b0,b1){return new THREE.SphereGeometry(r,SK.seg(w||10,5),SK.seg(h||7,4),a0||0,a1==null?Math.PI*2:a1,b0||0,b1==null?Math.PI:b1);},
  // a lumpy surface for curls, wool and beards
  bumpy(geo,amp,freq,k){const pos=geo.attributes.position,v=new THREE.Vector3(),n=new THREE.Vector3();
    for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i);n.copy(v).normalize();
      const b=Math.sin(n.x*freq+k)*Math.sin(n.y*freq*1.27+k*.7)*Math.sin(n.z*freq*.91+k*1.3);
      v.addScaledVector(n,amp*Math.pow(Math.abs(b),.55));pos.setXYZ(i,v.x,v.y,v.z);}
    geo.computeVertexNormals();return geo;},
  // S191 — a box with rounded edges and corners (radius r, n steps round each edge), smooth-shaded: the kit's owed
  // rounded box, for stone, crates and the dungeon's props
  rbox(w,h,d,r,n){n=n||3;const g=new THREE.BoxGeometry(w,h,d,n*2,n*2,n*2),p=g.attributes.position,hw=w/2-r,hh=h/2-r,hd=d/2-r;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const ix=Math.max(-hw,Math.min(hw,x)),iy=Math.max(-hh,Math.min(hh,y)),iz=Math.max(-hd,Math.min(hd,z));
      let dx=x-ix,dy=y-iy,dz=z-iz;const l=Math.hypot(dx,dy,dz)||1;p.setXYZ(i,ix+dx/l*r,iy+dy/l*r,iz+dz/l*r);}
    g.computeVertexNormals();return SK.smooth(g);},
  // normals averaged over every vertex at the same place (a box's faces are separate; this shades across the seams)
  smooth(g){const p=g.attributes.position,n=g.attributes.normal,acc=new Map();const key=i=>Math.round(p.getX(i)*1e4)+','+Math.round(p.getY(i)*1e4)+','+Math.round(p.getZ(i)*1e4);
    for(let i=0;i<p.count;i++){const k=key(i);const a=acc.get(k)||[0,0,0];a[0]+=n.getX(i);a[1]+=n.getY(i);a[2]+=n.getZ(i);acc.set(k,a);}
    for(let i=0;i<p.count;i++){const a=acc.get(key(i));const l=Math.hypot(a[0],a[1],a[2])||1;n.setXYZ(i,a[0]/l,a[1]/l,a[2]/l);}n.needsUpdate=true;return g;}
};
// ── the peoples' looks (canon §2) and the nations' dyes; palettes match PEOPLES in the world ──
const PEOPLE_LOOK={
  gatelander:{skin:[0xe8c8a8,0xf0d0b0,0xe0b898,0xd8b090],hair:[0x2a1a10,0x4a2c14,0x8a3a1a,0xa04a20,0x3a2a1a],eyes:[0x4a6a3a,0x3a5a8a,0x6a5a2a,0x4a3020],freckles:.34,ruddy:.5,beard:.35,
    styles:{f:[['straight',.2],['braid',.15],['twin',.1],['curly',.15],['bun',.12],['tied',.1],['shaggy',.08],['warrior',.1]],m:[['crop',.22],['shaggy',.15],['curly',.12],['straight',.08],['tied',.1],['warrior',.1],['buzz',.1],['mohawk',.08],['braid',.05]]},
    beards:[['full',.16],['short',.18],['walrus',.1],['mutton',.1],['goatee',.08],['vandyke',.08],['handlebar',.06],['long',.06],['horseshoe',.06],['chinstrap',.06],['stubble',.06]]},
  markman:{skin:[0xf0dcc8,0xecd4c0,0xf4e0d0,0xe8d0b8],hair:[0xd8c8a0,0xb8a070,0x8a8a80,0xe8dcc0,0x5a4a3a],eyes:[0x7a8288,0x6a8aa8,0x5a6a78],freckles:.08,ruddy:.6,beard:.65,
    styles:{f:[['straight',.2],['warrior',.25],['braid',.2],['twin',.15],['bun',.1],['tied',.1]],m:[['warrior',.3],['straight',.12],['mohawk',.15],['shaggy',.13],['buzz',.15],['crop',.15]]},
    beards:[['long',.15],['braided',.2],['full',.18],['forked',.1],['short',.08],['walrus',.1],['horseshoe',.1],['mutton',.05],['stubble',.04]]},
  aurennais:{skin:[0xc8a078,0xb88860,0xa87850,0xd0a880],hair:[0x1a1210,0x2a1a10,0x3a2818,0x1a1a1a],eyes:[0x3a2414,0x24160c,0x5a4420],freckles:.03,ruddy:.1,beard:.4,
    styles:{f:[['curly',.25],['afro',.2],['straight',.12],['bun',.15],['braid',.13],['tied',.15]],m:[['curly',.25],['afro',.15],['crop',.25],['buzz',.15],['tied',.1],['straight',.1]]},
    beards:[['short',.2],['goatee',.15],['vandyke',.15],['pencil',.14],['handlebar',.1],['chinstrap',.1],['full',.08],['stubble',.08]]},
  oldblood:{skin:[0xd8d0cc,0xcfc8c4,0xe0d8d4,0xc8c0bc],hair:[0x0e0c0c,0x141212,0x1a1616],eyes:[0xb4bcc2],freckles:0,ruddy:0,beard:.25,tattoo:true,
    styles:{f:[['straight',.4],['braid',.3],['bun',.15],['twin',.15]],m:[['straight',.3],['crop',.25],['buzz',.2],['braid',.25]]},
    beards:[['short',.2],['goatee',.2],['long',.2],['pencil',.2],['stubble',.2]]}
};
const NATION_DRESS={
  gatelands:{cloth:[0x5a4030,0x4a5a30,0x7a3a22,0x9a7a3a,0x3a4a5a,0x6a5a3a],trim:0x2a1c10,cloak:.12,hats:[['coif',.28],['flatcap',.2],['none',.52]]},
  mark:{cloth:[0x4a4a4c,0x26262c,0x8a7a60,0x2a3448,0x5a4a3a],trim:0x6a5a48,cloak:.6,hats:[['fur',.3],['hood',.25],['none',.45]]},
  aurenne:{cloth:[0x1e3a7a,0xe4e0d4,0xb08a3a,0x6a2a3a,0x2a5a5a],trim:0xc8a850,cloak:.1,hats:[['chaperon',.3],['coif',.15],['none',.55]]}
};
const PEOPLE_CAPPED=new Set(['crop','straight','braid','twin','bun','tied','buzz','thin']); // styles a coif or cap can sit on
// a seeded dice: the same name and place always roll the same person
function pHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function pRng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
const pPick=(r,a)=>a[Math.floor(r()*a.length)];
const pPickW=(r,a)=>{let q=r();for(const [v,w] of a){if((q-=w)<=0)return v;}return a[a.length-1][0];};
const pGauss=r=>{let u=0;for(let i=0;i<4;i++)u+=r();return (u-2)*1.732;};
function personGenome(def,opts){
  opts=opts||{};const role=(def.role||'').toLowerCase();
  const pk=(def.people&&PEOPLE_LOOK[def.people])?def.people:'gatelander';const P=PEOPLE_LOOK[pk];
  const nk=NATION_DRESS[opts.nation]?opts.nation:'gatelands';const N=NATION_DRESS[nk];
  const seed=pHash((def.name||role||'?')+'|'+(opts.key||''));const r=pRng(seed);
  const banks=(typeof WORLD!=='undefined'&&WORLD.NAMES)||null;
  let female=def.female!=null?!!def.female:null;
  if(female==null&&banks&&def.name){const bs=Object.values(banks);if(bs.some(b=>b&&b.f&&b.f.includes(def.name)))female=true;else if(bs.some(b=>b&&b.m&&b.m.includes(def.name)))female=false;}
  if(female==null)female=/sister|lady|queen|mother|wife|maid|matron/.test(role)?true:/brother|lord|king|father|priest|monk/.test(role)?false:r()<.5;
  const child=/kid|child/.test(role);
  const age=child?'child':/elder|old/.test(role)?'elder':r()<.16?'elder':r()<.4?'young':'adult';
  const C=x=>new THREE.Color(x);
  const skin=C(def.sCol!=null?def.sCol:pPick(r,P.skin)).lerp(C(pPick(r,P.skin)),r()*.4);
  const hair=C(def.hairCol!=null?def.hairCol:pPick(r,P.hair)).lerp(C(pPick(r,P.hair)),r()*.3);
  const grey=age==='elder'?.55+r()*.35:age==='adult'&&r()<.2?.2:0;hair.lerp(C(0xd4d0c8),grey);
  const styles=child?[['crop',.4],['shaggy',.3],['braid',.15],['twin',.15]]:(age==='elder'&&!female&&r()<.45)?[['thin',1]]:P.styles[female?'f':'m'];
  const beard=(child||female)?'none':(age==='young'&&r()<.7)?'none':(r()<P.beard?pPickW(r,P.beards):r()<.35?'stubble':'none');
  const dyeA=pPick(r,N.cloth);let dyeB=pPick(r,N.cloth);if(dyeB===dyeA)dyeB=N.cloth[(N.cloth.indexOf(dyeA)+2)%N.cloth.length];
  const plain=P.tattoo?.35:0;
  const g={seed,people:pk,nation:nk,name:def.name||'',role,female,age,child,
    height:(1+pGauss(r)*.035)*(female?.95:1)*(age==='elder'?.97:child?.72:1),
    build:(1+pGauss(r)*.06)*(female?.93:1)*(child?.9:1),
    head:(child?1.12:1)*(1+pGauss(r)*.03),jaw:1+pGauss(r)*.05+(female?-.03:.02),nose:[1+pGauss(r)*.15,1+pGauss(r)*.15],
    brow:[.7+r()*.7+(female?-.15:.1),pGauss(r)*.12],ears:1+pGauss(r)*.1,
    skin,hair,eye:C(pPick(r,P.eyes)),freckles:r()<P.freckles,ruddy:r()<P.ruddy,style:pPickW(r,styles),beard,
    dress:female&&!child&&r()<.7,
    cloth:def.bCol!=null?C(def.bCol):C(dyeA).lerp(C(0x3a3a3a),plain),
    sleeve:def.bCol!=null?C(def.bCol).multiplyScalar(.88):C(dyeB).lerp(C(0x3a3a3a),plain),
    legs:C(pPick(r,[0x3a2a10,0x4a3a28,0x3a3a40,0x2a2420])),boot:C(pPick(r,[0x2a1c10,0x3a2616,0x1e1a16])),trim:C(N.trim),
    cloak:!child&&r()<N.cloak,hat:child?'none':pPickW(r,N.hats),apron:null,tattoo:!!P.tattoo,gear:null,extras:[],
    phase:r()*20,tempo:.85+r()*.3,bodyScale:def.bodyScale||null};
  if(g.hat==='coif'&&!female&&r()<.7)g.hat='none';
  if(g.hat==='flatcap'&&female)g.hat='coif';
  // the role dresses over the top
  if(/guard|captain|sergeant|watch|blade|warden|recruit|soldier/.test(role)){g.hat='helm';g.gear='spear';g.cloak=false;g.dress=false;}
  else if(/farmer/.test(role)){g.hat='straw';g.gear='hoe';}
  else if(/fisher/.test(role)){g.hat='straw';}
  else if(/elder|hermit/.test(role)){g.gear='stick';}
  else if(/smith|armourer/.test(role)){g.apron=0x3a2010;g.gear='hammer';g.hat='none';g.dress=false;}
  else if(/apothecary|herbalist/.test(role)){g.extras.push('satchel');g.hat='kerchief';}
  else if(/merchant|trader/.test(role)){g.hat='brim';g.extras.push('bag');}
  else if(/scholar|adept|novice|evoker|mage/.test(role)){g.extras.push('spectacles','book');}
  else if(/lord|lady|regent|king|queen/.test(role)){g.hat='crown';g.extras.push('mantle');g.cloak=false;}
  else if(/priest|sister|brother|prior/.test(role)){g.hat='hood';}
  else if(/innkeeper/.test(role)){g.apron=0xd8d0b8;}
  if(!PEOPLE_CAPPED.has(g.style)&&(g.hat==='coif'||g.hat==='flatcap'||g.hat==='fur'||g.hat==='chaperon'))g.hat='none';
  // S268 — wealth in clothes (Michael's A on Session 246: from the role and the town's prosperity): a base by role, moved by
  // the town's fortune by ±.25 and ±.1 on the person's own seed (drawn last, so no other trait moves). Poor (under .3) is
  // cloth faded towards undyed wool, foot-wraps, no fur hat or chaperon, and in the bake a rope belt and patches; well-off
  // (over .7) deeper dyes, gilt trim, dark boots, and a buckle, a chain and a pendant. Only a person of a place (opts.key a
  // settlement) and not in uniform; the rest dress as before. The clothes follow the town when its people are rebuilt.
  if(opts.key&&!/guard|captain|sergeant|watch|blade|warden|recruit|soldier/.test(role)&&typeof WORLD!=='undefined'){let pr=null;try{const st=WORLD.siteAnywhere(opts.key);if(st)pr=WORLD.prosperity(st);}catch(e){}
    if(pr!=null){const base=/lord|lady|regent|king|queen/.test(role)?.95:/merchant|trader|innkeeper|scholar|adept|mage|shipwright|harbour/.test(role)?.7:/smith|armourer|apothecary|herbalist|priest|sister|brother|prior|steward|mayor|elder/.test(role)?.55:/farmer|fisher/.test(role)?.35:/hermit/.test(role)?.15:.45;
      const w=Math.max(0,Math.min(1,base+(pr-50)/50*.25+(r()-.5)*.2));g.wealth=w;const C=x=>new THREE.Color(x);
      if(w<.3){const u=C(0x7a6c5a);g.cloth=g.cloth.clone().lerp(u,.45);g.sleeve=g.sleeve.clone().lerp(u,.45);g.legs=g.legs.clone().lerp(u,.3);g.trim=g.cloth.clone().multiplyScalar(.8);g.boot=C(0x7a6a52);if(g.hat==='chaperon'||g.hat==='fur')g.hat='none';}
      else if(w>.7){for(const k of ['cloth','sleeve']){const h={};g[k].getHSL(h);g[k]=new THREE.Color().setHSL(h.h,Math.min(1,h.s*1.15+.03),h.l*.82);}g.trim=C(0xc8a040);g.boot=C(0x1a120c);g.legs=g.legs.clone().multiplyScalar(.8);}}}
  return g;
}
// ── the body: rounded parts on bones, baked into one skinned mesh ──
// personBake builds the figure at a quality q (SK.q) and returns its geometry and bones. At q<1 it is the
// distant copy: fewer segments, and the tiny parts (pupils, irises, freckles) left out. Bones are created
// in the same order at every quality, so either geometry skins to either skeleton.
const PEOPLE_LOD={q:.5,far:17,near:15,tiny:.012,shadowLo:true};
// S265 — shading in the people's creases (Michael's A on Session 243, this strength): after the bake, each part stands in
// as one to six spheres along its longest axis (the radius the mean of its two shorter half-extents), and each vertex is
// darkened by the spheres of every other part it faces, the analytic sphere occlusion (the cosine to the centre times
// r²/d², capped at 1), summed, times .75, capped at a darkening of .5. A part never shades itself. Once per bake, in the
// bind pose, into the colours: no triangles, no shader, nothing per frame. PAO.on turns it off for a comparison.
const PAO={k:.75,max:.5,on:true};
const HAO={k:.75,max:.5,on:true,cut:4,minR:.35,keep:false,ms:0,n:0}; // S276 — the houses' creases; S284 on, the large parts only (Michael's B, #49): minR and cut as personAO describes
function personAO(pos,nor,col,PR,O){O=O||PAO;if(!O.on)return;const S=[];
  PR.forEach(([s,c],pi)=>{const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(let i=s;i<s+c;i++)for(let k=0;k<3;k++){const v=pos[i*3+k];if(v<mn[k])mn[k]=v;if(v>mx[k])mx[k]=v;}
    const e=[0,1,2].map(k=>(mx[k]-mn[k])/2),ax=e.indexOf(Math.max(e[0],e[1],e[2])),o=[0,1,2].filter(k=>k!==ax),r=Math.max(.004,(e[o[0]]+e[o[1]])/2),n=Math.min(6,Math.max(1,Math.round(e[ax]/r)));
    if(O.minR&&r<O.minR)return;for(let j=0;j<n;j++){const c3=[0,1,2].map(k=>(mn[k]+mx[k])/2);c3[ax]=mn[ax]+e[ax]*2*(j+.5)/n;S.push(c3[0],c3[1],c3[2],Math.min(r,e[ax]),pi);}});
  // O.cut (the houses, S276): a part only asks the spheres within cut radii of its own box; past that a sphere darkens by
  // under 1/cut², and a house has thousands of them. O.minR: only parts at least that thick (twice it) shade others.
  const all=[];for(let q=0;q<S.length;q+=5)all.push(q);
  PR.forEach(([s,c],pi)=>{let Q=all;if(O.cut){const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(let i=s;i<s+c;i++)for(let k=0;k<3;k++){const v=pos[i*3+k];if(v<mn[k])mn[k]=v;if(v>mx[k])mx[k]=v;}
      Q=[];for(let q=0;q<S.length;q+=5){if(S[q+4]===pi)continue;let d2=0;for(let k=0;k<3;k++){const v=S[q+k],e=v<mn[k]?mn[k]-v:v>mx[k]?v-mx[k]:0;d2+=e*e;}const R=O.cut*S[q+3];if(d2<R*R)Q.push(q);}}
    for(let i=s;i<s+c;i++){const x=pos[i*3],y=pos[i*3+1],z=pos[i*3+2],nx=nor[i*3],ny=nor[i*3+1],nz=nor[i*3+2];let occ=0;
    for(let qi=0;qi<Q.length;qi++){const q=Q[qi];if(S[q+4]===pi)continue;const dx=S[q]-x,dy=S[q+1]-y,dz=S[q+2]-z,L2=dx*dx+dy*dy+dz*dz,L=Math.sqrt(L2)||1e-6;const cs=(dx*nx+dy*ny+dz*nz)/L;if(cs<=0)continue;occ+=cs*Math.min(1,S[q+3]*S[q+3]/L2);}
    const a=1-Math.min(O.max,occ*O.k);col[i*3]*=a;col[i*3+1]*=a;col[i*3+2]*=a;}});}
function personBake(g,q){SK.q=q;try{return personBakeQ(g,q);}finally{SK.q=1;}}
function personBakeQ(g,q){
  const bones=[],B={};
  const bone=(name,parent,x,y,z)=>{const b=new THREE.Bone();b.name=name;b.position.set(x||0,y||0,z||0);if(parent)parent.add(b);b.userData.i=bones.length;bones.push(b);B[name]=b;return b;};
  const parts=[];
  // a skeleton (g.skel, S172) is laid out on the same bones but none of the flesh, hair or clothes is hung on them:
  // until bodyOpen, a part is thrown away; the bones go on after the skeleton is built (skelParts below)
  let bodyOpen=!g.skel&&!g.golem;const eyes=[]; // where the eyes went (buildFoe hangs a glow there for the dead)
  const part=(geo,col,b,x,y,z)=>{const o=new THREE.Object3D();o.position.set(x||0,y||0,z||0);if(!bodyOpen){geo.dispose();return o;}o.userData.geo=geo;o.userData.col=col;b.add(o);parts.push(o);return o;};
  const C=x=>(x&&x.isColor)?x:new THREE.Color(x);const mixC=(a,b,t)=>C(a).clone().lerp(C(b),t);
  const bw=g.build,fem=g.female,hs=g.head;
  const cloth=C(g.cloth),sleeve=C(g.sleeve),skin=C(g.skin),legs=C(g.legs),hair=C(g.hair),boot=C(g.boot),trim=C(g.trim),dark=C(0x1b1410),steel=C(0x9a9c9e);
  const hips=bone('hips',null,0,PW.HIPS,0);const DL=PW.DL;
  // the tunic's skirt, or a dress to the shin
  const hem=g.dress?[[0,-.37-DL],[.25,-.37-DL],[.255,-.355-DL],[.215,-.2-DL*.6],[.18,-.05],[.16,.02],[0,.045]]:[[0,-.13],[.215,-.13],[.222,-.115],[.2,-.06],[.178,0],[.168,.04],[0,.045]];
  part(SK.lathe(hem.map(q=>[q[0]*bw*(fem?1.04:1),q[1]])),cloth,hips).scale.z=.76;
  // the trim on the hem follows the skirt it edges: the same width (a woman's skirt is 4% wider) and the same flattening
  // front to back (the torus's y is the body's depth once it is laid flat); round, it stood off the cloth (playtest s162)
  {const r=part(SK.torus((g.dress?.247:.214)*bw*(fem?1.04:1),.012,5,22),trim,hips,0,g.dress?-.36-DL:-.125,0);r.rotation.x=Math.PI/2;r.scale.y=.76;}
  const WL=g.wealth==null?.5:g.wealth,gold=C(0xc8a040); /* S268 — wealth in the bake: a rope belt and patches, or a buckle, a chain and a pendant */const belt=part(SK.torus(.172*bw*(fem?.96:1),WL<.3?.016:.02,5,20),WL<.3?C(0x9a8458):dark,hips,0,.02,0);belt.rotation.x=Math.PI/2;belt.scale.y=.74;if(WL<.3){if(!g.dress)part(SK.ball(.034,7,5),mixC(cloth,0x3a3024,.45),hips,.085*bw,-.075,.136*bw).scale.set(1.1,.9,.28);part(SK.ball(.016,6,5),C(0x9a8458),hips,.06*bw,.0,.128*bw);}if(WL>.7)part(SK.rbox(.042,.034,.012,.005,2),gold,hips,0,.02,.13*bw);
  if(g.apron)part(SK.lathe([[0,-.3],[.12,-.3],[.13,-.02],[0,0]],8),C(g.apron),hips,0,0,.11).scale.set(1,1,.12);
  const spine=bone('spine',hips,0,.03,0);
  const chestPts=fem?[[0,-.01],[.155,-.01],[.15,.06],[.17,.15],[.172,.22],[.15,.3],[.095,.36],[.052,.39],[0,.4]]:[[0,-.01],[.165,-.01],[.172,.05],[.19,.17],[.188,.25],[.16,.32],[.1,.37],[.055,.395],[0,.4]];
  part(SK.lathe(chestPts.map(q=>[q[0]*bw,q[1]])),cloth,spine).scale.z=.72;if(WL<.3)part(SK.ball(.036,7,5),mixC(cloth,0x3a3024,.4),spine,-.07*bw,.13,.124*bw).scale.set(1,1.1,.26);if(WL>.7){const ch=part(SK.torus(.085*bw,.005,4,18),gold,spine,0,.35,.035);ch.rotation.x=Math.PI/2-.55;part(SK.ball(.018,8,6),gold,spine,0,.285,.13*bw).scale.z=.5;}
  if(g.cloak){const cb=bone('cloak',spine,0,.33,-.1),cb2=bone('cloak2',cb,0,-.31,-.08),cc=mixC(cloth,0x000000,.3); /* S267 — the cloak hangs from its own bone at the shoulders, in two halves hinged at the middle of the back (peopleSwing) */part(SK.cyl(.17*bw,.225*bw,.34,14,2,true,Math.PI/2+.25,Math.PI-.5),cc,cb,0,-.17,.095).scale.z=.8;part(SK.cyl(.215*bw,.27*bw,.34,14,2,true,Math.PI/2+.25,Math.PI-.5),cc,cb2,0,-.14,.175).scale.z=.8;part(SK.ball(.018,8,6),C(0xb89a4a),spine,0,.33,.12);}
  if(g.extras.includes('mantle'))part(SK.lathe([[0,-.06],[.27*bw,-.06],[.28*bw,-.04],[.2*bw,.06],[0,.08]],18),C(0x6a1010),spine,0,.3,0).scale.z=.8;
  if(g.ogre)part(SK.ball(.12*bw,12,9),skin,spine,0,.1,.085*bw).scale.set(1.1,.85,.9); // S221 — an ogre's belly, bare below the jerkin
  const neck=bone('neck',spine,0,.39,0);part(SK.cyl(.043,.05,.09,10),skin,neck,0,.03,0);
  const head=bone('head',neck,0,.07,0);
  part(SK.ball(.13*hs,14,10),skin,head,0,.12,0).scale.set(g.jaw,fem?1.05:1.08,1.02);
  if(g.troll)part(SK.ball(.12*hs,12,8),skin,head,0,.06,.03).scale.set(1.1,.6,1); // S208 — the troll's heavy jaw
  // every feature sits on the head's own surface: zs(x,y) is how far forward the skin is at that point
  const R=.13*hs,zs=(x,y)=>R*1.02*Math.sqrt(Math.max(0,1-(x/(R*g.jaw))**2-((y-.12)/(R*(fem?1.05:1.08)))**2));
  part(SK.ball(.017,8,6),skin,head,0,.102,zs(0,.102)+.002).scale.set(g.nose[0]*.9,g.nose[1]*1.25,1);
  part(SK.cyl(.005,.005,.036,5),mixC(skin,0x7a3a30,.45),head,0,.066,zs(0,.066)+.001).rotation.z=Math.PI/2;
  [-1,1].forEach(s=>{const ex=s*.046*g.jaw,ez=zs(ex,.135);
    part(SK.ball(.0165,8,6),C(0xf0ece4),head,ex,.135,ez-.002).scale.set(1,.78,.45);
    part(SK.ball(.0095,8,6),C(g.eye),head,ex,.135,ez+.0035);eyes.push([ex,.135,ez+.006]);
    part(SK.ball(.0042,5,4),C(0x0a0806),head,ex,.135,ez+.0078);
    const bx=s*.047*g.jaw;part(SK.cyl(.006*g.brow[0],.006*g.brow[0],.05,5),hair,head,bx,.163,zs(bx,.163)+.002).rotation.z=Math.PI/2+s*(.1+g.brow[1]);
    if(g.goblin){const e=part(SK.cone(.045,.26,6),skin,head,s*(.1*hs+.1),.15,-.01);e.rotation.set(0,0,-s*1.3);e.scale.set(1,1,.45);} // S184 — a goblin's long pointed ears
    else if(g.gargoyle){const e=part(SK.cone(.035,.16,5),skin,head,s*(.1*hs+.05),.17,-.02);e.rotation.set(-.3,0,-s*1.1);e.scale.set(1,1,.45);} // S210 — a gargoyle's pointed ears
    if(g.troll)part(SK.cone(.022,.09,6),C(0xe8dcc0),head,s*.042*hs,.052,zs(s*.042*hs,.06)+.012).rotation.set(-.3,0,s*.3); // S208 — a troll's tusks, up from the underbite
    else part(SK.ball(.026,8,6),skin,head,s*.128*g.jaw,.115,-.005).scale.set(.45,g.ears,.8);
    const cx=s*.07*g.jaw;if(g.ruddy)part(SK.ball(.03,8,6),mixC(skin,0xc8604e,.3),head,cx,.093,zs(cx,.093)-.005).scale.set(1,.7,.3);
    if(g.extras.includes('spectacles'))part(SK.torus(.024,.004,4,12),C(0x888860),head,ex,.135,ez+.012);
  });
  if(g.freckles){const fr=pRng(g.seed+99);const fc=mixC(skin,0x7a4a2a,.45);for(let i=0;i<12;i++){const x=(fr()<.5?-1:1)*(.02+fr()*.07),y=.09+fr()*.04;part(SK.ball(.0045,5,4),fc,head,x,y,zs(x,y));}}
  // hair: a bumped sphere for texture, a chain of offset lobes with a tie for a plait
  const plait=(pts,r,col,pb)=>{const n=pts.length-1,per=4;let last=null;const PB=pb||head;if(pb)pts=pts.map(p=>[p[0]-pb.position.x,p[1]-pb.position.y,p[2]-pb.position.z]);
    for(let i=0;i<n*per;i++){const u=i/(n*per),seg=Math.floor(u*n),f=u*n-seg,a=pts[seg],b=pts[seg+1];
      const x=a[0]+(b[0]-a[0])*f,y=a[1]+(b[1]-a[1])*f,z=a[2]+(b[2]-a[2])*f;const rr=r*(1-.3*u),side=(i%2?1:-1)*rr*.38;
      const lobe=part(SK.ball(rr,6,5),col||hair,PB,x+side,y,z);lobe.scale.set(1,1.5,.9);lobe.rotation.z=side*6;last=[x,y,z,rr];}
    part(SK.torus(last[3]*.8,.006,4,8),trim,PB,last[0],last[1]-.012,last[2]).rotation.x=Math.PI/2;
    part(SK.cone(last[3]*.85,.05,6),col||hair,PB,last[0],last[1]-.045,last[2]).rotation.x=Math.PI;};
  const shorn=(t)=>{const c=part(SK.ball(R*1.012,14,8,0,Math.PI*2,0,Math.PI*.56),mixC(skin,hair,t||.4),head,0,.125,-.006);c.rotation.x=-.3;c.scale.set(g.jaw,1.06,1.03);return c;};
  const capHair=()=>{const cap=part(SK.ball(.139*hs,14,7,0,Math.PI*2,0,Math.PI*.52),hair,head,0,.13,-.008);cap.rotation.x=-.32;cap.scale.set(g.jaw,1.06,1.04);return cap;};
  let cap=null;const st=g.style;
  if(st==='thin'){const f=part(SK.torus(.118*hs,.03,5,14,Math.PI*1.2),hair,head,0,.135,-.01);f.rotation.set(-Math.PI/2,0,Math.PI*-.1);f.scale.set(g.jaw,1,1);}
  else if(st==='buzz')cap=shorn(.7);
  else if(st==='mohawk'){shorn();for(let i=0;i<11;i++){const a=-.95+i*.2,rr=.142*hs;const h=1+.9*Math.cos(a*1.1);const t=part(SK.cone(.042,.11*h,6),hair,head,0,.12+rr*Math.cos(a),rr*Math.sin(-a));t.rotation.x=-a;t.scale.set(.5,1,1.25);}}
  else if(st==='curly')part(SK.bumpy(SK.ball(.15*hs,20,14),.022,23,g.seed%13),hair,head,0,.17,-.045).scale.set(g.jaw,.98,1);
  else if(st==='afro')part(SK.bumpy(SK.ball(.2*hs,24,16),.014,27,g.seed%11),hair,head,0,.2,-.07).scale.set(g.jaw,.95,1);
  else if(st==='shaggy'){const c=part(SK.bumpy(SK.ball(.147*hs,18,11,0,Math.PI*2,0,Math.PI*.5),.016,15,g.seed%7),hair,head,0,.125,-.012);c.rotation.x=-.4;c.scale.set(g.jaw*1.03,1.12,1.06);
    part(SK.bumpy(SK.ball(.12*hs,16,10,Math.PI*.85,Math.PI*1.3,Math.PI*.35,Math.PI*.4),.014,15,3),hair,head,0,.06,-.04).scale.set(g.jaw*1.12,1.3,1.02);}
  else if(st==='warrior'){shorn();const top=part(SK.ball(.141*hs,18,8,0,Math.PI*2,0,Math.PI*.3),hair,head,0,.13,-.01);top.rotation.x=-.2;top.scale.set(g.jaw*.8,1.08,1.08);
    part(SK.ball(.034,10,8),hair,head,0,.265,-.07).scale.set(1,.85,1);
    plait([[0,.26,-.1],[0,.2,-.16],[0,.12,-.17],[0,.04,-.16]],.022,null,bone('hairB',head,0,.26,-.1));
    [-1,1].forEach(sd=>plait([[sd*.118*g.jaw,.14,.03],[sd*.125*g.jaw,.04,.05],[sd*.12*g.jaw,-.08,.07],[sd*.115*g.jaw,-.2,.075]],.017));}
  else cap=capHair();
  if(st==='straight')part(SK.cyl(.136*hs*g.jaw,.155*g.jaw,.36,16,1,true,Math.PI*.3,Math.PI*1.4),hair,head,0,-.01,-.006).scale.z=.95;
  if(st==='braid')plait([[0,.1,-.135],[0,-.02,-.16],[0,-.15,-.15],[0,-.27,-.13],[0,-.35,-.12]],.024,null,bone('hairB',head,0,.1,-.135));
  if(st==='twin')[-1,1].forEach(sd=>plait([[sd*.1*g.jaw,.08,-.07],[sd*.135*g.jaw,-.02,-.03],[sd*.14*g.jaw,-.13,0],[sd*.135*g.jaw,-.22,.02]],.019));
  if(st==='bun')part(SK.ball(.052,10,8),hair,head,0,.2,-.1);
  if(st==='tied')part(SK.cone(.035,.17,8),hair,bone('hairB',head,0,.1,-.12),0,-.07,-.025).rotation.x=Math.PI+.35;
  // beards: a shell over the jaw, a chin mass, moustaches from two drooping halves
  if(g.beard&&g.beard!=='none'){
    const bc=g.beard==='stubble'?mixC(skin,hair,.22):mixC(hair,0x8a4a2a,.12);
    const shell=(w,t0,t1,rad,amp,freq,ys)=>{const geo=SK.ball(rad,18,10,Math.PI/2-w,2*w,t0,t1);if(amp)SK.bumpy(geo,amp,freq,g.seed%9);const m=part(geo,bc,head,0,.12,0);m.scale.set(g.jaw,ys,1.02);return m;};
    const lump=(r,x,y,z,sx,sy,sz,amp)=>{const m=part(amp?SK.bumpy(SK.ball(r,12,10),amp,26,g.seed%5):SK.ball(r,12,10),bc,head,x,y,z);m.scale.set(sx,sy,sz);return m;};
    const my=.082,mz=zs(0,.082)+.003;
    const tache=(kind)=>{
      if(kind==='pencil'){part(SK.cyl(.0035,.0035,.05,5),bc,head,0,.079,zs(0,.079)+.002).rotation.z=Math.PI/2;return;}
      const big=kind==='walrus',r=big?.028:.021;
      [-1,1].forEach(sd=>{const h=lump(r,sd*(big?.02:.018),my-(big?.005:0),mz,big?1.45:1.5,big?.75:.42,big?.7:.55,big?.004:0);h.rotation.z=-sd*(big?.45:.25);});
      if(kind==='handlebar')[-1,1].forEach(sd=>{const c=part(SK.torus(.011,.0045,4,10,Math.PI*1.4),bc,head,sd*.047,my+.009,mz-.006);c.rotation.set(0,sd*.35,sd>0?-.4:Math.PI+.4);});};
    const Bd=g.beard;
    if(Bd==='stubble')shell(Math.PI*.5,Math.PI*.63,Math.PI*.33,R*1.008,0,0,1.08);
    if(Bd==='chinstrap')shell(Math.PI*.52,Math.PI*.8,Math.PI*.17,R*1.02,.004,30,1.1);
    if(Bd==='short'||Bd==='braided'){shell(Math.PI*.55,Math.PI*.62,Math.PI*.37,R*1.035,.008,30,1.12);tache('bar');}
    if(Bd==='full'||Bd==='long'||Bd==='forked'){shell(Math.PI*.6,Math.PI*.6,Math.PI*.4,R*1.06,.014,22,1.25);lump(.065,0,-.03,.075,1.15,1.15,.85,.012);tache('bar');}
    if(['short','braided','full','long','forked'].includes(Bd))[-1,1].forEach(sd=>{const x=sd*.112*g.jaw;lump(.028,x,.1,zs(x,.1)-.014,.5,1.6,.9,.006).rotation.z=sd*.15;});
    if(Bd==='long')part(SK.bumpy(SK.cone(.075,.24,14,4),.006,30,2),bc,head,0,-.13,.085).rotation.x=Math.PI+.15;
    if(Bd==='forked')[-1,1].forEach(sd=>part(SK.bumpy(SK.cone(.036,.14,10,3),.004,30,3),bc,head,sd*.03,-.1,.09).rotation.set(Math.PI+.1,0,sd*.22));
    if(Bd==='braided')plait([[0,-.02,.11],[0,-.1,.12],[0,-.18,.11],[0,-.25,.1]],.02,bc);
    if(Bd==='goatee'||Bd==='vandyke')lump(.03,0,.006,zs(0,.006)-.004,1,1.5,.8,.005);
    if(Bd==='vandyke')tache('bar');
    if(Bd==='walrus'||Bd==='handlebar'||Bd==='pencil')tache(Bd==='walrus'?'walrus':Bd);
    if(Bd==='horseshoe'){tache('bar');[-1,1].forEach(sd=>lump(.012,sd*.04,.045,zs(sd*.04,.045)+.002,1,3.2,.8,0));}
    if(Bd==='mutton'){tache('walrus');[-1,1].forEach(sd=>{const x=sd*.1*g.jaw;lump(.04,x,.075,zs(x,.075)-.012,.55,1.6,.9,.008).rotation.z=sd*.25;});}
  }
  // hats
  if(g.hat==='coif'&&cap){cap.userData.col=C(0xd8d0c0);cap.scale.set(g.jaw*1.05,1.1,1.08);}
  if(g.hat==='kerchief'&&cap){cap.userData.col=mixC(cloth,0xffffff,.2);cap.scale.set(g.jaw*1.06,1.1,1.1);part(SK.ball(.03,8,6),mixC(cloth,0xffffff,.2),head,0,.06,-.13);}
  if(g.hat==='flatcap')part(SK.lathe([[0,0],[.15,0],[.155,.02],[.14,.05],[0,.06]],16),mixC(sleeve,0x000000,.2),head,0,.21,.01).rotation.x=-.2;
  if(g.hat==='fur'){part(SK.cyl(.15*hs,.145*hs,.12,14),C(0x6a5a48),head,0,.225,-.01);part(SK.torus(.145*hs,.03,6,16),C(0x7a6a56),head,0,.17,-.01).rotation.x=Math.PI/2;}
  if(g.hat==='hood'){const h=part(SK.ball(.16*hs,18,9,0,Math.PI*2,0,Math.PI*.62),g.hoodCol!=null?C(g.hoodCol):mixC(cloth,0x000000,.2),head,0,.12,-.02);h.rotation.x=-.5;h.scale.set(g.jaw,1.05,1.1);}
  if(g.hat==='chaperon'){part(SK.torus(.125*hs,.042,8,20),sleeve,head,0,.2,-.01).rotation.x=Math.PI/2;part(SK.ball(.1*hs,14,7,0,Math.PI*2,0,Math.PI*.5),sleeve,head,0,.21,-.01);}
  if(g.hat==='straw'){part(SK.lathe([[0,0],[.27,0],[.28,.012],[.26,.02],[.135,.035],[.125,.1],[.09,.14],[0,.15]],20),C(0xd4a830),head,0,.2,-.01).rotation.x=-.12;part(SK.torus(.128,.012,6,20),C(0x6a3a1a),head,0,.24,-.01).rotation.x=Math.PI/2-.12;}
  if(g.hat==='brim'){part(SK.lathe([[0,0],[.24,0],[.245,.02],[.15,.03],[.14,.19],[.12,.21],[0,.22]],20),C(0x3a2808),head,0,.2,-.01).rotation.x=-.1;}
  if(g.hat==='helm')part(SK.lathe([[0,0],[.19,0],[.195,.01],[.15,.022],[.143,.07],[.125,.12],[.07,.155],[0,.163]],20),g.helmCol!=null?C(g.helmCol):steel,head,0,.155,0);
  if(g.hat==='crown'){part(SK.cyl(.125*hs,.13*hs,.07,12,1,true),C(0xd4a020),head,0,.25,0);for(let ci=0;ci<5;ci++){const a=ci*Math.PI*2/5;part(SK.cone(.02,.07,4),C(0xd4a020),head,Math.sin(a)*.12*hs,.31,Math.cos(a)*.12*hs);}}
  // arms and legs: side 1 is the figure's left (+x), -1 its right
  ['L','R'].forEach((k,i)=>{const s=i===0?1:-1;
    const sh=bone('sh'+k,spine,s*(fem?.17:.185)*bw,.305,0);part(SK.ball(.062*bw,10,7),sleeve,sh).scale.set(1,.9,.9);
    part(SK.limb(.155,.05*bw,.044*bw),sleeve,sh);
    const el=bone('el'+k,sh,0,-.155,0);part(SK.limb(.13,.043*bw,.036*bw),sleeve,el);
    part(SK.torus(.036*bw,.008,5,12),trim,el,0,-.12,0).rotation.x=Math.PI/2;
    if(g.tattoo)[-.105,-.09].forEach(y=>part(SK.torus(.031,.0045,4,14),C(0x26283a),el,0,y-.035,0).rotation.x=Math.PI/2);
    const wr=bone('wr'+k,el,0,-.14,0);const hand=part(SK.ball(.04,8,6),skin,wr,0,-.035,.004);hand.scale.set(.78,1.15,.6);B['hand'+k]=hand;
    part(SK.ball(.016,5,4),skin,wr,s*-.028,-.022,.02).scale.set(1,1.4,1);
    const th=bone('th'+k,hips,s*.085*bw,-.02,0);part(SK.limb(PW.L1,.066*bw,.05*bw),legs,th);
    const kn=bone('kn'+k,th,0,-PW.L1,0);part(SK.limb(PW.L2,.05*bw,.04*bw),legs,kn);
    part(SK.cyl(.05*bw,.046*bw,.1,10),boot,kn,0,.04-PW.L2,0);
    const an=bone('an'+k,kn,0,-PW.L2,0);part(SK.ball(.05,10,7),boot,an,0,-.02,.035).scale.set(1.02,.8,1.85);
  });
  // S210 — the gargoyle (Michael's answer on Session 201: gargoyle A, with better wings): horns, a tail on its own bone,
  // and bat wings on a bone each at the shoulder blades: a leading edge of arm and forearm, three fingers from the wrist,
  // the membrane between them scalloped at the trailing edge. tickPeople folds them while it sleeps as a statue.
  if(g.gargoyle){const dk=mixC(skin,0x000000,.28),mem=mixC(skin,0x2a2420,.35),up=new THREE.Vector3(0,1,0);
    const seg=(b,a,c,r0,r1,col)=>{const d=new THREE.Vector3(c[0]-a[0],c[1]-a[1],c[2]-a[2]),L=d.length();const o=part(SK.cyl(r1,r0,L,6),col,b,(a[0]+c[0])/2,(a[1]+c[1])/2,(a[2]+c[2])/2);o.quaternion.setFromUnitVectors(up,d.normalize());return o;};
    [-1,1].forEach(s=>{seg(B.head,[s*.06*hs,.2,-.01],[s*.1*hs,.29,-.07],.026,.016,dk);seg(B.head,[s*.1*hs,.29,-.07],[s*.1*hs,.33,-.16],.016,.004,dk);});
    const tl=bone('tail',B.hips,0,-.03,-.13);const TP=[[0,0,0],[0,-.08,-.14],[0,-.13,-.3],[0,-.1,-.46],[0,-.02,-.58]];
    for(let i=0;i<4;i++)seg(tl,TP[i],TP[i+1],.04-.008*i,.032-.008*i,skin);
    {const sp=part(SK.cone(.05,.1,4),dk,tl,0,.02,-.63);sp.rotation.x=-1.2;sp.scale.set(1,1,.3);}
    ['L','R'].forEach((k,i)=>{const sd=i===0?1:-1;const wb=bone('wing'+k,B.spine,sd*.07*bw,.3,-.1);const P=(x,y)=>[sd*x,y,0];
      const J=[[0,0],[.2,.17],[.4,.29]],T=[[.66,.24],[.62,-.02],[.46,-.2]];
      seg(wb,P(...J[0]),P(...J[1]),.024,.02,dk);seg(wb,P(...J[1]),P(...J[2]),.02,.014,dk);part(SK.ball(.022,6,5),dk,wb,...P(...J[2]));
      T.forEach(t=>seg(wb,P(...J[2]),P(...t),.012,.004,dk));part(SK.cone(.012,.05,4),dk,wb,...P(.2,.22)).rotation.z=-sd*.5;
      const sh=new THREE.Shape(),M=(x,y)=>sh.lineTo(sd*x,y);sh.moveTo(0,.01);M(...J[1]);M(...J[2]);M(...T[0]);
      M(.54,.12);M(...T[1]);M(.44,.02);M(...T[2]);M(.3,-.12);M(.1,-.24);M(0,-.06);
      part(new THREE.ShapeGeometry(sh),mem,wb,0,0,-.004);});
  }
  if(g.skel){bodyOpen=true; // the bones: a skull with dark sockets, a spine, a ribcage open at the front, a pelvis, the limb bones and joints
    const bc=C(0xd8d0b8),bd=C(0xa89c80),sock=C(0x140e0a);const head=B.head,spine=B.spine,neck=B.neck;
    part(SK.ball(.075,12,9),bc,head,0,.085,.005).scale.set(.88,1,1.05);
    part(SK.lathe([[.001,0],[.05,0],[.056,.03],[.042,.05],[.001,.05]],10),bc,head,0,0,.02).scale.set(1,1,.9);
    for(const s2 of [1,-1])part(SK.ball(.021,8,6),sock,head,s2*.028,.09,.058);
    part(SK.cone(.012,.022,4),sock,head,0,.064,.071).rotation.x=Math.PI;
    part(new THREE.BoxGeometry(.05,.012,.012),C(0xe8e0c8),head,0,.034,.062);
    for(let i=0;i<3;i++)part(SK.cyl(.017,.017,.02,6),bd,neck,0,i*.026,0);
    for(let i=0;i<8;i++)part(SK.cyl(.02,.022,.03,6),bd,spine,0,.02+i*.045,-.045);
    for(let i=0;i<5;i++){const r=(.125-.012*Math.abs(i-2.4))*bw;const rb=part(SK.torus(r,.011,4,14,Math.PI*1.5),bc,spine,0,.16+i*.042,-.015);rb.rotation.set(-Math.PI/2,0,-Math.PI/4);rb.scale.set(1,.72,1);}
    part(SK.cyl(.012,.012,.16,5),bc,spine,0,.25,.085*bw);
    for(const s2 of [1,-1]){const cl=part(SK.cyl(.01,.01,.17*bw,4),bc,spine,s2*.09*bw,.325,.025);cl.rotation.z=Math.PI/2;}
    part(SK.lathe([[.045,-.035],[.085,-.012],[.095,.02],[.075,.034]],12),bd,B.hips,0,0,0).scale.z=.62;part(SK.cyl(.018,.012,.07,5),bd,B.hips,0,-.01,-.05);
    ['L','R'].forEach(k=>{const sh=B['sh'+k],el=B['el'+k],wr=B['wr'+k],th=B['th'+k],kn=B['kn'+k],an=B['an'+k];
      part(SK.ball(.03,7,5),bc,sh);part(SK.limb(.14,.02,.017),bc,sh);part(SK.ball(.02,6,5),bd,el);
      for(const o2 of [.012,-.012])part(SK.limb(.13,.011,.009),bc,el,o2,0,0);
      part(SK.ball(.022,6,5),bc,wr,0,-.02,0).scale.set(1,.8,.7);for(let f=0;f<3;f++)part(SK.cyl(.005,.004,.05,4),bc,wr,-.012+f*.012,-.05,.004);
      part(SK.ball(.03,7,5),bc,th);part(SK.limb(PW.L1,.024,.019),bc,th);part(SK.ball(.022,6,5),bc,kn,0,0,.016);
      part(SK.limb(PW.L2-.01,.018,.014),bc,kn);part(SK.limb(PW.L2-.02,.008,.007),bc,kn,.02,0,-.01);
      part(SK.ball(.03,8,5),bc,an,0,-.02,.035).scale.set(.85,.45,1.9);});
  }
  // held gear sits in the right fist: the shaft runs through the hand, fingers wrap it, the wrist keeps it upright
  const gear=bone('gear',B.wrR,0,-.035,.006);
  if(g.gear){part(SK.torus(.028,.014,6,12),skin,gear).rotation.x=Math.PI/2;B.handR.scale.set(.72,.85,.7);}
  if(g.gear==='spear'){part(SK.cyl(.015,.017,1.55,8),C(0x5a3a22),gear,0,.225,0);part(SK.cone(.034,.16,10),steel,gear,0,1.08,0);}
  if(g.gear==='hoe'){part(SK.cyl(.014,.016,.9,8),C(0x6a4a2a),gear,0,-.1,0);part(new THREE.BoxGeometry(.16,.06,.012),C(0x8a8a8a),gear,0,.33,.05).rotation.x=.9;}
  if(g.gear==='stick'){part(SK.cyl(.013,.017,.56,8),C(0x4a3018),gear,0,-.24,0);part(SK.ball(.024,8,6),C(0x5a4028),gear,0,.03,0);}
  if(g.gear==='hammer'){part(SK.cyl(.014,.016,.36,8),C(0x4a3018),gear,0,.06,0);part(new THREE.BoxGeometry(.16,.07,.07),C(0x666666),gear,0,.24,0);}
  // S208 — a troll's maul: a long haft wrapped at the grip, a heavy iron head with bands at its faces
  if(g.gear==='maul'){part(SK.cyl(.017,.021,.66,8),C(0x4a3420),gear,0,.16,0);part(SK.cyl(.024,.024,.12,8),C(0x2e2218),gear,0,-.02,0);
    part(SK.rbox(.24,.12,.12,.025,2),C(0x55585a),gear,0,.5,0);[-1,1].forEach(sd=>part(SK.cyl(.066,.066,.018,10),C(0x3a3c3e),gear,sd*.11,.5,0).rotation.z=Math.PI/2);}
  // S221 — an ogre's club: a tree limb, thin at the grip and swelling to a head, with knots left where the branches were
  if(g.gear==='club'){const wd=C(0x5a4028),kn=C(0x4a3420);part(SK.cyl(.05,.024,.78,8),wd,gear,0,.27,0);part(SK.ball(.052,8,6),wd,gear,0,.66,0).scale.set(1,.7,1);
    for(let i=0;i<5;i++)part(SK.ball(.03+(i%2)*.008,6,5),kn,gear,Math.sin(i*2)*.042,.3+i*.075,Math.cos(i*2)*.042);}
  // the player's kit (tpBuild): a cuirass and pauldrons over the tunic, greaves, gauntlets, an amulet, a quiver
  if(g.eq){const E=g.eq;
    if(E.chest&&!E.chest.cloth){const ac=C(E.chest.col);part(SK.lathe(chestPts.map(q=>[q[0]*bw*1.08,q[1]]),14),ac,spine,0,-.005,0).scale.z=.78;
      [-1,1].forEach(sd=>part(SK.ball(.085*bw,10,7),ac,spine,sd*.19*bw,.31,0).scale.set(1,.7,1));
      part(SK.torus(.2*bw,.03,5,18),ac,hips,0,-.05,0).rotation.x=Math.PI/2;}
    if(E.legs&&!E.legs.cloth){const lc=C(E.legs.col);['L','R'].forEach(k=>part(SK.cyl(.056*bw,.05*bw,.16,10,1,true),lc,B['kn'+k],0,-.09,0));}
    if(E.hands){const hc=C(E.hands.col);B.handL.userData.col=hc;B.handR.userData.col=hc;['L','R'].forEach(k=>part(SK.cyl(.046*bw,.04*bw,.06,10),hc,B['el'+k],0,-.115,0));}
    if(E.amulet)part(SK.ball(.018,8,6),C(0xd8b040),spine,0,.3,.13*bw);
    if(E.quiver){part(SK.cyl(.04,.035,.34,8),C(0x5a3a20),spine,.09,.2,-.14).rotation.z=-.35;for(let i=0;i<3;i++)part(SK.cyl(.006,.006,.1,4),C(0xd8d0c0),spine,.1+i*.015,.4+i*.01,-.14).rotation.z=-.35;}}
  if(g.extras.includes('satchel')){part(new THREE.BoxGeometry(.14,.16,.06),C(0x5a7a30),hips,-.2*bw,-.02,.06);part(SK.cyl(.03,.04,.16,6),C(0x4a8a28),hips,-.2*bw,.1,.06).rotation.z=.3;}
  if(g.extras.includes('bag'))part(new THREE.BoxGeometry(.13,.13,.08),C(0x8a6030),hips,-.21*bw,-.05,.05);
  // S209 — a golem (Michael's answer on Session 201): dressed stone blocks on the people's bones and none of the flesh;
  // each block its own tone of the stone, bevelled; the rune-light is hung on the bones by buildFoe (unlit)
  if(g.golem){bodyOpen=true;const gr=pRng(g.seed+13),s0=C(g.skin),tone=k=>s0.clone().multiplyScalar(k*(.94+gr()*.12));
    const blk=(b,w,h,d,x,y,z,k)=>part(SK.rbox(w,h,d,Math.min(w,h,d)*.18,2),tone(k||1),b,x,y,z);
    blk(B.hips,.38,.22,.28,0,-.02,0,.86);blk(B.spine,.5,.42,.34,0,.2,0);blk(B.spine,.58,.14,.37,0,.38,0,.86);
    blk(B.neck,.13,.1,.13,0,.03,0,.8);blk(B.head,.24,.22,.22,0,.1,.01);blk(B.head,.26,.05,.09,0,.165,.075,.86);
    ['L','R'].forEach((k,i)=>{const sd=i===0?1:-1;const sh=B['sh'+k];part(SK.ball(.11,8,6),tone(.9),sh,sd*.02,.02,0).scale.set(1,.8,1);
      blk(sh,.17,.2,.17,0,-.1,0);blk(B['el'+k],.15,.18,.15,0,-.09,0);blk(B['wr'+k],.17,.13,.13,0,-.06,0,.86);
      blk(B['th'+k],.19,PW.L1*.86,.19,0,-PW.L1/2,0);blk(B['kn'+k],.16,PW.L2*.86,.16,0,-PW.L2/2,0);blk(B['an'+k],.18,.08,.26,0,-.03,.04,.86);});
  }
  if(g.extras.includes('book'))part(new THREE.BoxGeometry(.13,.17,.04),C(0x2a1a50),B.wrL,.03,-.06,.04);
  // bake: every part into one geometry, each vertex bound to its bone
  const pos=[],nor=[],col=[],idx=[],si=[],sw=[],PR=[];const m=new THREE.Matrix4(),nm=new THREE.Matrix3(),v=new THREE.Vector3(),n=new THREE.Vector3();let base=0;const jr=pRng(g.seed+5);
  hips.updateMatrixWorld(true); // the bind pose: each part is baked in the figure's space, through its bone
  for(const o of parts){o.updateMatrix();m.multiplyMatrices(o.parent.matrixWorld,o.matrix);nm.getNormalMatrix(m);const geo=o.userData.geo,c=o.userData.col,bi=o.parent.userData.i;const pa=geo.attributes.position,na=geo.attributes.normal;
    if(q<1){if(!geo.boundingSphere)geo.computeBoundingSphere();if(geo.boundingSphere.radius*o.scale.x<PEOPLE_LOD.tiny){o.parent.remove(o);geo.dispose();continue;}}
    for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(m);pos.push(v.x,v.y,v.z);n.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();nor.push(n.x,n.y,n.z);
      const j=1+(jr()-.5)*.05;col.push(c.r*j,c.g*j,c.b*j);si.push(bi,0,0,0);sw.push(1,0,0,0);}
    if(geo.index){const ia=geo.index;for(let i=0;i<ia.count;i++)idx.push(ia.getX(i)+base);}else for(let i=0;i<pa.count;i++)idx.push(i+base);
    PR.push([base,pa.count]);base+=pa.count;o.parent.remove(o);geo.dispose();}
  personAO(pos,nor,col,PR);
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));geo.setIndex(idx);
  geo.computeBoundingSphere();geo.boundingSphere.radius*=1.35;
  return {geo,bones,B,hips,tris:idx.length/3,eyes};
}
function buildPerson(g,opts){
  const {geo,bones,B,hips,tris,eyes}=personBake(g,1);
  B.thL.rotation.order=B.thR.rotation.order='YXZ'; // a thigh's turn is about the pelvis's upright, before it swings (pwRun)
  // the distant copy, on the same skeleton: tickPeople swaps it in past PEOPLE_LOD.far (opts.noLod for the player)
  const lo=opts&&opts.noLod?null:personBake(g,PEOPLE_LOD.q);
  const mesh=new THREE.SkinnedMesh(geo,PEOPLE_MAT);mesh.add(hips);mesh.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));
  mesh.castShadow=true;mesh.receiveShadow=false;
  // Bone matrices stay local to the mesh. three.js feeds the shader world-space bone matrices and cancels the
  // world position back out in float32; at this world's coordinates (x, z around 25,000) that cancellation
  // loses the figure entirely. Detached binding with identity bind matrices, and bones composed from the mesh.
  mesh.bindMode='detached';mesh.bindMatrix.identity();mesh.bindMatrixInverse.identity();
  {const sk=mesh.skeleton,mats=bones.map(()=>new THREE.Matrix4()),off=new THREE.Matrix4();
    sk.update=function(){for(let i=0;i<bones.length;i++){const b=bones[i];b.updateMatrix();const p=b.parent&&b.parent.isBone?mats[b.parent.userData.i]:null;
      if(p)mats[i].multiplyMatrices(p,b.matrix);else mats[i].copy(b.matrix);off.multiplyMatrices(mats[i],this.boneInverses[i]);off.toArray(this.boneMatrices,i*16);}
      if(this.boneTexture)this.boneTexture.needsUpdate=true;};}
  const root=new THREE.Group();root.add(mesh);
  root.scale.setScalar(g.height*PW.BODY);if(g.bodyScale)root.scale.multiply(new THREE.Vector3(g.bodyScale[0],g.bodyScale[1],g.bodyScale[2]));
  const rig={root,mesh,B,g,eyes,w:{idle:1,walk:0,run:0,wave:0},phase:g.phase%1,v:0,run:false,lx:null,lz:null,lastNear:99,wavedAt:-1e9,holds:!!g.gear,tris,
    geoHi:geo,geoLo:lo?lo.geo:null,trisLo:lo?lo.tris:tris,lod:0};
  root.userData.rig=rig;PEOPLE_RIGS.add(rig);
  return rig;
}
// ── Foes on the townsfolk's body (backlog H.4, Session 171): bandits and the other human enemies ──
// A human enemy is a person: a genome seeded from its kind and where it was met (so each bandit in a camp is someone),
// dressed for what it is, on its own copy of the people's material (a wind-up's red flash, a corpse's darkening, touch it
// alone). tickPeople walks it by its enemy's position; the attack pose swings its right arm (limbs.armR is the shoulder).
// ── S226 — the weapon kit (Michael's answer A on Session 220): blades extruded from an outline with a bevel so they have an
// edge, wrapped grips, guards and pommels, a bearded axe, a flanged mace, a spiked war hammer, a staff with a crystal, a
// recurve bow, a planked round shield and a kite shield. Built once per kind (and once rusted, for the dead), merged by
// material into at most four meshes that every foe of that kind shares; hung on the gear bone (the bow in the left hand,
// a shield on the left forearm). Looks only: what a foe deals is unchanged. The grip is at the origin, the blade up +y.
const WPN_MAT={metal:new THREE.MeshStandardMaterial({vertexColors:true,metalness:.7,roughness:.34}),matte:new THREE.MeshStandardMaterial({vertexColors:true,metalness:0,roughness:.85}),
  glow:new THREE.MeshBasicMaterial({vertexColors:true}),halo:new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.15,depthWrite:false})};
const WPN_GEO=new Map();
const WPN_KINDS=['dagger','sword','cutlass','longsword','claymore','axe','greataxe','mace','flail','warhammer','greatclub','staff','bow','round','kite','tower'];
// tint (S227, the player's weapons): {metal, guard, wood, glow} colours in place of steel, brass, the bow's wood and the crystal
function wpnBuild(kind,rust,tint){tint=tint||{};
  const L=[],o=new THREE.Object3D();const RU=0x6a3e24;
  const col=(m,c)=>rust&&m==='metal'?new THREE.Color(c).lerp(new THREE.Color(RU),.62):new THREE.Color(c);
  const add=(geo,m,c,p,r,sc)=>{o.position.set(...(p||[0,0,0]));o.rotation.set(...(r||[0,0,0]));o.scale.set(...(sc||[1,1,1]));o.updateMatrix();L.push([geo,rust&&m==='metal'?'matte':m,col(m,c),o.matrix.clone()]);};
  const STEEL=tint.metal!=null?tint.metal:0xc8ccd4,DSTEEL=tint.metal!=null?new THREE.Color(tint.metal).multiplyScalar(.55).getHex():0x6a6e76,BRASS=tint.guard!=null?tint.guard:0xc8a050,WOOD=tint.wood!=null?tint.wood:0x6a4428,DWOOD=0x4a2e18,LEATH=0x3a2618;
  const GLOW=tint.glow!=null?tint.glow:0x88c0ff,HALO=tint.glow!=null?new THREE.Color(tint.glow).multiplyScalar(.7).getHex():0x4080ff;
  const blade=(len,w,tip,curve)=>{const sh=new THREE.Shape();const cv=curve||0;sh.moveTo(-w/2,0);sh.lineTo(-w/2*.92+cv*.3,len*.8);sh.quadraticCurveTo(-w/2*.7+cv,len*.93,cv,len*(1+tip));sh.quadraticCurveTo(w/2*.7+cv,len*.93,w/2*.92+cv*.3,len*.8);sh.lineTo(w/2,0);sh.lineTo(-w/2,0);
    const g=new THREE.ExtrudeGeometry(sh,{depth:.004,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:2,curveSegments:6});g.translate(0,0,-.002);return g;};
  const grip=(len,r,y0)=>{add(SK.cyl(r,r,len,10),'matte',LEATH,[0,y0+len/2,0]);for(let i=0;i<6;i++)add(SK.torus(r*1.02,r*.18,4,10),'matte',DWOOD,[0,y0+len*(i+.5)/6,0],[Math.PI/2,0,0]);};
  const K={
    sword:()=>{grip(.1,.014,-.05);add(SK.ball(.022,10,8),'metal',BRASS,[0,-.06,0]);add(SK.rbox(.15,.022,.03,.008,2),'metal',BRASS,[0,.06,0]);add(SK.ball(.012,6,5),'metal',BRASS,[.075,.06,0]);add(SK.ball(.012,6,5),'metal',BRASS,[-.075,.06,0]);add(blade(.46,.042,.08),'metal',STEEL,[0,.07,0]);},
    cutlass:()=>{grip(.1,.014,-.05);add(SK.ball(.02,10,8),'metal',BRASS,[0,-.06,0]);add(SK.torus(.045,.007,5,14,Math.PI),'metal',BRASS,[.0,.0,.0],[0,Math.PI/2,Math.PI/2]);add(SK.rbox(.1,.02,.03,.007,2),'metal',BRASS,[0,.06,0]);add(blade(.42,.05,.06,.05),'metal',STEEL,[0,.07,0]);},
    longsword:()=>{grip(.16,.015,-.1);add(SK.ball(.026,10,8),'metal',STEEL,[0,-.115,0]);add(SK.rbox(.19,.024,.034,.009,2),'metal',DSTEEL,[0,.065,0]);add(blade(.6,.046,.07),'metal',STEEL,[0,.077,0]);},
    dagger:()=>{grip(.08,.013,-.04);add(SK.ball(.018,8,6),'metal',BRASS,[0,-.05,0]);add(SK.rbox(.09,.018,.026,.006,2),'metal',BRASS,[0,.045,0]);add(blade(.2,.034,.15),'metal',STEEL,[0,.054,0]);},
    axe:()=>{add(SK.cyl(.016,.019,.5,8),'matte',WOOD,[0,.15,0]);grip(.1,.02,-.08);const sh=new THREE.Shape();sh.moveTo(0,-.03);sh.lineTo(-.06,-.05);sh.quadraticCurveTo(-.15,-.08,-.14,.02);sh.quadraticCurveTo(-.155,.1,-.1,.12);sh.lineTo(0,.04);sh.lineTo(0,-.03);
      add(new THREE.ExtrudeGeometry(sh,{depth:.006,bevelEnabled:true,bevelThickness:.005,bevelSize:.004,bevelSegments:2}),'metal',STEEL,[-.012,.34,-.003]);add(SK.rbox(.04,.07,.036,.01,2),'metal',DSTEEL,[0,.36,0]);},
    mace:()=>{add(SK.cyl(.015,.018,.4,8),'matte',DWOOD,[0,.12,0]);grip(.1,.019,-.08);add(SK.ball(.045,12,9),'metal',DSTEEL,[0,.34,0]);
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2;add(SK.rbox(.012,.09,.05,.004,1),'metal',DSTEEL,[Math.cos(a)*.035,.34,Math.sin(a)*.035],[0,-a,0]);}add(SK.cone(.02,.05,6),'metal',DSTEEL,[0,.4,0]);},
    warhammer:()=>{add(SK.cyl(.018,.022,.72,8),'matte',WOOD,[0,.22,0]);grip(.14,.023,-.12);add(SK.rbox(.2,.085,.085,.018,2),'metal',DSTEEL,[.02,.56,0]);add(SK.cone(.03,.12,6),'metal',DSTEEL,[-.14,.56,0],[0,0,Math.PI/2]);add(SK.cone(.02,.08,6),'metal',DSTEEL,[0,.64,0]);},
    staff:()=>{add(SK.bumpy(SK.cyl(.016,.022,1.0,8,10),.004,23,30),'matte',DWOOD,[0,.22,0]);for(let i=0;i<3;i++){const a=i/3*Math.PI*2;add(SK.cone(.008,.12,5),'matte',DWOOD,[Math.cos(a)*.022,.76,Math.sin(a)*.022],[Math.sin(a)*-.35,0,Math.cos(a)*.35]);}
      add(new THREE.OctahedronGeometry(.04,0),'glow',GLOW,[0,.8,0],null,[1,1.5,1]);add(SK.ball(.09,10,8),'halo',HALO,[0,.8,0]);},
    claymore:()=>{grip(.22,.016,-.14);add(SK.ball(.028,10,8),'metal',DSTEEL,[0,-.155,0]);add(SK.rbox(.27,.026,.036,.01,2),'metal',DSTEEL,[0,.065,0]);[-1,1].forEach(sd=>add(SK.ball(.016,6,5),'metal',DSTEEL,[sd*.135,.065,0]));add(blade(.76,.052,.06),'metal',STEEL,[0,.078,0]);},
    greataxe:()=>{add(SK.cyl(.018,.022,.86,8),'matte',WOOD,[0,.27,0]);grip(.14,.023,-.12);const sh=new THREE.Shape();sh.moveTo(0,-.04);sh.lineTo(-.08,-.08);sh.quadraticCurveTo(-.22,-.12,-.2,.03);sh.quadraticCurveTo(-.22,.16,-.14,.18);sh.lineTo(0,.06);sh.lineTo(0,-.04);
      add(new THREE.ExtrudeGeometry(sh,{depth:.008,bevelEnabled:true,bevelThickness:.006,bevelSize:.005,bevelSegments:2}),'metal',STEEL,[-.014,.6,-.004]);add(SK.rbox(.05,.1,.046,.012,2),'metal',DSTEEL,[0,.63,0]);add(SK.cone(.022,.09,6),'metal',DSTEEL,[.06,.63,0],[0,0,-Math.PI/2]);},
    flail:()=>{add(SK.cyl(.016,.019,.34,8),'matte',DWOOD,[0,.1,0]);grip(.1,.02,-.08);add(SK.cyl(.022,.022,.03,8),'metal',DSTEEL,[0,.28,0]);for(let i=0;i<4;i++)add(SK.torus(.014,.004,4,8),'metal',DSTEEL,[0,.31+i*.024,0],[0,i%2?Math.PI/2:0,0]);
      add(SK.ball(.045,12,9),'metal',DSTEEL,[0,.44,0]);for(let i=0;i<8;i++){const a=i/8*Math.PI*2,b=i%2?.5:-.5;add(SK.cone(.012,.04,5),'metal',STEEL,[Math.cos(a)*.045*Math.cos(b),.44+Math.sin(b)*.045,Math.sin(a)*.045*Math.cos(b)],[0,-a,-Math.PI/2+b]);}},
    greatclub:()=>{add(SK.bumpy(SK.cyl(.055,.024,.8,9,6),.006,19,4),'matte',WOOD,[0,.28,0]);grip(.12,.026,-.1);for(const y of [.46,.6])add(SK.torus(.047,.009,5,14),'metal',DSTEEL,[0,y,0],[Math.PI/2,0,0]);
      for(let i=0;i<6;i++){const a=i*1.05;add(SK.cone(.012,.035,5),'metal',DSTEEL,[Math.cos(a)*.052,.53+(i%2)*.05,Math.sin(a)*.052],[0,-a,-Math.PI/2]);}},
    bow:()=>{const pts=[];for(let i=0;i<=20;i++){const t=i/20*2-1;pts.push(new THREE.Vector3(0,t*.34,-.05*(1-t*t)+.025*Math.pow(Math.abs(t),6)));}
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),30,.011,6),'matte',WOOD);add(SK.cyl(.016,.016,.09,8),'matte',LEATH,[0,0,-.05]);add(SK.cyl(.0025,.0025,.68,4),'matte',0xe8e0c8,[0,0,.025]);},
    // S266 — the bow without its string, for first person, where the view model's own string draws back
    bowbare:()=>{const pts=[];for(let i=0;i<=20;i++){const t=i/20*2-1;pts.push(new THREE.Vector3(0,t*.34,-.05*(1-t*t)+.025*Math.pow(Math.abs(t),6)));}
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),30,.011,6),'matte',WOOD);add(SK.cyl(.016,.016,.09,8),'matte',LEATH,[0,0,-.05]);},
    round:()=>{const R=.19;for(let i=0;i<5;i++){const w=R*2/5,x=-R+w*(i+.5),h=2*Math.sqrt(Math.max(0,R*R-x*x));add(SK.rbox(.02,h*.98,w*.96,.004,1),'matte',tint.face!=null?new THREE.Color(tint.face).multiplyScalar([1,.88,1.08][i%3]).getHex():[0x7a5230,0x6a4628,0x82583a][i%3],[0,0,x]);}
      add(SK.torus(R,.012,6,28),'metal',DSTEEL,[0,0,0],[0,Math.PI/2,0]);add(SK.ball(.05,12,8,0,Math.PI*2,0,Math.PI/2),'metal',DSTEEL,[.012,0,0],[0,0,-Math.PI/2]);},
    // S231 — a tower shield: four planks bowed round the bearer (the edges swept back), iron bands at the edges and across,
    // a boss; faced +x like the others
    tower:()=>{const bend=g=>{const p=g.attributes.position;for(let i=0;i<p.count;i++){const z=p.getZ(i);p.setX(i,p.getX(i)-z*z*.9);}g.computeVertexNormals();return g;};const W=.46,H=.74;
      for(let i=0;i<4;i++){const w=W/4,z=-W/2+w*(i+.5);add(bend(SK.rbox(.024,H,w*.97,.005,1).translate(0,0,z)),'matte',tint.face!=null?new THREE.Color(tint.face).multiplyScalar([1,.9,1.06,.94][i]).getHex():[0x6a4a2a,0x5e4226,0x74502e,0x644628][i]);}
      for(const z of [-W/2,W/2])add(bend(SK.rbox(.036,H+.02,.02,.006,1).translate(.004,0,z)),'metal',DSTEEL);for(const y of [-H/2,0,H/2])add(bend(SK.rbox(.034,.022,W,.006,1).translate(.004,y,0)),'metal',DSTEEL);
      add(SK.ball(.055,12,8,0,Math.PI*2,0,Math.PI/2),'metal',BRASS,[.016,.04,0],[0,0,-Math.PI/2]);},
    kite:()=>{const sh=new THREE.Shape();sh.moveTo(0,.24);sh.quadraticCurveTo(.17,.24,.16,.1);sh.quadraticCurveTo(.13,-.12,0,-.3);sh.quadraticCurveTo(-.13,-.12,-.16,.1);sh.quadraticCurveTo(-.17,.24,0,.24);
      add(new THREE.ExtrudeGeometry(sh,{depth:.02,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:2}),'matte',tint.face!=null?tint.face:0x7a2020,[0,0,0],[0,Math.PI/2,0]);
      // S231 — the boss and rivets on the +x face, the face every shield turns outward from the left forearm (it faced the body)
      add(SK.ball(.045,12,8,0,Math.PI*2,0,Math.PI/2),'metal',BRASS,[.028,.05,0],[0,0,-Math.PI/2]);for(const [a,b2] of [[.2,.1],[-.24,0]])add(SK.ball(.012,6,5),'metal',BRASS,[.03,a,b2]);}
  };
  (K[kind]||K.sword)();
  // merge by material: vertex colours carry each part's colour
  const by={};for(const [geo,m,c,mx] of L)(by[m]=by[m]||[]).push([geo,c,mx]);
  const out=[];const v=new THREE.Vector3(),nm=new THREE.Matrix3();
  for(const m in by){const P=[],N=[],C=[],I=[];for(const [geo,c,mx] of by[m]){const g=geo.index?geo:geo,p=g.attributes.position,n=g.attributes.normal,b=P.length/3;nm.getNormalMatrix(mx);
      for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mx);P.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();N.push(v.x,v.y,v.z);C.push(c.r,c.g,c.b);}
      if(g.index){const ix=g.index.array;for(let i=0;i<ix.length;i++)I.push(ix[i]+b);}else for(let i=0;i<p.count;i++)I.push(b+i);geo.dispose();}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);g.computeBoundingSphere();
    out.push({geo:g,mat:m});}
  return out;
}
function buildWeapon(kind,opts){opts=opts||{};const t=opts.tint;const key=kind+(opts.rust?'|rust':'')+(t?'|'+[t.metal,t.guard,t.wood,t.glow,t.face].join(','):'');let parts=WPN_GEO.get(key);if(!parts){parts=wpnBuild(kind,!!opts.rust,t);WPN_GEO.set(key,parts);}
  const G=new THREE.Group();G.name='weapon:'+kind;G.userData.wpn=kind;for(const p of parts){const m=new THREE.Mesh(p.geo,WPN_MAT[p.mat]);m.castShadow=false;G.add(m);}return G;}
const FOE_DRESS={
  'Bandit':        {cloth:0x4a3a2a,hat:'hood',wpn:['sword','axe'],shield:'round',shieldP:.35}, // S226 — armed from the weapon kit (wpn), a shield at shieldP
  'Bandit Archer': {cloth:0x3a4a2a,hat:'hood',wpn:'bow'},
  'Highwayman':    {cloth:0x2a2a30,hat:'brim',wpn:['sword','axe']},
  'Deserter':      {cloth:0x5a5a4a,hat:'helm',wpn:['mace','spear'],shield:'kite'},
  'Cultist':       {cloth:0x3a1414,hat:'hood',wpn:'dagger'},
  'Rogue Mage':    {cloth:0x2a2a5a,hat:'hood',wpn:'staff'},
  'Pirate':        {cloth:0x3a2a2a,hat:'kerchief',wpn:'cutlass'},
  'Bandit Captain':{cloth:0x3a2418,hat:'helm',wpn:'sword'}, // S175 — the shield on the left shoulder; tickPeople holds the guard
  'Skeleton':      {skel:true}, // S172 — the bones on the people's own skeleton: it walks, runs and strikes as they do
  'Hollowed':      {dead:true,skin:0x8a8478,cloth:0x46423a,hat:'none',gear:null}, // S173 — the risen dead
  'Ghoul':         {dead:true,skin:0x6a7a5a,cloth:0x34362a,hat:'none',gear:null},
  'Ash Wight':     {dead:true,skin:0x5a5450,cloth:0x24201e,hat:'helm',gear:'spear'},
  'Wraith':        {dead:true,wraith:true,skin:0x5e6c84,cloth:0x3a4458,hat:'hood',gear:null}, // S176 — robed, pale, see-through, gliding
  'Phantom':       {dead:true,wraith:true,phantom:true,skin:0x8a9ac8,cloth:0x2e3a78,hat:'none',gear:null}, // S212 — the dungeon's lesser ghost: bare-headed, bluer, fainter
  'Goblin':        {goblin:true,cloth:0x5a4a32,gear:'stick'}, // S184 — the folklore goblin (Michael's A): green, big-headed, long ears, ragged hide
  'Goblin Slinger':{goblin:true,cloth:0x4e4430,gear:null},
  'Marsh Hag':     {hag:true,cloth:0x3a4a2a,hat:'hood',gear:'stick'}, // S216 — the fen's witch, a lair's mistress: an old woman in bog rags, hooded, a crooked staff
  'Shieldbearer':  {cloth:0x3a3e4a,hat:'helm',wpn:'mace'}, // S199 — the dungeon's shield wall: a person, the shield on the left arm as the captain's
  'Kobold Thief':  {kobold:true,cloth:0x4a3a2a,hat:'hood',gear:'hammer'}, // S196 — the dungeon's kobold, on the same body
  'Kobold':        {kobold:true,cloth:0x6a3a22,hat:'hood',gear:'hammer'}, // S184 — the old mine-sprite (Michael's B): bearded, hooded, a mattock
  // S208 — the trolls on the people's body (Michael's answer on Session 201: as shown, a hammer for the cane): heavy, stooped,
  // tusked, in a hide tunic, carrying a maul; the hide by where they live
  'Cave Troll':    {troll:true,skin:0x6e7a5c,skin2:0x5a664c,hair:0x3a3e30,eye:0xd0a020,cloth:0x4e4030,gear:'maul'},
  'Forest Troll':  {troll:true,skin:0x5a6e40,skin2:0x4a5a34,hair:0x2e3420,eye:0xd8b030,cloth:0x4a3a26,gear:'maul'},
  'Gargoyle':      {gargoyle:true,skin:0x77746c,eye:0xff5020}, // S210 — a winged stone figure that sleeps as a statue, crouched, until you come close
  'Golem':         {golem:true,skin:0x7c776e,rune:0x6ab0ff}, // S209 — dressed stone on the people's bones, a blue rune-light in the seams
  'Frost Troll':   {troll:true,skin:0xaebac2,skin2:0x96a4ae,hair:0xe0e4e8,eye:0x70b0ff,cloth:0x5a5048,gear:'maul'},
  // S221 — the Ogre (Michael's answer on Session 214: as shown): the people's body grown huge and fat, bald and ruddy,
  // sometimes bearded, in a leather kilt, carrying a knotted tree-limb club
  'Ogre':          {ogre:true,cloth:0x6a5034,gear:'club'}
};
function buildFoe(type,x,z,genome,eyeCol){
  let g=genome;
  if(!g){const dr=FOE_DRESS[type]||FOE_DRESS.Bandit;const def={name:type+' '+Math.round(x)+','+Math.round(z),role:'villager',bCol:dr.cloth||0x3a3a3a};
    g=personGenome(def,{key:'foe'});g.hat=dr.hat||'none';g.gear=dr.gear;g.cloak=false;g.dress=false;g.apron=null;g.extras=[];
    g.legs=new THREE.Color(0x2a2218);g.sleeve=new THREE.Color(dr.cloth||0x3a3a3a).multiplyScalar(.8);
    if(dr.goblin){const r=pRng(g.seed+7);g.goblin=true;g.skin=new THREE.Color(0x7a9a4a).lerp(new THREE.Color(0x5a7a3a),r());g.head=1.32;g.build=.92;g.nose=[1.7,1.5];g.beard='none';g.age='adult';g.ruddy=false;g.freckles=false;
      g.style=r()<.5?'shaggy':'buzz';g.hair=new THREE.Color(0x2a2016);g.eye=new THREE.Color(0xd8b030);g.cloth=new THREE.Color(dr.cloth);g.sleeve=new THREE.Color(dr.cloth).multiplyScalar(.8);g.legs=new THREE.Color(0x3a2e20);g.boot=new THREE.Color(0x2a2016);}
    if(dr.kobold){g.style='buzz';g.head=1.25;g.build=1.05;g.age='elder';g.beard='long';g.hair=new THREE.Color(0x8a8a82);g.skin=new THREE.Color(0xb08a6a);g.nose=[1.5,1.4];g.height=Math.min(g.height,.86);
      g.cloth=new THREE.Color(dr.cloth);g.sleeve=new THREE.Color(dr.cloth).multiplyScalar(.85);g.legs=new THREE.Color(0x3a3028);}
    if(dr.troll){const r=pRng(g.seed+11);g.troll=true;g.skin=new THREE.Color(dr.skin).lerp(new THREE.Color(dr.skin2),r());g.height=1;g.build=1.75;g.head=1.15;g.age='elder';g.beard='none';g.hat='none';
      g.style=r()<.5?'buzz':'shaggy';g.hair=new THREE.Color(dr.hair);g.nose=[2.2,1.8];g.ears=1.3;g.eye=new THREE.Color(dr.eye);g.ruddy=false;g.freckles=false;g.female=false;
      g.cloth=new THREE.Color(dr.cloth);g.sleeve=g.skin.clone();g.legs=g.skin.clone().multiplyScalar(.9);g.boot=g.skin.clone().multiplyScalar(.7);g.bodyScale=[1.15,1,1.1];}
    if(dr.ogre){const r=pRng(g.seed+13);g.ogre=true;g.skin=new THREE.Color(0xb88a68).lerp(new THREE.Color(0x9a7050),r());g.height=1;g.build=1.95;g.head=1.1;g.style='thin';g.hair=new THREE.Color(0x3a2a1a);
      g.beard=r()<.5?'short':'none';g.nose=[2.3,1.7];g.ears=1.5;g.eye=new THREE.Color(0x6a4a20);g.ruddy=true;g.freckles=false;g.female=false;g.age='adult';g.hat='none';
      g.cloth=new THREE.Color(dr.cloth);g.sleeve=g.skin.clone();g.legs=g.skin.clone().multiplyScalar(.92);g.boot=new THREE.Color(0x3a2a1a);g.bodyScale=[1.2,1,1.25];}
    if(dr.hag){g.female=true;g.age='elder';g.beard='none';g.style='straight';g.hair=new THREE.Color(0x8a8a78);g.skin.lerp(new THREE.Color(0x9aa078),.35);g.nose=[1.8,1.7];g.ruddy=false;g.freckles=false;
      g.dress=true;g.cloak=true;g.cloth=new THREE.Color(dr.cloth);g.sleeve=new THREE.Color(dr.cloth).multiplyScalar(.8);g.trim=new THREE.Color(0x2a3020);g.legs=new THREE.Color(0x2a2a20);g.boot=new THREE.Color(0x1e1a14);g.eye=new THREE.Color(0xc8c060);}
    if(dr.gargoyle){const r=pRng(g.seed+17);g.gargoyle=true;g.skin=new THREE.Color(dr.skin).multiplyScalar(.94+r()*.1);g.height=.95;g.build=1.05;g.head=1.1;g.style='buzz';g.hair=g.skin.clone().multiplyScalar(.8);
      g.cloth=g.skin.clone().multiplyScalar(.9);g.sleeve=g.skin.clone();g.legs=g.skin.clone();g.boot=g.skin.clone().multiplyScalar(.8);g.trim=g.skin.clone().multiplyScalar(.75);g.eye=new THREE.Color(dr.eye);
      g.nose=[1.4,1.1];g.ears=1.4;g.beard='none';g.hat='none';g.gear=null;g.ruddy=false;g.freckles=false;g.female=false;g.age='elder';g.tattoo=false;}
    if(dr.golem){g.golem=true;g.skin=new THREE.Color(dr.skin);g.build=1.5;g.height=1;g.gear=null;g.hat='none';g.female=false;g.rune=dr.rune;}
    if(dr.skel){g.skel=true;g.skin=new THREE.Color(0xd8d0b8);g.gear=(g.seed&1)?'spear':'stick';g.build=1;g.height*=.98;}
    // the risen dead (S173): the living genome gone grey, in rags, stooped (the elder's stoop), the eyes lit
    if(dr.dead){g.dead=true;g.skin.lerp(new THREE.Color(dr.skin),.75);g.hair.lerp(new THREE.Color(0x5a5a52),.55);g.age='elder';g.ruddy=false;g.freckles=false;
      g.cloth=new THREE.Color(dr.cloth);g.sleeve=new THREE.Color(dr.cloth).multiplyScalar(.75);g.boot=new THREE.Color(0x1e1a16);if(eyeCol!=null)g.eye=new THREE.Color(eyeCol);}
    // a wraith: a long robe to the ground under a cloak and hood, the feet lost in it; it glides (tickPeople)
    if(dr.wraith){g.wraith=true;g.dress=true;g.cloak=true;g.beard='none';g.style='buzz';g.brow=[1.2,.25];g.legs=new THREE.Color(dr.cloth).multiplyScalar(.6);g.boot=g.legs.clone();g.trim=new THREE.Color(dr.cloth).multiplyScalar(.7);g.hair.set(0x2a2e38);}
    if(dr.phantom){g.phantom=true;g.style='straight';g.hair.set(0x9aa4c4);}
    // S226 — a weapon from the kit by what the foe is (a spear stays the gear kit's); a skeleton's club becomes a rusted sword
    if(dr.wpn){const r=pRng(g.seed+23);const w=Array.isArray(dr.wpn)?dr.wpn[Math.floor(r()*dr.wpn.length)]:dr.wpn;
      if(w==='spear')g.gear='spear';else{g.wpn=w;g.gear=w==='bow'?null:'kit';}
      if(dr.shield&&r()<(dr.shieldP==null?1:dr.shieldP))g.shieldKit=dr.shield;}
    if(g.skel&&g.gear==='stick'){g.gear='kit';g.wpn='sword';}}
  const rig=buildPerson(g);rig.foe=true;rig.mesh.material=PEOPLE_MAT.clone();
  // S226 — the kit's weapon in the fist (the bow in the left hand), a shield on the left forearm; the dead's are rusted
  if(g.wpn){const w=buildWeapon(g.wpn,{rust:!!(g.skel||g.dead)});if(g.wpn==='bow'){w.position.set(0,-.05,.01);rig.B.wrL.add(w);}else rig.B.gear.add(w);rig.weapon=w;}
  if(g.shieldKit){const sh=buildWeapon(g.shieldKit);sh.position.set(.07,-.05,.02);sh.scale.setScalar(.9);rig.B.elL.add(sh);rig.shieldKit=sh;}
  if(g.wraith){const m=rig.mesh.material;m.transparent=true;m.opacity=g.phantom?.5:.68;rig.mesh.castShadow=false;}
  // a golem's rune-light: a slit for eyes and an X cut in the chest, unlit, on the head and spine bones
  if(g.golem){const rm=new THREE.MeshBasicMaterial({color:g.rune||0x6ab0ff});const hang=(b,w,h,x,y,z,rz)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.02),rm);m.position.set(x,y,z);m.rotation.z=rz||0;b.add(m);return m;};
    rig.runes=[hang(rig.B.head,.15,.026,0,.11,.126),hang(rig.B.spine,.022,.3,0,.2,.175,.6),hang(rig.B.spine,.022,.3,0,.2,.175,-.6)];}
  // a skeleton's eyes burn in its sockets (the enemy's eye colour), one small unlit mesh on the head
  if(g.gargoyle){rig.w.idle=0;rig.w.crouch=1;rig.fold=1;eyeCol=0xff5020;}
  if((g.skel||g.dead||g.gargoyle)&&eyeCol!=null){const at=g.skel?[[.028,.09,.066],[-.028,.09,.066]]:rig.eyes;const P=[],I=[];for(const [ex,ey,ez] of at){const g1=new THREE.SphereGeometry(g.skel?.011:.008,6,4),a=g1.attributes.position.array,ix=g1.index.array,n0=P.length/3;for(let i=0;i<a.length;i+=3)P.push(a[i]+ex,a[i+1]+ey,a[i+2]+ez);for(let i=0;i<ix.length;i++)I.push(ix[i]+n0);g1.dispose();}
    const eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));eg.setIndex(I);rig.B.head.add(new THREE.Mesh(eg,new THREE.MeshBasicMaterial({color:eyeCol})));}
  return rig;
}
function buildNPCMesh(def,opts){
  opts=opts||{};if(def._twin)opts=Object.assign({},opts,{key:(opts.key||'')+'#'+def._twin}); // S248 — a second Cathal in Dunmore is another man
  const key=(def.name||'')+'|'+(opts.key||'');
  // the same name in the same place is the same person, behind the counter as in the street
  let g=def.name&&!def.authored?PEOPLE_GENOMES.get(key):null;
  if(!g){g=personGenome(def,opts);if(def.name)PEOPLE_GENOMES.set(key,g);}
  return buildPerson(g).root;
}
// ── poses: joint -> [x,y,z] rotations, plus the height of the hips ──
// S187 — the legs a quarter longer (Michael, playtest s162: the legs read short, the torso long). LEGK scales the thigh and
// shin, DL is what that adds under the hips, and BODY scales the whole figure back so a person stands as tall as before
// (buildPerson's root): the head and trunk come out 8% smaller, the legs 15% longer, of the same height.
const PW={JOINTS:['hips','spine','neck','head','shL','elL','wrL','shR','elR','wrR','thL','knL','anL','thR','knR','anR'],LEGK:1.4,FOOT:.07,HIPJ:.02,DUTY:.62};
PW.L1=.2*PW.LEGK;PW.L2=.19*PW.LEGK;PW.DL=.38*(PW.LEGK-1);PW.STRIDE=.16*PW.LEGK;PW.HIPS=.47+PW.DL;PW.BODY=1.225/(1.225+PW.DL);
PW.GREET=false; // S185 — townsfolk no longer wave as you walk up (tickPeople)
PW.cycle=2*PW.STRIDE/PW.DUTY; // ground covered per stride cycle, in figure units
function pwZero(){const p={};PW.JOINTS.forEach(j=>p[j]=[0,0,0]);p.sway=0;p.hipsY=0;return p;}
const pwClamp=x=>Math.max(-1,Math.min(1,x));
// two-bone IK in the leg's plane: the thigh and knee angles that put the ankle at (z, y) from the hip joint
function pwIK(z,y){const L1=PW.L1,L2=PW.L2,h=-y;const d=Math.min(Math.hypot(z,h),L1+L2-1e-4);
  const k=Math.PI-Math.acos(pwClamp((L1*L1+L2*L2-d*d)/(2*L1*L2)));const b=Math.acos(pwClamp((L1*L1+d*d-L2*L2)/(2*L1*d)));return [Math.atan2(-z,h)-b,k];}
function pwReach(th,kn){return PW.L1*Math.cos(th)+PW.L2*Math.cos(th+kn)+PW.FOOT;}
function pwHold(p,swing,gear){const bend=gear==='stick'?-.45:-1.2;p.shR=[-.12+swing,0,-.1];p.elR=[bend,0,0];p.wrR=[0,0,0];}
function pwIdle(t,o){const p=pwZero();const b=Math.sin(t*1.7),w=Math.sin(t*.37),old=o.elder?1:0;
  p.spine=[.02*b-.01+.13*old,0,.015*w];p.hips=[0,.04*w,-.02*w];p.neck=[-.01*b-.08*old,.35*Math.sin(t*.23)*Math.sin(t*.11+1),0];p.head=[.03*Math.sin(t*.29)-.04*old,0,.02*w];
  p.shL=[.02*b,0,.07+.01*b];p.shR=[.02*b,0,-.07-.01*b];p.elL=[-.12,0,0];p.elR=[-.12,0,0];p.wrL=[0,0,.05];p.wrR=[0,0,-.05];
  p.thL=[-.03,0,.02*w+.02];p.thR=[.03,0,.02*w-.02];p.knL=[.06+.04*Math.max(0,w)+.06*old,0,0];p.knR=[.06+.04*Math.max(0,-w)+.06*old,0,0];
  p.anL=[-.03,0,-.02];p.anR=[-.03,0,.02];p.sway=.012*w;
  p.hipsY=Math.max(pwReach(p.thL[0],p.knL[0]),pwReach(p.thR[0],p.knR[0]))+PW.HIPJ;
  if(o.holds)pwHold(p,.02*b,o.gear);return p;}
// A stride: each foot is planted for DUTY of it, sliding back under the body at a steady speed, then swings
// forward on an eased arc. The two feet overlap on the ground, so something is always carrying the body.
function pwWalk(ph,o){const p=pwZero();const S=PW.STRIDE,D=PW.DUTY,phL=ph%1,phR=(phL+.5)%1,a=Math.PI*2*phL;
  p.hipsY=PW.FOOT+PW.HIPJ+(.352-.01*Math.cos(2*a))*PW.LEGK; // the hip joint's height over the foot, scaled with the leg
  const c=Math.cos(a),s=Math.sin(a);
  p.hips=[0,-.07*c,.025*s];
  // the pelvis turns and tips as it walks, which carries each hip joint fore and aft: the leg aims from where
  // the joint actually is, so the planted foot stays put and the joint moves around it
  const foot=(f,sd)=>{let z,lift=0,toe=0;
    if(f<D){z=S-2*S*(f/D);}else{const u=(f-D)/(1-D),e=u*u*(3-2*u);z=-S+2*S*e;lift=.055*PW.LEGK*Math.sin(Math.PI*u);toe=.3*Math.sin(Math.PI*Math.min(1,u*1.4));}
    const x0=sd*.085;const r=pwIK(z+x0*Math.sin(p.hips[1]),PW.FOOT+lift-(p.hipsY-PW.HIPJ)-x0*Math.sin(p.hips[2]));return [r[0],r[1],-(r[0]+r[1])+toe];};
  const L=foot(phL,1),Rr=foot(phR,-1);
  // the pelvis sways and tips sideways over the standing foot; the thighs aim across so the feet stay put
  p.sway=.014*s;const Lz=p.hipsY-PW.HIPJ-PW.FOOT,lat=-(p.sway+Lz*Math.sin(p.hips[2]))/Lz;
  p.thL=[L[0],-p.hips[1],.02+lat];p.knL=[L[1],0,0];p.anL=[L[2],0,0];p.thR=[Rr[0],-p.hips[1],-.02+lat];p.knR=[Rr[1],0,0];p.anR=[Rr[2],0,0];
  p.spine=[.07,.11*c,-.02*s];p.neck=[-.05,-.04*c,0];p.head=[-.02,0,-.01*s];
  p.shL=[.32*c,0,.09];p.shR=[-.32*c,0,-.09];
  p.elL=[-.24-.2*Math.max(0,-Math.cos(a-.6)),0,0];p.elR=[-.24-.2*Math.max(0,Math.cos(a-.6)),0,0];
  p.wrL=[-.08,0,.05];p.wrR=[-.08,0,-.05];
  if(o.holds)pwHold(p,-.08*c,o.gear);return p;}
// A run (S162): each foot is down for only a third of the stride, so both are off the ground between steps. The
// body sits lowest over the standing foot and rises through the flight; the heel kicks up behind as the leg swings
// through, the trunk leans in, and the arms pump bent. Past PW.RUN.on figure-heights a second (a person is about a
// unit tall) the gait blends from the walk into this; back under PW.RUN.off.
PW.RUN={STRIDE:.25*PW.LEGK,DUTY:.33,HIPS:PW.FOOT+PW.HIPJ+.288*PW.LEGK,BOB:.018*PW.LEGK,LIFT:.15*PW.LEGK,on:1.4,off:1.15};
PW.RUN.cycle=2*PW.RUN.STRIDE/PW.RUN.DUTY;
function pwRun(ph,o){const p=pwZero();const R=PW.RUN,S=R.STRIDE,D=R.DUTY,phL=ph%1,phR=(phL+.5)%1,a=Math.PI*2*phL;
  p.hipsY=R.HIPS-R.BOB*Math.cos(Math.PI*4*(phL-D/2));
  const c=Math.cos(a),s=Math.sin(a);
  p.hips=[0,-.09*c,.02*s];
  const foot=(f,sd)=>{let z,lift=0,toe=0;
    if(f<D){z=S-2*S*(f/D);}else{const u=(f-D)/(1-D),e=u*u*(3-2*u);z=-S+2*S*e;lift=R.LIFT*Math.sin(Math.PI*Math.pow(u,.65));toe=.45*Math.sin(Math.PI*Math.min(1,u*1.3));}
    const x0=sd*.085;const r=pwIK(z+x0*Math.sin(p.hips[1]),PW.FOOT+lift-(p.hipsY-PW.HIPJ)-x0*Math.sin(p.hips[2]));return [r[0],r[1],-(r[0]+r[1])+toe];};
  const L=foot(phL,1),Rr=foot(phR,-1);
  p.sway=.008*s;const Lz=p.hipsY-PW.HIPJ-PW.FOOT,lat=-(p.sway+Lz*Math.sin(p.hips[2]))/Lz;
  // the thighs turn back against the pelvis's twist (their Euler order is YXZ), so a planted foot is not dragged sideways
  p.thL=[L[0],-p.hips[1],.01+lat];p.knL=[L[1],0,0];p.anL=[L[2],0,0];p.thR=[Rr[0],-p.hips[1],-.01+lat];p.knR=[Rr[1],0,0];p.anR=[Rr[2],0,0];
  p.spine=[.2,.15*c,-.015*s];p.neck=[-.14,-.08*c,0];p.head=[-.04,0,-.01*s];
  p.shL=[.6*c,0,.12];p.shR=[-.6*c,0,-.12];
  p.elL=[-1.2-.3*Math.max(0,-Math.cos(a-.4)),0,0];p.elR=[-1.2-.3*Math.max(0,Math.cos(a-.4)),0,0];
  p.wrL=[-.1,0,.1];p.wrR=[-.1,0,-.1];
  if(o.holds)pwHold(p,-.15*c,o.gear);return p;}
// the ground one stride cycle covers, for a mix of walk and run
function pwCycle(w){const a=w.walk||0,b=w.run||0;return a+b>.001?(a*PW.cycle+b*PW.RUN.cycle)/(a+b):PW.cycle;}
function pwWave(t,o){const p=pwIdle(t,o);const w=Math.sin(t*7.5);
  if(o.holds){p.shL=[-.25,0,2.35];p.elL=[0,.2,.55-.42*w];p.wrL=[0,0,-.25*w];p.neck=[0,.18,0];p.head=[.04,0,.08];p.spine=[p.spine[0],.06,-.03];}
  else{p.shR=[-.25,0,-2.35];p.elR=[0,-.2,-.55+.42*w];p.wrR=[0,0,.25*w];p.neck=[0,-.18,0];p.head=[.04,0,-.08];p.spine=[p.spine[0],-.06,.03];}
  return p;}
// blend toward the chosen motion over about a third of a second
// S210 — a crouch on the haunches, leaning forward with the head up, the hands down by the feet: the gargoyle's statue pose
function pwCrouch(t,o){const p=pwZero();const h=.2,z=.07;const [th,kn]=pwIK(z,-h);
  p.thL=[th,0,.12];p.thR=[th,0,-.12];p.knL=[kn,0,0];p.knR=[kn,0,0];p.anL=[-(th+kn)+.05,0,-.08];p.anR=[-(th+kn)+.05,0,.08];
  p.spine=[.6,0,0];p.neck=[-.35,0,0];p.head=[-.3,0,0];p.shL=[-.75,0,.18];p.shR=[-.75,0,-.18];p.elL=[-.35,0,0];p.elR=[-.35,0,0];p.wrL=[.3,0,0];p.wrR=[.3,0,0];
  p.hipsY=h+PW.FOOT+PW.HIPJ;return p;}
function pwBlend(rig,mode,t,ph,dt,o){const w=rig.w;const k=1-Math.exp(-dt/.11);for(const m in w)w[m]+=((m===mode?1:0)-w[m])*k;
  const out=pwZero();let tot=0;
  for(const m in w){const wm=w[m];if(wm<.001)continue;tot+=wm;const p=m==='walk'?pwWalk(ph,o):m==='run'?pwRun(ph,o):m==='wave'?pwWave(t,o):m==='crouch'?pwCrouch(t,o):pwIdle(t,o);
    PW.JOINTS.forEach(j=>{const a=out[j],b=p[j];a[0]+=b[0]*wm;a[1]+=b[1]*wm;a[2]+=b[2]*wm;});out.sway+=p.sway*wm;out.hipsY+=p.hipsY*wm;}
  if(tot>0){PW.JOINTS.forEach(j=>{const a=out[j];a[0]/=tot;a[1]/=tot;a[2]/=tot;});out.sway/=tot;out.hipsY/=tot;}return out;}
function pwApply(rig,P){const B=rig.B;PW.JOINTS.forEach(j=>{const r=P[j];B[j].rotation.set(r[0],r[1],r[2]);});
  B.hips.position.y=P.hipsY;B.hips.position.x=P.sway;
  // the wrist keeps a held shaft upright whatever the arm is doing
  B.gear.rotation.x=-(P.hips[0]+P.spine[0]+P.shR[0]+P.elR[0]+P.wrR[0]);B.gear.rotation.z=-(P.hips[2]+P.spine[2]+P.shR[2]+P.elR[2]+P.wrR[2]);}
// The sun's shadow pass draws every townsperson from the distant copy, whatever the range: a person's shadow is
// ~25 texels tall in the 2048 map, where the two copies cast the same shape. The renderer has already listed each
// mesh's geometry for the eye before it draws the shadows, so swapping it for the shadow pass alone costs nothing.
// (A second mesh on a shadow-only layer does not work in r128: its shadow pass tests layers against the eye's camera.)
{const _smRender=REN.shadowMap.render;
  REN.shadowMap.render=function(){const sw=[];
    if(PEOPLE_LOD.shadowLo)for(const rig of PEOPLE_RIGS){if(rig.geoLo&&rig.mesh.geometry===rig.geoHi){rig.mesh.geometry=rig.geoLo;sw.push(rig);}}
    if(WOLF_LOD.shadowLo)for(const rig of WOLF_RIGS){if(rig.geoLo&&rig.mesh.geometry===rig.geoHi){rig.mesh.geometry=rig.geoLo;sw.push(rig);}}
    try{return _smRender.apply(this,arguments);}finally{for(const rig of sw)rig.mesh.geometry=rig.geoHi;}};}
// Every person in the active scene, each frame: the stride is driven by how far the figure moved, so the
// feet stay planted whatever moves it (the town's schedules, an interior amble, a legacy zone's wander).
// S267 — cloaks and hair that swing (Michael's A on Session 242: the cloak and the back hair, for everyone who wears them):
// the cloak's two bones and the back hair's are each a damped pendulum in pitch and roll, driven by how the bone's pivot
// moves in the world (its acceleration along the heading and across it, gravity plus the vertical, a drag with the square
// of the forward speed), less what the parent bone has already turned, so it hangs in the world; clamped so the cloak never
// swings into the back. Near people only (the full-detail copy); standing still it settles to the rest pose.
const PEND={cloak:{L:.3,c:3.4,drag:.3,lo:-.05,hi:.85,side:.45},cloak2:{L:.2,c:3,drag:.2,lo:0,hi:.6,side:.35},hairB:{L:.26,c:2.2,drag:.12,lo:-.5,hi:1.1,side:.8}};
const _pw=new THREE.Vector3(),_pq=new THREE.Quaternion(),_pq2=new THREE.Quaternion(),_pe=new THREE.Euler();
function peopleSwing(rig,dt){if(!(dt>0))return;const sw=rig.sw||(rig.sw={});const root=rig.root;root.updateMatrixWorld(true);root.getWorldQuaternion(_pq).invert();
  const ry=(rig.foe&&root.parent?root.parent.rotation.y:0)+root.rotation.y,fw0=Math.sin(ry),fw1=Math.cos(ry),sx0=Math.cos(ry),sx1=-Math.sin(ry),G=9.8;dt=Math.min(dt,.05);
  for(const k in PEND){const b=rig.B[k];if(!b)continue;const P=PEND[k],L=P.L*(root.scale.x||1);
    const st=sw[k]||(sw[k]={p:0,vp:0,r:0,vr:0,last:null,vel:null});b.getWorldPosition(_pw);
    let vx=0,vy=0,vz=0,ax=0,ay=0,az=0;if(st.last){vx=(_pw.x-st.last[0])/dt;vy=(_pw.y-st.last[1])/dt;vz=(_pw.z-st.last[2])/dt;}
    if(st.vel){ax=(vx-st.vel[0])/dt;ay=(vy-st.vel[1])/dt;az=(vz-st.vel[2])/dt;const al=Math.hypot(ax,ay,az);if(al>40){ax*=40/al;ay*=40/al;az*=40/al;}}
    if(Math.hypot(vx,vy,vz)>30){vx=vy=vz=ax=ay=az=0;} // a jump (a teleport, a rebuild) is not a swing
    st.last=[_pw.x,_pw.y,_pw.z];st.vel=[vx,vy,vz];
    const vf=vx*fw0+vz*fw1,af=ax*fw0+az*fw1,as=ax*sx0+az*sx1,gy=G+ay;
    st.vp+=(-gy/L*Math.sin(st.p)+af/L*Math.cos(st.p)+P.drag*vf*Math.abs(vf)/L-P.c*st.vp)*dt;st.p+=st.vp*dt;
    st.vr+=(-gy/L*Math.sin(st.r)-as/L*Math.cos(st.r)-P.c*st.vr)*dt;st.r+=st.vr*dt;
    b.parent.getWorldQuaternion(_pq2).premultiply(_pq);_pe.setFromQuaternion(_pq2,'XZY');
    b.rotation.x=Math.max(P.lo,Math.min(P.hi,st.p-_pe.x));b.rotation.z=Math.max(-P.side,Math.min(P.side,st.r-_pe.z));}}
function tickPeople(dt,now){
  for(const rig of PEOPLE_RIGS){
    const root=rig.root;
    // a foe's body (S171) hangs in its enemy's group: that group is what stands in the scene, and the enemy's own
    // position is where it is (the lunge's lurch moves the group, not the feet)
    const top=rig.foe?root.parent:root;
    if(!root.parent||(rig.foe&&!top.parent)){PEOPLE_RIGS.delete(rig);try{rig.geoHi.dispose();if(rig.geoLo)rig.geoLo.dispose();if(rig.foe)rig.mesh.material.dispose();}catch(e){}continue;}
    if(top.parent!==scene||!top.visible||!root.visible)continue;
    if(rig.foe&&rig.e&&rig.e.dead)continue; // a body on the ground lies still
    const at=rig.foe&&rig.e?rig.e:top.position;
    // level of detail by distance from the eye, with a gap between the two thresholds so no one flickers at the line
    if(rig.geoLo){const cd=Math.hypot(CAM.position.x-at.x,CAM.position.z-at.z);
      const lod=rig.lod?(cd>PEOPLE_LOD.near?1:0):(cd>PEOPLE_LOD.far?1:0);
      if(lod!==rig.lod){rig.lod=lod;rig.mesh.geometry=lod?rig.geoLo:rig.geoHi;}}
    let d=rig.lx==null?0:Math.hypot(at.x-rig.lx,at.z-rig.lz);rig.lx=at.x;rig.lz=at.z;
    if(d>1.5)d=0; // a teleport, not a stride
    const spd=dt>0?d/dt:0,s=(root.scale.x||1)*(rig.foe?(top.scale.x||1):1);
    rig.phase=(rig.phase+d/(pwCycle(rig.w)*s))%1;
    // walk or run by the pace, smoothed over a few frames, in heights a second
    rig.v+=(spd-rig.v)*(1-Math.exp(-dt/.15));
    if(!rig.run&&rig.v/s>PW.RUN.on)rig.run=true;else if(rig.run&&rig.v/s<PW.RUN.off)rig.run=false;
    const near=Math.hypot(px-at.x,pz-at.z);
    // the greeting wave when you walk up is switched off (Michael, playtest s162: it looks odd in the street); the pose
    // stays in the kit for scripted moments: set rig.wavedAt=performance.now() and the rig waves for 2.2 seconds
    if(PW.GREET&&!rig.foe&&near<2.8&&rig.lastNear>=2.8&&spd<.05&&now-rig.wavedAt>25000)rig.wavedAt=now;
    rig.lastNear=near;
    let mode=now-rig.wavedAt<2200?'wave':spd>.08?(rig.run?'run':'walk'):'idle';
    if(rig.g.gargoyle&&rig.e&&rig.e.dormant)mode='crouch'; // S210 — a sleeping gargoyle is a statue
    if(rig.g.wraith){mode='idle';root.position.y=.24+.05*Math.sin(now*.0021+rig.g.phase);} // a wraith takes no steps: it glides, a little off the ground
    const t=now/1000*rig.g.tempo+rig.g.phase;
    pwApply(rig,pwBlend(rig,mode,t,rig.phase,dt,{holds:rig.holds,gear:rig.g.gear,elder:rig.g.age==='elder'}));
    if((rig.B.cloak||rig.B.hairB)&&!rig.lod)peopleSwing(rig,dt); // S267
    // a captain's shield guard (S175): while it is up the left arm holds the shield across the body, the elbow bent
    // a gargoyle's wings fold down its back while it sleeps and spread and beat slowly once it wakes; the tail sways
    if(rig.g.gargoyle){const f=rig.e&&rig.e.dormant?1:0;rig.fold+=(f-rig.fold)*(1-Math.exp(-dt/.3));const fo=rig.fold,beat=Math.sin(now*.005+rig.g.phase)*(1-fo);
      rig.B.wingL.rotation.set(.1+.2*fo,.35+.95*fo,-.75*fo+.3*beat);rig.B.wingR.rotation.set(.1+.2*fo,-.35-.95*fo,.75*fo-.3*beat);
      rig.B.tail.rotation.set(.35*fo,.3*Math.sin(now*.0017+rig.g.phase)*(1-fo),0);}
    if(rig.foe&&rig.e&&rig.e.shieldUp){const L=rig.e.limbs;if(L&&L.shieldArm){L.shieldArm.rotation.x=L.shieldArmUpX;L.shieldArm.rotation.z=L.shieldArmUpZ;rig.B.elL.rotation.x=-1.1;}}
  }
}
