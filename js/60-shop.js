
// ── SHOP ────────────────────────────────────────────────────
function openShop(){
  if(!currentHouse)return;
  if(typeof WORLD!=='undefined'&&WORLD.refusesTrade&&WORLD.refusesTrade(currentHouse)){showMsg(`${currentHouse.keeper||'The keeper'}: “I know what you did. Take your custom elsewhere.”`,'#e8a880');return;} // S156
  _releasePointerLockForMenu();
  shopOpen=true;
  const el=document.getElementById('shop');
  el.style.display='flex';
  document.getElementById('sh-title').textContent=currentHouse.name;
  document.getElementById('sh-sub').textContent=`${currentHouse.keeper} · ${currentHouse.tagline}`;
  setShopTab('all'); // v67 — reset category each open; setShopTab calls renderShop
}
function closeShop(){
  shopOpen=false;
  if(!isInterior())currentHouse=null; // v80 — outdoor merchants set currentHouse only for the shop's lifetime
  closeQtyModal(); // v68 — dismiss any open quantity prompt
  document.getElementById('shop').style.display='none';
  G.focus();
}

// ── LOOT PANEL ──────────────────────────────────────────────
// Opens when player presses E near a container (chest/barrel/corpse). Items are pre-rolled at spawn
// and stored on the container; panel iterates the items array and each click/take-all splices from it.
// Panel persists if player leaves mid-loot — container items array remembers what's left.
let currentLootContainer=null;
function openLoot(container){
  _releasePointerLockForMenu();
  lootOpen=true;
  currentLootContainer=container;
  container.opened=true;
  // Lid animation on chests, top pop on barrels — immediate visual feedback of "opened" regardless of contents.
  // v61gf: barrel/crate `top` gate switched from position-based (`y < 0.4`, which
  // never fired because barrels spawn .top at y=0.575 and crates at y=0.53) to
  // state-based via `topOpened` flag. Pop height bumped from .42 → .12 above
  // spawn height. Tilt reduced to .22 rad for a subtler "knocked askew" read.
  if(container.lid && container.lid.rotation.x === 0) container.lid.rotation.x = -Math.PI/3;
  if(container.openTop && !container.topOpened){container.openTop();container.topOpened=true;}
  if(container.top && !container.topOpened){
    container.top.position.y += 0.12;
    container.top.rotation.z = 0.22;
    container.topOpened = true;
  }
  if(container.gl) container.gl.intensity = Math.max(0, container.gl.intensity*0.3); // dim corpse glow
  if(container.spark) container.spark.visible = false;
  document.getElementById('loot-panel').style.display='flex';
  document.getElementById('lp-title').textContent = container.displayName || 'Container';
  document.getElementById('lp-sub').textContent = container.items.length ? 'Click an item to take just that one' : 'Empty.';
  sndChestOpen();
  renderLoot();
}
function closeLoot(){
  lootOpen=false;
  currentLootContainer=null;
  document.getElementById('loot-panel').style.display='none';
  G.focus();
}
function lootItemDesc(it){
  if(it.type==='gold') return `${it.value} gold`;
  if(it.type==='misc') return 'Curiosity';
  return itemDesc(it);
}
function renderLoot(){
  const listEl=document.getElementById('lp-list');
  const takeAllBtn=document.getElementById('lp-take-all');
  listEl.innerHTML='';
  if(!currentLootContainer || !currentLootContainer.items.length){
    listEl.innerHTML='<div class="lp-empty">Nothing here.</div>';
    takeAllBtn.disabled=true;
    return;
  }
  currentLootContainer.items.forEach((it,i)=>{
    const div=document.createElement('div');div.className='lp-item';
    div.innerHTML=`<span class="lp-ico">${iconHTML(it)}</span><div class="lp-info"><div class="lp-name">${it.name}${it.qty>1?` x${it.qty}`:''}</div><div class="lp-desc">${lootItemDesc(it)}</div></div>`;
    div.onclick=()=>takeLootItem(i);
    listEl.appendChild(div);
  });
  takeAllBtn.disabled=false;
}
function takeLootItem(idx){
  if(!currentLootContainer)return;
  const it=currentLootContainer.items[idx];
  if(!it)return;
  if(it.type==='gold'){
    gold += it.value;
    showMsg(`+${it.value} gold`, '#ffd700');
  } else {
    // bagAdd may refuse if adding would push total carry weight over 125% of max.
    if(!canCarry(it)){showMsg('Too heavy to carry!','#cc8844');return;}
    bagAdd(it);
    showMsg(`Obtained: ${it.name}`, '#c8a84a');
    // v61d0 — Fire receive_item event so quest objectives that gate on
    // looting a specific named item (Q7 obj 2 / The Faolchú's Mark) tick.
    // Pre-v61d0 receive_item only fired from questMidQuestGive (the dialog
    // handoff path used by Edna's Rubbing). The Mark drops as boss loot
    // and needs the corpse-pickup path to advance its objective. Filter
    // is downstream — checkQuestProgress matches data.itemName against
    // obj.itemName, so non-quest pickups (gold, potions, etc.) no-op.
    if(typeof checkQuestProgress==='function'){
      checkQuestProgress('receive_item', {itemName: it.name});
    }
  }
  currentLootContainer.items.splice(idx, 1);
  // v61ae: when the hammer is taken off Bram's body, remove the goblin axe
  // from the scene too — the in-fiction read is "the weapon he went out
  // holding" not "another decorative prop the player can walk around." Guard
  // on bramBody so this doesn't affect any other corpse.
  if(currentLootContainer.bramBody && it.name==="The Forge-Man's Hammer"
     && currentLootContainer.bramAxe && currentLootContainer.bramGroup){
    currentLootContainer.bramGroup.remove(currentLootContainer.bramAxe);
    currentLootContainer.bramAxe = null; // mark handled
  }
  // Track chest interactions for stats on first full-empty
  if(currentLootContainer.items.length===0 && currentLootContainer.lid){
    lvAct.chestsOpened++;
    addLog('✦', currentLootContainer.treasure?'Emptied a treasure chest':'Emptied a chest');
  }
  renderLoot();
}
function takeAllLoot(){
  if(!currentLootContainer)return;
  // Iterate by snapshot, take one-by-one; stop if bag fills up
  while(currentLootContainer.items.length){
    const preLen=currentLootContainer.items.length;
    takeLootItem(0);
    if(currentLootContainer.items.length===preLen)break; // bag full, nothing more can be taken
  }
}

