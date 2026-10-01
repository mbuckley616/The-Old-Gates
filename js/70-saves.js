
// ══════════════════════════════════════════════════════════════════════════
// SAVE / LOAD SYSTEM  (10 slots)
// ══════════════════════════════════════════════════════════════════════════
// v61ad: bumped to 2 for worldState key. Old saves (v1) still load via the
// load-path fallback — worldState defaults to all-false, which is the "fresh
// Act I" state any pre-burn save would correctly inhabit.
const SAVE_VERSION=2;
const SAVE_SLOTS=10;
// Serialize one item (no function refs — enchants stored by id)
function _serItem(it){
  if(!it)return null;
  const s={};
  // Whitelist of item properties persisted to save. CRITICAL: any new item field that useItem/sellPrice
  // depends on must be added here, otherwise it gets stripped on save→load roundtrip. Prior bug: heal/mana
  // were missing, causing potions to silently become inert after any auto-save (zone travel, dungeon exit).
  for(const k of['name','ico','type','tier','material','slot','atk','def','weight',
                  'weaponShape','weaponType','wType','matCol','matGuard','matGlow','blockPct','twoHand',
                  'cleaveTargets','postureMult','blockReduce', // v65 — 2H weapon combat fields
                  'ammoType','qty','sellVal','buyPrice','sellMult','effect','hiddenEffect',
                  'arrowDmg', // v64 — preserve arrow damage range across save/load
                  '_boughtBack', // v68 — buy-back overlay tag
                  '_bagPrice','bundle', // S366 — a bought-back piece's own price; ammo's bundle size
                  'heal','mana','stam','value','weight',
                  'zone','col','glowCol','respawn','desc','knownDesc','hiddenDesc',
                  'herbKey','isHerb','isMisc','shieldType','torchType','block','blockMult',
                  'bookId']){
    if(it[k]!==undefined)s[k]=it[k];
  }
  if(it.enchant){
    s._enchantId=it.enchant.id;
    // Stamp the table this id belongs to. Detected from the enchant object: armor
    // enchants expose .apply(item) → stats; weapon enchants expose .effect(dmg) → hit
    // payload. Prior code tried to read it._enchantType which was never set anywhere,
    // so _restoreEnchant always fell through to ARMOR_ENCHANTS and silently dropped
    // weapon enchants on reload. (v61i fix.)
    s._enchantType=it.enchant.apply?'armor':'weapon';
  }
  return s;
}

// Rebuild enchant function refs from saved id. Searches both tables (ids are disjoint
// between WEAPON_ENCHANTS and ARMOR_ENCHANTS), then for armor enchants also re-derives
// `enchantStats` — that field isn't in the _serItem whitelist, so on a fresh load the
// item has no stats object and getArmorEnchantBonuses() silently sums zeros. Back-compat
// with pre-v61i saves that never stamped _enchantType (we just scan both tables).
//
// v61j: added name-based recovery. Some saves were damaged by a prior v61/v61h load→save
// cycle: the old restore dropped weapon enchants by looking in the wrong table, then the
// next save stripped _enchantId because it.enchant was undefined. The decorated name
// ("Iron Dagger of Life Drain") survived the cycle though, so we parse "of X" and match
// by name as a last resort.
function _restoreEnchant(s){
  if(!s)return s;
  if(s._enchantId){
    let enc=null;
    if(s._enchantType==='weapon')     enc=WEAPON_ENCHANTS.find(e=>e.id===s._enchantId);
    else if(s._enchantType==='armor') enc=ARMOR_ENCHANTS.find(e=>e.id===s._enchantId);
    else enc=WEAPON_ENCHANTS.find(e=>e.id===s._enchantId)
          ||ARMOR_ENCHANTS.find(e=>e.id===s._enchantId);
    if(enc){
      s.enchant=enc; s.enchantName=enc.name; if(enc.col)s.enchantCol=enc.col;
      // Armor path: regenerate the bonus stats from the item's tier. Safe to do
      // regardless of whether stats already existed — .apply() is pure on item.tier.
      if(enc.apply)s.enchantStats=enc.apply(s);
    }
    delete s._enchantId; delete s._enchantType;
  }
  // Name-based recovery for pre-damaged saves. Only fires if no enchant was resolved
  // above. Matches against enchant.name exactly (no fuzzy matching), so false positives
  // are impossible — a name that didn't come from an enchant roll can't match.
  if(!s.enchant && s.type==='equip' && typeof s.name==='string'){
    const ofIdx=s.name.lastIndexOf(' of ');
    if(ofIdx>=0){
      const suffix=s.name.substring(ofIdx+1); // "of Life Drain", "of the Mage", etc.
      const enc=WEAPON_ENCHANTS.find(e=>e.name===suffix)
             ||ARMOR_ENCHANTS.find(e=>e.name===suffix);
      if(enc){
        s.enchant=enc; s.enchantName=enc.name; s.enchantId=enc.id;
        if(enc.col)s.enchantCol=enc.col;
        if(enc.apply)s.enchantStats=enc.apply(s);
      }
    }
  }
  return s;
}

// Zone display names for slot previews
const ZONE_LABEL={overworld:'🌿 Ashenmoor',forest:'🌲 Deepwood',ironhaven:'🏰 Ironhaven'};

// ═══ SAVE STORE (Session 136) ═══════════════════════════════════════
// Payloads live in IndexedDB (a quota of hundreds of MB, and not shared
// with every other local page the way file:// localStorage is); a small
// index of what exists lives in localStorage so the menus render at once.
// Saves belong to a character (charId set when the character is made) and
// come in two kinds: manual slots 1–8 and an autosave ring of 5 that
// rotates. Old DOS_save_N entries are moved into the store on first boot.
const SS={db:null,ready:false,idx:[],cache:{},fallback:false};
const SS_INDEX_KEY='OG_save_index',SS_ACTIVE_KEY='OG_save_active',SS_MANUAL=8,SS_AUTO=5;
function ssLoadIndex(){try{SS.idx=JSON.parse(localStorage.getItem(SS_INDEX_KEY)||'[]');}catch(e){SS.idx=[];}return SS.idx;}
function ssSaveIndex(){try{localStorage.setItem(SS_INDEX_KEY,JSON.stringify(SS.idx));}catch(e){}}
function ssOpen(){return new Promise((res,rej)=>{if(SS.db||SS.fallback)return res(SS.db);
  if(typeof indexedDB==='undefined'){SS.fallback=true;return res(null);}
  // v80 S137 — settle exactly once; a request that never answers (blocked, stalled) is an error with a name, not a hang
  let settled=false;const fin=(f,v)=>{if(settled)return;settled=true;clearTimeout(to);f(v);};
  const to=setTimeout(()=>fin(rej,new Error('the save store did not open')),8000);
  let req;try{req=indexedDB.open('the_old_gates',1);}catch(e){SS.fallback=true;return fin(res,null);}
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('saves'))db.createObjectStore('saves');};
  req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{try{db.close();}catch(e){}if(SS.db===db)SS.db=null;};db.onclose=()=>{if(SS.db===db)SS.db=null;};SS.db=db;fin(res,db);};
  req.onerror=()=>{SS.fallback=true;fin(res,null);};});}
function ssPut(key,str,retried){return ssOpen().then(db=>new Promise((res,rej)=>{if(!db){try{localStorage.setItem('OGS_'+key,str);res(true);}catch(e){rej(e);}return;}
  // v80 S137 — a quota failure arrives as 'abort', not 'error'; without onabort the promise never settled and the menu just sat there
  let settled=false;const fin=(f,v)=>{if(settled)return;settled=true;clearTimeout(to);f(v);};
  const to=setTimeout(()=>fin(rej,new Error('the save store did not answer')),10000);
  let tx;try{tx=db.transaction('saves','readwrite');tx.objectStore('saves').put(str,key);}
  catch(e){if(e&&e.name==='InvalidStateError'&&!retried){if(SS.db===db)SS.db=null;clearTimeout(to);settled=true;return ssPut(key,str,true).then(res,rej);}return fin(rej,e);}
  tx.oncomplete=()=>fin(res,true);tx.onerror=()=>fin(rej,tx.error||new Error('the write failed'));tx.onabort=()=>fin(rej,tx.error||new Error('the write was aborted'));}));}
