# Getting this repo onto GitHub and into Claude Code

Everything below is done once. ~10 minutes.

## 1. Create the empty repository on GitHub
On github.com: **New repository** → name `the-old-gates` → Private (or Public if you want the Pages URL to be
public) → **do not** add a README, .gitignore or licence (this bundle already has them) → Create.

## 2. Push this bundle
Unpack the bundle somewhere permanent (not Downloads), then in a terminal:
```
cd the-old-gates
git remote add origin git@github.com:YOUR-USER/the-old-gates.git   # or the https URL GitHub shows you
git push -u origin main
```
If git asks who you are first:
```
git config user.name "Michael"
git config user.email "you@example.com"
```

## 3. Add the two docs that aren't in the bundle
`lore_canon.md` and `quest_writing.md` live on your machine, not in any chat. Copy them into `docs/` and commit:
```
cp ~/wherever/lore_canon.md ~/wherever/quest_writing.md docs/
git add docs && git commit -m "Add lore canon and quest writing docs" && git push
```

## 4. Turn on GitHub Pages (optional, gives you a play URL)
Repo → Settings → Pages → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.
A minute later `https://YOUR-USER.github.io/the-old-gates/` serves `index.html`.
(Pages on a private repo needs a paid GitHub plan; on a free plan make the repo public or skip this.)

## 5. Claude Code
Install it if you haven't (https://docs.claude.com/en/docs/claude-code), then:
```
cd the-old-gates
claude
```
It reads `CLAUDE.md` on start. A first session might be: *"Read the last devlog entry and the backlog, then run
`npm install` and `npm test` and tell me what passes."*

## 6. The tests locally (once)
```
npm install         # playwright, and it downloads a chromium (~150 MB)
npm test
```
CI runs the same on every push (`.github/workflows/check.yml`); the Actions tab shows the result.

## What changes day to day
- No more uploading and downloading the HTML file. Claude Code edits `index.html` in place and commits.
- Playtest notes go in `docs/playtest.md` as you play; Claude works the list.
- When a bug depends on your world, **export the character** (Load tab → Export) and drop the `.json` into
  `tests/fixtures/` — Claude can then load your exact save headless.
