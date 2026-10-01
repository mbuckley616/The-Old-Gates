
// ── SPELL SYSTEM ─────────────────────────────────────────────
// Each spell has three tiers: Impression (1), Comprehension (2), Mastery (3).
// Tier is stored per-spell in `knownSpells[id] = 1|2|3`. Higher Intelligence unlocks higher tiers at sigil touch.
// Tier 1: Irish name only, 60% magnitude, wild effects can fire (see WILD_EFFECTS).
// Tier 2: Irish — English, 100% magnitude, reliable.
// Tier 3: Irish — True name, 130% magnitude, 70% cost, 80% cooldown.
const SPELLS=[
  {id:'caor',        school:'tine',  role:'basic',
   nameIr:'Caor',        nameEn:'Fireball',      nameMa:'Living Ember',
   ico:'🔥', desc:'Launches a ball of fire.',
   intReqs:[3,15,35], cost:30, speed:9,  dmgBase:20, dmgLvl:3,
   col:0xff5500, glowCol:0xff6600,
   wild:['scatter','fizzle','backlash']},
  {id:'sioc',        school:'uisce', role:'basic',
   nameIr:'Sioc',        nameEn:'Frost Bolt',    nameMa:"Still-Winter's Touch",
   ico:'❄️', desc:'A shard of frost that slows its target.',
   intReqs:[3,15,35], cost:20, speed:11, dmgBase:12, dmgLvl:2,
   col:0x88ccff, glowCol:0x44aaff,
   wild:['scatter','fizzle']},
  {id:'sideen',      school:'gaoth', role:'basic',
   nameIr:'Séideán',     nameEn:'Wind Shear',    nameMa:'Breath-Between-Words',
   ico:'🌬️', desc:'A blade of compressed air.',
   intReqs:[3,15,35], cost:22, speed:14, dmgBase:14, dmgLvl:2,
   col:0xddeeff, glowCol:0xaaccee,
   wild:['scatter','fizzle']},
  {id:'cloch_ghear', school:'cloch', role:'basic',
   nameIr:'Cloch Ghéar', nameEn:'Stone Spike',   nameMa:"Earth's-Teeth",
   ico:'🪨', desc:'A jagged spike torn from the earth.',
   intReqs:[3,15,35], cost:28, speed:8,  dmgBase:22, dmgLvl:3,
   col:0x886644, glowCol:0xaa8855,
   wild:['scatter','fizzle']},
  {id:'smol',        school:'scath', role:'basic',
   nameIr:'Smól',        nameEn:'Shade Bolt',    nameMa:'The Quiet-Sent-Out',
   ico:'🌑', desc:'A silent dart of shadow.',
   intReqs:[3,15,35], cost:26, speed:10, dmgBase:16, dmgLvl:3,
   col:0x553377, glowCol:0x773399,
   wild:['scatter','fizzle','backlash']},
  {id:'solas_gheal', school:'solas', role:'basic',
   nameIr:'Solas-Gheal', nameEn:'Radiant Bolt',  nameMa:"Morning's-First-Word",
   ico:'✨', desc:'A bolt of pure light.',
   intReqs:[3,15,35], cost:28, speed:12, dmgBase:18, dmgLvl:3,
   col:0xffffaa, glowCol:0xffddaa,
   wild:['scatter','fizzle']},
  {id:'leigheas',    school:'solas', role:'heal',
   nameIr:'Leigheas',    nameEn:'Healing Light', nameMa:'Hand-of-the-Stream',
   ico:'💚', desc:'Channels light, restoring health.',
   intReqs:[8,25,50], cost:40, speed:0,  dmgBase:0,  dmgLvl:0,
   col:0xffffff, glowCol:0xaaffaa,
   wild:['fizzle','reversal'],
   healBase:35, healLvl:2},
];

// Tier multipliers: [Impression, Comprehension, Mastery]
const TIER_MULT={
  magnitude: [0.60, 1.00, 1.30], // dmg / heal
  cost:      [1.00, 1.00, 0.70], // mana
  cooldown:  [1.00, 1.00, 0.80],
};
const TIER_LABEL=['Impression','Comprehension','Mastery'];
const TIER_STARS=['★☆☆','★★☆','★★★'];
const IMPRESSION_WILD_CHANCE=0.40;

// School display metadata
const SCHOOL_DEF={
  tine:  {name:'Tine',  en:'Fire',   col:'#ff7733'},
  uisce: {name:'Uisce', en:'Water',  col:'#66bbee'},
  gaoth: {name:'Gaoth', en:'Wind',   col:'#ccddee'},
  cloch: {name:'Cloch', en:'Stone',  col:'#aa8855'},
  scath: {name:'Scáth', en:'Shadow', col:'#9966cc'},
  solas: {name:'Solas', en:'Light',  col:'#ffdd88'},
};

// Display the spell's name at the appropriate tier.
function spellDisplayName(sp, tier){
  if(!sp)return 'None';
  if(tier>=3)return `${sp.nameIr} — ${sp.nameMa}`;
  if(tier>=2)return `${sp.nameIr} — ${sp.nameEn}`;
  return sp.nameIr;
}
// Fetch the current tier (1–3) for a spell id, or 0 if not known.
function getSpellTier(id){return knownSpells[id]||0;}
// Tier-scaled numeric stats for a cast.
function spellMag(sp,tier){return (sp.dmgBase||0)*TIER_MULT.magnitude[tier-1];}
function spellHealMag(sp,tier){return (sp.healBase||0)*TIER_MULT.magnitude[tier-1];}
function spellCost(sp,tier){return Math.round(sp.cost*TIER_MULT.cost[tier-1]);}
function spellCooldown(sp,tier){return (1.0+sp.cost*.012)*TIER_MULT.cooldown[tier-1];}
function spellAtTier(id){const sp=SPELLS.find(s=>s.id===id);const t=getSpellTier(id);return sp&&t?{sp,tier:t}:null;}

// knownSpells: {spellId: tier} — empty on new game. Touch a sigil to learn at your INT-qualified tier.
let knownSpells={};
// touchedSigils: set of sigil UUIDs the player has already visited (for re-touch upgrade flow)
let touchedSigils=new Set();

// ── SIGIL SYSTEM ─────────────────────────────────────────────
// One sigil per spell exists in the world, carved into dungeon floor-2 walls.
// Re-touching a sigil after leveling INT upgrades to the highest tier the player now qualifies for.
// Phase 1: 7 sigils placed across Ashenmoor and Ironhaven dungeons.
// Phase 2: remaining 31 sigils across future zones.
const SIGIL_PLACEMENTS={
  42:  'caor',        // Dungeon of Shadows (scripted Q2 objective)
  315: 'sideen',      // Haunted Ashenmoor dungeon — wind resonance
  428: 'cloch_ghear', // Ruins Ashenmoor — stone in stone
  891: 'sioc',        // Deep Ashenmoor — cold depths
  137: 'leigheas',    // Crypt of Embers (Q3/Q4) — healing before Ironhaven
  801: 'solas_gheal', // Undead Ironhaven — light vs undead
  889: 'smol',        // Haunted Ironhaven — shadow's home
};

