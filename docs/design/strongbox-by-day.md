# The strongbox by day — what keeps the keeper's box from being free money

A proposal from the systems designer, 28 Oct 2026, for backlog J's *The strongbox out of the keeper's sight*. Nothing here is a
spec until `docs/decisions.md` carries a `Michael:` line under it.

## The problem in Michael's words
Backlog J, routed by the producer on 21 Oct from the systems builder's Session 1240 (1244 on main): "Michael's B on #516 expected
the keeper at the counter to see through the open back-room door to the box. At 8.7 m the box is in reach (7.6–7.9 m) in all seven
of Dunmore's kit shops, but off the doorway's line behind the partition, so the counter never sees it; only the doorway is watched.
For the designer: either the kit shops' layout puts the box on the doorway's line (the look builder, `js/38-kit.js`), or #516's C
(a keeper who looks into the back room now and then). A DECISION for Michael before either is built."

His B on #516 said what he wanted: a strongbox emptied by day should carry a risk. The build does not give it one.

## Today
Since Session 1258 every shop deep enough for a keeper's room (13 kit shops in Portclare and Dunmore, about 20 across four towns)
has the room at the north end, behind the counter. You come in at the street door, the counter and the keeper face you, and the
room's door is at one end of the partition behind them; the strongbox stands against the room's far side wall, 0.85 m in from the
partition, off the doorway's line. `witnessOf` (`86-world-crime.js`) sees indoors within `WIT_IN`, 8.7 m, in a 120° cone the way a
person faces, along a clear `intSightLine`, and hears within two metres whichever way they face. The keeper ambles between the
counter and the shop floor (z 5.5 to 11.1 m, the partition at 4.6) and faces the shop, so the room's doorway is behind them most of
the time and the box always is: a full-height wall stands between the counter and the box (Session 1312 measured it, which is why
`theft` now stages its keeper inside the room). The box is a lock of three or four pins (`lockPins`, four where prosperity is 60 or
more), worked in a live world since Session 327; a pin let go early or late snaps the pick (`lpBreak`). Opened, it holds
`boxCoins`: 10 + 50 a 100 prosperity, ×1.2 at an armourer or smith, ×0.8 at an apothecary, ±20% by the day's seeded roll, plus one
thing from the stock, and it refills after five days (`boxState`). So by day the box is unseen money: about 40 gold and an item in
a Dunmore shop, some 500 gold every five days from the two towns' thirteen, with no risk beyond being seen at the doorway.

Moving the box onto the doorway's line does not fix this. The keeper faces the shop, so a line from the counter through the door to
the box runs behind their back; Session 1258 took the box off that line on purpose after `backroomdoor` counted 35–38 shop-floor
spots that saw it. The risk has to come from the keeper turning round, not from the furniture.

## Directions

### A. The back room is the thief's
Keep the build. By day a shop's box is taken unseen if you are not caught stepping through the open door; shut it behind you and
nothing can see you. At night the shop is empty and the door's lock is the risk, the watch on the street. The loop is: walk in, wait
for the keeper's back, go through, pick, leave. It costs nothing and touches nothing. What it gives up is Michael's B on #516: a
day theft is easier than a night one, and 500 gold a week of no-risk money is what the brief's *Not this* calls a system that
reduces to buy more. No sessions.

