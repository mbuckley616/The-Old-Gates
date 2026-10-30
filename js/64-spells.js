
// ── SPELL SYSTEM ─────────────────────────────────────────────
// Each spell has three tiers: Impression (1), Comprehension (2), Mastery (3).
// Tier is stored per-spell in `knownWords[id] = 1|2|3`. Higher Intelligence unlocks higher tiers at sigil touch.
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
const IMPRESSION_WILD_CHANCE=0.30; /* S1571 — magic B: 30%, the figure Scáth's Steady voice (school 25, session 5) halves */
// S1619 — the schools' first two perks (magic-build.md's session 5; skills-and-perks-build.md, "Each school"): Steady voice at 25 halves
// an Impression word's wild chance, 30% to 15%, for that word's school; Thrift at 50 takes 15% off the mana of any word of the school.
const STEADY_VOICE_WILD=.15,THRIFT_MULT=.85;
function wordWildChance(word){const w=WORD_BY[word]||SPELLS.find(s=>s.id===word);return w&&perk(w.school,25)?STEADY_VOICE_WILD:IMPRESSION_WILD_CHANCE;}
// S1571 — overcasting (magic-build.md): short of mana, the rest is paid in health, 2 a point of mana, with a 0.5 s stagger; a cast
// that would leave you under 1 health is refused.
const OVERCAST_HP=2,OVERCAST_STAGGER_S=.5;

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
  if(tier>=3)return `${sp.nameIr} — ${sp.nameMa||sp.nameEn}`;
  if(tier>=2)return `${sp.nameIr} — ${sp.nameEn}`;
  return sp.nameIr;
}
// Fetch the current tier (1–3) for a spell id, or 0 if not known.
// S1586 — a carving may hold one of magic B's eight new words, which the old SPELLS table lacks: the sigil's paths read the word then
function spellOrWord(id){return SPELLS.find(s=>s.id===id)||(typeof WORD_BY!=='undefined'?WORD_BY[id]:null)||null;}
function getSpellTier(id){return knownWords[id]||0;}
// S1346 — the tier a cast reads (great-gates-build.md, Michael's A on #292): the tier learned, one deeper while the school's great gate is
// torn and one shallower while it is bound, from Impression to Mastery; a spell not known stays 0. Casting, its name, cost, cooldown and
// the wild roll read this; learning (a sigil, a guild's Deepen, Intelligence's requirements) reads getSpellTier.
function effTier(id){const t=getSpellTier(id);if(!t)return 0;const sp=SPELLS.find(s=>s.id===id);const st=sp&&typeof greatGateState==='function'?greatGateState(sp.school):null;
  return Math.max(1,Math.min(3,t+(st==='torn'?1:st==='sealed'?-1:0)));}
// Tier-scaled numeric stats for a cast.
function spellMag(sp,tier){return (sp.dmgBase||0)*TIER_MULT.magnitude[tier-1];}
function spellHealMag(sp,tier){return (sp.healBase||0)*TIER_MULT.magnitude[tier-1];}
function spellCost(sp,tier){return Math.round(sp.cost*TIER_MULT.cost[tier-1]);}
function spellCooldown(sp,tier){return (1.0+sp.cost*.012)*TIER_MULT.cooldown[tier-1];}
function spellAtTier(id){const sp=SPELLS.find(s=>s.id===id);const t=getSpellTier(id);return sp&&t?{sp,tier:t}:null;}

// knownWords: {spellId: tier} — empty on new game. Touch a sigil to learn at your INT-qualified tier.
let knownWords={};
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
  const sp=spellOrWord(spellId);
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
  const sp=spellOrWord(spellId);
  if(!sp)return 0;
  const I=ATTRS.intelligence;
  if(I>=sp.intReqs[2])return 3;
  if(I>=sp.intReqs[1])return 2;
  if(I>=sp.intReqs[0])return 1;
  return 0;
}

// Handle the player interacting with a sigil. Grants the highest tier their INT qualifies for,
// upgrading from any current tier. First visit fires different flavor than re-touches.
// the carving's door, read: worldState.sigilsRead[seed] = its word, for a world gate's carving only (a legacy dungeon's seed is SIGIL_PLACEMENTS')
function sigilRead(sigil){const P=typeof currentPortal!=='undefined'?currentPortal:null;if(!P||!(P.zone==='world'||P.zone==='gen')||SIGIL_PLACEMENTS[P.seed])return;
  (worldState.sigilsRead||(worldState.sigilsRead={}))[P.seed]=sigil.spellId;}
