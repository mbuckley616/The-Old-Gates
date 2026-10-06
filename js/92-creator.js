
// Shared UI reveal + input binding — called by all entry paths
function _enterGame(){
  document.getElementById('ov').style.display='none';
  document.getElementById('hud').style.display='block';
  document.getElementById('mm').style.display='block';
  document.getElementById('xh').style.display='block';
  document.getElementById('cbar').style.display='block';
  document.getElementById('vol-btn').style.display='block';
  document.getElementById('save-btn').style.display='block';
  document.getElementById('dp').style.display='grid';
  document.getElementById('acts').style.display='flex';
  document.getElementById('fbtn').style.display='block';
  G.setAttribute('tabindex','0');G.focus();
  G.addEventListener('keydown',e2=>{
    if(hubOpen&&e2.target&&(e2.target.tagName==='INPUT'||e2.target.tagName==='TEXTAREA')){if(e2.code==='Escape'){e2.target.blur();G.focus();}return;} // S490 — typing in the Journal's search is typing, not play
    if(e2.code==='Tab'){e2.preventDefault();if(hubOpen)closeHub();else openHub('map');return;}
    // Global TTS mute toggle — works from any context including mid-speech
    if(e2.code==='KeyM'&&!e2.repeat){
      if(!(e2.target&&(e2.target.tagName==='INPUT'||e2.target.tagName==='TEXTAREA'))){
        ttsToggleMute();return;
      }
    }
    const sigOv=document.getElementById('sigil-overlay');
    if(sigOv&&sigOv.style.display==='flex'){if(e2.code==='Escape'||e2.code==='KeyE'){e2.preventDefault();closeSigilOverlay();}return;}
    // v61af: quest update popup — Esc or E closes. Must be checked BEFORE
    // other modal handlers because a popup can appear on top of a dialog
    // (quest-complete popup fires after reward is taken, dialog still open).
    const qpop=document.getElementById('quest-popup');
    if(qpop&&qpop.style.display==='flex'){if(e2.code==='Escape'||e2.code==='KeyE'){e2.preventDefault();closeQuestUpdatePopup();}return;}
    if(document.getElementById('slmenu').style.display==='flex'){if(e2.code==='Escape')closeSLMenu();return;}
    if(lootOpen){
      // v61g7: E = take all + close (the common case — most loot is worth
      // grabbing and the click-each-item flow was a friction tax). Escape
      // remains a "close without taking" exit. The Take All button in the
      // panel does the same thing as E.
      if(e2.code==='KeyE'){e2.preventDefault();takeAllLoot();closeLoot();G.focus();return;}
      if(e2.code==='Escape'){closeLoot();G.focus();return;}
      return;
    }
    if(shopOpen){
      // v68 — quantity prompt swallows Esc/E first so the player cancels the
      // prompt without dropping out of the whole shop.
      if(_qtyCtx){ if(e2.code==='Escape'||e2.code==='KeyE'){ e2.preventDefault(); closeQtyModal(); } return; }
      if(e2.code==='KeyE'||e2.code==='Escape'){closeShop();if(lid&&isInterior()){}else G.focus();}
      return;
    }
    // v61d4 — Stash close on E or Escape, mirrors loot.
    if(stashOpen){if(e2.code==='KeyE'||e2.code==='Escape'){closeStash();G.focus();}return;}
    if(nbOpen){if(e2.code==='Escape'||e2.code==='KeyE'){e2.preventDefault();closeNoticeBoard();}return;}
    if(isBookOpen()){
      if(e2.code==='Escape'||e2.code==='KeyE'){e2.preventDefault();closeBookReader();G.focus();return;}
      if(e2.code==='ArrowRight'||e2.code==='Space'){e2.preventDefault();bookNextPage();return;}
      if(e2.code==='ArrowLeft'){e2.preventDefault();bookPrevPage();return;}
      return;
    }
    if(dlgOpen){
      if(e2.code==='Escape'){e2.preventDefault();closeDialog();return;}
      const num=parseInt(e2.key);
      // S392 — every numbered choice answers its key, 1–9 and 0 for the tenth (was 1–4 only: a harbourmaster lists ten)
      const idx=e2.key==='0'?9:num-1;
      if(!e2.repeat&&idx>=0&&idx<=9&&dlgNode&&dlgNode.choices&&idx<dlgNode.choices.length){pickDialogChoice(idx);}
      return;
    }
    if(hubOpen){
      // v61r: X toggles quick-destroy mode while the hub is open so the player
      // can bulk-delete junk without click-confirming each item. Non-blocking —
      // falls through to Escape handling below.
      if(e2.code==='KeyX'){ setQuickDestroy(true); e2.preventDefault(); }
      if(e2.code==='Escape')closeHub();
      return;
    }
    if(invOpen){if(e2.code==='KeyI'||e2.code==='Escape')closeInv();return;}
    if(luOpen)return;
    K[e2.code]=true;if(['KeyW','KeyS','KeyA','KeyD','KeyF','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e2.code))e2.preventDefault();if(e2.code==='KeyF')castSpell();if(e2.code==='KeyI')openHub('inv');if(e2.code==='KeyE'){e2.preventDefault();interact();}
    if(e2.code==='KeyQ'&&!e2.repeat)startRoll(performance.now()/1000,K); // S275 — the roll
    // S389 — R locks on as the middle button does (Michael's A on #89: a trackpad has no middle button); again, it lets go.
    if(e2.code==='KeyR'&&!e2.repeat){e2.preventDefault();toggleLock();}
    // v63 — Ctrl toggles sneak. Both ControlLeft and ControlRight handled.
    // !e2.repeat prevents key-held repeat-firing the toggle every frame.
    if((e2.code==='ControlLeft'||e2.code==='ControlRight')&&!e2.repeat){
      e2.preventDefault();
      toggleSneak();
    }});
  G.addEventListener('keyup',e2=>{
    K[e2.code]=false;
    // v61r: release X — disengage quick-destroy. Runs regardless of hub state
    // so losing focus mid-hold doesn't leave us stuck in quick-destroy.
    if(e2.code==='KeyX') setQuickDestroy(false);
  });
  G.addEventListener('mousedown',()=>{if(!invOpen)G.focus();});
  // ── POINTER LOCK SYSTEM (v62.1) ──────────────────────────────
  // Replaces v1's drag-to-look camera model. Mouse moves the camera continuously
  // while pointer is locked; LMB/RMB are pure combat inputs. Locks when in
  // combat (overworld or dungeon, no menu open, game started). Unlocks for any
  // menu, on Esc (browser default), or on visibility loss.
  //
  // Architecture: state-driven reconciliation, not call-site instrumentation.
  // A single _isMenuOpen() predicate ORs every menu/modal state; the render
  // loop calls reconcilePointerLock() each frame to release lock when a menu
  // opens and to show the resume overlay when lock is unexpectedly dropped.
  // No need to touch the ~14 individual open*/close* functions.
  //
  // Browser constraint: requestPointerLock() must follow a user gesture, so the
  // canvas listens for click and re-locks when appropriate. The "Click to
  // resume" overlay is the player-visible cue when we're in combat but unlocked.
  function _isMenuOpen(){
    // Module-level flags. luOpen is read defensively (level-up screen).
    if(invOpen||hubOpen||shopOpen||lootOpen||stashOpen||dlgOpen||nbOpen||luOpen) return true;
    if(typeof lockOpen!=='undefined'&&lockOpen) return true; // v80 S142
    if(typeof _questPopupOpen!=='undefined' && _questPopupOpen) return true;
    // DOM-flagged modals — checked via display style. Catches sigil overlay,
    // book reader, wait menu, save/load menu, character creator, title overlay.
    // Each id is gated on existence because the DOM is built lazily.
    const ids=['sigil-overlay','book-overlay','sleepui','slmenu','cc-modal','ov','quest-popup','lockpick'];
    for(const id of ids){
      const el=document.getElementById(id);
      if(el && el.style.display && el.style.display!=='none') return true;
    }
    return false;
  }
  // Build the resume overlay once. Reused for the lifetime of the page.
  let _resumeOverlay=null;
  function _ensureResumeOverlay(){
    if(_resumeOverlay) return _resumeOverlay;
    const el=document.createElement('div');
    el.id='resume-overlay';
    el.style.cssText='position:absolute;inset:0;background:rgba(8,6,4,.55);z-index:180;display:none;align-items:center;justify-content:center;cursor:pointer;border-radius:8px;color:#e8d8b8;font-family:Georgia,serif;text-align:center;user-select:none;-webkit-user-select:none';
    el.innerHTML='<div style="padding:32px;background:rgba(20,16,10,.85);border:1px solid #5a4a30;border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.5)">'+
      '<div style="font-size:22px;letter-spacing:1px;margin-bottom:10px;color:#d4b878">⏸  Paused</div>'+
      '<div style="font-size:14px;color:#b0a088">Click to resume</div>'+
      '</div>';
    const gameWin=document.getElementById('g')||document.body;
    gameWin.appendChild(el);
    // Click anywhere on the overlay re-requests pointer lock. The click event
    // itself is the user-gesture the API needs. After lock is granted, the
    // pointerlockchange listener hides the overlay.
    el.addEventListener('click',()=>{
      if(!_isMenuOpen() && started && !dead && !won){
        try{ CV.requestPointerLock(); }catch(_){}
      }
    });
    _resumeOverlay=el;
    return el;
  }
  function _showResumeOverlay(){ _ensureResumeOverlay().style.display='flex'; }
  function _hideResumeOverlay(){ if(_resumeOverlay) _resumeOverlay.style.display='none'; }
  // Reconciler — called once per render frame. Cheap (a handful of property
  // reads + style writes only when state actually changes).
  //
  // v62.4 update: the primary lock-release path is now the _releasePointerLockForMenu()
  // call at the top of every open* function (openHub, openInv, openDialog,
  // openShop, openLoot, openStash, openBookReader, openSLMenu, openNoticeBoard,
  // openWaitMenu, openLevelUp, showSigilOverlay, _renderQuestUpdatePopup).
  // Calling exitPointerLock() inside the user gesture that opens the menu is
  // the only path Chrome reliably honors — the reconciler's frame-delayed call
  // was being silently rejected as an "accidental exit" by Chrome's heuristic.
  //
  // The reconciler now serves as defense-in-depth for any future code paths
  // that open menus without going through one of those functions, plus the
  // resume-overlay logic for showing the "Click to resume" UI.
  function reconcilePointerLock(){
    if(!started) return;
    const locked=(document.pointerLockElement===CV);
    const menuOpen=_isMenuOpen();
    const inCombat=!dead && !won && !menuOpen;
    if(menuOpen && locked){
      // Defense-in-depth: a menu opened without releasing the lock first.
      // Set cursor to default and call exit (may or may not succeed — the
      // gesture-context window has likely already closed).
      document.body.style.cursor='default';
      try{ document.exitPointerLock(); }catch(_){}
      _hideResumeOverlay();
      return;
    }
    if(inCombat && !locked){
      // Should be locked but isn't — show the resume overlay. We can't auto-
      // request lock here (no user gesture); the overlay click does that.
      _showResumeOverlay();
      return;
    }
    if(locked){
      // Locked and combat — clear any lingering overlay (defensive; mostly
      // already hidden by the pointerlockchange handler).
      _hideResumeOverlay();
    }
  }
  // Browser fires this when pointer-lock state changes (gained, lost, denied).
  // We use it to hide the overlay immediately on success and to react to the
  // browser's auto-unlock on Esc / alt-tab / visibility loss.
  document.addEventListener('pointerlockchange',()=>{
    if(document.pointerLockElement===CV){
      _hideResumeOverlay();
      // Cancel any drag state left over from the legacy model — defensive,
      // since drag is no longer how we look.
      drag=false;
      // Cancel any in-progress charge / block on re-lock. Avoids weird states
      // where the player tabbed away mid-charge.
      powerCharging=false;powerCharge=0;powerArmed=false;
      blocking=false;
      lungeT=0; // v62.7 — kill any in-flight lunge on lock acquire
      powerSwingDelayT=0;powerSwingDelayPower=false; // v62.8 — drop any pending swing
      // Hide the OS cursor over the game window while locked. Pointer lock
      // already does this implicitly, but we set it explicitly so that the
      // unlock branch below can restore it without ambiguity.
      document.body.style.cursor='none';
    } else {
      // Lost lock. If we're in combat, the reconciler will show the overlay
      // on the next frame. Cancel transient combat states either way.
      powerCharging=false;powerCharge=0;powerArmed=false;
      blocking=false;
      lungeT=0; // v62.7 — kill any in-flight lunge on lock loss
      powerSwingDelayT=0;powerSwingDelayPower=false; // v62.8 — drop any pending swing
      _bowDrawing=false;_bowDrawT=0; // v64 — drop any in-progress bow draw on lock loss
      // v62.2/v62.3 — Restore the OS cursor. Chrome and other browsers
      // sometimes leave the cursor invisible after exitPointerLock() until the
      // user moves the mouse OR hits Esc (Esc forces the browser's native exit
      // path which fully resets cursor state). Setting `cursor:default` alone
      // is often a no-op because the style is already default — the BROWSER's
      // cursor cache doesn't know to repaint.
      //
      // The trick: toggle to a DIFFERENT cursor value, force a layout flush,
      // then set the final value. The intermediate change is what triggers the
      // browser's cursor-repaint code path. `crosshair` is harmless visually
      // because it's only there for one paint frame at most before being
      // overwritten back to `default`.
      document.body.style.cursor='crosshair';
      void document.body.offsetHeight;          // force reflow
      document.body.style.cursor='default';
      // Some browsers still need a mousemove to update the cursor. Dispatch a
      // synthetic one to nudge them. clientX/Y of 0 is fine — the menu DOM
      // is full-screen and any pointermove triggers the cursor refresh.
      try{
        document.body.dispatchEvent(new MouseEvent('mousemove',{
          bubbles:true, clientX:0, clientY:0
        }));
      }catch(_){}
    }
  });
  // Also flush combat state if the tab is hidden. Catches alt-tab cleanly.
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      powerCharging=false;powerCharge=0;powerArmed=false;
      blocking=false;
      lungeT=0; // v62.7 — kill any in-flight lunge on tab hide
      powerSwingDelayT=0;powerSwingDelayPower=false; // v62.8 — drop any pending swing
      _bowDrawing=false;_bowDrawT=0; // v64 — drop bow draw on tab hide
    }
  });
  let drag=false,dx0=0,dy0=0;
  CV.addEventListener('mousedown',e2=>{
    if(invOpen)return;
    // v62.1 — Pointer Lock. If we aren't locked, this click is the user
    // gesture the API needs. Acquire lock and consume the event; no combat
    // input fires on this click. The next click (now locked) routes normally.
    // Skip this branch when a menu is open: opening the canvas to a fresh
    // lock while a menu is on top would feel broken (the menu uses the cursor).
    if(document.pointerLockElement!==CV && !_isMenuOpen() && started && !dead && !won){
      try{ CV.requestPointerLock(); }catch(_){}
      return;
    }
    if(e2.button===1){e2.preventDefault();toggleLock();return;}
    if(playerStaggered(performance.now()/1000)&&(e2.button===0||e2.button===2))return; // S281 — staggered, open
    if(e2.button===2){
      // v64 — RMB while drawing a bow cancels the draw (no arrow consumed,
      // no release fired). Does NOT start a block — bow + shield are mutually
      // exclusive anyway (bows are two-handed) so the "blocking with a bow"
      // state is meaningless. Reaching this branch with _bowDrawing true and
      // a bow equipped (the only path that sets _bowDrawing) is the cancel.
      if(_bowDrawing){
        _bowDrawing=false;_bowDrawT=0;
        showMsg('Draw released.','#aaa');
        return;
      }
      blocking=true;lastBlockAttemptT=performance.now()/1000;lastBlockAttemptG=playClockS;
      // v62 — Starting a block cancels any in-progress power charge. Block
      // and power-attack are mutually exclusive states; without this, holding
      // LMB then tapping RMB would leave powerCharging true with no LMB held.
      powerCharging=false;powerCharge=0;powerArmed=false;
      return;
    }
    // v62.1 — drag tracking removed (was the legacy camera-look model).
    // LMB is now purely combat input. Begin power-attack charge on LMB-down.
    // Interior contexts and active blocking short-circuit; the attack() path
    // detects no-weapon and falls through to normal damage either way.
    //
    // v64 — Weapon-class routing. Bow equipped → start draw, NOT power-charge.
    // The two states are mutually exclusive (a bow can't power-attack; a sword
    // can't draw arrows). Bow draw also gates on having ammo: no arrows →
    // dry-click and bail (player learns instantly). Future weapon classes
    // plug new branches alongside (staff = channel, crossbow = tap-fire).
    // v71 — Bash. LMB while RMB held (blocking) → guard-bash instead of a
    // power-charge. Fires on mousedown (it's an instant action, not a hold).
    // Requires a weapon or shield equipped — an empty-handed "bash" has no
    // surface. Bows never reach here (RMB cancels a draw rather than blocking).
    // This branch sits BEFORE the normal LMB combat branch and returns, so a
    // bash never also starts a power-charge.
    if(!isInterior() && blocking){
      const _sh = EQ.offhand;
      const _canBash = (_sh && _sh.shieldType==='shield') || !!EQ.weapon;
      if(_canBash){ doBash(); }
      else { showMsg('Nothing to bash with.','#cc8844'); }
      return;
    }
    if(!isInterior()&&!blocking){
      if(_isBowEquipped()){
        if(_hasArrows()){
          _bowDrawing = true;
          _bowDrawT = 0;
          sndBowDraw();
        } else {
          // No arrows — dry click, no draw state set. Player can keep clicking
          // but nothing fires until they equip ammo.
          sndBowEmpty();
          showMsg('No arrows equipped.','#cc8844');
        }
      } else {
        powerCharging=true;powerCharge=0;powerArmed=false;
      }
    }
  });
  window.addEventListener('mouseup',e2=>{
    if(e2.button===1)return;
    if(e2.button===2){blocking=false;return;}
    // v62.1 — No drag check. LMB-up always fires attack() in combat context.
    // Pointer lock means the cursor never moved during the press from the
    // player's perspective; legitimate combat clicks no longer fail the
    // drag-distance heuristic. Touch input still uses the drag flag below.
    if(document.pointerLockElement===CV && !isInterior() && !blocking){
      // v64 — Bow release path. If a draw is in progress, fire (or fizzle) and
      // bail before the melee path runs. The melee path (power/normal) assumes
      // a melee weapon was the LMB-down originator, so we must not fall through.
      if(_bowDrawing){
        const strength = _bowDrawStrength();
        const drewLongEnough = _bowDrawT >= BOW_DRAW_MIN;
        // Always clear draw state on release.
        const _heldT = _bowDrawT;
        _bowDrawing=false;_bowDrawT=0;
        if(!drewLongEnough){
          // Released before the minimum draw — no arrow, no stamina cost
          // beyond what the drain already took. Player got a clear signal
          // (showMsg + click).
          showMsg('Draw too short — no arrow fired.','#aaa');
          return;
        }
        if(!_hasArrows()){
          // Edge case: arrows depleted mid-draw (e.g. last arrow consumed by
          // some future system between mousedown and mouseup). Dry click.
          sndBowEmpty();
          showMsg('No arrows equipped.','#cc8844');
          return;
        }
        // Pay release stamina (drain during draw was paid each frame in the
        // render tick).
        stamina = Math.max(0, stamina - _stamCost(BOW_RELEASE_STAM_COST));
        fireArrow(strength);
        return;
      }
      // v64.1 — If a bow is equipped, NEVER fall through to the melee path.
      // The mouseup with _bowDrawing===false can happen in three legitimate
      // ways with a bow: (a) the first mousedown after equipping the bow was
      // consumed by pointer-lock acquisition so we never entered draw state;
      // (b) alt-tab cleared _bowDrawing while LMB was held, the OS sends a
      // stale mouseup on return; (c) RMB-cancel already cleared _bowDrawing
      // and the user is just releasing LMB after. In all three cases, the
      // correct behavior is "do nothing" — NOT swing the bow as a sword.
      // The melee swing animation on a bow viewmodel was the v64 ship bug
      // playtest caught immediately.
      if(_isBowEquipped()){
        // No-op. Reset charge state below catches any stale powerCharging too.
        powerCharging=false;powerCharge=0;powerArmed=false;
        return;
      }
      // Resolve power vs normal at release time. powerArmed was latched when
      // the charge timer crossed POWER_CHARGE_THRESHOLD in the render tick.
      const wasArmed = powerArmed;
      if(wasArmed){
        // v62.8 — Power-attack release path. Commit cost + cooldown + lunge
        // immediately (so the player feels the commit at the release moment),
        // but DEFER the swing animation and hit detection by POWER_WINDUP_DELAY.
        // The deferred swing fires in the render-loop tick when powerSwingDelayT
        // crosses zero, calling attack(true, true) which skips the cost gates
        // and jumps straight to swing-tween + sound + hit loop. Result: lunge
        // carries the player in over 0-0.4s, swing fires at 0.3s, blade lands
        // at the swing peak ~0.575s — strike connects at the end of the rush.
        const _w = EQ.weapon;
        const _wt = (_w && _w.weight) || 2;
        const _stCost = _wt * 7 * POWER_STAM_MULT;
        const _stMin  = _wt * 5 * POWER_STAM_MULT;
        // Gate: bail if the cost can't be paid. Mirrors attack()'s setup gate.
        // Note: _w being truthy is checked indirectly via the lunge condition
        // below — power attacks without a weapon would have fallen through to
        // a normal attack in attack(), but here we explicitly gate the lunge
        // and deferred swing on EQ.weapon to match.
        if(atkCd<=0 && stamina>=_stMin && _w){
          atkCd = .5 * (1 - attrEff('swiftness')*0.01) * POWER_ATK_CD_MULT;
          stamina = Math.max(0, stamina - _stamCost(_stCost));
          powerSwingDelayT = POWER_WINDUP_DELAY;
          powerSwingDelayPower = true;
          powerFlashFadeT = 0.25;
          // Forward lunge (per v62.7) — only fires if W is held at release.
          const _wHeld = !!(K['KeyW']||K['ArrowUp']);
          if(_wHeld) lungeT = LUNGE_DURATION;
        }
      } else {
        // Normal attack — fires hit-check immediately, as before.
        attack(false);
      }
    }
    powerCharging=false;powerCharge=0;powerArmed=false;
  });
  CV.addEventListener('contextmenu',e2=>e2.preventDefault());
  // v62.1 — Mousemove drives the camera continuously whenever pointer is locked.
  // movementX/Y are already delta-based (no anchor math needed) so we just feed
  // them into yaw/pitch the same way the old drag-look did. invOpen guard kept
  // for defense — invOpen forces unlock via the reconciler, but a still-pending
  // event in the queue at the moment of unlock would otherwise leak a frame of
  // rotation. The pointerLockElement check is the real gate.
  window.addEventListener('mousemove',e2=>{
    if(document.pointerLockElement!==CV) return;
    if(invOpen) return;
    if(LOCK.t){lockFlick(e2.movementX||0,performance.now());return;}
    yaw-=e2.movementX*.004;
    pitch=Math.max(-1.45,Math.min(1.45,pitch-e2.movementY*.004));
  });
  // Touch input keeps its drag-based model — pointer lock is desktop only.
  CV.addEventListener('touchstart',e2=>{e2.preventDefault();const t=e2.touches[0];drag=true;dx0=t.clientX;dy0=t.clientY;},{passive:false});
  CV.addEventListener('touchmove',e2=>{e2.preventDefault();if(!drag)return;const t=e2.touches[0];yaw-=(t.clientX-dx0)*.004;pitch=Math.max(-1.45,Math.min(1.45,pitch-(t.clientY-dy0)*.004));dx0=t.clientX;dy0=t.clientY;},{passive:false});
  CV.addEventListener('touchend',()=>drag=false);
  [['pw','KeyW'],['ps','KeyS'],['pa','KeyA'],['pd','KeyD']].forEach(([id,code])=>{const b=document.getElementById(id);b.addEventListener('pointerdown',e2=>{e2.preventDefault();K[code]=true;});b.addEventListener('pointerup',()=>K[code]=false);b.addEventListener('pointerleave',()=>K[code]=false);});
  started=true;
  initAudio();
  updateSpellButton();
  document.getElementById('compass').style.display='block';
  // v61e7 — sundial sibling to the compass; flipped at the same moment.
  const _sd = document.getElementById('sundial');
  if(_sd) _sd.style.display='block';
  // v61e9 — wait button flipped alongside.
  const _wb = document.getElementById('wait-btn');
  if(_wb) _wb.style.display='block';
  updateQuestDots();
}

