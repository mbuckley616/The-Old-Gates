
// ══════════════════════════════════════════════════════════════
// HERB SYSTEM — global definitions shared by all zones
// ══════════════════════════════════════════════════════════════
// effect: known effect applied on use
// hiddenEffect: unlocked after HIDDEN_UNLOCK_COUNT *consumes* (not harvests)
// shape: mesh style — 'clump'|'leaf'|'root'|'spike'|'berry'|'fungus'|'fern'|'single'
const HIDDEN_UNLOCK_COUNT=15;
const HERB_DEF={
  // ── ASHENMOOR ────────────────────────────────────────────────
  firemoss:{name:'Firemoss',ico:'🌿',zone:'overworld',
    col:0xcc4411,glowCol:0xff6622,glowInt:.6,glowRad:1.8,stemCol:0x6a2808,shape:'clump',respawn:180,
    desc:'A smouldering orange moss. Burns faintly to the touch.',
    knownDesc:'Restores 15 HP',
    hiddenDesc:'+10% melee damage for 60s',
    item:{name:'Firemoss',ico:'🌿',type:'herb',
      effect:{type:'heal',amount:15},
      hiddenEffect:{type:'meleeDmg',mult:1.10,duration:60,label:'Firemoss Rush',col:'#ff6622'},
      buyPrice:8,sellMult:.8}},

  silverleaf:{name:'Silverleaf',ico:'🍃',zone:'overworld',
    col:0xc8ddc8,glowCol:0xaaccaa,glowInt:.4,glowRad:1.6,stemCol:0x3a6a3a,shape:'leaf',respawn:180,
    desc:'Pale shimmering leaves. Restores stamina when chewed.',
    knownDesc:'Restores 30 Stamina',
    hiddenDesc:'+20% sprint speed for 45s',
    item:{name:'Silverleaf',ico:'🍃',type:'herb',
      effect:{type:'stamina',amount:30},
      hiddenEffect:{type:'sprintSpeed',mult:1.20,duration:45,label:'Silverleaf Wind',col:'#aaccaa'},
      buyPrice:10,sellMult:.8}},

  heartroot:{name:'Heartroot',ico:'✦',zone:'overworld',
    col:0xffaa22,glowCol:0xff8800,glowInt:.9,glowRad:2.0,stemCol:0x6a4010,shape:'root',respawn:360,
    desc:'A rare amber root that crackles with arcane energy.',
    knownDesc:'Restores 60 Mana',
    hiddenDesc:'+10% spell damage for 60s',
    item:{name:'Heartroot',ico:'✦',type:'herb',
      effect:{type:'mana',amount:60},
      hiddenEffect:{type:'spellDmg',mult:1.10,duration:60,label:'Heartroot Surge',col:'#ff8800'},
      buyPrice:60,sellMult:.9}},

  ashwort:{name:'Ashwort',ico:'🌱',zone:'overworld',
    col:0x7a8a5a,glowCol:0xaabb88,glowInt:.3,glowRad:1.4,stemCol:0x4a5a2a,shape:'clump',respawn:200,
    desc:'Grey-green shrub of the moor. Bitter and astringent.',
    knownDesc:'Restores 8 HP',
    hiddenDesc:'Minimap pulse — reveals nearby enemies for 5s',
    item:{name:'Ashwort',ico:'🌱',type:'herb',
      effect:{type:'heal',amount:8},
      hiddenEffect:{type:'minimapPulse',duration:5,label:'Ashwort Pulse',col:'#aabb88'},
      buyPrice:5,sellMult:.7}},

  muirfhear:{name:'Muirfhear',ico:'🌾',zone:'overworld',
    col:0x2a3a18,glowCol:0x446622,glowInt:.3,glowRad:1.3,stemCol:0x1a2a08,shape:'spike',respawn:220,
    desc:'Dark moor grass. The old folk used it to move unseen.',
    knownDesc:'Restores 20 Stamina',
    hiddenDesc:'-30% enemy detection radius for 45s',
    item:{name:'Muirfhear',ico:'🌾',type:'herb',
      effect:{type:'stamina',amount:20},
      hiddenEffect:{type:'detectReduce',mult:0.70,duration:45,label:'Muirfhear Shroud',col:'#446622'},
      buyPrice:12,sellMult:.8}},

  goldenrod:{name:'Goldenrod',ico:'🌻',zone:'overworld',
    col:0xddaa22,glowCol:0xffcc44,glowInt:.4,glowRad:1.5,stemCol:0x5a7020,shape:'spike',respawn:160,
    desc:'Common roadside herb. Merchants carry it for luck.',
    knownDesc:'Restores 12 HP',
    hiddenDesc:'+5% gold from selling for 120s',
    item:{name:'Goldenrod',ico:'🌻',type:'herb',
      effect:{type:'heal',amount:12},
      hiddenEffect:{type:'goldFind',mult:1.05,duration:120,label:'Goldenrod Luck',col:'#ffcc44'},
      buyPrice:6,sellMult:.8}},

  thornberry:{name:'Thornberry',ico:'🍒',zone:'overworld',
    col:0xcc2222,glowCol:0xff4444,glowInt:.4,glowRad:1.4,stemCol:0x4a2808,shape:'berry',respawn:200,
    desc:'Red cluster on thorned bush. Fighters chew it before battle.',
    knownDesc:'Restores 18 HP',
    hiddenDesc:'+15% block effectiveness for 60s',
    item:{name:'Thornberry',ico:'🍒',type:'herb',
      effect:{type:'heal',amount:18},
      hiddenEffect:{type:'blockBoost',mult:1.15,duration:60,label:'Thornberry Guard',col:'#ff4444'},
      buyPrice:14,sellMult:.8}},

  coldmoss:{name:'Coldmoss',ico:'🔵',zone:'overworld',
    col:0x7799bb,glowCol:0x88aadd,glowInt:.5,glowRad:1.6,stemCol:0x3a5a6a,shape:'clump',respawn:200,
    desc:'Blue-grey moss found on old stone. Cold to the touch.',
    knownDesc:'Restores 25 Mana',
    hiddenDesc:'-20% spell mana cost for 45s',
    item:{name:'Coldmoss',ico:'🔵',type:'herb',
      effect:{type:'mana',amount:25},
      hiddenEffect:{type:'spellCost',mult:0.80,duration:45,label:'Coldmoss Clarity',col:'#88aadd'},
      buyPrice:18,sellMult:.8}},

  // ── DEEPWOOD FOREST ──────────────────────────────────────────
  fearnog:{name:'Fearnóg',ico:'🍄',zone:'forest',
    col:0xcc6622,glowCol:0xee8844,glowInt:.5,glowRad:1.6,stemCol:0x5a3010,shape:'fungus',respawn:240,
    desc:'Rust-orange bracket fungus. Bitter and fortifying.',
    knownDesc:'Restores 30 HP',
    hiddenDesc:'+25% physical damage resistance for 30s',
    item:{name:'Fearnóg',ico:'🍄',type:'herb',
      effect:{type:'heal',amount:30},
      hiddenEffect:{type:'physResist',mult:0.75,duration:30,label:'Fearnóg Shell',col:'#ee8844'},
      buyPrice:22,sellMult:.8}},

  shadowcap:{name:'Shadowcap',ico:'🟣',zone:'forest',
    col:0x441166,glowCol:0x8833cc,glowInt:.7,glowRad:1.8,stemCol:0x221033,shape:'fungus',respawn:300,
    desc:'Dark purple mushroom. Grows only where light never reaches.',
    knownDesc:'Restores 40 Mana',
    hiddenDesc:'Enemies lose track of you for 8s',
    item:{name:'Shadowcap',ico:'🟣',type:'herb',
      effect:{type:'mana',amount:40},
      hiddenEffect:{type:'vanish',duration:8,label:'Shadowcap Veil',col:'#8833cc'},
      buyPrice:35,sellMult:.85}},

  wolfsbane:{name:"Wolf's Bane",ico:'🤍',zone:'forest',
    col:0xeeeedd,glowCol:0xffffff,glowInt:.4,glowRad:1.5,stemCol:0x4a6a28,shape:'spike',respawn:220,
    desc:'White flower in forest clearings. Beasts avoid its scent.',
    knownDesc:'+2 HP/s regen for 60s',
    hiddenDesc:'-40% damage from beasts for 90s',
    item:{name:"Wolf's Bane",ico:'🤍',type:'herb',
      effect:{type:'hpRegen',rate:2,duration:60},
      hiddenEffect:{type:'beastResist',mult:0.60,duration:90,label:"Wolf's Bane",col:'#ffffff'},
      buyPrice:28,sellMult:.8}},

  caorthann:{name:'Caorthann',ico:'🔴',zone:'forest',
    col:0xdd3322,glowCol:0xff5544,glowInt:.5,glowRad:1.5,stemCol:0x3a2010,shape:'berry',respawn:240,
    desc:'Red rowan berry. Sacred in the old tradition.',
    knownDesc:'Restores 25 Stamina',
    hiddenDesc:'+20% XP from kills for 90s',
    item:{name:'Caorthann',ico:'🔴',type:'herb',
      effect:{type:'stamina',amount:25},
      hiddenEffect:{type:'xpBoost',mult:1.20,duration:90,label:'Caorthann Vigour',col:'#ff5544'},
      buyPrice:30,sellMult:.85}},

  deepmoss:{name:'Deepmoss',ico:'💚',zone:'forest',
    col:0x116622,glowCol:0x22aa44,glowInt:.5,glowRad:1.7,stemCol:0x0a3310,shape:'clump',respawn:200,
    desc:'Vivid green thick moss from the forest floor.',
    knownDesc:'Restores 35 Mana',
    hiddenDesc:'+2 HP/s regen for 120s',
    item:{name:'Deepmoss',ico:'💚',type:'herb',
      effect:{type:'mana',amount:35},
      hiddenEffect:{type:'hpRegen',rate:2,duration:120,label:'Deepmoss Mend',col:'#22aa44'},
      buyPrice:25,sellMult:.8}},

  briarweed:{name:'Briarweed',ico:'🌿',zone:'forest',
    col:0x7a5522,glowCol:0xaa8844,glowInt:.3,glowRad:1.3,stemCol:0x4a3010,shape:'fern',respawn:180,
    desc:'Tangled brown vine. Fighters chew it for a quick edge.',
    knownDesc:'Restores 20 Stamina',
    hiddenDesc:'+10% attack speed for 60s',
    item:{name:'Briarweed',ico:'🌿',type:'herb',
      effect:{type:'stamina',amount:20},
      hiddenEffect:{type:'atkSpeed',mult:1.10,duration:60,label:'Briarweed Edge',col:'#aa8844'},
      buyPrice:20,sellMult:.8}},

  luibhuisce:{name:'Luibh Uisce',ico:'💧',zone:'forest',
    col:0x44ccaa,glowCol:0x66eebb,glowInt:.8,glowRad:2.0,stemCol:0x2a6a4a,shape:'leaf',respawn:400,
    desc:'Translucent blue-green herb near forest streams. Pure mana source.',
    knownDesc:'Restores 50 Mana',
    hiddenDesc:'Fully restores all Mana',
    item:{name:'Luibh Uisce',ico:'💧',type:'herb',
      effect:{type:'mana',amount:50},
      hiddenEffect:{type:'manaFull',label:'Luibh Uisce Flood',col:'#66eebb'},
      buyPrice:55,sellMult:.9}},

  // ── IRONHAVEN / ACT II ───────────────────────────────────────
  ferrousweed:{name:'Ferrous Weed',ico:'🟤',zone:'ironhaven',
    col:0xaa4422,glowCol:0xcc6644,glowInt:.4,glowRad:1.4,stemCol:0x5a2810,shape:'spike',respawn:220,
    desc:'Rust-red spiky plant from iron-rich soil.',
    knownDesc:'Restores 20 HP',
    hiddenDesc:'+8 defense for 60s',
    item:{name:'Ferrous Weed',ico:'🟤',type:'herb',
      effect:{type:'heal',amount:20},
      hiddenEffect:{type:'defBoost',amount:8,duration:60,label:'Ferrous Guard',col:'#cc6644'},
      buyPrice:20,sellMult:.8}},

  graywort:{name:'Graywort',ico:'⚪',zone:'ironhaven',
    col:0xaaaaaa,glowCol:0xcccccc,glowInt:.3,glowRad:1.4,stemCol:0x5a5a5a,shape:'leaf',respawn:200,
    desc:'Ashen flat rosette found on road edges. Looks unremarkable.',
    knownDesc:'+1.5 HP/s regen for 60s',
    hiddenDesc:'+15% magic damage for 60s',
    item:{name:'Graywort',ico:'⚪',type:'herb',
      effect:{type:'hpRegen',rate:1.5,duration:60},
      hiddenEffect:{type:'magicDmg',mult:1.15,duration:60,label:'Graywort Surge',col:'#cccccc'},
      buyPrice:22,sellMult:.8}},

  caordubh:{name:'Caor Dubh',ico:'⚫',zone:'ironhaven',
    col:0x110011,glowCol:0x440033,glowInt:.6,glowRad:1.6,stemCol:0x220011,shape:'berry',respawn:360,
    desc:'Black berry. Tastes of iron and regret.',
    knownDesc:'-10 HP immediately',
    hiddenDesc:'+40% damage for 30s (risky)',
    item:{name:'Caor Dubh',ico:'⚫',type:'herb',
      effect:{type:'damage',amount:10},
      hiddenEffect:{type:'dmgBurst',mult:1.40,duration:30,label:'Caor Dubh Fury',col:'#cc0044'},
      buyPrice:40,sellMult:.9}},

  mistfern:{name:'Mist Fern',ico:'🌫️',zone:'ironhaven',
    col:0xccddcc,glowCol:0xddeedd,glowInt:.4,glowRad:1.5,stemCol:0x4a6a4a,shape:'fern',respawn:240,
    desc:'Pale translucent fern found in valley fog.',
    knownDesc:'Restores 45 Mana',
    hiddenDesc:'-20% stamina cost for 60s',
    item:{name:'Mist Fern',ico:'🌫️',type:'herb',
      effect:{type:'mana',amount:45},
      hiddenEffect:{type:'staminaCost',mult:0.80,duration:60,label:'Mist Fern Flow',col:'#ddeedd'},
      buyPrice:35,sellMult:.85}},

  stonecress:{name:'Stonecress',ico:'🟡',zone:'ironhaven',
    col:0xddcc66,glowCol:0xeedd88,glowInt:.4,glowRad:1.5,stemCol:0x5a5020,shape:'clump',respawn:260,
    desc:'Yellow-white plant from cliff faces. Rare.',
    knownDesc:'Restores 30 Stamina',
    hiddenDesc:'+20% max stamina for 90s',
    item:{name:'Stonecress',ico:'🟡',type:'herb',
      effect:{type:'stamina',amount:30},
      hiddenEffect:{type:'maxStamBuff',mult:1.20,duration:90,label:'Stonecress Endure',col:'#eedd88'},
      buyPrice:30,sellMult:.85}},

  veilwort:{name:'Veilwort',ico:'👁️',zone:'ironhaven',
    col:0xeeeebb,glowCol:0xffffcc,glowInt:.5,glowRad:1.6,stemCol:0x6a6a40,shape:'leaf',respawn:300,
    desc:'Near-invisible until you step close. Found near old walls.',
    knownDesc:'Restores 20 HP',
    hiddenDesc:'-25% all incoming damage for 20s',
    item:{name:'Veilwort',ico:'👁️',type:'herb',
      effect:{type:'heal',amount:20},
      hiddenEffect:{type:'dmgReduce',mult:0.75,duration:20,label:'Veilwort Ward',col:'#ffffcc'},
      buyPrice:38,sellMult:.85}},

  credearg:{name:'Cré Dearg',ico:'🔶',zone:'ironhaven',
    col:0xcc4422,glowCol:0xee6644,glowInt:.6,glowRad:1.8,stemCol:0x5a2010,shape:'clump',respawn:300,
    desc:'Deep red clay-like clump from riverbanks.',
    knownDesc:'+2.5 HP/s regen for 90s',
    hiddenDesc:'+30 HP restored gradually over 120s',
    item:{name:'Cré Dearg',ico:'🔶',type:'herb',
      effect:{type:'hpRegen',rate:2.5,duration:90},
      hiddenEffect:{type:'hpRegen',rate:0.25,duration:120,label:'Cré Dearg Mend',col:'#ee6644'},
      buyPrice:45,sellMult:.9}},

  duilleogghorm:{name:'Duilleog Ghorm',ico:'🔷',zone:'ironhaven',
    col:0x2244aa,glowCol:0x4466cc,glowInt:.7,glowRad:1.8,stemCol:0x112244,shape:'leaf',respawn:320,
    desc:'Deep blue leaf found in ancient ruins. Rare.',
    knownDesc:'Restores 40 Mana',
    hiddenDesc:'+25% spell effect duration for 90s',
    item:{name:'Duilleog Ghorm',ico:'🔷',type:'herb',
      effect:{type:'mana',amount:40},
      hiddenEffect:{type:'spellDuration',mult:1.25,duration:90,label:'Duilleog Ghorm Extend',col:'#4466cc'},
      buyPrice:50,sellMult:.9}},
};