### B. The keeper looks in on a schedule (#516's C)
Twice in each open hour the keeper leaves the counter, walks to the room's door, opens it if it is shut, steps 1.2 m in and turns to
face the box for eight game minutes (eight seconds at the clock's one minute a second), then goes back and shuts the door if they
found it shut. The two minutes come from the house's own seeded stream, `<house id>:<day>:<hour>`, at least 15 minutes apart, so
every player in a shared world sees the same keeper at the same time and nothing rides on `Math.random` (the co-op rules). While
they look in, `witnessOf` runs from where they stand, so the box spot is in reach (about 6.5 m across the room) and in the cone.
The cue is the door's latch and the keeper's footsteps on the boards, one and a half seconds before the door swings: you hear it
inside the room, which is the only warning you get with the door shut.

The loop is Thief's: watch the keeper go back, count, pick. A four-pin box takes 5 to 15 seconds for a fair hand, so a thief who
starts just after a look has 15 to 45 seconds of quiet and rarely needs it all; one who starts blind is caught about one time in
three. Skill matters less than patience: Locks shortens the job, but the schedule does the work. One ordinary systems session (the
look in `86-world-crime.js` as one named action, `keeperLooks(house)`, the walk through `intAmbleStep`, the door through
`intDoorAt`'s open and shut), and the `witness` suite extended: a keeper's two looks an hour by the seed, the box spot seen during
one and not outside it, the latch heard 1.5 s before.

### C. The keeper hears the work
The lock itself is the risk. A snapped pick is a sound: heard within 6 m through one wall, 9 m in the open; the click of a pin
setting is heard only within the street's two metres, as now. Quiet work (Locks 75) halves both, as it already halves the distance a
pick is seen from. The keeper at the counter is 4.8 to 5.3 m from the box through the partition, so a snap brings them; a keeper
ambling at the shop's far end (8 m off and more) does not hear it. Heard, the keeper does what B's keeper does once: four seconds to
the door (latch and footsteps at once), in, eight seconds facing the box, back. No roll at all: the outcome follows from your own
hands, the room and where the keeper stood when the pick went.

The loop: choose your moment (the keeper at the street end of the shop), pick cleanly, and if a pick goes, decide in four seconds
whether to finish the lock or close it and step out of the cone (the room's corner by the door is behind a keeper who walks in
facing the box). A novice with three pins of a four-pin box set and a snap has to run; a Locks 50 hand keeps its pins through a
snap (Sure hand) and can finish; a Locks 75 hand is heard only from 3 m and can work while the keeper serves. That is feeling 2 put
to work in a shop: the box is safe to the skilled and dangerous to the clumsy, and a night break-in stays the other choice, with
the watch to face instead of the keeper. One ordinary systems session: `lpBreak` (`68-dungeon-misc.js`) calls one hook when the lock
is live and indoors, `heardThrough(house, x, z, r)` in `86-world-crime.js` counts the walls on the line (one wall: the 6 m; two:
nothing), the keeper's walk as in B; the `witness` suite extended with a staged snap at the counter's distance (heard, the keeper at
the door in four seconds, the box spot seen), the same snap with the keeper 8 m off (unheard), and Quiet work at 4 m (unheard).

Neither B nor C adds a `worldState` key: the keeper's look is the room's live state and starts fresh on entering. Nothing new goes
in the save, `SS_CHAR_WS` or the S242 list. Both reach your position through `witnessOf` as today, so the later `targetOf` pass
covers them with the rest of the crime system.

## Recommendation
**C, the keeper hears the work.** It answers #516's B with the lock Michael already plays rather than a timer to wait out, and it
makes Locks and its two perks matter where they are used most; B rewards waiting, and a schedule a player learns in one visit soon
stops being a risk. C keeps the night robbery as a real alternative (no keeper, but the watch and a door lock to pick in the street),
which is the decision the brief asks for. It has no roll to seed, and it costs the same one session. B can be added later on top of
it if day thefts still prove too easy in play.

## What must be true first
Nothing outstanding. The keeper's room behind the counter (Session 1258), the 8.7 m reach (Session 1244), the live town lock
(Session 327) and the Locks perks (Session 973) are all built. The kit shops' layout is not changed by any direction here.

## Not asked
- **Moving the box onto the doorway's line.** The keeper faces the shop, so it would still be behind them; Session 1258 moved it off
  the line for the shop floor's sake.
- **A keeper who finds the box empty later and calls a thief unnamed** (Morrowind's bounty without a witness is not in its rules
  either). That is the crime system's investigation, a larger piece, and Michael has not asked for it.
- **Homes' chests and the barber's box.** A home's resident sleeps and hears within two metres (Session 739), and the barber's box
  stands in his cone (Session 590); both already carry their risk.
- **The box's takings.** Michael's A on #68 set them; this page leaves them alone.