function touchSigil(sigil){
  if(typeof knifeAtSigil==='function')knifeAtSigil(sigil); /* S1353 — the knife does nothing here, once a sigil */
  const sp=spellOrWord(sigil.spellId);
  if(!sp)return;
  sigilRead(sigil); /* S1586 — a world gate's carving is read once touched (the Register counts them, Súil passes them by) */
  // v80 — the deep register: a sigil teaches by touch. Guilds stop at Comprehension; only a sigil resolves Mastery.
  // The quest hook and first-visit bookkeeping fire on every path out of this block (Session 96 had returned before them).
  {const firstVisit=!touchedSigils.has(sigil.uuid);touchedSigils.add(sigil.uuid);
   const _q=(tier)=>{try{checkQuestProgress('touch_sigil',{spellId:sigil.spellId,floor:sigil.floor,eligibleTier:tier,firstVisit});}catch(e){}
     try{const known=knownWords[sp.id]||0;QUEST_DEFS.forEach(q=>{if(q.questline!=='sigil_lore'||q.sigilSpellId!==sigil.spellId)return;const n=parseInt(String(q.id).split('_').pop(),10);const qs=QS[q.id];if(!qs)return;if(n<=known){if(qs.state!=='complete'){qs.state='complete';}}else if(n===known+1){if(qs.state==='locked'||qs.state==='available'){qs.state='active';if(typeof showQuestUpdatePopup==='function')showQuestUpdatePopup('accept',q);}}});}catch(e){}};
   const cur=knownWords[sp.id]||0;const ob=(typeof WORLD!=='undefined'&&WORLD.playerPeople()==='oldblood');let tier=cur>=3?3:Math.max(cur+1,ob&&cur===0?2:1);
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
  refocusView(); /* S722 */
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
// S487 — the card's words for a quest event, also written into the journal (journalQuest)
function questPopupBody(kind, qDef, opts){
  return (opts && opts.bodyText) ? opts.bodyText
    : kind==='complete'
      ? (qDef.completeText || `"${qDef.title}" is done. The work was worth doing.`)
    : kind==='accept'
      ? (qDef.acceptText || `"${qDef.title}" has been added to my journal.`)
    : (qDef.readyText || `"${qDef.title}" is ready. Return to ${qDef.giver || 'the giver'} to turn it in.`);
}
function showQuestUpdatePopup(kind, qDef, opts){
  // v61ak: optional opts object — currently supports {bodyText} to override
  // the default lookup of qDef.acceptText / readyText / completeText. Used by
  // per-objective completionText popups which want to show the objective's
  // flavor text instead of the quest-level strings. qDef is still passed so
  // the popup title matches the quest's name.
  try{journalQuest(kind,qDef,questPopupBody(kind,qDef,opts));}catch(e){} // S487 — the line goes in the journal when it happens, not when the card is read
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
  const bodyText = questPopupBody(kind, qDef, opts);

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
  refocusView(); /* S722 */
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
// activeSpellId: the spell the F button casts. null when knownWords is empty.
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
const SPELL_FX={levitate:0,haste:0,waterwalk:0,waterbreath:0,feather:0,light:0,nighteye:0,shield:0,leap:0};
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
 {id:'ean',      school:'gaoth',role:'buff',nameIr:'Éan',      nameEn:'Leap',           nameMa:'Wingless',        ico:'🦅',desc:'Jump higher, for a while.',intReqs:[8,18,32],cost:26,speed:0,dmgBase:0,dmgLvl:0,col:0xd8f0ff,glowCol:0xe8f8ff,buff:{key:'leap',dur:[20,40,80]},price:[250,500,900],rank:1}, /* S1605 — magic B's Éan, worn */
];
BUFF_SPELLS.forEach(s=>{if(!SPELLS.find(x=>x.id===s.id))SPELLS.push(s);});
// S1606 — Tintreach sent (magic-build.md's table: "bolt 24, leaps 5 m at half"): a bolt of 24 at Séideán's speed, the fastest the
// build has (14 m/s), and on a hit it leaps to the nearest other foe within 5 m of the one struck for half the blow, once. The leap takes
// no rider and starts no burn. Its Mastery has no canon entry (nameMa null), so it is the plain word at ×1.3 as the sheet says.
SPELLS.push({id:'tintreach',school:'tine',role:'basic',nameIr:'Tintreach',nameEn:'Chain Lightning',nameMa:null,ico:'⚡',desc:'A bolt that leaps to a second foe.',
  intReqs:[12,25,45],cost:36,speed:14,dmgBase:24,dmgLvl:3,col:0xb8d4ff,glowCol:0xd8e8ff,wild:['scatter','fizzle','backlash']});
// the leap from struck foe e: the nearest other live foe within 5 m of it takes ×0.5 of the bolt's blow. Returns it, or null.
function tintreachLeap(e,sp,tier){const L=WORD_BY.tintreach.forms.sent,dun=!!(lid&&lid.startsWith('dyn_'));let best=null,bd=L.leap+1e-9;
  for(const o of heldTargets()){if(o===e||o.dead||o.locked||o.disguised||(dun&&o.floor!==currentFloor))continue;const d=Math.hypot(o.x-e.x,o.z-e.z);if(d<=bd){bd=d;best=o;}}
  if(!best)return null;
  const info=applySpellDamage(best,sp,tier,{power:L.leapMult});best.hp=Math.max(0,best.hp-info.dmg);best.alert=true;
  if(best.hpFg&&best.maxHp){best.hpFg.scale.x=best.hp/best.maxHp;best.hpFg.position.x=(best.hp/best.maxHp-1)*.275;}
  dmgNum(best,info.dmg,info);
  if(best.hp<=0){if(dun)killE(best,dmgTag(info,best));else killZoneEnemy(best,scene,dmgTag(info,best));}
  return {foe:best,dealt:info.dmg,d:+bd.toFixed(2)};}
// S1610 — Fréamh sent (magic-build.md's table: "a foe rooted 2 s"): a bolt that deals nothing and roots the foe it strikes, 2 s at
// Comprehension, the tier's magnitude (1.2 s at Impression, 2.6 at Mastery: no canon entry, so ×1.3). A rooted foe turns and strikes but
// takes no step (foeRooted, S1602's root). It flies at Cloch Ghéar's 8 m/s. A rider still rides it, on a blow of 0. `status` marks a
// bolt that the two hit loops hand to statusBolt in place of the damage.
SPELLS.push({id:'freamh',school:'cloch',role:'basic',nameIr:'Fréamh',nameEn:'Root',nameMa:null,ico:'🌿',desc:'Roots a foe where it stands.',
  intReqs:[10,22,40],cost:30,speed:8,dmgBase:0,dmgLvl:0,col:0x6a8a3a,glowCol:0x8aaa50,wild:['scatter','fizzle'],status:'root'});
// statusBolt: what a status bolt does to foe e it struck. A struck alert foe is a use of the school, as a blow is. Returns what it did.
function statusBolt(e,sp,tier,rider){if(!e||e.dead||e.hp<=0)return null;const F=WORD_BY[sp.id]&&WORD_BY[sp.id].forms.sent;if(!F)return null;
  if(e.alert&&SKILL_DEF[sp.school])skillUse(sp.school,tier===3?2:1,e);
  const out={};
  if(F.root){const t=F.root*TIER_MULT.magnitude[Math.max(1,tier)-1];e._rootUntil=Math.max(e._rootUntil||0,playClockS+t);out.root=+t.toFixed(2);}
  e.alert=true;if(rider)out.rider=riderHit(e,rider,0);
  return out;}
// S1611 — Tonn sent (magic-build.md's table: "a wave 8 m down the line, 14, posture 20"): no bolt flies. At the Cast row's release a
// wave runs from you along your aim, 8 m or to the first wall, and every foe in its path takes the word's 14 (the tier's magnitude, the
// school's power) and 20 from its posture, a break staggering it as a blow's does. The path is 1.6 m wide, Tonn's laid width (the bridge,
// RIDERS.sioc.laid.bridge): the sheet gives the sent wave no width of its own. It strikes at once, not as a travelling crest. A rider rides
// each foe it strikes. Its Mastery has no canon entry, so it is the plain word at ×1.3.
SPELLS.push({id:'tonn',school:'uisce',role:'basic',nameIr:'Tonn',nameEn:'Force Wave',nameMa:null,ico:'〰️',desc:'A wave that throws down what stands in its line.',
  intReqs:[10,22,40],cost:32,speed:0,dmgBase:14,dmgLvl:2,col:0x5a9ad8,glowCol:0x8ac0f0,wild:['scatter','fizzle'],wave:true});
// tonnWave: the named action. The wave from x,z along (ux,uz) on `floor` (a gate's). Returns {len, hit:[{foe,dealt,broke}]}.
function tonnWave(sp,tier,rider,x,z,ux,uz,floor){const F=WORD_BY.tonn.forms.sent,hw=RIDERS.sioc.laid.bridge.wide/2,dun=!!(lid&&lid.startsWith('dyn_'));
  let len=F.wave;for(let s=.1;s<=F.wave+1e-9;s+=.1)if(riderFoeSolid(x+ux*s,z+uz*s,dun)){len=s-.1;break;}
  const out={len:+len.toFixed(2),hit:[]},now=performance.now()/1000;
  for(const e of heldTargets()){if(e.dead||e.locked||e.disguised||e.hp<=0||(dun&&e.floor!==floor))continue;
    const dx=e.x-x,dz=e.z-z,a=dx*ux+dz*uz,b=Math.abs(-dx*uz+dz*ux),h=hullOf(e);
    if(a<-h||a>len+h||b>hw+h)continue;
    const info=applySpellDamage(e,sp,tier),dealt=info.dmg;e.hp=Math.max(0,e.hp-dealt);e.alert=true;
    if(e.hpFg&&e.maxHp){e.hpFg.scale.x=e.hp/e.maxHp;e.hpFg.position.x=(e.hp/e.maxHp-1)*.275;}
    dmgNum(e,dealt,info);
    let broke=false;
    if(e.hp>0){if(typeof e.posture!=='number'&&typeof initPosture==='function')initPosture(e);
      if(typeof e.posture==='number'&&applyPostureDamage(e,F.posture,now)){broke=true;staggered.push({e,t:dazeS(POSTURE_BREAK_STUN)});staggerFlash(e);}}
    if(rider)riderHit(e,rider,dealt);
    out.hit.push({foe:e,dealt,broke});
    if(e.hp<=0){if(dun)killE(e,dmgTag(info,e));else killZoneEnemy(e,scene,dmgTag(info,e));}}
  return out;}
// S1618 — Dul Thart sent (magic-build.md's table: "the step: arrive where it lands, 12 m"; "Movement against the step table": "12 m,
// stops at the first solid", the 10 m band). No bolt flies: at the Cast row's release you are moved along your snapped aim, level, 12 m
// or to the first wall, your body's 0.3 kept clear of it. A rise of more than a step indoors (a foothold, a dais) is a wall to it; the
// land outdoors is not, and you arrive on it. Where it ends over lower ground (a chasm's air, a ravine) you arrive in the air and
// fall from there, as the fall rule counts it. Its length is the same at every tier and skill level (places are built to steps); only
// Impression's wild roll moves it: fizzle, scatter (±20° of aim) or overshoot (×1.5, 18 m). A step of 1 m or more is a use of Scáth.
// Its Mastery has no canon entry. The Scáth perks (18 m at 75, unseen 3 s after a step at 100) wait for the schools' perks.
SPELLS.push({id:'dul_thart',school:'scath',role:'basic',nameIr:'Dul Thart',nameEn:'Phase',nameMa:null,ico:'👣',desc:'A step that passes beyond: you arrive where it lands.',
  intReqs:[14,28,48],cost:40,speed:0,dmgBase:0,dmgLvl:0,col:0x40305a,glowCol:0x7a60a8,wild:['fizzle','scatter','overshoot'],step:true});
const STEP_OVERSHOOT=1.5,STEP_BODY=.3;
// stepWord: the named action. Moves you from x,z along (ux,uz) up to len, level with your feet. Returns {len, x, z, wall}.
function stepWord(x,z,ux,uz,len){const y0=jumpY,ow=isOverworldZone()&&!isInterior()&&!(lid&&lid.startsWith('dyn_'));
  const pad=ow?0:STEP_BODY; /* outdoors the walk's solid test carries the body's 0.3 already */
  let d=0,wall=false;
  for(let s=.1;s<=len+1e-9;s+=.1){const X=x+ux*(s+pad),Z=z+uz*(s+pad);
    if(laidSolidPt(X,Z,y0+.5)||laidBlocks(x+ux*s,z+uz*s,y0)||(!ow&&laidSurf(X,Z,y0+STEP_UP+.05)>y0+STEP_UP)){wall=true;break;}
    d=s;}
  if(d<1e-6)return {len:0,x,z,wall};
  const X=x+ux*d,Z=z+uz*d;px=X;pz=Z;
  if(ow){const g=laidGround(X,Z,jumpY,activeTerrainH(X,Z));if(g>jumpY){jumpY=g;velY=0;onGround=true;}else if(jumpY-g>.25){onGround=false;velY=0;}}
  return {len:+d.toFixed(2),x:X,z:Z,wall};}
// S1605 — Éan worn (magic-build.md, "Movement against the step table"): a jump leaves the ground at 8.4 m/s, not the legs' 5.5–6.6, so
// it tops out 1.96 m up and crosses 4.4 m at the 4.7 m/s air cap: the step table's 4.0–4.8 band. Its shape is the same at every tier;
// the tier sets only its time (20/40/80 s). At Mastery it is Wingless, the canon's: no fall hurts while it is worn.
let _eanTier=0;
function eanRise(){return fxOn('leap')?WORD_BY.ean.forms.worn.rise:0;}
function eanWingless(){return fxOn('leap')&&_eanTier>=3;}
const ELEMENTAL_PRICE=[[120,320,700],[120,320,700]]; // tier prices for the seven originals
function applySpellBuff(sp,tier){
  const b=sp.buff;const dur=b.dur[Math.max(0,tier-1)]*_buffMult('spellDuration',1);SPELL_FX[b.key]=performance.now()+dur*1000;
  if(b.key==='leap')_eanTier=tier; /* S1605 — Éan's Wingless at Mastery */
  if(b.key==='shield'){if(typeof _applyBuff==='function')_applyBuff({type:'warding',mult:tier>=3?.5:tier===2?.6:.7,duration:dur,label:'Shield',col:'#c0b090'});}
  if(b.key==='light'){if(!_spellLight){_spellLight=new THREE.PointLight(0xfff0c0,0,18);CAM.add(_spellLight);_spellLight.position.set(0,.4,-.6);}_spellLight.intensity=1.4+tier*.3;}
  showMsg(`${sp.ico} ${sp.nameEn} — ${Math.round(dur)}s`,'#c0e0ff');
}
function tickSpellFx(dt){
  if(HELD)heldTick(dt); /* S1601 — the held form */
  if(RIDDEN.size)riderTick(); /* S1602 — the riders' burns and glows */
  if(TOUCH_PEND)touchTick(); /* S1603 — the touched form's landing */
  if(LAID&&LAID.rideR)laidRiderTick(); /* S1604 — a rider on a laid thing */
  if(LAID&&LAID.snare&&!LAID.rooted)laidSnareTick(); /* S1612 — Fréamh laid */
  if(LAID&&LAID.fire)laidFireTick(); /* S1617 — Loscadh laid */
  if(_spellLight&&!fxOn('light')&&_spellLight.intensity>0)_spellLight.intensity=Math.max(0,_spellLight.intensity-dt*2);
}
// spellbooks: read to learn
function spellbookItem(spellId,tier){const sp=spellOrWord(spellId);return {name:`Spellbook: ${sp.nameEn}`,ico:'📕',type:'spellbook',spellId,tier:tier||1,weight:.8,sellMult:.5,buyPrice:sp.price?sp.price[(tier||1)-1]:300,qty:1};}
// S1587 — a book is an institutional copy (canon §7, magic-build.md): it deepens its word to Comprehension if you hold the word, and does
// nothing if you don't. It never teaches a word, and it is kept until it gives something.
function readSpellbook(i){
  const it=BAG[i];const sp=spellOrWord(it.spellId);if(!sp)return;
  const cur=knownWords[sp.id]||0;
  if(!cur){showMsg(`A copy of ${sp.nameIr}. Without the word from its stone, the pages are only ink.`,'#c8a84a');return;}
  if(cur>=WORD_JOIN_TIER){showMsg('You already understand this book.','#aaa');return;}
  const r=deepenWord(sp.id,'book');if(r==='int'){showMsg(`The pages swim before your eyes. (Intelligence ${sp.intReqs[1]} needed)`,'#c8a84a');return;}
  if(r==='noop')return;
  it.qty=(it.qty||1)-1;if(it.qty<=0)BAG.splice(i,1);if(typeof renderInv==='function')renderInv();
}
// guild vendors: what a Mages' Guild can teach you right now
// S1587 — magic B's guild (magic-build.md, "Where the words are"): the Mages' Guild teaches the five forms by rank and never a word.
// Sent and Worn are a Novice's (anyone's), Touched an Adept's, Laid an Evoker's, Held a Warlock's; forms are free at rank, so gold
// never buys ahead, and a form a migrated character already used is kept (`formsGranted`). Spell sales end. At Adept and above the
// tutor deepens a word you hold at Impression to Comprehension in two hours on the clock, free, if your Intelligence meets the word's
// Comprehension need; never past it (Mastery is the stone's alone, canon §7).
const TUTOR_MIN=120;
function mageRank(){const G=worldState.guild,m=G&&G.guild_m;return Math.min(4,Math.floor(((m&&m.done)||0)/3));}
function formHeld(f,rankIdx){const F=FORMS[f];if(!F)return false;return F.rank<=(rankIdx!=null?rankIdx:mageRank())||formsGranted.includes(f);}
function formsHeld(rankIdx){return FORM_ORDER.filter(f=>formHeld(f,rankIdx));}
// the named action (co-op rules): a word you hold deepened, by the tutor or a book, to Comprehension at most
function deepenWord(id,source){const w=spellOrWord(id),cur=knownWords[id]||0;if(!w||!cur||cur>=WORD_JOIN_TIER)return 'noop';
  if(ATTRS.intelligence<w.intReqs[1])return 'int';if(source==='tutor')advanceClock(TUTOR_MIN);return learnSpell(id,WORD_JOIN_TIER);}
function spellShopTopics(rankIdx){
  const out=[],held=formsHeld(rankIdx).map(f=>FORMS[f].name),next=FORM_ORDER.find(f=>!formHeld(f,rankIdx));
  out.push({label:'What forms will you teach me?',response:`At your rank: ${held.join(', ')}.`+(next?` ${FORMS[next].name} comes at ${['Novice','Adept','Evoker','Warlock'][FORMS[next].rank]}.`:'')});
  if(rankIdx<1)return out;
  for(const id of Object.keys(knownWords)){if(knownWords[id]!==1)continue;const w=spellOrWord(id);if(!w)continue;
    out.push({label:`Study ${w.nameIr} with the tutor (two hours)`,quest:true,fn:()=>{const r=deepenWord(id,'tutor');
      if(r==='int')return `You'd not hold it yet. Intelligence ${w.intReqs[1]}, then come back.`;
      return r==='noop'?'There is nothing more the tutor can give you there.':`${w.nameIr}, ${w.nameEn}. Say it slowly the first few times.`;}});}
  return out;
}

function learnSpell(spellId, targetTier=1){
  const sp=spellOrWord(spellId);
  if(!sp)return 'noop';
  const prevTier=knownWords[spellId]||0;
  if(targetTier<=prevTier)return 'noop';
  knownWords[spellId]=targetTier;
  partialSpells=partialSpells.filter(p=>p!==spellId);
  // First spell learned → auto-equip as active
  if(!activeSpellId&&SPELLS.some(s=>s.id===spellId))activeSpellId=spellId; /* S1586 — only a word the cast can speak yet */
  if(prevTier===0)bookAdd(spellId); /* S1574 — a new word goes into the book in its first Novice form */
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
  const unknown=SPELLS.filter(s=>!knownWords[s.id]);
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

// S1570 — magic B's tables (magic-build.md, Michael's B of 29 Sep; the deep-work card's first slice): the 24 words, the five forms
// and the six riders, and what a spell costs. A spell is one form of one word, and at most one rider from a second word. Nothing casts
// from these yet: SPELLS and BUFF_SPELLS still run the cast until it reads the book (the sheet's session 1). Since S1574 what you know is `knownWords`.
// The sixteen spells keep their ids, Intelligence needs and costs; three take their head word's name (Uisce, Oíche, Súil); eight are new.
// A word's `forms` holds its live cells (42 of 120): the sheet's numbers, metres and seconds, and `say`, the sheet's words for the cell.
const WORDS=[
  {id:'caor',school:'tine',nameIr:'Caor',nameEn:'Fireball',nameMa:'Living Ember',ico:'🔥',intReqs:[3,15,35],cost:30,
   forms:{sent:{bolt:20},touched:{dmg:30,say:'lights a brazier, burns a web'},held:{say:'flame'}}},
  {id:'loscadh',school:'tine',nameIr:'Loscadh',nameEn:'Scorch',nameMa:null,ico:'🌋',intReqs:[10,22,40],cost:34,
   forms:{touched:{say:'fires dry brush'},laid:{fire:4,dps:6,dur:10}}},
  {id:'tintreach',school:'tine',nameIr:'Tintreach',nameEn:'Chain Lightning',nameMa:null,ico:'⚡',intReqs:[12,25,45],cost:36,
   forms:{sent:{bolt:24,leap:5,leapMult:.5},touched:{dmg:36,stagger:true}}},
  {id:'sioc',school:'uisce',nameIr:'Sioc',nameEn:'Frost Bolt',nameMa:"Still-Winter's Touch",ico:'❄️',intReqs:[3,15,35],cost:20,
   forms:{sent:{bolt:12,slow:.3,slowDur:3},touched:{say:'freezes a pool, a lock’s works'},laid:{floe:3,dur:30,say:'a floe on water'},held:{say:'frost'}}},
  {id:'siul_uisce',school:'uisce',nameIr:'Uisce',nameEn:'Water Walking',nameMa:'The Dry Path',ico:'🌊',intReqs:[6,14,28],cost:22,
   forms:{worn:{buff:'waterwalk',dur:[45,90,180]},touched:{say:'douses a fire'}}},
  {id:'anail',school:'uisce',nameIr:'Anáil',nameEn:'Water Breathing',nameMa:'Gills of the Deep',ico:'🫧',intReqs:[6,14,28],cost:20,
   forms:{worn:{buff:'waterbreath',dur:[60,120,240]}}},
  {id:'tonn',school:'uisce',nameIr:'Tonn',nameEn:'Force Wave',nameMa:null,ico:'〰️',intReqs:[10,22,40],cost:32,
   forms:{sent:{wave:8,dmg:14,posture:20},laid:{wave:6.2,dur:2}}},
  {id:'reo',school:'uisce',nameIr:'Reo',nameEn:'Frost Nova',nameMa:null,ico:'🧊',intReqs:[12,25,45],cost:34,
   forms:{touched:{hold:2},laid:{radius:4,hold:2}}},
  {id:'sideen',school:'gaoth',nameIr:'Séideán',nameEn:'Wind Shear',nameMa:'Breath-Between-Words',ico:'🌬️',intReqs:[3,15,35],cost:22,
   forms:{sent:{bolt:14,knock:1.5},laid:{updraft:1.5,dur:15},held:{say:'a gale'}}},
  {id:'cleite',school:'gaoth',nameIr:'Cleite',nameEn:'Feather',nameMa:'Weightless Step',ico:'🪶',intReqs:[1,8,20],cost:16,
   forms:{worn:{buff:'feather',dur:[90,180,360]}}},
  {id:'luas',school:'gaoth',nameIr:'Luas',nameEn:'Haste',nameMa:'Wind at the Heel',ico:'💨',intReqs:[6,14,28],cost:24,
   forms:{worn:{buff:'haste',mult:1.5,dur:[30,60,120]}}},
  {id:'eitilt',school:'gaoth',nameIr:'Eitilt',nameEn:'Levitate',nameMa:'The Unbound Foot',ico:'🕊',intReqs:[12,20,34],cost:34,
   forms:{worn:{buff:'levitate',dur:[25,50,100]}}},
  {id:'ean',school:'gaoth',nameIr:'Éan',nameEn:'Leap',nameMa:null,ico:'🦅',intReqs:[8,18,32],cost:26,
   forms:{worn:{rise:8.4,dur:[20,40,80]}}},
  {id:'cloch_ghear',school:'cloch',nameIr:'Cloch Ghéar',nameEn:'Stone Spike',nameMa:"Earth's-Teeth",ico:'🪨',intReqs:[3,15,35],cost:28,
   forms:{sent:{bolt:22},laid:{pillar:1.2,across:1,dur:20}}},
  {id:'sciath',school:'cloch',nameIr:'Sciath',nameEn:'Shield',nameMa:'Stone Skin',ico:'🛡',intReqs:[10,18,32],cost:28,
   forms:{worn:{buff:'shield',dur:[40,80,150]}}},
  {id:'freamh',school:'cloch',nameIr:'Fréamh',nameEn:'Root',nameMa:null,ico:'🌿',intReqs:[10,22,40],cost:30,
   forms:{sent:{root:2},laid:{radius:3,root:2,dur:10}}},
  {id:'smol',school:'scath',nameIr:'Smól',nameEn:'Shade Bolt',nameMa:'The Quiet-Sent-Out',ico:'🌑',intReqs:[3,15,35],cost:26,
   forms:{sent:{bolt:16,silent:true}}},
  {id:'suil_oiche',school:'scath',nameIr:'Oíche',nameEn:'Night Eye',nameMa:"The Owl's Gift",ico:'🦉',intReqs:[10,18,32],cost:18,
   forms:{worn:{buff:'nighteye',dur:[120,240,480]}}},
  {id:'dorcha',school:'scath',nameIr:'Dorcha',nameEn:'Blind',nameMa:null,ico:'🌘',intReqs:[10,22,40],cost:28,
   forms:{sent:{blind:4},laid:{dark:6,dur:15}}},
  {id:'dul_thart',school:'scath',nameIr:'Dul Thart',nameEn:'Phase',nameMa:null,ico:'👣',intReqs:[14,28,48],cost:40,
   forms:{sent:{step:12},worn:{phase:.6}}},
  {id:'solas_gheal',school:'solas',nameIr:'Solas-Gheal',nameEn:'Radiant Bolt',nameMa:"Morning's-First-Word",ico:'✨',intReqs:[3,15,35],cost:28,
   forms:{sent:{bolt:18},laid:{light:8,dur:60}}},
  {id:'leigheas',school:'solas',nameIr:'Leigheas',nameEn:'Healing Light',nameMa:'Hand-of-the-Stream',ico:'💚',intReqs:[8,25,50],cost:40,
   forms:{worn:{heal:35},touched:{say:'heals another'}}},
  {id:'lampa',school:'solas',nameIr:'Lampa',nameEn:'Light',nameMa:'Lantern of the Mind',ico:'💡',intReqs:[1,8,20],cost:12,
   forms:{worn:{buff:'light',dur:[120,240,480]}}},
  {id:'suil_fiodora',school:'solas',nameIr:'Súil',nameEn:"Weaver's Eye",nameMa:'The Loom Seen',ico:'🧵',intReqs:[8,16,30],cost:14,
   forms:{worn:{buff:'seamsight',dur:[60,120,240]}}},
];
const WORD_BY=Object.fromEntries(WORDS.map(w=>[w.id,w]));
// the five forms: the guild's rank that teaches each (0 Novice, 1 Adept, 2 Evoker, 3 Warlock), its reach in metres, its power and mana
// multipliers. Held's power is ×0.25 a tick of 0.25 s and its mana ×0.5 a second; Laid is one thing a caster, a second ends the first.
const FORMS={
  sent:   {name:'Sent',   rank:0,reach:30, power:1,  mana:1,  windup:.35,windupWalk:.35,recover:.30},
  worn:   {name:'Worn',   rank:0,reach:0,  power:1,  mana:1},
  touched:{name:'Touched',rank:1,reach:1.6,cone:60,power:1.5,mana:.6,windup:.25},
  laid:   {name:'Laid',   rank:2,reach:12, power:1,  mana:1.5,one:true},
  held:   {name:'Held',   rank:3,reach:4,  cone:60,power:.25,tick:.25,mana:.5,perSec:true,walk:.5},
};
const FORM_ORDER=['sent','worn','touched','laid','held'];
// the six riders: a second word adds only this. `hit` on what a Sent, Touched or Held spell strikes; `laid` on a laid thing.
const RIDERS={
  caor:       {verb:'burns', hit:{dps:3,dur:4},          laid:{hot:3}},
  sioc:       {verb:'slows', hit:{slow:.3,dur:3},        laid:{freeze:true,bridge:{len:6.2,wide:1.6,dur:20},floeMult:2}},
  sideen:     {verb:'pushes',hit:{knock:1.5,posture:10}, laid:{throws:true}},
  freamh:     {verb:'holds', hit:{root:.8},              laid:{root:1}},
  solas_gheal:{verb:'lights',hit:{glow:10},              laid:{light:8}},
  leigheas:   {verb:'mends', hit:{lifesteal:.25},        laid:{hps:2}},
};
const WORD_JOIN_MULT=1.25,WORD_JOIN_TIER=2,WORD_MIXED_WILD=.10,WORD_MIXED_SKILL=25;
function wordLive(id,form){const w=WORD_BY[id];return !!(w&&w.forms[form]);}
// may `rider` join `id` in `form`? Both words at Comprehension, the rider one of the six and not the word itself, and never on Worn
function wordJoin(id,form,rider,tierW,tierR){
  if(!wordLive(id,form))return {ok:false,why:'form'};
  if(!rider)return {ok:true};
  if(!RIDERS[rider]||rider===id||form==='worn')return {ok:false,why:'rider',say:'The words won’t join.'};
  if((tierW||0)<WORD_JOIN_TIER||(tierR||0)<WORD_JOIN_TIER)return {ok:false,why:'tier',say:'The words won’t join.'};
  return {ok:true};}
// the tier a word is held at, the great gates' loan included
function wordTierOf(id){return typeof effTier==='function'?effTier(id):(knownWords[id]||0);}
// the mana a spell takes: (word + rider) at their tiers, ×1.25 when joined, × the form, × the first word's school (×1.4 − 0.8 s),
// rounded once at the end. Held is a second's worth. Worked (school 50): Caor sent 30, Cloch laid 42, Caor held 15 a second,
// Sioc with Tonn laid 98, 59 at Uisce 100, 41 with both at Mastery.
function wordCost(id,form,rider,o){o=o||{};const w=WORD_BY[id];if(!w||!FORMS[form])return 0;
  const tw=o.tier||wordTierOf(id)||1,tr=rider?(o.riderTier||wordTierOf(rider)||1):0;
  let m=w.cost*TIER_MULT.cost[tw-1];
  if(rider&&WORD_BY[rider])m=(m+WORD_BY[rider].cost*TIER_MULT.cost[tr-1])*WORD_JOIN_MULT;
  const s=o.skill!=null?o.skill:skillLv(w.school);
  m*=FORMS[form].mana*(1.4-.8*s/100)*(o.buff!=null?o.buff:(typeof _buffMult==='function'?_buffMult('spellCost',1):1));
  if(o.thrift!=null?o.thrift:perk(w.school,50))m*=THRIFT_MULT; /* S1619 — Thrift, the school at 50 */
  return Math.round(m+1e-9);}

// S1574 — magic B's book (magic-build.md, "The save"): up to eight made spells {form, word, rider}; `activeSpell` is the index of the one F
// casts, kept in step with `activeSpellId` until the cast reads the book; `formsGranted` holds the forms a migrated character already
// used, whatever the guild's rank. All three are top-level fields of the character row, as `knownWords` is.
const SPELL_BOOK_MAX=8;
let spellBook=[],activeSpell=-1,formsGranted=[];
// a lone word's first Novice form: Sent where it has one (the bolts), else Worn (the buffs, and Leigheas's heal)
function bookFormFor(id){const w=WORD_BY[id];return !w?null:w.forms.sent?'sent':w.forms.worn?'worn':null;}
function bookAdd(id){const f=bookFormFor(id);if(!f)return -1;let i=spellBook.findIndex(b=>b.word===id&&b.form===f&&!b.rider);
  if(i<0){if(spellBook.length>=SPELL_BOOK_MAX)return -1;spellBook.push({form:f,word:id,rider:null});i=spellBook.length-1;}return i;}
// S1590 — an entry chosen by bookSelect (a laid one) stays chosen while F's word is still its word; S1602 — and a joined one
function bookSync(){const c=spellBook[activeSpell];if(c&&activeSpellId&&c.word===activeSpellId&&(c.form!==bookFormFor(c.word)||c.rider))return activeSpell;
  /* S1606 — the word's own first form before any other bare entry of it (a touched Tintreach made first no longer takes its Sent's F) */
  if(!activeSpellId){activeSpell=-1;return activeSpell;}
  const f0=bookFormFor(activeSpellId),i0=spellBook.findIndex(b=>b.word===activeSpellId&&!b.rider&&b.form===f0);
  activeSpell=i0>=0?i0:spellBook.findIndex(b=>b.word===activeSpellId&&!b.rider);return activeSpell;}
function spellBookLoad(d){spellBook.length=0;formsGranted.length=0;
  if(Array.isArray(d.spellBook)){
    for(const b of d.spellBook){if(spellBook.length>=SPELL_BOOK_MAX)break;if(!b||!knownWords[b.word]||!wordLive(b.word,b.form))continue;
      spellBook.push({form:b.form,word:b.word,rider:RIDERS[b.rider]&&knownWords[b.rider]?b.rider:null});}
    if(Array.isArray(d.formsGranted))for(const f of d.formsGranted)if(FORMS[f]&&!formsGranted.includes(f))formsGranted.push(f);
  }else{
    // once, a save from before the words: every spell known goes in as its word, the bolts Sent and the rest Worn, the one F cast
    // first, then the table's order, bolts before the rest, to the book's eight; Sent and Worn are granted whatever the rank
    const ids=Object.keys(knownWords);if(ids.length)formsGranted.push('sent','worn');
    const order=[activeSpellId,...WORDS.filter(w=>w.forms.sent).map(w=>w.id),...WORDS.filter(w=>!w.forms.sent).map(w=>w.id)];
    for(const id of order)if(id&&knownWords[id])bookAdd(id);
  }
  bookSync();}

// S1590 — magic B's session 3 (magic-build.md, "The five forms" and "Movement against the step table"): the Laid form's things as
// solids, in the world, the gates and the rooms. A laid spell puts one thing at a walkable point under the crosshair within 12 m:
// Cloch Ghéar's pillar (1.2 m high, 1.0 across, 20 s, mantled onto), Séideán's updraft (1.5 m wide, 15 s: a jump in it tops out
// 2.2 m over where you stood, no forward push), Sioc's floe (3 m across on open water, 30 s) and, with Sioc's rider, Tonn's wave
// frozen as a bridge (6.2 × 1.6 m, 20 s) from the point along your facing. One laid thing a caster: a second ends the first. It
// lives by the play clock, at most 60 s, ends when you leave the place, and is never saved. A pillar or an updraft is refused under
// 0.5 m from a solid or a door, or on a body. The loop reads LAID through laidGround (what you stand on) and laidBlocks (what you
// walk into); the mantle (10-player.js) takes a laid top as a ledge outdoors too. The other laid words (Loscadh's fire (S1617), Reo (S1616), Fréamh (S1612),
// Dorcha, Solas, Tonn alone) are the sheet's session 4. Named actions (the co-op rules): bookMake, layWord, laidEnd.
const LAID_REACH=12,LAID_CLEAR=.5,LAID_MAX_S=60,LAID_UPDRAFT_APEX=2.2,LAID_OVERSHOOT=1.5,LAID_WILD=['fizzle','overshoot'];
let LAID=null,_onLaid=false; /* the one laid thing: {kind,word,rider,x,z,r|hw,hl,ux,uz,base,top,solid,until,key,mesh} */
// the place a laid thing belongs to: leaving it ends the thing (the fall's own key: the zone, the dungeon, the room)
function laidKey(){return typeof fallKey==='function'?fallKey():String(activeZoneId);}
function laidInside(L,x,z,pad){pad=pad||0;
  if(L.r!=null)return Math.hypot(x-L.x,z-L.z)<L.r+pad;
  const dx=x-L.x,dz=z-L.z,a=dx*L.ux+dz*L.uz,b=-dx*L.uz+dz*L.ux;return a>-pad&&a<L.hl*2+pad&&Math.abs(b)<L.hw+pad;}
function laidLive(){if(LAID&&(playClockS>=LAID.until||LAID.key!==laidKey()))laidEnd();return LAID;}
// the ground at x,z for feet at py: base, or a laid top within a step of the feet
function laidGround(x,z,py,base){const L=laidLive();if(!L||!L.solid||!laidInside(L,x,z))return base;return L.top<=py+STEP_UP&&L.top>base?L.top:base;}
// a body 0.3 round at x,z with its feet at y runs into the laid thing's side: under its top by more than a step, the head over its foot
function laidBlocks(x,z,y){const L=laidLive();if(!L||!L.solid)return false;if(y>L.top-STEP_UP||y+HEAD_H<=L.base)return false;return laidInside(L,x,z,.3);}
// in an updraft's column: a jump from inside it rises to LAID_UPDRAFT_APEX over the ground it left
function laidUpdraft(x,z){const L=laidLive();return !!(L&&L.kind==='updraft'&&laidInside(L,x,z));}
function laidUpdraftV(){return Math.sqrt(2*18*LAID_UPDRAFT_APEX);} /* the loop's GRAVITY, 18 */
function laidEnd(){if(!LAID)return;const m=LAID.mesh;if(m&&m.parent)m.parent.remove(m);if(m)m.traverse(o=>{if(o.geometry)o.geometry.dispose();});LAID=null;}
// the walkable top at x,z no higher than cap, as the loop reads the ground: outdoors the terrain or a platform (and the sea's face for
// laying on water); in a gate or a room the floor or a foothold
function laidSurf(x,z,cap){
  if(isOverworldZone()&&!isInterior()){let h=activeTerrainH(x,z);
    if(activeZoneId==='world'&&typeof worldH==='function'&&typeof SEA_Y!=='undefined'&&worldH(x,z)<SEA_Y)h=Math.max(h,SEA_Y);return h;}
  return mantleSurf(x,z,cap);}
// a solid at a point, as the walk meets it (outdoors solidAt's own 0.3 is in it)
function laidSolidPt(x,z,y){
  if(isInterior()){const h=currentHouse;if(h&&h._roomW&&(x<0||x>h._roomW||z<0||z>(h._roomD||1e9)))return true;return intSolidAt(x,z,0,y);}
  if(lid&&lid.startsWith('dyn_'))return !dAirAt(x,z)&&dSolid(x,z);
  return currentZoneSolid(x,z);}
function laidDoorNear(x,z,r){
  if(isInterior())return (INT_DOORS||[]).some(d=>Math.hypot(d.x-x,d.z-z)<r+(d.w||1)/2);
  if(lid&&lid.startsWith('dyn_')){const m=activeMap();if(!m)return false;
    for(let a=0;a<16;a++)for(const rr of [0,r*.5,r]){const c=dCellOf(x+Math.cos(a*Math.PI/8)*rr),w=dCellOf(z+Math.sin(a*Math.PI/8)*rr);const v=m[w]&&m[w][c];if(v===4||v===5)return true;}}
  return false;}
// room for a pillar or an updraft r round at x,z, feet at y: no solid or door within LAID_CLEAR of its edge, no body on it
function laidClear(x,z,r,y,o){o=o||{};const R=r+LAID_CLEAR,ow=!isInterior()&&!(lid&&lid.startsWith('dyn_')),rr=ow?Math.max(0,R-.3):R;
  for(let a=0;a<24;a++)for(const f of [0,.35,.7,1]){const d=rr*f;if(!d&&a)continue;if(laidSolidPt(x+Math.cos(a*Math.PI/12)*d,z+Math.sin(a*Math.PI/12)*d,y))return 'solid';}
  if(laidDoorNear(x,z,R))return 'door';
  if(!o.self&&Math.hypot(px-x,pz-z)<r+.3)return 'body'; /* S1604 — a throwing pillar may rise under you */
  for(const e of (typeof ENEMIES!=='undefined'?ENEMIES:[]))if(!e.dead&&e.mesh&&Math.hypot(e.mesh.position.x-x,e.mesh.position.z-z)<r+.4)return 'body';
  return null;}
// the point under the crosshair: the camera's ray marched to the first walkable top, or null at a wall or past the reach
function laidAimPoint(){
  if(typeof CAM==='undefined'||!CAM)return null;const o=CAM.position,d=CAM.getWorldDirection(new THREE.Vector3());
  for(let s=.1;s<=LAID_REACH*1.6;s+=.05){const x=o.x+d.x*s,y=o.y+d.y*s,z=o.z+d.z*s;
    if(Math.hypot(x-px,z-pz)>LAID_REACH+.5)return {x,z,y,far:true};
    const g=laidSurf(x,z,y);if(y<=g+.01)return {x,z,y:g};
    if(laidSolidPt(x,z,y))return null;}
  return null;}
// the made spells the book may hold: a word you hold, a form the guild has given you, a rider that joins it. Returns its index.
function bookMake(form,word,rider){rider=rider||null;
  if(!knownWords[word]||!wordLive(word,form))return {say:'You cannot shape that word so.'};
  if(!formHeld(form))return {say:`The ${FORMS[form].name} form is not yet yours.`};
  const j=wordJoin(word,form,rider,wordTierOf(word),rider?wordTierOf(rider):0);if(!j.ok)return {say:j.say||'You cannot shape that word so.'};
  let i=spellBook.findIndex(b=>b.form===form&&b.word===word&&(b.rider||null)===rider);
  if(i<0){if(spellBook.length>=SPELL_BOOK_MAX)return {say:'Your book holds eight.'};spellBook.push({form,word,rider});i=spellBook.length-1;}
  return {i};}
function bookSelect(i){const b=spellBook[i];if(!b)return false;activeSpell=i;activeSpellId=b.word;return true;}
// the shape a laid entry makes, or null where it makes none yet (the sheet's session 4)
function laidShape(word,rider){
  if(word==='cloch_ghear')return 'pillar';if(word==='sideen')return 'updraft';
  if(word==='sioc')return 'floe';if(word==='tonn'&&rider==='sioc')return 'bridge';if(word==='freamh')return 'snare';if(word==='reo')return 'nova';if(word==='loscadh')return 'fire';return null;}
// layWord: the named action. Lays word (with rider) at x,z (its ground found there), facing yaw for a bridge; o.overshoot ×1.5 a
// pillar's height. Returns {ok} or {say}; nothing is paid here (the cast pays).
function layWord(word,rider,x,z,o){o=o||{};
  const kind=laidShape(word,rider);if(!kind)return {say:'That word lays nothing yet.'};
  if(Math.hypot(x-px,z-pz)>LAID_REACH+1e-6)return {say:'Too far to lay it.',why:'far'};
  const cap=o.cap!=null?o.cap:jumpY+1,y=laidSurf(x,z,cap),w=WORD_BY[word],F=w.forms.laid;
  const ow=activeZoneId==='world'&&!isInterior()&&!(lid&&lid.startsWith('dyn_'));
  const wet=ow&&typeof worldH==='function'&&worldH(x,z)<(typeof SEA_Y!=='undefined'?SEA_Y-.35:-1e9)&&activeTerrainH(x,z)<SEA_Y; /* open water: no quay or deck over it */
  let L={kind,word,rider:rider||null,x,z,key:laidKey()};
  if(kind==='pillar'||kind==='updraft'){
    const r=kind==='pillar'?F.across/2:F.updraft/2,throws=kind==='pillar'&&rider==='sideen',why=laidClear(x,z,r,y,{self:throws});
    if(why)return {say:why==='body'?'There is no room to lay it there.':'Too near the wall to lay it.',why};
    if(ow&&worldH(x,z)<SEA_Y-.35)return {say:'It will not stand in water.',why:'wet'};
    const h=kind==='pillar'?F.pillar*(o.overshoot?LAID_OVERSHOOT:1):0;
    Object.assign(L,{r,base:y,top:y+h,solid:kind==='pillar',dur:F.dur});}
  else if(kind==='snare'){ /* S1612 — Fréamh's: a ring on the ground, never a solid */
    if(ow&&worldH(x,z)<SEA_Y-.35)return {say:'It will not take root in water.',why:'wet'};
    const tier=wordTierOf(word)||1;
    Object.assign(L,{r:F.radius,base:y,top:y,solid:false,dur:F.dur,snare:+(F.root*TIER_MULT.magnitude[tier-1]).toFixed(2)});}
  else if(kind==='nova'){ /* S1616 — Reo's: a burst 4 m round on the ground, never a solid; its frost stands while the foes are held */
    const tier=wordTierOf(word)||1,hold=+(F.hold*TIER_MULT.magnitude[tier-1]).toFixed(2);
    Object.assign(L,{r:F.radius,base:y,top:y,solid:false,dur:hold,nova:hold});}
  else if(kind==='fire'){ /* S1617 — Loscadh's: ground fire 4 m across, never a solid, burning each foe in it every second */
    if(ow&&worldH(x,z)<SEA_Y-.35)return {say:'Fire will not take on water.',why:'wet'};
    const tier=wordTierOf(word)||1;
    Object.assign(L,{r:F.fire/2,base:y,top:y,solid:false,dur:F.dur,fire:Math.round(F.dps*TIER_MULT.magnitude[tier-1]),fireNext:playClockS+1});}
  else if(kind==='floe'){
    if(!wet)return {say:'Sioc lays a floe only on open water.',why:'dry'};
    Object.assign(L,{r:F.floe/2,base:SEA_Y-.4,top:SEA_Y+.1,solid:true,dur:F.dur});}
  else{ /* the bridge: from the point along your facing, level with it, as far as its length or the first wall */
    const B=RIDERS.sioc.laid.bridge,yw=o.yaw!=null?o.yaw:yaw,ux=-Math.sin(yw),uz=-Math.cos(yw);let len=B.len;
    for(let s=.1;s<=B.len;s+=.1)if(laidSolidPt(x+ux*s,z+uz*s,y+.2)){len=s-.1;break;}
    if(len<1)return {say:'Too near the wall to lay it.',why:'solid'};
    Object.assign(L,{hw:B.wide/2,hl:len/2,ux,uz,base:y-.35,top:y,solid:true,dur:B.dur});}
  laidEnd();
  L.until=playClockS+Math.min(LAID_MAX_S,L.dur);L.mesh=laidMesh(L);LAID=L;
  if(rider&&RIDERS[rider])laidRiderStart(L,rider);
  if(L.nova)L.held=laidNovaBurst(L);
  return {ok:true,kind,thrown:!!L.thrown,held:L.held||0};}
// S1604 — magic B's session 4, part 4 (magic-build.md, "Joining and riders", the laid column): a rider on a laid thing. Caor makes it
// hot (3 a second, past the armour, to a foe touching it: its centre within its own hull of the thing); Séideán makes a Cloch pillar
// throw you as Éan does (it may rise under you, and you leave its top at Éan's 8.4 m/s, 1.96 m over it); Fréamh roots the first foe
// across it 1 s, once; Leigheas heals you 2 a second while you stand in it or on it; Solas gives it a light 8 m round for its time
// (`laidLight`, for the look builder to draw: no lamp is lit). Sioc's freeze is the bridge (S1590); a floe is Sioc itself, so the rider
// can never double one. Each second is the play clock's; it ends with the thing. Read each frame by laidRiderTick.
const LAID_THROW_RISE=8.4; /* Éan's worn rise (WORD_BY.ean.forms.worn.rise) */
function laidRiderStart(L,rider){const R=RIDERS[rider].laid;L.rideR=rider;L.next=playClockS+1;
  if(R.light)L.light=R.light;
  if(R.throws&&L.kind==='pillar'&&laidInside(L,px,pz,.3)){jumpY=Math.max(jumpY,L.top);velY=LAID_THROW_RISE;onGround=false;_jumpFrom=L.base;L.thrown=true;}}
function laidLight(){const L=laidLive();return L&&L.light?{x:L.x,z:L.z,r:L.light}:null;}
function laidRiderTick(){const L=laidLive();if(!L||!L.rideR)return;const R=RIDERS[L.rideR].laid,dun=!!(lid&&lid.startsWith('dyn_'));
  if(R.root&&!L.rooted)for(const e of heldTargets()){if(e.dead||(dun&&e.floor!==currentFloor)||!laidInside(L,e.x,e.z,hullOf(e)))continue;
    e._rootUntil=Math.max(e._rootUntil||0,playClockS+R.root);L.rooted=true;e.alert=true;break;}
  for(let n=0;n<8&&playClockS>=L.next-1e-9&&LAID===L;n++){L.next+=1;
    if(R.hot)for(const e of heldTargets()){if(e.dead||(dun&&e.floor!==currentFloor)||!laidInside(L,e.x,e.z,hullOf(e)))continue;
      const d=challengeDealt(R.hot);e.hp=Math.max(0,e.hp-d);e.alert=true;
      if(e.hpFg&&e.maxHp){e.hpFg.scale.x=e.hp/e.maxHp;e.hpFg.position.x=(e.hp/e.maxHp-1)*.275;}dmgNum(e,d,{});
      if(e.hp<=0){if(dun)killE(e,' (burned)');else killZoneEnemy(e,scene,' (burned)');}}
    if(R.hps&&laidInside(L,px,pz,.3)&&jumpY<=L.top+STEP_UP){PHP=Math.min(effMaxHP(),PHP+R.hps);}}}
// S1612 — Fréamh laid (magic-build.md's table: "roots once within 3 m, 10 s"): a ring 3 m round the point, on the ground, never a solid.
// The first foe whose centre comes within it (its hull counted) is rooted 2 s at Comprehension, the tier's magnitude as the bolt's (1.2 s,
// 2.6 s), and the ring has done its work: it roots once, and stands out its 10 s. A foe already inside when it is laid is the first. It
// lives as every laid thing does (one a caster, ends when you leave the place) and takes a rider as they do (a hot ring, a mending one).
function laidSnareTick(){const L=laidLive();if(!L||!L.snare||L.rooted)return;const dun=!!(lid&&lid.startsWith('dyn_'));
  for(const e of heldTargets()){if(e.dead||e.hp<=0||(dun&&e.floor!==currentFloor)||!laidInside(L,e.x,e.z,hullOf(e)))continue;
    e._rootUntil=Math.max(e._rootUntil||0,playClockS+L.snare);L.rooted=e;e.alert=true;
    if(SKILL_DEF[WORD_BY[L.word].school])skillUse(WORD_BY[L.word].school,1,e);break;}}
// S1616 — Reo laid (magic-build.md's table: "foes within 4 m held 2 s"): at the moment it is laid, every foe whose centre is within 4 m
// of the point, its hull counted, is held as a touched Reo holds (frozen in the stagger list: no step, no blow), 2 s at Comprehension
// by the tier's magnitude (1.2 s at Impression, 2.6 s at Mastery). The burst is once: a foe that walks in after is not held. Its frost
// stands on the ground as a laid thing for the hold's time, so it ends your other laid thing as any second one does. One use of Uisce
// if it held anyone. Returns how many it held.
function laidNovaBurst(L){const dun=!!(lid&&lid.startsWith('dyn_'));let n=0,first=null;
  for(const e of heldTargets()){if(e.dead||e.hp<=0||(dun&&e.floor!==currentFloor)||!laidInside(L,e.x,e.z,hullOf(e)))continue;
    const q=staggered.find(s=>s.e===e);if(q)q.t=Math.max(q.t,L.nova);else staggered.push({e,t:L.nova});
    staggerFlash(e);e.alert=true;n++;if(!first)first=e;}
  const sc=WORD_BY[L.word].school;if(first&&SKILL_DEF[sc])skillUse(sc,1,first);
  return n;}
// S1617 — Loscadh laid (magic-build.md's table: "ground fire 4 m, 6 a second, 10 s"; the word's `fire:4` is across, as a floe's 3 is):
// a fire 4 m across on the ground, never a solid, that stands 10 s. Each second of the play clock it burns every foe whose centre is
// within it, its hull counted, for 6 at Comprehension by the tier's magnitude (4 at Impression, 8 at Mastery), past the armour as a
// hot pillar burns, the challenge's step applied. It does not burn you. The first foe it burns is one use of Tine.
function laidFireTick(){const L=laidLive();if(!L||!L.fire)return;const dun=!!(lid&&lid.startsWith('dyn_'));
  for(let n=0;n<12&&playClockS>=L.fireNext-1e-9&&LAID===L;n++){L.fireNext+=1;
    for(const e of heldTargets()){if(e.dead||e.hp<=0||(dun&&e.floor!==currentFloor)||!laidInside(L,e.x,e.z,hullOf(e)))continue;
      const d=challengeDealt(L.fire);e.hp=Math.max(0,e.hp-d);e.alert=true;
      if(e.hpFg&&e.maxHp){e.hpFg.scale.x=e.hp/e.maxHp;e.hpFg.position.x=(e.hp/e.maxHp-1)*.275;}dmgNum(e,d,{});
      if(!L.used){const sc=WORD_BY[L.word].school;if(SKILL_DEF[sc])skillUse(sc,1,e);L.used=true;}
      if(e.hp<=0){if(dun)killE(e,' (burned)');else killZoneEnemy(e,scene,' (burned)');}}}}
function laidMesh(L){if(typeof THREE==='undefined'||typeof scene==='undefined'||!scene)return null;
  const d=typeof laidDress==='function'?laidDress(L):null; /* S1600 — the look builder's dress (82-world-structures.js), built from its base */
  if(d){if(L.r!=null)d.position.set(L.x,L.base,L.z);else{d.position.set(L.x+L.ux*L.hl,L.base,L.z+L.uz*L.hl);d.rotation.y=Math.atan2(L.ux,L.uz);}scene.add(d);return d;}
  let geo,col,op=1;
  if(L.kind==='pillar'){geo=new THREE.CylinderGeometry(L.r*.92,L.r,L.top-L.base,10);col=0x8a8378;}
  else if(L.kind==='updraft'){geo=new THREE.CylinderGeometry(L.r,L.r*.8,3,12,1,true);col=0xcfe8ee;op=.18;}
  else if(L.kind==='floe'){geo=new THREE.CylinderGeometry(L.r,L.r*.9,L.top-L.base,12);col=0xdcecf4;}
  else if(L.kind==='snare'){geo=new THREE.RingGeometry(L.r*.92,L.r,32);geo.rotateX(-Math.PI/2);col=0x6a8a3a;op=.6;}
  else if(L.kind==='fire'){geo=new THREE.CircleGeometry(L.r,24);geo.rotateX(-Math.PI/2);col=0xd2601e;op=.5;}
  else if(L.kind==='nova'){geo=new THREE.CircleGeometry(L.r,32);geo.rotateX(-Math.PI/2);col=0xdcecf4;op=.45;}
  else{geo=new THREE.BoxGeometry(L.hw*2,L.top-L.base,L.hl*2);col=0xbcdcec;}
  const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:col,transparent:op<1,opacity:op,depthWrite:op>=1,side:op<1?THREE.DoubleSide:THREE.FrontSide}));
  m.name='laid-'+L.kind;
  if(L.r!=null)m.position.set(L.x,L.kind==='updraft'?L.base+1.5:L.kind==='snare'||L.kind==='nova'||L.kind==='fire'?L.base+.03:(L.base+L.top)/2,L.z);
  else{m.position.set(L.x+L.ux*L.hl,(L.base+L.top)/2,L.z+L.uz*L.hl);m.rotation.y=Math.atan2(L.ux,L.uz);}
  scene.add(m);return m;}
