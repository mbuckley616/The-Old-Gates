// Tier-scaled spell audio. Tier 1 is the base SFX. Tier 2 adds richer harmonics.
// Tier 3 adds a sub-bass impact + layered overtones, so Mastery casts FEEL physical.
// Gain multipliers (1.0 / 1.3 / 1.7) mirror the damage scalars — audio presence tracks mechanical presence.
// ═══════════════════════════════════════════════════════════════════════
// Monster Overhaul Session 1 — Damage pipeline
// ═══════════════════════════════════════════════════════════════════════
// All spell hits route through applySpellDamage → resist multiplier → buff mults → flat def subtraction → floor at 1.
// Smól Mastery (The Quiet-Sent-Out) bypasses def but respects resist. Other Mastery traits are unaffected by this pipeline.
// Melee hits use applyMeleeDamage — simpler: buff mults → flat def → floor at 1, no resist (no elemental school).

function applySpellDamage(e, sp, tier){
  const baseDmg = (spellMag(sp,tier) + Math.floor(foeRand(e)*10)) * (SKILL_DEF[sp.school]?skillMult(sp.school):1); // S480 — the spread on the struck foe's stream
  /* S941 — the school's skill sets the power; the flat level term is gone (skills and perks A). A hit on an alert foe is a use. */
  if(e.alert&&SKILL_DEF[sp.school])skillUse(sp.school,tier===3?2:1,e);
  const resistMult = (e.resist && e.resist[sp.school] !== undefined) ? e.resist[sp.school] : 1.0;
  // Dormant enemies (Gargoyle statue form) take 2× damage — rewards the player for spotting and attacking first.
  const dormantMult = e.dormant ? 2.0 : 1.0;
  // v61au: Intelligence scales spell damage. +1% per point (S173; was 3%), parallel to
  // Might's melee scaling. Staff weapons add a small passive (spellPower
  // field on EQ.weapon, currently +5% on Wooden Staff). Both stack
  // multiplicatively with the existing buff multipliers.
  const intMult = 1 + attrEff('intelligence') * ATTR_DMG_PER_POINT;
  const weaponSpellMult = (EQ.weapon && EQ.weapon.spellPower) || 1.0;
  const afterMults = baseDmg * resistMult * dormantMult * intMult * weaponSpellMult * _buffMult('spellDmg',1) * _buffMult('magicDmg',1);
  // Smól Mastery — The Quiet-Sent-Out: ignores armor entirely. Resist still applies.
  const defPierced = (sp.id==='smol' && tier===3);
  const effDef = defPierced ? 0 : (e.def || 0);
  const dmg = challengeDealt(Math.max(1, Math.round(afterMults) - effDef)); /* S684 — the challenge */
  return {dmg, resistMult, defPierced};
}

// ═══════════════════════════════════════════════════════════════════════
// S940 — the attack table and one resolver (combat, Michael's B: its deep-work session; v2-scope.md §4)
// ═══════════════════════════════════════════════════════════════════════
// Every blow in a fight reads a row here: yours by the weapon in your hand, a foe's by its family. A row is one attack:
//   tell      seconds of wind-up before the blow lands (yours: click to impact; a foe's: its wind-up pose and glow)
//   strike    seconds from the blow landing to the end of the commitment (yours; a foe's lands the frame its tell ends)
//   recovery  seconds after that, the last third of your swing, the only part a roll or a block can cut short
//   reach     metres, hull to hull (F2b, Session 1035): from the edge of your body to the edge of the foe's (hullOf)
//   arc       degrees, the whole cone the blow lands in
//   dmg       a multiplier on the blow's roll; posture: yours, what the swing drains from the foe's posture;
//             a foe's, the multiple of its blow that drains yours unguarded (a held block drains ×1)
//   blockable, parryable  whether a raised guard takes a share, and a raised guard in time parries it
//   heavy, third  the columns for the heavy attack and the family's third move (combat.md's six Opus sessions fill them)
// The light rows are today's numbers. A swing's times are today's: 0.55 s at a sword's weight, ×(0.67 + 0.11 × weight)
// between ×0.72 and ×1.40, its impact at 0.55 of the swing and its recovery the last third. A power attack keeps its own
// (powerDur, POWER_DMG_MULT, POSTURE_DRAIN_POWER) until the heavy column is filled. The cone is cos .45 either side of
// the facing, which is 126.5° whole (the old comments said 117°; the number never changed).
// S1456 — the spear's row is #745's 1 A: the longsword's times (so not its weight's, 3.5), a thrust that reaches 2.4 m in a 40° line.
const WEAPON_ATTACKS={
  Fists:    {tell:.236,strike:.050,recovery:.143,reach:0.9,arc:126.5,dmg:1,posture:8, cleave:1,blockable:true,parryable:false,heavy:null,third:null},
  Dagger:   {tell:.253,strike:.054,recovery:.153,reach:1.2,arc:126.5,dmg:1,posture:8, cleave:1,blockable:true,parryable:false,heavy:null,third:null},
  Sword:    {tell:.303,strike:.064,recovery:.183,reach:1.6,arc:126.5,dmg:1,posture:8, cleave:1,blockable:true,parryable:false,heavy:null,third:null},
  Scimitar: {tell:.303,strike:.064,recovery:.183,reach:1.6,arc:126.5,dmg:1,posture:8, cleave:1,blockable:true,parryable:false,heavy:null,third:null},
  Bow:      {tell:.303,strike:.064,recovery:.183,reach:1.6,arc:126.5,dmg:1,posture:8, cleave:1,blockable:true,parryable:false,heavy:null,third:null},
  Crossbow: {tell:.336,strike:.071,recovery:.204,reach:1.6,arc:126.5,dmg:1,posture:8, cleave:1,blockable:true,parryable:false,heavy:null,third:null}, /* S1457 — as the bow's row, at its weight's (4) pace; a click shoots, so nothing swings it yet */
  Longsword:{tell:.336,strike:.071,recovery:.204,reach:1.8,arc:126.5,dmg:1,posture:8, cleave:1,blockable:true,parryable:false,heavy:null,third:null},
  Mace:     {tell:.336,strike:.071,recovery:.204,reach:1.6,arc:126.5,dmg:1,posture:8, cleave:1,blockable:true,parryable:false,heavy:null,third:null},
  GreatClub:{tell:.336,strike:.071,recovery:.204,reach:1.9,arc:126.5,dmg:1,posture:12,cleave:1,blockable:true,parryable:false,heavy:null,third:null},
  Spear:    {tell:.336,strike:.071,recovery:.204,reach:2.4,arc:40,   dmg:1,posture:8, cleave:1,blockable:true,parryable:false,heavy:null,third:null},
  Flail:    {tell:.369,strike:.078,recovery:.224,reach:1.8,arc:126.5,dmg:1,posture:8, cleave:1,blockable:true,parryable:false,heavy:null,third:null},
  Claymore: {tell:.402,strike:.085,recovery:.244,reach:2.2,arc:126.5,dmg:1,posture:14,cleave:3,blockable:true,parryable:false,heavy:null,third:null},
  GreatAxe: {tell:.424,strike:.090,recovery:.257,reach:2.2,arc:126.5,dmg:1,posture:14,cleave:2,blockable:true,parryable:false,heavy:null,third:null},
  WarHammer:{tell:.424,strike:.090,recovery:.257,reach:1.9,arc:126.5,dmg:1,posture:18,cleave:1,blockable:true,parryable:false,heavy:null,third:null},
  // S1575 — a sent cast (magic-build.md, the Sent form): 0.35 s wind-up at ×0.35 walk, released at its end, 0.30 s before the next;
  // a spell is neither blocked nor parried. Reach is the bolt's 30 m; its damage and posture are the word's, not the row's.
  Cast:     {tell:.35,strike:0,recovery:.30,reach:30,arc:null,dmg:1,posture:0,cleave:1,blockable:false,parryable:false,heavy:null,third:null,walk:.35},
};
// S1035 — F2b, session 1 (docs/design/scale-numbers-build.md, *Reach*): the reach column is hull to hull, so a blow lands when
// the foe's centre is inside your hull + the weapon's reach + its hull. Against a townsperson a sword lands at 2.2 centre to
// centre, today's number; the dagger loses 0.4, the two-handers gain 0.6, a punch is a close thing (1.5). The hulls are the
// sheet's until F4 gives each family's built value (e.hullR): you, a townsperson, a bandit or a skeleton 0.30; a goblin 0.25;
// a wolf 0.35; a spider or a bear (the brutes) 0.6; a troll 0.8. A boss is 1.1, so a sword reaches it at 3.0, the flat number
// it replaces; a kind the sheet does not name is 0.3 of its size, the disc it stands as (bodyR, 90-main.js).
const HULL_YOU=.30,BOSS_HULL=1.1;
const HULL_FAMILY={humanoid:.30,wraith:.30,beast:.35,spider:.6,brute:.6,troll:.8};
const HULL_KIND={Goblin:.25,'Kobold Thief':.25};
function hullOf(e){
  if(!e)return .3;if(typeof e.hullR==='number')return e.hullR;
  const k=HULL_KIND[e.baseType||e.baseName];if(k!=null)return k;
  if(e.isBoss)return BOSS_HULL;
  const f=HULL_FAMILY[foeFamily(e)];return f!=null?f:Math.max(.2,.3*(e.size||1));
}
// the centre-to-centre distance a blow of reach r (hull to hull) lands within, against e
function reachTo(e,r){return HULL_YOU+r+hullOf(e);}
const WSHAPE_TO_ROW={dagger:'Dagger',sword:'Sword',longsword:'Longsword',scimitar:'Scimitar',mace:'Mace',flail:'Flail',spear:'Spear',bow:'Bow',crossbow:'Crossbow',claymore:'Claymore',greataxe:'GreatAxe',warhammer:'WarHammer',greatclub:'GreatClub'};
function weaponAttack(w){if(!w)return WEAPON_ATTACKS.Fists;return WEAPON_ATTACKS[WSHAPE_TO_ROW[w.weaponShape]]||WEAPON_ATTACKS.Sword;}
// The foes, a row per family built today. Each has one attack, its light one, from today's numbers: a tell by kind
// (S282's 0.45–0.9 s; a kind not named takes the family's 0.61), a blow in a 1.6-unit, 90° arc about the way it faced
// at the wind-up (S275), a troll's sweep 2.4 and 140°, a boss's bite its own reach. Recovery is the dungeon's 1.0 s;
// the open world's kinds keep their own pace (their `atk`). The blow's roll is the foe's own (foeBlowRaw).
const FOE_ROW=(o)=>Object.assign({tell:TELL_DEFAULT,tells:{},strike:0,recovery:1.0,reach:1.6,arc:90,dmg:1,posture:1.5,blockable:true,parryable:true,heavy:null,third:null},o);
// S1041 — F2b, session 1, part 2 (docs/design/scale-numbers-build.md, *Foes' reach*): the five families the sheet names carry
// `hulls:true`, and their `reach` (the blow) and `engage` (where the tell starts) are metres hull to hull, from the edge of its
// body to the edge of yours, as your own reach is (S1035). An armed humanoid's blow is its weapon's reach (foeWeaponReach); the
// wolf engages at 0.6 and lunges up to 1.5 at the bite (`lunge`), so it may start its tell from 2.1. The other families keep
// today's numbers, centre to centre: the tell at 1.1 in the open world and 0.9 in a dungeon, the blow within 1.6.
// S1136 — the heavy blow (combat.md's move sets; Michael's A on DECISION #430), humanoids and wolves first. One wind-up in four
// (`share`, the roll a third after a light blow) is heavy, a seeded roll on the foe's id and its blow's count (co-op rules), never twice running. Its tell is 1.0 s or the
// kind's tell + 0.35, whichever is longer, the same wind-up pose held longer, its last 0.15 s glowing red where a light blow's glows
// gold (telegraphPulse). S1137 — every family has it now but the shark, a boss and the master's slam, each of which keeps its own blow.
// It lands for twice the damage and twice the posture; a held block takes its share of the damage but the
// guard breaks (Guard's Iron wall, 75, holds it: twice a held block's posture instead); a perfect parry is as good as ever.
const HEAVY_ROW=(o)=>Object.assign({share:.25,tell:1.0,add:.35,dmg:2,posture:2,breaks:true},o);
// S1140 — the third move (combat.md's move sets; the third moves follow #430's answer). The humanoids' is the bandit's feint, the
// page's delayed swing: the wind-up pose reaches its top at the kind's own tell and holds there `pause` (0.3 s) before the blow, so a
// roll timed to the usual tell is spent when it lands. A light blow in all else: the gold glow in its last 0.15 s, the light damage.
// One wind-up in four, as the heavy: a seeded roll of its own (`feint`, on the id and the blow's count) after the heavy roll has said
// light, never twice running; `roll` is that roll's odds on a light blow, which lands one in four in all (25.1% of 4,000, tests/feint).
const FEINT_ROW=(o)=>Object.assign({share:.25,roll:.43,pause:.3},o);
// S1162 — the two-hit string (combat.md's move sets; Michael's A on DECISION #438): the wolf's lunge and snap, the troll's sweep and
// stamp. The first blow is a light blow as any; the second follows `gap` (0.45 s, TELL_MIN) after it, a wind-up of its own with its
// own gold glow in its last 0.15 s, so one roll cannot cover both. Each is a light blow. The wolf's snap is a second bite at its own
// reach and arc with no second leap; the troll's stamp reaches `reach` (1.6 m, hull to hull) all round it. A parried first blow
// staggers the foe and the second never comes. One wind-up in four, as the feint: its own seeded roll (`string`) after the heavy roll.
const STRING_ROW=(o)=>Object.assign({share:.25,roll:.43,gap:TELL_MIN},o);
const FOE_ATTACKS={
  humanoid: FOE_ROW({tells:{Goblin:.51,'Kobold Thief':.45,Skeleton:.60,Bandit:.57},hulls:true,engage:1.2,heavy:HEAVY_ROW({}),feint:FEINT_ROW({})}),
  beast:    FOE_ROW({hulls:true,engage:.6,lunge:1.5,reach:.9,arc:70,heavy:HEAVY_ROW({}),string:STRING_ROW({})}),
  spider:   FOE_ROW({tells:{Spider:.51},hulls:true,engage:.8,reach:1.2,arc:100,heavy:HEAVY_ROW({})}),
  brute:    FOE_ROW({tells:{Golem:.90,Gargoyle:.80},hulls:true,engage:.8,reach:1.2,arc:100,heavy:HEAVY_ROW({})}),
  troll:    FOE_ROW({tells:{'Cave Troll':.83,'Forest Troll':.83},hulls:true,engage:1.6,reach:2.4,arc:140,heavy:HEAVY_ROW({}),string:STRING_ROW({reach:1.6,arc:360})}),
  slime:    FOE_ROW({tells:{Slime:.54,'Small Slime':.54},heavy:HEAVY_ROW({})}),
  elemental:FOE_ROW({tells:{'Fire Elemental':.65},heavy:HEAVY_ROW({})}),
  wraith:   FOE_ROW({tells:{Phantom:.54,Wraith:.57},heavy:HEAVY_ROW({})}),
  mimic:    FOE_ROW({tells:{Mimic:.57},heavy:HEAVY_ROW({})}),
  shark:    FOE_ROW({}),
  boss:     FOE_ROW({}), // the tell is the boss's own (bossDef.telegraphBase by phase), the reach its biteRange
  slam:     FOE_ROW({tell:.9,reach:3,arc:360,blockable:false,parryable:false}), // the cavern master's (S404, S617): its blow is a share of your health
};
// every kind's tell by name, as Session 282 kept them (telegraphDuration and tests/tells read it)
const TELEGRAPH_BY_NAME=Object.assign({},...Object.values(FOE_ATTACKS).map(r=>r.tells));
const FOE_FAMILY_OF={Skeleton:'humanoid',Goblin:'humanoid','Kobold Thief':'humanoid',Shieldbearer:'humanoid',Bandit:'humanoid',
  Golem:'brute',Gargoyle:'brute','Cave Bear':'brute',Ogre:'brute',Phantom:'wraith',Slime:'slime','Small Slime':'slime',
  'Fire Elemental':'elemental',Mimic:'mimic',Spider:'spider','Shore Wisp':'spider',Shark:'shark'};
