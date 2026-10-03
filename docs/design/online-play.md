# Online play

*The systems designer, 3 Oct 2026. A proposal, not a spec: nothing here is built until docs/decisions.md carries a `Michael:` line under it.*

## The problem in Michael's words
> "Online play: keep the door open for co-op (a friend joins your world with their character) and perhaps a PvP arena. Architecture consequences now, the feature later." (backlog J)

The brief: "never build something that makes hosting impossible", for "up to three friends". Difficulty is "one tuned experience, the same for everyone in a shared world". So the question is *which co-op is the door kept open for, and what rules keep it open from today?*

## Today
Nothing is networked: no `WebSocket`, no `RTCPeerConnection`. Everything assumes one player. The player is a set of globals in `10-player.js` (`px`, `pz`, `PHP`, `mana`, `stamina`), and the foes read them directly (`px` appears 17 times in `42-zone-enemies.js` and 12 in `62-actions.js`). One save holds both you and the world: `saveGame` writes the character, `BAG`, `QS` and all of `worldState` (the clock, `gameTimeMinutes`, the burned town, favour, every looted flag) as one row in IndexedDB through `ssPut`, and `_applyLoadData` reads it back. `ssExportChar` exports a character's every save, world included. The loop in `90-main.js` stops simulating while any panel is open: the bailout `if(!started||dead||…||invOpen||shopOpen||…)return;` sits *before* `advanceClock`, so opening the inventory stops the sun, the foes and the clock. Some things are already shared-world-ready: the world's terrain and its cells come from one seed (`SEED` in `80-world.js`), and `makeDungeon(size,seed)` builds a dungeon from its own seeded generator. But loot, spawns and foes' choices roll `Math.random` (649 calls), so two machines would roll different chests from the same seed.

## The shape co-op would take (what every direction aims at)
Precedents: Elden Ring's summons, Valheim and Dragonwilds (a host's world, everyone's own character, a world that keeps time while you read a menu).

| Belongs to | What | Lives where |
|---|---|---|
| The host (the world) | terrain seed, `worldState`, `QS` and quest stages, doors, containers' looted flags, foes alive and dead, shops' stock, the clock, weather, ships at quays | the host's save |
| Each player (the character) | attributes, skills and perks, `BAG`, `EQ`, gold, known words, their journal | the player's own save, carried in and out |
| Nobody (each machine's own) | camera, viewmodel, ragdolls, smoke, footprints, music | not sent |

- **The host decides, the guest asks.** A guest moves and swings on their own machine (no wait to feel the hit land), and sends requests: *open door 42*, *take from chest 7*, *my blow hit foe 13 for 18*. The host applies them and sends the result to all.
- **One place at a time.** The host's machine simulates only what is loaded around it, so the party shares a place: a door or a dungeon gate taken by the host takes everyone (Elden Ring's fog wall, in reverse). A guest more than 400 units from the host in the open world (about the loaded radius) sees the edge mist and is drawn back. A guest may enter a building alone; a dungeon, never.
- **The clock** belongs to the host. Panels no longer stop the world while a guest is present. Sleep and waiting need everyone in a bed or at a fire.
- **Death.** Solo, death stays a reload (the brief). With friends, a reload would roll back everyone's evening, so a fallen player is *down* for 30 s and a companion can raise them (hold E, 3 s); unraised, they wake at the last door the party passed with no loss. The host down with no one to raise them is the same. This is the one place co-op changes a rule of the brief, so it is named in the question.
- **Difficulty.** Foes scale by place, not level (skills page, decided). With friends, a foe in the fight gains 50% health and 25% posture per extra player (×1.5, ×2.0, ×2.5), damage unchanged; Rewards: every player present gets the quest's gold and its skill uses; a chest's roll is per player (Diablo's personal loot), so no one grabs.
- **The wire.** WebRTC data channels, browser to browser; GitHub Pages can't relay. Joining needs a signalling step: a room code through a free broker (PeerJS's public one), with copy-paste codes as the fallback. About one connection in seven needs a TURN relay, which costs money to run; behind such a router, the friend can't join without one. At 20 updates a second (a player 40 bytes, a foe 24), a fight with twenty foes is about 12 KB/s to each guest: home broadband carries three.

## Directions

