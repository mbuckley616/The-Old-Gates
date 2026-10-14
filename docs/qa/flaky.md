# Flaky and red suites — QA's ledger

One row per suite that went red on CI for a reason that was not the change's. Worst first by runs cost in the last three
days. Columns: suite, runs failed (with the run ids), cause, fixed or filed (and by whom), session. Kept by the QA routine
(`auto/qa`); started 14 Oct 2026. Before this ledger the list lived in backlog K ("The suites that fail on CI and pass on a
retry"), cleared by Sessions 797–814.

| Suite | Runs failed | Cause | Fixed or filed | Session |
|---|---|---|---|---|
| `lookpair` | 4 of 6 completed runs of shard 6, 14 Oct 03:36–12:42 UTC. Red: 38507110894 (auto/systems, dfea40a, already carrying S830), 38507599215 (auto/backlog, 1b98f38), 38510809279 (claude/team-2.0, docs only), 38542091504 (auto/critic, ed17e41, docs only; 433 s, red on the retry). Green: 38547263251 (auto/backlog, 03404d0) and 38555862523 (main, 0a193c4, 382 s, passed first try, no `tests/` change since the red runs). So it is intermittent, not broken: about two runs in three, ~440 s a try. | The F1 pair (old look against new at Dunmore noon) reads a picture before the scene has settled. A green run on unchanged code backs this: the picture depends on how far loading got, not on the build. S830 made it wait for the frame meter's reading, and it still failed on the systems run. S832 takes lying snow off before both shots. | Being fixed by the systems builder on `auto/systems` (PR #288): S830 (not enough on its own) and S832 (b1164be). #288's run 38563070020 on be20097 (main merged in) was still in progress at 12:52. Not ported here: FREEZE #297 holds `tests/`. Until #288 merges, a branch cut from main carries a red shard 6 about two runs in three. | — (read 14 Oct 06:54 and 12:52, under FREEZE #297) |

## CI time, the same window
- Main's run 38555862523 (0a193c4, 11:20–12:46 UTC): the 12 headless shards took 42–56 min each (shard 4 the shortest at
  42 min, shard 11 the longest at 56). Every shard finished, none was cancelled; the run took 86 min wall time, 19 of them queued.
- Every headless shard ran 41–58 min on 14 Oct (shard 6 the longest at 58 min with lookpair's two 440 s tries): close to the
  hour. The producer merged #293 with shard 11 "cancelled at the hour on backed-up runners".
- Most runs in the window were `cancelled`, superseded by the next push to the same branch (the bodies builder pushed eight
  times in an hour). A run's 13 jobs queue for up to 90 minutes behind other branches' runs, so wall time is two to two and a
  half hours a run.
- Owed once the freeze lifts: rebalance the shards from these timings (`run.mjs`'s table), and backlog K's "CI runs only the
  suites a change touches".