const FOE_SHAPE_FAMILY={humanoid:'humanoid',wolf:'beast',spider:'spider',brute:'brute',shark:'shark'};
function foeFamily(e){
  if(!e)return 'humanoid';
  if(/Troll/.test(e.baseType||e.name||''))return 'troll';
  if(e.isBoss)return 'boss';
  if(e.isWraith)return 'wraith';
  return FOE_FAMILY_OF[e.baseType||e.baseName]||FOE_SHAPE_FAMILY[e.shape]||'humanoid';
}
function foeAttack(e){return FOE_ATTACKS[foeFamily(e)];}
// S1136 — the heavy blow's row for this foe (a boss keeps its own phases), its roll at a wind-up, and the tell that wind-up runs
function foeHeavyRow(e){if(!e||e.isBoss)return null;const r=foeAttack(e);return r&&r.heavy||null;}
function foeHeavyRoll(e){
  const H=foeHeavyRow(e);if(!H)return false;
  const n=e._blowN=(e._blowN||0)+1;
  if(e._heavyLast){e._heavyLast=false;return false;}
  const u=seededRng('heavy',(e.id||e.baseType||e.baseName||e.name||'foe')+':'+n)(); /* a foe with no id yet rolls on its kind's name, still seeded */
  return e._heavyLast=u<H.share/(1-H.share); /* a third after a light blow: never twice running, still one in four in all */
}
// S1140 — the feint's row (humanoids only, so far) and its roll, made only on a wind-up the heavy roll has left light
function foeFeintRow(e){if(!e||e.isBoss)return null;const r=foeAttack(e);return r&&r.feint||null;}
function foeFeintRoll(e){
  const F=foeFeintRow(e);if(!F)return false;
  if(e._feintLast){e._feintLast=false;return false;}
  const u=seededRng('feint',(e.id||e.baseType||e.baseName||e.name||'foe')+':'+(e._blowN||0))();
  return e._feintLast=u<F.roll;
}
// S1162 — the string's row (wolves and trolls) and its roll, made as the feint's on a wind-up the heavy roll has left light
function foeStringRow(e){if(!e||e.isBoss)return null;const r=foeAttack(e);return r&&r.string||null;}
function foeStringRoll(e){
  const S=foeStringRow(e);if(!S)return false;
  if(e._stringLast){e._stringLast=false;return false;}
  const u=seededRng('string',(e.id||e.baseType||e.baseName||e.name||'foe')+':'+(e._blowN||0))();
  return e._stringLast=u<S.roll;
}
// S1162 — after a string's first blow (landed, blocked, rolled or whiffed): the second wind-up, `gap` long, facing you anew. Not
// after a perfect parry (the foe is staggered) or a death. Returns true when the second blow is armed.
function foeStringNext(e){
  if(e._string!==1){e._string=0;return false;}
  if(e.dead||e.hp<=0||isStaggered(e)){e._string=0;return false;}
  const S=foeStringRow(e);if(!S){e._string=0;return false;}
  e._string=2;e._heavy=false;e._feint=0;e.telegraphMax=e.telegraphT=S.gap;
  const T=targetOf(e);if(T)e.combatYaw=Math.atan2(T.x-e.x,T.z-e.z);
  if(typeof sndTelegraph==='function')sndTelegraph();
  return true;
}
function foeWindUp(e){
  const base=telegraphDuration(e);e._heavy=foeHeavyRoll(e);e._feint=0;e._string=0;
  if(e._heavy){e._feintLast=false;e._stringLast=false;return Math.max(foeHeavyRow(e).tell,base+foeHeavyRow(e).add);}
  if(foeFeintRoll(e)){e._feint=foeFeintRow(e).pause;return base+e._feint;} /* the pose tops out at base and holds (telegraphPulse) */
  if(foeStringRoll(e))e._string=1; /* S1162 — a light blow, and the second follows it (foeStringNext) */
  return base;
}
// S1041 — the weapon a person-bodied foe holds (its genome's, 32-people.js), and that weapon's reach from your table: a knife
// the dagger's 1.2, the rest (sword, axe, mace, cutlass, and the staff the sheet does not list) the sword's 1.6
// S1462 — a spear is your Spear's row (Michael's A on #755): 2.4 m in a 40° line, the Skeleton's, the Ash Wight's and a Deserter's.
// Only its reach and arc are the row's; its tell, damage, heavy blow and feint stay the humanoid's. It starts its tell as much
// farther out as its reach is past the sword's (2.0 m, hull to hull), so a spearman thrusts from its own distance.
const FOE_WPN_ROW={dagger:'Dagger',sword:'Sword',axe:'Mace',mace:'Mace',cutlass:'Scimitar',spear:'Spear',fists:'Fists'};
function foeWeaponKind(e){if(e&&e._disarmed)return 'fists';const P=e&&e.limbs&&e.limbs.person,G=P&&P.g;return G?(G.gear==='spear'?'spear':G.wpn||null):null;}
function foeWeaponRow(e){return WEAPON_ATTACKS[FOE_WPN_ROW[foeWeaponKind(e)]||'Sword'];}
function foeWeaponReach(e){return foeWeaponRow(e).reach;}
function foeWeaponArc(e,deg){const k=foeWeaponKind(e);return k==='spear'?WEAPON_ATTACKS.Spear.arc:deg;}
// a foe's reach, centre to centre: engage (its tell starts inside it; null = the place's own, 1.1 or 0.9), the blow, its arc,
// and the wolf's lunge. A boss with a bite (the Faolchú) engages and bites at its biteRange less 0.9 (its snout), hull to hull.
function foeReach(e,inDun){
  const r=foeAttack(e);
  if(e&&e.isBoss&&e.bossDef&&e.bossDef.biteRange){const b=reachTo(e,e.bossDef.biteRange-.9);return {engage:b,blow:b,deg:r.arc,lunge:0};}
  if(!r.hulls)return {engage:inDun?.9:1.1,blow:r.reach,deg:r.arc,lunge:0};
  const hum=foeFamily(e)==='humanoid',blow=hum?foeWeaponReach(e):r.reach,L=r.lunge||0;
  const eng=r.engage+(hum?Math.max(0,blow-WEAPON_ATTACKS.Sword.reach):0); /* S1462 — the spear's 0.8 past the sword */
  return {engage:reachTo(e,eng+L),blow:reachTo(e,blow),deg:hum?foeWeaponArc(e,r.arc):r.arc,lunge:L,stand:reachTo(e,eng)};
}
// ── Armour as a share (decision #181 B, held for this table): every blow on you is × 50 / (50 + armour), so 50 armour
// halves it and nothing reaches 1 by armour alone. It replaces the flat half a point a point that put the cliff between
// 20 and 40 armour (S610). Retuned so an ordinary blow of your level's tier, at a heavy kit of your level, lands near
// BLOW_SHARE of your health: the reference player has 100 + 15 a level of health and wears the heavy kit of the
// material the loot reaches at their level (tier 1 + 0.4 a level), helmet to boots and a buckler. The ordinary blow is
// today's at level 1, a Skeleton's in a normal dungeon (15 × 2.0) and a Bandit's in the open world (7); a foe's own roll
// is scaled from that, so every kind keeps its place against the others. The slam stays a share of your health (S617).
// BLOW_SHARE is a sixth, Michael's B on DECISION #355 (S949): six unguarded blows to fall, about eight through a held block.
// It is .17, not 1/6: at exactly a sixth the rounding left 1 health after the sixth blow at levels 10 and 20.
const ARMOUR_K=50,BLOW_SHARE=.17,BLOW_ORDINARY={dungeon:30,world:7},KIT_PIECES=['Helmet','Cuirass','Gauntlets','Greaves','Boots','Buckler'];
function armourShare(d,arm){const a=Math.max(0,arm==null?_armour():arm);return d*ARMOUR_K/(ARMOUR_K+a);}
function hpRef(L){return 100+15*(Math.max(1,L)-1);}
function kitTier(L){return Math.min(10,Math.max(1,Math.floor(1+Math.max(1,L)*.4)));}
function kitRef(L){const b=TIER_BASE_DEF[kitTier(L)];return KIT_PIECES.reduce((a,t)=>{const T=ARMOR_TYPES.find(x=>x.type===t);return a+(T?Math.max(1,Math.round(b*T.defMult)):0);},0);}
// the blow before armour that lands at BLOW_SHARE of the reference health at level L
function blowRef(L){return BLOW_SHARE*hpRef(L)*(ARMOUR_K+kitRef(L))/ARMOUR_K;}
// a foe's roll before armour, as each place rolled it (the open world's kinds carry dmg, the dungeon's a dmgMult on 10–20)
function foeBlowRaw(e){return typeof e.dmg==='number'?e.dmg+Math.floor(foeRand(e)*4):(10+Math.floor(foeRand(e)*11))*(e.dmgMult||1);}
function foePlaceK(e){return blowRef(1)/(typeof e.dmg==='number'?BLOW_ORDINARY.world:BLOW_ORDINARY.dungeon);}
// the blow that reaches you: the roll, the row's multiplier, the place's scale, then your armour's share
function foeBlow(e,raw,arm){const r=foeAttack(e);return Math.max(1,Math.round(armourShare((raw==null?foeBlowRaw(e):raw)*r.dmg*foePlaceK(e)*(e&&e._disarmed?CATCH_BLOW:1)*(e&&e._heavy&&r.heavy?r.heavy.dmg:1),arm)));} /* S1079 — a disarmed foe's fists, half its blow */

