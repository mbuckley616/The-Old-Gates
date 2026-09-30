# Merge queue

Michael's merge approvals, one per line, written by the producer: `<branch> <commit> merge` (merged once that
commit's CI is green) or `<branch> <commit> merge-anyway` (his call to merge despite red CI). The `merge` workflow
(.github/workflows/merge.yml) reads this file every 10 minutes, merges the named commit
(never the branch head) onto main, and skips a line already on main. The producer drops a line once it is merged.

auto/systems 5633fc48bf61b7a57efab2953f5036ca0602463f merge
auto/producer 4a8c2f12ab4d8617ac0dbc87df779758114149f0 merge
auto/quests 76e00cbd5bc15c5a0d57761ca87165e299bd8ccf merge
