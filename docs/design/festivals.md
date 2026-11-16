# Festivals on the calendar

*The systems designer, 16 Nov 2026. A proposal: nothing here is a spec until `docs/decisions.md` carries a `Michael:` line under it. The names, dates and words are the quest writer's drafts (`docs/quest_drafts.md`, *Festivals on the Calendar* I–III, unapproved); how a town looks on the day is the concept artist's (`docs/concepts.md`, 13 Nov). This page asks only what a festival does.*

## The problem in Michael's words

Backlog L9 (OG-107): "**Festivals on the calendar**: three festivals an island, each in its month: the Greening (a maypole spring feast), Riverfair (a summer fair on the rivers), the Night of the Lanterns (October, lanterns let go for those who never came back from the gates, close to the canon); Midwinter fires, a fair of boat races and duels, a First Snow rite under the aurora; a festival of learning, a spice caravan, lamps set afloat. Everyday life to fill the towns: stalls, a smith at work, a temple service, wrestling and archery, a harbour gathering. The Mark's fair is run by captains and reeves, not jarls and a thane."

## Today

The calendar is built (`CAL`, `calDay`, `60-shop.js`): a year of 336 days, a day 24 real minutes, a year about 134 real hours, so each date comes about once a playthrough. The four feasts are built (`FEASTS`, `feastOn`): a greeting by people (`feastGreeting`), the square full (`feastNow`, `feastR`), the inn's meal free (`feastMeal`), a petty fine halved, the Mark's feast dress (`hbFeastDress`). The quest writer's drafts put all nine festivals on one frame: a greeting, the square filled, a *Due* line, and one small act a year per town (a ribbon, a cup for the sea, a lantern, a log for the Blaze, a bet on the boats, the scholars' purse), at most 2 gold, kept as `worldState.festivals['<key>:'+site.id]=year`, no reward but the line. They leave the systems builder the Strait Fair's ring "to a yield" and OG-107's "wrestling and archery". The machinery exists: the bout (`boutStart`, `boutTick`, `87-world-quests.js`), the brawl (`brawlStake`, 50 + 50 a tier), `fireArrow`, `skillUse`, `booksRead`, and the town's state (`TS(site).flags`, `prosperity`, `addFavor`).

## Direction A: the custom alone

**The loop.** The drafts as written: *the Greening, Sowing 3* on the *Due* page, a walk or a wait to a Gatelands town, the day's greetings, your ribbon on the pole, remembered the next day. The feasts' texture, nine more times a year.

**The rules.** `FESTIVALS` beside `FEASTS`, nine rows `{key, nation, month, dom}` (First Snow by the first snow lying in Culling or Longnight, else Culling 28); `festivalOn(at, nation)`, read by `feastNow` so only that nation's squares fill. Nothing is free. Each act is a topic or prompt, 0 to 2 gold, once a year a town.

**Touches** `60-shop.js`, `feastNow` (`82-world-structures.js`), the *Due* view (`66-hub.js`). Save: `worldState.festivals`, the character's (`SS_CHAR_WS`, the S242 list). **Cost:** two systems sessions. **Displaces** nothing. **Lacks** any decision or gain: it is look and words, which the brief ranks last.

## Direction B: the custom, a contest at each island's fair, and a town that keeps it as it can *(recommended)*

**The loop.** A, and three days worth planning a road around: Riverfair's butts, the Strait Fair's ring, the Commencement's disputation. You arrive in the window and win or lose against townsfolk seeded by the day, for a purse, a keepsake and a point of skill. And a town keeps its festival as its year allows: the town you saved names you; the town you let burn keeps none.

**The contests.**

| Festival (island) | Contest | Window | Skill | How it is won |
|---|---|---|---|---|
| Riverfair (Gatelands, Haysel 18) | the butts: three ends of three arrows at 30, 50 and 70 m, a face 1.2 m across, rings scored 5/3/1 | 10:00–14:00 | Bow | beat the best of three townsfolk |
| The Strait Fair (Mark, Highsun 4) | the ring: three quarrels in a row, fists, each a bout to a yield; steel is murder | 05:00–12:00 | Hand-to-hand | win all three |
| The Commencement (Aurenne, Shearing 6) | the disputation: three questions from the examiners, each on a book of the town's academy or library | 09:00–12:00 | Speech | answer two of three: a question is answered if you have read its book (`booksRead`), or by a Speech check (40 + 15 a question) |