// ── STASH (v61d4) ──────────────────────────────────────────────────────
// Two-column deposit/withdraw panel for the Caldric Safehouse chest.
// Click a Bag-side row to deposit (no weight check — stash is unbounded).
// Click a Stash-side row to withdraw (weight-checked via canCarry).
//
// Stacking is preserved on both sides: depositing a stack of 5 Health
// Potions merges into an existing stack on the stash side; same on
// withdraw. Single non-stackable items move as-is.
//
// Unique items behave as expected: they CAN go into the stash (this is the
// whole point — they need a home off the bag) and they CAN come back out.
// The unique-flag-protected sell gate (v61d0) is still in force on the
// merchant side, so the only way for the player to lose a unique is via
// quest progression (e.g. Edna's Rubbing handed off to Aldwyn) or the
// existing destroy gate (which already guards uniques).
function openStash(){
  _releasePointerLockForMenu();
  stashOpen=true;
  document.getElementById('stash-panel').style.display='flex';
  // Reuse the chest-open audio cue — same affordance, same feedback.
  if(typeof sndChestOpen==='function') sndChestOpen();
  renderStash();
}
function closeStash(){
  stashOpen=false;
  document.getElementById('stash-panel').style.display='none';
  G.focus();
}
function renderStash(){
  const bagListEl=document.getElementById('sp-bag-list');
  const stashListEl=document.getElementById('sp-stash-list');
  const bagMetaEl=document.getElementById('sp-bag-meta');
  const stashMetaEl=document.getElementById('sp-stash-meta');
  // Bag column — click to deposit
  bagListEl.innerHTML='';
  if(!BAG.length){
    bagListEl.innerHTML='<div class="sp-empty">Your bag is empty.</div>';
  } else {
    BAG.forEach((it,i)=>{
      if(!it)return;
      const div=document.createElement('div');div.className='lp-item';
      div.innerHTML=`<span class="lp-ico">${iconHTML(it)}</span><div class="lp-info"><div class="lp-name">${it.name}${it.qty>1?` x${it.qty}`:''}</div><div class="lp-desc">${lootItemDesc(it)}</div></div>`;
      div.onclick=()=>depositToStash(i);
      bagListEl.appendChild(div);
    });
  }
  // Stash column — click to withdraw
  stashListEl.innerHTML='';
  if(!stashBag.length){
    stashListEl.innerHTML='<div class="sp-empty">The stash is empty.</div>';
  } else {
    stashBag.forEach((it,i)=>{
      if(!it)return;
      const div=document.createElement('div');div.className='lp-item';
      div.innerHTML=`<span class="lp-ico">${iconHTML(it)}</span><div class="lp-info"><div class="lp-name">${it.name}${it.qty>1?` x${it.qty}`:''}</div><div class="lp-desc">${lootItemDesc(it)}</div></div>`;
      div.onclick=()=>withdrawFromStash(i);
      stashListEl.appendChild(div);
    });
  }
  // Meta lines — show count + bag-side weight readout. Stash has no
  // weight cap, so its meta just shows count.
  const bw=bagWeight(), mc=maxCarry();
  bagMetaEl.textContent=`${BAG.length} item${BAG.length===1?'':'s'} · ${bw.toFixed(1)}/${mc} kg`;
  stashMetaEl.textContent=`${stashBag.length} item${stashBag.length===1?'':'s'}`;
}
// Deposit a single bag entry into the stash. Stacks merge on the stash
// side via _stashAdd (mirrors bagAdd's isStackable→qty++ pattern).
function depositToStash(idx){
  const it=BAG[idx];
  if(!it)return;
  // Splice removes the entry whether stackable or not — for stackable
  // items we deposit the whole stack at once. (Splitting stacks would be
  // a nice-to-have for a future pass; not in MVP.)
  BAG.splice(idx,1);
  _stashAdd(it);
  renderStash();
}
// Withdraw a stash entry into the bag. Weight-checked: if pulling the
// item would push total carry weight over 125% of max, refuse with a
// toast. The check uses the full item (including qty for stacks) so a
// big stack of potions can be refused cleanly.
function withdrawFromStash(idx){
  const it=stashBag[idx];
  if(!it)return;
  if(!canCarry(it)){
    showMsg('Too heavy to carry!','#cc8844');
    return;
  }
  stashBag.splice(idx,1);
  // Withdraw goes through normal bagAdd to inherit the stacking path.
  // bagAdd doesn't preserve qty on stackable adds (it sets qty:1 on push
  // and increments existing stacks one-at-a-time), so for a stack we add
  // one qty at a time. For unique/non-stackable items, a single push.
  if(isStackable(it) && it.qty>1){
    for(let k=0;k<it.qty;k++){bagAdd({...it,qty:1});}
  } else {
    // Re-add a fresh copy so qty resets cleanly. Spread preserves all
    // other fields (enchant, _unique, etc.). qty defaults to 1 in bagAdd's
    // push branch.
    const cp={...it}; delete cp.qty;
    bagAdd(cp);
  }
  renderStash();
}
// Stash-side stacking add. Mirrors bagAdd but writes to stashBag and
// preserves the input's qty on stack-merge (so a 5-stack deposit merges
// 5 onto the existing stash stack, not 1).
function _stashAdd(item){
  if(isStackable(item)){
    const ex=stashBag.find(b=>b.name===item.name);
    if(ex){ex.qty=(ex.qty||1)+(item.qty||1);return;}
  }
  stashBag.push({...item, qty: item.qty||1});
}

// ── REST (v61d4) ───────────────────────────────────────────────────────
// Bed interaction in the Caldric Safehouse. Fade-to-black, restore
// HP/mana/stamina to max, fade back in. Free per the design call —
// the safehouse is a personal gift, not a paid inn. Saves on resolve
// so the rest persists if the browser closes mid-fade.
// v80 S11 — "How long would you like to sleep?" Slider 1–24h, then the
// fade, the clock advance, restore scaled by hours (full at 6+), and any
// banked level taken after waking.
function gameDateLine(at,tod){ /* S486 — at, tod: a journal line's stamp; none, now */
  const abs=at!=null?at:((worldState&&worldState.gameTimeAbsMinutes)||0);const day=Math.floor(abs/1440)+1;
  const m=(tod!=null?tod:at!=null?at:((worldState&&worldState.gameTimeMinutes)||0))%1440;const hh=Math.floor(m/60),mm=Math.floor(m%60);
  const h12=((hh+11)%12)+1,ap=hh<12?'am':'pm';
  return `Day ${day} · ${h12}:${String(mm).padStart(2,'0')} ${ap}`;
}
// S496 — the calendar the world keeps (Michael's C on DECISION #132, part B; docs/design/journal-and-calendar.md): a week of
// seven days, a day to each god (the six with shrines, then the Guest's), months of 28 days so a weekday keeps its dates,
// twelve months in four seasons of three (the year turns with the first month, spring), a tale begun on the first day of
// the first autumn month. Every name here is a
// placeholder for the quest writer's; they live in this one table and nothing else spells them.
const CAL={days:[{god:'muir',name:'the Sea’s day'},{god:'speir',name:'the Sky’s day'},{god:'beithigh',name:'the Beasts’ day'},{god:'cloch',name:'the Stone’s day'},{god:'teallach',name:'the Hearth’s day'},{god:'fiodoir',name:'the Weaver’s day'},{god:'guest',name:'the Guest’s day'}],
  monthNames:['the first month','the second month','the third month','the fourth month','the fifth month','the sixth month','the seventh month','the eighth month','the ninth month','the tenth month','the eleventh month','the twelfth month'],
  monthLen:28,months:12,seasons:['spring','summer','autumn','winter'],startMonth:6,startYear:1};
