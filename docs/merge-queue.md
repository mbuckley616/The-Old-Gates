# Merge queue

Michael's merge approvals, one per line, written by the producer: `<branch> <commit> merge` (merged once that
commit's CI is green) or `<branch> <commit> merge-anyway` (his call to merge despite red CI). The `merge` workflow
(.github/workflows/merge.yml) reads this file every 10 minutes, merges the named commit
(never the branch head) onto main, and skips a line already on main. The producer drops a line once it is merged.

auto/producer 98ae66088428007dea72e7b7aa7babdea11e5c94 merge
auto/concept 71274355944810e1ce6022717c7587b5fb7df428 merge
