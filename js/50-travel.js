
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
    if(targetZone==='world'&&typeof prewarmFoes==='function'&&typeof WORLD!=='undefined')prewarmFoes(WORLD.scene,CAM); /* S688 — every foe's shaders, once, behind the fade */
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
// S1278 — a herb's ground is read once and kept (h._by): every herb in every loaded cell read the whole terrain height each frame
// to bob 1.6 cm, 8.3 ms of a 24 ms tick in Dunmore on CI's CPU. HERB_RR of them are read again each frame, round the list, so
// ground a stamp or a road changes after the herb was set reaches it within a few seconds
const HERB_RR=8;let _herbRR=0;
function tickHerbs(dt,now){
  // Tick all zone herb arrays
  const allHerbs=activeZoneId==='world'?activeHerbs():activeZoneId==='forest'?FOREST_HERBS:activeZoneId==='ironhaven'?IH_HERBS:OW_HERBS; // v80 — streamed world keeps its herbs in ZONES.world.herbs
  const nH=allHerbs.length;if(nH){for(let k=0;k<Math.min(nH,HERB_RR);k++){const h=allHerbs[(_herbRR+k)%nH];if(h)h._by=null;}_herbRR=(_herbRR+HERB_RR)%nH;}
  const tine=activeZoneId==='world'&&typeof gateToll==='function'&&gateToll('tine'); /* S1369 — Tine's toll: half of Aurenne's herbs gone */
  allHerbs.forEach(h=>{
    if((tine||h._tolled)&&activeZoneId==='world'){const t=tine&&herbTolled(h,true);
      if(t){if(!h._tolled){h._tolled=true;h.harvested=false;h.g.visible=false;h.gl.intensity=0;}return;}
      h._tolled=false;if(!h.harvested)h.g.visible=true;}
    if(h.harvested){
      if(h.def.respawn!=null){h.respawnT-=dt;if(h.respawnT<=0){h.harvested=false;h.g.visible=true;h.gl.intensity=h.def.glowInt||.5;const u=h.g.userData;if(u&&u.picked){u.whole.visible=true;u.picked.visible=false;}}}
      return;
    }
    if(h._by==null)h._by=activeTerrainH(h.x,h.z);
    const baseY=h._by;
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
const CAOR_RISK=1.2,FORTUNE_CRIT_PCT=.005,FORTUNE_CRIT_MULT=1.5; /* S953 — Fortune's crit 0.5% a point (was 2%), the attributes at ≤1% */
const RENEWAL_RATE=.5;
function _fortuneCrit(e){const c=Math.min(.5,(ATTRS.fortune||0)*FORTUNE_CRIT_PCT);return c>0&&(typeof foeRand==='function'?foeRand(e):Math.random())<c?FORTUNE_CRIT_MULT:1;} // S480 — on the struck foe's stream (co-op rules)
// S320 — the same ward on every other blow, shot and trap that reaches you (at least 1 when something landed)
function _warded(d,src){if(!(d>0))return d;d=Math.max(1,Math.round(d*_wardMult()*(src&&src.beast?_buffMult('beastResist',1):1)*(src&&(src.fire||FIRE_FOES[src.baseType||src.baseName])?(typeof gateGift==='function'&&gateGift('tine')?.5:1)*_buffMult('resistHeat',1):1)));return src&&src.trap?d:challengeTaken(d);} /* S684 — the challenge scales a foe's blow after the ward; a trap's is its own */
const TRAP_SRC={trap:true};
// S1349 — a source of fire, for Tine's gift (fire takes half while its great gate is torn): a source tagged `fire` or a fire foe
const FIRE_FOES={'Fire Elemental':1};
const FIRE_SRC={fire:true};
// S321 — the herbs' hidden effects, read where their text says: Wolf's Bane (`beastResist`, above, from a beast's blow),
// Thornberry (`blockBoost`, a raised guard stops a larger share, to .9), Briarweed (`atkSpeed`, in `_weaponSwingFactor`),
// Duilleog Ghorm (`spellDuration`, in `applySpellBuff`)
const BEAST_TYPES=new Set(['Wolf','Dire Wolf','Snow Wolf','Ash Hound','Spider','Cave Bear','Boar','Bog Crawler','Sand Scorpion','Shark']);
function _blockBoost(r){return Math.min(.9,r*_buffMult('blockBoost',1));}
// S322 — the rest of the herbs, the same in the open world and underground: Ferrous Guard (`defBoost`) counts as armour
// against every blow and shot; Mist Fern (`staminaCost`) lightens every swing, bash, roll and draw, not only the sprint
// S1047 — what you wear counts × the Armour skill's 0.775 (untrained) to 1.25 (at 100); a spell's ward is added whole
function _armour(){return Object.values(EQ).reduce((a,v)=>a+(v&&v.def?v.def:0),0)*armourSkillMult()+(_hasBuff('defBoost')?(_activeBuffs('defBoost')[0].amount||0):0);}
function _stamCost(c){return c*_buffMult('staminaCost',1);}
// S325 — max stamina without what an active Stonecress lends (the save keeps this; buffs don't survive a load)
function _baseMaxStamina(){return maxStamina-ACTIVE_BUFFS.filter(b=>b.type==='maxStamBuff').reduce((a,b)=>a+(b._stamAdd||0),0);}
// S323 — what the level-up card promises: Resolve +1% magic resist a point (the Faolchú's fire, the dungeon's bolts),
// Finesse -5% sprint cost a point (to a quarter)
function _magicResist(){return Math.max(.5,1-(ATTRS.resolve||0)*.01);}
function _finesseSprint(){return Math.max(.25,1-attrEff('finesse')*.01);} /* S953 — 1% a Finesse point (was 5%): Athletics carries the sprint's cost */
// S341 — two buffs of one kind don't stack, and neither may cut the other short: the stronger is the one that counts,
// and a weaker one that outlasts it waits underneath (`_under`, counting down all the while) and holds again when the
// stronger ends. So Firemoss eaten under the Boon of the Arm no longer ends the boon, and a Shield cast under the Boon
// of Stone gives the boon back when it lapses. For these kinds a lower multiplier is the stronger.
const BUFF_LOW_GOOD=new Set(['spellCost','warding','dmgReduce','detectReduce','staminaCost','physResist','beastResist','resistHeat']); /* S1483 — a tincture's Resist Heat */
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
  h.harvested=true;h.gl.intensity=0;skillUse('alchemy',1,h); /* S941 — a pick is an Alchemy use */
  {const u=h.g.userData;if(u&&u.picked){u.whole.visible=false;u.picked.visible=true;}else h.g.visible=false;} // S217 — a bush picked in the old zones stays, bare, as in the world
  if(h.def.respawn!=null)h.respawnT=h.def.respawn;
  bagAdd(item);
  addLog('🌿','Harvested '+h.def.name);
  if(typeof uiTone==='function'){uiTone(320,420,.12,.1,'sine');uiNoise(.1,.1,600);}
  showMsg('Harvested '+h.def.name+'!','#88cc88');
}

function useHerb(i){
  const it=BAG[i];if(!it||it.type!=='herb')return;
  let eff=it.effect;
  if(!eff)return;
  if(!eff.type)eff=eff.heal?{type:'heal',amount:eff.heal}:eff.mana?{type:'mana',amount:eff.mana}:eff.stam?{type:'stamina',amount:eff.stam}:eff; /* S1483 — the sea's herbs are written {stam:20}, and eaten did nothing */
  sndUsePotion();
  // Apply known effect
  const said=herbKnownApply(eff,it.name);if(said)showMsg(`${it.name} — ${said[0]}`,said[1]);
  // Track consumption and check for hidden unlock
  const countKey=herbKeyOf(it)||it.name.toLowerCase().replace(/[^a-z]/g,''); /* S1483 — by HERB_DEF's key: a reload drops _typeKey, and Fearnóg's name made 'fearng' */
  HERB_CONSUME_COUNTS[countKey]=(HERB_CONSUME_COUNTS[countKey]||0)+1;
  const count=HERB_CONSUME_COUNTS[countKey],N=herbTellCount(),HK=herbsKnown(),told=HK.told||(HK.told={});
  // S1499 — Tell moves the reveal to 5 eats, so the flash is once a herb (told), not at one count; past 15 it was told already
  const justUnlocked=count>=N&&count-1<HIDDEN_UNLOCK_COUNT&&!told[countKey];if(justUnlocked)told[countKey]=1;
  const unlocked=(count>=N);
  // Apply hidden effect if already unlocked (not on the unlock consume itself — let the message land first)
  if(unlocked&&!justUnlocked&&HERB_DEF[countKey]&&HERB_DEF[countKey].zone==='sea'){const f=HERB_FX[countKey]&&HERB_FX[countKey][1],d=f&&ALCH_FX[f];if(d&&d.drink)d.drink(1);else if(d&&d.buff)_applyBuff({duration:ALCH_FORTIFY_S,...d.buff(1),label:d.label,col:d.col});} /* S1483 — a sea herb's hidden effect is its second brewing effect (its hiddenEffect was Firemoss's, copied) */
  else if(unlocked&&!justUnlocked&&it.hiddenEffect){
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
// a herb's known effect, applied: eaten whole (useHerb) or at a third in a seasoned meal (eatMeal). Returns [what, colour],
// or null for a buff, which says its own
function herbKnownEff(it){let eff=it&&it.effect;if(!eff)return null;
  if(!eff.type)eff=eff.heal?{type:'heal',amount:eff.heal}:eff.mana?{type:'mana',amount:eff.mana}:eff.stam?{type:'stamina',amount:eff.stam}:eff;return eff;}
function herbKnownApply(eff,name){
  if(eff.type==='heal'){PHP=Math.min(effMaxHP(),PHP+eff.amount);return [`+${eff.amount} HP`,'#44ee44'];}
  if(eff.type==='stamina'){stamina=Math.min(effMaxStamina(),stamina+eff.amount);return [`+${eff.amount} Stamina`,'#88ee44'];}
  if(eff.type==='mana'){mana=Math.min(effMaxMana(),mana+eff.amount);return [`+${eff.amount} Mana`,'#88aaff'];}
  if(eff.type==='hpRegen'){_applyBuff({...eff,label:name+' Regen',col:'#44cc44'});return null;}
  if(eff.type==='damage'){PHP=Math.max(1,PHP-eff.amount);return [`-${eff.amount} HP (bitter)...`,'#cc4444'];}
  return null;}
// ── S1483 — Survival B, session 1: herbs and brewing (`docs/design/survival-build.md`, Michael's B of 30 Sep 2026) ──
// Every herb has four brewing effects from one pool of 22. The first is the one you learn by eating it; the second is its
// hidden effect's kin in the pool where it has one (learnt at 15 eats, as before), otherwise dealt; the third and fourth
// are dealt. A hidden effect with no kin in the pool (Luibh Uisce's flood, Goldenrod's luck) is still eaten as today and
// never brews. Two herbs ground together with a mortar make a tincture of every effect both carry; no shared effect, and
// nothing is made, the herbs are kept and the pair is marked. A shared harmful effect makes a poison that coats the blade
// for three blows. A tincture turns after five days to half its strength. Strength is the Alchemy curve (skillMult) and
// 1% an Intelligence point. Every effect sits on 4 to 7 herbs, Restore Health and Restore Mana on 8 (eight herbs already
// restore each when eaten), and no two herbs share more than two (`tests/herbpool`).
const ALCH_FX={
  restoreHealth:{label:'Restore Health',col:'#44ee44',price:15,drink:s=>{const n=Math.round(20*s);PHP=Math.min(effMaxHP(),PHP+n);return `+${n} HP`;}},
  restoreStamina:{label:'Restore Stamina',col:'#88ee44',price:22,drink:s=>{const n=Math.round(30*s);stamina=Math.min(effMaxStamina(),stamina+n);return `+${n} Stamina`;}},
  restoreMana:{label:'Restore Mana',col:'#88aaff',price:30,drink:s=>{const n=Math.round(30*s);mana=Math.min(effMaxMana(),mana+n);return `+${n} Mana`;}},
  regenHealth:{label:'Regenerate Health',col:'#44cc44',price:30,buff:s=>({type:'hpRegen',rate:+(1.5*s).toFixed(2)})},
  regenMana:{label:'Regenerate Mana',col:'#4a8ad4',price:35,buff:s=>({type:'mpRegen',rate:+(1*s).toFixed(2)})},
  fortifyMelee:{label:'Fortify Melee',col:'#ff6622',buff:s=>({type:'meleeDmg',mult:+(1+.1*s).toFixed(3)})},
  fortifyBlock:{label:'Fortify Block',col:'#ff4444',buff:s=>({type:'blockBoost',mult:+(1+.15*s).toFixed(3)})},
  fortifyBow:{label:'Fortify Bow',col:'#c8a878',buff:s=>({type:'bowDmg',mult:+(1+.1*s).toFixed(3)})},
  fortifyCarry:{label:'Fortify Carry',col:'#eedd88',buff:s=>({type:'carryBoost',amount:Math.round(20*s)})},
  swiftness:{label:'Swiftness',col:'#aaccaa',price:32,buff:s=>({type:'swiftness',mult:+(1+.1*s).toFixed(3)})},
  quiet:{label:'Quiet',col:'#446622',buff:s=>({type:'detectReduce',mult:+Math.max(.5,1-.2*s).toFixed(3)})},
  featherfall:{label:'Featherfall',col:'#d8e8ff',buff:()=>({type:'featherfall',amount:8})},
  resistCold:{label:'Resist Cold',col:'#a0c8ff',buff:()=>({type:'resistCold',amount:1})},
  resistHeat:{label:'Resist Heat',col:'#ff9a50',buff:s=>({type:'resistHeat',mult:+Math.max(.4,1-.25*s).toFixed(3)})},
  curePoison:{label:'Cure Poison',col:'#9adf9a',drink:()=>{let n=0;for(let i=ACTIVE_BUFFS.length-1;i>=0;i--)if(ACTIVE_BUFFS[i].harm){ACTIVE_BUFFS.splice(i,1);n++;}return n?'the poison is gone':'nothing to cure';}},
  waterBreathing:{label:'Water Breathing',col:'#80c0ff',drink:s=>{SPELL_FX.waterbreath=Math.max(SPELL_FX.waterbreath||0,performance.now()+60000*s);return 'you can breathe water';}},
  nightEye:{label:'Night Eye',col:'#c0c0ff',drink:s=>{SPELL_FX.nighteye=Math.max(SPELL_FX.nighteye||0,performance.now()+60000*s);return 'the dark gives way';}},
  vanish:{label:'Vanish',col:'#8833cc',buff:s=>({type:'vanish',duration:Math.round(5*s)})},
  damageHealth:{label:'Damage Health',col:'#cc2222',harm:(e,s)=>{const d=Math.max(1,Math.round(8*s));e.hp=Math.max(0,e.hp-d);if(e.hpFg){e.hpFg.scale.x=e.hp/e.maxHp;e.hpFg.position.x=(e.hp/e.maxHp-1)*.275;}return d;}},
  drainStamina:{label:'Drain Stamina',col:'#887733',harm:(e,s)=>{if(typeof e.posture==='number'&&applyPostureDamage(e,10*s,performance.now()/1000)){staggered.push({e,t:dazeS(POSTURE_BREAK_STUN)});staggerFlash(e);}return 0;}},
  slow:{label:'Slow',col:'#6a7a9a',harm:(e,s)=>{e._slowUntil=playClockS+4*s;return 0;}},
  weaken:{label:'Weaken',col:'#9a5a8a',harm:(e,s)=>{if(typeof e.posture==='number'&&applyPostureDamage(e,.25*(e.maxPosture||e.posture)*Math.min(1.4,s),performance.now()/1000)){staggered.push({e,t:dazeS(POSTURE_BREAK_STUN)});staggerFlash(e);}return 0;}},
};
const ALCH_FORTIFY_S=60,TINCTURE_TURN_DAYS=5,POISON_BLOWS=3,FOE_SLOW=.6,MORTAR_NAME='Mortar and Pestle';
const HERB_FX={
  firemoss:['restoreHealth','fortifyMelee','resistCold','swiftness'],silverleaf:['restoreStamina','swiftness','drainStamina','featherfall'],
  heartroot:['restoreMana','regenMana','fortifyCarry','slow'],ashwort:['restoreHealth','resistHeat','nightEye','vanish'],
  muirfhear:['restoreStamina','quiet','fortifyBow','drainStamina'],goldenrod:['restoreHealth','curePoison','vanish','fortifyCarry'],
  thornberry:['restoreHealth','fortifyBlock','damageHealth','curePoison'],coldmoss:['restoreMana','resistHeat','regenMana','fortifyBlock'],
  fearnog:['restoreHealth','fortifyBlock','resistCold','weaken'],shadowcap:['restoreMana','vanish','nightEye','weaken'],
  wolfsbane:['regenHealth','damageHealth','fortifyMelee','slow'],caorthann:['restoreStamina','fortifyBow','curePoison','vanish'],
  deepmoss:['restoreMana','regenHealth','nightEye','swiftness'],briarweed:['restoreStamina','slow','damageHealth','weaken'],
  luibhuisce:['restoreMana','waterBreathing','featherfall','resistHeat'],ferrousweed:['restoreHealth','fortifyBlock','resistHeat','slow'],
  graywort:['regenHealth','curePoison','vanish','quiet'],caordubh:['damageHealth','fortifyMelee','weaken','drainStamina'],
  mistfern:['restoreMana','quiet','featherfall','resistCold'],stonecress:['restoreStamina','fortifyCarry','featherfall','vanish'],
  veilwort:['restoreHealth','quiet','curePoison','featherfall'],credearg:['regenHealth','fortifyCarry','slow','swiftness'],
  duilleogghorm:['restoreMana','regenMana','waterBreathing','fortifyBow'],
  kelp:['restoreStamina','waterBreathing','slow','fortifyMelee'],sealily:['restoreMana','nightEye','regenMana','drainStamina'],
  pearlweed:['restoreHealth','waterBreathing','resistCold','fortifyBow'],
};
// the herbs whose second effect is their hidden one's kin, so 15 eats teach it as well; the sea's three have no hidden of their own
const HERB_KIN=new Set(['firemoss','silverleaf','muirfhear','thornberry','shadowcap','deepmoss','caordubh','kelp','sealily','pearlweed']);
// a herb in the bag by its HERB_DEF key: the pick's _typeKey, which a reload drops, else its name
function herbKeyOf(it){if(!it)return null;if(it._typeKey&&HERB_FX[it._typeKey])return it._typeKey;if(typeof HERB_DEF!=='undefined')for(const k in HERB_DEF)if(HERB_DEF[k].name===it.name)return k;
  const k=String(it.name||'').toLowerCase().replace(/[^a-z]/g,'');return HERB_FX[k]?k:null;}
function herbsKnown(){return worldState.herbsKnown||(worldState.herbsKnown={fx:{},none:{}});}
// S1499 — Tell (Alchemy 25): a herb's hidden effect is learnt at 5 eats, not HIDDEN_UNLOCK_COUNT's 15
function herbTellCount(){return perk('alchemy',25)?5:HIDDEN_UNLOCK_COUNT;}
function herbFxKnown(k,i){const n=HERB_CONSUME_COUNTS[k]||0;if(i===0&&n>0)return true;if(i===1&&HERB_KIN.has(k)&&n>=herbTellCount())return true;const f=herbsKnown().fx[k];return !!(f&&f[i]);}
function learnHerbFx(k,i){const K=herbsKnown();const f=K.fx[k]||(K.fx[k]=[0,0,0,0]);const was=herbFxKnown(k,i);f[i]=1;return !was;}
function brewPairKey(a,b){return [a,b].sort().join('|');}
function alchStrength(){return skillMult('alchemy')*(1+.01*attrEff('intelligence'));}
function gameDayNow(){return Math.floor((worldState.gameTimeAbsMinutes||0)/1440);}
function brewTurned(it){return !!(it&&it.brew&&gameDayNow()-it.brew.day>=TINCTURE_TURN_DAYS&&!perk('alchemy',75));}
function brewStrength(it){return it.brew.s*(brewTurned(it)?.5:1);}
function brewMax(){return perk('alchemy',50)?3:2;}
// what these herbs would make: every effect at least two of them carry; a harmful one makes it a poison of the harmful alone
function brewShared(keys){const c={};keys.forEach(k=>new Set(HERB_FX[k]||[]).forEach(f=>{c[f]=(c[f]||0)+1;}));
  const fx=Object.keys(c).filter(f=>c[f]>=2);const harm=fx.filter(f=>ALCH_FX[f].harm);return {fx:harm.length?harm:fx,poison:harm.length>0,all:fx};}
function hasMortar(){return BAG.some(b=>b&&b.name===MORTAR_NAME);}
function brewName(fx,poison){const l=fx.map(f=>ALCH_FX[f].label);return (poison?'Poison of ':'Tincture of ')+(l.length>1?l.slice(0,-1).join(', ')+' and '+l[l.length-1]:l[0]);}
// grind the herbs (HERB_DEF keys, one of each from the bag) into a tincture or a poison. Returns {made, item, learnt, kept}
function brewHerbs(keys){
  keys=[...new Set(keys)];
  if(!hasMortar())return {made:false,why:'You need a mortar and pestle.'};
  if(keys.length<2||keys.length>brewMax())return {made:false,why:brewMax()===3?'Two or three herbs.':'Two herbs.'};
  const idx=keys.map(k=>BAG.findIndex(b=>b&&b.type==='herb'&&herbKeyOf(b)===k));
  if(idx.some(i=>i<0))return {made:false,why:'You do not have those herbs.'};
  const sh=brewShared(keys),K=herbsKnown();
  if(!sh.all.length){for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++)K.none[brewPairKey(keys[i],keys[j])]=1;
    return {made:false,kept:true,why:'Nothing between them. The herbs are kept.'};}
  const newPair=keys.some((a,i)=>keys.some((b,j)=>j>i&&!(K.pairs&&K.pairs[brewPairKey(a,b)])));
  K.pairs=K.pairs||{};for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++)K.pairs[brewPairKey(keys[i],keys[j])]=1;
  const learnt=[];keys.forEach(k=>HERB_FX[k].forEach((f,i)=>{if(sh.all.includes(f)&&learnHerbFx(k,i))learnt.push(k+':'+f);}));
  idx.sort((a,b)=>b-a).forEach(i=>{const b=BAG[i];b.qty=(b.qty||1)-1;if(b.qty<=0)BAG.splice(i,1);});
  const s=+alchStrength().toFixed(3),day=gameDayNow();
  const item={name:brewName(sh.fx,sh.poison),ico:sh.poison?'☠️':'🧪',type:'potion',weight:.5,sellMult:.4,
    buyPrice:Math.max(...sh.fx.map(f=>ALCH_FX[f].price||25)),brew:{fx:sh.fx,s,day,poison:sh.poison}};
  item.brewKey=sh.fx.join('+')+'@'+s+'/'+day;
  const n=perk('alchemy',100)?2:1;if(n>1)item.qty=n; /* S1499 — Double measure (Alchemy 100): two from one grinding */
  bagAdd(item);
  skillUse('alchemy',8+(newPair?25:0));
  return {made:true,item:BAG.find(b=>sameStack(b,item))||item,learnt,newPair,n};
}
// drink a tincture, or coat the blade with a poison
let BLADE_POISON=null;
function useTincture(i){
  const it=BAG[i];if(!it||!it.brew)return;const s=brewStrength(it),fx=it.brew.fx.slice();
  if(it.brew.poison){const w=EQ.weapon;if(!w||(typeof _isBowEquipped==='function'&&_isBowEquipped())){showMsg('Poison needs a blade in your hand.','#cc8844');return;}
    BLADE_POISON={fx,s,blows:POISON_BLOWS,name:it.name};it.qty=(it.qty||1)-1;if(it.qty<=0)BAG.splice(i,1);
    showMsg(`${it.name} coats your ${w.name}.`,'#9adf9a');if(typeof renderHubInv==='function')renderHubInv();return;}
  if(DRINK){showMsg('You are still drinking.','#cc8844');return;}
  const nm=it.name;it.qty=(it.qty||1)-1;if(it.qty<=0)BAG.splice(i,1);
  startDrink(()=>drinkBrew(fx,s,nm),nm);
}
function drinkBrew(fx,s,nm){const said=[];
  fx.forEach(f=>{const d=ALCH_FX[f];if(d.drink)said.push(d.drink(s));else if(d.buff){const b=d.buff(s);_applyBuff({duration:ALCH_FORTIFY_S,...b,label:d.label,col:d.col});}});
  if(said.length)showMsg(`${nm} — ${said.join(', ')}`,ALCH_FX[fx[0]].col);
  if(typeof updateHUD==='function')updateHUD();}
// a landed blow with a poisoned blade (74's resolver): each harmful effect on the foe, three blows
function bladePoisonHit(e){const P=BLADE_POISON;if(!P||!e||e.hp<=0)return 0;let d=0;
  P.fx.forEach(f=>{d+=ALCH_FX[f].harm(e,P.s)||0;});e.alert=true;
  if(--P.blows<=0){BLADE_POISON=null;showMsg('The poison is spent.','#888888');}
  return d;}
function foeSlowMult(e){return e&&e._slowUntil>playClockS?FOE_SLOW:1;}
// the brewing page's text for a tincture in the bag
function brewLines(it){const b=it.brew;if(!b)return '';const t=brewTurned(it),s=brewStrength(it);
  return b.fx.map(f=>`<div class="bt-row" style="color:${ALCH_FX[f].col}">${ALCH_FX[f].label}</div>`).join('')+
    `<div class="bt-row" style="color:#a08860;font-size:9px">${b.poison?'Coats a blade for '+POISON_BLOWS+' blows':'Strength ×'+s.toFixed(2)}${t?' · turned':''}</div>`;}
// the mortar at an apothecary and the Mages' Guild (40 gold, weight 1)
const MORTAR_ITEM={name:MORTAR_NAME,ico:'🥣',type:'misc',weight:1,buyPrice:40,sellMult:.4};
function mortarFor(h){return h&&(h.type==='potion'||h.type==='apothecary'||h.type==='guild_m')?[{...MORTAR_ITEM}]:[];}

// ── the brewing page (parchment, Michael's A on the interface): the herbs on the left, the chosen herbs' four rows right ──
let brewOpen=false,brewSel=[],brewSaid='';
function openBrewPage(){
  if(!hasMortar()){showMsg('You need a mortar and pestle.','#cc8844');return;}
  if(typeof hubOpen!=='undefined'&&hubOpen&&typeof closeHub==='function')closeHub();
  if(typeof _releasePointerLockForMenu==='function')_releasePointerLockForMenu();
  let ov=document.getElementById('brewui');
  if(!ov){ov=document.createElement('div');ov.id='brewui';
    ov.style.cssText='position:fixed;inset:0;z-index:8500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35)';
    ov.innerHTML='<div style="width:640px;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;padding:18px 24px 16px;background:#e9dcc2;color:#3a2c18;border:6px double #8a7040;border-radius:6px;font-family:Georgia,serif;box-shadow:0 10px 40px #000a">'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #a89060;padding-bottom:6px"><span style="font-size:22px;color:#7a1f10;letter-spacing:.06em;font-variant:small-caps">The Mortar</span><span id="br-skill" style="font-style:italic;font-size:13px;color:#8a7050"></span></div>'+
      '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:10px"><div id="br-herbs" style="flex:1 1 200px;min-width:0;font-size:14px;line-height:1.7"></div><div id="br-right" style="flex:1.4 1 260px;min-width:0;font-size:14px;line-height:1.6"></div></div>'+
      '<div id="br-said" style="min-height:20px;margin-top:8px;font-style:italic;color:#7a1f10;font-size:14px"></div>'+
      '<div style="display:flex;align-items:center;gap:12px;margin-top:8px;border-top:1px solid #a89060;padding-top:8px"><button type="button" id="br-go" style="background:none;border:1px solid #7a1f10;border-radius:3px;font:18px Georgia,serif;color:#7a1f10;font-variant:small-caps;cursor:pointer;padding:2px 14px">Grind</button>'+
      '<span style="flex:1"></span><span style="font-size:12px;font-style:italic;color:#8a7050"><button type="button" id="br-no" style="background:none;border:1px solid #a89060;border-radius:3px;font:13px Georgia,serif;color:#3a2c18;cursor:pointer;padding:2px 7px">Esc</button> as you were · Enter grinds</span></div></div>';
    document.body.appendChild(ov);
    ov.querySelector('#br-go').onclick=()=>brewGo();ov.querySelector('#br-no').onclick=()=>closeBrewPage();}
  brewSel=brewSel.filter(k=>BAG.some(b=>b&&b.type==='herb'&&herbKeyOf(b)===k));brewSaid='';
  ov.style.display='flex';brewOpen=true;brewDraw();
}
function closeBrewPage(){const ov=document.getElementById('brewui');if(ov)ov.style.display='none';brewOpen=false;if(typeof refocusView==='function')refocusView();}
function brewHerbList(){const m=new Map();BAG.forEach(b=>{if(!b||b.type!=='herb')return;const k=herbKeyOf(b);if(!k)return;m.set(k,(m.get(k)||0)+(b.qty||1));});return [...m].map(([k,n])=>({k,n,name:(HERB_DEF[k]&&HERB_DEF[k].name)||k}));}
function brewDraw(){const ov=document.getElementById('brewui');if(!ov)return;const K=herbsKnown();
  ov.querySelector('#br-skill').textContent=`Alchemy ${skillLv('alchemy')} · strength ×${alchStrength().toFixed(2)}`;
  const list=brewHerbList();
  ov.querySelector('#br-herbs').innerHTML=list.length?list.map(h=>{const on=brewSel.includes(h.k),nn=brewSel.some(o=>o!==h.k&&K.none[brewPairKey(o,h.k)]);
    return `<div data-k="${h.k}" style="cursor:pointer;padding:0 6px;border-radius:2px;${on?'background:rgba(122,31,16,.12);color:#7a1f10':''}${nn&&!on?';color:#a09070':''}">${on?'◆':'◇'} ${h.name} <span style="color:#8a7050;font-size:12px">×${h.n}</span>${nn&&!on?' <i style="font-size:12px">· nothing between</i>':''}</div>`;}).join(''):'<i>You carry no herbs.</i>';
  ov.querySelectorAll('#br-herbs [data-k]').forEach(d=>d.onclick=()=>brewPick(d.dataset.k));
  let r='';brewSel.forEach(k=>{r+=`<div style="font-variant:small-caps;color:#7a1f10;margin-top:4px">${(HERB_DEF[k]&&HERB_DEF[k].name)||k}</div>`;
    HERB_FX[k].forEach((f,i)=>{const kn=herbFxKnown(k,i);r+=`<div style="padding-left:12px">${kn?ALCH_FX[f].label+(ALCH_FX[f].harm?' <i style="font-size:12px;color:#8a2a20">(harmful)</i>':''):'<span style="color:#a09070">— unknown —</span>'}</div>`;});});
  if(brewSel.length>=2){const kn=new Set();brewSel.forEach(k=>HERB_FX[k].forEach((f,i)=>{if(herbFxKnown(k,i)&&brewSel.filter(o=>o!==k).some(o=>HERB_FX[o].some((g,j)=>g===f&&herbFxKnown(o,j))))kn.add(f);}));
    r+=`<div style="margin-top:8px;border-top:1px dotted #a89060;padding-top:4px;font-style:italic">${kn.size?'Known to share: '+[...kn].map(f=>ALCH_FX[f].label).join(', '):'Nothing known between them.'}</div>`;}
  ov.querySelector('#br-right').innerHTML=r||`<i style="color:#8a7050">Choose ${brewMax()===3?'two or three herbs':'two herbs'}.</i>`;
  ov.querySelector('#br-said').textContent=brewSaid;
}
function brewPick(k){const i=brewSel.indexOf(k);if(i>=0)brewSel.splice(i,1);else{if(brewSel.length>=brewMax())brewSel.shift();brewSel.push(k);}brewSaid='';brewDraw();}
function brewGo(){const r=brewHerbs(brewSel);
  if(r.made){brewSaid=`${r.n>1?'Two: ':''}${r.item.name}.${r.learnt.length?' You learn '+r.learnt.length+(r.learnt.length>1?' effects.':' effect.'):''}`;if(typeof uiTone==='function')uiTone(260,340,.1,.08,'sine');addLog('🧪','Made '+r.item.name);}
  else brewSaid=r.why||'';
  brewSel=brewSel.filter(k=>BAG.some(b=>b&&b.type==='herb'&&herbKeyOf(b)===k));brewDraw();}
window.addEventListener('keydown',e=>{if(!brewOpen)return;const c=e.code;let hit=true;
  if(c==='Escape')closeBrewPage();else if(c==='Enter'){if(!e.repeat)brewGo();}else hit=false;
  if(hit){e.preventDefault();e.stopPropagation();}},true);

// ── S1486 — Survival B, session 2: fires and meals (`docs/design/survival-build.md`) ──
// A tinderbox (5 gold, never used up) lights a campfire from one log; it burns one game-hour. The hearth of an inn or a home
// is a fire too. At a fire one food makes a meal (Cooking 6); two logs make a charcoal and a pine log three pitch. A meal
// eaten leaves you *fed*, one kind at a time, for 2 game-hours times the cook's Cooking curve: Hearty (+15% stamina) from
// meat, Steady (+1 HP every 5 s) from fish, Clear (+10% mana regeneration) from produce. There is no hunger: fed is a gift.
// Meat comes off a bear, a boar or a wolf (1 to 3, seeded by the corpse's key); produce and fish from the goods shop and the
// inn, fish only in a port. Fed is kept by the game clock (`worldState.fed`, the character's), so sleep runs it down.
const FIRE_HOURS=1,FIRE_REACH=2.5,FED_MIN=120,TINDERBOX_NAME='Tinderbox';
const FED_KIND={hearty:{label:'Hearty',ico:'🍖',col:'#e8a060',say:'+15% stamina'},steady:{label:'Steady',ico:'🐟',col:'#80c8a0',say:'+1 health every 5 s'},
  clear:{label:'Clear',ico:'🥕',col:'#88aaff',say:'+10% mana regeneration'}};
const FOOD_MEAL={meat:{name:'Roast Meat',ico:'🍖',kind:'hearty'},fish:{name:'Baked Fish',ico:'🐟',kind:'steady'},produce:{name:'Pottage',ico:'🥣',kind:'clear'}};
const SURV_ITEMS={
  tinderbox:{name:TINDERBOX_NAME,ico:'🔥',type:'misc',weight:.2,buyPrice:5,sellMult:.4},
  log:{name:'Log',ico:'🪵',type:'misc',weight:3,buyPrice:4,sellMult:.3,log:'log'},
  pine:{name:'Pine Log',ico:'🪵',type:'misc',weight:3,buyPrice:5,sellMult:.3,log:'pine'},
  charcoal:{name:'Charcoal',ico:'⚫',type:'misc',weight:.5,buyPrice:6,sellMult:.3},
  pitch:{name:'Pitch',ico:'🛢',type:'misc',weight:.5,buyPrice:8,sellMult:.3},
  meat:{name:'Raw Meat',ico:'🥩',type:'misc',weight:.5,buyPrice:3,sellMult:.3,food:'meat'},
  fish:{name:'Fresh Fish',ico:'🐟',type:'misc',weight:.5,buyPrice:4,sellMult:.3,food:'fish'},
  produce:{name:'Root Vegetables',ico:'🥕',type:'misc',weight:.5,buyPrice:3,sellMult:.3,food:'produce'},
};
function survItem(k,qty){return {...SURV_ITEMS[k],qty:qty||1};}
function hasTinderbox(){return BAG.some(b=>b&&b.name===TINDERBOX_NAME);}
function bagCount(pred){let n=0;BAG.forEach(b=>{if(b&&pred(b))n+=b.qty||1;});return n;}
function bagTake(pred,n){for(let i=BAG.length-1;i>=0&&n>0;i--){const b=BAG[i];if(!b||!pred(b))continue;const t=Math.min(n,b.qty||1);b.qty=(b.qty||1)-t;n-=t;if(b.qty<=0)BAG.splice(i,1);}return n<=0;}
function gameMinNow(){return worldState.gameTimeAbsMinutes||0;}
// the fires burning now, outdoors in the world: {x,z,until,mesh}
const CAMPFIRES=[];
function hearthHere(){if(typeof isInterior!=='function'||!isInterior()||typeof currentHouse==='undefined'||!currentHouse)return false;return currentHouse.type==='inn'||currentHouse.type==='home';}
function campfireNear(){if(activeZoneId!=='world'||(typeof isInterior==='function'&&isInterior()))return null;const t=gameMinNow();
  return CAMPFIRES.find(f=>f.until>t&&Math.hypot(f.x-px,f.z-pz)<=FIRE_REACH)||null;}
function atFire(){return hearthHere()||!!campfireNear();}
function fireSpotOk(){if(activeZoneId!=='world'||(typeof isInterior==='function'&&isInterior()))return false;
  if(typeof WORLD!=='undefined'&&WORLD.isSwimming&&WORLD.isSwimming())return false;if(typeof SHIP!=='undefined'&&SHIP.sailing)return false;return true;}
// a plain stand-in until the kit's fire arrives (the look builder's): three logs and a flame
function campfireMesh(x,z){const g=new THREE.Group();const y=typeof worldH==='function'?worldH(x,z):0;
  const wood=new THREE.MeshLambertMaterial({color:0x5a3a20});
  for(let i=0;i<3;i++){const l=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.6,6),wood);l.rotation.z=Math.PI/2;l.rotation.y=i*Math.PI/3;l.position.y=.06;g.add(l);}
  const fl=new THREE.Mesh(new THREE.ConeGeometry(.16,.45,7),new THREE.MeshBasicMaterial({color:0xff8a30,transparent:true,opacity:.85}));fl.position.y=.3;g.add(fl);g.userData.flame=fl;
  g.position.set(x,y,z);return g;}
