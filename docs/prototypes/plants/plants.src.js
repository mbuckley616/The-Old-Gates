// Plant prototype (backlog H.5a): every herb sized and shaped by what it is, baked to one vertex-coloured
// geometry per kind so the world's InstancedMesh path (herbGeoFor/herbInstances) could take it unchanged.
// A townsperson is about 1.1 units tall; today every herb is a .2-.3 unit tuft whatever it is.

// the herbs' colours and shapes, copied from HERB_DEF in index.html
const HERBS={
  firemoss:['Firemoss',0xcc4411,0x6a2808,'clump'],silverleaf:['Silverleaf',0xc8ddc8,0x3a6a3a,'leaf'],heartroot:['Heartroot',0xffaa22,0x6a4010,'root'],
  ashwort:['Ashwort',0x7a8a5a,0x4a5a2a,'clump'],muirfhear:['Muirfhear',0x2a3a18,0x1a2a08,'spike'],goldenrod:['Goldenrod',0xddaa22,0x5a7020,'spike'],
  thornberry:['Thornberry',0xcc2222,0x4a2808,'berry'],coldmoss:['Coldmoss',0x7799bb,0x3a5a6a,'clump'],fearnog:['Fearnóg',0xcc6622,0x5a3010,'fungus'],
  shadowcap:['Shadowcap',0x441166,0x221033,'fungus'],wolfsbane:["Wolf's Bane",0xeeeedd,0x4a6a28,'spike'],caorthann:['Caorthann',0xdd3322,0x3a2010,'berry'],
  deepmoss:['Deepmoss',0x116622,0x0a3310,'clump'],briarweed:['Briarweed',0x7a5522,0x4a3010,'fern'],luibhuisce:['Luibh Uisce',0x44ccaa,0x2a6a4a,'leaf'],
  ferrousweed:['Ferrous Weed',0xaa4422,0x5a2810,'spike'],graywort:['Graywort',0xaaaaaa,0x5a5a5a,'leaf'],caordubh:['Caor Dubh',0x110011,0x220011,'berry'],
  mistfern:['Mist Fern',0xccddcc,0x4a6a4a,'fern'],stonecress:['Stonecress',0xddcc66,0x5a5020,'clump'],veilwort:['Veilwort',0xeeeebb,0x6a6a40,'leaf'],
  credearg:['Cré Dearg',0xcc4422,0x5a2010,'clump'],duilleogghorm:['Duilleog Ghorm',0x2244aa,0x112244,'leaf']
};
// what each one is, and so how big (height in units; a person is 1.1)
const PLANT_KIND={
  firemoss:'moss',coldmoss:'moss',deepmoss:'moss',credearg:'clay',graywort:'rosette',stonecress:'cliffflower',
  silverleaf:'herb',luibhuisce:'waterleaf',duilleogghorm:'broadleaf',veilwort:'wisp',heartroot:'root',
  muirfhear:'tussock',goldenrod:'goldenrod',wolfsbane:'flowerspike',ferrousweed:'thistle',
  mistfern:'fern',briarweed:'bramble',ashwort:'shrub',thornberry:'bush',caordubh:'lowbush',caorthann:'sapling',
  fearnog:'bracket',shadowcap:'mushrooms'
};