// v61n: auto-generate a three-step Sigil Lore questline for each placed sigil.
// Q1 "A Stone Calls" activates on first touch (the player found it). Q2 "Deeper
// Still" unlocks when the player attains Impression. Q3 "Whole Understanding"
// unlocks at Comprehension, completes at Mastery. All three autoAccept (no NPC
// giver) and autoComplete (no turn-in — touching the sigil IS the completion).
// Flavor text is placeholder — these are intended to be overwritten with per-sigil
// writing in a future content pass. Runs once at load, after SPELLS/WORLD_DUNGEONS
// are defined but before any save hydration, so the generated QS entries are present
// when loadGame's Object.assign merges in saved state (saved QS keeps any existing
// per-quest state; new ids default to 'locked').
(function generateSigilQuests(){
  const TIER_DATA=[
    {n:1, label:'Impression',    titleWord:'A Stone Calls',      xp:30},
    {n:2, label:'Comprehension', titleWord:'Deeper Still',       xp:75},
    {n:3, label:'Mastery',       titleWord:'Whole Understanding',xp:150},
  ];
  Object.entries(SIGIL_PLACEMENTS).forEach(([seedStr, spellId])=>{
    const seed=parseInt(seedStr,10);
    const sp=SPELLS.find(s=>s.id===spellId);
    if(!sp)return;
    const dungeon=(typeof WORLD_DUNGEONS!=='undefined')?WORLD_DUNGEONS.find(d=>d.seed===seed):null;
    const dungeonName=(dungeon&&dungeon.canonicalName)||'the dungeon';
    TIER_DATA.forEach((td,i)=>{
      const id=`sigil_${spellId}_${td.n}`;
      const nextId=i<TIER_DATA.length-1?`sigil_${spellId}_${td.n+1}`:null;
      // Placeholder descriptions — swap for bespoke writing later.
      const description = td.n===1
        ? `A sigil of ${sp.nameIr} waits in ${dungeonName}. Return to it with a clear mind.`
        : `Return to the sigil of ${sp.nameIr}. Your understanding has room to deepen.`;
      QUEST_DEFS.push({
        id,
        title: `${td.titleWord}: ${sp.nameIr}`,
        giver: '—', giverZone: null,
        questline: 'sigil_lore',
        sigilSpellId: spellId,
        sigilDungeonSeed: seed,
        description,
        acceptResponses: [],
        objectives: [{
          type:'touch_sigil', spellId, dungeonSeed:seed,
          minTier: td.n,
          label: `Attain ${td.label} of ${sp.nameIr}`,
        }],
        rewards: {gold:0, xp:td.xp, items:[]},
        rewardSpeech: '',
        rewardResponses: [],
        unlocks: nextId?[nextId]:[],
        autoAccept: true,
        autoComplete: true,
      });
      // QS entry — qsInit has already run by the time this IIFE executes, so we
      // initialize new ids ourselves. All start 'locked'; touchSigil activates Q1.
      QS[id]={state:'locked', objectives:[{current:0}]};
    });
  });
})();

// Flavor text shown on sigil touch, keyed by spellId + tier-learned.
// 'first' is shown the first time the player meets this sigil — whether they qualify or not (qualification is a separate flavor).
// 'impression', 'comprehension', 'mastery' fire when the sigil grants that tier (either new-learn or upgrade).
const SIGIL_FLAVOR={
  caor:{
    firstUnqualified:'The stone is warm. Spirals of flame carved deep, filled with something darker than shadow. You press your palm against it — and feel nothing. Not yet.',
    impression:'Heat blooms behind your eyes. A word that is not a word. CAOR. You understand, in a way you cannot speak, the shape of a fire.',
    comprehension:'The carving resolves. A fire-ball, thrown from the hand. So that is what the shape was for. The Irish name fits a thing you can finally see.',
    mastery:'CAOR — Living Ember. Fire that remembers warmth and seeks it. The old word is not a name but an instruction, and you have finally heard it spoken plainly.',
  },
  sioc:{
    firstUnqualified:'A sigil of interlocking frost-spikes. The stone is cold beneath your hand — unnaturally so. Something about the pattern resists you.',
    impression:'Cold floods your fingertips and up into your teeth. SIOC. You know the shape of a frozen thing, and how to make it travel.',
    comprehension:'Sioc — Frost Bolt. A dart of ice, launched from the hand, slowing what it strikes. The pattern makes sense now.',
    mastery:"Sioc — Still-Winter's Touch. Not merely cold, but stillness itself. Every strike deepens what came before, layer upon layer, until the body forgets to move.",
  },
  sideen:{
    firstUnqualified:'The carving is barely there — lines so fine they seem to shift when you look away. The stone hums faintly, like wind through a distant arch.',
    impression:'Breath leaves you and returns wrong. SÉIDEÁN. You know, suddenly, the shape of air made blade.',
    comprehension:'Séideán — Wind Shear. A stroke of compressed air. You feel the physics of it in your wrist before you feel it in your mind.',
    mastery:'Séideán — Breath-Between-Words. The silence in which a thing is said. A blade that goes where speech goes, and cannot be parried because it is not there until it is.',
  },
  cloch_ghear:{
    firstUnqualified:"The sigil is carved deeper than the others — a thumb's width into the stone. Angular, serrated, like teeth. It does not answer you.",
    impression:'Weight settles into your hand that was not there before. CLOCH GHÉAR. The earth has spikes, it seems, and you know where.',
    comprehension:'Cloch Ghéar — Stone Spike. A shard of rock torn up beneath the target. You see it now — the old shape was literal.',
    mastery:"Cloch Ghéar — Earth's-Teeth. The stone remembers the bite. What it pierces, it holds. The slowing does not end when the stone is gone.",
  },
  smol:{
    firstUnqualified:'The sigil is barely visible — a darkness on dark stone. You only see it because the air around it seems to fold strangely.',
    impression:'Something enters you quietly. SMÓL. The word carries no heat, no cold, no light. Just direction.',
    comprehension:'Smól — Shade Bolt. A dart of shadow that does not illuminate, does not crackle. It simply arrives.',
    mastery:'Smól — The Quiet-Sent-Out. Armor is a belief. The shade-bolt does not share that belief. What it chooses to touch, it reaches.',
  },
  solas_gheal:{
    firstUnqualified:'The sigil is etched with something gold in the grooves. Light catches it from no source you can identify. Your hand falls short of the required knowing.',
    impression:'Warmth behind your eyes — a different warmth than the fire. SOLAS-GHEAL. A bright thing, launched.',
    comprehension:'Solas-Gheal — Radiant Bolt. A spear of light, thrown. The old word names the act precisely.',
    mastery:"Solas-Gheal — Morning's-First-Word. The light that starts a day, thrown at a thing that ends one. What falls by your bolt returns a measure of itself to you.",
  },
  leigheas:{
    firstUnqualified:'A sigil of concentric circles, each narrower than the last. The stone is the only warm thing in this room. Your understanding stops at the outer rings.',
    impression:'Something mends that you did not know was broken. LEIGHEAS. You understand the shape of a wound closing.',
    comprehension:'Leigheas — Healing Light. The stream turned back on itself. You see how the circles nest now.',
    mastery:"Leigheas — Hand-of-the-Stream. The water that remembers how the wound was shaped before. Not just closing — cleansing, and carrying the poison out.",
  },
};

