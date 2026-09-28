// node docs/prototypes/swings/shoot.mjs -> docs/prototypes/swings-*.png
// Backlog H.3, owed since Session 154: the player's swings in third person, with anticipation and follow-through.
// Today the body winds up over the first 30% of a swing, strikes over the next 30% and eases back over the last 40%,
// each part a smoothstep, the body's arm alone doing the work, and its forehand and backhand are not the first person's
// diagonals. The proposal keys the body to the first person's own phases (wind-up to .44, the hit at .55, the
// follow-through to .79, then back to guard): a wind-up that eases into a held coil (the torso turned away, the weight on
// the back foot), a strike that accelerates into the hit with a step of the front foot and the torso unwinding, a
// follow-through that carries past the hit and slows, and the same three swings the first person shows. index.html is not
// changed: this patches a copy. Rows: today, proposed. Columns: moments of one swing. The white line is the hand's path.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..', '..');
let src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const patch = (a, b) => { if (!src.includes(a)) throw new Error('patch missed: ' + a.slice(0, 60)); src = src.replace(a, b); };
// keep the first person's own variant beside the body's, for the proposal
patch("TP.swVar=TP_SWING_OF[vu.swingVariant||0]||0;", "TP.swVar=TP_SWING_OF[vu.swingVariant||0]||0;TP.swRaw=vu.swingVariant||0;");
// the proposal's arm eases faster (the strike is only ~60 ms long; at the usual rate the blade lags the hit)
patch("const vmReady=", "let ka=kf;const vmReady=");
patch("tpSet(R.torso,tx,ty,tz,kf);tpSet(R.shL,aL.x,aL.y,aL.z,kf);tpSet(R.shR,aR.x,aR.y,aR.z,kf);tpSet(R.elL,eL,0,0,kf);tpSet(R.elR,eR,0,0,kf);", "tpSet(R.torso,tx,ty,tz,ka);tpSet(R.shL,aL.x,aL.y,aL.z,ka);tpSet(R.shR,aR.x,aR.y,aR.z,ka);tpSet(R.elL,eL,0,0,ka);tpSet(R.elR,eR,0,0,ka);");
patch("tpSet(R.handR,wR,0,0,kf);", "tpSet(R.handR,wR,0,0,ka);");
// the proposal: poses keyed to the first person's phases; window.PROTO_SWING switches it on
patch("    if(TP.swVar===0){ // flat cut, right to left",
`    if(window.PROTO_SWING){const SP=ANIM_PARAMS.swing,A=SP.antEnd,I=SP.impactPoint,F=SP.sweepEnd;
      const cl=x=>Math.max(0,Math.min(1,x)),sm=x=>x*x*(3-2*x),eo=x=>1-(1-x)*(1-x)*(1-x);
      const w=eo(cl(p/(A-.06))),s=cl((p-A)/(I-.01-A)),s2=Math.pow(s,1.6),f=eo(cl((p-I+.01)/(F-I+.01))),r=sm(cl((p-F)/(1-F)));
      const L3=(a,b,c,d)=>{const x=_tpL(a,b,w),y=_tpL(x,c,s2),z=_tpL(y,d,f);return _tpL(z,a,r);};
      const V=[
        // forehand: high on the right, down across to the low left
        {sx:[-.22,-2.5,-1.15,-.55],sy:[0,-1.0,.55,1.15],el:[-.5,-1.0,-.12,-.3],wr:[.35,.7,1.45,1.2],ty:[0,-.6,.35,.65],tx:[0,-.08,.18,.28]},
        // backhand: high across on the left, down to the low right
        {sx:[-.22,-2.3,-1.2,-.7],sy:[0,1.05,-.35,-.95],el:[-.5,-1.5,-.12,-.25],wr:[.35,1.0,1.4,1.2],ty:[0,.5,-.3,-.6],tx:[0,-.05,.15,.22]},
        // overhead chop: up behind the head, straight down in front
        {sx:[-.22,-3.0,-1.2,-.8],sy:[0,-.12,-.05,0],el:[-.5,-1.2,-.08,-.2],wr:[.35,1.25,1.15,1.0],ty:[0,-.12,0,.05],tx:[0,-.18,.32,.4]}][TP.swRaw||0];
      const mg=TP.swPow?1.25:1;ka=Math.min(1,dt*50);
      aR={x:L3(...V.sx.map((v,i)=>i?v*(i===1?mg:1):v)),y:L3(...V.sy.map((v,i)=>v*(i?mg:1))),z:0};eR=L3(...V.el);wR=L3(...V.wr);ty=L3(...V.ty.map(v=>v*mg));tx=L3(...V.tx);
      // the weight: back onto the right foot through the coil, a step of the left into the hit, held through the carry
      const coil=w*(1-s2),step=s2*(1-r);thL=_tpL(thL,-.5*mg,step)+.12*coil;thR=_tpL(thR,.22,step)-.1*coil;
      tpSet(R.thighL,thL,0,0,kf);tpSet(R.thighR,thR,0,0,kf);tpSet(R.kneeL,.1+.45*step+.2*coil,0,0,kf);tpSet(R.kneeR,.15+.25*step+.3*coil,0,0,kf);
    }
    else if(TP.swVar===0){ // flat cut, right to left`);