// ── Character creator (v61at, expanded v61au) ─────────────────────────
//
// Intercepts "Start New Adventure" to let the player pick name, archetype,
// starting weapon, and a refined attribute distribution before world spawn.
//
//   - openCharacterCreator()  — show modal, hide title screen
//   - renderArchetypes()      — 2×4 grid of archetype tiles + selected description
//   - renderWeaponPicker()    — 4-tile starter weapon row
//   - renderAttrAllocation()  — +/- grid with primary-attribute highlights
//   - applyArchetypePreset()  — copy archetype.attrs into the working buffer + select default weapon
//   - ccBegin()               — commit name + archetype + attrs + weapon, spawn into world
//
// v61au additions:
//   - 8 archetypes (Warrior, Sentinel, Duelist, Scout, Monk, Scholar, Diplomat, Vagrant)
//   - 8-point budget (was 6)
//   - Starting weapon picker (Sword/Club/Dagger/Staff)
//   - Per-attribute description text on the +/- grid
//   - Primary-attribute highlight (★ + gold border) on the rows the
//     player's archetype gets a +1/level bonus on
//   - Archetype description renders in a dedicated text block beneath
//     the tile grid so each tile stays compact
const _ccState={
  archetypeId:'warrior',
  attrs:{...ARCHETYPES.find(a=>a.id==='warrior').attrs},
  weaponId:'sword',
};
function _ccPointsSpent(){
  return Object.values(_ccState.attrs).reduce((a,v)=>a+v,0);
}
function _ccPointsLeft(){
  return CC_POINT_BUDGET - _ccPointsSpent();
}
function applyArchetypePreset(id){
  const a=ARCHETYPES.find(x=>x.id===id);
  if(!a)return;
  _ccState.archetypeId=id;
  try{window._ccArch=id;if(window._ccLook&&!CCL.explicit.tunic){window._ccLook.tunic=lookDefault(window._ccPeople||'gatelander',id).tunic;ccLookRows();ccLookRebuild();}}catch(e){} // v80 S127 — the tunic follows the beginning until you pick one
  // Reset all attrs to 0 then copy preset. Doing it in two steps keeps the
  // attribute set complete (every attribute key is present, even at 0)
  // which simplifies the +/- grid render.
  for(const k of Object.keys(ATTRS)) _ccState.attrs[k]=0;
  for(const k of Object.keys(a.attrs)) _ccState.attrs[k]=a.attrs[k];
  // Pick the archetype's default weapon. Player can override via the
  // weapon picker after — but switching archetype resets the weapon to
  // the new archetype's default for sane re-flow.
  _ccState.weaponId = a.defaultWeapon || 'sword';
}
function _archetypePrimaries(){
  const a=ARCHETYPES.find(x=>x.id===_ccState.archetypeId);
  return a ? new Set(a.primaries||[]) : new Set();
}
function renderArchetypes(){
  // v80 — the people step: four buttons, camouflage for three of them
  (function(){const pg=document.getElementById('cc-people-grid');if(!pg||pg.children.length)return;const PP={gatelander:['Gatelander','Fair, wiry, freckled. The home island\'s people; at ease anywhere the old tongue is spoken.'],markman:['Markman','Tall, broad, pale. The Mark\'s people; warmer welcomes in the north, colder in the Compact\'s churches.'],aurennais:['Aurennais','Olive, lean, quick. Aurenne\'s people; honoured in the ports, mistrusted where the gates are dug.'],oldblood:['Old Blood','Grey-pale, black-haired, marked at the wrists. The makers\' remnant. Nobody quite agrees what you look like.']};
    for(const k in PP){const b=document.createElement('button');b.type='button';b.textContent=PP[k][0];b.style.cssText='padding:6px 10px;background:#2a2020;color:#c8b8a0;border:1px solid #5a4a3a;border-radius:4px;cursor:pointer;font:13px Georgia,serif';b.onclick=()=>{if(typeof worldState!=='undefined')worldState.people=k;window._ccPeople=k;try{ccLookPeople(k);}catch(e){}pg.querySelectorAll('button').forEach(x=>{x.style.background='#2a2020';x.style.color='#c8b8a0';});b.style.background='#3a2a16';b.style.color='#f0e2c0';document.getElementById('cc-people-desc').textContent=PP[k][1];};pg.appendChild(b);}
    const first=pg.querySelector('button');if(first)first.click();})();
  const grid=document.getElementById('cc-arch-grid');
  if(!grid)return;
  grid.innerHTML='';
  ARCHETYPES.forEach(a=>{
    const tile=document.createElement('div');
    tile.className='cc-arch-tile'+(a.id===_ccState.archetypeId?' selected':'');
    tile.innerHTML=`
      <div class="cc-arch-icon">${a.icon}</div>
      <div class="cc-arch-name">${a.label}</div>`;
    tile.onclick=()=>{
      applyArchetypePreset(a.id);
      renderArchetypes();
      renderArchetypeDesc();
      renderWeaponPicker();
      renderAttrAllocation();
    };
    grid.appendChild(tile);
  });
}
function renderArchetypeDesc(){
  const box=document.getElementById('cc-arch-desc');
  if(!box)return;
  const a=ARCHETYPES.find(x=>x.id===_ccState.archetypeId);
  if(!a){box.textContent='';return;}
  // Show description + primaries summary (the 3 attributes the archetype
  // gets a +1 per-level bonus on). Keeps the player aware of what they're
  // picking even before they see the highlights in the +/- grid.
  const primaryLabels = (a.primaries||[]).map(k=>ATTR_DEF[k]?.label||k).join(' · ');
  box.innerHTML = `<div class="cc-arch-desc-text">${a.desc}</div>
    <div class="cc-arch-primaries">★ Primary: ${primaryLabels} <span class="cc-arch-primaries-note">(+1 per level)</span></div>`;
}
function renderWeaponPicker(){
  const grid=document.getElementById('cc-weapon-grid');
  if(!grid)return;
  grid.innerHTML='';
  Object.entries(STARTER_WEAPONS).forEach(([id,w])=>{
    const tile=document.createElement('div');
    tile.className='cc-weapon-tile'+(id===_ccState.weaponId?' selected':'');
    // v66 — two-handed weapons (bow, great club) get a small badge so the
    // player knows the offhand/shield slot will be unavailable. Bow also notes
    // it ships with arrows. atk range + wType render for every starter.
    const twoHandBadge = w.twoHand ? ` · <span class="cc-weapon-2h">2H</span>` : '';
    const atkLo=(w.atk&&w.atk[0])||0, atkHi=(w.atk&&w.atk[1])||0;
    tile.innerHTML=`
      <div class="cc-weapon-ico">${w.ico}</div>
      <div class="cc-weapon-name">${w.name.replace('Wooden ','')}</div>
      <div class="cc-weapon-stat">${atkLo}–${atkHi} · ${w.wType}${twoHandBadge}</div>
      <div class="cc-weapon-desc">${w.desc}</div>`;
    tile.onclick=()=>{
      _ccState.weaponId=id;
      renderWeaponPicker();
    };
    grid.appendChild(tile);
  });
}
function renderAttrAllocation(){
  const grid=document.getElementById('cc-attr-grid');
  if(!grid)return;
  grid.innerHTML='';
  const primaries=_archetypePrimaries();
  Object.keys(ATTRS).forEach(key=>{
    const def=ATTR_DEF[key];
    if(!def)return;
    const v=_ccState.attrs[key]||0;
    const left=_ccPointsLeft();
    const isPrimary=primaries.has(key);
    const row=document.createElement('div');
    row.className='cc-attr-row'+(isPrimary?' cc-attr-primary':'');
    row.innerHTML=`
      <span class="cc-attr-icon">${def.icon}</span>
      <div class="cc-attr-text">
        <span class="cc-attr-name">${def.label}${isPrimary?' <span class="cc-attr-star">★</span>':''}</span>
        <span class="cc-attr-desc">${def.desc||''}</span>
      </div>
      <span class="cc-attr-controls">
        <button class="cc-attr-btn cc-attr-dec" ${v<=0?'disabled':''}>−</button>
        <span class="cc-attr-val">${v}</span>
        <button class="cc-attr-btn cc-attr-inc" ${(v>=CC_ATTR_CAP||left<=0)?'disabled':''}>+</button>
      </span>`;
    row.querySelector('.cc-attr-dec').onclick=()=>{
      if((_ccState.attrs[key]||0)>0){_ccState.attrs[key]--; renderAttrAllocation();}
    };
    row.querySelector('.cc-attr-inc').onclick=()=>{
      if((_ccState.attrs[key]||0)<CC_ATTR_CAP && _ccPointsLeft()>0){_ccState.attrs[key]++; renderAttrAllocation();}
    };
    grid.appendChild(row);
  });
  const left=_ccPointsLeft();
  const badge=document.getElementById('cc-points-left');
  if(badge){
    badge.textContent=`— ${left} point${left===1?'':'s'} remaining`;
    badge.classList.toggle('warn',left<0);
  }
}
function openCharacterCreator(){
  CCL.yaw=0;CCL.touch=performance.now(); // S188 — the preview starts facing you, still
  // Reset state to a fresh Warrior load. Clears any leftover from a prior
  // creator session that the player escaped out of.
  applyArchetypePreset('warrior');
  document.getElementById('ov').style.display='none';
  const modal=document.getElementById('cc-modal');
  modal.style.display='flex';
  setTimeout(()=>{const el=document.getElementById('cc-name');if(el)el.focus();},10);
  renderArchetypes();
  renderArchetypeDesc();
  try{const pg=document.getElementById('cc-people-grid');const pb=pg&&pg.querySelector('button');window._ccLook=null;CCL.explicit={};if(pb)pb.click();else ccLookPeople('gatelander');}catch(e){} // v80 S127 — the look starts fresh with the first people
  renderWeaponPicker();
  renderAttrAllocation();
}
// v61aw / v61b3: per-archetype intro text. Four paragraphs now:
//   universal opening — sets the "wake without past" atmosphere
//   archetype middle  — one line tying the player's identity to a small
//                       physical / mental detail their character notices
//   awakening line    — universal: anchors the player physically inside
//                       the open sarcophagus, and plants the Varek meta-
//                       awareness hook (something distant, attentive,
//                       that registers the player's first breath). The
//                       villain Varek can sense the player across the
//                       world because he alone perceives the AI/human
//                       duality — this seeds that thread without
//                       spoiling. Players read it as atmosphere; on a
//                       second playthrough after the late-game reveal
//                       it lands as foreshadowing.
//   universal closing — points them toward the light at the end of the
//                       corridor
const TUTORIAL_INTROS = {
  _opening: "Stone above. Stone below. The breath in your chest is your own — that, at least, you remember.",
  _awakening: "The lid of the coffin lies aside. Your hand still rests on its edge, as if you only just pushed it free. Somewhere very far from here, something turns its attention toward you. You feel it the way you feel weather coming.",
  _closing: "There is light somewhere ahead. You move toward it.",
  warrior:  "The weight of a weapon is familiar. Your hands have known it before.",
  sentinel: "The cold against your back tells you where the wall is. You learned to listen for it long ago.",
  duelist:  "Your balance comes back before your name does. The body remembers what the mind has not yet.",
  scout:    "You marked the directions before you were upright. A habit older than language.",
  monk:     "Your breath finds its rhythm without asking. Let it lead you.",
  scholar:  "Letters cross your mind unbidden — a passage from a book you cannot quite place. They will return.",
  diplomat: "You take stock of what you have, what you do not, and what you might still be owed. A reflex.",
  vagrant:  "You've woken up in worse. You'll wake up in worse again. Stand.",
};

