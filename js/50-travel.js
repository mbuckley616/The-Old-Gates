
function goToZone(targetZone,spawnX,spawnZ,spawnYaw,label){
  doFade(()=>{
    _clearInteractPrompt();
    // v61h: capture origin zone BEFORE we swap activeZoneId, for auto-spawn lookup.
    const _originZone = activeZoneId;
    // v61ad: BURN TRIGGER. If the player is re-entering Ashenmoor with Q6 done
    // and the pending flag set, flip the world state BEFORE ZONE_BUILDERS is
    // consulted. This ensures the burned scene is the one that builds and the
    // player arrives into ruins, not into pre-burn Ashenmoor with a one-frame
    // stale render.
    //
    // v61aj: burn trigger now also AUTO-ACCEPTS Q7 and fires its acceptText
    // popup. Previously Q7 went 'locked' → 'available', and the player had to
    // find Edna and talk to her to actually accept it. That meant the beat of
    // "oh god, the village is destroyed, I need to find out what happened"
    // was invisible — no quest in the log, no compass marker, no popup. Now
    // arrival IS the accept: state goes directly to 'active', triage
    // objectives become live immediately, acceptText popup fires via the
    // queue (waits for player-free state). Cleaner emotional beat.
    // v61ad: BURN TRIGGER. If the player is re-entering Ashenmoor with Q6 done
    // and the pending flag set, flip the world state BEFORE ZONE_BUILDERS is
    // consulted. This ensures the burned scene is the one that builds and the
    // player arrives into ruins, not into pre-burn Ashenmoor with a one-frame
    // stale render.
    //
    // v61ak: burn trigger no longer mutates Q7 state. Q7 is now given directly
    // by Aldwyn (auto-accept via Q6.unlocks → Q7.autoAccept + showAcceptPopup),
    // so Q7 is already 'active' by the time the player walks back to Ashenmoor.
    // The trigger instead FIRES an enter_zone event that ticks Q7's obj 0.
    // That objective has a completionText carrying the "burned to the ground"
    // journal beat, which fires as a 'update' popup via checkQuestProgress.
    //
    // One cleaner emotional arc: Q6 completes at Aldwyn → Q7 accept popup
    // ("Aldwyn heard smoke, I need to get home fast") → player walks to
    // Ashenmoor → burn fires behind the fade → 'update' popup fires ("burned
    // to the ground, I should see if anyone survived") → three quest markers
    // appear for Bram/Oswin/Edna simultaneously → player triages in any order.
    if(targetZone==='overworld' && worldState.ashenmoorPending && !worldState.ashenmoorBurned){
      worldState.ashenmoorBurned = true;
      worldState.ashenmoorPending = false;
      // v61e6 Session A: cinematic time-lock. The burn is canonically a
      // morning-after scene per lore_canon — "scorched ground, ambient
      // silence, no music" reads as dawn, the village gone overnight.
      // Force the clock to dawn (5:30 AM) regardless of when the player
      // walked back. Justified by the cinematic nature of the scene.
      forceTime('dawn');
      _syncAshenmoorZoneEntry();
      // Clear any lingering outdoor corpses / zone enemies belonging to the
      // pre-burn overworld — they'd otherwise persist into the burned scene
      // because ZONE_CORPSES is a global array keyed by zone id.
      if(typeof ZONE_CORPSES!=='undefined'){
        for(let ci=ZONE_CORPSES.length-1; ci>=0; ci--){
          if(ZONE_CORPSES[ci].zone==='overworld' && !ZONE_CORPSES[ci].bramBody){
            ZONE_CORPSES.splice(ci,1);
          }
        }
      }
      addLog('🔥','Ashenmoor has burned.');
      // v61ak: fire enter_zone event — Q7 obj 0 ticks here if Q7 is active,
      // which it should be (Aldwyn just gave it). If for some reason Q7 isn't
      // active (e.g. old save mid-upgrade), the event is a no-op and the
      // player just sees the burned scene without a popup. Defensive.
      checkQuestProgress('enter_zone', {zone:'overworld'});
    }
    blocking=false;staggered=[];
    activeZoneId=targetZone;
    if(typeof wmDiscoverZone==='function')wmDiscoverZone(targetZone);
    const zb=ZONE_BUILDERS[targetZone];
    if(!zb){
      // Unknown zone — fall back to overworld to avoid a black-screen hang
      activeZoneId='overworld';
      scene=owScene;lid='overworld';ZE=[];ZB=[];
      PORTALS=WORLD_DUNGEONS.filter(e=>e.zone==='overworld').map(makePortalDef);
    } else {
      if(zb.builder && !zb.sceneGet())zb.builder();
      scene=zb.sceneGet();
      lid='overworld';
      ZE=(ZONES[targetZone]&&ZONES[targetZone].enemies)||[];
      ZB=[];
      // v61e9 — Day/Night Session C: respawn + retreat on zone entry.
      // Respawn check fires AFTER the scene is resolved (so the cfg ref
      // exists). It's a no-op on first build (lastSpawnedAt was just set
      // by the builder). On re-entry, if 24+ in-game hours have passed,
      // it removes respawnable enemies and re-rolls them with current
      // time-of-day for density + nightOnly/duskOnly filters. Re-binds
      // ZE to the (now updated) enemies array since the array reference
      // is the same but contents changed.
      if(typeof checkZoneRespawn === 'function'){
        checkZoneRespawn(targetZone);
        ZE=(ZONES[targetZone]&&ZONES[targetZone].enemies)||ZE;
      }
      // Retreat application — fires on every settlement entry so an
      // entering player at night sees the village empty immediately
      // without waiting for the 1Hz tick.
      if(typeof _isSettlementZone === 'function' && _isSettlementZone(targetZone)){
        const _zoneNpcs = (ZONES[targetZone] && ZONES[targetZone].npcs) || null;
        if(_zoneNpcs && typeof _applyRetreatToZone === 'function'){
          _applyRetreatToZone(targetZone, _zoneNpcs);
        }
      }
      if(targetZone==='overworld'){
        // Overworld regenerates its portal set each entry (legacy behaviour)
        PORTALS=WORLD_DUNGEONS.filter(e=>e.zone==='overworld').map(makePortalDef);
      } else {
        PORTALS=(ZONES[targetZone]&&ZONES[targetZone].portals)||[];
      }
      // v61c2 — Faolchú spawn check. Fires on every overworld entry where
      // the village has burned but the boss hasn't been defeated yet. The
      // function is idempotent (no-op if a Faolchú is already alive in ZE),
      // so this works for both:
      //   (a) the initial burn entry, where the spawn lands as soon as the
      //       player walks into the ruined village square;
      //   (b) any re-entry after the player fled / left to grind, where the
      //       boss respawns at full HP. ZE state isn't serialized across
      //       save+load (see tech debt: ZONE_CORPSES not serialized), so
      //       we treat each overworld entry as the boss's "current state."
      // After defeat, faolchuDefeated is true and the call short-circuits.
      if(targetZone==='overworld' && worldState.ashenmoorBurned && !worldState.faolchuDefeated){
        if(typeof spawnFaolchu==='function') spawnFaolchu();
      }
    }
    // v61h: prefer auto-computed spawn (step-back from target's return gate).
    // Falls back to explicit spawn args for fast-travel / edge cases.
    const _auto = _autoGateSpawn(targetZone, _originZone);
    if (_auto) {
      px=_auto.x; pz=_auto.z; yaw=_auto.yaw;
    } else {
      px=spawnX; pz=spawnZ; yaw=spawnYaw||0;
    }
    pitch=0;velY=0;jumpY=0;onGround=true;
    showZoneName((ZONE_BUILDERS[targetZone]&&ZONE_BUILDERS[targetZone].displayName)||'—');
    document.getElementById('fbtn').style.display='block';
    // v61b: per-zone music track. Each ZONE_BUILDERS entry has a `musicTrack`
    // key that maps to one of startMusic's variants (village/town/forest/road
    // etc.). Previously hardcoded to 'overworld' for every overworld zone.
    startMusic((ZONE_BUILDERS[targetZone]&&ZONE_BUILDERS[targetZone].musicTrack)||'overworld');
    showMsg(`Entered ${label||targetZone}.`,'#c8e88a');
    addLog('🌍','Traveled to '+(label||targetZone));
    saveGame();
  });
}

// ── FAST TRAVEL ────────────────────────────────────────────────
// Resolves a world-map node name to one of the three playable zones and, if valid,
// invokes goToZone. Spawn points are borrowed from the matching gate in another zone
// so the player arrives where a walked transit would have dropped them.
//
// Refuses with a toast (no travel) when:
//   - player is in a dungeon or interior (lid !== 'overworld')
//   - destination is not yet a playable zone (Act II/III nodes)
//   - destination is already the current zone
//   - destination is not yet discovered (fog of war)
function fastTravelSpawn(targetZone){
  // v61e: search every registered zone's gates array (via ZONES[id].gates).
  // New placeholder zones populate this automatically through their builders,
  // so fast-travel to Act I additions (Redwater Ford, Salthaven, etc.) works
  // without maintaining a separate pool list. Legacy per-zone gate globals
  // remain as a fallback for safety.
  for(const zid in ZONES){
    const gs=ZONES[zid]&&ZONES[zid].gates;
    if(!gs)continue;
    const g=gs.find(gt=>gt && gt.targetZone===targetZone);
    if(g && typeof g.spawnX==='number' && typeof g.spawnZ==='number'){
      return {x:g.spawnX,z:g.spawnZ,yaw:g.spawnYaw||0};
    }
  }
  // Legacy pools — covers zones built before their ZONES[id] entry populates.
  const pools=[
    typeof ASHENMOOR_GATES!=='undefined'?ASHENMOOR_GATES:null,
    typeof BEALACH_SOUTH_GATES!=='undefined'?BEALACH_SOUTH_GATES:null,
    typeof HEARTHWICK_GATES!=='undefined'?HEARTHWICK_GATES:null,
    typeof FOREST_GATES!=='undefined'?FOREST_GATES:null,
    typeof IRONHAVEN_GATES!=='undefined'?IRONHAVEN_GATES:null,
  ].filter(Boolean);
  for(const pool of pools){
    const g=pool.find(gt=>gt && gt.targetZone===targetZone);
    if(g && typeof g.spawnX==='number' && typeof g.spawnZ==='number'){
      return {x:g.spawnX,z:g.spawnZ,yaw:g.spawnYaw||0};
    }
  }
  // Fallback — near player default spawn for each zone. Shouldn't normally hit this
  // since all three zones have at least one inbound gate.
  if(targetZone==='overworld')return {x:15,z:20,yaw:0};
  if(targetZone==='forest')  return {x:35,z:60,yaw:Math.PI};
  if(targetZone==='ironhaven')return {x:35,z:60,yaw:Math.PI};
  return {x:15,z:20,yaw:0};
}

