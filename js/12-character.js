
// ── ATTRIBUTE SYSTEM ─────────────────────────────────────────
// Attribute scores (points invested total, each point = stat gain)
const ATTRS={might:0,fortitude:0,finesse:0,swiftness:0,resolve:0,intelligence:0,charisma:0,fortune:0};
// v61at: player identity + character creator state. playerName surfaces in
// the hub character sheet, save labels, and {name}-substituted dialog text.
// playerArchetype is the chosen starting flavour. metNPCs tracks NPCs the
// player has introduced themselves to via the in-dialog "My name is X" topic.
let playerName='Traveller';
let playerArchetype='warrior';
const metNPCs=new Set();
// v61au: 8 archetypes, one for each attribute. Each archetype names 3
// "primary" attributes — the things the character is naturally gifted at.
// On level-up, those primaries get a flat +1 *on top of* the action-driven
// gains. Over a 10-level arc that's ~10 extra points across the 3 primaries,
// roughly 20% of mid-game development — substantial but not gamebreaking.
// Starting allocation totals exactly 8 points (CC_POINT_BUDGET) with no
// individual stat above the +3 cap (CC_ATTR_CAP). Each archetype ships with
// a `defaultWeapon` matching its play style — the player can override at
// the creator's weapon picker.
const ARCHETYPES=[
  {id:'warrior',  label:'Warrior',  icon:'⚔',
   desc:'A born fighter. Steel arms. Steady ground. You take a hit and stay standing.',
   primaries:['might','fortitude','resolve'],
   attrs:{might:3, fortitude:3, resolve:2}, defaultWeapon:'greatclub'},
  {id:'sentinel', label:'Sentinel', icon:'🛡',
   desc:"A patient defender. You don't strike first, but you outlast everyone who does.",
   primaries:['fortitude','resolve','might'],
   attrs:{fortitude:3, resolve:3, might:2}, defaultWeapon:'club'},
  {id:'duelist',  label:'Duelist',  icon:'🤺',
   desc:"Quick blade and sharper instincts. Footwork wins fights you didn't think you could.",
   primaries:['finesse','swiftness','might'],
   attrs:{finesse:3, swiftness:3, might:2}, defaultWeapon:'sword'},
  {id:'scout',    label:'Scout',    icon:'🏹',
   desc:'Light feet, sharp eyes. The road raised you. Luck keeps you on it.',
   primaries:['swiftness','fortune','finesse'],
   attrs:{swiftness:3, fortune:3, finesse:2}, defaultWeapon:'bow'},
  {id:'monk',     label:'Monk',     icon:'☸',
   desc:'A disciplined soul. Where others tire, you find the breath in front of the next breath.',
   primaries:['resolve','intelligence','fortitude'],
   attrs:{resolve:3, intelligence:3, fortitude:2}, defaultWeapon:'staff'},
  {id:'scholar',  label:'Scholar',  icon:'📖',
   desc:'Books before blades. You understood the world before you learned to navigate it.',
   primaries:['intelligence','charisma','resolve'],
   attrs:{intelligence:3, charisma:3, resolve:2}, defaultWeapon:'staff'},
  {id:'diplomat', label:'Diplomat', icon:'💬',
   desc:"A silver tongue. Most problems are conversations the rest haven't had yet.",
   primaries:['charisma','intelligence','finesse'],
   attrs:{charisma:3, intelligence:3, finesse:2}, defaultWeapon:'sword'},
  {id:'vagrant',  label:'Vagrant',  icon:'🍀',
   desc:"A drifter and a survivor. You've never owned a debt. Or a home.",
   primaries:['fortune','swiftness','charisma'],
   attrs:{fortune:3, swiftness:3, charisma:2}, defaultWeapon:'dagger'},
];
const CC_POINT_BUDGET=8;
const CC_ATTR_CAP=3;