// the cast of a laid entry from the book (castSpell hands it here): the form held, the cost and the overcast, Impression's wild roll
// (a fizzle, or a pillar overshot ×1.5), the crosshair's point, the Cast row's wind-up
function castLaid(bk){
  const w=WORD_BY[bk.word],tier=wordTierOf(bk.word);if(!w||!tier){showMsg('Spell not learned!','#6688cc');return false;}
  if(!formHeld('laid')){showMsg('The Laid form is not yet yours.','#a8a8d4');return false;}
  if(isCasting()||castRecovering())return false;
  if(spCd>0){showMsg('Cooling down...','#6688cc');return false;}
  const at=laidAimPoint();
  if(!at){showMsg('There is nowhere there to lay it.','#a8a8d4');return false;}
  if(at.far){showMsg('Too far to lay it.','#a8a8d4');return false;}
  const cost=wordCost(bk.word,'laid',bk.rider,{tier}),short=Math.max(0,cost-Math.floor(mana)),blood=short*OVERCAST_HP;
  if(short&&PHP-blood<1){showMsg(`Not enough mana! (need ${cost})`,'#6688cc');return false;}
  let wild=null;const wr=tier===1?casterRand(bk.word+':laid'):null;
  if(wr&&wr()<wordWildChance(bk.word)){const pool=laidShape(bk.word,bk.rider)==='pillar'?LAID_WILD:['fizzle'];wild=pool[Math.floor(wr()*pool.length)];}
  const r=wild==='fizzle'?{ok:true}:layWord(bk.word,bk.rider,at.x,at.z,{cap:at.y+.05,overshoot:wild==='overshoot'});
  if(!r.ok){showMsg(r.say,'#a8a8d4');return false;}
  const paid=cost-short;mana=Math.max(0,mana-cost);_offenceS=playClockS;
  if(short){PHP-=blood;PPOST.stagUntil=Math.max(PPOST.stagUntil,performance.now()/1000+OVERCAST_STAGGER_S);blocking=false;powerCharging=false;powerCharge=0;
    lvAct.damageTaken+=blood;updateHUD();showMsg(`Not enough mana: the word takes ${blood} health.`,'#d48a8a');}
  const sp=spellOrWord(bk.word);spCd=spellCooldown(sp,tier);
  if(wild==='fizzle'){mana=Math.min(effMaxMana(),mana+Math.round(paid*.5));showMsg(`${w.ico} ${w.nameIr} fizzles — the shape will not hold.`,'#8a8ac8');startCastAnim(sp,'fizzle');return true;}
  if(wild==='overshoot')showMsg(`${w.ico} ${w.nameIr} overshoots — the stone climbs past the shape.`,'#a8a8d4');
  if(SKILL_DEF[w.school])skillUse(w.school,1,'cast');
  startCastAnim(sp,'self');castMark(WEAPON_ATTACKS.Cast.tell);
  return true;}

