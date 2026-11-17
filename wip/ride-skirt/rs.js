var HB_RIDE_SKIRT_X={re:/^(skirt|coatSkirt|mailSkirt)$/,back:100*Math.PI/180,side:150*Math.PI/180,legClear:.025,clear:.008,cell:.015,fill:400,rounds:0,relax:8,t0:0};
window.hbRideSkirt=function hbRideSkirt(rig){const H=rig.hb,R=rig.ride,G=R&&R.beast;if(!H||H.rideSkirt)return;
  if(G&&G.root&&!G.hc&&!G.hcFail)return; /* the horse's own body first: the skirt is laid on its saddle */
  H.rideSkirt=true;const P=H.P,sk=P.skeleton,by=P.byName,ip=sk.bones.indexOf(by.root),C=HB_RIDE_SKIRT_X;if(ip<0)return;
  const list=[];P.root.traverse(o=>{if(o.isSkinnedMesh&&C.re.test(o.name))list.push(o);});if(!list.length)return;
  H.root.updateMatrixWorld(true);const v=new THREE.Vector3(),w=new THREE.Vector3(),Mp=new THREE.Matrix4().multiplyMatrices(by.root.matrixWorld,sk.boneInverses[ip]),Mi=Mp.clone().invert();
  /* what the horse has under him: the top of its saddle and hide on a grid in its root's frame, round the seat */
  let F=null,Gi=null,Gm=null;if(G&&G.hc){G.root.updateWorldMatrix(true,false);Gm=G.root.matrixWorld;Gi=Gm.clone().invert();by.root.getWorldPosition(v).applyMatrix4(Gi);
    const cx=v.x,cz=v.z,ext=.45,n=Math.ceil(2*ext/C.cell),top=new Float32Array(n*n).fill(-1e9);
    G.root.traverse(o=>{if(!o.isSkinnedMesh||!(o.name===''||o.name==='hide'))return;const pa=o.geometry.attributes.position,seen=new Uint8Array(pa.count),ix=o.geometry.index;
      for(let q=0;q<(ix?ix.count:pa.count);q++){const i=ix?ix.getX(q):q;if(seen[i])continue;seen[i]=1;w.fromBufferAttribute(pa,i);o.applyBoneTransform(i,w);if(o.bindMode!=='detached'||!o.bindMatrix.equals(_hbIdM))w.applyMatrix4(o.matrixWorld);w.applyMatrix4(Gi);
        const a=Math.floor((w.x-cx+ext)/C.cell),b=Math.floor((w.z-cz+ext)/C.cell);if(a<0||b<0||a>=n||b>=n)continue;const k=a*n+b;if(w.y>top[k])top[k]=w.y;}});
    F=(x,z)=>{const a=Math.floor((x-cx+ext)/C.cell),b=Math.floor((z-cz+ext)/C.cell);if(a<0||b<0||a>=n||b>=n)return -1e9;return top[a*n+b];};}
  /* the hips' middle in the body's rest (bind) frame, and its forward: the angle round it is read there */
  const hl=by['upperleg01.L'],hr=by['upperleg01.R'],bL=new THREE.Vector3().setFromMatrixPosition(sk.boneInverses[sk.bones.indexOf(hl)].clone().invert()),bR=new THREE.Vector3().setFromMatrixPosition(sk.boneInverses[sk.bones.indexOf(hr)].clone().invert());
  const mid=bL.clone().add(bR).multiplyScalar(.5),ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  /* the thighs as he sits: each one's axis from the hip joint to the knee, and how far its flesh (or the trousers over it) reaches from
     the axis at twelve steps along it; a point that hangs inside one is pushed out to it */
  const legs=[];for(const s of ['L','R']){const a=by['upperleg01.'+s].getWorldPosition(new THREE.Vector3()),b=by['lowerleg01.'+s].getWorldPosition(new THREE.Vector3()),d=b.clone().sub(a),len=d.length();d.divideScalar(len);
    const own=new Set(['upperleg01.'+s,'upperleg02.'+s].map(n=>sk.bones.indexOf(by[n]))),r=new Float32Array(12);
    P.root.traverse(o=>{if(!o.isSkinnedMesh||!/^(|body|trousers)$/.test(o.name))return;const pa=o.geometry.attributes.position,si=o.geometry.attributes.skinIndex,sw=o.geometry.attributes.skinWeight,ids=new Set(o.geometry.index?o.geometry.index.array:[]);
      for(const i of ids){let k=0;for(let c=0;c<4;c++)if(own.has(si.getComponent(i,c)))k+=sw.getComponent(i,c);if(k<.5)continue;w.fromBufferAttribute(pa,i);o.applyBoneTransform(i,w);
        const t=w.clone().sub(a).dot(d)/len;if(t<0||t>=1)continue;const q=Math.floor(t*12),rr=w.clone().sub(a).addScaledVector(d,-t*len).length();if(rr>r[q])r[q]=rr;}});
    legs.push({a,d,len,r});}
  const outOfLegs=q=>{for(const L of legs){const u=q.clone().sub(L.a),t=u.dot(L.d)/L.len;if(t<(C.t0||0)||t>=1)continue;const R=L.r[Math.floor(t*12)]+C.legClear;if(!R)continue;u.addScaledVector(L.d,-t*L.len);const rr=u.length();if(rr<R&&rr>1e-5)q.addScaledVector(u,(R-rr)/rr);}return q;};
  const kScale=new THREE.Vector3().setFromMatrixScale(Gm||H.root.matrixWorld).y||1,clear=C.clear*(Gm?1/kScale:1);let moved=0,laid=0;
  for(const o of list){const g=o.geometry,pa=g.attributes.position,sI=g.attributes.skinIndex,sW=g.attributes.skinWeight,nI=new Uint16Array(sI.count*4),nW=new Float32Array(sW.count*4);
    nI.set(sI.array);nW.set(sW.array);const ids=[...new Set(g.index?g.index.array:[])],N=pa.count;
    /* S2311 — the seam. The lap's part rides the thighs and the hanging part hangs, and where the two met the hem tore (edges to 0.30 m
       against a median of 0.044; STUCK #1652). Now only the two ends are placed: the lap (past side) where the thighs carry it, the back
       (inside back) as it hangs. The band between takes its move from its neighbours, the mean of theirs (a harmonic fill over the mesh,
       welded at the shell's seams), so the move fades smoothly from one part to the other. Then the thighs and the saddle, as before. */
    const rep=new Int32Array(N).fill(-1),weld=new Map(),R=new Float32Array(N*3),Dv=new Float32Array(N*3),pin=new Uint8Array(N);
    for(const i of ids){v.fromBufferAttribute(pa,i);const k=Math.round(v.x*2e3)+','+Math.round(v.y*2e3)+','+Math.round(v.z*2e3);if(!weld.has(k))weld.set(k,i);const r=rep[i]=weld.get(k);if(r!==i)continue;
      const th=Math.atan2(Math.abs(v.x-mid.x),-(v.z-mid.z)),rv=v.clone().applyMatrix4(Mp);R[i*3]=rv.x;R[i*3+1]=rv.y;R[i*3+2]=rv.z;
      if(th>=C.side){w.copy(v);o.applyBoneTransform(i,w);pin[i]=1;}else if(th<=C.back){w.copy(rv);pin[i]=1;}else w.copy(rv);
      Dv[i*3]=w.x-rv.x;Dv[i*3+1]=w.y-rv.y;Dv[i*3+2]=w.z-rv.z;}
    window._dbg={rep,pin,th:ids.reduce((m,i)=>{v.fromBufferAttribute(pa,i);m[i]=[+(Math.atan2(Math.abs(v.x-mid.x),-(v.z-mid.z))*180/Math.PI).toFixed(0),+(v.x-mid.x).toFixed(3),+(v.y-mid.y).toFixed(3),+(v.z-mid.z).toFixed(3)];return m;},{})};
    {const LAP=new Float32Array(N*3),HANG=new Float32Array(N*3);for(const i of ids){v.fromBufferAttribute(pa,i);w.copy(v);o.applyBoneTransform(i,w);LAP[i*3]=w.x;LAP[i*3+1]=w.y;LAP[i*3+2]=w.z;w.copy(v).applyMatrix4(Mp);outOfLegs(w);HANG[i*3]=w.x;HANG[i*3+1]=w.y;HANG[i*3+2]=w.z;}
      let grid=null;if(F){grid=[];for(let a=-.45;a<.45;a+=C.cell/2)for(let b=-.45;b<.45;b+=C.cell/2){}}
      window._dump={bind:[...pa.array],index:[...g.index.array],ids,LAP:[...LAP],HANG:[...HANG],R:[...R],mid:mid.toArray(),Mp:Mp.toArray(),
        legs:legs.map(L=>({a:L.a.toArray(),d:L.d.toArray(),len:L.len,r:[...L.r]})),Gm:Gm&&Gm.toArray(),clear,cell:C.cell,F:F?(()=>{const hv=new THREE.Vector3();by.root.getWorldPosition(hv).applyMatrix4(Gi);const out={cx:hv.x,cz:hv.z,ext:.45,n:Math.ceil(.9/C.cell),top:[]};for(let a=0;a<out.n;a++)for(let b=0;b<out.n;b++)out.top.push(F(hv.x-.45+(a+.5)*C.cell,hv.z-.45+(b+.5)*C.cell));return out;})():null};}
    const nb=new Map(),ix=g.index.array;for(let t=0;t<ix.length;t+=3)for(let e=0;e<3;e++){const a=rep[ix[t+e]],b=rep[ix[t+(e+1)%3]];if(a===b)continue;
      for(const [p,q] of [[a,b],[b,a]]){if(pin[p])continue;let s=nb.get(p);if(!s)nb.set(p,s=new Set());s.add(q);}}
    const fr=[...nb.keys()].map(p=>[p,[...nb.get(p)]]);
    const fill=k=>{for(let it=0;it<k;it++)for(const [p,q] of fr){let x=0,y=0,z=0;for(const r of q){x+=Dv[r*3];y+=Dv[r*3+1];z+=Dv[r*3+2];}const n=q.length;Dv[p*3]=x/n;Dv[p*3+1]=y/n;Dv[p*3+2]=z/n;}};
    fill(C.fill);for(let k=0;k<C.rounds;k++){for(const [p] of fr){w.set(R[p*3]+Dv[p*3],R[p*3+1]+Dv[p*3+1],R[p*3+2]+Dv[p*3+2]);outOfLegs(w);Dv[p*3]=w.x-R[p*3];Dv[p*3+1]=w.y-R[p*3+1];Dv[p*3+2]=w.z-R[p*3+2];}fill(C.relax);}
    for(const i of ids){const r=rep[i];v.fromBufferAttribute(pa,i);w.set(R[r*3]+Dv[r*3],R[r*3+1]+Dv[r*3+1],R[r*3+2]+Dv[r*3+2]);
      if(!(pin[r]&&ss(C.back,C.side,Math.atan2(Math.abs(v.x-mid.x),-(v.z-mid.z)))>.5))outOfLegs(w);
      if(F){w.applyMatrix4(Gi);const t=F(w.x,w.z)+clear;if(w.y<t){w.y=t;laid++;}w.applyMatrix4(Gm);}
      w.applyMatrix4(Mi);if(w.distanceToSquared(v)>1e-10)moved++;pa.setXYZ(i,w.x,w.y,w.z);for(let c=0;c<4;c++){nI[i*4+c]=c?0:ip;nW[i*4+c]=c?0:1;}}
    pa.needsUpdate=true;g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(nI,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(nW,4));g.computeVertexNormals();}
  H.rideSkirtN={moved,laid};
  if(H.mid){const old=H.mid,cards=new Set();old.parent&&old.parent.remove(old);P.root.traverse(o=>{if(o.isMesh&&(HBODY.cards.test(o.name)||o.parent===by.head))cards.add(o);});
    try{const m=hbMerge(P,cards);m.geometry.boundingSphere=old.geometry.boundingSphere;m.material=old.material;m.visible=old.visible;P.root.add(m);H.mid=m;old.geometry.dispose();}catch(e){P.root.add(old);console.warn('F4: the rider\'s middle level was not baked again',e);}}}
;
