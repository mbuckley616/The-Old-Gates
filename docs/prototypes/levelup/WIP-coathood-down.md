# WIP: the coat's hood lying down (bodies builder, after Session 1152)

Not merged into auto/bodies. `buildCoatHoodDown` in `people.js` lays a wool roll round the back of the coat's collar. It clears the coat and its fur by 4.1 to 5 mm (pushed out iteratively, away from the deepest point). `builder.check.mjs` passes 498 of 498.

What is wrong, from `builder-coathood-down-plain.jpg`: `buildHair`'s nape clearance for a coat with its hood down (`coatC`, 12 cm) pushes a ponytail's strands 12 cm off the nape. The tie stays at the gather point, so the tail hangs detached from its tie and comes out through the roll. The check's hair count (`hairIn`/`hairN`) saw no hair points on that man (`hairN` 0), so it missed it. It reads only meshes named `hair` below the crown + 0.1; the tail's mesh or its height is not what that filter expects.

Next: count every hair mesh the tail and braids build. Keep the hair's clearance as the tunic's, and lay the tail and braids over the roll: the tail's path should go round the roll's tube, not off the body. Or lower the roll under the tie. The roll's dark faces in the pictures may want its normals checked.