// ── The one resolver for your swing (S940). The dungeon, the open world and the legacy zones each had their own
// (_resolveDungeonStrike, _resolveZoneStrike), the same rules written twice; both are now this. At the swing's impact
// it gathers the foes in reach (hull to hull, S1035) and in the arc of the weapon's row, nearest first, up to the
// row's cleave; a power blow breaks a raised shield without damage (S485: not when swung spent), every other blow runs
// the damage chain, applyMeleeDamage (riposte, finisher, stagger, backstab, armour), posture, the rune's rider and
// the kill. The third light swing of a chain lands ×1.3 and drains ×1.5 posture (COMMIT, the light chain).
function strikeFoes(){return isOverworldZone()?ZE:ENEMIES;}
function strikeCandidate(e){
  if(!e||e.dead||e.locked)return false;
  if(!isOverworldZone()&&(e.floor!==currentFloor||e.disguised))return false;
  return true;
}
// The damage chain, one function a skills build can swap: the weapon's roll on the struck foe's stream, today's flat
// level × 1.5, Might's 1% a point, the melee buffs, the power blow's ×1.8, a shield's front, the row and the chain.
function meleeDamageChain(e,o){
  const w=EQ.weapon,fa=!w&&perk('hand',100)?STONE_HAND_ATK:FISTS.atk,lo=w?w.atk[0]:fa[0],hi=w?w.atk[1]:fa[1]; // S1051 — Stone hand (Hand-to-hand 100)
  const mightMult=1+(attrEff('might')*ATTR_DMG_PER_POINT);
  const meleeBuff=_buffMult('meleeDmg',1)*_buffMult('dmgBurst',1); // S322 — Firemoss and Caor Dubh everywhere
  const powerMult=o.isPow?POWER_DMG_MULT:1.0;
  // S941 — the weapon's skill carries the damage, ×0.64 at 5 to ×1.4 at 100; the flat level × 1.5 is gone (skills and perks A)
  return Math.floor((lo+Math.floor(foeRand(e)*(hi-lo)))*skillMult(weaponSkill(w))*mightMult*meleeBuff*powerMult*o.shMult*o.row.dmg*o.chainDmg);
}
function staggerFlash(e){
  const body=enemyBodyMesh(e),m=body&&body.material;
  if(m&&m.emissive){m.emissive.setHex(0xffaa00);setTimeout(()=>{if(m&&m.emissive)m.emissive.setHex(0);},220);}
}
function resolvePlayerStrike(_isPow){
  sndSwing();
  const inW=isOverworldZone(),row=weaponAttack(EQ.weapon);
  const third=!_isPow&&SWING&&SWING.chain===3;
  const chainDmg=third?COMMIT.chainDmg:1,chainPost=third?COMMIT.chainPosture:1;
  const _cleaveCap=(EQ.weapon&&EQ.weapon.cleaveTargets)||row.cleave||CLEAVE_DEFAULT;
  const cosArc=Math.cos(row.arc*Math.PI/360);
  const _candidates=[];
  strikeFoes().forEach(e=>{
    if(!strikeCandidate(e))return;
    const ex=e.x-px,ez=e.z-pz,dist=Math.sqrt(ex*ex+ez*ez);
    const reach=reachTo(e,row.reach);
    if(dist<reach&&(ex*fwdX+ez*fwdZ)/(dist||1)>cosArc)_candidates.push({e,dist});
  });
  _candidates.sort((a,b)=>a.dist-b.dist);
  if(!_candidates.length&&activeZoneId==='world'&&typeof WORLD!=='undefined'&&WORLD.strikeNpc)WORLD.strikeNpc(fwdX,fwdZ); // S157 — assault
  const out=[];
  let _hitsLanded=0;
  for(const _c of _candidates){
    if(_hitsLanded>=_cleaveCap)break;
    const e=_c.e;
    _hitsLanded++;
    // v65 — a power blow on a raised shield: pure stagger, no damage, the guard down. S485 — a power attack swung on too
    // little stamina (_exhaustedStrike) does not break the guard (Michael's A on #131): it lands as a guarded hit.
    const _spent=_isPow&&e.shieldUp&&!riposteOpen(e)&&_exhaustedStrike;
    if(_isPow&&e.shieldUp&&!riposteOpen(e)&&!_spent){
      if(typeof e.posture==='number'&&!isStaggered(e)){
        applyPostureDamage(e,(e.maxPosture||999),performance.now()/1000);
        staggered.push({e,t:dazeS(POSTURE_BREAK_STUN)}); /* S1051 — Daze (Blunt 75) */
        staggerFlash(e);
      }
      e.shieldUp=false;dropShieldGuard(e);e.alert=true;
      if(armsPerk('blunt',50))e._rung=true; /* S1077 — Ringing (Blunt 50, Michael's A on #399): the shield stays down for the fight (reraiseGuard) */
      sndPowerHit();
      showMsg(`💥 ${e.name}'s guard breaks!`,'#ffcc66');
      out.push({e,guardBroke:true});
      continue;
    }
    // v71 — a Shieldbearer's front takes SHIELDBEARER_FRONT_BLOCK of the blow (shieldFrontMult is 1 for the rest)
    const shMult=riposteOpen(e)?1:shieldFrontMult(e);
    const _wasAlert=!!e.alert; /* S941 — a hit on a foe already alert is a use of the weapon's skill */
    const rawDmg=meleeDamageChain(e,{isPow:_isPow,shMult,row,chainDmg});
    const info=applyMeleeDamage(e,rawDmg);
    const dmg=info.dmg;
    {const ws=weaponSkill(EQ.weapon);if(_wasAlert&&ws)skillUse(ws,(info.riposte||info.finisher)?3:1,e);else if(info.backstab)skillUse('stealth',3,e);}
    e.hp=Math.max(0,e.hp-(e._stun>0?dmg*2:dmg)); // a dazed beast (S634) takes double
    if(e.hpFg){e.hpFg.scale.x=e.hp/e.maxHp;e.hpFg.position.x=(e.hp/e.maxHp-1)*.275;}
    e.alert=true;if(inW)alertPack(e,16);
    if(_isPow)sndPowerHit();else sndHitEnemy(info.wType,info.resistMult<.8);
    // v61gj — posture: the row's drain (8, ×postureMult on the two-handers), a power blow's POSTURE_DRAIN_POWER × the
    // weapon's postureMult, the chain's third ×1.5; skipped on a kill or a foe already staggered
    if(e.hp>0&&typeof e.posture==='number'&&!isStaggered(e)){
      const pm=(EQ.weapon&&EQ.weapon.postureMult)||1;
      const drain=(_isPow&&!_spent?POSTURE_DRAIN_POWER*pm:row.posture)*chainPost*armsPostureMult()*(SWING&&SWING.drawCut&&armsPerk('blade',25)?DRAW_CUT_POSTURE:1); // S485 — a spent power blow on a guard drains as the guarded hit it is; S1051 — Weight (Blunt 25), Hard knuckles (Hand-to-hand 25)
      if(applyPostureDamage(e,drain,performance.now()/1000)){
        staggered.push({e,t:dazeS(POSTURE_BREAK_STUN)});staggerFlash(e);
        showMsg(`💥 ${e.name} staggered!`,'#ffcc66');
      }
    }
    const _guardTag=(shMult<1.0)?' (GUARDED)':'';
    const _killTag=`${_isPow?' (POWER)':''}${info.backstab?' (BACKSTAB)':''}${info.finisher?' (FINISHER)':info.riposte?' (RIPOSTE)':info.crit?' (CRIT)':''}${_guardTag}${dmgTag(info,e)}`;
    dmgNum(e,dmg,info,{guarded:shMult<1.0,power:_isPow}); /* S761 — the blow's number at its head (#198 A) */
    const kill=()=>{if(inW)killZoneEnemy(e,activeZoneId==='forest'?forestScene:ironhavenScene,_killTag);else killE(e,_killTag);};
    if(e.hp<=0)kill();
    else{
      const enc=applyWeaponEnchant(dmg,e);
      dmgNumRider(e,enc);
      if(e.hp>0&&BLADE_POISON)bladePoisonHit(e); /* S1483 — a poisoned blade, three blows */
      if(e.hp<=0)kill();
      else if(_spent)showMsg('Too spent to break the guard.','#ff9944');
    }
    out.push({e,dmg,info,third});
  }
  // S1051 — Earthshaker (Blunt 100): the chain's third hit, landed, staggers every foe within 2 m of you
  if(third&&armsPerk('blunt',100)&&out.some(o=>o.dmg>0)){const nowS=performance.now()/1000;
    strikeFoes().forEach(f=>{if(!strikeCandidate(f)||f.hp<=0||isStaggered(f)||Math.hypot(f.x-px,f.z-pz)>EARTHSHAKER_R+hullOf(f))return;
      staggered.push({e:f,t:dazeS(1.2)});staggerFlash(f);f.alert=true;out.push({e:f,shaken:true});});}
  document.getElementById('df').style.boxShadow='inset 0 0 28px rgba(220,160,60,.4)';
  setTimeout(()=>document.getElementById('df').style.boxShadow='',150);
  return out;
}
// ── Commitment (combat B): during a swing's wind-up and strike you move at ×0.35 and turn at most 90° a second; only
// the recovery, the last third, cancels into a roll or a block. Light swings chain: three in a row, the third ×1.3 damage
// and ×1.5 posture, the chain lost after 0.4 s idle (from the end of the last swing to the start of the next). A potion
// takes 0.8 s at walking pace and works when it is down. Every time is on the play clock (playClockS), against the
// swing's own start, so a dropped frame changes nothing and a host could run it.
const COMMIT={move:.35,turnDeg:90,chainIdle:.4,chainDmg:1.3,chainPosture:1.5,drinkS:.8,drinkMove:.5};
let SWING=null,CHAIN={n:0,endG:-1e9},DRINK=null;
// S1080 — the sheath (Michael's A on #399, with his note: "a 'sheath' button where you can sheath your equipped weapon. Torches or
// shields in your off hand stay equipped and in hand"). H sheathes the weapon in hand, or draws it. A drawn weapon is sheathed on
// its own after SHEATH_IDLE_S with no swing and no alert foe within SHEATH_FOE_R (the lock-on's 14 m). Sheathed, the first-person
// view is the empty hand's (buildViewmodel with the weapon held aside for the call); the off hand's shield or torch is built on its
// own and stays. A swing begun sheathed draws as it swings: that swing is the draw cut, and with Draw cut (Blade 25) it drains ×2
// posture. A bow is not sheathed (its draw is the aim). Changing the weapon in hand draws the new one.
const SHEATH_IDLE_S=5,SHEATH_FOE_R=14,DRAW_CUT_POSTURE=2;
let SHEATHED=false,_sheathedItem=null,_lastSwingG=-1e9;
function sheathable(){return !!EQ.weapon&&weaponSkill(EQ.weapon)!=='bow';}
function sheathView(){const w=EQ.weapon;if(SHEATHED)EQ.weapon=null;try{if(typeof buildViewmodel==='function')buildViewmodel();}finally{EQ.weapon=w;}}
function sheathWeapon(){if(SHEATHED||SWING||!sheathable())return false;SHEATHED=true;_sheathedItem=EQ.weapon;sheathView();return true;}
function drawWeapon(){if(!SHEATHED)return false;SHEATHED=false;_sheathedItem=null;if(EQ.weapon)sheathView();return true;}
function toggleSheath(){if(SHEATHED){drawWeapon();showMsg(`You draw the ${EQ.weapon?EQ.weapon.name:'weapon'}.`,'#c8b880');}
  else if(sheathWeapon())showMsg(`You sheathe the ${EQ.weapon.name}.`,'#c8b880');}