// v61ax: shows the black-screen intro overlay on top of an already-loaded
// dungeon scene. NOT skippable — the player accidentally clicked once and
// missed the whole sequence. The intro is short (~12s total) and only fires
// for new characters; it earns its time. Caller must enter the dungeon
// BEFORE showing the fade so dungeon music starts and the scene is rendered
// behind the overlay (Ashenmoor briefly flashing was the symptom of doing
// the fade first then teleporting). Returns a Promise that resolves after
// the overlay fades to transparent.
function showIntroFade(archetypeId){
  return new Promise(resolve=>{
    const overlay = document.getElementById('intro-overlay');
    const textBox = document.getElementById('intro-text');
    if(!overlay || !textBox){ resolve(); return; }
    const lines = [
      TUTORIAL_INTROS._opening,
      TUTORIAL_INTROS[archetypeId] || "Your hands feel like your own. That will have to be enough.",
      TUTORIAL_INTROS._awakening,
      TUTORIAL_INTROS._closing,
    ];
    textBox.innerHTML = lines.map(t=>`<div class="intro-line">${t}</div>`).join('');
    // Reset overlay state in case a prior intro left it half-faded.
    overlay.style.transition = '';
    overlay.style.opacity = '';
    overlay.style.display = 'flex';
    const lineEls = textBox.querySelectorAll('.intro-line');
    // Stagger the fade-in. Each line fades over 1.6s (CSS transition); the
    // delay between starts is 2.6s so each line has air to breathe before
    // the next begins. Total text duration: ~7.4s. After the last line is
    // fully visible, hold for 3s so the player can finish reading. Then
    // fade the whole overlay (text + black) out over 1.6s. End-to-end:
    // ~12s of intro before gameplay control returns.
    const STAGGER = 2600;
    const HOLD_AFTER_LAST = 3000;
    const FADE_OUT_MS = 1600;
    lineEls.forEach((el,i)=>{
      setTimeout(()=>el.classList.add('visible'), 300 + i*STAGGER);
    });
    const totalTextDone = 300 + (lineEls.length-1)*STAGGER + 1600; // last line fully visible
    setTimeout(()=>{
      // Fade overlay to transparent.
      overlay.style.transition = `opacity ${FADE_OUT_MS}ms ease-out`;
      overlay.style.opacity = '0';
      setTimeout(()=>{
        overlay.style.display = 'none';
        overlay.style.opacity = '';
        overlay.style.transition = '';
        resolve();
      }, FADE_OUT_MS);
    }, totalTextDone + HOLD_AFTER_LAST);
  });
}

