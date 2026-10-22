Card F13's old saves (Session 1293), loaded by `tests/oldsaves`. Each file is `_buildSavePayload()` as main wrote it at
66d10254 (15 Oct 2026, before F2a's rooms at true size and F10's genome; the old look, r128): a character named Orlaith, level 1,
a look with no `hb`, saved in Dunmore's street (`street`), mid-room in Lorcan's Forge (`shop`, `g_dunmore_2`, an 11 × 12 room in
the old unit) and in a corner of Tadhg's House (`home`, `g_dunmore_15`). Made by booting that commit's own `tests/lib/game.mjs`
from a worktree, `intoWorld`, `settle('dunmore')`, `goToInterior` and a free spot found with `intSolidAt`. Kept on purpose.