// ── the old tuft, copied from mkHerbMesh (for the before picture) ──
function oldHerb(key){const [,col,stemCol,shape]=HERBS[key];const g=new THREE.Group();
  const stemMat=new THREE.MeshLambertMaterial({color:stemCol}),leafMat=new THREE.MeshLambertMaterial({color:col});
  const R=rng(key+'old');const numSprigs=shape==='single'?1:2+Math.floor(R()*3);
  for(let s=0;s<numSprigs;s++){const ox=(R()-.5)*.28,oz=(R()-.5)*.28;
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.012,.018,.16+R()*.06,5),stemMat);stem.position.set(ox,.08,oz);stem.rotation.z=(R()-.5)*.5;g.add(stem);
    if(shape==='root'){const root=new THREE.Mesh(new THREE.SphereGeometry(.1,7,6),leafMat);root.position.set(ox,.22,oz);root.scale.set(1,.7,1);g.add(root);
      for(let l=0;l<3;l++){const ang=l*(Math.PI*2/3);const f=new THREE.Mesh(new THREE.SphereGeometry(.055,5,4),new THREE.MeshLambertMaterial({color:0x4a8a28}));f.scale.set(.5,1.4,.5);f.position.set(ox+Math.sin(ang)*.1,.28,oz+Math.cos(ang)*.1);g.add(f);}}
    else if(shape==='leaf'){for(let l=0;l<2;l++){const ang=R()*Math.PI;const leaf=new THREE.Mesh(new THREE.SphereGeometry(.085,6,4),leafMat);leaf.scale.set(.6,.12,1);leaf.position.set(ox+Math.sin(ang)*.08,.18+l*.04,oz+Math.cos(ang)*.08);leaf.rotation.z=ang;g.add(leaf);}}
    else if(shape==='spike'){const sp=new THREE.Mesh(new THREE.ConeGeometry(.04,.22,5),leafMat);sp.position.set(ox,.2,oz);g.add(sp);}
    else if(shape==='berry'){for(let b=0;b<3;b++){const be=new THREE.Mesh(new THREE.SphereGeometry(.04,5,4),leafMat);be.position.set(ox+(R()-.5)*.12,.18+R()*.06,oz+(R()-.5)*.12);g.add(be);}}
    else if(shape==='fungus'){const cap=new THREE.Mesh(new THREE.SphereGeometry(.1,6,5),leafMat);cap.scale.set(1,.45,1);cap.position.set(ox,.2,oz);g.add(cap);const st=new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,.14,6),stemMat);st.position.set(ox,.1,oz);g.add(st);}
    else if(shape==='fern'){for(let f=0;f<3;f++){const ang=f*(Math.PI*2/3)+R()*.3;const fr=new THREE.Mesh(new THREE.SphereGeometry(.075,5,4),leafMat);fr.scale.set(.3,1.4,.8);fr.position.set(ox+Math.sin(ang)*.1,.2,oz+Math.cos(ang)*.1);fr.rotation.y=ang;g.add(fr);}}
    else{const cl=new THREE.Mesh(new THREE.SphereGeometry(.075+R()*.025,5,4),leafMat);cl.scale.set(1,.5,1);cl.position.set(ox,.12,oz);g.add(cl);}}
  let tris=0;g.traverse(o=>{if(o.isMesh)tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;});
  return {root:g,tris:Math.round(tris)};
}

// ── a seeded dice so a kind always bakes the same ──
function rng(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return((h>>>0)%100000)/100000;};}

// ── the bake: parts as [geometry, matrix, colour], one BufferGeometry with vertex colours ──
// Shading is baked in the way the wolf's counter-shading is: lower and downward-facing is darker (the plant's own shade).
function Plant(){this.parts=[];}
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(0,0,0,'YXZ');
Plant.prototype.add=function(geo,p,r,s,col){_e.set(r?r[0]:0,r?r[1]:0,r?r[2]:0,'YXZ');_q.setFromEuler(_e);
  const m=new THREE.Matrix4().compose(new THREE.Vector3(p[0],p[1],p[2]),_q,new THREE.Vector3(s?s[0]:1,s?s[1]:1,s?s[2]:1));
  this.parts.push([geo,m,new THREE.Color(col)]);return this;};
// a leaf: base at the point, reaching out along its yaw at an elevation, drooping at the tip
function leafGeo(len,wid,thick,droop){const f=-wid*.18,v=[[0,0,0],[-wid*.4,f,len*.3],[0,0,len*.3],[wid*.4,f,len*.3],[-wid*.34,f,len*.66],[0,0,len*.66],[wid*.34,f,len*.66],[0,0,len]];
  const ix=[0,1,2,0,2,3,2,1,4,2,4,5,2,5,6,2,6,3,5,4,7,5,7,6],pos=[];for(const i of ix){const p=v[i];pos.push(p[0],p[1]-(droop||0)*(p[2]/len)*(p[2]/len),p[2]);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));return g;}