// light a fire at your feet from one log (a plain log before a pine one). Returns the fire, or null with a reason said
function lightFire(){
  if(!hasTinderbox()){showMsg('You need a tinderbox.','#cc8844');return null;}
  if(!fireSpotOk()){showMsg('There is no place for a fire here.','#cc8844');return null;}
  const plain=bagCount(b=>b.log==='log')>0;
  if(!bagTake(b=>plain?b.log==='log':!!b.log,1)){showMsg('A fire needs a log.','#cc8844');return null;}
  const x=px-Math.sin(yaw)*.9,z=pz-Math.cos(yaw)*.9;
  const f={x,z,until:gameMinNow()+FIRE_HOURS*60,mesh:null};
  try{f.mesh=campfireMesh(x,z);scene.add(f.mesh);f.scn=scene;}catch(e){f.mesh=null;}
  CAMPFIRES.push(f);showMsg('The fire catches.','#ffb060');if(typeof renderHubInv==='function')renderHubInv();return f;}
function dropFire(f){if(f.mesh&&f.mesh.parent)f.mesh.parent.remove(f.mesh);}
// each frame: a fire burnt out is taken away, the flame flickers; Steady's health. Called from the loop beside the buffs
function tickSurvival(dt){const t=gameMinNow();
  for(let i=CAMPFIRES.length-1;i>=0;i--){const f=CAMPFIRES[i];if(f.until<=t){dropFire(f);CAMPFIRES.splice(i,1);continue;}
    const fl=f.mesh&&f.mesh.userData.flame;if(fl){const k=.85+.15*Math.sin(performance.now()*.013+i);fl.scale.set(1,k,1);}}
  tickMining(dt);tickFelling(dt);
  if(fedKind()==='steady'&&!dead)PHP=Math.min(effMaxHP(),PHP+dt*.2);
  if(stamina>effMaxStamina())stamina=effMaxStamina();}