function ccBegin(){
  try{const c=JSON.parse(localStorage.getItem('og_carry')||'null');if(c){window._ogCarry=c;localStorage.removeItem('og_carry');}}catch(e){} // v80 — the loom released: a new world, same name
  // Read name. Empty/whitespace falls back to the placeholder default.
  const nameEl=document.getElementById('cc-name');
  if(window._ogCarry&&window._ogCarry.name&&nameEl&&!nameEl.value)nameEl.value=window._ogCarry.name;
  const raw=(nameEl&&nameEl.value||'').trim();
  playerName = raw || 'Traveller';
  playerArchetype = _ccState.archetypeId;
  // Copy chosen attribute distribution into the live ATTRS.
  for(const k of Object.keys(_ccState.attrs)){
    ATTRS[k] = _ccState.attrs[k]||0;
  }
  // Equip the chosen starter weapon. Deep-clone the template so the player
  // doesn't mutate STARTER_WEAPONS by, e.g., enchanting the equipped copy.
  const wTpl = STARTER_WEAPONS[_ccState.weaponId] || STARTER_WEAPONS.sword;
  if(wTpl.buildVia){
    // v66 — bow / great club: materialize the real item from the live
    // WEAPON_TYPES def so the player's starter is identical to the shop copy
    // (correct twoHand/cleaveTargets/postureMult/blockReduce + viewmodel +
    // _isBowEquipped fields). makeItem already deep-builds a fresh object, so
    // no separate clone needed. Tier 1 = Wooden, matching Barnaby's stock.
    const _typeObj = WEAPON_TYPES.find(t=>t.type===wTpl.buildVia);
    EQ.weapon = _typeObj ? makeItem(1,_typeObj,null,false) : JSON.parse(JSON.stringify(STARTER_WEAPONS.sword));
    // Bow is useless without ammo until the player reaches Barnaby — grant the
    // standard starting quiver so the choice is playable from session 1.
    if(wTpl.grantsAmmo==='arrow'){
      EQ.ammo = JSON.parse(JSON.stringify(ARROW_IRON));
    }
  } else {
    EQ.weapon = JSON.parse(JSON.stringify(wTpl));
  }
  // Apply Fortitude starting stat patches — base maxHP/maxStamina derived
  // from gains × ATTR value, mirroring how level-up applies them.
  const fort = ATTRS.fortitude||0;
  if(fort>0){ maxHP+=10*fort; PHP=maxHP; maxStamina+=5*fort; stamina=maxStamina; }
  // Intelligence starting stat patch — max mana + initial mana.
  const intel = ATTRS.intelligence||0;
  if(intel>0){ maxMana+=10*intel; mana=maxMana; }
  // Clear creator-only state so a future "new game" doesn't inherit it.
  metNPCs.clear();
  // Hide modal.
  document.getElementById('cc-modal').style.display='none';
  if(window._ccLook)worldState.look=JSON.parse(JSON.stringify(window._ccLook));applyLook();try{buildViewmodel();}catch(e){}ccLookStop(); // v80 S127 — the look
  if(window._ogCarry){try{if(window._ogCarry.people)worldState.people=window._ogCarry.people;if(window._ogCarry.look)worldState.look=window._ogCarry.look;if(window._ogCarry.item&&typeof bagAdd==='function')bagAdd(window._ogCarry.item);if(typeof addLog==='function')addLog('📖','A new world. The same name; one thing carried through.');}catch(e){}window._ogCarry=null;}
  // v61aw / v61ax: tutorial flow.
  //   1. Show the intro overlay BLACK and OPAQUE first (no text yet) — this
  //      hides every scene transition that follows so the player never
  //      sees a frame of Ashenmoor or the title-screen behind the action.
  //   2. _enterGame() turns on the in-game UI (HUD, hub button, etc.).
  //   3. goToDungeon(TUTORIAL_PORTAL) fires its own doFade and builds the
  //      crypt scene + spawns the player + starts dungeon music. All of
  //      this happens behind our opaque overlay — invisible to the player.
  //   4. After ~1.4s (long enough for goToDungeon's doFade to settle),
  //      start fading in the per-archetype intro text.
  //   5. After all text shown + 3s hold, the overlay fades to transparent
  //      and the player sees the dim crypt around them with dungeon music
  //      already playing.
  //   6. Q0 popup fires once the overlay is gone, giving the player their
  //      first "I find myself inside of a crypt" journal beat.
  worldState.tutorialDone = false;
  // v61b0: gate the main game tick on this flag so enemies don't attack /
  // damage the player during the ~12s intro fade. Cleared in the
  // showIntroFade resolve callback below before the Q0 popup fires.
  _introFadeActive = true;
  // v61b0: tell initAudio (called inside _enterGame) to start dungeon
  // music directly instead of its default 'overworld' track. Without
  // this, overworld music briefly fires between initAudio and the
  // explicit startMusic('dungeon') below, which players hear as a
  // fragment of village music after character creation. Reset to null
  // immediately after _enterGame so the override doesn't leak.
  _initialMusicOverride = {zone:'dungeon', theme: TUTORIAL_PORTAL.theme};
  // Step 1: paint the overlay black immediately. We deliberately don't
  // call showIntroFade yet — that function fades text IN. We just want
  // the black layer up first so the next steps are masked.
  const _introOv = document.getElementById('intro-overlay');
  if(_introOv){
    _introOv.style.transition = '';
    _introOv.style.opacity = '1';
    _introOv.style.display = 'flex';
  }
  _enterGame();
  _initialMusicOverride = null;
  buildViewmodel();
  goToDungeon(TUTORIAL_PORTAL);
  addLog('🪦', `${playerName} woke in the dark.`);
  // Wait for goToDungeon's doFade to settle, then run the text fade-in.
  setTimeout(()=>{
    showIntroFade(playerArchetype).then(()=>{
      // Clear the pause flag — game tick resumes, enemies can act, the
      // player can be hurt again. Done BEFORE the Q0 popup fires so the
      // popup itself can pause via its own _qpopOpen mechanism.
      _introFadeActive = false;
      // Q0 popup as the first quest beat. showQuestUpdatePopup queues if
      // anything else is on screen, but at this point the dungeon scene
      // is the only thing live so it fires right away.
      const q0 = getQuest('q0_arrival');
      if(q0 && typeof showQuestUpdatePopup === 'function'){
        showQuestUpdatePopup('accept', q0);
      }
    });
  }, 1400);
}
// Wire the creator's begin button (defensive — element may not exist yet
// if HTML hasn't fully parsed, but on a normal load it will).
// ── v80 S127 — the look panel: swatches and a live preview of the third-person rig ──
window.CCL={r:null,s:null,c:null,rig:null,raf:0,explicit:{},yaw:0,touch:-1e9,last:0,rCv:null,
  // S561 — where the panel draws: the creator's, or the barber's chair (openBarberChair), which leaves out the skin and adds the cloak
  ui:{cv:'cc-look-cv',rows:'cc-look-rows',modal:'cc-modal',skin:true,cloak:false,cloakCol:null}};