- **The rivals.** Skill seeded by festival, site and year (`seededRng`): 20–45 in a village, 30–60 a town, 40–75 a city; their arrows land by a foe's bow spread at that skill. The ring's three are the brawl's fighters by the town's tier.
- **Why these numbers.** Nine arrows at three distances read your aim, not your gear; the city's field (to 75) should beat a Bow-30 archer most years. The windows are 4 to 7 real minutes: a contest is entered on the day, not stumbled into, and once begun it runs to its end. Two of three questions rewards the player who reads, which a book otherwise pays only with its one +1 attribute.
- **The prize.** 40 + 20 gold a tier (under the brawl's 50 + 50: no stake to lose); a keepsake named for the town and year (a silver arrow, the reeve's iron ring, a scholar's seal); and **+1 to the contest's skill** (a level, as a Morrowind skill book), once a year a festival, not a town. Contest skill use counts at full weight, unlike the spar's half. The winner's name is cut on a post (as `ringPostNames` does) and said by the town until next year's.
- **Losing** costs the window; the ring holds you at 1 health.

**The town keeps it as it can.** A festival reads its town's state on the day, the canon's consequences shown on the calendar:

| The town | Its festival |
|---|---|
| prosperity ≥ 50, no flag | full: the custom, the act, the contest |
| prosperity under 50, or plague, siege or sack lifted in the last 28 days | thin: the custom and the act; no contest, a line says why |
| burned, sacked, plagued or abandoned now; occupied (the draft's rule for the ring, kept for all) | not kept: the greeting says why; the families on the road (#1587) carry it elsewhere |
| favour ≥ 3, or you lifted its siege, plague or occupation this year | full, and the town names you: the act is given, not sold, and the lord's greeting is your deed |

**Touches** A's, plus `boutStart` (three fighters in turn), `fireArrow`'s hit read at the butt's plane, `booksRead`, `skillUse` and the skill's level, `TS(site)`, `addFavor`. Save: `worldState.festivals` gains `{year, act, won}` (the character's); `worldState.festChampions`, a name a town and year (the world's: the post is the town's); both in the S242 list. Co-op: every roll seeded by festival, site and year (`seededRng`), no window under 150 ms, outcomes read the clock. **Cost:** five systems sessions (the table and the state rule; the butts; the ring's three; the disputation; the post and the town's memory), one look (the butts and the ring's rope, which the concept's dressing may already carry), one quest-writer run (the contests' words: the butts' marshal, the examiners' nine questions an island's academy can ask). **Displaces** nothing; the yard, the brawl and the ladder stand, and the ladder's *Caer Slige* stays the Mark's title.

## Direction C: B, and the festival as a market

B, plus trade: the road's people (#1587) run double towards a town keeping its festival, a stall of the other islands' goods stands on the square at ×1.3, the feasts' free meal and halved fine apply, and a town you hold the deed in can be paid 300 gold to keep a thin festival full, for +3 prosperity. About eight systems sessions and two look. It turns nine days into shopping days, and the feasts lose what makes them the year's four.

## Recommendation

B. The brief puts consequences first and progression second, and A has neither. B gives three days a reason to be in a town at an hour, a gain no shop sells (a point of skill, earned at the butts, in the ring or by having read the books), and puts the world's state on the calendar: the town you saved names you, the town you let burn keeps nothing. Daggerfall's holidays changed prices and were forgotten because nothing turned on them; Oblivion's Arena and Kingdom Come's archery at Rattay are remembered because you entered. B reuses the bout, the bow and the town's flags, seeded by place and year so a friend meets the same field. C spends the feasts' rules on a sale.

## What must be true first

- The quest writer's drafts approved, or at least their dates and keys; the build can carry placeholder words, as the calendar did before #146.
- The concept artist's dressing question is separate; B adds only the butts and the rope.

## Not asked

- **More festivals.** Nine and four feasts is one every 26 game days, about ten real hours; more would be noise.
- **Boat and horse races for the player.** No mounts, and no small boat to row; the drafts' bet on the boats stands.
- **Rewards at the Lanterns and the Lamps.** They are mourning; the drafts keep them free of reward, and so does this page.
