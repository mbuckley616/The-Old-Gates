# Combat

*The systems designer, 28 Sep 2026. A proposal, not a spec: nothing here is built until docs/decisions.md carries a `Michael:` line under it.*

## The problem in Michael's words
> "Less click-and-swing, more timing — a dodge, a parry with weight, punishing counters when done right; Elden Ring's shape at Dragonwilds' difficulty. Movement and combat are stiff now; fluid is the goal. A total reimagining is on the table." (backlog J)

The brief's third feeling is the test: *fluid movement and weighty combat. Timing, dodge, parry, counters.* Its *Not this* is the limit: not a punishing Souls-like, and death costs a reload.

## Today
A click swings (`attack`, `attackZoneEnemies`); the hit lands at the impact frame (`_resolveDungeonStrike`, `_resolveZoneStrike`) inside 2.2 units and a 117° cone. Holding past .5 s makes a power attack (×1.8, a lunge if W is held). Every melee enemy has a hidden posture (`initPosture`); hits drain it, and at zero it staggers 1.5 s and takes ×1.5. A bash breaks posture without damage. An enemy attacks when it is inside 1.1 units: it glows red for 0.24–0.55 s (`TELEGRAPH_BY_NAME`) and then hits you if you are still within 1.4 units, whichever way it faces (`tickZoneEnemies` → `executeStrike`). Raise the block within 200 ms + 10 ms a Finesse point of the hit and it is a perfect parry (the enemy stunned 1.2 s, a fifth of the damage as stamina); held longer, it is a block that takes 35–65% off. There is no dodge, no lock-on, and nothing can stagger the player.

Three things make it click-and-swing. The tell is near a human reaction time (about .25 s), so you parry by rhythm, not by reading; and at 3.83 units a second, stepping back during a .3 s tell beats every attack, so backing off is the real dodge. Every enemy has one attack: one fight shows all of it. And nothing commits you: you swing at full run speed, so most fights are swing and walk backward. The parry window has the Might problem too: at Finesse 30 it is half a second.

## Directions