// v61au: starter weapon choices for the character creator. Wooden tier,
// no attribute requirements, all available immediately. Sword is the
// balanced default; club hits hardest but slowest; dagger is fast and
// light; staff is the mage flavor — modest melee output but a small
// passive +5% spell power (read by applySpellDamage at swing time when
// EQ.weapon.spellPower exists).
const STARTER_WEAPONS={
  sword:  {name:'Wooden Sword',  ico:'⚔️', type:'equip', slot:'weapon', atk:[5,9],  weight:3,   tier:1, material:'Wooden', weaponShape:'sword',  wType:'slash',  matCol:0x8B5E3C, matGuard:0x6B3E20, matGlow:null, sellMult:.3, buyPrice:14,
           desc:'Balanced edge. The honest first sword.'},
  club:   {name:'Wooden Club',   ico:'🏏', type:'equip', slot:'weapon', atk:[6,10], weight:4,   tier:1, material:'Wooden', weaponShape:'mace',   wType:'blunt',  matCol:0x6a3e12, matGuard:0x4a2808, matGlow:null, sellMult:.3, buyPrice:14,
           desc:'Slow swing, heavy hit. Good against bone and stone.'},
  dagger: {name:'Wooden Dagger', ico:'🗡️', type:'equip', slot:'weapon', atk:[4,7],  weight:1.5, tier:1, material:'Wooden', weaponShape:'dagger', wType:'pierce', matCol:0x8B5E3C, matGuard:0x6B3E20, matGlow:null, sellMult:.3, buyPrice:14,
           desc:'Quick, light, lethal in close.'},
  staff:  {name:'Wooden Staff',  ico:'🥢', type:'equip', slot:'weapon', atk:[4,7],  weight:2.5, tier:1, material:'Wooden', weaponShape:'staff',  wType:'blunt',  matCol:0x6a3e12, matGuard:0x4a2808, matGlow:null, sellMult:.3, buyPrice:14,
           spellPower:1.05,
           desc:'A walking-staff. Channels mana well — small spell-power passive while wielded.'},
  // v66 — character-creator slots for the v64/v65 weapon classes. Unlike the
  // four melee starters above (hand-authored field sets), these two are
  // materialized at equip time in ccBegin() via makeItem() against the live
  // WEAPON_TYPES def, so they stay byte-for-byte identical to the shop copies
  // (Barnaby's Wooden Bow + Iron Arrows, Barnaby's Wooden Great Club) without
  // duplicating the twoHand/cleaveTargets/postureMult/blockReduce field set
  // here and risking drift. The fields below are PICKER-DISPLAY METADATA only
  // (atk range + wType are read by renderWeaponPicker); `buildVia` is the
  // hook ccBegin reads to route these through makeItem instead of a deep-clone.
  // STARTER_WEAPONS is declared before WEAPON_TYPES/makeItem in source order,
  // so the build can only happen later, at finalize time.
  bow:    {name:'Wooden Bow',    ico:'🏹', type:'equip', slot:'weapon', atk:[6,10], weight:3,   tier:1, material:'Wooden', weaponShape:'bow',      wType:'pierce', matCol:0x8B5E3C, matGuard:0x6B3E20, matGlow:null, sellMult:.3, buyPrice:14,
           buildVia:'Bow', twoHand:true, grantsAmmo:'arrow',
           desc:'Strike from range. Draw to charge — a fuller pull hits harder and flies straighter. Comes with a quiver of iron arrows.'},
  greatclub:{name:'Wooden Great Club',ico:'🏏',type:'equip',slot:'weapon',atk:[8,13],weight:4, tier:1, material:'Wooden', weaponShape:'greatclub',wType:'blunt',  matCol:0x6a3e12, matGuard:0x4a2808, matGlow:null, sellMult:.3, buyPrice:14,
           buildVia:'GreatClub', twoHand:true,
           desc:'A heavy two-handed stick. Slow, brutal, single-target. Hold to commit a crushing power blow; can haft-parry without a shield.'},
};


// Activity counters — reset each level, drive multipliers
let lvAct={kills:0,damageTaken:0,parries:0,sprintDist:0,staminaDepleted:0,transactions:0,npcTalks:0,chestsOpened:0};

// ── SKILLS (Session 941: skills and perks A, Michael's Morrowind book; docs/design/skills-and-perks-build.md, its first session) ──
// Twenty-three skills (Hand-to-hand the 23rd since Session 950), 1 to 100, raised by use. A use is one thing done against resistance (a hit on an alert foe, a pin set,
// ten metres sprinted), at most once a second for each skill and target, so a sleeping deer teaches nothing. The next level
// costs 0.9 × L^1.2 uses: 6 at 5, 43 at 25, 98 at 50, 223 at 99. Five majors start at 25, five minors at 15, the rest at 5.
// What a skill sets is read where the thing is decided: a weapon's damage × (0.6 + 0.8 × skill/100), a school's power the
// same and its cost × (1.4 − 0.8 × skill/100), the pick's chance, the tier gates, the run, swim, sprint and jump, and the
// sight on you while you sneak. The level and the bed still run on xp until the sheet's second session; the perks are
// read from the skill in its third. Skills are the character's: `skills`, `majors`, `minors` ride the character row.
const SKILL_DEF={
  blade:{label:'Blade',attr:'might'},blunt:{label:'Blunt',attr:'might'},hand:{label:'Hand-to-hand',attr:'might'},bow:{label:'Bow',attr:'finesse'},guard:{label:'Guard',attr:'resolve'},
  athletics:{label:'Athletics',attr:'swiftness'},acrobatics:{label:'Acrobatics',attr:'swiftness'},armour:{label:'Armour',attr:'fortitude'},
  tine:{label:'Tine',attr:'intelligence'},uisce:{label:'Uisce',attr:'resolve'},cloch:{label:'Cloch',attr:'resolve'},
  scath:{label:'Scáth',attr:'resolve'},solas:{label:'Solas',attr:'intelligence'},gaoth:{label:'Gaoth',attr:'intelligence'},
  stealth:{label:'Stealth',attr:'finesse'},locks:{label:'Locks',attr:'finesse'},speech:{label:'Speech',attr:'charisma'},
  alchemy:{label:'Alchemy',attr:'intelligence'},cooking:{label:'Cooking',attr:'charisma'},mining:{label:'Mining',attr:'might'},
  woodcutting:{label:'Woodcutting',attr:'fortitude'},smithing:{label:'Smithing',attr:'might'},joinery:{label:'Joinery',attr:'finesse'}};
