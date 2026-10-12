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
5. **B5, creatures:** the canid first (the wolves move over), then the rest of the table.
6. **B6, in the game:** behind the foundation's switch, replacing `buildPerson` for townsfolk, then foes.

## Risks
- **Size:** the human pack is 7 MB raw. Quantised and gzipped it should be about 3 MB, loaded once and cached.
- **Long hair** is the weakest part of the slice; braids and tied styles (which most of the peoples wear) are easier than loose hair, and come first.
- **Faces at conversation distance** are where a builder lives or dies. B1 is judged on close-ups (`people.html?view=faces`), not on the line-up.
- **Creature base meshes** grown around bones look like the wolves: good at play distance, soft close up. Sculpted targets fix the close views where they matter (a muzzle, a brow).

## Not in this
A general modelling tool. Buildings, props and the gates are built in their own code (the slices' piece builders), not here.