// Runtime registry of sigil objects placed in the current dungeon (cleared on dungeon load).
let SIGILS=[];
// Sigils offer a prompt when player is near — tracked like corpse-loot prompts.
let _nearSigil=null;

// Build a sigil mesh: a recessed stone disc (darker than wall) with a school-colored carved glyph.
// Mesh is placed flat against a wall, oriented via yaw. Mesh group includes a soft PointLight that
// brightens with proximity (handled in the render loop).
function buildSigilMesh(spellId){
  const sp=SPELLS.find(s=>s.id===spellId);
  if(!sp)return null;
  const schoolCol=parseInt(SCHOOL_DEF[sp.school].col.slice(1),16);

  const g=new THREE.Group();
  // Stone disc recessed into wall — darker than surrounding wall tone, with subtle bevel ring
  const disc=new THREE.Mesh(
    new THREE.CylinderGeometry(0.58,0.58,0.08,22),
    new THREE.MeshLambertMaterial({color:0x241e14})
  );
  disc.rotation.x=Math.PI/2;
  g.add(disc);
  // Inner bevel ring — slightly brighter stone — reads as carved depth
  const bevel=new THREE.Mesh(
    new THREE.TorusGeometry(0.52,0.02,4,24),
    new THREE.MeshLambertMaterial({color:0x3a2f1f})
  );
  bevel.position.z=0.04;
  g.add(bevel);
  // Backing glow plane — gives the carving a luminous "the shape is lit from within" quality
  const backGlow=new THREE.Mesh(
    new THREE.CircleGeometry(0.46,18),
    new THREE.MeshBasicMaterial({color:schoolCol,transparent:true,opacity:0.22,side:THREE.DoubleSide})
  );
  backGlow.position.z=0.02;
  g.add(backGlow);
  // Outer rune ring — 12 small notched markers around the outside, reads as protective circle
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;
    const notch=new THREE.Mesh(
      new THREE.BoxGeometry(0.035,0.08,0.04),
      new THREE.MeshBasicMaterial({color:schoolCol,transparent:true,opacity:0.75})
    );
    notch.position.set(Math.cos(a)*0.50,Math.sin(a)*0.50,0.05);
    notch.rotation.z=a+Math.PI/2;
    g.add(notch);
  }
  // Inner rim ring — the "real" carving edge — brighter than notches
  const rim=new THREE.Mesh(
    new THREE.TorusGeometry(0.40,0.028,6,26),
    new THREE.MeshBasicMaterial({color:schoolCol,transparent:true,opacity:0.92})
  );
  rim.position.z=0.05;
  g.add(rim);
  // Thin inner ring — reinforces the carved-in-the-stone look
  const innerRim=new THREE.Mesh(
    new THREE.TorusGeometry(0.34,0.014,6,22),
    new THREE.MeshBasicMaterial({color:schoolCol,transparent:true,opacity:0.55})
  );
  innerRim.position.z=0.06;
  g.add(innerRim);

  // School-specific glyph — slightly larger than before, fully opaque, sits forward on the disc
  const glyphMat=new THREE.MeshBasicMaterial({color:schoolCol,transparent:true,opacity:0.95});
  const GZ=0.07; // glyph z-offset — all glyph geometry sits on this plane
  if(sp.school==='tine'){
    // Flame: vertical tapered diamond + two side tongues
    const flame=new THREE.Mesh(new THREE.ConeGeometry(0.17,0.42,6),glyphMat);
    flame.position.set(0,0.05,GZ);g.add(flame);
    [-1,1].forEach(s=>{const t=new THREE.Mesh(new THREE.ConeGeometry(0.07,0.18,5),glyphMat);t.position.set(s*0.13,-0.06,GZ);t.rotation.z=s*0.4;g.add(t);});
  } else if(sp.school==='uisce'){
    // Icicle: inverted narrow cone + two outer spikes
    const main=new THREE.Mesh(new THREE.ConeGeometry(0.09,0.42,6),glyphMat);
    main.rotation.z=Math.PI;main.position.set(0,-0.04,GZ);g.add(main);
    [-0.2,0.2].forEach(dx=>{const s=new THREE.Mesh(new THREE.ConeGeometry(0.045,0.20,5),glyphMat);s.rotation.z=Math.PI;s.position.set(dx,0.03,GZ);g.add(s);});
  } else if(sp.school==='gaoth'){
    // Wind: three curved strokes
    [-0.13,0,0.13].forEach(dy=>{
      const bar=new THREE.Mesh(new THREE.TorusGeometry(0.24,0.028,4,10,Math.PI*0.7),glyphMat);
      bar.rotation.z=-0.2;bar.position.set(0,dy,GZ);g.add(bar);
    });
  } else if(sp.school==='cloch'){
    // Stone: angular spine + cross-bars
    const spine=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.46,0.04),glyphMat);spine.position.z=GZ;g.add(spine);
    const bar1=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.07,0.04),glyphMat);bar1.position.set(0,0.06,GZ);g.add(bar1);
    const bar2=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.07,0.04),glyphMat);bar2.position.set(0,-0.11,GZ);g.add(bar2);
  } else if(sp.school==='scath'){
    // Shadow: crescent
    const arc=new THREE.Mesh(new THREE.TorusGeometry(0.24,0.045,6,18,Math.PI*1.1),glyphMat);
    arc.rotation.z=-Math.PI/2;arc.position.z=GZ;g.add(arc);
    const inner=new THREE.Mesh(new THREE.TorusGeometry(0.17,0.055,6,18,Math.PI*1.0),new THREE.MeshBasicMaterial({color:0x241e14}));
    inner.rotation.z=-Math.PI/2;inner.position.set(0.08,0,GZ+0.01);g.add(inner);
  } else if(sp.school==='solas'){
    // Light: sunburst
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.11,0.028,6,18),glyphMat);
    ring.position.z=GZ;g.add(ring);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      const ray=new THREE.Mesh(new THREE.BoxGeometry(0.055,0.13,0.03),glyphMat);
      ray.position.set(Math.cos(a)*0.24,Math.sin(a)*0.24,GZ);ray.rotation.z=a-Math.PI/2;g.add(ray);
    }
  }

  // Stronger glow — base 1.4 intensity (was 0.6), range 5u (was 3.5u). Proximity adds up to +2.
  const gl=new THREE.PointLight(schoolCol,1.4,5.0);
  gl.position.set(0,0,0.35);
  g.add(gl);
  // Second, tighter glow close to the carving — makes the glyph itself look hot
  const gl2=new THREE.PointLight(schoolCol,0.8,1.8);
  gl2.position.set(0,0,0.12);
  g.add(gl2);

  g.userData._glow=gl;
  g.userData._glow2=gl2;
  g.userData._glyphMats=[glyphMat];
  g.userData._backGlow=backGlow;
  g.userData._baseIntensity=1.4;
  return g;
}

