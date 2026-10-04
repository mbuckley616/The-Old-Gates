
// ── BOOK READER ─────────────────────────────────────────────
// First read of a book (id not in booksRead): permanent +1 to book.attr.
// Subsequent reads: lore only, no bonus.
// v61ea: books are NO LONGER consumed on first read. The player keeps the
// physical book in their bag — re-reads yield no additional attribute bonus
// (booksRead Set gates that), but the prose stays available for lore value
// and the book retains a small sell value. Was originally consumed in the
// Oblivion-skill-book model; that model produced a "I just lost a book I
// liked" feel that ran counter to the lore-canon importance these books
// carry. Behavior change: BAG retains the book; lore re-reads work; weight
// stays paid (0.5 per book, see makeBookItem).
// Page navigation is purely a UI concern — attribute bonus applies as soon as the reader opens
// on a first-time read, so the player sees the flash/message even if they skim to page 1 and close.
let _bookState={bagIndex:-1, bookDef:null, page:0, firstRead:false};

function openBookReader(bagIndex){
  const it=BAG[bagIndex];
  if(!it||it.type!=='book')return;
  const def=BOOKS.find(b=>b.id===it.bookId);
  if(!def){showMsg('The book crumbles to dust.','#888');BAG.splice(bagIndex,1);renderInv();return;}
  _releasePointerLockForMenu();

  const firstRead=!booksRead.has(def.id);
  _bookState={bagIndex, bookDef:def, page:0, firstRead};

  if(firstRead){
    booksRead.add(def.id);
    // +1 to the target attribute
    if(def.attr && ATTRS[def.attr]!==undefined){
      ATTRS[def.attr]=(ATTRS[def.attr]||0)+1;
      // Side effects of attribute changes — might on damage (recomputed per hit), INT partials
      if(def.attr==='intelligence' && typeof checkPartialSpells==='function')checkPartialSpells();
      invalidateArmorCache();
      updateHUD();
      const attrLabel=(typeof ATTR_DEF!=='undefined'&&ATTR_DEF[def.attr])?ATTR_DEF[def.attr].label:def.attr;
      showMsg(`📖 You absorb the book's wisdom. +1 ${attrLabel}!`,'#ffd700');
      addLog('📖',`Read "${def.name}" — +1 ${attrLabel}`);
    }
    // v61ea: book is NOT consumed. Player retains it for re-reading + lore.
  } else {
    showMsg('You have already absorbed this book. The text is familiar.','#a08860');
  }

  if(typeof sndTabSwitch==='function')sndTabSwitch(); // page-open chirp — reuses existing SFX
  const ov=document.getElementById('book-overlay');
  if(ov)ov.style.display='flex';
  renderBookPage();
  if(typeof saveGame==='function')saveGame();
  renderInv();
}

function renderBookPage(){
  if(!_bookState.bookDef)return;
  const def=_bookState.bookDef;
  const totalPages=def.pages.length;
  const p=Math.max(0,Math.min(_bookState.page,totalPages-1));
  _bookState.page=p;
  const titleEl=document.getElementById('book-title');
  const pageEl=document.getElementById('book-page');
  const pagEl=document.getElementById('book-pagination');
  const prevBtn=document.getElementById('book-prev');
  const nextBtn=document.getElementById('book-next');
  if(titleEl)titleEl.textContent=def.name;
  if(pageEl)pageEl.textContent=def.pages[p];
  if(pagEl)pagEl.textContent=`Page ${p+1} / ${totalPages}`;
  if(prevBtn)prevBtn.disabled=(p===0);
  if(nextBtn)nextBtn.disabled=(p>=totalPages-1);
}
function bookNextPage(){
  if(!_bookState.bookDef)return;
  if(_bookState.page<_bookState.bookDef.pages.length-1){
    _bookState.page++;
    if(typeof sndTabSwitch==='function')sndTabSwitch();
    renderBookPage();
  }
}
function bookPrevPage(){
  if(!_bookState.bookDef)return;
  if(_bookState.page>0){
    _bookState.page--;
    if(typeof sndTabSwitch==='function')sndTabSwitch();
    renderBookPage();
  }
}
function closeBookReader(){
  const ov=document.getElementById('book-overlay');
  if(ov)ov.style.display='none';
  _bookState={bagIndex:-1, bookDef:null, page:0, firstRead:false};
}
function isBookOpen(){
  const ov=document.getElementById('book-overlay');
  return ov && ov.style.display==='flex';
}

// ── GAME LOG ─────────────────────────────────────────────────
const GAME_LOG=[];
// S486 — the journal kept (Michael's C on #132, part A): every line is stamped with the minute it was written (t, the
// absolute clock; tod, the time of day) and the list is worldState.journal, a character key, so it is saved in the
// character row. GAME_LOG and worldState.journal are one array: a load refills it in place (_applyLoadData).
worldState.journal=GAME_LOG;
function addLog(icon,text){if(worldState.journal!==GAME_LOG)worldState.journal=GAME_LOG;GAME_LOG.push({level,icon,text,t:Math.floor(worldState.gameTimeAbsMinutes||0),tod:Math.floor(worldState.gameTimeMinutes||0)%1440});}
// S487 — a quest's own words (the card's: acceptText, an objective's completionText, readyText, completeText), kept under its id
function journalQuest(kind,qDef,text){if(!qDef||!qDef.id||!text)return;addLog(kind==='complete'?'✅':'📜',String(text));const e=GAME_LOG[GAME_LOG.length-1];e.q=qDef.id;e.qk=kind;}
function journalOf(id){return GAME_LOG.filter(e=>e&&e.q===id);}
function journalLoad(list){GAME_LOG.length=0;if(Array.isArray(list))list.forEach(e=>{if(e&&typeof e.text==='string')GAME_LOG.push(e);});worldState.journal=GAME_LOG;}
function renderLog(){
  const body=document.getElementById('log-body');body.innerHTML='';
  // v80 — Character: who you are and what you've done (S488: the journal has its own tab, renderJournal)
  try{if(typeof WORLD!=='undefined'){
    const st=worldState.stats||(worldState.stats={});const days=Math.floor((worldState.gameTimeAbsMinutes||0)/1440);
    const qDone=(WORLD.quests||[]).filter(q=>q.turnedIn).length+QUEST_DEFS.filter(q=>qState(q.id)==='complete').length;
    const fav=worldState.favor||{};const favSum=Object.values(fav).reduce((a,v)=>a+v,0);const lairs=Object.keys(worldState.lairs||{}).length;
    const F=WORLD.fstate();const ranks=Object.values(F).reduce((a,f)=>a+f.rank,0);
    const fame=qDone*2+lairs*3+ranks*5+Math.max(0,favSum);const infamy=Math.max(0,-favSum)*3+(st.piratesBoarded||0)+(st.townsfolkKilled||0)*5;
    const row=(k,v)=>`<div style="display:flex;gap:10px;padding:3px 0;border-bottom:1px solid rgba(120,100,70,.15)"><span style="color:#8a7a60;min-width:150px">${k}</span><span style="color:#e8dcc0">${v}</span></div>`;
    const grid=(pairs)=>`<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 28px;font-size:13px;line-height:1.5">${pairs.map(([k,v])=>row(k,v)).join('')}</div>`;
    let html=`<div class="attr-section"><h3>Renown</h3>${grid([['Fame',`<b style="color:#e8d8a0">${fame}</b>`],['Infamy',`<b style="color:#e07060">${infamy}</b>`],['Days passed',days],['Quests complete',qDone],['Monsters killed',st.kills||0],['Gold acquired',st.goldIn||0],['Items sold',st.sold||0],['Sigils read at Mastery',worldState.masteries||0],['Deaths',(worldState.varek&&worldState.varek.deaths)||0],['Lairs cleared',lairs]])}</div>`;
    const sb=document.getElementById('standing-body');if(sb){html+=`<div class="attr-section"><h3>Standing</h3><div style="font-size:13px;line-height:1.5">${sb.innerHTML||''}</div></div>`;}
    body.innerHTML=html;}}catch(e){}
  // v80 S131 — what you're wearing, at a glance
  try{const slots=[['weapon','Weapon'],['offhand','Off-hand'],['head','Head'],['chest','Chest'],['hands','Hands'],['legs','Legs'],['feet','Feet'],['amulet','Amulet'],['ammo','Ammo']];
    const def=Object.values(EQ).reduce((a,v)=>a+(v&&v.def?v.def:0),0);const w=EQ.weapon;const atk=w&&w.atk?`${w.atk[0]}–${w.atk[1]}`:'fists';const wt=Object.values(EQ).reduce((a,v)=>a+(v&&v.weight?v.weight:0),0);
    const eq=document.createElement('div');eq.style.cssText='margin:0 0 12px;padding:8px 10px;background:rgba(40,40,40,.3);border-left:3px solid #8a7a60;border-radius:3px;font-size:12px;color:#c8b898';
    eq.innerHTML=`<div style="font:600 13px Georgia,serif;color:#e8d8a0;margin-bottom:6px;letter-spacing:.05em">WORN &nbsp;<span style="font-weight:400;color:#8a7a60;letter-spacing:0">attack ${atk} · armour ${def} · ${wt.toFixed(1)} weight</span></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px 12px">${slots.map(([k,l])=>`<div><span style="color:#8a7a60">${l}</span> ${EQ[k]?(EQ[k].name||'?'):'<span style="color:#5a5040">—</span>'}</div>`).join('')}</div>`;
    body.insertBefore(eq,body.firstChild);}catch(e){}
}

