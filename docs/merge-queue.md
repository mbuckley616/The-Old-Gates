# Merge queue

Michael's merge approvals, one per line, written by the producer: `<branch> <commit> merge` (merged once that
commit's CI is green) or `<branch> <commit> merge-anyway` (his call to merge despite red CI). The `merge` workflow
(.github/workflows/merge.yml) reads this file every 10 minutes, merges the named commit
(never the branch head) onto main, and skips a line already on main. The producer drops a line once it is merged.

auto/producer 3369104ec40ed00125f946789aa1e36608b862d3 merge
auto/critic ac0d5e27e90cc6f9d63f5e00c53ef090f72f41e4 merge
auto/quests 493813a76c2ad4e7f041d13ae84c2ad9a21e486f merge
