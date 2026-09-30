# Merge queue

Michael's merge approvals, one per line, written by the producer: `<branch> <commit> merge` (merged once that
commit's CI is green) or `<branch> <commit> merge-anyway` (his call to merge despite red CI). The `merge` workflow
(.github/workflows/merge.yml) reads this file every 10 minutes, merges the named commit
(never the branch head) onto main, and skips a line already on main. The producer drops a line once it is merged.

auto/producer 2fb9592030ce3d789e27955d47c72284b04b3938 merge
auto/quests 76e00cbd5bc15c5a0d57761ca87165e299bd8ccf merge
auto/concept 7bcf2e34c6247682fc68849195a13a4ae7334b67 merge
