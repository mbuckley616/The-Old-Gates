
// ── SHOP ────────────────────────────────────────────────────
function openShop(){
  if(!currentHouse)return;
  if(typeof WORLD!=='undefined'&&WORLD.refusesTrade&&WORLD.refusesTrade(currentHouse)){showMsg(`${currentHouse.keeper||'The keeper'}: “I know what you did. Take your custom elsewhere.”`,'#e8a880');return;} // S156
  _releasePointerLockForMenu();
  shopOpen=true;
  const el=document.getElementById('shop');
  el.style.display='flex';
  document.getElementById('sh-title').textContent=currentHouse.name;
  document.getElementById('sh-sub').textContent=currentHouse.tagline?`${currentHouse.keeper} · ${currentHouse.tagline}`:(currentHouse.keeper||''); /* S1875 — no tagline, no dot */
  setShopTab('all'); // v67 — reset category each open; setShopTab calls renderShop
  {let fb=document.getElementById('sh-forge');const on=typeof forgeHere==='function'&&forgeHere(); /* S1494 — a smith's room: the forge */
    if(on&&!fb){fb=document.createElement('button');fb.id='sh-forge';fb.className='sh-tab';fb.textContent='Forge';fb.onclick=()=>openForgePage();document.getElementById('sh-tabs').appendChild(fb);}
    if(fb)fb.style.display=on?'':'none';}
}
function closeShop(){
  shopOpen=false;
  if(!isInterior())currentHouse=null; // v80 — outdoor merchants set currentHouse only for the shop's lifetime
  closeQtyModal(); // v68 — dismiss any open quantity prompt
  document.getElementById('shop').style.display='none';
  G.focus();
}

// S1644 — the ring's gold (arenas-build.md, "Purse, stake, bribe": each one named action, so a host can apply and send it on). A stake
// is taken from your purse into the open stake (worldState.arena.stake, the character's) and settled once: back ×mult on a win (a brawl's
// 2, your stake and theirs), kept on a loss. A purse is paid straight.
function placeStake(n,what){n=Math.round(n);if(!(n>0)||gold<n)return false;gold-=n;arenaState().stake={n,what:what||null,day:dayNow()};if(typeof updateHUD==='function')updateHUD();return true;}
function settleStake(won,mult){const A=arenaState(),S=A.stake;if(!S)return 0;A.stake=null;const back=won?Math.round(S.n*(mult||1)):0;gold+=back;if(typeof updateHUD==='function')updateHUD();return back;}
function payPurse(n){n=Math.max(0,Math.round(n));gold+=n;if(typeof updateHUD==='function')updateHUD();return n;}
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
  if(typeof container.id==='string'&&container.id.startsWith('wreck:')&&typeof wreckVisit==='function')wreckVisit(container.id.slice(6)); /* S1743 — a wreck opened, for the Weaver's shuttle (86-world-crime.js) */
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
    if(it.gateOrb!=null){takeGateOrb(it.gateOrb);delete it.gateOrb;} /* S1858 — a gate's orb, taken once */
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
  if(currentLootContainer._keepSite&&typeof keepSiteChest==='function')keepSiteChest(currentLootContainer); /* S700 — a lair's Hoard or a camp's Takings keeps what is left */
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
// S1733 — in her hold with an arms rack fitted, the sea chest's panel turns to the rack: weapons only, three at most (rackPut/rackTake)
let stashMode='chest';
function stashRackToggle(){stashMode=stashMode==='rack'?'chest':'rack';renderStash();}
function renderRack(){const R=shipRack(),bagEl=document.getElementById('sp-bag-list'),rEl=document.getElementById('sp-stash-list');
  const row=(it,fn)=>{const div=document.createElement('div');div.className='lp-item';
    div.innerHTML=`<span class="lp-ico">${iconHTML(it)}</span><div class="lp-info"><div class="lp-name">${it.name}</div><div class="lp-desc">${lootItemDesc(it)}</div></div>`;div.onclick=fn;return div;};
  const say=r=>{if(r!==true)showMsg(r,'#cc8844');renderStash();};
  bagEl.innerHTML='';const ws=BAG.map((it,i)=>[it,i]).filter(([it])=>it&&it.type==='equip'&&it.slot==='weapon');
  if(!ws.length)bagEl.innerHTML='<div class="sp-empty">No weapons in your bag.</div>';else ws.forEach(([it,i])=>bagEl.appendChild(row(it,()=>say(rackPut(i)))));
  rEl.innerHTML='';if(!R.length)rEl.innerHTML='<div class="sp-empty">The rack is empty.</div>';else R.forEach((s,j)=>rEl.appendChild(row(rackItem(s),()=>say(rackTake(j)))));
  document.getElementById('sp-bag-meta').textContent=`${ws.length} weapon${ws.length===1?'':'s'} · ${bagWeight().toFixed(1)}/${maxCarry()} kg`;
  document.getElementById('sp-stash-meta').textContent=`${R.length} of ${SHIP_RACK_N}`;}