// Determine the highest tier the player currently qualifies for on this sigil's spell.
// Returns 0 if INT too low for even Impression.
function sigilEligibleTier(spellId){
  const sp=SPELLS.find(s=>s.id===spellId);
  if(!sp)return 0;
  const I=ATTRS.intelligence;
  if(I>=sp.intReqs[2])return 3;
  if(I>=sp.intReqs[1])return 2;
  if(I>=sp.intReqs[0])return 1;
  return 0;
}

// Handle the player interacting with a sigil. Grants the highest tier their INT qualifies for,
// upgrading from any current tier. First visit fires different flavor than re-touches.
function touchSigil(sigil){
  const sp=SPELLS.find(s=>s.id===sigil.spellId);
  if(!sp)return;
  // v80 — the deep register: a sigil teaches by touch. Guilds stop at Comprehension; only a sigil resolves Mastery.
  // The quest hook and first-visit bookkeeping fire on every path out of this block (Session 96 had returned before them).
  {const firstVisit=!touchedSigils.has(sigil.uuid);touchedSigils.add(sigil.uuid);
   const _q=(tier)=>{try{checkQuestProgress('touch_sigil',{spellId:sigil.spellId,floor:sigil.floor,eligibleTier:tier,firstVisit});}catch(e){}
     try{const known=knownSpells[sp.id]||0;QUEST_DEFS.forEach(q=>{if(q.questline!=='sigil_lore'||q.sigilSpellId!==sigil.spellId)return;const n=parseInt(String(q.id).split('_').pop(),10);const qs=QS[q.id];if(!qs)return;if(n<=known){if(qs.state!=='complete'){qs.state='complete';}}else if(n===known+1){if(qs.state==='locked'||qs.state==='available'){qs.state='active';if(typeof showQuestUpdatePopup==='function')showQuestUpdatePopup('accept',q);}}});}catch(e){}};
   const cur=knownSpells[sp.id]||0;const ob=(typeof WORLD!=='undefined'&&WORLD.playerPeople()==='oldblood');let tier=cur>=3?3:Math.max(cur+1,ob&&cur===0?2:1);
   const need=sp.intReqs[tier-1];if(ATTRS.intelligence<need){showMsg(`The stone is warm under your hand and gives nothing. (Intelligence ${need})`,'#c8a84a');_q(cur);return;}
   if(cur>=3){mana=Math.min(effMaxMana(),mana+15);updateHUD();showMsg('The sigil has nothing more for you. It warms your hand.','#8a8ac8');_q(cur);return;}
   learnSpell(sp.id,tier);
   if(tier===3&&ob){worldState.cold=(worldState.cold||0)+1;showMsg('Something at the edge of your attention turns to look. You are colder.','#a0a8c0');}
   if(tier===3&&typeof WORLD!=='undefined'&&WORLD.onMasteryTouch)WORLD.onMasteryTouch(sp.id);
   _q(tier);return;}
  const eligible=sigilEligibleTier(sigil.spellId);
  const current=getSpellTier(sigil.spellId);
  const firstVisit=!touchedSigils.has(sigil.uuid);

  sndSpell('leigheas'); // reuse healing chime — warm, revelatory

  // v61n: any locked sigil-lore Q1 for this spellId activates on first touch — the
  // player has found the sigil, and the journal now knows to remind them to return.
  // checkQuestProgress only advances quests already in 'active' state, so this
  // transition happens here (outside the event system) ahead of the progression call.
  if(firstVisit){
    QUEST_DEFS.forEach(q=>{
      if(q.questline!=='sigil_lore' || q.sigilSpellId!==sigil.spellId)return;
      const qs=QS[q.id];
      if(!qs || qs.state!=='locked')return;
      const firstObj=q.objectives&&q.objectives[0];
      // Only the entry quest of the three-step chain auto-activates on first touch
      // (it has the firstTouch objective or minTier:1). Q2 and Q3 wait for their
      // predecessor's completion to unlock.
      if(firstObj && (firstObj.firstTouch || firstObj.minTier===1)){
        qs.state='active';
        showMsgLong(`📜 New quest: ${q.title}`,'#c0a8ff');
        updateQuestDots();
        if(hubOpen)renderQuestLog();
      }
    });
  }

  // Rejected by INT requirement
  if(eligible===0){
    showSigilOverlay(sp, SIGIL_FLAVOR[sp.id].firstUnqualified, null, sp.intReqs[0]);
    touchedSigils.add(sigil.uuid);
    addLog('📜',`Found a sigil: ${sp.nameIr} — but you do not yet know enough.`);
    checkQuestProgress('touch_sigil', {spellId:sigil.spellId, floor:sigil.floor, eligibleTier:0, firstVisit});
    return;
  }
  // No upgrade available — already at eligible tier
  if(current>=eligible){
    const labelNow=TIER_LABEL[current-1];
    const nextReqTier=current+1;
    const hint=nextReqTier<=3?`You see further into it than before, but no more than last time. (Need INT ${sp.intReqs[nextReqTier-1]} for ${TIER_LABEL[nextReqTier-1]}.)`:'You have understood this one as fully as any can.';
    showSigilOverlay(sp, `The stone is familiar. Your grasp of ${sp.nameIr} stands at ${labelNow}. ${hint}`, null, null);
    checkQuestProgress('touch_sigil', {spellId:sigil.spellId, floor:sigil.floor, eligibleTier:current, firstVisit});
    return;
  }
  // Grant or upgrade
  const result=learnSpell(sigil.spellId, eligible);
  touchedSigils.add(sigil.uuid);
  const flavorKey=eligible===3?'mastery':eligible===2?'comprehension':'impression';
  showSigilOverlay(sp, SIGIL_FLAVOR[sp.id][flavorKey], eligible, null);
  if(firstVisit && result==='learned'){
    addLog('📖',`Touched the sigil of ${sp.nameIr} (${TIER_LABEL[eligible-1]})`);
  } else if(result==='upgraded'){
    addLog('📖',`Deepened ${sp.nameIr} to ${TIER_LABEL[eligible-1]}`);
  }
  checkQuestProgress('touch_sigil', {spellId:sigil.spellId, floor:sigil.floor, eligibleTier:eligible, firstVisit});
}

