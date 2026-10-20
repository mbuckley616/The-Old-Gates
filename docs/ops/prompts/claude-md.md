# CLAUDE.md: the proposed change (not applied)

The new prompts lean on CLAUDE.md for every rule the routines share, so this change lands first and the prompts follow it
the same hour. Nothing here is applied until Michael says so in chat.

What it does:
- **Adds "A routine's run"**, after "Cloud sessions": the cheap checks, the freeze, the overlap rule, session numbers, one
  branch and one PR a run, a red of your own first, **section I next** (Michael's rule: "A backlog section I item that names
  your role comes before card or prototype work"), how answers arrive, how to ask, the stuck path, labels, and the standing
  rules every prompt used to copy (the commit trailer, never push main, never force-push, never delete a test, script tags,
  when to edit CLAUDE.md, one Slack post).
- **One freeze rule by path** instead of one per prompt: under a `FREEZE:` issue nobody but the deep-work session touches
  `js/`, `index.html`, `tests/` or `.github/`; work elsewhere goes on, and a run with none ends. That is what each prompt
  already did (the systems builder ends, the look and bodies builders keep to the prototypes, QA keeps to its ledgers, the
  quest writer drafts), now said once.
- **Draft PRs until the run ends.** New, and the one rule here no prompt had: automerge merges a green PR within fifteen
  minutes, so a PR opened after a run's first session can land while the run is still working, and the later sessions' commits
  are left on a merged branch with no PR. A draft is skipped by automerge (`scripts/automerge.mjs` line 61) until the run marks
  it ready at its end; a draft left by a run that died is marked ready by the lane's next run.
- **Removes "These landing rules win over anything a routine's own prompt still says"**: with the prompts rewritten there
  is nothing left for it to win over.
- **Fixes Roles**: it named the old standing branches (`auto/backlog`, `auto/bodies`, `auto/systems`, `auto/qa`) and said the
  producer opens the FREEZE, while the deep-work prompt opens it; now lanes by prefix, and the deep-work session opens and
  closes its freeze (the producer closes an orphan).
- **Fixes the room's Decisions bullet**: "`docs/decisions.md` and a `DECISION:` issue remain the way to raise one" said the
  opposite of "the producer is the one writer of that file"; now the issue alone.

~~~~diff
--- a/CLAUDE.md.now
+++ b/CLAUDE.md.proposed
@@ -149,14 +149,48 @@ itself (`.github/`, `tests/lib/`, `tests/run.mjs`, `scripts/automerge.mjs`), whi
 before anything is built. Main runs every suite after each merge: a red on main is the next run's first job for the builder
 that owns it, and the producer reverts the merge if it is not fixed within the day.
-**These landing rules win** over anything a routine's own prompt still says about branches, the build tag, the devlog,
-decisions.md or merging (prompts written before 19 Oct 2026 may say otherwise).
-**One small PR per run:** every run starts a fresh branch from main (`auto/<lane>-<session>`, the run's first session
-number), does its sessions there, opens its own PR, and leaves it to land. No branch is kept or reused from run to run, and
-nothing is added to a PR once the run that opened it has ended (a red that is your own fault is fixed in the next run's PR).
 Only the producer routine notifies Michael (PushNotification) or writes to the control room; every other session,
-cloud or local, raises questions in its devlog file and a `DECISION:` issue (the producer copies them into
+cloud or local, raises questions as a `DECISION:` issue (below; the producer copies them into
 `docs/decisions.md`, the one writer of that file) and stays silent — the producer
 carries them to him. A second notification for the same question is noise.
 
+## A routine's run (Michael, 19 Oct 2026: every scheduled routine reads this; its prompt holds only its role, files and order of work)
+- **Cheap checks first.** `git fetch origin`, then the checks below, then decide what the run can do; a run with nothing
+  workable ends before `npm install`.
+- **Freeze.** `gh issue list --state open --search "FREEZE: in:title" --json title -q '.[].title'` (or the GitHub tools).
+  While an open issue's title begins `FREEZE:`, a deep-work card is rewriting files the builders share: touch nothing under
+  `js/`, `index.html`, `tests/` or `.github/`. Work that lives elsewhere (the prototypes, docs) goes on; a run with none
+  ends at once. The deep-work session opens the issue when it takes a card that freezes, and closes it when that card's last
+  PR has merged; the producer closes one left open two hours with no card behind it.
+- **Overlap** (the builders and QA): if the newest `origin/auto/<lane>-*` branch's latest non-merge commit is under 50
+  minutes old, another run is working: end.
+- **Session numbers:** one above the highest session in `docs/devlog.md` and `docs/devlog/*.md` across origin/main, every
+  origin/auto/* branch and yours. A duplicate after a merge: renumber yours and say so in the entry.
+- **One branch, one PR.** Every run starts a fresh branch from origin/main: `auto/<lane>-<N>` (N, the run's first session),
+  or `auto/<lane>-<MMDD>` for a lane that writes no sessions. Never check out, merge into or push an earlier run's branch or
+  the old standing ones (`auto/backlog`, `auto/systems`, `auto/bodies`, `auto/qa`, `auto/quests`, `auto/critic`, …). Commit
+  and push after every session. Open the run's PR as a **draft** after its first session (automerge skips drafts) and mark it
+  ready when the last session is pushed: `<Lane>: Sessions N–M` (or the lane's own title), label `auto`, no reviewer, no
+  assignee, its body one line per session (what changed, what the tests showed, what needs eyes). Nothing is added to it once
+  the run has ended; a draft left by a run that died is marked ready by the lane's next run. The deep-work card is the one
+  exception: its runs continue the card's branch, `auto/fable-<id>`, and once a PR from it has landed carry on from a fresh
+  `auto/fable-<id>-2` (then `-3`).
+- **A red of your own first.** If your earlier change turned main or one of your PRs red, fixing it is the run's first
+  session, on this run's branch. A flaky suite you did not touch is QA's.
+- **Section I next.** A backlog section I item that names your role comes before card or prototype work.
+- **Michael's answers** arrive as a `Michael:` line under the question in `docs/decisions.md` on origin/main (the producer
+  writes it and closes the `DECISION:` issue). Act on it; an unanswered question means leave that item and take another.
+- **Asking.** A `DECISION: <what>` issue, label `decision`, assigned to mbuckley616: the question in plain words, 2–4 lettered
+  options, the recommendation marked, pictures linked raw from your branch
+  (`https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/<branch>/<path>`). A session with a devlog file copies it
+  there under `### Decision`. Never in `docs/decisions.md`. Then take another item.
+- **Stuck.** Never push broken work: commit it to `auto/wip-<short-name>`, push, open `STUCK: <what>` (label `stuck`,
+  assigned to mbuckley616: what you tried, what you saw, what you would try next), end the run.
+- **Labels**, if missing: `gh label create auto --color 6a5acd -f; gh label create decision --color d93f0b -f;
+  gh label create stuck --color b60205 -f`.
+- **Always:** commits end `Co-Authored-By: Claude <noreply@anthropic.com>`. Never push main, never force-push, never
+  rewrite an old devlog entry, never delete or skip a test to get green, never add, remove or reorder a `<script src>` tag by
+  hand (a new file is its own decision). Change CLAUDE.md only to add a gotcha you hit, or where your item changes what it
+  describes. At the end of a run that did something, one Slack post (the room, below).
+
 ## The room — Slack #old-gates (channel id C0C547EFP6G)
 The team talks in one Slack channel, through the Slack connector (tools named `slack_*`; load them with ToolSearch).
@@ -173,5 +207,5 @@ Every session, cloud or local, that has the tools:
 - **Decisions** are the producer's alone: it posts each question as a message with lettered options and Michael
   answers in the thread or with a letter reaction (🇦 🇧 🇨 🇩). No other session posts a question to the channel
-  or pings Michael; `docs/decisions.md` and a `DECISION:` issue remain the way to raise one.
+  or pings Michael; a `DECISION:` issue remains the way to raise one ("Asking", above).
 - **Reactions and replies** to another agent's post are allowed, sparingly, when you have a fact it needs (a conflict
   you saw coming, a test it broke, a line out of register). One short thread reply, never a conversation; never
@@ -266,8 +300,10 @@ Every session follows them in new code; the Opus follow-up in backlog K moves th
 ## Roles
 - Michael makes the design calls; Claude flags risks and asks when the design is open.
-- The team for 2.0 (14 Oct 2026; the plan is `docs/design/v2-scope.md`): the look builder makes places (auto/backlog), the bodies
-  builder makes people, foes, animals and what they wear (auto/bodies), the systems builder makes rules and the core loop
-  (auto/systems), QA keeps the suite, CI and the budgets (auto/qa, tests only), the designer writes build sheets and proposals, and
-  the critic, the quest writer, the concept artist and the producer as before.
+- The team for 2.0 (14 Oct 2026; the plan is `docs/design/v2-scope.md`), by lane (the branch prefix, "A routine's run"):
+  the look builder makes places (`look`), the bodies builder makes people, foes, animals and what they wear (`bodies`), the
+  systems builder makes rules and the core loop (`systems`), QA keeps the suite, CI and the budgets (`qa`, tests only), the
+  quest writer drafts and builds what Michael approves (`quests`, `quests-build`), the designer writes build sheets and
+  proposals (`design`), the critic plays (`critic`), the concept artist prototypes (`concept`), and the producer carries
+  questions and answers (`producer`).
 - Cross-cutting rewrites (roads, terracing, rivers, skills-by-use, splitting this file, the new look's F cards) are deep-work
   sessions (Opus; "fable" survives only as an identifier: the board's `fable` collection, `auto/fable-<id>`, `Fable:` PR titles).
@@ -275,4 +311,3 @@ Every session follows them in new code; the Opus follow-up in backlog K moves th
 - A deep-work session runs from a card on the control room (the routine "Old Gates — Deep Work session", every hour at :40):
   Michael taps Start (2.0's cards, which he approved on 13 Oct, are queued by the producer without one), the next run takes the card, works on `auto/fable-<id>`, raises its questions as decisions and stops until
-  they are answered, and its PR is approved like any other. While an open issue's title begins `FREEZE:`, the code builders end their runs at once (or keep to their prototypes);
-  the producer opens it when a deep-work card rewrites shared files and closes it when that PR merges.
+  they are answered, and its PR lands like any other. Its `FREEZE:` issue is "A routine's run"'s freeze.
~~~~