// ── Plants sized by what they are (backlog H.5a, Session 167) ──
// Each herb is given what it is (a moss patch, a rosette, a tussock, a berry bush, a rowan sapling…) and a builder
// that places shape-kit parts and flat folded leaves, baked to one vertex-coloured geometry per kind, darker low down
// and on the underside so a bush has its own shade. The world instances that geometry per chunk, as before.
// A person is about 1.1 units tall: the plants run from .04 (a rosette on the road edge) to .85 (goldenrod, a rowan).
// Picking a bush, a sapling, a shrub, a bramble or the fungus on a stump leaves the plant: it stays, bare of what you
// took, and grows it back (PLANT_STAYS; the picked copy is PLANT_BUILD run with P.picked set). Prototype: docs/prototypes/plants.
const PLANT_KIND={
  firemoss:'moss',coldmoss:'moss',deepmoss:'moss',credearg:'clay',graywort:'rosette',stonecress:'cliffflower',
  silverleaf:'herb',luibhuisce:'waterleaf',duilleogghorm:'broadleaf',veilwort:'wisp',heartroot:'root',
  muirfhear:'tussock',goldenrod:'goldenrod',wolfsbane:'flowerspike',ferrousweed:'thistle',
  mistfern:'fern',briarweed:'bramble',ashwort:'shrub',thornberry:'bush',caordubh:'lowbush',caorthann:'sapling',
  fearnog:'bracket',shadowcap:'mushrooms'
};
const PLANT_STAYS=new Set(['bush','lowbush','sapling','shrub','bramble','bracket']);
// the kinds tall enough to throw a shadow worth drawing (half a unit and more)
const PLANT_SHADOW=new Set(['bush','tussock','flowerspike','goldenrod','sapling']);
const PLANT_GEO=new Map();
// a seeded dice so a kind always bakes the same (and its picked copy matches it part for part)
function plantRng(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return((h>>>0)%100000)/100000;};}
// parts as [geometry, matrix, colour]; while `take` is set (what a picker takes) a picked plant leaves the part out.
// The dice is rolled either way, so everything after it comes out the same in both copies.
function Plant(picked){this.parts=[];this.picked=!!picked;this.take=false;}
{const _q=new THREE.Quaternion(),_e=new THREE.Euler(0,0,0,'YXZ');
  Plant.prototype.add=function(geo,p,r,s,col){if(this.take&&this.picked){geo.dispose();return this;}_e.set(r?r[0]:0,r?r[1]:0,r?r[2]:0,'YXZ');_q.setFromEuler(_e);
    const m=new THREE.Matrix4().compose(new THREE.Vector3(p[0],p[1],p[2]),_q,new THREE.Vector3(s?s[0]:1,s?s[1]:1,s?s[2]:1));
    this.parts.push([geo,m,new THREE.Color(col)]);return this;};}