// Overlay shown when a sigil is touched. Mounted inside the #g game container so it
// is bounded to the visible game window (not the full browser viewport).
//   - Learning: flavor text + tier banner + school color border
//   - Rejection: flavor text + "Intelligence N needed" footer
// Closed by Escape, E, or click.
function showSigilOverlay(sp, flavor, grantedTier, intNeeded){
  _releasePointerLockForMenu();
  const schoolCol=SCHOOL_DEF[sp.school].col;
  let el=document.getElementById('sigil-overlay');
  if(!el){
    el=document.createElement('div');
    el.id='sigil-overlay';
    // position:absolute + mounted to #g — backdrop bounded to game window, not browser viewport
    el.style.cssText='position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(20,15,8,.88),rgba(0,0,0,.96));z-index:200;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:8px';
    const gameWin=document.getElementById('g')||document.body;
    gameWin.appendChild(el);
  }
  const tierLine=grantedTier?`<div style="color:${schoolCol};font-size:10px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:10px;opacity:.85">${TIER_STARS[grantedTier-1]} ${TIER_LABEL[grantedTier-1]}</div>`:'';
  const intLine=intNeeded?`<div style="color:#8a8a6a;font-size:10px;margin-top:12px;font-style:italic">Intelligence ${intNeeded} needed to begin.</div>`:'';
  const nameLine=grantedTier?spellDisplayName(sp,grantedTier):sp.nameIr;
  // Compact card: max-width 440, tighter padding, smaller type so it fits comfortably in a 600px-tall game window
  el.innerHTML=`
    <div style="max-width:440px;width:85%;padding:22px 28px;border:1px solid ${schoolCol}55;border-radius:10px;background:linear-gradient(160deg,rgba(26,18,8,.96),rgba(14,12,6,.98));box-shadow:0 0 40px ${schoolCol}22 inset, 0 4px 24px rgba(0,0,0,.7);text-align:center">
      <div style="font-size:34px;margin-bottom:6px;opacity:.85">${sp.ico}</div>
      <div style="color:${schoolCol};font-size:17px;font-weight:600;letter-spacing:.04em;margin-bottom:3px">${nameLine}</div>
      <div style="color:#7a6b4a;font-size:9px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:14px">${SCHOOL_DEF[sp.school].name} — ${SCHOOL_DEF[sp.school].en}</div>
      ${tierLine}
      <div style="color:#d4b896;font-size:12px;line-height:1.6;font-style:italic">${flavor}</div>
      ${intLine}
      <div style="color:#4a3c20;font-size:9px;letter-spacing:.15em;text-transform:uppercase;margin-top:16px">Click or press Esc to continue</div>
    </div>`;
  el.style.display='flex';
  el.onclick=closeSigilOverlay;
  // No TTS — the flavor text reads as narration, not NPC dialog. Let the player read at their own pace.
}
function closeSigilOverlay(){
  const el=document.getElementById('sigil-overlay');
  if(el)el.style.display='none';
}

// ── QUEST UPDATE POPUP (v61af, reworked v61ag) ───────────────────────────
// Oblivion-style centered modal. Two trigger points per quest:
//   - "Quest ready to turn in" — fires when the LAST objective completes.
//   - "Quest complete" — fires after the reward is taken.
//
// v61ag changes three things:
//
// 1. LOUDER CHIME. v61af set peak gain at 0.18 which was inaudible in practice.
//    Bumped to 0.48 and added a third middle note (A5) so the chord reads as
//    a proper three-note arpeggio rather than a quiet beep.
//
// 2. POPUP PAUSES THE GAME. The main loop (see line ~14461) now treats
//    `quest-popup` the same as hub/dialog/shop for pause purposes — no enemy
//    ticking, no stamina regen, no buff decay. Player gets a reflective beat.
//
// 3. POPUPS WAIT FOR PLAYER-FREE STATE. A single `_isPlayerFree()` check gates
//    every popup firing. If any modal is up (dialog, shop, loot, notice board,
//    book, inventory, hub, sigil overlay), the popup is queued and drained
//    via a 250ms poll. The player finishes their conversation with Edna /
//    turn-in with Aldwyn naturally, THEN gets the popup. Matches the fiction:
//    the journal-update beat comes after the scene, not during.
//
// The queue is a simple FIFO. Multiple popups queue safely if multiple quests
// complete in quick succession (rare — mostly only with sigil-lore chains).
const _questPopupQueue=[];
let _questPopupOpen=false;
let _questPopupDrainTimer=null;

// v61ag: "player is free to move / read a popup" gate. True only when no
// modal/dialog/menu/overlay is open, and core game state is live. Reused by
// the popup system and could be reused elsewhere in future (level-up banners,
// achievement-style notifications, etc.).
function _isPlayerFree(){
  if(!started || dead || won) return false;
  if(typeof dlgOpen!=='undefined' && dlgOpen) return false;
  if(typeof shopOpen!=='undefined' && shopOpen) return false;
  if(typeof lootOpen!=='undefined' && lootOpen) return false;
  // v61d4 — Stash panel is also a player-not-free state.
  if(typeof stashOpen!=='undefined' && stashOpen) return false;
  if(typeof hubOpen!=='undefined' && hubOpen) return false;
  if(typeof invOpen!=='undefined' && invOpen) return false;
  if(typeof nbOpen!=='undefined' && nbOpen) return false;
  if(typeof luOpen!=='undefined' && luOpen) return false;
  if(typeof isBookOpen==='function' && isBookOpen()) return false;
  // Sigil overlay has its own show/hide — check DOM directly
  const sig = document.getElementById('sigil-overlay');
  if(sig && sig.style.display==='flex') return false;
  return true;
}

function sndQuestChime(){
  // v61ai: rewrote using sfxTone (same as sndLevelUp — known to be audible in
  // playtest). v61af/ag/ah's custom oscillator + gain chain wasn't landing even
  // at peak 0.60 through sfxGain, which was strange because the math predicted
  // it should work. Replaced with sfxTone calls for two reasons:
  //   1. Eliminate any custom-code bug surface — sfxTone is the exact code
  //      path used by every other audible SFX in the game.
  //   2. Consistency with sndLevelUp's "celebratory punctuation" patterns —
  //      rising arpeggio, staggered setTimeout, short tones.
  //
  // Three notes: E5 → A5 → B5. Each tone is 0.5s with 0.35 peak (higher than
  // sndLevelUp's 0.20 per-note — this should be at celebration-level volume,
  // clearly audible). Second oscillator at 2× freq on each note for brightness
  // (matches the sndLevelUp overtone pattern). Triangle wave to give the chime
  // a bell-like character rather than sndLevelUp's pure-sine tone.
  //
  // The early-return guard (volLevel===0) still runs. sfxTone itself bails out
  // cleanly if AX or sfxGain isn't ready — so there's no timing race.
  if(typeof volLevel!=='undefined' && volLevel===0) return;
  // E5 — first note, with octave overtone shimmer
  sfxTone(659.25, 659.25*1.005, 0.55, 0.35, 'triangle');
  sfxTone(659.25*2, 659.25*2*1.005, 0.40, 0.18, 'sine');
  // A5 — middle note, 160ms later
  setTimeout(()=>{
    sfxTone(880.00, 880.00*1.005, 0.55, 0.32, 'triangle');
    sfxTone(880.00*2, 880.00*2*1.005, 0.40, 0.16, 'sine');
  }, 160);
  // B5 — final bell, 320ms after start
  setTimeout(()=>{
    sfxTone(987.77, 987.77*1.005, 0.80, 0.30, 'triangle');
    sfxTone(987.77*2, 987.77*2*1.005, 0.65, 0.14, 'sine');
  }, 320);
}

