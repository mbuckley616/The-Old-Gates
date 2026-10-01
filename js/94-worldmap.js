
// ══════════════════════════════════════════════════════════════════════
// WORLD MAP SYSTEM
// ══════════════════════════════════════════════════════════════════════
const WM={
  initialized:false,
  scale:0.62, minScale:0.35, maxScale:2.4,
  ox:0, oy:0,
  dragging:false, dragStartX:0, dragStartY:0, dragOX:0, dragOY:0,
  // v61b8: fog of war — discovered zone names. Starts EMPTY. New characters
  // see no nodes until they walk to them. Used to default to
  // `{Ashenmoor:true, Deepwood Forest:true}` which made those two settlements
  // visible on the map the moment the hub was opened, including during the
  // tutorial. The walked-only discovery rule from v61b7 only fires on zone
  // entry — defaults here override any of that work. Empty is correct.
  // Pre-v61aw saves still load their `WM_discovered` from the save file
  // (handled by `if(d.WM_discovered)Object.assign(WM.discovered, ...)` in
  // the load path), so existing characters keep whatever they'd already
  // discovered.
  discovered:{},
  // activeZoneId → map node name — SETTLEMENTS ONLY.
  // Wilderness zones don't map to nodes; they map to road edges (see zoneToEdge).
  // v61f: expanded to cover all Act I + Act II settlements. Without these, the
  // world-map "You are here" indicator and location label stayed stuck on the
  // previous zone's node, so Redwater Ford still showed Ashenmoor.
  zoneToNode:{
    'overworld':'Ashenmoor',
    'hearthwick':'Hearthwick',
    'ironhaven':'Ironhaven',
    // Act I settlements
    'redwater_ford':'Redwater Ford',
    'salthaven':'Salthaven',
    'carraig_mor':'Carraig Mór',
    'droichead':'Droichead',
    'cill_beag':'Cill Beag',
    'inis_rua':'Inis Rua',
    // Act II settlements
    'la_grise':'La Grise',
    'colmans_rest':"Colmán's Rest",
    'mur_pierre':'Mur Pierre',
    'vieux_marche':'Vieux Marché',
    'dunmore':'Dunmore',
    'portclare':'Portclare',
    'coeur_de_vie':'Coeur de Vie',
    'hermit_camp':"Hermit's Camp",
    'caer_uaigneach':'Caer Uaigneach',
  },
  // v61c: activeZoneId → list of road edge names (data-name on .edge SVG
  // elements). Wilderness zones correspond to road segments, not settlements.
  // `forest` spans both south and north stretches of the Forest Road.
  zoneToEdge:{
    'forest':['Forest Road — South','Forest Road — North'],
    'bealach_south':['An Bealach Mór — South'],
  },
  currentNodeName:'Ashenmoor',
  currentEdgeNames:null, // v61c: when on a road, the active edge name(s)
};

// ── GATE-AS-DATA SYSTEM (v61ec) ───────────────────────────────
// Single source of truth for the world map. Every zone declares its
// connections through `gates:[]` already; this layer reads those arrays
// and produces a normalized side-keyed view (`{N,S,E,W}`) keyed by
// the wall the gate sits on. The world-map SVG is then *rendered from*
// this normalized data — it cannot disagree with the gates because
// it's a pure function of them.
//
// Why a normalization layer instead of changing the runtime gate shape?
// The runtime walks gates as an array (proximity check at line 12678,
// prompt at line 20808). Reshaping that array would touch dozens of
// sites. Keeping the array intact and adding a derived dictionary is
// purely additive — the runtime is untouched, the new system is
// authoritative for map rendering only.
//
// MAP_LAYOUT defines each zone's grid cell + visual style. The renderer
// walks every entry, looks up the zone's gates, computes the wall each
// gate sits on, and emits an SVG edge to the matching wall on the
// connected zone's rectangle. Locks render as glyphs based on the
// gate's `guard` field. New zones become a single MAP_LAYOUT entry
// plus their existing gate config — the map updates automatically.

// Compute which wall a gate sits on, given its (x, z) and zone size.
// Uses 15% inset margins; gates on the centerline come back as '?'.
function _gateWall(g, size){
  if(!size) size = 60;
  const m = Math.max(5, size * 0.15);
  if(g.z <= m)        return 'N';
  if(g.z >= size - m) return 'S';
  if(g.x <= m)        return 'W';
  if(g.x >= size - m) return 'E';
  return '?';
}

// Resolve the actual destination zone from a gate's targetZone.
// If the target is a wilderness/road zone (an edge zone), follow it
// to the OTHER endpoint — that's the real "next stop" the gate
// connects to from the map's perspective. Wilderness zones with one
// non-source gate resolve to that gate's target.
function _resolveGateDestination(sourceZoneId, gate, allGates){
  const direct = gate.targetZone;
  // If destination has a map layout entry, it's a node on the map by
  // definition — terminal regardless of zone kind. This covers the case
  // where a zone is `kind:'wilderness'` but appears as a map node anyway
  // (e.g., the Ashfeld is a wilderness zone but a real map destination).
  if(typeof MAP_LAYOUT !== 'undefined' && MAP_LAYOUT[direct]) return direct;
  // v61ee: replaced bogus ZONE_REGISTRY (never existed as a global) with
  // ZONE_BUILDERS, which is the actual placeholder-zone registry.
  const destInfo = MAP_NODES[direct] || (typeof ZONE_BUILDERS !== 'undefined' && ZONE_BUILDERS[direct]);
  if(!destInfo) return direct;
  // If the destination is a settlement/village/town/fast-travel zone, that's
  // the answer. 'village' is the kind used by registerPlaceholderZone for
  // most settlement-tier zones (Droichead, Cill Beag, Hermit's Camp, etc).
  // Only 'wilderness' kind continues the lookup through the corridor.
  if(destInfo.kind === 'settlement' || destInfo.kind === 'village' ||
     destInfo.kind === 'town' || destInfo.fastTravel) return direct;
  // Otherwise it's a wilderness edge zone — follow through to the other endpoint
  const wildernessGates = allGates[direct];
  if(!wildernessGates) return direct;
  for(const sg of wildernessGates){
    if(sg.targetZone !== sourceZoneId) return sg.targetZone;
  }
  return direct;
}