function calDay(at){
  const abs=at!=null?at:((worldState&&worldState.gameTimeAbsMinutes)||0);const n=Math.floor(Math.max(0,abs)/1440);
  const wd=n%CAL.days.length,mAbs=CAL.startMonth+Math.floor(n/CAL.monthLen),month=mAbs%CAL.months;
  return {n,weekday:wd,day:CAL.days[wd],god:CAL.days[wd].god,dom:n%CAL.monthLen+1,month,season:CAL.seasons[Math.floor(month/3)],year:CAL.startYear+Math.floor(mAbs/CAL.months)};
}
// S497 — the calendar's own date, *the Sea’s day, the 8th of the seventh month* (the Due view; the date line everywhere
// waits for the writer's names)
function calDateLine(at){const c=calDay(at);const d=c.dom,sfx=(d%10===1&&d!==11)?'st':(d%10===2&&d!==12)?'nd':(d%10===3&&d!==13)?'rd':'th';return `${c.day.name}, the ${d}${sfx} of ${CAL.monthNames[c.month]}`;}
function isGodsDay(god,at){return !!god&&calDay(at).god===god;}
function openSleepUI(){
  if(typeof _releasePointerLockForMenu==='function')_releasePointerLockForMenu();
  let ov=document.getElementById('sleepui');
  if(!ov){
    ov=document.createElement('div');ov.id='sleepui';
    ov.style.cssText='position:fixed;inset:0;z-index:8500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35)';
    ov.innerHTML='<div style="width:420px;padding:26px 30px;background:#e9dcc2;color:#3a2c18;border:6px double #8a7040;border-radius:6px;font-family:Georgia,serif;text-align:center;box-shadow:0 10px 40px #000a">'+
      '<div style="font-size:20px;letter-spacing:.04em">How long would you like to sleep?</div>'+
      '<div id="sleep-hrs" style="font-size:22px;margin:14px 0 6px">8 Hours</div>'+
      '<input id="sleep-range" type="range" min="1" max="24" value="8" style="width:88%;accent-color:#8a6a2a">'+
      '<div id="sleep-date" style="margin:12px 0 18px;font-size:14px;color:#6a5a3a"></div>'+
      '<div style="display:flex;justify-content:space-around;border-top:1px solid #a89060;padding-top:12px">'+
      '<button type="button" id="sleep-go" style="background:none;border:none;font:18px Georgia,serif;color:#3a2c18;cursor:pointer;letter-spacing:.05em">Continue</button>'+
      '<button type="button" id="sleep-no" style="background:none;border:none;font:18px Georgia,serif;color:#3a2c18;cursor:pointer;letter-spacing:.05em">Cancel</button></div></div>';
    document.body.appendChild(ov);
    const rng=ov.querySelector('#sleep-range');
    rng.oninput=()=>{ov.querySelector('#sleep-hrs').textContent=rng.value+(rng.value==='1'?' Hour':' Hours');};
    ov.querySelector('#sleep-no').onclick=()=>{ov.style.display='none';sleepOpen=false;};
    ov.querySelector('#sleep-go').onclick=()=>{ov.style.display='none';sleepOpen=false;restAtBed(+rng.value);};
  }
  ov.querySelector('#sleep-date').textContent=gameDateLine()+(xp>=xpNext?' · You are ready to advance':'');
  ov.style.display='flex';sleepOpen=true;
}
let sleepOpen=false;
function restAtBed(hours){
  if(typeof doFade!=='function'){return;}
  hours=Math.max(1,Math.min(24,hours||8));
  const k=Math.min(1,hours/6);
  doFade(()=>{
    {const mh=effMaxHP(),mm=effMaxMana();
    PHP=Math.min(mh,PHP+Math.ceil((mh-PHP)*k)+(k>=1?mh:0));
    mana=Math.min(mm,mana+Math.ceil((mm-mana)*k)+(k>=1?mm:0));
    stamina=effMaxStamina();}
    if(typeof worldState !== 'undefined' && typeof worldState.gameTimeMinutes === 'number'){
      worldState.gameTimeMinutes = (worldState.gameTimeMinutes + hours*60) % 1440;
      worldState.gameTimeAbsMinutes = (worldState.gameTimeAbsMinutes||0) + hours*60;
    }
    if(typeof addLog==='function')addLog('🛏️',`Slept ${hours} hour${hours>1?'s':''}.`);
    showMsg(`You wake after ${hours} hour${hours>1?'s':''}. ${gameDateLine()}`,'#c8b880');
    updateHUD();
    if(typeof saveGame==='function')saveGame(); /* S353 — #66 A: sleeping anywhere autosaves */
    setTimeout(()=>{if(takeLevelIfReady())showMsg('You wake stronger.','#e8d8a0');},900);
  });
}
// v67 — shop rebuilt on the inventory list component. Shared category tabs
// drive BOTH panels at once (merchant stock | your bag), so switching to
// "Weapons" shows their weapons beside yours — Oblivion-style trade view.
// v68 — buy-back. Per-merchant overlay of items the player has sold, keyed by
// house.id so selling to Bram never surfaces in Wulfric's stock. Persisted in
// the save payload; restored on load (migration-safe → {}). Items are stamped
// _boughtBack:true and re-priced to what the player got for them (sell-price
// buy-back, per the v68 design). Stackables merge by name into one entry.
let merchantStock = {};
function _merchantKey(){ return currentHouse && currentHouse.id ? currentHouse.id : '_none'; }
function _pushBuyBack(it, sp){
  const key=_merchantKey();
  if(!merchantStock[key]) merchantStock[key]=[];
  const arr=merchantStock[key];
  // Stamp a fresh copy: this is now SHOP stock, so it needs buyPrice (= the
  // sell price the player received) and the _boughtBack tag for display.
  const entry={...it, _boughtBack:true, buyPrice:Math.max(1,sp), _bagPrice:it.buyPrice}; // S366 — _bagPrice: its own price, restored when bought back
  if(isStackable(it)){
    // Merge into an existing same-name buy-back stack.
    const ex=arr.find(s=>s.name===it.name && s._boughtBack);
    if(ex){ ex.qty=(ex.qty||1)+(it.qty||1); return; }
    entry.qty=it.qty||1;
  } else {
    entry.qty=1;
  }
  arr.push(entry);
}
// Remove (or decrement) a buy-back entry once the player buys it back.
function _consumeBuyBack(it, units){
  const key=_merchantKey();
  const arr=merchantStock[key]; if(!arr)return;
  const idx=arr.indexOf(it);
  if(idx<0)return;
  if(isStackable(it) && (it.qty||1) > units){
    it.qty-=units;
  } else {
    arr.splice(idx,1);
  }
}

