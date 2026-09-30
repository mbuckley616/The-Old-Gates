# Merge queue

Michael's merge approvals, one per line, written by the producer: `<branch> <commit> merge` (merged once that
commit's CI is green) or `<branch> <commit> merge-anyway` (his call to merge despite red CI). The `merge` workflow
(.github/workflows/merge.yml) reads this file every 10 minutes, merges the named commit
(never the branch head) onto main, and skips a line already on main. The producer drops a line once it is merged.

auto/backlog 0eccdaf56dd1a78aa497a9e3889ebdf7e6d934b0 merge
auto/systems 51068014ceeb2c0e9de8e1aa43a8cb07da0c86f7 merge