// Build the side-keyed gate map: zone_id → {N, S, E, W} → {to, lock, viaZone}
// `to` is the resolved final destination (settlement on the other side).
// `viaZone` is the wilderness corridor (if any) the path traverses.
// `lock` is the guard condition ('commission', 'tide', etc.) or null.
function _buildGateGraph(){
  // v61ee: Read gates from ZONE_BUILDERS, which is populated for every
  // placeholder zone the moment registerPlaceholderZone runs (regardless
  // of whether the zone has been built / entered yet). The previous
  // version read from `ZONES`, which is only populated on first entry —
  // so on a fresh game with only `overworld` built, the graph saw 1
  // zone instead of 38, and the rendered map was empty of edges.
  const allRaw = {};
  if(typeof ZONE_BUILDERS !== 'undefined'){
    for(const id of Object.keys(ZONE_BUILDERS)){
      const b = ZONE_BUILDERS[id];
      if(b && Array.isArray(b.gates)){
        allRaw[id] = { gates: b.gates, size: b.size, kind: b.kind };
      }
    }
  }
  // Hand-built configs — read from CONFIG objects + known sizes.
  if(typeof ASHENMOOR_CONFIG !== 'undefined' && ASHENMOOR_CONFIG.gates){
    allRaw.overworld = { gates: ASHENMOOR_CONFIG.gates, size: ASHENMOOR_CONFIG.size || 80, kind:'settlement' };
  }
  if(typeof HEARTHWICK_CONFIG !== 'undefined' && HEARTHWICK_CONFIG.gates){
    allRaw.hearthwick = { gates: HEARTHWICK_CONFIG.gates, size: HEARTHWICK_CONFIG.size || 60, kind:'settlement' };
  }
  if(typeof IRONHAVEN_CONFIG !== 'undefined' && IRONHAVEN_CONFIG.gates){
    allRaw.ironhaven = { gates: IRONHAVEN_CONFIG.gates, size: IRONHAVEN_CONFIG.size || 200, kind:'town' };
  }
  // v61ee: bealach_south and forest are also hand-built configs (not via
  // registerPlaceholderZone) and were missing from the gate graph. Their
  // absence broke every Act I path: overworld→bealach_south→hearthwick
  // resolution couldn't follow through bealach_south, leaving the whole
  // northern map orphaned. Now wired in.
  if(typeof BEALACH_SOUTH_CONFIG !== 'undefined' && BEALACH_SOUTH_CONFIG.gates){
    allRaw.bealach_south = { gates: BEALACH_SOUTH_CONFIG.gates, size: BEALACH_SOUTH_CONFIG.size || 200, kind:'wilderness' };
  }
  if(typeof DEEPWOOD_CONFIG !== 'undefined' && DEEPWOOD_CONFIG.gates){
    allRaw.forest = { gates: DEEPWOOD_CONFIG.gates, size: DEEPWOOD_CONFIG.size || 300, kind:'wilderness' };
  }

  // Build the simple raw lookup (zone_id → gate array) for resolveGateDestination
  const rawGates = {};
  for(const id of Object.keys(allRaw)) rawGates[id] = allRaw[id].gates;

  // Build the side-keyed graph
  const graph = {};
  for(const id of Object.keys(allRaw)){
    const {gates, size} = allRaw[id];
    graph[id] = {N:null, S:null, E:null, W:null};
    for(const g of gates){
      const wall = _gateWall(g, size);
      if(wall === '?') continue;  // centerline gates skipped (none in current data)
      // If multiple gates on the same wall, the last one wins. Rare; flag in lint.
      const directTarget = g.targetZone;
      const resolvedTarget = _resolveGateDestination(id, g, rawGates);
      graph[id][wall] = {
        to: resolvedTarget,
        viaZone: (resolvedTarget !== directTarget) ? directTarget : null,
        lock: g.guard || null,
        rawX: g.x, rawZ: g.z,  // preserved for debugging
      };
    }
  }
  // v61ek: lock back-propagation. An edge runs between two zones; if either
  // side declares the gate as guarded, the edge IS guarded — period. The
  // renderer's first-touch-wins de-dup (drawnEdges Set keyed on sorted pair)
  // means a one-sided lock declaration would silently render unlocked when
  // the un-locked side happened to be iterated first. Three of four
  // commission-locked Q7 boundary edges had this shape pre-v61ek
  // (Hearthwick.W only, Ironhaven.N/W only — Salthaven, La Grise, Vieux
  // Marché had no reciprocal guard:'commission' on their facing gate).
  //
  // Fix: walk every directed (zid, side, gate) once; for each, find the
  // destination's reciprocal side (the side whose `to` points back at zid)
  // and copy our lock onto it if that side has no lock of its own.
  // Idempotent — repeated passes converge in one step. If the two sides
  // declare DIFFERENT locks (e.g. one says 'commission', the other 'tide'),
  // the FIRST-WRITTEN side wins on its own gate, but both locks survive
  // independently — there is no conflict-resolution policy here, that
  // would be a real architectural decision with new requirements.
  // Currently no edge declares two different locks, so this is a non-issue.
  for(const zid of Object.keys(graph)){
    for(const side of ['N','S','E','W']){
      const gate = graph[zid][side];
      if(!gate || !gate.lock) continue;
      const dest = graph[gate.to];
      if(!dest) continue;
      for(const ds of ['N','S','E','W']){
        const dg = dest[ds];
        if(dg && dg.to === zid && !dg.lock){
          dg.lock = gate.lock;
          break;
        }
      }
    }
  }
  return graph;
}

// MAP_LAYOUT — locked grid positions for each map node, plus shape/region.
// v61eh: replaced with the spec-matching grid (dungeon_world_map_v2_grid_layout.svg).
// Coordinates verified: each (col, row) lands on the spec SVG's exact node
// center when fed through the renderer's COL_W=130, ROW_H=100, ORIGIN_X=60,
// ORIGIN_Y=60 formula. The spec grid is 8 cols × 7 rows.
//
// Wilderness/road zones don't appear here — they're rendered as edges
// between settlement nodes, not as nodes themselves. Adding a new
// settlement zone = one entry here.
//
// Vertical orientation note: Ironhaven's fortress is built facing
// compass-north in the 3D world (its front gate is its north gate, by
// comment in IRONHAVEN_CONFIG). To preserve gate-direction agreement
// between map and game-3D, the map places Ironhaven IMMEDIATELY BELOW
// the mountain ridge (La Grise above, Portclare below). Its 3D north
// gate now visually points up at La Grise; its 3D south gate points
// down at Portclare; its 3D west gate points west at Vieux Marché.
// La Porte Grise sits to Ironhaven's WEST in this layout (the Deepwood
// corridor descends from La Porte Grise south to Thorngate, then to
// Droichead and Hearthwick — same in-game geometry, repositioned on
// the map to match the spec).
const MAP_LAYOUT = {
  // Foothills row (top — Ferrous Reach)
  mur_pierre:     {col:4, row:0, shape:'hex',  region:'foothills'},
  colmans_rest:   {col:5, row:0, shape:'rect', region:'foothills'},
  la_grise:       {col:6, row:0, shape:'rect', region:'foothills'},
  // Royale cluster — La Porte Grise / Vieux Marché / Ironhaven across row 1
  la_porte_grise: {col:4, row:1, shape:'rect', region:'royale'},
  vieux_marche:   {col:5, row:1, shape:'rect', region:'royale'},
  ironhaven:      {col:6, row:1, shape:'hex',  region:'royale'},
  // Royale south spine — Dunmore / Portclare / Coeur de Vie across row 2
  dunmore:        {col:5, row:2, shape:'rect', region:'royale'},
  portclare:      {col:6, row:2, shape:'rect', region:'royale'},
  coeur_de_vie:   {col:7, row:2, shape:'hex',  region:'royale'},
  // Bealach branch — Thorngate alone in row 3 (descending from La Porte Grise)
  thorngate:      {col:4, row:3, shape:'rect', region:'bealach'},
  // Bealach + Coastal row — Salthaven (col 0) far west, Hearthwick (col 2),
  // then the Bealach east cluster Droichead/Cill Beag (cols 4-5)
  salthaven:      {col:0, row:4, shape:'rect', region:'coastal'},
  hearthwick:     {col:2, row:4, shape:'rect', region:'bealach'},
  droichead:      {col:4, row:4, shape:'rect', region:'bealach'},
  cill_beag:      {col:5, row:4, shape:'rect', region:'bealach'},
  // Mid-south — Carraig Mór, Ashenmoor, Wastes nodes
  carraig_mor:    {col:0, row:5, shape:'hex',  region:'coastal'},
  overworld:      {col:2, row:5, shape:'rect', region:'ashen'},
  hermit_camp:    {col:5, row:5, shape:'rect', region:'wastes'},
  caer_uaigneach: {col:6, row:5, shape:'rect', region:'wastes'},
  // South row — Inis Rua, Ashfeld + Redwater
  inis_rua:       {col:0, row:6, shape:'rect', region:'coastal'},
  ashfeld:        {col:2, row:6, shape:'rect', region:'ashen'},
  redwater_ford:  {col:3, row:6, shape:'rect', region:'ashen'},
};

