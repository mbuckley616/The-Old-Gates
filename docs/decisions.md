# Decisions

Questions the agents need Michael to answer, and his answers. An agent that needs a design call writes the question under **Pending** (and opens a `DECISION:` issue for the phone ping); Michael answers here, in chat with Claude, who writes the line beginning `Michael:`; the agent acts on it and moves the entry under **Answered** with a note of what it did. Nothing here is a spec until it carries a `Michael:` line.

## Pending

## Answered

### Wolves — the first creature on the shape kit (Session 163, issue #4)
Michael: Yes, build it. Same style as the townsfolk; fix the joint tubes, the heavy chest and the lunge's hind legs in the build. The other families (spiders, undead, dragon, mimic, bandits) follow the same way. (27 Sep 2026)
Done, Session 166 (auto): the four wolf kinds are in the game on the shape kit — a planted-paw trot and gallop, the crouch and spring, the joints knobbed and the limbs muscled rather than tubes, the chest narrowed (.63 of the body's breadth, against the prototype's .74), the lunge's hind legs driving back straight by IK. The other families are next, one session each.

### Plants — herbs sized and shaped by what they are (Session 164, issue #5)
Michael: Yes, at the prototyped sizes, and picking leaves the plant: a picked bush or sapling stays, minus its berries or leaves, and regrows. The tallest kinds cast shadows if a dense forest chunk's frame time allows. (27 Sep 2026)
Done, Session 167 (auto): the plants are in at the prototyped sizes; the two berry bushes, the rowan, the ashwort, the briarweed and the bracket stump stay when picked and grow back; goldenrod, the rowan, the thornberry, the moor tussock and wolf's bane cast shadows within 45 units of you. The frame check found that all loaded herbs together would be 1.8M triangles, so herbs are now drawn only within 100 units (137k in a loaded forest-edge frame, against about 400k for today's tufts over every loaded chunk).

### Boats — lofted hulls and rigging (Session 165)
Michael: Yes, with the rigs per class as proposed (sloop gaff sail, cog one square sail, galleon three masts) and the pirate and merchant looks. Fill the sails, add ratlines, fix the spritsail; the deck walk and the cabin door match the new hull. (27 Sep 2026)
Done, Session 168 (auto): the three classes, the two looks and the harbour boats are in the game with their rigs. The sails are filled (bellied most in the middle and low, the foot curving up at the corners); the shrouds carry ratlines; the galleon's spritsail hangs from a yard a third of the way out along the bowsprit. You stand on the deck only where the hull is. The hatch (the cabin door) and the wheel keep their places, both on the new deck.