function fastTravelTo(nodeName){
  // Dungeon/interior gate — per design: must exit first, no auto-exit.
  if(lid!=='overworld'){
    if(typeof showMsg==='function')showMsg('Must return to the surface before fast traveling.','#c88040');
    return false;
  }
  const targetZone=WM_NODE_TO_ZONE[nodeName];
  if(!targetZone){
    if(typeof showMsg==='function')showMsg('That location has not yet been reached.','#888');
    return false;
  }
  if(!WM.discovered[nodeName]){
    if(typeof showMsg==='function')showMsg('Undiscovered — travel there once on foot first.','#888');
    return false;
  }
  if(targetZone===activeZoneId){
    if(typeof showMsg==='function')showMsg("You're already here.",'#c8a84a');
    return false;
  }
  const sp=fastTravelSpawn(targetZone);
  // Close the hub so the fade/zone name drop plays over the game view.
  if(typeof closeHub==='function'&&hubOpen)closeHub();
  goToZone(targetZone,sp.x,sp.z,sp.yaw,nodeName);
  return true;
}

function tickNPCs(dt,now){OW_NPCS.forEach(n=>{n.wt-=dt;if(n.wt<=0){n.wa=Math.random()*Math.PI*2;n.wt=1.5+Math.random()*3;}const dh=Math.hypot(n.g.position.x-n.def.x,n.g.position.z-n.def.z);const ang=dh>4?Math.atan2(n.def.x-n.g.position.x,n.def.z-n.g.position.z):n.wa;const nx2=n.g.position.x+Math.sin(ang)*.4*dt,nz2=n.g.position.z+Math.cos(ang)*.4*dt;if(!owSolid(nx2,nz2)){n.g.position.x=nx2;n.g.position.z=nz2;}n.g.rotation.y=ang;const ty=getTerrainHeight(n.g.position.x,n.g.position.z);n.g.position.y=ty+Math.sin(now*.0025+n.ph)*.006;const sw=Math.sin(now*.006+n.ph)*.3;if(n.g.children[3])n.g.children[3].rotation.x=sw;if(n.g.children[4])n.g.children[4].rotation.x=-sw;if(n.g.children[5])n.g.children[5].rotation.x=-sw*.7;if(n.g.children[6])n.g.children[6].rotation.x=sw*.7;n.dot.position.set(n.g.position.x,ty+1.52+Math.sin(now*.0025+n.ph)*.006,n.g.position.z);});}
function tickNPCsFor(npcs,dt,now,sz){npcs.forEach(n=>{n.wt=(n.wt||0)-dt;if(n.wt<=0){n.wa=Math.random()*Math.PI*2;n.wt=2+Math.random()*4;}const ang=n.wa;const nx2=n.g.position.x+Math.sin(ang)*.3*dt,nz2=n.g.position.z+Math.cos(ang)*.3*dt;const R=0.3;if(nx2>R&&nx2<(sz||70)-R&&nz2>R&&nz2<(sz||70)-R&&!currentZoneSolid(nx2,nz2)){n.g.position.x=nx2;n.g.position.z=nz2;}n.g.rotation.y=ang;const gY=activeTerrainH(n.g.position.x,n.g.position.z);n.g.position.y=gY+Math.sin(now*.002+n.ph)*.006;n.dot.position.set(n.g.position.x,gY+1.52,n.g.position.z);});}
function tickHerbs(dt,now){
  // Tick all zone herb arrays
  const allHerbs=activeZoneId==='world'?activeHerbs():activeZoneId==='forest'?FOREST_HERBS:activeZoneId==='ironhaven'?IH_HERBS:OW_HERBS; // v80 — streamed world keeps its herbs in ZONES.world.herbs
  allHerbs.forEach(h=>{
    if(h.harvested){
      if(h.def.respawn!=null){h.respawnT-=dt;if(h.respawnT<=0){h.harvested=false;h.g.visible=true;h.gl.intensity=h.def.glowInt||.5;const u=h.g.userData;if(u&&u.picked){u.whole.visible=true;u.picked.visible=false;}}}
      return;
    }
    const baseY=activeTerrainH(h.x,h.z);
    h.g.position.y=baseY+Math.sin(now*.0046+h.ph)*.016;
    h.g.rotation.y+=dt*.004;
    const pulse=.45+Math.sin(now*.18+h.ph)*.15;
    h.gl.intensity=(h.def.glowInt||.5)*pulse;
  });
  // v61as: buff countdown moved to tickActiveBuffs(dt). Used to live here,
  // which meant it only ran in the five outdoor zones that called tickHerbs
  // — buffs froze the moment the player entered a dungeon or interior and
  // resumed counting down on exit. The new function runs unconditionally
  // from the main loop and is independent of zone.
}

// v61as: buff countdown — runs every frame regardless of zone (overworld,
// dungeon, interior, anywhere). Buffs decrement by dt each tick and expire
// when remaining drops to zero. Stat patches that were applied on activation
// (currently just maxStamBuff) are reversed on expiry. Called from the main
// loop, NOT from any per-zone tick, so it can never go un-called when the
// player wanders into a context the dispatch table doesn't enumerate.
function tickActiveBuffs(dt){
  for(let i=ACTIVE_BUFFS.length-1;i>=0;i--){
    const b=ACTIVE_BUFFS[i];
    b.remaining-=dt;
    for(let u=b._under;u;u=u._under)u.remaining-=dt;
    if(b.remaining<=0){
      let u=b._under;while(u&&u.remaining<=0)u=u._under;
      if(u){ACTIVE_BUFFS[i]=u;showMsg(b.label+' has worn off.','#888888');continue;}
      ACTIVE_BUFFS.splice(i,1);
      showMsg(b.label+' has worn off.','#888888');
      // Reverse any stat patches
      if(b.type==='maxStamBuff'){maxStamina-=(b._stamAdd!=null?b._stamAdd:Math.round(maxStamina-maxStamina/b.mult));stamina=Math.min(stamina,effMaxStamina());} // S325 — take back what it added, so a level taken meanwhile is kept
    }
  }
}

// v61ae: animate burned-Ashenmoor smoke. Each slab sways on X/Z via sine with
// its per-instance phase (higher slabs sway further), rotates around Y slowly,
// and each plume's material opacity cycles independently. Runs every frame
// while the player is in overworld AND ashenmoorBurned is true — short-
// circuited elsewhere to skip the iteration entirely when not needed.
function tickBurnedSmoke(now){
  if(!_burnedSmokeMeshes.length) return;
  const t = now * 0.001; // seconds
  for(const slab of _burnedSmokeMeshes){
    const u = slab.userData.smokeBase;
    if(!u) continue;
    slab.position.x = u.bx + Math.sin(t*0.6 + u.phase) * u.swayAmp;
    slab.position.z = u.bz + Math.cos(t*0.5 + u.phase) * u.swayAmp;
    slab.rotation.y += u.rotSpeed * 0.016; // ~per-frame (approx dt at 60fps)
  }
  // Opacity cycle — each material out of phase with the others.
  for(let i=0;i<_burnedSmokeMaterials.length;i++){
    _burnedSmokeMaterials[i].opacity = 0.38 + Math.sin(t*0.4 + i*1.1)*0.10;
  }
}