// Display names + tooltips for each map node. Pulled from existing
// data-* payloads to preserve discovery / fast-travel / tooltip behavior.
const MAP_NODE_META = {
  mur_pierre:     {name:'Mur Pierre',     type:'Mountain Garrison — Act II',          act:'Act II',           fastTravel:true,  desc:"Pierre's Wall — or Wall of Stone. French garrison built by Coeur de Vie and then abandoned to fend for itself. Tough, self-reliant, deeply resentful of the capital."},
  colmans_rest:   {name:"Colmán's Rest",  type:'Village — Foothill Settlement',       act:'Act II',           fastTravel:true,  desc:"Named after a traveler who died here in the first winter. His descendants never left. A farming village that ended up in the Grise almost by accident. The soil grows crops unusually well."},
  la_grise:       {name:'La Grise',       type:'Village — Mining Settlement',         act:'Act II',           fastTravel:true,  desc:"French: The Grey One. Mining camp that became permanent. Ore near dungeon shafts has strange magnetic properties.", dungeons:"Mine shafts — old gates near the ore"},
  la_porte_grise: {name:'La Porte Grise', type:'Outpost — Royal Checkpoint',          act:'Act I · Act II',   fastTravel:true,  desc:"French: The Grey Gate. A small walled outpost where the forest road enters Ironhaven's territory. Properly staffed — a royal quartermaster's post, the kind of place where 'papers, please' is muttered. The relief of leaving the forest is immediate and slightly shameful."},
  vieux_marche:   {name:'Vieux Marché',   type:'Village — Market Town',               act:'Act II',           fastTravel:true,  desc:"French: Old Market. Predates La Route Royale — the road was built to reach it. The market square has a gallows that hasn't been used in twenty years but hasn't been taken down."},
  ironhaven:      {name:'Ironhaven',      type:'Walled Town — Act I &amp; II Hub',    act:'Act I · Act II',   fastTravel:true,  desc:"A walled military town of ~800 under Lord Caldric. Seat of regional power. Refugee hub after Ashenmoor falls. Aldwyn operates here under cover as Royal Herald.", pois:"Lord Caldric's Keep · Ironhaven Market · Scholar's Guild · 5 interior shops · Notice Board", dungeons:"1–3 gates in the outer ring"},
  dunmore:        {name:'Dunmore',        type:'Walled Town — Act II Hub',            act:'Act II · Act III', fastTravel:true,  desc:"Irish: Great Fort. Fortified town commanding the crossroads between La Route Royale, the coastal road, and the Wastes path. Older than Ironhaven and less polished."},
  portclare:      {name:'Portclare',      type:'Town — Coastal Gateway',              act:'Act II · Act III', fastTravel:true,  desc:"Anglo-Saxon/Irish: Port of the Plain. Mid-sized fortified harbor between Dunmore and Coeur de Vie. Has the air of a place that used to matter more."},
  coeur_de_vie:   {name:'Coeur de Vie',   type:'The Capital — Act II · Act III',      act:'Act II · Act III', fastTravel:true,  desc:"Heart of Life — the capital's name for itself. Coastal, wealthy, self-important, deeply invested in not asking hard questions. The irony of its name — given what is dying at the center of the map — is not lost on Varek."},
  thorngate:      {name:'The Thorngate',  type:'Outpost — Royal Watchpost',           act:'Act I · Act II',   fastTravel:true,  desc:"A small walled outpost where the road from Hearthwick enters the Deepwood. Garrisoned thinly. The thornbush growing over the gate has not been trimmed in decades. A road-warden quartermaster keeps the place supplied; rations and basic gear, nothing fine."},
  hearthwick:     {name:'Hearthwick',     type:'Village — Road Waypoint',             act:'Act I · Act II',   fastTravel:true,  desc:"Halfway between Ashenmoor and Ironhaven on An Bealach Mór. Best inn on the road, run by Oda — thirty years of rumors, priced accordingly. No dungeon nearby, which makes it unusually comfortable."},
  droichead:      {name:'Droichead',      type:'Village — Bridge Settlement',         act:'Act I · Act II',   fastTravel:true,  desc:"Irish: Bridge. Where An Bealach Mór crosses the Dearg. The bridge is too well-made for a village this size. A ferryman sells information. The bridge keystones have sigil-like carvings.", pois:"Bridge over An Dearg · Sigil carvings on keystones · Ferryman (information broker)"},
  cill_beag:      {name:'Cill Beag',      type:'Village — Oratory Settlement',        act:'Act I',            fastTravel:true,  desc:"Irish: Small Church. Grew up around a half-ruined stone oratory. The priest is de facto mayor. Has an uneasy relationship with a gate portal two miles east that everyone pretends isn't there.", pois:"Stone oratory (half-ruined) · Irish inscription on lintel", dungeons:"1 gate east of Cill Beag"},
  hermit_camp:    {name:"Hermit's Camp",  type:'Wastes Waypoint — Isolated NPC',      act:'Act I · Act II',                     desc:"A single figure lives at the edge of the Hollowed Wastes in a camp of salvaged dungeon timber. Has been here longer than anyone alive. Does not give a name. Will trade information for silence."},
  caer_uaigneach: {name:'Caer Uaigneach', type:'Plague Village — Hollowed Wastes',    act:'Act II',           danger:true,      desc:"Irish: Lonely Fort. A village of 300 fourteen years ago. Something came up from the gate beneath it. Half fled overnight. The other half stayed. Nobody has heard from them in eleven years."},
  salthaven:      {name:'Salthaven',      type:'Village — Fishing Harbor',            act:'Act II',           fastTravel:true,  desc:"Small harbor north of Carraig Mór. Where the fishing catch gets processed and shipped east. Economic engine for the Windward Coast. Smells like it."},
  overworld:      {name:'Ashenmoor',      type:'Village — Destroyed · Act I Climax',  act:'Act I',            fastTravel:true,  danger:true, desc:"A village of ~200 built around the Dungeon of Shadows. Where the questline begins. Burns at the end of Act I when the binding beneath it tears open. Survivors flee north to Ironhaven.", pois:"Dungeon of Shadows portal · Bram's Forge · Notice Board · 7 dungeon portals (outer ring)", dungeons:"7 gates · outer ring · mix of difficulties"},
  carraig_mor:    {name:'Carraig Mór',    type:'Coastal Town — Act II',               act:'Act II',           fastTravel:true,  desc:"Irish: Great Rock. One of the oldest inhabited places on the map, predating all Anglo-Saxon settlements. Built into dramatic coastal rock formations. The people here answer to no lord."},
  ashfeld:        {name:'The Ashfeld',    type:'Point of Interest — Ancient Battlefield (Ruined)', act:'Act I · Act II',     desc:"An ancient battlefield where two lords spent their subjects' lives for causes nobody remembers. The site of the first meeting with Varek. He comes here regularly — there is a worn path through the grass to where he stands."},
  redwater_ford:  {name:'Redwater Ford',  type:'Village — River Crossing',            act:'Act I',            fastTravel:true,  desc:"South of Ashenmoor where An Dearg runs rust-red over pale stone. Mostly farmers. No dungeon nearby — unusual. The red water makes visitors uneasy; locals stopped noticing."},
  inis_rua:       {name:'Inis Rua',       type:'Tidal Island — Act II',               act:'Act II',                            desc:"Irish: Red Island. A small tidal island, reachable from Carraig Mór only by ferry when the tide is out. Fiercely independent — the sea owns them twice a day. Has exactly one dungeon entrance, a sea-cave called the Mouth."},
};

