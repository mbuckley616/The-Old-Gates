# Merge queue

Michael's merge approvals, one per line, written by the producer: `<branch> <commit> merge` (merged once that
commit's CI is green) or `<branch> <commit> merge-anyway` (his call to merge despite red CI). The `merge` workflow
(.github/workflows/merge.yml) reads this file on every push here and every 15 minutes, merges the named commit
(never the branch head) onto main, and skips a line already on main. The producer drops a line once it is merged.

auto/systems 5633fc48bf61b7a57efab2953f5036ca0602463f merge
auto/backlog 87cc819031625afb2afc1717d63e4f789bae6e1c merge