// the build sheet's table: each archetype's suggested majors and minors (the creator's one sheet lets you change them: session 2)
const SKILL_ARCH={
  warrior: {maj:['blunt','armour','guard','athletics','smithing'],min:['blade','bow','acrobatics','mining','woodcutting']},
  sentinel:{maj:['guard','armour','blunt','speech','solas'],min:['blade','athletics','cloch','smithing','cooking']},
  duelist: {maj:['blade','guard','acrobatics','athletics','speech'],min:['bow','stealth','armour','locks','gaoth']},
  scout:   {maj:['bow','athletics','stealth','acrobatics','woodcutting'],min:['blade','locks','joinery','cooking','gaoth']},
  monk:    {maj:['blunt','acrobatics','solas','uisce','athletics'],min:['guard','cloch','alchemy','cooking','speech']},
  scholar: {maj:['tine','solas','alchemy','speech','scath'],min:['uisce','gaoth','cloch','locks','blunt']},
  diplomat:{maj:['speech','blade','stealth','solas','locks'],min:['alchemy','athletics','scath','bow','cooking']},
  vagrant: {maj:['stealth','locks','blade','athletics','acrobatics'],min:['speech','bow','scath','cooking','woodcutting']}};
// the tier gates by material tier (Iron 15 … Cosmic 100): a weapon reads its own skill, heavy armour reads Armour
const SKILL_GATE=[0,0,0,15,30,45,55,65,75,90,100];
let SKILLS={},skillMajors=[],skillMinors=[];
const SKILL_LAST=new Map();
function skillCost(L){return Math.round(.9*Math.pow(Math.max(1,L),1.2));}
// a fresh character's skills by archetype; `lv` > 1 is the one-time migration of a character saved before skills: majors at
// 25 + 2 a level past the first, minors at 15 + 1, both to 60 (the build sheet's *The save*)
function skillsInit(arch,lv){const A=SKILL_ARCH[arch]||SKILL_ARCH.warrior,past=Math.max(0,(lv||1)-1);skillMajors=A.maj.slice();skillMinors=A.min.slice();SKILLS={};
  for(const id in SKILL_DEF)SKILLS[id]={lv:A.maj.includes(id)?Math.min(60,25+2*past):A.min.includes(id)?Math.min(60,15+past):5,p:0};return SKILLS;}
// S952 — the creator's sheet: five majors at 25, five minors at 15, the rest at 5, as the player chose them
function skillsChoose(maj,min){skillMajors=maj.slice(0,5);skillMinors=min.filter(k=>!maj.includes(k)).slice(0,5);SKILLS={};
  for(const id in SKILL_DEF)SKILLS[id]={lv:skillMajors.includes(id)?25:skillMinors.includes(id)?15:5,p:0};return SKILLS;}
function skillsReady(){if(!SKILLS.blade)skillsInit(playerArchetype,1);return SKILLS;}
function skillLv(id){const s=skillsReady()[id];return s?s.lv:5;}
// 0 at 5 (a skill never trained moves as today), 1 at 100: the movement's lines run on this
function skillT(id){return Math.max(0,Math.min(1,(skillLv(id)-5)/95));}
// ── PERKS (Session 973: the build sheet's third session, its first wave) ──
// Each skill's four perks arrive on their own at 25, 50, 75 and 100; nothing is saved, a perk is read from the skill.
// `PERK_DEF[skill]` holds the sheet's names and what each does, in rank order. `PERK_LIVE` names the ones built so far:
// the rest are shown on the Skills tab as not yet in the game. The schools' perks come with magic B, the land skills'
// with survival. `perk('locks',50)` is true when Locks stands at 50 or more and Sure hand is built.
const PERK_RANKS=[25,50,75,100];
const PERK_DEF={
  blade:[['Draw cut','the first swing from a sheathed blade does ×2 posture damage'],['Long riposte','the riposte window 0.8 → 1.2 s'],['Crossing','a perfect parry also staggers a second attacker within 3 m'],['Clean edge','a finisher ignores armour']],
  blunt:[['Weight','+25% posture damage'],['Ringing','a power hit breaks a raised shield in one blow'],['Daze','a staggered foe stays down 0.6 s longer'],['Earthshaker','the chain’s third hit staggers every foe within 2 m']],
  hand:[['Hard knuckles','a punch drains ×1.5 posture'],['Throw','a punch on a staggered foe knocks it down'],['Catch the blade','a perfect parry bare-handed knocks a one-handed weapon from the foe’s grip'],['Stone hand','the fists roll 4 to 7']],
  bow:[['Steady','a full draw holds 3 s without sway'],['Quick nock','draw 30% faster'],['Long eye','half the drop past 50 m'],['Through','a full-draw arrow passes the first foe']],
  guard:[['Deflect','a held shield turns arrows'],['Bulwark','a bash drains +50% posture'],['Iron wall','a heavy attack no longer breaks a held block'],['Second parry','within 0.4 s of a perfect parry, the next parry is perfect too']],
  athletics:[['Swimmer','swim at run speed'],['Long breath','three times the air underwater'],['Road legs','no sprint cost on a road'],['Tireless','stamina comes back at once after a sprint']],
  acrobatics:[['Catch','mantle to 1.6 m, and catch an edge while falling'],['Cat’s fall','falls free to 8 m (was 4)'],['Second step','the double jump'],['Swallow’s turn','the air dash']],
  armour:[['Fitted','worn armour weighs half'],['Unbowed','your posture +25%'],['Hold the line','a light hit doesn’t stagger you above half posture'],['Second skin','worn armour never slows the roll']],
  stealth:[['Soft step','sneak at walking speed'],['In the dark','sight on you −25% more out of light'],['Light foot','plates and crumbling floors don’t trigger while sneaking or sprinting'],['Shadow’s hand','a backstab does +50%']],
  locks:[['Feel for it','the pin you work glows faintly at the shear'],['Sure hand','a snapped pick keeps the set pins'],['Quiet work','picking halves a witness’s range'],['No mark','a picked town lock is never found']],
  speech:[['Haggle','5% better prices both ways'],['Talk it down','a guard’s fine halved, once in each town'],['Hearing','a person at favour −1 still talks'],['Word given','once a day a guard takes your word for a trespass']]};