function _activeBuffs(type){return ACTIVE_BUFFS.filter(b=>b.type===type);}
function _buffMult(type,def){const b=_activeBuffs(type);return b.length?b[0].mult:def;}
function _hasBuff(type){return ACTIVE_BUFFS.some(b=>b.type===type);}
// S316 — damage taken, after the buffs: the Warding potion (`dmgReduce`) and the Shield spell or the Boon of Stone
// (`warding`, which nothing read before) are one kind of protection, so the stronger holds and they don't stack; the
// Stoneskin kind (`physResist`) multiplies on top, as before.
function _wardMult(){return Math.min(_buffMult('dmgReduce',1),_buffMult('warding',1))*_buffMult('physResist',1)*(_hasBuff('dmgBurst')?CAOR_RISK:1);}
// S328 (Michael's A on #58) — Caor Dubh's risk: while its fury lasts you take a fifth more from everything. Fortune's
// crit: 2% a point that a melee blow or an arrow lands for half again, on top of any stagger, riposte or backstab.
const CAOR_RISK=1.2,FORTUNE_CRIT_PCT=.02,FORTUNE_CRIT_MULT=1.5;
const RENEWAL_RATE=.5;
function _fortuneCrit(e){const c=Math.min(.5,(ATTRS.fortune||0)*FORTUNE_CRIT_PCT);return c>0&&(typeof foeRand==='function'?foeRand(e):Math.random())<c?FORTUNE_CRIT_MULT:1;} // S480 — on the struck foe's stream (co-op rules)
// S320 — the same ward on every other blow, shot and trap that reaches you (at least 1 when something landed)
function _warded(d,src){return d>0?Math.max(1,Math.round(d*_wardMult()*(src&&src.beast?_buffMult('beastResist',1):1))):d;}
// S321 — the herbs' hidden effects, read where their text says: Wolf's Bane (`beastResist`, above, from a beast's blow),
// Thornberry (`blockBoost`, a raised guard stops a larger share, to .9), Briarweed (`atkSpeed`, in `_weaponSwingFactor`),
// Duilleog Ghorm (`spellDuration`, in `applySpellBuff`)
const BEAST_TYPES=new Set(['Wolf','Dire Wolf','Snow Wolf','Ash Hound','Spider','Cave Bear','Boar','Bog Crawler','Sand Scorpion','Shark']);
function _blockBoost(r){return Math.min(.9,r*_buffMult('blockBoost',1));}
// S322 — the rest of the herbs, the same in the open world and underground: Ferrous Guard (`defBoost`) counts as armour
// against every blow and shot; Mist Fern (`staminaCost`) lightens every swing, bash, roll and draw, not only the sprint
function _armour(){return Object.values(EQ).reduce((a,v)=>a+(v&&v.def?v.def:0),0)+(_hasBuff('defBoost')?(_activeBuffs('defBoost')[0].amount||0):0);}
function _stamCost(c){return c*_buffMult('staminaCost',1);}
// S325 — max stamina without what an active Stonecress lends (the save keeps this; buffs don't survive a load)
function _baseMaxStamina(){return maxStamina-ACTIVE_BUFFS.filter(b=>b.type==='maxStamBuff').reduce((a,b)=>a+(b._stamAdd||0),0);}
// S323 — what the level-up card promises: Resolve +1% magic resist a point (the Faolchú's fire, the dungeon's bolts),
// Finesse -5% sprint cost a point (to a quarter)
function _magicResist(){return Math.max(.5,1-(ATTRS.resolve||0)*.01);}
function _finesseSprint(){return Math.max(.25,1-attrEff('finesse')*.05);}
// S341 — two buffs of one kind don't stack, and neither may cut the other short: the stronger is the one that counts,
// and a weaker one that outlasts it waits underneath (`_under`, counting down all the while) and holds again when the
// stronger ends. So Firemoss eaten under the Boon of the Arm no longer ends the boon, and a Shield cast under the Boon
// of Stone gives the boon back when it lapses. For these kinds a lower multiplier is the stronger.
const BUFF_LOW_GOOD=new Set(['spellCost','warding','dmgReduce','detectReduce','staminaCost','physResist','beastResist']);
function _buffStrength(b){if(b.rate!=null)return b.rate;if(b.amount!=null)return b.amount;const m=b.mult!=null?b.mult:1;return BUFF_LOW_GOOD.has(b.type)?1/Math.max(1e-6,m):m;}
function _stackBuffs(list){
  const order=list.slice().sort((a,b)=>_buffStrength(b)-_buffStrength(a)||b.remaining-a.remaining);
  const keep=[];for(const b of order){if(!keep.length||b.remaining>keep[keep.length-1].remaining)keep.push(b);}
  keep.forEach((b,i)=>{b._under=keep[i+1]||null;});return keep[0];
}
function _applyBuff(he){
  const idx=ACTIVE_BUFFS.findIndex(b=>b.type===he.type);
  if(idx>=0&&he.type!=='maxStamBuff'){
    const old=ACTIVE_BUFFS[idx];const entry={...he,remaining:he.duration};const chain=[];for(let b=old;b;b=b._under)chain.push(b);
    const top=_stackBuffs([...chain,entry]);ACTIVE_BUFFS[idx]=top;
    let kept=false;for(let b=top;b;b=b._under)if(b===entry)kept=true;
    if(kept)showMsg(he.label+' active!',he.col||'#88cc88');
    else showMsg(`${top.label} is the stronger; ${he.label} adds nothing.`,'#888888');
    return;
  }
  if(idx>=0){
    const old=ACTIVE_BUFFS[idx];
    // Undo any stat patches from expiring buff
    if(old.type==='maxStamBuff'){maxStamina-=(old._stamAdd!=null?old._stamAdd:Math.round(maxStamina-maxStamina/old.mult));stamina=Math.min(stamina,effMaxStamina());}
    ACTIVE_BUFFS.splice(idx,1);
  }
  const entry={...he,remaining:he.duration};
  // Apply immediate stat patches
  if(he.type==='maxStamBuff'){entry._stamAdd=Math.round(maxStamina*(he.mult-1));maxStamina+=entry._stamAdd;}
  ACTIVE_BUFFS.push(entry);
  showMsg(he.label+' active!',he.col||'#88cc88');
}

function activeHerbs(){
  // v61d: read from ZONES[id].herbs (populated by every builder). If the zone
  // doesn't appear in ZONES yet, fall through to legacy per-zone globals.
  const zr=ZONES[activeZoneId];
  if(zr&&zr.herbs)return zr.herbs;
  if(activeZoneId==='forest')return FOREST_HERBS;
  if(activeZoneId==='ironhaven')return IH_HERBS;
  if(activeZoneId==='bealach_south')return BEALACH_SOUTH_HERBS;
  if(activeZoneId==='hearthwick')return HEARTHWICK_HERBS;
  return OW_HERBS;
}

function harvestHerb(h){
  if(typeof WORLD!=='undefined')WORLD.guild.onHarvest(h); // v80 S12
  const item={...h.def.item,qty:1,_typeKey:h.type};
  if(!canCarry(item)){showMsg('Too heavy to carry!','#cc8844');return;}
  h.harvested=true;h.gl.intensity=0;
  {const u=h.g.userData;if(u&&u.picked){u.whole.visible=false;u.picked.visible=true;}else h.g.visible=false;} // S217 — a bush picked in the old zones stays, bare, as in the world
  if(h.def.respawn!=null)h.respawnT=h.def.respawn;
  bagAdd(item);
  addLog('🌿','Harvested '+h.def.name);
  if(typeof uiTone==='function'){uiTone(320,420,.12,.1,'sine');uiNoise(.1,.1,600);}
  showMsg('Harvested '+h.def.name+'!','#88cc88');
}

function useHerb(i){
  const it=BAG[i];if(!it||it.type!=='herb')return;
  const eff=it.effect;
  if(!eff)return;
  sndUsePotion();
  // Apply known effect
  if(eff.type==='heal'){PHP=Math.min(effMaxHP(),PHP+eff.amount);showMsg(`${it.name} — +${eff.amount} HP`,'#44ee44');}
  else if(eff.type==='stamina'){stamina=Math.min(effMaxStamina(),stamina+eff.amount);showMsg(`${it.name} — +${eff.amount} Stamina`,'#88ee44');}
  else if(eff.type==='mana'){mana=Math.min(effMaxMana(),mana+eff.amount);showMsg(`${it.name} — +${eff.amount} Mana`,'#88aaff');}
  else if(eff.type==='hpRegen'){_applyBuff({...eff,label:it.name+' Regen',col:'#44cc44'});}
  else if(eff.type==='damage'){PHP=Math.max(1,PHP-eff.amount);showMsg(`${it.name} — -${eff.amount} HP (bitter)...`,'#cc4444');}
  // Track consumption and check for hidden unlock
  const countKey=it._typeKey||it.name.toLowerCase().replace(/[^a-z]/g,'');
  HERB_CONSUME_COUNTS[countKey]=(HERB_CONSUME_COUNTS[countKey]||0)+1;
  const count=HERB_CONSUME_COUNTS[countKey];
  const justUnlocked=(count===HIDDEN_UNLOCK_COUNT);
  const unlocked=(count>=HIDDEN_UNLOCK_COUNT);
  // Apply hidden effect if already unlocked (not on the unlock consume itself — let the message land first)
  if(unlocked&&!justUnlocked&&it.hiddenEffect){
    const he=it.hiddenEffect;
    if(he.type==='manaFull'){mana=effMaxMana();showMsg('Luibh Uisce — Mana fully restored!','#66eebb');}
    else{_applyBuff(he);}
  }
  // Unlock flash — override the known-effect message
  if(justUnlocked){
    const def=HERB_DEF[countKey];
    const hiddenDesc=def?def.hiddenDesc:'hidden effect';
    showMsg('✦ '+it.name+': hidden effect revealed!','#ffcc44');
    addLog('✦',it.name+' — hidden effect unlocked: '+hiddenDesc);
    if(typeof sndLevelUp==='function')sndLevelUp();
  }
  it.qty--;if(it.qty<=0)BAG.splice(i,1);
  renderHubInv();updateHUD();
}
// v61e5: Per-gate flavor copy for the commission lock. Keyed by targetZone.
// The four canonical commission-gated edges (per v61d9) each get bespoke
// prompt + toast text leaning into their region's flavor — Ironhaven gates
// read military, the Bealach branch reads pastoral-old, the West Track reads
// salt-air, La Route Royale reads royal-formal. Falls back to generic copy
// for any future commission-gated edge not yet given bespoke voice.
const COMMISSION_LOCK_COPY={
  west_track:{
    prompt: "The path west is blocked at the Ashenmoor gate — the fishing villages won't admit a stranger without seal.",
    toast:  "Without commission, the fishing villages won't admit you. The salt road waits.",
  },
  bealach_central:{
    prompt: "The Bealach gate stands shut. The bridgekeepers do not pass strangers without seal.",
    toast:  "The road east is closed to those without seal. The bridgekeepers know their orders.",
  },
  northern_road:{
    prompt: "A sergeant turns you back at the gatehouse — the road north requires the king's seal.",
    toast:  "The gatehouse refuses you. The road north is for the commissioned.",
  },
  la_route_royale_west:{
    prompt: "The Royal Road is closed. La Route Royale runs on the king's authority, and you carry none.",
    toast:  "La Route Royale is the king's road. Without his seal, his road is not yours.",
  },
};
function _commissionPrompt(targetZone, label){
  const c = COMMISSION_LOCK_COPY[targetZone];
  return c ? c.prompt : ('The road to '+label+' is closed. Royal commission required.');
}
function _commissionToast(targetZone){
  const c = COMMISSION_LOCK_COPY[targetZone];
  return c ? c.toast : 'The road is closed to those without royal commission.';
}

// ════════════════════════════════════════════════════════════════
// v61e6 Session A — DAY/NIGHT CLOCK
// ════════════════════════════════════════════════════════════════
// Cadence: 1 in-game minute per real second (1 in-game hour per real
// minute). Locked in design_notes.md. Drives downstream systems via
// gameHour() / gameTimeOfDay() helpers — the tide system is ported below;
// future Sessions B (lighting/UI) and C (spawn/AI) read from the same
// helpers. No visible effect from Session A alone except cinematic
// time-locks at Q7 burn / Aldwyn turn-in / Caldric grant.
//
// State: worldState.gameTimeMinutes (single integer, persisted to save).
//   1440 = one full in-game day (24h × 60m).
//   Initial value 360 = 06:00 (dawn) — fresh games start at first light.
//
// Tick: advanceClock(dt) is called from the main game loop AFTER the
// pause bailout, so UI-open / dialog / shop / loot all pause the clock
// (matches existing stamina/buff/cooldown pause behavior).

// Returns current in-game hour as a float [0, 24). Use Math.floor() for
// the integer hour.
function gameHour(){
  return (worldState.gameTimeMinutes % 1440) / 60;
}

