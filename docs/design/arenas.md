# Arenas: the yard, the ring and the sellsword

*The systems designer, 30 Oct 2026. A proposal: nothing here is a spec until `docs/decisions.md` carries a `Michael:` line under it.*

## The problem in Michael's words

> "**Arenas** (systems and quest writer; OG-079, OG-080, OG-089; Michael's 13 A): training grounds and arenas in Markish towns, for the duels and the mercenary trade; Jora runs one, and Red Finn fought in them." (backlog L2)

His 13 A of 12 Oct settled *that* the Mark has them. It did not say what you do there, what it pays or what it changes. The canon gives the frame: the Captains' League settles disputes by duel, the Mark is "known for steel and mercenaries", and an occupied League town loses its duels (`lore_canon.md` §2, §12). The art gives two people: Jora, who "runs the training grounds in a Markish coastal town" (OG-089), and Red Finn, "undefeated in the arenas" (OG-079).

## Today

Nobody fights for sport. The nearest thing is the League's ninth service, the yard at Caer Slige (Session 373, `87-world-quests.js`: `DUEL`, `duelYield`, `duelDown`, `duelKill`): a roped ring of 5 m radius, open 6h to 12h. Rowe yields at a quarter of her health. Three seconds unstruck and she is spared; a blow after the yield is murder. The ring holds you at 1 health, and down or over the rope you lose. Those are an arena's rules already, used once. Skills rise by use alone (`skillUse`). Foes are graded by place in four tiers (`enemies-by-place-build.md`: health ×1 / 1.75 / 2.5 / 3, blow ×1 / 2.09 / 3.99 / 7.47). The Fighters' Guild pays 60 + 50 a tier (`GUILD_DEF.guild_f`), and its hall has a training room nobody uses. Hand-to-hand has perks (Throw, Catch the blade) and nowhere to show them but on bandits.

## Directions

### A. The training yard

**The loop.** Every Markish town and city has a yard behind its Fighters' Guild hall, with a 5 m ring, a rack of staves and a trainer. By day you spar with staves, first to three clean hits, and no health is lost. The trainer calls each parry and roll as you make it (*Early.*, *Late.*, *Good.*). It is the one place the game tells you about its own timing. From 18h to 22h the yard holds brawls: fists only, against townsfolk and off-duty soldiers at the town's place tier.

| Rule | Number | Why |
|---|---|---|
| Spar | first to 3 clean hits; staves hit posture, not health | a safe place to learn the parry |
| A spar's skill use | half weight | a real fight teaches more; nothing is punished |
| The calls | inside the parry window *Good.*; up to 0.15 s out *Early.* or *Late.* | the combat page's windows, spoken |
| Brawl | 50 gold staked a side; yield at a quarter, held at 1 | Skyrim's brawl paid 100; the rules exist |

**Cost.** Two ordinary sessions: lift the ring's rules out of `DUEL` into one bout that the yard and Rowe both use, then the spar, the calls and the brawl. The look builder lays the yard; the quest writer writes Jora.

**What it lacks.** A goal. It teaches and pays a little, and nothing in the world changes.

### B. The ring's ladder, with the yard under it

**The loop.** A is its first half. On top of it, the Mark's cities and the League's seat each keep a ring with stands, and one ladder of twelve bouts runs across them. Your rank is yours, and any ring gives you your next bout: one bout a game day, called on the hour from 9h to 17h. You walk in as you are. A fighter yields at a quarter of their health, you are held at 1, and you choose whether to spare or strike after the yield. The twelfth bout is fought only at Caer Slige, against the reigning champion.

