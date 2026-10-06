import { boot } from './lib/game.mjs';
// PROTOTYPE plans for a DECISION on the forts' interiors (Michael, 5 Oct: "still a little bland … straight stairs, not spiral … more varied layouts"). Not a test.
const OUT = process.env.SHOT_DIR || 'docs/prototypes';
// proposed shapes, drawn by hand: # wall, . floor, E the way in, D a door, P a pillar, v a straight flight going down (the arrow is the way down),
// ^ a straight flight up to a floor above, ~ the level below seen through a gallery's rail, o a cell's bars
const A = `
####################################
#######...........##################
#######...........##################
#######..P..P..P..########.....#####
#######...........D.......D....#####
#######..P..P..P..########.....#####
#######...........##########.#######
#######.....v.....##########.#######
#####.......v......#######.....#####
#####..###..v..###..######.....#####
#####..###..v..###..D......D...#####
#####..###..v..###..######.....#####
#####...............#######.########
#########D######D##########.########
######......##......#######.########
######......##......####.......#####
######......##......####.......#####
###########....#########.......#####
###########....#######################
###########.E..#####################
####################################`;
const B = `
####################################
###.....D....D....D....D......######
###.....#....#....#....#......######
###.....#....#....#....#......######
###.....#....#....#....#......######
######D######D####D####D#....v######
#.............................v#####
#.............................v#####
######D######D####D####D#.....v#####
###.....#....#....#....#......v#####
###.....#....#....#....#......######
###.....#....#....#....#......######
###.....D....D....D....D......######
#.##################################
#.##################################
#.##################################
#E##################################`;
const C = `
####################################
#########..........#################
######.....######.....##############
####....####....####....############
###...###..........###...###########
##..^##..............##.v.##########
##...#................#...##########
##...#................#...##########
##...#....~~~~~~~~....#...##########
##...#....~~~~~~~~....#...##########
##...D....~~~~~~~~....D...##########
##...#....~~~~~~~~....#...##########
##...#................#...##########
##...#................#...##########
##.v.##..............##.^.##########
###...###..........###...###########
####....####.D..####....############
######.....######.....##############
#########...E....###################
####################################`;
const g = await boot(); const { page } = g;
await g.intoWorld();
const url = await page.evaluate(({ A, B, C }) => {
  const cv = document.createElement('canvas'); const CW = 1500, CH = 1020; cv.width = CW; cv.height = CH; const x = cv.getContext('2d');
  x.fillStyle = '#efe4c8'; x.fillRect(0, 0, CW, CH); x.font = 'bold 22px Georgia'; x.fillStyle = '#3a2a18';
  const drawMap = (map, ox, oy, cs, title, sub) => { const H = map.length, W = map[0].length;
    x.fillStyle = '#3a2a18'; x.font = 'bold 20px Georgia'; x.fillText(title, ox, oy - 26); x.font = 'italic 14px Georgia'; x.fillText(sub, ox, oy - 8);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) { const v = map[r][c]; let col = '#3b342c';
      if (v === '.' || v === 1 || v === 7) col = '#d8ccb0'; if (v === 6) col = '#e2c890'; if (v === 'E' || v === 2) col = '#6aa84f'; if (v === 'D' || v === 4 || v === 5) col = '#8a5a2a'; if (v === 'P') col = '#7a7268';
      if (v === 'v' || v === 3) col = '#c0502a'; if (v === '^') col = '#2a70c0'; if (v === '~') col = '#9a8e78';
      x.fillStyle = col; x.fillRect(ox + c * cs, oy + r * cs, cs - (col === '#3b342c' ? 0 : .6), cs - (col === '#3b342c' ? 0 : .6)); } };
  // today's three, from the game's own generators, medium, the canonical seeds
  const today = [['fort_tee', 7100, 'Today: the tee (The Old Garrison)'], ['fort_linear', 7101, 'Today: the linear (The Last Post)'], ['fort_courtyard', 7102, 'Today: the courtyard']];
  today.forEach(([k, seed, t], i) => { const gen = addUpperFloor(FORT_INTERIORS[k]('medium', seed), seed); const m = gen.map; let r0 = 1e9, r1 = -1, c0 = 1e9, c1 = -1; m.forEach((row, r) => row.forEach((v, c) => { if (v) { r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, c); c1 = Math.max(c1, c); } }));
    const sub = m.slice(Math.max(0, r0 - 1), r1 + 2).map(row => row.slice(Math.max(0, c0 - 1), c1 + 2)); const cs = Math.min(440 / sub[0].length, 400 / sub.length);
    drawMap(sub, 30 + i * 490, 70, cs, t, `${k}: the treasure rooms gold, the spiral down red`); });
  const P = [[A, 'A. The hall and the undercroft', 'a pillared great hall, a straight flight down its middle'], [B, 'B. Barracks and the gaol', 'bunk rooms off one long room, the stair down to the cells'], [C, 'C. The ring and its towers', 'a ring of passage round a sunken yard, a flight in each tower']];
  P.forEach(([s, t, sub], i) => { const m = s.trim().split('\n'); drawMap(m, 30 + i * 490, 590, 12.5, t, sub); });
  x.font = '13px Georgia'; x.fillStyle = '#3a2a18'; const L = [['#6aa84f', 'the way in'], ['#8a5a2a', 'door'], ['#c0502a', 'stair down (straight; today: the spiral)'], ['#2a70c0', 'stair up'], ['#7a7268', 'pillar'], ['#9a8e78', 'the level below, seen over a rail']];
  L.forEach(([c, t], i) => { x.fillStyle = c; x.fillRect(30 + i * 240, CH - 30, 14, 14); x.fillStyle = '#3a2a18'; x.fillText(t, 50 + i * 240, CH - 19); });
  return cv.toDataURL(); }, { A, B, C });
const fs = await import('fs'); fs.writeFileSync(`${OUT}/fort-layouts.png`, Buffer.from(url.split(',')[1], 'base64')); console.log('errs', JSON.stringify(g.errs)); await g.close();