// S188 — the preview (Michael, playtest s162): framed head to knees whatever the height, facing you to start, turned by
// dragging on it or with the arrow keys; it turns itself slowly only after four seconds untouched
const CCL_IDLE=4000,CCL_SPIN=.3;
function ccLookFrame(){const R=CCL.rig;if(!R||!CCL.c)return;R.root.rotation.y=0;R.root.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(R.rig.mesh);
  const top=bb.max.y,knee=top*.17,mid=(top+knee)/2,half=(top-knee)/2*1.08,d=half/Math.tan(THREE.MathUtils.degToRad(CCL.c.fov/2));
  CCL.c.position.set(0,mid+.04,d);CCL.c.lookAt(0,mid,0);R.root.rotation.y=CCL.yaw;}
function ccLookTurn(d){CCL.yaw+=d;CCL.touch=performance.now();if(CCL.rig)CCL.rig.root.rotation.y=CCL.yaw;}
(function(){const cv=document.getElementById('cc-look-cv');if(!cv)return;let drag=null;cv.style.cursor='grab';cv.style.touchAction='none';
  cv.addEventListener('pointerdown',e=>{drag=e.clientX;cv.style.cursor='grabbing';try{cv.setPointerCapture(e.pointerId);}catch(err){}ccLookTurn(0);});
  cv.addEventListener('pointermove',e=>{if(drag==null)return;ccLookTurn((e.clientX-drag)*.012);drag=e.clientX;});
  const up=()=>{drag=null;cv.style.cursor='grab';};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  window.addEventListener('keydown',e=>{const m=document.getElementById('cc-modal');if(!m||m.style.display==='none'||!CCL.rig)return;const a=document.activeElement;if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))return;
    if(e.code==='ArrowLeft'||e.code==='ArrowRight'){e.preventDefault();ccLookTurn((e.code==='ArrowLeft'?-1:1)*.2);}});})();