// v61ag: public entry point. Always queues — never fires synchronously. The
// poll drains as soon as the player is free. Callers never need to worry
// about whether the dialog is open; the queue handles it.
function showQuestUpdatePopup(kind, qDef, opts){
  // v61ak: optional opts object — currently supports {bodyText} to override
  // the default lookup of qDef.acceptText / readyText / completeText. Used by
  // per-objective completionText popups which want to show the objective's
  // flavor text instead of the quest-level strings. qDef is still passed so
  // the popup title matches the quest's name.
  _questPopupQueue.push({kind, qDef, opts:opts||null});
  _ensureQuestPopupDrainPoll();
}

function _ensureQuestPopupDrainPoll(){
  if(_questPopupDrainTimer) return;
  const tick = () => {
    _questPopupDrainTimer = null;
    if(!_questPopupQueue.length) return;
    if(_questPopupOpen || !_isPlayerFree()){
      // Not ready yet — poll again in 250ms. Cheap; only runs when queue is
      // non-empty AND the player isn't free.
      _questPopupDrainTimer = setTimeout(tick, 250);
      return;
    }
    const next = _questPopupQueue.shift();
    _renderQuestUpdatePopup(next.kind, next.qDef, next.opts);
    // If more items queued behind this one, keep polling (they'll drain
    // after this popup is closed — see closeQuestUpdatePopup).
  };
  // First tick fires on next animation frame so the caller's own state
  // changes (e.g. questComplete → state change → toast) settle first.
  _questPopupDrainTimer = setTimeout(tick, 50);
}

function _renderQuestUpdatePopup(kind, qDef, opts){
  // v62.4 — Release pointer lock so the player can dismiss the popup with the
  // mouse. Quest popups fire from setTimeout callbacks (not user gestures), so
  // Chrome may reject this call — Esc remains the reliable fallback. The most
  // common popup trigger (dialog turn-in) already has dialog menu open and
  // pointer unlocked, so this path is rarely hot.
  _releasePointerLockForMenu();
  _questPopupOpen = true;
  // Build modal DOM (reuse if it exists).
  let el = document.getElementById('quest-popup');
  if(!el){
    el = document.createElement('div');
    el.id = 'quest-popup';
    el.style.cssText = 'position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(10,8,4,.88),rgba(0,0,0,.96));z-index:200;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:8px';
    const gameWin = document.getElementById('g') || document.body;
    gameWin.appendChild(el);
  }
  // v61aj: popup kinds — 'accept' (quest just started), 'ready' (final
  // objective done, go turn in), 'complete' (reward taken).
  // v61ak: added 'update' (objective ticked with a completionText).
  // Accept / update / ready share the purple "something changed" palette since
  // they all signal "there is something new to do"; complete gets the gold
  // palette to mark the end.
  const title = kind==='complete' ? 'Quest Complete'
              : kind==='accept'   ? 'Quest Started'
              : kind==='update'   ? 'Quest Updated'
                                  : 'Quest Updated';
  const titleColor = kind==='complete' ? '#ffd700' : '#c0a8ff';
  const icon = kind==='complete' ? '✅' : '📜';
  // opts.bodyText (v61ak) — override when a per-objective completionText wants
  // its own reflective text instead of the quest-level strings. Falls back to
  // quest-level strings if opts.bodyText isn't passed.
  const bodyText = (opts && opts.bodyText) ? opts.bodyText
    : kind==='complete'
      ? (qDef.completeText || `"${qDef.title}" is done. The work was worth doing.`)
    : kind==='accept'
      ? (qDef.acceptText || `"${qDef.title}" has been added to my journal.`)
    : (qDef.readyText || `"${qDef.title}" is ready. Return to ${qDef.giver || 'the giver'} to turn it in.`);

  // v61ah: rewards section — only on completion popups, only when there's
  // something to show. Renders XP, gold, and item drops on a separate styled
  // block below the body text. Items show icon + name; XP/gold show numeric
  // value with the standard emoji. Visually distinct from the italic body
  // text: non-italic, slightly brighter, bordered top.
  let rewardsBlock = '';
  if(kind==='complete' && qDef.rewards){
    const rw = qDef.rewards;
    const parts = [];
    if(rw.xp && rw.xp>0){
      parts.push(`<span style="color:#c8b880">✦ ${rw.xp} XP</span>`);
    }
    if(rw.gold && rw.gold>0){
      parts.push(`<span style="color:#ffd700">🪙 ${rw.gold} gold</span>`);
    }
    if(Array.isArray(rw.items) && rw.items.length){
      rw.items.forEach(it=>{
        const nameStr = it.name || 'Item';
        const icoStr = it.ico || '📦';
        parts.push(`<span style="color:#e8c888">${icoStr} ${nameStr}</span>`);
      });
    }
    if(parts.length){
      rewardsBlock = `
        <div style="margin-top:18px;padding-top:14px;border-top:1px solid ${titleColor}33">
          <div style="color:${titleColor};font-size:9px;letter-spacing:.22em;text-transform:uppercase;margin-bottom:10px;opacity:.85">Rewards</div>
          <div style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:500">
            ${parts.map(p=>`<div>${p}</div>`).join('')}
          </div>
        </div>`;
    }
  }

  // v61ai: chime FIRES FIRST, before DOM updates. This eliminates any timing
  // concern where the popup's visibility change might interact with audio
  // scheduling. Audio context runs independently of game tick, but firing
  // the sound first just makes it unambiguous.
  sndQuestChime();
  el.innerHTML = `
    <div style="max-width:460px;width:86%;padding:24px 30px;border:1px solid ${titleColor}55;border-radius:10px;background:linear-gradient(160deg,rgba(22,16,8,.97),rgba(12,10,6,.99));box-shadow:0 0 44px ${titleColor}22 inset, 0 4px 28px rgba(0,0,0,.75);text-align:center">
      <div style="color:${titleColor};font-size:10px;letter-spacing:.22em;text-transform:uppercase;margin-bottom:10px;opacity:.95">${icon} ${title}</div>
      <div style="color:${titleColor};font-size:18px;font-weight:600;letter-spacing:.03em;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid ${titleColor}33">${qDef.title}</div>
      <div style="color:#d4b896;font-size:13px;line-height:1.7;font-style:italic;white-space:pre-wrap">${bodyText}</div>
      ${rewardsBlock}
      <div style="color:#4a3c20;font-size:9px;letter-spacing:.15em;text-transform:uppercase;margin-top:22px">Click or press Esc to continue</div>
    </div>`;
  el.style.display = 'flex';
  el.onclick = closeQuestUpdatePopup;
}