// S488 — the Journal, a tab of its own (DECISION #132, part A): *By day*, the chronicle, newest day first and each day's
// lines in the order they happened; *By quest*, every quest the journal holds words for, the ones in hand first, its
// lines in order. Each line carries its time; the date line is gameDateLine's until the quest writer names the days.
// S490 — the topics you were told (DECISION #132, part C): every answer a person gives to a topic is filed once under its
// label in worldState.told, a character key. A person with a name of their own (the legacy villages, the quest givers)
// files by name; the generated townsfolk (they number thousands) file by the town and the words, so a rumour every
// villager repeats is kept once and a keeper's answer about their own house is kept beside the next one's.
function journalTold(npc,c){
  if(!npc||!c||c.folder||!c.label||typeof c.response!=='string'||!c.response.trim())return;
  const label=String(c.label).replace(/^[📜🗝⚑★☆✦]\s*/u,'').trim();if(!label)return;
  const T=worldState.told||(worldState.told={});const site=npc._siteId||null;
  let h=0;if(site)for(let i=0;i<c.response.length;i++)h=(h*31+c.response.charCodeAt(i))|0;
  const key=label+'|'+(site?'@'+site+':'+(h>>>0).toString(36):(npc.name||'?'));if(T[key])return;
  let town='';if(site){try{const st=WORLD.siteAnywhere(site);town=(st&&st.name)||'';}catch(e){}}
  T[key]={l:label,s:npc.name||'',w:town,r:c.response,t:Math.floor(worldState.gameTimeAbsMinutes||0),tod:Math.floor(worldState.gameTimeMinutes||0)%1440};
}
let _jnSearch='';
function _jnTopicsHTML(){
  const T=worldState.told||{};const q=_jnSearch.trim().toLowerCase();
  const all=Object.values(T).filter(e=>e&&e.l&&(!q||[e.l,e.s,e.w,e.r].some(x=>String(x||'').toLowerCase().includes(q))));
  if(!all.length)return `<div class="jn-empty">${Object.keys(T).length?'Nothing you were told matches.':'Nobody has told you anything worth keeping yet.'}</div>`;
  const by=new Map();all.forEach(e=>{if(!by.has(e.l))by.set(e.l,[]);by.get(e.l).push(e);});
  return [...by.keys()].sort((a,b)=>a.localeCompare(b)).map(l=>`<div class="jn-day"><div class="jn-head">${_jnEsc(l)}</div>`+
    by.get(l).sort((a,b)=>(a.t||0)-(b.t||0)).map(e=>`<div class="jn-told"><div class="jn-time">told by ${_jnEsc(e.s||'someone')}${e.w?' in '+_jnEsc(e.w):''} · ${_jnEsc(gameDateLine(e.t,e.tod))}</div><div class="jn-text">${_jnEsc(e.r)}</div></div>`).join('')+'</div>').join('');
}
function journalSearch(v){_jnSearch=String(v||'');const L=document.getElementById('jn-topics');if(L)L.innerHTML=_jnTopicsHTML();}
let _jnView='day';
function _jnEsc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function _jnTime(e){return gameDateLine(e.t,e.tod).replace(/^Day \d+ · /,'');}
function renderJournal(){
  const body=document.getElementById('jn-body');if(!body)return;
  document.querySelectorAll('#jn-views button').forEach(b=>b.classList.toggle('active',b.dataset.v===_jnView));
  const L=GAME_LOG.filter(e=>e&&typeof e.text==='string');
  if(_jnView==='topics'){body.innerHTML=`<input id="jn-search" type="search" placeholder="Search what you were told" autocomplete="off" oninput="journalSearch(this.value)"><div id="jn-topics"></div>`;const inp=document.getElementById('jn-search');inp.value=_jnSearch;journalSearch(_jnSearch);return;}
  if(!L.length){body.innerHTML='<div class="jn-empty">Nothing written yet.</div>';return;}
  const qd=id=>(typeof QUEST_DEFS!=='undefined'&&QUEST_DEFS.find(x=>x.id===id))||null;
  const line=(e,withQ)=>{const d=e.q&&withQ?qd(e.q):null;
    return `<div class="jn-line${e.q?' jn-q':''}"><span class="jn-time">${typeof e.t==='number'?_jnEsc(_jnTime(e)):''}</span><span class="jn-text">${_jnEsc(e.icon||'')} ${d?`<b>${_jnEsc(d.title)}</b> — `:''}${_jnEsc(e.text)}</span></div>`;};
  let html='';
  if(_jnView==='quest'){
    const ids=[];L.forEach(e=>{if(e.q&&ids.indexOf(e.q)<0)ids.push(e.q);});
    const st=id=>(typeof qState==='function'?qState(id):'');const inHand=id=>st(id)==='active'||st(id)==='reward';
    ids.sort((a,b)=>(inHand(b)?1:0)-(inHand(a)?1:0));
    if(!ids.length)html='<div class="jn-empty">No quest has been written into the journal yet.</div>';
    ids.forEach(id=>{const d=qd(id),s=st(id);
      html+=`<div class="jn-day"><div class="jn-head">${_jnEsc(d?d.title:id)}<span class="jn-state">${s==='complete'?'complete':inHand(id)?'in hand':''}</span></div>`+
        L.filter(e=>e.q===id).map(e=>`<div class="jn-line jn-q"><span class="jn-time">${typeof e.t==='number'?_jnEsc(gameDateLine(e.t,e.tod)):''}</span><span class="jn-text">${_jnEsc(e.text)}</span></div>`).join('')+'</div>';});
  } else {
    const days=new Map();L.forEach(e=>{const k=typeof e.t==='number'?Math.floor(e.t/1440):-1;if(!days.has(k))days.set(k,[]);days.get(k).push(e);});
    [...days.keys()].sort((a,b)=>b-a).forEach(k=>{
      html+=`<div class="jn-day"><div class="jn-head">${k<0?'Undated':'Day '+(k+1)}</div>`+days.get(k).map(e=>line(e,true)).join('')+'</div>';});
  }
  body.innerHTML=html;
}
function journalView(v){_jnView=(v==='quest'||v==='topics')?v:'day';renderJournal();}
// ── HUB ──────────────────────────────────────────────────────
let hubOpen=false,dollSelectedSlot=null;
function _hubVitals(){try{const s=(id,v,m,n)=>{const b=document.getElementById(id);if(b)b.style.width=Math.max(0,Math.min(100,v/m*100))+'%';const t=document.getElementById(n);if(t)t.textContent=Math.floor(v)+' / '+m;};s('hv-hp',PHP,effMaxHP(),'hv-hpn');s('hv-mp',mana,effMaxMana(),'hv-mpn');s('hv-st',stamina,effMaxStamina(),'hv-stn');}catch(e){}}
let _hubVitalsT=null;
function openHub(tab){_hubVitals();if(!_hubVitalsT)_hubVitalsT=setInterval(()=>{if(!hubOpen){clearInterval(_hubVitalsT);_hubVitalsT=null;return;}_hubVitals();},200);_releasePointerLockForMenu();hubOpen=true;blocking=false;document.getElementById('hub').style.display='flex';hubTab(tab||'inv');}
function closeHub(){hubOpen=false;document.getElementById('hub').style.display='none';hideBagTooltip();setQuickDestroy(false);G.focus();}
function hubTab(name){sndTabSwitch();
  const tabs=['inv','magic','attrs','quests','journal','log','map'];
  document.querySelectorAll('.hub-tab').forEach((t,i)=>t.classList.toggle('active',tabs[i]===name));
  document.querySelectorAll('.hub-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('hpanel-'+name).classList.add('active');
  if(name==='inv')renderHubInv();if(name==='magic')renderHubMagic();
  if(name==='attrs')renderHubAttrs();if(name==='quests')renderQuestLog();if(name==='journal')renderJournal();if(name==='log')renderLog();
  if(name==='map'){wmInit();wmSyncZone();if(typeof WORLD!=='undefined'){if(activeZoneId==='world')WORLD.openMap();else WORLD.closeMap();}} // v80 — world map takes over the pane in the streamed world
}
function slotTierColor(it){
  if(!it)return null;
  // New item system — use material colour
  if(it.matCol)return'#'+it.matCol.toString(16).padStart(6,'0');
  // Legacy name fallback
  if(it.name&&it.name.includes('Legendary'))return'#ffaa00';
  if(it.name&&it.name.includes('Mystic'))return'#9944ff';
  if(it.name&&it.name.includes('Enchant'))return'#4466ff';
  if(it.name&&(it.name.includes('Steel')||it.name.includes('Iron')||it.name.includes('Chain')))return'#aabbcc';
  return'#c8a84a';
}
// All equipment slots in layout order
const EQ_SLOTS=[
  {key:'head',   lbl:'Head',     ico:'🪖', def:null},
  {key:'amulet', lbl:'Amulet',   ico:'📿', def:null},
  {key:'offhand',lbl:'Off-hand', ico:'🛡', def:null},
  {key:'chest',  lbl:'Chest',    ico:'👕', def:{name:'Tattered Tunic',ico:'👕',def:1}},
  {key:'weapon', lbl:'Weapon',   ico:'⚔️', def:{name:'Rusty Sword',ico:'⚔️',atk:[10,18]}},
  {key:'ring',   lbl:'Ring',     ico:'💍', def:null},
  {key:'hands',  lbl:'Hands',    ico:'🧤', def:null},
  {key:'ammo',   lbl:'Ammo',     ico:'🏹', def:null},
  {key:'legs',   lbl:'Legs',     ico:'👖', def:{name:'Worn Breeches',ico:'👖',def:1}},
  {key:'feet',   lbl:'Feet',     ico:'👢', def:{name:'Leather Boots',ico:'👢',def:0}},
];
// Inventory sub-tab state — persists across open/close of hub. 'all' by default.
let invSubtab = 'all';
function setInvSubtab(name){
  invSubtab = name;
  document.querySelectorAll('.inv-subtab').forEach(b=>b.classList.toggle('active', b.dataset.sub===name));
  renderHubInv();
}

// v61r: per-subtab sort preference. Each entry is {col, dir} where col is
// 'name'|'stat'|'wt'|'val' (or null for default tier+name sort) and dir is
// 'desc'|'asc'. Persists for the session across hub open/close. Separate
// preferences per subtab so the player can e.g. sort weapons by ATK and potions
// by heal amount independently without toggling them back each time.
const invSort = {all:{col:null,dir:'desc'}, weapon:{col:null,dir:'desc'}, armor:{col:null,dir:'desc'}, consumable:{col:null,dir:'desc'}, misc:{col:null,dir:'desc'}};
// Cycle order on repeated clicks to the same column: desc → asc → off (default).
// Clicking a different column jumps straight to desc on that column.
function cycleInvSort(col){
  const s = invSort[invSubtab];
  if(s.col!==col){ s.col=col; s.dir='desc'; }
  else if(s.dir==='desc'){ s.dir='asc'; }
  else { s.col=null; s.dir='desc'; }
  renderHubInv();
}
window.cycleInvSort = cycleInvSort;

// Semantic sort key for the Stat column. Weapons sort by mid-atk, armor/shields
// by def (shields fall back to block% × 100), potions by heal/mana/stam amount,
// herbs by effect amount, books by attribute-letter order, misc → 0 (piles at end).
function _statSortKey(it){
  if(!it) return 0;
  if(it.type==='equip' && it.atk) return (it.atk[0]+it.atk[1])/2;
  if(it.type==='equip' && it.block!==undefined) return (it.def||0) + it.block*100;
  if(it.type==='equip' && it.def!==undefined) return it.def||0;
  if(it.type==='potion') return it.heal || it.mana || it.stam || 0;
  if(it.type==='herb' && it.effect) return it.effect.amount || 0;
  return 0;
}

// v61r: quick-destroy modifier. While invQuickDestroy is true (player holds X
// with the hub open), clicking a trash icon skips the confirmation step and
// deletes immediately. Tracked via keydown/keyup listeners installed once at
// hub-open time. Visual feedback: the destroy-hint line in the weight area
// swaps to a highlighted state.
let invQuickDestroy = false;
function setQuickDestroy(on){
  if(invQuickDestroy===on) return;
  invQuickDestroy = on;
  // Light up all destroy icons so the player can see the mode is active.
  // Also flip the hint text. No full re-render needed — just touch the classes.
  document.querySelectorAll('.inv-destroy').forEach(el=>el.classList.toggle('quick', on));
  // v61s: also tag the item rows so the hover cue shifts from "use/equip" to
  // "destroy" — any click on the row destroys, so the visual feedback should
  // make that obvious.
  document.querySelectorAll('.inv-item').forEach(el=>el.classList.toggle('quick-destroy', on));
  const hint=document.getElementById('inv-destroy-hint');
  if(hint) hint.classList.toggle('active', on);
}

// Classify an item into one of the four categories used for sub-tabs.
// Weapons: equip+slot=weapon. Armor: any other equip slot (includes shields/torches via offhand). Consumable: potion/herb. Misc: everything else.
function itemCategory(it){
  if(!it) return 'misc';
  if(it.type==='equip' && it.slot==='weapon') return 'weapon';
  if(it.type==='equip') return 'armor';
  if(it.type==='potion' || it.type==='herb' || it.type==='book') return 'consumable';
  return 'misc';
}
// Short stat string for the "Stat" column on each item row.
function itemStatShort(it){
  if(!it) return '';
  if(it.type==='equip' && it.atk){
    const lo = it.atk[0], hi = it.atk[1];
    // v61t: compact damage-type tag — single letter instead of the full word.
    // Eliminates the "ATK 9–11 · Sl..." truncation that came from the old
    // 3-col grid. Full word stays in the tooltip via itemDesc.
    const wt = it.wType || (it.weaponShape && WSHAPE_TO_WTYPE[it.weaponShape]) || '';
    const wtLbl = wt ? ' ' + wt.charAt(0).toUpperCase() : '';
    return `ATK ${lo}–${hi}${wtLbl}`;
  }
  // Shields carry BOTH block and def now — show both so the player can tell
  if(it.type==='equip' && it.block!==undefined){
    const blockStr = `Block ${Math.round(it.block*100)}%`;
    return it.def ? `${blockStr} · DEF +${it.def}` : blockStr;
  }
  if(it.type==='equip' && it.torchType) return 'Light';
  if(it.type==='equip' && it.def!==undefined) return `DEF +${it.def}`;
  if(it.type==='equip' && it.enchant) return it.enchant.name.replace(/^of /,'');
  // v64 — Ammo (arrows). Show arrow damage range. wType single-letter tag
  // mirrors weapons. Drawn-bow contribution isn't shown here (that's the
  // bow's tooltip job), so the player can read "this arrow adds 3-6 dmg"
  // clearly without confusing it with the bow's atk roll.
  if(it.type==='ammo' && it.arrowDmg){
    const lo = it.arrowDmg[0], hi = it.arrowDmg[1];
    const wt = it.wType || 'pierce';
    const wtLbl = wt ? ' ' + wt.charAt(0).toUpperCase() : '';
    return `+${lo}–${hi}${wtLbl}`;
  }
  if(it.type==='potion' && it.heal) return `+${it.heal} HP`;
  if(it.type==='potion' && it.mana) return `+${it.mana} MP`;
  if(it.type==='potion' && it.stam) return `+${it.stam} Stam`;
  // v61x: effect-shaped potions (Regen/Focus/Energy/Warding/Swiftness tonics).
  // Show rate-per-second for regen lines, percentage for resist/sprint lines,
  // followed by duration. Mirrors the format used in the tooltip so the stat
  // column and tooltip teach the same vocabulary.
  if(it.type==='potion' && it.effect){
    const e = it.effect;
    const dur = e.duration ? `, ${e.duration}s` : '';
    if(e.type==='hpRegen') return `+${e.rate}/s HP${dur}`;
    if(e.type==='mpRegen') return `+${e.rate}/s MP${dur}`;
    if(e.type==='stRegen') return `+${e.rate}/s Stam${dur}`;
    if(e.type==='dmgReduce') return `-${e.pct}% dmg${dur}`;
    if(e.type==='sprintSpeed') return `+${e.pct}% sprint${dur}`;
    return '—';
  }
  // v61t: herbs — each effect.type needs its own formatting. The old fallback
  // printed the raw key ("stamina", "mana", "damage") which was unhelpful and
  // stripped the amount entirely. Named effects get a '+N unit' label matching
  // the potion rendering; anything genuinely unknown falls through to '—'.
  if(it.type==='herb' && it.effect){
    const e = it.effect;
    if(e.type==='heal')    return `+${e.amount} HP`;
    if(e.type==='mana')    return `+${e.amount} MP`;
    if(e.type==='stamina') return `+${e.amount} Stam`;
    if(e.type==='damage')  return `${e.amount} dmg`; // self-damage on consume (Caor Dubh)
    return '—';
  }
  if(it.type==='book'){
    // Show "+1 Attr" if unread, "Read" if already absorbed
    const def=BOOKS.find(b=>b.id===it.bookId);
    if(!def) return 'Book';
    const read=booksRead.has(def.id);
    const attrLbl=(typeof ATTR_DEF!=='undefined'&&ATTR_DEF[def.attr])?ATTR_DEF[def.attr].label:def.attr;
    return read ? `Read` : `+1 ${attrLbl}`;
  }
  if(it.type==='misc') return '—';
  return '';
}
// v61q: destroy-item flow — two-click inline confirmation. First click swaps
// the trash glyph for a red ✕ and sets a 2s auto-revert timer; second click on
// the SAME cell (while it's in 'confirming' state) actually removes the item.
// Any other destroy click clears prior confirmations. All state lives on the
// DOM via the `.confirming` class, so re-rendering the inventory naturally
// resets everything without a separate cleanup pass.
function requestDestroyItem(i, el){
  if(!el) return;
  // v61ad: unique items (quest-bound, story-critical) are non-destroyable.
  // Blocks both the confirm-click path and the hold-X quick-destroy path.
  // Toast explains; no state change. Currently covers: Forge-Man's Hammer,
  // Edna's Rubbing, Royal Mage Commission, Aldwyn's Seal (retroactively via
  // the name match below).
  {
    const it=BAG[i];
    if(it && (it.unique || it.name==="Aldwyn's Seal")){
      showMsg(`${it.name} cannot be destroyed.`, '#c8a84a');
      return;
    }
  }
  // v61r: quick-destroy mode — skip confirmation entirely while X is held.
  if(invQuickDestroy){
    const it=BAG[i];
    if(!it){ renderHubInv(); return; }
    const label = it.qty>1 ? `${it.qty}× ${it.name}` : it.name;
    BAG.splice(i,1);
    hideBagTooltip();
    renderHubInv();
    showMsg(`Destroyed ${label}`, '#a88');
    addLog('🗑', `Destroyed ${label}`);
    return;
  }
  // Clear any other in-flight confirmations (on sibling rows)
  document.querySelectorAll('.inv-destroy.confirming').forEach(other=>{
    if(other!==el){
      other.classList.remove('confirming');
      other.textContent='🗑';
      other.title='Destroy — click to confirm';
    }
  });
  if(el.classList.contains('confirming')){
    // Second click — destroy the item
    const it=BAG[i];
    if(!it){ renderHubInv(); return; }
    const label = it.qty>1 ? `${it.qty}× ${it.name}` : it.name;
    BAG.splice(i,1);
    hideBagTooltip();
    renderHubInv();
    showMsg(`Destroyed ${label}`, '#a88');
    addLog('🗑', `Destroyed ${label}`);
  } else {
    // First click — enter confirming state with auto-revert
    el.classList.add('confirming');
    el.textContent='✕';
    el.title='Click again to destroy';
    setTimeout(()=>{
      if(el.classList.contains('confirming')){
        el.classList.remove('confirming');
        el.textContent='🗑';
        el.title='Destroy — click to confirm';
      }
    }, 2000);
  }
}

function renderHubInv(){
  EQ_SLOTS.forEach(s=>{
    const el=document.getElementById('ds-'+s.key);if(!el)return;
    const it=EQ[s.key];
    const icoEl=el.querySelector('.eq-slot-ico');
    if(icoEl){if(it)icoEl.innerHTML=iconHTML(it).replace('width:22px;height:22px','width:30px;height:30px').replace('font-size:13px','font-size:17px').replace('margin-right:6px','margin:0');else{icoEl.innerHTML=`<span style="display:inline-flex;width:30px;height:30px;align-items:center;justify-content:center;border-radius:5px;background:#2a2420;box-shadow:inset 0 0 0 1px rgba(120,100,70,.35)"><span style="filter:grayscale(1) brightness(.5)">${s.ico}</span></span>`;}} // v80 — one icon family on the doll
    el.classList.toggle('has-item',!!it);
    const col=slotTierColor(it);
    el.style.borderColor=(col&&it)?col:'';
    el.onclick=()=>clickEqSlot(s.key);
    el.onmouseenter=()=>hoverEqSlot(s.key);
    el.onmouseleave=()=>hoverEqSlot(null);
  });
  // Weight bar + encumbrance state
  const _wt = totalCarryWeight();
  const _max = maxCarry();
  const _state = encumbranceState();
  const _col = encumbranceColor(_state);
  const wtFg = document.getElementById('hinv-wt-fg');
  if(wtFg){
    // Bar fills relative to 125% cap so the 80% (burdened) and 100% (overloaded) thresholds are visible.
    const pct = Math.min(100, (_wt / (_max * 1.25)) * 100);
    wtFg.style.width = pct + '%';
    wtFg.style.background = _col;
  }
  const wtText = document.getElementById('hinv-wt-text');
  if(wtText) wtText.textContent = _wt.toFixed(1) + ' / ' + _max.toFixed(0);
  const wtState = document.getElementById('hinv-wt-state');
  if(wtState){
    wtState.textContent = encumbranceLabel(_state);
    wtState.style.color = _col;
  }
  document.getElementById('hinv-gold').textContent=gold+' 🪙';
  // Build filtered, sorted list. We preserve original BAG indices so click/tooltip handlers stay correct.
  const list = document.getElementById('inv-list');
  if(!list) return;
  list.innerHTML='';
  const indexed = BAG.map((it,i)=>({it,i}));
  const filtered = invSubtab==='all' ? indexed : indexed.filter(({it})=>itemCategory(it)===invSubtab);
  // v61r: apply the column sort if one is active, else fall back to the default
  // tier-desc-then-name sort that's been in place since v48. Name is an A→Z
  // comparison with dir flipping via sign; numeric columns subtract.
  const sortState = invSort[invSubtab] || {col:null,dir:'desc'};
  const dirMult = sortState.dir==='asc' ? 1 : -1;
  if(sortState.col==='name'){
    filtered.sort((a,b)=> (a.it.name||'').localeCompare(b.it.name||'') * dirMult);
  } else if(sortState.col==='stat'){
    filtered.sort((a,b)=> (_statSortKey(a.it)-_statSortKey(b.it)) * dirMult);
  } else if(sortState.col==='wt'){
    filtered.sort((a,b)=> (itemWeight(a.it)-itemWeight(b.it)) * dirMult);
  } else if(sortState.col==='val'){
    filtered.sort((a,b)=> (sellPrice(a.it)-sellPrice(b.it)) * dirMult);
  } else {
    filtered.sort((a,b)=>{
      const ta=a.it.tier||0, tb=b.it.tier||0;
      if(ta!==tb) return tb-ta;
      return (a.it.name||'').localeCompare(b.it.name||'');
    });
  }
  // v61s: every sortable header shows both ▲▼ arrows so the sort controls are
  // discoverable at rest. Only the active column + direction is gold; the rest
  // stay muted. Strips any prior rendered arrows so we don't stack glyphs on
  // re-render.
  document.querySelectorAll('.inv-cols span[data-sort]').forEach(sp=>{
    const col = sp.dataset.sort;
    const isActive = col===sortState.col;
    sp.classList.toggle('sort-active', isActive);
    const base = (sp.textContent||'').replace(/\s*[▲▼↑↓]+\s*$/,'').trim();
    const upCls   = (isActive && sortState.dir==='asc')  ? 'sa-active' : '';
    const downCls = (isActive && sortState.dir==='desc') ? 'sa-active' : '';
    sp.innerHTML = `${base}<span class="sort-arrows"><span class="${upCls}">▲</span><span class="${downCls}">▼</span></span>`;
  });
  if(!filtered.length){
    const empty=document.createElement('div');empty.className='inv-empty';
    empty.textContent = invSubtab==='all' ? 'Your bag is empty.' : `No ${invSubtab==='misc'?'miscellaneous':invSubtab} items.`;
    list.appendChild(empty);
    return;
  }
  filtered.forEach(({it,i})=>{
    // try/catch isolates a bad row so one malformed item can't hide the rest of the inventory.
    try {
      const row=document.createElement('div');
      // v61ar: dim/tint rows for items the player can't currently equip so
      // the gate is visible at-a-glance, before any hover or click. Only
      // applies to type==='equip' items with an unmet attribute requirement.
      // Other item types (potions, books, herbs) always click-through.
      let lockedClass='';
      if(it.type==='equip'){
        const req=canEquip(it);
        if(!req.ok) lockedClass=' inv-row-locked';
      }
      row.className='inv-row inv-item'+lockedClass;
      const tierCol = it.type==='equip' && it.matCol ? '#'+it.matCol.toString(16).padStart(6,'0') : '';
      const tierPip = tierCol ? `<span class="inv-tier-pip" style="background:${tierCol}"></span>` : '';
      const enchMark = it.type==='equip' && it.enchant ? '<span class="inv-ench-mark">✦</span>' : '';
      const qty = it.qty>1 ? `<span class="inv-qty">×${it.qty}</span>` : '';
      const wt = itemWeight(it);
      const val = sellPrice(it);
      const stat = itemStatShort(it);
      row.innerHTML = `
        <span class="inv-col-name">${tierPip}<span class="inv-ico">${iconHTML(it)}</span><span class="inv-name-text">${it.name}</span>${enchMark}${qty}</span>
        <span class="inv-col-stat">${stat}</span>
        <span class="inv-col-wt">${wt.toFixed(1)}</span>
        <span class="inv-col-val">${val}</span>
        <span class="inv-destroy" title="Destroy — click to confirm">🗑</span>`;
      // Attach destroy handler separately so the index stays captured in closure
      // (inline onclick with ${i} is fine too but this avoids string-escaping traps
      // if an item ever has weird characters in its name). Stops propagation so
      // the row's useItem/equip click doesn't fire when the player taps destroy.
      const destroyEl = row.querySelector('.inv-destroy');
      if(destroyEl) destroyEl.addEventListener('click', ev=>{
        ev.stopPropagation();
        requestDestroyItem(i, destroyEl);
      });
      // v61s: while X is held, clicking ANYWHERE on the row destroys — no need
      // to hit the small trash column precisely. Falls through to useItem
      // normally. The destroyEl handler above still triggers its own path
      // (stopPropagation keeps it out of this), so trash-clicks without X
      // continue to use the confirmation flow.
      row.onclick=()=>{
        if(invQuickDestroy){
          requestDestroyItem(i, destroyEl);
          return;
        }
        useItem(i);renderHubInv();hideBagTooltip();
      };
      row.addEventListener('mouseenter',ev=>scheduleBagTooltip(i,ev));
      row.addEventListener('mousemove',ev=>moveBagTooltip(ev));
      row.addEventListener('mouseleave',()=>hideBagTooltip());
      list.appendChild(row);
    } catch(err) {
      console.error('Inventory row render failed for item:', it, err);
    }
  });
}
// ── BAG ITEM TOOLTIP ──────────────────────────────────────────────────────
let _bagTipTimer=null,_bagTipEl=null;
function scheduleBagTooltip(idx,ev){
  // v61as: was setTimeout(...,500). The half-second gate read as
  // unresponsiveness once the player learned to expect tooltip-driven info
  // (especially the equip-requirement red line). Now fires on mouseenter.
  // hideBagTooltip on mouseleave still handles cleanup; positionBagTooltip
  // tracks the cursor on mousemove so brief diagonal traversals across
  // multiple rows don't flicker.
  hideBagTooltip();
  _bagTipEl=ev.currentTarget;
  showBagTooltip(idx,ev);
}
function moveBagTooltip(ev){
  const tip=document.getElementById('bag-tooltip');
  if(tip.style.display==='block')positionBagTooltip(ev);
}
function positionBagTooltip(ev){
  const tip=document.getElementById('bag-tooltip');
  const gRect=document.getElementById('g').getBoundingClientRect();
  let tx=ev.clientX-gRect.left+14,ty=ev.clientY-gRect.top-10;
  // Keep inside game container
  if(tx+tip.offsetWidth>gRect.width-4)tx=ev.clientX-gRect.left-tip.offsetWidth-10;
  if(ty+tip.offsetHeight>gRect.height-4)ty=gRect.height-tip.offsetHeight-4;
  tip.style.left=tx+'px';tip.style.top=ty+'px';
}
function hideBagTooltip(){
  clearTimeout(_bagTipTimer);_bagTipTimer=null;
  const tip=document.getElementById('bag-tooltip');
  tip.style.display='none';tip.innerHTML='';
}
function statDelta(label,newVal,oldVal,higherIsBetter=true){
  if(newVal===undefined&&oldVal===undefined)return'';
  const nv=newVal||0,ov=oldVal||0;
  const diff=nv-ov;
  let cls='same',sym='';
  if(diff!==0){const better=(diff>0)===higherIsBetter;cls=better?'better':'worse';sym=(diff>0?'+':'')+diff;}
  return `<div class="bt-row"><span class="bt-label">${label}</span><span class="bt-val">${newVal!==undefined?newVal:'—'}${sym?` <span class="bt-delta ${cls}">(${sym})</span>`:''}</span></div>`;
}
function showBagTooltip(idx,ev){
  const it=BAG[idx];if(!it)return;
  const tip=document.getElementById('bag-tooltip');
  let html='<div class="bt-name">'+it.ico+' '+it.name+'</div>';
  if(it.qty>1)html+='<div class="bt-row"><span class="bt-label">Qty</span><span class="bt-val">'+it.qty+'</span></div>';
  // For equippable items show comparison
  if(it.type==='equip'&&it.slot){
    const cur=EQ[it.slot];
    // Tier/material badge
    if(it.material){
      const mat=MATERIALS.find(m=>m.name===it.material);
      const tierCol=mat?'#'+mat.blade.toString(16).padStart(6,'0'):'#c8b880';
      html+=`<div class="bt-row" style="color:${tierCol};font-size:9px">Tier ${it.tier||'?'} · ${it.material}</div>`;
    }
    // Enchantment
    if(it.enchant){
      const ec=it.enchant.col?'#'+it.enchant.col.toString(16).padStart(6,'0'):'#aaaaff';
      html+=`<div class="bt-row" style="color:${ec};font-size:9px">✦ ${it.enchant.name||it.enchantId}</div>`;
      // Show enchant stats for armor
      if(it.enchantStats){
        const es=it.enchantStats;
        const statLines=[];
        if(es.maxHPBonus)statLines.push(`+${es.maxHPBonus} Max HP`);
        if(es.maxManaBonus)statLines.push(`+${es.maxManaBonus} Max Mana`);
        if(es.maxStaminaBonus)statLines.push(`+${es.maxStaminaBonus} Max Stamina`);
        if(es.hpRegen)statLines.push(`+${es.hpRegen.toFixed(2)}/s HP Regen`);
        if(es.stRegen)statLines.push(`+${es.stRegen.toFixed(2)}/s Stamina Regen`);
        if(es.mpRegen)statLines.push(`+${es.mpRegen.toFixed(2)}/s Mana Regen`);
        if(es.mightBonus)statLines.push(`+${es.mightBonus} Might`);
        if(es.fortitudeBonus)statLines.push(`+${es.fortitudeBonus} Fortitude`);
        if(es.finesseBonus)statLines.push(`+${es.finesseBonus} Finesse`);
        if(es.swiftnessBonus)statLines.push(`+${es.swiftnessBonus} Swiftness`);
        if(es.intBonus)statLines.push(`+${es.intBonus} Intelligence`);
        if(statLines.length)html+=`<div class="bt-row" style="color:#88aacc;font-size:9px">${statLines.join(' · ')}</div>`;
      }
    }
    html+='<div class="bt-sep"></div>';
    if(it.atk||( cur&&cur.atk)){
      const nAtk=it.atk?Math.round((it.atk[0]+it.atk[1])/2):0;
      const oAtk=cur&&cur.atk?Math.round((cur.atk[0]+cur.atk[1])/2):0;
      const nAtkStr=it.atk?it.atk[0]+'–'+it.atk[1]:'—';
      const diff=nAtk-oAtk;
      const cls=diff>0?'better':diff<0?'worse':'same';
      const sym=diff>0?'+'+diff:diff<0?''+diff:'';
      html+=`<div class="bt-row"><span class="bt-label">ATK</span><span class="bt-val">${nAtkStr}${sym?` <span class="bt-delta ${cls}">(${sym})</span>`:''}</span></div>`;
      // v61u: damage type — the compact letter in the inventory row ("S"/"P"/"B")
      // needs a plain-English counterpart in the tooltip so new players can read
      // it. Shown as "Slash" / "Pierce" / "Blunt" plus a one-line mechanical hint.
      // Hints describe the sharpest matchups from the resist table (enemy-resist
      // map, see devlog): blunt is the only type with a clear "good vs" target;
      // slash/pierce mainly differ in which enemies resist them MORE — so the
      // hints frame them as "resisted by" rather than overclaiming strengths.
      const wt = it.wType || (it.weaponShape && WSHAPE_TO_WTYPE[it.weaponShape]) || '';
      if(wt){
        const wtLabel = wt.charAt(0).toUpperCase() + wt.slice(1);
        const wtHint = wt==='slash'  ? 'Resisted by bone & stone'
                     : wt==='pierce' ? 'Good vs carapace · resisted by bone & stone'
                     : wt==='blunt'  ? 'Good vs bone & stone · weak vs ethereal'
                     : '';
        html+=`<div class="bt-row"><span class="bt-label">Type</span><span class="bt-val">${(typeof wtLabel!=='undefined'&&wtLabel)||_typeWord(it)}</span></div>`;
        if(wtHint) html+=`<div class="bt-row" style="color:#6a5838;font-size:9px;font-style:italic;margin-top:-1px">${wtHint}</div>`;
      }
      if(it.weight){const wlbl=['','Light','Medium','Heavy'][it.weight];const stCost=it.weight*7;html+=`<div class="bt-row"><span class="bt-label">Weight</span><span class="bt-val">${wlbl} · ${stCost} stamina/swing</span></div>`;}
    }
    if(it.def!==undefined||(cur&&cur.def!==undefined)){
      const nd=it.def||0,od=(cur&&cur.def)||0;
      const diff=nd-od,cls=diff>0?'better':diff<0?'worse':'same',sym=diff>0?'+'+diff:diff<0?''+diff:'';
      html+=`<div class="bt-row"><span class="bt-label">DEF</span><span class="bt-val">+${nd}${sym?` <span class="bt-delta ${cls}">(${sym})</span>`:''}</span></div>`;
    }
    if(it.block!==undefined||(cur&&cur.block!==undefined)){
      const nb=it.block?Math.round(it.block*100):0,ob=cur&&cur.block?Math.round(cur.block*100):0;
      const diff=nb-ob,cls=diff>0?'better':diff<0?'worse':'same',sym=diff>0?'+'+diff+'%':diff<0?diff+'%':'';
      html+=`<div class="bt-row"><span class="bt-label">Block</span><span class="bt-val">${nb}%${sym?` <span class="bt-delta ${cls}">(${sym})</span>`:''}</span></div>`;
    }
    // Attribute requirement
    if(it.reqAttr&&it.reqVal>0){
      const have=ATTRS[it.reqAttr]||0;
      const met=have>=it.reqVal;
      const reqLabel=ATTR_DEF[it.reqAttr]?.label||it.reqAttr;
      html+=`<div class="bt-row" style="color:${met?'#66aa44':'#cc4444'};font-size:9px">Requires ${reqLabel} ${it.reqVal}${met?'':" (you have "+have+")"}</div>`;
    }
    if(cur&&cur.name){html+='<div class="bt-cur">Equipped: '+cur.ico+' '+cur.name+'</div>';}
    else{html+='<div class="bt-cur">Slot is empty</div>';}
    html+='<div class="bt-hint">Click to equip</div>';
  } else if(it.type==='potion'){
    if(it.heal)html+='<div class="bt-row"><span class="bt-label">Heals</span><span class="bt-val">+'+it.heal+' HP</span></div>';
    if(it.mana)html+='<div class="bt-row"><span class="bt-label">Restores</span><span class="bt-val">+'+it.mana+' Mana</span></div>';
    if(it.stam)html+='<div class="bt-row"><span class="bt-label">Restores</span><span class="bt-val">+'+it.stam+' Stamina</span></div>';
    // v61x: effect-shaped potions (elixirs). Show the buff details prominently,
    // plus a note about the tier-upgrade stacking rule so the player learns the
    // system from the tooltip the first time they hover one.
    if(it.effect){
      const e = it.effect;
      const col = e.col || '#88cc88';
      const tierLabel = e._potionTier===3?'Master':e._potionTier===2?'Strong':'Mild';
      html += `<div class="bt-row" style="color:${col};font-size:9px">✦ ${tierLabel} elixir</div>`;
      if(e.type==='hpRegen')     html+=`<div class="bt-row"><span class="bt-label">Effect</span><span class="bt-val">+${e.rate} HP/s</span></div>`;
      else if(e.type==='mpRegen')html+=`<div class="bt-row"><span class="bt-label">Effect</span><span class="bt-val">+${e.rate} Mana/s</span></div>`;
      else if(e.type==='stRegen')html+=`<div class="bt-row"><span class="bt-label">Effect</span><span class="bt-val">+${e.rate} Stamina/s</span></div>`;
      else if(e.type==='dmgReduce')  html+=`<div class="bt-row"><span class="bt-label">Effect</span><span class="bt-val">-${e.pct}% damage taken</span></div>`;
      else if(e.type==='sprintSpeed')html+=`<div class="bt-row"><span class="bt-label">Effect</span><span class="bt-val">+${e.pct}% sprint speed</span></div>`;
      if(e.duration) html+=`<div class="bt-row"><span class="bt-label">Duration</span><span class="bt-val">${e.duration}s</span></div>`;
      html+=`<div class="bt-row" style="color:#7a6848;font-size:9px;font-style:italic">A stronger elixir of the same kind cannot be overwritten.</div>`;
    }
    html+='<div class="bt-hint">Click to use</div>';
  } else if(it.type==='book'){
    const def=BOOKS.find(b=>b.id===it.bookId);
    if(def){
      const read=booksRead.has(def.id);
      const attrLbl=(typeof ATTR_DEF!=='undefined'&&ATTR_DEF[def.attr])?ATTR_DEF[def.attr].label:def.attr;
      if(read){
        html+='<div class="bt-row" style="color:#8a7050;font-style:italic">Already absorbed</div>';
        html+='<div class="bt-row" style="color:#7a6848;font-size:9px">Re-read for lore only</div>';
      } else {
        html+=`<div class="bt-row" style="color:#ffd700"><span class="bt-label">On read</span><span class="bt-val">+1 ${attrLbl}</span></div>`;
        html+=`<div class="bt-row" style="color:#a08860;font-size:9px">${def.pages.length} page${def.pages.length>1?'s':''}</div>`;
      }
    }
    html+='<div class="bt-hint">Click to read</div>';
  } else if(it.type==='herb'){
    // Known effect
    const eff=it.effect;
    if(eff){
      if(eff.type==='heal')html+=`<div class="bt-row" style="color:#5a8a3a">Restores +${eff.amount} HP</div>`;
      else if(eff.type==='stamina')html+=`<div class="bt-row" style="color:#5a9a3a">Restores +${eff.amount} Stamina</div>`;
      else if(eff.type==='mana')html+=`<div class="bt-row" style="color:#4a7ad4">Restores +${eff.amount} Mana</div>`;
      else if(eff.type==='hpRegen')html+=`<div class="bt-row" style="color:#44aa44">+${eff.rate} HP/s for ${eff.duration}s</div>`;
      else if(eff.type==='damage')html+=`<div class="bt-row" style="color:#cc4444">-${eff.amount} HP (harsh)</div>`;
    }
    // Hidden effect
    const countKey=it._typeKey||it.name.toLowerCase().replace(/[^a-z]/g,'');
    const count=HERB_CONSUME_COUNTS[countKey]||0;
    const unlocked=count>=HIDDEN_UNLOCK_COUNT;
    html+='<div class="bt-sep"></div>';
    if(unlocked&&it.hiddenEffect){
      const he=it.hiddenEffect;
      let hDesc=he.label||'Unknown effect';
      if(he.duration)hDesc+=` (${he.duration}s)`;
      html+=`<div class="bt-row" style="color:#c8a84a;font-size:9px">✦ ${hDesc}</div>`;
    } else {
      const needed=Math.max(0,HIDDEN_UNLOCK_COUNT-count);
      html+=`<div class="bt-row" style="color:#4a3820;font-size:9px">✦ Hidden effect — consume ${needed} more to reveal</div>`;
    }
    const def=HERB_DEF[it._typeKey]||HERB_DEF[it.name.toLowerCase().replace(/[^a-z]/g,'')];
    if(def)html+=`<div class="bt-row" style="color:#3a2c14;font-size:9px;font-style:italic">${def.desc}</div>`;
    html+='<div class="bt-hint">Click to use · Sells to apothecaries</div>';
  } else if(it.name==='Mystic Scroll'){
    html+='<div class="bt-row" style="color:#7a6030">Grants knowledge of a random spell</div>';
    html+='<div class="bt-hint">Click to read</div>';
  } else {
    html+='<div class="bt-row"><span class="bt-label">Type</span><span class="bt-val">'+_typeWord(it)+'</span></div>';
  }
  tip.innerHTML=html;
  tip.style.display='block';
  positionBagTooltip(ev);
}

function hoverEqSlot(key){
  const nameEl=document.getElementById('eq-tooltip-name');
  const statEl=document.getElementById('eq-tooltip-stat');
  const hintEl=document.getElementById('eq-tooltip-hint');
  if(!key){nameEl.textContent='Hover or click a slot';statEl.textContent='';hintEl.textContent='';return;}
  const s=EQ_SLOTS.find(x=>x.key===key);
  const it=EQ[key];
  if(!it){nameEl.textContent='— '+s.lbl+' (empty) —';statEl.textContent=key==='weapon'?'Fists  ·  ATK '+FISTS.atk[0]+'–'+FISTS.atk[1]:'';hintEl.textContent='Equip from bag below';return;}
  nameEl.innerHTML=iconHTML(it)+' '+it.name;
  const lines=[];
  if(it.atk)lines.push('ATK '+it.atk[0]+'–'+it.atk[1]);
  if(it.def)lines.push('DEF +'+it.def);
  if(it.block)lines.push('Block '+Math.round(it.block*100)+'%');
  statEl.textContent=lines.join('  ·  ')||'No combat stats';
  hintEl.textContent='Click to unequip';
}
function clickEqSlot(key){
  const it=EQ[key];
  if(!it)return;
  // Unequipping moves the item from EQ to BAG and leaves the slot empty (S173: no default gear
  // takes its place; an empty weapon slot is your fists). Weight stays in total carry.
  bagAdd(eqBagCopy(it,key));
  EQ[key]=null;
  invalidateArmorCache();
  if(key==='weapon')buildViewmodel();
  if(key==='offhand')buildShieldViewmodel();
  if(key==='hands' || key==='chest'){ buildViewmodel(); buildShieldViewmodel(); } // v70.1 — hands→glove colour, chest→arm sleeve colour
  hoverEqSlot(key);
  renderHubInv();
  showMsg('Unequipped!','#d4804a');
}
// dollSelectedSlot declared above in hubOpen line
function selectDollSlot(){}
function unequipSlot(){}
function renderHubMagic(){
  const grid=document.getElementById('spell-grid');grid.innerHTML='';
  const activeBar=document.getElementById('spell-active-bar');
  const nameEl=document.getElementById('spell-active-name');
  const nKnown=Object.keys(knownSpells).length;

  if(nKnown===0){
    // Empty state: different copy + dimmed styling
    if(activeBar){
      activeBar.style.opacity='.55';
      activeBar.innerHTML=`<span style="font-style:italic">◯ No magic known — seek carved sigils in the deep places.</span>`;
    }
  } else {
    if(activeBar){activeBar.style.opacity='1';}
    const sp=SPELLS.find(s=>s.id===activeSpellId);
    const tier=sp?getSpellTier(sp.id):0;
    const disp=sp&&tier?`<b id="spell-active-name">${spellDisplayName(sp,tier)}</b> <span style="color:#7a6030">${TIER_STARS[tier-1]}</span>`:'<b id="spell-active-name">None</b>';
    if(activeBar){activeBar.innerHTML=`Active spell: ${disp} &nbsp;·&nbsp; Press <b style="color:#c8e88a">F</b> to cast &nbsp;·&nbsp; Click a spell below to select it`;}
  }

  SPELLS.forEach(s=>{
    const tier=getSpellTier(s.id);
    const known=tier>0;
    const partial=partialSpells.includes(s.id);
    const locked=!known&&!partial;
    const school=SCHOOL_DEF[s.school];
    const card=document.createElement('div');
    card.className='spell-card'+(s.id===activeSpellId?' active-spell':locked?' locked':partial?' partial':'');

    // Name shown depends on tier: Impression hides the translation to preserve reveal
    const nameShown=known?spellDisplayName(s,tier):s.nameIr;
    const displayCost=known?spellCost(s,tier):s.cost;

    // Tier row: stars + current tier label, or INT gate if locked
    let tierRow='';
    if(known){
      tierRow=`<div class="spell-req"><span style="color:${school.col};letter-spacing:.2em">${TIER_STARS[tier-1]}</span> ${TIER_LABEL[tier-1]}`;
      if(tier<3){
        const nextReq=s.intReqs[tier];
        const nextLabel=TIER_LABEL[tier];
        tierRow+=` &nbsp;·&nbsp; <span style="color:#7a6030">${nextLabel} at INT ${nextReq}</span>`;
      } else {
        tierRow+=` &nbsp;·&nbsp; <span style="color:#c8a84a">fully understood</span>`;
      }
      tierRow+=`</div>`;
    } else if(partial){
      tierRow=`<div class="spell-req">🕯 Partially understood · Need INT ${s.intReqs[0]}</div>`;
    } else {
      // Locked: reveal school and impression requirement — the fiction is "you've heard of these"
      tierRow=`<div class="spell-req">🔒 ${school.name} (${school.en}) · Touch a sigil to learn &nbsp;·&nbsp; <span style="color:#7a6030">Impression at INT ${s.intReqs[0]}</span></div>`;
    }

    card.innerHTML=
      `<div class="spell-top">`
      +`<span class="spell-ico">${s.ico}</span>`
      +`<span class="spell-name" style="color:${known?school.col:'#7a7060'}">${nameShown}</span>`
      +`<span class="spell-cost">${displayCost} mana</span>`
      +`</div>`
      +`<div class="spell-desc">${s.desc}</div>`
      +tierRow;

    if(known)card.onclick=()=>{
      activeSpellId=s.id;
      renderHubMagic();updateSpellButton();
      showMsg('Active: '+spellDisplayName(s,tier),'#88ccff');
    };
    grid.appendChild(card);
  });
}
function renderHubAttrs(){
  // v61at: character sheet header — name + archetype label.
  const nameEl=document.getElementById('hub-charsheet-name');
  const archEl=document.getElementById('hub-charsheet-arch');
  try{if(typeof WORLD!=='undefined'&&activeZoneId==='world'){const nat=WORLD.nationOf(...WORLD.cellOf(px,pz));const P=WORLD.PEOPLES[WORLD.playerPeople()];archEl.dataset.tail=` · ${P?P.name:''} · in ${nat.name}`;}}catch(e){}
  if(nameEl) nameEl.textContent=playerName||'Traveller';
  if(archEl){
    const a=ARCHETYPES.find(x=>x.id===playerArchetype);
    archEl.textContent = (a ? `${a.icon} ${a.label} · Level ${level}` : `Level ${level}`)+(archEl.dataset.tail||''); // v80 — people and nation
  }
  document.getElementById('vb-hp').style.width=(PHP/effMaxHP()*100)+'%';document.getElementById('vn-hp').textContent=PHP+' / '+effMaxHP();
  document.getElementById('vb-mp').style.width=(mana/effMaxMana()*100)+'%';document.getElementById('vn-mp').textContent=Math.floor(mana)+' / '+effMaxMana();
  document.getElementById('vb-st').style.width=(stamina/effMaxStamina()*100)+'%';document.getElementById('vn-st').textContent=Math.floor(stamina)+' / '+effMaxStamina();
  document.getElementById('vr-mp').textContent=(0.8+(level-1)*0.15+attrEff('intelligence')*0.2).toFixed(1)+'/sec'; /* v80 S334 — the main loop's rate: Intelligence, as its card says (it read Resolve) */
  document.getElementById('vr-st').textContent=(3+(level-1)*0.4+ATTRS.resolve*0.3).toFixed(1)+'/sec';
  const rows=document.getElementById('attr-rows');rows.innerHTML='';
  Object.keys(ATTR_DEF).forEach(key=>{const def=ATTR_DEF[key];const mult=getMultiplier(key);const actVal=lvAct[def.actKey]||0;const t=def.thresholds;const curThresh=t[mult-1]||0;const nextThresh=t[mult]||t[t.length-1];const prog=nextThresh>curThresh?Math.min(1,(actVal-curThresh)/(nextThresh-curThresh)):1;const mc=['','lu-mult-1','lu-mult-2','lu-mult-3','lu-mult-4','lu-mult-5'][mult];const row=document.createElement('div');row.className='attr-row';row.innerHTML=`<span class="attr-ico">${def.icon}</span><span class="attr-name-col">${def.label}</span><span class="attr-pts">${ATTRS[key]}</span><div class="attr-prog-wrap"><div class="attr-prog-fill" style="width:${prog*100}%"></div></div><span class="attr-act-label">${actVal}</span><span class="attr-mult-badge ${mc}">×${mult}</span>`;rows.appendChild(row);});
  const dg=document.getElementById('derived-grid');dg.innerHTML='';
  [['Melee DMG','+'+Math.round(attrEff('might')*ATTR_DMG_PER_POINT*100)+'%'],['Ranged DMG','+'+Math.round(attrEff('finesse')*ATTR_DMG_PER_POINT*100)+'%'],['Spell DMG','+'+Math.round(attrEff('intelligence')*ATTR_DMG_PER_POINT*100)+'%'],['Move Speed','+'+attrEff('swiftness')*2+'%'],['Atk Speed','+'+attrEff('swiftness')*1+'%'],['Crit Chance','+'+ATTRS.fortune*2+'%'],['Gold Found','+'+(ATTRS.fortune||0)*5+'%'],['Item Drop','+'+(ATTRS.fortune||0)*2.5+'%'],['Max Mana Bonus','+'+attrEff('intelligence')*10],['Barter Bonus','+'+Math.round(barterPct()*100)+'%']].forEach(([l,v])=>{const d=document.createElement('div');d.className='derived-row';d.innerHTML=l+'<span>'+v+'</span>';dg.appendChild(d);});
  // v80 — Standing: who you are to the world
  try{const sb=document.getElementById('standing-body');if(sb&&typeof WORLD!=='undefined'){
    const row=(k,v)=>`<div style="display:flex;gap:10px;padding:3px 0;border-bottom:1px solid rgba(120,100,70,.18)"><span style="color:#8a7a60;min-width:150px">${k}</span><span style="color:#e8dcc0">${v}</span></div>`;
    let out='';
    const pp=WORLD.playerPeople();const P=WORLD.PEOPLES[pp];out+=row('People',P?P.name+(pp==='oldblood'&&worldState.cold?` · the Cold ${worldState.cold}`:''):'—');
    const F=WORLD.fstate();for(const k in WORLD.FACTIONS){const f=WORLD.FACTIONS[k];const st=F[k];const closed=Object.keys(WORLD.FACTIONS).some(o=>o!==k&&F[o].rank>=2);out+=row(f.name,st.rank?`${f.ranks[st.rank-1]} · ${st.done} services${st.house?' · holds '+f.house:''}`:(closed?'<span style="color:#a08a70">closed to you</span>':`no standing · ${st.done} services`));}
    const G=worldState.guild;if(G){for(const g of ['guild_f','guild_m']){const gd=WORLD.guild.GUILD_DEF[g];const gs=G[g];out+=row(gd.name,gs&&gs.done>0?`${WORLD.guild.rankOf(g)} · ${gs.done} tasks`:'not a member');}}
    const fav=worldState.favor||{};const friends=Object.entries(fav).filter(([id,v])=>v>=3).map(([id,v])=>{const t=WORLD.siteAnywhere(id);return t?`${t.name} (${v})`:null;}).filter(Boolean);const enemies=Object.entries(fav).filter(([id,v])=>v<=-2).map(([id,v])=>{const t=WORLD.siteAnywhere(id);return t?t.name:null;}).filter(Boolean);
    out+=row('Friend of',friends.length?friends.join(', '):'—');if(enemies.length)out+=row('Unwelcome in',enemies.join(', '));
    const owned=worldState.owned||{};const T=worldState.towns||{};const houses=Object.values(owned).map(o=>o.name);const towns=Object.keys(T).filter(id=>T[id].flags&&T[id].flags.owned!=null).map(id=>{const t=WORLD.siteAnywhere(id);return t?t.name:null;}).filter(Boolean);
    out+=row('Holdings',[...towns.map(t=>t+' (deed)'),...houses,...(worldState.ship?[`the ${worldState.ship.name||'ship'}${worldState.ship.cls?' ('+worldState.ship.cls+')':''}`]:[])].join(', ')||'—');
    const R=worldState.routes||{},C=worldState.coaches||{};const nr=Object.keys(R).length,nc=Object.keys(C).length;if(nr||nc)out+=row('Roads',`${nr} trade route${nr===1?'':'s'}, ${nc} coaching road${nc===1?'':'s'}`);
    const v=worldState.varek;if(v&&(v.done.returns||v.done.breath||v.done.map||v.done.chapel))out+=row('Varek','<span style="color:#a0a8c0">has spoken to you '+Object.keys(v.done).length+' time'+(Object.keys(v.done).length===1?'':'s')+'</span>');
    sb.innerHTML=out;}}catch(e){}
}
