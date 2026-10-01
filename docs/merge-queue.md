# Merge queue

Michael's merge approvals, one per line, written by the producer: `<branch> <commit> merge` (merged once that
commit's CI is green) or `<branch> <commit> merge-anyway` (his call to merge despite red CI). The `merge` workflow
(.github/workflows/merge.yml) reads this file every 10 minutes, merges the named commit
(never the branch head) onto main, and skips a line already on main. The producer drops a line once it is merged.

auto/producer 60ca54635d46d9afc0dc82dedaa7a08f8ca5f507 merge
auto/critic 6d904b7dc980419de2400d1b34dbea37f396b270 merge
