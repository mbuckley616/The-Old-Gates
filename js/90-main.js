
buildOW();buildForest();buildHearthwick();buildBealachSouth();buildIronhaven();buildDungeon(PORTALS[0]);buildViewmodel();buildShieldViewmodel();buildSpellOrbTemplates();scene=owScene;
// v80 — expose the streamed-world entry as a dev shortcut (paste in console): devWorld()
window.devUnlockAll=function(){return WORLD.devUnlockAll();};
window.devGold=function(n){n=(n==null?1000:+n)|0;gold+=n;updateHUD();showMsg(`+${n} gold (dev)`,'#e8d8a0');return gold;};
window.devWorld=function(x,z){WORLD.enter(x==null?null:x,z==null?null:z,0,'🌍 The open country');};


let prevT=0,swT=0,atmT=0;
const K={};window._K=K;
window.addEventListener('keydown',e=>{if(e.code==='F9'&&started){e.preventDefault();perfToggle();return;}if(e.code==='F8'&&started&&activeZoneId==='world'){e.preventDefault();try{WORLD.devSurvey();}catch(err){console.warn(err);}return;}if(e.code==='KeyV'&&started&&!dead&&!e.repeat){const ae=document.activeElement;if(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'))return;tpToggle();}});

// v80 S176 — F9: a frame-rate readout, so a playtest on a real machine can say where a frame goes. Headless
// Chromium draws on software GL and cannot time the GPU; this is the number that counts. Half-second averages:
// frames a second, the frame's length and the worst in the window, the loop's work before the draw (the world's
// tick, people, weather), the draw's own call (with the shadow pass), draw calls and triangles, the pixel ratio.
const PERF={on:false,el:null,n:0,t0:0,frame:0,worst:0,js:0,draw:0,calls:0,tris:0,last:null,prev:0};window.PERF=PERF;
function perfToggle(){PERF.on=!PERF.on;if(!PERF.el){const d=document.createElement('div');d.id='perf-hud';d.style.cssText='position:fixed;top:6px;left:50%;transform:translateX(-50%);z-index:300;pointer-events:none;font:11px/1.35 monospace;color:#dfe8c8;background:rgba(10,12,8,.72);padding:3px 8px;border-radius:3px;white-space:pre';document.body.appendChild(d);PERF.el=d;}
  PERF.el.style.display=PERF.on?'block':'none';PERF.n=0;PERF.t0=0;PERF.prev=0;PERF.worst=0;if(PERF.on)PERF.el.textContent='measuring…';else if(PERF.last)console.log('PERF',JSON.stringify(PERF.last));}
function perfNote(now,tLoop,tDraw0,tDraw1){
  if(PERF.prev){const f=now-PERF.prev;PERF.frame+=f;if(f>PERF.worst)PERF.worst=f;PERF.n++;}PERF.prev=now;
  PERF.js+=tDraw0-tLoop;PERF.draw+=tDraw1-tDraw0;PERF.calls+=REN.info.render.calls;PERF.tris+=REN.info.render.triangles;
  if(!PERF.t0)PERF.t0=now;if(now-PERF.t0<500||!PERF.n)return;
  const n=PERF.n,_fps=1000*n/PERF.frame,r={fps:_fps<10?+_fps.toFixed(1):Math.round(_fps),frameMs:+(PERF.frame/n).toFixed(1),worstMs:+PERF.worst.toFixed(1),jsMs:+(PERF.js/n).toFixed(1),drawMs:+(PERF.draw/n).toFixed(1),calls:Math.round(PERF.calls/n),tris:Math.round(PERF.tris/n),px:REN.getPixelRatio(),shadows:!!REN.shadowMap.enabled,w:REN.domElement.width,h:REN.domElement.height};
  PERF.last=r;PERF.el.textContent=`${r.fps} fps · frame ${r.frameMs} ms (worst ${r.worstMs}) · loop ${r.jsMs} · draw ${r.drawMs}\n${r.calls} calls · ${(r.tris/1000).toFixed(0)}k tris · ${r.w}×${r.h} at ${r.px}× · shadows ${r.shadows?'on':'off'}`;
  PERF.n=0;PERF.t0=now;PERF.frame=0;PERF.worst=0;PERF.js=0;PERF.draw=0;PERF.calls=0;PERF.tris=0;}
let _bareSwingMax=0; // v80 S382 — the length of a swing with no view model, latched on its first frame (issue #81)
function loop(now){
  const _pfL=PERF.on?performance.now():0;
  requestAnimationFrame(loop);
  const dt=Math.min((now-prevT)/1000,.05);prevT=now;
  // Main scene render
  REN.autoClear=true;
  tickCrosshair(); // v80 — the crosshair shows what E will open
  try{tickPeople(dt,now);}catch(e){} // v80 S153 — every townsperson's stride and breath, indoors too
  try{tickMimicJaws(now);}catch(e){} // v80 S198
  try{tickCreatures(dt,now);}catch(e){} // v80 S166 — every wolf's stride, crouch and spring
  try{if(typeof WORLD!=='undefined'&&WORLD.rainIndoor)WORLD.rainIndoor(activeZoneId!=='world'?0:(currentHouse?(/^(inn|home|church|castle|guild_f|guild_m|weapon|armor|potion|misc|goods|forge|apothecary|armoury|shipwright)$/.test(currentHouse.type)?.22:0):1));}catch(e){} // v80 — rain is muffled indoors, silent underground
  try{tickMonsterSounds(1/60);tickEnemyDetail();tickPortalFx(1/60);tickDragons(1/60);}catch(e){} // v80 — dungeon feel, dragons
  if(typeof WORLD!=='undefined'&&scene===WORLD.scene)WORLD.sweepLights(); // v80 — never render with a changed light count
  else if(scene){_sweepScenePool(scene);if(typeof WORLD!=='undefined'&&scene===dScene&&!dead)try{WORLD.tickBehaviours();}catch(e){}if(scene===dScene&&!dead)try{tickDungeonTraps(1/60);}catch(e){}} // v80 — dungeons and interiors get a pool too (the freeze on a kill was this); behaviours run in dungeons
  // v80 — the main story is handed to you: if a main quest is complete and what it unlocks is still locked, hand it over with the popup
  try{if(!window._mqT||performance.now()-window._mqT>1500){window._mqT=performance.now();for(const q of QUEST_DEFS){if(qState(q.id)!=='complete'||!q.unlocks)continue;for(const nid of q.unlocks){const nq=getQuest(nid);if(!nq||qState(nid)!=='locked'||!QS[nid])continue;QS[nid].state=nq.autoAccept?'active':'available';if(nq.autoAccept){showQuestUpdatePopup('accept',nq);if(typeof addLog==='function')addLog('📜',`New quest: ${nq.title}.`);}else if(nq.announce&&!QS[nid]._announced){QS[nid]._announced=true;showQuestUpdatePopup('accept',Object.assign({},nq,{title:`${nq.title} — speak with ${nq.giver}`}));if(typeof addLog==='function')addLog('📜',`${nq.giver} has something for you: ${nq.title}.`);}}}}}catch(e){}
  const _pfD=PERF.on?performance.now():0;
  REN.render(scene,CAM);
  if(PERF.on)perfNote(now,_pfL,_pfD,performance.now());
  // Viewmodel render on top (clear depth only, not colour)
  if(started&&!dead&&!won&&!invOpen&&!shopOpen&&!lootOpen&&!stashOpen&&!hubOpen&&!(document.getElementById('quest-popup')&&document.getElementById('quest-popup').style.display==='flex')&&(vmSword||vmShield)){
    // v70.2 — recompute arm bridges so they span shoulder→wrist AFTER the swing
    // tween has moved the hands this frame. Matrices must be fresh for the
    // hand world-position read.
    if(vmSword) vmSword.updateMatrixWorld(true);
    if(vmShield) vmShield.updateMatrixWorld(true);
    _updateArmBridge(vmArmR);
    _updateArmBridge(vmArmL);
    REN.autoClear=false;REN.clearDepth();
    REN.render(VM_SCENE,VM_CAM);
    REN.autoClear=true;
  }
  // v62.1 — Pointer lock state reconciler. Runs BEFORE the pause bailout so
  // that opening a menu correctly releases the lock even though the loop will
  // return early on the same frame. Cheap: a handful of property reads, a DOM
  // style write only when state actually changes. No-op until `started`.
  if(typeof reconcilePointerLock==='function') reconcilePointerLock();
  // v61ag: quest update popup also pauses the game tick — player is reading
  // a reflective journal beat; enemies shouldn't be attacking, stamina shouldn't
  // be regening, buffs shouldn't tick down. Mirrors how hub/dialog/shop pause.
  const _qpop = document.getElementById('quest-popup');
  const _qpopOpen = _qpop && _qpop.style.display==='flex';
  if(typeof lockOpen!=='undefined'&&lockOpen&&LP.live)lpWatch(); // S327 — before the pause: a halt's dialogue must close the lock
  if(!started||dead||won||invOpen||shopOpen||lootOpen||stashOpen||luOpen||hubOpen||dlgOpen||nbOpen||isBookOpen()||_qpopOpen||_introFadeActive||(typeof lockOpen!=='undefined'&&lockOpen&&!LP.live)||(typeof sleepOpen!=='undefined'&&sleepOpen))return;
  // v61e6 Session A: clock tick. Placed AFTER the pause bailout so UI-open
  // pauses the clock (consistent with stamina/buffs/cooldowns pausing).
  advanceClock(dt);
  // v61e7 Session B: day/night lighting interpolation. Throttled to 1Hz
  // internally — visible delta over 1 in-game minute (= 1 real second
  // at our cadence) is below perceptual threshold, and lerping per-frame
  // would burn cycles for nothing. The applier is also a no-op for
  // dungeons/interiors and for owBurnedScene (locked).
  applyDayNightLighting(now/1000);
  swT+=dt;playClockS+=dt;
  if(atkCd>0)atkCd-=dt;if(spCd>0)spCd-=dt;
  // Single armor bonus lookup per frame (cached, dirty-flagged on equip change)
  const _ab=getArmorEnchantBonuses();
  const _emHP=effMaxHP();
  const _emMana=effMaxMana();
  const _emSt=effMaxStamina();
  // Stamina — cooldown before regen, scales with level + Resolve attr
  // Encumbrance: burdened (80%+) applies -20% regen; overloaded (100%+) keeps same penalty.
  const _encState = encumbranceState();
  const _stRegenMult = (_encState==='burdened' || _encState==='overloaded' || _encState==='immobile') ? 0.8 : 1.0;
  if(staminaCD>0){staminaCD=Math.max(0,staminaCD-dt);}
  else if(stamina<_emSt){stamina=Math.min(_emSt,stamina+dt*(3+(level-1)*0.4+ATTRS.resolve*0.3+_ab.stRegen)*_stRegenMult);}
  mana=Math.min(_emMana,mana+dt*(0.8+(level-1)*0.15+attrEff('intelligence')*0.2+_ab.mpRegen));
  // HP regen from armor enchants
  if(PHP<_emHP&&_ab.hpRegen>0){PHP=Math.min(_emHP,PHP+dt*_ab.hpRegen);}
  // Herb + potion hpRegen buffs (v61x adds potion source; mechanism unchanged)
  ACTIVE_BUFFS.filter(b=>b.type==='hpRegen').forEach(b=>{PHP=Math.min(_emHP,PHP+dt*(b.rate||0));});
  // v61x: mpRegen / stRegen buffs — parallel tick to hpRegen. Stacks additively on
  // top of the armor-enchant static regen and the base per-level regen, same as
  // hpRegen does. Clamped to effective max (which includes enchant bonuses).
  ACTIVE_BUFFS.filter(b=>b.type==='mpRegen').forEach(b=>{mana=Math.min(_emMana,mana+dt*(b.rate||0));});
  ACTIVE_BUFFS.filter(b=>b.type==='stRegen').forEach(b=>{stamina=Math.min(_emSt,stamina+dt*(b.rate||0));});
  ACTIVE_BUFFS.filter(b=>b.type==='regen').forEach(b=>{const r=dt*(b.rate||0);PHP=Math.min(_emHP,PHP+r);mana=Math.min(_emMana,mana+r);stamina=Math.min(_emSt,stamina+r);});
  // v61as: buff countdown — runs every frame regardless of zone. Used to
  // be inside tickHerbs (only called from outdoor zones), so buff timers
  // froze in dungeons and interiors and the player saw effects persist
  // far longer than the duration claimed. Clearer side-effect: the buff
  // pill in the HUD ticked down outdoors and stalled the moment the
  // player entered a portal. Now decoupled from zone dispatch entirely.
  tickActiveBuffs(dt);
  // v62.5 — Screen-edge tint priority chain:
  //   hurtT > 0           → red (full damage taken)
  //   blockFlashT > 0     → blue (held block) or gold (perfect parry)
  //   bare-hand blocking  → subtle blue (held)
  //   powerArmed          → gold tint while LMB held past threshold
  //   powerFlashFadeT > 0 → gold tint fading after release
  //   else                → no tint
  // The power-armed tint is the second-lowest priority. Anything more urgent
  // (hurt, block events) overrides it for the duration of that event, then the
  // chain falls back to power-armed if the player is still charging.
  const _bareHandBlocking = blocking && !(EQ.offhand&&EQ.offhand.shieldType==='shield');
  if(hurtT>0){
    hurtT-=dt;
    if(blockFlashT<=0) document.getElementById('df').style.boxShadow=`inset 0 0 60px rgba(180,20,20,${(hurtT*.7).toFixed(2)})`;
  } else if(blockFlashT<=0 && !_bareHandBlocking){
    // Power-attack armed tint — gold, distinct from parry-gold because it's
    // held (steady alpha) rather than a single flash (decaying alpha). When
    // the player releases, powerFlashFadeT carries the tint a moment longer
    // so the cue doesn't snap off jarringly.
    if(powerArmed){
      document.getElementById('df').style.boxShadow='inset 0 0 50px rgba(220,170,50,.42)';
    } else if(powerFlashFadeT>0){
      powerFlashFadeT=Math.max(0, powerFlashFadeT - dt);
      const _pa=(powerFlashFadeT/0.25*0.42).toFixed(2);
      document.getElementById('df').style.boxShadow=`inset 0 0 50px rgba(220,170,50,${_pa})`;
    } else {
      document.getElementById('df').style.boxShadow='';
    }
  }
  tickLock(dt);
  fwdX=-Math.sin(yaw);fwdZ=-Math.cos(yaw);rgtX=Math.cos(yaw);rgtZ=-Math.sin(yaw);

  // Sprint — blocked during cooldown AND when overloaded (>=100% cap)
  // v63 — Also blocked while sneaking (sneak + sprint is incoherent;
  // sneaking is a deliberate stealth posture).
  const _canSprint = _encState!=='overloaded' && _encState!=='immobile' && !_sneaking;
  const _sprintAttempt = K['ShiftLeft']&&stamina>0&&staminaCD<=0&&(K['KeyW']||K['ArrowUp']);
  const sprinting = _sprintAttempt && _canSprint;
  // Feedback: if player tries to sprint but is too encumbered, show message (throttled to once per 2s).
  if(_sprintAttempt && !_canSprint){
    if(!window._lastEncMsg || performance.now()-window._lastEncMsg > 2000){
      window._lastEncMsg = performance.now();
      showMsg('Too heavy to run!','#dd8844');
    }
  }
  const basespd=((typeof WORLD!=='undefined'&&activeZoneId==='world'&&WORLD.isSwimming())?1.7:3.83)*(fxOn('haste')?1.5:1); // v80 — swimming is slow; Haste
  const swiftMult=1+(attrEff('swiftness')*0.02);
  const sprintBuff=_buffMult('sprintSpeed',1)*_buffMult('swiftness',1); // S316 — the Boon of the Road (×1.25), read nowhere before
  // Encumbrance speed penalty: -50% when overloaded. Immobile zeros speed entirely.
  const _encSpeedMult = _encState==='immobile' ? 0 : _encState==='overloaded' ? 0.5 : 1.0;
  // v61f: DEV_SPEED_MUL is a window-scoped playtest knob. Default 1 (no change).
  // Set `DEV_SPEED_MUL = 10` in the console to walk 10× faster for testing
  // zone transitions. Not persisted anywhere — goes away on page reload.
  const _devSpdMul = (typeof DEV_SPEED_MUL !== 'undefined') ? DEV_SPEED_MUL : 1;
  // v62 — Power-attack charge tick. Accumulate hold time while LMB is down;
  // latch powerArmed exactly once when threshold is crossed (sound cue fires
  // here, not at input time, so the "you're committed" feedback is at the
  // mechanically meaningful moment). Charge cleared on mouseup or block.
  if(powerCharging){
    const wasArmed = powerArmed;
    powerCharge += dt;
    if(!wasArmed && powerCharge >= POWER_CHARGE_THRESHOLD){
      powerArmed = true;
      sndPowerCharge();
    }
  }
  // v64 — Bow draw tick. Accumulate draw time, drain stamina at the per-second
  // rate. If stamina hits zero, draw auto-releases (mirrors the realistic
  // "your arms gave out" failure mode). Auto-cancel also triggers if blocking
  // somehow becomes true (defensive — the mousedown branch blocks the RMB
  // path during drawing, but a save/load mid-draw or hurt-cancel could leave
  // a stale state).
  if(_bowDrawing){
    _bowDrawT += dt;
    // Stamina drain — continuous, so the player can't infinitely hold a draw.
    // Tunable via BOW_STAM_DRAIN_PER_SEC; current 8/sec means a full-tier
    // 1 player can hold a max draw for ~6 seconds before running dry.
    const drain = _stamCost(BOW_STAM_DRAIN_PER_SEC * dt);
    stamina = Math.max(0, stamina - drain);
    // Cap draw at BOW_DRAW_MAX (further hold = no more damage but still costs
    // stamina, which is the realistic feel — "you can't draw harder than the
    // bow allows").
    if(_bowDrawT > BOW_DRAW_MAX) _bowDrawT = BOW_DRAW_MAX;
    // Out of stamina → forced release. Fires whatever draw they've got.
    if(stamina <= 0){
      const strength = _bowDrawStrength();
      const heldEnough = _bowDrawT >= BOW_DRAW_MIN;
      _bowDrawing = false;
      _bowDrawT = 0;
      if(heldEnough && _hasArrows()){
        fireArrow(strength);
        showMsg('⚠ Out of stamina — bow released!','#cc8844');
      } else {
        showMsg('⚠ Out of stamina — draw lost.','#cc8844');
      }
    }
  }
  // v64 — Animate the bow viewmodel during a draw. The string is built as
  // two tip-anchored segments (v64.1). At rest both lie flat along the bow
  // plane. As _bowDrawT increases, the shared "nock point" translates back
  // toward the player (+Z in viewmodel-local space, since the bow group
  // sits at z=-.55 in world and +Z brings the nock toward the camera at
  // z=0). Each segment pivots around its tip to track the new nock position.
  //
  // Rotation math: each segment is a child Group whose origin sits at the
  // tip. The string box inside it extends along Y from that origin toward
  // the bow midline (top segment: -Y; bottom segment: +Y). To swing the box's
  // far end toward +Z (toward camera), the X rotation sign depends on which
  // direction the box extends from its pivot:
  //   - Top group (box extends along -Y): negative X rotation swings -Y toward +Z. ✓
  //   - Bottom group (box extends along +Y): positive X rotation swings +Y toward +Z. ✓
  if(vmSword && vmSword.userData && vmSword.userData.bowStringTopGroup){
    const topGrp = vmSword.userData.bowStringTopGroup;
    const botGrp = vmSword.userData.bowStringBotGroup;
    const tipY = vmSword.userData.bowTipY || 0.40;
    const nock = vmSword.userData.bowNockArrow;
    const drawNorm = _bowDrawing ? Math.min(1, _bowDrawT / BOW_DRAW_MAX) : 0;
    // Pullback distance toward camera (+Z in viewmodel-local).
    const pullback = drawNorm * 0.22;
    // Angle each segment rotates to point its far end at (z=+pullback) when
    // the segment originally lay along its respective Y axis. Same magnitude,
    // opposite sign per segment because the geometry mirrors across the
    // bow's horizontal midline.
    const ang = Math.atan2(pullback, tipY);
    if(topGrp) topGrp.rotation.x = -ang;
    if(botGrp) botGrp.rotation.x =  ang;
    // Nock arrow indicator — slides toward camera with the string. Rest
    // position z=-0.10 sits slightly ahead of the bow grip; full draw brings
    // it to z=-0.10+pullback (toward camera). Fade opacity proportional to
    // draw so the arrow appears smoothly rather than popping in.
    if(nock){
      nock.material.opacity = drawNorm * 0.95;
      nock.position.z = pullback;
    }
  }
  // v62 — Movement penalty while a power attack is armed. Applied before
  // sprint multiplier so an armed player can't sprint-cancel the penalty.
  // POWER_MOVE_MULT=0.4: still mobile enough to reposition, slow enough to
  // make the commitment feel real.
  // v62.6 — Gates on powerArmed (threshold crossed), NOT powerCharging
  // (mousedown). Tap-and-release clicks below the threshold leave movement
  // untouched — the "I'm charging" feel only kicks in once the player has
  // actually committed by holding long enough.
  const _powMoveMult = powerArmed ? POWER_MOVE_MULT : 1.0;
  // v62.7 — Forward lunge tick. Decay lungeT; cancel on hit (hurtT > 0,
  // taking damage interrupts the lunge per design). The lunge speed multiplier
  // is applied selectively (forward-component only) at the movement step
  // below, so strafing mid-lunge doesn't accelerate sideways. Lunge ALSO
  // cancels naturally on W-release because the multiplier acts on the W
  // movement vector — let go of W, nothing to multiply.
  if(lungeT > 0){
    lungeT = Math.max(0, lungeT - dt);
    if(hurtT > 0) lungeT = 0; // hit-cancel
  }
  const _lungeMult = lungeT > 0 ? LUNGE_SPEED_MULT : 1.0;
  // v62.8 — Deferred power-swing tick. The mouseup handler commits the
  // power attack (cost/cooldown/lunge fire on release) but defers the swing
  // animation and hit detection by POWER_WINDUP_DELAY so the strike lands
  // near the end of the forward lunge. Cancel conditions: player dead, or
  // player started blocking (RMB held). Hit (hurtT > 0) does NOT cancel —
  // the blade is committed; this is the risk/reward of power attacks.
  if(powerSwingDelayT > 0){
    if(dead || blocking){
      // Cancel: refund nothing (cost was paid, that's the commitment).
      powerSwingDelayT = 0;
      powerSwingDelayPower = false;
    } else {
      powerSwingDelayT = Math.max(0, powerSwingDelayT - dt);
      if(powerSwingDelayT === 0){
        // Fire the deferred swing. attack() routes to dungeon or zone path
        // internally; the _isDeferred flag tells it to skip cost gates.
        const _wasPow = powerSwingDelayPower;
        powerSwingDelayPower = false;
        attack(_wasPow, true);
      }
    }
  }
  // v63 — Sneak movement multiplier. When _sneaking is true, player moves
  // at SNEAK_MOVE_MULT (0.7×) of normal. Sprint is suppressed while sneaking
  // (the modal commitment is intentional — Ctrl is a state, not modifier).
  const _sneakMoveMult = _sneaking ? SNEAK_MOVE_MULT : 1.0;
  tickPlayerPosture(dt,performance.now()/1000); // S281
  const spd=basespd*swiftMult*sprintBuff*(sprinting?1.225:1)*_encSpeedMult*_devSpdMul*_powMoveMult*_sneakMoveMult*(playerStaggered(performance.now()/1000)?0:1)*dt;
  if(sprinting){
    const sprintDrain=14*_buffMult('staminaCost',1)*_finesseSprint();
    stamina=Math.max(0,stamina-dt*sprintDrain);
    if(stamina===0){staminaCD=2;lvAct.staminaDepleted++;}
    lvAct.sprintDist+=spd;
  }
  // Blocking stamina drain (in dungeons and outdoor zones, not shops)
  if(blocking&&!isInterior()){
    const hasShield=EQ.offhand&&EQ.offhand.shieldType==='shield';
    // v61au: Resolve reduces block stamina cost. Each point of Resolve cuts
    // 5% off the per-second drain, clamped to a 50% floor (so a maxed-Resolve
    // character still pays half cost, never gets free blocking). Addresses
    // the playtest concern that blocking was rarely worth doing — at Resolve
    // 5 a shield-block now drains ~10.3/s instead of 13.75/s, letting a
    // Sentinel hold guard for 4-5 seconds against a multi-enemy press.
    const _blockMult = Math.max(0.5, 1 - ATTRS.resolve*0.05);
    stamina=Math.max(0,stamina-dt*(hasShield?13.75:8.75)*_blockMult);
    if(stamina===0){blocking=false;staminaCD=2;lvAct.staminaDepleted++;}
  }
  // Can't block in overworld or shops
  if(isInterior())blocking=false; // no combat in shops
  // FOV shift for sprint. v62.7: LUNGE_FOV (92) overrides while lungeT > 0
  // for a small "rush" punch. Reverts to sprint/idle FOV after lunge expires
  // via the same dt*8 lerp.
  const targetFOV = lungeT > 0 ? LUNGE_FOV : (sprinting?85:75);
  CAM.fov+=(targetFOV-CAM.fov)*Math.min(1,dt*8);CAM.updateProjectionMatrix();

  let mdx=0,mdz=0;
  if(K['KeyW']||K['ArrowUp']){mdx+=fwdX;mdz+=fwdZ;}
  if(K['KeyS']||K['ArrowDown']){mdx-=fwdX;mdz-=fwdZ;}
  if(K['KeyA']){mdx-=rgtX;mdz-=rgtZ;}
  if(K['KeyD']){mdx+=rgtX;mdz+=rgtZ;}
  const _roll=tickRoll(performance.now()/1000);
  if(_roll){mdx=_roll.dx;mdz=_roll.dz;}
  const moving=!!(mdx||mdz);
  // v62.7 — Forward lunge boost. If lungeT > 0 AND W is currently held, add an
  // extra forward-direction displacement on top of normal WASD motion. The
  // boost is forward-only (uses fwdX/fwdZ, not the normalized WASD vector) so
  // strafing mid-lunge doesn't accelerate sideways. Bailout: release W and
  // the boost disappears the same frame because _lungeBoostActive flips
  // false. The boost ALSO respects the same collision-slide logic as normal
  // movement, so lunging into a wall stops at the wall rather than clipping.
  const _wHeldNow = !!(K['KeyW']||K['ArrowUp']);
  const _lungeBoostActive = lungeT > 0 && _wHeldNow && !_roll;
  if(moving){const len=Math.sqrt(mdx*mdx+mdz*mdz)||1,dx=_roll?mdx:mdx/len*spd,dz=_roll?mdz:mdz/len*spd;
    // Extra forward displacement during lunge — added to the WASD-driven dx/dz.
    // Magnitude is (_lungeMult - 1) × spd so the total forward component
    // resolves to spd × _lungeMult (matching the design intent of "forward
    // speed multiplied by LUNGE_SPEED_MULT").
    const _lbx = _lungeBoostActive ? fwdX*spd*(_lungeMult-1) : 0;
    const _lbz = _lungeBoostActive ? fwdZ*spd*(_lungeMult-1) : 0;
    const tdx = dx + _lbx;
    const tdz = dz + _lbz;
    if(lid==='overworld'){if(!currentZoneSolid(px+tdx,pz))px+=tdx;if(!currentZoneSolid(px,pz+tdz))pz+=tdz;}
    else if(isInterior()){
      const R=0.3,nx2=px+dx,nz2=pz+dz;
      const _intW={weapon:11,armor:11,potion:9,misc:10,inn:13,church:10,castle:18};
      const _intDd={weapon:10,armor:10,potion:9,misc:9,inn:11,church:16,castle:22};
      const iW=(currentHouse&&currentHouse._roomW)||_intW[currentHouse&&currentHouse.type||'misc']||10; // v80 — generated rooms carry their size
      const iD=(currentHouse&&currentHouse._roomD)||_intDd[currentHouse&&currentHouse.type||'misc']||9;
      const _gen=currentHouse&&currentHouse.id&&String(currentHouse.id).startsWith('g_');
      const behindCounter=_gen?(intSolidAt(nx2,nz2,R)):(nz2<2.5&&nx2>2.6&&nx2<iW-2.6); // v80 — generated rooms use their own furniture solids
      if(nx2>R&&nx2<iW-R&&!behindCounter)px+=dx;
      if(nz2>R&&nz2<iD-R&&!behindCounter)pz+=dz;
    }
    else{const[nx,nz]=dSlide(px,pz,tdx,tdz);px=nx;pz=nz;}}

  // Jump physics
  const GRAVITY=18,JUMP_VEL=5.5;
  // Determine context: dungeon lid starts with 'dyn_', interior with 'int_', overworld is 'overworld'
  const inDungeon=lid&&lid.startsWith('dyn_');
  const inOverworld=!inDungeon&&!isInterior();
  const floorBaseY0=(inDungeon&&DUNGEON_STAIRWELL)?Math.min(0,FLOOR2_Y):((inDungeon&&currentFloor===2)?FLOOR2_Y:0); // v80 — with a stairwell the base is the lower floor; the upper floor is a foothold with the shaft as its hole
  const floorBaseY=(inDungeon||isInterior())?footholdY(px,pz,jumpY,floorBaseY0):floorBaseY0; // v80 — footholds (stairs, galleries)
  if(onGround&&K['Space']){
    if(inOverworld) jumpY=activeTerrainH(px,pz);
    velY=JUMP_VEL;onGround=false;sndJump();
  }
  if(!onGround){
    velY-=GRAVITY*dt;
    jumpY+=velY*dt;
    // Flat floor clamp for dungeons and interiors (not terrain-following overworld)
    if((inDungeon||isInterior())&&jumpY<=floorBaseY){jumpY=floorBaseY;velY=0;onGround=true;sndLand();landShake=0.06;}
  }
  if(landShake>0){landShake=Math.max(0,landShake-dt*4);}
  if(typeof tickSpellFx==='function')tickSpellFx(dt); // v80
  // v80 — indoors: follow the foothold under you (climb a ramp) or step off it (fall)
  if((inDungeon||isInterior())&&onGround){if(floorBaseY>=jumpY-.02)jumpY+=(floorBaseY-jumpY)*Math.min(1,dt*18);else if(jumpY-floorBaseY>.06){onGround=false;velY=0;}}
  if(inDungeon&&DUNGEON_STAIRWELL){const nf=(FLOOR2_Y>0?jumpY>FLOOR2_Y*.5:jumpY<FLOOR2_Y*.5)?2:1;if(nf!==currentFloor)currentFloor=nf;
    const sp=FOOTHOLDS.find(f=>f.kind==='spiral');if(sp){const lo=Math.min(0,FLOOR2_Y)+.25,hi=Math.max(0,FLOOR2_Y)-.25;if(jumpY>lo&&jumpY<hi&&Math.abs(px-sp.cx)<1.6&&Math.abs(pz-sp.cz)<1.6){const dx=px-sp.cx,dz=pz-sp.cz,rd=Math.hypot(dx,dz)||.001;const rmax=sp.r1-.08,rmin=sp.r0+.12;if(rd>rmax){px=sp.cx+dx/rd*rmax;pz=sp.cz+dz/rd*rmax;}else if(rd<rmin){px=sp.cx+dx/rd*rmin;pz=sp.cz+dz/rd*rmin;}}}} // v80 — which floor is live follows your height; a rail keeps you on the helix
  // Terrain height follow — only in open overworld zones
  let terrainY=0;
  if(inOverworld){
    terrainY=activeTerrainH(px,pz);
    if(typeof spellLevitating==='function'&&spellLevitating()){velY=0;onGround=false;const up=(K['Space']?3.2:0)-(K['KeyC']?3.2:0);jumpY=Math.max(terrainY,jumpY+up*dt);if(up===0&&jumpY<terrainY+.3)jumpY=terrainY;} // v80 — Levitate
    else if(activeZoneId==='world'&&typeof WORLD!=='undefined'){const dy=WORLD.diveTick(dt,terrainY);if(dy!=null){terrainY=dy;if(jumpY<=dy+.05){onGround=true;velY=0;}else{onGround=false;}}} // v80 D — diving; falling into water is a fall
    if(onGround){
      jumpY+=(terrainY-jumpY)*Math.min(1,dt*18);
    } else if(jumpY<=terrainY){
      jumpY=terrainY;velY=0;onGround=true;sndLand();landShake=0.06;
    }
  }
  // v71 — Jump DISPLACEMENT above the current ground reference, for the
  // viewmodel's jump-bob term. `jumpY` is an ABSOLUTE world Y: 0 on floor 1, but
  // FLOOR2_Y (5.0) on floor 2 — and terrain height in the overworld. Feeding raw
  // jumpY into the viewmodel made the weapon ride ~0.20u higher on floor 2 (and
  // would drift on elevated terrain). The viewmodel only wants the *bounce* — how
  // far above the ground the player currently is — so subtract the ground ref.
  const _groundRefY = inOverworld ? terrainY : floorBaseY;
  const jumpDisp = jumpY - _groundRefY;   // 0 at rest on any floor/terrain; >0 mid-jump
  // v63 — Smoothed crouch transition. Eye height lerps toward EYE_CROUCH when
  // sneaking, EYE_STAND otherwise. Rate constant gives ~0.30s for ~95% complete.
  // Headbob amplitude halves while sneaking — completes the "stealth posture"
  // visual without needing a separate skeletal crouch animation.
  const _eyeTarget = _sneaking ? EYE_CROUCH : EYE_STAND;
  _eyeHeightCur += (_eyeTarget - _eyeHeightCur) * Math.min(1, dt * CROUCH_LERP_RATE);
  const _bobMult = _sneaking ? SNEAK_BOB_MULT : 1.0;
  const bob=moving?(lid==='overworld'?Math.sin(swT*4)*.008*_bobMult:Math.sin(swT*3.8)*.012*_bobMult):0;
  // In overworld: camera sits at terrain+eye. jumpY tracks terrain on ground, rises above on jump.
  // In dungeons/interiors: flat floor, jumpY is absolute Y above floor.
  const _rollDip=_roll?.55*Math.sin(Math.PI*_roll.p):0; // S275 — the eye drops through a roll
  const camY=(lid==='overworld'&&isOverworldZone())
    ? jumpY+_eyeHeightCur+bob-landShake-_rollDip
    : jumpY+_eyeHeightCur+bob-landShake-_rollDip;
  CAM.position.set(px,camY,pz);CAM.rotation.y=yaw;CAM.rotation.x=pitch;
  // v80 S126 — third person: the jointed body, its kit and pose, and a camera that walls pull in
  try{tpUpdate(dt,{moving,sprinting,camY,now:performance.now(),roll:_roll});}catch(e){if(!window._tpErr){window._tpErr=1;console.warn('third person',e);}}
  drawLockMark();

  // Viewmodel sword animation
  if(vmSword){
    const idleBob  = Math.sin(swT*1.8)*.004;
    // v63 — Halve sword bob/sway while sneaking, matching the camera's _bobMult.
    // Keeps the sword's perceived motion coherent with the player's stealthy
    // body language — exaggerated sway during a careful crawl looks wrong.
    const _vmBobMult = _sneaking ? SNEAK_BOB_MULT : 1.0;
    const walkBob  = moving ? Math.sin(swT*(sprinting?9:6))*(sprinting?.022:.014)*_vmBobMult : 0;
    const walkSway = moving ? Math.sin(swT*(sprinting?4.5:3))*(sprinting?.016:.010)*_vmBobMult : 0;
    const totalBob = idleBob + walkBob;
    // Swing animation. v62: track the duration the current swing was started with
    // so the arc tween divides by the right value — a power swing starts at 0.55s,
    // a normal at 0.38s. Without this the power swing would render the same shape
    // as the normal swing but stretched in time (wrong: a power swing should look
    // like a bigger arc, not a slo-mo of the small one).
    let swingX=0,swingY=0,swingZ=0,swingPosX=0,swingPosY=0,swingPosZ=0;
    if(swingT>0){
      // Latch the start-duration on the first frame of a swing. Cleared when
      // swingT returns to 0 below. swingMax tracks "what was swingT when this
      // swing started" so we can compute progress as p = 1 - swingT/swingMax.
      // v65.6 — Randomized variant per swing matching Oblivion's swing feel.
      // The v65.5 alternating R/L direction was replaced with random pick from
      // three variants per swing: UR→LL diagonal slash, UL→LR diagonal slash,
      // and overhead chop (UC→LC). Each variant has its own target end pose;
      // the timing phases (anticipation/sweep/hold/settle) are shared.
      //
      // v65.7 — All numeric parameters read from ANIM_PARAMS.swing so the debug
      // panel can tune them live. variantLock=-1 means random; 0/1/2 lock to
      // that specific variant (so a slider tuning session can isolate one).
      const _SP = ANIM_PARAMS.swing;
      if(!vmSword.userData.swingMax){
        vmSword.userData.swingMax = swingT;
        // v66.1 — Power detection now reads the pending strike's isPow flag.
        // The old `swingT > 0.57` heuristic broke once swingT became weight-
        // scaled (a heavy normal swing can exceed 0.57; a light power swing can
        // fall under it). _pendingStrike.isPow is authoritative.
        vmSword.userData.swingIsPower = !!(_pendingStrike && _pendingStrike.isPow);
        // v65.9 — Variant selection priority:
        //   1. Panel variantLock (debug override, wins over everything)
        //   2. Power-attack bind (1H → V0, 2H → V2 by default)
        //   3. Weighted random across V0/V1/V2 weights
        if(_SP.variantLock >= 0 && _SP.variantLock <= 2){
          vmSword.userData.swingVariant = _SP.variantLock;
        } else if(vmSword.userData.swingIsPower){
          // Power-attack bind: pick variant based on weapon class. The check
          // mirrors _w2h further down: twoHand:true AND not a bow.
          const _isW2H = !!(EQ.weapon && EQ.weapon.twoHand && EQ.weapon.weaponShape !== 'bow');
          const _bound = _isW2H ? _SP.powerVariant2H : _SP.powerVariant1H;
          // If the bind value is invalid (-1 or out of range), fall through to
          // weighted random. Otherwise use it.
          if(_bound >= 0 && _bound <= 2){
            vmSword.userData.swingVariant = _bound;
          } else {
            const _total = _SP.v0_chance + _SP.v1_chance + _SP.v2_chance;
            const _r = Math.random() * _total;
            vmSword.userData.swingVariant = _r < _SP.v0_chance ? 0
              : (_r < (_SP.v0_chance + _SP.v1_chance) ? 1 : 2);
          }
        } else {
        // Weighted random — all three variants weighted explicitly. Total
        // weight is the sum; random pick scales to that sum. So weights of
        // (1, 1, 0.2) give probabilities (1/2.2, 1/2.2, 0.2/2.2) ≈ (45, 45, 9).
        const _total = _SP.v0_chance + _SP.v1_chance + _SP.v2_chance;
        const _r = Math.random() * _total;
        vmSword.userData.swingVariant = _r < _SP.v0_chance ? 0
          : (_r < (_SP.v0_chance + _SP.v1_chance) ? 1 : 2);
        }
      }
      swingT=Math.max(0,swingT-dt);
      const swingMax = vmSword.userData.swingMax || _SP.normalDur;
      const p=1-(swingT/swingMax);
      // v66.1 — Impact sync: fire the deferred strike (audio + hit resolution)
      // the first frame progress crosses impactPoint. One-shot per swing via
      // the fired flag. resolveFn gathers candidates at THIS moment so reach is
      // evaluated when the blade visually arrives, not at click.
      if(_pendingStrike && !_pendingStrike.fired && p >= _SP.impactPoint){
        _pendingStrike.fired = true;
        const _ps = _pendingStrike;
        _pendingStrike = null;       // clear before resolve so re-entrancy is safe
        _ps.resolveFn(_ps.isPow);
      }
      const arc=Math.sin(p*Math.PI);
      const arcMag = vmSword.userData.swingIsPower ? 1.4 : 1.0;
      const variant = vmSword.userData.swingVariant || 0;
      //
      // Per-variant target pose pulled from ANIM_PARAMS.swing.
      let _tgtX = 0, _tgtY = 0, _tgtZ = 0, _tgtPitch = 0;
      let _antX = 0, _antY = 0;
      if(variant === 0){
        _tgtX     = _SP.v0_tgtX     * arcMag;
        _tgtY     = _SP.v0_tgtY     * arcMag;
        _tgtZ     = _SP.v0_tgtZ     * arcMag;
        _tgtPitch = _SP.v0_tgtPitch * arcMag;
        _antX     = _SP.v0_antX;
        _antY     = _SP.v0_antY;
      } else if(variant === 1){
        _tgtX     = _SP.v1_tgtX     * arcMag;
        _tgtY     = _SP.v1_tgtY     * arcMag;
        _tgtZ     = _SP.v1_tgtZ     * arcMag;
        _tgtPitch = _SP.v1_tgtPitch * arcMag;
        _antX     = _SP.v1_antX;
        _antY     = _SP.v1_antY;
      } else {
        _tgtX     = _SP.v2_tgtX     * arcMag;
        _tgtY     = _SP.v2_tgtY     * arcMag;
        _tgtZ     = _SP.v2_tgtZ     * arcMag;
        _tgtPitch = _SP.v2_tgtPitch * arcMag;
        _antX     = _SP.v2_antX;
        _antY     = _SP.v2_antY;
      }
      // Phase boundaries from ANIM_PARAMS so they're live-tunable.
      const antEnd = _SP.antEnd;
      const sweepEnd = _SP.sweepEnd;
      const holdEnd = _SP.holdEnd;
      // ease(t) is a smooth 0-1 transition curve, used for all phases.
      const ease = (t) => (1 - Math.cos(t * Math.PI)) / 2;
      let phaseX = 0, phaseY = 0, phaseZ = 0, phasePitch = 0, phasePushZ = 0;
      // v65.8 — Depth push (Z translation away from camera). Follows the
      // same phase pattern as position X/Y but ramps from 0 (rest depth)
      // toward _SP.swingPushZ at the swing extreme. Anticipation: no push
      // (windup happens at rest). Sweep: ease toward push target. Hold: full
      // push. Settle: ease back to 0.
      const _pushTgt = _SP.swingPushZ || 0;
      if(p < antEnd){
        const ap = ease(p / antEnd);
        phaseX = _antX * ap;
        phaseY = _antY * ap;
        phaseZ = 0;
        phasePitch = 0;
        phasePushZ = 0;
      } else if(p < sweepEnd){
        const sp = ease((p - antEnd) / (sweepEnd - antEnd));
        phaseX = _antX * (1 - sp) + _tgtX * sp;
        phaseY = _antY * (1 - sp) + _tgtY * sp;
        phaseZ = _tgtZ * sp;
        phasePitch = _tgtPitch * sp;
        phasePushZ = _pushTgt * sp;
      } else if(p < holdEnd){
        phaseX = _tgtX;
        phaseY = _tgtY;
        phaseZ = _tgtZ;
        phasePitch = _tgtPitch;
        phasePushZ = _pushTgt;
      } else {
        const tp = ease((p - holdEnd) / (1 - holdEnd));
        phaseX = _tgtX * (1 - tp);
        phaseY = _tgtY * (1 - tp);
        phaseZ = _tgtZ * (1 - tp);
        phasePitch = _tgtPitch * (1 - tp);
        phasePushZ = _pushTgt * (1 - tp);
      }
      swingPosX = phaseX;
      swingPosY = phaseY;
      swingPosZ = phasePushZ;
      swingX    = phasePitch;
      swingZ    = phaseZ;
      swingY    = 0;
      if(swingT===0){
        // v66.1 — Safety net: if the swing ended without ever crossing
        // impactPoint (e.g. impactPoint mis-set high in the debug panel, or a
        // 1-frame swing), fire the pending strike now so the click is never
        // silently dropped.
        if(_pendingStrike && !_pendingStrike.fired){
          const _ps = _pendingStrike;
          _pendingStrike = null;
          _ps.resolveFn(_ps.isPow);
        }
        vmSword.userData.swingMax = 0;
        vmSword.userData.swingIsPower = false;
        vmSword.userData.swingVariant = 0;
      }
    }
    // Guard raise — sword sweeps up across body when blocking without shield
    const noShield=!(EQ.offhand&&EQ.offhand.shieldType==='shield');
    const guardT=blocking&&noShield?1:0;
    // Lerp guard pose: raise forward, tilt across body
    vmSword.userData.guardBlend=(vmSword.userData.guardBlend||0)+(guardT-( vmSword.userData.guardBlend||0))*Math.min(1,dt*12);
    const gb=vmSword.userData.guardBlend;
    // v62 — Power-attack charge pose. The sword lerps back over the player's
    // shoulder into a "cocked" wind-up pose. powerBlend ramps in over ~125ms
    // (dt*8 lerp rate), holds at 1 while armed, lerps back to 0 on release.
    // Mutually exclusive with guard in practice since block cancels charge —
    // but if both ever co-exist, the additive layering means guard dominates
    // (its rotation deltas are larger). Sword pulls up-and-back: position
    // rises and shifts right toward the shoulder, rotation pitches up so the
    // blade angles back over the player's head.
    // v62.6 — Gates on powerArmed (threshold crossed), NOT powerCharging
    // (mousedown). Tap-and-release clicks leave the sword in its idle/walk
    // pose; the cock animation only begins once the player has committed by
    // holding past POWER_CHARGE_THRESHOLD.
    // v62.8 — Also holds the cocked pose during the windup delay between
    // release and the deferred swing fire (powerSwingDelayT > 0). Visually:
    // player commits → sword stays cocked back → lunge carries them forward
    // → swing tween fires at the end of the lunge. Without this, the sword
    // would snap back to idle on release before the deferred swing started,
    // and the player would see "cocked → idle → swing" instead of the
    // intended "cocked → cocked-during-lunge → swing".
    const chargeT = (powerArmed || powerSwingDelayT > 0) ? 1 : 0;
    vmSword.userData.powerBlend = (vmSword.userData.powerBlend||0) + (chargeT-(vmSword.userData.powerBlend||0))*Math.min(1,dt*8);
    const pb = vmSword.userData.powerBlend;
    // v65.2 — Per-weapon-class base pose. 1H weapons keep the canonical right-hand
    // grip (.28, -.28, -.55) with slight forward tip. 2H weapons (claymore, great
    // axe, war hammer, great club) are held two-handed: centered horizontally,
    // tilted across the body to read as "both hands gripping." Bows already had
    // their own viewmodel-internal grip; their base pose stays the 1H default
    // because the bow shape geometry is centered on the riser (the right hand
    // grip is at world origin in the viewmodel local space, not offset like
    // a sword's hilt).
    //
    // The pose is read off EQ.weapon each frame so it switches instantly on
    // equip. No per-frame allocations — six fields read from a stamped object.
    const _w2h = !!(EQ.weapon && EQ.weapon.twoHand && EQ.weapon.weaponShape !== 'bow');
    const _basePX = _w2h ? .14 : .28;     // less to the right (more centered for 2H)
    const _basePY = _w2h ? -.30 : -.28;   // slightly lower (haft drops between hands)
    const _basePZ = _w2h ? -.58 : -.55;   // marginally closer to camera
    const _baseRX = _w2h ? .05 : .10;     // less forward pitch (the weapon stands up)
    const _baseRY = _w2h ? -.42 : -.15;   // BIG inward yaw — weapon angles across screen
    const _baseRZ = _w2h ? -.20 : -.08;   // more left-tilt (haft visible at lower-right)
    // v65.3 — Absolute guard pose target, not additive deltas. The v65.2
    // version layered guard deltas on top of the base pose, which produced
    // a vertical-blade-pointing-skyward look because the base pose's forward
    // tip and right offset were still active. The correct approach is to
    // LERP THE FULL POSE between base and guard targets using gb as the
    // blend coefficient. When gb=0 we're at base; when gb=1 we're exactly
    // at the guard target. No accumulated drift, no surprise compositions.
    //
    // Guard pose target (Skyrim-style horizontal-across-body):
    //   - Position: hilt at lower-right, blade extending across to upper-left.
    //   - Rotation X: ~0, blade lies horizontal (no forward pitch).
    //   - Rotation Y: ~PI/2 (1.57), blade rotated 90° to point LEFT instead
    //     of forward — this is the key change. The weapon's long axis is
    //     now parallel to the screen X axis.
    //   - Rotation Z: ~0, blade stays parallel to ground (no upward tilt).
    //
    // 2H weapons get a slight variant — both hands grip a long haft, weapon
    // sits a bit lower and more horizontally. Bow: softer variant because
    // the bow viewmodel's "blade" axis is already vertical (the bow is
    // upright at rest), so blocking with it should still look like holding
    // the bow up to deflect, not flat-across-body.
    const _isBow = !!(EQ.weapon && EQ.weapon.weaponShape === 'bow');
    // Guard pose ABSOLUTE targets — read from ANIM_PARAMS.block so the debug
    // panel can tune them live. v65.7.
    const _BP = ANIM_PARAMS.block;
    const _gTgtPX = _w2h ? _BP.posX_2h : (_isBow ? _BP.posX_bow : _BP.posX_1h);
    const _gTgtPY = _w2h ? _BP.posY_2h : (_isBow ? _BP.posY_bow : _BP.posY_1h);
    const _gTgtPZ = _w2h ? _BP.posZ_2h : (_isBow ? _BP.posZ_bow : _BP.posZ_1h);
    const _gTgtRX = _w2h ? _BP.rotX_2h : (_isBow ? _BP.rotX_bow : _BP.rotX_1h);
    const _gTgtRY = _w2h ? _BP.rotY_2h : (_isBow ? _BP.rotY_bow : _BP.rotY_1h);
    const _gTgtRZ = _w2h ? _BP.rotZ_2h : (_isBow ? _BP.rotZ_bow : _BP.rotZ_1h);
    // Lerp position between base pose and guard target via gb.
    // walkSway/bob/jumpY still apply (idle motion never freezes), and the
    // swing tween's swingPosX/Y add on top so a swing-during-guard reads as
    // "swing breaks the guard" rather than being absorbed. Power pose
    // deltas (pb*) also additive so charge can override during the
    // mutually-exclusive cancel-block-on-power-start contract.
    const _basePX_eff = _basePX*(1-gb) + _gTgtPX*gb;
    const _basePY_eff = _basePY*(1-gb) + _gTgtPY*gb;
    const _basePZ_eff = _basePZ*(1-gb) + _gTgtPZ*gb;
    const _baseRX_eff = _baseRX*(1-gb) + _gTgtRX*gb;
    const _baseRY_eff = _baseRY*(1-gb) + _gTgtRY*gb;
    const _baseRZ_eff = _baseRZ*(1-gb) + _gTgtRZ*gb;
    const gx = _basePX_eff + walkSway + swingPosX + pb*.10;
    const gy = _basePY_eff + totalBob + jumpDisp*.04 + swingPosY + pb*.32;
    const gz = _basePZ_eff + swingPosZ + pb*.18; // v65.8: swingPosZ pushes weapon away during swings
    vmSword.position.set(gx,gy,gz);
    vmSword.rotation.set(
      _baseRX_eff + swingX + pb*-.85,
      _baseRY_eff + swingY + pb*-.25,
      _baseRZ_eff + swingZ + pb*-.35
    );
    // S396 — the fists keep their own poses: the jab, the guard and the power punch's draw
    if(vmSword.userData.fists)vmFistPose(gb,pb,walkSway,totalBob+jumpDisp*.04);
    // Animate enchant sparks (orbitPhase children)
    if(EQ.weapon&&EQ.weapon.enchant){
      vmSword.children.forEach(c=>{
        if(c.userData.orbitPhase!==undefined){
          const ph=c.userData.orbitPhase+swT*2.2;
          const baseY=0.12+Math.floor(vmSword.children.indexOf(c)/3)*0.12;
          c.position.set(Math.cos(ph)*.055,baseY+Math.sin(swT*1.4)*.015,Math.sin(ph)*.055);
        }
      });
    }
    // Casting animation — applied ON TOP of the base sword pose.
    // Two curves:
    //   projectile: sword rises + tip thrusts forward at ~60% progress, then retracts
    //   self:       sword raises vertically overhead (tip pointed up), peaks at ~60%, lowers
    //   fizzle:     brief flutter, orb barely blooms
    if(castT>0){
      castT=Math.max(0, castT-dt);
      const p = 1 - (castT / CAST_ANIM_DURATION); // 0→1 progress
      const arc = Math.sin(p*Math.PI);            // 0→1→0 curve, peaks at 50%
      let castDx=0, castDy=0, castDz=0, castRx=0, castRy=0, castRz=0;
      if(castAnimType==='projectile'){
        // Ease-out thrust: sword drives forward, tip pitches down to "aim"
        const thrust = arc;                        // 0→1→0
        const extend = p<0.6 ? p/0.6 : 1 - (p-0.6)/0.4 * 0.6;
        castDx = -extend*0.06;                     // shift slightly toward center
        castDy = extend*0.08;                      // rise a bit
        castDz = -thrust*0.12;                     // push forward
        castRx = -thrust*1.1;                      // pitch the blade forward (tip down-and-out)
        castRy = thrust*0.12;
        castRz = thrust*0.22;                      // small roll for drama
      } else if(castAnimType==='self'){
        // Raise overhead. Blade tip points straight up at the peak.
        const rise = arc;
        castDx = -rise*0.12;                       // shift toward center
        castDy = rise*0.32;                        // high rise
        castDz = rise*0.08;                        // slightly forward for visibility
        castRx = -rise*1.6;                        // pitch WAY back so tip points up
        castRy = rise*0.25;
        castRz = -rise*0.3;                        // roll so blade faces forward
      } else if(castAnimType==='fizzle'){
        const flutter = Math.sin(p*Math.PI*2)*0.4 * (1-p);
        castDy = flutter*0.05;
        castRx = flutter*0.4;
        castRz = flutter*0.3;
      }
      // Add to the base pose computed above
      vmSword.position.x += castDx;
      vmSword.position.y += castDy;
      vmSword.position.z += castDz;
      vmSword.rotation.x += castRx;
      vmSword.rotation.y += castRy;
      vmSword.rotation.z += castRz;

      // Orb at the blade tip: charges from 0→0.6 progress, fades from 0.6→1.0
      const chargeP = Math.min(1, p/0.6);
      const releaseP = p>0.6 ? (p-0.6)/0.4 : 0;
      const orbOpacity = p<0.6 ? chargeP*0.95 : (1-releaseP)*0.95;
      const fizzMult = castAnimType==='fizzle' ? 0.3 : 1;
      const orb = vmSword.userData.castOrb;
      const halo = vmSword.userData.castOrbHalo;
      const lightTip = vmSword.userData.castOrbLight;
      if(orb){
        orb.material.opacity = orbOpacity * fizzMult;
        const pulse = 1 + 0.15*Math.sin(p*30);
        orb.scale.setScalar(0.5 + chargeP*0.9*pulse);
      }
      if(halo){
        halo.material.opacity = orbOpacity * fizzMult * 0.55;
      }
      if(lightTip){
        lightTip.intensity = (p<0.6 ? chargeP*1.8 : (1-releaseP)*1.8) * fizzMult;
      }
      // Animation done — zero out the orb so the base pose returns clean
      if(castT<=0){
        if(orb) orb.material.opacity=0;
        if(halo) halo.material.opacity=0;
        if(lightTip) lightTip.intensity=0;
      }
    }
  } else if(swingT>0){
    // v80 S382 — no view model (an empty hand: buildViewmodel draws nothing for fists), so nothing above counts the
    // swing down or fires its strike; a punch froze at its start and never landed (issue #81). Same clock, same impact point.
    if(!_bareSwingMax)_bareSwingMax=swingT;
    swingT=Math.max(0,swingT-dt);
    const _bp=1-(swingT/_bareSwingMax);
    if(_pendingStrike && !_pendingStrike.fired && (_bp>=ANIM_PARAMS.swing.impactPoint || swingT===0)){
      _pendingStrike.fired=true;
      const _ps=_pendingStrike;
      _pendingStrike=null;
      _ps.resolveFn(_ps.isPow);
    }
    if(swingT===0)_bareSwingMax=0;
  }
  if(isInterior()&&typeof WORLD!=='undefined')WORLD.tickInterior(dt,now); // v80 S12
  if(typeof WORLD!=='undefined')WORLD.tickRealClock(); // v80 S242 — the Reader's clock runs in every zone, or an hour underground reads as an hour away
  if(lid==='overworld'){
    // v80 — streamed world: chunk streaming + atmosphere. Runs before the zone chain.
    if(activeZoneId==='world'&&typeof WORLD!=='undefined')WORLD.tick(dt,now);
    else if(typeof WORLD!=='undefined'&&scene&&scene.userData&&scene.userData.chimneys)WORLD.smokeLegacy(dt,scene); /* S354 — a legacy village's chimney smoke */
    if(typeof WORLD!=='undefined'&&WORLD.wxAudio)WORLD.wxAudio(dt); // v80 S145 — the weather's sound follows you indoors and underground
    // Tick active zone systems
    if(activeZoneId==='overworld'){
      // v61c6 — tickZoneBalls scene must match the scene the orbs were
      // ADDED to. Boss-fired Caor orbs in burned Ashenmoor are added to
      // owBurnedScene; the orb cleanup `sc.remove(fb)` runs against the
      // sc passed in here. Pre-v61c6 this was hardcoded to owScene — so
      // boss orbs in the burned village were spliced out of ZB but
      // visually persisted in owBurnedScene forever. Now we resolve the
      // active overworld scene once and use it for both ticks.
      const _owActiveScene = (worldState.ashenmoorBurned && owBurnedScene) ? owBurnedScene : owScene;
      tickNPCs(dt,now);tickHerbs(dt,now);tickZoneBalls(dt,_owActiveScene);
      // v61ae: smoke animation only runs when the player is in burned Ashenmoor.
      // The tick short-circuits internally if the smoke arrays are empty, so
      // this gate is belt-and-suspenders.
      if(worldState.ashenmoorBurned) tickBurnedSmoke(now);
      // v61d1 — Faolchú death-burst particle tick. Cheap when idle (early-
      // out on empty array) so the unconditional call is fine — bursts are
      // one-shot per boss death, typically 0 or 1 active. Lives on every
      // overworld tick so a burst started in burned Ashenmoor continues to
      // resolve even if the player walks out mid-burst (the scene reference
      // captured on spawn keeps it tied to the right scene graph).
      if(typeof tickFaolchuDeathBursts==='function') tickFaolchuDeathBursts(dt);
      // v61c2 — Tick zone enemies for the overworld too. Previously only
      // forest / bealach_south called this because the village zones had
      // empty ZE arrays. Now burned Ashenmoor can host the Faolchú (and
      // any future scripted zone-enemy spawns), so the tick must fire.
      // ZE.forEach is a no-op when ZE is empty, so the cost is negligible
      // for non-burned overworld where no enemies are present.
      // v61c6 — reuse the _owActiveScene resolved above (was duplicating
      // the same conditional twice).
      tickZoneEnemies(dt,now,_owActiveScene);
      // v61c2 — Boss healthbar HUD tick. Reads the active boss from ZE
      // and updates the top-of-screen bar. Cheap; runs every frame.
      if(typeof tickBossHud==='function') tickBossHud();
    }
    else if(activeZoneId==='forest'){tickZoneEnemies(dt,now,forestScene);tickZoneBalls(dt,forestScene);tickHerbs(dt,now);}
    else if(activeZoneId==='ironhaven'){tickNPCsFor(IRONHAVEN_NPCS,dt,now,IH_SIZE);tickZoneBalls(dt,ironhavenScene);tickHerbs(dt,now);}
    // v61: plains + inn-village
    else if(activeZoneId==='bealach_south'){tickZoneEnemies(dt,now,bealachSouthScene);tickZoneBalls(dt,bealachSouthScene);tickHerbs(dt,now);}
    else if(activeZoneId==='hearthwick'){tickNPCsFor(HEARTHWICK_NPCS,dt,now,HEARTHWICK_SIZE);tickZoneBalls(dt,hearthwickScene);tickHerbs(dt,now);}
    // v61f9: generic tick dispatch for placeholder wilderness zones (any
    // zone registered via registerPlaceholderZone that isn't in the
    // hand-built branches above). Before this, bandits at Greywatch
    // (bealach_north_approach) spawned correctly but never ticked —
    // their mesh.position.y was never updated from 0, so they appeared
    // clipped into the ground and never chased the player. Same bug
    // would have hit any other placeholder wilderness zone with enemy
    // spawns (e.g., the bealach_central fort prototype). The scene ref
    // comes from ZONES[id].scene populated by every wilderness builder.
    else if(ZONES[activeZoneId] && ZONES[activeZoneId].scene){
      const _wScene = ZONES[activeZoneId].scene;
      tickZoneEnemies(dt, now, _wScene);
      tickZoneBalls(dt, _wScene);
      tickHerbs(dt, now);
      if(activeZoneId==='world'){if(typeof tickFaolchuDeathBursts==='function')tickFaolchuDeathBursts(dt);if(typeof tickBossHud==='function')tickBossHud();} // S270 — the Faolchú fights in the world's Ashenmoor too
    }

    // Zone-corpse glow pulse — only corpses in the current zone; emptied corpses stop glowing.
    // No despawn timer: corpses persist until the player returns later (or never, if they never revisit).
    // v61aj: both `gl` and `spark` are guarded — Bram's body has `spark:null`
    // (no loot-particle, since it's a named body) and the tick was throwing a
    // null-deref on `.position.y`. That exception killed the whole forEach,
    // which stopped interact-prompt updates, compass refresh, footstep SFX,
    // and everything else downstream in the tick. Defensive null checks are
    // worth a small cost; a thrown exception is catastrophic.
    ZONE_CORPSES.forEach(c=>{
      if(c.zone !== activeZoneId) return;
      if(c.items && c.items.length > 0){
        if(c.gl) c.gl.intensity = 0.8 + Math.sin(now*.004 + c.x) * .4;
        if(c.spark){
          c.spark.position.y = (c.y||0) + 0.55 + Math.sin(now*.003 + c.z) * .06;
          c.spark.visible = true;
        }
      } else {
        if(c.gl) c.gl.intensity = 0;
        if(c.spark) c.spark.visible = false;
      }
    });

    // Interaction prompts
    const activeGates=ZONES[activeZoneId]?ZONES[activeZoneId].gates:ASHENMOOR_GATES;
    const nearGate=activeGates.find(g=>Math.hypot(px-g.x,pz-g.z)<1.8);
    const nearPortal=PORTALS.find(p=>Math.hypot(px-p.x,pz-p.z)<2.0);
    // v61al: gate destroyed Ashenmoor houses out of the prompt — they can't
    // be entered (see the E-key guard in the interact handler). Without this
    // the player walks up to a pile of rubble and sees "Press E to enter
    // Bram's Forge." Damaged-but-standing buildings (Edna, oratory) keep
    // their prompt because they're still enterable quest targets.
    const nearHouseRaw=activeZoneId==='overworld'?HOUSES.find(h=>Math.hypot(px-h.doorX,pz-h.doorZ)<1.5)
                   :activeZoneId==='hearthwick'?HEARTHWICK_HOUSES.find(h=>Math.hypot(px-h.doorX,pz-h.doorZ)<1.5)
                   :activeZoneId==='ironhaven'?IRONHAVEN_HOUSES.find(h=>Math.hypot(px-h.doorX,pz-h.doorZ)<1.5)
                   // v61e1: generic per-zone houses lookup mirrors the interact handler.
                   :((ZONES[activeZoneId]&&ZONES[activeZoneId].houses)||[]).find(h=>Math.hypot(px-h.doorX,pz-h.doorZ)<1.5)||null;
    const nearHouse = (nearHouseRaw && activeZoneId==='overworld' && _houseDestroyed(nearHouseRaw)) ? null : nearHouseRaw;
    const activeNPCs=(ZONES[activeZoneId]&&ZONES[activeZoneId].npcs)||[];
    const nearNPC=activeNPCs.some(n=>!n._retreated && Math.hypot(px-n.g.position.x,pz-n.g.position.z)<3.2 && aimAt(n,3.6)); // v80 — aimed, not near
    const nearHerbPrompt=activeHerbs().find(h=>!h.harvested&&Math.hypot(px-h.x,pz-h.z)<1.1);
    // v61b: notice boards zone-scoped (each entry carries a `zone` tag).
    const nearBoard=(typeof isSettlementZone==='function' && isSettlementZone(activeZoneId))
      ? OW_NOTICE_BOARDS.find(b=>b.zone===activeZoneId&&Math.hypot(px-b.x,pz-b.z)<1.4) : null;
    const nearZCorpse=ZONE_CORPSES.find(c=>c.zone===activeZoneId&&c.items&&c.items.length>0&&lookingAt(c)); // v80 — look-at
    // v61al: Bram's body gets its own interact prompt — "investigate" on first
    // read (flavor text beat, advances Q7 obj 1), "loot" on subsequent visits
    // (once items remain but the flavor text has already landed). Without
    // this, the generic "loot" prompt misled the player into expecting the
    // loot panel and getting the investigate branch instead.
    const nearBramBodyPrompt=ZONE_CORPSES.find(c=>c.zone===activeZoneId&&c.bramBody&&Math.hypot(px-c.x,pz-c.z)<1.3);
    const iprOW=document.getElementById('ipr');
    if(nearPortal){const ds=nearPortal.diffScale||DIFF_SCALE.normal;iprOW.innerHTML=`Press 'E' to enter <b>${nearPortal.name}</b> &nbsp;<span style="color:${ds.col};font-size:10px">[${ds.label} · ${nearPortal.theme} · ${nearPortal.size}]</span>`;iprOW.style.opacity='1';iprOW.style.display='block';}
    else if(nearGate){
      // v61d7: tide-guarded gates show a different prompt when blocked.
      // v61d9: commission-guarded gates likewise.
      // Mirrors the v61d6 Caldric-safehouse pattern — visible obstacle that
      // explains itself instead of a silent no-op.
      if(nearGate.guard==='tide' && !isTideOut()){
        iprOW.textContent='The ferry to '+nearGate.label+' is held by the tide.';
      } else if(nearGate.guard==='commission' && !worldState.commissioned){
        iprOW.textContent=_commissionPrompt(nearGate.targetZone, nearGate.label);
      } else {
        iprOW.textContent=`Press 'E' to travel to ${nearGate.label}`;
      }
      iprOW.style.opacity='1';iprOW.style.display='block';
    }
    else if(nearHouse){
      // v61d6 — Locked-state prompt for the Caldric Safehouse pre-grant.
      // Same gate as the entry handler. Reads as "this is a real door, but
      // it isn't your door yet" rather than a silent no-op.
      if(nearHouse.id==='ih7' && !worldState.safehouseGranted){
        iprOW.textContent='Locked. Lord Caldric has the key.';
      } else if(activeZoneId==='world'&&typeof WORLD!=='undefined'&&WORLD.doorLockNow(nearHouse)&&!WORLD.doorPicked(nearHouse)){
        const lk=WORLD.doorLockNow(nearHouse);iprOW.textContent=lk.kind==='home'?`${nearHouse.name} — locked for the night · E to pick the lock`:`${nearHouse.name} — locked till ${lk.opens} · E to pick the lock`; // S155
      } else {
        iprOW.textContent=`Press 'E' to enter ${nearHouse.name}`;
      }
      iprOW.style.opacity='1';iprOW.style.display='block';
    }
    else if(nearHerbPrompt){iprOW.textContent=`Press 'E' to harvest ${nearHerbPrompt.def.name}`;iprOW.style.opacity='1';iprOW.style.display='block';}
    else if(nearBramBodyPrompt){
      // v61al: prompt changes based on whether the body has been read yet.
      // First-read branch advances the quest and shows the flavor text.
      if(!worldState.bramBodyRead){
        iprOW.textContent="Press 'E' to see to Bram";
      } else if(nearBramBodyPrompt.items && nearBramBodyPrompt.items.length>0){
        iprOW.textContent=`Press 'E' to loot ${nearBramBodyPrompt.name}`;
      } else {
        iprOW.textContent=`Press 'E' — Bram`;
      }
      iprOW.style.opacity='1';iprOW.style.display='block';
    }
    else if(nearZCorpse){iprOW.textContent=`Press 'E' to loot ${nearZCorpse.name}`;iprOW.style.opacity='1';iprOW.style.display='block';}
    else if(activeZoneId==='salthaven' && Math.hypot(px-24, pz-62)<1.5){
      // v61em: Salthaven Sea-Folk Shrine — examine prompt. Lore-canonical
      // sailors'-luck offering point. Hardcoded position (24,62) matches
      // the shrine mesh placed in salthaven's detailFn (west-harbor flip).
      iprOW.textContent="Press 'E' to examine the shrine";iprOW.style.opacity='1';iprOW.style.display='block';
    }
    else if(activeZoneId==='inis_rua' && Math.hypot(px-28, pz-53)<2.0){
      // v61ey: Inis Rua — the Mouth (Béal an Domhain). Sea-cave dungeon
      // entrance at the south cliff face. Examine prompt fires when the
      // player stands in front of the arch.
      iprOW.textContent="Press 'E' to examine the Mouth";iprOW.style.opacity='1';iprOW.style.display='block';
    }
    else if(activeZoneId==='droichead' && Math.hypot(px-44, pz-30)<2.0){
      // v61ez: Droichead — the Bridge keystones. Examine prompt fires
      // when the player stands at the bridge midpoint.
      iprOW.textContent="Press 'E' to examine the keystones";iprOW.style.opacity='1';iprOW.style.display='block';
    }
    // v61f7-v61f8: Greywatch examines (gate pillar + broken stair) lived
    // here. Removed v61f9 — see interact() comment block above for the
    // rationale. The fort_door portal handles its own E-prompt.
    else if(nearBoard){iprOW.textContent=`Press 'E' to read ${nearBoard.title}`;iprOW.style.opacity='1';iprOW.style.display='block';}
    else if(activeZoneId==='world'&&typeof WORLD!=='undefined'&&WORLD.shipPrompt()){iprOW.textContent=WORLD.shipPrompt();iprOW.style.opacity='1';iprOW.style.display='block';} // v80 C
    else if(nearNPC){const _nm=(typeof WORLD!=='undefined'&&activeZoneId==='world')?WORLD.nearNpcName():null;iprOW.textContent=_nm?`${_nm} — Press 'E' to talk`:"Press 'E' to talk";iprOW.style.opacity='1';iprOW.style.display='block';}
    else{iprOW.style.opacity='0';setTimeout(()=>{if(iprOW.style.opacity==='0')iprOW.style.display='none';},260);}
  }
  else if(lid&&isInterior()){
    // Interior NPC — amble + animation
    if(intNPCMesh){
      const am=intNPCMesh.userData.amble;
      if(am&&!am.paused){
        intAmbleStep(intNPCMesh,dt); // S365 — the step lives in intAmbleStep so a test can walk the keeper
      } else if(am&&am.paused){
        // Priest: gentle rotation sway only, stays at altar
        intNPCMesh.rotation.y=0+Math.sin(swT*.4)*.08;
      }
      // Subtle unified breath bob — same scale as exterior NPCs
      intNPCMesh.position.y=Math.sin(swT*1.4)*.006;
      const armSwing=am&&!am.paused?Math.sin(swT*3.2)*.28:Math.sin(swT*1.2)*.08;
      // Arms are children index 3 and 4 in buildNPCMesh (after body=0,head=1,eyes=2)
      if(intNPCMesh.children[3])intNPCMesh.children[3].rotation.x= armSwing;
      if(intNPCMesh.children[4])intNPCMesh.children[4].rotation.x=-armSwing;
    }
    const nearKeeper=intNPCMesh && Math.hypot(px-intNPCPos.x,pz-intNPCPos.z)<3.2 && Math.abs(jumpY)<1.2 && aimAt({g:intNPCMesh},3.6); // v80 — aimed
    // v61d4 — added safehouse:8 to room-depth lookup so the exit threshold
    // resolves correctly indoors. Same fix applies in the interact handler.
    const _rd=(currentHouse&&(currentHouse._roomD||{weapon:10,armor:10,potion:9,misc:9,inn:11,church:16,castle:22,safehouse:8}[currentHouse.type||'misc']))||9,_rw=(currentHouse&&currentHouse._roomW)||10;
    const nearExit=pz>_rd-1.6&&Math.abs(px-_rw/2)<1.6&&jumpY<.6; // v80 S13 — at the door, on the ground floor
    // v61d4 — Stash + bed proximity prompts. Both check the live globals
    // set by buildInterior's safehouse branch; null in any other interior.
    const nearStash=intStashPos && Math.hypot(px-intStashPos.x,pz-intStashPos.z)<1.4;
    const _nbd=INT_BEDS.length?INT_BEDS.find(b=>Math.hypot(px-b.x,pz-b.z)<1.6&&Math.abs(jumpY-(b.y||0))<.9):null;const nearBed=_nbd?!!(typeof WORLD!=='undefined'&&WORLD.bedPrompt(_nbd)):(intBedPos && Math.hypot(px-intBedPos.x,pz-intBedPos.z)<1.4); // v80 — any usable bed
    const iprInt=document.getElementById('ipr');
    const _dpr=(typeof WORLD!=='undefined'&&WORLD.intDoorPrompt)?WORLD.intDoorPrompt():null; // v80 S143
    if(nearExit){iprInt.textContent="Press 'E' to leave";iprInt.style.opacity='1';iprInt.style.display='block';}
    else if(_dpr){iprInt.textContent=_dpr;iprInt.style.opacity='1';iprInt.style.display='block';}
    else if(nearStash){iprInt.textContent="Press 'E' to access stash";iprInt.style.opacity='1';iprInt.style.display='block';}
    else if(nearBed){iprInt.textContent=(_nbd&&typeof WORLD!=='undefined'&&WORLD.bedPrompt(_nbd))||"Press 'E' to rest";iprInt.style.opacity='1';iprInt.style.display='block';} // v80 S141 — the bed says whose it is
    else if(nearKeeper){iprInt.textContent=(currentHouse&&currentHouse.keeper?currentHouse.keeper+" — ":"")+"Press 'E' to talk";iprInt.style.opacity='1';iprInt.style.display='block';}
    else{iprInt.style.opacity='0';setTimeout(()=>{if(iprInt.style.opacity==='0')iprInt.style.display='none';},260);}
  }
  else{
    KEYS.forEach(k=>{if(k.collected||k.floor!==currentFloor)return;k.obj.rotation.y+=dt*2.2;k.obj.position.y=.5+Math.sin(swT*1.9)*.08;if(Math.hypot(px-k.x,pz-k.z)<.8){k.collected=true;bagAdd({name:k.keyName,ico:'🗝',type:'misc',qty:1});dScene.remove(k.obj);dScene.remove(k.gl);addLog('🗝','Found the '+k.keyName);showMsg('Found the '+k.keyName+'!','#ffd700');}});
    for(let i=BALLS.length-1;i>=0;i--){const fb=BALLS[i];
      // v64.2 — Arrow motion path (gravity, sub-stepped collision, stuck states).
      // Routed before the generic spell motion. See tickZoneBalls for the
      // matching shape; logic is identical except dungeon scene cleanup.
      if(fb.userData.isArrow){
        const arrowState = tickArrowMotion(fb, dt, /*isOW=*/false);
        if(arrowState === 'expired'){
          if(fb.parent) fb.parent.remove(fb);
          BALLS.splice(i,1);
          continue;
        }
        if(arrowState === 'stuck-geom' || arrowState === 'stuck-enemy'){
          continue;
        }
        // 'flying' — fall through to the arrow-vs-enemy block below. The
        // generic spell motion section is gated by an else branch so arrows
        // skip the spell tick path entirely.
      } else {
      fb.userData.life-=dt;fb.position.x+=fb.userData.vx*dt;fb.position.y+=(fb.userData.vy||0)*dt;fb.position.z+=fb.userData.vz*dt;if(fb.userData._halo){fb.userData._halo.rotation.z+=dt*6;fb.userData._halo.rotation.y=Math.sin(performance.now()*0.004)*0.25;}
      // End-of-flight: life expired OR hit geometry. Caor Mastery detonates on wall or floor impact — solid contact of any kind.
      // Life expiry does NOT detonate — out-of-energy embers fizzle silently.
      {
        const hitWall=dSolid(fb.position.x,fb.position.z);
        const groundY=currentFloor===2?FLOOR2_Y:0;
        const hitGround=fb.position.y<=groundY;
        if(fb.userData.life<=0||hitWall||hitGround){
          if((hitWall||hitGround) && fb.userData.spell && fb.userData.spell.id==='caor' && fb.userData.tier===3){
            const blastY = hitGround ? groundY+0.1 : fb.position.y;
            triggerCaorBlast(dScene, fb.position.x, blastY, fb.position.z, fb.userData.spell, fb.userData.tier, false);
          }
          dScene.remove(fb);BALLS.splice(i,1);continue;
        }
      }
      } // end of v64.2 non-arrow branch
      // Enemy orbs — checked independently, hit player not enemies
      if(fb.userData.isEnemyOrb){
        if(Math.hypot(fb.position.x-px,fb.position.z-pz)<0.65&&!rollUntouchable(performance.now()/1000)){ // S283 — and through a bolt
          const dmg=fb.userData.dmg||10;
          const def2=_armour();
          // v61c7 — Magic block check now applies in dungeons too.
          // Pre-v61c7 the Phantom/Wraith bolt path skipped blocking
          // entirely — right-click did NOTHING against magic in dungeons
          // even though it worked against melee. Now mirrors the boss
          // Caor fireball path: 40% reduction with shield, 15% bare,
          // stamina cost scaled by Resolve.
          const sh = EQ.offhand;
          const hasShield = sh && sh.shieldType==='shield';
          const _resolveMult = Math.max(0.5, 1 - (ATTRS.resolve||0)*0.05);
          let finalDmg;
          if(blocking){
            const magicReduction = _blockBoost(hasShield ? (sh.magicBlock||0.40) : 0.15);
            const reducedRaw = Math.round(dmg * (1-magicReduction) * _magicResist());
            finalDmg = _warded(Math.max(1, reducedRaw - Math.floor(def2*.3)));
            const absorbed = dmg - Math.round(dmg * (1-magicReduction));
            const magicBlockStamCost = Math.max(1, Math.round(absorbed * _resolveMult));
            stamina = Math.max(0, stamina - magicBlockStamCost);
            if(stamina===0){ staminaCD = 2; lvAct.staminaDepleted++; }
            sndBlock(); blockFlashT = 0.4; blockFlashCol = '#cc44ff';
            showMsg('🛡 Resisted! Magic bolt hits for '+finalDmg+' (reduced)','#cc88ff');
          } else {
            finalDmg = _warded(Math.max(1, Math.round(dmg * _magicResist()) - Math.floor(def2*.3)));
            showMsg('Magic bolt hits you for '+finalDmg+'!','#cc44ff');
            sndPlayerHurt();
          }
          PHP=Math.max(0,PHP-finalDmg);hurtT=.4;
          lvAct.damageTaken+=finalDmg;
          lastHitT=performance.now()/1000;
          if(PHP<=0&&!dead)playerDead();
          dScene.remove(fb);BALLS.splice(i,1);
        }
        continue;
      }
      // v64 — Arrow vs dungeon enemy. Dungeon-side mirror of the tickZoneBalls
      // arrow branch. Uses ENEMIES (not ZE), checks e.floor + e.disguised
      // (mimics in chest-pose ignore arrows just like they ignore melee).
      // Hit applies wType-resolved physical damage and triggers normal-melee
      // posture drain. Single-target, despawns on contact.
      if(fb.userData.isArrow){
        let arrowHit = false;
        ENEMIES.forEach(e=>{
          if(arrowHit || e.dead || e.floor!==currentFloor || e.disguised) return;
          if(Math.hypot(fb.position.x-e.x, fb.position.z-e.z) < ARROW_HIT_RADIUS){
            arrowHit = true;
            const wt = fb.userData.wType || 'pierce';
            const resistMult = (e.resist && typeof e.resist[wt]==='number') ? e.resist[wt] : 1.0;
            let dmg = Math.max(1, Math.floor(fb.userData.arrowDmg * resistMult * _fortuneCrit()));
            if(typeof e.def === 'number') dmg = Math.max(1, dmg - Math.floor(e.def * 0.5));
            // Dormant Gargoyle bonus (matches melee path: dormant enemies take 2×).
            if(e.dormant) dmg = Math.floor(dmg * 2);
            e.hp = Math.max(0, e.hp - dmg);
            if(e.hpFg){ e.hpFg.scale.x = e.hp/e.maxHp; e.hpFg.position.x = (e.hp/e.maxHp-1)*.275; }
            e.alert = true;
            sndHitEnemy((typeof wType!=='undefined'?wType:(typeof wt!=='undefined'?wt:undefined)),((typeof physResistMult!=='undefined'&&physResistMult<.8)||(typeof resistMult!=='undefined'&&resistMult<.8)));
            // Posture drain (normal melee tier)
            if(e.hp>0 && typeof e.posture==='number' && !isStaggered(e)){
              const broke = applyPostureDamage(e, POSTURE_DRAIN_NORMAL, performance.now()/1000);
              if(broke){
                staggered.push({e, t: POSTURE_BREAK_STUN});
                const body = enemyBodyMesh(e);
                const m = body && body.material;
                if(m && m.emissive){ m.emissive.setHex(0xffaa00); setTimeout(()=>{ if(m && m.emissive) m.emissive.setHex(0); }, 220); }
                showMsg(`💥 ${e.name} staggered!`, '#ffcc66');
              }
            }
            const tagInfo = {dmg, resistMult, wType:wt, crit:false, backstab:false, defPierced:false};
            if(e.hp<=0){
              killE(e, ` (ARROW)${dmgTag(tagInfo, e)}`);
              dScene.remove(fb); BALLS.splice(i,1);
            } else {
              showMsg(`🏹 Arrow hits ${e.name} for ${dmg}!${dmgTag(tagInfo, e)}`, '#c8a878');
              // v64.2 — Stick arrow into enemy body (parent to body mesh).
              // Arrow stays in BALLS so stuckLife ticks down via
              // tickArrowMotion. On enemy death, the body mesh despawn
              // will pull the arrow with it (despawn-with-corpse).
              const body = enemyBodyMesh(e);
              _stickArrowToEnemy(fb, body, dScene);
            }
          }
        });
        if(arrowHit) continue;
        // Arrow missed — let it keep flying.
        continue;
      }
      // Player spells — hit enemies
      // Caor Mastery intercept: blast on first enemy contact, skip single-target damage path.
      if(fb.userData.spell && fb.userData.spell.id==='caor' && fb.userData.tier===3){
        let contact=false;
        for(const e of ENEMIES){
          if(e.dead||e.floor!==currentFloor||e.disguised)continue;
          if(Math.hypot(fb.position.x-e.x,fb.position.z-e.z)<.6){contact=true;break;}
        }
        if(contact){
          triggerCaorBlast(dScene, fb.position.x, fb.position.y, fb.position.z, fb.userData.spell, fb.userData.tier, false);
          dScene.remove(fb);BALLS.splice(i,1);continue;
        }
      }
      ENEMIES.forEach(e=>{if(e.dead||e.floor!==currentFloor||e.disguised)return;if(Math.hypot(fb.position.x-e.x,fb.position.z-e.z)<.6){const sp=fb.userData.spell||SPELLS[0];const tier=fb.userData.tier||1;const info=applySpellDamage(e, sp, tier);const dmg=info.dmg;e.hp=Math.max(0,e.hp-dmg);e.hpFg.scale.x=e.hp/e.maxHp;e.hpFg.position.x=(e.hp/e.maxHp-1)*.275;e.alert=true;
        // Sioc — freeze on hit. Mastery (Still-Winter's Touch) stacks the duration on repeat hits up to a 4.5s ceiling;
        // lower tiers just refresh to 1.5s. Also fixes a pre-v35 leak where every hit pushed a new entry (only the first was read).
        if(sp.id==='sioc'){
          const existing=staggered.find(s=>s.e===e);
          if(existing){
            if(tier===3){ existing.t=Math.min(4.5, existing.t+1.5); showMsg(`❄️ Still-Winter's Touch deepens (${existing.t.toFixed(1)}s)`,'#aaddff'); }
            else existing.t=Math.max(existing.t, 1.5);
          } else {
            staggered.push({e,t:1.5});
          }
        }
        // Solas-Gheal — Morning's-First-Word (Mastery): heals caster on kill. Fires BEFORE killE so the message ordering reads naturally.
        if(e.hp<=0 && sp.id==='solas_gheal' && tier===3){
          const healAmt=Math.round(effMaxHP()*0.15);
          PHP=Math.min(effMaxHP(), PHP+healAmt);
          showMsg(`✨ Morning's-First-Word — +${healAmt} HP`,'#aaffaa');
        }
        if(e.hp<=0)killE(e,dmgTag(info,e));else showMsg(sp.ico+' '+spellDisplayName(sp,tier)+' hits '+e.name+' for '+dmg+'!'+dmgTag(info,e),'#88ccff');dScene.remove(fb);BALLS.splice(i,1);}});}
    ENEMIES.forEach(e=>{if(e.dead||e.floor!==currentFloor)return;const dist=Math.hypot(px-e.x,pz-e.z);
      // S222 — a slime quivers, faster as it creeps; a fire elemental's flames flicker and its core eases back to its glow
      if(e.limbs&&e.limbs.slime&&e.limbs.body){const q=Math.sin(swT*(e.alert?7:3)+(e.ph||0))*.05;e.limbs.body.scale.set(1+q,1-q*1.4,1+q);}
      if(e.limbs&&e.limbs.flames){const L=e.limbs.flames;for(let i=0;i<L.length;i++){const m=L[i],f=1+.18*Math.sin(swT*9+i*1.7+(e.ph||0))+.08*Math.sin(swT*23+i);m.scale.set(m.userData.s0.x,m.userData.s0.y*f,m.userData.s0.z);}
        const cm=e.limbs.body&&e.limbs.body.material;if(cm&&cm.emissive&&e.limbs.coreEm&&!(e._wind>0))cm.emissive.lerp(e.limbs.coreEm,Math.min(1,dt*4));}
      // v61gj — Defensive lazy init for pre-ship saves + posture regen tick.
      // Runs regardless of alert state so an enemy posture-broken then kited
      // out of detection range still recovers cleanly while off-screen.
      if(typeof e.posture!=='number') initPosture(e);
      tickPostureRegen(e, dt, now);
      // v63 — Directional detection. canSeePlayer combines distance,
      // sneak/buff modulation, vision cone, and hearing radius. LOS still
      // checked separately (existing dungeon behavior) since it uses dSolid.
      if(!e.alert && canSeePlayer(e, dist, 3.5)){
        // Quick LOS: cast ~8 steps between enemy and player, check for walls
        let los=true;
        for(let t=0.15;t<0.9;t+=0.15){
          const tx=e.x+(px-e.x)*t,tz=e.z+(pz-e.z)*t;
          if(dSolid(tx,tz)){los=false;break;}
        }
        if(los)e.alert=true;
      }
      // Stay alert while within a larger radius — only forget player when far away
      if(e.alert&&dist>14)e.alert=false;
      // Vanish buff — enemies lose the player
      if(_hasBuff('vanish')&&e.alert){e.alert=false;e.hasCried=false;}
      // v63 — Unaware patrol behavior. Dungeon enemies previously stood
      // motionless when unaware; now they wander/scan around their spawn point.
      // Two patterns chosen randomly at spawn (e.patrolType):
      //   'wander' — slow circle near homeX/homeZ (~2u radius), like zone enemies
      //   'scan'   — stand still, slowly rotate combatYaw to sweep the area
      // Dormant enemies (Gargoyle statues) skip patrol — they're statues
      // until activated by the dormant block below. Slimes also skip; they
      // hover/jiggle but don't need a patrol path.
      if(!e.alert){
        if(e.dormant){
          // Statue pose — keep mesh at home position, no rotation, no movement.
          e.mesh.position.set(e.x, e.baseY, e.z);
          e.el.position.set(e.x, .8, e.z);
          return;
        }
        // Slimes have no clear "front" and just bob in place visually; mimics
        // stay static whether disguised (chest pose) or revealed (lurking). Both
        // skip patrol but still update mesh position so terrain following works.
        const _patrolFam = enemyPostureFamily(e);
        if(_patrolFam === 'slime' || _patrolFam === 'mimic'){
          e.mesh.position.set(e.x, e.baseY, e.z);
          e.el.position.set(e.x, .8, e.z);
          return;
        }
        // Resolve patrol type (defensive — older saves may lack the field).
        const _patrolType = e.patrolType || 'scan';
        if(_patrolType === 'wander'){
          // Slow circular wander near home. Mirrors zone enemy wander logic
          // but uses dSolid for dungeon collision. Speed is e.spd*.3 — same
          // ratio as the zone code so wander feels consistent across biomes.
          e.walkT = (e.walkT || 0) + dt * 0.5;
          const wx = e.homeX + Math.sin(e.walkT * 0.4 + (e.patrolPhase||0)) * 2.0;
          const wz = e.homeZ + Math.cos(e.walkT * 0.4 + (e.patrolPhase||0)) * 2.0;
          const dx2 = wx - e.x, dz2 = wz - e.z;
          const wd = Math.hypot(dx2, dz2) || 1;
          const step = e.spd * 0.3 * dt;
          const [nx, nz] = dSlide(e.x, e.z, dx2/wd*step, dz2/wd*step);
          e.x = nx; e.z = nz;
          // Face the direction of motion — gives the patrol a real "front".
          if(wd > 0.1){
            e.combatYaw = Math.atan2(dx2/wd, dz2/wd);
          }
        } else {
          // 'scan' — stand still, slowly rotate combatYaw. Sweep ~0.4 rad/sec
          // gives a full 360° turn in ~16s with sine variation. The patrolPhase
          // offset ensures multiple scanners aren't all facing the same way.
          e.scanT = (e.scanT || 0) + dt;
          e.combatYaw = (e.patrolPhase || 0) + Math.sin(e.scanT * 0.4) * Math.PI;
        }
        // Apply mesh transform — wraiths hover, others sit at baseY.
        const _hoverY = e.isWraith ? Math.sin(swT * 1.4 + e.ph) * 0.12 : 0;
        e.mesh.position.set(e.x, e.baseY + _hoverY, e.z);
        e.mesh.rotation.y = e.combatYaw;
        e.el.position.set(e.x, .8, e.z);
        return;
      }
      // First-alert cry
      if(!e.hasCried){e.hasCried=true;sndEnemyCry(e.name);}
      e.atkCd-=dt;e.pathT-=dt;
      // Stagger check
      const stag=staggered.find(s=>s.e===e);if(stag){stag.t-=dt;if(stag.t<=0){staggered=staggered.filter(s=>s.e!==e);reraiseGuard(e);}else{e.mesh.position.set(e.x,e.baseY,e.z);e.mesh.lookAt(px,e.mesh.position.y,pz);e.el.position.set(e.x,.8,e.z);return;}}
      // Dormant state (Gargoyle) — statue-frozen until player comes close. No movement, no attack, no orbit.
      // Activation happens when player within 4u: flash + cry + clears dormant flag.
      if(e.dormant){
        if(dist < 4.0){
          e.dormant = false;
          e.alert = true;
          e.hasCried = true; sndEnemyCry(e.baseType||'Gargoyle');
          showMsg(`A ${e.name} awakens!`, '#cc8844');
          // Restore normal aura + brief flash. Flash decays back to 0.7 over 500ms.
          e.el.intensity = 2.5;
          const flashStart = performance.now();
          const flashTick = () => {
            if(e.dead) return;
            const ft = (performance.now() - flashStart) / 500;
            if(ft >= 1){ e.el.intensity = 0.7; return; }
            e.el.intensity = 2.5 - (2.5 - 0.7) * ft;
            requestAnimationFrame(flashTick);
          };
          requestAnimationFrame(flashTick);
        } else {
          // Keep mesh in dormant pose — still looks at nothing
          e.mesh.position.set(e.x, e.baseY, e.z);
          e.el.position.set(e.x, .8, e.z);
          return;
        }
      }
      // Disguised (Mimic) — looks like a chest. Pre-v61d5 the reveal AND
      // burst hit fired automatically when the player walked within 1.0u,
      // making the Mimic a proximity landmine: a free 30-50dmg hit on first
      // encounter with no opportunity to block. Now the disguise persists
      // until the player INTERACTS — same E-press they'd use on a real
      // chest. Reveal+telegraph fires from revealMimic() (called from the
      // dungeon interact handler), giving the player a block window before
      // the burst lands. The chest-prompt-detection in iprEl picks up
      // disguised mimics via a parallel ENEMIES.find at the prompt site
      // so the affordance reads identically to a real chest.
      if(e.disguised){
        // Still disguised — chest sits motionless. No proximity reveal.
        e.mesh.position.set(e.x, e.baseY, e.z);
        e.el.position.set(e.x, .8, e.z);
        return;
      }
      // Flee state (Kobold Thief) — at low HP, back away from player for a few seconds then rejoin the fight.
      // fleeT > 0 means currently fleeing. Entered when canFlee and hp < 30% and not already triggered.
      if(e.canFlee && !e._fleeTriggered && e.hp < e.maxHp * 0.3){
        e._fleeTriggered = true;
        e.fleeT = 3.0;
        showMsg(`${e.name} breaks away!`, '#ddcc44');
      }
      if(e.fleeT > 0){
        e.fleeT -= dt;
        // Run away from player
        const dx = e.x - px, dz = e.z - pz, dd = Math.hypot(dx, dz) || 1;
        const step = e.spd * 1.1 * dt; // slightly faster when panicked
        const [nx, nz] = dSlide(e.x, e.z, (dx/dd) * step, (dz/dd) * step);
        e.x = nx; e.z = nz;
        e.mesh.position.set(e.x, e.baseY, e.z);
        e.mesh.lookAt(px, e.baseY, pz); // still faces player while backing away
        e.el.position.set(e.x, .8, e.z);
        // Limb walk while fleeing
        if(e.limbs && !e.isWraith){
          e.walkT += dt * e.spd * 10;
          const swing = Math.sin(e.walkT) * .6;
          if(e.limbs.legL) e.limbs.legL.rotation.x = swing;
          if(e.limbs.legR) e.limbs.legR.rotation.x = -swing;
          if(e.limbs.armL) e.limbs.armL.rotation.x = -swing * 0.8;
          if(e.limbs.armR) e.limbs.armR.rotation.x = swing * 0.8;
        }
        return;
      }
      // Ranged enemies hold at distance 3-5; melee enemies always close
      const wantsToChase=!e.ranged||(dist>4.5);
      if(wantsToChase){if(e.pathT<=0){e.path=bfs(e.x,e.z,px,pz);e.pathT=1.2;}if(e.path&&e.path.length){const[tc,tr]=e.path[0],dx=tc-e.x,dz2=tr-e.z,d=Math.hypot(dx,dz2);if(d<.1)e.path.shift();else{const step=e.spd*dt;const[nx,nz]=dSlide(e.x,e.z,dx/d*step,dz2/d*step);e.x=nx;e.z=nz;}}}
      // Attack lunge animation
      let lungeFwd=0;
      if(e.atkAnim>0){e.atkAnim=Math.max(0,e.atkAnim-dt);const p=e.atkAnim/.35;lungeFwd=Math.sin(p*Math.PI)*.28;}
      const hoverY=e.isWraith?Math.sin(swT*1.4+e.ph)*.12:0;
      const _wb=(e._wind||0)*.2,_wd=Math.hypot(px-e.x,pz-e.z)||1,_wx=(px-e.x)/_wd,_wz=(pz-e.z)/_wd;
      e.mesh.position.set(e.x+e.atkDir.x*lungeFwd-_wx*_wb,e.baseY+hoverY,e.z+e.atkDir.z*lungeFwd-_wz*_wb);
      e.mesh.lookAt(px,e.mesh.position.y,pz);e.el.position.set(e.x,.8,e.z);try{attackPose(e,true);}catch(err){}
      // v63 — Live-update combatYaw only when NOT mid-attack (see zone tick).
      if(e.telegraphT <= 0 && e.atkCd <= 0){
        e.combatYaw = Math.atan2(px - e.x, pz - e.z);
      }
      // Limb walk animation — only for humanoid/brute when alert and moving
      if(e.limbs&&!e.isWraith){
        const moving=e.path&&e.path.length>0;
        e.walkT+=(moving?dt*e.spd*8:dt*.5); // idle sway when still
        const swing=moving?Math.sin(e.walkT)*.55:Math.sin(e.walkT)*.04;
        const armSwing=moving?Math.sin(e.walkT)*.45:Math.sin(e.walkT)*.03;
        if(e.limbs.legL)e.limbs.legL.rotation.x= swing;
        if(e.limbs.legR)e.limbs.legR.rotation.x=-swing;
        if(e.limbs.armL)e.limbs.armL.rotation.x=-armSwing;
        if(e.limbs.armR)e.limbs.armR.rotation.x= armSwing;
      }
      // Melee life-drain — Phantom and Wraith heal themselves when player is too close.
      // Deterrent to free meleeing them, especially at low levels where HP is scarce.
      // Tick every 1.0s while player within 1.6u; drains a portion of the enemy's normal damage and heals for 50% of that.
      // Gated specifically to Phantom/Wraith baseType — Fire Elemental is also ranged but doesn't drain.
      const isDrainer = e.baseType==='Phantom' || e.baseType==='Wraith';
      if(isDrainer && e.alert && dist < 1.6 && !e.disguised && !e.dormant){
        e.drainCd = (e.drainCd || 0) - dt;
        if(e.drainCd <= 0){
          e.drainCd = 1.0;
          const isWraithType = e.baseType==='Wraith';
          const baseDrain = isWraithType ? 6 : 4;
          const rawDrain = Math.max(1, Math.round((baseDrain + level * 0.5) * (e.dmgMult || 1.0)));
          const def2 = _armour();
          const finalDrain = _warded(Math.max(1, rawDrain - Math.floor(def2 * 0.3)));
          PHP = Math.max(0, PHP - finalDrain);
          hurtT = 0.25;
          // Heal for 50% of damage dealt (rounded up so it's never zero)
          const healAmt = Math.max(1, Math.ceil(finalDrain * 0.5));
          e.hp = Math.min(e.maxHp, e.hp + healAmt);
          e.hpFg.scale.x = e.hp/e.maxHp;
          e.hpFg.position.x = (e.hp/e.maxHp - 1)*.275;
          spawnDrainFX(dScene, px, pz, e.x, e.z);
          sndDrain();
          showMsg(`${e.name} drains ${finalDrain} HP (heals ${healAmt})`, '#aa44cc');
          lvAct.damageTaken += finalDrain;
          lastHitT = performance.now()/1000;
          if(PHP <= 0 && !dead) playerDead();
        }
      }
      // Ranged attack — Phantoms and Wraiths fire magic orbs
      if(e.ranged&&e.alert){
        e.rangedCd-=dt;
        if(dist>2.5&&dist<12&&e.rangedCd<=0){
          e.rangedCd=2.5+Math.random()*1.0;
          // Fire orb toward player
          const dx2=px-e.x,dz3=pz-e.z,dd=Math.hypot(dx2,dz3)||1;
          const orbType=e.baseType==='Wraith'?'enemy_wraith':'enemy_phantom';
          const orbGlow=e.baseType==='Wraith'?0xdd0088:0x6666ff;
          const tmpl=SPELL_ORB_TEMPLATES[orbType];
          const orb=tmpl?tmpl.clone():new THREE.Group();
          orb.add(new THREE.PointLight(orbGlow,1.8,5));
          // v61d5 — Floor-aware spawn Y. Pre-v61d5 the orb spawned at y=0.8
          // unconditionally — correct for floor 1 (ground Y = 0) but well
          // below floor-2 ground (ground Y = FLOOR2_Y), so floor-2 orbs
          // spawned beneath the floor mesh and rendered invisibly. Same
          // pattern that v61c8 fixed for the boss-corpse loot indicator.
          // The +0.8 offset puts the orb at chest-height for both floors.
          const orbGroundY = e.floor===2 ? FLOOR2_Y : 0;
          orb.position.set(e.x, orbGroundY+0.8, e.z);
          orb.userData={vx:(dx2/dd)*5,vy:0,vz:(dz3/dd)*5,life:4,isEnemyOrb:true,dmg:8+Math.floor(Math.random()*7)+Math.floor(level*1.5)};
          dScene.add(orb);BALLS.push(orb);sndEnemyOrb();
        }
      }
      // Pre-attack telegraph — winds up for telegraphDuration(e), pulses emissive red,
      // then calls executeDungeonStrike. If in range and off cooldown, a fresh telegraph starts.
      if(e.telegraphT>0){
        e.telegraphT -= dt;
        const p = 1 - Math.max(0, e.telegraphT) / (e.telegraphMax||0.35);
        telegraphPulse(e, p);
        if(e.telegraphT<=0){
          e.telegraphT = 0;
          telegraphReset(e);
          executeDungeonStrike(e, now);
        }
      } else if(dist<.9&&e.atkCd<=0&&!e.ranged){
        e.telegraphMax = telegraphDuration(e);
        e.telegraphT = e.telegraphMax;
        // v63 — Stamp combatYaw at windup start (see zone tick for rationale).
        e.combatYaw = Math.atan2(px - e.x, pz - e.z);
        sndTelegraph();
      }});
    CHESTS.forEach(ch=>{if(ch.floor===currentFloor&&lookingAt(ch)&&(!ch.opened||ch.items.length>0)){ch._near=true;}else{ch._near=false;}}); // v80 — look-at
    // Sigil glow — brightens with proximity + slow breathing pulse
    // Also compute the closest sigil proximity in [0..1] for the ambient hum gain.
    let maxSigilProx=0;
    SIGILS.forEach(s=>{
      const ud=s.mesh.userData;
      if(!ud._glow)return;
      const d=Math.hypot(px-s.x,pz-s.z);
      const prox=Math.max(0, 1 - d/6);
      if(prox>maxSigilProx)maxSigilProx=prox;
      const breathe=0.82 + 0.18*Math.sin(performance.now()*0.0028 + s.x);
      // Main glow (range 5) + inner glow (range 1.8) both scale
      ud._glow.intensity = (ud._baseIntensity + prox*2.4) * breathe;
      if(ud._glow2)ud._glow2.intensity = (0.8 + prox*1.8) * breathe;
      // Backing plane pulses opacity — makes the carving look "lit from within"
      if(ud._backGlow)ud._backGlow.material.opacity = (0.22 + prox*0.35) * breathe;
    });
    // Drive the ambient hum based on closest-sigil proximity
    if(typeof updateSigilHum==='function')updateSigilHum(maxSigilProx);
    const nearSigilPrompt=SIGILS.find(s=>s.floor===currentFloor&&Math.hypot(px-s.x,pz-s.z)<1.5);
    // interact prompt
    const nearCorpsePrompt=CORPSES.find(c=>c.items&&c.items.length>0&&lookingAt(c)); // v80 — look-at
    const nearChest=CHESTS.find(ch=>ch._near&&ch.floor===currentFloor);
    // v61d5 — Disguised mimic shows the same prompt as a real chest. The
    // bait IS the prompt — players who learn to recognize chests as safe
    // affordances now have to live with the fact that some of them aren't.
    // Detected separately from nearChest so the prompt fallthrough can
    // give it a unique label only if we ever want one (currently doesn't —
    // a tell would defeat the bait). Same 1.1u radius as the chest find.
    const nearMimic=ENEMIES.find(en=>!en.dead&&en.disguised&&en.floor===currentFloor&&Math.hypot(px-en.x,pz-en.z)<1.1);
    const nearBarrelPrompt=BARRELS.find(b=>b.floor===currentFloor&&lookingAt(b,2.6)&&(!b.opened||b.items.length>0)); // v80 — look-at
    const nearEntrance=currentFloor===1&&Math.hypot(px-dEntranceX,pz-dEntranceZ)<1.4;
    const nearStair=dStairC!==null&&Math.hypot(px-dStairC,pz-dStairR)<1.3;
    const nearDoorObj2=DOORS.find(d=>d.floor===currentFloor&&Math.hypot(px-d.x,pz-d.z)<1.4);
    const iprEl=document.getElementById('ipr');
    if(nearEntrance){iprEl.textContent="Press 'E' to leave dungeon";iprEl.style.opacity='1';iprEl.style.display='block';}
    else if(nearStair){
      const stairLabel=DUNGEON_STAIRWELL?'':currentFloor===1&&dMap2?"Press 'E' to descend to Floor 2":"Press 'E' to ascend to Floor 1"; // v80 S8 — physical stairs need no prompt
      if(stairLabel){iprEl.textContent=stairLabel;iprEl.style.opacity='1';iprEl.style.display='block';}
    }
    else if(nearSigilPrompt){
      const sp2=SPELLS.find(s=>s.id===nearSigilPrompt.spellId);
      iprEl.textContent=`Press 'E' — Touch the sigil of ${sp2?sp2.nameIr:'?'}`;
      iprEl.style.opacity='1';iprEl.style.display='block';
    }
    else if(nearCorpsePrompt){iprEl.textContent=`Press 'E' to loot ${nearCorpsePrompt.name}`;iprEl.style.opacity='1';iprEl.style.display='block';}
    else if(nearChest){iprEl.textContent=nearChest.locked?(nearChest.treasure?"Press 'E' to pick the treasure chest's lock":"Press 'E' to pick the chest's lock"):nearChest.treasure?(nearChest.opened?"Press 'E' — treasure chest":"Press 'E' to open treasure"):(nearChest.opened?"Press 'E' — chest":"Press 'E' to open chest");iprEl.style.opacity='1';iprEl.style.display='block';}
    else if(nearMimic){ // S150 — a mimic wears the same lock a chest there would
      iprEl.textContent=chestLockedAt(nearMimic.x,nearMimic.z,nearMimic.floor)?"Press 'E' to pick the chest's lock":"Press 'E' to open chest";iprEl.style.opacity='1';iprEl.style.display='block';}
    else if(nearBarrelPrompt){iprEl.textContent="Press 'E' to open "+(nearBarrelPrompt.displayName||'Barrel').toLowerCase();iprEl.style.opacity='1';iprEl.style.display='block';}
    else if(nearDoorObj2){
      // v61g6: distinct prompt by lock state and open state.
      let promptText;
      if(nearDoorObj2.locked){
        if(nearDoorObj2.open){promptText=null;} // open locked door — no prompt needed
        else {
          const hk=BAG.some(b=>b.name===nearDoorObj2.keyName);
          promptText=hk?"Press 'E' to unlock door":"Locked — find the "+nearDoorObj2.keyName;
        }
      } else {
        promptText=nearDoorObj2.open?"Press 'E' to close door":"Press 'E' to open door";
      }
      if(promptText){iprEl.textContent=promptText;iprEl.style.opacity='1';iprEl.style.display='block';}
      else{iprEl.style.opacity='0';setTimeout(()=>{if(iprEl.style.opacity==='0')iprEl.style.display='none';},260);}
    }
    else{iprEl.style.opacity='0';setTimeout(()=>{if(iprEl.style.opacity==='0')iprEl.style.display='none';},260);}
    TORCHES.forEach(({l,fl,ph})=>{
      const flicker=Math.sin(now*.003+ph)*.5+Math.sin(now*.007+ph)*.2+Math.sin(now*.019+ph)*.1;
      l.intensity=1.6+flicker*.55;
      if(fl&&fl.isMesh){
        // Ember color flickers orange→yellow
        fl.material.color.setHex(Math.random()>.55?0xff8822:0xffaa33);
      }
    });
    // Corpse loot glow pulse + despawn after 60s. Glow auto-dims when items are all taken.
    CORPSES.forEach(c=>{
      c.age+=dt;
      if(!c.looted){
        if(c.items && c.items.length>0){
          c.gl.intensity=0.8+Math.sin(now*.004+c.x)*.4;
          const cFloorY=c.floorY||0;
          c.spark.position.y=cFloorY+0.5+Math.sin(now*.003+c.z)*.06;
          c.spark.visible=true;
        } else {
          // Fully emptied — hide effects
          c.gl.intensity=0;
          c.spark.visible=false;
        }
        if(c.age>60){c.looted=true;c.gl.intensity=0;c.spark.visible=false;}
      }
    });
    atmT+=dt;if(atmT>20){atmT=0;if(Math.random()>.5)showMsg(['Bones crunch underfoot...','You sense eyes watching.','A distant growl echoes.','Something moves in the dark.'][Math.floor(Math.random()*4)],'#706050');}
  }
    // Block vignette flash
    if(blockFlashT>0){
      blockFlashT=Math.max(0,blockFlashT-dt);
      const a=(blockFlashT/.55*.6).toFixed(2);
      document.getElementById('df').style.boxShadow=`inset 0 0 60px ${blockFlashCol}${blockFlashCol==='#ffd700'?Math.round(a*255).toString(16).padStart(2,'0'):'88'}`;
    }
    // Shield viewmodel animation — raise when blocking, rest at lower-left otherwise
    if(vmShield){
      const sh=EQ.offhand;const hasShield=sh&&sh.shieldType==='shield';
      const targetX=blocking&&hasShield?-.18:-.28;
      const targetY=blocking&&hasShield?-.18:-.32;
      const targetRY=blocking&&hasShield?-.2:-.5;
      vmShield.position.x+=(targetX-vmShield.position.x)*Math.min(1,dt*14);
      vmShield.position.y+=(targetY-vmShield.position.y)*Math.min(1,dt*14);
      vmShield.rotation.y+=(targetRY-vmShield.rotation.y)*Math.min(1,dt*14);
      // v61gj-a4 — Ease position.z and rotation.z back to BASE POSE (not zero).
      // The pre-a4 fix lerped these to zero, which was wrong: the shield's
      // canonical pose has position.z=-0.55 (held forward) and rotation.z=0.08
      // (slight roll), set in buildShieldViewmodel. Lerping to zero would have
      // slowly walked the shield into a flat-against-the-camera pose over time.
      // Now both axes return to their base-pose values. Rate bumped from dt*14
      // to dt*30 so recovery from any accumulated drift (e.g. a save from the
      // a2 build with the original accumulation bug) snaps back in ~100ms
      // rather than dragging for several seconds. The recoil fade itself is
      // independent of this lerp rate (uses its own shieldImpactT timer), so
      // the kick still feels punchy — only the return-to-rest gets snappier.
      const _shBaseZ = -0.55;
      const _shBaseRotZ = 0.08;
      vmShield.position.z+=(_shBaseZ-vmShield.position.z)*Math.min(1,dt*30);
      vmShield.rotation.z+=(_shBaseRotZ-vmShield.rotation.z)*Math.min(1,dt*30);
      if(!blocking){
        const idleBob  = Math.sin(swT*1.8+Math.PI)*.004;                          // counter-phase to sword
        const walkBob  = moving ? Math.sin(swT*(sprinting?9:6)+Math.PI)*(sprinting?.022:.014) : 0;
        vmShield.position.y += idleBob + walkBob;
      } else if(hasShield){
        vmShield.position.y += Math.sin(swT*1.8)*.003;                            // gentle hold-breath when blocking
      }
      // v61gj-a2 — Shield impact recoil. shieldImpact() sets these on parry/block;
      // decay each frame and add to the position/rotation that the easing above
      // resolved to. Linear-out feel (fade = remaining/max), which gives a sharp
      // initial kick that softens as it settles — more visceral than ease-out.
      if(shieldImpactT > 0){
        shieldImpactT = Math.max(0, shieldImpactT - dt);
        const fade = shieldImpactMax > 0 ? (shieldImpactT / shieldImpactMax) : 0;
        vmShield.position.x += shieldImpactX * fade;
        vmShield.position.z += shieldImpactZ * fade;
        vmShield.rotation.z += shieldImpactRot * fade;
      }
    }
    // v61gj-a2 — Sword impact recoil (bare-hand block fallback). Same shape as
    // shield decay above. Sword always recoils backward regardless of parry vs
    // block — bare-hand "parry" mechanically rewards timing (zero damage, stagger)
    // but the visual just sells "this hit landed on your sword arm."
    if(vmSword && swordImpactT > 0){
      swordImpactT = Math.max(0, swordImpactT - dt);
      const fade = swordImpactMax > 0 ? (swordImpactT / swordImpactMax) : 0;
      vmSword.position.x += swordImpactX * fade;
      vmSword.position.z += swordImpactZ * fade;
      vmSword.rotation.z += swordImpactRot * fade;
    }
    // Bare-hand block ghost (no shield) — slight dark vignette while blocking
    if(blocking&&!(EQ.offhand&&EQ.offhand.shieldType==='shield')&&blockFlashT<=0){
      document.getElementById('df').style.boxShadow='inset 0 0 30px rgba(80,100,180,.25)';
    }
  
  tickFootsteps(dt,moving,sprinting);
  tickMusic(dt);
  // ── Held torch light: follow player through all scenes ───────
  if(window._playerTorchLight){
    const tl=window._playerTorchLight;
    const activeScene=isOverworldZone()?scene:dScene;
    if(tl.parent!==activeScene){
      if(tl.parent)tl.parent.remove(tl);
      activeScene.add(tl);
    }
    tl.position.set(px,camY+0.15,pz);
    // Gentle flicker
    const _wt=activeZoneId==='world';tl.distance=_wt?16:11;tl.intensity=(_wt?4.6:2.6)+Math.sin(now*.004)*0.35+Math.sin(now*.013)*0.15; // v80 S133 — the open country is bigger and darker than a corridor
  }
  updateHUD();drawMM();tickQuestWaypoints();drawCompass();drawSundial();
}
if(REN)requestAnimationFrame(loop);

// ── Title screen: show Continue/Load once the save store has read its index (and moved any old localStorage slots in) ──
ssMigrate().then(()=>{document.getElementById('lgb').style.display='block';if(hasAnySave())document.getElementById('cb').style.display='block';}); // S251 — Load Game always: with no saves it holds the Import button, the way into a new browser
