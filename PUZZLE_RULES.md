# Puzzle rules

The rules live in `src/puzzle/model.js` and are pure functions over the integer
grid. Rendering reads their results; it never decides them.

## Board

A level is a `width × height` box plus a mask of rows. `#` is a playable cell,
`.` is a hole. `gridOf(level)` caches the playable index set, the cell list and
the cat-by-cell lookup, so a board is never re-parsed per frame.

## Placement validation

`validatePlacement(level, existing, candidate)` returns `{ ok: true }` or
`{ ok: false, error, message }`. Checks run in this order:

1. `INVALID_RECTANGLE` — integer coordinates, width and height ≥ 1.
2. `WRONG_AREA` — `width × height` must equal the cat's number.
3. `MISSING_CAT` — the rectangle must contain its own cat.
4. `OUT_OF_BOUNDS` — every cell must be inside the board and playable.
5. `MULTIPLE_CATS` — no other cat may sit inside the rectangle.
6. `OVERLAP` — no cell may already be covered by another cat's rectangle.

Re-placing a cat's own rectangle is allowed: the UI excludes the cat's previous
placement before validating, which is what makes resizing a rectangle painless.

## Completion

`isComplete(level, placements)` is true only when:

- there is exactly one placement per cat (duplicate cat ids are rejected),
- each placement passes validation,
- the union of all placements covers every playable cell exactly once.

Because the areas must sum to the playable cell count, the solver can prune with
a single arithmetic check: `free cells === area still to place`.

## Solver

`countSolutions(level, { limit: 2, maxNodes })` enumerates candidate rectangles
per cat once, then backtracks choosing the **most constrained cat** (fewest
non-overlapping candidates) at every node. It:

- tracks occupancy in a flat `Int8Array` (−1 hole, 0 free, 1 covered),
- stops as soon as `limit` solutions exist,
- reports `truncated` when the node budget is hit instead of pretending to know.

`truncated` boards are rejected by the generator. A puzzle is only shipped when
the solver proves exactly one solution.

## Hints

`mostConstrainedCat(level, placements)` picks the unplaced cat with the fewest
remaining candidate rectangles. The scene then escalates:

1. pulse the cat and name it as the tightest next step,
2. state the required `width × height`,
3. place the stored solution rectangle for that cat.

The stored solution came from the same generation run that the solver verified,
so a hint cannot invent a rectangle that breaks the puzzle.