// Returns one of the 8 discrete time-of-day states. Used by the future
// sundial UI in Session B and by content gating ("brigands at dusk").
//   dawn          5-7
//   morning       7-9    (early morning per design notes)
//   mid_morning   9-11
//   midday        11-13
//   afternoon     13-17
//   dusk          17-19
//   night         19-25 (i.e. 19-24 plus 0-1)
//   deep_night    1-5
function gameTimeOfDay(){
  const h = gameHour();
  if(h >= 5  && h < 7 ) return 'dawn';
  if(h >= 7  && h < 9 ) return 'morning';
  if(h >= 9  && h < 11) return 'mid_morning';
  if(h >= 11 && h < 13) return 'midday';
  if(h >= 13 && h < 17) return 'afternoon';
  if(h >= 17 && h < 19) return 'dusk';
  if(h >= 19 || h < 1 ) return 'night';
  return 'deep_night';
}

// Advance the clock by real-time dt (seconds). Called once per frame
// from the main loop. Cadence is 1 real-second = 1 in-game minute,
// so we add dt directly. dt is already capped at 0.05s in the loop,
// so a hitchy frame can't fast-forward the clock catastrophically.
function advanceClock(dt){
  worldState.gameTimeMinutes += dt;
  // v61e9 — also track an absolute (non-wrapping) counter for respawn
  // threshold math. gameTimeMinutes wraps modulo 1440 so it can't be
  // used for "hours since X." gameTimeAbsMinutes is the same advance
  // without the wrap. Initialized lazily — pre-v61e9 saves load with
  // it absent and it starts at 0 the first time the clock advances,
  // which is fine: respawn doesn't fire until the threshold elapses
  // anyway.
  worldState.gameTimeAbsMinutes = (worldState.gameTimeAbsMinutes||0) + dt;
  // Wrap modulo 1440 to keep the integer reasonable across long sessions
  // (a full real-day of play = 1440 minutes = 24 in-game days; not huge,
  // but no reason to grow unbounded).
  if(worldState.gameTimeMinutes >= 1440){
    worldState.gameTimeMinutes -= 1440;
  }
}

// Cinematic time-lock. Sets the clock to a target hour. Used by Q7
// scripted scenes per design_notes.md: burn → 'dawn' (5:30), Aldwyn
// turn-in → 'evening' (19:00), Caldric grant → 'evening' (19:00).
// `targetHour` accepts either a number (0-23) or a state-name string
// from the gameTimeOfDay() set. State names map to canonical hours.
//
// Note: forceTime accepts 'evening' as a synonym for 19:00, but the
// gameTimeOfDay() classifier returns 'night' for that hour — there are
// only 8 discrete tod states and "evening" isn't one of them. This is
// intentional: the cinematic vocabulary ("force evening") is broader
// than the player-visible state vocabulary ("the sundial reads night").
function forceTime(targetHour){
  const STATE_TO_HOUR = {
    dawn:5.5, morning:7.5, mid_morning:9.5, midday:12,
    afternoon:14, dusk:17.5, evening:19, night:21, deep_night:2.5,
  };
  let h = (typeof targetHour==='string')
    ? (STATE_TO_HOUR[targetHour] != null ? STATE_TO_HOUR[targetHour] : 12)
    : targetHour;
  if(typeof h !== 'number' || isNaN(h)) h = 12;
  worldState.gameTimeMinutes = ((h % 24) * 60);
}

// v61d7 → v61e6: Inis Rua tidal causeway, ported to the in-game clock.
// Was driven by performance.now() % TIDE_HALF_PERIOD_MS (3-min real-
// time half-cycles); now reads from gameTimeMinutes. The "twice a day"
// lore claim is now literally true: low tide for 6 in-game hours (out),
// high tide for 6 hours (in), repeating across the 24-hour cycle.
//
// Calibration: tide is OUT during hours 0-6 and 12-18; IN during 6-12
// and 18-24. So Inis Rua is reachable during the deep-night-to-morning
// window and during midday-to-dusk — two windows per in-game day,
// roughly equal spacing.
function isTideOut(){
  const h = gameHour();
  return (h < 6) || (h >= 12 && h < 18);
}

// ─────────────────────────────────────────────────────────────────────
// v61e7 — Day/Night Session B: lighting interpolation + sundial UI.
//
// Core idea: every outdoor scene gets a `userData.dayNight` block stashed
// at build time, holding refs to its sun/ambient/hemi/fog plus a day
// palette (the values used at build time) and a night palette (hand-
// designed for Wastes + Coastal, auto-derived for everything else).
// applyDayNightLighting() runs once per second from the main loop,
// reads the active scene's dayNight block, lerps day↔night based on
// gameHour(), and applies the result to the live light/fog/bg objects.
//
// Throttled to 1Hz (design notes Q3) — the per-second visible delta
// at our cadence (1 game-min per real-sec) is below perceptual threshold.
//
// Settlements (kind:'village'/'town') get a universal-village-warm
// night palette regardless of region — design call C, the right shape
// for v1. Per-settlement bespoke night palettes can land later as
// one-line overrides.
//
// Burned Ashenmoor is locked: the scene's dayNight.isLocked flag
// short-circuits the interpolator. Clock keeps ticking globally;
// only the visuals stay frozen at the forced-dawn palette.
// ─────────────────────────────────────────────────────────────────────

// Hand-designed night palettes for the two lore-load-bearing regions.
// Auto-derived for the others (see _autoDeriveNight below).
const REGION_NIGHT_PALETTES = {
  coastal: {
    skyCol: 0x1a2438,    // deep moonlit blue
    fogColor: 0x3a4658,  // cool slate-blue, silver undertone
    fogDensityMul: 1.27, // ×day (0.011 → 0.014)
    sunCol: 0x8aa0c0,    // cool silver-blue moonlight — the Carraig Mór note
    ambientCol: 0x2a3848,// slate-blue, holds cold-water tonality
  },
  wastes: {
    skyCol: 0x0a0808,    // near-black, faint warm tint — the horizon is gone
    fogColor: 0x181410,  // charcoal-warm, ash that's stopped settling
    fogDensityMul: 1.55, // ×day (0.022 → 0.034) — visibility shrinks
    sunCol: 0x3a3038,    // sickly cold-purple, sun mostly off
    ambientCol: 0x1a1620,// faintly violet — "this is night, and night here is wrong"
  },
};

// Universal village-warm night palette (design call C). Single shared
// "night in a settlement" feel — when in a village/town, you stop
// noticing the sky and notice the lit windows.
const SETTLEMENT_NIGHT_PALETTE = {
  skyCol: 0x1a1820,    // deep blue-grey, cooler than wilderness
  fogColor: 0x2a2620,  // warm muddy fog — reads as smoke + lit windows
  fogDensityMul: 1.15, // gentle bump — settlements feel close at night
  sunCol: 0x9088a0,    // dim warm-cool, neither sun nor moon
  ambientCol: 0x3a3028,// warm shadow tone, lifted slightly so meshes read
};

// HSL shift + value reduction for regions without a hand-designed night
// palette. Produces functional (not crafted) night values from day inputs.
// rgb hex → night rgb hex with reduced saturation/value + cool shift.
function _autoDeriveNight(dayHex){
  const r=(dayHex>>16)&0xff, g=(dayHex>>8)&0xff, b=dayHex&0xff;
  // Reduce value to ~28% of day. Shift hue cool (drop red, lift blue).
  const nr = Math.floor(r * 0.28);
  const ng = Math.floor(g * 0.30);
  const nb = Math.floor(b * 0.36 + 8); // small floor lift to avoid pure black
  return ((nr&0xff)<<16) | ((ng&0xff)<<8) | (nb&0xff);
}

// Build a complete night palette for a region/settlement, given its
// day values. Hand-designed regions return their canonical palette;
// settlements get the universal warm palette; wilderness regions
// without a hand palette get auto-derived values. fogDensityMul is
// applied at interpolation time against the day fog density.
function resolveNightPalette(opts){
  const {region, isSettlement, daySkyCol, dayFogColor} = opts;
  if(isSettlement) return SETTLEMENT_NIGHT_PALETTE;
  if(region && REGION_NIGHT_PALETTES[region]) return REGION_NIGHT_PALETTES[region];
  // Auto-derive for bealach / foothills / royale / ashen.
  return {
    skyCol: _autoDeriveNight(daySkyCol),
    fogColor: _autoDeriveNight(dayFogColor),
    fogDensityMul: 1.20, // slight bump for everything at night
    sunCol: 0x6a6878,    // generic dim cool-grey
    ambientCol: _autoDeriveNight(daySkyCol),
  };
}

// Stash day/night refs on a scene at build time. Called from buildVillage,
// buildWildernessZone, buildTown after their lights are constructed.
//   scene  — THREE.Scene
//   refs   — {sun, ambient, hemi, fog} (all THREE objects)
//   day    — {skyCol, fogColor, fogDensity, sunCol, sunInt, ambientCol,
//             ambientInt, hemiInt} — captured at build time
//   region — string (e.g. 'coastal', 'wastes') or null
//   isSettlement — true for village/town builds
function instrumentSceneForDayNight(scene, refs, day, region, isSettlement){
  const night = resolveNightPalette({region, isSettlement, daySkyCol:day.skyCol, dayFogColor:day.fogColor});
  scene.userData.dayNight = {
    sun: refs.sun, ambient: refs.ambient, hemi: refs.hemi, fog: refs.fog,
    day, night,
    isLocked: false,
    _lastApplied: -1, // dirty flag — applies once on first tick, then per change
  };
}

// Linear color interpolation between two THREE.Color values into a target.
// Avoids allocating new Color objects per tick.
const _dnTmpDay = new THREE.Color();
const _dnTmpNight = new THREE.Color();
function _lerpColorInto(target, dayHex, nightHex, t){
  _dnTmpDay.setHex(dayHex);
  _dnTmpNight.setHex(nightHex);
  target.r = _dnTmpDay.r * (1-t) + _dnTmpNight.r * t;
  target.g = _dnTmpDay.g * (1-t) + _dnTmpNight.g * t;
  target.b = _dnTmpDay.b * (1-t) + _dnTmpNight.b * t;
}