const PERK_LIVE=new Set(['locks:25','locks:50','locks:75','speech:25','speech:50',
  'stealth:25','stealth:50','stealth:75','stealth:100','athletics:25','athletics:50','athletics:75','athletics:100', /* S976 — Stealth's three and Athletics' four */
  'acrobatics:50','armour:25', /* S977 — Cat's fall and Fitted */
  'acrobatics:75','acrobatics:100', /* S1009 — Second step, the double jump (airStepTick, 10-player.js); S1011 — Swallow's turn, the air dash (airDashStart) */
  'bow:25','bow:50','bow:75','bow:100', /* S1048 — Guard's Deflect, Bulwark and Second parry; Iron wall waits on a foe's heavy attack (FOE_ATTACKS' heavy column) */
  'guard:25','guard:50','guard:100',
  'armour:50','armour:75','armour:100',
  'blade:50','blade:75','blade:100','blunt:25','blunt:75','blunt:100','hand:25','hand:100']); /* S1051 — the Arms perks that need no new system (see armsPerk) */ /* S1050 — Armour's Unbowed (playerMaxPosture), Hold the line (playerPostureHit), Second skin (startRoll) */ /* S1028 — Steady, on the aim's sway (bowSway, 10-player.js); S982 — Quick nock, Long eye, Through; S1001 — Shadow's hand (stealth:100) */
function perk(id,rank){return PERK_LIVE.has(id+':'+rank)&&skillLv(id)>=rank;}
// S976 — the body's perks, read by the loop. Soft step (Stealth 25): the sneak at walking speed.
function sneakMoveMult(){return _sneaking?(perk('stealth',25)?1:SNEAK_MOVE_MULT):1;}
// Swimmer (Athletics 25): swim at the run's speed; without it the swim is 1.7, the cloak's drag, Athletics ×0.8 to ×1.3
function swimSpeed(){return perk('athletics',25)?3.83+.37*skillT('athletics'):1.7*cloakSwimMult()*(.8+.5*skillT('athletics'));}
// Long breath (Athletics 50): three times the air underwater (BREATH_S is the sea's, 85-world-sea.js)
function breathSecs(){return BREATH_S*(perk('athletics',50)?3:1);}
// Road legs (Athletics 75): no sprint cost on a road, outdoors in the world, within the road's half-width
function roadLegsNow(){if(!perk('athletics',75)||activeZoneId!=='world'||(typeof isInterior==='function'&&isInterior())||typeof roadInfo!=='function')return false;
  const q=roadInfo(px,pz);return !!q&&q.d<ROAD_HALF;}