// ── v68 — stackable quantity prompt ──────────────────────────────────────
// State for the currently-open prompt.
//   unit       = the thing a button multiplies. For NATIVE stock a unit is one
//                authored bundle (12-arrow row → 1 unit = 12 pieces). For
//                BUY-BACK items and for SELLING, a unit is a single piece.
//   piecesPerUnit = how many inventory items one unit yields/removes.
//   unitPrice  = gold per unit.
//   maxUnits   = how many units are buyable (gold-limited) or sellable (owned).
let _qtyCtx=null; // {it, side, bagIdx, unitPrice, piecesPerUnit, maxUnits}
function openQtyModal(it, side, bagIdx){
  let unitPrice, piecesPerUnit, maxUnits;
  if(side==='buy'){
    if(it._boughtBack){
      // Buy-back: priced per piece, sold back one piece at a time.
      piecesPerUnit = 1;
      unitPrice = it.buyPrice||0;
      const owned = it.qty||1;
      maxUnits = unitPrice>0 ? Math.min(owned, Math.floor(gold/unitPrice)) : owned;
    } else {
      // Native stock: one unit = one authored bundle.
      piecesPerUnit = it.qty||1;
      unitPrice = shopCost(it);
      maxUnits = unitPrice>0 ? Math.floor(gold/unitPrice) : 999;
    }
  } else {
    // Selling: unit = one piece, priced per piece.
    piecesPerUnit = 1;
    unitPrice = Math.round(counterSellPrice(it)*_buffMult('goldFind',1));
    maxUnits = it.qty||1;
  }
  _qtyCtx={it, side, bagIdx, unitPrice, piecesPerUnit, maxUnits};
  document.getElementById('qty-title').textContent = (side==='buy'?'Buy ':'Sell ')+it.name;
  document.getElementById('qty-custom-go').textContent = side==='buy'?'Buy':'Sell'; /* S409 — it read Buy on a sale too (the concept artist, 1 Oct) */
  const each = piecesPerUnit>1 ? `Each = ${piecesPerUnit} pieces · ${unitPrice}🪙` : `${unitPrice}🪙 each · ${maxUnits} available`;
  document.getElementById('qty-sub').textContent = each;
  document.querySelectorAll('#qty-options .qty-opt').forEach(b=>{
    const m=b.dataset.mult;
    if(m==='max'){ b.classList.toggle('disabled', maxUnits<1); return; }
    b.classList.toggle('disabled', parseInt(m,10) > maxUnits);
  });
  const ci=document.getElementById('qty-custom'); if(ci){ ci.value=''; ci.oninput=()=>{ const v=parseInt(ci.value,10); _qtyReadout(v>0?Math.min(v,_qtyCtx.maxUnits):0); }; }
  _qtyReadout(0);
  document.getElementById('qty-modal').style.display='flex';
}
function closeQtyModal(){
  document.getElementById('qty-modal').style.display='none';
  _qtyCtx=null;
}
function _qtyReadout(units){
  const el=document.getElementById('qty-readout'); if(!el||!_qtyCtx)return;
  if(!units){ el.textContent='—'; el.classList.remove('warn'); return; }
  const {unitPrice,piecesPerUnit,side}=_qtyCtx;
  const total=unitPrice*units;
  const pieces = piecesPerUnit>1 ? ` (${piecesPerUnit*units} pieces)` : '';
  el.textContent = `${units}×${pieces} · ${total}🪙`;
  el.classList.toggle('warn', side==='buy' && total>gold);
}
function qtyPick(units){
  if(!_qtyCtx)return;
  let u=Math.min(units, _qtyCtx.maxUnits);
  if(u<1){ showMsg(_qtyCtx.side==='buy'?'Not enough gold!':'Nothing to sell.','#cc4444'); return; }
  _qtyExecute(u);
}
function qtyPickMax(){ if(_qtyCtx) qtyPick(_qtyCtx.maxUnits); }
function qtyPickCustom(){
  if(!_qtyCtx)return;
  const v=parseInt(document.getElementById('qty-custom').value,10);
  if(!v||v<1){ showMsg('Enter a quantity.','#cc8844'); return; }
  qtyPick(v);
}
function _qtyExecute(units){
  if(!_qtyCtx)return;
  const ctx=_qtyCtx;
  if(ctx.side==='buy') _buyStackable(ctx.it, units, ctx.piecesPerUnit, ctx.unitPrice);
  else                 _sellStackable(ctx.it, ctx.bagIdx, units, ctx.unitPrice);
  closeQtyModal();
  renderShop();
}

let shopTab = 'all';
function setShopTab(name){
  shopTab = name;
  document.querySelectorAll('#sh-tabs .sh-tab').forEach(t=>t.classList.toggle('active', t.dataset.shtab===name));
  renderShop();
}

// Returns the slot key an equip item occupies, for like-to-like comparison.
// Weapons compare to EQ.weapon; armor compares to whatever fills its slot.
function _shopCompareSlot(it){
  if(it.type==='equip' && it.slot==='weapon') return 'weapon';
  if(it.type==='equip' && it.slot) return it.slot;
  return null;
}