function ssGet(key){if(SS.cache[key])return Promise.resolve(SS.cache[key]);return ssOpen().then(db=>new Promise((res,rej)=>{if(!db){res(localStorage.getItem('OGS_'+key));return;}
  const tx=db.transaction('saves','readonly');tx.onabort=()=>rej(tx.error||new Error('the read was aborted'));const rq=tx.objectStore('saves').get(key);rq.onsuccess=()=>res(rq.result||null);rq.onerror=()=>rej(rq.error);}));}
function ssDel(key){return ssOpen().then(db=>new Promise((res)=>{delete SS.cache[key];if(!db){try{localStorage.removeItem('OGS_'+key);}catch(e){}res(true);return;}
  const tx=db.transaction('saves','readwrite');tx.objectStore('saves').delete(key);tx.oncomplete=()=>res(true);tx.onerror=tx.onabort=()=>res(false);})).catch(()=>false);}
// ── the index ──
function ssEntry(key){return SS.idx.find(e=>e.key===key)||null;}
function ssChars(){const m={};for(const e of SS.idx){const c=m[e.charId]||(m[e.charId]={id:e.charId,name:e.charName||'Unnamed',people:e.people||'',arch:e.arch||'',level:0,last:0,saves:[]});c.saves.push(e);if(e.ts>c.last){c.last=e.ts;c.level=e.level;}}return Object.values(m).sort((a,b)=>b.last-a.last);}
function ssActiveKey(){try{return localStorage.getItem(SS_ACTIVE_KEY);}catch(e){return null;}}
function ssSetActive(key){try{localStorage.setItem(SS_ACTIVE_KEY,key);}catch(e){}}
function ssCharId(){if(typeof worldState!=='undefined'&&worldState){if(!worldState.charId)worldState.charId='c'+Date.now().toString(36);return worldState.charId;}return 'legacy';}
function ssMetaFrom(d,kind,slot){return {key:`${d.charId||'legacy'}_${kind}_${slot}`,charId:d.charId||'legacy',charName:d.pName||'Unnamed',people:(d.wS&&d.wS.people)||'',arch:d.arch||'',kind,slot,level:d.level,gold:d.gold,zone:d.zone,where:d.where,ts:d.ts||Date.now(),size:0};}
// ── writing ──
// v80 S137 — the payload is data, never the scene. Quests and guild tasks park live handles on themselves
// (a lost person's NPC, a relic's mesh and light); three.js objects stringify through toJSON into whole
// scene-graph dumps (a 7 KB save became 62 KB), and anything circular threw. Both are skipped here.
const SS_RUNTIME_KEYS={_npc:1,_obj:1};
function ssEngineObj(v){return !!(v&&typeof v==='object'&&(v.isObject3D||v.isMaterial||v.isBufferGeometry||v.isGeometry||v.isTexture||v.isSkeleton||(typeof Node!=='undefined'&&v instanceof Node)));}
function ssStringify(d){SS.cut=[];
  const base=function(k,v){if(SS_RUNTIME_KEYS[k])return undefined;const raw=this?this[k]:v;if(ssEngineObj(raw)){SS.cut.push(k);return undefined;}return v;};
  try{return JSON.stringify(d,base);}
  catch(e){if(!(e instanceof TypeError))throw e;const seen=new WeakSet();
    const s=JSON.stringify(d,function(k,v){v=base.call(this,k,v);if(v&&typeof v==='object'){if(seen.has(v)){SS.cut.push('cycle:'+k);return undefined;}seen.add(v);}return v;});
    console.warn('save: cut circular references at',SS.cut);return s;}}
function ssWhy(e){if(!e)return 'unknown error';if(e.name==='QuotaExceededError')return 'the browser refused the space';return ((e.name&&e.name!=='Error')?e.name+': ':'')+String(e.message||e).slice(0,140);}
function ssWrite(kind,slot,label){let meta,str;
  return Promise.resolve().then(()=>{const d=_buildSavePayload();d.charId=ssCharId();d.ts=Date.now();str=ssStringify(d);meta=ssMetaFrom(d,kind,slot);meta.size=str.length;return ssPut(meta.key,str);})
    .then(()=>{SS.lastErr=null;SS.cache[meta.key]=str;SS.idx=SS.idx.filter(e=>e.key!==meta.key);SS.idx.push(meta);ssSaveIndex();ssSetActive(meta.key);if(label!==false)showMsg(label||`💾 Saved — ${kind==='auto'?'autosave':'slot '+(slot+1)}.`,'#c8e88a');return meta;})
    .catch(e=>{const why=ssWhy(e);SS.lastErr={ts:Date.now(),why,kind};console.error('save',e);try{addLog('⚠',`Save failed (${kind==='auto'?'autosave':'slot '+(slot+1)}): ${why}`);}catch(_){}showMsg('⚠ Save failed — '+why,'#e88a8a');return null;});}
function saveToSlot(n){return ssWrite('manual',n);}
function ssAutosave(){const cid=ssCharId();const autos=SS.idx.filter(e=>e.charId===cid&&e.kind==='auto').sort((a,b)=>a.ts-b.ts);let slot=0;const used=new Set(autos.map(a=>a.slot));for(let i=0;i<SS_AUTO;i++){if(!used.has(i)){slot=i;break;}if(i===SS_AUTO-1)slot=autos[0].slot;}
  return ssWrite('auto',slot,'💾 Autosaved.');}
function saveGame(force){if(typeof worldState==='undefined'||!worldState)return;const now=Date.now();if(!force&&SS.lastAuto&&now-SS.lastAuto<90000)return; /* the ring holds distinct moments, not five saves from one minute */ SS.lastAuto=now;ssAutosave();}
function ssDelete(key){SS.idx=SS.idx.filter(e=>e.key!==key);ssSaveIndex();if(ssActiveKey()===key){const c=ssChars()[0];const n=c?c.saves.sort((a,b)=>b.ts-a.ts)[0]:null;if(n)ssSetActive(n.key);else{try{localStorage.removeItem(SS_ACTIVE_KEY);}catch(e){}}}return ssDel(key);}
function ssDeleteChar(charId){const keys=SS.idx.filter(e=>e.charId===charId).map(e=>e.key);return Promise.all(keys.map(ssDelete));}
// ── reading ──
function ssLoad(key){return ssGet(key).catch(e=>{console.error('load',e);showMsg('⚠ Could not read that save — '+ssWhy(e),'#e88a8a');return undefined;}).then(raw=>{if(raw===undefined)return null;if(!raw){showMsg('⚠ That save is missing.','#e88a8a');return null;}let d;try{d=JSON.parse(raw);}catch(e){showMsg('⚠ Save data corrupted.','#e88a8a');return null;}
  if(!d||(d.v!==SAVE_VERSION&&d.v!==1)){showMsg('⚠ Save version mismatch.','#e8c88a');return null;}return d;});}
