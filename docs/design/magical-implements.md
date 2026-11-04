# Magical implements: the staff, the wand, the orb and the tome

*The systems designer, 4 Nov 2026. A proposal: nothing here is a spec until `docs/decisions.md` carries a `Michael:` line under it.*

## The problem in Michael's words

Backlog L, *Magical implements by school* (OG-094, "kept with Tine redone as fire"): "one emblem and colour per school, and four implements each (a staff, a wand or maul, an orb or foci, a tome) … Wands, orbs and tomes are new item lines beside the wooden staff … Each island has its own make: the Gatelands wood, bone and leather; the Mark stone and iron; Aurenne fine metal and carving." The emblems and makes are the look builder's. The systems question is what each implement *does*. The brief rules out *buy more/better*.

## Today

The game has one implement. The Wooden Staff is a creator starter (`STARTER_WEAPONS.staff`, `12-character.js`): one-handed, blunt 4–7, with `spellPower: 1.05`, which `applySpellDamage` (`74-strikes.js`) multiplies in. It is not in `WEAPON_TYPES`, so nothing sells or drops a better one. Any spell can be cast with any weapon in hand: F casts the spellbook's entry (`castSpell`, `62-actions.js`), and the bolt leaves from the right hand (`tpShotFrom('R')`). Magic B sets the rest: the school's skill sets power and cost (`wordCost`); Sent dies at 30 m, Held is a 4 m cone, Laid reaches 12 m, the Cast row's wind-up is 0.35 s, and Impression words go wild 30% (`casterRand`). The off-hand holds a shield or nothing.

## Directions

### A. Spell power by tier

**The loop.** A better implement for a bigger number, as a sword is upgraded (Oblivion's and Skyrim's enchanted gear).

**The rules.** The four join `WEAPON_TYPES` and the off-hand, each with spell power by material tier (×1.05 at tier 1 to ×1.30 at tier 6) and one `mp_regen` or `maxManaBonus` enchant; +10% more in its school; main and off-hand multiply. **Touches** `makeItem`, the loot tables, `applySpellDamage`'s `weaponSpellMult`.

**Conflicts.** This is *buy more/better*, plainly. It also stacks with the school's power curve (×0.6 to ×1.4), so a skill-100 caster holding a tier-6 staff and orb deals ×2.4. That is outside the range enemies by place was tuned to.

**Cost.** One systems session and one bodies session.

### B. Each implement changes one form *(recommended)*

**The loop.** An implement does not make magic stronger; it changes how one form is cast, and you choose which form your hands are built around. The orb and tome cost you the shield, and the staff both hands. The emblem's school makes that school's words cheaper, so a caster's kit follows the schools they have found. The decision is the slot, not the number.

**The rules.**

| Implement | Hand | Melee | What it changes | Why this number |
|---|---|---|---|---|
| Staff | both | blunt [0.55, 0.75], blocks 40% (the Great Club's row) | Held's cone reaches 5.5 m (was 4). Laid reaches 16 m (was 12). A laid thing lasts ×1.25. | 5.5 m is past a foe's spear (2.4 m) and a step. 16 m lays a pillar over a 10 m chasm band from its edge. The 20 s bridge holds 25 s, for a second crossing. |
| Wand (Cloch: the maul) | one, right | wand: blunt [0.35, 0.45]. Maul: the Mace's row | A sent bolt dies at 45 m (was 30). The Cast row's wind-up drops to 0.28 s (was 0.35). | 45 m is a bow's useful range. 70 ms quicker, above the co-op 150 ms floor. Stone hits as a mace, so the maul keeps its melee. |
| Orb | off, left | none; the shield is stowed | **The kept cast.** F with the orb raised (hold R) casts a Sent or Touched entry into it, at full cost and full wind-up. Its next F releases it at once: 0 s tell, the 0.30 s recovery. One charge, held 60 s by the play clock, lost on sleep or a change of place. | Timing as a magic tool (feeling 3): you answer a foe's tell in the same instant, as a parry does. It saves no mana, only time. |
| Tome | off, left | none; the shield is stowed | **Read aloud.** Impression words cast at ×0.8 power (was ×0.6) and go wild a third as often (30% → 10%, or 5% with *Steady voice*). A two-school join's extra 10% wild becomes 3%. Every cast's wind-up doubles (0.70 s). Comprehension and Mastery words are unchanged. | The learner's book: a word touched once comes into play earlier, paid for in exposure. Morrowind's scrolls are the precedent: reliability for time. |

**The school.** Every implement bears one school's emblem (OG-094's six). Words of that school cost 10% less, or 20% for a piece found in a gate. This stacks with *Thrift* (−15%) to at most −35%, about what Mastery's ×0.7 gives. Words of other schools cast at the normal cost. Elden Ring's catalysts are the precedent (a staff that favours one kind of sorcery); here the favour is cost, never damage.