// v67 (feature B) — comparison badge vs the player's equipped item in the same
// slot. LIKE-TO-LIKE ONLY: a bow's atk is intentionally low (arrows stack on
// top), so we only delta a bow against an equipped bow; a staff is compared on
// its spell-power bonus, not its melee swing; armor deltas on def. Returns an
// HTML fragment (possibly empty) appended after the stat text.
function _shopCompareBadge(it){
  const slot = _shopCompareSlot(it);
  if(!slot) return '';
  const cur = EQ[slot];
  // Weapons.
  if(slot==='weapon' && it.atk){
    const isBow   = it.weaponShape==='bow';
    const isStaff = it.weaponShape==='staff' || it.spellPower;
    // Staff: compare spell-power %, not melee. Only meaningful vs another staff.
    if(isStaff){
      const itSp  = (it.spellPower||1);
      const curSp = (cur && cur.spellPower) || (cur ? 1 : null);
      if(curSp===null) return '';            // bare-handed → nothing to compare
      const d = Math.round((itSp-curSp)*100);
      if(d>0) return ` <span class="sh-delta-up">▲+${d}% spell</span>`;
      if(d<0) return ` <span class="sh-delta-down">▼${d}% spell</span>`;
      return ` <span class="sh-delta-same">— spell</span>`;
    }
    // Bow: only delta against an equipped bow.
    if(isBow && !(cur && cur.weaponShape==='bow')) return '';
    if(!isBow && cur && cur.weaponShape==='bow') return '';   // don't cross-compare melee↔bow
    if(!cur || !cur.atk){
      // Nothing equipped (or bare hand) — show it as a gain in absolute terms.
      return ` <span class="sh-delta-up">▲ new</span>`;
    }
    const itAvg  = (it.atk[0]+it.atk[1])/2;
    const curAvg = (cur.atk[0]+cur.atk[1])/2;
    const d = Math.round(itAvg-curAvg);
    if(d>0) return ` <span class="sh-delta-up">▲+${d}</span>`;
    if(d<0) return ` <span class="sh-delta-down">▼${d}</span>`;
    return ` <span class="sh-delta-same">—</span>`;
  }
  // Armor / shield: delta on def (+ block for shields).
  if(it.type==='equip' && (it.def!==undefined || it.block!==undefined)){
    const itDef  = it.def||0;
    const curDef = (cur && cur.def) || 0;
    const d = itDef-curDef;
    if(!cur)    return ` <span class="sh-delta-up">▲ new</span>`;
    if(d>0) return ` <span class="sh-delta-up">▲+${d}</span>`;
    if(d<0) return ` <span class="sh-delta-down">▼${d}</span>`;
    return ` <span class="sh-delta-same">—</span>`;
  }
  return '';
}

// v67 (feature A) — bow/2H affordance note under the name. Two-handers warn
// they'll stow the offhand IF one is currently equipped; bows note whether
// the merchant has arrows in stock (checked against the rendered category).
function _shopAffordanceNote(it, stockItems){
  if(it.type!=='equip') return '';
  if(it.twoHand){
    if(it.weaponShape==='bow'){
      const hasArrows = stockItems.some(s=>s.type==='ammo' && s.ammoType==='arrow');
      if(!hasArrows) return `<span class="sh-note warn">Needs arrows — none in stock</span>`;
      return `<span class="sh-note">Ranged · arrows sold here</span>`;
    }
    if(EQ.offhand) return `<span class="sh-note warn">Two-handed · stows your ${EQ.offhand.name}</span>`;
    return `<span class="sh-note">Two-handed</span>`;
  }
  return '';
}

// Shared row builder for both panels. side='buy' (merchant) or 'sell' (bag).
// fullStock is the merchant's full category-filtered stock, passed so the bow
// affordance note can check arrow availability.
function shopRowHTML(it, side, priceVal, affordable, locked, fullStock){
  const tierCol = it.type==='equip' && it.matCol ? '#'+it.matCol.toString(16).padStart(6,'0') : '';
  const tierPip = tierCol ? `<span class="sh-tier-pip" style="background:${tierCol}"></span>` : '';
  const ench    = it.type==='equip' && it.enchant ? '<span class="sh-ench-mark">✦</span>' : '';
  const twoH    = it.twoHand ? ' <span class="sh-2h">2H</span>' : '';
  // v68 — bundle size for stackables (e.g. arrows sold 12 at a time). Shown as
  // "×12" so the player knows one purchase = a bundle of 12, not a single item.
  const qty     = it.qty>1 ? ` <span class="sh-bundle">×${it.qty}</span>` : '';
  // v68 — buy-back tag: items the player previously sold to this merchant.
  const bbTag   = it._boughtBack ? ' <span class="sh-bb">(sold)</span>' : '';
  let stat = itemStatShort(it) || '';
  // Comparison + affordance only on the merchant (buy) side — the bag side is
  // your own goods, so a "vs equipped" delta there would be noise.
  let note = '';
  if(side==='buy'){
    stat += _shopCompareBadge(it);
    note  = _shopAffordanceNote(it, fullStock);
    /* v80 S451 — a piece you can't wear was only dimmed; the row now says why (canEquip's own words) */
    if(locked){ const req=canEquip(it); if(!req.ok&&req.msg) note += `<span class="sh-note warn">${req.msg}</span>`; }
  }
  const wt    = itemWeight(it);
  const priceCol = side==='buy' && !affordable ? '#6a5230' : (side==='sell' ? '#6ed36e' : '#c8a84a');
  return `
    <span class="sh-col-name">${tierPip}<span class="sh-ico2">${iconHTML(it)}</span><span class="sh-name-text">${it.name}</span>${ench}${twoH}${qty}${bbTag}${note}</span>
    <span class="sh-col-stat">${stat}</span>
    <span class="sh-col-wt">${wt?wt.toFixed(1):'—'}</span>
    <span class="sh-col-price" style="color:${priceCol}">${priceVal}🪙</span>`;
}