function ccLookPeople(pp){const L=lookDefault(pp,window._ccArch||playerArchetype,document.getElementById('cc-name')&&document.getElementById('cc-name').value);const cur=window._ccLook||{};
  window._ccLook=Object.assign(L,{style:cur.style||L.style,beard:!!cur.beard,tunic:CCL.explicit.tunic?cur.tunic:L.tunic,breeches:cur.breeches!=null?cur.breeches:L.breeches,boots:cur.boots!=null?cur.boots:L.boots});ccLookRows();ccLookRebuild();}
function ccLookRows(){const box=document.getElementById(CCL.ui.rows);if(!box)return;const pp=window._ccPeople||'gatelander';let P=null;try{P=WORLD.PEOPLES[pp];}catch(e){}const L=window._ccLook;
  const row=(label,items,get,set)=>{const r=document.createElement('div');r.style.cssText='display:flex;align-items:center;gap:6px;flex-wrap:wrap';const l=document.createElement('span');l.textContent=label;l.style.cssText='width:64px;color:'+(CCL.ui.ink||'#b8a880')+';font-size:12px;flex:none';r.appendChild(l);
    for(const it of items){const b=document.createElement('button');b.type='button';const col=typeof it==='number';b.title=col?'#'+it.toString(16).padStart(6,'0'):it[1];b.textContent=col?'':it[1];const on=get()===(col?it:it[0]);
      b.style.cssText=col?`width:22px;height:22px;border-radius:50%;cursor:pointer;background:#${it.toString(16).padStart(6,'0')};border:2px solid ${on?'#e8c860':'rgba(0,0,0,.5)'};box-shadow:${on?'0 0 0 1px #e8c860':'none'}`:`padding:3px 8px;cursor:pointer;font:12px Georgia,serif;border-radius:4px;background:${on?'#3a2a16':'#2a2020'};color:${on?'#f0e2c0':'#c8b8a0'};border:1px solid ${on?'#c8a84a':'#5a4a3a'}`;
      b.onclick=()=>{set(col?it:it[0]);ccLookRows();ccLookRebuild();};r.appendChild(b);}
    box.appendChild(r);};
  box.innerHTML='';
  if(CCL.ui.skin)row('Skin',P&&P.skin||[0xd4a878],()=>L.skin,v=>{L.skin=v;});
  row('Hair',P&&P.hair||[0x3a2a1a],()=>L.hair,v=>{L.hair=v;});
  row('Style',LOOK_STYLES,()=>L.style,v=>{L.style=v;});
  row('Beard',LOOK_BEARDS,()=>L.beard===true?'full':L.beard||'no',v=>{L.beard=v==='no'?false:v;});
  row('Tunic',LOOK_TUNICS,()=>L.tunic,v=>{L.tunic=v;CCL.explicit.tunic=true;});
  row('Breeches',LOOK_BREECHES,()=>L.breeches,v=>{L.breeches=v;});
  row('Boots',LOOK_BOOTS,()=>L.boots,v=>{L.boots=v;});
  if(CCL.ui.cloak)row('Cloak',LOOK_TUNICS,()=>CCL.ui.cloakCol,v=>{CCL.ui.cloakCol=v;});}