// fed: one kind at a time, by the game clock
function fedNow(){const F=worldState.fed;if(!F||!(F.until>gameMinNow()))return null;return F;}
function fedKind(){const F=fedNow();return F?F.kind:null;}
function fedStamMult(){return fedKind()==='hearty'?1.15:1;}
function fedManaMult(){return fedKind()==='clear'?1.1:1;}
// S1500 — Full belly (Cooking 75): fed lasts through sleep; restAtBed (60-shop.js) moves its end on by the hours slept
function fedSleep(mins){const F=fedNow();if(F&&perk('cooking',75))F.until+=mins;}
function setFed(kind,s){const was=fedNow();worldState.fed={kind,until:gameMinNow()+Math.round(FED_MIN*s),s:+(+s).toFixed(3)};
  stamina=Math.min(stamina,effMaxStamina());return was;}
function mealItem(food,s,sea){const m=FOOD_MEAL[food];const it={name:m.name,ico:m.ico,type:'potion',weight:.4,buyPrice:10,sellMult:.3,meal:{kind:m.kind,s},brewKey:'meal@'+s};
  if(sea){it.name=`${m.name} with ${sea.name}`;it.meal.season=sea;it.brewKey+='@'+sea.key;}return it;}
// S1503 — Seasoned (Cooking 100): a herb in the pot adds its known effect at a third, to every portion. The herbs in the bag
// that can season, one row each by HERB_DEF's key; what a herb gives a meal: its eaten effect, a third of the amount (at least 1)
// or of a regeneration's rate over the same time
function seasonHerbs(){const out=[],seen={};BAG.forEach(b=>{if(!b||b.type!=='herb')return;const k=herbKeyOf(b);if(!k||seen[k]||!herbKnownEff(b))return;seen[k]=1;out.push({key:k,name:b.name,n:bagCount(x=>x.type==='herb'&&herbKeyOf(x)===k)});});return out;}
function seasonOf(herb){const e=herbKnownEff(herb);if(!e)return null;const eff={...e};
  if(eff.type==='hpRegen')eff.rate=+(e.rate/3).toFixed(2);else if(eff.amount!=null)eff.amount=Math.max(1,Math.round(e.amount/3));else return null;
  return {key:herbKeyOf(herb),name:herb.name,eff};}