// v80 S333 — the next-tier piece. Equipment: the stock's best piece (first of the highest tier) made one material up.
// Tonics: the first of the best tier's lines one strength up. Food and oddments with no tier: nothing.
const CHA_MERCHANT_PTS=5;
function _chaExtraItem(stock, cha){
  if((cha||0)<CHA_MERCHANT_PTS||!stock||!stock.length)return null;
  const has=n=>stock.some(s=>s.name===n);
  let best=null;
  stock.forEach(it=>{if(it.type==='equip'&&it.tier&&!it.enchant&&!it.torchType&&(!best||it.tier>best.tier))best=it;});
  if(best&&best.tier<MATERIALS.length){
    const typeName=best.weaponType||best.name.slice(best.material.length+1);
    const w=WEAPON_TYPES.find(t=>t.type===typeName), a=!w&&ARMOR_TYPES.find(t=>t.type===typeName);
    if(w||a){const x=makeItem(best.tier+1,w||a,null,!w);if(!has(x.name))return Object.assign(x,{_chaExtra:true});}
    return null;
  }
  let bp=null;
  stock.forEach(it=>{if(it.type==='potion'&&it._tier&&it._line&&(!bp||it._tier>bp._tier))bp=it;});
  if(bp){
    const lvl=['mild','strong','master'][bp._tier];
    const nx=lvl&&(typeof makePotion==='function')&&makePotion(`${bp._line}_${lvl}`);
    if(nx&&!has(nx.name))return Object.assign(nx,{_chaExtra:true});
  }
  return null;
}
function renderShop(){
  document.getElementById('sh-gold-val').textContent=gold;
  // Stock list
  const stockTable=currentHouse.id&&currentHouse.id.startsWith('ih')?IH_SHOP_STOCK:SHOP_STOCK;
  let stock=stockTable[currentHouse.type]||stockTable.misc||SHOP_STOCK.misc;
  // v61ad: post-Q7, Dagna ("War Supplies", Ironhaven ih2) opens her back-room
  // stock to commissioned players — the full Master tier lineup beyond what
  // she normally keeps front-of-house. Spread into a new array so we don't
  // permanently mutate IH_SHOP_STOCK (which would persist across shop opens).
  if(worldState.commissioned && currentHouse.id==='ih2' && typeof POTIONS!=='undefined'){
    const extra=[];
    ['regen_mp','regen_st','swift'].forEach(base=>{
      const master = POTIONS[`${base}_master`];
      if(master) extra.push({...master, effect:{...master.effect}});
    });
    if(extra.length) stock=[...stock, ...extra];
  }
  // v61au: Charisma-gated stock (chaReq). No-op until items carry the field.
  const _cha = ATTRS.charisma||0;
  stock = stock.filter(it => !it.chaReq || _cha >= it.chaReq);
  // v80 S333 — Charisma's merchant access (Michael's A on #58): at 5 points a merchant shows one piece from the tier above its best.
  const _chaX = _chaExtraItem(stock, _cha);
  if(_chaX) stock = [...stock, _chaX];

  // v68 — merge this merchant's buy-back overlay onto the native stock. These
  // are items the player previously sold here, re-priced to what they got.
  const _bb = merchantStock[_merchantKey()];
  if(_bb && _bb.length) stock = [...stock, ..._bb];

  // v67 — category filter shared with the bag panel. `fullStock` (unfiltered
  // by tab) is kept so the bow affordance note can still see arrow stock even
  // when the player is on the Weapons tab.
  const fullStock = stock;
  const stockFiltered = shopTab==='all' ? stock : stock.filter(it=>itemCategory(it)===shopTab);

  const stockEl=document.getElementById('sh-stock');
  stockEl.innerHTML='';
  if(!stockFiltered.length){
    stockEl.innerHTML=`<div class="sh-empty2">Nothing in this category.</div>`;
  } else {
    stockFiltered.forEach((it)=>{
      const div=document.createElement('div');div.className='sh-row';
      const _c=shopCost(it);const afford=gold>=_c;
      let locked=false;
      if(it.type==='equip'){ const req=canEquip(it); if(!req.ok) locked=true; }
      if(!afford) div.className+=' sh-row-unaffordable';
      if(locked)  div.className+=' sh-row-locked';
      div.innerHTML=shopRowHTML(it,'buy',_c,afford,locked,fullStock);
      // v68 — stackables open the quantity prompt; everything else buys on click.
      if(afford){
        if(isStackable(it)) div.onclick=()=>openQtyModal(it,'buy',-1);
        else div.onclick=()=>buyItem(it);
      } else div.title='Not enough gold';
      stockEl.appendChild(div);
    });
  }

  // Bag list (sell side), same tab filter.
  const bagEl=document.getElementById('sh-bag');
  bagEl.innerHTML='';
  const bagIndexed = BAG.map((it,i)=>({it,i}));
  const bagFiltered = shopTab==='all' ? bagIndexed : bagIndexed.filter(({it})=>itemCategory(it)===shopTab);
  // Bag weight readout in the panel head.
  const _bw=document.getElementById('sh-bag-wt');
  if(_bw){ const tw=totalCarryWeight(), mx=maxCarry(); _bw.textContent=`${tw.toFixed(1)} / ${mx.toFixed(0)} wt`; }
  if(!bagFiltered.length){
    bagEl.innerHTML = `<div class="sh-empty2">${BAG.length ? 'Nothing in this category.' : 'Your bag is empty.'}</div>`;
    return;
  }
  bagFiltered.forEach(({it,i})=>{
    const sp=counterSellPrice(it);
    const div=document.createElement('div');div.className='sh-row';
    div.innerHTML=shopRowHTML(it,'sell',sp,true,false,fullStock);
    // v68 — stackables with more than one bundle's worth open the sell prompt;
    // single items (and single-unit stacks) sell on click.
    if(isStackable(it) && (it.qty||1) > 1) div.onclick=()=>openQtyModal(it,'sell',i);
    else div.onclick=()=>sellItem(i,sp);
    bagEl.appendChild(div);
  });
}
function itemDesc(it){
  if(it.type==='potion'&&it.heal)return`+${it.heal} HP`;
  if(it.type==='potion'&&it.mana)return`+${it.mana} MP`;
  if(it.type==='potion'&&it.stam)return`+${it.stam} Stamina`;
  // v61x: effect-shaped potions — describe the buff in shop listings and inline
  // descriptions. Keeps the vocabulary consistent with itemStatShort above.
  if(it.type==='potion'&&it.effect){
    const e = it.effect;
    const dur = e.duration ? ` for ${e.duration}s` : '';
    if(e.type==='hpRegen')     return `+${e.rate} HP/s${dur}`;
    if(e.type==='mpRegen')     return `+${e.rate} MP/s${dur}`;
    if(e.type==='stRegen')     return `+${e.rate} Stamina/s${dur}`;
    if(e.type==='dmgReduce')   return `${e.pct}% damage reduction${dur}`;
    if(e.type==='sprintSpeed') return `+${e.pct}% sprint speed${dur}`;
    return 'Elixir';
  }
  if(it.type==='book'){
    const def=BOOKS.find(b=>b.id===it.bookId);
    if(!def)return'Book';
    const read=booksRead.has(def.id);
    const attrLbl=(typeof ATTR_DEF!=='undefined'&&ATTR_DEF[def.attr])?ATTR_DEF[def.attr].label:def.attr;
    return read?`Skill book (already read)`:`Skill book · +1 ${attrLbl} on read`;
  }
  if(it.type==='equip'&&it.atk){
    const wlbl=['','Light','Medium','Heavy'][it.weight||2]||'';
    const tierStr=it.material?` · Tier ${it.tier} ${it.material}`:'';
    const ench=it.enchant?` · ${it.enchant.name}`:'';
    const wt = it.wType || (it.weaponShape && WSHAPE_TO_WTYPE[it.weaponShape]) || '';
    const wtLbl = wt ? ` · ${wt.charAt(0).toUpperCase()+wt.slice(1)}` : '';
    return`ATK ${it.atk[0]}–${it.atk[1]}`+wtLbl+(wlbl?` · ${wlbl}`:'')+tierStr+ench;
  }
  // Shield branch FIRST — shields may now carry both block AND def; show both
  if(it.type==='equip'&&it.block!==undefined){
    const tierStr=it.material?` · Tier ${it.tier} ${it.material}`:'';
    const ench=it.enchant?` · ${it.enchant.name}`:'';
    const defStr=it.def?` · DEF +${it.def}`:'';
    return`Block ${Math.round(it.block*100)}%`+defStr+tierStr+ench;
  }
  if(it.type==='equip'&&it.def!==undefined){
    const tierStr=it.material?` · Tier ${it.tier} ${it.material}`:'';
    const ench=it.enchant?` · ${it.enchant.name}`:'';
    return`DEF +${it.def}`+tierStr+ench;
  }
  if(it.type==='equip'&&it.enchant)return it.enchant.name; // no def/block — enchant only (shouldn't happen with new defMults)
  // v64 — Ammo (arrows). Describe arrow contribution + type. Bundle qty is
  // shown in the bag UI separately via the existing qty display.
  if(it.type==='ammo' && it.arrowDmg){
    const tierStr = it.material ? ` · Tier ${it.tier} ${it.material}` : '';
    const wt = it.wType || 'pierce';
    const wtLbl = ` · ${wt.charAt(0).toUpperCase()+wt.slice(1)}`;
    return `+${it.arrowDmg[0]}–${it.arrowDmg[1]} arrow damage${wtLbl}${tierStr}`;
  }
  return it.type;
}
// v80 S169 — the town's price at the counter: indoors the house's own town (the room's coordinates are no place on the
// map), outdoors the nearest town. Prosperity and the faction discount. A bought-back item keeps what you were paid for it.
function shopMul(){try{if(typeof WORLD==='undefined')return 1;
  if(typeof isInterior==='function'&&isInterior()){return (typeof currentHouse!=='undefined'&&currentHouse&&currentHouse.siteId)?WORLD.priceMulAt(currentHouse.siteId):1;}
  return activeZoneId==='world'?WORLD.priceMulHere():1;}catch(e){return 1;}}
