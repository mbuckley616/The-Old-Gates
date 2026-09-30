// A verbatim copy of the game's shape kit SK (index.html, Session 153/191), so this page stands alone.
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
window.SK=SK;