### A. The door kept open: rules now, nothing networked
**The loop.** The game plays as today; what changes is how it's built.
**The rules** (a section in CLAUDE.md, checked by a test where a test can check it):
1. **Two saves.** The character and the world are written apart (`SS` gets a character row and a world row; `_applyLoadData` reads both). Solo play loads both as now; a guest's game would load only their character into the host's world. `ssExportChar` exports the character row alone.
2. **Things in the world have ids that survive a reload**: every foe, container, door and dropped item, keyed by place and index (dungeons and cells already are; foes spawned at random are not).
3. **Rolls that decide an outcome come from a seeded stream keyed by place and id** (a chest's loot, a spawn, a dungeon's foes). Cosmetic rolls (sparks, idle fidgets, ragdolls) may stay `Math.random`. New code follows it; the existing 46 outcome rolls in `14-items.js` and `42-zone-enemies.js` move over in one session.
4. **Shared state changes through a named action** (`openDoor`, `takeItem`, `damageFoe`, `setStage`, `advanceClock`), never by assigning `worldState` in a builder.
5. **A foe picks its target through one function** (`targetOf(e)`), not by reading `px`/`pz`. Solo it returns you.
6. **Correctness never relies on the pause.** A system may freeze its own view while a panel is open, never its outcome (the dropped-frame rule, extended).
7. **No timing window under 150 ms** (combat page), so a 60–100 ms connection keeps the parry fair.
**Touches.** `70-saves.js` (the split), `CLAUDE.md` (the rules), `14-items.js` and `42-zone-enemies.js` (seeded rolls), the foes' tick (`targetOf`). `ssMigrate` splits old saves.
**Conflicts.** None decided; a little care in every session.
**Cost.** One Fable session (the save split and the rules, cross-cutting the saves), one Opus (the seeded rolls and `targetOf`).

### B. Summoned co-op, built now
**The loop.** A, then the table above built: Michael hosts, shares a room code, up to three friends arrive in the world at his side with their own characters, and they fight, loot and sail together for an evening; each goes home with what they earned, and Michael's world keeps the quest he finished.
**Touches.** A's, then a network file (`88-net.js`: the connection, the snapshot, the requests), the other players' bodies on `buildPerson` with their gear, the foes' tick reading `targetOf`, every door and container through its action, the clock, sleep and the downed state, the 400-unit tether, a host-and-join panel on the title screen.
**Conflicts.** Comes before the skills build and the combat rework land, so both would be built twice, the second time against a moving target.
**Cost.** A, plus one Fable (the network layer and the host's authority over doors, foes and loot) and six Opus (the bodies, combat over the wire, the downed state, the clock and sleep, ships with crew aboard, the panel). Ten to twelve sessions.

### C. The arena first, then co-op
**The loop.** A, then the transport proven in a closed place: two characters meet in a ring (a fort yard, Caer Slige's duel yard) and fight to a yield, best of three. No world is shared: no quests, doors or loot. Then B, on a transport that already works.
**Touches.** A's, the network file, the other body, the yield rules from Hesket Rowe's duel.
**Conflicts.** PvP is "perhaps" in the brief. It tunes the fight for players against players, not the world, and builds the least-wanted half first.
**Cost.** A, plus one Fable and two Opus for the arena; B's sessions after.

## Recommendation
**A, aimed at B's shape.** Your note asks for the architecture now and the feature later, and A is exactly that: the save split, stable ids, seeded rolls, targets by function, no reliance on the pause. Each is cheap now and dear later, when 46,000 lines rest on one player and one save. B built now would race the skills and combat rework and be built twice. C puts PvP, the "perhaps", ahead of the friend joining your world, the thing you asked for.

## What must be true first
- The skills build's *enemies by place, not level* (decided) is assumed: there is no one level to scale to with friends.
- The combat page's 150 ms floor on timing windows is assumed for any direction.
- Before B is built: the skills and combat reworks landed, and a decision on paying for a TURN relay (or accepting that some friends can't connect).

## Not asked
No dedicated server: the host's browser is the server, so the game stays a folder on GitHub Pages. No drop-in to a friend's world while they are offline (a world lives in its host's browser). No split parties, guest-owned houses or ships, or trading panel. No chat: the friends will be on a call. No cheating guards: friends are trusted. No matchmaking with strangers: "up to three friends" is the brief. Summoning's place in the lore (a word, a rite, a sign at a shrine) is the quest writer's, if Michael wants one.
