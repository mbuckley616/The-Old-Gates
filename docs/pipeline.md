# How work lands (Michael's A on the pipeline decision and his B on approvals, 19 Oct 2026)

Work piled up for five reasons. Every PR ran the whole suite, 16 to 20 jobs of up to an hour, and GitHub runs about 20 at a
time, so about 80 sat queued on 19 Oct. Every branch edited the same lines (the build tag, the devlog's end), so each merge
left the other PRs in conflict and back at the start of the queue. Approvals were pinned to one commit and went stale as
builders added to their branches. Each lane kept one standing PR that collected 100+ commits. And only the producer merged,
once every two hours. Michael chose A: fix all five.

## What CI does now
- **A pull request runs only the suites its change can reach** (`tests/lib/select.mjs`, using `tests/lib/toplevel.cjs`).
  Each changed line of a `js/` file sits in one top-level statement; those names and one step of their callers are the
  change's names; a suite runs when it names one, when it changed, or when it is in the smoke set (`looknew`, `saves`,
  `resolver`, `player`, `dungeon`, `autosave`). A change to the page (other than the build tag's line), the harness, the
  vendored three.js, CI or packages runs everything, as does a selection worth more than half the full suite. Measured on
  19 Oct: Bodies 1136–1156 would have run 12 suites in one shard, Quest builds 1092 44 suites in three, QA's last PR 7
  suites in one; each was 16 to 20 shards before.
- **A docs-only PR runs no suites** (parse only). Parse also checks the generated bundles (`three_bundle.py`,
  `people_bundle.py`, `creatures_bundle.py --check`; the last two since Session 1225), so a PR that edits
  `docs/prototypes/levelup/people.js`, a sibling it imports, or `creatures.js` commits the rebuilt `vendor/` copy with it.
- **Main runs every suite after each merge**, and the next merge no longer cancels that run. A break the selection missed
  shows there.
- **One check, `gate`**, says whether a PR may merge: parse passed, and the suites passed or were not needed.
- **Every suite boots the new look** (Session 1226, Michael, 20 Oct 2026). One that is red or too slow there is named in
  `tests/skip.json` and runs nowhere (a QA card in `docs/qa/skipped.md`); striking it from the list runs it in that PR. The
  shards are packed by `tests/times.json`, the new look's seconds per suite; refreshing it is not a harness change and runs
  nothing. A shard has 90 minutes (the new look is about 1.5 times slower; a full run is about 55 minutes a shard at twenty).

## How a PR merges now
- **`automerge`** (`.github/workflows/automerge.yml`, `scripts/automerge.mjs`) runs when a check finishes and every fifteen
  minutes. It merges a PR whose `gate` is green and which merges cleanly, if:
  - it changes only `docs/` and `tests/` (not `tests/lib/`, `tests/run.mjs` or `tests/skip.json`): no approval needed; or
  - Michael approved it: the comment `Approved by Michael: <sha>` on the PR, which the producer posts when he taps Approve
    on the control room. The producer no longer merges by hand.
- Commits after the approved one that change only docs or tests, or merge main in, ride along. Any other later commit waits
  for a new tap, and the approved commit lands alone meanwhile (a merge of exactly that commit), so an approval never goes
  stale.
- After a merge it starts `check` (every suite) and `stamp` on main, since a merge made with the workflow's own token starts
  no workflow by itself.

## The build tag
- **`stamp`** (`.github/workflows/stamp.yml`) bumps the tag on main after each merge, in a commit marked `[skip ci]`, and asks
  for the Pages build. **No branch bumps it any more**: that one shared line was the commonest conflict.

## What changes for every session (in CLAUDE.md since this PR, Michael's explicit go in chat)
1. **The files:** `docs/devlog/NNNN.md`: one file per session, named by its number, written at the end of the session.
   `docs/devlog.md` is the archive up to Session 1145; add nothing to it.
2. **A session, step 6:** do not touch the build tag; `stamp` sets it on main.
3. **A session, step 7:** write `docs/devlog/NNNN.md`, mark the backlog, commit. A question for Michael goes in that file
   under `### Decision` and in a `DECISION:` issue; the producer copies it into `docs/decisions.md`, its one writer.
4. **Cloud sessions:** the paragraph above, *How a PR merges now*, replaces "the producer routine merges it through GitHub
   once Michael approves it".
5. **Producer:** on Michael's tap, post `Approved by Michael: <sha>` on the PR; merge nothing by hand; fold sessions'
   `### Decision` sections into `docs/decisions.md`; revert a merge whose red on main is not fixed within the day.
6. **Small batches:** keep a branch's unapproved gameplay work small; what waits for a tap is what blocks.

## Approvals: designs, not merges (Michael's B, 19 Oct 2026, in chat)
Michael, explicitly: "PRs building already-decided work merge automatically once their tests pass, without my review,
except PRs labelled hold and PRs that change the CI/test pipeline." His control stays where it was real: every design
question is a `DECISION:` before it is built, and he judges the result by playing. A PR labelled `hold` (any role may put it
on, saying why; Michael may put it on anything) and a PR that changes the pipeline itself (`.github/`, `tests/lib/`,
`tests/run.mjs`, `scripts/automerge.mjs`) wait for `Approved by Michael: <sha>`. Main runs every suite after each merge; a
red there is fixed first or reverted the same day. This replaces "How a PR merges now" above where they differ.

## One small PR per run
Every run starts a fresh branch from main (`auto/<lane>-<session>`), opens its own PR and leaves it to land; nothing is
added to it after the run ends, and no branch lives from run to run. The standing PRs of before (*Systems sessions*, *Auto
sessions*, *Bodies sessions* and the rest) land once and are not reopened.
