# Merge queue

Michael's merge approvals, one per line, written by the producer: `<branch> <commit> merge` (merged once that
commit's CI is green) or `<branch> <commit> merge-anyway` (his call to merge despite red CI). The `merge` workflow
(.github/workflows/merge.yml) reads this file every 10 minutes, merges the named commit
(never the branch head) onto main, and skips a line already on main. The producer drops a line once it is merged.

auto/design d3d8a9cf663780cc611882f41b3e60fc3d0a829f merge