function stalkGeo(h,r0,r1,seg){const g=SK.cyl(r1,r0,h,seg||5,3);g.translate(0,h/2,0);return g;}
function bladeGeo(h,w,bend){const g=SK.cone(w,h,3,4);g.translate(0,h/2,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i)/h;p.setZ(i,p.getZ(i)+bend*y*y);}return g;}
Plant.prototype.bake=function(){
  let n=0;const flat=this.parts.map(([g,m,c])=>{const gg=(g.index?g.toNonIndexed():g.clone());gg.applyMatrix4(m);n+=gg.attributes.position.count;return [gg,c];});
  let top=.001;flat.forEach(([g])=>{const p=g.attributes.position;for(let i=0;i<p.count;i++)top=Math.max(top,p.getY(i));});
  const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);let o=0;
  flat.forEach(([g,c])=>{g.computeVertexNormals();const p=g.attributes.position,nn=g.attributes.normal;
    for(let i=0;i<p.count;i++,o++){pos.set([p.getX(i),p.getY(i),p.getZ(i)],o*3);const ny=nn.getY(i);nor.set([nn.getX(i),ny,nn.getZ(i)],o*3);
      const k=(.62+.38*Math.min(1,p.getY(i)/top*1.4))*(.84+.16*ny);col.set([c.r*k,c.g*k,c.b*k],o*3);}});
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setAttribute('color',new THREE.BufferAttribute(col,3));
  out.computeBoundingBox();out.computeBoundingSphere();return out;};
const shade=(c,k)=>{const x=new THREE.Color(c);x.multiplyScalar(k);return x;};
const mixc=(a,b,t)=>new THREE.Color(a).lerp(new THREE.Color(b),t);

