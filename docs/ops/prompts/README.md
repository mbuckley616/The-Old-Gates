# The routine prompts, rewritten once (draft for Michael, 19 Oct 2026)

On 19 Oct the landing rules changed: a fresh branch and one small PR per run, merge on green, PRs test what they touch, the
build tag stamped on main, the devlog as one file per session, and the producer as the only writer of docs/decisions.md.
Six Old Gates prompts got those rules as a "Read first … this block wins" block on top of bodies that still said the
opposite; four got nothing. This folder is the clean rewrite: every enabled routine of The Old Gates and Neighborhood
Airsoft, old against new, and the CLAUDE.md change they depend on. **Nothing is applied yet.**

The method: rules every routine shares go in CLAUDE.md once ([claude-md.md](claude-md.md), a new section "A routine's
run"); a prompt holds only its role, its files, its order of work and what is particular to it. No prompt says "this block
wins" any more. Airsoft has not adopted the new pipeline (its test-what-you-touch change is open PR #100; its builder still
uses `auto/build` and Michael's approvals), so its prompts were checked against Airsoft's own CLAUDE.md and each other, and
fixed only where they contradict.

| Routine | File | Size now → proposed | What was wrong |
|---|---|---|---|
| Look builder ("backlog sessions") | [look.md](look.md) | 16.0k → 4.2k | override vs body on branch, tag, devlog, decisions.md |
| Systems builder | [systems.md](systems.md) | 14.4k → 3.7k | the same |
| Bodies builder | [bodies.md](bodies.md) | 12.7k → 3.7k | the same |
| QA and CI | [qa.md](qa.md) | 8.7k → 4.3k | the same, and an order that put a built item last |
| Producer | [producer.md](producer.md) | 30.2k → 18.8k | the body merged; the override said never |
| Deep-work session | [deepwork.md](deepwork.md) | 10.2k → 6.6k | who closes the FREEZE; no run would notice the merge |
| Quest writer | [quest.md](quest.md) | 12.3k → 8.9k | decisions.md, standing branches |
| Critic | [critic.md](critic.md) | 6.1k → 5.9k | **reads only docs/devlog.md: sees no session since 1145** |
| Concept artist | [concept.md](concept.md) | 4.1k → 3.8k | writes decisions.md, standing branch |
| Systems designer | [designer.md](designer.md) | 10.1k → 5.6k | writes decisions.md, standing branch, spent steps |
| Airsoft builder | [as-builder.md](as-builder.md) | 6.6k, unchanged | nothing found |
| Airsoft producer | [as-producer.md](as-producer.md) | 23.2k, one name | names a routine that does not exist |
| Airsoft critic | [as-critic.md](as-critic.md) | 4.8k, two lines | `gh` where the rest use the GitHub tools |
| Airsoft deep-work session | [as-deepwork.md](as-deepwork.md) | 11.5k, two lines | messages Michael directly; a diff with two dots |

## The contradictions, and how each was settled
1. **Branches.** Six bodies checked out, merged into and pushed a standing branch (`auto/backlog`, `auto/systems`,
   `auto/bodies`, `auto/qa`, `auto/quests-build`, the card branch) and kept one standing PR; their overrides said a fresh
   branch per run. The critic, concept artist, designer and the quest writer's docs still used standing branches with no
   override, and CLAUDE.md's Roles still named them. *Settled:* a fresh `auto/<lane>-<N>` (or `-<MMDD>` for a lane without
   sessions) every run, in CLAUDE.md; the deep-work card is the one named exception.
2. **The build tag.** Bodies ran `tag.py bump`; overrides said never. *Settled:* never (CLAUDE.md step 6 already says so).
3. **The devlog.** Bodies appended to `docs/devlog.md` and read its last entries; it closed at Session 1145. *Settled:*
   `docs/devlog/NNNN.md`, numbered across both.
