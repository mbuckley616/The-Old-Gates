// The worn armour kit — concept, 2026-09-30 (backlog H.2/H.4: the player's kit, "a kit block for armour", Session 154).
// Today every armour piece of every tier is one shape recoloured: a lathed shell over the tunic, a ball on each shoulder,
// a ring at the belt, a cylinder at each knee and forearm, one bowl helm. This dresses the people's bones by what the
// piece is made of: Wooden is laced lamellar, Bronze a muscle cuirass with pteruges and a crested helm, Iron a mail
// hauberk with a nasal helm, Steel articulated plate with a great bascinet; Mithril to Cosmic wear the plate in their
// own metal with a signature each (option B): fluted, heavy, faceted, scaled, spiked, inlaid with light.
//
// For the builder: ARMOUR_DRESS runs inside personBakeQ where the `if(g.eq){…}` kit block is, with that function's own
// `part`, bones `B`, `C`, `bw`, `fem`, `chestPts` and the genome `g`; every piece is an SK shape on a bone, so it goes
// through the same bake, AO and skinning as the body. AR_FROM_EQ(EQ,mode) reads the worn items (anything makeItem made:
// it has `material` and `tier`); mode 'A' drops the rare tiers' signatures. The helm replaces `g.hat==='helm'`.
// The glow parts (AR.glow) are baked vertex colours here; in the game they would go on an unlit child like the dead's eyes.
// Plain script, function declarations and AR_* names only, so it can be dropped into the page as it is.

const AR_FAM=[null,'lamellar','muscle','mail','plate','plate','plate','plate','plate','plate','plate'];
const AR_SIG=[null,null,null,null,null,'fluted','heavy','faceted','scaled','spiked','inlaid'];
function AR_FROM_EQ(EQ,mode){
  const piece=it=>{if(!it||!it.material||!it.tier)return null;const t=Math.max(1,Math.min(10,it.tier)),m=MATERIALS[t-1];
    return {tier:t,fam:AR_FAM[t],sig:mode==='A'?null:AR_SIG[t],metal:m.blade,guard:m.guard,glow:m.glow};};
  const o={head:piece(EQ.head),chest:piece(EQ.chest),hands:piece(EQ.hands),legs:piece(EQ.legs),feet:piece(EQ.feet)};
  return (o.head||o.chest||o.hands||o.legs||o.feet)?o:null;}

