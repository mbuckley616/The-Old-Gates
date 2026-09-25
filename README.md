# The Old Gates

A browser-based open-world RPG in one HTML file. Open `index.html` — or the GitHub Pages URL — and play.

- `index.html` — the game (three.js r128 from cdnjs is the only external dependency)
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
