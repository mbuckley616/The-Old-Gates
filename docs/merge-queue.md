# Merge queue

Michael's merge approvals, one per line, written by the producer: `<branch> <commit> merge` (merged once that
commit's CI is green) or `<branch> <commit> merge-anyway` (his call to merge despite red CI). The `merge` workflow
(.github/workflows/merge.yml) reads this file every 10 minutes, merges the named commit
(never the branch head) onto main, and skips a line already on main. The producer drops a line once it is merged.

auto/design d02c81950d8a8b1d7be15c605cb3172ebbd7078d merge
auto/producer ab5353e2fb38b469db87c7210cff4b5f43362a18 merge