| Bouts | Foe's tier | Health, blow | Purse |
|---|---|---|---|
| 1–3 | 1 | ×1, ×1 | 50, 60, 70 |
| 4–6 | 2 | ×1.75, ×2.09 | 120, 140, 160 |
| 7–9 | 3 | ×2.5, ×3.99 | 250, 280, 310 |
| 10–11 | 4 | ×3, ×7.47 | 450, 500 |
| 12, the title | 4, the champion | ×4.8 (the named quarry's ×1.6), ×7.47 | 1,000 |

- **Twelve, not Oblivion's twenty-one.** Oblivion's Arena was a long run of fights that felt alike. Here each tier changes on the bout that changes it, and at one bout a game day (24 minutes) the ladder threads through two or three evenings of other play.
- **Not levelled.** At level 1 a tier-4 fighter's blow is 127% of your health. The ring is where the game says *not yet* out loud, and where fighting up pays.
- **Losing costs the day**, nothing else: you keep your rank and challenge again tomorrow.
- **No potions inside the rope**: drinking one forfeits the bout. Words and bows are allowed, in a ring of 8 m radius (room for the spear's 2.4 m). The ring measures what you can do, not what you carried.
- **The wager.** You may stake up to the purse on yourself. The odds are 1 + (the foe's tier level − your level) ÷ 5, from evens up to 4 to 1. At level 4 against bout 7 (tier level 11) that is 2.4 to 1.
- **The yield.** Spare the fighter and they salute and stay on the roster, and the town's favour rises 1. A blow after the yield is murder: the guard comes (the crime system as built), every ring in the Mark is shut to you for 28 days, and the dead fighter's place stays empty, their name cut in the ring's post. That is Rowe's rule, made general and visible.
- **The fixer.** From bout 4, in one bout in three (seeded on the bout's id), a bookmaker's man offers three purses to go down. Take it and you keep the gold and your rank and fight again tomorrow; one fix in four is found out (a fine of twice the bribe, the rings shut 28 days, League favour −1). Report him and the next purse pays half again.
- **The title.** The champion's name on every ring's post, Markish greetings, League favour +1, and a challenger once a month; refuse three times and the title passes. No discount and no gear: the brief's *not buy more/better*.

**Touches.** The bout from A. The roster, each fighter `<site>:ring:<n>` with rolls seeded on it (the co-op rules). Gold through `60-shop.js`, the murder and the fix through `86-world-crime.js`. `worldState.arena` (your rank, last bout's day, the ban, the title) is the character's and goes in `SS_CHAR_WS`; `worldState.rings` (each ring's dead and its reported fixers) is the world's; both join the S242 list. The fighters are F4's human foes (`hbFoeGenome`) with combat B's moves: the feint from tier 2, the heavy from tier 3.

**Cost.** Four ordinary sessions for the systems builder: the bout and the yard; the ladder and purses; the wager and the fixer; the title. One for the look builder (the ring and stands), and the quest writer's names, barks and Red Finn's legend. No deep work.

### C. The sellsword's hall

**The loop.** B, and the ring's rank is a renown League captains hire on. From bout 4 a captain at a Markish fort offers contracts (garrison a threatened town, ride with a caravan) at 1.5 times a guild task of the tier, and they move the war's lines.

**Cost.** B plus three sessions, waiting on the war's sieges being playable on the new look. It overlaps the Fighters' Guild's *raid* and *beast* tasks: two boards offering the same job.

## Recommendation

**B.** It serves all three of the brief's feelings. It is combat in Elden Ring's shape against people with move sets. Its ladder is the clearest progression test the game would have: twelve fighters getting harder in four visible steps. It also carries two choices that change what you see: a spared or murdered fighter, whose name stays on the post, and the fixer. A teaches the timing but gives nothing to aim at, and it is B's first session either way. C's mercenary trade is the canon's, but the guild already sells your sword and the war is not ready to buy it. The ring's rank can feed C later.

## What must be true first

- Combat B's move sets for people. The feint is built (Session 1140); the heavy waits on the resolver's `heavy` column. Without them every bout is the same fight with more health.
- Enemies by place's tiers and F4's human foes (both built).
- The quest writer's names, which can replace placeholders later.

## Not asked

- **Fights to the death**: a ring where you kill makes the yield's choice meaningless.
- **Beast pits**: the Mark's wolves and bears are already in the open.
- **Arenas outside the Mark**: the Compact holds duels in contempt (§2).
- **Paid training**: skills rise by use and nothing else; selling levels is *buy more/better*.
- **Team bouts and a PvP ring**: B's rules (yield at a quarter, held at 1, the rope) are what a friend's bout would need, so the brief's "perhaps a PvP arena" stays open; nothing is built for a second player.
- **Fighters at your side**: Michael's 12 A, no companions.
