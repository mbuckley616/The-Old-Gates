// ═══ SCALE: ONE UNIT IS ONE METRE, AND PEOPLE ARE THE MEASURE (v80 S880, card F2a) ═════════════════════════════════════
// docs/design/visual-foundation.md §1: every builder takes its sizes for people, doors, storeys, stairs, furniture and rooms
// from this one table, in metres; a builder that sizes one of these things reads it here instead of writing its own number.
// The world's distances and speeds do not change (a jog stays 3.83 m/s). The gameplay ranges in old units (reach, sight,
// sneak, the platforming page's heights) are card F2b's, not this table's yet.
const SCALE={
  // the people's body (32-people.js) at genome height 1: the top of the head 1.233 over the feet at its own root scale
  // (PW.BODY), measured on the skinned mesh in its idle pose in Session 880 (the head bone at 1.001). personScale() turns
  // that into a stature in metres.
  PERSON_MODEL:1.233,
  // statures by people, a man's and a woman's middle (Michael's A on #276, 13 Oct 2026; the ranges are the genome's ±3.5%):
  // Gatelanders 1.72–1.84 and 1.60–1.72, Markmen 1.84–1.98 and 1.72–1.84, Aurennais 1.74–1.86 and 1.62–1.74,
  // the Old Blood 1.56–1.66 and 1.46–1.56
  PEOPLE:{gatelander:{m:1.78,f:1.66},markman:{m:1.91,f:1.78},aurennais:{m:1.80,f:1.68},oldblood:{m:1.61,f:1.51}},
  PERSON:1.8,                       // the figure the ratios are measured against, and the inspector's yardstick
  EYE_STAND:1.65,EYE_CROUCH:1.1,   // the player's eye
  EYE_SWIM:.92,                    // the eye over a swimmer's floor (the world's SWIM_Y, 0.35 under the sea): the old eye, kept so
                                   // the surface sits where it did until F2b sets the water's depths in metres
  TP_DIST:2.75,TP_MIN:1.3,TP_MAX:4.6,TP_SIDE:.5, // the third-person camera behind and beside the shoulder: 1.9, 0.9 to 3.2 and 0.34 at the old size, ×1.44
  DOOR_H:2.05,DOOR_W:1.0,          // a house door's leaf (2.0 to 2.2 high, 0.95 to 1.2 wide)
  DOOR_BIG_H:2.6,DOOR_BIG_W:1.5,   // a church's or a keep's door
  GATE_H:4.5,                      // a town gate's opening (4 to 5)
  STOREY:2.7,STOREY_MIN:2.6,STOREY_MAX:3.0, // floor to floor (STOREY the upper storey of a house); a cottage's eaves 2.4 to 3.0
  STAIR_RISE:.18,STAIR_TREAD:.28,
  TABLE:.75,SEAT:.45,BED:.5,COUNTER:.95,HEARTH:1.2,SHELF:1.8,
  // rooms, across: a cottage's 4 to 6, an inn's hall 10 to 14, a church's nave 8 to 12 wide
  ROOM_COTTAGE:[4,6],ROOM_INN:[10,14],ROOM_NAVE:[8,12],
  CEIL:2.6,CEIL_STONE:2.9,         // a room's ceiling, floor to joists
  JOG:3.83,SPRINT:4.7
};
// a person's root scale: their people's stature over the model's height, with the genome's own variation on top
// (g.height is about 1, 0.95 for a woman, 0.72 for a child; a foe's kind sets its own). A woman's middle is her people's,
// not 0.95 of a man's.
function personScale(g){
  const P=SCALE.PEOPLE[g&&g.people]||SCALE.PEOPLE.gatelander;
  return (g&&g.female?P.f/(.95*P.m):1)*P.m/SCALE.PERSON_MODEL;
}