// S339 (Michael's A on #61) — Charisma's barter, as its card says: 1% a point off what you pay and on what you're paid
// at a counter, up to a quarter. A bought-back item keeps the price you were paid for it, so the two can't be played
// against each other.
const BARTER_PCT=.01,BARTER_MAX=.25;
function barterPct(){return Math.min(BARTER_MAX,Math.max(0,(ATTRS.charisma||0)*BARTER_PCT));}
function shopCost(it){const b=it.buyPrice||0;if(it._boughtBack||b<=0)return b;return Math.max(1,Math.round(b*shopMul()*(1-barterPct())));}
function counterSellPrice(it){const sp=sellPrice(it);return sp<=0?0:Math.max(1,Math.round(sp*(1+barterPct())));}
function buyItem(it){
  const _cost=shopCost(it); // v80 O — prosperity sets the price
  if(gold<_cost){showMsg('Not enough gold!','#cc4444');return;}
  if(!canCarry(it)){showMsg('Too heavy to carry!','#cc8844');return;}
  gold-=_cost;
  // Copy all relevant fields — new item system uses spread, keep qty/sellMult clean.
  // v64 — Respect template qty when >1 (used by arrow bundles: a single 2g
  // purchase yields 12 Iron Arrows). Non-stackable items always reset to 1
  // even if a template included qty, to defend against accidental ghost-qty
  // on weapons/armor.
  const _bundleQty = (isStackable(it) && it.qty && it.qty > 1) ? it.qty : 1;
  const item={...it,qty:_bundleQty};
  // S366 — the copy keeps its price, so it sells at price × sellMult like one found in a chest (the critic's s321: the price
  // was deleted here, and a sword bought for 35 sold for its type's 5, a potion for 8, arrows for 5 a piece). A bought-back
  // piece goes back to the price it had before it was sold.
  if(it._boughtBack){if(it._bagPrice!=null)item.buyPrice=it._bagPrice;else delete item.buyPrice;}
  delete item._boughtBack;delete item._bagPrice; // it's the player's again, not shop overlay
  bagAdd(item);
  // v68 — if this was a bought-back item, remove it from the merchant overlay.
  if(it._boughtBack) _consumeBuyBack(it, _bundleQty);
  lvAct.transactions++;
  sndBuyItem(it);
  showMsg(`Bought ${it.name} for ${_cost}🪙`,'#c8a84a');
  renderShop();
}
function sellItem(i,sp){
  const it=BAG[i];if(!it)return;
  // v61d0 — Generalize unique-item sell protection. Mirrors the destroy gate
  // in renderHubInv (line ~14233). Catches Forge-Man's Hammer, Edna's
  // Rubbing, Royal Mage Commission, The Faolchú's Mark, plus future named-
  // antibody trophies. Aldwyn's Seal explicit-named for retro-protection
  // (same pattern as destroy). Pre-v61d0 the Mark sold for 400g — the only
  // unique item with non-zero sellMult — making it tempting to lose before
  // the Aldwyn dialog beat that depends on it.
  if(it && (it.unique || it.name==="Aldwyn's Seal")){
    showMsg(`${it.name} cannot be sold.`, '#c8a84a');
    return;
  }
  if(it.type==='cargo'){showMsg(`A harbour's factor buys trade goods, not a shop.`,'#c8a84a');return;} // S390
  if(!(sp>0)){showMsg(`${it.name} is not worth a coin at the counter.`,'#c8a84a');return;} // S366 — a single arrow
  const finalSp=Math.round(sp*_buffMult('goldFind',1));
  gold+=finalSp;(worldState.stats||(worldState.stats={})).sold=((worldState.stats||{}).sold||0)+1;(worldState.stats||{}).goldIn=((worldState.stats||{}).goldIn||0)+finalSp;
  // v68 — buy-back: offer one unit of the sold item back to this merchant at the
  // price the player received. Stamp a single-unit copy (so a one-arrow sell
  // doesn't drop a 12-bundle into buy-back).
  _pushBuyBack({...it, qty:1}, finalSp);
  it.qty--;if(it.qty<=0)BAG.splice(i,1);
  lvAct.transactions++;
  sndGoldJingle();
  if(currentHouse)addLog('🏪','Sold items at '+currentHouse.name);
  showMsg(`Sold ${it.name} for ${finalSp}🪙`,'#44ee44');
  renderShop();
}