// a leaf: base at the point, reaching out along its yaw at an elevation, drooping at the tip (8 triangles, both sides lit)
function plantLeaf(len,wid,thick,droop){const f=-wid*.18,v=[[0,0,0],[-wid*.4,f,len*.3],[0,0,len*.3],[wid*.4,f,len*.3],[-wid*.34,f,len*.66],[0,0,len*.66],[wid*.34,f,len*.66],[0,0,len]];
  const ix=[0,1,2,0,2,3,2,1,4,2,4,5,2,5,6,2,6,3,5,4,7,5,7,6],pos=[];for(const i of ix){const p=v[i];pos.push(p[0],p[1]-(droop||0)*(p[2]/len)*(p[2]/len),p[2]);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));return g;}
function plantStalk(h,r0,r1,seg){const g=SK.cyl(r1,r0,h,seg||5,3);g.translate(0,h/2,0);return g;}
function plantBlade(h,w,bend){const g=SK.cone(w,h,3,4);g.translate(0,h/2,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i)/h;p.setZ(i,p.getZ(i)+bend*y*y);}return g;}
Plant.prototype.bake=function(){
  let n=0;const flat=this.parts.map(([g,m,c])=>{const gg=(g.index?g.toNonIndexed():g.clone());g.dispose();gg.applyMatrix4(m);n+=gg.attributes.position.count;return [gg,c];});
  let top=.001;flat.forEach(([g])=>{const p=g.attributes.position;for(let i=0;i<p.count;i++)top=Math.max(top,p.getY(i));});
  if(this.top)top=this.top; // a picked copy shades by its whole plant's height, so the two match
  const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);let o=0;
  flat.forEach(([g,c])=>{g.computeVertexNormals();const p=g.attributes.position,nn=g.attributes.normal;
    for(let i=0;i<p.count;i++,o++){pos[o*3]=p.getX(i);pos[o*3+1]=p.getY(i);pos[o*3+2]=p.getZ(i);const ny=nn.getY(i);nor[o*3]=nn.getX(i);nor[o*3+1]=ny;nor[o*3+2]=nn.getZ(i);
      const k=(.62+.38*Math.min(1,p.getY(i)/top*1.4))*(.84+.16*ny);col[o*3]=c.r*k;col[o*3+1]=c.g*k;col[o*3+2]=c.b*k;}g.dispose();});
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setAttribute('color',new THREE.BufferAttribute(col,3));
  out.computeBoundingBox();out.computeBoundingSphere();out.userData.top=top;return out;};