All three keep the damage chain the skills decision set (the weapon's roll × the weapon skill × 1% a Might point; the flat `level × 1.5` in both resolvers goes) and enemies scaled by place, not level. All three make the dodge everyone's, so the Morrowind perks at Acrobatics 50 can be the double jump outright.

### A. Tighten what is there — a dodge, honest tells, a player who can be broken
**The loop.** The same fights, made readable: watch the wind-up, parry, roll or step, punish the opening.
**Rules.**

| Piece | Today | Proposed |
|---|---|---|
| Enemy tell | 0.24–0.55 s, a red glow | 0.45–0.9 s, the body's own wind-up pose; the glow only in the last .15 s |
| Enemy hit | anyone within 1.4 units | an arc: 1.6 units and 90° for most, 2.4 units and 140° for a troll's sweep |
| Dodge | none | a roll on Q (nothing binds it today): 0.45 s, 2.6 units, untouchable from 0.08 to 0.30 s, 18 stamina; heavier than 70% of carry weight, 0.6 s and 1.8 units with 0.16 s untouchable |
| Parry window | 200 ms + 10 ms a Finesse point | 160 ms + 1 ms a Guard skill level (to 260 ms at 100); Finesse out of it |
| Player posture | none | 100 + 2 an armour point; an unblocked hit drains its damage ×1.5, a held block its damage ×1; empty = 0.8 s staggered, open |

**Touches.** `executeStrike` (the arc, the untouchable window, player posture through `applyPostureDamage`, whose comment already expects a player); the enemy ticks (`combatYaw`, frozen at the wind-up, becomes the arc's direction); `TELEGRAPH_BY_NAME` and `telegraphPulse`; the movement block and a roll pose; `lvAct.parries` → Guard. Nothing new in `SS`.
**Conflicts.** None. It leaves every enemy with one attack.
**Cost.** Three Opus sessions: the roll and the arc; the tells as poses across the families built so far; player posture and guard break.

### B. Elden Ring's shape — commitment, move sets, and the opening you earn
**The loop.** Everything in A, plus fights you learn. Each family has two to four attacks to tell apart; your own swings commit you, so you pick your moment. Each family is a small puzzle solved by reading, not numbers, and the reward is an opening you earned: the riposte, the posture break, the finisher.
**Rules, beyond A.**
- *Commitment.* During a swing's wind-up and strike you move at ×0.35 and cannot turn more than 90° a second; only the last third (the recovery) can cancel into a roll or a block. Light attacks chain: three in a row, the third ×1.3 damage and ×1.5 posture, the chain lost if you wait more than .4 s. Drinking a potion takes 0.8 s at walking pace; the choice to heal becomes a timing decision, not a menu.
- *Move sets.* Each family has a light attack (tell .45 s), a heavy one (.9–1.1 s, twice the damage, ×2 player posture, a held block is broken by it but a parry isn't), and one of: a gap-closer, a delayed swing (a pause at the top of the tell, .3 s, to catch the panicked roll), or a two-hit string. The wolf lunges and snaps; the troll sweeps and stamps; the bandit feints. The Faolchú keeps its three phases.
- *Counters.* A perfect parry drains 40% of the enemy's posture and opens a riposte for 0.8 s: the next hit is ×2.5, unblockable, and cannot be interrupted. A broken posture opens a finisher from the front (×3, a pose of its own, 1.2 s in which you are untouchable) as well as today's ×1.5 window. A backstab stays the stealth route.
- *Lock-on.* Tab is taken by the hub, so the middle mouse button toggles it. The camera holds the target in both views, A/D circle it, the roll goes the way you press.
- *Difficulty.* Dragonwilds, not Souls: at the place's own tier a common enemy dies in four to six hits and takes three to five of yours, the tells never go below .45 s, and death is still only a reload.

**Touches.** Everything in A; the two resolvers become one, fed by an attack table (per weapon type and per enemy family: tell, strike, recovery, reach, posture). The shape kit gets three or four attack poses a family in place of Session 130's one shared pose; `tpUpdate` gets the lock. The co-op door: every timing check reads `performance.now()` against the two fighters' state and nothing else, so a host can run it later, and no window is under 150 ms, which survives a friend's 60–100 ms connection.
**Conflicts.** Every weapon, creature and combat test in `tests/` changes numbers. The creature passes (section H) should build their attack poses to this table, so it wants deciding before the next families are built.
**Cost.** Seven sessions. One Fable (the attack table, one resolver for dungeon and world, commitment and the chain). Then six Opus: A's three on the table; the riposte and finisher; lock-on; move sets, two families a session as the creature passes reach them (wolves and bandits first).

### C. Directional — swing and block by the mouse
**The loop.** Mount & Blade's and Kingdom Come's: the mouse's movement at the click picks one of four swings; a block must match the side the blow comes from (a matched block in the last 300 ms is a parry). Fights between people become duels of feints.
**Touches.** Everything in B, plus directional poses for every weapon and armed foe.
**Conflicts.** Wolves, spiders, slimes, trolls and the Faolchú have no side to read, so half the fights fall back to A. Hardest to learn on a laptop trackpad, hardest to keep fair over a friend's connection.
**Cost.** Nine sessions or more, two of them Fable.

## Recommendation
**B**, built so that A comes first. A alone fixes the tells and adds the dodge, but one fight would still show you every enemy. The move sets give the brief's "punishing counters when done right" meaning: the riposte and finisher reward reading a delayed swing. Commitment makes it weighty rather than stiff. Stiffness today is the game not answering you (no dodge, no stagger, one tell); weight is the game holding you to what you chose. Elden Ring works this way (a few readable moves, a roll with a real untouchable window, a player who can be staggered), and Dragonwilds shows the shape survives an easier tuning. C suits a game about duelling people; this one is mostly beasts.

## What must be true first
- **Enemies by place, not by level** (the skills decision's condition). Tells and hits-to-kill can only be tuned against a known tier.
- **The skills sessions**, or at least the weapon skills and Guard, so the parry window and damage read a skill rather than Finesse and Might.
- **The creature passes** (section H) building attack poses to B's table once chosen; the wolf gets its extra moves in the move-set session.
- Player posture wants a thin bar under stamina in the new bottom-left vitals (interface A, answered).

## Not asked
Combat music (backlog C) stays its own item. Mounted combat, dual-wielding and thrown weapons are systems of their own. Magic in combat waits for the magic proposal, next; B's attack table leaves room for a spell as one more row. Weapon trails and hit-stop are the builder's polish. PvP rules wait for the online proposal.
