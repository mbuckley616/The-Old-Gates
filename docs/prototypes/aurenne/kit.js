// the game's own shape kit (js/32-people.js) and part merge (js/80-world-terrain.js), copied by build.py so the
// prototype draws with what the builder will use. mergeParts is called with no AO here (the game passes HAO).
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
function mergeParts(parts,ao){ // parts: [{geo, color:THREE.Color, x,y,z, rx,ry,rz, sx,sy,sz}]; ao: shade the creases (personAO's options)
    const pos=[],nor=[],col=[],PR=[];
    const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),n=new THREE.Vector3(),nm=new THREE.Matrix3();
    parts.forEach(p=>{
      const g=p.geo.index?p.geo.toNonIndexed():p.geo;
      e.set(p.rx||0,p.ry||0,p.rz||0);q.setFromEuler(e);
      m.compose(new THREE.Vector3(p.x||0,p.y||0,p.z||0),q,new THREE.Vector3(p.sx==null?1:p.sx,p.sy==null?1:p.sy,p.sz==null?1:p.sz));
      nm.getNormalMatrix(m);
      const pa=g.attributes.position,na=g.attributes.normal;
      for(let i=0;i<pa.count;i++){
        v.set(pa.getX(i),pa.getY(i),pa.getZ(i)).applyMatrix4(m);pos.push(v.x,v.y,v.z);
        n.set(na.getX(i),na.getY(i),na.getZ(i)).applyMatrix3(nm).normalize();nor.push(n.x,n.y,n.z);
        // per-vertex jitter keeps big flat colour fields from reading as plastic
        const j=1+(Math.random()-.5)*(p.jitter==null?.08:p.jitter);
        col.push(p.color.r*j,p.color.g*j,p.color.b*j);
      }
      PR.push([pos.length/3-pa.count,pa.count]);
      if(g!==p.geo)g.dispose();
    });
    const raw=ao&&ao.keep?{pos:pos.slice(),nor:nor.slice(),col:col.slice(),PR}:null; // a comparison's copy, before the shading
    if(ao){const t0=performance.now();personAO(pos,nor,col,PR,ao);HAO.ms+=performance.now()-t0;HAO.n++;}
    const out=new THREE.BufferGeometry();if(raw)out.userData.raw=raw;
    out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    out.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
    out.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    out.computeBoundingSphere();
    return out;
  }