// Returns a 0..1 "night-ness" value based on gameHour().
//   hours 7-17  → 0.0 (full day)
//   hours 5-7   → smoothstep ramp 1.0 → 0.0 (dawn, night fading out)
//   hours 17-19 → smoothstep ramp 0.0 → 1.0 (dusk, night fading in)
//   hours 19-5  → 1.0 (full night)
// v61eb: ramps changed from linear to smoothstep (3t² − 2t³). Linear made
// the boundaries of dawn/dusk visible as a noticeable inflection — the
// world would suddenly start brightening at exactly h=5 and stop at
// h=7. Smoothstep eases in and out at both ends, so the transitions
// land softer and feel more like an actual sunrise/sunset.
function _nightFactor(){
  const h = gameHour();
  if(h >= 7 && h < 17) return 0;
  if(h >= 5 && h < 7) { const u = (h - 5) / 2; const e = u*u*(3 - 2*u); return 1 - e; } // dawn smoothstep
  if(h >= 17 && h < 19) { const u = (h - 17) / 2; return u*u*(3 - 2*u); }                // dusk smoothstep
  return 1; // 19-24, 0-5
}

// Apply day/night lighting to the active outdoor scene. Called from the
// main loop, throttled to 1Hz via _dnLastTickT. No-op for non-outdoor
// scenes (dungeons, interiors don't see sky).
let _dnLastTickT = 0;
let _dnLastNightFactor = -1;
function applyDayNightLighting(now){
  if(now - _dnLastTickT < 1.0) return;
  _dnLastTickT = now;
  // v61e9 — piggyback NPC retreat tick on the same 1Hz throttle.
  // Cheap iteration over the active settlement NPC array; runs even
  // when lighting interpolator early-outs because retreat needs to
  // catch the hour-19 / hour-6 boundary even on stable night/day.
  if(typeof tickNPCRetreat === 'function') tickNPCRetreat();
  // Resolve active outdoor scene. For overworld (Ashenmoor) we have to
  // pick between owScene and owBurnedScene per ashenmoorBurned flag
  // (mirrors the _owActiveScene pattern in the main loop). For everything
  // else, ZONE_BUILDERS[id].sceneGet() returns the live scene object —
  // works for hearthwick, ironhaven, forest, bealach_south, AND every
  // placeholder zone registered via registerPlaceholderZone().
  let sc = null;
  if(activeZoneId === 'overworld'){
    sc = (worldState.ashenmoorBurned && owBurnedScene) ? owBurnedScene : owScene;
  } else if(typeof ZONE_BUILDERS !== 'undefined' && ZONE_BUILDERS[activeZoneId] && ZONE_BUILDERS[activeZoneId].sceneGet){
    sc = ZONE_BUILDERS[activeZoneId].sceneGet();
  }
  if(!sc || !sc.userData || !sc.userData.dayNight) return;
  const dn = sc.userData.dayNight;
  if(dn.isLocked) return; // burned Ashenmoor — visuals frozen
  const t = _nightFactor();
  // Cheap early-out: night factor unchanged AND already applied once.
  if(Math.abs(t - dn._lastApplied) < 0.01 && dn._lastApplied >= 0) return;
  dn._lastApplied = t;
  _dnLastNightFactor = t;
  // Sky / background.
  if(sc.background && sc.background.isColor){
    _lerpColorInto(sc.background, dn.day.skyCol, dn.night.skyCol, t);
  }
  // v61e8 — skyRing material tint. The skyRing is a giant cylinder mesh
  // with a hardcoded day-sky canvas texture (gradient + clouds + distant
  // mountain silhouettes), used as a "fake background" to fill the upper
  // hemisphere where scene.background's flat color geometrically can't
  // reach. Without tinting, the day canvas shows through at night as a
  // bright wedge against the night-blue background. We multiply the
  // material's .color from white (day, no tint, canvas shows as drawn)
  // toward the region's night skyCol at full night. Result: at night
  // the canvas reads as silhouettes-and-clouds darkly tinted to match
  // the region (Wastes near-black, Carraig Mór moonlit silver-blue,
  // auto-derived for the rest). Same per-region night palette philosophy
  // the rest of the interpolator uses.
  if(sc.userData.skyRingMat && sc.userData.skyRingMat.color){
    _lerpColorInto(sc.userData.skyRingMat.color, 0xffffff, dn.night.skyCol, t);
  }
  // Fog color + density. Density lerps against night.fogDensityMul × day.
  if(dn.fog){
    _lerpColorInto(dn.fog.color, dn.day.fogColor, dn.night.fogColor, t);
    // v80 S145 — in the open world the world module's atmosphere() owns fog density (biome blend ×
    // weather × altitude). This authored day/night curve was overwriting it every frame, which is why
    // 'fog' never thickened: it was being reset to the zone's clear-day value.
    const _worldOwnsFog=(typeof activeZoneId!=='undefined'&&activeZoneId==='world');
    if(dn.fog.density != null && !_worldOwnsFog){
      const nightDensity = dn.day.fogDensity * dn.night.fogDensityMul;
      dn.fog.density = dn.day.fogDensity * (1-t) + nightDensity * t;
    }
  }
  // Sun light: color lerps to cool/silver, intensity drops to ~20% at night.
  if(dn.sun){
    _lerpColorInto(dn.sun.color, dn.day.sunCol, dn.night.sunCol, t);
    dn.sun.intensity = dn.day.sunInt * (1-t) + dn.day.sunInt * 0.20 * t;
  }
  // Ambient: color lerps to night palette, intensity drops to ~30%.
  if(dn.ambient){
    _lerpColorInto(dn.ambient.color, dn.day.ambientCol, dn.night.ambientCol, t);
    dn.ambient.intensity = dn.day.ambientInt * (1-t) + dn.day.ambientInt * 0.30 * t;
  }
  // Hemisphere: drop intensity proportionally; color stays as-is (the
  // top/bottom split is doing region-specific work and shouldn't be
  // muddied by a generic night-shift).
  if(dn.hemi){
    dn.hemi.intensity = dn.day.hemiInt * (1-t) + dn.day.hemiInt * 0.35 * t;
  }
  // Sundial glyph reads gameTimeOfDay() directly; no need to push from here.
}

// ─────────────────────────────────────────────────────────────────────
// v61e9 — Day/Night Session C: spawn modulation, NPC retreat, respawn.
//
// Three subsystems shipping together because they're mutually dependent
// (you can't have density-modulation without a respawn trigger or the
// world goes static-cleared after one pass; you can't have retreat
// without a wait mechanic or the player gets stranded).
//
// Subsystems:
//   1. Wait button + modal — universal time-pass affordance, used by
//      both player flow and respawn cycles.
//   2. Spawn density multiplier (1.0 / 1.3 / 1.5 by gameHour) +
//      nightOnly/duskOnly filter flags + respawn:false flags on enemy
//      spawn entries. Multiplier rolls at zone-build OR zone-re-roll
//      time; round-up rounding (1.5× of 2 = 3).
//   3. Per-zone respawn — zones track lastSpawnedAt in worldState;
//      24-in-game-hour threshold; re-roll fires on zone re-entry.
//      Subtle "the wilds have stirred" log line on first re-entry
//      after a respawn.
//   4. Settlement NPC retreat — post-Q7 only. mesh.visible flip
//      at hour-19 / hour-6 boundaries. retreated NPCs filtered from
//      talkNPC; quest markers reroute through findNPCPos's existing
//      indoors:true branch.
// ─────────────────────────────────────────────────────────────────────

// Spawn density multiplier by current time-of-day. Round-up means 1.5×
// of 2 enemies = 3 (always feels like a bump for small groups).
function spawnDensityMultiplier(){
  const h = (typeof gameHour === 'function') ? gameHour() : 12;
  // Day window 7-17 (full daylight)
  if(h >= 7 && h < 17) return 1.0;
  // Night window 19-5 (full night)
  if(h >= 19 || h < 5) return 1.5;
  // Dusk/dawn windows 5-7 / 17-19
  return 1.3;
}

// Round-up multiplier for an integer count.
function _scaleSpawnCount(baseCount){
  return Math.ceil(baseCount * spawnDensityMultiplier());
}

// Filter a list of spawn entries against current time-of-day. Each
// entry can carry { nightOnly:true, duskOnly:true, dayOnly:true }
// flags; entries without flags spawn at all times. No flag = "always".
function filterSpawnEntriesByTime(entries){
  if(!entries || !entries.length) return entries || [];
  const h = (typeof gameHour === 'function') ? gameHour() : 12;
  const isNight = (h >= 19 || h < 5);
  const isDusk = (h >= 5 && h < 7) || (h >= 17 && h < 19);
  const isDay = (h >= 7 && h < 17);
  return entries.filter(e=>{
    if(e.nightOnly && !isNight) return false;
    if(e.duskOnly && !isDusk) return false;
    if(e.dayOnly && !isDay) return false;
    return true;
  });
}

// Per-zone respawn tracking. Stored on worldState so it persists in
// the save (same free-ride trick Session A used for gameTimeMinutes).
// Map: zoneId → gameTimeMinutes-when-last-spawned. Initialized lazily.
function _ensureRespawnTable(){
  if(!worldState.zoneSpawnT) worldState.zoneSpawnT = {};
  return worldState.zoneSpawnT;
}

const ZONE_RESPAWN_THRESHOLD_HOURS = 24; // one full in-game day
function _shouldRespawnZone(zoneId){
  const tbl = _ensureRespawnTable();
  const last = tbl[zoneId];
  if(last == null) return false; // never spawned before — first build, not a respawn
  // Account for clock wrap. gameTimeMinutes is mod 1440; we track total
  // elapsed game-minutes via a separate counter that doesn't wrap.
  const nowAbs = worldState.gameTimeAbsMinutes || 0;
  return (nowAbs - last) >= (ZONE_RESPAWN_THRESHOLD_HOURS * 60);
}
function _markZoneSpawned(zoneId){
  const tbl = _ensureRespawnTable();
  tbl[zoneId] = worldState.gameTimeAbsMinutes || 0;
}

// Wait button + modal. Universal time-pass affordance. Calls forceTime
// with a fade. Disabled in combat / dungeons / open UI.
function _canWait(){
  // Block in dungeons.
  if(lid !== 'overworld') return {ok:false, reason:'You cannot pass time in a dungeon.'};
  // Block during combat — any non-dead enemy aggroed within 20m.
  const inCombat = ZE && ZE.some(e=>e && !e.dead && !e.locked && Math.hypot(px-e.x,pz-e.z)<20);
  if(inCombat) return {ok:false, reason:'You cannot pass time while enemies are near.'};
  // Block while a UI modal is open (dialog, shop, inventory etc).
  if(typeof dlg!=='undefined' && dlg && dlg.style && dlg.style.display==='flex') return {ok:false, reason:''};
  return {ok:true};
}