function openStash(){
  _releasePointerLockForMenu();
  stashOpen=true;stashMode='chest';
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
  const rk=typeof rackHere==='function'&&rackHere();if(!rk)stashMode='chest';const rack=stashMode==='rack',el=id=>document.getElementById(id); /* S1733 */
  if(el('sp-rack')){el('sp-rack').style.display=rk?'':'none';el('sp-rack').textContent=rack?'The sea chest':'The arms rack';}
  if(el('sp-title'))el('sp-title').textContent=rack?'The Arms Rack':'The Stash';if(el('sp-stash-h'))el('sp-stash-h').textContent=rack?'The Rack':'The Stash';
  if(el('sp-sub'))el('sp-sub').textContent=rack?`Click a weapon to move it. ${SHIP_RACK_N} weapons at most; if boarders land while your hands are empty, the first is drawn for you.`:'Click an item to move it. Bag → Stash on the left, Stash → Bag on the right.';
  if(rack){renderRack();return;}
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
  if(it.quest&&typeof GREAT_TOOLS!=='undefined'&&GREAT_TOOLS[it.artifact]){showMsg(`${it.name} cannot be stashed.`,'#c8a84a');return;} /* S1353 — the knife and the needle stay with you */
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
    const ex=stashBag.find(b=>sameStack(b,item));
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
// S497 — the calendar the world keeps (Michael's C on DECISION #132, part B; docs/design/journal-and-calendar.md): a week of
// seven days, a day to each god, months of 28 days so a weekday keeps its dates, twelve months in four seasons of three (the
// year turns with the first month, spring), a tale begun on the first day of the first autumn month.
// S549 — the names are the quest writer's (docs/quest_drafts.md, *The Year's Names*; Michael's A on DECISION #146): the
// week runs out from the hearth to the Guest, so the rent on the week's first day falls on Hearthday; each day keeps its
// deep (Irish) and institutional (Church, Crown) forms, the date line speaks the common one; the months are named for the
// year's work; the years are counted from the Peace, the 27th at a tale's start. They live in this one table.
const CAL={days:[{god:'teallach',name:'Hearthday',deep:'Lá an Teallaigh',inst:'le jour de l’Âtre'},{god:'cloch',name:'Stoneday',deep:'Lá na Cloiche',inst:'le jour de la Pierre'},{god:'beithigh',name:'Beastday',deep:'Lá na mBeithíoch',inst:'le jour des Bêtes'},{god:'muir',name:'Seaday',deep:'Lá na Mara',inst:'le jour de la Mer'},{god:'speir',name:'Skyday',deep:'Lá na Spéire',inst:'le jour du Ciel'},{god:'fiodoir',name:'Weaverday',deep:'Lá an Fhíodóra',inst:'le jour du Tisserand'},{god:'guest',name:'Guestday',deep:'Lá an Aoi',inst:'le Jour Clos'}],
  monthNames:['Thaw','Lambing','Sowing','Shearing','Haysel','Highsun','Reaping','Leaffall','Culling','Longnight','Wolfmonth','Lean'],
  monthLen:28,months:12,seasons:['spring','summer','autumn','winter'],startMonth:6,startYear:27,era:'the Peace'};
function calDay(at){
  const abs=at!=null?at:((worldState&&worldState.gameTimeAbsMinutes)||0);const n=Math.floor(Math.max(0,abs)/1440);
  const wd=n%CAL.days.length,mAbs=CAL.startMonth+Math.floor(n/CAL.monthLen),month=mAbs%CAL.months;
  return {n,weekday:wd,day:CAL.days[wd],god:CAL.days[wd].god,dom:n%CAL.monthLen+1,month,season:CAL.seasons[Math.floor(month/3)],year:CAL.startYear+Math.floor(mAbs/CAL.months)};
}
// S550 — the four feasts, one a season, each a day long (the rules are Michael's C on DECISION #132: the inn's meal is
// free and a petty crime's fine is halved that day; the names, dates and lines are the quest writer's drafted set, Michael's
// A on #146). Fixed to a date, so always to the same weekday. greet replaces a townsperson's stock greeting that day; inn
// comes before the innkeeper's room offer; fine follows a guard's halt when the fine was halved (the Old Blood keep no watch).
const FEASTS=[
  {key:'kindling',name:'The Kindling',month:0,dom:1,ico:'🔥',due:'every hearth lit from the square’s fire, and the year turns.',
    greet:{gatelander:'A good Kindling to you. Take a brand from the square before you go — a house that’s cold on the year’s first day stays cold till the next.',
      markman:'Kindling. Fire’s in the square. Take some, it’s free.',
      aurennais:'A fair Kindling to you, if you’ll have it. The houses close their books today; what is owed is struck or carried over, and either way it is written.',
      oldblood:'The Kindling. We said tine úr. New fire. The old one is let die first. People forget that half.'}},
  {key:'longlight',name:'The Long Light',month:5,dom:19,ico:'☀',due:'the races, the yard, and the charters at noon.',
    greet:{gatelander:'It’s the Long Light, and a day that long is wasted on work. The horses run at noon. You’ll know the winner by who’s buying.',
      markman:'Long Light. Yard’s open to anyone. Mind you walk off it.',
      aurennais:'The Long Light, Master. The houses seal the year’s charters at noon. After that, I am told, nobody is bound to anything until dark.',
      oldblood:'An Spéir’s feast. We watched it go down, and stayed to see it come back. That was the whole of it.'}},
  {key:'giving',name:'The Giving',month:6,dom:23,ico:'🪨',due:'the year’s dead named at the old gate.',
    greet:{gatelander:'It’s the Giving. Whoever we lost this year, we walk out to the old gate and say their names to it. A long road for a short word, but the dead were never in a hurry.',
      markman:'Giving day. Names said at the gate. Mine are said. Yours?',
      aurennais:'The Giving, Master. The Church commits the year’s dead to the gates this morning, and the gates, we are taught, hold them in trust.',
      oldblood:'The Giving. My grandmother would not go. She said the old word for it once, and then she would not say what it meant.'}},
  {key:'emptychair',name:'The Empty Chair',month:9,dom:28,ico:'🪑',due:'a place set, and the door off the latch till dawn.',
    greet:{gatelander:'The Empty Chair tonight. There’s a place set and the door’s off the latch. Nobody’s ever sat in it, mind. That was never the point of a chair.',
      markman:'Empty Chair. No door’s shut tonight. Not even to you.',
      aurennais:'The Church does not keep tonight, Master, and so neither does this house. What a house does behind its own shutters is, I am given to understand, its own affair.',
      oldblood:'Oíche an Aoi. The Guest’s night. Set the chair. Don’t wait up.'}}];
const FEAST_INN={gatelander:'There’s no charge for the meal today. A feast you pay for is only a dinner.',markman:'Meal’s free. Feast day. Sit.',
  aurennais:'The meal is the house’s today, Master, by custom. The room, regrettably, is not.',oldblood:'Eat. There’s no price on it today.'};
const FEAST_FINE={gatelander:'It’s a feast, so it’s half. Don’t make me sorry I said it.',markman:'Feast day. Half. Once.',aurennais:'A feast-day remission: half the fine. It is entered nonetheless.'};
function feastOn(at){const c=calDay(at);return FEASTS.find(f=>f.month===c.month&&f.dom===c.dom)||null;}
function nextFeast(at){const now=at!=null?at:((worldState&&worldState.gameTimeAbsMinutes)||0),d0=Math.floor(Math.max(0,now)/1440);
  for(let d=d0;d<d0+CAL.monthLen*CAL.months;d++){const f=feastOn(d*1440);if(f)return {f,at:d*1440};}return null;}
function feastGreeting(def){if(!def||!def._siteId)return null;const f=feastOn();return f?(f.greet[def.people]||f.greet.gatelander):null;}
function calOrd(d){return d+((d%10===1&&d%100!==11)?'st':(d%10===2&&d%100!==12)?'nd':(d%10===3&&d%100!==13)?'rd':'th');}
// S498 — the calendar's own date, *Seaday, the 4th of Reaping* (the Due view, a map note, the hour you wake on the rest slip)
function calDateLine(at){const c=calDay(at);return `${c.day.name}, the ${calOrd(c.dom)} of ${CAL.monthNames[c.month]}`;}
// S486/S549 — the one date line (docs/quest_drafts.md §4). at, tod: a stamp's minute and time of day; none, now. form:
// 'full' (the default: the sleep panel, the waking line) *Hearthday, the 1st of Reaping, in the 27th year of the Peace · 7:40 am*;
// 'date', the same with no time (the journal's day heading); 'day', calDateLine's; 'short' (a save slot, a journal line's
// stamp) *Hearthday 1 Reaping · 7:40 am*; 'time', the time alone.
function gameDateLine(at,tod,form){
  const abs=at!=null?at:((worldState&&worldState.gameTimeAbsMinutes)||0);
  const m=(tod!=null?tod:at!=null?at:((worldState&&worldState.gameTimeMinutes)||0))%1440;const hh=Math.floor(m/60),mm=Math.floor(m%60);
  const time=`${((hh+11)%12)+1}:${String(mm).padStart(2,'0')} ${hh<12?'am':'pm'}`;if(form==='time')return time;
  const c=calDay(abs);if(form==='day')return calDateLine(abs);
  if(form==='short')return `${c.day.name} ${c.dom} ${CAL.monthNames[c.month]} · ${time}`;
  const date=`${calDateLine(abs)}, in the ${calOrd(c.year)} year of ${CAL.era}`;return form==='date'?date:`${date} · ${time}`;
}
function isGodsDay(god,at){return !!god&&calDay(at).god===god;}
// S532 — the rest slip (Michael's A on #142): one slip for a bed and for waiting. The day is drawn as a band from noon to
// noon, NOW and the hour you wake marked on it; a slider of 1–24 hours and today's five times as marks (keys 1–5) that set
// it to that hour exactly; what the rest gives, by restAtBed's rule, before you take it. Waiting goes by any number of
// hours (it went only to the five times); it restores nothing, and only sleep takes the level.
// S2085 — camp and rest B's first part, A's beds by grade (Michael on #1378, docs/design/camp-and-rest.md): each bed has a comfort,
// and six hours or more in one of comfort 2 or 3 leaves you Rested (skill gain ×1.10) for 45 game hours, 4 or 5 Well rested (×1.15, and
// stamina regeneration ×1.10) for 90; the clock runs a game hour to the real minute, so 45 and 90 real minutes. A bed the page does not
// name (a tower's, a room's that is no inn's, home's or guild's) is 3, the berth's. The state is the character's (worldState.rested).
const REST_BED={camp:{c:1,n:'Camp bedroll'},cot:{c:1,n:'Fort cot'},berth:{c:3,n:'Ship’s berth'},bed:{c:3,n:'A bed'},inn:{c:4,n:'Inn room'},guild:{c:4,n:'Guild bed'},own:{c:5,n:'Your own bed'}};
const REST_STATE={rested:{label:'Rested',rank:1,skill:1.10,stam:1,min:2700},well:{label:'Well rested',rank:2,skill:1.15,stam:1.10,min:5400}};
// S2090 — camp and rest B's second part (docs/design/camp-and-rest.md): a bedroll you carry lets you sleep in the open, and the
// night's comfort is a sum: the roll (or a road camp's bedroll), a tent +1 (and the cold or heat one grade less), a lean-to +1, a lit
// fire within 4 m +1, less a point a grade of the climate where you lie, read with what you wear. Below 0 the night heals half.
// The lean-to (three logs, cut with a hatchet where no tree stands) stays while its cell is loaded; it is not saved (the page).
const ROLL_DEF={blanket:{name:'Blanket Roll',c:1,weight:1.5,price:8},wool:{name:'Wool Bedroll',c:2,weight:2.5,price:25},
  gatelands:{name:'Quilted Plaid Roll',c:3,weight:3.5,price:70,isle:'gatelands'},mark:{name:'Fur Sleeping Sack',c:3,weight:3.5,price:70,isle:'mark',warm:1},
  aurenne:{name:'Linen Hammock',c:3,weight:2,price:70,isle:'aurenne',cool:1}};
const TENT_ITEM={name:'Tent',ico:'⛺',type:'misc',weight:4,buyPrice:45,sellMult:.4,tent:1};
const NIGHT_FIRE_REACH=4,LEANTO_REACH=3,LEANTO_LOGS=3,LEANTOS=[];
function rollItem(k){const R=ROLL_DEF[k];return {name:R.name,ico:'🛏️',type:'misc',weight:R.weight,buyPrice:R.price,sellMult:.4,roll:k};}
// a goods shop's camp gear: the two plain rolls and the tent everywhere, the island's own roll in its own island's towns
function campGearFor(nk){const out=[rollItem('blanket'),rollItem('wool'),{...TENT_ITEM}];if(ROLL_DEF[nk]&&ROLL_DEF[nk].isle===nk)out.push(rollItem(nk));return out;}
function bestRoll(){let b=null;BAG.forEach(it=>{if(it&&it.roll&&ROLL_DEF[it.roll]&&(!b||ROLL_DEF[it.roll].c>ROLL_DEF[b].c))b=it.roll;});return b;}
function hasTent(){return BAG.some(b=>b&&b.tent);}
function fireForNight(){const t=gameMinNow();return CAMPFIRES.some(f=>f.until>t&&Math.hypot(f.x-px,f.z-pz)<=NIGHT_FIRE_REACH);}
function leanToNear(){return LEANTOS.some(L=>Math.hypot(L.x-px,L.z-pz)<=LEANTO_REACH);}
// the night: {c, n, parts [[what, points]], bed, roll}. A bed indoors, a cot or a berth is its comfort alone; a camp and a roll are summed
function restNight(bed,roll){const B=REST_BED[bed]||REST_BED.bed;if(bed!=='camp'&&bed!=='roll')return {c:B.c,n:B.n,parts:[[B.n,B.c]],bed};
  const R=bed==='roll'?ROLL_DEF[roll]||ROLL_DEF.blanket:null,parts=[[R?R.name:B.n,R?R.c:B.c]];
  const tent=bed==='camp'||hasTent(),lean=leanToNear(),fire=fireForNight();
  if(tent)parts.push([bed==='camp'?'its tents':lean?'tent and lean-to':'tent',1]);else if(lean)parts.push(['lean-to',1]);if(fire)parts.push(['fire',1]); /* S2102 — one roof: a tent and a lean-to are +1 together, the page's roll 3, roof 1, fire 1 = 5 */
  let e={g:0,side:null};try{e=exposureNow(true);}catch(x){} /* S2102 — the open's grade even by the fire: the fire's +1 and the lean-to's grade are its whole worth */
  if(e.g>0&&e.side){const P=e.side==='cold'?warmthNow():coolNow(),rid=R?(e.side==='cold'?R.warm||0:R.cool||0):0;
    const g=Math.max(0,e.g-Math.min(2,P.n+rid)-(tent?1:0)-(lean&&fire&&e.side==='cold'?1:0));if(g)parts.push([CLIMATE.names[e.side][g],-g]);}
  return {c:parts.reduce((s,p)=>s+p[1],0),n:R?R.name:B.n,parts,bed,roll:R?roll:null};}
function restNightSay(N){if(N.parts.length<2)return `${N.n} · comfort ${N.c}`;
  return N.parts.map((p,i)=>i?`${p[0]} ${p[1]<0?'−'+(-p[1]):'+'+p[1]}`:`${p[0]} ${p[1]}`).join(' · ')+` = ${N.c<0?'−'+(-N.c):N.c}`;}
// S2091 — the open has a risk (the page's third part): a night on a roll outside a town's pad rolls once, on a stream keyed by the
// cell and the game day; tier 1 never, 2 one in 10, 3 one in 5, 4 one in 3, halved with a fire. Woken at a seeded hour, you keep what the
// hours slept gave and no Rested, and one group of the place's (WORLD.nightFoes) comes from 25 m. A camp, a bed and your ship never roll.
const NIGHT_RISK=[0,0,10,5,3];
function nightRisk(N){if(!N||N.bed!=='roll')return null;let t=1;try{t=worldTierAt(px,pz);}catch(e){}if(!(NIGHT_RISK[t]>0))return null;
  try{if(typeof SITES!=='undefined'&&SITES.some(s=>s.pad>0&&Math.hypot(px-s.x,pz-s.z)<s.pad))return null;}catch(e){}
  const fire=N.parts.some(p=>p[0]==='fire');return {tier:t,one:NIGHT_RISK[t]*(fire?2:1),fire};}
function nightKey(){let c='?';try{const [i,j]=cellOf(px,pz);c=i+','+j;}catch(e){}return c+':'+gameDayNow();}
// the roll, made as you lie down: null, or {h, r, id} (the hour you are woken, the stream for the group, its ids)
function nightRoll(N,hours){const R=nightRisk(N);if(!R)return null;const id='night:'+nightKey(),r=seededRng('night',id);
  if(!(r()<1/R.one))return null;return {h:Math.max(1,Math.min(hours,1+Math.floor(r()*Math.max(1,hours-1)))),r,id};}
// why you cannot lie down here, or ''
function rollSpotWhy(){if(activeZoneId!=='world'||lid!=='overworld'||(typeof isInterior==='function'&&isInterior()))return 'Lay out a bedroll in the open. Indoors, find a bed.';
  try{if(WORLD.isSwimming())return 'Not in the water.';}catch(e){}if(typeof SHIP!=='undefined'&&SHIP.sailing)return 'Not while she sails.';
  const w=typeof _canWait==='function'?_canWait():{ok:true};if(!w.ok)return w.reason||'Not now.';return '';}
// the bag's roll, used: lay it out and the rest slip opens on the night's sum
function layRoll(i){const it=BAG[i];const k=it&&it.roll?it.roll:bestRoll();if(!k){showMsg('A tent needs a bedroll under it.','#cc8844');return false;}
  const why=rollSpotWhy();if(why){showMsg(why,'#cc8844');return false;}campLayDraw(k);openRestSlip('sleep',480,{roll:k});return true;}
// S2094 — the roll you lay out is drawn where you lie (the kit's, on the new look), with the tent over it if you carry one; it is packed
// again when you walk 8 m off, leave the open, or lay it out elsewhere. Not saved, as the lean-to is not.
let CAMP_LAID=null;
// S2102 — the camp is laid where it stands clear (the critic's tent through a trunk): its footprint in the prop's own frame, [x0, x1, z0, z1]
// as the kit draws it (the tent's guy lines left out), read on a 0.4 m grid by the world's solids (trees, rocks, walls); the spot ahead
// first, then turning off it and farther out. None clear, and it is laid ahead as before: nothing stops the night.
const CAMP_FOOT={roll:[-.6,.6,-1.36,1.1],tent:[-.85,.85,-1.5,1.5],aurenne:[-.5,.5,-2.7,2.7],aurenneTent:[-1.2,1.2,-2.7,2.7],leanto:[-1.5,1.5,-2,.12]};
function campSpotClear(x,z,ry,f){if(typeof solidAt!=='function')return true;const co=Math.cos(ry),sn=Math.sin(ry),R=.3,n=(a,b)=>Math.max(1,Math.ceil((b-a-2*R)/.4)); /* solidAt pads by 0.3: the grid is pulled in by it */
  const nx=n(f[0],f[1]),nz=n(f[2],f[3]);for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const lx=f[0]+R+(f[1]-f[0]-2*R)*i/nx,lz=f[2]+R+(f[3]-f[2]-2*R)*j/nz;
    if(solidAt(x+lx*co+lz*sn,z-lx*sn+lz*co))return false;}return true;}