// In the dark (Stealth 50): sneaking out of light, sight on you × 0.75 more. Out of light is the game's one dark rule today,
// the night in the open (the witnesses' night halving); a foe's sight, which has no night rule, takes the same 0.75 then.
function outOfLight(){return activeZoneId==='world'&&!(typeof isInterior==='function'&&isInterior())&&typeof isNight==='function'&&isNight();}
function inTheDarkMult(){return _sneaking&&perk('stealth',50)&&outOfLight()?.75:1;}
// Light foot (Stealth 75): a spike plate does not trigger while you sneak or sprint (`_sprintNow`, set by the loop)
let _sprintNow=false;
// S977 — Cat's fall (Acrobatics 50): a fall is free to 8 m, not FALL_FREE's 4 (10-player.js)
function fallFree(){return perk('acrobatics',50)?8:FALL_FREE;}
// S982 — the Bow's perks. Quick nock (Bow 50): the draw fills 30% faster, BOW_DRAW_MAX in 0.7 of the time (10-player.js)
function bowDrawRate(){return perk('bow',50)?1/.7:1;}
// Long eye (Bow 75): an arrow that has flown 50 m on the level falls at half the gravity from there (tickArrowMotion)
function arrowGravity(a){const ud=a.userData;return ARROW_GRAVITY*(ud.longEye&&Math.hypot(a.position.x-ud.x0,a.position.z-ud.z0)>50?.5:1);}
// Through (Bow 100): a full-draw arrow goes on past the first foe it strikes, and can strike one more; true when this hit
// is the one it passes through (the caller then neither sticks nor removes it)
function arrowPasses(ud,e){if(!ud||!ud.through||ud.passed)return false;ud.passed=e;return true;}
// S1001 — Shadow's hand (Stealth 100): a backstab does +50%, the whole blow ×1.5 on top of the dagger's ×3 or the rest's ×1.5
function shadowHandMult(){return perk('stealth',100)?1.5:1;}
function lightFootNow(){return perk('stealth',75)&&(_sneaking||_sprintNow);}
// ×0.64 at 5, ×1.0 at 50, ×1.4 at 100: a weapon's damage and a school's power
function skillMult(id){return id?.6+.8*skillLv(id)/100:1;}
// S1047 — the three lines left for combat's resolver (the sheet's Guard and Armour rows and its ≤1% rule). The parry window
// is Guard's, 160 ms + 1 ms a level (combat B: 165 ms at 5, 260 at 100; Finesse is out of it). Resolve takes 1% a point off
// a block's stamina (it was 5%), still floored at half. Worn armour's def counts × (0.75 + 0.5 × Armour/100).
function parryWindowS(){return .160+.001*skillLv('guard');}
function resolveBlockMult(){return Math.max(.5,1-(ATTRS.resolve||0)*.01);}
function armourSkillMult(){return .75+.5*skillLv('armour')/100;}
// S1048 — Guard's perks. Deflect (25): a held shield, facing the shot, turns an arrow: no damage, the block's stamina.
// Bulwark (50): a bash drains half as much posture again (a shield's bash already breaks it). Second parry (100): within
// 0.4 s of a perfect parry, on the play clock, a block still held parries the next blow too.
const SECOND_PARRY_S=.4;
let _lastParryG=-1e9;
function deflectsArrows(){return blocking&&!!EQ.offhand&&EQ.offhand.shieldType==='shield'&&perk('guard',25);}
function bulwarkMult(){return perk('guard',50)?1.5:1;}
// S1050 — Armour's perks. Unbowed (50): your posture +25%. Hold the line (75): a light hit taken above half your posture
// leaves you on your feet (a foe's blow is light until FOE_ATTACKS' heavy column is filled). Second skin (100): what you
// wear on the five armour slots does not count toward the load that makes a roll heavy.
function unbowedMult(){return perk('armour',50)?1.25:1;}
function holdTheLine(before,max,heavy){return !heavy&&perk('armour',75)&&before>max/2;}
function rollLoad(){let w=totalCarryWeight();if(perk('armour',100)){const fit=perk('armour',25)?.5:1;for(const k of ARMOUR_SLOTS)w-=itemWeight(EQ[k])*fit;}return w;}
// S1051 — the Arms perks, each read off the weapon in your hand (weaponSkill: none is Hand-to-hand, a blunt wType is Blunt,
// the rest but the bow is Blade). `armsPerk('blade',50)` is true when the hand holds a blade and Blade's Long riposte is held.
// Blade: Long riposte (50) the riposte window 0.8 → 1.2 s; Crossing (75) a perfect parry also staggers a second attacker within
// 3 m; Clean edge (100) a finisher ignores the foe's def. Blunt: Weight (25) +25% posture; Daze (75) a stagger you cause lasts
// 0.6 s longer; Earthshaker (100) the chain's third hit staggers every foe within 2 m of you. Hand-to-hand: Hard knuckles (25)
// a punch drains ×1.5 posture; Stone hand (100) the fists roll 4 to 7. Draw cut, Ringing, Throw and Catch the blade wait.
function armsPerk(id,rank){return weaponSkill(EQ.weapon)===id&&perk(id,rank);}
const CROSSING_R=3,DAZE_S=.6,EARTHSHAKER_R=2,STONE_HAND_ATK=[4,8];
function riposteSecs(){return armsPerk('blade',50)?1.2:RIPOSTE_S;}
function armsPostureMult(){return armsPerk('blunt',25)?1.25:armsPerk('hand',25)?1.5:1;}
function dazeS(t){return t+(armsPerk('blunt',75)?DAZE_S:0);}
function secondParryOpen(){return blocking&&perk('guard',100)&&playClockS-_lastParryG<SECOND_PARRY_S;}
// the sheet's Blade is swords, daggers, axes and spears, Blunt maces, clubs, staves and hammers; bare fists are Hand-to-hand,
// the 23rd skill (Michael's C on #357, Session 950): the fists' roll on its multiplier, a punch on an alert foe a use
function weaponSkill(w){if(!w)return 'hand';if(w.weaponShape==='bow'||w.grantsAmmo==='arrow')return 'bow';return w.wType==='blunt'?'blunt':'blade';}
function skillUse(id,w,target){const S=skillsReady(),s=S[id];if(!s||s.lv>=100)return false;
  const now=performance.now(),key=target==null?'':target;let m=SKILL_LAST.get(id);if(!m)SKILL_LAST.set(id,m=new Map());
  const t=m.get(key);if(t!=null&&now-t<1000)return false;
  if(m.size>64)for(const [k,v] of m)if(now-v>=1000)m.delete(k);
  m.set(key,now);s.p+=(w||1)*(typeof _buffMult==='function'?_buffMult('xpBoost',1):1);let up=0;
  while(s.lv<100&&s.p>=skillCost(s.lv)){s.p-=skillCost(s.lv);s.lv++;up++;}
  if(s.lv>=100)s.p=0;
  if(up){skillMark(id,up);if(typeof showMsg==='function')showMsg(`${SKILL_DEF[id].label} rises to ${s.lv}.`,'#c8b8e8');}
  return true;}