function openWaitMenu(){
  const can = _canWait();
  if(!can.ok){
    if(can.reason) showMsg(can.reason, '#a89060');
    return;
  }
  openRestSlip('wait', restMarkMin(6)); // S532 — the rest slip (#142 A): waiting by any number of hours, the five times as marks
}
function closeWaitMenu(){
  if(typeof sleepOpen!=='undefined' && sleepOpen && restSlip.mode==='wait') closeSleepUI();
}

// Pass time to a target hour. Wraps day if target < current.
// Uses doFade for the screen transition. Does NOT restore HP/mana/
// stamina — that's safehouse-sleep's privilege. Also advances the
// absolute clock counter so respawn checks see the elapsed time.
function passTimeToHour(targetHour){
  const curHour = (worldState.gameTimeMinutes || 0) / 60;
  let elapsedHours = targetHour - curHour;
  if(elapsedHours <= 0) elapsedHours += 24; // wrap to next day
  passTimeMinutes(Math.round(elapsedHours * 60));
}
// S532 — pass any number of minutes (the rest slip's waiting); passTimeToHour is the five marks' old way in
function passTimeMinutes(elapsedMins){
  closeWaitMenu();
  const can = _canWait();
  if(!can.ok){
    if(can.reason) showMsg(can.reason, '#a89060');
    return;
  }
  elapsedMins = Math.max(1, Math.min(1440, Math.round(elapsedMins)));
  const curMins = worldState.gameTimeMinutes || 0;
  const targetHour = ((curMins + elapsedMins) % 1440) / 60;
  if(typeof doFade !== 'function'){
    // Fallback path — direct apply. Should never be reached in practice.
    worldState.gameTimeMinutes = (curMins + elapsedMins) % 1440;
    worldState.gameTimeAbsMinutes = (worldState.gameTimeAbsMinutes||0) + elapsedMins;
    return;
  }
  doFade(()=>{
    worldState.gameTimeMinutes = (curMins + elapsedMins) % 1440;
    worldState.gameTimeAbsMinutes = (worldState.gameTimeAbsMinutes||0) + elapsedMins;
    if(typeof updateHUD==='function') updateHUD();
    if(typeof saveGame==='function') saveGame();
    showMsg(`Time passes — ${_hourLabel(targetHour)}.`, '#c8b896');
  });
}
function _hourLabel(h){
  if(h===6) return 'dawn';
  if(h===8) return 'morning';
  if(h===12) return 'noon';
  if(h===18) return 'dusk';
  if(h===20) return 'night';
  return restClock(h); // S532 — any minute now, not only the five times
}

// ── NPC retreat ──────────────────────────────────────────────────────
//
// At night (hour ≥ 19 or hour < 6) AND post-Q7 (worldState.commissioned),
// settlement NPCs flip mesh+dot visibility off. retreated NPCs are
// filtered from talkNPC; quest markers reroute through findNPCPos's
// existing indoors:true branch (which already handles "NPC is in their
// keeper-house" — at night, every NPC reads as in-house even without
// a literal keeper assignment).
//
// Wilderness NPCs (Áine etc.) are exempt — they're outdoor characters
// by lore. Pre-Q7 retreat is also disabled: Q1-Q6 stay unbothered.
function _shouldNPCsRetreat(){
  if(!worldState || !worldState.commissioned) return false;
  const h = (typeof gameHour === 'function') ? gameHour() : 12;
  return (h >= 19 || h < 6);
}
function _isSettlementZone(zoneId){
  // Mirrors the buildVillage/buildTown isSettlement flag passed to
  // instrumentSceneForDayNight. Hardcoded list — every settlement
  // zone in the game.
  return zoneId === 'overworld' || zoneId === 'hearthwick' || zoneId === 'ironhaven';
}
// Apply current retreat state to an NPC array. Called on zone entry
// AND from the per-second day/night tick (so 18:55 → 19:05 hides NPCs
// live without leaving the settlement).
function _applyRetreatToZone(zoneId, npcs){
  if(!npcs || !npcs.length) return;
  if(!_isSettlementZone(zoneId)){
    // Non-settlement zone — make sure no NPCs are stuck retreated
    // (defensive — shouldn't happen but cheap to guard).
    npcs.forEach(n=>{
      if(n._retreated){ n._retreated = false; if(n.g) n.g.visible = true; if(n.dot) n.dot.visible = true; }
    });
    return;
  }
  const retreating = _shouldNPCsRetreat();
  npcs.forEach(n=>{
    if(retreating && !n._retreated){
      n._retreated = true;
      if(n.g) n.g.visible = false;
      if(n.dot) n.dot.visible = false;
    } else if(!retreating && n._retreated){
      n._retreated = false;
      if(n.g) n.g.visible = true;
      // Note: n.dot is a quest marker dot; its visibility is also
      // managed by the quest system. Restoring to true here is the
      // right default; the quest tick will re-flip to false next
      // frame for NPCs without active quest markers.
      if(n.dot) n.dot.visible = true;
    }
  });
}
// Resolve the active settlement zone's NPC array. Returns null for
// non-settlement zones.
function _activeSettlementNPCs(){
  if(activeZoneId === 'overworld') return (typeof OW_NPCS !== 'undefined') ? OW_NPCS : null;
  if(activeZoneId === 'hearthwick') return (typeof HEARTHWICK_NPCS !== 'undefined') ? HEARTHWICK_NPCS : null;
  if(activeZoneId === 'ironhaven') return (typeof IRONHAVEN_NPCS !== 'undefined') ? IRONHAVEN_NPCS : null;
  return null;
}
// Per-tick retreat update — called from applyDayNightLighting (1Hz throttle).
// Cheaper to piggyback on that timer than add another.
function tickNPCRetreat(){
  const npcs = _activeSettlementNPCs();
  if(!npcs) return;
  _applyRetreatToZone(activeZoneId, npcs);
}

// ── Respawn ──────────────────────────────────────────────────────────
//
// Re-rolls a zone's enemy roster from its cfg.enemies spec. Removes
// existing enemies (except bosses + respawn:false) from both the ZE
// array and the THREE scene, then re-runs the spawn loop with current
// time-of-day for the multiplier and nightOnly/duskOnly filters.
//
// Called from goToZone on entry, AFTER the scene exists, IF the zone's
// last-spawned timestamp is older than the threshold.
function respawnZoneEnemies(zoneId){
  // Resolve the zone's enemy array. Mirrors the goToZone resolution.
  const z = ZONES[zoneId];
  if(!z || !z.enemies) return false;
  const zScene = ZONE_BUILDERS[zoneId] && ZONE_BUILDERS[zoneId].sceneGet && ZONE_BUILDERS[zoneId].sceneGet();
  if(!zScene) return false;
  // Resolve the cfg used at original build time. Per-zone configs live
  // in zoneCfg field (set by registerPlaceholderZone) or hand-built
  // configs (BEALACH_SOUTH_CONFIG etc). Fall back to z._cfg if present.
  const cfg = z._cfg;
  if(!cfg || !cfg.enemies) return false; // no respawnable spec, nothing to do
  // Remove old respawnable enemies — keep bosses + flagged-permanent.
  // Permanent entries are tracked by setting e._noRespawn=true at build
  // time on entries from groups with respawn:false.
  for(let i = z.enemies.length - 1; i >= 0; i--){
    const e = z.enemies[i];
    if(!e) continue;
    if(e.isBoss) continue;
    if(e._noRespawn) continue;
    // Remove mesh from scene.
    if(e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh);
    if(e.hpFg && e.hpFg.parent) e.hpFg.parent.remove(e.hpFg);
    if(e.hpBg && e.hpBg.parent) e.hpBg.parent.remove(e.hpBg);
    z.enemies.splice(i, 1);
  }
  // Re-roll spawns. Mark the cfg as a respawn build so the spawn loop
  // can filter respawn:false entries. We push directly into z.enemies
  // since the wilderness builder uses cfg.enemiesArr alias to the same
  // reference. To keep this self-contained (no dependency on which
  // builder originally ran), emit via a local mini-builder that
  // mirrors the spawn loop in buildWildernessZone.
  const filteredBase = (typeof filterSpawnEntriesByTime === 'function')
    ? filterSpawnEntriesByTime(cfg.enemies)
    : cfg.enemies;
  const filtered = filteredBase.filter(g => g.respawn !== false);
  // Resolve the appropriate sol array (collision/static-occluder list).
  const sol = z.sol || cfg.sol || [];
  filtered.forEach(group=>{
    const basePos = group.pos || [];
    const targetCount = (typeof _scaleSpawnCount === 'function') ? _scaleSpawnCount(basePos.length) : basePos.length;
    for(let i=0; i<targetCount; i++){
      const fid = legacyFoeId(zoneId, cfg.enemies, group, i); // S543 — the same id, spot and variant as the first build gave it
      let ex, ez;
      if(i < basePos.length){
        [ex, ez] = basePos[i];
      } else {
        const [bx, bz] = basePos[i % basePos.length], pr = seededRng('place', fid);
        ex = bx + (pr()*2-1)*4;
        ez = bz + (pr()*2-1)*4;
      }
      if(typeof buildZoneEnemy === 'function'){
        const e = keyFoe(buildZoneEnemy(zScene, sol, ex, ez, group.name, pickVariant(group.name, level, 'normal', seededRng('variant', fid))), fid);
        if(group.respawn === false && e) e._noRespawn = true;
        z.enemies.push(e);
      }
    }
  });
  _markZoneSpawned(zoneId);
  return true;
}

// Check + maybe-fire respawn for the zone the player is entering.
// Returns true if a respawn fired (caller may want to log).
function checkZoneRespawn(zoneId){
  if(!_shouldRespawnZone(zoneId)) return false;
  const did = respawnZoneEnemies(zoneId);
  if(did){
    // v61e9 — subtle "the wilds have stirred" flavor on first re-entry
    // after respawn. Tells the player the system exists without being
    // intrusive. Settlement zones get a different line — the game-time
    // passage matters there too (NPCs may have retreated/returned),
    // but "the wilds have stirred" doesn't fit Hearthwick.
    if(typeof addLog === 'function'){
      if(_isSettlementZone(zoneId)) addLog('⏳','Time has passed.');
      else addLog('🌒','The wilds have stirred.');
    }
  }
  return did;
}

