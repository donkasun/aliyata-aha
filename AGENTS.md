## Learned User Preferences

- Squash-merge PRs into `main`; feature branches use the `feat/<name>` naming convention.
- Commit messages must have no duplicate `Co-Authored-By` or `Made-with: Cursor` tags — keep at most one co-author line at the end.
- `main` is the primary branch; rename `master` → `main` and set it as default on both local and GitHub.
- Music and sound files (`music/`, `sounds/`) are intentionally tracked in git; do not remove or gitignore them.
- Debug mode must be fully stripped for production (not just toggled off via a flag).
- Default audio volume is 20% for all devices — do not apply device-specific overrides.
- iOS Safari ignores `audio.volume`; handle this with a UI note rather than JS volume control.
- Instructions/how-to overlay should appear on every page load, not gated behind `localStorage`.
- Keyboard-triggered game actions should also be clickable on canvas (mouse fallback parity).
- Use `document.activeElement?.tagName === 'INPUT'` guard in global `keydown` listeners to prevent game keys from firing while a text input is focused.

## Learned Workspace Facts

- Project: **Aliyata Aha** (`donkasun/aliyata-aha`) — browser-based Sri Lankan Avurudu game, vanilla JS, no build system.
- GitHub public repo: `https://github.com/donkasun/aliyata-aha`; default branch is `main`.
- Local dev server runs on **port 8080** (plain HTTP server, no framework).
- Tech stack: vanilla JS + HTML/CSS canvas game, Firebase Hosting, Firestore (leaderboard), Firebase Anonymous Auth (player identity).
- Canvas is 1024×640 and may scale via CSS; use `canvasCoords(e)` helper that accounts for CSS scaling when mapping mouse events to canvas pixels.
- Files that must NOT be committed: `.firebase/` (build cache), `docs/superpowers/` (AI agent plans), `public/` (old deploy artifact).
- `docs/PRD.md` and `elephant.jpeg` are intentional tracked project assets.
- Player uniqueness is based on Firebase anonymous UID, not display name; name uniqueness must be checked with a Firestore query before submission.
- Score formula: `accuracy = max(0, 1000 − distance × 5)` + `speedBonus = max(0, (10 − min(timeTaken, 10)) × 10)`; max score is 1100.