function seasonSay(sea){const e=sea.eff;return e.type==='heal'?`+${e.amount} HP`:e.type==='stamina'?`+${e.amount} Stamina`:e.type==='mana'?`+${e.amount} Mana`:e.type==='hpRegen'?`+${e.rate} HP a second for ${e.duration} s`:e.type==='damage'?`−${e.amount} HP, bitter`:'';}
function eatMeal(i){const it=BAG[i];if(!it||!it.meal)return;
  if(typeof DRINK!=='undefined'&&DRINK){showMsg('You are still eating.','#cc8844');return;}
  const m=it.meal,nm=it.name;it.qty=(it.qty||1)-1;if(it.qty<=0)BAG.splice(i,1);
  const go=()=>{setFed(m.kind,m.s||1);const K=FED_KIND[m.kind];const sd=m.season&&m.season.eff?herbKnownApply(m.season.eff,m.season.name):null; /* S1503 — Seasoned */
    showMsg(`${nm} — ${K.label}: ${K.say} for ${Math.round(FED_MIN*(m.s||1)/60*10)/10} hours.${sd?' '+sd[0].replace(/\.+$/,'')+'.':''}`,K.col);if(typeof updateHUD==='function')updateHUD();};
  if(typeof startDrink==='function')startDrink(go,nm);else go();}
// what the fire can make from the bag: each recipe, what it takes, whether you have it
const COOK_RECIPES=[
  {id:'meat',name:'Roast Meat',need:'1 Raw Meat',has:()=>bagCount(b=>b.food==='meat')>=1},
  {id:'fish',name:'Baked Fish',need:'1 Fresh Fish',has:()=>bagCount(b=>b.food==='fish')>=1},
  {id:'produce',name:'Pottage',need:'1 Root Vegetables',has:()=>bagCount(b=>b.food==='produce')>=1},
  {id:'charcoal',name:'Charcoal',need:'2 logs',has:()=>bagCount(b=>!!b.log)>=2},
  {id:'pitch',name:'Pitch ×3',need:'1 Pine Log',has:()=>bagCount(b=>b.log==='pine')>=1},
];
// cook one recipe at the fire. Returns {made, item, why}
function cookAt(id,sk){
  if(!atFire())return {made:false,why:'You need a fire.'};
  const R=COOK_RECIPES.find(r=>r.id===id);if(!R)return {made:false,why:''};
  if(!R.has())return {made:false,why:`You need ${R.need.toLowerCase()}.`};
  if(FOOD_MEAL[id]){let sea=null;
    if(sk&&perk('cooking',100)){const h=BAG.find(b=>b&&b.type==='herb'&&herbKeyOf(b)===sk);sea=h?seasonOf(h):null;if(!sea)return {made:false,why:'You have none of that herb.'};}
    bagTake(b=>b.food===id,1);if(sea)bagTake(b=>b.type==='herb'&&herbKeyOf(b)===sk,1);const s=+skillMult('cooking').toFixed(3);const it=mealItem(id,s,sea);
    const n=perk('cooking',25)?2:1;if(n>1)it.qty=n; /* S1500 — Two portions (Cooking 25) */
    bagAdd(it);skillUse('cooking',6);
    return {made:true,item:BAG.find(b=>sameStack(b,it))||it,n};}
  if(id==='charcoal'){const plain=bagCount(b=>b.log==='log');bagTake(b=>b.log==='log',Math.min(2,plain));if(plain<2)bagTake(b=>!!b.log,2-plain);const it=survItem('charcoal');bagAdd(it);return {made:true,item:it};}
  if(id==='pitch'){bagTake(b=>b.log==='pine',1);const it=survItem('pitch',3);bagAdd(it);return {made:true,item:it};}
  return {made:false,why:''};}
// using a tinderbox, a log or a food from the bag: at a fire, the fire's page; else light one if you can
function useFireThing(i){const it=BAG[i];if(!it)return;
  if(atFire()){openCookPage();return;}
  if(it.food){showMsg('Cook it at a fire.','#cc8844');return;}
  if(lightFire())openCookPage();}
// meat off a bear, a boar or a wolf: 1 to 3, seeded by the corpse's key (as bodyPicks)
const MEAT_BODIES=/(^|\s)(Wolf|Bear|Boar)$/;
function bodyMeat(e,items,key){if(!e||!MEAT_BODIES.test(e.name||''))return items;
  const r=key!=null?seededRng('meat',key):lootRand;items.push(survItem('meat',1+Math.floor(r()*3)));return items;}
// the goods shop and the inn: the tinderbox and produce; fish in a port
function survivalFor(h){if(!h||!(h.type==='misc'||h.type==='inn'))return [];const out=[{...SURV_ITEMS.tinderbox},{...SURV_ITEMS.produce}];
  const st=h.siteId&&typeof SITE!=='undefined'?SITE[h.siteId]:null;if(st&&st.kind==='port')out.push({...SURV_ITEMS.fish});return out;}
// the buff bar's pill for fed
function fedPill(){const F=fedNow();if(!F)return '';const K=FED_KIND[F.kind],m=Math.ceil(F.until-gameMinNow());
  return `<span class="buff-pill" title="${K.label} — ${K.say}, ${m} min remaining"><span class="bp-ico">${K.ico}</span><span class="bp-time">${m}m</span></span>`;}

// ── the fire's page (the brewing page's layout): what can be made on the left, the recipe on the right ──
let cookOpen=false,cookSel=null,cookSaid='',cookSeason=null;
function openCookPage(){
  if(!atFire()){showMsg('You need a fire.','#cc8844');return;}
  if(typeof hubOpen!=='undefined'&&hubOpen&&typeof closeHub==='function')closeHub();
  if(typeof _releasePointerLockForMenu==='function')_releasePointerLockForMenu();
  let ov=document.getElementById('cookui');
  if(!ov){ov=document.createElement('div');ov.id='cookui';
    ov.style.cssText='position:fixed;inset:0;z-index:8500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35)';
    ov.innerHTML='<div style="width:560px;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;padding:18px 24px 16px;background:#e9dcc2;color:#3a2c18;border:6px double #8a7040;border-radius:6px;font-family:Georgia,serif;box-shadow:0 10px 40px #000a">'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #a89060;padding-bottom:6px"><span style="font-size:22px;color:#7a1f10;letter-spacing:.06em;font-variant:small-caps">The Fire</span><span id="ck-skill" style="font-style:italic;font-size:13px;color:#8a7050"></span></div>'+
      '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:10px"><div id="ck-list" style="flex:1 1 180px;min-width:0;font-size:14px;line-height:1.7"></div><div id="ck-right" style="flex:1.3 1 220px;min-width:0;font-size:14px;line-height:1.6"></div></div>'+
      '<div id="ck-said" style="min-height:20px;margin-top:8px;font-style:italic;color:#7a1f10;font-size:14px"></div>'+
      '<div style="display:flex;align-items:center;gap:12px;margin-top:8px;border-top:1px solid #a89060;padding-top:8px"><button type="button" id="ck-go" style="background:none;border:1px solid #7a1f10;border-radius:3px;font:18px Georgia,serif;color:#7a1f10;font-variant:small-caps;cursor:pointer;padding:2px 14px">Cook</button>'+
      '<span style="flex:1"></span><span style="font-size:12px;font-style:italic;color:#8a7050"><button type="button" id="ck-no" style="background:none;border:1px solid #a89060;border-radius:3px;font:13px Georgia,serif;color:#3a2c18;cursor:pointer;padding:2px 7px">Esc</button> as you were · Enter cooks</span></div></div>';
    document.body.appendChild(ov);
    ov.querySelector('#ck-go').onclick=()=>cookGo();ov.querySelector('#ck-no').onclick=()=>closeCookPage();}
  cookSaid='';if(!cookSel||!COOK_RECIPES.some(r=>r.id===cookSel&&r.has())){const r=COOK_RECIPES.find(r=>r.has());cookSel=r?r.id:COOK_RECIPES[0].id;}
  ov.style.display='flex';cookOpen=true;cookDraw();
}
function closeCookPage(){const ov=document.getElementById('cookui');if(ov)ov.style.display='none';cookOpen=false;if(typeof refocusView==='function')refocusView();}
function cookDraw(){const ov=document.getElementById('cookui');if(!ov)return;
  const f=campfireNear();ov.querySelector('#ck-skill').textContent=`Cooking ${skillLv('cooking')}`+(f?` · the fire burns ${Math.max(1,Math.ceil(f.until-gameMinNow()))} min more`:' · the hearth');
  ov.querySelector('#ck-list').innerHTML=COOK_RECIPES.map(r=>{const on=r.id===cookSel,ok=r.has();
    return `<div data-k="${r.id}" style="cursor:pointer;padding:0 6px;border-radius:2px;${on?'background:rgba(122,31,16,.12);color:#7a1f10':''}${!ok&&!on?';color:#a09070':''}">${on?'◆':'◇'} ${r.name}</div>`;}).join('');
  ov.querySelectorAll('#ck-list [data-k]').forEach(d=>d.onclick=()=>{cookSel=d.dataset.k;cookSaid='';cookDraw();});
  const R=COOK_RECIPES.find(r=>r.id===cookSel);let t='';
  if(R){t=`<div style="font-variant:small-caps;color:#7a1f10">${R.name}</div><div style="padding-left:12px">Takes ${R.need}${R.has()?'':' <i style="font-size:12px;color:#8a2a20">(you have none)</i>'}</div>`;
    const m=FOOD_MEAL[R.id];if(m){const K=FED_KIND[m.kind];t+=`<div style="padding-left:12px">${K.label}: ${K.say}, ${Math.round(FED_MIN*skillMult('cooking')/60*10)/10} hours</div>`;
      if(perk('cooking',100)){const H=seasonHerbs();if(cookSeason&&!H.some(h=>h.key===cookSeason))cookSeason=null; /* S1503 — Seasoned: the pot's herb, one a cooking */
        const row=(k,lab)=>`<div data-s="${k}" style="cursor:pointer;padding-left:18px;${(cookSeason||'')===k?'color:#7a1f10':''}">${(cookSeason||'')===k?'◆':'◇'} ${lab}</div>`;
        t+=`<div style="margin-top:6px;font-variant:small-caps;color:#7a1f10">Season with</div>`+row('','nothing')+H.map(h=>{const sea=seasonOf(BAG.find(b=>b&&b.type==='herb'&&herbKeyOf(b)===h.key));return row(h.key,`${h.name} (${h.n}) <i style="font-size:12px;color:#8a7050">${seasonSay(sea)}</i>`);}).join('');}}
    else if(R.id==='charcoal')t+='<div style="padding-left:12px;color:#8a7050;font-style:italic">for steel, at the forge</div>';
    else if(R.id==='pitch')t+='<div style="padding-left:12px;color:#8a7050;font-style:italic">for a ship’s patch</div>';}
  const F=fedNow();if(F)t+=`<div style="margin-top:8px;border-top:1px dotted #a89060;padding-top:4px;font-style:italic">You are ${FED_KIND[F.kind].label.toLowerCase()}, ${Math.ceil(F.until-gameMinNow())} min more.</div>`;
  ov.querySelector('#ck-right').innerHTML=t;ov.querySelector('#ck-said').textContent=cookSaid;
  ov.querySelectorAll('#ck-right [data-s]').forEach(d=>d.onclick=()=>{cookSeason=d.dataset.s||null;cookSaid='';cookDraw();});}
function cookGo(){const r=cookAt(cookSel,FOOD_MEAL[cookSel]?cookSeason:null);
  if(r.made){cookSaid=`${r.n>1?'Two: ':''}${r.item.name}.`;if(typeof uiTone==='function')uiTone(220,300,.1,.08,'sine');}else cookSaid=r.why||'';
  if(!atFire()){closeCookPage();return;}cookDraw();}
window.addEventListener('keydown',e=>{if(!cookOpen)return;const c=e.code;let hit=true;
  if(c==='Escape')closeCookPage();else if(c==='Enter'){if(!e.repeat)cookGo();}else hit=false;
  if(hit){e.preventDefault();e.stopPropagation();}},true);