function ccLookRebuild(){const cv=document.getElementById(CCL.ui.cv);if(!cv||!window._ccLook)return;
  if(CCL.r&&CCL.rCv!==cv){try{CCL.r.dispose();}catch(e){}CCL.r=null;}
  if(!CCL.r){CCL.rCv=cv;try{CCL.r=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});CCL.r.setSize(200,250,false);CCL.r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));CCL.s=new THREE.Scene();CCL.s.add(new THREE.AmbientLight(0xffffff,.55));const d=new THREE.DirectionalLight(0xfff0d0,.9);d.position.set(1.2,2,1.6);CCL.s.add(d);const d2=new THREE.DirectionalLight(0xc0c8ff,.35);d2.position.set(-1.5,.8,-1);CCL.s.add(d2);CCL.c=new THREE.PerspectiveCamera(28,200/250,.1,10);}catch(e){CCL.r=null;return;}}
  if(CCL.rig)tpDispose(CCL.rig);
  const keep={};for(const k in EQ){keep[k]=EQ[k];}EQ.head=null;EQ.chest={name:'Tattered Tunic'};EQ.legs={name:'Worn Breeches'};EQ.feet={name:'Leather Boots'};EQ.hands=null;EQ.weapon=null;EQ.offhand=null;EQ.ammo=null;EQ.amulet=null;if(EQ.back&&CCL.ui.cloakCol!=null)EQ.back=Object.assign({},EQ.back,{col:CCL.ui.cloakCol});
  try{CCL.rig=tpBuild(window._ccLook,window._ccPeople||'gatelander');}finally{for(const k in keep)EQ[k]=keep[k];}
  if(CCL.rig){CCL.rig.root.position.set(0,0,0);CCL.s.add(CCL.rig.root);
    // an easy stance: arms down, a slight turn of the head
    tpSet(CCL.rig.shL,.05,0,.08,1);tpSet(CCL.rig.shR,.05,0,-.08,1);tpSet(CCL.rig.elL,-.15,0,0,1);tpSet(CCL.rig.elR,-.15,0,0,1);tpSet(CCL.rig.head,0,-.15,0,1);ccLookFrame();}
  if(!CCL.raf)ccLookLoop();}