function tickSheath(){
  if(SHEATHED&&EQ.weapon!==_sheathedItem){SHEATHED=false;_sheathedItem=null;sheathView();return;}
  if(SHEATHED||SWING||!sheathable()||playClockS-_lastSwingG<SHEATH_IDLE_S)return;
  for(const f of strikeFoes()||[])if(f&&f.alert&&!f.dead&&f.hp>0&&Math.hypot(f.x-px,f.z-pz)<SHEATH_FOE_R)return;
  sheathWeapon();
}
// a swing begins: its times from the weapon's row (a power blow keeps powerDur), scaled by what a buff does to its pace
function beginSwing(isPow,resolveFn){
  const _drawCut=drawWeapon();_lastSwingG=playClockS; /* S1080 — a swing from the sheath draws as it goes */
  const row=weaponAttack(EQ.weapon),buff=_buffMult('atkSpeed',1);
  const total=isPow?ANIM_PARAMS.swing.powerDur*_weaponSwingFactor():(row.tell+row.strike+row.recovery)/buff;
  const k=isPow?total/(row.tell+row.strike+row.recovery):1/buff;
  let chain=0;
  if(!isPow){chain=(CHAIN.n>0&&CHAIN.n<3&&playClockS-CHAIN.endG<=COMMIT.chainIdle)?CHAIN.n+1:1;CHAIN.n=chain;}else CHAIN.n=0;
  SWING={t0:playClockS,tell:row.tell*k,strike:row.strike*k,recovery:row.recovery*k,total,isPow:!!isPow,chain,drawCut:_drawCut};
  _commitYaw=yaw; // a turn made before the click is yours; the clamp holds from here
  CHAIN.endG=playClockS+total;
  swingT=total;
  sndWhoosh(); // v69.1 — the whoosh at the swing's start; the contact and the hit at impact (_pendingStrike)
  _pendingStrike={resolveFn,isPow:!!isPow,fired:false};_swingStartS=performance.now()/1000;_offenceS=playClockS;
  return SWING;
}
function swingPhase(nowG){
  if(!SWING)return null;
  const t=(nowG==null?playClockS:nowG)-SWING.t0;
  if(t<0||t>=SWING.total){return null;}
  return t<SWING.tell?'tell':t<SWING.tell+SWING.strike?'strike':'recovery';
}
function swingCommitted(nowG){const p=swingPhase(nowG);return p==='tell'||p==='strike';}
// a roll or a block in the recovery cuts the swing short (its hit has landed); in the wind-up or the strike it is refused
function swingCancel(){if(!SWING)return;SWING=null;swingT=Math.min(swingT,.001);if(_pendingStrike&&!_pendingStrike.fired)_pendingStrike=null;}
// the right button: the guard goes up, unless a swing is committed (its recovery it cuts short)
function raiseGuard(){
  if(swingCommitted())return false;
  swingCancel();
  blocking=true;lastBlockAttemptT=performance.now()/1000;lastBlockAttemptG=playClockS;
  return true;
}
function commitMoveMult(){return swingCommitted()?COMMIT.move:castWinding()?WEAPON_ATTACKS.Cast.walk:(DRINK||xbowSpanning()||warBowDrawn())?COMMIT.drinkMove:1;} /* S1549 — and a war bow drawn */ /* S1457 — a crossbow is spanned at a potion's walk */
// the turn this frame, held to 90° a second while committed: the view's yaw is pulled back toward last frame's
let _commitYaw=null;
function commitTurn(dt){
  if(swingCommitted()&&_commitYaw!=null){
    const max=COMMIT.turnDeg*Math.PI/180*dt;let d=yaw-_commitYaw;d=Math.atan2(Math.sin(d),Math.cos(d));
    if(Math.abs(d)>max)yaw=_commitYaw+Math.sign(d)*max;
  }
  _commitYaw=yaw;
}
// a potion: out of the bag now, into you when the 0.8 s are up (tickDrink in the loop)
function startDrink(apply,name){
  if(DRINK)return false;
  DRINK={t0:playClockS,apply,name};
  try{sndUsePotion();}catch(err){}
  return true;
}
function tickDrink(){
  if(!DRINK)return;
  if(dead){DRINK=null;return;}
  if(playClockS-DRINK.t0<COMMIT.drinkS)return;
  const d=DRINK;DRINK=null;d.apply();
}

function applyMeleeDamage(e, rawDmg){
  if(_exhaustedStrike)rawDmg=Math.max(1,Math.floor(rawDmg*.45)); // v80 S9 — exhausted swings land soft
  const effDef = (finisherOpen(e,performance.now()/1000)&&armsPerk('blade',100)) ? 0 : (e.def || 0); // S1051 — Clean edge (Blade 100)
  // Dormant enemies take 2× damage here too — consistent behavior across melee and magic.
  const dormantMult = e.dormant ? 2.0 : 1.0;
  // Physical damage-type resistance. Weapon's wType ('slash'/'pierce'/'blunt') looked up in enemy.resist.
  // Undead resist pierce; stone creatures resist slash; ethereals resist all physical; blunt shatters bones/stone.
  const wType = weaponDamageType(EQ.weapon);
  const physResistMult = (e.resist && e.resist[wType] !== undefined) ? e.resist[wType] : 1.0;
  // v61gj — Staggered-crit bonus. Striking an enemy currently in the staggered[]
  // list applies POSTURE_CRIT_MULT (×1.5) before resist + def. This is the payoff
  // the parry-into-staggered-crit chain delivers, and the reward Bram's dialog
  // ("a perfect parry costs you nothing and staggers the attacker") has been
  // promising since v61c6. Posture-break triggers the same staggered[] entry, so
  // posture-break also unlocks the crit bonus — both routes feel rewarding.
  const _nowS = performance.now()/1000, _fin = finisherOpen(e,_nowS), _rip = !_fin && riposteOpen(e);
  const staggerMult = _fin ? FINISHER_MULT : _rip ? RIPOSTE_MULT : isStaggered(e) ? POSTURE_CRIT_MULT : 1.0;
  if(_fin){ e._finUntil = 0; e._ripUntil = -1e9; FINISHER_SAFE_UNTIL = _nowS + FINISHER_SAFE_S; }
  if(_rip) e._ripUntil = -1e9;
  if(!_fin && !_rip && isStaggered(e) && armsPerk('hand',50) && !(e._downUntil > _nowS)) throwFoe(e, _nowS); // S1078 — Throw (Hand-to-hand 50)
  // v63 — Backstab multiplier (Combat Redesign Session 2). Stacks
  // multiplicatively with staggerMult so dagger + parry-staggered enemy
  // = ×3.0 × ×1.5 = ×4.5, the canonical burst-window combo. See
  // applyBackstab for the trigger rules and exclusion list.
  const backstabMult = applyBackstab(e);
  const luckMult = _fortuneCrit(e);
  const dmg = challengeDealt(Math.max(1, Math.round(rawDmg * dormantMult * physResistMult * staggerMult * backstabMult * luckMult) - effDef)); /* S684 — the challenge */
  return {dmg, resistMult: physResistMult, wType, crit: staggerMult > 1.0 || luckMult > 1.0, lucky: luckMult > 1.0, backstab: backstabMult > 1.0, riposte: _rip, finisher: _fin, spent: !!_exhaustedStrike};
}