patch("    thL-=.25*S*(1-Rc)*mag;tpSet(R.thighL,thL,0,0,kf);", "    if(!window.PROTO_SWING){thL-=.25*S*(1-Rc)*mag;tpSet(R.thighL,thL,0,0,kf);}");
const tmp = path.join(ROOT, 'tests', 'tmp'); fs.mkdirSync(tmp, { recursive: true });
const pat = path.join(tmp, 'swings.html'); fs.writeFileSync(pat, src);

const g = await boot({ src: pat }); const { page } = g;
await g.intoWorld();
const out = await page.evaluate(() => {
  forceTime(12); const cv = REN.domElement, W = cv.width, H = cv.height;
  const bx = px + 300, bz = pz, y0 = 60; const objs = [];
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshLambertMaterial({ color: 0x3a3430 })); scene.add(bg); objs.push(bg);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshLambertMaterial({ color: 0x4a4238 })); fl.rotation.x = -Math.PI / 2; fl.position.set(bx, y0, bz); scene.add(fl); objs.push(fl);
  const Lt = new THREE.PointLight(0xfff0d8, 1.1, 14); scene.add(Lt); objs.push(Lt);
  const cam = new THREE.PerspectiveCamera(30, W / H, .05, 100);
  const cases = [
    ['forehand', 0, false, { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', weight: 3 }, { name: 'Round Shield', slot: 'offhand', shieldType: 'shield' }],
    ['backhand', 1, false, { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', weight: 3 }, { name: 'Round Shield', slot: 'offhand', shieldType: 'shield' }],
    ['overhead chop', 2, false, { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', weight: 3 }, { name: 'Round Shield', slot: 'offhand', shieldType: 'shield' }],
    ['two-handed power chop', 2, true, { name: 'Claymore', slot: 'weapon', weaponShape: 'claymore', weight: 7, twoHand: true }, null]];
  const snaps = [0, .3, .44, .52, .58, .72, .9], names = ['guard', 'winding up .30', 'coiled .44', 'striking .52', 'past the hit .58', 'carrying .72', 'recovering .90'];
  const TW = 260, TH = 340, shots = [], stat = {};
  thirdPerson = true; yaw = 0;
  for (const [label, v, pow, wpn, off] of cases) {
    EQ.weapon = wpn; EQ.offhand = off; const rows = [];
    for (const on of [false, true]) {
      window.PROTO_SWING = on; tpUpdate(1 / 60, { moving: false, sprinting: false, camY: 1.6, now: performance.now() });
      const R = TP.rig; R.root.position.set(bx, y0, bz); R.root.rotation.y = Math.PI; R.root.visible = true;
      // face the camera three-quarters from the front and the body's right, the backdrop behind
      const fx = Math.sin(Math.PI), fz = Math.cos(Math.PI), ca = Math.PI - .95;
      cam.position.set(bx + Math.sin(ca) * 3.9, y0 + 1.2, bz + Math.cos(ca) * 3.9); cam.lookAt(bx, y0 + .95, bz);
      bg.position.set(bx - Math.sin(ca) * 3, y0 + 5, bz - Math.cos(ca) * 3); bg.lookAt(cam.position); Lt.position.set(cam.position.x, y0 + 2.6, cam.position.z);
      const st = { moving: false, sprinting: false, camY: 1.6, now: 0 }; const dt = 1 / 60;
      for (let i = 0; i < 30; i++) { swingT = 0; st.now += 16; tpPose(R, dt, st); }
      const dur = pow ? ANIM_PARAMS.swing.powerDur * 1.4 : ANIM_PARAMS.swing.normalDur;
      swingT = dur; vmSword.userData.swingMax = dur; vmSword.userData.swingVariant = v; vmSword.userData.swingIsPower = pow; TP.swMax = 0;
      const trail = [], row = []; let next = 0, frame = 0;
      // the point of the weapon farthest from the fist, found once and then carried with the weapon
      R.root.updateMatrixWorld(true); const wo = R.weapon || R.handR, hc = R.handR.getWorldPosition(new THREE.Vector3()); let far = hc.clone(), fd = 0;
      wo.traverse(m => { if (!m.isMesh) return; const P = m.geometry.attributes.position, q = new THREE.Vector3(); for (let i = 0; i < P.count; i++) { q.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); const d = q.distanceTo(hc); if (d > fd) { fd = d; far = q.clone(); } } });
      const farL = wo.worldToLocal(far.clone());
      const tip = () => { R.root.updateMatrixWorld(true); return wo.localToWorld(farL.clone()).project(cam); };
      const shoot = () => { scene.updateMatrixWorld(true); REN.render(scene, cam);
        const o = document.createElement('canvas'); o.width = TW; o.height = TH; const x = o.getContext('2d'); const sx = W / 2 - H * TW / TH / 2, sw = H * TW / TH; x.drawImage(cv, sx, 0, sw, H, 0, 0, TW, TH);
        x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 2; x.beginPath(); trail.forEach((q, i) => { const X = ((q.x + 1) / 2 * W - sx) / sw * TW, Y = (1 - q.y) / 2 * TH; i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.stroke(); row.push(o); };
      while (next < snaps.length) { const p = 1 - swingT / dur;
        if (p >= snaps[next] - 1e-6) { shoot(); next++; continue; }
        swingT = Math.max(1e-4, swingT - dt); st.now += 16; tpPose(R, dt, st); trail.push(tip()); frame++; }
      stat[label + (on ? ' proposed' : ' today')] = frame; rows.push(row); }
    const c = document.createElement('canvas'); c.width = TW * snaps.length; c.height = TH * 2 + 56; const x2 = c.getContext('2d'); x2.fillStyle = '#1a1612'; x2.fillRect(0, 0, c.width, c.height);
    x2.font = '20px serif'; x2.fillStyle = '#e8dcc0'; x2.fillText(label + (pow ? ' (a claymore)' : ' (a sword and round shield)') + ' — the hit lands at .55 in both', 8, 22);
    x2.font = '16px serif'; names.forEach((n, i) => x2.fillText(n, i * TW + 8, 48));
    rows.forEach((row, r) => { row.forEach((o, i) => x2.drawImage(o, i * TW, 56 + r * TH)); x2.fillStyle = '#e8dcc0'; x2.fillText(r ? 'proposed' : 'today', 8, 56 + r * TH + TH - 10); });
    const id = x2.getImageData(0, 0, c.width, c.height), d = id.data; for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] / 8) * 8; x2.putImageData(id, 0, 0);
    shots.push(c.toDataURL()); }
  objs.forEach(o => scene.remove(o)); window.PROTO_SWING = false; return { shots, stat }; });
out.shots.forEach((u, i) => fs.writeFileSync(path.join(here, '..', 'swings-' + (i + 1) + '.png'), Buffer.from(u.split(',')[1], 'base64')));
console.log(JSON.stringify(out.stat)); console.log('errors', g.errs); await g.close();
