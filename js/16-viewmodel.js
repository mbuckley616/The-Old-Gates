let vmSword=null,vmGlow=null,vmEnchantLight=null;
// ── Casting animation state ─────────────────────────────────────
// The equipped weapon animates in place during a cast — thrust forward for projectiles,
// raise overhead for self-buffs. A glowing orb appears at the weapon's tip, charging up
// then fading as the projectile releases. See startCastAnim() + the vmSword animation tick.
let castT=0;               // seconds remaining in cast animation
const CAST_ANIM_DURATION=0.55;
let castAnimType='projectile';
let castSpellSchoolCol=0xffffff;
function isCasting(){return castT>0;}
// ── v70 — First-person hands ──────────────────────────────────────────────
// A reusable low-poly fist+forearm clamped to a weapon/shield grip anchor.
// Because it's parented into the same viewmodel Group as the weapon, it inherits
// every swing/block/cast tween for free — no new animation code. Colour comes
// from the equipped Gauntlets item (EQ.hands); bare hands use a skin tone.
//
// "Same mesh, different colours" per the design: the geometry is identical for
// bare/leather/steel; only palmCol (main) and cuffCol (accent) change.
const HAND_SKIN = { palm: 0xc8a07a, cuff: 0xb08860 };   // bare-hand default tone
function _gauntletHandColors(){
  const g = EQ.hands;
  if(!g) return { palm: HAND_SKIN.palm, cuff: HAND_SKIN.cuff, metal:false };
  // Gauntlets carry matCol/matGuard like all makeItem armor. matCol = main
  // plate/glove colour, matGuard = strap/knuckle accent. Legacy items without
  // them fall back to a leather brown so old saves still render something sane.
  const palm = g.matCol || 0x6a4a2a;
  const cuff = g.matGuard || g.matCol || 0x4a3018;
  return { palm, cuff, metal:true };
}
// v70.1 — Arm colour from the equipped chestplate (sleeve / pauldron material).
// Same model as gauntlets but reads EQ.chest. Default tunic (no matCol) → a
// cloth tone so the bare-starter arm reads as a sleeve, not skin.
const ARM_CLOTH = { sleeve: 0x6a5a44, accent: 0x4a3e30 };  // default tunic
function _chestArmColors(){
  const c = EQ.chest;
  // S394 — nothing on the chest is the linen shirt cut at the shoulder: a bare arm (Michael's B on #83)
  if(!c) return { sleeve: HAND_SKIN.palm, accent: HAND_SKIN.cuff };
  if(!c.matCol) return { sleeve: ARM_CLOTH.sleeve, accent: ARM_CLOTH.accent };
  return { sleeve: c.matCol, accent: c.matGuard || c.matCol };
}
// S536 — the hand on every held weapon, shield and torch is the fists' own (Michael, the inspector: "the fist/hand mesh is very
// dated and ugly ... at least in sync with the 'fists' weapon mesh"; it was a box with a knuckle bar, a thumb and a cuff). It
// is buildFistMesh closed round the haft: the haft runs along y through the curl of the fingers, the index finger uppermost,
// the back of the hand outward (+x for the right hand), and a short forearm (GRIP_FOREARM) back towards you and a little down
// and out to that side, where the arm bridge takes it to the shoulder. The anchor sits on the haft; userData.elbow is the
// forearm's end. isLeft mirrors it; scale sizes the whole unit.
const GRIP_FOREARM=.2;
function buildHandMesh(isLeft, scale){
  const h=new THREE.Group(),sd=isLeft?-1:1;
  const tilt=new THREE.Group();tilt.rotation.order='YXZ';tilt.rotation.set(.32,sd*.5,0);h.add(tilt);
  const turn=new THREE.Group();turn.rotation.z=-sd*Math.PI/2;tilt.add(turn);
  // the fist's curl (where the fingers close on the palm) is about (0,−.02,−.022) in its own frame: put that on the haft
  const f=buildFistMesh(!!isLeft,GRIP_FOREARM);f.position.set(0,.02,.022);turn.add(f);
  h.userData.isHandAnchor=true;h.userData.elbow=f.userData.elbow;h.userData.fist=f;
  h.scale.setScalar(scale||1);
  return h;
}
// ── v70.2 — Dynamic arm bridges (two-anchor) ──────────────────────────────
// An arm is a single stretchy limb that spans from a FIXED shoulder anchor
// (notional torso, never moves) to the WRIST (the hand, which follows the
// swinging weapon). Rebuilt geometry on equip (for colour); repositioned/
// stretched every frame in _updateArmBridge so it always connects the two
// points regardless of how the weapon swings.
//
// Shoulder anchors in VM-space. Right shoulder for the weapon arm (lower-right,
// below+right of the weapon grip rest); left shoulder for the offhand arm.
const SHOULDER_R = new THREE.Vector3( 0.40, -0.66, -0.52);
const SHOULDER_L = new THREE.Vector3(-0.40, -0.66, -0.52);
let vmArmR = null;   // weapon-hand arm bridge
let vmArmL = null;   // offhand (shield/torch) arm bridge
// Build the arm bridge mesh: a unit-length sleeve cylinder oriented along +Y,
// so _updateArmBridge can scale Y to the shoulder→wrist distance and rotate it
// into place. Coloured by the chestplate (sleeve) like the old static arm.
function buildArmBridge(){
  const a = _chestArmColors();
  const g = new THREE.Group();
  // v70.3 — Single tapered sleeve, unit height (1.0), origin at the SHOULDER
  // end (y=0) reaching to the WRIST end (y=1) so _updateArmBridge just scales
  // Y to the shoulder→wrist distance. One piece — the earlier 2-cylinder +
  // elbow-band version read as separate chunks at viewmodel scale.
  const sleeveMat = new THREE.MeshLambertMaterial({ color: a.sleeve });
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(.044,.058,1.0,8), sleeveMat);
  sleeve.position.y = 0.5;     // centre the unit-height cylinder so y spans 0→1
  g.add(sleeve);
  g.userData.unitLen = 1.0;
  return g;
}
// Per-frame: orient + stretch the arm bridge to span shoulder→wrist.
// Reusable temporaries to avoid per-frame allocation.
const _armWrist = new THREE.Vector3();
const _armDir   = new THREE.Vector3();
const _armUp    = new THREE.Vector3(0,1,0);
const _armQuat  = new THREE.Quaternion();
function _updateArmBridge(bridge){
  if(!bridge) return;
  const hand = bridge.userData.wristHand;
  const shoulder = bridge.userData.shoulder;
  if(!hand || !shoulder){ bridge.visible=false; return; }
  bridge.visible = true;
  // Wrist position in VM-space. The hand is parented to the swinging weapon
  // group, so its world matrix already reflects the current swing pose.
  hand.getWorldPosition(_armWrist);
  // Direction shoulder→wrist, and the distance to stretch across.
  _armDir.subVectors(_armWrist, shoulder);
  const len = _armDir.length();
  if(len < 1e-4){ bridge.visible=false; return; }
  _armDir.normalize();
  // Anchor the bridge AT the shoulder; rotate its local +Y to point at wrist;
  // scale Y so the unit-length geometry (0→1) reaches exactly to the wrist.
  bridge.position.copy(shoulder);
  _armQuat.setFromUnitVectors(_armUp, _armDir);
  bridge.quaternion.copy(_armQuat);
  bridge.scale.set(1, len / (bridge.userData.unitLen||1), 1);
}
// S396 — fists on screen (Michael's A on #80: both fists up, the right jabs and turns palm-down as it lands, the power
// attack the same punch harder, block brings both to the face, the left keeps its guard; a shield or torch takes the left).
// Each fist is one vertex-coloured mesh on the people's shape kit: the back of the hand over the palm, four fingers folded
// in two joints (the front face of the fist is their first segments, their second turned in under it), the knuckles,
// the thumb laid across the first two fingers, a tapered wrist, and the forearm to the elbow in one piece with the hand,
// so the wrist cannot come away from the arm. The fist faces −z with the back of the hand up; the forearm runs +z to the
// elbow, where the arm bridge takes it to the shoulder. left mirrors it.
const FIST_ELBOW=.34;
function _fpMerge(parts){
  const gs=parts.map(([geo,col,m])=>{const q=geo.index?geo.toNonIndexed():geo;q.applyMatrix4(m);const n=q.attributes.position.count,c=new Float32Array(n*3),cc=new THREE.Color(col);
    for(let i=0;i<n;i++){c[i*3]=cc.r;c[i*3+1]=cc.g;c[i*3+2]=cc.b;}q.setAttribute('color',new THREE.BufferAttribute(c,3));return q;});
  let N=0;gs.forEach(q=>N+=q.attributes.position.count);const P=new Float32Array(N*3),Nm=new Float32Array(N*3),Cl=new Float32Array(N*3);let o=0;
  gs.forEach(q=>{P.set(q.attributes.position.array,o*3);Nm.set(q.attributes.normal.array,o*3);Cl.set(q.attributes.color.array,o*3);o+=q.attributes.position.count;q.dispose();});
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(P,3));out.setAttribute('normal',new THREE.BufferAttribute(Nm,3));out.setAttribute('color',new THREE.BufferAttribute(Cl,3));return out;}
function buildFistMesh(left,el){
  el=el||FIST_ELBOW;const sx=left?1:-1,hc=_gauntletHandColors(),ac=_chestArmColors(),parts=[];
  // the view scene's light is bright and warm: the skin is taken down to read as skin there (as the prototype's)
  const dim=(h,k)=>new THREE.Color(h).multiplyScalar(k).getHex();
  const metal=!!hc.metal,skin=dim(hc.palm,metal?.9:.64),shade=dim(hc.palm,metal?.72:.54),cuff=dim(hc.cuff,metal?.85:.6);
  const bare=ac.sleeve===HAND_SKIN.palm,sleeve=bare?skin:dim(ac.sleeve,.85);
  const M=(x,y,z,rx,ry,rz,s)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),s?new THREE.Vector3(s[0],s[1],s[2]):new THREE.Vector3(1,1,1));
  // the back of the hand, domed a little, and the palm under it
  parts.push([SK.rbox(.08,.032,.066,.013,2),skin,M(0,.016,.008,.06,0,0)]);
  parts.push([SK.rbox(.074,.034,.054,.014,2),shade,M(0,-.012,.014)]);
  // the fingers, index (thumb side) to little: their width, length and set-back
  const F=[[.0195,1,0],[.0195,1.04,-.002],[.0185,.97,.002],[.0165,.86,.008]];
  F.forEach(([w,L,dz],i)=>{const x=sx*(.029-i*.0195);
    parts.push([SK.ball(.0115,8,6),skin,M(x,.024,-.03+dz,0,0,0,[1,.8,1])]);
    parts.push([SK.rbox(w,.05*L,.022,.009,2),skin,M(x,-.004,-.04+dz,-.1,0,0)]);
    parts.push([SK.rbox(w*.95,.02,.032*L,.0085,2),shade,M(x,-.034,-.026+dz,.1,0,0)]);});
  // the thumb: its root in the ball of the hand, its last joint across the second segments of the first two fingers
  parts.push([SK.ball(.022,9,7),shade,M(sx*.034,-.018,.014,0,0,0,[.8,.75,1.1])]);
  parts.push([SK.rbox(.02,.02,.036,.009,2),skin,M(sx*.036,-.03,-.014,0,sx*-.35,0)]);
  parts.push([SK.rbox(.036,.019,.02,.009,2),skin,M(sx*.014,-.04,-.05,0,0,sx*.05)]);
  // the wrist, narrower than the hand, and the forearm to the elbow
  parts.push([SK.cyl(.03,.027,.05,12),metal?cuff:skin,M(0,.0,.06,Math.PI/2,0,0,[1.2,1,.85])]);
  parts.push([SK.cyl(.041,.03,el-.085,12),bare?skin:sleeve,M(0,.0,.085+(el-.085)/2,Math.PI/2,0,0,[1.12,1,.9])]);
  if(!bare)parts.push([SK.torus(.031,.005,5,14),dim(ac.accent,.85),M(0,.0,.088,0,0,0,[1.12,.9,1])]);
  parts.push([SK.ball(.043,10,8),bare?skin:sleeve,M(0,.0,el,0,0,0,[1.1,.95,1])]);
  const geo=_fpMerge(parts),mesh=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true}));
  const g=new THREE.Group();g.add(mesh);g.rotation.order='YXZ';
  const elbow=new THREE.Object3D();elbow.position.set(0,0,el);g.add(elbow);g.userData.elbow=elbow;g.userData.fist=true;g.userData.armCol=bare?skin:sleeve;
  return g;}