// S1601 — magic B's session 4, part 1 (magic-build.md, "The five forms"): the Held form. F on a held entry pours the word out while F is
// down: a cone 4 m from your body (hull to hull, F2b's reach) and 60° about your facing, ×0.25 of the word's power every 0.25 s of the
// play clock (a second of it is one bolt, armour taken ×0.25 a tick too), for the word's cost ×0.5 a second, paid a tick at a time
// (Caor at school 50: 15 a second). You walk at half pace while it runs. It ends when F comes up, the mana for a tick is not there,
// you are staggered, roll or die, a panel opens (its keyup may never reach the game), or you leave the place; then the word's
// cooldown and the Cast row's recovery. No overcast while held. At Impression the 30% wild roll is one fizzle at the start (half the
// first tick back). Its three words are Caor (flame), Sioc (frost) and Séideán (a gale); what each does past the damage, and the
// riders, are the sheet's session 4's next part. Named action: holdWord.
const HELD_TICK=FORMS.held.tick;
let HELD=null; /* {word,rider,tier,sp,next,key,ticks,hits,dealt,mesh} */
function heldOn(){return !!HELD;}
// the word as a spell the damage reads: its SPELLS row where it has one, else its Sent bolt's figure
function heldSpell(word){const s=SPELLS.find(x=>x.id===word);if(s)return s;const w=WORD_BY[word];
  return {id:word,school:w.school,nameIr:w.nameIr,nameEn:w.nameEn,ico:w.ico,cost:w.cost,dmgBase:(w.forms.sent&&w.forms.sent.bolt)||0,col:0xddeeff,glowCol:0xaaccee};}
