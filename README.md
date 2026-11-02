# Purrfect Squares

A cozy, untimed cat logic puzzle for [Little Joy Arcade](https://littlejoyarcade.site).

Every cat shows a number. Draw a rectangle that contains that cat and has
exactly that many squares. Cover every tile of the wooden board, and the puzzle
is done. No timer, no lives, no move limit, unlimited undo and three-stage
hints.

- Play: <https://jd4rider.github.io/purrfect-squares/play/>
- 200 Journey boards across 8 chapters, every one checked for a single solution
- Daily Catnap (one shared board per UTC date), Zen, Expert and Unlimited modes
- Five unlockable themes, ten badges, versioned local saves that sync through the
  Little Joy account client

## Development

```bash
npm install
npm run dev        # vite dev server on :5173
npm test           # engine tests (rules, solver, generator, history)
npm run build      # production build into dist/
npm run bake       # regenerate src/levels/data.js (200 verified boards)
```

## How it is put together

```
src/
  puzzle/            pure rules — no Phaser, no storage
    model.js         grid, rectangle validation, completion, candidates
    solver.js        bounded backtracking solution counter + hints
    generator.js     seeded masks, rectangle partition, difficulty
    history.js       snapshot undo/redo, save sanitising
  levels/
    data.js          baked, unique-solution verified Journey catalogue
    index.js         chapters plus daily/zen/expert/unlimited generation
  phaser/            presentation only: scenes, wooden tray, cat figurines
  progress.js        stars, unlocks, achievements (pure)
  save.js            localStorage around progress.js
  sound.js           synthesised audio, no asset files
scripts/
  bake-levels.mjs    builds and verifies the catalogue
  smoke.mjs          headless Chrome play-through of level 1
```

The puzzle never trusts the renderer: `isComplete()` walks the integer grid, so
a tween cannot make a wrong board look solved. The solver is the same code the
generator uses to reject ambiguous boards, and hints come from the stored,
validated solution rather than from a guess.

## Docs

- [GAME_DESIGN.md](GAME_DESIGN.md) — loop, modes, progression, themes
- [PUZZLE_RULES.md](PUZZLE_RULES.md) — exact validation and completion rules
- [GENERATOR.md](GENERATOR.md) — generation, uniqueness, difficulty
- [ARCADE_INTEGRATION.md](ARCADE_INTEGRATION.md) — account client, saves, entitlements
- [DEPLOYMENT.md](DEPLOYMENT.md) — Pages deploy, `/play/` route, release checks