function campSpot(d0,f,dMax){const turns=[0,.45,-.45,.9,-.9,1.5,-1.5,2.2,-2.2,Math.PI];
  for(let d=d0;d<=dMax+1e-6;d+=.6)for(const t of turns){const ry=yaw+t,x=px-Math.sin(ry)*d,z=pz-Math.cos(ry)*d;if(campSpotClear(x,z,ry,f))return {x,z,ry};}
  return {x:px-Math.sin(yaw)*d0,z:pz-Math.cos(yaw)*d0,ry:yaw};}
function campLayDraw(k){campLaidDrop();if(typeof campGearProp!=='function')return;
  const f=CAMP_FOOT[k==='aurenne'?(hasTent()?'aurenneTent':'aurenne'):hasTent()?'tent':'roll'],{x,z,ry}=campSpot(k==='aurenne'?1.8:1.4,f,3.8);
  let g=null;try{g=campGearProp(k,x,z,ry,{tent:hasTent(),key:'roll:'+k});}catch(e){g=null;}if(!g)return;scene.add(g);CAMP_LAID={x,z,mesh:g,roll:k};}
function campLaidDrop(){const C=CAMP_LAID;CAMP_LAID=null;if(!C||!C.mesh)return;if(C.mesh.parent)C.mesh.parent.remove(C.mesh);C.mesh.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
// a lean-to of three logs, cut where you stand (Woodcutting); a plain stand-in until the kit's: two forked posts, a ridge pole, a slant of poles
function leanToMesh(x,z,ry){{let K=null;try{K=typeof campGearProp==='function'?campGearProp('leanto',x,z,ry,{key:'leanto:'+Math.round(x)+','+Math.round(z)}):null;}catch(e){K=null;}if(K)return K;} /* S2094 — the kit's on the new look */
  const g=new THREE.Group();const y=typeof worldH==='function'?worldH(x,z):0,wood=new THREE.MeshLambertMaterial({color:0x5a3a20});
  const pole=(len,r)=>new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,6),wood);
  [-1,1].forEach(s=>{const p=pole(1.5,.05);p.position.set(s*1.1,.75,.9);g.add(p);});
  {const p=pole(2.5,.05);p.rotation.z=Math.PI/2;p.position.set(0,1.45,.9);g.add(p);}
  for(let i=0;i<7;i++){const p=pole(1.9,.045);p.rotation.x=-Math.atan2(1.45,1.3);p.position.set(-1.05+i*.35,.72,.25);g.add(p);}
  g.position.set(x,y,z);g.rotation.y=ry;return g;}
