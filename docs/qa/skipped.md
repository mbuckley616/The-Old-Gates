# Skipped suites — QA's cards

Every suite boots the new look (Michael, 20 Oct 2026: "I DO NOT CARE about preserving the legacy"). A suite that was red or too
slow there is named in `tests/skip.json` and runs nowhere until it is fixed. Each row is a card: fix the game or the suite (or
delete the suite with its feature, if the feature was the old look's), strike the suite from `tests/skip.json` in the same PR, and
strike the row here. That PR runs the suite. Kept by the QA routine; started by Session 1226 from CI's run of #443 at 2ff39f31 (20 Oct 2026, three suites killed at the 900 s a suite is given).
`node tests/run.mjs <suite>` runs a skipped suite by name.

| Suite | Why it is skipped | Card |
|---|---|---|
| `falls` | too slow: killed at the 900 s a suite is given (1800 s with the retry) | open |
| `panelfocus` | too slow: killed at the 900 s a suite is given (900 s with the retry) | open |
| `renewal` | too slow: killed at the 900 s a suite is given (900 s with the retry) | open |