// ── THE LEVEL ON MARKS (Session 952: the build sheet's second session; Michael's B on #342) ──
// Every skill-up counts toward the level: a major's or a minor's is a mark, any other skill's a quarter, so levelling by
// alchemy is never wasted. A level takes ten marks plus half the level you stand at (10.5 at level 1, 15 at 10, 20 at 20).
// Kills and quests no longer pay the level (their xp is counted and read by nothing that levels). At a bed the level is
// taken and you place 12 points, at most 5 in one attribute, each attribute to 60 (Oblivion Remastered's two fixes); the
// sheet pre-lights them in proportion to what rose under each attribute this level, and any point can be moved.
const LEVEL_PTS=12,LEVEL_ROW_MAX=5,ATTR_CAP=60;
let levelMarks=0,levelUps={},luPts={};
function marksNeeded(L){return 10+(L==null?level:L)/2;}
function levelReady(){return levelMarks>=marksNeeded()-1e-9;}
function skillMark(id,n){levelMarks+=n*((skillMajors.includes(id)||skillMinors.includes(id))?1:.25);levelUps[id]=(levelUps[id]||0)+n;
  if(typeof chkLvl==='function')chkLvl();}
// what rose under an attribute this level: [[skill, levels], …], most first
function luRose(attr){return Object.keys(levelUps).filter(id=>SKILL_DEF[id]&&SKILL_DEF[id].attr===attr&&levelUps[id]>0).sort((a,b)=>levelUps[b]-levelUps[a]).map(id=>[id,levelUps[id]]);}
function luRoom(k){return Math.max(0,Math.min(LEVEL_ROW_MAX,ATTR_CAP-(ATTRS[k]||0)));}
function luTotal(){let n=0;for(const k in luPts)n+=luPts[k]||0;return n;}
// the points the bed asks you to place: 12, unless the caps leave less room than that
function luNeed(){let r=0;for(const k in ATTR_DEF)r+=luRoom(k);return Math.min(LEVEL_PTS,r);}
// the pre-lit placement: the 12 in proportion to the skill-ups under each attribute (largest remainder), inside the caps
function luPrelit(){const by={};let T=0;for(const k in ATTR_DEF){by[k]=luRose(k).reduce((a,r)=>a+r[1],0);T+=by[k];}
  const out={};for(const k in ATTR_DEF)out[k]=0;if(!T)return out;
  let left=luNeed();const want={};for(const k in ATTR_DEF)want[k]=LEVEL_PTS*by[k]/T;
  for(const k in ATTR_DEF){const n=Math.min(Math.floor(want[k]),luRoom(k),left);out[k]=n;left-=n;}
  const order=Object.keys(ATTR_DEF).filter(k=>by[k]>0).sort((a,b)=>(want[b]-Math.floor(want[b]))-(want[a]-Math.floor(want[a]))||by[b]-by[a]);
  for(let pass=0;pass<LEVEL_PTS&&left>0;pass++){let moved=false;for(const k of order){if(left<=0)break;if(out[k]<luRoom(k)){out[k]++;left--;moved=true;}}if(!moved)break;}
  return out;}
function luAdd(key,d){if(!ATTR_DEF[key])return false;const v=(luPts[key]||0)+d;if(v<0||v>luRoom(key))return false;if(d>0&&luTotal()>=luNeed())return false;
  luPts[key]=v;luRender();return true;}
// Armour: a hit taken while wearing three or more pieces
function armourUse(){let n=0;for(const k of ['head','chest','hands','legs','feet'])if(EQ[k])n++;if(n>=3)skillUse('armour',1,'hit');}
// Athletics: ten metres sprinted or swum; called by the loop with the frame's step while moving
let _athDist=0;
function athleticsStep(d,sprinting){const swim=typeof WORLD!=='undefined'&&activeZoneId==='world'&&WORLD.isSwimming();if(!sprinting&&!swim)return;
  _athDist+=d;if(_athDist>=10){_athDist-=10;skillUse('athletics',1,'run');}}
// Stealth: ten seconds sneaking inside a foe's sight range, unseen (canSeePlayer marks the moment)
let _stealthNearT=-1e9,_stealthAcc=0;
function stealthTick(dt){if(!_sneaking||performance.now()-_stealthNearT>500)return;_stealthAcc+=dt;if(_stealthAcc>=10){_stealthAcc-=10;skillUse('stealth',1,'unseen');}}
let luOpen=false; // level up screen open?
let luSelected=[]; // which attrs picked this level-up