// Edge waypoint overrides. The default L-shape rendering produces clean
// geometry for most node pairs, but a handful of long routes pass visually
// through other nodes. Override entries supply intermediate waypoints; the
// renderer threads {a → wp1 → wp2 → ... → b} instead of its default L.
//
// Keys are sorted-pair edge IDs ("${a}__${b}" with a < b alphabetically).
// Waypoints are oriented assuming the key order; if the actual edge runs
// b→a, the renderer reverses them on the fly.
//
// Adding an entry: pick endpoints, sort their IDs, list the waypoints in
// SVG coords (origin top-left). Verify in browser; the underlying gates
// don't change, only the visual path between matched anchors.
//
// v61eh: emptied. Under the spec-matched grid, no edges visually pass
// through unrelated nodes — every spec edge is either same-row, same-col,
// or a clean L through an empty cell. Infrastructure preserved for any
// future content that needs waypoint control.
const MAP_EDGE_OVERRIDES = {
};

// Region styling. Used by both SVG renderer and lock-glyph rendering.
const MAP_REGION_STYLE = {
  foothills: {fill:'#1a1430', stroke:'#7a60b0', text:'#aa90e0'},
  royale:    {fill:'#221e08', stroke:'#c8a84b', text:'#daa520'},
  bealach:   {fill:'#1a2e18', stroke:'#4a8a4a', text:'#8acc8a'},
  wastes:    {fill:'#1e1a0e', stroke:'#7a6030', text:'#aa9050'},
  ashen:     {fill:'#2a1010', stroke:'#8a2020', text:'#c88080'},
  coastal:   {fill:'#102030', stroke:'#4a90b8', text:'#8abada'},
};