// ── S1491 — Survival B, session 3: veins and ore (`docs/design/survival-build.md`) ──
// 2 to 5 veins a 64 m chunk, on the steepest of 40 tries by the chunk's dice (rock where it has any, as groundColor paints
// it; a bank on flat land), placed as the herbs are; each is <cx,cz>:<i>, the try that put it. The place sets the metal, as #394 set loot's: tier 1 copper and tin
// (iron one in four), 2 iron and silver, 3 iron and mithril, the wastes (4) mithril, adamant and obsidian. A vein holds 3 ore
// and comes back 7 game-days after its last is taken. With a pick (40 gold) in the bag, E at a vein works it: a strike every
// 0.9 s breaks an ore at 35% + 0.5% a Mining point, rolled on seededRng('ore', the vein, its returns and the strike's count),
// so a reload strikes the same ore at the same strike. `worldState.veins` (the world's): id → {n taken, s strikes, d day, e returns}.
const VEIN_ORE_N=3,VEIN_DAYS=7,VEIN_STRIKE=.9,PICK_NAME='Pick';
// S1495 — Seam (Mining 100): a vein holds 5
function veinCap(){return perk('mining',100)?5:VEIN_ORE_N;}
const ORE_DEF={copper:{name:'Copper Ore',col:0xc07040,price:3},tin:{name:'Tin Ore',col:0xb8b8a8,price:3},iron:{name:'Iron Ore',col:0x8a5a48,price:5},
  silver:{name:'Silver Ore',col:0xe0e4ec,price:8},mithril:{name:'Mithril Ore',col:0x4466cc,price:12},adamant:{name:'Adamant Ore',col:0x33aa33,price:18},
  obsidian:{name:'Obsidian',col:0x221830,price:24}};
const VEIN_TABLE={1:[['copper',.375],['tin',.375],['iron',.25]],2:[['iron',2/3],['silver',1/3]],3:[['iron',2/3],['mithril',1/3]],4:[['mithril',1/3],['adamant',1/3],['obsidian',1/3]]};
const PICK_ITEM={name:PICK_NAME,ico:'⛏',type:'misc',weight:4,buyPrice:40,sellMult:.4,tool:'pick'};
function oreItem(k,qty){const o=ORE_DEF[k];return {name:o.name,ico:'🪨',type:'misc',weight:2,buyPrice:o.price,sellMult:.3,ore:k,qty:qty||1};}
function hasPick(){return BAG.some(b=>b&&b.tool==='pick');}
// the vein's tier: the place's danger tier, and 4 in the wastes (the open world's regions stop at 3)
function veinTier(x,z){let t=typeof worldTierAt==='function'?worldTierAt(x,z):1;
  try{const r=dominantRegion(x,z).r;if(r&&(r.id==='wastes'||r.biome==='wastes'||r.biome==='wasteland'))t=4;}catch(e){}
  return Math.max(1,Math.min(4,t|0||1));}
function veinOre(id,tier){const T=VEIN_TABLE[tier]||VEIN_TABLE[1];let r=seededRng('vein',id)();for(const [k,w] of T){r-=w;if(r<=0)return k;}return T[T.length-1][0];}
const VEINS=[];
// S1498 (look) — a vein is one mesh: the rock and its three seams merged, coloured by vertex, on one shared material, so a chunk's
// 2–5 veins are 2–5 draw calls and not four each (S1491's rock and seams were 460 of Dunmore's 1,150 at noon, most of them
// 120–440 m off). The rock is an icosahedron of 80 faces pushed in and out by its own corners, grey with a paler crown; the seams
// are stretched octahedra set into its flank. A seam goes as its ore is taken: the geometry is the one for that ore and that many
// seams (`_veinGeo[ore:n]`, the rock's faces first). Past VEIN_FAR the vein is not drawn (a THREE.LOD with nothing at that level).
const VEIN_FAR=80;
let _veinGeo=null,_veinMat=null;
function veinGeo(ore,n){const G=_veinGeo||(_veinGeo={});const k=ore+':'+n;if(G[k])return G[k];
  if(!G._rock){const g=new THREE.IcosahedronGeometry(.55,1),p=g.attributes.position,c=[],v=new THREE.Vector3();
    const h=(x,y,z)=>{const t=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return t-Math.floor(t);};
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const d=.82+.36*h(+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3));v.multiplyScalar(d);v.set(v.x*1.25,v.y*.75,v.z*1.05);p.setXYZ(i,v.x,v.y,v.z);}
    for(let f=0;f<p.count;f+=3){const y=(p.getY(f)+p.getY(f+1)+p.getY(f+2))/3,k2=.3+.08*h(f,1,2)+.08*Math.max(0,y)/.4;for(let j=0;j<3;j++)c.push(k2,k2*.97,k2*.93);}
    g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeVertexNormals();G._rock=g;
    G._seams=[0,1,2].map(i=>{const s=new THREE.OctahedronGeometry(.2,0),t=i*2.1;s.scale(1,.6,1.5);s.rotateY(-t);s.rotateZ(.35);s.translate(Math.cos(t)*.44,.14+i*.08,Math.sin(t)*.44);return s;});}
  const col=new THREE.Color(ORE_DEF[ore]?ORE_DEF[ore].col:0x888888),parts=[G._rock,...G._seams.slice(0,n)];let N=0;parts.forEach(q=>N+=q.attributes.position.count);
  const pos=new Float32Array(N*3),nor=new Float32Array(N*3),cc=new Float32Array(N*3);let o=0;
  parts.forEach((q,pi)=>{const P=q.attributes.position,Nn=q.attributes.normal,C=q.attributes.color;for(let i=0;i<P.count;i++,o++){pos[o*3]=P.getX(i);pos[o*3+1]=P.getY(i);pos[o*3+2]=P.getZ(i);
    nor[o*3]=Nn.getX(i);nor[o*3+1]=Nn.getY(i);nor[o*3+2]=Nn.getZ(i);const sh=pi?.85+.3*((i>>1)%2):1;if(C){cc[o*3]=C.getX(i);cc[o*3+1]=C.getY(i);cc[o*3+2]=C.getZ(i);}else{cc[o*3]=col.r*sh;cc[o*3+1]=col.g*sh;cc[o*3+2]=col.b*sh;}}});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setAttribute('color',new THREE.BufferAttribute(cc,3));g.computeBoundingSphere();
  return G[k]=g;}
function veinMesh(v){const M=_veinMat||(_veinMat=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true}));
  const m=new THREE.Mesh(veinGeo(v.ore,3),M);m.name='vein';m.castShadow=true;m.receiveShadow=true;const s=.9+.25*((v.ph*7.3)%1);m.scale.set(s,s,s);
  const g=new THREE.LOD();g.addLevel(m,0);g.addLevel(new THREE.Object3D(),VEIN_FAR);g.userData.mesh=m;g.userData.shown=3;
  g.position.set(v.x,worldH(v.x,v.z)-.12,v.z);g.rotation.y=v.ph;return g;}
// a chunk's veins, when it builds (called beside spawnChunkHerbs)
function spawnChunkVeins(ch){
  if(typeof hash01!=='function'||typeof slopeNormalY!=='function')return;
  const n=2+Math.floor(hash01(ch.cx,ch.cz,301)*4),cand=[];
  for(let i=0;i<40;i++){
    const x=ch.cx*CHUNK+3+hash01(ch.cx+i,ch.cz,302)*(CHUNK-6),z=ch.cz*CHUNK+3+hash01(ch.cz,ch.cx+i,303)*(CHUNK-6);
    const h=worldH(x,z);if(h<1.5)continue;
    if(solidAt(x,z))continue;const ri=roadInfo(x,z);if(ri&&ri.d<ROAD_HALF+2)continue;const st=stampAt(x,z);if(st&&st.kind==='site'&&Math.hypot(x-st.x,z-st.z)<st.r)continue;
    cand.push({i,x,z,ny:slopeNormalY(x,z)});}
  cand.sort((a,b)=>a.ny-b.ny||a.i-b.i); /* the steepest of the chunk's tries: rock where it has any, a bank where it is flat */
  for(const c of cand.slice(0,n)){
    const id=ch.cx+','+ch.cz+':'+c.i,tier=veinTier(c.x,c.z);
    const v={id,x:c.x,z:c.z,tier,ore:veinOre(id,tier),ph:hash01(ch.cx+c.i,ch.cz,304)*Math.PI*2,g:null};
    try{v.g=veinMesh(v);ch.group.add(v.g);}catch(e){}
    (ch.veins||(ch.veins=[])).push(v);VEINS.push(v);veinShow(v);}}
function veinLive(v){return !v.g||!!(v.g.parent&&v.g.parent.parent);}
// the vein's record, brought back if 7 days have passed since it was worked out
function veinRec(v){const W=worldState.veins||(worldState.veins={});let r=W[v.id];
  if(r&&r.n>=veinCap()&&gameMinNow()/1440-r.d>=VEIN_DAYS){r={n:0,s:0,d:r.d,e:(r.e||0)+1};W[v.id]=r;}
  return r||{n:0,s:0,d:0,e:0};}
function veinLeft(v){return Math.max(0,veinCap()-veinRec(v).n);}
function veinShow(v){if(!v.g)return;const n=Math.min(3,veinLeft(v));v.g.userData.shown=n;v.g.userData.mesh.geometry=veinGeo(v.ore,n);}
function veinNear(){if(activeZoneId!=='world'||(typeof isInterior==='function'&&isInterior()))return null;
  for(let i=VEINS.length-1;i>=0;i--){const v=VEINS[i];if(!veinLive(v)){VEINS.splice(i,1);continue;}if(Math.hypot(px-v.x,pz-v.z)<TOUCH+.5)return v;}return null;}
// one strike at a vein: the outcome is the vein's seeded stream at this strike. Returns {ore, left} or {why}
function strikeVein(v){
  if(!hasPick())return {why:'You need a pick.'};
  let r=veinRec(v);if(r.n>=veinCap())return {why:'The vein is worked out.'};
  const it=oreItem(v.ore);if(!canCarry(it))return {why:'Too heavy to carry!'};
  const roll=seededRng('ore',v.id+':'+(r.e||0)+':'+r.s)();
  r={...r,s:r.s+1};const got=roll<.35+.005*skillLv('mining');
  /* S1495 — Mining 50: one ore in four comes double, on the strike's own second roll */
  let two=false;if(got){two=perk('mining',50)&&seededRng('ore2',v.id+':'+(r.e||0)+':'+(r.s-1))()<.25;if(two)it.qty=2;r.n++;r.d=Math.floor(gameMinNow()/1440);bagAdd(it);skillUse('mining',4);}else skillUse('mining',1);
  (worldState.veins||(worldState.veins={}))[v.id]=r;veinShow(v);
  return {ore:got?(two?'2 '+it.name:it.name):null,left:Math.max(0,veinCap()-r.n)};}
// S1495 — Prospector (Mining 25): the veins within 40 m on the minimap (drawLocalMap's frame: north up, 58 m to the edge)
function prospectorDots(ctx,size,radius){if(!perk('mining',25)||activeZoneId!=='world'||(typeof isInterior==='function'&&isInterior()))return 0;
  const s=size/(radius*2);let n=0;
  for(const v of VEINS){if(!veinLive(v)||Math.hypot(v.x-px,v.z-pz)>40)continue;const x=size/2+(v.x-px)*s,y=size/2+(v.z-pz)*s;
    ctx.fillStyle=veinLeft(v)>0?'#'+ORE_DEF[v.ore].col.toString(16).padStart(6,'0'):'#5a5a5a';ctx.strokeStyle='#111';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x,y-3);ctx.lineTo(x+3,y);ctx.lineTo(x,y+3);ctx.lineTo(x-3,y);ctx.closePath();ctx.fill();ctx.stroke();n++;}
  return n;}
// working a vein: E starts it, E again, walking off, or the vein worked out stops it
let MINE=null;
function mineVein(v){if(MINE&&MINE.v===v){MINE=null;showMsg('You stop working the vein.','#c8b890');return;}
  if(!hasPick()){showMsg('You need a pick.','#cc8844');return;}
  if(veinLeft(v)<=0){showMsg('The vein is worked out.','#cc8844');return;}
  MINE={v,t:VEIN_STRIKE};showMsg(`You set to the ${ORE_DEF[v.ore].name.toLowerCase()}.`,'#c8b890');}
function tickMining(dt){if(!MINE)return;const v=MINE.v;
  if(!veinLive(v)||activeZoneId!=='world'||Math.hypot(px-v.x,pz-v.z)>TOUCH+1.2||(typeof dead!=='undefined'&&dead)){MINE=null;return;}
  MINE.t-=dt;if(MINE.t>0)return;MINE.t+=VEIN_STRIKE;
  const r=strikeVein(v);if(typeof uiNoise==='function')uiNoise(.06,.12,2400);
  if(r.why){showMsg(r.why,'#cc8844');MINE=null;return;}
  if(r.ore){showMsg(`${r.ore}.`+(r.left?'':' The vein is worked out.'),'#d8c8a0');if(typeof renderHubInv==='function')renderHubInv();}
  if(!r.left)MINE=null;}
function useOreThing(i){const it=BAG[i];if(!it)return;
  if(it.tool==='pick'){const v=veinNear();if(v)mineVein(v);else showMsg('Strike a vein with it.','#c8b890');return;}
  if(it.ore||it.ingot){if(forgeHere())openForgePage();else showMsg(it.ore?'Smelt it at a forge.':'Work it at a forge.','#c8b890');}} /* S1494 — at a smith's, the forge's page */
