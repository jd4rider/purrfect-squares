# Level generation

`src/puzzle/generator.js` turns a seed into either a verified puzzle or `null`.
Nothing is published on trust.

## Pipeline

1. **Mask** — `makeMask(width, height, shape, rng)` starts from a full box and
   carves a silhouette: `rect`, `l`, `t`, `z`, `stairs`, `cross`, `u` or `blob`.
2. **Partition** — `partition()` grows random rectangles from random free cells
   until the mask is covered. 1×1 slivers are heavily discouraged (they are dull
   and ambiguity-prone), and rectangles are capped at 12 cells.
3. **Cats** — one cat per rectangle, placed on a random cell inside it, with a
   coat colour. Its number is the rectangle's area.
4. **Verify** — `countSolutions(level, { limit: 2 })`. Accept only `count === 1`
   and `truncated === false`. Ambiguous or budget-exhausted boards are discarded
   and the attempt counter advances.
5. **Difficulty** — `evaluateDifficulty(level, stats)` scores cat count,
   candidate richness per cat, board irregularity (playable ÷ bounding box) and
   maximum branching, then maps it to 1–5.

## Determinism

`rngFor(seed)` is mulberry32 seeded by an FNV-1a hash of the seed string. The
same seed, size, shape and options always produce the same `mask`, `cats` and
`solution` — which is why the daily puzzle needs no shipped table and why
`npm test` can assert determinism.

## Baking the catalogue

```bash
npm run bake
```

`scripts/bake-levels.mjs` builds 200 spec entries (eight chapters of 25, growing
from 4×4 to 8×7, mixing rectangular and irregular silhouettes) and writes
`src/levels/data.js`. Each entry stores:

```js
{ id, name, chapter, theme, width, height, mask, cats, difficulty, seed, solution }
```

The solution is kept because hints and the completion check both benefit from a
known-good partition. It is not displayed to the player.

The bake is fast (under a second for all 200 boards), so it is safe to re-run
after tuning. Any board that fails verification aborts the script rather than
being silently skipped.

## Generated modes

Daily, Zen and Unlimited call `generatePuzzle` at runtime with smaller targets
and tighter budgets. If generation ever fails, `src/levels/index.js` falls back
to a Journey board so a mode can never dead-end; that fallback is marked in the
returned object.

## Honest limits

Uniqueness is proven by exhaustive search within the node budget, so it is a
proof for these board sizes (≤ 13 cats, ≤ 80 cells). The difficulty score is a
heuristic, not a measure of human solving effort; the catalogue was tuned by
looking at the distribution of branch points and irregularity.
