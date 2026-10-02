// Session 427, H: the beasts' deaths in the game (Michael's C on #107). Each kind standing, then where its ragdoll leaves it after
// 200 steps of 1/60 s, from both sides; the spider keeps its curl where it stands. Run from the repo root:
// node docs/prototypes/ragdoll/beasts-ingame.mjs docs/prototypes/ragdoll-beasts-ingame.png
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.frames(30);
const r = await page.evaluate(() => {
  forceTime(11); const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  const V=()=>new THREE.Vector3(), tiles=[], cv=REN.domElement, cam=new THREE.PerspectiveCamera(40,1,.05,80), info=[];
  const snap=(at,from,label)=>{cam.aspect=cv.width/cv.height;cam.updateProjectionMatrix();cam.position.copy(at).add(from);cam.lookAt(at);REN.render(scene,cam);
    const s=Math.min(cv.width,cv.height),T=document.createElement('canvas');T.width=T.height=240;T.getContext('2d').drawImage(cv,(cv.width-s)/2,(cv.height-s)/2,s,s,0,0,240,240);const x=T.getContext('2d');x.fillStyle='rgba(0,0,0,.55)';x.fillRect(0,0,240,20);x.fillStyle='#f0e6c8';x.font='13px serif';x.fillText(label,5,14);tiles.push(T);};
  const kinds=["Wolf","Snow Wolf","Dire Wolf","Ash Hound","Boar","Cave Bear","Spider"];
  kinds.forEach((type,i)=>{const a=i*.9,x=px-Math.sin(yaw)*4+Math.cos(a)*0,z=pz-Math.cos(yaw)*4;
    const e=buildZoneEnemy(WORLD.scene,[],x,z,type,null);e.locked=false;e.mesh.visible=true;if(!e.mesh.parent)WORLD.scene.add(e.mesh);
    e.mesh.position.set(x,activeTerrainH(x,z),z);e.mesh.rotation.y=i*1.3;e.mesh.updateMatrixWorld(true);
    const rig=e.limbs.wolf;const isSp=rig.spider;const at=V().set(x,activeTerrainH(x,z)+.2,z);
    snap(at,V().set(1.1,.9,1.1).multiplyScalar(type==="Cave Bear"?1.6:1),type+' standing');
    e.hp=0;killZoneEnemy(e,WORLD.scene,'');const now=performance.now();
    for(let k=0;k<200;k++){tickPeople(1/60,now+k*16.7);tickCreatures(1/60,now+k*16.7);}
    const B=rig.B,q=(B.hips||B.body).getWorldQuaternion(new THREE.Quaternion());info.push([type,+new THREE.Vector3(0,1,0).applyQuaternion(q).y.toFixed(2),+new THREE.Vector3(1,0,0).applyQuaternion(q).y.toFixed(2)]);
    snap(at,V().set(1.1,.9,1.1).multiplyScalar(type==="Cave Bear"?1.6:1),type+' dead');snap(at,V().set(-1.0,1.0,-.7).multiplyScalar(type==="Cave Bear"?1.6:1),type+' dead, other side');
    WORLD.scene.remove(e.mesh);});
  window.requestAnimationFrame=raf;
  const c=document.createElement('canvas');c.width=720;c.height=240*kinds.length;const X=c.getContext('2d');tiles.forEach((T,i)=>X.drawImage(T,(i%3)*240,Math.floor(i/3)*240));
  return {png:c.toDataURL(),info};
});
fs.writeFileSync(process.argv[2]||'/tmp/claude-0/sp/shot.png', Buffer.from(r.png.split(',')[1],'base64'));
console.log(JSON.stringify(r.info), g.errs);
await g.close();
