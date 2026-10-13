# The builder: people and creatures from a genome

*Claude, Session 771, 12 Oct 2026. Part of the new visual foundation (backlog K), which Michael approved as A on 12 Oct. The design is his call where marked; the rest is how it gets built.*

## The question in Michael's words
> "Why are we using MakeHuman? I get that it's a widely accepted open source software, but frankly its almost 30 years old. Could we not custom build our own builder? And maybe make it flexible enough to support other skeleton types? … It could massively aid in character and creature development."

And when it was written up: **"yes, write it up and fold it in."** (12 Oct 2026)

## What MakeHuman is in this, and what it is not
MakeHuman is not in the loop. Nothing runs it, and nobody opens it. The slice (`docs/prototypes/levelup/people.js`, Session 770) uses its **data**: one sculpted body of 19,158 vertices, released CC0 by its makers in 2020, the morph targets that reshape it, a 163-bone skeleton with skin weights, and two fitting shells that the same targets reshape. That data is the expensive part, years of sculpting and weighting, and it is free to use for anything. The tool around it is ours already: the genome, the morphing, the skeleton fitted to the morphed body, the wardrobe cut from the shells, the fur, the hair cards, the eyes and the pose. It is about 220 lines.

So the answer to "could we build our own builder?" is yes, and it is half built. What follows makes it general: any body plan, any skeleton, one genome format, one tool page, and the game reading the result.

## The model