// the smith's and the goods shop's pick
function minersPickFor(h){return h&&(h.type==='weapon'||h.type==='misc')?[{...PICK_ITEM}]:[];}
// ── S1511 — Survival B, session 4: felling (deep work; `docs/design/survival-build.md`) ──
// A tree is `<cx,cz>:<i>` by its cell of the chunk's scatter lattice (80-world-terrain.js), so its id holds whatever had loaded.
// With a hatchet (30 gold, weight 3) in the bag, or a war axe in hand at half pace, E at a tree works it: a strike every 0.9 s
// (1.8 with the axe), and it falls at the 6th strike, one fewer for each 20 Woodcutting. It gives 2 to 4 logs (+1 at 100), a pine
// Pine Logs, rolled on seededRng('log', the tree and the day it last fell), so a reload fells it for the same logs. Every strike is
// a Woodcutting use. A felled tree goes from its chunk's mesh and its solids, and a stump stands in its place (a plain stand-in until
// the look builder's kit stump) for 10 game-days; then the tree is back. `worldState.felled` (the world's): id → the day felled,
// changed only by `fellTree`. A chunk built while a tree is down takes it out as it builds (`spawnChunkStumps`).
const FELL_STRIKES=6,FELL_DAYS=10,FELL_STRIKE=.9,HATCHET_NAME='Hatchet';
const HATCHET_ITEM={name:HATCHET_NAME,ico:'🪓',type:'misc',weight:3,buyPrice:30,sellMult:.4,tool:'hatchet'};
const FELL_NOT=['scrub'];
function hasHatchet(){return BAG.some(b=>b&&b.tool==='hatchet');}
function warAxeHeld(){const w=typeof EQ!=='undefined'&&EQ.weapon;return !!(w&&/axe/.test(w.weaponShape||''));}
// the hatchet first; a war axe in hand at half pace; null: nothing to cut with
function chopTool(){return hasHatchet()?'hatchet':warAxeHeld()?'axe':null;}
function fellStrikes(){return Math.max(1,FELL_STRIKES-Math.floor(skillLv('woodcutting')/20));}
function treeDown(id){const d=(worldState.felled||{})[id];return d!=null&&gameMinNow()/1440-d<FELL_DAYS;}
function fellable(t){return t&&t.r>0&&!FELL_NOT.includes(t.sp)&&!(typeof MUSH_KINDS!=='undefined'&&MUSH_KINDS.includes(t.sp));}
// the stump: one short trunk, its cut face pale, shared by every stump and scaled to the trunk's collider
let _stumpGeo=null,_stumpMat=null;
function stumpMesh(t){if(!_stumpGeo){_stumpGeo=new THREE.CylinderGeometry(.8,1,1,9);_stumpGeo.translate(0,.5,0);
    _stumpMat=[new THREE.MeshLambertMaterial({color:0x5a4030}),new THREE.MeshLambertMaterial({color:0xc8a878}),new THREE.MeshLambertMaterial({color:0x5a4030})];}
  const m=new THREE.Mesh(_stumpGeo,_stumpMat),rr=Math.max(.14,Math.min(.5,t.r*.55));m.scale.set(rr,.42,rr);
  m.position.set(t.x,t.h-.06,t.z);m.name='stump';m.castShadow=true;m.receiveShadow=true;m.userData.tree=t.id;return m;}
// take a standing tree out of its chunk: its instance (the last takes the gap), its collider; a stump in its place
function treeTakeOut(ch,t){if(t.out)return;const m=new THREE.Matrix4(),c=new THREE.Color();t.out={sol:[]};
  for(const o of ch.group.children){const T=o.isInstancedMesh&&o.userData.tids;if(!T)continue;const j=T.indexOf(t.id);if(j<0||j>=o.count)continue;
    o.getMatrixAt(j,m);t.out.im=o;t.out.m=m.clone();if(o.instanceColor){o.getColorAt(j,c);t.out.c=c.clone();}
    const last=o.count-1;if(j<last){o.getMatrixAt(last,m);o.setMatrixAt(j,m);if(o.instanceColor){o.getColorAt(last,c);o.setColorAt(j,c);}}
    T[j]=T[last];T.length=last;o.count=last;o.instanceMatrix.needsUpdate=true;if(o.instanceColor)o.instanceColor.needsUpdate=true;break;}
  for(let i=ch.sol.length-1;i>=0;i--)if(ch.sol[i].tid===t.id)t.out.sol.push(ch.sol.splice(i,1)[0]);
  try{t.out.stump=stumpMesh(t);ch.group.add(t.out.stump);}catch(e){}
  STUMPS.push({ch,t});}
// and back: the instance at the mesh's end, the collider, the stump gone
function treePutBack(ch,t){const o=t.out;if(!o)return;
  if(o.im&&o.im.userData.tids&&o.im.count<o.im.instanceMatrix.count){const k=o.im.count;o.im.setMatrixAt(k,o.m);if(o.c&&o.im.instanceColor)o.im.setColorAt(k,o.c);
    o.im.userData.tids[k]=t.id;o.im.count=k+1;o.im.instanceMatrix.needsUpdate=true;if(o.im.instanceColor)o.im.instanceColor.needsUpdate=true;}
  ch.sol.push(...o.sol);if(o.stump&&o.stump.parent)o.stump.parent.remove(o.stump);t.out=null;}
const STUMPS=[];
// a chunk's trees that are down, taken out as it builds (called beside spawnChunkVeins)
function spawnChunkStumps(ch){if(!ch.trees||!worldState.felled)return;for(const t of ch.trees)if(treeDown(t.id))treeTakeOut(ch,t);}
// a stamp that arrives after the chunk (clearScatterUnder): its trees are gone for good, standing or felled
function stumpsClearUnder(ch,hit){if(!ch.trees)return;const at=t=>hit.some(st=>Math.hypot(t.x-st.x,t.z-st.z)<st.r);
  for(const t of ch.trees)if(t.out&&at(t)){if(t.out.stump&&t.out.stump.parent)t.out.stump.parent.remove(t.out.stump);}
  ch.trees=ch.trees.filter(t=>!at(t));}
function chunkLive(ch){return typeof chunks!=='undefined'&&chunks.get(chunkKey(ch.cx,ch.cz))===ch;}
// the standing tree whose trunk you are at, nearest first: {ch,t}
function treeNear(){if(activeZoneId!=='world'||(typeof isInterior==='function'&&isInterior())||typeof chunks==='undefined')return null;
  const cx=Math.floor(px/CHUNK),cz=Math.floor(pz/CHUNK);let best=null,bd=1e9;
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const ch=chunks.get(chunkKey(cx+dx,cz+dz));if(!ch||!ch.trees)continue;
    for(const t of ch.trees){if(t.out||!fellable(t))continue;const d=Math.hypot(px-t.x,pz-t.z)-t.r;if(d<TOUCH&&d<bd){bd=d;best={ch,t};}}}
  return best;}
// the named action: the tree is down from today (the world's), and out of its chunk
function fellTree(ch,t){(worldState.felled||(worldState.felled={}))[t.id]=Math.floor(gameMinNow()/1440);treeTakeOut(ch,t);}
// the logs a tree gives, on its stream: keyed by the tree and the day it last fell (none: 'n'), so the same fall gives the same logs
function treeLogs(t){const prev=(worldState.felled||{})[t.id],r=seededRng('log',t.id+':'+(prev!=null?prev:'n'))();
  return 2+Math.floor(r*3)+(skillLv('woodcutting')>=100?1:0);}
// one strike at a tree. Returns {n strikes so far, need, logs on the fall} or {why}
function strikeTree(ch,t,n){
  if(!chopTool())return {why:'You need a hatchet.'};
  if(t.out||treeDown(t.id))return {why:'It is down already.'};
  const it=survItem(t.sp==='pine'?'pine':'log');if(!canCarry(it))return {why:'Too heavy to carry!'};
  n++;const need=fellStrikes();
  if(n<need){skillUse('woodcutting',1);return {n,need};}
  const k=treeLogs(t);fellTree(ch,t);it.qty=k;bagAdd(it);skillUse('woodcutting',4);
  return {n,need,logs:k,item:it};}
// working a tree: E starts it, E again, walking off, or the fall stops it
let CHOP=null;
function chopTree(ch,t){if(CHOP&&CHOP.t===t){CHOP=null;showMsg('You stop.','#c8b890');return;}
  const tool=chopTool();if(!tool){showMsg('You need a hatchet.','#cc8844');return;}
  const step=FELL_STRIKE*(tool==='axe'?2:1);CHOP={ch,t,n:0,step,tm:step};showMsg(tool==='axe'?'You set to the tree with the axe. It is slow work.':'You set to the tree.','#c8b890');}
function tickFelling(dt){
  if(CHOP){const {ch,t}=CHOP;
    if(!chunkLive(ch)||t.out||activeZoneId!=='world'||Math.hypot(px-t.x,pz-t.z)-t.r>TOUCH+.8||(typeof dead!=='undefined'&&dead))CHOP=null;
    else{CHOP.tm-=dt;if(CHOP.tm<=0){CHOP.tm+=CHOP.step;
      const r=strikeTree(ch,t,CHOP.n);if(typeof uiNoise==='function')uiNoise(.08,.1,900);
      if(r.why){showMsg(r.why,'#cc8844');CHOP=null;}
      else if(r.logs){showMsg(`The tree falls. ${r.logs} ${r.item.name}${r.logs>1?'s':''}.`,'#d8c8a0');CHOP=null;if(typeof renderHubInv==='function')renderHubInv();}
      else CHOP.n=r.n;}}}
  // the stumps of loaded chunks: back to a tree once its 10 days are up
  for(let i=STUMPS.length-1;i>=0;i--){const s=STUMPS[i];if(!chunkLive(s.ch)||!s.t.out){STUMPS.splice(i,1);continue;}
    if(!treeDown(s.t.id)){treePutBack(s.ch,s.t);STUMPS.splice(i,1);}}}
function useHatchet(){const n=treeNear();if(n)chopTree(n.ch,n.t);else showMsg('Stand at a tree to fell it.','#c8b890');}
// the smith's and the goods shop's hatchet, beside the pick
function hatchetFor(h){return h&&(h.type==='weapon'||h.type==='misc')?[{...HATCHET_ITEM}]:[];}
// ── S1494 — Survival B, session 5: the forge (`docs/design/survival-build.md`; Michael's A on #781) ──
// A forge is a smith's room (5 gold a use). Smelting is 2 ore → 1 ingot: bronze from a copper and a tin, steel from 2 iron
// ore and a charcoal; silver has no ingot. A piece takes its type's ingots (dagger 1, one-handed 2, two-handed 4, shield 3,
// helm 2, chest 5, legs 3, feet 2, hands 1) and 30 game-minutes, and Smithing must stand at the metal's gate (SKILL_GATE,
// the same gate that wearing it reads). A made piece is never enchanted, carries `made`, and sells back at 20%. A temper is
// 3 ore of the piece's own metal, +8% attack or defence, three to a piece; the smith does it for 20 gold × tier instead.
// Smithing: an ingot 2, a piece 10 + 5 × tier (the skills sheet). The grip's plank waits for the bench (session 6).
// S1495 — Smithing's perks: *Smelter* (25) 3 ore → 2 ingots; *Fine work* (50) a made piece is Fine, +10%; *Temper* (75) four
// tempers; *Masterwork* (100) the first piece of each metal made after it is a Masterwork, +20% (`worldState.masterworks`).
const FORGE_FEE=5,FORGE_MIN=30,TEMPER_ORE=3,TEMPER_STEP=.08,MADE_SELL=.2;
const INGOT_DEF=[
  {tier:2,ore:[['copper',1],['tin',1]]},{tier:3,ore:[['iron',2]]},{tier:4,ore:[['iron',2]],charcoal:1},
  {tier:5,ore:[['mithril',2]]},{tier:6,ore:[['adamant',2]]},{tier:7,ore:[['obsidian',2]]}];
// the ore a piece of each metal is tempered with
const TEMPER_ORES={2:['copper','tin'],3:['iron'],4:['iron'],5:['mithril'],6:['adamant'],7:['obsidian']};
function ingotItem(tier,qty){const D=INGOT_DEF.find(d=>d.tier===tier),M=MATERIALS[tier-1];
  const p=D.ore.reduce((s,[k,n])=>s+ORE_DEF[k].price*n,0)+(D.charcoal?SURV_ITEMS.charcoal.buyPrice:0);
  return {name:`${M.name} Ingot`,ico:'🧱',type:'misc',weight:1,buyPrice:p,sellMult:.3,ingot:tier,qty:qty||1};}
// what a piece costs in ingots, and the types the forge makes: the heavy line, the shield, every blade and haft but the bows'
// (the bench's) and the wooden club
function forgeIngots(T){if(T.slot==='weapon')return T.type==='Dagger'?1:T.twoHand?4:2;
  return T.shieldType==='shield'?3:{head:2,chest:5,legs:3,feet:2,hands:1}[T.slot]||0;}
const FORGE_TYPES=[...WEAPON_TYPES.filter(T=>!/^(Bow|Crossbow|GreatClub)$/.test(T.type)).map(T=>({T,arm:false})),
  ...ARMOR_TYPES.filter(T=>forgeIngots(T)>0).map(T=>({T,arm:true}))];
function forgeHere(){return smithForge()||!!dunForgeNear();}
function smithForge(){return typeof isInterior==='function'&&isInterior()&&typeof currentHouse!=='undefined'&&!!currentHouse&&currentHouse.type==='weapon';}
// S1514 — the sheet's second forge: a fort armoury's smelter (D_FORGES, 56-dungeon-build.js), within touch on its floor. No smith
// keeps it, so it asks no fee and nobody tempers for gold there
function dunForgeNear(){if(activeZoneId!=='dungeon'||typeof D_FORGES==='undefined')return null;
  return D_FORGES.find(f=>f.floor===currentFloor&&Math.hypot(px-f.x,pz-f.z)<TOUCH)||null;}