// the arm from the shoulder to the fist's elbow, in the forearm's own colour
const FIST_SHOULDER_R=new THREE.Vector3(.3,-.78,-.12),FIST_SHOULDER_L=new THREE.Vector3(-.3,-.78,-.12);
function _fistBridge(shoulder,fist){const b=buildArmBridge();b.userData.shoulder=shoulder;b.userData.wristHand=fist.userData.elbow;
  b.traverse(o=>{if(o.isMesh)o.material.color.setHex(fist.userData.armCol);});return b;}
// the right fist's poses, [x,y,z, pitch,yaw,roll] (YXZ): pitch raises the forearm under the fist, roll turns the palm in.
// The left mirrors them. rest: low in the corners, thumbs up; jab: out at the middle of the view, palm down; guard: both
// fists before the face; cock: the power punch's draw, back by the shoulder.
const FIST_POSE={rest:[.18,-.215,-.48,.85,.2,-.45],jab:[.035,-.13,-.74,.1,.02,0],guard:[.09,-.075,-.4,1.3,.18,-.4],cock:[.24,-.19,-.36,1,.3,-.55]};
function vmFistPose(gb,pb,sway,bob){
  const u=vmSword.userData,fL=u.fistL,SP=ANIM_PARAMS.swing,R=FIST_POSE;
  const ease=t=>(1-Math.cos(Math.max(0,Math.min(1,t))*Math.PI))/2,mix=(A,B,t)=>A.map((v,i)=>v+(B[i]-v)*t);
  // the jab: a short draw, out to full reach as the strike lands (impactPoint), held a beat, and back
  const p=u.swingMax>0?1-swingT/u.swingMax:0,ip=Math.max(.2,Math.min(.8,SP.impactPoint||.5)),a=ip*.35;let e=0;
  if(p>0)e=p<a?-.25*ease(p/a):p<ip?-.25+1.25*ease((p-a)/(ip-a)):p<ip+.1?1:1-ease((p-ip-.1)/(.9-ip));
  let r=mix(mix(R.rest,R.guard,gb),R.cock,pb);
  r=e>=0?mix(r,R.jab,e):mix(r,R.cock,-e);
  if(u.swingIsPower&&e>0){r[1]+=.02*e;r[2]-=.07*e;}
  vmSword.position.set(r[0]+sway,r[1]+bob,r[2]);vmSword.rotation.set(r[3],r[4],r[5]);
  if(fL){const l=mix(R.rest,R.guard,gb);fL.position.set(-l[0]+sway,l[1]+bob,l[2]);fL.rotation.set(l[3],-l[4],-l[5]);}}