function closeQuestUpdatePopup(){
  const el = document.getElementById('quest-popup');
  if(el) el.style.display='none';
  _questPopupOpen = false;
  // If more items queued, kick off another drain attempt.
  if(_questPopupQueue.length){
    _ensureQuestPopupDrainPoll();
  }
}

// ── SPELL ORB POOL ────────────────────────────────────────────
// Pre-build one template Group per projectile spell at startup.
// castSpell() clones the template instead of creating new geometry,
// eliminating the per-cast GPU stall from new BufferGeometry uploads.
const SPELL_ORB_TEMPLATES={};
function buildSpellOrbTemplates(){
  SPELLS.filter(sp=>sp.speed>0).forEach(sp=>{
    const fb=new THREE.Group();
    fb.add(new THREE.Mesh(
      new THREE.SphereGeometry(.1,8,8),
      new THREE.MeshBasicMaterial({color:sp.col})
    ));
    fb.add(new THREE.Mesh(
      new THREE.SphereGeometry(.2,8,8),
      new THREE.MeshBasicMaterial({color:sp.glowCol,transparent:true,opacity:.3})
    ));
    SPELL_ORB_TEMPLATES[sp.id]=fb;
  });
  // Enemy orb templates (Phantom = blue, Wraith = pink)
  ['phantom','wraith'].forEach(type=>{
    const col=type==='wraith'?0xff22aa:0x8888ff;
    const glow=type==='wraith'?0xdd0088:0x6666ff;
    const orb=new THREE.Group();
    orb.add(new THREE.Mesh(new THREE.SphereGeometry(.09,7,7),new THREE.MeshBasicMaterial({color:col})));
    orb.add(new THREE.Mesh(new THREE.SphereGeometry(.18,7,7),new THREE.MeshBasicMaterial({color:glow,transparent:true,opacity:.25})));
    SPELL_ORB_TEMPLATES['enemy_'+type]=orb;
  });
  // Loot spark (shown above corpses)
  SPELL_ORB_TEMPLATES['lootSpark']=new THREE.Mesh(
    new THREE.SphereGeometry(.06,5,5),
    new THREE.MeshBasicMaterial({color:0xffdd66})
  );
}
let partialSpells=[];
// activeSpellId: the spell the F button casts. null when knownSpells is empty.
// Set automatically on first spell learn; changed when player clicks a spell in the magic tab.
let activeSpellId=null;