// S624 — the fort cot E reaches: within 1.3, and nearer you than the way out (the cot stands one cell from the door, and the door's cell said *leave* while E opened the cot).
function fortCotNear(){
  if(typeof D_BEDS==='undefined')return null;
  const bd=D_BEDS.find(b=>b.floor===currentFloor&&Math.hypot(px-b.x,pz-b.z)<1.3);if(!bd)return null;
  if(currentFloor===1){const de=Math.hypot(px-dEntranceX,pz-dEntranceZ);if(de<1.4&&de<=Math.hypot(px-bd.x,pz-bd.z))return null;}
  return bd;
}
function interact(){
  if(lid==='overworld'){
    // Zone gates — highest priority after portals
    const activeGates=ZONES[activeZoneId]?ZONES[activeZoneId].gates:ASHENMOOR_GATES;
    const nearGate=activeGates.find(g=>Math.hypot(px-g.x,pz-g.z)<1.8);
    if(nearGate){
      // v61d7: gate guards — a gate may be conditionally blocked.
      // 'tide' (v61d7, reframed v61ew): Carraig Mór ↔ Inis Rua ferry.
      // The strait runs too rough for the ferry at high tide; it crosses
      // only when the tide is out. Mechanically identical to the prior
      // "causeway submerged" framing — the guard predicate (!isTideOut)
      // is unchanged. The fiction is now boat-not-bridge; the strait
      // stays canon, the rhythm (twice a day) stays canon.
      // 'commission' (v61d9): royal-network spokes, gated by the Q7 commission.
      if(nearGate.guard==='tide' && !isTideOut()){
        showMsg('The strait is too rough for the ferry. The tide rises and falls — try again later.', '#7a98c0');
        return;
      }
      if(nearGate.guard==='commission' && !worldState.commissioned){
        showMsg(_commissionToast(nearGate.targetZone), '#a89060');
        return;
      }
      goToZone(nearGate.targetZone,nearGate.spawnX,nearGate.spawnZ,nearGate.spawnYaw,nearGate.label);
      return;
    }
    // Dungeon portals — any zone
    const nearPortal=PORTALS.find(p=>Math.hypot(px-p.x,pz-p.z)<2.0);
    if(nearPortal){goToDungeon(nearPortal);return;}
    // House doors — Ashenmoor, Hearthwick, or Ironhaven
    if(activeZoneId==='overworld'){
      const nearHouse=HOUSES.find(h=>Math.hypot(px-h.doorX,pz-h.doorZ)<1.5);
      if(nearHouse){
        // v61al: destroyed buildings have no interior to enter. Emit a brief
        // flavor line and return. Damaged-but-standing buildings pass through
        // normally to goToInterior.
        if(_houseDestroyed(nearHouse)){
          showMsg(`There's nothing of ${nearHouse.name} left to enter.`, '#a89080');
          return;
        }
        goToInterior(nearHouse);return;
      }
    } else if(activeZoneId==='hearthwick'){
      const nearHWHouse=HEARTHWICK_HOUSES.find(h=>Math.hypot(px-h.doorX,pz-h.doorZ)<1.5);
      if(nearHWHouse){goToInterior(nearHWHouse);return;}
    } else if(activeZoneId==='ironhaven'){
      const nearIHHouse=IRONHAVEN_HOUSES.find(h=>Math.hypot(px-h.doorX,pz-h.doorZ)<1.5);
      if(nearIHHouse){
        // v61d6 — Safehouse is locked until Caldric grants it. Pre-grant,
        // the door responds with a fixed line in the player's voice rather
        // than silently doing nothing. Post-grant, falls through to normal
        // goToInterior. The same gate is reflected in the proximity prompt
        // text below so the affordance reads as locked from a distance.
        if(nearIHHouse.id==='ih7' && !worldState.safehouseGranted){
          showMsg('Locked. Lord Caldric has the key.','#a89080');
          return;
        }
        goToInterior(nearIHHouse);
        return;
      }
    } else {
      // v61e1: generic per-zone houses lookup. Any zone with a `houses`
      // array on its ZONES entry (currently the new Thorngate / La Porte
      // Grise outposts; future placeholder villages plug in the same way)
      // gets a near-house find without per-zone hardcoded branches.
      const zHouses=(ZONES[activeZoneId]&&ZONES[activeZoneId].houses)||null;
      if(zHouses){
        const nearZH=zHouses.find(h=>!h.byAim&&Math.hypot(px-h.doorX,pz-h.doorZ)<1.5); /* S614 — the ship's hatch is entered by the crosshair (WORLD.shipInteract) */
        if(nearZH){
          // S155 — a shop after hours or a home at night is locked: pick it (S142's lock), or come back
          if(activeZoneId==='world'&&typeof WORLD!=='undefined'&&WORLD.doorLockNow(nearZH)&&!WORLD.doorPicked(nearZH)){tryLockpick(WORLD.doorLockFor(nearZH));return;}
          goToInterior(nearZH);return;
        }
      }
    }
    if(activeZoneId==='world'&&typeof WORLD!=='undefined'&&WORLD.shipInteract())return; // v80 C — the helm
    // v80 S9 — camp bedrolls in the open world
    if(activeZoneId==='world'&&ZONES.world&&ZONES.world.beds){const bd=ZONES.world.beds.find(b=>Math.hypot(px-b.x,pz-b.z)<1.5);if(bd){openSleepUI();return;}}
    // Herb harvest — all zones
    const nearHerb=activeHerbs().find(h=>!h.harvested&&Math.hypot(px-h.x,pz-h.z)<1.1);
    if(nearHerb){harvestHerb(nearHerb);return;}
    // v61ae: Bram's body needs special handling. The standard zone-corpse
    // check below requires items.length>0, which means an already-looted body
    // with empty items becomes NON-interactable. But Bram's body should always
    // show flavor text on approach (and after looting, show a "nothing more
    // remains" variant) — regardless of whether the hammer is still there.
    // Check for bramBody FIRST, before the items.length gate below.
    const nearBram=ZONE_CORPSES.find(c=>c.zone===activeZoneId&&c.bramBody&&Math.hypot(px-c.x,pz-c.z)<1.5);
    if(nearBram){
      // S270 — the quest event fires on every read: read before the Faolchú is down (its prereq), the one-shot flag
      // used to strand the objective, since nothing fired it again.
      if(typeof checkQuestProgress==='function')checkQuestProgress('read_corpse',{corpseId:'bram',zone:'overworld'});
      if(!worldState.bramBodyRead){
        worldState.bramBodyRead = true;
        showMsgLong("He's gone. A goblin's axe is still in his hand. The forge behind him is a ruin.", '#c8a884');
        // v61ae: fire quest event so Q7's Bram objective advances.
        if(typeof checkQuestProgress==='function'){
          checkQuestProgress('read_corpse', {corpseId:'bram', zone:'overworld'});
        }
        // v61al: removed the auto-save here. The flavor text + quest-update
        // popup are the visible state-change signals; the extra saveGame()
        // call was surprising in playtest (player read it as "why did it
        // save when I pressed E to loot?"). Save-on-event should be reserved
        // for completeQuest and major milestones, not per-interact.
        return;
      }
      // Subsequent interacts: if there's still loot, open panel. Otherwise
      // a short prose reminder — keeps the body meaningful to revisit.
      if(nearBram.items && nearBram.items.length>0){
        openLoot(nearBram);
      } else {
        showMsg("Bram is gone. You've taken what there was to take.", '#a89080');
      }
      return;
    }
    // Zone corpse loot — same panel as dungeon corpses, filtered by current zone
    const nearZoneCorpse=ZONE_CORPSES.find(c=>c.zone===activeZoneId&&c.items&&c.items.length&&lookingAt(c)); // v80 — look-at
    if(nearZoneCorpse){
      openLoot(nearZoneCorpse);return;
    }
    // Notice boards — v61b: zone-scoped. Each board carries a `zone` tag at
    // push time, so we filter by `activeZoneId` before the distance check.
    // Previously the unscoped find() could return Ashenmoor's board while
    // the player stood at matching coords in Hearthwick — the 3D mesh lived
    // in owScene (invisible) but the prompt fired with Ashenmoor's title.
    // v61f7-v61f8: Greywatch examines lived here, gating on
    // activeZoneId==='bealach_north_approach' with bespoke positions for
    // a worn gate-pillar carving and a broken interior staircase.
    // v61f9: removed when Greywatch refactored to the procedural-fort
    // model. The walkable interior and the unique-position gate pillar
    // no longer exist as walkable geometry; the fort_door portal handles
    // its own interact. The reusable FORT_EXTERIORS.watchtower builder
    // draws decorative gate-pillars and rubble but they are scenery,
    // not interactable.
    if(typeof isSettlementZone==='function' && isSettlementZone(activeZoneId)){
      // v61em: Salthaven Sea-Folk Shrine — examine prompt with bespoke text.
      // Reuses the notice-board popup DOM (same overlay) so we don't add a
      // new UI surface. Hardcoded position (24,62) matches the shrine mesh
      // in salthaven's detailFn (SW corner, west-harbor flip).
      if(activeZoneId==='salthaven' && Math.hypot(px-24, pz-62)<1.5){
        openNoticeBoard({
          title:'The Sea-Folk Shrine',
          text:"A small open-walled shrine of weather-grey wood, set back from the dock. The platform inside is worn smooth by knees. Coins — copper, mostly, a few silvered — cluster in the offering bowl. Beside them: small carved fish, a button, a scrap of red ribbon. Sailors' luck, paid forward.",
        });
        return;
      }
      // v61ey: Inis Rua — the Mouth (Béal an Domhain). Sea-cave dungeon
      // entrance at the south cliff. Examinable, NOT walkable as a dungeon
      // yet — the cave geometry is set, the WORLD_DUNGEONS hookup waits
      // for the Act II story beat that sends the player in. Position
      // (28, 53) puts the prompt firing when the player stands directly
      // in front of the arch (cave entrance is at z:55-56 in the cliff face).
      if(activeZoneId==='inis_rua' && Math.hypot(px-28, pz-53)<2.0){
        openNoticeBoard({
          title:'The Mouth',
          text:"A sea-cave mouth, low and wide, carved into the cliff at the south end of the island. The tide has been working at it for longer than there have been words for the sea. Inside, the air moves. Not blowing — moving. The sound is not quite a sound.\n\nYou are not ready to go in.",
        });
        return;
      }
      // v61ez: Droichead — the Bridge keystones. Two carved stones at the
      // bridge's midspan, examinable from on-bridge. Position (44, 30) is
      // the bridge midpoint between the two keystones (one at z:28, one
      // at z:32). Lore-canonical "markings that resemble sigils" — the
      // text honors the canon ambiguity (kin to but not the same as).
      if(activeZoneId==='droichead' && Math.hypot(px-44, pz-30)<2.0){
        openNoticeBoard({
          title:'The Keystones',
          text:"Set into the bridge's central span, one on either side, are two large keystones. Their faces are carved — not deeply, but carefully, in lines that catch the eye the way the carvings on certain other stones have caught your eye before. The work is not the same. It is older, perhaps. Or simpler. Or made by a hand that knew only part of the pattern.\n\nWhoever cut them did not sign their work. The river runs beneath the bridge. The bridge holds.",
        });
        return;
      }
      const nearBoard=OW_NOTICE_BOARDS.find(b=>b.zone===activeZoneId&&Math.hypot(px-b.x,pz-b.z)<1.4);
      if(nearBoard){openNoticeBoard(nearBoard);return;}
    }
    talkNPC();return;
  }
  if(lid&&isInterior()){
    // Exit — threshold based on room depth by type
    // v61d4 — added safehouse:8.
    const _intDx={weapon:10,armor:10,potion:9,misc:9,inn:11,church:16,castle:22,safehouse:8};
    const _roomD=currentHouse?(currentHouse._roomD||_intDx[currentHouse.type||'misc']||9):9; // v80 S10 — generated rooms carry their depth
    if(pz>_roomD-1.6&&Math.abs(px-((currentHouse&&currentHouse._roomW)||10)/2)<1.6&&jumpY<.6){exitInterior();return;} // v80 S13 — the door, not the whole back wall
    if(typeof WORLD!=='undefined'&&WORLD.interiorTalk())return; // v80 S12 — guild members
    { // v80 S10 — any bed: rest (and take a banked level)
      if(typeof WORLD!=='undefined'&&WORLD.hatchInteract())return; // v80 — cellar hatch
      if(typeof WORLD!=='undefined'&&WORLD.boxInteract())return; // S155 — the strongbox, the home's chest
      if(typeof WORLD!=='undefined'&&WORLD.lootInteract())return; // v80 — tower chest
      if(typeof WORLD!=='undefined'&&WORLD.guestInteract())return; // v80 — Cill an Aoi
      const bd=intBedTarget(); /* S645 — in range and under the crosshair */
      // S650 — a bed under the crosshair that offers rest wins over a door that is only near (the door is still found by nearness); the prompt in 90-main.js reads the same test
      const bdWins=!!bd&&(typeof WORLD==='undefined'||!!WORLD.bedPrompt(bd));
      if(!bdWins&&typeof WORLD!=='undefined'&&WORLD.intDoorInteract())return; // v80 S143 — the door in the doorway
      if(!bdWins&&nearBarberChair()){openBarberChair(INT_CHAIR.house);return;} // S561 — the barber's chair
      if(bd){if(typeof WORLD!=='undefined'&&WORLD.bedInteract(bd))return;openSleepUI();return;}
    }
    // v61d4 — Safehouse interactables. Stash chest opens the deposit/withdraw
    // panel, bed triggers a fade-rest that fully restores HP/mana/stamina.
    // Tighter proximity radius (1.4u) than the NPC dialog check (2.2u) so
    // the player has to deliberately stand at the object — there's no risk
    // of one masking the other given they're on opposite walls of the
    // safehouse, but the tighter check means accidental triggers from
    // walking past don't fire.
    if(stashAimed()){ /* S656 — under the crosshair */
      openStash();
      return;
    }
    if(intBedPos && !INT_BEDS.length && Math.hypot(px-intBedPos.x,pz-intBedPos.z)<1.4 && bedAimed(intBedPos)){ // v80 S11 — generated rooms use INT_BEDS (height-aware)
      openSleepUI();
      return;
    }
    // Shopkeeper — open dialog first
    if(intNPCMesh && Math.hypot(px-intNPCPos.x,pz-intNPCPos.z)<2.2 && Math.abs(jumpY)<1.2){ // v80 S13 — same floor only
      const keeper=currentHouse?currentHouse.keeper:'';
      // v61ad: prefer SHOP_DIALOG_BURNED[keeper] when Ashenmoor has burned.
      // Currently only Edna has a burned-variant dialog (she's the sole
      // remaining keeper in the ruins). Falls through to normal lookup for
      // any other house interior (and in Ironhaven where ashenmoorBurned is
      // narratively true but the UI hasn't changed).
      const _burned = worldState.ashenmoorBurned && (activeZoneId==='overworld'||(activeZoneId==='world'&&currentHouse&&currentHouse.siteId==='ashenmoor')); // S269 — and in the world's Ashenmoor
      const dlgData=(_burned && typeof SHOP_DIALOG_BURNED!=='undefined' && SHOP_DIALOG_BURNED[keeper])
                   ||SHOP_DIALOG[keeper]||IRONHAVEN_DIALOG[keeper];
      if(dlgData){const extra=(currentHouse&&currentHouse.type==='inn'&&currentHouse.dlg&&currentHouse.dlg._extra)?currentHouse.dlg._extra.filter(t=>/bed for the night/.test(t.label)):[];openDialog({...dlgData,name:keeper,topics:[...extra,...(dlgData.topics||[])]});} // v80 — the innkeeper lets rooms, authored or not
      else if(currentHouse&&currentHouse.dlg){openDialog(currentHouse.dlg);} // v80 — residences talk, they don't trade
      else{openShop();}
      return;
    }
    return;
  }
  // Sigil touch — floor 2 only, closer range than most interactables
  const nearSig=SIGILS.find(s=>s.floor===currentFloor && Math.hypot(px-s.x,pz-s.z)<1.5);
  if(nearSig){touchSigil(nearSig);return;}
  // corpse loot — opens panel. .looted remains for the 60s age-out despawn, independent of item state.
  const nearCorpse=CORPSES.find(c=>!c.looted&&c.items&&c.items.length&&lookingAt(c)); // v80 — look-at
  if(nearCorpse){ openLoot(nearCorpse); return; }
  // v61d5 — Disguised mimic E-press. Caught BEFORE the chest-find below
  // because a disguised mimic and a real chest both pass that find's
  // proximity check (mimic mesh is the same chest geometry). Without
  // this branch the chest-find could open a phantom loot panel on top
  // of the disguised entity. revealMimic flips e.disguised = false,
  // shows teeth/eyes, plays the cry, and starts the burst telegraph.
  // The actual burst hit lands when the telegraph resolves — block-able.
  const mim=ENEMIES.find(en=>!en.dead&&en.disguised&&en.floor===currentFloor&&Math.hypot(px-en.x,pz-en.z)<1.1);
  if(mim){ revealMimic(mim); return; }
  // chest — opens panel. Finds any chest on this floor in range whose items aren't exhausted OR hasn't been opened yet
  // (empty-on-spawn chests still show panel once so the "oh, empty" reveal happens).
  const ch=CHESTS.find(c=>c.floor===currentFloor&&lookingAt(c)&&(!c.opened||c.items.length>0)); // v80 — look-at
  if(ch){ if(ch.locked){tryLockpick(ch);return;} openLoot(ch); return; } // S150 — a locked chest is picked first
  // barrel — same pattern as chests. v61g7: radius 1.0 → 1.1 for the larger
  // v61g7 container meshes (0.5u footprint vs the old 0.3u).
  if(fortCotNear()){openSleepUI();return;} // v80 S9 — fort cots; S624 — the exit wins when it is nearer
  const br=BARRELS.find(b=>b.floor===currentFloor&&lookingAt(b,2.6)&&(!b.opened||b.items.length>0)); // v80 — look-at
  if(br){ openLoot(br); return; }
  // exit via entrance cell (floor 1 only)
  if(currentFloor===1&&Math.hypot(px-dEntranceX,pz-dEntranceZ)<1.4){goToOW();return;}
  // staircase interaction
  if(dStairC!==null&&!DUNGEON_STAIRWELL&&Math.hypot(px-dStairC,pz-dStairR)<1.3){ // v80 S8 — legacy teleport only without a stairwell
    if(currentFloor===1&&dMap2)goToFloor2();
    else if(currentFloor===2)goToFloor1();
    return;
  }
  // v61g6: door interaction reworked.
  //   - Locked doors (cave treasure rooms): key check, one-way open, mesh removed on unlock.
  //   - Unlocked doors (forts + cave corridors): toggle open/close on E. Closing
  //     refused if an enemy or the player stands in the door cell. Mesh kept in
  //     scene; visibility toggled. Plays sndDoorOpen / sndDoorClose.
  const nearDoorObj=DOORS.find(d=>d.floor===currentFloor&&Math.hypot(px-d.x,pz-d.z)<1.4);
  if(nearDoorObj){
    if(nearDoorObj.locked){
      // Locked door — existing key-check behavior, preserved verbatim for caves.
      if(!nearDoorObj.open){
        tryLockpick(nearDoorObj); // v80 — a pick and a steady hand
      }
      return;
    }
    // Unlocked door — toggle open/close.
    if(!nearDoorObj.open){
      sndDoorOpen();
      nearDoorObj.open=true;
      // v61gf: visible swing on the hinge sub-group instead of mesh.visible=false.
      // -1.48 rad (~−85°) swings the door open to the player's left when facing
      // the door from negative Z (a touch shy of 90° reads as "ajar" rather
      // than "flung against the wall"). Fallback for older save-state doors.
      if(nearDoorObj.hinge) nearDoorObj.hinge.rotation.y = -1.48;
      else nearDoorObj.mesh.visible=false;
    } else {
      // Closing — refuse if anything occupies the door cell.
      const dx=nearDoorObj.x, dz=nearDoorObj.z;
      const playerInCell = Math.floor(px+.5)===dx && Math.floor(pz+.5)===dz;
      const enemyInCell = ENEMIES.some(en=>!en.dead && en.floor===currentFloor &&
        Math.floor(en.x+.5)===dx && Math.floor(en.z+.5)===dz);
      if(playerInCell || enemyInCell){
        showMsg('Something is in the way.','#cc8844');
      } else {
        sndDoorClose();
        nearDoorObj.open=false;
        if(nearDoorObj.hinge) nearDoorObj.hinge.rotation.y = 0;
        else nearDoorObj.mesh.visible=true;
      }
    }
    return;
  }
}