// Render the world map SVG from MAP_LAYOUT + the gate graph.
// Pure function: same inputs → same output. The map cannot disagree
// with the gates because the SVG is derived from them.
function renderWorldMapSVG(){
  const COL_W = 130, ROW_H = 100, ORIGIN_X = 60, ORIGIN_Y = 60;
  const NODE_W = 90, NODE_H = 50, HEX_W = 90, HEX_H = 70;
  // v61eh: viewBox shrunk from 1200×875 to 1075×775 to match the spec SVG
  // (dungeon_world_map_v2_grid_layout.svg) exactly. The new MAP_LAYOUT's
  // rightmost node center is at x=970 (Coeur de Vie); rect right-edge at
  // x=1015. Bottom row centers at y=660; rect bottom-edges at y=685.
  // Legend at y=VBOX_H-50 = 725 sits ~40px below content. Inner border
  // shrunk to (5, 5) → (VBOX_W-10, VBOX_H-60) so it fits the new size
  // and clears the legend at bottom.
  const VBOX_W = 1075, VBOX_H = 775;

  // Compute geometry for each node
  const geom = {};
  for(const [zid, layout] of Object.entries(MAP_LAYOUT)){
    const cx = ORIGIN_X + layout.col * COL_W;
    const cy = ORIGIN_Y + layout.row * ROW_H;
    if(layout.shape === 'hex'){
      geom[zid] = {cx, cy, x:cx-HEX_W/2, y:cy-HEX_H/2, w:HEX_W, h:HEX_H, ...layout};
    } else {
      geom[zid] = {cx, cy, x:cx-NODE_W/2, y:cy-NODE_H/2, w:NODE_W, h:NODE_H, ...layout};
    }
  }

  // Get the gate graph (built once, cached)
  if(!_gateGraphCache) _gateGraphCache = _buildGateGraph();
  const graph = _gateGraphCache;

  // Anchor helper — returns (x, y) where an edge should attach to a node's wall
  function anchor(zid, side){
    const g = geom[zid];
    if(!g) return null;
    if(side === 'N') return [g.cx, g.y];
    if(side === 'S') return [g.cx, g.y + g.h];
    if(side === 'W') return [g.x, g.cy];
    if(side === 'E') return [g.x + g.w, g.cy];
  }

  // Opposite-wall helper for matching destination side
  const OPPOSITE = {N:'S', S:'N', E:'W', W:'E'};

  // Build the SVG
  const out = [];
  out.push(`<svg viewBox="0 0 ${VBOX_W} ${VBOX_H}" xmlns="http://www.w3.org/2000/svg">`);
  out.push(`<rect width="${VBOX_W}" height="${VBOX_H}" fill="#0a1820"/>`);
  out.push(`<rect x="5" y="5" width="${VBOX_W-10}" height="${VBOX_H-60}" fill="#141e12" stroke="#2a3828" stroke-width="1.5"/>`);

  // Edges first (so nodes draw over them at terminations).
  // De-dupe: only draw each edge once even if both ends declare it.
  const drawnEdges = new Set();
  for(const [zid, sides] of Object.entries(graph)){
    if(!geom[zid]) continue;  // skip non-map zones (wilderness corridors)
    for(const [side, gate] of Object.entries(sides)){
      if(!gate || !geom[gate.to]) continue;
      const pairKey = [zid, gate.to].sort().join('|');
      if(drawnEdges.has(pairKey)) continue;
      drawnEdges.add(pairKey);
      const a = anchor(zid, side);
      // Determine destination wall: prefer the destination's actual gate wall back to us.
      let destSide = OPPOSITE[side];  // sensible default
      const destGraph = graph[gate.to];
      if(destGraph){
        for(const [ds, dg] of Object.entries(destGraph)){
          if(dg && (dg.to === zid)){ destSide = ds; break; }
        }
      }
      const b = anchor(gate.to, destSide);
      if(!a || !b) continue;
      // Compose path. Override table consulted first; if absent, fall through
      // to default same-axis straight or L-shape via midpoint.
      let d;
      const pairKeyAlpha = [zid, gate.to].sort().join('__');
      const override = MAP_EDGE_OVERRIDES[pairKeyAlpha];
      if(override){
        // Waypoints are oriented assuming the sorted-key order. If the actual
        // edge runs the opposite direction (zid > gate.to alphabetically),
        // reverse the waypoints so we still trace src → ... → dst.
        const wps = (zid < gate.to) ? override : override.slice().reverse();
        const segs = [`M ${a[0]} ${a[1]}`];
        for(const wp of wps) segs.push(`L ${wp.x} ${wp.y}`);
        segs.push(`L ${b[0]} ${b[1]}`);
        d = segs.join(' ');
      } else if((side === 'N' || side === 'S') && (destSide === 'N' || destSide === 'S') && a[0] === b[0]){
        d = `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`;
      } else if((side === 'E' || side === 'W') && (destSide === 'E' || destSide === 'W') && a[1] === b[1]){
        d = `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`;
      } else {
        // L-shape: leave the source perpendicular to its wall, then turn
        const midX = (side === 'E' || side === 'W') ? b[0] : a[0];
        const midY = (side === 'N' || side === 'S') ? b[1] : a[1];
        d = `M ${a[0]} ${a[1]} L ${midX} ${midY} L ${b[0]} ${b[1]}`;
      }
      // Stroke style depends on lock and whether this is a wastes path
      const isWastes = (geom[zid].region === 'wastes' || geom[gate.to].region === 'wastes');
      const isWater = (gate.lock === 'tide');
      let stroke = '#c8a84b', sw = '2.5', opacity = '0.7', dash = '9 4';
      if(isWastes) { stroke = '#8a6010'; sw = '2'; dash = '5 6'; }
      if(isWater)  { stroke = '#4a90b8'; sw = '2'; dash = '3 4'; opacity = '0.55'; }
      const lockClass = gate.lock ? ` wm-edge-lock-${gate.lock}` : '';
      out.push(`<g class="edge${lockClass}" data-name="${zid}__${gate.to}" data-from="${zid}" data-to="${gate.to}"${gate.lock?` data-lock="${gate.lock}"`:''}><path class="eline" d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="${dash}" stroke-opacity="${opacity}"/></g>`);

      // Lock glyph at midpoint (commission-locked edges only — tide gates render as water-style edges instead).
      // For overridden edges, use the midpoint of the longest waypoint segment so the glyph lands ON the path
      // rather than floating between the original anchors.
      if(gate.lock === 'commission'){
        let mx, my;
        if(override){
          // Build the full point list (anchor → waypoints → anchor) in actual draw order,
          // pick the segment with the largest length, and use its midpoint.
          const wps = (zid < gate.to) ? override : override.slice().reverse();
          const pts = [a, ...wps.map(w=>[w.x,w.y]), b];
          let bestLen = -1, bestMid = [a[0], a[1]];
          for(let i=0; i<pts.length-1; i++){
            const dx = pts[i+1][0]-pts[i][0], dy = pts[i+1][1]-pts[i][1];
            const L = dx*dx + dy*dy;
            if(L > bestLen){ bestLen = L; bestMid = [(pts[i][0]+pts[i+1][0])/2, (pts[i][1]+pts[i+1][1])/2]; }
          }
          mx = bestMid[0]; my = bestMid[1];
        } else {
          mx = (a[0] + b[0]) / 2; my = (a[1] + b[1]) / 2;
        }
        out.push(`<g class="wm-lock-icon" transform="translate(${mx},${my})"><circle r="9" fill="#1a1408" stroke="#5a5040" stroke-width="1"/><rect x="-4" y="-2" width="8" height="6" rx="1" fill="#9a8040"/><path d="M -3 -2 V -4 Q -3 -7 0 -7 Q 3 -7 3 -4 V -2" fill="none" stroke="#9a8040" stroke-width="1.2"/></g>`);
      }
    }
  }

  // Nodes
  for(const [zid, g] of Object.entries(geom)){
    const meta = MAP_NODE_META[zid] || {name:zid};
    const style = MAP_REGION_STYLE[g.region] || MAP_REGION_STYLE.bealach;
    const dataAttrs = [
      `data-name="${meta.name}"`,
      meta.type ? `data-type="${meta.type}"` : '',
      meta.act ? `data-act="${meta.act}"` : '',
      meta.desc ? `data-desc="${meta.desc.replace(/"/g,'&quot;')}"` : '',
      meta.fastTravel ? `data-fasttravel="true"` : '',
      meta.danger ? `data-danger="true"` : '',
      meta.pois ? `data-pois="${meta.pois.replace(/"/g,'&quot;')}"` : '',
      meta.dungeons ? `data-dungeons="${meta.dungeons.replace(/"/g,'&quot;')}"` : '',
    ].filter(Boolean).join(' ');

    let shape;
    if(g.shape === 'hex'){
      const pts = `${g.cx},${g.y} ${g.x+g.w},${g.y+g.h*0.25} ${g.x+g.w},${g.y+g.h*0.75} ${g.cx},${g.y+g.h} ${g.x},${g.y+g.h*0.75} ${g.x},${g.y+g.h*0.25}`;
      shape = `<polygon class="node-shape" points="${pts}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2.5"/>`;
    } else {
      shape = `<rect class="node-shape" x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="3" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2"/>`;
    }
    // Two-line labels for long names
    const longNames = {
      "Colmán's Rest":["Colmán's","Rest"], "La Porte Grise":["La Porte","Grise"],
      "Vieux Marché":["Vieux","Marché"], "Coeur de Vie":["Coeur","de Vie"],
      "The Thorngate":["Thorn-","gate"], "Hermit's Camp":["Hermit's","Camp"],
      "Caer Uaigneach":["Caer","Uaigneach"], "Carraig Mór":["Carraig","Mór"],
      "Redwater Ford":["Redwater","Ford"], "The Ashfeld":["The","Ashfeld"],
    };
    let textPart;
    if(longNames[meta.name]){
      const [l1,l2] = longNames[meta.name];
      textPart = `<text x="${g.cx}" y="${g.cy-2}" text-anchor="middle" font-family="Cinzel,serif" font-size="9" fill="${style.text}" font-weight="600">${l1}</text><text x="${g.cx}" y="${g.cy+10}" text-anchor="middle" font-family="Cinzel,serif" font-size="9" fill="${style.text}" font-weight="600">${l2}</text>`;
    } else {
      textPart = `<text x="${g.cx}" y="${g.cy+4}" text-anchor="middle" font-family="Cinzel,serif" font-size="10" fill="${style.text}" font-weight="600">${meta.name}</text>`;
    }
    out.push(`<g class="node" ${dataAttrs}>${shape}${textPart}</g>`);
  }

  // Region legend
  const legendY = VBOX_H - 50;
  const legend = [['Royale','#daa520'],['Foothills','#aa90e0'],['Bealach','#8acc8a'],['Wastes','#aa9050'],['Ashen','#c88080'],['Coastal','#8abada']];
  let lx = 60;
  for(const [label, col] of legend){
    out.push(`<rect x="${lx}" y="${legendY}" width="14" height="14" rx="2" fill="${col}" opacity=".8"/>`);
    out.push(`<text x="${lx+20}" y="${legendY+11}" font-family="Cinzel,serif" font-size="10" fill="#a89060">${label}</text>`);
    lx += 95;
  }

  // Current-position ring + dot (preserved IDs from prior SVG)
  const ash = geom.overworld;
  if(ash){
    out.push(`<circle id="wm-cur-ring" cx="${ash.cx}" cy="${ash.cy}" r="32" fill="none" stroke="#daa520" stroke-width="2" opacity="0" style="animation:wm-pulse 2.2s ease-in-out infinite"/>`);
    out.push(`<circle id="wm-cur-dot" cx="${ash.cx}" cy="${ash.cy}" r="4" fill="#daa520" opacity="0"/>`);
  }

  out.push('</svg>');
  return out.join('\n');
}

// Cache the gate graph so renderer + lint don't recompute. Cleared if
// any zone's gates change at runtime (none currently do, but the hook is
// here for future locked/unlocked toggles that might mutate gate definitions).
let _gateGraphCache = null;
function invalidateGateGraph(){ _gateGraphCache = null; }

// Build coords lookup from MAP_LAYOUT for the existing fog-of-war and
// current-ring code. Replaces the old hand-maintained WM_COORDS table —
// generated from the same MAP_LAYOUT the SVG uses, so they cannot drift.
function _buildWMCoordsFromLayout(){
  const COL_W = 130, ROW_H = 100, ORIGIN_X = 60, ORIGIN_Y = 60;
  const out = {};
  for(const [zid, layout] of Object.entries(MAP_LAYOUT)){
    const meta = MAP_NODE_META[zid];
    if(!meta) continue;
    out[meta.name] = {cx: ORIGIN_X + layout.col * COL_W, cy: ORIGIN_Y + layout.row * ROW_H};
  }
  return out;
}

