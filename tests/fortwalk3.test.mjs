// The forts in real play, the fifth and sixth nearest home (Session 2756, QA): `fortwalk`'s body for the next two forts.
// Split for CI's 900 s cap: with the towns, garrisons and outposts dressed (#2058) the six-fort suite took 1,287 s beside one other boot,
// and both tries of the card's full check (45916097237, shard 20) were cut in the fifth fort. The checks are fortwalk's own, unchanged.
globalThis.FORTWALK_PART = [4, 6];
await import('./fortwalk.test.mjs');
