
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
  finesse:    {label:'Finesse',    icon:'🌀',  actKey:'parries',         thresholds:[0,2,4,7,10],  gainDesc:'+10ms parry window, -5% sprint cost, +1% ranged dmg, -1% sneak detection', gains:{parryMs:10,sprintCostPct:-5,rangedPct:1,sneakDetectPct:-1}, desc:'Parry tighter. Strike from afar. Move unseen.'},
  swiftness:  {label:'Swiftness',  icon:'💨',  actKey:'sprintDist',      thresholds:[0,100,250,450,700],gainDesc:'+2% move speed, +1% attack speed',                gains:{movePct:2,atkSpdPct:1},                desc:'Run farther. Hit faster.'},
  resolve:    {label:'Resolve',    icon:'✦',   actKey:'staminaDepleted', thresholds:[0,1,3,5,8],   gainDesc:'+0.3/s stam regen, -5% block cost, +1% magic resist', gains:{staminaRegen:.3,blockCostPct:-5,magicResistPct:1}, desc:'Outlast the long fight. Endure the unseen.'},
  intelligence:{label:'Intelligence',icon:'📖',actKey:'transactions',    thresholds:[0,3,6,10,15], gainDesc:'+10 max mana, +0.2/s mana regen, +1% spell power',  gains:{maxMana:10,manaRegen:.2,spellPct:1},   desc:'Read more. Cast harder. Mana flows.'},
  charisma:   {label:'Charisma',   icon:'💬',  actKey:'npcTalks',        thresholds:[0,2,4,7,10],  gainDesc:'+1% barter, +2% quest reward gold, merchant access',gains:{barterPct:1,questGoldPct:2,merchantTier:1}, desc:'A silver tongue. Better deals all around.'},
  fortune:    {label:'Fortune',    icon:'🍀',  actKey:'chestsOpened',    thresholds:[0,1,3,5,8],   gainDesc:'+2% crit chance, +5% gold found, +2.5% item drop chance', gains:{critPct:2,goldPct:5,dropPct:2.5},                  desc:'The world favors you. Crits and chests.'},
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
  luOpen=true;luSelected=[];
  document.getElementById('lu-lv').textContent=level;
  document.getElementById('lu-count').textContent='0';
  document.getElementById('lu-confirm').disabled=true;
  // v61av: surface the archetype primary bonus that confirmLevelUp will
  // apply on top of the action-multiplier picks. Fires regardless of which
  // 3 attributes the player ticks below — Option A: archetype identity is
  // destiny, you grow into it whether you mean to or not. Showing it here
  // (rather than only retroactively in the level-up log) closes the
  // "did that bonus actually fire?" feedback gap.
  const _luBonusEl=document.getElementById('lu-arch-bonus');
  if(_luBonusEl){
    const _arch=ARCHETYPES.find(a=>a.id===playerArchetype);
    if(_arch && _arch.primaries && _arch.primaries.length){
      const labels=_arch.primaries.map(k=>ATTR_DEF[k]?.label||k).join(' · ');
      _luBonusEl.classList.remove('lu-arch-empty');
      _luBonusEl.innerHTML=`★ <span class="lu-arch-name">${_arch.icon} ${_arch.label}</span> bonus: +1 to ${labels}`;
    } else {
      // No archetype (legacy save before character creator) — hide entirely.
      _luBonusEl.classList.add('lu-arch-empty');
      _luBonusEl.innerHTML='';
    }
  }
  // Build attr cards
  luHPGain();
  const container=document.getElementById('lu-attrs');
  container.innerHTML='';
  Object.keys(ATTR_DEF).forEach(key=>{
    const def=ATTR_DEF[key];
    const mult=getMultiplier(key);
    const cur=ATTRS[key];
    const actVal=lvAct[def.actKey]||0;
    const multClass='lu-mult-'+mult;
    const multLabel=['','×1','×2','×3','×4','×5'][mult];
    const card=document.createElement('div');
    card.className='lu-attr';card.dataset.key=key;
    card.innerHTML=`
      <div class="lu-attr-top">
        <span class="lu-attr-name">${def.icon} ${def.label}</span>
        <span class="lu-attr-mult ${multClass}">${multLabel}</span>
      </div>
      <div class="lu-attr-gain">${gainLines(key,mult)}</div>
      <div class="lu-attr-cur">Current: ${cur} pts &nbsp;·&nbsp; Activity: ${actVal}</div>`;
    card.onclick=()=>toggleAttr(key);
    container.appendChild(card);
  });
  document.getElementById('lu').style.display='flex';
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