function cutLeanTo(){const why=rollSpotWhy();if(why){showMsg(why,'#cc8844');return false;}
  if(bagCount(b=>!!b.log)<LEANTO_LOGS){showMsg(`A lean-to takes ${LEANTO_LOGS} logs.`,'#cc8844');return false;}
  bagTake(b=>!!b.log,LEANTO_LOGS);const {x,z,ry}=campSpot(1.2,CAMP_FOOT.leanto,2.4),L={x,z,mesh:null}; /* S2102 — clear of trunks, within LEANTO_REACH */
  try{L.mesh=leanToMesh(x,z,ry);scene.add(L.mesh);}catch(e){L.mesh=null;}
  try{const [i,j]=cellOf(x,z);L.cell=i+','+j;}catch(e){}LEANTOS.push(L);skillUse('woodcutting',3,'leanto'+LEANTOS.length);
  showMsg('You cut a lean-to.','#c8b890');if(typeof renderHubInv==='function')renderHubInv();return true;}
// each frame (from tickSurvival): a lean-to whose cell is gone goes with it
function tickLeanTos(){if(CAMP_LAID&&(activeZoneId!=='world'||(typeof isInterior==='function'&&isInterior())||Math.hypot(CAMP_LAID.x-px,CAMP_LAID.z-pz)>8))campLaidDrop();
  for(let i=LEANTOS.length-1;i>=0;i--){const L=LEANTOS[i];let gone=false;try{gone=!!L.cell&&typeof LOADED!=='undefined'&&!LOADED.has(L.cell);}catch(e){}
  if(gone){if(L.mesh&&L.mesh.parent)L.mesh.parent.remove(L.mesh);LEANTOS.splice(i,1);}}}
function restBedNow(){try{
    if(typeof isInterior==='function'&&isInterior()){const h=typeof currentHouse!=='undefined'?currentHouse:null;if(h&&h.type==='cabin')return 'berth';
      const bd=typeof intBedTarget==='function'?intBedTarget():null;if(bd)return bd.owner==='inn'?'inn':bd.owner==='guild'?'guild':bd.owner==='home'?'own':'bed';
      return (typeof INT_BEDS!=='undefined'&&INT_BEDS.length)||!intBedPos?'bed':'own';} /* the old safehouse's one bed is yours */
    if(typeof fortCotNear==='function'&&fortCotNear())return 'cot';
    if(activeZoneId==='world'){if(typeof berthNear==='function'&&berthNear())return 'berth';return 'camp';}
  }catch(e){}return 'bed';}
function restStateFor(c){return c>=4?'well':c>=2?'rested':null;}
function restedNow(){const R=worldState.rested;if(!R||!REST_STATE[R.k]||!(gameMinNow()<R.until))return null;return R;}
function restSkillMult(){const R=restedNow();return R?REST_STATE[R.k].skill:1;}
function restRegenMult(){const R=restedNow();return R?REST_STATE[R.k].stam:1;}
function restLeftMin(){const R=restedNow();return R?R.until-gameMinNow():0;}
function restPill(){const R=restedNow();if(!R)return '';const S=REST_STATE[R.k],m=Math.ceil(R.until-gameMinNow());
  return `<span class="buff-pill" title="${S.label} — skills ×${S.skill}${S.stam>1?', stamina ×'+S.stam:''}, ${m} min remaining"><span class="bp-ico">☾</span><span class="bp-time">${typeof pillMin==='function'?pillMin(m):m+'m'}</span></span>`;}
function restWake(bed,hours){const N=typeof bed==='string'?restNight(bed):bed||restNight('bed'),k=hours>=6?restStateFor(N.c):null;if(!k)return null;const S=REST_STATE[k],was=restedNow();
  if(was&&REST_STATE[was.k].rank>S.rank)return null; /* a worse bed never takes a better night's state away */
  worldState.rested={k,until:gameMinNow()+S.min,bed:N.bed};return k;}