// Multiplier thresholds per attribute
// v61au: attribute pass.
//   - Resolve: stam regen, block stamina cost reduction, magic resist (forward-compat).
//   - Intelligence: mana regen (moved from Resolve), max mana, spell power.
//   - Charisma: barter, quest reward gold, merchant inventory threshold (chaReq).
//   - Finesse: parry window, sprint cost, ranged damage (forward-compat for bow).
// `desc` is short flavor for the character creator screen — what the
// attribute "feels like" rather than the precise mechanical numbers, which
// stay in the hub Attributes tab.
const ATTR_DEF={
  might:      {label:'Might',      icon:'⚔',  actKey:'kills',           thresholds:[0,2,4,7,10],  gainDesc:'+1% melee damage, +5 carry weight',                   gains:{meleePct:1, carry:5},                  desc:'Strike harder. Carry more.'},
  fortitude:  {label:'Fortitude',  icon:'🛡',  actKey:'damageTaken',     thresholds:[0,50,120,220,350], gainDesc:'+10 max HP, +5 max stamina',                     gains:{maxHP:10,maxStamina:5},                desc:'Take more punishment. Bleed slower.'},
  finesse:    {label:'Finesse',    icon:'🌀',  actKey:'parries',         thresholds:[0,2,4,7,10],  gainDesc:'+10ms parry window, -1% sprint cost, +1% ranged dmg, -1% sneak detection', gains:{parryMs:10,sprintCostPct:-1,rangedPct:1,sneakDetectPct:-1}, desc:'Parry tighter. Strike from afar. Move unseen.'},
  swiftness:  {label:'Swiftness',  icon:'💨',  actKey:'sprintDist',      thresholds:[0,100,250,450,700],gainDesc:'+0.5% move speed, +1% attack speed',              gains:{movePct:.5,atkSpdPct:1},                desc:'Run farther. Hit faster.'},
  resolve:    {label:'Resolve',    icon:'✦',   actKey:'staminaDepleted', thresholds:[0,1,3,5,8],   gainDesc:'+0.3/s stam regen, -5% block cost, +1% magic resist', gains:{staminaRegen:.3,blockCostPct:-5,magicResistPct:1}, desc:'Outlast the long fight. Endure the unseen.'},
  intelligence:{label:'Intelligence',icon:'📖',actKey:'transactions',    thresholds:[0,3,6,10,15], gainDesc:'+10 max mana, +0.2/s mana regen, +1% spell power',  gains:{maxMana:10,manaRegen:.2,spellPct:1},   desc:'Read more. Cast harder. Mana flows.'},
  charisma:   {label:'Charisma',   icon:'💬',  actKey:'npcTalks',        thresholds:[0,2,4,7,10],  gainDesc:'+0.5% barter, +1% quest reward gold, merchant access',gains:{barterPct:.5,questGoldPct:1,merchantTier:1}, desc:'A silver tongue. Better deals all around.'},
  fortune:    {label:'Fortune',    icon:'🍀',  actKey:'chestsOpened',    thresholds:[0,1,3,5,8],   gainDesc:'+0.5% crit chance, +1% gold found, +1% item drop chance', gains:{critPct:.5,goldPct:1,dropPct:1},                  desc:'The world favors you. Crits and chests.'},
};

function getMultiplier(attrKey){
  const def=ATTR_DEF[attrKey];
  const val=lvAct[def.actKey]||0;
  const t=def.thresholds; // [×1 base, ×2, ×3, ×4, ×5]
  if(val>=t[4])return 5;
  if(val>=t[3])return 4;
  if(val>=t[2])return 3;
  if(val>=t[1])return 2;
  return 1;
}

function applyAttrGains(){
  // Recalculate derived stats from ATTRS (additive on top of base)
  // Base stats are tracked separately; ATTRS scale them
  // Called after confirm — actual maxHP/maxMana/maxStamina are bumped directly
}

function openLevelUp(){
  _releasePointerLockForMenu();
  sndLevelUp();
  luOpen=true;luSelected=[];luPts=luPrelit();
  document.getElementById('lu-lv').textContent=level;
  const sub=document.getElementById('lu-sub');if(sub)sub.innerHTML=`LEVEL <span id="lu-lv">${level}</span> — Place ${luNeed()} points, at most ${LEVEL_ROW_MAX} in one attribute`;
  const _luBonusEl=document.getElementById('lu-arch-bonus');
  if(_luBonusEl){_luBonusEl.classList.add('lu-arch-empty');_luBonusEl.innerHTML='';} /* S952 — the archetype's +1 to three primaries goes: the majors carry the archetype now */
  luRender();
  document.getElementById('lu').style.display='flex';
}
// S952 — one card an attribute: its five diamonds (the points you may place in it), what rose under it this level, and − / +
function luRender(){const container=document.getElementById('lu-attrs');if(!container)return;
  container.innerHTML='';
  Object.keys(ATTR_DEF).forEach(key=>{
    const def=ATTR_DEF[key],n=luPts[key]||0,room=luRoom(key),cur=ATTRS[key]||0;
    const rose=luRose(key),roseTxt=rose.length?rose.map(([id,v])=>`${SKILL_DEF[id].label} +${v}`).join(', ')+' this level':'nothing rose under it';
    let dia='';for(let i=0;i<LEVEL_ROW_MAX;i++)dia+=`<span class="lu-dia${i<n?' on':''}${i>=room?' shut':''}">◆</span>`;
    const card=document.createElement('div');
    card.className='lu-attr'+(n>0?' selected':'');card.dataset.key=key;
    card.innerHTML=`
      <div class="lu-attr-top">
        <span class="lu-attr-name">${def.icon} ${def.label}</span>
        <span class="lu-attr-dias">${dia}</span>
      </div>
      <div class="lu-attr-rose">${roseTxt}</div>
      <div class="lu-attr-gain">${n?gainLines(key,n):gainLines(key,1)+' a point'}</div>
      <div class="lu-attr-cur"><button class="lu-pt" data-d="-1"${n<=0?' disabled':''}>−</button> ${cur}${n?` → <b>${cur+n}</b>`:''} of ${ATTR_CAP} <button class="lu-pt" data-d="1"${(n>=room||luTotal()>=luNeed())?' disabled':''}>+</button></div>`;
    card.querySelectorAll('.lu-pt').forEach(b=>b.onclick=(ev)=>{ev.stopPropagation();luAdd(key,+b.dataset.d);});
    card.onclick=()=>luAdd(key,1);
    container.appendChild(card);
  });
  const c=document.getElementById('lu-count');if(c)c.textContent=luTotal();
  const pk=document.getElementById('lu-picks');if(pk)pk.innerHTML=`Placed: <span id="lu-count">${luTotal()}</span> / ${luNeed()}`;
  const ok=document.getElementById('lu-confirm');if(ok)ok.disabled=luTotal()!==luNeed();
  luHPGain();
}