// Same idea for WM_NODE_TO_ZONE — derived from MAP_NODE_META, single source.
function _buildNodeToZoneFromLayout(){
  const out = {};
  for(const [zid, meta] of Object.entries(MAP_NODE_META)){
    if(MAP_LAYOUT[zid]) out[meta.name] = zid;
  }
  return out;
}

// v61ec: WM_COORDS and WM_NODE_TO_ZONE are now DERIVED from MAP_LAYOUT
// + MAP_NODE_META above. They cannot drift from the map's grid layout
// because they are pure functions of it. Both tables are still read by
// fog-of-war (wmApplyFog), the current-position ring (wmUpdateRing),
// fast-travel resolver (fastTravelTo), and elsewhere — interfaces
// preserved, source of truth changed.
const WM_COORDS = _buildWMCoordsFromLayout();
const WM_NODE_TO_ZONE = _buildNodeToZoneFromLayout();

function wmInit(){
  if(WM.initialized)return;
  WM.initialized=true;
  const wrap=document.getElementById('wm-svg-wrap');
  if(!wrap)return;
  // v61ec: SVG is now rendered from MAP_LAYOUT + gate graph rather than
  // a hand-maintained static string. See renderWorldMapSVG().
  wrap.innerHTML=renderWorldMapSVG();
  wmApplyFog();
  wmWireInteraction();
  wmWirePan();
  wmWireScroll();
  wmResetView();
  // v61eb: One-shot map↔code consistency audit. Walks every SVG node
  // and verifies that (a) it has an entry in WM_NODE_TO_ZONE, (b) the
  // referenced zone exists in ZONES (or in the placeholder registry).
  // Walks every SVG edge name and verifies the edge has an entry in
  // either zoneToEdge or matches a known wilderness/road zone. Logs
  // mismatches to console.warn. Locks the gate against future drift —
  // if a map edit references a deleted zone, or a code refactor renames
  // a zone, the next page load will surface the issue rather than
  // letting it hide. Console-only, never user-facing.
  if(typeof wmLintMapVsCode === 'function') wmLintMapVsCode();
}

function wmLintMapVsCode(){
  const svg = document.querySelector('#wm-svg-wrap svg');
  if(!svg) return;
  const issues = [];
  const graph = _gateGraphCache || _buildGateGraph();

  // 1. Every MAP_LAYOUT entry must be a known zone — present in MAP_NODES
  //    (the canonical registry) or one of the hand-built configs.
  for(const zid of Object.keys(MAP_LAYOUT)){
    const inRegistry = (typeof MAP_NODES !== 'undefined') && MAP_NODES[zid];
    const isHandBuilt = ['overworld','hearthwick','ironhaven','forest'].includes(zid);
    if(!inRegistry && !isHandBuilt){
      issues.push(`MAP_LAYOUT has "${zid}" but no zone of that id in MAP_NODES or hand-built configs`);
    }
  }
  // 2. Every MAP_LAYOUT entry should have a MAP_NODE_META entry (for tooltips)
  for(const zid of Object.keys(MAP_LAYOUT)){
    if(!MAP_NODE_META[zid]){
      issues.push(`MAP_LAYOUT has "${zid}" but no MAP_NODE_META entry — node will display without name`);
    }
  }
  // 3. Wall-direction sanity: every gate destination that is itself in
  //    MAP_LAYOUT should also have a return gate pointing back to us
  //    (otherwise the path is one-way and the map will draw an edge that
  //    can't be traversed both directions).
  for(const [zid, sides] of Object.entries(graph)){
    if(!MAP_LAYOUT[zid]) continue;  // skip wilderness corridor zones
    for(const [side, gate] of Object.entries(sides)){
      if(!gate) continue;
      const destGraph = graph[gate.to];
      if(!destGraph){
        if(MAP_LAYOUT[gate.to]) issues.push(`${zid} ${side} → ${gate.to} but ${gate.to} has no gate graph`);
        continue;
      }
      if(!MAP_LAYOUT[gate.to]) continue;  // dest is not on the map (e.g., a sub-zone)
      // Check destGraph has a gate pointing back to zid
      let foundReturn = false;
      for(const [ds, dg] of Object.entries(destGraph)){
        if(dg && dg.to === zid){ foundReturn = true; break; }
      }
      if(!foundReturn){
        issues.push(`One-way path: ${zid} ${side} → ${gate.to}, but ${gate.to} has no gate back to ${zid}`);
      }
    }
  }
  // 4. Every SVG node should have a MAP_LAYOUT entry (and vice versa)
  const svgNodeNames = new Set();
  svg.querySelectorAll('.node[data-name]').forEach(el=>svgNodeNames.add(el.dataset.name));
  for(const [name, zid] of Object.entries(WM_NODE_TO_ZONE)){
    if(!svgNodeNames.has(name)){
      issues.push(`WM_NODE_TO_ZONE has "${name}" but no SVG node — renderer drift?`);
    }
  }
  if(issues.length){
    console.warn('[wmLint] Map↔code mismatches detected:');
    issues.forEach(s=>console.warn('  • '+s));
  } else {
    console.log('[wmLint] Map↔code consistency check passed ('+svgNodeNames.size+' nodes audited).');
  }
}

function wmSyncZone(){
  // Pull current zone from game state; route wilderness → road edge, settlement → node
  const zid = typeof activeZoneId!=='undefined' ? activeZoneId : 'overworld';
  const nodeName = WM.zoneToNode[zid];
  const edgeNames = WM.zoneToEdge[zid] || null;
  if(nodeName){
    WM.currentNodeName = nodeName;
    WM.currentEdgeNames = null;
    // v61b7: gate Ashenmoor's discovery on tutorial completion. The hub
    // can be opened from inside the tutorial crypt, which would otherwise
    // call wmSyncZone with zid==='overworld' (zoneToNode maps the dungeon's
    // pre-zone to its parent settlement) and reveal the village before
    // the player has actually arrived. Defer overworld discovery until
    // worldState.tutorialDone flips in goToOW's tutorial-exit branch.
    if(!(zid==='overworld' && !worldState.tutorialDone)){
      WM.discovered[nodeName] = true;
    }
  } else if(edgeNames){
    // v61c: wilderness — clear node highlight, set edge highlight
    WM.currentNodeName = null;
    WM.currentEdgeNames = edgeNames;
  } else {
    // v61f: unmapped zone (e.g. Act I/II placeholder wilderness whose road-edge
    // labels don't exist on the SVG yet). Clear stale state so the label shows
    // '—' instead of the previous zone's name.
    WM.currentNodeName = null;
    WM.currentEdgeNames = null;
  }
  // v61b7: removed the hard-coded "auto-discover adjacent named nodes" lines
  // that used to sit here. Each zone now reveals only itself on entry; the
  // road chain unfurls one step at a time as the player walks it. Adjacent
  // gate edges are still visible as faint road labels through the fog —
  // that's enough orientation without spoiling destinations.
  const lbl=document.getElementById('wm-loc-label');
  if(lbl){
    if(WM.currentNodeName)      lbl.textContent = WM.currentNodeName.toUpperCase();
    else if(WM.currentEdgeNames) lbl.textContent = ('On Road: ' + WM.currentEdgeNames.join(' / ')).toUpperCase();
    else lbl.textContent = '—';
  }
  wmApplyFog();
  if(typeof wmRefreshFtClasses==='function')wmRefreshFtClasses();
  if(typeof wmRefreshLockedEdges==='function')wmRefreshLockedEdges();
}