function ccLookLoop(){CCL.raf=requestAnimationFrame(ccLookLoop);const m=document.getElementById(CCL.ui.modal);if(!m||m.style.display==='none'){ccLookStop();return;}const now=performance.now(),dt=Math.min(.1,(now-(CCL.last||now))/1000);CCL.last=now;if(CCL.r&&CCL.rig){if(now-CCL.touch>CCL_IDLE)CCL.yaw+=dt*CCL_SPIN;CCL.rig.root.rotation.y=CCL.yaw;try{CCL.r.render(CCL.s,CCL.c);}catch(e){}}}
function ccLookStop(){if(CCL.raf)cancelAnimationFrame(CCL.raf);CCL.raf=0;}
(function(){const sh=document.getElementById('cc-look-shuffle');if(sh)sh.onclick=()=>{const pp=window._ccPeople||'gatelander';let P=null;try{P=WORLD.PEOPLES[pp];}catch(e){}const pk=a=>a[Math.floor(Math.random()*a.length)];const L=window._ccLook||lookDefault(pp,playerArchetype);L.skin=pk(P&&P.skin||[L.skin]);L.hair=pk(P&&P.hair||[L.hair]);L.style=pk(LOOK_STYLES)[0];L.beard=Math.random()<.35?pk(LOOK_BEARDS.slice(1))[0]:false;L.tunic=pk(LOOK_TUNICS);L.breeches=pk(LOOK_BREECHES);L.boots=pk(LOOK_BOOTS);CCL.explicit.tunic=true;window._ccLook=L;ccLookRows();ccLookRebuild();};})();
// S561 — the barber's chair (barber slice 2; Michael's B on #144, the fee his A on #151): the look panel on a parchment slip, your
// hair, style and beard, the dyes of your own tunic, breeches and boots, and your cloak's if you wear one. The skin is not the
// barber's. Rising keeps what you chose and pays the visit's fee through the systems builder's barberPay(house, changed): nothing
// changed is free, a short purse keeps you in the chair with nothing taken. "Leave as you came" puts it all back.
let barberOpen=false;
function openBarberChair(house){
  if(!worldState.look)worldState.look=lookDefault((()=>{try{return WORLD.playerPeople();}catch(e){return 'gatelander';}})(),playerArchetype,playerName);
  if(typeof _releasePointerLockForMenu==='function')_releasePointerLockForMenu();
  let ov=document.getElementById('barberui');
  if(!ov){ov=document.createElement('div');ov.id='barberui';
    ov.style.cssText='position:fixed;inset:0;z-index:8500;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.35)';
    ov.innerHTML='<div style="width:560px;max-width:94vw;padding:20px 24px;background:#e9dcc2;color:#3a2c18;border:6px double #8a7040;border-radius:6px;font-family:Georgia,serif;box-shadow:0 10px 40px #000a">'+
      '<div id="barber-title" style="font-size:20px;letter-spacing:.04em;text-align:center"></div>'+
      '<div style="display:flex;gap:14px;margin:12px 0;align-items:flex-start"><canvas id="barber-cv" width="200" height="250" style="width:200px;height:250px;background:rgba(40,28,12,.85);border:1px solid #a89060;border-radius:4px;flex:none;cursor:grab;touch-action:none"></canvas>'+
      '<div id="barber-rows" style="flex:1;display:flex;flex-direction:column;gap:7px"></div></div>'+
      '<div id="barber-fee" style="font-size:13px;color:#6a5a3a;text-align:center;min-height:18px"></div>'+
      '<div style="display:flex;justify-content:space-around;border-top:1px solid #a89060;padding-top:10px;margin-top:6px">'+
      '<button type="button" id="barber-rise" style="background:none;border:none;font:18px Georgia,serif;color:#3a2c18;cursor:pointer">Rise</button>'+
      '<button type="button" id="barber-leave" style="background:none;border:none;font:18px Georgia,serif;color:#3a2c18;cursor:pointer">Leave as you came</button></div></div>';
    document.body.appendChild(ov);
    const cv=ov.querySelector('#barber-cv');let drag=null;
    cv.addEventListener('pointerdown',e=>{drag=e.clientX;try{cv.setPointerCapture(e.pointerId);}catch(err){}ccLookTurn(0);});
    cv.addEventListener('pointermove',e=>{if(drag==null)return;ccLookTurn((e.clientX-drag)*.012);drag=e.clientX;});
    const up=()=>{drag=null;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);}
  const was=JSON.stringify(worldState.look),cloak=EQ.back&&EQ.back.cloak?EQ.back:null,cloakWas=cloak&&cloak.col!=null?cloak.col:null;
  window._ccLook=JSON.parse(was);CCL.explicit={tunic:true};
  CCL.ui={cv:'barber-cv',rows:'barber-rows',modal:'barberui',skin:false,cloak:!!cloak,cloakCol:cloakWas,ink:'#5a4426'};
  ov.querySelector('#barber-title').textContent=(house&&house.name)||'The barber’s chair';
  const fee=typeof barberFee==='function'?barberFee(house):null;
  ov.querySelector('#barber-fee').textContent=fee!=null?`${fee} gold for the visit, whatever is changed; nothing, if nothing is.`:'';
  const close=()=>{ov.style.display='none';barberOpen=false;ccLookStop();CCL.ui={cv:'cc-look-cv',rows:'cc-look-rows',modal:'cc-modal',skin:true,cloak:false,cloakCol:null};};
  ov.querySelector('#barber-leave').onclick=()=>{window._ccLook=null;close();};
  ov.querySelector('#barber-rise').onclick=()=>{const L=window._ccLook,changed=JSON.stringify(L)!==was||(cloak&&CCL.ui.cloakCol!==cloakWas);
    const res=typeof barberPay==='function'?barberPay(house,changed):(changed?'paid':'free');
    if(res==='poor'){ov.querySelector('#barber-fee').textContent=fee!=null?`You have not the ${fee} gold.`:'You have not the fee.';return;}
    if(changed){worldState.look=JSON.parse(JSON.stringify(L));if(cloak&&CCL.ui.cloakCol!=null)cloak.col=CCL.ui.cloakCol;applyLook();try{buildViewmodel();}catch(e){}}
    window._ccLook=null;close();showMsg(changed?'You rise from the chair, changed.':'You rise from the chair as you sat down.','#c8b880');};
  ov.style.display='flex';barberOpen=true;CCL.yaw=0;CCL.touch=performance.now();ccLookRows();ccLookRebuild();}
const _ccBeginBtn=document.getElementById('cc-begin');
if(_ccBeginBtn) _ccBeginBtn.onclick=ccBegin;
const _ccNameEl=document.getElementById('cc-name');
if(_ccNameEl) _ccNameEl.addEventListener('keydown',e=>{
  if(e.code==='Enter'){e.preventDefault();ccBegin();}
});

// ── Start New Adventure ────────────────────────────────────────────────
document.getElementById('sb').onclick=function(e){
  e.stopPropagation();
  // v61at: route through character creator first instead of spawning
  // directly. ccBegin() handles the world spawn that used to live here.
  openCharacterCreator();
};

// ── Continue Adventure (load most-recent active slot) ─────────────────
document.getElementById('cb').onclick=function(e){
  e.stopPropagation();
  const _key=ssActiveKey();
  const _go=(d)=>{
  if(!d){
    px=15;pz=20;yaw=0;pitch=0;lid='overworld';activeZoneId='overworld';scene=owScene;ZE=[];ZB=[];velY=0;jumpY=0;onGround=true;
    showZoneName('🌿 Village of Ashenmoor');
    _enterGame();
    showMsg('Could not load save — starting fresh.','#e8c88a');
    return;
  }
  setActiveSlot(_key);
  _applyLoadData(d);
  _applyZoneFromSave(d);
  _enterGame();
  updateHUD(); renderInv();
  buildViewmodel();
  buildShieldViewmodel();
  {const _m=ssEntry(_key);addLog('💾',`${_m&&_m.kind==='auto'?'Autosave':'Slot '+((_m?_m.slot:0)+1)} loaded — Lv${d.level}, ${d.gold}\uD83E\uDE99`);} // v80 S137 — was slotN, gone since the S136 keys
  // v61eb: Use post-migration activeZoneId (not d.zone) so saves referencing
  // the deleted 'hollowed_wastes' zone show the correct migrated label.
  showMsg(`Welcome back! (${ZONE_LABEL[activeZoneId]||activeZoneId} \u00B7 ${new Date(d.ts).toLocaleDateString()})`,'#c8e88a');
  };
  if(_key&&ssEntry(_key))ssLoad(_key).then(_go);else _go(null);
};

// ── Load Game (slot picker from title) ────────────────────────────────
document.getElementById('lgb').onclick=function(e){
  e.stopPropagation();
  // Silently enter game world so scene is ready, then show load menu
  px=15;pz=20;yaw=0;pitch=0;lid='overworld';activeZoneId='overworld';scene=owScene;ZE=[];ZB=[];velY=0;jumpY=0;onGround=true;
  showZoneName('🌿 Village of Ashenmoor');
  _enterGame();
  openSLMenu('load', true);
};

// In-game 💾 button — open save menu
document.getElementById('save-btn').onclick=function(e){
  e.stopPropagation();
  openSLMenu('save', false);
};