const REST_MARKS=[[6,'Dawn'],[8,'Morning'],[12,'Noon'],[18,'Dusk'],[20,'Night']];
let restSlip={mode:'sleep',min:480};
function restPreview(hours,bad){const k=Math.min(1,hours/6)*(bad?.5:1),mh=effMaxHP(),mm=effMaxMana(); /* S2090 — a bad night (comfort below 0) heals half */
  return {hp:Math.min(mh,PHP+Math.ceil((mh-PHP)*k)+(k>=1?mh:0)),mp:Math.min(mm,mana+Math.ceil((mm-mana)*k)+(k>=1?mm:0)),mh,mm,bad:!!bad};}
function restClock(h){h=((h%24)+24)%24;const hh=Math.floor(h),mm=Math.round((h-hh)*60)%60;return `${((hh+11)%12)+1}:${String(mm).padStart(2,'0')} ${hh<12?'am':'pm'}`;}
function restDur(min){min=Math.round(min);const h=Math.floor(min/60),m=Math.round(min%60);return (h?`${h} hour${h===1?'':'s'}`:'')+(h&&m?' ':'')+(m?`${m} minute${m===1?'':'s'}`:'');}
function restMarkMin(h){const now=(worldState.gameTimeMinutes||0);let d=h*60-now;if(d<=0)d+=1440;return Math.round(d);}
function restDial(min,mode){
  const W=548,H=92,x0=14,x1=W-14,top=26,bot=58,X=h=>x0+((((h-12)%24)+24)%24)/24*(x1-x0);const ink='#3a2c18',rub='#7a1f10',faint='#8a7050';
  let s=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block"><defs><linearGradient id="rs-nt" x1="0" x2="1"><stop offset="0" stop-color="#2e1c0c" stop-opacity=".05"/><stop offset=".17" stop-color="#2e1c0c" stop-opacity=".34"/><stop offset=".5" stop-color="#2e1c0c" stop-opacity=".42"/><stop offset=".83" stop-color="#2e1c0c" stop-opacity=".34"/><stop offset="1" stop-color="#2e1c0c" stop-opacity=".05"/></linearGradient></defs>`+
    `<rect x="${x0}" y="${top}" width="${x1-x0}" height="${bot-top}" fill="rgba(255,248,225,.25)" stroke="#5a4128" stroke-width="1.1"/><rect x="${X(18)}" y="${top}" width="${X(6)-X(18)}" height="${bot-top}" fill="url(#rs-nt)"/>`;
  for(let h=0;h<24;h++){const hh=(12+h)%24,x=X(hh),l=hh%6===0;s+=`<line x1="${x}" x2="${x}" y1="${bot}" y2="${bot-(l?10:5)}" stroke="#5a4128" stroke-width="${l?1.2:.7}"/>`;}
  [[12,'noon'],[18,'six'],[0,'midnight'],[6,'six']].forEach(([h,t])=>{s+=`<text x="${X(h)}" y="${bot+14}" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="12" fill="${faint}">${t}</text>`;});
  s+=`<g transform="translate(${X(13.6)},${top+16})" stroke="#9a7020" fill="none" stroke-width="1.2"><circle r="5"/>${[0,45,90,135,180,225,270,315].map(a=>`<line x1="${Math.cos(a*Math.PI/180)*7.5}" y1="${Math.sin(a*Math.PI/180)*7.5}" x2="${Math.cos(a*Math.PI/180)*10}" y2="${Math.sin(a*Math.PI/180)*10}"/>`).join('')}</g>`+
    `<path transform="translate(${X(0)-34},${top+16})" d="M3 -7 A7.5 7.5 0 1 0 3 7 A6 6 0 1 1 3 -7Z" fill="#ecdcb2" stroke="#5a4128" stroke-width="1" opacity=".9"/>`;
  const now=(worldState.gameTimeMinutes||0)/60,end=now+min/60,a=X(now),b=X(end%24),wrap=min>=1440||b<a;
  if(!wrap)s+=`<rect x="${a}" y="${top+4}" width="${b-a}" height="${bot-top-8}" fill="${rub}" opacity=".16"/><path d="M${a} ${top-2} Q${(a+b)/2} ${top-18} ${b} ${top-2}" fill="none" stroke="${rub}" stroke-width="1.6"/>`;
  else s+=`<rect x="${a}" y="${top+4}" width="${x1-a}" height="${bot-top-8}" fill="${rub}" opacity=".16"/><rect x="${x0}" y="${top+4}" width="${Math.max(0,(min>=1440?a:b)-x0)}" height="${bot-top-8}" fill="${rub}" opacity=".16"/>`;
  s+=`<text x="${wrap?(x0+x1)/2:(a+b)/2}" y="${top-11}" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="${rub}" letter-spacing="1">${restDur(min).toUpperCase()}</text>`;
  const right=b>W*.7;
  s+=`<line x1="${a}" x2="${a}" y1="${top-4}" y2="${bot+2}" stroke="#2e1c0c" stroke-width="1.6"/><path d="M${a-5} ${bot+8} L${a+5} ${bot+8} L${a} ${bot+2}Z" fill="#2e1c0c"/>`+
    `<text x="${a+6}" y="${bot+28}" text-anchor="end" font-family="Georgia,serif" font-size="11" fill="${ink}" letter-spacing=".5">NOW · ${restClock(now)}</text>`+
    `<line x1="${b}" x2="${b}" y1="${top-4}" y2="${bot+2}" stroke="${rub}" stroke-width="2"/><circle cx="${b}" cy="${top-4}" r="3.2" fill="${rub}"/>`+
    `<text x="${right?b+6:b-6}" y="${bot+28}" text-anchor="${right?'end':'start'}" font-family="Georgia,serif" font-size="11" fill="${rub}" letter-spacing=".5">${mode==='sleep'?'YOU WAKE':'YOU RISE'} · ${restClock(end)}</text></svg>`;
  return s;
}
function openRestSlip(mode,min,opt){
  if(typeof _releasePointerLockForMenu==='function')_releasePointerLockForMenu();
  let ov=document.getElementById('sleepui');
  if(!ov){
    ov=document.createElement('div');ov.id='sleepui';
    ov.style.cssText='position:fixed;inset:0;z-index:8500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35)';
    const btn='background:none;border:1px solid #a89060;border-radius:3px;font:13px Georgia,serif;color:#3a2c18;cursor:pointer;padding:2px 7px';
    ov.innerHTML='<div id="rs-paper" style="width:560px;max-width:calc(100vw - 32px);box-sizing:border-box;padding:20px 28px 18px;background:#e9dcc2;color:#3a2c18;border:6px double #8a7040;border-radius:6px;font-family:Georgia,serif;box-shadow:0 10px 40px #000a">'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-bottom:1px solid #a89060;padding-bottom:6px"><span id="rs-title" style="flex:none;font-size:22px;color:#7a1f10;letter-spacing:.06em;font-variant:small-caps"></span><span id="sleep-date" style="min-width:0;text-align:right;font-style:italic;font-size:13px;color:#5a4128"></span></div>'+
      '<div id="rs-ask" style="font-style:italic;font-size:16px;margin:10px 0 2px"></div>'+
      '<div id="rs-dial"></div>'+
      '<div style="display:flex;align-items:center;gap:10px;margin:2px 0 8px"><button type="button" id="rs-minus" style="'+btn+';border-radius:50%;width:24px;height:24px;padding:0">−</button>'+
      '<input id="sleep-range" type="range" min="1" max="24" step="1" value="8" style="flex:1;accent-color:#7a1f10">'+
      '<button type="button" id="rs-plus" style="'+btn+';border-radius:50%;width:24px;height:24px;padding:0">+</button><span id="sleep-hrs" style="min-width:120px;text-align:right;color:#7a1f10;font-size:17px"></span></div>'+
      '<div id="rs-marks" style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:10px"></div>'+
      '<div id="rs-out" style="border-top:1px solid #a89060;padding-top:8px;font-size:14px;line-height:1.75"></div>'+
      '<div style="display:flex;align-items:center;gap:12px;margin-top:10px">'+
      '<button type="button" id="sleep-go" style="display:flex;align-items:center;gap:10px;background:none;border:none;cursor:pointer;padding:0;font:20px Georgia,serif;color:#7a1f10;font-variant:small-caps;letter-spacing:.05em"><span id="rs-seal" style="width:40px;height:40px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#c0392b,#7a1f10);color:#f3e2c0;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 6px #0006"></span><span id="rs-go"></span></button>'+
      '<span style="flex:1"></span><span style="font-size:12px;font-style:italic;color:#8a7050"><button type="button" id="sleep-no" style="'+btn+'">Esc</button> as you were · ← → an hour · 1–5 a mark</span></div></div>';
    document.body.appendChild(ov);
    const rng=ov.querySelector('#sleep-range');
    rng.oninput=()=>{restSlip.min=(+rng.value)*60;restSlipDraw();};
    ov.querySelector('#rs-minus').onclick=()=>restSlipStep(-1);
    ov.querySelector('#rs-plus').onclick=()=>restSlipStep(1);
    ov.querySelector('#sleep-no').onclick=()=>closeSleepUI();
    ov.querySelector('#sleep-go').onclick=()=>restSlipGo();
  }
  {const bed=mode==='wait'?null:opt&&opt.roll?'roll':restBedNow();restSlip={mode:mode==='wait'?'wait':'sleep',min:Math.max(60,Math.min(1440,min||480)),bed,night:bed?restNight(bed,opt&&opt.roll):null};} /* S2090 — the night's sum, read as you lie down */
  ov.style.display='flex';sleepOpen=true;restSlipDraw();
}
function restSlipDraw(){const ov=document.getElementById('sleepui');if(!ov)return;const {mode,min}=restSlip,sleep=mode==='sleep';
  const q=id=>ov.querySelector(id);
  q('#rs-title').textContent=sleep?'Sleep':'Wait';q('#rs-go').textContent=sleep?'Sleep':'Wait';q('#rs-seal').textContent=sleep?'☾':'⧗';
  q('#rs-ask').textContent=sleep?'How long will you sleep?':'How long will you wait?';
  let place='';try{place=typeof ssPlaceName==='function'?ssPlaceName():'';}catch(e){}
  {const sd=q('#sleep-date');sd.textContent=gameDateLine();if(place){const pl=document.createElement('span');pl.style.whiteSpace='nowrap';pl.textContent=' · '+place;sd.appendChild(pl);}} /* S593 — the place wraps whole, never mid-name */
  q('#rs-dial').innerHTML=restDial(min,mode);
  const rng=q('#sleep-range');rng.value=String(Math.max(1,Math.min(24,Math.round(min/60))));
  q('#sleep-hrs').textContent=restDur(min);
  q('#rs-marks').innerHTML=REST_MARKS.map(([h,t],i)=>{const on=restMarkMin(h)===min;return `<button type="button" data-h="${h}" style="background:${on?'rgba(122,31,16,.1)':'none'};border:1px solid ${on?'#7a1f10':'#a89060'};border-radius:2px;font:13px Georgia,serif;color:${on?'#7a1f10':'#3a2c18'};cursor:pointer;padding:2px 8px;font-variant:small-caps"><span style="font-size:10px;color:#8a7050">${i+1}</span> ${t} <small style="font-style:italic;color:#8a7050">${restClock(h).replace(':00','')}</small></button>`;}).join('');
  q('#rs-marks').querySelectorAll('button').forEach(b=>b.onclick=()=>{restSlip.min=restMarkMin(+b.dataset.h);restSlipDraw();});
  const nowM=worldState.gameTimeMinutes||0,abs=worldState.gameTimeAbsMinutes||0,endTod=(nowM+min)%1440,endDay=gameDateLine(abs+min,endTod,'day');
  const at=`<b>${restClock(endTod/60)}</b>, ${endDay}`,ready=levelReady(),row=(ic,txt,r,col)=>`<div style="display:flex;gap:10px;align-items:baseline${col?';color:'+col:''}"><span style="width:16px;text-align:center;color:#9a7020">${ic}</span><span style="flex:1">${txt}</span><span style="font-style:italic;font-size:12px;color:#8a7050">${r||''}</span></div>`;
  let out='';
  const night=restSlip.night||restNight(restSlip.bed||'bed'),bad=night.c<0;
  if(sleep){const p=restPreview(min/60,bad),v=(l,a,b,m)=>a>=b&&a>=m?`<span style="font-variant:small-caps">${l}</span> full`:`<span style="font-variant:small-caps">${l}</span> <s style="color:#8a7050">${Math.round(a)}</s> ${Math.round(b)} <span style="color:#8a7050">of ${Math.round(m)}</span>`;
    out=row('☀',`You wake at ${at}.`,min>=360?'a full night':'a short sleep')+
      row('♥',`${v('Health',PHP,p.hp,p.mh)} &nbsp; ${v('Mana',mana,p.mp,p.mm)} &nbsp; <span style="font-variant:small-caps">Stamina</span> full`,bad?'a bad night: half':'all, at six hours')+
      (ready?row('✦',`You are ready to advance: you wake at <b>level ${level+1}</b>.`,'','#7a1f10'):'');
    {const k=restStateFor(night.c),S=k&&REST_STATE[k],was=restedNow(),keep=was&&S&&REST_STATE[was.k].rank>S.rank; /* S2085 — the bed's comfort, and what six hours of it leave you; S2090 — a night in the open, its sum */
      out+=row('☾',restNightSay(night)+(bad?' · a bad night':'')+(S?(min>=360?(keep?` · you stay <i>${REST_STATE[was.k].label}</i>`:` · <i>${S.label}</i> for ${S.min/60} hours`):` · six hours for <i>${S.label}</i>`):''),S?(S.stam>1?'skills ×1.15, stamina ×1.1':'skills ×1.1'):'');}}
  else out=row('☀',`You rise at ${at}.`)+row('♥','Waiting restores nothing; a bed does.','','#8a7050')+(ready?row('✦','You are ready to advance, but only sleep takes the level.','','#8a7050'):'');
  if(sleep){const R=nightRisk(night);if(R)out+=row('⚠',`Tier ${R.tier}: 1 in ${R.one} you are woken`,R.fire?'with a fire':'','#7a1f10');} /* S2091 — the night's roll */
  {const W=typeof erWatchJumpLoses==='function'?erWatchJumpLoses(min):null;if(W)out+=row('☾',`The night at the ${W.data.fold} will be lost.`,'an hour or more','#7a1f10');} /* S1789 — the watch lapses on a jump of the clock; the slip says so */
  q('#rs-out').innerHTML=out;
}
function restSlipStep(d){const h=Math.round(restSlip.min/60)+d;restSlip.min=Math.max(1,Math.min(24,h))*60;restSlipDraw();}
function restSlipGo(){const {mode,min}=restSlip;closeSleepUI();if(mode==='sleep')restAtBed(min/60);else if(typeof passTimeMinutes==='function')passTimeMinutes(min);}
function closeSleepUI(){const ov=document.getElementById('sleepui');if(ov)ov.style.display='none';sleepOpen=false;refocusView();} /* S722 — and the keys go back to the view */
function openSleepUI(){openRestSlip('sleep',480);}
window.addEventListener('keydown',e=>{if(!sleepOpen)return;const c=e.code;let hit=true;
  if(c==='Escape')closeSleepUI();else if(c==='ArrowLeft')restSlipStep(-1);else if(c==='ArrowRight')restSlipStep(1);
  else if(/^Digit[1-5]$/.test(c)){restSlip.min=restMarkMin(REST_MARKS[+c.slice(5)-1][0]);restSlipDraw();}
  else if(c==='Enter'||c==='KeyE'){if(!e.repeat)restSlipGo();}else hit=false;
  if(hit){e.preventDefault();e.stopPropagation();}},true);