**A species** is everything needed to make one kind of body:
- **a base mesh**: the neutral body, in metres, standing on the origin and facing +z;
- **a skeleton**: bones in parent order, each with its joint read off the mesh (a vertex list, as MakeHuman does it), so the skeleton refits itself to any morphed body;
- **skin weights**: up to four bones per vertex;
- **sliders**: named morphs. A *sculpted* slider is a morph target (sparse vertex deltas, as MakeHuman's). A *generic* slider is a bone-length or bone-girth scale that works on any skeleton: lengthen the neck chain, thicken the forelegs. The mesh follows through its weights;
- **regions**: named sets of faces for dressing and attachment (the tunic region, the scalp, the beard, the mantle's shoulders, a saddle's back, a horn's base);
- **a pose and gait library**: rest pose, idle, walk, run and the rest, for that skeleton.

**A genome** is a small record:
`{ species, seed, sliders: {name: value}, palette: {skin, hair, eyes, …}, dress: [{garment, colour, material}], hair: {style, length}, marks: […] }`
It is a few hundred bytes, so a named character fits in a data file and a crowd is a range sampled by seed. The co-op rules hold: the seed comes from the place and the id (`<site>:<index>`), never from `Math.random`, so the same villager looks the same for everyone.

**Peoples** are slider ranges over the human species, from the canon's peoples table (§2) and Michael's answer 1 B (the heroic hybrid, about 1.80 m): Gatelanders, Markmen (taller and broader), the Old Blood (short and slight, with marks under the skin, §3.1), and Aurennais (mixed and darker-skinned, Michael's call of 12 Oct). A people sets the ranges; the seed picks inside them.

## Body plans

| Species | Base mesh | Skeleton | Sliders | Used by |
|---|---|---|---|---|
| Human | MakeHuman's body (CC0) | MakeHuman's default (163 bones; a 60-bone game rig of it for crowds) | MakeHuman's macro and face targets | everyone; goblins and kobolds as extreme ranges; skeletons and drowned with a material swap |
| Large biped | the human body, re-proportioned | the same rig | generic: limb length and girth, hunch, head size | trolls, ogres, golems, gargoyles (with wings, below) |
| Canid | our own, built procedurally around the bones (as the wolves are today) | 24 bones | generic plus a few sculpted (muzzle, ruff) | the four wolves, hounds, the Faolchú |
| Ursid, cervid, bovid, equid | procedural around the bones | 24 to 30 bones | generic plus sculpted (hump, antlers as attachments) | bears, deer, cattle, horses |
| Hexapod | a quadruped with a third limb pair | 30 bones | generic | the six-legged animals (Michael's 9 A) |
| Arachnid | procedural | 40 bones | generic | spiders |
| Winged | any plan plus a wing chain | +8 bones a wing | generic (span, membrane) | gargoyles, the dragon, *something winged* (Gaoth) |
| Serpentine | a tube along a long chain | 30 to 60 bones | generic | eels, wyrms |

The procedural base meshes are what the game already does for wolves and bears: a skinned surface grown around the bones. Built into the builder, they get the same sliders, the same regions and the same LOD as people.

*Session 772 replaced the rows below the human with parts: see the next section. The table stands as the first list of what was needed.*

## Body plans from parts (Session 772)

> **Michael (12 Oct 2026, in chat):** asked to "expand upon the idea I had of having skeletons built for every creature type, akin to the MakeHuman skeleton", then: **"yes, write it up and start the creature prototype"**, and, while it was being built: **"Be mindful that there are several other animals / monsters that are on other concept art files."**

### The idea
MakeHuman gives one excellent skeleton for one body. The bestiary is about a hundred and twenty animals and monsters across sixteen sheets, so one skeleton per species would be a hundred and twenty jobs. They fall into about a dozen body plans, and the plans share their pieces: a wolf's leg is a stag's leg with different proportions, a spider is four pairs of an insect's leg, a dragon is a quadruped with a pair of wings. So the unit is the **part**, not the species. A plan is a short list of parts, and each part adds its bones, its flesh and what the gait needs to know. The game already does a small version of this: `wolfSkeleton` (`34-creatures.js`) bends one 24-bone rig into a wolf, a boar, a cave bear, two horses and the dragon with flags. The kit makes that general.

The prototype is `docs/prototypes/levelup/creatures.js` (the kit, about 600 lines), `bestiary.js` and `creatures.html` (the page), and `creatures.check.mjs` (the checks and pictures).

### The parts
| Part | Bones | What it takes | Sockets it gives |
|---|---|---|---|
| **spine** | 2 to 16, hips (t = 0) to chest (t = 1) | heights, radii along it, an arch, a hump, rump and chest ends | any point along it, by t: legs, arms, wings and spines hang there |
| **neck** | 1 to 6 | length, rise, a bend along it | the head |
| **head** | head, jaw | skull, muzzle, jaw; eyes, ears, horns, antlers, crystals, a beak, fangs as bits | (bits) |
| **tail** | 1 to 10 | length, droop, a curl per bone (a scorpion's tail is a big curl), a sting | its tip |
| **legs** | a pair; 4 to 5 bones each | a preset, a socket (t), height, splay (`fan`), reach | the foot (claws, hooves) |
| **arms** | a pair; 4 bones each | a socket anywhere on the spine, two directions | the hand |
| **wings** | a pair; arm plus 2 to 5 two-bone fingers | span, fingers, sag of the trailing edge | a membrane mesh of its own, skinned to both edges |
| **spines** | none (bits on the spine) | count, length, from and to | |

A **leg preset** is the leg's joints in a frame of its own (out, up as a fraction of the leg's height, forward), so one preset fits any size. There are eight: canid fore and hind, ungulate fore and hind (a long cannon bone), plantigrade fore and hind (a flat foot), bird (the backward "knee" that is an ankle), insect (coxa, femur, tibia, tarsus) and sprawl (a lizard's elbow out to the side). Each preset says which two segments the solver bends, which come before them (held, or yawed toward the foot like an insect's coxa) and which are held after them (a paw, a hoof).

### The flesh
The flesh is grown, not modelled. Every part lays tapered capsules along its bones. The field around a capsule falls off as e^(−d/k), and the surface is where the summed field is 1. Capsules of one limb join hard (so a chain of segments is one smooth tube with no bulge at each joint), and different parts join smoothly (so a neck flows into a chest, and a thigh into a flank). The surface is meshed by surface nets on a grid sized to the thinnest limb, then smoothed by Taubin's method, which does not shrink the body. **The skin weights are read off the same field**: each vertex takes its four strongest bones, so a joint bends exactly where the flesh joins. Tone (coat, belly, saddle, hoof, horn, bare skin), counter-shading and patterns (bands, stripes) are read off it too. So are the fur mask, the fur being shells cut by noise as on the people's mantles, and the binding's glow: seams down the spine and cracks over the hide, as an emissive term.

Meshing at a coarser grid gives the level-of-detail meshes from the same flesh, with the same weights.

### The gait engine
One engine walks any number of legs. A gait is three numbers and a rule.
- **Duty:** the part of a stride a foot is down.
- **Froude number:** speed against leg length, v = √(Fr·g·h), so a 3.4 m Shatterhorn walks at a giant's pace and a wolf at a wolf's.
- **Stride:** 1.6 h Fr^0.3.
- **The rule:** the phase of each foot from its pair (front to back) and its side.

The rules are general:
- *walk* is a wave from the back pair forward, left then right. It is a quadruped's four-beat walk, a hexapod's wave and a biped's walk.
- *trot* alternates diagonals. It is a trot, an insect's tripods, a spider's tetrapods and a bird's run.
- *gallop* is the rotary gallop.
- *slither* sends a wave down the spine.
- *fly* beats the wings.

A foot in stance slides back under the body at the body's speed (so it stays planted when the root moves), and in swing it arcs forward with its distal segments folded. The solver is analytic:
- yaw the leg toward the foot (an insect's coxa);
- hold the distal segments;
- bend the two between them by two-bone IK, toward the knee's side read off the rest pose;
- past the leg's reach, slide its root toward the foot by up to a fifth of the leg, as a shoulder blade swings or a pelvis tilts.

The body bobs twice a stride and sways and rolls once; the neck nods against the bob; the tail and the extra arms swing behind.

### The genome
`{ plan, seed, sliders: { size, leg, bulk, neck, tail, head }, tint, light }`, about 150 bytes. The six **generic sliders** work on any plan, because they act on parts, not species:
- the leg slider raises the spine and every leg with it;
- the neck and tail sliders lengthen their chains;
- bulk thickens all the flesh;
- size scales the finished body.

The seed comes from a key of place and index (`hashKey('<site>:<index>')`), never `Math.random`, so the co-op rule holds: one wolf looks the same to everyone. A Sand Wyrm is the Mire Snake's plan at another size and colour, and a horse is the stag's plan with a longer neck and no antlers.

### Verified (headless Chromium, `node docs/prototypes/levelup/creatures.check.mjs`)
All ten plans build from their parts with no code of their own, each in 0.04 to 0.9 s:

| Plan | Source in the concept art | Bones | Triangles | Legs | Build |
|---|---|---|---|---|---|
| Ironwolf | OG-084, OG-031 | 32 | 24,500 | 4 | 0.26 s |
| The Faolchú | lore canon, OG-073 | 40 | 61,300 | 4 + 2 arms | 0.54 s |
| Frostreach Bear | OG-031 | 25 | 26,500 | 4 | 0.24 s |
| Elderstag | OG-009, OG-014 | 30 | 46,800 | 4 | 0.36 s |
| Shatterhorn | OG-040 | 41 | 33,600 | 6 | 0.22 s |
| Mineprowler | OG-040 | 41 | 32,500 | 6 | 0.25 s |
| Giant spider | OG-041, OG-088 | 46 | 84,500 | 8 | 0.93 s |
| Stormplume | OG-040 | 20 | 38,700 | 2 | 0.25 s |
| Dragon | lore canon §5, OG-085, OG-088 | 69 | 41,000 | 4 + wings | 0.50 s |
| Mire Snake | OG-009 | 18 | 8,600 | 0 | 0.04 s |

- Every vertex's skin weights sum to one.
- Every foot reaches its target at 48 points through the stride of every gait of every plan, to the millimetre.
- The share of the stride each foot spends down matches the gait's duty (a wolf's trot 0.45 of 0.45, a spider's walk 0.71 of 0.68).
- The pictures are `creatures-line.jpg` (all ten at true size, each beside a 1.8 m figure) and `creatures-<plan>.jpg` (`-bones` for the skeleton through the flesh).

### Every creature in the concept art, by plan
This list is from the whole catalogue, not only the bestiary sheets: the fauna sheets (OG-009, 030, 031, 040, 047, 084), the aquatic sheet (OG-016), the bestiaries (OG-003, 018, 041, 062, 073, 085, 088), the beasts of burden (OG-007, 046, 058) and the companions and pets on the NPC sheets (OG-051, 054, 065, 071, 083).
| Plan | Its parts | The creatures | Here |
|---|---|---|---|
| **Digitigrade quadruped** | spine, neck, head, tail, canid legs | Ironwolf, Stonefang and Warden wolves, the game's four wolves and the Ash Hound, the wolf companions and the wolfhound (OG-051, 065, 083), Redspine, Mirage, Blizzard and Lantern foxes, Hollowcat, Sunspire, Storm and Frost lynx, Dune Cat, Striped Hyena, Realm Hound; hares (Snowleap, Dusk, Oasis) on a hare's hind leg | Ironwolf; Snowleap Hare and the post hare (S773) |
| **Ungulate** | ungulate legs; antlers and horns as bits | Elderstag, Crownstag (antlers hung with moss), Ironpine Elk, Ridge Stag, Duneskimmer and Sand Gazelle, Icehorn, Craghorn and Terrace Ram, Peak and Coastal Ibex, Stone and Sea Goat, Gatefen and Thicket Boar, the three mounts (Gatelands Horse, Mark Steed, Aurennais Courser), draft horse, mule, donkey, ox, Mountain Ox and yak, cow, water buffalo, camel, dromedary, reindeer, giant goat, Frostmane and llama (the neck slider) | Elderstag |
| **Plantigrade** | plantigrade legs | Frostreach, Crag and Cave bears, the grizzly, badger, otter and stoat (the leg slider low, the spine long), Glacial Marmot, Stonejaw (with a shovel skull), Nell's tusked beast, war elephant (pillar legs) | Frostreach Bear |
| **Hexapod** | three pairs of any preset | Shatterhorn (ungulate), Mineprowler (sprawl), the Bog Crawler and Lantern Beetle (insect). Michael's 9 A: ordinary animals | Shatterhorn, Mineprowler |
| **Sprawler** | sprawl legs; a shell as a rigid bit on the spine | Stonecrawler, Saltspine Monitor, Frostspine Lizard, Spined Gekko, Sand Skink, Reef Lizard, Alpine Salamander; the tortoises (Mossback with its garden, Sailshell with its sail, Sunshell, Painted Turtle, the sea turtle); Bellthroat and Marsh Frog on a frog's hind leg | Mineprowler's legs; Bellthroat (S773); Mossback and Sailshell (S775) |
| **Arthropod** | insect legs, 3 to 5 pairs; arms with claw bits as pincers | giant and void spiders, Dunescorpion and Sand Scorpion (arms as pincers, a stinging tail), the crabs (Tidecrab, Icecrab, Amber Shellcrab: a heading of 90° to walk sideways), the Bog Crawler | Giant spider; Dunescorpion and Tidecrab (S773) |
| **Bird** | one bird leg pair; feathered wings | Stormplume, Sunfan, Redcrest, Grove Turkey, Great and Marsh Heron, Scarlet Ibis, Cypress Stalker; flyers: Skyraven, Crag Hawk and Cliffhawk, Sky Eagle, Stormshrike, Highcliff Falcon, Barred Owl, Sunbeak Vulture, Embersong Thrush, Tomcán's raven, Orvin's heron | Stormplume; Skyraven and Crag Hawk, perched and flying (S775) |
| **Winged quadruped** | a quadruped and wings | the dragon, the Gateborn Companion, the Winged Thing (a griffin), Glasswing, the sky leviathan | Dragon |
| **Serpentine** | a spine and a tail, no legs | Mire Snake, Sand Wyrm (the size slider), the gate worm and the Maw, Void Serpent, the eels (reef moray, Blackcurrent, Gate Eel) | Mire Snake |
| **Swimmer** | a serpent with fin and fluke bits; a swim gait | the whales (Storm and Tempest Whale, Gate Leviathan, crimson leviathan, Shatterback), dolphin, reef shark, the rays, tuna, pike, salmon, trout, carp, the seal (sprawl flippers) | Riverjaw Salmon, Storm Whale (S774) |
| **Radial** | chains from a centre | octopus, drifter squid, the Watcher's tendrils, the jellyfish (Wisp, lantern jelly, Drifter Jelly) | Giant octopus, Wisp (S774) |
| **Human rig** (the people's builder) | MakeHuman's skeleton at extreme ranges | goblin, kobold (a rat's head), shieldbearer, skeleton and drowned skeleton (a material), cave and river troll, ogre, wraith and phantom (cloth), gargoyle (plus the wings part), the Gate Warden, the Hollow | B1 to B4 |
| **Failing forms** (OG-073) | any plan plus extra arms, legs or wings, and the glow | the Faolchú (arms out of its spine seam, as the canon has it); the failing Skeleton (more arms), Wraith (more limbs), Gargoyle (bigger wings, more limbs); the corrupted animals of OG-085 and OG-088 (seams, crystal growths, which is the crystals bit) | The Faolchú |
| **Not skeletal** | kits of their own | slimes (soft bodies), the fire elemental and the fire titan, golems and colossi (rigid plates that float apart), the Frost Thing (shards), wisps, the Echo, Bridgeshaper, the mimic (a chest with a tongue chain) | not this kit |

So ten of the fourteen plans exist in the prototype, and every creature in the concept art has a home. Still owed:
- ~~two parts (fins, radial chains)~~ (done, Session 774);
- ~~a hop and a bound (frogs and hares; the hare post-rider of OG-077)~~ (done, Session 773);
- ~~feathered wings (cards, like the people's hair)~~ and ~~shells as rigid bits~~ (done, Session 775).

### Session 773: the bound, the hop, the sideways walk, the pincer
Five more plans, and the kit gained what they needed:
- **Flights.** A gait's flights (the stretches of the stride with no foot down) are found by sampling the stride once. In each, the body follows a ballistic arc, h = g t² / 8 at the top for a flight of t seconds. A trot barely leaves the ground; a hare's bound and a frog's hop do. The swinging feet rise with the body.
- **Two gaits:** the *bound* (hinds together, then fores together, the spine flexing) and the *hop* (every foot at once). The hop is a pulse: the body covers only the stance's short sweep while its feet are down and the rest in the air, so a frog's feet stay planted.
- **Two leg presets:** a hare's hind leg (a long foot from the hock) and a frog's (folded in a Z).
- **A heading:** the way a plan walks in its own frame. A crab's is 90°, and the same feet and solver walk it sideways.
- **The pincer:** an arm with a swollen hand and two fingers, for scorpions and crabs. Also eye stalks, a throat sac that fills and empties, and a **saddle**, the first thing hung on a socket for a rider. It sits on the fur, not under it.
- **A plan at another size:** the post hare of OG-077 is the Snowleap Hare's parts at 5.5 times, with a saddle: a plan is three lines when it is another plan.

| Plan | Source | Bones | Triangles | Legs | Gaits |
|---|---|---|---|---|---|
| Snowleap Hare | OG-031, OG-084 | 26 | 20,400 | 4 | bound, walk |
| Post hare | OG-077 | 26 | 19,900 | 4 | bound, walk (4.8 m/s bounding) |
| Bellthroat | OG-040 | 22 | 11,500 | 4 | hop |
| Dunescorpion | OG-030, OG-085 | 60 | 59,200 | 8 + pincers | walk, trot |
| Tidecrab | OG-016, OG-047 | 51 | 46,300 | 8 + pincers | walk, trot (sideways) |

All fifteen plans pass the check. Every foot reaches its target through every gait, including the flights and the pulse, and the ten older plans are unchanged.

### Session 774: fins and radial bodies
The last two parts the catalogue needed:
- **Fins.** Each fin is a thin sheet on a bone of its own, so the pose can flutter it. A fin is an outline in its own plane (back along the body, out from it), scaled by length and height: a *tri* for a dorsal, pectoral, pelvic or anal fin, a *fork* for a tail. A fork upright is a fish's tail; laid flat it is a whale's flukes. Fins hang off the spine at any t, or off the tail's end.
- **Radial arms.** Chains from a ring round a centre, each sinking and bending by a number of degrees a bone, kept off the floor where they lie on it. Thick ones are flesh (an octopus's arms, a jellyfish's oral arms); thread ones are thin tubes that glow in HDR for the bloom (a jellyfish's tentacles).
- **Three gaits without feet,** paced in body lengths a second with a stride of 0.7 of the body:
  - *swim:* a wave from head to tail, growing toward the tail. A whale's runs in the vertical plane, and the pectorals flutter.
  - *crawl:* a ripple round an octopus's ring of arms.
  - *drift:* a jellyfish's bell beats, closing at the rim, and its threads trail.
- **Footless plans.** A plan may now be all spine and arms, a bell, or no head at all. The page draws a water surface for a swimmer.

| Plan | Source | Bones | Triangles | Gaits |
|---|---|---|---|---|
| Riverjaw Salmon | OG-031 | 18 | 16,300 | swim (1.2 m/s) |
| Storm Whale | OG-016, OG-084 | 19 | 8,800 | swim (3.3 m/s, vertical) |
| Giant octopus | OG-084, OG-016 | 68 | 53,600 | crawl |
| Wisp | OG-018 | 139 | 27,100 | drift |

Nineteen plans pass. With fins and radial arms, every skeletal creature in the concept art has a plan the kit can build.

### Session 775: shells and feathered wings
The last two pieces the catalogue asked for:
- **The shell.** A rigid dome over the spine with a rim and a flat plastron. Its scutes are the cells of a hexagonal lattice seen from above: the seams darken, each scute has its own shade, and growth rings run round its centre. A shell may carry a garden (ferns and flowers rooted in moss on the top, as the Mossback does) or a sail along its crest (the Sailshell's, striped, its edge rippled by the spines).
- **Feathered wings.** Humerus, forearm and hand, with the flight feathers as tapered cards. The secondaries are laid back along the forearm with their coverts over them; the primaries fan off the hand from back to out; tertials sit at the shoulder. Each feather is rigid on its bone and darker at the tip. A bird's tail is a fan of the same feathers. The wing folds in a Z against the body at rest and beats in flight, rising a little folded.
- **Soaring:** a gait for a bird in the air. The body rises to the plan's flying height, the legs tuck up under it, and the wings beat.
- **A plan written as a function of a few numbers:** both tortoises are one body with a different shell, and the raven and the hawk one bird with a different beak, eye, colour and primaries.

| Plan | Source | Bones | Triangles | Gaits |
|---|---|---|---|---|
| Mossback | OG-040 | 26 | 47,900 | walk (0.2 m/s) |
| Sailshell | OG-040 | 26 | 47,800 | walk |
| Skyraven | OG-031 | 24 | 37,400 | hop, soar, walk |
| Crag Hawk | OG-009, OG-047 | 24 | 39,000 | soar, walk |

Twenty-three plans pass. Every plan in the table above now has at least one creature built, except the human rig's (the people's builder, B1 to B4) and the kits that are not skeletal.

### What adding a creature is
A new entry in `PLANS`: a name, its source sheet, a palette, its gaits, and its parts with numbers. The Mineprowler is a dozen lines. No new code unless the creature needs a part the kit does not have yet.

## The tool
A page beside the mesh inspector (`index.html?builder`, or its own page in the prototypes until the foundation lands):
- pick a species; the sliders appear, grouped (body, face, limbs);
- pick a people or a role, and **roll**: a seed inside its ranges; lock any slider and roll the rest;
- dress: garments from the wardrobe kit, each with a colour and a material (wool, linen, leather, fur, mail);
- preview: the slice's renderer, lit as the lane or the hall, with the 1.8 m scale figure beside it, every pose and gait;
- **save** the genome as JSON. Named characters go in `data/genomes/` (Bram, Edna, Corwin, Aldwyn …); crowds go in as ranges per people and role.
The game reads genomes; it never needs the tool.

## In the game
- **Build once, at load:** the genome's morph is computed in JavaScript, baked into one `SkinnedMesh` per body plus its garments, and cached by genome key, as `buildNPCMesh` caches by `name|site` today.
- **Level of detail:** full (20 to 40 thousand triangles, hair cards) within 12 m; a reduced mesh to 40 m; past that a baked impostor. The target is thirty people in view at 60 fps; it has not been measured yet.
- **Animation:** one clip library per skeleton. Humans take CC0 motion-capture clips retargeted to the rig (idle, walk, run, talk, work, sit, fight), with the game's own procedural layers on top (planted feet, look-at, breathing). Creatures keep the procedural gaits the wolves have and gain clips where they need them.
- **Cloth:** no simulation. Layered shells cut from the fitting shells, as the slice does, and the swinging bones the game already gives cloaks and long hair.

## The order of work
1. **B1, the human builder:** the slice's `people.js` made into the tool page, with genome save and load. Women's long hair and braids fixed (owed from Session 770).
2. **B2, the wardrobe kit:** aprons, cloaks, hoods, robes, dresses, armour tiers; brief from OG-025 and the Session 2 clothing sheets (OG-109 to OG-111) once Michael keeps them.
3. **B3, the peoples and the cast:** the four peoples' ranges; the named NPCs' genomes from OG-001's faces.
4. **B4, animation:** the clip library and retargeting.
5. **B5, creatures:** the kit of parts (Session 772, prototype: ten plans). Owed, in order:
   - the fin and radial parts, the hop and the bound, feathered wings, shells;
   - the kit on the builder's page with the people (one tool, one genome format);
   - in the game: the wolves move over first (their `WOLF_KINDS` become plans), then the bear, the spider, the horses and the dragon, then the bestiary sheet by sheet. Two things wait for the foundation's renderer. First, feet on uneven ground: a foot's target takes the ground's height under it, which is one line. Second, turning: the sweep follows the velocity in the body's frame.
6. **B6, in the game:** behind the foundation's switch, replacing `buildPerson` for townsfolk, then foes.

## Risks
- **Size:** the human pack is 7 MB raw. Quantised and gzipped it should be about 3 MB, loaded once and cached.
- **Long hair** is the weakest part of the slice; braids and tied styles (which most of the peoples wear) are easier than loose hair, and come first.
- **Faces at conversation distance** are where a builder lives or dies. B1 is judged on close-ups (`people.html?view=faces`), not on the line-up.
- **Creature base meshes** grown around bones look like the wolves: good at play distance, soft close up. Sculpted targets fix the close views where they matter (a muzzle, a brow).
- **Triangles** (Session 772): the grid is sized to the thinnest limb, so long thin legs cost the most (the spider is 84,500 triangles). The same flesh meshed at two and four times the cell gives the level-of-detail meshes, and a crowd of wolves needs them.
- **Hero creatures** (the Faolchú's close-ups, the dragon) can come from image-to-3D, as the cast may. Then the plan's skeleton is fitted to the mesh at a few landmarks and the weights are read off the same field, which is the bridge that lets a modelled creature walk with the shared gaits. Not built yet.

## Not in this
A general modelling tool. Buildings, props and the gates are built in their own code (the slices' piece builders), not here.