// Execute a dungeon enemy's melee strike AFTER its telegraph has completed. Re-checks range so
// a player kiting away during the wind-up causes a whiff (lunge animation + swing SFX, no damage).
// Handles perfect-parry / late-block / unblocked-hit branches just like the old inline block.
// Shared strike resolver — handles the parry/late-block/unblocked three-way branch.
// Extracted from executeDungeonStrike in v61l so zone combat can share it. Pre-v61l,
// the zone path in tickZoneEnemies applied straight damage with no `blocking` check,
// so raising guard on the overworld was cosmetic — stamina drained, damage didn't.
// Callers compute their own rawDmg (dungeon and zone have independently tuned formulas)
// and pass it in; this function handles everything downstream of that.
// S275 — an enemy's blow lands in an arc about the way it faced when it wound up (combatYaw, frozen at the wind-up):
// 1.6 units and 90° for most, 2.4 units and 140° for a troll's sweep, a boss's own reach where it has one. Before, it
// hit anyone within 1.4 units (1.3 in a dungeon) whichever way it faced.
// S940 — the reach and the arc are the family's row in the attack table (FOE_ATTACKS).
// S1041 — F2b: the reach is foeReach's blow, hull to hull for the families the sheet names (see FOE_ATTACKS).
function strikeArc(e){const f=foeReach(e);if(e&&e._string===2){const S=foeStringRow(e);if(S&&S.reach!=null)return {reach:reachTo(e,S.reach),deg:S.arc};}return {reach:f.blow,deg:f.deg};} /* S1162 — the troll's stamp, all round */
// S1041 — the wolf's lunge (F2b): at the bite it leaps along the line it wound up on (combatYaw), up to its lunge, to stand at
// its engage distance from you, so a wolf that started its tell from 2.1 hull to hull still bites a player who stood still,
// and one who stepped aside during the tell is bitten at the end of the leap only if still in its 70°.
function foeLunge(e,solid){
  const f=foeReach(e);if(!f.lunge||typeof e.combatYaw!=='number')return 0;
  const sx=Math.sin(e.combatYaw),sz=Math.cos(e.combatYaw),along=(px-e.x)*sx+(pz-e.z)*sz;
  const go=Math.max(0,Math.min(f.lunge,along-f.stand));if(go<=0)return 0;
  let d=0;while(d<go-1e-6){const st=Math.min(.1,go-d);if(solid&&solid(e.x+sx*(d+st),e.z+sz*(d+st)))break;d+=st;}
  e.x+=sx*d;e.z+=sz*d;return d;
}
function strikeReaches(e,arc){
  arc=arc||strikeArc(e);
  const dx=px-e.x,dz=pz-e.z,d=Math.hypot(dx,dz);
  if(d>arc.reach)return false;
  if(typeof e.combatYaw!=='number'||d<.35)return true;
  return (dx*Math.sin(e.combatYaw)+dz*Math.cos(e.combatYaw))/d>=Math.cos(arc.deg*Math.PI/360);
}
// S564 — undo a perfect parry's flash: the body's own material back (see executeStrike)
function parryFlashEnd(e){const P=e&&e._parryFlash;if(!P)return;e._parryFlash=null;if(P.body.material===P.fl)P.body.material=P.orig;try{P.fl.dispose();}catch(_){}}
function executeStrike(e, rawDmg, now){
  const _hv = e._heavy ? foeHeavyRow(e) : null; e._heavy = false; // S1136 — this blow's heavy row, spent with it
  // S275 — mid-roll you are not there to be hit
  if(rollUntouchable(now/1000)){sndSwing();e._lunge=.3;showMsg(`${e.name} strikes empty air.`,'#c8b880');return;}
  const sh = EQ.offhand;
  const hasShield = sh && sh.shieldType==='shield';
  // v65 — Block reduction tier (canon order):
  //   Shield equipped              → sh.block or .65 (full defense)
  //   2H weapon w/ blockReduce     → weapon.blockReduce (steel 2H: .50, wood: .40)
  //   1H no shield, or bare hand   → BLOCK_REDUCE_NO_SHIELD (.35)
  // The 2H block tier is unlocked at equip time by WEAPON_TYPES.blockReduce
  // being set. Without the field (1H entries), this falls through to the
  // bare-hand path. Encodes the "half-sword / haft-parry" canon: claymores
  // half-sword to parry, great axes / war hammers parry with their hafts.
  const w2hBlock = (!hasShield && EQ.weapon && EQ.weapon.blockReduce) || 0;
  const shieldBlock = hasShield ? (sh.block||.65) : (w2hBlock || BLOCK_REDUCE_NO_SHIELD);
  const bareBlock = BLOCK_REDUCE_NO_SHIELD;
  // v61c7 — Resolve scaling applied to ALL block-related stamina costs
  // (parry, late block). Mirrors the passive-block-drain Resolve mult:
  // each Resolve point cuts 5% off the cost, floored at 50% at Resolve 10.
  // Pre-v61c7, Resolve only helped passive holding — actual block events
  // (parries, late blocks) ignored Resolve entirely. Sentinel-style builds
  // now get a real defensive payoff in sustained multi-attacker fights.
  const _resolveMult = resolveBlockMult(); // S1047 — 1% a Resolve point (was 5%)
  // v61gj-a2 — Parry window. Pre-v61gj-a2 the parry branch was simply `if(blocking)`,
  // which meant holding the block button locked in a perfect parry on every incoming
  // hit (no timing required, no skill check). Bram's canon dialog ("block early, not
  // late — a perfect parry, blocking BEFORE the blow lands, costs you nothing and
  // staggers the attacker") promised a skill mechanic the implementation didn't
  // deliver. Now: parry only fires if the block was raised within the last N seconds,
  // where N = 200ms base + 10ms per Finesse point. Holding past the window falls
  // through to the held-block branch (the previously-named "late block" branch,
  // which has been dead code since v61c6 because the parry branch always ate first).
  const _parryWindow = parryWindowS(); // S1047 — Guard's, 160 ms + 1 ms a level
  const _justRaisedBlock = (playClockS - lastBlockAttemptG) < _parryWindow || secondParryOpen(); // S1048 — Second parry (Guard 100)
  const _row = foeAttack(e); // S940 — the blow's row: whether a guard takes it, whether it parries, what it drains from your posture
  if(blocking && _justRaisedBlock && _row.parryable){
    // PERFECT PARRY — block raised within the timing window before the hit landed
    hurtT = 0;
    sndParry(); blockFlashT = 0.55; blockFlashCol = '#ffd700';
    let _parryBroke = false;
    if(typeof e.posture==='number' && !isStaggered(e)) _parryBroke = applyPostureDamage(e, (e.maxPosture||0)*RIPOSTE_POSTURE, now/1000);
    staggered.push({e, t:dazeS(_parryBroke?POSTURE_BREAK_STUN:1.2)});
    e._ripAt = now/1000; e._ripUntil = now/1000 + riposteSecs(); // S1051 — Long riposte (Blade 50), Daze (Blunt 75)
    if(armsPerk('blade',75)){ // S1051 — Crossing (Blade 75): the nearest other alert foe within 3 m is staggered too
      let o2=null,d2=CROSSING_R;for(const f of strikeFoes()){if(f===e||!strikeCandidate(f)||!f.alert||f.hp<=0||isStaggered(f))continue;const d=Math.hypot(f.x-px,f.z-pz);if(d<=d2){d2=d;o2=f;}}
      if(o2){staggered.push({e:o2,t:1.2});staggerFlash(o2);o2.atkCd=Math.max(o2.atkCd||0,2.0);}}
    if(armsPerk('hand',75))catchBlade(e); // S1079 — Catch the blade (Hand-to-hand 75)
    e.atkCd = 2.0;
    // v61d1 — Route the stagger flash through enemyBodyMesh(e) instead of
    // mesh.children[0]. Pre-v61d1 this was children[0].material assignment,
    // which silently absorbed on humanoid/brute/wolf-shaped enemies (their
    // children[0] is a leg-pivot Group). The yellow flash now actually
    // renders on the torso of every enemy shape — goblins, trolls, the
    // Faolchú, the lessers — bringing the visual into parity with the
    // sndParry audio cue that had been carrying the feedback alone.
    // S564 — the flash is a tinted copy of the body's own material, and the undo puts that material back, alive or dead.
    // It was a new plain Lambert: on a skinned body (the people-bodied foes, the skeleton among them) that draws the bind
    // pose, the undo made another plain one, and a foe killed inside the 1.2 s kept the yellow one over its ragdoll,
    // standing (Michael, 5 Oct). killE and killZoneEnemy end it before they darken the corpse.
    const _staggerBody = enemyBodyMesh(e);
    if(_staggerBody && _staggerBody.material){
      parryFlashEnd(e);
      const orig = _staggerBody.material, fl = orig.clone();
      if(fl.color) fl.color.setHex(0xffdd44);
      if(fl.emissive) fl.emissive.setHex(0x664400);
      _staggerBody.material = fl; e._parryFlash = {body:_staggerBody, orig, fl};
      setTimeout(()=>parryFlashEnd(e), 1200);
    }
    sndParry();
    showMsg(`⚡ Perfect Parry! ${e.name} staggered — riposte!`, '#ffd700');
    lvAct.parries++;skillUse('guard',3,e);_lastParryG=playClockS;
    // v61gj-a2 — Shield/sword recoil. Forward kick — you deflected the strike outward.
    shieldImpact('parry', rawDmg, e.x, e.z);
    // v61c7 — Parry stamina cost rebalanced. WAS rawDmg (100% — meaning a
    // 32-dmg Faolchú bite parried cost 32 stamina, more than a sloppy
    // late-block at 65% of raw). That punished perfect timing. NOW: 20%
    // of raw damage as the base cost, then Resolve scaling on top. So a
    // 32-dmg parry costs 6.4 stamina at Resolve 0, ~3 at Resolve 10.
    // Floor of 1 prevents zero-cost parries against very weak attacks.
    // Math.round before Math.max so the result is always an integer.
    const parryStamCost = Math.max(1, Math.round(rawDmg * 0.20 * _resolveMult));
    stamina = Math.max(0, stamina - parryStamCost);
    if(stamina===0){ staminaCD = 2; lvAct.staminaDepleted++; }
  } else if(_row.blockable && (blocking || (now/1000 - lastHitT < 0.5 && now/1000 - lastBlockAttemptT < 0.5))){
    // HELD BLOCK — partial damage reduction. v61gj-a2 expanded this branch from
    // "recently-pressed block (within 0.5s of a hit)" to ALSO cover "currently
    // holding block but missed the parry window." Pre-v61gj-a2 this branch was
    // dead code in practice — the parry branch always ate first when `blocking`
    // was true. Now it's the proper "tank" state: shield up, damage reduced,
    // stamina cost based on absorbed damage. Also covers the original case
    // (player pressed-then-released block in the moments around a hit landing).
    // v65 — shieldBlock now encodes the full block tier (shield > 2H > bare/1H),
    // so we use it directly. The old `hasShield ? shieldBlock : bareBlock`
    // ternary collapsed back into shieldBlock for shield wielders and bareBlock
    // for everyone else — the new tier system handles all cases uniformly.
    const reduction = _blockBoost(shieldBlock);
    const blockedDmg = Math.max(1, Math.round(rawDmg*(1-reduction)));
    const absorbed = rawDmg - blockedDmg;
    const finalDmg = guardBlowCap(e, _warded(blockedDmg, e));skillUse('guard',1,e); /* S1173 — a drawn guard's blow stops at the yield's line until it is offered (#456 A) */
    PHP = Math.max(0, PHP-finalDmg); hurtT = .3; lvAct.damageTaken += finalDmg;armourUse();
    // v61c7 — Held block stamina also scales with Resolve (was raw `absorbed`).
    // Held block stays MORE expensive than parry (because 0.65 absorbed beats
    // 0.20 parry baseline at any Resolve level), so perfect timing remains the
    // cheaper choice — incentive to read the telegraph and time the press, not
    // just turtle.
    const lateBlockStamCost = Math.max(1, Math.round(absorbed * _resolveMult));
    stamina = Math.max(0, stamina - lateBlockStamCost);
    if(stamina===0){ staminaCD = 2; lvAct.staminaDepleted++; }
    sndBlock(); blockFlashT = 0.4; blockFlashCol = '#4488ff';
    // S762 — the line (*🛡 Blocked! … hits for N (reduced)*, with the shield hint) is gone: the bar's pale tail says it (#198 A)
    if(_hv && _hv.breaks && !perk('guard',75)) playerPostureHit(PPOST.maxPosture*4, now/1000, true, true); // S1136 — a heavy blow breaks the guard, unless Iron wall (Guard 75)
    else playerPostureHit(rawDmg*(_hv?_hv.posture:1), now/1000, true, !!_hv); // S281 — after the toast, so a guard that breaks says so
    // v61gj-a2 — Shield/sword recoil. Backward push — you absorbed the blow.
    shieldImpact('block', rawDmg, e.x, e.z);
    if(PHP<=0 && !dead) playerDead();
  } else {
    // Unblocked hit — apply damage reduction buffs
    const finalDmg = guardBlowCap(e, _warded(rawDmg, e)); /* S1173 — #456 A */
    PHP = Math.max(0, PHP-finalDmg); hurtT = .5;
    sndPlayerHurt(); lvAct.damageTaken += finalDmg;armourUse();
    lastHitT = now/1000;
    playerPostureHit(rawDmg*_row.posture*(_hv?_hv.posture:1), now/1000, false, !!_hv); // S281; S940 — the row's multiple (1.5 for every family today); S1136 — twice for a heavy
    e._lunge=.3; // v80 — every strike moves the body
    if(PHP<=0 && !dead) playerDead();
  }
}