const plantShade=(c,k)=>{const x=new THREE.Color(c);x.multiplyScalar(k);return x;};
const plantMix=(a,b,t)=>new THREE.Color(a).lerp(new THREE.Color(b),t);
const PLANT_BUILD={
  // a low cushion patch, wide rather than tall: moss on stone or the forest floor
  moss(P,R,col,stem,key){const n=5+Math.floor(R()*3);for(let i=0;i<n;i++){const a=i/n*6.283+R(),r=i?.12+R()*.16:0,s=.11+R()*.08;
      P.add(SK.bumpy(SK.ball(1,10,6,0,6.283,0,1.7),.18,9,R()*9),[Math.sin(a)*r,-.01,Math.cos(a)*r],[0,R()*6,0],[s,s*.42,s],plantMix(col,stem,R()*.35));}
    if(key==='firemoss')for(let i=0;i<14;i++){const a=R()*6.283,r=R()*.3;P.add(SK.ball(.012,4,3),[Math.sin(a)*r,.045,Math.cos(a)*r],0,0,0xffaa44);}},
  // a lumpy wet red mound on the bank
  clay(P,R,col,stem){for(let i=0;i<4;i++){const a=i*1.7+R(),r=i?.08+R()*.06:0,s=.07+R()*.05;P.add(SK.bumpy(SK.ball(1,8,5),.2,6,R()*5),[Math.sin(a)*r,s*.25,Math.cos(a)*r],0,[s*1.3,s*.8,s*1.1],plantMix(col,stem,R()*.4));}
    for(let i=0;i<5;i++){const a=R()*6.283;P.add(plantBlade(.1+R()*.06,.008,.03),[Math.sin(a)*.14,.02,Math.cos(a)*.14],[.2,a,0],0,0x4a5a2a);}},
  // a flat ring of leaves pressed to the ground (road edges)
  rosette(P,R,col){for(let ring=0;ring<2;ring++){const n=ring?6:9;for(let i=0;i<n;i++){const a=i/n*6.283+ring*.35;P.add(plantLeaf(ring?.09:.16,ring?.05:.07,.012,.01),[0,.01+ring*.012,0],[-(.08+ring*.25),a,0],0,plantShade(col,ring?1.08:.95));}}},
  // a cliff plant: a tight rosette and short stems of small flower heads
  cliffflower(P,R,col,stem){for(let i=0;i<8;i++){const a=i/8*6.283;P.add(plantLeaf(.08,.035,.01,.01),[0,.01,0],[-.3,a,0],0,0x5a7a3a);}
    for(let i=0;i<5;i++){const a=R()*6.283,t=.08+R()*.12;const x=Math.sin(a)*.03,z=Math.cos(a)*.03,tip=[x+Math.sin(a)*.05,t,z+Math.cos(a)*.05];P.add(plantStalk(t,.005,.004,4),[x,0,z],[.3*(R()-.5)+.25,a,0],0,stem);
      for(let k=0;k<5;k++)P.add(SK.ball(.013,5,4),[tip[0]+(R()-.5)*.03,tip[1]+R()*.02,tip[2]+(R()-.5)*.03],0,0,col);}},
  // an ordinary leafy herb, knee-low: pale broad leaves on short stems
  herb(P,R,col,stem){const n=9+Math.floor(R()*4);for(let i=0;i<n;i++){const a=i*2.4+R()*.4,t=.05+R()*.18;P.add(plantStalk(t,.007,.005,4),[0,0,0],[.35,a,0],0,stem);
      P.add(plantLeaf(.12+R()*.05,.07,.012,.03),[Math.sin(a)*t*.34,t,Math.cos(a)*t*.34],[-.25+R()*.3,a,0],0,plantShade(col,.9+R()*.2));}},
  // waterside: round glossy leaves, some standing, some floating
  waterleaf(P,R,col,stem){for(let i=0;i<14;i++){const a=R()*6.283,r=R()*.18,t=.03+R()*.22;P.add(plantStalk(t,.006,.005,4),[Math.sin(a)*r,0,Math.cos(a)*r],[.15,a,0],0,stem);
      P.add(plantLeaf(.09,.08,.012,.01),[Math.sin(a)*r,t,Math.cos(a)*r],[-.1,a+R(),0],0,plantShade(col,.85+R()*.3));}},
  // big deep-blue leaves from the base, arching like a hosta
  broadleaf(P,R,col,stem){for(let i=0;i<8;i++){const a=i/8*6.283+R()*.3;P.add(plantLeaf(.26+R()*.06,.14,.016,.12),[0,.02,0],[-(.55+R()*.35),a,0],0,plantShade(col,.85+R()*.3));}
    P.add(plantStalk(.36,.008,.006,4),[0,0,0],0,0,stem);for(let k=0;k<6;k++)P.add(SK.ball(.018,5,4),[(R()-.5)*.02,.26+k*.018,(R()-.5)*.02],0,0,0x6a88ee);},
  // near-invisible: a few hair-thin pale stems with faint drooping bells
  wisp(P,R,col,stem){for(let i=0;i<6;i++){const a=R()*6.283,t=.16+R()*.12;R();P.add(plantBlade(t,.005,.04),[0,0,0],[0,a,0],0,stem);
      P.add(SK.cone(.02,.035,6,1,true),[Math.sin(a)*.04,t-.02,Math.cos(a)*.04],[Math.PI,a,0],0,col);}
    for(let i=0;i<6;i++){const a=i/6*6.283;P.add(plantLeaf(.07,.025,.008,.02),[0,.01,0],[-.35,a,0],0,plantShade(col,.8));}},
  // leaves up top, the amber root crown showing at the ground: the thing you dig for
  root(P,R,col,stem){P.add(SK.lathe([[.001,-.02],[.07,0],[.085,.05],[.06,.09],[.001,.1]],9),[0,0,0],0,0,col);
    for(let i=0;i<3;i++){const a=i*2.1+R();P.add(SK.limb(.14,.03,.012),[Math.sin(a)*.06,.02,Math.cos(a)*.06],[1.25,a,0],0,plantShade(col,.8));}
    for(let i=0;i<7;i++){const a=i/7*6.283,t=.12+R()*.12;P.add(plantStalk(t,.008,.006,4),[0,.08,0],[.3,a,0],0,stem);P.add(plantLeaf(.13,.06,.012,.04),[Math.sin(a)*t*.3,.08+t,Math.cos(a)*t*.3],[-.2,a,0],0,0x4a8a28);}},
  // moor grass: a dense tussock of fine blades, knee-high, the tops bending out
  tussock(P,R,col,stem){P.add(SK.bumpy(SK.ball(1,8,5,0,6.283,0,1.7),.15,7,R()*4),[0,-.02,0],0,[.14,.1,.14],stem);
    for(let i=0;i<40;i++){const a=R()*6.283,r=R()*.1;P.add(plantBlade(.3+R()*.22,.011,.07+R()*.1),[Math.sin(a)*r,.02,Math.cos(a)*r],[0,a,0],0,plantMix(col,0x6a6a3a,R()*.45));}},
  // tall: waist-high stalks, each ending in an arching yellow plume
  goldenrod(P,R,col,stem){for(let i=0;i<6;i++){const a=R()*6.283,r=R()*.1,t=.55+R()*.25,lean=(R()-.5)*.18;const bx=Math.sin(a)*r,bz=Math.cos(a)*r;
      P.add(plantStalk(t,.011,.007,5),[bx,0,bz],[lean,a,0],0,stem);
      for(let k=0;k<6;k++){const y=.08+k*t*.1;const la=R()*6.283;P.add(plantLeaf(.09,.022,.008,.02),[bx+Math.sin(lean)*y*Math.sin(a),y,bz+Math.sin(lean)*y*Math.cos(a)],[-.3,la,0],0,0x5a7a2a);}
      const tx=bx+Math.sin(lean)*t*Math.sin(a),tz=bz+Math.sin(lean)*t*Math.cos(a);
      for(let k=0;k<5;k++){const pa=a+(k-2)*.5;P.add(SK.bumpy(SK.ball(1,6,4),.2,11,k),[tx+Math.sin(pa)*.04,t-.12+k*.03,tz+Math.cos(pa)*.04],[-.9,pa,0],[.028,.028,.1],plantShade(col,.9+R()*.2));}}},
  // a white flower spike: a leafy base and tall hooded blooms up the stem
  flowerspike(P,R,col,stem){for(let i=0;i<7;i++){const a=i/7*6.283;P.add(plantLeaf(.13,.07,.012,.04),[0,.03,0],[-.35,a,0],0,0x3a5a28);}
    for(let s=0;s<3;s++){const a=s*2.1+R(),t=.42+R()*.18,bx=Math.sin(a)*.04,bz=Math.cos(a)*.04;P.add(plantStalk(t,.009,.006,5),[bx,0,bz],[.06,a,0],0,stem);
      for(let k=0;k<9;k++){const y=t*.5+k*t*.055,fa=k*2.3;P.add(SK.ball(.022,5,3),[bx+Math.sin(fa)*.022,y,bz+Math.cos(fa)*.022],[0,fa,0],[1,1.25,.9],plantShade(col,.92+R()*.1));}}},
  // a thistle: spiny rust-red leaves up a stout stem and a bristling head
  thistle(P,R,col,stem){for(let s=0;s<2;s++){const a=s*3+R(),t=.3+R()*.14,bx=Math.sin(a)*.05,bz=Math.cos(a)*.05;P.add(plantStalk(t,.014,.009,5),[bx,0,bz],0,0,stem);
      for(let k=0;k<5;k++){const la=k*2.4+s,y=.04+k*t*.15;P.add(plantLeaf(.16-k*.018,.075,.01,.03),[bx,y,bz],[-.35,la,0],0,plantShade(col,.7));for(let q=0;q<3;q++)P.add(SK.cone(.006,.04,3),[bx+Math.sin(la)*(.04+q*.035),y+.012,bz+Math.cos(la)*(.04+q*.035)],[0,la,1.2],0,plantShade(col,.6));}
      P.add(SK.ball(.04,8,6),[bx,t,bz],0,0,plantShade(col,.55));P.add(SK.bumpy(SK.lathe([[.02,0],[.045,.02],[.035,.06],[.001,.07]],8),.008,20,s),[bx,t+.01,bz],0,0,col);}},
  // a fern: arching fronds from a crown, leaflets shrinking to the tip
  fern(P,R,col,stem){const n=7;for(let f=0;f<n;f++){const a=f/n*6.283+R()*.3,L=.5+R()*.12,el=1.25+R()*.2;
      let x=0,y=.02,z=0,ang=el;const seg=9,dl=L/seg;
      for(let k=0;k<seg;k++){const nx=x+Math.sin(a)*Math.cos(ang)*dl,ny=y+Math.sin(ang)*dl,nz=z+Math.cos(a)*Math.cos(ang)*dl;
        const w=.09*(1-k/seg)+.015;for(const sd of[-1,1])P.add(plantLeaf(w,.03,.006,.01),[nx,ny,nz],[-(ang*.4)+.05,a+sd*1.35,0],0,plantShade(col,.9+k*.02));
        x=nx;y=ny;z=nz;ang-=.19;}
      P.add(SK.cyl(.004,.006,.05,4),[0,.02,0],0,0,stem);}},
  // bramble: long canes arching over and back to the ground, a leaf here and there (picked, the canes stay bare)
  bramble(P,R,col,stem){for(let i=0;i<6;i++){const a=R()*6.283,r=i?.08+R()*.1:0,sz=.1+R()*.05;P.take=i>1;P.add(SK.bumpy(SK.ball(1,7,5),.22,8,R()*6),[Math.sin(a)*r,.08,Math.cos(a)*r],0,[sz,sz*.7,sz],plantMix(0x3a4a22,col,.3+R()*.3));}
    for(let c=0;c<9;c++){const a=R()*6.283,L=.5+R()*.3,seg=10;let x=0,y=0,z=0;
      for(let k=0;k<seg;k++){const t=(k+1)/seg,ny=Math.sin(t*Math.PI)*(.26+R()*.04),nx=Math.sin(a)*L*t,nz=Math.cos(a)*L*t;
        const dx=nx-x,dy=ny-y,dz=nz-z,d=Math.hypot(dx,dy,dz);const g=SK.cyl(.007,.008,d,4,1,true);g.translate(0,d/2,0);
        P.take=false;P.add(g,[x,y,z],[Math.atan2(Math.hypot(dx,dz),dy),Math.atan2(dx,dz),0],0,stem);
        if(k<seg-2)for(const sd of[1,-1]){P.take=true;P.add(plantLeaf(.08,.06,.008,.02),[nx,ny,nz],[-.1,a+sd*(1+R()*.5),0],0,plantMix(0x4a5a22,col,.35+R()*.3));}x=nx;y=ny;z=nz;}}P.take=false;},
  // a grey-green moor shrub: a low mound of small twiggy clumps (picked, three are left on the twigs)
  shrub(P,R,col,stem){for(let i=0;i<4;i++){const a=R()*6.283;P.add(plantStalk(.2,.012,.008,4),[0,0,0],[.5,a,0],0,stem);}
    for(let i=0;i<9;i++){const a=R()*6.283,r=i?.08+R()*.14:0,s=.1+R()*.06;P.take=i>=3;P.add(SK.bumpy(SK.ball(1,8,6),.22,8,R()*6),[Math.sin(a)*r,.2+R()*.12-r*.4,Math.cos(a)*r],0,[s,s*.8,s],plantMix(col,0x9aa888,R()*.4));}P.take=false;},
  // a berry bush, knee-high and wider than tall, red clusters hanging on the outside (picked, the clusters go)
  bush(P,R,col,stem,key){const leaf=key==='thornberry'?0x3a5a22:0x2a4a1a;
    for(let i=0;i<5;i++){const a=R()*6.283;P.add(plantStalk(.25,.014,.01,4),[0,0,0],[.55,a,0],0,stem);}
    const blobs=[];for(let i=0;i<11;i++){const a=R()*6.283,r=i?.14+R()*.18:0,s=.13+R()*.07,y=.3+R()*.12-r*.45;blobs.push([a,r,s,y]);P.add(SK.bumpy(SK.ball(1,8,5),.2,8,R()*6),[Math.sin(a)*r,y,Math.cos(a)*r],0,[s,s*.85,s],plantMix(leaf,0x6a8a3a,R()*.3));}
    P.take=true;for(let c=0;c<9;c++){const [a,r,s,y]=blobs[1+Math.floor(R()*10)];const oa=a+(R()-.5)*.6,rr=r+s*.9;
      for(let k=0;k<5;k++)P.add(SK.ball(.024,5,3),[Math.sin(oa)*rr+(R()-.5)*.04,y-.02-R()*.05,Math.cos(oa)*rr+(R()-.5)*.04],0,0,plantShade(col,.9+R()*.2));}P.take=false;},
  lowbush(P,R,col,stem,key){const leaf=0x2a3a20;for(let i=0;i<7;i++){const a=R()*6.283,r=i?.08+R()*.12:0,s=.1+R()*.05;P.add(SK.bumpy(SK.ball(1,8,6),.2,8,R()*6),[Math.sin(a)*r,.2+R()*.08-r*.4,Math.cos(a)*r],0,[s,s*.8,s],plantMix(leaf,0x4a5a30,R()*.3));}
    P.take=true;for(let c=0;c<7;c++){const a=R()*6.283,r=.16+R()*.08,y=.12+R()*.16;for(let k=0;k<4;k++)P.add(SK.ball(.022,5,3),[Math.sin(a)*r+(R()-.5)*.04,y+(R()-.5)*.04,Math.cos(a)*r+(R()-.5)*.04],0,0,0x1a0a20);}P.take=false;},
  // a young rowan: a slim grey trunk, feathered leaves and heavy red clusters, head-high to a child (picked, the clusters go)
  sapling(P,R,col,stem){P.add(plantStalk(.75,.028,.014,6),[0,0,0],[0,0,.04],0,0x6a6258);
    for(let b=0;b<4;b++){const a=b*1.6+R(),y=.4+b*.1;P.add(plantStalk(.24,.012,.006,4),[0,y,0],[.9,a,0],0,0x6a6258);
      const tx=Math.sin(a)*.2,tz=Math.cos(a)*.2,ty=y+.12;
      for(let l=0;l<5;l++){const la=a+(l-2)*.55;P.add(plantLeaf(.16,.05,.01,.04),[tx,ty,tz],[-.1,la,0],0,plantShade(0x3a6a2a,.9+R()*.2));}
      P.take=true;for(let k=0;k<10;k++)P.add(SK.ball(.022,5,3),[tx+(R()-.5)*.08,ty-.05-R()*.06,tz+(R()-.5)*.08],0,0,plantShade(col,.9+R()*.2));P.take=false;}
    for(let l=0;l<5;l++){const la=l*1.26;P.add(plantLeaf(.16,.05,.01,.04),[0,.76,0],[-.3,la,0],0,0x3a6a2a);}},
  // shelves of bracket fungus on an old stump (picked, the stump is left)
  bracket(P,R,col,stem){P.add(SK.bumpy(SK.cyl(.13,.16,.28,10,3),.012,14,2),[0,.14,0],0,0,0x4a3a2a);P.add(SK.cyl(.12,.12,.01,10),[0,.285,0],0,0,0x8a7458);
    P.take=true;for(let i=0;i<7;i++){const a=R()*6.283,y=.05+R()*.2,w=.07+R()*.04;P.add(SK.lathe([[.001,.012],[w,.004],[w*.95,-.008],[.001,-.012]],10),[Math.sin(a)*.14,y,Math.cos(a)*.14],[0,0,0],[1,1,.7],plantShade(col,.85+R()*.3));}P.take=false;},
  // a cluster of mushrooms: stalks and domed caps, one tall, several small
  mushrooms(P,R,col,stem){for(let i=0;i<6;i++){const a=R()*6.283,r=i?.06+R()*.1:0,s=i?.5+R()*.4:1.1,h=.12*s,cr=.06*s;
      P.add(SK.lathe([[.012*s,0],[.014*s,h*.5],[.011*s,h]],6),[Math.sin(a)*r,0,Math.cos(a)*r],[0,0,(R()-.5)*.3],0,0xcfc4d0);
      P.add(SK.lathe([[.001,-.004],[cr*.9,0],[cr,.012*s],[cr*.7,.04*s],[.001,.05*s]],9),[Math.sin(a)*r,h,Math.cos(a)*r],0,0,plantShade(col,.9+R()*.3));}}
};
// the baked geometry of a herb (by its HERB_DEF key), whole or picked; null for anything without a kind (the sea's herbs)
function plantGeo(key,picked){const kind=PLANT_KIND[key],def=typeof HERB_DEF!=='undefined'&&HERB_DEF[key];if(!kind||!def)return null;
  if(picked&&!PLANT_STAYS.has(kind)){const k2=key+'|stub';let g2=PLANT_GEO.get(k2);if(!g2){g2=plantStubGeo(key,plantGeo(key,false));PLANT_GEO.set(k2,g2);}return g2;}
  const k=key+(picked?'|picked':'');let g=PLANT_GEO.get(k);if(g)return g;
  const P=new Plant(picked);if(picked){const whole=plantGeo(key,false);P.top=whole.userData.top;}
  PLANT_BUILD[kind](P,plantRng(key),def.col,def.stemCol,key);g=P.bake();PLANT_GEO.set(k,g);return g;}