function heldTargets(){return (lid&&lid.startsWith('dyn_'))?ENEMIES:ZE;}
function heldTickCost(H){return wordCost(H.word,'held',H.rider,{tier:H.tier})*HELD_TICK;}
// is e in the cone: its centre within 4 m of your edge plus its own hull, and within 30° of your facing (-sin yaw, -cos yaw)
function heldInCone(e){const dx=e.x-px,dz=e.z-pz,d=Math.hypot(dx,dz);if(d>reachTo(e,FORMS.held.reach))return false;if(d<1e-3)return true;
  return (-dx*Math.sin(yaw)-dz*Math.cos(yaw))/d>=Math.cos(FORMS.held.cone/2*Math.PI/180)-1e-9;}
// holdWord: the named action. Starts the held word (bk {word,rider}) if it can; the first tick lands at once.
function holdWord(bk){
  if(HELD)return {ok:true};
  const w=WORD_BY[bk.word],tier=wordTierOf(bk.word);if(!w||!tier)return {say:'Spell not learned!'};
  if(!formHeld('held'))return {say:'The Held form is not yet yours.'};
  if(!wordLive(bk.word,'held'))return {say:'You cannot shape that word so.'};
  if(isCasting()||castRecovering())return {why:'busy'};
  if(spCd>0)return {say:'Cooling down...'};
  const H={word:bk.word,rider:bk.rider||null,tier,sp:heldSpell(bk.word),next:playClockS,key:laidKey(),ticks:0,hits:0,dealt:0,mesh:null};
  const tick=heldTickCost(H);
  if(mana<tick)return {say:`Not enough mana! (need ${Math.ceil(tick)})`};
  const mixed=!!(bk.rider&&riderMixedWild(bk.word,bk.rider)); /* S1602 — two schools: 10% at any tier until both reach 25 */
  const wr=tier===1||mixed?casterRand(bk.word+':held'):null;
  if(wr&&wr()<(tier===1?wordWildChance(H.word):0)+(mixed?WORD_MIXED_WILD:0)){mana-=tick*.5;spCd=spellCooldown(H.sp,tier);startCastAnim(H.sp,'fizzle');
    return {ok:true,wild:'fizzle',say:`${w.ico} ${w.nameIr} fizzles — the shape will not hold.`};}
  _offenceS=playClockS;HELD=H;H.mesh=heldMesh(H);startCastAnim(H.sp,'projectile');
  if(typeof sndSpellCharge==='function')sndSpellCharge(w.school);
  heldTick(0);
  return {ok:true};}
