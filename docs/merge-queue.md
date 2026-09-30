# Merge queue

Michael's merge approvals, one per line, written by the producer: `<branch> <commit> merge` (merged once that
commit's CI is green) or `<branch> <commit> merge-anyway` (his call to merge despite red CI). The `merge` workflow
(.github/workflows/merge.yml) reads this file every 10 minutes, merges the named commit
(never the branch head) onto main, and skips a line already on main. The producer drops a line once it is merged.

auto/critic 2df57a3d1b1ebf41a69d94a523cf5530bb241379 merge
auto/backlog 4ab9a6c8a2702bb7863cbd5dd44b4606566368c0 merge