**Where they come from.**

- The Mages' Guild sells its island's make at a common grade: a wand at Novice (80 gold), a staff at Novice (60), and a tome at Adept (120), each in any school's emblem.
- Orbs are never sold: one gate in three holds one of its school in its vault or keep (*What a gate keeps*), a reason to go into a school's gates.
- A found piece of any kind (vault, lair master, tier 4+ chest) is −20% in its school and carries one existing enchant (`mp_regen`, `maxManaBonus`, `intBonus`). Its emblem is faint at rest and full while casting, the legendary rule of #960 C.
- The island's make is look only: a Markish and an Aurennais wand play the same.

**The Wooden Staff** becomes a Staff of no school; `spellPower` is retired and a saved one mapped by `ssSanitizeLoaded`.

**Touches.** `WEAPON_TYPES` (Staff, Wand, Maul), new off-hand items (orb, tome) beside the shield, and `_clearOffhandForTwoHander` for the staff. In magic B's code: `wordCost` (the school's discount), `castHeld` and `castLaid` (reach, cone, duration), the sent bolt's range, `WEAPON_ATTACKS.Cast`'s tell when a wand or tome is held, `wordWildChance` (the tome), and a kept-cast slot read by `castSpell`. The release leaves from the left hand (`tpShotFrom('L')`). Also `spellShopTopics` (the guild's stock), the vault's loot (`14-items.js`) and `60-shop.js`'s compare panel (the rule, not a percentage). **The save:** implements are items in `EQ` and `BAG`, which already live in the character row. The kept cast is never saved. No new `worldState` key. **Co-op:** a found piece's grade and enchant roll on the vault's seeded stream; the kept cast is the caster's own. **Bodies:** four shapes in three makes (twelve meshes) and six emblem heads, held in both views; the orb in the left fist, the bind's off-hand pose (OG-045).

**Cost.** Three ordinary systems sessions: (1) the staff, wand and maul, the school discount and the Wooden Staff's migration; (2) the orb's kept cast and the tome; (3) the guild's stock and the vault's orbs. Then two bodies sessions: the twelve meshes and emblems, and the hold in both views.

### C. Implements that hold a word

**The loop and rules.** Skyrim's staves, Morrowind's enchanted items: a found implement carries one word in one form at its own tier, 10 charges, cast without knowing the word (no mana, a flat ×1.0) and recharged at a carving of its school; one gate in three of its school holds one. A warrior can carry a Caor staff.

**Conflicts.** Canon §7: words come only from carvings, and the Register builds the main quest on finding them. An item that casts an unread word undercuts both, gives a warrior a school without the school, and adds a charge economy beside mana and the overcast.

**Cost.** Three systems sessions and the same two bodies sessions as B.

## Recommendation

**B.** Every implement changes how a form plays, not how hard it hits, so there is no better implement, only a different one. A is a number to chase and C gives words away. B's costs are real (the shield, both hands, a slower cast), the discount ties your kit to the schools you have found (feeling 2), and the kept cast gives magic a timing tool (feeling 3). Nothing in B changes damage, so enemies by place and the skill curves keep their numbers, and the orbs give each school's gates a prize of their own.

## What must be true first

- Magic B's forms in the build: Held, Laid and Touched are on main (`castHeld`, `castLaid`, `castTouched`).
- *What a gate keeps* (answered 4 Nov) for the vault's orb, and its loot session for the stream.
- F10's player body, for the left-hand hold (built).

## Not asked

- **An implement to cast at all** (Elden Ring's rule). Magic B casts from any hand, and the bind (OG-045) is a sword with a spell behind it. Requiring a catalyst would take that player away.
- **The gate compass, the stormwhistle, the quill and the self-writing book.** The compass repeats Súil; the others are artifacts, with the legendary weapons and the Makers' tools.
- **Wear.** No weapon wears out; these alone would be a tax.