4. **docs/decisions.md.** The builders, deep work, quest writer, concept artist and designer all wrote `## Pending` (and the
   builders moved answers to `## Answered` and closed issues); the producer is now its one writer, and CLAUDE.md's room rules
   still said "docs/decisions.md and a DECISION: issue remain the way to raise one". *Settled:* a `DECISION:` issue (plus
   `### Decision` in a devlog file); the producer copies it, writes the `Michael:` line, moves it and closes the issue.
5. **Merging.** The producer's body merged approved commits, docs PRs, Michael's own PRs and QA's PRs, and merged main into
   builders' branches; its override said never. *Settled:* automerge merges; the producer handles only held and pipeline
   PRs, by posting `Approved by Michael: <sha>`.
6. **Who opens and closes the FREEZE.** CLAUDE.md said the producer opens and closes it; the deep-work prompt opens it; the
   producer's body closes it on merge; both overrides say the deep-work session closes it. And the deep-work pick never looks
   at a finished card again, so no run would see its PR land. *Settled:* the deep-work session opens it and, in an upkeep step
   at the start of every run, closes it once the card's PR has landed; the producer closes only an orphan.
7. **The producer's orphan rule** would lift a freeze two hours after a card finished, while its PR still waited. *Settled:*
   a card in review with its PR open holds the freeze.
8. **The critic** has been blind since 19 Oct: it reads "every docs/devlog.md entry newer than" its last, and new sessions
   are files in docs/devlog/. *Settled:* it reads docs/devlog/ and records the session it read to.
9. **Answers.** Builders counted "a comment by Michael on a DECISION issue"; he never opens GitHub. The deep-work session
   read answers on `origin/auto/producer`, which no longer collects them. *Settled:* the `Michael:` line on main (and, for the
   deep-work session, the board's card).
10. **Stale steps** removed: QA asked to build the CI selection that is built; the designer still had the spent vertical-slice
    page and five build sheets that exist; the producer said "F2a is queued"; the look builder and systems builder waited on
    F2a and combat's resolver, both merged 15 and 16 Oct; the look override pointed at "2.0 only" rules that are on no branch
    until PR #443 lands.
11. **Airsoft.** The deep-work session sent Michael a PushNotification although the producer is "the only agent that talks to
    Michael" (now the stuck card, which the producer carries); its pre-freeze diff used two dots and so blocked on main's own
    changes (now three, as Old Gates fixed); the producer named "Airsoft — Fable session" (the routine is "Airsoft — Deep Work
    session"); the critic used `gh` where its siblings say it may be missing.

## New rules, not just reconciliation (for Michael to accept or strike)
- **Section I first** (his rule): "A backlog section I item that names your role comes before card or prototype work." The
  critic and QA now name the owner on every section I line, so the rule finds them.
- **Draft PRs until the run ends**, so a PR cannot merge under a run that is still pushing (see claude-md.md).
- **One freeze rule by path** (same effect as the six versions it replaces).
- The critic, concept artist and designer gain the one Slack post CLAUDE.md already asks of every session.
- Airsoft's deep-work session no longer messages Michael itself.

## Left alone, for follow-ups
- Airsoft's CLAUDE.md says "three routines" (there are four), the producer runs "every 3 hours at :55 UTC" (it is hourly;
  open Airsoft PR #86 fixes this) and the Fable session runs on "model Fable" (it runs on Opus).
- Hearthgate's four routines are off and untouched.
- The routines' tools and connectors (the OG deep-work session has no Slack connector, which its prompt already allows for).

## How it would be applied
1. Michael's go in chat on CLAUDE.md: one PR changes CLAUDE.md as [claude-md.md](claude-md.md) shows; it lands on green.
2. Once it is on main, Michael's go on the prompts: each routine's prompt only is updated (`RemoteTrigger update`), never
   its schedule or enabled flag, from the "new prompt" block of its file here; each is checked with a `get` afterwards.
   Airsoft's three can go at any time: they do not depend on the CLAUDE.md change.