// the cast of a held entry from the book (castSpell hands it here)
function castHeld(bk){if(HELD)return true;const r=holdWord(bk);if(r.say)showMsg(r.say,r.ok?'#8a8ac8':'#a8a8d4');
  else if(r.ok&&HELD)showMsg(`${WORD_BY[bk.word].ico} ${WORD_BY[bk.word].nameIr}, held`,'#88ccff');return !!r.ok;}
function heldEnd(why){const H=HELD;if(!H)return;HELD=null;
  const m=H.mesh;if(m&&m.parent)m.parent.remove(m);if(m)m.traverse(o=>{if(o.geometry)o.geometry.dispose();});
  spCd=spellCooldown(H.sp,H.tier);castMark(0);
  if(why==='mana')showMsg('Your mana is spent.','#6688cc');}
// each frame, from tickSpellFx: the ticks the play clock has passed, each paid and landed
function heldTick(dt){const H=HELD;if(!H)return;
  const nowS=performance.now()/1000;
  if(!K['KeyF']||dead||(typeof hubOpen!=='undefined'&&hubOpen)||H.key!==laidKey()||playerStaggered(nowS)||(typeof ROLL!=='undefined'&&ROLL)){heldEnd('up');return;}
  for(let n=0;HELD&&playClockS>=H.next-1e-9&&n<64;n++){
    const c=heldTickCost(H);if(mana<c){heldEnd('mana');return;}
    mana-=c;H.next+=HELD_TICK;H.ticks++;
    const dun=lid&&lid.startsWith('dyn_');
    for(const e of heldTargets()){
      if(e.dead||e.locked||e.disguised||(dun&&e.floor!==currentFloor)||!heldInCone(e))continue;
      const info=applySpellDamage(e,H.sp,H.tier,{power:FORMS.held.power});
      e.hp=Math.max(0,e.hp-info.dmg);e.alert=true;H.hits++;H.dealt+=info.dmg;
      if(e.hpFg&&e.maxHp){e.hpFg.scale.x=e.hp/e.maxHp;e.hpFg.position.x=(e.hp/e.maxHp-1)*.275;}
      if(H.rider)riderHit(e,H.rider,info.dmg,{power:FORMS.held.power}); /* S1602 — the rider */
      dmgNum(e,info.dmg,info);
      if(e.hp<=0){if(dun)killE(e,dmgTag(info,e));else killZoneEnemy(e,scene,dmgTag(info,e));}}}
  if(H.mesh&&HELD){H.mesh.position.set(px,jumpY+1.1,pz);H.mesh.rotation.set(0,yaw,0);}}
