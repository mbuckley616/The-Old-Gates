// Houses prototype (backlog H.5, Session 179): today's buildingGeo beside a more detailed one, per nation.
// Loaded by houses.html after three.js and SK (the wolf prototype's copy of the game's kit). Everything bakes to one
// vertex-coloured geometry per house, as the game's buildings do (one draw call). +z is the front, the door faces it.
function hRng(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return((h>>>0)%100000)/100000;};}
// today's parts list and merge, copied from index.html (mergeParts, buildingGeo), for the before picture
function mergeParts(parts,R){const pos=[],nor=[],col=[];const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),n=new THREE.Vector3(),nm=new THREE.Matrix3();
  parts.forEach(p=>{const g=p.geo.index?p.geo.toNonIndexed():p.geo;if(!g.attributes.normal)g.computeVertexNormals();e.set(p.rx||0,p.ry||0,p.rz||0);q.setFromEuler(e);
    m.compose(new THREE.Vector3(p.x||0,p.y||0,p.z||0),q,new THREE.Vector3(p.sx==null?1:p.sx,p.sy==null?1:p.sy,p.sz==null?1:p.sz));nm.getNormalMatrix(m);
    const pa=g.attributes.position,na=g.attributes.normal;for(let i=0;i<pa.count;i++){v.set(pa.getX(i),pa.getY(i),pa.getZ(i)).applyMatrix4(m);pos.push(v.x,v.y,v.z);
      n.set(na.getX(i),na.getY(i),na.getZ(i)).applyMatrix3(nm).normalize();nor.push(n.x,n.y,n.z);const j=1+((R?R():Math.random())-.5)*(p.jitter==null?.08:p.jitter);col.push(p.color.r*j,p.color.g*j,p.color.b*j);}});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return g;}
const STYLE={
  irish:{wall:0xe6e0d0,wall2:0xd4ccb8,roof:0xb8925a,roof2:0x9a7844,plinth:0x565048,frame:0x3a2a1a,framed:false,h:2.4,rise:1.5,thatch:true,twoStory:0,door:0x2f5e3a,shutter:null},
  french:{wall:0xdccfb0,wall2:0xc8ba98,roof:0x55596a,roof2:0x43475a,plinth:0x7a746a,frame:0x3e2c1c,framed:true,h:3.1,rise:2.3,thatch:false,twoStory:.55,door:0x5a3820,shutter:0x3a5a4a,slate:true},
  mark:{wall:0x4a3826,wall2:0x3a2c1e,roof:0x26221e,roof2:0x1c1815,plinth:0x55524c,frame:0x2a1a10,framed:false,h:2.6,rise:2.3,thatch:false,twoStory:.15,door:0x1a1612,shutter:null,long:true,shingle:true},
  aurenne:{wall:0xf0e4cc,wall2:0xe2d4b6,roof:0xb86a3a,roof2:0xa05a30,plinth:0x8a7a6a,frame:0x8a6a4a,framed:false,h:3.1,rise:.9,thatch:false,twoStory:.6,door:0x3a5a8a,shutter:0x3a6a9a,tile:true}
};
function oldBuilding(w,d,st,r,two){const parts=[];const c=x=>new THREE.Color(x);const H=(st.h||2.6)+(two?2.2:0),plinthH=.22;const wallC=c(st.wall).lerp(c(st.wall2),r()*.6);
  parts.push({geo:new THREE.BoxGeometry(w+.12,plinthH+.3,d+.12),color:c(st.plinth),y:plinthH/2-.15,jitter:.10});parts.push({geo:new THREE.BoxGeometry(w,H,d),color:wallC,y:plinthH+H/2,jitter:.05});
  if(st.framed){const fc=c(st.frame);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>parts.push({geo:new THREE.BoxGeometry(.16,H,.16),color:fc,x:sx*(w/2),z:sz*(d/2),y:plinthH+H/2,jitter:.04}));parts.push({geo:new THREE.BoxGeometry(w+.02,.12,d+.02),color:fc,y:plinthH+H*.55,jitter:.04});}
  if(two){parts.push({geo:new THREE.BoxGeometry(w+.3,.22,d+.3),color:c(st.frame),y:plinthH+H-2.2,jitter:.04});[-w*.28,w*.28].forEach(wx=>{parts.push({geo:new THREE.BoxGeometry(.6,.7,.08),color:c(0x2a2622),x:wx,y:plinthH+H-1.1,z:d/2+.02,jitter:0});});}
  const rise=st.rise||1.6,over=st.thatch?.7:.45;const tri=new THREE.Shape();tri.moveTo(-(d/2+over),0);tri.lineTo(d/2+over,0);tri.lineTo(0,rise);tri.closePath();
  parts.push({geo:new THREE.ExtrudeGeometry(tri,{depth:w+over*2,bevelEnabled:false}),color:c(st.roof).lerp(c(st.roof2),r()*.5),x:-(w/2+over),y:plinthH+H-.05,z:0,ry:Math.PI/2,jitter:.08});
  if(st.thatch)parts.push({geo:new THREE.CylinderGeometry(.34,.34,w+over*2+.2,7),color:c(st.roof2),y:plinthH+H+rise-.1,rz:Math.PI/2,jitter:.08});else parts.push({geo:new THREE.BoxGeometry(w+over*2+.1,.14,.22),color:c(st.roof2),y:plinthH+H+rise-.05,jitter:.05});
  parts.push({geo:new THREE.BoxGeometry(.5,1.3,.5),color:c(st.plinth),x:w*.3,y:plinthH+H+rise*.5+.5,z:d*.2,jitter:.08});
  const winC=c(0x2a2622);[-w*.28,w*.28].forEach(wx=>{parts.push({geo:new THREE.BoxGeometry(.6,.7,.08),color:winC,x:wx,y:plinthH+H*.6,z:d/2+.02,jitter:0});});
  parts.push({geo:new THREE.BoxGeometry(.9,1.7,.1),color:c(st.door),x:0,y:plinthH+.85,z:d/2+.03,jitter:.04});parts.push({geo:new THREE.BoxGeometry(1.1,.14,.16),color:c(st.frame),x:0,y:plinthH+1.78,z:d/2+.04,jitter:0});
  return mergeParts(parts,r);}