function buildViewmodel(){
  if(vmSword){if(vmSword.userData.fistL)VM_SCENE.remove(vmSword.userData.fistL);VM_SCENE.remove(vmSword);vmSword=null;}
  vmGlow=null;vmEnchantLight=null;
  // v70.2 — clear the weapon arm bridge; rebuilt at the end with the new hand.
  if(vmArmR){ VM_SCENE.remove(vmArmR); vmArmR=null; }
  const w=EQ.weapon;
  // S396 — an empty hand is the fists: the right is the view model the swing drives, the left buildShieldViewmodel's
  if(!w){ if(vmArmL){VM_SCENE.remove(vmArmL);vmArmL=null;}
    const f=buildFistMesh(false);f.userData.fists=true;vmSword=f;VM_SCENE.add(f);
    vmArmR=_fistBridge(FIST_SHOULDER_R,f);VM_SCENE.add(vmArmR);vmFistPose(0,0,0,0);
    if(typeof buildShieldViewmodel==='function') buildShieldViewmodel();
    return; }

  // Resolve material colours — from new item system or legacy name matching
  let bladeCol=0x8a7060,guardCol=0x6a5040,matGlow=null;
  if(w.matCol){bladeCol=w.matCol;guardCol=w.matGuard||w.matCol;matGlow=w.matGlow;}
  else{
    // Legacy fallback for old named items
    const legacyMap={Rusty:[0x8a7060,0x6a5040],Iron:[0xa8b0b8,0x787880],
      Short:[0xc0c8d0,0x909098],Battle:[0xb0a890,0x807060],Steel:[0xdde8ec,0xa0b0b8],
      Enchant:[0x88aaff,0x5566cc],Mystic:[0xcc88ff,0x8844cc],Legendary:[0xffdd44,0xcc8800]};
    for(const[k,v] of Object.entries(legacyMap)){if(w.name.includes(k)){bladeCol=v[0];guardCol=v[1];break;}}
  }

  // Enchantment glow overrides material glow
  const enchCol=w.enchant?w.enchant.col:null;
  const glowCol=enchCol||matGlow;

  const bladeMat=new THREE.MeshLambertMaterial({color:bladeCol});
  const guardMat=new THREE.MeshLambertMaterial({color:guardCol});
  const handleMat=new THREE.MeshLambertMaterial({color:0x4a2808});
  const g=new THREE.Group();
  const shape=w.weaponShape||'sword';

  // v61ad: bespoke viewmodel for The Forge-Man's Hammer — Bram's last work.
  // Smith's-hammer silhouette (not war-mace): rectangular iron head + back
  // wedge + dark-wood haft + brass band/pommel + leather-wrapped grip + subtle
  // ember emissive on the striking face + stamped forge-man's mark. Gated by
  // name so shop maces render unchanged. All positions local to the group (g)
  // which is repositioned/rotated at the end like any other viewmodel.
  if(w.name==="The Forge-Man's Hammer"){
    const ironMat     = new THREE.MeshLambertMaterial({color:0x3a3a3c});        // Darkened iron head
    const darkWoodMat = new THREE.MeshLambertMaterial({color:0x2a1a0c});        // Polished dark wood haft
    const brassMat    = new THREE.MeshLambertMaterial({color:0x8a6a28});        // Brass band + pommel cap
    const leatherMat  = new THREE.MeshLambertMaterial({color:0x2a1810});        // Dark leather grip wrap
    const rivetMat    = new THREE.MeshLambertMaterial({color:0x5a5048});        // Iron rivet
    // Ember glow on striking face — MeshLambertMaterial supports emissive; keep
    // intensity low so it reads as "residual forge warmth" not "magic weapon".
    const strikeMat   = new THREE.MeshLambertMaterial({
      color:0x3a3a3c, emissive:0x3a1a08, emissiveIntensity:0.30,
    });
    const markMat     = new THREE.MeshLambertMaterial({color:0x1a1a1c});        // Stamped mark (recessed)

    // ── Haft ──────────────────────────────────────────────────────────────
    // A touch longer and thicker than a shop mace — reads as smith's tool.
    const haft=new THREE.Mesh(new THREE.BoxGeometry(.028,.34,.028),darkWoodMat);
    haft.position.y=.04;
    g.add(haft);

    // ── Leather grip wrap ─────────────────────────────────────────────────
    // Four stacked bands at the bottom third of the haft — the player's hand.
    // Slight z-offset to raise above the haft surface (anti-z-fighting).
    for(let bi=0; bi<4; bi++){
      const band=new THREE.Mesh(new THREE.BoxGeometry(.033,.018,.033),leatherMat);
      band.position.y = -.11 + bi*0.025;
      g.add(band);
    }
    // Rivet where the wrap terminates (bottom of wrap)
    const rivet=new THREE.Mesh(new THREE.SphereGeometry(.006,5,4),rivetMat);
    rivet.position.set(.017,-.115,0);
    g.add(rivet);

    // ── Brass band at head-to-haft joint ──────────────────────────────────
    const bandHead=new THREE.Mesh(new THREE.BoxGeometry(.040,.018,.040),brassMat);
    bandHead.position.y=.22;
    g.add(bandHead);

    // ── Hammer head — rectangular iron block (smith's profile) ───────────
    // v61ae: head orientation swapped from +X/-X to +Z/-Z.
    // v61al: wrapped in a subgroup + rotated 90° Y — didn't land; the rotation
    //   put strike face along g-local +X, which is to the player's right, not
    //   forward toward enemies.
    // v61am: correct orientation. g-local -Z maps to world -Z (mostly) which
    //   is "forward into the scene" from the camera's POV. Strike face at
    //   z=-0.051 has its wide-face normal along -Z, so it faces forward
    //   toward enemies — what the player expects when swinging. Wedge/pein
    //   at +Z faces the player. No subgroup needed; just correct Z signs on
    //   the head pieces.
    const headBody=new THREE.Mesh(new THREE.BoxGeometry(.085,.11,.085),ironMat);
    headBody.position.y=.28;
    g.add(headBody);
    // Striking face — thin front layer with the emissive, faces FORWARD
    // (local -Z = world -Z ≈ toward the scene / away from the player).
    const strikeFace=new THREE.Mesh(new THREE.BoxGeometry(.080,.10,.018),strikeMat);
    strikeFace.position.set(0, .28, -.051);
    g.add(strikeFace);
    // Back wedge — pein, the narrow back-of-hammer. Points +Z (toward the
    // player from the viewmodel position). Tilted for silhouette, not a face.
    const wedge=new THREE.Mesh(new THREE.BoxGeometry(.028,.065,.038),ironMat);
    wedge.position.set(0, .28, .060);
    wedge.rotation.x = Math.PI/6;
    g.add(wedge);
    // Tapered second wedge segment — a real point rather than a box end
    const wedgeTip=new THREE.Mesh(new THREE.BoxGeometry(.018,.045,.018),ironMat);
    wedgeTip.position.set(0, .28, .085);
    g.add(wedgeTip);

    // ── Stamped forge-man's mark — side of the head ─────────────────────
    // v61an: stamped on BOTH lateral faces (+X and -X). The camera only
    // sees one side of the head at a time depending on yaw/walk angle, and
    // with the v61am orientation the strike face points forward (into
    // scene) and the wedge toward the player — so the camera is looking
    // mostly at the +X or -X lateral face depending on which way the
    // viewmodel is tilted. Mirroring the mark makes it visible from either
    // side without having to guess which face the camera will favor.
    const markBorder=new THREE.Mesh(new THREE.BoxGeometry(.005,.020,.020),markMat);
    markBorder.position.set(.044, .295, 0);
    g.add(markBorder);
    const markDot=new THREE.Mesh(new THREE.BoxGeometry(.007,.006,.006),brassMat);
    markDot.position.set(.046, .295, 0);
    g.add(markDot);
    // Mirror on -X side
    const markBorderL=new THREE.Mesh(new THREE.BoxGeometry(.005,.020,.020),markMat);
    markBorderL.position.set(-.044, .295, 0);
    g.add(markBorderL);
    const markDotL=new THREE.Mesh(new THREE.BoxGeometry(.007,.006,.006),brassMat);
    markDotL.position.set(-.046, .295, 0);
    g.add(markDotL);

    // ── Brass pommel cap at the butt of the haft ──────────────────────────
    const pommel=new THREE.Mesh(new THREE.BoxGeometry(.036,.022,.036),brassMat);
    pommel.position.y=-.145;
    g.add(pommel);

    // ── Subtle ember point light near the striking face ──────────────────
    // Forward of the head center (-Z local) so it glows in front of the
    // hammer, matching the strike face direction.
    const emberLight=new THREE.PointLight(0xcc6622, 0.35, 0.6);
    emberLight.position.set(0, .28, -.055);
    g.add(emberLight);
  } else if(shape==='dagger'){
    const blade=new THREE.Mesh(new THREE.BoxGeometry(.025,.28,.018),bladeMat);blade.position.y=.14;g.add(blade);
    const guard=new THREE.Mesh(new THREE.BoxGeometry(.10,.025,.022),guardMat);g.add(guard);
    const handle=new THREE.Mesh(new THREE.BoxGeometry(.022,.14,.018),handleMat);handle.position.y=-.08;g.add(handle);
    const pommel=new THREE.Mesh(new THREE.SphereGeometry(.025,6,5),guardMat);pommel.position.y=-.16;g.add(pommel);
  } else if(shape==='longsword'){
    const blade=new THREE.Mesh(new THREE.BoxGeometry(.028,.56,.014),bladeMat);blade.position.y=.28;g.add(blade);
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.014,.08,4),bladeMat);tip.position.y=.6;g.add(tip);
    const guard=new THREE.Mesh(new THREE.BoxGeometry(.16,.03,.022),guardMat);g.add(guard);
    const handle=new THREE.Mesh(new THREE.BoxGeometry(.022,.22,.018),handleMat);handle.position.y=-.13;g.add(handle);
    const pommel=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.03),guardMat);pommel.position.y=-.25;g.add(pommel);
  } else if(shape==='scimitar'){
    // Curved blade approximated with offset segments
    const bladeMesh=new THREE.Mesh(new THREE.BoxGeometry(.032,.36,.016),bladeMat);bladeMesh.position.set(.025,.18,0);bladeMesh.rotation.z=-.18;g.add(bladeMesh);
    const blade2=new THREE.Mesh(new THREE.BoxGeometry(.028,.2,.014),bladeMat);blade2.position.set(.055,.42,0);blade2.rotation.z=-.32;g.add(blade2);
    const guard=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,.02),guardMat);guard.rotation.z=.15;g.add(guard);
    const handle=new THREE.Mesh(new THREE.BoxGeometry(.022,.16,.018),handleMat);handle.position.y=-.10;g.add(handle);
    const pommel=new THREE.Mesh(new THREE.SphereGeometry(.028,6,5),guardMat);pommel.position.y=-.20;g.add(pommel);
  } else if(shape==='mace'){
    const handle=new THREE.Mesh(new THREE.BoxGeometry(.03,.30,.03),handleMat);handle.position.y=.05;g.add(handle);
    const head=new THREE.Mesh(new THREE.CylinderGeometry(.06,.05,.14,8),bladeMat);head.position.y=.28;g.add(head);
    // Flanges
    for(let f=0;f<6;f++){const ang=f/6*Math.PI*2;const fl=new THREE.Mesh(new THREE.BoxGeometry(.035,.12,.012),guardMat);fl.position.set(Math.cos(ang)*.055,.28,Math.sin(ang)*.055);fl.rotation.y=ang;g.add(fl);}
    const pommel=new THREE.Mesh(new THREE.SphereGeometry(.025,6,5),guardMat);pommel.position.y=-.12;g.add(pommel);
  } else if(shape==='flail'){
    const handle=new THREE.Mesh(new THREE.BoxGeometry(.028,.24,.028),handleMat);handle.position.y=.02;g.add(handle);
    // Chain links
    for(let c=0;c<4;c++){const link=new THREE.Mesh(new THREE.TorusGeometry(.02,.006,4,8),guardMat);link.position.y=.22+c*.045;link.rotation.x=c%2===0?0:Math.PI/2;g.add(link);}
    const ball=new THREE.Mesh(new THREE.SphereGeometry(.055,8,7),bladeMat);ball.position.y=.42;g.add(ball);
    // Spikes on ball
    for(let s=0;s<6;s++){const ang=s/6*Math.PI*2;const sp=new THREE.Mesh(new THREE.ConeGeometry(.010,.045,4),guardMat);sp.position.set(Math.cos(ang)*.055,.42,Math.sin(ang)*.055);sp.rotation.z=ang+Math.PI/2;g.add(sp);}
    const pommel=new THREE.Mesh(new THREE.SphereGeometry(.022,6,5),guardMat);pommel.position.y=-.12;g.add(pommel);
  } else if(shape==='staff'){
    // v61ea: staff shape — long handle topped with a small orb at the head.
    // The orb provides a "channeling" silhouette appropriate for spell-coded
    // weapons (Wooden Staff carries spellPower:1.05). A bound copper band sits
    // just under the orb as a visual termination of the haft. Pommel at the
    // butt is small — staffs are top-weighted, not balanced like swords.
    // Total length is greater than other 1H weapons (longsword-class), so the
    // tip Y entry below is bumped accordingly.
    const haft=new THREE.Mesh(new THREE.BoxGeometry(.024,.62,.024),handleMat);haft.position.y=.10;g.add(haft);
    // Copper band at the head — wraps the haft just under the orb
    const band=new THREE.Mesh(new THREE.BoxGeometry(.030,.020,.030),guardMat);band.position.y=.38;g.add(band);
    // Orb head — the channeling stone. Slightly emissive so it reads as
    // active even without an enchantment glow on top.
    const orbMat=new THREE.MeshLambertMaterial({color:bladeCol,emissive:bladeCol,emissiveIntensity:0.18});
    const orb=new THREE.Mesh(new THREE.SphereGeometry(.038,10,8),orbMat);orb.position.y=.43;g.add(orb);
    // Small pommel at the butt
    const pommel=new THREE.Mesh(new THREE.SphereGeometry(.020,5,4),guardMat);pommel.position.y=-.22;g.add(pommel);
  } else if(shape==='bow'){
    // v64 — Bow viewmodel. Rendered as a vertical bow gripped in the right
    // hand, slightly angled toward the player's left so it's visible past
    // the camera-edge offset. Two curved limbs (top + bottom), a riser at
    // grip height, and a bowstring drawn between the tips. The string is a
    // separate group element (limbs.bowString) so the draw-anim tick can
    // pull it back along Z over time. The arrow nock will sit at the
    // string's draw position when _bowDrawing is true (built dynamically).
    //
    // Materials: bladeCol = limb wood/horn color (tier-driven), guardCol =
    // riser color (darker accent), handleMat = grip wrap.
    const limbMat = new THREE.MeshLambertMaterial({color:bladeCol});
    const riserMat = new THREE.MeshLambertMaterial({color:guardCol});
    const stringMat = new THREE.MeshBasicMaterial({color:0xeeeeee});
    // ── Upper limb ──
    const upperLimb = new THREE.Mesh(new THREE.BoxGeometry(.022, .32, .020), limbMat);
    upperLimb.position.set(0, .22, 0);
    upperLimb.rotation.z = -.08;  // very slight curve cue
    g.add(upperLimb);
    // ── Upper tip wedge ──
    const upperTip = new THREE.Mesh(new THREE.ConeGeometry(.010, .04, 4), limbMat);
    upperTip.position.set(.012, .40, 0);
    g.add(upperTip);
    // ── Lower limb ──
    const lowerLimb = new THREE.Mesh(new THREE.BoxGeometry(.022, .32, .020), limbMat);
    lowerLimb.position.set(0, -.22, 0);
    lowerLimb.rotation.z = .08;
    g.add(lowerLimb);
    // ── Lower tip wedge ──
    const lowerTip = new THREE.Mesh(new THREE.ConeGeometry(.010, .04, 4), limbMat);
    lowerTip.position.set(.012, -.40, 0);
    lowerTip.rotation.z = Math.PI;
    g.add(lowerTip);
    // ── Riser (grip section, where the hand wraps) ──
    const riser = new THREE.Mesh(new THREE.BoxGeometry(.030, .14, .026), riserMat);
    riser.position.set(0, 0, 0);
    g.add(riser);
    // ── Leather grip wrap (subtle band on the riser) ──
    const grip = new THREE.Mesh(new THREE.BoxGeometry(.033, .08, .029), handleMat);
    g.add(grip);
    // ── Bowstring (v64.1) ──
    // The string is two diagonal segments anchored at the bow tips that meet
    // at a shared "nock point". At rest the nock point sits in the bow plane
    // and the two segments line up flush, reading as one straight string.
    // When drawn, the nock point translates back along -Z and each segment
    // pivots around its tip end to track the new nock position.
    //
    // Implementation: each segment is a Group whose origin sits at the tip.
    // The actual string box is a child of that group, positioned so its
    // "near end" coincides with the group origin and its length extends
    // toward y=0 (the rest nock position). Rotating the group around X
    // swings the string's far end forward/back in Z exactly as a real string
    // pivots around its tip. Length is recomputed each frame (the draw
    // distance is small in viewmodel space so a stretchy approximation reads
    // fine; if it ever doesn't, swap the box for a per-frame BufferGeometry).
    //
    // The pre-v64.1 implementation used two PARALLEL vertical bars that
    // translated straight back as the string drew. That made the string
    // visually separate from the bow when drawn (the bars slid back as
    // pillars, no connecting horizontal at the nock). Playtest screenshot
    // confirmed: "the bowstring separates completely from the bow." This
    // rebuild is the model fix — string segments now anchor at the tips.
    const stringHalfLen = 0.42;  // rest length of each segment (tip → midline)
    // Upper string segment — group anchored at upper tip (0.012, 0.40, 0)
    const stringTopGroup = new THREE.Group();
    stringTopGroup.position.set(.012, .40, 0);
    const stringTopBox = new THREE.Mesh(
      new THREE.BoxGeometry(.005, stringHalfLen, .005),
      stringMat
    );
    // Position the box so its TOP end is at the group origin (the tip) and
    // extends DOWN toward the midline. That way, rotating the group around
    // X pivots the bottom end (the nock) forward/back in Z without sliding
    // the box's top off the tip.
    stringTopBox.position.y = -stringHalfLen/2;
    stringTopGroup.add(stringTopBox);
    g.add(stringTopGroup);
    // Lower string segment — mirrored geometry
    const stringBotGroup = new THREE.Group();
    stringBotGroup.position.set(.012, -.40, 0);
    const stringBotBox = new THREE.Mesh(
      new THREE.BoxGeometry(.005, stringHalfLen, .005),
      stringMat
    );
    stringBotBox.position.y = stringHalfLen/2;
    stringBotGroup.add(stringBotBox);
    g.add(stringBotGroup);
    // Store refs for the draw-anim tick. The tick rotates these groups on X
    // each frame based on _bowDrawT, computing the angle from the tip to the
    // nock-point Z offset. Stored constants let the tick avoid hardcoding
    // the tip Y and half-length.
    g.userData.bowStringTopGroup = stringTopGroup;
    g.userData.bowStringBotGroup = stringBotGroup;
    g.userData.bowStringHalfLen = stringHalfLen;
    g.userData.bowTipY = .40; // distance from bow center to tip (both sides)
    // ── Arrow nock indicator (visible only while drawing; opacity 0 by default) ──
    // Small horizontal arrow shape pulled back with the string. Tick the
    // opacity in the draw-anim block in render() — invisible at rest.
    const nockArrow = new THREE.Mesh(
      new THREE.BoxGeometry(.006, .006, .26),
      new THREE.MeshBasicMaterial({color:0x886040,transparent:true,opacity:0})
    );
    nockArrow.position.set(.012, 0, 0);
    g.add(nockArrow);
    g.userData.bowNockArrow = nockArrow;
  } else if(shape==='claymore'){
    // v65 — Claymore viewmodel. The signature 2H sword: very long blade,
    // wide cruciform crossguard, ricasso (thicker section above the guard —
    // a real claymore feature where the half-sword grip lands), long two-
    // hand grip, and a wheel pommel. Reads visibly LONGER than longsword.
    const blade=new THREE.Mesh(new THREE.BoxGeometry(.032,.78,.016),bladeMat);blade.position.y=.46;g.add(blade);
    // Tip — tapered cone at the top of the blade
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.016,.10,4),bladeMat);tip.position.y=.90;g.add(tip);
    // Ricasso — wider thicker section just above the crossguard (half-sword grip lands here)
    const ricasso=new THREE.Mesh(new THREE.BoxGeometry(.042,.07,.020),bladeMat);ricasso.position.y=.08;g.add(ricasso);
    // Wide cruciform crossguard — wider than longsword (.16) to match scale
    const guard=new THREE.Mesh(new THREE.BoxGeometry(.22,.034,.024),guardMat);g.add(guard);
    // Subtle guard finials — small wedges at each guard tip
    const guardL=new THREE.Mesh(new THREE.ConeGeometry(.014,.025,4),guardMat);guardL.position.set(-.115,0,0);guardL.rotation.z=Math.PI/2;g.add(guardL);
    const guardR=new THREE.Mesh(new THREE.ConeGeometry(.014,.025,4),guardMat);guardR.position.set( .115,0,0);guardR.rotation.z=-Math.PI/2;g.add(guardR);
    // Long two-hand grip (longer than longsword's .22 → .30)
    const handle=new THREE.Mesh(new THREE.BoxGeometry(.024,.30,.020),handleMat);handle.position.y=-.17;g.add(handle);
    // Mid-grip band — visual divider between the two hands' grip zones
    const gripBand=new THREE.Mesh(new THREE.BoxGeometry(.028,.014,.024),guardMat);gripBand.position.y=-.17;g.add(gripBand);
    // Wheel pommel — flat disc, classic claymore termination
    const pommel=new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,.022,10),guardMat);pommel.position.y=-.34;pommel.rotation.x=Math.PI/2;g.add(pommel);
  } else if(shape==='greataxe'){
    // v65 — Great Axe viewmodel. Straight haft topped with a chunky single-bit
    // head; reinforcing iron langets running down the haft from the head;
    // tail spike for the back-end. Reads as HEAVY (asymmetric head silhouette).
    const haft=new THREE.Mesh(new THREE.BoxGeometry(.028,.72,.028),handleMat);haft.position.y=.10;g.add(haft);
    // Iron langets — two thin reinforcing strips running down from the head along the haft
    const langetL=new THREE.Mesh(new THREE.BoxGeometry(.006,.18,.030),guardMat);langetL.position.set(-.014,.36,0);g.add(langetL);
    const langetR=new THREE.Mesh(new THREE.BoxGeometry(.006,.18,.030),guardMat);langetR.position.set( .014,.36,0);g.add(langetR);
    // Head — large chunky block, asymmetric to one side (the bit)
    const headBlock=new THREE.Mesh(new THREE.BoxGeometry(.045,.16,.045),bladeMat);headBlock.position.set(0,.46,0);g.add(headBlock);
    // Axe bit — wider than the head block, the cutting edge
    const bit=new THREE.Mesh(new THREE.BoxGeometry(.10,.18,.020),bladeMat);bit.position.set(.054,.46,0);g.add(bit);
    // Bit edge — thin emissive-tinted leading edge for "honed" feel
    const bitEdge=new THREE.Mesh(new THREE.BoxGeometry(.012,.18,.018),bladeMat);bitEdge.position.set(.108,.46,0);g.add(bitEdge);
    // Top spike — small spike at the top of the head, common on poleaxes
    const topSpike=new THREE.Mesh(new THREE.ConeGeometry(.014,.045,4),bladeMat);topSpike.position.set(0,.565,0);g.add(topSpike);
    // Butt spike — tail-end termination
    const buttSpike=new THREE.Mesh(new THREE.ConeGeometry(.014,.045,4),bladeMat);buttSpike.position.y=-.30;buttSpike.rotation.z=Math.PI;g.add(buttSpike);
    // Leather grip wrap at the bottom third (where the lower hand rests)
    for(let bi=0;bi<3;bi++){
      const band=new THREE.Mesh(new THREE.BoxGeometry(.032,.020,.032),handleMat);
      band.position.y=-.18+bi*0.030;g.add(band);
    }
  } else if(shape==='warhammer'){
    // v65 — War Hammer viewmodel. Straight haft, square head with back-pein,
    // langets like the great axe (steel weapon, real reinforcement). Reads
    // BLUNT (rectangular head, no cutting edges). Shorter than the great axe.
    const haft=new THREE.Mesh(new THREE.BoxGeometry(.030,.66,.030),handleMat);haft.position.y=.04;g.add(haft);
    // Iron langets
    const langetL=new THREE.Mesh(new THREE.BoxGeometry(.006,.18,.034),guardMat);langetL.position.set(-.016,.32,0);g.add(langetL);
    const langetR=new THREE.Mesh(new THREE.BoxGeometry(.006,.18,.034),guardMat);langetR.position.set( .016,.32,0);g.add(langetR);
    // Hammer head — rectangular iron block, larger than mace's flanged head
    const headBody=new THREE.Mesh(new THREE.BoxGeometry(.10,.13,.10),bladeMat);headBody.position.y=.40;g.add(headBody);
    // Striking face — slightly proud on the +X side for silhouette
    const strikeFace=new THREE.Mesh(new THREE.BoxGeometry(.022,.115,.090),bladeMat);strikeFace.position.set(.055,.40,0);g.add(strikeFace);
    // Back pein — narrower wedge on the -X side, classic war hammer
    const pein=new THREE.Mesh(new THREE.BoxGeometry(.030,.072,.044),bladeMat);pein.position.set(-.060,.40,0);g.add(pein);
    const peinTip=new THREE.Mesh(new THREE.ConeGeometry(.018,.030,4),bladeMat);peinTip.position.set(-.085,.40,0);peinTip.rotation.z=Math.PI/2;g.add(peinTip);
    // Brass band at the head-to-haft joint
    const bandHead=new THREE.Mesh(new THREE.BoxGeometry(.044,.020,.044),guardMat);bandHead.position.y=.32;g.add(bandHead);
    // Leather grip wrap
    for(let bi=0;bi<3;bi++){
      const band=new THREE.Mesh(new THREE.BoxGeometry(.034,.020,.034),handleMat);
      band.position.y=-.16+bi*0.030;g.add(band);
    }
    // Butt cap
    const butt=new THREE.Mesh(new THREE.BoxGeometry(.036,.020,.036),guardMat);butt.position.y=-.28;g.add(butt);
  } else if(shape==='greatclub'){
    // v65 — Wooden Great Club viewmodel. Visibly WOODEN, not "wooden version
    // of a metal weapon." Thick haft swelling toward the head, rope wraps
    // banding the haft, a few iron studs at the head for emphasis. No metal
    // blade, no shaped head — this is a heavy stick made deadlier with rope
    // and studs. Lore-coherent rural smith's improvisation.
    //
    // The bladeCol from the material tier still affects the wood color
    // (wooden tier → light brown), which is correct.
    const woodLight = new THREE.MeshLambertMaterial({color:bladeCol});
    const woodDark  = new THREE.MeshLambertMaterial({color:guardCol});
    const ropeMat   = new THREE.MeshLambertMaterial({color:0x6a5028});
    const studMat   = new THREE.MeshLambertMaterial({color:0x383028});
    // Lower haft — thinner, where the hand grips
    const lowerHaft=new THREE.Mesh(new THREE.BoxGeometry(.034,.34,.034),woodLight);lowerHaft.position.y=-.08;g.add(lowerHaft);
    // Upper haft — swells toward the head (cylinder, tapered)
    const upperHaft=new THREE.Mesh(new THREE.CylinderGeometry(.050,.034,.30,8),woodLight);upperHaft.position.y=.20;g.add(upperHaft);
    // Head crown — the swollen striking end
    const head=new THREE.Mesh(new THREE.CylinderGeometry(.055,.050,.10,8),woodLight);head.position.y=.40;g.add(head);
    // Rope wraps — three bands around the head zone, anti-split reinforcement
    for(let r=0;r<3;r++){
      const wrap=new THREE.Mesh(new THREE.TorusGeometry(.054,.005,4,10),ropeMat);
      wrap.position.y=.32+r*.045;wrap.rotation.x=Math.PI/2;g.add(wrap);
    }
    // Iron studs — six small studs around the head, hammered in for emphasis
    for(let s=0;s<6;s++){
      const ang=s/6*Math.PI*2;
      const stud=new THREE.Mesh(new THREE.SphereGeometry(.008,4,4),studMat);
      stud.position.set(Math.cos(ang)*.054,.40,Math.sin(ang)*.054);
      g.add(stud);
    }
    // Leather grip wrap at the bottom
    for(let bi=0;bi<3;bi++){
      const band=new THREE.Mesh(new THREE.BoxGeometry(.038,.018,.038),woodDark);
      band.position.y=-.16+bi*0.024;g.add(band);
    }
  } else {
    // Default sword
    const blade=new THREE.Mesh(new THREE.BoxGeometry(.03,.42,.015),bladeMat);blade.position.y=.21;g.add(blade);
    const guard=new THREE.Mesh(new THREE.BoxGeometry(.12,.03,.022),guardMat);g.add(guard);
    const handle=new THREE.Mesh(new THREE.BoxGeometry(.025,.18,.02),handleMat);handle.position.y=-.11;g.add(handle);
    const pommel=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.03),guardMat);pommel.position.y=-.21;g.add(pommel);
  }

  // Enchantment visual — glow light + emissive particle ring
  if(glowCol){
    vmEnchantLight=new THREE.PointLight(glowCol,.9,1.2);vmEnchantLight.position.set(0,.2,0);g.add(vmEnchantLight);
    // Small orbiting spark meshes for weapon enchants
    if(enchCol){
      for(let p=0;p<3;p++){
        const spark=new THREE.Mesh(new THREE.SphereGeometry(.018,4,4),new THREE.MeshBasicMaterial({color:glowCol}));
        spark.position.set(0,.15+p*.12,0);spark.userData.orbitPhase=p*(Math.PI*2/3);
        g.add(spark);
      }
    }
  } else if(matGlow){
    // Material inherent glow — subtler
    vmEnchantLight=new THREE.PointLight(matGlow,.5,.9);vmEnchantLight.position.set(0,.2,0);g.add(vmEnchantLight);
  }

  // ── Cast orb at weapon tip ──────────────────────────────────────
  // Persists on the weapon; hidden by default (opacity 0). Driven by the castT animation tick.
  // Tip Y is per-shape so the orb sits at the business-end of the weapon.
  const tipY = {sword:0.42, dagger:0.26, longsword:0.62, scimitar:0.48, mace:0.32, flail:0.44, staff:0.46, torch:0.38, bow:0.40, claymore:0.90, greataxe:0.57, warhammer:0.46, greatclub:0.45}[shape] || 0.42;
  const castOrb = new THREE.Mesh(
    new THREE.SphereGeometry(.06,10,10),
    new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0})
  );
  castOrb.position.y = tipY;
  g.add(castOrb);
  const castOrbHalo = new THREE.Mesh(
    new THREE.SphereGeometry(.10,8,8),
    new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide})
  );
  castOrbHalo.position.y = tipY;
  g.add(castOrbHalo);
  const castOrbLight = new THREE.PointLight(0xffffff, 0, 1.4);
  castOrbLight.position.y = tipY;
  g.add(castOrbLight);
  g.userData.castOrb = castOrb;
  g.userData.castOrbHalo = castOrbHalo;
  g.userData.castOrbLight = castOrbLight;

  // ── v70 — Grip hand(s) ──────────────────────────────────────────────────
  // Per-shape grip Y (where the primary hand clamps the weapon). Parallels the
  // tipY table above. 2H weapons also get a SECOND hand lower on the haft to
  // sell the two-handed identity. Bow's hands sit on the central grip.
  // Per-shape grip Y — the HANDLE centre (well below the guard at y=0 and the
  // blade above it). v70.1: corrected downward; v70 values sat at the guard/
  // blade and read as "holding the blade." Values match each weapon's handle
  // mesh centre from buildViewmodel above.
  const gripY = {sword:-0.11, dagger:-0.08, longsword:-0.13, scimitar:-0.10,
    mace:-0.06, flail:-0.06, staff:-0.10, torch:-0.05, bow:0.0,
    claymore:-0.15, greataxe:-0.13, warhammer:-0.06, greatclub:-0.08}[shape];
  const _gripY = (gripY===undefined) ? -0.11 : gripY;
  const _is2H = !!(w.twoHand);
  const _isBow = shape==='bow';
  // Primary hand. For a bow it grips the riser; for melee it wraps the grip.
  const handMain = buildHandMesh(false, 1.0);
  handMain.position.set(0, _gripY, 0.018);   // slight +Z so the fist sits on the player-facing side of the haft
  g.add(handMain);
  g.userData.handMain = handMain;
  if(_is2H){
    // Second hand: bow → drawing hand near the string (offset toward player and
    // up); other 2H → lower on the haft (off-hand grip below the primary).
    const handLow = buildHandMesh(true, 0.96);
    if(_isBow){
      handLow.position.set(-0.02, _gripY - 0.02, 0.16);  // pulled back toward the string/cheek
    } else {
      handLow.position.set(0, _gripY - 0.16, 0.018);     // lower haft grip
    }
    g.add(handLow);
    g.userData.handLow = handLow;
  }
  // S266 — the weapon kit in first person too (Michael's A on Session 232): every weapon but the Forge-Man's Hammer (its own
  // model) is the kit's, tinted by the item, in the fist at the grip; the box weapon's meshes are hidden, the hands, the
  // enchantment's light and sparks kept. The view scene has nothing for metal to reflect, so the kit's metal is duller here.
  // The bow is not turned as it is in third person (which put the string towards the camera there and away from it here,
  // Michael's "facing backwards"): its belly faces out, and it is the kit's bow without its string, scaled to the view
  // model's (tips at ±.40), so the view model's own string still draws back with the nocked arrow.
  if(w.name!=="The Forge-Man's Hammer"&&typeof buildWeapon==='function'){
    const keep=new Set();[handMain,g.userData.handLow,g.userData.bowStringTopGroup,g.userData.bowStringBotGroup,g.userData.bowNockArrow].forEach(o=>o&&o.traverse(c=>keep.add(c)));
    g.children.forEach(c=>{if(keep.has(c)||c.isLight||c.userData.orbitPhase!==undefined)return;c.traverse(o=>{if(o.isMesh&&!keep.has(o))o.visible=false;});});
    let k;if(_isBow){k=new THREE.Group();const b=buildWeapon('bowbare',{tint:{wood:tpHex(w.matCol,0x6a4428)}});const S=.40/.34;b.scale.setScalar(S);b.position.set(.012,0,-.025*S);k.add(b);k.userData.kit='bow';}
    else{k=tpWeapon(w);k.position.y=handMain.position.y;}
    k.traverse(o=>{if(o.isMesh&&o.material.metalness>.3){o.material=o.material.clone();o.material.metalness=.25;o.material.roughness=.4;}});
    k.userData.fpKit=true;g.add(k);g.userData.kit=k;
  }

  // ── v70.2 — Arm bridges ────────────────────────────────────────────────
  // Weapon arm: right shoulder → primary hand. Recreated here (fresh chest
  // colour). The LEFT arm bridge is owned by buildShieldViewmodel (it knows
  // whether the offhand holds a shield/torch, or whether a 2H weapon's second
  // hand needs it). We call it at the end so the left arm reconciles after any
  // weapon change.
  if(vmArmR){ VM_SCENE.remove(vmArmR); vmArmR=null; }
  vmArmR = buildArmBridge();
  vmArmR.userData.shoulder = SHOULDER_R;
  vmArmR.userData.wristHand = handMain.userData.elbow||handMain;     // tracked each frame (S536: the grip's forearm end)
  VM_SCENE.add(vmArmR);
  // v70.1 — Raise 1H melee weapons slightly (feedback: they sat low). 2H and
  // bow keep the original height (they're longer / already framed well).
  const _restY = (_is2H || _isBow) ? -0.28 : -0.22;
  g.position.set(.28, _restY, -.55);
  g.rotation.set(.1,-.15,-.08);
  VM_SCENE.add(g);
  vmSword=g;
  // v70.2 — reconcile the left arm bridge (2H second hand vs offhand) now that
  // vmSword + its handLow exist. Guarded against recursion: buildShieldViewmodel
  // never calls back into buildViewmodel.
  if(typeof buildShieldViewmodel==='function') buildShieldViewmodel();
}