function toggleAttr(key){
  if(luSelected.includes(key)){
    luSelected=luSelected.filter(k=>k!==key);
  } else {
    if(luSelected.length>=3)return;
    luSelected.push(key);
  }
  // Update card states
  document.querySelectorAll('.lu-attr').forEach(card=>{
    const k=card.dataset.key;
    card.classList.toggle('selected',luSelected.includes(k));
    card.classList.toggle('disabled',luSelected.length>=3&&!luSelected.includes(k));
  });
  document.getElementById('lu-count').textContent=luSelected.length;
  document.getElementById('lu-confirm').disabled=luSelected.length<3;
  luHPGain();
}
// S531 — the health the level gives, as confirmLevelUp gives it: 10 every level, and Fortitude's 10 a point from the
// picks and the archetype's +1 (was a static "+10 HP restored")
function luHPGain(){const el=document.getElementById('lu-hpgain');if(!el)return;
  const hp=ATTR_DEF.fortitude.gains.maxHP,arch=ARCHETYPES.find(a=>a.id===playerArchetype);
  const n=10+(luSelected.includes('fortitude')?hp*getMultiplier('fortitude'):0)+(arch&&arch.primaries&&arch.primaries.includes('fortitude')?hp:0);
  el.textContent=`❤ +${n} max HP`;}

function confirmLevelUp(){
  luSelected.forEach(key=>{
    const def=ATTR_DEF[key];
    const mult=getMultiplier(key);
    ATTRS[key]+=mult;
    // Apply stat changes
    const g=def.gains;
    if(g.maxHP){maxHP+=g.maxHP*mult;PHP=Math.min(PHP+g.maxHP*mult,effMaxHP());}
    if(g.maxStamina){maxStamina+=g.maxStamina*mult;stamina=Math.min(stamina+g.maxStamina*mult,maxStamina);}
    if(g.maxMana){maxMana+=g.maxMana*mult;mana=Math.min(mana+g.maxMana*mult,maxMana);}
  });
  // v61au: archetype primary bonus. Each archetype names 3 "primary"
  // attributes (the things the character is naturally gifted at) — these
  // get a flat +1 on level-up, on top of any action-driven multiplier from
  // luSelected above. Stat patches (HP/stam/mana) for the +1 also apply,
  // so a Warrior leveling up gets +1 Fortitude → +10 max HP +5 max stamina
  // every level even if they didn't pick Fortitude as a level-up choice.
  // Doesn't double-dip: if a primary attr is already in luSelected, the
  // mult-based gains above ran, and this just adds another +1 below.
  const arch = ARCHETYPES.find(a=>a.id===playerArchetype);
  if(arch && arch.primaries){
    arch.primaries.forEach(key=>{
      const def=ATTR_DEF[key];
      if(!def)return;
      ATTRS[key]+=1;
      const g=def.gains||{};
      if(g.maxHP){maxHP+=g.maxHP;PHP=Math.min(PHP+g.maxHP,effMaxHP());}
      if(g.maxStamina){maxStamina+=g.maxStamina;stamina=Math.min(stamina+g.maxStamina,maxStamina);}
      if(g.maxMana){maxMana+=g.maxMana;mana=Math.min(mana+g.maxMana,maxMana);}
    });
  }
  // Base HP gain per level
  maxHP+=10;PHP=Math.min(PHP+10,effMaxHP());
  // Reset activity counters
  // Log the level-up
  const _archStr = arch ? ` · ${arch.label} +1 [${arch.primaries.map(k=>ATTR_DEF[k]?.label.slice(0,3)).join('·')}]` : '';
  const attrSummary=luSelected.map(k=>ATTR_DEF[k].label+' ×'+getMultiplier(k)).join(', ');
  addLog('↑','Level Up! → '+attrSummary+_archStr);
  lvAct={kills:0,damageTaken:0,parries:0,sprintDist:0,staminaDepleted:0,transactions:0,npcTalks:0,chestsOpened:0};
  luOpen=false;luSelected=[];
  document.getElementById('lu').style.display='none';
  checkPartialSpells();
  showMsg('Level '+level+' — attributes upgraded!','#ffd700');
  updateHUD();
}