// Learn or upgrade a spell to the target tier. Used by sigil touch and scroll reading.
// Returns: 'learned' (newly known), 'upgraded' (tier increased), 'noop' (already at or above this tier).
// ═══════════════════════════════════════════════════════════════════════
// v80 — MAGIC (Session I). Self spells (role 'buff'): Levitate, Haste,
// Water Walking, Water Breathing, Feather, Light, Night Eye, Shield. Spells
// are bought at Mages' Guilds (basics at any guild; higher tiers by rank),
// or read from spellbooks found in chests. Cave sigils are retired.
// ═══════════════════════════════════════════════════════════════════════
const SPELL_FX={levitate:0,haste:0,waterwalk:0,waterbreath:0,feather:0,light:0,nighteye:0,shield:0};
let _spellLight=null;
setTimeout(()=>{try{if(!_spellLight&&typeof CAM!=='undefined'){_spellLight=new THREE.PointLight(0xfff0c0,0,18);CAM.add(_spellLight);_spellLight.position.set(0,.4,-.6);}}catch(e){}},0);
function fxOn(k){return SPELL_FX[k]>performance.now();}
function spellLevitating(){return fxOn('levitate');}
const BUFF_SPELLS=[
 {id:'cleite',   school:'gaoth',role:'buff',nameIr:'Cleite',   nameEn:'Feather',        nameMa:'Weightless Step', ico:'🪶',desc:'Carry more, for a while.',intReqs:[1,8,20],cost:16,speed:0,dmgBase:0,dmgLvl:0,col:0xd8e8ff,glowCol:0xe8f4ff,buff:{key:'feather',dur:[90,180,360]},price:[80,260,600]},
 {id:'lampa',    school:'solas',role:'buff',nameIr:'Lampa',    nameEn:'Light',          nameMa:'Lantern of the Mind',ico:'💡',desc:'A light that follows you.',intReqs:[1,8,20],cost:12,speed:0,dmgBase:0,dmgLvl:0,col:0xfff0b0,glowCol:0xfff8d0,buff:{key:'light',dur:[120,240,480]},price:[60,220,520]},
 {id:'luas',     school:'gaoth',role:'buff',nameIr:'Luas',     nameEn:'Haste',          nameMa:'Wind at the Heel',ico:'💨',desc:'Move half again as fast.',intReqs:[6,14,28],cost:24,speed:0,dmgBase:0,dmgLvl:0,col:0xc0ffe0,glowCol:0xd8fff0,buff:{key:'haste',dur:[30,60,120]},price:[250,500,900],rank:1},
 {id:'siul_uisce',school:'uisce',role:'buff',nameIr:'Siúl Uisce',nameEn:'Water Walking', nameMa:'The Dry Path',    ico:'🌊',desc:'Walk on water.',intReqs:[6,14,28],cost:22,speed:0,dmgBase:0,dmgLvl:0,col:0x80c0ff,glowCol:0xa0d8ff,buff:{key:'waterwalk',dur:[45,90,180]},price:[250,500,900],rank:1},
 {id:'anail',    school:'uisce',role:'buff',nameIr:'Anáil',    nameEn:'Water Breathing',nameMa:'Gills of the Deep',ico:'🫧',desc:'Breathe under water.',intReqs:[6,14,28],cost:20,speed:0,dmgBase:0,dmgLvl:0,col:0x60a0ff,glowCol:0x80c0ff,buff:{key:'waterbreath',dur:[60,120,240]},price:[250,500,900],rank:1},
 {id:'sciath',   school:'cloch',role:'buff',nameIr:'Sciath',   nameEn:'Shield',         nameMa:'Stone Skin',      ico:'🛡',desc:'Blows land softer.',intReqs:[10,18,32],cost:28,speed:0,dmgBase:0,dmgLvl:0,col:0xc0b090,glowCol:0xe0d0b0,buff:{key:'shield',dur:[40,80,150]},price:[500,900,1400],rank:2},
 {id:'suil_oiche',school:'scath',role:'buff',nameIr:'Súil Oíche',nameEn:'Night Eye',    nameMa:'The Owl\'s Gift', ico:'🦉',desc:'See in the dark.',intReqs:[10,18,32],cost:18,speed:0,dmgBase:0,dmgLvl:0,col:0xa0a0ff,glowCol:0xc0c0ff,buff:{key:'nighteye',dur:[120,240,480]},price:[500,900,1400],rank:2,rare:true},
 {id:'suil_fiodora',school:'scath',role:'buff',nameIr:'Súil an Fhíodóra',nameEn:"Weaver's Eye",nameMa:'The Loom Seen',ico:'🧵',desc:'The compass turns toward the nearest warm stone.',intReqs:[8,16,30],cost:14,speed:0,dmgBase:0,dmgLvl:0,col:0xa0c8ff,glowCol:0xc0e0ff,buff:{key:'seamsight',dur:[60,120,240]},price:[180,400,800],rank:1},
 {id:'eitilt',   school:'gaoth',role:'buff',nameIr:'Eitilt',   nameEn:'Levitate',       nameMa:'The Unbound Foot',ico:'🕊',desc:'Rise into the air. Space to climb, C to sink.',intReqs:[12,20,34],cost:34,speed:0,dmgBase:0,dmgLvl:0,col:0xf0e0ff,glowCol:0xffffff,buff:{key:'levitate',dur:[25,50,100]},price:[800,1400,2200],rank:3,rare:true},
];
BUFF_SPELLS.forEach(s=>{if(!SPELLS.find(x=>x.id===s.id))SPELLS.push(s);});
const ELEMENTAL_PRICE=[[120,320,700],[120,320,700]]; // tier prices for the seven originals
function applySpellBuff(sp,tier){
  const b=sp.buff;const dur=b.dur[Math.max(0,tier-1)]*_buffMult('spellDuration',1);SPELL_FX[b.key]=performance.now()+dur*1000;
  if(b.key==='shield'){if(typeof _applyBuff==='function')_applyBuff({type:'warding',mult:tier>=3?.5:tier===2?.6:.7,duration:dur,label:'Shield',col:'#c0b090'});}
  if(b.key==='light'){if(!_spellLight){_spellLight=new THREE.PointLight(0xfff0c0,0,18);CAM.add(_spellLight);_spellLight.position.set(0,.4,-.6);}_spellLight.intensity=1.4+tier*.3;}
  showMsg(`${sp.ico} ${sp.nameEn} — ${Math.round(dur)}s`,'#c0e0ff');
}
function tickSpellFx(dt){
  if(_spellLight&&!fxOn('light')&&_spellLight.intensity>0)_spellLight.intensity=Math.max(0,_spellLight.intensity-dt*2);
}
// spellbooks: read to learn
function spellbookItem(spellId,tier){const sp=SPELLS.find(s=>s.id===spellId);return {name:`Spellbook: ${sp.nameEn}`,ico:'📕',type:'spellbook',spellId,tier:tier||1,weight:.8,sellMult:.5,buyPrice:sp.price?sp.price[(tier||1)-1]:300,qty:1};}
function readSpellbook(i){
  const it=BAG[i];const sp=SPELLS.find(s=>s.id===it.spellId);if(!sp)return;
  const need=sp.intReqs[(it.tier||1)-1];if(ATTRS.intelligence<need){showMsg(`The pages swim before your eyes. (INT ${need} needed)`,'#c8a84a');return;}
  const r=learnSpell(sp.id,it.tier||1);if(r==='noop'){showMsg('You already understand this book.','#aaa');return;}
  it.qty=(it.qty||1)-1;if(it.qty<=0)BAG.splice(i,1);if(typeof renderInv==='function')renderInv();
}
// guild vendors: what a Mages' Guild can teach you right now
function spellShopTopics(rankIdx){
  const out=[];
  for(const sp of SPELLS){
    if(sp.rare&&!(rankIdx>=3))continue;
    const cur=(knownSpells[sp.id]||0);if(cur>=2)continue;const tier=cur+1; // the institutional register stops at Comprehension; Mastery is the sigils' alone
    const needRank=(sp.rank||0)+(tier-1);if(rankIdx<needRank)continue;
    const price=(sp.price||[120,320,700])[tier-1];
    out.push({label:`${cur?'Deepen':'Learn'} ${sp.nameEn}${cur?' → '+TIER_LABEL[tier-1]:''} (${price}g)`,quest:true,fn:()=>{
      if(gold<price)return `${sp.nameEn} is ${price} gold at that depth.`;
      const need=sp.intReqs[tier-1];if(ATTRS.intelligence<need)return `You'd not hold it yet. Intelligence ${need}, then come back.`;
      gold-=price;updateHUD();learnSpell(sp.id,tier);return `${sp.nameEn}. Say it slowly the first few times.`;}});
  }
  return out;
}

function learnSpell(spellId, targetTier=1){
  const sp=SPELLS.find(s=>s.id===spellId);
  if(!sp)return 'noop';
  const prevTier=knownSpells[spellId]||0;
  if(targetTier<=prevTier)return 'noop';
  knownSpells[spellId]=targetTier;
  partialSpells=partialSpells.filter(p=>p!==spellId);
  // First spell learned → auto-equip as active
  if(!activeSpellId)activeSpellId=spellId;
  const name=spellDisplayName(sp,targetTier);
  const verb=prevTier===0?'Learned':'Deepened understanding of';
  showMsg(`✨ ${verb} ${name}!`,'#88ffcc');
  addLog('📖',`${verb}: ${name} (${TIER_LABEL[targetTier-1]})`);
  updateSpellButton();
  return prevTier===0?'learned':'upgraded';
}
// Mystic Scrolls teach Impression-tier of a random unknown spell, gated by that spell's Impression INT threshold.
// If already known at any tier, scroll crumbles to dust.
function readScroll(){
  const unknown=SPELLS.filter(s=>!knownSpells[s.id]);
  if(!unknown.length){showMsg('The scroll crumbles — you know all spells.','#aaa');return;}
  const sp=unknown[Math.floor(Math.random()*unknown.length)];
  const impReq=sp.intReqs[0];
  if(ATTRS.intelligence>=impReq){learnSpell(sp.id,1);}
  else{
    if(!partialSpells.includes(sp.id))partialSpells.push(sp.id);
    showMsg(`You grasp fragments of ${sp.nameIr}... (need INT ${impReq})`,'#c8a84a');
    addLog('📖',`Partially understood: ${sp.nameIr} (INT ${impReq} needed)`);
  }
}
// Re-check partials when INT changes on level-up. Now teaches at Impression tier only.
function checkPartialSpells(){
  [...partialSpells].forEach(id=>{
    const sp=SPELLS.find(s=>s.id===id);
    if(sp&&ATTRS.intelligence>=sp.intReqs[0])learnSpell(id,1);
  });
}
