# Concept art — the catalogue

Michael's concept art (made with ChatGPT from the concept art brief, October 2026) lives in Google Drive, in the folder *The Old Gates* (`01_Originals/`, by topic, as full-size JPEGs). Nothing full-size is kept in the repo. This folder holds what the team works from:

- `catalogue.csv`: one row per image, keyed by its stable id (`OG-###`). Columns:
  - `drive_url`: the original in Drive (sessions without the Drive connector cannot open it; use the thumbnail).
  - `thumbnail`: a 480 px copy in `thumbs/`.
  - `review_status`: Michael's call, `KEEP`, `MAYBE` or `NO`. It reads `UNREVIEWED` until he has made it.
  - `claude_recommendation`: the intake's suggestion, to save him time. It is not a decision.
  - `sheet_or_frame`, `island`, `tags`: what the image is and where it belongs.
  - `ideas_to_keep`: the concrete things in it that the game could take, in plain words.
  - `notes`: conflicts with the canon, superseded passes, questions it raises.
- `thumbs/`: the 480 px copies.

Rules for using it:

- **Images are proposals, not specs.** Names, factions, numbers and text drawn inside an image were invented by the image generator (`decisions_and_canon.md` in the Drive folder says so too). The canon (`lore_canon.md`) wins; a conflict is noted in `notes` and, where it matters, raised in `decisions.md`.
- **Only `KEEP` rows feed the backlog.** An idea becomes a backlog item once Michael has kept the image it comes from. The item cites the image id.
- **Several passes of one subject are kept on purpose.** The refined pass is usually the one to keep; earlier passes are `MAYBE` for their details.

Intake: all 96 images, OG-001 to OG-096 (Session 755): batch 1 by hand, the rest by four parallel agents to the same format. Recommendations: 54 KEEP, 37 MAYBE, 5 NO.

Review: Michael marked all 96 on the review page (12 Oct 2026, Session 767): 62 KEEP, 32 NO, 2 MAYBE; he then dropped OG-015 and kept OG-094 with Tine redone as fire, so 63 KEEP and 33 NO. His marks are in `review_status`, and his note on OG-025 is in its `notes`. The kept images feed backlog L.

Second round (Session 771): Michael added *Concept Art Session 2* to the Drive folder, 16 sheets with his own ids OG-U2-001 to 016, in `01_Artwork/` under K_Equipment, L_Landmarks_Maps and M_Culture. They are catalogued as OG-097 to OG-112, in his order, with his id at the head of each row's notes, and a new folder, `08_Culture_Daily_Life`, for the festival, food and music sheets. Recommendations: 14 KEEP and 2 MAYBE (the Gatelands and Mark maps, whose names fight the canon). Michael kept all sixteen on the review page (12 Oct 2026), the two maps with a note: “Keep the shape of the island and the geography / regions. Anything that conflicts with Canon we can replace or repurpose.” Session 827 wrote the marks into `review_status` (they had stayed in the page's database a day) and folded the sheets into backlog L; it also re-quoted OG-107's notes, whose unquoted commas had split the row into fifteen columns. Two things to know: OG-U2-001 is filed as *Jewelry and Relics* but the sheet is H2, *Rare Alchemical Specimens*, so the jewelry sheet may be missing; and OG-U2-009, *The Six Gates*, raised a question for Michael, answered A: six great gates above the many lesser ones (decisions.md).

New images: give them the next ids (OG-113 on), add rows and thumbnails the same way, and add them to `review.html`'s data before republishing it to the same artifact. The marks already made stay in its database.