let sleepOpen=false;
function restAtBed(hours){
  if(typeof doFade!=='function'){return;}
  hours=Math.max(1,Math.min(24,hours||8));
  doFade(()=>{
    if(typeof orbDrop==='function')orbDrop(); /* S1854 — sleep empties the orb */
    const night=restSlip.night||restNight(restSlip.bed||'bed'),broke=nightRoll(night,hours); /* S2091 — woken in the open */
    if(broke){hours=broke.h;if(typeof saveGame==='function')saveGame(true);} /* S2108 — a broken night saves as you lie down, not on waking: its foes are not saved, and the roll is keyed by cell and day, so a load replays the same night */
    {const p=restPreview(hours,night.c<0);PHP=p.hp;mana=p.mp;stamina=effMaxStamina();}
    if(typeof worldState !== 'undefined' && typeof worldState.gameTimeMinutes === 'number'){
      if(typeof fedSleep==='function')fedSleep(hours*60); /* S1500 — Full belly */
      worldState.gameTimeMinutes = (worldState.gameTimeMinutes + hours*60) % 1440;
      worldState.gameTimeAbsMinutes = (worldState.gameTimeAbsMinutes||0) + hours*60;
    }
    const rk=broke?null:restWake(night,hours); /* S2085 — Rested by the bed's comfort, from the hour you wake; S2090 — by the night's sum */
    if(typeof addLog==='function')addLog('🛏️',`Slept ${restDur(hours*60)}.`);
    if(typeof greatNoteOnWake==='function')greatNoteOnWake(); /* S1353 — Varek's note, folded into the pack */
    if(broke){let n=0;try{n=WORLD.nightFoes(broke.r,broke.id).length;}catch(e){}showMsg(`Something wakes you after ${restDur(hours*60)}.`+(n?' You are not alone.':''),'#ff9060');}
    else showMsg(`You wake after ${restDur(hours*60)}. ${gameDateLine()}.`+(rk?` ${REST_STATE[rk].label}.`:night.c<0?' A bad night.':''),'#c8b880');
    updateHUD();
    if(!broke&&typeof saveGame==='function')saveGame(); /* S353 — #66 A: sleeping anywhere autosaves (a broken night has saved already, S2108) */
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
    const ex=arr.find(s=>sameStack(s,it) && s._boughtBack);
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
  refocusView(); /* S722 */
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
    const isStaff = !it.implement && (it.weaponShape==='staff' || it.spellPower); /* S1849 — an implement has no spell power to compare; its melee compares as any weapon's */
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
    if(it.weaponShape==='crossbow'){ /* S1457 — the crossbow shoots bolts */
      if(!stockItems.some(s=>s.type==='ammo' && s.ammoType==='bolt')) return `<span class="sh-note warn">Needs bolts — none in stock</span>`;
      return `<span class="sh-note">Ranged · bolts sold here</span>`;
    }
    if(EQ.offhand) return `<span class="sh-note warn">Two-handed · stows your ${EQ.offhand.name}</span>`;
    return ''; /* S1871 — the 2H badge beside the name says it; the note said it twice and took the name's width */
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
  /* S1863 — an implement's row says what it changes (the page's "the rule, not a percentage"), on both sides */
  if(typeof implementRule==='function'){ const r=implementRule(it); if(r) note += `<span class="sh-note sh-impl">${r}</span>`; }
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
    const w=WEAPON_TYPES.find(t=>t.type===typeName), a=!w&&(best.line?lineType(best.line,best.slot):ARMOR_TYPES.find(t=>t.type===typeName));
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
// S2117 — the counter's swords in its island's make (Michael's B on #1425; `swordStamp`, 14-items.js): copies, so the shared table is
// untouched, and each row's blade drawn by its house and row, so a counter shows the same takouba or flyssa every visit
function counterSwords(stock,h){if(!h||!stock)return stock;const isle=houseIsle(h)||isleHere(),key=h.id||h.name||'';
  return stock.map((it,i)=>isSwordItem(it)?swordStamp({...it},isle,seededRng('sword',key+':'+i)):it);}
function renderShop(){
  document.getElementById('sh-gold-val').textContent=gold;
  // Stock list
  const stockTable=currentHouse.id&&currentHouse.id.startsWith('ih')?IH_SHOP_STOCK:SHOP_STOCK;
  let stock=stockTable[currentHouse.type]||(currentHouse.type==='guild_m'?[]:(stockTable.misc||SHOP_STOCK.misc)); // S566 — the Mages' Guild sells its robes and nothing of a goods shop's
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
  if(typeof cloaksFor==='function'){const ck=cloaksFor(currentHouse);if(ck.length)stock=[...stock,...ck];} // S552 — cloaks
  if(typeof loreBooksFor==='function'){const lb=loreBooksFor(currentHouse);if(lb.length)stock=[...stock,...lb];} /* S979 — The Seventh Niche at the Mages' Guild */
  {const ln=armorLinesFor(currentHouse);if(ln.length)stock=[...stock,...ln];}
  {const im=implementsFor(currentHouse);if(im.length)stock=[...stock,...im];} /* S1858 — staves, wands and tomes at the Mages' Guild */
  {const mo=mortarFor(currentHouse);if(mo.length)stock=[...stock,...mo];}
  {const pk=minersPickFor(currentHouse);if(pk.length)stock=[...stock,...pk.filter(a=>!stock.some(b=>b.name===a.name))];} /* S1491 — the pick at the smith's and the goods shop */
  {const hk=hatchetFor(currentHouse);if(hk.length)stock=[...stock,...hk.filter(a=>!stock.some(b=>b.name===a.name))];} /* S1511 — and the hatchet */
  {const jk=[...joinerKitFor(currentHouse),...feathersFor(currentHouse)];if(jk.length)stock=[...stock,...jk.filter(a=>!stock.some(b=>b.name===a.name))];} /* S1517 — the joiner's kit beside them, feathers at the goods shop */
  {const cp=clayPotFor(currentHouse);if(cp.length)stock=[...stock,...cp.filter(a=>!stock.some(b=>b.name===a.name))];} /* S1837 — the clay pot at an apothecary and the goods shop */
  {const sv=survivalFor(currentHouse);if(sv.length)stock=[...stock,...sv.filter(a=>!stock.some(b=>b.name===a.name))];} /* S1486 — the tinderbox and produce at the goods shop and the inn, fish in a port */ /* S1483 — the mortar at an apothecary and the Mages' Guild */ // S564 — the light line at the armourer, robes at a goods shop
  // v61au: Charisma-gated stock (chaReq). No-op until items carry the field.
  const _cha = ATTRS.charisma||0;
  stock = stock.filter(it => !it.chaReq || _cha >= it.chaReq);
  // v80 S333 — Charisma's merchant access (Michael's A on #58): at 5 points a merchant shows one piece from the tier above its best.
  const _chaX = _chaExtraItem(stock, _cha);
  if(_chaX) stock = [...stock, _chaX];
  stock = counterSwords(stock, currentHouse); /* S2117 */

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
    if(!def.attr){const k=def.sheet?'Lore':'Lore book';return read?k+' (already read)':k;} /* S1092 — a sheet is one leaf */
    const attrLbl=(typeof ATTR_DEF!=='undefined'&&ATTR_DEF[def.attr])?ATTR_DEF[def.attr].label:def.attr;
    return read?`Skill book (already read)`:`Skill book · +1 ${attrLbl} on read`;
  }
  {const r=typeof implementRule==='function'?implementRule(it):'';if(r){const base=it.atk?`ATK ${it.atk[0]}–${it.atk[1]} · `:'';return base+r+(it.material?` · Tier ${it.tier} ${it.material}`:'')+(it.enchant?` · ${it.enchant.name}`:'');}} /* S1863 — an implement's rule */
  if(it.type==='equip'&&it.atk){
    const wlbl=typeof weaponWeightLabel==='function'?weaponWeightLabel(it.weight||2):'';
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
// S953 — skills and perks A: Charisma 0.5% a point (was 1%), still to a quarter; Speech 0.2% a level on top, to 20%
const BARTER_PCT=.005,BARTER_MAX=.25,SPEECH_PCT=.002,SPEECH_MAX=.2;
function speechPct(){return Math.min(SPEECH_MAX,Math.max(0,(typeof skillLv==='function'?skillLv('speech'):0)*SPEECH_PCT));}
function barterPct(){return Math.min(BARTER_MAX,Math.max(0,(ATTRS.charisma||0)*BARTER_PCT))+speechPct()+(perk('speech',25)?.05:0)+(capeCounter()?.02:0);} /* S973 — Haggle, Speech 25 */
// S552 — which cloaks a counter sells (#148 B): the traveller's at any armourer or goods shop; the dark hood in towns and
// cities; oilskin in ports; fur in the Mark; the short cape in Aurenne; the pilgrim's grey where the town has a church
// S1858 — the Mages' Guild's implements in its island's make; the tome from Adept (guildImplements, 14-items.js)
function implementsFor(h){if(!h||h.type!=='guild_m'||typeof guildImplements!=='function')return [];let make='gatelands';
  try{const t=h.siteId&&siteAnywhere(h.siteId);if(t)make=nationKeyOf(...cellOf(t.x,t.z))||make;}catch(e){}
  return guildImplements(make,typeof mageRank==='function'?mageRank():0);}
function cloaksFor(h){if(!h||(h.type!=='armor'&&h.type!=='misc'))return [];const out=['wool'];
  try{const t=h.siteId&&siteAnywhere(h.siteId);if(t){const nk=nationKeyOf(...cellOf(t.x,t.z));const S=WORLD.settle&&WORLD.settle.get(t.id);
    if(t.kind==='town'||t.kind==='city')out.push('hood');if(t.kind==='port')out.push('oilskin');if(nk==='mark')out.push('fur');if(nk==='aurenne')out.push('cape');
    if(S&&S.houses&&S.houses.some(x=>x.type==='church'))out.push('pilgrim');}}catch(e){}
  return out.map(k=>makeCloak(k));}
// S564 — the light and robe lines at a counter (#163): the armourer sells the light line beside the heavy, at the heavy stock's
// tiers (the jerkin a tier up, as the cuirass is); a goods shop and the Mages' Guild (S566, its head's *Browse your wares.*) sell robes.
function armorLinesFor(h){const ln=h&&(h.type==='armor'?'light':(h.type==='misc'||h.type==='guild_m')?'robe':null);if(!ln)return [];
  return ARMOR_LINE_TYPES.filter(t=>t.line===ln).map(t=>makeItem(t.slot==='chest'?3:2,t,null,true));}
// S552 — the Aurennais cape: +2% at a counter in Aurenne, the nation whose cut it is (#148)
function capeCounter(){if(typeof cloakOn!=='function'||!cloakOn('cape'))return false;try{const h=typeof currentHouse!=='undefined'&&currentHouse;const t=h&&h.siteId&&siteAnywhere(h.siteId);return !!(t&&nationKeyOf(...cellOf(t.x,t.z))==='aurenne');}catch(e){return false;}}
// S552 — the fur-lined cloak: stamina +10% in falling snow, or at night above the snowline, in the open world
function furWarm(){if(!(typeof cloakOn==='function'&&cloakOn('fur'))&&!(typeof _hasBuff==='function'&&_hasBuff('resistCold'))||activeZoneId!=='world')return false; /* S1483 — a tincture's Resist Cold warms as the fur cloak does */try{if(typeof isInterior==='function'&&isInterior())return false;if(WX.type==='snow')return true;return isNight()&&worldH(px,pz)>snowLineAt(px,pz);}catch(e){return false;}}
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
  lvAct.transactions++;skillUse('speech',1,'trade'); /* S941 */
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
  const tithe=typeof bladeTithe==='function'?bladeTithe(finalSp):0; /* S787 — the Crown's twentieth, while the Gate-Blade is on you under licence */
  gold+=finalSp-tithe;(worldState.stats||(worldState.stats={})).sold=((worldState.stats||{}).sold||0)+1;(worldState.stats||{}).goldIn=((worldState.stats||{}).goldIn||0)+finalSp;
  // v68 — buy-back: offer one unit of the sold item back to this merchant at the
  // price the player received. Stamp a single-unit copy (so a one-arrow sell
  // doesn't drop a 12-bundle into buy-back).
  _pushBuyBack({...it, qty:1}, finalSp);
  it.qty--;if(it.qty<=0)BAG.splice(i,1);
  lvAct.transactions++;skillUse('speech',1,'trade'); /* S941 */
  sndGoldJingle();
  if(currentHouse)addLog('🏪','Sold items at '+currentHouse.name);
  showMsg(`Sold ${it.name} for ${finalSp}🪙${tithe?` (the Crown's twentieth, ${tithe})`:''}`,'#44ee44');
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
  lvAct.transactions++;skillUse('speech',1,'trade'); /* S941 */
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
  lvAct.transactions++;skillUse('speech',1,'trade'); /* S941 */
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
    if(it&&it.line==='robe')b.maxManaBonus+=3*(it.tier||1); /* S564 — a robe piece: 3 max mana a tier */
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
function effMaxStamina(){const b=getArmorEnchantBonuses();return Math.round((maxStamina+(b.maxStaminaBonus||0)+5*(b.fortitudeBonus||0))*(typeof fedStamMult==='function'?fedStamMult():1)*(typeof climateStamCap==='function'?climateStamCap():1));} /* S1486 — Hearty, +15% */

// Returns {tag, col} for the caller to render alongside its hit message, or null.
// v61k: no longer calls showMsg directly — doing so raced with the caller's own
// showMsg on the same tick and the enchant toast was silently overwritten before
// rendering. Life Drain/Fire/Frost were firing the whole time (HP, stagger, mana
// were all applying); only the confirmation toast was invisible.
function applyWeaponEnchant(dmg,e){
  const w=EQ.weapon;if(!w||!w.enchant||typeof w.enchant.effect!=='function')return null; /* S1885 — a found staff or wand carries an armour enchant: it strikes plain */
  const eff=w.enchant.effect(dmg);
  if(eff.extraDmg>0){e.hp=Math.max(0,e.hp-eff.extraDmg);e.hpFg.scale.x=e.hp/e.maxHp;e.hpFg.position.x=(e.hp/e.maxHp-1)*.275;}
  if(eff.extraType==='frost'&&eff.stagger)staggered.push({e,t:eff.stagger});
  if(eff.healPlayer)PHP=Math.min(effMaxHP(),PHP+eff.healPlayer);
  if(eff.stealStam)stamina=Math.min(effMaxStamina(),stamina+eff.stealStam);
  if(eff.gainMana)mana=Math.min(effMaxMana(),mana+eff.gainMana);
  const amt=eff.extraDmg||eff.healPlayer||eff.stealStam||eff.gainMana;
  if(!amt)return null;
  const col=w.enchant.col?'#'+w.enchant.col.toString(16).padStart(6,'0'):'#aaaaff';
  return {tag:`${eff.msg} +${amt}!`,col,amt,id:w.enchant.id,ico:String(eff.msg||'').split(' ')[0]}; /* S761 — amt, id and icon for the rider's number */
}
