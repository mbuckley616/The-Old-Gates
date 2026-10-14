# Flaky and red suites — QA's ledger

One row per suite that went red on CI for a reason that was not the change's. Worst first by runs cost in the last three
days. Columns: suite, runs failed (with the run ids), cause, fixed or filed (and by whom), session. Kept by the QA routine
(`auto/qa`); started 14 Oct 2026. Before this ledger the list lived in backlog K ("The suites that fail on CI and pass on a
retry"), cleared by Sessions 797–814.

| Suite | Runs failed | Cause | Fixed or filed | Session |
|---|---|---|---|---|
| `lookpair` | 4 of 6 completed runs of shard 6, 14 Oct 03:36–12:42 UTC. Red: 38507110894 (auto/systems, dfea40a, already carrying S830), 38507599215 (auto/backlog, 1b98f38), 38510809279 (claude/team-2.0, docs only), 38542091504 (auto/critic, ed17e41, docs only; 433 s, red on the retry). Green: 38547263251 (auto/backlog, 03404d0) and 38555862523 (main, 0a193c4, 382 s, passed first try, no `tests/` change since the red runs). So it is intermittent, not broken: about two runs in three, ~440 s a try. | The F1 pair (old look against new at Dunmore noon) reads a picture before the scene has settled. A green run on unchanged code backs this: the picture depends on how far loading got, not on the build. S830 made it wait for the frame meter's reading, and it still failed on the systems run. S832 takes lying snow off before both shots. | Being fixed by the systems builder on `auto/systems` (PR #288): S830 (not enough on its own) and S832 (b1164be). #288's run 38563070020 on be20097 (main merged in) was still in progress at 12:52. Not ported here: FREEZE #297 holds `tests/`. Until #288 merges, a branch cut from main carries a red shard 6 about two runs in three. **Fixed** (read 18:55): #288 merged at 14:41 (main 63d1506), and every completed run carrying it passed lookpair on the first try, no retry warning: 38588484699 (auto/producer, 0db7ff7), 38602199426 (auto/backlog, b40d653), 38605632652 (main, 88d55dd). Three green, so the flake is closed. A branch not yet merged with main after 14:41 still carries the old lookpair. | — (read 14 Oct 06:54, 12:52 and 18:55, under FREEZE #297) |
| `bridgenames` | 1 run, failed then passed on the retry: 38590337203 (auto/bodies, c4bf2e2, shard 3, 14 Oct 16:18). Red check: *no two named places share a name*, with `["Shrine of Na Beithígh"]`. The other green runs of the afternoon passed it first try. | A game bug, not the test's. `buildShrine` (`js/87-world-quests.js`, the line `site.name=`Shrine of ${god.name}``) renames a shrine to its god when its cell builds, after the naming pass of Session 756 (`js/81-world-cells.js`, `POI_FORM`) gave it a unique name. Two shrines of one god collide only when both cells have built, so whether the check sees it depends on what the ten walked cells pulled in: intermittent. The test is right to fail. | To file in backlog I for the systems builder (`87`, by the code map) once FREEZE #297 lifts; named in the QA Slack post's Need line for the producer meanwhile. The fix is the game's: keep the unique name, or run the god's name through the same pass. | — (read 14 Oct 18:55, under FREEZE #297) |

## CI time, 14 Oct afternoon (read 18:55)
- Main's run 38605632652 (88d55dd, 17:19–18:37 UTC, the first main run with #288): the 12 headless shards took 42–58 min.
  Shortest: 11 (42), 3 (43), 7 (48). Longest: 6 (58), 9 (57), 4 (57), 5 (56). A 16-minute spread; moving one suite of
  about 5 min from shard 6 or 9 to shard 11 or 3 would bring the longest under 55. Owed when the freeze lifts.
- Every completed run since 12:52 was green or `cancelled` (superseded by a newer push to the same branch); none red.
  Of 44 check runs started after 11:00, 8 completed green, 34 were cancelled and 2 are still running; the bodies builder's branch alone had 16 cancelled, the look builder's 14.
- The `parse` job's annotation *Process completed with exit code 1* on every run is `scripts/split.py --check`, which runs
  with `continue-on-error` (kept one release, decision #75); the job passes. Not a regression.
- From 19 Oct the `ubuntu-latest` label moves to Ubuntu 26 (a notice on every job): the first runs after that date are worth
  a look for install-step changes (`playwright install --with-deps`).

## CI time, the earlier window
- Main's run 38555862523 (0a193c4, 11:20–12:46 UTC): the 12 headless shards took 42–56 min each (shard 4 the shortest at
  42 min, shard 11 the longest at 56). Every shard finished, none was cancelled; the run took 86 min wall time, 19 of them queued.
- Every headless shard ran 41–58 min on 14 Oct (shard 6 the longest at 58 min with lookpair's two 440 s tries): close to the
  hour. The producer merged #293 with shard 11 "cancelled at the hour on backed-up runners".
- Most runs in the window were `cancelled`, superseded by the next push to the same branch (the bodies builder pushed eight
  times in an hour). A run's 13 jobs queue for up to 90 minutes behind other branches' runs, so wall time is two to two and a
  half hours a run.
- Owed once the freeze lifts: rebalance the shards from these timings (`run.mjs`'s table), and backlog K's "CI runs only the
  suites a change touches".
