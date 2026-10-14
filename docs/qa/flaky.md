# Flaky and red suites — QA's ledger

One row per suite that went red on CI for a reason that was not the change's. Worst first by runs cost in the last three
days. Columns: suite, runs failed (with the run ids), cause, fixed or filed (and by whom), session. Kept by the QA routine
(`auto/qa`); started 14 Oct 2026. Before this ledger the list lived in backlog K ("The suites that fail on CI and pass on a
retry"), cleared by Sessions 797–814.

| Suite | Runs failed | Cause | Fixed or filed | Session |
|---|---|---|---|---|
| `lookpair` | 3 of 3 completed runs of shard 6, 14 Oct 03:36–06:00 UTC: 38507110894 (auto/systems, dfea40a, already carrying S830), 38507599215 (auto/backlog, 1b98f38), 38510809279 (claude/team-2.0, docs only). Red on the retry each time, so red, not FLAKY. ~440 s a try. | The F1 pair (old look against new at Dunmore noon) reads a picture before the scene has settled. S830 made it wait for the frame meter's reading, and still failed on the systems run; S832 takes lying snow off before both shots. | Being fixed by the systems builder on `auto/systems` (PR #288): S830 (not enough on its own) and S832 (b1164be, not yet run green on CI). Not ported here: FREEZE #297 holds `tests/`. Until #288 merges every branch cut from main carries a red shard 6. | — (read 14 Oct, under FREEZE #297) |

## CI time, the same window
- Every headless shard ran 41–58 min on 14 Oct (shard 6 the longest at 58 min with lookpair's two 440 s tries): close to the
  hour. The producer merged #293 with shard 11 "cancelled at the hour on backed-up runners".
- Most runs in the window were `cancelled`, superseded by the next push to the same branch (the bodies builder pushed eight
  times in an hour). A run's 13 jobs queue for up to 90 minutes behind other branches' runs, so wall time is two to two and a
  half hours a run.
- Owed once the freeze lifts: rebalance the shards from these timings (`run.mjs`'s table), and backlog K's "CI runs only the
  suites a change touches".
