// Saves by place, the other three rooms (Session 2001, QA): `placerooms`' body with the guild hall, the church and the inn's cellar.
// Split for CI's 900 s cap: the weekly run of 8 Nov (42479827264, shard 7) took 166–196 s a round trip and killed both tries of the
// six-room suite in its fourth room. The checks are placerooms' own, unchanged.
globalThis.PLACEROOMS_KINDS = ['guild_f', 'church', 'cellar'];
await import('./placerooms.test.mjs');