// S1111 — the pounce's level is the mimic's tier's (Michael's A on #373), not yours: 15 on a tier-1 floor, 25 on a tier-3
function mimicPounceRaw(e){return (14 + foeTierLevel(e)) * ((e&&e.dmgMult)||1.0);}
function executeDungeonStrike(e, now){
  const dx2 = px - e.x, dz3 = pz - e.z, dd = Math.hypot(dx2, dz3) || 1;
  e.atkCd = 1.0;
  e.atkDir = {x: dx2/dd, z: dz3/dd};
  e.atkAnim = 0.35;
  // Whiff — player stepped out of reach during wind-up, or out of its arc (S275). Enemy still commits to the lunge.
  if(!strikeReaches(e)){ e._heavy = false; sndSwing(); foeStringNext(e); return; }
  // v61d5 — Mimic burst-pounce branch. The first strike after reveal uses
  // the burst formula (14 + level + dmgMult, scaled by .3 of def) instead
  // of the standard melee roll. This is the "pounced from a chest" hit —
  // higher than normal melee, lower than the pre-v61d5 unblockable burst
  // because executeStrike now runs the full block/parry pipeline. The
  // _burstNext flag is one-shot: cleared after the strike, so subsequent
  // attacks from this revealed mimic are normal melee.
  if(e._burstNext){
    e._burstNext = false;
    // S940 — the pounce rolls (14 + level) on its multiplier where a blow rolls 10–20, and armour takes its share as of any blow
    executeStrike(e, foeBlow(e, mimicPounceRaw(e)), now);
    return;
  }
  executeStrike(e, foeBlow(e), now); // S940 — the blow from the attack table, armour as a share
  foeStringNext(e); /* S1162 — the string's second blow */

}

// v61d5 — Mimic E-press reveal. Replaces the v61c-era proximity landmine.
// Player walks up, sees the "Press E to open chest" prompt (issued from
// the iprEl logic which now finds disguised mimics in addition to real
// chests), presses E, and THIS function fires: reveal visuals, cry, burst
// telegraph. The actual burst hit lands when the telegraph completes via
// the _burstNext branch in executeDungeonStrike. Player has a block
// window between the cry and the strike, matching every other enemy in
// the game. The "betrayal" of opening a chest-that-wasn't is preserved —
// the mimic still gets a high-damage opening hit, but it's fair.
function revealMimic(e){
  if(!e || !e.disguised) return;
  e.disguised = false;
  e.alert = true;
  e.hasCried = true;
  if(typeof sndEnemyCry==='function') sndEnemyCry('Mimic');
  if(e.limbs){
    if(e.limbs.revealEye) e.limbs.revealEye.visible = true;
    if(e.limbs.revealTeeth){ e.limbs.revealTeeth.visible = true; (e.limbs.revealTeeth.userData.rows||[]).forEach(m=>m.visible=true); }
    if(e.limbs.revealEyeGl) e.limbs.revealEyeGl.intensity = 1.4;
    if(e.limbs.hpBg) e.limbs.hpBg.visible = true;
  }
  if(e.hpFg) e.hpFg.visible = true;
  // Restore aura so the revealed monster has presence
  e.el.intensity = 0.7;
  showMsg('The chest was a Mimic!', '#ff4444');
  // Start the burst telegraph. Mimic's existing 0.32 wind-up is enough to
  // give a block-time read, and the _burstNext flag tells executeDungeonStrike
  // to use the burst formula on resolution.
  e.telegraphMax = telegraphDuration(e);
  e.telegraphT = e.telegraphMax;
  e._burstNext = true;
  if(typeof sndTelegraph==='function') sndTelegraph();
}