function gainLines(key,mult){
  const g=ATTR_DEF[key].gains;
  const lines=[];
  if(g.meleePct)   lines.push(`+${g.meleePct*mult}% melee damage`);
  if(g.maxHP)      lines.push(`+${g.maxHP*mult} max HP`);
  if(g.maxStamina) lines.push(`+${g.maxStamina*mult} max stamina`);
  if(g.parryMs)    lines.push(`+${g.parryMs*mult}ms parry window`);
  if(g.sprintCostPct) lines.push(`${g.sprintCostPct*mult}% sprint cost`);
  if(g.sneakDetectPct) lines.push(`${g.sneakDetectPct*mult}% sneak detection`);
  if(g.movePct)    lines.push(`+${g.movePct*mult}% move speed`);
  if(g.atkSpdPct)  lines.push(`+${g.atkSpdPct*mult}% attack speed`);
  if(g.staminaRegen) lines.push(`+${(g.staminaRegen*mult).toFixed(1)}/s stamina regen`);
  if(g.manaRegen)  lines.push(`+${(g.manaRegen*mult).toFixed(1)}/s mana regen`);
  if(g.barterPct)  lines.push(`+${g.barterPct*mult}% barter prices`);
  if(g.maxMana)    lines.push(`+${g.maxMana*mult} max mana`);
  if(g.dialogueTier) lines.push(`+${g.dialogueTier*mult} dialogue tier`);
  if(g.critPct)    lines.push(`+${g.critPct*mult}% crit chance`);
  if(g.goldPct)    lines.push(`+${g.goldPct*mult}% gold found`);
  if(g.dropPct)    lines.push(`+${g.dropPct*mult}% item drop chance`);
  // S531 — the gains ATTR_DEF grants that the card left out (the concept artist, #142)
  if(g.carry)      lines.push(`+${g.carry*mult} carry weight`);
  if(g.rangedPct)  lines.push(`+${g.rangedPct*mult}% ranged damage`);
  if(g.blockCostPct) lines.push(`${g.blockCostPct*mult}% block cost`);
  if(g.magicResistPct) lines.push(`+${g.magicResistPct*mult}% magic resist`);
  if(g.spellPct)   lines.push(`+${g.spellPct*mult}% spell damage`);
  if(g.questGoldPct) lines.push(`+${g.questGoldPct*mult}% quest reward gold`);
  if(g.merchantTier&&(ATTRS[key]||0)<CHA_MERCHANT_PTS&&(ATTRS[key]||0)+mult>=CHA_MERCHANT_PTS) lines.push(`merchants show a piece from the tier above`);
  return lines.join(' &nbsp;·&nbsp; ');
}

// S952 — a click on a card places a point there (the old pick-three's name, kept for anything that still calls it)
function toggleAttr(key){return luAdd(key,1);}
// the health the level gives, as confirmLevelUp gives it: 10 every level, and Fortitude's 10 a point placed
function luHPGain(){const el=document.getElementById('lu-hpgain');if(!el)return;
  const n=10+ATTR_DEF.fortitude.gains.maxHP*(luPts.fortitude||0);
  el.textContent=`❤ +${n} max HP`;}

function confirmLevelUp(){
  if(luTotal()!==luNeed())return false;
  const placed=[];
  Object.keys(ATTR_DEF).forEach(key=>{
    const n=luPts[key]||0;if(!n)return;
    const g=ATTR_DEF[key].gains;
    ATTRS[key]=(ATTRS[key]||0)+n;placed.push(ATTR_DEF[key].label+' +'+n);
    if(g.maxHP){maxHP+=g.maxHP*n;PHP=Math.min(PHP+g.maxHP*n,effMaxHP());}
    if(g.maxStamina){maxStamina+=g.maxStamina*n;stamina=Math.min(stamina+g.maxStamina*n,maxStamina);}
    if(g.maxMana){maxMana+=g.maxMana*n;mana=Math.min(mana+g.maxMana*n,maxMana);}
  });
  // the level's own +10 health (its +10 stamina is given in takeLevelIfReady)
  maxHP+=10;PHP=Math.min(PHP+10,effMaxHP());
  addLog('↑','Level Up! → '+(placed.join(', ')||'no points to place'));
  lvAct={kills:0,damageTaken:0,parries:0,sprintDist:0,staminaDepleted:0,transactions:0,npcTalks:0,chestsOpened:0};
  levelUps={};luPts={};luOpen=false;luSelected=[];
  document.getElementById('lu').style.display='none';
  checkPartialSpells();
  showMsg('Level '+level+' — attributes upgraded!','#ffd700');
  updateHUD();
  return true;
}