function ARMOUR_DRESS(X){
  const {part,B,C,SK,THREE,bw,chestPts,E,g}=X;const PI=Math.PI,L1=PW.L1,L2=PW.L2;
  const hs=g.head||1,jaw=g.jaw||1,Z=.78,LR=[['L',1],['R',-1]];
  const leather=C(0x4a3020),dark=C(0x120e0c),MT=h=>C(h).clone().multiplyScalar(.72),GD=h=>C(h).clone().multiplyScalar(.85);
  const cp=chestPts.map(q=>[q[0]*bw,q[1]]);
  const rAt=y=>{for(let i=1;i<cp.length;i++){const a=cp[i-1],b=cp[i];if(a[1]!==b[1]&&(y-a[1])*(y-b[1])<=0)return a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]);}return cp[1][0];};
  // shapes: a thick flared hoop (a lame), a profile made dense for the mail's rings, a front keel, facets
  const hoop=(y0,y1,r0,r1,t,seg)=>SK.lathe([[r0-t,y0+t*.4],[r0,y0],[r1,y1],[r1-t,y1]],seg||20);
  const dense=(pts,n)=>{const o=[];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];for(let k=0;k<n;k++){const t=k/n;o.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}o.push(pts[pts.length-1]);return o;};
  const mailTex=geo=>SK.bumpy(geo,.0045,170,3);
  const keel=(geo,amt,pw)=>{const p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);if(z>0){const c=z/(Math.hypot(x,z)||1);p.setZ(i,z+amt*Math.pow(c,pw||8));}}geo.computeVertexNormals();return geo;};
  const facet=geo=>{const n=geo.index?geo.toNonIndexed():geo;n.computeVertexNormals();return n;};
  const ring=(r,t,y,col,b,sz,seg)=>{const o=part(SK.torus(r,t,4,seg||22),col,b,0,y,0);o.rotation.x=PI/2;o.scale.y=sz||Z;return o;};
  const onBody=(b,geo,col,a,r,y,z)=>{const o=part(geo,col,b,Math.sin(a)*r,y,Math.cos(a)*r*(z||Z));o.rotation.y=a;return o;};

  // ── the chest piece: the body, the skirt below the belt, and the shoulders and upper arms ──
  const P=E.chest;
  if(P){const m=MT(P.metal),gd=GD(P.guard),gl=P.glow!=null?C(P.glow):null,S=P.sig,F=S==='faceted'?facet:(x=>x);
    if(P.fam==='lamellar'){
      // five laced hoops of slats from the belt to the chest, each flared over the one below; two more over the hips
      const N=5,y0=0,y1=.34;for(let i=0;i<N;i++){const ya=y0+(y1-y0)*i/N-.004,yb=y0+(y1-y0)*(i+1)/N+.01,ra=rAt(Math.max(.01,ya))*1.1+.016,rb=rAt(yb)*1.08+.004;
        part(hoop(ya,yb,ra,rb,.01,20),m,B.spine).scale.z=Z;ring(rb,.0045,yb,gd,B.spine);
        for(let k=0;k<12;k++){const a=k/12*PI*2;onBody(B.spine,SK.cyl(.003,.003,yb-ya-.006,3,1,true),gd,a,(ra+rb)/2+.004,(ya+yb)/2);}}
      [[.0,-.085,.235,.2],[-.075,-.16,.255,.225]].forEach(([yb,ya,ra,rb])=>{part(hoop(ya,yb,ra*bw,rb*bw,.01,20),m,B.hips).scale.z=.78;ring(rb*bw,.0045,yb,gd,B.hips,.78);
        for(let k=0;k<12;k++){const a=k/12*PI*2;onBody(B.hips,SK.cyl(.003,.003,yb-ya-.006,3,1,true),gd,a,(ra+rb)/2*bw+.004,(ya+yb)/2);}});
      LR.forEach(([k,s])=>{const b=B['sh'+k],c=s>0?PI/2:PI*1.5;for(let i=0;i<3;i++){const r=.078-.004*i;part(SK.cyl(r,r+.014,.045,12,1,true,c-1.2,2.4),i%2?gd:m,b,s*.01,-.02-i*.036,0).scale.z=1.1;}
        part(SK.ball(.074,12,6,0,PI*2,0,PI*.5),leather,b,s*.012,-.004,0).scale.set(1.1,.7,1.15);});
    } else if(P.fam==='muscle'){
      // a cuirass modelled on the body: pectorals and belly in the bronze, rolled rims, leather strips (pteruges) over the hips
      const pr=cp.filter(q=>q[1]>=0&&q[1]<=.37).map(q=>[q[0]*1.1+.01,q[1]]);part(SK.lathe(pr,22),m,B.spine).scale.z=Z;
      ring(rAt(0)*1.1+.012,.012,0,m,B.spine);ring(rAt(.36)*1.1+.012,.01,.36,m,B.spine);
      [-1,1].forEach(sd=>{onBody(B.spine,SK.ball(.072,12,8),m,sd*.4,rAt(.25)*1.1-.012,.25).scale.set(1.15,.72,.34);
        [.08,.13,.18].forEach(y=>onBody(B.spine,SK.ball(.032,8,6),m,sd*.17,rAt(y)*1.1-.004,y).scale.set(1.1,.78,.32));});
      for(let k=0;k<14;k++){const a=k/14*PI*2;onBody(B.hips,SK.rbox(.052,.13,.012,.004,1),leather,a,.212*bw,-.07,.78);onBody(B.hips,SK.rbox(.054,.02,.014,.004,1),m,a,.215*bw,-.13,.78);}
      LR.forEach(([k,s])=>{const b=B['sh'+k];part(SK.ball(.07,12,6,0,PI*2,0,PI*.5),m,b,s*.012,-.004,0).scale.set(1.1,.72,1.12);
        for(let i=0;i<5;i++){const c=(s>0?PI/2:PI*1.5)-.8+i*.4;part(SK.rbox(.03,.085,.01,.003,1),leather,b,Math.sin(c)*.066,-.075,Math.cos(c)*.07).rotation.y=c;}});
    } else if(P.fam==='mail'){
      // a hauberk: mail to mid-thigh and the elbows, a leather belt; the rings are the kit's bumpy surface at a fine grain
      const pr=dense(cp.filter(q=>q[1]>=-.01).map(q=>[q[0]*1.08+.006,q[1]]),3);part(mailTex(SK.lathe(pr,30)),m,B.spine).scale.z=Z;
      part(mailTex(SK.lathe(dense([[.25*bw,-.25],[.238*bw,-.14],[.21*bw,-.03],[.195*bw,.04]],4),30)),m,B.hips).scale.z=.78;
      ring(.2*bw,.018,.02,leather,B.hips,.74);part(SK.rbox(.05,.04,.014,.005,1),C(0x8a8070),B.hips,0,.02,.2*bw*.74+.01);
      LR.forEach(([k,s])=>{const b=B['sh'+k];part(mailTex(SK.ball(.074,16,10,0,PI*2,0,PI*.55)),m,b,s*.01,-.004,0).scale.set(1.05,.8,1.1);
        part(mailTex(SK.cyl(.058*bw,.054*bw,.13,16,4,true)),m,b,0,-.075,0);});
    } else {
      // plate: a keeled breastplate, three fauld lames and tassets, a gorget, pauldrons of three lames under a cap,
      // a rerebrace, a couter with its wing (the vambrace and gauntlet are the hands' piece)
      const heavy=S==='heavy'?1.12:1,seg=S==='faceted'?8:22;
      const pr=[[rAt(.1)*1.12+.014,.095]].concat(cp.filter(q=>q[1]>.1).map(q=>[q[0]*1.12*heavy+.008,q[1]]));
      part(F(keel(SK.lathe(pr,seg),.024,6)),m,B.spine).scale.z=Z;
      for(let i=0;i<3;i++){const yb=.1-i*.042,ya=yb-.05;part(F(hoop(ya,yb,rAt(Math.max(0,ya))*1.12+.016+i*.006,rAt(yb)*1.1+.006+i*.004,.008,seg)),m,B.spine).scale.z=Z;}
      part(F(hoop(-.02,.035,.085*heavy,.07,.008,seg)),m,B.neck);part(F(hoop(.02,.065,.07,.058,.008,seg)),m,B.neck);
      LR.forEach(([k,s])=>{const b=B['sh'+k],c=s>0?PI/2:PI*1.5,ps=heavy*(S==='spiked'?1.08:1);
        part(F(SK.ball(.09*ps,14,7,0,PI*2,0,PI*.5)),m,b,s*.014,-.006,0).scale.set(1.12,.72,1.2);
        for(let i=0;i<3;i++){const r=(.084-.005*i)*ps;part(F(SK.cyl(r,r+.012,.044,14,1,true,c-1.35,2.7)),m,b,s*.014,-.03-i*.034,0).scale.z=1.15;}
        part(F(SK.cyl(.05*bw,.047*bw,.1,12,1,true)),m,b,0,-.1,0);
        const el=B['el'+k];part(F(SK.ball(.046*heavy,10,7)),m,el,0,.004,-.008).scale.set(1,1,.95);part(F(SK.cyl(.036*heavy,.036*heavy,.008,12)),m,el,s*.047,0,0).rotation.z=PI/2;
        if(S==='heavy')part(SK.rbox(.02,.075,.15,.006,1),m,b,s*.03,.055,0);
        if(S==='fluted')for(let i=-1;i<=1;i++)part(SK.cyl(.004,.004,.1,4),m,b,s*.03+i*.028*s*.3,.03,i*.04).rotation.z=s*.9;
        if(S==='spiked')for(let i=0;i<3;i++){const sp=part(SK.cone(.024,.15-.03*i,6),gd,b,s*(.06+.02*i),.05-.02*i,-.04+.04*i);sp.rotation.z=-s*(.7+.3*i);}
        if(S==='scaled')for(let i=0;i<9;i++){const c2=c-1.1+i%3*1.1,y=-.005-Math.floor(i/3)*.035;const sc=part(SK.ball(.024,4,3),gd,b,Math.sin(c2)*.096+s*.014,y,Math.cos(c2)*.1);sc.rotation.set(.35,c2,0);sc.scale.set(1,1.25,.4);}
        if(gl&&(S==='faceted'||S==='inlaid'||S==='fluted'))ring(.086*ps,.004,-.06,gl,b,1.15);});
      // tassets hang from the faulds over the front of each thigh, on the thigh's own bone so a stride carries them
      LR.forEach(([k,s])=>{const th=B['th'+k];for(let i=0;i<2;i++){const t=part(F(SK.rbox(.13*bw*heavy,.075,.016,.006,1)),m,th,s*.012,-.035-i*.058,.083*bw+i*.004);t.rotation.x=.14;}});
      if(S==='fluted')for(let i=-3;i<=3;i++){const a=i*.2;onBody(B.spine,SK.cyl(.0045,.0035,.2,4),m,a,rAt(.22)*1.12+.012+(i===0?.02:0),.22).rotation.z=-i*.04;}
      if(S==='heavy')for(let i=0;i<10;i++){const a=(i-4.5)*.3;onBody(B.spine,SK.ball(.009,5,4),gd,a,rAt(.1)*1.12+.02,.098);}
      if(S==='scaled')for(let r=0;r<5;r++)for(let i=0;i<9;i++){const a=(i-4+(r%2)*.5)*.19,y=.3-r*.045;const sc=onBody(B.spine,SK.ball(.026,4,3),gd,a,rAt(y)*1.12+.016+.02*Math.pow(Math.cos(a),8),y);sc.rotation.x=.35;sc.scale.set(1,1.3,.42);}
      if(S==='spiked')[-1,1].forEach(sd=>{const sp=onBody(B.spine,SK.cone(.013,.07,6),gd,sd*.5,rAt(.26)*1.12+.02,.26);sp.rotation.x=PI/2;});
      if(gl&&S==='inlaid')[.14,.24,.32].forEach(y=>ring(rAt(y)*1.12+.013+.004,.004,y,gl,B.spine));
      if(gl&&S==='faceted')[.096,.058,.016].forEach(y=>ring(rAt(y)*1.12+.02,.0035,y,gl,B.spine));
      if(gl&&S==='fluted'){ring(rAt(.1)*1.12+.02,.004,.095,gl,B.spine);ring(.08,.004,.064,gl,B.neck,1);}
    }
  }
  // ── the hands' piece: gauntlets, and for plate the vambrace ──
  const H=E.hands;
  if(H){const m=MT(H.metal),F=H.sig==='faceted'?facet:(x=>x);B.handL.userData.col=B.handR.userData.col=H.fam==='lamellar'||H.fam==='muscle'?leather:m;
    LR.forEach(([k,s])=>{const el=B['el'+k],wr=B['wr'+k];
      if(H.fam==='lamellar'){for(let i=0;i<4;i++){const a=i/4*PI*2+.4;part(SK.rbox(.02,.1,.008,.003,1),m,el,Math.sin(a)*.047,-.085,Math.cos(a)*.047).rotation.y=a;}ring(.047,.004,-.05,GD(H.guard),el,1);ring(.045,.004,-.12,GD(H.guard),el,1);}
      else if(H.fam==='muscle')part(SK.cyl(.052*bw,.044*bw,.11,14,1,true),m,el,0,-.08,0);
      else if(H.fam==='mail'){part(mailTex(SK.cyl(.05*bw,.045*bw,.12,16,3,true)),m,el,0,-.075,0);part(SK.cyl(.054,.044,.045,12,1,true),GD(H.guard),wr,0,.0,0);}
      else{part(F(SK.cyl(.049*bw,.043*bw,.12,12,1,true)),m,el,0,-.075,0);part(F(SK.cyl(.058,.044,.055,12,1,true)),m,wr,0,-.004,0);
        part(F(SK.rbox(.052,.016,.04,.006,1)),m,wr,0,-.052,.014);
        if(H.sig==='spiked')part(SK.cone(.012,.06,6),GD(H.guard),el,s*.03,.0,-.04).rotation.set(-1.2,0,s*.5);}});}
  // ── the legs' piece ──
  const Lg=E.legs;
  if(Lg){const m=MT(Lg.metal),gd=GD(Lg.guard),F=Lg.sig==='faceted'?facet:(x=>x);
    LR.forEach(([k,s])=>{const th=B['th'+k],kn=B['kn'+k];
      if(Lg.fam==='lamellar'){for(let i=0;i<5;i++){const a=(i-2)*.42;part(SK.rbox(.022,L2*.62,.01,.004,1),m,kn,Math.sin(a)*.058*bw,-L2*.48,Math.cos(a)*.058*bw).rotation.y=a;}
        ring(.06*bw,.005,-L2*.25,gd,kn,1);ring(.056*bw,.005,-L2*.7,gd,kn,1);}
      else if(Lg.fam==='muscle'){part(SK.cyl(.062*bw,.052*bw,L2*.72,14,2,true,-1.9,3.8),m,kn,0,-L2*.5,0);part(SK.ball(.036,10,7),m,kn,0,-.01,.05).scale.set(1,1.1,.6);}
      else if(Lg.fam==='mail'){part(mailTex(SK.cyl(.074*bw,.062*bw,L1*.8,16,4,true)),m,th,0,-L1*.52,0);part(mailTex(SK.cyl(.06*bw,.05*bw,L2*.7,16,4,true)),m,kn,0,-L2*.5,0);
        part(SK.ball(.046,10,7,0,PI*2,0,PI*.6),m,kn,0,.0,.03).rotation.x=PI/2-.2;}
      else{part(F(SK.cyl(.078*bw,.066*bw,L1*.62,12,1,true)),m,th,0,-L1*.55,0);part(F(SK.cyl(.062*bw,.05*bw,L2*.74,12,1,true)),m,kn,0,-L2*.52,0);
        part(F(SK.ball(.052,10,7)),m,kn,0,.0,.024).scale.set(1,.92,.85);part(F(SK.cyl(.034,.034,.008,12)),m,kn,s*.052,0,.01).rotation.z=PI/2;
        if(Lg.sig==='spiked'){const sp=part(SK.cone(.013,.07,6),gd,kn,0,.01,.07);sp.rotation.x=PI/2;}
        if(Lg.glow!=null&&(Lg.sig==='inlaid'||Lg.sig==='faceted'))ring(.058*bw,.0035,-L2*.3,C(Lg.glow),kn,1);}});}
  // ── the feet: sabatons for plate (the boots take the metal's colour already) ──
  const Ft=E.feet;
  if(Ft&&Ft.fam==='plate'){const m=MT(Ft.metal);LR.forEach(([k])=>{const an=B['an'+k];for(let i=0;i<3;i++){const gg=SK.cyl(.046-.004*i,.046-.004*i,.032,10,1,true,PI-1.4,2.8);gg.rotateX(PI/2);part(gg,m,an,0,-.012,.006+i*.03);}});}
  // ── the helm (replaces the bowl helm) ──
  const Hd=E.head;
  if(Hd){const m=MT(Hd.metal),gd=GD(Hd.guard),gl=Hd.glow!=null?C(Hd.glow):null,S=Hd.sig,F=S==='faceted'?facet:(x=>x),hd=B.head,R=.158*hs;
    const bowl=(pts,tilt,col,seg)=>{const o=part(SK.lathe(pts.map(q=>[q[0]*hs,q[1]*hs]),seg||20),col||m,hd,0,.12,-.004);o.rotation.x=tilt;o.scale.x=jaw;return o;};
    const aventail=(col,tex)=>{const geo=new THREE.LatheGeometry(dense([[.19,-.16],[.168,-.08],[.157,-.01],[.152,.03]],3).map(q=>new THREE.Vector2(q[0]*hs,q[1])),26,.75,PI*2-1.5);
      part(tex?mailTex(geo):geo,col,hd,0,.12,-.004).scale.x=jaw;};
    if(Hd.fam==='lamellar'){bowl([[.158,.02],[.156,.06],[.138,.12],[.1,.165],[.05,.19],[.012,.2],[0,.2]],-.3);
      ring(.16*hs,.009,.14,gd,hd,1.02).rotation.x=PI/2-.3;ring(.15*hs,.006,.19,gd,hd,1.02).rotation.x=PI/2-.3;
      part(SK.cone(.018,.05,6),gd,hd,0,.33,-.06).rotation.x=-.3;aventail(leather,false);}
    else if(Hd.fam==='muscle'){const g2=SK.ball(R,20,12,PI/2+.5,PI*2-1,0,PI*.74);const o=part(g2,m,hd,0,.12,.0);o.scale.set(jaw*1.02,1.06,1.1);o.rotation.x=-.08;
      const cg=SK.torus(.19*hs,.03,6,18,PI*.7);cg.rotateZ(PI*.12);const cr=part(cg,C(0x8a2016),hd,0,.12,-.02);cr.rotation.y=PI/2;cr.scale.set(1,1,.45);}
    else if(Hd.fam==='mail'){bowl([[.16,.02],[.159,.05],[.14,.12],[.095,.18],[.04,.22],[.008,.235],[0,.236]],-.28);ring(.162*hs,.011,.13,gd,hd,1.02).rotation.x=PI/2-.28;
      part(SK.rbox(.02,.085,.012,.004,1),m,hd,0,.14,.162).rotation.x=-.12;aventail(m,true);}
    else{const g2=keel(SK.ball(R,S==='faceted'?9:22,S==='faceted'?7:14,0,PI*2,0,PI*.8),.045,5);const o=part(F(g2),m,hd,0,.12,.004);o.scale.set(jaw*1.02,1.06,1.08);
      const sl=SK.torus(R+.003,.0075,4,16,1.7);sl.rotateZ(PI/2-.85);sl.rotateX(PI/2);keel(sl,.045,5);const so=part(sl,dark,hd,0,.14,.004);so.scale.set(jaw*1.02,1,1.08);const bl=SK.torus(R+.004,.011,5,16,1.9);bl.rotateZ(PI/2-.95);bl.rotateX(PI/2);keel(bl,.045,5);part(F(bl),m,hd,0,.158,.004).scale.set(jaw*1.02,1,1.08);[-1,1].forEach(sd=>part(SK.ball(.016,8,6),gd,hd,sd*R*jaw*1.02,.14,.004));for(let i=0;i<6;i++)part(SK.ball(.0055,5,4),dark,hd,-(.03+(i%3)*.018),.085+Math.floor(i/3)*.02,.004+Math.sqrt(Math.max(0,R*R-.04*.04-.03*.03))*1.08+.02);
      if(S==='heavy'){const cb=part(SK.torus(R*1.1,.02,6,18,PI),m,hd,0,.12,0);cb.rotation.y=PI/2;cb.scale.z=.5;}
      if(S==='fluted')for(let i=-2;i<=2;i++){const o2=part(SK.torus(R*1.02,.004,4,16,PI*.9),m,hd,0,.12,.004);o2.rotation.set(0,PI/2+i*.35,PI*.05);o2.scale.set(jaw*1.02,1.06,1.08);}
      const horn=(sd,fwd)=>{const p=new THREE.Vector3(sd*.1*hs,.25,fwd?.02:-.01),d=new THREE.Vector3(sd*.8,.6,fwd?.1:-.2).normalize(),up=new THREE.Vector3(0,1,0);let r=.034;
        for(let i=0;i<6;i++){const len=.055;const h=part(SK.cyl(r*.72,r,len,7,1,true),gd,hd,p.x+d.x*len/2,p.y+d.y*len/2,p.z+d.z*len/2);h.quaternion.setFromUnitVectors(up,d);
          p.addScaledVector(d,len*.96);r*=.74;d.applyAxisAngle(new THREE.Vector3(0,0,1),-sd*.32);d.applyAxisAngle(new THREE.Vector3(1,0,0),fwd?.35:-.25);d.normalize();}
        const tip=part(SK.cone(r,.05,7),gd,hd,p.x+d.x*.025,p.y+d.y*.025,p.z+d.z*.025);tip.quaternion.setFromUnitVectors(up,d);};
      if(S==='scaled'){[-1,1].forEach(sd=>horn(sd,false));for(let i=0;i<5;i++){const sp=part(SK.cone(.014,.045,5),gd,hd,0,.28-i*.045,-.06-i*.03);sp.rotation.x=-.6-i*.25;}}
      if(S==='spiked')[-1,1].forEach(sd=>horn(sd,true));
      if(gl&&S==='inlaid'){const ha=part(SK.torus(.13*hs,.007,4,28),gl,hd,0,.2,-.16);ha.rotation.x=-.2;ring(R*1.02,.004,.19,gl,hd,1.08).scale.x=jaw*1.02;}
      if(gl&&(S==='faceted'||S==='fluted'))ring(R*1.03,.004,.2,gl,hd,1.08).scale.x=jaw*1.02;}}
}