function forgeFee(){if(!smithForge())return null;if(gold<FORGE_FEE)return `The smith asks ${FORGE_FEE} gold for the forge.`;gold-=FORGE_FEE;return null;}
function oreCount(k){return bagCount(b=>b.ore===k);}
function ingotCount(t){return bagCount(b=>b.ingot===t);}
let _forgeN=0;
// smelt one ingot. Returns {made, item, why}
function forgeSmelt(tier){
  if(!forgeHere())return {made:false,why:'You need a forge.'};
  const D=INGOT_DEF.find(d=>d.tier===tier);if(!D)return {made:false,why:''};
  const two=smelterTwo(D);
  if(!two)for(const [k,n] of D.ore)if(oreCount(k)<n)return {made:false,why:`You need ${n} ${ORE_DEF[k].name.toLowerCase()}.`};
  if(D.charcoal&&bagCount(b=>b.name===SURV_ITEMS.charcoal.name)<D.charcoal)return {made:false,why:'Steel needs a charcoal.'};
  const f=forgeFee();if(f)return {made:false,why:f};
  if(two)two.forEach(([k,n])=>bagTake(b=>b.ore===k,n));else for(const [k,n] of D.ore)bagTake(b=>b.ore===k,n);if(D.charcoal)bagTake(b=>b.name===SURV_ITEMS.charcoal.name,D.charcoal);
  const it=ingotItem(tier,two?2:1);bagAdd(it);skillUse('smithing',2,'f'+(_forgeN++));
  return {made:true,item:it};}
// Smelter: 3 ore of the recipe make 2 ingots when you have them (bronze: 3 of copper and tin, one of each at least, the more
// plentiful taken twice); the charcoal is one a smelt either way. Returns the ore to take, or null for the plain 2 → 1
function smelterTwo(D){if(!perk('smithing',25))return null;
  if(D.ore.length===1){const [k]=D.ore[0];return oreCount(k)>=3?[[k,3]]:null;}
  const [[a],[b]]=D.ore,na=oreCount(a),nb=oreCount(b);if(na<1||nb<1||na+nb<3)return null;return na>=nb?[[a,2],[b,1]]:[[a,1],[b,2]];}
// a made piece's quality: Masterwork once a metal at 100, else Fine at 50, else plain
function forgeQuality(tier){const M=worldState.masterworks||[];if(perk('smithing',100)&&!M.includes(tier))return 'master';return perk('smithing',50)?'fine':null;}
const FORGE_QUALITY={fine:{mult:1.1,word:'Fine'},master:{mult:1.2,word:'Masterwork'}};
function forgeQualityApply(it,q){const Q=FORGE_QUALITY[q];if(!Q)return it;it.quality=q;it.name=`${Q.word} ${it.name}`;
  if(it.atk)it.atk=it.atk.map(v=>Math.round(v*Q.mult));if(it.def)it.def=Math.max(1,Math.round(it.def*Q.mult));return it;}
// make a piece of one type in one metal. Returns {made, item, why}
function forgeMake(type,tier){
  if(!forgeHere())return {made:false,why:'You need a forge.'};
  const F=FORGE_TYPES.find(f=>f.T.type===type);if(!F||!INGOT_DEF.some(d=>d.tier===tier))return {made:false,why:''};
  const gate=SKILL_GATE[tier]||0;if(skillLv('smithing')<gate)return {made:false,why:`${MATERIALS[tier-1].name} asks Smithing ${gate} (you have ${skillLv('smithing')}).`};
  const n=forgeIngots(F.T);if(ingotCount(tier)<n)return {made:false,why:`You need ${n} ${MATERIALS[tier-1].name.toLowerCase()} ingot${n>1?'s':''}.`};
  const it=makeItem(tier,F.T,null,F.arm);it.made=true;it.sellMult=MADE_SELL;const q=forgeQuality(tier);forgeQualityApply(it,q);
  if(!canCarry(it))return {made:false,why:'Too heavy to carry!'};
  const f=forgeFee();if(f)return {made:false,why:f};
  bagTake(b=>b.ingot===tier,n);bagAdd(it);skillUse('smithing',10+5*tier,'f'+(_forgeN++));
  if(q==='master')(worldState.masterworks||(worldState.masterworks=[])).push(tier);
  if(typeof advanceClock==='function')advanceClock(FORGE_MIN);
  return {made:true,item:BAG[BAG.length-1]};}
// a piece's tempers: +8% each on the attack or defence it was made with, three to a piece
function temperMax(){return perk('smithing',75)?4:3;}
function temperable(it){return !!(it&&it.type==='equip'&&it.tier>=2&&it.tier<=10&&(it.atk||it.def)&&!it.cloak&&(it.tempers||0)<temperMax());}
function temperApply(it){if(it.atk&&!it.baseAtk)it.baseAtk=it.atk.slice();if(it.def&&it.baseDef==null)it.baseDef=it.def;
  it.tempers=(it.tempers||0)+1;const k=1+TEMPER_STEP*it.tempers;
  if(it.baseAtk)it.atk=it.baseAtk.map(v=>Math.round(v*k));if(it.baseDef!=null)it.def=Math.max(1,Math.round(it.baseDef*k));return it;}
// temper a piece (a bag item or one worn): with 3 of its own ore, or paid to the smith (bySmith). Returns {done, why}
function forgeTemper(it,bySmith){
  if(!forgeHere())return {done:false,why:'You need a forge.'};
  if(!temperable(it))return {done:false,why:it&&(it.tempers||0)>=temperMax()?'It will take no more tempering.':'That cannot be tempered.'};
  if(bySmith&&!smithForge())return {done:false,why:'No smith keeps this forge.'};
  if(bySmith){const c=20*it.tier;if(gold<c)return {done:false,why:`The smith asks ${c} gold.`};gold-=c;temperApply(it);return {done:true};}
  const ores=TEMPER_ORES[it.tier];if(!ores)return {done:false,why:`There is no ore for ${MATERIALS[it.tier-1].name.toLowerCase()}: the smith can temper it.`};
  const gate=SKILL_GATE[it.tier]||0;if(skillLv('smithing')<gate)return {done:false,why:`${MATERIALS[it.tier-1].name} asks Smithing ${gate}.`};
  if(bagCount(b=>ores.includes(b.ore))<TEMPER_ORE)return {done:false,why:`You need ${TEMPER_ORE} ${ores.map(k=>ORE_DEF[k].name.toLowerCase()).join(' or ')}.`};
  const f=forgeFee();if(f)return {done:false,why:f};
  bagTake(b=>ores.includes(b.ore),TEMPER_ORE);temperApply(it);return {done:true};}
// ── the forge's page (the fire's layout): smelt, make and temper on the left, the recipe and its gate on the right ──
let forgeOpen=false,forgeSel={k:'s',tier:2},forgeTier=null,forgeSaid='';
function forgePieces(){const out=[];for(const s in EQ){const it=EQ[s];if(temperable(it)&&!out.includes(it))out.push(it);}BAG.forEach(b=>{if(temperable(b))out.push(b);});return out;}
function forgeMetals(){return INGOT_DEF.map(d=>d.tier);}
function forgeCanSmelt(t){const D=INGOT_DEF.find(d=>d.tier===t);return D.ore.every(([k,n])=>oreCount(k)>=n)&&(!D.charcoal||bagCount(b=>b.name===SURV_ITEMS.charcoal.name)>=D.charcoal);}
function openForgePage(){
  if(!forgeHere()){showMsg('You need a forge.','#cc8844');return;}
  if(typeof hubOpen!=='undefined'&&hubOpen&&typeof closeHub==='function')closeHub();
  if(typeof shopOpen!=='undefined'&&shopOpen&&typeof closeShop==='function')closeShop();
  if(typeof _releasePointerLockForMenu==='function')_releasePointerLockForMenu();
  let ov=document.getElementById('forgeui');
  if(!ov){ov=document.createElement('div');ov.id='forgeui';
    ov.style.cssText='position:fixed;inset:0;z-index:8500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35)';
    ov.innerHTML='<div style="width:600px;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;padding:18px 24px 16px;background:#e9dcc2;color:#3a2c18;border:6px double #8a7040;border-radius:6px;font-family:Georgia,serif;box-shadow:0 10px 40px #000a">'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #a89060;padding-bottom:6px"><span style="font-size:22px;color:#7a1f10;letter-spacing:.06em;font-variant:small-caps">The Forge</span><span id="fg-skill" style="font-style:italic;font-size:13px;color:#8a7050"></span></div>'+
      '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:10px"><div id="fg-list" style="flex:1 1 180px;min-width:0;font-size:14px;line-height:1.6;max-height:52vh;overflow:auto"></div><div id="fg-right" style="flex:1.3 1 220px;min-width:0;font-size:14px;line-height:1.6"></div></div>'+
      '<div id="fg-said" style="min-height:20px;margin-top:8px;font-style:italic;color:#7a1f10;font-size:14px"></div>'+
      '<div style="display:flex;align-items:center;gap:12px;margin-top:8px;border-top:1px solid #a89060;padding-top:8px"><button type="button" id="fg-go" style="background:none;border:1px solid #7a1f10;border-radius:3px;font:18px Georgia,serif;color:#7a1f10;font-variant:small-caps;cursor:pointer;padding:2px 14px">Work</button>'+
      '<span style="flex:1"></span><span style="font-size:12px;font-style:italic;color:#8a7050"><button type="button" id="fg-no" style="background:none;border:1px solid #a89060;border-radius:3px;font:13px Georgia,serif;color:#3a2c18;cursor:pointer;padding:2px 7px">Esc</button> as you were · Enter works</span></div></div>';
    document.body.appendChild(ov);
    ov.querySelector('#fg-go').onclick=()=>forgeGo(false);ov.querySelector('#fg-no').onclick=()=>closeForgePage();}
  forgeSaid='';if(forgeSel.k==='t'&&!forgePieces().includes(forgeSel.it))forgeSel={k:'s',tier:2};
  ov.style.display='flex';forgeOpen=true;forgeDraw();
}
function closeForgePage(){const ov=document.getElementById('forgeui');if(ov)ov.style.display='none';forgeOpen=false;if(typeof refocusView==='function')refocusView();}
function forgeDraw(){const ov=document.getElementById('forgeui');if(!ov)return;
  ov.querySelector('#fg-skill').textContent=`Smithing ${skillLv('smithing')} · ${smithForge()?`${FORGE_FEE} gold a use · `:''}${gold} gold`;
  const row=(on,ok,key,label)=>`<div data-k="${key}" style="cursor:pointer;padding:0 6px;border-radius:2px;${on?'background:rgba(122,31,16,.12);color:#7a1f10':''}${!ok&&!on?';color:#a09070':''}">${on?'◆':'◇'} ${label}</div>`;
  const head=t=>`<div style="font-variant:small-caps;color:#8a7050;margin-top:4px">${t}</div>`;const S=forgeSel,P=forgePieces();
  let h=head('Smelt')+INGOT_DEF.map(d=>row(S.k==='s'&&S.tier===d.tier,forgeCanSmelt(d.tier),'s'+d.tier,`${MATERIALS[d.tier-1].name} Ingot`)).join('');
  h+=head('Make')+FORGE_TYPES.map((f,i)=>row(S.k==='m'&&S.type===f.T.type,forgeMetals().some(t=>ingotCount(t)>=forgeIngots(f.T)),'m'+i,f.T.type.replace(/([a-z])([A-Z])/g,'$1 $2'))).join('');
  if(P.length)h+=head('Temper')+P.map((it,i)=>row(S.k==='t'&&S.it===it,true,'t'+i,`${it.name}${it.tempers?` (${it.tempers})`:''}`)).join('');
  ov.querySelector('#fg-list').innerHTML=h;
  ov.querySelectorAll('#fg-list [data-k]').forEach(d=>d.onclick=()=>{const k=d.dataset.k,n=+k.slice(1);
    forgeSel=k[0]==='s'?{k:'s',tier:n}:k[0]==='m'?{k:'m',type:FORGE_TYPES[n].T.type}:{k:'t',it:P[n]};forgeSaid='';forgeDraw();});
  const pad=s=>`<div style="padding-left:12px">${s}</div>`,note=s=>`<div style="padding-left:12px;color:#8a7050;font-style:italic">${s}</div>`;let t='';
  if(S.k==='s'){const D=INGOT_DEF.find(d=>d.tier===S.tier),M=MATERIALS[S.tier-1];
    t=`<div style="font-variant:small-caps;color:#7a1f10">${M.name} Ingot</div>`+D.ore.map(([k,n])=>pad(`${n} ${ORE_DEF[k].name} <i style="font-size:12px;color:#8a7050">(you have ${oreCount(k)})</i>`)).join('')+
      (D.charcoal?pad(`1 Charcoal <i style="font-size:12px;color:#8a7050">(you have ${bagCount(b=>b.name===SURV_ITEMS.charcoal.name)})</i>`):'')+note(`you hold ${ingotCount(S.tier)}`);}
  else if(S.k==='m'){const F=FORGE_TYPES.find(f=>f.T.type===S.type),n=forgeIngots(F.T);
    if(forgeTier==null||!forgeMetals().includes(forgeTier))forgeTier=forgeMetals().find(m=>ingotCount(m)>=n)||2;
    t=`<div style="font-variant:small-caps;color:#7a1f10">${MATERIALS[forgeTier-1].name} ${S.type.replace(/([a-z])([A-Z])/g,'$1 $2')}</div>`+pad(`${n} ingot${n>1?'s':''} and ${FORGE_MIN} minutes`)+
      '<div style="padding-left:12px;display:flex;flex-wrap:wrap;gap:4px;margin:4px 0">'+forgeMetals().map(m=>{const g=SKILL_GATE[m]||0,ok=ingotCount(m)>=n&&skillLv('smithing')>=g;
        return `<button type="button" data-m="${m}" style="background:${m===forgeTier?'rgba(122,31,16,.12)':'none'};border:1px solid ${m===forgeTier?'#7a1f10':'#a89060'};border-radius:3px;font:13px Georgia,serif;color:${ok?'#3a2c18':'#a09070'};cursor:pointer;padding:1px 6px">${MATERIALS[m-1].name} ${ingotCount(m)}${g?` · ${g}`:''}</button>`;}).join('')+'</div>'+
      ((SKILL_GATE[forgeTier]||0)>skillLv('smithing')?note(`asks Smithing ${SKILL_GATE[forgeTier]}`):'')+note('made, never enchanted; sold back at a fifth');}
  else if(S.k==='t'){const it=S.it,ores=TEMPER_ORES[it.tier];
    t=`<div style="font-variant:small-caps;color:#7a1f10">${it.name}</div>`+pad(it.atk?`Attack ${it.atk[0]}–${it.atk[1]}`:`Defence ${it.def}`)+pad(`Tempered ${it.tempers||0} of ${temperMax()}, +${Math.round(TEMPER_STEP*100)}% each`)+
      (ores?pad(`${TEMPER_ORE} ${ores.map(k=>ORE_DEF[k].name).join(' or ')} <i style="font-size:12px;color:#8a7050">(you have ${bagCount(b=>ores.includes(b.ore))})</i>`):note('no ore of its metal'))+
      (smithForge()?`<div style="padding-left:12px;margin-top:4px"><button type="button" id="fg-smith" style="background:none;border:1px solid #a89060;border-radius:3px;font:13px Georgia,serif;color:#3a2c18;cursor:pointer;padding:1px 8px">The smith tempers it · ${20*it.tier} gold</button></div>`:'');}
  const R=ov.querySelector('#fg-right');R.innerHTML=t;
  R.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{forgeTier=+b.dataset.m;forgeSaid='';forgeDraw();});
  const sm=R.querySelector('#fg-smith');if(sm)sm.onclick=()=>forgeGo(true);
  ov.querySelector('#fg-said').textContent=forgeSaid;}