// ── the proposed house ──
// P: part list for mergeParts; box(x0,x1,...) helpers in house space (y from the ground, +z front)
function newBuilding(w,d,st,r,two){const P=[];const c=x=>new THREE.Color(x);const add=(geo,col,x,y,z,rx,ry,rz,j)=>{P.push({geo,color:c(col),x,y,z,rx,ry,rz,jitter:j==null?.06:j});};
  const H=(st.h||2.6)+(two?2.2:0),pl=.3,wallC=c(st.wall).lerp(c(st.wall2),r()*.6).getHex(),fr=st.frame,dark=0x1e1a18;
  // a footing of rough stones, a course of them round the base
  add(new THREE.BoxGeometry(w+.2,pl,d+.2),st.plinth,0,pl/2,0,0,0,0,.1);
  for(let i=0;i<Math.floor((w+d)*2.2);i++){const t=r(),side=r()<.5;const x=side?(t-.5)*w:(r()<.5?-1:1)*(w/2+.08),z=side?(r()<.5?-1:1)*(d/2+.08):(t-.5)*d;const s=.16+r()*.14;add(SK.bumpy(SK.ball(s,6,4),.03,9,r()*9),c(st.plinth).multiplyScalar(.85+r()*.3).getHex(),x,.12,z,0,r()*3,0,.05);}
  // walls: slightly inset from the footing
  add(new THREE.BoxGeometry(w,H,d),wallC,0,pl+H/2,0,0,0,0,.05);
  // timber framing: corner posts, a sill and a head beam, studs and braces on the front and back
  if(st.framed){for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]])add(new THREE.BoxGeometry(.2,H,.2),fr,sx*w/2,pl+H/2,sz*d/2,0,0,0,.04);
    for(const fz of [1,-1]){for(const y of [pl+.08,pl+H-.08,two?pl+H-2.3:null])if(y!=null)add(new THREE.BoxGeometry(w+.04,.16,.08),fr,0,y,fz*(d/2+.03),0,0,0,.04);
      const n=Math.round(w/1.1);for(let k=1;k<n;k++){const x=-w/2+k*w/n;if(Math.abs(x)<.7)continue;add(new THREE.BoxGeometry(.12,H,.07),fr,x,pl+H/2,fz*(d/2+.03),0,0,0,.04);}
      for(const sx of [-1,1]){const L=Math.hypot(w/n,Math.min(H,2.2)*.9);add(new THREE.BoxGeometry(.1,L,.06),fr,sx*(w/2-w/n/2),pl+Math.min(H,2.2)*.5,fz*(d/2+.035),0,0,sx*fz*Math.atan2(w/n,Math.min(H,2.2)*.9),.04);}}}
  // a jetty: the upper floor steps out over the lower, on joist ends
  if(two&&st.framed){add(new THREE.BoxGeometry(w+.5,.24,d+.5),fr,0,pl+H-2.25,0);for(let k=0;k<Math.round(w/.5);k++)add(new THREE.BoxGeometry(.12,.12,.3),fr,-w/2+.25+k*.5,pl+H-2.42,d/2+.15);}
  // windows: a recess in the wall (dark glass set back), a stone sill and lintel, a mullion, shutters where the nation paints them
  const win=(x,y,z,fz,wd,ht)=>{add(new THREE.BoxGeometry(wd,ht,.08),0x2a3038,x,y,z-fz*.06,0,0,0,0);add(new THREE.BoxGeometry(wd+.24,.1,.24),st.plinth,x,y-ht/2-.05,z+fz*.04);add(new THREE.BoxGeometry(wd+.2,.12,.14),st.framed?fr:st.plinth,x,y+ht/2+.06,z+fz*.02);
    add(new THREE.BoxGeometry(.05,ht,.06),fr,x,y,z-fz*.02);add(new THREE.BoxGeometry(wd,.05,.06),fr,x,y+.05,z-fz*.02);
    for(const s of [-1,1])add(new THREE.BoxGeometry(.06,ht,.1),fr,x+s*wd/2,y,z);
    if(st.shutter)for(const s of [-1,1]){add(new THREE.BoxGeometry(wd/2,ht+.04,.05),st.shutter,x+s*(wd*.75+.06),y,z+fz*.03,0,s*fz*.25,0,.06);}};
  const wy=pl+Math.min(H,st.h)*.58,nw=st.long?3:2;for(let k=0;k<nw;k++){const x=(k-(nw-1)/2)*w/nw*(st.long?1:1.1);if(Math.abs(x)<.8)continue;win(x,wy,d/2,1,.62,.78);}
  win(0,wy,-d/2,-1,.62,.78);if(two)for(const x of [-w*.28,0,w*.28])win(x,pl+H-1.1,d/2+(st.framed?.25:0),1,.56,.7);
  // the door: a frame, a plank door set back, iron hinges, a stone step, a lintel; a small hood over it in the wet nations
  add(new THREE.BoxGeometry(1.2,2.05,.12),st.framed?fr:st.plinth,0,pl+1.02,d/2+.01);add(new THREE.BoxGeometry(.92,1.85,.08),st.door,0,pl+.93,d/2-.02,0,0,0,.03);
  for(let k=-2;k<=2;k++)add(new THREE.BoxGeometry(.02,1.8,.02),c(st.door).multiplyScalar(.7).getHex(),k*.18,pl+.93,d/2+.025,0,0,0,0);
  for(const y of [.5,1.4])add(new THREE.BoxGeometry(.5,.05,.03),dark,-.18,pl+y,d/2+.03,0,0,0,0);add(SK.ball(.04,6,4),0x8a7a4a,.3,pl+.95,d/2+.05);
  add(new THREE.BoxGeometry(1.4,.16,.55),st.plinth,0,.08,d/2+.35,0,0,0,.08);
  // the roof: a slab with thickness, the eaves overhanging on rafter ends, bargeboards up the gables, the covering in courses
  const rise=st.rise,over=st.thatch?.5:.55,run=d/2+over,slope=Math.atan2(rise,d/2),len=Math.hypot(run,rise*run/(d/2)),th=st.thatch?.42:.14;
  const rc=c(st.roof).lerp(c(st.roof2),r()*.4).getHex(),yb=pl+H;
  for(const s of [1,-1]){// each slope: the slab, then its courses
    const cz=s*(run/2),cy=yb+rise/2-(over/(d/2))*rise/2;
    if(st.thatch){const g=SK.bumpy(new THREE.BoxGeometry(w+over*2,th,len,10,1,8),.05,7,s*3);add(g,rc,0,cy,cz,s*slope,0,0,.05);}
    else{add(new THREE.BoxGeometry(w+over*2,th,len),c(rc).multiplyScalar(.8).getHex(),0,cy,cz,s*slope,0,0,.04);
      const rows=Math.round(len/(st.tile?.4:.26));for(let k=0;k<rows;k++){const t=(k+.5)/rows-.5;const y=cy-Math.sin(slope)*t*len+th*.6*Math.cos(slope),z=cz+s*Math.cos(slope)*t*len+s*th*.6*Math.sin(slope);
        if(st.tile){for(let q=0;q<Math.round((w+over*2)/.3);q++){const g=SK.cyl(.12,.12,.42,4,1,true,-Math.PI/2,Math.PI);add(g,c(rc).multiplyScalar(.85+r()*.3).getHex(),-(w/2+over)+.15+q*.3,y,z,s*(Math.PI/2+slope),0,0,.05);}}
        else add(new THREE.BoxGeometry(w+over*2,.05,len/rows*1.08),c(rc).multiplyScalar(.82+r()*.3).getHex(),0,y,z,s*slope,0,0,.08);}}
    // rafter ends under the eaves
    if(!st.thatch)for(let k=0;k<Math.round((w+over*2)/.6);k++)add(new THREE.BoxGeometry(.1,.12,over+.1),fr,-(w/2+over)+.3+k*.6,yb-.08-(over/2)*rise/(d/2),s*(d/2+over/2),s*slope,0,0,.04);}
  // the ridge and the gable ends: a thick roll for thatch, ridge tiles otherwise; bargeboards; the Mark's crossed horns
  if(st.thatch)add(SK.bumpy(new THREE.CylinderGeometry(.42,.42,w+over*2+.3,10,1),.05,8,2),c(st.roof2).getHex(),0,yb+rise+.02,0,0,0,Math.PI/2,.05);
  else add(SK.cyl(.12,.12,w+over*2+.1,6),st.roof2,0,yb+rise+.08,0,0,0,Math.PI/2,.04);
  for(const gx of [1,-1]){const gt=new THREE.Shape();gt.moveTo(-d/2,0);gt.lineTo(d/2,0);gt.lineTo(0,rise-.02);gt.closePath();add(new THREE.ShapeGeometry(gt),wallC,gx*(w/2+.001),yb,0,0,gx*Math.PI/2,0,.04);
    if(!st.thatch)for(const s of [1,-1]){const L=Math.hypot(run,rise*run/(d/2));add(new THREE.BoxGeometry(.06,.26,L),fr,gx*(w/2+over+.02),yb+rise/2-(over/(d/2))*rise/2+.06,s*run/2,s*slope,0,0,.04);}
    if(st.long){for(const s of [1,-1])add(new THREE.BoxGeometry(.08,.9,.14),fr,gx*(w/2+over+.02),yb+rise+.3,s*.18,s*.5,0,0,.04);}}
  // a chimney of coursed stone with a cap
  const chx=w*.3*(r()<.5?1:-1),chz=-d*.18;for(let k=0;k<6;k++)add(new THREE.BoxGeometry(.56,.24,.56),c(st.plinth).multiplyScalar(.85+r()*.25).getHex(),chx,yb+rise*.4+k*.25,chz,0,(r()-.5)*.08,0,.06);
  add(new THREE.BoxGeometry(.7,.1,.7),st.plinth,chx,yb+rise*.4+1.55,chz);
  // the yard's odds and ends, by the house's dice: a lean-to, a woodpile, a water butt, a bench
  if(r()<.6){const s=r()<.5?1:-1;add(new THREE.BoxGeometry(1.4,1.6,d*.7),wallC,s*(w/2+.7),pl+.8,-d*.1);add(new THREE.BoxGeometry(1.8,.1,d*.8),rc,s*(w/2+.75),pl+1.72,-d*.1,0,0,-s*.3);}
  if(r()<.7){const x=(r()<.5?1:-1)*(w/2-.6);for(let k=0;k<9;k++)add(SK.cyl(.08,.08,.7,6),0x7a5a3a,x+(k%3)*.17-.17,.1+Math.floor(k/3)*.15,d/2+.4,0,0,Math.PI/2,.1);}
  if(r()<.6)add(SK.lathe([[.001,0],[.25,0],[.28,.3],[.26,.6],[.001,.6]],10),0x6a4a2a,-w/2+.5,0,d/2+.45);
  return mergeParts(P,r);}