// S404 — the cavern master's slam (Michael's A on #95). Every 8–10 s, with you within six units, a lair's master
// (lairFinish sets e.master) stops, winds up for 0.9 s in the shared tell (the pose from e._wind, the glow in the last
// .15 s) while a ring of its reach shows on the floor, and strikes the ground. Anyone inside the 3-unit ring takes the
// slam (slamBlow: since S617 a share of your health), and no shield, block or parry takes any of it: be out of the ring, or mid-roll in the roll's
// untouchable window, when it lands. A staggered master loses its slam. Returns true while the slam is wound up, so the
// loop holds the master still and starts no other blow.
const SLAM_TELL=.9,SLAM_R=3,SLAM_NEAR=6,SLAM_EVERY=[8,10];
function slamEvery(e){return SLAM_EVERY[0]+foeRand(e)*(SLAM_EVERY[1]-SLAM_EVERY[0]);}
// S617 (Michael's C on #181) — the slam is a share of your health, not the master's blow: 45% of your max health, 60% with
// no chest piece, whatever the master, its level and your armour (S610 measured the old twice-a-blow: dead outright bare
// from level 3, 2 from 40 armour). A ward still takes its share (_warded, at the call); a block takes nothing, a roll or a
// step out of the ring all of it, as before. Two slams leave you standing only if you have a chest piece on.
const SLAM_SHARE={dressed:.45,bare:.6};
function slamBlow(e){return Math.max(1,Math.round(maxHP*(EQ.chest?SLAM_SHARE.dressed:SLAM_SHARE.bare)));}
function slamRing(e){
  if(!e._slamRing){const m=new THREE.Mesh(new THREE.RingGeometry(SLAM_R-.22,SLAM_R,48),new THREE.MeshBasicMaterial({color:0xff5a30,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.visible=false;e._slamRing=m;}
  const r=e._slamRing;if(r.parent!==dScene)dScene.add(r);r.position.set(e.x,(e.floor===2?FLOOR2_Y:0)+.04,e.z);return r;}
function slamCancel(e){e._slamT=0;telegraphReset(e);if(e._slamRing)e._slamRing.visible=false;e._slamCd=slamEvery(e);}
function tickMasterSlam(e,dt,dist,now){
  if(!e.master||e.dead)return false;
  if(e._slamCd==null)e._slamCd=slamEvery(e);
  if(e._slamT>0){
    if(isStaggered(e)){slamCancel(e);return false;}
    e._slamT-=dt;const p=1-Math.max(0,e._slamT)/SLAM_TELL;
    e.telegraphMax=SLAM_TELL;e._feint=0;telegraphPulse(e,p);
    const r=slamRing(e);r.visible=true;r.material.opacity=.15+.55*p;
    if(e._slamT>0)return true;
    e._slamT=0;telegraphReset(e);r.visible=false;e.atkCd=Math.max(e.atkCd||0,1.2);e._slamCd=slamEvery(e);e._slams=(e._slams||0)+1;
    if(typeof sfxNoise==='function')sfxNoise(.5,0,0,.32,220);
    const d=Math.hypot(px-e.x,pz-e.z);
    if(d>=SLAM_R){e._slamLast='clear';showMsg('The ground cracks where you stood.','#c8e88a');return false;}
    if(rollUntouchable(now/1000)){e._slamLast='rolled';showMsg('You roll through the blow.','#c8e88a');return false;}
    const dmg=_warded(slamBlow(e),e);PHP=Math.max(0,PHP-dmg);hurtT=.5;lastHitT=now/1000;lvAct.damageTaken+=dmg;armourUse();e._slamLast=dmg;
    if(typeof sndPlayerHurt==='function')sndPlayerHurt();updateHUD();
    showMsg(`${e.name} slams the ground under you: ${dmg}.`,'#ff6060');
    if(PHP<=0&&!dead)playerDead();
    return false;}
  if(!e.alert||e.disguised||e.dormant)return false;
  e._slamCd-=dt;
  if(e._slamCd>0||dist>=SLAM_NEAR||e.telegraphT>0||isStaggered(e))return false;
  e._slamT=SLAM_TELL;e.telegraphMax=SLAM_TELL;e.path=[];
  if(typeof sndTelegraph==='function')sndTelegraph();
  showMsg(`${e.name} rears up to strike the ground.`,'#ffb060');
  slamRing(e).visible=true;
  return true;}

// Returns a display tag showing notable resist/def interaction, or '' if fully neutral.
// Priority: defPierced (Smól Mastery) > strong weak/resist > mild weak/resist > neutral.
function dmgTag(info, e){
  if(info.defPierced && (e.def||0) > 0) return ' (Armor pierced!)';
  if(info.resistMult >= 1.45) return ' (Very weak!)';
  if(info.resistMult >= 1.25) return ' (Weak!)';
  if(info.resistMult <= 0.55) return ' (Heavily resisted)';
  if(info.resistMult <= 0.75) return ' (Resisted)';
  return '';
}

// S761 — damage numbers (Michael's A on DECISION #198, the concept artist's docs/prototypes/hud/): every blow you land rises as a
// number at the struck foe's head, its kind in its colour, and is gone in 0.9 s; the bottom centre no longer says it. Kinds, first
// that applies: crit (a finisher, a riposte, a lucky blow, a staggered foe), back (from behind), res (a shield's front, or ×.75 or
// less), weak (×1.25 or more), and plain, with the word under it; a rune's rider rises beside the blow in its colour. The anchor
// is the foe's health bar (its head), taken when the blow lands. Cosmetic: nothing reads them back, and the clock is the page's.
const DMG_NUM_S=.9,DMG_NUM_RISE=40,DMG_NUM_MAX=14,DMG_NUMS=[],_dnV=new THREE.Vector3();
function dmgNumKind(info,e,o){
  info=info||{};o=o||{};
  if(info.finisher)return {kind:'crit',word:'finisher'};
  if(info.riposte)return {kind:'crit',word:'riposte'};
  if(info.lucky)return {kind:'crit',word:'lucky'};
  if(info.crit)return {kind:'crit',word:'staggered'};
  if(info.backstab)return {kind:'back',word:'from behind'};
  if(o.guarded)return {kind:'res',word:'guarded'};
  const r=typeof info.resistMult==='number'?info.resistMult:1;
  /* S799 — a blow swung on too little stamina lands at 45%: the foe's weakness word under its small number read as the blow's strength (the critic's s597) */
  if(r>=1.45&&!info.spent)return {kind:'weak',word:'very weak'};
  if(r>=1.25&&!info.spent)return {kind:'weak',word:'weak'};
  if(r<=.75)return {kind:'res',word:'resisted'};
  if(info.defPierced&&e&&(e.def||0)>0)return {kind:'',word:'armour pierced'};
  if(o.power)return {kind:'',word:'power'};
  return {kind:'',word:''};
}
function dmgNumAnchor(e,out){
  if(e&&e.hpFg&&e.hpFg.parent){e.hpFg.updateWorldMatrix(true,false);e.hpFg.getWorldPosition(out);return out;}
  const m=e&&(e.mesh||e.g);return out.set(e?e.x:0,(m?m.position.y:0)+1.8,e?e.z:0);
}
function dmgNum(e,n,info,o){
  o=o||{};if(!e||!(n>0))return null;
  const layer=document.getElementById('dmgnums');if(!layer)return null;
  const k=o.kind!=null?{kind:o.kind,word:o.word||''}:dmgNumKind(info,e,o);
  const el=document.createElement('div');el.className='dn'+(k.kind?' '+k.kind:'');
  el.textContent=(o.prefix||'')+n+(o.suffix||'');
  if(k.word){const s=document.createElement('span');s.className='sm';s.textContent=k.word;el.appendChild(s);}
  if(o.col)el.style.color=o.col;
  if(o.leftAnchor)el.style.transform='translate(0,-100%)';
  layer.appendChild(el);
  const d={el,p:dmgNumAnchor(e,new THREE.Vector3()),t0:performance.now(),dx:o.dx||0,dy:o.dy||0,n,kind:k.kind,word:k.word,foe:e.name||'',e};
  DMG_NUMS.push(d);
  while(DMG_NUMS.length>DMG_NUM_MAX){const x=DMG_NUMS.shift();if(x.el.parentNode)x.el.parentNode.removeChild(x.el);}
  placeDmgNum(d,d.t0);return d;
}
// a rune's rider (applyWeaponEnchant's return) beside the blow's number: from its right edge, a little higher
function dmgNumRider(e,enc){
  if(!enc||!(enc.amt>0))return null;
  const k=/^(fire|frost|shock)$/.test(enc.id)?enc.id:'rider';
  let main=null;for(let i=DMG_NUMS.length-1;i>=0;i--)if(DMG_NUMS[i].e===e){main=DMG_NUMS[i];break;}
  const half=main&&main.el.offsetWidth?main.el.offsetWidth/2:24;
  return dmgNum(e,enc.amt,null,{kind:k,prefix:'+',suffix:enc.ico?' '+enc.ico:'',col:k==='rider'?enc.col:null,dx:half+6,dy:-30,leftAnchor:true});
}
function placeDmgNum(d,now){
  const u=Math.max(0,(now-d.t0)/1000/DMG_NUM_S);
  CAM.updateMatrixWorld();const v=_dnV.copy(d.p).applyMatrix4(CAM.matrixWorldInverse);
  if(v.z>-.05){d.el.style.display='none';d.onScreen=false;return;} /* behind the eye (NDC depth is no guide this near) */
  v.applyMatrix4(CAM.projectionMatrix);
  if(Math.abs(v.x)>1.2||Math.abs(v.y)>1.2){d.el.style.display='none';d.onScreen=false;return;}
  const c=REN.domElement,r=c.getBoundingClientRect(),w=r.width||innerWidth,h=r.height||innerHeight;
  d.x=r.left+(v.x*.5+.5)*w+d.dx;d.y=r.top+(-v.y*.5+.5)*h+d.dy-u*DMG_NUM_RISE;d.onScreen=true;
  d.el.style.display='';d.el.style.left=d.x.toFixed(1)+'px';d.el.style.top=d.y.toFixed(1)+'px';
  d.el.style.opacity=String(u<.45?1:Math.max(0,1-(u-.45)/.55));
}
function tickDmgNums(){
  if(!DMG_NUMS.length)return;const now=performance.now();
  for(let i=DMG_NUMS.length-1;i>=0;i--){const d=DMG_NUMS[i];
    if((now-d.t0)/1000>=DMG_NUM_S){if(d.el.parentNode)d.el.parentNode.removeChild(d.el);DMG_NUMS.splice(i,1);continue;}
    placeDmgNum(d,now);}
}

// ═══════════════════════════════════════════════════════════════════════
// Monster Overhaul Session 2 — Variants + Spawn Gating
// ═══════════════════════════════════════════════════════════════════════
// Variants are runtime overlays applied to base enemy defs at spawn time. Each variant has:
//   - stat multipliers (hp/dmg/scale/xp) and flat additions (def)
//   - color tint (RGB multiplier, clamped 0-1) for visual differentiation
//   - resist overlay merged onto the base enemy's resist map
//   - gating (minLevel + optional minDiff) and spawn chance
// Variants are tested rarest-first so a qualifying Wraith can roll Frost or Shadow before falling through to Greater.
// Name prefix ('Greater Cave Troll', 'Frost Wraith') flows through kill/damage messages AND counts as a separate
// first-kill entry — seenEnemyTypes keys on the full prefixed name.

const DIFF_ORDER = ['veryeasy','easy','normal','hard','veryhard'];
function isDifficultyAtLeast(current, min){
  return DIFF_ORDER.indexOf(current||'normal') >= DIFF_ORDER.indexOf(min);
}

const VARIANTS = {
  greater: {
    label: 'Greater',
    minLevel: 5,
    minDiff: null,
    chance: 0.10,
    eligible: null, // null = any base enemy
    hp: 1.5, dmg: 1.25, scale: 1.15, def: 1, xp: 1.5,
    tintRGB: [0.8, 0.8, 0.8], // darker
    resistOverlay: {},
  },
  frost: {
    label: 'Frost',
    minLevel: 10,
    minDiff: 'hard',
    chance: 0.20,
    eligible: ['Cave Troll','Golem','Wraith','Forest Troll'],
    hp: 1.3, dmg: 1.2, scale: 1.05, def: 2, xp: 1.75,
    tintRGB: [0.7, 0.95, 1.35], // blue shift
    resistOverlay: {uisce: 0.5, tine: 1.5},
  },
  shadow: {
    label: 'Shadow',
    minLevel: 10,
    minDiff: 'hard',
    chance: 0.20,
    eligible: ['Skeleton','Phantom','Wraith'],
    hp: 1.3, dmg: 1.2, scale: 1.0, def: 1, xp: 1.75,
    tintRGB: [1.1, 0.7, 1.35], // purple shift
    resistOverlay: {scath: 0.5, solas: 1.5},
  },
};

// S1034 — enemies by place (Michael's A on DECISION #373): a foe's health and blow grow with the danger of where it stands,
// not with your level. Each region has a tier: home's coast, Ashen, Bealach and Royale 1; Deepwood, the Foothills and Greywood 2;
// the Wastes 3; a far island's region by its biome (tundra, swamp and wasteland 3, the rest 2). A dungeon is its door's tier, and
// each floor below the first adds one, to 4. A gate's school does not change it. A tier is worth what the level curve gave at
// levels 1, 6, 11 and 16 (health ×1, 1.75, 2.5, 3; the blow as the resolver's reference blow there), and the rare variants'
// chance reads that level too. The region is read from the foe's cell and its neighbours (getCell), never the live REGIONS.
const DANGER_LV=[1,1,6,11,16];
const REGION_TIER={coastal:1,ashen:1,bealach:1,royale:1,deepwood:2,foothills:2,greywood:2,wastes:3};
const BIOME_TIER={tundra:3,swamp:3,wasteland:3};
const LEGACY_ZONE_REGION={overworld:'ashen',hearthwick:'bealach',bealach_south:'bealach',forest:'deepwood',ironhaven:'royale'};
function tierLevel(t){return DANGER_LV[Math.max(1,Math.min(4,t|0||1))];}
function regionTier(r){if(!r)return 1;if(REGION_TIER[r.id]!=null)return REGION_TIER[r.id];return BIOME_TIER[r.biome]||2;}
// the open world: the region whose field weighs most at (x,z) among the cell's and its neighbours' (the ring widens to three
// cells for an islet in open sea, as lairBiome does); none at all is home's tier 1 at home and 2 elsewhere
function worldTierAt(x,z){
  if(typeof getCell!=='function'||typeof cellOf!=='function')return 1;
  const [ci,cj]=cellOf(x,z);const regs=[];
  for(let k=1;k<=3&&!regs.length;k++)for(let i=ci-k;i<=ci+k;i++)for(let j=cj-k;j<=cj+k;j++){const c=getCell(i,j);if(c&&c.regions)regs.push(...c.regions);}
  if(!regs.length)return (typeof HOME_I!=='undefined'&&ci===HOME_I&&cj===HOME_J)?1:2;
  let best=null,bw=0,near=null,nd=1e9;
  for(const r_ of regs){const d=Math.hypot(x-r_.x,z-r_.z);const w=Math.max(0,1-d/r_.r);if(w>bw){bw=w;best=r_;}if(d/r_.r<nd){nd=d/r_.r;near=r_;}}
  return regionTier(best||near);
}
// a legacy zone: its region, as its config names it
function zoneTier(id){const Z=(typeof ZONES!=='undefined')&&ZONES[id];const reg=(Z&&Z._cfg&&Z._cfg.region)||LEGACY_ZONE_REGION[id];return REGION_TIER[reg]||1;}
// a dungeon: its door's place, plus one a floor below the first, to 4; the tutorial's crypt is 1. A cell's door is zone 'gen'
// until the world places it (S1058: it read as a legacy zone, tier 1)
function dungeonTier(portal,floor){
  if(!portal||portal.tutorial)return 1;
  const base=(portal.zone==='world'||portal.zone==='gen')?worldTierAt(portal.x,portal.z):zoneTier(portal.zone||(typeof _preDungeonZone!=='undefined'?_preDungeonZone:'overworld'));
  return Math.min(4,base+Math.max(0,(floor||1)-1));
}
// where a foe is built: the world's scene (or world coordinates) reads the region, a legacy zone's scene its zone, else where you are
function foeTier(sc,x,z){
  try{
    const W=(typeof ZONES!=='undefined')&&ZONES.world;
    if(W&&((sc&&sc===W.scene)||x>2500||z>2500))return worldTierAt(x,z);
    if(sc&&typeof ZONES!=='undefined')for(const id in ZONES){const Z=ZONES[id];if(id!=='world'&&Z&&Z.scene===sc)return zoneTier(id);}
  }catch(e){}
  return tierHere();
}
function tierHere(){
  const z=typeof activeZoneId!=='undefined'?activeZoneId:'world';
  if(z==='dungeon')return dungeonTier(typeof currentPortal!=='undefined'?currentPortal:null,typeof currentFloor!=='undefined'?currentFloor:1);
  if(z==='world')return worldTierAt(px,pz);
  return zoneTier(z);
}
// the level a foe's own extra terms read (a wraith's orb and its drain, a ship's volley): its tier's, as its health and blow (S1036)
function foeTierLevel(e){return tierLevel(e&&e.tier!=null?e.tier:tierHere());}
// S1059 — a kind's least tier (the enemies-by-place sheet): its old minLevel 1–3 is tier 1, 4–6 tier 2, 7 and up tier 3. A spawn
// table is filtered by it before the pick, in the open, in a legacy zone and in a dungeon's roster, so no foe is ever latent on
// the field (the minLevel lock, hidden until your level reached it, is gone). A site's own beasts and a quest's foes are set down
// on purpose and are not filtered, as they were never locked (S386).
function minTierOf(minLevel){const m=minLevel||1;return m>=7?3:m>=4?2:1;}
function kindAllowed(name,tier){const D=ZONE_FOE_DEF[name];return minTierOf(D&&D.minLevel)<=(tier||1);}
function enemyHpScale(tier){
  const lv=tierLevel(tier==null?tierHere():tier);
  return Math.min(3.0, 1 + (lv - 1) * 0.15);
}
// S940 — a foe's blow grows as the reference blow does (blowRef), so that with armour as a share an ordinary blow at the kit of
// the tier's level stays near BLOW_SHARE of that level's health (S1034: the tier's level, not yours).
function enemyDmgScale(tier){
  const lv=tierLevel(tier==null?tierHere():tier);
  return blowRef(lv)/blowRef(1);
}

// Pick a variant key (or null) for an enemy about to spawn. Rarest (highest minLevel) checked first.
// v56: effective spawn chance now scales with player level above the variant's minLevel. At level 15,
// Greater (minLevel 5) chance is 10% × (1 + 10×0.15) = 25%, up from 10%. Capped at 50% to preserve
// occasional "clean" encounters. This is the "variant density ramp" piece of the balance hybrid.
function pickVariant(baseName, playerLevel, difficultyKey, rnd){
  const candidates = [];
  for(const [key, v] of Object.entries(VARIANTS)){
    if(playerLevel < v.minLevel) continue;
    if(v.minDiff && !isDifficultyAtLeast(difficultyKey, v.minDiff)) continue;
    if(v.eligible && !v.eligible.includes(baseName)) continue;
    const levelOver = Math.max(0, playerLevel - v.minLevel);
    const effChance = Math.min(0.5, v.chance * (1 + levelOver * 0.15));
    candidates.push({key, v, effChance});
  }
  candidates.sort((a,b) => (b.v.minLevel||0) - (a.v.minLevel||0));
  for(const c of candidates){
    if((rnd?rnd():Math.random()) < c.effChance) return c.key;
  }
  return null;
}

// Produce a hex color with tintRGB multiplied channel-wise (clamped 0-1).
function tintHexColor(hexCol, tintRGB){
  const c = new THREE.Color(hexCol);
  c.r = Math.min(1, c.r * tintRGB[0]);
  c.g = Math.min(1, c.g * tintRGB[1]);
  c.b = Math.min(1, c.b * tintRGB[2]);
  return c.getHex();
}

// Returns a NEW def object with variant overlays applied (doesn't mutate the input).
// Also returns a displayName and xpMult to be used by the caller at spawn + kill time.
function applyVariantToDef(baseDef, baseName, variantKey){
  if(!variantKey || !VARIANTS[variantKey]) return {def: baseDef, displayName: baseName, xpMult: 1.0, variant: null};
  const v = VARIANTS[variantKey];
  const def = {...baseDef};
  if(baseDef.hp) def.hp = Math.round(baseDef.hp * v.hp);
  if(baseDef.maxHp) def.maxHp = Math.round(baseDef.maxHp * v.hp);
  if(baseDef.dmg) def.dmg = Math.round(baseDef.dmg * v.dmg);
  if(baseDef.dmgMult) def.dmgMult = baseDef.dmgMult * v.dmg;
  if(baseDef.scale) def.scale = baseDef.scale * v.scale;
  def.def = (baseDef.def || 0) + v.def;
  def.col = tintHexColor(baseDef.col, v.tintRGB);
  def.resist = {...(baseDef.resist || {}), ...v.resistOverlay};
  if(baseDef.xpVal) def.xpVal = Math.round(baseDef.xpVal * v.xp);
  return {def, displayName: `${v.label} ${baseName}`, xpMult: v.xp, variant: variantKey};
}

// Phantom/Wraith life-drain visual — 4 small purple orbs spawning at player, floating toward the drainer over ~500ms.
// Uses RAF like the Caor blast FX so it runs independent of game dt.
function spawnDrainFX(scene, fromX, fromZ, toX, toZ){
  for(let i=0; i<4; i++){
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 5, 5),
      new THREE.MeshBasicMaterial({color: 0xaa44cc, transparent: true, opacity: 0.95})
    );
    const startY = 0.8 + Math.random()*0.4;
    p.position.set(fromX + (Math.random()-0.5)*0.3, startY, fromZ + (Math.random()-0.5)*0.3);
    scene.add(p);
    const delay = i * 70;
    const startTime = performance.now() + delay;
    const DUR = 480;
    const endY = 0.9 + Math.random()*0.4;
    const tick = () => {
      const now = performance.now();
      if(now < startTime){ requestAnimationFrame(tick); return; }
      const t = (now - startTime) / DUR;
      if(t >= 1){ scene.remove(p); return; }
      p.position.x = fromX + (toX - fromX) * t;
      p.position.z = fromZ + (toZ - fromZ) * t;
      p.position.y = startY + (endY - startY) * t + Math.sin(t * Math.PI) * 0.25;
      p.material.opacity = 0.95 * (1 - t);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

// Drain tick SFX — descending whisper-like tone + subtle noise. Quiet so the per-second tick isn't fatiguing.
function sndDrain(){
  if(!AX || volLevel===0) return;
  sfxTone(380, 180, 0.38, 0.07, 'sine');
  sfxTone(220, 110, 0.42, 0.05, 'sine', -7);
  sfxNoise(0.25, 1, 1, 0.035, 700);
}

// Caor Mastery "Living Ember" — blast on impact. Fires from three places: enemy-contact in zone/dungeon hit handlers
// and wall-contact in the projectile tick. Damages all enemies within BLAST_R of the impact point.
// Visual: expanding ring (torus), impact flash (PointLight), 7 ember sparks on ballistic arcs.
// Damage uses the same roll as a single-target hit — Mastery's 1.30× magnitude is already baked in via TIER_MULT.
const CAOR_BLAST_RADIUS = 2.2;
function triggerCaorBlast(sc, cx, cy, cz, sp, tier, isZone){
  // Visual FX
  spawnCaorBlastFX(sc, cx, cy, cz);
  // Audio
  sndCaorBlast();
  // Damage — every live enemy within radius, using normal per-target damage roll
  const R2 = CAOR_BLAST_RADIUS * CAOR_BLAST_RADIUS;
  const targets = isZone ? ZE : ENEMIES;
  let hitCount = 0;
  const hitNames = [];
  targets.forEach(e=>{
    if(e.dead) return;
    if(e.disguised) return; // Mimics shielded while hidden
    if(!isZone && e.floor !== currentFloor) return;
    const d2 = (e.x-cx)*(e.x-cx) + (e.z-cz)*(e.z-cz);
    if(d2 > R2) return;
    const info = applySpellDamage(e, sp, tier);
    e.hp = Math.max(0, e.hp - info.dmg);
    e.alert = true;
    // Dungeon enemies have visible HP bars; zone enemies have them on the mesh but zone hit handler didn't update them pre-v35.
    // Match the existing hit handlers' behavior per scene.
    if(!isZone){
      e.hpFg.scale.x = e.hp/e.maxHp;
      e.hpFg.position.x = (e.hp/e.maxHp - 1)*.275;
    }
    hitNames.push(e.name);
    hitCount++;
    if(e.hp <= 0){
      const tag = dmgTag(info, e);
      if(isZone) killZoneEnemy(e, sc, tag);
      else killE(e, tag);
    }
  });
  // Summary message — singular for 1 target, count for 2+
  if(hitCount === 1){
    showMsg(`🔥 Living Ember bursts — ${hitNames[0]} caught in the blast!`, '#ff7733');
  } else if(hitCount > 1){
    showMsg(`🔥 Living Ember bursts — ${hitCount} enemies caught in the blast!`, '#ff7733');
  } else {
    // Wall-hit with no enemies nearby — still announce the detonation for feedback
    showMsg(`🔥 Living Ember bursts against the stone.`, '#ff9955');
  }
}

// Visual effect for Caor Mastery blast. Runs independently of the game tick via requestAnimationFrame;
// auto-cleans up after ~550ms. Spawned objects are added to the scene passed in (works in both dungeon and zone).
function spawnCaorBlastFX(sc, cx, cy, cz){
  // Expanding flat ring (torus rotated flat). Scales 0.3 → 2.2 (matches blast radius), fades opacity.
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.10, 6, 24),
    new THREE.MeshBasicMaterial({color: 0xff7733, transparent:true, opacity:0.9, side:THREE.DoubleSide})
  );
  ring.rotation.x = Math.PI/2;
  ring.position.set(cx, cy, cz);
  ring.scale.setScalar(0.3);
  sc.add(ring);
  // Impact flash — bright PointLight that decays fast
  const light = new THREE.PointLight(0xff7733, 5.0, 7);
  light.position.set(cx, cy, cz);
  sc.add(light);
  // Ember sparks — 7 small orbs spawning outward with ballistic (gravity) arcs
  const sparks = [];
  for(let i=0;i<7;i++){
    const sp = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 5, 5),
      new THREE.MeshBasicMaterial({color: 0xffaa44, transparent:true, opacity:1.0})
    );
    sp.position.set(cx, cy, cz);
    const ang = Math.random() * Math.PI * 2;
    const spd = 2.5 + Math.random() * 2.0;
    sparks.push({mesh: sp, vx: Math.cos(ang)*spd, vy: 1.4 + Math.random()*1.6, vz: Math.sin(ang)*spd});
    sc.add(sp);
  }
  // Animation driver — tied to real time via RAF, independent of game dt so fps doesn't affect visual pacing
  const startTime = performance.now();
  const DUR_MS = 550;
  const tick = () => {
    const t = (performance.now() - startTime) / DUR_MS;
    if(t >= 1){
      sc.remove(ring); sc.remove(light);
      for(const s of sparks) sc.remove(s.mesh);
      return;
    }
    // Ring: expand + fade
    ring.scale.setScalar(0.3 + (CAOR_BLAST_RADIUS - 0.3) * t);
    ring.material.opacity = 0.9 * (1 - t);
    // Light: decay over first 60% of duration
    light.intensity = 5.0 * Math.max(0, 1 - t/0.6);
    // Sparks: integrate velocity + gravity, fade opacity
    const dtStep = 1/60;
    for(const s of sparks){
      s.mesh.position.x += s.vx * dtStep;
      s.mesh.position.y += s.vy * dtStep;
      s.mesh.position.z += s.vz * dtStep;
      s.vy -= 6 * dtStep; // gravity
      s.mesh.material.opacity = 1 - t;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Blast SFX — noise burst + low boom + mid sawtooth layer. Louder than a normal Caor hit to signal the AoE.
function sndCaorBlast(){
  if(!AX||volLevel===0)return;
  sfxNoise(.18, 1, 1, 0.38, 900);
  sfxTone(140, 60, .30, 0.32, 'sawtooth');
  sfxTone(250, 110, .20, 0.20, 'sawtooth', 5);
}