function buildShieldViewmodel(){
  if(vmShield){VM_SCENE.remove(vmShield);vmShield=null;}
  // v61gj-a4 — Clear any pending shield-impact state when the viewmodel is rebuilt.
  // This is the canonical "fresh base pose" moment — fires on load, equip change,
  // unequip, and initial spawn. Pre-a4, a save taken mid-impact (or one carrying
  // accumulated drift from the a2 bug) would resume with non-zero impact deltas
  // still active, undoing the rebuild on the next render frame. Belt-and-suspenders
  // with the position.z/rotation.z lerp — together they guarantee a clean reset
  // path even for problem saves from earlier builds.
  shieldImpactX = shieldImpactZ = shieldImpactRot = 0;
  shieldImpactT = shieldImpactMax = 0;
  // Remove any existing player torch light from all scenes
  if(window._playerTorchLight){
    [owScene,forestScene,ironhavenScene,dScene].forEach(sc=>{if(sc)try{sc.remove(window._playerTorchLight);}catch(e){}});
    window._playerTorchLight=null;
  }
  const sh=EQ.offhand;
  // v70.2 — buildShieldViewmodel owns the LEFT arm bridge. Clear it, then:
  //   - offhand present → bridge to the shield/torch hand (built below)
  //   - no offhand but a 2H weapon equipped → bridge to the weapon's 2nd hand
  //   - otherwise (1H, empty offhand) → no left arm (nothing in that hand)
  if(vmArmL){ VM_SCENE.remove(vmArmL); vmArmL=null; }
  if(vmSword&&vmSword.userData.fistL){VM_SCENE.remove(vmSword.userData.fistL);vmSword.userData.fistL=null;}
  if(!sh){
    const _w = EQ.weapon;
    // S396 — the empty off hand beside the fists is the left fist, in its guard
    if(!_w&&vmSword&&vmSword.userData.fists){const fl=buildFistMesh(true);VM_SCENE.add(fl);vmSword.userData.fistL=fl;
      vmArmL=_fistBridge(FIST_SHOULDER_L,fl);VM_SCENE.add(vmArmL);vmFistPose(0,0,0,0);return;}
    if(_w && _w.twoHand && vmSword && vmSword.userData.handLow){
      vmArmL = buildArmBridge();
      vmArmL.userData.shoulder = SHOULDER_L;
      vmArmL.userData.wristHand = vmSword.userData.handLow.userData.elbow||vmSword.userData.handLow;
      VM_SCENE.add(vmArmL);
    }
    return;
  }

  if(sh.torchType==='torch'){
    // ── Torch viewmodel ───────────────────────────────────────
    const g=new THREE.Group();
    const stickMat=new THREE.MeshLambertMaterial({color:0x6a3e12});
    const emberMat=new THREE.MeshBasicMaterial({color:0xff9922});
    const ironMat=new THREE.MeshLambertMaterial({color:0x383028});
    // Handle: long wooden cylinder
    const handle=new THREE.Mesh(new THREE.CylinderGeometry(.028,.034,.55,6),stickMat);
    handle.position.set(0,0,0);
    g.add(handle);
    // Wrap bands
    [-.18,-.06,.06].forEach(oy=>{
      const band=new THREE.Mesh(new THREE.CylinderGeometry(.036,.036,.03,6),ironMat);
      band.position.y=oy;g.add(band);
    });
    // Ember head at top
    const ember=new THREE.Mesh(new THREE.SphereGeometry(.055,6,5),emberMat);
    ember.position.y=.30;g.add(ember);
    // Glow cone above ember (widening upward — flame shape)
    const flameMat=new THREE.MeshBasicMaterial({color:0xff6600,transparent:true,opacity:.55});
    const flame=new THREE.Mesh(new THREE.ConeGeometry(.04,.14,5),flameMat);
    flame.position.y=.40;g.add(flame);
    // Small glow light on viewmodel (cosmetic only)
    const vmGl=new THREE.PointLight(0xff8833,.8,.8);vmGl.position.y=.35;g.add(vmGl);
    // v70 — left hand gripping the torch handle (low on the shaft).
    const torchHand=buildHandMesh(true,1.0);
    torchHand.position.set(0,-.04,.02);
    g.add(torchHand);
    g.userData.handMain=torchHand;
    vmArmL=buildArmBridge();vmArmL.userData.shoulder=SHOULDER_L;vmArmL.userData.wristHand=torchHand.userData.elbow;VM_SCENE.add(vmArmL); /* S536 */
    // Position: held in left hand, angled slightly upward
    g.position.set(-.28,-.26,-.50);
    g.rotation.set(-.25,-.15,.08);
    VM_SCENE.add(g);vmShield=g;

    // ── World torch light: follows player position each frame ─
    const tl=new THREE.PointLight(0xff9944,2.8,11);
    window._playerTorchLight=tl;
    // Will be added to the active scene in the game loop

  } else if(sh.shieldType==='shield'){
    // Use item material colour if available, otherwise legacy name match
    const col=sh.matCol||(sh.name.includes('Tower')?0x6070a0:sh.name.includes('Steel')?0x8090a8:0x8a6030);
    const rimCol=sh.matGuard||(sh.name.includes('Tower')?0x4a5878:sh.name.includes('Steel')?0x606878:0x6a4a18);
    const g=new THREE.Group();
    // S528 — the kit's shield, as your body carries it in third person (S227/S231): round for a buckler or round shield, the tower,
    // or the kite, the face the item's material and the rim and boss its guard (Michael, the inspector: "This looks like the legacy
    // shield still / does not match with the 3 shield types we have"). The kit is drawn at a person's scale facing +x: turned to
    // face away from you, sized to the old face's height (a buckler smaller, a tower taller) and centred where the box was.
    const nm=sh.name||'',big=/tower|kite/i.test(nm),round=/buckler|round/i.test(nm),kk=round?'round':big&&!/kite/i.test(nm)?'tower':'kite';
    const fc=typeof tpHex==='function'?tpHex(sh.matCol,col):col,rc=typeof tpHex==='function'?tpHex(sh.matGuard,0x4a3418):rimCol; /* the third person's own colour reading */
    const k=buildWeapon(kk,{tint:{face:fc,guard:rc,metal:rc}});k.rotation.y=Math.PI/2;k.updateMatrixWorld(true);
    {const bb=new THREE.Box3().setFromObject(k),hgt=(bb.max.y-bb.min.y)||1;k.scale.setScalar((round&&/buckler/i.test(nm)?.4:kk==='tower'?.62:.5)/hgt);
      k.updateMatrixWorld(true);bb.setFromObject(k);const ctr=bb.getCenter(new THREE.Vector3());k.position.sub(ctr);}
    g.add(k);g.userData.kit=kk;
    if(sh.matGlow||sh.enchant){
      const gc=sh.enchant?sh.enchant.col:sh.matGlow;
      if(gc){const gl=new THREE.PointLight(gc,.7,1.0);gl.position.set(0,0,.08);g.add(gl);}
    }
    // v70 — left hand gripping the shield from behind (player side). v70.1:
    // dropped the full Math.PI flip (it sent the arm pointing up/forward);
    // instead the hand sits behind the face with the arm trailing down to the
    // body via buildHandMesh's own arm bend. Pushed below centre where a
    // forearm strap sits.
    const shieldHand=buildHandMesh(true,1.0);
    shieldHand.position.set(.05,-.08,.05); /* S536 — the fists' hand on the strap, behind the face */
    g.add(shieldHand);
    g.userData.handMain=shieldHand;
    vmArmL=buildArmBridge();vmArmL.userData.shoulder=SHOULDER_L;vmArmL.userData.wristHand=shieldHand.userData.elbow;VM_SCENE.add(vmArmL); /* S536 */
    g.position.set(-.28,-.32,-.55);g.rotation.set(.1,-.5,.08);
    VM_SCENE.add(g);vmShield=g;
  }
}