// v68 — bulk stackable buy. units × piecesPerUnit = total pieces added; each
// unit costs unitPrice. Clamps to gold and carry weight; consumes buy-back.
function _buyStackable(it, units, piecesPerUnit, unitPrice){
  let bought=0, spent=0;
  const template={...it};
  if(it._boughtBack){if(it._bagPrice!=null)template.buyPrice=it._bagPrice;else delete template.buyPrice;} // S366 — keep the price, as buyItem
  delete template._boughtBack; delete template._bagPrice;
  for(let n=0;n<units;n++){
    if(gold-spent < unitPrice) break;
    const piece={...template, qty:piecesPerUnit};
    if(!canCarry(piece)) break;
    bagAdd(piece);
    spent+=unitPrice; bought++;
    if(it._boughtBack) _consumeBuyBack(it, piecesPerUnit);
  }
  if(bought===0){
    showMsg(gold<unitPrice?'Not enough gold!':'Too heavy to carry!', '#cc8844');
    return;
  }
  gold-=spent;
  lvAct.transactions++;
  sndBuyItem(it);
  const totalPieces = piecesPerUnit>1 ? piecesPerUnit*bought : bought;
  showMsg(`Bought ${totalPieces}× ${it.name} for ${spent}🪙`,'#c8a84a');
  if(bought<units) showMsg(`(stopped at ${bought<units?totalPieces:units} — ${gold<unitPrice?'out of gold':'too heavy'})`,'#cc8844');
}

// v68 — bulk stackable sell. units = pieces to sell (unit = 1 piece here),
// each worth unitPrice. Offers the sold pieces back to the merchant.
function _sellStackable(it, bagIdx, units, unitPrice){
  const live=BAG[bagIdx];
  if(!live || live.name!==it.name){ renderShop(); return; }  // bag shifted; bail
  if(live.unique || live.name==="Aldwyn's Seal"){ showMsg(`${live.name} cannot be sold.`,'#c8a84a'); return; }
  if(live.type==='cargo'){ showMsg(`A harbour's factor buys trade goods, not a shop.`,'#c8a84a'); return; } // S390
  const sellPieces=Math.min(units, live.qty||1);
  if(sellPieces<=0) return;
  const gain=unitPrice*sellPieces;
  gold+=gain;
  _pushBuyBack({...live, qty:sellPieces}, unitPrice); // buy-back priced per piece
  live.qty-=sellPieces;
  if(live.qty<=0) BAG.splice(bagIdx,1);
  lvAct.transactions++;
  sndGoldJingle();
  if(currentHouse)addLog('🏪','Sold items at '+currentHouse.name);
  showMsg(`Sold ${sellPieces}× ${it.name} for ${gain}🪙`,'#44ee44');
}

function getLootItem(){return rollLoot(currentPortal?currentPortal.diffScale:null, currentPortal?currentPortal.theme:null);}
// v61c0: fallback loot uses the scaled gold roller. Previously hardcoded
// to value:12, which was middle-of-the-road for the old system but no
// longer reflects level/Fortune scaling. Now matches the corpse-tier
// roll since fallbacks fire when dungeon-mob loot rolls fail.
const LOOT_FALLBACK=[{name:'Health Potion',ico:'🧪',type:'potion',heal:25},{name:'Gold Coins',ico:'🪙',type:'gold',value:rollGold('corpse')}];
// Cached armor enchant bonuses — recomputed only when equipment changes
let _armorBonusCache=null;
let _armorBonusDirty=true;
function invalidateArmorCache(){_armorBonusDirty=true;}
function getArmorEnchantBonuses(){
  if(!_armorBonusDirty&&_armorBonusCache)return _armorBonusCache;
  const b={hpRegen:0,stRegen:0,mpRegen:0,maxHPBonus:0,maxManaBonus:0,maxStaminaBonus:0,
           mightBonus:0,fortitudeBonus:0,finesseBonus:0,swiftnessBonus:0,intBonus:0};
  Object.values(EQ).forEach(it=>{
    if(it&&it.enchantStats){for(const[k,v] of Object.entries(it.enchantStats))if(b[k]!==undefined)b[k]+=v;}
  });
  _armorBonusCache=b;_armorBonusDirty=false;
  return b;
}
// v80 S335 — an attribute's points with the worn fortify enchants (of Might, of Intellect, the Sigil-Reader's +3 INT). Every
// effect reads this; the gates (what you may equip, the spells you may learn) and the level-up read the points you own.
function attrEff(k){const b={might:'mightBonus',fortitude:'fortitudeBonus',finesse:'finesseBonus',swiftness:'swiftnessBonus',intelligence:'intBonus'}[k];return (ATTRS[k]||0)+(b?(getArmorEnchantBonuses()[b]||0):0);}
// Effective max stat helpers — base + armor enchant bonuses (a fortified Fortitude or Intelligence adds what a point of it adds)
function effMaxHP(){const b=getArmorEnchantBonuses();return maxHP+(b.maxHPBonus||0)+10*(b.fortitudeBonus||0);}
function effMaxMana(){const b=getArmorEnchantBonuses();return maxMana+(b.maxManaBonus||0)+10*(b.intBonus||0);}
function effMaxStamina(){const b=getArmorEnchantBonuses();return maxStamina+(b.maxStaminaBonus||0)+5*(b.fortitudeBonus||0);}

// Returns {tag, col} for the caller to render alongside its hit message, or null.
// v61k: no longer calls showMsg directly — doing so raced with the caller's own
// showMsg on the same tick and the enchant toast was silently overwritten before
// rendering. Life Drain/Fire/Frost were firing the whole time (HP, stagger, mana
// were all applying); only the confirmation toast was invisible.
function applyWeaponEnchant(dmg,e){
  const w=EQ.weapon;if(!w||!w.enchant)return null;
  const eff=w.enchant.effect(dmg);
  if(eff.extraDmg>0){e.hp=Math.max(0,e.hp-eff.extraDmg);e.hpFg.scale.x=e.hp/e.maxHp;e.hpFg.position.x=(e.hp/e.maxHp-1)*.275;}
  if(eff.extraType==='frost'&&eff.stagger)staggered.push({e,t:eff.stagger});
  if(eff.healPlayer)PHP=Math.min(effMaxHP(),PHP+eff.healPlayer);
  if(eff.stealStam)stamina=Math.min(effMaxStamina(),stamina+eff.stealStam);
  if(eff.gainMana)mana=Math.min(effMaxMana(),mana+eff.gainMana);
  const amt=eff.extraDmg||eff.healPlayer||eff.stealStam||eff.gainMana;
  if(!amt)return null;
  const col=w.enchant.col?'#'+w.enchant.col.toString(16).padStart(6,'0'):'#aaaaff';
  return {tag:`${eff.msg} +${amt}!`,col};
}