// S1603 — magic B's session 4, part 3 (magic-build.md, "The five forms"): the Touched form on a foe. F on a touched entry winds up
// 0.25 s (the Cast row's walk while it does), then lands on the nearest foe whose centre is within 1.6 m of your edge plus its own
// hull (F2b's TOUCH) and 30° of your facing, at ×1.5 the word's power for ×0.6 its mana: Caor 30 and Tintreach 36 to a Sent bolt's
// 20 and 24, the armour met at ×1.5 as well. Tintreach staggers it (the posture break's 1.5 s) and Reo holds it 2 s (frozen, as
// Sioc's bolt holds). A rider rides the touch at the form's ×1.5. With no foe in reach the mana is still spent and the touch lands on
// air ("Nothing within reach."). The release is read on performance.now(), so a dropped frame never moves it; the overcast applies as
// to a Sent cast. What a touch does to a thing (a brazier, a web, a pool, a lock, a fire, dry brush) is not built. Named action: touchWord.
let TOUCH_PEND=null; /* {word,rider,tier,sp,at,key} */
function touchInCone(e){const dx=e.x-px,dz=e.z-pz,d=Math.hypot(dx,dz);if(d>reachTo(e,FORMS.touched.reach))return false;if(d<1e-3)return true;
  return (-dx*Math.sin(yaw)-dz*Math.cos(yaw))/d>=Math.cos(FORMS.touched.cone/2*Math.PI/180)-1e-9;}
function touchTarget(){const dun=lid&&lid.startsWith('dyn_');let best=null,bd=1e9;
  for(const e of heldTargets()){if(e.dead||e.locked||e.disguised||(dun&&e.floor!==currentFloor)||!touchInCone(e))continue;const d=Math.hypot(e.x-px,e.z-pz)-hullOf(e);if(d<bd){bd=d;best=e;}}
  return best;}
