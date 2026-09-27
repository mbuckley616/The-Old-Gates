# Proposals (the critic)
Unapproved. Nothing here is in the backlog until Michael promotes it; each is his to take, change or bin.

## A watch that walks at night, and guards who follow (2026-09-27)
**Why.** In play, Dunmore's street is empty from 21h to dawn: two guards somewhere off the centre and no one else, so the witnesses of Session 156 and the halt of Session 157 never meet a night burglar (868 gold in a night, unseen; critic 2026-09-27). The canon already asks for the other half: §12, *favour ≤ −2: guards follow*, which the build doesn't do.
**What.** (1) At night the town's guards walk a beat that passes the shop doors — a loop through the lots of type weapon/armor/potion/misc, a lantern in the left hand (the torch the S153 guard already carries), at the guard's pace; a town of prosperity ≥ 60 gets a third guard at night. (2) With favour ≤ −2 in a town, the nearest guard on duty trails you at six to eight units while you are inside its pad, and stops if you leave or go indoors. Witnessing is unchanged: the guard is simply there to see.
**Cost.** One Opus session: the guard schedule in `scheduleFor`/`tickNPCs` (a beat built from the settlement's house list), a follow state beside `_scared`, a test in the style of `crime2`. No story or quest text touched.
**Risk / displaces.** More guards visible at night is more skinned meshes in the shadow pass (H.6's level-of-detail is still owed). A follower that snags on the town's solids could read as a glitch; the existing `npcStep` gives up after 40 stuck frames.
**Recommendation.** Do it before tuning any of the crime numbers: until someone can see at night, the balance questions S155–S158 left under *Needs eyes* can't be answered by play.