function wmApplyFog(){
  const svg=document.querySelector('#wm-svg-wrap svg');
  if(!svg)return;
  // v61ec: read viewBox from the actual SVG so fog dimensions track the
  // renderer's output rather than hardcoded old-map values. Falls back
  // to the new layout's 1200×875 if for some reason the attribute is
  // absent.
  const vb=(svg.getAttribute('viewBox')||'0 0 1200 875').split(/\s+/).map(Number);
  const VW=vb[2]||1200, VH=vb[3]||875;
  // v61ec: reveal radius bumped 125 → 165 to match the new grid's
  // 130px column / 100px row spacing. At 125 a discovered node only
  // barely reached the adjacent grid cell; at 165 the player can see
  // their immediate neighbors clearly without the mask cutting off
  // mid-edge.
  const REVEAL_R=165;
  const old=svg.querySelector('#wm-fog-layer');if(old)old.remove();
  const NS='http://www.w3.org/2000/svg';
  let defs=svg.querySelector('defs');
  if(!defs){defs=document.createElementNS(NS,'defs');svg.insertBefore(defs,svg.firstChild);}
  const fogG=document.createElementNS(NS,'g');fogG.id='wm-fog-layer';fogG.style.pointerEvents='none';
  const maskId='wm-fog-mask';
  let mask=defs.querySelector('#'+maskId);
  if(!mask){mask=document.createElementNS(NS,'mask');mask.id=maskId;defs.appendChild(mask);}
  mask.innerHTML='';
  const bg=document.createElementNS(NS,'rect');
  bg.setAttribute('width',VW);bg.setAttribute('height',VH);bg.setAttribute('fill','white');
  mask.appendChild(bg);
  Object.keys(WM.discovered).forEach(name=>{
    if(!WM.discovered[name])return;
    const coord=WM_COORDS[name];if(!coord)return;
    const gid='wfg_'+name.replace(/[^a-zA-Z0-9]/g,'_');
    let grad=defs.querySelector('#'+gid);
    if(!grad){
      grad=document.createElementNS(NS,'radialGradient');grad.id=gid;
      grad.innerHTML='<stop offset="0%" stop-color="black" stop-opacity="1"/><stop offset="68%" stop-color="black" stop-opacity="1"/><stop offset="100%" stop-color="black" stop-opacity="0"/>';
      defs.appendChild(grad);
    }
    const c=document.createElementNS(NS,'circle');
    c.setAttribute('cx',coord.cx);c.setAttribute('cy',coord.cy);c.setAttribute('r',REVEAL_R);
    c.setAttribute('fill','url(#'+gid+')');mask.appendChild(c);
  });
  const fogRect=document.createElementNS(NS,'rect');
  fogRect.setAttribute('width',VW);fogRect.setAttribute('height',VH);
  // v61b8: fog opacity bumped 0.87 → 0.97. At 0.87, node shapes and labels
  // were still visible through the fog as faint colored outlines — the
  // underlying SVG was bleeding 13% through, enough to read settlement
  // positions and labels well before the player walked there. 0.97 fully
  // obscures node detail while still letting the continent silhouettes
  // and ocean/mountain regions show through faintly so the map doesn't
  // become a pure black rectangle. Discovered nodes still punch through
  // via the radialGradient mask, so revealed areas are unaffected.
  fogRect.setAttribute('fill','#030504');fogRect.setAttribute('opacity','0.97');
  fogRect.setAttribute('mask','url(#'+maskId+')');
  fogG.appendChild(fogRect);svg.appendChild(fogG);
  wmUpdateRing();
}

function wmUpdateRing(){
  const ring=document.getElementById('wm-cur-ring');
  const dot=document.getElementById('wm-cur-dot');
  if(!ring)return;
  // v61c: in wilderness zones currentNodeName is null — the ring is hidden
  // and the active road edge is highlighted via the .edge.wm-edge-current CSS class.
  const coord=WM.currentNodeName?WM_COORDS[WM.currentNodeName]:null;
  if(!coord){ring.setAttribute('opacity','0');if(dot)dot.setAttribute('opacity','0');return;}
  ring.setAttribute('cx',coord.cx);ring.setAttribute('cy',coord.cy);ring.setAttribute('opacity','0.85');
  if(dot){dot.setAttribute('cx',coord.cx);dot.setAttribute('cy',coord.cy);dot.setAttribute('opacity','1');}
}

function wmWireInteraction(){
  const svg=document.querySelector('#wm-svg-wrap svg');if(!svg)return;
  svg.querySelectorAll('.node,.edge').forEach(el=>{
    el.addEventListener('mouseenter',()=>wmShowInfo(el));
  });
  // Fast-travel: click to travel on eligible nodes. Wire on all nodes; refusal logic
  // lives in fastTravelTo so we can show specific toasts for each failure mode.
  svg.querySelectorAll('.node').forEach(el=>{
    el.addEventListener('click',ev=>{
      ev.stopPropagation();
      const name=el.dataset.name;
      if(!name)return;
      fastTravelTo(name);
    });
  });
  wmRefreshFtClasses();
}

// Mark fast-travel-eligible nodes so CSS can give them a pointer cursor + glow.
// Called on wire-up and whenever hub opens (discovery may have advanced).
function wmRefreshFtClasses(){
  const svg=document.querySelector('#wm-svg-wrap svg');if(!svg)return;
  svg.querySelectorAll('.node').forEach(el=>{
    const name=el.dataset.name;
    const eligible=name && WM_NODE_TO_ZONE[name] && WM.discovered[name] &&
                   WM_NODE_TO_ZONE[name]!==activeZoneId;
    el.classList.toggle('wm-ft-eligible', !!eligible);
    el.classList.toggle('wm-ft-current', name===WM.currentNodeName);
  });
  // v61c: highlight the road edge(s) the player is currently traversing
  const curEdges = WM.currentEdgeNames || [];
  svg.querySelectorAll('.edge').forEach(el=>{
    const name=el.dataset.name;
    el.classList.toggle('wm-edge-current', curEdges.indexOf(name)>=0);
  });
}

// v61eh: WM_LOCKED_EDGES retired. The renderer (renderWorldMapSVG) already
// emits commission-locked edges with data-lock="commission" derived from the
// gate graph itself, AND draws the lock glyph at render time. The gate graph
// is the single source of truth for what's locked — the old hand-maintained
// list of pretty road labels would have drifted (and did: it predated the
// v61ee commission move and the v61eh ironhaven↔portclare addition).
// `wmRefreshLockedEdges` now just toggles the .wm-edge-locked CSS class and
// strips the static lock glyph after Q7 turn-in flips worldState.commissioned.

// Toggle .wm-edge-locked class on commission-gated edges and strip the
// render-time lock glyphs after Q7 turn-in. Idempotent — safe to call on
// every hub open and on the moment-of-unlock at Q7 turn-in.
function wmRefreshLockedEdges(){
  const svg=document.querySelector('#wm-svg-wrap svg');if(!svg)return;
  const stillLocked = !worldState.commissioned;
  // Find every commission-gated edge by its data-lock attribute (set by the
  // renderer from gate.lock at draw time — single source of truth).
  svg.querySelectorAll('.edge[data-lock="commission"]').forEach(el=>{
    el.classList.toggle('wm-edge-locked', stillLocked);
    // The renderer emits the static lock glyph as a sibling <g class="wm-lock-icon">
    // in the same parent (the SVG root), NOT inside the edge group. After
    // commission is granted, find any glyph at this edge's midpoint and remove
    // it. While locked, leave the renderer's glyph in place untouched.
    if(stillLocked) return;
    // Each edge's lock glyph was emitted immediately after the edge in the
    // renderer's output, so the next sibling in DOM order is the matching
    // glyph (when one exists). This is brittle but matches the renderer's
    // emission contract; if the renderer's order changes, this needs an update.
    const next = el.nextElementSibling;
    if(next && next.classList && next.classList.contains('wm-lock-icon')) next.remove();
  });
}