// S263 — what a picked herb leaves (Michael's A on Session 237): the plant cut near the ground, every triangle wholly under a
// cut of 22% of its height (held to 3.5–9 cm) kept, so stalk bases, the crown and the lowest leaves stay, darkened; a flat
// kind (under 13 cm: the mosses, the rosette) torn instead, two opposite sectors kept; on a flat patch of turned earth a
// quarter to a third of its spread. It is the picked copy the bushes already have, so it stands and regrows the same way.
function plantStubGeo(key,whole){const src=whole.index?whole.toNonIndexed():whole;const top=whole.userData.top||.3,cut=Math.max(.035,Math.min(.09,top*.22)),flat=top<.13;
  const p=src.attributes.position,n=src.attributes.normal,c=src.attributes.color,P=[],N=[],C=[];let h=7;for(const ch of key)h=h*31+ch.charCodeAt(0);
  for(let t=0;t+2<p.count;t+=3){let keep;if(flat){const cx=(p.getX(t)+p.getX(t+1)+p.getX(t+2))/3,cz=(p.getZ(t)+p.getZ(t+1)+p.getZ(t+2))/3;keep=Math.sin(Math.atan2(cx,cz)*2+h)>.15;}
    else keep=Math.max(p.getY(t),p.getY(t+1),p.getY(t+2))<cut;
    if(!keep)continue;for(let v=t;v<t+3;v++){P.push(p.getX(v),p.getY(v),p.getZ(v));N.push(n.getX(v),n.getY(v),n.getZ(v));C.push(c.getX(v)*.8,c.getY(v)*.75,c.getZ(v)*.7);}}
  if(src!==whole)src.dispose();
  whole.computeBoundingBox();const bb=whole.boundingBox,r=Math.max(.08,Math.min(.18,Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)*.3));
  const e0=SK.bumpy(SK.ball(1,12,6,0,6.283,0,1.6),.25,7,h&7);e0.scale(r,.018,r);e0.translate(0,-.006,0);const e=e0.index?e0.toNonIndexed():e0;e.computeVertexNormals();
  const ep=e.attributes.position,en=e.attributes.normal;for(let i=0;i<ep.count;i++){const k=.8+.2*Math.sin(i*7.1+h);P.push(ep.getX(i),ep.getY(i),ep.getZ(i));N.push(en.getX(i),en.getY(i),en.getZ(i));C.push(.29*k,.22*k,.15*k);}
  e0.dispose();if(e!==e0)e.dispose();
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  g.computeBoundingSphere();g.userData.top=flat?top:cut;g.userData.stub=true;return g;}
function plantKeyOf(def){if(typeof HERB_DEF==='undefined'||!def)return null;for(const k in HERB_DEF)if(HERB_DEF[k]===def||HERB_DEF[k].name===def.name)return k;return null;}
const PLANT_MAT=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});