function forgeGo(bySmith){const S=forgeSel;let r;
  if(S.k==='s'){r=forgeSmelt(S.tier);forgeSaid=r.made?`${r.item.name}.`:r.why||'';}
  else if(S.k==='m'){r=forgeMake(S.type,forgeTier||2);forgeSaid=r.made?`${r.item.name}.`:r.why||'';}
  else if(S.k==='t'){r=forgeTemper(S.it,bySmith);forgeSaid=r.done?`${S.it.name}, tempered ${S.it.tempers} of ${temperMax()}.`:r.why||'';if(r.done&&typeof updateHUD==='function')updateHUD();}
  if(r&&(r.made||r.done)&&typeof uiTone==='function')uiTone(660,880,.08,.08,'triangle');
  if(typeof renderHubInv==='function')renderHubInv();
  if(!forgeHere()){closeForgePage();return;}forgeDraw();}
window.addEventListener('keydown',e=>{if(!forgeOpen)return;const c=e.code;let hit=true;
  if(c==='Escape')closeForgePage();else if(c==='Enter'){if(!e.repeat)forgeGo(false);}else hit=false;
  if(hit){e.preventDefault();e.stopPropagation();}},true);
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
  // S1112 — on watch on the spire (the draft's §4 line); asked before the enemies, which stand on the roof with you
  if(typeof WORLD!=='undefined'&&WORLD.onWatch&&WORLD.onWatch()) return {ok:false, reason:'Not on watch.'};
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
    if(!kindAllowed(group.name, zoneTier(zoneId))) return; /* S1059 — the kind's least tier, not your level (enemies by place) */
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
        const e = keyFoe(buildZoneEnemy(zScene, sol, ex, ez, group.name, pickVariant(group.name, tierLevel(zoneTier(zoneId)), 'normal', seededRng('variant', fid)), {tier:zoneTier(zoneId)}), fid); /* S1034 — the zone's tier (#373 A) */
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
  if(currentFloor===1){const de=Math.hypot(px-dAt(dEntranceX),pz-dAt(dEntranceZ));if(de<1.4&&de<=Math.hypot(px-bd.x,pz-bd.z))return null;}
  return bd;
}
// S798 — the room's keeper or resident answers E wherever the prompt says so (within 3.2 with the crosshair on them, 90-main.js's
// nearKeeper), and within 2.2 as before without aiming. E reached only 2.2, so from 2.2 to 3.2 the prompt promised what E did not.
function keeperAimed(){return !!(intNPCMesh&&Math.hypot(px-intNPCPos.x,pz-intNPCPos.z)<3.2&&Math.abs(jumpY)<1.2&&aimAt({g:intNPCMesh},3.6));}
// S905 (F2a) — a person under the crosshair (the keeper, or a guest within talking reach) wins over a door that is only near, as a
// bed does (S650): in a room of true size the door's 1.6 by 3.2 reaches the people waiting by it (the coaching inn's driver)
function personAimedIn(){return keeperAimed()||!!(typeof INT_NPCS!=='undefined'&&INT_NPCS.some(n=>Math.hypot(px-n.g.position.x,pz-n.g.position.z)<2.2&&Math.abs(jumpY-n.g.position.y)<1.2&&aimAt(n,3.6)));}
function keeperInReach(){return !!(intNPCMesh&&Math.abs(jumpY)<1.2&&(Math.hypot(px-intNPCPos.x,pz-intNPCPos.z)<2.2||keeperAimed()));}
// S1390 — a world door is taken only from the ground it stands on: on the spire's roof by its south parapet the tower's door is
// 4.8 m away across and 39 m below, and E took it in place of the stone (the quest writer's note, backlog A). Three metres is over
// any jump or step and under a storey.
function doorAtFeet(h){if(activeZoneId!=='world'||h.doorX==null)return true;return Math.abs(jumpY-activeTerrainH(h.doorX,h.doorZ))<3;}
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
    if(nearPortal){if(typeof greatRingBack==='function'&&greatRingBack(nearPortal)){greatDoorChoice(nearPortal);return;} /* S1354 — the way back to a great gate's ring */goToDungeon(nearPortal);return;}
    // House doors — Ashenmoor, Hearthwick, or Ironhaven
    if(activeZoneId==='overworld'){
      const nearHouse=HOUSES.find(h=>Math.hypot(px-h.doorX,pz-h.doorZ)<TOUCH);
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
      const nearHWHouse=HEARTHWICK_HOUSES.find(h=>Math.hypot(px-h.doorX,pz-h.doorZ)<TOUCH);
      if(nearHWHouse){goToInterior(nearHWHouse);return;}
    } else if(activeZoneId==='ironhaven'){
      const nearIHHouse=IRONHAVEN_HOUSES.find(h=>Math.hypot(px-h.doorX,pz-h.doorZ)<TOUCH);
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
        const nearZH=zHouses.find(h=>!h.byAim&&Math.hypot(px-h.doorX,pz-h.doorZ)<TOUCH&&doorAtFeet(h)); /* S614 — the ship's hatch is entered by the crosshair (WORLD.shipInteract) */
        if(nearZH){
          // S155 — a shop after hours or a home at night is locked: pick it (S142's lock), or come back
          if(typeof spireDoorHeld==='function'&&spireDoorHeld(nearZH)){openDialog(SPIRE_FOLK.sgt.def);return;} /* S1390 — the night sergeant's door: you ask him */
          if(activeZoneId==='world'&&typeof WORLD!=='undefined'&&WORLD.doorLockNow(nearZH)&&!WORLD.doorPicked(nearZH)){tryLockpick(WORLD.doorLockFor(nearZH));return;}
          goToInterior(nearZH);return;
        }
      }
    }
    if(typeof ringCairnNear==='function'&&ringCairnNear()){ringCairnUse();return;} /* S800 — the Noon Ring's cairn */
    if(typeof bellWreckNear==='function'&&bellWreckNear()){bellWreckUse();return;} /* S801 — the Drowned Bell's wreck */
    if(typeof flagstonePrompt==='function'&&flagstonePrompt()){flagstoneUse();return;} /* S1353 — the Ashfeld's flagstone */
    if(typeof spireStonePrompt==='function'&&spireStonePrompt()){spireStoneUse();return;} /* S1387 — the spire's stone */
    if(typeof bladeStoneNear==='function'&&bladeStoneNear()){bladeStoneUse();return;} /* S802 — the Gate-Blade's stone */
    if(activeZoneId==='world'&&typeof WORLD!=='undefined'&&WORLD.shipInteract())return; // v80 C — the helm
    // v80 S9 — camp bedrolls in the open world
    if(activeZoneId==='world'&&ZONES.world&&ZONES.world.beds){const bd=ZONES.world.beds.find(b=>Math.hypot(px-b.x,pz-b.z)<TOUCH);if(bd){openSleepUI();return;}}
    // Herb harvest — all zones
    const nearHerb=activeHerbs().find(h=>!h.harvested&&!h._tolled&&Math.hypot(px-h.x,pz-h.z)<TOUCH);
    if(nearHerb){harvestHerb(nearHerb);return;}
    {const v=veinNear();if(v){mineVein(v);return;}} /* S1491 — a vein, with a pick */
    {const n=treeNear();if(n&&(chopTool()||(CHOP&&CHOP.t===n.t))){chopTree(n.ch,n.t);return;}} /* S1511 — a tree, with a hatchet */
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
      const nearBoard=OW_NOTICE_BOARDS.find(b=>b.zone===activeZoneId&&Math.hypot(px-b.x,pz-b.z)<TOUCH);
      if(nearBoard){openNoticeBoard(nearBoard);return;}
    }
    talkNPC();return;
  }
  if(lid&&isInterior()){
    // Exit — threshold based on room depth by type
    // v61d4 — added safehouse:8.
    const _intDx={weapon:10,armor:10,potion:9,misc:9,inn:11,church:16,castle:22,safehouse:8};
    const _roomD=currentHouse?(currentHouse._roomD||_intDx[currentHouse.type||'misc']||9):9; // v80 S10 — generated rooms carry their depth
    if(pz>_roomD-((currentHouse&&currentHouse._exitD)||1.6)&&Math.abs(px-intDoorX(currentHouse))<((currentHouse&&currentHouse._exitW)||1.6)&&jumpY<.6&&!personAimedIn()){exitInterior();return;} // v80 S13 — the door, not the whole back wall
    if(typeof WORLD!=='undefined'&&WORLD.interiorTalk())return; // v80 S12 — guild members
    { // v80 S10 — any bed: rest (and take a banked level)
      if(typeof WORLD!=='undefined'&&WORLD.hatchInteract())return; // v80 — cellar hatch
      if(typeof WORLD!=='undefined'&&WORLD.boxInteract())return; // S155 — the strongbox, the home's chest
      if(typeof WORLD!=='undefined'&&WORLD.lootInteract())return; // v80 — tower chest
      if(typeof WORLD!=='undefined'&&WORLD.shelfInteract())return; // S1121 — a book from a shelf
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
    if(intBedPos && !INT_BEDS.length && Math.hypot(px-intBedPos.x,pz-intBedPos.z)<TOUCH && bedAimed(intBedPos)){ // v80 S11 — generated rooms use INT_BEDS (height-aware)
      openSleepUI();
      return;
    }
    // Shopkeeper — open dialog first
    if(keeperInReach()){ // v80 S13 — same floor only; S798 — wherever the prompt shows, too
      if(typeof sleeperAsleep==='function'&&sleeperAsleep())wakeSleeper(intNPCMesh,true); /* S739 — E wakes a sleeper, who then talks */
      dlgWokenLine=(typeof wokenGreetNow==='function')?wokenGreetNow():null; /* S770 — woken in the night, she says so first (#255) */
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
      else{dlgWokenLine=null;openShop();}
      return;
    }
    return;
  }
  if(typeof knotNear==='function'&&knotNear()){knotUse();return;} /* S1346 — a great gate's knot */
  if(typeof shuttleNear==='function'&&shuttleNear()){shuttleTake();return;} /* S797 — the Shuttle, in its gate's deepest room */
  if(typeof cloakDenNear==='function'&&cloakDenNear()){cloakDenTake();return;} /* S992 — the cloak, from under its sleeping master */
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
  if(dunForgeNear()){openForgePage();return;} /* S1514 — a fort armoury's smelter is a forge */
  const br=BARRELS.find(b=>b.floor===currentFloor&&lookingAt(b,2.6)&&(!b.opened||b.items.length>0)); // v80 — look-at
  if(br){ openLoot(br); return; }
  // exit via entrance cell (floor 1 only)
  if(currentFloor===1&&Math.hypot(px-dAt(dEntranceX),pz-dAt(dEntranceZ))<1.4){goToOW();return;}
  // staircase interaction
  if(dStairC!==null&&!DUNGEON_STAIRWELL&&Math.hypot(px-dAt(dStairC),pz-dAt(dStairR))<1.3){ // v80 S8 — legacy teleport only without a stairwell
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
        if(typeof gateBladeOpens==='function'&&gateBladeOpens(nearDoorObj))gateBladeOpen(nearDoorObj); /* S780 — #263 3A: the Gate-Blade's key */
        else tryLockpick(nearDoorObj); // v80 — a pick and a steady hand
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
      // S1283 — in the door's cell and within 0.6 of its plane (the cell is 2.5 or 3 m now; the leaf swings in its middle)
      const D_=nearDoorObj,inLeaf=(x,z)=>dCellOf(x)===D_.c&&dCellOf(z)===D_.r&&Math.abs(D_.isEW?x-D_.x:z-D_.z)<.6;
      const playerInCell = inLeaf(px,pz);
      const enemyInCell = ENEMIES.some(en=>!en.dead && en.floor===currentFloor && inLeaf(en.x,en.z));
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