// touchWord: the named action. Pays for and winds up a touch of bk {word,rider}; the touch lands at the wind-up's end (touchTick)
function touchWord(bk){
  const w=WORD_BY[bk.word],tier=wordTierOf(bk.word);if(!w||!tier)return {say:'Spell not learned!'};
  if(!formHeld('touched'))return {say:'The Touched form is not yet yours.'};
  if(!wordLive(bk.word,'touched'))return {say:'You cannot shape that word so.'};
  if(TOUCH_PEND||HELD||isCasting()||castRecovering())return {why:'busy'};
  if(spCd>0)return {say:'Cooling down...'};
  const cost=wordCost(bk.word,'touched',bk.rider,{tier}),short=Math.max(0,cost-Math.floor(mana)),blood=short*OVERCAST_HP;
  if(short&&PHP-blood<1)return {say:`Not enough mana! (need ${cost})`};
  mana=Math.max(0,mana-cost);_offenceS=playClockS;
  if(short){PHP-=blood;PPOST.stagUntil=Math.max(PPOST.stagUntil,performance.now()/1000+OVERCAST_STAGGER_S);blocking=false;powerCharging=false;powerCharge=0;
    lvAct.damageTaken+=blood;updateHUD();}
  const sp=heldSpell(bk.word);spCd=spellCooldown(sp,tier);
  const mixed=!!(bk.rider&&riderMixedWild(bk.word,bk.rider));
  const wr=tier===1||mixed?casterRand(bk.word+':touched'):null;
  if(wr&&wr()<(tier===1?wordWildChance(bk.word):0)+(mixed?WORD_MIXED_WILD:0)){mana=Math.min(effMaxMana(),mana+Math.round((cost-short)*.5));startCastAnim(sp,'fizzle');
    return {ok:true,wild:'fizzle',say:`${w.ico} ${w.nameIr} fizzles — the shape will not hold.`};}
  castMark(FORMS.touched.windup);startCastAnim(sp,'projectile');
  if(typeof sndSpellCharge==='function')sndSpellCharge(w.school);
  TOUCH_PEND={word:bk.word,rider:bk.rider||null,tier,sp,at:performance.now()/1000+FORMS.touched.windup,key:laidKey()};
  return {ok:true,blood:short?blood:0};}
function castTouched(bk){const r=touchWord(bk);if(r.say)showMsg(r.say,r.ok?'#8a8ac8':'#a8a8d4');
  else if(r.blood)showMsg(`Not enough mana: the word takes ${r.blood} health.`,'#d48a8a');return !!r.ok;}
// each frame, from tickSpellFx: the touch lands when its wind-up is done, on the nearest foe in reach then
function touchTick(){const T=TOUCH_PEND;if(!T)return;
  if(dead||T.key!==laidKey()){TOUCH_PEND=null;return;}
  if(performance.now()/1000<T.at)return;
  TOUCH_PEND=null;touchLand(T);}
function touchLand(T){const F=WORD_BY[T.word].forms.touched,e=touchTarget(),dun=lid&&lid.startsWith('dyn_');
  if(typeof sndSpell==='function')sndSpell(T.word,T.tier);
  if(!e){showMsg('Nothing within reach.','#a8a8d4');return {hit:null};}
  let dealt=0,info=null;
  if(F.dmg){info=applySpellDamage(e,T.sp,T.tier,{power:FORMS.touched.power});dealt=info.dmg;e.hp=Math.max(0,e.hp-dealt);
    if(e.hpFg&&e.maxHp){e.hpFg.scale.x=e.hp/e.maxHp;e.hpFg.position.x=(e.hp/e.maxHp-1)*.275;}dmgNum(e,dealt,info);}
  e.alert=true;
  if(e.hp>0&&(F.stagger||F.hold)){const t=F.hold||dazeS(POSTURE_BREAK_STUN),q=staggered.find(s=>s.e===e);
    if(q)q.t=Math.max(q.t,t);else staggered.push({e,t});staggerFlash(e);}
  if(T.rider)riderHit(e,T.rider,dealt,{power:FORMS.touched.power});
  if(e.hp<=0){const tag=info?dmgTag(info,e):'';if(dun)killE(e,tag);else killZoneEnemy(e,scene,tag);}
  return {hit:e,dealt};}
// S1602 — magic B's session 4, part 2 (magic-build.md, "Joining and riders"): a joined word's rider on what a Sent bolt or a Held tick
// strikes. Caor burns (3 a second for 4 s, past the armour), Sioc slows (−30% speed for 3 s), Séideán pushes (1.5 m straight back
// from you, stopped by a wall, and 10 posture), Fréamh holds (rooted 0.8 s: it turns and strikes but takes no step), Solas lights (the
// foe glows for 10 s; `foeLit` is what any hiding reads) and Leigheas mends (you heal 25% of the damage the blow dealt). `power` is
// the form's: a held tick's ×0.25 takes the push's distance and posture with it (a second of ticks is one bolt's push), while the
// burn, the slow, the root and the glow are refreshed, never stacked. Durations run on the play clock; all of it ends when you leave
// the place. Named action: riderHit.
const RIDER_SLOW_MULT=1-RIDERS.sioc.hit.slow;
const RIDDEN=new Set(); /* foes with a burn or a glow running */
function foeLit(e){return !!(e&&e._litUntil>playClockS);}
function foeRooted(e){return !!(e&&e._rootUntil>playClockS);}
function riderFoeSolid(x,z,dun){return dun?dSolid(x,z):(typeof currentZoneSolid==='function'&&currentZoneSolid(x,z));}
// riderHit: the named action. e was struck for `dealt` by a spell carrying `rider`; o.power is the form's (1 a bolt, 0.25 a tick)
function riderHit(e,rider,dealt,o){o=o||{};const R=RIDERS[rider];if(!e||!R)return null;const h=R.hit,pw=o.power!=null?o.power:1;
  const now=playClockS,dun=!!(lid&&lid.startsWith('dyn_'));
  if(h.lifesteal){const m=(dealt||0)*h.lifesteal+(_mendCarry||0),n=Math.floor(m+1e-9);_mendCarry=m-n;if(n>0)PHP=Math.min(effMaxHP(),PHP+n);return {mend:n};}
  if(e.dead||e.hp<=0)return null;
  if(h.dps){e._burn={dps:h.dps,until:now+h.dur,next:Math.max(now+1,e._burn&&e._burn.until>now?e._burn.next:0),dun,key:laidKey()};RIDDEN.add(e);return {burn:h.dur};}
  if(h.slow){e._riderSlowUntil=Math.max(e._riderSlowUntil||0,now+h.dur);return {slow:h.dur};}
  if(h.root){e._rootUntil=Math.max(e._rootUntil||0,now+h.root);return {root:h.root};}
  if(h.glow){e._litUntil=now+h.glow;e._litKey=laidKey();RIDDEN.add(e);riderGlow(e,true);return {glow:h.glow};}
  if(h.knock){let dx=e.x-px,dz=e.z-pz,d=Math.hypot(dx,dz);if(d<1e-3){dx=-Math.sin(yaw);dz=-Math.cos(yaw);d=1;}dx/=d;dz/=d;
    const want=h.knock*pw;let moved=0;
    for(;moved<want-1e-9;){const st=Math.min(.1,want-moved),nx=e.x+dx*st,nz=e.z+dz*st;if(riderFoeSolid(nx,nz,dun))break;e.x=nx;e.z=nz;moved+=st;}
    if(e.mesh&&e.mesh.position){e.mesh.position.x=e.x;e.mesh.position.z=e.z;}
    if(typeof e.posture!=='number'&&typeof initPosture==='function')initPosture(e);
    let broke=false;if(typeof e.posture==='number'&&applyPostureDamage(e,h.posture*pw,performance.now()/1000)){broke=true;staggered.push({e,t:dazeS(POSTURE_BREAK_STUN)});staggerFlash(e);}
    e.alert=true;return {knock:+moved.toFixed(3),broke};}
  return null;}
let _mendCarry=0;
// each frame: a burn's seconds land as they pass on the play clock; a glow goes out at its time. Both end when you leave the place.
function riderTick(){const now=playClockS,key=laidKey();
  for(const e of RIDDEN){
    const B=e._burn;
    if(B&&(e.dead||B.key!==key)){e._burn=null;}
    else if(B){for(let n=0;n<8&&now>=B.next-1e-9&&B.next<=B.until+1e-9;n++){B.next+=1;
        const d=challengeDealt(B.dps);e.hp=Math.max(0,e.hp-d);e.alert=true;
        if(e.hpFg&&e.maxHp){e.hpFg.scale.x=e.hp/e.maxHp;e.hpFg.position.x=(e.hp/e.maxHp-1)*.275;}
        if(typeof dmgNum==='function')dmgNum(e,d,{});
        if(e.hp<=0){e._burn=null;if(B.dun)killE(e,' (burned)');else killZoneEnemy(e,scene,' (burned)');break;}}
      if(e._burn&&e._burn.next>e._burn.until+1e-9)e._burn=null;}
    if(e._litUntil&&(e.dead||now>=e._litUntil||e._litKey!==key)){e._litUntil=0;riderGlow(e,false);}
    if(!e._burn&&!(e._litUntil>now))RIDDEN.delete(e);}}
// a lit foe's glow: a faint shell of the light's colour on its mesh (the look builder's to dress)
function riderGlow(e,on){const m=e&&e.mesh;if(!m||typeof THREE==='undefined')return;
  if(!on){const g=e._litMesh;if(g){if(g.parent)g.parent.remove(g);g.geometry.dispose();g.material.dispose();}e._litMesh=null;return;}
  if(e._litMesh)return;const r=Math.max(.4,hullOf(e)+.15);
  const g=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),new THREE.MeshBasicMaterial({color:0xfff2b0,transparent:true,opacity:.18,depthWrite:false,blending:THREE.AdditiveBlending}));
  g.name='rider-lit';g.position.y=r*1.6;g.scale.y=2;m.add(g);e._litMesh=g;}
// S1602 — two words of two schools add 10% wild at any tier until both schools reach 25: true when this joined cast should roll it
function riderMixedWild(word,rider){const a=WORD_BY[word],b=WORD_BY[rider];return !!(a&&b&&a.school!==b.school&&(skillLv(a.school)<WORD_MIXED_SKILL||skillLv(b.school)<WORD_MIXED_SKILL));}
// the cone drawn: open, faint, the word's colour, its point at your chest (the look builder's to dress)
function heldMesh(H){if(typeof THREE==='undefined'||typeof scene==='undefined'||!scene)return null;
  const R=FORMS.held.reach+HULL_YOU,rad=R*Math.tan(FORMS.held.cone/2*Math.PI/180);
  const d=typeof heldDress==='function'?heldDress(H,R,rad):null; /* S1609 — the look builder's dress (82-world-structures.js), its point at the origin, its mouth along −z */
  if(d){scene.add(d);return d;}
  const geo=new THREE.ConeGeometry(rad,R,16,1,true);geo.translate(0,-R/2,0);geo.rotateX(Math.PI/2);
  const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:H.sp.glowCol||0xffffff,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide}));
  const g=new THREE.Group();g.name='held-'+H.word;g.add(m);scene.add(g);return g;}