// v80 S137 — saves from before S137 carry scene-graph dumps where live handles were, and 'spawned'
// flags whose NPC, pickup or camp no longer exists after a load: the quest could never finish.
function ssSanitizeLoaded(){
  const Q=worldState.quests;if(Array.isArray(Q))for(const q of Q){if(!q)continue;delete q._npc;delete q._obj;if(q.turnedIn||q.done||!q.data)continue;
    if(q.kind==='find'&&q.data.spawned&&!q.data.found)q.data.spawned=false;
    if(q.kind==='road'&&q.data.spawned&&(q.data.have||0)<(q.data.count||0))q.data.spawned=false;}
  const G=worldState.guild;if(G&&typeof G==='object')for(const g in G){const t=G[g]&&G[g].active;if(!t)continue;delete t._obj;
    if((t.kind==='beast'||t.kind==='wizard'||t.kind==='creature')&&t.spawned&&!t.done)t.spawned=false;
    if(t.kind==='raid'&&t.spawned&&(t.have||0)<(t.count||0))t.spawned=false;}
}
// ── v80 S139: a character as a file, out of the browser and back ──
// One file holds a character's saves as they are stored, so it survives a cleared profile, a new
// machine, or a browser that loses its IndexedDB. Import never overwrites: it lands as a new
// character when its own id is already here.
const SS_FILE='the-old-gates/character',SS_FILE_MAX=48*1024*1024,SS_FILE_SAVES=64;
function ssSlug(t){return String(t||'character').normalize('NFKD').replace(/[^\w-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40)||'character';}
function ssExportChar(charId){
  const c=ssChars().find(x=>x.id===charId);if(!c)return Promise.resolve(false);
  const rows=c.saves.slice().sort((a,b)=>a.ts-b.ts);
  return Promise.all(rows.map(e=>ssGet(e.key).then(raw=>raw?{kind:e.kind,slot:e.slot,ts:e.ts,level:e.level,gold:e.gold,zone:e.zone,data:raw}:null).catch(()=>null)))
    .then(got=>{const keep=got.filter(Boolean);
      if(!keep.length)throw new Error('those saves could not be read');
      const doc={format:SS_FILE,v:1,build:'s139',exported:Date.now(),char:{id:c.id,name:c.name,people:c.people||'',arch:c.arch||'',level:c.level},saves:keep};
      const str=JSON.stringify(doc);const url=URL.createObjectURL(new Blob([str],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download=`the-old-gates_${ssSlug(c.name)}_lv${c.level||1}_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>{try{URL.revokeObjectURL(url);}catch(e){}},8000);
      showMsg(`\uD83D\uDCBE ${c.name} exported \u2014 ${keep.length} save${keep.length===1?'':'s'}, ${(str.length/1024).toFixed(0)} KB.`,'#c8e88a');
      try{addLog('\uD83D\uDCBE',`${c.name} exported to a file (${keep.length} saves).`);}catch(e){}
      return true;})
    .catch(e=>{console.error('export',e);showMsg('\u26a0 Export failed \u2014 '+(e&&e.message||ssWhy(e)),'#e88a8a');return false;});
}
function ssImportFile(file){
  if(!file)return Promise.resolve(null);
  if(file.size>SS_FILE_MAX){showMsg('\u26a0 Import failed \u2014 that file is far too large to be a character.','#e88a8a');return Promise.resolve(null);}
  return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(String(fr.result||''));fr.onerror=()=>rej(fr.error||new Error('the file could not be read'));fr.readAsText(file);})
    .then(text=>{let doc;try{doc=JSON.parse(text);}catch(e){throw new Error('that file is not a character export');}
      if(!doc||doc.format!==SS_FILE||!Array.isArray(doc.saves))throw new Error('that file is not a character export');
      const rows=doc.saves.filter(r=>r&&typeof r.data==='string').slice(0,SS_FILE_SAVES);
      if(!rows.length)throw new Error('there are no saves in that file');
      const taken=new Set(SS.idx.map(e=>e.charId));
      let cid=(doc.char&&doc.char.id)||('c'+Date.now().toString(36)),fresh=false;
      if(taken.has(cid)){cid='c'+Date.now().toString(36)+Math.floor(Math.random()*90+10);fresh=true;} // already here: a second character, not an overwrite
      const name=((doc.char&&doc.char.name)||'Imported')+(fresh?' (imported)':'');
      let auto=0,manual=0,skipped=0;const metas=[];
      return rows.reduce((chain,r)=>chain.then(()=>{
        let d;try{d=JSON.parse(r.data);}catch(e){skipped++;return;}
        if(!d||typeof d!=='object'||(d.v!==SAVE_VERSION&&d.v!==1)){skipped++;return;}
        const kind=r.kind==='auto'?'auto':'manual';const slot=kind==='auto'?auto++:manual++;
        if(kind==='auto'?slot>=SS_AUTO:slot>=SS_MANUAL){skipped++;return;}
        d.charId=cid;if(d.wS&&typeof d.wS==='object')d.wS.charId=cid;
        const str=ssStringify(d);const meta=ssMetaFrom(d,kind,slot);meta.charName=name;meta.size=str.length;
        return ssPut(meta.key,str).then(()=>{SS.cache[meta.key]=str;SS.idx=SS.idx.filter(e=>e.key!==meta.key);SS.idx.push(meta);metas.push(meta);});
      }),Promise.resolve())
      .then(()=>{if(!metas.length)throw new Error('none of those saves could be read');
        ssSaveIndex();
        showMsg(`\uD83D\uDCC2 ${name} imported \u2014 ${metas.length} save${metas.length===1?'':'s'}${skipped?`, ${skipped} skipped`:''}. Load from this menu.`,'#c8e88a');
        try{addLog('\uD83D\uDCC2',`${name} imported from a file (${metas.length} saves${skipped?', '+skipped+' skipped':''}).`);}catch(e){}
        return metas;});})
    .catch(e=>{console.error('import',e);showMsg('\u26a0 Import failed \u2014 '+(e&&e.message||ssWhy(e)),'#e88a8a');return null;});
}
function ssPickImport(){ // the browser's own picker; nothing is read until a file is chosen
  const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';inp.style.display='none';
  inp.onchange=()=>{const f=inp.files&&inp.files[0];inp.remove();if(f)ssImportFile(f).then(()=>renderSLSlots());};
  document.body.appendChild(inp);inp.click();
}
function hasAnySave(){return SS.idx.length>0;}
function getSlotMeta(key){return ssEntry(key);}
function getActiveSlot(){return ssActiveKey();}
function setActiveSlot(key){ssSetActive(key);}
function loadFromSlot(key){return ssLoad(key);} // async now: a Promise of the payload
// ── first boot: move the old localStorage slots into the store ──
function ssMigrate(){ssLoadIndex();const moves=[];try{for(let n=0;n<10;n++){const raw=localStorage.getItem('DOS_save_'+n);if(!raw)continue;let d;try{d=JSON.parse(raw);}catch(e){continue;}d.charId=d.charId||'legacy';const meta=ssMetaFrom(d,'manual',n);meta.charName=d.pName||'Earlier saves';meta.size=raw.length;
      moves.push(ssPut(meta.key,JSON.stringify(d)).then(()=>{SS.idx=SS.idx.filter(e=>e.key!==meta.key);SS.idx.push(meta);ssSaveIndex();localStorage.removeItem('DOS_save_'+n);}).catch(()=>{}));}
  }catch(e){}
  return Promise.all(moves).then(()=>{try{const oldActive=localStorage.getItem('DOS_save_active');if(oldActive!==null&&!ssActiveKey()){const m=SS.idx.find(e=>e.charId==='legacy'&&e.kind==='manual'&&e.slot===parseInt(oldActive));if(m)ssSetActive(m.key);}}catch(e){}SS.ready=true;try{localStorage.removeItem('DOS_save_active');}catch(e){}return SS.idx;});}

function _buildSavePayload(){
  return {
    v:SAVE_VERSION, ts:Date.now(),
    xp,level,xpNext,kills,gold,
    PHP,maxHP,mana,maxMana,stamina:Math.min(stamina,_baseMaxStamina()+effMaxStamina()-maxStamina),maxStamina:_baseMaxStamina(), // S325 — never a herb's borrowed stamina
    ATTRS:{...ATTRS}, lvAct:{...lvAct},
    EQ:Object.fromEntries(Object.entries(EQ).map(([k,v])=>[k,_serItem(v)])),
    BAG:BAG.map(_serItem),
    // v61d4 — Persist stash inventory. Same _serItem serialization as BAG.
    // Migration-safe on load (defaults to [] if absent in older saves).
    stash:stashBag.map(_serItem),
    // v68 — buy-back overlay: per-merchant arrays of sold items. Serialize each
    // item; migration-safe → {} on load. buyPrice + _boughtBack survive via the
    // _serItem whitelist additions.
    merchantStock:Object.fromEntries(Object.entries(merchantStock).map(([k,arr])=>[k,(arr||[]).map(_serItem)])),
    knownSpells:{...knownSpells},
    touchedSigils:[...touchedSigils],
    activeSpellId,
    QS:JSON.parse(JSON.stringify(QS)),
    uQ:[...untrackedQuests],
    HERB_CONSUME_COUNTS:{...HERB_CONSUME_COUNTS},
    WM_discovered:{...WM.discovered},
    booksRead:[...booksRead],
    arch:(typeof playerArchetype!=='undefined'?playerArchetype:''),charId:(typeof worldState!=='undefined'&&worldState&&worldState.charId)||null, // v80 S136
    wS:{...worldState}, // v61ad: worldState flags (ashenmoorBurned, ashenmoorPending, commissioned, bramBodyRead)
    // v61at: character-creator persistence. metNPCs is a Set, serialize as
    // an array; restored back into a Set on load.
    pName:playerName, pArch:playerArchetype, mN:[...metNPCs],
    zone:activeZoneId, px, pz, yaw,
    // v80 — a world game saved underground or indoors comes back to the world at the door you'd come out of
    worldGame:(typeof WORLD!=='undefined'),
    // v80 — WHERE you are, as a place that regenerates from its id: the world, a house (by id), or a dungeon (by seed and floor)
    where:(function(){try{
      if(currentHouse&&currentHouse.id)return {kind:'house',id:currentHouse.id,parent:currentHouse.parent&&currentHouse.parent.id||null,site:currentHouse.siteId||null,x:px,z:pz,yaw,jumpY,door:{x:currentHouse.exitX,z:currentHouse.exitZ,yaw:currentHouse.exitYaw||0}};
      if(activeZoneId==='dungeon'&&currentPortal){const p=(typeof WORLD!=='undefined')&&WORLD.dungeonPos[currentPortal.seed];return {kind:'dungeon',seed:currentPortal.seed,floor:currentFloor||1,x:px,z:pz,yaw,jumpY,door:p?{x:p.x,z:p.z+3,yaw:0}:null};}
      if(activeZoneId==='world')return {kind:'world',x:px,z:pz,yaw};
      if(typeof WORLD!=='undefined'&&WORLD.lastWorldPos)return Object.assign({kind:'world'},WORLD.lastWorldPos);
    }catch(e){}return null;})(),
  };
}



function _applyLoadData(d){
  xp=d.xp||0; level=d.level||1; xpNext=d.xpNext||200;
  kills=d.kills||0; gold=d.gold||0;
  maxHP=d.maxHP||100; PHP=d.PHP||maxHP; /* S335 — clamped to the worn maximum once the gear is back, below */
  maxMana=d.maxMana||100; mana=d.mana||maxMana;
  ACTIVE_BUFFS.length=0; // S325 — as the note at the end of this function always said: buffs don't survive a load (a Stonecress still running would take its share off the loaded maximum)
  maxStamina=d.maxStamina||100; stamina=d.stamina||maxStamina;
  if(d.ATTRS)Object.assign(ATTRS,d.ATTRS);
  if(d.lvAct)Object.assign(lvAct,d.lvAct);
  // v61at: character-creator persistence. Pre-v61at saves have no pName /
  // pArch / mN, so we fall back to defaults. metNPCs comes back as an
  // array and gets re-Set'd; clearing first protects against reloading
  // mid-session and inheriting stale entries.
  if(d.pName) playerName=d.pName;
  if(d.pArch) playerArchetype=d.pArch;
  metNPCs.clear();
  if(Array.isArray(d.mN)) d.mN.forEach(n=>metNPCs.add(n));
  // v54 migration: rings, amulets, and shields used to have defMult=0 and so saved items have no `def`.
  // Recompute from ARMOR_TYPES lookup + item's stored tier. Idempotent — only upgrades def upwards, so
  // it won't clobber a correctly-rolled item with a smaller one. Skips torches (slot:offhand without shieldType).
  function _migrateAccessoryDef(it){
    if(!it||it.type!=='equip'||!it.tier)return;
    let typeObj=null;
    if(it.shieldType==='shield') typeObj=ARMOR_TYPES.find(t=>t.type==='Buckler');
    else if(it.slot==='amulet')   typeObj=ARMOR_TYPES.find(t=>t.type==='Amulet');
    else if(it.slot==='ring')     typeObj=ARMOR_TYPES.find(t=>t.type==='Ring');
    if(!typeObj||!typeObj.defMult)return;
    const tier=Math.max(1,Math.min(10,it.tier|0));
    const newDef=Math.max(1,Math.round((TIER_BASE_DEF[tier]||0)*typeObj.defMult));
    if(!it.def||it.def<newDef) it.def=newDef;
  }
  // v56 migration: weapon damage curve softened. Recompute atk range for tiered weapons from the
  // new TIER_BASE_ATK + weaponShape's atkMult. Unlike the accessory def migration this can both
  // reduce and raise values — the softening means most existing weapons will now hit for less.
  // Only touches items that have both `tier` and `weaponShape` (skips legacy hand-crafted items
  // like the Rusty Sword which don't have a shape but do have hardcoded atk).
  function _migrateWeaponAtk(it){
    if(!it||it.type!=='equip'||!it.atk||!it.tier||!it.weaponShape)return;
    // v61v: Rusty Sword has a bespoke [5,9] range — wider spread than the generic
    // tier-1 sword formula would produce ([6,7]). Skip it by name so the migration
    // doesn't flatten the "inconsistent junk" character back into a clean statline.
    if(it.name==='Rusty Sword'){ it.atk=[5,9]; return; }
    const typeObj=WEAPON_TYPES.find(t=>t.shape===it.weaponShape);
    if(!typeObj||!typeObj.atkMult)return;
    const tier=Math.max(1,Math.min(10,it.tier|0));
    const base=TIER_BASE_ATK[tier];
    if(!base)return;
    const newLo=Math.round(base*typeObj.atkMult[0]);
    const newHi=Math.round(base*typeObj.atkMult[1]);
    it.atk=[newLo,newHi];
  }
  // v57 migration: price curve + requirement curve updated. Recompute buyPrice from TIER_VALUE
  // and reqVal from MATERIALS (weapons) or ARMOR_FORT_REQ (armor). Replaces stored values outright
  // since the curves changed in both directions at different tiers.
  function _migrateItemValueAndReq(it){
    if(!it||it.type!=='equip'||!it.tier)return;
    const tier=Math.max(1,Math.min(10,it.tier|0));
    // Weapon path
    if(it.atk && it.weaponShape){
      const typeObj=WEAPON_TYPES.find(t=>t.shape===it.weaponShape);
      if(typeObj && typeof TIER_VALUE!=='undefined'){
        it.buyPrice=Math.max(3, Math.round(TIER_VALUE[tier]*typeObj.atkMult[1]));
      }
      // Material-derived might req
      const mat=MATERIALS.find(m=>m.tier===tier);
      if(mat){ it.reqAttr=mat.reqAttr||null; it.reqVal=mat.reqVal||0; }
      return;
    }
    // Armor/shield/accessory path
    if(it.slot && it.slot!=='weapon'){
      let typeObj=null;
      if(it.shieldType==='shield') typeObj=ARMOR_TYPES.find(t=>t.type==='Buckler');
      else typeObj=ARMOR_TYPES.find(t=>t.slot===it.slot);
      if(typeObj && typeof TIER_VALUE!=='undefined'){
        it.buyPrice=Math.max(5, Math.round(TIER_VALUE[tier]*(0.5 + (typeObj.defMult||0.3)*0.3)));
      }
      // Fortitude req from table — only T3+
      if(tier>=3 && typeof ARMOR_FORT_REQ!=='undefined'){
        it.reqAttr='fortitude'; it.reqVal=ARMOR_FORT_REQ[tier]||0;
      } else {
        it.reqAttr=null; it.reqVal=0;
      }
    }
  }
  // v61v migration: weight table scaled up. _serItem bakes `weight` into every save,
  // so pre-v61v saves keep their old lightweight values unless we explicitly rewrite
  // them. Replaces the stored weight outright — no "only upgrade" guard because the
  // scale changed in one direction (up) and partial values leave the player in a
  // confused mixed state. Three paths:
  //   1. Named starter items — match by name (they have no tier/slot).
  //   2. Crafted weapons — look up by weaponShape in WEAPON_TYPES.
  //   3. Crafted armor/accessories — look up by slot (shields via shieldType) in ARMOR_TYPES.
  function _migrateItemWeight(it){
    if(!it)return;
    // 1. Starter kit — legacy hand-rolled items with no slot/tier
    const STARTER_WEIGHTS = {
      'Rusty Sword':3, 'Tattered Tunic':2, 'Worn Breeches':2, 'Leather Boots':1,
    };
    if(STARTER_WEIGHTS[it.name]!==undefined){ it.weight=STARTER_WEIGHTS[it.name]; return; }
    if(it.type!=='equip') return;
    // 2. Crafted weapons — by shape
    if(it.weaponShape){
      const typeObj=WEAPON_TYPES.find(t=>t.shape===it.weaponShape);
      if(typeObj && typeObj.weight!==undefined){ it.weight=typeObj.weight; return; }
    }
    // 3. Crafted armor/accessories — by slot (or shieldType for shields)
    if(it.slot){
      let typeObj=null;
      if(it.shieldType==='shield') typeObj=ARMOR_TYPES.find(t=>t.type==='Buckler');
      else typeObj=ARMOR_TYPES.find(t=>t.slot===it.slot);
      if(typeObj && typeObj.armorW!==undefined){ it.weight=typeObj.armorW; return; }
    }
  }
  if(d.EQ){
    for(const slot of Object.keys(EQ)){
      EQ[slot]=d.EQ[slot]?_restoreEnchant(d.EQ[slot]):null;
      _migrateAccessoryDef(EQ[slot]);
      _migrateWeaponAtk(EQ[slot]);
      _migrateItemValueAndReq(EQ[slot]);
      _migrateItemWeight(EQ[slot]);
    }
  }
  // v61au: pre-character-creator saves had a hardcoded Rusty Sword. The
  // initial EQ shape now starts weapon-null — but loading an old save
  // restores whatever EQ.weapon it had. If a save somehow loads without
  // any weapon at all (corrupted save, mid-migration), drop in a Wooden
  // Sword so the player isn't unarmed by surprise.
  if(!EQ.weapon&&!(d.EQ&&'weapon' in d.EQ)){ // S173 — a saved empty hand stays empty
    EQ.weapon = JSON.parse(JSON.stringify(STARTER_WEAPONS.sword));
  }
  BAG.length=0;
  // Potion migration — pre-fix saves stripped heal/mana from potions. Reapply by item name so existing
  // inventories aren't permanently broken. Safe to leave in long-term; it's idempotent when values are already set.
  // v54: added Stamina Draught + drop-on-load filter for vestigial Mystic Scrolls.
  const POTION_STATS={
    'Health Potion':{heal:25},
    'Greater Potion':{heal:60},
    'Mana Draught':{heal:0, mana:40},
    'Stamina Draught':{stam:40},
  };
  if(d.BAG)d.BAG.forEach(it=>{
    if(!it)return;
    // Filter Mystic Scrolls — vestigial from the old magic system, now removed from all drop tables.
    if(it.type==='misc' && it.name==='Mystic Scroll')return;
    if(it.type==='potion' && POTION_STATS[it.name]){
      const ps=POTION_STATS[it.name];
      if(it.heal===undefined && ps.heal!==undefined) it.heal=ps.heal;
      if(it.mana===undefined && ps.mana!==undefined) it.mana=ps.mana;
      if(it.stam===undefined && ps.stam!==undefined) it.stam=ps.stam;
    }
    const restored=_restoreEnchant(it);
    _migrateAccessoryDef(restored);
    _migrateWeaponAtk(restored);
    _migrateItemValueAndReq(restored);
    _migrateItemWeight(restored);
    BAG.push(restored);
  });
  // v61d4 — Restore stash inventory. Same migration chain as BAG.
  // d.stash is undefined for pre-v61d4 saves; the conditional handles that
  // case naturally (no items to restore = empty stash).
  stashBag.length=0;
  if(d.stash)d.stash.forEach(it=>{
    if(!it)return;
    if(it.type==='misc' && it.name==='Mystic Scroll')return;
    if(it.type==='potion' && POTION_STATS[it.name]){
      const ps=POTION_STATS[it.name];
      if(it.heal===undefined && ps.heal!==undefined) it.heal=ps.heal;
      if(it.mana===undefined && ps.mana!==undefined) it.mana=ps.mana;
      if(it.stam===undefined && ps.stam!==undefined) it.stam=ps.stam;
    }
    const restored=_restoreEnchant(it);
    _migrateAccessoryDef(restored);
    _migrateWeaponAtk(restored);
    _migrateItemValueAndReq(restored);
    _migrateItemWeight(restored);
    stashBag.push(restored);
  });
  // v68 — restore buy-back overlay. Migration-safe: pre-v68 saves have no
  // d.merchantStock, so it resets to {} (no buy-back items — correct).
  merchantStock={};
  if(d.merchantStock && typeof d.merchantStock==='object'){
    for(const [key,arr] of Object.entries(d.merchantStock)){
      if(!Array.isArray(arr))continue;
      merchantStock[key]=arr.filter(Boolean).map(it=>{
        const _bbPrice=it.buyPrice; // capture before migrations recompute it
        const restored=_restoreEnchant(it);
        _migrateAccessoryDef(restored);
        _migrateWeaponAtk(restored);
        _migrateItemValueAndReq(restored); // recomputes buyPrice for equips — undo below
        _migrateItemWeight(restored);
        restored._boughtBack=true;          // ensure the tag survives migration
        if(_bbPrice!==undefined) restored.buyPrice=_bbPrice; // keep the player's sell-back price
        return restored;
      });
    }
  }
  // v57: after all items restored + req-migrated, check if any equipped item now fails its req.
  // Auto-unequip to bag so the player can at least see+sell+grow-into it, with a one-shot toast.
  const _eqUnequipped=[];
  for(const slot of Object.keys(EQ)){
    const eq=EQ[slot];
    if(!eq||!eq.reqAttr||!eq.reqVal)continue;
    const have=(typeof ATTRS!=='undefined'?ATTRS[eq.reqAttr]:0)||0;
    if(have<eq.reqVal){
      _eqUnequipped.push(eq.name);
      BAG.push(eq);
      EQ[slot]=null;
    }
  }
  if(_eqUnequipped.length && typeof showMsgLong==='function'){
    setTimeout(()=>showMsgLong(`⚠ Requirements tightened. Unequipped: ${_eqUnequipped.join(', ')}. You'll need to grow into them.`,'#cc8844'),1500);
  }
  if(typeof invalidateArmorCache==='function')invalidateArmorCache();
  if(typeof buildViewmodel==='function' && (_eqUnequipped.length||worldState.look))buildViewmodel();
  if(typeof buildShieldViewmodel==='function' && _eqUnequipped.length)buildShieldViewmodel();
  invalidateArmorCache();
  PHP=Math.min(PHP,effMaxHP());mana=Math.min(mana,effMaxMana());stamina=Math.min(stamina,effMaxStamina());
  // knownSpells migration: legacy saves stored an array of spell ids (e.g. ['fireball','iceshard']).
  // New format is an object map {spellId: tier}. Legacy array → migrate each entry to tier 1,
  // remapping old ids (fireball→caor, iceshard→sioc, heallight→leigheas) to their Irish equivalents.
  // Unknown legacy ids are dropped silently.
  const LEGACY_ID_MAP={fireball:'caor', iceshard:'sioc', heallight:'leigheas'};
  for(const k of Object.keys(knownSpells))delete knownSpells[k];
  if(d.knownSpells){
    if(Array.isArray(d.knownSpells)){
      d.knownSpells.forEach(id=>{
        const mapped=LEGACY_ID_MAP[id]||id;
        if(SPELLS.find(s=>s.id===mapped))knownSpells[mapped]=1;
      });
    } else if(typeof d.knownSpells==='object'){
      Object.entries(d.knownSpells).forEach(([id,tier])=>{
        if(SPELLS.find(s=>s.id===id))knownSpells[id]=Math.max(1,Math.min(3,tier|0));
      });
    }
  }
  touchedSigils.clear();
  if(Array.isArray(d.touchedSigils))d.touchedSigils.forEach(u=>touchedSigils.add(u));
  activeSpellId=d.activeSpellId||null;
  // If loaded save had an activeSpellId that's no longer known, fall back to first known or null
  if(activeSpellId&&!knownSpells[activeSpellId]){
    const first=Object.keys(knownSpells)[0];
    activeSpellId=first||null;
  } else if(!activeSpellId){
    const first=Object.keys(knownSpells)[0];
    if(first)activeSpellId=first;
  }
  if(d.QS)Object.assign(QS,d.QS);
  // v61af: quest-shape migration. When a quest gets new objectives added in a
  // later version (Q7 went from 1 to 4 in v61ae), old saves still contain the
  // 1-shape QS entry. Object.assign above stomped the fresh qsInit() shape
  // with the saved one, so the saved shape is now live — but checkQuestProgress
  // iterates qDef.objectives (the canonical list), which means indices 1/2/3
  // try to read qs.objectives[i] === undefined → reading .current throws.
  // That single exception kills the whole forEach loop, which is what was
  // breaking quest markers + compass + minimap for v61ad saves loaded into v61ae.
  //
  // Fix: after restore, walk every quest def and pad/rebuild objectives as needed.
  // Strategy:
  //   - If the saved objectives array is shorter than the def, append fresh
  //     {current:0} entries for the new objectives.
  //   - If the saved quest is in 'active'/'reward'/'complete' and the shape has
  //     fundamentally changed (objective types differ at same index), reset to
  //     'available' and clear all objective progress. Safest for mid-progress
  //     saves on a quest whose design was reshuffled.
  //   - If the saved quest is 'locked' or 'available', just pad — no progress
  //     to lose and no invariants to preserve.
  //   - New quests added after the save are NOT present in d.QS; qsInit has
  //     already put them in QS, so they're fine.
  QUEST_DEFS.forEach(qDef=>{
    const qs=QS[qDef.id];
    if(!qs) return; // never happens — qsInit ran before restore
    if(!Array.isArray(qs.objectives)) qs.objectives = [];
    const defLen = qDef.objectives.length;
    const savLen = qs.objectives.length;
    if(savLen < defLen){
      // Pad missing objective slots with fresh {current:0}.
      for(let i=savLen;i<defLen;i++){
        qs.objectives.push({current:0});
      }
      // If the quest was already 'active' or later and we just grew the shape,
      // the new objectives are incomplete — state is still valid (player hasn't
      // finished the new objectives yet). No state change needed.
    } else if(savLen > defLen){
      // Shape shrank (unlikely but defensive) — trim.
      qs.objectives.length = defLen;
    }
  });
  // Sanity check: every objective slot must be an object with a numeric current.
  // Defensive against any malformed save data.
  QUEST_DEFS.forEach(qDef=>{
    const qs=QS[qDef.id];
    if(!qs || !Array.isArray(qs.objectives)) return;
    qs.objectives.forEach((o,i)=>{
      if(!o || typeof o.current!=='number'){
        qs.objectives[i] = {current:0};
      }
    });
  });
  // v61o: restore tracking exceptions. Clear first so a load doesn't merge with
  // the live session's choices — the saved set is authoritative.
  untrackedQuests.clear();
  if(Array.isArray(d.uQ)) d.uQ.forEach(id=>untrackedQuests.add(id));
  if(d.HERB_CONSUME_COUNTS)Object.assign(HERB_CONSUME_COUNTS,d.HERB_CONSUME_COUNTS);
  if(d.WM_discovered)Object.assign(WM.discovered,d.WM_discovered);
  booksRead.clear();
  if(Array.isArray(d.booksRead))d.booksRead.forEach(id=>booksRead.add(id));
  // v61ad: restore worldState. Reset flags first so a load doesn't merge with
  // the live session's state. Missing keys (old v1 saves) fall through to the
  // "fresh Act I" defaults — all flags false — which is the correct state for
  // any save that predates the burn system.
  worldState.ashenmoorBurned  = !!(d.wS && d.wS.ashenmoorBurned);
  worldState.ashenmoorPending = !!(d.wS && d.wS.ashenmoorPending);
  worldState.commissioned     = !!(d.wS && d.wS.commissioned);
  worldState.bramBodyRead     = !!(d.wS && d.wS.bramBodyRead);
  worldState.wdisc            = (d.wS && d.wS.wdisc) || {};      // v80 — discovered places
  worldState.wcleared         = (d.wS && d.wS.wcleared) || {};   // v80 — cleared encounter chunks
  worldState.guild            = (d.wS && d.wS.guild) || null;     // v80 S12 — guild ranks and active tasks
  worldState.ship             = (d.wS && d.wS.ship) || null;      // v80 C — the player's ship
  worldState.owned            = (d.wS && d.wS.owned) || null;     // v80 G — houses you own
  worldState.met              = (d.wS && d.wS.met) || null;       // v80 J — who you've spoken to
  worldState.quests           = (d.wS && d.wS.quests) || null;    // v80 K — the journal
  worldState.people           = (d.wS && d.wS.people) || null;    // v80 N — the player's people
  worldState.towns            = (d.wS && d.wS.towns) || null;     // v80 O — settlement states
  worldState.favor            = (d.wS && d.wS.favor) || null;
  worldState.roadsCleared     = (d.wS && d.wS.roadsCleared) || null;
  worldState.lairs            = (d.wS && d.wS.lairs) || null;
  worldState.camps            = (d.wS && d.wS.camps) || null;
  worldState.rubbings         = (d.wS && d.wS.rubbings) || null;  // v80 P — marked sigil gates
  worldState.routes           = (d.wS && d.wS.routes) || null;    // v80 R — trade routes
  worldState.factions         = (d.wS && d.wS.factions) || null;  // v80 S — standing
  worldState.coaches          = (d.wS && d.wS.coaches) || null;   // v80 T — coaching roads
  worldState.story            = (d.wS && d.wS.story) || null;     // v80 U — the acts
  worldState.tut              = (d.wS && d.wS.tut) || null;       // v80 S125 — the tutorial lines
  worldState.look             = (d.wS && d.wS.look) || null;      // v80 S127 — the look
  worldState.charId           = d.charId || (d.wS && d.wS.charId) || 'legacy';  // v80 S136 — which character's saves
  try{applyLook();}catch(e){}
  worldState.stats            = (d.wS && d.wS.stats) || null;     // v80 — the Character tab's counters
  worldState.masters          = (d.wS && d.wS.masters) || null;   // v80 — cavern masters slain
  worldState.cold             = (d.wS && d.wS.cold) || 0;         // v80 P — an Old Blood reader's cost
  worldState.sigilsRead       = (d.wS && d.wS.sigilsRead) || null;
  worldState.rented           = (d.wS && d.wS.rented) || null;    // v80 G — the inn room you rented
  // v80 S242 — keys the save always carried (wS is the whole worldState) but the load never read back: the day count,
  // the crime record, the Church's notes, the war, the Reader. Absent from the save, they are cleared, so one
  // character's record never carries into another's.
  ['gameTimeAbsMinutes','_rentWk','crime','crimes','boxes','picked','refuse','church','war','wars','lairDays','shrines','towerLoot','towerPicked','masteries','varek','roadsWalked','chapelAt','knowing','unbound'].forEach(k=>{const v=d.wS?d.wS[k]:undefined;if(v===undefined||v===null)delete worldState[k];else worldState[k]=v;});
  try{ssSanitizeLoaded();}catch(e){console.warn('sanitize',e);}  // v80 S137
  // v61aw: tutorialDone migration. Saves predating v61aw never had this
  // flag, so fall back to TRUE — those characters are already past the
  // tutorial (they're playing in the world). New v61aw saves carry the
  // flag explicitly. Also fix up the QS state for the pre-v61aw quest
  // setup: if the save has no Q0 entry, add it as 'complete' so the quest
  // log isn't surprised by a sudden new active quest. If the save's Q1 is
  // 'available' (the old default for a fresh game), leave it — that means
  // the player is mid-arrival in pre-v61aw style and the unlocks chain
  // doesn't need to fire here.
  if(d.wS && d.wS.tutorialDone !== undefined){
    worldState.tutorialDone = !!d.wS.tutorialDone;
  } else {
    worldState.tutorialDone = true;
  }
  // v61c2: faolchuDefeated migration. Saves predating v61c2 don't have this
  // flag. The smart default depends on burn state:
  //   - ashenmoorBurned===true on a pre-v61c2 save means the player has
  //     ALREADY completed Q7 (or is mid-Q7) under the legacy 4-objective
  //     structure — the boss didn't exist. Default faolchuDefeated=true so
  //     they don't get a surprise wolf-shape on next overworld entry.
  //   - ashenmoorBurned===false means the burn hasn't fired yet; the boss
  //     will spawn naturally when it does. Default faolchuDefeated=false.
  // New v61c2+ saves carry the flag explicitly via d.wS.faolchuDefeated.
  if(d.wS && d.wS.faolchuDefeated !== undefined){
    worldState.faolchuDefeated = !!d.wS.faolchuDefeated;
  } else {
    worldState.faolchuDefeated = !!worldState.ashenmoorBurned;
  }
  // v61d6: safehouseGranted migration. Saves predating v61d6 don't have this
  // flag. Default to false — pre-v61d6 characters who already finished Q7 can
  // pick up the grant scene naturally on their next visit to Caldric (the
  // relay topic surfaces on Brynn the moment they're commissioned, the scene
  // auto-fires the moment they walk into the keep). No replay surprise; no
  // accidental skip of the safehouse beat.
  worldState.safehouseGranted = !!(d.wS && d.wS.safehouseGranted);
  // v61e6 Session A: gameTimeMinutes migration. Saves predating v61e6 don't
  // have this field. Default to 360 (06:00 = dawn) so the player loads into
  // first light, matching new-game behavior. New v61e6+ saves carry the
  // value explicitly via d.wS.gameTimeMinutes.
  if(d.wS && typeof d.wS.gameTimeMinutes === 'number'){
    worldState.gameTimeMinutes = d.wS.gameTimeMinutes;
  } else {
    worldState.gameTimeMinutes = 360;
  }
  if(QS && (!d.QS || !d.QS.q0_arrival)){
    // Saved data has no Q0 entry → pre-v61aw character. Mark Q0 complete
    // so the quest log doesn't show a stale "active" tutorial quest, and
    // so Q1 unlock logic stays consistent (Q1 was 'available' for a
    // pre-v61aw fresh game, which is the post-Q0-completion state anyway).
    QS.q0_arrival = {state:'complete', objectives:[{current:1}]};
  }
  // Sync ZONE_BUILDERS.overworld to the loaded flag state. If ashenmoorBurned
  // is true, this also triggers the burned-scene lazy build on next overworld
  // entry (via the swapped builder).
  if(typeof _syncAshenmoorZoneEntry==='function') _syncAshenmoorZoneEntry();
  // ACTIVE_BUFFS intentionally cleared on load
}

function _applyZoneFromSave(d){
  _clearInteractPrompt();
  let sz=d.zone||'overworld';
  // v61eb: Wastes architectural refactor. The 'hollowed_wastes' zone was
  // deleted and replaced with wastes_west + wastes_east. Pre-v61eb saves
  // referencing the old zone get remapped to wastes_west on load — the
  // player wakes up at the western reach of the Wastes, which is
  // narratively the same approach (off Bealach Central) the old hub-zone
  // was reached from. Their saved px/pz survives but may be irrelevant
  // to the new zone geometry; the gate-snap logic in zone-build will
  // pull them to a sensible spawn if they're off-grid.
  if(sz==='hollowed_wastes') sz='wastes_west';
  px=d.px||15; pz=d.pz||20; yaw=d.yaw||0;
  pitch=0; velY=0; jumpY=0; onGround=true;
  lid='overworld'; blocking=false; staggered=[];
  currentHouse=null; // v61ae: belt-and-suspenders — ensure no stale interior state from prior session
  // v80 — a world game restores by LOCATION: into the world at the place's door, then back into the place itself
  if(typeof WORLD!=='undefined'&&(d.worldGame||d.where||d.wret||sz==='dungeon'||(d.wS&&(d.wS.people!=null||d.wS.towns!=null)))){
    const W=d.where||(d.wret?Object.assign({kind:'world'},d.wret):null);
    let r=(W&&W.kind==='world')?W:(W&&W.door)?W.door:(d.wret||null);
    // an old save made indoors carries interior coordinates as if they were the world's — never trust a position in the sea
    if(!r||r.x==null||WORLD.worldH(r.x,r.z)<0.5){const lp=WORLD.lastWorldPos;r=(lp&&WORLD.worldH(lp.x,lp.z)>0.5)?lp:(WORLD.spawn||{x:px,z:pz,yaw:0});}
    px=r.x;pz=r.z;if(r.yaw!=null)yaw=r.yaw;sz='world';
    if(W&&W.kind!=='world')window._reenter=W;
  }
  if(sz==='world'){
    // v80 — streamed world restore. Position comes straight from the save.
    WORLD.noteSessionGap();WORLD.restore(px,pz,yaw);
    if(window._reenter){const W=window._reenter;window._reenter=null;setTimeout(()=>_reenterPlace(W),300);}
  } else if(sz==='forest'){
    if(!forestScene)buildForest();
    scene=forestScene; activeZoneId='forest'; ZE=ZONES.forest?ZONES.forest.enemies:[]; ZB=[];
    PORTALS=ZONES.forest.portals||[];
    showZoneName('🌲 The Deepwood Forest');
  } else if(sz==='ironhaven'){
    if(!ironhavenScene)buildIronhaven();
    scene=ironhavenScene; activeZoneId='ironhaven'; ZE=[]; ZB=[];
    PORTALS=ZONES.ironhaven?ZONES.ironhaven.portals||[]:[];
    showZoneName('🏰 Ironhaven');
  } else {
    // v61ad: respect burn state on load. If the save says ashenmoorBurned, build
    // the burned scene (if it doesn't exist yet) and route the player into it
    // rather than the pristine owScene. Same zone id, different scene contents.
    if(worldState.ashenmoorBurned){
      if(!owBurnedScene) owBurnedScene = buildAshenmoorBurned();
      scene=owBurnedScene;
      showZoneName('🔥 Ashenmoor — Ruins');
    } else {
      scene=owScene;
      showZoneName('🌿 Village of Ashenmoor');
    }
    activeZoneId='overworld'; ZE=[]; ZB=[];
    PORTALS=WORLD_DUNGEONS.filter(e=>e.zone==='overworld').map(makePortalDef);
    // v61c2 — Faolchú spawn check on save-load into burned Ashenmoor.
    // If the saved character was mid-Q7 with the boss still alive, spawn
    // it back at full HP. ZE was just reset to [], so there's no existing
    // boss to clobber. Idempotent guard inside spawnFaolchu still fires.
    if(worldState.ashenmoorBurned && !worldState.faolchuDefeated){
      if(typeof spawnFaolchu==='function') spawnFaolchu();
    }
  }
  jumpY=activeTerrainH(px,pz);
}

// Convenience: save to active slot (auto-save)

// Read slot metadata without full parse (for UI listing)


// ── Save/Load menu ────────────────────────────────────────────────────────
let _slMode='save'; // 'save' | 'load'
let _slFromTitle=false; // true when opened from title screen
let _slLoaded=false; // S251 — set once a save is loaded from the menu

function openSLMenu(mode, fromTitle){
  _releasePointerLockForMenu();
  _slMode=mode||'save';
  _slFromTitle=!!fromTitle;
  setSLTab(_slMode);
  document.getElementById('slmenu').style.display='flex';
}

function closeSLMenu(){
  document.getElementById('slmenu').style.display='none';
  if(_slFromTitle&&!_slLoaded){location.reload();return;} // S251 — Load Game has already stepped into the scene; back out to the title for real
  if(_slFromTitle){
    // Return to title — don't start the game
  } else {
    // Return focus to game
    const G=document.getElementById('g');
    if(G)G.focus();
  }
}

function setSLTab(mode){
  _slMode=mode;
  document.getElementById('sl-tab-save').classList.toggle('active',mode==='save');
  document.getElementById('sl-tab-load').classList.toggle('active',mode==='load');
  document.getElementById('slmenu-title').textContent=mode==='save'?'💾 Save Game':'📂 Load Game';
  // Hide save tab when opened from title (can only load from there)
  document.getElementById('sl-tab-save').style.display=_slFromTitle?'none':'';
  renderSLSlots();
}

function renderSLSlots(){
  const container=document.getElementById('sl-slots');container.innerHTML='';
  const fmtT=ts=>{const d=Math.floor((Date.now()-ts)/60000);return d<1?'just now':d<60?`${d} min ago`:d<1440?`${Math.floor(d/60)} h ago`:`${Math.floor(d/1440)} d ago`;};
  const zoneOf=m=>m.zone==='world'?'the open country':(ZONE_LABEL&&ZONE_LABEL[m.zone])||m.zone||'…';
  const active=ssActiveKey();const curId=(typeof worldState!=='undefined'&&worldState&&worldState.charId)||null;
  const row=(m,kind,slot,charId)=>{const div=document.createElement('div');div.className='sl-slot'+(m&&m.key===active?' active-slot':'')+(m?'':' sl-slot-empty');div.dataset.key=m?m.key:'';
    div.innerHTML=`<span class="sl-slot-num">${kind==='auto'?'A'+(slot+1):slot+1}</span><span class="sl-slot-ico">${m?(kind==='auto'?'⟳':'💾'):'·'}</span><span class="sl-slot-info"><div class="sl-slot-name">${m?`Lv${m.level} · ${zoneOf(m)}`:'— Empty —'}</div>${m?`<div class="sl-slot-detail">${m.gold}🪙 · ${fmtT(m.ts)}${m.size?` · ${(m.size/1024).toFixed(0)} KB`:''}</div>`:''}</span>${m?`<button type="button" class="sl-del" title="Delete this save" style="background:none;border:1px solid rgba(255,255,255,.12);color:#a08070;border-radius:4px;padding:2px 7px;cursor:pointer;font-size:12px">🗑</button>`:''}`;
    if(m){const del=div.querySelector('.sl-del');del.onclick=(ev)=>{ev.stopPropagation();if(del.dataset.primed==='1'){ssDelete(m.key).then(()=>renderSLSlots());}else{del.dataset.primed='1';del.textContent='Delete?';del.style.color='#e88a60';setTimeout(()=>{if(del.isConnected){del.dataset.primed='0';del.textContent='🗑';del.style.color='';}},2500);}};}
    if(_slMode==='save'){if(kind==='manual')div.onclick=()=>_slotSaveClick(div,slot,m);else div.style.opacity='.6';}
    else if(m)div.onclick=()=>_slotLoadClick(div,m);
    return div;};
  const header=(txt,sub)=>{const h=document.createElement('div');h.style.cssText='margin:10px 0 4px;font:600 13px Georgia,serif;color:#e8d8a0;letter-spacing:.04em;display:flex;align-items:center;gap:8px';h.innerHTML=`<span>${txt}</span>${sub?`<span style="font-weight:400;font-size:11px;color:#8a7a60;letter-spacing:0">${sub}</span>`:''}<span style="flex:1"></span>`;container.appendChild(h);return h;}; // v80 S140 — name, then detail, then the buttons at the right
  const chars=ssChars();
  // v80 S137 — where the saves live and how much they take; the last failure, in words
  {const st=document.createElement('div');st.style.cssText='font-size:11px;color:#7a6a50;margin:0 0 4px 2px';const tot=SS.idx.reduce((a,e)=>a+(e.size||0),0);
    st.textContent=`${SS.fallback?"Saved in this browser's localStorage (IndexedDB unavailable)":SS.db?'Saved in IndexedDB':'Save store not open yet'} · ${SS.idx.length} save${SS.idx.length===1?'':'s'}, ${(tot/1024).toFixed(0)} KB`;container.appendChild(st);
    try{if(navigator.storage&&navigator.storage.estimate)navigator.storage.estimate().then(e=>{if(st.isConnected&&e&&e.quota)st.textContent+=` · browser storage ${(e.usage/1048576).toFixed(1)} of ${(e.quota/1048576).toFixed(0)} MB`;}).catch(()=>{});}catch(e){}
    const imp=document.createElement('button');imp.type='button';imp.textContent='\u2913 Import a character from a file';imp.className='sl-btn';imp.title='Load a character from a file you exported';imp.style.cssText+='margin:2px 0 6px 2px;align-self:flex-start';imp.onclick=ssPickImport;container.appendChild(imp); // v80 S139
    if(SS.lastErr&&_slMode==='save'){const er=document.createElement('div');er.style.cssText='font-size:12px;color:#e88a8a;margin:2px 0 6px 2px';er.textContent=`Last save failed (${fmtT(SS.lastErr.ts)}): ${SS.lastErr.why}`;container.appendChild(er);}}
  if(_slMode==='save'){
    const cid=ssCharId();const mine=chars.find(c=>c.id===cid)||{id:cid,name:(typeof playerName!=='undefined'&&playerName)||'This character',saves:[]};
    {const _h=header(`${mine.name}`,`Lv${typeof level!=='undefined'?level:'?'} · slots`);if(mine.saves&&mine.saves.length)_h.appendChild(_slExportBtn(cid));} // v80 S139
    for(let i=0;i<SS_MANUAL;i++)container.appendChild(row(mine.saves.find(e=>e.kind==='manual'&&e.slot===i)||null,'manual',i,cid));
    const autos=mine.saves.filter(e=>e.kind==='auto').sort((a,b)=>b.ts-a.ts);if(autos.length){header('Autosaves',`${autos.length} of ${SS_AUTO} · newest first · load from the Load tab`);autos.forEach(a=>container.appendChild(row(a,'auto',a.slot,cid)));}
    return;}
  if(!chars.length){const none=document.createElement('div');none.style.cssText='color:#5a5040;padding:12px';none.textContent='No saves yet.';container.appendChild(none);return;} // S251 — below the Import button, not over it: a new browser is where a character comes in
  for(const c of chars){const h=header(`${c.name}${c.id===curId?' <span style="color:#8ac880;font-size:11px">(playing)</span>':''}`,`Lv${c.level}${c.people?' · '+c.people:''} · ${fmtT(c.last)}`);
    h.appendChild(_slExportBtn(c.id)); // v80 S139 — a copy of this character, outside the browser
    const delc=document.createElement('button');delc.type='button';delc.textContent='\uD83D\uDDD1 Delete character';delc.className='sl-btn sl-danger';delc.title='Remove this character and every one of their saves';delc.style.marginLeft='8px';
    delc.onclick=()=>{if(delc.dataset.primed==='1'){ssDeleteChar(c.id).then(()=>renderSLSlots());}else{delc.dataset.primed='1';delc.textContent='Delete all their saves?';delc.classList.add('sl-armed');setTimeout(()=>{if(delc.isConnected){delc.dataset.primed='0';delc.textContent='\uD83D\uDDD1 Delete character';delc.classList.remove('sl-armed');}},3000);}};h.appendChild(delc);
    const autos=c.saves.filter(e=>e.kind==='auto').sort((a,b)=>b.ts-a.ts);if(autos.length){const sh=document.createElement('div');sh.style.cssText='font-size:10px;color:#8a7a60;letter-spacing:.2em;text-transform:uppercase;margin:4px 0 2px 4px';sh.textContent='Autosaves';container.appendChild(sh);autos.forEach(a=>container.appendChild(row(a,'auto',a.slot,c.id)));}
    const mans=c.saves.filter(e=>e.kind==='manual').sort((a,b)=>a.slot-b.slot);if(mans.length){const sh=document.createElement('div');sh.style.cssText='font-size:10px;color:#8a7a60;letter-spacing:.2em;text-transform:uppercase;margin:4px 0 2px 4px';sh.textContent='Slots';container.appendChild(sh);mans.forEach(m=>container.appendChild(row(m,'manual',m.slot,c.id)));}
  }
}

function _slExportBtn(charId){ // v80 S139
  const b=document.createElement('button');b.type='button';b.textContent='\u2912 Export';b.className='sl-btn';b.title='Save this character to a file you can keep';
  b.style.marginLeft='10px';
  b.onclick=(ev)=>{ev.stopPropagation();b.disabled=true;b.textContent='Exporting\u2026';ssExportChar(charId).then(()=>{if(b.isConnected){b.disabled=false;b.textContent='\u2912 Export';}});};
  return b;
}
function _fmtTime(ts){
  if(!ts)return '';
  const d=new Date(ts);
  return d.toLocaleDateString()+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
}

function _slotSaveClick(div,slot,existing){
  const after=m=>{if(m)closeSLMenu();else renderSLSlots();}; // v80 S137 — a failed save keeps the menu open with the reason
  if(existing){if(div.dataset.primed==='1'){saveToSlot(slot).then(after);}
    else{document.querySelectorAll('#sl-slots .sl-slot').forEach(b=>{b.dataset.primed='0';b.style.borderColor='';});div.dataset.primed='1';div.style.borderColor='rgba(200,100,60,.7)';const nm=div.querySelector('.sl-slot-name');if(nm){nm.textContent='Click again to overwrite';nm.style.color='#e88a60';}}}
  else{saveToSlot(slot).then(after);}
}

function _slotLoadClick(div,meta){
  if(div.dataset.primed==='1'){
    ssLoad(meta.key).then(d=>{if(!d){closeSLMenu();return;}_slLoaded=true;ssSetActive(meta.key);_applyLoadData(d);_applyZoneFromSave(d);closeSLMenu();updateHUD();renderInv();buildViewmodel();buildShieldViewmodel();
      addLog('💾',`${meta.kind==='auto'?'Autosave':'Slot '+(meta.slot+1)} loaded — Lv${d.level}, ${d.gold}\uD83E\uDE99`);showMsg(`Save loaded. (${ZONE_LABEL[activeZoneId]||activeZoneId})`,'#c8e88a');});
  } else {
    document.querySelectorAll('#sl-slots .sl-slot').forEach(b=>{b.dataset.primed='0';b.style.borderColor='';});div.dataset.primed='1';div.style.borderColor='rgba(100,200,80,.7)';const nm=div.querySelector('.sl-slot-name');if(nm){nm.textContent='Click again to load';nm.style.color='#8ac880';}
  }
}