// ── the kinds ──
const BUILD={
  // a low cushion patch, wide rather than tall: moss on stone or the forest floor
  moss(P,R,col,stem,key){const n=5+Math.floor(R()*3);for(let i=0;i<n;i++){const a=i/n*6.283+R(),r=i?.12+R()*.16:0,s=.11+R()*.08;
      P.add(SK.bumpy(SK.ball(1,10,6,0,6.283,0,1.7),.18,9,R()*9),[Math.sin(a)*r,-.01,Math.cos(a)*r],[0,R()*6,0],[s,s*.42,s],mixc(col,stem,R()*.35));}
    if(key==='firemoss')for(let i=0;i<14;i++){const a=R()*6.283,r=R()*.3;P.add(SK.ball(.012,4,3),[Math.sin(a)*r,.045,Math.cos(a)*r],0,0,0xffaa44);}},
  // a lumpy wet red mound on the bank
  clay(P,R,col,stem){for(let i=0;i<4;i++){const a=i*1.7+R(),r=i?.08+R()*.06:0,s=.07+R()*.05;P.add(SK.bumpy(SK.ball(1,8,5),.2,6,R()*5),[Math.sin(a)*r,s*.25,Math.cos(a)*r],0,[s*1.3,s*.8,s*1.1],mixc(col,stem,R()*.4));}
    for(let i=0;i<5;i++){const a=R()*6.283;P.add(bladeGeo(.1+R()*.06,.008,.03),[Math.sin(a)*.14,.02,Math.cos(a)*.14],[.2,a,0],0,0x4a5a2a);}},
  // a flat ring of leaves pressed to the ground (road edges)
  rosette(P,R,col){for(let ring=0;ring<2;ring++){const n=ring?6:9;for(let i=0;i<n;i++){const a=i/n*6.283+ring*.35;P.add(leafGeo(ring?.09:.16,ring?.05:.07,.012,.01),[0,.01+ring*.012,0],[-(.08+ring*.25),a,0],0,shade(col,ring?1.08:.95));}}},
  // a cliff plant: a tight rosette and short stems of small flower heads
  cliffflower(P,R,col,stem){for(let i=0;i<8;i++){const a=i/8*6.283;P.add(leafGeo(.08,.035,.01,.01),[0,.01,0],[-.3,a,0],0,0x5a7a3a);}
    for(let i=0;i<5;i++){const a=R()*6.283,t=.08+R()*.12;const x=Math.sin(a)*.03,z=Math.cos(a)*.03,tip=[x+Math.sin(a)*.05,t,z+Math.cos(a)*.05];P.add(stalkGeo(t,.005,.004,4),[x,0,z],[.3*(R()-.5)+.25,a,0],0,stem);
      for(let k=0;k<5;k++)P.add(SK.ball(.013,5,4),[tip[0]+(R()-.5)*.03,tip[1]+R()*.02,tip[2]+(R()-.5)*.03],0,0,col);}},
  // an ordinary leafy herb, knee-low: pale broad leaves on short stems
  herb(P,R,col,stem){const n=9+Math.floor(R()*4);for(let i=0;i<n;i++){const a=i*2.4+R()*.4,t=.05+R()*.18;P.add(stalkGeo(t,.007,.005,4),[0,0,0],[.35,a,0],0,stem);
      P.add(leafGeo(.12+R()*.05,.07,.012,.03),[Math.sin(a)*t*.34,t,Math.cos(a)*t*.34],[-.25+R()*.3,a,0],0,shade(col,.9+R()*.2));}},
  // waterside: round glossy leaves, some standing, some floating
  waterleaf(P,R,col,stem){for(let i=0;i<14;i++){const a=R()*6.283,r=R()*.18,t=.03+R()*.22;P.add(stalkGeo(t,.006,.005,4),[Math.sin(a)*r,0,Math.cos(a)*r],[.15,a,0],0,stem);
      P.add(leafGeo(.09,.08,.012,.01),[Math.sin(a)*r,t,Math.cos(a)*r],[-.1,a+R(),0],0,shade(col,.85+R()*.3));}},
  // big deep-blue leaves from the base, arching like a hosta
  broadleaf(P,R,col,stem){for(let i=0;i<8;i++){const a=i/8*6.283+R()*.3;P.add(leafGeo(.26+R()*.06,.14,.016,.12),[0,.02,0],[-(.55+R()*.35),a,0],0,shade(col,.85+R()*.3));}
    P.add(stalkGeo(.36,.008,.006,4),[0,0,0],0,0,stem);for(let k=0;k<6;k++)P.add(SK.ball(.018,5,4),[(R()-.5)*.02,.26+k*.018,(R()-.5)*.02],0,0,0x6a88ee);},
  // near-invisible: a few hair-thin pale stems with faint drooping bells
  wisp(P,R,col,stem){for(let i=0;i<6;i++){const a=R()*6.283,t=.16+R()*.12,lean=.2+R()*.2;P.add(bladeGeo(t,.005,.04),[0,0,0],[0,a,0],0,stem);
      P.add(SK.cone(.02,.035,6,1,true),[Math.sin(a)*.04,t-.02,Math.cos(a)*.04],[Math.PI,a,0],0,col);}
    for(let i=0;i<6;i++){const a=i/6*6.283;P.add(leafGeo(.07,.025,.008,.02),[0,.01,0],[-.35,a,0],0,shade(col,.8));}},
  // leaves up top, the amber root crown showing at the ground: the thing you dig for
  root(P,R,col,stem){P.add(SK.lathe([[.001,-.02],[.07,.0],[.085,.05],[.06,.09],[.001,.1]],9),[0,0,0],0,0,col);
    for(let i=0;i<3;i++){const a=i*2.1+R();P.add(SK.limb(.14,.03,.012),[Math.sin(a)*.06,.02,Math.cos(a)*.06],[1.25,a,0],0,shade(col,.8));}
    for(let i=0;i<7;i++){const a=i/7*6.283,t=.12+R()*.12;P.add(stalkGeo(t,.008,.006,4),[0,.08,0],[.3,a,0],0,stem);P.add(leafGeo(.13,.06,.012,.04),[Math.sin(a)*t*.3,.08+t,Math.cos(a)*t*.3],[-.2,a,0],0,0x4a8a28);}},
  // moor grass: a dense tussock of fine blades, knee-high, the tops bending out
  tussock(P,R,col,stem){P.add(SK.bumpy(SK.ball(1,8,5,0,6.283,0,1.7),.15,7,R()*4),[0,-.02,0],0,[.14,.1,.14],stem);
    for(let i=0;i<40;i++){const a=R()*6.283,r=R()*.1;P.add(bladeGeo(.3+R()*.22,.011,.07+R()*.1),[Math.sin(a)*r,.02,Math.cos(a)*r],[0,a,0],0,mixc(col,0x6a6a3a,R()*.45));}},
  // tall: waist-high stalks, each ending in an arching yellow plume
  goldenrod(P,R,col,stem){for(let i=0;i<6;i++){const a=R()*6.283,r=R()*.1,t=.55+R()*.25,lean=(R()-.5)*.18;const bx=Math.sin(a)*r,bz=Math.cos(a)*r;
      P.add(stalkGeo(t,.011,.007,5),[bx,0,bz],[lean,a,0],0,stem);
      for(let k=0;k<6;k++){const y=.08+k*t*.1;const la=R()*6.283;P.add(leafGeo(.09,.022,.008,.02),[bx+Math.sin(lean)*y*Math.sin(a),y,bz+Math.sin(lean)*y*Math.cos(a)],[-.3,la,0],0,0x5a7a2a);}
      const tx=bx+Math.sin(lean)*t*Math.sin(a),tz=bz+Math.sin(lean)*t*Math.cos(a);
      for(let k=0;k<5;k++){const pa=a+(k-2)*.5;P.add(SK.bumpy(SK.ball(1,6,4),.2,11,k),[tx+Math.sin(pa)*.04,t-.12+k*.03,tz+Math.cos(pa)*.04],[-.9,pa,0],[.028,.028,.1],shade(col,.9+R()*.2));}}},
  // a white flower spike: a leafy base and tall hooded blooms up the stem
  flowerspike(P,R,col,stem){for(let i=0;i<7;i++){const a=i/7*6.283;P.add(leafGeo(.13,.07,.012,.04),[0,.03,0],[-.35,a,0],0,0x3a5a28);}
    for(let s=0;s<3;s++){const a=s*2.1+R(),t=.42+R()*.18,bx=Math.sin(a)*.04,bz=Math.cos(a)*.04;P.add(stalkGeo(t,.009,.006,5),[bx,0,bz],[.06,a,0],0,stem);
      for(let k=0;k<9;k++){const y=t*.5+k*t*.055,fa=k*2.3;P.add(SK.ball(.022,5,3),[bx+Math.sin(fa)*.022,y,bz+Math.cos(fa)*.022],[0,fa,0],[1,1.25,.9],shade(col,.92+R()*.1));}}},
  // a thistle: spiny rust-red leaves up a stout stem and a bristling head
  thistle(P,R,col,stem){for(let s=0;s<2;s++){const a=s*3+R(),t=.3+R()*.14,bx=Math.sin(a)*.05,bz=Math.cos(a)*.05;P.add(stalkGeo(t,.014,.009,5),[bx,0,bz],0,0,stem);
      for(let k=0;k<5;k++){const la=k*2.4+s,y=.04+k*t*.15;P.add(leafGeo(.16-k*.018,.075,.01,.03),[bx,y,bz],[-.35,la,0],0,shade(col,.7));for(let q=0;q<3;q++)P.add(SK.cone(.006,.04,3),[bx+Math.sin(la)*(.04+q*.035),y+.012,bz+Math.cos(la)*(.04+q*.035)],[0,la,1.2],0,shade(col,.6));}
      P.add(SK.ball(.04,8,6),[bx,t,bz],0,0,shade(col,.55));P.add(SK.bumpy(SK.lathe([[.02,0],[.045,.02],[.035,.06],[.001,.07]],8),.008,20,s),[bx,t+.01,bz],0,0,col);}},
  // a fern: arching fronds from a crown, leaflets shrinking to the tip
  fern(P,R,col,stem){const n=7;for(let f=0;f<n;f++){const a=f/n*6.283+R()*.3,L=.5+R()*.12,el=1.25+R()*.2;
      let x=0,y=.02,z=0,ang=el;const seg=9,dl=L/seg;
      for(let k=0;k<seg;k++){const nx=x+Math.sin(a)*Math.cos(ang)*dl,ny=y+Math.sin(ang)*dl,nz=z+Math.cos(a)*Math.cos(ang)*dl;
        const w=.09*(1-k/seg)+.015;for(const sd of[-1,1])P.add(leafGeo(w,.03,.006,.01),[nx,ny,nz],[-(ang*.4)+.05,a+sd*1.35,0],0,shade(col,.9+k*.02));
        x=nx;y=ny;z=nz;ang-=.19;}
      P.add(SK.cyl(.004,.006,.05,4),[0,.02,0],0,0,stem);}},
  // bramble: long canes arching over and back to the ground, a leaf here and there
  bramble(P,R,col,stem){for(let i=0;i<6;i++){const a=R()*6.283,r=i?.08+R()*.1:0,sz=.1+R()*.05;P.add(SK.bumpy(SK.ball(1,7,5),.22,8,R()*6),[Math.sin(a)*r,.08,Math.cos(a)*r],0,[sz,sz*.7,sz],mixc(0x3a4a22,col,.3+R()*.3));}
    for(let c=0;c<9;c++){const a=R()*6.283,L=.5+R()*.3,seg=10;let x=0,y=0,z=0;
      for(let k=0;k<seg;k++){const t=(k+1)/seg,ny=Math.sin(t*Math.PI)*(.26+R()*.04),nx=Math.sin(a)*L*t,nz=Math.cos(a)*L*t;
        const dx=nx-x,dy=ny-y,dz=nz-z,d=Math.hypot(dx,dy,dz);const g=SK.cyl(.007,.008,d,4,1,true);g.translate(0,d/2,0);
        P.add(g,[x,y,z],[Math.atan2(Math.hypot(dx,dz),dy),Math.atan2(dx,dz),0],0,stem);
        if(k<seg-2)for(const sd of[1,-1])P.add(leafGeo(.08,.06,.008,.02),[nx,ny,nz],[-.1,a+sd*(1+R()*.5),0],0,mixc(0x4a5a22,col,.35+R()*.3));x=nx;y=ny;z=nz;}}},
  // a grey-green moor shrub: a low mound of small twiggy clumps
  shrub(P,R,col,stem){for(let i=0;i<4;i++){const a=R()*6.283;P.add(stalkGeo(.2,.012,.008,4),[0,0,0],[.5,a,0],0,stem);}
    for(let i=0;i<9;i++){const a=R()*6.283,r=i?.08+R()*.14:0,s=.1+R()*.06;P.add(SK.bumpy(SK.ball(1,8,6),.22,8,R()*6),[Math.sin(a)*r,.2+R()*.12-r*.4,Math.cos(a)*r],0,[s,s*.8,s],mixc(col,0x9aa888,R()*.4));}},
  // a berry bush, knee-high and wider than tall, red clusters hanging on the outside
  bush(P,R,col,stem,key){const leaf=key==='thornberry'?0x3a5a22:0x2a4a1a;
    for(let i=0;i<5;i++){const a=R()*6.283;P.add(stalkGeo(.25,.014,.01,4),[0,0,0],[.55,a,0],0,stem);}
    const blobs=[];for(let i=0;i<11;i++){const a=R()*6.283,r=i?.14+R()*.18:0,s=.13+R()*.07,y=.3+R()*.12-r*.45;blobs.push([a,r,s,y]);P.add(SK.bumpy(SK.ball(1,8,5),.2,8,R()*6),[Math.sin(a)*r,y,Math.cos(a)*r],0,[s,s*.85,s],mixc(leaf,0x6a8a3a,R()*.3));}
    for(let c=0;c<9;c++){const [a,r,s,y]=blobs[1+Math.floor(R()*10)];const oa=a+(R()-.5)*.6,rr=r+s*.9;
      for(let k=0;k<5;k++)P.add(SK.ball(.024,5,3),[Math.sin(oa)*rr+(R()-.5)*.04,y-.02-R()*.05,Math.cos(oa)*rr+(R()-.5)*.04],0,0,shade(col,.9+R()*.2));}},
  lowbush(P,R,col,stem,key){const leaf=0x2a3a20;for(let i=0;i<7;i++){const a=R()*6.283,r=i?.08+R()*.12:0,s=.1+R()*.05;P.add(SK.bumpy(SK.ball(1,8,6),.2,8,R()*6),[Math.sin(a)*r,.2+R()*.08-r*.4,Math.cos(a)*r],0,[s,s*.8,s],mixc(leaf,0x4a5a30,R()*.3));}
    for(let c=0;c<7;c++){const a=R()*6.283,r=.16+R()*.08,y=.12+R()*.16;for(let k=0;k<4;k++)P.add(SK.ball(.022,5,3),[Math.sin(a)*r+(R()-.5)*.04,y+(R()-.5)*.04,Math.cos(a)*r+(R()-.5)*.04],0,0,0x1a0a20);}},
  // a young rowan: a slim grey trunk, feathered leaves and heavy red clusters, head-high to a child
  sapling(P,R,col,stem){P.add(stalkGeo(.75,.028,.014,6),[0,0,0],[0,0,.04],0,0x6a6258);
    for(let b=0;b<4;b++){const a=b*1.6+R(),y=.4+b*.1;P.add(stalkGeo(.24,.012,.006,4),[0,y,0],[.9,a,0],0,0x6a6258);
      const tx=Math.sin(a)*.2,tz=Math.cos(a)*.2,ty=y+.12;
      for(let l=0;l<5;l++){const la=a+(l-2)*.55;P.add(leafGeo(.16,.05,.01,.04),[tx,ty,tz],[-.1,la,0],0,shade(0x3a6a2a,.9+R()*.2));}
      for(let k=0;k<10;k++)P.add(SK.ball(.022,5,3),[tx+(R()-.5)*.08,ty-.05-R()*.06,tz+(R()-.5)*.08],0,0,shade(col,.9+R()*.2));}
    for(let l=0;l<5;l++){const la=l*1.26;P.add(leafGeo(.16,.05,.01,.04),[0,.76,0],[-.3,la,0],0,0x3a6a2a);}},
  // shelves of bracket fungus on an old stump
  bracket(P,R,col,stem){P.add(SK.bumpy(SK.cyl(.13,.16,.28,10,3),.012,14,2),[0,.14,0],0,0,0x4a3a2a);P.add(SK.cyl(.12,.12,.01,10),[0,.285,0],0,0,0x8a7458);
    for(let i=0;i<7;i++){const a=R()*6.283,y=.05+R()*.2,w=.07+R()*.04;P.add(SK.lathe([[.001,.012],[w,.004],[w*.95,-.008],[.001,-.012]],10),[Math.sin(a)*.14,y,Math.cos(a)*.14],[0,0,0],[1,1,.7],shade(col,.85+R()*.3));}},
  // a cluster of mushrooms: stalks and domed caps, one tall, several small
  mushrooms(P,R,col,stem){for(let i=0;i<6;i++){const a=R()*6.283,r=i?.06+R()*.1:0,s=i?.5+R()*.4:1.1,h=.12*s,cr=.06*s;
      P.add(SK.lathe([[.012*s,0],[.014*s,h*.5],[.011*s,h]],6),[Math.sin(a)*r,0,Math.cos(a)*r],[0,0,(R()-.5)*.3],0,0xcfc4d0);
      P.add(SK.lathe([[.001,-.004],[cr*.9,.0],[cr,.012*s],[cr*.7,.04*s],[.001,.05*s]],9),[Math.sin(a)*r,h,Math.cos(a)*r],0,0,shade(col,.9+R()*.3));}}
};
function buildHerb(key){const [name,col,stem]=HERBS[key],kind=PLANT_KIND[key];const P=new Plant(),R=rng(key);BUILD[kind](P,R,col,stem,key);
  const geo=P.bake();const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,metalness:0,side:THREE.DoubleSide}));
  mesh.castShadow=true;mesh.receiveShadow=true;const bb=geo.boundingBox;
  return {root:mesh,name,kind,tris:geo.attributes.position.count/3,h:bb.max.y,w:Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)};}
// a plain stand-in for a townsperson, 1.1 units, for scale
function personStandIn(){const g=SK.lathe([[.001,0],[.07,0],[.09,.05],[.11,.45],[.14,.6],[.13,.78],[.06,.84],[.05,.88],[.075,.95],[.07,1.05],[.001,1.1]],14);
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x8a8078,roughness:.9}));m.castShadow=true;return m;}
