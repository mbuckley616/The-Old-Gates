# Ranged by job

*The systems designer, 28 Nov 2026. A proposal for backlog L11's* Ranged by job *(OG-129). Nothing here is a spec until `decisions.md` carries a `Michael:` line under it.*

## The problem in Michael's words

Backlog L11, from the third round of concept art (Michael's review, 12 Oct 2026). The struck parts are built:

> **Ranged by job** (`fireArrow` in `62-actions.js`, arrows in `14-items.js`; OG-129): a shortbow for moving, ~~a longbow slow and far, a war bow~~, … ~~the crossbow~~, … shot stages as frames, arrow drop from 25 to 200 m, heads named by purpose (hunting, broadhead, bodkin, fire, ice), impacts that differ by surface, fletching from wood, feathers and heads (survival B), fire arrows to light braziers and burn webs, a shot that cuts a rope, a thrown noise to lure a guard. Thrown weapons wait (6 B); no powder.

The bows are built. What is left is the arrow: what it is for, and what it can do besides wound.

## Today

`fireArrow` rolls the bow's `atk` and the arrow's `arrowDmg`, then multiplies by the draw (`bowNow().mult`: 1.40 for the bow, 1.70 for the longbow, 2.00 for the war bow), the Bow skill (`skillMult('bow')`) and Finesse. The arrow takes the arrow's `wType` if it has one, otherwise the bow's `'pierce'`. It flies under `ARROW_GRAVITY` 4 and the wind (`arrowWindAcc`) for up to 8 s (#1748 A), so the 25–200 m drop the note asks for already exists. At the hit, the loops read `e.resist[wType]` and take off half the foe's `def`. Every arrow in the game is one kind with a different metal: the Iron Arrow (`ARROW_IRON`, 3–6), and `arrowOf(t)` at the bench fletches Bronze 2–5 up to Obsidian 8–17 from a log, 10 feathers and an ingot. None sets a `wType`, so the canon's broadhead (`lore_canon.md`, *Weapon damage typing*) has never been made. A stuck arrow lasts 30 s and cannot be picked up. Fire in the gates is Caor's alone: `touchThing` calls the named actions `lightBrazier`, `burnWeb` and `fireBrush`. A foe has two states, unaware (it wanders or scans) and alert (it chases). `canSeePlayer` and `hearingRadius` find *you*. Nothing makes a foe go and look at a spot. The canon rules out backstab for arrows (v64): *bow build = approach, draw, release*. This page keeps that rule.

## Directions

### A. The quiver by job

**The loop.** You choose a head before the fight, the way you choose a weapon against Skeletons today. You can carry three kinds and change between them with one key. A wolf pack takes hunting heads, a bandit in mail takes bodkins, a Shieldbearer's line takes broadheads to bleed it from the flank. If you bring only iron, you can still win, but more slowly.

**The rules.** Each head is an `ammo` item, as now, priced and weighted like the Iron Arrow unless the table says otherwise. The multiplier applies to the arrow's whole roll.

| Head | Type | Against | Rider | Made | Why |
|---|---|---|---|---|---|
| Iron (as now, and its metals) | pierce | ×1 | — | as now | the baseline |
| Hunting | pierce | ×1.25 on a beast with `def` 0–1; ×0.6 on `def` 2+ | — | a log and 10 feathers, 10 arrows, no ingot | cheap and early; useless on armour, so the first foes in mail teach the quiver |
| Broadhead | slash | ×0.8 on `def` 3+ | bleed 1.5 a second for 6 s on flesh (not undead, constructs, slimes or wisps), not stacked | 8 a log, 10 feathers and an ingot of any metal | the canon's slash arrow; 9 bleed is one more iron arrow's worth, landed while you reposition |
| Bodkin | pierce | ignores `def` (half is taken off today); ×0.85 on a beast with `def` 0–1 | — | 8 from a Steel ingot or better | the answer to the plate the gates' foes wear from tier 5 up |
| Fire | the bow's | ×0.7 | Caor's rider: burns 3 a second for 4 s (`RIDERS.caor`) | 5 arrows of any kind and 1 Pitch at a fire; the arrow is spent on landing | wounds less up front and burns more overall; Tine 75's *Long burn* does not apply, since that is the word's perk |
| Ice | the bow's | ×0.7 | Sioc's rider: slows 30% for 3 s (`RIDERS.sioc`) | sold in the Mark at its goods shops (an island's make, ×0.85 there, ×1.2 abroad); fletched at a bench only by someone who knows Sioc | the Mark's arrow, so place matters; the slow is the word's own number, so Uisce 75's ×1.5 stays the mage's |

The quiver key (proposed: **B** while a bow or crossbow is in hand, which no binding uses today; Q is the roll. It cycles the ammo kinds in the bag, 0.4 s, no shot while it turns) swaps `EQ.ammo`. A crossbow's bolts take the same five heads.

**What it touches.** `ARROW_IRON` and `arrowOf` in `22-dialogue.js` and `50-travel.js` gain `head`. The two arrow-hit branches (`42-zone-enemies.js`, `90-main.js`) read the head's multiplier and call `riderHit` with the rider. A bleed is a third rider entry (`dps`, the burn's shape, on its own key). The bench page in `50-travel.js` lists the heads. Fire arrows go on the fire page. The quiver key goes in `10-player.js`. Only items change, and they are the character's (`BAG`, `EQ`), so the save needs no new key. The look builder draws a head per kind on the arrow mesh and the stuck arrow.

**Cost.** Three systems sessions (the heads and the hit; making them; the quiver key and the Mark's stock) and one look session (five heads).

### B. A, plus the shot in the world (recommended)

**The loop.** The bow becomes a tool outside a fight. From across the chasm you light a cold brazier; you burn the web over a side room's mouth without walking in; in a fort's great hall you cut the chandelier's rope over the guards at the table; in a bandit camp you put an arrow into the timber behind the sentry, he goes to look, and you walk past.

**The rules.**

| Rule | Number | Why |
|---|---|---|
| A fire arrow on a gate's thing | lights a brazier, burns a web, fires a lair's brush, through the same named actions (`lightBrazier`, `burnWeb`, `fireBrush`) | the word's *touch* reaches 2 m and the arrow reaches the bow's range, so Caor stays the way to do it without carrying anything |
| What an arrow never does | open a seal, freeze a pool, raise a bridge | the seals are the schools' (spells-as-keys B); the bow helps magic and does not replace it |
| The chandelier's rope | a fort's Great Hall and Lord's Chamber chandeliers (`56-dungeon-build.js` hangs 1–2 a room); one arrow of any head into the rope, within 1.2 m of the hook | Thief's and Dishonored's oldest trick, on a prop the forts already hang |
| Its fall | 30 damage and a 1.5 s stagger to every foe within 2 m of the spot below, the room's light goes out with it; once a chandelier, kept for the visit as a lit brazier is | 30 kills a Wolf or a Skeleton outright and leaves a Hollowed (40) standing; the stagger is the posture break's, so the fight that follows starts in your favour |
| The noise | an arrow that lands in wood or stone within 10 m of an unaware foe that cannot see you; 5 m on earth or grass; none in snow, mud or water; ×0.5 in rain (`WX`) | the surfaces `impactAt` already names; rain masking sound is OG-138's own line |
| The look | the foe turns to the spot, walks to it at 0.6× pace, scans for 6 s, then goes home; it does not call its pack (`alertPack`) | Skyrim's distraction, with a fixed time so it can be planned; `canSeePlayer` still works the whole time, so a careless step behind it still alerts it |
| How often | one foe a noise (the nearest); a foe that has looked once ignores noises for 30 s | so one arrow pulls one sentry, not the whole camp |

**What it touches.** `tickArrowMotion`'s *stuck-geom* case raises the noise and tests the gate things and the ropes. A new foe state, `e._lookAt {x, z, until}`, sits between unaware and alert in `tickZoneEnemies` and in the dungeon's tick in `90-main.js`. Its times read `playClockS`, never frames (the co-op rule). The chandeliers get a rope point and `dropChandelier(t)`, the named action. Nothing is saved past the visit. The foe's look is aimed at a spot, never at you, so `targetOf(e)` is untouched.

**What it displaces.** Caor's *touch* loses its monopoly on gate fire, and that is the trade. The cost of a fire arrow (a pitch and a stop at a fire) keeps the word the cheaper way for a mage.

**Cost.** A's four sessions, plus two systems sessions (fire on things and the rope; the noise and the look), plus a session of the look builder's for the rope and the fall. Seven in all.

### C. B, plus the arrow's economy and the foes' heads

**The loop.** After a fight you pull your arrows out of the bodies and the timber, as in Skyrim and Dragonwilds; the bandits' archers shoot fire and broadheads too.

**The rules.** A stuck arrow can be taken back (E, within 2 m): one in two from a body, two in three from wood or earth, never a fire arrow, rolled on the foe's stream (`foeRand`) or the spot's hash. An archer foe of tier 3 or more carries one head by its place (enemies-by-place's tiers): fire in the Mark's camps against your wood, broadheads in the Gatelands, bodkins in the gates' forts. Its arrow uses the same rider on you, so your Guard's *Deflect* and your armour's type now matter against it.

**What it touches.** `STUCK_ARROW_LIFE` 30 s → 120 s; the foes' `ZARROWS` gain a head; a taken arrow needs a key of place and index (the co-op rules).

**Conflicts.** Recovery halves the cost of archery and pushes the bench back. Foes' fire arrows add a burn to *your* bar, which the combat page's difficulty (Dragonwilds, not a Souls-like) has not been tuned for.

**Cost.** B's seven, plus two systems sessions and one bodies session (foes nock and loose by head). Ten.

## Recommendation

B. The quiver alone (A) gives the bow the same choice the swords already have, which is the brief's progression. But the backlog's last three lines are what make archery a way of playing rather than a weapon: fire from range, a rope, a noise. They also give the stealth archer a real loop without breaking the canon's no-backstab rule. You still do not one-shot from the dark, but you can choose who comes to you and when. Every piece of B rides something that exists: Caor's named actions, the forts' chandeliers, the surfaces `impactAt` knows, and the weather. So it is two sessions more than A, not a new system. C's recovery is a convenience whose cost the bench pays. Its foes' heads belong with *Foes and bosses* (OG-130's archers who hit and fall back), and can be raised there.

## What must be true first

Nothing blocks A. B's gate fire wants spells-as-keys B's things (built, S1675 and S1708). Its rope wants the forts' chandeliers on the new look, which are the look builder's (F5's fort cells, built). The noise wants `impactAt`'s surfaces in the open world, which are owed for the world's solids (L11 *Melee, read clearly*). Until then the open world counts every landing as earth (5 m).

## Not asked

- **The shortbow for moving** and **shot stages as frames.** The first is a bow kind (`BOW_KINDS`, one row, a decision of its own on whether you can draw at a run). The second is the bodies builder's poses. Neither needs a system.
- **A sneak shot multiplier.** The canon rules it out (v64). The noise is this page's answer to the stealth archer.
- **Silver arrows.** The canon names them, but the game has no silver and Solas's *Dawn* answers the undead; a found or quest arrow, if the quest writer wants one.
- **Thrown stones and pots as the noise.** Thrown weapons wait on 6 B. The fire pot stays the ship's (naval combat B).
- **Arrows that pin, pull or climb** (rope arrows). The platforming page (B) already rules out rope climbs.