// mkHerbMesh — global, builds herb 3D mesh into any scene
function mkHerbMesh(hx,hz,def,sc){
  const g=new THREE.Group();
  {const key=plantKeyOf(def),geo=key&&plantGeo(key,false);if(geo){ // v80 S167 — the herb as the plant it is
    const m=new THREE.Mesh(geo,PLANT_MAT);m.castShadow=PLANT_SHADOW.has(PLANT_KIND[key]);m.receiveShadow=true;g.add(m);
    // S217 — a plant that stays when picked (a bush, a sapling, the stump's fungus) carries its picked copy, hidden until then
    const pg=plantGeo(key,true);if(pg){const pm=new THREE.Mesh(pg,PLANT_MAT);pm.castShadow=m.castShadow;pm.receiveShadow=true;pm.visible=false;g.add(pm);g.userData.whole=m;g.userData.picked=pm;}
    const gl=new THREE.PointLight(def.glowCol,def.glowInt||.5,def.glowRad||1.6);gl.position.set(0,.28,0);g.add(gl);
    g.position.set(hx,activeTerrainH(hx,hz),hz);sc.add(g);return{g,gl};}}
  const stemMat=new THREE.MeshLambertMaterial({color:def.stemCol});
  const leafMat=new THREE.MeshLambertMaterial({color:def.col});
  const shape=def.shape||'clump';
  const numSprigs=shape==='single'?1:2+Math.floor(Math.random()*3);
  for(let s=0;s<numSprigs;s++){
    const ox=(Math.random()-.5)*.28,oz=(Math.random()-.5)*.28;
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.012,.018,.16+Math.random()*.06,5),stemMat);
    stem.position.set(ox,.08,oz);stem.rotation.z=(Math.random()-.5)*.5;g.add(stem);
    if(shape==='root'){
      const root=new THREE.Mesh(new THREE.SphereGeometry(.1,7,6),leafMat);
      root.position.set(ox,.22,oz);root.scale.set(1,.7,1);g.add(root);
      for(let l=0;l<3;l++){const ang=l*(Math.PI*2/3);const frond=new THREE.Mesh(new THREE.SphereGeometry(.055,5,4),new THREE.MeshLambertMaterial({color:0x4a8a28}));frond.scale.set(.5,1.4,.5);frond.position.set(ox+Math.sin(ang)*.1,.28,oz+Math.cos(ang)*.1);g.add(frond);}
    } else if(shape==='leaf'){
      for(let l=0;l<2;l++){const ang=Math.random()*Math.PI;const leaf=new THREE.Mesh(new THREE.SphereGeometry(.085,6,4),leafMat);leaf.scale.set(.6,.12,1);leaf.position.set(ox+Math.sin(ang)*.08,.18+l*.04,oz+Math.cos(ang)*.08);leaf.rotation.z=ang;g.add(leaf);}
    } else if(shape==='spike'){
      const spike=new THREE.Mesh(new THREE.ConeGeometry(.04,.22,5),leafMat);spike.position.set(ox,.2,oz);g.add(spike);
    } else if(shape==='berry'){
      for(let b=0;b<3;b++){const bx2=(Math.random()-.5)*.12,bz2=(Math.random()-.5)*.12;const berry=new THREE.Mesh(new THREE.SphereGeometry(.04,5,4),leafMat);berry.position.set(ox+bx2,.18+Math.random()*.06,oz+bz2);g.add(berry);}
    } else if(shape==='fungus'){
      const cap=new THREE.Mesh(new THREE.SphereGeometry(.1,6,5),leafMat);cap.scale.set(1,.45,1);cap.position.set(ox,.2,oz);g.add(cap);
      const stalk=new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,.14,6),stemMat);stalk.position.set(ox,.1,oz);g.add(stalk);
    } else if(shape==='fern'){
      for(let f=0;f<3;f++){const ang=f*(Math.PI*2/3)+Math.random()*.3;const frond=new THREE.Mesh(new THREE.SphereGeometry(.075,5,4),leafMat);frond.scale.set(.3,1.4,.8);frond.position.set(ox+Math.sin(ang)*.1,.2,oz+Math.cos(ang)*.1);frond.rotation.y=ang;g.add(frond);}
    } else {
      const clump=new THREE.Mesh(new THREE.SphereGeometry(.075+Math.random()*.025,5,4),leafMat);
      clump.scale.set(1,.5,1);clump.position.set(ox,.12,oz);g.add(clump);
    }
  }
  const gl=new THREE.PointLight(def.glowCol,def.glowInt||.5,def.glowRad||1.6);gl.position.set(0,.28,0);g.add(gl);
  const ty=activeTerrainH(hx,hz);
  g.position.set(hx,ty,hz);
  sc.add(g);
  return{g,gl};
}
