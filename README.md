# The Old Gates

A browser-based open-world RPG in plain HTML and JavaScript, no build step. Open `index.html` — or the GitHub Pages URL — and play.

- `index.html` and `js/` — the game: the page, and its code in 33 plain script files loaded in order (three.js r128 from cdnjs is the only external dependency). A downloaded copy needs the folder, not the one file.
- `docs/devlog.md` — the session log; `docs/backlog.md` — what's next
- `tests/` — headless-browser verification: `npm install && npm test`
- `CLAUDE.md` — how work on this repo is done

## Running the tests
```
npm install            # playwright + a chromium
npm test               # every suite
node tests/run.mjs weather   # one suite
python3 scripts/parsecheck.py
```
Screenshots the tests take land in `tests/out/` (ignored by git).