function wmShowInfo(el){
  const panel=document.getElementById('wm-panel-body');if(!panel)return;
  const d=el.dataset;
  const name=d.name||'';
  const known=!name||WM.discovered[name];
  const isFT=d.fasttravel==='true';
  const isDanger=d.danger==='true';
  const pois=d.pois?d.pois.split('·').map(s=>s.trim()).filter(Boolean):[];
  const duns=d.dungeons?d.dungeons.split('·').map(s=>s.trim()).filter(Boolean):[];
  let h=`<div class="wm-info-name">${name||'Unknown Road'}</div>`;
  if(d.type)h+=`<div class="wm-info-type">${d.type}</div>`;
  if(!known){
    h+=`<div class="wm-info-desc">This location has not yet been explored. Travel here to reveal its secrets.</div>`;
    h+=`<div class="wm-badge wm-badge-unk">◎ UNDISCOVERED</div>`;
  }else{
    if(d.desc)h+=`<div class="wm-info-desc">${d.desc}</div>`;
    if(d.act)h+=`<div class="wm-info-act">◆ ${d.act}</div>`;
    if(pois.length){h+=`<div class="wm-info-section"><div class="wm-info-stitle">Points of Interest</div>`;h+=pois.map(p=>`<div class="wm-info-item"><span class="wm-ii">◈</span>${p}</div>`).join('');h+=`</div>`;}
    if(duns.length){h+=`<div class="wm-info-section"><div class="wm-info-stitle">Dungeons Nearby</div>`;h+=duns.map(du=>`<div class="wm-info-item"><span class="wm-ii">☠</span>${du}</div>`).join('');h+=`</div>`;}
    if(isFT)h+=`<div class="wm-badge wm-badge-ft">◈ FAST TRAVEL DESTINATION</div>`;
    if(isDanger)h+=`<div class="wm-badge wm-badge-danger">⚠ DANGEROUS ZONE</div>`;
    // Travel Here button: only render on nodes we can actually reach (real zones, known,
    // not the current zone). For other fast-travel-tagged nodes, show an explanatory line.
    if(name){
      const zoneId=WM_NODE_TO_ZONE[name];
      if(zoneId && zoneId!==activeZoneId){
        h+=`<button class="wm-travel-btn" onclick="fastTravelTo('${name.replace(/'/g,"\\'")}')">✦ Travel Here</button>`;
      } else if(zoneId && zoneId===activeZoneId){
        h+=`<div class="wm-travel-note">You are here.</div>`;
      } else if(isFT){
        h+=`<div class="wm-travel-note">Not yet reachable — future act.</div>`;
      }
    }
  }
  panel.innerHTML=h;
}

function wmWirePan(){
  const pane=document.getElementById('wm-map-pane');if(!pane)return;
  pane.addEventListener('mousedown',e=>{
    if(e.button!==0)return;
    WM.dragging=true;WM.dragStartX=e.clientX;WM.dragStartY=e.clientY;
    WM.dragOX=WM.ox;WM.dragOY=WM.oy;e.preventDefault();
  });
  window.addEventListener('mousemove',e=>{
    if(!WM.dragging)return;
    WM.ox=WM.dragOX+(e.clientX-WM.dragStartX);
    WM.oy=WM.dragOY+(e.clientY-WM.dragStartY);
    wmApplyTransform();
  });
  window.addEventListener('mouseup',()=>{WM.dragging=false;});
}

function wmWireScroll(){
  const pane=document.getElementById('wm-map-pane');if(!pane)return;
  pane.addEventListener('wheel',e=>{
    e.preventDefault();
    const delta=e.deltaY<0?1:-1;
    const before=WM.scale;
    WM.scale=Math.max(WM.minScale,Math.min(WM.maxScale,WM.scale+delta*0.12));
    const rect=pane.getBoundingClientRect();
    const mx=e.clientX-rect.left,my=e.clientY-rect.top;
    const ratio=WM.scale/before;
    WM.ox=mx-ratio*(mx-WM.ox);WM.oy=my-ratio*(my-WM.oy);
    wmApplyTransform();
  },{passive:false});
}

function wmApplyTransform(){
  const wrap=document.getElementById('wm-svg-wrap');
  if(wrap)wrap.style.transform=`translate(${WM.ox}px,${WM.oy}px) scale(${WM.scale})`;
}

function wmZoom(dir){
  const pane=document.getElementById('wm-map-pane');if(!pane)return;
  const before=WM.scale;
  WM.scale=Math.max(WM.minScale,Math.min(WM.maxScale,WM.scale+dir*0.18));
  const rect=pane.getBoundingClientRect();
  const cx=rect.width/2,cy=rect.height/2,ratio=WM.scale/before;
  WM.ox=cx-ratio*(cx-WM.ox);WM.oy=cy-ratio*(cy-WM.oy);
  wmApplyTransform();
}

function wmResetView(){
  const pane=document.getElementById('wm-map-pane');if(!pane)return;
  const rect=pane.getBoundingClientRect();
  WM.scale=0.58;
  // v61ec: center on the current zone's coordinate (was hardcoded to
  // (280, 420) — the old map's Ashenmoor area, which is empty space
  // on the new layout). Falls back to the new map's Ashenmoor position
  // (450, 660) if the current zone has no coord.
  const curName=WM.currentNodeName||'Ashenmoor';
  const curCoord=WM_COORDS[curName]||{cx:450,cy:660};
  WM.ox=rect.width*0.5-curCoord.cx*WM.scale;
  WM.oy=rect.height*0.5-curCoord.cy*WM.scale;
  wmApplyTransform();
}

// Call this from zone transition code to update fog of war
// e.g. at the end of enterZone() or goToZone():  wmDiscoverZone(activeZoneId);
function wmDiscoverZone(zoneId){
  // v61b7: discover only the zone the player has actually entered. Used to
  // also auto-reveal adjacent settlements (entering forest revealed
  // Hearthwick, Thorngate, La Porte Grise; entering hearthwick revealed
  // Ashenmoor, etc.) which leaked the map ahead of the player. Now each
  // zone reveals only itself on entry; the adjacent gates are visible
  // through the fog as edge labels but their destination nodes stay
  // shrouded until the player walks there.
  // Special-case: Ashenmoor (overworld) does NOT discover until the
  // player has finished the tutorial crypt and emerged onto the south
  // road. Without this, Ashenmoor would be visible the moment the
  // character creator finishes (because the dungeon is technically a
  // sub-zone of overworld and zone-discovery fires on entry). The
  // worldState.tutorialDone flag flips in goToOW's tutorial-exit
  // branch — that's the moment Ashenmoor first appears on the map.
  const name=WM.zoneToNode[zoneId];
  if(name){
    if(zoneId==='overworld' && !worldState.tutorialDone){
      // Tutorial not yet complete — defer discovery.
    } else {
      WM.discovered[name]=true;
    }
  }
  // If map is currently open, refresh fog
  if(WM.initialized&&hubOpen){wmSyncZone();}
}
